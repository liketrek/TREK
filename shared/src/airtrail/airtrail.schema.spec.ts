import { airtrailImportSchema } from './airtrail.schema';

import { describe, it, expect } from 'vitest';

describe('airtrailImportSchema', () => {
  it('requires at least one flight id', () => {
    expect(airtrailImportSchema.safeParse({ flightIds: ['101'] }).success).toBe(true);
    expect(airtrailImportSchema.safeParse({ flightIds: [] }).success).toBe(false);
    expect(airtrailImportSchema.safeParse({}).success).toBe(false);
  });

  it('carries connection chains through (#1535) — each with at least two legs', () => {
    const parsed = airtrailImportSchema.parse({ flightIds: ['101', '102'], connections: [['101', '102']] });
    expect(parsed.connections).toEqual([['101', '102']]);
    expect(airtrailImportSchema.parse({ flightIds: ['101'] }).connections).toBeUndefined();
    expect(airtrailImportSchema.safeParse({ flightIds: ['101'], connections: [['101']] }).success).toBe(false);
  });
});
