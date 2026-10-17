import type { PackingUpdateBagRequest } from '@trek/shared';
import { useEffect, useState } from 'react';

import type { PackingBag } from '../../types';

/** A stored limit as the field shows it: in kilos, that is how airlines state them. */
export const bagLimitInput = (grams?: number | null) => (grams ? String(grams / 1000) : '');

/**
 * Editing one bag in place, behind the desktop bag card and the phone bag row:
 * its name, its weight limit (typed in kilos, stored in grams) and who carries it.
 *
 * The desktop card keeps its fields on the bag as it changes elsewhere
 * (`followBag`) and leaves a name it did not save as it was typed; the phone row
 * starts its fields from the bag and puts a name it did not save back
 * (`resetUnsavedName`).
 */
export function useBagCardEditor({
  bag,
  onUpdate,
  onSetMembers,
  followBag = false,
  resetUnsavedName = false,
}: {
  bag: PackingBag;
  onUpdate: (data: PackingUpdateBagRequest) => void;
  onSetMembers: (userIds: number[]) => void;
  followBag?: boolean;
  resetUnsavedName?: boolean;
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(bag.name);
  const [editingLimit, setEditingLimit] = useState(false);
  const [limitVal, setLimitVal] = useState(bagLimitInput(bag.weight_limit_grams));

  useEffect(() => {
    if (followBag) setNameVal(bag.name);
  }, [bag.name, followBag]);
  useEffect(() => {
    if (followBag) setLimitVal(bagLimitInput(bag.weight_limit_grams));
  }, [bag.weight_limit_grams, followBag]);

  const saveName = () => {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== bag.name) onUpdate({ name: trimmed });
    else if (resetUnsavedName) setNameVal(bag.name);
    setEditingName(false);
  };
  const cancelName = () => {
    setEditingName(false);
    setNameVal(bag.name);
  };

  const saveLimit = () => {
    setEditingLimit(false);
    const raw = limitVal.trim().replace(',', '.');
    if (raw === '') {
      // Clearing the field removes the limit and puts the bar back on relative scaling.
      if (bag.weight_limit_grams != null) onUpdate({ weight_limit_grams: null });
      return;
    }
    const kg = Number(raw);
    // Anything unparseable or negative leaves the stored limit alone rather than wiping it.
    if (!Number.isFinite(kg) || kg <= 0) {
      setLimitVal(bagLimitInput(bag.weight_limit_grams));
      return;
    }
    const grams = Math.round(kg * 1000);
    if (grams !== bag.weight_limit_grams) onUpdate({ weight_limit_grams: grams });
  };
  const cancelLimit = () => {
    setLimitVal(bagLimitInput(bag.weight_limit_grams));
    setEditingLimit(false);
  };

  const memberIds = (bag.members || []).map((m) => m.user_id);
  const toggleMember = (userId: number) =>
    onSetMembers(memberIds.includes(userId) ? memberIds.filter((id) => id !== userId) : [...memberIds, userId]);

  return {
    editingName,
    setEditingName,
    nameVal,
    setNameVal,
    saveName,
    cancelName,
    editingLimit,
    setEditingLimit,
    limitVal,
    setLimitVal,
    saveLimit,
    cancelLimit,
    memberIds,
    toggleMember,
  };
}
