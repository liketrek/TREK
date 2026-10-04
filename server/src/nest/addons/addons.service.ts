import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ADDON_IDS } from '../../addons';
import { getPhotoProviderConfig } from '../memories/memories.helpers';
import { readTransitProvider, writeTransitProvider } from '../transit/transit-provider';
import { resolveApiKey, type ApiKeySource } from '../settings/instance-api-keys';
import { readEnv } from '../../app-config';
import type { TransitProvider } from '@trek/shared';
import { Addons } from '../../db/entities/Addons.entity';
import type { AddonsRepository } from '../../db/repositories/Addons.repository';
import { PhotoProviders } from '../../db/entities/PhotoProviders.entity';
import type { PhotoProvidersRepository, PhotoProviderRow } from '../../db/repositories/PhotoProviders.repository';
import { PhotoProviderFields } from '../../db/entities/PhotoProviderFields.entity';
import type { PhotoProviderFieldsRepository, PhotoProviderFieldRow } from '../../db/repositories/PhotoProviderFields.repository';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';

/**
 * Thin wrapper around the enabled-addons + photo-provider read that the legacy
 * inline `GET /api/addons` handler performed (server/src/app.ts). The
 * ordering, boolean coercions and the merged photo-provider entries are
 * reproduced 1:1 so the body is byte-identical for the client.
 *
 * Also the single owner of addon/feature-flag enablement state (moved verbatim
 * from services/adminService.ts, finding `admin-1`): isAddonEnabled plus the
 * bag-tracking and collab-features flags. The boolean polarities differ on
 * purpose — bag tracking is opt-in (`=== 'true'`, default OFF), the collab
 * sub-features are opt-out (`!== 'false'`, default ON). Reads are uncached
 * per-call repository calls so admin toggles stay immediately visible.
 *
 * `DatabaseService` was injected (Plan 3a Task 4) purely as a passthrough for
 * `transit-provider.ts`'s readTransitProvider/writeTransitProvider. Plan 4
 * Task 1 converted those two functions to take an `AppSettingsRepository`
 * instead, so this service passes its own already-injected
 * `AppSettingsRepository` (the same one `googleKeySource` below already
 * uses). Plan 4 Task 4 dropped the now-dead `DatabaseService` param entirely.
 */
@Injectable()
export class AddonsService {
  constructor(
    @InjectRepository(Addons) private readonly addons: AddonsRepository,
    @InjectRepository(PhotoProviders) private readonly photoProviders: PhotoProvidersRepository,
    @InjectRepository(PhotoProviderFields) private readonly photoProviderFields: PhotoProviderFieldsRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
  ) {}

  async isAddonEnabled(addonId: string): Promise<boolean> {
    return this.addons.isEnabled(addonId);
  }

  async getBagTracking() {
    const value = await this.appSettings.getValue('bag_tracking_enabled');
    return { enabled: value === 'true' };
  }

  async updateBagTracking(enabled: boolean) {
    await this.appSettings.setValue('bag_tracking_enabled', enabled ? 'true' : 'false');
    return { enabled: !!enabled };
  }

  /**
   * `AppSettingsRepository.getValues` drops a key from the returned `Map`
   * both when no row exists AND when the row's `value` is `NULL` (Task 0
   * concern #4) — this method's polarity (`!== 'false'`, fail-open) makes
   * that safe: a dropped key reads `map.get(key) === undefined`, and
   * `undefined !== 'false'` is `true`, the exact same outcome the legacy
   * `Record<string,string>` produced for a `NULL` value (`null !== 'false'`
   * is also `true`). Confirmed, not assumed — see the repository test
   * ADDONSREPO/APPSETREPO parity note and this service's own test file.
   */
  async getCollabFeatures() {
    const map = await this.appSettings.getValues([
      'collab_chat_enabled',
      'collab_notes_enabled',
      'collab_links_enabled',
      'collab_polls_enabled',
      'collab_whatsnext_enabled',
    ]);
    return {
      chat: map.get('collab_chat_enabled') !== 'false',
      notes: map.get('collab_notes_enabled') !== 'false',
      links: map.get('collab_links_enabled') !== 'false',
      polls: map.get('collab_polls_enabled') !== 'false',
      whatsnext: map.get('collab_whatsnext_enabled') !== 'false',
    };
  }

