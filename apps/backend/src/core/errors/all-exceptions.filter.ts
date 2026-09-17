import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Request, Response } from 'express';
import { AppError } from './app-error';
import { ErrorCode } from './error-codes';

/**
 * Global exception filter. Maps AppError / HttpException / unknown into a single
 * safe JSON shape. Stack traces are logged, never returned.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL;
    let userMessage = 'Something went wrong. Please try again.';

    if (exception instanceof AppError) {
      status = exception.status;
      code = exception.code;
      userMessage = exception.userMessage;
      this.logger.warn({ code, detail: exception.detail, path: req.url }, exception.message);
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      userMessage = exception.message;
      code = status === HttpStatus.UNAUTHORIZED ? ErrorCode.AUTHENTICATION : ErrorCode.VALIDATION;
      this.logger.warn({ code, path: req.url }, exception.message);
    } else {
      this.logger.error({ path: req.url, err: exception }, 'Unhandled exception');
    }

    res.status(status).json({
      success: false,
      error: { code, message: userMessage },
      requestId: (req.headers['x-request-id'] as string) ?? null,
    });
  }
}
