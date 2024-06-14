import jwt, { JwtPayload } from 'jsonwebtoken';
import argon2 from 'argon2';
import config from '@config';
import AuthRepository from './auth.repository';
import { Credentials } from './auth.dto';
import { UserAgent } from '@plugins/userAgent';
import { User, UserRepository } from '@modules/user/';
import {
    InvalidTokenError,
    InvalidUserNameOrPasswordError,
} from '@constants/errors.js';
import { UserSession } from './auth.model';
import { is } from 'drizzle-orm';

export type UserJwtPayload = Omit<User, 'passwordHash'>;

type RefreshTokenJwt = JwtPayload & {
    sessionId: string;
    user: UserJwtPayload;
};

class AuthService {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly authRepo: AuthRepository,
    ) {}

    async login(credentials: Credentials, userAgent: UserAgent) {
        let emailOrUsername: string;
        if (this.hasEmail(credentials)) emailOrUsername = credentials.email;
        else emailOrUsername = credentials.username;

        const foundUser = await this.userRepo.getUser(emailOrUsername);

        if (!foundUser) {
            throw new InvalidUserNameOrPasswordError();
        }

        await this.verifyPassword(foundUser.passwordHash, credentials.password);

        const { accessToken, refreshToken } = await this.createSessionAndTokens(
            foundUser,
            userAgent,
        );
        return { accessToken, refreshToken };
    }

    private async createSessionAndTokens(user: User, userAgent: UserAgent) {
        const session: UserSession = {
            userId: user.userId,
            ...userAgent,
        };
        const [newSession] = await this.authRepo.createSession(session);

        const refreshToken = await this.generateRefreshToken(
            newSession.sessionId,
            user,
        );
        const accessToken = await this.generateAccessToken(user);

        return { accessToken, refreshToken };
    }

    private async verifyPassword(digest: string, password: string) {
        const isMatch = await argon2.verify(digest, password);
        if (!isMatch) {
            throw new InvalidUserNameOrPasswordError();
        }
    }

    /**
     * Issues a new accessToken and refreshToken everytime
     * a user refreshes accessToken and detects reuse of refreshToken
     * (This is refresh token rotation)
     */
    async getTokens(refreshToken: string) {
        const foundSession = await this.authRepo.getSession(refreshToken);
        // if no sesion exist, that means the refreshToken does not exist anymore
        // and it's already been used and deleted
        // this is a re-use detection situation
        if (!foundSession) {
            await this.handleTokenReuse(refreshToken);
            throw new InvalidTokenError();
        }
        // We know the session exists, so the refresh token should be valid here
        try {
            jwt.verify(refreshToken, config.get('app.jwt.refreshToken.secret'));
            // at this point the refreshToken is valid
            // so generate new tokens
            const newRefreshToken = await this.generateRefreshToken(
                foundSession.sessionId,
                foundSession.user,
            );
            const accessToken = await this.generateAccessToken(
                foundSession.user,
            );

            return { accessToken, newRefreshToken };
        } catch (err) {
            // If an error occurs during verification, assume the token is expired
            await this.logout(refreshToken);
            console.error('Token expired', err);
            throw new InvalidTokenError();
        }
    }

    private async handleTokenReuse(refreshToken: string) {
        try {
            // we want to decode the token that we recieve
            // to match that with an existing user
            const { user } = jwt.verify(
                refreshToken,
                config.get('app.jwt.refreshToken.secret'),
            ) as RefreshTokenJwt;

            const compromisedUser = await this.userRepo.getUser(user.userId);

            if (compromisedUser) {
                console.warn(
                    'Token reuse detected! Logging out from all sessions',
                );
                await this.logoutAll(compromisedUser.userId);
                throw new InvalidTokenError();
            }

            // if we don't find a user, that means the token is malformed
            // and we can safely ignore it
            console.info(
                'Token reuse detected but no matching user found (potentially malformed token)',
            );
            // Consider logging the token for further investigation
            throw new InvalidTokenError();
        } catch (err) {
            console.info('Token reuse detected, but token is expired');
            throw new InvalidTokenError();
        }
    }

    async getSession(refreshToken: string) {
        return this.authRepo.getSession(refreshToken);
    }

    async logout(refreshToken: string) {
        return this.authRepo.deleteSession(refreshToken);
    }

    async logoutAll(userId: number) {
        return this.authRepo.deleteAllSessions(userId);
    }

    // type guard to check if credentials are email and password
    private hasEmail(
        credentials: Credentials,
    ): credentials is { email: string; password: string } {
        return (credentials as { email: string }).email !== undefined;
    }

    private async generateRefreshToken(
        sessionId: number,
        { passwordHash, ...user }: User,
    ) {
        const payload = {
            sessionId,
            user,
        };

        const token = jwt.sign(
            payload,
            config.get('app.jwt.refreshToken.secret'),
            {
                expiresIn: config.get('app.jwt.refreshToken.expiresIn'),
            },
        );
        // update this token in the session  (rotate refreshToken)
        await this.authRepo.updateSession(sessionId, {
            refreshToken: token,
        });

        return token;
    }

    private async generateAccessToken({ passwordHash, ...payload }: User) {
        const secretKey = config.get('app.jwt.accessToken.secret');
        const expiresIn = config.get('app.jwt.accessToken.expiresIn');

        return jwt.sign(payload, secretKey, { expiresIn });
    }
}

export default AuthService;
