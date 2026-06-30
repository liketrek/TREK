import type { NotificationLocale } from '../externalNotifications/types';

const es: NotificationLocale = {
  email: {
    footer: 'Recibiste esto porque tienes las notificaciones activadas en TREK.',
    manage: 'Gestionar preferencias',
    madeWith: 'Made with',
    openTrek: 'Abrir TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Invitación a "${p.trip}"`,
      body: `${p.actor} invitó a ${p.invitee || 'un miembro'} al viaje "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nueva reserva: ${p.booking}`,
      body: `${p.actor} añadió una reserva "${p.booking}" (${p.type}) a "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Recordatorio: ${p.trip}`,
      body: `¡Tu viaje "${p.trip}" se acerca!`,
    }),
    todo_due: (p) => ({
      title: `Tarea pendiente: ${p.todo}`,
      body: `"${p.todo}" en "${p.trip}" vence el ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Invitación Vacay Fusion',
      body: `${p.actor} te invitó a fusionar planes de vacaciones. Abre TREK para aceptar o rechazar.`,
    }),
    collection_invite: (p) => ({
      title: 'Invitación a colección',
      body: `${p.actor} te invitó a compartir una colección. Abre TREK para aceptar o rechazar.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} fotos compartidas`,
      body: `${p.actor} compartió ${p.count} foto(s) en "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Nuevo mensaje en "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Equipaje: ${p.category}`,
      body: `${p.actor} te asignó a la categoría "${p.category}" en "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Nueva versión de TREK disponible',
      body: `TREK ${p.version} ya está disponible. Visita el panel de administración para actualizar.`,
    }),
    synology_session_cleared: () => ({
      title: 'Sesión de Synology cerrada',
      body: 'Tu cuenta o URL de Synology ha cambiado. Has cerrado sesión en Synology Photos.',
    }),
  },
  passwordReset: {
    subject: 'Restablecer tu contraseña',
    greeting: 'Hola',
    body: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta de TREK. Haz clic en el botón de abajo para establecer una nueva contraseña.',
    ctaIntro: 'Restablecer contraseña',
    expiry: 'Este enlace caduca en 60 minutos.',
    ignore: 'Si no solicitaste esto, puedes ignorar este correo — tu contraseña no cambiará.',
  },
};

export default es;
