import type { BookCardFinding, BookPageCard } from '@trek/shared';
import {
  CircleAlert,
  FilePlus,
  ImagePlus,
  Info,
  LayoutTemplate,
  type LucideIcon,
  MoveVertical,
  TriangleAlert,
} from 'lucide-react';
import { lazy, Suspense } from 'react';

import { useTranslation } from '../../../../i18n';
import type { PillTone } from '../../../Planner/planParts';
import type { ChangeItem } from '../../assistantParts';
import { CardFacts, Fact, FactChange } from '../parts/CardFacts';
import { distinctFindings, findingLabel, findingsToCheck, layoutLabel, pageLabel, subjectOf } from './bookCardModel';

/**
 * What a change row of the photo book adds to the row it already is (its
 * verb): the pages it works on as the subject, in the Studio's own words; on
 * the faint line the pages it adds, where a moved page lands, the layout, the
 * photos it brings and how many findings want a look; under the row the page
 * before and after (BookPageThumbs) and what the server's check found.
 */

interface SlotProps {
  card: BookPageCard;
  item: ChangeItem;
}

const STRUCK: ReadonlySet<ChangeItem['state']> = new Set(['discarded', 'expired']);

const BookPageThumbs = lazy(() => import('./BookPageThumbs'));

/** How each severity of finding looks. */
const SEVERITY_LOOK = {
  severe: { Icon: CircleAlert, tone: 'danger' },
  warn: { Icon: TriangleAlert, tone: 'warning' },
  info: { Icon: Info, tone: 'neutral' },
} as const satisfies Record<BookCardFinding['severity'], { Icon: LucideIcon; tone: PillTone }>;

/** The pages the change works on, in bold, struck through once it was discarded or ran out. */
export function BookPageSubject({ card, item }: SlotProps) {
  const { t } = useTranslation();
  const subject = subjectOf(card, t);
  return (
    <bdi
      title={subject}
      className={`block truncate text-body font-semibold leading-tight text-content ${STRUCK.has(item.state) ? 'line-through' : ''}`}
    >
      {subject}
    </bdi>
  );
}

/** The facts of the change: pages it adds, where a moved page lands, the layout, new photos, findings to check. */
export function BookPageFacts({ card }: SlotProps) {
  const { t } = useTranslation();
  const layout = layoutLabel(card.layout, t);
  const check = findingsToCheck(card);
  const moved = card.movedTo === null ? null : card.pages[0];
  return (
    <>
      {card.change === 'new' && card.count > 0 && (
        <Fact icon={FilePlus} tone="success" label={t('assistant.card.book.pagesAdded', { count: card.count })} />
      )}
      {moved && (
        <FactChange
          icon={MoveVertical}
          before={pageLabel(moved, t)}
          after={pageLabel({ ...moved, number: card.movedTo }, t)}
        />
      )}
      {layout && <Fact icon={LayoutTemplate} label={layout} />}
      {card.photosAdded > 0 && (
        <Fact
          icon={ImagePlus}
          tone="success"
          label={t('assistant.card.book.photosAdded', { count: card.photosAdded })}
        />
      )}
      {check.count > 0 && (
        <Fact
          icon={TriangleAlert}
          tone={check.severe ? 'danger' : 'warning'}
          label={t('assistant.card.book.findings', { count: check.count })}
        />
      )}
    </>
  );
}

/**
 * The page before and after the change, or as it is now once applied, and
 * each kind of finding once. The pages are drawn by the editor's own view,
 * loaded with the first page card: the chat outside the Studio never needs it.
 */
export function BookPageBody({ card, item }: SlotProps) {
  const { t } = useTranslation();
  const findings = distinctFindings(card);
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <Suspense fallback={null}>
        <BookPageThumbs card={card} item={item} />
      </Suspense>
      {findings.length > 0 && (
        <CardFacts>
          {findings.map((finding) => (
            <Fact
              key={finding.code}
              icon={SEVERITY_LOOK[finding.severity].Icon}
              tone={SEVERITY_LOOK[finding.severity].tone}
              label={findingLabel(finding, t)}
            />
          ))}
        </CardFacts>
      )}
    </div>
  );
}
