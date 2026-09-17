import { Controller, Get, Param, Redirect } from '@nestjs/common';
import { ApiFoundResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { NotFoundError } from '../../../../core/errors/app-error';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { ListingLookupRepository } from '../../domain/repositories/listing-lookup.repository';

/**
 * Public (no auth) outbound redirect for apps/web's product pages, where
 * visitors aren't signed in. Never link a raw seller URL directly from a
 * public page — this resolves (product, seller) -> the real URL server-side,
 * so OmniSift can't become an open redirect (see the security plan in
 * ARCHITECTURE.md). The authenticated app's own click tracking
 * (POST /affiliate/clicks) is separate and unaffected by this.
 */
@ApiTags('affiliate')
@Controller('affiliate/go')
export class AffiliateRedirectController {
  constructor(
    private readonly listings: ListingLookupRepository,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('product/:productId/seller/:sellerId')
  @Redirect()
  @ApiOperation({
    summary: 'Redirect to a seller listing, resolved server-side',
    description:
      'Public (guest) — used by the public web product pages. SECURITY: takes PATH PARAMETERS ONLY and never accepts a destination URL. The destination is looked up from the stored ProductListing for this exact (product, seller) pair; if that pair has no listing the request 404s. There is deliberately no endpoint anywhere that will redirect to a caller-supplied address. Note: ids that are well-formed UUIDs but unknown return 404, while a MALFORMED id currently surfaces as 500 (the database driver rejects it before the lookup returns) — neither case ever emits a Location header.',
  })
  @ApiParam({ name: 'productId', description: 'Internal product UUID.' })
  @ApiParam({ name: 'sellerId', description: 'Internal seller UUID.' })
  @ApiFoundResponse({
    description:
      '302 to the resolved seller listing URL, in the Location header. No response body.',
  })
  @ApiErrors('notFound')
  async go(
    @Param('productId') productId: string,
    @Param('sellerId') sellerId: string,
  ): Promise<{ url: string; statusCode: number }> {
    const url = await this.listings.findUrl(productId, sellerId);
    if (!url) throw new NotFoundError('Listing not found.');
    this.analytics.track('affiliate_redirect', { productId, sellerId });
    return { url, statusCode: 302 };
  }

  /** Same redirect, keyed by seller platform name (e.g. "Amazon") instead of
   * an internal sellerId — for Flutter's compare screens, whose comparison
   * response only ever carries the provider-shaped `platform` string, never
   * a real seller UUID. Only usable when `productId` is a real catalogued
   * product; pre-catalog results have no listing to resolve here at all. */
  @Get('product/:productId/platform/:platform')
  @Redirect()
  @ApiOperation({
    summary: 'Redirect to a seller listing, keyed by platform name',
    description:
      'Public (guest) — used by the Flutter compare screens, whose comparison payload carries the provider `platform` string rather than an internal seller UUID. Same security model as the sellerId variant: path parameters only, destination resolved from the stored listing, 404 when the platform does not resolve to a real seller with a listing for this product. Only works for catalogued products. Note: a malformed productId surfaces as 500 rather than 404 (see the sellerId variant); no Location header is emitted either way.',
  })
  @ApiParam({ name: 'productId', description: 'Internal product UUID.' })
  @ApiParam({
    name: 'platform',
    description: 'Seller platform name, e.g. "Amazon". URL-encode it.',
  })
  @ApiFoundResponse({
    description:
      '302 to the resolved seller listing URL, in the Location header. No response body.',
  })
  @ApiErrors('notFound')
  async goByPlatform(
    @Param('productId') productId: string,
    @Param('platform') platform: string,
  ): Promise<{ url: string; statusCode: number }> {
    const url = await this.listings.findUrlByPlatform(productId, platform);
    if (!url) throw new NotFoundError('Listing not found.');
    this.analytics.track('affiliate_redirect', { productId, platform });
    return { url, statusCode: 302 };
  }
}
