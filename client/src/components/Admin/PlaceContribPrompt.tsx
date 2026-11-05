import type { PlaceContribFieldSwitches, PlaceContribState } from '@trek/shared';
import { Check, HeartHandshake, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '../../i18n';
import { getApiErrorMessage } from '../../utils/apiError';
import ToggleSwitch from '../Settings/ToggleSwitch';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  fs,
  NEUTRAL_TINT,
} from '../shared/DialogShell';
import { useToast } from '../shared/Toast';
import { ALL_FIELDS_ON, fieldEntries, fieldLabel, refusalReason } from './placeContribModel';
import type { usePlaceContrib } from './usePlaceContrib';

const NEVER = ['notes', 'files', 'trips', 'people', 'providers'] as const;

/**
 * The question an admin gets once: share what this installation's users type
 * about places with every other TREK. Asked warmly and with every field already
 * on, because saying yes is the point of asking; but nothing leaves before the
 * admin presses Agree, and "not now" and "no" are as easy to reach.
 *
 * Closing the dialog decides nothing: it comes back on the next visit until one
 * of the three buttons is pressed.
 */
export default function PlaceContribPrompt({
  state,
  contrib,
  onClose,
}: {
  state: PlaceContribState;
  contrib: ReturnType<typeof usePlaceContrib>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const toast = useToast();
  const [fields, setFields] = useState<PlaceContribFieldSwitches>(() =>
    state.consent.decision === 'agreed' || state.consent.decision === 'off' ? state.consent.fields : ALL_FIELDS_ON
  );
  const none = !Object.values(fields).some(Boolean);

  const run = async (body: Parameters<typeof contrib.decide>[0], done?: string) => {
    try {
      await contrib.decide(body);
      if (done) toast.success(done);
      onClose();
    } catch (err) {
      const reason = refusalReason(err);
      toast.error(
        reason === 'terms_outdated' || reason === 'no_field'
          ? t(`admin.contribute.refused.${reason}`)
          : getApiErrorMessage(err, t('common.error'))
      );
    }
  };

  return (
    <DialogShell
      onClose={onClose}
      labelledBy="place-contrib-prompt-title"
      width="detail"
      blocked={contrib.busy}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <HeartHandshake size={22} className="text-content" aria-hidden="true" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId="place-contrib-prompt-title"
          eyebrow="TREK Places API"
          title={t('admin.contribute.prompt.title')}
          onClose={onClose}
        />
      }
      footer={
        <DialogFooter>
          <DialogButton
            disabled={contrib.busy}
            onClick={() => void run({ action: 'decline', termsVersion: state.termsVersion })}
          >
            {t('admin.contribute.prompt.decline')}
          </DialogButton>
          <FooterSpacer />
          <DialogButton disabled={contrib.busy} onClick={() => void run({ action: 'snooze' })}>
            {t('admin.contribute.prompt.snooze')}
          </DialogButton>
          <DialogButton
            variant="primary"
            autoFocus
            disabled={contrib.busy || none}
            icon={<HeartHandshake size={15} aria-hidden="true" />}
            onClick={() =>
              void run(
                { action: 'agree', termsVersion: state.termsVersion, fields },
                t('admin.contribute.prompt.thanks')
              )
            }
          >
            {t('admin.contribute.prompt.agree')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div className="flex flex-col gap-2">
        <p className="m-0 leading-relaxed text-content" style={fs(14, 'body')}>
          {t('admin.contribute.prompt.lead')}
        </p>
        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>
          {t('admin.contribute.prompt.why')}
        </p>
      </div>

      <section className="flex flex-col gap-2" aria-labelledby="place-contrib-prompt-fields">
        <h3 id="place-contrib-prompt-fields" className="m-0 font-semibold text-content" style={fs(13, 'body')}>
          {t('admin.contribute.prompt.whatLabel')}
        </h3>
        <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 max-sm:grid-cols-1">
          {fieldEntries(fields).map(([field, on]) => (
            <li
              key={field}
              className="flex items-center justify-between gap-3 rounded-[12px] border border-edge-faint bg-surface-secondary px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-content" style={fs(13, 'body')}>
                <Check
                  size={14}
                  strokeWidth={2.4}
                  className={on ? 'text-success' : 'text-content-faint opacity-40'}
                  aria-hidden="true"
                />
                <span className="truncate">{fieldLabel(t, field)}</span>
              </span>
              <ToggleSwitch
                on={on}
                label={fieldLabel(t, field)}
                onToggle={() => setFields((f) => ({ ...f, [field]: !f[field] }))}
              />
            </li>
          ))}
        </ul>
        <p className="m-0 leading-normal text-content-faint" style={fs(11.5)}>
          {t('admin.contribute.prompt.imageNote')}
        </p>
      </section>

      <section
        className="flex flex-col gap-2 rounded-[14px] border border-edge-faint bg-surface-secondary p-3"
        aria-labelledby="place-contrib-prompt-never"
      >
        <h3
          id="place-contrib-prompt-never"
          className="m-0 flex items-center gap-1.5 font-semibold text-content"
          style={fs(13, 'body')}
        >
          <ShieldCheck size={15} className="text-success" aria-hidden="true" />
          {t('admin.contribute.prompt.neverLabel')}
        </h3>
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {NEVER.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1 rounded-full border border-edge-faint bg-surface-card px-2.5 py-[3px] font-medium text-content-secondary"
              style={fs(11.5)}
            >
              <X size={12} strokeWidth={2.4} className="text-content-faint" aria-hidden="true" />
              {t(`admin.contribute.never.${item}`)}
            </li>
          ))}
        </ul>
        <p className="m-0 leading-normal text-content-muted" style={fs(12, 'body')}>
          {t('admin.contribute.prompt.how')} {t('admin.contribute.prompt.past')}
        </p>
      </section>

      {state.registrationOpen && (
        <p
          className="m-0 flex items-start gap-2 rounded-[12px] bg-warning-soft px-3 py-2 leading-normal text-warning"
          style={fs(12, 'body')}
          role="note"
        >
          <TriangleAlert size={15} className="mt-[1px] flex-none" aria-hidden="true" />
          {t('admin.contribute.prompt.openRegistration')}
        </p>
      )}

      <p className="m-0 text-content-faint" style={fs(11.5)}>
        {t('admin.contribute.prompt.footnote')}
      </p>
    </DialogShell>
  );
}
