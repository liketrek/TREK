import { useEffect, useEffectEvent, useMemo, useState } from 'react';

import { useTranslation } from '../../i18n';
import { useTripStore } from '../../store/tripStore';
import type { BudgetItem, BudgetItemReceipt } from '../../types';
import { amountToInputString } from '../../utils/formatters';
import { localToday } from '../Planner/today';
import { useToast } from '../shared/Toast';
import { SYMBOLS } from './BudgetPanel.constants';
import type { TripMember } from './BudgetPanelMemberChips';
import type { ExpensePrefill } from './CostsPanel';
import {
  amountPattern,
  calculateTicketShares,
  hasTicketSplit,
  newExpenseSeed,
  payersBalanced,
  readTicketItems,
  readUserNote,
  rebalancePayers,
  splitEqualShares,
  writeTicketItems,
  type TicketItem,
} from './CostsPanel.helpers';
import { catMeta } from './costsCategories';
import { useExpenseFx } from './expenseFx';
import { saveWithReceipts } from './receiptUploads';

export type ExpenseSplitMode = 'equally' | 'custom' | 'ticket';

/** Keeps the local ids of ticket lines added in the same millisecond apart. */
let ticketItemSeq = 0;

/**
 * The expense editor behind the desktop ExpenseModal and the phone MCostSheet:
 * name, category, amount and currency, payers, the Equally / Custom / Ticket
 * splits, the note and the receipts, what makes the entry valid, and the save
 * through the trip store. Both surfaces lay it out their own way.
 *
 * Where the two save differently today, the surface says which way:
 * `oneSaveAtATime` (phone) ignores a save while one is out; `keepSavingOnSuccess`
 * (phone) leaves the form busy after a save that went through, as the sheet closes.
 */
