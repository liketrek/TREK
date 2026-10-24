/**
 * MAPS-ALONG-035..038: asking the Overpass mirrors one after another (PLN-05).
 * The next mirror is asked once the last failed or kept quiet for the hedge,
 * the first answer wins, and a busy mirror's Retry-After is read in either
 * spelling. Pure: the attempts are stubs, the clock is vitest's.
 */
import {
  OverpassBusy,
  hedged,
  lastAnsweredFirst,
  retryAfterMs,
  soonestRetryMs,
} from '../../../src/nest/maps/overpass-hedge.helpers';

import { afterEach, describe, expect, it, vi } from 'vitest';

const MIRRORS = ['https://a.example', 'https://b.example', 'https://c.example'];

afterEach(() => {
  vi.useRealTimers();
});

describe('overpass hedge helpers', () => {
  it('MAPS-ALONG-035: the next mirror is asked after the hedge or at once when the last failed, the first answer wins', async () => {
    vi.useFakeTimers();
    const asked: string[] = [];
    // a keeps quiet, b fails after half a second, c answers.
    const attempt = vi.fn((url: string) => {
      asked.push(url);
      if (url === 'https://a.example') return new Promise<string>(() => {});
      if (url === 'https://b.example')
        return new Promise<string>((_resolve, reject) => setTimeout(() => reject(new Error('504')), 500));
      return Promise.resolve(`answer of ${url}`);
    });

    const answer = hedged(MIRRORS, attempt, 1000);
    expect(asked).toEqual(['https://a.example']);
    await vi.advanceTimersByTimeAsync(1000);
    expect(asked).toEqual(['https://a.example', 'https://b.example']);
    // b fails before the next hedge is up, so c is asked then rather than at two seconds.
    await vi.advanceTimersByTimeAsync(500);
    expect(asked).toEqual(MIRRORS);
    await expect(answer).resolves.toBe('answer of https://c.example');
  });

  it('MAPS-ALONG-036: every mirror failing rejects with every reason; none to ask rejects at once', async () => {
    const attempt = (url: string) => Promise.reject(new Error(`down @ ${url}`));

    const failed = await hedged(MIRRORS, attempt, 1000).catch((err: unknown) => err);

    expect(failed).toBeInstanceOf(AggregateError);
    expect((failed as AggregateError).errors.map((err: Error) => err.message)).toEqual(
      MIRRORS.map((url) => `down @ ${url}`),
    );
    await expect(hedged([], attempt, 1000)).rejects.toBeInstanceOf(AggregateError);
  });

  it('MAPS-ALONG-037: a Retry-After is read as seconds or as a date, the shortest busy wait is the one named', () => {
    const now = Date.parse('2026-10-21T05:06:00Z');
    expect(retryAfterMs('30', now)).toBe(30_000);
    expect(retryAfterMs(' 0 ', now)).toBe(0);
    expect(retryAfterMs('Wed, 21 Oct 2026 05:07:00 GMT', now)).toBe(60_000);
    expect(retryAfterMs('Wed, 21 Oct 2026 05:05:00 GMT', now)).toBe(0);
    expect(retryAfterMs('soon', now)).toBeNull();
    expect(retryAfterMs('', now)).toBeNull();
    expect(retryAfterMs(null, now)).toBeNull();

    expect(
      soonestRetryMs([new OverpassBusy('https://a.example', 90_000), new OverpassBusy('https://b.example', 30_000)]),
    ).toBe(30_000);
    // A timeout or a busy mirror that named no wait says nothing about when to ask again.
    expect(soonestRetryMs([new Error('aborted'), new OverpassBusy('https://a.example', null)])).toBeNull();
    expect(new OverpassBusy('https://a.example', null).message).toBe('Overpass 429 @ https://a.example');
  });

  it('MAPS-ALONG-038: the mirror that answered last is asked first, an unknown one changes nothing', () => {
    expect(lastAnsweredFirst(MIRRORS, 'https://c.example')).toEqual([
      'https://c.example',
      'https://a.example',
      'https://b.example',
    ]);
    expect(lastAnsweredFirst(MIRRORS, 'https://gone.example')).toEqual(MIRRORS);
    expect(lastAnsweredFirst(MIRRORS, null)).toEqual(MIRRORS);
  });
});
