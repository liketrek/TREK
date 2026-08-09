/**
 * Parse a stored plugin config blob into a NULL-PROTOTYPE object.
 *
 * The prototype matters: a settings key of `__proto__` or `constructor` would otherwise
 * resolve off Object.prototype on read, so `config[key]` comes back truthy for a user who
 * has configured nothing — and a *required* field with such a name would report as
 * configured for everyone. The manifest now rejects those keys at install
 * (SETTING_KEY_RE); this makes it impossible regardless, including for a plugin that was
 * installed before that check existed.
 *
 * Its own file because both PluginsService (the admin view) and
 * PluginUserSettingsService (the host-side reads) parse the same blobs, and a second
 * copy of this is exactly the kind of thing that drifts.
 */
export function safeParseConfig(json: string): Record<string, unknown> {
  const empty = () => Object.create(null) as Record<string, unknown>;
  try {
    const parsed = JSON.parse(json || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return empty();
    const out = empty();
    // JSON.parse creates `__proto__` as an OWN property (it never invokes the setter), so
    // copy own keys across onto the null-prototype object rather than trusting the parse.
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) out[key] = value;
    return out;
  } catch {
    return empty();
  }
}
