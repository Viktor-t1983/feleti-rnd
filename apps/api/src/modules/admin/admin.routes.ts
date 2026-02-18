import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AdminService } from './admin.service';

const adminService = new AdminService();

/**
 * Middleware to check if user has Admin role
 */
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.userId;

  if (!userId) {
    return reply.code(401).send({
      error: 'Требуется аутентификация',
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: { select: { name: true } } },
  });

  if (user?.role.name !== 'Admin') {
    return reply.code(403).send({
      error: 'Доступ запрещён. Только для Admin.',
    });
  }
}

export async function adminRoutes(fastify: FastifyInstance) {
  // All routes require Auth + Admin
  const preHandler = [fastify.authenticate, requireAdmin];

  // GET /admin/users - Get all users
  fastify.get('/admin/users', { preHandler }, async (_, reply) => {
    const users = await adminService.getUsers();
    return reply.send(users);
  });

  // GET /admin/stats - Get system statistics
  fastify.get('/admin/stats', { preHandler }, async (_, reply) => {
    const stats = await adminService.getStats();
    return reply.send(stats);
  });

  // GET /admin/roles - Get all roles
  fastify.get('/admin/roles', { preHandler }, async (_, reply) => {
    const roles = await adminService.getRoles();
    return reply.send(roles);
  });

  // PATCH /admin/users/:id/block - Block/unblock user
  fastify.patch('/admin/users/:id/block', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { block } = request.body as {
      block: boolean;
    };

    try {
      const result = await adminService.toggleBlock(id, block);
      return reply.send(result);
    } catch (error: unknown) {
      const err = error as Error;
      return reply.code(400).send({
        error: err.message,
      });
    }
  });

  // PATCH /admin/users/:id/role - Change user role
  fastify.patch('/admin/users/:id/role', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { roleId } = request.body as {
      roleId: string;
    };

    try {
      const result = await adminService.changeRole(id, roleId);
      return reply.send(result);
    } catch (error: unknown) {
      const err = error as Error;
      return reply.code(400).send({
        error: err.message,
      });
    }
  });

  // DELETE /admin/users/:id - Delete user
  fastify.delete('/admin/users/:id', { preHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const currentUserId = request.user?.userId;

    try {
      await adminService.deleteUser(id, currentUserId as string);
      return reply.code(204).send();
    } catch (error: unknown) {
      const err = error as Error;
      return reply.code(400).send({
        error: err.message,
      });
    }
  });
}
