interface MProgressProps {
  /** 0–100 */
  value: number
  /** Optional data-driven fill color (bag/category colors); defaults to --m-act. */
  color?: string
  /** Bar height in px: 5 is the --m-ic track canon, 4 the spotlight bar, 6 the bag bar. */
  height?: 4 | 5 | 6
  className?: string
}

const HEIGHT: Record<4 | 5 | 6, string> = {
  4: 'h-[4px]',
  5: 'h-[5px]',
  6: 'h-[6px]',
}

/** Thin progress bar on the neutral --m-ic track. */
export default function MProgress({ value, color, height = 5, className = '' }: MProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={`${HEIGHT[height]} w-full overflow-hidden rounded-full bg-[color:var(--m-ic)] ${className}`}>
      <div
        className="h-full rounded-full bg-m-act"
        style={{ width: `${clamped}%`, ...(color ? { background: color } : undefined) }}
      />
    </div>
  )
}
