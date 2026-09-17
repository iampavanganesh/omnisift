import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

/**
 * Base application error. Every thrown domain error extends this so the global
 * filter can render a consistent, safe JSON response. Never leak stack traces.
 */
export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly status: HttpStatus;
  /** Safe message shown to the user. */
  readonly userMessage: string;
  /** Optional structured detail for logs (never sent to client). */
  readonly detail?: unknown;

  constructor(userMessage: string, detail?: unknown) {
    super(userMessage);
    this.name = this.constructor.name;
    this.userMessage = userMessage;
    this.detail = detail;
  }
}

export class ValidationError extends AppError {
  readonly code = ErrorCode.VALIDATION;
  readonly status = HttpStatus.BAD_REQUEST;
}
export class AuthenticationError extends AppError {
  readonly code = ErrorCode.AUTHENTICATION;
  readonly status = HttpStatus.UNAUTHORIZED;
}
export class AuthorizationError extends AppError {
  readonly code = ErrorCode.AUTHORIZATION;
  readonly status = HttpStatus.FORBIDDEN;
}
export class NotFoundError extends AppError {
  readonly code = ErrorCode.NOT_FOUND;
  readonly status = HttpStatus.NOT_FOUND;
}
export class ProviderError extends AppError {
  readonly code = ErrorCode.PROVIDER;
  readonly status = HttpStatus.BAD_GATEWAY;
}
export class DatabaseError extends AppError {
  readonly code = ErrorCode.DATABASE;
  readonly status = HttpStatus.INTERNAL_SERVER_ERROR;
}
export class BusinessRuleError extends AppError {
  readonly code = ErrorCode.BUSINESS_RULE;
  readonly status = HttpStatus.UNPROCESSABLE_ENTITY;
}
