import { TRIP_TAG_NAME_MAX } from '@trek/shared';
import { Check, Tag as TagIcon } from 'lucide-react';

import type { PlaceTagsField } from '../../../../components/Planner/usePlaceTags';
import type { Place } from '../../../../types';
import { tagChoices } from '../../../../utils/placeTags';
import MChip from '../../../components/MChip';
import { Eyebrow, FIELD_CLS } from './PlSheetChrome';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const LABEL = 'mb-[6px] mt-3 uppercase';
const PICKER = 'flex flex-wrap gap-[6px]';
const NEW_TAG = 'mt-2 flex items-center gap-2';
const CONFIRM =
  'flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-m-act text-m-actfg disabled:opacity-40';
const CHIPS = 'mt-[6px] flex flex-wrap gap-1';
const CHIP =
  'inline-flex max-w-full items-center gap-1 rounded-full border border-[color:var(--m-faint)] px-2 py-[2px] font-geist text-caption font-semibold text-m-muted';

/**
 * The tags of the place form on the phone: its label, every tag on offer as a chip to
 * switch on or off, and a field that adds a new one to the trip. The state is
 * usePlaceTags', run by the sheet; this is its markup.
 */
export function PlTagPicker({ tags, t }: { tags: PlaceTagsField; t: Translate }) {
  return (
    <>
      <Eyebrow className={LABEL}>{t('places.tags')}</Eyebrow>
      <div role="group" aria-label={t('places.tags')} className={PICKER}>
        {tags.options.map((tag) => (
          <MChip key={tag.id} pressable active={tag.on} onClick={() => tags.toggle(tag.id)}>
            <TagIcon
              size={12}
              strokeWidth={2.2}
              className="flex-none"
              style={{ color: tag.on ? undefined : tag.color }}
            />
            {tag.name}
          </MChip>
        ))}
      </div>
      <div className={NEW_TAG}>
        <input
          type="text"
          value={tags.name}
          onChange={(e) => tags.setName(e.target.value)}
          onKeyDown={tags.handleNameKey}
          maxLength={TRIP_TAG_NAME_MAX}
          aria-label={t('places.newTag')}
          placeholder={t('places.newTag')}
          className={FIELD_CLS}
        />
        <button
          type="button"
          onClick={() => void tags.addNew()}
          disabled={!tags.canAdd}
          aria-label={t('places.addTag')}
          className={CONFIRM}
        >
          <Check size={15} strokeWidth={2.4} />
        </button>
      </div>
    </>
  );
}

/** The tags a place carries, under its category on the phone's place sheet; nothing for a place without any. */
export function PlTagChips({ tags }: { tags: Place['tags'] }) {
  const shown = tagChoices(tags);
  if (shown.length === 0) return null;
  return (
    <div className={CHIPS}>
      {shown.map((tag) => (
        <span key={tag.id} className={CHIP}>
          <TagIcon size={10} strokeWidth={2} className="flex-none" style={{ color: tag.color }} />
          <span dir="auto" className="truncate">
            {tag.name}
          </span>
        </span>
      ))}
    </div>
  );
}
