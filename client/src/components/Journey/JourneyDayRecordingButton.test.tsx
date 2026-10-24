// FE-JRN-DAY-RECORDING-BTN-001 to FE-JRN-DAY-RECORDING-BTN-005
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { buildRecordedDay } from '../../../tests/helpers/journeyRecording';
import { render, screen } from '../../../tests/helpers/render';
import JourneyDayRecordingButton from './JourneyDayRecordingButton';

function renderButton(props: Partial<Parameters<typeof JourneyDayRecordingButton>[0]> = {}) {
  const onOpen = vi.fn();
  render(
    <JourneyDayRecordingButton
      day={undefined}
      canEdit
      canTakeOver={false}
      needsConnection={false}
      onOpen={onOpen}
      {...props}
    />
  );
  return onOpen;
}

describe('JourneyDayRecordingButton', () => {
  it('FE-JRN-DAY-RECORDING-BTN-001: a kept day shows how far it went and whose recording it is, and opens for an editor', async () => {
    const onOpen = renderButton({ day: buildRecordedDay() });
    const button = screen.getByTestId('journey-day-recording');
    expect(button).toHaveTextContent('1.5 km');
    expect(button.getAttribute('aria-label')).toMatch(/1\.5 km, taken over by marta/);
    await userEvent.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-DAY-RECORDING-BTN-002: a viewer sees the kept day but cannot open it, and a running day says so', async () => {
    const onOpen = renderButton({ day: buildRecordedDay({ provisional: true, importedBy: null }), canEdit: false });
    const button = screen.getByTestId('journey-day-recording');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button.getAttribute('aria-label')).toMatch(/taken over on .*The day was still running then\./);
    await userEvent.click(button);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('FE-JRN-DAY-RECORDING-BTN-003: without a kept day an editor whose Dawarich answers may take it over', async () => {
    const onOpen = renderButton({ canTakeOver: true });
    await userEvent.click(screen.getByRole('button', { name: 'Take over recording' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('FE-JRN-DAY-RECORDING-BTN-004: offline the offer stays, dimmed, and says why', async () => {
    const onOpen = renderButton({ needsConnection: true });
    const button = screen.getByTestId('journey-day-recording');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button.getAttribute('aria-label')).toMatch(/connection/);
    await userEvent.click(button);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('FE-JRN-DAY-RECORDING-BTN-005: nothing kept and nothing to offer draws nothing', () => {
    renderButton();
    expect(screen.queryByTestId('journey-day-recording')).toBeNull();
  });
});
