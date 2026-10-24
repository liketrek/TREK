// FE-TOUR-STAGE-SPREAD-022 to FE-TOUR-STAGE-SPREAD-023: on the phone, a multi-day tour put on a day
// asks the same two ways as the desktop, whole or a stage a day from it on (MDT-02).
import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { TourDayQuestion } from '../../../../src/components/Tours/stages/stageSpread';
import MTourDayChoiceSheet from '../../../../src/mobile/screens/trip/sheets/MTourDayChoiceSheet';
import { render, screen } from '../../../helpers/render';

const question: TourDayQuestion = {
  placeId: 81,
  dayId: 4,
  day: 2,
  name: 'Hut to hut',
  count: 3,
  fit: 3,
  wholeFree: true,
};

describe('MTourDayChoiceSheet', () => {
  it('FE-TOUR-STAGE-SPREAD-022: names the day and the tour, and answers with the way chosen', () => {
    const onAnswer = vi.fn();
    render(<MTourDayChoiceSheet question={question} onAnswer={onAnswer} />);
    expect(screen.getByText('Day 2: Hut to hut')).toBeInTheDocument();
    expect(screen.getByText('3 stages')).toBeInTheDocument();
    expect(screen.getByText('Stage 1 on this day, each next stage on the day after.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('m-tour-day-choice-whole'));
    expect(onAnswer).toHaveBeenLastCalledWith('whole');
    fireEvent.click(screen.getByTestId('m-tour-day-choice-stages'));
    expect(onAnswer).toHaveBeenLastCalledWith('stages');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onAnswer).toHaveBeenLastCalledWith(null);
  });

  it('FE-TOUR-STAGE-SPREAD-023: a day that holds the tour offers only the stages', () => {
    render(<MTourDayChoiceSheet question={{ ...question, wholeFree: false }} onAnswer={vi.fn()} />);
    expect(screen.getByTestId('m-tour-day-choice-whole')).toBeDisabled();
    expect(screen.getByTestId('m-tour-day-choice-stages')).toBeEnabled();
  });
});
