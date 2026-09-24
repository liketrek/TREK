import type { TranslationStrings } from '../types';

const native: TranslationStrings = {
  'native.connect.title': 'Подключение к TREK',
  'native.connect.hint': 'Введите адрес, по которому вы открываете TREK в браузере.',
  'native.connect.placeholder': 'trek.example.com',
  'native.connect.submit': 'Подключиться',
  'native.connect.checking': 'Проверка…',
  'native.connect.errorInvalid': 'Это не похоже на веб-адрес.',
  'native.connect.errorUnreachable': 'По этому адресу не отвечает ни один сервер. Проверьте адрес и подключение.',
  'native.connect.errorNotTrek': 'Сервер по этому адресу не является TREK.',
  'native.connect.errorTooOld': 'Этот сервер TREK слишком старый для приложения. Сначала его нужно обновить.',
  'native.offline.title': 'Сервер недоступен',
  'native.offline.hint': 'TREK не удалось подключиться к {server}. Проверьте подключение и повторите попытку.',
  'native.offline.retry': 'Повторить',
  'native.changeServer': 'Сменить сервер',
  'native.login.failed': 'Не удалось войти. Попробуйте ещё раз.',
  'native.handoff.title': 'Продолжить в приложении',
  'native.handoff.hint': 'Вы вошли как {name}. Откройте приложение TREK, чтобы завершить вход в нём.',
  'native.handoff.open': 'Открыть приложение TREK',
  'native.handoff.switchAccount': 'Использовать другой аккаунт',
  'native.settings.server': 'Сервер',
  'native.settings.serverHint': 'Приложение подключено к {server}.',
};

export default native;
