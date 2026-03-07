import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';

import { AppError } from '../errors';
import type { Logger } from '../utils/logger';

interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

// Dynamically import logger to avoid circular dependencies during TypeScript compilation
let loggerInstance: Logger | null = null;

const getLogger = async (): Promise<Logger> => {
  if (!loggerInstance) {
    const loggerModule = await import('../utils/logger');
    loggerInstance = loggerModule.logger || loggerModule.default;
  }
  return loggerInstance;
};

declare module 'fastify' {
  interface FastifyInstance {
    handleErrors: (error: Error, request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

function errorHandlerPlugin(fastify: FastifyInstance): void {
  // Register the error handler as a decorator
  fastify.decorate(
    'handleErrors',
    async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      const logger = await getLogger();

      // Log the error with context
      if (error instanceof AppError) {
        logger.error(
          {
            err: error,
            reqId: request.id,
            url: request.url,
            method: request.method,
            statusCode: error.statusCode,
            code: error.code,
            details: error.details,
          },
          `Application error: ${error.message}`
        );
      } else {
        // Log unexpected errors
        logger.error(
          {
            err: error,
            reqId: request.id,
            url: request.url,
            method: request.method,
          },
          `Unexpected error: ${error.message}`
        );
      }

      // Determine if we should include stack trace
      const isProduction = process.env['NODE_ENV'] === 'production';
      const includeStack = !isProduction;

      // Handle the response based on error type
      // Check for rate limit errors (statusCode 429)
      const errWithStatus = error as { statusCode?: number };
      if (errWithStatus.statusCode === 429) {
        const errorResponse: ErrorResponse = {
          code: 'RATE_LIMIT_EXCEEDED',
          message: error.message || 'Too many requests, please try again later',
        };
        void reply.status(429).send({
          error: errorResponse,
        });
      } else if (errWithStatus.statusCode === 400 && error.message.includes('must match format')) {
        // Handle Fastify validation errors (format validation)
        const errorResponse: ErrorResponse = {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Invalid request data',
        };
        void reply.status(400).send({
          error: errorResponse,
        });
      } else if (error instanceof AppError) {
        const errorResponse: ErrorResponse = {
          code: error.code,
          message: error.message,
          details: error.details,
          stack: includeStack && error.stack ? error.stack : undefined,
        };
        void reply.status(error.statusCode).send({
          error: errorResponse,
        });
      } else {
        // For unexpected errors, send a generic 500 response
        const errorResponse: ErrorResponse = {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          stack: includeStack && error.stack ? error.stack : undefined,
        };
        void reply.status(500).send({
          error: errorResponse,
        });
      }
    }
  );

  // Catch-all error handler for unhandled errors
  fastify.setErrorHandler(async (error: Error, request: FastifyRequest, reply: FastifyReply) => {
    await fastify.handleErrors(error, request, reply);
  });
}

export const errorHandler = fp(errorHandlerPlugin, {
  name: 'errorHandler',
});
