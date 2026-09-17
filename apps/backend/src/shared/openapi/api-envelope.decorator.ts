import { Type, applyDecorators } from '@nestjs/common';
import { ApiCreatedResponse, ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

/**
 * Every successful response goes out through the ApiResponse envelope
 * (shared/dto/api-response.dto.ts): `{ success: true, data: T, meta? }`.
 *
 * These helpers document that envelope honestly — `data` as a real $ref (or an
 * array of one), and `meta` as the specific shape that route actually builds —
 * instead of flattening the payload or leaving it undefined. They only affect
 * the OpenAPI document; no runtime value changes.
 */

export interface EnvelopeOptions {
  /** `data` is an array of `type`. */
  isArray?: boolean;
  /** The exact meta object this route returns, when it returns one. */
  meta?: Type<unknown>;
  description?: string;
}

/** `data` payloads that aren't a DTO class (primitives, arrays of primitives). */
export interface RawEnvelopeOptions {
  data: SchemaObject;
  meta?: Type<unknown>;
  description?: string;
}

function envelopeSchema(data: SchemaObject | ReferenceObject, meta?: Type<unknown>): SchemaObject {
  const properties: Record<string, SchemaObject | ReferenceObject> = {
    success: { type: 'boolean', example: true },
    data,
  };
  if (meta) properties.meta = { $ref: getSchemaPath(meta) };
  return { type: 'object', properties, required: ['success', 'data'] };
}

function dataSchema(type: Type<unknown>, isArray?: boolean): SchemaObject | ReferenceObject {
  const ref: ReferenceObject = { $ref: getSchemaPath(type) };
  return isArray ? { type: 'array', items: ref } : ref;
}

/** 200 with the standard envelope wrapping `type`. */
export function ApiEnvelopeOk(type: Type<unknown>, options: EnvelopeOptions = {}) {
  const extra = options.meta ? [type, options.meta] : [type];
  return applyDecorators(
    ApiExtraModels(...extra),
    ApiOkResponse({
      description: options.description,
      schema: envelopeSchema(dataSchema(type, options.isArray), options.meta),
    }),
  );
}

/** 201 with the standard envelope wrapping `type`. */
export function ApiEnvelopeCreated(type: Type<unknown>, options: EnvelopeOptions = {}) {
  const extra = options.meta ? [type, options.meta] : [type];
  return applyDecorators(
    ApiExtraModels(...extra),
    ApiCreatedResponse({
      description: options.description,
      schema: envelopeSchema(dataSchema(type, options.isArray), options.meta),
    }),
  );
}

/** 200 with the standard envelope wrapping a non-class payload. */
export function ApiEnvelopeOkRaw(options: RawEnvelopeOptions) {
  return applyDecorators(
    ...(options.meta ? [ApiExtraModels(options.meta)] : []),
    ApiOkResponse({
      description: options.description,
      schema: envelopeSchema(options.data, options.meta),
    }),
  );
}
