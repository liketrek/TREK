import { Check, Grid, Link, List, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';
import { journeyApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { copyText } from '../../utils/clipboard';
import { useToast } from '../shared/Toast';

export default function JourneyShareSection({ journeyId }: { journeyId: number }) {
  const { t } = useTranslation();
  const [link, setLink] = useState<{
    token: string;
    share_timeline: boolean;
    share_gallery: boolean;
    share_map: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  /** The share token is the owner's to manage; a contributor is refused. */
  const [manageable, setManageable] = useState(true);
  const toast = useToast();

  useEffect(() => {
    journeyApi
      .getShareLink(journeyId)
      .then((d) => setLink(d.link || null))
      .catch((err: { response?: { status?: number } }) => {
        // A 403 is the server saying this is not yours to manage. Showing the
        // section anyway would offer an editor a "create link" button that is
        // refused the moment they press it.
        if (err?.response?.status === 403) setManageable(false);
      })
      .finally(() => setLoading(false));
  }, [journeyId]);

  const createLink = async () => {
    try {
      const res = await journeyApi.createShareLink(journeyId, {
        share_timeline: true,
        share_gallery: true,
        share_map: true,
      });
      setLink({ token: res.token, share_timeline: true, share_gallery: true, share_map: true });
      toast.success(t('journey.share.linkCreated'));
    } catch {
      toast.error(t('journey.share.createFailed'));
    }
  };

  const togglePerm = async (key: 'share_timeline' | 'share_gallery' | 'share_map') => {
    if (!link) return;
    const previous = link;
    const updated = { ...link, [key]: !link[key] };
    setLink(updated);
    try {
      await journeyApi.createShareLink(journeyId, {
        share_timeline: updated.share_timeline,
        share_gallery: updated.share_gallery,
        share_map: updated.share_map,
      });
    } catch {
      setLink(previous);
      toast.error(t('journey.share.updateFailed'));
    }
  };

  const deleteLink = async () => {
    try {
      await journeyApi.deleteShareLink(journeyId);
      setLink(null);
      toast.success(t('journey.share.linkDeleted'));
    } catch {
      toast.error(t('journey.share.deleteFailed'));
    }
  };

  const shareUrl = link ? `${window.location.origin}/public/journey/${link.token}` : '';

  const copyLink = async () => {
    if (!(await copyText(shareUrl))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !manageable) return null;

  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
        {t('journey.share.publicShare')}
      </label>

      {!link ? (
        <button
          type="button"
          onClick={createLink}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 py-2.5 text-[12px] font-medium text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
        >
          <Link size={14} /> {t('journey.share.createLink')}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {/* URL + Copy */}
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-800">
            <Link size={13} className="ml-1.5 flex-shrink-0 text-zinc-400" />
            <span className="flex-1 truncate text-[11px] text-zinc-600 dark:text-zinc-400">{shareUrl}</span>
            <button
              type="button"
              onClick={copyLink}
              className="flex-shrink-0 rounded-full bg-zinc-900 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {copied ? t('journey.share.copied') : t('journey.share.copy')}
            </button>
            <button
              type="button"
              onClick={deleteLink}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {t('share.deleteLink')}
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
                type="button"
                key={key}
                onClick={() => togglePerm(key)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[12px] font-medium transition-all ${
                  link[key]
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                    : 'border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-700'
                }`}
              >
                <Icon size={13} />
                {label}
                {link[key] && <Check size={12} className="ml-auto" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