  /**
   * Ruling (plan §"Do not fix legacy behaviour"): the legacy handler wrote up
   * to 5 `app_settings` rows one at a time, with no transaction around them —
   * this stays exactly that way. `AppSettingsRepository.setValue` imposes no
   * transaction of its own (Task 0 concern #5), so the loop below is still 0
   * to 5 independent, individually-committed upserts.
   */
  async updateCollabFeatures(features: { chat?: boolean; notes?: boolean; links?: boolean; polls?: boolean; whatsnext?: boolean }) {
    const mapping: Record<string, string> = {
      chat: 'collab_chat_enabled',
      notes: 'collab_notes_enabled',
      links: 'collab_links_enabled',
      polls: 'collab_polls_enabled',
      whatsnext: 'collab_whatsnext_enabled',
    };
    const before = await this.getCollabFeatures();
    for (const [feat, key] of Object.entries(mapping)) {
      const value = features[feat as keyof typeof features];
      if (value !== undefined) await this.appSettings.setValue(key, value ? 'true' : 'false');
    }
    const after = await this.getCollabFeatures();
    // Collab flags gate MCP tool/resource registration, so callers must know
    // whether anything actually flipped — a no-op save must not tear down every
    // live MCP session (#1414).
    const changed = (Object.keys(after) as Array<keyof typeof after>).some((k) => after[k] !== before[k]);
    return { features: after, changed };
  }

  async list() {
    const addonRows = await this.addons.listEnabled();
    // Photo providers surface only inside journeys, so with the journey addon
    // off they are unavailable no matter what their own rows say. Deriving that
    // here (instead of a migration) also covers installs that still hold an
    // enabled provider under a disabled journey from before updateAddon
    // cascaded the disable.
    const providerRows: PhotoProviderRow[] = !(await this.isAddonEnabled(ADDON_IDS.JOURNEY))
      ? []
      : await this.photoProviders.listEnabled();
    const fieldRows: PhotoProviderFieldRow[] = await this.photoProviderFields.listAllOrdered();

    const fieldsByProvider = new Map<string, PhotoProviderFieldRow[]>();
    for (const field of fieldRows) {
      const arr = fieldsByProvider.get(field.provider_id) || [];
      arr.push(field);
      fieldsByProvider.set(field.provider_id, arr);
    }

    return {
      collabFeatures: await this.getCollabFeatures(),
      bagTracking: (await this.getBagTracking()).enabled,
      addons: [
        // The repository row carries every scalar column (description, config,
        // sort_order included); the legacy statement selected only these five,
        // so the client-facing shape is picked explicitly here rather than
        // spread from the row.
        ...addonRows.map((a) => ({ id: a.id, name: a.name, type: a.type, icon: a.icon, enabled: !!a.enabled })),
        ...providerRows.map((p) => ({
          id: p.id,
          name: p.name,
          type: 'photo_provider',
          icon: p.icon,
          enabled: !!p.enabled,
          config: getPhotoProviderConfig(p.id ?? ''),
          fields: (fieldsByProvider.get(p.id ?? '') || []).map((f) => ({
            key: f.field_key,
            label: f.label,
            input_type: f.input_type,
            placeholder: f.placeholder || '',
            hint: f.hint || null,
            required: !!f.required,
            secret: !!f.secret,
            settings_key: f.settings_key || null,
            payload_key: f.payload_key || null,
            sort_order: f.sort_order,
          })),
        })),
      ],
    };
  }

  // ── Places provider flags ──────────────────────────────────────────────────
  // These three sat as raw app_settings SQL on AdminService, next to the
  // bag-tracking and collab flags it already delegated here. They read
  // `=== 'true'` — fail-closed, matching getBagTracking(). They read
  // `!== 'false'` (fail-open) before the 2026-08 quirk fix; a migration
  // backfills 'true' for installs that never touched the switches, so nobody
  // loses a feature on upgrade.

  private async readFlag(key: string) {
    const value = await this.appSettings.getValue(key);
    return { enabled: value === 'true' };
  }

  private async writeFlag(key: string, enabled: boolean) {
    await this.appSettings.setValue(key, enabled ? 'true' : 'false');
    return { enabled: !!enabled };
  }

