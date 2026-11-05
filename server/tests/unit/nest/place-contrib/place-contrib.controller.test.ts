/**
 * /api/admin/places-contribute over a stub service: what each handler hands
 * the service, what it answers, which audit row it writes, the guards and
 * contracts it declares, and that the Zod pipe holds the contracts the
 * handlers rely on.
 */
import type { AuditService } from '../../../../src/nest/audit/audit.service';
import { AdminGuard } from '../../../../src/nest/auth-core/admin.guard';
import { JwtAuthGuard } from '../../../../src/nest/auth-core/jwt-auth.guard';
import { DomainError } from '../../../../src/nest/common/domain-error';
import { RESPONSE_CONTRACT_KEY } from '../../../../src/nest/common/response-contract';
import { PlaceContribController } from '../../../../src/nest/place-contrib/place-contrib.controller';
import {
  PlaceContribDecisionDto,
  PlaceContribLogQueryDto,
  PlaceContribWithdrawDto,
} from '../../../../src/nest/place-contrib/place-contrib.dto';
import type { PlaceContribService } from '../../../../src/nest/place-contrib/place-contrib.service';
import type { User } from '../../../../src/types';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  placeContribDecisionRequestSchema,
  placeContribLogQuerySchema,
  placeContribLogResponseSchema,
  placeContribStateSchema,
  placeContribWithdrawRequestSchema,
  placeContribWithdrawResponseSchema,
} from '@trek/shared';

import type { Request } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATE = { termsVersion: 1, active: false };
const contrib = {
  state: vi.fn(async () => STATE),
  decide: vi.fn(async () => STATE),
  logPage: vi.fn(async () => ({ entries: [], total: 0, page: 2, perPage: 10 })),
  withdrawAll: vi.fn(async () => ({ withdrawn: { website: 1 }, cleared: 4 })),
};
const audit = { writeAudit: vi.fn(async () => undefined) };
const controller = new PlaceContribController(
  contrib as unknown as PlaceContribService,
  audit as unknown as AuditService,
);
const admin = { id: 3, role: 'admin' } as User;
const req = { ip: '203.0.113.9', socket: {} } as unknown as Request;

beforeEach(() => vi.clearAllMocks());

describe('PlaceContribController', () => {
  it('PCCT-001: the class answers to admins only', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, PlaceContribController)).toEqual([JwtAuthGuard, AdminGuard]);
  });

  it('PCCT-002: every handler declares the shared response contract it answers with', () => {
    const contract = (name: keyof PlaceContribController) =>
      Reflect.getMetadata(RESPONSE_CONTRACT_KEY, PlaceContribController.prototype[name]);
    expect(contract('state')).toBe(placeContribStateSchema);
    expect(contract('decide')).toBe(placeContribStateSchema);
    expect(contract('log')).toBe(placeContribLogResponseSchema);
    expect(contract('withdraw')).toBe(placeContribWithdrawResponseSchema);
  });

  it('PCCT-003: the state is the calling admin own', async () => {
    expect(await controller.state(admin)).toBe(STATE);
    expect(contrib.state).toHaveBeenCalledWith(3);
  });

  it('PCCT-004: a decision is handed on whole and audited with what it named', async () => {
    const body = { action: 'agree', termsVersion: 1, fields: { website: true } } as unknown as PlaceContribDecisionDto;
    expect(await controller.decide(admin, body, req)).toBe(STATE);
    expect(contrib.decide).toHaveBeenCalledWith(3, body);
    expect(audit.writeAudit).toHaveBeenCalledWith({
      userId: 3,
      action: 'admin.places_contribute_decision',
      details: { action: 'agree', termsVersion: 1, fields: { website: true } },
      ip: '203.0.113.9',
    });
    await controller.decide(admin, { action: 'off', withdraw: true } as PlaceContribDecisionDto, req);
    expect(audit.writeAudit).toHaveBeenLastCalledWith(
      expect.objectContaining({ details: { action: 'off', withdraw: true } }),
    );
  });

  it('PCCT-005: a refused decision writes no audit row', async () => {
    contrib.decide.mockRejectedValueOnce(new Error('terms'));
    await expect(controller.decide(admin, { action: 'snooze' } as PlaceContribDecisionDto, req)).rejects.toThrow();
    expect(audit.writeAudit).not.toHaveBeenCalled();
  });

  it('PCCT-010: switching off whose withdrawal the service did not confirm is still audited, then fails', async () => {
    const refused = new DomainError(502, 'The TREK Places API did not confirm the withdrawal');
    contrib.decide.mockRejectedValueOnce(refused);
    await expect(
      controller.decide(admin, { action: 'off', withdraw: true } as PlaceContribDecisionDto, req),
    ).rejects.toBe(refused);
    expect(audit.writeAudit).toHaveBeenCalledWith({
      userId: 3,
      action: 'admin.places_contribute_decision',
      details: { action: 'off', withdraw: true, withdrawFailed: true },
      ip: '203.0.113.9',
    });
  });

  it('PCCT-006: the log query goes to the service as parsed', async () => {
    const query = { page: 2, perPage: 10, result: 'withheld' } as PlaceContribLogQueryDto;
    expect(await controller.log(query)).toEqual({ entries: [], total: 0, page: 2, perPage: 10 });
    expect(contrib.logPage).toHaveBeenCalledWith(query);
  });

  it('PCCT-007: withdrawing answers what the service did and is audited', async () => {
    expect(await controller.withdraw(admin, { confirm: true } as PlaceContribWithdrawDto, req)).toEqual({
      withdrawn: { website: 1 },
      cleared: 4,
    });
    expect(audit.writeAudit).toHaveBeenCalledWith({
      userId: 3,
      action: 'admin.places_contribute_withdraw',
      details: { cleared: 4 },
      ip: '203.0.113.9',
    });
  });

  it('PCCT-008: the DTOs validate against the shared contracts', () => {
    expect(PlaceContribDecisionDto.schema).toBe(placeContribDecisionRequestSchema);
    expect(PlaceContribLogQueryDto.schema).toBe(placeContribLogQuerySchema);
    expect(PlaceContribWithdrawDto.schema).toBe(placeContribWithdrawRequestSchema);
  });
});
