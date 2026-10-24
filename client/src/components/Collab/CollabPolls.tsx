import React, { useState, useCallback, useId } from 'react'
import { Plus, Trash2, X, BarChart3, Lock, Clock } from 'lucide-react'
import { RoundAction } from '../Planner/bookings/bookingParts'
import CollabPanelHead, { HEAD_ACTION } from './CollabPanelHead'
import { PollChip, PollOptionRow } from './CollabPollOption'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { AddRowButton, EditorField, TEXTAREA } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { sanitizedMarkdownComponents, sanitizedMarkdownPlugins } from '../shared/markdownSanitize'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { useCanDo } from '../../store/permissionsStore'
import { useTripStore } from '../../store/tripStore'
import EmptyState from '../shared/EmptyState'
import type { User } from '../../types'
import type { CollabPollCreateRequest } from '@trek/shared'
import { useCollabPolls } from './useCollabPolls'
import { hasUserVoted, isPollActive, pollMaxVoteCount, splitPolls, totalPollVotes, type CollabPollData } from './collabModel'

const FONT = "var(--font-system)"

// Block styling for the markdown question (#2177). Tailwind's preflight resets
// headings/lists, so the sizes are set here — in em, on purpose: they scale with
// the surrounding calc(13px * var(--fs-scale-body)) base, so the user's
// text-size setting keeps working. Links and sanitizing come from
// markdownSanitize (#1629): new tab plus rel protection, this is cross-user
// content.
const pollMarkdownComponents: Components = {
  ...sanitizedMarkdownComponents,
  p: ({ children }) => (
    <p style={{ margin: '0 0 0.55em' }}>{children}</p>
  ),
  h1: ({ children }) => (
    <h1 style={{ margin: '0 0 0.45em', fontSize: '1.4em', lineHeight: 1.2 }}>{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 style={{ margin: '0 0 0.45em', fontSize: '1.25em', lineHeight: 1.25 }}>{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 style={{ margin: '0 0 0.45em', fontSize: '1.1em', lineHeight: 1.3 }}>{children}</h3>
  ),
  ul: ({ children }) => (
    <ul style={{ margin: '0 0 0.55em', paddingInlineStart: 20, listStyle: 'disc' }}>{children}</ul>
  ),
  ol: ({ children }) => (
    <ol style={{ margin: '0 0 0.55em', paddingInlineStart: 20, listStyle: 'decimal' }}>{children}</ol>
  ),
}

function timeRemaining(deadline) {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return null
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return `${days}d ${hrs % 24}h`
  if (hrs > 0) return `${hrs}h ${mins % 60}m`
  return `${mins}m`
}

// ── Create Poll Modal ────────────────────────────────────────────────────────
interface CreatePollModalProps {
  onClose: () => void
  onCreate: (data: { question: string; options: string[]; multiple_choice: boolean }) => Promise<void>
  t: (key: string) => string
}

function CreatePollModal({ onClose, onCreate, t }: CreatePollModalProps) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multiChoice, setMultiChoice] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const addOption = () => setOptions(prev => [...prev, ''])
  const removeOption = (i) => setOptions(prev => prev.filter((_, j) => j !== i))
  const updateOption = (i, v) => setOptions(prev => prev.map((o, j) => j === i ? v : o))

  const canSubmit = question.trim() && options.filter(o => o.trim()).length >= 2 && !submitting

  const labelId = useId()
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // `multiple_choice` is the field the server reads (nest/collab/collab.service.ts);
      // the old `multi_choice` name was silently dropped, losing desktop multi-choice.
      await onCreate({ question: question.trim(), options: options.filter(o => o.trim()), multiple_choice: multiChoice })
      onClose()
    } catch {} finally { setSubmitting(false) }
  }

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      onSubmit={handleSubmit}
      header={(
        <DialogHeader
          tile={<DialogTile><BarChart3 size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('collab.polls.new')}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={() => void handleSubmit()} disabled={!canSubmit}>{submitting ? '...' : t('collab.polls.create')}</DialogButton>
        </DialogFooter>
      )}
    >
      <EditorField label={t('collab.polls.question')} hint={t('collab.polls.markdownHint')}>
        <textarea autoFocus rows={4} value={question} onChange={e => setQuestion(e.target.value)} placeholder={t('collab.polls.questionPlaceholder')} className={`${TEXTAREA} resize-y`} />
      </EditorField>

      <EditorField label={t('collab.polls.options')}>
        <div className="flex flex-col gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea rows={2} value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`${t('collab.polls.option')} ${i + 1}`} className={`${TEXTAREA} resize-y`} />
              {options.length > 2 && (
                <Tooltip label={t('common.delete')}>
                  <button type="button" onClick={() => removeOption(i)} aria-label={t('common.delete')} className="mt-1.5 grid h-7 w-7 flex-none place-items-center rounded-full text-content-faint hover:text-danger">
                    <X size={14} />
                  </button>
                </Tooltip>
              )}
            </div>
          ))}
          {/* The string starts with its own "+", and the button already draws one. */}
          <AddRowButton onClick={addOption}>{t('collab.polls.addOption').replace(/^\+\s*/, '')}</AddRowButton>
        </div>
      </EditorField>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-[12px] bg-surface-secondary px-3 py-2.5">
        <span className="text-content" style={fs(13, 'body')}>{t('collab.polls.multiChoice')}</span>
        <button type="button" role="switch" aria-checked={multiChoice} onClick={() => setMultiChoice(!multiChoice)}
          className={`flex h-5 w-9 flex-none items-center rounded-full p-0.5 transition-colors ${multiChoice ? 'bg-accent' : 'bg-surface-tertiary'}`}>
          <span className={`block h-4 w-4 rounded-full bg-surface-card shadow-sm transition-transform ${multiChoice ? 'translate-x-4 rtl:-translate-x-4' : ''}`} />
        </button>
      </label>
    </DialogShell>
  )
}

