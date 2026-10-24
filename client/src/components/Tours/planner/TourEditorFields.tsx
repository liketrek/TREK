import { AlertTriangle } from 'lucide-react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { SoftPill } from '../../Planner/planParts';
import CustomSelect from '../../shared/CustomSelect';
import { INPUT, LABEL } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { FoldButton, InfoDot, TourNotice, TourSection } from '../tourParts';
import { HikingPreferencesField } from './HikingPreferencesField';
import { TOUR_DURATION_INPUT_MAX_LENGTH, formatTourDuration, parseTourDuration } from './tourDurationInput';
import type { TourPlannerController } from './useTourPlanner';

type Difficulty = 1 | 2 | 3 | 4 | 5 | 6;

interface TourFieldProps {
  planner: TourPlannerController;
  /** True while the viewer may not edit or a save is in flight. */
  locked: boolean;
}

/** The tallest the description grows before it scrolls, about ten lines. */
const DESCRIPTION_MAX_HEIGHT = 240;
const DETAILS_OPEN_KEY = 'trek.tours.planner.detailsOpen';

function readDetailsOpen(): boolean {
  try {
    return localStorage.getItem(DETAILS_OPEN_KEY) !== 'false';
  } catch {
    // Storage blocked (private window, preview): the section starts open.
    return true;
  }
}

function writeDetailsOpen(open: boolean) {
  try {
    localStorage.setItem(DETAILS_OPEN_KEY, String(open));
  } catch {
    // Storage blocked: the choice lasts as long as the panel does.
  }
}

/** A field label with what belongs beside it (an info dot, a badge) on the same line. */
function FieldLabel({ htmlFor, children, aside }: { htmlFor: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-[5px] flex min-h-5 min-w-0 items-center gap-1">
      <label className={`${LABEL} !mb-0 min-w-0 truncate leading-5`} htmlFor={htmlFor}>
        {children}
      </label>
      {aside}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} role="alert" className="mt-1 block text-danger" style={fs(11)}>
      {children}
    </span>
  );
}

export function TourNameField({ planner, locked }: TourFieldProps) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <label className={LABEL} htmlFor="tour-planner-name">
        {t('tours.planner.name')}
      </label>
      <input
        id="tour-planner-name"
        disabled={locked}
        value={planner.name}
        onChange={(event) => {
          if (!locked) planner.setName(event.target.value);
        }}
        maxLength={255}
        placeholder={
          {
            hike: t('tours.planner.namePlaceholder'),
            bike: t('tours.planner.namePlaceholder.bike'),
            kayak: t('tours.planner.namePlaceholder.kayak'),
            walk: t('tours.planner.namePlaceholder.walk'),
            run: t('tours.planner.namePlaceholder.run'),
            horse: t('tours.planner.namePlaceholder.horse'),
            ski: t('tours.planner.namePlaceholder.ski'),
          }[planner.tourType]
        }
        className={INPUT}
      />
    </div>
  );
}

/**
 * A duration typed as "2:56", "2 h 56" or "176" minutes and shown as "2 h 56 min".
 * A readable value reaches the planner while it is typed; text that is no
 * duration reaches it as NaN on leaving the field, so the planner marks it
 * invalid and holds Save back, and the text stays for the user to fix.
 */
