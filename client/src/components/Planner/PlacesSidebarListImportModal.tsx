import ReactDOM from 'react-dom'
import ToggleSwitch from '../Settings/ToggleSwitch'
import type { SidebarState } from './usePlacesSidebar'

export function ListImportModal(S: SidebarState) {
  const {
    setListImportOpen, setListImportUrl, t, hasMultipleListImportProviders, availableListImportProviders,
    listImportProvider, setListImportProvider, listImportUrl, listImportLoading, handleListImport,
    listImportEnrich, setListImportEnrich, canEnrichImport,
  } = S
  return ReactDOM.createPortal(
    <div
      onClick={() => { setListImportOpen(false); setListImportUrl('') }}
      className="bg-[rgba(0,0,0,0.4)]"
      style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-surface-card"
        style={{ borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
      >
        <div className="text-content" style={{ fontSize: 'calc(15px * var(--fs-scale-subtitle, 1))', fontWeight: 700, marginBottom: 4 }}>
          {t('places.importList')}
        </div>
        {hasMultipleListImportProviders && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {availableListImportProviders.map(provider => (
              <button
                key={provider}
                onClick={() => setListImportProvider(provider)}
                className={listImportProvider === provider ? 'bg-accent text-accent-text' : 'bg-surface-tertiary text-content-muted'}
                style={{
                  padding: '6px 10px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 'calc(11px * var(--fs-scale-caption, 1))', fontWeight: 600, fontFamily: 'inherit',
                }}
              >
                {provider === 'google' ? t('places.importGoogleList') : t('places.importNaverList')}
              </button>
            ))}
          </div>
        )}
        <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginBottom: 16 }}>
          {t(listImportProvider === 'google' ? 'places.googleListHint' : 'places.naverListHint')}
        </div>
        <input
          type="text"
          value={listImportUrl}
          onChange={e => setListImportUrl(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !listImportLoading) handleListImport() }}
          placeholder={listImportProvider === 'google' ? 'https://maps.app.goo.gl/...' : 'https://naver.me/...'}
          autoFocus
          className="bg-surface-tertiary text-content"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10,
            border: '1px solid var(--border-primary)',
            fontSize: 'calc(13px * var(--fs-scale-body, 1))', outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        {canEnrichImport && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginTop: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-content" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 600 }}>{t('places.enrichOnImport')}</div>
              <div className="text-content-faint" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', marginTop: 2 }}>{t('places.enrichOnImportHint')}</div>
            </div>
            <ToggleSwitch on={listImportEnrich} onToggle={() => setListImportEnrich(!listImportEnrich)} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setListImportOpen(false); setListImportUrl('') }}
            className="text-content"
            style={{
              padding: '8px 16px', borderRadius: 10, border: '1px solid var(--border-primary)',
              background: 'none', fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleListImport}
            disabled={!listImportUrl.trim() || listImportLoading}
            className={!listImportUrl.trim() || listImportLoading ? 'bg-surface-tertiary text-content-faint' : 'bg-accent text-accent-text'}
            style={{
              padding: '8px 16px', borderRadius: 10, border: 'none',
              fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, cursor: !listImportUrl.trim() || listImportLoading ? 'default' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {listImportLoading ? t('common.loading') : t('common.import')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
