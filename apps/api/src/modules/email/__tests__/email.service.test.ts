import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailService } from '../email.service';

// Мокаем nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({
        messageId: 'test-message-id',
      }),
      verify: vi.fn().mockResolvedValue(true),
    }),
  },
}));

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    emailService = new EmailService();
  });

  it('should create email service instance', () => {
    expect(emailService).toBeDefined();
  });

  it('should send welcome email', async () => {
    const result = await emailService.sendWelcomeEmail({
      to: 'test@example.com',
      fullName: 'Тест Пользователь',
    });
    expect(result).toBeDefined();
  });

  it('should send project created email', async () => {
    const result = await emailService.sendProjectCreatedEmail({
      to: 'test@example.com',
      fullName: 'Тест',
      projectName: 'Куттер K-200',
      projectCode: 'K-200',
    });
    expect(result).toBeDefined();
  });

  it('should send team invitation email', async () => {
    const result = await emailService.sendTeamInviteEmail({
      to: 'test@example.com',
      fullName: 'Тест',
      projectName: 'Куттер K-200',
      role: 'Lead Engineer',
      invitedBy: 'Администратор',
    });
    expect(result).toBeDefined();
  });

  it('should send deadline warning email', async () => {
    const result = await emailService.sendDeadlineWarningEmail({
      to: 'test@example.com',
      fullName: 'Тест',
      projectName: 'Куттер K-200',
      projectCode: 'K-200',
      daysLeft: 7,
      targetDate: new Date('2025-12-31'),
    });
    expect(result).toBeDefined();
  });

  it('should send budget warning email', async () => {
    const result = await emailService.sendBudgetWarningEmail({
      to: 'test@example.com',
      fullName: 'Тест',
      projectName: 'Куттер K-200',
      projectCode: 'K-200',
      budgetUsed: 85,
      budget: 5000000,
      spent: 4250000,
    });
    expect(result).toBeDefined();
  });
});
