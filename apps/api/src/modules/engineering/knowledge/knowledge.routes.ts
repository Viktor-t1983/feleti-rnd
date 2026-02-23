import { FastifyInstance } from 'fastify';
import type { KnowledgeGraphQuery } from '../types';
import { knowledgeGraphService } from './knowledge-graph.service';

export async function knowledgeRoutes(fastify: FastifyInstance) {
  // === NODES ===

  // Создать узел
  fastify.post<{
    Body: {
      type: string;
      title: string;
      content: string;
      summary?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      confidence?: number;
      importance?: string;
      productClassId?: string;
      projectId?: string;
    };
  }>('/nodes', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as unknown as { id: string; userId: string };
    const node = await knowledgeGraphService.createNode({
      ...request.body,
      createdById: user.id || user.userId,
    });
    return reply.code(201).send(node);
  });

  // Поиск узлов
  fastify.get<{
    Querystring: {
      type?: string;
      tags?: string;
      productClassId?: string;
      projectId?: string;
      query?: string;
      limit?: string;
      offset?: string;
    };
  }>('/nodes', { preHandler: [fastify.authenticate] }, async (request) => {
    const { type, tags, productClassId, projectId, query, limit, offset } = request.query;
    return knowledgeGraphService.searchNodes({
      type,
      tags: tags ? tags.split(',') : undefined,
      productClassId,
      projectId,
      query,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  });

  // Получить узел по ID
  fastify.get<{ Params: { id: string } }>(
    '/nodes/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const node = await knowledgeGraphService.getNode(request.params.id);
        return node;
      } catch {
        return reply.code(404).send({ error: 'Узел не найден' });
      }
    }
  );

  // Трассировка: Product → Requirements → Solutions
  fastify.get<{ Params: { projectId: string } }>(
    '/trace/:projectId',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return knowledgeGraphService.traceProductToSolutions(request.params.projectId);
    }
  );

  // Статистика графа
  fastify.get<{ Querystring: { productClassId?: string; projectId?: string } }>(
    '/stats',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return knowledgeGraphService.getGraphStats(request.query);
    }
  );

  // === RELATIONS ===

  // Создать связь
  fastify.post<{
    Body: {
      type: string;
      fromNodeId: string;
      toNodeId: string;
      strength?: number;
      confidence?: number;
      description?: string;
      metadata?: Record<string, unknown>;
    };
  }>('/relations', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const relation = await knowledgeGraphService.createRelation(request.body);
      return reply.code(201).send(relation);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка';
      return reply.code(400).send({ error: message });
    }
  });

  // Обход графа
  fastify.post<{ Body: KnowledgeGraphQuery }>(
    '/query',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return knowledgeGraphService.queryGraph(request.body);
    }
  );

  // === VERSIONS ===

  // Создать новую версию узла
  fastify.post<{
    Params: { id: string };
    Body: {
      title?: string;
      content?: string;
      summary?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    };
  }>('/nodes/:id/versions', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const user = request.user as unknown as { id: string; userId: string };
    try {
      const version = await knowledgeGraphService.createNodeVersion(request.params.id, {
        ...request.body,
        createdById: user.id || user.userId,
      });
      return reply.code(201).send(version);
    } catch {
      return reply.code(400).send({ error: 'Не удалось создать версию' });
    }
  });
}
