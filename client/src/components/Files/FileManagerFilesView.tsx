import { Fragment } from 'react'
import { Upload, Star } from 'lucide-react'
import type { FileManagerState } from './useFileManager'
import { FileRow } from './FileManagerRow'
import { usePluginViewContributions, PluginCardFooter } from '../Plugins/PluginContributions'
import EmptyState from '../shared/EmptyState'

export function FilesView(S: FileManagerState) {
  const {
    can, trip, getRootProps, getInputProps, isDragActive, uploading, t, allowedFileTypes,
    files, filterType, setFilterType, filteredFiles,
  } = S
  const contribFor = usePluginViewContributions('files', S.tripId)
  return (
    <>
      {/* Upload zone */}
      {can('file_upload', trip) && <div
        {...getRootProps()}
        className={`mx-7 mt-4 cursor-pointer rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors max-md:mx-4 ${isDragActive ? 'border-content-muted bg-surface-tertiary' : 'border-edge bg-surface-secondary hover:border-content-faint'}`}
      >
        <input {...getInputProps()} />
        <Upload size={24} style={{ margin: '0 auto 8px', color: isDragActive ? 'var(--text-secondary)' : 'var(--text-faint)', display: 'block' }} />
        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-secondary)' }}>
            <div style={{ width: 14, height: 14, border: '2px solid var(--text-secondary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            {t('files.uploading')}
          </div>
        ) : (
          <>
            <p style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>{t('files.dropzone')}</p>
            <p style={{ fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginTop: 3 }}>{t('files.dropzoneHint')}</p>
            <p style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginTop: 6, opacity: 0.7 }}>
              {(allowedFileTypes || 'jpg,jpeg,png,gif,webp,heic,pdf,doc,docx,xls,xlsx,txt,csv').toUpperCase().split(',').join(', ')}
            </p>
            <span className="mt-1.5 inline-block rounded-full bg-surface-card px-2 py-[2px] font-geist font-semibold text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}>Max 50 MB</span>
          </>
        )}
      </div>}

      {/* Filter tabs */}
      <div className="md:!hidden" style={{ display: 'flex', gap: 4, padding: '12px 16px 0', flexShrink: 0, flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: t('files.filterAll') },
          ...(files.some(f => f.starred) ? [{ id: 'starred', icon: Star }] : []),
          { id: 'pdf', label: t('files.filterPdf') },
          { id: 'image', label: t('files.filterImages') },
          { id: 'doc', label: t('files.filterDocs') },
          ...(files.some(f => f.note_id) ? [{ id: 'collab', label: t('files.filterCollab') || 'Collab' }] : []),
        ].map(tab => (
          <button type="button" key={tab.id} onClick={() => setFilterType(tab.id)} style={{
            padding: '4px 12px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 'calc(12px * var(--fs-scale-body, 1))',
            fontFamily: 'inherit', transition: 'all 0.12s',
            background: filterType === tab.id ? 'var(--accent)' : 'transparent',
            color: filterType === tab.id ? 'var(--accent-text)' : 'var(--text-muted)',
            fontWeight: filterType === tab.id ? 600 : 400,
          }}>{tab.icon ? <tab.icon size={13} fill={filterType === tab.id ? '#facc15' : 'none'} color={filterType === tab.id ? '#facc15' : 'currentColor'} /> : tab.label}</button>
        ))}
        <span style={{ marginInlineStart: 'auto', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', alignSelf: 'center' }}>
          {t('files.count', { count: filteredFiles.length })}
        </span>
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 28px 16px' }} className="max-md:!px-4">
        {filteredFiles.length === 0 ? (
          <EmptyState scene="files" title={t('files.empty')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredFiles.map(file => {
              const contributions = contribFor(file.id)
              return (
                <Fragment key={file.id}>
                  <FileRow {...S} file={file} />
                  {contributions.length > 0 && <div style={{ padding: '0 4px' }}><PluginCardFooter items={contributions} tripId={S.tripId} /></div>}
                </Fragment>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
