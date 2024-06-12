import { FastifyInstance, FastifySchema } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { MINLENGTH } from '@constants/validations.js';

const LoginUserWithEmail = Type.Object({
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: MINLENGTH.PASSWORD }),
});
const LoginUserWithUsername = Type.Object({
    username: Type.String({ minLength: MINLENGTH.USERNAME }),
    password: Type.String({ minLength: MINLENGTH.PASSWORD }),
});

export const CredentialsSchema = Type.Union([
    LoginUserWithEmail,
    LoginUserWithUsername,
]);

export type Credentials = Static<typeof CredentialsSchema>;
