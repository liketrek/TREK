import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Перевіряти зміни моїх маршрутів',
  'wanderer.watch.hint': 'Сповіщення, якщо імпортований маршрут міг змінитися.',
  'wanderer.watch.info':
    'Не частіше ніж раз на день TREK читає короткий запис кожного імпортованого маршруту, але ніколи його файл GPX. Він лише сповіщає: чи приймати зміну, вирішуєте ви самі через перевірку джерела туру.',
  'wanderer.watch.notConnected': 'Спершу підключіть wanderer',
  'wanderer.watch.on': 'Фонову перевірку увімкнено',
  'wanderer.watch.off': 'Фонову перевірку вимкнено',
  'wanderer.watch.failed': 'Не вдалося перемкнути фонову перевірку',
  'wanderer.watch.lastRun': 'Остання перевірка {date}',
  'wanderer.watch.neverRun': 'Ще не перевірялося',
  'wanderer.watch.paused': 'Призупинено до {time}',
  'wanderer.watch.pausedHint': 'wanderer не відповів. Після кожної невдачі TREK чекає довше, перш ніж запитати знову.',
  'wanderer.watch.blocked': 'Токен відхилено',
  'wanderer.watch.blockedHint':
    'wanderer відхилив API-токен. Перевірка продовжиться, коли пройде тест підключення або буде збережено новий токен.',
  'wanderer.watch.hints': 'Підказки',
  'wanderer.watch.hintsCount': '{count} відкритої підказки',
  'wanderer.watch.hintsCount.one': '{count} відкрита підказка',
  'wanderer.watch.hintsCount.few': '{count} відкриті підказки',
  'wanderer.watch.hintsCount.many': '{count} відкритих підказок',
  'wanderer.watch.empty': 'Відкритих підказок немає',
  'wanderer.watch.dialogTitle': 'Підказки щодо ваших маршрутів',
  'wanderer.watch.openTour': 'Відкрити тур',
  'wanderer.watch.checkedAt': 'Перевірено {date}',
  'wanderer.watch.noticeLabel': 'Фонова перевірка',
  'wanderer.watch.state.possible_change': 'Можливо, змінено',
  'wanderer.watch.state.changed': 'Змінено',
  'wanderer.watch.state.unverifiable': 'Не перевірити',
  'wanderer.watch.stateHint.possible_change':
    'wanderer змінив позначку часу маршруту. Лише перевірка джерела покаже, чи відрізняється вміст.',
  'wanderer.watch.stateHint.changed':
    'Запис у wanderer має іншу назву або опис. Перевірка джерела покаже все, що змінилося.',
  'wanderer.watch.stateHint.unverifiable': 'TREK не зміг оцінити цей маршрут, тож про зміни нічого не сказано.',
  'wanderer.watch.reason.unavailable': 'Маршрут недоступний',
  'wanderer.watch.reason.no_change_time': 'Немає позначки часу',
};
export default wandererWatch;
