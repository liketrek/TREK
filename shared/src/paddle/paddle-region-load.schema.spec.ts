import {
  MAX_PADDLE_LOAD_POINTS,
  PADDLE_AUTO_MAX_MB,
  paddleRegionListResponseSchema,
  paddleRegionLoadRequestSchema,
  paddleRegionLoadResponseSchema,
  paddleRegionLoadStateSchema,
  paddleRegionPendingSchema,
  paddleRegionSettingsSchema,
} from './paddle-regions.schema';

import { describe, expect, it } from 'vitest';

const REF = { id: 'oberpfalz', name: 'Oberpfalz' };
const PLACE = { lat: 49.1, lng: 12.1 };

describe('paddle region loading (PAD-11C)', () => {
  it('asks about one place up to a handful, retries only when told to', () => {
    expect(paddleRegionLoadRequestSchema.parse({ points: [PLACE] })).toEqual({ points: [PLACE], retry: false });
    expect(paddleRegionLoadRequestSchema.safeParse({ points: [] }).success).toBe(false);
    const many = Array.from({ length: MAX_PADDLE_LOAD_POINTS + 1 }, () => PLACE);
    expect(paddleRegionLoadRequestSchema.safeParse({ points: many }).success).toBe(false);
    expect(paddleRegionLoadRequestSchema.safeParse({ points: [{ lat: 91, lng: 0 }] }).success).toBe(false);
  });

  it('answers every state a place can be in, each with what it needs', () => {
    const states = [
      { state: 'ready', region: REF },
      { state: 'no_water', region: REF },
      { state: 'loading', region: REF, progress: { phase: 'download', fraction: 0.3 }, ahead: 0 },
      { state: 'loading', region: REF, progress: null, ahead: 2 },
      { state: 'requested', region: REF, reason: 'too_large' },
      { state: 'declined', region: REF },
      { state: 'failed', region: REF },
      { state: 'unavailable', region: null, reason: 'no_extract' },
      { state: 'unavailable', region: REF, reason: 'off' },
    ];
    for (const state of states) expect(paddleRegionLoadStateSchema.safeParse(state).success).toBe(true);
    expect(paddleRegionLoadResponseSchema.safeParse({ points: states }).success).toBe(true);
    expect(paddleRegionLoadStateSchema.safeParse({ state: 'loading', region: REF, progress: null }).success).toBe(
      false,
    );
    expect(paddleRegionLoadStateSchema.safeParse({ state: 'requested', region: REF, reason: 'bored' }).success).toBe(
      false,
    );
  });

  it('holds the admin setting to its modes and a size between its bounds', () => {
    expect(paddleRegionSettingsSchema.safeParse({ mode: 'auto', max_mb: PADDLE_AUTO_MAX_MB.default }).success).toBe(
      true,
    );
    expect(paddleRegionSettingsSchema.safeParse({ mode: 'always', max_mb: 500 }).success).toBe(false);
    expect(paddleRegionSettingsSchema.safeParse({ mode: 'ask', max_mb: PADDLE_AUTO_MAX_MB.max + 1 }).success).toBe(
      false,
    );
    expect(paddleRegionSettingsSchema.safeParse({ mode: 'off', max_mb: 2.5 }).success).toBe(false);
  });

  it('lists the regions with the requests that wait for an admin', () => {
    const request = {
      id: 'norway',
      name: 'Norway',
      reason: 'too_large',
      bytes: 1_300_000_000,
      requested_by: 'elmo',
      requested_at: '2026-10-18T09:00:00Z',
      declined: false,
    };
    expect(paddleRegionPendingSchema.safeParse(request).success).toBe(true);
    expect(paddleRegionPendingSchema.safeParse({ ...request, requested_by: null, bytes: null }).success).toBe(true);
    expect(paddleRegionListResponseSchema.safeParse({ regions: [], requests: [request] }).success).toBe(true);
    expect(paddleRegionListResponseSchema.safeParse({ regions: [] }).success).toBe(false);
  });
});
