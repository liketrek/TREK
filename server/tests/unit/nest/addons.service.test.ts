/**
 * Unit tests for AddonsService — rebuilt on real rows (Plan 3a Task 4).
 *
 * The legacy version of this file fully stubbed DatabaseService at the
 * `db.prepare` level (its `get`, `all` and `run`): a single shared fake `stmt` fed
 * canned rows *in call order* (three `.all()` reads for addons/providers/
 * fields, a `.get()` for the journey gate, and so on). That coupling cannot
 * survive AddonsService now calling four different repositories instead of
 * one shared prepared statement, so every case here runs against a real
 * in-memory SQLite DB (createTestOrm) and inserts the exact rows it needs.
 *
 * Two cases needed their INTENT re-expressed, not just their mechanics
 * (noted at each): the legacy `list()` SQL filters `WHERE enabled = 1` on
 * both `addons` and `photo_providers`, so a disabled row is never returned by
 * the real query — the old mocked tests fed a disabled row through anyway
 * (mocks don't enforce a WHERE clause) to prove the service's `!!enabled`
 * coercion handled `0`. That coercion is still real (and still asserted
 * directly, on `isAddonEnabled` and on an enabled row's boolean in `list()`),
 * but "list() returns a disabled addon/provider with enabled: false" is not a
 * reachable production behaviour, so those two cases now assert the WHERE
 * filter itself (the disabled row is excluded) alongside the boolean coercion
 * of the enabled row that remains.
 */
import { Addons } from '../../../src/db/entities/Addons.entity';
import { AppSettings } from '../../../src/db/entities/AppSettings.entity';
import { PhotoProviderFields } from '../../../src/db/entities/PhotoProviderFields.entity';
import { PhotoProviders } from '../../../src/db/entities/PhotoProviders.entity';
import { PlaceShadowPicks } from '../../../src/db/entities/PlaceShadowPicks.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import type { AddonsRepository } from '../../../src/db/repositories/Addons.repository';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { PhotoProviderFieldsRepository } from '../../../src/db/repositories/PhotoProviderFields.repository';
import type { PhotoProvidersRepository } from '../../../src/db/repositories/PhotoProviders.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { AddonsService } from '../../../src/nest/addons/addons.service';
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import { PlaceShadowService } from '../../../src/nest/place-shadow/place-shadow.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { deleteRows, findRow, insertRow, updateRows, upsertRow } from '../../helpers/factories/rows';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

const { getPhotoProviderConfig } = vi.hoisted(() => ({ getPhotoProviderConfig: vi.fn(() => ({})) }));
vi.mock('../../../src/nest/common/photo-provider-config', () => ({ getPhotoProviderConfig }));

const testDb = createSnapshotTestDb();
let t: TestOrm;
let addonsRepo: AddonsRepository;
let photoProvidersRepo: PhotoProvidersRepository;
let photoProviderFieldsRepo: PhotoProviderFieldsRepository;
let appSettingsRepo: AppSettingsRepository;
let usersRepo: UsersRepository;
let svc: AddonsService;

type ListAddon = Awaited<ReturnType<AddonsService['list']>>['addons'][number];

type PhotoProviderField = {
  key: string;
  label: string;
  input_type: string;
  placeholder: string;
  hint: string | null;
  required: boolean;
  secret: boolean;
  settings_key: string | null;
  payload_key: string | null;
  sort_order: number;
};

// list() spreads plain addons and photo providers into one array, and a provider
// object structurally extends a plain one. TypeScript reduces the element union
// to the plain shape, so `config` and `fields` are invisible on res.addons even
// though the provider entries carry them at runtime. Provider assertions read
// the fields through here instead of casting at every call site.
function providerFields(addon: ListAddon): PhotoProviderField[] {
  return (addon as ListAddon & { fields: PhotoProviderField[] }).fields;
}

async function insertAddon(row: {
  id: string;
  name: string;
  type?: string;
  icon?: string | null;
  enabled: 0 | 1;
  sort_order?: number;
}): Promise<void> {
  await insertRow(t, Addons, {
    id: row.id,
    name: row.name,
    description: null,
    type: row.type ?? 'global',
    icon: row.icon ?? null,
    enabled: row.enabled === 1,
    sort_order: row.sort_order ?? 0,
  });
}

