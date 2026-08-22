import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { z } from 'zod';
import { findByIata, searchAirports } from './airports.data';

/**
 * Airport lookup MCP tools, moved 1:1 from the legacy registrar in
 * src/mcp/tools/mapsWeather.ts. Same names, descriptions, input schemas and
 * result shapes; the registration-time `canRead(scopes, 'geo')` gate became the
 * declarative `access` marker, matching maps.mcp.ts.
 *
 * No injected service: the airport table is a static dataset loaded once by
 * airports.data.ts. AirportsService owns the flight-endpoint backfill against
 * the database, which these two tools never touch.
 */
@McpController()
export class AirportsMcp {
  @Tool({
    name: 'search_airports',
    description: 'Search for airports by name, city, or IATA code. Returns matching airports with IATA code, name, city, country, coordinates, and timezone. Use before create_transport (flight) to get the correct IATA code and timezone for endpoints.',
    inputSchema: {
      query: z.string().min(1).max(200).describe('Airport name, city, or IATA code (e.g. "zurich", "ZRH", "charles de gaulle")'),
      limit: z.number().int().min(1).max(50).optional().default(10),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  searchAirports({ query, limit }: { query: string; limit?: number }, _ctx: McpContext) {
    const airports = searchAirports(query, limit ?? 10);
    return ok({ airports });
  }

  @Tool({
    name: 'get_airport',
    description: 'Get a single airport by its IATA code. Returns name, city, country, coordinates, and timezone.',
    inputSchema: {
      iata: z.string().length(3).toUpperCase().describe('IATA airport code (e.g. "ZRH", "AMS", "CDG")'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'geo', mode: 'read' },
  })
  getAirport({ iata }: { iata: string }, _ctx: McpContext) {
    const airport = findByIata(iata);
    if (!airport) return { content: [{ type: 'text' as const, text: 'Airport not found.' }], isError: true };
    return ok({ airport });
  }
}
