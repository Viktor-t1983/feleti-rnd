import { FastifyReply, FastifyRequest } from 'fastify';

import { AuthenticationError } from '../errors/AuthenticationError';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Extended request type for authenticated requests
 */
export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    userId: string;
    email: string;
    role?: string;
    [key: string]: unknown;
  };
}

/**
 * Middleware to authenticate JWT tokens
 * Supports both Authorization header and cookies
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  try {
    const authHeader = request.headers.authorization;
    logger.debug({
      'Authorization header': authHeader ? authHeader.substring(0, 50) + '...' : 'none',
    });

    // Try to verify JWT from Authorization header or cookie
    await (request as unknown as { jwtVerify(): Promise<void> }).jwtVerify();

    // Attach user to request with proper typing
    const userPayload = (request as unknown as { user: { userId?: string; id?: string } }).user;

    // Fetch user from database to get all required fields
    const dbUser = await prisma.user.findUnique({
      where: { id: userPayload.userId || userPayload.id },
      include: { role: true },
    });

    if (!dbUser) {
      throw new AuthenticationError('User not found');
    }

    // Check if user account is blocked
    if (dbUser.isBlocked) {
      throw new AuthenticationError('Account is blocked. Please contact administrator.');
    }

    // Ensure user has id field (map userId to id for compatibility)
    const user = {
      id: dbUser.id,
      userId: userPayload.userId || userPayload.id || dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      fullName: dbUser.fullName,
      role: dbUser.role?.name,
    };
    (request as AuthenticatedRequest).user = user;
    logger.debug({ 'User attached': user });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    logger.error({ 'JWT verification error': err.message });
    logger.error({ 'Error code': err.code });

    // Check if it's a JWT error
    if (err.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      throw new AuthenticationError('Authorization header is required');
    }

    if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      throw new AuthenticationError('Access token has expired');
    }

    if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      throw new AuthenticationError('Invalid access token');
    }

    // Generic authentication error
    throw new AuthenticationError('Authentication failed');
  }
}

/**
 * Middleware to authenticate and require specific role
 */
export function requireRole(role: string | string[]) {
  const requiredRoles = Array.isArray(role) ? role : [role];

  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // First authenticate
    await authenticate(request, reply);

    const authenticatedRequest = request as AuthenticatedRequest;

    // Check if user has required role
    if (!authenticatedRequest.user?.role) {
      throw new AuthenticationError('User role not found');
    }

    if (!requiredRoles.includes(authenticatedRequest.user.role)) {
      throw new AuthenticationError(
        `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`
      );
    }
  };
}

/**
 * Middleware to authenticate optional JWT tokens
 * Doesn't throw error if token is missing/invalid, just doesn't attach user
 */
export async function authenticateOptional(
  _request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    await (_request as unknown as { jwtVerify(): Promise<void> }).jwtVerify();
    (_request as AuthenticatedRequest).user = (_request as unknown as { user: unknown })
      .user as AuthenticatedRequest['user'];
  } catch {
    // Silently fail for optional authentication
    // User remains undefined
  }
}

/**
 * Helper to extract token from request
 */
export function extractToken(request: FastifyRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookies = (request as unknown as { cookies?: { access_token?: string } }).cookies;
  if (cookies && cookies.access_token) {
    return cookies.access_token;
  }

  return null;
}
