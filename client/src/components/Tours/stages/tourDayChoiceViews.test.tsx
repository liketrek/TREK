// FE-TOUR-STAGE-SPREAD-017 to FE-TOUR-STAGE-SPREAD-021 and FE-TOUR-STAGE-SPREAD-026: where a
// multi-day tour is put on a day on the
// desktop, the choice between the whole tour and a stage a day: the list's day menu, the detail's
// button and the dialog for a tour dragged onto a day (MDT-02).
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildDay } from '../../../../tests/helpers/factories';
import { render, screen } from '../../../../tests/helpers/render';
import { TourDayMenu } from '../tourParts';
import type { TourDayAssignment } from '../useTourDayAssignment';
import { TourDayAddButton } from './TourDayAddButton';
import { TourDayChoiceDialog } from './TourDayChoiceDialog';
import type { TourDayQuestion } from './stageSpread';

const DAYS = [buildDay({ id: 3, day_number: 1, date: null }), buildDay({ id: 4, day_number: 2, date: null })];

let assignment: TourDayAssignment;

beforeEach(() => {
  vi.clearAllMocks();
  assignment = {
    canAssign: true,
    isOnDay: vi.fn(() => false),
    isPending: vi.fn(() => false),
    isAvailable: vi.fn(() => true),
    assign: vi.fn(async () => true),
  };
});

describe('the day menu of a tour list', () => {
  it('FE-TOUR-STAGE-SPREAD-017: a day tour goes on the day it is given, with no second step', async () => {
    render(<TourDayMenu days={DAYS} placeId={81} label="Add to day" assignment={assignment} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add to day' }));
    await userEvent.click(screen.getByText('Day 2'));
    expect(assignment.assign).toHaveBeenCalledWith(81, 4);
    expect(screen.queryByText('Whole tour on this day')).toBeNull();
  });

  it('FE-TOUR-STAGE-SPREAD-018: a multi-day tour asks next, in the menu, whole or a stage a day', async () => {
    render(<TourDayMenu days={DAYS} placeId={81} label="Add to day" assignment={assignment} stageCount={2} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add to day' }));
    await userEvent.click(screen.getByText('Day 1'));
    expect(assignment.assign).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Whole tour on this day' })).toBeEnabled();
    await userEvent.click(screen.getByRole('button', { name: 'Stages from this day on' }));
    expect(assignment.assign).toHaveBeenCalledWith(81, 3, 'stages');
    expect(assignment.isAvailable).toHaveBeenCalledWith(81, 3, 'stages');
  });

  it('FE-TOUR-STAGE-SPREAD-026: the second step names the day picked, and a greyed-out whole says why', async () => {
    vi.mocked(assignment.isOnDay).mockReturnValue(true);
    render(<TourDayMenu days={DAYS} placeId={81} label="Add to day" assignment={assignment} stageCount={3} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add to day' }));
    await userEvent.click(screen.getByRole('button', { name: 'Day 2' }));
    const whole = await screen.findByRole('button', { name: /^Whole tour on this day/ });
    expect(whole).toBeDisabled();
    expect(whole).toHaveTextContent('This day already holds the tour.');
    // The day stays in sight as a heading, not as something to click again.
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Day 2' })).toBeNull();
    const stages = screen.getByRole('button', { name: 'Stages from this day on, up to stage 1' });
    expect(stages).toBeEnabled();
    expect(stages).not.toHaveTextContent('The trip ends');
  });
});

describe('the detail button and the dialog', () => {
  it('FE-TOUR-STAGE-SPREAD-019: the detail adds a day tour at once and offers a multi-day tour both ways', async () => {
    const props = { placeId: 81, dayId: 4, days: DAYS, assignment };
    const { unmount } = render(<TourDayAddButton {...props} stageCount={0} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add to Day' }));
    expect(assignment.assign).toHaveBeenCalledWith(81, 4);
    unmount();

    vi.mocked(assignment.isOnDay).mockReturnValue(true);
    render(<TourDayAddButton {...props} stageCount={3} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add to Day' }));
    const whole = screen.getByRole('button', { name: /^Whole tour on this day/ });
    expect(whole).toBeDisabled();
    expect(whole).toHaveTextContent('This day already holds the tour.');
    await userEvent.click(screen.getByRole('button', { name: 'Stages from this day on, up to stage 1' }));
    expect(assignment.assign).toHaveBeenLastCalledWith(81, 4, 'stages');
  });

  it('FE-TOUR-STAGE-SPREAD-020: the dialog names the day and the tour, says what each way does and answers', async () => {
    const onAnswer = vi.fn();
    const question: TourDayQuestion = {
      placeId: 81,
      dayId: 4,
      day: 2,
      name: 'Hut to hut',
      count: 3,
      fit: 2,
      wholeFree: false,
    };
    render(<TourDayChoiceDialog question={question} onAnswer={onAnswer} />);
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(screen.getByText('Hut to hut')).toBeInTheDocument();
    expect(screen.getByText('3 stages')).toBeInTheDocument();
    expect(screen.getByTestId('tour-day-choice-whole')).toBeDisabled();
    expect(screen.getByText('This day already holds the tour.')).toBeInTheDocument();
    expect(screen.getByText('Stages from this day on, up to stage 2')).toBeInTheDocument();
    const short = 'The trip ends after stage 2. The stages after it stay without a day.';
    expect(screen.getByText(short)).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('tour-day-choice-stages'));
    expect(onAnswer).toHaveBeenLastCalledWith('stages');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onAnswer).toHaveBeenLastCalledWith(null);
  });

  it('FE-TOUR-STAGE-SPREAD-021: no question, no dialog', () => {
    render(<TourDayChoiceDialog question={null} onAnswer={vi.fn()} />);
    expect(screen.queryByTestId('tour-day-choice-whole')).toBeNull();
  });
});
