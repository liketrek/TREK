import { visitStay } from '@trek/shared';
import type { Assignment } from '../../types';
import { STAY_MAX } from '../Roadtrip/useStayDraft';
import { NumericInput } from '../shared/NumericInput';

export function VisitStayInput({
  assignment,
  value,
  onChange,
  label,
  className,
}: {
  assignment: Assignment;
  value: string | undefined;
  onChange: (value: string) => void;
  label: string;
  className: string;
}) {
  return (
    <NumericInput
      aria-label={label}
      className={className}
      value={value}
      placeholder={String(visitStay({ ...assignment, stay_minutes: null }))}
      onValueChange={(next) => onChange(Number(next) > STAY_MAX ? String(STAY_MAX) : next)}
    />
  );
}
