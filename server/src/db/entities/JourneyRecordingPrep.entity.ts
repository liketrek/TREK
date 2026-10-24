import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { JourneyRecordingPrepRepository } from '../repositories/JourneyRecordingPrep.repository';
import { Journeys } from './Journeys.entity';
import { Users } from './Users.entity';

export class JourneyRecordingPrep {
  [EntityRepositoryType]?: JourneyRecordingPrepRepository;
  id!: number & Opt;
  journey!: Ref<Journeys>;
  journey_id!: number;
  user!: Ref<Users>;
  user_id!: number;
  last_attempt_at?: string | null;
  last_success_at?: string | null;
  last_error?: string | null;
}

export const JourneyRecordingPrepSchema = defineEntity({
  class: JourneyRecordingPrep,
  repository: () => JourneyRecordingPrepRepository,
  uniques: [
    {
      name: 'idx_journey_recording_prep_person',
      properties: ['journey_id', 'user_id'],
    },
  ],
  properties: {
    id: p.integer().primary(),
    journey: () => p.manyToOne(Journeys).ref().deleteRule('cascade').hidden(),
    journey_id: p.integer().persist(false),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden().index('idx_journey_recording_prep_user'),
    user_id: p.integer().persist(false).index('idx_journey_recording_prep_user'),
    last_attempt_at: p.text().nullable(),
    last_success_at: p.text().nullable(),
    last_error: p.text().nullable(),
  },
});
