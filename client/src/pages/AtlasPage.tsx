import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from '../i18n'
import Navbar from '../components/Layout/Navbar'
import apiClient from '../api/client'
import CustomSelect from '../components/shared/CustomSelect'
import EmptyState from '../components/shared/EmptyState'
import { Globe, MapPin, Briefcase, Calendar, Flag, PanelLeftOpen, PanelLeftClose, X, Star, Plus, Trash2, Search, Check, ArrowLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import type { TranslationFn } from '../types'
import { Tooltip } from '../components/shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../components/shared/DialogShell'
import { EditorField, GRID_2 } from '../components/shared/dialogParts'
import DawarichAtlasSidePanel from '../components/Dawarich/DawarichAtlasSidePanel'
import CountryFlag from '../components/shared/CountryFlag'
import { A2_TO_A3, countryCodeToFlag, findBucketDuplicate, isBucketDuplicateError, visitedRegionCount, withCountryMarkedVisited, type AtlasCountry, type AtlasStats, type AtlasData, type CountryDetail } from './atlas/atlasModel'
import { continentForCountry } from '@trek/shared'
import { useAtlas } from './atlas/useAtlas'
import AtlasCountrySearch from './atlas/AtlasCountrySearch'
import AtlasLayerToggle from './atlas/AtlasLayerToggle'
import { useToast } from '../components/shared/Toast'
import { getApiErrorMessage } from '../types'
import HelpAnchor from '../components/Help/HelpAnchor'
import AtlasCountryPlaces from '../components/Atlas/AtlasCountryPlaces'

// Fixed ids rather than useId: the page body stays free of hooks, and there is only one atlas.
const COUNTRY_DIALOG_TITLE = 'atlas-country-dialog-title'
const BUCKET_MONTH_ID = 'atlas-bucket-month'
const BUCKET_YEAR_ID = 'atlas-bucket-year'
/** The footer's destructive answer, filled like ConfirmDialog's. */
const DANGER_BUTTON = 'inline-flex items-center gap-1.5 rounded-[10px] bg-danger px-4 py-2 font-medium text-white hover:opacity-90' // theme-lint-disable: white on the danger fill, as ConfirmDialog draws it

export default function AtlasPage(): React.ReactElement {
  // ViewportRoute in App.tsx picks the branch now, so the phone screen is a
  // chunk of its own instead of a dead limb in this one.
  return (
    <>
      <HelpAnchor id="atlas" />
      <AtlasPageDesktop />
    </>
  )
}

function AtlasPageDesktop(): React.ReactElement {
  // Page = wiring container: the whole interactive globe (map lifecycle, atlas +
  // bucket data, mark/unmark flows, country search) lives in useAtlas. The page
  // only wires that state into JSX and its presentational SidebarContent helper.
  const {
    t, language, navigate, resolveName, dark, loading,
    mapRef, regionTooltipRef, panelRef, glareRef, borderGlareRef,
    handlePanelMouseMove, handlePanelMouseLeave,
    data, setData, stats, countries, selectedCountry, countryDetail,
    showPlanned, togglePlanned,
    loadCountryDetail, handleUnmarkCountry, select_country_from_search,
    visitedRegions, setVisitedRegions, regionsVisited, placesOpen, setPlacesOpen,
    atlas_country_search, set_atlas_country_search,
    atlas_country_results, set_atlas_country_results,
    atlas_country_open, set_atlas_country_open, atlas_country_options,
    atlas_place_results, atlas_places_loading, search_places, select_place_from_search,
    confirmAction, setConfirmAction, executeConfirmAction,
    bucketMonth, setBucketMonth, bucketYear, setBucketYear,
    bucketList, setBucketList, bucketTab, setBucketTab,
    showBucketAdd, setShowBucketAdd, bucketForm, setBucketForm,
    handleAddBucketItem, handleDeleteBucketItem, handleClearBucketVisit, handleBucketPoiSearch, handleSelectBucketPoi,
    bucketSearchResults, setBucketSearchResults,
    bucketPoiMonth, setBucketPoiMonth, bucketPoiYear, setBucketPoiYear,
    bucketSearching, bucketSearch, setBucketSearch, reloadAfterDawarich,
  } = useAtlas()
  const toast = useToast()
  // Solid surfaces when the user disabled transparency (read at render — the
  // attribute is already set by applyAppearance before navigating here).
  const noTransparency = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-no-transparency')

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <div className="flex items-center justify-center" style={{ paddingTop: 'var(--nav-h)', minHeight: 'calc(100vh - var(--nav-h))' }}>
          <div className="w-8 h-8 border-2 rounded-full animate-spin border-edge border-t-content" />
        </div>
      </div>
    )
  }

  // The glass both bottom panels are cut from. One object, because two panels
  // side by side that differ by a blur radius look like a mistake.
  const glassPanel: React.CSSProperties = {
    background: noTransparency ? (dark ? '#15151c' : '#ffffff') : (dark ? 'rgba(10,10,15,0.55)' : 'rgba(255,255,255,0.2)'),
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid ' + (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    borderRadius: 20,
    boxShadow: dark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.08)',
  }

  return (
    <div className="h-screen overflow-hidden bg-surface">
      <Navbar />
      <div style={{ position: 'fixed', top: 'var(--nav-h)', left: 0, right: 0, bottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Map */}
        <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 1, background: dark ? '#1a1a2e' : '#f0f0f0' }} />

        {/* Region tooltip (custom, always on top, ref-controlled to avoid re-renders) */}
        <div ref={regionTooltipRef} style={{
          position: 'fixed', display: 'none',
          zIndex: 9999, pointerEvents: 'none',
          background: noTransparency ? (dark ? '#0f0f14' : '#ffffff') : (dark ? 'rgba(15,15,20,0.92)' : 'rgba(255,255,255,0.96)'),
          color: dark ? '#fff' : '#111',
          borderRadius: 10, padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          fontSize: 'calc(12px * var(--fs-scale-body, 1))', minWidth: 120,
        }} />
        <AtlasCountrySearch
          dark={dark}
          t={t}
          search={atlas_country_search}
          setSearch={set_atlas_country_search}
          results={atlas_country_results}
          setResults={set_atlas_country_results}
          open={atlas_country_open}
          setOpen={set_atlas_country_open}
          options={atlas_country_options}
          onSelect={select_country_from_search}
          placeResults={atlas_place_results}
          placesLoading={atlas_places_loading}
          onQueryChange={search_places}
          onSelectPlace={select_place_from_search}
        />
        <AtlasLayerToggle
          t={t}
          showPlanned={showPlanned}
          onToggle={togglePlanned}
          plannedCount={stats.totalCountriesPlanned || 0}
        />

        {placesOpen && selectedCountry && countryDetail && (
        <DialogShell
          onClose={() => setPlacesOpen(false)}
          labelledBy="atlas-places-title"
          width="detail"
          header={(
            <DialogHeader
              tile={<DialogTile><CountryFlag code={selectedCountry} size={26} /></DialogTile>}
              tint={NEUTRAL_TINT}
              labelId="atlas-places-title"
              onClose={() => setPlacesOpen(false)}
              title={resolveName(selectedCountry)}
              sub={`${countryDetail.places.length} ${t('atlas.places')}`}
            />
          )}
        >
          <AtlasCountryPlaces detail={countryDetail} onOpenTrip={id => navigate(`/trips/${id}`)} />
        </DialogShell>
      )}

      {/* Mobile: Bottom bar */}
        <div className="md:hidden absolute left-0 right-0 z-10 flex justify-center" style={{ bottom: 'calc(84px + env(safe-area-inset-bottom, 0px) + 8px)', touchAction: 'manipulation' }}>
          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{ background: dark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)' }}>
            {/* Countries highlighted */}
            <div className="text-center px-3 py-1.5 rounded-xl" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
              <p className="text-3xl font-black tabular-nums leading-none text-content">{stats.totalCountries}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide mt-1 text-content-faint">{t('atlas.countries')}</p>
            </div>
            {[[regionsVisited, t('atlas.regions')], [stats.totalTrips, t('atlas.trips')], [stats.totalPlaces, t('atlas.places')], [stats.totalCities || 0, t('atlas.cities')], [stats.totalDays, t('atlas.days')]].map(([v, l], i) => (
              <div key={i} className="text-center px-1">
                <p className="text-xl font-black tabular-nums leading-none text-content">{v}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide mt-1 text-content-faint">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Panels — bottom center, glass effect.
            Three columns so the Atlas panel stays exactly centred over the map
            however wide its neighbour is: Dawarich sits in the left column,
            right-aligned against the middle one, and stretches to its height. */}
        <div
          className="hidden md:grid absolute z-10 items-stretch"
          style={{
            bottom: 16,
            left: 20,
            right: 20,
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'stretch',
            gap: 12,
            pointerEvents: 'none',
          }}
        >
          <div className="flex justify-end" style={{ pointerEvents: 'auto', minWidth: 0 }}>
            <DawarichAtlasSidePanel style={glassPanel} dark={dark} onChanged={reloadAfterDawarich} />
          </div>
        <div
          ref={panelRef}
          onMouseMove={handlePanelMouseMove}
          onMouseLeave={handlePanelMouseLeave}
          className="hidden md:flex flex-col overflow-hidden transition-[width,height,transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            ...glassPanel,
            width: 'fit-content',
            maxWidth: '100%',
            pointerEvents: 'auto',
            position: 'relative',
          }}
        >
          {/* Liquid glass glare effect */}
          <div ref={glareRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0, transition: 'opacity 0.3s ease', borderRadius: 20 }} />
          {/* Border glow that follows cursor */}
          <div ref={borderGlareRef} className="absolute inset-0 pointer-events-none" style={{
            opacity: 0, transition: 'opacity 0.3s ease', borderRadius: 20,
            border: dark ? '1.5px solid rgba(255,255,255,0.5)' : '2px solid rgba(0,0,0,0.15)',
          }} />
          <SidebarContent
            data={data} stats={stats} countries={countries} selectedCountry={selectedCountry}
            countryDetail={countryDetail} resolveName={resolveName}
            regionsVisited={regionsVisited}
            countryRegions={selectedCountry ? visitedRegionCount(visitedRegions, selectedCountry) : 0}
            onOpenPlaces={() => setPlacesOpen(true)}
            onCountryClick={loadCountryDetail} onTripClick={(id) => navigate(`/trips/${id}`)} onUnmarkCountry={handleUnmarkCountry}
            bucketList={bucketList} bucketTab={bucketTab} setBucketTab={setBucketTab}
            showBucketAdd={showBucketAdd} setShowBucketAdd={setShowBucketAdd}
            bucketForm={bucketForm} setBucketForm={setBucketForm}
            onAddBucket={handleAddBucketItem} onDeleteBucket={handleDeleteBucketItem}
            onClearBucketVisit={handleClearBucketVisit}
            onSearchBucket={handleBucketPoiSearch} onSelectBucketPoi={handleSelectBucketPoi}
            bucketSearchResults={bucketSearchResults} setBucketSearchResults={setBucketSearchResults} bucketPoiMonth={bucketPoiMonth} setBucketPoiMonth={setBucketPoiMonth}
            bucketPoiYear={bucketPoiYear} setBucketPoiYear={setBucketPoiYear} bucketSearching={bucketSearching}
            bucketSearch={bucketSearch} setBucketSearch={setBucketSearch}
            t={t} dark={dark}
          />
        </div>
        <div aria-hidden />
        </div>

      </div>

      {/* Country action popup: the flag and the name at the head, what can be
          done with the country below. A region names its country under its own name. */}
      {confirmAction && (
        <DialogShell
          onClose={() => setConfirmAction(null)}
          labelledBy={COUNTRY_DIALOG_TITLE}
          width="narrow"
          header={(
            <DialogHeader
              tile={(
                <DialogTile>
                  {confirmAction.code.length === 2 ? (
                    <img src={`https://flagcdn.com/w80/${confirmAction.code.toLowerCase()}.png`} alt={confirmAction.code} className="h-6 w-[34px] rounded-[5px] object-cover ring-1 ring-edge-faint" />
                  ) : (
                    <span className="leading-none" style={fs(26, 'subtitle')}>{countryCodeToFlag(confirmAction.code)}</span>
                  )}
                </DialogTile>
              )}
              // The two removals take the danger wash ConfirmDialog asks its destructive questions in.
              tint={confirmAction.type === 'unmark' || confirmAction.type === 'unmark-region' ? 'var(--danger-soft)' : NEUTRAL_TINT}
              labelId={COUNTRY_DIALOG_TITLE}
              onClose={() => setConfirmAction(null)}
              title={confirmAction.name}
              sub={confirmAction.countryName || undefined}
            />
          )}
          footer={(
            <DialogFooter>
              {confirmAction.type === 'bucket' && (
                <DialogButton onClick={() => setConfirmAction({ ...confirmAction, type: confirmAction.regionCode ? 'choose-region' : 'choose' })} icon={<ArrowLeft size={14} strokeWidth={2.2} />}>
                  {t('common.back')}
                </DialogButton>
              )}
              <FooterSpacer />
              {confirmAction.type !== 'bucket' && (
                <DialogButton onClick={() => setConfirmAction(null)}>{t('common.cancel')}</DialogButton>
              )}
              {confirmAction.type === 'mark' && (
                <DialogButton variant="primary" onClick={executeConfirmAction}>{t('atlas.markVisited')}</DialogButton>
              )}
              {confirmAction.type === 'unmark' && (
                <button type="button" onClick={executeConfirmAction} className={DANGER_BUTTON} style={fs(13, 'body')}>
                  {t('atlas.unmark')}
                </button>
              )}
              {confirmAction.type === 'unmark-region' && (
                <button type="button" onClick={async () => {
                  const { code: countryCode, regionCode: rCode } = confirmAction
                  if (!rCode) return
                  try {
                    await apiClient.delete(`/addons/atlas/region/${rCode}/mark`)
                    setVisitedRegions(prev => {
                      const remaining = (prev[countryCode] || []).filter(r => r.code !== rCode)
                      const next = { ...prev, [countryCode]: remaining }
                      if (remaining.length === 0) delete next[countryCode]
                      return next
                    })
                    // If no visible regions remain at all (not just manually-marked ones:
                    // the server now hides a region regardless of how it was derived, and
                    // cascades to the country the same way), remove the country too, but
                    // only when it has no real place/trip data of its own: a country with
                    // real places is never actually hidden server-side (#1490), so
                    // optimistically removing it here would just flash and reappear on
                    // the next reload.
                    setData(prev => {
                      if (!prev) return prev
                      const c = prev.countries.find(c => c.code === countryCode)
                      if (!c || c.placeCount > 0 || c.tripCount > 0) return prev
                      const remainingRegions = (visitedRegions[countryCode] || []).filter(r => r.code !== rCode)
                      if (remainingRegions.length > 0) return prev
                      const cont = continentForCountry(countryCode)
                      return {
                        ...prev,
                        countries: prev.countries.filter(c => c.code !== countryCode),
                        stats: { ...prev.stats, totalCountries: Math.max(0, prev.stats.totalCountries - 1) },
                        continents: { ...prev.continents, [cont]: Math.max(0, (prev.continents?.[cont] || 0) - 1) },
                      }
                    })
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, t('common.error')))
                  }
                  setConfirmAction(null)
                }} className={DANGER_BUTTON} style={fs(13, 'body')}>
                  {t('atlas.unmark')}
                </button>
              )}
              {confirmAction.type === 'bucket' && (
                <DialogButton variant="primary" icon={<Star size={14} strokeWidth={2.2} />} onClick={async () => {
                  const targetDate = bucketMonth > 0 && bucketYear > 0 ? `${bucketYear}-${String(bucketMonth).padStart(2, '0')}` : null
                  // #1898: one entry per target date. The dialog stays open on a
                  // duplicate so another month can be picked right away.
                  if (findBucketDuplicate(bucketList, { name: confirmAction.name, country_code: confirmAction.code, target_date: targetDate, lat: null, lng: null })) {
                    toast.error(t('atlas.bucketDuplicate'))
                    return
                  }
                  try {
                    const r = await apiClient.post('/addons/atlas/bucket-list', { name: confirmAction.name, country_code: confirmAction.code, target_date: targetDate, region_code: confirmAction.regionCode ?? null })
                    setBucketList(prev => [r.data.item, ...prev])
                  } catch (err) {
                    if (isBucketDuplicateError(err)) {
                      toast.error(t('atlas.bucketDuplicate'))
                      return
                    }
                    toast.error(getApiErrorMessage(err, t('common.error')))
                  }
                  setBucketMonth(0); setBucketYear(0)
                  setConfirmAction(null)
                }}>
                  {t('atlas.addToBucket')}
                </DialogButton>
              )}
            </DialogFooter>
          )}
        >
          {confirmAction.type === 'choose' && (
            <div className="flex flex-col gap-2">
              <CountryChoice icon={MapPin} title={t('atlas.markVisited')} hint={t('atlas.markVisitedHint')} onClick={async () => {
                try {
                  await apiClient.post(`/addons/atlas/country/${confirmAction.code}/mark`)
                  setData(prev => (prev ? withCountryMarkedVisited(prev, confirmAction.code) : prev))
                } catch (err) {
                  toast.error(getApiErrorMessage(err, t('common.error')))
                }
                setConfirmAction(null)
              }} />
              <CountryChoice icon={Star} tone="text-warning" title={t('atlas.addToBucket')} hint={t('atlas.addToBucketHint')}
                onClick={() => setConfirmAction({ ...confirmAction, type: 'bucket' })} />
              {(() => {
                const wishlistItems = bucketList.filter(b => b.country_code === confirmAction.code)
                if (wishlistItems.length === 0) return null
                return (
                  <CountryChoice icon={Trash2} tone="text-danger" title={t('atlas.removeFromBucket')} hint={t('atlas.removeFromBucketHint')} onClick={async () => {
                    await Promise.all(wishlistItems.map(item => handleDeleteBucketItem(item.id)))
                    setConfirmAction(null)
                  }} />
                )
              })()}
            </div>
          )}

          {confirmAction.type === 'choose-region' && (
            <div className="flex flex-col gap-2">
              <CountryChoice icon={MapPin} title={t('atlas.markVisited')} hint={t('atlas.markRegionVisitedHint')} onClick={async () => {
                const { code: countryCode, name: rName, regionCode: rCode } = confirmAction
                if (!rCode) return
                try {
                  await apiClient.post(`/addons/atlas/region/${rCode}/mark`, { name: rName, country_code: countryCode })
                  setVisitedRegions(prev => {
                    const existing = prev[countryCode] || []
                    if (existing.find(r => r.code === rCode)) return prev
                    return { ...prev, [countryCode]: [...existing, { code: rCode, name: rName, placeCount: 0, manuallyMarked: true }] }
                  })
                  setData(prev => (prev ? withCountryMarkedVisited(prev, countryCode) : prev))
                } catch (err) {
                  toast.error(getApiErrorMessage(err, t('common.error')))
                }
                setConfirmAction(null)
              }} />
              <CountryChoice icon={Star} tone="text-warning" title={t('atlas.addToBucket')} hint={t('atlas.addToBucketHint')}
                onClick={() => setConfirmAction({ ...confirmAction, type: 'bucket' })} />
            </div>
          )}

          {confirmAction.type === 'unmark' && (
            <p className="m-0 text-content-secondary" style={fs(13.5, 'body')}>{t('atlas.confirmUnmark')}</p>
          )}

          {confirmAction.type === 'unmark-region' && (
            <p className="m-0 text-content-secondary" style={fs(13.5, 'body')}>{t('atlas.confirmUnmarkRegion')}</p>
          )}

          {confirmAction.type === 'mark' && (
            <p className="m-0 text-content-secondary" style={fs(13.5, 'body')}>{t('atlas.confirmMark')}</p>
          )}

          {confirmAction.type === 'bucket' && (
            <>
              <p className="m-0 text-content-secondary" style={fs(13.5, 'body')}>{t('atlas.bucketWhen')}</p>
              <div className={GRID_2}>
                <EditorField label={t('atlas.month')} htmlFor={BUCKET_MONTH_ID}>
                  <CustomSelect
                    id={BUCKET_MONTH_ID}
                    value={String(bucketMonth)}
                    onChange={v => setBucketMonth(Number(v))}
                    placeholder={t('atlas.month')}
                    options={[
                      { value: '0', label: t('common.none') },
                      ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString(language, { month: 'long' }) })),
                    ]}
                    size="sm"
                  />
                </EditorField>
                <EditorField label={t('atlas.year')} htmlFor={BUCKET_YEAR_ID}>
                  <CustomSelect
                    id={BUCKET_YEAR_ID}
                    value={String(bucketYear)}
                    onChange={v => setBucketYear(Number(v))}
                    placeholder={t('atlas.year')}
                    options={[
                      { value: '0', label: t('common.none') },
                      ...Array.from({ length: 20 }, (_, i) => ({ value: String(new Date().getFullYear() + i), label: String(new Date().getFullYear() + i) })),
                    ]}
                    size="sm"
                  />
                </EditorField>
              </div>
            </>
          )}
        </DialogShell>
      )}
    </div>
  )
}

