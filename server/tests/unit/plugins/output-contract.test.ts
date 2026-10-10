/**
 * The plugin output contract on its own: how a result is shaped, that the table covers
 * the wire vocabulary, and that the router applies it to entity methods only. The
 * schema and real-service side is output-contract.schema.test.ts.
 */
import { PluginController, PluginMethod } from '../../../src/nest-rpc/rpc-kit/decorators';
import { createTestPluginRegistry } from '../../../src/nest-rpc/rpc-kit/testing';
import type { PluginRpcContext } from '../../../src/nest-rpc/rpc-kit/types';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { KNOWN_METHODS, UNCONDITIONAL_METHODS, type RpcResponse } from '../../../src/nest/plugins/protocol/envelope';
import {
  PLUGIN_ENTITY_CONTRACT,
  PLUGIN_ENTITY_NESTED,
  PLUGIN_METHOD_OUTPUT,
  pluginEntityFields,
  returnsEntity,
  shapePluginOutput,
  type PluginEntityContract,
  type PluginEntityName,
} from '../../../src/nest/plugins/protocol/output-contract';
import { makeDeps } from '../../helpers/rpc-host-deps';

import { describe, expect, it } from 'vitest';

const ENTITIES = Object.keys(PLUGIN_ENTITY_CONTRACT) as PluginEntityName[];
const contractOf = (entity: PluginEntityName): PluginEntityContract => PLUGIN_ENTITY_CONTRACT[entity];

describe('the contract table', () => {
  it('OUTCONTRACT-UNIT-001 has exactly one entry per wire method', () => {
    expect(Object.keys(PLUGIN_METHOD_OUTPUT).sort()).toEqual([...KNOWN_METHODS, ...UNCONDITIONAL_METHODS].sort());
  });

  it('OUTCONTRACT-UNIT-002 names only entities it defines', () => {
    for (const output of Object.values(PLUGIN_METHOD_OUTPUT)) {
      if (output.kind === 'entity') expect(ENTITIES).toContain(output.entity);
    }
  });

  it.each(Object.entries(PLUGIN_ENTITY_NESTED))(
    'OUTCONTRACT-UNIT-012 %s nests defined entities under its own derived keys',
    (entity, nested) => {
      const derived: readonly string[] = contractOf(entity as PluginEntityName).derived;
      for (const [key, child] of Object.entries(nested ?? {})) {
        expect(derived).toContain(key);
        expect(ENTITIES).toContain(child);
      }
    },
  );

  it.each(ENTITIES.filter((e) => contractOf(e).table === null))(
    'OUTCONTRACT-UNIT-013 the envelope %s has no columns of its own',
    (entity) => {
      const contract = contractOf(entity);
      expect(contract.columns).toEqual([]);
      expect(contract.withheld).toEqual([]);
      expect(contract.wholeRow).toBe(false);
      expect(contract.derived.length).toBeGreaterThan(0);
    },
  );

  it.each(ENTITIES)('OUTCONTRACT-UNIT-003 %s lists each field once and never publishes a withheld column', (entity) => {
    const contract = contractOf(entity);
    const fields = pluginEntityFields(entity);
    expect(new Set(fields).size).toBe(fields.length);
    expect(contract.withheld.filter((c) => fields.includes(c))).toEqual([]);
    expect(fields).toEqual([...contract.columns, ...contract.derived]);
  });

  it('OUTCONTRACT-UNIT-004 a trip withholds its feed token and a user exposes four fields', () => {
    expect(contractOf('trip').withheld).toEqual(['feed_token']);
    expect(pluginEntityFields('user')).toEqual(['id', 'username', 'display_name', 'avatar']);
  });

  it('OUTCONTRACT-UNIT-005 returnsEntity tells the entity methods from the rest', () => {
    expect(returnsEntity('trips.getById')).toBe(true);
    expect(returnsEntity('costs.listMine')).toBe(true);
    expect(returnsEntity('tags.list')).toBe(true);
    expect(returnsEntity('db.query')).toBe(false);
    expect(returnsEntity('atlas.visited')).toBe(false);
    expect(returnsEntity('no.such.method')).toBe(false);
  });
});

