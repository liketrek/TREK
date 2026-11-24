import { usePlaceTextTabs, type PlaceTextField } from '../../../../components/Planner/usePlaceTextTabs';
import { fs } from '../../../../components/shared/DialogShell';
import MSegmented from '../../../components/MSegmented';
import { Eyebrow, FIELD_AREA_CLS } from './PlSheetChrome';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const DOT = 'ms-[5px] inline-block h-[5px] w-[5px] rounded-full bg-current align-middle opacity-60';

/**
 * The place's three texts on the phone, as on the desktop: what the place is,
 * notes on it, and the note for this day's visit, one at a time under a switch,
 * with a line on where the text shows up. The others stay mounted and only
 * hidden, so each keeps what was typed; a dot marks a tab that holds text. The
 * tabs are usePlaceTextTabs', shared with the desktop card.
 */
export function PlPlaceTexts({
  description,
  notes,
  dayNotes,
  dayNumber = null,
  onChange,
  t,
}: {
  description: string;
  notes: string;
  /** null when no single day-assignment is in context. */
  dayNotes: string | null;
  dayNumber?: number | null;
  onChange: (field: PlaceTextField, value: string) => void;
  t: Translate;
}) {
  const { tabs, shown, setActive } = usePlaceTextTabs({ description, notes, dayNotes, dayNumber, t });

  return (
    <div className="flex flex-col gap-2">
      <Eyebrow className="-mb-[3px] mt-3 uppercase">{t('places.textsLabel')}</Eyebrow>
      <MSegmented<PlaceTextField>
        value={shown.field}
        onChange={setActive}
        options={tabs.map((tab) => ({
          value: tab.field,
          label: (
            <>
              {tab.label}
              {tab.value.trim() && <span aria-hidden="true" className={DOT} />}
            </>
          ),
        }))}
      />
      {tabs.map((tab) => (
        <div key={tab.field} hidden={tab.field !== shown.field}>
          <textarea
            value={tab.value}
            onChange={(e) => onChange(tab.field, e.target.value)}
            rows={3}
            maxLength={tab.maxLength}
            aria-label={tab.aria}
            className={FIELD_AREA_CLS}
          />
          <p className="m-0 mt-[5px] px-[6px] font-geist leading-snug text-m-faint" style={fs(10.5, 'caption')}>
            {tab.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
