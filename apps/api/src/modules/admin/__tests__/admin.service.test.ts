/**
 * Admin Service Tests
 * TDD: Tests written BEFORE implementation
 */

import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock Prisma
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'user-1',
          email: 'admin@feleti.com',
          username: 'admin',
          fullName: 'Администратор',
          isBlocked: false,
          createdAt: new Date(),
          role: { id: 'role-1', name: 'Admin' },
          _count: { ownedProjects: 3 },
        },
        {
          id: 'user-2',
          email: 'manager@feleti.com',
          username: 'manager',
          fullName: 'Менеджер',
          isBlocked: false,
          createdAt: new Date(),
          role: { id: 'role-2', name: 'Manager' },
          _count: { ownedProjects: 1 },
        },
      ]),
      findUnique: vi.fn().mockResolvedValue({
        id: 'user-2',
        email: 'manager@feleti.com',
        isBlocked: false,
        role: { name: 'Manager' },
      }),
      update: vi.fn().mockResolvedValue({
        id: 'user-2',
        isBlocked: true,
      }),
      delete: vi.fn().mockResolvedValue({
        id: 'user-2',
      }),
      count: vi.fn().mockResolvedValue(5),
    },
    project: {
      count: vi.fn().mockResolvedValue(10),
    },
    role: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'role-1', name: 'Admin', _count: { users: 2 } },
        { id: 'role-2', name: 'Manager', _count: { users: 3 } },
        { id: 'role-3', name: 'Engineer', _count: { users: 5 } },
      ]),
      findUnique: vi.fn().mockResolvedValue({ id: 'role-3', name: 'Engineer' }),
    },
  },
}));

import { prisma } from '../../../lib/prisma';
import { AdminService } from '../admin.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminService();
  });

  describe('getUsers()', () => {
    it('should get all users with role and project count', async () => {
      const users = await service.getUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('role');
      expect(users[0]).toHaveProperty('_count');
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            role: { select: { id: true, name: true } },
            _count: { select: { ownedProjects: true } },
          },
        })
      );
    });

    it('should order users by createdAt descending', async () => {
      await service.getUsers();

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getStats()', () => {
    it('should return totalUsers, totalProjects, blockedUsers and roles', async () => {
      const stats = await service.getStats();

      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('totalProjects');
      expect(stats).toHaveProperty('blockedUsers');
      expect(stats).toHaveProperty('roles');
      expect(stats.totalUsers).toBe(5);
      expect(stats.totalProjects).toBe(10);
    });

    it('should return roles with user count', async () => {
      const stats = await service.getStats();

      expect(stats.roles).toHaveLength(3);
      expect(stats.roles[0]).toHaveProperty('id');
      expect(stats.roles[0]).toHaveProperty('name');
      expect(stats.roles[0]).toHaveProperty('count');
    });
  });

  describe('toggleBlock()', () => {
    it('should block user', async () => {
      const result = await service.toggleBlock('user-2', true);

      expect(result).toHaveProperty('isBlocked');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { isBlocked: true },
        select: {
          id: true,
          fullName: true,
          isBlocked: true,
        },
      });
    });

    it('should unblock user', async () => {
      (prisma.user.update as Mock).mockResolvedValueOnce({
        id: 'user-2',
        isBlocked: false,
      });

      const result = await service.toggleBlock('user-2', false);

      expect(result.isBlocked).toBe(false);
    });

    it('should throw error when trying to block admin', async () => {
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({
        id: 'user-1',
        role: { name: 'Admin' },
      });

      await expect(service.toggleBlock('user-1', true)).rejects.toThrow(
        'Нельзя заблокировать Admin'
      );
    });
  });

  describe('changeRole()', () => {
    it('should change user role', async () => {
      (prisma.user.update as Mock).mockResolvedValueOnce({
        id: 'user-2',
        roleId: 'role-3',
        role: { id: 'role-3', name: 'Engineer' },
      });

      const result = await service.changeRole('user-2', 'role-3');

      expect(result).toBeDefined();
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-2' },
        data: { roleId: 'role-3' },
        include: {
          role: { select: { id: true, name: true } },
        },
      });
    });

    it('should throw error if role not found', async () => {
      (prisma.role.findUnique as Mock).mockResolvedValueOnce(null);

      await expect(service.changeRole('user-2', 'invalid-role-id')).rejects.toThrow(
        'Роль не найдена'
      );
    });
  });

  describe('deleteUser()', () => {
    it('should delete user', async () => {
      await service.deleteUser('user-2', 'user-1');

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-2' },
      });
    });

    it('should throw error when trying to delete yourself', async () => {
      await expect(service.deleteUser('user-1', 'user-1')).rejects.toThrow('Нельзя удалить себя');
    });

    it('should throw error when trying to delete admin', async () => {
      (prisma.user.findUnique as Mock).mockResolvedValueOnce({
        id: 'user-1',
        role: { name: 'Admin' },
      });

      await expect(service.deleteUser('user-1', 'user-2')).rejects.toThrow('Нельзя удалить Admin');
    });
  });

  describe('getRoles()', () => {
    it('should get all roles sorted by name', async () => {
      const roles = await service.getRoles();

      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });
});
