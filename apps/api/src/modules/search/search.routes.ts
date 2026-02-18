import { FastifyInstance } from 'fastify';
import { AuthenticatedRequest, authenticate } from '../../middlewares/authenticate';
import { SearchService } from './search.service';

const searchService = new SearchService();

export async function searchRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /api/search?q=query
  fastify.get(
    '/search',
    {
      schema: {
        description: 'Global search across projects and users',
        tags: ['Search'],
        querystring: {
          type: 'object',
          required: ['q'],
          properties: {
            q: { type: 'string', minLength: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              projects: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    code: { type: 'string' },
                    name: { type: 'string' },
                    stage: { type: 'string' },
                    status: { type: 'string' },
                    description: { type: ['string', 'null'] },
                  },
                },
              },
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    fullName: { type: 'string' },
                    email: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
              },
              total: { type: 'number' },
            },
          },
        },
      },
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const { q } = request.query as { q: string };
      const userId = (request as AuthenticatedRequest).user['id'] as string;

      const results = await searchService.search(q, userId);
      return reply.send(results);
    }
  );
}
