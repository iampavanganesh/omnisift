import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents, PriceObservedPayload } from '../../../../core/events/app-events';
import { PriceHistoryRepository } from '../../domain/repositories/price-history.repository';

/**
 * Listens for `price.observed` (emitted by the Product Acquisition Service) and
 * appends the observations to the price_history log. Decoupled from the emitter
 * via the event bus (ARCHITECTURE.md §6). Failures are logged, never rethrown —
 * a history-write hiccup must not fail the originating request.
 */
@Injectable()
export class PriceObservedListener {
  private readonly logger = new Logger(PriceObservedListener.name);

  constructor(private readonly history: PriceHistoryRepository) {}

  @OnEvent(AppEvents.PriceObserved, { async: true })
  async handle(payload: PriceObservedPayload): Promise<void> {
    try {
      await this.history.recordMany(payload.observations, payload.observedAt);
    } catch (err) {
      this.logger.error(
        `Failed to append price_history for product ${payload.productId} ` +
          `(${payload.observations.length} observations)`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
