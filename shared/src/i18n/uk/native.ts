import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Підключення до TREK',
  'native.connect.hint': 'Введіть адресу, за якою ви відкриваєте TREK у браузері.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Підключитися',
  'native.connect.checking': 'Перевірка…',
  'native.connect.errorInvalid': 'Це не схоже на вебадресу.',
  'native.connect.errorUnreachable': 'За цією адресою не відповідає жоден сервер. Перевірте адресу та з’єднання.',
  'native.connect.errorNotTrek': 'Сервер за цією адресою не є TREK.',
  'native.connect.errorTooOld': 'Цей сервер TREK застарий для застосунку. Спершу його потрібно оновити.',
  'native.offline.title': 'Сервер недоступний',
  'native.offline.hint': 'TREK не вдалося підключитися до {server}. Перевірте з’єднання та спробуйте ще раз.',
  'native.offline.retry': 'Спробувати ще раз',
  'native.changeServer': 'Змінити сервер',
  'native.login.failed': 'Не вдалося увійти. Спробуйте ще раз.',
  'native.handoff.title': 'Продовжити в застосунку',
  'native.handoff.hint': 'Ви увійшли як {name}. Відкрийте застосунок TREK, щоб завершити вхід у ньому.',
  'native.handoff.open': 'Відкрити застосунок TREK',
  'native.handoff.switchAccount': 'Використати інший обліковий запис',
  'native.settings.server': 'Сервер',
  'native.settings.serverHint': 'Застосунок підключено до {server}.',
};

export default native;
