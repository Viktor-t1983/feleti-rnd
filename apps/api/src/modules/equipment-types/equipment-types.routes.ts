import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function equipmentTypesRoutes(fastify: FastifyInstance) {
  fastify.get('/equipment-types', { preHandler: [fastify.authenticate] }, async (_, reply) => {
    const equipmentTypes = await prisma.equipmentType.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
    return reply.send({ success: true, data: equipmentTypes });
  });
}
