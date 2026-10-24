// FE-COMP-PADDLEOVERLAY-001 to FE-COMP-PADDLEOVERLAY-008: the picked paddle object's card over the planner map,
// opened and closed through the obstacle store, and the ways it closes.
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaddleCoverageRegion, PaddleFeature, RelatedObstacle } from '@trek/shared';

import { act, fireEvent, render, screen } from '../../../../tests/helpers/render';
import { resetAllStores } from '../../../../tests/helpers/store';
import {
  publishPaddleObstacles,
  selectPaddleObstacle,
  usePaddleObstacleStore,
} from '../../../store/paddleObstacleStore';
import PaddleObstacleOverlay from './PaddleObstacleOverlay';

const REGION: PaddleCoverageRegion = {
  id: 'hessen',
  name: 'Hessen',
  source_timestamp: '2026-06-01T12:00:00Z',
  imported_at: '2026-06-02T08:00:00Z',
};

const WEIR: PaddleFeature = {
  ref: 'way/101',
  kind: 'weir',
  group_key: null,
  name: 'Hammer weir',
  geometry: {
    type: 'LineString',
    coordinates: [
      [8.1, 50.1],
      [8.101, 50.1],
    ],
  },
  tags: { waterway: 'weir' },
  tag_hash: 'weir-hash',
  region_id: 'hessen',
};

/** Unnamed and from a region the answer does not hold, so its card reads its kind and an unknown date. */
const SLIPWAY: PaddleFeature = {
  ref: 'node/202',
  kind: 'slipway',
  group_key: null,
  name: null,
  geometry: { type: 'Point', coordinates: [8.2, 50.2] },
  tags: { leisure: 'slipway' },
  tag_hash: 'slipway-hash',
  region_id: 'elsewhere',
};

const WEIR_ON_ROUTE: RelatedObstacle = { feature: WEIR, relation: 'on_route', distanceM: 4, alongM: 2500 };

function publish(features: PaddleFeature[], related: RelatedObstacle[] = []): void {
  publishPaddleObstacles({
    status: 'ready',
    features,
    related,
    routeLengthM: 12_000,
    coverage: 'covered',
    regions: [REGION],
    truncated: false,
  });
}

function renderOverlay(props: Partial<ComponentProps<typeof PaddleObstacleOverlay>> = {}): void {
  render(
    <div>
      <button type="button">map</button>
      <PaddleObstacleOverlay insetEnd={400} bottom={66} {...props} />
    </div>
  );
}

const overlay = () => screen.queryByTestId('paddle-obstacle-overlay');
const selectedRef = () => usePaddleObstacleStore.getState().selectedRef;
const pressMap = () => fireEvent.pointerDown(screen.getByRole('button', { name: 'map' }));

