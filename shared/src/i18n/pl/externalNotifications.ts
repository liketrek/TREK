import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

const pl: NotificationLocale = {
  email: {
    footer: 'Otrzymałeś/aś tę wiadomość, ponieważ masz włączone powiadomienia w TREK.',
    manage: 'Zarządzaj preferencjami w ustawieniach',
    madeWith: 'Made with',
    openTrek: 'Otwórz TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Zaproszenie do "${p.trip}"`,
      body: `${p.actor} zaprosił ${p.invitee || 'członka'} do podróży "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nowa rezerwacja: ${p.booking}`,
      body: `${p.actor} dodał rezerwację "${p.booking}" (${p.type}) do "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Przypomnienie o podróży: ${p.trip}`,
      body: `Twoja podróż "${p.trip}" zbliża się!`,
    }),
    todo_due: (p) => ({
      title: `Zadanie z terminem: ${p.todo}`,
      body: `"${p.todo}" w "${p.trip}" — termin ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Zaproszenie Vacay Fusion',
      body: `${p.actor} zaprosił Cię do połączenia planów urlopowych. Otwórz TREK, aby zaakceptować lub odrzucić.`,
    }),
    vacay_share: (p) => ({
      title: 'Kalendarz Vacay udostępniony',
      body: `${p.actor} udostępnił Ci swój kalendarz urlopów. Otwórz TREK, aby go zobaczyć.`,
    }),
    collection_invite: (p) => ({
      title: 'Zaproszenie do kolekcji',
      body: `${p.actor} zaprosił Cię do udostępnienia kolekcji. Otwórz TREK, aby zaakceptować lub odrzucić.`,
    }),
    photos_shared: (p) => ({
      title: pluralForm(p.count, 'pl', {
        one: `Udostępniono ${p.count} zdjęcie`,
        few: `Udostępniono ${p.count} zdjęcia`,
        many: `Udostępniono ${p.count} zdjęć`,
        other: `Udostępniono ${p.count} zdjęcia`,
      }),
      body: pluralForm(p.count, 'pl', {
        one: `${p.actor} udostępnił ${p.count} zdjęcie w "${p.trip}".`,
        few: `${p.actor} udostępnił ${p.count} zdjęcia w "${p.trip}".`,
        many: `${p.actor} udostępnił ${p.count} zdjęć w "${p.trip}".`,
        other: `${p.actor} udostępnił ${p.count} zdjęcia w "${p.trip}".`,
      }),
    }),
    collab_message: (p) => ({
      title: `Nowa wiadomość w "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Pakowanie: ${p.category}`,
      body: `${p.actor} przypisał Cię do kategorii "${p.category}" w "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Nowa wersja TREK dostępna',
      body: `TREK ${p.version} jest teraz dostępny. Odwiedź panel administracyjny, aby zaktualizować.`,
    }),
    replica_failure: (p) => ({
      title: 'Awaria repliki magazynu',
      body:
        `Zapis do repliki '${p.backend}' nie powiódł się: ${p.op} dla ${p.key} — ${p.error}.` +
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'pl', {
              one: ` Od ostatniego powiadomienia ukryto ${p.suppressed} kolejny błąd.`,
              few: ` Od ostatniego powiadomienia ukryto ${p.suppressed} kolejne błędy.`,
              many: ` Od ostatniego powiadomienia ukryto ${p.suppressed} kolejnych błędów.`,
              other: ` Od ostatniego powiadomienia ukryto ${p.suppressed} kolejnego błędu.`,
            })
          : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Sesja Synology wyczyszczona',
      body: 'Twoje konto lub URL Synology uległo zmianie. Zostałeś wylogowany z Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Zresetuj hasło',
    greeting: 'Cześć',
    body: 'Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta TREK. Kliknij przycisk poniżej, aby ustawić nowe hasło.',
    ctaIntro: 'Zresetuj hasło',
    expiry: 'Link wygaśnie za 60 minut.',
    ignore: 'Jeśli to nie Ty, zignoruj tę wiadomość — Twoje hasło pozostanie bez zmian.',
  },
};

export default pl;
