// FE-MJRN-DAYIMPORT-001 to FE-MJRN-DAYIMPORT-003
//
// JRN-02 on the phone: the same review and buttons as the desktop dialog, in a
// bottom sheet for the day of the card the journey shows. The frame is the one
// the route sheet (JRN-01) uses too. With the journey preparing its days
// (JRN-03) the sheet is where a phone says, in words, why a day is not final.
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MJourneyDayImportSheet from '../../../../src/mobile/screens/journey/MJourneyDayImportSheet';
import MJourneyRecordingSheet from '../../../../src/mobile/screens/journey/MJourneyRecordingSheet';
import { buildDayStays, buildRecordingPreview } from '../../../helpers/journeyRecording';
import { render, screen, waitFor } from '../../../helpers/render';

const repo = vi.hoisted(() => ({
  reviewDay: vi.fn(),
  takeOverDay: vi.fn(),
  preview: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));
vi.mock('../../../../src/repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../../../../src/components/shared/Toast', () => ({ useToast: () => toast }));

vi.mock('../../../../src/components/Journey/JourneyMapAuto', () => ({
  default: () => <div data-testid="day-map" />,
}));

beforeEach(() => {
  for (const fn of Object.values(repo)) fn.mockReset();
  repo.reviewDay.mockResolvedValue(buildDayStays());
  repo.preview.mockResolvedValue(buildRecordingPreview());
  repo.takeOverDay.mockResolvedValue({
    entries: [{ id: 5, title: 'Rialto', stayCount: 1 }],
    alreadyTaken: [],
    skipped: [],
  });
});

describe('MJourneyDayImportSheet', () => {
  it('FE-MJRN-DAYIMPORT-001: names the day and the journey, lists the stays and takes them over on its button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onTakenOver = vi.fn();
    render(
      <MJourneyDayImportSheet
        journeyId={7}
        journeyTitle="Venice"
        date="2026-05-14"
        dayColor="#ff0055"
        storedRoute={undefined}
        onTakenOver={onTakenOver}
        onKept={vi.fn()}
        onClose={onClose}
      />
    );

    expect(await screen.findByRole('checkbox', { name: 'Take over Rialto' })).toBeChecked();
    expect(screen.getByText('Venice')).toBeInTheDocument();
    expect(screen.getByText(/Thursday, May 14/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Take over 3 drafts' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onTakenOver).toHaveBeenCalled();
  });

  it('FE-MJRN-DAYIMPORT-002: the route sheet keeps its own words in the same frame', async () => {
    render(
      <MJourneyRecordingSheet
        journeyId={7}
        journeyTitle="Venice"
        date="2026-05-14"
        stored={undefined}
        onKept={vi.fn()}
        onRemoved={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole('button', { name: 'Keep route' })).toBeInTheDocument();
    expect(
      screen.getByText('Only this day, from your Dawarich. Nothing is kept until you confirm.')
    ).toBeInTheDocument();
  });

  it('FE-MJRN-DAYIMPORT-003: a day no run fetched yet says so, beside the caller status and a fetch by hand', async () => {
    const user = userEvent.setup();
    const fetchNow = vi.fn(async () => {});
    render(
      <MJourneyDayImportSheet
        journeyId={7}
        journeyTitle="Venice"
        date="2026-05-14"
        dayColor="#ff0055"
        storedRoute={undefined}
        onTakenOver={vi.fn()}
        onKept={vi.fn()}
        onClose={vi.fn()}
        prep={{
          prep: { enabled: true, connection: 'ready', lastAttemptAt: null, lastSuccessAt: null, lastError: null },
          saving: false,
          fetching: false,
          statusLine: { text: 'Not fetched yet. The next background sync starts it.', tone: 'muted' },
          canFetch: true,
          setEnabled: vi.fn(),
          fetchNow,
          dayPrep: () => ({ state: 'pending', failed: false, lastSuccessAt: null }),
        }}
      />
    );

    expect(await screen.findByText('Not fetched yet.')).toBeInTheDocument();
    expect(screen.getByTestId('journey-prep-status')).toHaveTextContent('The next background sync starts it.');
    await user.click(screen.getByRole('button', { name: 'Fetch now' }));
    expect(fetchNow).toHaveBeenCalledTimes(1);
  });
});
