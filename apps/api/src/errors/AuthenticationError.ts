import { AppError } from './AppError';

/**
 * Error class for authentication errors (HTTP 401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(401, message, 'AUTHENTICATION_ERROR', details);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
