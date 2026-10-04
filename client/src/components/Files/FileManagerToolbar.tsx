import { FolderSync, Star, Trash2 } from 'lucide-react'
import type { FileManagerState } from './useFileManager'
import { Tooltip } from '../shared/Tooltip'

/** A 36 px icon control on the bar; open, it is raised like the active filter tab beside it. */
const BAR_BTN = 'relative grid h-9 w-9 flex-none place-items-center rounded-[10px]'
const BODY = { fontSize: 'calc(13px * var(--fs-scale-body, 1))' }

/**
 * The bar on top of Files, in the shape the other trip tabs open with: the
 * tab's name, the kinds of file to narrow to, and the tools on the right.
 */
export function FileManagerToolbar(S: FileManagerState) {
  const { showTrash, t, files, filterType, setFilterType, toggleTrash, setShowDocSync, docSyncOffered, trashFiles, can, trip, handleEmptyTrash } = S
  const trashLabel = t('files.trash') || 'Trash'
  return (
    <div className="flex-none px-7 pt-6 max-md:px-4 max-md:pt-4">
      <div className="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-surface-tertiary py-3 pl-[22px] pr-3">
        <h2 className="m-0 shrink-0 text-subtitle font-semibold tracking-[-0.01em] text-content">
          {showTrash ? trashLabel : t('files.title')}
        </h2>

        {!showTrash && (
          <>
            <div className="mx-1.5 hidden h-[22px] w-px shrink-0 bg-edge-faint md:block" />
            <div className="hidden min-w-0 flex-1 flex-wrap gap-1 md:inline-flex">
              {[
                { id: 'all', label: t('files.filterAll') },
                ...(files.some(f => f.starred) ? [{ id: 'starred', icon: Star } as const] : []),
                { id: 'pdf', label: t('files.filterPdf') },
                { id: 'image', label: t('files.filterImages') },
                { id: 'doc', label: t('files.filterDocs') },
                ...(files.some(f => f.note_id) ? [{ id: 'collab', label: t('files.filterCollab') || 'Collab' }] : []),
              ].map(tab => {
                const active = filterType === tab.id
                const TabIcon = 'icon' in tab ? tab.icon : null
                const count = tab.id === 'all' ? files.length
                  : tab.id === 'starred' ? files.filter(f => f.starred).length
                  : tab.id === 'pdf' ? files.filter(f => (f.mime_type || '').includes('pdf') || /\.pdf$/i.test(f.original_name)).length
                  : tab.id === 'image' ? files.filter(f => (f.mime_type || '').startsWith('image/')).length
                  : tab.id === 'doc' ? files.filter(f => /\.(docx?|xlsx?|txt|csv)$/i.test(f.original_name)).length
                  : tab.id === 'collab' ? files.filter(f => f.note_id).length
                  : 0
                return (
                  <button type="button" key={tab.id} onClick={() => setFilterType(tab.id)} aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 ${active ? 'bg-surface-card font-medium text-content shadow-sm' : 'text-content-muted hover:text-content'}`}
                    style={BODY}
                  >
                    {TabIcon ? <TabIcon size={13} fill={active ? '#facc15' : 'none'} color={active ? '#facc15' : 'currentColor'} /> /* theme-lint-disable: the star keeps its gold */ : null}
                    {'label' in tab && tab.label}
                    <span className="min-w-4 rounded-full bg-surface-tertiary px-1.5 text-center font-geist font-bold text-content-faint" style={{ fontSize: 'calc(10px * var(--fs-scale-caption, 1))' }}>{count}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}
        {showTrash && <span className="flex-1" />}

        {/* Opens the sync panel. Placed next to the trash rather than in a menu
            because the question it answers, "where do these documents live",
            belongs on the same screen as the documents. Only where there is
            something behind it: see useDocSyncOffered. */}
        {docSyncOffered && (
          <Tooltip label={t('docsync.title')}>
            <button type="button" onClick={() => setShowDocSync(true)} aria-label={t('docsync.title')}
              className="inline-flex h-9 flex-none items-center gap-1.5 rounded-[10px] bg-surface-card px-3 font-medium text-content-secondary hover:text-content" style={BODY}>
              <FolderSync size={14} strokeWidth={2.2} /> <span className="hidden sm:inline">{t('docsync.title')}</span>
            </button>
          </Tooltip>
        )}

        {/* Emptying the trash is the one thing to do in it, so it sits on the bar. */}
        {showTrash && trashFiles.length > 0 && can('file_delete', trip) && (
          <button type="button" onClick={handleEmptyTrash}
            className="inline-flex h-9 flex-none items-center gap-1.5 rounded-[10px] bg-danger-soft px-3.5 font-medium text-danger hover:opacity-90" style={BODY}>
            <Trash2 size={14} strokeWidth={2} />
            {t('files.emptyTrash') || 'Empty Trash'}
          </button>
        )}

        {/* The trash is a place to look, not the tab's main action: an icon on
            the bar, raised while it is open. */}
        <Tooltip label={trashLabel}>
          <button type="button" onClick={toggleTrash} aria-label={trashLabel} aria-pressed={showTrash}
            className={`${BAR_BTN} ${showTrash ? 'bg-surface-card text-content shadow-sm' : 'text-content-muted hover:bg-surface-card hover:text-content'}`}>
            <Trash2 size={15} strokeWidth={2} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
