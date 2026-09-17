import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../../core/config/config.service';
import { ProviderError } from '../../../core/errors/app-error';

/** Products requested per page from SerpAPI. Keep this modest — asking for too
 *  many (e.g. 60) makes SerpAPI slow enough to hit the request timeout. */
const RESULTS_PER_PAGE = 20;

/** Raw HTTP to SerpAPI. Knows nothing about Omnisift's domain. */
@Injectable()
export class SerpApiClient {
  constructor(private readonly config: AppConfigService) {}

  googleShopping(query: string, page = 0): Promise<Record<string, unknown>> {
    return this.get({
      engine: 'google_shopping',
      q: query,
      gl: 'in',
      hl: 'en',
      num: String(RESULTS_PER_PAGE),
      start: String(page * RESULTS_PER_PAGE),
    });
  }

  immersiveProduct(pageToken: string): Promise<Record<string, unknown>> {
    return this.get({
      engine: 'google_immersive_product',
      page_token: pageToken,
      more_stores: 'true',
    });
  }

  private async get(params: Record<string, string>): Promise<Record<string, unknown>> {
    const qs = new URLSearchParams({ ...params, api_key: this.config.serpApiKey });
    let status: number | undefined;
    try {
      const res = await fetch(`https://serpapi.com/search?${qs.toString()}`, {
        signal: AbortSignal.timeout(30000), // 30s safety margin
      });
      status = res.status;
      if (!res.ok) throw new Error(`SerpAPI ${res.status}`);
      return (await res.json()) as Record<string, unknown>;
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      // Never log the raw caught error/request here — the request URL carries
      // api_key as a query param (SerpAPI's own auth scheme; it doesn't
      // support header-based auth), and some fetch failure objects can carry
      // request metadata via .cause. Log only the sanitized status/reason.
      console.error(`[SerpAPI ERROR] status=${status ?? 'n/a'} reason=${reason}`);
      // Stash status + reason on ProviderError.detail so the provider can log them
      // to api_usage_logs (httpStatus / errorReason). detail is never sent to the client.
      throw new ProviderError('Search is temporarily unavailable. Please try again.', {
        status,
        reason,
      });
    }
  }
}
