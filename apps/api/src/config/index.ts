import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  return value;
}

function requireEnvWithLength(name: string, minLength: number = 1): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${name}`);
  }
  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters long`);
  }
  return value;
}

export const config = {
  nodeEnv: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '3001'),
  databaseUrl: requireEnv('DATABASE_URL'),
  jwt: {
    secret: requireEnvWithLength('JWT_SECRET', 32),
    refreshSecret: requireEnvWithLength('JWT_REFRESH_SECRET', 32),
    expiresIn: process.env['JWT_EXPIRES_IN'] || '2h',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  cors: {
    origin: (process.env['CORS_ORIGIN'] || 'http://localhost:5173').split(','),
    credentials: true,
  },
  smtp: {
    host: process.env['SMTP_HOST'] || 'smtp.ethereal.email',
    port: parseInt(process.env['SMTP_PORT'] || '587'),
    user: process.env['SMTP_USER'] || '',
    pass: process.env['SMTP_PASS'] || '',
    from: process.env['SMTP_FROM'] || 'noreply@feleti.com',
  },
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost',
  isProduction: process.env['NODE_ENV'] === 'production',
  isDevelopment: process.env['NODE_ENV'] === 'development',
  deepseek: {
    apiKey: process.env['DEEPSEEK_API_KEY'] || '',
    baseURL: process.env['DEEPSEEK_BASE_URL'] || 'https://api.deepseek.com',
    model: process.env['DEEPSEEK_MODEL'] || 'deepseek-chat',
  },
  calcEngine: {
    url: process.env['CALC_ENGINE_URL'] || 'http://localhost:8000',
  },
} as const;
