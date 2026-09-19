import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from '../../../i18n/TranslationContext'
import { DOCUMENT_PROVIDER_ICONS } from '../../shared/DocumentProviderIcons'
import TrekIcon from '../../shared/TrekIcon'
import { Badge } from './DocSyncBits'

export type SyncDirection = 'both' | 'pull' | 'push'

export interface FlowHoldings {
  /** Documents this trip has in TREK. */
  inTrek: number
  /** How many of them the store is holding. */
  atProvider: number
  paired: number
  missing: number
}

/**
 * The direction control, drawn as what it actually is.
 *
 * A document sync has one characteristic picture (two places and things moving
 * between them), and a dropdown reading "Both ways" hides it behind a word.
 * Here the two ends carry what each side is holding, the lanes between them
 * carry the direction, and switching direction means switching a lane off. It
 * is the one loud element in the dialog; everything around it stays quiet.
 *
 * The numbers are standing counts, not the last run's transfers: a binding that
 * is already in step transferred nothing, and a panel answering "0" on a
 * healthy connection says nothing at the moment somebody looks at it.
 */
export default function DocSyncFlow({
  direction,
  providerId,
  providerName,
  holdings,
  running,
  disabled,
  onChange,
}: {
  direction: SyncDirection
  providerId: string
  providerName: string
  holdings: FlowHoldings
  /** A run is in flight: the active lanes move while it is. */
  running?: boolean
  disabled?: boolean
  onChange: (next: SyncDirection) => void
}) {
  const { t } = useTranslation()
  const Icon = DOCUMENT_PROVIDER_ICONS[providerId]
  const pushOn = direction === 'both' || direction === 'push'
  const pullOn = direction === 'both' || direction === 'pull'

  const hint = disabled
    ? t(`docsync.flow.summary.${direction}`, { provider: providerName })
    : t(`docsync.flow.summaryEditable.${direction}`, { provider: providerName })

  /** Turning a lane off leaves the other one; turning the last one off is refused. */
  const toggle = (lane: 'push' | 'pull') => {
    if (disabled) return
    const nextPush = lane === 'push' ? !pushOn : pushOn
    const nextPull = lane === 'pull' ? !pullOn : pullOn
    if (!nextPush && !nextPull) return
    onChange(nextPush && nextPull ? 'both' : nextPush ? 'push' : 'pull')
  }

  return (
    <section className="rounded-2xl border border-edge bg-surface-secondary p-4 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-5">
        <End
          name={t('docsync.flow.trek')}
          count={holdings.inTrek}
          glyph={<TrekIcon className="h-6 w-6 text-content" />}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <Lane
            active={pushOn}
            running={running}
            disabled={disabled}
            caption={t('docsync.flow.toProvider')}
            onClick={() => toggle('push')}
          >
            <ArrowRight size={13} strokeWidth={2.75} />
          </Lane>
          <Lane
            active={pullOn}
            running={running}
            reverse
            disabled={disabled}
            caption={t('docsync.flow.toTrek')}
            onClick={() => toggle('pull')}
          >
            <ArrowLeft size={13} strokeWidth={2.75} />
          </Lane>

          {/* Under the lanes rather than under the whole bar: it explains what
              the two buttons above it are doing, and sitting anywhere else
              makes the reader look for what it refers to. */}
          <p className="truncate px-1 text-center text-caption text-content-muted">{hint}</p>
        </div>

        <End
          name={providerName}
          count={holdings.atProvider}
          glyph={Icon ? <Icon className="h-6 w-6 text-content" /> : null}
        />
      </div>
    </section>
  )
}

/**
 * One end of the flow: the mark, the count, the name.
 *
 * The count is the largest thing in the box on purpose: "is my stuff over
 * there" is the question that makes somebody open this dialog, and it should be
 * answered before they read a word.
 */
function End({ name, count, glyph }: { name: string; count: number; glyph: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div
      className="flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl border border-edge bg-surface px-3 py-4 shadow-card sm:w-32"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-secondary">{glyph}</span>

      <span className="flex flex-col items-center gap-1">
        <span className="text-title font-semibold tabular-nums leading-none text-content">{count}</span>
        <span className="text-caption uppercase leading-none tracking-wide text-content-faint">
          {t('docsync.flow.documents')}
        </span>
      </span>

      <Badge tone="neutral" title={name}>
        <span className="max-w-[6.5rem] truncate">{name}</span>
      </Badge>
    </div>
  )
}

/**
 * One direction, as a track that is either carrying or idle.
 *
 * An idle track stays visible as a dashed line, so switching a direction off
 * reads as a road nobody drives on rather than as something that disappeared.
 */
function Lane({
  active,
  running,
  disabled,
  caption,
  reverse,
  onClick,
  children,
}: {
  active: boolean
  running?: boolean
  disabled?: boolean
  caption: string
  reverse?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const moving = active && running
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        // No border at all, not a transparent one: a border box across the
        // diagonals still renders a hairline where it meets the corner radius,
        // and that line reads as a broken frame rather than as a hatch.
        'group relative flex h-12 items-center gap-3 overflow-hidden rounded-xl px-3 text-caption transition-all duration-200',
        reverse ? 'flex-row-reverse' : '',
        active
          ? 'bg-accent-subtle text-accent-on'
          : 'trek-docsync-lane-off bg-surface text-content-faint',
        disabled ? 'cursor-default' : active ? 'hover:brightness-[0.98]' : 'hover:text-content-muted',
      ].join(' ')}
    >
      <span
        className={[
          'relative grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-transform duration-200',
          active ? 'bg-surface shadow-sm' : 'bg-surface-secondary',
          disabled ? '' : reverse ? 'group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5',
        ].join(' ')}
      >
        {children}
      </span>

      {/* Explicitly aligned to the arrow's side: the dialog inherits a centred
          text-align, which would otherwise float the label away from it. */}
      <span className={`relative min-w-0 flex-1 truncate font-medium ${reverse ? 'text-right' : 'text-left'}`}>
        {caption}
      </span>

      {/* Only while a run is in flight. An idle lane needs no track (that it is
          on or off is already in its fill), and a permanent line just asks the
          reader what it means. */}
      {moving && (
        <span
          aria-hidden
          className={`trek-docsync-lane-run pointer-events-none absolute inset-x-3 bottom-1.5 h-0.5 rounded-full ${
            reverse ? 'trek-docsync-lane-run-rev' : ''
          }`}
        />
      )}
    </button>
  )
}
