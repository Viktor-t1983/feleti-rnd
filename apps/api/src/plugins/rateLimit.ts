import rateLimit, { RateLimitPluginOptions } from '@fastify/rate-limit';
import { FastifyPluginAsync, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { RATE_LIMIT_CONFIG } from '../config/security.config';

const rateLimitPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(rateLimit, {
    ...RATE_LIMIT_CONFIG,
    skipOnError: false, // Don't skip rate limiting on Redis/connection errors
    ban: 10, // Ban after 10 consecutive rate limit violations
    skip: (req: FastifyRequest) => {
      // Skip rate limiting for health check endpoint
      if (req.url?.startsWith('/health')) return true;
      // Skip rate limiting for localhost (development)
      const ip = req.ip || req.headers['x-forwarded-for'];
      if (typeof ip === 'string' && (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('172.')))
        return true;
      return false;
    },
  } as RateLimitPluginOptions); // Use type assertion because skip may not be in RateLimitPluginOptions
};

export default fp(rateLimitPlugin, {
  name: 'rateLimit',
});
