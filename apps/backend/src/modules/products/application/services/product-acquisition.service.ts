import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CatalogRepository } from '../../domain/repositories/catalog.repository';
import { ProviderComparison } from '../../../../shared/interfaces/product-provider.interface';
import { AppEvents, PriceObservedPayload } from '../../../../core/events/app-events';

/**
 * Product Acquisition Service (ARCHITECTURE.md §6): acquiring provider data is a
 * business capability — persist the canonical product + listings + current
 * prices, then announce the price observations. Announcing is decoupled: the
 * price-intelligence module listens for `price.observed` and appends the
 * append-only history. This service does not know its listeners.
 */
@Injectable()
export class ProductAcquisitionService {
  constructor(
    private readonly catalog: CatalogRepository,
    private readonly events: EventEmitter2,
  ) {}

  /** Persist a comparison into the catalog and return the canonical product id. */
  async acquireFromComparison(comparison: ProviderComparison): Promise<string> {
    const observedAt = new Date();
    const { productId, observations } = await this.catalog.persistComparison(comparison);

    if (observations.length > 0) {
      const payload: PriceObservedPayload = { productId, observedAt, observations };
      this.events.emit(AppEvents.PriceObserved, payload);
    }

    return productId;
  }
}
