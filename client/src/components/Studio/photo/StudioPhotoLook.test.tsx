import { PHOTO_DUOTONES, PHOTO_LOOK_STARTS, bookPhotoElementSchema, type BookPhotoElement } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cleanup, fireEvent, render, screen } from '../../../../tests/helpers/render';
import { PhotoCropExtras, PhotoLookSections } from './StudioPhotoLook';

/**
 * The inspector rows of the photo look: what each control writes, that a part
 * turned off is left out of the document, and the print resolution beside
 * the crop with its warning.
 */

const pixels = vi.hoisted(() => ({ value: null as { width: number; height: number } | null }));
vi.mock('./usePhotoPixels', () => ({ usePhotoPixels: () => pixels.value }));

const t = (k: string, params?: Record<string, string | number>) =>
  params ? `${k} ${Object.values(params).join(' ')}` : k;

const photo = (over: Record<string, unknown> = {}): BookPhotoElement =>
  bookPhotoElementSchema.parse({ id: 'p1', kind: 'photo', frame: { x: 0, y: 0, w: 80, h: 60 }, photoId: 7, ...over });

function mount(ui: 'crop' | 'look', el: BookPhotoElement) {
  const set = vi.fn();
  const live = vi.fn();
  const View = ui === 'crop' ? PhotoCropExtras : PhotoLookSections;
  render(<View el={el} set={set} live={live} t={t} />);
  return { set, live };
}

beforeEach(() => {
  pixels.value = null;
});

describe('beside the crop', () => {
  it('FE-STUDIO-LOOKUI-001: zooms live while dragging and commits once, and goes back to no zoom at 100%', () => {
    const { set, live } = mount('crop', photo());
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '1.5' } });
    expect(live).toHaveBeenCalledWith({ zoom: 1.5 });
    expect(set).not.toHaveBeenCalled();
    fireEvent.pointerUp(slider);
    expect(set).toHaveBeenCalledWith({ zoom: 1.5 });
    // A zoomed picture taken back to 100 % leaves the zoom out of the document.
    cleanup();
    const zoomed = mount('crop', photo({ zoom: 1.5 }));
    const back = screen.getByRole('slider');
    fireEvent.change(back, { target: { value: '1' } });
    fireEvent.blur(back);
    expect(zoomed.set).toHaveBeenLastCalledWith({ zoom: undefined });
  });

  it('FE-STUDIO-LOOKUI-002: mirrors the picture and takes the mirror away again', () => {
    const plain = mount('crop', photo());
    fireEvent.click(screen.getByRole('button', { name: /journey.studio.photo.flip/ }));
    expect(plain.set).toHaveBeenCalledWith({ flipX: true });
  });

  it('FE-STUDIO-LOOKUI-003: takes a mirrored picture back to as shot', () => {
    const mirrored = mount('crop', photo({ flipX: true }));
    const button = screen.getByRole('button', { name: /journey.studio.photo.flip/ });
    expect(button.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(button);
    expect(mirrored.set).toHaveBeenCalledWith({ flipX: undefined });
  });

  it('FE-STUDIO-LOOKUI-004: shows the print resolution once the original is measured, and warns under 200 dpi', () => {
    pixels.value = { width: 4000, height: 3000 };
    mount('crop', photo());
    expect(screen.getByText('journey.studio.photo.dpi 1270')).toBeTruthy();
    expect(screen.queryByText(/journey.studio.photo.dpiLow/)).toBeNull();
  });

  it('FE-STUDIO-LOOKUI-005: warns when the zoomed picture prints soft', () => {
    pixels.value = { width: 800, height: 600 };
    mount('crop', photo({ zoom: 2 }));
    expect(screen.getByText('journey.studio.photo.dpi 127')).toBeTruthy();
    expect(screen.getByText('journey.studio.photo.dpiLow 200')).toBeTruthy();
    // The slider's own readout is an output, a status too; the warning is the one marked low.
    const warning = screen.getAllByRole('status').find((el) => el.classList.contains('st-photo-dpi'));
    expect(warning?.className).toContain('is-low');
  });

  it('FE-STUDIO-LOOKUI-006: shows nothing for an empty frame', () => {
    pixels.value = { width: 4000, height: 3000 };
    mount('crop', photo({ photoId: null }));
    expect(screen.queryByRole('slider')).toBeNull();
  });
});

