import { TravelTransferOperations } from '../../db/entities/TravelTransferOperations.entity';
import { TRANSFER_NATIVE_MAP, type TransferNativeMap } from '../../db/json-columns';
import { TravelTransferOperationsRepository } from '../../db/repositories/TravelTransferOperations.repository';
import {
  NATIVE_DOMAINS,
  type NativeDomain,
  type NativeRow,
} from '../../db/repositories/_shared/transfer-native-domains';
import { decodeJson } from '../../utils/json-column';
import type { MaterializedFiles } from './transfer-native-files';
import { nativeFieldName, portableValue, nativeValue, decoratePortable } from './transfer-native-values';
import { canonical, fail, MAX_RECORDS, sha, type Graph, type TransferRecord } from './transfer-wire';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

const decimals = new Set(['total_price', 'amount', 'exchange_rate', 'weight_grams', 'weight_limit_grams']);
const domainFor = (table: string): NativeDomain => {
  const domain = NATIVE_DOMAINS.find((d) => d.table === table);
  if (!domain) fail('Unknown native mapping', 422);
  return domain;
};
const keyFor = (domain: NativeDomain, row: NativeRow): NativeRow =>
  Object.fromEntries(domain.keys.map((key) => [key, row[key]]));
const rowKey = (table: string, key: NativeRow): string => table + ':' + sha(canonical(key));
function privateRow(domain: NativeDomain, row: NativeRow): boolean {
  return Boolean(domain.privateOwner || (domain.table === 'packing_items' && row.is_private));
}
function accessible(domain: NativeDomain, row: NativeRow, user: number): boolean {
  if (domain.privateOwner) return row[domain.privateOwner] === user;
  return domain.table !== 'packing_items' || !row.is_private || row.owner_id === user;
}

@Injectable()
export class TransferNative {
  constructor(@InjectRepository(TravelTransferOperations) private readonly store: TravelTransferOperationsRepository) {}

