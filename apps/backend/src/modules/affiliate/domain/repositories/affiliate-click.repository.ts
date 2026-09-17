import { AffiliateClick } from '../entities/affiliate-click.entity';

export interface RecordClickInput {
  productId: string;
  platform: string;
}

export interface AffiliateClickHistoryPage {
  items: AffiliateClick[];
  hasMore: boolean;
}

/** Records + lists a user's outbound clicks to a seller's site (no order/checkout system exists — this is the closest real "purchase intent" signal). */
export abstract class AffiliateClickRepository {
  abstract record(userId: string, input: RecordClickInput): Promise<AffiliateClick>;
  abstract history(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<AffiliateClickHistoryPage>;
}
