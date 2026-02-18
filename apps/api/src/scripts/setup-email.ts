import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

async function main() {
  const account = await nodemailer.createTestAccount();

  logger.info('Ethereal Email Credentials:');
  logger.info(`SMTP_USER=${account.user}`);
  logger.info(`SMTP_PASS=${account.pass}`);
  logger.info('Preview emails at: https://ethereal.email');
}

main().catch(console.error);
