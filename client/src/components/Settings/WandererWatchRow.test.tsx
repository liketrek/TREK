import userEvent from '@testing-library/user-event';
import type { WandererSourceHintItem, WandererWatch } from '@trek/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import WandererWatchRow from './WandererWatchRow';

const repo = vi.hoisted(() => ({ getWatch: vi.fn(), setWatch: vi.fn() }));
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() }));
const navigate = vi.hoisted(() => vi.fn());
vi.mock('../../repo/wandererRepo', () => ({ wandererRepo: repo }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('react-router', async () => ({
  ...(await vi.importActual<typeof import('react-router')>('react-router')),
  useNavigate: () => navigate,
}));

const off: WandererWatch = {
  enabled: false,
  connected: true,
  lastRunAt: null,
  pausedUntil: null,
  blocked: false,
  hints: [],
};
const hints: WandererSourceHintItem[] = [
  {
    placeId: 7,
    tripId: 3,
    tripTitle: 'Alps',
    tourName: 'Ridge',
    state: 'changed',
    changes: ['name'],
    reason: null,
    externalUpdated: '2026-10-14',
    checkedAt: '2026-10-20T10:00:00Z',
  },
  {
    placeId: 8,
    tripId: 3,
    tripTitle: 'Alps',
    tourName: 'Gorge',
    state: 'unverifiable',
    changes: [],
    reason: 'unavailable',
    externalUpdated: null,
    checkedAt: '2026-10-19T10:00:00Z',
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WandererWatchRow (WAN-02)', () => {
  it('is off by default and dimmed, not hidden, without a connection', async () => {
    repo.getWatch.mockResolvedValue({ ...off, connected: false });
    render(<WandererWatchRow refreshKey="false||" />);
    await waitFor(() => expect(repo.getWatch).toHaveBeenCalled());
    const toggle = await screen.findByRole('button', { name: 'Check my trails for changes', pressed: false });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toBeDisabled();
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    await userEvent.tab();
    expect(toggle).not.toHaveFocus();
    expect(screen.queryByTestId('wanderer-watch-status')).toBeNull();
  });

  it('switches on at once and then says when it last looked', async () => {
    repo.getWatch.mockResolvedValue(off);
    repo.setWatch.mockResolvedValue({ ...off, enabled: true });
    render(<WandererWatchRow refreshKey="true||" />);
    const toggle = await screen.findByRole('button', { name: 'Check my trails for changes', pressed: false });
    await waitFor(() => expect(toggle).toBeEnabled());
    await userEvent.click(toggle);
    expect(repo.setWatch).toHaveBeenCalledWith(true);
    expect(await screen.findByText('Not looked yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Hints/ })).toBeDisabled();
  });

  it('counts the open hints on the button and opens each tour from the dialog', async () => {
    repo.getWatch.mockResolvedValue({ ...off, enabled: true, lastRunAt: '2026-10-20T10:00:00Z', hints });
    render(<WandererWatchRow refreshKey="true||" />);
    expect(await screen.findByTestId('wanderer-hint-count')).toHaveTextContent('2');
    await userEvent.click(screen.getByRole('button', { name: /Hints/ }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Hints on your trails')).toBeInTheDocument();
    expect(within(dialog).getByText('2 open hints')).toBeInTheDocument();
    const ridge = within(dialog).getByTestId('wanderer-hint-7');
    expect(within(ridge).getByText('Changed')).toBeInTheDocument();
    expect(within(ridge).getByText('Name')).toBeInTheDocument();
    expect(within(within(dialog).getByTestId('wanderer-hint-8')).getByText('Trail out of reach')).toBeInTheDocument();

    await userEvent.click(ridge);
    expect(navigate).toHaveBeenCalledWith('/trips/3?tab=plan&place=7');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('names a refused token instead of a last look', async () => {
    repo.getWatch.mockResolvedValue({ ...off, enabled: true, blocked: true });
    render(<WandererWatchRow refreshKey="true||" />);
    expect(await screen.findByText('Token refused')).toBeInTheDocument();
  });
});
