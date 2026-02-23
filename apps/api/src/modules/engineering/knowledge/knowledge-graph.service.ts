import { Prisma } from '@prisma/client';
import { NotFoundError } from '../../../errors';
import { prisma } from '../../../lib/prisma';
import type { KnowledgeGraphQuery } from '../types';

/**
 * KnowledgeGraphService - Сервис для работы с графом инженерных знаний
 */
export class KnowledgeGraphService {
  /**
   * Создать узел знаний
   */
  async createNode(data: {
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
    createdById: string;
  }) {
    return prisma.knowledgeNode.create({
      data: {
        type: data.type as never,
        title: data.title,
        content: data.content,
        summary: data.summary,
        tags: data.tags || [],
        metadata: data.metadata as never,
        confidence: data.confidence ?? 1.0,
        importance: data.importance || 'MEDIUM',
        productClassId: data.productClassId,
        projectId: data.projectId,
        createdById: data.createdById,
        version: 1,
      },
      include: {
        createdBy: { select: { id: true, fullName: true, username: true } },
        productClass: { select: { id: true, code: true, name: true } },
        project: { select: { id: true, code: true, name: true } },
      },
    });
  }

  /**
   * Создать связь между узлами
   */
  async createRelation(data: {
    type: string;
    fromNodeId: string;
    toNodeId: string;
    strength?: number;
    confidence?: number;
    description?: string;
    metadata?: Record<string, unknown>;
  }) {
    const [fromNode, toNode] = await Promise.all([
      prisma.knowledgeNode.findUnique({ where: { id: data.fromNodeId } }),
      prisma.knowledgeNode.findUnique({ where: { id: data.toNodeId } }),
    ]);

    if (!fromNode || !toNode) {
      throw new NotFoundError('Один или оба узла не найдены');
    }

    return prisma.knowledgeRelation.create({
      data: {
        type: data.type as never,
        fromNodeId: data.fromNodeId,
        toNodeId: data.toNodeId,
        strength: data.strength ?? 1.0,
        confidence: data.confidence ?? 1.0,
        description: data.description,
        metadata: data.metadata as never,
      },
      include: {
        fromNode: { select: { id: true, type: true, title: true } },
        toNode: { select: { id: true, type: true, title: true } },
      },
    });
  }

