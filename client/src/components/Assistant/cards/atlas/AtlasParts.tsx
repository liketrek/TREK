import type { AssistantChangeVerbKey, AtlasStatusAfter } from '@trek/shared';
import { Star } from 'lucide-react';

import { useTranslation } from '../../../../i18n';
import CountryFlag from '../../../shared/CountryFlag';
import type { ChangeItem } from '../../assistantParts';
import { verbLookOf } from '../cardLooks';
import { FactChange } from '../parts/CardFacts';
import KindTile from '../parts/KindTile';
import { STATUS_LOOK } from './atlasCardModel';

/**
 * The pieces the atlas cards share: a country's flag on a tile (a star for a
 * wish without a country), with the change's verb as a dot on its corner, and
 * a country's or a region's standing as a pill, from what it was to what it
 * will be.
 */

export function FlagTile({
  code,
  verbKey = null,
  dimmed = false,
}: {
  code: string | null;
  verbKey?: AssistantChangeVerbKey | null;
  dimmed?: boolean;
}) {
  const look = verbKey ? verbLookOf(verbKey) : null;
  return (
    <span
      aria-hidden="true"
      className={`relative flex h-7 w-7 flex-none items-center justify-center rounded-md ${
        code ? 'bg-surface-secondary' : 'bg-warning-soft text-warning'
      } ${dimmed ? 'opacity-60' : ''}`}
    >
      {code ? <CountryFlag code={code} size={18} /> : <Star size={14} strokeWidth={2.1} />}
      {look && (
        <span className="absolute -bottom-0.5 -end-0.5">
          <KindTile icon={look.Icon} tone={look.tone} size="xs" />
        </span>
      )}
    </span>
  );
}

/** A change row's lead: the flag (a star without a country) with the change's verb, faded once it will not land. */
export function ChangeFlag({ code, item }: { code: string | null; item: ChangeItem }) {
  const settled = item.state === 'discarded' || item.state === 'expired';
  return <FlagTile code={code} verbKey={item.preview?.verbKey ?? null} dimmed={settled} />;
}

/** A standing as a pill in its tone; the old one struck through in front when it changes. */
export function StatusFact({ before, after }: { before: AtlasStatusAfter | null; after: AtlasStatusAfter }) {
  const { t } = useTranslation();
  const look = STATUS_LOOK[after];
  const was = before && before !== after ? t(STATUS_LOOK[before].labelKey) : null;
  return <FactChange icon={look.Icon} tone={look.tone} before={was} after={t(look.labelKey)} />;
}
