/**
 * AI Providers Service
 * Управление мульти-провайдерной AI инфраструктурой
 */

import { prisma } from '../../lib/prisma';
import { getSettingByKey, getAIApiKeys } from '../settings/settings.service';

// Types
export interface AIProvider {
  id: string;
  providerCode: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiEndpoint: string | null;
  defaultModel: string | null;
  maxTokens: number | null;
  temperature: number;
  capabilities: {
    research?: boolean;
    vision?: boolean;
    longContext?: boolean;
    search?: boolean;
  };
}

export interface BlockAIConfig {
  templateBlockId: string | null;
  primaryProvider: string | null;
  fallbackProvider?: string;
  customSystemPrompt?: string;
  temperature: number;
  enableResearch: boolean;
  maxKbDocs: number;
}

export interface FallbackChain {
  providers: string[];
  currentIndex: number;
}

/**
 * Get all AI provider configurations
 */
export async function getAllProviders(): Promise<AIProvider[]> {
  const configs = await prisma.aIProviderConfig.findMany({
    orderBy: [{ priority: 'asc' }, { name: 'asc' }],
  });

  return configs.map((config) => ({
    ...config,
    temperature: config.temperature ?? 0.7,
    capabilities: (config.capabilities as Record<string, boolean>) || {},
  }));
}

/**
 * Get enabled providers only
 */
export async function getEnabledProviders(): Promise<AIProvider[]> {
  const configs = await prisma.aIProviderConfig.findMany({
    where: { enabled: true },
    orderBy: { priority: 'asc' },
  });

  return configs.map((config) => ({
    ...config,
    temperature: config.temperature ?? 0.7,
    capabilities: (config.capabilities as Record<string, boolean>) || {},
  }));
}

/**
 * Get provider by code
 */
export async function getProviderByCode(
  providerCode: string
): Promise<AIProvider | null> {
  const config = await prisma.aIProviderConfig.findUnique({
    where: { providerCode },
  });

  if (!config) return null;

  return {
    ...config,
    temperature: config.temperature ?? 0.7,
    capabilities: (config.capabilities as Record<string, boolean>) || {},
  };
}

/**
 * Get AI configuration for a template block
 */
export async function getBlockAIConfig(
  templateBlockId: string
): Promise<BlockAIConfig | null> {
  const assignment = await prisma.blockAIAssignment.findUnique({
    where: { templateBlockId },
  });

  if (!assignment) return null;

  return {
    templateBlockId: assignment.templateBlockId,
    primaryProvider: assignment.primaryProvider,
    fallbackProvider: assignment.fallbackProvider || undefined,
    customSystemPrompt: assignment.customSystemPrompt || undefined,
    temperature: assignment.temperature ?? 0.7,
    enableResearch: assignment.enableResearch,
    maxKbDocs: assignment.maxKbDocs,
  };
}

/**
 * Create or update AI configuration for a block
 */
export async function upsertBlockAIConfig(
  templateBlockId: string,
  config: Partial<BlockAIConfig>
): Promise<BlockAIConfig> {
  const assignment = await prisma.blockAIAssignment.upsert({
    where: { templateBlockId },
    create: {
      blockId: templateBlockId,
      templateBlockId,
      taskType: 'generate',
      primaryProvider: config.primaryProvider || 'deepseek',
      fallbackProvider: config.fallbackProvider,
      customSystemPrompt: config.customSystemPrompt,
      temperature: config.temperature ?? 0.7,
      enableResearch: config.enableResearch ?? false,
      maxKbDocs: config.maxKbDocs ?? 5,
    },
    update: {
      primaryProvider: config.primaryProvider,
      fallbackProvider: config.fallbackProvider,
      customSystemPrompt: config.customSystemPrompt,
      temperature: config.temperature ?? 0.7,
      enableResearch: config.enableResearch,
      maxKbDocs: config.maxKbDocs,
    },
  });

  return {
    templateBlockId: assignment.templateBlockId,
    primaryProvider: assignment.primaryProvider,
    fallbackProvider: assignment.fallbackProvider || undefined,
    customSystemPrompt: assignment.customSystemPrompt || undefined,
    temperature: assignment.temperature ?? 0.7,
    enableResearch: assignment.enableResearch,
    maxKbDocs: assignment.maxKbDocs,
  };
}

