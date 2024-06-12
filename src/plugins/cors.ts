import cors from '@fastify/cors';
import fastifyPlugin from 'fastify-plugin';

export default fastifyPlugin(async app => {
    app.log.debug('Registering cors.');
    app.register(cors, {
        credentials: true,
        origin: '*',
    });
});
