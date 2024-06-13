import jwt, { JwtPayload } from 'jsonwebtoken';
import config from '@config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { UserJwtPayload } from '@modules/auth';

declare module 'fastify' {
    interface FastifyInstance {
        verifyJWT: (
            request: FastifyRequest,
            reply: FastifyReply,
        ) => Promise<void>;
    }

    interface FastifyRequest {
        user: UserJwtPayload;
    }
}

async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
    const authorization = request.headers.authorization;
    if (!authorization) {
        reply.unauthorized();
        return;
    }

    const token = authorization.split(' ')[1];

    jwt.verify(
        token,
        config.get('app.jwt.accessToken.secret'),
        (err, decoded) => {
            if (err) {
                reply.unauthorized();
                return;
            }
            request.user = decoded as UserJwtPayload;
        },
    );
}

export default verifyJWT;
