import sensible from '@fastify/sensible';
import fastifyPlugin from 'fastify-plugin';

// Defaults for Fastify that everyone can agree on™.
export default fastifyPlugin(async app => {
    app.log.debug('Registering sensible.');
    app.register(sensible);
});