/** One answer of the country dialog, built like an export row: icon tile, what it does, and what that means. */
function CountryChoice({ icon: Icon, tone = 'text-content-secondary', title, hint, onClick }: {
  icon: LucideIcon
  /** The icon's colour class. */
  tone?: string
  title: string
  hint: string
  onClick: () => void
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-card px-3 py-2.5 text-left transition-colors hover:bg-surface-hover"
    >
      <span className={`grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary transition-colors group-hover:bg-surface-card ${tone}`}>
        <Icon size={16} strokeWidth={1.9} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-content" style={fs(13.5, 'body')}>{title}</span>
        <span className="block text-content-muted" style={fs(11.5)}>{hint}</span>
      </span>
      <ChevronRight size={15} strokeWidth={2} className="flex-none text-content-faint transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

interface SidebarContentProps {
  data: AtlasData | null
  stats: AtlasStats
  /** Regions visited over every country, and in the country picked (#1639). */
  regionsVisited: number
  countryRegions: number
  /** Opens the list of the picked country's places (#2174). */
  onOpenPlaces: () => void
  countries: AtlasCountry[]
  selectedCountry: string | null
  countryDetail: CountryDetail | null
  resolveName: (code: string) => string
  onCountryClick: (code: string) => void
  onTripClick: (id: number) => void
  onUnmarkCountry?: (code: string) => void
  bucketList: any[]
  bucketTab: 'stats' | 'bucket'
  setBucketTab: (tab: 'stats' | 'bucket') => void
  showBucketAdd: boolean
  setShowBucketAdd: (v: boolean) => void
  bucketForm: { name: string; notes: string; lat: string; lng: string; target_date: string }
  setBucketForm: (f: { name: string; notes: string; lat: string; lng: string; target_date: string }) => void
  onAddBucket: () => Promise<void>
  onDeleteBucket: (id: number) => Promise<void>
  onClearBucketVisit: (id: number) => void | Promise<void>
  onSearchBucket: () => Promise<void>
  onSelectBucketPoi: (result: any) => void
  bucketSearchResults: any[]
  setBucketSearchResults: (v: string[]) => void
  bucketPoiMonth: number
  setBucketPoiMonth: (v: number) => void
  bucketPoiYear: number
  setBucketPoiYear: (v: number) => void
  bucketSearching: boolean
  bucketSearch: string
  setBucketSearch: (v: string) => void
  t: TranslationFn
  dark: boolean
}

function SidebarContent({ data, stats, regionsVisited, countryRegions, onOpenPlaces, countries, selectedCountry, countryDetail, resolveName, onTripClick, onUnmarkCountry, bucketList, bucketTab, setBucketTab, showBucketAdd, setShowBucketAdd, bucketForm, setBucketForm, onAddBucket, onDeleteBucket, onClearBucketVisit, onSearchBucket, onSelectBucketPoi, bucketSearchResults, setBucketSearchResults, bucketPoiMonth, setBucketPoiMonth, bucketPoiYear, setBucketPoiYear, bucketSearching, bucketSearch, setBucketSearch, t, dark }: SidebarContentProps): React.ReactElement {
  const { language } = useTranslation()
  const statsContentRef = useRef<HTMLDivElement>(null)
  const bucketSearchRowRef = useRef<HTMLDivElement>(null)
  const [statsWidth, setStatsWidth] = useState<number | undefined>(undefined)
  useEffect(() => {
    const el = statsContentRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => setStatsWidth(el.offsetWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const bg = (o) => dark ? `rgba(255,255,255,${o})` : `rgba(0,0,0,${o})`
  const tp = dark ? '#f1f5f9' : '#0f172a'
  const tm = dark ? '#94a3b8' : '#64748b'
  const tf = dark ? '#475569' : '#94a3b8'
  const accent = '#818cf8'

  const { mostVisited, continents, lastTrip, nextTrip, streak, firstYear, tripsThisYear } = data || {}
  const contEntries = continents ? Object.entries(continents).sort((a, b) => b[1] - a[1]) : []
  const maxCont = contEntries.length > 0 ? contEntries[0][1] : 1
  const CL = { 'Europe': t('atlas.europe'), 'Asia': t('atlas.asia'), 'North America': t('atlas.northAmerica'), 'South America': t('atlas.southAmerica'), 'Africa': t('atlas.africa'), 'Oceania': t('atlas.oceania'), 'Antarctica': t('atlas.antarctica') }
  const contColors = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb923c', '#22d3ee']

  // Tab switcher
  const tabBar = (
    <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', marginBottom: 4 }}>
      {[{ id: 'stats', label: t('atlas.statsTab'), icon: Globe }, { id: 'bucket', label: t('atlas.bucketTab'), icon: Star }].map(tab => (
        <button type="button" key={tab.id} onClick={() => setBucketTab(tab.id as any)}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '7px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600, transition: 'all 0.15s',
            background: bucketTab === tab.id ? bg(0.1) : 'transparent',
            color: bucketTab === tab.id ? tp : tf,
          }}>
          <tab.icon size={13} />
          {tab.label}
        </button>
      ))}
    </div>
  )

  if (countries.length === 0 && !lastTrip && bucketTab !== 'bucket') {
    return (
      <>
        {tabBar}
        <EmptyState scene="atlas" title={t('atlas.noData')} layout="row" size={52} />
      </>
    )
  }

  const thisYear = new Date().getFullYear()
  const divider = `2px solid ${bg(0.08)}`

  // Bucket list content
  const bucketContent = (
    <>
    <div className="flex items-stretch" style={{ overflowX: 'auto', padding: '0 8px', maxWidth: statsWidth, width: '100%' }}>
      {bucketList.map(item => (
        <div key={item.id} className="group flex flex-col items-center justify-center shrink-0" style={{ padding: '8px 14px', position: 'relative', minWidth: 80 }}>
          {(() => {
            const code = item.country_code?.length === 2 ? item.country_code : (Object.entries(A2_TO_A3).find(([, v]) => v === item.country_code)?.[0] || '')
            return code ? (
              <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={code} style={{ width: 28, height: 20, borderRadius: 4, objectFit: 'cover', marginBottom: 4 }} />
            ) : <Star size={16} className="text-[#fbbf24]" style={{ marginBottom: 4 }} fill="#fbbf24" />
          })()}
          <span className="text-xs font-semibold text-center leading-tight" style={{ color: tp, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
          {item.target_date && (() => {
            const [y, m] = item.target_date.split('-')
            const label = m ? new Date(Number(y), Number(m) - 1).toLocaleString(language, { month: 'short', year: 'numeric' }) : y
            return <span className="text-[9px] mt-0.5 text-center" style={{ color: tf }}>{label}</span>
          })()}
          {!item.target_date && item.notes && <span className="text-[9px] mt-0.5 text-center" style={{ color: tf, maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.notes}</span>}
          {/* Reached (#2279). A tick rather than removing the entry: a wish that
              came true is the part of the list worth keeping, and the source is
              named so a recording-derived tick is not mistaken for a manual one. */}
          {item.visited_at && (
            <Tooltip
              label={item.visited_source === 'dawarich'
                ? `${t('dawarich.bucket.visitedFrom')} — ${t('dawarich.bucket.clearVisit')}`
                : ''}
              placement="top"
            >
              {/* A tick that came from a recording can be taken back here: the
                  wishlist is curated by hand, and a suggestion nobody can undo
                  is not a suggestion. A tick somebody set themselves is text. */}
              {item.visited_source === 'dawarich' ? (
                <button
                  type="button"
                  onClick={() => { void onClearBucketVisit(item.id) }}
                  aria-label={t('dawarich.bucket.clearVisit')}
                  className="text-success mt-0.5 flex items-center gap-1 hover:opacity-70"
                  style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Check size={9} />
                  {new Date(item.visited_at).toLocaleDateString(language)}
                </button>
              ) : (
                <span
                  className="text-success mt-0.5 flex items-center gap-1"
                  style={{ fontSize: 'calc(9px * var(--fs-scale-caption, 1))' }}
                >
                  <Check size={9} />
                  {new Date(item.visited_at).toLocaleDateString(language)}
                </span>
              )}
            </Tooltip>
          )}
          <button type="button" onClick={() => onDeleteBucket(item.id)}
            className="opacity-0 group-hover:opacity-100"
            style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: tf, display: 'flex', transition: 'opacity 0.15s' }}>
            <X size={10} />
          </button>
        </div>
      ))}
      {bucketList.length === 0 && !showBucketAdd && (
        <div className="flex items-center justify-center py-4 px-6" style={{ color: tf, fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>
          {t('atlas.bucketEmptyHint')}
        </div>
      )}
    </div>
    {showBucketAdd ? (
      <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Search or manual name */}
        <div>
          <div ref={bucketSearchRowRef} style={{ display: 'flex', gap: 4 }}>
            <input type="text" value={bucketForm.name || bucketSearch}
              onChange={e => { const v = e.target.value; if (bucketForm.name) setBucketForm({ ...bucketForm, name: v }); else setBucketSearch(v) }}
              onKeyDown={e => { if (e.key === 'Enter' && !bucketForm.name) void onSearchBucket(); else if (e.key === 'Enter') void onAddBucket(); if (e.key === 'Escape') setShowBucketAdd(false) }}
              placeholder={t('atlas.bucketNamePlaceholder')}
              autoFocus
              className="border border-edge text-content bg-surface-input"
              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {!bucketForm.name && (
              <button type="button" onClick={onSearchBucket} disabled={bucketSearching}
                className="bg-accent text-accent-text"
                style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Search size={12} />
              </button>
            )}
            {bucketForm.name && (
              <button type="button" onClick={() => { setBucketForm({ ...bucketForm, name: '', lat: '', lng: '' }); setBucketSearch('') }}
                className="border border-edge text-content-faint"
                style={{ padding: '6px 8px', borderRadius: 8, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={12} />
              </button>
            )}
          </div>
          {/* Portalled to the body: the panel that hosts this form clips its
              overflow, which used to swallow the top of the list (#1899). */}
          {bucketSearchResults.length > 0 && createPortal(
            <div className="bg-surface-card border border-edge" style={{
              position: 'fixed',
              ...(() => {
                const rect = bucketSearchRowRef.current?.getBoundingClientRect()
                if (!rect) return { left: 0, top: 0, width: 240, maxHeight: 160 }
                const above = rect.top - 12
                const below = window.innerHeight - rect.bottom - 12
                const openUp = above >= below
                return {
                  left: rect.left,
                  width: rect.width,
                  // Never taller than the room on that side, so the list scrolls
                  // instead of running off the edge of the viewport.
                  maxHeight: Math.min(160, openUp ? above : below),
                  ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
                }
              })(),
              zIndex: 99999, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', overflowY: 'auto',
            }}>
              {bucketSearchResults.slice(0, 6).map((r, i) => (
                <button type="button" key={i} onClick={() => onSelectBucketPoi(r)} className="border-b border-edge-faint" style={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', padding: '6px 10px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span className="text-content" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}>{r.name}</span>
                  {r.address && <span className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}>{r.address}</span>}
                </button>
              ))}
            </div>,
            document.body
          )}
        </div>
        {/* Selected place indicator */}
        {bucketForm.lat && bucketForm.lng && (
          <div className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} /> {Number(bucketForm.lat).toFixed(4)}, {Number(bucketForm.lng).toFixed(4)}
          </div>
        )}
        {/* Month / Year with CustomSelect */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ flex: 1 }}>
            <CustomSelect value={String(bucketPoiMonth)} onChange={v => setBucketPoiMonth(Number(v))} placeholder={t('atlas.month')} size="sm"
              options={[{ value: '0', label: '—' }, ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString(language, { month: 'short' }) }))]} />
          </div>
          <div style={{ flex: 1 }}>
            <CustomSelect value={String(bucketPoiYear)} onChange={v => setBucketPoiYear(Number(v))} placeholder={t('atlas.year')} size="sm"
              options={[{ value: '0', label: '—' }, ...Array.from({ length: 20 }, (_, i) => ({ value: String(new Date().getFullYear() + i), label: String(new Date().getFullYear() + i) }))]} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => { setShowBucketAdd(false); setBucketForm({ name: '', notes: '', lat: '', lng: '', target_date: '' }); setBucketSearch(''); setBucketSearchResults([]); setBucketPoiMonth(0); setBucketPoiYear(0) }}
            className="border border-edge text-content-muted"
            style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', padding: '4px 10px', borderRadius: 6, background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('common.cancel')}
          </button>
          <button type="button" onClick={onAddBucket} disabled={!bucketForm.name.trim()}
            className="bg-[#fbbf24] text-[#1a1a1a]"
            style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', padding: '4px 12px', borderRadius: 6, border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: bucketForm.name.trim() ? 1 : 0.5 }}>
            {t('common.add')}
          </button>
        </div>
      </div>
    ) : (
      <div style={{ padding: '4px 16px 8px' }}>
        <button type="button" onClick={() => setShowBucketAdd(true)}
          className="border border-dashed border-edge"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '5px 0', borderRadius: 8, background: 'none', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: tf, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={11} /> {t('atlas.addPoi')}
        </button>
      </div>
    )}
    </>
  )

  return (
    <>
    {tabBar}
    {/* Both tabs always rendered so the wider one sets the panel width */}
    <div style={{ display: 'grid' }}>
    <div style={bucketTab === 'bucket' ? { visibility: 'hidden' as const, gridArea: '1/1' } : { gridArea: '1/1' }}>
    <div ref={statsContentRef} className="flex items-stretch justify-center">

      {/* ═══ SECTION 1: Numbers ═══ */}
      {/* Countries hero */}
      <div className="flex flex-col justify-center px-5 py-4 mx-2 my-2 rounded-xl" style={{ background: bg(0.08) }}>
        <div className="flex items-baseline gap-1.5">
          <span className="text-5xl font-black tabular-nums leading-none" style={{ color: tp }}>{stats.totalCountries}</span>
          <span className="text-sm font-medium" style={{ color: tm }}>{t('atlas.countries')}</span>
        </div>
        {(stats.totalCountriesPlanned || 0) > 0 && (
          <span className="text-[9px] font-semibold mt-1.5 uppercase tracking-wide whitespace-nowrap" style={{ color: tf }}>
            +{stats.totalCountriesPlanned} {t('atlas.planned')}
          </span>
        )}
      </div>
      {/* Other stats */}
      {[[regionsVisited, t('atlas.regions')], [stats.totalTrips, t('atlas.trips')], [stats.totalPlaces, t('atlas.places')], [stats.totalCities || 0, t('atlas.cities')], [stats.totalDays, t('atlas.days')]].map(([v, l], i) => (
        <div key={i} className="flex flex-col items-center justify-center px-3 py-5 shrink-0">
          <span className="text-2xl font-black tabular-nums leading-none" style={{ color: tp }}>{v}</span>
          <span className="text-[9px] font-semibold mt-1.5 uppercase tracking-wide whitespace-nowrap" style={{ color: tf }}>{l}</span>
        </div>
      ))}

      {/* ═══ DIVIDER ═══ */}
      <div style={{ width: 2, background: bg(0.08), margin: '12px 14px' }} />

      {/* ═══ SECTION 2: Continents ═══ */}
      <div className="flex items-center gap-4 px-3 py-4 shrink-0">
        {/* Antarctica only joins the row once someone has actually been — CONTINENT_MAP has
            always known AQ, but a permanent zero column would be dead space for everyone else. */}
        {['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania', ...((continents?.['Antarctica'] || 0) > 0 ? ['Antarctica'] : [])].map((cont) => {
          const count = continents?.[cont] || 0
          const active = count > 0
          return (
            <div key={cont} className="flex flex-col items-center shrink-0">
              <span className="text-2xl font-black tabular-nums leading-none" style={{ color: active ? tp : bg(0.15) }}>{count}</span>
              <span className="text-[9px] font-semibold mt-1.5 uppercase tracking-wide whitespace-nowrap" style={{ color: active ? tf : bg(0.1) }}>{CL[cont]}</span>
            </div>
          )
        })}
      </div>

      {/* ═══ DIVIDER ═══ */}
      <div style={{ width: 2, background: bg(0.08), margin: '12px 14px' }} />

      {/* ═══ SECTION 3: Highlights & Streaks ═══ */}
      <div className="flex items-center gap-5 px-3 py-4">
        {/* Streak */}
        {streak > 0 && (
          <div className="flex flex-col items-center justify-center px-3">
            <span className="text-2xl font-black tabular-nums leading-none" style={{ color: tp }}>{streak}</span>
            <span className="text-[9px] font-semibold mt-1.5 uppercase tracking-wide text-center leading-tight whitespace-nowrap" style={{ color: tf }}>
              {streak === 1 ? t('atlas.yearInRow') : t('atlas.yearsInRow')}
            </span>
          </div>
        )}
        {/* This year */}
        {tripsThisYear > 0 && (
          <div className="flex flex-col items-center justify-center px-3">
            <span className="text-2xl font-black tabular-nums leading-none" style={{ color: tp }}>{tripsThisYear}</span>
            <span className="text-[9px] font-semibold mt-1.5 uppercase tracking-wide text-center leading-tight whitespace-nowrap" style={{ color: tf }}>
              {tripsThisYear === 1 ? t('atlas.tripIn') : t('atlas.tripsIn')} {thisYear}
            </span>
          </div>
        )}
      </div>

      {/* ═══ Country detail overlay ═══ */}
      {selectedCountry && countryDetail && (
        <>
          <div style={{ width: 2, background: bg(0.08), margin: '12px 0' }} />
          <div className="flex items-center gap-3 px-6 py-4">
            {/* Twemoji where the platform has no flag glyphs: Windows draws the emoji as two letters. */}
            {/^[A-Za-z]{2}$/.test(selectedCountry)
              ? <CountryFlag code={selectedCountry} size={30} />
              : <span className="text-3xl">{countryCodeToFlag(selectedCountry)}</span>}
            <div>
              <p className="text-sm font-bold" style={{ color: tp }}>
                {resolveName(selectedCountry)}
                {countryDetail.status && countryDetail.status !== 'visited' && (
                  <span className="ml-2 text-[9px] font-semibold uppercase tracking-wide" style={{ color: tf }}>{t('atlas.planned')}</span>
                )}
              </p>
              {/* Counts as quiet badges, the regions among them once any is visited (#1639). */}
              <div className="mb-1.5 flex flex-wrap gap-1">
                {countryDetail.places.length > 0 && (
                  <Tooltip label={t('atlas.placesShow')}>
                    <button type="button" onClick={onOpenPlaces}
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums transition-opacity hover:opacity-75"
                      style={{ background: bg(0.1), color: tp }}>
                      <MapPin size={9} />{countryDetail.places.length} {t('atlas.places')}
                    </button>
                  </Tooltip>
                )}
                {[
                  [countryDetail.trips.length, t('atlas.tripPlural')],
                  ...(countryRegions > 0 ? [[countryRegions, t('atlas.regions')] as const] : []),
                ].map(([n, label]) => (
                  <span key={label} className="whitespace-nowrap rounded-full px-1.5 py-px text-[10px] font-semibold tabular-nums" style={{ background: bg(0.06), color: tf }}>
                    {n} {label}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {countryDetail.trips.slice(0, 3).map(trip => (
                  <button type="button" key={trip.id} onClick={() => onTripClick(trip.id)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-opacity hover:opacity-75"
                    style={{ background: bg(0.08), color: tp }}>
                    <Briefcase size={9} style={{ color: tm }} />
                    {trip.title}
                  </button>
                ))}
                {countryDetail.manually_marked && onUnmarkCountry && (
                  <button type="button" onClick={() => onUnmarkCountry(selectedCountry!)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-opacity hover:opacity-75 bg-[rgba(239,68,68,0.1)] text-[#ef4444]">
                    <X size={9} />
                    {t('atlas.unmark')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </div>
    <div style={bucketTab === 'stats' ? { visibility: 'hidden' as const, gridArea: '1/1' } : { gridArea: '1/1' }}>
      {bucketContent}
    </div>
    </div>
    </>
  )
}
