import { logWarn } from '../audit/audit-log.logger';
import type { AtlasService } from './atlas.service';
import type { VisitStatus } from '@trek/shared';

/**
 * Where the atlas stands after a write, as the MCP mark tools answer it: the
 * country's own status the way the Atlas map paints it (null once it is off
 * the map) and how many countries count as visited, plus the visited regions
 * of that country for the region tools. Read through `stats()` and
 * `visitedRegions()`, the same reads the Atlas page makes, so the assistant's
 * "that makes 24 countries" and the map agree. REST answers stay as they were.
 */
interface AtlasStanding {
  country_status: VisitStatus | null;
  countries_visited: number;
}

export async function standingOf(
  atlas: Pick<AtlasService, 'stats'>,
  userId: number,
  code: string,
): Promise<AtlasStanding> {
  const stats = await atlas.stats(userId);
  // A user without trips only has the countries marked by hand, which carry no status: they are visited.
  const countries: ReadonlyArray<{ code: string; status?: VisitStatus }> = stats.countries;
  const entry = countries.find((country) => country.code === code);
  return { country_status: entry ? (entry.status ?? 'visited') : null, countries_visited: stats.stats.totalCountries };
}

/** The visited regions of one country, as the map paints them. */
export async function regionsVisitedOf(
  atlas: Pick<AtlasService, 'visitedRegions'>,
  userId: number,
  countryCode: string,
): Promise<number> {
  const { regions } = await atlas.visitedRegions(userId);
  return (regions[countryCode] ?? []).filter((region) => region.status === 'visited').length;
}

/**
 * A read made after a write that already landed and was broadcast: when it
 * fails, the answer leaves `after` out (the card falls back to what it held)
 * instead of turning a done write into a tool error the model would retry.
 */
export async function readAfterWrite<T>(read: () => Promise<T>): Promise<T | undefined> {
  try {
    return await read();
  } catch (err) {
    logWarn(`[atlas] reading the atlas back after a write failed: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}
