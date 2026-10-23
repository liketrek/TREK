import { EntityRepositoryType, PrimaryKeyProp, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TravelTransferSilentTasksRepository } from '../repositories/TravelTransferSilentTasks.repository';
import { TodoItems } from './TodoItems.entity';

export class TravelTransferSilentTasks {
  [EntityRepositoryType]?: TravelTransferSilentTasksRepository;
  [PrimaryKeyProp]?: 'todo';
  todo!: Ref<TodoItems>;
  todo_id!: number;
}

export const TravelTransferSilentTasksSchema = defineEntity({
  class: TravelTransferSilentTasks,
  repository: () => TravelTransferSilentTasksRepository,
  properties: {
    todo: () => p.oneToOne(TodoItems).primary().ref().hidden(),
    todo_id: p.integer().persist(false),
  },
});
