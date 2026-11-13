/**
 * GET /api/trips/:tripId/flights/live and its MCP twin get_trip_flight_status
 * over a stub service: the route's guards and contract, the tool's scope and
 * input, and parity: both ask the same service method for the same trip
 * after the same access check, and answer the same body.
 */
import type { McpContext, McpTextResult, ToolOptions } from '../../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../../src/nest-mcp/metadata';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../../src/nest/common/response-contract';
import { FlightLiveController } from '../../../../src/nest/flight-live/flight-live.controller';
import { FlightLiveMcp } from '../../../../src/nest/flight-live/flight-live.mcp';
import type { FlightLiveService } from '../../../../src/nest/flight-live/flight-live.service';
import { TripAccessGuard } from '../../../../src/nest/permissions/trip-access.guard';
import type { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { tripFlightLiveResponseSchema, type TripFlightLiveResponse } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const ANSWER: TripFlightLiveResponse = {
  enabled: true,
  attribution: 'Live positions: adsb.lol (ODbL)',
  flights: [
    {
      reservation_id: 10,
      leg_index: 0,
      callsign: 'DLH100',
      flight_number: 'LH 100',
      service_date: '2026-07-01',
      origin: { code: 'FRA', name: 'Frankfurt', lat: 50.03, lng: 8.57, timezone: 'Europe/Berlin' },
      destination: { code: 'BER', name: 'Berlin', lat: 52.36, lng: 13.5, timezone: 'Europe/Berlin' },
      phase: 'scheduled',
      scheduled_departure: '2026-07-01T10:00:00.000Z',
      scheduled_arrival: '2026-07-01T11:10:00.000Z',
      departed_at: null,
      landed_at: null,
      estimated_arrival: null,
      departure_delay_min: null,
      arrival_delay_min: null,
      progress: 0,
      distance_total_km: 431,
      distance_remaining_km: 431,
      position: null,
      aircraft: null,
      last_seen_at: null,
      fetched_at: null,
      stale: false,
      source: null,
    },
  ],
};

function service() {
  return { tripFlights: vi.fn<FlightLiveService['tripFlights']>().mockResolvedValue(ANSWER) };
}

describe('FlightLiveController', () => {
  it('FLCTL-001: GET api/trips/:tripId/flights/live sits behind the session and the trip, on the response contract', () => {
    expect(Reflect.getMetadata(PATH_METADATA, FlightLiveController)).toBe('api/trips/:tripId/flights');
    expect(Reflect.getMetadata(GUARDS_METADATA, FlightLiveController)).toEqual([JwtAuthGuard, TripAccessGuard]);
    const handler = FlightLiveController.prototype.list;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('live');
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, handler)).toBe(tripFlightLiveResponseSchema);
  });

  it('FLCTL-002: asks the service for the trip the guard resolved and answers what it said', async () => {
    const live = service();
    const controller = new FlightLiveController(live as unknown as FlightLiveService);
    await expect(controller.list({ id: 3, user_id: 1, currency: null })).resolves.toBe(ANSWER);
    expect(live.tripFlights).toHaveBeenCalledWith(3);
  });
});

const ctx = { userId: 7, scopes: null, isStaticToken: false } as McpContext;

function toolOptions(): ToolOptions {
  const entry = getEntry(FlightLiveMcp as unknown as ClassRef, 'getTripFlightStatus');
  if (!entry || entry.kind !== 'tool') throw new Error('get_trip_flight_status is not registered');
  return entry.options;
}

function makeMcp(accessible: boolean) {
  const live = service();
  const trip = accessible ? { id: 3, user_id: 1, currency: null } : undefined;
  const access = { findAccessible: vi.fn().mockResolvedValue(trip) };
  const mcp = new FlightLiveMcp(live as unknown as FlightLiveService, access as unknown as TripAccessService);
  return { mcp, live, access };
}

describe('FlightLiveMcp', () => {
  it('FLMCP-001: get_trip_flight_status is read only, in the bookings scope like reading them', () => {
    const options = toolOptions();
    expect(options.name).toBe('get_trip_flight_status');
    expect(options.annotations?.readOnlyHint).toBe(true);
    expect(options.access).toEqual({ group: 'reservations', mode: 'read' });
    const input = z.object(options.inputSchema as z.ZodRawShape);
    expect(input.safeParse({ tripId: 3 }).success).toBe(true);
    expect(input.safeParse({ tripId: 0 }).success).toBe(false);
    expect(input.safeParse({}).success).toBe(false);
  });

  it('FLMCP-002: parity: the same service method for the same trip answers the same body as the route', async () => {
    const { mcp, live, access } = makeMcp(true);
    const result = (await mcp.getTripFlightStatus({ tripId: 3 }, ctx)) as McpTextResult;
    expect(access.findAccessible).toHaveBeenCalledWith(3, 7);
    expect(live.tripFlights).toHaveBeenCalledWith(3);
    expect(result.isError).toBeUndefined();
    const restBody = await new FlightLiveController(live as unknown as FlightLiveService).list({
      id: 3,
      user_id: 1,
      currency: null,
    });
    expect(JSON.parse(result.content[0].text)).toEqual(restBody);
  });

  it('FLMCP-003: a trip the caller cannot see is refused before anything is read', async () => {
    const { mcp, live } = makeMcp(false);
    const result = (await mcp.getTripFlightStatus({ tripId: 9 }, ctx)) as McpTextResult;
    expect(result).toEqual({ content: [{ type: 'text', text: 'Trip not found or access denied.' }], isError: true });
    expect(live.tripFlights).not.toHaveBeenCalled();
  });

  it('FLMCP-004: an answer off the contract is not passed on', async () => {
    const { mcp, live } = makeMcp(true);
    live.tripFlights.mockResolvedValueOnce({ enabled: 'yes' } as unknown as TripFlightLiveResponse);
    await expect(mcp.getTripFlightStatus({ tripId: 3 }, ctx)).rejects.toThrow();
  });
});
