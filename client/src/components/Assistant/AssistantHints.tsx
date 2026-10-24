import { BedDouble, Clock, type LucideIcon, MapPin, Ticket, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useNetworkMode } from '../../hooks/useNetworkMode';
import { useTranslation } from '../../i18n';
import Tooltip from '../shared/Tooltip';
import type { HintRule } from './assistantHintRules';
import type { AssistantHintsView, ReadyHint } from './useAssistantHints';

/** Rows shown before "n more", so the suggestions under them stay in view. */
export const MAX_VISIBLE_HINTS = 3;

/** Warnings all carry the one triangle; a note says what it is about. */
const NOTE_ICONS: Partial<Record<HintRule, LucideIcon>> = {
  gap: Clock,
  longLeg: MapPin,
  noStay: BedDouble,
  unplacedBooking: Ticket,
};

/**
 * The plan hints in the empty chat: a short, quiet list, at most three rows
 * with the rest behind "n more". A row is the button: it puts its day or
 * places in focus and asks its question. Each can be waved away. On the
 * desktop the X shows on hover or focus, on the phone always, with room for
 * a thumb. Shown means seen, so the launcher stops pointing at them.
 */
export default function AssistantHints({ view, phone }: { view: AssistantHintsView; phone: boolean }) {
  const { t } = useTranslation();
  const { offline } = useNetworkMode();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? view.hints : view.hints.slice(0, MAX_VISIBLE_HINTS);
  const rest = view.hints.length - shown.length;
  const shownIds = shown.map((h) => h.id).join('\n');
  const { markSeen } = view;

  useEffect(() => {
    if (shownIds) markSeen(shownIds.split('\n'));
  }, [shownIds, markSeen]);

  if (view.hints.length === 0) return null;
  return (
    <section aria-label={t('assistant.hint.title')} className="flex w-full max-w-sm flex-col gap-1.5">
      <h3 className="m-0 px-1 text-caption font-medium text-content-muted">{t('assistant.hint.title')}</h3>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {shown.map((hint) => (
          <HintRow key={hint.id} hint={hint} phone={phone} disabled={offline} view={view} />
        ))}
      </ul>
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`self-start rounded-lg px-1 text-caption text-content-muted hover:text-content ${phone ? 'min-h-[44px]' : 'py-1'}`}
        >
          {t('assistant.hint.more', { count: rest })}
        </button>
      )}
    </section>
  );
}

function HintRow({
  hint,
  phone,
  disabled,
  view,
}: {
  hint: ReadyHint;
  phone: boolean;
  disabled: boolean;
  view: AssistantHintsView;
}) {
  const { t } = useTranslation();
  const warn = hint.level === 'warn';
  const Icon = warn ? TriangleAlert : (NOTE_ICONS[hint.rule] ?? Clock);
  const dismissLabel = t('assistant.hint.dismiss');
  return (
    <li className="group relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => view.ask(hint)}
        className={`flex w-full items-start gap-2 rounded-xl border border-edge-faint bg-surface-card py-2 ps-3 text-start text-body text-content transition-colors hover:border-edge hover:bg-surface-hover disabled:cursor-default disabled:opacity-60 disabled:hover:border-edge-faint disabled:hover:bg-surface-card ${
          phone ? 'min-h-[44px] pe-11' : 'pe-9'
        }`}
      >
        <Icon
          size={14}
          aria-hidden="true"
          className={`mt-[3px] flex-shrink-0 ${warn ? 'text-content-secondary' : 'text-content-muted'}`}
        />
        <span dir="auto" className="line-clamp-2 min-w-0 flex-1">
          {hint.text}
        </span>
      </button>
      {/* Hidden until hover only where there is hover: a touch screen at window size shows it always. */}
      <Tooltip label={dismissLabel}>
        <button
          type="button"
          onClick={() => view.dismiss(hint.id)}
          aria-label={dismissLabel}
          className={`absolute grid place-items-center rounded-lg text-content-faint transition-opacity hover:bg-surface-hover hover:text-content ${
            phone
              ? 'end-0.5 top-0.5 h-10 w-10'
              : 'end-1 top-1 h-7 w-7 focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:hover)]:opacity-0'
          }`}
        >
          <X size={13} aria-hidden="true" />
        </button>
      </Tooltip>
    </li>
  );
}
