import { Trips } from '../../db/entities/Trips.entity';
import type { TripAccess, TripsRepository } from '../../db/repositories/Trips.repository';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * "May this user see this trip?" for every domain that is not the trips domain.
 *
 * It answers with the trip's access row (id, owner, currency) when the user
 * owns the trip or is a member, and undefined otherwise. It deliberately makes
 * no HTTP decision: a REST route turns undefined into its 404, an MCP tool into
 * its "not found or access denied" result, a plugin RPC into its error, and
 * each caller keeps the one it had.
 *
 * Before this the domains injected TripsRepository themselves for this one
 * read, so the trips table had a reader in thirty files outside its domain.
 * The id is read the way TripsRepository.findAccessible reads it (toRowId):
 * a spelling no client sends is no trip, on every engine.
 */
@Injectable()
export class TripAccessService {
  constructor(@InjectRepository(Trips) private readonly trips: TripsRepository) {}

  findAccessible(tripId: number | string, userId: number): Promise<TripAccess | undefined> {
    return this.trips.findAccessible(tripId, userId);
  }
}
