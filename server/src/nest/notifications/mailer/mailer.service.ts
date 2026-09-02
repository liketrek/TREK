import { Injectable } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { PASSWORD_RESET_I18N } from '@trek/shared/i18n/externalNotifications';
import { readEnv } from '../../../app-config';
import { logError, logInfo, logDebug, logWarn } from '../../audit/audit-log.logger';
import { decrypt_api_key } from '../../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../../database/database.service';
import { buildEmailHtml, buildPasswordResetHtml } from './email-html';
import { describeSmtpFailure, describeSmtpGap, parseSmtpPort, type SmtpTarget } from './smtp-diagnostics';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  secure: boolean;
}

/**
 * Nodemailer's own defaults are 2 minutes to connect and 30 seconds for the
 * greeting, both of which outlive the browser's 8-second API timeout: an admin
 * pressing "Send test email" against a blocked port got a dead "Test email
 * failed" while the socket was still waiting, and the eventual error had nobody
 * left to tell. A relay that needs more than ten seconds to accept a connection
 * or to send its banner is broken either way, so those two are cut hard. The
 * inactivity timeout stays generous (nodemailer's default is ten minutes)
 * because a relay that scans the message can be slow to acknowledge DATA.
 */
const CONNECT_TIMEOUT_MS = 10_000;
const GREETING_TIMEOUT_MS = 10_000;
const SOCKET_TIMEOUT_MS = 30_000;

/**
 * Outgoing mail: SMTP config resolution, the password-reset delivery and the
 * generic notification email.
 *
 * Its own leaf module rather than part of the notifications domain, and that is
 * load-bearing: AuthService sends the password-reset mail, while
 * NotificationsModule imports AuthModule for the demo gate in NotificationsMcp.
 * Putting the mailer in NotificationsModule would close a hard module cycle that
 * only a forwardRef could open again.
 */
@Injectable()
export class MailerService {
  private skippedTlsWarned = false;

  constructor(private readonly db: DatabaseService) {}

  private getAppSetting(key: string): string | null {
    return this.db.get<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', key)?.value || null;
  }

  /** Env wins over the admin panel, per field. Read fresh on every send. */
  private readSmtpSettings() {
    const smtpEnv = readEnv().smtp;
    return {
      host: smtpEnv.host || this.getAppSetting('smtp_host'),
      port: smtpEnv.port || this.getAppSetting('smtp_port'),
      user: smtpEnv.user || this.getAppSetting('smtp_user'),
      pass: smtpEnv.pass || decrypt_api_key(this.getAppSetting('smtp_pass')) || '',
      from: smtpEnv.from || this.getAppSetting('smtp_from'),
    };
  }

  private getSmtpConfig(): SmtpConfig | null {
    const { host, port, user, pass, from } = this.readSmtpSettings();
    // An unusable port counts as unconfigured rather than as a dial: net.connect
    // on NaN throws from inside nodemailer, where the reason gets lost.
    const portNumber = parseSmtpPort(port);
    if (!host || !portNumber || !from) return null;
    return {
      host,
      port: portNumber,
      user: user || '',
      pass: pass || '',
      from,
      secure: portNumber === 465,
    };
  }

