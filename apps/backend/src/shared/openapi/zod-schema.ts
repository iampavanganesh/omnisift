import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { ZodSchema } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Zod → OpenAPI 3.0 schema, so the request contract is DERIVED from the same
 * schema that actually validates the request and can never drift from it.
 *
 * Cost: this runs at decorator-evaluation time (module load), never on a
 * request. The memo below additionally collapses repeat conversions for
 * schemas shared by several routes (comparisonSchema, catalogDetailSchema,
 * mostSearchedSchema and deviceTokenSchema are each used twice), so every
 * distinct schema object is converted exactly once per process.
 *
 * Two deliberate post-processing rules, both accuracy fixes:
 *
 *  - `additionalProperties: false` is stripped. zod-to-json-schema emits it
 *    for every `z.object()`, but Zod's default object behaviour is *strip*,
 *    not *strict*: unknown keys are silently dropped, never rejected. Leaving
 *    the flag in would document a validation rule the server does not enforce.
 *  - `$schema` is stripped — it is not valid inside an OpenAPI schema object.
 *
 * Constructs Zod can express but JSON Schema cannot (notably `.refine()`
 * cross-field rules) are NOT represented here. Document those with an explicit
 * `description` on the route rather than inventing a schema construct.
 */
const cache = new WeakMap<ZodSchema, SchemaObject>();

export function zodToOpenApi(schema: ZodSchema): SchemaObject {
  const memo = cache.get(schema);
  if (memo) return memo;

  // The cast keeps TypeScript from trying to infer through Zod's deeply
  // recursive generics (TS2589) for an arbitrary `ZodSchema`. It only affects
  // compile-time inference — the value passed is the real schema.
  const raw = zodToJsonSchema(schema as never, {
    target: 'openApi3',
    // Inline everything: an OpenAPI schema object can't carry the local
    // `$defs`/`definitions` block that $refs would point at.
    $refStrategy: 'none',
  });

  const cleaned = prune(raw) as SchemaObject;
  cache.set(schema, cleaned);
  return cleaned;
}

/** Recursively drop keys that would misrepresent the runtime contract. */
function prune(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(prune);
  if (node === null || typeof node !== 'object') return node;

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === '$schema') continue;
    if (key === 'additionalProperties' && value === false) continue;
    out[key] = prune(value);
  }
  return out;
}

/**
 * The top-level properties of a converted object schema, for exploding an
 * object-shaped Zod schema into one OpenAPI query parameter per property.
 */
export function zodObjectProperties(schema: ZodSchema): {
  name: string;
  required: boolean;
  schema: SchemaObject;
}[] {
  const converted = zodToOpenApi(schema);
  const properties = (converted.properties ?? {}) as Record<string, SchemaObject>;
  const required = new Set(converted.required ?? []);
  return Object.entries(properties).map(([name, propSchema]) => ({
    name,
    required: required.has(name),
    schema: propSchema,
  }));
}
