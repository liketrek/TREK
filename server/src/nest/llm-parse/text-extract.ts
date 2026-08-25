import { parseEmail } from './mime-email';
import { extname } from 'node:path';
import { PDFParse } from 'pdf-parse';

/** File extensions whose bytes are inherently text and can be decoded directly. */
const TEXT_LIKE = new Set(['.txt', '.html', '.htm', '.eml']);

export function isTextLike(fileName: string): boolean {
  return TEXT_LIKE.has(extname(fileName).toLowerCase());
}

export function isPdf(fileName: string): boolean {
  return extname(fileName).toLowerCase() === '.pdf';
}

/**
 * Entity names for U+00A0–U+00FF in code-point order. Booking mails are full of
 * this block: umlauts, currency signs, the degree sign.
 */
const LATIN1_ENTITIES = (
  'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr ' +
  'deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest ' +
  'Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ' +
  'ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig ' +
  'agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml ' +
  'eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml'
).split(' ');

/** Named entities a mail body realistically carries, resolved to their character. */
const HTML_ENTITIES = new Map<string, string>([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['ndash', '–'],
  ['mdash', '—'],
  ['hellip', '…'],
  ['lsquo', '‘'],
  ['rsquo', '’'],
  ['sbquo', '‚'],
  ['ldquo', '“'],
  ['rdquo', '”'],
  ['bdquo', '„'],
  ['bull', '•'],
  ['dagger', '†'],
  ['Dagger', '‡'],
  ['permil', '‰'],
  ['lsaquo', '‹'],
  ['rsaquo', '›'],
  ['trade', '™'],
  ['euro', '€'],
  ['minus', '−'],
  ['ne', '≠'],
  ['le', '≤'],
  ['ge', '≥'],
  ['larr', '←'],
  ['rarr', '→'],
  ['harr', '↔'],
  ...LATIN1_ENTITIES.map((name, i): [string, string] => [name, String.fromCharCode(0xa0 + i)]),
]);

function entityCodePoint(code: number): string | null {
  // Surrogate halves and out-of-range values would throw or produce garbage.
  if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return null;
  if (code >= 0xd800 && code <= 0xdfff) return null;
  return String.fromCodePoint(code);
}

/**
 * Resolve HTML entities so the model sees "Zimmer für zwei – 120,00 €" instead
 * of the escaped source. Numeric references come in decimal (`&#88;`) and hex
 * (`&#x58;`) form; an unknown name is left as written rather than dropped.
 */
function decodeEntities(s: string): string {
  if (!s.includes('&')) return s;
  return s.replace(/&(#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[A-Za-z][A-Za-z0-9]{1,30});/g, (whole, ref: string) => {
    if (ref[0] === '#') {
      const hex = ref[1] === 'x' || ref[1] === 'X';
      return entityCodePoint(Number.parseInt(hex ? ref.slice(2) : ref.slice(1), hex ? 16 : 10)) ?? whole;
    }
    // Case matters (&Uuml; vs &uuml;); only fall back to lower case for names
    // that are shouted in old templates.
    return HTML_ENTITIES.get(ref) ?? HTML_ENTITIES.get(ref.toLowerCase()) ?? whole;
  });
}

/** Strip HTML/XML tags, resolve entities and collapse whitespace for a cleaner LLM prompt. */
function stripMarkup(s: string): string {
  const withoutTags = s
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  // Entities come last so that a decoded `&lt;` cannot turn into a tag the
  // stripper would then eat.
  return decodeEntities(withoutTags)
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Whitespace cleanup for text that is already plain — no tags to strip out. */
function collapseWhitespace(s: string): string {
  return s
    .replace(/[ \t\u00a0]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Decode a `.eml` upload: walk the MIME tree, prefer the `text/html` body over
 * `text/plain`, and keep the interesting headers in front of it. Returns an
 * empty string when the buffer is not a MIME message or when the walk finds no
 * readable body, which leaves the caller on its raw-bytes path — the headers
 * alone would be a worse prompt than the undecoded file.
 */
function extractEmailText(buffer: Buffer): string {
  const mail = parseEmail(buffer);
  if (!mail) return '';
  // An empty html part must not shadow a filled text/plain alternative, so both
  // are cleaned up before one is picked.
  const html = mail.html !== null ? stripMarkup(mail.html) : '';
  const body = html || (mail.text !== null ? collapseWhitespace(mail.text) : '');
  if (!body) return '';
  return [mail.headerLines.join('\n'), body].filter(section => section.length > 0).join('\n\n');
}

/** Extract the embedded text layer from a PDF (empty for scanned/image-only PDFs). */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    // Space (not tab) between same-line items reads more naturally for the LLM.
    const res = await parser.getText({ cellSeparator: ' ' });
    return cleanPdfText(res.text ?? '');
  } finally {
    await parser.destroy?.();
  }
}

/**
 * Clean up pdf-parse output for the LLM:
 *  - strip `-- N of M --` page markers
 *  - normalize whitespace/tabs
 *  - collapse letter-spaced UPPERCASE runs ("A M S T E R D A M" → "AMSTERDAM"),
 *    a common PDF kerning artifact that otherwise hides booking fields
 */
function cleanPdfText(text: string): string {
  return text
    .replace(/^\s*-+\s*\d+\s+of\s+\d+\s*-+\s*$/gim, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\b(?:[A-Z] ){2,}[A-Z]\b/g, m => m.replace(/ /g, ''))
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract text from a booking file for the OpenAI-compatible/local LLM path
 * (Ollama can't ingest PDFs or `file` parts, so everything becomes text).
 *  - eml              → MIME-decoded body part (markup stripped)
 *  - txt/html/htm     → decoded (markup stripped)
 *  - pdf              → embedded text layer via pdf-parse
 *  - anything else    → best-effort UTF-8 decode
 * A scanned/image-only PDF yields empty text — that case needs a vision provider
 * (Anthropic reads PDFs natively).
 */
export async function extractText(buffer: Buffer, fileName: string): Promise<string> {
  const ext = extname(fileName).toLowerCase();
  if (isPdf(fileName)) return extractPdfText(buffer);
  if (ext === '.eml') {
    // Real mail hides its body behind base64/quoted-printable, so decode the MIME
    // structure first; a file that isn't a message, or a message whose only content
    // sits in parts we don't read, falls through to the raw bytes.
    const mailText = extractEmailText(buffer);
    if (mailText) return mailText;
  }
  const raw = buffer.toString('utf8');
  if (ext === '.html' || ext === '.htm' || ext === '.eml') return stripMarkup(raw);
  return raw.trim();
}
