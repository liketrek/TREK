import { ArrowLeftRight } from 'lucide-react';
import { useId } from 'react';

import { useTranslation } from '../../i18n';
import { localizeAmountInput, zeroAmountInput } from '../../utils/formatters';
import { CustomDatePicker } from '../shared/CustomDateTimePicker';
import CustomSelect from '../shared/CustomSelect';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../shared/DialogShell';
import { NumericInput } from '../shared/NumericInput';
import { useToast } from '../shared/Toast';
import { EditorField, GRID_2, TEXTAREA } from '../shared/dialogParts';
import { SYMBOLS } from './BudgetPanel.constants';
import type { TripMember } from './BudgetPanelMemberChips';
import { NOTE_MAX } from './CostsPanel.helpers';
import { currencyOptions, type CostsSettlement } from './costsModel';
import { useSettlementForm } from './useSettlementForm';

/** The amount field's height, the same as the amount row of the expense dialog. */
const FIELD_H = 40;

/**
 * Add or edit a settle-up payment (from / to / amount / currency). Reachable inline
 * from the ledger row and from a manual "Add payment" button, so recording "I sent
 * money to X" works the same whether or not there's an outstanding expense behind it.
 * A transfer can be made in any currency (paying a rouble debt in euros is normal),
 * so it carries its own, defaulting to the display currency. The server freezes its
 * FX rate on write, the same way an expense's is frozen.
 */
export function SettlementModal({
  tripId,
  people,
  me,
  editing,
  currency,
  tripCurrency,
  onClose,
  onSaved,
}: {
  tripId: number;
  people: TripMember[];
  me: number;
  editing: CostsSettlement | null;
  currency: string;
  tripCurrency: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const {
    fromId,
    setFromId,
    toId,
    setToId,
    amount,
    setAmount,
    currency: cur,
    setCurrency: setCur,
    day,
    setDay,
    note,
    setNote,
    saving,
    valid,
    save,
  } = useSettlementForm({ tripId, tripCurrency, base: currency, people, me, editing, t, toast, onSaved });
  const opts = people.map((p) => ({ value: String(p.id), label: p.id === me ? t('costs.you') : p.username }));

  const labelId = useId();
  const nameOf = (id: number) => {
    const p = people.find((x) => x.id === id);
    if (!p) return '';
    return p.id === me ? t('costs.you') : p.username;
  };

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <ArrowLeftRight size={20} strokeWidth={1.9} className="text-content-muted" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={editing ? t('costs.editPayment') : t('costs.addPayment')}
          sub={fromId !== toId ? `${nameOf(fromId)} → ${nameOf(toId)}` : undefined}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={() => void save()} disabled={!valid || saving}>
            {editing ? t('common.save') : t('costs.addPayment')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div className={GRID_2}>
        <EditorField label={t('costs.from')}>
          <CustomSelect
            value={String(fromId)}
            onChange={(v) => setFromId(Number(v))}
            options={opts}
            style={{ width: '100%' }}
          />
        </EditorField>
        <EditorField label={t('costs.to')}>
          <CustomSelect
            value={String(toId)}
            onChange={(v) => setToId(Number(v))}
            options={opts}
            style={{ width: '100%' }}
          />
        </EditorField>
      </div>
      <div className={GRID_2}>
        <EditorField label={t('costs.amount')}>
          <div
            className="flex items-center rounded-[10px] border border-edge bg-surface-input px-3"
            style={{ height: FIELD_H }}
          >
            <span className="text-content-faint" style={fs(14, 'body')}>
              {SYMBOLS[cur] || cur + ' '}
            </span>
            {/* Typed and shown the way the expense total is, in the reader's own decimal mark. */}
            <NumericInput
              mode="decimal"
              placeholder={zeroAmountInput(cur)}
              value={localizeAmountInput(amount, cur)}
              onValueChange={(v) => setAmount(v.replace(',', '.'))}
              className="w-full flex-1 border-0 bg-transparent ps-1.5 font-semibold text-content outline-none dark:bg-transparent"
              style={fs(14, 'body')}
            />
          </div>
        </EditorField>
        <EditorField label={t('costs.currency')}>
          <CustomSelect
            value={cur}
            onChange={(v) => setCur(String(v))}
            searchable
            options={currencyOptions(cur)}
            style={{ width: '100%' }}
          />
        </EditorField>
      </div>
      <EditorField label={t('costs.day')}>
        <CustomDatePicker value={day} onChange={setDay} style={{ width: '100%' }} />
      </EditorField>
      <EditorField label={t('costs.note')} htmlFor="payment-note">
        <textarea
          id="payment-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={t('costs.paymentNotePlaceholder')}
          maxLength={NOTE_MAX}
          className={`${TEXTAREA} resize-y`}
        />
      </EditorField>
    </DialogShell>
  );
}