  /**
   * Получить узел по ID
   */
  async getNode(id: string) {
    const node = await prisma.knowledgeNode.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        productClass: { select: { id: true, code: true, name: true } },
        project: { select: { id: true, code: true, name: true } },
        relationsFrom: { include: { toNode: { select: { id: true, type: true, title: true } } } },
        relationsTo: { include: { fromNode: { select: { id: true, type: true, title: true } } } },
        supersedes: { select: { id: true, version: true, title: true } },
      },
    });

    if (!node) throw new NotFoundError('Узел не найден');
    return node;
  }

  /**
   * Поиск узлов
   */
  async searchNodes(filters: {
    type?: string;
    tags?: string[];
    productClassId?: string;
    projectId?: string;
    query?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions: Prisma.KnowledgeNodeWhereInput[] = [];

    if (filters.type) conditions.push({ type: filters.type as never });
    if (filters.tags?.length) conditions.push({ tags: { hasSome: filters.tags } });
    if (filters.productClassId) conditions.push({ productClassId: filters.productClassId });
    if (filters.projectId) conditions.push({ projectId: filters.projectId });
    if (filters.query) {
      conditions.push({ title: { contains: filters.query, mode: 'insensitive' } });
      conditions.push({ content: { contains: filters.query, mode: 'insensitive' } });
    }

    const where = conditions.length > 0 ? { OR: conditions } : {};
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [nodes, total] = await Promise.all([
      prisma.knowledgeNode.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true } },
          productClass: { select: { code: true, name: true } },
          _count: { select: { relationsFrom: true, relationsTo: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.knowledgeNode.count({ where }),
    ]);

    return { nodes, total, page: Math.floor(offset / limit) + 1, pageSize: limit };
  }

  /**
   * Обход графа
   */
  async queryGraph(query: KnowledgeGraphQuery) {
    const { startNodeId, relationTypes, maxDepth = 3, direction = 'FORWARD', filters } = query;
    const visited = new Set<string>();
    const nodes: unknown[] = [];
    const relations: unknown[] = [];

    const traverse = async (nodeId: string, depth: number) => {
      if (depth > maxDepth || visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = await prisma.knowledgeNode.findUnique({
        where: { id: nodeId },
        include: {
          relationsFrom: direction !== 'BACKWARD',
          relationsTo: direction !== 'FORWARD',
          createdBy: { select: { fullName: true } },
        },
      });

      if (!node) return;
      if (filters?.nodeTypes?.length && !filters.nodeTypes.includes(node.type as never)) return;
      if (filters?.minConfidence && node.confidence < filters.minConfidence) return;
      if (filters?.tags?.length && !filters.tags.some((t) => node.tags.includes(t))) return;

      nodes.push(node);

      if (direction !== 'BACKWARD' && node.relationsFrom) {
        for (const rel of node.relationsFrom) {
          if (!relationTypes || relationTypes.includes(rel.type as never)) {
            relations.push(rel);
            await traverse(rel.toNodeId, depth + 1);
          }
        }
      }

      if (direction !== 'FORWARD' && node.relationsTo) {
        for (const rel of node.relationsTo) {
          if (!relationTypes || relationTypes.includes(rel.type as never)) {
            relations.push(rel);
            await traverse(rel.fromNodeId, depth + 1);
          }
        }
      }
    };

    await traverse(startNodeId, 0);
    return { nodes, relations, paths: [] };
  }

  /**
   * Трассировка: Product → Requirements → Solutions
   */
  async traceProductToSolutions(projectId: string) {
    const nodes = await prisma.knowledgeNode.findMany({
      where: { projectId },
      include: { relationsFrom: true, relationsTo: true },
    });

    const requirements = nodes.filter((n) => n.type === 'REQUIREMENT');
    const traces = [];

    for (const req of requirements) {
      const trace: Record<string, unknown> = { requirement: req, problems: [], solutions: [] };
      const problemRelations = req.relationsFrom.filter((r) => r.type === 'CAUSES');

      for (const rel of problemRelations) {
        const problem = nodes.find((n) => n.id === rel.toNodeId);
        if (problem?.type === 'PROBLEM') {
          (trace['problems'] as unknown[]).push(problem);
          const solutionRelations = problem.relationsTo.filter((r) => r.type === 'SOLVES');
          for (const sRel of solutionRelations) {
            const solution = nodes.find((n) => n.id === sRel.fromNodeId);
            if (solution?.type === 'SOLUTION') {
              (trace['solutions'] as unknown[]).push(solution);
            }
          }
        }
      }
      traces.push(trace);
    }
    return traces;
  }

  /**
   * Создать новую версию узла
   */
  async createNodeVersion(
    nodeId: string,
    data: {
      title?: string;
      content?: string;
      summary?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      createdById: string;
    }
  ) {
    const originalNode = await this.getNode(nodeId);

    return prisma.knowledgeNode.create({
      data: {
        type: originalNode.type as never,
        title: data.title || originalNode.title,
        content: data.content || originalNode.content,
        summary: data.summary || originalNode.summary,
        tags: data.tags || originalNode.tags,
        metadata: (data.metadata || originalNode.metadata) as never,
        confidence: originalNode.confidence,
        importance: originalNode.importance as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        productClassId: originalNode.productClassId || undefined,
        projectId: originalNode.projectId || undefined,
        version: originalNode.version + 1,
        supersededById: nodeId,
        createdById: data.createdById,
      },
    });
  }

  /**
   * Удалить узел
   */
  async deleteNode(nodeId: string) {
    return prisma.knowledgeNode.update({
      where: { id: nodeId },
      data: { confidence: 0, metadata: { deleted: true, deletedAt: new Date() } as never },
    });
  }

  /**
   * Статистика графа
   */
  async getGraphStats(filters?: { productClassId?: string; projectId?: string }) {
    const where: Prisma.KnowledgeNodeWhereInput = {};
    if (filters?.productClassId) where.productClassId = filters.productClassId;
    if (filters?.projectId) where.projectId = filters.projectId;

    const [totalNodes, totalRelations, byType, byImportance] = await Promise.all([
      prisma.knowledgeNode.count({ where }),
      prisma.knowledgeRelation.count(),
      prisma.knowledgeNode.groupBy({ by: ['type'], where, _count: true }),
      prisma.knowledgeNode.groupBy({ by: ['importance'], where, _count: true }),
    ]);

    return {
      totalNodes,
      totalRelations,
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
      byImportance: byImportance.map((i) => ({ importance: i.importance, count: i._count })),
    };
  }
}

export const knowledgeGraphService = new KnowledgeGraphService();
