import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { JourneyEntryPhotos } from '../../db/entities/JourneyEntryPhotos.entity';
import type { JourneyEntriesRepository } from '../../db/repositories/JourneyEntries.repository';
import type { JourneyEntryPhotosRepository } from '../../db/repositories/JourneyEntryPhotos.repository';
import { DomainError } from '../common/domain-error';
import { PhotoSignalsService } from '../photos/photo-signals.service';
import { JourneyBookService } from './journey-book.service';
import { JourneyDomainService } from './journey-domain.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  photosInScope,
  pickBookPhotos,
  type BookDocument,
  type BookPhotoSuggestions,
  type PhotoPickCandidate,
  type SuggestBookPhotosRequest,
} from '@trek/shared';

/**
 * `suggest_book_photos`: photos of a journey's gallery for a book page or
 * the cover, grouped by day and place, near duplicates folded onto the best
 * of them and the doubtful ones named, so the assistant picks from a short
 * list instead of the whole gallery.
 *
 * The picking is the shared `pickBookPhotos`; what needs I/O is here: the
 * journey's access (any member may ask, as anyone who sees the gallery may),
 * its entries and which photos they show, the photos the book has already,
 * and the pixel signals, which PhotoSignalsService measures off the event loop
 * and this waits for only so long. The photos an entry or a day narrows to go
 * first in that line; the rest of the gallery follows behind, unwaited, since
 * the journey's typical sharpness is taken over every photo measured so far.
 */
@Injectable()
export class JourneyBookPhotosService {
  constructor(
    private readonly journey: JourneyDomainService,
    private readonly books: JourneyBookService,
    private readonly signals: PhotoSignalsService,
    @InjectRepository(JourneyEntries) private readonly entriesRepo: JourneyEntriesRepository,
    @InjectRepository(JourneyEntryPhotos) private readonly entryPhotosRepo: JourneyEntryPhotosRepository,
  ) {}

  async suggest(journeyId: number, userId: number, args: SuggestBookPhotosRequest): Promise<BookPhotoSuggestions> {
    if (!(await this.journey.canAccessJourney(journeyId, userId))) {
      throw new DomainError(404, 'Journey not found', { mcpMessage: 'Journey not found or access denied.' });
    }
    const entries = await this.entriesRepo.listForJourney(journeyId);
    if (args.entryId !== undefined && !entries.some((e) => e.id === args.entryId)) {
      throw new DomainError(404, `No entry ${args.entryId} in this journey`, {
        code: 'entry_not_found',
        mcpMessage: `This journey has no entry ${args.entryId}: get_journey lists its entries.`,
      });
    }
    const links = await this.entryPhotosRepo.listForJourney(journeyId);
    const record = await this.books.getBook(journeyId, userId);
    const gallery = await this.signals.galleryFacts(journeyId);

    // Links to a dismissed entry are left out: get_journey does not list that entry either.
    const listed = new Set(entries.map((e) => e.id));
    const entriesOf = new Map<number, number[]>();
    for (const link of links) {
      if (listed.has(link.entry_id)) {
        entriesOf.set(link.photo_id, [...(entriesOf.get(link.photo_id) ?? []), link.entry_id]);
      }
    }
    const inBook = photosInBook(record?.document ?? null);
    const candidates: PhotoPickCandidate[] = gallery.map((p) => ({
      photoId: p.photo_id,
      takenAt: p.taken_at,
      lat: p.lat,
      lng: p.lng,
      width: p.width,
      height: p.height,
      caption: p.caption,
      entryIds: entriesOf.get(p.photo_id) ?? [],
      inBook: inBook.has(p.photo_id),
      signals: null,
    }));
    const pickEntries = entries.map((e) => ({
      id: e.id,
      date: e.entry_date,
      title: e.title ?? null,
      location: e.location_name ?? null,
      lat: e.location_lat ?? null,
      lng: e.location_lng ?? null,
    }));
    const scope = photosInScope(candidates, pickEntries, { entryId: args.entryId, date: args.date });
    const ids = candidates.map((c) => c.photoId);
    const asked = ids.filter((id) => scope.has(id));
    const rest = ids.filter((id) => !scope.has(id));
    const { byPhoto, pending } = await this.signals.signalsFor(asked, { later: rest });
    const measured = candidates.map((c) => ({ ...c, signals: byPhoto.get(c.photoId) ?? null }));
    return pickBookPhotos(measured, pickEntries, {
      entryId: args.entryId,
      date: args.date,
      purpose: args.purpose,
      limit: args.limit,
      signalsPending: pending,
    });
  }
}

/**
 * The photos the book shows in a frame, placed or parked. A map marker's
 * photo is not counted: a pin's thumbnail is not the photo printed on a page.
 */
function photosInBook(doc: BookDocument | null): Set<number> {
  const ids = new Set<number>();
  for (const spread of doc?.spreads ?? []) {
    for (const element of [...spread.elements, ...spread.parked]) {
      if (element.kind === 'photo' && element.photoId != null) ids.add(element.photoId);
    }
  }
  return ids;
}
