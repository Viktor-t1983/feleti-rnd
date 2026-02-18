import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const createCommentSchema = z.object({
  text: z.string().min(1, 'Комментарий не может быть пустым').max(1000, 'Максимум 1000 символов'),
  projectId: z.string().uuid(),
  authorId: z.string().uuid(),
});

export class CommentsService {
  /**
   * Получить все комментарии для проекта
   */
  async getComments(projectId: string) {
    return prisma.comment.findMany({
      where: { projectId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Создать новый комментарий
   */
  async createComment(data: { text: string; projectId: string; authorId: string }) {
    const validated = createCommentSchema.parse(data);

    // Проверяем что проект существует
    const project = await prisma.project.findUnique({
      where: { id: validated.projectId },
    });

    if (!project) {
      throw new Error('Проект не найден');
    }

    return prisma.comment.create({
      data: {
        text: validated.text.trim(),
        projectId: validated.projectId,
        authorId: validated.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });
  }

  /**
   * Удалить комментарий (только автор или админ)
   */
  async deleteComment(commentId: string, userId: string, isAdmin: boolean) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Комментарий не найден');
    }

    // Только автор или Admin могут удалять
    if (comment.authorId !== userId && !isAdmin) {
      throw new Error('Нет прав для удаления');
    }

    return prisma.comment.delete({
      where: { id: commentId },
    });
  }

  /**
   * Получить количество комментариев для проекта
   */
  async getCount(projectId: string): Promise<number> {
    return prisma.comment.count({
      where: { projectId },
    });
  }
}
