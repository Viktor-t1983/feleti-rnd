/**
 * Prisma configuration file for Prisma 6/7
 *
 * Database connection URLs are configured here for Migrate CLI,
 * and passed via constructor options (datasourceUrl) for the PrismaClient.
 *
 * See: https://pris.ly/d/config-datasource
 */

import path from 'node:path';

const schemaPath = path.join(__dirname, 'schema.prisma');

// Database URL for Migrate CLI - read from environment or use default
// В Docker DATABASE_URL уже установлена в ENV
const databaseUrl =
  process.env['DATABASE_URL'] ||
  'postgresql://feleti:feleti_dev_password_2024@localhost:5432/feleti_rnd?schema=public';

export default {
  earlyAccess: true,
  schema: schemaPath,

  // Database connection for Migrate CLI
  migrate: {
    directUrl: databaseUrl,
  },

  // Для генерации Prisma Client
  schemaEngine: {
    enabled: true,
  },
};
