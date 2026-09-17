import { Injectable, Logger } from '@nestjs/common';
import {
  ProductProvider,
  ProviderProduct,
} from '../../../../shared/interfaces/product-provider.interface';
import { SearchCacheRepository } from '../../domain/repositories/search-cache.repository';
import { AppError } from '../../../../core/errors/app-error';
import { normalizeQuery } from '../../../../shared/utils/normalize';
import { AnalyticsService } from '../../../../core/analytics/analytics.service';
import { PAGINATION } from '../../../../shared/constants';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';

export interface SearchResult {
  products: ProviderProduct[];
  cached: boolean;
  /** True when served from rows because the provider was down. */
  stale: boolean;
}

const SERVE_PAGE_SIZE = PAGINATION.PAGE_SIZE;

/**
 * Search store — ROWS model (table: search_cache), LAZY per-page fetch.
 *
 * TWO SUPABASE DIALS work together:
 *  - max_api_calls     -> how many provider calls a search may spend (budget).
 *  - search_cache_days -> how old saved data may be before a NEW search refreshes.
 *
 * Scrolling is unbounded and rides saved rows. On a NEW search (page 0) whose
 * data is older than search_cache_days, we refresh (spend up to max_api_calls),
 * update existing rows / insert new, fresh on top, old rows below. Dedup by
 * productId means no product ever shows twice.
 */
@Injectable()
export class SearchProductsUseCase {
  private readonly logger = new Logger(SearchProductsUseCase.name);

  // --- TEMP DUP-CHECK (remove with the other debug logs) ---------------------
  private readonly servedIds = new Map<string, Map<string, number>>();

  // --- Single-flight guard: one provider call per (query, page) at a time. ----
  private readonly inFlight = new Map<string, Promise<SearchResult>>();

  // API calls already spent per query, this process life. Capped by max_api_calls.
  private readonly apiCallsMade = new Map<string, number>();

  // When we last reset a query's budget due to a stale refresh (ms epoch).
  // A cooldown stops a re-fired page-0 from resetting the budget again mid-session,
  // which is what caused cap=2 to spend 4. One reset per fresh search cycle.
  private readonly lastBudgetReset = new Map<string, number>();

  // Minimum gap between two budget resets for the same query. Long enough to
  // cover page-0 re-fires within one search session; short enough that a genuine
  // new search minutes later still refreshes.
  private static readonly RESET_COOLDOWN_MS = 30 * 1000;

