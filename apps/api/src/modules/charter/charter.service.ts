/**
 * Charter Service
 * Business logic for charter templates and project blocks
 */

import type { Prisma, Project, TemplateBlock, ProjectBlock, $Enums } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { getSettingByKey } from '../settings/settings.service';

// Extended types for includes
type ProjectWithCharter = Project & {
  equipmentTypes?: Array<{
    id: string;
    templateBlocks: TemplateBlock[];
  }>;
  blocks?: Array<ProjectBlock & { templateBlock: TemplateBlock }>;
};

export class CharterService {
  // ==========================================
  // TEMPLATE BLOCKS (для редактора шаблонов - админ)
  // ==========================================

  async getTemplateBlocks(equipmentTypeId: string): Promise<TemplateBlock[]> {
    logger.debug({ equipmentTypeId }, 'Getting template blocks');

    return prisma.templateBlock.findMany({
      where: { equipmentTypeId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createTemplateBlock(data: {
    equipmentTypeId: string;
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
  }): Promise<TemplateBlock> {
    logger.debug({ name: data.name }, 'Creating template block');

    const block = await prisma.templateBlock.create({
      data: {
        equipmentTypeId: data.equipmentTypeId,
        name: data.name,
        icon: data.icon,
        description: data.description,
        blockType: data.blockType as $Enums.CharterBlockType,
        isRequired: data.isRequired ?? true,
        sortOrder: data.sortOrder ?? 0,
        aiEnabled: data.aiEnabled ?? true,
        aiPrompt: data.aiPrompt,
        aiModel: data.aiModel ?? 'deepseek',
        fieldSchema: data.fieldSchema ? (data.fieldSchema as Prisma.JsonObject) : {},
        defaultValues: data.defaultValues as Prisma.JsonObject | undefined,
      },
    });

    logger.info({ id: block.id, name: block.name }, 'Template block created');
    return block;
  }

  async updateTemplateBlock(
    id: string,
    data: {
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
    }
  ): Promise<TemplateBlock> {
    logger.debug({ id }, 'Updating template block');

    const block = await prisma.templateBlock.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
        description: data.description,
        blockType: data.blockType as $Enums.CharterBlockType | undefined,
        isRequired: data.isRequired,
        sortOrder: data.sortOrder,
        aiEnabled: data.aiEnabled,
        aiPrompt: data.aiPrompt,
        aiModel: data.aiModel,
        fieldSchema: data.fieldSchema ? (data.fieldSchema as Prisma.JsonObject) : undefined,
        defaultValues: data.defaultValues as Prisma.JsonObject | undefined,
      },
    });

    logger.info({ id }, 'Template block updated');
    return block;
  }

  async deleteTemplateBlock(id: string): Promise<{ success: boolean }> {
    logger.debug({ id }, 'Deleting template block');

    await prisma.templateBlock.delete({
      where: { id },
    });

    logger.info({ id }, 'Template block deleted');
    return { success: true };
  }

  async reorderBlocks(blocks: { id: string; sortOrder: number }[]): Promise<{ success: boolean }> {
    logger.debug({ count: blocks.length }, 'Reordering blocks');

    await Promise.all(
      blocks.map((b) =>
        prisma.templateBlock.update({
          where: { id: b.id },
          data: { sortOrder: b.sortOrder },
        })
      )
    );

    logger.info('Blocks reordered');
    return { success: true };
  }

  // ==========================================
  // PROJECT BLOCKS (для устава конкретного проекта)
  // ==========================================

  async getProjectCharter(projectId: string): Promise<ProjectWithCharter> {
    logger.debug({ projectId }, 'Getting project charter');

    // Получить проект с типом оборудования
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        equipmentTypes: {
          include: {
            templateBlocks: {
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        blocks: {
          include: { templateBlock: true },
          orderBy: {
            templateBlock: {
              sortOrder: 'asc',
            },
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Получаем первый equipmentType (для простоты)
    const equipmentType = project.equipmentTypes?.[0];

    // Если есть тип оборудования - создать недостающие блоки
    if (equipmentType) {
      const existingBlockIds = new Set(project.blocks?.map((b) => b.templateBlockId) || []);
      const missingBlocks = equipmentType.templateBlocks.filter(
        (tb: TemplateBlock) => !existingBlockIds.has(tb.id)
      );

      if (missingBlocks.length > 0) {
        logger.debug({ count: missingBlocks.length }, 'Creating missing project blocks');

        await Promise.all(
          missingBlocks.map((tb: TemplateBlock) =>
            prisma.projectBlock.create({
              data: {
                projectId,
                templateBlockId: tb.id,
                updatedBy: project.ownerId,
              },
            })
          )
        );

        // Перезагрузить с новыми блоками
        return this.getProjectCharter(projectId);
      }
    }

    return project as ProjectWithCharter;
  }

  async updateProjectBlock(
    blockId: string,
    userId: string,
    data: {
      data?: unknown;
      aiHistory?: unknown;
      aiFlags?: unknown;
      status?: string;
    }
  ): Promise<ProjectBlock> {
    logger.debug({ blockId }, 'Updating project block');

    const block = await prisma.projectBlock.update({
      where: { id: blockId },
      data: {
        data: data.data ? (data.data as Prisma.JsonObject) : undefined,
        aiHistory: data.aiHistory ? (data.aiHistory as Prisma.JsonArray) : undefined,
        aiFlags: data.aiFlags ? (data.aiFlags as Prisma.JsonArray) : undefined,
        status: data.status as $Enums.ProjectBlockStatus | undefined,
        updatedBy: userId,
      },
    });

    logger.info({ blockId }, 'Project block updated');
    return block;
  }

  async saveAiMessage(
    blockId: string,
    userId: string,
    message: {
      role: 'user' | 'assistant';
      content: string;
      flags?: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }>;
    }
  ): Promise<ProjectBlock> {
    logger.debug({ blockId, role: message.role }, 'Saving AI message');

    const block = await prisma.projectBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      throw new Error('Block not found');
    }

    const history = (block.aiHistory as Array<unknown>) || [];
    const flags = (block.aiFlags as Array<unknown>) || [];

    const newHistory = [
      ...history,
      {
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString(),
      },
    ];

    const newFlags = message.flags ? [...flags, ...message.flags] : flags;

    const updated = await prisma.projectBlock.update({
      where: { id: blockId },
      data: {
        aiHistory: newHistory as Prisma.JsonArray,
        aiFlags: newFlags as Prisma.JsonArray,
        updatedBy: userId,
        status: 'IN_PROGRESS',
      },
    });

    logger.info({ blockId }, 'AI message saved');
    return updated;
  }

  /**
   * AI Chat через backend (ключ из БД, не из .env)
   */
  async aiChat(
    blockId: string,
    _userId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    blockContext?: Record<string, unknown>
  ): Promise<{
    text: string;
    flags?: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }>;
  }> {
    logger.debug({ blockId }, 'AI chat started');

    // Получить конфиг AI из БД (не из .env!)
    const provider = (await getSettingByKey('ai.provider'))?.value || 'deepseek';
    const model =
      (await getSettingByKey('ai.model'))?.value ||
      (await getSettingByKey('ai.default_model'))?.value ||
      'deepseek-chat';
    const apiKey =
      (await getSettingByKey('ai.api_key'))?.value ||
      (await getSettingByKey(`ai.${provider}.api_key`))?.value;
    const maxTokens = parseInt((await getSettingByKey('ai.max_tokens'))?.value || '1000');

    if (!apiKey) {
      throw new Error(
        'AI-ассистент не настроен. Администратор должен добавить API ключ в /admin/settings'
      );
    }

    // Получить блок с промптом
    const block = await prisma.projectBlock.findUnique({
      where: { id: blockId },
      include: { templateBlock: true },
    });

    if (!block) {
      throw new Error('Блок не найден');
    }

    const systemPrompt =
      block.templateBlock?.aiPrompt ||
      'Ты AI-ассистент для R&D проектов FELETI. Помогай инженеру заполнять устав. Отвечай на русском.';

    // API URLs для разных провайдеров
    const apiUrls: Record<string, string> = {
      anthropic: 'https://api.anthropic.com/v1/messages',
      openai: 'https://api.openai.com/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
      kimi: 'https://api.moonshot.cn/v1/chat/completions',
    };

    const apiUrl = apiUrls[provider] || apiUrls['deepseek'];
    if (!apiUrl) {
      throw new Error(`Неизвестный провайдер AI: ${provider}`);
    }

    // Формируем запрос в зависимости от провайдера
    let requestBody: Record<string, unknown>;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const messages = [...history, { role: 'user', content: message }];

    const contextStr = blockContext ? JSON.stringify(blockContext, null, 2) : '{}';
    const fullSystemPrompt = `${systemPrompt}\n\nКонтекст блока:\n${contextStr}\n\nИспользуй флаги для рисков: FLAG:red:Заголовок:Описание или FLAG:yellow:... или FLAG:green:...`;

    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      requestBody = {
        model,
        max_tokens: maxTokens,
        system: fullSystemPrompt,
        messages,
      };
    } else {
      // OpenAI-совместимый формат (OpenAI, DeepSeek, Kimi)
      headers['Authorization'] = `Bearer ${apiKey}`;
      requestBody = {
        model,
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: fullSystemPrompt }, ...messages],
      };
    }

    // Отправляем запрос к AI API
    const response = await fetch(apiUrl as string, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'AI API error');
      throw new Error(`AI API ошибка: ${response.status} ${errorText}`);
    }

