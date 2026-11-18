/**
 * The plugin RPC accommodation writes read their place and day refs as row ids.
 *
 * accommodations.create read them with Math.trunc(Number(...)), so '0x5' was
 * place 5 and 1e20 reached Postgres, which refuses it as out of range;
 * accommodations.update bound the open input's refs as sent. Both now refuse
 * such a value with BAD_PARAMS before the service sees it.
 */
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { PluginGuards } from '../../../src/nest-rpc/plugin-guards.service';
import { createTestPluginRegistry } from '../../../src/nest-rpc/rpc-kit/testing';
import { AccommodationsRpc } from '../../../src/nest/accommodations/accommodations.rpc';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import type { RpcError, RpcRequest } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

import { describe, expect, it, vi } from 'vitest';

const req = (method: string, params: Record<string, unknown>): RpcRequest => ({ k: 'req', id: 'x', method, params });

function build() {
  const service = {
    getAccommodation: vi.fn(async () => ({ id: 3, place_id: 1, start_day_id: 1, end_day_id: 1 })),
    validateAccommodationRefs: vi.fn(async () => []),
    createAccommodation: vi.fn(async () => ({ accommodation: {}, mirror: {} })),
    updateAccommodation: vi.fn(async () => ({ accommodation: {}, mirror: {} })),
    announceMirror: vi.fn(async () => undefined),
  };
  const guards = new PluginGuards(
    { findAccessible: vi.fn(async () => ({ id: 1, user_id: 42 })) } as unknown as TripsRepository,
    { checkPermission: vi.fn(() => true) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
    { getRole: vi.fn(async () => 'user') } as unknown as UsersRepository,
  );
  const registry = createTestPluginRegistry([
    new AccommodationsRpc(service as never, { broadcast: vi.fn() } as never, guards),
  ]);
  const host = new PluginRpcHost('p', new Set(['db:write:accommodations']), makeDeps(), registry);
  return { host, service };
}

const MALFORMED = ['0x5', '5e0', '5.0', 1.5, 1e20, 'abc'];

describe('AccommodationsRpc row ids', () => {
  it('ACCRPC-001: create refuses a malformed place or day ref with BAD_PARAMS and writes nothing', async () => {
    const { host, service } = build();
    const valid = { place_id: 5, start_day_id: 6, end_day_id: 6 };
    const cases = (['place_id', 'start_day_id', 'end_day_id'] as const).flatMap((field) =>
      MALFORMED.map((value) => ({ ...valid, [field]: value })),
    );
    const replies = await Promise.all(
      cases.map((input) => host.dispatch(req('accommodations.create', { tripId: 1, input }), 42)),
    );
    expect(replies.map((r) => (r as RpcError).error?.code)).toEqual(cases.map(() => 'BAD_PARAMS'));
    expect(service.createAccommodation).not.toHaveBeenCalled();

    await host.dispatch(req('accommodations.create', { tripId: 1, input: { ...valid, place_id: '5' } }), 42);
    expect(service.createAccommodation).toHaveBeenCalledWith(1, expect.objectContaining({ place_id: 5 }));
  });

  it('ACCRPC-002: update refuses a malformed ref in its open input with BAD_PARAMS and writes nothing', async () => {
    const { host, service } = build();
    const cases = (['place_id', 'start_day_id', 'end_day_id'] as const).flatMap((field) =>
      MALFORMED.map((value) => ({ [field]: value })),
    );
    const replies = await Promise.all(
      cases.map((input) => host.dispatch(req('accommodations.update', { tripId: 1, accommodationId: 3, input }), 42)),
    );
    expect(replies.map((r) => (r as RpcError).error)).toEqual(
      cases.map((input) =>
        expect.objectContaining({ code: 'BAD_PARAMS', message: `${Object.keys(input)[0]} must be a number` }),
      ),
    );
    expect(service.updateAccommodation).not.toHaveBeenCalled();

    await host.dispatch(req('accommodations.update', { tripId: 1, accommodationId: 3, input: { place_id: '5' } }), 42);
    expect(service.validateAccommodationRefs).toHaveBeenCalledWith(1, 5, undefined, undefined);
  });
});
