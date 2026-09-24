import React, { useMemo, useRef, useState } from 'react'
import { Upload, FileJson, Loader2, MapPin, Tag, AlertCircle, Route, Info, Plus, FolderInput, Check, Search, Bookmark } from 'lucide-react'
import Modal from '../shared/Modal'
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

/** What a GPX held besides its places, said before anything is imported. */
function GpxNotes({ leftovers, placeCount, t }: { leftovers: GpxLeftovers; placeCount: number; t: TranslationFn }) {
  const notes = [
    placeCount === 0 && t('collections.file.gpxEmpty'),
    leftovers.skipped > 0 && t('collections.file.gpxSkipped', { count: leftovers.skipped }),
    leftovers.trackPoints > 0 && t('collections.file.gpxTrack', { count: leftovers.trackPoints }),
  ].filter(Boolean)
  if (notes.length === 0) return null
  return (
    <ul className="flex flex-col gap-1">
      {notes.map(note => (
        <li key={note as string} className="flex items-start gap-2 text-[12px] text-content-muted">
          <Info size={13} className="shrink-0 mt-0.5 text-content-faint" />
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
      className={`relative flex flex-col items-start gap-1.5 px-3 py-3 rounded-xl border text-left transition-colors ${
        active ? 'border-accent bg-surface-hover' : 'border-edge hover:bg-surface-hover'
      }`}
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-accent text-accent-text' : 'bg-surface-input text-content-muted'}`}>
        <Icon size={15} />
      </span>
      <span className="text-[13px] font-semibold text-content">{title}</span>
      <span className="text-[11.5px] text-content-faint leading-snug">{hint}</span>
      {active && (
        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent text-accent-text flex items-center justify-center">
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
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('collections.file.searchLists')}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
          />
        </div>
      )}
      <div className="flex flex-col gap-1 max-h-[34vh] overflow-y-auto -mx-1 px-1">
        {shown.map(list => {
          const active = list.id === selectedId
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => onSelect(list.id)}
              aria-pressed={active}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                active ? 'border-accent bg-surface-hover' : 'border-edge bg-surface-card hover:bg-surface-hover'
              }`}
            >
              <span className="w-9 h-9 min-w-[36px] rounded-lg flex items-center justify-center shrink-0 text-white" style={{ background: list.color || '#6366f1' }}>
                <Bookmark size={15} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-content truncate">{list.name}</span>
                <span className="block text-[11.5px] text-content-faint">{t('collections.placeCount', { count: list.place_count ?? 0 })}</span>
              </span>
              {active && <Check size={16} className="shrink-0 text-accent" />}
            </button>
          )
        })}
        {shown.length === 0 && (
          <p className="text-center text-[13px] text-content-faint py-6">{t('collections.noOtherLists')}</p>
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
    <Modal
      isOpen
      onClose={onClose}
      title={t('collections.file.importTitle')}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-[13px] font-medium text-content-muted hover:bg-surface-hover transition-colors">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!file || busy || nothingToImport || (intoExisting ? listId == null : !name.trim())}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-accent text-accent-text disabled:opacity-50 transition-opacity inline-flex items-center gap-2"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {intoExisting ? t('collections.file.confirmInto') : t('collections.file.confirm')}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
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
            className={`flex flex-col items-center justify-center gap-2 px-4 py-10 rounded-xl border border-dashed transition-colors ${
              dragging ? 'border-accent bg-surface-hover' : 'border-edge hover:bg-surface-hover'
            }`}
          >
            {reading ? <Loader2 size={22} className="text-content-faint animate-spin" /> : <Upload size={22} className="text-content-faint" />}
            <span className="text-[13px] font-medium text-content">
              {reading ? t('collections.file.reading') : t('collections.file.choose')}
            </span>
            <span className="text-[11.5px] text-content-faint">{COLLECTION_FILE_EXTENSION} · {COLLECTION_GPX_EXTENSION}</span>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-edge bg-surface-card">
              <span className="w-9 h-9 min-w-[36px] rounded-lg flex items-center justify-center shrink-0 text-white" style={{ background: file.color || '#6366f1' }}>
                {leftovers ? <Route size={15} /> : <FileJson size={15} />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] font-semibold text-content truncate">{file.name}</span>
                <span className="flex items-center gap-3 text-[11.5px] text-content-faint">
                  <span className="inline-flex items-center gap-1"><MapPin size={11} />{t('collections.placeCount', { count: file.places.length })}</span>
                  {file.labels && file.labels.length > 0 && (
                    <span className="inline-flex items-center gap-1"><Tag size={11} />{t('collections.file.labelCount', { count: file.labels.length })}</span>
                  )}
                </span>
              </span>
              <button type="button" onClick={() => inputRef.current?.click()} className="text-[12px] font-medium text-accent shrink-0 hover:underline">
                {t('collections.file.change')}
              </button>
            </div>

            {file.description && (
              <p className="text-[12px] text-content-muted whitespace-pre-wrap">{file.description}</p>
            )}

            {leftovers && <GpxNotes leftovers={leftovers} placeCount={file.places.length} t={t} />}

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
              <>
                <ListChoice lists={targets} selectedId={listId} onSelect={setListId} t={t} />
                <p className="text-[11.5px] text-content-faint">{t('collections.file.intoHint')}</p>
              </>
            ) : (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-medium text-content-muted">{t('collections.listName')}</span>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    maxLength={120}
                    className="w-full px-3 py-2 rounded-lg border border-edge bg-surface-input text-content text-[13px] outline-none focus:border-accent"
                  />
                </label>

                {!leftovers && <p className="text-[11.5px] text-content-faint">{t('collections.file.hint')}</p>}
              </>
            )}
          </>
        )}

        {errorText && (
          <p className="flex items-start gap-2 text-[12px] text-danger">
            <AlertCircle size={13} className="shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </p>
        )}
      </div>
    </Modal>
  )
}
