import Fastify, { FastifyServerOptions } from 'fastify';
import autoLoad from '@fastify/autoload';
import verifyJWT from '@utils/verityJWT';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { join } from 'path';

async function init(opts: FastifyServerOptions) {
    const app = Fastify(opts).withTypeProvider<TypeBoxTypeProvider>();
    app.log.debug('Initializing server');

    app.register(autoLoad, {
        dir: join(__dirname, 'plugins'),
        forceESM: true,
    });

    app.decorateRequest('user', null).decorate('verifyJWT', verifyJWT);

    app.register(autoLoad, {
        dir: join(__dirname, 'routes'),
        routeParams: true,
        options: { prefix: '/api/' },
        forceESM: true,
    });

    app.get('/', async function (request, reply) {
        return {
            message: 'hi!',
            userAgent: request.userAgent,
        };
    });

    app.get('/error', async function (request, reply) {
        throw new Error('This is an error');
    });

    app.ready(() => {
        app.swagger();
        console.log(app.printRoutes());
    });

    return app;
}

export default init;
