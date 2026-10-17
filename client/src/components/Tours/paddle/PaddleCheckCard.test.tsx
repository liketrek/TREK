// FE-PADDLE-CHECKCARD-001 to FE-PADDLE-CHECKCARD-017: the checklist card of a paddle tour (PAD-06) in the planner
// rail, its state notices, its rows in route order and the fold of earlier decisions.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PaddleAccess, PaddleCheck, TourObstacleEntry } from '@trek/shared';

import { buildSettings } from '../../../../tests/helpers/factories';
import {
  earlierEntry,
  obstacleCheck,
  obstacleEntry,
  ownPortage,
  paddleBench,
} from '../../../../tests/helpers/paddleCheck';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { seedStore } from '../../../../tests/helpers/store';
import { useSettingsStore } from '../../../store/settingsStore';
import { PaddleCheckCard } from './PaddleCheckCard';
import { formatCheckDate } from './paddleCheckModel';
import type { PaddleChecklist } from './usePaddleChecklist';

// The badges, the entry dialog and the data notice have suites of their own; here they show what the card hands them.
vi.mock('./PaddleCheckBadges', () => ({
  ChecklistGlyph: ({ kind, dashed = false }: { kind: string; dashed?: boolean; size?: number }) => (
    <span data-testid="checklist-glyph" data-kind={kind} data-dashed={String(dashed)} />
  ),
  ObstacleStatusBadges: ({ entry }: { entry: TourObstacleEntry }) => <span>status {entry.status}</span>,
  ObstacleAccessBadge: ({ access }: { access: PaddleAccess }) =>
    access.forbidden || access.private ? <span>access {access.value}</span> : null,
  PaddleCheckPill: ({ check }: { check: PaddleCheck }) => (
    <span data-testid="paddle-check-pill">{check.open} open</span>
  ),
  PaddleCheckDataLine: ({ check }: { check: PaddleCheck }) => <span data-testid="paddle-check-data">{check.data}</span>,
}));
vi.mock('./ObstacleEntryDialog', () => ({
  ObstacleEntryDialog: ({ checklist }: { checklist: PaddleChecklist }) => (
    <div role="dialog" aria-label="Obstacle entry">
      {checklist.dialogKey}
    </div>
  ),
}));
vi.mock('./PaddleObstacleNotice', () => ({ PaddleObstacleNotice: () => <p>What TREK knows about the water</p> }));

/** The line the data notice stub shows. */
const OBSTACLE_NOTICE = 'What TREK knows about the water';

/** The words as shared/src/i18n/en/tours.ts has them. */
const SAYS = {
  title: 'Checklist',
  saveFirst: 'Save the tour to check it.',
  loading: 'Loading the obstacles along the route …',
  offlineEmpty: 'The checklist loads once you are online.',
  error: 'The obstacle data could not be loaded. Check the water yourself.',
  unsaved: 'Unsaved changes. The list shows the saved route.',
  none: 'No obstacle data for this area. Check weirs, locks and portages here yourself.',
  dateUnknown: 'an unknown date',
  notClearance: 'A checklist is no safety or legal clearance.',
  earlier: 'Earlier decisions',
  own: 'Own',
  ownInfo: 'Your own plan, not a fact from a data source.',
  near: 'Near the route',
  supLock: 'SUP: check a portage',
  privateWay: 'Private way',
  carry: 'Carrying',
  bypassed: 'Carried round, the portage counts',
};

const staleLine = (time: string): string => `As of ${time}. Updates once online.`;
const coveredEmptyLine = (date: string): string =>
  `No known obstacles along the route (OpenStreetMap as of ${date}). Check the water yourself all the same.`;

/** A date as the card writes it, with the spaces the DOM queries read. */
const dateOf = (value: string): string => formatCheckDate(value, 'en').replace(/\s/g, ' ');

