import { Journeys } from '../../db/entities/Journeys.entity';
import type { JourneysRepository } from '../../db/repositories/Journeys.repository';
import type { Journey } from '../../types';
import { UnitOfWork } from '../database/unit-of-work';
import { StorageReleaseService } from '../storage/storage-release.service';
import { JourneyDomainService } from './journey-domain.service';
import {
  journeySettingsPatch,
  previousSettings,
  type JourneySettingsInput,
  type JourneySettingsPrevious,
} from './journey-settings.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/** A settings update as the MCP tool answers it: the journey as stored now, and what the update replaced. */
interface JourneySettingsUpdate {
  journey: Journey;
  previous: JourneySettingsPrevious;
}

/**
 * A journey's own settings changed with what they held before: the update
 * the REST route makes (JourneyDomainService.updateJourney, the same reading
 * of the input and the same owner check), with the stored values of exactly
 * the columns it wrote, read in the same transaction. That is what takes the
 * change back: the assistant's undo writes those values again through the
 * same tool. The broadcast goes out after the commit, and so does the release
 * of a replaced cover: its object goes unless another row (the trip it was
 * inherited from, a gallery photo) still names it (#2924).
 */
@Injectable()
export class JourneySettingsService {
  constructor(
    private readonly journeys: JourneyDomainService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Journeys) private readonly journeysRepo: JourneysRepository,
    private readonly release: StorageReleaseService,
  ) {}

  /** Null for anyone but the owner, who alone reshapes the journey itself, as on the route. */
  async updateWithPrevious(
    journeyId: number,
    userId: number,
    data: JourneySettingsInput,
    sid?: string,
  ): Promise<JourneySettingsUpdate | null> {
    if (!(await this.journeys.isOwner(journeyId, userId))) return null;
    const patch = journeySettingsPatch(data);
    const written = Object.keys(patch).length > 0;
    const previous = await this.uow.transactional(async () => {
      const before = await this.journeysRepo.findById(journeyId);
      if (written) await this.journeysRepo.updateFields(journeyId, { ...patch, updated_at: Date.now() });
      return previousSettings(before as unknown as Readonly<Record<string, unknown>> | undefined, patch);
    });
    if (written) await this.journeys.broadcastJourneyEvent(journeyId, 'journey:updated', {}, sid);
    // A replaced cover is queued, never deleted here: the assistant's undo can write it back.
    if (typeof previous.cover_image === 'string' && previous.cover_image !== patch.cover_image) {
      await this.release.releaseValues([previous.cover_image]);
    }
    const journey = (await this.journeysRepo.findById(journeyId)) as Journey | undefined;
    return journey ? { journey, previous } : null;
  }
}
