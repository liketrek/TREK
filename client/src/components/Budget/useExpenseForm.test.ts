import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { buildBudgetItem, buildTrip } from '../../../tests/helpers/factories';
import { resetAllStores } from '../../../tests/helpers/store';
import { clearExchangeRateCache } from '../../hooks/useExchangeRates';
import { useTripStore, type TripStoreState } from '../../store/tripStore';
import type { BudgetItem } from '../../types';
import { localToday } from '../Planner/today';
import type { TripMember } from './BudgetPanelMemberChips';
import type { ExpensePrefill } from './CostsPanel';
import { saveWithReceipts } from './receiptUploads';
import { useExpenseForm } from './useExpenseForm';

vi.mock('./receiptUploads', () => ({
  saveWithReceipts: vi.fn(
    async (_tripId: number, _files: File[], _id: number | null, save: (ids: number[]) => unknown) => ({
      result: await save([]),
      stuckIds: [],
    })
  ),
}));

// FE-BUDGET-EXPFORM-001 to FE-BUDGET-EXPFORM-021

const PEOPLE: TripMember[] = [
  { id: 1, username: 'alice', avatar_url: null },
  { id: 2, username: 'bob', avatar_url: null },
];
const TODAY = localToday();

let addBudgetItem: ReturnType<typeof vi.fn>;
let updateBudgetItem: ReturnType<typeof vi.fn>;
let addToast: ReturnType<typeof vi.fn>;

interface Options {
  editing?: BudgetItem | null;
  prefill?: ExpensePrefill;
  oneSaveAtATime?: boolean;
  keepSavingOnSuccess?: boolean;
}

function setup(options: Options = {}) {
  const onSaved = vi.fn();
  const rendered = renderHook(() =>
    useExpenseForm({
      tripId: 7,
      base: 'EUR',
      people: PEOPLE,
      me: 1,
      editing: options.editing ?? null,
      prefill: options.prefill,
      onSaved,
      oneSaveAtATime: options.oneSaveAtATime,
      keepSavingOnSuccess: options.keepSavingOnSuccess,
    })
  );
  return { ...rendered, onSaved };
}

type Form = ReturnType<typeof setup>['result'];

function fill(result: Form, name: string, total: string) {
  act(() => {
    result.current.setName(name);
    result.current.onTotalChange(total);
  });
}

async function save(result: Form) {
  await act(async () => {
    await result.current.save();
  });
}

/** saveWithReceipts as it runs once the files are up: the save gets their ids. */
const uploadsThenSave = (ids: number[]) =>
  (async (_tripId: number, _files: File[], _id: number | null, write: (uploaded: number[]) => Promise<unknown>) => ({
    result: await write(ids),
    stuckIds: [],
  })) as unknown as typeof saveWithReceipts;

const errorToasts = () => addToast.mock.calls.filter((c) => c[1] === 'error').map((c) => c[0]);

beforeEach(() => {
  resetAllStores();
  clearExchangeRateCache();
  // A fresh FX cache, so the hook never reaches the network.
  localStorage.setItem('trek_fx_EUR', JSON.stringify({ rates: { EUR: 1, USD: 1.25 }, ts: Date.now() }));
  addBudgetItem = vi.fn(async () => buildBudgetItem({ id: 9 }));
  updateBudgetItem = vi.fn(async () => buildBudgetItem({ id: 9 }));
  useTripStore.setState({
    trip: buildTrip({ id: 7, currency: 'EUR' }),
    addBudgetItem,
    updateBudgetItem,
  } as unknown as Partial<TripStoreState>);
  addToast = vi.fn();
  (window as unknown as { __addToast: unknown }).__addToast = addToast;
  vi.mocked(saveWithReceipts).mockClear();
});

afterEach(() => {
  delete (window as unknown as { __addToast?: unknown }).__addToast;
});

