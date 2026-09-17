import { ApiProperty } from '@nestjs/swagger';
import { ErrorCode } from '../../core/errors/error-codes';

/**
 * Documentation-only mirror of the single error shape every failure is
 * rendered as by AllExceptionsFilter. Nothing constructs these classes at
 * runtime — the filter writes the object directly — they exist so the OpenAPI
 * document describes the real error body instead of leaving it undefined.
 */
export class ApiErrorDetailDto {
  @ApiProperty({
    enum: ErrorCode,
    enumName: 'ErrorCode',
    description: 'Stable machine-readable code. Safe to branch on.',
  })
  code!: ErrorCode;

  @ApiProperty({
    description: 'Safe, user-facing message. Never contains a stack trace or internal detail.',
  })
  message!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false, description: 'Always false on an error response.' })
  success!: boolean;

  @ApiProperty({ type: ApiErrorDetailDto })
  error!: ApiErrorDetailDto;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Correlation id echoed from the x-request-id request header, or null.',
  })
  requestId!: string | null;
}
