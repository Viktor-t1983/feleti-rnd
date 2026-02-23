/**
 * Notifications Service
 * Business logic for notification management
 */

import { prisma } from '../../lib/prisma';

export type NotificationType =
  | 'TEAM_INVITE'
  | 'COMMENT'
  | 'DEADLINE'
  | 'BUDGET'
  | 'PROJECT_CREATED';

export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  link?: string;
}

export class NotificationsService {
  /**
   * Create a new notification
   */
  async create(data: CreateNotificationData) {
    return prisma.notification.create({
      data: {
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
        userId: data.userId,
      },
    });
  }

  /**
   * Get notifications for a user
   */
  async getByUser(userId: string, limit: number = 20) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get count of unread notifications for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  /**
   * Delete a single notification
   */
  async delete(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAll(userId: string) {
    return prisma.notification.deleteMany({
      where: { userId },
    });
  }
}

// Singleton instance
export const notificationsService = new NotificationsService();
