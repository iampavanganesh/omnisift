// C:\omnisift_final\apps\backend\src\modules\alerts\application\services\price-alert-refresher.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GetComparisonByProductUseCase } from '../../../compare/application/usecases/get-comparison-by-product.usecase';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { PriceAlertRepository } from '../../domain/repositories/price-alert.repository';

/**
 * Proactive refresh for products with an active price alert. Alerts are
 * otherwise purely reactive (only evaluated as a side effect of some user's
 * live search/compare touching that exact product) — an alert can silently
 * never fire if nobody happens to revisit the product. This job closes that
 * gap for the one confirmed in-scope trigger: active price alerts.
 *
 * Wishlist saves are deliberately NOT a refresh trigger (product-owner
 * decision — a save doesn't imply consent to ongoing background marketplace
 * queries). See streamed-percolating-sedgewick.md P0.2.
 *
 * Reuses GetComparisonByProductUseCase as-is: it already no-ops (0 API) for
 * anything still within the compare-cache freshness window, so this job only
 * pays real provider cost for candidates that are genuinely stale — and a
 * successful refresh re-emits the same PriceSnapshotRecorded/
 * ProductPriceObserved events the live compare flow does, driving the
 * existing PriceAlertCheckerService without any duplicated fetch/evaluate
 * logic.
 */
@Injectable()
export class PriceAlertRefresherService {
  private readonly logger = new Logger(PriceAlertRefresherService.name);
  private running = false;

  constructor(
    private readonly alerts: PriceAlertRepository,
    private readonly getComparisonByProduct: GetComparisonByProductUseCase,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    if (this.running) {
      this.logger.warn('skip run — previous refresh still in progress');
      return;
    }
    this.running = true;
    try {
      await this.refresh();
    } finally {
      this.running = false;
    }
  }

  private async refresh(): Promise<void> {
    const productIds = await this.alerts.findDistinctActiveProductIds();
    if (productIds.length === 0) return;

    const cap = await this.runtimeConfig.getAlertRefreshBatchCap();
    let refreshedCount = 0;
    let examinedCount = 0;

    for (const productId of productIds) {
      if (refreshedCount >= cap) break;
      examinedCount++;
      try {
        const result = await this.getComparisonByProduct.execute(productId);
        if (result.refreshed) refreshedCount++;
      } catch (e) {
        // Isolate failures per-product — one bad product must never stop the batch.
        this.logger.warn(`refresh failed for product ${productId}: ${String(e)}`);
      }
    }

    this.logger.log(
      `alert refresh run: ${productIds.length} candidate(s), examined ${examinedCount}, refreshed ${refreshedCount} (cap ${cap})`,
    );
  }
}
