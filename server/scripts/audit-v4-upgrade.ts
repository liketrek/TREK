import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const dbPath = path.resolve(argument('--db') ?? process.env.TREK_DB_FILE ?? path.join(__dirname, '../data/travel.db'));
if (!fs.existsSync(dbPath)) {
  console.error(`Database does not exist: ${dbPath}`);
  process.exit(2);
}

const db = new Database(dbPath, { readonly: true, fileMustExist: true });

const hasTable = (table: string): boolean =>
  !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(table);
const hasColumn = (table: string, column: string): boolean =>
  hasTable(table) && !!db.prepare(`SELECT 1 FROM pragma_table_info(?) WHERE name = ?`).get(table, column);
const rowCount = (table: string): number | null =>
  hasTable(table)
    ? Number((db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count)
    : null;

const schemaVersion = hasTable('schema_version')
  ? Number(
      (db.prepare('SELECT version FROM schema_version LIMIT 1').get() as { version?: number } | undefined)?.version ??
        0,
    )
  : 0;

const customMarkers = {
  enhancedFx: hasTable('trip_exchange_rates') || hasColumn('budget_items', 'exchange_rate_source'),
  guestIdentity:
    hasColumn('trip_members', 'new_member_identity_check_completed_at') ||
    hasColumn('trip_members', 'guest_claim_prompted_at'),
  webPush: hasTable('web_push_subscriptions'),
};

const officialV4Artifacts: Array<[string, boolean]> = [
  ['vacay_entries.fraction', hasColumn('vacay_entries', 'fraction')],
  ['vacay_shares', hasTable('vacay_shares')],
  ['place_ratings', hasTable('place_ratings')],
  ['collection_place_ratings', hasTable('collection_place_ratings')],
  ['day_assignments.leg_transport_mode', hasColumn('day_assignments', 'leg_transport_mode')],
  ['days.default_transport_mode', hasColumn('days', 'default_transport_mode')],
  ['vacay_plans.school_holidays_enabled', hasColumn('vacay_plans', 'school_holidays_enabled')],
  ['vacay_holiday_calendars.type', hasColumn('vacay_holiday_calendars', 'type')],
];
const missingOfficialV4Artifacts = officialV4Artifacts.filter(([, present]) => !present).map(([name]) => name);
const hasAnyCustomMarker = Object.values(customMarkers).some(Boolean);

let classification: 'clean-3.4.x' | 'custom-3.4.1' | 'v4-or-newer' | 'mixed-or-unsupported';
if (schemaVersion <= 175 && !hasAnyCustomMarker) classification = 'clean-3.4.x';
else if (schemaVersion >= 176 && schemaVersion <= 180 && hasAnyCustomMarker) classification = 'custom-3.4.1';
else if (schemaVersion >= 198 && missingOfficialV4Artifacts.length === 0) classification = 'v4-or-newer';
else classification = 'mixed-or-unsupported';

const integrity = db.pragma('integrity_check') as Array<{ integrity_check: string }>;
const foreignKeyFailures = db.pragma('foreign_key_check') as Array<Record<string, unknown>>;
const report = {
  database: dbPath,
  classification,
  schemaVersion,
  customMarkers,
  missingOfficialV4Artifacts,
  integrity: integrity.map((row) => row.integrity_check),
  foreignKeyFailures,
  rowCounts: {
    users: rowCount('users'),
    trips: rowCount('trips'),
    budgetItems: rowCount('budget_items'),
    budgetSettlements: rowCount('budget_settlements'),
    tripExchangeRates: rowCount('trip_exchange_rates'),
    globalExchangeRateSnapshots: rowCount('global_exchange_rate_snapshots'),
    webPushSubscriptions: rowCount('web_push_subscriptions'),
  },
};

console.log(JSON.stringify(report, null, 2));
db.close();

if (
  classification === 'mixed-or-unsupported' ||
  integrity.some((row) => row.integrity_check !== 'ok') ||
  foreignKeyFailures.length > 0
) {
  process.exitCode = 2;
}
