import type { NotificationLocale } from '../externalNotifications/types';
import reservations from './reservations';

const et: NotificationLocale = {
  email: {
    footer: 'Said selle kirja, sest oled TREKis teavitused lubanud.',
    manage: 'Halda eelistusi seadetes',
    madeWith: 'Loodud rakendusega',
    openTrek: 'Ava TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Reisikutse: „${p.trip}”`,
      body: `${p.actor} kutsus ${p.invitee ? `kasutaja ${p.invitee}` : 'ühe liikme'} reisile „${p.trip}”.`,
    }),
    booking_change: (p) => ({
      title: `Uus broneering: ${p.booking}`,
      body: `${p.actor} lisas reisile „${p.trip}” uue broneeringu „${p.booking}” (tüüp: ${reservations[`reservations.type.${p.type}`] ?? (p.type === 'booking' ? 'broneering' : p.type)}).`,
    }),
    trip_reminder: (p) => ({
      title: `Reisi meeldetuletus: ${p.trip}`,
      body: `Sinu reis „${p.trip}” algab peagi!`,
    }),
    todo_due: (p) => ({
      title: `Ülesande tähtaeg: ${p.todo}`,
      body: `Reisi „${p.trip}” ülesande „${p.todo}” tähtaeg on ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Kutse puhkuseplaanide ühendamiseks',
      body: `${p.actor} kutsus sind puhkuseplaane ühendama. Nõustumiseks või keeldumiseks ava TREK.`,
    }),
    vacay_share: (p) => ({
      title: 'Puhkusekalender jagatud',
      body: `${p.actor} jagas sinuga oma puhkusekalendrit. Vaatamiseks ava TREK.`,
    }),
    collection_invite: (p) => ({
      title: 'Kogumiku kutse',
      body: `${p.actor} kutsus sind kogumikku jagama. Nõustumiseks või keeldumiseks ava TREK.`,
    }),
    photos_shared: (p) => ({
      title: `Jagatud ${p.count} fotot`,
      body: `${p.actor} jagas reisil „${p.trip}” ${p.count} fotot.`,
    }),
    collab_message: (p) => ({
      title: `Uus sõnum reisil „${p.trip}”`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Pakkimine: ${p.category}`,
      body: `${p.actor} määras sind reisil „${p.trip}” vastutama pakkimiskategooria „${p.category}” eest.`,
    }),
    version_available: (p) => ({
      title: 'TREKi uus versioon on saadaval',
      body: `TREK ${p.version} on nüüd saadaval. Uuendamiseks ava halduspaneel.`,
    }),
    replica_failure: (p) => ({
      title: 'Salvestuskoopia tõrge',
      body:
        `Koopia kirjutamine taustasüsteemi „${p.backend}” ebaõnnestus: toiming ${p.op}, võti ${p.key} — ${p.error}.` +
        (p.suppressed !== '0' ? ` Pärast viimast teavitust jäeti veel ${p.suppressed} tõrke teavitused saatmata.` : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Synology seanss tühjendatud',
      body: 'Sinu Synology konto või URL muutus. Sind on Synology Photosist välja logitud.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Lähtesta oma parool',
    greeting: 'Tere',
    body: 'Saime taotluse sinu TREKi konto parooli lähtestamiseks. Uue parooli määramiseks klõpsa alloleval nupul.',
    ctaIntro: 'Lähtesta parool',
    expiry: 'See link aegub 60 minuti pärast.',
    ignore: 'Kui sa seda ei taotlenud, võid kirja rahulikult eirata — sinu parool ei muutu.',
  },
};

export default et;
