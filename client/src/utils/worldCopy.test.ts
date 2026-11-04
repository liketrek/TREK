import { describe, expect, it } from 'vitest';
import { bboxOnRealWorld, onRealWorld } from './worldCopy';

describe('onRealWorld', () => {
  it('brings a right-click on the copy east of the real world back to the real point (#2976)', () => {
    const at = onRealWorld({ lat: 10.14, lng: 274.921875 });
    expect(at.lat).toBe(10.14);
    expect(at.lng).toBeCloseTo(-85.078125, 9);
  });

  it('brings a point on the copy west of it back too', () => {
    expect(onRealWorld({ lat: 35.68, lng: -220.3 }).lng).toBeCloseTo(139.7, 9);
  });

  it('hands a point already on the real world back as it is', () => {
    const point = { lat: 34, lng: -118.4, extra: 1 };
    expect(onRealWorld(point)).toBe(point);
  });

  it('keeps any other field of the point', () => {
    expect(onRealWorld({ lat: 1, lng: 365, name: 'x' })).toEqual({ lat: 1, lng: 5, name: 'x' });
  });
});

describe('bboxOnRealWorld', () => {
  it('moves a box looking at a copy of Japan onto Japan', () => {
    const box = bboxOnRealWorld({ south: 34, west: -225, north: 37, east: -215 });
    expect(box.west).toBeCloseTo(135, 9);
    expect(box.east).toBeCloseTo(145, 9);
    expect([box.south, box.north]).toEqual([34, 37]);
  });

  it('leaves a box on the real world alone', () => {
    const box = { south: 40, west: 0, north: 50, east: 20 };
    expect(bboxOnRealWorld(box)).toBe(box);
  });

  it('keeps a box across the antimeridian across it', () => {
    expect(bboxOnRealWorld({ south: -20, west: 170, north: -10, east: 190 })).toEqual({
      south: -20,
      west: 170,
      north: -10,
      east: 190,
    });
  });
});
