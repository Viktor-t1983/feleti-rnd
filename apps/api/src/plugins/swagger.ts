import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { FastifyPluginAsync } from 'fastify';

import { swaggerConfig, swaggerUiConfig } from '../config/swagger.config';

/**
 * Swagger plugin for Fastify
 *
 * Регистрирует документацию OpenAPI и Swagger UI по адресу /docs
 */
const swaggerPlugin: FastifyPluginAsync = async (fastify, _options) => {
  // Register Swagger for OpenAPI documentation
  await fastify.register(swagger, swaggerConfig);

  // Register Swagger UI for interactive documentation
  await fastify.register(swaggerUi, swaggerUiConfig);

  fastify.log.info('Swagger documentation available at /docs');
};

export default swaggerPlugin;
