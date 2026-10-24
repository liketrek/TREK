// FE-JRN-DAYIMPORT-DIALOG-001 to FE-JRN-DAYIMPORT-DIALOG-008
//
// JRN-02: the desktop dialog that takes a recorded day over with its stays. It
// names the journey and the day, shows the stays on the map and in a list to
// choose, rename and join, what the journal holds on the day already and who
// sees the drafts, and writes only on its button.
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDayStay, buildDayStays, buildRecordingPreview } from '../../../tests/helpers/journeyRecording';
import { render, screen, waitFor, within } from '../../../tests/helpers/render';
import JourneyDayImportDialog from './JourneyDayImportDialog';
import type { JourneyRecordingPrepState } from './useJourneyRecordingPrep';

const repo = vi.hoisted(() => ({
  reviewDay: vi.fn(),
  takeOverDay: vi.fn(),
  preview: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../../repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const map = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));
vi.mock('./JourneyMapAuto', () => ({
  default: (props: Record<string, unknown>) => {
    map.props = props;
    return <div data-testid="day-map" />;
  },
}));

function renderDialog(prep?: JourneyRecordingPrepState) {
  const props = { onTakenOver: vi.fn(), onKept: vi.fn(), onClose: vi.fn() };
  render(
    <JourneyDayImportDialog
      journeyId={7}
      journeyTitle="Venice"
      date="2026-05-14"
      dayColor="#ff0055"
      storedRoute={undefined}
      prep={prep}
      {...props}
    />
  );
  return props;
}

function prepState(over: Partial<JourneyRecordingPrepState> = {}): JourneyRecordingPrepState {
  return {
    prep: {
      enabled: true,
      connection: 'ready',
      lastAttemptAt: '2026-05-16T08:00:00.000Z',
      lastSuccessAt: '2026-05-14T18:00:00.000Z',
      lastError: 'unreachable',
    },
    saving: false,
    fetching: false,
    statusLine: { text: 'The last refresh failed: Dawarich did not answer.', tone: 'warning' },
    canFetch: true,
    setEnabled: vi.fn(),
    fetchNow: vi.fn(async () => {}),
    dayPrep: () => ({ state: 'provisional', failed: true, lastSuccessAt: '2026-05-14T18:00:00.000Z' }),
    ...over,
  };
}

const rowOf = (name: string) =>
  screen.getByRole('checkbox', { name: `Take over ${name}` }).closest('[data-stay-id]') as HTMLElement;

beforeEach(() => {
  for (const fn of [...Object.values(repo), ...Object.values(toast)]) fn.mockReset();
  repo.reviewDay.mockResolvedValue(
    buildDayStays({
      entries: [{ id: 3, title: 'Breakfast at the hotel', locationName: null, entryTime: '08:00', isDraft: false }],
      audience: 2,
    })
  );
  repo.preview.mockResolvedValue(buildRecordingPreview());
  repo.takeOverDay.mockResolvedValue({
    entries: [{ id: 5, title: 'Piazza San Marco', stayCount: 2 }],
    alreadyTaken: [],
    skipped: [],
  });
});

describe('JourneyDayImportDialog', () => {
  it('FE-JRN-DAYIMPORT-DIALOG-001: names the journey and the day, and shows the stays, the route and the day so far', async () => {
    renderDialog();

    expect(await screen.findByRole('checkbox', { name: 'Take over Parcheggio' })).toBeChecked();
    expect(screen.getByText('Venice')).toBeInTheDocument();
    expect(screen.getByText(/May 14, 2026/)).toBeInTheDocument();
    expect(screen.getByTestId('day-map')).toBeInTheDocument();
    expect(map.props.entries).toHaveLength(4);
    expect(screen.getByText('Breakfast at the hotel')).toBeInTheDocument();
    expect(screen.getByText(/2 other people on this journey see them/)).toBeInTheDocument();
    expect(within(rowOf('Parcheggio')).getByText('Unconfirmed')).toBeInTheDocument();
    expect(await screen.findByText("Keep the day's route too")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take over 3 drafts' })).toBeEnabled();
    expect(repo.takeOverDay).not.toHaveBeenCalled();
  });

  it('FE-JRN-DAYIMPORT-DIALOG-002: the same place twice starts joined under one title, and can be kept apart', async () => {
    const user = userEvent.setup();
    renderDialog();
    await screen.findByRole('checkbox', { name: 'Take over Parcheggio' });

    expect(screen.getByRole('textbox', { name: 'Title of the entry' })).toHaveValue('Piazza San Marco');
    await user.click(screen.getByRole('button', { name: 'Keep apart' }));

    expect(screen.queryByRole('textbox', { name: 'Title of the entry' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take over 4 drafts' })).toBeInTheDocument();
  });

  it('FE-JRN-DAYIMPORT-DIALOG-003: a stay left out is dimmed and counted, and the drafts are written on the button', async () => {
    const user = userEvent.setup();
    const props = renderDialog();
    await screen.findByRole('checkbox', { name: 'Take over Parcheggio' });

    await user.click(screen.getByRole('checkbox', { name: 'Take over Parcheggio' }));
    expect(rowOf('Parcheggio').className).toContain('opacity-60');
    expect(screen.getByText('1 left out')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Take over 2 drafts' }));

    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(repo.takeOverDay).toHaveBeenCalledWith(
      7,
      '2026-05-14',
      expect.objectContaining({ skipSuggestionIds: [10] })
    );
    expect(props.onTakenOver).toHaveBeenCalled();
  });

  it('FE-JRN-DAYIMPORT-DIALOG-004: a day report gathers every chosen stay under one title', async () => {
    const user = userEvent.setup();
    renderDialog();
    await screen.findByRole('checkbox', { name: 'Take over Parcheggio' });

    await user.click(screen.getByRole('button', { name: 'Day report' }));

    expect(screen.getByRole('textbox', { name: 'Title of the entry' })).toHaveValue('Day of May 14');
    expect(screen.queryByRole('button', { name: 'Keep apart' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Take over 1 draft' }));
    await waitFor(() => expect(repo.takeOverDay).toHaveBeenCalled());
    expect(repo.takeOverDay.mock.calls[0]?.[2]).toMatchObject({
      groups: [{ kind: 'report', title: 'Day of May 14', anchorSuggestionId: 12 }],
    });
  });

  it('FE-JRN-DAYIMPORT-DIALOG-005: a stay the journal holds is shown with its entry and cannot be chosen again', async () => {
    repo.reviewDay.mockResolvedValue(
      buildDayStays({
        stays: [buildDayStay({ suggestionId: 11, status: 'here', entry: { id: 4, title: 'Morning in San Marco' } })],
      })
    );
    renderDialog();

    const box = await screen.findByRole('checkbox', { name: 'Take over Piazza San Marco' });
    expect(box).toBeDisabled();
    expect(box).not.toBeChecked();
    expect(screen.getByText('In Morning in San Marco')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Take over 0 drafts' })).toBeDisabled();
  });

  it('FE-JRN-DAYIMPORT-DIALOG-006: when Dawarich does not answer, the stays of the last sync are shown with the reason', async () => {
    repo.reviewDay.mockResolvedValue(
      buildDayStays({ fresh: false, error: 'unreachable', syncedAt: '2026-05-14T20:00:00Z', truncated: true })
    );
    renderDialog();

    expect(await screen.findByText(/Dawarich did not answer/)).toBeInTheDocument();
    expect(screen.getByText(/Some stays may be missing/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Take over Rialto' })).toBeChecked();
  });

  it('FE-JRN-DAYIMPORT-DIALOG-007: an unsettled prepared day says why, with the caller status and a fetch by hand', async () => {
    const user = userEvent.setup();
    const prep = prepState();
    renderDialog(prep);

    expect(await screen.findByText(/before the day ended, so stays may be missing/)).toBeInTheDocument();
    expect(screen.getByText(/this is the older state/)).toBeInTheDocument();
    expect(screen.getByTestId('journey-prep-status')).toHaveTextContent(
      'The last refresh failed: Dawarich did not answer.'
    );
    await user.click(screen.getByRole('button', { name: 'Fetch now' }));
    expect(prep.fetchNow).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-DAYIMPORT-DIALOG-008: without the journey preparing its days, no status and no day notice', async () => {
    renderDialog(prepState({ statusLine: null, canFetch: false, dayPrep: () => null }));

    expect(await screen.findByRole('checkbox', { name: 'Take over Parcheggio' })).toBeChecked();
    expect(screen.queryByTestId('journey-prep-status')).not.toBeInTheDocument();
    expect(screen.queryByText(/this is the older state/)).not.toBeInTheDocument();
  });
});
