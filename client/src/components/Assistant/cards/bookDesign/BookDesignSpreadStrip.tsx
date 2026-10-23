import type { BookDesignCard, BookPageSetup, BookSpread } from '@trek/shared';
import { ArrowRight, Check, TriangleAlert } from 'lucide-react';
import { type FocusEvent, useState } from 'react';

import { useTranslation } from '../../../../i18n';
import { SpreadThumb } from '../../../Studio/SpreadThumb';
import { useStudioPageHint } from '../../../Studio/useStudioPageHint';
import { pageLabel } from '../book/bookCardModel';
import { ChangeMark } from '../parts/CardFacts';
import type { DesignPair } from './bookDesignModel';
import { useBookDesignDraft } from './useBookDesignDraft';

/**
 * The pages of a whole-book design drawn small, a row to scroll through:
 * each page the design changes beside the page of the book it replaces (a
 * new page alone, marked new; a dropped one alone, marked removed), its
 * findings flagged. While the proposal waits, a round choice on each page
 * keeps it in the apply or takes it out. Once applied, the pages as the book
 * holds them now. Each sheet is the editor's own view under a scale, so the
 * card never looks different from the page; pressing one shows that page.
 */

/** A sheet's height in pixels; its width follows the page. */
const SHEET_HEIGHT = 48;
/** Pages shown before the rest wait behind "Show all". */
const FIRST_PAIRS = 12;

const FOCUS = 'outline-none focus-visible:ring-2 focus-visible:ring-accent';
const STRIP = 'flex flex-col gap-1.5';
const ROW = '-mx-1 flex gap-3 overflow-x-auto px-1 pb-1';
const PAIR = 'flex flex-none flex-col gap-1 transition-opacity';
const PAIR_OUT = `${PAIR} opacity-50`;
const PAIR_HEAD = 'flex min-w-0 items-center gap-1.5';
const PAIR_LABEL = 'truncate text-caption text-content-secondary';
const SHEETS = 'flex items-center gap-1';
const SHEET_BUTTON = `flex flex-col items-start gap-0.5 rounded-md ${FOCUS}`;
const SHEET = 'relative overflow-hidden rounded-sm ring-1 ring-edge-faint';
const SHEET_CAPTION = 'text-caption text-content-faint';
const ARROW = 'flex-none text-content-faint rtl:-scale-x-100';
const CHOICE = `grid h-4 w-4 flex-none place-items-center rounded-full transition-colors ${FOCUS}`;
const CHOICE_ON = `${CHOICE} bg-accent`;
const CHOICE_OFF = `${CHOICE} border-[1.5px] border-edge bg-surface-card`;
const CHOICE_MARK = 'text-accent-text';
const MORE = `self-start rounded-sm text-caption font-medium text-accent-on hover:underline ${FOCUS}`;
const NOTE = 'text-caption text-content-muted';
const NOTE_ERR = 'text-caption text-danger';
const SKELETON = 'trek-skeleton block h-12 w-48';
const FLAG_SEVERE = 'flex-none text-danger';
const FLAG_WARN = 'flex-none text-warning';

interface SheetProps {
  spread: BookSpread;
  page: BookPageSetup;
  /** "Before" or "After" under a page drawn beside its other side; nothing under a page alone. */
  caption: string | null;
  onShow: () => void;
}

/** One page drawn small; pressing it shows the page, pointing at it outlines it in the Studio's page rail. */
function Sheet({ spread, page, caption, onShow }: SheetProps) {
  const { t } = useTranslation();
  const hint = useStudioPageHint(spread.id);
  const width = (SHEET_HEIGHT * (spread.role === 'inner' ? page.pageWidth * 2 : page.pageWidth)) / page.pageHeight;
  return (
    <button
      type="button"
      onClick={onShow}
      {...hint}
      aria-label={t('assistant.card.book.showPage')}
      className={SHEET_BUTTON}
    >
      <SpreadThumb spread={spread} page={page} width={width} className={SHEET} />
      {caption && <span className={SHEET_CAPTION}>{caption}</span>}
    </button>
  );
}

type Strip = ReturnType<typeof useBookDesignDraft>;

interface PairProps {
  pair: DesignPair;
  strip: Strip;
  editable: boolean;
}

interface PairRowProps extends PairProps {
  /** A proposal's pages: one taken out of the apply is faded, also while the apply runs. */
  choosing: boolean;
}

