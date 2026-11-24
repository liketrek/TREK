import { describe, expect, it } from 'vitest';

import { buildPlace, buildTag } from '../../tests/helpers/factories';
import {
  TAG_COLORS,
  nextTagColor,
  placeTagIds,
  tagChanges,
  tagChoices,
  withTagChanges,
  withTripTag,
} from './placeTags';

describe('placeTags', () => {
  it('FE-UTIL-PLTAGS-001: offers each tag once and by name, as the first list that has it says', () => {
    const zone = buildTag({ id: 2, name: 'Zone', color: '#10b981' });
    const monument = buildTag({ id: 1, name: 'Monument', color: '#6366f1' });
    const carried = [
      { id: 2, name: 'Zone (old name)', color: '#000000' },
      { id: 9, name: 'Hidden gem', color: '#f97316' },
    ];
    expect(tagChoices([zone, monument], carried, undefined)).toEqual([
      { id: 9, name: 'Hidden gem', color: '#f97316' },
      { id: 1, name: 'Monument', color: '#6366f1' },
      { id: 2, name: 'Zone', color: '#10b981' },
    ]);
    expect(tagChoices()).toEqual([]);
    expect(tagChoices(undefined)).toEqual([]);
  });

  it('FE-UTIL-PLTAGS-002: leaves out a copy that cannot be shown and a colour that is no plain hex value', () => {
    const choices = tagChoices([
      { name: 'No id' },
      { id: 3 },
      { id: 4, name: 'Painted', color: 'url(https://example.test/pixel)' },
      { id: 5, name: 'Plain' },
    ]);
    expect(choices).toEqual([
      { id: 4, name: 'Painted', color: undefined },
      { id: 5, name: 'Plain', color: undefined },
    ]);
    expect(choices[0].color).toBeUndefined();
  });

  it('FE-UTIL-PLTAGS-003: names the tags of a place by id, each once, whatever else the copy lacks', () => {
    expect(placeTagIds([{ id: 4, name: 'A' }, { id: 5 }, { name: 'No id' }, { id: 4, name: 'A' }])).toEqual([4, 5]);
    expect(placeTagIds(undefined)).toEqual([]);
  });

  it('FE-UTIL-PLTAGS-004: colours new tags by turn', () => {
    const first = nextTagColor([]);
    const second = nextTagColor([buildTag()]);
    expect(first).toMatch(/^#[0-9a-f]{6}$/);
    expect(second).toMatch(/^#[0-9a-f]{6}$/);
    expect(second).not.toBe(first);
    // Past the last colour it starts over.
    expect(nextTagColor(Array.from({ length: TAG_COLORS.length }, () => buildTag()))).toBe(first);
  });

  it('FE-UTIL-PLTAGS-005: adds a tag to the list by name, and replaces the one of the same id', () => {
    const monument = buildTag({ id: 1, name: 'Monument' });
    const zone = buildTag({ id: 2, name: 'Zone' });
    const added = withTripTag([zone], monument);
    expect(added.map((tag) => tag.name)).toEqual(['Monument', 'Zone']);
    const renamed = withTripTag(added, { ...zone, name: 'Area' });
    expect(renamed.map((tag) => [tag.id, tag.name])).toEqual([
      [2, 'Area'],
      [1, 'Monument'],
    ]);
  });

  it('FE-UTIL-PLTAGS-006: tells which tags were renamed, recoloured or deleted between two readings', () => {
    const monument = buildTag({ id: 1, name: 'Monument', color: '#6366f1' });
    const zone = buildTag({ id: 2, name: 'Zone', color: '#10b981' });
    const walk = buildTag({ id: 3, name: 'Walk', color: '#f97316' });
    expect(tagChanges([monument, zone], [monument, zone])).toBeNull();
    // A new tag is on no place yet, so it changes nothing there.
    expect(tagChanges([monument], [monument, zone])).toBeNull();
    const changes = tagChanges(
      [monument, zone, walk],
      [
        { ...monument, name: 'Landmark' },
        { ...walk, color: '#ef4444' },
      ]
    );
    expect([...(changes?.removed ?? [])]).toEqual([2]);
    expect([...(changes?.renamed.keys() ?? [])]).toEqual([1, 3]);
  });

  it('FE-UTIL-PLTAGS-007: takes the changes into the copies a place carries, and leaves an untouched place alone', () => {
    const monument = buildTag({ id: 1, name: 'Monument', color: '#6366f1' });
    const zone = buildTag({ id: 2, name: 'Zone', color: '#10b981' });
    const changes = tagChanges([monument, zone], [{ ...monument, name: 'Landmark', color: '#ef4444' }]);
    if (!changes) throw new Error('expected changes');
    const place = buildPlace({
      tags: [
        { id: 1, name: 'Monument', color: '#6366f1', created_at: '2026-01-01' },
        { id: 2, name: 'Zone' },
        { id: 9, name: 'Own' },
        { name: 'No id' },
      ],
    });
    expect(withTagChanges(place, changes).tags).toEqual([
      { id: 1, name: 'Landmark', color: '#ef4444', created_at: '2026-01-01' },
      { id: 9, name: 'Own' },
      { name: 'No id' },
    ]);
    const untouched = buildPlace({ tags: [{ id: 9, name: 'Own' }] });
    expect(withTagChanges(untouched, changes)).toBe(untouched);
    const untagged = buildPlace();
    expect(withTagChanges(untagged, changes)).toBe(untagged);
  });
});
