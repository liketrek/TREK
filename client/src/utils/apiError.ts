/**
 * Pulls the server-provided error string out of an axios-style error so the UI can
 * surface the real reason (e.g. a Google Places API message such as "Places API (New)
 * has not been used in project … or it is disabled") instead of a generic fallback.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { error?: unknown } } })?.response?.data?.error
  return typeof message === 'string' && message.trim() ? message : fallback
}
