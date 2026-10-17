import { useMemo } from 'react'
import { Bike, Car, Footprints, Zap, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { usePluginStore } from '../../store/pluginStore'

export interface RouteModeOption {
  key: string
  label: string
}

/** The icon a route profile key is drawn with, wherever a leg or a day names its mode. */
export function routeModeIcon(mode: string | null | undefined): LucideIcon {
  if (mode === 'walking') return Footprints
  if (mode === 'cycling') return Bike
  if (mode?.startsWith('plugin:')) return Zap
  return Car
}

/**
 * Every mode a day or a single leg can be given: the three built-in profiles plus
 * each profile a granted routeProvider plugin declared, keyed 'plugin:<id>/<profile>'
 * and labeled by the plugin's manifest.
 */
export function useRouteModeOptions(): RouteModeOption[] {
  const { t } = useTranslation()
  const activePlugins = usePluginStore(s => s.plugins)
  return useMemo(() => {
    const opts: RouteModeOption[] = [
      { key: 'driving', label: t('mobileTrip.profileDriving') },
      { key: 'walking', label: t('mobileTrip.profileWalking') },
      { key: 'cycling', label: t('mobileTrip.profileCycling') },
    ]
    for (const p of activePlugins) {
      for (const prof of p.routeProfiles ?? []) opts.push({ key: `plugin:${p.id}/${prof.id}`, label: prof.label })
    }
    return opts
  }, [activePlugins, t])
}
