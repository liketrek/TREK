import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { findByIata, searchAirports } from '../../nest/airports/airports.data';
import { getWeather, getDetailedWeather } from '../../nest/weather/weather.impl';
import {
  TOOL_ANNOTATIONS_READONLY,
  ok,
} from './_shared';
import { canRead } from '../scopes';

export function registerMapsWeatherTools(server: McpServer, _userId: number, scopes: string[] | null): void {
  const canGeo     = canRead(scopes, 'geo');
  const canWeather = canRead(scopes, 'weather');

  // The geo tools (get_place_details, reverse_geocode, resolve_maps_url) moved to
  // the DI-discovered src/nest/maps/maps.mcp.ts (@McpController, attached via the
  // nest-mcp registry).

  // --- WEATHER ---

  if (canWeather) server.registerTool(
    'get_weather',
    {
      description: 'Get weather forecast for a location and date.',
      inputSchema: {
        lat: z.number(),
        lng: z.number(),
        date: z.string().describe('ISO date YYYY-MM-DD'),
        lang: z.string().optional().default('en'),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ lat, lng, date, lang }) => {
      try {
        const weather = await getWeather(String(lat), String(lng), date, lang ?? 'en');
        return ok({ weather });
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: err?.message ?? 'Weather service not available.' }], isError: true };
      }
    }
  );

  if (canWeather) server.registerTool(
    'get_detailed_weather',
    {
      description: 'Get hourly/detailed weather forecast for a location and date.',
      inputSchema: {
        lat: z.number(),
        lng: z.number(),
        date: z.string().describe('ISO date YYYY-MM-DD'),
        lang: z.string().optional().default('en'),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ lat, lng, date, lang }) => {
      try {
        const weather = await getDetailedWeather(String(lat), String(lng), date, lang ?? 'en');
        return ok({ weather });
      } catch (err: any) {
        return { content: [{ type: 'text' as const, text: err?.message ?? 'Weather service not available.' }], isError: true };
      }
    }
  );

  // --- AIRPORTS ---

  if (canGeo) server.registerTool(
    'search_airports',
    {
      description: 'Search for airports by name, city, or IATA code. Returns matching airports with IATA code, name, city, country, coordinates, and timezone. Use before create_transport (flight) to get the correct IATA code and timezone for endpoints.',
      inputSchema: {
        query: z.string().min(1).max(200).describe('Airport name, city, or IATA code (e.g. "zurich", "ZRH", "charles de gaulle")'),
        limit: z.number().int().min(1).max(50).optional().default(10),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ query, limit }) => {
      const airports = searchAirports(query, limit ?? 10);
      return ok({ airports });
    }
  );

  if (canGeo) server.registerTool(
    'get_airport',
    {
      description: 'Get a single airport by its IATA code. Returns name, city, country, coordinates, and timezone.',
      inputSchema: {
        iata: z.string().length(3).toUpperCase().describe('IATA airport code (e.g. "ZRH", "AMS", "CDG")'),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ iata }) => {
      const airport = findByIata(iata);
      if (!airport) return { content: [{ type: 'text' as const, text: 'Airport not found.' }], isError: true };
      return ok({ airport });
    }
  );
}
