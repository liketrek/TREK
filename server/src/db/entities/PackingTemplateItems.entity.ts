import { type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PackingTemplateCategories } from './PackingTemplateCategories.entity';

export class PackingTemplateItems {
  id?: number | null;
  category!: Ref<PackingTemplateCategories>;
  name!: string;
  sortOrder: number & Opt = 0;
}

export class PackingTemplateItemsRepository extends EntityRepository<PackingTemplateItems> {}

export const PackingTemplateItemsSchema = defineEntity({
  class: PackingTemplateItems,
  repository: () => PackingTemplateItemsRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    category: () => p.manyToOne(PackingTemplateCategories).ref().deleteRule('cascade'),
    name: p.text(),
    sortOrder: p.integer(),
  },
});
