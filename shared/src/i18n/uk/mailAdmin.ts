import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Імпорт листів із бронюваннями',
  'mailAdmin.hint': 'Переслані підтвердження бронювань стають бронюваннями в потрібній подорожі.',
  'mailAdmin.enabled': 'Імпортувати листи з бронюваннями',
  'mailAdmin.enabledHint':
    'Дає кожному користувачу цієї інсталяції адресу для пересилання. Якщо вимкнено, жодна адреса не приймає пошту.',
  'mailAdmin.transport.label': 'Як надходять листи',
  'mailAdmin.transport.off': 'Лише завантаження',
  'mailAdmin.transport.imap': 'Поштова скринька IMAP',
  'mailAdmin.transport.webhook': 'Webhook',
  'mailAdmin.transport.offInfo':
    'Поштова скринька не потрібна: збережений лист завантажують у налаштуваннях як файл .eml, і TREK читає його так само. Підходить, щоб спробувати.',
  'mailAdmin.transport.imapInfo':
    'TREK кожні дві хвилини зазирає до поштової скриньки й забирає нові листи. Використовуй окрему скриньку, що приймає адреси з плюсом (trek+…@your-domain), а не особисту: прочитані листи переносяться до TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Поштовий сервіс, наприклад Cloudflare Email Worker, передає кожен лист прямо в TREK і підписує його ключем нижче, щоб ніхто інший не підкинув листи. Для встановлень без поштової скриньки.',
  'mailAdmin.aiDaily': 'Листів із ШІ на особу за день',
  'mailAdmin.aiDailyHint': 'Понад цей ліміт читаються лише машинозчитувані дані про бронювання.',
  'mailAdmin.template': 'Шаблон адреси',
  'mailAdmin.templateHint': 'Адреса для пересилання, де {token} замінюється кодом кожного користувача.',
  'mailAdmin.imap.host': 'Сервер',
  'mailAdmin.imap.port': 'Порт',
  'mailAdmin.imap.tls': 'Шифрування',
  'mailAdmin.imap.user': 'Користувач',
  'mailAdmin.imap.pass': 'Пароль',
  'mailAdmin.imap.mailbox': 'Тека',
  'mailAdmin.imap.mailboxHint': 'Прочитані листи переміщуються до TREK/processed.',
  'mailAdmin.webhook.secret': 'Ключ підпису',
  'mailAdmin.webhook.secretHint':
    'Щонайменше 32 символи; відправник підписує ним кожен лист. Порожній ключ вимикає webhook.',
  'mailAdmin.inboundUrl': 'Адреса webhook',
  'mailAdmin.inboundUrlHint': 'Ваша поштова служба надсилає сюди кожен лист у початковому вигляді й з підписом.',
  'mailAdmin.copyUrl': 'Копіювати адресу',
  'mailAdmin.envHint': 'Змінні середовища (MAIL_INGEST_*) мають пріоритет над цими полями.',
  'mailAdmin.loadError': 'Не вдалося завантажити налаштування імпорту листів.',
  'mailAdmin.problem.secretShort': 'Ключ має містити щонайменше 32 символи.',
  'mailAdmin.problem.portInvalid': 'Введіть порт від 1 до 65535.',
  'mailAdmin.problem.templateToken': 'Адреса має містити {token} для коду кожного користувача.',
  'mailAdmin.problem.dailyInvalid': 'Введіть ціле число від 0 до 1000.',
  'mailAdmin.status.lastRead': 'Останнє читання {time}',
  'mailAdmin.status.never': 'ніколи',
  'mailAdmin.status.mails': 'Листи, 24 год',
  'mailAdmin.status.added': 'Додано самостійно',
  'mailAdmin.status.waiting': 'Очікують',
  'mailAdmin.status.failed': 'Помилки',
  'mailAdmin.test.run': 'Перевірити з’єднання',
  'mailAdmin.test.ok': 'З’єднано',
  'mailAdmin.test.failed': 'Немає з’єднання',
};
export default mailAdmin;