/**
 * Stubs the journey gate `list()` checks before reading photo providers,
 * WITHOUT inserting a real 'journey' addons row. A real row is what the
 * migration seeds (`journey_addon.ts`) and is exactly what `isAddonEnabled`
 * should read in production — but inserting one here would also make it a
 * genuine, `enabled: true` member of `listEnabled()`'s own result (the same
 * WHERE-clause reality the file header's two re-expressed cases describe),
 * which would pollute every one of these provider/field-shape assertions
 * with an unrelated 'journey' entry. Spying on the one repository call the
 * gate makes keeps these tests about provider/field shaping, not about
 * `list()`'s addons array — that array is already covered by the addons-
 * focused cases above.
 */
function stubJourneyEnabled(): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(addonsRepo, 'isEnabled').mockImplementation(async (id: string) => id === 'journey');
}

async function insertProvider(row: {
  id: string;
  name: string;
  icon?: string | null;
  enabled: 0 | 1;
  sort_order?: number;
}): Promise<void> {
  await insertRow(t, PhotoProviders, {
    id: row.id,
    name: row.name,
    description: null,
    icon: row.icon ?? null,
    enabled: row.enabled,
    sort_order: row.sort_order ?? 0,
  });
}

async function insertField(row: {
  provider_id: string;
  field_key: string;
  label: string;
  input_type?: string;
  placeholder?: string | null;
  hint?: string | null;
  required?: 0 | 1;
  secret?: 0 | 1;
  settings_key?: string | null;
  payload_key?: string | null;
  sort_order?: number;
}): Promise<void> {
  await insertRow(t, PhotoProviderFields, {
    provider: row.provider_id,
    field_key: row.field_key,
    label: row.label,
    input_type: row.input_type ?? 'text',
    placeholder: row.placeholder ?? null,
    hint: row.hint ?? null,
    required: row.required ?? 0,
    secret: row.secret ?? 0,
    settings_key: row.settings_key ?? null,
    payload_key: row.payload_key ?? null,
    sort_order: row.sort_order ?? 0,
  });
}

async function setAppSetting(key: string, value: string | null): Promise<void> {
  await upsertRow(t, AppSettings, { key, value });
}

async function storedAppSetting(key: string): Promise<{ key: string; value: string | null } | undefined> {
  const row = await findRow(t, AppSettings, { key });
  return row ? { key: row.key!, value: row.value ?? null } : undefined;
}

beforeAll(async () => {
  t = await createTestOrm(testDb);
  addonsRepo = t.repo(Addons);
  photoProvidersRepo = t.repo(PhotoProviders);
  photoProviderFieldsRepo = t.repo(PhotoProviderFields);
  appSettingsRepo = t.repo(AppSettings);
  usersRepo = t.repo(Users);
});

beforeEach(() => {
  resetTestDb(testDb);
  // resetTestDb keeps the seeded addons/photo_providers/photo_provider_fields
  // catalogue (test-db.ts's KEEP_TABLES) — every case here wants a known,
  // empty starting point and inserts exactly the rows it needs.
  testDb.exec('DELETE FROM photo_provider_fields');
  testDb.exec('DELETE FROM photo_providers');
  testDb.exec('DELETE FROM addons');
  t.clear();
  getPhotoProviderConfig.mockReset();
  getPhotoProviderConfig.mockReturnValue({});
  svc = new AddonsService(
    addonsRepo,
    photoProvidersRepo,
    photoProviderFieldsRepo,
    appSettingsRepo,
    usersRepo,
    new UnitOfWork(t.em),
  );
});

