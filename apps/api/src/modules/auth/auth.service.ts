import { AuthenticationError, ConflictError, NotFoundError, ValidationError } from '../../errors';
import { logger } from '../../utils/logger';
import { comparePassword, hashPassword, validatePassword } from '../../utils/password';

import { LoginInput, RegisterInput } from './auth.schemas';
import { AuthUser } from './auth.types';

import { prisma } from '../../lib/prisma';
import { emailService } from '../email/email.service';

export async function register(input: RegisterInput): Promise<{ user: AuthUser }> {
  // Validate password
  const passwordValidation = validatePassword(input.password);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(', '));
  }

  // Validate email format (additional check)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(input.email)) {
    throw new ValidationError('Invalid email format');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: input.email },
        { username: input.username },
      ],
    },
  });

  if (existingUser) {
    if (existingUser.email === input.email) {
      throw new ConflictError('Email already exists');
    }
    throw new ConflictError('Username already exists');
  }

  const passwordHash = await hashPassword(input.password);

  // Get or create default role
  let roleId = input.roleId;
  if (!roleId) {
    const defaultRole = await prisma.role.findFirst({
      where: { name: 'Engineer' },
    });
    if (!defaultRole) {
      throw new ValidationError('Default role not found');
    }
    roleId = defaultRole.id;
  }

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      fullName: input.fullName,
      roleId,
    },
    include: { role: true },
  });

  // Return user without password (tokens will be generated in routes)
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
  const { passwordHash: _PasswordHash, ...userWithoutPassword } = user;

  // Отправляем email в фоне (не ждём)
  emailService
    .sendWelcomeEmail({
      to: user.email,
      fullName: user.fullName,
    })
    .catch((err) => logger.warn({ msg: 'Welcome email failed', error: err }));

  return {
    user: {
      ...userWithoutPassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}

export async function login(input: LoginInput): Promise<{ user: AuthUser }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { role: true },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  const isValidPassword = await comparePassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Return user without password (tokens will be generated in routes)
  // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
  const { passwordHash: _PasswordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
  };
}

// Export all functions as AuthService for testing
export const AuthService = {
  register,
  login,
  getUserById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
    const { passwordHash: _PasswordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
};
