# Database: Postgres

By default TREK keeps all data in one SQLite file, `travel.db`, in the data directory. Setting `TREK_DB_URL` runs TREK on a PostgreSQL database instead. Without that variable nothing changes, and every page of this wiki that describes `travel.db` still applies to an install on SQLite.

> **Status:** Postgres support is new. It has been checked end to end against PostgreSQL 17 in Docker (first boot, sign-in, trips, backup and restore, the copy before a migration, `RESTORE_FROM_BACKUP`). The same checks have been run against a Supabase project over its direct connection; see [Supabase](#supabase) and the [Manual verification checklist](#manual-verification-checklist) below.

## When to use it

Use Postgres when you already run a PostgreSQL server and want TREK's data there, for example to back it up or monitor it with the tools you use for other databases. A single TREK container on a host with a local disk does not need it.

Postgres does not make TREK scale out. TREK still runs as one process. See [Limitations](#limitations).

## Requirements

- **PostgreSQL 14 to 18.** TREK refuses to start on any other server version, before it writes anything.
- **An empty database dedicated to TREK.** TREK creates its schema in an empty database. It refuses a database that holds tables it did not create, and a restore replaces everything in the schema it loads into. Do not share the database with another application.
- **A role that is not a superuser,** which owns the database or can create objects in its schema. A backup archive is a SQL script run by this role during a restore, so a role with fewer privileges limits what a crafted archive can do. A restore refuses a superuser and a role that holds `pg_execute_server_program` or `pg_write_server_files`, and TREK warns about such a role when it starts. See [A role that is not a superuser](#a-role-that-is-not-a-superuser).
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

Then use `postgres://trek:<password>@<host>:5432/trek` as `TREK_DB_URL`. A restore refuses a role that is a superuser, or that holds `pg_execute_server_program` or `pg_write_server_files`, because a crafted archive could use those to run commands or write files on the database server. TREK also logs a warning about such a role when it starts.

TREK creates its tables in the role's current schema, normally `public`. A role whose `search_path` points at a schema of its own works too: TREK keeps its tables and its migration history there, and backups and restores cover that schema.

### Moving a compose install off the superuser

An install that started from an older `docker-compose.postgres.yml` connects as `trek`, which the `postgres` image created as the superuser. Its backups work, but restores are refused until TREK runs as a role that is not a superuser. With the containers running:

1. Create a second superuser for administration, so the database keeps one: `docker exec -it trek-db psql -U trek -d trek -c "CREATE ROLE postgres LOGIN SUPERUSER PASSWORD '<a long random value>'"`.
2. Take the superuser right from `trek`: `docker exec -it trek-db psql -U postgres -d trek -c "ALTER ROLE trek NOSUPERUSER NOCREATEDB NOCREATEROLE"`.
3. Update `docker-compose.postgres.yml` to the current version. Set `POSTGRES_ADMIN_PASSWORD` to the password from step 1 in `.env`, and keep `POSTGRES_PASSWORD` as it is (it stays the password of `trek`). Then run `docker compose -f docker-compose.postgres.yml up -d`.

The database already exists, so the new init script does not run again, and TREK keeps its data.

## First boot

On the first start against an empty database, TREK:

1. Creates the schema from its baseline and records every migration the baseline covers as applied, in one transaction.
2. Applies any migrations after the baseline.
3. Seeds its default data and creates the admin account, from `ADMIN_EMAIL` and `ADMIN_PASSWORD` when set. Otherwise it prints a random password to the log.

A database that holds tables TREK did not create, and no TREK migration history, is refused. TREK names a few of the tables and writes nothing to the database. Point `TREK_DB_URL` at an empty database.

A database migrated by a newer TREK is refused, and the log says to run that version again or to restore a backup taken with this one.

**Start one TREK process for the first boot and for every upgrade.** Two processes that start at the same time on the same new database are not coordinated. The second one fails its boot, because the first one's schema transaction wins. Once the database is up to date and running, a single container is the supported setup. See [Limitations](#limitations).

### Moving an existing SQLite install

This first Postgres release has no tool that copies a SQLite install into Postgres. A SQLite backup cannot be restored into a Postgres database, and a Postgres backup cannot be restored into SQLite. Moving an existing install to Postgres means starting a new install on Postgres and recreating the data there, or keeping the SQLite install running.

## Upgrades

On a startup that has pending migrations, TREK writes a copy of the database before it migrates anything:

- The copy is a `pg_dump` custom-format file, `data/pre-migrate-<last migration>-<time>.pgdump`, next to the data the container keeps. The log prints the path.
- The newest `TREK_DB_PRE_MIGRATE_SNAPSHOT_KEEP` copies are kept (3 by default).
- If the copy cannot be written, for example because a client tool is missing or the disk is full, TREK refuses to migrate and does not start. Fix the cause, or set `TREK_DB_PRE_MIGRATE_SNAPSHOT=false` to migrate without a copy.
- A restart with nothing pending, and a first start on an empty database, write no copy.

The copy is a safety net for an update. It does not replace a backup, and it does not hold uploads. To go back to the previous image, follow [Updating: Rolling back a Postgres update](Updating#rolling-back-a-postgres-update).

## Backups and restore

A Postgres install produces the same backup archive as a SQLite install, with one difference: the database is stored as `travel.pgdump`, a `pg_dump` custom-format file, instead of `travel.db`. The uploads, plugin data and the encryption key are in the archive as before. See [Backups](Backups).

Restoring a backup on Postgres follows these rules:

- **The current database is replaced.** TREK first keeps a copy of it as `data/pre-restore-<time>.pgdump`. `pg_restore` then turns the archive's dump into a SQL script, and `psql` clears the current schema, which drops its tables, views, sequences, functions, types and collations, and runs the script. Both steps run in one transaction, so a restore that fails leaves the database as it was.
- **TREK checks the archive before it replaces anything.** The archive must hold a Postgres dump, not a SQLite file. The dump must carry TREK's migration history, and it must not come from a newer TREK. TREK refuses the restore with a message saying which check failed.
- **The client tools must be recent enough.** The restore refuses `pg_restore` or `psql` older than 18.0, 17.6, 16.10, 15.14 or 14.19, and tools older than the server.
- **The role must not be a superuser.** The restore refuses a role that is a superuser or holds `pg_execute_server_program` or `pg_write_server_files`. See [A role that is not a superuser](#a-role-that-is-not-a-superuser).
- **The restore needs free space in the data directory.** `pg_restore` writes the dump out as a SQL script next to the unpacked archive before `psql` runs it, and the script is several times larger than the dump. It may grow to `BACKUP_MAX_DECOMPRESSED_MB` (5 GB by default); a larger one is stopped, nothing is replaced, and the work files are removed. Raise the limit for a genuine backup that needs more.

`RESTORE_FROM_BACKUP` works on Postgres too. On the first start, TREK loads the archive's dump into the database when that database holds no tables. When the database already has tables, the variable is ignored and TREK logs a warning. See [Backups: Restoring on a new install, before setup](Backups#restoring-on-a-new-install-before-setup).

## Limitations

- **No migration from SQLite to Postgres** in this first release. Start a new install on Postgres, or keep the SQLite install.
- **No more than one TREK replica.** TREK keeps state in memory: rate limits, pending one-time codes, the permission cache and the WebSocket connections. Each process has its own copy, so two replicas would disagree with each other. Keep `replicas: 1` in the Helm chart and one `trek` container. Postgres does not change that.
- **Two processes booting on one database at once are not coordinated.** Start one process for the first boot and for each upgrade, then continue with one.
- **PostgreSQL 14 to 18 only.** A newer server is refused until a TREK release supports it, because the image's client tools would not be able to back it up.
- **Writes are serialized.** TREK takes a database-wide advisory lock for each write transaction, as the SQLite engine does with its single writer. Heavy concurrent writes wait on that lock.

## Supabase

Supabase runs PostgreSQL and can host TREK's database. The checklist below has been run against a Supabase project over the direct connection: first boot on an empty database, sign-in, trips, backup, restore, restart, and the copy taken before a pending migration. The session pooler has not been checked yet.

- **Use the direct connection or the session pooler.** The direct connection uses port 5432. Its host resolves only to IPv6 unless the project has the IPv4 add-on. A container on a network without IPv6 (Docker Desktop's default network, for example) cannot reach it; use the session pooler there, which also listens on port 5432 on its own host.
- **Do not use the transaction pooler** (port 6543) for TREK. `pg_dump` and `psql` need a session that lasts for the whole run, and the transaction pooler does not give one.
- **Verify the server with Supabase's CA.** Supabase's certificate is signed by its own certificate authority, which the system's trusted authorities do not include, so `sslmode=require` alone fails for the backup and restore tools. Download the CA certificate from the project's database settings, mount it into the container, and use `sslmode=verify-full&sslrootcert=/certs/<file>.crt` with the path inside the container.
- **The `postgres` role works as TREK's role.** It is not a superuser, and it can create the schema and the `nocase` collation. If a restore refuses it because it holds `pg_execute_server_program` or `pg_write_server_files`, create a dedicated role as in [A role that is not a superuser](#a-role-that-is-not-a-superuser) (the `postgres` role may create roles) and connect TREK as that one.
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
