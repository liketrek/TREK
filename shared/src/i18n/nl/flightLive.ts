import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} d {h} u',
  'flightLive.durHoursMinutes': '{h} u {m} min',
  'flightLive.durMinutes': '{m} min',
  'flightLive.late': '+{m} min',
  'flightLive.early': '{m} min eerder',
  'flightLive.onTime': 'Op tijd',
  'flightLive.departsIn': 'Vertrekt over {time}',
  'flightLive.scheduled': 'Gepland',
  'flightLive.taxiing': 'Klaar voor vertrek',
  'flightLive.atAirport': 'Aan de grond in {code}',
  'flightLive.airborne': 'In de lucht',
  'flightLive.landsIn': 'Landt over {time}',
  'flightLive.landed': 'Geland',
  'flightLive.landedAt': 'Om {time} geland in {code}',
  'flightLive.estimated': 'verwacht',
  'flightLive.altitude': 'Hoogte',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Snelheid',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/u',
  'flightLive.remaining': 'Resterend',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Toestel',
  'flightLive.noGateHint':
    'Gate, terminal en bagageband horen niet bij open vluchtgegevens. Voeg ze zelf aan de boeking toe als je ze nodig hebt.',
  'flightLive.legOf': 'Vlucht {n} van {total}',
  'flightLive.adminTitle': 'Live vluchtstatus',
  'flightLive.adminHint':
    'Toont positie, vertraging en verwachte aankomst van geboekte vluchten uit open ADS-B-gegevens (adsb.lol, adsb.fi). Alleen de roepnaam van de vlucht verlaat deze server.',
  'flightLive.adminToggle': 'Geboekte vluchten live volgen',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Toont positie, vertraging en verwachte aankomst van geboekte vluchten uit open ADS-B-gegevens (adsb.lol). Alleen de roepnaam van de vlucht verlaat de instantie.',
  'flightLive.noFlight': 'Geen vlucht gepland',
  'flightLive.envLocked': 'Ingesteld door FLIGHT_LIVE_ENABLED op de server en hier niet te wijzigen.',
};

export default flightLive;
