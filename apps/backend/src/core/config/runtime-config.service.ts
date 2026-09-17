import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PAGINATION, CACHE_TTL, ALERTS } from '../../shared/constants';

/**
 * DB-backed runtime config (table: app_config). Reads tunable settings that can
 * be changed from Supabase WITHOUT a code change or redeploy. Rows are cached in
 * memory for CACHE_MS so we don't hit Postgres on every request; the cache
 * refreshes lazily once it goes stale.
 *
 * This is the reusable switchboard: add a new getter per key. Every getter MUST
 * fall back to a safe hardcoded default if the row is missing / unparseable /
 * the DB is unreachable — config tunes behavior, it never breaks the app.
 *
 * NOTE: distinct from AppConfigService (which reads .env). This one reads the DB.
 */
@Injectable()
export class RuntimeConfigService {
  private readonly logger = new Logger(RuntimeConfigService.name);

  /** How long a loaded snapshot is trusted before we re-query. */
  private static readonly CACHE_MS = 5 * 60 * 1000; // 5 minutes

  private cache = new Map<string, string>();
  private loadedAt = 0;

  constructor(private readonly prisma: PrismaService) {}

  /** Load all rows into the cache if we've never loaded or the cache is stale. */
  private async ensureFresh(): Promise<void> {
    const age = Date.now() - this.loadedAt;
    if (this.loadedAt !== 0 && age < RuntimeConfigService.CACHE_MS) return;

    try {
      const rows = await this.prisma.appConfig.findMany();
      const next = new Map<string, string>();
      // Trim the KEY too — a stray space/newline in the key column (e.g.
      // "max_api_calls\n") would otherwise never match a lookup and silently
      // fall back to the default. Value is trimmed later in getRaw().
      for (const r of rows) next.set(r.key.trim(), r.value);
      this.cache = next;
      this.loadedAt = Date.now();
    } catch (e) {
      // DB unreachable: keep whatever we had (even if empty). Getters fall back
      // to their defaults, so search still works. Don't throw.
      this.logger.warn(
        `app_config load failed; using ${
          this.cache.size > 0 ? 'last-known' : 'default'
        } values. ${(e as Error).message}`,
      );
    }
  }

  /** Raw string value for a key, or undefined if absent. */
  /**
   * Raw string value for a key, or undefined if absent. Trimmed of stray spaces
   * and newlines — hand-typed Supabase cells sometimes carry an invisible Enter
   * or trailing space (e.g. "2\n"), which would otherwise break Number() parsing
   * and silently fall back to defaults. Trimming here protects EVERY reader.
   */
  private async getRaw(key: string): Promise<string | undefined> {
    await this.ensureFresh();
    const raw = this.cache.get(key);
    return raw?.trim();
  }

  /**
   * Max SerpAPI calls allowed per query. Caps SPEND, not scrolling — once hit,
   * the query goes cache-only and scrolling continues over saved rows until they
   * run out. Reads `max_api_calls`; falls back to PAGINATION.MAX_PAGES if unset.
   */
  async getMaxApiCalls(): Promise<number> {
    const raw = await this.getRaw('max_api_calls');
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) return PAGINATION.MAX_PAGES;
    return n;
  }

  /**
   * How many DAYS a saved search stays fresh. Within this window a repeat search
   * serves saved rows (0 API); past it, the search refreshes from the provider.
   * Reads `search_cache_days`; falls back to CACHE_TTL.SEARCH_DAYS. Allows 0
   * (refresh every time — e.g. sale days) so we accept n >= 0, not n >= 1.
   */
  async getSearchCacheDays(): Promise<number> {
    const raw = await this.getRaw('search_cache_days');
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return CACHE_TTL.SEARCH_DAYS;
    return n;
  }

  /**
   * How many HOURS a saved compare stays fresh. Reads `compare_cache_hours`;
   * falls back to CACHE_TTL.COMPARE_HOURS. Allows 0 (always refresh).
   */
  async getCompareCacheHours(): Promise<number> {
    const raw = await this.getRaw('compare_cache_hours');
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) return CACHE_TTL.COMPARE_HOURS;
    return n;
  }

  /**
   * Max products a user may save to their wishlist. Reads `wishlist_max_items`;
   * falls back to 30. Must be >= 1 (a 0 limit would block all saves). Trim-safe
   * via getRaw, like the other dials — change it in Supabase, applies within 5 min.
   */
  async getWishlistMaxItems(): Promise<number> {
    const raw = await this.getRaw('wishlist_max_items');
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) return 30;
    return n;
  }

  /**
   * Whether the price-history graph is shown in the app. Reads `price_graph_enabled`;
   * defaults to false (off) until we've collected enough per-seller data to look good.
   * Flip to "true" in Supabase app_config to turn it on — applies within 5 min, no redeploy.
   */
  async getPriceGraphEnabled(): Promise<boolean> {
    const raw = await this.getRaw('price_graph_enabled');
    return raw?.toLowerCase() === 'true';
  }

  /**
   * Max products the price-alert refresh cron will actually refresh against
   * the provider in a single run. Reads `alert_refresh_batch_cap`; falls back
   * to ALERTS.REFRESH_BATCH_CAP. Products served from a still-fresh cache
   * don't count against this — it only bounds real provider spend.
   */
  async getAlertRefreshBatchCap(): Promise<number> {
    const raw = await this.getRaw('alert_refresh_batch_cap');
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 1) return ALERTS.REFRESH_BATCH_CAP;
    return n;
  }
}
