import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { AppConfigService } from '../core/config/config.service';

/** Cross-cutting app configuration applied before listen(). Framework wiring only. */
export function configureApp(app: INestApplication): void {
  const config = app.get(AppConfigService);
  app.use(helmet());

  const corsOrigins = config.corsOrigins;
  // No cookies exist in this API (auth is bearer-token only), so `credentials: true`
  // combined with a reflected wildcard origin isn't exploitable today — but it's a
  // landmine for whoever adds a cookie-based flow later without revisiting this. The
  // realistic failure mode is simpler: CORS_ORIGINS defaults to '*' and nobody sets it
  // before deploying. Fail fast instead of silently shipping a wide-open API.
  if (config.isProd && corsOrigins.includes('*')) {
    throw new Error(
      'CORS_ORIGINS is unset (defaults to "*") in production. Set it to the real ' +
        'web/app origins before deploying — refusing to boot with an open CORS policy.',
    );
  }
  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  app.enableShutdownHooks();
}
