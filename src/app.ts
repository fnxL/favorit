import Fastify, { FastifyServerOptions } from 'fastify';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

async function init(opts: FastifyServerOptions) {
    const app = Fastify(opts).withTypeProvider<TypeBoxTypeProvider>();
    app.log.debug('Initializing server');

    app.get('/', async function (request, reply) {
        return {
            message: 'hi!',
        };
    });

    app.get('/error', async function (request, reply) {
        throw new Error('This is an error');
    });

    return app;
}

export default init;
