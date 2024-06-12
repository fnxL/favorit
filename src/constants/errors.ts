import createError from '@fastify/error';

export const DuplicateUserError = createError(
    'DUPLICATE_USER_ERROR',
    'User already exists',
    400,
);

export const EmailAlreadyUsedError = createError(
    'EMAIL_ALREADY_USED_ERROR',
    'Email already used',
    400,
);

export const InvalidUserNameOrPasswordError = createError(
    'INVALID_USERNAME_OR_PASSWORD',
    'Invalid username/email or password',
    401,
);

export const InvalidTokenError = createError(
    'INVALID_TOKEN_ERROR',
    'Token expired or invalid',
    401,
);
