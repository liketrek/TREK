import { AlertTriangle, Check } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { NumericInput } from '../shared/NumericInput'
import { fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import { SETTINGS_BUTTON_PRIMARY, StatusPill } from '../Settings/settingsKit'
import { useGoogleQuota } from './useGoogleQuota'

/**
 * The daily ceiling on Google calls (#1582), as one row of the Google options:
 * today's count as a pill beside the name, the number on the right, a save
 * button only while there is something to save. Laid out like settingsKit's
 * SettingRow, but with the pill outside the <label> so the field keeps the
 * plain name as its accessible name.
 */
export default function GoogleDailyLimitRow() {
  const { t } = useTranslation()
  const { status, draft, setDraft, dirty, saving, save } = useGoogleQuota()

  return (
    <div className={`px-3.5 py-3 ${saving ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1 basis-56">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="admin-google-daily-limit" className="font-medium text-content" style={fs(13, 'body')}>{t('admin.googleQuota.title')}</label>
            {/* Today's count beside the name it belongs to: a green dot while there is room, amber once the day is used up. */}
            {status && (
              status.exhausted ? (
                <StatusPill tone="warning" icon={<AlertTriangle size={11} strokeWidth={2.4} />}>
                  {t('admin.googleQuota.reached', { used: status.used_today })}
                </StatusPill>
              ) : (
                <StatusPill icon={<span aria-hidden className="me-0.5 h-1.5 w-1.5 rounded-full bg-success" />}>
                  {status.daily_limit == null
                    ? t('admin.googleQuota.usedToday', { used: status.used_today })
                    : t('admin.googleQuota.usedOfLimit', { used: status.used_today, limit: status.daily_limit })}
                </StatusPill>
              )
            )}
          </div>
          <p className="m-0 mt-0.5 leading-snug text-content-faint" style={fs(11.5)}>{t('admin.googleQuota.subtitle')}</p>
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
              className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
              <Check size={14} strokeWidth={2.2} />
              {t('common.save')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
