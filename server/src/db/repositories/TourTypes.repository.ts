import type { TourTypes } from '../entities/TourTypes.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * `tour_types` — the controlled vocabulary `tours.tour_type` points at. Only
 * `hike` exists, written by the migration that creates the table; nothing
 * reads the catalogue yet, so this repository has no methods of its own.
 */
export class TourTypesRepository extends TrekRepository<TourTypes> {}
