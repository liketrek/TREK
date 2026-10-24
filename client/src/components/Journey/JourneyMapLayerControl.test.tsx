// FE-JOURNEY-MAPLAYERCTL-001 to FE-JOURNEY-MAPLAYERCTL-003
//
// JRN-04: the journey map's layer switches and its key.
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import JourneyMapLayerControl from './JourneyMapLayerControl';
import { ALL_VISIBLE, type JourneyMapLayerControl as Control } from './journeyMapLayers';
import type { JourneyMapLayersView } from './useJourneyMapLayers';

function view(controls: Control[], over: Partial<JourneyMapLayersView> = {}): JourneyMapLayersView {
  return {
    visibility: ALL_VISIBLE,
    toggle: vi.fn(),
    controls,
    tracks: [],
    marks: [],
    plannedEntryIds: new Set(),
    ...over,
  };
}

describe('JourneyMapLayerControl', () => {
  it('FE-JOURNEY-MAPLAYERCTL-001: one pressed switch per offered layer with its count, a withheld one not at all', () => {
    const layers = view(
      [
        { layer: 'recorded', count: 2, state: 'ready' },
        { layer: 'entries', count: 5, state: 'ready' },
        { layer: 'photos', count: 0, state: 'empty' },
      ],
      { visibility: { ...ALL_VISIBLE, photos: false } }
    );
    render(<JourneyMapLayerControl layers={layers} />);

    expect(screen.queryByTestId('journey-map-layer-plan')).toBeNull();
    expect(screen.getByTestId('journey-map-layer-recorded')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('journey-map-layer-entries-badge')).toHaveTextContent('5');
    const photos = screen.getByTestId('journey-map-layer-photos');
    expect(photos).toHaveAttribute('aria-pressed', 'false');
    expect(photos.className).toContain('opacity-55');
    expect(screen.queryByTestId('journey-map-layer-photos-badge')).toBeNull();

    fireEvent.click(photos);
    expect(layers.toggle).toHaveBeenCalledWith('photos');
  });

  it('FE-JOURNEY-MAPLAYERCTL-002: a layer that could not be read carries the warning tone, a loading one the spinner', () => {
    render(
      <JourneyMapLayerControl
        layers={view([
          { layer: 'plan', count: 0, state: 'unavailable' },
          { layer: 'entries', count: 0, state: 'loading' },
        ])}
      />
    );

    expect(screen.getByTestId('journey-map-layer-plan-badge')).toHaveAttribute('data-tone', 'warning');
    expect(screen.getByTestId('journey-map-layer-entries')).toHaveAttribute('data-state', 'loading');
    expect(screen.getByRole('status')).toHaveTextContent('Plan');
  });

  it('FE-JOURNEY-MAPLAYERCTL-003: the key opens beside the switches and says a plan is no visit', () => {
    render(<JourneyMapLayerControl layers={view([{ layer: 'entries', count: 1, state: 'ready' }])} compact />);

    expect(screen.queryByText('Entries')).toBeNull();
    fireEvent.click(screen.getByTestId('journey-map-key-button'));
    expect(screen.getByTestId('journey-map-key')).toHaveTextContent('A planned place is no proof of a visit');
  });
});
