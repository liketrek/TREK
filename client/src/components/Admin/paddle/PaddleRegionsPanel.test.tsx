// FE-ADMIN-PADDLEREG-001 to FE-ADMIN-PADDLEREG-021: the paddle regions card in the admin area, drawn from a
// controlled usePaddleRegionsAdmin (the hook has its own test).
// FE-ADMIN-PADDLEREG-MODEL-001 to FE-ADMIN-PADDLEREG-MODEL-003: the helpers in paddleRegionsModel.
import type { PaddleRegion, PaddleRegionCatalogEntry } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '../../../../tests/helpers/render';
import { isReading, progressPercent, regionStatusTone } from './paddleRegionsModel';
import PaddleRegionsPanel from './PaddleRegionsPanel';
import type { usePaddleRegionsAdmin } from './usePaddleRegionsAdmin';

type Admin = ReturnType<typeof usePaddleRegionsAdmin>;

const hook = vi.hoisted(() => ({ usePaddleRegionsAdmin: vi.fn<() => Admin>() }));
vi.mock('./usePaddleRegionsAdmin', () => ({ usePaddleRegionsAdmin: hook.usePaddleRegionsAdmin }));

const HINT = 'Weirs, locks and paddling rules from OpenStreetMap, read per region and again every month.';
const ATTRIBUTION =
  'Data © OpenStreetMap contributors (ODbL), regional extracts by Geofabrik. Read again on the 3rd of every month.';
const EMPTY = 'No region yet. Paddle tours then show that no obstacle data is known.';
const CATALOG_DOWN = 'Geofabrik cannot be reached right now. Try again later.';

/** A region read once, its data current to the 3rd of October (midday, so every time zone keeps the day). */
function region(overrides: Partial<PaddleRegion> = {}): PaddleRegion {
  return {
    id: 'oberpfalz',
    name: 'Oberpfalz',
    status: 'ready',
    source_timestamp: '2026-10-03T12:00:00Z',
    imported_at: '2026-10-04T08:00:00Z',
    feature_count: 1234,
    error: null,
    progress: null,
    ...overrides,
  };
}

/** A region before its first read: no data and no date yet. */
const unread = (overrides: Partial<PaddleRegion>): PaddleRegion =>
  region({ source_timestamp: null, imported_at: null, feature_count: 0, ...overrides });

const READY = region();
const WAITING = unread({ id: 'donau', name: 'Donau', status: 'queued' });
const FAILED_AGAIN = region({ id: 'saale', name: 'Saale', status: 'failed', error: 'Download broke off.' });
const FAILED_FIRST = unread({ id: 'mosel', name: 'Mosel', status: 'failed', error: 'Not a PBF file.' });

/** Geofabrik's answers for "Limburg": the plain names told apart by the regions they lie in. */
const HITS: PaddleRegionCatalogEntry[] = [
  { id: 'germany/hessen/limburg-weilburg', name: 'Limburg-Weilburg', path: ['Europe', 'Germany', 'Hessen'] },
  { id: 'netherlands/limburg', name: 'Limburg', path: ['Europe', 'Netherlands'] },
  { id: 'belgium/limburg', name: 'Limburg', path: ['Europe', 'Belgium'] },
  { id: 'limburg', name: 'Limburg', path: [] },
];

function adminState(overrides: Partial<Admin> = {}, search: Partial<Admin['search']> = {}): Admin {
  return {
    toursOn: true,
    offline: false,
    regions: [],
    loading: false,
    error: null,
    retry: vi.fn(),
    added: new Set<string>(),
    busyId: null,
    add: vi.fn(async () => {}),
    refresh: vi.fn(async () => {}),
    removing: null,
    askRemove: vi.fn(),
    cancelRemove: vi.fn(),
    confirmRemove: vi.fn(),
    ...overrides,
    search: { query: '', setQuery: vi.fn(), hits: null, searching: false, error: null, ...search },
  };
}

function show(overrides: Partial<Admin> = {}, search: Partial<Admin['search']> = {}) {
  const state = adminState(overrides, search);
  hook.usePaddleRegionsAdmin.mockReturnValue(state);
  return { state, ...render(<PaddleRegionsPanel />) };
}

