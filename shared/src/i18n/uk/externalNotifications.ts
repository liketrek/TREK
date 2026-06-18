import type { NotificationLocale } from '../externalNotifications/types';

const uk: NotificationLocale = {
  email: {
    footer: 'Ви отримали це, оскільки увімкнули сповіщення в TREK.',
    manage: 'Керувати налаштуваннями у Налаштуваннях',
    madeWith: 'Made with',
    openTrek: 'Відкрити TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Запрошення до "${p.trip}"`,
      body: `${p.actor} запросив ${p.invitee || 'учасника'} до подорожі "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Нове бронювання: ${p.booking}`,
      body: `${p.actor} додав бронювання "${p.booking}" (${p.type}) до "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Нагадування про подорож: ${p.trip}`,
      body: `Ваша подорож "${p.trip}" наближається!`,
    }),
    todo_due: (p) => ({
      title: `Завдання з терміном: ${p.todo}`,
      body: `"${p.todo}" у "${p.trip}" — термін ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Запрошення Vacay Fusion',
      body: `${p.actor} запрошує вас об'єднати плани відпустки. Відкрийте TREK, щоб прийняти або відхилити.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} фото поділились`,
      body: `${p.actor} поділився ${p.count} фото у "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Нове повідомлення у "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Пакування: ${p.category}`,
      body: `${p.actor} призначив вас до категорії "${p.category}" у "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Доступна нова версія TREK',
      body: `TREK ${p.version} тепер доступний. Перейдіть до панелі адміністратора для оновлення.`,
    }),
    synology_session_cleared: () => ({
      title: 'Сеанс Synology скинуто',
      body: 'Ваш обліковий запис або URL Synology змінився. Ви вийшли з Synology Photos.',
    }),
  },
  passwordReset: {
    subject: 'Скидання пароля',
    greeting: 'Привіт',
    body: 'Ми отримали запит на скидання пароля вашого облікового запису TREK. Натисніть кнопку нижче, щоб встановити новий пароль.',
    ctaIntro: 'Скинути пароль',
    expiry: 'Це посилання дійсне протягом 60 хвилин.',
    ignore: 'Якщо ви не надсилали цей запит, просто проігноруйте цей лист — ваш пароль залишиться незмінним.',
  },
};

export default uk;
