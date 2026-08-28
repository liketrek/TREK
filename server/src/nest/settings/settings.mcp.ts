import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { MASKED_SETTING_VALUE, SUPPORTED_LANGUAGE_CODES, settingsBulkRequestSchema } from '@trek/shared';
import { AuthService } from '../auth/auth.service';
import { SettingsService } from './settings.service';

/**
 * The only settings keys this surface may read or write.
 *
 * An allow-list rather than a deny-list, because `settings` is one flat
 * key/value table that also holds credentials: ENCRYPTED_SETTING_KEYS in
 * settings.service.ts covers webhook_url, ntfy_token, mapbox_access_token,
 * carto_api_key and llm_api_key, and getUserSettings masks only three of those
 * and hands the rest back decrypted. Exposing that accessor as a tool would
 * turn a `settings:read` token into a credential reader. A deny-list would put
 * the burden on whoever adds the next secret key to remember this file; an
 * allow-list leaves anything new invisible until somebody names it here.
 *
 * The membership is what DisplaySettingsTab.tsx offers, plus dark_mode (its
 * own control, in AppearanceSettingsTab and the navbar theme toggle). Keys from
 * DEFAULTABLE_USER_SETTING_KEYS that are credentials or renderer plumbing
 * (map_tile_url, map_provider, mapbox_*, maplibre_style, llm_*, carto_api_key)
 * are left off on purpose: they configure the install, not how a person reads
 * a temperature, and every one of them is on MANAGED_LOCKED_SETTING_KEYS or
 * next to something that is.
 *
 * Each value schema is at most as permissive as what the REST route stores
 * today, which validates nothing here. Narrowing is deliberate: a model gets a
 * refusal it can act on instead of parking 'kelvin' in a row the client then
 * silently ignores.
 */
const DISPLAY_PREFERENCES = {
  start_page: z.enum(['dashboard', 'active_trip']),
  // The planner falls back to its plan view for a tab that does not exist, and
  // trip-page plugins are addressable as `plugin:<id>`, so the id set is not
  // closed. Core ids are named in the tool description instead.
  start_trip_tab: z.string().min(1).max(64),
  default_currency: z.union([z.literal(''), z.string().regex(/^[A-Z]{3}$/, 'Expected a three-letter uppercase ISO 4217 code, e.g. EUR, or "" to clear it')]),
  language: z.string().refine(
    (value) => SUPPORTED_LANGUAGE_CODES.includes(value),
    { message: `Expected one of: ${SUPPORTED_LANGUAGE_CODES.join(', ')}` },
  ),
  temperature_unit: z.enum(['celsius', 'fahrenheit']),
  distance_unit: z.enum(['metric', 'imperial']),
  time_format: z.enum(['12h', '24h']),
  // Booleans are the pre-'auto' form and still sit in older rows, so they stay
  // writable: this is exactly the VALID_VALUES.dark_mode set the admin-defaults
  // path accepts, and refusing them here would make a value TREK itself wrote
  // unwritable through this tool.
  dark_mode: z.union([z.enum(['light', 'dark', 'auto']), z.boolean()]),
  map_booking_labels: z.boolean(),
  map_always_show_routes: z.boolean(),
  map_poi_pill_enabled: z.boolean(),
  blur_booking_codes: z.boolean(),
  optimize_from_accommodation: z.boolean(),
} satisfies Record<string, z.ZodType>;

type DisplayPreferenceKey = keyof typeof DISPLAY_PREFERENCES;

export const DISPLAY_PREFERENCE_KEYS = Object.keys(DISPLAY_PREFERENCES) as DisplayPreferenceKey[];

// Set rather than `key in DISPLAY_PREFERENCES`: `in` walks the prototype chain,
// so 'toString' and 'constructor' would both pass for an object literal.
const ALLOWED = new Set<string>(DISPLAY_PREFERENCE_KEYS);

const KEY_LIST = DISPLAY_PREFERENCE_KEYS.join(', ');

/**
 * Settings MCP surface: the display half of /api/settings, and nothing else.
 *
 * New surface rather than a port, so there is no legacy registrar to match.
 * It exists because an assistant had no way to learn whether the person it is
 * answering reads celsius or fahrenheit, kilometres or miles, 24h or 12h: the
 * session instructions name the trip currency and nothing more, so every
 * rendered temperature and distance was a guess.
 *
 * Both tools are user-scoped, like the routes they mirror (JwtAuthGuard, no
 * trip in the path), so the trip-access/permission pair does not apply. The
 * write carries the demo gate the other write tools carry.
 *
 * The controller's own two refusals stay out of reach by construction rather
 * than by being repeated: assertMayWriteLlmEndpoint guards llm_base_url and
 * llm_provider, and isManagedLockedKey guards the operator-owned keys, and not
 * one name from either list is on the allow-list above. tools-settings.test.ts
 * asserts that intersection is empty instead of trusting the reading.
 */
