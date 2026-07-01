import React, { useEffect, useState } from 'react'
import { Bookmark, ArrowRight, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../i18n'
import { collectionsApi } from '../../api/collections'
import { entityGradient } from '../../utils/gradients'
import type { Collection } from '@trek/shared'

/**
 * Dashboard sidebar widget — a glassy `.tool` card that surfaces the user's
 * saved-place LISTS as compact colour-washed badges (a mini version of the
 * collections hero): each badge shows the list's cover image (tinted with its
 * colour) or a colour gradient, its name and place count, and jumps to that
 * list. Fetches only list() (per-list place_count), so no N+1.
 */
export default function CollectionsWidget({ onOpen }: { onOpen: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [lists, setLists] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await collectionsApi.list()
        if (!cancelled) setLists(data.collections)
      } catch {
        if (!cancelled) setLists([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="tool">
      <div className="tool-head">
        <div className="tool-title"><Bookmark size={14} /> {t('collections.widget.title')}</div>
        <button className="tool-action" aria-label={t('collections.widget.title')} onClick={onOpen}>
          <ArrowRight size={14} />
        </button>
      </div>
      {loading ? null : lists.length === 0 ? (
        <div className="col-empty">{t('collections.widget.empty')}</div>
      ) : (
        <div className="col-badges">
          {lists.slice(0, 6).map(list => (
            <button
              key={list.id}
              className="col-badge"
              style={{ ['--badge-color' as string]: list.color || '#6366f1' }}
              onClick={() => navigate(`/collections/${list.id}`)}
            >
              {list.cover_image
                ? <img className="col-badge-media" src={list.cover_image} alt="" />
                : <div className="col-badge-media" style={{ backgroundImage: entityGradient(list.id) }} />}
              <div className="col-badge-tint" />
              <div className="col-badge-body">
                <span className="col-badge-name">{list.name}</span>
                <span className="col-badge-count"><MapPin size={11} /> {list.place_count ?? 0}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
