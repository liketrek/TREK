import { PluginSettingsFields } from '../../db/entities/PluginSettingsFields.entity';
import { PluginUserConfig } from '../../db/entities/PluginUserConfig.entity';
import type { PluginSettingsFieldsRepository } from '../../db/repositories/PluginSettingsFields.repository';
import type { PluginUserConfigRepository } from '../../db/repositories/PluginUserConfig.repository';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { safeParseConfig } from './plugin-config-parse';
import { isFilled, settingDefaults } from './settings-defaults';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

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
  constructor(
    @InjectRepository(PluginSettingsFields) private readonly settingsFields: PluginSettingsFieldsRepository,
    @InjectRepository(PluginUserConfig) private readonly userConfig: PluginUserConfigRepository,
  ) {}

  /** One decrypted value for the acting user, for the runtime's `ctx.settings.get()`. */
  async readOne(pluginId: string, userId: number, key: string): Promise<unknown> {
    const isSecret = await this.settingsFields.isUserFieldSecret(pluginId, key); // PU1
    const value = (await this.storedFor(pluginId, userId))[key];
    if (value == null) return (await settingDefaults(this.settingsFields, pluginId, 'user'))[key]; // unset → the manifest default, if any
    return isSecret ? decrypt_api_key(value as string) : value;
  }

  /**
   * ALL of a plugin's per-user settings for one user, decrypted.
   *
   * This is how a notification-channel hook reaches the recipient's credentials: that
   * dispatch is host-initiated with no acting user, so `ctx.settings.get()` (which
   * resolves against the acting user) would return undefined there.
   */
  async readAll(pluginId: string, userId: number): Promise<Record<string, unknown>> {
    const fields = await this.settingsFields.listFieldKeysWithSecretFlag(pluginId, 'user');
    const stored = await this.storedFor(pluginId, userId);
    // Null-prototype for the same reason as safeParseConfig: never let a field key write
    // through to Object.prototype on the way out to the plugin.
    const out: Record<string, unknown> = Object.create(null);
    const defaults = await settingDefaults(this.settingsFields, pluginId, 'user');
    for (const field of fields) {
      const value = stored[field.field_key];
      if (value == null) {
        if (field.field_key in defaults) out[field.field_key] = defaults[field.field_key];
        continue;
      }
      out[field.field_key] = field.secret === 1 ? decrypt_api_key(value as string) : value;
    }
    return out;
  }

  /**
   * Has this user filled in every `required`, `scope:'user'` field the plugin declares?
   * A plugin with no required user fields is configured for everyone (an instance-wide
   * channel, e.g. a shared workspace webhook).
   *
   * Same "filled" rule as the save gate (PluginsService.assertRequiredFilled) — a
   * checkbox is exempt, whitespace is empty, a manifest default counts — because this is
   * what decides whether a channel dispatches to the user, and a save the form accepted
   * must not leave them "not configured".
   */
  async hasRequired(pluginId: string, userId: number): Promise<boolean> {
    const required = await this.settingsFields.listRequiredFieldKeys(pluginId, 'user');
    if (required.length === 0) return true;
    const stored = await this.storedFor(pluginId, userId);
    const defaults = await settingDefaults(this.settingsFields, pluginId, 'user');
    return required.every((key) => isFilled(stored[key] ?? defaults[key]));
  }

  private async storedFor(pluginId: string, userId: number): Promise<Record<string, unknown>> {
    const config = await this.userConfig.findConfig(pluginId, userId); // PU2 — reuses Task 2's PS7/PS9/PS11 method
    return safeParseConfig(config ?? '{}');
  }
}
