import { applyDecorators } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../dto/error-response.dto';

/**
 * Documents the failures a route can actually produce. Every one of these
 * renders the same body (AllExceptionsFilter → ApiErrorResponseDto); only the
 * status and `error.code` differ.
 *
 * Only add a response a given endpoint can genuinely return:
 *  - `validation`  400 VALIDATION_ERROR      — ZodValidationPipe rejected the input
 *  - `auth`        401 AUTHENTICATION_ERROR  — JwtAuthGuard: missing/invalid/expired token
 *  - `notFound`    404 NOT_FOUND             — a NotFoundError from the use case
 *  - `businessRule` 422 BUSINESS_RULE_ERROR  — a BusinessRuleError from the use case
 *  - `provider`    502 PROVIDER_ERROR        — SerpAPI unavailable / quota exhausted
 *
 * 429 (throttler) and 500 (unhandled) are attached by `ApiCommonErrors` to
 * every route, because the global ThrottlerGuard and exception filter apply
 * everywhere.
 */
export type ErrorKind = 'validation' | 'auth' | 'notFound' | 'businessRule' | 'provider';

const BODY = { type: ApiErrorResponseDto } as const;

const byKind: Record<ErrorKind, MethodDecorator> = {
  validation: ApiBadRequestResponse({
    ...BODY,
    description: 'VALIDATION_ERROR — the request failed schema validation.',
  }),
  auth: ApiUnauthorizedResponse({
    ...BODY,
    description: 'AUTHENTICATION_ERROR — missing, invalid or expired bearer token.',
  }),
  notFound: ApiNotFoundResponse({
    ...BODY,
    description: 'NOT_FOUND — the requested resource does not exist.',
  }),
  businessRule: ApiUnprocessableEntityResponse({
    ...BODY,
    description: 'BUSINESS_RULE_ERROR — the request was well-formed but violates a rule.',
  }),
  provider: ApiBadGatewayResponse({
    ...BODY,
    description: 'PROVIDER_ERROR — the upstream product provider failed or is out of quota.',
  }),
};

/**
 * Applies the route-specific failures plus the two that apply to every route
 * (rate limiting and unhandled errors).
 */
export function ApiErrors(...kinds: ErrorKind[]): MethodDecorator {
  return applyDecorators(
    ApiExtraModels(ApiErrorResponseDto),
    ...kinds.map((k) => byKind[k]),
    ApiTooManyRequestsResponse({
      ...BODY,
      description: 'Rate limit exceeded (global ThrottlerGuard).',
    }),
    ApiInternalServerErrorResponse({
      ...BODY,
      description: 'INTERNAL_ERROR — unexpected failure; details are logged, never returned.',
    }),
  );
}
