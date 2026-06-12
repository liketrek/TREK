import { useTranslation } from '../../i18n'
import { MOOD_CONFIG, WEATHER_CONFIG } from '../../pages/journeyDetail/JourneyDetailPage.constants'

export function MoodChip({ mood }: { mood: string }) {
  const { t } = useTranslation()
  const config = MOOD_CONFIG[mood]
  if (!config) return null
  const Icon = config.icon
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: config.bg, color: config.text }}>
      <Icon size={11} />
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
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
      <Icon size={11} />
      {t(config.label)}
    </div>
  )
}
