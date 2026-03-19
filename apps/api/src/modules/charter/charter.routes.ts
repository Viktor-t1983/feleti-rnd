/**
 * Charter Routes
 * API routes for charter templates and project blocks
 */

import { FastifyInstance } from 'fastify';

import { charterService } from './charter.service';

export async function charterRoutes(fastify: FastifyInstance) {
  // ==========================================
  // TEMPLATE BLOCKS (Редактор шаблонов)
  // ==========================================

  // Получить блоки шаблона для типа оборудования
  fastify.get<{
    Params: { equipmentTypeId: string };
  }>(
    '/charter/templates/:equipmentTypeId/blocks',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { equipmentTypeId } = request.params;
      const blocks = await charterService.getTemplateBlocks(equipmentTypeId);
      return reply.send({ success: true, data: blocks });
    }
  );

  // Создать блок шаблона
  fastify.post<{
    Params: { equipmentTypeId: string };
    Body: {
      name: string;
      icon: string;
      description?: string;
      blockType: string;
      isRequired?: boolean;
      sortOrder?: number;
      aiEnabled?: boolean;
      aiPrompt?: string;
      aiModel?: string;
      fieldSchema?: unknown;
      defaultValues?: unknown;
    };
  }>(
    '/charter/templates/:equipmentTypeId/blocks',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { equipmentTypeId } = request.params;
      const block = await charterService.createTemplateBlock({
        ...request.body,
        equipmentTypeId,
      });
      return reply.status(201).send({ success: true, data: block });
    }
  );

  // Обновить блок шаблона
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      icon?: string;
      description?: string;
      blockType?: string;
      isRequired?: boolean;
      sortOrder?: number;
      aiEnabled?: boolean;
      aiPrompt?: string;
      aiModel?: string;
      fieldSchema?: unknown;
      defaultValues?: unknown;
    };
  }>(
    '/charter/template-blocks/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;
      const block = await charterService.updateTemplateBlock(id, request.body);
      return reply.send({ success: true, data: block });
    }
  );

  // Удалить блок шаблона
  fastify.delete<{
    Params: { id: string };
  }>(
    '/charter/template-blocks/:id',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params;
      await charterService.deleteTemplateBlock(id);
      return reply.send({ success: true });
    }
  );

  // Изменить порядок блоков
  fastify.post<{
    Params: { equipmentTypeId: string };
    Body: { blocks: { id: string; sortOrder: number }[] };
  }>(
    '/charter/templates/:equipmentTypeId/reorder',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { blocks } = request.body;
      await charterService.reorderBlocks(blocks);
      return reply.send({ success: true });
    }
  );

  // ==========================================
  // PROJECT CHARTER (Устав проекта)
  // ==========================================

  // Получить полный устав проекта (с блоками)
  fastify.get<{
    Params: { projectId: string };
  }>(
    '/projects/:projectId/charter',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { projectId } = request.params;
      const charter = await charterService.getProjectCharter(projectId);
      return reply.send({ success: true, data: charter });
    }
  );

  // Обновить данные блока проекта
  fastify.put<{
    Params: { projectId: string; blockId: string };
    Body: {
      data?: unknown;
      aiHistory?: unknown;
      aiFlags?: unknown;
      status?: string;
    };
  }>(
    '/projects/:projectId/blocks/:blockId',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { blockId } = request.params;
      const user = request.user as { userId: string };
      const block = await charterService.updateProjectBlock(blockId, user.userId, request.body);
      return reply.send({ success: true, data: block });
    }
  );

  // Сохранить сообщение AI в истории блока
  fastify.post<{
    Params: { projectId: string; blockId: string };
    Body: {
      role: 'user' | 'assistant';
      content: string;
      flags?: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }>;
    };
  }>(
    '/projects/:projectId/blocks/:blockId/ai-message',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { blockId } = request.params;
      const user = request.user as { userId: string };
      const block = await charterService.saveAiMessage(blockId, user.userId, request.body);
      return reply.send({ success: true, data: block });
    }
  );

  // AI Chat через backend (ключ из БД, не из .env)
  fastify.post<{
    Params: { projectId: string; blockId: string };
    Body: {
      message: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      blockContext?: Record<string, unknown>;
    };
  }>(
    '/projects/:projectId/blocks/:blockId/ai-chat',
    {
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { blockId } = request.params;
      const user = request.user as { userId: string };
      const { message, history = [], blockContext } = request.body;

      try {
        const result = await charterService.aiChat(
          blockId,
          user.userId,
          message,
          history,
          blockContext
        );
        return reply.send({ success: true, data: result });
      } catch (error: unknown) {
        const err = error as Error;
        return reply.status(503).send({
          success: false,
          error: err.message || 'Ошибка AI-ассистента',
        });
      }
    }
  );
}
