// C:\omnisift_final\apps\backend\src\modules\alerts\alerts.module.ts
import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompareModule } from '../compare/compare.module';
import { PriceAlertController } from './presentation/controllers/price-alert.controller';
import { CreatePriceAlertUseCase } from './application/usecases/create-price-alert.usecase';
import { GetPriceAlertsUseCase } from './application/usecases/get-price-alerts.usecase';
import { DeletePriceAlertUseCase } from './application/usecases/delete-price-alert.usecase';
import { TogglePriceAlertUseCase } from './application/usecases/toggle-price-alert.usecase';
import { PriceAlertCheckerService } from './application/services/price-alert-checker.service';
import { PriceAlertRefresherService } from './application/services/price-alert-refresher.service';
import { PriceAlertRepository } from './domain/repositories/price-alert.repository';
import { PrismaPriceAlertRepository } from './infrastructure/repositories/prisma-price-alert.repository';

@Module({
  imports: [ProductsModule, NotificationsModule, CompareModule], // ← CompareModule: refresh cron
  controllers: [PriceAlertController],
  providers: [
    CreatePriceAlertUseCase,
    GetPriceAlertsUseCase,
    DeletePriceAlertUseCase,
    TogglePriceAlertUseCase,
    PriceAlertCheckerService,
    PriceAlertRefresherService,
    { provide: PriceAlertRepository, useClass: PrismaPriceAlertRepository },
  ],
})
export class AlertsModule {}
