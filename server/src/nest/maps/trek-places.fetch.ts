import { getAppUrl } from '../../app-config';
import { serviceIdentitySlot } from '../service-identity/service-identity.interface';

/**
 * A request carrying who is asking: the instance token, and the installation
 * key where it may go. A refused key costs no answer: the request goes once
 * more without it, through the shared pool, while the identity counts the refusal.
 */
export async function identifiedFetch(
  url: URL,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<Response> {
  const identity = serviceIdentitySlot.get();
  const own = identity.headersFor(url);
  const base = { ...headers, 'X-TREK-Instance': instanceToken() };
  const res = await fetch(url, { signal, headers: { ...base, ...own } });
  identity.observe(url, res);
  if (res.status !== 401 || !own.Authorization) return res;
  await res.body?.cancel();
  return fetch(url, { signal, headers: { ...base, ...withoutKey(own) } });
}

function withoutKey(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).filter(([name]) => name !== 'Authorization'));
}

/**
 * One opaque string per instance, so the service can rate-limit per caller
 * instead of per IP. Derived from the instance URL rather than generated and
 * stored: it must be stable across restarts, and it must not be anything that
 * identifies a person. It is never resolved back to anything on the far side.
 */
function instanceToken(): string {
  // getAppUrl(), not the raw APP_URL. The variable is commented out in the
  // shipped compose file, so reading it raw gave every default install the same
  // string — and a token every caller shares is not a caller. One install
  // running a large import would then rate-limit all the others, who would fall
  // back to Nominatim with nothing to point at. The resolver falls through to
  // ALLOWED_ORIGINS and then to the port, so an unconfigured instance still
  // differs from its neighbours.
  const url = getAppUrl();
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return `trek-${(hash >>> 0).toString(36)}`;
}
