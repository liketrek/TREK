import { getAppUrl } from '../../app-config';
import { readCappedJson } from '../../utils/cappedFetch';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { logWarn } from '../audit/audit-log.logger';
import { buildUserAgent, parseOverpassEndpoints } from '../maps/overpass.constants';
import { Injectable } from '@nestjs/common';

import { z } from 'zod';

/**
 * One Overpass query raced across the mirrors the operator configured, for the
 * domains that read OpenStreetMap elements themselves: the via ferratas around
 * a trip, the trail grades along a bike tour (BIK-05).
 *
 * It reads the same settings the maps domain's Overpass client reads
 * (OVERPASS_URL, a comma-separated list that replaces the public mirrors, and
 * OVERPASS_TIMEOUT_MS), and takes the mirror list and the User-Agent from the
 * maps domain's public overpass.constants, so a firewalled install that points
 * TREK at its own Overpass is never asked to reach a public one from here
 * either. The query code itself is not shared: maps keeps its fetch private.
 */

// A box of half a degree in the Alps answers in tens of kilobytes; eight
// megabytes means the mirror is misbehaving, not that the mountains got bigger.
const MAX_ANSWER_BYTES = 8 * 1024 * 1024;

/** An Overpass answer: its elements, and a remark when Overpass gave up on the query. */
export const overpassAnswerSchema = z.object({
  elements: z.array(z.unknown()).max(50000),
  remark: z.string().optional(),
});

/** Why every mirror failed, one reason per mirror, for the log line. */
function reasons(err: unknown): string {
  const all = err instanceof AggregateError ? err.errors : [err];
  return all.map((e) => (e instanceof Error ? e.message : String(e))).join(' | ');
}

@Injectable()
export class OverpassElementsClient {
  constructor(private readonly env: RuntimeEnvService) {}

  /**
   * The raw elements of the first mirror that answers with a well-formed OSM
   * document. A `remark` (Overpass' own timeout or runtime error, sent with a
   * 200) counts as a failure, so a fast but empty answer cannot win the race.
   * Throws once every mirror failed; the caller decides what the client sees.
   * `caller` names the domain in the log line.
   */
  async query(query: string, caller: string): Promise<unknown[]> {
    const { overpassUrl, overpassTimeoutMs } = this.env.env().integrations;
    const endpoints = parseOverpassEndpoints(overpassUrl);
    const body = `data=${encodeURIComponent(query)}`;
    const headers = { 'User-Agent': buildUserAgent(getAppUrl()), 'Content-Type': 'application/x-www-form-urlencoded' };
    const race = new AbortController();

    const attempt = async (url: string): Promise<unknown[]> => {
      const signal = AbortSignal.any([race.signal, AbortSignal.timeout(overpassTimeoutMs)]);
      const res = await fetch(url, { method: 'POST', headers, body, signal });
      if (!res.ok) {
        await res.body?.cancel().catch(() => {});
        throw new Error(`Overpass ${res.status} @ ${url}`);
      }
      const answer = overpassAnswerSchema.safeParse(await readCappedJson<unknown>(res, MAX_ANSWER_BYTES));
      if (!answer.success) throw new Error(`Overpass non-OSM or oversized body @ ${url}`);
      if (answer.data.remark) throw new Error(`Overpass remark @ ${url}: ${answer.data.remark}`);
      return answer.data.elements;
    };

    try {
      return await Promise.any(endpoints.map(attempt));
    } catch (err) {
      logWarn(`[${caller}] all ${endpoints.length} Overpass endpoint(s) failed: ${reasons(err)}`);
      throw new Error('Could not reach any Overpass endpoint', { cause: err });
    } finally {
      // The losers are cancelled once one mirror answered (or all gave up).
      race.abort();
    }
  }
}
