import bcrypt from 'bcryptjs';

import { BCRYPT_CONFIG, PASSWORD_REQUIREMENTS } from '../config/security.config';

/**
 * Hashes a plain text password using bcrypt
 * @param password Plain text password to hash
 * @returns Promise<string> Hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_CONFIG.saltRounds);
};

/**
 * Compares a plain text password with a hashed password
 * @param password Plain text password
 * @param hashedPassword Hashed password to compare against
 * @returns Promise<boolean> True if passwords match, false otherwise
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Validates a password against the defined requirements
 * @param password Password to validate
 * @returns Object containing validity and error messages
 */
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check length requirements
  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`);
  }

  if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_REQUIREMENTS.maxLength} characters`);
  }

  // Check for uppercase requirement
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase requirement
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for number requirement
  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for symbol requirement
  if (PASSWORD_REQUIREMENTS.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for consecutive characters
  if (PASSWORD_REQUIREMENTS.maxConsecutiveCharacters > 0) {
    const consecutiveRegex = new RegExp(
      `(.)\\1{${PASSWORD_REQUIREMENTS.maxConsecutiveCharacters},}`
    );
    if (consecutiveRegex.test(password)) {
      errors.push(
        `Password must not contain more than ${PASSWORD_REQUIREMENTS.maxConsecutiveCharacters} consecutive identical characters`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Checks if a password meets the requirements without returning detailed errors
 * @param password Password to check
 * @returns boolean True if password meets requirements, false otherwise
 */
export const isPasswordValid = (password: string): boolean => {
  return validatePassword(password).isValid;
};
