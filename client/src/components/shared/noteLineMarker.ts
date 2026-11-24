export type LineMarker = 'bullet' | 'ordered' | 'quote';

const PATTERN: Record<LineMarker, RegExp> = {
  bullet: /^- /,
  ordered: /^\d+\. /,
  quote: /^> /,
};

const FIXED_PREFIX: Record<Exclude<LineMarker, 'ordered'>, string> = {
  bullet: '- ',
  quote: '> ',
};

export interface LineMarkerResult {
  value: string;
  selection: [number, number];
}

/** The number an ordered item gets when it is added right below `lineStart`'s previous line. */
function nextNumberAt(value: string, lineStart: number): number {
  if (lineStart === 0) return 1;
  const prevStart = value.lastIndexOf('\n', lineStart - 2) + 1;
  const match = /^(\d+)\. /.exec(value.slice(prevStart, lineStart - 1));
  return match ? Number(match[1]) + 1 : 1;
}

/**
 * Adds or removes a line marker (bullet, number, quote) on every line the
 * selection touches.
 *
 * Numbers continue from the item above, so pressing the button on each new
 * line writes 1. 2. 3. instead of 1. 1. 1. Markdown renders both the same,
 * but the field is what people read while they write. A selection over several
 * lines is formatted line by line and skips the blank ones in between.
 */
export function toggleLineMarker(value: string, start: number, end: number, marker: LineMarker): LineMarkerResult {
  const blockStart = value.lastIndexOf('\n', start - 1) + 1;
  // A selection that ends right after a newline stops on the line above it.
  const last = end > start && value[end - 1] === '\n' ? end - 1 : end;
  const newline = value.indexOf('\n', last);
  const blockEnd = newline === -1 ? value.length : newline;

  const lines = value.slice(blockStart, blockEnd).split('\n');
  const multi = lines.length > 1;
  const formats = (line: string) => !multi || line.trim() !== '';
  const pattern = PATTERN[marker];
  const remove = lines.some(formats) && lines.filter(formats).every((line) => pattern.test(line));

  let number = nextNumberAt(value, blockStart);
  const next = lines.map((line) => {
    if (!formats(line)) return line;
    if (remove) return line.replace(pattern, '');
    if (marker === 'ordered') return `${number++}. ${line.replace(pattern, '')}`;
    return pattern.test(line) ? line : FIXED_PREFIX[marker] + line;
  });

  const block = next.join('\n');
  const result = value.slice(0, blockStart) + block + value.slice(blockEnd);

  if (multi) return { value: result, selection: [blockStart, blockStart + block.length] };
  // One line: the caret moves with the text, never in front of the line.
  const shift = block.length - (blockEnd - blockStart);
  return { value: result, selection: [Math.max(blockStart, start + shift), Math.max(blockStart, end + shift)] };
}
