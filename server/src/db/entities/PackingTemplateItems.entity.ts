import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PackingTemplateItemsRepository } from '../repositories/PackingTemplateItems.repository';
import { PackingTemplateCategories } from './PackingTemplateCategories.entity';

export class PackingTemplateItems {
  [EntityRepositoryType]?: PackingTemplateItemsRepository;
  id!: number & Opt;
  category!: Ref<PackingTemplateCategories>;
  category_id!: number;
  name!: string;
  sort_order: number & Opt = 0;
  weight_grams?: number | null;
  quantity: number & Opt = 1;
  bag_name?: string | null;
}

export const PackingTemplateItemsSchema = defineEntity({
  class: PackingTemplateItems,
  repository: () => PackingTemplateItemsRepository,
  properties: {
    id: p.integer().primary(),
    category: () => p.manyToOne(PackingTemplateCategories).ref().deleteRule('cascade').hidden(),
    category_id: p.integer().persist(false),
    name: p.text(),
    sort_order: p.integer().default(0),
    weight_grams: p.integer().nullable(),
    quantity: p.integer().default(1),
    bag_name: p.text().nullable(),
  },
});
