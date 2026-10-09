import { useCallback, useEffect, useState } from 'react';

import apiClient from '../../api/client';
import { useTranslation } from '../../i18n';
import { getApiErrorMessage } from '../../types';
import { useToast } from '../shared/Toast';

interface VacayUserPickerOptions {
  /** Where the users that can be picked come from. */
  endpoint: '/addons/vacay/available-users' | '/addons/vacay/shares/available-users';
  /** What sending does with the picked user. */
  submit: (userId: number) => Promise<void>;
  successKey: string;
  errorKey: string;
  /**
   * The phone sheets pass their open flag: every opening clears the pick, folds
   * the inline user list and reloads the users. The desktop dialogs leave it out
   * and load on their own.
   */
  sheetOpen?: boolean;
}

/**
 * Picking another TREK user for a vacay action and sending it: the fusion invite
 * and the read-only calendar share. Each view keeps its own dialog or sheet.
 */
export function useVacayUserPicker<U extends { id: number; username: string }>({
  endpoint,
  submit,
  successKey,
  errorKey,
  sheetOpen,
}: VacayUserPickerOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [available, setAvailable] = useState<U[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  /** Whether the inline user list of a phone sheet is unfolded. */
  const [pickerOpen, setPickerOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.get(endpoint).then((r) => r.data);
      setAvailable(data.users);
    } catch {
      // A failed load empties the list, so nobody picks from a stale one and the
      // dialog or sheet shows its "no users available" state.
      setAvailable([]);
    }
  }, [endpoint]);

  useEffect(() => {
    if (!sheetOpen) return;
    setSelected(null);
    setPickerOpen(false);
    void load();
  }, [sheetOpen, load]);

  const togglePicker = () => setPickerOpen((o) => !o);

  /** Picks a user from the inline list and folds it. */
  const pick = (userId: number) => {
    setSelected(userId);
    setPickerOpen(false);
  };

  /** Sends to the picked user; `onSent` runs right after the success toast. */
  const send = async (onSent: () => void) => {
    if (!selected) return;
    setSending(true);
    try {
      await submit(selected);
      toast.success(t(successKey));
      onSent();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, t(errorKey)));
    } finally {
      setSending(false);
    }
  };

  const selectedUser = available.find((u) => u.id === selected);

  return {
    available,
    selected,
    setSelected,
    selectedUser,
    sending,
    load,
    send,
    pickerOpen,
    togglePicker,
    pick,
  };
}
