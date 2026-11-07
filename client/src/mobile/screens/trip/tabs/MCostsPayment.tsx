import { ArrowLeftRight } from 'lucide-react';
import { NOTE_MAX } from '../../../../components/Budget/CostsPanel.helpers';
import { currencyOptions, type CostsSettlement } from '../../../../components/Budget/costsModel';
import { useSettlementForm } from '../../../../components/Budget/useSettlementForm';
import CustomSelect from '../../../../components/shared/CustomSelect';
import type { TripMember } from '../../../../types';
import { localizeAmountInput, zeroAmountInput } from '../../../../utils/formatters';
import MChip from '../../../components/MChip';
import MSheet from '../../../components/MSheet';
import {
  AMOUNT_FIELD_CLS,
  Eyebrow,
  FIELD_AREA_CLS,
  FormSheetBody,
  FormSheetFooter,
  FormSheetHeader,
  SheetDateField,
} from '../sheets/PlSheetChrome';

type TFn = (key: string, params?: Record<string, string | number>) => string;

// The costs tab's member avatar and its payment sheet, apart from the tab so it
// keeps to the size a source file may have.

const AVATAR_TONE = {
  accent: 'bg-m-act text-m-actfg',
  neutral: 'bg-[color:var(--m-ic)] text-m-ink',
  // On a chip that is itself filled with the accent: the circle turns over, or
  // it vanishes into the chip.
  onAccent: 'bg-m-actfg text-m-act',
} as const;

/**
 * Avatar or initials circle; `variant` picks the accent (member chips), the
 * neutral (balances) tone, or the inverse one for a selected chip. The initial
 * is the member's own, yours included: "You" is the label beside the circle,
 * and the word squeezed into it read "Du Du" or ran out of it in Arabic.
 */
export function MemberAvatar({
  name,
  avatarUrl,
  variant,
  size,
}: {
  name: string;
  avatarUrl?: string | null;
  variant: keyof typeof AVATAR_TONE;
  size: number;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="flex-none rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full font-geist font-extrabold ${AVATAR_TONE[variant]}`}
      style={{ width: size, height: size, fontSize: Math.max(8, size * 0.42) }}
    >
      {initial}
    </span>
  );
}

/**
 * "Add/edit payment": records or updates a manual settle-up transfer through
 * the same `useSettlementForm` as the desktop dialog. No pixel spec exists for
 * this form (the demo only toasts "Demo: add payment", 03-trip-tabs.md §3.8)
 * and no mobile/exported-desktop sheet covers it, so this is a small local
 * sheet built from the trip form-sheet chrome, kept to the fields the
 * settle-up card itself needs: from, to, amount plus its currency (a new
 * payment starts in the display currency, a reopened one keeps the currency
 * it was recorded in, like the desktop modal), and the day it happened
 * (editable like an expense's, unlike the legacy created_at-only date, see
 * `settlementDate` in CostsPanel.helpers.ts).
 */
export function AddPaymentSheet({
  open,
  editing,
  onClose,
  tripId,
  base,
  tripCurrency,
  people,
  me,
  toast,
  t,
  onSaved,
}: {
  open: boolean;
  editing: CostsSettlement | null;
  onClose: () => void;
  tripId: number;
  base: string;
  tripCurrency: string;
  people: TripMember[];
  me: number;
  toast: { error: (message: string) => void; info: (message: string) => void };
  t: TFn;
  onSaved: () => void;
}) {
  const {
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
  } = useSettlementForm({
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
    oneSaveAtATime: true,
  });

  const title = editing ? t('costs.editPayment') : t('costs.addPayment');

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={title} form>
      <FormSheetHeader icon={ArrowLeftRight} title={title} onClose={onClose} closeLabel={t('common.close')} />
      <FormSheetBody>
        <Eyebrow className="mb-[7px] mt-2 uppercase">{t('costs.from')}</Eyebrow>
        <div className="flex flex-wrap gap-[6px]">
          {people.map((p) => (
            <MChip key={p.id} active={fromId === p.id} onClick={() => setFromId(p.id)}>
              <MemberAvatar
                name={p.username}
                avatarUrl={p.avatar_url}
                variant={fromId === p.id ? 'onAccent' : 'neutral'}
                size={16}
              />
              {p.id === me ? t('costs.you') : p.username}
            </MChip>
          ))}
        </div>

        <Eyebrow className="mb-[7px] mt-[14px] uppercase">{t('costs.to')}</Eyebrow>
        <div className="flex flex-wrap gap-[6px]">
          {people.map((p) => (
            <MChip key={p.id} active={toId === p.id} onClick={() => setToId(p.id)}>
              <MemberAvatar
                name={p.username}
                avatarUrl={p.avatar_url}
                variant={toId === p.id ? 'onAccent' : 'neutral'}
                size={16}
              />
              {p.id === me ? t('costs.you') : p.username}
            </MChip>
          ))}
        </div>

        <Eyebrow className="mb-[7px] mt-[14px] uppercase">{t('costs.amount')}</Eyebrow>
        {/* The currency sits inside the field, after the amount, like the
            expense's total: one box, not a field with a code floating beside it. */}
        <div className={AMOUNT_FIELD_CLS}>
          <input
            type="text"
            inputMode="decimal"
            value={localizeAmountInput(amount, currency)}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={zeroAmountInput(currency)}
            aria-label={t('costs.amount')}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[0.84375rem] font-semibold text-m-ink outline-none [font-variant-numeric:tabular-nums] placeholder:font-normal placeholder:text-m-faint"
          />
          <span className="flex-none font-geist text-caption font-bold text-m-faint">{currency}</span>
        </div>

        <div className="mt-[14px] grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2">
          <div className="min-w-0">
            <Eyebrow className="mb-[7px] uppercase">{t('costs.currency')}</Eyebrow>
            <CustomSelect
              value={currency}
              onChange={(v) => setCurrency(String(v))}
              searchable
              size="sm"
              options={currencyOptions(currency)}
              style={{ width: '100%' }}
            />
          </div>
          <div className="min-w-0">
            <Eyebrow className="mb-[7px] uppercase">{t('costs.day')}</Eyebrow>
            <SheetDateField value={day} onChange={setDay} />
          </div>
        </div>

        <Eyebrow className="mb-[6px] mt-[14px] uppercase">{t('costs.note')}</Eyebrow>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={NOTE_MAX}
          placeholder={t('costs.paymentNotePlaceholder')}
          className={FIELD_AREA_CLS}
        />
      </FormSheetBody>
      <FormSheetFooter
        onCancel={onClose}
        cancelLabel={t('common.cancel')}
        onSubmit={save}
        submitLabel={editing ? t('common.save') : t('costs.addPayment')}
        submitDisabled={!valid || saving}
      />
    </MSheet>
  );
}
