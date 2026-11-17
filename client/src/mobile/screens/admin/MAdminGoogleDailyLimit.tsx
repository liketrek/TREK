import { Check } from 'lucide-react';
import { useGoogleQuota } from '../../../components/Admin/useGoogleQuota';
import { NumericInput } from '../../../components/shared/NumericInput';
import { useTranslation } from '../../../i18n';
import MHintLabel from '../../components/MHintLabel';
import { MAdminButton } from './MAdminUi';

/**
 * The daily cap on Google requests, the phone's form of the desktop
 * GoogleDailyLimitRow: today's count under the name (in the warning colour once
 * the day is used up), the cap in a small field, and a save while it differs.
 */
export default function MAdminGoogleDailyLimit() {
  const { t } = useTranslation();
  const { status, draft, setDraft, dirty, saving, save } = useGoogleQuota();

  let today: string | null = null;
  if (status) {
    if (status.exhausted) today = t('admin.googleQuota.reached', { used: status.used_today });
    else if (status.daily_limit == null) today = t('admin.googleQuota.usedToday', { used: status.used_today });
    else today = t('admin.googleQuota.usedOfLimit', { used: status.used_today, limit: status.daily_limit });
  }

  return (
    <div
      className={`flex items-center gap-3 border-t border-[color:var(--m-rowbr)] py-[11px] ${saving ? 'opacity-60' : ''}`}
    >
      <div className="min-w-0 flex-1">
        <MHintLabel label={t('admin.googleQuota.title')} hint={t('admin.googleQuota.subtitle')} />
        {today && (
          <p
            className={`mt-[1px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] tabular-nums ${
              status?.exhausted ? 'text-[color:var(--m-st-pending)]' : 'text-m-muted'
            }`}
          >
            {today}
          </p>
        )}
      </div>
      <NumericInput
        aria-label={t('admin.googleQuota.title')}
        mode="integer"
        value={draft}
        onValueChange={setDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void save();
          }
        }}
        placeholder={t('admin.googleQuota.placeholder')}
        disabled={status === null || saving}
        className="h-[34px] w-[88px] flex-none rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 text-end font-geist text-[length:calc(12.5px*var(--fs-scale-body,1))] tabular-nums text-m-ink outline-none placeholder:text-m-faint"
      />
      {dirty && (
        <MAdminButton busy={saving} onClick={() => void save()}>
          {!saving && <Check size={12} strokeWidth={2.4} />}
          {t('common.save')}
        </MAdminButton>
      )}
    </div>
  );
}