// ── Poll Card ────────────────────────────────────────────────────────────────
interface PollCardProps {
  poll: CollabPollData
  currentUser: User
  canEdit: boolean
  onVote: (pollId: number, optionId: number) => Promise<void>
  onClose: (pollId: number) => Promise<void>
  onDelete: (pollId: number) => Promise<void>
  t: (key: string, params?: Record<string, string | number>) => string
}

function PollCard({ poll, currentUser, canEdit, onVote, onClose, onDelete, t }: PollCardProps) {
  const total = totalPollVotes(poll)
  const isClosed = !isPollActive(poll)
  const remaining = timeRemaining(poll.deadline)
  const hasVoted = hasUserVoted(poll, currentUser.id)
  // Highest vote count across the options; 0 for a poll without options.
  const topCount = pollMaxVoteCount(poll)

  return (
    <article className="group overflow-hidden rounded-2xl border border-edge-faint bg-surface-card">
      {/* Head band: the question, what kind of poll it is, and its actions */}
      <div className="flex items-start gap-2 border-b border-edge-faint px-3 py-2.5" style={{ background: isClosed ? 'var(--bg-secondary)' : NEUTRAL_TINT }}>
        <div className="min-w-0 flex-1">
          <div className="break-words font-bold text-content" style={{ ...fs(13.5, 'body'), lineHeight: 1.35 }}>
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={sanitizedMarkdownPlugins} components={pollMarkdownComponents}>
              {poll.question}
            </ReactMarkdown>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {isClosed && <PollChip icon={<Lock size={9} strokeWidth={2.4} />}>{t('collab.polls.closed')}</PollChip>}
            {remaining && !isClosed && <PollChip tone="warning" icon={<Clock size={9} strokeWidth={2.4} />}>{remaining}</PollChip>}
            {poll.multiple_choice && <PollChip>{t('collab.polls.multiChoice')}</PollChip>}
            <PollChip>{t('collab.polls.votes', { n: total })}</PollChip>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-none gap-1">
            {!isClosed && (
              <RoundAction label={t('collab.polls.close')} onClick={() => onClose(poll.id)}><Lock size={12} strokeWidth={2} /></RoundAction>
            )}
            <RoundAction label={t('collab.polls.delete')} onClick={() => onDelete(poll.id)} danger><Trash2 size={12} strokeWidth={2} /></RoundAction>
          </div>
        )}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-1.5 p-3">
        {(poll.options || []).map((opt, idx) => {
          const count = opt.voters?.length || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const myVote = (opt.voters || []).some(v => String(v.user_id) === String(currentUser.id))
          const isWinner = isClosed && count > 0 && count === topCount

          return (
            <PollOptionRow
              key={idx}
              text={typeof opt === 'string' ? opt : opt.text}
              pct={pct}
              mine={myVote}
              winner={isWinner}
              showResults={hasVoted || isClosed}
              voters={(opt.voters || []).map((v, vi) => ({ key: v.user_id || vi, name: v.username || '?', src: v.avatar_url }))}
              disabled={isClosed}
              onClick={() => onVote(poll.id, idx)}
            />
          )
        })}
      </div>
    </article>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
interface CollabPollsProps {
  tripId: number
  currentUser: User
}

export default function CollabPolls({ tripId, currentUser }: CollabPollsProps) {
  const { t } = useTranslation()
  const toast = useToast()
  const can = useCanDo()
  const trip = useTripStore((s) => s.trip)
  const canEdit = can('collab_edit', trip)
  const [showForm, setShowForm] = useState(false)
  const { polls, loading, createPoll, votePoll: handleVote, closePoll: handleClose, deletePoll: handleDelete } = useCollabPolls({
    tripId, t, toast, resetOnLoadError: true,
  })

  const handleCreate = useCallback(async (data: CollabPollCreateRequest) => {
    await createPoll(data)
    setShowForm(false)
  }, [createPoll])

  const { active: activePolls, closed: closedPolls } = splitPolls(polls)

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--border-primary)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'collab-poll-spin 0.7s linear infinite' }} />
        <style>{`@keyframes collab-poll-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: FONT }}>
      {/* Header */}
      <CollabPanelHead
        icon={BarChart3}
        title={t('collab.polls.title')}
        count={polls.length}
        actions={canEdit && (
          <button type="button" onClick={() => setShowForm(true)} className={HEAD_ACTION}>
            <Plus size={12} /> {t('collab.polls.new')}
          </button>
        )}
      />

      {/* Content */}
      <div className="chat-scroll" style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {polls.length === 0 ? (
          <EmptyState scene="polls" title={t('collab.polls.empty')} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activePolls.length > 0 && activePolls.map(poll => (
              <PollCard key={poll.id} poll={poll} currentUser={currentUser} canEdit={canEdit} onVote={handleVote} onClose={handleClose} onDelete={handleDelete} t={t} />
            ))}
            {closedPolls.length > 0 && (
              <>
                {activePolls.length > 0 && (
                  <div className="px-1 pb-0.5 pt-2 font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
                    {t('collab.polls.closedSection')}
                  </div>
                )}
                {closedPolls.map(poll => (
                  <PollCard key={poll.id} poll={poll} currentUser={currentUser} canEdit={canEdit} onVote={handleVote} onClose={handleClose} onDelete={handleDelete} t={t} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && <CreatePollModal onClose={() => setShowForm(false)} onCreate={handleCreate} t={t} />}
    </div>
  )
}
