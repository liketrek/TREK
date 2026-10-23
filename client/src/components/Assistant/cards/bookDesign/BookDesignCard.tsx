import type { AssistantMessage, BookDesignCard, TrekCard } from '@trek/shared';
import { CircleSlash, Files, History, ImageOff, Palette, TriangleAlert, Type } from 'lucide-react';
import { lazy, Suspense } from 'react';

import { useTranslation } from '../../../../i18n';
import { BOOK_FONTS } from '../../../Studio/bookFonts';
import type { ChangeItem } from '../../assistantParts';
import type { CardEntry } from '../cardTypes';
import { CardFacts, Fact } from '../parts/CardFacts';
import CardFrame from '../parts/CardFrame';
import CardHeader from '../parts/CardHeader';
import { designCounts, skippedCounts, styleLabel } from './bookDesignModel';

/**
 * The whole-book design in the chat. Its head names the design after its
 * style, with the book's colours (paper, ink, accent) as three dots; its
 * facts name the two typefaces, how many pages change, the photos left out
 * and the findings worth a look; under it the pages, each beside the page it
 * replaces (BookDesignSpreadStrip, loaded with the first design card).
 *
 * `design_book`'s draft stands as an answer card; the held
 * `apply_book_design` is a change row whose pages can be taken out one by one
 * before the person applies the rest; its receipt shows the pages it wrote
 * and names the ones it left as they were.
 */

interface SlotProps {
  card: BookDesignCard;
  item: ChangeItem;
}

const BookDesignSpreadStrip = lazy(() => import('./BookDesignSpreadStrip'));

/** A change that no longer runs: no pages to draw, its name struck through. */
const GONE: ReadonlySet<ChangeItem['state']> = new Set(['failed', 'discarded', 'expired']);
const STRUCK: ReadonlySet<ChangeItem['state']> = new Set(['discarded', 'expired']);

const SUBJECT_ROW = 'flex min-w-0 items-center gap-2';
const SUBJECT = 'block min-w-0 truncate text-body font-semibold leading-tight text-content';
const SUBJECT_STRUCK = `${SUBJECT} line-through`;
const SWATCHES = 'inline-flex flex-none items-center gap-0.5';
const SWATCH = 'h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-edge';
const CARDS = 'flex flex-col gap-2';
const BODY = 'mt-1';

/** The book's colours as three dots: paper, ink and accent. */
function Swatches({ card }: { card: BookDesignCard }) {
  const { t } = useTranslation();
  const colours = [
    { role: 'paper', value: card.paper },
    { role: 'ink', value: card.ink },
    { role: 'accent', value: card.accent },
  ];
  return (
    <span role="img" aria-label={t('assistant.card.bookDesign.colours')} className={SWATCHES}>
      {colours.map((colour) => (
        <span key={colour.role} className={SWATCH} style={{ backgroundColor: colour.value }} />
      ))}
    </span>
  );
}

/** The pages an applied design left as they were, by why. */
function SkippedFacts({ card }: { card: BookDesignCard }) {
  const { t } = useTranslation();
  const skipped = skippedCounts(card);
  return (
    <>
      {skipped.changed_since > 0 && (
        <Fact
          icon={History}
          tone="warning"
          label={t('assistant.card.bookDesign.skippedChanged', { count: skipped.changed_since })}
        />
      )}
      {skipped.photo_gone > 0 && (
        <Fact
          icon={ImageOff}
          tone="warning"
          label={t('assistant.card.bookDesign.skippedPhoto', { count: skipped.photo_gone })}
        />
      )}
      {skipped.excluded > 0 && (
        <Fact icon={CircleSlash} label={t('assistant.card.bookDesign.skippedExcluded', { count: skipped.excluded })} />
      )}
    </>
  );
}

