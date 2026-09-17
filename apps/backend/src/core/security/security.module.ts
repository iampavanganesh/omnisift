import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (c: AppConfigService) => [{ ttl: c.rateLimitTtl * 1000, limit: c.rateLimitMax }],
    }),
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // global rate limiting
    JwtAuthGuard, // opt-in per route via @UseGuards(JwtAuthGuard)
  ],
  exports: [JwtAuthGuard],
})
export class SecurityModule {}
