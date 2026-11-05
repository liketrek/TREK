import { decrypt_api_key, encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { UnitOfWork } from '../database/unit-of-work';
import { SettingsService } from '../settings/settings.service';
import { parseServiceKey, type ServiceKey } from './service-key.format';
import { Injectable } from '@nestjs/common';

import { z } from 'zod';

const keyStateSchema = z.object({
  /** Fingerprint of a key the services revoked; cleared only by an admin's new identity. */
  revoked: z.string().nullable().catch(null),
  /** Local epoch ms before which no new registration is tried, after a key was refused. */
  reregisterAt: z.number().nullable().catch(null),
  /** When the key is due for renewal, on the services' clock (unix seconds). */
  renewAfter: z.number().nullable().catch(null),
});

export type KeyState = z.infer<typeof keyStateSchema>;

export const EMPTY_KEY_STATE: KeyState = { revoked: null, reregisterAt: null, renewAfter: null };

export interface StoredIdentity {
  key: ServiceKey | null;
  /** A row is there but does not open with this ENCRYPTION_KEY, or does not read as a key. */
  unreadable: boolean;
  state: KeyState;
}

/**
 * The installation key in app_settings, encrypted like the other instance
 * secrets, and the small state record beside it. Nothing here talks to the
 * services; it only keeps what they handed out.
 */
@Injectable()
export class ServiceKeyStore {
  constructor(
    private readonly settings: SettingsService,
    private readonly uow: UnitOfWork,
  ) {}

  async read(): Promise<StoredIdentity> {
    const ciphertext = await this.settings.getAppSetting('service_key');
    const state = readState(await this.settings.getAppSetting('service_key_state'));
    if (!ciphertext) return { key: null, unreadable: false, state };
    const key = parseServiceKey(decrypt_api_key(ciphertext) ?? '');
    return { key, unreadable: key === null, state };
  }

  /**
   * Keeps a freshly issued key unless another process on this database stored
   * one first, then answers whatever is stored now.
   */
  async claim(key: ServiceKey, state: KeyState): Promise<StoredIdentity> {
    await this.uow.transactional(async () => {
      await this.settings.insertAppSettingIfAbsent('service_key', encrypt_api_key(key.token));
      await this.settings.setAppSettings({ service_key_state: JSON.stringify(state) });
    });
    return this.read();
  }

  /** Overwrites the stored key: a renewal, or a row that could not be read. */
  async replace(key: ServiceKey, state: KeyState): Promise<void> {
    await this.settings.setAppSettings({
      service_key: encrypt_api_key(key.token),
      service_key_state: JSON.stringify(state),
    });
  }

  async writeState(state: KeyState): Promise<void> {
    await this.settings.setAppSettings({ service_key_state: JSON.stringify(state) });
  }

  /** Forgets the key but keeps the state that says when to ask again. */
  async dropKey(state: KeyState): Promise<void> {
    await this.uow.transactional(async () => {
      await this.settings.deleteAppSettings(['service_key']);
      await this.writeState(state);
    });
  }

  async clear(): Promise<void> {
    await this.settings.deleteAppSettings(['service_key', 'service_key_state']);
  }
}

function readState(raw: string | null): KeyState {
  if (!raw) return EMPTY_KEY_STATE;
  try {
    return keyStateSchema.parse({ ...EMPTY_KEY_STATE, ...(JSON.parse(raw) as object) });
  } catch {
    return EMPTY_KEY_STATE;
  }
}
