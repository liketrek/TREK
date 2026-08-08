import fs from 'node:fs';
import path from 'node:path';

/**
 * The bundled airport dataset — a JSON file read once and kept in memory.
 *
 * Free functions rather than a provider: nothing here touches the database, and
 * the two MCP registrars (mcp/tools/mapsWeather.ts, mcp/tools/transports.ts)
 * call them from outside the container. AirportsService is the in-container
 * face; the DB-touching backfill lives there.
 */
export interface Airport {
  iata: string;
  icao: string | null;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  tz: string;
}

let cache: Airport[] | null = null;
let byIata: Map<string, Airport> | null = null;

export function load(): Airport[] {
  if (cache) return cache;
  const file = path.join(__dirname, '..', '..', '..', 'assets', 'airports.json');
  if (!fs.existsSync(file)) {
    console.warn('[airports] airports.json missing — run `node scripts/build-airports.mjs`');
    cache = [];
    byIata = new Map();
    return cache;
  }
  const raw = fs.readFileSync(file, 'utf8');
  cache = JSON.parse(raw) as Airport[];
  byIata = new Map(cache.map(a => [a.iata, a]));
  return cache;
}

export function findByIata(code: string): Airport | null {
  load();
  return byIata!.get(code.toUpperCase()) ?? null;
}

export function searchAirports(query: string, limit = 12): Airport[] {
  const all = load();
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const upper = q.toUpperCase();
  if (q.length === 3) {
    const exact = byIata!.get(upper);
    if (exact) return [exact];
  }

  const matches: Array<{ a: Airport; score: number }> = [];
  for (const a of all) {
    let score = 0;
    if (a.iata === upper) score = 100;
    else if (a.icao === upper) score = 90;
    else if (a.iata.startsWith(upper)) score = 70;
    else if (a.city.toLowerCase().startsWith(q)) score = 60;
    else if (a.name.toLowerCase().startsWith(q)) score = 50;
    else if (a.city.toLowerCase().includes(q)) score = 30;
    else if (a.name.toLowerCase().includes(q)) score = 20;
    if (score > 0) matches.push({ a, score });
  }
  matches.sort((x, y) => y.score - x.score || x.a.iata.localeCompare(y.a.iata));
  return matches.slice(0, limit).map(m => m.a);
}