export function useExpenseForm({
  tripId,
  base,
  people,
  me,
  editing,
  prefill,
  onSaved,
  oneSaveAtATime = false,
  keepSavingOnSuccess = false,
}: {
  tripId: number;
  base: string;
  people: TripMember[];
  me: number;
  editing: BudgetItem | null;
  prefill?: ExpensePrefill;
  onSaved: () => void;
  oneSaveAtATime?: boolean;
  keepSavingOnSuccess?: boolean;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const addBudgetItem = useTripStore((s) => s.addBudgetItem);
  const updateBudgetItem = useTripStore((s) => s.updateBudgetItem);
  const sym = (c: string) => SYMBOLS[c] || c + ' ';
  const nameOf = (p: TripMember) => (p.id === me ? t('costs.you') : p.username);
  // A saved expense without a currency opens in the trip's own (#2525).
  const { tripCurrency: tripCur, editingCurrency, preview } = useExpenseFx(base, editing);

  const [name, setName] = useState(editing?.name || prefill?.name || '');
  const [cat, setCat] = useState<string>(editing ? catMeta(editing.category).key : prefill?.category || 'food');
  const [seed] = useState(() =>
    newExpenseSeed(
      prefill,
      base,
      people.map((p) => p.id),
      localToday()
    )
  );
  const [currency, setCurrency] = useState(editing ? editingCurrency : seed.currency);
  const [day, setDay] = useState(editing ? editing.expense_date || localToday() : seed.day);
  const [note, setNote] = useState(() => readUserNote(editing));
  // Edit and prefill seeds are padded to the currency's decimals (#2175): the DB
  // returns numbers, so a saved 4,90 would otherwise reopen as "4,9" and a saved
  // 5,00 as "5".
  const [total, setTotal] = useState<string>(() => {
    if (editing) return editing.total_price ? amountToInputString(editing.total_price, editingCurrency) : '';
    return seed.total;
  });
  const [participants, setParticipants] = useState<Set<number>>(() =>
    editing ? new Set((editing.members || []).map((m) => m.user_id)) : new Set(people.map((p) => p.id))
  );

  // Payer state. An expense can be fronted by several people, each with their own
  // amount (budget_item_payers): a shared card, or "I got this round, you get the
  // next". The single-payer choice stays the default path; multiPayer swaps in a
  // per-person amount editor. 0 represents "Nobody (planning entry)"; on an
  // existing expense a missing payer is a deliberate choice, so only a brand-new
  // one defaults to me. A negative payer (the recipient of a refund, #2176) is a
  // real payer: filtering on > 0 here would silently drop them on save.
  const initialPayers = (editing?.payers || []).filter((p) => p.amount !== 0);

  const [payerId, setPayerId] = useState<number>(() => {
    const existingPayer = initialPayers[0];
    if (existingPayer) return existingPayer.user_id;
    return editing ? 0 : me;
  });
  const [multiPayer, setMultiPayer] = useState(() => initialPayers.length > 1);
  const [payerIds, setPayerIds] = useState<Set<number>>(() => new Set(initialPayers.map((p) => p.user_id)));
  const [payerAmounts, setPayerAmounts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    for (const p of initialPayers) m[p.user_id] = amountToInputString(p.amount, currency);
    return m;
  });
  // Payers the user typed an amount for: rebalance leaves these alone and makes
  // the others absorb the remainder.
  const [pinnedPayers, setPinnedPayers] = useState<Set<number>>(() => new Set(initialPayers.map((p) => p.user_id)));

  const [splitMode, setSplitMode] = useState<ExpenseSplitMode>(() => {
    if (hasTicketSplit(editing)) return 'ticket';
    if (editing && editing.members && editing.members.length > 0) {
      const hasCustom = editing.members.some((m) => m.amount !== null && m.amount !== undefined);
      return hasCustom ? 'custom' : 'equally';
    }
    return 'equally';
  });

  const [ticketItems, setTicketItems] = useState<TicketItem[]>(() =>
    editing ? readTicketItems(editing) : seed.ticketItems
  );

  const [customAmounts, setCustomAmounts] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {};
    if (editing && editing.members) {
      for (const member of editing.members) {
        if (member.amount !== null && member.amount !== undefined) {
          m[member.user_id] = amountToInputString(member.amount, currency);
        }
      }
    }
    return m;
  });

  const [receipts, setReceipts] = useState<BudgetItemReceipt[]>(() => editing?.receipts || []);
  const [pendingReceiptFiles, setPendingReceiptFiles] = useState<File[]>(() => (editing ? [] : seed.receiptFiles));
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [previewReceipts, setPreviewReceipts] = useState<{
    receipts: BudgetItemReceipt[];
    initialIndex: number;
  } | null>(null);

  const handleReceiptFileSelect = (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setPendingReceiptFiles((prev) => [...prev, ...Array.from(files)]);
  };

  const handleRemoveReceipt = (receiptId: number) => {
    setReceipts((prev) => prev.filter((r) => r.id !== receiptId));
  };

  const handleRemovePendingReceipt = (index: number) => {
    setPendingReceiptFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const [saving, setSaving] = useState(false);

  const isTicketMode = splitMode === 'ticket';
  const ticketInfo = useMemo(() => calculateTicketShares(ticketItems), [ticketItems]);

  const totalNum = isTicketMode ? ticketInfo.total : Number.parseFloat(total) || 0;
  const fx = preview(totalNum, currency);
  const splitSum = [...participants].reduce((sum, id) => sum + (Number.parseFloat(customAmounts[id]) || 0), 0);
  const customBalanced = Math.round(splitSum * 100) === Math.round(totalNum * 100);
  // How much is still to be handed out, read on the total's own side: on a refund
  // (#2176) the shares run negative, so a plain total minus sum flips under and
  // over around and sends the user the wrong way.
  const splitShortfall = totalNum < 0 ? splitSum - totalNum : totalNum - splitSum;
  const each = participants.size > 0 ? totalNum / participants.size : 0;
  const equalShares = useMemo(
    () =>
      splitEqualShares(
        totalNum,
        [...participants].map((id) => ({ user_id: id })),
        editing?.id || 0
      ),
    [totalNum, participants, editing]
  );

  const placeholderShares = useMemo(() => {
    const emptyParts = [...participants].filter((id) => !customAmounts[id]);
    if (emptyParts.length === 0) return {};
    const enteredSum = [...participants]
      .filter((id) => customAmounts[id])
      .reduce((sum, id) => sum + (Number.parseFloat(customAmounts[id]) || 0), 0);
    // Clamped toward zero on the total's own side, so an over-entered positive
    // split never suggests negative leftovers, while a negative total (#2176)
    // still previews its negative equal shares.
    const rest = totalNum - enteredSum;
    const remaining = totalNum >= 0 ? Math.max(0, rest) : Math.min(0, rest);
    return splitEqualShares(
      remaining,
      emptyParts.map((id) => ({ user_id: id })),
      editing?.id || 0
    );
  }, [totalNum, participants, customAmounts, editing]);

  const ticketValid =
    ticketItems.length > 0 &&
    ticketItems.every(
      (item) => item.name.trim().length > 0 && (Number.parseFloat(item.price) || 0) > 0 && item.participants.size > 0
    );
  const payersOk = !multiPayer || (payerIds.size > 0 && payersBalanced(payerAmounts, payerIds, totalNum));
  // A negative total is a valid entry (a refund, #2176); only zero has nothing to say.
  const valid =
    name.trim().length > 0 &&
    payersOk &&
    (isTicketMode
      ? ticketValid
      : totalNum !== 0 && (participants.size === 0 || splitMode === 'equally' || customBalanced));

  const onTotalChange = (v: string) => setTotal(v.replace(',', '.'));

  // Keep the payer amounts summing to the total as it changes, including in ticket
  // mode, where the total is derived from the ticket items rather than typed. Only
  // a new total triggers it; the payer state is read as it stands then.
  const rebalanceToTotal = useEffectEvent(() => {
    if (!multiPayer) return;
    setPayerAmounts((prev) => rebalancePayers(prev, pinnedPayers, payerIds, totalNum));
  });
  useEffect(() => {
    rebalanceToTotal();
  }, [totalNum]);

  const enableMultiPayer = () => {
    const startPayers = payerIds.size > 0 ? new Set(payerIds) : new Set<number>([payerId > 0 ? payerId : me]);
    const pinned = new Set<number>();
    setPayerIds(startPayers);
    setPinnedPayers(pinned);
    setPayerAmounts((prev) => rebalancePayers(prev, pinned, startPayers, totalNum));
    setMultiPayer(true);
  };

  const disableMultiPayer = () => {
    // Collapsing back keeps the first payer; their amount becomes the whole total.
    const [first] = [...payerIds];
    setPayerId(first ?? me);
    setMultiPayer(false);
  };

  const togglePayer = (id: number) => {
    const nextIds = new Set(payerIds);
    const nextPinned = new Set(pinnedPayers);
    if (nextIds.has(id)) {
      nextIds.delete(id);
      nextPinned.delete(id);
    } else {
      nextIds.add(id);
    }
    setPayerIds(nextIds);
    setPinnedPayers(nextPinned);
    setPayerAmounts((prev) => rebalancePayers(prev, nextPinned, nextIds, totalNum));
  };

  const onPayerAmountChange = (id: number, v: string) => {
    const val = v.replace(',', '.');
    const nextPinned = new Set(pinnedPayers);
    nextPinned.add(id);
    setPinnedPayers(nextPinned);
    setPayerAmounts((prev) => rebalancePayers({ ...prev, [id]: val }, nextPinned, payerIds, totalNum));
  };

  const handleCustomAmountChange = (id: number, raw: string) => {
    const val = raw.replace(',', '.');
    if (val === '' || amountPattern(currency, true).test(val)) {
      setCustomAmounts((prev) => ({ ...prev, [id]: val }));
    }
  };

  const handleAddEmptyItem = () => {
    setTicketItems((prev) => [
      ...prev,
      { id: `${Date.now()}-${++ticketItemSeq}`, name: '', price: '', participants: new Set(people.map((p) => p.id)) },
    ]);
  };

  const handleUpdateItemName = (id: string, itemName: string) => {
    setTicketItems((prev) => prev.map((item) => (item.id === id ? { ...item, name: itemName } : item)));
  };

  const handleUpdateItemPrice = (id: string, raw: string) => {
    const price = raw.replace(',', '.');
    if (price === '' || amountPattern(currency, false).test(price)) {
      setTicketItems((prev) => prev.map((item) => (item.id === id ? { ...item, price } : item)));
    }
  };

  const handleRemoveItem = (id: string) => {
    setTicketItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleItemParticipant = (itemId: string, userId: number) => {
    setTicketItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const nextParts = new Set(item.participants);
        if (nextParts.has(userId)) nextParts.delete(userId);
        else nextParts.add(userId);
        return { ...item, participants: nextParts };
      })
    );
  };

  const toggleParticipant = (id: number) => {
    const nextParts = new Set(participants);
    if (nextParts.has(id)) {
      nextParts.delete(id);
      setCustomAmounts((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } else {
      nextParts.add(id);
    }
    setParticipants(nextParts);
  };

  const save = async () => {
    if (!valid || (oneSaveAtATime && saving)) return;
    setSaving(true);
    // A picked payer always goes out, even when nobody shares the expense: the
    // server re-derives total_price from the payer sum (CostsPanel.helpers), so
    // dropping the payer would store the entry with a total of 0.
    const payerList = multiPayer
      ? [...payerIds]
          .map((id) => ({ user_id: id, amount: Number.parseFloat(payerAmounts[id]) || 0 }))
          .filter((p) => p.amount !== 0)
      : payerId > 0
        ? [{ user_id: payerId, amount: totalNum }]
        : [];
    // A receipt line can name somebody who is not ticked as a participant. Sending
    // only the ticked set would drop their share, leaving the member sum short of
    // total_price and handing the settlement a difference it can never clear (#1382).
    const memberIds =
      splitMode === 'ticket'
        ? [...new Set([...participants, ...Object.keys(ticketInfo.shares).map(Number)])].sort((a, b) => a - b)
        : [...participants];
    const memberList = memberIds.map((id) => ({
      user_id: id,
      amount:
        splitMode === 'custom'
          ? Number.parseFloat(customAmounts[id]) || 0
          : splitMode === 'ticket'
            ? ticketInfo.shares[id] || 0
            : null,
    }));
    const data = {
      name: name.trim(),
      category: cat,
      currency,
      payers: payerList,
      members: memberList,
      member_ids: memberIds,
      expense_date: day || null,
      total_price: totalNum,
      note: note.trim() || null,
      ticket_json: splitMode === 'ticket' ? writeTicketItems(ticketItems) : null,
      ...(!editing && prefill?.reservationId ? { reservation_id: prefill.reservationId } : {}),
      ...(!editing && prefill?.placeId ? { place_id: prefill.placeId } : {}),
    };
    try {
      setUploadingReceipt(pendingReceiptFiles.length > 0);
      await saveWithReceipts(tripId, pendingReceiptFiles, editing ? editing.id : null, (ids) =>
        editing
          ? updateBudgetItem(tripId, editing.id, { ...data, receipt_file_ids: [...receipts.map((r) => r.id), ...ids] })
          : addBudgetItem(tripId, { ...data, receipt_file_ids: ids })
      );
      // Only cleared once the save went through, so a retry after a failure
      // does not upload a second copy of every file.
      setPendingReceiptFiles([]);
      onSaved();
    } catch (err) {
      // A receipt the rollback could not remove is still on the trip, and the
      // user is the only one who can clear it out of the Files tab.
      const stuck = (err as { stuckReceiptIds?: number[] })?.stuckReceiptIds;
      toast.error(stuck?.length ? t('costs.receiptLeftBehind', { count: stuck.length }) : t('common.unknownError'));
      if (keepSavingOnSuccess) setSaving(false);
    } finally {
      setUploadingReceipt(false);
      if (!keepSavingOnSuccess) setSaving(false);
    }
  };

  return {
    sym,
    nameOf,
    tripCur,
    name,
    setName,
    cat,
    setCat,
    currency,
    setCurrency,
    day,
    setDay,
    note,
    setNote,
    total,
    onTotalChange,
    totalNum,
    fx,
    participants,
    toggleParticipant,
    payerId,
    setPayerId,
    multiPayer,
    enableMultiPayer,
    disableMultiPayer,
    payerIds,
    payerAmounts,
    togglePayer,
    onPayerAmountChange,
    payersOk,
    splitMode,
    setSplitMode,
    isTicketMode,
    ticketItems,
    ticketInfo,
    handleAddEmptyItem,
    handleUpdateItemName,
    handleUpdateItemPrice,
    handleRemoveItem,
    handleToggleItemParticipant,
    customAmounts,
    setCustomAmounts,
    handleCustomAmountChange,
    splitSum,
    customBalanced,
    splitShortfall,
    each,
    equalShares,
    placeholderShares,
    receipts,
    pendingReceiptFiles,
    uploadingReceipt,
    handleReceiptFileSelect,
    handleRemoveReceipt,
    handleRemovePendingReceipt,
    previewReceipts,
    setPreviewReceipts,
    valid,
    saving,
    save,
  };
}
