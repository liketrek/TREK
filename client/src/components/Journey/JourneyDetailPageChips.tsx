import { useTranslation } from '../../i18n'
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../pages/journeyDetail/JourneyDetailPage.constants'

export function MoodChip({ mood }: { mood: string }) {
  const { t } = useTranslation()
  const config = MOOD_CONFIG[mood]
  if (!config) return null
  const Icon = config.icon
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold" style={{ background: config.bg, color: config.text }}>
      <Icon size={12} />
      {t(config.label)}
    </div>
  )
}

export function WeatherChip({ weather }: { weather: string }) {
  const { t } = useTranslation()
  const config = WEATHER_CONFIG[weather]
  if (!config) return null
  const Icon = config.icon
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-semibold" style={{ background: 'var(--vg-surf2)', color: 'var(--vg-ink2)' }}>
      <Icon size={12} />
      {t(config.label)}
    </div>
  )
}
