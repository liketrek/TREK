import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'

export type MapLoadState = 'loading' | 'ready' | 'failed'
export type MapLoadReporter = (state: MapLoadState) => void

// Optional so the Leaflet basemap keeps working on maps that are not wrapped by
// MapViewAuto (the atlas and journey maps build their own map chrome).
const MapLoadContext = createContext<MapLoadReporter | null>(null)

export function useMapLoadStatus(): MapLoadReporter | null {
  return useContext(MapLoadContext)
}

export function MapLoadStatusProvider({
  children,
  initial = 'loading',
  onRetry,
}: {
  children: ReactNode
  initial?: MapLoadState
  onRetry: () => void
}) {
  const [state, setState] = useState<MapLoadState>(initial)
  const report = useCallback((next: MapLoadState) => setState(next), [])
  return (
    <MapLoadContext value={report}>
      {children}
      {state !== 'ready' && <MapLoadNotice state={state} onRetry={state === 'failed' ? onRetry : undefined} />}
    </MapLoadContext>
  )
}

const PILL = 'absolute inset-x-0 bottom-[calc(var(--bottom-nav-h,0px)+44px)] z-[5] mx-auto flex w-fit items-center gap-1.5 rounded-full border border-edge bg-surface-card px-3 py-1 text-caption font-semibold text-content-secondary shadow-sm backdrop-blur-md'

function MapLoadNotice({ state, onRetry }: { state: Exclude<MapLoadState, 'ready'>; onRetry?: () => void }) {
  const { t } = useTranslation()
  const failed = state === 'failed'
  return (
    <div role={failed ? 'alert' : 'status'} className={`${PILL} pointer-events-none`}>
      {failed
        ? <AlertTriangle size={13} strokeWidth={2.2} aria-hidden="true" />
        : <Loader2 size={13} strokeWidth={2.2} className="animate-spin" aria-hidden="true" />}
      <span>{failed ? t('common.error') : t('common.loading')}</span>
      {failed && onRetry && (
        <button type="button" onClick={onRetry} className="pointer-events-auto ml-1 underline underline-offset-2">
          {t('common.errorRetry')}
        </button>
      )}
    </div>
  )
}