describe('useExpenseForm: where it starts', () => {
  it('FE-BUDGET-EXPFORM-001: a new expense is food, in the display currency, today, split equally by everyone, paid by me', () => {
    const { result } = setup();
    const f = result.current;
    expect(f.name).toBe('');
    expect(f.cat).toBe('food');
    expect(f.currency).toBe('EUR');
    expect(f.day).toBe(TODAY);
    expect(f.total).toBe('');
    expect([...f.participants]).toEqual([1, 2]);
    expect(f.payerId).toBe(1);
    expect(f.multiPayer).toBe(false);
    expect(f.splitMode).toBe('equally');
    expect(f.receipts).toEqual([]);
    expect(f.pendingReceiptFiles).toEqual([]);
    expect(f.valid).toBe(false);
    expect(f.saving).toBe(false);
    expect(f.nameOf(PEOPLE[0])).toBe('costs.you');
    expect(f.nameOf(PEOPLE[1])).toBe('bob');
    expect(f.sym('EUR')).toBe('€');
    expect(f.sym('XYZ')).toBe('XYZ ');
  });

  it('FE-BUDGET-EXPFORM-002: a prefill brings its name, category, amount, currency, day, receipt lines and photos', () => {
    const photo = new File(['x'], 'receipt.jpg');
    const { result } = setup({
      prefill: {
        name: 'Cafe',
        category: 'food',
        amount: 12.5,
        currency: 'usd',
        date: '2026-05-01',
        lines: [{ name: 'Coffee', price: 4 }],
        receiptFiles: [photo],
      },
    });
    const f = result.current;
    expect(f.name).toBe('Cafe');
    expect(f.currency).toBe('USD');
    expect(f.total).toBe('12.50');
    expect(f.day).toBe('2026-05-01');
    expect(f.ticketItems.map((i) => [i.name, i.price, [...i.participants]])).toEqual([['Coffee', '4.00', [1, 2]]]);
    // The lines wait in the Ticket split; the split itself stays Equally.
    expect(f.splitMode).toBe('equally');
    expect(f.pendingReceiptFiles).toEqual([photo]);
  });

  it('FE-BUDGET-EXPFORM-003: an edited expense reopens with its payer, its custom split, its note and receipts', () => {
    const receipt = { id: 3, filename: 'r.jpg', original_name: 'r.jpg', url: '/uploads/r.jpg' };
    const editing = buildBudgetItem({
      id: 9,
      name: 'Museum',
      category: 'activities',
      total_price: 30,
      currency: 'USD',
      note: 'Adult tickets',
      expense_date: '2026-04-30',
      members: [
        { user_id: 1, paid: 0, username: 'alice', amount: 10 },
        { user_id: 2, paid: 0, username: 'bob', amount: 20 },
      ],
      payers: [{ user_id: 2, amount: 30 }],
      receipts: [receipt],
    } as Partial<BudgetItem>);
    const f = setup({ editing }).result.current;
    expect(f.name).toBe('Museum');
    expect(f.cat).toBe('activities');
    expect(f.currency).toBe('USD');
    expect(f.total).toBe('30.00');
    expect(f.day).toBe('2026-04-30');
    expect(f.note).toBe('Adult tickets');
    expect(f.payerId).toBe(2);
    expect(f.payerAmounts).toEqual({ 2: '30.00' });
    expect(f.splitMode).toBe('custom');
    expect(f.customAmounts).toEqual({ 1: '10.00', 2: '20.00' });
    expect(f.receipts).toEqual([receipt]);
    expect(f.valid).toBe(true);
  });

  it('FE-BUDGET-EXPFORM-004: an edited expense nobody paid stays unpaid; several payers open the payer editor', () => {
    const unpaid = setup({ editing: buildBudgetItem({ total_price: 20, payers: [], members: [] }) }).result.current;
    expect(unpaid.payerId).toBe(0);
    expect(unpaid.splitMode).toBe('equally');
    const shared = setup({
      editing: buildBudgetItem({
        total_price: 50,
        currency: 'EUR',
        payers: [
          { user_id: 1, amount: 20 },
          { user_id: 2, amount: 30 },
        ],
        members: [{ user_id: 1, paid: 0, username: 'alice', amount: null }],
      } as Partial<BudgetItem>),
    }).result.current;
    expect(shared.multiPayer).toBe(true);
    expect([...shared.payerIds]).toEqual([1, 2]);
    expect(shared.payerAmounts).toEqual({ 1: '20.00', 2: '30.00' });
    expect(shared.splitMode).toBe('equally');
    const ticket = setup({
      editing: buildBudgetItem({
        ticket_json: JSON.stringify({ items: [{ name: 'Pizza', price: '12', parts: [1] }] }),
      }),
    }).result.current;
    expect(ticket.splitMode).toBe('ticket');
    expect(ticket.ticketItems.map((i) => i.name)).toEqual(['Pizza']);
  });
});

