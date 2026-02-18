import { AppError } from '../AppError';

describe('AppError', () => {
  it('should create an error with statusCode, message, code, and details', () => {
    const error = new AppError(400, 'Test error', 'TEST_ERROR', { field: 'email' });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.details).toEqual({ field: 'email' });
    expect(error.stack).toBeDefined();
  });

  it('should have correct prototype chain', () => {
    const error = new AppError(500, 'Test', 'ERROR');
    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
  });

  it('should capture stack trace', () => {
    const error = new AppError(404, 'Test', 'NOT_FOUND');
    expect(error.stack).toContain('AppError');
  });

  it('should work without details', () => {
    const error = new AppError(403, 'Simple error', 'FORBIDDEN');
    expect(error.details).toBeUndefined();
  });
});
