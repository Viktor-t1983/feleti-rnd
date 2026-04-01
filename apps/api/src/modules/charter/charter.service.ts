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
    let systemPrompt = `${basePrompt}\n\nКонтекст блока:\n${contextStr}\n\nИспользуй флаги для рисков: FLAG:red:Заголовок:Описание или FLAG:yellow:... или FLAG:green:...`;
    
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
  async getProjectCharter(projectId: string): Promise<{
    project: Project;
    blocks: Array<ProjectBlock & { templateBlock: TemplateBlock }>;
  }> {
    logger.debug({ projectId }, 'Getting project charter');

    const [project, blocks] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
      }),
      this.getProjectBlocks(projectId),
    ]);

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
   * Export project charter to PDF
   */
  async exportCharterToPdf(projectId: string): Promise<Buffer> {
    const PDFDocument = require('pdfkit');
    const path = require('path');
    const { project, blocks } = await this.getProjectCharter(projectId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Register bundled font with Cyrillic support
        const fontPath = path.join(__dirname, '../../fonts/arial.ttf');
        doc.registerFont('Arial', fontPath);
        doc.font('Arial');

        // Header
        doc.fontSize(24).text('Устав проекта', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text(`${project.code} - ${project.name}`, { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, { align: 'center' });
        doc.moveDown(2);

        // Divider
        doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(2);

        // Blocks
        for (const block of blocks) {
          const status = block.status === 'DONE' ? '✅' : block.status === 'IN_PROGRESS' ? '⏳' : '⚪';
          
          // Block title
          doc.fontSize(14).fillColor('#333').text(`${status} ${block.templateBlock.name}`);
          doc.moveDown(0.5);

          // Block status text
          doc.fontSize(10).fillColor('#666');
          if (block.status === 'EMPTY') {
            doc.text('Статус: Не заполнен');
          } else if (block.status === 'IN_PROGRESS') {
            doc.text('Статус: В процессе');
          } else {
            doc.text('Статус: Завершён');
          }
          doc.moveDown(0.5);

          // Block data content
          const data = block.data as Record<string, unknown>;
          if (data && Object.keys(data).length > 0) {
            doc.fontSize(10).fillColor('#000');
            for (const [key, value] of Object.entries(data)) {
              if (value && typeof value === 'string' && value.trim()) {
                doc.text(`${key}: ${value}`);
              } else if (value && typeof value === 'object') {
                doc.text(`${key}: ${JSON.stringify(value)}`);
              }
            }
          }
          doc.moveDown(0.5);

          // AI flags (risks)
          const flags = block.aiFlags as Array<{ level: string; title: string; text: string }>;
          if (flags && flags.length > 0) {
            doc.fontSize(10);
            for (const flag of flags) {
              const icon = flag.level === 'red' ? '🚨' : flag.level === 'yellow' ? '⚠️' : '✅';
              doc.fillColor(flag.level === 'red' ? '#d00' : flag.level === 'yellow' ? '#d70' : '#0a0');
              doc.text(`${icon} ${flag.title}: ${flag.text}`);
            }
          }
          doc.moveDown(0.5);

          // AI history summary (last 2-3 messages)
          const history = block.aiHistory as Array<{ role: string; content: string }>;
          if (history && history.length > 0) {
            doc.fontSize(9).fillColor('#888');
            doc.text('Резюме обсуждения:');
            const recentMessages = history.slice(-3);
            for (const msg of recentMessages) {
              const prefix = msg.role === 'user' ? '👤' : '🤖';
              const content = msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : '');
              doc.text(`  ${prefix} ${content}`);
            }
          }

          // Check for GO/NO-GO block
          const blockType = block.templateBlock.blockType;
          if (blockType === 'GATE_REVIEW') {
            const goData = data as { decision?: string; notes?: string };
            if (goData?.decision) {
              doc.moveDown();
              doc.fontSize(16).fillColor(goData.decision === 'GO' ? '#0a0' : '#d00');
              doc.text(`ИТОГОВОЕ РЕШЕНИЕ: ${goData.decision === 'GO' ? '✅ GO' : '❌ NO-GO'}`);
              if (goData.notes) {
                doc.fontSize(12).fillColor('#333').text(`Комментарий: ${goData.notes}`);
              }
            }
          }

          doc.moveDown(2);

          // Page break if needed
          if (doc.y > 650) {
            doc.addPage();
          }
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
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
