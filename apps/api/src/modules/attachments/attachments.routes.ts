import multipart from '@fastify/multipart';
import { FastifyInstance } from 'fastify';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middlewares/authenticate';
import { AttachmentsService } from './attachments.service';

const attachmentsService = new AttachmentsService();

export async function attachmentsRoutes(fastify: FastifyInstance) {
  // Регистрируем multipart
  await fastify.register(multipart, {
    limits: {
      fileSize: 20 * 1024 * 1024, // 20MB
      files: 5, // максимум 5 файлов за раз
    },
  });

  // POST /projects/:projectId/attachments
  fastify.post(
    '/projects/:projectId/attachments',
    { preHandler: [fastify.authenticate] },
    async (request: AuthenticatedRequest, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };
      const userId = request.user.userId;

      // Проверяем членство в проекте
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      if (!membership) {
        return reply.code(403).send({
          error: 'Вы не являетесь членом проекта',
        });
      }

      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          error: 'Файл не найден',
        });
      }

      const buffer = await data.toBuffer();

      const attachment = await attachmentsService.upload({
        projectId,
        userId,
        filename: data.filename,
        originalName: data.filename,
        mimeType: data.mimetype,
        size: buffer.length,
        buffer,
      });

      return reply.code(201).send(attachment);
    }
  );

  // GET /projects/:projectId/attachments
  fastify.get(
    '/projects/:projectId/attachments',
    { preHandler: [fastify.authenticate] },
    async (request: AuthenticatedRequest, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };
      const userId = request.user.userId;

      // Проверяем членство в проекте
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });

      // Владелец проекта тоже имеет доступ
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });

      if (!membership && project?.ownerId !== userId) {
        return reply.code(403).send({
          error: 'Вы не являетесь членом проекта',
        });
      }

      const files = await attachmentsService.getByProject(projectId);

      return reply.send(files);
    }
  );

  // GET /attachments/:id/download
  fastify.get(
    '/attachments/:id/download',
    { preHandler: [fastify.authenticate] },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.userId;

      const attachment = await attachmentsService.getById(id);

      if (!attachment) {
        return reply.code(404).send({
          error: 'Файл не найден',
        });
      }

      // Если файл не привязан к проекту (база знаний), проверяем entity-based доступ
      if (!attachment.projectId) {
        // TODO: Добавить проверку доступа к entity (equipment/market/competitor)
        // Пока разрешаем автору и админам
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: { select: { name: true } } },
        });
        const isAdmin = user?.role?.name === 'Admin';
        const isOwner = attachment.uploadedById === userId;

        if (!isAdmin && !isOwner) {
          return reply.code(403).send({
            error: 'Нет доступа к файлу базы знаний',
          });
        }
      } else {
        // Проверяем членство в проекте
        const membership = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: attachment.projectId,
              userId,
            },
          },
        });

        // Владелец проекта тоже имеет доступ
        const project = await prisma.project.findUnique({
          where: { id: attachment.projectId },
          select: { ownerId: true },
        });

        if (!membership && project?.ownerId !== userId) {
          return reply.code(403).send({
            error: 'Вы не являетесь членом проекта',
          });
        }
      }

      // Проверяем что файл существует
      try {
        await stat(attachment.path);
      } catch {
        return reply.code(404).send({
          error: 'Файл не найден на диске',
        });
      }

      const stream = createReadStream(attachment.path);

      return reply
        .header('Content-Type', attachment.mimeType)
        .header(
          'Content-Disposition',
          `attachment; filename="${encodeURIComponent(attachment.originalName)}"`
        )
        .send(stream);
    }
  );

  // DELETE /attachments/:id
  fastify.delete(
    '/attachments/:id',
    { preHandler: [fastify.authenticate] },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user.userId;

      const attachment = await attachmentsService.getById(id);

      if (!attachment) {
        return reply.code(404).send({
          error: 'Файл не найден',
        });
      }

      // Проверяем права - только Admin или автор загрузки
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: { select: { name: true } },
        },
      });

      const isAdmin = user?.role.name === 'Admin';
      const isOwner = attachment.uploadedById === userId;

      if (!isAdmin && !isOwner) {
        return reply.code(403).send({
          error: 'Нет прав для удаления',
        });
      }

      await attachmentsService.delete(id);

      return reply.code(204).send();
    }
  );
}
