import {
  aiAdminConnectionResponseSchema,
  aiAdminSettingsSchema,
  aiAuthStartResponseSchema,
  aiClaudeConnectorResponseSchema,
  aiConnectionViewSchema,
  aiModelListResponseSchema,
  aiStatusResponseSchema,
  type AiAdminSettings,
  type AiApiKeyConnectRequest,
  type AiChatgptFinishRequest,
  type AiConnectionScope,
  type AiInstanceConnectionRequest,
  type AiOpenrouterFinishRequest,
  type AiPrivacyAckRequest,
} from '@trek/shared';
import { aiAdminApi, aiApi, claudeConnectorApi } from '../api/assistant';
import { requireOnline } from './onlineOnly';

/**
 * AI connections: the user's own, the one the instance provides, and the
 * link that adds TREK to Claude.
 *
 * **Deliberately online-only, and no Dexie table.** A connection is a sealed
 * credential on the server; the client only ever sees a view of it, and every
 * action here needs the server (and usually the provider) to answer. Answers
 * are parsed against the shared schema rather than cast, so a server that
 * answered something else fails here, naming the field.
 */
export const aiConnectionsRepo = {
  async status() {
    requireOnline();
    return aiStatusResponseSchema.parse(await aiApi.status());
  },

  async models() {
    requireOnline();
    return aiModelListResponseSchema.parse(await aiApi.models()).models;
  },

  async connectKey(body: AiApiKeyConnectRequest) {
    requireOnline();
    return aiConnectionViewSchema.parse(await aiApi.connectKey(body));
  },

  async setModel(model: string) {
    requireOnline();
    return aiConnectionViewSchema.parse(await aiApi.setModel(model));
  },

  async disconnect(): Promise<void> {
    requireOnline();
    await aiApi.disconnect();
  },

  async ackPrivacy(body: AiPrivacyAckRequest): Promise<void> {
    requireOnline();
    await aiApi.ackPrivacy(body);
  },

  async chatgptStart(scope: AiConnectionScope = 'user') {
    requireOnline();
    return aiAuthStartResponseSchema.parse(await aiApi.chatgptStart(scope));
  },

  async chatgptFinish(body: AiChatgptFinishRequest) {
    requireOnline();
    return aiConnectionViewSchema.parse(await aiApi.chatgptFinish(body));
  },

  async chatgptSignOut(): Promise<void> {
    requireOnline();
    await aiApi.chatgptSignOut();
  },

  async openrouterStart(scope: AiConnectionScope) {
    requireOnline();
    return aiAuthStartResponseSchema.parse(await aiApi.openrouterStart(scope));
  },

  async openrouterFinish(body: AiOpenrouterFinishRequest) {
    requireOnline();
    return aiConnectionViewSchema.parse(await aiApi.openrouterFinish(body));
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async adminSettings() {
    requireOnline();
    return aiAdminSettingsSchema.parse(await aiAdminApi.settings());
  },

  async saveAdminSettings(body: AiAdminSettings) {
    requireOnline();
    return aiAdminSettingsSchema.parse(await aiAdminApi.saveSettings(body));
  },

  async adminConnection() {
    requireOnline();
    return aiAdminConnectionResponseSchema.parse(await aiAdminApi.connection());
  },

  async saveAdminConnection(body: AiInstanceConnectionRequest) {
    requireOnline();
    return aiAdminConnectionResponseSchema.parse(await aiAdminApi.saveConnection(body));
  },

  async removeAdminConnection(): Promise<void> {
    requireOnline();
    await aiAdminApi.removeConnection();
  },

  async adminModels() {
    requireOnline();
    return aiModelListResponseSchema.parse(await aiAdminApi.models()).models;
  },

  // ── Claude connector ───────────────────────────────────────────────────────

  async claudeConnector() {
    requireOnline();
    return aiClaudeConnectorResponseSchema.parse(await claudeConnectorApi.get());
  },
};
