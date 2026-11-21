import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} p {h} t',
  'flightLive.durHoursMinutes': '{h} t {m} min',
  'flightLive.durMinutes': '{m} min',
  'flightLive.late': '+{m} min',
  'flightLive.early': '{m} min varem',
  'flightLive.onTime': 'Õigel ajal',
  'flightLive.departsIn': 'Väljub {time} pärast',
  'flightLive.scheduled': 'Plaanitud',
  'flightLive.taxiing': 'Valmis väljumiseks',
  'flightLive.atAirport': 'Maapinnal: {code}',
  'flightLive.airborne': 'Õhus',
  'flightLive.landsIn': 'Maandub {time} pärast',
  'flightLive.landed': 'Maandunud',
  'flightLive.landedAt': 'Maandus kell {time}: {code}',
  'flightLive.estimated': 'eeldatav',
  'flightLive.altitude': 'Kõrgus',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Kiirus',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Jäänud',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Lennuk',
  'flightLive.noGateHint':
    'Värav, terminal ja pagasilint ei kuulu avatud lennuandmete hulka. Lisa need vajadusel ise broneeringule.',
  'flightLive.legOf': 'Lend {n}/{total}',
  'flightLive.adminTitle': 'Lennu otsestaatus',
  'flightLive.adminHint':
    'Näitab broneeritud lendude asukohta, hilinemist ja eeldatavat saabumist avatud ADS-B andmetest (adsb.lol, adsb.fi). Serverist lahkub ainult lennu kutsung.',
  'flightLive.adminToggle': 'Jälgi broneeritud lende otse',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Näitab broneeritud lendude asukohta, hilinemist ja eeldatavat saabumist avatud ADS-B andmetest (adsb.lol). Eksemplarist lahkub ainult lennu kutsung.',
  'flightLive.noFlight': 'Eesootavat lendu pole',
  'flightLive.envLocked': 'Määratud serveris muutujaga FLIGHT_LIVE_ENABLED, siin ei saa muuta.',
};

export default flightLive;