  /** Project every explicitly reviewed domain inside the caller's consistent DB snapshot. */
  async project(trip: number) {
    const root = await this.store.trip(trip);
    if (!root) fail('Trip unavailable', 404);
    const rows = await this.store.nativeRows(trip);
    if (Object.values(rows).reduce((n, group) => n + group.length, 0) > MAX_RECORDS)
      fail('Native trip exceeds transfer record limit', 413);
    const unsupported = await this.store.unprojectedDomain(trip, rows);
    if (unsupported) fail(`Native ${unsupported} transfer projection is unavailable. No data was omitted.`, 422);
    const saved = await this.store.graph(trip);
    const bindings: TransferNativeMap = Object.assign(
      Object.create(null),
      saved ? decodeJson(TRANSFER_NATIVE_MAP, saved.native_map) : {},
    );
    const aliases = new Map(Object.entries(bindings).map(([id, b]) => [rowKey(b.table, b.key), id]));
    const targets = new Map<string, string>();
    const authorised: { domain: NativeDomain; row: NativeRow; id: string }[] = [];
    for (const domain of NATIVE_DOMAINS) {
      for (const row of rows[domain.table]) {
        const key = rowKey(domain.table, keyFor(domain, row));
        if (!accessible(domain, row, root.user_id)) {
          if (aliases.has(key)) fail('Private source access changed; restore access before syncing', 403);
          continue;
        }
        const id = aliases.get(key) ?? 'trek:' + key;
        authorised.push({ domain, row, id });
        // Primary-key associations only. A numeric source ID never resolves outside this trip.
        if (domain.keys.length === 1) targets.set(domain.table + ':' + row[domain.keys[0]], id);
      }
    }
    const people = [
      ...new Set(
        authorised.flatMap(({ domain, row }) =>
          domain.accounts.map((column) => row[column]).filter((value): value is number => typeof value === 'number'),
        ),
      ),
    ];
    const names = await this.store.historicalPeople(people);
    const records: TransferRecord[] = [];
    const current: TransferNativeMap = Object.create(null);
    for (const { domain, row, id } of authorised) {
      const fields: Record<string, unknown> = {},
        references: Record<string, string | null> = {};
      for (const column of domain.columns) {
        if (
          (column === 'id' && domain.keys.includes(column)) ||
          column === 'trip_id' ||
          domain.omitted.includes(column)
        )
          continue;
        const value = row[column],
          name = nativeFieldName(domain, column, row);
        if (domain.accounts.includes(column)) {
          fields['trek_' + column] = value === null ? null : { id: String(value), name: names[String(value)] ?? null };
        } else if (domain.references[column]) {
          const target = value === null ? null : targets.get(domain.references[column] + ':' + value);
          if (target === undefined) {
            // Children of another person's private packing item are not ours to export.
            if (domain.scope.parent === 'packing_items') continue;
            fail('Native relationship is outside the authorised trip', 422);
          }
          references[name] = target;
        } else {
          fields[name] = portableValue(domain, column, value);
          if (canonical(fields[name]) !== canonical(value)) {
            const raw = (fields.trek_native_values ??= {}) as Record<string, unknown>;
            raw[column] = value;
          }
        }
      }
      decoratePortable(domain, row, fields, root.currency ?? 'EUR');
      if (domain.scope.parent === 'packing_items' && !targets.has('packing_items:' + row.item_id)) continue;
      const visibility = privateRow(domain, row) ? 'private' : 'trip';
      if (domain.table === 'packing_items') fields.visibility = visibility === 'private' ? 'personal' : 'common';
      // Derivable display labels do not invent historical facts.
      if (domain.table === 'day_assignments' || domain.table === 'day_accommodations')
        fields.title = rows.places.find((p) => p.id === row.place_id)?.name ?? '';
      const record: TransferRecord = {
        id,
        kind: domain.kind,
        visibility,
        fields,
        references,
        source: { provider: 'trek', fields: Object.fromEntries(Object.keys(fields).map((k) => [k, 'present'])) },
      };
      records.push(record);
      current[id] = { table: domain.table, key: keyFor(domain, row), baseline: record };
    }
    const virtual = (id: string, kind: string, fields: Record<string, unknown>): TransferRecord => ({
      id,
      kind,
      fields,
      references: {},
      visibility: 'trip',
      source: { provider: 'trek', fields: Object.fromEntries(Object.keys(fields).map((name) => [name, 'present'])) },
    });
    let packingList = false;
    const travellers = new Set<number>();
    for (const record of records) {
      const binding = current[record.id];
      if (binding.table === 'packing_items') {
        const priorList = bindings[record.id]?.baseline.references.list_id;
        record.references.list_id = priorList ?? 'trek:packing-list';
        if (!priorList || priorList === 'trek:packing-list') packingList = true;
      }
      if (
        [
          'budget_item_members',
          'budget_item_payers',
          'budget_settlements',
          'reservation_travelers',
          'assignment_participants',
        ].includes(binding.table)
      ) {
        const domain = domainFor(binding.table);
        const row = rows[binding.table].find((r) => canonical(keyFor(domain, r)) === canonical(binding.key));
        if (!row) fail('Native attribution changed');
        for (const column of ['user_id', 'from_user_id', 'to_user_id']) {
          const person = row[column];
          if (typeof person !== 'number') continue;
          travellers.add(person);
          record.references[
            column === 'from_user_id'
              ? 'from_traveller_id'
              : column === 'to_user_id'
                ? 'to_traveller_id'
                : 'traveller_id'
          ] = 'trek:traveller:' + person;
        }
      }
      if (binding.table === 'budget_items') {
        const members = rows.budget_item_members.filter((r) => r.budget_item_id === binding.key.id);
        if (members.length) {
          record.fields.split_mode = members.every((r) => r.amount === null) ? 'equal' : 'custom';
          record.source.fields.split_mode = 'present';
        }
      }
    }
    if (packingList) records.push(virtual('trek:packing-list', 'packing_lists', { title: 'Packing' }));
    for (const person of travellers)
      records.push(
        virtual('trek:traveller:' + person, 'travellers', {
          name: names[String(person)] ?? 'Source traveller',
          trek_person_id: String(person),
        }),
      );
    // Dependants inherit their private parent's audience; never leave a shared reference to a private row.
    const byId = new Map(records.map((r) => [r.id, r]));
    for (let pass = 0; pass < records.length; pass++) {
      let changed = false;
      for (const record of records)
        if (
          record.visibility === 'trip' &&
          Object.values(record.references).some((id) => id && byId.get(id)?.visibility === 'private')
        ) {
          record.visibility = 'private';
          changed = true;
        }
      if (!changed) break;
    }
    return { records, bindings: current, previousBindings: bindings, rows };
  }