/** The design's facts: its typefaces, the pages it changes, photos left out, findings; once applied, what it left. */
function DesignFacts({ card, applied }: { card: BookDesignCard; applied: boolean }) {
  const { t } = useTranslation();
  const counts = designCounts(card);
  const faces = { heading: BOOK_FONTS[card.heading].name, body: BOOK_FONTS[card.body].name };
  // One typeface for both is named once.
  const typeface = faces.heading === faces.body ? faces.heading : t('assistant.card.bookDesign.faces', faces);
  return (
    <>
      <Fact icon={Type} label={typeface} />
      {!applied && counts.changes > 0 && (
        <Fact icon={Files} label={t('assistant.card.bookDesign.changes', { count: counts.changes })} />
      )}
      {!applied && card.leftOut > 0 && (
        <Fact icon={ImageOff} label={t('assistant.card.bookDesign.leftOut', { count: card.leftOut })} />
      )}
      {!applied && counts.findings > 0 && (
        <Fact
          icon={TriangleAlert}
          tone={counts.severe ? 'danger' : 'warning'}
          label={t('assistant.card.book.findings', { count: counts.findings })}
        />
      )}
      {applied && <SkippedFacts card={card} />}
    </>
  );
}

interface PagesProps {
  card: BookDesignCard;
  mode: 'draft' | 'applied';
  editable: boolean;
}

/** The pages of the design under its card or row. */
function DesignPages({ card, mode, editable }: PagesProps) {
  return (
    <div className={BODY}>
      <Suspense fallback={null}>
        <BookDesignSpreadStrip card={card} mode={mode} editable={editable} />
      </Suspense>
    </div>
  );
}

/** A draft `design_book` made, nothing proposed yet: the design, its facts and its pages. */
function DesignAnswer({ card }: { card: BookDesignCard }) {
  const { t } = useTranslation();
  const counts = designCounts(card);
  return (
    <CardFrame label={t('assistant.card.bookDesign.label')}>
      <CardHeader
        icon={Palette}
        tone="info"
        title={styleLabel(card, t)}
        meta={t('assistant.card.bookDesign.pages', { count: counts.pages })}
        actions={<Swatches card={card} />}
      />
      <CardFacts>
        <DesignFacts card={card} applied={false} />
      </CardFacts>
      <DesignPages card={card} mode="draft" editable={false} />
    </CardFrame>
  );
}

/** One answer card of the group, drawn when it is a design. */
function DesignEntry({ card }: { card: TrekCard }) {
  return card.kind === 'bookDesign' ? <DesignAnswer card={card} /> : null;
}

/** The drafts an answer made, one card each. */
export function BookDesignBlock({ cards }: { cards: readonly CardEntry[]; message: AssistantMessage }) {
  return (
    <div className={CARDS}>
      {cards.map((entry) => (
        <DesignEntry key={entry.toolCallId} card={entry.card} />
      ))}
    </div>
  );
}

/** The design as a change row's subject: its style in bold with its colours, struck once it no longer runs. */
export function BookDesignSubject({ card, item }: SlotProps) {
  const { t } = useTranslation();
  const subject = styleLabel(card, t);
  return (
    <span className={SUBJECT_ROW}>
      <bdi title={subject} className={STRUCK.has(item.state) ? SUBJECT_STRUCK : SUBJECT}>
        {subject}
      </bdi>
      <Swatches card={card} />
    </span>
  );
}

/** The change row's facts; once applied, the pages it left as they were. */
export function BookDesignFacts({ card, item }: SlotProps) {
  return <DesignFacts card={card} applied={item.state === 'applied'} />;
}

/**
 * The pages under the change row: while it waits, each page beside the one
 * it replaces, with the choice of pages until it is decided; once applied,
 * the pages as the book holds them now. Nothing for a change that no longer
 * runs.
 */
export function BookDesignBody({ card, item }: SlotProps) {
  if (GONE.has(item.state)) return null;
  const applied = item.state === 'applied';
  const editable = item.state === 'pending' && card.change === 'proposed';
  return <DesignPages card={card} mode={applied ? 'applied' : 'draft'} editable={editable} />;
}
