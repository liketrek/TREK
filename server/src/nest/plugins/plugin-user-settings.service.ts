import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { safeParseConfig } from './plugin-config-parse';

/**
 * A plugin's per-user settings, decrypted host-side.
 *
 * These three reads used to be bare module-level functions in plugins.service.ts that
 * pulled the `db` singleton, with the comment "standalone (no Nest DI) so the RPC host
 * wiring can call it directly". That reason expired: the RPC host wiring is a set of
 * providers now, so they get injected like everything else, and there is no second
 * route to the database that a test cannot substitute.
 *
 * Nothing here is safe to send to a client — every method returns plaintext secrets.
 */
@Injectable()
export class PluginUserSettingsService {
  constructor(private readonly dbs: DatabaseService) {}

  private get db() {
    return this.dbs.connection;
  }

  /** One decrypted value for the acting user, for the runtime's `ctx.settings.get()`. */
  readOne(pluginId: string, userId: number, key: string): unknown {
    const isSecret =
      (
        this.db
          .prepare("SELECT secret FROM plugin_settings_fields WHERE plugin_id = ? AND field_key = ? AND scope = 'user'")
          .get(pluginId, key) as { secret: number } | undefined
      )?.secret === 1;
    const value = this.storedFor(pluginId, userId)[key];
    if (value == null) return undefined;
    return isSecret ? decrypt_api_key(value as string) : value;
  }

  /**
   * ALL of a plugin's per-user settings for one user, decrypted.
   *
   * This is how a notification-channel hook reaches the recipient's credentials: that
   * dispatch is host-initiated with no acting user, so `ctx.settings.get()` (which
   * resolves against the acting user) would return undefined there.
   */
  readAll(pluginId: string, userId: number): Record<string, unknown> {
    const fields = this.db
      .prepare("SELECT field_key, secret FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'user'")
      .all(pluginId) as Array<{ field_key: string; secret: number }>;
    const stored = this.storedFor(pluginId, userId);
    // Null-prototype for the same reason as safeParseConfig: never let a field key write
    // through to Object.prototype on the way out to the plugin.
    const out: Record<string, unknown> = Object.create(null);
    for (const field of fields) {
      const value = stored[field.field_key];
      if (value == null) continue;
      out[field.field_key] = field.secret === 1 ? decrypt_api_key(value as string) : value;
    }
    return out;
  }

  /**
   * Has this user filled in every `required`, `scope:'user'` field the plugin declares?
   * A plugin with no required user fields is configured for everyone (an instance-wide
   * channel, e.g. a shared workspace webhook).
   */
  hasRequired(pluginId: string, userId: number): boolean {
    const required = this.db
      .prepare("SELECT field_key FROM plugin_settings_fields WHERE plugin_id = ? AND scope = 'user' AND required = 1")
      .all(pluginId) as Array<{ field_key: string }>;
    if (required.length === 0) return true;
    const stored = this.storedFor(pluginId, userId);
    return required.every((field) => {
      const value = stored[field.field_key];
      return value != null && String(value) !== '';
    });
  }

  private storedFor(pluginId: string, userId: number): Record<string, unknown> {
    const row = this.db
      .prepare('SELECT config FROM plugin_user_config WHERE plugin_id = ? AND user_id = ?')
      .get(pluginId, userId) as { config: string } | undefined;
    return safeParseConfig(row?.config ?? '{}');
  }
}
