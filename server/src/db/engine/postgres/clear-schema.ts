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
    EXECUTE format('DROP %s IF EXISTS %s CASCADE',
      CASE r.relkind WHEN 'v' THEN 'VIEW' WHEN 'm' THEN 'MATERIALIZED VIEW' WHEN 'S' THEN 'SEQUENCE'
        WHEN 'f' THEN 'FOREIGN TABLE' ELSE 'TABLE' END, r.name);
  END LOOP;
  FOR r IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
    WHERE p.pronamespace = current_schema()::regnamespace
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
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
    EXECUTE format('DROP TYPE IF EXISTS %s CASCADE', r.name);
  END LOOP;
END
$clear$;
`;
