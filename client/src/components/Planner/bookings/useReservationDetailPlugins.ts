import { usePluginStore } from '../../../store/pluginStore'

/** The plugins that draw a frame into a booking's detail. */
export function useReservationDetailPlugins() {
  return usePluginStore(s => s.plugins).filter(p => p.type === 'widget' && p.slot === 'reservation-detail')
}