afterEach(() => {
  // Restores stubJourneyEnabled's spy on addonsRepo.isEnabled (and the "drops
  // the photo providers" case's spy on photoProvidersRepo.listEnabled) so no
  // stub outlives the test that set it up.
  vi.restoreAllMocks();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('AddonsService.list', () => {
  it('returns the collab features and the bag-tracking flag from app_settings', async () => {
    await setAppSetting('collab_chat_enabled', 'false');
    await setAppSetting('bag_tracking_enabled', 'true');

    const res = await svc.list();
    expect(res.collabFeatures).toEqual({ chat: false, notes: true, links: true, polls: true, whatsnext: true });
    expect(res.bagTracking).toBe(true);
    expect(res.addons).toEqual([]);
  });

  // Re-expressed (see file header): the legacy WHERE enabled = 1 makes a
  // disabled row in list()'s output unreachable, so this now proves the
  // filter (the disabled row never surfaces) and the boolean coercion of the
  // enabled row that does (the entity's `enabled` is p.boolean(), so the
  // stored int comes back as a real JS boolean, not just truthy).
  it('only returns enabled addons, with the stored int coerced to a JS boolean', async () => {
    await insertAddon({ id: 'atlas', name: 'Atlas', type: 'page', icon: 'globe', enabled: 1 });
    await insertAddon({ id: 'vacay', name: 'Vacay', type: 'page', icon: 'sun', enabled: 0 });

    const res = await svc.list();
    expect(res.addons).toEqual([{ id: 'atlas', name: 'Atlas', type: 'page', icon: 'globe', enabled: true }]);
  });

  it('maps a photo provider with no fields to an empty fields array (the || [] fallback)', async () => {
    stubJourneyEnabled();
    await insertProvider({ id: 'immich', name: 'Immich', icon: 'image', enabled: 1 });
    getPhotoProviderConfig.mockReturnValue({ baseUrl: 'http://x' });

    const res = await svc.list();
    expect(res.addons).toEqual([
      {
        id: 'immich',
        name: 'Immich',
        type: 'photo_provider',
        icon: 'image',
        enabled: true,
        config: { baseUrl: 'http://x' },
        fields: [],
      },
    ]);
    expect(getPhotoProviderConfig).toHaveBeenCalledWith('immich');
  });

  // Re-expressed for the same reason as the addons case above: a disabled
  // photo_providers row is filtered out by listEnabled()'s WHERE clause, so
  // this now proves that filter alongside the enabled row's integer→boolean
  // coercion (photo_providers.enabled is p.integer(), not p.boolean() —
  // AddonsService does the `!!` itself, unlike the Addons entity above).
  it('only returns enabled photo providers, with the stored integer coerced to a JS boolean', async () => {
    stubJourneyEnabled();
    await insertProvider({ id: 'synology', name: 'Synology', icon: 'image', enabled: 1, sort_order: 1 });
    await insertProvider({ id: 'off-provider', name: 'Off', icon: 'image', enabled: 0, sort_order: 2 });

    const res = await svc.list();
    expect(res.addons.map((a) => (a as { id: string }).id)).toEqual(['synology']);
    expect((res.addons[0] as { enabled: boolean }).enabled).toBe(true);
  });

  it('groups multiple fields under their provider and keeps insertion order', async () => {
    stubJourneyEnabled();
    await insertProvider({ id: 'immich', name: 'Immich', icon: 'image', enabled: 1 });
    await insertField({
      provider_id: 'immich',
      field_key: 'url',
      label: 'URL',
      input_type: 'text',
      placeholder: 'https://',
      hint: 'Base URL',
      required: 1,
      secret: 0,
      settings_key: 'immich_url',
      payload_key: 'url',
      sort_order: 0,
    });
    // Second field for the SAME provider exercises the `get(...) || []` truthy branch.
    await insertField({
      provider_id: 'immich',
      field_key: 'token',
      label: 'Token',
      input_type: 'password',
      required: 0,
      secret: 1,
      sort_order: 1,
    });

    const res = await svc.list();
    expect(providerFields(res.addons[0])).toEqual([
      {
        key: 'url',
        label: 'URL',
        input_type: 'text',
        placeholder: 'https://',
        hint: 'Base URL',
        required: true,
        secret: false,
        settings_key: 'immich_url',
        payload_key: 'url',
        sort_order: 0,
      },
      {
        key: 'token',
        label: 'Token',
        input_type: 'password',
        placeholder: '',
        hint: null,
        required: false,
        secret: true,
        settings_key: null,
        payload_key: null,
        sort_order: 1,
      },
    ]);
  });

  it('falls back placeholder→"", hint→null, settings/payload keys→null when columns are missing/empty', async () => {
    stubJourneyEnabled();
    await insertProvider({ id: 'p', name: 'P', icon: 'i', enabled: 1 });
    await insertField({ provider_id: 'p', field_key: 'k', label: 'L' }); // placeholder/hint/settings_key/payload_key all null

    const res = await svc.list();
    const field = providerFields(res.addons[0])[0];
    expect(field).toMatchObject({
      placeholder: '',
      hint: null,
      settings_key: null,
      payload_key: null,
    });
  });

  it('keeps fields belonging to other providers out of a provider with none of its own', async () => {
    stubJourneyEnabled();
    // A field exists, but for a DIFFERENT provider than the one returned — exercises
    // the `fieldsByProvider.get(p.id) || []` fallback while the map is non-empty.
    await insertProvider({ id: 'has-none', name: 'X', icon: 'i', enabled: 1 });
    await insertProvider({ id: 'other', name: 'Other', icon: 'i', enabled: 0 }); // FK target for the field below
    await insertField({ provider_id: 'other', field_key: 'k', label: 'L' });

    const res = await svc.list();
    expect(providerFields(res.addons[0])).toEqual([]);
  });

  it('concatenates regular addons before the photo providers', async () => {
    stubJourneyEnabled();
    await insertAddon({ id: 'atlas', name: 'Atlas', type: 'page', icon: 'globe', enabled: 1 });
    await insertProvider({ id: 'immich', name: 'Immich', icon: 'image', enabled: 1 });

    const res = await svc.list();
    expect(res.addons.map((a) => (a as { id: string }).id)).toEqual(['atlas', 'immich']);
    expect((res.addons[1] as { type: string }).type).toBe('photo_provider');
  });

  it('drops the photo providers while the journey addon is off, whatever their rows say', async () => {
    // No 'journey' row at all — isAddonEnabled('journey') reads false, same as
    // the legacy `!!undefined`.
    await insertAddon({ id: 'atlas', name: 'Atlas', type: 'page', icon: 'globe', enabled: 1 });
    await insertProvider({ id: 'immich', name: 'Immich', icon: 'image', enabled: 1 });
    const listSpy = vi.spyOn(photoProvidersRepo, 'listEnabled');

    const res = await svc.list();
    expect(res.addons).toEqual([{ id: 'atlas', name: 'Atlas', type: 'page', icon: 'globe', enabled: true }]);
    expect(listSpy).not.toHaveBeenCalled();
    listSpy.mockRestore();
  });
});

// Direct coverage of the enablement reads/writers relocated from
// services/adminService (finding `admin-1`). The polarity asymmetry is on
// purpose: bag tracking is opt-in (=== 'true'), collab flags opt-out (!== 'false').
describe('AddonsService addon/feature flags', () => {
  it('isAddonEnabled coerces the enabled column (1/0/missing row)', async () => {
    await insertAddon({ id: 'budget', name: 'Budget', enabled: 1 });
    expect(await svc.isAddonEnabled('budget')).toBe(true);

    await updateRows(t, Addons, { id: 'budget' }, { enabled: false });
    expect(await svc.isAddonEnabled('budget')).toBe(false);

    expect(await svc.isAddonEnabled('nope')).toBe(false);
  });

  it('getBagTracking is opt-in: only the literal string true enables it', async () => {
    await setAppSetting('bag_tracking_enabled', 'true');
    expect(await svc.getBagTracking()).toEqual({ enabled: true });

    await setAppSetting('bag_tracking_enabled', 'false');
    expect(await svc.getBagTracking()).toEqual({ enabled: false });

    await deleteRows(t, AppSettings, { key: 'bag_tracking_enabled' });
    expect(await svc.getBagTracking()).toEqual({ enabled: false }); // absent row → OFF
  });

  it('updateBagTracking persists true/false strings and echoes the flag (ADMIN-SVC-030)', async () => {
    expect(await svc.updateBagTracking(true)).toEqual({ enabled: true });
    expect(await storedAppSetting('bag_tracking_enabled')).toEqual({ key: 'bag_tracking_enabled', value: 'true' });

    expect(await svc.updateBagTracking(false)).toEqual({ enabled: false });
    expect(await storedAppSetting('bag_tracking_enabled')).toEqual({ key: 'bag_tracking_enabled', value: 'false' });
  });

  it('getCollabFeatures is opt-out: absent rows default ON, only false disables', async () => {
    await setAppSetting('collab_chat_enabled', 'false');
    await setAppSetting('collab_polls_enabled', 'true');

    expect(await svc.getCollabFeatures()).toEqual({
      chat: false,
      notes: true,
      links: true,
      polls: true,
      whatsnext: true,
    });
  });

  it('updateCollabFeatures writes only the provided flags and reports changed (#1414, ADMIN-SVC-070)', async () => {
    const setValueSpy = vi.spyOn(appSettingsRepo, 'setValue');

    // before-read: all default ON; after-read: chat flipped off → changed
    const first = await svc.updateCollabFeatures({ chat: false });
    expect(first.changed).toBe(true);
    expect(first.features.chat).toBe(false);
    expect(setValueSpy).toHaveBeenCalledTimes(1);
    expect(setValueSpy).toHaveBeenCalledWith('collab_chat_enabled', 'false');
    expect(await storedAppSetting('collab_chat_enabled')).toEqual({ key: 'collab_chat_enabled', value: 'false' });

    // identical save → before and after read the same → no change, MCP sessions must survive
    setValueSpy.mockClear();
    const second = await svc.updateCollabFeatures({ chat: false });
    expect(second.changed).toBe(false);
    expect(setValueSpy).toHaveBeenCalledWith('collab_chat_enabled', 'false');

    // undefined flags are not written
    setValueSpy.mockClear();
    const third = await svc.updateCollabFeatures({});
    expect(third.changed).toBe(false);
    expect(setValueSpy).not.toHaveBeenCalled();

    setValueSpy.mockRestore();
  });

  it('updateCollabFeatures saves the flags together: a failing second write keeps the first one off disk', async () => {
    const setValue = appSettingsRepo.setValue.bind(appSettingsRepo);
    const setValueSpy = vi
      .spyOn(appSettingsRepo, 'setValue')
      .mockImplementationOnce(setValue)
      .mockRejectedValueOnce(new Error('disk full'));

    await expect(svc.updateCollabFeatures({ chat: false, notes: false })).rejects.toThrow('disk full');

    expect((await storedAppSetting('collab_chat_enabled'))?.value).not.toBe('false');
    expect(await svc.getCollabFeatures()).toEqual({
      chat: true,
      notes: true,
      links: true,
      polls: true,
      whatsnext: true,
    });
    setValueSpy.mockRestore();
  });
});

/**
 * The three places flags moved here from AdminService, where they were raw
 * app_settings SQL sitting next to flags that already delegated to this service.
 * They are fail-CLOSED (`=== 'true'`), matching getBagTracking: unset used to read as
 * ON (`!== 'false'`), and a migration backfills 'true' for existing installs so
 * nobody loses a feature on upgrade.
 */
describe('AddonsService places flags', () => {
  const cases = [
    ['getPlacesPhotos', 'updatePlacesPhotos', 'places_photos_enabled'],
    ['getPlacesAutocomplete', 'updatePlacesAutocomplete', 'places_autocomplete_enabled'],
    ['getPlacesDetails', 'updatePlacesDetails', 'places_details_enabled'],
  ] as const;

  it('ADDONS-SVC-080 an unset flag reads as OFF, and anything but the literal true does too', async () => {
    for (const [getter, , key] of cases) {
      await deleteRows(t, AppSettings, { key });
      expect(await svc[getter]()).toEqual({ enabled: false });

      await setAppSetting(key, 'garbage');
      expect(await svc[getter]()).toEqual({ enabled: false });
    }
  });

  it('ADDONS-SVC-081 a stored "true" reads as ON', async () => {
    for (const [getter, , key] of cases) {
      await setAppSetting(key, 'true');
      expect(await svc[getter]()).toEqual({ enabled: true });
    }
  });

  it('ADDONS-SVC-082 the setters persist the literal string and echo the boolean back', async () => {
    for (const [, setter, key] of cases) {
      expect(await svc[setter](true)).toEqual({ enabled: true });
      expect(await storedAppSetting(key)).toEqual({ key, value: 'true' });

      expect(await svc[setter](false)).toEqual({ enabled: false });
      expect(await storedAppSetting(key)).toEqual({ key, value: 'false' });
    }
  });
});

/**
 * Enrichment sits beside the three above and reads the opposite way round.
 *
 * They are fail-closed because a migration backfilled a row for every install
 * that predates the change. This one is new: there is nothing to backfill, so
 * fail-open reaches the same place without a migration for one boolean. What
 * matters is that it agrees with PlaceEnrichmentService.enrichDisabled(), which
 * reads the same key — if the two ever diverge the panel shows "off" while the
 * feature runs.
 */
describe('AddonsService places enrichment flag', () => {
  it('ADDONS-SVC-083 an unset flag reads as ON', async () => {
    expect(await svc.getPlacesEnrich()).toEqual({ enabled: true });
  });

  it('ADDONS-SVC-084 only the literal "false" switches it off', async () => {
    await setAppSetting('places_enrich_enabled', 'false');
    expect(await svc.getPlacesEnrich()).toEqual({ enabled: false });

    for (const value of ['true', 'garbage', '']) {
      await setAppSetting('places_enrich_enabled', value);
      expect(await svc.getPlacesEnrich()).toEqual({ enabled: true });
    }
  });

  it('ADDONS-SVC-085 the setter persists the literal string and echoes the boolean back', async () => {
    expect(await svc.updatePlacesEnrich(false)).toEqual({ enabled: false });
    expect(await storedAppSetting('places_enrich_enabled')).toEqual({ key: 'places_enrich_enabled', value: 'false' });

    expect(await svc.updatePlacesEnrich(true)).toEqual({ enabled: true });
    expect(await storedAppSetting('places_enrich_enabled')).toEqual({ key: 'places_enrich_enabled', value: 'true' });
  });
});

/**
 * The transit backend (#1699) is a name, not a flag, so it needs the
 * unrecognised-value case the booleans get for free: anything that is not a
 * known provider must read as Transitous rather than silently billing the
 * install's Google key.
 *
 * NOT one of this task's 11 app_settings/addons/photo_provider(_fields) sites
 * (transit-provider.ts and instance-api-keys.ts are other domains, out of this
 * plan's six) — still on DatabaseService, exercised here over the same real
 * connection every other case uses.
 */
describe('AddonsService transit provider', () => {
  it('ADDONS-SVC-086 an unset provider reads as Transitous, with no key anywhere', async () => {
    expect(await svc.getTransitProvider()).toEqual({ provider: 'transitous', googleKeySource: null });
  });

  it('ADDONS-SVC-087 only a known provider name is honoured', async () => {
    await setAppSetting('transit_provider', 'google');
    expect((await svc.getTransitProvider()).provider).toBe('google');

    for (const value of ['someday-maps', '', 'GOOGLE']) {
      await setAppSetting('transit_provider', value);
      expect((await svc.getTransitProvider()).provider).toBe('transitous');
    }
  });

  it('ADDONS-SVC-088 the setter persists the name and echoes it back', async () => {
    expect((await svc.updateTransitProvider('google')).provider).toBe('google');
    expect(await storedAppSetting('transit_provider')).toEqual({ key: 'transit_provider', value: 'google' });

    expect((await svc.updateTransitProvider('transitous')).provider).toBe('transitous');
    expect(await storedAppSetting('transit_provider')).toEqual({ key: 'transit_provider', value: 'transitous' });
  });

  /**
   * The warning the admin panel renders is driven entirely by this field, so
   * the instance/user-row split is the part worth pinning: only 'user-row'
   * means "works for this admin, Transitous for everybody else".
   */
  it('ADDONS-SVC-089 reports where the Google key resolved from', async () => {
    await setAppSetting('transit_provider', 'google');
    await setAppSetting('maps_api_key', 'instance-key');
    expect((await svc.getTransitProvider(7)).googleKeySource).toBe('instance');

    // No instance row, but the caller's own users column has one.
    await deleteRows(t, AppSettings, { key: 'maps_api_key' });
    const { user } = createUser(testDb);
    await updateRows(t, Users, { id: user.id }, { maps_api_key: 'personal-key' });
    expect((await svc.getTransitProvider(user.id)).googleKeySource).toBe('user-row');

    // Nothing anywhere.
    const { user: bareUser } = createUser(testDb);
    expect((await svc.getTransitProvider(bareUser.id)).googleKeySource).toBeNull();
  });
});

/**
 * The Google-only switch reads like the shadow log: nobody had it before it
 * existed, so an absent row is off, and MapsService.googleOnly() compares the
 * same key against the same literal.
 */
describe('AddonsService places Google-only flag', () => {
  it('ADDONS-SVC-095 an unset flag reads as OFF, only the literal "true" switches it on', async () => {
    expect(await storedAppSetting('places_google_only')).toBeUndefined();
    expect(await svc.getPlacesGoogleOnly()).toEqual({ enabled: false });
    for (const value of ['false', 'TRUE', '1', '']) {
      await setAppSetting('places_google_only', value);
      expect(await svc.getPlacesGoogleOnly()).toEqual({ enabled: false });
    }
    await setAppSetting('places_google_only', 'true');
    expect(await svc.getPlacesGoogleOnly()).toEqual({ enabled: true });
  });

  it('ADDONS-SVC-096 the setter persists the literal string under its own key', async () => {
    expect(await svc.updatePlacesGoogleOnly(true)).toEqual({ enabled: true });
    expect(await storedAppSetting('places_google_only')).toEqual({ key: 'places_google_only', value: 'true' });
    expect(await svc.updatePlacesGoogleOnly(false)).toEqual({ enabled: false });
    expect(await storedAppSetting('places_google_only')).toEqual({ key: 'places_google_only', value: 'false' });
  });
});

/**
 * The shadow log reads fail-CLOSED like the three flags above, for the opposite
 * reason: they need `=== 'true'` because a migration backfilled a row for
 * installs that were already using the feature. Nothing writes this key on
 * upgrade, so an absent row genuinely means off. It has to keep agreeing with
 * PlaceShadowService.enabled(), which reads the same key itself — if the two
 * diverge the admin panel shows "off" while the log keeps collecting picks.
 */
describe('AddonsService place shadow flag', () => {
  it('ADDONS-SVC-090 an unset flag reads as OFF, and so does every value but the literal "true"', async () => {
    expect(await svc.getPlaceShadow()).toEqual({ enabled: false });

    for (const value of ['false', 'TRUE', '1', '']) {
      await setAppSetting('place_shadow_enabled', value);
      expect(await svc.getPlaceShadow()).toEqual({ enabled: false });
    }
  });

  it('ADDONS-SVC-091 a stored "true" reads as ON', async () => {
    await setAppSetting('place_shadow_enabled', 'true');
    expect(await svc.getPlaceShadow()).toEqual({ enabled: true });
  });

  it('ADDONS-SVC-092 the setter round-trips through the getter under its own key', async () => {
    expect(await svc.updatePlaceShadow(true)).toEqual({ enabled: true });
    expect(await storedAppSetting('place_shadow_enabled')).toEqual({ key: 'place_shadow_enabled', value: 'true' });
    expect(await svc.getPlaceShadow()).toEqual({ enabled: true });
    // a sibling switch must not ride along
    expect(await svc.getPlacesDetails()).toEqual({ enabled: false });

    expect(await svc.updatePlaceShadow(false)).toEqual({ enabled: false });
    expect(await storedAppSetting('place_shadow_enabled')).toEqual({ key: 'place_shadow_enabled', value: 'false' });
    expect(await svc.getPlaceShadow()).toEqual({ enabled: false });
    // no sibling key was ever written
    expect(await storedAppSetting('places_details_enabled')).toBeUndefined();
  });

  it('ADDONS-SVC-093 answers the same as PlaceShadowService.enabled() for every stored value', async () => {
    const shadow = new PlaceShadowService(t.repo(PlaceShadowPicks), appSettingsRepo);
    const cases: Array<[string | undefined, boolean]> = [
      [undefined, false],
      ['true', true],
      ['false', false],
      ['garbage', false],
    ];

    for (const [value, expected] of cases) {
      if (value === undefined) await deleteRows(t, AppSettings, { key: 'place_shadow_enabled' });
      else await setAppSetting('place_shadow_enabled', value);

      expect(await svc.getPlaceShadow()).toEqual({ enabled: expected });
      expect(await shadow.enabled()).toBe(expected);
    }
  });
});
