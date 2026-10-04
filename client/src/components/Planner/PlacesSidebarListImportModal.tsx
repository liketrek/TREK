import { useId } from 'react'
import { ListPlus, Loader2 } from 'lucide-react'
import ToggleSwitch from '../Settings/ToggleSwitch'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, INPUT, Segmented } from '../shared/dialogParts'
import type { SidebarState } from './usePlacesSidebar'

type ListProvider = SidebarState['listImportProvider']

export function ListImportModal(S: SidebarState) {
  const {
    setListImportOpen, setListImportUrl, t, hasMultipleListImportProviders, availableListImportProviders,
    listImportProvider, setListImportProvider, listImportUrl, listImportLoading, handleListImport,
    listImportEnrich, setListImportEnrich, canEnrichImport,
  } = S
  const titleId = useId()
  const urlId = useId()
  const enrichHintId = useId()
  const close = () => { setListImportOpen(false); setListImportUrl('') }
  const google = listImportProvider === 'google'
  const cannotImport = !listImportUrl.trim() || listImportLoading
  const providerLabel = (provider: ListProvider) => provider === 'google' ? t('places.importGoogleList') : t('places.importNaverList')

  return (
    <DialogShell
      onClose={close}
      labelledBy={titleId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><ListPlus size={20} strokeWidth={1.9} className="text-content" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={titleId}
          onClose={close}
          title={t('places.importList')}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={close}>{t('common.cancel')}</DialogButton>
          <DialogButton
            variant="primary"
            onClick={handleListImport}
            disabled={cannotImport}
            icon={listImportLoading ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {listImportLoading ? t('common.loading') : t('common.import')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      {hasMultipleListImportProviders && (
        <EditorField label={t('settings.aiParsing.provider')}>
          <Segmented<ListProvider>
            fill
            label={t('settings.aiParsing.provider')}
            value={listImportProvider}
            onChange={setListImportProvider}
            options={availableListImportProviders.map(provider => ({ value: provider, label: providerLabel(provider) }))}
          />
        </EditorField>
      )}

      <EditorField
        label={t('reservations.urlLabel')}
        htmlFor={urlId}
        hint={(
          <>
            {t(google ? 'places.googleListHint' : 'places.naverListHint')}
            {/* Same box, same Share button: which screen the link came from is the URL's
                business, and until it said so nobody knew a route could be pasted here. */}
            {google && <span className="mt-1 block">{t('places.googleDirHint')}</span>}
          </>
        )}
      >
        <input
          id={urlId}
          type="text"
          value={listImportUrl}
          onChange={e => setListImportUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !listImportLoading) void handleListImport() }}
          placeholder={google ? 'https://maps.app.goo.gl/...' : 'https://naver.me/...'}
          autoFocus
          className={INPUT}
        />
      </EditorField>

      {canEnrichImport && (
        <div className="flex items-start gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary p-3">
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-content" style={fs(12.5, 'body')}>{t('places.enrichOnImport')}</div>
            <div id={enrichHintId} className="mt-0.5 text-content-faint" style={fs(12, 'body')}>{t('places.enrichOnImportHint')}</div>
          </div>
          <ToggleSwitch
            on={listImportEnrich}
            onToggle={() => setListImportEnrich(!listImportEnrich)}
            label={t('places.enrichOnImport')}
            describedBy={enrichHintId}
          />
        </div>
      )}
    </DialogShell>
  )
}
