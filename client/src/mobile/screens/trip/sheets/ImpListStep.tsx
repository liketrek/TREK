import { useState } from 'react'
import { placesApi } from '../../../../api/client'
import { useAuthStore } from '../../../../store/authStore'
import MChip from '../../../components/MChip'
import MToggle from '../../../components/MToggle'
import { FIELD_CLS, FormSheetFooter } from './PlSheetChrome'
import type { TripPlanner } from '../MTripShell'

type ListProvider = 'google' | 'naver'

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
  const canEnrich = useAuthStore(s => s.hasMapsKey)

  const [provider, setProvider] = useState<ListProvider>('google')
  const [url, setUrl] = useState('')
  const [enrich, setEnrich] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleImport = async () => {
    const trimmed = url.trim()
    if (!trimmed || loading) return
    setLoading(true)
    try {
      const result =
        provider === 'google'
          ? await placesApi.importGoogleList(tripId, trimmed, enrich && canEnrich)
          : await placesApi.importNaverList(tripId, trimmed, enrich && canEnrich)
      await tripActions.loadTrip(tripId)
      if (result.count === 0 && result.skipped > 0) {
        toast.warning(t('places.importAllSkipped'))
      } else {
        toast.success(
          t(provider === 'google' ? 'places.googleListImported' : 'places.naverListImported', {
            count: result.count,
            list: result.listName,
          }),
        )
      }
      if (result.places?.length > 0) {
        const importedIds: number[] = result.places.map((p: { id: number }) => p.id)
        pushUndo(t(provider === 'google' ? 'undo.importGoogleList' : 'undo.importNaverList'), async () => {
          try {
            await placesApi.bulkDelete(tripId, importedIds)
          } catch {
            // best effort — the trip reload below reflects whatever happened
          }
          await tripActions.loadTrip(tripId)
        })
      }
      onDone()
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(message || t(provider === 'google' ? 'places.googleListError' : 'places.naverListError'))
    } finally {
      setLoading(false)
    }
  }

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
        </div>

        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleImport()
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
