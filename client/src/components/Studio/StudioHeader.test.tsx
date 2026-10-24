import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { useStudioStore } from '../../store/studioStore';
import { StudioHeader } from './StudioHeader';
import type { Studio } from './StudioShell';
import type { StudioAssistant } from './useStudioAssistant';

/**
 * FE-STUDIO-HEAD-001 to FE-STUDIO-HEAD-007: the Studio's head band, with the
 * hook's answer stubbed to what the band reads.
 */

function studio(over: Partial<Studio> = {}): Studio {
  return {
    t: (key: string) => key,
    journey: { title: 'Japan 2026' },
    coverUrl: '/uploads/cover.jpg',
    saveState: { status: 'idle' },
    peers: [],
    canUndo: true,
    canRedo: false,
    canEdit: true,
    activeSpread: 0,
    doc: { spreads: [] },
    preset: 'square-210',
    page: { pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    canRelayoutSpread: true,
    undo: vi.fn(),
    redo: vi.fn(),
    close: vi.fn(),
    setPreset: vi.fn(),
    setPageSize: vi.fn(),
    setPageEdge: vi.fn(),
    relayoutCurrentSpread: vi.fn(),
    relayoutBook: vi.fn(),
    loadDoc: vi.fn(),
    acceptTheirs: vi.fn(),
    keepMine: vi.fn(),
    saveNow: vi.fn(),
    ...over,
  } as unknown as Studio;
}

const noAssistant = { available: false } as unknown as StudioAssistant;

function head(s = studio(), onExport = vi.fn()) {
  render(<StudioHeader s={s} onExport={onExport} assistant={noAssistant} />);
  return { s, onExport };
}

describe('StudioHeader', () => {
  it("FE-STUDIO-HEAD-001: names the journey under the Studio's mark, with its cover as the tile", () => {
    head();
    expect(screen.getByRole('heading', { name: 'Japan 2026' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'TREK Studio' })).toBeInTheDocument();
    expect(document.querySelector('.st-head-tile img')?.getAttribute('src')).toBe('/uploads/cover.jpg');
  });

  it('FE-STUDIO-HEAD-002: the round button closes the Studio, export hands over', () => {
    const { s, onExport } = head();
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.backToJourney' }));
    expect(s.close).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /journey.studio.export/ }));
    expect(onExport).toHaveBeenCalled();
  });

  it('FE-STUDIO-HEAD-003: undo runs, redo waits for something to redo, paste for something copied', () => {
    const { s } = head();
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.undo' }));
    expect(s.undo).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'journey.studio.redo' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'journey.studio.paste' })).toBeDisabled();
  });

  it('FE-STUDIO-HEAD-004: the format chip names the format and opens the list, a pick sets it', () => {
    const { s } = head();
    const chip = screen.getByRole('button', { name: 'journey.studio.format' });
    expect(chip).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(chip);
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    fireEvent.click(options[options.length - 1]);
    expect(s.setPreset).toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('FE-STUDIO-HEAD-005: a custom format reads its size, and Escape or a press outside closes the list', () => {
    head(
      studio({ preset: 'custom', page: { pageWidth: 180.4, pageHeight: 240, bleed: 3, safe: 5 } } as Partial<Studio>)
    );
    const chip = screen.getByRole('button', { name: 'journey.studio.format' });
    expect(chip).toHaveTextContent('180 × 240 mm');
    fireEvent.click(chip);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    fireEvent.click(chip);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('FE-STUDIO-HEAD-006: auto layout offers this spread and the whole book', () => {
    const { s } = head();
    fireEvent.click(screen.getByRole('button', { name: /journey.studio.autoLayout/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^journey\.studio\.relayoutSpread/ }));
    expect(s.relayoutCurrentSpread).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /journey.studio.autoLayout/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /^journey\.studio\.relayoutBook/ }));
    expect(s.relayoutBook).toHaveBeenCalled();
  });

  it('FE-STUDIO-HEAD-007: with something copied, paste puts it on the page on screen', () => {
    const paste = vi.fn();
    useStudioStore.setState({ clipboard: { elements: [] } as never, paste } as never);
    head(studio({ activeSpread: 2 } as Partial<Studio>));
    fireEvent.click(screen.getByRole('button', { name: 'journey.studio.paste' }));
    expect(paste).toHaveBeenCalledWith(2);
  });
});
