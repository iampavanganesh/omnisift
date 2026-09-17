import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env.schema';
import { AppConfigService } from './config.service';
import { RuntimeConfigService } from './runtime-config.service';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv })],
  providers: [AppConfigService, RuntimeConfigService],
  exports: [AppConfigService, RuntimeConfigService],
})
export class AppConfigModule {}
