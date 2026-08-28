import type { GuestIdentityTransferCandidate } from '@trek/shared';
import React, { useEffect, useState } from 'react';

import { tripsApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';

export default function GuestIdentityTransferModal({
  tripId,
  open,
  candidates: initialCandidates,
  onClose,
  onTransferred,
}: {
  tripId: number | string;
  open: boolean;
  candidates?: GuestIdentityTransferCandidate[];
  onClose: () => void;
  onTransferred?: () => void;
}): React.ReactElement | null {
  const { t } = useTranslation();
  const toast = useToast();
  const [candidates, setCandidates] = useState<GuestIdentityTransferCandidate[]>(initialCandidates ?? []);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || initialCandidates) return;
    tripsApi
      .guestIdentityTransferCandidates(tripId)
      .then((result) => setCandidates(result.candidates))
      .catch(() => setCandidates([]));
  }, [initialCandidates, open, tripId]);
  if (!open) return null;

  const transfer = async (candidate: GuestIdentityTransferCandidate) => {
    if (candidate.conflicts.length > 0) return;
    setBusy(true);
    try {
      await tripsApi.transferGuestIdentity(tripId, candidate.guest_user_id);
      toast.success(t('members.identityTransfer.success'));
      window.dispatchEvent(new CustomEvent('guest:identity-transferred'));
      onTransferred?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('members.identityTransfer.error'));
    } finally {
      setBusy(false);
    }
  };

  const impacts = (candidate: GuestIdentityTransferCandidate) =>
    [
      ['expenses', candidate.impact.expenses],
      ['payments', candidate.impact.payments],
      ['itinerary', candidate.impact.itinerary],
      ['bookings', candidate.impact.bookings],
      ['todos', candidate.impact.todos],
      ['packing', candidate.impact.packing],
      ['ratings', candidate.impact.ratings],
    ] as const;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('members.identityTransfer.title')}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-surface p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-content">{t('members.identityTransfer.title')}</h2>
            <p className="mt-1 text-sm text-content-muted">{t('members.identityTransfer.description')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="text-xl text-content-muted">
            ×
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {candidates.map((candidate) => (
            <div key={candidate.guest_user_id} className="bg-surface-subtle rounded-xl border border-edge p-4">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-content">{candidate.name}</strong>
                <button
                  type="button"
                  disabled={busy || candidate.conflicts.length > 0}
                  onClick={() => transfer(candidate)}
                  className="rounded-lg bg-content px-3 py-2 text-xs font-semibold text-surface disabled:opacity-40"
                >
                  {t('members.identityTransfer.thisIsMe')}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {impacts(candidate)
                  .filter(([, count]) => count > 0)
                  .map(([key, count]) => (
                    <span
                      key={key}
                      className="rounded-full border border-edge px-2 py-1 text-[0.65rem] text-content-muted"
                    >
                      {t(`members.identityTransfer.impact.${key}`, { count })}
                    </span>
                  ))}
              </div>
              {candidate.impact.rating_overlaps > 0 && (
                <p className="mt-2 text-xs text-content-muted">
                  {t('members.identityTransfer.ratingOverlap', { count: candidate.impact.rating_overlaps })}
                </p>
              )}
              {candidate.conflicts.length > 0 && (
                <div className="border-danger/30 bg-danger/5 mt-3 rounded-lg border p-3 text-xs text-danger">
                  <p className="font-semibold">{t('members.identityTransfer.conflicts')}</p>
                  <ul className="mt-1 list-disc pl-4">
                    {candidate.conflicts.map((conflict) => (
                      <li key={`${conflict.type}:${conflict.record_id}`}>
                        {conflict.type} #{conflict.record_id}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
          {candidates.length === 0 && (
            <p className="text-sm text-content-muted">{t('members.identityTransfer.none')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function NewMemberIdentityCheck({ tripId }: { tripId: number | string }): React.ReactElement | null {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<GuestIdentityTransferCandidate[]>([]);

  useEffect(() => {
    let active = true;
    tripsApi
      .runNewMemberIdentityCheck(tripId)
      .then((result) => {
        if (active && result.required) {
          setCandidates(result.candidates);
          setOpen(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [tripId]);

  if (!open) return null;
  return (
    <>
      <GuestIdentityTransferModal tripId={tripId} open candidates={candidates} onClose={() => setOpen(false)} />
      <button
        type="button"
        onClick={async () => {
          await tripsApi.declineNewMemberIdentityCheck(tripId).catch(() => {});
          setOpen(false);
        }}
        className="fixed bottom-3 left-1/2 z-[91] -translate-x-1/2 text-xs text-white underline"
      >
        {t('members.identityTransfer.noneOfThese')}
      </button>
    </>
  );
}
