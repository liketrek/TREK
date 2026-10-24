// FE-PADDLE-DECIDE-001 to FE-PADDLE-DECIDE-016: the decision panel of one checklist entry (PAD-06).
// FE-PADDLE-DECIDE-017 to FE-PADDLE-DECIDE-020: the panel below a paddle object's map card, wired to the checklist.
import type { ComponentProps } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ObstacleDecision, ObstacleDecisionRecord, TourObstacleCheck, TourObstacleEntry } from '@trek/shared';

import { buildSettings } from '../../../../tests/helpers/factories';
import { earlierEntry, obstacleCheck, obstacleEntry } from '../../../../tests/helpers/paddleCheck';
import { fireEvent, render, screen, waitFor, within } from '../../../../tests/helpers/render';
import { seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import { ChecklistObstaclePanel, ObstacleDecisionPanel } from './ObstacleDecisionPanel';
import { formatCheckDate } from './paddleCheckModel';
import type { PaddleChecklist } from './usePaddleChecklist';

/** What the panel says, as shared/src/i18n/en/tours.ts words it. */
const SAYS = {
  bans: 'OpenStreetMap records a ban or private ground here. A decision does not lift it.',
  portageMissing: 'Choosing it plans no portage. Plan the carry on the map.',
  gone: 'Missing from the data is no proof that the obstacle is gone.',
  supLock: 'SUP: check a portage',
  supLockInfo:
    'For SUP, the German canoe federation and rescue organisations advise checking a permitted portage at locks rather than locking through. This is advice, not a ban everywhere, and local rules still apply.',
};

/** The four choices in the order the panel offers them. */
const CHOICES = ['Paddle through', 'Carry round', 'Go round', 'Not affected'];

const DECIDED_AT = '2026-09-20T10:00:00.000Z';
/** The day a decision was made, with the spaces the DOM queries read. */
const DECIDED_ON = formatCheckDate(DECIDED_AT, 'en').replace(/\s/g, ' ');

/** Paddling forbidden by the canoe tag. */
const BANNED: TourObstacleEntry['access'] = {
  value: 'no',
  source: 'canoe',
  condition: null,
  forbidden: true,
  private: false,
};

function record(decision: ObstacleDecision, note: string | null = null): ObstacleDecisionRecord {
  return { decision, note, decided_at: DECIDED_AT, decided_by: 1 };
}

/** The weir on the route, decided about. */
function decidedEntry(decision: ObstacleDecision = 'pass', note: string | null = null): TourObstacleEntry {
  return obstacleEntry({ status: 'decided', decision: record(decision, note) });
}

type PanelProps = ComponentProps<typeof ObstacleDecisionPanel>;

const onDecide = vi.fn<PanelProps['onDecide']>();
const onNote = vi.fn<PanelProps['onNote']>(() => Promise.resolve(true));
const onClear = vi.fn<PanelProps['onClear']>();
const onKeep = vi.fn<PanelProps['onKeep']>();
/** Trip member 1 is Anna; anyone else has left the trip. */
const memberName = (id: number | null) => (id === 1 ? 'Anna' : null);

/** The panel for an entry a paddler may decide about, nothing to move on to and no portage to plan. */
function panel(entry: TourObstacleEntry, props: Partial<PanelProps> = {}) {
  return (
    <ObstacleDecisionPanel
      entry={entry}
      canDecide
      saving={false}
      memberName={memberName}
      onDecide={onDecide}
      onNote={onNote}
      onClear={onClear}
      onKeep={onKeep}
      onNext={null}
      onPlanPortage={null}
      {...props}
    />
  );
}

const renderPanel = (entry: TourObstacleEntry, props: Partial<PanelProps> = {}) => render(panel(entry, props));

/** The notices the panel shows; it holds one at least. */
const notices = () => screen.getByTestId('obstacle-notices');

/**
 * A checklist as usePaddleChecklist hands it to the panel: ready, open to
 * decisions, nothing saving, entries found by their refs, every action a spy.
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
    memberName,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  seedStore(useSettingsStore, { settings: buildSettings() });
});

describe('ObstacleDecisionPanel', () => {
  it('FE-PADDLE-DECIDE-001: an open entry offers the four choices as one radio group named after it, none checked', () => {
    const { rerender } = renderPanel(obstacleEntry());

    const group = screen.getByRole('radiogroup', { name: 'Wehr Regendorf' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((radio) => radio.textContent)).toEqual(CHOICES);
    for (const radio of radios) {
      expect(radio).toHaveAttribute('aria-checked', 'false');
      expect(radio).toBeEnabled();
    }
    // Nothing decided yet: no note to add, nothing to remove, nothing to warn about.
    expect(screen.queryByRole('button', { name: 'Note' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove decision' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('obstacle-notices')).not.toBeInTheDocument();

    // An unnamed object names the group by its kind.
    rerender(panel(obstacleEntry({ name: null, kind: 'dam' })));
    expect(screen.getByRole('radiogroup', { name: 'Dam' })).toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-002: a choice decides; the decided one is filled and checked, and choosing it again sends nothing', () => {
    const { rerender } = renderPanel(obstacleEntry());

    fireEvent.click(screen.getByRole('radio', { name: 'Carry round' }));
    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith('portage');

    rerender(panel(decidedEntry('portage')));
    const chosen = screen.getByRole('radio', { name: 'Carry round' });
    expect(chosen).toHaveAttribute('aria-checked', 'true');
    expect(chosen).toHaveClass('bg-accent', 'text-accent-text');
    expect(screen.getByRole('radio', { name: 'Paddle through' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Paddle through' })).not.toHaveClass('bg-accent');

    fireEvent.click(chosen);
    expect(onDecide).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('radio', { name: 'Not affected' }));
    expect(onDecide).toHaveBeenLastCalledWith('not_affected');
  });

  it('FE-PADDLE-DECIDE-003: in review the earlier choice keeps a dashed ring, nothing is checked, the reason shows', () => {
    renderPanel(obstacleEntry({ status: 'review', changed: ['route'], decision: record('pass') }));

    // Named with its review state too, so it is told apart by more than its ring.
    const earlier = screen.getByRole('radio', { name: 'Paddle through, Check again' });
    expect(earlier).toHaveAttribute('aria-checked', 'false');
    expect(earlier).toHaveClass('border-dashed');
    expect(earlier).not.toHaveClass('bg-accent');
    for (const name of CHOICES.slice(1)) {
      expect(screen.getByRole('radio', { name })).not.toHaveClass('border-dashed');
    }
    expect(screen.getByTestId('obstacle-decision-panel')).toHaveTextContent('Route changed');

    // The earlier choice can be made again, against the route as it is now.
    fireEvent.click(earlier);
    expect(onDecide).toHaveBeenCalledWith('pass');
  });

  it('FE-PADDLE-DECIDE-004: a ban or private ground in the data stays a notice after every decision', () => {
    const { rerender } = renderPanel(obstacleEntry({ access: BANNED }));
    expect(within(notices()).getByText(SAYS.bans)).toBeInTheDocument();

    rerender(panel(obstacleEntry({ access: BANNED, status: 'decided', decision: record('pass') })));
    expect(within(notices()).getByText(SAYS.bans)).toBeInTheDocument();

    const privateGround = { ...BANNED, value: 'private', forbidden: false, private: true };
    rerender(panel(obstacleEntry({ access: privateGround, status: 'decided', decision: record('not_affected') })));
    expect(within(notices()).getByText(SAYS.bans)).toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-005: a lock advised for SUP says so, with the explanation behind an info dot', () => {
    const lock = { kind: 'lock' as const, name: 'Schleuse Regensburg' };
    const { rerender } = renderPanel(obstacleEntry({ ...lock, advice: 'sup_lock_portage' }));

    expect(within(notices()).getByText(SAYS.supLock)).toBeInTheDocument();
    expect(within(notices()).getByRole('button', { name: SAYS.supLock })).toHaveAccessibleDescription(SAYS.supLockInfo);

    rerender(panel(obstacleEntry(lock)));
    expect(screen.queryByTestId('obstacle-notices')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-006: carrying round with no portage planned yet says so and offers to plan it', () => {
    const onPlanPortage = vi.fn<() => void>();
    const todo = obstacleEntry({ status: 'todo', decision: record('portage') });
    const { rerender } = renderPanel(todo, { onPlanPortage });

    expect(within(notices()).getByText(SAYS.portageMissing)).toBeInTheDocument();
    fireEvent.click(within(notices()).getByRole('button', { name: 'Plan the portage' }));
    expect(onPlanPortage).toHaveBeenCalledTimes(1);

    // Without a way to plan it the notice stays, without the action.
    rerender(panel(todo));
    expect(within(notices()).getByText(SAYS.portageMissing)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Plan the portage' })).not.toBeInTheDocument();

    // Going round while the route still passes is no missing portage.
    rerender(panel(obstacleEntry({ status: 'todo', decision: record('reroute') }), { onPlanPortage }));
    expect(screen.queryByTestId('obstacle-notices')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-007: never more than two notices; the ban and the missing portage come before the SUP advice', () => {
    renderPanel(
      obstacleEntry({
        kind: 'lock',
        advice: 'sup_lock_portage',
        access: BANNED,
        status: 'todo',
        decision: record('portage'),
      }),
      { onPlanPortage: vi.fn<() => void>() }
    );

    const shown = notices();
    expect(within(shown).getByText(SAYS.bans)).toBeInTheDocument();
    expect(within(shown).getByText(SAYS.portageMissing)).toBeInTheDocument();
    expect(within(shown).queryByText(SAYS.supLock)).not.toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-008: the check on site the data records reads as a month, and as unknown when there is none', () => {
    const { rerender } = renderPanel(obstacleEntry({ local_check: '2025-06' }));

    const badge = screen.getByTestId('obstacle-on-site');
    expect(badge).toHaveTextContent('On site');
    expect(badge).toHaveTextContent(formatCheckDate('2025-06', 'en').replace(/\s/g, ' '));

    rerender(panel(obstacleEntry()));
    expect(screen.getByTestId('obstacle-on-site')).toHaveTextContent('unknown');
  });

  it('FE-PADDLE-DECIDE-009: a decision takes a note of two rows and at most 500 characters, saved trimmed', async () => {
    renderPanel(decidedEntry());

    fireEvent.click(screen.getByRole('button', { name: 'Note' }));
    const box = screen.getByRole('textbox', { name: 'Note' });
    expect(box).toHaveAttribute('rows', '2');
    expect(box).toHaveAttribute('maxlength', '500');
    expect(box).toHaveFocus();

    fireEvent.change(box, { target: { value: '  Links an der Bootsrutsche  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onNote).toHaveBeenCalledTimes(1);
    expect(onNote).toHaveBeenCalledWith('Links an der Bootsrutsche');
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
  });

  it('FE-PADDLE-DECIDE-021: a note whose save failed stays in the editor with its text', async () => {
    onNote.mockResolvedValueOnce(false);
    renderPanel(decidedEntry());
    fireEvent.click(screen.getByRole('button', { name: 'Note' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), { target: { value: 'Rechts umtragen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onNote).toHaveBeenCalledWith('Rechts umtragen'));
    await Promise.resolve();
    expect(screen.getByRole('textbox', { name: 'Note' })).toHaveValue('Rechts umtragen');
  });

  it('FE-PADDLE-DECIDE-010: a saved note reads clamped; Cancel and an unchanged save keep it, emptying it removes it', () => {
    renderPanel(decidedEntry('pass', 'Bootsrutsche am linken Ufer'));

    expect(screen.getByText('Bootsrutsche am linken Ufer')).toHaveClass('line-clamp-3');
    expect(screen.queryByRole('button', { name: 'Note' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const box = screen.getByRole('textbox', { name: 'Note' });
    expect(box).toHaveValue('Bootsrutsche am linken Ufer');
    fireEvent.change(box, { target: { value: 'Anders' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onNote).not.toHaveBeenCalled();
    expect(screen.getByText('Bootsrutsche am linken Ufer')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onNote).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onNote).toHaveBeenCalledWith(null);
  });

  it('FE-PADDLE-DECIDE-011: Escape in the note ends the edit and goes no further, so the map card around it stays open', () => {
    const parent = vi.fn<() => void>();
    const onDocument = vi.fn<(event: KeyboardEvent) => void>();
    document.addEventListener('keydown', onDocument);
    try {
      render(<div onKeyDown={parent}>{panel(decidedEntry())}</div>);

      fireEvent.click(screen.getByRole('button', { name: 'Note' }));
      const box = screen.getByRole('textbox', { name: 'Note' });
      // Any other key reaches the card and the page as always.
      fireEvent.keyDown(box, { key: 'a' });
      expect(parent).toHaveBeenCalledTimes(1);
      expect(onDocument).toHaveBeenCalledTimes(1);

      const delivered = fireEvent.keyDown(box, { key: 'Escape' });
      expect(delivered).toBe(false);
      expect(parent).toHaveBeenCalledTimes(1);
      expect(onDocument).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(onNote).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', onDocument);
    }
  });

  it('FE-PADDLE-DECIDE-012: the foot says who decided when, removes the decision and moves on to the next entry', () => {
    const onNext = vi.fn<() => void>();
    const { rerender } = renderPanel(decidedEntry(), { onNext });

    expect(screen.getByText(`Decided ${DECIDED_ON} by Anna`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove decision' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(onNext).toHaveBeenCalledTimes(1);

    // Someone who left the trip leaves the date alone; without a next entry there is no way on.
    rerender(panel(obstacleEntry({ status: 'decided', decision: { ...record('pass'), decided_by: 7 } })));
    expect(screen.getByText(`Decided ${DECIDED_ON}`)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();

    // An open entry moves on all the same.
    rerender(panel(obstacleEntry(), { onNext }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
    expect(screen.queryByText(/^Decided/)).not.toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-013: an object the data no longer holds offers keeping or removing its decision, no choices', () => {
    renderPanel(earlierEntry());

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.getByText(SAYS.gone)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep decision' }));
    expect(onKeep).toHaveBeenCalledTimes(1);
    // One way to remove it: the foot leaves it to the actions.
    fireEvent.click(screen.getByRole('button', { name: 'Remove decision' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByText(`Decided ${DECIDED_ON} by Anna`)).toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-014: an earlier decision the route no longer meets has no choices to make, yet can be removed', () => {
    renderPanel(earlierEntry({ status: 'off_route' }));

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(screen.queryByText(SAYS.gone)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Keep decision' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove decision' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-DECIDE-015: a viewer reads the panel: the choices, the note and removing are off, moving on is not', () => {
    const onNext = vi.fn<() => void>();
    renderPanel(decidedEntry('pass', 'Bootsrutsche'), { canDecide: false, onNext });

    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: 'Go round' }));
    expect(onDecide).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove decision' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('FE-PADDLE-DECIDE-016: while its change saves the choices wait, and a viewer cannot keep or remove a vanished one', () => {
    const { rerender } = renderPanel(obstacleEntry(), { saving: true });

    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
    expect(screen.getByTestId('obstacle-decision-panel')).toHaveAttribute('aria-busy', 'true');

    rerender(panel(earlierEntry(), { canDecide: false }));
    expect(screen.getByRole('button', { name: 'Keep decision' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove decision' })).toBeDisabled();
  });
});

describe('ChecklistObstaclePanel', () => {
  it('FE-PADDLE-DECIDE-017: shows nothing without a checklist or for an object it does not list, and stays while it reads again', () => {
    const { container, rerender } = render(<ChecklistObstaclePanel checklist={checklistOf()} featureRef="node/2" />);
    expect(container).toBeEmptyDOMElement();

    rerender(<ChecklistObstaclePanel checklist={checklistOf(null, { status: 'loading' })} featureRef="node/1" />);
    expect(container).toBeEmptyDOMElement();

    // Reading again keeps the panel open, locked, so a note being written is not lost.
    rerender(
      <ChecklistObstaclePanel
        checklist={checklistOf(obstacleCheck(), { status: 'loading', canDecide: false })}
        featureRef="node/1"
      />
    );
    expect(screen.getByTestId('obstacle-decision-panel')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Paddle through' })).toBeDisabled();

    rerender(<ChecklistObstaclePanel checklist={checklistOf()} featureRef="node/1" />);
    expect(screen.getByTestId('obstacle-decision-panel')).toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-018: decides, plans the portage, notes, removes and moves on through the checklist', async () => {
    const entry = obstacleEntry({ status: 'todo', decision: record('portage') });
    const following = obstacleEntry({ key: 'node/2', refs: ['node/2'], name: 'Wehr Pielenhofen', along_m: 3400 });
    const checklist = checklistOf(obstacleCheck({ entries: [entry, following] }), {
      nextOf: (item) => (item.key === entry.key ? following : null),
    });
    render(<ChecklistObstaclePanel checklist={checklist} featureRef="node/1" />);

    fireEvent.click(screen.getByRole('radio', { name: 'Go round' }));
    expect(checklist.decide).toHaveBeenCalledWith(entry, 'reroute');
    fireEvent.click(screen.getByRole('button', { name: 'Plan the portage' }));
    expect(checklist.planPortage).toHaveBeenCalledWith(entry);

    fireEvent.click(screen.getByRole('button', { name: 'Note' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Note' }), { target: { value: 'Rechts aussteigen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(checklist.setNote).toHaveBeenCalledWith(entry, 'Rechts aussteigen');

    fireEvent.click(screen.getByRole('button', { name: 'Remove decision' }));
    expect(checklist.clear).toHaveBeenCalledWith(entry);
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(checklist.next).toHaveBeenCalledWith(entry);
    expect(screen.getByText(`Decided ${DECIDED_ON} by Anna`)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
  });

  it('FE-PADDLE-DECIDE-022: someone who may not edit the tour is not offered to plan the portage', () => {
    const entry = obstacleEntry({ status: 'todo', decision: record('portage') });
    render(
      <ChecklistObstaclePanel
        checklist={checklistOf(obstacleCheck({ entries: [entry] }), { canPlanPortage: false, canDecide: false })}
        featureRef="node/1"
      />
    );
    expect(screen.queryByRole('button', { name: 'Plan the portage' })).not.toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-023: moving on keeps the focus in the panel when the next entry has no Next of its own', () => {
    const entry = obstacleEntry({ status: 'todo', decision: record('portage') });
    const following = obstacleEntry({ key: 'node/2', refs: ['node/2'], name: 'Wehr Pielenhofen', along_m: 3400 });
    const check = obstacleCheck({ entries: [entry, following] });
    let featureRef = 'node/1';
    const checklist = checklistOf(check, {
      nextOf: (item) => (item.key === entry.key ? following : null),
      next: vi.fn<PaddleChecklist['next']>(() => {
        featureRef = 'node/2';
      }),
    });
    const { rerender } = render(<ChecklistObstaclePanel checklist={checklist} featureRef={featureRef} />);
    const next = screen.getByRole('button', { name: 'Next' });
    next.focus();
    fireEvent.click(next);
    rerender(<ChecklistObstaclePanel checklist={checklist} featureRef={featureRef} />);
    expect(screen.getByTestId('obstacle-decision-panel')).toHaveFocus();
  });

  it('FE-PADDLE-DECIDE-019: a decision about an object the data no longer holds is kept through the checklist', () => {
    const gone = earlierEntry();
    const checklist = checklistOf(obstacleCheck({ entries: [obstacleEntry(), gone] }));
    render(<ChecklistObstaclePanel checklist={checklist} featureRef="node/9" />);

    fireEvent.click(screen.getByRole('button', { name: 'Keep decision' }));
    expect(checklist.keep).toHaveBeenCalledWith(gone);
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
  });

  it('FE-PADDLE-DECIDE-020: the entry whose change is saving waits, as every entry does when the checklist cannot decide', () => {
    const check = obstacleCheck({ entries: [obstacleEntry(), obstacleEntry({ key: 'node/2', refs: ['node/2'] })] });
    const { rerender } = render(
      <ChecklistObstaclePanel checklist={checklistOf(check, { savingKey: 'node/2' })} featureRef="node/1" />
    );
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeEnabled();

    rerender(<ChecklistObstaclePanel checklist={checklistOf(check, { savingKey: 'node/1' })} featureRef="node/1" />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();

    rerender(<ChecklistObstaclePanel checklist={checklistOf(check, { canDecide: false })} featureRef="node/1" />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });
});
