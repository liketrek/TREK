import React, { useEffect, useRef, useState } from 'react'
import {
  Accessibility,
  Bike,
  Check,
  ChefHat,
  Clock,
  ExternalLink,
  ImageOff,
  Landmark,
  Leaf,
  Loader2,
  ScrollText,
  ShoppingBag,
  Sprout,
  Star,
  Sun,
  Wifi,
} from 'lucide-react'
import type { MapsPlaceEnrichmentResult, PlaceFact, PlacePhotoCandidate } from '@trek/shared'
import { mapsApi } from '../../api/client'
import type { TranslationFn } from '../../types'

/** The place the column is describing. Null while nothing is selected. */
export interface PlaceDetailsSelection {
  placeId?: string
  lat: number
  lng: number
  name: string
  /** The picked search result, so the server can skip its own details lookup. */
  details?: Record<string, unknown>
}

interface PlaceDetailsColumnProps {
  selection: PlaceDetailsSelection | null
  /** Currently chosen hero image, so the picked tile can show as picked. */
  selectedImageUrl?: string
  onPickImage: (url: string | null) => void
  onAdoptDescription: (text: string) => void
  /** True once the form's description field has something in it. */
  hasDescription: boolean
  language: string
  t: TranslationFn
}

/**
 * Module-level cache plus sessionStorage, same shape as usePlaceDetails in
 * PlaceInspector. Clicking back and forth between two search results must not
 * pay for the provider fan-out twice.
 */
const enrichmentCache = new Map<string, MapsPlaceEnrichmentResult>()

/** Test seam: the module-level cache otherwise leaks between cases. */
export function __clearEnrichmentCacheForTests(): void {
  enrichmentCache.clear()
}

function readSession(key: string): MapsPlaceEnrichmentResult | undefined {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as MapsPlaceEnrichmentResult) : undefined
  } catch {
    return undefined
  }
}

function writeSession(key: string, value: MapsPlaceEnrichmentResult): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode / quota — the in-memory cache still helps for this session */
  }
}

