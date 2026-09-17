import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap/app';
import { setupSwagger } from './bootstrap/swagger';
import { AppConfigService } from './core/config/config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Use Pino as the app logger (structured logs + correlation id).
  app.useLogger(app.get(Logger));

  configureApp(app);
  setupSwagger(app);

  const config = app.get(AppConfigService);
  await app.listen(config.port);
  app.get(Logger).log(`Omnisift API listening on :${config.port}`, 'Bootstrap');
}

void bootstrap();
