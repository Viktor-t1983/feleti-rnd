/**
 * Market Research Routes
 * API для анализа рынка и поиска производителей
 */

import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middlewares/authenticate';
import {
  performMarketResearch,
  saveToKnowledgeBase,
  MarketResearchRequest,
} from './market-research.service';

export default async function marketResearchRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  // NOTE: Test endpoint /api/test-dealby is registered separately in server.ts without auth
  fastify.addHook('onRequest', authenticate);

  /**
   * POST /api/market-research/search
   * Выполнить поиск производителей
   */
  fastify.post<{
    Body: MarketResearchRequest;
  }>(
    '/market-research/search',
    async (request, reply) => {
      try {
        const { productType, countries } = request.body;

        if (!productType || !countries || countries.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'productType and countries are required',
          });
        }

        const { results, analysis } = await performMarketResearch({
          productType,
          countries,
        });

        return reply.send({
          success: true,
          data: results,
          analysis,
          meta: {
            query: productType,
            countries,
            found: results.length,
          },
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Search failed',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * POST /api/market-research/save
   * Сохранить выбранные результаты в Knowledge Base
   */
  fastify.post<{
    Body: {
      results: Array<{
        id: string;
        name: string;
        website?: string;
        country?: string;
        description?: string;
        source: string;
      }>;
      projectId: string;
    };
  }>(
    '/market-research/save',
    async (request, reply) => {
      try {
        const { results, projectId } = request.body;
        const user = request.user as { userId: string };

        if (!results || !projectId) {
          return reply.status(400).send({
            success: false,
            error: 'results and projectId are required',
          });
        }

        await saveToKnowledgeBase(
          results.map((r: {sourceUrl?: string; name: string; country?: string; source: string}) => ({
            name: r.name,
            url: r.sourceUrl || '',
            sourceUrl: r.sourceUrl || '',
            country: r.country || 'unknown',
            source: r.source,
            confidence: 0.8,
            verified: false,
            normalizedCurrency: 'USD',
            parsedAt: new Date(),
            reliabilityScore: 80,
          })),
          projectId,
          user.userId
        );

        return reply.send({
          success: true,
          message: `${results.length} компаний добавлено в базу знаний`,
        });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          error: 'Failed to save results',
          message: (error as Error).message,
        });
      }
    }
  );

  /**
   * GET /api/market-research/queue
   * Статус очереди Playwright (мониторинг)
   */
  fastify.get('/market-research/queue', async (request, reply) => {
    try {
      const { getQueueStats } = await import('./browser/browser-queue.service');
      const stats = getQueueStats();
      
      return reply.send({
        success: true,
        data: stats,
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: 'Failed to get queue stats' });
    }
  });

  /**
   * GET /api/market-research/status
   * Проверить статус сервисов поиска
   */
  fastify.get('/market-research/status', async (request, reply) => {
    try {
      const { getSettingByKey } = await import('../settings/settings.service');
      const { getQueueStats } = await import('./browser/browser-queue.service');
      
      // Check Yandex config
      const yandexKey = (await getSettingByKey('yandex.xml_api_key'))?.value;
      const yandexUser = (await getSettingByKey('yandex.xml_user'))?.value;
      
      // Check Whoogle config
      const whoogleEnabled = (await getSettingByKey('whoogle.enabled'))?.value === 'true';
      const whoogleUrl = (await getSettingByKey('whoogle.url'))?.value || 'http://whoogle:5000';

      // Test DuckDuckGo (always available)
      let ddgStatus = 'online';
      try {
        const response = await fetch('https://lite.duckduckgo.com/lite/', {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        ddgStatus = response.ok ? 'online' : 'degraded';
      } catch {
        ddgStatus = 'offline';
      }

      // Test Whoogle connection (optional)
      let whoogleStatus = 'disabled';
      if (whoogleEnabled) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response = await fetch(`${whoogleUrl}/`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000),
          } as any);
          whoogleStatus = response.ok ? 'online' : 'error';
        } catch {
          whoogleStatus = 'offline';
        }
      }

      // Queue stats
      const queueStats = getQueueStats();

      return reply.send({
        success: true,
        data: {
          queue: queueStats,
          duckduckgo: {
            status: ddgStatus,
            note: 'Primary source, works everywhere including Russia',
          },
          yandex: {
            configured: !!(yandexKey && yandexUser),
            note: 'Recommended for RU/BY/KZ (1000 free queries/day)',
          },
          whoogle: {
            enabled: whoogleEnabled,
            url: whoogleUrl,
            status: whoogleStatus,
            note: 'Google proxy (may be blocked in Russia)',
          },
        },
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to check status',
      });
    }
  });

  /**
   * GET /api/market-research/test?country=BY|RU&query=...
   * Тест парсера для указанной страны (требуется авторизация)
   * 
   * Query params:
   * - country: 'BY' | 'RU' (default: 'BY')
   * - query: search term (default: 'фаршмешалка')
   */
  fastify.get('/market-research/test', async (request, reply) => {
    try {
      const { country = 'BY', query = 'фаршмешалка' } = request.query as { 
        country?: string; 
        query?: string;
      };
      
      request.log.info({ country, query }, 'Starting market research test');
      
      const { testParser } = await import('./market-research.service');
      const { results, savedCount, source } = await testParser(country, query);
      
      return reply.send({
        success: true,
        data: results,
        meta: {
          country,
          source,
          query,
          count: results.length,
          savedToDb: savedCount,
        }
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Parser test failed',
        message: (error as Error).message,
      });
    }
  });

  /**
   * GET /api/market-research/parsers
   * Список доступных парсеров и их статус
   */
  fastify.get('/market-research/parsers', async (_request, reply) => {
    return reply.send({
      success: true,
      data: {
        parsers: [
          { country: 'BY', source: 'deal.by', status: 'active', name: 'Deal.by (Belarus)' },
          { country: 'RU', source: 'avito', status: 'beta', name: 'Avito (Russia) - needs fix' },
        ],
        supportedCountries: ['BY'],
        notes: 'Avito parser temporarily disabled due to JS rendering requirements'
      }
    });
  });

  /**
   * GET /api/market-research/search?query=...&countries=BY,RU,KZ
   * Гибридный поиск: парсеры (HIGH confidence) + Tavily (discovery)
   * 
   * Query params:
   * - query: поисковый запрос (required)
   * - countries: список стран через запятую, например 'BY,RU' (default: 'BY')
   */
  fastify.get<{
    Querystring: {
      query: string;
      countries?: string;
    };
  }>('/market-research/search', async (request, reply) => {
    const startTime = Date.now();
    
    try {
      const { query, countries = 'BY' } = request.query;
      
      if (!query || query.length < 2) {
        return reply.status(400).send({
          success: false,
          error: 'Query parameter required (min 2 chars)',
        });
      }

      const countryList = countries.split(',').map(c => c.trim().toUpperCase());
      
      request.log.info({ query, countries: countryList }, 'Starting market search');

      const { searchMarket } = await import('./market-research.service');
      const { results, meta } = await searchMarket(query, countryList);

      return reply.send({
        success: true,
        data: results,
        meta: {
          ...meta,
          responseTimeMs: Date.now() - startTime,
        }
      });

    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: 'Search failed',
        message: (error as Error).message,
      });
    }
  });
}