  /** Native edits replace only changed projected fields; source-only facts remain lossless. */
  merge(graph: Graph, projection: Awaited<ReturnType<TransferNative['project']>>): Graph {
    const old = new Map(graph.records.map((r) => [r.id, r]));
    for (const [id] of Object.entries(projection.previousBindings)) if (!projection.bindings[id]) old.delete(id);
    for (const native of projection.records) {
      const previous = projection.previousBindings[native.id]?.baseline;
      const retained = old.get(native.id);
      if (retained && !previous && ['packing_lists', 'travellers'].includes(native.kind)) continue;
      if (retained && !previous && canonical(retained) !== canonical(native))
        fail('Native identity collides with protected source data', 422);
      if (!retained || !previous) {
        old.set(native.id, native);
        continue;
      }
      if (retained.kind !== native.kind) fail('Native record kind changed', 422);
      for (const name of new Set([...Object.keys(previous.fields), ...Object.keys(native.fields)])) {
        if (
          name === 'title' &&
          ['day_assignments', 'day_accommodations'].includes(projection.bindings[native.id].table)
        )
          continue;
        if (canonical(previous.fields[name] ?? null) !== canonical(native.fields[name] ?? null)) {
          if (Object.hasOwn(native.fields, name)) {
            retained.fields[name] = native.fields[name];
            retained.source.fields[name] = 'present';
          } else {
            delete retained.fields[name];
            delete retained.source.fields[name];
          }
        }
      }
      for (const name of new Set([...Object.keys(previous.references), ...Object.keys(native.references)]))
        if (previous.references[name] !== native.references[name])
          retained.references[name] = native.references[name] ?? null;
      if (native.visibility !== previous.visibility) retained.visibility = native.visibility;
    }
    const records = [...old.values()];
    const ids = new Set(records.map((r) => r.id));
    return { ...graph, records, originals: graph.originals.filter((o) => ids.has(o.record)) };
  }

