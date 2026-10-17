import { Trash2 } from 'lucide-react'
import type { FileManagerState } from './useFileManager'
import { FileRow } from './FileManagerRow'

export function TrashView(S: FileManagerState) {
  const { trashFiles, loadingTrash, t } = S
  return (
    <div className="flex-1 overflow-y-auto px-7 pb-4 pt-4 max-md:px-4">
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
