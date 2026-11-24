import { Image, Loader2, Search, Trash2, Bookmark } from 'lucide-react'
import type { Collection } from '@trek/shared'
import type { TranslationFn } from '../../../types'
import { useListEditor } from '../../../components/Collections/useListEditor'
import { normalizeLinkUrl } from '../../../pages/collections/collectionsModel'
import MSheet from '../../components/MSheet'
import MCollLinksEditor from './MCollLinksEditor'
import { listCoverGradient, SWATCH_COLORS } from './collectionsMobileModel'
import { CancelPill, INPUT_CLS, PrimaryPill, SheetFooter, SheetHeader, TEXTAREA_CLS } from './MCollSheetKit'

// Scrims over the cover photo / Unsplash thumbs — fixed dark overlays in both themes.
const COVER_OVERLAY =
  'absolute inset-0 flex items-center justify-center gap-[6px] bg-[rgba(0,0,0,.28)] text-[0.78125rem] font-bold text-white' // theme-lint-disable
const PHOTO_CREDIT =
  'absolute inset-x-0 bottom-0 truncate bg-[rgba(0,0,0,.55)] px-[6px] py-1 text-start text-[0.625rem] text-white' // theme-lint-disable

interface MCollEditSheetProps {
  /** null = closed, 'new' = create, a Collection = edit that list. */
  target: Collection | 'new' | null
  onClose: () => void
  onCreated: (id: number) => void
  /** Owner-only: hands the id to the delete-confirm flow (sheet closes first). */
  onRequestDelete: (id: number) => void
  t: TranslationFn
}

/**
 * Create / edit a list: cover (upload or Unsplash search), name, colour,
 * description and links. Deleting goes through the shared confirm flow.
 */
export default function MCollEditSheet({ target, onClose, onCreated, onRequestDelete, t }: MCollEditSheetProps) {
  const {
    editing, fileRef, name, setName, color, setColor, description, setDescription, links, setLinks,
    coverPreview, coverQuery, setCoverQuery, coverResults, searchingCover, saving, close, pickCover, searchCover, pickUnsplash, save,
  } = useListEditor({ target, onClose, onCreated, t, defaultColor: SWATCH_COLORS[0], holdLastTarget: true, normalizeLinkUrl })

  // The sheets' eyebrow (Eyebrow), uppercase over each field.
  const label = 'mb-[5px] font-geist text-[0.625rem] font-bold uppercase tracking-[.09em] text-m-faint'
  const canDeleteList = editing != null && editing.is_owner !== false

  return (
    <MSheet
      open={target != null}
      onClose={close}
      material="glass"
      ariaLabel={editing ? t('collections.editListTitle') : t('collections.newList')}
    >
      <SheetHeader
        icon={<Bookmark size={19} strokeWidth={1.8} />}
        title={editing ? t('collections.editListTitle') : t('collections.newList')}
        onClose={close}
        closeLabel={t('common.close')}
      />
      <div className="m-scroll-fade min-h-0 flex-1 overflow-y-auto px-[18px] pb-[18px] pt-[14px]">
        <div className={label}>{t('collections.coverImage')}</div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative block h-[120px] w-full overflow-hidden rounded-[14px]"
          style={coverPreview ? undefined : { background: listCoverGradient(color) }}
        >
          {coverPreview && <img src={coverPreview} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <span className={COVER_OVERLAY}>
            <Image size={14} strokeWidth={2.2} /> {coverPreview ? t('collections.changeCover') : t('collections.addCover')}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={e => pickCover(e.target.files?.[0])}
        />
        <div className="mt-2 flex gap-2">
          <input
            value={coverQuery}
            onChange={e => setCoverQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void searchCover() } }}
            enterKeyHint="search" placeholder={t('dashboard.unsplashSearchPlaceholder')}
            className={`${INPUT_CLS} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={searchCover}
            disabled={searchingCover || (!coverQuery.trim() && !name.trim())}
            className="flex h-[42px] flex-none items-center gap-[5px] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 text-[length:calc(13px*var(--fs-scale-body,1))] font-semibold text-m-ink disabled:opacity-40"
          >
            {searchingCover ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} strokeWidth={2} />} Unsplash
          </button>
        </div>
        {coverResults.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {coverResults.map(photo => (
              <button
                key={photo.id}
                type="button"
                onClick={() => pickUnsplash(photo)}
                aria-label={photo.photographer || 'Unsplash'}
                className="relative h-20 overflow-hidden rounded-[10px] border border-[color:var(--m-rowbr)]"
                style={coverPreview === photo.url ? { boxShadow: 'inset 0 0 0 2px var(--m-act)' } : undefined}
              >
                <img src={photo.thumb} alt={photo.description || ''} loading="lazy" className="h-full w-full object-cover" />
                {photo.photographer && (
                  <span className={PHOTO_CREDIT}>
                    {photo.photographer}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <div className={`${label} mt-[14px]`}>{t('collections.listName')}</div>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('collections.listNamePlaceholder')}
          className={`${INPUT_CLS} font-semibold`}
        />

        <div className={`${label} mt-[14px] mb-[6px]`}>{t('collections.listColor')}</div>
        <div className="flex flex-wrap gap-2">
          {SWATCH_COLORS.map(col => (
            <button
              key={col}
              type="button"
              onClick={() => setColor(col)}
              aria-label={col}
              aria-pressed={color === col}
              className={`h-[26px] w-[26px] rounded-full ${color === col ? 'outline outline-2 outline-offset-2 outline-[color:var(--m-act)]' : ''}`}
              style={{ background: col }}
            />
          ))}
        </div>

        <div className={`${label} mt-[14px]`}>{t('collections.description')}</div>
        <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder={t('collections.descriptionPlaceholder')} className={TEXTAREA_CLS} />

        <div className={`${label} mt-[14px]`}>{t('collections.links')}</div>
        <MCollLinksEditor links={links} onChange={setLinks} t={t} />
      </div>
      <SheetFooter>
        {canDeleteList && (
          <button
            type="button"
            onClick={() => { onClose(); onRequestDelete(editing!.id) }}
            className="flex items-center gap-[5px] text-[0.75rem] font-bold text-[color:var(--m-st-danger)]"
          >
            <Trash2 size={13} strokeWidth={2} /> {t('collections.deleteList')}
          </button>
        )}
        <CancelPill className="ms-auto" onClick={close}>{t('common.cancel')}</CancelPill>
        <PrimaryPill onClick={save} disabled={!name.trim() || saving}>
          {saving && <Loader2 size={14} className="animate-spin" />}
          {editing ? t('common.save') : t('collections.create')}
        </PrimaryPill>
      </SheetFooter>
    </MSheet>
  )
}
