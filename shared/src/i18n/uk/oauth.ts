import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Поїздки',
  'oauth.scope.group.places': 'Місця',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Речі',
  'oauth.scope.group.todos': 'Задачі',
  'oauth.scope.group.budget': 'Бюджет',
  'oauth.scope.group.reservations': 'Бронювання',
  'oauth.scope.group.collab': 'Співпраця',
  'oauth.scope.group.notifications': 'Сповіщення',
  'oauth.scope.group.vacay': 'Відпустка',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Погода',
  'oauth.scope.group.journey': 'Подорожі',
  'oauth.scope.trips:read.label': 'Перегляд поїздок і маршрутів',
  'oauth.scope.trips:read.description': 'Читання поїздок, днів, нотаток і учасників',
  'oauth.scope.trips:write.label': 'Редагування поїздок і маршрутів',
  'oauth.scope.trips:write.description': 'Створення та оновлення поїздок, днів, нотаток і керування учасниками',
  'oauth.scope.trips:delete.label': 'Видалення поїздок',
  'oauth.scope.trips:delete.description': 'Безповоротне видалення поїздок — ця дія незворотна',
  'oauth.scope.trips:share.label': 'Керування посиланнями спільного доступу',
  'oauth.scope.trips:share.description': 'Створення, оновлення та відкликання публічних посилань на поїздки',
  'oauth.scope.places:read.label': 'Перегляд місць і даних карти',
  'oauth.scope.places:read.description': 'Читання місць, призначень за днями, тегів і категорій',
  'oauth.scope.places:write.label': 'Керування місцями',
  'oauth.scope.places:write.description': 'Створення, оновлення та видалення місць, призначень і тегів',
  'oauth.scope.atlas:read.label': 'Перегляд Atlas',
  'oauth.scope.atlas:read.description': 'Читання відвіданих країн, регіонів і списку бажань',
  'oauth.scope.atlas:write.label': 'Керування Atlas',
  'oauth.scope.atlas:write.description': 'Позначення відвіданих країн і регіонів, керування списком бажань',
  'oauth.scope.packing:read.label': 'Перегляд списків речей',
  'oauth.scope.packing:read.description': 'Читання речей, сумок і призначень категорій',
  'oauth.scope.packing:write.label': 'Керування списками речей',
  'oauth.scope.packing:write.description': 'Додавання, оновлення, видалення, позначення і переставлення речей та сумок',
  'oauth.scope.todos:read.label': 'Перегляд списків задач',
  'oauth.scope.todos:read.description': 'Читання задач поїздки і призначень категорій',
  'oauth.scope.todos:write.label': 'Керування списками задач',
  'oauth.scope.todos:write.description': 'Створення, оновлення, позначення, видалення і переставлення задач',
  'oauth.scope.budget:read.label': 'Перегляд бюджету',
  'oauth.scope.budget:read.description': 'Читання статей бюджету і розбивки витрат',
  'oauth.scope.budget:write.label': 'Керування бюджетом',
  'oauth.scope.budget:write.description': 'Створення, оновлення і видалення статей бюджету',
  'oauth.scope.reservations:read.label': 'Перегляд бронювань',
  'oauth.scope.reservations:read.description': 'Читання бронювань і відомостей про проживання',
  'oauth.scope.reservations:write.label': 'Керування бронюваннями',
  'oauth.scope.reservations:write.description': 'Створення, оновлення, видалення і переставлення бронювань',
  'oauth.scope.collab:read.label': 'Перегляд співпраці',
  'oauth.scope.collab:read.description': 'Читання спільних нотаток, опитувань і повідомлень',
  'oauth.scope.collab:write.label': 'Керування співпрацею',
  'oauth.scope.collab:write.description': 'Створення, оновлення і видалення нотаток, опитувань і повідомлень',
  'oauth.scope.notifications:read.label': 'Перегляд сповіщень',
  'oauth.scope.notifications:read.description': 'Читання сповіщень у додатку та кількості непрочитаних',
  'oauth.scope.notifications:write.label': 'Керування сповіщеннями',
  'oauth.scope.notifications:write.description': 'Позначення сповіщень як прочитаних і відповіді на них',
  'oauth.scope.vacay:read.label': 'Перегляд планів відпустки',
  'oauth.scope.vacay:read.description': 'Читання даних планування відпустки, записів і статистики',
  'oauth.scope.vacay:write.label': 'Керування планами відпустки',
  'oauth.scope.vacay:write.description': 'Створення і керування записами відпустки, святами і командними планами',
  'oauth.scope.geo:read.label': 'Карти і геокодування',
  'oauth.scope.geo:read.description': 'Пошук місць, розв’язання URL карт і зворотне геокодування координат',
  'oauth.scope.weather:read.label': 'Прогнози погоди',
  'oauth.scope.weather:read.description': 'Отримання прогнозів погоди для місць і дат поїздки',
  'oauth.scope.journey:read.label': 'Перегляд подорожей',
  'oauth.scope.journey:read.description': 'Читання подорожей, записів і списку учасників',
  'oauth.scope.journey:write.label': 'Керування подорожами',
  'oauth.scope.journey:write.description': 'Створення, оновлення і видалення подорожей та їх записів',
  'oauth.scope.journey:share.label': 'Керування посиланнями на подорожі',
  'oauth.scope.journey:share.description': 'Створення, оновлення і відкликання публічних посилань на подорожі',
  'oauth.authorize.authorizing': 'Authorizing…', // en-fallback
  'oauth.authorize.loading': 'Loading…', // en-fallback
  'oauth.authorize.errorTitle': 'Authorization Error', // en-fallback
  'oauth.authorize.loginTitle': 'Sign in to continue', // en-fallback
  'oauth.authorize.loginDescription': '{client} wants access to your TREK account. Please sign in first.', // en-fallback
  'oauth.authorize.loginButton': 'Sign in to TREK', // en-fallback
  'oauth.authorize.requestLabel': 'Authorization Request', // en-fallback
  'oauth.authorize.requestDescription': 'This application is requesting access to your TREK account.', // en-fallback
  'oauth.authorize.trustNote': 'Only grant access to applications you trust. Your data stays on your server.', // en-fallback
  'oauth.authorize.selectScope': 'Select at least one scope', // en-fallback
  'oauth.authorize.approveOneScope': 'Approve ({count} scope)', // en-fallback
  'oauth.authorize.approveManyScopes': 'Approve ({count} scopes)', // en-fallback
  'oauth.authorize.approveAccess': 'Approve Access', // en-fallback
  'oauth.authorize.deny': 'Deny', // en-fallback
  'oauth.authorize.choosePermissions': 'Choose which permissions to grant', // en-fallback
  'oauth.authorize.permissionsRequested': 'Permissions requested', // en-fallback
  'oauth.authorize.alwaysIncluded': 'Always included', // en-fallback
  'oauth.authorize.alwaysTool.listTrips': 'List your trips so the AI can discover trip IDs', // en-fallback
  'oauth.authorize.alwaysTool.getTripSummary': 'Read a trip overview needed to use any other tool', // en-fallback
};
export default oauth;
