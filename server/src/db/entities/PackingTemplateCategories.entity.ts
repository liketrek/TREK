import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PackingTemplateCategoriesRepository } from '../repositories/PackingTemplateCategories.repository';
import { PackingTemplateItems } from './PackingTemplateItems.entity';
import { PackingTemplates } from './PackingTemplates.entity';

export class PackingTemplateCategories {
  [EntityRepositoryType]?: PackingTemplateCategoriesRepository;
  id!: number & Opt;
  template!: Ref<PackingTemplates>;
  template_id!: number;
  name!: string;
  sort_order: number & Opt = 0;
  packing_template_items_collection = new Collection<PackingTemplateItems>(this);
}

export const PackingTemplateCategoriesSchema = defineEntity({
  class: PackingTemplateCategories,
  repository: () => PackingTemplateCategoriesRepository,
  properties: {
    id: p.integer().primary(),
    template: () => p.manyToOne(PackingTemplates).ref().deleteRule('cascade').hidden(),
    template_id: p.integer().persist(false),
    name: p.text(),
    sort_order: p.integer().default(0),
    packing_template_items_collection: () => p.oneToMany(PackingTemplateItems).mappedBy('category').hidden(),
  },
});
