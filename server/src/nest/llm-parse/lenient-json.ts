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
