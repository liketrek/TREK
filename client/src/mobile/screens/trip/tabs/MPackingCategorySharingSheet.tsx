import type { PackingVisibility } from '@trek/shared';
import { Check, type LucideIcon, Share2, UserRound, Users } from 'lucide-react';

import type { PackingCategorySharing } from '../../../../components/Packing/usePackingCategorySharing';
import type { TripMember } from '../../../../types';
import MSheet from '../../../components/MSheet';
import type { TripPlanner } from '../MTripShell';
import { FormSheetBody, FormSheetFooter, FormSheetHeader } from '../sheets/PlSheetChrome';

/**
 * The phone's choice of one sharing tier for a whole packing list (#2961), the
 * counterpart of the desktop dialog on the same hook: the three tiers of an
 * item's own sharing control stacked as rows, the people under the third, and a
 * note on the items that belong to someone else.
 */
export default function MPackingCategorySharingSheet({
  sharing,
  tripMembers,
  currentUserId,
  t,
}: {
  sharing: PackingCategorySharing;
  tripMembers: TripMember[];
  currentUserId: number | null;
  t: TripPlanner['t'];
}) {
  const { category, visibility, recipientIds, ownCount, othersCount, busy, ready } = sharing;
  const others = tripMembers.filter((m) => m.id !== currentUserId);
  const needsPeople = visibility === 'shared' && others.length > 0 && recipientIds.length === 0;

  const tier = (value: PackingVisibility, Icon: LucideIcon, label: string, hint?: string) => {
    const on = visibility === value;
    return (
      <button
        type="button"
        aria-pressed={on}
        disabled={ownCount === 0}
        onClick={() => sharing.setVisibility(value)}
        className={`flex items-center gap-[10px] rounded-[10px] px-[10px] py-[9px] text-start disabled:opacity-50 ${on ? 'bg-m-card' : ''}`}
      >
        <Icon size={15} strokeWidth={2} className={`flex-none ${on ? 'text-m-ink' : 'text-m-muted'}`} />
        <span className="min-w-0 flex-1">
          <span className="block text-[0.8125rem] font-semibold text-m-ink">{label}</span>
          {hint && <span className="block font-geist text-[0.6875rem] text-m-faint">{hint}</span>}
        </span>
        {on && <Check size={14} strokeWidth={2.4} className="flex-none text-m-ink" />}
      </button>
    );
  };

  const note = (text: string) => (
    <p className="mt-3 font-geist text-[0.6875rem] leading-relaxed text-m-muted">{text}</p>
  );

  return (
    <MSheet open={category != null} onClose={sharing.close} form ariaLabel={t('packing.menuShareCat')}>
      <FormSheetHeader
        icon={Share2}
        title={t('packing.menuShareCat')}
        subtitle={category}
        onClose={sharing.close}
        closeLabel={t('common.close')}
      />

      <FormSheetBody>
        <p className="mb-3 font-geist text-[0.71875rem] leading-relaxed text-m-muted">
          {ownCount === 0 ? t('packing.shareCat.noneOwn') : t('packing.shareCat.hint')}
        </p>

        <div className="flex flex-col gap-1 rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[6px]">
          {tier('common', Users, t('packing.viewCommon'), t('packing.tierCommonHint'))}
          {tier('personal', UserRound, t('packing.tierPersonal'), t('packing.tierPersonalHint'))}
          {tier('shared', Share2, t('packing.tierShared'))}
          {visibility === 'shared' &&
            (others.length === 0 ? (
              <div className="px-[10px] py-1 ps-9 font-geist text-[0.6875rem] text-m-faint">
                {t('packing.noOneToShare')}
              </div>
            ) : (
              others.map((m) => {
                const picked = recipientIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => sharing.toggleRecipient(m.id)}
                    className="flex items-center gap-[8px] rounded-[9px] py-[7px] pe-[10px] ps-9 text-start"
                  >
                    <span className="min-w-0 flex-1 truncate text-[0.78125rem] font-semibold text-m-ink">
                      {m.username}
                    </span>
                    {picked && <Check size={14} strokeWidth={2.4} className="flex-none text-m-ink" />}
                  </button>
                );
              })
            ))}
        </div>

        {needsPeople && note(t('packing.shareCat.pickPeople'))}
        {ownCount > 0 && othersCount > 0 && note(t('packing.shareCat.othersKept'))}
      </FormSheetBody>

      <FormSheetFooter
        onCancel={sharing.close}
        cancelLabel={t('common.cancel')}
        onSubmit={() => void sharing.apply()}
        submitLabel={t('packing.shareCat.apply')}
        submitDisabled={!ready}
      />
    </MSheet>
  );
}
