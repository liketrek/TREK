import { db } from '../db/database';
import { checkSsrf, createPinnedDispatcher } from '../utils/ssrfGuard';
import { decrypt_api_key } from './apiKeyCrypto';
import { logInfo, logDebug, logError } from './auditLog';
// ── Types ──────────────────────────────────────────────────────────────────

import type { NotifEventType } from './notificationPreferencesService';
import { EMAIL_I18N as I18N, EVENT_TEXTS, PASSWORD_RESET_I18N } from '@trek/shared/i18n/externalNotifications';
import type {
  EmailStrings,
  EventText,
  PasswordResetStrings,
  NotificationEventKey,
} from '@trek/shared/i18n/externalNotifications';

import nodemailer from 'nodemailer';

// Compile-time guard: shared NotificationEventKey and server NotifEventType must stay in sync.
type _EvtFwd = NotifEventType extends NotificationEventKey ? true : never;
type _EvtBwd = NotificationEventKey extends NotifEventType ? true : never;
const _eventKeyDriftGuard: [_EvtFwd, _EvtBwd] = [true, true];

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

// ── HTML escaping ──────────────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Settings helpers ───────────────────────────────────────────────────────

function getAppSetting(key: string): string | null {
  return (
    (db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined)?.value ||
    null
  );
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST || getAppSetting('smtp_host');
  const port = process.env.SMTP_PORT || getAppSetting('smtp_port');
  const user = process.env.SMTP_USER || getAppSetting('smtp_user');
  const pass = process.env.SMTP_PASS || decrypt_api_key(getAppSetting('smtp_pass')) || '';
  const from = process.env.SMTP_FROM || getAppSetting('smtp_from');
  if (!host || !port || !from) return null;
  return {
    host,
    port: parseInt(port, 10),
    user: user || '',
    pass: pass || '',
    from,
    secure: parseInt(port, 10) === 465,
  };
}

// Exported for use by notificationService
export function getAppUrl(): string {
  if (process.env.APP_URL) {
    try {
      const _ = new URL(process.env.APP_URL);
      return process.env.APP_URL.replace(/\/+$/, '');
    } catch (_ignored) {}
  }
  const origins = process.env.ALLOWED_ORIGINS;
  if (origins) {
    const first = origins.split(',')[0]?.trim();
    if (first) {
      try {
        const _ = new URL(first);
        return first.replace(/\/+$/, '');
      } catch (_ignored) {}
    }
  }
  const port = Number(process.env.PORT) || 3001;
  return `http://localhost:${port}`;
}

/** Returns a URL guaranteed to satisfy the MCP SDK's issuer requirements (HTTPS or localhost).
 *  Falls back to http://localhost:{PORT} when APP_URL/ALLOWED_ORIGINS use a non-HTTPS, non-localhost scheme
 *  that would cause checkIssuerUrl to throw "Issuer URL must be HTTPS". */
export function getMcpSafeUrl(): string {
  const candidate = getAppUrl();
  try {
    const u = new URL(candidate);
    if (u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
      return candidate;
    }
  } catch {
    // candidate was somehow invalid — fall through to localhost
  }
  const port = Number(process.env.PORT) || 3001;
  return `http://localhost:${port}`;
}

/** Is SMTP configured at the instance level? (Independent of any one user's address.) */
export function isSmtpConfigured(): boolean {
  return !!(process.env.SMTP_HOST || getAppSetting('smtp_host'));
}

export function getUserEmail(userId: number): string | null {
  // Defense-in-depth (#1362): a guest's synthetic email must never be emailed.
  return (
    (
      db.prepare('SELECT email FROM users WHERE id = ? AND COALESCE(is_guest, 0) = 0').get(userId) as
        | { email: string }
        | undefined
    )?.email || null
  );
}

export function getUserLanguage(userId: number): string {
  return (
    (
      db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'language'").get(userId) as
        | { value: string }
        | undefined
    )?.value || 'en'
  );
}

export function getUserWebhookUrl(userId: number): string | null {
  const value =
    (
      db.prepare("SELECT value FROM settings WHERE user_id = ? AND key = 'webhook_url'").get(userId) as
        | { value: string }
        | undefined
    )?.value || null;
  return value ? decrypt_api_key(value) : null;
}

export function getAdminWebhookUrl(): string | null {
  const value = getAppSetting('admin_webhook_url') || null;
  return value ? decrypt_api_key(value) : null;
}

