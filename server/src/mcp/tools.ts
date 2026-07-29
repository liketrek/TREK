import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { registerJourneyTools } from './tools/journey';
import { registerMapsWeatherTools } from './tools/mapsWeather';
import { registerNotificationTools } from './tools/notifications';
import { registerAtlasTools } from './tools/atlas';
import { registerPlaceTools } from './tools/places';
import { registerCollectionTools } from './tools/collections';
import { registerTransportTools } from './tools/transports';
import { registerMcpPrompts } from './tools/prompts';
import { registerPluginTools } from './plugin-tools';
import { getMcpRegistry } from './registry-handoff';

export function registerTools(server: McpServer, userId: number, scopes: string[] | null, isStaticToken = false, getDeprecationNotice: () => string | null = () => null): void {
  // The trip tools moved to the DI-discovered src/nest/trips/trips.mcp.ts and
  // the share-link tools to src/nest/share/share.mcp.ts (@McpController,
  // attached via the nest-mcp registry below — getDeprecationNotice rides the
  // attach ctx).

  registerPlaceTools(server, userId, scopes);

  registerCollectionTools(server, userId, scopes);

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

  registerMapsWeatherTools(server, userId, scopes);

  registerNotificationTools(server, userId, scopes);

  registerAtlasTools(server, userId, scopes);

  // The collab tools moved to the DI-discovered src/nest/collab/collab.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  registerTransportTools(server, userId, scopes);

  // The transit tools moved to the DI-discovered src/nest/transit/transit.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  registerJourneyTools(server, userId, scopes);

  // The vacay tools moved to the DI-discovered src/nest/vacay/vacay.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  // The todo tools moved to the DI-discovered src/nest/todo/todo.mcp.ts
  // (@McpController, attached via the nest-mcp registry below).

  registerMcpPrompts(server, userId, isStaticToken);

  // Tools contributed by active plugins (namespaced plugin_<id>_<tool>, gated on the
  // plugins:use scope). Registered after the built-ins so a plugin can never shadow
  // one — a colliding name is skipped rather than allowed to win.
  registerPluginTools(server, userId, scopes);

  // Decorator-registered domains (@trek/nest-mcp) — migrating off the legacy
  // registrar fan-out above, one domain at a time. Unset registry (direct
  // callers without a Nest app, e.g. unit tests) ⇒ skip; the test harness
  // attaches its own via createTestRegistry + setMcpRegistry.
  const registry = getMcpRegistry();
  if (registry) registry.attach(server, { userId, scopes, isStaticToken, getDeprecationNotice });
}
