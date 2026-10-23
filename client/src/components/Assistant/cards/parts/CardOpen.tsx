import { ArrowUpRight } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import { Tooltip } from '../../../shared/Tooltip';
import { useAssistantView } from '../../assistantViewContext';
import type { EntityTarget } from '../cardTypes';

/**
 * The ways out of a card into TREK: "Open" to where the card's things live,
 * and a day to show in the plan. Both go through the shell's one way of
 * opening things, and neither shows where the shell cannot open anything.
 */

/** "Open" (or the card's own words) as a quiet text button; taller on the phone. */
export function CardOpenButton({ target, labelKey }: { target: EntityTarget; labelKey?: string }) {
  const { t } = useTranslation();
  const { variant, onOpen } = useAssistantView();
  if (!onOpen) return null;
  return (
    <button
      type="button"
      onClick={() => onOpen(target)}
      className={`inline-flex flex-none items-center gap-1 rounded-full px-2 text-caption text-content-secondary transition-colors hover:bg-surface-hover hover:text-content ${
        variant === 'fullscreen' ? 'h-10' : 'h-7'
      }`}
    >
      {labelKey ? t(labelKey) : t('assistant.card.common.open')}
      <ArrowUpRight size={12} aria-hidden="true" className="rtl:-scale-x-100" />
    </button>
  );
}

/** A day named on a card, as a button that shows it in the plan. */
export function CardDayButton({ dayId, label }: { dayId: number; label: string }) {
  const { t } = useTranslation();
  const { onOpen } = useAssistantView();
  if (!onOpen) return <bdi className="text-caption text-content-secondary">{label}</bdi>;
  const hint = t('assistant.card.common.showDay');
  return (
    <Tooltip label={hint} placement="top">
      <button
        type="button"
        onClick={() => onOpen({ kind: 'map', placeId: null, dayId })}
        aria-label={`${label}: ${hint}`}
        className="rounded-full px-1 text-caption text-content-secondary underline-offset-2 hover:text-content hover:underline"
      >
        <bdi>{label}</bdi>
      </button>
    </Tooltip>
  );
}
