import type { ReactNode } from 'react';

import { useTranslation } from '../../../../i18n';
import { useAssistantView } from '../../assistantViewContext';
import type { EntityTarget } from '../cardTypes';

/**
 * The rows of an answer card, like the planner's day list: a lead in front,
 * the name in bold, an aside at the end (an amount, a time) and its facts on
 * the line under it. A row that leads somewhere is a button; resting on it
 * can light its spot on the map. What a card leaves out is counted at the end
 * as a way to where it all lives, never unfolded in the chat.
 */

export function CardRows({ children }: { children: ReactNode }) {
  return <ul className="m-0 flex list-none flex-col p-0">{children}</ul>;
}

export function CardRow({
  lead,
  title,
  aside,
  facts,
  onActivate,
  onHover,
  lit = false,
}: {
  lead?: ReactNode;
  title: ReactNode;
  aside?: ReactNode;
  facts?: ReactNode;
  onActivate?: () => void;
  onHover?: (on: boolean) => void;
  lit?: boolean;
}) {
  const { variant } = useAssistantView();
  const look = `-mx-1.5 flex w-full gap-2.5 rounded-[12px] px-1.5 py-2 text-start transition-colors hover:bg-surface-hover ${
    variant === 'fullscreen' ? 'min-h-11' : ''
  } ${lit ? 'bg-surface-hover' : ''}`;
  const body = (
    <>
      {lead}
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold leading-tight text-content">{title}</span>
        {facts}
      </span>
      {aside && <span className="flex-none text-caption tabular-nums text-content-secondary">{aside}</span>}
    </>
  );
  const hover = onHover
    ? {
        onMouseEnter: () => onHover(true),
        onMouseLeave: () => onHover(false),
        onFocus: () => onHover(true),
        onBlur: () => onHover(false),
      }
    : {};
  return (
    <li>
      {onActivate ? (
        <button type="button" onClick={onActivate} className={look} {...hover}>
          {body}
        </button>
      ) : (
        <div className={look} {...hover}>
          {body}
        </div>
      )}
    </li>
  );
}

/** "3 more" at the end of a card: a text button to where the rest lives, or plain words where nothing can open it. */
export function CardMore({ count, labelKey, target }: { count: number; labelKey?: string; target: EntityTarget }) {
  const { t } = useTranslation();
  const { onOpen } = useAssistantView();
  if (count <= 0) return null;
  const label = labelKey ? t(labelKey, { count }) : t('assistant.card.common.more', { count });
  if (!onOpen) return <p className="m-0 px-1.5 py-1 text-caption text-content-muted">{label}</p>;
  return (
    <button
      type="button"
      onClick={() => onOpen(target)}
      className="rounded-lg px-1.5 py-1 text-caption font-medium text-content-muted transition-colors hover:bg-surface-hover hover:text-content"
    >
      {label}
    </button>
  );
}
