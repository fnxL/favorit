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

        const findUser = await this.userRepo.getUser(emailOrUsername);

        if (!findUser) {
            throw new InvalidUserNameOrPasswordError();
        }

        await this.verifyPassword(findUser.passwordHash, credentials.password);

        const { accessToken, refreshToken } = await this.createSessionAndTokens(
            findUser,
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
     * Issue a new accessToken and refreshToken everytime
     * a user refreshes accessToken
     * (This is refresh token rotation)
     */
    async getTokens(refreshToken: string) {
        const findSession = await this.authRepo.getSession(refreshToken);

        // if no sesion exist, that means the refreshToken does not exist anymore
        // and it's already been used and deleted
        // this is a re-use detection situation
        if (!findSession) {
            try {
                // we want to decode the token that we recieve
                // to match that with an existing user
                const { user } = jwt.verify(
                    refreshToken,
                    config.get('app.jwt.refreshToken.secret'),
                ) as RefreshTokenJwt;

                // user compromised
                const compromisedUser = await this.userRepo.getUser(
                    user.userId,
                );
                if (!compromisedUser) {
                    console.log(
                        'Token reuse detected but no matching user found (malformed token)',
                    );
                    throw new InvalidTokenError();
                }
                // logout user from all devices/sessions
                console.log(
                    'Token reuse detected! Logging out from all sessions',
                );
                this.logoutAll(compromisedUser.userId);
                throw new InvalidTokenError();
            } catch (err) {
                console.log('Token reuse detected, but expired');
                throw new InvalidTokenError();
            }
        }
        // we have a non-compromised refreshToken here at this point
        try {
            jwt.verify(refreshToken, config.get('app.jwt.refreshToken.secret'));
            // at this point the refreshToken is valid
            // so generate new accessTokens and refreshTokens
            const newRefreshToken = await this.generateRefreshToken(
                findSession.sessionId,
                findSession.user,
            );
            const accessToken = await this.generateAccessToken(
                findSession.user,
            );
            return { accessToken, newRefreshToken };
        } catch (err) {
            await this.logout(refreshToken);
            console.log('Token was not malformed, but expired');
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
