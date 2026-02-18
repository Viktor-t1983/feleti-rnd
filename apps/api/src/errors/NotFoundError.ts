import { AppError } from './AppError';

/**
 * Error class for not found errors (HTTP 404)
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(404, message, 'NOT_FOUND_ERROR', details);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
