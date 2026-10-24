import { act, render } from '@testing-library/react';
import { MAX_SPREAD_ELEMENTS, type BookDocument, type BookElement, type BookSpread } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const toast = vi.hoisted(() => ({ warning: vi.fn() }));
vi.mock('../../../src/components/shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../../src/i18n', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

import { StudioNotices } from '../../../src/components/Studio/StudioNotices';
import { useStudioStore } from '../../../src/store/studioStore';

/**
 * FE-STUDIO-FULL-001 to FE-STUDIO-FULL-004: a page that already holds
 * MAX_SPREAD_ELEMENTS takes nothing more, and the Studio says so instead of
 * swallowing the click.
 */

const el = (id: string): BookElement =>
  ({
    id,
    kind: 'shape',
    frame: { x: 0, y: 0, w: 10, h: 10 },
    rotation: 0,
    opacity: 1,
    locked: false,
    shape: 'rect',
    fill: '#000000',
    gradient: 'none',
    stroke: null,
    strokeWidth: 0,
    strokeStyle: 'solid',
    radius: 0,
  }) as BookElement;

const spread = (id: string, elements: BookElement[]): BookSpread => ({
  id,
  role: 'inner',
  background: null,
  elements,
  parked: [],
  entryId: null,
});

const book = (...spreads: BookSpread[]): BookDocument =>
  ({
    version: 1,
    title: 'T',
    page: { preset: 'square-210', pageWidth: 210, pageHeight: 210, bleed: 3, safe: 5 },
    spreads,
  }) as BookDocument;

const full = () => Array.from({ length: MAX_SPREAD_ELEMENTS }, (_, i) => el(`f${i}`));
const store = () => useStudioStore.getState();

beforeEach(() => {
  store().load(book(spread('full', full()), spread('room', [el('a')])));
  useStudioStore.setState({ refusedFull: 0, clipboard: null });
});

describe('a full page', () => {
  it('FE-STUDIO-FULL-001: refuses one more element and counts the refusal', () => {
    expect(store().addElement(0, el('extra'))).toBe(false);
    expect(store().doc?.spreads[0]?.elements).toHaveLength(MAX_SPREAD_ELEMENTS);
    expect(store().refusedFull).toBe(1);
    expect(store().addElement(1, el('fits'))).toBe(true);
    expect(store().refusedFull).toBe(1);
  });

  it('FE-STUDIO-FULL-002: a paste onto it is refused and counted', () => {
    useStudioStore.setState({ clipboard: { fromSpreadId: 'room', elements: [el('a')] } });
    store().paste(0);
    expect(store().doc?.spreads[0]?.elements).toHaveLength(MAX_SPREAD_ELEMENTS);
    expect(store().refusedFull).toBe(1);
  });

  it('FE-STUDIO-FULL-003: a duplicate on it is refused and counted', () => {
    store().duplicate(0, ['f0']);
    expect(store().doc?.spreads[0]?.elements).toHaveLength(MAX_SPREAD_ELEMENTS);
    expect(store().refusedFull).toBe(1);
  });

  it('FE-STUDIO-FULL-004: the Studio says it once per refusal', () => {
    toast.warning.mockClear();
    render(<StudioNotices />);
    expect(toast.warning).not.toHaveBeenCalled();
    act(() => store().refuseFull());
    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenLastCalledWith('journey.studio.pageFull');
    act(() => store().refuseFull());
    expect(toast.warning).toHaveBeenCalledTimes(2);
  });
});
