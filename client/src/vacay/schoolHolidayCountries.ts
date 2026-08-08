export type SchoolHolidayStrategy = 'country' | 'groups' | 'subdivisions'

// OpenHolidays models school holidays differently per country. Keep this list
// explicit so new countries are only exposed after source coverage was checked.
export const SCHOOL_HOLIDAY_COUNTRY_CONFIG: Record<string, { strategy: SchoolHolidayStrategy; status: 'green' | 'yellow' }> = {
  AT: { strategy: 'subdivisions', status: 'green' },
  BE: { strategy: 'groups', status: 'yellow' },
  CH: { strategy: 'subdivisions', status: 'yellow' },
  CZ: { strategy: 'subdivisions', status: 'green' },
  DE: { strategy: 'subdivisions', status: 'yellow' },
  EE: { strategy: 'country', status: 'green' },
  ES: { strategy: 'subdivisions', status: 'green' },
  FR: { strategy: 'subdivisions', status: 'green' },
  IE: { strategy: 'country', status: 'yellow' },
  IT: { strategy: 'subdivisions', status: 'yellow' },
  NL: { strategy: 'groups', status: 'yellow' },
  PL: { strategy: 'subdivisions', status: 'yellow' },
  PT: { strategy: 'subdivisions', status: 'green' },
  RS: { strategy: 'country', status: 'yellow' },
  SI: { strategy: 'subdivisions', status: 'yellow' },
  SK: { strategy: 'subdivisions', status: 'yellow' },
}

export function isSchoolHolidayCountrySupported(country: string): boolean {
  return country in SCHOOL_HOLIDAY_COUNTRY_CONFIG
}
