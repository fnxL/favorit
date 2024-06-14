import fastifyPlugin from 'fastify-plugin';
import database from '@db';
import { fastifyAwilixPlugin, diContainerClassic } from '@fastify/awilix';
import { Lifetime, asClass, asValue } from 'awilix';
import { UserRepository, UserService } from '@modules/user';
import { AuthRepository, AuthService } from '@modules/auth';

declare module '@fastify/awilix' {
    interface Cradle {
        db: typeof database;
        userRepo: UserRepository;
        userService: UserService;
        authRepo: AuthRepository;
        authService: AuthService;
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
        userRepo: asClass(UserRepository, {
            lifetime: Lifetime.SINGLETON,
        }),
        userService: asClass(UserService, {
            lifetime: Lifetime.SINGLETON,
        }),
        authRepo: asClass(AuthRepository, {
            lifetime: Lifetime.SINGLETON,
        }),
        authService: asClass(AuthService, {
            lifetime: Lifetime.SINGLETON,
        }),
    });
});
