import { NewUserSchema, NewUser } from '@modules/user';
import { FastifyInstance, FastifySchema } from 'fastify';
import { Type } from '@sinclair/typebox';
import Nullable from '@utils/Nullable';

export const SignUpResponseSchema = Type.Object({
    success: Type.Boolean(),
    user: Type.Optional(
        Type.Object({
            userId: Type.Number(),
            username: Type.String(),
            fullName: Nullable(Type.String()),
            email: Nullable(Type.String()),
            createdAt: Nullable(Type.String({ format: 'date-time' })),
            updatedAt: Nullable(Type.String({ format: 'date-time' })),
        }),
    ),
});

const schema: FastifySchema = {
    tags: ['User'],
    summary: 'Create a new user',
    description: 'Sign up a new user',
    body: NewUserSchema,
    response: {
        201: SignUpResponseSchema,
    },
};

export default async function (app: FastifyInstance) {
    app.post<{ Body: NewUser }>(
        '/signup',
        {
            schema,
        },
        async function (request, reply) {
            const userService = app.diContainer.resolve('userService');

            const [user] = await userService.createUser(request.body);

            reply.code(201);

            return {
                success: true,
                user,
            };
        },
    );
}