function TourDurationInput({
  id,
  label,
  value,
  invalid,
  errorId,
  locked,
  onCommit,
}: {
  id: string;
  label: string;
  value: number | null;
  invalid: boolean;
  errorId: string;
  locked: boolean;
  onCommit: (minutes: number | null) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const showDraft = draft !== null && (focused || (value !== null && Number.isNaN(value)));
  return (
    <input
      id={id}
      aria-label={label}
      type="text"
      inputMode="text"
      autoComplete="off"
      maxLength={TOUR_DURATION_INPUT_MAX_LENGTH}
      placeholder="0:00"
      disabled={locked}
      value={showDraft ? draft : formatTourDuration(value)}
      onFocus={() => {
        setFocused(true);
        setDraft(formatTourDuration(value));
      }}
      onChange={(event) => {
        if (locked) return;
        const text = event.target.value;
        setDraft(text);
        const parsed = parseTourDuration(text);
        if (parsed !== 'invalid') onCommit(parsed);
      }}
      onBlur={() => {
        setFocused(false);
        if (draft === null) return;
        if (!locked && parseTourDuration(draft) === 'invalid') onCommit(Number.NaN);
        else setDraft(null);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      className={`${INPUT} tabular-nums`}
    />
  );
}

/** Breaks on top of the walking time, and the planned total that defaults to their sum, side by side. */
function TourTimeFields({ planner, locked }: TourFieldProps) {
  const { t } = useTranslation();
  const manual = planner.plannedDurationMinutes != null;
  return (
    <div data-testid="tour-planner-time-grid" className="grid grid-cols-2 gap-3">
      {/* CW-02: a city walk stops at its stations; their stays take the place of breaks. */}
      {planner.tourType !== 'walk' && (
        <div className="min-w-0">
          <FieldLabel
            htmlFor="tour-planner-breaks"
            aside={
              <InfoDot
                label={t('tours.planner.breaksAdditionalInfoLabel')}
                description={t('tours.planner.breaksAdditionalInfo')}
              />
            }
          >
            {t('tours.planner.breaksShort')}
          </FieldLabel>
          <TourDurationInput
            id="tour-planner-breaks"
            label={t('tours.planner.breaksAdditional')}
            value={planner.breakAdditionalMinutes}
            invalid={planner.breakAdditionalInvalid}
            errorId="tour-planner-breaks-error"
            locked={locked}
            onCommit={planner.setBreakAdditionalMinutes}
          />
          {planner.breakAdditionalInvalid && (
            <FieldError id="tour-planner-breaks-error">{t('tours.planner.timeValueInvalid')}</FieldError>
          )}
        </div>
      )}
      <div className="min-w-0">
        <FieldLabel
          htmlFor="tour-planner-planned-duration"
          aside={
            <>
              <InfoDot
                label={t('tours.planner.plannedTotalInfoLabel')}
                description={t('tours.planner.plannedTotalInfo')}
              />
              {manual && (
                <span data-testid="tour-planner-planned-manual" className="ms-auto inline-flex min-w-0">
                  <SoftPill tone="info">{t('tours.planner.plannedTotalManual')}</SoftPill>
                </span>
              )}
            </>
          }
        >
          {t('tours.planner.plannedShort')}
        </FieldLabel>
        <TourDurationInput
          id="tour-planner-planned-duration"
          label={t('tours.planner.plannedTotalDuration')}
          value={planner.plannedDurationMinutes ?? planner.plannedTotalMinutes}
          invalid={planner.plannedDurationInvalid}
          errorId="tour-planner-planned-duration-error"
          locked={locked}
          onCommit={planner.setPlannedDurationMinutes}
        />
        {planner.plannedDurationInvalid && (
          <FieldError id="tour-planner-planned-duration-error">{t('tours.planner.timeValueInvalid')}</FieldError>
        )}
      </div>
    </div>
  );
}

/** The description, growing with its text up to about ten lines before it scrolls. */
function TourDescriptionField({ planner, locked }: TourFieldProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLTextAreaElement>(null);
  const value = planner.description;
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const borders = element.offsetHeight - element.clientHeight;
    element.style.height = 'auto';
    const wanted = element.scrollHeight + borders;
    element.style.height = `${Math.min(wanted, DESCRIPTION_MAX_HEIGHT)}px`;
    element.style.overflowY = wanted > DESCRIPTION_MAX_HEIGHT ? 'auto' : 'hidden';
  }, [value]);
  return (
    <div className="min-w-0">
      <label className={LABEL} htmlFor="tour-planner-description">
        {t('places.formDescription')}
      </label>
      <textarea
        ref={ref}
        id="tour-planner-description"
        data-testid="tour-planner-description"
        disabled={locked}
        value={value}
        onChange={(event) => {
          if (!locked) planner.setDescription(event.target.value);
        }}
        maxLength={2000}
        rows={2}
        className={`${INPUT} resize-none`}
      />
    </div>
  );
}

function TourWebsiteField({ planner, locked }: TourFieldProps) {
  const { t } = useTranslation();
  return (
    <div className="min-w-0">
      <label className={LABEL} htmlFor="tour-planner-website">
        {t('places.formWebsite')}
      </label>
      <input
        id="tour-planner-website"
        type="url"
        inputMode="url"
        disabled={locked}
        value={planner.website}
        onChange={(event) => {
          if (!locked) planner.setWebsite(event.target.value);
        }}
        maxLength={500}
        placeholder={t('collab.notes.websitePlaceholder')}
        aria-invalid={planner.websiteInvalid || undefined}
        aria-describedby={planner.websiteInvalid ? 'tour-planner-website-error' : undefined}
        className={INPUT}
      />
      {planner.websiteInvalid && (
        <FieldError id="tour-planner-website-error">{t('dawarich.error.invalid_url')}</FieldError>
      )}
    </div>
  );
}

/** The difficulty cap, with the routing safety note behind the info dot beside its label. */
function TourDifficultyField({
  planner,
  locked,
  onDifficultyChange,
}: TourFieldProps & { onDifficultyChange: (value: Difficulty) => void }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="min-w-0">
        <FieldLabel
          htmlFor="tour-planner-difficulty"
          aside={<InfoDot label={t('tours.planner.safetyInfoLabel')} description={t('tours.planner.safetyNote')} />}
        >
          {t('tours.planner.maxDifficulty')}
        </FieldLabel>
        <CustomSelect
          id="tour-planner-difficulty"
          disabled={locked}
          ariaLabel={t('tours.planner.maxDifficulty')}
          value={planner.maxHikingDifficulty}
          onChange={(nextValue) => {
            if (!locked) onDifficultyChange(Number(nextValue) as Difficulty);
          }}
          options={[1, 2, 3, 4, 5, 6].map((value) => ({ value, label: t(`tours.planner.difficulty.t${value}`) }))}
        />
      </div>
      {planner.maxHikingDifficulty === 3 && (
        <TourNotice tone="warning" role="status" icon={<AlertTriangle size={13} strokeWidth={2} />}>
          {t('tours.planner.difficulty.t3Warning')}
        </TourNotice>
      )}
    </>
  );
}

