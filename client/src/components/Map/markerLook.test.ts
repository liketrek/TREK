import { describe, expect, it } from 'vitest';
import { placeMarkerFrame, placeMarkerLook, SELECTED_MARKER } from './markerLook';

describe('placeMarkerFrame', () => {
  it('MARKERLOOK-001: gives the selected pin the white border, blue ring and pulse class (#2991)', () => {
    expect(placeMarkerFrame(true, '#ff0000')).toEqual({
      borderColor: SELECTED_MARKER.border,
      shadow: SELECTED_MARKER.ring,
      className: SELECTED_MARKER.className,
    });
    expect(SELECTED_MARKER.ring).toContain('#0a84ff');
  });

  it('MARKERLOOK-002: keeps every other pin in its category colour, without the class', () => {
    const frame = placeMarkerFrame(false, '#ff0000');
    expect(frame.borderColor).toBe('#ff0000');
    expect(frame.className).toBe('');
    expect(frame.shadow).not.toContain('#0a84ff');
  });
});

describe('placeMarkerLook', () => {
  it('MARKERLOOK-003: draws a selected pin larger than a planned one, even when it was compact', () => {
    expect(placeMarkerLook({ _compact: true }, true).size).toBeGreaterThan(placeMarkerLook({}, false).size);
    expect(placeMarkerLook({ _compact: true }, false).showPhoto).toBe(false);
  });
});
