/**
 * The REST route and the MCP tool of PAD-11 over a stub service: the route's
 * guards, status and contract, the tool's gate, scope and input, and that
 * both hand the same request to the same service. The answers through the
 * real guards are pinned in the e2e suite.
 */
import { ADDON_IDS } from '../../../../src/addons';
import type { McpContext, McpTextResult, ToolOptions } from '../../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../../src/nest-mcp/metadata';
import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import type { AddonsService } from '../../../../src/nest/addons/addons.service';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { RESPONSE_CONTRACT_KEY } from '../../../../src/nest/common/response-contract';
import { PaddleRoutingController } from '../../../../src/nest/paddle-routing/paddle-routing.controller';
import { PaddleRoutingMcp } from '../../../../src/nest/paddle-routing/paddle-routing.mcp';
import type { PaddleRoutingService } from '../../../../src/nest/paddle-routing/paddle-routing.service';
import { TripAccessGuard } from '../../../../src/nest/permissions/trip-access.guard';
import type { TripAccessService } from '../../../../src/nest/trip-membership/trip-access.service';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { paddleRouteRequestSchema, paddleRouteResponseSchema, type PaddleRouteResponse } from '@trek/shared';

import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const A = { lat: 49.1283, lng: 12.1303 };
const B = { lat: 49.022, lng: 12.111 };

const ANSWER: PaddleRouteResponse = {
  graph_rev: 'r1',
  legs: [
    {
      status: 'ok',
      geometry: [
        [A.lat, A.lng],
        [49.07, 12.12],
        [B.lat, B.lng],
      ],
      segments: [
        { kind: 'water', from: 0, to: 1, name: 'Regen', source: null, osm_ref: null, grade: null },
        { kind: 'portage', from: 1, to: 2, name: 'Wehr', source: 'tagged', osm_ref: 'way/1', grade: null },
      ],
      distance_m: 15600,
      snapped_m: { from: 12, to: 0 },
    },
    { status: 'failed', code: 'no_region', at: B },
  ],
};

function service() {
  return { route: vi.fn<PaddleRoutingService['route']>().mockResolvedValue(ANSWER) };
}

describe('PaddleRoutingController', () => {
  it('PADROUTE-CTL-001: POST api/trips/:tripId/paddle/route sits behind Tours, the session and the trip, answers 200 on the contract', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PaddleRoutingController)).toBe('api/trips/:tripId/paddle');
    expect(Reflect.getMetadata(GUARDS_METADATA, PaddleRoutingController)).toEqual([
      AddonGuard,
      JwtAuthGuard,
      TripAccessGuard,
    ]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, PaddleRoutingController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const handler = PaddleRoutingController.prototype.route;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.POST);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('route');
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(200);
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, handler)).toBe(paddleRouteResponseSchema);
  });

  it('PADROUTE-CTL-002: hands the parsed request to the service and answers what it planned', async () => {
    const routing = service();
    const controller = new PaddleRoutingController(routing as unknown as PaddleRoutingService);
    const body = paddleRouteRequestSchema.parse({ legs: [{ from: A, to: B }], boat: 'sup' });
    await expect(controller.route(body)).resolves.toBe(ANSWER);
    expect(routing.route).toHaveBeenCalledWith(body);
  });
});

const ctx = { userId: 7, scopes: null, isStaticToken: false } as McpContext;

function toolOptions(): ToolOptions {
  const entry = getEntry(PaddleRoutingMcp as unknown as ClassRef, 'planPaddleRoute');
  if (!entry || entry.kind !== 'tool') throw new Error('plan_paddle_route is not registered');
  return entry.options;
}

function makeMcp(accessible: boolean) {
  const routing = service();
  const access = { findAccessible: vi.fn().mockResolvedValue(accessible ? { id: 3 } : null) };
  const mcp = new PaddleRoutingMcp(
    routing as unknown as PaddleRoutingService,
    access as unknown as TripAccessService,
    {} as AddonsService,
  );
  return { mcp, routing, access };
}

