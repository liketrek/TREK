import { describe, it, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { HealthController } from '../../../src/nest/health/health.controller';
import { HealthService } from '../../../src/nest/health/health.service';
import { DatabaseService } from '../../../src/nest/database/database.service';

describe('Nest dependency injection (vitest + swc)', () => {
  it('injects HealthService + DatabaseService into HealthController by type', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        { provide: DatabaseService, useValue: { get: () => ({ n: 7 }) } },
      ],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.getHealth()).toEqual({
      ok: true,
      runtime: 'nestjs',
      diInjected: true,
      userCount: 7,
    });
  });
});
