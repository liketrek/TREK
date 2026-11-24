// FE-PLANNER-PLFORMTEXTS-001 to FE-PLANNER-PLFORMTEXTS-004: the place form's three texts in one card.
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, within } from '../../../tests/helpers/render';
import { PlaceFormTexts } from './PlaceFormTexts';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${Object.values(params).join(',')}` : key;

function renderTexts(overrides: Partial<Parameters<typeof PlaceFormTexts>[0]> = {}) {
  const onChange = vi.fn();
  render(
    <PlaceFormTexts
      fieldId="f"
      description="A tower"
      notes=""
      dayNotes={null}
      onChange={onChange}
      t={t}
      {...overrides}
    />
  );
  return onChange;
}

const tabs = () => within(screen.getByRole('group', { name: 'places.notesKind' }));

describe('PlaceFormTexts', () => {
  it('FE-PLANNER-PLFORMTEXTS-001: shows one text at a time, with the line on where it appears', () => {
    renderTexts();
    expect(tabs().getByRole('button', { name: 'places.notesTabAbout' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('places.formDescription')).toBeVisible();
    expect(screen.getByLabelText('places.formNotes')).not.toBeVisible();
    expect(screen.getByLabelText('places.formDescription')).toHaveAccessibleDescription('places.notesHintDescription');

    fireEvent.click(tabs().getByRole('button', { name: 'places.formNotes' }));
    expect(screen.getByLabelText('places.formNotes')).toBeVisible();
    expect(screen.getByLabelText('places.formDescription')).not.toBeVisible();
  });

  it('FE-PLANNER-PLFORMTEXTS-002: each text writes its own field, and both keep their text while hidden', () => {
    const onChange = renderTexts({ notes: 'Book ahead' });
    fireEvent.change(screen.getByLabelText('places.formDescription'), { target: { value: 'A tall tower' } });
    expect(onChange).toHaveBeenLastCalledWith('description', 'A tall tower');
    expect(screen.getByLabelText('places.formNotes')).toHaveValue('Book ahead');
    fireEvent.change(screen.getByLabelText('places.formNotes'), { target: { value: 'Book early' } });
    expect(onChange).toHaveBeenLastCalledWith('notes', 'Book early');
  });

  it('FE-PLANNER-PLFORMTEXTS-003: the day tab is there only with a visit in context, named after its day', () => {
    renderTexts();
    expect(tabs().getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByLabelText('places.assignmentNotes')).not.toBeInTheDocument();
  });

  it('FE-PLANNER-PLFORMTEXTS-004: the day note is plain text under the tab of its day', () => {
    const onChange = renderTexts({ dayNotes: 'Meet at 9', dayNumber: 3 });
    const day = tabs().getByRole('button', { name: 'places.notesTabDayN:3' });
    fireEvent.click(day);
    const field = screen.getByLabelText('places.assignmentNotes');
    expect(field).toBeVisible();
    expect(field).toHaveValue('Meet at 9');
    fireEvent.change(field, { target: { value: 'Meet at 10' } });
    expect(onChange).toHaveBeenLastCalledWith('assignment_notes', 'Meet at 10');
  });
});
