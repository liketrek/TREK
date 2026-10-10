/**
 * Who answers beside the index for one request: the keyed places provider and
 * the credential it spends.
 *
 * Search, autocomplete, nearby, details and the marker photo all start by
 * asking this: which provider holds the keyed slot (Google, Amap, or nobody so
 * the OpenStreetMap stack answers alone), whether the admin's "Google only"
 * switch applies, whether Amap answers first inside China, and which key a
 * Google or Amap call spends. MapsService orchestrates on top of the answer;
 * this class only resolves it, through the same app_settings and users rows
 * the key chain always read, in the same order.
 */
import { readEnv } from '../../app-config';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import { Users } from '../../db/entities/Users.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { GoogleQuotaService } from '../google-quota/google-quota.service';
import { resolveApiKey, type ApiKeySource } from '../settings/instance-api-keys';
import { AmapPlacesProvider, AmapTipStash, isAmapPlaceId } from './providers/amap.provider';
import { isPlacesProviderChoice, type PlacesProviderChoice } from './providers/places-provider';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { isOutsideChina } from '@trek/shared';

/**
 * The app_settings row that names the keyed places provider.
 *
 * A setting rather than "whichever key is configured": an install can hold both
 * credentials (a team split between China and elsewhere), and then only an
 * admin can say which one should answer. Absent, which is every install that
 * predates Amap, means `auto`, which keeps Google.
 */
export const PLACES_PROVIDER_SETTING = 'places_provider';
/**
 * The admin switch that hands search and suggestions to Google alone. Off, the
 * index and OpenStreetMap answer first and Google is only asked when they find
 * nothing, which is what every install has had since 4.3.0.
 */
export const PLACES_GOOGLE_ONLY_SETTING = 'places_google_only';

/**
 * Whoever holds the keyed slot beside the index for one request: Google's
 * credential, an Amap provider, or nobody (the OpenStreetMap stack alone).
 */
export type KeyedProvider =
  { id: 'google'; key: string; source: ApiKeySource | null } | { id: 'amap'; provider: AmapPlacesProvider };

@Injectable()
export class PlacesProviderSelector {
  constructor(
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository,
    private readonly googleQuota: GoogleQuotaService,
  ) {}

  /** Amap autocomplete tips for the details fallback. Here rather than on the provider:
   *  a provider is built per request, and a pick is two requests. */
  private readonly amapTips = new AmapTipStash();

  // ── API key retrieval ──────────────────────────────────────────────────────

  /**
   * The Places credential for this request, and where it came from.
   *
   * Operator env first: a per-user key would route around whatever the
   * operator's endpoint counts, and unset, that branch never runs. Then the
   * instance-wide value the admin panel writes, then the caller's own row.
   *
   * What is deliberately gone is the old third step, "any admin's key" (#1939):
   * it read a stranger's credential, which server/CLAUDE.md forbids, and made
   * the answer depend on who was asking — the saving admin got their own key,
   * everybody else got the lowest-id admin's and a 403 from Google. The source
   * is returned so a provider error can say which of the three was used.
   */
  async resolveMapsKey(userId: number): Promise<{ key: string | null; source: ApiKeySource | null }> {
    return resolveApiKey(this.appSettings, this.usersRepo, 'maps_api_key', userId, readEnv().maps.placesApiKey);
  }

  /**
   * The Google key to spend, or null. Also null once today's calls reached the
   * admin's daily ceiling (#1582), which makes every caller fall back to what a
   * keyless install does instead of failing.
   */
  async getMapsKey(userId: number): Promise<string | null> {
    if (await this.googleQuota.exhausted()) return null;
    return (await this.resolveMapsKey(userId)).key;
  }

  /** The Amap credential, resolved through the identical three-step chain. */
  async resolveAmapKey(userId: number): Promise<{ key: string | null; source: ApiKeySource | null }> {
    return resolveApiKey(this.appSettings, this.usersRepo, 'amap_api_key', userId, readEnv().maps.amapApiKey);
  }

  // ── Keyed provider selection ───────────────────────────────────────────────

  /**
   * Which keyed provider the admin picked, or `auto`.
   *
   * An unrecognised stored value degrades to `auto` rather than throwing: this
   * is read on the hot path of every search, and a hand-edited settings row must
   * not take place search down.
   */
  async placesProviderChoice(): Promise<PlacesProviderChoice> {
    const value = await this.appSettings.getValue(PLACES_PROVIDER_SETTING);
    return isPlacesProviderChoice(value) ? value : 'auto';
  }

