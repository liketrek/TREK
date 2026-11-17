# Database: Postgres

By default TREK keeps all data in one SQLite file, `travel.db`, in the data directory. Setting `TREK_DB_URL` runs TREK on a PostgreSQL database instead. Without that variable nothing changes, and every page of this wiki that describes `travel.db` still applies to an install on SQLite.

> **Status:** Postgres support is new. It has been checked end to end against PostgreSQL 17 in Docker (first boot, sign-in, trips, backup and restore, the copy before a migration, `RESTORE_FROM_BACKUP`). The same checks have been run against a Supabase project over its direct connection; see [Supabase](#supabase) and the [Manual verification checklist](#manual-verification-checklist) below.

## When to use it

Use Postgres when you already run a PostgreSQL server and want TREK's data there, for example to back it up or monitor it with the tools you use for other databases. A single TREK container on a host with a local disk does not need it.

Postgres does not make TREK scale out. TREK still runs as one process. See [Limitations](#limitations).

## Requirements

- **PostgreSQL 14 to 18.** TREK refuses to start on any other server version, before it writes anything.
- **An empty database dedicated to TREK.** TREK creates its schema in an empty database. It refuses a database that holds tables it did not create, and a restore replaces everything in the schema it loads into. Do not share the database with another application.
- **A role that is not a superuser,** which owns the database or can create objects in its schema. A backup archive is a SQL script run by this role during a restore, so a role with fewer privileges limits what a crafted archive can do. A restore refuses a role that could reach the database server from SQL (a superuser, a member of a superuser role, a role that holds `pg_execute_server_program`, `pg_read_server_files` or `pg_write_server_files` or may run a server file function such as `lo_export` or `pg_read_file`, from PostgreSQL 15 on a role granted ALTER SYSTEM or a superuser-only setting, and on PostgreSQL 14 and 15 a role with CREATEROLE or a member of one), and TREK warns about such a role when it starts. See [A role that is not a superuser](#a-role-that-is-not-a-superuser).
- **ICU support in the server.** The schema creates the collation `nocase` with `provider = icu`, so the server must be built with ICU. The official `postgres` images include it.
- **PostgreSQL client tools** (`pg_dump`, `pg_restore`, `psql`) for backups, restores and the copy TREK takes before a migration. The Docker image installs the version 18 client, which works with every supported server. A client works with servers up to its own major version, so a client outside the image must be at least as new as the server; TREK refuses an older one with a message that names both versions. See [Configuration](#configuration).
- **Client tool versions that carry the CVE-2025-8714 fix.** A restore refuses `pg_restore` or `psql` older than 18.0, 17.6, 16.10, 15.14 or 14.19.

## Configuration

| Variable | What it does | Default |
|---|---|---|
| `TREK_DB_URL` | Connection URL, `postgres://user:password@host:5432/database` (or `postgresql://`). Setting it selects Postgres. | unset (SQLite) |
| `TREK_DB_POOL_MAX` | Most connections TREK opens to the database, from 1 to 100. The pool sets no minimum, so idle connections can close. | `10` |
| `TREK_DB_PG_BIN_DIR` | Directory holding `pg_dump`, `pg_restore` and `psql`. | see below |

Percent-encode the user name and password inside the URL if they contain characters such as `@`, `:`, `/` or `#`.

### Combining with SQLite settings

`TREK_DB_URL` cannot be combined with `TREK_DB_FILE`, `TREK_DB_JOURNAL_MODE` or `TREK_DB_SYNCHRONOUS`. TREK refuses to start when both are set, because it would not know which database was meant. Unset the SQLite variables. `TREK_DB_PRE_MIGRATE_SNAPSHOT` and `TREK_DB_PRE_MIGRATE_SNAPSHOT_KEEP` still apply, but the copy they control is a `.pgdump` file. See [Upgrades](#upgrades).

### SSL

The `sslmode` parameter in the URL selects how the connection is secured:

| `sslmode` | Effect |
|---|---|
| `disable` | No SSL. |
| `require`, `verify-ca`, `verify-full` | SSL, with the server certificate verified. |
| anything else (for example `prefer`, `allow`, `no-verify`, or a misspelling) | TREK refuses to start. |

Without `sslmode`, the connection pool uses no SSL. The client tools use the libpq default for an unset `sslmode`, so set `sslmode` explicitly. For the backup and restore tools, every mode other than `disable` verifies the server, including its host name.

`sslrootcert=` names the file holding the certificate authority that signs the server's certificate. It is needed when the server uses a certificate from a private CA, and it is valid only together with one of the verifying modes. The file must be readable inside the container, so mount it into the container and point the URL at the path inside the container. Without `sslrootcert`, the system's trusted certificate authorities are used. The client tools read the system's authorities only from version 16 on, so with an older client (outside the Docker image) set `sslrootcert`; TREK refuses a backup or restore with such a client otherwise and says so.

### Where the client tools are found

TREK runs the tools by their absolute path. It does not search `PATH`. When `TREK_DB_PG_BIN_DIR` is unset, TREK looks in these directories, in order, and uses the first one that holds the tool:

1. `/usr/lib/postgresql/18/bin`
2. `/usr/lib/postgresql/17/bin`
3. `/usr/lib/postgresql/16/bin`
4. `/usr/lib/postgresql/15/bin`
5. `/usr/lib/postgresql/14/bin`
6. `/usr/local/bin`
7. `/usr/bin`

The newest version comes first, because a client works with every server up to its own major version and refuses a newer one.

The password is passed to the tools in the `PGPASSWORD` environment variable of their process. It never appears on a command line, where other processes could read it.

### Compose example

[`docker-compose.postgres.yml`](https://github.com/liketrek/TREK/blob/main/docker-compose.postgres.yml) runs a `postgres:17` service beside TREK, on a named volume, with the TREK container waiting for the database to pass its health check. Set two passwords in a `.env` file beside it before the first start: `POSTGRES_ADMIN_PASSWORD` for the database's superuser `postgres`, and `POSTGRES_PASSWORD` for the role `trek` that TREK connects as. On the database's first start, the superuser creates the role `trek`, which owns TREK's database and is not a superuser. See [Install: Docker Compose](Install-Docker-Compose#running-on-postgres).

### A role that is not a superuser

TREK connects as the role in `TREK_DB_URL`. That role creates TREK's schema, and during a restore it runs the backup's SQL, so it should own TREK's database and nothing more. On a server you administer, create it as a superuser once:

```sql
CREATE ROLE trek LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD '<a long random value>';
CREATE DATABASE trek OWNER trek;
\c trek
ALTER SCHEMA public OWNER TO trek;
```

Then use `postgres://trek:<password>@<host>:5432/trek` as `TREK_DB_URL`. A restore refuses a role that is a superuser or a member of one (`SET ROLE` would make it a superuser), that holds `pg_execute_server_program`, `pg_read_server_files` or `pg_write_server_files`, that may run a server file function (`lo_import`, `lo_export`, `pg_read_file`, `pg_read_binary_file`, `pg_ls_dir`, `pg_stat_file` or adminpack's `pg_file_*`), that was granted ALTER SYSTEM on any setting or SET on a superuser-only one (PostgreSQL 15 and later), or, on PostgreSQL 14 and 15, that has CREATEROLE or is a member of a role that has it (there it may grant itself those roles). A crafted archive could use any of these to run commands on the database server or to read or write its files. A member of `pg_monitor` is not refused. TREK also logs a warning about such a role when it starts.

TREK creates its tables in the role's current schema, normally `public`. A role whose `search_path` points at a schema of its own works too: TREK keeps its tables and its migration history there, and backups and restores cover that schema.

### Moving a compose install off the superuser

An install that started from an older `docker-compose.postgres.yml` connects as `trek`, which the `postgres` image created as the superuser. Its backups work, but restores are refused until TREK runs as a role that is not a superuser. With the containers running:

1. Create a second superuser for administration, so the database keeps one: `docker exec -it trek-db psql -U trek -d trek -c "CREATE ROLE postgres LOGIN SUPERUSER PASSWORD '<a long random value>'"`.
2. Take the superuser right from `trek`: `docker exec -it trek-db psql -U postgres -d trek -c "ALTER ROLE trek NOSUPERUSER NOCREATEDB NOCREATEROLE"`.
3. Update `docker-compose.postgres.yml` to the current version. Set `POSTGRES_ADMIN_PASSWORD` to the password from step 1 in `.env`, and keep `POSTGRES_PASSWORD` as it is (it stays the password of `trek`). Then run `docker compose -f docker-compose.postgres.yml up -d`.

The database already exists, so the new init script does not run again, and TREK keeps its data.

## First boot

On the first start against an empty database, TREK:

1. Creates the schema from its baseline and records every migration the baseline covers as applied, in one transaction, the table of the migration history included. A first start that fails there (a server without ICU, a dropped connection) leaves the database as empty as it was.
2. Applies any migrations after the baseline.
3. Seeds its default data and creates the admin account, from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when set. Otherwise it prints a random password to the log.

A database that holds tables TREK did not create, and no TREK migration history, is refused. TREK names a few of the tables and writes nothing to the database. Point `TREK_DB_URL` at an empty database.

A database migrated by a newer TREK is refused, and the log says to run that version again or to restore a backup taken with this one.

**Start one TREK process for the first boot and for every upgrade.** Two processes that start at the same time on the same new database are not coordinated. The second one fails its boot, because the first one's schema transaction wins. Once the database is up to date and running, a single container is the supported setup. See [Limitations](#limitations).

### An existing SQLite install beside an empty database

When `TREK_DB_URL` points at a database that holds no TREK data while the data directory still holds a `travel.db` with accounts, TREK refuses to start. Starting would bring up a new, empty TREK next to your data, which looks as if everything was lost. The log names the file and the move command. Move the install as described in [Moving an existing install to Postgres](#moving-an-existing-install-to-postgres), or unset `TREK_DB_URL` to keep running on SQLite. To start on the empty database on purpose, set `TREK_DB_IGNORE_SQLITE_FILE=true`; TREK then logs a warning and starts.

A SQLite backup cannot be restored into a Postgres database, and a Postgres backup cannot be restored into SQLite. The move below is the way from one to the other.

## Moving an existing install to Postgres

TREK ships a command that copies a SQLite install into an empty Postgres database: every table, the data of plugins that keep their own database, and the id sequences. It checks the copy before it keeps it and never changes the SQLite file, so the way back is to start TREK on SQLite again.

### What the command does

1. It checks that the SQLite file is at the migration level of the TREK version that runs the command. An older file is refused with the advice to start this version on it once, which migrates it; a file a newer TREK migrated is refused too.
2. It checks that every row's references point at a row that exists, since Postgres enforces them, and lists the rows that do not.
3. It refuses a Postgres database that holds any table or plugin schema, so it never mixes two installs.
4. It creates the schema exactly as a first start on an empty database does.
5. In one transaction it copies every table in the order of their references, converts each value to its Postgres column type, moves the id sequences past the copied ids, and reads every table back to compare its row count and a checksum over all its rows with the SQLite file. A value Postgres cannot store exactly (text in a number column, a fraction in a whole-number column) stops the copy and is listed by table, row and column. A NUL character in text, which TREK no longer stores on either engine, is dropped instead.
6. Only a copy that matches is committed. If anything fails, the transaction is rolled back and the schema the command created is dropped again, so the database is empty as before.

It prints a summary: the tables and rows it copied, the plugin schemas it filled, and anything it could not carry over.

**Uploads are not moved and need not be.** Files, covers, photos and avatars stay where the storage driver keeps them (the `uploads` directory, or your S3 bucket), and the rows the command copies point at them as before. The key files in the data directory (`.encryption_key`, `.jwt_secret`) stay where they are too. Keep the same `ENCRYPTION_KEY`, or the same data directory, for the Postgres install: the stored secrets are copied as they are, encrypted with that key.

**Plugin data.** A plugin's `plugin.db` in `data/plugins-data/<plugin id>/` goes into the plugin's schema `trek_plugin_<plugin id>` (see [Plugin data](#plugin-data)). Each table is created from the SQLite one: the column types follow SQLite's type rules, with NOT NULL, the primary key, an INTEGER PRIMARY KEY as an identity column, defaults that have a Postgres spelling, and indexes over plain columns. The plugin's record of the migrations it ran is copied, so the plugin does not run them again. Foreign keys between a plugin's tables, its views and triggers, and partial or expression indexes are not created; the summary lists them. The plugin's own SQL has to be written for Postgres for it to keep working, as for any plugin on Postgres.

### Steps with Docker Compose

1. **Update first.** Run the TREK version you want to keep, on SQLite, and let it start once, so the SQLite file is at that version's level. The command must come from the same image.
2. **Take a backup.** Create one under **Admin > Backup** and download it. Then stop TREK and copy the data directory somewhere safe as well.
3. **Stop TREK**: `docker compose down`. The SQLite file must not change while it is copied.
4. **Prepare the database.** Switch to [`docker-compose.postgres.yml`](https://github.com/liketrek/TREK/blob/main/docker-compose.postgres.yml), set `POSTGRES_ADMIN_PASSWORD` and `POSTGRES_PASSWORD` in `.env` as described in [Compose example](#compose-example), keep the same `./data` and `./uploads` mounts and the same `ENCRYPTION_KEY`, and start only the database: `docker compose -f docker-compose.postgres.yml up -d db`.
5. **Run the move**:

   ```bash
   docker compose -f docker-compose.postgres.yml run --rm --user node -w /app/server app \
     node --require tsconfig-paths/register dist/move-to-postgres.js
   ```

   It reads `data/travel.db` and `data/plugins-data`, and writes into the database `TREK_DB_URL` names. For a SQLite file elsewhere in the container, add `--from=/app/data/<file>`. A refusal or an error says what to fix and leaves the Postgres database empty, so you can run the command again.
6. **Start TREK**: `docker compose -f docker-compose.postgres.yml up -d`.
7. **Check**: the log reports the Postgres engine and no schema creation. Sign in, open a few trips, open a file and a photo, and look at your plugins.

Outside Docker, run `npm run db:move-to-postgres` in the server directory, with `TREK_DB_URL` set in the environment or in the server's `.env` file, and `--from=<file>` when the SQLite file is not the server's `data/travel.db`.

### Going back

The command never changes `travel.db`. To return to SQLite, stop TREK and start it again with the SQLite compose file, without `TREK_DB_URL`: it runs on the file as it was before the move. What was written on Postgres in the meantime is not in it. To try the move again, drop the Postgres database and create it empty, or use a new one.

The `travel.db` that stays in the data directory does not stop a Postgres install that holds your data. Keep it as a copy, or move it out of the data directory once you are sure.

## Upgrades

On a startup that has pending migrations, TREK writes a copy of the database before it migrates anything:

- The copy is a `pg_dump` custom-format file, `data/pre-migrate-<last migration>-<time>.pgdump`, next to the data the container keeps. The log prints the path.
- The newest `TREK_DB_PRE_MIGRATE_SNAPSHOT_KEEP` copies are kept (3 by default).
- If the copy cannot be written, for example because a client tool is missing or the disk is full, TREK refuses to migrate and does not start. Fix the cause, or set `TREK_DB_PRE_MIGRATE_SNAPSHOT=false` to migrate without a copy.
- A restart with nothing pending, and a first start on an empty database, write no copy.

The copy is a safety net for an update. It does not replace a backup, and it does not hold uploads. To go back to the previous image, follow [Updating: Rolling back a Postgres update](Updating#rolling-back-a-postgres-update).

## Backups and restore

A Postgres install produces the same backup archive as a SQLite install, with one difference: the database is stored as `travel.pgdump`, a `pg_dump` custom-format file, instead of `travel.db`. The uploads, the files plugins keep in their data directories and the encryption key are in the archive as before, and the dump holds each plugin's data schema beside TREK's own (see [Plugin data](#plugin-data)). See [Backups](Backups).

Restoring a backup on Postgres follows these rules:

- **The current database is replaced.** TREK first keeps a copy of it as `data/pre-restore-<time>.pgdump`. `pg_restore` then turns the archive's dump into a SQL script, and `psql` clears the current schema, which drops its tables, views, sequences, functions, types and collations, and runs the script. Both steps run in one transaction, so a restore that fails leaves the database as it was.
- **Plugin data is replaced with the archive's.** The same transaction drops every `trek_plugin_*` schema the role owns and loads the ones the dump holds, so a plugin installed after the backup loses its data, as it does on SQLite. Schemas the role does not own, and every other schema of the database, are never touched.
- **TREK checks the archive before it replaces anything.** The archive must hold a Postgres dump, not a SQLite file. The dump must carry TREK's migration history, and it must not come from a newer TREK. TREK refuses the restore with a message saying which check failed.
- **The client tools must be recent enough.** The restore refuses `pg_restore` or `psql` older than 18.0, 17.6, 16.10, 15.14 or 14.19, and tools older than the server.
- **The role must not be a superuser.** The restore refuses a role that is a superuser or a member of one, holds `pg_execute_server_program`, `pg_read_server_files` or `pg_write_server_files`, may run a server file function, was granted ALTER SYSTEM or a superuser-only setting, or on PostgreSQL 14 or 15 has CREATEROLE or is a member of a role that has it. See [A role that is not a superuser](#a-role-that-is-not-a-superuser).
- **The restore needs free space in the data directory.** `pg_restore` writes the dump out as a SQL script next to the unpacked archive before `psql` runs it, and the script is several times larger than the dump. It may grow to `BACKUP_MAX_DECOMPRESSED_MB` (5 GB by default); a larger one is stopped, nothing is replaced, and the work files are removed. Raise the limit for a genuine backup that needs more.

`RESTORE_FROM_BACKUP` works on Postgres too. On the first start, TREK loads the archive's dump into the database when that database holds no tables. An empty migration history with no other table beside it counts as no tables. When the database already has tables, the variable is ignored and TREK logs a warning. See [Backups: Restoring on a new install, before setup](Backups#restoring-on-a-new-install-before-setup).

## Plugin data

A plugin with the `db:own` permission keeps its own database. On SQLite that is a `plugin.db` file in its data directory. On Postgres it is a schema of its own in TREK's database, named `trek_plugin_<plugin id>` with each dash an underscore, so a Postgres install writes no SQLite file to the data volume, and the data volume can sit on network storage (NFS). Each plugin's directory under `data/plugins-data` is still created, for files a plugin keeps beside its database.

- **TREK's role creates the schemas**, so it needs the `CREATE` privilege on the database, which the role that owns the database has.
- **A plugin's SQL stays in its schema.** Only that schema is on the plugin's `search_path`, and TREK refuses a statement before it runs when it names another schema, the system catalogs or a function that could reach past it. It also refuses temporary objects (the words `TEMP` and `TEMPORARY`, and `SELECT ... INTO`), hexadecimal, octal and binary numbers, and control characters or non-ASCII whitespace outside strings, which Postgres reads differently from the check. Each statement is sent on its own over the extended query protocol, which runs one statement and no more. Every connection of TREK's pool searches the temporary schema last, and a plugin call drops the temporary tables and other session state of the connection it used before handing it back, so a temporary table can never stand in for one of TREK's. The rules are in the [plugin-sdk README](https://github.com/liketrek/TREK/blob/main/plugin-sdk/README.md#your-own-database-on-postgres).
- **A plugin writes Postgres SQL** on a Postgres install, not SQLite SQL. TREK does not translate it. A plugin written for SQLite only fails its `db:own` calls with the database's error; ask its author for Postgres support (`ctx.db.engine()` tells a plugin which engine it runs on).
- **Plugin calls share TREK's pool**, at most half of `TREK_DB_POOL_MAX` at once, one at a time per plugin. Each call takes a connection of its own from the pool for its transaction and gives it back when it ends.
- **Uninstalling a plugin with "delete data"** drops its schema.
- **One TREK per database.** The schema names depend only on the plugin id, so two TREK instances on one database would share their plugins' data.

## Maintenance tools

- **Resetting the admin account** works as on SQLite: `docker exec -it -u node trek node server/reset-admin.js` resets or creates the account in the Postgres database, with the server's connection settings and its write lock. It never opens or creates a `travel.db`, and it refuses to run when `TREK_DB_FILE` is set beside `TREK_DB_URL`. See [Troubleshooting](Troubleshooting).
- **Rotating the encryption key** works as on SQLite: `docker exec -it -u node -w /app/server trek node --import tsx scripts/migrate-encryption.ts` re-encrypts the secrets in the Postgres database, through the server's connection settings and in one transaction that holds its write lock. It first writes a `pg_dump` copy to `data/pre-key-rotation-<time>.pgdump`, and it refuses to run when `DB_PATH` or `TREK_DB_FILE` is set beside `TREK_DB_URL`. See [Encryption Key Rotation](Encryption-Key-Rotation).

## Limitations

- **Moving from SQLite goes one way.** The [move command](#moving-an-existing-install-to-postgres) copies a SQLite install into an empty Postgres database. The way back is to start TREK on the untouched SQLite file again; nothing copies Postgres data back into SQLite.
- **No more than one TREK replica.** TREK keeps state in memory: rate limits, pending one-time codes, the permission cache and the WebSocket connections. Each process has its own copy, so two replicas would disagree with each other. Keep `replicas: 1` in the Helm chart and one `trek` container. Postgres does not change that.
- **Two processes booting on one database at once are not coordinated.** Start one process for the first boot and for each upgrade, then continue with one.
- **PostgreSQL 14 to 18 only.** A newer server is refused until a TREK release supports it, because the image's client tools would not be able to back it up.
- **One TREK instance per database.** Plugin data schemas are named after the plugin alone (see [Plugin data](#plugin-data)), and a restore drops the plugin schemas the role owns. Give each instance its own database.
- **Writes are serialized.** TREK takes a database-wide advisory lock for each write transaction, as the SQLite engine does with its single writer. Heavy concurrent writes wait on that lock.

## Supabase

Supabase runs PostgreSQL and can host TREK's database. The checklist below has been run against a Supabase project over the direct connection: first boot on an empty database, sign-in, trips, backup, restore, restart, and the copy taken before a pending migration. The session pooler has not been checked yet.

- **Use the direct connection or the session pooler.** The direct connection uses port 5432. Its host resolves only to IPv6 unless the project has the IPv4 add-on. A container on a network without IPv6 (Docker Desktop's default network, for example) cannot reach it; use the session pooler there, which also listens on port 5432 on its own host.
- **Do not use the transaction pooler** (port 6543) for TREK. `pg_dump` and `psql` need a session that lasts for the whole run, and the transaction pooler does not give one.
- **Verify the server with Supabase's CA.** Supabase's certificate is signed by its own certificate authority, which the system's trusted authorities do not include, so `sslmode=require` alone fails for the backup and restore tools. Download the CA certificate from the project's database settings, mount it into the container, and use `sslmode=verify-full&sslrootcert=/certs/<file>.crt` with the path inside the container.
- **The `postgres` role works as TREK's role.** It is not a superuser, and it can create the schema and the `nocase` collation. If a restore refuses it, because it holds `pg_execute_server_program`, `pg_read_server_files` or `pg_write_server_files`, or because the project runs PostgreSQL 14 or 15, where its right to create roles lets it grant itself those, create a dedicated role without CREATEROLE as in [A role that is not a superuser](#a-role-that-is-not-a-superuser) (the `postgres` role may create roles) and connect TREK as that one.
- **The database's `public` schema must hold no tables** when TREK first starts, because TREK refuses a database with tables it did not create. A new project's `public` schema is empty.
- **Backups hold only TREK's schema.** The project's own schemas (`auth`, `storage` and the others Supabase manages) are left out of every backup, and a restore replaces only TREK's schema.
- **Pick a region close to the TREK server.** Every statement crosses the network, so a distant region makes the first boot and a restore take minutes. During a restore, scheduled jobs that touch the database can log statement timeouts; they run again on their next schedule.

## Manual verification checklist

Run it against a throwaway database before an install relies on this page. On Supabase, steps 1 to 6 have been run over the direct connection, and step 7 by marking the last applied migration as pending instead of starting an older image; step 8 and the session pooler have not.

1. Create an empty database and a non-superuser role that owns it. Set `TREK_DB_URL` with a verifying `sslmode` (on Supabase, `verify-full` with `sslrootcert`), or with the server's own setting otherwise.
2. Start one TREK process. Confirm the log reports the Postgres engine, the schema is created, and the admin account exists.
3. Sign in, create a trip, and confirm it appears after a page reload.
4. Create a backup from the Backup tab. Confirm the archive holds `travel.pgdump` and no `travel.db`.
5. Restore that backup from the Backup tab. Confirm the trip is still there, and that `data/pre-restore-<time>.pgdump` exists.
6. Stop and start TREK. Confirm the data is unchanged and no migration runs.
7. Upgrade: start an older image on a database, then the newer image. Confirm `data/pre-migrate-<last migration>-<time>.pgdump` appears, and that the migration runs.
8. Roll back with the copy, as described in [Updating](Updating#rolling-back-a-postgres-update), and confirm the older image starts on it.
9. Record the server version, the client tool versions, and any error text that differs from this page.

## See also

- [Environment Variables](Environment-Variables)
- [Backups](Backups)
- [Updating](Updating)
- [Troubleshooting](Troubleshooting)
- [Install: Docker Compose](Install-Docker-Compose)
- [Install: Helm](Install-Helm)
