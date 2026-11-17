// FE-PLANNER-PLFORMTAGS-001 to FE-PLANNER-PLFORMTAGS-007: the markup of the place form's tags
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
    newColor: '#ec4899',
    setNewColor: vi.fn(),
    recolor: vi.fn(() => Promise.resolve()),
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
    expect(within(screen.getByRole('group', { name: 'places.tags' })).getAllByRole('button')).toHaveLength(2);
    unmount();

    const ready = field({ name: 'Viewpoint', canAdd: true });
    render(<PlaceFormTags tags={ready} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'places.addTag' }));
    expect(ready.addNew).toHaveBeenCalledTimes(1);
  });

  it("FE-PLANNER-PLFORMTAGS-005: a tag's dot opens the palette, and a swatch recolours the tag and closes it", () => {
    const tags = field();
    render(<PlaceFormTags tags={tags} t={t} />);
    // The mock t ignores the name, so the first dot is Monument's.
    const dot = screen.getAllByRole('button', { name: 'places.tagColor' })[0];
    expect(screen.queryByRole('button', { name: '#10b981' })).not.toBeInTheDocument();
    fireEvent.click(dot);
    expect(dot).toHaveAttribute('aria-expanded', 'true');
    // The tag's own colour is the one marked.
    expect(screen.getByRole('button', { name: '#6366f1' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '#10b981' }));
    expect(tags.recolor).toHaveBeenCalledWith(7, '#10b981');
    expect(screen.queryByRole('button', { name: '#10b981' })).not.toBeInTheDocument();
  });

  it("FE-PLANNER-PLFORMTAGS-006: the new tag's colour is picked the same way and tints the field once a name is typed", () => {
    const tags = field({ name: 'Food' });
    render(<PlaceFormTags tags={tags} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'places.newTagColor' }));
    fireEvent.click(screen.getByRole('button', { name: '#f97316' }));
    expect(tags.setNewColor).toHaveBeenCalledWith('#f97316');
    expect(tags.recolor).not.toHaveBeenCalled();
    const pill = screen.getByRole('textbox', { name: 'places.newTag' }).parentElement as HTMLElement;
    expect(pill.style.background).toContain('#ec4899');
  });

  it('FE-PLANNER-PLFORMTAGS-007: Escape and a click outside close the palette without a pick', () => {
    const tags = field();
    render(<PlaceFormTags tags={tags} t={t} />);
    const onDialogKey = vi.fn();
    document.addEventListener('keydown', onDialogKey);
    fireEvent.click(screen.getByRole('button', { name: 'places.newTagColor' }));
    fireEvent.keyDown(screen.getByRole('button', { name: '#f97316' }), { key: 'Escape' });
    expect(screen.queryByRole('button', { name: '#f97316' })).not.toBeInTheDocument();
    // Escape stays in the palette and does not reach the dialog around it.
    expect(onDialogKey).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onDialogKey);

    fireEvent.click(screen.getByRole('button', { name: 'places.newTagColor' }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('button', { name: '#f97316' })).not.toBeInTheDocument();
    expect(tags.setNewColor).not.toHaveBeenCalled();
  });
});
