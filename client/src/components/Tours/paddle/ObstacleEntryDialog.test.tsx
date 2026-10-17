// FE-PADDLE-ENTRY-DIALOG-001 to FE-PADDLE-ENTRY-DIALOG-007: the dialog of a checklist entry the map holds no card for.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TourObstacleCheck, TourObstacleEntry } from '@trek/shared';

import { buildSettings } from '../../../../tests/helpers/factories';
import { earlierEntry, obstacleCheck, obstacleEntry } from '../../../../tests/helpers/paddleCheck';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import { ObstacleEntryDialog } from './ObstacleEntryDialog';
import type { PaddleChecklist } from './usePaddleChecklist';

const OSM = 'View in OpenStreetMap';

/**
 * A checklist as usePaddleChecklist hands it to the dialog: ready, open to
 * decisions, no dialog open unless told, every action a spy.
 */
function checklistOf(
  check: TourObstacleCheck | null = obstacleCheck(),
  overrides: Partial<PaddleChecklist> = {}
): PaddleChecklist {
  return {
    status: 'ready',
    tour: null,
    check,
    summary: null,
    stale: false,
    dirty: false,
    canDecide: true,
    canPlanPortage: true,
    savingKey: null,
    selectedKey: null,
    dialogKey: null,
    entryForRef: (ref) => check?.entries.find((entry) => entry.refs.includes(ref)) ?? null,
    select: vi.fn<PaddleChecklist['select']>(),
    selectOwn: vi.fn<PaddleChecklist['selectOwn']>(),
    closeDialog: vi.fn<PaddleChecklist['closeDialog']>(),
    nextOf: () => null,
    next: vi.fn<PaddleChecklist['next']>(),
    planPortage: vi.fn<PaddleChecklist['planPortage']>(),
    decide: vi.fn<PaddleChecklist['decide']>(() => Promise.resolve(true)),
    setNote: vi.fn<PaddleChecklist['setNote']>(() => Promise.resolve(true)),
    clear: vi.fn<PaddleChecklist['clear']>(() => Promise.resolve(true)),
    keep: vi.fn<PaddleChecklist['keep']>(() => Promise.resolve(true)),
    memberName: (id) => (id === 1 ? 'Anna' : null),
    ...overrides,
  };
}

/** The dialog opened for an entry the way the checklist opens it: by its key. */
function openFor(entry: TourObstacleEntry): PaddleChecklist {
  const checklist = checklistOf(obstacleCheck({ entries: [entry] }), { dialogKey: entry.key });
  render(<ObstacleEntryDialog checklist={checklist} />);
  return checklist;
}

/** The head band of the dialog, apart from the panel in its body. */
function headerOf(dialog: HTMLElement): HTMLElement {
  const header = dialog.querySelector('header');
  if (!header) throw new Error('the dialog has no head band');
  return header;
}

beforeEach(() => {
  vi.clearAllMocks();
  // No distance unit chosen: the dialog reads metric.
  seedStore(useSettingsStore, { settings: buildSettings() });
});

describe('ObstacleEntryDialog', () => {
  it('FE-PADDLE-ENTRY-DIALOG-001: stays closed without a dialog key, for a key the checklist lacks and without a checklist', () => {
    const { rerender } = render(<ObstacleEntryDialog checklist={checklistOf()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<ObstacleEntryDialog checklist={checklistOf(obstacleCheck(), { dialogKey: 'node/404' })} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<ObstacleEntryDialog checklist={checklistOf(null, { dialogKey: 'node/1' })} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-ENTRY-DIALOG-002: names the obstacle and its kind, how far along the route it lies, and links to OSM', () => {
    openFor(obstacleEntry());

    const header = headerOf(screen.getByRole('dialog', { name: 'Wehr Regendorf' }));
    expect(header).toHaveTextContent('Weir');
    expect(header).toHaveTextContent('1.2 km');
    const link = within(header).getByRole('link', { name: OSM });
    expect(link).toHaveAttribute('href', 'https://www.openstreetmap.org/node/1');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noreferrer');
  });

  it('FE-PADDLE-ENTRY-DIALOG-003: its body is the decision panel, wired to the checklist', () => {
    const entry = obstacleEntry();
    const checklist = openFor(entry);

    const dialog = screen.getByRole('dialog', { name: 'Wehr Regendorf' });
    expect(within(dialog).getByTestId('obstacle-decision-panel')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('radio', { name: 'Carry round' }));
    expect(checklist.decide).toHaveBeenCalledWith(entry, 'portage');
  });

  it('FE-PADDLE-ENTRY-DIALOG-004: an object the data no longer holds gives no distance and offers keeping its decision', () => {
    const gone = earlierEntry();
    const checklist = openFor(gone);

    const dialog = screen.getByRole('dialog', { name: 'Alte Sohlschwelle' });
    const header = headerOf(dialog);
    expect(header).not.toHaveTextContent('km');
    expect(within(header).getByRole('link', { name: OSM })).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/node/9'
    );
    expect(within(dialog).queryByRole('radiogroup')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Keep decision' }));
    expect(checklist.keep).toHaveBeenCalledWith(gone);
  });

  it('FE-PADDLE-ENTRY-DIALOG-005: an unnamed obstacle is titled by its kind and links its nearest object', () => {
    openFor(obstacleEntry({ key: 'lock:way/42', refs: ['way/42', 'way/43'], kind: 'lock', name: null, along_m: 800 }));

    const header = headerOf(screen.getByRole('dialog', { name: 'Lock' }));
    expect(within(header).getByRole('heading', { name: 'Lock' })).toBeInTheDocument();
    expect(header).toHaveTextContent('800 m');
    expect(within(header).getByRole('link', { name: OSM })).toHaveAttribute(
      'href',
      'https://www.openstreetmap.org/way/42'
    );
  });

  it('FE-PADDLE-ENTRY-DIALOG-006: the distance follows the chosen unit', () => {
    seedStore(useSettingsStore, { settings: buildSettings({ distance_unit: 'imperial' }) });
    openFor(obstacleEntry());

    expect(headerOf(screen.getByRole('dialog', { name: 'Wehr Regendorf' }))).toHaveTextContent('0.7 mi');
  });

  it('FE-PADDLE-ENTRY-DIALOG-007: the close button and Escape close it, while Escape in the note only ends the note', () => {
    const decided = obstacleEntry({
      status: 'decided',
      decision: { decision: 'pass', note: null, decided_at: '2026-09-20T10:00:00.000Z', decided_by: 1 },
    });
    const checklist = openFor(decided);
    const dialog = screen.getByRole('dialog', { name: 'Wehr Regendorf' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'Note' }));
    fireEvent.keyDown(within(dialog).getByRole('textbox', { name: 'Note' }), { key: 'Escape' });
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
    expect(checklist.closeDialog).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(checklist.closeDialog).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(checklist.closeDialog).toHaveBeenCalledTimes(2);
  });
});
