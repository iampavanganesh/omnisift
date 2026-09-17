import { ApiProperty } from '@nestjs/swagger';

/**
 * Documentation-only mirror of what GET /config returns.
 *
 * ⚠️ This endpoint is the ONE exception to the `{ success, data, meta }`
 * envelope every other route uses — it returns these fields at the top level.
 * That is documented here as-is, deliberately: changing the response shape
 * would be an API behaviour change, which this contract pass does not do.
 * See OPENAPI_CONTRACT_REPORT.md for the consumer mismatch this causes.
 */
export class RuntimeConfigResponseDto {
  @ApiProperty({
    description:
      'Provider calls a single search query may spend, from app_config.max_api_calls. The client uses it to bound auto-scroll.',
  })
  maxApiCalls!: number;

  @ApiProperty({
    description:
      'Whether the price-history graph is enabled, from app_config.price_graph_enabled. Off until enough cross-seller history exists.',
  })
  priceGraphEnabled!: boolean;
}
