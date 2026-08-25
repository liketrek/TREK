import { EMAIL_I18N as I18N, EVENT_TEXTS } from '@trek/shared/i18n/externalNotifications';
import type { EventText, PasswordResetStrings } from '@trek/shared/i18n/externalNotifications';
import { getAppUrl } from '../../../app-config';
import type { NotifEventType } from '../notification-events';

/**
 * Pure rendering for outgoing mail: the shell, the CTA and the password-reset
 * body. No database, no transport, no DI - which is why it stays a plain module
 * and not a provider. `getAppUrl()` is the canonical app URL from app-config,
 * never a request header.
 */

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Localized title/body for an event.
export function getEventText(lang: string, event: NotifEventType, params: Record<string, string>): EventText {
  const texts = EVENT_TEXTS[lang] || EVENT_TEXTS.en;
  const fn = texts[event] ?? EVENT_TEXTS.en[event];
  if (!fn) return { title: event, body: '' };
  return fn(params);
}

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

export function buildPasswordResetHtml(
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
