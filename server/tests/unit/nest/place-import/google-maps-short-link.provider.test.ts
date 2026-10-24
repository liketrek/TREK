/**
 * GoogleMapsShortLinkProvider (CW-06, SHORT-*): a Google Maps short link
 * followed for the city walk import. The real SSRF guard and the real pinned
 * dispatcher run; only the resolver and the global fetch are stubbed, so every
 * case can say which names were looked up and which requests went out.
 */
import {
  GoogleMapsShortLinkProvider,
  SHORT_LINK_LIMITS,
} from '../../../../src/nest/place-import/providers/google-maps-short-link.provider';
import { PORTO_RIBEIRA } from '../../../fixtures/google-maps-walks';

import dns from 'dns/promises';
import { Agent } from 'undici';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('dns/promises', () => ({ default: { lookup: vi.fn() }, lookup: vi.fn() }));

const lookup = vi.mocked(dns.lookup);
const SHORT = 'https://maps.app.goo.gl/gwKHfs8TNxShEBBk7';
const PUBLIC_IP = '142.250.185.14';

/** Every name resolves to the address its entry gives, a public one otherwise. */
function resolveAs(addresses: Record<string, string> = {}) {
  lookup.mockImplementation((async (hostname: string) => [
    { address: addresses[hostname] ?? PUBLIC_IP, family: 4 },
  ]) as unknown as typeof dns.lookup);
}

function redirect(location: string, status = 302) {
  return new Response(null, { status, headers: { location } });
}

/** The answers in order, one per request. */
function answers(...responses: Array<Response | object>) {
  const fetchSpy = vi.fn();
  for (const response of responses) fetchSpy.mockResolvedValueOnce(response);
  vi.stubGlobal('fetch', fetchSpy);
  return fetchSpy;
}

const lookedUp = () => lookup.mock.calls.map((call) => call[0]);

/** The cases one after another, each settled before the next starts, as the stubs are set per case. */
function inTurn<T>(items: readonly T[], run: (item: T) => Promise<void>): Promise<void> {
  return items.reduce<Promise<void>>((previous, item) => previous.then(() => run(item)), Promise.resolve());
}
const provider = new GoogleMapsShortLinkProvider();

beforeEach(() => resolveAs());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  lookup.mockReset();
});

