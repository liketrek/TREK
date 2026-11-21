import { tableColumnsSql } from './dialect/catalog';
import { ALL_ENTITIES } from './entities';
import type { AnyOrm } from './orm';
import { ReferenceKind, type EntityProperty } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';

/**
 * What the entities map that the database lacks, named on every boot.
 *
 * The migrations are the only schema source, and on a healthy database the
 * entities describe exactly what they built (`entity-schema-parity.test.ts`,
 * PARITY-PG). An install the retired positional runner upgraded can still
 * lack a column its `schema_version` claims, because the legacy baseline
 * records those steps without running them: the migration that adds every
 * such column it can (`Migration20200101046460_...`) closes the known gaps,
 * and this names whatever is left, so it surfaces at the start instead of as
 * a failed request in one feature, or as a refused move to Postgres.
 *
 * It warns and does not refuse the start, not even when the check itself
 * fails: everything else keeps working, and no setting or command of the
 * operator's adds a column.
 */

const logger = new Logger('DB');

/** How many missing tables and columns the warning names before it counts the rest. */
const MAX_NAMED = 20;

interface ColumnRow {
  table_name: string;
  name: string;
}

/** Whether `prop` is stored in columns of its own entity's table. */
function ownsColumns(prop: EntityProperty): boolean {
  if (prop.persist === false) return false;
  if (prop.kind === ReferenceKind.ONE_TO_MANY || prop.kind === ReferenceKind.MANY_TO_MANY) return false;
  if (prop.kind === ReferenceKind.EMBEDDED) return false;
  return !(prop.kind === ReferenceKind.ONE_TO_ONE && !prop.owner);
}

/**
 * Every table and column an entity maps that the database does not have, as
 * `the table <name>` or `<table>.<column>`. Empty on a
 * database the migrations built.
 */
export async function schemaGaps(orm: AnyOrm): Promise<string[]> {
  const connection = orm.em.getConnection();
  const rows: ColumnRow[] = await connection.execute(tableColumnsSql(connection.getPlatform()));
  const present = new Map<string, Set<string>>();
  for (const row of rows) {
    const columns = present.get(row.table_name);
    if (columns) columns.add(row.name);
    else present.set(row.table_name, new Set([row.name]));
  }

  // The declared entities only: MikroORM also registers a pivot of its own for
  // a bare many-to-many, which its owning relation already covers.
  const declared = new Set(ALL_ENTITIES.map((schema) => schema.meta.className));
  const gaps: string[] = [];
  for (const meta of orm.getMetadata().getAll().values()) {
    if (!declared.has(meta.className) || meta.virtual || meta.embeddable || meta.abstract) continue;
    const columns = present.get(meta.tableName);
    if (!columns) {
      gaps.push(`the table ${meta.tableName}`);
      continue;
    }
    for (const prop of meta.props) {
      if (!ownsColumns(prop)) continue;
      for (const field of prop.fieldNames) if (!columns.has(field)) gaps.push(`${meta.tableName}.${field}`);
    }
  }
  return gaps;
}

/**
 * Logs what `schemaGaps` finds, once per start; says nothing on a healthy
 * database. A check that cannot run is logged too and never fails the start:
 * it only adds a diagnosis.
 */
export async function warnAboutSchemaGaps(orm: AnyOrm): Promise<void> {
  let gaps: string[];
  try {
    gaps = await schemaGaps(orm);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    logger.warn(
      `Could not check the database for tables and columns this TREK version uses (${reason}); ` +
        'the start goes on without that check.',
    );
    return;
  }
  if (gaps.length === 0) return;
  const named = gaps.slice(0, MAX_NAMED).join(', ');
  const more = gaps.length > MAX_NAMED ? ` and ${gaps.length - MAX_NAMED} more` : '';
  logger.warn(
    `The database lacks ${gaps.length} table(s) or column(s) this TREK version uses: ${named}${more}. ` +
      'Its upgrade history skipped them and no migration of this version can add them, so the features that use ' +
      'them fail, and a move to Postgres refuses the file. This is a bug in TREK: please report it with this message.',
  );
}
