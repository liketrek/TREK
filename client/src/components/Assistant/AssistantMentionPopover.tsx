import {
  ComposerPrimitive,
  type TriggerAdapter,
  type TriggerItem,
  unstable_useTriggerPopoverScopeContext as useTriggerScope,
} from '@assistant-ui/react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Ticket } from 'lucide-react';
import { type MouseEvent, useEffect, useRef } from 'react';

import { useTranslation } from '../../i18n';
import { MENTION_FORMATTER, MENTION_KINDS, type MentionKind } from './assistantMentionModel';
import { useAssistantView } from './assistantViewContext';

/** The icon of a day, place or booking in the `@` list. */
function MentionKindIcon({ kind, size }: { kind: string; size: number }) {
  const props = { size, 'aria-hidden': true, className: 'flex-shrink-0' } as const;
  if (kind === 'day') return <CalendarDays {...props} />;
  if (kind === 'reservation') return <Ticket {...props} />;
  return <MapPin {...props} />;
}

/** A row takes the click without the focus, so the caret stays in the text and typing goes on. */
const keepFocus = (e: MouseEvent) => e.preventDefault();

/**
 * The list `@` opens over the composer: first the kinds (days, places,
 * bookings), and once letters follow the `@`, the entries that match across
 * all of them. The focus never leaves the text; arrows walk the list, Enter
 * or Tab picks, Escape closes it and keeps what was typed.
 */
export default function AssistantMentionPopover({
  adapter,
  onInserted,
}: {
  /** Undefined while the trip's lists are not at hand; `@` then opens nothing. */
  adapter: TriggerAdapter | undefined;
  onInserted: (item: TriggerItem) => void;
}) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const phone = variant === 'fullscreen';
  return (
    <ComposerPrimitive.TriggerPopover
      char="@"
      adapter={adapter}
      aria-label={t('assistant.mention.hint')}
      className={`absolute bottom-full end-0 start-0 z-30 mb-1.5 overflow-y-auto rounded-xl border border-edge-faint bg-surface-card p-1 shadow-dropdown ${phone ? 'max-h-[40vh]' : 'max-h-56'}`}
    >
      <ComposerPrimitive.TriggerPopover.Directive formatter={MENTION_FORMATTER} onInserted={onInserted} />
      <MentionList row={phone ? 'min-h-[44px]' : 'min-h-[32px]'} />
    </ComposerPrimitive.TriggerPopover>
  );
}

const ROW =
  'flex w-full items-center gap-2 rounded-lg px-2 text-start text-body text-content transition-colors hover:bg-surface-hover data-[highlighted]:bg-surface-hover';

function MentionList({ row }: { row: string }) {
  const { t } = useTranslation();
  const scope = useTriggerScope();
  const listRef = useRef<HTMLDivElement>(null);

  // The highlighted row stays in view while the arrows walk past the list's edge.
  useEffect(() => {
    const hot = listRef.current?.querySelector<HTMLElement>('[data-highlighted]');
    hot?.scrollIntoView?.({ block: 'nearest' });
  }, [scope.highlightedIndex, scope.items, scope.activeCategoryId]);

  if (!scope.open) return null;
  const listing = scope.isSearchMode || scope.activeCategoryId !== null;
  const active = scope.activeCategoryId ? MENTION_KINDS[scope.activeCategoryId as MentionKind] : undefined;
  const heading = active ? t(active.labelKey) : null;

  return (
    <div ref={listRef}>
      {heading && (
        <ComposerPrimitive.TriggerPopoverBack
          onMouseDown={keepFocus}
          className="flex w-full items-center gap-1 rounded-lg px-1.5 py-1 text-caption font-semibold text-content-muted hover:text-content"
        >
          <ChevronLeft size={13} aria-hidden="true" className="rtl:-scale-x-100" />
          {heading}
        </ComposerPrimitive.TriggerPopoverBack>
      )}
      <ComposerPrimitive.TriggerPopoverCategories aria-label={t('assistant.mention.hint')}>
        {(categories) =>
          categories.map((c) => (
            <ComposerPrimitive.TriggerPopoverCategoryItem
              key={c.id}
              categoryId={c.id}
              onMouseDown={keepFocus}
              className={`${ROW} ${row}`}
            >
              <span className="flex text-content-muted">
                <MentionKindIcon kind={c.id} size={14} />
              </span>
              <span className="flex-1 truncate">{c.label}</span>
              <ChevronRight
                size={13}
                aria-hidden="true"
                className="flex-shrink-0 text-content-faint rtl:-scale-x-100"
              />
            </ComposerPrimitive.TriggerPopoverCategoryItem>
          ))
        }
      </ComposerPrimitive.TriggerPopoverCategories>
      <ComposerPrimitive.TriggerPopoverItems aria-label={heading ?? t('assistant.mention.hint')}>
        {(items) =>
          items.map((item, index) => (
            <ComposerPrimitive.TriggerPopoverItem
              key={item.id}
              item={item}
              index={index}
              onMouseDown={keepFocus}
              className={`${ROW} ${row}`}
            >
              <span className="flex text-content-muted">
                <MentionKindIcon kind={item.type} size={14} />
              </span>
              <bdi className="min-w-0 flex-1 truncate">{item.label}</bdi>
              {item.description && (
                <span className="flex-shrink-0 text-caption text-content-faint">{item.description}</span>
              )}
            </ComposerPrimitive.TriggerPopoverItem>
          ))
        }
      </ComposerPrimitive.TriggerPopoverItems>
      {listing && scope.items.length === 0 && (
        <p className="m-0 px-2 py-1.5 text-caption text-content-muted">{t('assistant.mention.none')}</p>
      )}
    </div>
  );
}
