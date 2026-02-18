import jwt from 'jsonwebtoken';

import { JWT_CONFIG } from '../config/security.config';
import { AuthenticationError } from '../errors/AuthenticationError';

export interface TokenPayload {
  userId: string;
  email: string;
  role?: string;
  exp?: number;
  iat?: number;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Generates a JWT access token
 * @param payload Data to include in the token
 * @param secret Secret key to sign the token (defaults to JWT_CONFIG.secret)
 * @param expiresIn Expiration time (defaults to JWT_CONFIG.expiresIn)
 * @returns Signed JWT token
 */
export const generateAccessToken = (
  payload: TokenPayload,
  secret?: string,
  expiresIn?: string
): string => {
  const signingSecret = secret || JWT_CONFIG.secret;
  const expiration = expiresIn || JWT_CONFIG.expiresIn;

  return jwt.sign(payload, signingSecret, {
    expiresIn: expiration as string | number,
    issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
    audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
  } as jwt.SignOptions);
};

/**
 * Generates a JWT refresh token
 * @param payload Data to include in the token
 * @param secret Secret key to sign the token (defaults to JWT_CONFIG.refreshSecret)
 * @param expiresIn Expiration time (defaults to JWT_CONFIG.refreshExpiresIn)
 * @returns Signed JWT refresh token
 */
export const generateRefreshToken = (
  payload: TokenPayload,
  secret?: string,
  expiresIn?: string
): string => {
  const signingSecret = secret || JWT_CONFIG.refreshSecret;
  const expiration = expiresIn || JWT_CONFIG.refreshExpiresIn;

  return jwt.sign(payload, signingSecret, {
    expiresIn: expiration as string | number,
    issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
    audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
  } as jwt.SignOptions);
};

/**
 * Verifies a JWT access token
 * @param token Token to verify
 * @param secret Secret key to verify the token (defaults to JWT_CONFIG.secret)
 * @returns Decoded token payload
 */
export const verifyAccessToken = (token: string, secret?: string): TokenPayload => {
  const verificationSecret = secret || JWT_CONFIG.secret;

  try {
    return jwt.verify(token, verificationSecret, {
      issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
      audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
    }) as TokenPayload;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired access token');
  }
};

/**
 * Verifies a JWT refresh token
 * @param token Token to verify
 * @param secret Secret key to verify the token (defaults to JWT_CONFIG.refreshSecret)
 * @returns Decoded token payload
 */
export const verifyRefreshToken = (token: string, secret?: string): TokenPayload => {
  const verificationSecret = secret || JWT_CONFIG.refreshSecret;

  try {
    return jwt.verify(token, verificationSecret, {
      issuer: process.env['TOKEN_ISSUER'] || 'feleti-api',
      audience: process.env['TOKEN_AUDIENCE'] || 'feleti-users',
    }) as TokenPayload;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
};

/**
 * Decodes a JWT token without verifying its signature
 * @param token Token to decode
 * @returns Decoded token payload or null if invalid
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Gets token expiration time
 * @param token Token to check
 * @returns Expiration timestamp or null if invalid
 */
export const getTokenExpiration = (token: string): number | null => {
  const decoded = decodeToken(token);
  return decoded && decoded.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
};

/**
 * Checks if a token is expired
 * @param token Token to check
 * @returns Boolean indicating if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) {
    return true; // Consider invalid tokens as expired
  }
  return Date.now() >= expiration;
};

/**
 * Alias for verifyAccessToken for backward compatibility
 */
export const verifyToken = verifyAccessToken;
