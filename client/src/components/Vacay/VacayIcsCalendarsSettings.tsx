import { CalendarDays, Loader2, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import { useVacayStore } from '../../store/vacayStore';
import { useVacayCalendarColorPicker } from './calendarColorPickerRegistry';

const PRESET_COLORS = [
  '#fecaca',
  '#fed7aa',
  '#fde68a',
  '#bbf7d0',
  '#a5f3fc',
  '#c7d2fe',
  '#e9d5ff',
  '#fda4af',
  '#6366f1',
  '#ef4444',
  '#22c55e',
  '#3b82f6',
];

export default function VacayIcsCalendarsSettings({ mobile = false }: { mobile?: boolean }) {
  const { t } = useTranslation();
  const calendars = useVacayStore((state) => state.icsCalendarSettings ?? []);
  const plan = useVacayStore((state) => state.plan);
  const updatePlan = useVacayStore((state) => state.updatePlan);
  const loadIcsCalendarSettings = useVacayStore((state) => state.loadIcsCalendarSettings);
  const addIcsCalendar = useVacayStore((state) => state.addIcsCalendar);
  const updateIcsCalendar = useVacayStore((state) => state.updateIcsCalendar);
  const deleteIcsCalendar = useVacayStore((state) => state.deleteIcsCalendar);
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[4]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingEnabled, setUpdatingEnabled] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');
  const enabled = plan?.ics_holidays_enabled !== false;

  useEffect(() => {
    let active = true;
    void loadIcsCalendarSettings()
      .catch((e) => active && setError(message(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loadIcsCalendarSettings]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await addIcsCalendar({ url: url.trim(), label: label.trim(), color });
      setUrl('');
      setLabel('');
      setShowAddForm(false);
    } catch (e) {
      setError(message(e));
    } finally {
      setSaving(false);
    }
  };
  const toggleEnabled = async () => {
    setUpdatingEnabled(true);
    setError('');
    try {
      await updatePlan({ ics_holidays_enabled: !enabled });
    } catch (e) {
      setError(message(e));
    } finally {
      setUpdatingEnabled(false);
    }
  };

  return (
    <div className="space-y-2" aria-label={t('vacay.subscribeHolidays')}>
      <IcsHeader
        mobile={mobile}
        enabled={enabled}
        updatingEnabled={updatingEnabled}
        onToggle={() => void toggleEnabled()}
      />
      {enabled && (
        <div className={mobile ? 'space-y-2' : 'ms-7 space-y-2'}>
          {loading && (
            <div className="flex items-center gap-2 py-2 text-caption text-content-muted" role="status">
              <Loader2 size={14} className="animate-spin" />
              {t('vacay.loadingCalendars')}
            </div>
          )}
          {!loading && calendars.length === 0 && (
            <p className={mobile ? 'font-geist text-caption text-m-muted' : 'text-caption text-content-faint'}>
              {t('vacay.noIcsCalendars')}
            </p>
          )}
          {calendars.map((cal) => (
            <IcsRow
              key={cal.id}
              calendar={cal}
              mobile={mobile}
              onUpdate={updateIcsCalendar}
              onDelete={deleteIcsCalendar}
            />
          ))}
          <IcsCalendarControls
            mobile={mobile}
            showAddForm={showAddForm}
            setShowAddForm={setShowAddForm}
            saving={saving}
            url={url}
            setUrl={setUrl}
            label={label}
            setLabel={setLabel}
            color={color}
            setColor={setColor}
            onSubmit={submit}
          />
        </div>
      )}
      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function IcsRow({
  calendar,
  mobile,
  onUpdate,
  onDelete,
}: {
  calendar: { id: number; label: string; color: string; url?: string; last_error: string | null; event_count: number };
  mobile: boolean;
  onUpdate: (id: number, data: { label?: string; color?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(calendar.label);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const updateColor = async (color: string) => {
    setBusy(true);
    try {
      await onUpdate(calendar.id, { color });
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };
  const updateLabel = async () => {
    if (label.trim() && label !== calendar.label) {
      setBusy(true);
      try {
        await onUpdate(calendar.id, { label: label.trim() });
      } catch (e) {
        setError(message(e));
      } finally {
        setBusy(false);
      }
    }
  };
  const removeCalendar = async () => {
    setBusy(true);
    try {
      await onDelete(calendar.id);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={
        mobile
          ? 'mt-2 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3'
          : 'flex items-start gap-3 rounded-xl p-3'
      }
      style={mobile ? undefined : { background: 'var(--vg-surf)', border: '1px solid var(--vg-line)' }}
    >
      {mobile ? (
        <>
          <div className="flex items-center gap-[9px]">
            <ColorChoice value={calendar.color} mobile onChange={(color) => void updateColor(color)} />
            <input
              value={label}
              maxLength={80}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => void updateLabel()}
              aria-label={t('vacay.icsLabel')}
              className="min-w-0 flex-1 rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] font-[inherit] text-body font-semibold text-m-ink outline-none"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void removeCalendar()}
              aria-label={t('vacay.removeIcsCalendar')}
              className="inline-flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] text-m-muted"
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
          {calendar.url && (
            <input
              type="url"
              value={calendar.url}
              readOnly
              aria-label={t('vacay.icsUrl')}
              className="mt-2 w-full rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] font-[inherit] text-body text-m-ink outline-none"
            />
          )}
        </>
      ) : (
        <>
          <ColorChoice value={calendar.color} mobile={false} onChange={(color) => void updateColor(color)} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <input
              value={label}
              maxLength={80}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => void updateLabel()}
              aria-label={t('vacay.icsLabel')}
              style={{
                width: '100%',
                fontSize: 'calc(13px * var(--fs-scale-body, 1))',
                fontWeight: 500,
                padding: '8px 14px',
                borderRadius: 10,
                background: 'var(--bg-input)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            {calendar.url && (
              <input
                type="url"
                value={calendar.url}
                readOnly
                aria-label={t('vacay.icsUrl')}
                style={{ borderRadius: 10 }}
                className="w-full rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-input)] px-[14px] py-2 font-[inherit] text-body font-medium text-[var(--text-primary)] outline-none"
              />
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void removeCalendar()}
            aria-label={t('vacay.removeIcsCalendar')}
            className="shrink-0 rounded-md p-1.5 text-content-faint transition-colors hover:bg-danger-soft"
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
      {calendar.last_error && (
        <p role="status" className="mt-2 text-caption text-danger">
          {t('vacay.icsRefreshFailed')}: {calendar.last_error}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function ColorChoice({
  value,
  mobile,
  onChange,
}: {
  value: string;
  mobile: boolean;
  onChange: (color: string) => void;
}) {
  const { t } = useTranslation();
  const { open, toggle, close, pickerAttr } = useVacayCalendarColorPicker();

  return (
    <span data-vacay-color-picker={pickerAttr} className="relative flex-none">
      <button
        type="button"
        onClick={toggle}
        aria-label={t('vacay.calendarColor')}
        aria-expanded={open}
        title={t('vacay.calendarColor')}
        className={mobile ? 'block h-[26px] w-[26px] rounded-lg' : 'block h-7 w-7 rounded-lg'}
        style={{ background: value, border: mobile ? undefined : '2px solid var(--border-primary)' }}
      />
      {open &&
        (mobile ? (
          <span
            role="group"
            aria-label={t('vacay.calendarColor')}
            className="absolute start-0 top-[32px] z-10 grid w-max grid-cols-[repeat(4,22px)] gap-1 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] p-2 shadow-[0_8px_24px_rgba(0,0,0,.12)]"
          >
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => {
                  void onChange(c);
                  close();
                }}
                aria-label={c}
                aria-pressed={value === c}
                className={`h-[22px] w-[22px] rounded-md ${value === c ? 'ring-2 ring-[color:var(--m-ink)]' : ''}`}
                style={{ background: c }}
              />
            ))}
          </span>
        ) : (
          <div
            role="group"
            aria-label={t('vacay.calendarColor')}
            style={{
              position: 'absolute',
              top: 34,
              insetInlineStart: 0,
              zIndex: 50,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 12,
              padding: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 24px)',
              gap: 4,
              width: 'max-content',
            }}
          >
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => {
                  void onChange(c);
                  close();
                }}
                aria-label={c}
                aria-pressed={value === c}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: c,
                  border: value === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        ))}
    </span>
  );
}

function message(error: unknown): string {
  const e = error as { response?: { data?: { error?: string } }; message?: string };
  return e.response?.data?.error || e.message || 'Request failed';
}

function IcsHeader({
  mobile,
  enabled,
  updatingEnabled,
  onToggle,
}: {
  mobile: boolean;
  enabled: boolean;
  updatingEnabled: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className={mobile ? 'flex items-start gap-[11px] py-3' : 'flex items-center justify-between gap-3'}>
      <CalendarDays
        size={mobile ? 17 : 15}
        strokeWidth={mobile ? 2 : undefined}
        className={mobile ? 'mt-[1px] flex-none text-m-muted' : 'block shrink-0 text-content-muted'}
      />
      <div className="min-w-0 flex-1">
        <div className={mobile ? 'text-body font-bold' : 'text-body font-medium text-content'}>
          {t('vacay.subscribeHolidays')}
        </div>
        <p className={mobile ? 'font-geist text-caption text-m-muted' : 'mt-0.5 text-caption text-content-faint'}>
          {t('vacay.icsCalendarsHint')}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={t('vacay.subscribeHolidays')}
        disabled={updatingEnabled}
        onClick={onToggle}
        className={
          mobile
            ? `box-border h-[22px] w-[40px] flex-none rounded-full p-[2px] transition-colors duration-[180ms] ${enabled ? 'bg-m-act' : 'bg-[color:var(--m-trackoff)]'}`
            : `relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? 'bg-content' : 'bg-edge'}`
        }
      >
        <span
          className={
            mobile
              ? `block h-[18px] w-[18px] rounded-full transition-transform duration-[180ms] ${enabled ? 'translate-x-[18px] bg-[color:var(--m-actfg)] rtl:-translate-x-[18px]' : 'translate-x-0 bg-[color:var(--m-knob)]'}`
              : 'absolute start-1 h-4 w-4 rounded-full bg-surface-card transition-transform duration-200'
          }
          style={!mobile ? { transform: enabled ? 'translateX(20px)' : 'translateX(0)' } : undefined}
        />
      </button>
    </div>
  );
}

type IcsCalendarControlsProps = {
  mobile: boolean;
  showAddForm: boolean;
  setShowAddForm: (show: boolean) => void;
  saving: boolean;
  url: string;
  setUrl: (url: string) => void;
  label: string;
  setLabel: (label: string) => void;
  color: string;
  setColor: (color: string) => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
};

function IcsCalendarControls(props: IcsCalendarControlsProps) {
  const { mobile, showAddForm, setShowAddForm, saving, url, setUrl, label, setLabel, color, setColor, onSubmit } =
    props;
  const { t } = useTranslation();
  const onClose = () => {
    setShowAddForm(false);
    setLabel('');
    setUrl('');
  };
  return (
    <>
      {showAddForm ? (
        <form
          onSubmit={(e) => void onSubmit(e)}
          className={
            mobile
              ? 'mt-2 rounded-[14px] border-[1.5px] border-dashed border-[color:var(--m-rowbr)] p-3'
              : 'flex items-start gap-3 rounded-xl border border-dashed p-3'
          }
          style={mobile ? undefined : { borderColor: 'var(--vg-line2)', background: 'var(--vg-surf)' }}
        >
          {!mobile && <ColorChoice value={color} mobile={false} onChange={setColor} />}
          <div className={mobile ? 'space-y-2' : 'min-w-0 flex-1 space-y-1.5'}>
            <div className="flex gap-2">
              <input
                required
                maxLength={80}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={t('vacay.icsLabel')}
                aria-label={t('vacay.icsLabel')}
                className={
                  mobile
                    ? 'min-w-0 flex-1 rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] font-[inherit] text-body font-semibold text-m-ink outline-none'
                    : 'w-full rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-input)] px-[14px] py-2 font-[inherit] text-body font-medium text-[var(--text-primary)] outline-none'
                }
              />
              {mobile && <ColorChoice value={color} mobile onChange={setColor} />}
            </div>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t('vacay.icsUrl')}
              aria-label={t('vacay.icsUrl')}
              style={{ borderRadius: 10 }}
              className={
                mobile
                  ? 'w-full rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] px-[11px] py-[9px] font-[inherit] text-body text-m-ink outline-none'
                  : 'w-full rounded-[10px] border border-[var(--border-primary)] bg-[var(--bg-input)] px-[14px] py-2 font-[inherit] text-body font-medium text-[var(--text-primary)] outline-none'
              }
            />
            <div className={mobile ? 'mt-[7px] flex gap-2' : 'flex gap-1.5 pt-0.5'}>
              <button
                type="submit"
                disabled={saving || !url.trim() || !label.trim()}
                className={
                  mobile
                    ? 'flex min-w-0 flex-1 items-center justify-center gap-[6px] rounded-[10px] bg-m-act p-[9px] text-body font-semibold text-m-actfg disabled:opacity-40'
                    : 'flex flex-1 items-center justify-center gap-1.5 rounded-md bg-content px-2 py-1.5 text-caption font-medium text-surface-card transition-colors disabled:opacity-40'
                }
              >
                {saving && <Loader2 size={mobile ? 13 : 12} className="animate-spin" />}
                {saving ? t('vacay.loadingCalendars') : t('vacay.add')}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className={
                  mobile
                    ? 'flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] text-m-muted'
                    : 'rounded-md bg-surface-secondary px-2 py-1.5 text-caption text-content-muted transition-colors'
                }
              >
                {mobile ? <X size={14} /> : '✕'}
              </button>
            </div>
            {saving && <p className="text-caption text-content-muted">{t('vacay.icsInitialFetchHint')}</p>}
          </div>
        </form>
      ) : (
        <IcsAddButton mobile={mobile} onClick={() => setShowAddForm(true)} />
      )}
    </>
  );
}

function IcsAddButton({ mobile, onClick }: { mobile: boolean; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        mobile
          ? 'inline-flex items-center gap-[6px] rounded-full border-[1.5px] border-dashed border-[color:var(--m-rowbr)] px-[13px] py-2 font-geist text-caption font-semibold text-m-muted'
          : 'flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-2.5 text-caption font-medium transition-colors'
      }
      style={
        mobile ? undefined : { borderColor: 'var(--vg-line2)', background: 'var(--vg-surf)', color: 'var(--vg-ink2)' }
      }
    >
      <Plus size={mobile ? 12 : 13} strokeWidth={mobile ? 2.2 : undefined} className="block shrink-0" />
      {t('vacay.subscribeHolidays')}
    </button>
  );
}
