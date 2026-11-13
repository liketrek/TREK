import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Importación de correos de reserva',
  'mailAdmin.hint': 'Las confirmaciones de reserva reenviadas se convierten en reservas del viaje correcto.',
  'mailAdmin.enabled': 'Importar correos de reserva',
  'mailAdmin.enabledHint':
    'Da a todos los usuarios de esta instalación una dirección de reenvío. Desactivado, ninguna dirección recibe correo.',
  'mailAdmin.transport.label': 'Cómo llega el correo',
  'mailAdmin.transport.off': 'Solo subida de archivos',
  'mailAdmin.transport.imap': 'Buzón IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Sin buzón: se sube un correo guardado como archivo .eml en los ajustes, y TREK lo lee igual. Ideal para probarlo.',
  'mailAdmin.transport.imapInfo':
    'TREK revisa un buzón cada dos minutos y recoge los correos nuevos. Usa un buzón propio que acepte direcciones con + (trek+…@tu-dominio), no uno personal: los correos leídos pasan a TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Un servicio de correo, como un Cloudflare Email Worker, entrega cada correo directamente a TREK y lo firma con la clave de abajo, para que nadie más pueda colar correos. Para instalaciones sin buzón.',
  'mailAdmin.aiDaily': 'Correos con IA por persona y día',
  'mailAdmin.aiDailyHint': 'Por encima de ese número, solo se leen datos de reserva legibles por máquina.',
  'mailAdmin.template': 'Plantilla de dirección',
  'mailAdmin.templateHint': 'La dirección de reenvío, con {token} donde va el código de cada persona.',
  'mailAdmin.imap.host': 'Servidor',
  'mailAdmin.imap.port': 'Puerto',
  'mailAdmin.imap.tls': 'Cifrado',
  'mailAdmin.imap.user': 'Usuario',
  'mailAdmin.imap.pass': 'Contraseña',
  'mailAdmin.imap.mailbox': 'Carpeta',
  'mailAdmin.imap.mailboxHint': 'Los correos leídos se mueven a TREK/processed.',
  'mailAdmin.webhook.secret': 'Secreto de firma',
  'mailAdmin.webhook.secretHint':
    'Al menos 32 caracteres; el remitente firma cada correo con él. Vacío, el webhook se desactiva.',
  'mailAdmin.inboundUrl': 'Dirección del webhook',
  'mailAdmin.inboundUrlHint': 'Tu servicio de correo envía aquí cada correo, en bruto y firmado.',
  'mailAdmin.copyUrl': 'Copiar dirección',
  'mailAdmin.envHint': 'Las variables de entorno (MAIL_INGEST_*) tienen prioridad sobre estos campos.',
  'mailAdmin.loadError': 'No se pudo cargar la configuración de importación de correo.',
  'mailAdmin.problem.secretShort': 'El secreto necesita al menos 32 caracteres.',
  'mailAdmin.problem.portInvalid': 'Introduce un puerto entre 1 y 65535.',
  'mailAdmin.problem.templateToken': 'La dirección necesita {token} para el código de cada persona.',
  'mailAdmin.problem.dailyInvalid': 'Introduce un número entero de 0 a 1000.',
  'mailAdmin.status.title': 'Estado',
  'mailAdmin.status.lastRead': 'Última lectura {time}',
  'mailAdmin.status.never': 'nunca',
  'mailAdmin.status.mails': 'Correos, 24 h',
  'mailAdmin.status.added': 'Añadidos automáticamente',
  'mailAdmin.status.waiting': 'En espera',
  'mailAdmin.status.failed': 'Fallidos',
  'mailAdmin.test.run': 'Probar conexión',
  'mailAdmin.test.ok': 'Conectado',
  'mailAdmin.test.failed': 'Sin conexión',
};
export default mailAdmin;
