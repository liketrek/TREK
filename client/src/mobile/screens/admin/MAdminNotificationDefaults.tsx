import type { NotificationDefault } from '@trek/shared';
import { EVENT_LABEL_KEYS, channelLabel } from '../../../components/Settings/notificationLabels';
import { useTranslation } from '../../../i18n';
import {
  DEFAULT_ICON,
  DEFAULT_LABEL_KEYS,
  NEXT_DEFAULT,
  defaultChannels,
  defaultOf,
} from '../../../pages/admin/notificationDefaultsModel';
import { useNotificationDefaults } from '../../../pages/admin/useNotificationDefaults';
import { MAdminCard, MAdminCardHead } from './MAdminUi';

const TONE: Record<NotificationDefault, string> = {
  on: 'border-transparent bg-m-act text-m-actfg',
  off: 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted',
  blocked:
    'border-transparent bg-[color:color-mix(in_srgb,var(--m-st-danger)_14%,transparent)] text-[color:var(--m-st-danger)]',
};

/**
 * What every user's notification cells start as (#1536), the phone's form of the
 * desktop grid: one row per event with a pill per channel, each tap cycling
 * On → Off → Blocked. Off is a default a user may still turn on, Blocked is off
 * for everyone and locked in their settings.
 */
export default function MAdminNotificationDefaults() {
  const { t } = useTranslation();
  const { matrix, saving, cycle } = useNotificationDefaults();
  if (!matrix) return null;
  const channels = defaultChannels(matrix);

  return (
    <MAdminCard>
      <MAdminCardHead title={t('admin.notificationDefaults.title')} hint={t('admin.notificationDefaults.hint')} />
      {/* The key to the pills below, in the same three looks. */}
      <div className="mt-2 flex flex-wrap gap-[6px]" aria-hidden>
        {(['on', 'off', 'blocked'] as const).map((state) => {
          const Icon = DEFAULT_ICON[state];
          return (
            <span
              key={state}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-[2px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold ${TONE[state]}`}
            >
              <Icon size={10} strokeWidth={2.6} />
              {t(DEFAULT_LABEL_KEYS[state])}
            </span>
          );
        })}
      </div>
      <div className={`mt-1 transition-opacity ${saving ? 'opacity-60' : ''}`}>
        {matrix.event_types.map((eventType) => {
          const implemented = matrix.implemented_combos[eventType] ?? [];
          const eventLabel = t(EVENT_LABEL_KEYS[eventType]) || eventType;
          return (
            <div key={eventType} className="border-t border-[color:var(--m-rowbr)] py-[10px] first:border-t-0">
              <div className="text-[length:calc(12.5px*var(--fs-scale-body,1))] font-bold text-m-ink">{eventLabel}</div>
              <div className="mt-[6px] flex flex-wrap gap-[6px]">
                {channels
                  .filter((ch) => implemented.includes(ch.id))
                  .map((ch) => {
                    const state = defaultOf(matrix, eventType, ch.id);
                    const Icon = DEFAULT_ICON[state];
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        data-state={state}
                        disabled={saving}
                        aria-label={`${eventLabel}, ${channelLabel(ch, t)}: ${t(DEFAULT_LABEL_KEYS[state])}`}
                        onClick={() => void cycle(eventType, ch.id, NEXT_DEFAULT[state])}
                        className={`inline-flex h-[28px] items-center gap-[5px] whitespace-nowrap rounded-full border px-[10px] text-[length:calc(11px*var(--fs-scale-body,1))] font-bold ${TONE[state]}`}
                      >
                        <Icon size={11} strokeWidth={2.6} aria-hidden />
                        {channelLabel(ch, t)}
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </MAdminCard>
  );
}
