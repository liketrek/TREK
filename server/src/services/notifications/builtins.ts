import {
  sendEmail,
  sendWebhook,
  sendNtfy,
  testSmtp,
  testWebhook,
  testNtfy,
  isSmtpConfigured,
  getUserEmail,
  getUserWebhookUrl,
  getAdminWebhookUrl,
  getUserNtfyConfig,
  getAdminNtfyConfig,
  resolveNtfyUrl,
} from '../notifications';
import { registerChannel, type ChannelMessage, type ExternalChannel } from './channelRegistry';

// The three built-in external channels, wrapping the send functions and config
// resolvers that already live in ../notifications.ts. No delivery logic is
// rewritten here — it is only relocated behind the ExternalChannel interface so
// notificationService.send() can iterate instead of branching.

/**
 * Every event except `synology_session_cleared` is deliverable externally.
 * This is the pre-registry IMPLEMENTED_COMBOS table, transposed: it listed
 * ['inapp','email','webhook','ntfy'] for every event and ['inapp'] for that one.
 */
function supportsAllButSynology(event: string): boolean {
  return event !== 'synology_session_cleared';
}

const emailChannel: ExternalChannel = {
  id: 'email',
  source: 'builtin',
  labelKey: 'settings.notificationPreferences.email',
  // Admin-scoped events (version_available) reach admins by email even when the
  // admin has not put `email` in notification_channels — the admin global pref
  // gates it instead. Verbatim from the pre-registry dispatch.
  bypassesActiveToggleForAdminEvents: true,
  supportsEvent: supportsAllButSynology,
  isInstanceConfigured: isSmtpConfigured,
  isConfiguredFor: (userId) => !!getUserEmail(userId),
  async sendToUser(userId, msg) {
    const email = getUserEmail(userId);
    if (!email) return false;
    return sendEmail(email, msg.title, msg.body, userId, msg.navigateTarget);
  },
  async test(userId) {
    const email = getUserEmail(userId);
    if (!email) return { success: false, error: 'No email address on file' };
    return testSmtp(email);
  },
};

const webhookChannel: ExternalChannel = {
  id: 'webhook',
  source: 'builtin',
  labelKey: 'settings.notificationPreferences.webhook',
  supportsAdminGlobal: true,
  supportsEvent: supportsAllButSynology,
  isConfiguredFor: (userId) => !!getUserWebhookUrl(userId),
  async sendToUser(userId, msg) {
    const url = getUserWebhookUrl(userId);
    if (!url) return false;
    return sendWebhook(url, { event: msg.event, title: msg.title, body: msg.body, tripName: msg.tripName, link: msg.url });
  },
  async sendGlobal(msg: ChannelMessage) {
    const url = getAdminWebhookUrl();
    if (!url) return false;
    return sendWebhook(url, { event: msg.event, title: msg.title, body: msg.body, link: msg.url });
  },
  async test(userId, override) {
    const url = (typeof override?.url === 'string' && override.url) || getUserWebhookUrl(userId);
    if (!url) return { success: false, error: 'No webhook URL configured' };
    return testWebhook(url);
  },
};

const ntfyChannel: ExternalChannel = {
  id: 'ntfy',
  source: 'builtin',
  labelKey: 'settings.notificationPreferences.ntfy',
  supportsAdminGlobal: true,
  supportsEvent: supportsAllButSynology,
  isConfiguredFor: (userId) => !!resolveNtfyUrl(getAdminNtfyConfig(), getUserNtfyConfig(userId)),
  async sendToUser(userId, msg) {
    const userCfg = getUserNtfyConfig(userId);
    const adminCfg = getAdminNtfyConfig();
    const url = resolveNtfyUrl(adminCfg, userCfg);
    if (!url) return false;
    return sendNtfy(url, userCfg?.token ?? adminCfg.token, { event: msg.event, title: msg.title, body: msg.body, link: msg.url });
  },
  async sendGlobal(msg: ChannelMessage) {
    const adminCfg = getAdminNtfyConfig();
    const url = resolveNtfyUrl(adminCfg, null);
    if (!url) return false;
    return sendNtfy(url, adminCfg.token, { event: msg.event, title: msg.title, body: msg.body, link: msg.url });
  },
  async test(userId, override) {
    const topic = typeof override?.topic === 'string' ? override.topic : getUserNtfyConfig(userId)?.topic;
    if (!topic) return { success: false, error: 'Could not resolve ntfy URL — missing topic' };
    return testNtfy({
      topic,
      server: typeof override?.server === 'string' ? override.server : null,
      token: typeof override?.token === 'string' ? override.token : null,
    });
  },
};

export const BUILTIN_CHANNELS = [emailChannel, webhookChannel, ntfyChannel];

/** Idempotent — safe to call from every entry point that needs the registry populated. */
export function registerBuiltinChannels(): void {
  for (const channel of BUILTIN_CHANNELS) registerChannel(channel);
}

registerBuiltinChannels();
