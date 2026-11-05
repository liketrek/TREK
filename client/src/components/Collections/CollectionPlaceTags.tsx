import type { CollectionLabel, CollectionPlace } from '@trek/shared';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getCategoryIcon } from '../shared/categoryIcons';
import { Tooltip } from '../shared/Tooltip';

/**
 * One observer for every row and chip of a list, so a list of hundreds of places does
 * not hold one per element.
 */
const sizeWatch = new Map<Element, () => void>();
let sizeObserver: ResizeObserver | null = null;
function watchSize(el: Element, onResize: () => void): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {};
  sizeObserver ??= new ResizeObserver((entries) => {
    for (const entry of entries) sizeWatch.get(entry.target)?.();
  });
  sizeWatch.set(el, onResize);
  sizeObserver.observe(el);
  return () => {
    sizeWatch.delete(el);
    sizeObserver?.unobserve(el);
  };
}

/**
 * The tooltip of a label or category chip: only while the chip cuts its name short,
 * since one repeating the words on screen says nothing.
 */
function ChipTooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>>;
}): React.ReactElement {
  const [cut, setCut] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const text = ref.current?.querySelector('.col-lrow-txt');
    if (!text) return undefined;
    return watchSize(text, () => setCut(text.scrollWidth > text.clientWidth + 1));
  }, []);
  return (
    <Tooltip label={label} placement="top" disabled={!cut}>
      {React.cloneElement(children, { ref })}
    </Tooltip>
  );
}

/** The room a "+N" chip takes, held free while the labels are fitted. */
const MORE_CHIP = 34;

/**
 * How many labels fit beside the category in `row`, measured with every label drawn at
 * its own width: as many as the row holds with room left for the "+N" chip, and at
 * least one, which then shortens its name.
 */
function labelsThatFit(row: HTMLElement): number {
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const labels = Array.from(row.querySelectorAll<HTMLElement>('.col-lrow-label'));
  const fixed = Array.from(row.querySelectorAll<HTMLElement>('.col-lrow-cat, .col-lrow-div'))
    .filter((el) => el.offsetWidth > 0)
    .reduce((sum, el) => sum + el.offsetWidth + gap, 0);
  let used = fixed;
  let fit = 0;
  for (let i = 0; i < labels.length; i++) {
    const left = labels.length - i - 1;
    const need = used + labels[i].offsetWidth + (left > 0 ? gap + MORE_CHIP : 0);
    if (need > row.clientWidth && i > 0) break;
    used += labels[i].offsetWidth + gap;
    fit = i + 1;
  }
  return fit;
}

/**
 * A place row's category and labels, on one line that never wraps (#2981). The category
 * comes first, then as many labels as the row has room for, then a "+N" chip naming the
 * rest in its tooltip, so a wide list shows every label and a narrow one the first.
 */
export default function CollectionPlaceTags({
  place,
  labels,
}: {
  place: CollectionPlace;
  labels: CollectionLabel[];
}): React.ReactElement | null {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(labels.length);
  const [measuring, setMeasuring] = useState(true);
  const labelKey = labels.map((l) => `${l.id}:${l.name}`).join('|');
  const category = place.category?.name ? place.category : null;

  useLayoutEffect(() => {
    setMeasuring(true);
  }, [labelKey, category?.name]);

  useLayoutEffect(() => {
    const row = ref.current;
    if (!measuring || !row) return;
    setFit(labelsThatFit(row));
    setMeasuring(false);
  }, [measuring]);

  useEffect(() => {
    const row = ref.current;
    if (!row) return undefined;
    let width = row.clientWidth;
    return watchSize(row, () => {
      if (row.clientWidth === width) return;
      width = row.clientWidth;
      setMeasuring(true);
    });
  }, []);

  if (!labels.length && !category) return null;
  const shown = measuring ? labels : labels.slice(0, Math.max(1, fit));
  const hidden = labels.slice(shown.length);
  const CatIcon = category ? getCategoryIcon(category.icon ?? undefined) : null;

  return (
    <div ref={ref} className={`col-lrow-tags${measuring ? 'measuring' : ''}`}>
      {category && CatIcon && (
        <ChipTooltip label={category.name}>
          <span className="col-lrow-cat" style={{ ['--cat' as string]: category.color || '#6366f1' }}>
            <CatIcon size={11} /> <span className="col-lrow-txt">{category.name}</span>
          </span>
        </ChipTooltip>
      )}
      {shown.map((l) => (
        <ChipTooltip key={l.id} label={l.name}>
          <span className="col-lrow-label" style={{ ['--label' as string]: l.color || 'var(--accent)' }}>
            <span className="col-labelchip-dot" /> <span className="col-lrow-txt">{l.name}</span>
          </span>
        </ChipTooltip>
      ))}
      {hidden.length > 0 && (
        <Tooltip label={hidden.map((l) => l.name).join(', ')} placement="top">
          <span className="col-lrow-more">+{hidden.length}</span>
        </Tooltip>
      )}
      <span className="col-lrow-div" aria-hidden />
    </div>
  );
}
