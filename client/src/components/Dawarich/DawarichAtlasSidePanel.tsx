import React, { useState } from 'react'
import { Globe2, Star } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useAddonStore } from '../../store/addonStore'
import { Tooltip } from '../shared/Tooltip'
import { useGlassGlare } from '../Atlas/useGlassGlare'
import DawarichIcon from '../shared/DawarichIcon'
import DawarichAtlasDialog from './DawarichAtlasDialog'

type Question = 'wishes' | 'countries'

/**
 * Dawarich's own panel on the Atlas, beside the stats.
 *
 * The Atlas is a map with a single glass panel floating over it, and everything
 * it offers lives in that panel. Dawarich answers two questions about the same
 * map — which wishes were actually reached, and which countries the recordings
 * say you were in — but they are *its* answers, not the Atlas's own numbers, and
 * squeezed under the wishlist they read as fine print nobody asked for.
 *
 * So it gets a panel of its own, in the same glass and stretched to the same
 * height, and the two questions are two tiles built like the stat blocks beside
 * them: a mark, then a small capitalised label. The lists they produce open in a
 * dialog — they are offers to read and confirm, and a bar over a world map is no
 * place to read anything.
 *
 * Renders nothing when the addon is off, so an Atlas without Dawarich looks
 * exactly as it did before.
 */
export default function DawarichAtlasSidePanel({
  style,
  dark,
  onChanged,
}: {
  /** The glass the Atlas panels are made of, handed down so the two cannot drift. */
  style: React.CSSProperties
  dark: boolean
  /** Called after something was written, so the Atlas can re-read itself. */
  onChanged?: () => void
}): React.ReactElement | null {
  const { t } = useTranslation()
  const addonEnabled = useAddonStore(state => state.isEnabled)
  const [asked, setAsked] = useState<Question | null>(null)
  const glare = useGlassGlare(dark)

  if (!addonEnabled('dawarich')) return null

  // theme-lint-disable — the panel floats on a blurred map: a solid surface
  // token would punch an opaque hole in the glass, so the tiles are a tint of
  // the same light the panel is made of.
  const tile = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'
  const tileHover = dark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.09)'

  const question = (id: Question, Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>, label: string) => (
    <button
      type="button"
      onClick={() => setAsked(id)}
      className="group flex flex-col items-center justify-center text-content-secondary hover:text-content"
      style={{
        background: tile,
        border: 'none',
        borderRadius: 14,
        cursor: 'pointer',
        fontFamily: 'inherit',
        gap: 6,
        minWidth: 74,
        padding: '10px 12px',
        transition: 'background 0.15s ease, color 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = tileHover }}
      onMouseLeave={e => { e.currentTarget.style.background = tile }}
    >
      <Icon size={17} strokeWidth={2} />
      <span
        className="font-bold uppercase tracking-wide whitespace-nowrap"
        style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))' }}
      >
        {label}
      </span>
    </button>
  )

  return (
    <>
      <div
        ref={glare.panelRef}
        onMouseMove={glare.onMouseMove}
        onMouseLeave={glare.onMouseLeave}
        className="relative hidden md:flex flex-col justify-center gap-3 overflow-hidden px-5 py-4"
        style={style}
      >
        {/* Liquid glass glare, and the border glow that follows the cursor —
            the same two layers the Atlas panel carries. */}
        <div ref={glare.glareRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0, transition: 'opacity 0.3s ease', borderRadius: 20 }} />
        <div ref={glare.borderGlareRef} className="absolute inset-0 pointer-events-none" style={{
          opacity: 0, transition: 'opacity 0.3s ease', borderRadius: 20,
          border: dark ? '1.5px solid rgba(255,255,255,0.5)' : '2px solid rgba(0,0,0,0.15)',
        }} />
        {/* The long explanation moved into the tooltip: on a panel this size it
            was three lines of grey that said what the two tiles already say. */}
        <Tooltip label={t('dawarich.atlas.trigger')} placement="top">
          <span className="relative flex items-center justify-center gap-2.5">
            <span className="flex-shrink-0 overflow-hidden rounded-[9px]">
              <DawarichIcon size={30} />
            </span>
            <span
              className="truncate font-black tracking-tight text-content"
              style={{ fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))' }}
            >
              {t('dawarich.title')}
            </span>
          </span>
        </Tooltip>

        <div className="relative flex items-stretch gap-2">
          {question('wishes', Star, t('dawarich.atlas.tab.wishes'))}
          {question('countries', Globe2, t('dawarich.atlas.tab.countries'))}
        </div>
      </div>

      {/* Mounted on open so every visit starts from a clean question rather than
          from a scan somebody ran an hour ago. */}
      {asked !== null && (
        <DawarichAtlasDialog
          isOpen
          initialTab={asked}
          onClose={() => setAsked(null)}
          onChanged={onChanged}
        />
      )}
    </>
  )
}
