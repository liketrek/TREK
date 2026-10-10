import React, { useId, useMemo, useRef, useState } from 'react'
import { Upload, FileDown, FileJson, Loader2, MapPin, Tag, AlertCircle, Route, Info, Plus, FolderInput, Check, Search, Bookmark } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, INPUT } from '../shared/dialogParts'
import { MAX_COLLECTION_FILE_PLACES, type Collection, type CollectionFile } from '@trek/shared'
import type { TranslationFn } from '../../types'
import { getApiErrorMessage } from '../../types'
import {
  readCollectionFile,
  type CollectionFileError,
  type GpxLeftovers,
  type GpxReader,
  COLLECTION_FILE_EXTENSION,
  COLLECTION_GPX_EXTENSION,
} from './collectionFile'

interface ImportCollectionModalProps {
  onImport: (file: CollectionFile, name?: string) => Promise<void>
  /** Adds the file to a list that is already there. Without it the dialog only makes new ones. */
  onImportInto?: (file: CollectionFile, collectionId: number) => Promise<void>
  /** The lists this person may add to; the server applies the same rule again. */
  lists?: Collection[]
  /** The list that is open, so the obvious target is the one already selected. */
  defaultListId?: number | null
  /** Reads a GPX into a list file (#2301); the server does the parsing. */
  onReadGpx: GpxReader
  onClose: () => void
  t: TranslationFn
}

/** Keyed by the error type, so a new way for a file to fail does not build without its words. */
const ERROR_KEYS: Record<CollectionFileError, string> = {
  'too-large': 'collections.file.errorTooLarge',
  unreadable: 'collections.file.errorUnreadable',
  'not-a-collection': 'collections.file.errorNotACollection',
  'not-gpx': 'collections.file.errorNotGpx',
  'too-many-places': 'collections.file.errorTooManyPlaces',
}

/**
 * The square that stands for a list: its colour as a wash, the icon in the
 * colour itself. A list without one is drawn in the default the lists rail uses.
 */
function swatch(color?: string | null): React.CSSProperties {
  const tone = color || '#6366f1' // theme-lint-disable: a list's own colour, and the default one without a colour is drawn in
  return { background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }
}

const ROWS = 'flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5'
const HINT = 'm-0 leading-normal text-content-faint'

/** What a GPX held besides its places, said before anything is imported. */
function GpxNotes({ leftovers, placeCount, t }: { leftovers: GpxLeftovers; placeCount: number; t: TranslationFn }) {
  const notes = [
    placeCount === 0 && t('collections.file.gpxEmpty'),
    leftovers.skipped > 0 && t('collections.file.gpxSkipped', { count: leftovers.skipped }),
    leftovers.trackPoints > 0 && t('collections.file.gpxTrack', { count: leftovers.trackPoints }),
  ].filter(Boolean)
  if (notes.length === 0) return null
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {notes.map(note => (
        <li key={note as string} className="flex items-start gap-2 text-content-muted" style={fs(12, 'body')}>
          <Info size={13} className="mt-0.5 flex-none text-content-faint" />
          <span>{note}</span>
        </li>
      ))}
    </ul>
  )
}

