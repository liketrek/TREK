import { useState, useEffect } from 'react'
import { Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudLightning, Wind } from 'lucide-react'
import { fetchWeather } from '../../services/weatherQueue'
import { useSettingsStore } from '../../store/settingsStore'

const WEATHER_ICON_MAP = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning,
  Snow: CloudSnow,
  Mist: Wind,
  Fog: Wind,
  Haze: Wind,
}

interface WeatherIconProps {
  main: string
  size?: number
}

function WeatherIcon({ main, size = 13 }: WeatherIconProps) {
  const Icon = WEATHER_ICON_MAP[main] || Cloud
  return <Icon size={size} strokeWidth={1.8} />
}

function getWeatherCache(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw === null) return undefined
    return JSON.parse(raw)
  } catch { return undefined }
}

function setWeatherCache(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// Matches the server's own forecast TTL. In a standalone PWA sessionStorage lives
// as long as the app process, so without a TTL a forecast fetched days before the
// trip day was still shown unchanged on the day itself (#2167).
const WEATHER_TTL_MS = 60 * 60 * 1000

interface WeatherWidgetProps {
  lat: number | null
  lng: number | null
  date: string
  compact?: boolean
  /** Vertical icon-over-temp layout that inherits its color (for the day badge). */
  stacked?: boolean
  /** Name of the place the forecast is anchored to — surfaces as a tooltip (#2167). */
  locationName?: string | null
}

export default function WeatherWidget({ lat, lng, date, compact = false, stacked = false, locationName = null }: WeatherWidgetProps) {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const isFahrenheit = useSettingsStore(s => s.settings.temperature_unit) === 'fahrenheit'
  const language = useSettingsStore(s => s.settings.language) || 'en'

  useEffect(() => {
    if (!lat || !lng || !date) return
    let cancelled = false
    const rLat = Math.round(lat * 100) / 100
    const rLng = Math.round(lng * 100) / 100
    // The language is part of the key: descriptions come back localized, and the
    // server caches per language too — a lang-less key would re-mix them here.
    const cacheKey = `weather_${rLat}_${rLng}_${date}_${language}`

    const revalidate = (acceptOnlyForecast) => {
      fetchWeather(lat, lng, date, language)
        .then(data => {
          if (cancelled || data.error || data.temp === undefined) return
          if (acceptOnlyForecast && data.type !== 'forecast') return
          setWeatherCache(cacheKey, { data, fetchedAt: Date.now() })
          setWeather(data)
        })
        .catch(() => {})
    }

    const cached = getWeatherCache(cacheKey)
    if (cached !== undefined && cached !== null) {
      // Entries written before the TTL landed are the bare result — treat as stale.
      const entry = cached.data !== undefined && typeof cached.fetchedAt === 'number'
        ? cached
        : { data: cached, fetchedAt: 0 }
      setWeather(entry.data)
      if (entry.data?.type === 'climate') {
        // Climate data: shown from cache, but re-fetched to upgrade to a forecast.
        revalidate(true)
      } else if (Date.now() - entry.fetchedAt > WEATHER_TTL_MS) {
        // Stale forecast: serve it, then refresh in the background.
        revalidate(false)
      }
    } else if (cached === null) {
      setFailed(true)
    } else {
      setLoading(true)
      fetchWeather(lat, lng, date, language)
        .then(data => {
          if (cancelled) return
          if (data.error || data.temp === undefined) {
            setFailed(true)
          } else {
            setWeatherCache(cacheKey, { data, fetchedAt: Date.now() })
            setWeather(data)
          }
        })
        .catch(() => { if (!cancelled) setFailed(true) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    return () => { cancelled = true }
  }, [lat, lng, date, language])

  if (!lat || !lng) return null

  const fontStyle = { fontFamily: "var(--font-system)" }

  if (loading) {
    return (
      <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: '#d1d5db', ...fontStyle }}>…</span>
    )
  }

  if (failed || !weather) {
    return (
      <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: '#9ca3af', ...fontStyle }}>—</span>
    )
  }

  const rawTemp = weather.temp
  const temp = rawTemp !== undefined ? Math.round(isFahrenheit ? rawTemp * 9/5 + 32 : rawTemp) : null
  const unit = isFahrenheit ? '°F' : '°C'
  const isClimate = weather.type === 'climate'

  // The forecast's anchor place, as a tooltip on every variant — no layout change,
  // but the widget finally says WHERE the weather is for (#2167).
  const title = locationName || undefined

  if (stacked) {
    return (
      <div title={title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, fontSize: 'calc(9.5px * var(--fs-scale-caption, 1))', fontWeight: 600, lineHeight: 1, color: 'inherit', ...fontStyle }}>
        <WeatherIcon main={weather.main} size={13} />
        {temp !== null && <span>{isClimate ? 'Ø' : ''}{temp}°</span>}
      </div>
    )
  }

  if (compact) {
    return (
      <span title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: isClimate ? '#a1a1aa' : '#6b7280', ...fontStyle }}>
        <WeatherIcon main={weather.main} size={12} />
        {temp !== null && <span>{isClimate ? 'Ø ' : ''}{temp}{unit}</span>}
      </span>
    )
  }

  return (
    <div title={title} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: isClimate ? '#71717a' : '#374151', background: 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '5px 10px', ...fontStyle }}>
      <WeatherIcon main={weather.main} size={15} />
      {temp !== null && <span style={{ fontWeight: 500 }}>{isClimate ? 'Ø ' : ''}{temp}{unit}</span>}
      {weather.description && <span style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: '#9ca3af', textTransform: 'capitalize' }}>{weather.description}</span>}
    </div>
  )
}
