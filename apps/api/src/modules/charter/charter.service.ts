/**
 * Charter Service
 * Business logic for charter templates and project blocks
 */

import type { Prisma, Project, TemplateBlock, ProjectBlock, $Enums } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import { logger } from '../../utils/logger';

import {
  getBlockAIConfig,
  getProviderByCode,
  getProviderApiKey,
  getNextFallbackProvider,
  isAutoFallbackEnabled,
  getResearchProvider,
} from '../ai/ai-providers.service';

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
        fieldSchema: data.fieldSchema as Prisma.JsonObject | undefined,
        defaultValues: data.defaultValues as Prisma.JsonObject | undefined,
      },
    });

    logger.info({ id: block.id, name: block.name }, 'Template block updated');
    return block;
  }

  async deleteTemplateBlock(id: string): Promise<void> {
    logger.debug({ id }, 'Deleting template block');
    
    // Check if there are related project blocks
    const relatedProjectBlocks = await prisma.projectBlock.findMany({
      where: { templateBlockId: id },
    });
    
    if (relatedProjectBlocks.length > 0) {
      // Delete related project blocks first
      await prisma.projectBlock.deleteMany({
        where: { templateBlockId: id },
      });
      logger.info({ id, count: relatedProjectBlocks.length }, 'Deleted related project blocks');
    }
    
    await prisma.templateBlock.delete({ where: { id } });
    logger.info({ id }, 'Template block deleted');
  }

  // ==========================================
  // PROJECT BLOCKS (для заполнения устава - инженер)
  // ==========================================

  async getProjectBlocks(projectId: string): Promise<
    Array<ProjectBlock & { templateBlock: TemplateBlock }>
  > {
    logger.debug({ projectId }, 'Getting project blocks');

    return prisma.projectBlock.findMany({
      where: { projectId },
      include: { templateBlock: true },
      orderBy: { templateBlock: { sortOrder: 'asc' } },
    });
  }

  async updateProjectBlock(
    blockId: string,
    data: {
      data?: Record<string, unknown>;
      aiHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      aiFlags?: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }>;
      status?: $Enums.ProjectBlockStatus;
      updatedBy: string;
    }
  ): Promise<ProjectBlock> {
    logger.debug({ blockId }, 'Updating project block');

    const block = await prisma.projectBlock.update({
      where: { id: blockId },
      data: {
        data: data.data as Prisma.JsonObject | undefined,
        aiHistory: data.aiHistory as Prisma.JsonArray | undefined,
        aiFlags: data.aiFlags as Prisma.JsonArray | undefined,
        status: data.status,
        updatedBy: data.updatedBy,
        updatedAt: new Date(),
      },
    });

    logger.info({ blockId, status: data.status }, 'Project block updated');
    return block;
  }

  // ==========================================
  // PROJECT CHARTER (инициализация блоков)
  // ==========================================

  /**
   * Инициализировать устав проекта из шаблонов оборудования
   * Принимает equipmentTypeId и создаёт блоки из template_blocks
   */
  async initializeProjectCharter(
    projectId: string,
    equipmentTypeId: string,
    userId: string
  ): Promise<Array<ProjectBlock & { templateBlock: TemplateBlock }>> {
    logger.info({ projectId, equipmentTypeId }, 'Initializing project charter from equipment type');

    const templateBlocks = await prisma.templateBlock.findMany({
      where: { equipmentTypeId },
      orderBy: { sortOrder: 'asc' },
    });

    if (templateBlocks.length === 0) {
      throw new Error('Нет шаблонов блоков для данного типа оборудования');
    }

    const projectBlocks = await Promise.all(
      templateBlocks.map((template) =>
        prisma.projectBlock.create({
          data: {
            projectId,
            templateBlockId: template.id,
            data: template.defaultValues || {},
            aiHistory: [],
            aiFlags: [],
            status: 'EMPTY',
            updatedBy: userId,
          },
          include: { templateBlock: true },
        })
      )
    );

    logger.info(
      { projectId, blockCount: projectBlocks.length },
      'Project charter initialized from template'
    );

    return projectBlocks;
  }

  // ==========================================
  // AI CHAT (с мульти-провайдерной поддержкой и fallback)
  // ==========================================

  private async callAIProvider(
    providerCode: string,
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    maxTokens: number
  ): Promise<{ text: string; provider: string }> {
    const provider = await getProviderByCode(providerCode);
    if (!provider) {
      throw new Error(`Провайдер ${providerCode} не найден`);
    }

    const apiKey = await getProviderApiKey(providerCode);
    if (!apiKey) {
      throw new Error(`API ключ для ${providerCode} не настроен`);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let requestBody: Record<string, unknown>;

    // Anthropic (Claude) uses different API format
    if (providerCode === 'claude' || providerCode === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      requestBody = {
        model: provider.defaultModel,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      };
    } else {
      // OpenAI-compatible format (DeepSeek, Kimi, Qwen, GLM, MiniMax, Perplexity)
      headers['Authorization'] = `Bearer ${apiKey}`;
      requestBody = {
        model: provider.defaultModel,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 300s timeout for long AI requests

    try {
      const response = await fetch(provider.apiEndpoint + '/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;

      // Parse response
      let text = '';
      if (providerCode === 'claude' || providerCode === 'anthropic') {
        const content = data['content'] as Array<{ text?: string }> | undefined;
        text = content?.[0]?.text || '';
      } else {
        const choices = data['choices'] as Array<{
          message?: { content?: string };
        }> | undefined;
        text = choices?.[0]?.message?.content || '';
      }

      return { text, provider: providerCode };
    } catch (error) {
      clearTimeout(timeout);
      throw error;
    }
  }

  private parseFlags(
    text: string
  ): {
    cleanText: string;
    flags: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }>;
  } {
    const flagRegex = /FLAG:(red|yellow|green):([^:]+):(.+?)(?=FLAG:|$)/g;
    const flags: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }> = [];
    let match;

    while ((match = flagRegex.exec(text)) !== null) {
      if (match[1] && match[2] && match[3]) {
        flags.push({
          level: match[1] as 'red' | 'yellow' | 'green',
          title: match[2].trim(),
          text: match[3].trim(),
        });
      }
    }

    const cleanText = text.replace(flagRegex, '').trim();
    return { cleanText, flags };
  }

  async aiChat(
    blockId: string,
    _userId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    blockContext?: Record<string, unknown>
  ): Promise<{
    text: string;
    flags?: Array<{ level: 'red' | 'yellow' | 'green'; title: string; text: string }>;
    provider?: string;
  }> {
    logger.debug({ blockId }, 'AI chat started');

    // Получаем блок с конфигурацией AI
    const block = await prisma.projectBlock.findUnique({
      where: { id: blockId },
      include: { 
        templateBlock: true,
        project: {
          select: { id: true, name: true }
        }
      },
    });

    if (!block) {
      throw new Error('Блок не найден');
    }

    // Формируем контекст из предыдущих блоков
    let charterContext = '';
    const currentSortOrder = block.templateBlock.sortOrder;
    logger.info({ blockId, projectId: block.projectId, sortOrder: currentSortOrder }, 'Loading charter context');

    if (currentSortOrder > 0) {
      const previousBlocks = await prisma.projectBlock.findMany({
        where: {
          projectId: block.projectId,
          templateBlock: {
            sortOrder: { lt: currentSortOrder },
          },
        },
        include: {
          templateBlock: {
            select: { name: true, sortOrder: true },
          },
        },
        orderBy: {
          templateBlock: { sortOrder: 'asc' },
        },
      });

      logger.info({ blockId, previousBlocksCount: previousBlocks.length }, 'Found previous blocks');
      
      if (previousBlocks.length > 0) {
        const projectName = block.project?.name || 'Проект';
        
        const contextParts = previousBlocks.map((pb) => {
          const blockName = pb.templateBlock.name;
          const data = pb.data as Record<string, unknown>;
          const history = pb.aiHistory as Array<{ role: string; content: string }>;
          
          // Формируем краткое описание данных блока
          let dataSummary = '';
          if (data && Object.keys(data).length > 0) {
            const nonEmptyFields = Object.entries(data)
              .filter(([_, v]) => v !== null && v !== '' && v !== undefined)
              .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
              .slice(0, 5);
            if (nonEmptyFields.length > 0) {
              dataSummary = `\n  Данные: ${nonEmptyFields.join('; ')}`;
            }
          }
          
          // Берём последние 2-3 сообщения из истории
          let chatSummary = '';
          if (history && history.length > 0) {
            const recentMessages = history.slice(-3);
            chatSummary = recentMessages
              .filter((m) => m.role === 'assistant' && m.content)
              .map((m) => m.content.slice(0, 200))
              .join('; ');
            if (chatSummary) {
              chatSummary = `\n  AI: ${chatSummary}...`;
            }
          }
          
          // Пропускаем пустые блоки
          if (!dataSummary && !chatSummary) {
            return null;
          }
          
          return `Блок "${blockName}":${dataSummary}${chatSummary}`;
        }).filter(Boolean);

        if (contextParts.length > 0) {
          charterContext = `\n\nКОНТЕКСТ УСТАВА ПРОЕКТА "${projectName}":\n${contextParts.join('\n\n')}\n\nИспользуй эти данные для ответов. Не повторяй уже выясненную информацию — опирайся на неё.`;
        }
      }
    }

    // Получаем AI конфиг для блока
    const aiConfig = await getBlockAIConfig(block.templateBlockId);

    // Определяем провайдера для использования
    const primaryProvider = aiConfig?.primaryProvider || block.templateBlock?.aiModel || 'deepseek';
    const fallbackProvider = aiConfig?.fallbackProvider;
    const enableResearch = aiConfig?.enableResearch || false;
    const maxTokens = 4096;

    // Если включен research и нужен веб-поиск
    let enrichedMessage = message;
    if (enableResearch) {
      const researchProviderCode = await getResearchProvider();
      const researchProvider = await getProviderByCode(researchProviderCode);

      if (researchProvider?.capabilities?.search || researchProvider?.capabilities?.research) {
        try {
          // Делаем research-запрос
          const researchResult = await this.callAIProvider(
            researchProviderCode,
            'Ты исследовательский ассистент. Найди актуальную информацию по запросу пользователя.',
            [{ role: 'user', content: message }],
            2000
          );
          enrichedMessage = `${message}\n\n[Данные из исследования]: ${researchResult.text}`;
          logger.debug({ blockId }, 'Research data added to message');
        } catch (error) {
          logger.warn({ blockId, error }, 'Research failed, continuing without it');
        }
      }
    }

    // Формируем системный промпт
    const basePrompt =
      block.templateBlock?.aiPrompt ||
      'Ты AI-ассистент для R&D проектов FELETI. Помогай инженеру заполнять устав. Отвечай на русском.';

    const contextStr = blockContext ? JSON.stringify(blockContext, null, 2) : '{}';
    let systemPrompt = `${basePrompt}\n\nКонтекст блока:\n${contextStr}\n\nВАЖНО: Твой ответ будет отрендерен через Markdown с поддержкой таблиц (GFM). Используй чистое Markdown форматирование:\n- Заголовки через ## (второй уровень)\n- Таблицы через | и ---\n- ВНУТРИ ЯЧЕЕК ТАБЛИЦЫ НЕ ИСПОЛЬЗУЙ <br> И НЕ ИСПОЛЬЗУЙ | КАК РАЗДЕЛИТЕЛЬ — используй перенос строки через простое \\n или нумерацию пунктов (1. текст, 2. текст)\n- Жирный текст через **\n- Списки через - или 1.\n- НЕ используй фразы вроде "Применяю к блоку..." или "Итог для блока:" - сразу структурированный контент.\n\nИспользуй флаги для рисков: FLAG:red:Заголовок:Описание или FLAG:yellow:... или FLAG:green:...`;
    
    // Добавляем контекст из предыдущих блоков устава
    if (charterContext) {
      systemPrompt = `${charterContext}\n\n${systemPrompt}`;
      logger.info({ blockId, contextLength: charterContext.length }, 'Charter context added to prompt');
    } else {
      logger.info({ blockId, sortOrder: currentSortOrder }, 'No charter context - first block or empty');
    }

    const messages = [...history, { role: 'user', content: enrichedMessage }];

    // Пробуем основного провайдера
    const providersToTry: string[] = [primaryProvider];

    // Добавляем fallback если включен
    const autoFallback = await isAutoFallbackEnabled();
    if (autoFallback && fallbackProvider) {
      providersToTry.push(fallbackProvider);
    }

    // Пробуем следующий в цепочке fallback если основной не сработал
    if (autoFallback) {
      const nextFallback = await getNextFallbackProvider(primaryProvider);
      if (nextFallback && !providersToTry.includes(nextFallback)) {
        providersToTry.push(nextFallback);
      }
    }

    let lastError: Error | null = null;

    for (const providerCode of providersToTry) {
      try {
        logger.debug({ blockId, provider: providerCode }, 'Trying AI provider');

        const { text, provider } = await this.callAIProvider(
          providerCode,
          systemPrompt,
          messages,
          maxTokens
        );

        const { cleanText, flags } = this.parseFlags(text);

        logger.info(
          { blockId, provider, flags: flags.length, fallbackUsed: providerCode !== primaryProvider },
          'AI chat completed'
        );

        return {
          text: cleanText,
          flags,
          provider,
        };
      } catch (error) {
        lastError = error as Error;
        logger.warn(
          { blockId, provider: providerCode, error: (error as Error).message },
          'AI provider failed, trying fallback'
        );
        continue;
      }
    }

    // Все провайдеры отказали
    logger.error({ blockId, error: lastError?.message }, 'All AI providers failed');
    throw new Error(
      `AI-ассистент временно недоступен. Попробуйте позже или обратитесь к администратору.\n\nОшибка: ${lastError?.message}`
    );
  }

  // ==========================================
  // ADDITIONAL METHODS (для обратной совместимости с routes)
  // ==========================================

  /**
   * Reorder template blocks
   */
  async reorderBlocks(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    logger.debug({ count: updates.length }, 'Reordering blocks');

    await prisma.$transaction(
      updates.map((update) =>
        prisma.templateBlock.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder },
        })
      )
    );

    logger.info('Blocks reordered');
  }

  /**
   * Get full project charter with blocks
   */
  async getProjectCharter(projectIdOrCode: string): Promise<{
    project: Project;
    blocks: Array<ProjectBlock & { templateBlock: TemplateBlock }>;
  }> {
    logger.debug({ projectId: projectIdOrCode }, 'Getting project charter');

    const [project, blocks] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectIdOrCode },
      }),
      this.getProjectBlocks(projectIdOrCode),
    ]);

    // Если не найден по id - пробуем по коду
    if (!project) {
      const byCode = await prisma.project.findUnique({
        where: { code: projectIdOrCode },
      });
      if (byCode) {
        const blocksByCode = await this.getProjectBlocks(byCode.id);
        return { project: byCode, blocks: blocksByCode };
      }
    }

    if (!project) {
      throw new Error('Проект не найден');
    }

    return { project, blocks };
  }

  /**
   * Save AI message to block history
   */
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
      throw new Error('Блок не найден');
    }

    // Update history
    const history = (block.aiHistory as Array<{ role: string; content: string }>) || [];
    history.push({
      role: message.role,
      content: message.content,
    });

    // Update flags if provided
    let flags = block.aiFlags as Array<{
      level: 'red' | 'yellow' | 'green';
      title: string;
      text: string;
    }>;
    if (message.flags && message.flags.length > 0) {
      flags = [...((flags as typeof message.flags) || []), ...message.flags];
    }

    const updated = await prisma.projectBlock.update({
      where: { id: blockId },
      data: {
        aiHistory: history as Prisma.JsonArray,
        aiFlags: flags as Prisma.JsonArray,
        updatedBy: userId,
      },
    });

    logger.info({ blockId }, 'AI message saved');
    return updated;
  }

  /**
   * Export project charter to PDF using Playwright (beautiful rendering)
   */
  async exportCharterToPdf(projectId: string): Promise<Buffer> {
    const { project, blocks } = await this.getProjectCharter(projectId);

    const chromium = require('playwright').chromium;
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const date = new Date().toLocaleDateString('ru-RU');

    // Generate HTML with proper styling
    let blocksHtml = '';
    for (const block of blocks) {
      const statusEmoji = block.status === 'DONE' ? '✅' : block.status === 'IN_PROGRESS' ? '⏳' : '⚪';
      const statusText = block.status === 'DONE' ? 'Завершён' : block.status === 'IN_PROGRESS' ? 'В процессе' : 'Не заполнен';
      
      const data = block.data as Record<string, unknown>;
      const content = data['content'] as string | undefined;
      const risks = data['risks'] as Array<{ level: string; title: string; text: string }> | undefined;
      const aiFlags = block.aiFlags as Array<{ level: string; title: string; text: string }>;

      // Parse simple Markdown for HTML
      let contentHtml = '';
      if (content) {
        contentHtml = this.parseSimpleMarkdown(content);
      }

      // Risks/flags
      let flagsHtml = '';
      const allFlags = [...(risks || []), ...(aiFlags || [])];
      if (allFlags.length > 0) {
        flagsHtml = '<div class="flags">';
        for (const flag of allFlags) {
          const icon = flag.level === 'red' ? '🚨' : flag.level === 'yellow' ? '⚠️' : '✅';
          const color = flag.level === 'red' ? '#dc2626' : flag.level === 'yellow' ? '#d97706' : '#16a34a';
          flagsHtml += `<div class="flag" style="color: ${color}">${icon} <strong>${flag.title}:</strong> ${flag.text}</div>`;
        }
        flagsHtml += '</div>';
      }

      blocksHtml += `
        <div class="block">
          <div class="block-header">
            <span class="status">${statusEmoji}</span>
            <h2>${block.templateBlock.name}</h2>
            <span class="status-text">${statusText}</span>
          </div>
          ${contentHtml ? `<div class="content">${contentHtml}</div>` : ''}
          ${flagsHtml}
        </div>
      `;
    }

    const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Устав проекта ${project.code}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a; 
      color: #f1f5f9; 
      padding: 40px;
      font-size: 12px;
      line-height: 1.5;
    }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #334155; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #f1f5f9; margin-bottom: 8px; }
    .header .subtitle { font-size: 16px; color: #94a3b8; }
    .header .date { font-size: 12px; color: #64748b; margin-top: 8px; }
    
    .block { 
      background: #1e293b; 
      border-radius: 8px; 
      padding: 20px; 
      margin-bottom: 20px;
      border: 1px solid #334155;
    }
    .block-header { 
      display: flex; 
      align-items: center; 
      gap: 10px; 
      margin-bottom: 16px;
      border-bottom: 1px solid #334155;
      padding-bottom: 12px;
    }
    .block-header .status { font-size: 20px; }
    .block-header h2 { font-size: 16px; color: #f1f5f9; flex: 1; }
    .block-header .status-text { font-size: 11px; color: #64748b; }
    
    .content { font-size: 12px; line-height: 1.6; }
    .content h1 { font-size: 22px; color: #f1f5f9; margin: 16px 0 12px; border-bottom: 1px solid #334155; padding-bottom: 8px; }
    .content h2 { font-size: 18px; color: #f1f5f9; margin: 14px 0 10px; }
    .content h3 { font-size: 14px; color: #e2e8f0; margin: 12px 0 8px; font-weight: 600; }
    .content p { margin: 8px 0; color: #cbd5e1; }
    .content ul, .content ol { margin: 8px 0; padding-left: 24px; color: #cbd5e1; }
    .content li { margin: 4px 0; }
    .content strong { color: #f1f5f9; font-weight: 600; }
    .content em { color: #94a3b8; font-style: italic; }
    .content code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #f1f5f9; }
    .content hr { border: none; border-top: 1px solid #334155; margin: 16px 0; }
    
    .content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
    .content th { background: #0f172a; border: 1px solid #475569; padding: 8px; text-align: left; color: #e2e8f0; font-weight: 600; }
    .content td { border: 1px solid #475569; padding: 8px; color: #cbd5e1; }
    .content tr:nth-child(even) td { background: #0f172a; }
    
    .flags { margin-top: 12px; }
    .flag { font-size: 11px; margin: 4px 0; }
    
    @media print {
      body { background: white; color: black; }
      .block { background: #f8fafc; border: 1px solid #cbd5e1; }
      .content h1, .content h2, .content h3, .content strong { color: black; }
      .content p, .content li, .content td { color: #333; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Устав проекта</h1>
    <div class="subtitle">${project.code} - ${project.name}</div>
    <div class="date">Дата: ${date}</div>
  </div>
  ${blocksHtml}
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }

  /**
   * Simple Markdown to HTML parser
   */
  private parseSimpleMarkdown(text: string): string {
    if (!text) return '';
    
    let html = text;
    
    // First, protect <br> tags from escaping
    html = html.replace(/<br\s*\/?>/gi, '___BR___');
    
    // NEW: Clean up tables - fix broken tables where newlines inside cells broke the format
    // Find table rows that got split by newlines and merge them
    const tableLines = html.split('\n');
    let inTable = false;
    const fixedLines: string[] = [];
    let tableBuffer = '';
    
    for (const line of tableLines) {
      if (!line) continue;
      
      // Detect start of table
      if (line.startsWith('|') && !line.match(/^[\s|:-]+$/)) {
        inTable = true;
        tableBuffer = line;
      } 
      // Still in table (next line starts with | but isn't separator)
      else if (inTable && line.startsWith('|') && !line.match(/^[\s|:-]+$/)) {
        tableBuffer += '\n' + line;
      }
      // End of table (separator line)
      else if (inTable && line.match(/^[\s|:-]+$/)) {
        tableBuffer += '\n' + line;
      }
      // Not a table row anymore
      else if (inTable) {
        // Flush the table buffer
        fixedLines.push(tableBuffer);
        tableBuffer = '';
        inTable = false;
        fixedLines.push(line);
      }
      else {
        fixedLines.push(line);
      }
    }
    if (tableBuffer) fixedLines.push(tableBuffer);
    
    html = fixedLines.join('\n');
    
    // Escape HTML (but not our protected br tags)
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Restore <br> tags
    html = html.replace(/___BR___/g, '<br>');
    
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    
    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Horizontal rule
    html = html.replace(/^---$/gm, '<hr>');
    
    // Tables (simple)
    const tableRegex = /\|(.+)\|\n\|([-:\s]+)\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (_match, header, _separator, body) => {
      const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) => `<th>${h.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });
    
    // Lists
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    
    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table>)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    
    return html;
  }

  async exportCharterToDocx(projectId: string): Promise<Buffer> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
    const { project, blocks } = await this.getProjectCharter(projectId);

    const children: any[] = [];

    children.push(
      new Paragraph({
        text: 'Устав проекта',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `${project.code} - ${project.name}`,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        text: `Дата: ${new Date().toLocaleDateString('ru-RU')}`,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: '' })
    );

    for (const block of blocks) {
      if (block.status === 'EMPTY') continue;

      const statusText = block.status === 'DONE' ? 'Готово' : block.status === 'IN_PROGRESS' ? 'В процессе' : 'Пустой';
      
      children.push(
        new Paragraph({
          text: block.templateBlock.name,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [new TextRun({ text: `Статус: ${statusText}`, bold: true, size: 20 })],
        })
      );

      const data = block.data as Record<string, unknown>;
      if (data && Object.keys(data).length > 0) {
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === 'string' && value.trim()) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${key}: `, bold: true }),
                  new TextRun(value),
                ],
              })
            );
          }
        }
      }

      const flags = block.aiFlags as Array<{ level: string; title: string; text: string }>;
      if (flags && flags.length > 0) {
        for (const flag of flags) {
          const icon = flag.level === 'red' ? '🚨' : flag.level === 'yellow' ? '⚠️' : '✅';
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${icon} ${flag.title}: ${flag.text}`, color: flag.level === 'red' ? 'FF0000' : flag.level === 'yellow' ? 'FFA500' : '00AA00' })],
            })
          );
        }
      }

      const history = block.aiHistory as Array<{ role: string; content: string }>;
      if (history && history.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'Резюме обсуждения:', bold: true, italics: true })] }));
        const recentMessages = history.slice(-3);
        for (const msg of recentMessages) {
          const prefix = msg.role === 'user' ? 'Инженер: ' : 'AI: ';
          children.push(
            new Paragraph({
              children: [new TextRun({ text: prefix + msg.content.substring(0, 200), italics: true, size: 18 })],
            })
          );
        }
      }

      children.push(new Paragraph({ text: '' }));
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children,
      }],
    });

    return Buffer.from(await Packer.toBuffer(doc));
  }
}

export const charterService = new CharterService();
