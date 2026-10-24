// FE-JRN-RECORDING-DIALOG-001 to FE-JRN-RECORDING-DIALOG-005
//
// JRN-01: the desktop dialog that takes one day's recorded route over. It names
// the journey and the day, shows what would be kept, and keeps it only on its
// button.
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRecordedDay, buildRecordingPreview } from '../../../tests/helpers/journeyRecording';
import { render, screen, waitFor } from '../../../tests/helpers/render';
import JourneyRecordingDialog from './JourneyRecordingDialog';

const repo = vi.hoisted(() => ({ preview: vi.fn(), save: vi.fn(), remove: vi.fn() }));
vi.mock('../../repo/journeyRecordingsRepo', () => ({ journeyRecordingsRepo: repo }));

const toast = { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() };
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));

const httpError = (code: string) => Object.assign(new Error(code), { response: { data: { error: code, code } } });

function renderDialog(stored?: ReturnType<typeof buildRecordedDay>) {
  const props = { onKept: vi.fn(), onRemoved: vi.fn(), onClose: vi.fn() };
  render(<JourneyRecordingDialog journeyId={7} journeyTitle="Venice" date="2026-05-14" stored={stored} {...props} />);
  return props;
}

beforeEach(() => {
  for (const fn of [...Object.values(repo), ...Object.values(toast)]) fn.mockReset();
});

describe('JourneyRecordingDialog', () => {
  it('FE-JRN-RECORDING-DIALOG-001: names the journey and the day and shows what the day covers before anything is kept', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview({ audience: 2 }));
    renderDialog();

    expect(await screen.findByTestId('recording-sketch')).toBeInTheDocument();
    expect(screen.getByText('Venice')).toBeInTheDocument();
    expect(screen.getByText(/May 14, 2026/)).toBeInTheDocument();
    expect(screen.getByText('1.5 km')).toBeInTheDocument();
    expect(screen.getByText('1 piece')).toBeInTheDocument();
    expect(screen.getByText('Walking')).toBeInTheDocument();
    expect(screen.getByText(/2 other people on this journey will see the route/)).toBeInTheDocument();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('FE-JRN-RECORDING-DIALOG-002: keeps the day on its button and closes', async () => {
    repo.preview.mockResolvedValue(buildRecordingPreview());
    const day = buildRecordedDay();
    repo.save.mockResolvedValue({ day, outcome: 'created' });
    const props = renderDialog();

    await userEvent.click(await screen.findByRole('button', { name: 'Keep route' }));

    await waitFor(() => expect(props.onKept).toHaveBeenCalledWith(day));
    expect(props.onClose).toHaveBeenCalled();
  });

  it('FE-JRN-RECORDING-DIALOG-003: gaps and an unfinished day are said out loud, a kept twin cannot be kept again', async () => {
    const preview = buildRecordingPreview();
    repo.preview.mockResolvedValue({
      ...preview,
      provisional: true,
      stats: { ...preview.stats, gapCount: 2 },
      stored: buildRecordedDay(),
      sameAsStored: true,
    });
    renderDialog(buildRecordedDay());

    expect(await screen.findByText('2 gaps')).toBeInTheDocument();
    expect(screen.getByText(/not over yet in this time zone/)).toBeInTheDocument();
    expect(screen.getByText('This journey keeps exactly this recording already.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Already kept' })).toBeDisabled();
  });

  it('FE-JRN-RECORDING-DIALOG-004: when Dawarich cannot be read it says why, that the kept route stays, and offers to try again', async () => {
    repo.preview.mockRejectedValueOnce(httpError('unauthorized'));
    renderDialog(buildRecordedDay());

    expect(await screen.findByText(/Dawarich rejected the API key\./)).toBeInTheDocument();
    expect(screen.getByText(/The route this journey keeps stays as it is\./)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep route' })).toBeDisabled();

    repo.preview.mockResolvedValue(buildRecordingPreview());
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByTestId('recording-sketch')).toBeInTheDocument();
  });

  it('FE-JRN-RECORDING-DIALOG-005: removing the kept route asks first, also when Dawarich does not answer', async () => {
    repo.preview.mockRejectedValue(httpError('not_connected'));
    repo.remove.mockResolvedValue(undefined);
    const props = renderDialog(buildRecordedDay());
    await screen.findByText(/No Dawarich instance is connected yet\./);

    await userEvent.click(screen.getByRole('button', { name: 'Remove route' }));
    expect(repo.remove).not.toHaveBeenCalled();
    expect(await screen.findByText('Remove the kept route?')).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: 'Remove route' });
    const confirm = buttons[buttons.length - 1];
    if (!confirm) throw new Error('no confirm button');
    await userEvent.click(confirm);

    await waitFor(() => expect(props.onRemoved).toHaveBeenCalledWith('2026-05-14'));
  });
});
