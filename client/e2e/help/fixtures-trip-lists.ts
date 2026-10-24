import type { APIRequestContext } from '@playwright/test';
import { seededTrip } from './fixtures';

/**
 * Putting the packing list back the way the seed left it.
 *
 * The seed's list is long (six lists, most of it ticked) and several guides
 * change it in ways that are hard to undo one by one: a list dragged to the
 * front, pieces counted in, a weight typed, items imported or brought in by a
 * template. So the trip-lists script takes one snapshot of the list before the
 * first guide and every packing guide puts that snapshot back, before it starts
 * and again when it is done. Nothing here hard-codes the seed's names, so a
 * richer seed needs no change in this file.
 */

export interface PackingSnapshotRow {
  id: number;
  name: string;
  category: string | null;
  checked: number;
  quantity: number;
  weight_grams: number | null;
  packed_quantity: number | null;
  bag_id: number | null;
  is_private: number;
  sort_order: number;
}

type RawRow = Partial<PackingSnapshotRow> & { id: number; name: string };

function normalise(row: RawRow): PackingSnapshotRow {
  return {
    id: row.id,
    name: row.name,
    category: row.category ?? null,
    checked: row.checked ? 1 : 0,
    quantity: row.quantity || 1,
    weight_grams: row.weight_grams ?? null,
    packed_quantity: row.packed_quantity ?? null,
    bag_id: row.bag_id ?? null,
    is_private: row.is_private ? 1 : 0,
    sort_order: row.sort_order ?? 0,
  };
}

async function packingRows(api: APIRequestContext): Promise<PackingSnapshotRow[]> {
  const { tripId } = seededTrip();
  const res = await api.get(`/api/trips/${tripId}/packing`);
  if (!res.ok()) throw new Error(`could not read the packing list: ${res.status()} ${await res.text()}`);
  const body = (await res.json()) as { items?: RawRow[] };
  return (body.items ?? []).map(normalise).sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

/** The packing list as it is now, in its order. */
export async function snapshotPacking(api: APIRequestContext): Promise<PackingSnapshotRow[]> {
  return packingRows(api);
}

const differs = (a: PackingSnapshotRow, b: PackingSnapshotRow): boolean =>
  a.name !== b.name ||
  a.category !== b.category ||
  a.checked !== b.checked ||
  a.quantity !== b.quantity ||
  a.weight_grams !== b.weight_grams ||
  a.packed_quantity !== b.packed_quantity ||
  a.bag_id !== b.bag_id;

/**
 * Make the trip's packing list equal to the snapshot again: what a guide added
 * goes, what it deleted comes back, ticks, quantities, counts and weights are
 * written back, and the order is restored. Cheap when nothing changed: one read.
 */
export async function restorePacking(api: APIRequestContext, snapshot: PackingSnapshotRow[]): Promise<void> {
  const { tripId } = seededTrip();
  const current = await packingRows(api);
  const wanted = new Set(snapshot.map((row) => row.id));

  for (const row of current.filter((r) => !wanted.has(r.id))) {
    await api.delete(`/api/trips/${tripId}/packing/${row.id}`);
  }

  const ids: number[] = [];
  for (const row of snapshot) {
    const now = current.find((r) => r.id === row.id);
    if (now) {
      ids.push(row.id);
      if (!differs(now, row)) continue;
      // Naming `checked` resets the piece counter on the server, which is what a
      // seeded row has: none. A partial count is written after it when there was one.
      const data: Record<string, unknown> = {
        name: row.name,
        checked: row.checked,
        quantity: row.quantity,
        weight_grams: row.weight_grams,
      };
      if (row.category) data.category = row.category;
      if (now.bag_id !== row.bag_id) data.bag_id = row.bag_id;
      const res = await api.put(`/api/trips/${tripId}/packing/${row.id}`, { data });
      if (!res.ok()) throw new Error(`could not restore "${row.name}": ${res.status()} ${await res.text()}`);
      if (row.packed_quantity != null) {
        await api.put(`/api/trips/${tripId}/packing/${row.id}`, { data: { packed_quantity: row.packed_quantity } });
      }
      continue;
    }
    const created = await api.post(`/api/trips/${tripId}/packing`, {
      data: {
        name: row.name,
        ...(row.category ? { category: row.category } : {}),
        visibility: row.is_private ? 'personal' : 'common',
        quantity: row.quantity,
        weight_grams: row.weight_grams,
        checked: row.checked,
      },
    });
    if (!created.ok())
      throw new Error(`could not re-create "${row.name}": ${created.status()} ${await created.text()}`);
    const { item } = (await created.json()) as { item: { id: number } };
    ids.push(item.id);
  }

  const after = await packingRows(api);
  const inOrder = after.map((r) => r.id);
  if (inOrder.length === ids.length && inOrder.every((id, i) => id === ids[i])) return;
  await api.put(`/api/trips/${tripId}/packing/reorder`, { data: { orderedIds: ids } });
}

/** Untick one item for a guide that starts from an item still to pack. */
export async function untickPacking(api: APIRequestContext, name: string): Promise<void> {
  const { tripId } = seededTrip();
  const row = (await packingRows(api)).find((r) => r.name === name);
  if (!row) throw new Error(`no packing item "${name}" in the seed`);
  if (!row.checked) return;
  const res = await api.put(`/api/trips/${tripId}/packing/${row.id}`, { data: { checked: 0 } });
  if (!res.ok()) throw new Error(`could not untick "${name}": ${res.status()} ${await res.text()}`);
}
