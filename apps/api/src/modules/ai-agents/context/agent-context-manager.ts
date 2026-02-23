/**
 * Agent Context Manager
 *
 * Manages AI agent memory and context persistence
 * Uses Prisma to store agent memories
 */

import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../lib/prisma';

// Re-export types for this module
export interface AgentContext {
  projectId?: string;
  userId?: string;
  productClassId?: string;
  stage?: string;
  previousInteractions?: AgentInteraction[];
  decisions?: AgentDecision[];
  learnings?: AgentLearning[];
  sessionId?: string;
}

export interface AgentInteraction {
  timestamp: Date;
  input: string;
  output: string;
  type: 'QUERY' | 'ANALYSIS' | 'RECOMMENDATION' | 'VALIDATION';
  confidence?: number;
}

export interface AgentDecision {
  timestamp: Date;
  type: string;
  decision: string;
  rationale: string;
  confidence: number;
  parameters?: Record<string, unknown>;
}

export interface AgentLearning {
  timestamp: Date;
  topic: string;
  insight: string;
  source: 'INTERACTION' | 'FEEDBACK' | 'OUTCOME';
  importance: number;
}

export type AgentType =
  | 'PORTFOLIO'
  | 'PRODUCT_DEFINITION'
  | 'REQUIREMENTS'
  | 'ARCHITECTURE'
  | 'VALIDATION'
  | 'CALCULATION'
  | 'OPTIMIZATION'
  | 'RISK_ANALYSIS';

export interface AgentMemoryData {
  context: AgentContext;
  decisions: AgentDecision[];
  learnings: AgentLearning[];
  interactions: AgentInteraction[];
}

export class AgentContextManager {
  private defaultTTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Create or update agent memory
   */
  async saveContext(
    agentType: AgentType,
    context: AgentContext,
    options?: {
      projectId?: string;
      userId?: string;
      productClassId?: string;
      decisions?: AgentDecision[];
      learnings?: AgentLearning[];
      interactions?: AgentInteraction[];
      expiresIn?: number; // milliseconds
    }
  ): Promise<string> {
    const sessionId = context.sessionId || uuidv4();
    const expiresAt = options?.expiresIn
      ? new Date(Date.now() + options.expiresIn)
      : new Date(Date.now() + this.defaultTTL);

    // Check if memory exists
    const existing = await prisma.agentMemory.findFirst({
      where: {
        agentType,
        projectId: options?.projectId,
        userId: options?.userId,
        sessionId,
      },
    });

    if (existing) {
      // Update existing memory
      const currentData = existing.context as unknown as AgentMemoryData;
      const updatedData: AgentMemoryData = {
        context,
        decisions: [...(currentData.decisions || []), ...(options?.decisions || [])],
        learnings: [...(currentData.learnings || []), ...(options?.learnings || [])],
        interactions: [...(currentData.interactions || []), ...(options?.interactions || [])],
      };

      return (
        await prisma.agentMemory.update({
          where: { id: existing.id },
          data: {
            context: updatedData as unknown as Prisma.InputJsonValue,
            decisions: updatedData.decisions as unknown as Prisma.InputJsonValue,
            learnings: updatedData.learnings as unknown as Prisma.InputJsonValue,
            interactions: updatedData.interactions as unknown as Prisma.InputJsonValue,
            expiresAt,
            updatedAt: new Date(),
          },
        })
      ).id;
    }

    // Create new memory
    const memoryData: AgentMemoryData = {
      context,
      decisions: options?.decisions || [],
      learnings: options?.learnings || [],
      interactions: options?.interactions || [],
    };

    const memory = await prisma.agentMemory.create({
      data: {
        agentType,
        projectId: options?.projectId,
        userId: options?.userId,
        productClassId: options?.productClassId,
        sessionId,
        context: memoryData as unknown as Prisma.InputJsonValue,
        decisions: memoryData.decisions as unknown as Prisma.InputJsonValue,
        learnings: memoryData.learnings as unknown as Prisma.InputJsonValue,
        interactions: memoryData.interactions as unknown as Prisma.InputJsonValue,
        expiresAt,
        version: 1,
      },
    });

    return memory.id;
  }

  /**
   * Get agent memory by session
   */
  async getContext(
    agentType: AgentType,
    sessionId: string,
    options?: {
      projectId?: string;
      userId?: string;
    }
  ): Promise<AgentMemoryData | null> {
    const memory = await prisma.agentMemory.findFirst({
      where: {
        agentType,
        projectId: options?.projectId,
        userId: options?.userId,
        sessionId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!memory) {
      return null;
    }

    return {
      context: memory.context as unknown as AgentContext,
      decisions: memory.decisions as unknown as AgentDecision[],
      learnings: memory.learnings as unknown as AgentLearning[],
      interactions: memory.interactions as unknown as AgentInteraction[],
    };
  }

  /**
   * Get all memories for a project
   */
  async getProjectMemories(projectId: string, agentType?: AgentType): Promise<AgentMemoryData[]> {
    const memories = await prisma.agentMemory.findMany({
      where: {
        projectId,
        agentType: agentType,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    return memories.map((memory) => ({
      context: memory.context as unknown as AgentContext,
      decisions: memory.decisions as unknown as AgentDecision[],
      learnings: memory.learnings as unknown as AgentLearning[],
      interactions: memory.interactions as unknown as AgentInteraction[],
    }));
  }

  /**
   * Add a new interaction to memory
   */
  async addInteraction(memoryId: string, interaction: AgentInteraction): Promise<void> {
    const memory = await prisma.agentMemory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      throw new Error('Memory not found');
    }

    const currentInteractions = memory.interactions as unknown as AgentInteraction[];
    await prisma.agentMemory.update({
      where: { id: memoryId },
      data: {
        interactions: [...currentInteractions, interaction] as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add a decision to memory
   */
  async addDecision(memoryId: string, decision: AgentDecision): Promise<void> {
    const memory = await prisma.agentMemory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      throw new Error('Memory not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentDecisions = (memory.decisions as any as AgentDecision[]) || [];
    const updatedDecisions = [...currentDecisions, decision];

    await prisma.agentMemory.update({
      where: { id: memoryId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        decisions: updatedDecisions as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Add a learning to memory
   */
  async addLearning(memoryId: string, learning: AgentLearning): Promise<void> {
    const memory = await prisma.agentMemory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) {
      throw new Error('Memory not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentLearnings = (memory.learnings as any as AgentLearning[]) || [];
    const updatedLearnings = [...currentLearnings, learning];

    await prisma.agentMemory.update({
      where: { id: memoryId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        learnings: updatedLearnings as any,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Clear expired memories
   */
  async clearExpired(): Promise<number> {
    const result = await prisma.agentMemory.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Clear all memories for a project
   */
  async clearProjectMemories(projectId: string): Promise<number> {
    const result = await prisma.agentMemory.deleteMany({
      where: { projectId },
    });

    return result.count;
  }
}

export const agentContextManager = new AgentContextManager();