/**
 * Get fallback chain from settings
 */
export async function getFallbackChain(): Promise<string[]> {
  const chainSetting = await getSettingByKey('ai.fallback_chain');
  if (!chainSetting?.value) {
    // Default chain
    return ['kimi', 'qwen', 'deepseek'];
  }
  return chainSetting.value.split(',').map((p) => p.trim()).filter(Boolean);
}

/**
 * Get research provider from settings
 */
export async function getResearchProvider(): Promise<string> {
  const setting = await getSettingByKey('ai.research_provider');
  return setting?.value || 'kimi';
}

/**
 * Check if auto-fallback is enabled
 */
export async function isAutoFallbackEnabled(): Promise<boolean> {
  const setting = await getSettingByKey('ai.auto_fallback_enabled');
  return setting?.value === 'true';
}

/**
 * Get next provider in fallback chain
 */
export async function getNextFallbackProvider(
  currentProvider: string
): Promise<string | null> {
  const chain = await getFallbackChain();
  const currentIndex = chain.indexOf(currentProvider);

  if (currentIndex === -1 || currentIndex >= chain.length - 1) {
    return null;
  }

  return chain[currentIndex + 1] || null;
}

/**
 * Get API key for provider
 */
export async function getProviderApiKey(providerCode: string): Promise<string | null> {
  const keys = await getAIApiKeys();
  return keys[providerCode] || null;
}

/**
 * Check if provider is available (has API key and enabled)
 */
export async function isProviderAvailable(providerCode: string): Promise<boolean> {
  const [provider, apiKey] = await Promise.all([
    getProviderByCode(providerCode),
    getProviderApiKey(providerCode),
  ]);

  return !!provider?.enabled && !!apiKey;
}

/**
 * Get best available provider (for smart fallback)
 * Returns provider with highest priority that has API key configured
 */
export async function getBestAvailableProvider(): Promise<string | null> {
  const providers = await getEnabledProviders();
  const keys = await getAIApiKeys();

  for (const provider of providers) {
    if (keys[provider.providerCode]) {
      return provider.providerCode;
    }
  }

  return null;
}

/**
 * Get all AI configs for equipment type
 */
export async function getConfigsByEquipmentType(
  equipmentTypeId: string
): Promise<Array<BlockAIConfig & { blockName: string }>> {
  const assignments = await prisma.blockAIAssignment.findMany({
    where: {
      templateBlock: {
        equipmentTypeId,
      },
    },
    include: {
      templateBlock: {
        select: {
          name: true,
        },
      },
    },
  });

  return assignments
    .filter((a): a is typeof a & { templateBlockId: string; templateBlock: { name: string } } => 
      a.templateBlockId !== null && a.templateBlock !== null)
    .map((a) => ({
      templateBlockId: a.templateBlockId,
      blockName: a.templateBlock.name,
      primaryProvider: a.primaryProvider,
      fallbackProvider: a.fallbackProvider || undefined,
      customSystemPrompt: a.customSystemPrompt || undefined,
      temperature: Number(a.temperature),
      enableResearch: a.enableResearch,
      maxKbDocs: a.maxKbDocs,
    }));
}

/**
 * Initialize default assignments for all blocks of an equipment type
 */
export async function initializeBlockAssignments(
  equipmentTypeId: string,
  defaultProvider: string = 'deepseek'
): Promise<number> {
  const blocks = await prisma.templateBlock.findMany({
    where: { equipmentTypeId },
    select: { id: true },
  });

  let count = 0;
  for (const block of blocks) {
    const existing = await prisma.blockAIAssignment.findUnique({
      where: { templateBlockId: block.id },
    });

    if (!existing) {
      await prisma.blockAIAssignment.create({
        data: {
          blockId: block.id,
          templateBlockId: block.id,
          taskType: 'generate',
          primaryProvider: defaultProvider,
          temperature: 0.7,
          enableResearch: false,
          maxKbDocs: 5,
        },
      });
      count++;
    }
  }

  return count;
}
