/**
 * Settings Routes
 * API endpoints для управления системными настройками
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getAllSettings,
  getSettingsByCategory,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting,
  CreateSettingDto,
  UpdateSettingDto,
} from './settings.service';
import { authenticate, requireRole } from '../../middlewares/authenticate';

/**
 * Register settings routes
 */
export default async function settingsRoutes(fastify: FastifyInstance) {
  // All settings routes require authentication and ADMIN role
  fastify.addHook('onRequest', authenticate);
  fastify.addHook('onRequest', requireRole(['ADMIN']));

  /**
   * GET /api/settings
   * Get all settings
   */
  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const settings = await getAllSettings();
      return reply.send({
        success: true,
        data: settings,
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch settings',
      });
    }
  });

  /**
   * GET /api/settings/category/:category
   * Get settings by category
   */
  fastify.get(
    '/category/:category',
    async (request: FastifyRequest<{ Params: { category: string } }>, reply: FastifyReply) => {
      try {
        const { category } = request.params;
        const settings = await getSettingsByCategory(category);
        return reply.send({
          success: true,
          data: settings,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch settings',
        });
      }
    }
  );

  /**
   * GET /api/settings/:key
   * Get a single setting by key
   */
  fastify.get(
    '/:key',
    async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
      try {
        const { key } = request.params;
        const setting = await getSettingByKey(key);

        if (!setting) {
          return reply.status(404).send({
            success: false,
            error: 'Setting not found',
          });
        }

        return reply.send({
          success: true,
          data: setting,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch setting',
        });
      }
    }
  );

  /**
   * POST /api/settings
   * Create a new setting
   */
  fastify.post(
    '/',
    async (request: FastifyRequest<{ Body: CreateSettingDto }>, reply: FastifyReply) => {
      try {
        const userId = request.user?.userId;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
          });
        }

        const setting = await createSetting(request.body, userId);
        return reply.status(201).send({
          success: true,
          data: setting,
        });
      } catch (error: unknown) {
        fastify.log.error(error);

        // Handle unique constraint violation
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
          return reply.status(409).send({
            success: false,
            error: 'Setting with this key already exists',
          });
        }

        return reply.status(500).send({
          success: false,
          error: 'Failed to create setting',
        });
      }
    }
  );

  /**
   * PUT /api/settings/:key
   * Update a setting
   */
  fastify.put(
    '/:key',
    async (
      request: FastifyRequest<{ Params: { key: string }; Body: UpdateSettingDto }>,
      reply: FastifyReply
    ) => {
      try {
        const { key } = request.params;
        const userId = request.user?.userId;

        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'Unauthorized',
          });
        }

        const setting = await updateSetting(key, request.body, userId);

        if (!setting) {
          return reply.status(404).send({
            success: false,
            error: 'Setting not found',
          });
        }

        return reply.send({
          success: true,
          data: setting,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to update setting',
        });
      }
    }
  );

  /**
   * DELETE /api/settings/:key
   * Delete a setting
   */
  fastify.delete(
    '/:key',
    async (request: FastifyRequest<{ Params: { key: string } }>, reply: FastifyReply) => {
      try {
        const { key } = request.params;
        const success = await deleteSetting(key);

        if (!success) {
          return reply.status(404).send({
            success: false,
            error: 'Setting not found',
          });
        }

        return reply.send({
          success: true,
          message: 'Setting deleted successfully',
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to delete setting',
        });
      }
    }
  );
}
