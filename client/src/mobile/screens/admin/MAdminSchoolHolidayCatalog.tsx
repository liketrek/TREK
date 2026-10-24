import {
  schoolHolidayRegionRequestSchema,
  type SchoolHolidayRegionDetail,
  type SchoolHolidayRegionRequest,
} from '@trek/shared';
import { ChevronRight, GraduationCap, Loader2, MapPinned, Plus, Trash2, WifiOff } from 'lucide-react';
import { useState } from 'react';
import { useSchoolHolidayCatalog } from '../../../components/Admin/useSchoolHolidayCatalog';
import { CustomDatePicker } from '../../../components/shared/CustomDateTimePicker';
import CustomSelect from '../../../components/shared/CustomSelect';
import { useTranslation } from '../../../i18n';
import MBadge from '../../components/MBadge';
import MSheet from '../../components/MSheet';
import MConfirmSheet from '../settings/MConfirmSheet';
import { MAdminButton, MAdminCard, MAdminClampedText, MAdminInput, MAdminSheetFrame } from './MAdminUi';

const LABEL =
  'mb-1.5 block font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[.08em] text-m-faint';
const ROUND =
  'flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted disabled:opacity-40';
const ALERT =
  'rounded-[12px] bg-[color:var(--m-ic)] px-3 py-2 text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-[color:var(--m-st-danger)]';

