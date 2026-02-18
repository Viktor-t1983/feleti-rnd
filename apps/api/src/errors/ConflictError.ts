import { AppError } from './AppError';

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(409, message, 'CONFLICT_ERROR', details);
  }
}
