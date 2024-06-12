import { FastifyInstance, FastifySchema } from 'fastify';
import { Type } from '@sinclair/typebox';
import { CredentialsSchema, Credentials } from '@modules/auth';

export const LoginResponseSchema = Type.Object({
    success: Type.Boolean(),
    accessToken: Type.String(),
});

const schema: FastifySchema = {
    tags: ['Authentication'],
    summary: 'Login',
    description: 'Login with username and password to receive access token',
    body: CredentialsSchema,
    response: {
        200: LoginResponseSchema,
    },
};

export default async function (app: FastifyInstance) {
    app.post<{ Body: Credentials }>(
        '/login',
        {
            schema,
        },
        async function (request, reply) {
            const authService = app.diContainer.resolve('authService');

            const { accessToken, refreshToken } = await authService.login(
                request.body,
                request.userAgent,
            );

            reply.setCookie('refreshToken', refreshToken, {
                maxAge: 24 * 60 * 60 * 1000,
            });

            return {
                success: true,
                accessToken,
            };
        },
    );
}
