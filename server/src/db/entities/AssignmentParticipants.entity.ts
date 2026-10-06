import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AssignmentParticipantsRepository } from '../repositories/AssignmentParticipants.repository';
import { DayAssignments } from './DayAssignments.entity';
import { Users } from './Users.entity';

export class AssignmentParticipants {
  [EntityRepositoryType]?: AssignmentParticipantsRepository;
  id!: number & Opt;
  assignment!: Ref<DayAssignments>;
  assignment_id!: number;
  user!: Ref<Users>;
  user_id!: number;
}

export const AssignmentParticipantsSchema = defineEntity({
  class: AssignmentParticipants,
  repository: () => AssignmentParticipantsRepository,
  uniques: [{ properties: ['assignment', 'user'] }],
  properties: {
    id: p.integer().primary(),
    assignment: () => p.manyToOne(DayAssignments).ref().deleteRule('cascade').hidden().index('idx_assignment_participants_assignment'),
    assignment_id: p.integer().persist(false).index('idx_assignment_participants_assignment'),
    user: () => p.manyToOne(Users).ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
  },
});
