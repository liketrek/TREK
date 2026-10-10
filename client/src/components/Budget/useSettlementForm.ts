import { useEffect, useState } from 'react';

import { budgetApi } from '../../api/client';
import { withFallbackFx } from '../../hooks/useExchangeRates';
import { amountToInputString } from '../../utils/formatters';
import { localToday } from '../Planner/today';
import { settlementDate } from './CostsPanel.helpers';
import type { CostsSettlement } from './costsModel';

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  error: (message: string) => void;
}

/**
 * Recording or editing a settle-up payment, behind the desktop payment dialog and
 * the phone payment sheet: who paid whom, how much in which currency, the day and
 * a note. A transfer can be made in any currency (paying a rouble debt in euros is
 * normal), so it carries its own, defaulting to the display currency `base`; a
 * reopened one keeps the currency it was recorded in, and the server freezes its
 * rate on write the way an expense's is frozen.
 *
 * The desktop dialog is mounted per payment and starts from `editing`. The phone
 * sheet stays mounted and passes `open`: the form starts over from `editing` each
 * time it opens, and a save while one is out is ignored (`oneSaveAtATime`).
 */
export function useSettlementForm({
  tripId,
  tripCurrency,
  base,
  people,
  me,
  editing,
  open,
  t,
  toast,
  onSaved,
  oneSaveAtATime = false,
}: {
  tripId: number;
  tripCurrency: string;
  base: string;
  people: { id: number }[];
  me: number;
  editing: CostsSettlement | null;
  open?: boolean;
  t: Translate;
  toast: Toaster;
  onSaved: () => void;
  oneSaveAtATime?: boolean;
}) {
  // The phone sheet starts blank and fills in from `editing` once it opens.
  const seed = open === undefined ? editing : null;
  const [fromId, setFromId] = useState<number>(() => seed?.from_user_id ?? me);
  const [toId, setToId] = useState<number>(() => seed?.to_user_id ?? people.find((p) => p.id !== me)?.id ?? me);
  // Seeded with the transfer's own currency decimals, so a reopened 4,90 reads
  // "4.90" and not "4.9" (#2175), and a JPY transfer gets no fake decimals.
  const [amount, setAmount] = useState<string>(() =>
    seed ? amountToInputString(seed.amount, (seed.currency || base).toUpperCase()) : ''
  );
  const [currency, setCurrency] = useState<string>(() => (seed?.currency || base).toUpperCase());
  const [day, setDay] = useState(() => (seed ? settlementDate(seed) : localToday()));
  const [note, setNote] = useState(seed?.note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cur = (editing?.currency || base).toUpperCase();
    setFromId(editing?.from_user_id ?? me);
    setToId(editing?.to_user_id ?? people.find((p) => p.id !== me)?.id ?? me);
    setAmount(editing ? amountToInputString(editing.amount, cur) : '');
    setCurrency(cur);
    setDay(editing ? settlementDate(editing) : localToday());
    setNote(editing?.note || '');
    setSaving(false);
  }, [open, editing, me, base, people]);

  const amt = Number.parseFloat(amount.replace(',', '.')) || 0;
  const valid = amt > 0 && fromId !== toId && !!day;

  const save = async () => {
    if (!valid || (oneSaveAtATime && saving)) return;
    setSaving(true);
    const data = withFallbackFx(
      { from_user_id: fromId, to_user_id: toId, amount: amt, currency, settled_at: day, note: note.trim() || null },
      tripCurrency
    );
    try {
      if (editing) await budgetApi.updateSettlement(tripId, editing.id, data);
      else await budgetApi.createSettlement(tripId, data);
      onSaved();
    } catch {
      toast.error(t('common.unknownError'));
    } finally {
      setSaving(false);
    }
  };

  return {
    fromId,
    setFromId,
    toId,
    setToId,
    amount,
    setAmount,
    currency,
    setCurrency,
    day,
    setDay,
    note,
    setNote,
    saving,
    valid,
    save,
  };
}
