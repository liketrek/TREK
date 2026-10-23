import { z } from 'zod';

/**
 * AI connections contract for /api/ai (a user's own provider) and /api/admin/ai
 * (the connection the instance provides for everyone, plus the assistant's
 * admin settings).
 *
 * A connection is a provider kind, a model and a sealed credential. The
 * credential never leaves the server: every view carries a `hint` (the last
 * characters of a key, or the e-mail of a ChatGPT account) instead. Two kinds
 * are bound to one side: `chatgpt` is a personal plan and never shared as the
 * instance connection, `custom` reaches an arbitrary base URL and is admin-only
 * (#1772). The server and the database both refuse the other combination.
 */

export const aiConnectionKindSchema = z.enum(['anthropic', 'openai', 'gemini', 'openrouter', 'chatgpt', 'custom']);
export type AiConnectionKind = z.infer<typeof aiConnectionKindSchema>;

/** The kinds a pasted API key can belong to. */
export const aiApiKeyKindSchema = z.enum(['anthropic', 'openai', 'gemini', 'openrouter']);
export type AiApiKeyKind = z.infer<typeof aiApiKeyKindSchema>;

/**
 * Who provides the connection: `instance` only the admin's, `instance_or_user`
 * the admin's unless a user connects their own, `user` everyone their own.
 */
export const aiPolicySchema = z.enum(['instance', 'instance_or_user', 'user']);
export type AiPolicy = z.infer<typeof aiPolicySchema>;

/** How long assistant chats are kept. Keeping them forever is its own mode, not a day count. */
export const aiRetentionSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('days'), days: z.number().int().min(1).max(3650) }),
  z.object({ mode: z.literal('forever') }),
]);
export type AiRetention = z.infer<typeof aiRetentionSchema>;

export const aiConnectionScopeSchema = z.enum(['instance', 'user']);
export type AiConnectionScope = z.infer<typeof aiConnectionScopeSchema>;

export const aiConnectionStatusSchema = z.enum(['ok', 'needs_reauth', 'signed_out', 'error']);
export type AiConnectionStatus = z.infer<typeof aiConnectionStatusSchema>;

/** One model a connection offers. Only models that can call tools are listed for the assistant. */
export const aiModelInfoSchema = z.object({
  id: z.string(),
  label: z.string(),
  supportsTools: z.boolean(),
  free: z.boolean().optional(),
  // The one a new connection starts on: the newest stable model of a capable line. Listed first.
  recommended: z.boolean().optional(),
  // Whether the model reads images (the Studio assistant's page image); left out where the list cannot say.
  supportsImages: z.boolean().optional(),
});
export type AiModelInfo = z.infer<typeof aiModelInfoSchema>;

/** A stored connection as the client sees it, without its credential. */
export const aiConnectionViewSchema = z.object({
  scope: aiConnectionScopeSchema,
  kind: aiConnectionKindSchema,
  model: z.string(),
  // "…a1b2" for a key, the account e-mail for ChatGPT; never the secret itself.
  hint: z.string().nullable(),
  status: aiConnectionStatusSchema,
  // The provider host the conversation goes to, named in the privacy notice.
  host: z.string(),
});
export type AiConnectionView = z.infer<typeof aiConnectionViewSchema>;

// ── User: /api/ai ───────────────────────────────────────────────────────────

/** GET /api/ai/status: whether the assistant can run for this user, and on whose connection. */
export const aiStatusResponseSchema = z.object({
  // False whenever no usable connection exists under the policy (fail-closed).
  available: z.boolean(),
  policy: aiPolicySchema,
  // policy !== 'instance' and not the demo user.
  canConnectOwn: z.boolean(),
  effective: z
    .object({
      source: aiConnectionScopeSchema,
      kind: aiConnectionKindSchema,
      model: z.string(),
      host: z.string(),
      paidBy: aiConnectionScopeSchema,
    })
    .nullable(),
  own: aiConnectionViewSchema.nullable(),
  instance: z.object({ kind: aiConnectionKindSchema, model: z.string(), host: z.string() }).nullable(),
  // Today's turns against the daily limit, only while the instance pays.
  quota: z.object({ used: z.number().int(), limit: z.number().int() }).nullable(),
  // Whether the user acknowledged that the effective kind@host receives their data.
  privacyAcked: z.boolean(),
  // Whether the user also let kind@host receive images of their Studio pages, with their own photos on them.
  studioImagesAcked: z.boolean().optional(),
  // Whether the model the effective connection runs on reads images (its name says so and no provider refused one for
  // it since the server started), so a Studio page can go as a picture.
  studioImages: z.boolean().optional(),
  retention: aiRetentionSchema,
  // OpenRouter's OAuth needs an https callback; without one the client offers the key field instead.
  openrouterOAuth: z.boolean(),
});
export type AiStatusResponse = z.infer<typeof aiStatusResponseSchema>;

/** PUT /api/ai/connection: saving tests the key against the provider's model list first. */
export const aiApiKeyConnectRequestSchema = z
  .object({
    kind: aiApiKeyKindSchema,
    apiKey: z.string().min(8).max(400),
    model: z.string().max(200).optional(),
  })
  .strict();
