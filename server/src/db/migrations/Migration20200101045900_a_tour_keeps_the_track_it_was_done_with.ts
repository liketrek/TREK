import { Migration } from '@mikro-orm/migrations';

/**
 * ACT-01: a tour can be given the track it was actually done with. The
 * recording is a tour of the same trip that came in through the GPX import
 * (or from wanderer); `tour_activities` only points at it, so it keeps its own
 * name and provenance, and the planned tour keeps its line, measures and times
 * untouched. `assignment_id` is the execution, the day assignment of the tour
 * the recording belongs to; NULL for a tour done without a day. One recording
 * documents one tour (`track_place_id UNIQUE`) and a day's execution has one
 * recording (the partial unique index). Without a day there can be several:
 * taking the tour off a day keeps its recording and only forgets the day, so
 * it joins any that had none. Linking a recording to "no day" replaces all of
 * them, and the app names each before it does. Deleting either tour takes the
 * assignment with it.
 * `assigned_by` names who assigned it, kept as unknown when that account goes.
 *
 * Not to be confused with `tours.recorded_route_geometry`: that is the line an
 * import was planned over from, this is what was walked.
 *
 * `track_started_at` and `track_ended_at` are the first and last time on the
 * points of a track the GPX import read, NULL unless every point carried one;
 * every tour imported before stays NULL, its times unknown.
 */
export class Migration20200101045900_a_tour_keeps_the_track_it_was_done_with extends Migration {
  override name = 'Migration20200101045900_a_tour_keeps_the_track_it_was_done_with';

  override up(): void {
    this.addSql('ALTER TABLE tours ADD COLUMN track_started_at DATETIME');
    this.addSql('ALTER TABLE tours ADD COLUMN track_ended_at DATETIME');
    this.addSql(`
      CREATE TABLE IF NOT EXISTS tour_activities (
        id INTEGER PRIMARY KEY,
        place_id INTEGER NOT NULL REFERENCES tours(place_id) ON DELETE CASCADE,
        track_place_id INTEGER NOT NULL UNIQUE REFERENCES tours(place_id) ON DELETE CASCADE,
        assignment_id INTEGER REFERENCES day_assignments(id) ON DELETE SET NULL,
        assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tour_activities_place ON tour_activities(place_id)');
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_tour_activities_assignment ON tour_activities(assignment_id) WHERE assignment_id IS NOT NULL',
    );
    this.addSql('CREATE INDEX IF NOT EXISTS idx_tour_activities_assigned_by ON tour_activities(assigned_by)');
  }
}