/** The weir of the fixtures: on the route at 1.2 km, open. */
const WEIR = obstacleEntry();
/** A weir further on that OpenStreetMap closes to canoes. */
const BANNED_WEIR = obstacleEntry({
  key: 'way/3',
  refs: ['way/3'],
  name: 'Wehr Kallmünz',
  along_m: 2500,
  access: { value: 'no', source: 'canoe', condition: null, forbidden: true, private: false },
});
/** An unnamed lock beside the route, decided already, where SUP paddlers are advised to carry round. */
const NEAR_LOCK = obstacleEntry({
  key: 'lock:node/2',
  refs: ['node/2', 'node/3'],
  kind: 'lock',
  name: null,
  relation: 'near',
  along_m: 3400,
  distance_m: 40,
  advice: 'sup_lock_portage',
  status: 'decided',
  decision: { decision: 'portage', note: null, decided_at: '2026-10-10T09:00:00.000Z', decided_by: 1 },
});
/** The paddler's own portage round the first weir. */
const OWN_PORTAGE = ownPortage({ from_m: 1100, to_m: 1250 });
/** A lock the paddler marked and locks through on a SUP, so the advice to check a portage stands. */
const ADVISED_LOCK = ownPortage({
  kind: 'lock',
  index: 4,
  from_m: 5000,
  to_m: 5000,
  covers: [],
  advice: 'sup_lock_portage',
});
/** A lock the paddler marked that a portage carries round; the server gives it no advice. */
const BYPASSED_LOCK = ownPortage({ kind: 'lock', index: 5, from_m: 5600, to_m: 5600, covers: [], bypassed: true });
/** All of it out of route order, as the server may list it. */
const ROUTE = obstacleCheck({ entries: [NEAR_LOCK, WEIR, BANNED_WEIR], own: [ADVISED_LOCK, OWN_PORTAGE] });
/** The weir, and an earlier decision about a sill the route no longer meets. */
const GONE = earlierEntry({ status: 'off_route' });
const GONE_NAME = 'Alte Sohlschwelle';
const WITH_EARLIER = obstacleCheck({ entries: [WEIR, GONE] });
/** The weir, and a decision about a sill the complete data no longer holds: it counts, so it stays in view. */
const VANISHED = earlierEntry({ key: 'node/8', refs: ['node/8'], name: 'Verschwundenes Wehr' });

/** What usePaddleChecklist hands the card: a ready list matching the saved route, nothing selected, every action a spy. */
function checklistOf(overrides: Partial<PaddleChecklist> = {}): PaddleChecklist {
  return {
    status: 'ready',
    tour: null,
    check: obstacleCheck(),
    summary: paddleBench(),
    stale: false,
    dirty: false,
    canDecide: true,
    canPlanPortage: true,
    savingKey: null,
    selectedKey: null,
    dialogKey: null,
    entryForRef: vi.fn(() => null),
    select: vi.fn(),
    selectOwn: vi.fn(),
    closeDialog: vi.fn(),
    decide: vi.fn(async () => true),
    setNote: vi.fn(async () => true),
    clear: vi.fn(async () => true),
    keep: vi.fn(async () => true),
    nextOf: vi.fn(() => null),
    next: vi.fn(),
    planPortage: vi.fn(),
    memberName: vi.fn(() => null),
    ...overrides,
  };
}

const renderCard = (checklist: PaddleChecklist) => render(<PaddleCheckCard checklist={checklist} />);

/** The rows along the route, in the order the card lists them. */
function rowButtons(): HTMLElement[] {
  return within(screen.getByTestId('paddle-check-rows')).getAllByRole('button');
}

/** The row along the route whose name starts as given. */
function rowNamed(name: RegExp): HTMLElement {
  return within(screen.getByTestId('paddle-check-rows')).getByRole('button', { name });
}

/** The element a badge's tooltip hangs on. */
function parentOf(element: HTMLElement): HTMLElement {
  const parent = element.parentElement;
  if (!parent) throw new Error('no parent around the badge');
  return parent;
}

beforeEach(() => {
  vi.clearAllMocks();
  // No distance unit chosen: the card reads metric, in English.
  seedStore(useSettingsStore, { settings: buildSettings() });
});

