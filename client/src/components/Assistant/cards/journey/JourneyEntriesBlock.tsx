import type { AssistantMessage, JourneyEntryLook } from '@trek/shared';
import { ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';

import { useTranslation } from '../../../../i18n';
import { DAY_COLORS } from '../../../Journey/dayColors';
import { cardTitle } from '../../../Journey/journeyCard';
import JourneyEntryCover from '../../../Journey/JourneyEntryCover';
import { LinkedJournalIcon } from '../../../Trips/LinkedJournalIcon';
import { useAssistantView } from '../../assistantViewContext';
import type { CardEntry } from '../cardTypes';
import CardFrame from '../parts/CardFrame';
import CardStrip from '../parts/CardStrip';
import { type JournalEntries, coverEntryOf, mergeJournalCards, titleSourceOf } from './journeyCardModel';
import { EntryMarks, EntryStory, EntryThumb, EntryWhen } from './JourneyEntryParts';
import { type EntryHover, entryHoverProps, useEntryHover } from './useEntryHover';
import { useJourneyOpen } from './useJourneyOpen';

/**
 * The entries an answer read from one journal. One or two stand as rows
 * under each other, with their photo, facts and the start of their text;
 * three or more run as a strip of the journal's own tiles, the ones the read
 * left out counted in a last tile. Either way the journal's name closes the
 * card with the way into it, and every entry opens where it is written.
 * Resting on an entry with a place, or tabbing to it, shows it on the plan's
 * map.
 */

const ROW = '-mx-1.5 flex gap-2.5 rounded-[12px] px-1.5 py-2 hover:bg-surface-hover';
const ROW_DIVIDED = '-mx-1.5 flex gap-2.5 rounded-[12px] border-t border-edge-faint px-1.5 py-2 hover:bg-surface-hover';
const TITLE = 'line-clamp-2 text-body font-semibold leading-tight text-content';
const TITLE_BUTTON =
  'block w-full rounded-md text-start outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent';
/** The phone's taller target, the title still at the top of the row. */
const TITLE_BUTTON_TALL = `${TITLE_BUTTON} min-h-10`;
const FOOTER = 'mt-1 flex items-center gap-2 border-t border-edge-faint pt-2 text-caption';
const FOOTER_TITLE = 'min-w-0 flex-1 truncate text-content-muted';
const FAINT = 'text-content-faint';
const OPEN = 'inline-flex flex-none items-center gap-1 font-medium text-accent hover:underline';
const OPEN_TALL = 'inline-flex h-10 flex-none items-center gap-1 font-medium text-accent hover:underline';
/** The size and corners of the journal's own tile, so the count stands in the row like one more entry. */
const MORE_TILE_BOX = 'flex h-[152px] w-[136px] flex-none items-center justify-center rounded-[18px]';
const MORE_TILE_LOOK =
  'border border-dashed border-edge px-3 text-center text-caption text-content-muted hover:bg-surface-hover';
const MORE_TILE = `${MORE_TILE_BOX} ${MORE_TILE_LOOK}`;
const TILE = 'flex-none snap-start';

type Open = ((entryId: number | null) => void) | null;

/** The journal's name and the way into it, under the card. */
function JournalFooter({ journal, open }: { journal: JournalEntries; open: Open }) {
  const { t } = useTranslation();
  const { variant } = useAssistantView();
  const title = journal.journalTitle ?? t('assistant.card.journey.label');
  const count = journal.entries.length + journal.more;
  return (
    <div className={FOOTER}>
      <LinkedJournalIcon size={12} className={FAINT} />
      <span title={title} className={FOOTER_TITLE}>
        <bdi>{title}</bdi>
        {count > 2 && <span className="ms-1.5 tabular-nums">{t('assistant.card.journey.entries', { count })}</span>}
      </span>
      {open && (
        <button type="button" onClick={() => open(null)} className={variant === 'fullscreen' ? OPEN_TALL : OPEN}>
          {t('assistant.card.journey.open')}
          <ArrowUpRight size={12} aria-hidden="true" className="rtl:-scale-x-100" />
        </button>
      )}
    </div>
  );
}

/** One entry as a row: its photo, its title (the way to it), its facts and the start of its text. */
function EntryRow({
  look,
  divided,
  open,
  hover,
}: {
  look: JourneyEntryLook;
  divided: boolean;
  open: Open;
  hover: EntryHover;
}) {
  const { t } = useTranslation();
  const { density, variant } = useAssistantView();
  const roomy = density === 'roomy';
  const title = <bdi className={TITLE}>{cardTitle(titleSourceOf(look), t)}</bdi>;
  return (
    <div className={divided ? ROW_DIVIDED : ROW} {...entryHoverProps(hover, look)}>
      <EntryThumb look={look} size={roomy ? 'lg' : 'md'} />
      <div className="min-w-0 flex-1">
        {open ? (
          <button
            type="button"
            onClick={() => open(look.entryId)}
            className={variant === 'fullscreen' ? TITLE_BUTTON_TALL : TITLE_BUTTON}
          >
            {title}
          </button>
        ) : (
          title
        )}
        <EntryWhen look={look} />
        <EntryMarks look={look} />
        <EntryStory look={look} roomy={roomy} />
      </div>
    </div>
  );
}

/** One or two entries, under each other. */
function JournalRows({ journal, fallbackRef }: { journal: JournalEntries; fallbackRef: string }) {
  const { t } = useTranslation();
  const open = useJourneyOpen(journal.journeyId, journal.tripJournal);
  const hover = useEntryHover(journal.journeyId, fallbackRef);
  return (
    <CardFrame label={t('assistant.card.journey.label')}>
      {journal.entries.map((look, index) => (
        <EntryRow key={look.entryId ?? `new-${index}`} look={look} divided={index > 0} open={open} hover={hover} />
      ))}
      <JournalFooter journal={journal} open={open} />
    </CardFrame>
  );
}

/** Three or more entries, as the journal's own tiles in a row, the rest counted at its end. */
function JournalStrip({ journal, fallbackRef }: { journal: JournalEntries; fallbackRef: string }) {
  const { t } = useTranslation();
  const open = useJourneyOpen(journal.journeyId, journal.tripJournal);
  const hover = useEntryHover(journal.journeyId, fallbackRef);
  const label = journal.journalTitle ?? t('assistant.card.journey.label');
  return (
    <div>
      <CardStrip label={label} count={journal.entries.length + journal.more} watch={journal.entries}>
        {journal.entries.map((look, index) => (
          <li key={look.entryId ?? `new-${index}`} className={TILE} {...entryHoverProps(hover, look)}>
            <JourneyEntryCover
              entry={coverEntryOf(look)}
              dayColor={DAY_COLORS[(look.dayIndex ?? 0) % DAY_COLORS.length]}
              isActive={false}
              onClick={() => open?.(look.entryId)}
              tone="app"
            />
          </li>
        ))}
        {journal.more > 0 && (
          <li className={TILE}>
            <button type="button" onClick={() => open?.(null)} disabled={!open} className={MORE_TILE}>
              {t('assistant.card.journey.more', { count: journal.more })}
            </button>
          </li>
        )}
      </CardStrip>
      <JournalFooter journal={journal} open={open} />
    </div>
  );
}

/** The answer cards of one journal, as rows or as a strip by how many entries they hold. */
export default function JourneyEntriesBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  const journal = useMemo(() => mergeJournalCards(cards), [cards]);
  if (!journal || journal.entries.length === 0) return null;
  const fallbackRef = cards[0]?.toolCallId ?? 'card';
  return journal.entries.length <= 2 ? (
    <JournalRows journal={journal} fallbackRef={fallbackRef} />
  ) : (
    <JournalStrip journal={journal} fallbackRef={fallbackRef} />
  );
}
