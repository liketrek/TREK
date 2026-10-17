import type { TourTypes } from '../entities/TourTypes.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `tour_types` — the controlled vocabulary `tours.tour_type` points at, one
 * row per key of the shared `tourTypeKeySchema`. The migrations write it;
 * `enabled` says which types a tour may be created with.
 */
export class TourTypesRepository extends TrekRepository<TourTypes> {
  /** Whether `key` is a known tour type a tour may be created with. */
  async isEnabled(key: string): Promise<boolean> {
    const row = await this.findOne({ key }, { fields: ['enabled'] });
    return row?.enabled === 1;
  }
}
