import { Prisma } from '@prisma/client';

import { LoginInput, RegisterInput } from './auth.schemas';

// TODO: Define proper UserResponse type
type UserResponse = {
  id: string;
  email: string;
  username: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * User data returned by authentication services
 * (without sensitive fields like passwordHash)
 */
export interface AuthUser extends Omit<UserResponse, 'createdAt' | 'updatedAt'> {
  createdAt: Date;
  updatedAt: Date;
  role?: {
    id: string;
    name: string;
    permissions: Prisma.JsonValue;
    description: string | null;
    isSystem: boolean;
  };
}

/**
 * Login response with tokens
 */
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Register response
 */
export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Token response for refresh endpoint
 */
export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Refresh token response (legacy, use TokenResponse)
 */
export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * JWT payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Authentication service interface
 */
export interface IAuthService {
  register(userData: RegisterInput): Promise<RegisterResponse>;
  login(loginInput: LoginInput): Promise<LoginResponse>;
  getUserById(id: string): Promise<AuthUser>;
  verifyToken(token: string): Promise<JwtPayload | null>;
}