  /**
   * A transport per send, never a cached one. `skipTlsVerify` and the whole SMTP
   * config are re-read on every call, so an admin changing the host, the password
   * or the TLS setting takes effect on the next mail instead of after a restart.
   * The three call sites below each built this inline before the fold; keeping it
   * one method is the only change, and it keeps the freshness property visible.
   */
  private createTransport(config: SmtpConfig) {
    const skipTls = readEnv().smtp.skipTlsVerify || this.getAppSetting('smtp_skip_tls_verify') === 'true';
    if (skipTls) this.warnOnceAboutSkippedTls(config);
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
      connectionTimeout: CONNECT_TIMEOUT_MS,
      greetingTimeout: GREETING_TIMEOUT_MS,
      socketTimeout: SOCKET_TIMEOUT_MS,
      // The operator's opt-out for a relay with a self-signed certificate, off by
      // default and reachable only through SMTP_SKIP_TLS_VERIFY or the matching
      // admin setting. It stays because self-hosted installs behind an internal
      // relay depend on it; warnOnceAboutSkippedTls is what keeps it from being a
      // silent downgrade.
      ...(skipTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
  }

  /**
   * Once per process, not once per mail — a transport is built on every send, and
   * a line on every notification would train the operator to scroll past it.
   */
  private warnOnceAboutSkippedTls(config: SmtpConfig): void {
    if (this.skippedTlsWarned) return;
    this.skippedTlsWarned = true;
    logWarn(
      `SECURITY: SMTP certificate verification is disabled for ${config.host}:${config.port}. ` +
        'Mail — including password-reset links and the SMTP credentials — travels over a channel an ' +
        'active attacker can impersonate. Keep this on only for a relay you control on a trusted network.',
    );
  }

  /** Is SMTP configured at the instance level? (Independent of any one user's address.) */
  isSmtpConfigured(): boolean {
    return !!(readEnv().smtp.host || this.getAppSetting('smtp_host'));
  }

  getUserEmail(userId: number): string | null {
    // Defense-in-depth (#1362): a guest's synthetic email must never be emailed.
    return this.db.get<{ email: string }>(
      'SELECT email FROM users WHERE id = ? AND COALESCE(is_guest, 0) = 0', userId,
    )?.email || null;
  }

  getUserLanguage(userId: number): string {
    return this.db.get<{ value: string }>(
      "SELECT value FROM settings WHERE user_id = ? AND key = 'language'", userId,
    )?.value || 'en';
  }

  /**
   * Delivers a password-reset link. When SMTP is configured the user
   * receives an email. When it isn't, the link is logged to stdout in a
   * clearly-fenced block so the self-hosting admin can hand it off by
   * other means. In both cases the caller always gets a boolean that
   * indicates only whether the caller should treat delivery as
   * best-effort done — the API response to the user must NOT leak it.
   */
  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    userId: number | null,
  ): Promise<{ delivered: 'email' | 'log' | 'failed' }> {
    const lang = userId ? this.getUserLanguage(userId) : 'en';
    const strings = PASSWORD_RESET_I18N[lang] || PASSWORD_RESET_I18N.en;
    const smtpCfg = this.getSmtpConfig();

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
      await this.createTransport(smtpCfg).sendMail({
        from: smtpCfg.from,
        to,
        subject: `TREK — ${strings.subject}`,
        text: `${strings.greeting}, ${to}\n\n${strings.body}\n\n${strings.ctaIntro}: ${resetUrl}\n\n${strings.expiry}\n${strings.ignore}`,
        html: buildPasswordResetHtml(strings.subject, strings, to, resetUrl, lang),
      });
      logInfo(`Password reset email sent to=${to}`);
      return { delivered: 'email' };
    } catch (err) {
      logError(`Password reset email failed to=${to} ${this.explain(err, smtpCfg)}`);
      return { delivered: 'failed' };
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    userId?: number,
    navigateTarget?: string,
  ): Promise<boolean> {
    const config = this.getSmtpConfig();
    if (!config) return false;

    const lang = userId ? this.getUserLanguage(userId) : 'en';

    try {
      await this.createTransport(config).sendMail({
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
      logError(`Email send failed to=${to} ${this.explain(err, config)}`);
      return false;
    }
  }

  /**
   * The admin's "Send test email" button. Unlike the delivery paths this one has
   * somebody waiting for an answer, so the classified reason goes into the
   * response as well as the log. Issue #2196 was an admin staring at "Test email
   * failed" with an empty container log, unable to tell a wrong password from a
   * blocked port.
   */
  async testSmtp(to: string): Promise<{ success: boolean; error?: string }> {
    const config = this.getSmtpConfig();
    if (!config) {
      const { host, port, from } = this.readSmtpSettings();
      const reason = describeSmtpGap({ host, port, from });
      logWarn(`SMTP test not attempted to=${to}: ${reason}`);
      return { success: false, error: reason };
    }
    try {
      await this.createTransport(config).sendMail({
        from: config.from,
        to,
        subject: 'TREK — Test Notification',
        text: 'This is a test email from TREK. If you received this, your SMTP configuration is working correctly.',
      });
      logInfo(`SMTP test email sent to=${to} ${this.describeTarget(config)}`);
      return { success: true };
    } catch (err) {
      const failure = describeSmtpFailure(err, this.target(config), config.pass);
      logError(`SMTP test email failed to=${to} ${this.describeTarget(config)} code=${failure.code}: ${failure.reason}`);
      return { success: false, error: failure.reason };
    }
  }

  private target(config: SmtpConfig): SmtpTarget {
    return { host: config.host, port: config.port, secure: config.secure };
  }

  /** The tail every failed-send log line carries: where it went, and why it broke. */
  private explain(err: unknown, config: SmtpConfig): string {
    const failure = describeSmtpFailure(err, this.target(config), config.pass);
    return `${this.describeTarget(config)} code=${failure.code}: ${failure.reason}`;
  }

  /** Never the user or the password: the relay and how it was dialled. */
  private describeTarget(config: SmtpConfig): string {
    return `smtp=${config.host}:${config.port} secure=${config.secure} auth=${config.user ? 'yes' : 'no'}`;
  }
}
