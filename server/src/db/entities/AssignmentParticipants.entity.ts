import { type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { DayAssignments } from './DayAssignments.entity';
import { Users } from './Users.entity';

export class AssignmentParticipants {
  id?: number | null;
  assignment!: Ref<DayAssignments>;
  user!: Ref<Users>;
}

export class AssignmentParticipantsRepository extends EntityRepository<AssignmentParticipants> {}

export const AssignmentParticipantsSchema = defineEntity({
  class: AssignmentParticipants,
  repository: () => AssignmentParticipantsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    assignment: () => p.manyToOne(DayAssignments).ref().index('idx_assignment_participants_assignment'),
    user: () => p.manyToOne(Users).ref(),
  },
});
