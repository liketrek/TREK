import { useEffect, useState } from 'react'
import { Link, List, Grid, MapPin, Check } from 'lucide-react'
import { journeyApi } from '../../api/client'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'

export default function JourneyShareSection({ journeyId }: { journeyId: number }) {
  const { t } = useTranslation()
  const [link, setLink] = useState<{ token: string; share_timeline: boolean; share_gallery: boolean; share_map: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const toast = useToast()

  useEffect(() => {
    journeyApi.getShareLink(journeyId).then(d => setLink(d.link || null)).catch(() => {}).finally(() => setLoading(false))
  }, [journeyId])

  const createLink = async () => {
    try {
      const res = await journeyApi.createShareLink(journeyId, { share_timeline: true, share_gallery: true, share_map: true })
      setLink({ token: res.token, share_timeline: true, share_gallery: true, share_map: true })
      toast.success(t('journey.share.linkCreated'))
    } catch { toast.error(t('journey.share.createFailed')) }
  }

  const togglePerm = async (key: 'share_timeline' | 'share_gallery' | 'share_map') => {
    if (!link) return
    const updated = { ...link, [key]: !link[key] }
    setLink(updated)
    try {
      await journeyApi.createShareLink(journeyId, { share_timeline: updated.share_timeline, share_gallery: updated.share_gallery, share_map: updated.share_map })
    } catch { setLink(link); toast.error(t('journey.share.updateFailed')) }
  }

  const deleteLink = async () => {
    try {
      await journeyApi.deleteShareLink(journeyId)
      setLink(null)
      toast.success(t('journey.share.linkDeleted'))
    } catch { toast.error(t('journey.share.deleteFailed')) }
  }

  const shareUrl = link ? `${window.location.origin}/public/journey/${link.token}` : ''

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return null

  return (
    <div>
      <label className="text-[10px] font-semibold tracking-[0.12em] uppercase text-zinc-500 block mb-2">{t('journey.share.publicShare')}</label>

      {!link ? (
        <button
          onClick={createLink}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 text-[12px] font-medium text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300 transition-colors"
        >
          <Link size={14} /> {t('journey.share.createLink')}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {/* URL + Copy */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <Link size={13} className="text-zinc-400 flex-shrink-0" />
            <span className="flex-1 text-[11px] text-zinc-600 dark:text-zinc-400 truncate">{shareUrl}</span>
            <button
              onClick={copyLink}
              className="flex-shrink-0 px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[11px] font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200"
            >
              {copied ? t('journey.share.copied') : t('journey.share.copy')}
            </button>
          </div>

          {/* Permission toggles */}
          <div className="flex flex-col gap-1.5">
            {[
              { key: 'share_timeline' as const, label: t('journey.share.timeline'), icon: List },
              { key: 'share_gallery' as const, label: t('journey.share.gallery'), icon: Grid },
              { key: 'share_map' as const, label: t('journey.share.map'), icon: MapPin },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => togglePerm(key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${
                  link[key]
                    ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400'
                }`}
              >
                <Icon size={13} />
                {label}
                {link[key] && <Check size={12} className="ml-auto" />}
              </button>
            ))}
          </div>

          {/* Delete link */}
          <button
            onClick={deleteLink}
            className="text-[11px] font-medium text-red-500 hover:text-red-600 self-start"
          >
            {t('share.deleteLink')}
          </button>
        </div>
      )}
    </div>
  )
}
