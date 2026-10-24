import { describe, expect, it, vi } from 'vitest';

import type { BookSpread, BookTextElement } from '@trek/shared';
import { bookTextElementSchema } from '@trek/shared';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { StudioTextEffects } from './StudioTextEffects';

/** The text inspector's effects: each switch arrives looking right, and each control sets one field. */

const t = (k: string) => k;

const text = (over: Record<string, unknown> = {}): BookTextElement =>
  bookTextElementSchema.parse({
    id: 't1',
    kind: 'text',
    frame: { x: 0, y: 0, w: 100, h: 40 },
    text: 'Lisbon',
    size: 72,
    color: '#1a1a1a',
    ...over,
  });

const spread = {
  id: 'sp',
  role: 'inner',
  background: null,
  parked: [],
  entryId: null,
  elements: [{ id: 'p1', kind: 'photo', photoId: 4 }],
} as unknown as BookSpread;

function mount(el: BookTextElement, photos = [{ photoId: 4 }, { photoId: 5 }]) {
  const set = vi.fn();
  const live = vi.fn();
  const view = render(<StudioTextEffects el={el} set={set} live={live} photos={photos} spread={spread} t={t} />);
  return { set, live, ...view };
}

/** The switch beside a label: the app's toggle, a button named by the label it carries. */
const toggle = (label: string) => screen.getByRole('button', { name: label });
/** A number field, named by its label, followed by its value and unit. */
const num = (label: string) => screen.getByRole('spinbutton', { name: (name) => name.startsWith(label) });
/** The case and placement group, folded on a text that uses none of it. */
const openPlacement = () => fireEvent.click(screen.getByRole('button', { name: 'journey.studio.fx.placement' }));

describe('case and placement', () => {
  it('folds away on a plain text and opens on one in small caps, set in the middle or fitted', () => {
    const plain = mount(text());
    expect(screen.getByRole('button', { name: 'journey.studio.fx.placement' }).getAttribute('aria-expanded')).toBe(
      'false'
    );
    expect(screen.queryByRole('radio', { name: 'journey.studio.fx.caseSmall' })).toBeNull();
    plain.unmount();
    for (const over of [{ transform: 'smallcaps' }, { vAlign: 'middle' }, { fit: 'shrink' }]) {
      const used = mount(text(over));
      expect(screen.getByRole('button', { name: 'journey.studio.fx.placement' }).getAttribute('aria-expanded')).toBe(
        'true'
      );
      used.unmount();
    }
  });

  it('sets the case and where the lines sit', () => {
    const { set } = mount(text());
    openPlacement();
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.fx.caseSmall' }));
    expect(set).toHaveBeenCalledWith({ transform: 'smallcaps' });
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.fx.middle' }));
    expect(set).toHaveBeenCalledWith({ vAlign: 'middle' });
  });

  it('shrinks to fit, and gives the chosen size back when fitting is turned off', () => {
    const on = mount(text());
    openPlacement();
    fireEvent.click(toggle('journey.studio.fx.fit'));
    expect(on.set).toHaveBeenCalledWith({ fit: 'shrink' });
    on.unmount();
    const off = mount(text({ fit: 'shrink', size: 40, fitMax: 72 }));
    expect(screen.getByText('journey.studio.fx.fitHint')).toBeTruthy();
    fireEvent.click(toggle('journey.studio.fx.fit'));
    expect(off.set).toHaveBeenCalledWith({ fit: 'none', size: 72 });
  });
});

