import { useEffect, useState } from 'react';

import { journeyApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { copyText } from '../../utils/clipboard';
import { useToast } from '../shared/Toast';

export interface JourneyShareLink {
  token: string;
  share_timeline: boolean;
  share_gallery: boolean;
  share_map: boolean;
}

export type JourneySharePermission = 'share_timeline' | 'share_gallery' | 'share_map';

/** The public address of a journey share token. */
export function journeyShareUrl(link: JourneyShareLink | null, origin: string): string {
  return link ? `${origin}/public/journey/${link.token}` : '';
}

/**
 * A journey's public share link, behind both the desktop share section and the phone
 * settings sheet, which render their own markup over it: load it, create it with every
 * section shared, switch a section on or off (rolled back when the server refuses),
 * delete it and copy its address.
 */
export function useJourneyShareLink(journeyId: number) {
  const { t } = useTranslation();
  const toast = useToast();
  const [link, setLink] = useState<JourneyShareLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  /** The share token is the owner's to manage; a contributor is refused. */
  const [manageable, setManageable] = useState(true);

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

  const togglePerm = async (key: JourneySharePermission) => {
    if (!link) return;
    const previous = link;
    const updated = { ...previous, [key]: !previous[key] };
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

  const shareUrl = journeyShareUrl(link, window.location.origin);

  const copyLink = async () => {
    if (!(await copyText(shareUrl))) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return { link, loading, manageable, copied, shareUrl, createLink, togglePerm, deleteLink, copyLink };
}
