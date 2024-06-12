import fastifyPlugin from 'fastify-plugin';
import { UAParser } from 'ua-parser-js';

export type UserAgent = {
    browser: string | undefined;
    device: string | undefined;
    os: string | undefined;
};

declare module 'Fastify' {
    interface FastifyRequest {
        userAgent: UserAgent;
    }
}

export default fastifyPlugin(async app => {
    app.decorate('userAgent', null);

    app.log.debug('Registering userAgent plugin');

    app.addHook('preHandler', async function (request, reply) {
        const uap = new UAParser(request.headers['user-agent']);
        const browser = uap.getBrowser();
        const device = uap.getDevice().toString();
        const os = uap.getOS();

        const browserString =
            browser.toString() === 'undefined' ? undefined : browser.toString();
        const osString =
            os.toString() === 'undefined' ? undefined : os.toString();
        const deviceString =
            device.toString() === 'undefined' ? undefined : device.toString();

        request.userAgent = {
            browser: browserString,
            os: osString,
            device: deviceString,
        };
    });
});
