import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { lookup as dnsLookup } from 'dns/promises';
import { isIP } from 'net';
import { SupabaseService } from '../../core/supabase/supabase.service';

const BUCKET = 'product-images';
const UAS = [
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Googlebot-Image/1.0',
];

const MAX_BYTES = 8 * 1024 * 1024; // 8MB — generous for a product photo, small enough to bound a hostile response
const MAX_REDIRECTS = 3;

/** Recognized image signatures (magic bytes) — the only content types this
 * service will ever accept and upload, regardless of what the server claims
 * via Content-Type. */
const SIGNATURES: { contentType: string; matches: (b: Uint8Array) => boolean }[] = [
  { contentType: 'image/jpeg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    contentType: 'image/png',
    matches: (b) =>
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a,
  },
  {
    contentType: 'image/webp',
    matches: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
  {
    contentType: 'image/gif',
    matches: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
];

function detectImageType(bytes: Uint8Array): string | null {
  return SIGNATURES.find((s) => s.matches(bytes))?.contentType ?? null;
}

/**
 * Uploads a Google product image to Supabase Storage under a hash of its URL,
 * returning a permanent public link. Filename = md5(url), so the same image is
 * never uploaded twice (the bucket itself is the cache). Falls back to the raw
 * URL on any failure. Ported from the prototype (sharp conversion dropped —
 * Google images are already jpeg/png).
 *
 * Hardened intake (P1): HTTPS-only, streamed with a hard size cap (never
 * trusts Content-Length, which a hostile server can omit or lie about),
 * magic-byte verified (never trusts a claimed Content-Type), and every host —
 * including each redirect hop — is DNS-resolved and checked against
 * private/loopback/link-local ranges before connecting (SSRF mitigation).
 * Source URLs come from SerpAPI/Google, not end users, but are still treated
 * as untrusted network input.
 */
@Injectable()
export class ImageStorageService {
  private readonly logger = new Logger(ImageStorageService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async store(rawUrl: string): Promise<string> {
    if (!rawUrl || rawUrl.startsWith('data:')) return rawUrl || '';

    const hash = createHash('md5').update(rawUrl).digest('hex');
    const path = `${hash}.jpg`;
    const publicUrl = this.publicUrl(path);

    // Already uploaded? The public URL resolves → skip the download/upload.
    if (await this.exists(publicUrl)) return publicUrl;

    const fetched = await this.fetchBytes(rawUrl);
    if (!fetched) return rawUrl;

    try {
      const { error } = await this.supabase.admin.storage
        .from(BUCKET)
        .upload(path, fetched.bytes, { contentType: fetched.contentType, upsert: true });
      if (error) return rawUrl;
      return publicUrl;
    } catch {
      return rawUrl;
    }
  }

  async storeMany(urls: string[]): Promise<string[]> {
    return Promise.all(urls.map((u) => this.store(u)));
  }

  /**
   * LAZY variant for search (40-item lists). Returns the PERMANENT public URL
   * for each image INSTANTLY — the filename is md5(url), so the URL is fully
   * deterministic and needs no network call to compute. The actual download +
   * upload happens in the BACKGROUND (fire-and-forget), so search never waits
   * on image I/O (kills the ~15s cold-bucket stall).
   *
   * Trade-off: on a brand-new search the permanent URL may 404 for a couple of
   * seconds until the background upload lands, then it resolves. Every later
   * serve (cache hit) is instant because the bucket is warm.
   *
   * Non-http/data URLs are passed straight through (never uploaded).
   */
  storeManyLazy(urls: string[]): string[] {
    return urls.map((rawUrl) => {
      if (!rawUrl || rawUrl.startsWith('data:')) return rawUrl || '';
      if (!rawUrl.startsWith('http')) return rawUrl;

      const hash = createHash('md5').update(rawUrl).digest('hex');
      const path = `${hash}.jpg`;
      const publicUrl = this.publicUrl(path);

      // Fire the upload in the background; the returned URL heals once it lands.
      void this.ensureUploaded(rawUrl, path);
      return publicUrl;
    });
  }

  /**
   * Background upload for storeManyLazy. Skips the fetch/upload if the object
   * already exists (bucket = cache). Swallows all errors — this must never
   * surface to the request. Same download/upload logic as `store()`.
   */
  private async ensureUploaded(rawUrl: string, path: string): Promise<void> {
    try {
      if (await this.exists(this.publicUrl(path))) return; // already in bucket
      const fetched = await this.fetchBytes(rawUrl);
      if (!fetched) return;
      await this.supabase.admin.storage
        .from(BUCKET)
        .upload(path, fetched.bytes, { contentType: fetched.contentType, upsert: true });
    } catch {
      // ignore — image just stays un-cached until the next search re-triggers it
    }
  }

  private publicUrl(path: string): string {
    return this.supabase.admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  private async exists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Resolves `hostname` and rejects private/loopback/link-local/unspecified
   * targets — the core SSRF guard. Applied to the original URL AND to every
   * redirect hop, since a hostile server can redirect anywhere after the
   * initial (legitimate-looking) host passes.
   */
  private async isDisallowedHost(hostname: string): Promise<boolean> {
    try {
      const ip = isIP(hostname) ? hostname : (await dnsLookup(hostname)).address;
      return this.isPrivateOrReservedIp(ip);
    } catch {
      return true; // can't resolve it → don't fetch it
    }
  }

  private isPrivateOrReservedIp(ip: string): boolean {
    if (isIP(ip) === 4) {
      const [a, b] = ip.split('.').map(Number);
      return (
        a === 127 || // loopback
        a === 10 || // private
        (a === 172 && b >= 16 && b <= 31) || // private
        (a === 192 && b === 168) || // private
        (a === 169 && b === 254) || // link-local (incl. cloud metadata)
        a === 0 // unspecified
      );
    }
    const lower = ip.toLowerCase();
    return (
      lower === '::1' || // loopback
      lower === '::' || // unspecified
      lower.startsWith('fe80:') || // link-local
      lower.startsWith('fc') || // unique local (fc00::/7)
      lower.startsWith('fd')
    );
  }

  private async fetchBytes(
    url: string,
  ): Promise<{ bytes: Uint8Array; contentType: string } | null> {
    for (const ua of UAS) {
      try {
        const bytes = await this.fetchOnce(url, ua);
        if (!bytes || bytes.length <= 500) continue;
        const contentType = detectImageType(bytes);
        if (!contentType) continue; // not a recognized image signature — reject regardless of claimed type
        return { bytes, contentType };
      } catch {
        continue;
      }
    }
    return null;
  }

  /** One download attempt: HTTPS-only, SSRF-checked (incl. every redirect
   * hop), streamed with a hard byte cap so a hostile/unbounded response body
   * can never be buffered in full before we notice. */
  private async fetchOnce(startUrl: string, userAgent: string): Promise<Uint8Array | null> {
    let currentUrl = startUrl;

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const parsed = new URL(currentUrl);
      if (parsed.protocol !== 'https:') return null;
      if (await this.isDisallowedHost(parsed.hostname)) {
        this.logger.warn(`refused image fetch — disallowed host: ${parsed.hostname}`);
        return null;
      }

      const res = await fetch(currentUrl, {
        headers: { 'User-Agent': userAgent, Accept: 'image/*', Referer: 'https://www.google.com/' },
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location) return null;
        currentUrl = new URL(location, currentUrl).toString();
        continue; // re-validate the new host on the next loop iteration
      }

      if (!res.ok || !res.body) return null;
      return this.readCapped(res.body);
    }

    return null; // exceeded MAX_REDIRECTS
  }

  /** Reads a response body up to MAX_BYTES, aborting the connection the
   * moment the cap is exceeded rather than trusting Content-Length (which a
   * hostile server can omit, lie about, or stream past). */
  private async readCapped(body: ReadableStream<Uint8Array>): Promise<Uint8Array | null> {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES) {
          await reader.cancel().catch(() => undefined);
          return null;
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const out = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}
