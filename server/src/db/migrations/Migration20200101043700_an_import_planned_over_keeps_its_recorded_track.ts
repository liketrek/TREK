import { Migration } from '@mikro-orm/migrations';

/**
 * An import (a GPX file or a wanderer snapshot) can be planned over in place:
 * the tour keeps its id, its days and its notes, and gets waypoints and a line
 * routed through them. The track it was recorded with is kept here the first
 * time that happens, so the tour can go back to it whenever its owner wants.
 */
export class Migration20200101043700_an_import_planned_over_keeps_its_recorded_track extends Migration {
  override name = 'Migration20200101043700_an_import_planned_over_keeps_its_recorded_track';

  override up(): void {
    this.addSql('ALTER TABLE tours ADD COLUMN recorded_route_geometry TEXT');
  }
}
