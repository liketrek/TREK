import JSON5 from 'json5';

/**
 * Parse LLM output that is *meant* to be JSON but may not be strict JSON.
 *
 * Cloud providers reached through the OpenAI-compatible endpoint don't all honour
 * `response_format` faithfully — Gemini in particular emits JavaScript-object-literal
 * text: single-quoted strings, unquoted keys, and trailing commas (#1638), e.g.
 *
 *   [ { '@type': 'LodgingReservation', checkinTime: '2026-08-28T00:00:00', price: 146.25, } ]
 *
 * Strict `JSON.parse` throws on all three, so the reservation list came back empty and
 * the UI showed nothing. We try strict JSON first (the common, cheapest path) and fall
 * back to JSON5, which accepts exactly that relaxed superset. Returns `null` on failure.
 *
 * The leading/trailing code-fence strip stays here because some models still wrap the
 * payload in a ```json fence even when asked for raw JSON.
 */
export function parseLenientJson(content: string | undefined | null): unknown {
  if (!content) return null;
  const stripped = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    try {
      return JSON5.parse(stripped);
    } catch {
      return null;
    }
  }
}

/**
 * Whatever a provider handed back, as a list of reservation nodes.
 *
 * The extraction tool declares `reservations` as an array and the call forces
 * that tool, so the answer should already be one. It is not always. Anthropic
 * sometimes serialises its tool input as a JSON-encoded string instead (#1968),
 * in either of two shapes seen in the wild:
 *
 *   "[{\"@type\":\"LodgingReservation\", …}]"      a stringified array
 *   "{\"reservations\":[{…}]}"                      stringified and re-wrapped
 *
 * Whether it happens is up to how the model serialises that particular call, so
 * the same document imported fine one minute and came back empty the next —
 * indistinguishable, to the person waiting, from a document with no booking in
 * it. Nothing was logged, because nothing had failed: the value simply was not
 * an array, and the check that only accepted arrays dropped a good extraction.
 *
 * One unwrap of a string, not a loop: a value that is still not a list after
 * that is genuinely not one, and guessing further would start inventing
 * bookings out of prose.
 */
export function toReservationList(value: unknown): Record<string, unknown>[] {
  const list = (v: unknown): Record<string, unknown>[] | null => {
    if (Array.isArray(v)) return v as Record<string, unknown>[];
    if (v && typeof v === 'object' && Array.isArray((v as { reservations?: unknown }).reservations)) {
      return (v as { reservations: Record<string, unknown>[] }).reservations;
    }
    return null;
  };

  const direct = list(value);
  if (direct) return direct;
  if (typeof value === 'string') return list(parseLenientJson(value)) ?? [];
  return [];
}
