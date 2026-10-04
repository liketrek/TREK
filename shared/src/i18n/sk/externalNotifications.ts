import type { NotificationLocale } from '../externalNotifications/types';

const sk: NotificationLocale = {
  email: {
    footer: 'Toto ste dostali, pretože máte v TREK povolené upozornenia.',
    manage: 'Spravovať predvoľby v Nastaveniach',
    madeWith: 'Made with',
    openTrek: 'Otvoriť TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Pozvánka na cestu: "${p.trip}"`,
      body: `${p.actor} pozval(a) ${p.invitee || 'člena'} na cestu "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nová rezervácia: ${p.booking}`,
      body: `${p.actor} pridal(a) novú rezerváciu ${p.type} "${p.booking}" do "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Pripomienka cesty: ${p.trip}`,
      body: `Vaša cesta "${p.trip}" sa čoskoro blíži!`,
    }),
    todo_due: (p) => ({
      title: `Termín úlohy: ${p.todo}`,
      body: `"${p.todo}" v "${p.trip}" má termín ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Pozvánka Vacay Fusion',
      body: `${p.actor} vás pozval(a) na spojenie plánov dovolenky. Otvorte TREK na prijatie alebo odmietnutie.`,
    }),
    vacay_share: (p) => ({
      title: 'Kalendár Vacay zdieľaný',
      body: `${p.actor} s vami zdieľal(a) svoj kalendár dovoleniek. Otvorte TREK na jeho zobrazenie.`,
    }),
    collection_invite: (p) => ({
      title: 'Pozvánka do zbierky',
      body: `${p.actor} vás pozval(a) na zdieľanie zbierky. Otvorte TREK na prijatie alebo odmietnutie.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} zdieľaných fotiek`,
      body: `${p.actor} zdieľal(a) ${p.count} fotku/fotiek v "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Nová správa v "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Balenie: ${p.category}`,
      body: `${p.actor} vás priradil(a) do kategórie balenia "${p.category}" v "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Dostupná nová verzia TREK',
      body: `TREK ${p.version} je teraz dostupný. Navštívte panel správcu na aktualizáciu.`,
    }),
    replica_failure: (p) => ({
      title: 'Zlyhanie repliky úložiska',
      body:
        `Zápis do repliky zlyhal na '${p.backend}': ${p.op} ${p.key} — ${p.error}.` +
        (p.suppressed !== '0' ? ` Od posledného upozornenia bolo potlačených ${p.suppressed} ďalších zlyhaní.` : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Relácia Synology bola zrušená',
      body: 'Váš účet alebo URL Synology sa zmenili. Boli ste odhlásení zo Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Obnovte si heslo',
    greeting: 'Ahoj',
    body: 'Dostali sme žiadosť o obnovenie hesla k vášmu účtu TREK. Kliknite na tlačidlo nižšie a nastavte si nové heslo.',
    ctaIntro: 'Obnoviť heslo',
    expiry: 'Tento odkaz vyprší za 60 minút.',
    ignore: 'Ak ste o to nežiadali, tento e-mail môžete pokojne ignorovať — vaše heslo sa nezmení.',
  },
};

export default sk;
