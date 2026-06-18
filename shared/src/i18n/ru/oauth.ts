import type { TranslationStrings } from '../types';

const oauth: TranslationStrings = {
  'oauth.scope.group.trips': 'Поездки',
  'oauth.scope.group.places': 'Места',
  'oauth.scope.group.atlas': 'Atlas',
  'oauth.scope.group.packing': 'Вещи',
  'oauth.scope.group.todos': 'Задачи',
  'oauth.scope.group.budget': 'Бюджет',
  'oauth.scope.group.reservations': 'Бронирования',
  'oauth.scope.group.collab': 'Сотрудничество',
  'oauth.scope.group.notifications': 'Уведомления',
  'oauth.scope.group.vacay': 'Отпуск',
  'oauth.scope.group.geo': 'Geo',
  'oauth.scope.group.weather': 'Погода',
  'oauth.scope.group.journey': 'Путешествия',
  'oauth.scope.trips:read.label': 'Просмотр поездок и маршрутов',
  'oauth.scope.trips:read.description': 'Чтение поездок, дней, заметок и участников',
  'oauth.scope.trips:write.label': 'Редактирование поездок и маршрутов',
  'oauth.scope.trips:write.description': 'Создание и обновление поездок, дней, заметок и управление участниками',
  'oauth.scope.trips:delete.label': 'Удаление поездок',
  'oauth.scope.trips:delete.description': 'Безвозвратное удаление поездок — это действие необратимо',
  'oauth.scope.trips:share.label': 'Управление ссылками на совместный доступ',
  'oauth.scope.trips:share.description': 'Создание, обновление и отзыв публичных ссылок на поездки',
  'oauth.scope.places:read.label': 'Просмотр мест и данных карты',
  'oauth.scope.places:read.description': 'Чтение мест, назначений по дням, тегов и категорий',
  'oauth.scope.places:write.label': 'Управление местами',
  'oauth.scope.places:write.description': 'Создание, обновление и удаление мест, назначений и тегов',
  'oauth.scope.atlas:read.label': 'Просмотр Atlas',
  'oauth.scope.atlas:read.description': 'Чтение посещённых стран, регионов и списка желаний',
  'oauth.scope.atlas:write.label': 'Управление Atlas',
  'oauth.scope.atlas:write.description': 'Отмечать посещённые страны и регионы, управлять списком желаний',
  'oauth.scope.packing:read.label': 'Просмотр списков вещей',
  'oauth.scope.packing:read.description': 'Чтение вещей, сумок и назначений категорий',
  'oauth.scope.packing:write.label': 'Управление списками вещей',
  'oauth.scope.packing:write.description':
    'Добавление, обновление, удаление, отметка и переупорядочивание вещей и сумок',
  'oauth.scope.todos:read.label': 'Просмотр списков задач',
  'oauth.scope.todos:read.description': 'Чтение задач поездки и назначений категорий',
  'oauth.scope.todos:write.label': 'Управление списками задач',
  'oauth.scope.todos:write.description': 'Создание, обновление, отметка, удаление и переупорядочивание задач',
  'oauth.scope.budget:read.label': 'Просмотр бюджета',
  'oauth.scope.budget:read.description': 'Чтение статей бюджета и разбивки расходов',
  'oauth.scope.budget:write.label': 'Управление бюджетом',
  'oauth.scope.budget:write.description': 'Создание, обновление и удаление статей бюджета',
  'oauth.scope.reservations:read.label': 'Просмотр бронирований',
  'oauth.scope.reservations:read.description': 'Чтение бронирований и сведений о проживании',
  'oauth.scope.reservations:write.label': 'Управление бронированиями',
  'oauth.scope.reservations:write.description': 'Создание, обновление, удаление и переупорядочивание бронирований',
  'oauth.scope.collab:read.label': 'Просмотр совместной работы',
  'oauth.scope.collab:read.description': 'Чтение совместных заметок, опросов и сообщений',
  'oauth.scope.collab:write.label': 'Управление совместной работой',
  'oauth.scope.collab:write.description': 'Создание, обновление и удаление заметок, опросов и сообщений',
  'oauth.scope.notifications:read.label': 'Просмотр уведомлений',
  'oauth.scope.notifications:read.description': 'Чтение уведомлений в приложении и количества непрочитанных',
  'oauth.scope.notifications:write.label': 'Управление уведомлениями',
  'oauth.scope.notifications:write.description': 'Отмечать уведомления как прочитанные и отвечать на них',
  'oauth.scope.vacay:read.label': 'Просмотр планов отпуска',
  'oauth.scope.vacay:read.description': 'Чтение данных планирования отпуска, записей и статистики',
  'oauth.scope.vacay:write.label': 'Управление планами отпуска',
  'oauth.scope.vacay:write.description': 'Создание и управление записями отпуска, праздниками и командными планами',
  'oauth.scope.geo:read.label': 'Карты и геокодирование',
  'oauth.scope.geo:read.description': 'Поиск мест, разрешение URL карт и обратное геокодирование координат',
  'oauth.scope.weather:read.label': 'Прогнозы погоды',
  'oauth.scope.weather:read.description': 'Получение прогнозов погоды для мест и дат поездки',
  'oauth.scope.journey:read.label': 'Просмотр путешествий',
  'oauth.scope.journey:read.description': 'Чтение путешествий, записей и списка участников',
  'oauth.scope.journey:write.label': 'Управление путешествиями',
  'oauth.scope.journey:write.description': 'Создание, обновление и удаление путешествий и их записей',
  'oauth.scope.journey:share.label': 'Управление ссылками на путешествия',
  'oauth.scope.journey:share.description': 'Создание, обновление и отзыв публичных ссылок для путешествий',
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
