/**
 * Email Service
 * Отправка email уведомлений через NodeMailer
 */

import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../../utils/logger';

// Типы для писем
interface WelcomeEmailData {
  to: string;
  fullName: string;
}

interface ProjectCreatedEmailData {
  to: string;
  fullName: string;
  projectName: string;
  projectCode: string;
}

interface TeamInviteEmailData {
  to: string;
  fullName: string;
  projectName: string;
  role: string;
  invitedBy: string;
}

interface DeadlineWarningEmailData {
  to: string;
  fullName: string;
  projectName: string;
  projectCode: string;
  daysLeft: number;
  targetDate: Date;
}

interface BudgetWarningEmailData {
  to: string;
  fullName: string;
  projectName: string;
  projectCode: string;
  budgetUsed: number;
  budget: number;
  spent: number;
}

interface PasswordResetEmailData {
  to: string;
  fullName: string;
  token: string;
  expiresIn: string;
}

// HTML шаблон базовый
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width">
  <title>FELETI R&D</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont,
        'Segoe UI', Arial, sans-serif;
      background: #f3f4f6;
      color: #111827;
    }
    .wrapper {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.07);
    }
    .header {
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #93c5fd;
      font-size: 14px;
      margin-top: 4px;
    }
    .body {
      padding: 40px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #1e3a5f;
      margin-bottom: 16px;
    }
    .text {
      font-size: 15px;
      color: #374151;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px 24px;
      margin: 24px 0;
    }
    .card-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
      font-size: 14px;
    }
    .card-row:last-child { border-bottom: none; }
    .card-label { color: #6b7280; }
    .card-value { color: #111827; font-weight: 600; }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      margin: 8px 0;
    }
    .btn-center { text-align: center; margin: 24px 0; }
    .warning-box {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .danger-box {
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 12px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .progress-bar-bg {
      background: #e5e7eb;
      border-radius: 100px;
      height: 10px;
      margin: 8px 0;
      overflow: hidden;
    }
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 24px 40px;
      text-align: center;
    }
    .footer p {
      font-size: 13px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>FELETI R&D</h1>
      <p>Система управления R&D проектами</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} FELETI R&D System</p>
      <p style="margin-top:4px">
        Это автоматическое уведомление.
        Не отвечайте на это письмо.
      </p>
    </div>
  </div>
</body>
</html>`;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // В development используем Ethereal (тестовый SMTP)
    // В production используем реальный SMTP из config
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: false,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  // Проверка подключения
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      logger.warn({ msg: 'Email service not connected', error });
      return false;
    }
  }

  // Базовый метод отправки
  private async send(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<nodemailer.SentMessageInfo | null> {
    try {
      const info = await this.transporter.sendMail({
        from: `"FELETI R&D" <${config.smtp.from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      logger.info({ msg: `Email sent to ${options.to}`, messageId: info.messageId });

      // В development логируем URL для просмотра
      if (config.isDevelopment) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
          logger.info({ msg: 'Email preview URL', previewUrl });
          logger.info(`Preview URL: ${previewUrl}`);
        }
      }

      return info;
    } catch (error) {
      logger.error({ msg: 'Email send error', error });
      // Не выбрасываем ошибку - email не должен
      // блокировать основной функционал!
      return null;
    }
  }

  // 1. Приветственное письмо
  async sendWelcomeEmail(data: WelcomeEmailData) {
    const html = baseTemplate(`
      <p class="greeting">
        Добро пожаловать, ${data.fullName}! 🎉
      </p>
      <p class="text">
        Ваш аккаунт в системе FELETI R&D успешно создан.
        Теперь вы можете управлять R&D проектами,
        отслеживать бюджеты и анализировать финансовые
        показатели.
      </p>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Email</span>
          <span class="card-value">${data.to}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Имя</span>
          <span class="card-value">${data.fullName}</span>
        </div>
      </div>
      <div class="btn-center">
        <a href="${config.frontendUrl}" class="btn">
          Войти в систему →
        </a>
      </div>
    `);

    return this.send({
      to: data.to,
      subject: '🎉 Добро пожаловать в FELETI R&D!',
      html,
    });
  }

  // 2. Создание проекта
  async sendProjectCreatedEmail(data: ProjectCreatedEmailData) {
    const html = baseTemplate(`
      <p class="greeting">Проект создан успешно! 🚀</p>
      <p class="text">
        Здравствуйте, ${data.fullName}!
        Вы успешно создали новый R&D проект в системе
        FELETI R&D.
      </p>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Код проекта</span>
          <span class="card-value">${data.projectCode}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Название</span>
          <span class="card-value">${data.projectName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Статус</span>
          <span class="card-value"
            style="color:#22c55e">Активен</span>
        </div>
      </div>
      <div class="btn-center">
        <a href="${config.frontendUrl}/projects" class="btn">
          Открыть проект →
        </a>
      </div>
    `);

    return this.send({
      to: data.to,
      subject: `🚀 Проект ${data.projectCode} создан`,
      html,
    });
  }

  // 3. Приглашение в команду
  async sendTeamInviteEmail(data: TeamInviteEmailData) {
    const html = baseTemplate(`
      <p class="greeting">Вас добавили в проект! 👥</p>
      <p class="text">
        Здравствуйте, ${data.fullName}!
        ${data.invitedBy} добавил(а) вас в команду проекта.
      </p>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Проект</span>
          <span class="card-value">${data.projectName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Ваша роль</span>
          <span class="card-value">${data.role}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Добавил</span>
          <span class="card-value">${data.invitedBy}</span>
        </div>
      </div>
      <div class="btn-center">
        <a href="${config.frontendUrl}/projects" class="btn">
          Открыть проект →
        </a>
      </div>
    `);

    return this.send({
      to: data.to,
      subject: `👥 Вас добавили в проект: ${data.projectName}`,
      html,
    });
  }

  // 4. Предупреждение о дедлайне
  async sendDeadlineWarningEmail(data: DeadlineWarningEmailData) {
    const html = baseTemplate(`
      <p class="greeting">
        ⏰ Дедлайн через ${data.daysLeft} дней!
      </p>
      <p class="text">
        Здравствуйте, ${data.fullName}!
        Напоминаем о приближающемся дедлайне проекта.
      </p>
      <div class="warning-box">
        <strong>⚠️ До дедлайна осталось:
          ${data.daysLeft} дней</strong>
      </div>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Проект</span>
          <span class="card-value">${data.projectCode}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Название</span>
          <span class="card-value">${data.projectName}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Дедлайн</span>
          <span class="card-value"
            style="color:#ef4444">
            ${new Date(data.targetDate).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>
      <div class="btn-center">
        <a href="${config.frontendUrl}/projects" class="btn">
          Открыть проект →
        </a>
      </div>
    `);

    return this.send({
      to: data.to,
      subject: `⏰ Дедлайн через ${data.daysLeft} дней: ` + `${data.projectCode}`,
      html,
    });
  }

  // 5. Предупреждение о бюджете
  async sendBudgetWarningEmail(data: BudgetWarningEmailData) {
    const isOverBudget = data.budgetUsed >= 100;
    const formatMoney = (v: number) =>
      new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 0,
      }).format(v);

    const html = baseTemplate(`
      <p class="greeting">
        ${isOverBudget ? '🚨 Бюджет превышен!' : '⚠️ Бюджет на исходе!'}
      </p>
      <p class="text">
        Здравствуйте, ${data.fullName}!
        ${
          isOverBudget
            ? 'Бюджет проекта превышен!'
            : `Использовано ${data.budgetUsed.toFixed(0)}%
               бюджета проекта.`
        }
      </p>
      <div class="${isOverBudget ? 'danger-box' : 'warning-box'}">
        <strong>
          ${isOverBudget ? '🚨' : '⚠️'}
          Использовано: ${data.budgetUsed.toFixed(1)}%
        </strong>
        <div class="progress-bar-bg">
          <div style="
            width: ${Math.min(data.budgetUsed, 100)}%;
            height: 10px;
            background: ${isOverBudget ? '#ef4444' : '#f59e0b'};
            border-radius: 100px;
          "></div>
        </div>
      </div>
      <div class="card">
        <div class="card-row">
          <span class="card-label">Проект</span>
          <span class="card-value">${data.projectCode}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Бюджет</span>
          <span class="card-value">
            ${formatMoney(data.budget)}
          </span>
        </div>
        <div class="card-row">
          <span class="card-label">Потрачено</span>
          <span class="card-value"
            style="color:${isOverBudget ? '#ef4444' : '#f59e0b'}">
            ${formatMoney(data.spent)}
          </span>
        </div>
        <div class="card-row">
          <span class="card-label">Остаток</span>
          <span class="card-value"
            style="color:${data.budget - data.spent < 0 ? '#ef4444' : '#22c55e'}">
            ${formatMoney(data.budget - data.spent)}
          </span>
        </div>
      </div>
      <div class="btn-center">
        <a href="${config.frontendUrl}/projects" class="btn">
          Открыть проект →
        </a>
      </div>
    `);

    return this.send({
      to: data.to,
      subject:
        `${isOverBudget ? '🚨' : '⚠️'} Бюджет ` +
        `${data.budgetUsed.toFixed(0)}%: ${data.projectCode}`,
      html,
    });
  }

  // 6. Сброс пароля
  async sendPasswordResetEmail(data: PasswordResetEmailData) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${data.token}`;

    const html = baseTemplate(`
      <p class="greeting">Сброс пароля 🔑</p>
      <p class="text">
        Здравствуйте, ${data.fullName}!
        Вы запросили сброс пароля для вашего аккаунта
        FELETI R&D.
      </p>
      <div class="warning-box">
        <strong>⏰ Ссылка действительна:
          ${data.expiresIn}</strong>
      </div>
      <div class="btn-center">
        <a href="${resetUrl}" class="btn">
          Сбросить пароль →
        </a>
      </div>
      <p class="text" style="font-size:13px; color:#6b7280; margin-top:16px">
        Если вы не запрашивали сброс пароля -
        просто проигнорируйте это письмо.
        Ваш пароль останется прежним.
      </p>
    `);

    return this.send({
      to: data.to,
      subject: '🔑 Сброс пароля FELETI R&D',
      html,
    });
  }
}

// Singleton
export const emailService = new EmailService();
