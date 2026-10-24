// FE-COMP-PADDLE-STRIP-001 to FE-COMP-PADDLE-STRIP-011: the band of a paddle tour, water and portages to scale,
// with its locks and the obstacles on or near the route.
import type { PaddleFeature, PaddleLayout, PaddleObstacleKind, PaddleRelation, RelatedObstacle } from '@trek/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildSettings } from '../../../../tests/helpers/factories';
import { act, fireEvent, render, screen } from '../../../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../../../tests/helpers/store';
import {
  publishPaddleObstacles,
  selectPaddleObstacle,
  usePaddleObstacleStore,
} from '../../../store/paddleObstacleStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { PaddleRouteStrip } from './PaddleRouteStrip';
import { paddleKindCss, PORTAGE_CSS_COLOR } from './paddlePaint';

/** Eight kilometres: water, a carried kilometre, water, a 40 m carry round the second lock, water. */
const LAYOUT: PaddleLayout = {
  totalM: 8000,
  stretches: [
    { kind: 'water', fromM: 0, toM: 4000, extraMinutes: null, startIndex: 0 },
    { kind: 'portage', fromM: 4000, toM: 5000, extraMinutes: 10, startIndex: 2 },
    { kind: 'water', fromM: 5000, toM: 6000, extraMinutes: null, startIndex: 3 },
    { kind: 'portage', fromM: 6000, toM: 6040, extraMinutes: null, startIndex: 4 },
    { kind: 'water', fromM: 6040, toM: 8000, extraMinutes: null, startIndex: 5 },
  ],
  locks: [
    { wait_minutes: 10, transit_minutes: 15, atM: 2000, bypassed: false, index: 1 },
    { wait_minutes: null, transit_minutes: null, atM: 6000, bypassed: true, index: null },
  ],
};

function feature(ref: string, kind: PaddleObstacleKind, name: string | null = null): PaddleFeature {
  return {
    ref,
    kind,
    group_key: null,
    name,
    geometry: { type: 'Point', coordinates: [12.1, 49.1] },
    tags: {},
    tag_hash: ref,
    region_id: 'bayern',
  };
}

function relate(entry: PaddleFeature, relation: PaddleRelation, alongM: number): RelatedObstacle {
  return { feature: entry, relation, distanceM: relation === 'on_route' ? 0 : 90, alongM };
}

/** Measured along a route of 4 km, so each one sits on the 8 km band at twice its distance. */
const RELATED: RelatedObstacle[] = [
  relate(feature('node/1', 'put_in', 'Bootsrampe'), 'on_route', 0),
  relate(feature('way/2', 'weir', 'Wehr Regensburg'), 'on_route', 1500),
  relate(feature('way/3', 'access', 'Naturschutzgebiet'), 'near', 1800),
  relate(feature('node/4', 'rapids'), 'near', 2500),
  relate(feature('way/5', 'dam', 'Staustufe'), 'on_route', 4400),
];

function publish(related: RelatedObstacle[], routeLengthM = 4000): void {
  publishPaddleObstacles({
    status: 'ready',
    features: related.map((entry) => entry.feature),
    related,
    routeLengthM,
    coverage: 'covered',
    regions: [],
    truncated: false,
  });
}

const marks = () => screen.queryAllByTestId('paddle-route-strip-obstacle');
const locks = () => screen.queryAllByTestId('paddle-route-strip-lock');
const stretchesOf = () =>
  Array.from(screen.getByTestId('paddle-route-strip').querySelectorAll<HTMLElement>('[data-stretch]'));

/** The tooltip a hover opens on the element, closed again afterwards. */
async function tooltipOf(element: HTMLElement): Promise<string | null> {
  fireEvent.mouseEnter(element);
  const tip = await screen.findByRole('tooltip');
  const text = tip.textContent;
  fireEvent.mouseLeave(element);
  return text;
}

