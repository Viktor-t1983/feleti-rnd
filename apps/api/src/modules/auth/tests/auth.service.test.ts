import { PrismaClient } from '@prisma/client';
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../utils/password', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
  validatePassword: vi.fn(),
}));

vi.mock('../../../utils/token', () => ({
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
}));

vi.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../../errors';
import { comparePassword, hashPassword, validatePassword } from '../../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../../utils/token';
import { AuthService } from '../auth.service';

const mockHashPassword = hashPassword as Mock;
const mockComparePassword = comparePassword as Mock;
const mockValidatePassword = validatePassword as Mock;
const mockGenerateAccessToken = generateAccessToken as Mock;
const mockGenerateRefreshToken = generateRefreshToken as Mock;

// We need to access mockPrisma in tests, so we can get it from the mocked module
interface MockPrisma {
  user: {
    findUnique: Mock;
    create: Mock;
  };
  role: {
    findUnique: Mock;
  };
}

const mockPrisma = new PrismaClient() as unknown as MockPrisma;

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register()', () => {
    const validUserData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'StrongPass123!',
      fullName: 'Test User',
      roleId: 'role-123',
    };

    it('should create user with hashed password', async () => {
      // Arrange
      const hashedPassword = 'hashed_password_123';
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-123', name: 'User' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        fullName: 'Test User',
        roleId: 'role-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        role: { id: 'role-123', name: 'User' },
      });
      mockGenerateAccessToken.mockReturnValue('access_token');
      mockGenerateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await AuthService.register(validUserData);

      // Assert
      expect(mockValidatePassword).toHaveBeenCalledWith(validUserData.password);
      expect(mockHashPassword).toHaveBeenCalledWith(validUserData.password);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: validUserData.email,
          username: validUserData.username,
          passwordHash: hashedPassword,
          fullName: validUserData.fullName,
          roleId: validUserData.roleId,
        },
        include: { role: true },
      });
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        roleId: 'role-123',
        createdAt: expect.any(Date) as unknown as Date,
        updatedAt: expect.any(Date) as unknown as Date,
        role: {
          id: 'role-123',
          name: 'User',
        },
      });
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictError if email already exists', async () => {
      // Arrange
      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing-user' });
      mockPrisma.role.findUnique.mockResolvedValueOnce({ id: 'role-123', name: 'User' });

      // Act & Assert
      await expect(AuthService.register(validUserData)).rejects.toThrow(ConflictError);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if password is weak', async () => {
      // Arrange
      const weakPasswordData = { ...validUserData, password: 'weak' };
      mockValidatePassword.mockReturnValue({
        isValid: false,
        errors: ['Password must be at least 8 characters'],
      });

      // Act & Assert
      await expect(AuthService.register(weakPasswordData)).rejects.toThrow(ValidationError);
      expect(mockHashPassword).not.toHaveBeenCalled();
    });

    it('should throw ValidationError if email is invalid', async () => {
      // Arrange
      const invalidEmailData = { ...validUserData, email: 'invalid-email' };
      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      // Email validation happens in service with regex
      // We'll let the service throw ValidationError

      // Act & Assert
      await expect(AuthService.register(invalidEmailData)).rejects.toThrow(ValidationError);
    });

    it('should not return password field', async () => {
      // Arrange
      const hashedPassword = 'hashed_password_123';
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockValidatePassword.mockReturnValue({ isValid: true, errors: [] });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.role.findUnique.mockResolvedValue({ id: 'role-123', name: 'User' });
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
        fullName: 'Test User',
        roleId: 'role-123',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: { id: 'role-123', name: 'User' },
      });
      mockGenerateAccessToken.mockReturnValue('access_token');
      mockGenerateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await AuthService.register(validUserData);

      // Assert
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('passwordHash');
    });
  });

  describe('login()', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'StrongPass123!',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed_password_123',
      fullName: 'Test User',
      roleId: 'role-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      role: { id: 'role-123', name: 'User' },
    };

    it('should return user and tokens for valid credentials', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateAccessToken.mockReturnValue('access_token');
      mockGenerateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: validCredentials.email },
        include: { role: true },
      });
      expect(mockComparePassword).toHaveBeenCalledWith(
        validCredentials.password,
        mockUser.passwordHash
      );
      expect(result.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        roleId: 'role-123',
        createdAt: expect.any(Date) as unknown as Date,
        updatedAt: expect.any(Date) as unknown as Date,
        role: {
          id: 'role-123',
          name: 'User',
        },
      });
    });

    it('should throw AuthenticationError for invalid email', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        AuthService.login({ email: 'nonexistent@example.com', password: 'password' })
      ).rejects.toThrow(AuthenticationError);
      expect(mockComparePassword).not.toHaveBeenCalled();
    });

    it('should throw AuthenticationError for invalid password', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(
        AuthService.login({ email: validCredentials.email, password: 'wrongpassword' })
      ).rejects.toThrow(AuthenticationError);
      expect(mockComparePassword).toHaveBeenCalledWith('wrongpassword', mockUser.passwordHash);
    });

    it('should include role in user object', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockComparePassword.mockResolvedValue(true);
      mockGenerateAccessToken.mockReturnValue('access_token');
      mockGenerateRefreshToken.mockReturnValue('refresh_token');

      // Act
      const result = await AuthService.login(validCredentials);

      // Assert
      expect(result.user.role?.id).toBe('role-123');
      expect(result.user.role).toEqual({
        id: 'role-123',
        name: 'User',
      });
    });
  });

  describe('getUserById()', () => {
    const userId = 'user-123';
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashed_password_123',
      fullName: 'Test User',
      roleId: 'role-123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      role: { id: 'role-123', name: 'User' },
    };

    it('should return user with role', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.getUserById(userId);

      // Assert
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { role: true },
      });
      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        roleId: 'role-123',
        createdAt: expect.any(Date) as unknown as Date,
        updatedAt: expect.any(Date) as unknown as Date,
        role: {
          id: 'role-123',
          name: 'User',
        },
      });
    });

    it('should not return password', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await AuthService.getUserById(userId);

      // Assert
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundError for invalid ID', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(AuthService.getUserById('non-existent-id')).rejects.toThrow(NotFoundError);
    });
  });

});
