import type { TranslationStrings } from '../types';

const wandererWatch: TranslationStrings = {
  'wanderer.watch.label': 'Проверять изменения моих маршрутов',
  'wanderer.watch.hint': 'Уведомление, если импортированный маршрут мог измениться.',
  'wanderer.watch.info':
    'Не чаще раза в день TREK читает краткую запись каждого импортированного маршрута, но никогда его файл GPX. Он только уведомляет: принимать ли изменение, решаете вы сами через проверку источника тура.',
  'wanderer.watch.notConnected': 'Сначала подключите wanderer',
  'wanderer.watch.on': 'Фоновая проверка включена',
  'wanderer.watch.off': 'Фоновая проверка выключена',
  'wanderer.watch.failed': 'Не удалось переключить фоновую проверку',
  'wanderer.watch.lastRun': 'Последняя проверка {date}',
  'wanderer.watch.neverRun': 'Ещё не проверялось',
  'wanderer.watch.paused': 'Приостановлено до {time}',
  'wanderer.watch.pausedHint': 'wanderer не ответил. После каждой неудачи TREK ждёт дольше, прежде чем спросить снова.',
  'wanderer.watch.blocked': 'Токен отклонён',
  'wanderer.watch.blockedHint':
    'wanderer отклонил API-токен. Проверка продолжится, когда пройдёт тест подключения или будет сохранён новый токен.',
  'wanderer.watch.hints': 'Подсказки',
  'wanderer.watch.hintsCount': '{count} открытой подсказки',
  'wanderer.watch.hintsCount.one': '{count} открытая подсказка',
  'wanderer.watch.hintsCount.few': '{count} открытые подсказки',
  'wanderer.watch.hintsCount.many': '{count} открытых подсказок',
  'wanderer.watch.empty': 'Открытых подсказок нет',
  'wanderer.watch.dialogTitle': 'Подсказки по вашим маршрутам',
  'wanderer.watch.openTour': 'Открыть тур',
  'wanderer.watch.checkedAt': 'Проверено {date}',
  'wanderer.watch.noticeLabel': 'Фоновая проверка',
  'wanderer.watch.state.possible_change': 'Возможно, изменён',
  'wanderer.watch.state.changed': 'Изменён',
  'wanderer.watch.state.unverifiable': 'Не проверить',
  'wanderer.watch.stateHint.possible_change':
    'wanderer изменил отметку времени маршрута. Только проверка источника покажет, отличается ли содержимое.',
  'wanderer.watch.stateHint.changed':
    'Запись в wanderer показывает другое название или описание. Проверка источника покажет всё, что изменилось.',
  'wanderer.watch.stateHint.unverifiable':
    'TREK не смог оценить этот маршрут, поэтому об изменениях ничего не сказано.',
  'wanderer.watch.reason.unavailable': 'Маршрут недоступен',
  'wanderer.watch.reason.no_change_time': 'Нет отметки времени',
};
export default wandererWatch;
