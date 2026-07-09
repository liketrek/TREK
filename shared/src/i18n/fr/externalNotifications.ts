import type { NotificationLocale } from '../externalNotifications/types';

const fr: NotificationLocale = {
  email: {
    footer: 'Vous recevez cet e-mail car les notifications sont activées dans TREK.',
    manage: 'Gérer les préférences',
    madeWith: 'Made with',
    openTrek: 'Ouvrir TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Invitation à "${p.trip}"`,
      body: `${p.actor} a invité ${p.invitee || 'un membre'} au voyage "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nouvelle réservation : ${p.booking}`,
      body: `${p.actor} a ajouté une réservation "${p.booking}" (${p.type}) à "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Rappel de voyage : ${p.trip}`,
      body: `Votre voyage "${p.trip}" approche !`,
    }),
    todo_due: (p) => ({
      title: `Tâche à échéance : ${p.todo}`,
      body: `"${p.todo}" dans "${p.trip}" est due le ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Invitation Vacay Fusion',
      body: `${p.actor} vous invite à fusionner les plans de vacances. Ouvrez TREK pour accepter ou refuser.`,
    }),
    collection_invite: (p) => ({
      title: 'Invitation à une collection',
      body: `${p.actor} vous invite à partager une collection. Ouvrez TREK pour accepter ou refuser.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} photos partagées`,
      body: `${p.actor} a partagé ${p.count} photo(s) dans "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Nouveau message dans "${p.trip}"`,
      body: `${p.actor} : ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Bagages : ${p.category}`,
      body: `${p.actor} vous a assigné à la catégorie "${p.category}" dans "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Nouvelle version TREK disponible',
      body: `TREK ${p.version} est maintenant disponible. Rendez-vous dans le panneau d'administration pour mettre à jour.`,
    }),
    synology_session_cleared: () => ({
      title: 'Session Synology effacée',
      body: 'Votre compte ou URL Synology a changé. Vous avez été déconnecté de Synology Photos.',
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Réinitialisez votre mot de passe',
    greeting: 'Bonjour',
    body: 'Nous avons reçu une demande de réinitialisation du mot de passe de votre compte TREK. Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe.',
    ctaIntro: 'Réinitialiser le mot de passe',
    expiry: 'Ce lien expire dans 60 minutes.',
    ignore: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail — votre mot de passe ne changera pas.",
  },
};

export default fr;
