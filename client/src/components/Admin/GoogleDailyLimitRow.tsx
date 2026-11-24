import { Check } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { NumericInput } from '../shared/NumericInput'
import { fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import { HintMark, SETTINGS_BUTTON_PRIMARY } from '../Settings/settingsKit'
import { useGoogleQuota } from './useGoogleQuota'

/**
 * The daily ceiling on Google calls (#1582), as one row of the Google options:
 * today's count as a quiet line under the name, the number on the right, a save
 * button only while there is something to save. Laid out like settingsKit's
 * SettingRow; the count stays outside the <label>, so the field keeps the plain
 * name as its accessible name.
 */
export default function GoogleDailyLimitRow() {
  const { t } = useTranslation()
  const { status, draft, setDraft, dirty, saving, save } = useGoogleQuota()

  return (
    <div className={`px-4 py-3 ${saving ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex min-w-0 items-center gap-1.5">
            <label htmlFor="admin-google-daily-limit" className="font-medium text-content" style={fs(13, 'body')}>{t('admin.googleQuota.title')}</label>
            <HintMark hint={t('admin.googleQuota.subtitle')} />
          </div>
          {/* Today's count as plain text under the name; in the warning colour once the day is used up. */}
          {status && (
            <p className={`m-0 mt-0.5 tabular-nums ${status.exhausted ? 'text-warning' : 'text-content-faint'}`} style={fs(11.5)}>
              {status.exhausted
                ? t('admin.googleQuota.reached', { used: status.used_today })
                : status.daily_limit == null
                  ? t('admin.googleQuota.usedToday', { used: status.used_today })
                  : t('admin.googleQuota.usedOfLimit', { used: status.used_today, limit: status.daily_limit })}
            </p>
          )}
        </div>
        <div className="flex flex-none items-center gap-2">
          <div className="w-32">
            <NumericInput
              id="admin-google-daily-limit"
              mode="integer"
              value={draft}
              onValueChange={setDraft}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void save() } }}
              placeholder={t('admin.googleQuota.placeholder')}
              disabled={status === null || saving}
              className={`${INPUT} text-end font-geist tabular-nums`}
            />
          </div>
          {dirty && (
            <button type="button" onClick={() => void save()} disabled={saving}
              className={SETTINGS_BUTTON_PRIMARY}>
              <Check size={14} strokeWidth={2.2} />
              {t('common.save')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
