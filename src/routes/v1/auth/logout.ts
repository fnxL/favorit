import { FastifyInstance } from 'fastify';

export default async function (app: FastifyInstance) {
    app.get('/logout', async function (request, reply) {
        const refreshToken = request.cookies.refreshToken;
        if (!refreshToken) {
            reply.status(204);
            return;
        }

        const authService = app.diContainer.resolve('authService');

        const foundSession = await authService.getSession(refreshToken);

        if (!foundSession) {
            reply.clearCookie('refreshToken').status(204);
            return;
        }

        await authService.logout(refreshToken);
        reply.clearCookie('refreshToken').status(204);

        return {
            success: true,
        };
    });
}
