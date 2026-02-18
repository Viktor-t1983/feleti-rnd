import { AppError } from './AppError';

/**
 * Error class for authorization errors (HTTP 403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(403, message, 'AUTHORIZATION_ERROR', details);
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}
