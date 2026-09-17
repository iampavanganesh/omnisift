import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AppEvents, PriceSnapshotEventPayload } from '../../../../core/events/app-events';
import { PriceSnapshotRepository } from '../../domain/repositories/price-snapshot.repository';

/** Records a daily price snapshot on `price.snapshot.recorded`. Never rethrows. */
@Injectable()
export class PriceSnapshotListener {
  private readonly logger = new Logger(PriceSnapshotListener.name);
  constructor(private readonly repo: PriceSnapshotRepository) {}

  @OnEvent(AppEvents.PriceSnapshotRecorded, { async: true })
  async handle(p: PriceSnapshotEventPayload): Promise<void> {
    try {
      await this.repo.recordDaily(p.productId, p.lowest, p.highest, p.average);
    } catch (err) {
      this.logger.error(
        `Failed to record price snapshot for ${p.productId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
