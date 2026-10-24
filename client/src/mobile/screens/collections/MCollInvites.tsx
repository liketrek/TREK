import { Check } from 'lucide-react';
import type { IncomingCollectionInvite } from '../../../store/collectionStore';
import type { TranslationFn } from '../../../types';
import { CancelPill, Eyebrow, PrimaryPill } from './MCollSheetKit';

interface MCollInvitesProps {
  invites: IncomingCollectionInvite[];
  onAccept: (id: number) => void | Promise<void>;
  onDecline: (id: number) => void | Promise<void>;
  t: TranslationFn;
}

/**
 * Pending list invites as cards above the lists, with Accept / Decline. The
 * phone has no rail, so this is the one place an invite can be answered, and
 * where the invite notification lands (#2645).
 */
export default function MCollInvites({ invites, onAccept, onDecline, t }: MCollInvitesProps) {
  if (invites.length === 0) return null;
  return (
    <section aria-label={t('collections.invites.title')} className="mb-3 flex flex-col gap-2">
      <Eyebrow className="px-1">{t('collections.invites.title').toUpperCase()}</Eyebrow>
      {invites.map((inv) => (
        <div
          key={inv.collection_id}
          className="rounded-[18px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] p-[12px]"
        >
          <div className="truncate text-body font-bold text-m-ink">{inv.name}</div>
          <div className="mt-[2px] truncate font-geist text-caption text-m-muted">
            {t('collections.invites.from')} {inv.from.username}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <PrimaryPill onClick={() => void onAccept(inv.collection_id)}>
              <Check size={14} strokeWidth={2.4} /> {t('collections.invites.accept')}
            </PrimaryPill>
            <CancelPill onClick={() => void onDecline(inv.collection_id)}>
              {t('collections.invites.decline')}
            </CancelPill>
          </div>
        </div>
      ))}
    </section>
  );
}
