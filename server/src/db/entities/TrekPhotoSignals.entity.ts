import { EntityRepositoryType, type Opt, type Ref, defineEntity, p } from '@mikro-orm/core';
import { TrekPhotoSignalsRepository } from '../repositories/TrekPhotoSignals.repository';
import { DbTimestampType } from '../types';
import { TrekPhotos } from './TrekPhotos.entity';

export class TrekPhotoSignals {
  [EntityRepositoryType]?: TrekPhotoSignalsRepository;
  id!: number & Opt;
  photo!: Ref<TrekPhotos>;
  photo_id!: number;
  algo!: number;
  phash?: string | null;
  sharpness?: number | null;
  luma?: number | null;
  clipped?: number | null;
  orig_width?: number | null;
  orig_height?: number | null;
  computed_at!: string & Opt;
  palette?: string | null;
  busy?: string | null;
  sal_x?: number | null;
  sal_y?: number | null;
}

export const TrekPhotoSignalsSchema = defineEntity({
  class: TrekPhotoSignals,
  repository: () => TrekPhotoSignalsRepository,
  uniques: [{ properties: ['photo'] }],
  properties: {
    id: p.integer().primary(),
    photo: () => p.manyToOne(TrekPhotos).ref().deleteRule('cascade').hidden(),
    photo_id: p.integer().persist(false),
    algo: p.integer(),
    phash: p.text().nullable(),
    sharpness: p.double().nullable(),
    luma: p.double().nullable(),
    clipped: p.double().nullable(),
    orig_width: p.integer().nullable(),
    orig_height: p.integer().nullable(),
    computed_at: p.type(DbTimestampType).defaultRaw(`CURRENT_TIMESTAMP`),
    palette: p.text().nullable(),
    busy: p.text().nullable(),
    sal_x: p.double().nullable(),
    sal_y: p.double().nullable(),
  },
});
