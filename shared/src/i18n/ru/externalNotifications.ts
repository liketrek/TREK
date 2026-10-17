import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

const ru: NotificationLocale = {
  email: {
    footer: 'Вы получили это, потому что у вас включены уведомления в TREK.',
    manage: 'Управление настройками',
    madeWith: 'Made with',
    openTrek: 'Открыть TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Приглашение в "${p.trip}"`,
      body: `${p.actor} пригласил ${p.invitee || 'участника'} в поездку "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Новое бронирование: ${p.booking}`,
      body: `${p.actor} добавил бронирование "${p.booking}" (${p.type}) в "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Напоминание: ${p.trip}`,
      body: `Ваша поездка "${p.trip}" скоро начнётся!`,
    }),
    todo_due: (p) => ({
      title: `Задача к сроку: ${p.todo}`,
      body: `"${p.todo}" в поездке "${p.trip}" — срок ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Приглашение Vacay Fusion',
      body: `${p.actor} приглашает вас объединить планы отпуска. Откройте TREK для подтверждения.`,
    }),
    vacay_share: (p) => ({
      title: 'Календарь Vacay предоставлен',
      body: `${p.actor} поделился с вами своим календарём отпусков. Откройте TREK, чтобы посмотреть.`,
    }),
    collection_invite: (p) => ({
      title: 'Приглашение в коллекцию',
      body: `${p.actor} приглашает вас поделиться коллекцией. Откройте TREK для подтверждения.`,
    }),
    photos_shared: (p) => ({
      title: pluralForm(p.count, 'ru', {
        one: `${p.count} фото опубликовано`,
        few: `${p.count} фото опубликованы`,
        many: `${p.count} фото опубликовано`,
        other: `${p.count} фото опубликовано`,
      }),
      body: `${p.actor} поделился ${p.count} фото в "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Новое сообщение в "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Список вещей: ${p.category}`,
      body: `${p.actor} назначил вас в категорию "${p.category}" в "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Доступна новая версия TREK',
      body: `TREK ${p.version} теперь доступен. Перейдите в панель администратора для обновления.`,
    }),
    replica_failure: (p) => ({
      title: 'Сбой реплики хранилища',
      body:
        `Ошибка записи в реплику '${p.backend}': ${p.op} для ${p.key} — ${p.error}.` +
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'ru', {
              one: ` С момента последнего уведомления подавлена ещё ${p.suppressed} ошибка.`,
              few: ` С момента последнего уведомления подавлено ещё ${p.suppressed} ошибки.`,
              many: ` С момента последнего уведомления подавлено ещё ${p.suppressed} ошибок.`,
              other: ` С момента последнего уведомления подавлено ещё ${p.suppressed} ошибки.`,
            })
          : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Сессия Synology сброшена',
      body: 'Ваш аккаунт или URL Synology изменился. Вы вышли из Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Сброс пароля',
    greeting: 'Здравствуйте',
    body: 'Мы получили запрос на сброс пароля вашего аккаунта TREK. Нажмите кнопку ниже, чтобы установить новый пароль.',
    ctaIntro: 'Сбросить пароль',
    expiry: 'Ссылка действительна 60 минут.',
    ignore: 'Если вы не запрашивали сброс — просто проигнорируйте это письмо, пароль останется прежним.',
  },
};

export default ru;
