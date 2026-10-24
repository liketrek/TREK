/**
 * CW-06: a Google Maps short link followed for the city walk import, and
 * nothing else.
 *
 * This is deliberately not the general follower (`safeFetchFollow`). That one
 * goes wherever a redirect points as long as the address is public; this one
 * checks every hop against the short-link allow-list before anything is
 * resolved or asked, and runs the SSRF guard in its strict form, so
 * ALLOW_INTERNAL_NETWORK and ALLOW_LINK_LOCAL_IPS do not open it. Each request
 * goes out pinned to the addresses the guard vetted, follows nothing by
 * itself, reads no body and carries nothing of the caller's. The whole chain,
 * name lookups included, has one deadline and at most three hops, and a
 * Location header longer than a link can be is refused. Where the chain ends,
 * the long link has to be Google Maps itself; it is read, never fetched.
 */
import { discardBody } from '../../../utils/cappedFetch';
import { checkSsrf, createOutboundDispatcher } from '../../../utils/ssrfGuard';
import { logDebug } from '../../audit/audit-log.logger';
import { isGoogleMapsLongLink, isGoogleMapsShortLink } from '../../common/google-maps-hosts';
import type { ShortLinkOutcome } from '../place-import.types';
import { Injectable } from '@nestjs/common';

export interface ShortLinkLimits {
  /** Requests made at most, one per hop. */
  hops: number;
  /** One deadline over the whole chain, the name lookups included. */
  deadlineMs: number;
  /** The longest Location header taken; a longer one is no link. */
  locationChars: number;
}

export const SHORT_LINK_LIMITS: ShortLinkLimits = { hops: 3, deadlineMs: 8_000, locationChars: 8_192 };

/** Google's final answer that it has no such link (404), or no longer (410); asking again changes nothing. */
const NO_SUCH_LINK: ReadonlySet<number> = new Set([404, 410]);

/** What one hop answered: its status, and the Location of a 3xx or null. */
interface HopAnswer {
  status: number;
  location: string | null;
}

/** The lookup inside the SSRF guard cannot be aborted; this holds it to the chain's deadline as well. */
function beforeDeadline<T>(work: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }
    const stop = () => reject(signal.reason);
    signal.addEventListener('abort', stop, { once: true });
    void work.then(resolve, reject).finally(() => signal.removeEventListener('abort', stop));
  });
}

@Injectable()
export class GoogleMapsShortLinkProvider {
  /** Where a maps.app.goo.gl or goo.gl/maps link leads; nothing outside Google Maps is ever asked. */
  async resolve(raw: string, limits: ShortLinkLimits = SHORT_LINK_LIMITS): Promise<ShortLinkOutcome> {
    let start: URL;
    try {
      start = new URL(raw);
    } catch {
      return { ok: false, why: 'refused' };
    }
    const signal = AbortSignal.timeout(limits.deadlineMs);
    try {
      return await this.hop(start, 0, signal, limits);
    } catch (err: unknown) {
      // A deadline passed, a name lookup that hung, a connection that failed.
      logDebug(`[walk import] Google Maps short link not followed: ${err instanceof Error ? err.name : 'error'}`);
      return { ok: false, why: 'unreachable' };
    }
  }

  // Recursion rather than a loop: each hop waits for the one before it.
  private async hop(
    url: URL,
    fetched: number,
    signal: AbortSignal,
    limits: ShortLinkLimits,
  ): Promise<ShortLinkOutcome> {
    // Before any name lookup and before any request: only a short link is asked at all.
    if (!isGoogleMapsShortLink(url)) return { ok: false, why: 'refused' };
    if (fetched >= limits.hops) return { ok: false, why: 'too_many_redirects' };
    // Strict: a private address stays refused whatever ALLOW_INTERNAL_NETWORK says.
    const ssrf = await beforeDeadline(checkSsrf(url.href, true), signal);
    const addresses = ssrf.allowed ? (ssrf.resolvedIps ?? []) : [];
    // A name leading into this network is refused; one that does not resolve just now is Google's side, not the link's.
    if (addresses.length === 0) return { ok: false, why: ssrf.isPrivate ? 'refused' : 'unreachable' };
    const { status, location } = await this.answerOf(url, addresses, signal);
    if (NO_SUCH_LINK.has(status)) return { ok: false, why: 'not_found' };
    if (location === null) return { ok: false, why: 'no_redirect' };
    if (location.length > limits.locationChars) return { ok: false, why: 'unreachable' };
    let next: URL;
    try {
      next = new URL(location, url);
    } catch {
      return { ok: false, why: 'refused' };
    }
    if (isGoogleMapsShortLink(next)) return this.hop(next, fetched + 1, signal, limits);
    // The long link is read by the caller and never fetched here.
    return isGoogleMapsLongLink(next) ? { ok: true, url: next.href } : { ok: false, why: 'refused' };
  }

  /** One request through the pinned dispatcher, nothing followed and no body read. */
  private async answerOf(url: URL, addresses: string[], signal: AbortSignal): Promise<HopAnswer> {
    const dispatcher = createOutboundDispatcher(url.href, addresses);
    // Nothing of the caller's goes along: no cookie, no authorization, no referrer.
    // Node's fetch keeps no cookie jar, and credentials 'omit' says so for the record.
    const init: RequestInit = {
      method: 'GET',
      redirect: 'manual',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      headers: { accept: 'text/html' },
      signal,
    };
    try {
      // The pinned dispatcher is undici's own type, the init's that of Node's bundled copy;
      // Object.assign joins the two without casting either away.
      const response = await fetch(url.href, Object.assign(init, { dispatcher }));
      discardBody(response);
      const { status } = response;
      return { status, location: status >= 300 && status < 400 ? response.headers.get('location') : null };
    } finally {
      void dispatcher.close().catch((err: unknown) => logDebug(`[walk import] dispatcher not closed: ${String(err)}`));
    }
  }
}
