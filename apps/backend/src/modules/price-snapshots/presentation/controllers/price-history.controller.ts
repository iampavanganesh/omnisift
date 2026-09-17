import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from '../../../../shared/dto/api-response.dto';
import { CountMetaDto, PriceGraphMetaDto } from '../../../../shared/dto/common-response.dto';
import { ApiEnvelopeOk } from '../../../../shared/openapi/api-envelope.decorator';
import { ApiErrors } from '../../../../shared/openapi/api-errors.decorator';
import { PriceGraphResponseDto } from '../../application/dto/price-graph-response.dto';
import {
  PriceSnapshotRepository,
  SellerGraphPoint,
} from '../../domain/repositories/price-snapshot.repository';
import { PricePointDto } from '../../application/dto/price-history-response.dto';

@ApiTags('products')
@Controller('products')
export class PriceHistoryController {
  constructor(private readonly repo: PriceSnapshotRepository) {}

  @Get('history')
  @ApiOperation({
    summary: 'Daily price snapshots for a product',
    description:
      'Public (guest). Real recorded snapshots only — returns an empty list when none exist yet (and when productId is omitted). Never interpolated.',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    schema: { type: 'string' },
    description:
      'Internal product UUID. Not schema-validated; omitting it returns an empty list rather than an error.',
  })
  @ApiEnvelopeOk(PricePointDto, { isArray: true, meta: CountMetaDto })
  @ApiErrors()
  async history(@Query('productId') productId: string) {
    const rows = productId ? await this.repo.history(productId) : [];
    return ApiResponse.ok(rows.map(PricePointDto.from), { count: rows.length });
  }

  /**
   * Per-platform price graph. Returns one series per seller for the given range.
   * GET /products/price-graph?productId=<uuid>&days=90
   */
  @Get('price-graph')
  @ApiOperation({
    summary: 'Per-seller price history series',
    description:
      'Public (guest). One series per seller with recorded history. Empty when productId is omitted or nothing is recorded yet.',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    schema: { type: 'string' },
    description:
      'Internal product UUID. Not schema-validated; omitting it returns an empty series list.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    schema: { type: 'string' },
    description:
      'Range in days. NOT validated: any value outside 30 | 90 | 180 | 365 | 1095 is silently clamped to 90 rather than rejected. meta.days reports what was actually applied.',
  })
  @ApiEnvelopeOk(PriceGraphResponseDto, { meta: PriceGraphMetaDto })
  @ApiErrors()
  async priceGraph(@Query('productId') productId: string, @Query('days') days?: string) {
    const sinceDays = this.clampDays(days);
    const points: SellerGraphPoint[] = productId
      ? await this.repo.sellerGraph(productId, sinceDays)
      : [];

    // Group flat points into one series per seller (what the chart draws).
    const bySeller = new Map<
      string,
      {
        sellerId: string;
        sellerName: string;
        points: {
          price: number;
          mrp: number | null;
          discountPct: number | null;
          capturedAt: Date;
        }[];
      }
    >();
    for (const p of points) {
      let s = bySeller.get(p.sellerId);
      if (!s) {
        s = { sellerId: p.sellerId, sellerName: p.sellerName, points: [] };
        bySeller.set(p.sellerId, s);
      }
      s.points.push({
        price: p.price,
        mrp: p.mrp,
        discountPct: p.discountPct,
        capturedAt: p.capturedAt,
      });
    }

    return ApiResponse.ok(
      { series: Array.from(bySeller.values()) },
      { sellerCount: bySeller.size, days: sinceDays },
    );
  }

  /** Accept only the ranges the app offers; default 90 days. */
  private clampDays(raw?: string): number {
    const allowed = [30, 90, 180, 365, 1095];
    const n = Number(raw);
    return allowed.includes(n) ? n : 90;
  }
}
