import { Global, Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

/**
 * Global analytics module — same pattern as PrismaModule.
 * Exported globally so any module can inject AnalyticsService with no imports.
 */
@Global()
@Module({ providers: [AnalyticsService], exports: [AnalyticsService] })
export class AnalyticsModule {}
