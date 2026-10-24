/**
 * The REST routes and the MCP tool of the piste router over a stub service:
 * the routes' guards, statuses and contracts, the tool's gate, scope and
 * input, and that both hand the same request to the same service. The answers
 * through the real guards are pinned in the e2e suite.
 */
import { ADDON_IDS } from '../../../../src/addons';
import type { McpContext, McpTextResult, ToolOptions } from '../../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../../src/nest-mcp/metadata';
import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../../src/nest/common/response-contract';
import { TripAccessGuard } from '../../../../src/nest/permissions/trip-access.guard';
import { SkiRoutingController } from '../../../../src/nest/ski-routing/ski-routing.controller';
import { SkiRoutingMcp } from '../../../../src/nest/ski-routing/ski-routing.mcp';
import type { SkiRoutingService } from '../../../../src/nest/ski-routing/ski-routing.service';
import type { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import {
  skiAreaNearResponseSchema,
  skiNetworkResponseSchema,
  skiRouteRequestSchema,
  skiRouteResponseSchema,
  type SkiRouteResponse,
} from '@trek/shared';

import type { Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const A = { lat: 45.98, lng: 7.75 };
const B = { lat: 45.97, lng: 7.74 };

const ANSWER: SkiRouteResponse = {
  build: '2026-11-02',
  stale: false,
  area_names: ['Testalp'],
  colour_scheme: 'europe',
  attribution: '© OpenStreetMap contributors, ODbL. Terrain: Mapzen Terrarium',
  legs: [
    {
      status: 'ok',
      geometry: [
        [A.lat, A.lng, 2500],
        [B.lat, B.lng, 1600],
      ],
      segments: [
        {
          kind: 'run',
          from: 0,
          to: 1,
          name: 'Rote Eins',
          ref: '1',
          difficulty: 'intermediate',
          lift_type: null,
          grooming: [],
          seconds: 300,
          wait_seconds: 0,
          length_m: 2500,
          flags: [],
          osm_way: 12,
        },
      ],
      distance_m: 2500,
      climb_m: 0,
      descent_m: 900,
      seconds: { ski: 300, lift: 0, wait: 0, walk: 0 },
      snapped_m: { from: 3, to: 0 },
      area_ids: ['w:1'],
      why: [],
      alternatives: [],
    },
    { status: 'failed', code: 'no_area', at: B, hint: null, detail: null },
  ],
};

function service() {
  return {
    route: vi.fn<SkiRoutingService['route']>().mockResolvedValue(ANSWER),
    areaNear: vi.fn<SkiRoutingService['areaNear']>().mockResolvedValue({ area: null }),
    network: vi.fn<SkiRoutingService['network']>().mockResolvedValue({
      area_id: 'w:1',
      build: '2026-11-02',
      colour_scheme: 'europe',
      simplified_m: 5,
      features: [],
      sha256: 'a'.repeat(64),
    }),
  };
}

describe('SkiRoutingController', () => {
  it('SKICTL-001: the routes sit behind Tours, the session and the trip, each on its contract', () => {
    expect(Reflect.getMetadata(PATH_METADATA, SkiRoutingController)).toBe('api/trips/:tripId/ski');
    expect(Reflect.getMetadata(GUARDS_METADATA, SkiRoutingController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, SkiRoutingController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const { route, areaNear, network } = SkiRoutingController.prototype;
    expect(Reflect.getMetadata(METHOD_METADATA, route)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, route)).toBe('route');
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, route)).toBe(200);
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, route)).toBe(skiRouteResponseSchema);
    expect(Reflect.getMetadata(METHOD_METADATA, areaNear)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, areaNear)).toBe('area-near');
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, areaNear)).toBe(skiAreaNearResponseSchema);
    expect(Reflect.getMetadata(PATH_METADATA, network)).toBe('network/:areaId');
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, network)).toBe(skiNetworkResponseSchema);
  });

  it('SKICTL-002: hands the parsed request to the service and answers what it planned', async () => {
    const routing = service();
    const controller = new SkiRoutingController(routing as unknown as SkiRoutingService);
    const body = skiRouteRequestSchema.parse({ legs: [{ from: A, to: B }], discipline: 'snowboard' });
    await expect(controller.route(body)).resolves.toBe(ANSWER);
    expect(routing.route).toHaveBeenCalledWith(body);
    await expect(controller.areaNear({ lat: 46, lng: 7 })).resolves.toEqual({ area: null });
    expect(routing.areaNear).toHaveBeenCalledWith(46, 7);
  });

  it('SKICTL-003: the lines of an area go out tagged with its checksum, the checksum not in the body', async () => {
    const routing = service();
    const controller = new SkiRoutingController(routing as unknown as SkiRoutingService);
    const setHeader = vi.fn();
    const body = await controller.network('w:1', { setHeader } as unknown as Response);
    expect(body).toEqual({
      area_id: 'w:1',
      build: '2026-11-02',
      colour_scheme: 'europe',
      simplified_m: 5,
      features: [],
    });
    expect(setHeader).toHaveBeenCalledWith('ETag', `"${'a'.repeat(64)}"`);
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'private, max-age=3600');
  });
});

const ctx = { userId: 7, scopes: null, isStaticToken: false } as McpContext;

function toolOptions(): ToolOptions {
  const entry = getEntry(SkiRoutingMcp as unknown as ClassRef, 'planSkiRoute');
  if (!entry || entry.kind !== 'tool') throw new Error('plan_ski_route is not registered');
  return entry.options;
}

function makeMcp(accessible: boolean) {
  const routing = service();
  const access = { findAccessible: vi.fn().mockResolvedValue(accessible ? { id: 3 } : null) };
  const mcp = new SkiRoutingMcp(
    routing as unknown as SkiRoutingService,
    access as unknown as TripAccessService,
    {} as AddonsService,
  );
  return { mcp, routing, access };
}