  async apply(
    trip: number,
    graph: Graph,
    before: Awaited<ReturnType<TransferNative['project']>> | null,
    files: MaterializedFiles = {},
  ) {
    const bindings: TransferNativeMap = Object.assign(Object.create(null), before?.bindings ?? {});
    const records = new Map(graph.records.map((r) => [r.id, r]));
    const root = await this.store.trip(trip);
    if (!root) fail('Trip unavailable', 404);
    // Deletions are explicit and cannot remove unmapped/private children by a native cascade.
    const removed = Object.entries(bindings).filter(([id]) => !records.has(id));
    for (const [id, binding] of removed) {
      if (!domainFor(binding.table).writable.length)
        fail('Historical native records cannot be deleted by transfer', 422);
      for (const child of Object.values(bindings))
        if (records.has(child.baseline.id) && Object.values(child.baseline.references).includes(id))
          fail('Native deletion would remove a retained relationship', 422);
    }
    if (before) {
      const deleting = new Set(removed.map(([, b]) => rowKey(b.table, b.key)));
      for (const [, parent] of removed)
        for (const domain of NATIVE_DOMAINS) {
          const columns = Object.entries(domain.references)
            .filter(([, table]) => table === parent.table)
            .map(([name]) => name);
          for (const row of before.rows[domain.table]) {
            if (
              columns.some((column) => row[column] === Object.values(parent.key)[0]) &&
              !deleting.has(rowKey(domain.table, keyFor(domain, row)))
            )
              fail('Native deletion would cascade to a retained or private record', 422);
          }
        }
    }
    // Vacate unique day positions before swapping/reordering. The transaction rolls this back on any error.
    await Object.values(bindings)
      .filter(
        (b) =>
          b.table === 'days' &&
          (!records.has(b.baseline.id) ||
            ['present', 'empty'].includes(records.get(b.baseline.id)?.source.fields.position ?? '')),
      )
      .reduce(async (p, b) => {
        await p;
        await this.store.updateMapped(domainFor('days'), b.key, { day_number: -Number(b.key.id) });
      }, Promise.resolve());
    // Parent-first creation; nullable foreign links are connected after every row exists.
    const pending: {
      domain: NativeDomain;
      record: TransferRecord;
      values: NativeRow;
      existing?: TransferNativeMap[string];
    }[] = [];
    for (const record of graph.records) {
      if (record.id === 'trip') continue;
      const existing = bindings[record.id];
      const domain = existing
        ? domainFor(existing.table)
        : NATIVE_DOMAINS.find((d) => d.kind === record.kind && d.writable.length);
      if (!domain || !domain.writable.length) continue;
      if (existing && existing.baseline.kind !== record.kind) fail('Native record kind changed', 422);
      if (record.visibility === 'private' && domain.table !== 'packing_items') {
        if (existing) fail('Native record cannot represent this private audience', 422);
        continue;
      }
      const values: NativeRow = { ...files[record.id] };
      for (const column of domain.writable) {
        const name = nativeFieldName(domain, column, record.fields);
        if (domain.references[column]) continue;
        if (!Object.hasOwn(record.fields, name)) {
          if (existing && Object.hasOwn(existing.baseline.fields, name))
            fail('Removing a native field requires an explicit value', 422);
          continue;
        }
        if (!['present', 'empty'].includes(record.source.fields[name])) continue;
        const value = nativeValue(domain, column, record.fields);
        if (value !== null && typeof value !== 'string' && typeof value !== 'number')
          fail('Invalid native scalar', 422);
        if (value === null && !domain.nullable.includes(column)) fail('Required native field is null', 422);
        if (value !== null && typeof value !== (domain.numeric.includes(column) ? 'number' : 'string'))
          fail('Invalid native field type', 422);
        if (
          typeof value === 'number' &&
          (!Number.isFinite(value) ||
            (!['lat', 'lng'].includes(column) && !decimals.has(column) && !Number.isSafeInteger(value)))
        )
          fail('Invalid native number', 422);
        if (
          typeof value === 'number' &&
          ['day_number', 'order_index', 'sort_order', 'sequence', 'duration_minutes', 'packed_quantity'].includes(
            column,
          ) &&
          value < 0
        )
          fail('Invalid native position or quantity', 422);
        if (column === 'quantity' && (Number(value) < 1 || Number(value) > 999)) fail('Invalid packing quantity', 422);
        if ((column === 'lat' && Math.abs(Number(value)) > 90) || (column === 'lng' && Math.abs(Number(value)) > 180))
          fail('Invalid coordinates', 422);
        if (
          ['date', 'due_date', 'local_date'].includes(column) &&
          value !== null &&
          value !== '' &&
          (typeof value !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            !Number.isFinite(Date.parse(value)) ||
            new Date(value).toISOString().slice(0, 10) !== value)
        )
          fail('Invalid native date', 422);
        if (
          ['checked', 'end_day', 'needs_review', 'paid', 'starred'].includes(column) &&
          value !== null &&
          value !== 0 &&
          value !== 1
        )
          fail('Invalid native boolean', 422);
        values[column] = value as NativeRow[string];
      }
      if (
        domain.table === 'todo_items' &&
        Object.hasOwn(record.fields, 'completed_at') &&
        ['present', 'empty'].includes(record.source.fields.completed_at)
      ) {
        const completion = record.fields.completed_at;
        if (completion !== null && (typeof completion !== 'string' || !Number.isFinite(Date.parse(completion))))
          fail('Invalid task completion date', 422);
        if (
          ['present', 'empty'].includes(record.source.fields.checked) &&
          typeof record.fields.checked === 'boolean' &&
          record.fields.checked !== (completion !== null)
        )
          fail('Task completion fields disagree', 422);
        values.checked = Number(completion !== null);
      }
      if (domain.scope.parent === 'trips') values.trip_id = trip;
      if (domain.table === 'packing_items') {
        values.is_private = Number(record.visibility === 'private');
        if (!existing) values.owner_id = root.user_id;
      }
      pending.push({ domain, record, values, existing });
    }
    await NATIVE_DOMAINS.reduce(async (prior, domain) => {
      await prior;
      await pending
        .filter((p) => p.domain === domain)
        .reduce(async (previous, item) => {
          await previous;
          if (item.existing) return;
          const values = { ...item.values };
          for (const column of domain.required) {
            if (domain.references[column]) {
              const target = item.record.references[nativeFieldName(domain, column, item.record.fields)];
              const binding = target ? bindings[target] : null;
              if (binding?.table === domain.references[column]) values[column] = Object.values(binding.key)[0];
            }
          }
          if (domain.required.some((column) => values[column] == null)) return; // protected source record
          const id = await this.store.nativeInsert(domain, values);
          bindings[item.record.id] = { table: domain.table, key: { id }, baseline: item.record };
        }, Promise.resolve());
    }, Promise.resolve());
    await pending.reduce(async (previous, item) => {
      await previous;
      const binding = bindings[item.record.id];
      if (!binding) return;
      for (const [column, table] of Object.entries(item.domain.references)) {
        if (!item.domain.writable.includes(column)) continue;
        const name = nativeFieldName(item.domain, column, item.record.fields);
        if (!Object.hasOwn(item.record.references, name)) continue;
        const target = item.record.references[name],
          other = target ? bindings[target] : null;
        if (target && (!other || other.table !== table)) fail('Native relationship cannot be represented safely', 422);
        item.values[column] = other ? Object.values(other.key)[0] : null;
      }
      if (
        item.domain.table === 'todo_items' &&
        (!item.existing || canonical(item.record.fields) !== canonical(item.existing.baseline.fields))
      )
        await this.store.silenceTask(Number(binding.key.id));
      await this.store.updateMapped(item.domain, binding.key, item.values);
    }, Promise.resolve());
    await [...NATIVE_DOMAINS].reverse().reduce(async (previous, domain) => {
      await previous;
      await removed
        .filter(([, b]) => b.table === domain.table)
        .reduce(async (p, [id, binding]) => {
          await p;
          await this.store.deleteMapped(domain, binding.key);
          delete bindings[id];
        }, Promise.resolve());
    }, Promise.resolve());
    return bindings;
  }
}
