// C:\omnisift_final\apps\backend\src\modules\alerts\application\services\price-alert-checker.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents, ProductPriceObservedPayload } from '../../../../core/events/app-events';
import { ProductExternalIdRepository } from '../../../products/domain/repositories/product-external-id.repository';
import { CreateNotificationUseCase } from '../../../notifications/application/usecases/create-notification.usecase';
import { FcmService } from '../../../notifications/infrastructure/fcm.service';
import { PriceAlert } from '../../domain/entities/price-alert.entity';
import { PriceAlertRepository } from '../../domain/repositories/price-alert.repository';

@Injectable()
export class PriceAlertCheckerService {
  private readonly logger = new Logger(PriceAlertCheckerService.name);
  private readonly COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6h between fires per alert

  constructor(
    private readonly alerts: PriceAlertRepository,
    private readonly externalIds: ProductExternalIdRepository,
    private readonly notifications: CreateNotificationUseCase,
    private readonly fcm: FcmService, // ← NEW
  ) {}

  @OnEvent(AppEvents.ProductPriceObserved)
  async handle(payload: ProductPriceObservedPayload): Promise<void> {
    try {
      const price = payload.price;
      if (!price || price <= 0) return;

      const productId = await this.resolveProductId(payload);
      if (!productId) return;

      const active = await this.alerts.findActiveByProduct(productId);
      if (active.length === 0) return;

      const now = new Date();
      for (const alert of active) {
        await this.evaluate(alert, price, now, payload.source);
      }
    } catch (e) {
      this.logger.warn(`alert check failed: ${String(e)}`);
    }
  }

  private async resolveProductId(p: ProductPriceObservedPayload): Promise<string | null> {
    if (p.internalProductId) return p.internalProductId;
    if (p.externalId && p.provider) return this.externalIds.resolve(p.provider, p.externalId);
    return null;
  }

  private async evaluate(
    alert: PriceAlert,
    price: number,
    now: Date,
    source: 'search' | 'compare',
  ): Promise<void> {
    if (
      alert.lastTriggeredAt &&
      now.getTime() - alert.lastTriggeredAt.getTime() < this.COOLDOWN_MS
    ) {
      return;
    }

    if (alert.type === 'BELOW_TARGET') {
      if (alert.targetPrice == null || price > alert.targetPrice) return;
      if (alert.lastNotifiedPrice != null && price >= alert.lastNotifiedPrice) return;
      await this.fire(alert, price, now, source);
      return;
    }

    // ANY_DROP
    if (alert.lastNotifiedPrice == null) {
      await this.alerts.setBaseline(alert.id, price);
      this.logger.log(
        `🟡 ALERT baseline armed | ${alert.productTitle ?? alert.productId} = ₹${price}`,
      );
      return;
    }
    if (price < alert.lastNotifiedPrice) {
      await this.fire(alert, price, now, source);
    }
  }

  private async fire(
    alert: PriceAlert,
    price: number,
    now: Date,
    source: 'search' | 'compare',
  ): Promise<void> {
    await this.alerts.markTriggered(alert.id, price, now);

    const name = alert.productTitle ?? "A product you're watching";
    const priceStr = `₹${price.toLocaleString('en-IN')}`;
    const title = `${name} dropped!`;
    const body =
      source === 'compare'
        ? `Now ${priceStr} — lowest across stores. Tap to compare.`
        : `Spotted at ${priceStr}. Tap to compare and confirm.`;

    // 1) in-app notification row (bell list)
    try {
      await this.notifications.execute({
        userId: alert.userId,
        type: 'ALERT_TRIGGERED',
        title,
        body,
        data: { productId: alert.productId, price, source, alertType: alert.type },
      });
    } catch (e) {
      this.logger.warn(`notification create failed for alert ${alert.id}: ${String(e)}`);
    }

    // 2) FCM push to the user's devices (all data values must be strings)
    try {
      await this.fcm.pushToUser(alert.userId, title, body, {
        productId: String(alert.productId),
        price: String(price),
        source,
        type: 'ALERT_TRIGGERED',
      });
    } catch (e) {
      this.logger.warn(`fcm push failed for alert ${alert.id}: ${String(e)}`);
    }

    this.logger.log(
      `🎯 ALERT TRIGGERED | ${name} → ${priceStr} (${alert.type}, via ${source}) user=${alert.userId}`,
    );
  }
}
