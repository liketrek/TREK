import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} g {h} h',
  'flightLive.durHoursMinutes': '{h} h {m} min',
  'flightLive.durMinutes': '{m} min',
  'flightLive.late': '+{m} min',
  'flightLive.early': '{m} min in anticipo',
  'flightLive.onTime': 'In orario',
  'flightLive.departsIn': 'Parte tra {time}',
  'flightLive.scheduled': 'Programmato',
  'flightLive.taxiing': 'Pronto alla partenza',
  'flightLive.atAirport': 'A terra a {code}',
  'flightLive.airborne': 'In volo',
  'flightLive.landsIn': 'Atterra tra {time}',
  'flightLive.landed': 'Atterrato',
  'flightLive.landedAt': 'Atterrato alle {time} a {code}',
  'flightLive.estimated': 'stimato',
  'flightLive.altitude': 'Quota',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Velocità',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Mancano',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Aereo',
  'flightLive.noGateHint':
    'Gate, terminal e nastro bagagli non fanno parte dei dati di volo aperti. Aggiungili tu alla prenotazione se ti servono.',
  'flightLive.legOf': 'Volo {n} di {total}',
  'flightLive.adminTitle': 'Stato voli in tempo reale',
  'flightLive.adminHint':
    'Mostra posizione, ritardo e arrivo stimato dei voli prenotati da dati ADS-B aperti (adsb.lol, adsb.fi). Solo il nominativo del volo lascia questo server.',
  'flightLive.adminToggle': 'Segui in tempo reale i voli prenotati',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Mostra posizione, ritardo e arrivo stimato dei voli prenotati da dati ADS-B aperti (adsb.lol). Solo il nominativo del volo lascia l’istanza.',
  'flightLive.noFlight': 'Nessun volo in programma',
  'flightLive.envLocked': 'Impostato da FLIGHT_LIVE_ENABLED sul server e non modificabile qui.',
};

export default flightLive;
