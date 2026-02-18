import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { authenticate } from '../../middlewares/authenticate';

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100),
  username: z.string().min(3).max(50).optional(),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.newPassword === data.confirmPassword, { message: 'Пароли не совпадают' });

export async function usersRoutes(fastify: FastifyInstance) {
  // GET /users/profile
  fastify.get(
    '/users/profile',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const req = request as unknown as { user: { userId: string } };
      const userId = req.user.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          createdAt: true,
          role: { select: { name: true } },
          _count: {
            select: {
              ownedProjects: true,
              projectMembers: true,
            },
          },
        },
      });

      if (!user) {
        return reply.code(404).send({
          error: 'Пользователь не найден',
        });
      }

      return reply.send(user);
    }
  );

  // PATCH /users/profile
  fastify.patch(
    '/users/profile',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const req = request as unknown as { user: { userId: string } };
      const userId = req.user.userId;
      const body = updateProfileSchema.parse(request.body);

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          fullName: body.fullName,
          username: body.username,
        },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          role: { select: { name: true } },
        },
      });

      return reply.send(updated);
    }
  );

  // POST /api/users/change-password
  fastify.post(
    '/api/users/change-password',
    {
      preHandler: [authenticate],
    },
    async (request, reply) => {
      const req = request as unknown as { user: { id: string } };
      const userId = req.user.id;
      const body = changePasswordSchema.parse(request.body);

      // Получаем текущий пароль
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true },
      });

      if (!user) {
        return reply.code(404).send({
          error: 'Пользователь не найден',
        });
      }

      // Проверяем текущий пароль
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(body.currentPassword, user.passwordHash);

      if (!isValid) {
        return reply.code(400).send({
          error: 'Неверный текущий пароль',
        });
      }

      // Обновляем пароль
      const hashedPassword = await bcrypt.hash(body.newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: hashedPassword },
      });

      return reply.send({
        message: 'Пароль успешно изменён',
      });
    }
  );
}