  async getPlacesPhotos() { return this.readFlag('places_photos_enabled'); }
  async updatePlacesPhotos(enabled: boolean) { return this.writeFlag('places_photos_enabled', enabled); }
  async getPlacesAutocomplete() { return this.readFlag('places_autocomplete_enabled'); }
  async updatePlacesAutocomplete(enabled: boolean) { return this.writeFlag('places_autocomplete_enabled', enabled); }
  async getPlacesDetails() { return this.readFlag('places_details_enabled'); }
  async updatePlacesDetails(enabled: boolean) { return this.writeFlag('places_details_enabled', enabled); }

  /**
   * The shadow log, fail-CLOSED like the three above but for the opposite
   * reason: they read `=== 'true'` because a migration backfilled a row for
   * installs that were already using the feature. Nothing is using this one,
   * so there is nothing to backfill and an absent row correctly means off.
   * PlaceShadowService.enabled() reads the same key the same way.
   */
  async getPlaceShadow() { return this.readFlag('place_shadow_enabled'); }
  async updatePlaceShadow(enabled: boolean) { return this.writeFlag('place_shadow_enabled', enabled); }

  /**
   * Search and suggestions from Google alone, skipping the index and
   * OpenStreetMap. Fail-closed for the same reason as the shadow log: nobody had
   * this before it existed, so an absent row correctly means off. MapsService
   * reads the same key the same way, and only once Google holds the key slot.
   */
  async getPlacesGoogleOnly() { return this.readFlag('places_google_only'); }
  async updatePlacesGoogleOnly(enabled: boolean) { return this.writeFlag('places_google_only', enabled); }

  /**
   * Enrichment reads fail-OPEN, unlike the three switches above.
   *
   * Those needed migration 185 to backfill 'true' precisely because they read
   * `=== 'true'`: without a row, an install that had been happily using the
   * feature would have lost it on upgrade. This switch is new, so there is no
   * row to backfill anywhere and no migration worth writing for one boolean —
   * reading it the other way round gets the same outcome for free.
   *
   * It has to agree with PlaceEnrichmentService.enrichDisabled(), which reads
   * the same key the same way. If these two ever disagree the admin panel shows
   * "off" while the feature runs, which is worse than either default.
   */
  async getPlacesEnrich() {
    const value = await this.appSettings.getValue('places_enrich_enabled');
    return { enabled: value !== 'false' };
  }

  async updatePlacesEnrich(enabled: boolean) { return this.writeFlag('places_enrich_enabled', enabled); }

  // ── Transit backend (#1699) ────────────────────────────────────────────────
  // Not a flag: two named backends, so it stores the name rather than a
  // boolean. The read/write pair lives in transit/transit-provider.ts because
  // TransitService reads the same row on every request — one key, one reader,
  // one writer. Neither that module nor instance-api-keys.ts (below) is one of
  // this plan's six domains, so they stay on DatabaseService until their own
  // conversion (transit is outside Plan 3a entirely; instance-api-keys.ts is
  // Task 5's).

  /**
   * Where the Google key would come from for this caller, or null if nowhere.
   *
   * Reported alongside the provider so the admin panel can say that picking
   * Google changed nothing. The fallback to Transitous is deliberate and
   * silent at request time (GoogleTransitProvider.isActive), which means the
   * only place it can be surfaced is here, before a search is ever run.
   *
   * The distinction between 'instance' and 'user-row' is the one that matters:
   * the resolver's last step is the caller's OWN row, so an admin holding a
   * personal key gets Google while every other member silently gets Transitous
   * — the #1939 shape, one layer up.
   */
  private async googleKeySource(userId: number): Promise<ApiKeySource | null> {
    return (await resolveApiKey(this.appSettings, this.users, 'maps_api_key', userId, readEnv().maps.placesApiKey)).source;
  }

  async getTransitProvider(userId = 0) {
    return { provider: await readTransitProvider(this.appSettings), googleKeySource: await this.googleKeySource(userId) };
  }

  async updateTransitProvider(provider: TransitProvider, userId = 0) {
    return { provider: await writeTransitProvider(this.appSettings, provider), googleKeySource: await this.googleKeySource(userId) };
  }
}
