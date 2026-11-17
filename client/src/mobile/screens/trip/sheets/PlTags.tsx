import { TRIP_TAG_NAME_MAX } from '@trek/shared';
import { Check, Plus, Tag as TagIcon } from 'lucide-react';
import { useState } from 'react';

import { TagColorPopover } from '../../../../components/Planner/TagColorPopover';
import type { PlaceTagsField } from '../../../../components/Planner/usePlaceTags';
import type { Place } from '../../../../types';
import { tagChoices } from '../../../../utils/placeTags';
import { Eyebrow } from './PlSheetChrome';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const LABEL = 'mb-[5px] mt-3 uppercase';
/** The one field the tags live in: their chips, then where a new one is typed. */
const FIELD =
  'flex min-h-[42px] w-full flex-wrap items-center gap-[5px] rounded-[21px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[5px]';
/** One tag: its colour dot and its name, two buttons in one chip. */
const CHIP =
  'inline-flex h-[30px] min-w-0 max-w-full items-center rounded-full border transition-[background-color,border-color] duration-150';
const CHIP_OFF = 'border-[color:var(--m-rowbr)] bg-[color:var(--m-card)]';
const DOT_BUTTON = 'grid h-[30px] w-[26px] flex-none place-items-center ps-[3px]';
const DOT = 'h-[12px] w-[12px] rounded-full ring-1 ring-inset ring-[color:var(--m-rowbr)]';
const NAME_BUTTON = 'inline-flex h-full min-w-0 items-center gap-[5px] text-caption font-semibold';
/** The tick of a picked tag, in a round white badge. */
const TICK =
  'me-[3px] grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-[color:var(--m-card)] shadow-sm';
/** Where a new tag is typed: the rest of the field's line, at least wide enough for a short name. */
const NEW_TAG = 'flex h-[30px] min-w-[9rem] flex-1 items-center gap-[6px]';
const NEW_INPUT =
  'min-w-0 flex-1 bg-transparent font-[inherit] text-caption font-semibold text-m-ink outline-none placeholder:font-medium placeholder:text-m-faint';
const ADD_BUTTON = 'grid h-[30px] w-[30px] flex-none place-items-center rounded-full';
/** The palette laid into the sheet under the field, in the sheet's own surface. */
const PALETTE =
  'mt-2 flex w-full flex-col gap-2.5 rounded-[18px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3';
const CHIPS = 'mt-[6px] flex flex-wrap gap-1';
const SHEET_CHIP =
  'inline-flex max-w-full items-center gap-1 rounded-full border border-[color:var(--m-faint)] px-2 py-[2px] font-geist text-caption font-semibold text-m-muted';

const FALLBACK_COLOR = 'var(--m-faint)';
const tint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, var(--m-card))`;

/**
 * The tags of the place form on the phone, in one field like the sheet's others:
 * every tag on offer is a chip in its own colour inside it (the name ticks it,
 * the dot opens the palette that recolours it for the whole trip), and the rest
 * of the field takes a new tag, in a colour picked by the dot in front of it. The
 * palette opens into the sheet under the field rather than floating. The state is
 * usePlaceTags', run by the sheet; this is its markup.
 */
export function PlTagPicker({ tags, t }: { tags: PlaceTagsField; t: Translate }) {
  const [palette, setPalette] = useState<number | 'new' | null>(null);
  const [preview, setPreview] = useState<{ id: number; color: string } | null>(null);
  const closePalette = () => {
    setPalette(null);
    setPreview(null);
  };
  const toggle = (which: number | 'new') => (palette === which ? closePalette() : setPalette(which));
  const open = typeof palette === 'number' ? tags.options.find((tag) => tag.id === palette) : undefined;

  return (
    <>
      <Eyebrow className={LABEL}>{t('places.tags')}</Eyebrow>
      <div>
        <div role="group" aria-label={t('places.tags')} className={FIELD}>
          {tags.options.map((tag) => {
            const color = (preview?.id === tag.id ? preview.color : tag.color) ?? FALLBACK_COLOR;
            return (
              <span
                key={tag.id}
                className={`${CHIP} ${tag.on ? '' : CHIP_OFF}`}
                style={tag.on ? { background: tint(color, 22), borderColor: tint(color, 55) } : undefined}
              >
                <button
                  type="button"
                  aria-label={t('places.tagColor', { name: tag.name })}
                  aria-expanded={palette === tag.id}
                  onClick={() => toggle(tag.id)}
                  className={DOT_BUTTON}
                >
                  <span aria-hidden="true" className={DOT} style={{ background: color }} />
                </button>
                <button
                  type="button"
                  aria-pressed={tag.on}
                  onClick={() => tags.toggle(tag.id)}
                  className={`${NAME_BUTTON} ${tag.on ? 'ps-[2px] text-m-ink' : 'pe-[11px] ps-[2px] text-m-muted'}`}
                >
                  <span dir="auto" className="truncate">
                    {tag.name}
                  </span>
                  {tag.on && (
                    <span aria-hidden="true" className={TICK}>
                      <Check size={12} strokeWidth={3.2} style={{ color }} />
                    </span>
                  )}
                </button>
              </span>
            );
          })}
          <span className={`${NEW_TAG} ${tags.options.length ? 'ps-[4px]' : 'ps-[8px]'}`}>
            <button
              type="button"
              aria-label={t('places.newTagColor')}
              aria-expanded={palette === 'new'}
              onClick={() => toggle('new')}
              className="grid h-[30px] w-[18px] flex-none place-items-center"
            >
              <span
                aria-hidden="true"
                className="h-[14px] w-[14px] rounded-full ring-1 ring-inset ring-[color:var(--m-rowbr)]"
                style={{ background: tags.newColor }}
              />
            </button>
            <input
              type="text"
              value={tags.name}
              onChange={(e) => tags.setName(e.target.value)}
              onKeyDown={tags.handleNameKey}
              maxLength={TRIP_TAG_NAME_MAX}
              aria-label={t('places.newTag')}
              placeholder={t('places.newTag')}
              enterKeyHint="done"
              className={NEW_INPUT}
            />
            <button
              type="button"
              onClick={() => void tags.addNew()}
              disabled={!tags.canAdd}
              aria-label={t('places.addTag')}
              className={`${ADD_BUTTON} ${tags.canAdd ? '' : 'text-m-faint'}`}
              style={tags.canAdd ? { background: tags.newColor, color: 'var(--m-card)' } : undefined}
            >
              <Plus size={15} strokeWidth={2.6} />
            </button>
          </span>
        </div>
        {open && (
          <TagColorPopover
            key={open.id}
            label={t('places.tagColor', { name: open.name })}
            value={open.color ?? null}
            onPick={(next) => void tags.recolor(open.id, next)}
            onPreview={(next) => setPreview({ id: open.id, color: next })}
            onClose={closePalette}
            className={PALETTE}
            t={t}
          />
        )}
        {palette === 'new' && (
          <TagColorPopover
            label={t('places.newTagColor')}
            value={tags.newColor}
            onPick={tags.setNewColor}
            onPreview={tags.setNewColor}
            onClose={closePalette}
            className={PALETTE}
            t={t}
          />
        )}
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
        <span key={tag.id} className={SHEET_CHIP}>
          <TagIcon size={10} strokeWidth={2} className="flex-none" style={{ color: tag.color }} />
          <span dir="auto" className="truncate">
            {tag.name}
          </span>
        </span>
      ))}
    </div>
  );
}
