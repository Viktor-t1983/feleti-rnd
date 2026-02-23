import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CommentsService } from '../comments.service';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    comment: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          text: 'Тестовый комментарий',
          projectId: '550e8400-e29b-41d4-a716-446655440001',
          authorId: '550e8400-e29b-41d4-a716-446655440002',
          createdAt: new Date(),
          author: {
            id: '550e8400-e29b-41d4-a716-446655440002',
            fullName: 'Тест Пользователь',
            username: 'test',
          },
        },
      ]),
      create: vi.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440004',
        text: 'Новый комментарий',
        projectId: '550e8400-e29b-41d4-a716-446655440001',
        authorId: '550e8400-e29b-41d4-a716-446655440002',
        createdAt: new Date(),
        author: {
          id: '550e8400-e29b-41d4-a716-446655440002',
          fullName: 'Тест',
          username: 'test',
        },
      }),
      findUnique: vi.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440003',
        authorId: '550e8400-e29b-41d4-a716-446655440002',
        text: 'Тест',
      }),
      delete: vi.fn().mockResolvedValue({ id: '550e8400-e29b-41d4-a716-446655440003' }),
      count: vi.fn().mockResolvedValue(1),
    },
    project: {
      findUnique: vi.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Тест проект',
        ownerId: '550e8400-e29b-41d4-a716-446655440099',
      }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({
        id: '550e8400-e29b-41d4-a716-446655440002',
        fullName: 'Тест Пользователь',
      }),
    },
  },
}));

vi.mock('../notifications/notifications.service', () => ({
  notificationsService: {
    create: vi.fn().mockResolvedValue({}),
  },
}));

describe('CommentsService', () => {
  let service: CommentsService;

  const PROJECT_ID = '550e8400-e29b-41d4-a716-446655440001';
  const AUTHOR_ID = '550e8400-e29b-41d4-a716-446655440002';
  const COMMENT_ID = '550e8400-e29b-41d4-a716-446655440003';
  const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440099';

  beforeEach(() => {
    service = new CommentsService();
    vi.clearAllMocks();
  });

  it('should get comments for project', async () => {
    const comments = await service.getComments(PROJECT_ID);
    expect(Array.isArray(comments)).toBe(true);
    expect(comments[0]).toHaveProperty('id');
    expect(comments[0]).toHaveProperty('text');
    expect(comments[0]).toHaveProperty('author');
  });

  it('should create a comment', async () => {
    const comment = await service.createComment({
      text: 'Новый комментарий',
      projectId: PROJECT_ID,
      authorId: AUTHOR_ID,
    });
    expect(comment).toHaveProperty('id');
    expect(comment.text).toBe('Новый комментарий');
  });

  it('should delete a comment', async () => {
    const result = await service.deleteComment(COMMENT_ID, AUTHOR_ID, false);
    expect(result).toHaveProperty('id');
  });

  it('should not delete comment of another user', async () => {
    const { prisma } = await import('../../../lib/prisma');
    vi.mocked(prisma.comment.findUnique).mockResolvedValueOnce({
      id: COMMENT_ID,
      authorId: OTHER_USER_ID,
      text: 'Чужой',
    } as never);

    await expect(service.deleteComment(COMMENT_ID, AUTHOR_ID, false)).rejects.toThrow();
  });

  it('should validate comment text length', async () => {
    await expect(
      service.createComment({
        text: '',
        projectId: PROJECT_ID,
        authorId: AUTHOR_ID,
      })
    ).rejects.toThrow();
  });

  it('should get comment count', async () => {
    const count = await service.getCount(PROJECT_ID);
    expect(typeof count).toBe('number');
  });

  it('should allow admin to delete any comment', async () => {
    const { prisma } = await import('../../../lib/prisma');
    vi.mocked(prisma.comment.findUnique).mockResolvedValueOnce({
      id: COMMENT_ID,
      authorId: OTHER_USER_ID,
      text: 'Чужой комментарий',
    } as never);

    const result = await service.deleteComment(COMMENT_ID, AUTHOR_ID, true);
    expect(result).toHaveProperty('id');
  });

  it('should throw when project not found', async () => {
    const { prisma } = await import('../../../lib/prisma');
    vi.mocked(prisma.project.findUnique).mockResolvedValueOnce(null);

    await expect(
      service.createComment({
        text: 'Test',
        projectId: '550e8400-e29b-41d4-a716-446655440099',
        authorId: AUTHOR_ID,
      })
    ).rejects.toThrow('Проект не найден');
  });
});
