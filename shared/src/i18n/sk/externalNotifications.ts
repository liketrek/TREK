import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

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
    flight_departed: (p) => ({
      title: `${p.flight} odletel`,
      body: `${p.flight} z ${p.from} do ${p.to} je vo vzduchu.`,
    }),
    flight_delayed: (p) => ({
      title: `${p.flight} mešká`,
      body: `${p.flight} z ${p.from} do ${p.to} mešká približne ${p.delay} minút.`,
    }),
    flight_landed: (p) => ({
      title: `${p.flight} pristál`,
      body: `${p.flight} z ${p.from} pristál v ${p.to}.`,
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
      title: pluralForm(p.count, 'sk', {
        one: `${p.count} zdieľaná fotka`,
        few: `${p.count} zdieľané fotky`,
        other: `${p.count} zdieľaných fotiek`,
      }),
      body: pluralForm(p.count, 'sk', {
        one: `${p.actor} zdieľal(a) ${p.count} fotku v "${p.trip}".`,
        few: `${p.actor} zdieľal(a) ${p.count} fotky v "${p.trip}".`,
        other: `${p.actor} zdieľal(a) ${p.count} fotiek v "${p.trip}".`,
      }),
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
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'sk', {
              one: ` Od posledného upozornenia bolo potlačené ${p.suppressed} ďalšie zlyhanie.`,
              few: ` Od posledného upozornenia boli potlačené ${p.suppressed} ďalšie zlyhania.`,
              other: ` Od posledného upozornenia bolo potlačených ${p.suppressed} ďalších zlyhaní.`,
            })
          : ''),
    }),
    paddle_region_requested: (p) => ({
      title: 'Vyžiadaný vodácky región',
      body: `${p.actor} plánuje vodácku trasu v regióne ${p.region}. Načítaj alebo zamietni jeho vodné dáta v administrácii v časti Doplnky.`,
    }),
    synology_session_cleared: () => ({
      title: 'Relácia Synology bola zrušená',
      body: 'Váš účet alebo URL Synology sa zmenili. Boli ste odhlásení zo Synology Photos.',
    }),
    wanderer_source_hint: (p) => ({
      title: `Trasa wanderer: ${p.tour}`,
      body:
        p.state === 'changed'
          ? `„${p.tour}“ v „${p.trip}“ bola vo wanderer zmenená. Otvorte túru a skontrolujte jej zdroj, aby ste videli všetky zmeny. V ceste sa nič nezmení samo.`
          : p.state === 'unverifiable'
            ? `„${p.tour}“ v „${p.trip}“ sa už vo wanderer nedá overiť. Túra vo vašej ceste zostáva, ako je.`
            : `„${p.tour}“ v „${p.trip}“ sa vo wanderer možno zmenila. Otvorte túru a skontrolujte jej zdroj. V ceste sa nič nezmení samo.`,
    }),
    mail_booking_added: (p) => ({
      title: `Pridané z e-mailu: ${p.booking}`,
      body:
        p.role === 'traveller'
          ? `${p.actor} pridal(a) „${p.booking}“ do „${p.trip}“ z preposlaného e-mailu.`
          : `„${p.booking}“ z vášho preposlaného e-mailu bola pridaná do „${p.trip}“. V TREK to môžete 7 dní vrátiť späť.`,
    }),
    mail_booking_pending: (p) => ({
      title: 'Preposlané rezervácie na kontrolu',
      body: `Preposlané rezervácie čakajúce na vás v TREK: ${p.count}. Pri každej je uvedené, prečo nebola pridaná sama.`,
    }),
    mail_ingest_paused: () => ({
      title: 'Import e-mailov pozastavený',
      body: 'TREK zatiaľ neprijíma preposlané e-maily s rezerváciami, preto ich zatiaľ nepreposielajte. Vaše adresy zostávajú a znova budú fungovať, keď sa import vráti, a už pridané rezervácie zostávajú vo vašich cestách.',
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
