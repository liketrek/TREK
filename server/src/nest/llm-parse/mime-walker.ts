import {
  type ContentType,
  decodeEncodedWords,
  decodePartText,
  decodeToBuffer,
  type Headers,
  isAttachment,
  looksLikeMail,
  MAX_DEPTH,
  type MessagePart,
  parseContentType,
  splitMessage,
  splitParts,
} from './mime-email';
import { collapseWhitespace, stripMarkup } from './text-extract';
import type { MailAttachmentKind } from '@trek/shared';

/**
 * The mail import's reading of a forwarded booking mail: the readable body,
 * the envelope apart from it, and the attachments a booking travels in.
 *
 * A mail is hostile input. Nothing here renders HTML or follows a link: the
 * markup is stripped to text, an `<img src>` or a remote stylesheet stays a
 * string that is never fetched, and only attachments whose bytes are what
 * their type claims are kept. The body leaves out From, To, Cc and every
 * forwarding header block, so what goes on to a model carries the booking
 * and not the addresses of the people who passed it on.
 */

interface MailAttachment {
  /** The name the sender gave it, without any path, or one made up from its kind. */
  fileName: string;
  kind: MailAttachmentKind;
  mimeType: string;
  data: Buffer;
}

/** The headers the import routes and filters a mail by, decoded; null where the mail has none. */
interface MailEnvelope {
  from: string | null;
  to: string | null;
  cc: string | null;
  subject: string | null;
  date: string | null;
  messageId: string | null;
  deliveredTo: string | null;
  xOriginalTo: string | null;
  listUnsubscribe: string | null;
  precedence: string | null;
  autoSubmitted: string | null;
  /** The receiving server's verdict: the first header is the one it added last, on top. */
  authenticationResults: string | null;
}

export interface WalkedMail {
  envelope: MailEnvelope;
  /** The subject without the `Fwd:`/`WG:`/`Re:` prefixes forwarding adds. */
  subject: string | null;
  /** The readable text of the mail and every message forwarded in it, headers and quote marks removed. */
  body: string;
  attachments: MailAttachment[];
  /** Attachments of a kept kind that were left out: over the count or size limit, or not what they claimed. */
  skippedAttachments: number;
  /** How many forwarding layers were unwrapped, embedded or quoted. */
  forwardLayers: number;
}

/** At most this many attachments are kept, in the order the mail carries them. */
export const MAX_MAIL_ATTACHMENTS = 5;
/** A single attachment past this size is left out. */
export const MAX_MAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024;
/** Forwarding layers unwrapped inside the text; deeper ones stay as they are. */
const MAX_FORWARD_DEPTH = 10;
/** A file name is cut here; the kind, not the name, decides how the file is read. */
const MAX_FILE_NAME = 120;

const ENVELOPE_HEADERS: [keyof MailEnvelope, string][] = [
  ['from', 'from'],
  ['to', 'to'],
  ['cc', 'cc'],
  ['subject', 'subject'],
  ['date', 'date'],
  ['messageId', 'message-id'],
  ['deliveredTo', 'delivered-to'],
  ['xOriginalTo', 'x-original-to'],
  ['listUnsubscribe', 'list-unsubscribe'],
  ['precedence', 'precedence'],
  ['autoSubmitted', 'auto-submitted'],
  ['authenticationResults', 'authentication-results'],
];