  /**
   * Who holds the keyed slot for this request, or null for the OpenStreetMap
   * stack alone. The index and OpenStreetMap are asked either way; this only
   * decides what answers once they have nothing.
   *
   * `auto`, the default and what every install that predates Amap has, prefers
   * Google. That is deliberately the incumbent rather than "the newest provider
   * wins": an existing install must not silently start querying somewhere
   * else, with a different bill and different results, because a release added
   * a provider. An admin who wants Amap says so.
   *
   * Key resolution is ordered to match: under `auto` the Amap chain is only
   * walked when there is no Google key, so an install on Google issues exactly
   * the database reads it always did.
   */
  async keyedProvider(userId: number): Promise<KeyedProvider | null> {
    const choice = await this.placesProviderChoice();
    if (choice === 'openstreetmap') return null;

    if (choice !== 'amap') {
      const google = await this.resolveMapsKey(userId);
      // Past the daily ceiling (#1582) the key is spent for today: answer as if
      // there were none, so `auto` moves on and OpenStreetMap fills in.
      if (google.key && !(await this.googleQuota.exhausted()))
        return { id: 'google', key: google.key, source: google.source };
      // An explicit 'google' choice with no key is not a reason to query Amap
      // instead: this install is on Google and is misconfigured. OSM answers,
      // the way a keyless install has always been answered.
      if (choice === 'google') return null;
    }

    const amap = await this.resolveAmapKey(userId);
    return amap.key
      ? { id: 'amap', provider: new AmapPlacesProvider({ key: amap.key, source: amap.source, userId }, this.amapTips) }
      : null;
  }

  /**
   * Whether this search goes to Google and nowhere else.
   *
   * Two ways to ask for that, both born of the same moment: the index answered
   * a query with something that is not the place the traveller meant, and with
   * the index and OpenStreetMap answering first, Google was never consulted as
   * long as they found anything at all. The caller can send one search to
   * Google (`requested`, the "search Google instead" link under the results),
   * and the admin can make that the rule for every search and suggestion (the
   * switch beside the key). Either way it only holds when Google holds the key
   * slot: on an install without a Google key, or one that picked Amap or
   * OpenStreetMap, both change nothing, and the admin panel says so.
   *
   * Read after the keyed provider on purpose: that lookup already walked the
   * key chain, and a setting read ahead of it would shift the order of the
   * app_settings reads every test of the chain stubs by position.
   */
  async googleOnly(keyed: KeyedProvider | null, requested = false): Promise<boolean> {
    if (keyed?.id !== 'google') return false;
    if (requested) return true;
    return (await this.appSettings.getValue(PLACES_GOOGLE_ONLY_SETTING)) === 'true';
  }

  /**
   * Whether Amap answers before the index and OpenStreetMap (#1636): only when
   * the admin picked Amap outright, not when it holds the slot by default, and
   * only for a search centred inside China. Outside it Amap still answers, with
   * the wrong place (the Eiffel Tower lands in Macau), so the gate is the point,
   * not the provider.
   */
  async amapAnswersFirst(point?: { lat: number; lng: number }): Promise<boolean> {
    if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return false;
    return (await this.placesProviderChoice()) === 'amap' && !isOutsideChina(point.lat, point.lng);
  }

  /** The Amap provider, when Amap holds the keyed slot; null otherwise. */
  async resolvePlacesProvider(userId: number): Promise<AmapPlacesProvider | null> {
    const keyed = await this.keyedProvider(userId);
    return keyed?.id === 'amap' ? keyed.provider : null;
  }

  /**
   * The Amap provider for an `amap:` id, regardless of which provider is
   * currently selected.
   *
   * Places outlive the setting. An install that ran on Amap for a year and then
   * switches to Google still holds its `amap:` places, and every one of those
   * keeps opening against the Amap key that is still configured. Google ids do
   * not come through here at all: they take the Google provider, whose key is
   * resolved the same way.
   *
   * Null means nobody can resolve it: a Google id, or an Amap place on an
   * install that has since dropped its Amap key. Callers treat that as a miss,
   * not an error.
   */
  async providerForPlaceId(userId: number, placeId: string): Promise<AmapPlacesProvider | null> {
    if (!isAmapPlaceId(placeId)) return null;
    const amap = await this.resolveAmapKey(userId);
    return amap.key ? new AmapPlacesProvider({ key: amap.key, source: amap.source, userId }, this.amapTips) : null;
  }
}
