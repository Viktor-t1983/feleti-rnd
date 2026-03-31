/**
 * AI Providers Routes
 * API для управления AI провайдерами и назначениями на блоки
 */

import { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../middlewares/authenticate';

import {
  getAllProviders,
  getEnabledProviders,
  getProviderByCode,
  getBlockAIConfig,
  upsertBlockAIConfig,
  getFallbackChain,
  getResearchProvider,
  isAutoFallbackEnabled,
  isProviderAvailable,
  getBestAvailableProvider,
  getConfigsByEquipmentType,
  initializeBlockAssignments,
} from './ai-providers.service';

export default async function aiProviderRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('onRequest', authenticate);

  // ==========================================
  // Provider Management (Admin only)
  // ==========================================

  // Get all providers
  fastify.get('/ai-providers', async (request, reply) => {
    try {
      const providers = await getAllProviders();
      return {
        success: true,
        data: providers,
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch AI providers',
      });
    }
  });

  // Get enabled providers (for selection)
  fastify.get('/ai-providers/enabled', async (request, reply) => {
    try {
      const providers = await getEnabledProviders();
      return {
        success: true,
        data: providers,
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch enabled providers',
      });
    }
  });

  // Get specific provider
  fastify.get('/ai-providers/:code', async (request, reply) => {
    try {
      const { code } = request.params as { code: string };
      const provider = await getProviderByCode(code);

      if (!provider) {
        return reply.status(404).send({
          success: false,
          error: 'Provider not found',
        });
      }

      // Check if provider is available (has API key)
      const available = await isProviderAvailable(code);

      return {
        success: true,
        data: { ...provider, available },
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch provider',
      });
    }
  });

  // Update provider (admin only)
  fastify.put(
    '/ai-providers/:code',
    { onRequest: requireRole(['ADMIN']) },
    async (request, reply) => {
      try {
        const { code } = request.params as { code: string };
        const updates = request.body as {
          enabled?: boolean;
          priority?: number;
          defaultModel?: string;
          maxTokens?: number;
        };

        // Update in database
        const { prisma } = await import('../../lib/prisma');
        const updated = await prisma.aIProviderConfig.update({
          where: { providerCode: code },
          data: updates,
        });

        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to update provider',
        });
      }
    }
  );

  // ==========================================
  // Block AI Assignments
  // ==========================================

  // Get AI config for a template block
  fastify.get(
    '/template-blocks/:blockId/ai-config',
    async (request, reply) => {
      try {
        const { blockId } = request.params as { blockId: string };
        const config = await getBlockAIConfig(blockId);

        if (!config) {
          // Return default config if not set
          return {
            success: true,
            data: {
              templateBlockId: blockId,
              primaryProvider: 'deepseek',
              fallbackProvider: null,
              customSystemPrompt: null,
              temperature: 0.7,
              enableResearch: false,
              maxKbDocs: 5,
            },
          };
        }

        return {
          success: true,
          data: config,
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch block AI config',
        });
      }
    }
  );

  // Update AI config for a template block (admin/manager)
  fastify.put(
    '/template-blocks/:blockId/ai-config',
    { onRequest: requireRole(['ADMIN', 'MANAGER']) },
    async (request, reply) => {
      try {
        const { blockId } = request.params as { blockId: string };
        const config = request.body as {
          primaryProvider?: string;
          fallbackProvider?: string;
          customSystemPrompt?: string;
          temperature?: number;
          enableResearch?: boolean;
          maxKbDocs?: number;
        };

        const updated = await upsertBlockAIConfig(blockId, config);

        return {
          success: true,
          data: updated,
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to update block AI config',
        });
      }
    }
  );

  // Get all AI configs for equipment type
  fastify.get(
    '/equipment-types/:typeId/ai-configs',
    async (request, reply) => {
      try {
        const { typeId } = request.params as { typeId: string };
        const configs = await getConfigsByEquipmentType(typeId);

        return {
          success: true,
          data: configs,
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to fetch equipment AI configs',
        });
      }
    }
  );

  // Initialize default assignments for equipment type
  fastify.post(
    '/equipment-types/:typeId/initialize-ai',
    { onRequest: requireRole(['ADMIN', 'MANAGER']) },
    async (request, reply) => {
      try {
        const { typeId } = request.params as { typeId: string };
        const { defaultProvider = 'deepseek' } = request.body as {
          defaultProvider?: string;
        };

        const count = await initializeBlockAssignments(typeId, defaultProvider);

        return {
          success: true,
          data: { initialized: count },
        };
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to initialize AI assignments',
        });
      }
    }
  );

  // ==========================================
  // Fallback & Research Settings
  // ==========================================

  // Get fallback chain
  fastify.get('/ai-providers/fallback-chain', async (request, reply) => {
    try {
      const chain = await getFallbackChain();
      const enabled = await isAutoFallbackEnabled();
      const researchProvider = await getResearchProvider();

      return {
        success: true,
        data: {
          chain,
          autoFallback: enabled,
          researchProvider,
        },
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch fallback settings',
      });
    }
  });

  // Get best available provider
  fastify.get('/ai-providers/best-available', async (request, reply) => {
    try {
      const provider = await getBestAvailableProvider();

      if (!provider) {
        return reply.status(503).send({
          success: false,
          error: 'No AI provider available. Please configure API keys.',
        });
      }

      return {
        success: true,
        data: { provider },
      };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to determine best provider',
      });
    }
  });
}
