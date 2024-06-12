import { FastifyInstance, FastifySchema } from 'fastify';
import { SignUpResponseSchema } from './signup';

const schema: FastifySchema = {
    tags: ['User'],
    summary: 'Get user profile',
    description: "Get authenticated user's profile details",
    security: [
        {
            bearerAuth: [],
        },
    ],
    response: {
        200: SignUpResponseSchema,
    },
};

export default async function (app: FastifyInstance) {
    app.get(
        '/me',
        {
            preHandler: app.auth([app.verifyJWT]),
            schema,
        },
        async function (request, reply) {
            return {
                success: true,
                user: request.user,
            };
        },
    );
}
