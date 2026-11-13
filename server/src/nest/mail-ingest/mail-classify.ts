import type { WalkedMail } from '../llm-parse/mail-read.types';

/**
 * What a mail is before anything reads it for bookings: a forwarding
 * confirmation from Gmail or Outlook (its code is shown, nothing is clicked),
 * mail that is no booking (a newsletter, an automatic reply, an empty mail),
 * or a mail to read.
 */
type MailClass =
  | { kind: 'read' }
  | { kind: 'forwarding_confirmation'; code: string | null }
  | { kind: 'drop'; reason: 'newsletter' | 'auto_reply' | 'empty_mail' };

const FORWARDING_SENDERS = /forwarding-noreply@google\.com|@accountprotection\.microsoft\.com|@microsoft\.com/i;
const FORWARDING_SUBJECT =
  /(forwarding|weiterleitung|transfert|reenv[ií]o|inoltro|doorsturen).*(confirm|bestätig|verif|conferma|bevestig)/i;
const CODE_RE = /(?:code|código|codice|kód)\D{0,40}?(\d{6,10})\b/i;
const AUTO_REPLY_SUBJECT =
  /^(automatic reply|auto(matische)? ?(reply|antwort)|out of (the )?office|abwesenheit|r[ée]ponse automatique|risposta automatica|respuesta autom[áa]tica)/i;
/**
 * What makes a list mail worth reading anyway. An automatic forward keeps the
 * original headers, and a booking confirmation often carries List-Unsubscribe
 * just like a newsletter; an attachment or a booking word keeps it in.
 */
const BOOKING_WORDS =
  /\b(booking|reservation|confirmation|itinerary|e-?ticket|boarding|check-in|pnr|buchung|reservierung|bestätigung|réservation|reserva|prenotazione|boeking|rezerwacja)\b/i;
/** Less body than this, and no attachment, is an empty mail. */
const EMPTY_BODY_CHARS = 20;

export function classifyMail(mail: WalkedMail): MailClass {
  const { envelope } = mail;
  const subject = mail.subject ?? '';
  const fromProvider = FORWARDING_SENDERS.test(envelope.from ?? '') && CODE_RE.test(mail.body);
  if (FORWARDING_SUBJECT.test(subject) || fromProvider) {
    return { kind: 'forwarding_confirmation', code: CODE_RE.exec(mail.body)?.[1] ?? null };
  }
  const autoSubmitted = (envelope.autoSubmitted ?? '').trim().toLowerCase();
  const precedence = (envelope.precedence ?? '').trim().toLowerCase();
  // `auto-replied` only (RFC 3834): a booking system marks its confirmations `auto-generated`.
  if (autoSubmitted.startsWith('auto-replied') || precedence === 'auto_reply' || AUTO_REPLY_SUBJECT.test(subject)) {
    return { kind: 'drop', reason: 'auto_reply' };
  }
  if (mail.body.trim().length < EMPTY_BODY_CHARS && mail.attachments.length === 0) {
    return { kind: 'drop', reason: 'empty_mail' };
  }
  const listMail = !!envelope.listUnsubscribe || ['bulk', 'list', 'junk'].includes(precedence);
  const bookingSignal = mail.attachments.length > 0 || BOOKING_WORDS.test(`${subject}\n${mail.body}`);
  if (listMail && !bookingSignal) return { kind: 'drop', reason: 'newsletter' };
  return { kind: 'read' };
}

/**
 * Whether the mail came from the person themselves, signed: the From address
 * is their account's and the receiving server saw a DKIM or DMARC pass for
 * its domain. Only ever a hint shown with the mail (owner decision
 * 13.11.2026), never a reason to stop.
 */
export function senderVerified(mail: WalkedMail, accountEmail: string): boolean {
  const from = addressOf(mail.envelope.from);
  if (!from || from !== accountEmail.trim().toLowerCase()) return false;
  const domain = from.split('@')[1] ?? '';
  const results = (mail.envelope.authenticationResults ?? '').toLowerCase();
  const dkim = new RegExp(`dkim=pass[^;]*header\\.(d|i)=@?${escapeRegExp(domain)}\\b`);
  return dkim.test(results) || /dmarc=pass/.test(results);
}

/** The bare address of a From header: `Mia <mia@example.com>` is `mia@example.com`. */
export function addressOf(header: string | null): string | null {
  const match = /<([^>]+)>/.exec(header ?? '') ?? /([^\s<>"]+@[^\s<>"]+)/.exec(header ?? '');
  return match ? match[1].trim().toLowerCase() : null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
