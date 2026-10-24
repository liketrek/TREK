import { NATIVE_DOMAINS, type NativeRow } from '../../db/repositories/_shared/transfer-native-domains';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { Injectable } from '@nestjs/common';

/** Linked content keeps its own ACL: trip ownership never grants journal or personal-photo access. */
@Injectable()
export class TransferLinkedAccess {
  constructor(private readonly journeys: JourneyDomainService) {}
  async select(rows: Record<string, NativeRow[]>, user: number) {
    const allowed = new Set<number>();
    await rows.journeys.reduce(async (previous, row) => {
      await previous;
      if (await this.journeys.canAccessJourney(Number(row.id), user)) allowed.add(Number(row.id));
    }, Promise.resolve());
    const result = { ...rows };
    result.journeys = rows.journeys.filter((r) => allowed.has(Number(r.id)));
    result.journey_entries = rows.journey_entries.filter(
      (r) => allowed.has(Number(r.journey_id)) && ((!r.is_draft && r.visibility !== 'private') || r.author_id === user),
    );
    result.trip_photos = rows.trip_photos.filter((r) => r.shared === 1 || r.user_id === user);
    result.trip_album_links = rows.trip_album_links.filter((r) => r.user_id === user);
    // Other people's album credentials/metadata are not needed to read a specifically shared photo.
    result.trip_photos = result.trip_photos.map((r) => ({
      ...r,
      album_link_id: result.trip_album_links.some((a) => a.id === r.album_link_id) ? r.album_link_id : null,
    }));
    result.tags = rows.tags.filter((r) => r.user_id === user);
    result.place_tags = rows.place_tags.filter((r) => result.tags.some((t) => t.id === r.tag_id));
    result.journey_photos = rows.journey_photos.filter(
      (r) => allowed.has(Number(r.journey_id)) && (r.shared === 1 || r.owner_id === user),
    );
    // A photo used only by somebody else's private/draft entry must not escape through the gallery.
    const hiddenEntries = new Set(
      rows.journey_entries.filter((r) => !result.journey_entries.includes(r)).map((r) => r.id),
    );
    const hiddenPhotos = new Set(
      rows.journey_entry_photos.filter((r) => hiddenEntries.has(r.entry_id)).map((r) => r.journey_photo_id),
    );
    const visiblePhotos = new Set(
      rows.journey_entry_photos.filter((r) => !hiddenEntries.has(r.entry_id)).map((r) => r.journey_photo_id),
    );
    result.journey_photos = result.journey_photos.filter((r) => !hiddenPhotos.has(r.id) || visiblePhotos.has(r.id));
    // Drop children of inaccessible parents. References outside this selected graph remain a hard error elsewhere.
    for (let pass = 0; pass < NATIVE_DOMAINS.length; pass++) {
      let changed = false;
      for (const domain of NATIVE_DOMAINS) {
        if (!domain.table.startsWith('journey_')) continue;
        const selected = result[domain.table].filter((row) =>
          Object.entries(domain.references).every(
            ([column, parent]) => row[column] === null || result[parent].some((r) => r.id === row[column]),
          ),
        );
        if (selected.length !== result[domain.table].length) changed = true;
        result[domain.table] = selected;
      }
      if (!changed) break;
    }
    const photoIds = new Set([...result.trip_photos, ...result.journey_photos].map((r) => r.photo_id));
    result.trek_photos = rows.trek_photos.filter((r) => photoIds.has(r.id));
    return result;
  }
}
