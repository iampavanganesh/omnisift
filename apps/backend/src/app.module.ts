import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppConfigModule } from './core/config/config.module';
import { LoggerModule } from './core/logger/logger.module';
import { PrismaModule } from './core/database/prisma.module';
import { AnalyticsModule } from './core/analytics/analytics.module';
import { SecurityModule } from './core/security/security.module';
import { EventsModule } from './core/events/events.module';
import { ErrorsModule } from './core/errors/errors.module';
import { SupabaseModule } from './core/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { SearchModule } from './modules/search/search.module';
import { ProductsModule } from './modules/products/products.module';
import { CompareModule } from './modules/compare/compare.module';
import { PriceIntelligenceModule } from './modules/price-intelligence/price-intelligence.module';
import { StorageModule } from './integrations/storage/storage.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UsersModule } from './modules/users/users.module';
import { PriceSnapshotsModule } from './modules/price-snapshots/price-snapshots.module';
import { ConfigModule } from './modules/config/config.module';
import { DealsModule } from './modules/deals/deals.module';
import { AffiliateModule } from './modules/affiliate/affiliate.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { SessionMiddleware } from './core/context/session.middleware';

/**
 * Root module. Core modules below are the foundation.
 * Feature modules (auth, search, products, ...) are added one slice at a time.
 */
@Module({
  imports: [
    AppConfigModule,
    ScheduleModule.forRoot(),
    LoggerModule,
    PrismaModule,
    AnalyticsModule,
    SecurityModule,
    EventsModule,
    ErrorsModule,
    SupabaseModule,
    // --- feature modules (added slice by slice) ---
    AuthModule,
    SearchModule,
    ProductsModule,
    CompareModule,
    PriceIntelligenceModule,
    StorageModule,
    WishlistModule,
    AlertsModule,
    NotificationsModule,
    PriceSnapshotsModule,
    UsersModule,
    ConfigModule,
    DealsModule,
    AffiliateModule,
    DiscoveryModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Populate per-request context (sessionId + optional userId) for ALL routes,
    // so analytics can tag every event with the visit and (if logged in) the user.
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}
