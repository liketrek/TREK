/**
 * ManagedGuard — refuses the routes a centrally administered instance does not
 * hand to its own admin.
 *
 * Two properties carry the design and both are pinned below: it is inert unless
 * the route was marked (MANAGED-GUARD-002), so a self-hosted install cannot
 * notice it exists, and it keys on a decorator rather than a path list
 * (MANAGED-GUARD-005). The path lists MfaPolicyGuard replaced are the reason for
 * the second one: they stopped being maintained, and every endpoint added after
 * they were written silently fell on the wrong side.
 */
import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ManagedGuard } from '../../../src/nest/common/managed.guard';
import { MANAGED_FORBIDDEN, MANAGED_FORBIDDEN_ERROR } from '../../../src/nest/common/managed';
import type { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';

function makeGuard(managed: boolean, marked: boolean, enforcedInHandler = false) {
  const getAllAndOverride = vi.fn((key: string) =>
    key === MANAGED_FORBIDDEN && marked
      ? { reason: 'the operator holds this', enforcedInHandler }
      : undefined,
  );
  const guard = new ManagedGuard(
    { isManaged: () => managed } as unknown as RuntimeEnvService,
    { getAllAndOverride } as unknown as Reflector,
  );
  return { guard, getAllAndOverride };
}

const ctx = {
  getHandler: () => function handler() {},
  getClass: () => class Controller {},
} as never;

const thrown = (run: () => unknown) => {
  try {
    run();
  } catch (err) {
    return err as HttpException;
  }
  return undefined;
};

describe('ManagedGuard', () => {
  it('MANAGED-GUARD-001: lets a marked route through on a self-hosted install', () => {
    const { guard } = makeGuard(false, true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('MANAGED-GUARD-002: lets an unmarked route through on a managed install', () => {
    const { guard } = makeGuard(true, false);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('MANAGED-GUARD-003: refuses a marked route on a managed install', () => {
    const { guard } = makeGuard(true, true);
    const err = thrown(() => guard.canActivate(ctx));

    expect(err).toBeInstanceOf(HttpException);
    expect(err?.getStatus()).toBe(403);
    expect(err?.getResponse()).toEqual(MANAGED_FORBIDDEN_ERROR);
  });

  it('MANAGED-GUARD-004: does not read metadata at all while the mode is off', () => {
    // The cheap check comes first because this guard runs on every request of
    // every install, and all but a handful of them are self-hosted.
    const { guard, getAllAndOverride } = makeGuard(false, true);
    guard.canActivate(ctx);

    expect(getAllAndOverride).not.toHaveBeenCalled();
  });

  it('MANAGED-GUARD-006: lets a handler-enforced marking through, so multipart still parses', () => {
    // The route is marked and the mode is on, and it still passes: a guard that
    // threw here would leave the upload body unread and the client would see an
    // ECONNRESET instead of the 403 (PROFILE-015). The handler does the refusing.
    const { guard } = makeGuard(true, true, true);

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('MANAGED-GUARD-005: asks for the decorator on handler and controller, not for a path', () => {
    const { guard, getAllAndOverride } = makeGuard(true, false);
    guard.canActivate(ctx);

    expect(getAllAndOverride).toHaveBeenCalledWith(MANAGED_FORBIDDEN, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });
});