/** The kind a part declares, by its media type or else its file extension. */
const KIND_BY_TYPE: Record<string, MailAttachmentKind> = {
  'application/pdf': 'pdf',
  'application/vnd.apple.pkpass': 'pkpass',
  'text/calendar': 'ics',
  'application/ics': 'ics',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const KIND_BY_EXTENSION: Record<string, MailAttachmentKind> = {
  pdf: 'pdf',
  pkpass: 'pkpass',
  ics: 'ics',
  jpg: 'jpeg',
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
};
const MIME_BY_KIND: Record<MailAttachmentKind, string> = {
  pdf: 'application/pdf',
  pkpass: 'application/vnd.apple.pkpass',
  ics: 'text/calendar',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};
const EXTENSION_BY_KIND: Record<MailAttachmentKind, string> = {
  pdf: 'pdf',
  pkpass: 'pkpass',
  ics: 'ics',
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

/** One message in the tree: the outer mail, or one forwarded inside it as `message/rfc822`. */
interface Section {
  html: string | null;
  text: string | null;
}

interface WalkState {
  sections: Section[];
  attachments: MailAttachment[];
  skipped: number;
}

/**
 * Walk a raw mail. Returns null when the bytes are not a mail, so the caller
 * can refuse them instead of reading a stray file as one.
 */
export function walkMail(buffer: Buffer): WalkedMail | null {
  const raw = buffer.toString('latin1').replace(/^\u00ef\u00bb\u00bf/, '');
  const message = splitMessage(raw);
  if (!looksLikeMail(raw, message.headers)) return null;

  const outer: Section = { html: null, text: null };
  const state: WalkState = { sections: [outer], attachments: [], skipped: 0 };
  walkPart(message, state, outer, 0);

  let forwardLayers = state.sections.length - 1;
  const bodies: string[] = [];
  for (const section of state.sections) {
    const unwrapped = unwrapForwards(sectionText(section));
    forwardLayers += unwrapped.layers;
    if (unwrapped.text) bodies.push(unwrapped.text);
  }

  const envelope = readEnvelope(message.headers);
  return {
    envelope,
    subject: envelope.subject === null ? null : stripForwardPrefixes(envelope.subject),
    body: bodies.join('\n\n'),
    attachments: state.attachments,
    skippedAttachments: state.skipped,
    forwardLayers: Math.min(forwardLayers, MAX_FORWARD_DEPTH),
  };
}

function readEnvelope(headers: Headers): MailEnvelope {
  const envelope = {} as MailEnvelope;
  for (const [key, name] of ENVELOPE_HEADERS) {
    const value = headers.get(name);
    envelope[key] = value ? decodeEncodedWords(value) : null;
  }
  return envelope;
}

function walkPart(part: MessagePart, state: WalkState, section: Section, depth: number): void {
  if (depth > MAX_DEPTH) return;
  const contentType = parseContentType(part.headers.get('content-type'));
  const type = contentType.type || 'text/plain';

  if (type.startsWith('multipart/')) {
    const boundary = contentType.params.boundary;
    if (!boundary) return;
    for (const raw of splitParts(part.body, boundary)) walkPart(splitMessage(raw), state, section, depth + 1);
    return;
  }

  // A mail forwarded as an attachment is a message of its own: its text is a section of its own.
  if (type === 'message/rfc822') {
    const embedded: Section = { html: null, text: null };
    state.sections.push(embedded);
    walkPart(splitMessage(decodeToBuffer(part).toString('latin1')), state, embedded, depth + 1);
    return;
  }

  const kind = attachmentKind(part.headers, contentType);
  if (kind) {
    keepAttachment(part, contentType, kind, state);
    return;
  }
  if (isAttachment(part.headers)) return;
  if (type === 'text/html' && section.html === null) section.html = decodePartText(part, contentType);
  else if (type === 'text/plain' && section.text === null) section.text = decodePartText(part, contentType);
}

/** The name a part carries, from its disposition or, as older mailers put it, its content type. */
function partFileName(headers: Headers, contentType: ContentType): string {
  const disposition = parseContentType(headers.get('content-disposition'));
  const name = disposition.params.filename ?? contentType.params.name ?? '';
  return decodeEncodedWords(name);
}

/**
 * The kind of a part worth keeping, or null. An image referenced from the
 * HTML (a logo, a spacer) carries a Content-ID and no attachment disposition:
 * it belongs to the layout, not to the booking, and is left behind.
 */
function attachmentKind(headers: Headers, contentType: ContentType): MailAttachmentKind | null {
  const extension = partFileName(headers, contentType).split('.').pop()?.toLowerCase() ?? '';
  const kind = KIND_BY_TYPE[contentType.type] ?? KIND_BY_EXTENSION[extension] ?? null;
  if (!kind) return null;
  const image = kind === 'jpeg' || kind === 'png' || kind === 'webp';
  if (image && headers.has('content-id') && !isAttachment(headers)) return null;
  return kind;
}

function keepAttachment(part: MessagePart, contentType: ContentType, kind: MailAttachmentKind, state: WalkState): void {
  // Encoded, a part takes at most about twice its bytes (base64 with its line breaks
  // a third more): one longer than that is over the limit and is not decoded at all.
  const oversized = part.body.length > MAX_MAIL_ATTACHMENT_BYTES * 2;
  if (state.attachments.length >= MAX_MAIL_ATTACHMENTS || oversized) {
    state.skipped++;
    return;
  }
  const data = decodeToBuffer(part);
  if (data.length === 0 || data.length > MAX_MAIL_ATTACHMENT_BYTES || !hasSignature(kind, data)) {
    state.skipped++;
    return;
  }
  state.attachments.push({
    fileName: safeFileName(partFileName(part.headers, contentType), kind, state.attachments.length + 1),
    kind,
    mimeType: MIME_BY_KIND[kind],
    data,
  });
}

/** Whether the bytes are what the part claims: a renamed executable is not a PDF. */
function hasSignature(kind: MailAttachmentKind, data: Buffer): boolean {
  switch (kind) {
    case 'pdf':
      // The header may follow a little junk; readers look within the first kilobyte.
      return data.subarray(0, 1024).includes('%PDF-');
    case 'pkpass':
      return data.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    case 'png':
      return data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    case 'jpeg':
      return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
    case 'webp':
      return data.toString('latin1', 0, 4) === 'RIFF' && data.toString('latin1', 8, 12) === 'WEBP';
    case 'ics':
      return /BEGIN:VCALENDAR/i.test(data.subarray(0, 1024).toString('utf8'));
  }
}

/** The sender's file name without a path or control characters, or one made up from the kind. */
function safeFileName(name: string, kind: MailAttachmentKind, position: number): string {
  const base = [...(name.split(/[\\/]/).pop() ?? '')]
    .filter((char) => char >= ' ' && char !== '\u007f')
    .join('')
    .trim();
  const cut = base.slice(0, MAX_FILE_NAME);
  return cut && cut !== '.' && cut !== '..' ? cut : `attachment-${position}.${EXTENSION_BY_KIND[kind]}`;
}

/** Line breaks and block ends, so the header lines of a forwarded HTML mail stay lines without their tags. */
const HTML_LINE_BREAK = /<(?:br|hr)\b[^>]*>|<\/(?:p|div|tr|li|h[1-6]|blockquote|table)\s*>/gi;

/**
 * A section as text: its HTML stripped when it has a readable one, else its plain text.
 * Each line of the HTML is trimmed: a stripped tag leaves a space in front of a
 * line, which the forward unwrapping would read as a folded header continuation,
 * dropping the booking under a forwarded header block with it. HTML folds no headers.
 */
function sectionText(section: Section): string {
  const html =
    section.html === null
      ? ''
      : stripMarkup(section.html.replace(HTML_LINE_BREAK, '\n'))
          .split('\n')
          .map((line) => line.trim())
          .join('\n');
  return html || (section.text === null ? '' : collapseWhitespace(section.text));
}

/** `Fwd:`, `WG:`, `TR:`, `RV:`, `Re:` and their kin, as many as forwarding and replying stacked up. */
const SUBJECT_PREFIX = /^\s*(?:(?:fwd?|wg|tr|rv|enc|re|aw|sv|vs|doorst)\s*(?:\[\d+\]\s*)?:\s*)+/i;

function stripForwardPrefixes(subject: string): string {
  return subject.replace(SUBJECT_PREFIX, '').trim();
}

/** The words a mail client puts between dashes above a forwarded or quoted message, lower case. */
const FORWARD_MARKER_WORDS = [
  'forwarded message',
  'original message',
  'weitergeleitete nachricht',
  'urspr[üu]ngliche nachricht',
  'message transf[ée]r[ée]',
  "message d'origine",
  'mensaje reenviado',
  'mensaje original',
  'messaggio inoltrato',
  'messaggio originale',
  'doorgestuurd bericht',
  'oorspronkelijk bericht',
];
/** Apple Mail's intro line, which ends in a colon instead of dashes. */
const FORWARD_INTRO_WORDS = [
  'begin forwarded message',
  'anfang der weitergeleiteten nachricht',
  'd[ée]but du message r[ée]exp[ée]di[ée]',
];
/** The field names of a forwarded header block, in the languages the clients write them in. */
const SENDER_FIELDS = ['from', 'von', 'de', 'da', 'van'];
const OTHER_FIELDS = [
  'sent',
  'gesendet',
  'envoy[ée]',
  'enviado',
  'inviato',
  'verzonden',
  'date',
  'datum',
  'fecha',
  'data',
  'to',
  'an',
  '[àa]',
  'para',
  'aan',
  'cc',
  'bcc',
  'reply-to',
  'antwort an',
];
const SUBJECT_FIELDS = ['subject', 'betreff', 'objet', 'asunto', 'oggetto', 'onderwerp'];
/** A field line as clients write it, bold in a plain-text rendering of HTML included (`*From:*`). */
const fieldLine = (names: string[]) => new RegExp(String.raw`^\s*\*?(?:${names.join('|')})\*?\s*:`, 'i');

const FORWARD_MARKER = new RegExp(String.raw`^\s*[-_]{2,}\s*(?:${FORWARD_MARKER_WORDS.join('|')})\s*[-_]{2,}\s*$`, 'i');
const FORWARD_INTRO = new RegExp(String.raw`^\s*(?:${FORWARD_INTRO_WORDS.join('|')})\s*:\s*$`, 'i');
/** Outlook's rule above the header block of a forwarded message. */
const OUTLOOK_RULE = /^\s*_{10,}\s*$/;
/** "On 1 May, Ana wrote:", the line above a quoted reply, which names the sender. */
const ATTRIBUTION = /^\s*(?:on\s.+\swrote|am\s.+\sschrieb\s.+|le\s.+\sa\s[ée]crit)\s*:\s*$/i;
const HEADER_LINE = fieldLine([...SENDER_FIELDS, ...OTHER_FIELDS, ...SUBJECT_FIELDS]);
const FROM_LINE = fieldLine(SENDER_FIELDS);
const SUBJECT_LINE = fieldLine(SUBJECT_FIELDS);
/** A header block without a marker above it (Outlook) is believed from this many header lines on. */
const MIN_BARE_HEADER_BLOCK = 3;

/**
 * Remove what forwarding wraps around a message: the marker line, the header
 * block under it (who sent it to whom), the reply attribution, and the `>`
 * quoting some clients put in front of a forwarded text. Each pass unwraps one
 * layer, so a mail forwarded on and on comes back to the booking it started as.
 */
function unwrapForwards(text: string): { text: string; layers: number } {
  let lines = text.split('\n');
  let layers = 0;
  for (let pass = 0; pass < MAX_FORWARD_DEPTH; pass++) {
    const next = unwrapLayer(lines);
    if (!next.changed) break;
    layers++;
    lines = next.lines;
  }
  return { text: collapseWhitespace(lines.map((line) => line.trim()).join('\n')), layers };
}

function unwrapLayer(lines: string[]): { lines: string[]; changed: boolean } {
  const out: string[] = [];
  let changed = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const opensBlock =
      FORWARD_MARKER.test(line) ||
      FORWARD_INTRO.test(line) ||
      (OUTLOOK_RULE.test(line) && HEADER_LINE.test(lines[i + 1] ?? ''));
    if (opensBlock) {
      i = skipHeaderBlock(lines, i + 1);
      changed = true;
    } else if (isBareHeaderBlock(lines, i)) {
      i = skipHeaderBlock(lines, i);
      changed = true;
    } else if (ATTRIBUTION.test(line)) {
      i++;
      changed = true;
    } else if (/^\s*>/.test(line)) {
      out.push(line.replace(/^\s*>\s?/, ''));
      changed = true;
      i++;
    } else {
      out.push(line);
      i++;
    }
  }
  return { lines: out, changed };
}

/**
 * A header block with no marker above it, as Outlook forwards: a sender line
 * and at least two more header lines, one of them the subject. The subject is
 * what tells it from a booking's own lines: a French ticket reads
 * "De : Paris / À : Lyon / Date : 12/05" and must stay.
 */
function isBareHeaderBlock(lines: string[], start: number): boolean {
  if (!FROM_LINE.test(lines[start])) return false;
  let end = start;
  while (end < lines.length && HEADER_LINE.test(lines[end])) end++;
  return end - start >= MIN_BARE_HEADER_BLOCK && lines.slice(start, end).some((line) => SUBJECT_LINE.test(line));
}

/** The index after a header block starting at `start`: its header lines, their folded continuations, one blank line. */
function skipHeaderBlock(lines: string[], start: number): number {
  let i = start;
  while (i < lines.length && lines[i].trim() === '') i++;
  let inBlock = false;
  while (i < lines.length && (HEADER_LINE.test(lines[i]) || (inBlock && /^[ \t]+\S/.test(lines[i])))) {
    inBlock = true;
    i++;
  }
  if (i < lines.length && lines[i].trim() === '') i++;
  return i;
}
