import Fastify from 'fastify';

// import { authRoutes } from './modules/auth/auth.routes'; // Not used

const fastify = Fastify({
  logger: true,
});

// Register auth routes without schema validation
void fastify.register((fastify) => {
  fastify.post('/api/auth/register', (_request, _reply) => {
    return { message: 'Register endpoint' };
  });
  fastify.post('/api/auth/login', (_request, _reply) => {
    return { message: 'Login endpoint' };
  });
  fastify.get('/api/auth/me', (_request, _reply) => {
    return { message: 'Me endpoint' };
  });
  fastify.post('/api/auth/refresh', (_request, _reply) => {
    return { message: 'Refresh endpoint' };
  });
  fastify.post('/api/auth/logout', (_request, _reply) => {
    return { message: 'Logout endpoint' };
  });
});

fastify.get('/health', () => {
  return { status: 'ok' };
});

const start = (): void => {
  void fastify.listen({ port: 3001, host: '0.0.0.0' });
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:3001`);
};

start();
