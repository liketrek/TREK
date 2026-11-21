// FE-MOB-PLTEXTS-001 to FE-MOB-PLTEXTS-003: the place's three texts on the phone, one at a time.
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen } from '../../../../../tests/helpers/render';
import { PlPlaceTexts } from './PlPlaceTexts';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

function setup(overrides: Partial<Parameters<typeof PlPlaceTexts>[0]> = {}) {
  const onChange = vi.fn();
  render(<PlPlaceTexts description="A tower" notes="" dayNotes={null} onChange={onChange} t={t} {...overrides} />);
  return onChange;
}

describe('PlPlaceTexts', () => {
  it('FE-MOB-PLTEXTS-001: heads the texts and shows the description first, with where it appears', () => {
    setup();
    expect(screen.getByText('places.textsLabel')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'places.notesTabAbout' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByLabelText('places.formDescription')).toBeVisible();
    expect(screen.getByLabelText('places.formNotes')).not.toBeVisible();
    expect(screen.getByText('places.notesHintDescription')).toBeVisible();
  });

  it('FE-MOB-PLTEXTS-002: a tab switches the field, and each text writes its own', () => {
    const onChange = setup({ notes: 'Cash only' });
    fireEvent.click(screen.getByRole('tab', { name: 'places.formNotes' }));
    expect(screen.getByLabelText('places.formNotes')).toBeVisible();
    expect(screen.getByLabelText('places.formNotes')).toHaveValue('Cash only');
    fireEvent.change(screen.getByLabelText('places.formNotes'), { target: { value: 'Cards too' } });
    expect(onChange).toHaveBeenLastCalledWith('notes', 'Cards too');
    fireEvent.change(screen.getByLabelText('places.formDescription'), { target: { value: 'A tall tower' } });
    expect(onChange).toHaveBeenLastCalledWith('description', 'A tall tower');
  });

  it('FE-MOB-PLTEXTS-003: the day note has a tab of its own only with a visit, named after its day', () => {
    const { unmount } = render(<PlPlaceTexts description="" notes="" dayNotes={null} onChange={vi.fn()} t={t} />);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    unmount();

    const onChange = setup({ dayNotes: 'Meet at 9', dayNumber: 2 });
    fireEvent.click(screen.getByRole('tab', { name: 'places.notesTabDayN:2' }));
    expect(screen.getByLabelText('places.assignmentNotes')).toHaveValue('Meet at 9');
    fireEvent.change(screen.getByLabelText('places.assignmentNotes'), { target: { value: 'Meet at 10' } });
    expect(onChange).toHaveBeenLastCalledWith('assignment_notes', 'Meet at 10');
  });
});
