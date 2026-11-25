/**
 * The credit starts as the little (i), not as a ribbon across the map.
 *
 * Both engines collapse their attribution below 640px, and both then open it
 * anyway and wait for a drag before tucking it away. On a phone, where the map IS
 * the screen, that means the first thing anybody sees is a two-line grey band
 * over the bottom of it. Dragging is exactly what maplibre does on its own
 * `drag` handler; this only starts where that would have ended up, so the credit
 * is one tap away and nothing about it is removed.
 */
export function tuckAttributionOnIdle(map: object, container: HTMLElement | null): void {
  const events = map as unknown as { once(event: string, handler: () => void): unknown };
  events.once('idle', () => {
    const attrib =
      container?.querySelector('.maplibregl-ctrl-attrib.maplibregl-compact-show') ??
      container?.querySelector('.mapboxgl-ctrl-attrib.mapboxgl-compact-show');
    attrib?.classList.remove('maplibregl-compact-show', 'mapboxgl-compact-show');
    attrib?.removeAttribute('open');
  });
}
