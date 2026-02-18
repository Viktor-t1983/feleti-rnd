/**
 * Password Reset Service
 * Handles forgot password and reset password functionality
 */

import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { prisma } from '../../lib/prisma';
import { emailService } from '../email/email.service';

/**
 * Service for password reset operations
 */
export class PasswordResetService {
  /**
   * Request password reset - sends email with reset link
   * Always returns success to prevent email enumeration
   */
  async requestReset(email: string): Promise<{ message: string }> {
    // Always return success (security - prevent email enumeration)
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!user) {
      return {
        message: 'Если email существует - письмо отправлено',
      };
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Save token to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiresAt: expiresAt,
      },
    });

    // Send reset email
    await emailService.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      token,
      expiresIn: '1 час',
    });

    return {
      message: 'Если email существует - письмо отправлено',
    };
  }

  /**
   * Validate if reset token is valid and not expired
   */
  async validateToken(token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
      select: {
        resetToken: true,
        resetTokenExpiresAt: true,
      },
    });

    if (!user || !user.resetTokenExpiresAt) {
      return false;
    }

    return user.resetTokenExpiresAt > new Date();
  }

  /**
   * Reset password using valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
      select: {
        id: true,
        resetTokenExpiresAt: true,
      },
    });

    if (!user) {
      throw new Error('Токен не найден');
    }

    if (!user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new Error('Токен истёк');
    }

    if (newPassword.length < 6) {
      throw new Error('Пароль должен быть минимум 6 символов');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });

    return { message: 'Пароль успешно изменён' };
  }
}
