import { EntityRepositoryType, type Opt, defineEntity, p } from '@mikro-orm/core';
import { PlaceContribLogRepository } from '../repositories/PlaceContribLog.repository';

export class PlaceContribLog {
  [EntityRepositoryType]?: PlaceContribLogRepository;
  id!: number & Opt;
  day!: string;
  contrib_key!: string;
  place_name!: string;
  field!: string;
  value_summary?: string | null;
  result!: string;
  reason?: string | null;
}

export const PlaceContribLogSchema = defineEntity({
  class: PlaceContribLog,
  repository: () => PlaceContribLogRepository,
  properties: {
    id: p.integer().primary(),
    day: p.text().index('idx_place_contrib_log_day'),
    contrib_key: p.text(),
    place_name: p.text(),
    field: p.text(),
    value_summary: p.text().nullable(),
    result: p.text(),
    reason: p.text().nullable(),
  },
});
