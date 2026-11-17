// FE-PLANNER-PLFORMTAGS-001 to FE-PLANNER-PLFORMTAGS-004: the markup of the place form's tags
// on the desktop. The state behind it is usePlaceTags', tested on its own.
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, within } from '../../../tests/helpers/render';
import { PlaceFormTags } from './PlaceFormTags';
import type { PlaceTagsField } from './usePlaceTags';

const t = (key: string) => key;

function field(overrides: Partial<PlaceTagsField> = {}): PlaceTagsField {
  return {
    options: [
      { id: 7, name: 'Monument', color: '#6366f1', on: true },
      { id: 8, name: 'Zone', on: false },
    ],
    toggle: vi.fn(),
    name: '',
    setName: vi.fn(),
    saving: false,
    canAdd: false,
    addNew: vi.fn(() => Promise.resolve()),
    handleNameKey: vi.fn(),
    ...overrides,
  };
}

describe('PlaceFormTags', () => {
  it('FE-PLANNER-PLFORMTAGS-001: shows every tag on offer as a switch that says whether it is on', () => {
    render(<PlaceFormTags tags={field()} t={t} />);
    const group = screen.getByRole('group', { name: 'places.tags' });
    expect(within(group).getByRole('button', { name: 'Monument' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'Zone' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-PLANNER-PLFORMTAGS-002: a click on a tag switches that tag', () => {
    const tags = field();
    render(<PlaceFormTags tags={tags} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zone' }));
    expect(tags.toggle).toHaveBeenCalledTimes(1);
    expect(tags.toggle).toHaveBeenCalledWith(8);
  });

  it('FE-PLANNER-PLFORMTAGS-003: the name of a new tag is typed into the field, whose keys go to the hook', () => {
    const tags = field({ name: 'View' });
    render(<PlaceFormTags tags={tags} t={t} />);
    const input = screen.getByRole('textbox', { name: 'places.newTag' });
    expect(input).toHaveValue('View');
    expect(input).toHaveAttribute('maxlength', '50');
    fireEvent.change(input, { target: { value: 'Viewpoint' } });
    expect(tags.setName).toHaveBeenCalledWith('Viewpoint');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(tags.handleNameKey).toHaveBeenCalledTimes(1);
  });

  it('FE-PLANNER-PLFORMTAGS-004: the add button waits for a name, then adds the tag; a trip without tags shows the field alone', () => {
    const idle = field({ options: [] });
    const { unmount } = render(<PlaceFormTags tags={idle} t={t} />);
    expect(screen.getByRole('button', { name: 'places.addTag' })).toBeDisabled();
    expect(within(screen.getByRole('group', { name: 'places.tags' })).getAllByRole('button')).toHaveLength(1);
    unmount();

    const ready = field({ name: 'Viewpoint', canAdd: true });
    render(<PlaceFormTags tags={ready} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'places.addTag' }));
    expect(ready.addNew).toHaveBeenCalledTimes(1);
  });
});
