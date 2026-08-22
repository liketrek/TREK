import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { z } from 'zod';
import { WeatherService } from './weather.service';

/**
 * Weather MCP tools, moved 1:1 from the legacy registrar in
 * src/mcp/tools/mapsWeather.ts. Same names, descriptions, input schemas and
 * result shapes; the registration-time `canRead(scopes, 'weather')` gate became
 * the declarative `access` marker ('weather' is read-only — there is no
 * weather:write).
 *
 * The catch that answers with the upstream message and `isError: true` rather
 * than throwing is carried over verbatim: the client sees "Weather service not
 * available." instead of a transport-level failure when the provider is down.
 */
@McpController()
export class WeatherMcp {
  constructor(private readonly weather: WeatherService) {}

  @Tool({
    name: 'get_weather',
    description: 'Get weather forecast for a location and date.',
    inputSchema: {
      lat: z.number(),
      lng: z.number(),
      date: z.string().describe('ISO date YYYY-MM-DD'),
      lang: z.string().optional().default('en'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'weather', mode: 'read' },
  })
  async getWeather({ lat, lng, date, lang }: { lat: number; lng: number; date: string; lang?: string }, _ctx: McpContext) {
    try {
      const weather = await this.weather.get(String(lat), String(lng), date, lang ?? 'en');
      return ok({ weather });
    } catch (err) {
      return { content: [{ type: 'text' as const, text: (err as Error)?.message ?? 'Weather service not available.' }], isError: true };
    }
  }

  @Tool({
    name: 'get_detailed_weather',
    description: 'Get hourly/detailed weather forecast for a location and date.',
    inputSchema: {
      lat: z.number(),
      lng: z.number(),
      date: z.string().describe('ISO date YYYY-MM-DD'),
      lang: z.string().optional().default('en'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'weather', mode: 'read' },
  })
  async getDetailedWeather({ lat, lng, date, lang }: { lat: number; lng: number; date: string; lang?: string }, _ctx: McpContext) {
    try {
      const weather = await this.weather.getDetailed(String(lat), String(lng), date, lang ?? 'en');
      return ok({ weather });
    } catch (err) {
      return { content: [{ type: 'text' as const, text: (err as Error)?.message ?? 'Weather service not available.' }], isError: true };
    }
  }
}
