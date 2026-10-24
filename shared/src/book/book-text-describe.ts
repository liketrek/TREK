import type { BookTextEffects } from './book-text-effects.schema';

/**
 * A text's effects in words, for `describe_book_page`: what a model that
 * cannot see the page needs to know to keep or change them, in the terms the
 * `style` operation sets them by. Empty for a text without any.
 */

const n = (v: number) => `${Math.round(v * 10) / 10}`;

const CASES: Record<string, string> = { upper: 'capitals', lower: 'lower case', smallcaps: 'small caps' };

function stopWords(stops: readonly { color: string }[]): string {
  return `from ${stops[0]?.color ?? ''} to ${stops[stops.length - 1]?.color ?? ''}`;
}

function fillWords(fill: NonNullable<BookTextEffects['fillPaint']>): string {
  if (fill.type === 'photo') {
    return `letters filled with photo ${fill.photoId} (focal ${fill.focalX.toFixed(2)}/${fill.focalY.toFixed(2)}, zoom ${n(fill.zoom)})`;
  }
  if (fill.type === 'linear') return `letters in a linear gradient at ${n(fill.angle)} deg, ${stopWords(fill.stops)}`;
  if (fill.type === 'radial') return `letters in a radial gradient, ${stopWords(fill.stops)}`;
  if (fill.type === 'pattern') {
    return `letters patterned ${fill.pattern} in ${fill.fg} on ${fill.bg ?? 'clear'} at scale ${n(fill.scale)}`;
  }
  return fill.alpha === 0 ? 'hollow letters (outline only)' : `fill ${fill.color} at alpha ${n(fill.alpha)}`;
}

export function bookTextEffectWords(el: BookTextEffects & { size: number }): string {
  const parts: string[] = [];
  const cased = el.transform ? CASES[el.transform] : undefined;
  if (cased) parts.push(cased);
  if (el.vAlign && el.vAlign !== 'top') parts.push(`set at the ${el.vAlign} of its frame`);
  if (el.fillPaint) parts.push(fillWords(el.fillPaint));
  if (el.outline) parts.push(`outline ${el.outline.color} ${n(el.outline.width)} mm`);
  if (el.shadow) {
    parts.push(`hard shadow ${el.shadow.color} offset ${n(el.shadow.dx)}/${n(el.shadow.dy)} mm`);
  }
  if (el.highlight) parts.push(`on a band of ${el.highlight.color}`);
  if (el.curve?.type === 'arc') parts.push(`on an arc, bend ${n(el.curve.bend)}`);
  if (el.curve?.type === 'circle') parts.push(`round a circle, centred at ${n(el.curve.start)} deg`);
  if (el.fit === 'shrink') parts.push(`shrunk to fit (chosen ${n(el.fitMax ?? el.size)} pt)`);
  return parts.join(', ');
}
