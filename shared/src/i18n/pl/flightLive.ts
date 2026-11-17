import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} d {h} godz.',
  'flightLive.durHoursMinutes': '{h} godz. {m} min',
  'flightLive.durMinutes': '{m} min',
  'flightLive.late': '+{m} min',
  'flightLive.early': '{m} min wcześniej',
  'flightLive.onTime': 'Punktualnie',
  'flightLive.departsIn': 'Odlot za {time}',
  'flightLive.scheduled': 'Planowany',
  'flightLive.taxiing': 'Gotowy do odlotu',
  'flightLive.atAirport': 'Na ziemi w {code}',
  'flightLive.airborne': 'W powietrzu',
  'flightLive.landsIn': 'Lądowanie za {time}',
  'flightLive.landed': 'Wylądował',
  'flightLive.landedAt': 'Wylądował o {time} w {code}',
  'flightLive.estimated': 'szacowany',
  'flightLive.altitude': 'Wysokość',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} m',
  'flightLive.speed': 'Prędkość',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} km/h',
  'flightLive.remaining': 'Pozostało',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} km',
  'flightLive.aircraft': 'Samolot',
  'flightLive.noGateHint':
    'Bramka, terminal i taśma bagażowa nie należą do otwartych danych lotniczych. W razie potrzeby dodaj je sam do rezerwacji.',
  'flightLive.legOf': 'Lot {n} z {total}',
  'flightLive.adminTitle': 'Status lotów na żywo',
  'flightLive.adminHint':
    'Pokazuje pozycję, opóźnienie i przewidywany przylot zarezerwowanych lotów na podstawie otwartych danych ADS-B (adsb.lol, adsb.fi). Serwer opuszcza tylko znak wywoławczy lotu.',
  'flightLive.adminToggle': 'Śledź zarezerwowane loty na żywo',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Pokazuje pozycję, opóźnienie i przewidywany przylot zarezerwowanych lotów na podstawie otwartych danych ADS-B (adsb.lol). Instancję opuszcza tylko znak wywoławczy lotu.',
  'flightLive.noFlight': 'Brak zaplanowanego lotu',
  'flightLive.envLocked': 'Ustawione przez FLIGHT_LIVE_ENABLED na serwerze i nie można tego tutaj zmienić.',
};

export default flightLive;
