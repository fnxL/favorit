import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import config from '@config';
import AuthRepository from './auth.repository';
import { Credentials } from './auth.dto';
import { UserAgent } from '@plugins/userAgent';
import { UserRepository } from '@modules/user/';
import { InvalidUserNameOrPasswordError } from '@constants/errors.js';
import { UserSession } from './auth.model';

type UserJwtPayload = {
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

    async generateAccessToken(payload: UserJwtPayload) {
        return jwt.sign(payload, config.get('app.jwt.accessToken.secret'), {
            expiresIn: config.get('app.jwt.accessToken.expiresIn'),
        });
    }
}

export default AuthService;
