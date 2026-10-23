/**
 * The assistant's booking reads over a real MCP session against the booted
 * container: list_reservations answers the bookings with their readable
 * details and no raw metadata, list_accommodations the stays with their place,
 * and neither answers for a trip the caller cannot see.
 */
import { buildApp } from '../../src/bootstrap';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { makeDayAccommodation } from '../helpers/factories/itinerary';
import { makePlace } from '../helpers/factories/places';
import { makeReservation, makeReservationEndpoint } from '../helpers/factories/reservations';
import { makeDay, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let app: INestApplication;
let orm: MikroORM;

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
}, 60_000);

afterAll(async () => {
  await app?.close();
});

/** One tool call as `userId` over an MCP session of its own, with every scope; the JSON it answered or its error. */
async function callTool(userId: number, name: string, args: Record<string, unknown>) {
  const server = createLocalMcpServer('TREK booking reads e2e');
  const around = (_info: unknown, call: () => unknown): unknown => withRequestContext(orm, call);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(
        server,
        { userId, scopes: null, isStaticToken: false },
        { include: (kind, tool) => kind === 'tool' && tool === name, around },
      ),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'booking-reads-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result = await client.callTool({ name, arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    return result.isError === true ? { error: text } : JSON.parse(text);
  } finally {
    await client.close();
    await server.close();
  }
}

describe('the booking reads an assistant makes over MCP', () => {
  it('RESREAD-E2E-001: answers the bookings with their details and the stays with their place', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Berlin' });
    const day1 = await makeDay(orm, trip.id, { day_number: 1, date: '2026-06-03' });
    const day2 = await makeDay(orm, trip.id, { day_number: 2, date: '2026-06-04' });
    const flight = await makeReservation(orm, trip.id, {
      title: 'Frankfurt to Berlin',
      type: 'flight',
      day: day1.id,
      confirmation_number: 'ABC123',
      metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH 170', airtrail_ids: [1] }),
    });
    await makeReservationEndpoint(orm, flight.id, { role: 'from', sequence: 0, name: 'Frankfurt', code: 'FRA' });
    await makeReservationEndpoint(orm, flight.id, { role: 'to', sequence: 1, name: 'Berlin', code: 'BER' });
    const hotel = await makePlace(orm, trip.id, { name: 'Mercure', lat: 52.53, lng: 13.38 });
    await makeDayAccommodation(orm, trip.id, hotel.id, day1.id, day2.id, { check_in: '15:00', check_out: '11:00' });

    const read = await callTool(user.id, 'list_reservations', { tripId: trip.id, kinds: ['transport'] });
    expect(read.reservations).toHaveLength(1);
    expect(read.reservations[0]).toMatchObject({
      id: flight.id,
      title: 'Frankfurt to Berlin',
      details: { airline: 'Lufthansa', flight_number: 'LH 170' },
      endpoints: [expect.objectContaining({ code: 'FRA' }), expect.objectContaining({ code: 'BER' })],
    });
    expect(read.reservations[0]).not.toHaveProperty('metadata');
    expect(read.reservations[0].details).not.toHaveProperty('airtrail_ids');

    const stays = await callTool(user.id, 'list_accommodations', { tripId: trip.id });
    expect(stays.accommodations).toEqual([
      expect.objectContaining({
        place_id: hotel.id,
        place_name: 'Mercure',
        start_day_id: day1.id,
        end_day_id: day2.id,
        check_in: '15:00',
        check_out: '11:00',
      }),
    ]);
  });

  it('RESREAD-E2E-002: answers neither read for a trip the caller is not on', async () => {
    const { user } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    expect(await callTool(stranger.id, 'list_reservations', { tripId: trip.id })).toHaveProperty('error');
    expect(await callTool(stranger.id, 'list_accommodations', { tripId: trip.id })).toHaveProperty('error');
  });
});
