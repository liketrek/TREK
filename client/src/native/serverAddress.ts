/**
 * Turns what someone typed into the app's address field into a TREK server it
 * can load, or a reason it cannot.
 */

export type ProbeFailure = 'invalid' | 'unreachable' | 'notTrek' | 'tooOld'
export type ProbeResult =
  | { ok: true; url: string; reason?: undefined }
  | { ok: false; reason: ProbeFailure; url?: undefined }

export interface ProbeResponse {
  status: number
  data: unknown
  /** The URL after redirects. */
  url: string
}
export type ProbeGet = (url: string) => Promise<ProbeResponse>

const FEATURES_PATH = '/api/health/features'

function normalize(raw: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return null
  }
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || !parsed.hostname) return null
  return parsed.origin + parsed.pathname.replace(/\/+$/, '')
}

/**
 * Without a scheme, https comes first and plain http second: a server on the
 * home network is often reached as a bare IP and port without TLS.
 */
export function candidateUrls(input: string): string[] {
  const trimmed = input.trim()
  if (!trimmed) return []
  const candidates = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? [normalize(trimmed)]
    : [normalize(`https://${trimmed}`), normalize(`http://${trimmed}`)]
  return candidates.filter((url): url is string => url !== null)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function judge(response: ProbeResponse): ProbeResult {
  if (response.status !== 200 || !isRecord(response.data)) return { ok: false, reason: 'notTrek' }
  if (response.data.nativeApp === true) {
    // Follow a redirect (http to https, a canonical host) so the app loads the
    // address the server actually answers on.
    const base = response.url.endsWith(FEATURES_PATH) ? response.url.slice(0, -FEATURES_PATH.length) : null
    return { ok: true, url: (base && normalize(base)) || '' }
  }
  return 'bookingImport' in response.data ? { ok: false, reason: 'tooOld' } : { ok: false, reason: 'notTrek' }
}

const FAILURE_RANK: Record<ProbeFailure, number> = { invalid: 0, unreachable: 1, notTrek: 2, tooOld: 3 }

export async function probeServer(input: string, get: ProbeGet): Promise<ProbeResult> {
  const candidates = candidateUrls(input)
  if (!candidates.length) return { ok: false, reason: 'invalid' }

  let failure: ProbeFailure = 'unreachable'
  for (const candidate of candidates) {
    let verdict: ProbeResult
    try {
      verdict = judge(await get(candidate + FEATURES_PATH))
    } catch {
      continue
    }
    if (verdict.ok) return { ok: true, url: verdict.url || candidate }
    if (FAILURE_RANK[verdict.reason] > FAILURE_RANK[failure]) failure = verdict.reason
  }
  return { ok: false, reason: failure }
}
