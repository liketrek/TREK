import type { NotificationLocale } from '../externalNotifications/types';

const hu: NotificationLocale = {
  email: {
    footer: 'Ezt az értesítést azért kaptad, mert engedélyezted az értesítéseket a TREK-ben.',
    manage: 'Beállítások kezelése',
    madeWith: 'Made with',
    openTrek: 'TREK megnyitása',
  },
  events: {
    trip_invite: (p) => ({
      title: `Meghívó a(z) "${p.trip}" utazásra`,
      body: `${p.actor} meghívta ${p.invitee || 'egy tagot'} a(z) "${p.trip}" utazásra.`,
    }),
    booking_change: (p) => ({
      title: `Új foglalás: ${p.booking}`,
      body: `${p.actor} hozzáadott egy "${p.booking}" (${p.type}) foglalást a(z) "${p.trip}" utazáshoz.`,
    }),
    trip_reminder: (p) => ({
      title: `Utazás emlékeztető: ${p.trip}`,
      body: `A(z) "${p.trip}" utazás hamarosan kezdődik!`,
    }),
    todo_due: (p) => ({
      title: `Teendő esedékes: ${p.todo}`,
      body: `"${p.todo}" (${p.trip}) határideje: ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay Fusion meghívó',
      body: `${p.actor} meghívott a nyaralási tervek összevonásához. Nyissa meg a TREK-et az elfogadáshoz vagy elutasításhoz.`,
    }),
    collection_invite: (p) => ({
      title: 'Gyűjtemény meghívó',
      body: `${p.actor} meghívott egy gyűjtemény megosztására. Nyissa meg a TREK-et az elfogadáshoz vagy elutasításhoz.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} fotó megosztva`,
      body: `${p.actor} ${p.count} fotót osztott meg a(z) "${p.trip}" utazásban.`,
    }),
    collab_message: (p) => ({
      title: `Új üzenet a(z) "${p.trip}" utazásban`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Csomagolás: ${p.category}`,
      body: `${p.actor} hozzárendelte Önt a "${p.category}" csomagolási kategóriához a(z) "${p.trip}" utazásban.`,
    }),
    version_available: (p) => ({
      title: 'Új TREK verzió érhető el',
      body: `A TREK ${p.version} elérhető. Látogasson el az adminisztrációs panelre a frissítéshez.`,
    }),
    synology_session_cleared: () => ({
      title: 'Synology munkamenet törölve',
      body: 'A Synology fiókja vagy URL-je megváltozott. Kijelentkeztek a Synology Photos-ból.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Jelszó visszaállítása',
    greeting: 'Szia',
    body: 'Kérést kaptunk a TREK-fiókod jelszavának visszaállítására. Kattints az alábbi gombra az új jelszó beállításához.',
    ctaIntro: 'Jelszó visszaállítása',
    expiry: 'Ez a link 60 perc után lejár.',
    ignore: 'Ha nem te kérted ezt, nyugodtan hagyd figyelmen kívül ezt az e-mailt — a jelszavad változatlan marad.',
  },
};

export default hu;
