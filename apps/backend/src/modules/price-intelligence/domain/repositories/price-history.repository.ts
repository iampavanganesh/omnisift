import { PriceObservation } from '../../../../core/events/app-events';

/**
 * Append-only price history log (ARCHITECTURE.md §7 — "the moat"). Rows are only
 * ever inserted, never updated or overwritten. Domain port; infra provides impl.
 */
export abstract class PriceHistoryRepository {
  /** Insert one history row per observation. */
  abstract recordMany(observations: PriceObservation[], observedAt: Date): Promise<void>;
}
