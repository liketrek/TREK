import { settingsCardOpenKey } from '../../src/components/Settings/settingsKit';

/** The photo services the settings tests connect, each its own card (`photos-<id>`). */
const PHOTO_PROVIDERS = ['immich', 'synology', 'piwigo', 'nextcloud', 'google'];

/** Every collapsible card of the integrations tab, by the id it is linked and remembered by. */
export const INTEGRATION_CARDS: readonly string[] = [
  'mail-import',
  'airtrail',
  'dawarich',
  'wanderer',
  'ai-connection',
  'ai-parsing',
  'api-keys',
  'mcp',
  ...PHOTO_PROVIDERS.map((id) => `photos-${id}`),
];

/**
 * Leaves settings cards open, as if their reader had left them so: a test then
 * reads into a card without clicking its head first. Storage is cleared after
 * every test (tests/setup.ts), so call it in a beforeEach.
 */
export function openSettingsCards(ids: readonly string[] = INTEGRATION_CARDS): void {
  for (const id of ids) localStorage.setItem(settingsCardOpenKey(id), '1');
}
