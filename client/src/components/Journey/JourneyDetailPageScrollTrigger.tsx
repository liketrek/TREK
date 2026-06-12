import { useEffect, useRef } from 'react'

export function ScrollTrigger({ onVisible, loading }: { onVisible: () => void; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting && !loading) onVisible() }, { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [onVisible, loading])
  return (
    <div ref={ref} className="flex justify-center py-4 mt-2">
      <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-600 dark:border-t-white rounded-full animate-spin" />
    </div>
  )
}
