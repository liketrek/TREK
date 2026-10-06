import { EntityRepositoryType, PrimaryKeyProp, defineEntity, p } from '@mikro-orm/core';
import { GooglePlacePhotoMetaRepository } from '../repositories/GooglePlacePhotoMeta.repository';

export class GooglePlacePhotoMeta {
  [EntityRepositoryType]?: GooglePlacePhotoMetaRepository;
  [PrimaryKeyProp]?: 'place_id';
  place_id?: string | null;
  attribution?: string | null;
  fetched_at!: number;
  error_at?: number | null;
}

export const GooglePlacePhotoMetaSchema = defineEntity({
  class: GooglePlacePhotoMeta,
  repository: () => GooglePlacePhotoMetaRepository,
  properties: {
    place_id: p.text().primary().nullable(),
    attribution: p.text().nullable(),
    fetched_at: p.integer(),
    error_at: p.integer().nullable(),
  },
});
