import { useState } from 'react'
import type { BookPageSetup, JourneyStats } from '@trek/shared'
import { StudioElementsPanel } from './StudioElementsPanel'
import { StudioLayersPanel } from './StudioLayersPanel'
import { StudioTravelPanel } from './StudioTravelPanel'
import { StudioThemePanel } from './theme/StudioThemePanel'
import { StudioTemplatesPanel } from './templates/StudioTemplatesPanel'
import { StudioRail } from './sidebar/StudioRail'
import { StudioPagesPanel } from './sidebar/StudioPagesPanel'
import { StudioContentPanel } from './sidebar/StudioContentPanel'
import { RAIL_IDS, type RailSection } from './sidebar/railSections'
import type { StudioUploader } from './studioUpload'

/**
 * The left side of Studio: a narrow rail of sections and one wide panel showing
 * whichever is open.
 *
 * The shape is Canva's and it is the right one here for a plain reason: a book
 * has a handful of completely different kinds of thing you reach for (which
 * page, what from the journey, what arrangement, what to draw), and putting
 * them behind tabs in a single 200px column would make each of them cramped.
 * An icon rail costs 64px and gives the panel the room a photo browser needs.
 *
 * Which section is open is the shell's when it says so (`section` and
 * `onSection`), so the inspector on the other side can open the Theme or the
 * Layers panel; on its own the sidebar keeps it itself and opens on Pages.
 */

export interface JourneySource {
  /**
   * The journey's title and subtitle, which a cover is set in when the book has
   * no title of its own. The Studio always gives them; a source built only for
   * the content browser may leave them out.
   */
  title?: string
  subtitle?: string | null
  entries: {
    id: number
    title: string | null
    story: string | null
    location: string | null
    date: string | null
    /** Where the stop is, when the entry recorded one. Null on a written-only entry. */
    lat: number | null
    lng: number | null
    mood: string | null
    weather: string | null
    pros: string[]
    cons: string[]
    /** The pictures attached to this entry, as trek_photos ids. */
    photoIds: number[]
  }[]
  /** `entryIds` is empty for a picture that sits only in the gallery. */
  photos: { photoId: number; caption?: string | null; entryIds: number[] }[]
  /** photoId to the words of the entry it belongs to, lower-cased. */
  photoEntries: Record<number, string>
}

/** The translator, with the parameters some of the strings here take. */
export type StudioT = (k: string, params?: Record<string, string | number>) => string

export function StudioSidebar({
  page, pxPerMm, bookView, source, stats, path, t, locale,
  canEdit, onUpload, onToggleStop, providers = [], onBrowseProvider, section, onSection,
}: {
  page: BookPageSetup
  pxPerMm: number
  bookView: boolean
  source: JourneySource
  /** What the journey adds up to, for the travel elements. Null while loading or on failure. */
  stats: JourneyStats | null
  /** The roads the trip took, for a map that draws them. Empty when it has none. */
  path: [number, number][][]
  t: StudioT
  locale: string
  /** False for a viewer: no upload, no switching stops, nothing that writes. */
  canEdit: boolean
  /** Pictures into the gallery, or into one entry. See studioUpload.ts. */
  onUpload: StudioUploader
  /** Switch a stop on or off in the figures. Resolves false when it did not land. */
  onToggleStop: (entryId: number, excluded: boolean) => Promise<boolean>
  /** Photo providers connected for this user, each a way in next to the upload (#2271). */
  providers?: { id: string; name: string }[]
  /** Opens the provider picker; answers the photo ids that landed, none when closed. */
  onBrowseProvider?: (provider: string, entryId: number | null) => Promise<number[]>
  /** The open section, when the shell holds it. */
  section?: RailSection
  onSection?: (section: RailSection) => void
}) {
  const [own, setOwn] = useState<RailSection>('pages')
  const open = section ?? own
  const setOpen = (next: RailSection) => {
    setOwn(next)
    onSection?.(next)
  }

  return (
    <>
      <StudioRail section={open} onSection={setOpen} t={t} />

      <aside
        className="st-panel st-side"
        id={RAIL_IDS.panel}
        role="tabpanel"
        aria-labelledby={RAIL_IDS.tab(open)}
      >
        {open === 'pages' && <StudioPagesPanel page={page} pxPerMm={pxPerMm} bookView={bookView} t={t} />}
        {open === 'content' && (
          <StudioContentPanel source={source} page={page} t={t} locale={locale} canEdit={canEdit} onUpload={onUpload}
            providers={providers} onBrowseProvider={onBrowseProvider} />
        )}
        {open === 'templates' && (
          <StudioTemplatesPanel page={page} pxPerMm={pxPerMm} t={t} locale={locale} source={source} stats={stats}
            path={path} onOpenContent={() => setOpen('content')} />
        )}
        {open === 'elements' && <StudioElementsPanel page={page} t={t} source={source} />}
        {open === 'travel' && (
          <StudioTravelPanel
            page={page}
            stats={stats}
            path={path}
            t={t}
            locale={locale}
            canEdit={canEdit}
            onToggleStop={onToggleStop}
          />
        )}
        {open === 'theme' && <StudioThemePanel t={t} />}
        {open === 'layers' && <StudioLayersPanel t={t} />}
      </aside>
    </>
  )
}
