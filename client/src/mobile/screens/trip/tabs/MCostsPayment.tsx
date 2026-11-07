import { NOTE_MAX } from '../../../../components/Budget/CostsPanel.helpers';
import { currencyOptions, type CostsSettlement } from '../../../../components/Budget/costsModel';
import { useSettlementForm } from '../../../../components/Budget/useSettlementForm';
import { CustomDatePicker } from '../../../../components/shared/CustomDateTimePicker';
import CustomSelect from '../../../../components/shared/CustomSelect';
import type { TripMember } from '../../../../types';
import { localizeAmountInput, zeroAmountInput } from '../../../../utils/formatters';
import MChip from '../../../components/MChip';
import MSheet from '../../../components/MSheet';
import { Eyebrow, FIELD_AREA_CLS, FIELD_CLS, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome';

type TFn = (key: string, params?: Record<string, string | number>) => string;

// The costs tab's member avatar and its payment sheet, apart from the tab so it
// keeps to the size a source file may have.

/** Avatar or initials circle; `variant` picks the accent (member chips) or neutral (balances) tone. */
export function MemberAvatar({
  name,
  avatarUrl,
  isMe,
  variant,
  size,
  t,
}: {
  name: string;
  avatarUrl?: string | null;
  isMe: boolean;
  variant: 'accent' | 'neutral';
  size: number;
  t: TFn;
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
  const initial = isMe ? t('costs.youShort') : (name || '?').charAt(0).toUpperCase();
  const toneCls = variant === 'accent' ? 'bg-m-act text-m-actfg' : 'bg-[color:var(--m-ic)] text-m-ink';
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full font-geist font-extrabold ${toneCls}`}
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
    <MSheet open={open} onClose={onClose} ariaLabel={title}>
      <FormSheetHeader title={title} onClose={onClose} closeLabel={t('common.close')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        <Eyebrow className="mb-[7px] uppercase">{t('costs.from')}</Eyebrow>
        <div className="flex flex-wrap gap-[6px]">
          {people.map((p) => (
            <MChip key={p.id} active={fromId === p.id} onClick={() => setFromId(p.id)}>
              <MemberAvatar
                name={p.username}
                avatarUrl={p.avatar_url}
                isMe={p.id === me}
                variant={fromId === p.id ? 'accent' : 'neutral'}
                size={16}
                t={t}
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
                isMe={p.id === me}
                variant={toId === p.id ? 'accent' : 'neutral'}
                size={16}
                t={t}
              />
              {p.id === me ? t('costs.you') : p.username}
            </MChip>
          ))}
        </div>

        <Eyebrow className="mb-[7px] mt-[14px] uppercase">{t('costs.amount')}</Eyebrow>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            value={localizeAmountInput(amount, currency)}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={zeroAmountInput(currency)}
            className={FIELD_CLS}
          />
          <span className="flex-none font-geist text-caption font-bold text-m-faint">{currency}</span>
        </div>

        <div className="mt-[14px] flex gap-2">
          <div className="min-w-0 flex-1">
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
          <div className="min-w-0 flex-1">
            <Eyebrow className="mb-[7px] uppercase">{t('costs.day')}</Eyebrow>
            <CustomDatePicker value={day} onChange={setDay} style={{ width: '100%' }} />
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
      </div>
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
