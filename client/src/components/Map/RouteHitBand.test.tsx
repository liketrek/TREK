import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RouteHitBand } from './RouteHitBand';

// jsdom cannot reproduce Leaflet's event propagation, so the mock surfaces the
// option that governs it and hands the click on with a position.
vi.mock('react-leaflet', () => ({
  Polyline: ({
    eventHandlers,
    bubblingMouseEvents,
  }: {
    eventHandlers?: { click?: (e: unknown) => void };
    bubblingMouseEvents?: boolean;
  }) => (
    <div
      data-testid="band"
      data-bubbling={String(bubblingMouseEvents)}
      onClick={() =>
        eventHandlers?.click?.({ latlng: { lat: 46.58, lng: 11.75 }, originalEvent: new MouseEvent('click') })
      }
    />
  ),
}));

describe('RouteHitBand', () => {
  it('keeps its click from the map, which would add a point at the end of the tour', () => {
    render(
      <RouteHitBand
        positions={[
          [46.5, 11.7],
          [46.6, 11.8],
        ]}
        onRouteClick={vi.fn()}
      />
    );
    expect(screen.getByTestId('band')).toHaveAttribute('data-bubbling', 'false');
  });

  it('hands the clicked position to the route', () => {
    const onRouteClick = vi.fn();
    render(
      <RouteHitBand
        positions={[
          [46.5, 11.7],
          [46.6, 11.8],
        ]}
        onRouteClick={onRouteClick}
      />
    );
    fireEvent.click(screen.getByTestId('band'));
    expect(onRouteClick).toHaveBeenCalledWith(46.58, 11.75);
  });
});
