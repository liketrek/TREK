import type { AssistantMessage, AssistantPlaces } from '@trek/shared';

import { useTranslation } from '../../i18n';
import AssistantPlaceCard from './AssistantPlaceCard';
import { suggestedFromStrip } from './assistantParts';
import CardStrip from './cards/parts/CardStrip';
import { useAssistantPlaceStrip } from './useAssistantPlaceStrip';

/** Cards the strip shows, every one the server sends; what it left out is counted on the tile at its end. */
const SHOWN = 60;

/**
 * The places a search found, as one row of cards to swipe or scroll through
 * (the cards' strip: the next card peeks in, the edges fade where there is
 * more, and the desktop head names the row and pages it by whole cards).
 * Every card the step found, then a tile counting what the server left out.
 */
export default function AssistantPlaceStrip({ found, message }: { found: AssistantPlaces; message: AssistantMessage }) {
  const { t } = useTranslation();
  const strip = useAssistantPlaceStrip();
  const rest = Math.max(0, found.places.length - SHOWN) + found.more;
  const total = found.places.length + found.more;
  return (
    <CardStrip label={t('assistant.place.strip')} count={total} watch={found}>
      {found.places.slice(0, SHOWN).map((place) => (
        <AssistantPlaceCard
          key={place.ref}
          place={place}
          strip={strip}
          suggested={suggestedFromStrip(message, place)}
        />
      ))}
      {rest > 0 && (
        <li className="flex w-24 flex-shrink-0 snap-start items-center justify-center rounded-2xl border border-dashed border-edge-faint px-2 text-center text-caption text-content-muted">
          {t('assistant.place.more', { count: rest })}
        </li>
      )}
    </CardStrip>
  );
}