// ── Email i18n strings — imported from @trek/shared/i18n/externalNotifications ──

// EVENT_TEXTS imported from @trek/shared/i18n/externalNotifications

// Get localized event text
export function getEventText(lang: string, event: NotifEventType, params: Record<string, string>): EventText {
  const texts = EVENT_TEXTS[lang] || EVENT_TEXTS.en;
  const fn = texts[event] ?? EVENT_TEXTS.en[event];
  if (!fn) return { title: event, body: '' };
  return fn(params);
}

// ── Email HTML builder ─────────────────────────────────────────────────────

export function buildEmailHtml(
  subject: string,
  body: string,
  lang: string,
  navigateTarget?: string,
  rawBody = false,
): string {
  const s = I18N[lang] || I18N.en;
  const appUrl = getAppUrl();
  const ctaHref = escapeHtml(navigateTarget ? `${appUrl}${navigateTarget}` : appUrl || '');
  const safeSubject = escapeHtml(subject);
  const safeBody = rawBody ? body : escapeHtml(body);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background: linear-gradient(135deg, #000000 0%, #1a1a2e 100%); padding: 32px 32px 28px; text-align: center;">
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj4NCiAgPGRlZnM+DQogICAgPGxpbmVhckdyYWRpZW50IGlkPSJiZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjEiPg0KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzFlMjkzYiIvPg0KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMGYxNzJhIi8+DQogICAgPC9saW5lYXJHcmFkaWVudD4NCiAgICA8Y2xpcFBhdGggaWQ9Imljb24iPg0KICAgICAgPHBhdGggZD0iTSA4NTUuNjM2NzE5IDY5OS4yMDMxMjUgTCAyMjIuMjQ2MDk0IDY5OS4yMDMxMjUgQyAxOTcuNjc5Njg4IDY5OS4yMDMxMjUgMTc5LjkwNjI1IDY3NS43NSAxODYuNTM5MDYyIDY1Mi4xMDE1NjIgTCAzNjAuNDI5Njg4IDMyLjM5MDYyNSBDIDM2NC45MjE4NzUgMTYuMzg2NzE5IDM3OS41MTE3MTkgNS4zMjgxMjUgMzk2LjEzMjgxMiA1LjMyODEyNSBMIDEwMjkuNTI3MzQ0IDUuMzI4MTI1IEMgMTA1NC4wODk4NDQgNS4zMjgxMjUgMTA3MS44NjcxODggMjguNzc3MzQ0IDEwNjUuMjMwNDY5IDUyLjQyOTY4OCBMIDg5MS4zMzk4NDQgNjcyLjEzNjcxOSBDIDg4Ni44NTE1NjIgNjg4LjE0MDYyNSA4NzIuMjU3ODEyIDY5OS4yMDMxMjUgODU1LjYzNjcxOSA2OTkuMjAzMTI1IFogTSA0NDQuMjM4MjgxIDExNjYuOTgwNDY5IEwgNTMzLjc3MzQzOCA4NDcuODk4NDM4IEMgNTQwLjQxMDE1NiA4MjQuMjQ2MDk0IDUyMi42MzI4MTIgODAwLjc5Njg3NSA0OTguMDcwMzEyIDgwMC43OTY4NzUgTCAxNzIuNDcyNjU2IDgwMC43OTY4NzUgQyAxNTUuODUxNTYyIDgwMC43OTY4NzUgMTQxLjI2MTcxOSA4MTEuODU1NDY5IDEzNi43Njk1MzEgODI3Ljg1OTM3NSBMIDQ3LjIzNDM3NSAxMTQ2Ljk0MTQwNiBDIDQwLjU5NzY1NiAxMTcwLjU5Mzc1IDU4LjM3NSAxMTk0LjA0Mjk2OSA4Mi45Mzc1IDExOTQuMDQyOTY5IEwgNDA4LjUzNTE1NiAxMTk0LjA0Mjk2OSBDIDQyNS4xNTYyNSAxMTk0LjA0Mjk2OSA0MzkuNzUgMTE4Mi45ODQzNzUgNDQ0LjIzODI4MSAxMTY2Ljk4MDQ2OSBaIE0gNjA5LjAwMzkwNiA4MjcuODU5Mzc1IEwgNDM1LjExMzI4MSAxNDQ3LjU3MDMxMiBDIDQyOC40NzY1NjIgMTQ3MS4yMTg3NSA0NDYuMjUzOTA2IDE0OTQuNjcxODc1IDQ3MC44MTY0MDYgMTQ5NC42NzE4NzUgTCAxMTA0LjIxMDkzOCAxNDk0LjY3MTg3NSBDIDExMjAuODMyMDMxIDE0OTQuNjcxODc1IDExMzUuNDIxODc1IDE0ODMuNjA5Mzc1IDExMzkuOTE0MDYyIDE0NjcuNjA1NDY5IEwgMTMxMy44MDQ2ODggODQ3Ljg5ODQzOCBDIDEzMjAuNDQxNDA2IDgyNC4yNDYwOTQgMTMwMi42NjQwNjIgODAwLjc5Njg3NSAxMjc4LjEwMTU2MiA4MDAuNzk2ODc1IEwgNjQ0LjcwNzAzMSA4MDAuNzk2ODc1IEMgNjI4LjA4NTkzOCA4MDAuNzk2ODc1IDYxMy40OTIxODggODExLjg1NTQ2OSA2MDkuMDAzOTA2IDgyNy44NTkzNzUgWiBNIDEwNTYuMTA1NDY5IDMzMy4wMTk1MzEgTCA5NjYuNTcwMzEyIDY1Mi4xMDE1NjIgQyA5NTkuOTMzNTk0IDY3NS43NSA5NzcuNzEwOTM4IDY5OS4yMDMxMjUgMTAwMi4yNzM0MzggNjk5LjIwMzEyNSBMIDEzMjcuODcxMDk0IDY5OS4yMDMxMjUgQyAxMzQ0LjQ5MjE4OCA2OTkuMjAzMTI1IDEzNTkuMDg1OTM4IDY4OC4xNDA2MjUgMTM2My41NzQyMTkgNjcyLjEzNjcxOSBMIDE0NTMuMTA5Mzc1IDM1My4wNTQ2ODggQyAxNDU5Ljc0NjA5NCAzMjkuNDA2MjUgMTQ0MS45Njg3NSAzMDUuOTUzMTI1IDE0MTcuNDA2MjUgMzA1Ljk1MzEyNSBMIDEwOTEuODA4NTk0IDMwNS45NTMxMjUgQyAxMDc1LjE4NzUgMzA1Ljk1MzEyNSAxMDYwLjU5NzY1NiAzMTcuMDE1NjI1IDEwNTYuMTA1NDY5IDMzMy4wMTk1MzEgWiIvPg0KICAgIDwvY2xpcFBhdGg+DQogIDwvZGVmcz4NCiAgPHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIGZpbGw9InVybCgjYmcpIi8+DQogIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDU2LDUxKSBzY2FsZSgwLjI2NykiPg0KICAgIDxyZWN0IHdpZHRoPSIxNTAwIiBoZWlnaHQ9IjE1MDAiIGZpbGw9IiNmZmZmZmYiIGNsaXAtcGF0aD0idXJsKCNpY29uKSIvPg0KICA8L2c+DQo8L3N2Zz4NCg==" alt="TREK" width="48" height="48" style="border-radius: 14px; margin-bottom: 14px; display: block; margin-left: auto; margin-right: auto;" />
          <div style="color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">TREK</div>
          <div style="color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase; margin-top: 4px;">Travel Resource &amp; Exploration Kit</div>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding: 32px 32px 16px;">
          <h1 style="margin: 0 0 8px; font-size: 18px; font-weight: 700; color: #111827; line-height: 1.3;">${safeSubject}</h1>
          <div style="width: 32px; height: 3px; background: #111827; border-radius: 2px; margin-bottom: 20px;"></div>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.7; white-space: pre-wrap;">${safeBody}</p>
        </td></tr>
        <!-- CTA -->
        ${
          appUrl
            ? `<tr><td style="padding: 8px 32px 32px; text-align: center;">
          <a href="${ctaHref}" style="display: inline-block; padding: 12px 28px; background: #111827; color: #ffffff; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 10px; letter-spacing: 0.2px;">${s.openTrek}</a>
        </td></tr>`
            : ''
        }
        <!-- Footer -->
        <tr><td style="padding: 20px 32px; background: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 11px; color: #9ca3af; line-height: 1.5;">${s.footer}<br>${s.manage}</p>
          <p style="margin: 0; font-size: 10px; color: #d1d5db;">${s.madeWith} <span style="color: #ef4444;">&hearts;</span> by Maurice &middot; <a href="https://github.com/liketrek/TREK" style="color: #9ca3af; text-decoration: none;">GitHub</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Send functions ─────────────────────────────────────────────────────────

// ── Password reset email ───────────────────────────────────────────────────

// PASSWORD_RESET_I18N imported from @trek/shared/i18n/externalNotifications

function buildPasswordResetHtml(
  subject: string,
  strings: PasswordResetStrings,
  recipient: string,
  resetUrl: string,
  lang: string,
): string {
  const safeGreeting = escapeHtml(`${strings.greeting}, ${recipient}`);
  const safeBody = escapeHtml(strings.body);
  const safeExpiry = escapeHtml(strings.expiry);
  const safeIgnore = escapeHtml(strings.ignore);
  const safeCta = escapeHtml(strings.ctaIntro);
  const block = `
    <p style="margin:0 0 16px 0; font-size:16px;">${safeGreeting},</p>
    <p style="margin:0 0 20px 0; font-size:15px; line-height:1.6;">${safeBody}</p>
    <p style="margin:28px 0;">
      <a href="${resetUrl}" style="display:inline-block;padding:14px 28px;background:#111827;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;">${safeCta}</a>
    </p>
    <p style="margin:0 0 10px 0; font-size:13px; color:#6B7280;">${safeExpiry}</p>
    <p style="margin:0; font-size:13px; color:#6B7280;">${safeIgnore}</p>
  `;
  return buildEmailHtml(subject, block, lang, undefined, true);
}

/**
 * Delivers a password-reset link. When SMTP is configured the user
 * receives an email. When it isn't, the link is logged to stdout in a
 * clearly-fenced block so the self-hosting admin can hand it off by
 * other means. In both cases the caller always gets a boolean that
 * indicates only whether the caller should treat delivery as
 * best-effort done — the API response to the user must NOT leak it.
 */
export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  userId: number | null,
): Promise<{ delivered: 'email' | 'log' | 'failed' }> {
  const lang = userId ? getUserLanguage(userId) : 'en';
  const strings = PASSWORD_RESET_I18N[lang] || PASSWORD_RESET_I18N.en;
  const smtpCfg = getSmtpConfig();

  if (!smtpCfg) {
    // No SMTP configured — log the link in a visually distinct block so
    // the admin can relay it. Never log the associated user id/email
    // content at a lower level, only what's needed.

    console.log(
      `\n===== PASSWORD RESET LINK =====\n` +
        `to: ${to}\n` +
        `url: ${resetUrl}\n` +
        `expires: 60 minutes\n` +
        `(SMTP is not configured — deliver this link to the user manually.)\n` +
        `================================\n`,
    );
    logInfo(`Password reset link issued (no SMTP) for=${to}`);
    return { delivered: 'log' };
  }

  try {
    const skipTls = process.env.SMTP_SKIP_TLS_VERIFY === 'true' || getAppSetting('smtp_skip_tls_verify') === 'true';
    const transporter = nodemailer.createTransport({
      host: smtpCfg.host,
      port: smtpCfg.port,
      secure: smtpCfg.secure,
      auth: smtpCfg.user ? { user: smtpCfg.user, pass: smtpCfg.pass } : undefined,
      ...(skipTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
    await transporter.sendMail({
      from: smtpCfg.from,
      to,
      subject: `TREK — ${strings.subject}`,
      text: `${strings.greeting}, ${to}\n\n${strings.body}\n\n${strings.ctaIntro}: ${resetUrl}\n\n${strings.expiry}\n${strings.ignore}`,
      html: buildPasswordResetHtml(strings.subject, strings, to, resetUrl, lang),
    });
    logInfo(`Password reset email sent to=${to}`);
    return { delivered: 'email' };
  } catch (err) {
    logError(`Password reset email failed to=${to}: ${err instanceof Error ? err.message : err}`);
    return { delivered: 'failed' };
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  userId?: number,
  navigateTarget?: string,
): Promise<boolean> {
  const config = getSmtpConfig();
  if (!config) return false;

  const lang = userId ? getUserLanguage(userId) : 'en';

  try {
    const skipTls = process.env.SMTP_SKIP_TLS_VERIFY === 'true' || getAppSetting('smtp_skip_tls_verify') === 'true';
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      ...(skipTls ? { tls: { rejectUnauthorized: false } } : {}),
    });

    await transporter.sendMail({
      from: config.from,
      to,
      subject: `TREK — ${subject}`,
      text: body,
      html: buildEmailHtml(subject, body, lang, navigateTarget),
    });
    logInfo(`Email sent to=${to} subject="${subject}"`);
    logDebug(`Email smtp=${config.host}:${config.port} from=${config.from} to=${to}`);
    return true;
  } catch (err) {
    logError(`Email send failed to=${to}: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

export function buildWebhookBody(
  url: string,
  payload: { event: string; title: string; body: string; tripName?: string; link?: string },
): string {
  const isDiscord = /discord(?:app)?\.com\/api\/webhooks\//.test(url);
  const isSlack = /hooks\.slack\.com\//.test(url);

  if (isDiscord) {
    return JSON.stringify({
      embeds: [
        {
          title: `📍 ${payload.title}`,
          description: payload.body,
          url: payload.link,
          color: 0x3b82f6,
          footer: { text: payload.tripName ? `Trip: ${payload.tripName}` : 'TREK' },
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  if (isSlack) {
    const trip = payload.tripName ? `  •  _${payload.tripName}_` : '';
    const link = payload.link ? `\n<${payload.link}|Open in TREK>` : '';
    return JSON.stringify({
      text: `*${payload.title}*\n${payload.body}${trip}${link}`,
    });
  }

  return JSON.stringify({ ...payload, timestamp: new Date().toISOString(), source: 'TREK' });
}

export async function sendWebhook(
  url: string,
  payload: { event: string; title: string; body: string; tripName?: string; link?: string },
): Promise<boolean> {
  if (!url) return false;

  const ssrf = await checkSsrf(url);
  if (!ssrf.allowed) {
    logError(`Webhook blocked by SSRF guard event=${payload.event} url=${url} reason=${ssrf.error}`);
    return false;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: buildWebhookBody(url, payload),
      signal: AbortSignal.timeout(10000),
      dispatcher: createPinnedDispatcher(ssrf.resolvedIp!),
    } as any);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      logError(`Webhook HTTP ${res.status}: ${errBody}`);
      return false;
    }

    logInfo(`Webhook sent event=${payload.event} trip=${payload.tripName || '-'}`);
    logDebug(`Webhook url=${url} payload=${buildWebhookBody(url, payload).substring(0, 500)}`);
    return true;
  } catch (err) {
    logError(`Webhook failed event=${payload.event}: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

export async function testSmtp(to: string): Promise<{ success: boolean; error?: string }> {
  if (!getSmtpConfig()) return { success: false, error: 'SMTP not configured' };
  try {
    const config = getSmtpConfig()!;
    const skipTls = process.env.SMTP_SKIP_TLS_VERIFY === 'true' || getAppSetting('smtp_skip_tls_verify') === 'true';
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      ...(skipTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
    await transporter.sendMail({
      from: config.from,
      to,
      subject: 'TREK — Test Notification',
      text: 'This is a test email from TREK. If you received this, your SMTP configuration is working correctly.',
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function testWebhook(url: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sent = await sendWebhook(url, {
      event: 'test',
      title: 'Test Notification',
      body: 'This is a test webhook from TREK. If you received this, your webhook configuration is working correctly.',
    });
    return sent ? { success: true } : { success: false, error: 'Failed to send webhook' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Ntfy ──────────────────────────────────────────────────────────────────

export interface NtfyConfig {
  server: string | null;
  topic: string | null;
  token: string | null;
}

/** Priority and tags mapped to each notification event type. */
const NTFY_EVENT_META: Partial<Record<NotifEventType, { priority: 1 | 2 | 3 | 4 | 5; tags: string[] }>> = {
  trip_invite: { priority: 4, tags: ['loudspeaker'] },
  booking_change: { priority: 3, tags: ['calendar'] },
  trip_reminder: { priority: 4, tags: ['bell', 'alarm_clock'] },
  vacay_invite: { priority: 4, tags: ['palm_tree'] },
  photos_shared: { priority: 3, tags: ['camera'] },
  collab_message: { priority: 3, tags: ['speech_balloon'] },
  packing_tagged: { priority: 3, tags: ['luggage'] },
  version_available: { priority: 4, tags: ['package'] },
  synology_session_cleared: { priority: 3, tags: ['warning'] },
};
const NTFY_DEFAULT_META = { priority: 3 as const, tags: [] as string[] };

export function getUserNtfyConfig(userId: number): NtfyConfig | null {
  const rows = db
    .prepare("SELECT key, value FROM settings WHERE user_id = ? AND key IN ('ntfy_topic', 'ntfy_server', 'ntfy_token')")
    .all(userId) as { key: string; value: string }[];
  if (rows.length === 0) return null;
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    topic: map['ntfy_topic'] || null,
    server: map['ntfy_server'] || null,
    token: map['ntfy_token'] ? decrypt_api_key(map['ntfy_token']) : null,
  };
}

export function getAdminNtfyConfig(): NtfyConfig {
  const topic = getAppSetting('admin_ntfy_topic') || null;
  const server = getAppSetting('admin_ntfy_server') || null;
  const rawToken = getAppSetting('admin_ntfy_token') || null;
  return {
    topic,
    server,
    token: rawToken ? decrypt_api_key(rawToken) : null,
  };
}

/**
 * Resolve the ntfy POST URL for a per-user send. The topic must come from the
 * user's own config — the admin topic is reserved for admin-scoped sends
 * (see resolveAdminNtfyUrl). Only the server falls back to the admin default.
 * Returns null if the user has no topic.
 */
export function resolveNtfyUrl(adminCfg: NtfyConfig, userCfg: NtfyConfig | null): string | null {
  const topic = userCfg?.topic;
  if (!topic) return null;
  const base = (userCfg?.server || adminCfg.server || 'https://ntfy.sh').replace(/\/+$/, '');
  return `${base}/${encodeURIComponent(topic)}`;
}

/** Resolve the ntfy POST URL for admin-scoped sends. Returns null if no admin topic. */
export function resolveAdminNtfyUrl(adminCfg: NtfyConfig): string | null {
  if (!adminCfg.topic) return null;
  const base = (adminCfg.server || 'https://ntfy.sh').replace(/\/+$/, '');
  return `${base}/${encodeURIComponent(adminCfg.topic)}`;
}

function encodeHeaderValue(value: string): string {
  for (let i = 0; i < value.length; i++) {
    if (value.charCodeAt(i) > 0xff) {
      return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
    }
  }
  return value;
}

export async function sendNtfy(
  url: string,
  token: string | null,
  payload: { event: string; title: string; body: string; link?: string },
): Promise<boolean> {
  if (!url) return false;

  const ssrf = await checkSsrf(url);
  if (!ssrf.allowed) {
    logError(`Ntfy blocked by SSRF guard event=${payload.event} url=${url} reason=${ssrf.error}`);
    return false;
  }

  const meta = NTFY_EVENT_META[payload.event as NotifEventType] ?? NTFY_DEFAULT_META;

  // ntfy header-based API: POST to topic URL, body = plain text message, metadata in headers
  const headers: Record<string, string> = {
    Title: encodeHeaderValue(payload.title),
    Priority: String(meta.priority),
  };
  if (meta.tags.length > 0) headers['Tags'] = meta.tags.join(',');
  if (payload.link) headers['Click'] = encodeHeaderValue(payload.link);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: payload.body,
      signal: AbortSignal.timeout(10000),
      dispatcher: createPinnedDispatcher(ssrf.resolvedIp!),
    } as any);

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      logError(`Ntfy HTTP ${res.status}: ${errBody}`);
      return false;
    }

    logInfo(`Ntfy sent event=${payload.event}`);
    logDebug(`Ntfy url=${url} priority=${meta.priority} tags=${meta.tags.join(',')}`);
    return true;
  } catch (err) {
    logError(`Ntfy failed event=${payload.event}: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

export async function testNtfy(cfg: {
  topic: string;
  server?: string | null;
  token?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const adminCfg = getAdminNtfyConfig();
  const url = resolveNtfyUrl(adminCfg, { topic: cfg.topic, server: cfg.server ?? null, token: cfg.token ?? null });
  if (!url) return { success: false, error: 'Could not resolve ntfy URL — missing topic' };
  try {
    const sent = await sendNtfy(url, cfg.token ?? null, {
      event: 'test',
      title: 'Test Notification',
      body: 'This is a test notification from TREK. If you received this, your ntfy configuration is working correctly.',
    });
    return sent ? { success: true } : { success: false, error: 'Failed to send ntfy notification' };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