function cacheKeyFor(selection: PlaceDetailsSelection, language: string): string {
  const id = selection.placeId || `coords:${selection.lat}:${selection.lng}`
  return `enrich_${id}_${language}`
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Overline label, the section heading Vacay and the dashboard widgets share.
 * Uppercase with wide tracking, muted, no rule underneath.
 */
function Overline({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="text-caption font-semibold uppercase tracking-[0.14em] text-content-faint">{children}</p>
  )
}

export default function PlaceDetailsColumn({
  selection,
  selectedImageUrl,
  onPickImage,
  onAdoptDescription,
  hasDescription,
  language,
  t,
}: PlaceDetailsColumnProps): React.ReactElement {
  const [data, setData] = useState<MapsPlaceEnrichmentResult | null>(null)
  const [state, setState] = useState<LoadState>('idle')
  const abortRef = useRef<AbortController | null>(null)

  const selectionKey = selection ? cacheKeyFor(selection, language) : null

  useEffect(() => {
    // Abort whatever the previous selection started; its answer is no longer
    // about the place on screen.
    abortRef.current?.abort()
    abortRef.current = null

    if (!selection || !selectionKey) {
      setData(null)
      setState('idle')
      return
    }

    const cached = enrichmentCache.get(selectionKey) ?? readSession(selectionKey)
    if (cached) {
      enrichmentCache.set(selectionKey, cached)
      setData(cached)
      setState('ready')
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setState('loading')
    setData(null)

    mapsApi
      .placeEnrichment(
        {
          placeId: selection.placeId,
          lat: selection.lat,
          lng: selection.lng,
          name: selection.name,
          lang: language,
          details: selection.details,
        },
        controller.signal,
      )
      .then((result) => {
        if (controller.signal.aborted) return
        enrichmentCache.set(selectionKey, result)
        writeSession(selectionKey, result)
        setData(result)
        setState('ready')
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted || (err as { code?: string })?.code === 'ERR_CANCELED') return
        setState('error')
      })

    return () => controller.abort()
    // selectionKey folds in the place id (or its coordinates) and the language,
    // which is everything the answer depends on. Depending on `selection` itself
    // would refetch whenever the object identity changes without the place
    // having changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey, language])

  useEffect(() => () => abortRef.current?.abort(), [])

  const isEmpty =
    state === 'ready' && !data?.disabled && !data?.photos.length && !data?.description && !data?.facts.length

  return (
    <aside className="w-full sm:w-72 shrink-0 flex flex-col rounded-xl border border-edge bg-surface-secondary overflow-hidden self-stretch">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-edge shrink-0">
        <Landmark size={15} className="text-accent" />
        <span className="text-[13px] font-semibold text-content">{t('places.details.title')}</span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4">
        {!selection && <p className="text-caption text-content-muted">{t('places.details.empty')}</p>}

        {selection && state === 'loading' && (
          <div className="flex items-center gap-2 text-caption text-content-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('places.details.loading')}
          </div>
        )}

        {selection && state === 'error' && <p className="text-caption text-content-muted">{t('places.details.error')}</p>}

        {selection && state === 'ready' && data?.disabled && (
          <p className="text-caption text-content-muted">{t('places.details.disabled')}</p>
        )}

        {isEmpty && (
          <div className="flex items-center gap-2 text-caption text-content-muted">
            <ImageOff className="w-4 h-4 shrink-0" />
            {t('places.details.nothing')}
          </div>
        )}

        {selection && state === 'ready' && !data?.disabled && !isEmpty && (
          <>
            <PhotoStrip photos={data?.photos ?? []} selectedImageUrl={selectedImageUrl} onPickImage={onPickImage} t={t} />
            <FactList facts={data?.facts ?? []} t={t} />
            <DescriptionBlock
              description={data?.description ?? null}
              hasDescription={hasDescription}
              onAdoptDescription={onAdoptDescription}
              t={t}
            />
          </>
        )}
      </div>
    </aside>
  )
}

/**
 * The picture strip.
 *
 * A tight three-column grid rather than a lead image: this sits beside a form
 * in a dialog, and pictures that take half the column push the facts and the
 * description out of sight.
 *
 * Only the picture in play is credited in full. Crediting all of them at once
 * cost two lines each and drowned the column, and the licence obligation
 * attaches to the picture that gets used — which is the selected one, whose
 * credit also stays visible in the inspector after saving. Every tile still
 * carries the full credit as its tooltip and links to its source page.
 */
function PhotoStrip({
  photos,
  selectedImageUrl,
  onPickImage,
  t,
}: {
  photos: PlacePhotoCandidate[]
  selectedImageUrl?: string
  onPickImage: (url: string | null) => void
  t: TranslationFn
}): React.ReactElement | null {
  const [hovered, setHovered] = useState<string | null>(null)
  if (photos.length === 0) return null

  const shown = photos.find((p) => p.url === (hovered ?? selectedImageUrl)) ?? photos[0]

  return (
    <div className="space-y-2">
      <Overline>{t('places.details.pickImage')}</Overline>
      <div className="grid grid-cols-3 gap-1.5">
        {photos.map((photo) => (
          <PhotoTile
            key={photo.key}
            photo={photo}
            selected={selectedImageUrl === photo.url}
            onPick={onPickImage}
            onHover={setHovered}
            t={t}
          />
        ))}
      </div>
      <PhotoCredit photo={shown} />
    </div>
  )
}

function PhotoTile({
  photo,
  selected,
  onPick,
  onHover,
  t,
}: {
  photo: PlacePhotoCandidate
  selected: boolean
  onPick: (url: string | null) => void
  onHover: (url: string | null) => void
  t: TranslationFn
}): React.ReactElement {
  const credit = photo.attribution || sourceLabelFor(photo.source)

  return (
    <button
      type="button"
      onClick={() => onPick(selected ? null : photo.url)}
      onMouseEnter={() => onHover(photo.url)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(photo.url)}
      onBlur={() => onHover(null)}
      aria-pressed={selected}
      aria-label={`${t('places.details.pickImage')} — ${credit}`}
      title={`${credit}${photo.license ? ` · ${photo.license}` : ''}`}
      className={`group relative block w-full aspect-square overflow-hidden rounded-lg transition-shadow ${
        selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface-secondary' : 'ring-1 ring-edge hover:ring-content-muted'
      }`}
    >
      <img
        src={photo.url}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      {selected && (
        <span className="absolute top-1 right-1 rounded-full bg-accent p-0.5 shadow-card">
          <Check className="w-2.5 h-2.5 text-accent-on" />
        </span>
      )}
    </button>
  )
}

function sourceLabelFor(source: PlacePhotoCandidate['source']): string {
  if (source === 'google') return 'Google'
  if (source === 'wikipedia') return 'Wikipedia'
  return 'Wikimedia Commons'
}

/**
 * Author and licence for the picture currently in play.
 *
 * Not decoration: Commons images are largely CC BY / CC BY-SA, and reusing one
 * without naming its author does not satisfy those terms. When a source hands
 * us no author (Google), we say where it came from rather than inventing one.
 */
function PhotoCredit({ photo }: { photo: PlacePhotoCandidate }): React.ReactElement {
  const credit = photo.attribution || sourceLabelFor(photo.source)
  const full = `${credit}${photo.license ? ` · ${photo.license}` : ''}`

  return (
    <p className="text-caption leading-tight text-content-faint truncate" title={full}>
      {photo.sourceUrl ? (
        <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
          {credit}
        </a>
      ) : (
        credit
      )}
      {photo.license && (
        <>
          {' · '}
          {photo.licenseUrl ? (
            <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {photo.license}
            </a>
          ) : (
            photo.license
          )}
        </>
      )}
    </p>
  )
}

const FACT_ICONS: Record<PlaceFact['kind'], typeof ChefHat> = {
  rating: Star,
  cuisine: ChefHat,
  openingHours: Clock,
  menu: ScrollText,
  outdoorSeating: Sun,
  takeaway: ShoppingBag,
  delivery: Bike,
  wheelchair: Accessibility,
  vegetarian: Leaf,
  vegan: Sprout,
  internetAccess: Wifi,
}

/**
 * The OpenStreetMap facts, as chips.
 *
 * For a restaurant this is the whole point of the column: nothing will ever
 * write an encyclopaedia entry about it, but its cuisine, its hours and a link
 * to its menu are in the map data, and they came along with a lookup that had
 * already happened.
 */
function FactList({ facts, t }: { facts: PlaceFact[]; t: TranslationFn }): React.ReactElement | null {
  if (facts.length === 0) return null

  return (
    <div className="space-y-2">
      <Overline>{t('places.details.facts')}</Overline>
      <div className="flex flex-wrap gap-1.5">
        {facts.map((fact) => {
          const Icon = FACT_ICONS[fact.kind]
          const label = fact.value || t(`places.details.fact.${fact.kind}`)
          const body = (
            <>
              <Icon className="w-3 h-3 shrink-0" />
              <span className="truncate">{label}</span>
            </>
          )
          const shared = 'inline-flex items-center gap-1.5 max-w-full rounded-full border border-edge bg-surface px-2 py-1 text-caption text-content-secondary'

          return fact.url ? (
            <a
              key={fact.kind}
              href={fact.url}
              target="_blank"
              rel="noopener noreferrer"
              title={label}
              className={`${shared} hover:border-accent hover:text-content transition-colors`}
            >
              {body}
            </a>
          ) : (
            <span key={fact.kind} title={label} className={shared}>
              {body}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function DescriptionBlock({
  description,
  hasDescription,
  onAdoptDescription,
  t,
}: {
  description: MapsPlaceEnrichmentResult['description']
  hasDescription: boolean
  onAdoptDescription: (text: string) => void
  t: TranslationFn
}): React.ReactElement | null {
  if (!description) return null

  const sourceLabel =
    description.source === 'google'
      ? 'Google'
      : description.source === 'osm'
        ? 'OpenStreetMap'
        : description.source === 'wikivoyage'
          ? 'Wikivoyage'
          : 'Wikipedia'

  return (
    <div className="space-y-2">
      <Overline>{t('places.details.description')}</Overline>
      <div className="rounded-lg border border-edge bg-surface p-2.5 space-y-2">
        <p className="text-caption leading-relaxed text-content whitespace-pre-line">{description.text}</p>
        <p className="text-caption leading-tight text-content-faint">
          {description.sourceUrl ? (
            <a
              href={description.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 hover:underline"
            >
              {sourceLabel}
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          ) : (
            sourceLabel
          )}
          {description.license && ` · ${description.license}`}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onAdoptDescription(description.text)}
        className="w-full text-caption px-2 py-1.5 rounded-lg border border-edge text-content hover:bg-surface-hover disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
        disabled={hasDescription}
        title={hasDescription ? t('places.details.adoptBlocked') : undefined}
      >
        {t('places.details.adopt')}
      </button>
    </div>
  )
}
