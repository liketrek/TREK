import type { AssistantApplied, TrekCard } from '@trek/shared';
import { ArrowUpRight, MapPin } from 'lucide-react';

import { useTranslation } from '../../../i18n';
import { Tooltip } from '../../shared/Tooltip';
import { showOnMapTarget } from '../assistantShowOnMap';
import { useAssistantView } from '../assistantViewContext';
import { entityLookOf } from './cardLooks';
import { ICON_BUTTON } from './parts/assistantTones';

/**
 * What a receipt offers for the thing it changed, as its entity's look says:
 * the map pin where the plan's map can show it, and "Open" where it lives
 * somewhere else in TREK (a tab of the trip, another page; on the phone what
 * its look names for it there). Neither shows where the shell around the
 * chat cannot open anything.
 */
export default function EntityActions({ applied, card }: { applied: AssistantApplied; card: TrekCard | null }) {
  const { t } = useTranslation();
  const { variant, onOpen } = useAssistantView();
  if (!onOpen) return null;
  const look = entityLookOf(applied.entity);
  const onMap = showOnMapTarget(applied, card);
  const phone = variant === 'fullscreen';
  const open = (phone && look.phoneOpen ? look.phoneOpen(applied, card) : look.open?.(applied, card)) ?? null;
  const openKey = phone ? (look.phoneOpenLabelKey ?? look.openLabelKey) : look.openLabelKey;
  const openLabel = openKey ? t(openKey) : t('assistant.card.common.open');
  return (
    <>
      {onMap && (
        <Tooltip label={t('assistant.change.showOnMap')} placement="top">
          <button
            type="button"
            onClick={() => onOpen({ kind: 'map', ...onMap })}
            aria-label={t('assistant.change.showOnMap')}
            className={ICON_BUTTON}
          >
            <MapPin size={14} aria-hidden="true" />
          </button>
        </Tooltip>
      )}
      {open && (
        <Tooltip label={openLabel} placement="top">
          <button type="button" onClick={() => onOpen(open)} aria-label={openLabel} className={ICON_BUTTON}>
            <ArrowUpRight size={14} aria-hidden="true" className="rtl:-scale-x-100" />
          </button>
        </Tooltip>
      )}
    </>
  );
}
