export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public code: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}