describe('PaddleRouteStrip', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('FE-COMP-PADDLE-STRIP-001: draws water and portages in order and to scale, a short carry at its least width', () => {
    render(<PaddleRouteStrip layout={LAYOUT} />);

    const parts = stretchesOf();
    expect(parts.map((part) => part.dataset.stretch)).toEqual(['water', 'portage', 'water', 'portage', 'water']);
    // Half, an eighth and an eighth of the 8 km; the 40 m carry is drawn at the 1.5 floor instead of 0.5.
    expect(parts.slice(0, 4).map((part) => part.style.flexGrow)).toEqual(['50', '12.5', '12.5', '1.5']);
    expect(parts[0]).toHaveClass('bg-info');
    expect(parts[1]).not.toHaveClass('bg-info');
    expect(parts[1]?.getAttribute('style')).toContain(`background: ${PORTAGE_CSS_COLOR}`);
    // The scale runs from the put-in to the take-out.
    expect(screen.getByText('0 m')).toBeInTheDocument();
    expect(screen.getByText('8 km')).toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-STRIP-002: names each stretch with its length on hover', async () => {
    render(<PaddleRouteStrip layout={LAYOUT} />);
    const parts = stretchesOf();

    expect(await tooltipOf(parts[0])).toBe('On the water 4 km');
    expect(await tooltipOf(parts[1])).toBe('Portage 1 km');
    expect(await tooltipOf(parts[3])).toBe('Portage 40 m');
  });

  it('FE-COMP-PADDLE-STRIP-003: marks each lock at its place, one a portage carries round faded', async () => {
    render(<PaddleRouteStrip layout={LAYOUT} />);
    const [open, carried] = locks();

    expect(locks()).toHaveLength(2);
    expect(open.style.insetInlineStart).toBe('25%');
    expect(open).not.toHaveClass('opacity-45');
    expect(open.querySelector('[data-paddle-glyph="lock"]')).toBeInTheDocument();
    expect(carried.style.insetInlineStart).toBe('75%');
    expect(carried).toHaveClass('opacity-45');
    expect(await tooltipOf(open)).toBe('Lock 2 km');
    expect(await tooltipOf(carried)).toBe('Lock 6 km');
  });

  it('FE-COMP-PADDLE-STRIP-004: places the obstacles to decide about by their share of the measured route', async () => {
    publish(RELATED);
    render(<PaddleRouteStrip layout={LAYOUT} />);

    // The put-in helps and the access rule runs along a stretch: neither becomes a mark.
    expect(marks()).toHaveLength(3);
    const [weir, rapids, dam] = marks();
    expect(weir).toHaveAccessibleName('Weir: Wehr Regensburg');
    // 1.5 of the 4 km measured is 3 of the 8 km drawn.
    expect(weir.style.insetInlineStart).toBe('37.5%');
    expect(weir.querySelector('[data-paddle-glyph="weir"]')).toBeInTheDocument();
    expect(weir?.getAttribute('style')).toContain(`color: ${paddleKindCss('weir')}`);
    expect(rapids).toHaveAccessibleName('Rapids');
    expect(rapids.style.insetInlineStart).toBe('62.5%');
    // Measured past the end of the route, it still sits at the take-out.
    expect(dam).toHaveAccessibleName('Dam: Staustufe');
    expect(dam.style.insetInlineStart).toBe('100%');
    expect(await tooltipOf(weir)).toBe('Weir: Wehr Regensburg 3 km');
    expect(await tooltipOf(rapids)).toBe('Rapids 5 km');
    expect(await tooltipOf(dam)).toBe('Dam: Staustufe 8 km');
  });

  it('FE-COMP-PADDLE-STRIP-005: rings an obstacle on the route solid and dims one only near it, dashed', () => {
    publish(RELATED);
    render(<PaddleRouteStrip layout={LAYOUT} />);
    const [weir, rapids] = marks();

    expect(weir.style.border).toContain('solid');
    expect(weir).not.toHaveClass('opacity-60');
    expect(rapids.style.border).toContain('dashed');
    expect(rapids).toHaveClass('opacity-60');
  });

  it('FE-COMP-PADDLE-STRIP-006: a click picks an obstacle for its card and a second click puts it back', () => {
    publish(RELATED);
    render(<PaddleRouteStrip layout={LAYOUT} />);
    const rapids = screen.getByRole('button', { name: 'Rapids' });
    expect(rapids).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(rapids);
    expect(usePaddleObstacleStore.getState().selectedRef).toBe('node/4');
    expect(rapids).toHaveAttribute('aria-pressed', 'true');
    expect(rapids).toHaveClass('scale-125', 'z-30');
    // Picked, a near one shows in full: no dimming and a solid ring.
    expect(rapids).not.toHaveClass('opacity-60');
    expect(rapids.style.border).toContain('solid');
    expect(screen.getByRole('button', { name: 'Weir: Wehr Regensburg' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(rapids);
    expect(usePaddleObstacleStore.getState().selectedRef).toBeNull();
    expect(rapids).toHaveAttribute('aria-pressed', 'false');
    expect(rapids).toHaveClass('z-20', 'opacity-60');
  });

  it('FE-COMP-PADDLE-STRIP-007: shows the obstacle picked elsewhere as picked, and a click moves the pick', () => {
    publish(RELATED);
    render(<PaddleRouteStrip layout={LAYOUT} />);

    act(() => selectPaddleObstacle('way/5'));
    expect(screen.getByRole('button', { name: 'Dam: Staustufe' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Weir: Wehr Regensburg' }));
    expect(usePaddleObstacleStore.getState().selectedRef).toBe('way/2');
    expect(screen.getByRole('button', { name: 'Dam: Staustufe' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Weir: Wehr Regensburg' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('FE-COMP-PADDLE-STRIP-008: places no obstacle while the route they were measured along has no length', () => {
    publish(RELATED, 0);
    render(<PaddleRouteStrip layout={LAYOUT} />);

    expect(marks()).toHaveLength(0);
    expect(locks()).toHaveLength(2);
  });

  it('FE-COMP-PADDLE-STRIP-009: compact, it draws the band alone, without locks, obstacles or the scale', () => {
    publish(RELATED);
    render(<PaddleRouteStrip layout={LAYOUT} compact />);

    expect(stretchesOf()).toHaveLength(5);
    expect(locks()).toHaveLength(0);
    expect(marks()).toHaveLength(0);
    expect(screen.queryByText('0 m')).not.toBeInTheDocument();
    expect(screen.queryByText('8 km')).not.toBeInTheDocument();
  });

  it('FE-COMP-PADDLE-STRIP-010: draws nothing for a tour without length or without stretches', () => {
    publish(RELATED);
    const { rerender } = render(<PaddleRouteStrip layout={{ ...LAYOUT, totalM: 0 }} />);
    expect(screen.queryByTestId('paddle-route-strip')).not.toBeInTheDocument();

    rerender(<PaddleRouteStrip layout={{ ...LAYOUT, stretches: [] }} />);
    expect(screen.queryByTestId('paddle-route-strip')).not.toBeInTheDocument();
    expect(marks()).toHaveLength(0);
  });

  it('FE-COMP-PADDLE-STRIP-011: reads its lengths in the unit the user chose, metric when none is set', async () => {
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'imperial' }) });
    render(<PaddleRouteStrip layout={LAYOUT} />);

    expect(screen.getByText('0 mi')).toBeInTheDocument();
    expect(screen.getByText('5 mi')).toBeInTheDocument();
    expect(await tooltipOf(locks()[0])).toBe('Lock 1.2 mi');

    act(() => seedStore(useSettingsStore, { settings: buildSettings() }));
    expect(screen.getByText('8 km')).toBeInTheDocument();
  });
});
