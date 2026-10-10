import React, { useId, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { Bookmark, Search, MapPin, MapPinned, Loader2, Trash2, Check, X } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, GRID_2, INPUT, PANEL, Segmented, TEXTAREA } from '../shared/dialogParts'
import { NumericInput } from '../shared/NumericInput'
import NoteFormatToolbar from '../shared/NoteFormatToolbar'
import { Tooltip } from '../shared/Tooltip'
import { getCategoryIcon } from '../shared/categoryIcons'
import { normalizeLinkUrl, STATUS_META, STATUS_ORDER } from '../../pages/collections/collectionsModel'
import type { Category, TranslationFn } from '../../types'
import type { CollectionStatus } from '@trek/shared'
import { str } from './addPlaceModel'
import { useAddPlaceToCollection } from './useAddPlaceToCollection'

/**
 * The search row, pinned to the top of the scrolling body. The dialog stays open
 * after an add, and the row used to sit above the viewport once the form was
 * scrolled, so it looked like the button had vanished (#1921). The negative
 * margins let its background cover the body's padding while it is stuck.
 */
const STICKY_SEARCH = 'sticky top-0 z-20 -mx-6 -mt-5 bg-surface-card px-6 pb-1 pt-5'
/** A chip of the category row; the picked one wears the category's own colour. */
const CHIP = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-semibold'
const CHIP_OFF = 'border-edge-faint bg-surface-card text-content-muted hover:text-content'
const CHIP_NONE_ON = 'border-content bg-surface-card text-content'
const ROW_ACTION = 'grid h-8 w-8 flex-none place-items-center rounded-[9px] text-content-faint hover:bg-surface-secondary'

interface AddPlaceToCollectionModalProps {
  isOpen: boolean
  collectionId: number
  collectionName: string
  categories: Category[]
  onClose: () => void
  onAdded: () => void
  t: TranslationFn
}

/**
 * Add a place to the current list, everything in one view: the name typed into
 * the head band, a search that fills it and the location in when a result is
 * picked, plus status, category, a markdown description and links, all editable
 * together before saving. Stays open after each add so several places can be
 * added in a row.
 */
