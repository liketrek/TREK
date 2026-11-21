import type { PlaceContribField } from '@trek/shared';
import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { getApiErrorMessage } from '../../utils/apiError';
import { useToast } from '../shared/Toast';
import { contribStatus, refusalReason } from './placeContribModel';
import { usePlaceContrib } from './usePlaceContrib';

/**
 * What the share-place-details panels (desktop PlaceContribPanel, phone
 * MAdminPlaceContrib) do: the main switch (on asks for consent first, off asks
 * to confirm), one switch per field (switching the last one off is switching the
 * whole thing off), withdrawing what was shared, and the words for a refusal.
 */
export function usePlaceContribPanel({ hideWhenSwitchedOff = false }: { hideWhenSwitchedOff?: boolean } = {}) {
  const { t } = useTranslation();
  const toast = useToast();
  const contrib = usePlaceContrib();
  const { state } = contrib;
  const [prompting, setPrompting] = useState<boolean | null>(null);
  const [confirm, setConfirm] = useState<'off' | 'withdraw' | null>(null);

  const fail = (err: unknown) => {
    const reason = refusalReason(err);
    toast.error(
      reason === 'terms_outdated' || reason === 'no_field'
        ? t(`admin.contribute.refused.${reason}`)
        : getApiErrorMessage(err, t('common.error'))
    );
  };

  // Shown on its own (a managed install), a switch the environment turned off is
  // no decision of the admin's, so the panel stays away.
  const hidden = !state || (hideWhenSwitchedOff && state.ineligibleReason === 'env_off');
  const agreed = !!state && state.consent.decision === 'agreed' && state.consent.termsVersion === state.termsVersion;
  const on = agreed && !!state?.consent.enabled;

  const toggleField = (field: PlaceContribField) => {
    if (!state) return;
    const fields = { ...state.consent.fields, [field]: !state.consent.fields[field] };
    if (!Object.values(fields).some(Boolean)) {
      setConfirm('off');
      return;
    }
    contrib.decide({ action: 'fields', fields }).catch(fail);
  };

  const switchOff = () => {
    setConfirm(null);
    contrib.decide({ action: 'off' }).catch(fail);
  };

  const withdraw = () => {
    setConfirm(null);
    contrib.withdraw().then((r) => {
      const total = Object.values(r.withdrawn).reduce((a, b) => a + b, 0);
      toast.success(t('admin.contribute.withdrawn', { total }));
    }, fail);
  };

  return {
    contrib,
    state,
    hidden,
    status: state ? contribStatus(state) : null,
    agreed,
    on,
    /** The log and the withdraw action: once agreed, and still after switching off. */
    showLog: agreed || state?.consent.decision === 'off',
    showPrompt: !!state && (prompting ?? state.showPrompt) && state.eligible,
    toggleMain: () => (on ? setConfirm('off') : setPrompting(true)),
    closePrompt: () => setPrompting(false),
    confirm,
    setConfirm,
    toggleField,
    switchOff,
    withdraw,
  };
}
