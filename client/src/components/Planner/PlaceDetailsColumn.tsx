import React, { useEffect, useRef, useState } from 'react'
import { Check, ImageOff, Loader2, ExternalLink } from 'lucide-react'
import type { MapsPlaceEnrichmentResult, PlacePhotoCandidate } from '@trek/shared'
import { mapsApi } from '../../api/client'
import type { TranslationFn } from '../../types'

/** The place the column is describing. Null while nothing is selected. */
export interface PlaceDetailsSelection {
  placeId?: string
  lat: number
  lng: number
  name: string
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
        { placeId: selection.placeId, lat: selection.lat, lng: selection.lng, name: selection.name, lang: language },
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

  return (
    <aside className="w-full sm:w-72 shrink-0 flex flex-col rounded-xl border border-edge bg-surface-secondary overflow-hidden self-stretch">
      <div className="px-3 py-2 border-b border-edge">
        <p className="text-caption font-medium text-content">{t('places.details.title')}</p>
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

        {selection && state === 'ready' && !data?.disabled && (
          <>
            <PhotoStrip
              photos={data?.photos ?? []}
              selectedImageUrl={selectedImageUrl}
              onPickImage={onPickImage}
              t={t}
            />
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
}): React.ReactElement {
  if (photos.length === 0) {
    return (
      <div className="flex items-center gap-2 text-caption text-content-muted">
        <ImageOff className="w-4 h-4" />
        {t('places.details.noPhotos')}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-caption text-content-muted">{t('places.details.pickImage')}</p>
      <div className="grid grid-cols-2 gap-2">
        {photos.map((photo) => {
          const picked = selectedImageUrl === photo.url
          return (
            <div key={photo.key} className="space-y-1">
              <button
                type="button"
                onClick={() => onPickImage(picked ? null : photo.url)}
                aria-pressed={picked}
                aria-label={photo.attribution ? `${t('places.details.pickImage')} — ${photo.attribution}` : t('places.details.pickImage')}
                className={`relative block w-full aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  picked ? 'border-accent' : 'border-edge hover:border-content-muted'
                }`}
              >
                <img src={photo.url} alt="" loading="lazy" className="w-full h-full object-cover" />
                {picked && (
                  <span className="absolute top-1 right-1 rounded-full bg-accent p-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                )}
              </button>
              <PhotoCredit photo={photo} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Author and licence under every thumbnail.
 *
 * Not decoration: Commons images are largely CC BY / CC BY-SA, and reusing one
 * without naming its author and licence does not satisfy those terms. When a
 * source hands us no author (Google), we say where it came from rather than
 * inventing a credit.
 */
function PhotoCredit({ photo }: { photo: PlacePhotoCandidate }): React.ReactElement {
  const sourceLabel = photo.source === 'google' ? 'Google' : photo.source === 'wikipedia' ? 'Wikipedia' : 'Wikimedia Commons'
  const credit = photo.attribution || sourceLabel

  return (
    <p className="text-caption leading-tight text-content-muted truncate" title={`${credit}${photo.license ? ` · ${photo.license}` : ''}`}>
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
    description.source === 'google' ? 'Google' : description.source === 'osm' ? 'OpenStreetMap' : 'Wikipedia'

  return (
    <div className="space-y-2">
      <p className="text-caption text-content-muted">{t('places.details.description')}</p>
      <p className="text-caption text-content whitespace-pre-line">{description.text}</p>
      <p className="text-caption leading-tight text-content-muted">
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
      <button
        type="button"
        onClick={() => onAdoptDescription(description.text)}
        className="text-caption px-2 py-1 rounded-lg border border-edge text-content hover:bg-surface disabled:opacity-50"
        disabled={hasDescription}
        title={hasDescription ? t('places.details.adoptBlocked') : undefined}
      >
        {t('places.details.adopt')}
      </button>
    </div>
  )
}
