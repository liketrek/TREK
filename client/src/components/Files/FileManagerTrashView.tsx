import { Trash2 } from 'lucide-react'
import type { FileManagerState } from './useFileManager'
import { FileRow } from './FileManagerRow'

export function TrashView(S: FileManagerState) {
  const { trashFiles, can, trip, handleEmptyTrash, loadingTrash, t } = S
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 16px' }}>
      {trashFiles.length > 0 && can('file_delete', trip) && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button onClick={handleEmptyTrash} style={{
            padding: '5px 12px', borderRadius: 8, border: '1px solid #fecaca',
            background: '#fef2f2', color: '#dc2626', fontSize: 'calc(12px * var(--fs-scale-body, 1))', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {t('files.emptyTrash') || 'Empty Trash'}
          </button>
        </div>
      )}
      {loadingTrash ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-faint)' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--text-faint)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        </div>
      ) : trashFiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-faint)' }}>
          <Trash2 size={40} style={{ color: 'var(--text-faint)', display: 'block', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{t('files.trashEmpty') || 'Trash is empty'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trashFiles.map(file => <FileRow key={file.id} {...S} file={file} isTrash />)}
        </div>
      )}
    </div>
  )
}