describe('useExpenseForm: what it adds up', () => {
  it('FE-BUDGET-EXPFORM-005: equal shares, the custom sum and what is still to hand out', () => {
    const { result } = setup();
    fill(result, 'Dinner', '40,5');
    expect(result.current.total).toBe('40.5');
    expect(result.current.totalNum).toBe(40.5);
    expect(result.current.each).toBe(20.25);
    expect(result.current.equalShares).toEqual({ 1: 20.25, 2: 20.25 });
    act(() => {
      result.current.setSplitMode('custom');
      result.current.handleCustomAmountChange(1, '10,5');
    });
    expect(result.current.customAmounts).toEqual({ 1: '10.5' });
    expect(result.current.splitSum).toBe(10.5);
    expect(result.current.splitShortfall).toBe(30);
    expect(result.current.customBalanced).toBe(false);
    expect(result.current.placeholderShares).toEqual({ 2: 30 });
    expect(result.current.valid).toBe(false);
    act(() => result.current.handleCustomAmountChange(2, '30'));
    expect(result.current.customBalanced).toBe(true);
    expect(result.current.placeholderShares).toEqual({});
    expect(result.current.valid).toBe(true);
  });

  it('FE-BUDGET-EXPFORM-006: a refund splits negative, and an over-entered split suggests nothing below zero', () => {
    const { result } = setup();
    fill(result, 'Refund', '-20');
    act(() => result.current.setSplitMode('custom'));
    expect(result.current.placeholderShares).toEqual({ 1: -10, 2: -10 });
    act(() => result.current.handleCustomAmountChange(1, '-5'));
    // Read on the refund's own side: 15 is still to go out, not 15 too much.
    expect(result.current.splitShortfall).toBe(15);
    const over = setup();
    fill(over.result, 'Taxi', '10');
    act(() => {
      over.result.current.setSplitMode('custom');
      over.result.current.handleCustomAmountChange(1, '25');
    });
    expect(over.result.current.placeholderShares).toEqual({ 2: 0 });
  });

  it('FE-BUDGET-EXPFORM-007: an entry needs a name and an amount that is not zero, a refund is fine', () => {
    const { result } = setup();
    fill(result, '  ', '10');
    expect(result.current.valid).toBe(false);
    fill(result, 'Taxi', '0');
    expect(result.current.valid).toBe(false);
    fill(result, 'Taxi', '-10');
    expect(result.current.valid).toBe(true);
    // With nobody in the split there is nothing to balance.
    act(() => result.current.setSplitMode('custom'));
    act(() => result.current.toggleParticipant(1));
    act(() => result.current.toggleParticipant(2));
    expect(result.current.participants.size).toBe(0);
    expect(result.current.valid).toBe(true);
  });

  it('FE-BUDGET-EXPFORM-008: amounts are refused beyond the currency decimals and ticket prices cannot be negative', () => {
    const { result } = setup();
    act(() => {
      result.current.handleCustomAmountChange(1, '1.234');
      result.current.handleCustomAmountChange(2, 'abc');
    });
    expect(result.current.customAmounts).toEqual({});
    act(() => result.current.handleCustomAmountChange(1, '-2'));
    expect(result.current.customAmounts).toEqual({ 1: '-2' });
    act(() => result.current.handleCustomAmountChange(1, ''));
    expect(result.current.customAmounts).toEqual({ 1: '' });
    act(() => result.current.handleAddEmptyItem());
    const id = result.current.ticketItems[0].id;
    act(() => result.current.handleUpdateItemPrice(id, '-3'));
    expect(result.current.ticketItems[0].price).toBe('');
    act(() => result.current.handleUpdateItemPrice(id, '3,5'));
    expect(result.current.ticketItems[0].price).toBe('3.5');
  });
});