@McpController()
export class SettingsMcp {
  constructor(
    private readonly settings: SettingsService,
    private readonly auth: AuthService,
  ) {}

  /**
   * getUserSettings resolves admin defaults and the managed-install token
   * injection before this filter runs, so the caller sees the same effective
   * value the web UI does, minus everything not named on the allow-list.
   */
  private readDisplayPreferences(userId: number): Record<string, unknown> {
    const all = this.settings.getUserSettings(userId);
    const picked: Record<string, unknown> = {};
    for (const key of DISPLAY_PREFERENCE_KEYS) {
      if (Object.hasOwn(all, key)) picked[key] = all[key];
    }
    return picked;
  }

  @Tool({
    name: 'get_display_settings',
    description: `Read the current user's display preferences: ${KEY_LIST}. Call this before rendering a temperature, a distance, a time of day or an amount, so the answer matches what the person sees inside TREK instead of being guessed, and call it before update_display_settings whenever the request is relative ("switch me back", "use the other unit"). Only keys that are actually set are returned; TREK's own fallbacks for the rest are celsius, metric, 24h, language en, start_page dashboard, start_trip_tab plan, and no personal default currency, which means amounts fall back to the currency of the trip they belong to. Stored credentials (map tokens, LLM API keys, webhook URLs, SMTP) are deliberately not part of this surface and never appear in the result.`,
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'settings', mode: 'read' },
  })
  async getDisplaySettings(_input: Record<string, never>, ctx: McpContext) {
    return ok({ settings: this.readDisplayPreferences(ctx.userId) });
  }

  @Tool({
    name: 'update_display_settings',
    description: `Change one or more of the current user's display preferences. Pass a settings object holding only the keys to change; anything left out keeps its current value. Writable keys: ${KEY_LIST}. start_page is dashboard or active_trip, start_trip_tab is one of plan, transports, buchungen, listen, finanzplan, dateien, collab (the ids are the planner's internal German ones) or plugin:<id> for a plugin tab, default_currency is a three-letter ISO code or "" to fall back to each trip's own currency, dark_mode is light, dark or auto. Every other key is refused, including API keys, map tokens, LLM endpoint settings and SMTP: those belong to the account owner or to whoever operates the instance and are set in TREK itself, not here. Prefer get_display_settings when you only need to read a value.`,
    inputSchema: {
      settings: settingsBulkRequestSchema.shape.settings
        .describe(`Object of preference key to new value, e.g. {"temperature_unit": "fahrenheit", "distance_unit": "imperial"}. At least one key, and every key must be one of: ${KEY_LIST}.`),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'settings', mode: 'write' },
  })
  async updateDisplaySettings({ settings }: { settings: Record<string, unknown> }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();

    const entries = Object.entries(settings);
    if (entries.length === 0) {
      return errorResult(`No preference given. Pass at least one of: ${KEY_LIST}.`);
    }

    const rejected = entries.map(([key]) => key).filter((key) => !ALLOWED.has(key));
    if (rejected.length > 0) {
      return errorResult(`Not a display preference: ${rejected.join(', ')}. This tool writes only ${KEY_LIST}. Credentials and instance configuration (API keys, map tokens, LLM endpoints, SMTP) are not reachable from MCP at all.`);
    }

    // Everything is validated before anything is written, so a bad key in a
    // multi-key call cannot leave half the preferences changed. The service
    // wraps its own writes in a transaction, but it never sees this call.
    const validated: Record<string, unknown> = {};
    for (const [key, value] of entries) {
      // The client echoes redacted secrets back as this sentinel and
      // bulkUpsertSettings skips them, which for a display preference would be
      // a silent no-op rather than the refusal a caller can learn from.
      if (value === MASKED_SETTING_VALUE) {
        return errorResult(`Invalid value for ${key}: ${MASKED_SETTING_VALUE} is the placeholder TREK shows in place of a redacted secret, not a value.`);
      }
      const parsed = DISPLAY_PREFERENCES[key as DisplayPreferenceKey].safeParse(value);
      if (!parsed.success) {
        const reason = parsed.error.issues[0]?.message ?? 'not accepted';
        return errorResult(`Invalid value for ${key}: ${JSON.stringify(value)}. ${reason}`);
      }
      validated[key] = parsed.data;
    }

    const updated = this.settings.bulkUpsertSettings(ctx.userId, validated);
    // Read back rather than echoing the input: an admin default or the managed
    // token injection can still shape what the user ends up seeing.
    return ok({ success: true, updated, settings: this.readDisplayPreferences(ctx.userId) });
  }
}
