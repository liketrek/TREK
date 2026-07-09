import type { NotificationLocale } from '../externalNotifications/types';

const en: NotificationLocale = {
  email: {
    footer: 'Du har fått detta eftersom du har aktiverat aviseringar i TREK.',
    manage: 'Hantera egenskaper under Inställningar',
    madeWith: 'Gjorde med',
    openTrek: 'Öppna TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Reseinbjudan: "${p.trip}"`,
      body: `${p.actor} bjöd in ${p.invitee || 'en medlem'} till resan "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Ny bokning: ${p.booking}`,
      body: `${p.actor} la till en ny ${p.type} "${p.booking}" till "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Resepåminnelse: ${p.trip}`,
      body: `Din resa "${p.trip}" kommer snart!`,
    }),
    todo_due: (p) => ({
      title: `Uppgift förfaller: ${p.todo}`,
      body: `"${p.todo}" i "${p.trip}" förfaller den ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Vacay sammanslagnings inbjudan',
      body: `${p.actor} bjöd in dig att slå samman semesterplaner. Öppna TREK för att acceptera eller avvisa.`,
    }),
    collection_invite: (p) => ({
      title: 'Inbjudan till samling',
      body: `${p.actor} bjöd in dig att dela en samling. Öppna TREK för att acceptera eller avvisa.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} foton delade`,
      body: `${p.actor} delade ${p.count} foto(n) i "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Nytt meddelande i "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Packning: ${p.category}`,
      body: `${p.actor} tilldelade dig till "${p.category}" packning kategori i "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Ny TREK version tillgänglig',
      body: `TREK ${p.version} är nu tillgänglig. Gå till adminpanelen för att uppdatera.`,
    }),
    synology_session_cleared: () => ({
      title: 'Synology session rensad',
      body: 'Ditt Synology-konto eller din webbadress har ändrats. Du har loggats ut från Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Återställ ditt lösenord',
    greeting: 'Hej',
    body: 'Vi har fått en begäran om att återställa lösenordet till ditt TREK konto. Klicka på knappen nedan för att ange ett nytt lösenord.',
    ctaIntro: 'Återställ lösenord',
    expiry: 'Den här länken upphör att gälla om 60 minuter.',
    ignore:
      'Om du inte har begärt detta kan du lugnt strunta i det här e-postmeddelandet – ditt lösenord kommer inte att ändras.',
  },
};

export default en;
