import React from 'react';
import { useDateFormat } from '../../hooks/useDateFormat';
import { useWeekStartDay } from '../../hooks/useWeekStartDay';
import { useTranslation } from '../../i18n';
import { selectionHaptic } from '../../native/haptics';
import { localIsoDate } from '../../utils/localDate';
import { DatePickerView, type DatePickerFieldProps } from './DatePickerView';

export function CustomDatePicker(props: DatePickerFieldProps) {
  const { locale, t } = useTranslation();
  const weekStart = useWeekStartDay();
  const dateFormat = useDateFormat();
  return (
    <DatePickerView
      {...props}
      locale={locale}
      t={t}
      weekStart={weekStart}
      dateFormat={dateFormat}
      onSelection={selectionHaptic}
    />
  );
}

interface CustomDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  /** Earliest and latest day (YYYY-MM-DD), as CustomDatePicker takes them. */
  min?: string;
  max?: string;
}

export function CustomDateTimePicker({
  value,
  onChange,
  placeholder: _placeholder,
  style = {},
  min,
  max,
}: CustomDateTimePickerProps) {
  const [datePart, timePart] = (value || '').split('T');

  const handleDateChange = (d: string) => {
    onChange(d ? `${d}T${timePart || '12:00'}` : '');
  };
  const handleTimeChange = (t: string) => {
    const d = datePart || localIsoDate();
    onChange(t ? `${d}T${t}` : d);
  };

  return (
    <div style={{ display: 'flex', gap: 8, ...style }}>
      <CustomDatePicker
        value={datePart || ''}
        onChange={handleDateChange}
        style={{ flex: 1, minWidth: 0 }}
        min={min}
        max={max}
      />
      <div style={{ width: 110, flexShrink: 0 }}>
        <CustomTimePicker value={timePart || ''} onChange={handleTimeChange} />
      </div>
    </div>
  );
}

import CustomTimePicker from './CustomTimePicker';
