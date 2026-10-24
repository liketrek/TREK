/**
 * How much extracted text a cloud model is sent. A confirmation keeps its total
 * and payment block near the end, and 4,000 characters cut both off a long email
 * without a word (#2652). 24,000 characters are about 6,000 input tokens, far
 * under the context of any current cloud model, and cost roughly one or two cents
 * per import on a mid-tier model, a fraction of a cent on a small one.
 */
export const CLOUD_TEXT_WINDOW = 24_000;

/**
 * A local model reads on the CPU, where every character costs prompt-eval time. A
 * flight itinerary lists its legs throughout a long document, so it keeps a
 * generous window; a single booking has the essentials up top (an 11-page rental
 * voucher took ~200s at 16k, its booking data sat in the first ~2k).
 */
export const LOCAL_FLIGHT_TEXT_WINDOW = 16_000;
export const LOCAL_TEXT_WINDOW = 6_000;

/**
 * The second try for a server that refused the cloud window for its context
 * length: a self-hosted vLLM or llama.cpp with 8k tokens takes this together
 * with the prompt, the schema and the answer (#2652).
 */
export const COMPACT_TEXT_WINDOW = 8_000;

/** Share of a window kept from the start; the rest comes from the end. */
const HEAD_SHARE = 0.75;

/** How far a cut may move to land on a line break instead of inside a line. */
const LINE_SNAP = 200;

/**
 * The text cut to `window` characters, keeping the start and the end. The legs
 * and names sit up top, the total and the payment summary at the bottom, so the
 * middle is what goes. The cuts land on line breaks where one is close, so an
 * amount is never split in half, and a marker says how much is missing.
 * `omitted` is 0 when the text fit.
 */
export function fitTextWindow(text: string, window: number): { text: string; omitted: number } {
  if (text.length <= window) return { text, omitted: 0 };
  let headEnd = Math.floor(window * HEAD_SHARE);
  let tailStart = text.length - (window - headEnd);
  const lineBefore = text.lastIndexOf('\n', headEnd);
  if (lineBefore > 0 && lineBefore > headEnd - LINE_SNAP) headEnd = lineBefore;
  const lineAfter = text.indexOf('\n', tailStart - 1);
  if (lineAfter !== -1 && lineAfter < tailStart + LINE_SNAP) tailStart = lineAfter + 1;
  const omitted = tailStart - headEnd;
  return {
    text: `${text.slice(0, headEnd)}\n[... ${omitted} characters omitted ...]\n${text.slice(tailStart)}`,
    omitted,
  };
}
