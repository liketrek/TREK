import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../../../tests/helpers/render'
import { resetAllStores } from '../../../tests/helpers/store'
import { useSettingsStore } from '../../store/settingsStore'
import WeatherWidget from './WeatherWidget'

vi.mock('../../api/client', async (importOriginal) => {
  const original = await importOriginal() as any
  return {
    ...original,
    weatherApi: {
      get: vi.fn(),
    },
  }
})

// Import after mock so we get the mocked version
import { weatherApi } from '../../api/client'

const buildWeather = (overrides = {}) => ({
  temp: 20,
  main: 'Clear',
  description: 'clear sky',
  type: 'forecast',
  ...overrides,
})

beforeEach(() => {
  sessionStorage.clear()
  vi.clearAllMocks()
  resetAllStores()
})

describe('WeatherWidget', () => {
  it('FE-COMP-WEATHERWIDGET-001: renders nothing when lat or lng is null', () => {
    const { container } = render(
      <WeatherWidget lat={null} lng={null} date="2025-06-01" />
    )
    expect(container.firstChild).toBeNull()
  })

  it('FE-COMP-WEATHERWIDGET-002: shows loading indicator while fetching', () => {
    vi.mocked(weatherApi.get).mockReturnValue(new Promise(() => {}))
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    expect(screen.getByText('…')).toBeInTheDocument()
  })

  it('FE-COMP-WEATHERWIDGET-003: shows error dash when fetch fails', async () => {
    vi.mocked(weatherApi.get).mockRejectedValue(new Error('Network error'))
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  it('FE-COMP-WEATHERWIDGET-004: shows error dash when API returns error field', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue({ temp: 0, main: '', description: '', type: '', error: 'Not available' })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument()
    })
  })

  it('FE-COMP-WEATHERWIDGET-005: displays temperature in Celsius', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ temp: 20 }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('20°C')).toBeInTheDocument()
    })
  })

  it('FE-COMP-WEATHERWIDGET-006: converts temperature to Fahrenheit', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ temp: 20 }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'fahrenheit' } })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('68°F')).toBeInTheDocument()
    })
  })

  it('FE-COMP-WEATHERWIDGET-007: shows "Ø" prefix for climate data', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ temp: 15, main: 'Clouds', type: 'climate' }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText(/Ø/)).toBeInTheDocument()
    })
  })

  it('FE-COMP-WEATHERWIDGET-008: compact mode renders inline without description', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ description: 'clear sky' }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })
    const { container } = render(
      <WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" compact={true} />
    )
    await waitFor(() => {
      expect(screen.getByText('20°C')).toBeInTheDocument()
    })
    expect(screen.queryByText('clear sky')).not.toBeInTheDocument()
    // Outer element should be a span
    const tempSpan = screen.getByText('20°C')
    expect(tempSpan.closest('span')).toBeInTheDocument()
    expect(container.querySelector('div')).toBeNull()
  })

  it('FE-COMP-WEATHERWIDGET-009: non-compact mode shows description', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ description: 'clear sky' }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" compact={false} />)
    await waitFor(() => {
      expect(screen.getByText('clear sky')).toBeInTheDocument()
    })
  })

  it('FE-COMP-WEATHERWIDGET-010: uses fresh cached data from sessionStorage without refetching', async () => {
    const cached = buildWeather({ temp: 20 })
    sessionStorage.setItem('weather_48.86_2.35_2025-06-01_en', JSON.stringify({ data: cached, fetchedAt: Date.now() }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('20°C')).toBeInTheDocument()
    })
    expect(weatherApi.get).not.toHaveBeenCalled()
  })

  it('FE-COMP-WEATHERWIDGET-011: re-fetches in background for cached climate data', async () => {
    const climateData = buildWeather({ temp: 15, main: 'Clouds', type: 'climate', description: 'cloudy' })
    const forecastData = buildWeather({ temp: 22, main: 'Clear', type: 'forecast', description: 'clear sky' })
    sessionStorage.setItem('weather_48.86_2.35_2025-06-01_en', JSON.stringify({ data: climateData, fetchedAt: Date.now() }))
    vi.mocked(weatherApi.get).mockResolvedValue(forecastData)
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })

    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)

    // Initially shows climate data
    await waitFor(() => {
      expect(screen.getByText(/Ø/)).toBeInTheDocument()
    })

    // After background fetch resolves, shows forecast data
    await waitFor(() => {
      expect(screen.getByText('22°C')).toBeInTheDocument()
    })
    expect(screen.queryByText(/Ø/)).not.toBeInTheDocument()
  })

  // #2167 — a standalone PWA keeps sessionStorage alive across days, so a
  // forecast fetched before the trip was still shown unchanged on the day itself.
  it('FE-COMP-WEATHERWIDGET-012: revalidates a forecast cache entry older than the TTL', async () => {
    const staleData = buildWeather({ temp: 20 })
    const freshData = buildWeather({ temp: 22 })
    sessionStorage.setItem(
      'weather_48.86_2.35_2025-06-01_en',
      JSON.stringify({ data: staleData, fetchedAt: Date.now() - 2 * 60 * 60 * 1000 }),
    )
    vi.mocked(weatherApi.get).mockResolvedValue(freshData)
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })

    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)

    // Serve-then-revalidate: the stale value renders immediately …
    await waitFor(() => {
      expect(screen.getByText(/20°C|22°C/)).toBeInTheDocument()
    })
    // … and the background refresh replaces it and the cache entry.
    await waitFor(() => {
      expect(screen.getByText('22°C')).toBeInTheDocument()
    })
    expect(weatherApi.get).toHaveBeenCalledTimes(1)
    const stored = JSON.parse(sessionStorage.getItem('weather_48.86_2.35_2025-06-01_en')!)
    expect(stored.data.temp).toBe(22)
    expect(typeof stored.fetchedAt).toBe('number')
  })

  it('FE-COMP-WEATHERWIDGET-013: treats a pre-TTL raw cache entry as stale and refreshes it', async () => {
    // Live PWA sessions still hold entries in the old bare-result format.
    sessionStorage.setItem('weather_48.86_2.35_2025-06-01_en', JSON.stringify(buildWeather({ temp: 18 })))
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ temp: 25 }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })

    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)

    await waitFor(() => {
      expect(screen.getByText('25°C')).toBeInTheDocument()
    })
    expect(weatherApi.get).toHaveBeenCalledTimes(1)
  })

  // #2167 (mrwulf) — the widget must be able to say WHERE the forecast is for.
  it('FE-COMP-WEATHERWIDGET-014: renders locationName as a tooltip title', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ temp: 20 }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" locationName="Rome" />)
    await waitFor(() => {
      expect(screen.getByText('20°C')).toBeInTheDocument()
    })
    expect(screen.getByTitle('Rome')).toBeInTheDocument()
  })

  it('FE-COMP-WEATHERWIDGET-015: sends the user language and keys the cache by it', async () => {
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ temp: 20 }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius', language: 'de' } })
    render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('20°C')).toBeInTheDocument()
    })
    expect(weatherApi.get).toHaveBeenCalledWith(48.86, 2.35, '2025-06-01', 'de')
    expect(sessionStorage.getItem('weather_48.86_2.35_2025-06-01_de')).not.toBeNull()
  })

  // The day-local anchor (#2167) moves whenever the day is edited, so a single
  // failed lookup must not keep the badge on the dash for the widget's lifetime.
  it('FE-COMP-WEATHERWIDGET-016: clears the error dash once a new anchor resolves', async () => {
    vi.mocked(weatherApi.get).mockRejectedValueOnce(new Error('Network error'))
    vi.mocked(weatherApi.get).mockResolvedValue(buildWeather({ temp: 21 }))
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })

    const { rerender } = render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    rerender(<WeatherWidget lat={41.9} lng={12.5} date="2025-06-01" />)

    await waitFor(() => {
      expect(screen.getByText('21°C')).toBeInTheDocument()
    })
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('FE-COMP-WEATHERWIDGET-017: clears the error dash when the new anchor comes from cache', async () => {
    vi.mocked(weatherApi.get).mockRejectedValue(new Error('Network error'))
    sessionStorage.setItem(
      'weather_41.9_12.5_2025-06-01_en',
      JSON.stringify({ data: buildWeather({ temp: 24 }), fetchedAt: Date.now() }),
    )
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, temperature_unit: 'celsius' } })

    const { rerender } = render(<WeatherWidget lat={48.86} lng={2.35} date="2025-06-01" />)
    await waitFor(() => {
      expect(screen.getByText('—')).toBeInTheDocument()
    })

    rerender(<WeatherWidget lat={41.9} lng={12.5} date="2025-06-01" />)

    await waitFor(() => {
      expect(screen.getByText('24°C')).toBeInTheDocument()
    })
    expect(weatherApi.get).toHaveBeenCalledTimes(1)
  })
})
