import { COLLECTION_STATUSES, type CollectionStatus } from '@trek/shared';
import { Bookmark, CheckCircle2, Circle, type LucideIcon } from 'lucide-react';

/**
 * How a saved place's status looks wherever it shows: its icon, its name and
 * its colour, on the Collections page, on the phone and in the assistant's
 * cards alike. Pure presentation data, so a component of any layer reads it.
 */

interface StatusMeta {
  icon: LucideIcon;
  /** i18n key for the human label. */
  labelKey: string;
  /** CSS colour token for the badge on a light/surface background. */
  color: string;
  /** Brighter variant for a pill sitting over a photo cover / the hero scrim. */
  coverColor: string;
}

export const STATUS_META: Record<CollectionStatus, StatusMeta> = {
  idea: { icon: Circle, labelKey: 'collections.status.idea', color: 'var(--text-muted)', coverColor: '#e5e7eb' },
  want: { icon: Bookmark, labelKey: 'collections.status.want', color: 'var(--accent)', coverColor: '#c7d2fe' },
  visited: {
    icon: CheckCircle2,
    labelKey: 'collections.status.visited',
    color: 'var(--success)',
    coverColor: '#6ee7b7',
  },
};

/** Stable order for the filter chips + the one-tap cycle. */
export const STATUS_ORDER: CollectionStatus[] = [...COLLECTION_STATUSES];

/** idea → want → visited → idea */
export function nextStatus(status: CollectionStatus): CollectionStatus {
  const i = STATUS_ORDER.indexOf(status);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}
