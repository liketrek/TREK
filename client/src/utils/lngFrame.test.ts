import { describe, expect, it } from 'vitest';
import { frameLine, frameLng, tripLngFrame, viewLngFrame } from './lngFrame';

const LA = -118.4;
const AUCKLAND = 174.8;

describe('tripLngFrame (#2975)', () => {
  it('gives a trip that stays off the antimeridian no frame, so every layer draws as before', () => {
    expect(tripLngFrame([2.35, 13.4, -3.7, 12.5])).toBeNull();
    expect(tripLngFrame([LA, -73.9, -0.1, 139.7])).toBeNull();
    expect(tripLngFrame([])).toBeNull();
    expect(tripLngFrame([LA])).toBeNull();
  });

  it('seams a trip across the Pacific in the middle of the stretch it leaves empty', () => {
    const frame = tripLngFrame([LA, -118.3, AUCKLAND, 174.76]);
    expect(frame).not.toBeNull();
    expect(frame?.seam).toBeCloseTo((-118.3 + 174.76) / 2, 5);
    expect(frameLng(frame, LA)).toBeCloseTo(LA + 360, 9);
    expect(frameLng(frame, AUCKLAND)).toBeCloseTo(AUCKLAND, 9);
  });

  it('seams Fiji to Samoa, a few degrees apart across the date line', () => {
    const frame = tripLngFrame([178.4, -171.8]);
    expect(frame).not.toBeNull();
    expect(frameLng(frame, -171.8) - frameLng(frame, 178.4)).toBeCloseTo(9.8, 9);
  });

  it('leaves a trip around the world alone when re-seaming would barely narrow it', () => {
    expect(tripLngFrame([-150, -90, -30, 30, 90, 150])).toBeNull();
  });

  it('keeps the frame in use while it still fits, so a new place does not slide the map', () => {
    const first = tripLngFrame([LA, AUCKLAND]);
    expect(tripLngFrame([LA, AUCKLAND, 151.2], first)).toBe(first);
  });

  it('reads a longitude from a world copy where it really is', () => {
    const fromCopies = tripLngFrame([LA + 360, AUCKLAND - 720]);
    expect(fromCopies?.seam).toBeCloseTo(tripLngFrame([LA, AUCKLAND])?.seam ?? Number.NaN, 9);
  });
});

describe('frameLng', () => {
  it('draws a longitude where it is without a frame', () => {
    expect(frameLng(null, LA)).toBe(LA);
    expect(frameLng(null, 400)).toBe(400);
  });

  it('moves any longitude into the frame, and one already in it nowhere', () => {
    const frame = { seam: 28 };
    expect(frameLng(frame, LA)).toBeCloseTo(241.6, 9);
    expect(frameLng(frame, 241.6)).toBeCloseTo(241.6, 9);
    expect(frameLng(frame, 28)).toBe(28);
    expect(frameLng(frame, 27.9)).toBeCloseTo(387.9, 9);
  });
});

describe('frameLine', () => {
  it('hands the line back untouched without a frame', () => {
    const line: [number, number][] = [
      [0, 170],
      [0, -170],
    ];
    expect(frameLine(null, line)).toBe(line);
  });

  it('starts the line in the frame and keeps it one line across the antimeridian', () => {
    const drawn = frameLine({ seam: 28 }, [
      [34, LA],
      [0, -160],
      [-20, 179],
      [-37, AUCKLAND],
    ]);
    expect(drawn.map(([, lng]) => Math.round(lng * 10) / 10)).toEqual([241.6, 200, 179, 174.8]);
  });

  it('runs past the edge of the frame rather than jumping back across the world', () => {
    const drawn = frameLine({ seam: 28 }, [
      [0, 30],
      [0, 20],
    ]);
    expect(drawn.map(([, lng]) => lng)).toEqual([30, 20]);
  });
});

describe('viewLngFrame', () => {
  it('keeps the plain world while the view looks at the real world', () => {
    expect(viewLngFrame(null, 0)).toBeNull();
    expect(viewLngFrame(null, 10)).toBeNull();
    expect(viewLngFrame(null, -90)).toBeNull();
  });

  it('keeps the frame in use while the view stays near its middle, so a pan redraws nothing', () => {
    const frame = { seam: 28.4 };
    expect(viewLngFrame(frame, 208.4)).toBe(frame);
    expect(viewLngFrame(frame, 130)).toBe(frame);
  });

  it('centres the frame on a view outside the trip frame, so places found there are drawn there', () => {
    // A trip from Los Angeles to Auckland, seamed at 28.4, with the user looking at Europe.
    const frame = viewLngFrame({ seam: 28.4 }, 10);
    expect(frame).toEqual({ seam: -170 });
    expect(frameLng(frame, 12)).toBeCloseTo(12, 6);
    expect(frameLng(frame, 23.7)).toBeCloseTo(23.7, 6);
    expect(frameLng(frame, -5)).toBeCloseTo(-5, 6);
  });

  it('centres the frame on a view of a world copy', () => {
    const frame = viewLngFrame(null, 495);
    expect(frame).toEqual({ seam: 315 });
    expect(frameLng(frame, 139.7)).toBeCloseTo(499.7, 6);
  });
});
