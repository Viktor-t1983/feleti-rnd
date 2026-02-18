import { prisma } from '../../lib/prisma';

export class AdminService {
  /**
   * Get all users with their roles and project counts
   */
  async getUsers() {
    return prisma.user.findMany({
      include: {
        role: {
          select: { id: true, name: true },
        },
        _count: {
          select: { ownedProjects: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get system statistics
   */
  async getStats() {
    const [totalUsers, totalProjects, roles, blockedUsers, newUsersThisWeek] = await Promise.all([
      prisma.user.count(),
      prisma.project.count(),
      prisma.role.findMany({
        include: {
          _count: { select: { users: true } },
        },
      }),
      prisma.user.count({
        where: { isBlocked: true },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalProjects,
      blockedUsers,
      newUsersThisWeek,
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        count: r._count.users,
      })),
    };
  }

  /**
   * Toggle user block status
   */
  async toggleBlock(userId: string, block: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    if (user?.role.name === 'Admin') {
      throw new Error('Нельзя заблокировать Admin');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { isBlocked: block },
      select: {
        id: true,
        fullName: true,
        isBlocked: true,
      },
    });
  }

  /**
   * Change user role
   */
  async changeRole(userId: string, roleId: string) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Роль не найдена');
    }

    return prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: {
        role: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * Delete user with protection rules
   */
  async deleteUser(userId: string, currentUserId: string) {
    if (userId === currentUserId) {
      throw new Error('Нельзя удалить себя');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: { select: { name: true } } },
    });

    if (user?.role.name === 'Admin') {
      throw new Error('Нельзя удалить Admin');
    }

    return prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Get all available roles
   */
  async getRoles() {
    return prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
