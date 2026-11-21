/**
 * The SQLite schema's triggers as Postgres writes them. The entities describe
 * tables only, so the baseline (`scripts/generate-pg-baseline.ts`) adds these
 * after the tables, and `check:pg-baseline` fails while a trigger in the
 * migrated SQLite schema has no entry here. Each entry is the trigger's
 * function and the trigger that runs it, under the SQLite trigger's name.
 */
export const POSTGRES_TRIGGERS: Readonly<Record<string, readonly string[]>> = {
  // A deleted stay releases the day stops it claimed (no foreign key holds the link).
  trg_release_stop_on_stay_delete: [
    `CREATE FUNCTION trg_release_stop_on_stay_delete() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE day_assignments SET accommodation_id = NULL WHERE accommodation_id = OLD.id;
  RETURN OLD;
END
$$`,
    'CREATE TRIGGER trg_release_stop_on_stay_delete AFTER DELETE ON day_accommodations ' +
      'FOR EACH ROW EXECUTE FUNCTION trg_release_stop_on_stay_delete()',
  ],
  // A place that moved or was renamed drops the region it was resolved to (#2527).
  trg_place_regions_follow_place: [
    `CREATE FUNCTION trg_place_regions_follow_place() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM place_regions WHERE place_id = NEW.id;
  RETURN NEW;
END
$$`,
    'CREATE TRIGGER trg_place_regions_follow_place AFTER UPDATE OF lat, lng, address ON places FOR EACH ROW ' +
      'WHEN (OLD.lat IS DISTINCT FROM NEW.lat OR OLD.lng IS DISTINCT FROM NEW.lng OR OLD.address IS DISTINCT FROM NEW.address) ' +
      'EXECUTE FUNCTION trg_place_regions_follow_place()',
  ],
};
