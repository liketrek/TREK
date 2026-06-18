import type { NotificationLocale } from '../externalNotifications/types';

const br: NotificationLocale = {
  email: {
    footer: 'Você recebeu isso porque tem as notificações ativadas no TREK.',
    manage: 'Gerenciar preferências nas configurações',
    madeWith: 'Made with',
    openTrek: 'Abrir TREK',
  },
  events: {
    trip_invite: (p) => ({
      title: `Convite para "${p.trip}"`,
      body: `${p.actor} convidou ${p.invitee || 'um membro'} para a viagem "${p.trip}".`,
    }),
    booking_change: (p) => ({
      title: `Nova reserva: ${p.booking}`,
      body: `${p.actor} adicionou uma reserva "${p.booking}" (${p.type}) em "${p.trip}".`,
    }),
    trip_reminder: (p) => ({
      title: `Lembrete: ${p.trip}`,
      body: `Sua viagem "${p.trip}" está chegando!`,
    }),
    todo_due: (p) => ({
      title: `Tarefa com vencimento: ${p.todo}`,
      body: `"${p.todo}" em "${p.trip}" vence em ${p.due}.`,
    }),
    vacay_invite: (p) => ({
      title: 'Convite Vacay Fusion',
      body: `${p.actor} convidou você para fundir planos de férias. Abra o TREK para aceitar ou recusar.`,
    }),
    photos_shared: (p) => ({
      title: `${p.count} fotos compartilhadas`,
      body: `${p.actor} compartilhou ${p.count} foto(s) em "${p.trip}".`,
    }),
    collab_message: (p) => ({
      title: `Nova mensagem em "${p.trip}"`,
      body: `${p.actor}: ${p.preview}`,
    }),
    packing_tagged: (p) => ({
      title: `Bagagem: ${p.category}`,
      body: `${p.actor} atribuiu você à categoria "${p.category}" em "${p.trip}".`,
    }),
    version_available: (p) => ({
      title: 'Nova versão do TREK disponível',
      body: `O TREK ${p.version} está disponível. Acesse o painel de administração para atualizar.`,
    }),
    synology_session_cleared: () => ({
      title: 'Sessão Synology encerrada',
      body: 'Sua conta ou URL do Synology foi alterada. Você foi desconectado do Synology Photos.',
    }),
  },
  passwordReset: {
    subject: 'Redefinir sua senha',
    greeting: 'Olá',
    body: 'Recebemos um pedido para redefinir a senha da sua conta TREK. Clique no botão abaixo para definir uma nova senha.',
    ctaIntro: 'Redefinir senha',
    expiry: 'Este link expira em 60 minutos.',
    ignore: 'Se você não solicitou isto, pode ignorar este e-mail — sua senha não será alterada.',
  },
};

export default br;
