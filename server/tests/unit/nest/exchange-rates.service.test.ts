/**
 * Unit tests for the DI-native ExchangeRatesService — FX-SVC-001 through
 * FX-SVC-022. New suite: the legacy services/exchangeRateService.ts had no
 * dedicated tests; the budget-domain fold moved it inside the src/nest/**
 * coverage gate. 001–012 pin the fetch/cache behavior (including the parity
 * quirks kept on purpose: `|| 'EUR'` falsy coercion, stale-cache fallback, the
 * `>1 keys` failure heuristic); 019 pins the module-scoped cache shared across
 * instances (the DI singleton and the out-of-container bridge instances wrap
 * one feed — originally pinned via the exchange-rates.bridge, deleted with the
 * budget fold); 021–022 pin the post-fold quirk fixes (AbortSignal timeout,
 * response-size cap, logged failures). 013–018 and 020 covered the dead
 * convertWithRates export and were removed with it in the quirk fixes.
 *
 * The rate cache is deliberately MODULE-scoped, so it persists across tests in
 * this file — every case uses its own base currency to stay isolated.
 */
import { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const TTL_MS = 6 * 60 * 60 * 1000; // mirrors the service's 6h TTL

// A minimal Frankfurter-shaped success response (array of { quote, rate }).
const okResponse = (data: unknown) => ({ ok: true, text: async () => JSON.stringify(data) });

const snapshots = new Map<
  string,
  {
    base_currency: string;
    rates_json: string;
    source_version: string;
    effective_date: string | null;
    fetched_at: string;
  }
>();
const fakeDb = {
  get(sql: string, base: string) {
    if (sql.includes('global_exchange_rate_snapshots')) return snapshots.get(base);
    return undefined;
  },
  run(sql: string, ...args: unknown[]) {
    if (sql.includes('INSERT INTO global_exchange_rate_snapshots')) {
      const [base_currency, rates_json, source_version, effective_date, fetched_at] = args as [
        string,
        string,
        string,
        string | null,
        string,
      ];
      snapshots.set(base_currency, { base_currency, rates_json, source_version, effective_date, fetched_at });
    }
    return { changes: 1 };
  },
  all() {
    return [];
  },
} as unknown as DatabaseService;
const svc = new ExchangeRatesService(fakeDb);

let fetchMock: ReturnType<typeof vi.fn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => okResponse([{ quote: 'USD', rate: 1.08 }]));
  vi.stubGlobal('fetch', fetchMock);
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  errorSpy.mockRestore();
});

describe('ExchangeRatesService.getRates', () => {
  it('FX-SVC-001: falls back to EUR for a falsy base (|| coercion, not ??)', async () => {
    const rates = await svc.getRates('');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.frankfurter.dev/v2/rates?base=EUR');
    expect(rates).toEqual({ EUR: 1, USD: 1.08 });
  });

  it('FX-SVC-002: upper-cases the base for the request and the self-rate seed', async () => {
    fetchMock.mockResolvedValueOnce(okResponse([{ quote: 'GBP', rate: 0.85 }]));
    const rates = await svc.getRates('usd');
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.frankfurter.dev/v2/rates?base=USD');
    expect(rates).toEqual({ USD: 1, GBP: 0.85 });
  });

  it('FX-SVC-003: seeds base = 1, indexes by quote and skips malformed entries', async () => {
    fetchMock.mockResolvedValueOnce(
      okResponse([
        { quote: 'USD', rate: 1.08 },
        { quote: 'GBP', rate: 0.85 },
        { quote: 42, rate: 1 }, // non-string quote → skipped
        { quote: 'JPY' }, // missing rate → skipped
        null, // null entry → skipped
      ]),
    );
    const rates = await svc.getRates('CHF');
    expect(rates).toEqual({ CHF: 1, USD: 1.08, GBP: 0.85 });
  });

  it('FX-SVC-004: returns null on a non-ok upstream response', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => [] });
    expect(await svc.getRates('NOK')).toBeNull();
  });

  it('FX-SVC-005: returns null when the response body is not an array', async () => {
    fetchMock.mockResolvedValueOnce(okResponse({ USD: 1.08 }));
    expect(await svc.getRates('SEK')).toBeNull();
  });

  it('FX-SVC-006: returns null when fetch throws — and logs the failure (quirk fix)', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await svc.getRates('DKK')).toBeNull();
    expect(errorSpy).toHaveBeenCalledWith('[exchange-rates] rates fetch failed for', 'DKK', expect.any(Error));
  });

  it('FX-SVC-007: treats a response that yields only the self-rate as failure (>1 keys heuristic)', async () => {
    fetchMock.mockResolvedValueOnce(okResponse([]));
    expect(await svc.getRates('CZK')).toBeNull();
  });

  it('FX-SVC-008: serves the cached rates within the TTL without refetching', async () => {
    const first = await svc.getRates('PLN');
    const second = await svc.getRates('PLN');
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('FX-SVC-009: refetches once the TTL has elapsed', async () => {
    vi.useFakeTimers();
    await svc.getRates('HUF');
    vi.advanceTimersByTime(TTL_MS + 1);
    fetchMock.mockResolvedValueOnce(okResponse([{ quote: 'USD', rate: 1.2 }]));
    const rates = await svc.getRates('HUF');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rates).toEqual({ HUF: 1, USD: 1.2 });
  });

  it('FX-SVC-010: quirk — falls back to the stale cache (beyond the TTL) when the upstream fails', async () => {
    vi.useFakeTimers();
    const first = await svc.getRates('RON');
    vi.advanceTimersByTime(TTL_MS + 1);
    fetchMock.mockRejectedValueOnce(new Error('down'));
    expect(await svc.getRates('RON')).toEqual(first);
  });

  it('FX-SVC-011: coalesces concurrent fetches for the same base into one request', async () => {
    let release!: (v: unknown) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const a = svc.getRates('ISK');
    const b = svc.getRates('ISK');
    release(okResponse([{ quote: 'USD', rate: 1.08 }]));
    const [ra, rb] = await Promise.all([a, b]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(rb).toBe(ra);
  });

  it('FX-SVC-012: returns null on failure when nothing is cached', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => [] });
    expect(await svc.getRates('BGN')).toBeNull();
  });

  it('FX-SVC-021: sends the request with an abort-timeout signal (quirk fix)', async () => {
    await svc.getRates('MXN');
    const opts = fetchMock.mock.calls[0][1] as { signal?: unknown } | undefined;
    expect(opts?.signal).toBeInstanceOf(AbortSignal);
  });

  it('FX-SVC-022: treats an oversized response body as failure (quirk fix)', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, text: async () => 'x'.repeat(1024 * 1024 + 1) });
    expect(await svc.getRates('BRL')).toBeNull();
  });
});

describe('cross-instance cache sharing', () => {
  it('FX-SVC-019: a second instance (the out-of-container bridge shape) serves the module-scoped cache', async () => {
    // Prime the cache through the DI-style instance…
    const primed = await svc.getRates('AUD');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // …then a separately-constructed instance (as the trips/airtrail/auth
    // bridges new up) must serve the same cached feed instead of refetching.
    expect(await new ExchangeRatesService(fakeDb).getRates('AUD')).toEqual(primed);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
