import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedBlob } from '../../../src/db/offlineDb';
import { downloadFile, openFile } from '../../../src/utils/fileDownload';

// Mock the offline DB so these tests never touch Dexie/IndexedDB.
vi.mock('../../../src/db/offlineDb', () => ({ getCachedBlob: vi.fn() }));

function makeFetchMock(status: number, blob: Blob = new Blob(['data'], { type: 'application/pdf' })) {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    blob: () => Promise.resolve(blob),
  });
}

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el);
  vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('assertRelativeUrl (URL guard)', () => {
  it('rejects absolute http URLs', async () => {
    await expect(downloadFile('https://evil.com/x')).rejects.toThrow('Refusing to fetch non-relative URL');
  });
  it('rejects protocol-relative URLs', async () => {
    await expect(downloadFile('//evil.com/x')).rejects.toThrow('Refusing to fetch non-relative URL');
  });
  it('allows relative paths', async () => {
    vi.stubGlobal('fetch', makeFetchMock(200));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await expect(downloadFile('/trips/1/files/2/download')).resolves.toBeUndefined();
  });
});

describe('downloadFile', () => {
  it('fetches with credentials:include and triggers anchor download', async () => {
    const fetchMock = makeFetchMock(200);
    vi.stubGlobal('fetch', fetchMock);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadFile('/uploads/files/test.pdf', 'test.pdf');

    expect(fetchMock).toHaveBeenCalledWith('/uploads/files/test.pdf', {
      credentials: 'include',
      signal: expect.any(AbortSignal),
    });
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    // Revoke happens after setTimeout(100)
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('sets download attribute to filename when provided', async () => {
    vi.stubGlobal('fetch', makeFetchMock(200));
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadFile('/uploads/files/report.pdf', 'report.pdf');

    // Check anchor was created with download attribute
    const appendCalls = (document.body.appendChild as ReturnType<typeof vi.fn>).mock.calls;
    const anchor = appendCalls[0]?.[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('report.pdf');
  });

  it('throws on 401 response', async () => {
    vi.stubGlobal('fetch', makeFetchMock(401));
    await expect(downloadFile('/uploads/files/secret.pdf')).rejects.toThrow('Unauthorized');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

describe('openFile', () => {
  it('fetches with credentials:include and opens blob URL via target=_blank anchor', async () => {
    vi.stubGlobal('fetch', makeFetchMock(200));
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await openFile('/uploads/files/doc.pdf');

    expect(window.fetch).toHaveBeenCalledWith('/uploads/files/doc.pdf', {
      credentials: 'include',
      signal: expect.any(AbortSignal),
    });
    expect(URL.createObjectURL).toHaveBeenCalled();
    // Must NOT call window.open — that path returns null when noreferrer is
    // set, which previously caused the file to also open in the current tab.
    expect(openSpy).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);

    // The anchor used to open the new tab must be target=_blank, must NOT
    // carry a `download` attribute (otherwise it would download in-page
    // instead of opening), and must use rel=noopener noreferrer.
    const appendCalls = (document.body.appendChild as ReturnType<typeof vi.fn>).mock.calls;
    const anchor = appendCalls[0]?.[0] as HTMLAnchorElement;
    expect(anchor.target).toBe('_blank');
    expect(anchor.rel).toBe('noopener noreferrer');
    expect(anchor.hasAttribute('download')).toBe(false);

    // Revoke happens after 30s timeout
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('does not trigger a second in-page action for safe inline types (regression: no double-open)', async () => {
    vi.stubGlobal('fetch', makeFetchMock(200));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await openFile('/uploads/files/doc.pdf', 'doc.pdf');

    // Exactly ONE anchor click — opening the new tab. No fallback download.
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('throws on 401 response', async () => {
    vi.stubGlobal('fetch', makeFetchMock(401, new Blob([], { type: 'application/pdf' })));
    await expect(openFile('/uploads/files/secret.pdf')).rejects.toThrow('Unauthorized');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('forces download for unsafe MIME types (HTML) instead of opening inline', async () => {
    const htmlBlob = new Blob(['<script>alert(1)</script>'], { type: 'text/html' });
    vi.stubGlobal('fetch', makeFetchMock(200, htmlBlob));
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await openFile('/uploads/files/malicious.html', 'malicious.html');

    // Must NOT open inline — download anchor clicked instead
    expect(openSpy).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const appendCalls = (document.body.appendChild as ReturnType<typeof vi.fn>).mock.calls;
    const anchor = appendCalls[0]?.[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('malicious.html');
  });

  it('forces download for SVG MIME type', async () => {
    const svgBlob = new Blob(['<svg><script>alert(1)</script></svg>'], { type: 'image/svg+xml' });
    vi.stubGlobal('fetch', makeFetchMock(200, svgBlob));
    const openSpy = vi.spyOn(window, 'open').mockReturnValue({} as Window);
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await openFile('/uploads/files/malicious.svg');

    expect(openSpy).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to download in iOS PWA standalone mode (blob URL inaccessible to Safari)', async () => {
    vi.stubGlobal('fetch', makeFetchMock(200));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    // Simulate iOS PWA (Add-to-Home-Screen) context
    Object.defineProperty(navigator, 'standalone', { configurable: true, value: true });

    try {
      await openFile('/uploads/files/doc.pdf', 'doc.pdf');

      // Single anchor click — and it must be a DOWNLOAD anchor (no target=_blank),
      // because target="_blank" in iOS PWA would hand off to Safari which cannot
      // read the in-WebView blob URL.
      expect(clickSpy).toHaveBeenCalledTimes(1);
      const appendCalls = (document.body.appendChild as ReturnType<typeof vi.fn>).mock.calls;
      const anchor = appendCalls[0]?.[0] as HTMLAnchorElement;
      expect(anchor.target).toBe('');
      expect(anchor.download).toBe('doc.pdf');
    } finally {
      // Clean up the non-standard iOS-only property we forced above.
      delete (navigator as any).standalone;
    }
  });
});

describe('offline fallback (#1046)', () => {
  function setOnline(value: boolean) {
    Object.defineProperty(navigator, 'onLine', { value, configurable: true });
  }
  beforeEach(() => vi.mocked(getCachedBlob).mockReset());
  afterEach(() => setOnline(true));

  it('serves the cached blob without a network call when offline', async () => {
    setOnline(false);
    const blob = new Blob(['x'], { type: 'application/pdf' });
    vi.mocked(getCachedBlob).mockResolvedValue(blob);
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadFile('/uploads/files/cached.pdf');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(getCachedBlob).toHaveBeenCalledWith('/uploads/files/cached.pdf');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('falls back to the cache when a live fetch rejects (network error) while online', async () => {
    setOnline(true);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const blob = new Blob(['x'], { type: 'application/pdf' });
    vi.mocked(getCachedBlob).mockResolvedValue(blob);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadFile('/uploads/files/cached.pdf');

    expect(getCachedBlob).toHaveBeenCalledWith('/uploads/files/cached.pdf');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('throws when offline and the file was never cached', async () => {
    setOnline(false);
    vi.mocked(getCachedBlob).mockResolvedValue(null);
    await expect(downloadFile('/uploads/files/missing.pdf')).rejects.toThrow(/offline/i);
  });

  it('does not consult the cache on an HTTP error — a 401 still surfaces', async () => {
    setOnline(true);
    vi.stubGlobal('fetch', makeFetchMock(401));
    await expect(downloadFile('/uploads/files/secret.pdf')).rejects.toThrow('Unauthorized');
    expect(getCachedBlob).not.toHaveBeenCalled();
  });
});

describe('stalled connection with a stored copy (#3066)', () => {
  const stored = new Blob(['stored'], { type: 'application/pdf' });

  // A promise that never settles on its own and rejects like fetch once the
  // signal aborts, which is what a stalled link looks like to the page.
  function stallUntilAbort<T>(signal: AbortSignal | undefined): Promise<T> {
    return new Promise<T>((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    });
  }

  function track<T>(promise: Promise<T>) {
    const state = { done: false };
    const finish = () => {
      state.done = true;
    };
    promise.then(finish, finish);
    return state;
  }

  beforeEach(() => {
    vi.mocked(getCachedBlob).mockReset();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  it('serves the stored copy once a stalled request has run past the wait', async () => {
    vi.mocked(getCachedBlob).mockResolvedValue(stored);
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return stallUntilAbort<Response>(signal);
      })
    );

    const pending = downloadFile('/uploads/files/stalled.pdf');
    const state = track(pending);
    await vi.advanceTimersByTimeAsync(4999);
    expect(state.done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await pending;

    expect(URL.createObjectURL).toHaveBeenCalledWith(stored);
    expect(signal?.aborted).toBe(true);
  });

  it('serves the stored copy when the body stalls mid download', async () => {
    vi.mocked(getCachedBlob).mockResolvedValue(stored);
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return Promise.resolve({ ok: true, status: 200, blob: () => stallUntilAbort<Blob>(signal) });
      })
    );

    const pending = openFile('/uploads/files/half.pdf');
    await vi.advanceTimersByTimeAsync(5000);
    await pending;

    expect(URL.createObjectURL).toHaveBeenCalledWith(stored);
    expect(signal?.aborted).toBe(true);
  });

  it('still surfaces an HTTP error over the stored copy', async () => {
    vi.mocked(getCachedBlob).mockResolvedValue(stored);
    vi.stubGlobal('fetch', makeFetchMock(403));

    await expect(downloadFile('/uploads/files/forbidden.pdf')).rejects.toThrow('HTTP 403');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('serves the stored copy when the connection breaks while the body arrives', async () => {
    vi.mocked(getCachedBlob).mockResolvedValue(stored);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.reject(new TypeError('network')) })
    );

    await openFile('/uploads/files/broken.pdf');

    expect(URL.createObjectURL).toHaveBeenCalledWith(stored);
  });

  it('surfaces a broken body read when nothing is stored', async () => {
    vi.mocked(getCachedBlob).mockResolvedValue(null);
    const broken = new TypeError('network');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, blob: () => Promise.reject(broken) }));

    await expect(openFile('/uploads/files/broken.pdf')).rejects.toBe(broken);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('keeps waiting on the live download when nothing is stored', async () => {
    vi.mocked(getCachedBlob).mockResolvedValue(null);
    const live = new Blob(['live'], { type: 'application/pdf' });
    let answer: ((resp: unknown) => void) | undefined;
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined;
        return new Promise((resolve) => {
          answer = resolve;
        });
      })
    );

    const pending = downloadFile('/uploads/files/slow.pdf');
    const state = track(pending);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(state.done).toBe(false);
    expect(signal?.aborted).toBe(false);

    answer?.({ ok: true, status: 200, blob: () => Promise.resolve(live) });
    await pending;
    expect(URL.createObjectURL).toHaveBeenCalledWith(live);
  });
});
