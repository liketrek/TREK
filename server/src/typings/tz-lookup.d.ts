// `tz-lookup` ships no type definitions. It exports a single function that maps a
// latitude/longitude to an IANA time-zone name (e.g. `Europe/Paris`) and throws a
// RangeError when the coordinates are out of range.

declare module 'tz-lookup' {
  const tzlookup: (lat: number, lng: number) => string;
  export default tzlookup;
}
