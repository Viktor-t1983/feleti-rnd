/**
 * Notifications Service Tests
 * Unit tests for notification management
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsService } from '../notifications.service';

vi.mock('../../../lib/prisma', () => ({
  prisma: {
    notification: {
      create: vi.fn().mockResolvedValue({
        id: 'notif-1',
        type: 'TEAM_INVITE',
        title: 'Приглашение в команду',
        message: 'Вас добавили в проект',
        read: false,
        userId: 'user-1',
        createdAt: new Date(),
      }),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'notif-1',
          type: 'COMMENT',
          title: 'Новый комментарий',
          message: 'Иван оставил комментарий',
          read: false,
          link: '/projects/proj-1',
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          type: 'DEADLINE',
          title: 'Дедлайн',
          message: 'Через 7 дней',
          read: true,
          link: '/projects/proj-2',
          createdAt: new Date(),
        },
      ]),
      count: vi.fn().mockResolvedValue(5),
      update: vi.fn().mockResolvedValue({
        id: 'notif-1',
        read: true,
      }),
      updateMany: vi.fn().mockResolvedValue({
        count: 3,
      }),
      delete: vi.fn().mockResolvedValue({
        id: 'notif-1',
      }),
      deleteMany: vi.fn().mockResolvedValue({
        count: 10,
      }),
    },
  },
}));

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
  });

  it('should create notification', async () => {
    const notif = await service.create({
      type: 'TEAM_INVITE',
      title: 'Приглашение',
      message: 'Вас добавили',
      userId: 'user-1',
      link: '/projects/1',
    });
    expect(notif).toHaveProperty('id');
    expect(notif.type).toBe('TEAM_INVITE');
    expect(notif.read).toBe(false);
  });

  it('should get user notifications', async () => {
    const notifs = await service.getByUser('user-1');
    expect(Array.isArray(notifs)).toBe(true);
    expect(notifs.length).toBe(2);
  });

  it('should get user notifications with limit', async () => {
    const notifs = await service.getByUser('user-1', 1);
    expect(Array.isArray(notifs)).toBe(true);
  });

  it('should count unread notifications', async () => {
    const count = await service.getUnreadCount('user-1');
    expect(typeof count).toBe('number');
    expect(count).toBe(5);
  });

  it('should mark single notification as read', async () => {
    const result = await service.markAsRead('notif-1');
    expect(result.read).toBe(true);
  });

  it('should mark all user notifications as read', async () => {
    const result = await service.markAllAsRead('user-1');
    expect(result).toHaveProperty('count');
    expect(result.count).toBe(3);
  });

  it('should delete single notification', async () => {
    const result = await service.delete('notif-1');
    expect(result).toBeDefined();
  });

  it('should delete all user notifications', async () => {
    const result = await service.deleteAll('user-1');
    expect(result).toHaveProperty('count');
    expect(result.count).toBe(10);
  });
});