describe('useExpenseForm: payers', () => {
  it('FE-BUDGET-EXPFORM-009: several payers start from the one picked and absorb what nobody typed', () => {
    const { result } = setup();
    fill(result, 'Hotel', '30');
    act(() => result.current.enableMultiPayer());
    expect(result.current.multiPayer).toBe(true);
    expect([...result.current.payerIds]).toEqual([1]);
    expect(result.current.payerAmounts).toEqual({ 1: '30.00' });
    act(() => result.current.togglePayer(2));
    expect(result.current.payerAmounts).toEqual({ 1: '15.00', 2: '15.00' });
    act(() => result.current.onPayerAmountChange(1, '10'));
    expect(result.current.payerAmounts).toEqual({ 1: '10', 2: '20.00' });
    expect(result.current.payersOk).toBe(true);
    // A new total moves only the payer nobody typed for.
    act(() => result.current.onTotalChange('50'));
    expect(result.current.payerAmounts).toEqual({ 1: '10', 2: '40.00' });
    act(() => result.current.togglePayer(2));
    expect([...result.current.payerIds]).toEqual([1]);
    expect(result.current.payerAmounts[1]).toBe('10');
    expect(result.current.payersOk).toBe(false);
    expect(result.current.valid).toBe(false);
  });

  it('FE-BUDGET-EXPFORM-010: back to one payer keeps the first; a single payer is left alone by a new total', () => {
    const { result } = setup();
    fill(result, 'Hotel', '30');
    act(() => result.current.setPayerId(0));
    act(() => result.current.enableMultiPayer());
    // "Nobody" picked: the editor starts on me.
    expect([...result.current.payerIds]).toEqual([1]);
    act(() => result.current.togglePayer(2));
    act(() => result.current.togglePayer(1));
    act(() => result.current.disableMultiPayer());
    expect(result.current.multiPayer).toBe(false);
    expect(result.current.payerId).toBe(2);
    const amounts = result.current.payerAmounts;
    act(() => result.current.onTotalChange('80'));
    expect(result.current.payerAmounts).toBe(amounts);
  });
});

describe('useExpenseForm: splits, ticket lines and receipts', () => {
  it('FE-BUDGET-EXPFORM-011: ticket lines are added, named, priced, shared and removed', () => {
    const { result } = setup();
    act(() => {
      result.current.setSplitMode('ticket');
      result.current.handleAddEmptyItem();
    });
    expect(result.current.isTicketMode).toBe(true);
    const [line] = result.current.ticketItems;
    expect(line).toMatchObject({ name: '', price: '' });
    expect([...line.participants]).toEqual([1, 2]);
    act(() => {
      result.current.handleUpdateItemName(line.id, 'Pizza');
      result.current.handleUpdateItemPrice(line.id, '12');
      result.current.handleToggleItemParticipant(line.id, 2);
    });
    expect(result.current.ticketInfo).toEqual({ shares: { 1: 12 }, total: 12 });
    expect(result.current.totalNum).toBe(12);
    act(() => result.current.setName('Lunch'));
    expect(result.current.valid).toBe(true);
    act(() => result.current.handleToggleItemParticipant(line.id, 2));
    expect([...result.current.ticketItems[0].participants]).toEqual([1, 2]);
    act(() => result.current.handleRemoveItem(line.id));
    expect(result.current.ticketItems).toEqual([]);
    expect(result.current.valid).toBe(false);
  });

  it('FE-BUDGET-EXPFORM-012: leaving the split drops the custom amount, joining it again adds the person back', () => {
    const { result } = setup();
    act(() => {
      result.current.handleCustomAmountChange(2, '5');
      result.current.toggleParticipant(2);
    });
    expect([...result.current.participants]).toEqual([1]);
    expect(result.current.customAmounts).toEqual({});
    act(() => result.current.toggleParticipant(2));
    expect([...result.current.participants]).toEqual([1, 2]);
  });

  it('FE-BUDGET-EXPFORM-013: picked files wait to upload; saved and waiting receipts can both be taken off', () => {
    const receipt = { id: 3, filename: 'r.jpg', original_name: 'r.jpg', url: '/uploads/r.jpg' };
    const { result } = setup({ editing: buildBudgetItem({ receipts: [receipt] }) });
    const a = new File(['a'], 'a.pdf');
    const b = new File(['b'], 'b.pdf');
    act(() => result.current.handleReceiptFileSelect(null));
    act(() => result.current.handleReceiptFileSelect([]));
    expect(result.current.pendingReceiptFiles).toEqual([]);
    act(() => result.current.handleReceiptFileSelect([a, b]));
    expect(result.current.pendingReceiptFiles).toEqual([a, b]);
    act(() => result.current.handleRemovePendingReceipt(0));
    expect(result.current.pendingReceiptFiles).toEqual([b]);
    act(() => result.current.handleRemoveReceipt(3));
    expect(result.current.receipts).toEqual([]);
    act(() => result.current.setPreviewReceipts({ receipts: [receipt], initialIndex: 0 }));
    expect(result.current.previewReceipts).toEqual({ receipts: [receipt], initialIndex: 0 });
  });
});

