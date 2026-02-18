import fastifyJwt, { FastifyJWT } from '@fastify/jwt';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';

import { JWT_CONFIG } from '../config/security.config';

export type JWTPayload = FastifyJWT['payload'];

export interface JWTPluginOptions {
  secret: string;
  refreshSecret?: string;
  cookie?: {
    accessTokenName?: string;
    refreshTokenName?: string;
    signed?: boolean;
  };
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      role?: string;
    };
    user: {
      userId: string;
      email: string;
      role?: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    generateAccessToken: (payload: JWTPayload) => string;
    generateRefreshToken: (payload: JWTPayload) => string;
    verifyRefreshToken: (token: string) => JWTPayload;
  }
}

async function jwtPlugin(fastify: FastifyInstance, options: JWTPluginOptions): Promise<void> {
  const secret = options.secret || JWT_CONFIG.secret;
  const refreshSecret = options.refreshSecret || JWT_CONFIG.refreshSecret;

  // Cookie plugin is already registered by the server
  // Register JWT plugin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
  await fastify.register(fastifyJwt as any, {
    secret,
    cookie: {
      cookieName: options.cookie?.accessTokenName || 'access_token',
      signed: options.cookie?.signed || false,
    },
    sign: {
      expiresIn: JWT_CONFIG.expiresIn,
      issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
      audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
    },
    verify: {
      issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
      audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
    },
  });

  // Helper to generate access token
  fastify.decorate('generateAccessToken', function (this: FastifyInstance, payload: JWTPayload): string {
    return this.jwt.sign(payload);
  });

  // Helper to generate refresh token (with separate secret) using jsonwebtoken
  fastify.decorate('generateRefreshToken', function (this: FastifyInstance, payload: JWTPayload): string {
    return jwt.sign(payload, refreshSecret, {
      expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '30d',
      issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
      audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
    } as jwt.SignOptions);
  });

  // Helper to verify refresh token using jsonwebtoken
  fastify.decorate('verifyRefreshToken', function (this: FastifyInstance, token: string): JWTPayload {
    try {
      return jwt.verify(token, refreshSecret, {
        issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
        audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
      } as jwt.VerifyOptions) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  });

  // Authentication decorator
  fastify.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
      await request.jwtVerify();
      // User is already attached to request by jwtVerify
    } catch (error) {
      void reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired access token',
      });
    }
  });

  // Add hook to attach user to request after JWT verification
  fastify.addHook('onRequest', async (_request: FastifyRequest, _reply: FastifyReply) => {
    // This hook runs for all requests
    // We'll let the authenticate decorator handle specific routes
  });
}

export default fp(jwtPlugin, {
  name: 'jwt',
  fastify: '5.x',
});
