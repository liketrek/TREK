/**
 * Stands in for CustomTimePicker in the place form's tests: a plain text input
 * instead of the portal-heavy picker. The aria props land on the input, as the
 * real picker spreads them onto its own. Hand it to vi.mock as the default export.
 */
export function TimePickerStub({
  value,
  onChange,
  placeholder,
  ...aria
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}) {
  return (
    <input
      {...aria}
      data-testid="time-picker"
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? '00:00'}
    />
  );
}
