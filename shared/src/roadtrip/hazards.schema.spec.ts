import { hazardGeometrySchema } from './hazards.schema';

import { expect, it } from 'vitest';

it('rejects coordinates outside the map and incomplete polygon rings', () => {
  expect(hazardGeometrySchema.safeParse({ type: 'Point', coordinates: [181, 50] }).success).toBe(false);
  expect(hazardGeometrySchema.safeParse({ type: 'Polygon', coordinates: [[[10, 50]]] }).success).toBe(false);
});
