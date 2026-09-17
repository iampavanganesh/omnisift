import { Injectable } from '@nestjs/common';
import {
  ProductProvider,
  ProviderComparison,
  ProviderProduct,
} from '../../../shared/interfaces/product-provider.interface';
import { ImageStorageService } from '../../storage/image-storage.service';
import { SerpApiClient } from './serpapi.client';
import { mapShoppingResults } from './serpapi.mapper';
import { mapImmersiveProduct } from './immersive.mapper';
import { PrismaService } from '../../../core/database/prisma.service';
import { getRequestContext } from '../../../core/context/request-context';

/** SerpAPI implementation of the ProductProvider port. */
@Injectable()
export class SerpApiProvider extends ProductProvider {
  readonly slug = 'serpapi';

  constructor(
    private readonly client: SerpApiClient,
    private readonly images: ImageStorageService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  /** Pull { status, reason } that SerpApiClient stashed on ProviderError.detail. */
  private errInfo(e: unknown): { httpStatus?: number; errorReason?: string } {
    const detail = (e as { detail?: { status?: number; reason?: string } })?.detail;
    return { httpStatus: detail?.status, errorReason: detail?.reason };
  }

  /** Fire-and-forget usage logger — never blocks or breaks the request. */
  private logUsage(row: {
    endpoint: string;
    feature: string;
    query?: string;
    success: boolean;
    durationMs: number;
    resultCount?: number;
    page?: number;
    errorReason?: string;
    httpStatus?: number;
  }): void {
    // Pull the visit tag + (if logged in) user from the per-request context,
    // the same store analytics uses. Guest-friendly: both may be null.
    const ctx = getRequestContext();
    this.prisma.apiUsageLog
      .create({
        data: {
          provider: 'serpapi',
          endpoint: row.endpoint,
          feature: row.feature,
          query: row.query,
          success: row.success,
          durationMs: row.durationMs,
          cacheHit: false,
          resultCount: row.resultCount,
          page: row.page,
          errorReason: row.errorReason,
          httpStatus: row.httpStatus,
          sessionId: ctx.sessionId ?? null,
          userId: ctx.userId ?? null,
        },
      })
      .catch(() => {});
  }

  async search(query: string, page = 0): Promise<ProviderProduct[]> {
    const start = Date.now();
    try {
      const data = await this.client.googleShopping(query, page);
      const rawResults = (data.shopping_results as unknown[]) ?? [];
      // --- DEBUG: show raw count + first 5 product IDs per page (temporary) ---
      const rawIds = rawResults
        .slice(0, 5)
        .map((r) => (r as Record<string, unknown>).product_id || '?');

      console.log(
        `\n📄 [PAGE DEBUG] query="${query}" page=${page} | raw count=${rawResults.length} | first 5 IDs: ${JSON.stringify(rawIds)}\n`,
      );
      const products = mapShoppingResults(rawResults, query);
      // Permanent Supabase URLs computed INSTANTLY; the actual uploads run in the
      // background (see storeManyLazy). Search no longer blocks on image I/O, so
      // the first-search cold-bucket stall (~15s) is gone. The URL saved into the
      // search_cache row is already the permanent one, so cache hits are correct.
      const stored = this.images.storeManyLazy(products.map((p) => p.imageUrl));
      this.logUsage({
        endpoint: 'googleShopping',
        feature: 'search',
        query,
        success: true,
        durationMs: Date.now() - start,
        resultCount: products.length,
        page,
      });
      return products.map((p, i) => ({ ...p, imageUrl: stored[i] }));
    } catch (e) {
      this.logUsage({
        endpoint: 'googleShopping',
        feature: 'search',
        query,
        success: false,
        durationMs: Date.now() - start,
        page,
        ...this.errInfo(e),
      });
      throw e;
    }
  }

  async getComparison(token: string): Promise<ProviderComparison | null> {
    const start = Date.now();
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const data = await this.client.immersiveProduct(token);
        const comparison = mapImmersiveProduct(data);
        if (!comparison) {
          // Empty-but-successful response: SerpAPI still charged a credit but the
          // result mapped to nothing usable. Log it so the wasted credit is countable.
          this.logUsage({
            endpoint: 'immersiveProduct',
            feature: 'compare',
            query: token,
            success: true,
            durationMs: Date.now() - start,
            resultCount: 0,
          });
          return null;
        }
        comparison.images = await this.images.storeMany(comparison.images);
        this.logUsage({
          endpoint: 'immersiveProduct',
          feature: 'compare',
          query: comparison.title,
          success: true,
          durationMs: Date.now() - start,
          resultCount: comparison.sellers.length,
        });
        return comparison;
      } catch (e) {
        if (attempt === 2) {
          this.logUsage({
            endpoint: 'immersiveProduct',
            feature: 'compare',
            query: token,
            success: false,
            durationMs: Date.now() - start,
            ...this.errInfo(e),
          });
          throw e;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
    return null;
  }
}
