import { Collection, type Ref, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PackingTemplateCategories } from './PackingTemplateCategories.entity';
import { Users } from './Users.entity';

export class PackingTemplates {
  id?: number | null;
  name!: string;
  createdBy!: Ref<Users>;
  createdAt?: Date | null;
  packingTemplateCategoriesCollection = new Collection<PackingTemplateCategories>(this);
}

export class PackingTemplatesRepository extends EntityRepository<PackingTemplates> {}

export const PackingTemplatesSchema = defineEntity({
  class: PackingTemplates,
  repository: () => PackingTemplatesRepository,
  properties: {
    id: p.integer().primary().autoincrement(),
    name: p.text(),
    createdBy: () => p.manyToOne(Users).ref().name('created_by').deleteRule('cascade'),
    createdAt: p.datetime().nullable().onCreate(() => new Date()),
    packingTemplateCategoriesCollection: () => p.oneToMany(PackingTemplateCategories).mappedBy('template'),
  },
});
