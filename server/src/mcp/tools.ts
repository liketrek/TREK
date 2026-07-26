import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { registerTodoTools } from './tools/todos';
import { registerAssignmentTools } from './tools/assignments';
import { registerJourneyTools } from './tools/journey';
import { registerReservationTools } from './tools/reservations';
import { registerMapsWeatherTools } from './tools/mapsWeather';
import { registerNotificationTools } from './tools/notifications';
import { registerAtlasTools } from './tools/atlas';
import { registerPlaceTools } from './tools/places';
import { registerCollectionTools } from './tools/collections';
import { registerDayTools } from './tools/days';
import { registerBudgetTools } from './tools/budget';
import { registerPackingTools } from './tools/packing';
import { registerCollabTools } from './tools/collab';
import { registerTripTools } from './tools/trips';
import { registerTransportTools } from './tools/transports';
import { registerTransitTools } from './tools/transit';
import { registerVacayTools } from './tools/vacay';
import { registerMcpPrompts } from './tools/prompts';
import { getMcpRegistry } from './registry-handoff';

export function registerTools(server: McpServer, userId: number, scopes: string[] | null, isStaticToken = false, getDeprecationNotice: () => string | null = () => null): void {
  registerTripTools(server, userId, scopes, getDeprecationNotice);

  registerPlaceTools(server, userId, scopes);

  registerCollectionTools(server, userId, scopes);

  registerBudgetTools(server, userId, scopes);

  registerPackingTools(server, userId, scopes);

  registerReservationTools(server, userId, scopes);

  registerDayTools(server, userId, scopes);

  registerAssignmentTools(server, userId, scopes);

  registerMapsWeatherTools(server, userId, scopes);

  registerNotificationTools(server, userId, scopes);

  registerAtlasTools(server, userId, scopes);

  registerCollabTools(server, userId, scopes);

  registerTransportTools(server, userId, scopes);

  registerTransitTools(server, userId, scopes);

  registerJourneyTools(server, userId, scopes);

  registerVacayTools(server, userId, scopes);

  registerTodoTools(server, userId, scopes);

  registerMcpPrompts(server, userId, isStaticToken);

  // Decorator-registered domains (@trek/nest-mcp) — migrating off the legacy
  // registrar fan-out above, one domain at a time. Unset registry (direct
  // callers without a Nest app, e.g. unit tests) ⇒ skip; the test harness
  // attaches its own via createTestRegistry + setMcpRegistry.
  const registry = getMcpRegistry();
  if (registry) registry.attach(server, { userId, scopes, isStaticToken });
}
