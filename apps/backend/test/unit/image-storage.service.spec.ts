import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('dns/promises', () => ({ lookup: vi.fn() }));

import { lookup as dnsLookup } from 'dns/promises';
import { ImageStorageService } from '../../src/integrations/storage/image-storage.service';
import { SupabaseService } from '../../src/core/supabase/supabase.service';

const PUBLIC_URL = 'https://supabase.example/storage/v1/object/public/product-images/HASH.jpg';

function fakeSupabase(uploadResult: { error: unknown } = { error: null }) {
  const upload = vi.fn(
    async (_path: string, _bytes: Uint8Array, _opts: { contentType: string; upsert: boolean }) =>
      uploadResult,
  );
  const supabase = {
    admin: {
      storage: {
        from: () => ({
          upload,
          getPublicUrl: () => ({ data: { publicUrl: PUBLIC_URL } }),
        }),
      },
    },
  } as unknown as SupabaseService;
  return { supabase, upload };
}

function jpegBytes(size = 1000): Uint8Array {
  const b = new Uint8Array(size);
  b[0] = 0xff;
  b[1] = 0xd8;
  b[2] = 0xff;
  return b;
}

function streamOf(bytes: Uint8Array, chunkSize = 4096): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }
      const chunk = bytes.slice(offset, offset + chunkSize);
      offset += chunk.length;
      controller.enqueue(chunk);
    },
  });
}

/** Response mock exposing only what fetchOnce/exists actually touch. */
function makeResponse(opts: {
  ok?: boolean;
  status?: number;
  location?: string;
  body?: ReadableStream<Uint8Array>;
}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    headers: {
      get: (k: string) => (k.toLowerCase() === 'location' ? (opts.location ?? null) : null),
    },
    body: opts.body,
  };
}

describe('ImageStorageService — hardened intake (P1)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(dnsLookup).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refuses a plain-http source URL without ever contacting it', async () => {
    const { supabase, upload } = fakeSupabase();
    // exists() HEAD check on the (not-yet-cached) public URL — always miss.
    fetchMock.mockImplementation(async () => makeResponse({ ok: false }));
    const service = new ImageStorageService(supabase);

    const result = await service.store('http://insecure.example/a.jpg');

    expect(result).toBe('http://insecure.example/a.jpg'); // fallback, not uploaded
    expect(upload).not.toHaveBeenCalled();
    // Only the exists() HEAD call happened — never a GET to the http source.
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).not.toContain('insecure.example');
    }
  });

  it('refuses a source host that resolves to a private/loopback IP (SSRF guard)', async () => {
    const { supabase, upload } = fakeSupabase();
    vi.mocked(dnsLookup).mockResolvedValue({ address: '127.0.0.1', family: 4 });
    fetchMock.mockImplementation(async () => makeResponse({ ok: false })); // exists() miss
    const service = new ImageStorageService(supabase);

    const result = await service.store('https://evil.example/a.jpg');

    expect(result).toBe('https://evil.example/a.jpg'); // fallback
    expect(upload).not.toHaveBeenCalled();
    for (const call of fetchMock.mock.calls) {
      expect(String(call[0])).not.toContain('evil.example');
    }
  });

  it('follows a redirect but refuses it once the target resolves to a private IP', async () => {
    const { supabase, upload } = fakeSupabase();
    vi.mocked(dnsLookup).mockImplementation(
      async (hostname: unknown) =>
        hostname === 'cdn.example'
          ? { address: '93.184.216.34', family: 4 }
          : { address: '169.254.169.254', family: 4 }, // cloud metadata range
    );
    fetchMock.mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes('product-images')) return makeResponse({ ok: false }); // exists() miss
      if (url.includes('cdn.example')) {
        return makeResponse({ status: 302, location: 'https://169.254.169.254/steal' });
      }
      throw new Error('should never fetch the redirect target');
    });
    const service = new ImageStorageService(supabase);

    const result = await service.store('https://cdn.example/a.jpg');

    expect(result).toBe('https://cdn.example/a.jpg'); // fallback
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects a response whose bytes do not match any known image signature, even with a claimed image Content-Type', async () => {
    const { supabase, upload } = fakeSupabase();
    vi.mocked(dnsLookup).mockResolvedValue({ address: '93.184.216.34', family: 4 });
    const notAnImage = new TextEncoder().encode('<html>not an image</html>'.repeat(50));
    fetchMock.mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes('product-images')) return makeResponse({ ok: false });
      return makeResponse({ body: streamOf(notAnImage) });
    });
    const service = new ImageStorageService(supabase);

    const result = await service.store('https://cdn.example/fake.jpg');

    expect(result).toBe('https://cdn.example/fake.jpg'); // fallback
    expect(upload).not.toHaveBeenCalled();
  });

  it('aborts and rejects a response that exceeds the size cap instead of buffering it fully', async () => {
    const { supabase, upload } = fakeSupabase();
    vi.mocked(dnsLookup).mockResolvedValue({ address: '93.184.216.34', family: 4 });
    const huge = jpegBytes(9 * 1024 * 1024); // > 8MB cap
    fetchMock.mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes('product-images')) return makeResponse({ ok: false });
      return makeResponse({ body: streamOf(huge) });
    });
    const service = new ImageStorageService(supabase);

    const result = await service.store('https://cdn.example/huge.jpg');

    expect(result).toBe('https://cdn.example/huge.jpg'); // fallback
    expect(upload).not.toHaveBeenCalled();
  });

  it('uploads with the real detected content-type (never a hardcoded one) for a valid, small, https, public-host image', async () => {
    const { supabase, upload } = fakeSupabase();
    vi.mocked(dnsLookup).mockResolvedValue({ address: '93.184.216.34', family: 4 });
    const png = new Uint8Array([
      0x89,
      0x50,
      0x4e,
      0x47,
      0x0d,
      0x0a,
      0x1a,
      0x0a,
      ...new Array(1000).fill(0),
    ]);
    fetchMock.mockImplementation(async (input: unknown) => {
      const url = String(input);
      if (url.includes('product-images')) return makeResponse({ ok: false });
      return makeResponse({ body: streamOf(png) });
    });
    const service = new ImageStorageService(supabase);

    const result = await service.store('https://cdn.example/real.png');

    expect(result).toBe(PUBLIC_URL);
    expect(upload).toHaveBeenCalledOnce();
    const [, , opts] = upload.mock.calls[0];
    expect((opts as { contentType: string }).contentType).toBe('image/png');
  });
});
