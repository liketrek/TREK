/**
 * PLN-05: asking the Overpass mirrors one after another instead of all at
 * once. The public mirrors limit slots per IP, so a query sent to all four
 * costs four slots, and a few searches along a tour beside the ferrata lookup
 * were enough to have every mirror refuse or drop them together. Pure: no
 * fetch, no clock beyond the timers it is handed.
 */

/** A mirror that refused the query because it is busy (HTTP 429), and how long it asked to be left alone. */
export class OverpassBusy extends Error {
  constructor(
    url: string,
    readonly retryAfterMs: number | null,
  ) {
    super(`Overpass 429 @ ${url}`);
    this.name = 'OverpassBusy';
  }
}

/** A Retry-After header in milliseconds, given as seconds or as an HTTP date; null when absent or unreadable. */
export function retryAfterMs(header: string | null, now = Date.now()): number | null {
  const value = header?.trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value) * 1000;
  const at = Date.parse(value);
  return Number.isNaN(at) ? null : Math.max(0, at - now);
}

/** The shortest wait any busy mirror asked for, or null when none named one. */
export function soonestRetryMs(errors: readonly unknown[]): number | null {
  const waits = errors.flatMap((err) =>
    err instanceof OverpassBusy && err.retryAfterMs !== null ? [err.retryAfterMs] : [],
  );
  return waits.length ? Math.min(...waits) : null;
}

/**
 * The first answer of `urls`, asked in order: the next one is asked once the
 * last one failed or has kept quiet for `hedgeMs`, so a quick answer costs one
 * mirror and a dead one costs a moment rather than its whole deadline. Rejects
 * with every reason (AggregateError) once all of them failed.
 */
export function hedged<T>(urls: readonly string[], attempt: (url: string) => Promise<T>, hedgeMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const errors: unknown[] = [];
    let started = 0;
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const next = () => {
      clearTimeout(timer);
      if (done || started >= urls.length) return;
      const url = urls[started];
      started += 1;
      if (started < urls.length) timer = setTimeout(next, hedgeMs);
      attempt(url).then(
        (value) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          resolve(value);
        },
        (err: unknown) => {
          errors.push(err);
          if (done) return;
          if (errors.length < urls.length) return next();
          done = true;
          reject(new AggregateError(errors, 'Every Overpass endpoint failed'));
        },
      );
    };
    if (!urls.length) return reject(new AggregateError([], 'No Overpass endpoint'));
    next();
  });
}

/** The mirrors with the one that answered last first: it is the likeliest to answer again. */
export function lastAnsweredFirst(urls: readonly string[], lastAnswered: string | null): string[] {
  if (!lastAnswered || !urls.includes(lastAnswered)) return [...urls];
  return [lastAnswered, ...urls.filter((url) => url !== lastAnswered)];
}
