import { bookStickerSlotColor, type BookElement, type BookStickerElement } from '@trek/shared';
import { bookSticker } from '@trek/shared/stickers';
import type { ReactNode } from 'react';

import { Line, Section } from './StudioControls';
import { Swatches } from './StudioSwatches';
import { stickerLabel, withSlotColor } from './stickerLibrary';

/**
 * The inspector of a sticker: its colours slot by slot first, then where it
 * sits, which for a sticker is open from the start and holds its mirror and
 * its turn (StudioPositionSection.tsx).
 *
 * Every slot is offered with the colour it shows now, the sticker's own until
 * somebody picks another, and choosing one writes the colours of the slots
 * before it as well, so the list the document keeps always reads in slot order.
 */

type Translate = (k: string, params?: Record<string, string | number>) => string;

export function StudioStickerInspector({
  el,
  set,
  position,
  t,
}: {
  el: BookStickerElement;
  set: (patch: Partial<BookElement>) => void;
  position: ReactNode;
  t: Translate;
}) {
  const def = bookSticker(el.stickerId);
  return (
    <>
      <Section
        label={t('journey.studio.stickerColours')}
        hint={def ? stickerLabel(t, def.id) : t('journey.studio.stickerMissing')}
      >
        {def?.slots.map((slot, i) => (
          <Line key={slot.name} label={t('journey.studio.stickerSlot', { index: i + 1 })} wide>
            <Swatches
              value={bookStickerSlotColor(def.slots, el.colors, i)}
              onPick={(color) => set({ colors: withSlotColor(el, def.slots, i, color) })}
            />
          </Line>
        ))}
        {el.colors.length > 0 && (
          <div className="st-row st-section-gap">
            <button type="button" className="st-chip" onClick={() => set({ colors: [] })}>
              {t('journey.studio.stickerResetColours')}
            </button>
          </div>
        )}
      </Section>

      {position}
    </>
  );
}
