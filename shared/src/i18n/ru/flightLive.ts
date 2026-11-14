import type { TranslationStrings } from '../types';

const flightLive: TranslationStrings = {
  'flightLive.durDaysHours': '{d} д {h} ч',
  'flightLive.durHoursMinutes': '{h} ч {m} мин',
  'flightLive.durMinutes': '{m} мин',
  'flightLive.late': '+{m} мин',
  'flightLive.early': 'на {m} мин раньше',
  'flightLive.onTime': 'Вовремя',
  'flightLive.departsIn': 'Вылет через {time}',
  'flightLive.scheduled': 'По расписанию',
  'flightLive.taxiing': 'Готов к вылету',
  'flightLive.atAirport': 'На земле в {code}',
  'flightLive.airborne': 'В воздухе',
  'flightLive.landsIn': 'Посадка через {time}',
  'flightLive.landed': 'Приземлился',
  'flightLive.landedAt': 'Приземлился в {time} в {code}',
  'flightLive.estimated': 'ожидается',
  'flightLive.altitude': 'Высота',
  'flightLive.feet': '{n} ft',
  'flightLive.meters': '{n} м',
  'flightLive.speed': 'Скорость',
  'flightLive.mph': '{n} mph',
  'flightLive.kmh': '{n} км/ч',
  'flightLive.remaining': 'Осталось',
  'flightLive.mi': '{n} mi',
  'flightLive.km': '{n} км',
  'flightLive.aircraft': 'Самолёт',
  'flightLive.noGateHint':
    'Выход, терминал и лента выдачи багажа не входят в открытые данные о полётах. При необходимости добавьте их в бронирование сами.',
  'flightLive.legOf': 'Рейс {n} из {total}',
  'flightLive.adminTitle': 'Статус рейсов в реальном времени',
  'flightLive.adminHint':
    'Показывает положение, задержку и ожидаемое прибытие забронированных рейсов по открытым данным ADS-B (adsb.lol, adsb.fi). Сервер покидает только позывной рейса.',
  'flightLive.adminToggle': 'Отслеживать забронированные рейсы в реальном времени',
  'flightLive.headlineDetail': '{headline}, {detail}',
  'flightLive.adminHintManaged':
    'Показывает положение, задержку и ожидаемое прибытие забронированных рейсов по открытым данным ADS-B (adsb.lol). Инстанс покидает только позывной рейса.',
  'flightLive.noFlight': 'Нет предстоящих рейсов',
  'flightLive.envLocked': 'Задано через FLIGHT_LIVE_ENABLED на сервере и здесь не меняется.',
};

export default flightLive;
