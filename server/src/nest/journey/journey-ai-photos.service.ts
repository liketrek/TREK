import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import type { JourneyPhotosRepository } from '../../db/repositories/JourneyPhotos.repository';
import { DomainError } from '../common/domain-error';
import { JourneyDomainService } from './journey-domain.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * Which photos of a journey's gallery the Studio assistant may show a model
 * that reads images, for the user asking (journey-studio.md 3.4).
 *
 * TREK cannot tell who is in a photo; it knows who contributed it. So the
 * rule is strict: only the photos the asking user contributed, as
 * `trek_photos.owner_id` says, with the journey's owner standing in for a
 * photo that names nobody (the fallback the photo proxy uses). Every other
 * photo is drawn as an empty frame before the page is rasterised, and an
 * uploaded page image that says it shows one is refused.
 */
@Injectable()
export class JourneyAiPhotosService {
  constructor(
    private readonly journey: JourneyDomainService,
    @InjectRepository(JourneyPhotos) private readonly photosRepo: JourneyPhotosRepository,
  ) {}

  /** The gallery photos the user contributed; refused like the journey routes for a journey they cannot open. */
  async ownPhotoIds(journeyId: number, userId: number): Promise<Set<number>> {
    const journey = await this.journey.canAccessJourney(journeyId, userId);
    if (!journey) {
      throw new DomainError(404, 'Journey not found', { mcpMessage: 'Journey not found or access denied.' });
    }
    const gallery = await this.photosRepo.galleryRead(journeyId);
    return new Set(gallery.filter((p) => (p.owner_id || journey.user_id) === userId).map((p) => p.photo_id));
  }
}
