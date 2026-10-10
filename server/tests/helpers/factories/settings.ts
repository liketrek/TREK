import { Addons } from '../../../src/db/entities/Addons.entity';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { Settings } from '../../../src/db/entities/Settings.entity';
import type { FactoryOrm } from './context';
import { findRow, upsertRow } from './rows';

/** Writes an instance-wide setting (`app_settings`), replacing any earlier value. */
export async function setAppSetting(orm: FactoryOrm, key: string, value: string): Promise<void> {
  await upsertRow(orm, AppSettings, { key, value });
}

/** The instance-wide setting's value, or null when it is unset. */
export async function readAppSetting(orm: FactoryOrm, key: string): Promise<string | null> {
  return (await findRow(orm, AppSettings, { key }))?.value ?? null;
}

/** Writes one of the user's own settings (`settings`, unique per user and key), replacing any earlier value. */
export async function setUserSetting(orm: FactoryOrm, userId: number, key: string, value: string): Promise<void> {
  await upsertRow(orm, Settings, { user: userId, key, value });
}

/** The user's setting, or null when it is unset. */
export async function readUserSetting(orm: FactoryOrm, userId: number, key: string): Promise<string | null> {
  return (await findRow(orm, Settings, { user: userId, key }))?.value ?? null;
}

/**
 * Flips an addon the way the admin panel does. An addon the instance does not
 * know yet is created as a global one named after its id; an existing one
 * keeps its name, type and order and only changes `enabled`.
 */
export async function setAddonEnabled(orm: FactoryOrm, addonId: string, enabled: boolean): Promise<void> {
  await upsertRow(orm, Addons, { id: addonId, name: addonId, type: 'global', enabled }, ['enabled']);
}

/** Collab's chat, notes, polls and next-up panels are opt-out app settings, not addon rows. */
export async function setCollabFeature(
  orm: FactoryOrm,
  feature: 'chat' | 'notes' | 'polls' | 'whatsnext',
  enabled: boolean,
): Promise<void> {
  await setAppSetting(orm, `collab_${feature}_enabled`, enabled ? 'true' : 'false');
}
