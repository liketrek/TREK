import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { helpApi, type HelpNavSection, type HelpPageData } from '../../api/client'

/** State + data loading for the in-app help wiki (see PATTERN.md). */
export function useHelp() {
  const { slug } = useParams<{ slug: string }>()
  const [sections, setSections] = useState<HelpNavSection[]>([])
  const [page, setPage] = useState<HelpPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState(false)
  const [query, setQuery] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    helpApi.index().then((d) => setSections(d.sections)).catch(() => setSections([]))
  }, [])

  const homeSlug = sections[0]?.pages[0]?.slug ?? 'Home'
  const activeSlug = slug ?? homeSlug

  useEffect(() => {
    let alive = true
    setLoading(true)
    setPageError(false)
    helpApi
      .page(activeSlug)
      .then((p) => {
        if (!alive) return
        setPage(p)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setPageError(true)
        setLoading(false)
      })
    contentRef.current?.scrollTo?.({ top: 0 })
    window.scrollTo?.({ top: 0 })
    setNavOpen(false)
    return () => {
      alive = false
    }
  }, [activeSlug])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sections
    return sections
      .map((s) => ({ ...s, pages: s.pages.filter((p) => p.title.toLowerCase().includes(q)) }))
      .filter((s) => s.pages.length > 0)
  }, [sections, query])

  return { page, loading, pageError, query, setQuery, navOpen, setNavOpen, contentRef, activeSlug, filtered }
}
