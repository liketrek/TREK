// FE-FERRATA-OVERLAY-001 to FE-FERRATA-OVERLAY-004: where the picked ferrata's card sits over the map, and how it closes.
import { describe, expect, it, vi } from 'vitest';

import type { Ferrata } from '@trek/shared';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import FerrataDetailOverlay from './FerrataDetailOverlay';
import { groupFerratas } from './ferrataGroups';
import type { FerrataSelection } from './useFerrataMapLayer';

const FERRATA: Ferrata = {
  id: 'way/42',
  name: 'Via delle Trincee',
  grade: { raw: '4', level: 4, plus: null },
  routeName: null,
  geometry: [
    [46.52, 11.8],
    [46.53, 11.81],
  ],
  osmUrl: 'https://www.openstreetmap.org/way/42',
};

const [GROUP] = groupFerratas([FERRATA]);
if (!GROUP) throw new Error('no group');
const SELECTION: FerrataSelection = { group: GROUP, segment: FERRATA };

describe('FerrataDetailOverlay', () => {
  it('FE-FERRATA-OVERLAY-001: shows nothing while no ferrata is picked', () => {
    render(<FerrataDetailOverlay selection={null} onClose={vi.fn()} insetEnd={400} bottom={66} />);
    expect(screen.queryByTestId('ferrata-detail-overlay')).toBeNull();
  });

  it('FE-FERRATA-OVERLAY-002: anchors the card at the bottom of the inline end, clear of the panel and the control row', () => {
    render(<FerrataDetailOverlay selection={SELECTION} onClose={vi.fn()} insetEnd={400} bottom={66} />);
    const overlay = screen.getByTestId('ferrata-detail-overlay');
    expect(overlay.style.insetInlineEnd).toBe('400px');
    // Logical only: no physical side, so a right-to-left page mirrors it.
    expect(overlay.style.right).toBe('');
    expect(overlay.style.left).toBe('');
    expect(overlay.style.bottom).toBe('66px');
    expect(overlay).toContainElement(screen.getByTestId('ferrata-detail-card'));
  });

  it('FE-FERRATA-OVERLAY-003: closes on a press outside it, not on one inside, and reports the outside press', () => {
    const onClose = vi.fn();
    const onOutsidePress = vi.fn();
    render(
      <div>
        <button type="button">map</button>
        <FerrataDetailOverlay
          selection={SELECTION}
          onClose={onClose}
          onOutsidePress={onOutsidePress}
          insetEnd={400}
          bottom={66}
        />
      </div>
    );
    fireEvent.pointerDown(screen.getByText('Via delle Trincee'));
    expect(onClose).not.toHaveBeenCalled();
    expect(onOutsidePress).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByRole('button', { name: 'map' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onOutsidePress).toHaveBeenCalledTimes(1);
  });

  it('FE-FERRATA-OVERLAY-004: closes on Escape and on its own close button', () => {
    const onClose = vi.fn();
    render(<FerrataDetailOverlay selection={SELECTION} onClose={onClose} insetEnd={400} bottom={66} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
