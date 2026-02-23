/**
 * AI Agents Routes
 *
 * REST API endpoints for AI Agent interactions
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { authenticate } from '../../middlewares/authenticate';
import { agentContextManager, AgentType } from './context/agent-context-manager';
import { agentOrchestrator, AgentRequest, AgentResponse } from './orchestrator/agent-orchestrator';

// Types for request bodies
interface ChatRequestBody {
  agentType: AgentType;
  query: string;
  context?: {
    projectId?: string;
    userId?: string;
    productClassId?: string;
    stage?: string;
    sessionId?: string;
  };
  parameters?: Record<string, unknown>;
  options?: {
    includeRationale?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

interface GetContextQuery {
  agentType: AgentType;
  sessionId: string;
  projectId?: string;
  userId?: string;
}

interface GetProjectMemoriesParams {
  projectId: string;
}

interface GetProjectMemoriesQuery {
  agentType?: AgentType;
}

export async function aiAgentsRoutes(fastify: FastifyInstance): Promise<void> {
  // ==========================================
  // Chat with AI Agent
  // ==========================================
  fastify.post<{ Body: ChatRequestBody }>(
    '/chat',
    {
      preHandler: authenticate,
      schema: {
        body: {
          type: 'object',
          required: ['agentType', 'query'],
          properties: {
            agentType: {
              type: 'string',
              enum: [
                'PORTFOLIO',
                'PRODUCT_DEFINITION',
                'REQUIREMENTS',
                'ARCHITECTURE',
                'VALIDATION',
                'CALCULATION',
                'OPTIMIZATION',
                'RISK_ANALYSIS',
              ],
            },
            query: { type: 'string', minLength: 1 },
            context: {
              type: 'object',
              properties: {
                projectId: { type: 'string' },
                userId: { type: 'string' },
                productClassId: { type: 'string' },
                stage: { type: 'string' },
                sessionId: { type: 'string' },
              },
            },
            parameters: { type: 'object' },
            options: {
              type: 'object',
              properties: {
                includeRationale: { type: 'boolean' },
                maxTokens: { type: 'number' },
                temperature: { type: 'number' },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: ChatRequestBody }>, reply: FastifyReply) => {
      try {
        const { agentType, query, context, parameters, options } = request.body;
        const userId = (request as unknown as { user: { userId: string } }).user.userId;

        const agentRequest: AgentRequest = {
          agentType,
          query,
          context: {
            ...context,
            userId,
          },
          parameters,
          options,
        };

        const response: AgentResponse = await agentOrchestrator.processRequest(agentRequest);

        return reply.send({
          success: true,
          data: response,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Ошибка при обработке запроса',
          details: (error as Error).message,
        });
      }
    }
  );

  // ==========================================
  // Get agent context/memory
  // ==========================================
  fastify.get<{ Querystring: GetContextQuery }>(
    '/context',
    {
      preHandler: authenticate,
      schema: {
        querystring: {
          type: 'object',
          required: ['agentType', 'sessionId'],
          properties: {
            agentType: {
              type: 'string',
              enum: [
                'PORTFOLIO',
                'PRODUCT_DEFINITION',
                'REQUIREMENTS',
                'ARCHITECTURE',
                'VALIDATION',
                'CALCULATION',
                'OPTIMIZATION',
                'RISK_ANALYSIS',
              ],
            },
            sessionId: { type: 'string' },
            projectId: { type: 'string' },
            userId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Querystring: GetContextQuery }>, reply: FastifyReply) => {
      try {
        const { agentType, sessionId, projectId, userId } = request.query;

        const context = await agentContextManager.getContext(agentType, sessionId, {
          projectId,
          userId,
        });

        return reply.send({
          success: true,
          data: context,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Ошибка при получении контекста',
          details: (error as Error).message,
        });
      }
    }
  );

  // ==========================================
  // Get project memories
  // ==========================================
  fastify.get<{ Params: GetProjectMemoriesParams; Querystring: GetProjectMemoriesQuery }>(
    '/projects/:projectId/memories',
    {
      preHandler: authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['projectId'],
          properties: {
            projectId: { type: 'string' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            agentType: {
              type: 'string',
              enum: [
                'PORTFOLIO',
                'PRODUCT_DEFINITION',
                'REQUIREMENTS',
                'ARCHITECTURE',
                'VALIDATION',
                'CALCULATION',
                'OPTIMIZATION',
                'RISK_ANALYSIS',
              ],
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: GetProjectMemoriesParams;
        Querystring: GetProjectMemoriesQuery;
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { projectId } = request.params;
        const { agentType } = request.query;

        const memories = await agentContextManager.getProjectMemories(projectId, agentType);

        return reply.send({
          success: true,
          data: memories,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Ошибка при получении памяти проекта',
          details: (error as Error).message,
        });
      }
    }
  );

  // ==========================================
  // Clear project memories
  // ==========================================
  fastify.delete<{ Params: GetProjectMemoriesParams }>(
    '/projects/:projectId/memories',
    {
      preHandler: authenticate,
      schema: {
        params: {
          type: 'object',
          required: ['projectId'],
          properties: {
            projectId: { type: 'string' },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: GetProjectMemoriesParams }>, reply: FastifyReply) => {
      try {
        const { projectId } = request.params;

        const count = await agentContextManager.clearProjectMemories(projectId);

        return reply.send({
          success: true,
          message: `Удалено ${count} записей памяти`,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Ошибка при очистке памяти проекта',
          details: (error as Error).message,
        });
      }
    }
  );

  // ==========================================
  // Get supported agent types
  // ==========================================
  fastify.get(
    '/agent-types',
    {
      preHandler: authenticate,
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const agentTypes = agentOrchestrator.getSupportedAgentTypes();

      return reply.send({
        success: true,
        data: agentTypes,
      });
    }
  );

  // ==========================================
  // Check AI provider availability
  // ==========================================
  fastify.get(
    '/status',
    {
      preHandler: authenticate,
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const isAvailable = await agentOrchestrator.isAvailable();

      return reply.send({
        success: true,
        data: {
          provider: 'DeepSeek',
          available: isAvailable,
          model: 'deepseek-chat',
        },
      });
    }
  );
}