describe('shapePluginOutput', () => {
  it('OUTCONTRACT-UNIT-006 keeps the published fields in row order and drops the rest', () => {
    const nested = { id: 9, name: 'Museum' };
    const shaped = shapePluginOutput('trips.getById', {
      title: 'Japan',
      feed_token: 'secret',
      id: 1,
      column_added_later: 'x',
      day_count: 3,
      nested_extra: nested,
    });
    expect(shaped).toEqual({ title: 'Japan', id: 1, day_count: 3 });
    expect(Object.keys(shaped as object)).toEqual(['title', 'id', 'day_count']);
  });

  it('OUTCONTRACT-UNIT-007 shapes every row of a list and the child rows it carries', () => {
    const place = { id: 2, anything: true };
    const shaped = shapePluginOutput('trips.getDays', [
      {
        id: 1,
        date: '2026-05-01',
        assignments: [{ id: 1, place, assignment_new_column: 1 }],
        notes_items: [{ id: 5, text: 'Breakfast', day_note_new_column: 'x' }],
        secret_new: 1,
      },
      { id: 2, date: '2026-05-02', notes_items: [] },
    ]) as Array<Record<string, unknown>>;
    expect(shaped).toEqual([
      { id: 1, date: '2026-05-01', assignments: [{ id: 1, place }], notes_items: [{ id: 5, text: 'Breakfast' }] },
      { id: 2, date: '2026-05-02', notes_items: [] },
    ]);
    // A derived value without a nested entity (the assignment's place, built field by
    // field) is passed on as the same object.
    expect((shaped[0].assignments as Array<Record<string, unknown>>)[0].place).toBe(place);
  });

  it('OUTCONTRACT-UNIT-014 a child row is cut down however deep it sits', () => {
    const shaped = shapePluginOutput('vacay.mine', {
      plan: {
        id: 1,
        owner_id: 2,
        plan_new_column: 1,
        holiday_calendars: [{ id: 3, label: 'DE', calendar_new_column: 1 }],
      },
      users: [{ id: 2, username: 'ana', color: '#fff' }],
      isOwner: true,
      envelope_new_key: 1,
    });
    expect(shaped).toEqual({
      plan: { id: 1, owner_id: 2, holiday_calendars: [{ id: 3, label: 'DE' }] },
      users: [{ id: 2, username: 'ana', color: '#fff' }],
      isOwner: true,
    });
  });

  it('OUTCONTRACT-UNIT-015 a single child row is shaped and a missing one keeps its form', () => {
    expect(
      shapePluginOutput('collections.get', { collection: { id: 1, name: 'Rome', new_column: 1 }, places: [] }),
    ).toEqual({
      collection: { id: 1, name: 'Rome' },
      places: [],
    });
    expect(shapePluginOutput('collections.get', { collection: null, places: [] })).toEqual({
      collection: null,
      places: [],
    });
    expect(shapePluginOutput('trips.getReservations', [{ id: 1, endpoints: null }])).toEqual([
      { id: 1, endpoints: null },
    ]);
    expect(
      shapePluginOutput('trips.getReservations', [{ id: 1, endpoints: [{ id: 2, code: 'FRA', secret: 1 }, 7] }]),
    ).toEqual([{ id: 1, endpoints: [{ id: 2, code: 'FRA' }, 7] }]);
  });

  it('OUTCONTRACT-UNIT-008 a missing row keeps its wire form', () => {
    expect(shapePluginOutput('users.getById', undefined)).toBeUndefined();
    expect(shapePluginOutput('trips.getById', null)).toBeNull();
    // A list method that did not get a list is passed on rather than guessed at.
    expect(shapePluginOutput('trips.listMine', null)).toBeNull();
    // A single-row method that got an array (or a primitive) is passed on too.
    expect(shapePluginOutput('trips.getById', [1])).toEqual([1]);
    expect(shapePluginOutput('trips.getById', 5)).toBe(5);
  });

  it('OUTCONTRACT-UNIT-009 a host or read-model result is returned as the same object', () => {
    const own = [{ anything: 1 }];
    expect(shapePluginOutput('db.query', own)).toBe(own);
    const visited = { countries: [{ country_code: 'DE', brand_new_column: true }], regions: [] };
    expect(shapePluginOutput('atlas.visited', visited)).toBe(visited);
    expect(shapePluginOutput('no.such.method', visited)).toBe(visited);
  });
});

/** Two real wire methods: one entity read and one read model. */
@PluginController()
class ProbeRpc {
  @PluginMethod('trips.getById', { permission: 'db:read:trips' })
  trip(_params: Record<string, unknown>, ctx: PluginRpcContext) {
    return { id: 1, title: 'Japan', feed_token: 'secret', added_later: ctx.actingUserId };
  }

  @PluginMethod('atlas.visited', { permission: 'db:read:atlas' })
  visited() {
    return { countries: [{ country_code: 'DE', added_later: true }], regions: [] };
  }
}

describe('the router applies the contract', () => {
  const dispatch = async (method: string, granted: string) => {
    const host = new PluginRpcHost('p', new Set([granted]), makeDeps(), createTestPluginRegistry([new ProbeRpc()]));
    const res = await host.dispatch({ k: 'req', id: 'x', method, params: {} }, 42);
    expect(res.ok).toBe(true);
    return (res as RpcResponse).result;
  };

  it('OUTCONTRACT-UNIT-010 a plugin dispatching an entity read receives the shaped row', async () => {
    expect(await dispatch('trips.getById', 'db:read:trips')).toEqual({ id: 1, title: 'Japan' });
  });

  it('OUTCONTRACT-UNIT-011 a read-model result reaches the plugin with every key', async () => {
    expect(await dispatch('atlas.visited', 'db:read:atlas')).toEqual({
      countries: [{ country_code: 'DE', added_later: true }],
      regions: [],
    });
  });
});
