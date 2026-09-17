/**
 * Validates packages/api-contracts/openapi.yaml against the running application.
 *
 * Catches the failure modes that make a generated contract untrustworthy:
 *   1. STALE      — the committed YAML differs from what the code produces now.
 *   2. MISSING    — a route the app serves is absent from the document.
 *   3. FABRICATED — a documented route the app does not actually serve.
 *   4. BROKEN REF — a $ref or security scheme that resolves to nothing.
 *   5. NON-DETERMINISTIC — two generations of the same code differ.
 *
 * Run: npm run openapi:validate   (after npm run export:openapi)
 */
import { NestFactory } from '@nestjs/core';
import { INestApplication } from '@nestjs/common';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/app';
import { buildOpenApiDocument } from '../src/bootstrap/swagger';

type Doc = {
  paths: Record<string, Record<string, unknown>>;
  components?: { schemas?: Record<string, unknown>; securitySchemes?: Record<string, unknown> };
};

const failures: string[] = [];
const fail = (msg: string) => failures.push(msg);

/** Every route the Express router actually serves, as "METHOD /path". */
function liveRoutes(app: INestApplication): Set<string> {
  const server = app.getHttpAdapter().getInstance() as {
    router?: { stack?: unknown[] };
    _router?: { stack?: unknown[] };
  };
  const stack = (server.router?.stack ?? server._router?.stack ?? []) as {
    route?: { path?: string; methods?: Record<string, boolean> };
  }[];

  const out = new Set<string>();
  for (const layer of stack) {
    const route = layer.route;
    if (!route?.path) continue;
    // Skip middleware layers, which are not endpoints. The global
    // SessionMiddleware is mounted with forRoutes('*') and surfaces as a
    // wildcard path enabled for the ENTIRE verb table (PROPFIND, UNSUBSCRIBE,
    // …) — two signals no real controller route ever produces.
    if (route.path.includes('*') || route.path.includes('$')) continue;
    const enabledMethods = Object.entries(route.methods ?? {})
      .filter(([method, enabled]) => enabled && method !== 'head')
      .map(([method]) => method);
    if (enabledMethods.length > 4) continue;

    for (const method of enabledMethods) out.add(`${method.toUpperCase()} ${route.path}`);
  }
  return out;
}

/** Document routes as "METHOD /path", with OpenAPI {param} → Express :param. */
function documentedRoutes(doc: Doc): Set<string> {
  const out = new Set<string>();
  for (const [p, item] of Object.entries(doc.paths)) {
    const expressPath = p.replace(/\{([^}]+)\}/g, ':$1');
    for (const method of Object.keys(item)) out.add(`${method.toUpperCase()} ${expressPath}`);
  }
  return out;
}

function checkRefs(doc: Doc): void {
  const schemas = new Set(Object.keys(doc.components?.schemas ?? {}));
  const schemes = new Set(Object.keys(doc.components?.securitySchemes ?? {}));

  const walk = (node: unknown, where: string): void => {
    if (Array.isArray(node)) return node.forEach((n, i) => walk(n, `${where}[${i}]`));
    if (node === null || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === '$ref' && typeof value === 'string') {
        const name = value.replace('#/components/schemas/', '');
        if (!value.startsWith('#/components/schemas/') || !schemas.has(name)) {
          fail(`Unresolved $ref "${value}" at ${where}`);
        }
      } else if (key === 'security' && Array.isArray(value)) {
        for (const entry of value as Record<string, unknown>[]) {
          for (const scheme of Object.keys(entry ?? {})) {
            if (!schemes.has(scheme)) fail(`Unknown security scheme "${scheme}" at ${where}`);
          }
        }
      } else {
        walk(value, `${where}.${key}`);
      }
    }
  };
  walk(doc.paths, 'paths');
}

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  configureApp(app);
  await app.init();

  const first = buildOpenApiDocument(app) as unknown as Doc;
  const second = buildOpenApiDocument(app) as unknown as Doc;

  // 5. determinism
  if (JSON.stringify(first) !== JSON.stringify(second)) {
    fail('Generation is NOT deterministic — two runs against the same code differ.');
  }

  // 1. staleness
  const outPath = path.resolve(process.cwd(), '../../packages/api-contracts/openapi.yaml');
  const committedRaw = fs.readFileSync(outPath, 'utf8');
  const committed = yaml.load(committedRaw) as Doc;
  if (JSON.stringify(committed) !== JSON.stringify(first)) {
    fail('openapi.yaml is STALE — re-run `npm run export:openapi` and commit the result.');
  }

  // 2 + 3. route parity. Excluded endpoints (@ApiExcludeEndpoint) are expected
  // to be live-but-undocumented, so they are listed here explicitly rather than
  // silently tolerated.
  const intentionallyUndocumented = new Set(['GET /api/v1/products/comparison']);
  const live = liveRoutes(app);
  const documented = documentedRoutes(committed);

  if (live.size === 0) fail('Could not read any live route from the adapter — check is not working.');

  for (const route of live) {
    if (!documented.has(route) && !intentionallyUndocumented.has(route)) {
      fail(`MISSING from openapi.yaml: ${route}`);
    }
  }
  for (const route of documented) {
    if (!live.has(route)) fail(`FABRICATED — documented but not served: ${route}`);
  }
  for (const route of intentionallyUndocumented) {
    if (!live.has(route)) {
      fail(`Stale exclusion: "${route}" is listed as intentionally undocumented but no longer exists.`);
    }
  }

  // 4. refs
  checkRefs(committed);

  await app.close();

  const opCount = Object.values(committed.paths).reduce((n, i) => n + Object.keys(i).length, 0);
  if (failures.length > 0) {
    console.error(`\nOpenAPI contract validation FAILED (${failures.length}):`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(
    `OpenAPI contract OK — ${Object.keys(committed.paths).length} paths / ${opCount} operations, ` +
      `${Object.keys(committed.components?.schemas ?? {}).length} schemas, ` +
      `${live.size} live routes matched, deterministic, no broken refs.`,
  );
}

main().catch((e) => {
  console.error('OpenAPI validation crashed:', e);
  process.exit(1);
});
