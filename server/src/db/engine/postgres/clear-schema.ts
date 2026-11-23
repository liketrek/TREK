import { PLUGIN_SCHEMA_PREFIX, quotePluginSchema } from './plugin-schema';

/**
 * Drops every table, view, sequence, routine, collation and standalone type in
 * the current schema, except an extension's, before a dump is loaded: a dump
 * only recreates what it holds, so whatever a later migration added would
 * otherwise survive the restore and break the migrations the reopen runs. It
 * runs in the same transaction as the load (`pgRestore`), so a restore that
 * fails leaves the database as it was.
 */
export const CLEAR_SCHEMA_SQL = `DO $clear$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.oid::regclass AS name, c.relkind FROM pg_class c
    WHERE c.relnamespace = current_schema()::regnamespace AND c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype IN ('e', 'a', 'i'))
  LOOP
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM pg_class WHERE oid = r.name::oid);
    EXECUTE format('DROP %s IF EXISTS %s CASCADE',
      CASE r.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' WHEN 'S' THEN 'SEQUENCE'
        WHEN 'f' THEN 'FOREIGN TABLE' ELSE 'TABLE' END, r.name);
  END LOOP;
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
    WHERE p.pronamespace = current_schema()::regnamespace
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM pg_proc WHERE oid = r.sig::oid);
    EXECUTE format('DROP ROUTINE IF EXISTS %s CASCADE', r.sig);
  END LOOP;
  FOR r IN SELECT format('%I.%I', n.nspname, c.collname) AS name FROM pg_collation c
    JOIN pg_namespace n ON n.oid = c.collnamespace
    WHERE n.nspname = current_schema()
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = c.oid AND d.deptype = 'e')
  LOOP
    EXECUTE format('DROP COLLATION IF EXISTS %s CASCADE', r.name);
  END LOOP;
  FOR r IN SELECT t.oid::regtype AS name FROM pg_type t
    WHERE t.typnamespace = current_schema()::regnamespace AND t.typtype IN ('e', 'd', 'r')
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = t.oid AND d.deptype IN ('e', 'i'))
  LOOP
    CONTINUE WHEN NOT EXISTS (SELECT 1 FROM pg_type WHERE oid = r.name::oid);
    EXECUTE format('DROP TYPE IF EXISTS %s CASCADE', r.name);
  END LOOP;
END
$clear$;
`;

/**
 * Drops every plugin data schema TREK's role owns, then creates the ones
 * `schemas` names (a dump's) empty, for the restore script to fill: the script
 * holds what is in them, never the schemas themselves. Runs right after
 * CLEAR_SCHEMA_SQL, in the same transaction. A schema another role owns is
 * never dropped, whatever its name.
 */
export function pluginSchemasSql(schemas: readonly string[]): string {
  const drop = `DO $plugins$
DECLARE r record;
BEGIN
  FOR r IN SELECT nspname FROM pg_namespace
    WHERE starts_with(nspname, '${PLUGIN_SCHEMA_PREFIX}') AND pg_get_userbyid(nspowner) = current_user
  LOOP
    EXECUTE format('DROP SCHEMA %I CASCADE', r.nspname);
  END LOOP;
END
$plugins$;
`;
  return drop + schemas.map((name) => `CREATE SCHEMA ${quotePluginSchema(name)};\n`).join('');
}
