import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Импорт писем с бронированиями',
  'mailAdmin.hint': 'Пересланные подтверждения бронирований становятся бронированиями в нужной поездке.',
  'mailAdmin.enabled': 'Импортировать письма с бронированиями',
  'mailAdmin.enabledHint':
    'Даёт каждому пользователю этой установки адрес для пересылки. Если выключено, ни один адрес не принимает почту.',
  'mailAdmin.transport.label': 'Как приходят письма',
  'mailAdmin.transport.off': 'Только загрузка',
  'mailAdmin.transport.imap': 'Почтовый ящик IMAP',
  'mailAdmin.transport.webhook': 'Webhook',
  'mailAdmin.transport.offInfo':
    'Почтовый ящик не нужен: сохранённое письмо загружают в настройках как файл .eml, и TREK читает его так же. Подходит, чтобы попробовать.',
  'mailAdmin.transport.imapInfo':
    'TREK каждые две минуты заглядывает в почтовый ящик и забирает новые письма. Используй отдельный ящик, который принимает адреса с плюсом (trek+…@your-domain), а не личный: прочитанные письма переносятся в TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Почтовый сервис, например Cloudflare Email Worker, передаёт каждое письмо прямо в TREK и подписывает его ключом ниже, чтобы никто другой не подбросил письма. Для установок без почтового ящика.',
  'mailAdmin.aiDaily': 'Писем с ИИ на человека в день',
  'mailAdmin.aiDailyHint': 'Сверх этого лимита читаются только машиночитаемые данные о бронировании.',
  'mailAdmin.template': 'Шаблон адреса',
  'mailAdmin.templateHint': 'Адрес для пересылки, где {token} заменяется кодом каждого пользователя.',
  'mailAdmin.imap.host': 'Сервер',
  'mailAdmin.imap.port': 'Порт',
  'mailAdmin.imap.tls': 'Шифрование',
  'mailAdmin.imap.user': 'Пользователь',
  'mailAdmin.imap.pass': 'Пароль',
  'mailAdmin.imap.mailbox': 'Папка',
  'mailAdmin.imap.mailboxHint': 'Прочитанные письма перемещаются в TREK/processed.',
  'mailAdmin.webhook.secret': 'Ключ подписи',
  'mailAdmin.webhook.secretHint':
    'Не менее 32 символов; отправитель подписывает им каждое письмо. Пустой ключ отключает webhook.',
  'mailAdmin.inboundUrl': 'Адрес webhook',
  'mailAdmin.inboundUrlHint': 'Ваша почтовая служба отправляет сюда каждое письмо в исходном виде и с подписью.',
  'mailAdmin.copyUrl': 'Копировать адрес',
  'mailAdmin.envHint': 'Переменные окружения (MAIL_INGEST_*) имеют приоритет над этими полями.',
  'mailAdmin.loadError': 'Не удалось загрузить настройки импорта писем.',
  'mailAdmin.problem.secretShort': 'Ключ должен содержать не менее 32 символов.',
  'mailAdmin.problem.portInvalid': 'Введите порт от 1 до 65535.',
  'mailAdmin.problem.templateToken': 'Адрес должен содержать {token} для кода каждого пользователя.',
  'mailAdmin.problem.dailyInvalid': 'Введите целое число от 0 до 1000.',
  'mailAdmin.status.title': 'Статус',
  'mailAdmin.status.lastRead': 'Последнее чтение {time}',
  'mailAdmin.status.never': 'никогда',
  'mailAdmin.status.mails': 'Письма, 24 ч',
  'mailAdmin.status.added': 'Добавлено самостоятельно',
  'mailAdmin.status.waiting': 'Ожидают',
  'mailAdmin.status.failed': 'Ошибки',
  'mailAdmin.test.run': 'Проверить подключение',
  'mailAdmin.test.ok': 'Подключено',
  'mailAdmin.test.failed': 'Нет подключения',
};
export default mailAdmin;
