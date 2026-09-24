import { useState, useRef } from 'react'
import { Sunrise, Sunset } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { dayWindow } from './dayWindow'
import CustomTimePicker from '../shared/CustomTimePicker'
import SettingsHint from './SettingsHint'

export default function DayWindowFields({ start, end, endMode = 'route', onSave }: {
  start?: string
  end?: string
  endMode?: 'route' | 'stop'
  onSave?: (key: string, value: string) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<{ start?: string; end?: string }>({})
  const sent = useRef({ start, end })
  const shownStart = draft.start ?? start ?? ''
  const shownEnd = draft.end ?? end ?? ''
  const invalid = !!shownStart && !!shownEnd && !dayWindow(shownStart, shownEnd)
  const change = (field: 'start' | 'end', value: string) => {
    setDraft(prev => ({ ...prev, [field]: value }))
    if (value !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return
    if (value !== (sent.current[field] ?? '')) {
      sent.current[field] = value
      onSave?.(`roadtrip_day_${field}`, value)
    }
  }
  return (
    <fieldset className="flex min-w-0 flex-col gap-3">
      <legend className="sr-only">{t('roadtrip.window.title')}</legend>
      {(['start', 'end'] as const).map(field => {
        const Icon = field === 'start' ? Sunrise : Sunset
        return (
          <div key={field} className="flex min-h-9 items-center gap-3">
            <Icon size={16} className="shrink-0 text-content-faint" aria-hidden />
            <span className="min-w-0 flex-1 text-body text-content-secondary">{t(`roadtrip.window.${field}`)}</span>
            <CustomTimePicker
              value={field === 'start' ? shownStart : shownEnd}
              disabled={!onSave}
              aria-label={t(`roadtrip.window.${field}`)}
              aria-describedby="roadtrip-window-hint"
              aria-invalid={invalid || undefined}
              onChange={value => change(field, value)}
              style={{ width: '7rem' }}
            />
          </div>
        )
      })}
      {invalid
        ? <p id="roadtrip-window-hint" role="alert" className="text-caption text-danger">{t('roadtrip.window.invalid')}</p>
        : <SettingsHint id="roadtrip-window-hint">{t('roadtrip.window.hint')}</SettingsHint>}
      <fieldset className="flex min-w-0 flex-col gap-2 border-t border-edge-faint pt-3">
        <legend className="sr-only">{t('roadtrip.window.endAt')}</legend>
        <span className="text-body text-content-secondary">{t('roadtrip.window.endAt')}</span>
        <div className="flex flex-wrap gap-2">
          {(['route', 'stop'] as const).map(mode => (
            <label key={mode} className={`relative flex min-h-9 flex-1 cursor-pointer items-center rounded-lg border px-3 py-2 text-caption has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${endMode === mode ? 'border-accent bg-accent-subtle text-accent-on' : 'border-edge bg-surface-input text-content-secondary'}`}>
              <input type="radio" name="roadtrip-day-end-mode" value={mode} checked={endMode === mode} disabled={!onSave}
                onChange={() => onSave?.('roadtrip_day_end_mode', mode)}
                aria-describedby="roadtrip-end-mode-hint" className="sr-only" />
              {t(`roadtrip.window.${mode === 'route' ? 'onRoute' : 'atStop'}`)}
            </label>
          ))}
        </div>
        <SettingsHint id="roadtrip-end-mode-hint">{t(`roadtrip.window.${endMode === 'stop' ? 'stopHint' : 'routeHint'}`)}</SettingsHint>
      </fieldset>
    </fieldset>
  )
}
