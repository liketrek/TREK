import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { getMcpRegistry } from './registry-handoff';

export function registerTools(server: McpServer, userId: number, scopes: string[] | null, isStaticToken = false, getDeprecationNotice: () => string | null = () => null): void {
  // The trip tools moved to the DI-discovered src/nest/trips/trips.mcp.ts and
  // the share-link tools to src/nest/share/share.mcp.ts (@McpController,
  // attached via the nest-mcp registry below — getDeprecationNotice rides the
  // attach ctx).

  // The place tools moved to the DI-discovered src/nest/places/places.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The collection tools moved to the DI-discovered src/nest/collections/
  // collections.mcp.ts (@McpController, attached via the nest-mcp registry below).

  // The budget tools moved to the DI-discovered src/nest/budget/budget.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The packing tools moved to the DI-discovered src/nest/packing/packing.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The reservation tools moved to the DI-discovered src/nest/reservations/
  // reservations.mcp.ts (@McpController, attached via the nest-mcp registry below).

  // The day + accommodation tools moved to the DI-discovered src/nest/days/
  // days.mcp.ts (@McpController, attached via the nest-mcp registry below).

  // The assignment tools moved to the DI-discovered src/nest/assignments/
  // assignments.mcp.ts (@McpController, attached via the nest-mcp registry below).

  // The weather tools moved to the DI-discovered src/nest/weather/weather.mcp.ts
  // and the airport tools to src/nest/airports/airports.mcp.ts (@McpController,
  // attached via the nest-mcp registry below).

  // The notification tools moved to the DI-discovered src/nest/notifications/
  // notifications.mcp.ts (@McpController, attached via the nest-mcp registry below).

  // The atlas tools moved to the DI-discovered src/nest/atlas/atlas.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The collab tools moved to the DI-discovered src/nest/collab/collab.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The transport tools moved to the DI-discovered
  // src/nest/reservations/reservations.mcp.ts — a transport is a reservation,
  // same table and same service (@McpController, attached via the nest-mcp
  // registry below).

  // The transit tools moved to the DI-discovered src/nest/transit/transit.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).


  // The vacay tools moved to the DI-discovered src/nest/vacay/vacay.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The todo tools moved to the DI-discovered src/nest/todo/todo.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The prompts moved to the DI-discovered @McpController classes:
  // packing-list to packing.mcp.ts, budget-overview to budget.mcp.ts and the
  // static-token notice to auth.mcp.ts (its `if (isStaticToken)` became a
  // `when` gate — the registry hands `when` the session context).

  // Decorator-registered domains (@trek/nest-mcp) — migrating off the legacy
  // registrar fan-out above, one domain at a time. Unset registry (direct
  // callers without a Nest app, e.g. unit tests) ⇒ skip; the test harness
  // attaches its own via createTestRegistry + setMcpRegistry.
  const registry = getMcpRegistry();
  if (registry) registry.attach(server, { userId, scopes, isStaticToken, getDeprecationNotice });
}
