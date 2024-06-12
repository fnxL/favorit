import { FastifyInstance, FastifySchema } from 'fastify';
import { LoginResponseSchema } from './login';

const schema: FastifySchema = {
    tags: ['Authentication'],
    summary: 'Get new accessToken',
    description: 'Issue a new accessToken using refreshToken',
    response: {
        200: LoginResponseSchema,
    },
};

export default async function (app: FastifyInstance) {
    app.addHook('preHandler', function (request, reply, done) {
        done();
    });

    app.get('/token', { schema }, async function (request, reply) {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            reply.unauthorized();
            return;
        }
        reply.clearCookie('refreshToken');

        const authService = app.diContainer.resolve('authService');

        const { newAccessToken, newRefreshToken } =
            await authService.getTokens(refreshToken);

        reply.setCookie('refreshToken', newRefreshToken, {
            maxAge: 24 * 60 * 60 * 1000,
        });

        return {
            success: true,
            accessToken: newAccessToken,
        };
    });
}
