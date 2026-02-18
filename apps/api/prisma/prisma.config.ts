/**
 * Prisma configuration file for Prisma 7
 * 
 * In Prisma 7, database connection URLs are configured here for Migrate CLI,
 * and passed via constructor options (datasourceUrl) for the PrismaClient.
 * 
 * See: https://pris.ly/d/config-datasource and https://pris.ly/d/prisma7-client-config
 */

import path from 'node:path';

const schemaPath = path.join(__dirname, 'schema.prisma');

// Database URL for Migrate CLI - read from environment or use default
const databaseUrl = process.env['DATABASE_URL'] || 'postgresql://user:password@localhost:5432/feleti_db?schema=public';

export default {
  schema: schemaPath,
  
  // Database connection for Migrate CLI
  // Using direct URL for PostgreSQL
  migrate: {
    directUrl: databaseUrl,
  },
}
