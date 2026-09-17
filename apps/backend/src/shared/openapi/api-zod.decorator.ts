import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { ZodSchema } from 'zod';
import { zodObjectProperties, zodToOpenApi } from './zod-schema';

/**
 * Documents a request body from the Zod schema that actually validates it.
 * `description` is the place for rules Zod enforces but JSON Schema cannot
 * express (e.g. `.refine()` cross-field constraints).
 */
export function ApiZodBody(schema: ZodSchema, description?: string): MethodDecorator {
  return applyDecorators(ApiBody({ schema: zodToOpenApi(schema), description, required: true }));
}

/**
 * Documents an object-shaped Zod query schema as one OpenAPI query parameter
 * per property — which is how the values actually arrive on the wire, and what
 * `@Query(new ZodValidationPipe(...))` parses them out of.
 *
 * Descriptions are opt-in per property via `descriptions`, keyed by property
 * name; nothing is invented for properties left out.
 */
export function ApiZodQuery(
  schema: ZodSchema,
  descriptions: Record<string, string> = {},
): MethodDecorator {
  return applyDecorators(
    ...zodObjectProperties(schema).map((p) =>
      ApiQuery({
        name: p.name,
        required: p.required,
        schema: p.schema,
        description: descriptions[p.name],
      }),
    ),
  );
}
