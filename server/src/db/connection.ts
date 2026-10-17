import Database from 'better-sqlite3';

/**
 * Opens a SQLite connection. Every handle the server opens comes from here (the
 * main database, each plugin's own database, a backup being checked before a
 * restore), so what has to hold for all of them is set in one place. A Buffer
 * opens a serialized database in memory (the test schema snapshot).
 *
 * Temporary storage stays in memory. Statement journals, sort runs and transient
 * indices move to a temp file once they outgrow a small in-memory buffer, and
 * SQLite looks for a directory to hold that file in SQLITE_TMPDIR, TMPDIR,
 * /var/tmp, /usr/tmp, /tmp and the working directory. A container with a
 * read-only root filesystem and no tmpfs on /tmp has none of them writable, so
 * the first statement that needs a temp file fails with SQLITE_IOERR_GETTEMPPATH.
 * Deleting a trip is where that showed: the cascade keeps a statement journal
 * larger than the 64 KiB SQLite holds before it spills to disk (#2518).
 *
 * The data directory is the only place TREK can count on being able to write,
 * and SQLite has no supported per-connection way to put temp files there, so
 * they stay in RAM. The shipped compose file already had them there, its /tmp
 * being a tmpfs. VACUUM INTO, the only VACUUM TREK runs, writes straight into
 * its target file and builds no temporary database.
 */
export function openDatabase(filename: string | Buffer, options?: Database.Options): Database.Database {
  const db = new Database(filename, options);
  db.pragma('temp_store = MEMORY');
  return db;
}
