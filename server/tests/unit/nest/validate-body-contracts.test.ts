/**
 * Unit tests for the fail-closed body-contract boot gate
 * (src/nest/common/validate-body-contracts.ts): a POST/PUT/PATCH @Body()
 * without a createZodDto metatype must refuse boot unless allow-listed, and
 * stale allow-list entries must refuse boot too (the list only ratchets down).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { validateBodyContracts } from '../../../src/nest/common/validate-body-contracts';

class GoodDto extends createZodDto(z.object({ name: z.string() })) {}

@Controller('gate-test/good')
class GoodController {
  @Post()
  create(@Body() body: GoodDto) {
    return body;
  }

  // Non-mutation and body-less handlers are out of scope for the gate.
  @Get()
  list() {
    return [];
  }

  @Put('no-body/:id')
  touch() {
    return { ok: true };
  }
}

@Controller('gate-test/bad')
class BadController {
  @Put(':id')
  update(@Body() body: Record<string, unknown>) {
    return body;
  }
}

@Controller('gate-test/delete-body')
class DeleteBodyController {
  @Delete()
  remove(@Body() body: Record<string, unknown>) {
    return body;
  }
}

@Controller('gate-test/subfield')
class SubfieldController {
  @Post()
  reorder(@Body('orderedIds') orderedIds: number[]) {
    return orderedIds;
  }
}

async function buildApp(controllers: unknown[]): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: controllers as never[],
  }).compile();
  return moduleRef.createNestApplication();
}

describe('validateBodyContracts (fail-closed boot gate)', () => {
  let goodApp: INestApplication;
  let badApp: INestApplication;
  let subfieldApp: INestApplication;
  let deleteBodyApp: INestApplication;

  beforeAll(async () => {
    goodApp = await buildApp([GoodController]);
    badApp = await buildApp([GoodController, BadController]);
    subfieldApp = await buildApp([SubfieldController]);
    deleteBodyApp = await buildApp([DeleteBodyController]);
  });

  afterAll(async () => {
    await Promise.all([goodApp.close(), badApp.close(), subfieldApp.close(), deleteBodyApp.close()]);
  });

  it('GATE-001 — passes when every mutation body is a createZodDto class', () => {
    expect(() => validateBodyContracts(goodApp, [])).not.toThrow();
  });

  it('GATE-002 — throws naming the handler whose @Body() lacks a DTO', () => {
    expect(() => validateBodyContracts(badApp, [])).toThrow(/BadController\.update/);
  });

  it('GATE-003 — @Body(\'field\') sub-reads are unvalidated and flagged too', () => {
    expect(() => validateBodyContracts(subfieldApp, [])).toThrow(/SubfieldController\.reorder/);
  });

  it('GATE-007 — a DELETE that reads a body is held to the same contract', () => {
    expect(() => validateBodyContracts(deleteBodyApp, [])).toThrow(/DeleteBodyController\.remove/);
  });

  it('GATE-004 — an allow-listed legacy route passes', () => {
    expect(() => validateBodyContracts(badApp, ['BadController.update'])).not.toThrow();
  });

  it('GATE-005 — a stale allow-list entry throws (ratchet enforcement)', () => {
    expect(() => validateBodyContracts(goodApp, ['GhostController.gone'])).toThrow(
      /stale body-contract allow-list entry.*GhostController\.gone/,
    );
  });

  it('GATE-006 — the real allow-list is sorted and duplicate-free (reviewable ratchet)', async () => {
    const { BODY_CONTRACT_ALLOW_LIST } = await import('../../../src/nest/common/body-contract-allow-list');
    expect(BODY_CONTRACT_ALLOW_LIST).toEqual([...new Set(BODY_CONTRACT_ALLOW_LIST)].sort());
  });
});
