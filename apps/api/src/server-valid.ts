import Fastify from 'fastify';

import { authRoutes } from './modules/auth/auth.routes';
import jwt from './plugins/jwt';
import swaggerPlugin from './plugins/swagger';
import { logger } from './utils/logger';

const fastify = Fastify({
  logger: false,
});

// Register plugins
// TODO: Fix cookie plugin registration - temporarily disabled
// fastify.register(cookie, {
//   secret: process.env.COOKIE_SECRET || 'your-cookie-secret-change-in-production',
// });

void fastify.register(jwt, {
  secret: process.env['JWT_SECRET'] || 'your-secret-key-change-in-production',
});

// Register Swagger documentation (без security плагинов)
void fastify.register(swaggerPlugin);

// Register auth routes
void fastify.register(authRoutes, { prefix: '/api/auth' });

// Health check
fastify.get('/health', () => {
  return { status: 'ok' };
});

fastify.get('/', () => {
  return {
    status: 'ok',
    service: 'FELETI R&D API',
    version: '1.0.0',
  };
});

const start = async (): Promise<void> => {
  try {
    const port = parseInt(process.env['PORT'] || '3001');
    const host = process.env['HOST'] || '0.0.0.0';
    await fastify.listen({ port, host });
    logger.info(`Server running on http://localhost:${port}`);
    logger.info(`Swagger documentation available at http://localhost:${port}/docs`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

void start();