export type AiApiKeyConnectRequest = z.infer<typeof aiApiKeyConnectRequestSchema>;

/** PATCH /api/ai/connection/model */
export const aiModelUpdateRequestSchema = z.object({ model: z.string().min(1).max(200) }).strict();
export type AiModelUpdateRequest = z.infer<typeof aiModelUpdateRequestSchema>;

/** POST /api/ai/connect/chatgpt/finish: the loopback address the browser landed on after sign-in. */
export const aiChatgptFinishRequestSchema = z
  .object({
    flowId: z.uuid(),
    pastedUrl: z.string().max(4096),
  })
  .strict();
export type AiChatgptFinishRequest = z.infer<typeof aiChatgptFinishRequestSchema>;

/** POST /api/ai/connect/openrouter/start and /api/admin/ai/connect/openrouter/start */
export const aiOpenrouterStartRequestSchema = z.object({ scope: aiConnectionScopeSchema }).strict();
export type AiOpenrouterStartRequest = z.infer<typeof aiOpenrouterStartRequestSchema>;

/** POST /api/ai/connect/openrouter/finish */
export const aiOpenrouterFinishRequestSchema = z
  .object({
    flowId: z.uuid(),
    code: z.string().min(1).max(512),
  })
  .strict();
export type AiOpenrouterFinishRequest = z.infer<typeof aiOpenrouterFinishRequestSchema>;

/** The answer of every connect/<provider>/start: where to send the browser, and the flow to finish. */
export const aiAuthStartResponseSchema = z.object({
  flowId: z.uuid(),
  authorizeUrl: z.url(),
  expiresAt: z.string(),
});
export type AiAuthStartResponse = z.infer<typeof aiAuthStartResponseSchema>;

/** GET /api/ai/models, GET /api/admin/ai/models */
export const aiModelListResponseSchema = z.object({ models: z.array(aiModelInfoSchema) });
export type AiModelListResponse = z.infer<typeof aiModelListResponseSchema>;

/**
 * POST /api/ai/privacy-ack: the user saw that kind@host receives their
 * messages, or (`scope: 'studio_images'`) also images of their Studio pages.
 */
export const aiPrivacyAckRequestSchema = z
  .object({
    kind: aiConnectionKindSchema,
    host: z.string().max(253),
    scope: z.enum(['studio_images']).optional(),
  })
  .strict();
export type AiPrivacyAckRequest = z.infer<typeof aiPrivacyAckRequestSchema>;

// ── Admin: /api/admin/ai ────────────────────────────────────────────────────

// z.url() alone would accept javascript: and file:.
const httpUrl = z.url({ protocol: /^https?$/ });

const instanceApiKeyConnection = <K extends AiApiKeyKind>(kind: K) =>
  z
    .object({
      kind: z.literal(kind),
      apiKey: z.string().min(8).max(400),
      model: z.string().max(200).optional(),
    })
    .strict();

/** PUT /api/admin/ai/connection: a cloud key, or an OpenAI-compatible server of the admin's own. */
export const aiInstanceConnectionRequestSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('custom'),
      baseUrl: httpUrl.max(500),
      apiKey: z.string().max(400).optional(),
      model: z.string().min(1).max(200),
    })
    .strict(),
  instanceApiKeyConnection('anthropic'),
  instanceApiKeyConnection('openai'),
  instanceApiKeyConnection('gemini'),
  instanceApiKeyConnection('openrouter'),
]);
export type AiInstanceConnectionRequest = z.infer<typeof aiInstanceConnectionRequestSchema>;

/** What the AI parsing addon is configured with, offered to prefill the instance connection. */
export const aiParsingPrefillSchema = z.object({
  kind: aiConnectionKindSchema,
  baseUrl: z.string().nullable(),
  model: z.string(),
});
export type AiParsingPrefill = z.infer<typeof aiParsingPrefillSchema>;

/** GET /api/admin/ai/connection */
export const aiAdminConnectionResponseSchema = z.object({
  connection: aiConnectionViewSchema.extend({ baseUrl: z.string().nullable() }).nullable(),
  // Only while no instance connection exists and AI parsing is configured.
  prefill: aiParsingPrefillSchema.nullable(),
});
export type AiAdminConnectionResponse = z.infer<typeof aiAdminConnectionResponseSchema>;

/** GET and PUT /api/admin/ai/settings */
export const aiAdminSettingsSchema = z
  .object({
    policy: aiPolicySchema,
    dailyTurns: z.number().int().min(1).max(10000),
    retention: aiRetentionSchema,
  })
  .strict();
export type AiAdminSettings = z.infer<typeof aiAdminSettingsSchema>;

// ── Claude connector: /api/integrations/claude-connector ───────────────────

/** GET /api/integrations/claude-connector: adding TREK's MCP server in Claude, as a link and a QR code. */
export const aiClaudeConnectorResponseSchema = z.object({
  mcpUrl: z.url(),
  deepLink: z.url(),
  qrSvg: z.string(),
});
export type AiClaudeConnectorResponse = z.infer<typeof aiClaudeConnectorResponseSchema>;
