export interface Holiday {
  date: string;
  localName?: string;
  name?: string;
  global?: boolean;
  counties?: string[] | null;
}

interface NagerHolidayV4 {
  date: string;
  name: string;
  nationalHoliday: boolean;
  subdivisionCodes: string[] | null;
}

/** Adapt Nager.Holidays v4 records to Vacay's long-standing holiday shape. */
export function normalizeNagerHolidays(data: unknown): Holiday[] | undefined {
  if (!Array.isArray(data)) return undefined;
  const holidays: Holiday[] = [];
  for (const row of data) {
    if (
      !row ||
      typeof row !== 'object' ||
      typeof row.date !== 'string' ||
      typeof row.name !== 'string' ||
      typeof row.nationalHoliday !== 'boolean' ||
      (row.subdivisionCodes !== null &&
        (!Array.isArray(row.subdivisionCodes) ||
          row.subdivisionCodes.some((code: unknown) => typeof code !== 'string')))
    )
      return undefined;
    const holiday = row as NagerHolidayV4;
    holidays.push({
      date: holiday.date,
      name: holiday.name,
      localName: holiday.name,
      global: holiday.nationalHoliday,
      counties: holiday.subdivisionCodes,
    });
  }
  return holidays;
}
