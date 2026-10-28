import { BadRequestException } from '@nestjs/common';

/**
 * One password rule for every place a password is set: registration, password reset,
 * set-password links, change password and admin reset.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_RULE_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;

export function assertPasswordPolicy(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    throw new BadRequestException(PASSWORD_RULE_MESSAGE);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    throw new BadRequestException(`Password must be at most ${PASSWORD_MAX_LENGTH} characters long.`);
  }
  if (password.trim().length !== password.length) {
    throw new BadRequestException('Password must not start or end with a space.');
  }
}
