import { HttpException, Injectable } from '@nestjs/common';
import type { RoadtripDayBoundary } from '@trek/shared';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DayBoundariesService {
  constructor(private readonly db: DatabaseService) {}

  list(tripId: string | number): RoadtripDayBoundary[] {
    return this.db.all<RoadtripDayBoundary>(
      'SELECT day_number, from_assignment_id, to_assignment_id, fraction FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number', tripId,
    );
  }

  save(tripId: string | number, boundary: RoadtripDayBoundary): RoadtripDayBoundary[] {
    const belongs = (id: number) => this.db.get(
      'SELECT a.id FROM day_assignments a JOIN days d ON d.id = a.day_id WHERE a.id = ? AND d.trip_id = ?', id, tripId,
    );
    if (!belongs(boundary.from_assignment_id) || boundary.to_assignment_id !== null && !belongs(boundary.to_assignment_id)) {
      throw new HttpException({ error: 'Stop not found' }, 404);
    }
    this.db.run(`INSERT INTO roadtrip_day_boundaries (trip_id, day_number, from_assignment_id, to_assignment_id, fraction)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT (trip_id, day_number) DO UPDATE SET
      from_assignment_id = excluded.from_assignment_id, to_assignment_id = excluded.to_assignment_id, fraction = excluded.fraction`,
    tripId, boundary.day_number, boundary.from_assignment_id, boundary.to_assignment_id, boundary.to_assignment_id === null ? 1 : boundary.fraction);
    return this.list(tripId);
  }

  remove(tripId: string | number, dayNumber: number): RoadtripDayBoundary[] {
    this.db.run('DELETE FROM roadtrip_day_boundaries WHERE trip_id = ? AND day_number = ?', tripId, dayNumber);
    return this.list(tripId);
  }
}
