import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

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
    vacay_share: (p) => ({
      title: 'Calendrier Vacay partagé',
      body: `${p.actor} a partagé son calendrier de vacances avec vous. Ouvrez TREK pour le consulter.`,
    }),
    collection_invite: (p) => ({
      title: 'Invitation à une collection',
      body: `${p.actor} vous invite à partager une collection. Ouvrez TREK pour accepter ou refuser.`,
    }),
    photos_shared: (p) => ({
      title: pluralForm(p.count, 'fr', { one: `${p.count} photo partagée`, other: `${p.count} photos partagées` }),
      body: pluralForm(p.count, 'fr', {
        one: `${p.actor} a partagé ${p.count} photo dans "${p.trip}".`,
        other: `${p.actor} a partagé ${p.count} photos dans "${p.trip}".`,
      }),
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
    replica_failure: (p) => ({
      title: 'Échec de réplique de stockage',
      body:
        `Échec de l'écriture sur la réplique '${p.backend}' : ${p.op} de ${p.key} — ${p.error}.` +
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'fr', {
              one: ` ${p.suppressed} autre échec n'a pas été signalé depuis la dernière notification.`,
              other: ` ${p.suppressed} autres échecs n'ont pas été signalés depuis la dernière notification.`,
            })
          : ''),
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
