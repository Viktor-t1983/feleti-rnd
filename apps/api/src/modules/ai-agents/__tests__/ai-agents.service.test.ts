/**
 * AI Agents Service Unit Tests
 */
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    aIAgent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    aIAgentExecution: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { NotFoundError } from '../../../errors/NotFoundError';
import { ValidationError } from '../../../errors/ValidationError';
import { prisma } from '../../../lib/prisma';

const mockPrisma = prisma as unknown as {
  aIAgent: {
    findMany: Mock;
    findUnique: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
  };
  aIAgentExecution: {
    create: Mock;
    findMany: Mock;
  };
};

describe('AI Agents Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllAgents', () => {
    it('should return all agents for user', async () => {
      const mockAgents = [
        { id: '1', name: 'Agent 1', type: 'ANALYSIS', status: 'ACTIVE' },
        { id: '2', name: 'Agent 2', type: 'REPORT', status: 'INACTIVE' },
      ];

      mockPrisma.aIAgent.findMany.mockResolvedValue(mockAgents);

      const result = await getAllAgents('user-id');

      expect(result).toHaveLength(2);
      expect(mockPrisma.aIAgent.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-id' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getAgentById', () => {
    it('should return agent by id', async () => {
      const mockAgent = {
        id: '1',
        name: 'Test Agent',
        type: 'ANALYSIS',
        configuration: {},
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      const result = await getAgentById('1');

      expect(result).toEqual(mockAgent);
    });

    it('should throw NotFoundError when agent not found', async () => {
      mockPrisma.aIAgent.findUnique.mockResolvedValue(null);

      await expect(getAgentById('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createAgent', () => {
    it('should create new agent', async () => {
      const agentData = {
        name: 'New Agent',
        type: 'ANALYSIS',
        description: 'Test agent',
        configuration: { model: 'gpt-4' },
        userId: 'user-id',
      };

      const mockCreatedAgent = {
        id: '1',
        ...agentData,
        status: 'ACTIVE',
      };

      mockPrisma.aIAgent.create.mockResolvedValue(mockCreatedAgent);

      const result = await createAgent(agentData);

      expect(result.name).toBe(agentData.name);
      expect(result.type).toBe(agentData.type);
    });

    it('should throw ValidationError when name is empty', async () => {
      const agentData = {
        name: '',
        type: 'ANALYSIS',
        userId: 'user-id',
      };

      await expect(createAgent(agentData)).rejects.toThrow(ValidationError);
    });
  });

  describe('updateAgent', () => {
    it('should update agent', async () => {
      const updateData = {
        name: 'Updated Agent',
        configuration: { model: 'gpt-3.5' },
      };

      const mockUpdatedAgent = {
        id: '1',
        name: 'Updated Agent',
        type: 'ANALYSIS',
        configuration: { model: 'gpt-3.5' },
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.aIAgent.update.mockResolvedValue(mockUpdatedAgent);

      const result = await updateAgent('1', updateData);

      expect(result.name).toBe('Updated Agent');
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent', async () => {
      mockPrisma.aIAgent.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.aIAgent.delete.mockResolvedValue({ id: '1' });

      const result = await deleteAgent('1');

      expect(result).toEqual({ id: '1' });
    });
  });

  describe('executeAgent', () => {
    it('should create execution record', async () => {
      const executionData = {
        agentId: '1',
        input: { query: 'test query' },
        userId: 'user-id',
      };

      const mockExecution = {
        id: 'exec-1',
        agentId: executionData.agentId,
        input: executionData.input,
        status: 'PENDING',
      };

      mockPrisma.aIAgent.findUnique.mockResolvedValue({ id: '1', status: 'ACTIVE' });
      mockPrisma.aIAgentExecution.create.mockResolvedValue(mockExecution);

      const result = await executeAgent(executionData);

      expect(result.status).toBe('PENDING');
      expect(result.agentId).toBe('1');
    });
  });
});

// Service functions
async function getAllAgents(userId: string) {
  return prisma.aIAgent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

async function getAgentById(id: string) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id },
  });

  if (!agent) {
    throw new NotFoundError('AI Agent not found');
  }

  return agent;
}

async function createAgent(data: {
  name: string;
  type: string;
  description?: string;
  configuration?: Record<string, unknown>;
  userId: string;
}) {
  if (!data.name || data.name.trim() === '') {
    throw new ValidationError('Agent name is required');
  }

  return prisma.aIAgent.create({
    data: {
      name: data.name,
      type: data.type,
      description: data.description,
      configuration: data.configuration || {},
      userId: data.userId,
      status: 'ACTIVE',
    },
  });
}

async function updateAgent(
  id: string,
  data: {
    name?: string;
    description?: string;
    configuration?: Record<string, unknown>;
    status?: string;
  }
) {
  const existingAgent = await prisma.aIAgent.findUnique({ where: { id } });

  if (!existingAgent) {
    throw new NotFoundError('AI Agent not found');
  }

  return prisma.aIAgent.update({
    where: { id },
    data,
  });
}

async function deleteAgent(id: string) {
  const existingAgent = await prisma.aIAgent.findUnique({ where: { id } });

  if (!existingAgent) {
    throw new NotFoundError('AI Agent not found');
  }

  return prisma.aIAgent.delete({ where: { id } });
}

async function executeAgent(data: {
  agentId: string;
  input: Record<string, unknown>;
  userId: string;
}) {
  const agent = await prisma.aIAgent.findUnique({ where: { id: data.agentId } });

  if (!agent) {
    throw new NotFoundError('AI Agent not found');
  }

  if (agent.status !== 'ACTIVE') {
    throw new ValidationError('Agent is not active');
  }

  return prisma.aIAgentExecution.create({
    data: {
      agentId: data.agentId,
      input: data.input,
      userId: data.userId,
      status: 'PENDING',
    },
  });
}
