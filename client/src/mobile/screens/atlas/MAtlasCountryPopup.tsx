import { ChevronRight, MapPin, Star, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import MSheet from '../../components/MSheet'
import type { AtlasController } from './atlasController'
import { useAtlasCountryActions } from '../../../pages/atlas/useAtlasCountryActions'

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
      className="flex w-full items-center gap-[13px] rounded-[18px] bg-[color:var(--m-ic)] px-4 py-[14px] text-start"
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
  const { t, confirmAction, setConfirmAction, executeConfirmAction } = atlas
  const { bucketDate, setBucketDate, onWishlist, markCountry, markRegion, unmarkRegion, addBucketForDate, removeBucket } =
    useAtlasCountryActions(atlas)

  const a = confirmAction

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
              <OptionRow icon={MapPin} tint={markTint} title={t('atlas.markVisited')} hint={t('atlas.markRegionVisitedHint')} onClick={() => markRegion(true)} />
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
              <label className="block text-start">
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
                <button type="button" onClick={addBucketForDate} className={actBtn}>
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
