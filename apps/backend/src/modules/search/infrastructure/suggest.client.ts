import { Injectable } from '@nestjs/common';

/** Free Google autocomplete — no API key, does NOT consume SerpAPI credits. */
@Injectable()
export class SuggestClient {
  async suggest(query: string): Promise<string[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=in&q=${encodeURIComponent(q)}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as [string, string[]];
      return Array.isArray(data?.[1]) ? data[1].slice(0, 8) : [];
    } catch {
      return []; // suggestions are non-critical — fail silently
    }
  }
}
