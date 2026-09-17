import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from '../core/config/config.service';

const SWAGGER_DOCUMENT_CONFIG = new DocumentBuilder()
  .setTitle('Omnisift API')
  .setDescription('Product Intelligence Platform — REST API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

/**
 * Builds the OpenAPI document from the live Nest app. This is the single
 * source of truth shared by the in-app /docs UI (setupSwagger, below) and the
 * static export script (scripts/export-openapi.ts) — never duplicate this
 * DocumentBuilder config elsewhere.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  return SwaggerModule.createDocument(app, SWAGGER_DOCUMENT_CONFIG);
}

/** Never mounted in production — it publishes the entire API schema (every route,
 * request/response shape) with no access control of its own. Fine for dev/staging,
 * where the team needs it; a real vulnerability once something is actually deployed. */
export function setupSwagger(app: INestApplication): void {
  const config = app.get(AppConfigService);
  if (config.isProd) return;
  SwaggerModule.setup('docs', app, buildOpenApiDocument(app));
}
