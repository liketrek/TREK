import { useMemo, useState, type Dispatch, type KeyboardEvent, type SetStateAction } from 'react';

import type { useTranslation } from '../../i18n';
import { useTripStore } from '../../store/tripStore';
import type { Place } from '../../types';
import { offlineOr } from '../../utils/needsConnection';
import { nextTagColor, placeTagIds, tagChoices } from '../../utils/placeTags';
import type { useToast } from '../shared/Toast';
import type { PlaceFormData } from './PlaceFormModal.helpers';

type Translate = ReturnType<typeof useTranslation>['t'];
type Toast = ReturnType<typeof useToast>;

interface PlaceTagsOptions {
  tripId: number | string;
  /** The place being edited, for the tags it carries already; none while a place is being added. */
  place: Pick<Place, 'tags'> | null | undefined;
  /** The form's own tags: absent until one is ticked or unticked. */
  tags: PlaceFormData['tags'];
  setForm: Dispatch<SetStateAction<PlaceFormData>>;
  t: Translate;
  toast: Toast;
}

/**
 * The tags of the place form: the one logic path behind the desktop dialog and the
 * phone sheet, which draw their own markup over it. It offers the trip's tags and any
 * personal tag the place carries already, keeps which of them are ticked in the form
 * itself, so the save sends them, and adds a new tag to the trip, ticked straight away.
 */
export function usePlaceTags({ tripId, place, tags, setForm, t, toast }: PlaceTagsOptions) {
  const tripTags = useTripStore((s) => s.tripTags);
  const addTripTag = useTripStore((s) => s.addTripTag);
  const updateTripTag = useTripStore((s) => s.updateTripTag);
  const carried = place?.tags;
  const saved = useMemo(() => placeTagIds(carried), [carried]);
  const selected = tags ?? saved;
  const options = useMemo(
    () => tagChoices(tripTags, carried).map((tag) => ({ ...tag, on: selected.includes(tag.id) })),
    [tripTags, carried, selected]
  );
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  // The colour picked for the next new tag; until one is picked, the trip's next one in turn.
  const [pickedColor, setNewColor] = useState<string | null>(null);
  const newColor = pickedColor ?? nextTagColor(tripTags);

  /** Changes the ticked set from what it is when the change lands, not from what it was when it was asked for. */
  const change = (next: (ids: number[]) => number[]) =>
    setForm((prev) => ({ ...prev, tags: next(prev.tags ?? saved) }));

  const toggle = (id: number) =>
    change((ids) => (ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id]));

  /** The typed name becomes a tag of the trip, or is the one it has already, and is ticked. */
  const addNew = async () => {
    const wanted = name.trim();
    if (!wanted || saving) return;
    setSaving(true);
    try {
      const tag = await addTripTag(tripId, { name: wanted, color: newColor });
      change((ids) => (ids.includes(tag.id) ? ids : [...ids, tag.id]));
      setName('');
      setNewColor(null);
    } catch {
      toast.error(offlineOr(t, t('places.tagCreateError')));
    } finally {
      setSaving(false);
    }
  };

  /** A new colour for one of the trip's tags, for every place that carries it. */
  const recolor = async (id: number, color: string) => {
    try {
      await updateTripTag(tripId, id, { color });
    } catch {
      toast.error(offlineOr(t, t('places.tagColorError')));
    }
  };

  /** Enter in the name field adds the tag; with a name typed it never reaches the place's own save. */
  const handleNameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !name.trim()) return;
    e.preventDefault();
    void addNew();
  };

  return {
    options,
    toggle,
    name,
    setName,
    newColor,
    setNewColor,
    recolor,
    saving,
    canAdd: !!name.trim() && !saving,
    addNew,
    handleNameKey,
  };
}

export type PlaceTagsField = ReturnType<typeof usePlaceTags>;
