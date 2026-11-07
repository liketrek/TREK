import type { CollectionLabel, CollectionPlace } from '@trek/shared';
import React, { createElement, useEffect, useRef, useState } from 'react';
import { getCategoryIcon } from '../shared/categoryIcons';
import { Tooltip } from '../shared/Tooltip';

/**
 * One observer for every row and chip of a list, so a list of hundreds of places does
 * not hold one per element. An element starts with one notification once observed.
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
 * A chip's own width, also while the row squeezes it: the part its name is cut short by
 * is the name's scroll width over its box, up to the widest the chip may grow.
 */
const naturalWidth = (el: HTMLElement): number => {
  const text = el.querySelector<HTMLElement>('.col-lrow-txt');
  const full = el.offsetWidth + (text ? text.scrollWidth - text.clientWidth : 0);
  const cap = parseFloat(getComputedStyle(el).maxWidth);
  return Number.isFinite(cap) ? Math.min(full, cap) : full;
};

/**
 * How many labels fit beside the category in `row`: as many as it holds with room left
 * for the "+N" chip, and at least one, which then shortens its name. Every label is in
 * the row, the ones that do not fit kept out of sight, so each can be measured.
 */
function labelsThatFit(row: HTMLElement): number {
  const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const labels = Array.from(row.querySelectorAll<HTMLElement>('.col-lrow-label'));
  const fixed = Array.from(row.querySelectorAll<HTMLElement>('.col-lrow-cat, .col-lrow-div'))
    .filter((el) => el.offsetWidth > 0)
    .reduce((sum, el) => sum + naturalWidth(el) + gap, 0);
  let used = fixed;
  let fit = 0;
  for (let i = 0; i < labels.length; i++) {
    const left = labels.length - i - 1;
    const need = used + naturalWidth(labels[i]) + (left > 0 ? gap + MORE_CHIP : 0);
    if (need > row.clientWidth && i > 0) break;
    used += naturalWidth(labels[i]) + gap;
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
  const labelKey = labels.map((l) => `${l.id}:${l.name}`).join('|');
  const categoryName = place.category?.name ?? null;

  // Fitted on every change of the row's width and once more whenever its labels change:
  // observing anew hands the observer's first notification to the new labels.
  useEffect(() => {
    const row = ref.current;
    if (!row) return undefined;
    return watchSize(row, () => setFit(labelsThatFit(row)));
  }, [labelKey, categoryName]);

  if (!labels.length && !categoryName) return null;
  const shown = Math.min(labels.length, Math.max(1, fit));
  const hidden = labels.slice(shown);

  return (
    <div ref={ref} className="col-lrow-tags">
      {categoryName && (
        <ChipTooltip label={categoryName}>
          <span className="col-lrow-cat" style={{ ['--cat' as string]: place.category?.color || '#6366f1' }}>
            {createElement(getCategoryIcon(place.category?.icon ?? undefined), { size: 11 })}{' '}
            <span className="col-lrow-txt">{categoryName}</span>
          </span>
        </ChipTooltip>
      )}
      {labels.map((l, i) => (
        <ChipTooltip key={l.id} label={l.name}>
          <span
            className={i < shown ? 'col-lrow-label' : 'col-lrow-label is-over'}
            style={{ ['--label' as string]: l.color || 'var(--accent)' }}
            aria-hidden={i < shown ? undefined : true}
          >
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
