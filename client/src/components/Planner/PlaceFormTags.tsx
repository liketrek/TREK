import { TRIP_TAG_NAME_MAX } from '@trek/shared';
import { Plus, Tag as TagIcon } from 'lucide-react';

import { DialogSection, fs } from '../shared/DialogShell';
import type { PlaceTagsField } from './usePlaceTags';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const ROW = 'flex flex-wrap items-center gap-1.5';
const CHIP =
  'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium transition-colors';
const CHIP_ON = 'border-transparent bg-accent text-accent-text';
const CHIP_OFF = 'border-edge bg-surface-input text-content-secondary hover:text-content';
const NEW_TAG = 'inline-flex min-w-0 items-center gap-1';
const NEW_TAG_INPUT =
  'w-36 min-w-0 rounded-full border border-dashed border-edge bg-transparent px-2.5 py-1 text-content outline-none placeholder:text-content-faint focus:border-solid focus:border-content-faint';
const ADD_BUTTON =
  'grid h-[26px] w-[26px] flex-none place-items-center rounded-full bg-surface-card text-content-muted shadow-sm ring-1 ring-edge-faint transition-colors hover:text-content disabled:cursor-default disabled:opacity-50';

/**
 * The tags of the place form on the desktop: every tag on offer as a switch, and a
 * field that adds a new one to the trip. The state is usePlaceTags'; this is its markup.
 */
export function PlaceFormTags({ tags, t }: { tags: PlaceTagsField; t: Translate }) {
  return (
    <DialogSection label={t('places.tags')}>
      <div role="group" aria-label={t('places.tags')} className={ROW}>
        {tags.options.map((tag) => (
          <button
            key={tag.id}
            type="button"
            aria-pressed={tag.on}
            onClick={() => tags.toggle(tag.id)}
            className={`${CHIP} ${tag.on ? CHIP_ON : CHIP_OFF}`}
            style={fs(12, 'body')}
          >
            <TagIcon
              size={12}
              strokeWidth={2.2}
              className="flex-none"
              style={{ color: tag.on ? undefined : tag.color }}
            />
            <span className="truncate">{tag.name}</span>
          </button>
        ))}
        <span className={NEW_TAG}>
          <input
            type="text"
            value={tags.name}
            onChange={(e) => tags.setName(e.target.value)}
            onKeyDown={tags.handleNameKey}
            maxLength={TRIP_TAG_NAME_MAX}
            aria-label={t('places.newTag')}
            placeholder={t('places.newTag')}
            className={NEW_TAG_INPUT}
            style={fs(12, 'body')}
          />
          <button
            type="button"
            onClick={() => void tags.addNew()}
            disabled={!tags.canAdd}
            aria-label={t('places.addTag')}
            className={ADD_BUTTON}
          >
            <Plus size={13} strokeWidth={2.4} />
          </button>
        </span>
      </div>
    </DialogSection>
  );
}
