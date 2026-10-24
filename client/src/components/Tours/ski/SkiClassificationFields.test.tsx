import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { SkiClassificationFields } from './SkiClassificationFields';
import { NO_SKI_CHOICE, type SkiChoice } from './skiChoice';

// FE-TOUR-SKI-FIELDS-001 to FE-TOUR-SKI-FIELDS-003

const option = (name: string) => screen.getByRole('button', { name });

/** The fields over a form that keeps what it is given, as the import and the dialog do. */
function Stateful({ initial = NO_SKI_CHOICE }: { initial?: SkiChoice }) {
  const [choice, setChoice] = useState<SkiChoice>(initial);
  return (
    <>
      <SkiClassificationFields choice={choice} onChange={setChoice} />
      <span data-testid="choice">{`${choice.discipline ?? 'none'}/${choice.technique ?? 'none'}`}</span>
    </>
  );
}

describe('SkiClassificationFields (SKI-02)', () => {
  it('FE-TOUR-SKI-FIELDS-001: offers the four disciplines with none chosen, and asks for one', () => {
    render(<Stateful />);
    for (const discipline of ['alpine', 'snowboard', 'cross_country', 'touring']) {
      expect(option(`tours.ski.discipline.${discipline}`)).toHaveAttribute('aria-pressed', 'false');
    }
    expect(screen.getByRole('status')).toHaveTextContent('tours.ski.chooseDiscipline');
    expect(screen.getByRole('button', { name: 'tours.ski.infoLabel' })).toHaveAccessibleDescription('tours.ski.info');
    fireEvent.click(option('tours.ski.discipline.touring'));
    expect(screen.getByTestId('choice')).toHaveTextContent('touring/none');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('FE-TOUR-SKI-FIELDS-002: the technique stays dimmed and out of reach until cross-country is chosen', () => {
    render(<Stateful initial={{ discipline: 'alpine', technique: null }} />);
    expect(screen.getByTestId('tour-ski-technique')).toHaveClass('opacity-50');
    expect(option('tours.ski.technique.classic')).toBeDisabled();
    fireEvent.click(option('tours.ski.discipline.cross_country'));
    expect(screen.getByTestId('tour-ski-technique')).not.toHaveClass('opacity-50');
    expect(screen.getByRole('status')).toHaveTextContent('tours.ski.chooseTechnique');
    fireEvent.click(option('tours.ski.technique.unknown'));
    expect(screen.getByTestId('choice')).toHaveTextContent('cross_country/unknown');
    expect(option('tours.ski.technique.unknown')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('FE-TOUR-SKI-FIELDS-003: a technique left from cross-country shows as none chosen on another discipline', () => {
    render(<Stateful initial={{ discipline: 'snowboard', technique: 'skating' }} />);
    expect(option('tours.ski.technique.skating')).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(option('tours.ski.discipline.cross_country'));
    expect(option('tours.ski.technique.skating')).toHaveAttribute('aria-pressed', 'true');
  });
});
