/**
 * Prisma 7 configuration file
 * Database connection configuration moved from schema.prisma
 *
 * For PostgreSQL, the URL is passed directly to PrismaClient constructor
 * This file exports the database URL for use in PrismaClient initialization
 */

import { Prisma } from '@prisma/client';

// Database URL for PostgreSQL
export const databaseUrl =
  process.env['DATABASE_URL'] || 'postgresql://user:password@localhost:5432/feleti_db?schema=public';

// Configuration object with proper typing
export const prismaConfig: Prisma.PrismaClientOptions = {
  // PostgreSQL database URL
  datasourceUrl: databaseUrl,

  // Logging configuration with proper types
  log:
    process.env['NODE_ENV'] === 'development'
      ? (['query', 'info', 'warn', 'error'] as Prisma.LogLevel[])
      : (['warn', 'error'] as Prisma.LogLevel[]),

  // Other Prisma client options
  // transactionOptions: {
  //   maxWait: 5000,
  //   timeout: 10000,
  // },
};
