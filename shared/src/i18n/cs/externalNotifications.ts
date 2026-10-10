import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

const cs: NotificationLocale = {
  email: {
    footer: 'Toto jsi obdržel/a, protože máš povoleny upozornění v TREK.',
    manage: 'Spravovat předvolby v nastavení',
    madeWith: 'Made with',
    openTrek: 'Otevřít TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Pozvánka do "${p.trip}"`,
      body: `${p.actor} pozval ${p.invitee || 'člena'} na výlet "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nová rezervace: ${p.booking}`,
      body: `${p.actor} přidal rezervaci "${p.booking}" (${p.type}) k "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Připomínka výletu: ${p.trip}`,
      body: `Váš výlet "${p.trip}" se blíží!`,
    }),
    todo_due: (p) => ({
      title: `Úkol se blíží: ${p.todo}`,
      body: `"${p.todo}" ve výletě "${p.trip}" má termín ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Pozvánka Vacay Fusion',
      body: `${p.actor} vás pozval ke spojení dovolenkových plánů. Otevřete TREK pro přijetí nebo odmítnutí.`,
    }),
    vacay_share: (p) => ({
      title: 'Kalendář Vacay sdílen',
      body: `${p.actor} s vámi sdílel svůj kalendář dovolených. Otevřete TREK pro zobrazení.`,
    }),
    collection_invite: (p) => ({
      title: 'Pozvánka do sbírky',
      body: `${p.actor} vás pozval ke sdílení sbírky. Otevřete TREK pro přijetí nebo odmítnutí.`,
    }),
    photos_shared: (p) => ({
      title: pluralForm(p.count, 'cs', {
        one: `${p.count} sdílená fotka`,
        few: `${p.count} sdílené fotky`,
        other: `${p.count} sdílených fotek`,
      }),
      body: pluralForm(p.count, 'cs', {
        one: `${p.actor} sdílel ${p.count} fotku v "${p.trip}".`,
        few: `${p.actor} sdílel ${p.count} fotky v "${p.trip}".`,
        other: `${p.actor} sdílel ${p.count} fotek v "${p.trip}".`,
      }),
    }),
    collab_message: (p) => ({
      title: `Nová zpráva v "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Balení: ${p.category}`,
      body: `${p.actor} vás přiřadil do kategorie "${p.category}" v "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Nová verze TREK dostupná',
      body: `TREK ${p.version} je nyní dostupný. Navštivte administrátorský panel pro aktualizaci.`,
    }),
    replica_failure: (p) => ({
      title: 'Selhání repliky úložiště',
      body:
        `Zápis do repliky '${p.backend}' selhal: ${p.op} u ${p.key} — ${p.error}.` +
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'cs', {
              one: ` Od poslední notifikace bylo potlačeno ${p.suppressed} další selhání.`,
              few: ` Od poslední notifikace byla potlačena ${p.suppressed} další selhání.`,
              other: ` Od poslední notifikace bylo potlačeno ${p.suppressed} dalších selhání.`,
            })
          : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Relace Synology byla zrušena',
      body: 'Váš účet nebo URL Synology se změnil. Byli jste odhlášeni ze Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Obnovení hesla',
    greeting: 'Ahoj',
    body: 'Obdrželi jsme žádost o obnovení hesla k tvému účtu TREK. Klikni na tlačítko níže a nastav nové heslo.',
    ctaIntro: 'Obnovit heslo',
    expiry: 'Odkaz vyprší za 60 minut.',
    ignore: 'Pokud jsi o obnovení nežádal/a, tento e-mail ignoruj — heslo zůstane beze změny.',
  },
};

export default cs;
