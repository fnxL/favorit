import fastifyPlugin from 'fastify-plugin';
import fastifyAuth from '@fastify/auth';

export default fastifyPlugin(async app => {
    app.log.debug('Registering fastiy auth.');
    app.register(fastifyAuth);
});
