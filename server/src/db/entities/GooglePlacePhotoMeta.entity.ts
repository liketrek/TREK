import { PrimaryKeyProp, defineEntity, p, EntityRepository } from '@mikro-orm/core';

export class GooglePlacePhotoMeta {
  [PrimaryKeyProp]?: 'placeId';
  placeId?: string | null;
  attribution?: string | null;
  fetchedAt!: number;
  errorAt?: number | null;
}

export class GooglePlacePhotoMetaRepository extends EntityRepository<GooglePlacePhotoMeta> {}

export const GooglePlacePhotoMetaSchema = defineEntity({
  class: GooglePlacePhotoMeta,
  repository: () => GooglePlacePhotoMetaRepository,
  properties: {
    placeId: p.text().primary().nullable(),
    attribution: p.text().nullable(),
    fetchedAt: p.integer(),
    errorAt: p.integer().nullable(),
  },
});
