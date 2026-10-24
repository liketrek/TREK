import type { ResizeEdge, useDragResize } from '../../hooks/useDragResize';

/** The invisible grips of the floating assistant window (assistantFrame.ts) along its edges and corners. */

const EDGES: { edge: ResizeEdge; className: string; cursor: 'ns' | 'ew' | 'corner-start' | 'corner-end' }[] = [
  { edge: 'n', className: 'inset-x-3 -top-1 h-2', cursor: 'ns' },
  { edge: 's', className: 'inset-x-3 -bottom-1 h-2', cursor: 'ns' },
  { edge: 'start', className: 'inset-y-3 -start-1 w-2', cursor: 'ew' },
  { edge: 'end', className: 'inset-y-3 -end-1 w-2', cursor: 'ew' },
  { edge: 'n-start', className: '-start-1 -top-1 h-4 w-4', cursor: 'corner-start' },
  { edge: 's-end', className: '-bottom-1 -end-1 h-4 w-4', cursor: 'corner-start' },
  { edge: 'n-end', className: '-end-1 -top-1 h-4 w-4', cursor: 'corner-end' },
  { edge: 's-start', className: '-bottom-1 -start-1 h-4 w-4', cursor: 'corner-end' },
];

function edgeCursor(kind: (typeof EDGES)[number]['cursor'], rtl: boolean): string {
  if (kind === 'ns') return 'ns-resize';
  if (kind === 'ew') return 'ew-resize';
  // The top-start corner is the top left in a left-to-right page and the top right in Arabic.
  return (kind === 'corner-start') !== rtl ? 'nwse-resize' : 'nesw-resize';
}

/** The invisible grips along the frame's edges and corners. */
export default function AssistantFrameEdges({ frame }: { frame: ReturnType<typeof useDragResize> }) {
  const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
  return (
    <>
      {EDGES.map(({ edge, className, cursor }) => (
        <div
          key={edge}
          aria-hidden="true"
          {...frame.edgeProps(edge)}
          className={`absolute z-10 touch-none ${className}`}
          style={{ cursor: edgeCursor(cursor, rtl) }}
        />
      ))}
    </>
  );
}
