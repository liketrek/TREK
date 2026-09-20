import { Collection, type Opt, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PackingTemplateItems } from './PackingTemplateItems.entity';
import { PackingTemplates } from './PackingTemplates.entity';

export class PackingTemplateCategories {
  id?: number | null;
  template!: Ref<PackingTemplates>;
  name!: string;
  sortOrder: number & Opt = 0;
  packingTemplateItemsCollection = new Collection<PackingTemplateItems>(this);
}

export class PackingTemplateCategoriesRepository extends EntityRepository<PackingTemplateCategories> {}

export const PackingTemplateCategoriesSchema = defineEntity({
  class: PackingTemplateCategories,
  repository: () => PackingTemplateCategoriesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    template: () => p.manyToOne(PackingTemplates).ref().deleteRule('cascade'),
    name: p.text(),
    sortOrder: p.integer(),
    packingTemplateItemsCollection: () => p.oneToMany(PackingTemplateItems).mappedBy('category'),
  },
});
