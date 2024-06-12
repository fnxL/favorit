import fastifyPlugin from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import config from '@config';

export default fastifyPlugin(async app => {
    app.log.debug('Registering cookies.');
    app.register(fastifyCookie, {
        secret: 'secret',
        parseOptions: {
            path: '/',
            httpOnly: config.get('app.cookie.httpOnly'),
            secure: config.get('app.cookie.secure'),
        },
    });
});
