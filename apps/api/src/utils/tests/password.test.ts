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
    it('should accept a valid password', () => {
      const result = validatePassword('Valid123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePassword('short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters long');
    });

    it('should reject password that is too long', () => {
      const longPassword = 'a'.repeat(129);
      const result = validatePassword(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must not exceed 128 characters');
    });

    it('should accept password without uppercase (uppercase not required)', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('Password must contain at least one uppercase letter');
    });

    it('should accept password without lowercase (lowercase not required)', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('Password must contain at least one lowercase letter');
    });

    it('should accept password without numbers (numbers not required)', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('Password must contain at least one number');
    });

    it('should accept password without symbols (symbols not required)', () => {
      const result = validatePassword('NoSymbols123');
      expect(result.isValid).toBe(true);
      expect(result.errors).not.toContain('Password must contain at least one special character');
    });

    it('should accept password with consecutive characters (consecutive check disabled)', () => {
      const result = validatePassword('aaaabbbb123!');
      expect(result.isValid).toBe(true);
    });
  });

  describe('isPasswordValid', () => {
    it('should return true for valid password', () => {
      expect(isPasswordValid('Valid123!')).toBe(true);
    });

    it('should return false for invalid password', () => {
      expect(isPasswordValid('short')).toBe(false);
    });
  });
});
