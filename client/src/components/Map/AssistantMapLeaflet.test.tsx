/**
 * FE-MAP-ASSIST-LEAFLET-001 to 003
 *
 * The assistant on the Leaflet map, against real Leaflet: ghosts outside the
 * clusters that only change a class on hover, a camera that frames with the
 * same scale limit as a day fit and skips the request it mounted with, and
 * the pop on a real pin.
 */
import L from 'leaflet';
import { MapContainer } from 'react-leaflet';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, render } from '../../../tests/helpers/render';
import { MAX_ZOOM_RASTER } from '../../utils/mapViewport';
import { AssistantMapLeaflet } from './AssistantMapLeaflet';
import type { AssistantCamera, AssistantMapProps } from './mapViewContract';

const PADDING = { top: 60, right: 40, bottom: 60, left: 40 };
const NO_PIN = () => null;

const sized = ['clientWidth', 'clientHeight'] as const;
const originals = new Map<string, PropertyDescriptor | undefined>();
beforeAll(() => {
  for (const key of sized) {
    originals.set(key, Object.getOwnPropertyDescriptor(HTMLElement.prototype, key));
    Object.defineProperty(HTMLElement.prototype, key, {
      configurable: true,
      get: () => (key === 'clientWidth' ? 1000 : 700),
    });
  }
});
afterAll(() => {
  for (const key of sized) {
    const original = originals.get(key);
    if (original) Object.defineProperty(HTMLElement.prototype, key, original);
    else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[key];
  }
});
afterEach(() => vi.restoreAllMocks());

function onMap(assistant: AssistantMapProps, markerEl: (id: number) => HTMLElement | null = NO_PIN) {
  return (
    <MapContainer center={[41.9, 12.5]} zoom={12} style={{ width: 1000, height: 700 }}>
      <AssistantMapLeaflet assistant={assistant} padding={PADDING} markerEl={markerEl} />
    </MapContainer>
  );
}

const GHOSTS = [{ id: 'c1', lat: 41.9, lng: 12.48, name: 'Pantheon' }];

describe('AssistantMapLeaflet', () => {
  it('FE-MAP-ASSIST-LEAFLET-001: a ghost stands on the map and is marked while its suggestion is hovered', () => {
    const onHover = vi.fn();
    const view = render(onMap({ assistantGhosts: GHOSTS, assistantHoveredId: null, onAssistantGhostHover: onHover }));
    const ghost = view.container.querySelector<HTMLElement>('.trek-ghost');
    expect(ghost?.getAttribute('aria-label')).toBe('Pantheon');
    ghost?.dispatchEvent(new Event('pointerenter'));
    expect(onHover).toHaveBeenCalledWith('c1');

    view.rerender(onMap({ assistantGhosts: GHOSTS, assistantHoveredId: 'c1', onAssistantGhostHover: onHover }));
    expect(view.container.querySelectorAll('.trek-ghost')).toHaveLength(1);
    expect(view.container.querySelector('.trek-ghost')).toBe(ghost);
    expect(ghost?.classList.contains('is-hot')).toBe(true);
  });

  it('FE-MAP-ASSIST-LEAFLET-002: the camera skips the request it mounted with and frames a new one', () => {
    const fit = vi.spyOn(L.Map.prototype, 'fitBounds');
    const cam = (key: string): AssistantCamera => ({
      key,
      points: [
        [41.8, 12.4],
        [42, 12.6],
      ],
      mode: 'fit',
      animate: false,
      auto: false,
      cover: { side: 'left', px: 400 },
    });
    const view = render(onMap({ assistantCamera: cam('1') }));
    expect(fit).not.toHaveBeenCalled();

    view.rerender(onMap({ assistantCamera: cam('2') }));
    expect(fit).toHaveBeenCalledOnce();
    expect(fit.mock.calls[0]?.[1]).toMatchObject({
      paddingTopLeft: [400, 60],
      paddingBottomRight: [40, 60],
      maxZoom: MAX_ZOOM_RASTER,
      animate: false,
    });
  });

  it('FE-MAP-ASSIST-LEAFLET-003: a place that just arrived pops on its own pin', async () => {
    const pin = document.createElement('div');
    pin.appendChild(document.createElement('div'));
    render(onMap({ poppedPlaceIds: [5] }, (id) => (id === 5 ? pin : null)));
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    });
    expect(pin.classList.contains('trek-place-pop')).toBe(true);
  });
});
