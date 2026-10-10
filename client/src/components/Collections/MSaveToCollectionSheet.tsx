import { Bookmark, BookmarkCheck, Check, CheckCircle2, Loader2, Plus, X } from 'lucide-react'
import MSheet from '../../mobile/components/MSheet'
import MIconBtn from '../../mobile/components/MIconBtn'
import { useTranslation } from '../../i18n'
import { STATUS_META, nextStatus } from '../../pages/collections/collectionsModel'
import { VISITED_EVERYWHERE_BUSY, useSaveToCollection } from './useSaveToCollection'

/**
 * Mobile counterpart of SaveToCollectionModal — the same store-driven list
 * picker (load lists + membership, toggle the place in/out of each), dressed in
 * the mobile design language (MSheet card, m-* tokens) so it matches the place
 * detail sheet. Rendered instead of the desktop modal on phones (see App.tsx).
 */
export default function MSaveToCollectionSheet() {
  const { target, close, lists, loading, busyId, savedByCollection, unvisited, handleStatus, handleVisitedEverywhere, handleToggle, openCollections } = useSaveToCollection()
  const { t } = useTranslation()

  return (
    <MSheet open={!!target} onClose={close} variant="card" material="glass" ariaLabel={t('collections.pickList')}>
      {/* Header — mirrors the place detail sheet: icon + title + target name + close */}
      <div className="flex-none px-[18px] pt-4">
        <div className="flex items-start gap-3">
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-[14px] bg-[color:var(--m-ic)] text-m-muted">
            <Bookmark size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[1rem] font-bold leading-snug">{t('collections.pickList')}</div>
            {target?.name && (
              <div className="mt-[2px] truncate font-geist text-[0.6875rem] text-m-muted">{target.name}</div>
            )}
          </div>
          <MIconBtn variant="neutral" size={34} onClick={close} ariaLabel={t('common.close')}>
            <X size={15} strokeWidth={2.2} />
          </MIconBtn>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-[14px] pb-[16px] pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-m-faint">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : lists.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--m-ic)] text-m-faint">
              <Bookmark size={20} strokeWidth={2} />
            </span>
            <p className="mb-3 font-geist text-[0.75rem] text-m-faint">{t('collections.noListsYet')}</p>
            <button
              type="button"
              onClick={openCollections}
              className="inline-flex items-center gap-1.5 rounded-full bg-m-act px-4 py-[9px] text-[0.75rem] font-semibold text-m-actfg"
            >
              <Plus size={14} strokeWidth={2.2} /> {t('collections.newList')}
            </button>
          </div>
        ) : (
          lists.map(list => {
            const entry = savedByCollection.get(list.id)
            const saved = !!entry
            const busy = busyId === list.id
            const statusMeta = entry ? STATUS_META[entry.status] : null
            const StatusIcon = statusMeta?.icon
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => handleToggle(list)}
                disabled={busyId != null}
                className={`mt-2 flex w-full items-center gap-[11px] rounded-[14px] border px-3 py-[10px] text-start disabled:opacity-60 ${
                  saved
                    ? 'border-[color:var(--m-act)] bg-[color:var(--m-inner)]'
                    : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]'
                }`}
              >
                <span
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-xl text-white"
                  style={{ background: list.color || '#6366f1' }}
                >
                  <Bookmark size={15} strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-semibold text-m-ink">{list.name}</span>
                  {/* Saved lists show their own status here instead of the place
                      count — that number matters when picking a list, the status
                      matters once the place is in it (#1469). */}
                  {entry && statusMeta && StatusIcon ? (
                    <span
                      role={entry.can_edit ? 'button' : undefined}
                      tabIndex={entry.can_edit ? 0 : undefined}
                      aria-label={t(statusMeta.labelKey)}
                      onClick={entry.can_edit ? e => { e.preventDefault(); e.stopPropagation(); void handleStatus(entry, nextStatus(entry.status)) } : undefined}
                      onKeyDown={entry.can_edit ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); void handleStatus(entry, nextStatus(entry.status)) } } : undefined}
                      className="mt-[3px] inline-flex items-center gap-1 rounded-full bg-[color:var(--m-inner)] px-2 py-[3px] font-geist text-[0.65625rem] font-semibold"
                      style={{ color: statusMeta.color }}
                    >
                      <StatusIcon size={11} strokeWidth={2.4} />
                      {t(statusMeta.labelKey)}
                    </span>
                  ) : (
                    <span className="mt-px block font-geist text-[0.65625rem] text-m-muted">
                      {t('collections.placeCount', { count: list.place_count ?? 0 })}
                    </span>
                  )}
                </span>
                {list.is_owner === false && (
                  <span className="flex-none font-geist text-[0.5625rem] font-bold uppercase tracking-[.05em] text-m-faint">
                    {t('collections.shared')}
                  </span>
                )}
                <span
                  className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full ${
                    saved ? 'bg-m-act text-m-actfg' : 'border border-[color:var(--m-rowbr)] text-m-faint'
                  }`}
                >
                  {busy ? <Loader2 size={14} className="animate-spin" /> : saved ? <BookmarkCheck size={14} strokeWidth={2} /> : <Check size={14} strokeWidth={2} />}
                </span>
              </button>
            )
          })
        )}
      </div>

      {unvisited.length > 0 && (
        <div className="flex-none px-[14px] pb-1">
          <button
            type="button"
            onClick={handleVisitedEverywhere}
            disabled={busyId != null}
            className="flex w-full items-center justify-center gap-1.5 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] py-[10px] text-[0.78125rem] font-semibold text-m-ink disabled:opacity-60"
          >
            {busyId === VISITED_EVERYWHERE_BUSY
              ? <Loader2 size={14} className="animate-spin" />
              : <CheckCircle2 size={14} strokeWidth={2.2} />}
            {unvisited.length > 1 ? t('collections.markVisitedAll') : t('collections.markVisited')}
          </button>
        </div>
      )}

      {lists.length > 0 && (
        <div className="flex flex-none items-center justify-between gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] py-3">
          <button
            type="button"
            onClick={openCollections}
            className="text-[0.78125rem] font-semibold text-[color:var(--m-act)]"
          >
            {t('collections.viewInCollection')}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-full bg-[color:var(--m-ic)] px-4 py-[8px] text-[0.78125rem] font-semibold text-m-ink"
          >
            {t('common.close')}
          </button>
        </div>
      )}
    </MSheet>
  )
}
