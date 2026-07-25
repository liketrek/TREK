import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAtlas } from '../../../pages/atlas/useAtlas'
import MIconBtn from '../../components/MIconBtn'
import MSheet from '../../components/MSheet'
import MChip from '../../components/MChip'
import MAtlasStatsCard from './MAtlasStatsCard'
import MAtlasSearch from './MAtlasSearch'
import MAtlasCountryPopup from './MAtlasCountryPopup'
import MAtlasBucketSheet from './MAtlasBucketSheet'

const removeBtnCls = 'mt-4 w-full rounded-full bg-[rgba(214,39,59,.12)] py-[11px] text-center text-[0.8125rem] font-bold text-[color:var(--m-st-danger)]' // theme-lint-disable — fixed status-danger tint

/**
 * Mobile atlas screen: the interactive world map fills the viewport, the
 * five-column stats card floats above the bottom nav and the search overlay
 * flies the map to a country. All map/data logic comes from the shared
 * useAtlas hook — this file is presentation and wiring only.
 */
export default function MAtlas() {
  const atlas = useAtlas()
  const {
    t,
    navigate,
    resolveName,
    loading,
    mapRef,
    regionTooltipRef,
    stats,
    countries,
    bucketList,
    selectedCountry,
    countryDetail,
    handleUnmarkCountry,
    select_country_from_search,
    atlas_country_options,
  } = atlas
  const [searchOpen, setSearchOpen] = useState(false)
  const [bucketOpen, setBucketOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  // The dock FAB is the search button on this screen (demo Z. 1099) and hands
  // off via ?search=1, mirroring the ?create= contract of the other pages.
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    if (searchParams.get('search') == null) return
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next, { replace: true })
    setSearchOpen(true)
  }, [searchParams, setSearchParams])

  // A search fly-to on a visited country loads its detail — surface it as a sheet.
  useEffect(() => {
    if (selectedCountry && countryDetail) setDetailOpen(true)
  }, [selectedCountry, countryDetail])

  // Suggestions for the empty search field: recently visited countries first,
  // then countries already on the bucket list.
  const suggestions = useMemo(() => {
    const seen = new Set<string>()
    const list: { code: string; label: string }[] = []
    const visited = [...countries].sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || ''))
    for (const c of visited) {
      if (seen.has(c.code)) continue
      seen.add(c.code)
      list.push({ code: c.code, label: resolveName(c.code) })
    }
    for (const item of bucketList) {
      const code = item.country_code
      if (!code || code.length !== 2 || seen.has(code)) continue
      seen.add(code)
      list.push({ code, label: resolveName(code) })
    }
    return list.slice(0, 5)
  }, [countries, bucketList, resolveName])

  if (loading) {
    return (
      <div className="relative h-full">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--m-rowbr)] border-t-m-ink" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full overflow-hidden">
      <div ref={mapRef} className="absolute inset-0 z-[1] bg-[color:var(--m-mapb)] [&_.leaflet-control-zoom]:hidden" />
      {/* Region hover tooltip — positioned imperatively by useAtlas. */}
      <div
        ref={regionTooltipRef}
        style={{ display: 'none' }}
        className="pointer-events-none fixed z-[80] min-w-[120px] rounded-[10px] border border-[color:var(--m-shbr)] bg-[color:var(--m-sheetop)] px-[14px] py-[10px] text-[0.75rem] text-m-ink shadow-[0_4px_16px_rgba(0,0,0,.18)]"
      />

      {/* Full-width bucket-list button. The bottom nav makes a back button
          redundant on this main-nav screen, so the header spans the width. */}
      <div className="absolute left-4 right-4 top-[var(--m-safe-top,12px)] z-[5]">
        <button
          type="button"
          onClick={() => setBucketOpen(true)}
          className="flex h-[38px] w-full items-center justify-center rounded-full border border-[color:var(--m-gbr)] bg-[color:var(--m-sheet)] px-4 text-[0.78125rem] font-bold text-m-ink shadow-[0_5px_12px_-8px_rgba(0,0,0,.18)]"
        >
          {t('atlas.bucketTab')}
        </button>
      </div>

      <MAtlasStatsCard stats={stats} />

      <MAtlasSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        options={atlas_country_options}
        suggestions={suggestions}
        isVisited={(code) => countries.some((c) => c.code === code)}
        isOnBucketList={(code) => bucketList.some((b) => b.country_code === code)}
        onSelect={(code) => {
          setSearchOpen(false)
          select_country_from_search(code)
        }}
      />

      {/* Country detail sheet (visited country with trips/places). */}
      <MSheet
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        variant="card"
        ariaLabel={selectedCountry ? resolveName(selectedCountry) : undefined}
      >
        {selectedCountry && countryDetail && (
          <div className="p-5">
            <div className="flex items-center gap-3">
              <img
                src={`https://flagcdn.com/w80/${selectedCountry.toLowerCase()}.png`}
                alt=""
                className="h-[30px] w-[42px] flex-none rounded-[6px] object-cover shadow-[0_1px_3px_rgba(0,0,0,.25)]"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[1.0625rem] font-extrabold text-m-ink">{resolveName(selectedCountry)}</div>
                <div className="mt-[2px] font-geist text-[0.6875rem] text-m-muted">
                  {countryDetail.places.length} {t('atlas.places')} · {countryDetail.trips.length} {t('atlas.trips')}
                </div>
              </div>
              <MIconBtn variant="neutral" size={34} onClick={() => setDetailOpen(false)} ariaLabel={t('common.close')}>
                <X size={16} strokeWidth={2.2} />
              </MIconBtn>
            </div>
            {countryDetail.trips.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-[6px]">
                {countryDetail.trips.slice(0, 6).map((trip) => (
                  <MChip key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)}>
                    {trip.title}
                  </MChip>
                ))}
              </div>
            )}
            {countryDetail.manually_marked && (
              <button
                type="button"
                onClick={() => {
                  setDetailOpen(false)
                  handleUnmarkCountry(selectedCountry)
                }}
                className={removeBtnCls}
              >
                {t('atlas.unmark')}
              </button>
            )}
          </div>
        )}
      </MSheet>

      <MAtlasBucketSheet atlas={atlas} open={bucketOpen} onClose={() => setBucketOpen(false)} />
      <MAtlasCountryPopup atlas={atlas} />
    </div>
  )
}
