import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} д {h} год',
  'flightLive.durHoursMinutes': '{h} год {m} хв',
  'flightLive.durMinutes': '{m} хв',
  'flightLive.late': '+{m} хв',
  'flightLive.early': 'на {m} хв раніше',
  'flightLive.onTime': 'Вчасно',
  'flightLive.departsIn': 'Виліт через {time}',
  'flightLive.scheduled': 'За розкладом',
  'flightLive.taxiing': 'Готовий до вильоту',
  'flightLive.atAirport': 'На землі в {code}',
  'flightLive.airborne': 'У повітрі',
  'flightLive.landsIn': 'Посадка через {time}',
  'flightLive.landed': 'Приземлився',
  'flightLive.landedAt': 'Приземлився о {time} в {code}',
  'flightLive.estimated': 'очікується',
  'flightLive.altitude': 'Висота',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} м',
  'flightLive.speed': 'Швидкість',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} км/год',
  'flightLive.remaining': 'Залишилось',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} км',
  'flightLive.aircraft': 'Літак',
  'flightLive.noGateHint':
    'Вихід, термінал і стрічка видачі багажу не входять до відкритих даних про польоти. За потреби додайте їх до бронювання самі.',
  'flightLive.legOf': 'Рейс {n} з {total}',
  'flightLive.adminTitle': 'Статус рейсів у реальному часі',
  'flightLive.adminHint':
    'Показує положення, затримку й очікуване прибуття заброньованих рейсів за відкритими даними ADS-B (adsb.lol, adsb.fi). Сервер залишає лише позивний рейсу.',
  'flightLive.adminToggle': 'Відстежувати заброньовані рейси наживо',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Показує положення, затримку й очікуване прибуття заброньованих рейсів за відкритими даними ADS-B (adsb.lol). Інстанс залишає лише позивний рейсу.',
  'flightLive.noFlight': 'Немає запланованих рейсів',
  'flightLive.envLocked': 'Задано через FLIGHT_LIVE_ENABLED на сервері, тут змінити не можна.',
};

export default flightLive;
