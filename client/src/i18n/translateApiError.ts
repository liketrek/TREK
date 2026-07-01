/**
 * Resolve a server error whose message may be an i18n key.
 *
 * The server can return a translation key as its error message (e.g.
 * `files.uploadErrorType`). `t()` returns the key unchanged when it isn't a
 * known translation, so `translated === key` reliably means "not a key" — in
 * that case we fall back to a generic, always-localized message.
 */
export function translateApiError(
  t: (key: string) => string,
  err: unknown,
  fallbackKey: string,
): string {
  const key = err instanceof Error ? err.message : ''
  const translated = t(key)
  return translated && translated !== key ? translated : t(fallbackKey)
}
