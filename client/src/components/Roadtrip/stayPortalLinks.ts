export function trivagoSearchHref(name: string, arrival?: string | null, departure?: string | null): string {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  const dates = arrival && departure && datePattern.test(arrival) && datePattern.test(departure) && departure > arrival
    ? 'dr-' + arrival.replace(/-/g, '') + '-' + departure.replace(/-/g, '') + ';'
    : ''
  return 'https://www.trivago.com/de/lm/hotels-weltweit?search=' + dates + 'qs-' + encodeURIComponent(name).replace(/;/g, '%3B')
}


export function campingSearchHref(portal: 'PiNCAMP' | 'Pitchup', name: string, lat: number, lng: number, arrival?: string | null, departure?: string | null): string {
  const query = new URLSearchParams()
  const dated = arrival && departure && /^\d{4}-\d{2}-\d{2}$/.test(arrival) && /^\d{4}-\d{2}-\d{2}$/.test(departure) && departure > arrival
  if (portal === 'Pitchup') {
    query.set('lat', String(lat))
    query.set('lng', String(lng))
    query.set('placename', name)
    if (dated) {
      query.set('arrive', arrival)
      query.set('depart', departure)
    }
    return 'https://www.pitchup.com/campsites/?' + query
  }
  const latitudeSpan = 20 / 111.32
  const longitudeSpan = Math.min(180, latitudeSpan / Math.max(0.001, Math.cos(lat * Math.PI / 180)))
  query.set('viewport', [Math.max(-90, lat - latitudeSpan), Math.max(-180, lng - longitudeSpan), Math.min(90, lat + latitudeSpan), Math.min(180, lng + longitudeSpan)].map(n => n.toFixed(6)).join(','))
  query.set('title', name)
  if (dated) {
    query.set('date_from', arrival)
    query.set('date_to', departure)
    query.set('flex', 'false')
  }
  return 'https://www.pincamp.com/search?' + query
}