describe('PaddleRoutingMcp', () => {
  it('PADROUTE-MCP-001: plan_paddle_route is read only, gated on Tours and scoped to reading trips', () => {
    const options = toolOptions();
    expect(options.name).toBe('plan_paddle_route');
    expect(options.annotations?.readOnlyHint).toBe(true);
    expect(options.access).toEqual({ group: 'trips', mode: 'read' });
    const isAddonEnabled = vi.fn((id: string) => id === ADDON_IDS.TOURS);
    const self = { addons: { isAddonEnabled } } as unknown as PaddleRoutingMcp;
    expect(options.when?.(ctx, self)).toBe(true);
    expect(isAddonEnabled).toHaveBeenCalledWith(ADDON_IDS.TOURS);
  });

  it('PADROUTE-MCP-002: takes the REST contract plus the trip, with the same defaults and limits', () => {
    const input = z.object(toolOptions().inputSchema as z.ZodRawShape);
    expect(input.safeParse({ tripId: 3, legs: [{ from: A, to: B }] }).success).toBe(true);
    expect(input.safeParse({ tripId: 3, legs: [] }).success).toBe(false);
    expect(input.safeParse({ tripId: 3, legs: [{ from: A, to: B }], lake_style: 'zigzag' }).success).toBe(false);
    expect(input.safeParse({ legs: [{ from: A, to: B }] }).success).toBe(false);
    expect(input.safeParse({ tripId: 3, legs: [{ from: A, to: B }], include_geometry: true }).success).toBe(true);
    expect(input.safeParse({ tripId: 3, legs: [{ from: A, to: B }], include_geometry: 'yes' }).success).toBe(false);
  });

  it('PADROUTE-MCP-003: plans for a trip the caller sees, the same request as REST, and answers each leg without its points', async () => {
    const { mcp, routing, access } = makeMcp(true);
    const result = (await mcp.planPaddleRoute({ tripId: 3, legs: [{ from: A, to: B }] }, ctx)) as McpTextResult;
    expect(access.findAccessible).toHaveBeenCalledWith(3, 7);
    expect(routing.route).toHaveBeenCalledWith(paddleRouteRequestSchema.parse({ legs: [{ from: A, to: B }] }));
    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({
      graph_rev: 'r1',
      legs: [
        {
          status: 'ok',
          distance_m: 15600,
          snapped_m: { from: 12, to: 0 },
          points: 3,
          segments: [
            { kind: 'water', name: 'Regen', source: null, osm_ref: null, from_m: 0, to_m: 6526 },
            { kind: 'portage', name: 'Wehr', source: 'tagged', osm_ref: 'way/1', from_m: 6526, to_m: 11903 },
          ],
        },
        { status: 'failed', code: 'no_region', at: B },
      ],
    });
  });

  it('PADROUTE-MCP-004: a trip the caller cannot see is refused before anything is planned', async () => {
    const { mcp, routing } = makeMcp(false);
    const result = (await mcp.planPaddleRoute({ tripId: 9, legs: [{ from: A, to: B }] }, ctx)) as McpTextResult;
    expect(result.isError).toBe(true);
    expect(routing.route).not.toHaveBeenCalled();
  });

  it("PADROUTE-MCP-005: adds each planned leg's line for drawing only when asked, all legs within 300 points by length", async () => {
    const { mcp, routing } = makeMcp(true);
    const long = (from: number, count: number): Array<[number, number]> =>
      Array.from({ length: count }, (_, index) => [49 + (from + index) * 0.0001, 12]);
    const leg = (geometry: Array<[number, number]>, distance: number) => ({
      status: 'ok' as const,
      geometry,
      segments: [
        {
          kind: 'water' as const,
          from: 0,
          to: geometry.length - 1,
          name: null,
          source: null,
          osm_ref: null,
          grade: null,
        },
      ],
      distance_m: distance,
      snapped_m: { from: 0, to: 0 },
    });
    routing.route.mockResolvedValueOnce({
      graph_rev: 'r2',
      legs: [
        leg(long(0, 1000), 11_100),
        { status: 'failed', code: 'no_water_path', at: A },
        leg(long(1000, 500), 5_550),
        leg(long(1500, 2), 11),
      ],
    });
    const legs = [
      { from: A, to: B },
      { from: B, to: A },
      { from: A, to: B },
      { from: B, to: A },
    ];
    const result = (await mcp.planPaddleRoute({ tripId: 3, legs, include_geometry: true }, ctx)) as McpTextResult;
    // The flag is the tool's own: the router gets the REST request.
    expect(routing.route).toHaveBeenCalledWith(paddleRouteRequestSchema.parse({ legs }));
    const answer = JSON.parse(result.content[0].text) as { legs: Array<{ line_geometry?: Array<[number, number]> }> };
    const drawn = answer.legs.map((planned) => planned.line_geometry?.length ?? null);
    expect(drawn).toEqual([198, null, 100, 2]);
    expect(drawn.reduce<number>((sum, count) => sum + (count ?? 0), 0)).toBeLessThanOrEqual(300);
    expect(answer.legs[0].line_geometry?.[0]).toEqual([49, 12]);
    expect(answer.legs[0].line_geometry?.at(-1)).toEqual(long(0, 1000)[999]);

    const plain = (await mcp.planPaddleRoute({ tripId: 3, legs: [{ from: A, to: B }] }, ctx)) as McpTextResult;
    expect(JSON.parse(plain.content[0].text).legs[0]).not.toHaveProperty('line_geometry');
  });
});
