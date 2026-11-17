// FE-MOB-PLTAGS-001 to FE-MOB-PLTAGS-005: the phone's tag markup, which is the picker of the
// place form (its state is usePlaceTags', tested on its own) and the chips of the place sheet.
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, render, screen, within } from '../../../../../tests/helpers/render';
import type { PlaceTagsField } from '../../../../components/Planner/usePlaceTags';
import { PlTagChips, PlTagPicker } from './PlTags';

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

describe('PlTagPicker', () => {
  it('FE-MOB-PLTAGS-001: labels the tags and shows each as a chip that says whether it is on', () => {
    render(<PlTagPicker tags={field()} t={t} />);
    expect(screen.getAllByText('places.tags').length).toBeGreaterThan(0);
    const group = screen.getByRole('group', { name: 'places.tags' });
    expect(within(group).getByRole('button', { name: 'Monument' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(group).getByRole('button', { name: 'Zone' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('FE-MOB-PLTAGS-002: a tap on a chip switches that tag', () => {
    const tags = field();
    render(<PlTagPicker tags={tags} t={t} />);
    fireEvent.click(screen.getByRole('button', { name: 'Monument' }));
    expect(tags.toggle).toHaveBeenCalledTimes(1);
    expect(tags.toggle).toHaveBeenCalledWith(7);
  });

  it('FE-MOB-PLTAGS-003: a new tag is typed and confirmed, and the confirm waits for a name', () => {
    const idle = field();
    const { unmount } = render(<PlTagPicker tags={idle} t={t} />);
    expect(screen.getByRole('button', { name: 'places.addTag' })).toBeDisabled();
    const input = screen.getByRole('textbox', { name: 'places.newTag' });
    fireEvent.change(input, { target: { value: 'Viewpoint' } });
    expect(idle.setName).toHaveBeenCalledWith('Viewpoint');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(idle.handleNameKey).toHaveBeenCalledTimes(1);
    unmount();

    const ready = field({ name: 'Viewpoint', canAdd: true });
    render(<PlTagPicker tags={ready} t={t} />);
    expect(screen.getByRole('textbox', { name: 'places.newTag' })).toHaveValue('Viewpoint');
    fireEvent.click(screen.getByRole('button', { name: 'places.addTag' }));
    expect(ready.addNew).toHaveBeenCalledTimes(1);
  });
});

describe('PlTagChips', () => {
  it('FE-MOB-PLTAGS-004: shows the tags a place carries, each once and by name', () => {
    const { container } = render(
      <PlTagChips
        tags={[
          { id: 8, name: 'Zone', color: '#10b981' },
          { id: 7, name: 'Monument' },
          { id: 8, name: 'Zone' },
        ]}
      />
    );
    expect(screen.getByText('Monument')).toBeInTheDocument();
    expect(screen.getAllByText('Zone')).toHaveLength(1);
    expect(container.textContent).toBe('MonumentZone');
  });

  it('FE-MOB-PLTAGS-005: draws nothing for a place without tags, or with tags that have no name yet', () => {
    const { container, rerender } = render(<PlTagChips tags={undefined} />);
    expect(container).toBeEmptyDOMElement();
    rerender(<PlTagChips tags={[{ id: 9 }]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
