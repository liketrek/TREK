import type { NotificationLocale } from '../externalNotifications/types';

const it: NotificationLocale = {
  email: {
    footer: 'Hai ricevuto questa email perché hai le notifiche abilitate in TREK.',
    manage: 'Gestisci le preferenze nelle impostazioni',
    madeWith: 'Made with',
    openTrek: 'Apri TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Invito a "${p.trip}"`,
      body: `${p.actor} ha invitato ${p.invitee || 'un membro'} al viaggio "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nuova prenotazione: ${p.booking}`,
      body: `${p.actor} ha aggiunto una prenotazione "${p.booking}" (${p.type}) a "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Promemoria viaggio: ${p.trip}`,
      body: `Il tuo viaggio "${p.trip}" si avvicina!`,
    }),
    todo_due: (p) => ({
      title: `Attività in scadenza: ${p.todo}`,
      body: `"${p.todo}" in "${p.trip}" scade il ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Invito Vacay Fusion',
      body: `${p.actor} ti ha invitato a fondere i piani vacanza. Apri TREK per accettare o rifiutare.`,
    }),
    collection_invite: (p) => ({
      title: 'Invito a una raccolta',
      body: `${p.actor} ti ha invitato a condividere una raccolta. Apri TREK per accettare o rifiutare.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} foto condivise`,
      body: `${p.actor} ha condiviso ${p.count} foto in "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Nuovo messaggio in "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Bagagli: ${p.category}`,
      body: `${p.actor} ti ha assegnato alla categoria "${p.category}" in "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Nuova versione TREK disponibile',
      body: `TREK ${p.version} è ora disponibile. Visita il pannello di amministrazione per aggiornare.`,
    }),
    synology_session_cleared: () => ({
      title: 'Sessione Synology rimossa',
      body: 'Il tuo account o URL Synology è cambiato. Sei stato disconnesso da Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Reimposta la tua password',
    greeting: 'Ciao',
    body: 'Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account TREK. Clicca il pulsante qui sotto per impostare una nuova password.',
    ctaIntro: 'Reimposta password',
    expiry: 'Questo link scade tra 60 minuti.',
    ignore: 'Se non hai richiesto questa operazione, ignora questa email — la tua password non cambierà.',
  },
};

export default it;