/** The card's title row, where the number of regions sits beside the title. */
function titleRow(): HTMLElement {
  const row = screen.getByRole('heading', { name: 'Paddle water data' }).parentElement;
  if (!row) throw new Error('no title row');
  return row;
}

function rowOf(name: string): HTMLElement {
  const row = screen.getByText(name).closest<HTMLElement>('[data-testid="paddle-region-row"]');
  if (!row) throw new Error(`no row for ${name}`);
  return row;
}

describe('PaddleRegionsPanel', () => {
  it('FE-ADMIN-PADDLEREG-001: renders nothing while the Tours addon is off', () => {
    const { container } = show({ toursOn: false, regions: [READY] });
    expect(container).toBeEmptyDOMElement();
  });

  it('FE-ADMIN-PADDLEREG-002: shows the card with its hint, the attribution and the empty state', () => {
    show();
    expect(screen.getByRole('heading', { name: 'Paddle water data' })).toBeInTheDocument();
    expect(screen.getByText(HINT)).toBeInTheDocument();
    expect(screen.getByText(EMPTY)).toBeInTheDocument();
    expect(screen.getByText(ATTRIBUTION)).toBeInTheDocument();
    // No count beside the title while there is no region.
    expect(titleRow()).toHaveTextContent(/^Paddle water data$/);
    const search = screen.getByRole('searchbox', { name: 'Add a region' });
    expect(search).toBeEnabled();
    expect(search).toHaveAttribute('placeholder', 'Search Geofabrik, for example Oberpfalz');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-region-row')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-003: says the list is loading instead of calling it empty', () => {
    show({ loading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-004: offline it says why and locks the search and every row, without the list error', () => {
    show({ offline: true, error: 'Network Error', regions: [READY] });
    expect(screen.getByRole('status')).toHaveTextContent('Regions can only be managed with a connection.');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Network Error')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Add a region' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Read again Oberpfalz' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove region Oberpfalz' })).toBeDisabled();
  });

  it('FE-ADMIN-PADDLEREG-005: a failed list read shows its error with a retry that asks the hook again', () => {
    const { state } = show({ error: 'Server unreachable' });
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Server unreachable');
    fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(state.retry).toHaveBeenCalledTimes(1);
  });

  it('FE-ADMIN-PADDLEREG-006: the search shows the query and hands every change to the hook', () => {
    const { state } = show({}, { query: 'Lim' });
    const search = screen.getByRole('searchbox', { name: 'Add a region' });
    expect(search).toHaveValue('Lim');
    fireEvent.change(search, { target: { value: 'Limb' } });
    expect(state.search.setQuery).toHaveBeenCalledWith('Limb');
  });

  it('FE-ADMIN-PADDLEREG-007: while Geofabrik is searched it says so and shows no verdict yet', () => {
    show({}, { query: 'Limburg', searching: true });
    expect(screen.getByRole('status')).toHaveTextContent('Loading...');
    expect(screen.queryByText('No region by that name')).not.toBeInTheDocument();
    expect(screen.queryByTestId('paddle-region-hit')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-008: a failed search shows its error under the field, without the list retry', () => {
    show({}, { query: 'Limburg', error: CATALOG_DOWN });
    expect(screen.getByRole('alert')).toHaveTextContent(CATALOG_DOWN);
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-009: a search without hits says no region has that name', () => {
    show({}, { query: 'Atlantis', hits: [] });
    expect(screen.getByText('No region by that name')).toBeInTheDocument();
    expect(screen.queryByTestId('paddle-region-hit')).not.toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-010: hits name the regions they lie in, outermost first, and mark the ones added', () => {
    show({ added: new Set(['germany/hessen/limburg-weilburg']) }, { query: 'Limburg', hits: HITS });
    const [weilburg, dutch, belgian, bare] = screen.getAllByTestId('paddle-region-hit');
    const path = within(weilburg).getAllByText(/^(Europe|Germany|Hessen)$/);
    expect(path.map((part) => part.textContent)).toEqual(['Europe', 'Germany', 'Hessen']);
    expect(within(weilburg).getByText('Added')).toBeInTheDocument();
    expect(within(weilburg).queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    expect(within(dutch).getByText('Netherlands')).toBeInTheDocument();
    expect(within(dutch).getByRole('button', { name: 'Add' })).toBeEnabled();
    expect(within(belgian).getByText('Belgium')).toBeInTheDocument();
    // A region at the top of Geofabrik's tree has nothing above it to name.
    expect(within(bare).getByText('Limburg').nextElementSibling).toBeNull();
  });

  it('FE-ADMIN-PADDLEREG-011: adding a hit hands its Geofabrik id to the hook', () => {
    const { state } = show({}, { query: 'Limburg', hits: HITS });
    const dutch = screen.getAllByTestId('paddle-region-hit')[1];
    fireEvent.click(within(dutch).getByRole('button', { name: 'Add' }));
    expect(state.add).toHaveBeenCalledWith('netherlands/limburg');
  });

  it('FE-ADMIN-PADDLEREG-012: while one region is added every add waits, and the one under way spins', () => {
    show({ busyId: 'netherlands/limburg' }, { query: 'Limburg', hits: HITS });
    const [, dutch, belgian] = screen.getAllByTestId('paddle-region-hit');
    const adding = within(dutch).getByRole('button', { name: 'Add' });
    const waiting = within(belgian).getByRole('button', { name: 'Add' });
    expect(adding).toBeDisabled();
    expect(waiting).toBeDisabled();
    expect(adding.querySelector('.animate-spin')).not.toBeNull();
    expect(waiting.querySelector('.animate-spin')).toBeNull();
  });

  it('FE-ADMIN-PADDLEREG-013: a waiting region reads Waiting, has no data yet and cannot be read again', () => {
    show({ regions: [WAITING] });
    const row = rowOf('Donau');
    expect(within(row).getByText('Waiting')).toHaveClass('border-edge-faint');
    expect(within(row).queryByText(/objects?$/)).not.toBeInTheDocument();
    expect(within(row).queryByText(/^As of/)).not.toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Read again Donau' })).toBeDisabled();
    expect(within(row).getByRole('button', { name: 'Remove region Donau' })).toBeEnabled();
  });

  it('FE-ADMIN-PADDLEREG-014: a region being read shows its phase and share, the phase alone while the size is unknown', () => {
    show({
      regions: [
        unread({ id: 'elbe', name: 'Elbe', status: 'importing', progress: { phase: 'download', fraction: 0.416 } }),
        unread({ id: 'main', name: 'Main', status: 'importing', progress: { phase: 'read', fraction: 0 } }),
        unread({ id: 'isar', name: 'Isar', status: 'importing', progress: { phase: 'download', fraction: null } }),
        unread({ id: 'naab', name: 'Naab', status: 'importing' }),
      ],
    });
    const elbe = rowOf('Elbe');
    expect(within(elbe).getByText('Downloading 42%')).toHaveClass('bg-accent');
    expect(within(elbe).getByRole('button', { name: 'Read again Elbe' })).toBeDisabled();
    expect(within(elbe).getByRole('button', { name: 'Remove region Elbe' })).toBeEnabled();
    // A read just begun says 0 %, not nothing.
    expect(within(rowOf('Main')).getByText('Reading 0%')).toBeInTheDocument();
    expect(within(rowOf('Isar')).getByText('Downloading')).toBeInTheDocument();
    expect(within(rowOf('Naab')).getByText('Reading')).toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-015: a ready region shows its object count and the date its data is current to', () => {
    show({ regions: [READY, region({ id: 'regen', name: 'Regen', feature_count: 1, source_timestamp: null })] });
    const row = rowOf('Oberpfalz');
    expect(within(row).getByText('Ready')).toHaveClass('bg-success-soft');
    expect(within(row).getByText('1234 objects')).toBeInTheDocument();
    expect(within(row).getByText('As of Oct 3, 2026')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Read again Oberpfalz' })).toBeEnabled();
    // One object reads singular; without a source date there is no date to show.
    const regen = rowOf('Regen');
    expect(within(regen).getByText('1 object')).toBeInTheDocument();
    expect(within(regen).queryByText(/^As of/)).not.toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-016: a failed read shows its error, and that the earlier data stays in use when there is some', () => {
    show({ regions: [FAILED_AGAIN, FAILED_FIRST] });
    const again = rowOf('Saale');
    expect(within(again).getByText('Failed')).toHaveClass('bg-danger-soft');
    const error = within(again).getByText('Download broke off. The data read before stays in use.');
    expect(error).toHaveAttribute('title', 'Download broke off.');
    const first = rowOf('Mosel');
    expect(within(first).getByText('Not a PBF file.')).toBeInTheDocument();
    expect(within(first).queryByText(/stays in use/)).not.toBeInTheDocument();
    expect(within(first).queryByText(/objects?$/)).not.toBeInTheDocument();
    expect(within(first).getByRole('button', { name: 'Read again Mosel' })).toBeEnabled();
  });

  it('FE-ADMIN-PADDLEREG-017: Read again and Remove hand the region to the hook', () => {
    const { state } = show({ regions: [READY] });
    fireEvent.click(screen.getByRole('button', { name: 'Read again Oberpfalz' }));
    expect(state.refresh).toHaveBeenCalledWith('oberpfalz');
    fireEvent.click(screen.getByRole('button', { name: 'Remove region Oberpfalz' }));
    expect(state.askRemove).toHaveBeenCalledWith(READY);
    // The question opens only once the hook holds the region to remove.
    expect(screen.queryByRole('heading', { name: 'Remove region' })).not.toBeInTheDocument();
  });

  it('FE-ADMIN-PADDLEREG-018: while one region is busy its row dims and no row can be read again or removed', () => {
    show({ regions: [READY, FAILED_AGAIN], busyId: 'oberpfalz' });
    expect(rowOf('Oberpfalz')).toHaveClass('opacity-60');
    expect(rowOf('Saale')).not.toHaveClass('opacity-60');
    for (const name of ['Oberpfalz', 'Saale']) {
      expect(screen.getByRole('button', { name: `Read again ${name}` })).toBeDisabled();
      expect(screen.getByRole('button', { name: `Remove region ${name}` })).toBeDisabled();
    }
  });

  it('FE-ADMIN-PADDLEREG-019: the title carries the number of regions', () => {
    show({ regions: [READY, WAITING, FAILED_FIRST] });
    expect(within(titleRow()).getByText('3')).toBeInTheDocument();
    expect(screen.getAllByTestId('paddle-region-row')).toHaveLength(3);
  });

  it('FE-ADMIN-PADDLEREG-020: removing asks first, naming the region, and confirming hands it to the hook', () => {
    const { state } = show({ regions: [READY], removing: READY });
    const message = 'Oberpfalz and its obstacle data are removed. Paddle tours there then show no data.';
    expect(screen.getByRole('heading', { name: 'Remove region' })).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(state.confirmRemove).toHaveBeenCalledTimes(1);
  });

  it('FE-ADMIN-PADDLEREG-021: Cancel and Escape take the question back without removing', () => {
    const { state } = show({ regions: [READY], removing: READY });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(state.cancelRemove).toHaveBeenCalledTimes(2);
    expect(state.confirmRemove).not.toHaveBeenCalled();
  });
});

describe('paddleRegionsModel', () => {
  it('FE-ADMIN-PADDLEREG-MODEL-001: a region waiting for its read or being read counts as reading', () => {
    expect(isReading({ status: 'queued' })).toBe(true);
    expect(isReading({ status: 'importing' })).toBe(true);
    expect(isReading({ status: 'ready' })).toBe(false);
    expect(isReading({ status: 'failed' })).toBe(false);
  });

  it('FE-ADMIN-PADDLEREG-MODEL-002: the share of a read is a whole percent, null while its size is unknown', () => {
    expect(progressPercent({ progress: null })).toBeNull();
    expect(progressPercent({ progress: { phase: 'download', fraction: null } })).toBeNull();
    expect(progressPercent({ progress: { phase: 'download', fraction: 0 } })).toBe(0);
    expect(progressPercent({ progress: { phase: 'read', fraction: 0.416 } })).toBe(42);
    expect(progressPercent({ progress: { phase: 'read', fraction: 1 } })).toBe(100);
  });

  it('FE-ADMIN-PADDLEREG-MODEL-003: the badge tone follows the state of the read, never the water', () => {
    expect(regionStatusTone('queued')).toBe('neutral');
    expect(regionStatusTone('importing')).toBe('accent');
    expect(regionStatusTone('ready')).toBe('success');
    expect(regionStatusTone('failed')).toBe('danger');
  });
});
