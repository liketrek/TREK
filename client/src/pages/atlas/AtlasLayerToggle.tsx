import React from 'react'
import ToggleSwitch from '../../components/Settings/ToggleSwitch'
import type { TranslationFn } from '../../types'

interface AtlasLayerToggleProps {
  t: TranslationFn
  showPlanned: boolean
  onToggle: () => void
  plannedCount: number
}

// Floating switch that reveals the countries you only plan to visit (#1048). Hidden
// entirely when there is nothing planned — an always-present control for an empty set
// is just clutter over the globe. Sits on the desktop map only; the mobile atlas has
// its own compact toggle in MAtlas.
export default function AtlasLayerToggle({ t, showPlanned, onToggle, plannedCount }: AtlasLayerToggleProps): React.ReactElement | null {
  if (plannedCount <= 0) return null

  return (
    <div
      className="absolute z-20 hidden md:flex"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)', right: 18 }}
    >
      <div
        className="flex items-center gap-3 rounded-full border border-edge"
        style={{
          padding: '8px 14px',
          background: 'var(--bg-elevated)',
          boxShadow: 'var(--shadow-popover)',
          backdropFilter: 'blur(18px) saturate(180%)',
          WebkitBackdropFilter: 'blur(18px) saturate(180%)',
        }}
      >
        <span className="text-caption font-semibold text-content whitespace-nowrap">
          {t('atlas.showPlanned')}
        </span>
        <span className="text-caption font-bold tabular-nums text-content-muted">{plannedCount}</span>
        <ToggleSwitch on={showPlanned} onToggle={onToggle} label={t('atlas.showPlanned')} />
      </div>
    </div>
  )
}
