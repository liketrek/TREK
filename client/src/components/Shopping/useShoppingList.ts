import { useState, useMemo, useEffect } from 'react';
import { useTripStore } from '../../store/tripStore';
import { useAuthStore } from '../../store/authStore';
import { useCanDo } from '../../store/permissionsStore';
import { useToast } from '../shared/Toast';
import { useTranslation } from '../../i18n';
import apiClient from '../../api/client';
import type { ShoppingItem, TripMember, BudgetItem } from '../../types';
import { filterShoppingItems, groupShoppingItems, type ShoppingFilter } from './shoppingModel';
import { localToday } from '../Planner/today';

export interface ShoppingMember {
  id: number;
  username: string;
  avatar: string | null;
  avatar_url?: string | null;
}

export interface UncheckPromptData {
  item: ShoppingItem;
  linkedExpense: BudgetItem;
  otherItemsCount: number;
}

export function useShoppingList(
  tripId: number,
  items: ShoppingItem[],
  initialMembers?: ShoppingMember[] | TripMember[],
) {
  const {
    addShoppingItem,
    updateShoppingItem,
    deleteShoppingItem,
    toggleShoppingItem,
    clearCheckedShoppingItems,
    reorderShoppingItems,
    addBudgetItem,
    deleteBudgetItem,
    loadBudgetItems,
    budgetItems,
  } = useTripStore();

  const trip = useTripStore(s => s.trip);
  const me = useAuthStore(s => s.user?.id);
  const can = useCanDo();
  const canEdit = can('packing_edit', trip);
  const canEditBudget = can('budget_edit', trip);
  const canTransferToBudget = canEdit && canEditBudget;
  const toast = useToast();
  const { t } = useTranslation();

  const [filter, setFilter] = useState<ShoppingFilter>('all');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Supermarket');

  const [members, setMembers] = useState<ShoppingMember[]>(() => (initialMembers as ShoppingMember[]) || []);
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => me || initialMembers?.[0]?.id || null);

  // Budget transfer modal state
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetDate, setBudgetDate] = useState<string>('');
  const [budgetPayerId, setBudgetPayerId] = useState<number | null>(() => me || initialMembers?.[0]?.id || null);
  const [budgetParticipantIds, setBudgetParticipantIds] = useState<number[]>(() =>
    (initialMembers || []).map(m => m.id),
  );
  const [isSubmittingBudget, setIsSubmittingBudget] = useState(false);

  // Uncheck linked expense prompt state
  const [uncheckPrompt, setUncheckPrompt] = useState<UncheckPromptData | null>(null);

  useEffect(() => {
    if (initialMembers && initialMembers.length > 0) {
      setMembers(initialMembers as ShoppingMember[]);
      setBudgetParticipantIds(prev => (prev.length > 0 ? prev : initialMembers.map(m => m.id)));
      const uid = me || initialMembers[0]?.id || null;
      setCurrentUserId(uid);
      setBudgetPayerId(prev => prev ?? uid);
    }
    apiClient.get(`/trips/${tripId}/members`).then(r => {
      const owner = r.data?.owner;
      const mems = r.data?.members || [];
      const all: ShoppingMember[] = owner ? [owner, ...mems] : mems;
      if (all.length > 0) {
        setMembers(all);
        setBudgetParticipantIds(prev => (prev.length > 0 ? prev : all.map(m => m.id)));
      }
      const uid = r.data?.current_user_id || me || (owner ? owner.id : null);
      setCurrentUserId(uid);
      setBudgetPayerId(prev => prev ?? uid);
    }).catch(() => {});
  }, [tripId, me, initialMembers]);

  const totalCount = items.length;
  const openCount = useMemo(() => items.filter(i => !i.checked).length, [items]);
  const doneCount = useMemo(() => items.filter(i => !!i.checked).length, [items]);

  const filtered = useMemo(() => filterShoppingItems(items, filter), [items, filter]);
  const grouped = useMemo(() => groupShoppingItems(filtered), [filtered]);

  const handleAddItem = async () => {
    if (!canEdit) return;
    const trimmed = newItemName.trim();
    if (!trimmed) return;
    try {
      await addShoppingItem(tripId, {
        name: trimmed,
        quantity: newItemQty.trim() || null,
        category: newItemCategory || null,
        assigned_user_id: null,
      });
      setNewItemName('');
      setNewItemQty('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error adding item');
    }
  };

  const unbookedDoneCount = useMemo(() => items.filter(i => !!i.checked && !i.budget_item_id).length, [items]);

  // Linked expenses must be known to show the badge/prompt even if Costs was never opened.
  const hasLinkedItems = items.some(i => !!i.budget_item_id);
  useEffect(() => {
    if (hasLinkedItems && budgetItems.length === 0) {
      void Promise.resolve(loadBudgetItems(tripId)).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLinkedItems, tripId]);

  const handleToggle = async (id: number, checked: boolean) => {
    if (!canEdit) return;
    const item = items.find(i => i.id === id);
    if (!checked && item?.budget_item_id) {
      const linkedExpense = budgetItems.find(b => b.id === item.budget_item_id);
      if (linkedExpense) {
        const otherItemsCount = items.filter(i => i.id !== id && i.budget_item_id === item.budget_item_id).length;
        setUncheckPrompt({ item, linkedExpense, otherItemsCount });
        return;
      }
    }
    try {
      if (!checked && item?.budget_item_id) {
        await updateShoppingItem(tripId, id, { checked: 0, budget_item_id: null });
      } else {
        await toggleShoppingItem(tripId, id, checked);
      }
    } catch {
      // Toast already surfaced in store slice
    }
  };

  const handleConfirmUncheckKeepExpense = async () => {
    if (!canEdit) return;
    if (!uncheckPrompt) return;
    const { item } = uncheckPrompt;
    setUncheckPrompt(null);
    try {
      await updateShoppingItem(tripId, item.id, { checked: 0, budget_item_id: null });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating item');
    }
  };

  const handleConfirmUncheckDeleteExpense = async () => {
    if (!canTransferToBudget) return;
    if (!uncheckPrompt) return;
    const { item, linkedExpense } = uncheckPrompt;
    setUncheckPrompt(null);
    try {
      await deleteBudgetItem(tripId, linkedExpense.id);
    } catch {
      // Ignore if already deleted
    }
    try {
      await updateShoppingItem(tripId, item.id, { checked: 0, budget_item_id: null });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error updating item');
    }
  };

  const handleCancelUncheck = () => {
    setUncheckPrompt(null);
  };

  const handleDelete = async (id: number) => {
    if (!canEdit) return;
    try {
      await deleteShoppingItem(tripId, id);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error deleting item');
    }
  };

  const handleClearChecked = async () => {
    if (!canEdit) return;
    if (doneCount === 0) return;
    try {
      await clearCheckedShoppingItems(tripId);
      toast.success(t('shopping.clearChecked'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error clearing items');
    }
  };

  const handleReorder = async (orderedIds: number[]) => {
    if (!canEdit) return;
    try {
      await reorderShoppingItems(tripId, orderedIds);
    } catch {
      // Handled in slice
    }
  };

  const handleOpenBudgetModal = () => {
    if (!canTransferToBudget) return;
    setBudgetAmount('');
    setBudgetDate(localToday());
    const defaultParticipants = members.length > 0
      ? members.map(m => m.id)
      : (budgetPayerId ? [budgetPayerId] : (me ? [me] : []));
    setBudgetParticipantIds(defaultParticipants);
    setBudgetModalOpen(true);
  };

  const toggleBudgetParticipant = (userId: number) => {
    setBudgetParticipantIds(prev =>
      prev.includes(userId)
        ? (prev.length > 1 ? prev.filter(id => id !== userId) : prev)
        : [...prev, userId]
    );
  };

  const handleConfirmBudgetTransfer = async () => {
    if (!canTransferToBudget) return;
    const num = parseFloat(budgetAmount.replace(',', '.'));
    if (isNaN(num) || num <= 0) {
      toast.error(t('shopping.totalSpent'));
      return;
    }
    // Only items not yet booked: an item already linked to an expense must never be booked twice.
    const targetItems = items.filter(i => !!i.checked && !i.budget_item_id);
    if (targetItems.length === 0) {
      setBudgetModalOpen(false);
      return;
    }
    const itemNames = targetItems.map(i => i.name + (i.quantity ? ` (${i.quantity})` : '')).join(', ');
    const expenseTitle = itemNames ? `${t('todo.subtab.shopping')}: ${itemNames}`.slice(0, 80) : t('todo.subtab.shopping');

    const participants = budgetParticipantIds.length > 0
      ? budgetParticipantIds
      : (members.length > 0 ? members.map(m => m.id) : (budgetPayerId ? [budgetPayerId] : (me ? [me] : [])));

    setIsSubmittingBudget(true);
    try {
      const createdItem = await addBudgetItem(tripId, {
        name: expenseTitle,
        category: 'groceries',
        total_price: num,
        currency: trip?.currency || null,
        expense_date: budgetDate || localToday(),
        payers: budgetPayerId ? [{ user_id: budgetPayerId, amount: num }] : undefined,
        member_ids: participants.length > 0 ? participants : undefined,
      });

      if (createdItem?.id) {
        await Promise.all(
          targetItems.map(i =>
            updateShoppingItem(tripId, i.id, { budget_item_id: createdItem.id })
          )
        );
      }

      toast.success(t('shopping.addToBudget'));
      setBudgetModalOpen(false);
      setBudgetAmount('');
      setBudgetDate('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error adding expense');
    } finally {
      setIsSubmittingBudget(false);
    }
  };

  return {
    t,
    canEdit,
    canEditBudget,
    canTransferToBudget,
    trip,
    filter,
    setFilter,
    items,
    filtered,
    grouped,
    totalCount,
    openCount,
    doneCount,
    unbookedDoneCount,
    newItemName,
    setNewItemName,
    newItemQty,
    setNewItemQty,
    newItemCategory,
    setNewItemCategory,
    members,
    currentUserId,
    handleAddItem,
    handleToggle,
    handleDelete,
    handleClearChecked,
    handleReorder,
    // Budget
    budgetModalOpen,
    setBudgetModalOpen,
    budgetAmount,
    setBudgetAmount,
    budgetDate,
    setBudgetDate,
    budgetPayerId,
    setBudgetPayerId,
    budgetParticipantIds,
    setBudgetParticipantIds,
    toggleBudgetParticipant,
    isSubmittingBudget,
    handleOpenBudgetModal,
    handleConfirmBudgetTransfer,
    // Uncheck prompt
    uncheckPrompt,
    handleConfirmUncheckKeepExpense,
    handleConfirmUncheckDeleteExpense,
    handleCancelUncheck,
  };
}