/**
 * Description, website, a hike's difficulty cap and route choice, and the time, folded away with the chevron. The section opens by itself while one of its fields holds a value
 * the planner refuses, so the reason Save is held back is never out of sight.
 */
export function TourDetailsSection({
  planner,
  locked,
  onDifficultyChange,
}: TourFieldProps & { onDifficultyChange: (value: Difficulty) => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(readDetailsOpen);
  const forcedOpen = planner.websiteInvalid || planner.plannedDurationInvalid || planner.breakAdditionalInvalid;
  const expanded = open || forcedOpen;
  const toggle = () => {
    const next = !expanded;
    setOpen(next);
    writeDetailsOpen(next);
  };
  return (
    <TourSection
      label={<span className="text-content">{t('tours.planner.details')}</span>}
      action={
        <FoldButton
          expanded={expanded}
          onToggle={toggle}
          controls="tour-planner-details"
          label={t(expanded ? 'tours.planner.collapseDetails' : 'tours.planner.expandDetails')}
        />
      }
    >
      <div id="tour-planner-details" hidden={!expanded} className="flex flex-col gap-3">
        {expanded && (
          <>
            <TourDescriptionField planner={planner} locked={locked} />
            <TourWebsiteField planner={planner} locked={locked} />
            {/* A paddle tour is not graded on the hiking scale. */}
            {planner.tourType === 'hike' && (
              <>
                <TourDifficultyField planner={planner} locked={locked} onDifficultyChange={onDifficultyChange} />
                <HikingPreferencesField planner={planner} locked={locked} />
              </>
            )}
            <TourTimeFields planner={planner} locked={locked} />
          </>
        )}
      </div>
    </TourSection>
  );
}
