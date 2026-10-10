import { Collection, EntityRepositoryType, defineEntity, p } from '@mikro-orm/core';
import { PhotoProvidersRepository } from '../repositories/PhotoProviders.repository';
import { PhotoProviderFields } from './PhotoProviderFields.entity';

export class PhotoProviders {
  [EntityRepositoryType]?: PhotoProvidersRepository;
  id?: string | null;
  name!: string;
  description?: string | null;
  icon?: string | null = 'Image';
  enabled?: number | null = 0;
  sort_order?: number | null = 0;
  photo_provider_fields_collection = new Collection<PhotoProviderFields>(this);
}

export const PhotoProvidersSchema = defineEntity({
  class: PhotoProviders,
  repository: () => PhotoProvidersRepository,
  properties: {
    id: p.text().primary().nullable(),
    name: p.text(),
    description: p.text().nullable(),
    icon: p.text().nullable(),
    enabled: p.integer().nullable(),
    sort_order: p.integer().nullable(),
    photo_provider_fields_collection: () => p.oneToMany(PhotoProviderFields).mappedBy('provider').hidden(),
  },
});
