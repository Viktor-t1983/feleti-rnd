/**
 * Password Reset Service Tests
 * Tests for password reset functionality (forgot password, reset password)
 */

import { beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// Mock dependencies
vi.mock('../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../modules/email/email.service', () => ({
  emailService: {
    sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock('crypto', () => ({
  randomBytes: vi.fn().mockReturnValue({
    toString: vi.fn().mockReturnValue('test-reset-token-12345678'),
  }),
}));

import { prisma } from '../../../lib/prisma';
import { emailService } from '../../email/email.service';
import { PasswordResetService } from '../password-reset.service';

const mockPrisma = prisma as unknown as {
  user: {
    findUnique: Mock;
    update: Mock;
  };
};

describe('PasswordResetService', () => {
  let service: PasswordResetService;

  beforeEach(() => {
    service = new PasswordResetService();
    vi.clearAllMocks();
  });

  describe('requestReset()', () => {
    const existingUser = {
      id: 'user-1',
      email: 'test@feleti.com',
      fullName: 'Тест Тестов',
    };

    it('should request password reset for existing user', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        ...existingUser,
        resetToken: 'test-reset-token-12345678',
        resetTokenExpiresAt: new Date(Date.now() + 3600000),
      });

      // Act
      const result = await service.requestReset('test@feleti.com');

      // Assert
      expect(result).toHaveProperty('message');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@feleti.com' },
        select: { id: true, email: true, fullName: true },
      });
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith({
        to: 'test@feleti.com',
        fullName: 'Тест Тестов',
        token: 'test-reset-token-12345678',
        expiresIn: '1 час',
      });
    });

    it('should return success even if email not found (security)', async () => {
      // Arrange - user not found
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.requestReset('notfound@feleti.com');

      // Assert - should not throw, should return success message
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Если email существует - письмо отправлено');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('validateToken()', () => {
    it('should return true for valid non-expired token', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        resetToken: 'valid-token',
        resetTokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      });

      // Act
      const result = await service.validateToken('valid-token');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for invalid token', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.validateToken('invalid-token');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for expired token', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        resetToken: 'expired-token',
        resetTokenExpiresAt: new Date(Date.now() - 3600000), // expired 1 hour ago
      });

      // Act
      const result = await service.validateToken('expired-token');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('resetPassword()', () => {
    const validUser = {
      id: 'user-1',
      resetToken: 'valid-token',
      resetTokenExpiresAt: new Date(Date.now() + 3600000),
    };

    it('should reset password with valid token', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(validUser);
      mockPrisma.user.update.mockResolvedValue({
        id: 'user-1',
        email: 'test@feleti.com',
      });

      // Act
      const result = await service.resetPassword('valid-token', 'newpassword123');

      // Assert
      expect(result).toHaveProperty('message');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          password: 'hashed_password',
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      });
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.resetPassword('invalid-token', 'newpassword123')).rejects.toThrow(
        'Токен не найден'
      );
    });

    it('should throw error for expired token', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        resetToken: 'expired-token',
        resetTokenExpiresAt: new Date(Date.now() - 3600000),
      });

      // Act & Assert
      await expect(service.resetPassword('expired-token', 'newpassword123')).rejects.toThrow(
        'Токен истёк'
      );
    });

    it('should throw error for short password', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(validUser);

      // Act & Assert
      await expect(service.resetPassword('valid-token', '123')).rejects.toThrow(
        'Пароль должен быть минимум 6 символов'
      );
    });
  });
});
