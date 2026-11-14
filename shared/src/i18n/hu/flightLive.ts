import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} nap {h} óra',
  'flightLive.durHoursMinutes': '{h} óra {m} perc',
  'flightLive.durMinutes': '{m} perc',
  'flightLive.late': '+{m} perc',
  'flightLive.early': '{m} perccel korábban',
  'flightLive.onTime': 'Pontos',
  'flightLive.departsIn': 'Indulás {time} múlva',
  'flightLive.scheduled': 'Tervezett',
  'flightLive.taxiing': 'Indulásra kész',
  'flightLive.atAirport': 'A földön itt: {code}',
  'flightLive.airborne': 'A levegőben',
  'flightLive.landsIn': 'Leszállás {time} múlva',
  'flightLive.landed': 'Leszállt',
  'flightLive.landedAt': '{time}-kor leszállt itt: {code}',
  'flightLive.estimated': 'várható',
  'flightLive.altitude': 'Magasság',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Sebesség',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Hátralévő',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Repülőgép',
  'flightLive.noGateHint':
    'A kapu, a terminál és a poggyászszalag nem része a nyílt repülési adatoknak. Szükség esetén add hozzá magad a foglaláshoz.',
  'flightLive.legOf': '{n}. járat / {total}',
  'flightLive.adminTitle': 'Élő járatállapot',
  'flightLive.adminHint':
    'Nyílt ADS-B adatokból (adsb.lol, adsb.fi) mutatja a foglalt járatok helyzetét, késését és várható érkezését. Csak a járat hívójele hagyja el ezt a szervert.',
  'flightLive.adminToggle': 'Foglalt járatok élő követése',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Nyílt ADS-B adatokból (adsb.lol) mutatja a foglalt járatok helyzetét, késését és várható érkezését. Csak a járat hívójele hagyja el a példányt.',
  'flightLive.noFlight': 'Nincs közelgő járat',
  'flightLive.envLocked': 'A szerveren a FLIGHT_LIVE_ENABLED állítja be, itt nem módosítható.',
};

export default flightLive;
