/**
 * FE-AI-SKETCH-001 to FE-AI-SKETCH-004
 *
 * The small route drawing: framed by everything it holds in Web Mercator, a
 * lone point centred, nothing without a point, and a button when it shows
 * the route on the map.
 */
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import RouteSketch from './RouteSketch';
import { linePoints, mercatorY, sketchFrame, type SketchLine, type SketchMark } from './routeSketchModel';

const LINE: SketchLine = {
  id: 'day-1',
  points: [
    [45.0, 7.0],
    [45.2, 7.4],
  ],
  color: 'var(--accent)',
  casing: 'var(--bg-card)',
};
const MARKS: SketchMark[] = [
  { id: 's1', lat: 45.0, lng: 7.0, shape: 'stop' },
  { id: 'v1', lat: 45.1, lng: 7.2, shape: 'via', state: 'pending', hot: true },
  { id: 'c1', lat: 45.2, lng: 7.4, shape: 'service', color: 'var(--warning)' },
  { id: 'n1', lat: 45.15, lng: 7.3, shape: 'new', state: 'removed' },
];

describe('routeSketchModel', () => {
  it('FE-AI-SKETCH-001: projects like the map, inside the box with room around it, north up', () => {
    expect(mercatorY(0)).toBeCloseTo(0);
    expect(mercatorY(89)).toBe(mercatorY(85));
    const frame = sketchFrame([LINE], []);
    if (!frame) throw new Error('no frame');
    expect(frame.width).toBe(1000);
    const [x0, y0] = frame.project(45.0, 7.0);
    const [x1, y1] = frame.project(45.2, 7.4);
    expect(x0).toBeGreaterThan(0);
    expect(x1).toBeLessThan(frame.width);
    expect(y1).toBeLessThan(y0);
    expect(y0).toBeLessThan(frame.height);
    expect(linePoints(frame, LINE.points).split(' ')).toHaveLength(2);
  });

  it('FE-AI-SKETCH-002: one point sits in the middle, and no point gives no frame', () => {
    const frame = sketchFrame([], [{ id: 'a', lat: 45, lng: 7, shape: 'stop' }]);
    expect(frame?.project(45, 7)).toEqual([500, (frame?.height ?? 0) / 2]);
    expect(sketchFrame([], [])).toBeNull();
  });
});

describe('RouteSketch', () => {
  it('FE-AI-SKETCH-003: draws each line twice (casing and core) and every mark, as one picture', () => {
    const { container } = render(
      <RouteSketch lines={[{ ...LINE, dashed: true, dim: true }]} marks={MARKS} height={96} ariaLabel="Day 1" />
    );
    expect(screen.getByRole('img', { name: 'Day 1' })).toBeInTheDocument();
    expect(container.querySelectorAll('polyline')).toHaveLength(2);
    expect(container.querySelector('rect')).not.toBeNull();
    expect(container.querySelectorAll('circle')).toHaveLength(4);
  });

  it('FE-AI-SKETCH-004: with a way to the map it is a button, and nothing is drawn without a point', () => {
    const onActivate = vi.fn();
    const first = render(
      <RouteSketch lines={[LINE]} marks={[]} height={96} ariaLabel="Day 1" onActivate={onActivate} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Day 1' }));
    expect(onActivate).toHaveBeenCalled();
    first.unmount();

    const { container } = render(<RouteSketch lines={[]} marks={[]} height={96} ariaLabel="Nothing" />);
    expect(container).toBeEmptyDOMElement();
  });
});