    const aiData = (await response.json()) as Record<string, unknown>;

    // Парсим ответ в зависимости от провайдера
    let aiText = '';
    if (provider === 'anthropic') {
      const content = aiData['content'] as Array<{ text?: string }> | undefined;
      aiText = content && content[0]?.text ? content[0].text : '';
    } else {
      const choices = aiData['choices'] as Array<{ message?: { content?: string } }> | undefined;
      aiText = choices && choices[0]?.message?.content ? choices[0].message.content : '';
    }

    // Парсим флаги рисков
    const flagRegex = /FLAG:(red|yellow|green):([^:]+):(.+?)(?=FLAG:|$)/g;
    const flags: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }> = [];
    let match;
    while ((match = flagRegex.exec(aiText)) !== null) {
      if (match[1] && match[2] && match[3]) {
        flags.push({
          level: match[1] as 'red' | 'yellow' | 'green',
          title: match[2].trim(),
          text: match[3].trim(),
        });
      }
    }
    const cleanText = aiText.replace(flagRegex, '').trim();

    // NOTE: Сохранение сообщений делает frontend через отдельный endpoint /ai-message
    // чтобы избежать дублирования

    logger.info({ blockId, flags: flags.length }, 'AI chat completed');
    return { text: cleanText, flags };
  }
}

export const charterService = new CharterService();
