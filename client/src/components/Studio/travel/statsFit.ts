import type { BookMetric } from '@trek/shared';

/**
 * How the figures of a summary are measured: the size a line of them fits a
 * box at, and how a set divides into rows and columns. Shared by every look,
 * so a figure reads the same size whichever look it is set in.
 */

/** One figure as it is printed. */
export interface Figure {
  metric: BookMetric;
  value: string;
  unit: string;
  label: string;
}

/**
 * The size a line of figures can be set at to fit a box: as tall as the box
 * allows and no wider than it. A figure is about six tenths of an em wide per
 * character in the faces Studio offers, which is what the estimate rests on.
 */
export function fitType(chars: number, boxW: number, boxH: number): number {
  return Math.max(1.2, Math.min(boxH, boxW / (0.6 * Math.max(2, chars))));
}

export const chars = (f: Figure) => f.value.length + (f.unit ? f.unit.length * 0.45 + 0.3 : 0);

/** The size every figure of a set fits at, so a set reads as one size. */
export const fitAll = (figures: Figure[], boxW: number, boxH: number) =>
  figures.reduce((size, f) => Math.min(size, fitType(chars(f), boxW, boxH)), boxH);

/** The size a caption fits at: bold small capitals with their tracking need almost an em a letter. */
export const fitCaption = (labels: string[], boxW: number, cap: number) =>
  Math.max(1, Math.min(cap, boxW / (0.98 * Math.max(4, ...labels.map((l) => l.length)))));

/** The rows and columns a set of figures divides into: a row of three, a square of four, two rows of three. */
export function gridOf(n: number): { cols: number; rows: number } {
  const cols = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4;
  return { cols: Math.max(1, cols), rows: Math.max(1, Math.ceil(n / Math.max(1, cols))) };
}
