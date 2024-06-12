import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import config from '@config';
import AuthRepository from './auth.repository';
import { Credentials } from './auth.dto';
import { UserAgent } from '@plugins/userAgent';
import { UserRepository } from '@modules/user/';
import {
    InvalidTokenError,
    InvalidUserNameOrPasswordError,
} from '@constants/errors.js';
import { UserSession } from './auth.model';

export type UserJwtPayload = {
    userId: number;
    fullName: string | null;
    username: string;
    email: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

type RefreshTokenJwtPayload = {
    sessionId: number;
    user: UserJwtPayload;
};

class AuthService {
    private userRepo: UserRepository;
    private authRepo: AuthRepository;

    constructor(
        userRepository: UserRepository,
        authRepository: AuthRepository,
    ) {
        this.userRepo = userRepository;
        this.authRepo = authRepository;
    }

    async login(credentials: Credentials, userAgent: UserAgent) {
        let emailOrUsername: string;
        if (this.hasEmail(credentials)) emailOrUsername = credentials.email;
        else emailOrUsername = credentials.username;

        // check if user exists with given username/email
        const user = await this.userRepo.getUser(emailOrUsername);
        if (!user) throw new InvalidUserNameOrPasswordError();

        // verify if user password matches with passwordHash in the db
        const passwordHash = await this.userRepo.getPasswordHash(user.userId);
        const isMatch = await argon2.verify(
            passwordHash!,
            credentials.password,
        );

        if (!isMatch) throw new InvalidUserNameOrPasswordError();

        // create a user session
        const session: UserSession = {
            userId: user.userId,
            ...userAgent,
        };
        const [newSession] = await this.authRepo.createSession(session);

        const refreshPayload: RefreshTokenJwtPayload = {
            sessionId: newSession.sessionId,
            user,
        };
        const refreshToken = await this.generateRefreshToken(
            newSession.sessionId,
            refreshPayload,
        );
        const accessToken = await this.generateAccessToken(user);

        return { accessToken, refreshToken };
    }

    /**
     * Issue a new accessToken and refreshToken everytime
     * a user refreshes accessToken
     * (This is refresh token rotation)
     */
    async getTokens(refreshToken: string) {
        const foundSession = await this.authRepo.getSession(refreshToken);

        // if no sesion exist, that means the refreshToken does not exist anymore
        // and it's already been used and deleted
        // this is a re-use detection situation
        if (!foundSession) {
            try {
                // we want to decode the token that we recieve
                // to match that with an existing user
                const { user } = jwt.verify(
                    refreshToken,
                    config.get('app.jwt.refreshToken.secret'),
                ) as RefreshTokenJwtPayload;

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
            const decoded = jwt.verify(
                refreshToken,
                config.get('app.jwt.refreshToken.secret'),
            );
            // at this point the refreshToken is valid
            // so generate new accessTokens and refreshTokens
            const payload: RefreshTokenJwtPayload = {
                sessionId: foundSession.sessionId,
                user: foundSession.user,
            };
            const newRefreshToken = await this.generateRefreshToken(
                foundSession.sessionId,
                payload,
            );
            const accessToken = await this.generateAccessToken(
                foundSession.user,
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
        payload: RefreshTokenJwtPayload,
    ) {
        const token = jwt.sign(
            payload,
            config.get('app.jwt.refreshToken.secret'),
            {
                expiresIn: config.get('app.jwt.refreshToken.expiresIn'),
            },
        );
        // update this token in the session
        this.authRepo.updateSession(sessionId, { refreshToken: token });
        return token;
    }

    private async generateAccessToken(payload: UserJwtPayload) {
        return jwt.sign(payload, config.get('app.jwt.accessToken.secret'), {
            expiresIn: config.get('app.jwt.accessToken.expiresIn'),
        });
    }
}

export default AuthService;
