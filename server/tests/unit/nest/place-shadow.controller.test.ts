import { PlaceShadowController } from '../../../src/nest/place-shadow/place-shadow.controller';
import type { PlaceShadowPickDto } from '../../../src/nest/place-shadow/place-shadow.dto';
import type { PlaceShadowService } from '../../../src/nest/place-shadow/place-shadow.service';

import { describe, it, expect, vi } from 'vitest';

function makeController(svc: Partial<PlaceShadowService>) {
  return new PlaceShadowController(svc as PlaceShadowService);
}

const BODY = {
  query: 'ecklife rostock',
  source: 'search:nominatim',
  liveRank: 2,
  liveCount: 6,
  pickedName: 'Ecklife',
  pickedLat: 54.083,
  pickedLng: 12.132,
} as PlaceShadowPickDto;

describe('PlaceShadowController', () => {
  describe('POST /api/place-shadow/pick', () => {
    it('answers 200 { recorded: false } when the log is off, never an error', async () => {
      const record = vi.fn().mockResolvedValue(false);
      expect(await makeController({ record }).pick(BODY)).toEqual({ recorded: false });
      expect(record).toHaveBeenCalledWith(BODY);
    });

    it('reports a written row', async () => {
      expect(await makeController({ record: vi.fn().mockResolvedValue(true) }).pick(BODY)).toEqual({ recorded: true });
    });
  });

  describe('GET /api/place-shadow/export', () => {
    const page = { version: 1 as const, generatedAt: 'now', rows: [], nextAfter: null };

    it('passes a positive cursor through', async () => {
      const exp = vi.fn().mockResolvedValue(page);
      await makeController({ export: exp }).export('42');
      expect(exp).toHaveBeenCalledWith(42);
    });

    it('starts from the beginning for anything that is not a positive integer', async () => {
      const exp = vi.fn().mockResolvedValue(page);
      const c = makeController({ export: exp });
      for (const bad of [undefined, '', 'abc', '0', '-5', '1.5', '1e400']) {
        await c.export(bad);
      }
      expect(exp.mock.calls.every(([arg]) => arg === undefined)).toBe(true);
    });
  });

  describe('DELETE /api/place-shadow', () => {
    it('reports how many rows went', async () => {
      expect(await makeController({ clear: vi.fn().mockResolvedValue(17) }).clear()).toEqual({ removed: 17 });
    });
  });

  describe('GET /api/place-shadow/summary', () => {
    it('hands the service summary straight back', async () => {
      const summary = { enabled: true, total: 3 };
      expect(await makeController({ summary: vi.fn().mockResolvedValue(summary) }).summary()).toBe(summary);
    });
  });
});
