import { FastifyCorsOptions } from '@fastify/cors';
import { FastifyHelmetOptions } from '@fastify/helmet';
import { RateLimitPluginOptions } from '@fastify/rate-limit';
import { FastifyRequest } from 'fastify';

// Type assertion to handle xssFilter incompatibility
type HelmetConfig = Omit<FastifyHelmetOptions, 'xssFilter'>;

// Password requirements configuration - strong security standards
export const PASSWORD_REQUIREMENTS = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  maxConsecutiveCharacters: 3,
} as const;

// Bcrypt configuration
export const BCRYPT_CONFIG = {
  saltRounds: parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12'),
};

// Validate JWT secrets are provided - fail fast if missing
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  if (value.length < 32) {
    throw new Error(`${name} must be at least 32 characters long`);
  }
  return value;
}

// JWT configuration - secrets are required, no fallbacks for security
function getJwtConfig() {
  return {
    secret: getRequiredEnvVar('JWT_SECRET'),
    expiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    refreshSecret: getRequiredEnvVar('JWT_REFRESH_SECRET'),
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  };
}

export const JWT_CONFIG = getJwtConfig();

// Helmet configuration
export const HELMET_CONFIG: HelmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://'],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", 'https://api.feleti.example.com'],
    },
  },
  hidePoweredBy: true,
  strictTransportSecurity: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },
};

// CORS configuration
export const CORS_CONFIG: FastifyCorsOptions = {
  origin: process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Total-Count',
    'X-Page',
    'X-Limit',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG: RateLimitPluginOptions = {
  max: parseInt(process.env['RATE_LIMIT_MAX'] || '100'), // Max requests per window
  timeWindow: process.env['RATE_LIMIT_WINDOW'] || '1 minute',
  continueExceeding: false,
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  } as Record<string, boolean>,
  keyGenerator: (req: FastifyRequest): string => {
    // Use X-Forwarded-For header if available, otherwise use IP
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const ip = req.ip ?? 'unknown';
    return forwarded ? (forwarded.split(',')[0]?.trim() ?? ip) : ip;
  },
};

// Stricter rate limiting for auth endpoints (login, register, password reset)
export const RATE_LIMIT_AUTH_CONFIG: RateLimitPluginOptions = {
  max: parseInt(process.env['RATE_LIMIT_AUTH_MAX'] || '5'), // Only 5 attempts
  timeWindow: process.env['RATE_LIMIT_AUTH_WINDOW'] || '15 minutes', // 15 minutes lockout
  continueExceeding: false,
  addHeadersOnExceeding: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
  } as Record<string, boolean>,
  keyGenerator: (req: FastifyRequest): string => {
    // Use X-Forwarded-For header if available, otherwise use IP
    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const ip = req.ip ?? 'unknown';
    return forwarded ? (forwarded.split(',')[0]?.trim() ?? ip) : ip;
  },
};
