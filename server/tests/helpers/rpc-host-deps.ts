import { vi } from 'vitest';
import type { HostDeps } from '../../src/nest/plugins/host/rpc-host';
import { TagsRpc } from '../../src/nest/tags/tags.rpc';
import { CategoriesRpc } from '../../src/nest/categories/categories.rpc';
import { WeatherRpc } from '../../src/nest/weather/weather.rpc';
import { ExchangeRatesRpc } from '../../src/nest/budget/exchange-rates.rpc';
import { TodoRpc } from '../../src/nest/todo/todo.rpc';
import { DayNotesRpc } from '../../src/nest/day-notes/day-notes.rpc';
import { PackingRpc } from '../../src/nest/packing/packing.rpc';
import { FilesRpc } from '../../src/nest/files/files.rpc';
import { PlacesRpc } from '../../src/nest/places/places.rpc';
import { DaysRpc } from '../../src/nest/days/days.rpc';
import { ItineraryRpc } from '../../src/nest/assignments/itinerary.rpc';
import { TripsRpc } from '../../src/nest/trips/trips.rpc';
import { CostsRpc } from '../../src/nest/budget/costs.rpc';
import { ReservationsRpc } from '../../src/nest/reservations/reservations.rpc';
import { AccommodationsRpc } from '../../src/nest/accommodations/accommodations.rpc';
import { CollabRpc } from '../../src/nest/collab/collab.rpc';
import { AtlasRpc } from '../../src/nest/atlas/atlas.rpc';
import { VacayRpc } from '../../src/nest/vacay/vacay.rpc';
import { JournalRpc } from '../../src/nest/journey/journal.rpc';
import { CollectionsRpc } from '../../src/nest/collections/collections.rpc';
import { DbRpc } from '../../src/nest/plugins/host/rpc/db.rpc';
import { MetaRpc } from '../../src/nest/plugins/host/rpc/meta.rpc';
import { HostSurfaceRpc } from '../../src/nest/plugins/host/rpc/host-surface.rpc';
import { PluginHooks } from '../../src/nest/plugins/plugin-hooks.service';

/**
 * The stubbed HostDeps every plugin router test builds on.
 *
 * It used to be a 150-line sheet of domain stubs, because the router held every
 * handler. The handlers now live on the domains' `@PluginController()` classes and
 * stub their own services, so what is left here is what the router itself still
 * touches: the plugin's own db handle, the inter-plugin router, and the audit sink.
 */
export function makeDeps(): HostDeps {
  return {
    data: {
      query: vi.fn(() => [{ n: 1 }]),
      exec: vi.fn(() => ({ changes: 1 })),
      migrate: vi.fn(() => ({ applied: true })),
      tx: vi.fn(() => ({ ok: true })),
      close: vi.fn(),
    } as unknown as HostDeps['data'],
    callPlugin: vi.fn(async (targetId: string, fn: string) => ({ calledTarget: targetId, calledFn: fn })),
    emitPluginEvent: vi.fn(),
  };
}

/**
 * Every @PluginController() class that owns wire methods, in the order the container
 * would discover them. The coverage ledger test (tests/unit/plugins/rpc-coverage.test.ts)
 * is what turns a forgotten entry into a red build instead of a silent
 * PERMISSION_DENIED in production.
 *
 * The services handed in are stubs: the ledger only binds the handlers, it never runs
 * them. Behaviour is asserted in each domain's own <domain>.rpc.test.ts.
 */
export function allRpcControllers(): object[] {
  const anyService = () =>
    new Proxy({}, { get: () => vi.fn(() => undefined) }) as unknown as never;
  return [
    new TagsRpc(anyService()),
    new CategoriesRpc(anyService()),
    new WeatherRpc(anyService()),
    new ExchangeRatesRpc(anyService()),
    new TodoRpc(anyService(), anyService(), anyService()),
    new DayNotesRpc(anyService(), anyService(), anyService()),
    new PackingRpc(anyService(), anyService(), anyService()),
    new FilesRpc(anyService(), anyService(), anyService(), anyService()),
    new PlacesRpc(anyService(), anyService(), anyService(), anyService()),
    new DaysRpc(anyService(), anyService(), anyService()),
    new ItineraryRpc(anyService(), anyService(), anyService()),
    new TripsRpc(anyService(), anyService(), anyService(), anyService(), anyService(), anyService(), anyService(), anyService(), anyService()),
    new CostsRpc(anyService(), anyService(), anyService(), anyService()),
    new ReservationsRpc(anyService(), anyService(), anyService()),
    new AccommodationsRpc(anyService(), anyService(), anyService()),
    new CollabRpc(anyService(), anyService(), anyService()),
    new AtlasRpc(anyService(), anyService()),
    new VacayRpc(anyService(), anyService()),
    new JournalRpc(anyService(), anyService()),
    new CollectionsRpc(anyService(), anyService()),
    new DbRpc(anyService()),
    new MetaRpc(anyService(), anyService()),
    new HostSurfaceRpc(anyService(), anyService(), anyService(), anyService(), anyService(), anyService()),
    // Owns no wire method, but declares all 18 hook contracts, which requireTotalCoverage checks too.
    new PluginHooks(anyService()),
  ];
}
