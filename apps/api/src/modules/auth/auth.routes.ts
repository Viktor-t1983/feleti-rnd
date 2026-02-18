import rateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { RATE_LIMIT_AUTH_CONFIG } from '../../config/security.config';
import { ConflictError, ValidationError } from '../../errors';
import { authenticate } from '../../middlewares/authenticate';

import { loginBodySchema, LoginInput, registerBodySchema, RegisterInput } from './auth.schemas';
import * as authService from './auth.service';
import { PasswordResetService } from './password-reset.service';

// Extend Fastify types to include JWT plugin
declare module 'fastify' {
  interface FastifyInstance {
    jwt: {
      sign: (payload: Record<string, unknown>, options?: { expiresIn: string }) => string;
      verify: (token: string) => unknown;
    };
  }
}

// Define response schemas for Swagger documentation
const userResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string', format: 'email' },
    username: { type: 'string' },
    fullName: { type: 'string' },
  },
  required: ['id', 'email', 'username', 'fullName'],
};

const authResponseSchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        username: { type: 'string' },
        fullName: { type: 'string' },
        roleId: { type: 'string' },
        role: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['id', 'name'],
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
      required: ['id', 'email', 'username', 'fullName', 'roleId', 'role'],
    },
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
  },
  required: ['user', 'accessToken', 'refreshToken'],
};

const tokenRefreshResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
  },
  required: ['accessToken', 'refreshToken'],
};

const errorResponseSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
      required: ['message'],
    },
  },
  required: ['error'],
};

export function authRoutes(fastify: FastifyInstance): void {
  // POST /api/auth/register
  fastify.post(
    '/auth/register',
    {
      schema: {
        description: 'Register a new user',
        tags: ['Authentication'],
        // @ts-expect-error - Type compatibility issue between zod and zod-to-json-schema
        body: zodToJsonSchema(registerBodySchema, { name: 'RegisterBody' }) as Record<
          string,
          unknown
        >,
        response: {
          201: authResponseSchema,
          400: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const input = request.body as RegisterInput;
        const result = await authService.register(input);

        // Generate tokens using fastify.jwt
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const tokenPayload = {
          userId: result.user.id,
          email: result.user.email,
          role: result.user.role?.name,
        };

        const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '15m' });
        const refreshToken = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });

        return reply.status(201).send({
          user: result.user,
          accessToken,
          refreshToken,
        });
      } catch (error) {
        if (error instanceof ValidationError) {
          return reply.status(400).send({ error: { message: error.message } });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ error: { message: error.message } });
        }
        throw error;
      }
    }
  );

  // POST /api/auth/login
  // Rate limited to prevent brute force attacks
  fastify.register(async (instance) => {
    await instance.register(rateLimit, RATE_LIMIT_AUTH_CONFIG);

    instance.post(
      '/auth/login',
      {
        schema: {
          description: 'Login with email and password',
          tags: ['Authentication'],
          // @ts-expect-error - Type compatibility issue between zod and zod-to-json-schema
          body: zodToJsonSchema(loginBodySchema, { name: 'LoginBody' }) as Record<string, unknown>,
          response: {
            200: authResponseSchema,
            400: errorResponseSchema,
            401: errorResponseSchema,
          },
        },
      },
      async (request, reply) => {
        try {
          const input = request.body as LoginInput;
          const result = await authService.login(input);

          // Generate tokens using fastify.jwt
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const tokenPayload = {
            userId: result.user.id,
            email: result.user.email,
            role: result.user.role?.name,
          };

          const accessToken = fastify.jwt.sign(tokenPayload, { expiresIn: '15m' });
          const refreshToken = fastify.jwt.sign(tokenPayload, { expiresIn: '7d' });

          return reply.send({
            user: result.user,
            accessToken,
            refreshToken,
          });
        } catch (error) {
          if (error instanceof ValidationError) {
            return reply.status(401).send({ error: { message: error.message } });
          }
          throw error;
        }
      }
    );
  });

  // GET /api/auth/me (protected - requires JWT)
  fastify.get(
    '/auth/me',
    {
      preHandler: [authenticate],
      schema: {
        description: 'Get current authenticated user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        response: {
          200: userResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      return reply.send(request.user);
    }
  );

  // POST /api/auth/refresh
  fastify.post(
    '/auth/refresh',
    {
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string' },
          },
          required: ['refreshToken'],
        },
        response: {
          200: tokenRefreshResponseSchema,
          401: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { refreshToken } = request.body as { refreshToken: string };

        // Verify refresh token using fastify.jwt
        const payload = fastify.jwt.verify(refreshToken) as {
          userId: string;
          email: string;
          role: string;
        };

        // Generate new access token
        const newAccessToken = fastify.jwt.sign(
          {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
          },
          { expiresIn: '15m' }
        );

        // Return new access token (refresh token remains the same)
        return reply.send({
          accessToken: newAccessToken,
          refreshToken,
        });
      } catch (error) {
        return reply.status(401).send({ error: { message: 'Invalid refresh token' } });
      }
    }
  );

  // POST /auth/forgot-password
  fastify.post(
    '/auth/forgot-password',
    {
      schema: {
        description: 'Request password reset',
        tags: ['Authentication'],
        body: {
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
          },
          required: ['email'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body as { email: string };

      if (!email || !email.includes('@')) {
        return reply.code(400).send({
          error: { message: 'Введите корректный email' },
        });
      }

      const passwordResetService = new PasswordResetService();
      const result = await passwordResetService.requestReset(email);
      return reply.send(result);
    }
  );

  // GET /auth/validate-token/:token
  fastify.get(
    '/auth/validate-token/:token',
    {
      schema: {
        description: 'Validate password reset token',
        tags: ['Authentication'],
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              valid: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params as { token: string };

      const passwordResetService = new PasswordResetService();
      const isValid = await passwordResetService.validateToken(token);
      return reply.send({ valid: isValid });
    }
  );

  // POST /auth/reset-password
  fastify.post(
    '/auth/reset-password',
    {
      schema: {
        description: 'Reset password with token',
        tags: ['Authentication'],
        body: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            password: { type: 'string', minLength: 6 },
          },
          required: ['token', 'password'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { token, password } = request.body as { token: string; password: string };

      const passwordResetService = new PasswordResetService();

      try {
        const result = await passwordResetService.resetPassword(token, password);
        return reply.send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Ошибка сброса пароля';
        return reply.code(400).send({ error: { message } });
      }
    }
  );
}
