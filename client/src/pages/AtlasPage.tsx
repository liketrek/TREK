import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../i18n'
import Navbar from '../components/Layout/Navbar'
import apiClient from '../api/client'
import CustomSelect from '../components/shared/CustomSelect'
import { Globe, MapPin, Briefcase, Calendar, Flag, PanelLeftOpen, PanelLeftClose, X, Star, Plus, Trash2, Search } from 'lucide-react'
import type { TranslationFn } from '../types'
import { A2_TO_A3, countryCodeToFlag, type AtlasCountry, type AtlasStats, type AtlasData, type CountryDetail } from './atlas/atlasModel'
import { continentForCountry } from '@trek/shared'
import { useAtlas } from './atlas/useAtlas'
import AtlasCountrySearch from './atlas/AtlasCountrySearch'
import { useToast } from '../components/shared/Toast'
import { getApiErrorMessage } from '../types'

function MobileStats({ data, stats, countries, resolveName, t, dark }: { data: AtlasData | null; stats: AtlasStats; countries: AtlasCountry[]; resolveName: (code: string) => string; t: TranslationFn; dark: boolean }): React.ReactElement {
  const tp = dark ? '#f1f5f9' : '#0f172a'
  const tf = dark ? '#475569' : '#94a3b8'
  const { continents, lastTrip, nextTrip, streak, firstYear, tripsThisYear } = data || {}
  const CL = { 'Europe': t('atlas.europe'), 'Asia': t('atlas.asia'), 'North America': t('atlas.northAmerica'), 'South America': t('atlas.southAmerica'), 'Africa': t('atlas.africa'), 'Oceania': t('atlas.oceania') }
  const thisYear = new Date().getFullYear()

  return (
    <div className="space-y-4">
      {/* Stats grid */}
      <div className="grid grid-cols-5 gap-2">
        {[[stats.totalCountries, t('atlas.countries')], [stats.totalTrips, t('atlas.trips')], [stats.totalPlaces, t('atlas.places')], [stats.totalCities || 0, t('atlas.cities')], [stats.totalDays, t('atlas.days')]].map(([v, l], i) => (
          <div key={i} className="text-center py-2">
            <p className="text-xl font-black tabular-nums" style={{ color: tp }}>{v}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: tf }}>{l}</p>
          </div>
        ))}
      </div>
      {/* Continents */}
      <div className="grid grid-cols-6 gap-1">
        {['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'].map(cont => {
          const count = continents?.[cont] || 0
          return (
            <div key={cont} className="text-center py-1">
              <p className="text-base font-bold tabular-nums" style={{ color: count > 0 ? tp : (dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)') }}>{count}</p>
              <p className="text-[8px] font-semibold uppercase" style={{ color: count > 0 ? tf : (dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)') }}>{CL[cont]}</p>
            </div>
          )
        })}
      </div>
      {/* Highlights */}
      <div className="flex gap-3">
        {streak > 0 && (
          <div className="text-center flex-1 py-2">
            <p className="text-xl font-black tabular-nums" style={{ color: tp }}>{streak}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: tf }}>{streak === 1 ? t('atlas.yearInRow') : t('atlas.yearsInRow')}</p>
          </div>
        )}
        {tripsThisYear > 0 && (
          <div className="text-center flex-1 py-2">
            <p className="text-xl font-black tabular-nums" style={{ color: tp }}>{tripsThisYear}</p>
            <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: tf }}>{tripsThisYear === 1 ? t('atlas.tripIn') : t('atlas.tripsIn')} {thisYear}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AtlasPage(): React.ReactElement {
  // Page = wiring container: the whole interactive globe (map lifecycle, atlas +
  // bucket data, mark/unmark flows, country search) lives in useAtlas. The page
  // only wires that state into JSX and its presentational SidebarContent helper.
  const {
    t, language, navigate, resolveName, dark, loading,
    mapRef, regionTooltipRef, panelRef, glareRef, borderGlareRef,
    handlePanelMouseMove, handlePanelMouseLeave,
    data, setData, stats, countries, selectedCountry, countryDetail,
    loadCountryDetail, handleUnmarkCountry, select_country_from_search,
    visitedRegions, setVisitedRegions,
    atlas_country_search, set_atlas_country_search,
    atlas_country_results, set_atlas_country_results,
    atlas_country_open, set_atlas_country_open, atlas_country_options,
    confirmAction, setConfirmAction, executeConfirmAction,
    bucketMonth, setBucketMonth, bucketYear, setBucketYear,
    bucketList, setBucketList, bucketTab, setBucketTab,
    showBucketAdd, setShowBucketAdd, bucketForm, setBucketForm,
    handleAddBucketItem, handleDeleteBucketItem, handleBucketPoiSearch, handleSelectBucketPoi,
    bucketSearchResults, setBucketSearchResults,
    bucketPoiMonth, setBucketPoiMonth, bucketPoiYear, setBucketPoiYear,
    bucketSearching, bucketSearch, setBucketSearch,
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
        />

        {/* Mobile: Bottom bar */}
        <div className="md:hidden absolute left-0 right-0 z-10 flex justify-center" style={{ bottom: 'calc(84px + env(safe-area-inset-bottom, 0px) + 8px)', touchAction: 'manipulation' }}>
          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{ background: dark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(16px)' }}>
            {/* Countries highlighted */}
            <div className="text-center px-3 py-1.5 rounded-xl" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }}>
              <p className="text-3xl font-black tabular-nums leading-none text-content">{stats.totalCountries}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide mt-1 text-content-faint">{t('atlas.countries')}</p>
            </div>
            {[[stats.totalTrips, t('atlas.trips')], [stats.totalPlaces, t('atlas.places')], [stats.totalCities || 0, t('atlas.cities')], [stats.totalDays, t('atlas.days')]].map(([v, l], i) => (
              <div key={i} className="text-center px-1">
                <p className="text-xl font-black tabular-nums leading-none text-content">{v}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide mt-1 text-content-faint">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop Panel — bottom center, glass effect */}
        <div
          ref={panelRef}
          onMouseMove={handlePanelMouseMove}
          onMouseLeave={handlePanelMouseLeave}
          className="hidden md:flex flex-col absolute z-10 overflow-hidden transition-[width,height,transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'fit-content',
            maxWidth: 'calc(100vw - 40px)',
            background: noTransparency ? (dark ? '#15151c' : '#ffffff') : (dark ? 'rgba(10,10,15,0.55)' : 'rgba(255,255,255,0.2)'),
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid ' + (dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
            borderRadius: 20,
            boxShadow: dark
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.08)',
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
            onCountryClick={loadCountryDetail} onTripClick={(id) => navigate(`/trips/${id}`)} onUnmarkCountry={handleUnmarkCountry}
            bucketList={bucketList} bucketTab={bucketTab} setBucketTab={setBucketTab}
            showBucketAdd={showBucketAdd} setShowBucketAdd={setShowBucketAdd}
            bucketForm={bucketForm} setBucketForm={setBucketForm}
            onAddBucket={handleAddBucketItem} onDeleteBucket={handleDeleteBucketItem}
            onSearchBucket={handleBucketPoiSearch} onSelectBucketPoi={handleSelectBucketPoi}
            bucketSearchResults={bucketSearchResults} setBucketSearchResults={setBucketSearchResults} bucketPoiMonth={bucketPoiMonth} setBucketPoiMonth={setBucketPoiMonth}
            bucketPoiYear={bucketPoiYear} setBucketPoiYear={setBucketPoiYear} bucketSearching={bucketSearching}
            bucketSearch={bucketSearch} setBucketSearch={setBucketSearch}
            t={t} dark={dark}
          />
        </div>

      </div>

      {/* Country action popup */}
      {confirmAction && (
        <div className="bg-[rgba(0,0,0,0.4)]" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setConfirmAction(null)}>
          <div className="bg-surface-card" style={{ borderRadius: 16, padding: 24, maxWidth: 340, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}>
            {confirmAction.code.length === 2 ? (
              <img src={`https://flagcdn.com/w80/${confirmAction.code.toLowerCase()}.png`} alt={confirmAction.code} style={{ width: 48, height: 34, borderRadius: 6, objectFit: 'cover', marginBottom: 12, display: 'inline-block' }} />
            ) : (
              <div style={{ fontSize: 'calc(36px * var(--fs-scale-title, 1))', marginBottom: 12 }}>{countryCodeToFlag(confirmAction.code)}</div>
            )}
            <h3 className="text-content" style={{ margin: '0 0 16px', fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))', fontWeight: 700 }}>{confirmAction.name}</h3>

            {confirmAction.type === 'choose' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={async () => {
                  try {
                    await apiClient.post(`/addons/atlas/country/${confirmAction.code}/mark`)
                    setData(prev => {
                      if (!prev || prev.countries.find(c => c.code === confirmAction.code)) return prev
                      const cont = continentForCountry(confirmAction.code)
                      return { ...prev, countries: [...prev.countries, { code: confirmAction.code, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }], stats: { ...prev.stats, totalCountries: prev.stats.totalCountries + 1 }, continents: { ...prev.continents, [cont]: (prev.continents?.[cont] || 0) + 1 } }
                    })
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, t('common.error')))
                  }
                  setConfirmAction(null)
                }}
                  className="border border-edge"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', borderRadius: 12, background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <MapPin size={18} className="text-content" style={{ flexShrink: 0 }} />
                  <div>
                    <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('atlas.markVisited')}</div>
                    <div className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 1 }}>{t('atlas.markVisitedHint')}</div>
                  </div>
                </button>
                <button onClick={() => setConfirmAction({ ...confirmAction, type: 'bucket' as any })}
                  className="border border-edge"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', borderRadius: 12, background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Star size={18} className="text-[#fbbf24]" style={{ flexShrink: 0 }} />
                  <div>
                    <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('atlas.addToBucket')}</div>
                    <div className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 1 }}>{t('atlas.addToBucketHint')}</div>
                  </div>
                </button>
              </div>
            )}

            {confirmAction.type === 'choose-region' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {confirmAction.countryName && (
                  <p className="text-content-muted" style={{ margin: '-8px 0 8px', fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{confirmAction.countryName}</p>
                )}
                <button onClick={async () => {
                  const { code: countryCode, name: rName, regionCode: rCode } = confirmAction
                  if (!rCode) return
                  try {
                    await apiClient.post(`/addons/atlas/region/${rCode}/mark`, { name: rName, country_code: countryCode })
                    setVisitedRegions(prev => {
                      const existing = prev[countryCode] || []
                      if (existing.find(r => r.code === rCode)) return prev
                      return { ...prev, [countryCode]: [...existing, { code: rCode, name: rName, placeCount: 0, manuallyMarked: true }] }
                    })
                    setData(prev => {
                      if (!prev || prev.countries.find(c => c.code === countryCode)) return prev
                      const cont = continentForCountry(countryCode)
                      return { ...prev, countries: [...prev.countries, { code: countryCode, placeCount: 0, tripCount: 0, firstVisit: null, lastVisit: null }], stats: { ...prev.stats, totalCountries: prev.stats.totalCountries + 1 }, continents: { ...prev.continents, [cont]: (prev.continents?.[cont] || 0) + 1 } }
                    })
                  } catch (err) {
                    toast.error(getApiErrorMessage(err, t('common.error')))
                  }
                  setConfirmAction(null)
                }}
                  className="border border-edge"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', borderRadius: 12, background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <MapPin size={18} className="text-content" style={{ flexShrink: 0 }} />
                  <div>
                    <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('atlas.markVisited')}</div>
                    <div className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 1 }}>{t('atlas.markRegionVisitedHint')}</div>
                  </div>
                </button>
                <button onClick={() => setConfirmAction({ ...confirmAction, type: 'bucket' })}
                  className="border border-edge"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 16px', borderRadius: 12, background: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.12s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <Star size={18} className="text-[#fbbf24]" style={{ flexShrink: 0 }} />
                  <div>
                    <div className="text-content" style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('atlas.addToBucket')}</div>
                    <div className="text-content-muted" style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: 1 }}>{t('atlas.addToBucketHint')}</div>
                  </div>
                </button>
              </div>
            )}

            {confirmAction.type === 'unmark' && (
              <>
                <p className="text-content-muted" style={{ margin: '0 0 20px', fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{t('atlas.confirmUnmark')}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => setConfirmAction(null)}
                    className="border border-edge text-content-muted"
                    style={{ padding: '8px 20px', borderRadius: 10, background: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('common.cancel')}
                  </button>
                  <button onClick={executeConfirmAction}
                    className="bg-[#ef4444] text-white"
                    style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('atlas.unmark')}
                  </button>
                </div>
              </>
            )}

            {confirmAction.type === 'unmark-region' && (
              <>
                {confirmAction.countryName && (
                  <p className="text-content-muted" style={{ margin: '-8px 0 8px', fontSize: 'calc(12px * var(--fs-scale-body, 1))' }}>{confirmAction.countryName}</p>
                )}
                <p className="text-content-muted" style={{ margin: '0 0 20px', fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{t('atlas.confirmUnmarkRegion')}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => setConfirmAction(null)}
                    className="border border-edge text-content-muted"
                    style={{ padding: '8px 20px', borderRadius: 10, background: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('common.cancel')}
                  </button>
                  <button onClick={async () => {
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
                      // If no visible regions remain at all (not just manually-marked ones —
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
                  }}
                    className="bg-[#ef4444] text-white"
                    style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('atlas.unmark')}
                  </button>
                </div>
              </>
            )}

            {confirmAction.type === 'bucket' && (
              <>
                <p className="text-content-muted" style={{ margin: '0 0 14px', fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{t('atlas.bucketWhen')}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <CustomSelect
                      value={String(bucketMonth)}
                      onChange={v => setBucketMonth(Number(v))}
                      placeholder={t('atlas.month')}
                      options={[
                        { value: '0', label: '—' },
                        ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(2000, i).toLocaleString(language, { month: 'long' }) })),
                      ]}
                      size="sm"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <CustomSelect
                      value={String(bucketYear)}
                      onChange={v => setBucketYear(Number(v))}
                      placeholder={t('atlas.year')}
                      options={[
                        { value: '0', label: '—' },
                        ...Array.from({ length: 20 }, (_, i) => ({ value: String(new Date().getFullYear() + i), label: String(new Date().getFullYear() + i) })),
                      ]}
                      size="sm"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => setConfirmAction({ ...confirmAction, type: confirmAction.regionCode ? 'choose-region' : 'choose' })}
                    className="border border-edge text-content-muted"
                    style={{ padding: '8px 20px', borderRadius: 10, background: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('common.back')}
                  </button>
                  <button onClick={async () => {
                    const targetDate = bucketMonth > 0 && bucketYear > 0 ? `${bucketYear}-${String(bucketMonth).padStart(2, '0')}` : null
                    try {
                      const r = await apiClient.post('/addons/atlas/bucket-list', { name: confirmAction.name, country_code: confirmAction.code, target_date: targetDate })
                      setBucketList(prev => [r.data.item, ...prev])
                    } catch (err) {
                      toast.error(getApiErrorMessage(err, t('common.error')))
                    }
                    setBucketMonth(0); setBucketYear(0)
                    setConfirmAction(null)
                  }}
                    className="bg-[#fbbf24] text-[#1a1a1a]"
                    style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('atlas.addToBucket')}
                  </button>
                </div>
              </>
            )}

            {confirmAction.type === 'mark' && (
              <>
                <p className="text-content-muted" style={{ margin: '0 0 20px', fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>{t('atlas.confirmMark')}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <button onClick={() => setConfirmAction(null)}
                    className="border border-edge text-content-muted"
                    style={{ padding: '8px 20px', borderRadius: 10, background: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('common.cancel')}
                  </button>
                  <button onClick={executeConfirmAction}
                    className="bg-content text-white"
                    style={{ padding: '8px 20px', borderRadius: 10, border: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('atlas.markVisited')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface SidebarContentProps {
  data: AtlasData | null
  stats: AtlasStats
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

function SidebarContent({ data, stats, countries, selectedCountry, countryDetail, resolveName, onTripClick, onUnmarkCountry, bucketList, bucketTab, setBucketTab, showBucketAdd, setShowBucketAdd, bucketForm, setBucketForm, onAddBucket, onDeleteBucket, onSearchBucket, onSelectBucketPoi, bucketSearchResults, setBucketSearchResults, bucketPoiMonth, setBucketPoiMonth, bucketPoiYear, setBucketPoiYear, bucketSearching, bucketSearch, setBucketSearch, t, dark }: SidebarContentProps): React.ReactElement {
  const { language } = useTranslation()
  const statsContentRef = useRef<HTMLDivElement>(null)
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
  const CL = { 'Europe': t('atlas.europe'), 'Asia': t('atlas.asia'), 'North America': t('atlas.northAmerica'), 'South America': t('atlas.southAmerica'), 'Africa': t('atlas.africa'), 'Oceania': t('atlas.oceania') }
  const contColors = ['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#fb923c', '#22d3ee']

  // Tab switcher
  const tabBar = (
    <div style={{ display: 'flex', gap: 4, padding: '12px 16px 0', marginBottom: 4 }}>
      {[{ id: 'stats', label: t('atlas.statsTab'), icon: Globe }, { id: 'bucket', label: t('atlas.bucketTab'), icon: Star }].map(tab => (
        <button key={tab.id} onClick={() => setBucketTab(tab.id as any)}
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
        <div className="p-8 text-center">
          <Globe size={28} className="mx-auto mb-2" style={{ color: tf, opacity: 0.4 }} />
          <p className="text-sm font-medium" style={{ color: tm }}>{t('atlas.noData')}</p>
          <p className="text-xs mt-1" style={{ color: tf }}>{t('atlas.noDataHint')}</p>
        </div>
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
          <button onClick={() => onDeleteBucket(item.id)}
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
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <input type="text" value={bucketForm.name || bucketSearch}
              onChange={e => { const v = e.target.value; if (bucketForm.name) setBucketForm({ ...bucketForm, name: v }); else setBucketSearch(v) }}
              onKeyDown={e => { if (e.key === 'Enter' && !bucketForm.name) onSearchBucket(); else if (e.key === 'Enter') onAddBucket(); if (e.key === 'Escape') setShowBucketAdd(false) }}
              placeholder={t('atlas.bucketNamePlaceholder')}
              autoFocus
              className="border border-edge text-content bg-surface-input"
              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
            />
            {!bucketForm.name && (
              <button onClick={onSearchBucket} disabled={bucketSearching}
                className="bg-accent text-accent-text"
                style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Search size={12} />
              </button>
            )}
            {bucketForm.name && (
              <button onClick={() => { setBucketForm({ ...bucketForm, name: '', lat: '', lng: '' }); setBucketSearch('') }}
                className="border border-edge text-content-faint"
                style={{ padding: '6px 8px', borderRadius: 8, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={12} />
              </button>
            )}
          </div>
          {bucketSearchResults.length > 0 && (
            <div className="bg-surface-card border border-edge" style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 50, marginBottom: 4, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', maxHeight: 160, overflowY: 'auto' }}>
              {bucketSearchResults.slice(0, 6).map((r, i) => (
                <button key={i} onClick={() => onSelectBucketPoi(r)} className="border-b border-edge-faint" style={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', padding: '6px 10px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                  <span className="text-content" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500 }}>{r.name}</span>
                  {r.address && <span className="text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}>{r.address}</span>}
                </button>
              ))}
            </div>
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
          <button onClick={() => { setShowBucketAdd(false); setBucketForm({ name: '', notes: '', lat: '', lng: '', target_date: '' }); setBucketSearch(''); setBucketSearchResults([]); setBucketPoiMonth(0); setBucketPoiYear(0) }}
            className="border border-edge text-content-muted"
            style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', padding: '4px 10px', borderRadius: 6, background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('common.cancel')}
          </button>
          <button onClick={onAddBucket} disabled={!bucketForm.name.trim()}
            className="bg-[#fbbf24] text-[#1a1a1a]"
            style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', padding: '4px 12px', borderRadius: 6, border: 'none', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: bucketForm.name.trim() ? 1 : 0.5 }}>
            {t('common.add')}
          </button>
        </div>
      </div>
    ) : (
      <div style={{ padding: '4px 16px 8px' }}>
        <button onClick={() => setShowBucketAdd(true)}
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
      <div className="flex items-baseline gap-1.5 px-5 py-4 mx-2 my-2 rounded-xl" style={{ background: bg(0.08) }}>
        <span className="text-5xl font-black tabular-nums leading-none" style={{ color: tp }}>{stats.totalCountries}</span>
        <span className="text-sm font-medium" style={{ color: tm }}>{t('atlas.countries')}</span>
      </div>
      {/* Other stats */}
      {[[stats.totalTrips, t('atlas.trips')], [stats.totalPlaces, t('atlas.places')], [stats.totalCities || 0, t('atlas.cities')], [stats.totalDays, t('atlas.days')]].map(([v, l], i) => (
        <div key={i} className="flex flex-col items-center justify-center px-3 py-5 shrink-0">
          <span className="text-2xl font-black tabular-nums leading-none" style={{ color: tp }}>{v}</span>
          <span className="text-[9px] font-semibold mt-1.5 uppercase tracking-wide whitespace-nowrap" style={{ color: tf }}>{l}</span>
        </div>
      ))}

      {/* ═══ DIVIDER ═══ */}
      <div style={{ width: 2, background: bg(0.08), margin: '12px 14px' }} />

      {/* ═══ SECTION 2: Continents ═══ */}
      <div className="flex items-center gap-4 px-3 py-4 shrink-0">
        {['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'].map((cont) => {
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
        {/* Last trip */}
        {lastTrip && (
          <button onClick={() => onTripClick(lastTrip.id)} className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-75">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: bg(0.06) }}>
              {lastTrip.countryCode ? countryCodeToFlag(lastTrip.countryCode) : <MapPin size={16} style={{ color: tm }} />}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: tf }}>{t('atlas.lastTrip')}</p>
              <p className="text-[13px] font-bold truncate" style={{ color: tp }}>{lastTrip.title}</p>
            </div>
          </button>
        )}
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
            <span className="text-3xl">{countryCodeToFlag(selectedCountry)}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: tp }}>{resolveName(selectedCountry)}</p>
              <p className="text-[10px] mb-1" style={{ color: tf }}>{countryDetail.places.length} {t('atlas.places')} · {countryDetail.trips.length} Trips</p>
              <div className="flex flex-wrap gap-1">
                {countryDetail.trips.slice(0, 3).map(trip => (
                  <button key={trip.id} onClick={() => onTripClick(trip.id)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-opacity hover:opacity-75"
                    style={{ background: bg(0.08), color: tp }}>
                    <Briefcase size={9} style={{ color: tm }} />
                    {trip.title}
                  </button>
                ))}
                {countryDetail.manually_marked && onUnmarkCountry && (
                  <button onClick={() => onUnmarkCountry(selectedCountry!)}
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
