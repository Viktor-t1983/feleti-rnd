/**
 * Prisma Singleton
 * Ensures only one instance of PrismaClient is created
 * Updated for Prisma 7 compatibility
 */

import { PrismaClient } from '@prisma/client';

import { databaseUrl, prismaConfig } from '../config/prisma.config';

// Global prisma instance for development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Get or create PrismaClient singleton instance
 * For Prisma 7, database URL is passed via adapter or accelerateUrl
 * Using the traditional approach with url for backward compatibility
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: prismaConfig.log,
  });

// In development, save to global to prevent multiple instances
if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}