/** One of the two answers to "where do these places go", as a card you can tap. */
function TargetCard({ active, icon: Icon, title, hint, onClick }: {
  active: boolean
  icon: typeof Plus
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex flex-col items-start gap-1.5 rounded-[14px] border p-3 text-start transition-colors ${
        active ? 'border-accent bg-surface-card shadow-sm' : 'border-edge-faint bg-surface-secondary hover:bg-surface-card'
      }`}
    >
      <span className={`grid h-8 w-8 place-items-center rounded-[10px] ${active ? 'bg-accent text-accent-text' : 'bg-surface-card text-content-muted shadow-sm'}`}>
        <Icon size={15} />
      </span>
      <span className="font-semibold text-content" style={fs(13, 'body')}>{title}</span>
      <span className="leading-snug text-content-faint" style={fs(11.5)}>{hint}</span>
      {active && (
        <span className="absolute end-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-accent text-accent-text">
          <Check size={11} strokeWidth={3} />
        </span>
      )}
    </button>
  )
}

/** The lists the file may be added to, the open one first. */
function ListChoice({ lists, selectedId, onSelect, t }: {
  lists: Collection[]
  selectedId: number | null
  onSelect: (id: number) => void
  t: TranslationFn
}) {
  const [search, setSearch] = useState('')
  const shown = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? lists.filter(l => l.name.toLowerCase().includes(q)) : lists
  }, [lists, search])

  return (
    <div className="flex flex-col gap-2">
      {lists.length > 5 && (
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-content-faint" aria-hidden="true" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('collections.file.searchLists')}
            placeholder={t('collections.file.searchLists')}
            className={`${INPUT} ps-8`}
          />
        </div>
      )}
      <div className={`${ROWS} max-h-[34vh] overflow-y-auto`}>
        {shown.map(list => {
          const active = list.id === selectedId
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => onSelect(list.id)}
              aria-pressed={active}
              className={`flex min-h-[46px] items-center gap-3 rounded-[10px] px-2.5 py-2 text-start ${active ? 'bg-surface-card shadow-sm' : 'hover:bg-surface-card'}`}
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-[9px]" style={swatch(list.color)}>
                <Bookmark size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{list.name}</span>
                <span className="block text-content-faint" style={fs(11.5)}>{t('collections.placeCount', { count: list.place_count ?? 0 })}</span>
              </span>
              {active && <Check size={16} className="flex-none text-accent-on" />}
            </button>
          )
        })}
        {shown.length === 0 && (
          <p className="m-0 py-6 text-center text-content-faint" style={fs(13, 'body')}>{t('collections.noOtherLists')}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Read a list file or a GPX and make a list of it (#2198, #2301).
 *
 * Two steps on purpose. A file from somebody else is an unknown quantity, so
 * it is read and shown first — how many places, which labels, what the list is
 * called — and only then imported. The name is editable in the same breath,
 * because a file called "Lisbon" from a friend is usually worth calling
 * "Lisbon (from Ana)" on the way in, and renaming it afterwards means finding
 * the list editor.
 *
 * A list file never leaves the browser as a file: it is parsed here. A GPX is
 * read by the server into the same kind of list file, and from then on the two
 * are one path: what goes to the import is a list file, through the same
 * contract the server validates against.
 *
 * The file can go into a list that is already there instead of a new one. That
 * is a choice rather than the default, because the two do different things: a
 * new list is the file as it stands, while adding to a list leaves everything
 * in it alone and skips the places it already has.
 */
export default function ImportCollectionModal({
  onImport, onImportInto, lists, defaultListId, onReadGpx, onClose, t,
}: ImportCollectionModalProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const nameId = useId()
  const [file, setFile] = useState<CollectionFile | null>(null)
  const [leftovers, setLeftovers] = useState<GpxLeftovers | null>(null)
  const [name, setName] = useState('')
  const [error, setError] = useState<CollectionFileError | 'failed' | null>(null)
  const [failedMessage, setFailedMessage] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [target, setTarget] = useState<'new' | 'existing'>('new')
  // The open list first: it is the one somebody importing from inside a list means.
  const targets = useMemo(() => {
    const all = lists ?? []
    const open = all.find(l => l.id === defaultListId)
    return open ? [open, ...all.filter(l => l.id !== open.id)] : all
  }, [lists, defaultListId])
  const [listId, setListId] = useState<number | null>(() => targets[0]?.id ?? null)
  const canChoose = !!onImportInto && targets.length > 0
  const intoExisting = canChoose && target === 'existing'

  const take = async (chosen: File | undefined) => {
    if (!chosen || reading) return
    setError(null)
    setFailedMessage(null)
    setReading(true)
    try {
      const result = await readCollectionFile(chosen, onReadGpx)
      setFile(result.file)
      setLeftovers(result.gpx ?? null)
      setError(result.error)
      if (result.file) setName(result.file.name)
    } catch (err) {
      setFile(null)
      setLeftovers(null)
      setError('failed')
      setFailedMessage(getApiErrorMessage(err, t('common.error')))
    } finally {
      setReading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void take(e.dataTransfer.files?.[0])
  }

  const submit = async () => {
    if (!file || busy) return
    setBusy(true)
    setError(null)
    setFailedMessage(null)
    try {
      if (intoExisting && listId != null) {
        await onImportInto!(file, listId)
      } else {
        const trimmed = name.trim()
        await onImport(file, trimmed && trimmed !== file.name ? trimmed : undefined)
      }
    } catch (err) {
      setError('failed')
      setFailedMessage(getApiErrorMessage(err, t('common.error')))
    } finally {
      setBusy(false)
    }
  }

  const errorText = error === 'failed'
    ? (failedMessage ?? t('common.error'))
    : error ? t(ERROR_KEYS[error], { count: MAX_COLLECTION_FILE_PLACES }) : null

  // A GPX of nothing but a track would make an empty list, which is never what was meant.
  const nothingToImport = !!leftovers && !!file && file.places.length === 0

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={titleId}
      width="narrow"
      // The body grows once a file is read; the top edge stays where it was.
      align="top"
      header={(
        <DialogHeader
          tile={<DialogTile><FileDown size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={titleId}
          onClose={onClose}
          title={t('collections.file.importTitle')}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton
            variant="primary"
            onClick={() => void submit()}
            disabled={!file || busy || nothingToImport || (intoExisting ? listId == null : !name.trim())}
            icon={busy ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {intoExisting ? t('collections.file.confirmInto') : t('collections.file.confirm')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json,.gpx,application/gpx+xml"
        className="hidden"
        onChange={e => { void take(e.target.files?.[0]); e.target.value = '' }}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={reading}
          aria-busy={reading}
          className={`flex min-h-[132px] w-full flex-col items-center justify-center gap-1.5 rounded-[14px] border-2 border-dashed p-4 transition-colors ${
            dragging ? 'border-accent bg-surface-tertiary' : 'border-edge bg-surface-secondary hover:border-content-faint'
          }`}
        >
          {reading
            ? <Loader2 size={20} className="animate-spin text-content-faint" />
            : <Upload size={20} strokeWidth={1.8} className="text-content-faint" />}
          <span className="font-semibold text-content" style={fs(13, 'body')}>
            {reading ? t('collections.file.reading') : t('collections.file.choose')}
          </span>
          <span className="flex items-center gap-1.5 text-content-faint" style={fs(11.5)}><span>{COLLECTION_FILE_EXTENSION}</span><span>{COLLECTION_GPX_EXTENSION}</span></span>
        </button>
      ) : (
        <>
          {/* What the file holds, read before anything is imported. */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3 rounded-[14px] border border-edge-faint bg-surface-secondary p-2.5">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px]" style={swatch(file.color)}>
                {leftovers ? <Route size={16} /> : <FileJson size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-content" style={fs(13, 'body')}>{file.name}</span>
                <span className="flex items-center gap-3 text-content-faint" style={fs(11.5)}>
                  <span className="inline-flex items-center gap-1"><MapPin size={11} />{t('collections.placeCount', { count: file.places.length })}</span>
                  {file.labels && file.labels.length > 0 && (
                    <span className="inline-flex items-center gap-1"><Tag size={11} />{t('collections.file.labelCount', { count: file.labels.length })}</span>
                  )}
                </span>
              </span>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex-none rounded-[8px] bg-surface-card px-2.5 py-1 font-semibold text-content shadow-sm ring-1 ring-edge-faint hover:bg-surface-secondary"
                style={fs(12, 'body')}
              >
                {t('collections.file.change')}
              </button>
            </div>

            {file.description && (
              <p className="m-0 whitespace-pre-wrap text-content-muted" style={fs(12, 'body')}>{file.description}</p>
            )}

            {leftovers && <GpxNotes leftovers={leftovers} placeCount={file.places.length} t={t} />}
          </div>

          {canChoose && (
            <div className="grid grid-cols-2 gap-2">
              <TargetCard
                active={target === 'new'}
                icon={Plus}
                title={t('collections.file.targetNew')}
                hint={t('collections.file.targetNewHint')}
                onClick={() => setTarget('new')}
              />
              <TargetCard
                active={intoExisting}
                icon={FolderInput}
                title={t('collections.file.targetExisting')}
                hint={t('collections.file.targetExistingHint')}
                onClick={() => setTarget('existing')}
              />
            </div>
          )}

          {intoExisting ? (
            <div className="flex flex-col gap-2">
              <ListChoice lists={targets} selectedId={listId} onSelect={setListId} t={t} />
              <p className={HINT} style={fs(11.5)}>{t('collections.file.intoHint')}</p>
            </div>
          ) : (
            <EditorField
              label={t('collections.listName')}
              htmlFor={nameId}
              // Ratings and members are a TREK file's business; a GPX never had any.
              hint={leftovers ? undefined : t('collections.file.hint')}
            >
              <input
                id={nameId}
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={120}
                className={INPUT}
              />
            </EditorField>
          )}
        </>
      )}

      {errorText && (
        <div role="alert" className="flex items-start gap-2 rounded-[12px] bg-danger-soft px-3 py-2 text-danger" style={fs(12, 'body')}>
          <AlertCircle size={13} className="mt-0.5 flex-none" />
          <span>{errorText}</span>
        </div>
      )}
    </DialogShell>
  )
}
