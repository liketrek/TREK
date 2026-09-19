import { chronoOrder } from './chrono-order';

import { describe, it, expect } from 'vitest';

type Stop = { name: string; at: number | null };

const stop = (name: string, at: number | null = null): Stop => ({ name, at });
const order = (stops: Stop[]) => chronoOrder(stops, (s) => s.at).map((s) => s.name);

describe('chronoOrder', () => {
  it('leaves untimed stops in front of the first timed one where they are', () => {
    expect(order([stop('A'), stop('B'), stop('C', 14 * 60)])).toEqual(['A', 'B', 'C']);
  });

  it('keeps an untimed stop behind the timed stop it followed', () => {
    expect(order([stop('A', 9 * 60), stop('B'), stop('C', 14 * 60)])).toEqual(['A', 'B', 'C']);
  });

  it('sorts timed stops among themselves and leaves the untimed head alone', () => {
    expect(order([stop('A'), stop('B', 15 * 60), stop('C', 10 * 60)])).toEqual(['A', 'C', 'B']);
  });

  it('carries an untimed stop along with the timed stop in front of it', () => {
    // B inherits 15:00 from A, so both go behind C at 10:00, and B stays behind A.
    expect(order([stop('A', 15 * 60), stop('B'), stop('C', 10 * 60)])).toEqual(['C', 'A', 'B']);
  });

  it('keeps the incoming order for equal times', () => {
    expect(order([stop('A', 600), stop('B', 600), stop('C', 540), stop('D', 540)])).toEqual(['C', 'D', 'A', 'B']);
  });

  it('treats undefined like null and orders midnight as a real time', () => {
    const stops = [
      { name: 'A', at: undefined },
      { name: 'B', at: 60 },
      { name: 'C', at: 0 },
    ];
    expect(chronoOrder(stops, (s) => s.at).map((s) => s.name)).toEqual(['A', 'C', 'B']);
  });

  it('returns a new array and leaves the input as it was', () => {
    const stops = [stop('A', 600), stop('B', 540)];
    const sorted = chronoOrder(stops, (s) => s.at);
    expect(sorted).not.toBe(stops);
    expect(stops.map((s) => s.name)).toEqual(['A', 'B']);
    expect(sorted[0]).toBe(stops[1]);
  });

  it('handles an empty day', () => {
    expect(chronoOrder([], () => null)).toEqual([]);
  });
});
