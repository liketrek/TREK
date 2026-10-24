import { Migration } from '@mikro-orm/migrations';

/**
 * A ski tour keeps what its legs were planned for: the piste router's options
 * (difficulty limit, lifts to avoid, pace and the rest) and the build of the
 * piste data they were planned on, as one JSON text written by the server
 * (`TOUR_SKI_ROUTE` in json-columns.ts). NULL for every other type, for an
 * imported track and for a ski tour saved before the router. Reopened, the
 * tour is planned with the same options, and a newer build of the piste data
 * can be offered instead of applied. A tour kept in a collection keeps the
 * same column, so a copy made from it is planned as the tour it was saved from.
 */
export class Migration20200101046150_a_ski_tour_keeps_its_piste_router_options extends Migration {
  override name = 'Migration20200101046150_a_ski_tour_keeps_its_piste_router_options';

  override up(): void {
    this.addSql('ALTER TABLE tours ADD COLUMN ski_options TEXT');
    this.addSql('ALTER TABLE collection_tours ADD COLUMN ski_options TEXT');
  }
}
