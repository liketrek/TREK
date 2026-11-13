import { MapPinOff } from 'lucide-react';

import { useTranslation } from '../../i18n';
import { EditorField, GRID_2, INPUT, PANEL } from '../shared/dialogParts';
import { NumericInput } from '../shared/NumericInput';
import { addressWithoutCoordinates } from './placeCoordinates';
import { parseCoordinatePair } from './PlaceFormModal.helpers';

type LocationField = 'address' | 'lat' | 'lng';

interface PlaceFormLocationProps {
  /** The form's id prefix, so each label points at its own field. */
  fieldId: string;
  form: Record<LocationField, string>;
  onChange: (field: LocationField, value: string) => void;
  /** Off where the form explains a missing position in its own words (a service stop). */
  warnWithoutCoordinates: boolean;
}

/**
 * Where the place is: what a pick, a pasted link or the map filled in, or typed by hand.
 * An address typed without coordinates says under the field that the place will not be
 * on the map, and how to put it there (#2837).
 */
export function PlaceFormLocation({ fieldId, form, onChange, warnWithoutCoordinates }: PlaceFormLocationProps) {
  const { t } = useTranslation();
  const hint = warnWithoutCoordinates && addressWithoutCoordinates(form) && (
    <span className="flex items-start gap-1 text-content-muted">
      <MapPinOff size={12} strokeWidth={2} aria-hidden="true" className="mt-px flex-none text-warning" />
      {t('places.noCoordinatesFormHint')}
    </span>
  );
  return (
    <div className={PANEL}>
      <EditorField label={t('places.formAddress')} htmlFor={`${fieldId}-address`} hint={hint}>
        <input
          id={`${fieldId}-address`}
          type="text"
          value={form.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder={t('places.formAddressPlaceholder')}
          className={INPUT}
        />
      </EditorField>
      <div role="group" aria-label={t('collections.coordinates')} className={GRID_2}>
        <EditorField label={t('places.formLatLabel')} htmlFor={`${fieldId}-lat`}>
          <NumericInput
            id={`${fieldId}-lat`}
            mode="signed"
            value={form.lat}
            onValueChange={(v) => onChange('lat', v)}
            onPaste={(e) => {
              // "48.85, 2.35" pasted into the latitude fills both halves.
              const pair = parseCoordinatePair(e.clipboardData.getData('text'));
              if (pair) {
                e.preventDefault();
                onChange('lat', pair[0]);
                onChange('lng', pair[1]);
              }
            }}
            placeholder={t('places.formLat')}
            className={INPUT}
          />
        </EditorField>
        <EditorField label={t('places.formLngLabel')} htmlFor={`${fieldId}-lng`}>
          <NumericInput
            id={`${fieldId}-lng`}
            mode="signed"
            value={form.lng}
            onValueChange={(v) => onChange('lng', v)}
            placeholder={t('places.formLng')}
            className={INPUT}
          />
        </EditorField>
      </div>
    </div>
  );
}
