import fastifyPlugin from 'fastify-plugin';
import fastifySwagger from '@fastify/swagger';
import scalarDocs from '@scalar/fastify-api-reference';

export default fastifyPlugin(async app => {
    app.log.debug('Registering swagger.');
    app.register(fastifySwagger, {
        mode: 'dynamic',
        openapi: {
            openapi: '3.1.0',
            info: {
                title: 'Favorit',
                description:
                    'A self hosted application to collect and organize bookmarks.',
                version: '0.1.0',
            },
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            servers: [
                {
                    url: 'http://localhost:5000',
                    description: 'Development server',
                },
            ],
            tags: [
                {
                    name: 'Authentication',
                    description:
                        'Some endpoints are public, but some require authentication.',
                },
                {
                    name: 'User',
                    description: 'User related endpoints',
                },
            ],
            externalDocs: {
                url: 'https://swagger.io',
                description: 'Find more info here',
            },
        },
    });

    app.register(scalarDocs, {
        routePrefix: '/docs',
        configuration: {
            theme: 'default',
            title: 'Favorit API reference',
        },
    });
});