/** A new country of the catalog: its name and its two-letter code. */
function AddCountrySheet({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (code: string, name: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const valid = name.trim().length > 0 && /^[A-Z]{2}$/.test(code);
  const close = () => {
    setName('');
    setCode('');
    onClose();
  };
  return (
    <MSheet open={open} onClose={close} variant="card" material="opaque" ariaLabel={t('schoolCatalog.addCountry')}>
      <MAdminSheetFrame
        title={t('schoolCatalog.addCountry')}
        onClose={close}
        footer={
          <>
            <MAdminButton variant="ghost" onClick={close}>
              {t('common.cancel')}
            </MAdminButton>
            <MAdminButton disabled={!valid} onClick={() => void onSave(code, name.trim()).then(close)}>
              {t('common.save')}
            </MAdminButton>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label>
            <span className={LABEL}>{t('schoolCatalog.country')}</span>
            <MAdminInput autoFocus maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <span className={LABEL}>{t('schoolCatalog.code')}</span>
            <MAdminInput
              maxLength={2}
              placeholder="US"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-geist uppercase tracking-[.08em]"
            />
          </label>
        </div>
      </MAdminSheetFrame>
    </MSheet>
  );
}

interface EditorProps {
  region: SchoolHolidayRegionDetail;
  busy: boolean;
  offline: boolean;
  error: string;
  onClose: () => void;
  onSave: (body: SchoolHolidayRegionRequest) => void;
}

/** A region's holidays, the phone's own sheet over the same request the desktop editor sends. */
function RegionSheet({ region, busy, offline, error, onClose, onSave }: EditorProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(region.name);
  const [holidays, setHolidays] = useState(region.holidays.map((holiday, index) => ({ ...holiday, key: index })));
  const [nextKey, setNextKey] = useState(holidays.length);
  const [invalid, setInvalid] = useState(false);
  const body = {
    name,
    revision: region.revision,
    holidays: holidays.map(({ name, startDate, endDate }) => ({ name, startDate, endDate })),
  };
  const edit = (key: number, change: Partial<(typeof holidays)[number]>) =>
    setHolidays((rows) => rows.map((row) => (row.key === key ? { ...row, ...change } : row)));
  const save = () => {
    const parsed = schoolHolidayRegionRequestSchema.safeParse(body);
    setInvalid(!parsed.success);
    if (parsed.success) onSave(parsed.data);
  };
  const locked = busy || offline;
  return (
    <MSheet
      open
      onClose={() => {
        if (!busy) onClose();
      }}
      variant="card"
      material="opaque"
      ariaLabel={name.trim() || t('schoolCatalog.region')}
      discardGuard={body}
    >
      <MAdminSheetFrame
        title={name.trim() || t('schoolCatalog.region')}
        onClose={() => {
          if (!busy) onClose();
        }}
        footer={
          <>
            <MAdminButton variant="ghost" onClick={onClose} disabled={busy}>
              {t('common.cancel')}
            </MAdminButton>
            <MAdminButton busy={busy} disabled={locked} onClick={save}>
              {t('common.save')}
            </MAdminButton>
          </>
        }
      >
        <fieldset
          disabled={locked}
          className={`m-0 flex min-w-0 flex-col gap-3 border-0 p-0 ${busy ? 'opacity-60' : ''}`}
        >
          <label>
            <span className={LABEL}>{t('schoolCatalog.region')}</span>
            <MAdminInput maxLength={150} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <MAdminClampedText className="text-[length:calc(10px*var(--fs-scale-caption,1))]">
            {t('schoolCatalog.periodHint')}
          </MAdminClampedText>
          {holidays.map((holiday, index) => (
            <div
              key={holiday.key}
              className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-2.5"
            >
              <div className="flex gap-2">
                <MAdminInput
                  maxLength={150}
                  aria-label={t('schoolCatalog.name')}
                  placeholder={t('schoolCatalog.name')}
                  value={holiday.name}
                  onChange={(e) => edit(holiday.key, { name: e.target.value })}
                  className="bg-[color:var(--m-sheetop)]"
                />
                <button
                  type="button"
                  aria-label={`${t('common.delete')} ${holiday.name || index + 1}`}
                  className={ROUND}
                  onClick={() => setHolidays((rows) => rows.filter((row) => row.key !== holiday.key))}
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div role="group" aria-label={t('schoolCatalog.start')} className="min-w-0">
                  <span className={LABEL}>{t('schoolCatalog.start')}</span>
                  <CustomDatePicker
                    key={String(locked)}
                    value={holiday.startDate}
                    placeholder={t('schoolCatalog.start')}
                    max={holiday.endDate || undefined}
                    onChange={(startDate) => edit(holiday.key, { startDate })}
                  />
                </div>
                <div role="group" aria-label={t('schoolCatalog.end')} className="min-w-0">
                  <span className={LABEL}>{t('schoolCatalog.end')}</span>
                  <CustomDatePicker
                    key={String(locked)}
                    value={holiday.endDate}
                    placeholder={t('schoolCatalog.end')}
                    min={holiday.startDate || undefined}
                    onChange={(endDate) => edit(holiday.key, { endDate })}
                  />
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={holidays.length >= 500}
            onClick={() => {
              setHolidays((rows) => [...rows, { key: nextKey, name: '', startDate: '', endDate: '' }]);
              setNextKey((key) => key + 1);
            }}
            className="flex h-[42px] items-center justify-center gap-1.5 rounded-full border border-dashed border-[color:var(--m-rowbr)] text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold text-m-muted"
          >
            <Plus size={14} strokeWidth={2.2} />
            {t('schoolCatalog.addPeriod')}
          </button>
          {invalid && (
            <p role="alert" className={ALERT}>
              {t('schoolCatalog.invalid')}
            </p>
          )}
          {error && (
            <p role="alert" className={ALERT}>
              {error}
            </p>
          )}
        </fieldset>
      </MAdminSheetFrame>
    </MSheet>
  );
}

type Catalog = ReturnType<typeof useSchoolHolidayCatalog>;
type Removal = { label: string; action: () => Promise<boolean> };

/** Offline, loading and a failed read, each said where the card starts. */
function CatalogNotices({ state, disabled }: { state: Catalog; disabled: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {state.offline && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-[12px] bg-[color:var(--m-ic)] px-3 py-2 text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-[color:var(--m-st-pending)]"
        >
          <WifiOff size={13} className="flex-none" />
          {t('schoolCatalog.offline')}
        </p>
      )}
      {state.loading && (
        <p
          role="status"
          className="flex items-center gap-2 font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-muted"
        >
          <Loader2 size={13} className="animate-spin" />
          {t('common.loading')}
        </p>
      )}
      {state.error && !state.editor && (
        <div role="alert" className="flex items-center gap-2 rounded-[12px] bg-[color:var(--m-ic)] px-3 py-2">
          <span className="min-w-0 flex-1 text-[length:calc(11px*var(--fs-scale-caption,1))] font-semibold text-[color:var(--m-st-danger)]">
            {state.error}
          </span>
          <MAdminButton variant="ghost" disabled={disabled} onClick={() => void state.refresh()}>
            {t('schoolCatalog.retry')}
          </MAdminButton>
        </div>
      )}
    </>
  );
}

/** The country shown, with adding one and deleting the shown one (only while it has no regions). */
function CountryPicker({
  state,
  selected,
  regionCount,
  disabled,
  onSelect,
  onAdd,
  onRemove,
}: {
  state: Catalog;
  selected: string;
  regionCount: number;
  disabled: boolean;
  onSelect: (code: string) => void;
  onAdd: () => void;
  onRemove: (removal: Removal) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      {state.catalog.countries.length > 0 ? (
        <div>
          <span className={LABEL}>{t('schoolCatalog.country')}</span>
          <div className="flex items-center gap-2">
            <CustomSelect
              value={selected}
              onChange={(value) => onSelect(String(value))}
              searchable
              disabled={disabled}
              size="sm"
              options={state.catalog.countries.map((item) => ({ value: item.code, label: item.name }))}
              placeholder={t('schoolCatalog.country')}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button
              type="button"
              aria-label={t('schoolCatalog.addCountry')}
              disabled={disabled}
              onClick={onAdd}
              className={ROUND}
            >
              <Plus size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              aria-label={t('schoolCatalog.deleteCountry')}
              disabled={disabled || regionCount > 0}
              onClick={() => onRemove({ label: selected, action: () => state.deleteCountry(selected) })}
              className={ROUND}
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </div>
          {regionCount > 0 && (
            <p className="mt-1.5 font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] text-m-faint">
              {t('schoolCatalog.deleteHint')}
            </p>
          )}
        </div>
      ) : (
        !state.loading && (
          <MAdminButton variant="ghost" disabled={disabled} onClick={onAdd} className="self-start">
            <Plus size={13} strokeWidth={2.2} />
            {t('schoolCatalog.addCountry')}
          </MAdminButton>
        )
      )}
    </>
  );
}

/** The regions of a country, each opened or deleted, and the button that adds one. */
function RegionList({
  state,
  country,
  regions,
  disabled,
  onRemove,
}: {
  state: Catalog;
  country: string;
  regions: Catalog['catalog']['regions'];
  disabled: boolean;
  onRemove: (removal: Removal) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      {regions.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-[color:var(--m-rowbr)] px-4 py-4 text-center font-geist text-[length:calc(11px*var(--fs-scale-caption,1))] text-m-faint">
          {t('schoolCatalog.empty')}
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-[color:var(--m-rowbr)] rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
          {regions.map((region) => (
            <div key={region.id} className="flex items-center gap-2 py-1.5 pe-2 ps-1.5">
              <button
                type="button"
                disabled={disabled}
                onClick={() => void state.openRegion(region.id)}
                className="flex min-w-0 flex-1 items-center gap-2.5 px-1.5 py-1 text-start"
              >
                <span
                  aria-hidden="true"
                  className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-full bg-[color:var(--m-sheetop)] text-m-muted"
                >
                  <MapPinned size={14} strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink">
                  {region.name}
                </span>
                <ChevronRight aria-hidden="true" size={15} className="flex-none text-m-faint rtl:rotate-180" />
              </button>
              <button
                type="button"
                aria-label={`${t('common.delete')} ${region.name}`}
                disabled={disabled}
                onClick={() =>
                  onRemove({ label: region.name, action: () => state.deleteRegion(region.id, region.revision) })
                }
                className="flex h-[32px] w-[32px] flex-none items-center justify-center rounded-full bg-[color:var(--m-sheetop)] text-m-muted disabled:opacity-40"
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => state.setEditor({ id: 0, country, name: '', code: '', revision: 0, holidays: [] })}
        className="flex h-[42px] items-center justify-center gap-1.5 rounded-full border border-dashed border-[color:var(--m-rowbr)] text-[length:calc(12px*var(--fs-scale-body,1))] font-semibold text-m-muted disabled:opacity-40"
      >
        <Plus size={14} strokeWidth={2.2} />
        {t('schoolCatalog.addRegion')}
      </button>
    </>
  );
}

/**
 * The school holiday catalog on the phone: the shared holiday regions per
 * country that everyone can pick in their vacation settings. The state is
 * useSchoolHolidayCatalog's, the desktop card's; this is the phone's markup.
 */
export default function MAdminSchoolHolidayCatalog() {
  const { t } = useTranslation();
  const state = useSchoolHolidayCatalog();
  const [country, setCountry] = useState('');
  const [adding, setAdding] = useState(false);
  const [remove, setRemove] = useState<Removal | null>(null);
  const selectedCountry =
    state.catalog.countries.find((item) => item.code === country)?.code || state.catalog.countries[0]?.code || '';
  const regions = state.catalog.regions.filter((region) => region.country === selectedCountry);
  const disabled = state.busy || state.loading || state.offline;

  return (
    <MAdminCard>
      <div className="flex items-start gap-3">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-[color:var(--m-ic)] text-m-ink">
          <GraduationCap size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="min-w-0 truncate text-[length:calc(14px*var(--fs-scale-body,1))] font-extrabold text-m-ink">
              {t('schoolCatalog.title')}
            </span>
            {state.catalog.countries.length > 0 && <MBadge caps={false}>{state.catalog.regions.length}</MBadge>}
          </div>
          <MAdminClampedText className="mt-[2px] text-[length:calc(10px*var(--fs-scale-caption,1))]">
            {t('schoolCatalog.hint')}
          </MAdminClampedText>
        </div>
      </div>

      <div
        className={`mt-3 flex flex-col gap-3 border-t border-[color:var(--m-rowbr)] pt-3 ${state.busy ? 'opacity-60' : ''}`}
      >
        <CatalogNotices state={state} disabled={disabled} />

        <CountryPicker
          state={state}
          selected={selectedCountry}
          regionCount={regions.length}
          disabled={disabled}
          onSelect={setCountry}
          onAdd={() => setAdding(true)}
          onRemove={setRemove}
        />

        {selectedCountry && (
          <RegionList
            state={state}
            country={selectedCountry}
            regions={regions}
            disabled={disabled}
            onRemove={setRemove}
          />
        )}
      </div>

      <AddCountrySheet
        open={adding}
        onClose={() => setAdding(false)}
        onSave={async (code, name) => {
          if (await state.createCountry({ code, name })) setCountry(code);
        }}
      />
      {state.editor && (
        <RegionSheet
          key={state.editor.id}
          region={state.editor}
          busy={state.busy}
          offline={state.offline}
          error={state.offline ? t('schoolCatalog.offline') : state.error}
          onClose={() => state.setEditor(null)}
          onSave={(body) => {
            if (state.editor) void state.saveRegion(state.editor.country, state.editor.id, body);
          }}
        />
      )}
      <MConfirmSheet
        open={remove !== null}
        onClose={() => setRemove(null)}
        title={t('common.delete')}
        message={`${remove?.label || ''}. ${t('schoolCatalog.deleteHint')}`}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          if (remove) void remove.action();
          setRemove(null);
        }}
      />
    </MAdminCard>
  );
}
