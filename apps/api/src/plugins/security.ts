import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { CORS_CONFIG, HELMET_CONFIG } from '../config/security.config';

const securityPlugin: FastifyPluginAsync = async (fastify) => {
  // Register Helmet for security headers
  // @ts-expect-error - Type mismatch between HelmetConfig and FastifyHelmetOptions
  await fastify.register(helmet, HELMET_CONFIG);

  // Register CORS
  await fastify.register(cors, CORS_CONFIG);
};

export default fp(securityPlugin, {
  name: 'security',
});