describe('the look sections', () => {
  it('FE-STUDIO-LOOKUI-007: turns a border on with the print border and off by leaving it out', () => {
    const off = mount('look', photo());
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.edges' }));
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.border', pressed: false }));
    expect(off.set).toHaveBeenCalledWith({ border: { ...PHOTO_LOOK_STARTS.border } });
  });

  it('FE-STUDIO-LOOKUI-008: edits a border that is on, and removes it', () => {
    const { set } = mount('look', photo({ border: { width: 4, color: '#ffffff' } }));
    const width = screen.getByRole('spinbutton', { name: /journey.studio.photo.width/ });
    fireEvent.change(width, { target: { value: '6' } });
    fireEvent.blur(width);
    expect(set).toHaveBeenCalledWith({ border: { width: 6, color: '#ffffff' } });
    fireEvent.click(screen.getByRole('button', { name: '#c2410c' }));
    expect(set).toHaveBeenCalledWith({ border: { width: 4, color: '#c2410c' } });
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.border', pressed: true }));
    expect(set).toHaveBeenLastCalledWith({ border: undefined });
  });

  it('FE-STUDIO-LOOKUI-009: sets how far a hard shadow falls and how strong it is', () => {
    const shadow = { dx: 2, dy: 2, color: '#1a1a1a', alpha: 0.35 };
    const { set, live } = mount('look', photo({ shadow }));
    const across = screen.getByRole('spinbutton', { name: /journey.studio.photo.dx/ });
    fireEvent.change(across, { target: { value: '-3' } });
    fireEvent.blur(across);
    expect(set).toHaveBeenCalledWith({ shadow: { ...shadow, dx: -3 } });
    const strength = screen.getByRole('slider', { name: /journey.studio.opacity/ });
    fireEvent.change(strength, { target: { value: '0.6' } });
    expect(live).toHaveBeenCalledWith({ shadow: { ...shadow, alpha: 0.6 } });
    fireEvent.keyUp(strength);
    expect(set).toHaveBeenLastCalledWith({ shadow: { ...shadow, alpha: 0.6 } });
  });

  it('FE-STUDIO-LOOKUI-010: turns the shadow and the cutout on from their starting values', () => {
    const { set } = mount('look', photo());
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.edges' }));
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.shadow', pressed: false }));
    expect(set).toHaveBeenCalledWith({ shadow: { ...PHOTO_LOOK_STARTS.shadow } });
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.cutout', pressed: false }));
    expect(set).toHaveBeenCalledWith({ cutout: { ...PHOTO_LOOK_STARTS.cutout } });
  });

  it('FE-STUDIO-LOOKUI-011: adjusts one value at a time, says it prints as a raster, and resets', () => {
    const { set } = mount('look', photo({ adjust: { contrast: 0.2 } }));
    expect(screen.getAllByText('journey.studio.photo.rasterHint').length).toBeGreaterThan(0);
    const brightness = screen.getByRole('slider', { name: /journey.studio.photo.brightness/ });
    fireEvent.change(brightness, { target: { value: '0.3' } });
    fireEvent.pointerUp(brightness);
    expect(set).toHaveBeenCalledWith({ adjust: { brightness: 0.3, contrast: 0.2, saturation: 0, warmth: 0 } });
    const contrast = screen.getByRole('slider', { name: /journey.studio.photo.contrast/ });
    fireEvent.change(contrast, { target: { value: '0' } });
    fireEvent.pointerUp(contrast);
    expect(set).toHaveBeenLastCalledWith({ adjust: undefined });
    fireEvent.click(screen.getByRole('button', { name: /journey.studio.photo.reset/ }));
    expect(set).toHaveBeenLastCalledWith({ adjust: undefined });
  });

  it('FE-STUDIO-LOOKUI-012: picks a ready duotone pair and the inks by hand', () => {
    const { set } = mount('look', photo({ duotone: { ...PHOTO_DUOTONES[0] } }));
    const pairs = screen.getAllByRole('radio');
    expect(pairs).toHaveLength(PHOTO_DUOTONES.length);
    expect(pairs[0]?.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(pairs[2] as HTMLElement);
    expect(set).toHaveBeenCalledWith({ duotone: { ...PHOTO_DUOTONES[2] } });
    fireEvent.click(screen.getAllByRole('button', { name: '#9f1239' })[0] as HTMLElement);
    expect(set).toHaveBeenLastCalledWith({ duotone: { ...PHOTO_DUOTONES[0], dark: '#9f1239' } });
  });

  it('FE-STUDIO-LOOKUI-013: turns the duotone on and off', () => {
    const { set } = mount('look', photo());
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.duotone', expanded: false }));
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.photo.duotone', pressed: false }));
    expect(set).toHaveBeenCalledWith({ duotone: { ...PHOTO_LOOK_STARTS.duotone } });
  });
});
