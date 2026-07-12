declare module 'iso-3166-2' {
  interface Subdivision {
    type: string
    name: string
  }

  interface SubdivisionDetail extends Subdivision {
    countryName: string
    countryCode: string
    code: string
    regionCode: string
  }

  interface Country {
    name: string
    sub: Record<string, Subdivision>
  }

  interface Iso31662 {
    /** Look up a country by ISO 3166-1 alpha-2 code (e.g. 'US'). */
    country(code: string): Country | undefined
    /** Look up a subdivision by full ISO 3166-2 code (e.g. 'US-WA'). */
    subdivision(code: string): SubdivisionDetail | undefined
  }

  const iso31662: Iso31662
  export default iso31662
}
