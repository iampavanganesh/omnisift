import { ApiProperty } from '@nestjs/swagger';

/**
 * Documentation-only DTOs for the small ad-hoc payloads a few controllers
 * return as object literals. Declaring them here lets those routes document a
 * real schema without changing what the controller returns.
 */

/** `ApiResponse.ok({ ok: true })` — used by logout, forgot-password, alert
 *  delete, device-token register/unregister, and wishlist remove/clear. */
export class OkResultDto {
  @ApiProperty({ example: true })
  ok!: boolean;
}

/** `ApiResponse.ok({ marked: count })` — PATCH /notifications/read-all. */
export class MarkedResultDto {
  @ApiProperty({ description: 'How many notifications were marked as read by this call.' })
  marked!: number;
}

// --- meta shapes -----------------------------------------------------------
// Each of these is a real, repeated `meta` object built by a controller. They
// are documented separately rather than as a free-form map so consumers can
// rely on the fields that are actually present per route.

/** `{ count }` — list endpoints that return everything they have. */
export class CountMetaDto {
  @ApiProperty({ description: 'Number of items in `data`.' })
  count!: number;
}

/** `{ count, max }` — GET /wishlist (max = the configured per-user cap). */
export class WishlistMetaDto {
  @ApiProperty() count!: number;

  @ApiProperty({
    description:
      'Maximum items a user may save, from the app_config.wishlist_max_items runtime dial.',
  })
  max!: number;
}

/** `{ page, hasMore }` — GET /affiliate/clicks. */
export class PageMetaDto {
  @ApiProperty({ description: 'Zero-based page index that was served.' })
  page!: number;

  @ApiProperty({ description: 'True when a further page exists.' })
  hasMore!: boolean;
}

/** `{ query, page, count, hasMore }` — GET /search. */
export class SearchMetaDto {
  @ApiProperty({ description: 'The query string that was searched.' })
  query!: string;

  @ApiProperty({ description: 'Zero-based page index that was served.' })
  page!: number;

  @ApiProperty({ description: 'Number of products in `data` after any maxPrice filter.' })
  count!: number;

  @ApiProperty({
    description:
      'True only when another page may be requested: the page ceiling has not been reached AND this page returned results. Pagination is finite — see the `page` parameter.',
  })
  hasMore!: boolean;
}

/** `{ sellerCount }` — the token-based compare routes. */
export class SellerCountMetaDto {
  @ApiProperty({ description: 'Number of sellers in the comparison.' })
  sellerCount!: number;
}

/** `{ capturedAt, fresh, refreshed }` — GET /products/compare-by-product. */
export class CompareByProductMetaDto {
  @ApiProperty({
    type: String,
    format: 'date-time',
    description: 'When this comparison data was fetched from the provider.',
  })
  capturedAt!: Date;

  @ApiProperty({ description: 'True when served from cache inside the compare freshness window.' })
  fresh!: boolean;

  @ApiProperty({ description: 'True when this call re-fetched from the provider.' })
  refreshed!: boolean;
}

/** `{ unreadCount }` — GET /notifications. */
export class NotificationMetaDto {
  @ApiProperty({ description: 'Total unread notifications for the user, regardless of filter.' })
  unreadCount!: number;
}

/** `{ sellerCount, days }` — GET /products/price-graph. */
export class PriceGraphMetaDto {
  @ApiProperty({ description: 'Number of seller series returned.' })
  sellerCount!: number;

  @ApiProperty({ description: 'The range actually applied, after clamping.' })
  days!: number;
}