describe('effects', () => {
  it('folds the effects away while a text has none, and opens them when it has one', () => {
    mount(text());
    expect(screen.queryByRole('button', { name: 'journey.studio.stroke' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /journey.studio.fx.effects/ }));
    expect(toggle('journey.studio.stroke')).toBeTruthy();
  });

  it('switches an outline, a shadow and a band on in a colour that stands out, and off again', () => {
    const { set } = mount(
      text({
        curve: null,
        outline: null,
        shadow: null,
        highlight: null,
        fillPaint: { type: 'solid', color: '#1a1a1a', alpha: 1 },
      })
    );
    fireEvent.click(toggle('journey.studio.stroke'));
    expect(set).toHaveBeenCalledWith({ outline: { color: '#ffffff', width: 1.27 } });
    fireEvent.click(toggle('journey.studio.fx.shadow'));
    expect(set).toHaveBeenCalledWith({ shadow: { dx: 2.03, dy: 2.03, color: '#ffffff', alpha: 1 } });
    fireEvent.click(toggle('journey.studio.fx.band'));
    expect(set).toHaveBeenCalledWith({ highlight: { color: '#ffffff', alpha: 1, padX: 6.35, padY: 1.52, radius: 0 } });
  });

  it('edits an outline that is on, and takes hollow letters back to colour with it', () => {
    const outline = { color: '#c2410c', width: 0.5 };
    const { set } = mount(text({ outline, fillPaint: { type: 'solid', color: '#1a1a1a', alpha: 0 } }));
    const width = num('journey.studio.strokeWidth');
    fireEvent.change(width, { target: { value: '1.5' } });
    fireEvent.blur(width);
    expect(set).toHaveBeenCalledWith({ outline: { ...outline, width: 1.5 } });
    fireEvent.click(toggle('journey.studio.stroke'));
    expect(set).toHaveBeenCalledWith({ outline: null, fillPaint: null });
  });

  it('edits a shadow and a band by their numbers', () => {
    const shadow = { dx: 1, dy: 1, color: '#111111', alpha: 1 };
    const highlight = { color: '#111111', alpha: 1, padX: 1, padY: 0.3, radius: 0 };
    const { set } = mount(text({ shadow, highlight }));
    const across = num('journey.studio.fx.across');
    fireEvent.change(across, { target: { value: '3' } });
    fireEvent.blur(across);
    expect(set).toHaveBeenCalledWith({ shadow: { ...shadow, dx: 3 } });
    const opacity = num('journey.studio.opacity');
    fireEvent.change(opacity, { target: { value: '40' } });
    fireEvent.blur(opacity);
    expect(set).toHaveBeenCalledWith({ shadow: { ...shadow, alpha: 0.4 } });
    const pad = num('journey.studio.fx.padDown');
    fireEvent.change(pad, { target: { value: '2' } });
    fireEvent.blur(pad);
    expect(set).toHaveBeenCalledWith({ highlight: { ...highlight, padY: 2 } });
  });

  it('bends the words on an arc or a circle and straightens them again', () => {
    const arc = mount(text({ outline: { color: '#111111', width: 0.2 } }));
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.fx.arc' }));
    expect(arc.set).toHaveBeenCalledWith({ curve: { type: 'arc', bend: 40, start: 0 } });
    arc.unmount();
    const curve = { type: 'circle' as const, bend: 40, start: 0 };
    const circle = mount(text({ curve }));
    const start = num('journey.studio.fx.start');
    fireEvent.change(start, { target: { value: '90' } });
    fireEvent.blur(start);
    expect(circle.set).toHaveBeenCalledWith({ curve: { ...curve, start: 90 } });
    expect(screen.getByText('journey.studio.fx.drawnHint')).toBeTruthy();
    expect(screen.getByText('journey.studio.fx.bandDrawn')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.fx.straight' }));
    expect(circle.set).toHaveBeenCalledWith({ curve: null });
  });
});

describe('the fill of the letters', () => {
  it('leaves hollow letters with an outline in their own colour', () => {
    const { set } = mount(text({ shadow: { dx: 1, dy: 1, color: '#111111' }, color: '#0f766e' }));
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.fx.hollow' }));
    expect(set).toHaveBeenCalledWith({
      fillPaint: { type: 'solid', color: '#0f766e', alpha: 0 },
      outline: { color: '#0f766e', width: 1.27 },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.colour' }));
    expect(set).toHaveBeenCalledWith({ fillPaint: null });
  });

  it('fills the letters with a photo of the page first, then lets another be picked, framed and zoomed', () => {
    const first = mount(text({ shadow: { dx: 1, dy: 1, color: '#111111' } }));
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.kind.photo' }));
    expect(first.set).toHaveBeenCalledWith({
      fillPaint: { type: 'photo', photoId: 4, focalX: 0.5, focalY: 0.5, zoom: 1 },
    });
    first.unmount();
    const fill = { type: 'photo' as const, photoId: 4, focalX: 0.5, focalY: 0.5, zoom: 1 };
    const { set } = mount(text({ fillPaint: fill }));
    const photos = screen.getAllByRole('radio', { name: 'journey.studio.fx.pickPhoto' });
    expect(photos).toHaveLength(2);
    expect(photos[0]?.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(photos[1] as HTMLElement);
    expect(set).toHaveBeenCalledWith({ fillPaint: { ...fill, photoId: 5 } });
    const zoom = num('journey.studio.fx.zoom');
    fireEvent.change(zoom, { target: { value: '150' } });
    fireEvent.blur(zoom);
    expect(set).toHaveBeenCalledWith({ fillPaint: { ...fill, zoom: 1.5 } });
    expect(screen.getByText('journey.studio.fx.focalHint')).toBeTruthy();
  });

  it('turns the letters into a gradient or a pattern from their own colour, edited as a shape is', () => {
    const plain = mount(text({ shadow: { dx: 1, dy: 1, color: '#111111' }, color: '#0f766e' }));
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.paint.gradient' }));
    const gradient = plain.set.mock.lastCall?.[0]?.fillPaint;
    expect(gradient?.type).toBe('linear');
    expect(gradient?.stops[0]?.color).toBe('#0f766e');
    fireEvent.click(screen.getByRole('radio', { name: 'journey.studio.paint.pattern' }));
    expect(plain.set.mock.lastCall?.[0]?.fillPaint?.type).toBe('pattern');
    plain.unmount();

    const patterned = {
      type: 'pattern' as const,
      pattern: 'dots' as const,
      fg: '#d62828',
      bg: '#ffffff',
      scale: 1,
      angle: 0,
    };
    mount(text({ fillPaint: patterned }));
    expect(screen.getByRole('radio', { name: 'journey.studio.paint.pattern' }).getAttribute('aria-checked')).toBe(
      'true'
    );
    // Only the pattern's own controls: the kind is picked in the row above, so the paint's tabs stay away.
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('says so, and offers no photo fill, when the journey has no photos', () => {
    mount(text({ shadow: { dx: 1, dy: 1, color: '#111111' } }), []);
    expect(screen.getByText('journey.studio.fx.noPhotos')).toBeTruthy();
    expect((screen.getByRole('radio', { name: 'journey.studio.kind.photo' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