describe('SkiRoutingMcp', () => {
  it('SKIMCP-001: plan_ski_route is read only, gated on Tours and scoped to reading trips', () => {
    const options = toolOptions();
    expect(options.name).toBe('plan_ski_route');
    expect(options.annotations?.readOnlyHint).toBe(true);
    expect(options.access).toEqual({ group: 'trips', mode: 'read' });
    const isAddonEnabled = vi.fn((id: string) => id === ADDON_IDS.TOURS);
    const self = { addons: { isAddonEnabled } } as unknown as SkiRoutingMcp;
    expect(options.when?.(ctx, self)).toBe(true);
    expect(isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.TOURS);
  });

  it('SKIMCP-002: takes the REST contract plus the trip, with the same defaults and limits', () => {
    const input = z.object(toolOptions().inputSchema as z.ZodRawShape);
    expect(input.safeParse({ tripId: 3, legs: [{ from: A, to: B }], discipline: 'alpine' }).success).toBe(true);
    expect(input.safeParse({ tripId: 3, legs: [], discipline: 'alpine' }).success).toBe(false);
    expect(input.safeParse({ tripId: 3, legs: [{ from: A, to: B }] }).success).toBe(false);
    const three = { tripId: 3, legs: [{ from: A, to: B }], discipline: 'alpine', alternatives: 3 };
    expect(input.safeParse(three).success).toBe(false);
    expect(input.safeParse({ legs: [{ from: A, to: B }], discipline: 'alpine' }).success).toBe(false);
    const drawn = { tripId: 3, legs: [{ from: A, to: B }], discipline: 'alpine', include_geometry: true };
    expect(input.safeParse(drawn).success).toBe(true);
    expect(input.safeParse({ ...drawn, include_geometry: 1 }).success).toBe(false);
  });

  it('SKIMCP-003: plans for a trip the caller sees, the same request as REST, legs without their points', async () => {
    const { mcp, routing, access } = makeMcp(true);
    const asked = { tripId: 3, legs: [{ from: A, to: B }], discipline: 'alpine' as const };
    const result = (await mcp.planSkiRoute(asked, ctx)) as McpTextResult;
    expect(access.findAccessible).toHaveBeenCalledWith(3, 7);
    const { tripId: _trip, ...asRest } = asked;
    expect(routing.route).toHaveBeenCalledWith(skiRouteRequestSchema.parse(asRest));
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({
      build: '2026-11-02',
      stale: false,
      area_names: ['Testalp'],
      colour_scheme: 'europe',
      attribution: '© OpenStreetMap contributors, ODbL. Terrain: Mapzen Terrarium',
      legs: [
        {
          status: 'ok',
          distance_m: 2500,
          climb_m: 0,
          descent_m: 900,
          seconds: { ski: 300, lift: 0, wait: 0, walk: 0 },
          snapped_m: { from: 3, to: 0 },
          points: 2,
          segments: [
            {
              kind: 'run',
              name: 'Rote Eins',
              ref: '1',
              difficulty: 'intermediate',
              lift_type: null,
              seconds: 300,
              wait_seconds: 0,
              length_m: 2500,
              flags: [],
              from_m: 0,
              to_m: 1354,
            },
          ],
          why: [],
          alternatives: 0,
        },
        { status: 'failed', code: 'no_area', at: B, hint: null, detail: null },
      ],
    });
  });

  it('SKIMCP-004: a trip the caller cannot see is refused before anything is planned', async () => {
    const { mcp, routing } = makeMcp(false);
    const asked = { tripId: 9, legs: [{ from: A, to: B }], discipline: 'alpine' as const };
    const result = (await mcp.planSkiRoute(asked, ctx)) as McpTextResult;
    expect(result.isError).toBe(true);
    expect(routing.route).not.toHaveBeenCalled();
  });

  it("SKIMCP-005: adds each planned leg's line with its heights only when asked, all legs within 300 points by length", async () => {
    const { mcp, routing } = makeMcp(true);
    const [planned] = ANSWER.legs;
    if (planned.status !== 'ok') throw new Error('the fixture plans its first leg');
    const geometry = Array.from({ length: 800 }, (_, index): [number, number, number | null] => [
      45.98 - index * 0.0001,
      7.75,
      index === 5 ? null : 2500 - index,
    ]);
    routing.route.mockResolvedValueOnce({ ...ANSWER, legs: [{ ...planned, geometry }, ANSWER.legs[1]] });
    const asked = {
      tripId: 3,
      legs: [
        { from: A, to: B },
        { from: B, to: A },
      ],
      discipline: 'alpine' as const,
    };
    const result = (await mcp.planSkiRoute({ ...asked, include_geometry: true }, ctx)) as McpTextResult;
    const { tripId: _trip, ...asRest } = asked;
    expect(routing.route).toHaveBeenCalledWith(skiRouteRequestSchema.parse(asRest));
    const answer = JSON.parse(result.content[0].text) as {
      legs: Array<{ line_geometry?: Array<[number, number, number | null]> }>;
    };
    expect(answer.legs[0].line_geometry).toHaveLength(300);
    expect(answer.legs[0].line_geometry?.[0]).toEqual([45.98, 7.75, 2500]);
    expect(answer.legs[0].line_geometry?.at(-1)).toEqual(geometry[799]);
    expect(answer.legs[1]).not.toHaveProperty('line_geometry');

    const plain = (await mcp.planSkiRoute(asked, ctx)) as McpTextResult;
    expect(JSON.parse(plain.content[0].text).legs[0]).not.toHaveProperty('line_geometry');
  });
});
