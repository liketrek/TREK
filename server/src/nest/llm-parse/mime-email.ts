/**
 * Minimal MIME reader for uploaded `.eml` files.
 *
 * A real mail keeps its body inside multipart containers and encodes it as
 * base64 or quoted-printable, so the raw bytes carry no readable booking data —
 * reading the file as text yields the plaintext headers plus an encoded blob.
 * Only the body parts matter for the LLM prompt, so the part tree is walked
 * here instead of pulling in a full mail-parser dependency: unfold headers,
 * split on the boundary, decode transfer encoding, then the charset.
 * Attachments are skipped.
 */

/** Guards against a hand-crafted mail nesting multiparts without end. */
const MAX_DEPTH = 10;

type Headers = Map<string, string>;

interface MessagePart {
  headers: Headers;
  body: string;
}

interface ContentType {
  type: string;
  params: Record<string, string>;
}

export interface ParsedMail {
  /** Decoded `text/html` body part, `null` when the mail has none. */
  html: string | null;
  /** Decoded `text/plain` body part, `null` when the mail has none. */
  text: string | null;
  /** `From`/`To`/`Subject`/`Date` as decoded `Name: value` lines. */
  headerLines: string[];
}

/** Header names that mark a buffer as an actual mail rather than a stray text file. */
const MAIL_HEADERS = [
  'from',
  'to',
  'subject',
  'date',
  'message-id',
  'received',
  'mime-version',
  'return-path',
  'delivered-to',
];

/** Headers worth keeping in the prompt — a booking reference often lives in the subject. */
const SUMMARY_HEADERS: [string, string][] = [
  ['from', 'From'],
  ['to', 'To'],
  ['subject', 'Subject'],
  ['date', 'Date'],
];

/**
 * Parse a `.eml` buffer into its decoded text bodies.
 * Returns `null` when the buffer is not a mail, so callers can fall back to
 * their previous handling instead of losing content.
 */
export function parseEmail(buffer: Buffer): ParsedMail | null {
  // latin1 keeps one char per byte, so the structure can be walked as a string
  // while every part is still re-encodable byte-exact for its own charset.
  const raw = buffer.toString('latin1').replace(/^\u00ef\u00bb\u00bf/, '');
  const message = splitMessage(raw);
  if (!looksLikeMail(raw, message.headers)) return null;

  const bodies: { html: string | null; text: string | null } = { html: null, text: null };
  walkPart(message, bodies, 0);

  return {
    html: bodies.html,
    text: bodies.text,
    headerLines: summarizeHeaders(message.headers),
  };
}

/**
 * A mail opens with a header field and names at least one of the usual
 * envelope headers; a bare HTML or text file saved as `.eml` does neither and
 * is better served by the caller's raw handling.
 */
function looksLikeMail(raw: string, headers: Headers): boolean {
  return /^[!-9;-~]+:/.test(raw) && MAIL_HEADERS.some(name => headers.has(name));
}

function summarizeHeaders(headers: Headers): string[] {
  const lines: string[] = [];
  for (const [name, label] of SUMMARY_HEADERS) {
    const value = headers.get(name);
    if (value) lines.push(`${label}: ${decodeEncodedWords(value)}`);
  }
  return lines;
}

/** Collect the first `text/html` and `text/plain` body across the part tree. */
function walkPart(part: MessagePart, bodies: { html: string | null; text: string | null }, depth: number): void {
  if (depth > MAX_DEPTH) return;
  const contentType = parseContentType(part.headers.get('content-type'));
  const type = contentType.type || 'text/plain';

  if (type.startsWith('multipart/')) {
    const boundary = contentType.params.boundary;
    if (!boundary) return;
    for (const raw of splitParts(part.body, boundary)) {
      walkPart(splitMessage(raw), bodies, depth + 1);
    }
    return;
  }

  // A forwarded confirmation arrives as an embedded message — walk into it.
  if (type === 'message/rfc822') {
    walkPart(splitMessage(decodeToBuffer(part).toString('latin1')), bodies, depth + 1);
    return;
  }

  if (isAttachment(part.headers)) return;
  if (type === 'text/html') {
    if (bodies.html === null) bodies.html = decodePartText(part, contentType);
  } else if (type === 'text/plain') {
    if (bodies.text === null) bodies.text = decodePartText(part, contentType);
  }
}

function isAttachment(headers: Headers): boolean {
  return parseContentType(headers.get('content-disposition')).type === 'attachment';
}

/** Split a message (or a part) into its unfolded headers and its still-encoded body. */
function splitMessage(raw: string): MessagePart {
  const separator = /\r?\n\r?\n/.exec(raw);
  const headerBlock = separator ? raw.slice(0, separator.index) : raw;
  const body = separator ? raw.slice(separator.index + separator[0].length) : '';
  return { headers: parseHeaders(headerBlock), body };
}

