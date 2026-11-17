import { TRIP_TAG_NAME_MAX } from '@trek/shared';
import { Check, Plus } from 'lucide-react';
import { useState } from 'react';

import { DialogSection, fs } from '../shared/DialogShell';
import { PANEL } from '../shared/dialogParts';
import { TagColorPopover } from './TagColorPopover';
import type { PlaceTagsField } from './usePlaceTags';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const ROW = 'flex flex-wrap items-center gap-2';
/** One tag: the colour dot and the name, two buttons in one pill. */
const PILL =
  'relative inline-flex h-8 min-w-0 max-w-full items-center rounded-full border shadow-sm transition-[background-color,border-color,box-shadow] duration-150';
const PILL_OFF = 'border-edge bg-surface-input hover:border-content-faint';
const DOT_BUTTON =
  'ms-1 grid h-6 w-6 flex-none place-items-center rounded-full transition-transform duration-150 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]';
const DOT = 'h-3.5 w-3.5 rounded-full ring-1 ring-inset ring-edge';
const NAME_BUTTON = 'inline-flex h-full min-w-0 items-center gap-1.5 rounded-e-full ps-1.5 font-medium';
/** The tick of a picked tag, in a round white badge. */
const TICK = 'me-1 grid h-5 w-5 flex-none place-items-center rounded-full bg-surface-card shadow-sm';
const NEW_TAG =
  'relative inline-flex h-8 min-w-0 items-center rounded-full border pe-1 transition-[background-color,border-color,box-shadow] duration-150 focus-within:shadow-sm';
const NEW_TAG_INPUT = 'w-32 min-w-0 bg-transparent ps-1.5 text-content outline-none placeholder:text-content-faint';
const ADD_BUTTON =
  'grid h-6 w-6 flex-none place-items-center rounded-full shadow-sm transition-[background-color,color,transform] duration-150 enabled:hover:scale-110 disabled:cursor-default disabled:bg-surface-tertiary disabled:text-content-faint disabled:shadow-none';

const FALLBACK_COLOR = 'var(--text-muted)';
const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, var(--bg-input))`;

/**
 * The tags of the place form on the desktop, as a card like the search and the
 * address. Every tag on offer is a pill in its own colour: the name ticks it for
 * the place, the dot opens a palette that recolours it for the whole trip. The
 * field after them adds a new tag, in a colour picked the same way and shown on
 * the field as it is typed. The state is usePlaceTags'; this is its markup.
 */
export function PlaceFormTags({ tags, t }: { tags: PlaceTagsField; t: Translate }) {
  // Which palette is open: a tag's id, 'new' for the new tag's colour, or none.
  const [palette, setPalette] = useState<number | 'new' | null>(null);
  // The colour a tag shows while its custom colour is being dragged, before it is kept.
  const [preview, setPreview] = useState<{ id: number; color: string } | null>(null);
  const typing = !!tags.name.trim();
  const closePalette = () => {
    setPalette(null);
    setPreview(null);
  };

  return (
    <div className={PANEL}>
      <DialogSection label={t('places.tags')}>
        <div role="group" aria-label={t('places.tags')} className={ROW}>
          {tags.options.map((tag) => {
            const color = (preview?.id === tag.id ? preview.color : tag.color) ?? FALLBACK_COLOR;
            return (
              <span
                key={tag.id}
                className={`${PILL} ${tag.on ? '' : PILL_OFF}`}
                style={tag.on ? { background: tint(color, 18), borderColor: tint(color, 55) } : undefined}
              >
                <button
                  type="button"
                  aria-label={t('places.tagColor', { name: tag.name })}
                  aria-expanded={palette === tag.id}
                  onClick={() => (palette === tag.id ? closePalette() : setPalette(tag.id))}
                  className={DOT_BUTTON}
                >
                  <span aria-hidden="true" className={DOT} style={{ background: color }} />
                </button>
                <button
                  type="button"
                  aria-pressed={tag.on}
                  onClick={() => tags.toggle(tag.id)}
                  className={`${NAME_BUTTON} ${tag.on ? 'pe-0 text-content' : 'pe-3 text-content-secondary hover:text-content'}`}
                  style={fs(12, 'body')}
                >
                  <span className="truncate">{tag.name}</span>
                  {tag.on && (
                    <span aria-hidden="true" className={TICK}>
                      <Check size={11} strokeWidth={3.2} style={{ color }} />
                    </span>
                  )}
                </button>
                {palette === tag.id && (
                  <TagColorPopover
                    label={t('places.tagColor', { name: tag.name })}
                    value={tag.color ?? null}
                    onPick={(next) => void tags.recolor(tag.id, next)}
                    onPreview={(next) => setPreview({ id: tag.id, color: next })}
                    onClose={closePalette}
                    t={t}
                  />
                )}
              </span>
            );
          })}
          <span
            className={NEW_TAG}
            style={{
              background: tint(tags.newColor, typing ? 14 : 6),
              borderColor: tint(tags.newColor, typing ? 60 : 35),
              borderStyle: typing ? 'solid' : 'dashed',
            }}
          >
            <button
              type="button"
              aria-label={t('places.newTagColor')}
              aria-expanded={palette === 'new'}
              onClick={() => (palette === 'new' ? closePalette() : setPalette('new'))}
              className={DOT_BUTTON}
            >
              <span aria-hidden="true" className={DOT} style={{ background: tags.newColor }} />
            </button>
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
              style={tags.canAdd ? { background: tags.newColor, color: 'var(--bg-card)' } : undefined}
            >
              <Plus size={13} strokeWidth={2.8} />
            </button>
            {palette === 'new' && (
              <TagColorPopover
                label={t('places.newTagColor')}
                value={tags.newColor}
                onPick={tags.setNewColor}
                onPreview={tags.setNewColor}
                onClose={closePalette}
                t={t}
              />
            )}
          </span>
        </div>
      </DialogSection>
    </div>
  );
}