describe('PaddleCheckCard', () => {
  it('FE-PADDLE-CHECKCARD-001: renders nothing while the checklist is off', () => {
    const { container } = renderCard(checklistOf({ status: 'off', check: null, summary: null }));

    expect(container).toBeEmptyDOMElement();
  });

  it('FE-PADDLE-CHECKCARD-002: a new paddle tour asks to be saved first and says what is known about the water', () => {
    renderCard(checklistOf({ status: 'new', check: null, summary: null, dirty: true }));

    const card = screen.getByRole('region', { name: SAYS.title });
    const saveFirst = within(card).getByText(SAYS.saveFirst);
    const notice = within(card).getByText(OBSTACLE_NOTICE);
    // The request to save comes first, the data notice below it; a new draft is unsaved by nature and says no more.
    expect(saveFirst.compareDocumentPosition(notice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(card).queryByText(SAYS.unsaved)).not.toBeInTheDocument();
    expect(within(card).queryByTestId('paddle-check-pill')).not.toBeInTheDocument();
    expect(within(card).queryByTestId('paddle-check-data')).not.toBeInTheDocument();
    expect(within(card).queryByTestId('paddle-check-list')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-003: while the list loads it says so as a status with a spinner, the bench already in the head', () => {
    renderCard(checklistOf({ status: 'loading', check: null, dirty: true }));

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(SAYS.loading);
    expect(status.querySelector('svg.animate-spin')).not.toBeNull();
    // Loading speaks before unsaved changes.
    expect(screen.queryByText(SAYS.unsaved)).not.toBeInTheDocument();
    expect(screen.queryByText(OBSTACLE_NOTICE)).not.toBeInTheDocument();
    expect(screen.getByTestId('paddle-check-pill')).toHaveTextContent('1 open');
    expect(screen.getByTestId('paddle-check-data')).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-check-list')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-004: offline without a cached list it says the list loads once online', () => {
    renderCard(checklistOf({ status: 'offline-empty', check: null }));

    expect(screen.getByText(SAYS.offlineEmpty)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-check-list')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-005: a list that could not be read says the obstacle data could not be loaded', () => {
    renderCard(checklistOf({ status: 'error', check: null }));

    expect(screen.getByText(SAYS.error)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-check-list')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-006: unsaved route changes speak before the cache and dim the rows without hiding them', () => {
    renderCard(checklistOf({ check: ROUTE, dirty: true, stale: true }));

    expect(screen.getByText(SAYS.unsaved)).toBeInTheDocument();
    expect(screen.queryByText(/Updates once online/)).not.toBeInTheDocument();
    expect(screen.getByTestId('paddle-check-list')).toHaveClass('opacity-60');
    expect(rowButtons()).toHaveLength(5);
  });

  it('FE-PADDLE-CHECKCARD-007: a list from the cache says when it was worked out and dims the rows', () => {
    renderCard(checklistOf({ check: ROUTE, stale: true }));

    expect(screen.getByText(staleLine(dateOf(ROUTE.evaluated_at)))).toBeInTheDocument();
    expect(screen.queryByText(SAYS.unsaved)).not.toBeInTheDocument();
    expect(screen.getByTestId('paddle-check-list')).toHaveClass('opacity-60');
    expect(rowButtons()).toHaveLength(5);
  });

  it('FE-PADDLE-CHECKCARD-008: lists obstacles and own marks in route order, each with its place and where it stands', () => {
    renderCard(checklistOf({ check: ROUTE }));

    const card = screen.getByRole('region', { name: SAYS.title });
    expect(within(card).getByTestId('paddle-check-pill')).toHaveTextContent('1 open');
    expect(within(card).getByTestId('paddle-check-data')).toHaveTextContent('covered');
    // A ready list that matches the saved route has nothing to say above it and is not dimmed.
    expect(within(card).queryByRole('status')).not.toBeInTheDocument();
    expect(within(card).queryByText(SAYS.unsaved)).not.toBeInTheDocument();
    expect(screen.getByTestId('paddle-check-list')).not.toHaveClass('opacity-60');

    const rows = rowButtons();
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringMatching(/^Portage1\.1 km/),
      expect.stringMatching(/^Wehr Regendorf1\.2 km/),
      expect.stringMatching(/^Wehr Kallmünz2\.5 km/),
      expect.stringMatching(/^Lock3\.4 km/),
      expect.stringMatching(/^Lock5 km/),
    ]);
    const [, weir, banned, lock] = rows;
    expect(within(weir).getByText('status open')).toBeInTheDocument();
    expect(within(weir).getByTestId('checklist-glyph')).toHaveAttribute('data-dashed', 'false');
    expect(within(weir).queryByText(SAYS.near)).not.toBeInTheDocument();
    expect(within(weir).queryByText(/^access/)).not.toBeInTheDocument();
    expect(within(banned).getByText('access no')).toBeInTheDocument();
    // An unnamed lock goes by its kind: near the route on a dashed ring, its decision and the SUP advice.
    expect(within(lock).getByTestId('checklist-glyph')).toHaveAttribute('data-kind', 'lock');
    expect(within(lock).getByTestId('checklist-glyph')).toHaveAttribute('data-dashed', 'true');
    expect(within(lock).getByText(SAYS.near)).toBeInTheDocument();
    expect(within(lock).getByText('status decided')).toBeInTheDocument();
    expect(within(lock).getByText(SAYS.supLock)).toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-009: an own portage reads as the own plan, how far it carries, what it carries round', async () => {
    renderCard(
      checklistOf({ check: obstacleCheck({ own: [ownPortage({ from_m: 1100, to_m: 1250, conflict: 'private' })] }) })
    );

    const row = rowNamed(/^Portage/);
    expect(
      within(row)
        .getAllByTestId('checklist-glyph')
        .map((glyph) => glyph.dataset.kind)
    ).toEqual(['portage', 'weir']);
    expect(within(row).getByText(SAYS.carry).nextElementSibling).toHaveTextContent('150 m');
    expect(within(row).getByRole('img', { name: 'Weir' })).toBeInTheDocument();
    expect(within(row).getByText(SAYS.privateWay)).toBeInTheDocument();

    fireEvent.mouseEnter(parentOf(within(row).getByText(SAYS.own)));
    expect(await screen.findByRole('tooltip')).toHaveTextContent(SAYS.ownInfo);
  });

  it('FE-PADDLE-CHECKCARD-010: a forbidden carrying way reads as its access rule, a lock carried round is dimmed', () => {
    const forbidden = ownPortage({ from_m: 2000, to_m: 2200, conflict: 'forbidden' });
    renderCard(checklistOf({ check: obstacleCheck({ entries: [], own: [BYPASSED_LOCK, ADVISED_LOCK, forbidden] }) }));

    const [portage, advised, bypassed] = rowButtons();
    expect(portage).toHaveTextContent('access no');
    expect(portage).not.toHaveTextContent(SAYS.privateWay);
    // A covered obstacle the checklist does not hold gets no chip.
    expect(within(portage).queryByRole('img')).not.toBeInTheDocument();
    expect(portage).not.toHaveClass('opacity-60');

    // A lock passed on a SUP carries the advice; one a portage carries round is dimmed and says why.
    expect(within(advised).getByTestId('checklist-glyph')).toHaveAttribute('data-kind', 'lock');
    expect(advised).toHaveTextContent(SAYS.own);
    expect(advised).toHaveTextContent(SAYS.supLock);
    expect(advised).not.toHaveTextContent(SAYS.carry);
    expect(advised).not.toHaveClass('opacity-60');

    expect(bypassed).toHaveClass('opacity-60');
    expect(bypassed).toHaveTextContent(SAYS.own);
    expect(bypassed).toHaveTextContent(SAYS.bypassed);
    expect(bypassed).not.toHaveTextContent(SAYS.supLock);
  });

  it('FE-PADDLE-CHECKCARD-011: a row is one button that selects its obstacle or its own mark', () => {
    const select = vi.fn<PaddleChecklist['select']>();
    const selectOwn = vi.fn<PaddleChecklist['selectOwn']>();
    renderCard(checklistOf({ check: ROUTE, select, selectOwn }));

    for (const row of rowButtons()) expect(row).toHaveAttribute('type', 'button');
    // Nothing to press inside a row.
    expect(within(rowNamed(/^Wehr Kallmünz/)).queryByRole('button')).not.toBeInTheDocument();

    fireEvent.click(rowNamed(/^Wehr Kallmünz/));
    expect(select).toHaveBeenCalledWith(BANNED_WEIR);
    fireEvent.click(rowNamed(/^Portage/));
    expect(selectOwn).toHaveBeenCalledWith(OWN_PORTAGE);
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('FE-PADDLE-CHECKCARD-012: the selected entry is the current row, scrolled into view, and the mark follows the selection', () => {
    const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView);
    const { rerender } = renderCard(checklistOf({ check: ROUTE, selectedKey: WEIR.key }));

    const weir = rowNamed(/^Wehr Regendorf/);
    expect(weir).toHaveAttribute('aria-current', 'true');
    expect(weir).toHaveClass('ring-1', 'ring-inset', 'ring-accent', 'bg-surface-hover');
    expect(rowButtons().filter((row) => row.hasAttribute('aria-current'))).toEqual([weir]);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect(scrollIntoView.mock.contexts[0]).toBe(weir);

    rerender(<PaddleCheckCard checklist={checklistOf({ check: ROUTE, selectedKey: BANNED_WEIR.key })} />);
    const banned = rowNamed(/^Wehr Kallmünz/);
    expect(banned).toHaveAttribute('aria-current', 'true');
    expect(weir).not.toHaveAttribute('aria-current');
    expect(weir).not.toHaveClass('ring-accent');
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(scrollIntoView.mock.contexts[1]).toBe(banned);
  });

  it('FE-PADDLE-CHECKCARD-013: earlier decisions wait folded under their count, apart from the route, and open on request', () => {
    const select = vi.fn<PaddleChecklist['select']>();
    renderCard(checklistOf({ check: WITH_EARLIER, select }));

    const fold = screen.getByRole('button', { name: SAYS.earlier });
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(within(screen.getByTestId('paddle-check-earlier')).getByText('1')).toBeInTheDocument();
    expect(screen.queryByText(GONE_NAME)).not.toBeInTheDocument();
    expect(rowButtons()).toHaveLength(1);

    fireEvent.click(fold);
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    const earlier = screen.getByRole('button', { name: /^Alte Sohlschwelle/ });
    // No longer on the route, so no place along it.
    expect(earlier).not.toHaveTextContent('km');
    expect(earlier).toHaveTextContent('status off_route');
    fireEvent.click(earlier);
    expect(select).toHaveBeenCalledWith(GONE);
  });

  it('FE-PADDLE-CHECKCARD-014: a selected earlier decision opens the fold by itself and comes into view, until folded again', () => {
    const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView);
    const { rerender } = renderCard(checklistOf({ check: WITH_EARLIER }));
    expect(screen.queryByText(GONE_NAME)).not.toBeInTheDocument();

    rerender(<PaddleCheckCard checklist={checklistOf({ check: WITH_EARLIER, selectedKey: GONE.key })} />);
    const fold = screen.getByRole('button', { name: SAYS.earlier });
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    const row = screen.getByRole('button', { name: /^Alte Sohlschwelle/ });
    expect(row).toHaveAttribute('aria-current', 'true');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    expect(scrollIntoView.mock.contexts).toContain(row);

    fireEvent.click(fold);
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(GONE_NAME)).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-018: a decision about an object the data no longer holds stays among the rows, after the route', () => {
    renderCard(checklistOf({ check: obstacleCheck({ entries: [VANISHED, WEIR] }) }));
    const rows = rowButtons();
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveTextContent('Verschwundenes Wehr');
    expect(screen.queryByRole('button', { name: SAYS.earlier })).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-015: without rows it says nothing is known on covered data, and that there is none where none is', () => {
    const empty = obstacleCheck({ entries: [], own: [] });
    const bench = paddleBench({ entries: 0, open: 0 });
    const { rerender } = renderCard(checklistOf({ check: empty, summary: bench }));
    expect(screen.getByText(coveredEmptyLine(dateOf(bench.data_as_of ?? '')))).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-check-rows')).not.toBeInTheDocument();

    rerender(<PaddleCheckCard checklist={checklistOf({ check: empty, summary: { ...bench, data_as_of: null } })} />);
    expect(screen.getByText(coveredEmptyLine(SAYS.dateUnknown))).toBeInTheDocument();

    rerender(
      <PaddleCheckCard
        checklist={checklistOf({ check: empty, summary: { ...bench, data: 'none', data_as_of: null } })}
      />
    );
    expect(screen.getByText(SAYS.none)).toBeInTheDocument();
    expect(screen.queryByText(/No known obstacles/)).not.toBeInTheDocument();

    // Partial data says so in its data line; the card adds no sentence of its own.
    rerender(<PaddleCheckCard checklist={checklistOf({ check: empty, summary: { ...bench, data: 'partial' } })} />);
    expect(screen.queryByText(SAYS.none)).not.toBeInTheDocument();
    expect(screen.queryByText(/No known obstacles/)).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-016: mounts the entry dialog only while an entry the map cannot show is open in it', () => {
    const { rerender } = renderCard(checklistOf({ check: WITH_EARLIER }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<PaddleCheckCard checklist={checklistOf({ check: WITH_EARLIER, dialogKey: GONE.key })} />);
    expect(screen.getByRole('dialog', { name: 'Obstacle entry' })).toHaveTextContent(GONE.key);

    rerender(<PaddleCheckCard checklist={checklistOf({ check: WITH_EARLIER })} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('FE-PADDLE-CHECKCARD-017: closes on the line that a checklist is no clearance, before and after the tour is saved', () => {
    const { rerender } = renderCard(checklistOf({ status: 'new', check: null, summary: null }));
    expect(screen.getByTestId('paddle-check-card').lastElementChild).toHaveTextContent(SAYS.notClearance);

    rerender(<PaddleCheckCard checklist={checklistOf({ check: ROUTE })} />);
    expect(screen.getByTestId('paddle-check-card').lastElementChild).toHaveTextContent(SAYS.notClearance);
  });
});
