import { EntityRepositoryType, type Opt, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { AssistantUsageRepository } from '../repositories/AssistantUsage.repository';
import { Users } from './Users.entity';

export class AssistantUsage {
  [EntityRepositoryType]?: AssistantUsageRepository;
  [PrimaryKeyProp]?: ['user', 'day', 'paid_by'];
  user!: Ref<Users>;
  user_id!: number;
  day!: string;
  paid_by!: string;
  turns: number & Opt = 0;
  input_tokens: number & Opt = 0;
  output_tokens: number & Opt = 0;
}

export const AssistantUsageSchema = defineEntity({
  class: AssistantUsage,
  repository: () => AssistantUsageRepository,
  uniques: [{ properties: ['user', 'day', 'paid_by'] }],
  properties: {
    user: () => p.manyToOne(Users).primary().ref().deleteRule('cascade').hidden(),
    user_id: p.integer().persist(false),
    day: p.text().primary(),
    paid_by: p.text().primary(),
    turns: p.integer().default(0),
    input_tokens: p.integer().default(0),
    output_tokens: p.integer().default(0),
  },
});
