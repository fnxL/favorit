import 'dotenv/config';
import { FastifyServerOptions } from 'fastify';
import config from '@config';
import init from './app.js';
import closeWithGrace from 'close-with-grace';

const opts: FastifyServerOptions = {
    logger: true,
};

// only show pretty logs if there is a human watching
if (process.stdout.isTTY) {
    opts.logger = {
        level: 'debug',
        transport: {
            target: 'pino-pretty',
            options: {
                translateTime: 'SYS:hh:MM:ss',
                colorize: 'true',
                ignore: 'hostname,pid',
            },
        },
    };
}

(async function () {
    const app = await init(opts);

    const closeListeners = closeWithGrace(async ({ err, signal }) => {
        if (err) {
            app.log.error({ err }, 'Server closing due to error');
        }
        await app.close();
    });

    app.addHook('onClose', async instance => {
        closeListeners.uninstall();
    });

    app.addHook('onReady', async () => {
        console.log(app.printRoutes());
    });

    try {
        await app.listen({ port: config.get('app.port') });
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
})();
