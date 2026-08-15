/**
 * The boot gate for the managed surface
 * (src/nest/common/validate-managed-routes.ts).
 *
 * Same ratchet shape as the anonymous-route gate next door, with one case it
 * does not have: a marker without a reason. That one matters most. An unlisted
 * or stale entry is a bookkeeping error somebody notices at the next boot, but a
 * blank reason destroys the only record of WHY a control was taken away from a
 * customer, and nothing recovers that afterwards.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ManagedForbidden } from '../../../src/nest/common/managed';
import {
  collectManagedRoutes,
  validateManagedRoutes,
} from '../../../src/nest/common/validate-managed-routes';

@Controller('managed-gate/plain')
class PlainController {
  @Get()
  list() {
    return [];
  }
}

@Controller('managed-gate/marked')
class MarkedController {
  @ManagedForbidden('the operator supplies this credential')
  @Get('key')
  key() {
    return {};
  }

  @ManagedForbidden('replacing state the operator owns', { enforcedInHandler: true })
  @Post('upload')
  upload() {
    return {};
  }

  @Get('untouched')
  untouched() {
    return {};
  }
}

@Controller('managed-gate/blank')
class BlankReasonController {
  @ManagedForbidden('   ')
  @Get()
  vague() {
    return {};
  }
}

/** A whole controller marked at class level: every route below inherits it. */
@ManagedForbidden('this entire surface belongs to the operator')
@Controller('managed-gate/whole')
class WholeController {
  @Get('a')
  a() {
    return {};
  }

  @Get('b')
  b() {
    return {};
  }
}

async function buildApp(controllers: unknown[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: controllers as never[],
  }).compile();
  return moduleRef.createNestApplication();
}

describe('collectManagedRoutes', () => {
  let markedApp: INestApplication;
  let wholeApp: INestApplication;

  beforeAll(async () => {
    markedApp = await buildApp([PlainController, MarkedController]);
    wholeApp = await buildApp([WholeController]);
  });

  afterAll(async () => {
    await Promise.all([markedApp.close(), wholeApp.close()]);
  });

  it('MANAGED-BOOT-001: inventories the marked routes and leaves the rest alone', () => {
    const entries = collectManagedRoutes(markedApp);

    expect(entries.map((e) => e.id)).toEqual([
      'MarkedController.key',
      'MarkedController.upload',
    ]);
  });

  it('MANAGED-BOOT-002: carries the reason and the handler-enforced flag through', () => {
    const entries = collectManagedRoutes(markedApp);

    expect(entries[0]).toEqual({
      id: 'MarkedController.key',
      reason: 'the operator supplies this credential',
      enforcedInHandler: false,
    });
    expect(entries[1].enforcedInHandler).toBe(true);
  });

  it('MANAGED-BOOT-003: a class-level marking covers every route under it', () => {
    const entries = collectManagedRoutes(wholeApp);

    expect(entries.map((e) => e.id)).toEqual(['WholeController.a', 'WholeController.b']);
    expect(entries.every((e) => e.reason === 'this entire surface belongs to the operator')).toBe(true);
  });
});

describe('validateManagedRoutes (fail-closed boot gate)', () => {
  let markedApp: INestApplication;
  let blankApp: INestApplication;
  let plainApp: INestApplication;

  beforeAll(async () => {
    markedApp = await buildApp([PlainController, MarkedController]);
    blankApp = await buildApp([BlankReasonController]);
    plainApp = await buildApp([PlainController]);
  });

  afterAll(async () => {
    await Promise.all([markedApp.close(), blankApp.close(), plainApp.close()]);
  });

  it('MANAGED-BOOT-004: passes when the list matches the markings', () => {
    expect(() =>
      validateManagedRoutes(markedApp, ['MarkedController.key', 'MarkedController.upload']),
    ).not.toThrow();
  });

  it('MANAGED-BOOT-005: throws naming a marking nobody put on the list', () => {
    expect(() => validateManagedRoutes(markedApp, ['MarkedController.key'])).toThrow(
      /MarkedController\.upload/,
    );
  });

  it('MANAGED-BOOT-006: throws on a stale entry, so the list cannot rot', () => {
    expect(() => validateManagedRoutes(plainApp, ['MarkedController.key'])).toThrow(
      /no longer marked/,
    );
  });

  it('MANAGED-BOOT-007: throws when a marking has no reason', () => {
    expect(() => validateManagedRoutes(blankApp, ['BlankReasonController.vague'])).toThrow(
      /without a reason/,
    );
  });

  it('MANAGED-BOOT-008: an install with no markings and an empty list is fine', () => {
    expect(() => validateManagedRoutes(plainApp, [])).not.toThrow();
  });

  it('MANAGED-BOOT-009: the failure explains what an entry costs a customer', () => {
    // The message is the only thing a reviewer sees at 2am, so it says what the
    // list means rather than just which line is wrong.
    expect(() => validateManagedRoutes(markedApp, [])).toThrow(/withholds from its own admin/);
  });
});