describe('GoogleMapsShortLinkProvider', () => {
  it('SHORT-001: one hop to a Google Maps route is the answer, and the route itself is never asked', async () => {
    const fetchSpy = answers(redirect(PORTO_RIBEIRA));
    expect(await provider.resolve(SHORT)).toEqual({ ok: true, url: PORTO_RIBEIRA });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0][0]).toBe(SHORT);
    expect(lookedUp()).toEqual(['maps.app.goo.gl']);
  });

  it('SHORT-002: a hop that leaves the allow-list is refused before it is looked up or asked', async () => {
    const locations = [
      'https://evil.example/maps/dir/A/B',
      'http://169.254.169.254/latest/meta-data/',
      'https://www.google.com.evil.io/maps/dir/A/B',
      'https://user:pw@www.google.com/maps/dir/A/B',
      'https://goo.gl/xyz',
    ];
    await inTurn(locations, async (location) => {
      lookup.mockClear();
      const fetchSpy = answers(redirect(location));
      expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'refused' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(lookedUp()).toEqual(['maps.app.goo.gl']);
    });
  });

  it('SHORT-003: a short link whose name leads into this network is refused at that hop', async () => {
    await inTurn(['127.0.0.1', '10.0.0.1', '169.254.169.254'], async (address) => {
      resolveAs({ 'goo.gl': address });
      const fetchSpy = answers(redirect('https://goo.gl/maps/next'));
      expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'refused' });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
    // The first hop itself, too.
    resolveAs({ 'maps.app.goo.gl': '192.168.1.5' });
    const fetchSpy = answers();
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'refused' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('SHORT-004: ALLOW_INTERNAL_NETWORK and ALLOW_LINK_LOCAL_IPS do not open it', async () => {
    vi.stubEnv('ALLOW_INTERNAL_NETWORK', 'true');
    vi.stubEnv('ALLOW_LINK_LOCAL_IPS', '169.254.1.2');
    vi.resetModules();
    const fresh = await import('../../../../src/nest/place-import/providers/google-maps-short-link.provider');
    const freshLookup = vi.mocked((await import('dns/promises')).default.lookup);
    const strict = new fresh.GoogleMapsShortLinkProvider();
    const fetchSpy = answers();
    await inTurn(['10.0.0.1', '169.254.1.2', 'fd00::1'], async (address) => {
      freshLookup.mockResolvedValue([{ address, family: address.includes(':') ? 6 : 4 }] as never);
      expect(await strict.resolve(SHORT)).toEqual({ ok: false, why: 'refused' });
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('SHORT-005: three hops at most', async () => {
    const fetchSpy = answers(
      redirect('https://maps.app.goo.gl/two'),
      redirect('https://maps.app.goo.gl/three'),
      redirect('https://maps.app.goo.gl/four'),
    );
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'too_many_redirects' });
    expect(fetchSpy).toHaveBeenCalledTimes(SHORT_LINK_LIMITS.hops);

    // Within the limit a short link may lead on to another one.
    answers(redirect('https://goo.gl/maps/next', 301), redirect(PORTO_RIBEIRA, 307));
    expect(await provider.resolve(SHORT)).toEqual({ ok: true, url: PORTO_RIBEIRA });
  });

  it('SHORT-006: one deadline over the whole chain, a name lookup that hangs included', async () => {
    const hanging = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    );
    vi.stubGlobal('fetch', hanging);
    expect(await provider.resolve(SHORT, { ...SHORT_LINK_LIMITS, deadlineMs: 20 })).toEqual({
      ok: false,
      why: 'unreachable',
    });
    expect(hanging).toHaveBeenCalledTimes(1);

    lookup.mockImplementation((() => new Promise(() => undefined)) as unknown as typeof dns.lookup);
    const fetchSpy = answers();
    expect(await provider.resolve(SHORT, { ...SHORT_LINK_LIMITS, deadlineMs: 20 })).toEqual({
      ok: false,
      why: 'unreachable',
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('SHORT-007: a hop that answers after the deadline is not followed further', async () => {
    resolveAs();
    const late = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve(redirect('https://maps.app.goo.gl/next')), 40)),
    );
    vi.stubGlobal('fetch', late);
    expect(await provider.resolve(SHORT, { ...SHORT_LINK_LIMITS, deadlineMs: 10 })).toEqual({
      ok: false,
      why: 'unreachable',
    });
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('SHORT-008: no body is read, and a Location longer than a link is refused', async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    const getReader = vi.fn();
    const huge = {
      status: 302,
      headers: new Headers({
        location: `https://www.google.com/maps/dir/${'A/'.repeat(SHORT_LINK_LIMITS.locationChars)}`,
        'content-length': String(10 ** 9),
      }),
      body: { cancel, getReader },
    };
    answers(huge);
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'unreachable' });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(getReader).not.toHaveBeenCalled();
  });

  it('SHORT-009: nothing of the caller goes along, and nothing is followed by fetch itself', async () => {
    const fetchSpy = answers(redirect(PORTO_RIBEIRA));
    await provider.resolve(SHORT);
    const init = fetchSpy.mock.calls[0][1] as RequestInit & { dispatcher?: unknown };
    expect(init).toMatchObject({
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.dispatcher).toBeDefined();
    const headers = new Headers(init.headers);
    expect(headers.has('cookie')).toBe(false);
    expect(headers.has('authorization')).toBe(false);
  });

  it('SHORT-010: an answer that is no redirect, and a redirect relative to the short host', async () => {
    answers(new Response('<html></html>', { status: 200 }));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'no_redirect' });
    // Busy or blocked just now is no answer about the link either.
    answers(new Response(null, { status: 503 }));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'no_redirect' });
    answers(new Response(null, { status: 429 }));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'no_redirect' });
    answers(redirect('/elsewhere'), redirect(PORTO_RIBEIRA));
    expect(await provider.resolve(SHORT)).toEqual({ ok: true, url: PORTO_RIBEIRA });
    // A 3xx without a Location leads nowhere.
    answers(new Response(null, { status: 302 }));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'no_redirect' });
  });

  it('SHORT-011: a start that is no short link, or no link, is refused without a request', async () => {
    const fetchSpy = answers();
    const answered = await Promise.all(
      ['not a link', 'https://www.google.com/maps/dir/A/B', 'https://bit.ly/abc'].map((raw) => provider.resolve(raw)),
    );
    expect(answered).toEqual(Array(3).fill({ ok: false, why: 'refused' }));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(lookup).not.toHaveBeenCalled();
  });

  it('SHORT-012: a Location that is no link at all is refused', async () => {
    answers(redirect('https://['));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'refused' });
  });

  it('SHORT-013: a request that fails is unreachable, and a dispatcher that will not close changes no answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue('socket hang up'));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'unreachable' });

    const close = vi.spyOn(Agent.prototype, 'close').mockRejectedValueOnce(new Error('busy') as never);
    answers(redirect(PORTO_RIBEIRA));
    expect(await provider.resolve(SHORT)).toEqual({ ok: true, url: PORTO_RIBEIRA });
    expect(close).toHaveBeenCalledTimes(1);
    close.mockRestore();
  });

  it('SHORT-014: a name that does not resolve just now is unreachable, not a link that leads elsewhere', async () => {
    const noAnswer = (code: string) => Object.assign(new Error(`getaddrinfo ${code}`), { code });
    await inTurn(['EAI_AGAIN', 'ENOTFOUND'], async (code) => {
      lookup.mockReset();
      lookup.mockRejectedValue(noAnswer(code));
      const fetchSpy = answers();
      expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'unreachable' });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
    // A later hop whose name does not resolve says the same.
    lookup.mockReset();
    lookup.mockResolvedValueOnce([{ address: PUBLIC_IP, family: 4 }] as never);
    lookup.mockRejectedValueOnce(noAnswer('EAI_AGAIN'));
    const fetchSpy = answers(redirect('https://goo.gl/maps/next'));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'unreachable' });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(lookedUp()).toEqual(['maps.app.goo.gl', 'goo.gl']);
  });

  it('SHORT-015: a short link Google does not know is not_found, at the first hop or a later one', async () => {
    await inTurn([404, 410], async (status) => {
      answers(new Response('not found', { status }));
      expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'not_found' });
    });
    const fetchSpy = answers(redirect('https://goo.gl/maps/next'), new Response(null, { status: 404 }));
    expect(await provider.resolve(SHORT)).toEqual({ ok: false, why: 'not_found' });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
