// FE-PORTAGE-ROUTE-001 to 004: a portage laid on the ways on land, never on a detour (PAD-03).
import { beforeEach, describe, expect, it, vi } from 'vitest';

const valhallaRun = vi.fn();
vi.mock('../../Map/valhallaRoute', () => ({ valhallaRun: (...args: unknown[]) => valhallaRun(...args) }));

const { routePortageLine } = await import('./portageRoute');

const FROM = { lat: 53.2232, lng: 12.9668 };
const TO = { lat: 53.2229, lng: 12.9701 };

function answer(coordinates: [number, number][]) {
  return { legs: [], snapped: [], total: { coordinates, distance: 0, duration: 0 } };
}

describe('routePortageLine', () => {
  beforeEach(() => valhallaRun.mockReset());

  it('FE-PORTAGE-ROUTE-001: asks the walking router on easy ground and starts and ends at the points themselves', async () => {
    valhallaRun.mockResolvedValue(
      answer([
        [53.2233, 12.9672],
        [53.2226, 12.9686],
        [53.223, 12.9698],
      ])
    );
    const line = await routePortageLine(FROM, TO);
    expect(valhallaRun).toHaveBeenCalledWith([FROM, TO], 'walking', [], undefined, { max_hiking_difficulty: 1 });
    expect(line?.[0]).toEqual([FROM.lat, FROM.lng]);
    expect(line?.[line.length - 1]).toEqual([TO.lat, TO.lng]);
    expect(line).toHaveLength(5);
  });

  it('FE-PORTAGE-ROUTE-002: keeps the carry straight when the way is a long detour', async () => {
    valhallaRun.mockResolvedValue(
      answer([
        [53.2233, 12.9672],
        [53.24, 12.968],
        [53.223, 12.9698],
      ])
    );
    expect(await routePortageLine(FROM, TO)).toBeNull();
  });

  it('FE-PORTAGE-ROUTE-003: keeps the carry straight when no router answers', async () => {
    valhallaRun.mockResolvedValue(null);
    expect(await routePortageLine(FROM, TO)).toBeNull();
  });

  it('FE-PORTAGE-ROUTE-004: takes no line of a single point', async () => {
    valhallaRun.mockResolvedValue(answer([[53.2233, 12.9672]]));
    expect(await routePortageLine(FROM, TO)).toBeNull();
  });
});
