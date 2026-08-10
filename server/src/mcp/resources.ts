import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp';
import { isAddonEnabled } from '../nest/addons/addons.bridge';
import { ADDON_IDS } from '../addons';
import { canAccessJourney, getJourneyFull, listEntries, listJourneys } from '../nest/journey/journey.bridge';
import { canRead } from './scopes';

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function accessDenied(uri: string) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ error: 'Trip not found or access denied' }),
    }],
  };
}

function scopeDenied(uri: string) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ error: 'Insufficient OAuth scope to access this resource' }),
    }],
  };
}

function jsonContent(uri: string, data: unknown) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
}

export function registerResources(server: McpServer, userId: number, scopes: string[] | null): void {
  // The trips and trip (trek://trips, trek://trips/{tripId}) resources moved
  // to the DI-discovered src/nest/trips/trips.mcp.ts (@Resource /
  // @ResourceTemplate, attached via the nest-mcp registry in registerTools).

  // The trip-days resource moved to the DI-discovered
  // src/nest/days/days.mcp.ts (@ResourceTemplate).

  // The trip-places resource moved to the DI-discovered
  // src/nest/places/places.mcp.ts (@ResourceTemplate).

  // The trip-budget resource moved to the DI-discovered
  // src/nest/budget/budget.mcp.ts (@ResourceTemplate).

  // The trip-packing resource moved to the DI-discovered
  // src/nest/packing/packing.mcp.ts (@ResourceTemplate).

  // The trip-reservations resource moved to the DI-discovered
  // src/nest/reservations/reservations.mcp.ts (@ResourceTemplate).

  // The day-notes resource moved to the DI-discovered
  // src/nest/day-notes/day-notes.mcp.ts (@ResourceTemplate).

  // The trip-accommodations resource moved to the DI-discovered
  // src/nest/days/days.mcp.ts (@ResourceTemplate).

  // The trip-members resource moved to the DI-discovered
  // src/nest/trips/trips.mcp.ts (@ResourceTemplate).

  // The trek://trips/{tripId}/collab-notes, …/collab/polls and …/collab/messages
  // resources moved to the DI-discovered src/nest/collab/collab.mcp.ts
  // (@ResourceTemplate, attached via the nest-mcp registry in registerTools).

  // The trek://trips/{tripId}/todos resource moved to the DI-discovered
  // src/nest/todo/todo.mcp.ts (@ResourceTemplate, attached via the nest-mcp
  // registry in registerTools).

  // The trek://categories resource moved to the DI-discovered
  // src/nest/categories/categories.mcp.ts (@Resource, attached via the
  // nest-mcp registry in registerTools).

  // The bucket-list and visited-countries resources moved to the DI-discovered
  // src/nest/atlas/atlas.mcp.ts (@Resource, attached via the nest-mcp registry
  // in registerTools).

  // The trip-budget-per-person and trip-budget-settlement resources moved to
  // the DI-discovered src/nest/budget/budget.mcp.ts (@ResourceTemplate).

  // The trip-packing-bags resource moved to the DI-discovered
  // src/nest/packing/packing.mcp.ts (@ResourceTemplate).

  // The notifications-in-app resource moved to the DI-discovered
  // src/nest/notifications/notifications.mcp.ts (@Resource, attached via the
  // nest-mcp registry in registerTools).

  // The atlas-stats and atlas-regions resources moved to the DI-discovered
  // src/nest/atlas/atlas.mcp.ts (@Resource, attached via the nest-mcp registry
  // in registerTools).

  // The vacay resources moved to the DI-discovered src/nest/vacay/vacay.mcp.ts
  // (@McpController, attached via the nest-mcp registry in tools.ts).

  // Journey resources (Journey addon)
  if (isAddonEnabled(ADDON_IDS.JOURNEY) && canRead(scopes, 'journey')) {
    server.registerResource(
      'journeys',
      'trek://journeys',
      { description: 'All journeys owned or contributed to by the current user', mimeType: 'application/json' },
      async (uri) => {
        const journeys = listJourneys(userId);
        return jsonContent(uri.href, journeys);
      }
    );

    server.registerResource(
      'journey-detail',
      new ResourceTemplate('trek://journeys/{journeyId}', { list: undefined }),
      { description: 'Single journey with entries, contributors, and trip links', mimeType: 'application/json' },
      async (uri, { journeyId }) => {
        const id = parseId(journeyId);
        if (id === null) return accessDenied(uri.href);
        const journey = getJourneyFull(id, userId);
        if (!journey) return accessDenied(uri.href);
        return jsonContent(uri.href, journey);
      }
    );

    server.registerResource(
      'journey-entries',
      new ResourceTemplate('trek://journeys/{journeyId}/entries', { list: undefined }),
      { description: 'All entries in a journey (date, text, mood, linked trip)', mimeType: 'application/json' },
      async (uri, { journeyId }) => {
        const id = parseId(journeyId);
        if (id === null) return accessDenied(uri.href);
        const j = canAccessJourney(id, userId);
        if (!j) return accessDenied(uri.href);
        const entries = listEntries(id, userId);
        return jsonContent(uri.href, entries);
      }
    );

    server.registerResource(
      'journey-contributors',
      new ResourceTemplate('trek://journeys/{journeyId}/contributors', { list: undefined }),
      { description: 'Contributors (owners and collaborators) of a journey', mimeType: 'application/json' },
      async (uri, { journeyId }) => {
        const id = parseId(journeyId);
        if (id === null) return accessDenied(uri.href);
        const j = getJourneyFull(id, userId);
        if (!j) return accessDenied(uri.href);
        return jsonContent(uri.href, (j as any).contributors ?? []);
      }
    );
  }
}