  constructor(
    private readonly provider: ProductProvider,
    private readonly cache: SearchCacheRepository,
    private readonly analytics: AnalyticsService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  async execute(query: string, page = 0): Promise<SearchResult> {
    const normalizedQuery = normalizeQuery(query);
    // page is UNBOUNDED — no page cap. Limits are the API budget + saved-row count.
    const flightKey = `${normalizedQuery}::${page}`;

    const existing = this.inFlight.get(flightKey);
    if (existing) {
      this.logger.log(`⏳ SEARCH "${query}" p${page} → JOINED in-flight request (0 API)`);
      return existing;
    }

    const flight = this.runSearch(query, normalizedQuery, page);
    this.inFlight.set(flightKey, flight);
    try {
      return await flight;
    } finally {
      this.inFlight.delete(flightKey);
    }
  }

  private async runSearch(
    query: string,
    normalizedQuery: string,
    page: number,
  ): Promise<SearchResult> {
    // 0) FRESHNESS GATE (page 0 only = a new search, never mid-scroll).
    //    If this query's newest saved data is older than search_cache_days, the
    //    data is STALE -> refresh. We reset the budget so it can spend calls
    //    again, but AT MOST once per RESET_COOLDOWN_MS — so a re-fired page-0
    //    can't reset the budget a second time and blow past max_api_calls.
    //    search_cache_days = 0 -> always stale -> refreshes on each new search.
    let staleRefresh = false;
    if (page === 0) {
      const newest = await this.cache.getNewestRefreshedAt(normalizedQuery);
      if (newest) {
        const days = await this.runtimeConfig.getSearchCacheDays();
        const ageMs = Date.now() - newest.getTime();
        const windowMs = days * 24 * 60 * 60 * 1000;
        if (ageMs >= windowMs) {
          const lastReset = this.lastBudgetReset.get(normalizedQuery) ?? 0;
          if (Date.now() - lastReset >= SearchProductsUseCase.RESET_COOLDOWN_MS) {
            // New refresh cycle: reset budget ONCE, record the time.
            staleRefresh = true;
            this.apiCallsMade.delete(normalizedQuery);
            this.lastBudgetReset.set(normalizedQuery, Date.now());
            this.logger.log(
              `♻️ SEARCH "${query}" → data ${Math.floor(ageMs / 86400000)}d old ≥ ${days}d window → REFRESH`,
            );
          }
          // else: refreshed moments ago (re-fired page-0) — do NOT reset again,
          // let the budget cap hold and serve saved rows below.
        }
      }
    }

    // 1) Serve from cache, 0 API, when the data is FRESH (not a stale-refresh).
    //    RULE: serve whatever this query actually has — never demand a fixed page
    //    size. A query might yield 2, 13, 40, or 50 trusted products; that's the
    //    whole result. If this page's slice has ANY rows, serve them (0 API). We
    //    only fetch (below) when the slice is EMPTY — i.e. the user scrolled past
    //    everything saved and more might exist upstream.
    const rowsForCoverage = await this.cache.getAllRows(normalizedQuery);
    const sliceFromCache = rowsForCoverage ? this.slice(rowsForCoverage, page) : [];
    if (!staleRefresh && sliceFromCache.length > 0) {
      this.logger.log(
        `🟢 SEARCH "${query}" p${page} → ROWS HIT (0 API) | ${sliceFromCache.length} products`,
      );
      this.dupCheck(normalizedQuery, page, sliceFromCache);
      if (page === 0) this.analytics.track('search', { query });
      return { products: sliceFromCache, cached: true, stale: false };
    }

    // 2) Not covered. Decide by the API budget.
    const maxApiCalls = await this.runtimeConfig.getMaxApiCalls();
    const spent = this.apiCallsMade.get(normalizedQuery) ?? 0;

    // Budget gates SCROLL auto-fetches only (page > 0). A fresh user search
    // (page 0) is always allowed to hit the API when the cache can't serve it —
    // the cap was never meant to block what the user actually typed.
    if (page > 0 && spent >= maxApiCalls) {
      // Budget spent -> NO API. Serve whatever saved rows remain for this page.
      // Empty slice here = saved data ran out = true end of list.
      const slice = rowsForCoverage ? this.slice(rowsForCoverage, page) : [];
      this.logger.log(
        `🟡 SEARCH "${query}" p${page} → API BUDGET SPENT (${spent}/${maxApiCalls}), serving saved rows | ${slice.length} products`,
      );
      this.dupCheck(normalizedQuery, page, slice);
      return { products: slice, cached: true, stale: false };
    }

    // 3) Under budget -> make ONE provider call, save, serve from deduped rows.
    try {
      const pageProducts = await this.provider.search(query, page);
      await this.cache.refreshFromProvider({
        normalizedQuery,
        rawQuery: query,
        products: pageProducts,
        startPosition: page * SERVE_PAGE_SIZE,
      });
      this.apiCallsMade.set(normalizedQuery, spent + 1);
      this.logger.log(
        `🔴 SEARCH "${query}" p${page} → 1 API CALL (${spent + 1}/${maxApiCalls}) | ${pageProducts.length} products`,
      );
      if (page === 0) this.analytics.track('search', { query });

      const allRows = (await this.cache.getAllRows(normalizedQuery)) ?? [];
      const slice = this.slice(allRows, page);
      this.dupCheck(normalizedQuery, page, slice);
      return { products: slice, cached: false, stale: false };
    } catch (err) {
      // Provider down -> serve saved rows for this page (stale fallback).
      const all = await this.cache.getAllRows(normalizedQuery);
      if (all && all.length > 0) {
        const slice = this.slice(all, page);
        if (slice.length > 0) {
          this.logger.warn(
            `Provider search failed for "${query}" p${page}; serving stale rows (${slice.length}).`,
          );
          this.dupCheck(normalizedQuery, page, slice);
          return { products: slice, cached: true, stale: true };
        }
      }
      throw err as AppError;
    }
  }

  /** Slice the full ordered list into the requested serve-page window. */
  private slice(products: ProviderProduct[], page: number): ProviderProduct[] {
    const start = page * SERVE_PAGE_SIZE;
    return products.slice(start, start + SERVE_PAGE_SIZE);
  }

  /** TEMP dup-check (remove with the other debug logs). */
  private dupCheck(normalizedQuery: string, page: number, slice: ProviderProduct[]): void {
    if (page === 0) this.servedIds.set(normalizedQuery, new Map<string, number>());
    const seen = this.servedIds.get(normalizedQuery) ?? new Map<string, number>();
    this.servedIds.set(normalizedQuery, seen);

    const crossPageRepeats: string[] = [];
    let fresh = 0;
    for (const p of slice) {
      const id = p.productId;
      if (!id) continue;
      const firstPage = seen.get(id);
      if (firstPage === undefined) {
        seen.set(id, page);
        fresh++;
      } else if (firstPage !== page) {
        crossPageRepeats.push(id);
      }
    }

    const verdict = crossPageRepeats.length === 0 ? 'none' : JSON.stringify(crossPageRepeats);

    console.log(
      `\n🧪 [DUP CHECK] "${normalizedQuery}" p${page} | serving ${slice.length} | new ${fresh} | cross-page REPEATS: ${verdict}\n`,
    );
  }
}
