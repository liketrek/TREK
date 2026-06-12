import ReactDOM from 'react-dom'
import { Upload } from 'lucide-react'
import type { PackingState } from './usePackingListPanel'

export function BulkImportModal(S: PackingState) {
  const { setShowImportModal, t, importText, setImportText, csvInputRef, handleCsvFile, handleBulkImport, parseImportLines } = S
  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(3px)',
    }} onClick={() => setShowImportModal(false)}>
      <div style={{
        width: 420, maxHeight: '80vh', background: 'var(--bg-card)', borderRadius: 16,
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)', padding: '22px 22px 18px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{t('packing.importTitle')}</div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.5 }}>{t('packing.importHint')}</div>
        <div style={{ display: 'flex', border: '1px solid var(--border-primary)', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-input)' }}>
          <div style={{
            padding: '10px 0', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.5,
            color: 'var(--text-faint)', textAlign: 'right', userSelect: 'none',
            background: 'var(--bg-hover)', borderRight: '1px solid var(--border-faint)',
            minWidth: 32, flexShrink: 0,
          }}>
            {(importText || ' ').split('\n').map((_, i) => (
              <div key={i} style={{ padding: '0 6px' }}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={10}
            placeholder={t('packing.importPlaceholder')}
            style={{
              flex: 1, border: 'none', padding: '10px 12px', fontSize: 13, fontFamily: 'monospace',
              outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)',
              background: 'transparent', resize: 'vertical', lineHeight: 1.5,
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <input ref={csvInputRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleCsvFile} />
            <button onClick={() => csvInputRef.current?.click()} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              border: '1px dashed var(--border-primary)', borderRadius: 8, background: 'none',
              fontSize: 11, color: 'var(--text-faint)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <Upload size={11} /> {t('packing.importCsv')}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowImportModal(false)} style={{
              fontSize: 12, background: 'none', border: '1px solid var(--border-primary)',
              borderRadius: 8, padding: '6px 14px', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit',
            }}>{t('common.cancel')}</button>
            <button onClick={handleBulkImport} disabled={!importText.trim()} style={{
              fontSize: 12, background: 'var(--accent)', color: 'var(--accent-text)',
              border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 600,
              fontFamily: 'inherit', opacity: importText.trim() ? 1 : 0.5,
            }}>{t('packing.importAction', { count: parseImportLines(importText).length })}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
