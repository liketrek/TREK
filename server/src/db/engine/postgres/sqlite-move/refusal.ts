/**
 * A refusal the operator can act on: the move stops because of what the
 * SQLite file holds, and the message says what to change before running it
 * again. The command prints it without a stack, where any other error is a
 * failure of the move itself.
 */
export class MoveRefusal extends Error {}

/** Where and how the operator corrects a row of TREK's own data, after "Correct them" or "Change or remove ...". */
export const FIX_IN_SQLITE_FILE =
  'in the SQLite file (through TREK while it still runs on SQLite, or with the sqlite3 tool while TREK is ' +
  'stopped), then run the move again.';

/** The same for a row of a plugin's own data, which lives in the plugin's own SQLite file. */
export const FIX_IN_PLUGIN_DB =
  "in the plugin's plugin.db (through the plugin, or with the sqlite3 tool while TREK is stopped), then run the " +
  'move again.';
