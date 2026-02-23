/**
 * AI Agent Orchestrator
 *
 * Main orchestration layer for AI agents
 * Handles agent prompts, tool definitions, and LLM interactions
 */

import { config } from '../../../config';
import {
  AgentContext,
  agentContextManager,
  AgentDecision,
  AgentInteraction,
  AgentMemoryData,
  AgentType,
} from '../context/agent-context-manager';
import { DeepSeekProvider } from '../llm/deepseek.provider';
import { LLMMessage, LLMProvider } from '../llm/llm-provider.interface';

export interface AgentRequest {
  agentType: AgentType;
  query: string;
  context: AgentContext;
  parameters?: Record<string, unknown>;
  options?: {
    includeRationale?: boolean;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface AgentResponse {
  agentType: AgentType;
  response: string;
  decisions?: AgentDecision[];
  recommendations?: {
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    rationale: string;
  }[];
  nextSteps?: string[];
  warnings?: string[];
  confidence: number;
  memoryUpdated: boolean;
  metadata?: {
    tokensUsed?: number;
    executionTime?: number;
    model?: string;
  };
}

/**
 * Agent system prompts based on agent type
 */
const AGENT_PROMPTS: Record<AgentType, string> = {
  PORTFOLIO: `Ты - AI ассистент для анализа портфеля проектов R&D.
Твоя роль - помогать в оценке и управлении портфелем проектов.
Используй структурированный подход и предоставляй обоснованные рекомендации.
Всегда учитывай стадию проекта, риски и ресурсы.`,

  PRODUCT_DEFINITION: `Ты - AI ассистент для определения продукта.
Твоя роль - помогать в формулировании требований к продукту и его характеристикам.
Используй методологии product discovery и design thinking.
Всегда учитывай потребности пользователей и бизнес-ценность.`,

  REQUIREMENTS: `Ты - AI ассистент для работы с требованиями.
Твоя роль - помогать в анализе, формулировании и приоритизации требований.
Используй практики инженерии требований.
Всегда проверяй полноту, непротиворечивость и прослеживаемость требований.`,

  ARCHITECTURE: `Ты - AI ассистент по архитектурным решениям.
Твоя роль - помогать в проектировании технической архитектуры.
Учитывай функциональные и нефункциональные требования.
Всегда оценивай компромиссы между различными архитектурными подходами.`,

  VALIDATION: `Ты - AI ассистник для валидации проектов.
Твоя роль - помогать в проверке соответствия проекта критериям.
Используй чек-листы и лучшие практики валидации.
Всегда будь объективен и указывай на конкретные проблемы.`,

  CALCULATION: `Ты - AI ассистент для инженерных расчётов.
Твоя роль - помогать в выполнении и верификации расчётов.
Знай основные инженерные формулы и методологии.
Всегда проверяй единицы измерения и размерности.`,

  OPTIMIZATION: `Ты - AI ассистент для оптимизации.
Твоя роль - помогать в поиске оптимальных решений.
Используй методы оптимизации и математического моделирования.
Учитывай ограничения и критерии оптимальности.`,

  RISK_ANALYSIS: `Ты - AI ассистент для анализа рисков.
Твоя роль - помогать в идентификации и оценке рисков.
Используй методологии risk management.
Всегда предлагай меры по митигации выявленных рисков.`,
};

export class AgentOrchestrator {
  private provider: LLMProvider;

  constructor() {
    this.provider = new DeepSeekProvider({
      apiKey: config.deepseek.apiKey,
      baseURL: config.deepseek.baseURL,
      defaultModel: config.deepseek.model,
      defaultTemperature: 0.7,
      defaultMaxTokens: 4096,
    });
  }

  /**
   * Process an agent request
   */
  async processRequest(request: AgentRequest): Promise<AgentResponse> {
    const startTime = Date.now();
    let memoryUpdated = false;

    try {
      // Get or create session
      const sessionId = request.context.sessionId || `session-${Date.now()}`;

      // Load existing context
      const existingContext = await agentContextManager.getContext(request.agentType, sessionId, {
        projectId: request.context.projectId,
        userId: request.context.userId,
      });

      // Build messages
      const messages = this.buildMessages(
        request.agentType,
        request.query,
        existingContext,
        request.context
      );

      // Call LLM
      const response = await this.provider.chat({
        messages,
        temperature: request.options?.temperature || 0.7,
        max_tokens: request.options?.maxTokens || 4096,
        model: config.deepseek.model,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const assistantMessage = response.choices[0]?.message?.content || '';
      const usage = response.usage;

      // Save interaction to memory
      const interaction: AgentInteraction = {
        timestamp: new Date(),
        input: request.query,
        output: assistantMessage,
        type: 'QUERY',
        confidence: 0.8,
      };

      await agentContextManager.saveContext(
        request.agentType,
        {
          ...request.context,
          sessionId,
        },
        {
          projectId: request.context.projectId,
          userId: request.context.userId,
          productClassId: request.context.productClassId,
          interactions: [interaction],
        }
      );

      memoryUpdated = true;

      return {
        agentType: request.agentType,
        response: assistantMessage,
        confidence: 0.8,
        memoryUpdated,
        metadata: {
          tokensUsed: usage?.total_tokens,
          executionTime: Date.now() - startTime,
          model: response.model,
        },
      };
    } catch (error) {
      return {
        agentType: request.agentType,
        response: `Произошла ошибка при обработке запроса: ${(error as Error).message}`,
        confidence: 0,
        memoryUpdated,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Build message list with system prompt and context
   */
  private buildMessages(
    agentType: AgentType,
    userQuery: string,
    existingContext: AgentMemoryData | null,
    currentContext: AgentContext
  ): LLMMessage[] {
    const messages: LLMMessage[] = [];

    // System prompt
    const systemPrompt = this.buildSystemPrompt(agentType, existingContext, currentContext);
    messages.push({
      role: 'system',
      content: systemPrompt,
    });

    // Add recent interactions from context (last 5)
    if (existingContext?.interactions && existingContext.interactions.length > 0) {
      const recentInteractions = existingContext.interactions.slice(-5);
      for (const interaction of recentInteractions) {
        messages.push({
          role: 'user',
          content: interaction.input,
        });
        messages.push({
          role: 'assistant',
          content: interaction.output,
        });
      }
    }

    // Current query
    messages.push({
      role: 'user',
      content: userQuery,
    });

    return messages;
  }

  /**
   * Build system prompt with context
   */
  private buildSystemPrompt(
    agentType: AgentType,
    existingContext: AgentMemoryData | null,
    currentContext: AgentContext
  ): string {
    let prompt = AGENT_PROMPTS[agentType];

    // Add project context if available
    if (currentContext.projectId) {
      prompt += '\n\nТекущий контекст проекта:\n';
      prompt += `- ID проекта: ${currentContext.projectId}`;
      if (currentContext.stage) {
        prompt += `\n- Стадия: ${currentContext.stage}`;
      }
    }

    // Add recent decisions from memory
    if (existingContext?.decisions && existingContext.decisions.length > 0) {
      const recentDecisions = existingContext.decisions.slice(-3);
      if (recentDecisions.length > 0) {
        prompt += '\n\nНедавние решения:\n';
        for (const decision of recentDecisions) {
          prompt += `- [${decision.type}] ${decision.decision} (${decision.rationale})\n`;
        }
      }
    }

    // Add learnings from memory
    if (existingContext?.learnings && existingContext.learnings.length > 0) {
      const importantLearnings = existingContext.learnings
        .filter((l) => l.importance > 0.7)
        .slice(-3);
      if (importantLearnings.length > 0) {
        prompt += '\n\nКлючевые выводы:\n';
        for (const learning of importantLearnings) {
          prompt += `- ${learning.topic}: ${learning.insight}\n`;
        }
      }
    }

    prompt += '\n\nОтвечай на русском языке. Будь конкретным и структурированным.';

    return prompt;
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    return this.provider.isAvailable();
  }

  /**
   * Get supported agent types
   */
  getSupportedAgentTypes(): AgentType[] {
    return Object.keys(AGENT_PROMPTS) as AgentType[];
  }
}

export const agentOrchestrator = new AgentOrchestrator();