describe('useExpenseForm: saving', () => {
  it('FE-BUDGET-EXPFORM-014: a new equal split goes out with me as payer and everyone in it', async () => {
    const { result, onSaved } = setup();
    fill(result, ' Dinner ', '40');
    act(() => result.current.setNote('  with a view  '));
    await save(result);
    expect(addBudgetItem).toHaveBeenCalledWith(7, {
      name: 'Dinner',
      category: 'food',
      currency: 'EUR',
      payers: [{ user_id: 1, amount: 40 }],
      members: [
        { user_id: 1, amount: null },
        { user_id: 2, amount: null },
      ],
      member_ids: [1, 2],
      expense_date: TODAY,
      total_price: 40,
      note: 'with a view',
      ticket_json: null,
      receipt_file_ids: [],
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(false);
    expect(result.current.uploadingReceipt).toBe(false);
  });

  it('FE-BUDGET-EXPFORM-015: nobody paid sends no payer; a booking or a place links only a new expense', async () => {
    const created = setup({ prefill: { name: 'Flight', amount: 100, reservationId: 4, placeId: 5 } });
    act(() => {
      created.result.current.setPayerId(0);
      created.result.current.setSplitMode('custom');
      created.result.current.handleCustomAmountChange(1, '60');
      created.result.current.handleCustomAmountChange(2, '40');
    });
    await save(created.result);
    expect(addBudgetItem).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        payers: [],
        members: [
          { user_id: 1, amount: 60 },
          { user_id: 2, amount: 40 },
        ],
        reservation_id: 4,
        place_id: 5,
      })
    );

    const editing = buildBudgetItem({ id: 9, name: 'Flight', total_price: 100, payers: [{ user_id: 1, amount: 100 }] });
    const edited = setup({ editing, prefill: { reservationId: 4, placeId: 5 } });
    await save(edited.result);
    const sent = updateBudgetItem.mock.calls[0][2];
    expect(updateBudgetItem).toHaveBeenCalledWith(
      7,
      9,
      expect.objectContaining({ payers: [{ user_id: 1, amount: 100 }] })
    );
    expect(sent).not.toHaveProperty('reservation_id');
    expect(sent).not.toHaveProperty('place_id');
  });

  it('FE-BUDGET-EXPFORM-016: an edit keeps the saved receipts and adds the uploaded ones', async () => {
    vi.mocked(saveWithReceipts).mockImplementationOnce(uploadsThenSave([41]));
    const receipt = { id: 3, filename: 'r.jpg', original_name: 'r.jpg', url: '/uploads/r.jpg' };
    const editing = buildBudgetItem({ id: 9, name: 'Museum', total_price: 30, receipts: [receipt] });
    const photo = new File(['x'], 'new.jpg');
    const { result } = setup({ editing });
    act(() => result.current.handleReceiptFileSelect([photo]));
    await save(result);
    expect(saveWithReceipts).toHaveBeenCalledWith(7, [photo], 9, expect.any(Function));
    expect(updateBudgetItem).toHaveBeenCalledWith(7, 9, expect.objectContaining({ receipt_file_ids: [3, 41] }));
    expect(result.current.pendingReceiptFiles).toEqual([]);
  });

  it('FE-BUDGET-EXPFORM-017: a ticket split sends everyone a line names, ticked or not (#1382)', async () => {
    const { result } = setup();
    act(() => {
      result.current.setName('Lunch');
      result.current.setSplitMode('ticket');
      result.current.handleAddEmptyItem();
    });
    const id = result.current.ticketItems[0].id;
    act(() => {
      result.current.handleUpdateItemName(id, 'Pizza');
      result.current.handleUpdateItemPrice(id, '12');
      // Bob eats from the line but is not ticked for the expense.
      result.current.toggleParticipant(2);
    });
    await save(result);
    expect(addBudgetItem.mock.calls[0][1]).toMatchObject({
      members: [
        { user_id: 1, amount: 6 },
        { user_id: 2, amount: 6 },
      ],
      member_ids: [1, 2],
      total_price: 12,
      ticket_json: JSON.stringify({ items: [{ name: 'Pizza', price: '12', parts: [1, 2] }] }),
    });
  });

  it('FE-BUDGET-EXPFORM-018: a failed save says why; a receipt it could not take back is counted', async () => {
    const { result, onSaved } = setup();
    fill(result, 'Dinner', '40');
    vi.mocked(saveWithReceipts).mockRejectedValueOnce(new Error('offline'));
    await save(result);
    vi.mocked(saveWithReceipts).mockRejectedValueOnce(Object.assign(new Error('x'), { stuckReceiptIds: [5, 6] }));
    await save(result);
    expect(errorToasts()).toEqual(['common.unknownError', 'costs.receiptLeftBehind']);
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it('FE-BUDGET-EXPFORM-019: the phone stays busy after a save that went through and frees itself after a failure', async () => {
    const { result } = setup({ oneSaveAtATime: true, keepSavingOnSuccess: true });
    fill(result, 'Dinner', '40');
    vi.mocked(saveWithReceipts).mockRejectedValueOnce(new Error('offline'));
    await save(result);
    expect(result.current.saving).toBe(false);
    await save(result);
    expect(addBudgetItem).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(true);
  });

  it('FE-BUDGET-EXPFORM-020: a save while one is out is dropped on the phone and sent again on the desktop; an invalid one never', async () => {
    const pending = (() => new Promise(() => {})) as unknown as typeof saveWithReceipts;
    vi.mocked(saveWithReceipts)
      .mockImplementationOnce(pending)
      .mockImplementationOnce(pending)
      .mockImplementationOnce(pending);
    const phone = setup({ oneSaveAtATime: true });
    fill(phone.result, 'Dinner', '40');
    act(() => {
      void phone.result.current.save();
    });
    act(() => {
      void phone.result.current.save();
    });
    expect(saveWithReceipts).toHaveBeenCalledTimes(1);

    const desktop = setup();
    fill(desktop.result, 'Dinner', '40');
    act(() => {
      void desktop.result.current.save();
    });
    act(() => {
      void desktop.result.current.save();
    });
    expect(saveWithReceipts).toHaveBeenCalledTimes(3);

    const invalid = setup();
    await save(invalid.result);
    expect(saveWithReceipts).toHaveBeenCalledTimes(3);
  });

  it('FE-BUDGET-EXPFORM-021: the phone sends everyone a ticket line names too, so the shares add up to the total (#1382)', async () => {
    const { result } = setup({ oneSaveAtATime: true, keepSavingOnSuccess: true });
    act(() => {
      result.current.setName('Lunch');
      result.current.setSplitMode('ticket');
      result.current.handleAddEmptyItem();
    });
    const id = result.current.ticketItems[0].id;
    act(() => {
      result.current.handleUpdateItemName(id, 'Pizza');
      result.current.handleUpdateItemPrice(id, '12');
      // Bob eats from the line but is not ticked for the expense.
      result.current.toggleParticipant(2);
    });
    await save(result);
    expect(addBudgetItem.mock.calls[0][1]).toMatchObject({
      members: [
        { user_id: 1, amount: 6 },
        { user_id: 2, amount: 6 },
      ],
      member_ids: [1, 2],
      total_price: 12,
    });
  });
});
