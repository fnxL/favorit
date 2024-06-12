import { MINLENGTH } from '@constants/validations';
import { Static, Type } from '@sinclair/typebox';

export const NewUserSchema = Type.Object({
    username: Type.String({ minLength: MINLENGTH.USERNAME }),
    fullName: Type.Optional(Type.String({ minLength: MINLENGTH.FULLNAME })),
    email: Type.Optional(
        Type.String({
            format: 'email',
        }),
    ),
    password: Type.String({ minLength: MINLENGTH.PASSWORD }),
});

export type NewUser = Static<typeof NewUserSchema>;
