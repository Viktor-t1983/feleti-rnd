import { beforeAll, describe, expect, it, vi } from 'vitest';

import { comparePassword, hashPassword, isPasswordValid, validatePassword } from '../password';

// Mock bcrypt to avoid actual hashing in tests
const { mockHash, mockCompare } = vi.hoisted(() => {
  let hashCallCount = 0;
  const mockHash = vi.fn().mockImplementation(() => {
    hashCallCount++;
    return Promise.resolve(`$2b$12$hashedpassword${hashCallCount}`);
  });
  const mockCompare = vi.fn().mockResolvedValue(true);
  return { mockHash, mockCompare };
});

vi.mock('bcrypt', () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
  },
  hash: mockHash,
  compare: mockCompare,
}));

describe('Password utilities', () => {
  const plainPassword = 'SecurePass123!';
  let hashedPassword: string;

  beforeAll(async () => {
    hashedPassword = await hashPassword(plainPassword);
  });

  describe('hashPassword', () => {
    it('should hash a password', () => {
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for same password due to salt', async () => {
      const anotherHash = await hashPassword(plainPassword);
      expect(anotherHash).not.toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const result = await comparePassword(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      mockCompare.mockResolvedValueOnce(false);
      const result = await comparePassword('wrongpassword', hashedPassword);
      expect(result).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept a valid password meeting all requirements', () => {
      // Password with 12+ chars, uppercase, lowercase, numbers, symbols
      const result = validatePassword('ValidPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short (< 12 chars)', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });

    it('should reject password that is too long (> 128 chars)', () => {
      const longPassword = 'a'.repeat(129);
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must not exceed 128 characters');
    });

    it('should reject password without uppercase', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without numbers', () => {
      const result = validatePassword('NoNumbers!Aa');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without symbols', () => {
      const result = validatePassword('NoSymbols123Aa');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should reject password with too many consecutive identical characters', () => {
      const result = validatePassword('aaaaTest123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must not contain more than 3 consecutive identical characters'
      );
    });

    it('should accept password with less than 3 consecutive identical characters', () => {
      const result = validatePassword('aaTest12345!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPasswordValid', () => {
    it('should return true for valid password', () => {
      expect(isPasswordValid('ValidPass123!')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(isPasswordValid('short')).toBe(false);
    });
  });
});
