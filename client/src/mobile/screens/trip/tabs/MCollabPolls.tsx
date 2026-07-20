import { useCallback, useEffect, useState } from 'react'
import { BarChart3, Check, Clock, Lock, Plus, Trash2, X } from 'lucide-react'
import MDancingTrek from '../../../components/MDancingTrek'
import { collabApi } from '../../../../api/client'
import { addListener, removeListener } from '../../../../api/websocket'
import { useAuthStore } from '../../../../store/authStore'
import ToggleSwitch from '../../../../components/Settings/ToggleSwitch'
import MSheet from '../../../components/MSheet'
import { Eyebrow, FIELD_CLS, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome'
import MConfirmSheet from '../../settings/MConfirmSheet'
import type { TripPlanner } from '../MTripShell'
import { CountPill, SectionHeader, TabScroller } from './tabChrome'
import {
  formatPollCountdown,
  hasUserVoted,
  isPollActive,
  pollMaxVoteCount,
  splitPolls,
  totalPollVotes,
  type CollabPollData,
} from './collabModel'

interface MCollabPollsProps {
  planner: TripPlanner
}

interface GetPollsResponse { polls: CollabPollData[] }
interface PollResponse { poll: CollabPollData }

interface PollFormSubmitData {
  question: string
  options: string[]
  multipleChoice: boolean
  deadline: string | null
}

/**
 * Trip-tab Collab / Polls. Same self-contained architecture as
 * MCollabChat/MCollabNotes (own state, own `collabApi` calls, own WebSocket
 * listener — 10-tab-databindings.md §8.5). The demo only has a placeholder,
 * so question/options/results/deadline/close/delete below is a new design in
 * the established mobile visual language, not a port of desktop markup.
 */
export default function MCollabPolls({ planner }: MCollabPollsProps) {
  const { t, tripId, toast } = planner
  const { user } = useAuthStore()
  const canEdit = planner.can('collab_edit', planner.trip)
  const currentUserId = user?.id ?? null

  const [polls, setPolls] = useState<CollabPollData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const [collapsedClosed, setCollapsedClosed] = useState(false)
  const [, setTick] = useState(0)

  // ── Load ──
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    collabApi.getPolls(tripId).then((data: GetPollsResponse) => {
      if (!cancelled) setPolls(data.polls || [])
    }).catch(() => { /* leave polls empty */ }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tripId])

  // ── WebSocket (own listener, not handleRemoteEvent) ──
  useEffect(() => {
    const handler = (event: Record<string, unknown>) => {
      if (String(event.tripId) !== String(tripId)) return
      if (event.type === 'collab:poll:created') {
        const poll = event.poll as CollabPollData
        setPolls(prev => (prev.some(p => p.id === poll.id) ? prev : [poll, ...prev]))
      }
      if (event.type === 'collab:poll:voted' || event.type === 'collab:poll:closed') {
        const poll = event.poll as CollabPollData
        setPolls(prev => prev.map(p => (p.id === poll.id ? poll : p)))
      }
      if (event.type === 'collab:poll:deleted') {
        const pollId = event.pollId as number
        setPolls(prev => prev.filter(p => p.id !== pollId))
      }
    }
    addListener(handler)
    return () => removeListener(handler)
  }, [tripId])

  // ── Deadline countdown ticker — re-render every 30s so formatPollCountdown recomputes ──
  useEffect(() => {
    if (!polls.some(p => p.deadline && isPollActive(p))) return
    const iv = setInterval(() => setTick(v => v + 1), 30000)
    return () => clearInterval(iv)
  }, [polls])

  const handleCreate = useCallback(async (data: PollFormSubmitData) => {
    try {
      const res = (await collabApi.createPoll(tripId, {
        question: data.question,
        options: data.options,
        // Server reads `data.multiple || data.multiple_choice` (collabService.ts) —
        // both are sent so either shape lands correctly.
        multiple: data.multipleChoice,
        multiple_choice: data.multipleChoice,
        deadline: data.deadline || undefined,
      })) as PollResponse
      setPolls(prev => (prev.some(p => p.id === res.poll.id) ? prev : [res.poll, ...prev]))
    } catch {
      toast.error(t('common.error'))
      throw new Error('create failed')
    }
  }, [tripId, toast, t])

  const handleVote = useCallback(async (pollId: number, optionIndex: number) => {
    try {
      const res = (await collabApi.votePoll(tripId, pollId, optionIndex)) as PollResponse
      setPolls(prev => prev.map(p => (p.id === res.poll.id ? res.poll : p)))
    } catch {
      toast.error(t('common.error'))
    }
  }, [tripId, toast, t])

  const handleClosePoll = useCallback(async (pollId: number) => {
    try {
      const res = (await collabApi.closePoll(tripId, pollId)) as PollResponse
      setPolls(prev => prev.map(p => (p.id === pollId ? res.poll : p)))
    } catch {
      toast.error(t('common.error'))
    }
  }, [tripId, toast, t])

  const handleDelete = useCallback(async (pollId: number) => {
    try {
      await collabApi.deletePoll(tripId, pollId)
      setPolls(prev => prev.filter(p => p.id !== pollId))
    } catch {
      toast.error(t('common.error'))
    }
  }, [tripId, toast, t])

  if (loading) {
    return (
      <TabScroller>
        <div className="flex flex-col items-center px-8 pt-16 text-center">
          <MDancingTrek size={84} className="mb-1" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('common.loading')}</p>
        </div>
      </TabScroller>
    )
  }

  const { active, closed } = splitPolls(polls)

  return (
    <TabScroller>
      <div className="flex items-center justify-end">
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex flex-none items-center gap-[5px] whitespace-nowrap rounded-full bg-m-act px-[15px] py-[8px] font-geist text-[0.75rem] font-bold text-m-actfg"
          >
            <Plus size={13} strokeWidth={2.4} />
            {t('collab.polls.new')}
          </button>
        )}
      </div>

      {polls.length === 0 ? (
        <div className="flex min-h-full flex-1 flex-col items-center justify-center px-8 py-10 text-center">
          <MDancingTrek scene="polls" className="mb-2" />
          <p className="font-geist text-[0.8125rem] font-medium text-m-muted">{t('collab.polls.empty')}</p>
        </div>
      ) : (
        <>
          {active.map(poll => (
            <PollCardRow
              key={poll.id}
              poll={poll}
              canEdit={canEdit}
              currentUserId={currentUserId}
              t={t}
              onVote={handleVote}
              onClosePoll={handleClosePoll}
              onDelete={() => setPendingDeleteId(poll.id)}
            />
          ))}

          {closed.length > 0 && (
            <div>
              {active.length > 0 && (
                <SectionHeader
                  label={t('collab.polls.closedSection')}
                  count={<CountPill>{closed.length}</CountPill>}
                  open={!collapsedClosed}
                  onToggle={() => setCollapsedClosed(v => !v)}
                />
              )}
              {!collapsedClosed && closed.map(poll => (
                <PollCardRow
                  key={poll.id}
                  poll={poll}
                  canEdit={canEdit}
                  currentUserId={currentUserId}
                  t={t}
                  onVote={handleVote}
                  onClosePoll={handleClosePoll}
                  onDelete={() => setPendingDeleteId(poll.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <PollFormSheet open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} t={t} />

      <MConfirmSheet
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        title={t('collab.polls.confirmDeleteTitle')}
        message={t('collab.polls.confirmDeleteBody')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={() => {
          if (pendingDeleteId !== null) handleDelete(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </TabScroller>
  )
}

/* ------------------------------------------------------------------ */

function PollCardRow({ poll, canEdit, currentUserId, t, onVote, onClosePoll, onDelete }: {
  poll: CollabPollData
  canEdit: boolean
  currentUserId: number | null
  t: TripPlanner['t']
  onVote: (pollId: number, optionIndex: number) => void
  onClosePoll: (pollId: number) => void
  onDelete: () => void
}) {
  const total = totalPollVotes(poll)
  const closed = !isPollActive(poll)
  const countdown = closed ? null : formatPollCountdown(poll.deadline, t)
  const voted = currentUserId != null && hasUserVoted(poll, currentUserId)
  const maxCount = pollMaxVoteCount(poll)

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
      <div className="flex items-start gap-2 px-3 py-[10px]" style={closed ? { background: 'var(--m-card)' } : undefined}>
        <div className="min-w-0 flex-1">
          <div className="text-[0.8125rem] font-bold leading-[1.35] text-m-ink">{poll.question}</div>
          <div className="mt-[5px] flex flex-wrap items-center gap-[6px]">
            {closed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.02em] text-m-faint">
                <Lock size={9} strokeWidth={2.4} /> {t('collab.polls.closed')}
              </span>
            ) : countdown ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(232,161,58,.16)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.02em] text-[color:var(--m-st-pending)]">
                <Clock size={9} strokeWidth={2.4} /> {countdown}
              </span>
            ) : null}
            {poll.multiple_choice && (
              <span className="rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold uppercase tracking-[.02em] text-m-faint">
                {t('collab.polls.multiChoice')}
              </span>
            )}
            <span className="font-geist text-[0.625rem] text-m-faint">
              {t(total === 1 ? 'collab.polls.vote' : 'collab.polls.votes', { n: total })}
            </span>
          </div>
        </div>
        {canEdit && (
          <div className="flex flex-none gap-[4px]">
            {!closed && (
              <button
                type="button"
                onClick={() => onClosePoll(poll.id)}
                aria-label={t('collab.polls.close')}
                className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
              >
                <Lock size={12} strokeWidth={2} />
              </button>
            )}
            <button
              type="button"
              onClick={onDelete}
              aria-label={t('collab.polls.delete')}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-muted"
            >
              <Trash2 size={12} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-[6px] px-3 pb-3 pt-[2px]">
        {poll.options.map((opt, idx) => {
          const count = opt.voters?.length || 0
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          const myVote = currentUserId != null && (opt.voters || []).some(v => String(v.user_id) === String(currentUserId))
          const isWinner = closed && count > 0 && count === maxCount
          const fillTint = myVote
            ? 'color-mix(in srgb, var(--m-act) 16%, transparent)'
            : isWinner
              ? 'color-mix(in srgb, var(--m-st-confirmed) 16%, transparent)'
              : 'color-mix(in srgb, var(--m-ink) 6%, transparent)'

          return (
            <button
              key={idx}
              type="button"
              disabled={closed || !canEdit}
              onClick={() => onVote(poll.id, idx)}
              className="relative flex items-center gap-[8px] overflow-hidden rounded-[10px] bg-m-card px-[12px] py-[10px] text-left disabled:cursor-default"
            >
              <span className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: fillTint }} />
              <span
                className={`relative flex h-5 w-5 flex-none items-center justify-center border-2 ${
                  poll.multiple_choice ? 'rounded-[6px]' : 'rounded-full'
                }`}
                style={{ borderColor: myVote ? 'var(--m-act)' : 'var(--m-rowbr)', background: myVote ? 'var(--m-act)' : 'transparent' }}
              >
                {myVote && <Check size={11} strokeWidth={3} className="text-m-actfg" />}
              </span>
              <span className={`relative min-w-0 flex-1 truncate text-[0.8125rem] ${myVote || isWinner ? 'font-bold' : 'font-medium'} text-m-ink`}>
                {opt.text}
              </span>
              {(voted || closed) && count > 0 && (
                <span className="relative flex flex-none -space-x-1">
                  {(opt.voters || []).slice(0, 3).map(v => (
                    <span
                      key={v.user_id}
                      className="flex h-[18px] w-[18px] items-center justify-center overflow-hidden rounded-full border-2 border-[color:var(--m-ic)] bg-[color:var(--m-card)] font-geist text-[0.5rem] font-bold text-m-muted"
                    >
                      {v.avatar_url ? (
                        <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (v.username || '?')[0]?.toUpperCase() || '?'
                      )}
                    </span>
                  ))}
                </span>
              )}
              {(voted || closed) && (
                <span className="relative flex-none font-geist text-[0.75rem] font-bold text-m-muted">{pct}%</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PollFormSheet({ open, onClose, onSubmit, t }: {
  open: boolean
  onClose: () => void
  onSubmit: (data: PollFormSubmitData) => Promise<void>
  t: TripPlanner['t']
}) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multipleChoice, setMultipleChoice] = useState(false)
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setQuestion('')
    setOptions(['', ''])
    setMultipleChoice(false)
    setDeadline('')
  }, [open])

  const trimmedOptions = options.map(o => o.trim()).filter(Boolean)
  const canSubmit = question.trim().length > 0 && trimmedOptions.length >= 2 && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({
        question: question.trim(),
        options: trimmedOptions,
        multipleChoice,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      })
      onClose()
    } catch {
      // onSubmit already surfaced a toast
    } finally {
      setSubmitting(false)
    }
  }

  const minDeadline = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={t('collab.polls.new')}>
      <FormSheetHeader icon={BarChart3} title={t('collab.polls.new')} onClose={onClose} closeLabel={t('common.close')} />

      <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-[6px] pt-1">
        <Eyebrow className="mb-[5px] uppercase">{t('collab.polls.question')} *</Eyebrow>
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          maxLength={300}
          placeholder={t('collab.polls.questionPlaceholder')}
          className={FIELD_CLS}
        />

        <Eyebrow className="mb-[6px] mt-3 uppercase">{t('collab.polls.options')}</Eyebrow>
        <div className="flex flex-col gap-[6px]">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-[6px]">
              <input
                type="text"
                value={opt}
                onChange={e => setOptions(prev => prev.map((o, j) => (j === i ? e.target.value : o)))}
                placeholder={t('collab.polls.optionPlaceholder', { n: i + 1 })}
                maxLength={200}
                className={FIELD_CLS}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions(prev => prev.filter((_, j) => j !== i))}
                  aria-label={t('common.delete')}
                  className="flex-none text-m-faint"
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions(prev => [...prev, ''])}
            className="flex items-center gap-1 rounded-[10px] border border-dashed border-[color:var(--m-rowbr)] px-3 py-[7px] font-geist text-[0.75rem] font-bold text-m-faint"
          >
            <Plus size={12} strokeWidth={2.4} /> {t('collab.polls.addOption')}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[10px]">
          <span className="text-[0.8125rem] font-semibold text-m-ink">{t('collab.polls.multiChoice')}</span>
          <ToggleSwitch on={multipleChoice} onToggle={() => setMultipleChoice(v => !v)} label={t('collab.polls.multiChoice')} />
        </div>

        <Eyebrow className="mb-[5px] mt-3 uppercase">{t('collab.polls.deadline')}</Eyebrow>
        <div className="flex items-center gap-[6px]">
          <input
            type="datetime-local"
            value={deadline}
            min={minDeadline}
            onChange={e => setDeadline(e.target.value)}
            className={`${FIELD_CLS} flex-1`}
          />
          {deadline && (
            <button
              type="button"
              onClick={() => setDeadline('')}
              aria-label={t('collab.polls.clearDeadline')}
              className="flex-none text-m-faint"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>

      <FormSheetFooter
        onCancel={onClose}
        cancelLabel={t('common.cancel')}
        onSubmit={handleSubmit}
        submitLabel={t('collab.polls.create')}
        submitDisabled={!canSubmit}
      />
    </MSheet>
  )
}
