import { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { CommentsService } from './comments.service';

const commentsService = new CommentsService();

export async function commentsRoutes(fastify: FastifyInstance) {
  // GET /api/projects/:projectId/comments
  fastify.get(
    '/api/projects/:projectId/comments',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };

      const comments = await commentsService.getComments(projectId);

      return reply.send(comments);
    }
  );

  // POST /api/projects/:projectId/comments
  fastify.post(
    '/api/projects/:projectId/comments',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { projectId } = request.params as {
        projectId: string;
      };
      const { text } = request.body as { text: string };
      const authorId = (request.user as { userId: string }).userId;

      const comment = await commentsService.createComment({
        text,
        projectId,
        authorId,
      });

      return reply.code(201).send(comment);
    }
  );

  // DELETE /api/projects/:projectId/comments/:commentId
  fastify.delete(
    '/api/projects/:projectId/comments/:commentId',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { commentId } = request.params as {
        commentId: string;
      };
      const userId = (request.user as { userId: string }).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      const isAdmin = user?.role?.name === 'Admin';

      await commentsService.deleteComment(commentId, userId, isAdmin);

      return reply.code(204).send();
    }
  );
}