describe('PaddleObstacleOverlay', () => {
  beforeEach(() => {
    resetAllStores();
  });

  it('FE-COMP-PADDLEOVERLAY-001: shows nothing and leaves presses and keys alone while no known object is picked', () => {
    const onOutsidePress = vi.fn();
    publish([WEIR]);
    renderOverlay({ onOutsidePress });
    expect(overlay()).toBeNull();

    // A pick the store holds no object for opens nothing either.
    act(() => selectPaddleObstacle('node/999'));
    expect(overlay()).toBeNull();

    pressMap();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOutsidePress).not.toHaveBeenCalled();
    expect(selectedRef()).toBe('node/999');
  });

  it('FE-COMP-PADDLEOVERLAY-002: anchors the card of the pick at the bottom of the inline end, clear of the panel', () => {
    publish([WEIR], [WEIR_ON_ROUTE]);
    selectPaddleObstacle(WEIR.ref);
    renderOverlay({ width: 320 });

    const shown = screen.getByTestId('paddle-obstacle-overlay');
    expect(shown.style.insetInlineEnd).toBe('400px');
    // Logical only: no physical side, so a right-to-left page mirrors it.
    expect(shown.style.right).toBe('');
    expect(shown.style.left).toBe('');
    expect(shown.style.bottom).toBe('66px');
    expect(shown.style.maxWidth).toBe('calc(100% - 432px)');

    const card = screen.getByTestId('paddle-obstacle-card');
    expect(shown).toContainElement(card);
    expect(card.style.width).toBe('320px');
    expect(screen.getByRole('heading', { name: 'Hammer weir' })).toBeInTheDocument();
    expect(screen.getByText('Weir')).toBeInTheDocument();
    // The relation and the date of the data come out of the same store as the pick.
    expect(screen.getByText('On the route at')).toBeInTheDocument();
    expect(screen.getByText(/^OpenStreetMap data as of /)).toBeInTheDocument();
  });

  it('FE-COMP-PADDLEOVERLAY-003: closes on a press outside it and hands that press on, never on a press inside it', () => {
    const onOutsidePress = vi.fn();
    publish([WEIR]);
    selectPaddleObstacle(WEIR.ref);
    renderOverlay({ onOutsidePress });

    fireEvent.pointerDown(screen.getByRole('heading', { name: 'Hammer weir' }));
    expect(onOutsidePress).not.toHaveBeenCalled();
    expect(selectedRef()).toBe(WEIR.ref);
    expect(overlay()).toBeInTheDocument();

    pressMap();
    expect(onOutsidePress).toHaveBeenCalledTimes(1);
    expect(selectedRef()).toBeNull();
    expect(overlay()).toBeNull();

    // Once closed it stops listening, so the next press on the map is the map's alone.
    pressMap();
    expect(onOutsidePress).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-PADDLEOVERLAY-004: closes on a press outside it without anyone to hand the press to', () => {
    publish([WEIR]);
    selectPaddleObstacle(WEIR.ref);
    renderOverlay();

    fireEvent.pointerDown(document.body);
    expect(selectedRef()).toBeNull();
    expect(overlay()).toBeNull();
  });

  it('FE-COMP-PADDLEOVERLAY-005: closes on Escape, not on another key nor on an Escape something else already took', () => {
    const onOutsidePress = vi.fn();
    publish([WEIR]);
    selectPaddleObstacle(WEIR.ref);
    renderOverlay({ onOutsidePress });

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(overlay()).toBeInTheDocument();

    // A dialog above the map that handles its own Escape keeps the card open.
    const takeEscape = (event: KeyboardEvent) => {
      event.preventDefault();
    };
    document.addEventListener('keydown', takeEscape, true);
    fireEvent.keyDown(document.body, { key: 'Escape' });
    document.removeEventListener('keydown', takeEscape, true);
    expect(overlay()).toBeInTheDocument();
    expect(selectedRef()).toBe(WEIR.ref);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(selectedRef()).toBeNull();
    expect(overlay()).toBeNull();
    // A key is not a press: the map has no click to leave alone.
    expect(onOutsidePress).not.toHaveBeenCalled();
  });

  it('FE-COMP-PADDLEOVERLAY-006: closes from its own close button without reporting a press outside', () => {
    const onOutsidePress = vi.fn();
    publish([WEIR]);
    selectPaddleObstacle(WEIR.ref);
    renderOverlay({ onOutsidePress });

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(selectedRef()).toBeNull();
    expect(overlay()).toBeNull();
    expect(onOutsidePress).not.toHaveBeenCalled();
  });

  it('FE-COMP-PADDLEOVERLAY-007: puts the checklist part for the picked object inside the card, where a press keeps it open', () => {
    const onOutsidePress = vi.fn();
    publish([WEIR], [WEIR_ON_ROUTE]);
    selectPaddleObstacle(WEIR.ref);
    renderOverlay({
      onOutsidePress,
      extra: (detail) => <button type="button">{`Decide ${detail.feature.ref} ${detail.relation}`}</button>,
    });

    const decide = screen.getByRole('button', { name: 'Decide way/101 on_route' });
    expect(screen.getByTestId('paddle-obstacle-card')).toContainElement(decide);

    fireEvent.pointerDown(decide);
    expect(onOutsidePress).not.toHaveBeenCalled();
    expect(selectedRef()).toBe(WEIR.ref);
    expect(overlay()).toBeInTheDocument();
  });

  it('FE-COMP-PADDLEOVERLAY-008: follows the pick made elsewhere and closes when the object leaves the store', () => {
    const onOutsidePress = vi.fn();
    publish([WEIR, SLIPWAY]);
    renderOverlay({ onOutsidePress });
    expect(overlay()).toBeNull();

    act(() => selectPaddleObstacle(WEIR.ref));
    expect(screen.getByRole('heading', { name: 'Hammer weir' })).toBeInTheDocument();

    // The checklist picks another object: the same card shows that one, named by its kind.
    act(() => selectPaddleObstacle(SLIPWAY.ref));
    expect(screen.getByRole('heading', { name: 'Slipway' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hammer weir' })).toBeNull();
    expect(screen.getByText(/^OpenStreetMap data of an unknown date/)).toBeInTheDocument();

    // A refresh without the object drops the pick and the card with it, and the card stops listening.
    act(() => publish([WEIR]));
    expect(selectedRef()).toBeNull();
    expect(overlay()).toBeNull();
    pressMap();
    expect(onOutsidePress).not.toHaveBeenCalled();
  });
});
