import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyToken,
  decodeToken,
  getTokenExpiration,
  isTokenExpired,
  TokenPayload,
} from '../token';

describe('Token utilities', () => {
  const payload: TokenPayload = {
    userId: '123',
    email: 'test@example.com',
    role: 'user',
  };

  const customSecret = 'custom-secret';
  const customExpiresIn = '1h';

  beforeEach(() => {
    // Set environment variables for consistent testing
    vi.stubEnv('JWT_SECRET', 'test-secret');
    vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret');
    vi.stubEnv('TOKEN_ISSUER', 'test-issuer');
    vi.stubEnv('TOKEN_AUDIENCE', 'test-audience');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('generateAccessToken', () => {
    it('should generate a JWT access token', () => {
      const token = generateAccessToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has three parts
    });

    it('should generate token with custom secret and expiresIn', () => {
      const token = generateAccessToken(payload, customSecret, customExpiresIn);
      expect(token).toBeDefined();
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a JWT refresh token', () => {
      const token = generateRefreshToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate refresh token with custom secret and expiresIn', () => {
      const token = generateRefreshToken(payload, customSecret, customExpiresIn);
      expect(token).toBeDefined();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw AuthenticationError for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid or expired access token');
    });

    it('should verify with custom secret', () => {
      const token = generateAccessToken(payload, customSecret);
      const decoded = verifyAccessToken(token, customSecret);
      expect(decoded.userId).toBe(payload.userId);
    });

    it('should throw for token signed with different secret', () => {
      const token = generateAccessToken(payload, customSecret);
      expect(() => verifyAccessToken(token, 'wrong-secret')).toThrow(
        'Invalid or expired access token'
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(payload);
      const decoded = verifyRefreshToken(token);
      expect(decoded.userId).toBe(payload.userId);
    });

    it('should throw AuthenticationError for invalid refresh token', () => {
      const invalidToken = 'invalid.token.here';
      expect(() => verifyRefreshToken(invalidToken)).toThrow('Invalid or expired refresh token');
    });
  });

  describe('verifyToken (alias)', () => {
    it('should be an alias for verifyAccessToken', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = generateAccessToken(payload);
      const decoded = decodeToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded!.userId).toBe(payload.userId);
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = decodeToken(invalidToken);
      expect(decoded).toBeNull();
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration timestamp for valid token', () => {
      const token = generateAccessToken(payload);
      const expiration = getTokenExpiration(token);
      expect(expiration).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const expiration = getTokenExpiration(invalidToken);
      expect(expiration).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const token = generateAccessToken(payload, undefined, '1h');
      const expired = isTokenExpired(token);
      expect(expired).toBe(false);
    });

    it('should return true for expired token', () => {
      // Create a token with immediate expiration (past)
      const token = generateAccessToken(payload, undefined, '-1s');
      const expired = isTokenExpired(token);
      expect(expired).toBe(true);
    });

    it('should return true for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const expired = isTokenExpired(invalidToken);
      expect(expired).toBe(true);
    });
  });
});
