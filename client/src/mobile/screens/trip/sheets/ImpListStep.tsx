import MChip from '../../../components/MChip'
import MToggle from '../../../components/MToggle'
import { FIELD_CLS, FormSheetFooter } from './PlSheetChrome'
import type { TripPlanner } from '../MTripShell'
import { useListImport } from '../../../../components/Planner/useListImport'

interface ImpListStepProps {
  planner: TripPlanner
  /** Back to the import menu. */
  onBack: () => void
  /** Close the whole sheet after a successful import. */
  onDone: () => void
}

/**
 * Shared-list import step (Google Maps / Naver URL) — the mobile counterpart
 * of the PlacesSidebar list import, on the same endpoints, undo and optional
 * Google enrichment.
 */
export default function ImpListStep({ planner, onBack, onDone }: ImpListStepProps) {
  const { t, toast, tripId, tripActions, pushUndo } = planner
  const { provider, setProvider, url, setUrl, enrich, setEnrich, loading, canEnrich, handleImport } = useListImport({
    tripId, t, toast, loadTrip: tripActions.loadTrip, pushUndo, onDone,
  })

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 pt-1">
        <div className="flex gap-[6px]">
          <MChip active={provider === 'google'} onClick={() => setProvider('google')}>
            {t('places.importGoogleList')}
          </MChip>
          <MChip active={provider === 'naver'} onClick={() => setProvider('naver')}>
            {t('places.importNaverList')}
          </MChip>
        </div>

        <div className="mt-3 font-geist text-[0.71875rem] leading-[1.45] text-m-muted">
          {t(provider === 'google' ? 'places.googleListHint' : 'places.naverListHint')}
          {provider === 'google' ? <div style={{ marginTop: 4 }}>{t('places.googleDirHint')}</div> : null}
        </div>

        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleImport()
            }
          }}
          placeholder={provider === 'google' ? 'https://maps.app.goo.gl/…' : 'https://naver.me/…'}
          className={`${FIELD_CLS} mt-3`}
        />

        {canEnrich && (
          <div className="mt-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[0.78125rem] font-semibold text-m-ink">{t('places.enrichOnImport')}</div>
              <div className="mt-[2px] font-geist text-[0.65625rem] leading-[1.4] text-m-faint">
                {t('places.enrichOnImportHint')}
              </div>
            </div>
            <MToggle checked={enrich} onChange={setEnrich} ariaLabel={t('places.enrichOnImport')} className="mt-[2px]" />
          </div>
        )}
      </div>

      <FormSheetFooter
        onCancel={onBack}
        cancelLabel={t('common.cancel')}
        onSubmit={handleImport}
        submitLabel={loading ? t('common.loading') : t('common.import')}
        submitDisabled={!url.trim() || loading}
      />
    </>
  )
}