export default function AddPlaceToCollectionModal({ isOpen, collectionId, collectionName, categories, onClose, onAdded, t }: AddPlaceToCollectionModalProps): React.ReactElement {
  const searchRef = useRef<HTMLInputElement>(null)
  const {
    query, setQuery, results, searching, noResults, setNoResults, dismissResults, name, setName, address, setAddress,
    lat, setLat, lng, setLng, categoryId, setCategoryId, description, setDescription, links, setLinks, setLink,
    status, setStatus, saving, search, pick, coordPaste, save,
  } = useAddPlaceToCollection({
    variant: 'dialog', open: isOpen, collectionId, collectionName, t, onClose, onAdded, normalizeLinkUrl,
    // The dialog stays open for the next place, so hand the caret back to the
    // search field. The add button the user just clicked goes disabled with the
    // cleared name, which drops the focus to <body> and leaves the dialog dead
    // to the keyboard (#1921).
    afterAdd: () => searchRef.current?.focus(),
  })
  const descRef = useRef<HTMLTextAreaElement>(null)
  const labelId = useId()
  const fieldId = useId()

  const header = (
    <DialogHeader
      tile={<DialogTile><MapPinned size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={labelId}
      onClose={onClose}
      eyebrow={t('collections.addPlace')}
      // Typed into the band, as in the planner's place dialog. It takes no focus
      // on opening: the dialog starts at the search, which fills the name in.
      titleInput={{ value: name, onChange: setName, label: t('common.name'), placeholder: t('common.name') }}
      sub={<><Bookmark size={11} strokeWidth={2.2} className="me-1 inline-block align-[-1px]" />{collectionName}</>}
    />
  )

  const footer = (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
      <DialogButton
        variant="primary"
        onClick={() => void save()}
        disabled={saving || !name.trim()}
        icon={saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={2.2} />}
      >
        {t('common.add')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <DialogShell open={isOpen} onClose={onClose} labelledBy={labelId} width="detail" align="top" header={header} footer={footer}>
      {/* Search: picking a result fills the name and the location below. */}
      <div className={STICKY_SEARCH}>
        <div className="relative">
          <div className="flex items-stretch gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
              <input
                autoFocus
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setNoResults(false) }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void search() } }}
                aria-label={t('collections.addPlaceSearch')}
                placeholder={t('collections.addPlaceSearch')}
                className={`${INPUT} ps-8`}
              />
            </div>
            <DialogButton
              variant="primary"
              onClick={() => void search()}
              disabled={!query.trim() || searching}
              icon={searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} strokeWidth={2.2} />}
            >
              {t('common.search')}
            </DialogButton>
          </div>
          {(results.length > 0 || noResults) && (
            <div
              role="group"
              aria-label={t('common.search')}
              className="absolute inset-x-0 z-20 mt-1.5 flex max-h-[280px] flex-col gap-0.5 overflow-y-auto rounded-[12px] border border-edge-faint bg-surface-card p-1 shadow-dropdown"
            >
              <div className="flex items-center justify-between py-0.5 ps-2.5 pe-0.5">
                <span className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>{t('common.search')}</span>
                <Tooltip label={t('common.close')}>
                  <button type="button" onClick={dismissResults} aria-label={t('common.close')}
                    className="grid h-7 w-7 place-items-center rounded-[8px] text-content-faint hover:bg-surface-hover hover:text-content">
                    <X size={13} />
                  </button>
                </Tooltip>
              </div>
              {noResults ? (
                <div className="px-2.5 py-3 text-center text-content-faint" style={fs(12.5, 'body')}>{t('planner.noPlacesFound')}</div>
              ) : results.map((r, i) => (
                <button key={i} type="button" onClick={() => pick(r)} className="flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-start hover:bg-surface-hover">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-surface-secondary text-content-faint"><MapPin size={15} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{str(r.name)}</span>
                    {str(r.address) && <span className="block truncate text-content-faint" style={fs(11.5)}>{str(r.address)}</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Where it is: filled in by a picked result, but also typeable, so a place
          can be added by GPS alone (#1435). */}
      <div className={PANEL}>
        <EditorField label={t('places.formAddress')} htmlFor={`${fieldId}-address`}>
          <input
            id={`${fieldId}-address`}
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={t('places.formAddressPlaceholder')}
            className={INPUT}
          />
        </EditorField>
        <div role="group" aria-label={t('collections.coordinates')} className={GRID_2}>
          <EditorField label={t('places.formLatLabel')} htmlFor={`${fieldId}-lat`}>
            <NumericInput id={`${fieldId}-lat`} mode="signed" value={lat} onValueChange={setLat} onPaste={coordPaste} placeholder={t('places.formLat')} className={INPUT} />
          </EditorField>
          <EditorField label={t('places.formLngLabel')} htmlFor={`${fieldId}-lng`}>
            <NumericInput id={`${fieldId}-lng`} mode="signed" value={lng} onValueChange={setLng} onPaste={coordPaste} placeholder={t('places.formLng')} className={INPUT} />
          </EditorField>
        </div>
      </div>

      <EditorField label={t('mobileCollections.status')}>
        <Segmented<CollectionStatus>
          label={t('mobileCollections.status')}
          value={status}
          onChange={setStatus}
          options={STATUS_ORDER.map(s => {
            const Icon = STATUS_META[s].icon
            return { value: s, label: t(STATUS_META[s].labelKey), icon: <Icon size={13} style={{ color: STATUS_META[s].color }} /> }
          })}
        />
      </EditorField>

      {categories.length > 0 && (
        <EditorField label={t('collections.category')}>
          <div role="group" aria-label={t('collections.category')} className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              aria-pressed={categoryId == null}
              className={`${CHIP} ${categoryId == null ? CHIP_NONE_ON : CHIP_OFF}`}
              style={fs(12, 'body')}
            >
              {t('collections.noCategory')}
            </button>
            {categories.map(cat => {
              const Icon = getCategoryIcon(cat.icon ?? undefined)
              const on = categoryId === cat.id
              const col = cat.color || '#6366f1' // theme-lint-disable: the category's own colour, and the default one without a colour is drawn in
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  aria-pressed={on}
                  className={`${CHIP} ${CHIP_OFF}`}
                  style={{ ...fs(12, 'body'), ...(on ? { color: col, background: `color-mix(in oklch, ${col} 15%, transparent)`, borderColor: `color-mix(in oklch, ${col} 40%, transparent)` } : {}) }}
                >
                  <Icon size={13} /> {cat.name}
                </button>
              )
            })}
          </div>
        </EditorField>
      )}

      <DialogSection
        label={<label htmlFor={`${fieldId}-description`}>{t('collections.description')}</label>}
        action={<NoteFormatToolbar textareaRef={descRef} onChange={setDescription} compact customTooltips />}
      >
        <textarea
          id={`${fieldId}-description`}
          ref={descRef}
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder={t('collections.descriptionPlaceholder')}
          className={`${TEXTAREA} resize-y`}
        />
        {description.trim() && (
          <div className="collab-note-md mt-2 text-content-secondary" style={fs(13, 'body')}>
            <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{description}</Markdown>
          </div>
        )}
      </DialogSection>

      <DialogSection label={t('collections.links')}>
        <div className="flex flex-col gap-2">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-28 flex-none">
                <input value={l.label ?? ''} onChange={e => setLink(i, { label: e.target.value })} placeholder={t('collections.linkLabel')} className={INPUT} />
              </div>
              <input value={l.url} onChange={e => setLink(i, { url: e.target.value })} placeholder="https://…" className={`${INPUT} flex-1`} />
              <Tooltip label={t('common.delete')}>
                <button type="button" onClick={() => setLinks(links.filter((_, idx) => idx !== i))} aria-label={t('common.delete')} className={`${ROW_ACTION} hover:text-danger`}>
                  <Trash2 size={14} />
                </button>
              </Tooltip>
            </div>
          ))}
          <AddRowButton onClick={() => setLinks([...links, { url: '' }])}>{t('collections.addLink')}</AddRowButton>
        </div>
      </DialogSection>
    </DialogShell>
  )
}