/** A page's head: its round choice while it can be taken out, its name, what happens to it, its findings. */
function PairHead({ pair, strip, editable, label }: PairProps & { label: string }) {
  const { t } = useTranslation();
  const included = strip.chosen.has(pair.spreadId);
  return (
    <span className={PAIR_HEAD}>
      {editable && (
        <button
          type="button"
          onClick={() => strip.toggle(pair.spreadId)}
          aria-pressed={included}
          aria-label={t('assistant.card.bookDesign.include', { page: label })}
          className={included ? CHOICE_ON : CHOICE_OFF}
        >
          {included && <Check size={10} strokeWidth={3} aria-hidden="true" className={CHOICE_MARK} />}
        </button>
      )}
      <bdi className={PAIR_LABEL}>{label}</bdi>
      {pair.action === 'insert' && <ChangeMark change="new" />}
      {pair.action === 'drop' && <ChangeMark change="removed" />}
      {pair.findings > 0 && (
        <TriangleAlert
          size={11}
          role="img"
          aria-label={t('assistant.card.book.findings', { count: pair.findings })}
          className={pair.severe ? FLAG_SEVERE : FLAG_WARN}
        />
      )}
    </span>
  );
}

/** The page before and after, "Before" and "After" under them when both are drawn. */
function PairSheets({ pair, strip }: { pair: DesignPair; strip: Strip }) {
  const { t } = useTranslation();
  const show = () => strip.show(pair.spreadId);
  const both = pair.before !== null && pair.after !== null;
  return (
    <span className={SHEETS}>
      {pair.before && strip.beforePage && (
        <Sheet
          spread={pair.before}
          page={strip.beforePage}
          caption={both ? t('assistant.card.book.before') : null}
          onShow={show}
        />
      )}
      {both && <ArrowRight size={12} aria-hidden="true" className={ARROW} />}
      {pair.after && strip.afterPage && (
        <Sheet
          spread={pair.after}
          page={strip.afterPage}
          caption={both ? t('assistant.card.book.after') : null}
          onShow={show}
        />
      )}
    </span>
  );
}

/** One page of the design: its head, and the page before and after; faded once taken out of the apply. */
function Pair({ pair, strip, editable, choosing }: PairRowProps) {
  const { t } = useTranslation();
  const label = pair.page ? pageLabel(pair.page, t) : t('assistant.card.book.spreadAny');
  return (
    <li className={choosing && !strip.chosen.has(pair.spreadId) ? PAIR_OUT : PAIR}>
      <PairHead pair={pair} strip={strip} editable={editable} label={label} />
      <PairSheets pair={pair} strip={strip} />
    </li>
  );
}

interface StripProps {
  card: BookDesignCard;
  /** `draft` while the design waits, `applied` for its receipt. */
  mode: 'draft' | 'applied';
  /** The pages can be taken out of the apply (a proposal still waiting). */
  editable: boolean;
}

export default function BookDesignSpreadStrip({ card, mode, editable }: StripProps) {
  const { t } = useTranslation();
  const strip = useBookDesignDraft(card, mode, editable);
  const [all, setAll] = useState(false);
  // The choice goes out as soon as the pointer or the focus leaves the pages, so an Apply right after it applies it.
  const leave = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) strip.flush();
  };
  if (strip.status === 'loading') return <span aria-hidden="true" className={SKELETON} />;
  if (strip.status === 'expired') return <p className={NOTE}>{t('assistant.card.bookDesign.expired')}</p>;
  if (strip.status === 'failed') return <p className={NOTE}>{t('assistant.card.bookDesign.unavailable')}</p>;
  if (strip.pairs.length === 0) return null;
  const shown = all ? strip.pairs : strip.pairs.slice(0, FIRST_PAIRS);
  const choosing = mode === 'draft' && card.change === 'proposed';
  return (
    <div onPointerLeave={strip.flush} onBlur={leave} className={STRIP}>
      <ul aria-label={t('assistant.card.bookDesign.pagesLabel')} className={ROW}>
        {shown.map((pair) => (
          <Pair key={pair.spreadId} pair={pair} strip={strip} editable={editable} choosing={choosing} />
        ))}
      </ul>
      {shown.length < strip.pairs.length && (
        <button type="button" onClick={() => setAll(true)} className={MORE}>
          {t('assistant.card.bookDesign.showAll', { count: strip.pairs.length })}
        </button>
      )}
      {strip.selectFailed && (
        <p role="status" className={NOTE_ERR}>
          {t('assistant.card.bookDesign.selectFailed')}
        </p>
      )}
    </div>
  );
}
