import { useEffect, useRef } from 'react'

export function ScrollTrigger({ onVisible, loading }: { onVisible: () => void; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  // Both callers hand in a fresh arrow on every render — the picker its
  // loadMorePhotos, the gallery its setVisibleCount step. With onVisible in the
  // effect deps, every unrelated re-render tore the observer down and observed
  // again, and each observe() replays the initial callback. The ref keeps the
  // observer out of that churn.
  //
  // loading stays a dependency on purpose: re-observing after a page has landed
  // is the only thing that still produces a callback when the sentinel never
  // left the 200px margin.
  const onVisibleRef = useRef(onVisible)
  onVisibleRef.current = onVisible
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !loading) onVisibleRef.current() }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loading])
  return (
    <div ref={ref} className="flex justify-center py-4 mt-2">
      <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-white rounded-full animate-spin" />
    </div>
  )
}
