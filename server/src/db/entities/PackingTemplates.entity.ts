import { Collection, EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { PackingTemplatesRepository } from '../repositories/PackingTemplates.repository';
import { DbTimestampType } from '../types';
import { PackingTemplateCategories } from './PackingTemplateCategories.entity';
import { Users } from './Users.entity';

export class PackingTemplates {
  [EntityRepositoryType]?: PackingTemplatesRepository;
  id!: number & Opt;
  name!: string;
  created_by!: number;
  created_at?: string | null;
  createdByRef!: Ref<Users>;
  packing_template_categories_collection = new Collection<PackingTemplateCategories>(this);
}

export const PackingTemplatesSchema = defineEntity({
  class: PackingTemplates,
  repository: () => PackingTemplatesRepository,
  properties: {
    id: p.integer().primary(),
    name: p.text(),
    created_by: p.integer().persist(false),
    created_at: p.type(DbTimestampType).nullable().defaultRaw(`CURRENT_TIMESTAMP`),
    createdByRef: () => p.manyToOne(Users).ref().joinColumn('created_by').deleteRule('cascade').hidden(),
    packing_template_categories_collection: () => p.oneToMany(PackingTemplateCategories).mappedBy('template').hidden(),
  },
});
