/**
 * MCPROWID: every MCP resource whose URI holds a row id answers a spelling of
 * that id toRowId refuses exactly as it answers 'abc', and hands neither to SQL.
 *
 * The resources read their URI variables themselves (`uriRowId` in
 * src/nest/common/row-id.ts). A local Number() read '0x1' and '1e0' as row 1
 * and passed 1e20 to Postgres, which refuses it as out of range for bigint.
 * The suite lists the templates the server registers, so a new resource is
 * walked without anyone adding it here. It boots the app on the real database
 * module, so it runs in the SQLite suite and in the Postgres lane.
 */
import { makeJourney } from '../helpers/factories/journeys';
import { makeTrip, readTripDays } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createMcpHarness, type McpHarness } from '../helpers/mcp-harness';
import { oneByOne } from '../helpers/one-by-one';
import { malformedIdSpellings, ROW_ID_NAME } from '../helpers/row-id-fields';
import { carriedTo, installSqlCapture, recordSql, uninstallSqlCapture } from '../helpers/sql-capture';
import { bootTestApp } from '../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** An id no row has: a resource that reads '0x3ade68b1' with Number() binds it. */
const UNUSED_ID = 987654321;

let orm: MikroORM;
let harness: McpHarness;
const ids: Record<string, number> = {};

beforeAll(async () => {
  installSqlCapture();
  orm = (await bootTestApp()).get(MikroORM);
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { start_date: '2026-03-01', end_date: '2026-03-02' });
  const [day] = await readTripDays(orm, trip.id);
  const journey = await makeJourney(orm, user.id);
  Object.assign(ids, { tripId: trip.id, dayId: day.id, journeyId: journey.id });
  harness = await createMcpHarness({ userId: user.id });
}, 60_000);

afterAll(async () => {
  uninstallSqlCapture();
  await harness?.cleanup();
});

describe('MCPROWID: MCP resource URIs read their ids through toRowId', () => {
  it('MCPROWID-001: a malformed id in any resource URI answers like "abc" and never reaches SQL', async () => {
    const { resourceTemplates } = await harness.client.listResourceTemplates();
    const cases = resourceTemplates.flatMap(({ uriTemplate }) =>
      [...uriTemplate.matchAll(/\{(\w+)\}/g)]
        .map((m) => m[1])
        .filter((name) => ROW_ID_NAME.test(name))
        .map((variable) => ({ uriTemplate, variable })),
    );

    // One read at a time: they share one harness and one seeded world.
    const failures = (
      await oneByOne(cases, async ({ uriTemplate, variable }) => {
        const label = `${uriTemplate} {${variable}}`;
        const uriWith = (value: string) =>
          uriTemplate.replace(/\{(\w+)\}/g, (_m, name: string) =>
            name === variable ? encodeURIComponent(value) : String(ids[name] ?? 2026),
          );
        // The answer quotes the URI it was asked for; compare it as if 'abc' had been asked.
        const read = async (value: string): Promise<string> => {
          let answer: string;
          try {
            answer = JSON.stringify(await harness.client.readResource({ uri: uriWith(value) }));
          } catch (err) {
            answer = `error: ${(err as Error).message}`;
          }
          return answer.split(uriWith(value)).join(uriWith('abc'));
        };
        const found = ids[variable] === undefined ? [`${label}: seed a row for it above`] : [];
        const unknown = await read('abc');
        const results = await oneByOne(['abc', ...malformedIdSpellings(UNUSED_ID)], async (spelling) => {
          let answer = '';
          const sent = await recordSql(async () => {
            answer = await read(spelling);
          });
          return { spelling, answer, sql: carriedTo(sent, spelling, UNUSED_ID) };
        });
        for (const { spelling, answer, sql } of results) {
          if (sql) found.push(`${label}='${spelling}' reached SQL: ${sql.slice(0, 160)}`);
          if (answer !== unknown) found.push(`${label}='${spelling}' answered ${answer.slice(0, 160)}`);
        }
        return found;
      })
    ).flat();

    expect(cases.length, 'no resource template holds an id; the listing broke').toBeGreaterThan(15);
    expect(
      failures,
      'An MCP resource reads a URI id some other way than toRowId. Read it with uriRowId (src/nest/common/row-id.ts) ' +
        'and answer a null the way the resource answers an id that names no row.',
    ).toEqual([]);
  }, 120_000);
});
