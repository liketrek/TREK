import { columnNames } from '../migration-utils';
import { Migration } from '@mikro-orm/migrations';

/**
 * `tour_types` holds every key the shared `tourTypeKeySchema` accepts. Only
 * `hike` was seeded, so a tour of any other type the contract allows failed
 * on the foreign key with a 500 instead of a clean refusal. The six others
 * are written disabled: the planner only offers `hike` today, and the
 * service turns a disabled type away with a 400.
 *
 * `tours.tour_group_id` goes. Nothing ever wrote or read it, and a column
 * nothing writes lets every copy and export carry a meaning nobody defined.
 * `difficulty` and `wanderer_ref` stay: the Wanderer import fills them.
 */
export class Migration20200101042300_every_tour_type_the_contract_names extends Migration {
  override name = 'Migration20200101042300_every_tour_type_the_contract_names';

  override async up(): Promise<void> {
    this.addSql(`
      INSERT OR IGNORE INTO tour_types (key, label_key, icon, color, routing_profile, is_sport, enabled, sort_order) VALUES
        ('bike', 'tourTypes.bike', 'Bike', '#2563eb', 'bicycle', 1, 0, 1),
        ('run', 'tourTypes.run', 'Footprints', '#dc2626', 'pedestrian', 1, 0, 2),
        ('ski', 'tourTypes.ski', 'MountainSnow', '#0891b2', NULL, 1, 0, 3),
        ('kayak', 'tourTypes.kayak', 'Sailboat', '#0d9488', NULL, 1, 0, 4),
        ('walk', 'tourTypes.walk', 'Landmark', '#9333ea', 'pedestrian', 0, 0, 5),
        ('food', 'tourTypes.food', 'UtensilsCrossed', '#ea580c', 'pedestrian', 0, 0, 6)
    `);

    if ((await columnNames(this, 'tours')).has('tour_group_id')) {
      this.addSql('ALTER TABLE tours DROP COLUMN tour_group_id');
    }
  }
}
