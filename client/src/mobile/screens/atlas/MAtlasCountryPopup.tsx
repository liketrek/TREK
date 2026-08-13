import { useEffect, useState } from 'react'
import { ChevronRight, MapPin, Star, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import apiClient from '../../../api/client'
import { continentForCountry } from '@trek/shared'
import { findBucketDuplicate, isBucketDuplicateError, withCountryMarkedVisited } from '../../../pages/atlas/atlasModel'
import { getApiErrorMessage } from '../../../types'
import { useToast } from '../../../components/shared/Toast'
import MSheet from '../../components/MSheet'
import type { AtlasController } from './atlasController'

const markTint = 'bg-[rgba(47,163,122,.16)] text-[color:var(--m-st-confirmed)]' // theme-lint-disable — fixed tint from the design's option rows
const bucketTint = 'bg-[rgba(232,161,58,.16)] text-[color:var(--m-st-pending)]' // theme-lint-disable — fixed tint from the design's option rows
const removeTint = 'bg-[color:color-mix(in_srgb,var(--m-st-danger)_16%,transparent)] text-[color:var(--m-st-danger)]'

const btnBase = 'flex-1 rounded-full py-[11px] text-[0.8125rem] font-bold'
const cancelBtn = `${btnBase} bg-[color:var(--m-ic)] text-m-ink`
const dangerBtn = `${btnBase} bg-[color:var(--m-st-danger)] text-white`
const actBtn = `${btnBase} bg-m-act text-m-actfg`

const inputCls =
  'mt-2 w-full rounded-[14px] border border-[color:var(--m-inbr)] bg-[color:var(--m-inner)] px-[14px] py-[11px] text-[0.84375rem] font-medium text-m-ink outline-none'

interface OptionRowProps {
  icon: LucideIcon
  tint: string
  title: string
  hint: string
  onClick: () => void
}

function OptionRow({ icon: Icon, tint, title, hint, onClick }: OptionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-[13px] rounded-[18px] bg-[color:var(--m-ic)] px-4 py-[14px] text-left"
    >
      <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${tint}`}>
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-extrabold text-m-ink">{title}</span>
        <span className="mt-[1px] block font-geist text-[0.6875rem] text-m-muted">{hint}</span>
      </span>
      <ChevronRight size={17} strokeWidth={2} className="flex-none text-m-faint" />
    </button>
  )
}

interface MAtlasCountryPopupProps {
  atlas: AtlasController
}

/**
 * Country/region tap popup: mark visited, add to bucket list (with target
 * month) or remove again. Same flows and API calls as the desktop popup,
 * rendered as the mobile card sheet.
 */
export default function MAtlasCountryPopup({ atlas }: MAtlasCountryPopupProps) {
  const {
    t,
    confirmAction,
    setConfirmAction,
    executeConfirmAction,
    setData,
    setVisitedRegions,
    setBucketList,
    visitedRegions,
    bucketList,
    handleDeleteBucketItem,
  } = atlas
  const toast = useToast()
  const [bucketDate, setBucketDate] = useState('')

  useEffect(() => {
    if (!confirmAction) setBucketDate('')
  }, [confirmAction])

  const markCountry = async (): Promise<void> => {
    if (!confirmAction) return
    const { code } = confirmAction
    try {
      await apiClient.post(`/addons/atlas/country/${code}/mark`)
      setData((prev) => (prev ? withCountryMarkedVisited(prev, code) : prev))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
    setConfirmAction(null)
  }

  const markRegion = async (): Promise<void> => {
    if (!confirmAction) return
    const { code: countryCode, name: regionName, regionCode } = confirmAction
    if (!regionCode) return
    try {
      await apiClient.post(`/addons/atlas/region/${regionCode}/mark`, { name: regionName, country_code: countryCode })
      setVisitedRegions((prev) => {
        const existing = prev[countryCode] || []
        if (existing.find((r) => r.code === regionCode)) return prev
        return { ...prev, [countryCode]: [...existing, { code: regionCode, name: regionName, placeCount: 0, status: 'visited' as const, manuallyMarked: true }] }
      })
      setData((prev) => (prev ? withCountryMarkedVisited(prev, countryCode) : prev))
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
    setConfirmAction(null)
  }

  const unmarkRegion = async (): Promise<void> => {
    if (!confirmAction) return
    const { code: countryCode, regionCode } = confirmAction
    if (!regionCode) return
    try {
      await apiClient.delete(`/addons/atlas/region/${regionCode}/mark`)
      setVisitedRegions((prev) => {
        const remaining = (prev[countryCode] || []).filter((r) => r.code !== regionCode)
        const next = { ...prev, [countryCode]: remaining }
        if (remaining.length === 0) delete next[countryCode]
        return next
      })
      // Drop the country too once no visible region is left — how a region was
      // derived does not matter, the server hides it either way. Countries with
      // real place/trip data are never hidden server-side (#1490), so removing
      // them here would only flash and reappear on the next load.
      setData((prev) => {
        if (!prev) return prev
        const c = prev.countries.find((c) => c.code === countryCode)
        if (!c || c.placeCount > 0 || c.tripCount > 0) return prev
        const remainingRegions = (visitedRegions[countryCode] || []).filter((r) => r.code !== regionCode)
        if (remainingRegions.length > 0) return prev
        const cont = continentForCountry(countryCode)
        return {
          ...prev,
          countries: prev.countries.filter((c) => c.code !== countryCode),
          stats: { ...prev.stats, totalCountries: Math.max(0, prev.stats.totalCountries - 1) },
          continents: { ...prev.continents, [cont]: Math.max(0, (prev.continents?.[cont] || 0) - 1) },
        }
      })
    } catch (err) {
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
    setConfirmAction(null)
  }

  const addBucket = async (): Promise<void> => {
    if (!confirmAction) return
    const targetDate = bucketDate || null
    // #1898: one entry per target date. The sheet stays open on a duplicate so
    // another month can be picked right away.
    if (findBucketDuplicate(bucketList, { name: confirmAction.name, country_code: confirmAction.code, target_date: targetDate, lat: null, lng: null })) {
      toast.error(t('atlas.bucketDuplicate'))
      return
    }
    try {
      const r = await apiClient.post('/addons/atlas/bucket-list', {
        name: confirmAction.name,
        country_code: confirmAction.code,
        target_date: targetDate,
      })
      setBucketList((prev) => [r.data.item, ...prev])
    } catch (err) {
      if (isBucketDuplicateError(err)) {
        toast.error(t('atlas.bucketDuplicate'))
        return
      }
      toast.error(getApiErrorMessage(err, t('common.error')))
    }
    setConfirmAction(null)
  }

  // A country can sit on the bucket list more than once (one entry per place and
  // target date), so taking it off the wishlist means dropping every entry for
  // that code.
  const removeBucket = async (): Promise<void> => {
    if (!confirmAction) return
    const wishlistItems = bucketList.filter((b) => b.country_code === confirmAction.code)
    await Promise.all(wishlistItems.map((item) => handleDeleteBucketItem(item.id)))
    setConfirmAction(null)
  }

  const a = confirmAction
  const onWishlist = !!a && bucketList.some((b) => b.country_code === a.code)

  return (
    <MSheet open={!!a} onClose={() => setConfirmAction(null)} variant="card" ariaLabel={a?.name}>
      {a && (
        <div className="flex flex-col gap-2 p-5">
          <div className="flex flex-col items-center pb-2 text-center">
            {a.code.length === 2 ? (
              <img
                src={`https://flagcdn.com/w80/${a.code.toLowerCase()}.png`}
                alt=""
                className="h-[34px] w-12 rounded-[6px] object-cover shadow-[0_1px_3px_rgba(0,0,0,.25)]"
              />
            ) : (
              // flagcdn only serves alpha-2, so anything else gets a neutral placeholder.
              <span className="flex h-[34px] w-12 items-center justify-center rounded-[6px] bg-[color:var(--m-ic)] text-m-faint">
                <MapPin size={18} strokeWidth={2} />
              </span>
            )}
            <div className="mt-3 text-[1.0625rem] font-extrabold text-m-ink">{a.name}</div>
            {a.countryName && (a.type === 'choose-region' || a.type === 'unmark-region') && (
              <div className="mt-[2px] font-geist text-[0.6875rem] text-m-muted">{a.countryName}</div>
            )}
          </div>

          {a.type === 'choose' && (
            <>
              <OptionRow icon={MapPin} tint={markTint} title={t('atlas.markVisited')} hint={t('atlas.markVisitedHint')} onClick={markCountry} />
              <OptionRow
                icon={Star}
                tint={bucketTint}
                title={t('atlas.addToBucket')}
                hint={t('atlas.addToBucketHint')}
                onClick={() => setConfirmAction({ ...a, type: 'bucket' })}
              />
              {onWishlist && (
                <OptionRow
                  icon={Trash2}
                  tint={removeTint}
                  title={t('atlas.removeFromBucket')}
                  hint={t('atlas.removeFromBucketHint')}
                  onClick={removeBucket}
                />
              )}
            </>
          )}

          {a.type === 'choose-region' && (
            <>
              <OptionRow icon={MapPin} tint={markTint} title={t('atlas.markVisited')} hint={t('atlas.markRegionVisitedHint')} onClick={markRegion} />
              <OptionRow
                icon={Star}
                tint={bucketTint}
                title={t('atlas.addToBucket')}
                hint={t('atlas.addToBucketHint')}
                onClick={() => setConfirmAction({ ...a, type: 'bucket' })}
              />
            </>
          )}

          {a.type === 'mark' && (
            <>
              <p className="pb-2 text-center text-[0.8125rem] text-m-muted">{t('atlas.confirmMark')}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmAction(null)} className={cancelBtn}>
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={executeConfirmAction} className={actBtn}>
                  {t('atlas.markVisited')}
                </button>
              </div>
            </>
          )}

          {a.type === 'unmark' && (
            <>
              <p className="pb-2 text-center text-[0.8125rem] text-m-muted">{t('atlas.confirmUnmark')}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmAction(null)} className={cancelBtn}>
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={executeConfirmAction} className={dangerBtn}>
                  {t('atlas.unmark')}
                </button>
              </div>
            </>
          )}

          {a.type === 'unmark-region' && (
            <>
              <p className="pb-2 text-center text-[0.8125rem] text-m-muted">{t('atlas.confirmUnmarkRegion')}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmAction(null)} className={cancelBtn}>
                  {t('common.cancel')}
                </button>
                <button type="button" onClick={unmarkRegion} className={dangerBtn}>
                  {t('atlas.unmark')}
                </button>
              </div>
            </>
          )}

          {a.type === 'bucket' && (
            <>
              <label className="block text-left">
                <span className="font-geist text-[0.6875rem] font-bold text-m-muted">{t('atlas.bucketWhen')}</span>
                <input type="month" value={bucketDate} onChange={(e) => setBucketDate(e.target.value)} className={inputCls} />
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction({ ...a, type: a.regionCode ? 'choose-region' : 'choose' })}
                  className={cancelBtn}
                >
                  {t('common.back')}
                </button>
                <button type="button" onClick={addBucket} className={actBtn}>
                  {t('atlas.addToBucket')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </MSheet>
  )
}
