import type { GuestClaimCandidate, GuestClaimConflict } from '@trek/shared';
import axios from 'axios';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { tripsApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import Modal from '../shared/Modal';

interface GuestClaimModalProps {
  isOpen: boolean;
  tripId: number;
  candidates: GuestClaimCandidate[];
  onClose: () => void;
  onCandidatesChanged?: (candidates: GuestClaimCandidate[]) => void;
}

const impactKeys = ['expenses', 'payments', 'itinerary', 'todos', 'packing'] as const;

export default function GuestClaimModal({
  isOpen,
  tripId,
  candidates,
  onClose,
  onCandidatesChanged,
}: GuestClaimModalProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedId(null);
    setConfirmed(false);
    setError('');
  }, [isOpen]);

  const selected = useMemo(
    () => candidates.find((candidate) => candidate.guest_user_id === selectedId) ?? null,
    [candidates, selectedId]
  );

  const conflictLabel = (conflict: GuestClaimConflict) =>
    t(`members.guestClaim.conflict.${conflict.type}`, { id: conflict.record_id });

  const submit = async () => {
    if (!selected || !confirmed || selected.conflicts.length > 0) return;
    setSubmitting(true);
    setError('');
    try {
      await tripsApi.claimGuest(tripId, selected.guest_user_id);
      window.location.reload();
    } catch (caught) {
      const code = axios.isAxiosError(caught) ? caught.response?.data?.code : undefined;
      if (code === 'GUEST_CLAIM_CONFLICT' || code === 'GUEST_ALREADY_CLAIMED') {
        const refreshed = await tripsApi.getGuestClaimCandidates(tripId).catch(() => ({ candidates }));
        onCandidatesChanged?.(refreshed.candidates);
        setSelectedId(null);
        setConfirmed(false);
        setError(t(`members.guestClaim.error.${code}`));
      } else {
        setError(t('members.guestClaim.error.generic'));
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('members.guestClaim.title')} size="lg">
      <p className="text-content-muted" style={{ marginTop: 0 }}>
        {t('members.guestClaim.intro')}
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {candidates.map((candidate) => {
          const blocked = candidate.conflicts.length > 0;
          return (
            <label
              key={candidate.guest_user_id}
              className="border border-edge-secondary bg-surface-secondary"
              style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 10, opacity: blocked ? 0.65 : 1 }}
            >
              <input
                type="radio"
                name="guest-claim"
                checked={selectedId === candidate.guest_user_id}
                disabled={blocked}
                onChange={() => {
                  setSelectedId(candidate.guest_user_id);
                  setConfirmed(false);
                  setError('');
                }}
              />
              <span style={{ flex: 1 }}>
                <strong className="text-content">{candidate.name}</strong>
                {blocked && (
                  <span className="text-content-faint" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                    {candidate.conflicts.map(conflictLabel).join(' · ')}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {selected && (
        <div className="bg-surface-tertiary" style={{ padding: 14, borderRadius: 10, marginTop: 14 }}>
          <strong className="text-content">{t('members.guestClaim.impactTitle', { name: selected.name })}</strong>
          <ul className="text-content-muted" style={{ margin: '8px 0 12px', paddingLeft: 20 }}>
            {impactKeys.map((key) => (
              <li key={key}>{t(`members.guestClaim.impact.${key}`, { count: selected.impact[key] })}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 8, color: '#dc2626', fontSize: 13 }}>
            <AlertTriangle size={16} /> {t('members.guestClaim.irreversible')}
          </div>
          <label className="text-content" style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'flex-start' }}>
            <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
            {t('members.guestClaim.confirm', { name: selected.name })}
          </label>
        </div>
      )}

      {error && <p style={{ color: '#dc2626', fontSize: 13 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
        <button
          className="border border-edge text-content-muted"
          style={{ padding: '8px 12px', borderRadius: 8, background: 'transparent' }}
          onClick={onClose}
        >
          {t('members.guestClaim.none')}
        </button>
        <button
          className="bg-accent text-accent-text"
          style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 14px', border: 0, borderRadius: 8 }}
          disabled={!selected || !confirmed || submitting}
          onClick={submit}
        >
          <UserCheck size={15} /> {submitting ? t('members.guestClaim.claiming') : t('members.guestClaim.claim')}
        </button>
      </div>
    </Modal>
  );
}
