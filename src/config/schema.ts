import convict from 'convict';

// Define a schema
const config = convict({
    env: {
        doc: 'The application environment.',
        format: ['production', 'development', 'test'],
        default: 'development',
        env: 'NODE_ENV',
    },
    app: {
        cookie: {
            httpOnly: {
                doc: 'HttpOnly cookie flag',
                default: true,
            },
            secure: {
                doc: 'Secure cookie flag',
                default: true,
            },
        },
        port: {
            doc: 'The port to listen to',
            format: 'port',
            default: 5000,
            env: 'PORT',
            arg: 'port',
        },
        jwt: {
            accessToken: {
                expiresIn: {
                    doc: 'Access token expiration time',
                    default: '30s',
                },
                secret: {
                    doc: 'JWT secret key for accessTokens',
                    format: '*',
                    default: 'accessTokenSecretKey',
                    env: 'ACCESS_TOKEN_SECRET',
                    arg: 'jwt_secret',
                },
            },
            refreshToken: {
                expiresIn: {
                    doc: 'Refresh token expiration time',
                    default: '1d',
                },
                secret: {
                    doc: 'JWT secret key for refreshTokens',
                    format: '*',
                    default: 'refreshTokenSecretKey',
                    env: 'REFRESH_TOKEN_SECRET',
                },
            },
        },
    },
    // admins: {
    //     doc: 'Users with write access, or null to grant full access without login.',
    //     format: Array,
    //     nullable: true,
    //     default: null,
    // },
});

export default config;
