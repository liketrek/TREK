import type { PackingVisibility } from '@trek/shared';
import { Check, Loader2, Share2, UserRound, Users } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import { useTranslation } from '../../i18n';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../shared/DialogShell';
import type { PackingCategorySharing } from './usePackingCategorySharing';
import type { TripMember } from './usePackingListPanel';

/**
 * The desktop's choice of one sharing tier for a whole packing list (#2961): the
 * same three tiers as an item's own sharing control, the people to share with
 * under the third, and a note on the items that belong to someone else.
 */
export default function PackingCategorySharingDialog({
  sharing,
  tripMembers,
  currentUserId,
}: {
  sharing: PackingCategorySharing;
  tripMembers: TripMember[];
  currentUserId: number | null | undefined;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const { category, visibility, recipientIds, ownCount, othersCount, busy, ready } = sharing;
  const others = tripMembers.filter((m) => m.id !== currentUserId);
  const needsPeople = visibility === 'shared' && others.length > 0 && recipientIds.length === 0;

  const tier = (value: PackingVisibility, icon: ReactNode, label: string, hint?: string) => {
    const on = visibility === value;
    return (
      <button
        type="button"
        aria-pressed={on}
        disabled={ownCount === 0}
        onClick={() => sharing.setVisibility(value)}
        className={`flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 py-2 text-start disabled:opacity-50 ${on ? 'bg-surface-card shadow-sm' : 'enabled:hover:bg-surface-card'}`}
      >
        <span className={`flex-none ${on ? 'text-content' : 'text-content-muted'}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-content" style={fs(13, 'body')}>
            {label}
          </span>
          {hint && (
            <span className="block text-content-faint" style={fs(11.5)}>
              {hint}
            </span>
          )}
        </span>
        {on && <Check size={14} className="flex-none text-content-muted" />}
      </button>
    );
  };

  return (
    <DialogShell
      open={category != null}
      onClose={sharing.close}
      labelledBy={labelId}
      width="narrow"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <Share2 size={20} strokeWidth={1.9} className="text-content-muted" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={sharing.close}
          eyebrow={t('packing.menuShareCat')}
          title={category}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={sharing.close} disabled={busy}>
            {t('common.cancel')}
          </DialogButton>
          <DialogButton
            variant="primary"
            onClick={() => void sharing.apply()}
            disabled={!ready}
            icon={busy ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {t('packing.shareCat.apply')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <p className="m-0 text-content-muted" style={fs(12.5, 'body')}>
        {ownCount === 0 ? t('packing.shareCat.noneOwn') : t('packing.shareCat.hint')}
      </p>

      <div className="flex flex-col gap-0.5 rounded-[14px] border border-edge-faint bg-surface-secondary p-1.5">
        {tier('common', <Users size={15} />, t('packing.viewCommon'), t('packing.tierCommonHint'))}
        {tier('personal', <UserRound size={15} />, t('packing.tierPersonal'), t('packing.tierPersonalHint'))}
        {tier('shared', <Share2 size={15} />, t('packing.tierShared'))}
        {visibility === 'shared' && (
          <div className="flex flex-col gap-0.5 ps-6">
            {others.length === 0 ? (
              <p className="m-0 px-3 py-2 text-content-faint" style={fs(12, 'body')}>
                {t('packing.noOneToShare')}
              </p>
            ) : (
              others.map((m) => {
                const picked = recipientIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => sharing.toggleRecipient(m.id)}
                    className="flex min-h-[40px] items-center gap-3 rounded-[10px] px-3 py-1.5 text-start hover:bg-surface-card"
                  >
                    <span className="min-w-0 flex-1 truncate text-content" style={fs(13, 'body')}>
                      {m.username}
                    </span>
                    <span
                      className={`grid h-6 w-6 flex-none place-items-center rounded-[8px] ${picked ? 'bg-accent text-accent-text' : 'border border-edge bg-surface-card text-transparent'}`}
                    >
                      <Check size={13} />
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {needsPeople && (
        <p className="m-0 text-content-faint" style={fs(12, 'body')}>
          {t('packing.shareCat.pickPeople')}
        </p>
      )}
      {ownCount > 0 && othersCount > 0 && (
        <p className="m-0 text-content-faint" style={fs(12, 'body')}>
          {t('packing.shareCat.othersKept')}
        </p>
      )}
    </DialogShell>
  );
}
