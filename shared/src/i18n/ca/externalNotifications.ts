import type { NotificationLocale } from '../externalNotifications/types';
import { pluralForm } from '../plural';

const ca: NotificationLocale = {
  email: {
    footer: 'Has rebut això perquè tens les notificacions activades a TREK.',
    manage: 'Gestiona les preferències',
    madeWith: 'Fet amb',
    openTrek: 'Obre TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Invitació a "${p.trip}"`,
      body: `${p.actor} va convidar ${p.invitee || 'un membre'} al viatge "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Reserva nova: ${p.booking}`,
      body: `${p.actor} va afegir una reserva "${p.booking}" (${p.type}) a "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Recordatori: ${p.trip}`,
      body: `El teu viatge "${p.trip}" s'apropa!`,
    }),
    todo_due: (p) => ({
      title: `Tasca pendent: ${p.todo}`,
      body: `"${p.todo}" a "${p.trip}" venç el ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Invitació a Vacay Fusion',
      body: `${p.actor} et va convidar a fusionar plans de vacances. Obre TREK per acceptar o rebutjar.`,
    }),
    vacay_share: (p) => ({
      title: 'Calendari de Vacay compartit',
      body: `${p.actor} va compartir el seu calendari de vacances amb tu. Obre TREK per veure'l.`,
    }),
    photos_shared: (p) => ({
      title: pluralForm(p.count, 'ca', { one: `${p.count} foto compartida`, other: `${p.count} fotos compartides` }),
      body: pluralForm(p.count, 'ca', {
        one: `${p.actor} va compartir ${p.count} foto a "${p.trip}".`,
        other: `${p.actor} va compartir ${p.count} fotos a "${p.trip}".`,
      }),
    }),
    collab_message: (p) => ({
      title: `Missatge nou a "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Equipatge: ${p.category}`,
      body: `${p.actor} et va assignar a la categoria "${p.category}" a "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Versió nova de TREK disponible',
      body: `TREK ${p.version} ja està disponible. Visita el panell d'administració per actualitzar.`,
    }),
    replica_failure: (p) => ({
      title: "Error de rèplica d'emmagatzematge",
      body:
        `L'escriptura a la rèplica '${p.backend}' ha fallat: ${p.op} de ${p.key} — ${p.error}.` +
        (p.suppressed !== '0'
          ? pluralForm(p.suppressed, 'ca', {
              one: ` S'ha suprimit ${p.suppressed} error més des de l'última notificació.`,
              other: ` S'han suprimit ${p.suppressed} errors més des de l'última notificació.`,
            })
          : ''),
    }),
    synology_session_cleared: () => ({
      title: 'Sessió de Synology tancada',
      body: 'El teu compte o URL de Synology ha canviat. Has tancat la sessió a Synology Photos.',
    }),
    collection_invite: (p) => ({
      title: 'Invitació a una col·lecció',
      body: `${p.actor} t'ha convidat a compartir una col·lecció. Obre TREK per acceptar-la o rebutjar-la.`,
    }),
    plugin_notification: (p) => ({ title: p.title ?? '', body: p.body ?? '' }),
  },
  passwordReset: {
    subject: 'Restableix la teva contrasenya',
    greeting: 'Hola',
    body: 'Vam rebre una sol·licitud per restablir la contrasenya del teu compte de TREK. Fes clic al botó de sota per establir una contrasenya nova.',
    ctaIntro: 'Restableix la contrasenya',
    expiry: 'Aquest enllaç caduca en 60 minuts.',
    ignore: 'Si no ho vas sol·licitar tu, pots ignorar aquest correu — la teva contrasenya no canviarà.',
  },
};

export default ca;
