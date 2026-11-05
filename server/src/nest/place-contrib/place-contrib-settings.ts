import {
  PLACES_CONTRIBUTE_BACKFILL,
  PLACES_CONTRIBUTE_CONSENT,
  PLACES_CONTRIBUTE_PAUSE,
  PLACES_CONTRIBUTE_SNOOZE,
  type PlacesContributeBackfill,
  type PlacesContributePause,
} from '../../db/json-columns';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { servicesConfig } from '../app-config/tokens';
import { SettingsService } from '../settings/settings.service';
import { PlaceContribClient } from './place-contrib.client';
import { CONTRIB_ORIGIN } from './place-contrib.constants';
import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import {
  PLACE_CONTRIB_FIELDS,
  PLACE_CONTRIB_TERMS_VERSION,
  type PlaceContribConsent,
  type PlaceContribField,
  type PlaceContribIneligibleReason,
  type PlaceContribPauseReason,
} from '@trek/shared';

/** Where an installation stands before any admin decision: whether it may send at all, and if not, why. */
type Eligibility = { eligible: true; reason: null } | { eligible: false; reason: PlaceContribIneligibleReason };

/**
 * The stored side of the community enrichment: the admin's decision, the
 * per-admin snooze and the pause, all in app_settings, and whether this
 * installation may send at all.
 *
 * Eligibility is not stored. It follows the deployment, read live: the
 * TREK_PLACES_CONTRIBUTE ceiling, a production instance that is no demo, the
 * index on and at the public address, TREK_SERVICES on and a key in hand.
 * Development, test and demo instances never send, whatever an admin chose.
 */
@Injectable()
export class PlaceContribSettings {
  constructor(
    private readonly settings: SettingsService,
    private readonly env: RuntimeEnvService,
    @Inject(servicesConfig.KEY) private readonly services: ConfigType<typeof servicesConfig>,
    private readonly client: PlaceContribClient,
  ) {}

  ceiling(): 'off' | 'admin' {
    return this.env.env().maps.trekPlacesContribute;
  }

  eligibility(): Eligibility {
    const maps = this.env.env().maps;
    const reason = ((): PlaceContribIneligibleReason | null => {
      if (maps.trekPlacesContribute !== 'admin') return 'env_off';
      if (!this.env.isProduction()) return 'not_production';
      if (this.env.isDemoMode()) return 'demo';
      if (!maps.trekPlacesEnabled) return 'index_off';
      if (customPlacesUrl(maps.trekPlacesUrl)) return 'custom_places_url';
      if (this.services.mode === 'off') return 'services_off';
      if (!this.client.hasKey()) return 'no_key';
      return null;
    })();
    return reason === null ? { eligible: true, reason: null } : { eligible: false, reason };
  }

  async consent(): Promise<PlaceContribConsent> {
    return decodeJson(PLACES_CONTRIBUTE_CONSENT, await this.settings.getAppSetting('places_contribute'), 'consent');
  }

  async writeConsent(consent: PlaceContribConsent): Promise<void> {
    await this.settings.setAppSettings({ places_contribute: encodeJson(PLACES_CONTRIBUTE_CONSENT, consent) });
  }

  /** The fields an agreement to the current terms switches on; none without one. */
  async activeFields(): Promise<PlaceContribField[]> {
    if (!this.eligibility().eligible) return [];
    const consent = await this.consent();
    if (!agreedToCurrentTerms(consent)) return [];
    return PLACE_CONTRIB_FIELDS.filter((field) => consent.fields[field]);
  }

  async snoozedUntil(adminId: number, now: Date): Promise<string | null> {
    const until = (await this.snoozes())[String(adminId)] ?? null;
    return until && Date.parse(until) > now.getTime() ? until : null;
  }

  async snooze(adminId: number, until: Date): Promise<void> {
    const snoozes = { ...(await this.snoozes()), [String(adminId)]: until.toISOString() };
    await this.settings.setAppSettings({ places_contribute_snooze: encodeJson(PLACES_CONTRIBUTE_SNOOZE, snoozes) });
  }

  /** The pause in force now: a refused key until there is another one, the service's wait until it ends. */
  async pauseReason(now: Date): Promise<PlaceContribPauseReason | null> {
    const pause = await this.pause();
    if (!pause) return null;
    if (pause.reason === 'not_accepting')
      return pause.until && Date.parse(pause.until) > now.getTime() ? pause.reason : null;
    return pause.key === this.client.keyFingerprint() ? pause.reason : null;
  }

  async pauseFor(reason: PlaceContribPauseReason, until: Date | null): Promise<void> {
    const pause: PlacesContributePause = {
      reason,
      key: reason === 'not_accepting' ? null : this.client.keyFingerprint(),
      until: until?.toISOString() ?? null,
    };
    await this.settings.setAppSettings({ places_contribute_pause: encodeJson(PLACES_CONTRIBUTE_PAUSE, pause) });
  }

  async clearPause(): Promise<void> {
    await this.settings.deleteAppSettings(['places_contribute_pause']);
  }

  /** How far the catch-up of values typed before the agreement got; null when there is nothing to catch up. */
  async backfill(): Promise<PlacesContributeBackfill | null> {
    return decodeJson(
      PLACES_CONTRIBUTE_BACKFILL,
      await this.settings.getAppSetting('places_contribute_backfill'),
      'backfill',
    );
  }

  /** Stores where the catch-up stands, or ends it with null. */
  async writeBackfill(backfill: PlacesContributeBackfill | null): Promise<void> {
    if (backfill === null) {
      await this.settings.deleteAppSettings(['places_contribute_backfill']);
      return;
    }
    await this.settings.setAppSettings({
      places_contribute_backfill: encodeJson(PLACES_CONTRIBUTE_BACKFILL, backfill),
    });
  }

  private async snoozes(): Promise<Record<string, string>> {
    return decodeJson(
      PLACES_CONTRIBUTE_SNOOZE,
      await this.settings.getAppSetting('places_contribute_snooze'),
      'snooze',
    );
  }

  private async pause(): Promise<PlacesContributePause | null> {
    return decodeJson(PLACES_CONTRIBUTE_PAUSE, await this.settings.getAppSetting('places_contribute_pause'), 'pause');
  }
}

/** Whether a decision is a standing agreement to the terms in force. */
export function agreedToCurrentTerms(consent: PlaceContribConsent): boolean {
  return consent.enabled && consent.decision === 'agreed' && consent.termsVersion === PLACE_CONTRIB_TERMS_VERSION;
}

/** An own TREK_PLACES_URL: anything but unset or the public instance itself. */
function customPlacesUrl(configured: string | undefined): boolean {
  const url = configured?.trim().replace(/\/+$/, '');
  return !!url && url !== CONTRIB_ORIGIN;
}
