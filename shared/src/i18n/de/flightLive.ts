import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} T {h} Std',
  'flightLive.durHoursMinutes': '{h} Std {m} Min',
  'flightLive.durMinutes': '{m} Min',
  'flightLive.late': '+{m} Min',
  'flightLive.early': '{m} Min früher',
  'flightLive.onTime': 'Pünktlich',
  'flightLive.departsIn': 'Abflug in {time}',
  'flightLive.scheduled': 'Geplant',
  'flightLive.taxiing': 'Bereit zum Abflug',
  'flightLive.atAirport': 'Am Boden in {code}',
  'flightLive.airborne': 'In der Luft',
  'flightLive.landsIn': 'Landung in {time}',
  'flightLive.landed': 'Gelandet',
  'flightLive.landedAt': 'Gelandet um {time} in {code}',
  'flightLive.estimated': 'erwartet',
  'flightLive.altitude': 'Höhe',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Tempo',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Verbleibend',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Flugzeug',
  'flightLive.noGateHint':
    'Gate, Terminal und Gepäckband gehören nicht zu den offenen Flugdaten. Trag sie bei Bedarf selbst in die Buchung ein.',
  'flightLive.legOf': 'Flug {n} von {total}',
  'flightLive.adminTitle': 'Live-Flugstatus',
  'flightLive.adminHint':
    'Zeigt Position, Verspätung und voraussichtliche Ankunft gebuchter Flüge aus offenen ADS-B-Daten (adsb.lol, adsb.fi). Nur das Rufzeichen des Flugs verlässt diesen Server.',
  'flightLive.adminToggle': 'Gebuchte Flüge live verfolgen',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Zeigt Position, Verspätung und voraussichtliche Ankunft gebuchter Flüge aus offenen ADS-B-Daten (adsb.lol). Nur das Rufzeichen des Flugs verlässt die Instanz.',
  'flightLive.noFlight': 'Kein Flug geplant',
  'flightLive.envLocked': 'Auf dem Server per FLIGHT_LIVE_ENABLED festgelegt und hier nicht änderbar.',
};

export default flightLive;
