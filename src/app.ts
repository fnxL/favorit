import Fastify, { FastifyServerOptions } from 'fastify';
import autoLoad from '@fastify/autoload';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function init(opts: FastifyServerOptions) {
    const app = Fastify(opts).withTypeProvider<TypeBoxTypeProvider>();
    app.log.debug('Initializing server');

    app.register(autoLoad, {
        dir: join(__dirname, 'plugins'),
        forceESM: true,
    });

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
