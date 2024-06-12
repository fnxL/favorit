import fastifyPlugin from 'fastify-plugin';
import helmet from '@fastify/helmet';

export default fastifyPlugin(async app => {
    app.log.debug('Registering helmet.');
    app.register(helmet, {
        global: true,
    });
});
