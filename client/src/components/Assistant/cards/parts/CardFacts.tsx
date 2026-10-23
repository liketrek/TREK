import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import { type PillTone, SoftPill } from '../../../Planner/planParts';

/**
 * The facts a card states in one wrapped line of small white badges, the way
 * the planner's rows do: a fact with its glyph, a value that changes from old
 * to new, what a change does to a row, and what no longer belongs to it.
 */

export function CardFacts({ children }: { children: ReactNode }) {
  return <span className="mt-1 flex flex-wrap items-center gap-1">{children}</span>;
}

/** A value that changes: the old one struck through, an arrow, the new one. Without `before`, only the value. */
export function FactChange({
  icon: Icon,
  before,
  after,
  tone = 'neutral',
}: {
  icon: LucideIcon;
  before: string | null;
  after: string;
  tone?: PillTone;
}) {
  return (
    <SoftPill
      tone={tone}
      className="max-w-full tabular-nums"
      icon={
        <Icon
          size={10}
          strokeWidth={2.2}
          aria-hidden="true"
          className={tone === 'neutral' ? 'flex-none text-content-faint' : 'flex-none'}
        />
      }
    >
      {before !== null && (
        <>
          <bdi className="truncate text-content-faint line-through">{before}</bdi>
          <ArrowRight size={9} aria-hidden="true" className="flex-none text-content-faint rtl:-scale-x-100" />
        </>
      )}
      <bdi className="truncate">{after}</bdi>
    </SoftPill>
  );
}

/** One fact with its glyph. */
export function Fact({ icon, tone, label }: { icon: LucideIcon; tone?: PillTone; label: string }) {
  return <FactChange icon={icon} tone={tone} before={null} after={label} />;
}

/** What a change does to a row of a card. A table, so each word is named where it is read. */
const CHANGE_MARK = {
  new: { labelKey: 'assistant.card.common.new', tone: 'success' },
  removed: { labelKey: 'assistant.card.common.removed', tone: 'danger' },
  changed: { labelKey: 'assistant.card.common.changed', tone: 'info' },
  willDelete: { labelKey: 'assistant.card.common.willDelete', tone: 'danger' },
} as const satisfies Record<string, { labelKey: string; tone: PillTone }>;

/** The mark of a row a change touches; nothing for a row it leaves alone (`none`, an answer's rows). */
export function ChangeMark({ change }: { change: keyof typeof CHANGE_MARK | 'none' }) {
  const { t } = useTranslation();
  if (change === 'none') return null;
  const mark = CHANGE_MARK[change];
  return <SoftPill tone={mark.tone}>{t(mark.labelKey)}</SoftPill>;
}

/** The names a change takes off a row (people, places), in one line. */
export function NoLonger({ names }: { names: readonly string[] }) {
  const { t } = useTranslation();
  if (names.length === 0) return null;
  return (
    <span className="text-caption text-content-muted">
      <bdi>{t('assistant.card.common.noLonger', { names: names.join(', ') })}</bdi>
    </span>
  );
}
