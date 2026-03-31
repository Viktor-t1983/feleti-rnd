import cookie from '@fastify/cookie';
import Fastify from 'fastify';
import fp from 'fastify-plugin';

import { aiAgentsRoutes } from './modules/ai-agents/ai-agents.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { charterRoutes } from './modules/charter';
import { calculationsRoutes } from './modules/engineering/calculations/calculations.routes';
import { knowledgeRoutes } from './modules/engineering/knowledge/knowledge.routes';
import { productClassesRoutes } from './modules/engineering/product-classes/product-classes.routes';
import { rulesRoutes } from './modules/engineering/rules/rules.routes';
import { validationRoutes } from './modules/engineering/validation/validation.routes';
import { projectsRoutes } from './modules/projects/projects.routes';
import { searchRoutes } from './modules/search/search.routes';
import { usersRoutes } from './modules/users/users.routes';
import { errorHandler } from './plugins/errorHandler';
import jwtPlugin from './plugins/jwt';
import rateLimitPlugin from './plugins/rateLimit';
import securityPlugin from './plugins/security';
import swaggerPlugin from './plugins/swagger';
import { logger } from './utils/logger';

// Initialize Fastify with logger configuration
const fastify = Fastify({
  logger: {
    level: process.env['LOG_LEVEL'] || 'info',
  },
});

// Register plugins in specified order
void fastify.register(errorHandler);
void fastify.register(securityPlugin);
void fastify.register(rateLimitPlugin);

// Register cookie plugin first (required by JWT plugin)
void fastify.register(fp(cookie));

// Validate required environment variables before starting
function validateEnv(): void {
  const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const jwtSecret = process.env['JWT_SECRET']!;
  const refreshSecret = process.env['JWT_REFRESH_SECRET']!;

  if (jwtSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be at least 32 characters long');
  }
}

// Validate environment on module load
validateEnv();

// Register JWT plugin (which includes cookie registration as a dependency)
void fastify.register(jwtPlugin, {
  secret: process.env['JWT_SECRET']!,
  refreshSecret: process.env['JWT_REFRESH_SECRET']!,
  cookie: {
    accessTokenName: 'access_token',
    refreshTokenName: 'refresh_token',
    signed: false,
  },
});

void fastify.register(swaggerPlugin);

// Register auth routes
void fastify.register(authRoutes, { prefix: '/api' });

// Register calculations routes (BEFORE projects routes to avoid route conflicts)
void fastify.register(calculationsRoutes, { prefix: '/api' });

// Register projects routes
void fastify.register(projectsRoutes, { prefix: '/api' });

// Register users routes
void fastify.register(usersRoutes, { prefix: '/api' });

// Register search routes
void fastify.register(searchRoutes, { prefix: '/api' });

// Register knowledge routes
void fastify.register(knowledgeRoutes, { prefix: '/api' });

// Register rules routes
void fastify.register(rulesRoutes, { prefix: '/api' });

// Register validation routes
void fastify.register(validationRoutes, { prefix: '/api' });

// Register AI Agents routes
void fastify.register(aiAgentsRoutes, { prefix: '/api' });

// Register product-classes routes
void fastify.register(productClassesRoutes, { prefix: '/api' });

import { activityLogRoutes } from './modules/activity-log/activity-log.routes';
import { knowledgeBaseRoutes } from './modules/knowledge-base';
import { adminRoutes } from './modules/admin/admin.routes';
import { analyticsRoutes } from './modules/analytics';
import { attachmentsRoutes } from './modules/attachments/attachments.routes';
import { calendarRoutes } from './modules/calendar/calendar.routes';
import { commentsRoutes } from './modules/comments/comments.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { templatesRoutes } from './modules/templates/templates.routes';
import settingsRoutes from './modules/settings/settings.routes';
import { aiProviderRoutes } from './modules/ai';
import { marketResearchRoutes } from './modules/market-research';
void fastify.register(attachmentsRoutes, { prefix: '/api' });
void fastify.register(analyticsRoutes, { prefix: '/api' });
void fastify.register(reportsRoutes, { prefix: '/api' });
void fastify.register(calendarRoutes, { prefix: '/api' });
void fastify.register(commentsRoutes, { prefix: '/api' });
void fastify.register(notificationsRoutes, { prefix: '/api' });
void fastify.register(adminRoutes, { prefix: '/api' });
void fastify.register(activityLogRoutes, { prefix: '/api' });
void fastify.register(templatesRoutes, { prefix: '/api' });
void fastify.register(knowledgeBaseRoutes, { prefix: '/api' });
void fastify.register(settingsRoutes, { prefix: '/api/settings' });
void fastify.register(aiProviderRoutes, { prefix: '/api' });
void fastify.register(marketResearchRoutes, { prefix: '/api' });
void fastify.register(charterRoutes, { prefix: '/api' });

// Health check endpoint
fastify.get('/health', () => {
  return { status: 'ok' };
});

// Health check for /api/health (nginx proxy)
fastify.get('/api/health', () => {
  return { status: 'ok' };
});

// Redirect root to docs
fastify.get('/', (_request, reply) => {
  return reply.redirect('/docs');
});

// Stub routes for missing endpoints
// GET /api/users - заглушка для получения списка пользователей
fastify.get('/api/users', async () => {
  return { message: 'not implemented' };
});

// GET /api/validation-gates - заглушка (алиас для /api/validation/gates)
fastify.get('/api/validation-gates', async () => {
  return { message: 'not implemented' };
});

const start = (): void => {
  try {
    const port = parseInt(process.env['PORT'] || '3001');
    const host = process.env['HOST'] || '0.0.0.0';
    void fastify.listen({ port, host });
    logger.info(`Server running on http://localhost:${port}`);
    logger.info(`Swagger documentation available at http://localhost:${port}/docs`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

void start();
