/**
 * The order the move fills the tables in, from the target's foreign keys: a
 * table after every table it points at, so each row it inserts finds the row
 * it references. Ties go by name, so two runs over one schema copy in the
 * same order.
 *
 * A foreign key that cannot be satisfied by the order alone (a table pointing
 * at itself, like a reply at its message, or a cycle between tables) is
 * deferred: its columns are inserted as NULL and set once every row of the
 * tables is in, still inside the move's one transaction. Postgres checks each
 * foreign key when the row is written, so this is what lets a parent row
 * arrive after its child.
 */

/** One foreign key of the target: `columns` of `table` point at `references`. */
export interface ForeignKey {
  table: string;
  columns: readonly string[];
  references: string;
}

interface CopyPlan {
  /** Every table, each after the tables it points at. */
  order: string[];
  /** Per table, the foreign key columns written as NULL first and set after all rows are in. */
  deferred: Map<string, string[]>;
}

function defer(plan: CopyPlan, fk: ForeignKey): void {
  const columns = plan.deferred.get(fk.table) ?? [];
  for (const column of fk.columns) if (!columns.includes(column)) columns.push(column);
  plan.deferred.set(fk.table, columns);
}

/** Plans the order for `tables`. A foreign key to a table outside the list (one the move does not copy) is ignored. */
export function planCopyOrder(tables: readonly string[], foreignKeys: readonly ForeignKey[]): CopyPlan {
  const plan: CopyPlan = { order: [], deferred: new Map() };
  const known = new Set(tables);
  const pending = new Set([...tables].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)));
  const keys = foreignKeys.filter((fk) => known.has(fk.table) && known.has(fk.references));
  for (const fk of keys) if (fk.table === fk.references) defer(plan, fk);
  const between = keys.filter((fk) => fk.table !== fk.references);

  while (pending.size > 0) {
    const waitsOn = (table: string) => between.filter((fk) => fk.table === table && pending.has(fk.references));
    let next = [...pending].find((table) => waitsOn(table).length === 0);
    if (next === undefined) {
      // A cycle: break it at the first table by name, deferring its keys into the rest of the cycle.
      next = [...pending][0];
      for (const fk of waitsOn(next)) defer(plan, fk);
    }
    plan.order.push(next);
    pending.delete(next);
  }
  return plan;
}
