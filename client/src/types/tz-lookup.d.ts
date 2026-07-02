declare module 'tz-lookup' {
  /** Returns the IANA time zone for a coordinate, throwing on invalid input. */
  export default function tzlookup(lat: number, lng: number): string;
}
