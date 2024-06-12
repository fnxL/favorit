import fastifyPlugin from 'fastify-plugin';
import database from '@db';
import { fastifyAwilixPlugin, diContainerClassic } from '@fastify/awilix';
import { Lifetime, asClass, asValue } from 'awilix';
import { UserRepository, UserService } from '@modules/user';

declare module '@fastify/awilix' {
    interface Cradle {
        db: typeof database;
        userRepository: UserRepository;
        userService: UserService;
    }
}

export default fastifyPlugin(async app => {
    app.log.debug('Registering awilix and DI containers.');
    app.register(fastifyAwilixPlugin, {
        disposeOnClose: true,
        disposeOnResponse: true,
        strictBooleanEnforced: true,
        injectionMode: 'CLASSIC',
    });

    diContainerClassic.register({
        db: asValue(database),
        userRepository: asClass(UserRepository, {
            lifetime: Lifetime.SINGLETON,
        }),
        userService: asClass(UserService, {
            lifetime: Lifetime.SINGLETON,
        }),
    });
});
