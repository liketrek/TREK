/**
 * Turning an SMTP failure into something an admin can act on.
 *
 * Nodemailer throws an Error carrying `code`, `command` and, when the relay said
 * something back, `response` (already appended to the message). None of it used
 * to reach anywhere: the test-email button logged nothing at all, so a wrong
 * password and a blocked port looked identical from the outside. The classifier
 * below keeps the relay's own words, which are the most useful part, and puts
 * the diagnosis in front of them.
 *
 * Everything here is pure, so the wording can be pinned in unit tests without a
 * socket.
 */

export interface SmtpTarget {
  host: string;
  port: number;
  secure: boolean;
}

export interface SmtpFailure {
  /** Nodemailer's error code, or 'UNKNOWN' when the throw carried none. */
  code: string;
  /** Admin-facing and credential-free: safe for both the log and the response. */
  reason: string;
}

const MAX_REASON_LENGTH = 400;
const MAX_ECHOED_VALUE = 32;

/** A port TREK can actually dial, or null. Rejects '', 'abc', '0', '70000', '587abc'. */
export function parseSmtpPort(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const port = Number.parseInt(trimmed, 10);
  return port >= 1 && port <= 65535 ? port : null;
}

/**
 * Why getSmtpConfig() came back empty. Named per field: "SMTP not configured" on
 * its own sent admins hunting through a form where four of the five fields were
 * filled in.
 */
export function describeSmtpGap(raw: { host?: string | null; port?: string | null; from?: string | null }): string {
  if (raw.port && !parseSmtpPort(raw.port)) {
    return `SMTP not configured: the port "${clip(String(raw.port), MAX_ECHOED_VALUE)}" is not a number between 1 and 65535.`;
  }
  const missing: string[] = [];
  if (!raw.host) missing.push('host (SMTP_HOST)');
  if (!raw.port) missing.push('port (SMTP_PORT)');
  if (!raw.from) missing.push('from address (SMTP_FROM)');
  return `SMTP not configured: missing ${missing.join(', ')}. Set it under Admin > Notifications or as the matching environment variable.`;
}

export function describeSmtpFailure(err: unknown, target: SmtpTarget, secret = ''): SmtpFailure {
  const thrown = (err ?? {}) as { code?: unknown; message?: unknown };
  const code = typeof thrown.code === 'string' && thrown.code ? thrown.code : 'UNKNOWN';
  const message = scrub(typeof thrown.message === 'string' && thrown.message ? thrown.message : String(err), secret);
  const where = `${target.host}:${target.port}`;

  if (code === 'EAUTH') {
    return { code, reason: `${where} rejected the credentials. Check the SMTP user and password, and whether the account needs an app-specific password. Server said: ${message}` };
  }
  if (code === 'EDNS' || /ENOTFOUND|EAI_AGAIN/.test(message)) {
    return { code, reason: `The host ${target.host} could not be resolved: ${message}` };
  }
  if (/ECONNREFUSED/.test(message)) {
    return { code, reason: `${where} refused the connection: nothing is listening on that port, or a firewall closed it. ${portHint(target)}` };
  }
  if (/EHOSTUNREACH|ENETUNREACH|EACCES/.test(message)) {
    return { code, reason: `${where} is unreachable from the TREK container: ${message}` };
  }
  if (code === 'ETIMEDOUT' || /timed? ?out|Greeting never received/i.test(message)) {
    return { code, reason: `${where} did not answer in time: ${message}. Outbound mail ports are often blocked by the host or the hosting provider. ${portHint(target)}` };
  }
  if (/certificate|self.signed/i.test(message)) {
    return { code, reason: `The TLS certificate of ${where} was not accepted: ${message}. For an internal relay with its own certificate, turn on "Skip TLS certificate check".` };
  }
  if (/wrong version number|packet length too long|ssl|routines|tlsv1/i.test(message)) {
    return { code, reason: `The TLS handshake with ${where} failed: ${message}. ${portHint(target)}` };
  }
  if (code === 'EENVELOPE') {
    return { code, reason: `${where} rejected the envelope. The from address normally has to belong to the authenticated account. Server said: ${message}` };
  }
  if (code === 'EMESSAGE') {
    return { code, reason: `${where} accepted the connection but rejected the message: ${message}` };
  }
  return { code, reason: `Sending through ${where} failed (${code}): ${message}` };
}

/**
 * The 465-versus-587 mix-up is the one that produces a silent hang rather than a
 * refusal, so every connection-level diagnosis carries it.
 */
function portHint(target: SmtpTarget): string {
  return target.secure
    ? 'Port 465 is dialled with implicit TLS; a relay that expects STARTTLS listens on 587.'
    : `Port ${target.port} is dialled in plain mode with STARTTLS; a relay that expects TLS from the first byte listens on 465.`;
}

/** The relay's words, minus anything that could carry the credential back out. */
function scrub(text: string, secret: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  const redacted = secret.length >= 4 ? collapsed.split(secret).join('***') : collapsed;
  return clip(redacted, MAX_REASON_LENGTH);
}

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}
