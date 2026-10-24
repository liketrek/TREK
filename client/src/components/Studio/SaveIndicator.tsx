import { AlertTriangle, Check, CloudOff, Eye, RefreshCw } from 'lucide-react'
import type { BookRecord } from '@trek/shared'
import type { SaveState } from './useBookStore'

/**
 * Whether the book is safe.
 *
 * Autosave without a sign of it is a promise you are asking someone to take on
 * faith, and the moment they do not is the moment they close the tab to check.
 * So: a tick when it is written, a spinner while it is being written, and — the
 * one that matters — a real choice when someone else got there first.
 *
 * Quiet by design. This sits in the top bar of an editor, and a status that
 * announces every successful save is a status people learn to stop reading,
 * which is exactly the wrong habit for the one time it says something else.
 */
export function SaveIndicator({
  state, t, onAcceptTheirs, onKeepMine, onRetry,
}: {
  state: SaveState
  t: (k: string) => string
  onAcceptTheirs: (current: BookRecord) => void
  onKeepMine: (current: BookRecord) => void
  onRetry: () => void
}) {
  if (state.status === 'conflict') {
    return (
      <div className="st-save is-conflict" role="alert">
        <AlertTriangle size={13} />
        <span>{t('journey.studio.saveConflict')}</span>
        {/*
          Two ways out, both stated plainly. There is no merge here and
          pretending otherwise would be worse than saying so: one of these
          documents is going to be the book.
        */}
        <button type="button" onClick={() => onAcceptTheirs(state.current)}>
          {t('journey.studio.saveTakeTheirs')}
        </button>
        <button type="button" onClick={() => onKeepMine(state.current)}>
          {t('journey.studio.saveKeepMine')}
        </button>
      </div>
    )
  }

  // A book a newer Studio saved is the shell's to say, over everything (NewerBookOverlay).
  if (state.status === 'newer') return null

  if (state.status === 'readonly') {
    /*
     * Not an error and not retryable: this person was invited to read the
     * journey, not to write it. Said once, plainly, and left standing — the
     * alternative is an editor that looks like it is saving and is not.
     */
    return (
      <div className="st-save is-error" role="status">
        <Eye size={13} />
        <span>{t('journey.studio.saveReadOnly')}</span>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <button type="button" className="st-save is-error" onClick={onRetry} title={t('journey.studio.saveRetry')}>
        <CloudOff size={13} />
        <span>{t('journey.studio.saveFailed')}</span>
      </button>
    )
  }

  if (state.status === 'saving') {
    return (
      <div className="st-save">
        <RefreshCw size={13} className="st-spin" />
        <span>{t('journey.studio.saving')}</span>
      </div>
    )
  }

  if (state.status === 'saved') {
    return (
      <div className="st-save is-quiet">
        <Check size={13} />
        <span>{t('journey.studio.saved')}</span>
      </div>
    )
  }

  return null
}

/**
 * A book a newer Studio saved, said over the whole Studio rather than in the
 * bar: this tab cannot write the book without losing what the newer one
 * added, and only a reload brings the newer Studio here. Until then nothing
 * done here would be kept, so nothing can be done: the overlay takes every
 * click and offers the one way out there is.
 */
export function NewerBookOverlay({ t, onReload = reloadStudio }: {
  t: (k: string) => string
  onReload?: () => void
}) {
  return (
    <div className="st-newer" role="alertdialog" aria-modal="true" aria-labelledby="st-newer-text">
      <div className="st-newer-card">
        <span className="st-newer-icon"><RefreshCw size={22} strokeWidth={2.2} /></span>
        <p id="st-newer-text" className="st-newer-text">{t('journey.studio.saveNewer')}</p>
        {/* Focused on arrival, so Enter reloads and nothing behind the overlay takes the keyboard. */}
        <button type="button" className="st-newer-reload" onClick={onReload} autoFocus>
          <RefreshCw size={15} />
          {t('journey.studio.saveReload')}
        </button>
      </div>
    </div>
  )
}

/** The default way back to a current Studio: the page again, which loads the newest build. */
function reloadStudio() {
  window.location.reload()
}
