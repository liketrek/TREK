// FE-W4NAVH-001 to FE-W4NAVH-005
import { describe, it, expect, beforeEach } from 'vitest'
import { CalendarDays, Globe, LayoutGrid } from 'lucide-react'
import { renderHook } from '@testing-library/react'
import { TranslationProvider } from '../../i18n/TranslationContext'
import { useAddonStore } from '../../store/addonStore'
import { usePluginStore } from '../../store/pluginStore'
import { useNavItems } from './navItems'

function wrapper({ children }: { children: React.ReactNode }) {
  return <TranslationProvider>{children}</TranslationProvider>
}

const render = () => renderHook(() => useNavItems(), { wrapper })

beforeEach(() => {
  useAddonStore.setState({ addons: [] })
  usePluginStore.setState({ plugins: [] })
})

describe('useNavItems', () => {
  it('FE-W4NAVH-001: always starts with the pinned Dashboard entry', () => {
    const { result } = render()

    expect(result.current).toHaveLength(1)
    expect(result.current[0]).toMatchObject({ id: 'dashboard', to: '/dashboard', icon: LayoutGrid, pinned: true })
  })

  it('FE-W4NAVH-002: appends enabled global addons with their signature icons', () => {
    useAddonStore.setState({
      addons: [
        { id: 'vacay', name: 'Vacay', icon: 'Calendar', type: 'global', enabled: true },
        { id: 'atlas', name: 'Atlas', icon: 'Map', type: 'global', enabled: true },
      ] as never,
    })

    const { result } = render()

    expect(result.current.map(i => i.id)).toEqual(['dashboard', 'vacay', 'atlas'])
    expect(result.current[1].icon).toBe(CalendarDays)
    expect(result.current[2].icon).toBe(Globe)
  })

  it('FE-W4NAVH-003: ignores disabled and non-global addons', () => {
    useAddonStore.setState({
      addons: [
        { id: 'vacay', name: 'Vacay', icon: 'Calendar', type: 'global', enabled: false },
        { id: 'budget', name: 'Budget', icon: 'Wallet', type: 'trip', enabled: true },
      ] as never,
    })

    const { result } = render()

    expect(result.current.map(i => i.id)).toEqual(['dashboard'])
  })

  it('FE-W4NAVH-004: appends page plugins under a plugin: id and skips other plugin types', () => {
    usePluginStore.setState({
      plugins: [
        { id: 'notes', name: 'Notes', icon: 'Stethoscope', type: 'page' },
        { id: 'fx', name: 'Currency', icon: null, type: 'widget' },
      ] as never,
    })

    const { result } = render()

    expect(result.current.map(i => i.id)).toEqual(['dashboard', 'plugin:notes'])
    expect(result.current[1]).toMatchObject({ to: '/plugins/notes', label: 'Notes' })
  })

  it('FE-W4NAVH-005: keeps the item list stable while the stores do not change', () => {
    const { result, rerender } = render()
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })
})
