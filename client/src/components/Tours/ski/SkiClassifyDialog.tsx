import { MountainSnow } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
} from '../../shared/DialogShell';
import { SkiClassificationFields } from './SkiClassificationFields';
import type { SkiClassification } from './useSkiClassification';

/**
 * SKI-02: the ski track classified again, in a dialog: the same fields as the
 * import, starting from what the track has. Save stays off until the choice
 * is complete and differs; Cancel and the backdrop change nothing.
 */
export function SkiClassifyDialog({ ski }: { ski: SkiClassification }) {
  const { t } = useTranslation();
  const labelId = useId();
  const { tour, draft } = ski;
  if (!tour || !draft) return null;
  return (
    <DialogShell
      onClose={ski.close}
      labelledBy={labelId}
      width="detail"
      blocked={ski.saving}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <MountainSnow size={20} strokeWidth={2} className="text-content" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={ski.close}
          eyebrow={t('tours.ski.classifyTitle')}
          title={tour.name}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={ski.close} disabled={ski.saving}>
            {t('common.cancel')}
          </DialogButton>
          <DialogButton
            variant="primary"
            data-testid="ski-classify-save"
            disabled={!ski.canSave || ski.saving}
            onClick={() => void ski.save()}
          >
            {t('common.save')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <SkiClassificationFields choice={draft} onChange={ski.setDraft} />
    </DialogShell>
  );
}
