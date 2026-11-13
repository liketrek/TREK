import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} d {h} h',
  'flightLive.durHoursMinutes': '{h} h {m} min',
  'flightLive.durMinutes': '{m} min',
  'flightLive.late': '+{m} min',
  'flightLive.early': 'o {m} min dříve',
  'flightLive.onTime': 'Včas',
  'flightLive.departsIn': 'Odlet za {time}',
  'flightLive.scheduled': 'Plánováno',
  'flightLive.taxiing': 'Připraveno k odletu',
  'flightLive.atAirport': 'Na zemi v {code}',
  'flightLive.airborne': 'Ve vzduchu',
  'flightLive.landsIn': 'Přistane za {time}',
  'flightLive.landed': 'Přistálo',
  'flightLive.landedAt': 'Přistálo v {time} v {code}',
  'flightLive.estimated': 'odhad',
  'flightLive.altitude': 'Výška',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Rychlost',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Zbývá',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Letadlo',
  'flightLive.noGateHint':
    'Gate, terminál a pás zavazadel nejsou součástí otevřených letových dat. Pokud je potřebuješ, doplň je do rezervace sám.',
  'flightLive.legOf': 'Let {n} z {total}',
  'flightLive.adminTitle': 'Živý stav letů',
  'flightLive.adminHint':
    'Zobrazuje polohu, zpoždění a odhadovaný přílet rezervovaných letů z otevřených dat ADS-B (adsb.lol, adsb.fi). Server opouští jen volací znak letu.',
  'flightLive.adminToggle': 'Sledovat rezervované lety živě',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Zobrazuje polohu, zpoždění a odhadovaný přílet rezervovaných letů z otevřených dat ADS-B (adsb.lol). Instanci opouští jen volací znak letu.',
  'flightLive.noFlight': 'Žádný naplánovaný let',
  'flightLive.envLocked': 'Nastaveno přes FLIGHT_LIVE_ENABLED na serveru, zde to nelze změnit.',
};

export default flightLive;
