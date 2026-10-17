/**
 * The two controllers of PAD-05A over stub services: their routes, guards,
 * status codes and response contracts, and how each hands its input on. The
 * HTTP answers with the real guards are pinned in the e2e suite.
 */
import { AddonGuard } from '../../../../src/nest/addons/addon.guard';
import { REQUIRE_ADDON } from '../../../../src/nest/addons/require-addon.decorator';
import type { AuditService } from '../../../../src/nest/audit/audit.service';
import { AdminGuard } from '../../../../src/nest/auth-core/admin.guard';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { RESPONSE_CONTRACT_KEY } from '../../../../src/nest/common/response-contract';
import {
  PaddleObstaclesController,
  PaddleRegionsController,
} from '../../../../src/nest/paddle-obstacles/paddle-obstacles.controller';
import type { PaddleObstaclesService } from '../../../../src/nest/paddle-obstacles/paddle-obstacles.service';
import type { PaddleRegionsService } from '../../../../src/nest/paddle-obstacles/paddle-regions.service';
import type { User } from '../../../../src/types';
import { RequestMethod } from '@nestjs/common';
import { GUARDS_METADATA, HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import {
  paddleObstaclesResponseSchema,
  paddleRegionCatalogResponseSchema,
  paddleRegionListResponseSchema,
  paddleRegionSchema,
  successResponseSchema,
  type PaddleRegion,
} from '@trek/shared';

import type { Request } from 'express';
import { describe, expect, it, vi } from 'vitest';

const region: PaddleRegion = {
  id: 'oberpfalz',
  name: 'Oberpfalz',
  status: 'queued',
  source_timestamp: null,
  imported_at: null,
  feature_count: 0,
  error: null,
  progress: null,
};

describe('PaddleObstaclesController', () => {
  it('PADCTL-001: GET api/paddle/obstacles sits behind the Tours addon ahead of the session check', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PaddleObstaclesController)).toBe('api/paddle');
    expect(Reflect.getMetadata(GUARDS_METADATA, PaddleObstaclesController)).toEqual([AddonGuard, JwtAuthGuard]);
    expect(Reflect.getMetadata(REQUIRE_ADDON, PaddleObstaclesController)).toEqual({ addonId: 'tours', label: 'Tours' });
    const handler = PaddleObstaclesController.prototype.inBox;
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(RequestMethod.GET);
    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe('obstacles');
    expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, handler)).toBe(paddleObstaclesResponseSchema);
  });

  it('PADCTL-002: hands the box on and passes a refusal through as it is', async () => {
    const answer = { features: [], coverage: { state: 'none' as const, regions: [] }, truncated: false };
    const inBox = vi.fn<PaddleObstaclesService['inBox']>().mockResolvedValue(answer);
    const controller = new PaddleObstaclesController({ inBox } as unknown as PaddleObstaclesService);

    expect(await controller.inBox({ bbox: '49,12,49.1,12.1' })).toBe(answer);
    expect(inBox).toHaveBeenCalledWith('49,12,49.1,12.1');

    const refusal = new DomainError(400, 'bbox must be south,west,north,east and at most one degree a side');
    inBox.mockRejectedValueOnce(refusal);
    await expect(controller.inBox({ bbox: '0,0,5,5' })).rejects.toBe(refusal);
  });
});

describe('PaddleRegionsController', () => {
  it('PADCTL-003: admin only, with the routes, status codes and contracts of the admin surface', () => {
    expect(Reflect.getMetadata(PATH_METADATA, PaddleRegionsController)).toBe('api/admin/paddle-regions');
    expect(Reflect.getMetadata(GUARDS_METADATA, PaddleRegionsController)).toEqual([JwtAuthGuard, AdminGuard]);
    const p = PaddleRegionsController.prototype;
    const routes = [
      [p.list, RequestMethod.GET, '/', undefined, paddleRegionListResponseSchema],
      [p.catalog, RequestMethod.GET, 'catalog', undefined, paddleRegionCatalogResponseSchema],
      [p.add, RequestMethod.POST, '/', undefined, paddleRegionSchema],
      [p.refresh, RequestMethod.POST, 'refresh', 200, paddleRegionSchema],
      [p.remove, RequestMethod.POST, 'remove', 200, successResponseSchema],
    ] as const;
    for (const [handler, method, path, code, schema] of routes) {
      expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(method);
      expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(path);
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(code);
      expect(Reflect.getMetadata(RESPONSE_CONTRACT_KEY, handler)).toBe(schema);
    }
  });

  it('PADCTL-004: wraps the lists in { regions }, hands the ids on, records each change and answers { success: true } on remove', async () => {
    const service = {
      list: vi.fn().mockResolvedValue([region]),
      catalog: vi.fn().mockResolvedValue([{ id: 'oberpfalz', name: 'Oberpfalz', path: ['Europe'] }]),
      add: vi.fn().mockResolvedValue(region),
      refresh: vi.fn().mockResolvedValue(region),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const audit = { writeAudit: vi.fn().mockResolvedValue(undefined) };
    const controller = new PaddleRegionsController(
      service as unknown as PaddleRegionsService,
      audit as unknown as AuditService,
    );
    const admin = { id: 2 } as User;
    const req = { ip: '203.0.113.5', headers: {}, socket: { remoteAddress: '203.0.113.5' } } as unknown as Request;

    expect(await controller.list()).toEqual({ regions: [region] });
    expect(await controller.catalog({ q: 'ober' })).toEqual({
      regions: [{ id: 'oberpfalz', name: 'Oberpfalz', path: ['Europe'] }],
    });
    expect(service.catalog).toHaveBeenCalledWith('ober');
    expect(await controller.add(admin, { id: 'oberpfalz' }, req)).toBe(region);
    expect(service.add).toHaveBeenCalledWith('oberpfalz');
    expect(await controller.refresh(admin, { id: 'oberpfalz' }, req)).toBe(region);
    expect(service.refresh).toHaveBeenCalledWith('oberpfalz');
    expect(await controller.remove(admin, { id: 'oberpfalz' }, req)).toEqual({ success: true });
    expect(service.remove).toHaveBeenCalledWith('oberpfalz');
    expect(audit.writeAudit.mock.calls.map(([entry]) => entry)).toEqual(
      ['admin.paddle_region_add', 'admin.paddle_region_refresh', 'admin.paddle_region_remove'].map((action) => ({
        userId: 2,
        action,
        ip: expect.any(String),
        details: { region: 'oberpfalz' },
      })),
    );
  });

  it('PADCTL-005: a refused change leaves no audit row', async () => {
    const refusal = new DomainError(404, 'Region not found');
    const service = { remove: vi.fn().mockRejectedValue(refusal) };
    const audit = { writeAudit: vi.fn() };
    const controller = new PaddleRegionsController(
      service as unknown as PaddleRegionsService,
      audit as unknown as AuditService,
    );
    await expect(controller.remove({ id: 2 } as User, { id: 'bayern' }, {} as Request)).rejects.toBe(refusal);
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });
});
