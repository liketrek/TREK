import React from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { type Poi, POI_CATEGORY_BY_KEY } from '../Map/poiCategories'
import PlaceDetailsCard, { usePoiDetails } from './PlaceDetailsCard'

interface PoiDetailPanelProps {
  poi: Poi
  onAddToTrip: (poi: Poi, googlePlaceId: string | null) => void
  onClose: () => void
  leftWidth?: number
  rightWidth?: number
  mobile?: boolean
}

export default function PoiDetailPanel({
  poi,
  onAddToTrip,
  onClose,
  leftWidth = 0,
  rightWidth = 0,
  mobile = false,
}: PoiDetailPanelProps) {
  const { t, language } = useTranslation()
  const { details, photo, loading } = usePoiDetails(poi, language)

  const categoryInfo = POI_CATEGORY_BY_KEY[poi.category]

  const inner = (
    <div className="bg-surface-elevated" style={{
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      borderRadius: 20,
      boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      maxHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-system)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', flexShrink: 0 }}>
        {categoryInfo && (
          <span style={{
            width: 10, height: 10, borderRadius: '50%',
            background: categoryInfo.color,
            flexShrink: 0, marginTop: 4,
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-content" style={{ fontWeight: 600, fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', lineHeight: 1.3 }}>
            {poi.name}
          </div>
          {poi.address && (
            <div className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 2 }}>
              {poi.address}
            </div>
          )}
        </div>
        <button
          aria-label={t('common.close')}
          onClick={onClose}
          className="bg-surface-hover"
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <X size={14} strokeWidth={2} color="var(--text-secondary)" />
        </button>
      </div>

      {/* Body — scrollable */}
      <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <PlaceDetailsCard name={poi.name} details={details} photo={photo} loading={loading} />
      </div>

      {/* Footer */}
      <div className="border-t border-edge-faint" style={{ padding: '10px 16px', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={() => onAddToTrip(poi, (details?.google_place_id as string) ?? null)}
          className="bg-primary text-white"
          style={{ borderRadius: 8, border: 'none', padding: '7px 14px', fontWeight: 600, fontSize: 'calc(13px * var(--fs-scale-body, 1))', cursor: 'pointer' }}
        >
          {t('poi.details.addToTrip')}
        </button>
      </div>
    </div>
  )

  if (mobile) {
    return inner
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: `calc(${leftWidth}px + (100% - ${leftWidth}px - ${rightWidth}px) / 2)`,
      transform: 'translateX(-50%)',
      width: `min(800px, calc(100% - ${leftWidth}px - ${rightWidth}px - 32px))`,
      zIndex: 50,
      fontFamily: 'var(--font-system)',
    }}>
      {inner}
    </div>
  )
}
