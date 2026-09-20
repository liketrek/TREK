import { Collection, defineEntity, p, EntityRepository } from '@mikro-orm/core';
import { PhotoProviderFields } from './PhotoProviderFields.entity';

export class PhotoProviders {
  id?: string | null;
  name!: string;
  description?: string | null;
  icon?: string | null = 'Image';
  enabled?: number | null = 0;
  sortOrder?: number | null = 0;
  photoProviderFieldsCollection = new Collection<PhotoProviderFields>(this);
}

export class PhotoProvidersRepository extends EntityRepository<PhotoProviders> {}

export const PhotoProvidersSchema = defineEntity({
  class: PhotoProviders,
  repository: () => PhotoProvidersRepository,
  properties: {
    id: p.text().primary().nullable(),
    name: p.text(),
    description: p.text().nullable(),
    icon: p.text().nullable(),
    enabled: p.integer().nullable(),
    sortOrder: p.integer().nullable(),
    photoProviderFieldsCollection: () => p.oneToMany(PhotoProviderFields).mappedBy('provider'),
  },
});
