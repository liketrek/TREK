import { describe, it, expect } from 'vitest';
import { resolveLegMode } from './legMode';

const P = (o?: Partial<{ leg_transport_mode: string | null; incoming_leg_transport_mode: string | null }>) =>
  ({ isPlace: true, ...o });
const B = () => ({ isPlace: false });

describe('resolveLegMode', () => {
  it('origin place with outgoing mode wins', () => {
    expect(resolveLegMode(P({ leg_transport_mode: 'cycling' }), P(), 'walking')).toBe('cycling');
  });
  it('origin place, no override -> day default', () => {
    expect(resolveLegMode(P(), P(), 'driving')).toBe('driving');
  });
  it('non-place origin -> destination incoming override', () => {
    expect(resolveLegMode(B(), P({ incoming_leg_transport_mode: 'transit' }), 'walking')).toBe('transit');
  });
  it('non-place origin, no incoming override -> day default', () => {
    expect(resolveLegMode(B(), P(), 'walking')).toBe('walking');
  });
  it('no place endpoint at all -> day default', () => {
    expect(resolveLegMode(B(), B(), 'walking')).toBe('walking');
  });
  it('incoming is inert when origin is a place', () => {
    expect(resolveLegMode(P(), P({ incoming_leg_transport_mode: 'transit' }), 'walking')).toBe('walking');
  });
  it('undefined dest falls back to day default for a non-place origin', () => {
    expect(resolveLegMode(B(), undefined, 'walking')).toBe('walking');
  });
});
