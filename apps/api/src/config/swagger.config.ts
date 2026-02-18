import { FastifyDynamicSwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

/**
 * OpenAPI configuration for FELETI R&D Management System API
 */
export const swaggerConfig: FastifyDynamicSwaggerOptions = {
  mode: 'dynamic',
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'FELETI R&D Management System API',
      description: 'API для управления исследованиями и разработками в системе FELETI',
      version: '1.0.0',
      contact: {
        name: 'FELETI Development Team',
        email: 'dev@feleti.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.feleti.com',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints для аутентификации и управления пользователями',
      },
      {
        name: 'Health',
        description: 'Проверка работоспособности сервиса',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Введите JWT токен в формате: Bearer <token>',
        },
      },
    },
    externalDocs: {
      description: 'Документация проекта',
      url: 'https://docs.feleti.com',
    },
  },
};

/**
 * Swagger UI configuration
 */
export const swaggerUiConfig: FastifySwaggerUiOptions = {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
  staticCSP: true,
  transformStaticCSP: (header) => header,
  uiHooks: {
    onRequest: (_request: unknown, _reply: unknown, next: () => void) => {
      next();
    },
    preHandler: (_request: unknown, _reply: unknown, next: () => void) => {
      next();
    },
  },
  theme: {
    title: 'FELETI API Documentation',
    css: [
      {
        filename: 'theme.css',
        content: `
          .swagger-ui .topbar { background-color: #1a237e; }
          .swagger-ui .info .title { color: #1a237e; }
          .swagger-ui .btn.authorize { background-color: #1a237e; }
          .swagger-ui .btn.cancel { background-color: #dc3545; }
        `,
      },
    ],
  },
};
