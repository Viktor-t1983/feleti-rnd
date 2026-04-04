import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AdminService } from './admin.service';
import { getProviderApiKey, getProviderByCode } from '../ai/ai-providers.service';
import { $Enums } from '@prisma/client';

type EquipmentCategory = $Enums.EquipmentCategory;

const adminService = new AdminService();

const WIZARD_SYSTEM_PROMPT = `Ты эксперт по промышленному оборудованию и R&D процессам. Твоя задача — помочь администратору создать оптимальный набор блоков устава для нового типа оборудования.

Правила:
1. Задавай только ОДИН вопрос за раз — не надо спрашивать всё сразу
2. После 2-3 ответов пользователя СОЗДАЙ JSON с предлагаемыми блоками
3. Каждый блок должен иметь подробный AI промпт — роль эксперта, конкретные вопросы, флаги рисков
4. Блоки должны быть специфичны для данного типа оборудования (не базовые)

Формат ответа с блоками:
<blocks>
[
  {
    "name": "Название блока",
    "description": "Краткое описание",
    "aiPrompt": "Полный промпт для AI ассистента в этом блоке",
    "blockType": "TEXT|PARAMS_TABLE|RISK_LIST|DECOMPOSITION",
    "sortOrder": 4
  }
]
</blocks>

Типы блоков:
- TEXT: текстовое описание
- PARAMS_TABLE: таблица технических параметров
- RISK_LIST: анализ рисков
- DECOMPOSITION: декомпозиция на подсистемы

Начни с приветствия и попроси рассказать об оборудовании.`;

/**
 * Middleware to check if user has Admin role
 */
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.userId;

  if (!userId) {
    return reply.code(401).send({
      error: 'Требуется аутентификация',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });

  if (user?.role.name !== 'Admin') {
    return reply.code(403).send({
      error: 'Доступ запрещён. Только для Admin.',
    });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // All routes require Auth + Admin
  const preHandler = [fastify.authenticate, requireAdmin];

  // GET /admin/users - Get all users
  fastify.get('/admin/users', { preHandler }, async (_, reply) => {
    const users = await adminService.getUsers();
    return reply.send(users);
  });

  // GET /admin/stats - Get system statistics
  fastify.get('/admin/stats', { preHandler }, async (_, reply) => {
    const stats = await adminService.getStats();
    return reply.send(stats);
  });

  // GET /admin/roles - Get all roles
  fastify.get('/admin/roles', { preHandler }, async (_, reply) => {
    const roles = await adminService.getRoles();
    return reply.send(roles);
  });

  // PATCH /admin/users/:id/block - Block/unblock user
  fastify.patch('/admin/users/:id/block', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { block } = request.body as {
      block: boolean;
    };

    try {
      const result = await adminService.toggleBlock(id, block);
      return reply.send(result);
    } catch (error: unknown) {
      const err = error as Error;
      return reply.code(400).send({
        error: err.message,
      });
    }
  });

  // PATCH /admin/users/:id/role - Change user role
  fastify.patch('/admin/users/:id/role', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { roleId } = request.body as {
      roleId: string;
    };

    try {
      const result = await adminService.changeRole(id, roleId);
      return reply.send(result);
    } catch (error: unknown) {
      const err = error as Error;
      return reply.code(400).send({
        error: err.message,
      });
    }
  });

  // DELETE /admin/users/:id - Delete user
  fastify.delete('/admin/users/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUserId = request.user?.userId;

    try {
      await adminService.deleteUser(id, currentUserId as string);
      return reply.code(204).send();
    } catch (error: unknown) {
      const err = error as Error;
      return reply.code(400).send({
        error: err.message,
      });
    }
  });

  // GET /admin/equipment-types - Get all equipment types
  fastify.get('/admin/equipment-types', { preHandler }, async (_, reply) => {
    const equipmentTypes = await prisma.equipmentType.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        isActive: true,
        _count: { select: { templateBlocks: true } },
      },
      orderBy: { name: 'asc' },
    });
    return reply.send({ success: true, data: equipmentTypes });
  });

  // POST /admin/equipment-types - Create equipment type
  fastify.post('/admin/equipment-types', { preHandler }, async (request, reply) => {
    const { code, name, category, description } = request.body as {
      code: string;
      name: string;
      category: string;
      description?: string;
    };
    const userId = request.user?.userId;

    if (!userId) {
      return reply.code(401).send({ error: 'Требуется аутентификация' });
    }

    const equipmentType = await prisma.equipmentType.create({
      data: {
        code,
        name,
        category: category as EquipmentCategory,
        description,
        createdById: userId,
      },
    });

    return reply.code(201).send({ success: true, data: equipmentType });
  });

  // DELETE /admin/equipment-types/:id - Delete equipment type
  fastify.delete('/admin/equipment-types/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.user?.userId;

    if (!userId) {
      return reply.code(401).send({ error: 'Требуется аутентификация' });
    }

    await prisma.equipmentType.delete({
      where: { id },
    });

    return reply.send({ success: true });
  });

  // POST /admin/equipment-wizard/chat - AI chat for wizard
  fastify.post('/admin/equipment-wizard/chat', { preHandler }, async (request, reply) => {
    const { equipmentName, category, message, history = [] } = request.body as {
      equipmentName: string;
      category: string;
      message: string;
      history: Array<{ role: string; content: string }>;
      currentBlocks?: Array<{ name: string; description: string; aiPrompt: string }>;
    };

    try {
      const providerCode = 'deepseek';
      const provider = await getProviderByCode(providerCode);
      if (!provider) {
        throw new Error('DeepSeek not configured');
      }

      const apiKey = await getProviderApiKey(providerCode);
      if (!apiKey) {
        throw new Error('API key not configured');
      }

      const messages = [
        { role: 'system', content: WIZARD_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: `Оборудование: ${equipmentName}, Категория: ${category}. ${message}` },
      ];

      const response = await fetch(provider.apiEndpoint + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: provider.defaultModel,
          max_tokens: 4000,
          messages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI error: ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      const choices = data['choices'] as Array<{ message: { content: string } }>;
      const replyText = choices?.[0]?.message?.content || '';

      const blocksMatch = replyText.match(/<blocks>([\s\S]*?)<\/blocks>/);
      let suggestedBlocks: Array<{ name: string; description: string; aiPrompt: string; blockType: string; sortOrder: number }> = [];

      if (blocksMatch && blocksMatch[1]) {
        try {
          suggestedBlocks = JSON.parse(blocksMatch[1]);
        } catch {
          // JSON parse error, ignore blocks
        }
      }

      return reply.send({
        success: true,
        data: {
          reply: replyText.replace(/<blocks>[\s\S]*?<\/blocks>/g, '').trim(),
          blocks: suggestedBlocks,
        },
      });
    } catch (error: unknown) {
      const err = error as Error;
      return reply.status(500).send({
        success: false,
        error: err.message,
      });
    }
  });
}