function parseHeaders(block: string): Headers {
  const headers: Headers = new Map();
  let current = '';
  const commit = () => {
    const colon = current.indexOf(':');
    // Keep the first occurrence: a re-sent mail can carry a header twice.
    if (colon > 0) {
      const name = current.slice(0, colon).trim().toLowerCase();
      if (!headers.has(name)) headers.set(name, current.slice(colon + 1).trim());
    }
    current = '';
  };
  for (const line of block.split(/\r?\n/)) {
    // A leading space or tab continues the previous header (RFC 5322 folding).
    if (/^[ \t]/.test(line) && current) current += ' ' + line.trim();
    else {
      commit();
      current = line;
    }
  }
  commit();
  return headers;
}

function parseContentType(value: string | undefined): ContentType {
  const params: Record<string, string> = {};
  if (!value) return { type: '', params };
  const semicolon = value.indexOf(';');
  const type = (semicolon < 0 ? value : value.slice(0, semicolon)).trim().toLowerCase();
  const param = /;\s*([\w-]+)\s*=\s*(?:"([^"]*)"|([^;]*))/g;
  let match: RegExpExecArray | null;
  while ((match = param.exec(value)) !== null) {
    params[match[1].toLowerCase()] = (match[2] ?? match[3] ?? '').trim();
  }
  return { type, params };
}

/**
 * Cut a multipart body at its `--boundary` delimiters. The CRLF in front of a
 * delimiter belongs to it, so it is matched (not captured) and stripped from
 * the part that follows.
 */
function splitParts(body: string, boundary: string): string[] {
  const delimiter = new RegExp(`(?:\\r?\\n|^)--${escapeRegExp(boundary)}(--)?[ \\t]*(?=\\r?\\n|$)`, 'g');
  const parts: string[] = [];
  let start = -1;
  let match: RegExpExecArray | null;
  while ((match = delimiter.exec(body)) !== null) {
    if (start >= 0) parts.push(body.slice(start, match.index).replace(/^\r?\n/, ''));
    if (match[1]) break; // closing delimiter
    start = delimiter.lastIndex;
  }
  return parts;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Undo the transfer encoding of a part, yielding its raw bytes. */
function decodeToBuffer(part: MessagePart): Buffer {
  const encoding = (part.headers.get('content-transfer-encoding') ?? '').trim().toLowerCase();
  if (encoding === 'base64') return decodeBase64(part.body);
  if (encoding === 'quoted-printable') return decodeQuotedPrintable(part.body);
  return Buffer.from(part.body, 'latin1');
}

function decodePartText(part: MessagePart, contentType: ContentType): string {
  return decodeCharset(decodeToBuffer(part), contentType.params.charset).replace(/\r\n?/g, '\n');
}

function decodeBase64(payload: string): Buffer {
  return Buffer.from(payload.replace(/[^A-Za-z0-9+/=]/g, ''), 'base64');
}

function decodeQuotedPrintable(payload: string): Buffer {
  const joined = payload.replace(/=\r?\n/g, ''); // soft line breaks
  const out = Buffer.allocUnsafe(joined.length);
  let len = 0;
  for (let i = 0; i < joined.length; i++) {
    const hex = joined[i] === '=' ? joined.slice(i + 1, i + 3) : '';
    if (/^[0-9a-fA-F]{2}$/.test(hex)) {
      out[len++] = Number.parseInt(hex, 16);
      i += 2;
    } else {
      out[len++] = joined.codePointAt(i) & 0xff;
    }
  }
  return out.subarray(0, len);
}

function decodeCharset(bytes: Buffer, charset: string | undefined): string {
  const label = (charset ?? '').trim().toLowerCase().replace(/^["']|["']$/g, '');
  if (!label || label === 'utf-8' || label === 'utf8' || label === 'us-ascii' || label === 'ascii') {
    return bytes.toString('utf8');
  }
  try {
    return new TextDecoder(label).decode(bytes);
  } catch {
    // Unknown label — utf8 is still the best guess for modern mail.
    return bytes.toString('utf8');
  }
}

/** Resolve RFC 2047 encoded-words (`=?utf-8?B?…?=`), as used in subject lines. */
function decodeEncodedWords(value: string): string {
  return value
    .replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (whole, charset: string, encoding: string, payload: string) => {
      const bytes =
        encoding.toUpperCase() === 'B' ? decodeBase64(payload) : decodeQuotedPrintable(payload.replaceAll('_', ' '));
      const decoded = decodeCharset(bytes, charset);
      return decoded || whole;
    })
    .replace(/\s+/g, ' ')
    .trim();
}
