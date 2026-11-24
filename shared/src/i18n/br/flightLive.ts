import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} d {h} h',
  'flightLive.durHoursMinutes': '{h} h {m} min',
  'flightLive.durMinutes': '{m} min',
  'flightLive.late': '+{m} min',
  'flightLive.early': '{m} min adiantado',
  'flightLive.onTime': 'No horário',
  'flightLive.departsIn': 'Parte em {time}',
  'flightLive.scheduled': 'Programado',
  'flightLive.taxiing': 'Pronto para partir',
  'flightLive.atAirport': 'Em solo em {code}',
  'flightLive.airborne': 'No ar',
  'flightLive.landsIn': 'Pousa em {time}',
  'flightLive.landed': 'Pousou',
  'flightLive.landedAt': 'Pousou às {time} em {code}',
  'flightLive.estimated': 'estimado',
  'flightLive.altitude': 'Altitude', // same-as-en
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Velocidade',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Restante',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Aeronave',
  'flightLive.noGateHint':
    'Portão, terminal e esteira de bagagem não fazem parte dos dados de voo abertos. Adicione-os você mesmo à reserva se precisar.',
  'flightLive.legOf': 'Voo {n} de {total}',
  'flightLive.adminTitle': 'Status de voo ao vivo',
  'flightLive.adminHint':
    'Mostra posição, atraso e chegada estimada dos voos reservados a partir de dados ADS-B abertos (adsb.lol, adsb.fi). Só o indicativo do voo sai deste servidor.',
  'flightLive.adminToggle': 'Acompanhar voos reservados ao vivo',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Mostra posição, atraso e chegada estimada dos voos reservados a partir de dados ADS-B abertos (adsb.lol). Só o indicativo do voo sai da instância.',
  'flightLive.noFlight': 'Nenhum voo previsto',
  'flightLive.envLocked': 'Definido por FLIGHT_LIVE_ENABLED no servidor e não pode ser alterado aqui.',
};

export default flightLive;
