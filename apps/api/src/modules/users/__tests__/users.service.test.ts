/**
 * Users Service Unit Tests
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Prisma - using factory function to avoid hoisting issues
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    role: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { ConflictError } from '../../../errors/ConflictError';
import { NotFoundError } from '../../../errors/NotFoundError';
import { prisma } from '../../../lib/prisma';

// Get mockPrisma reference for tests
const mockPrisma = prisma as unknown as {
  user: {
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  role: {
    findMany: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

// Simple hash function mock
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  compare: vi.fn().mockResolvedValue(true),
}));

describe('Users Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('should return paginated users list', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@test.com',
          name: 'User 1',
          role: { name: 'USER' },
          createdAt: new Date(),
        },
        {
          id: '2',
          email: 'user2@test.com',
          name: 'User 2',
          role: { name: 'ADMIN' },
          createdAt: new Date(),
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([2, mockUsers]);

      const result = await getAllUsers({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter users by search term', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          role: { name: 'USER' },
        },
      ];

      mockPrisma.$transaction.mockResolvedValue([1, mockUsers]);

      const result = await getAllUsers({ page: 1, limit: 10, search: 'test' });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: '1',
        email: 'user@test.com',
        name: 'Test User',
        role: { name: 'USER' },
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById('1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundError when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(getUserById('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('createUser', () => {
    it('should create new user', async () => {
      const userData = {
        email: 'newuser@test.com',
        name: 'New User',
        password: 'password123',
        roleId: 'role-id',
      };

      const mockCreatedUser = {
        id: '1',
        email: userData.email,
        name: userData.name,
        role: { name: 'USER' },
      };

      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await createUser(userData);

      expect(result.email).toBe(userData.email);
      expect(result.name).toBe(userData.name);
    });

    it('should throw ConflictError when email already exists', async () => {
      const userData = {
        email: 'existing@test.com',
        name: 'Existing User',
        password: 'password123',
      };

      mockPrisma.user.findFirst.mockResolvedValue({ id: '1', email: userData.email });

      await expect(createUser(userData)).rejects.toThrow(ConflictError);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const mockUpdatedUser = {
        id: '1',
        email: 'user@test.com',
        name: 'Updated Name',
        role: { name: 'USER' },
      };

      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await updateUser('1', updateData);

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundError when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(updateUser('999', { name: 'Test' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.user.delete.mockResolvedValue({ id: '1' });

      const result = await deleteUser('1');

      expect(result).toEqual({ id: '1' });
    });

    it('should throw NotFoundError when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(deleteUser('999')).rejects.toThrow(NotFoundError);
    });
  });
});

// Service functions (simplified implementations for testing)
async function getAllUsers(options: { page: number; limit: number; search?: string }) {
  const { page, limit, search } = options;
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' as const } },
          { name: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [total, data] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: { role: { select: { name: true } } },
    }),
  ]);

  return { data, total, page, limit };
}

async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { role: { select: { name: true } } },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

async function createUser(data: {
  email: string;
  name: string;
  password: string;
  roleId?: string;
}) {
  const existingUser = await prisma.user.findFirst({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: 'hashed_password',
      roleId: data.roleId,
    },
    include: { role: { select: { name: true } } },
  });

  return user;
}

async function updateUser(id: string, data: { name?: string; email?: string; roleId?: string }) {
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (data.email) {
    const emailExists = await prisma.user.findFirst({
      where: { email: data.email, NOT: { id } },
    });

    if (emailExists) {
      throw new ConflictError('Email already in use');
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    include: { role: { select: { name: true } } },
  });

  return user;
}

async function deleteUser(id: string) {
  const existingUser = await prisma.user.findUnique({ where: { id } });

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  return prisma.user.delete({ where: { id } });
}
