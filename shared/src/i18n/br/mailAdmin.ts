import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Importação de e-mails de reserva',
  'mailAdmin.hint': 'As confirmações de reserva encaminhadas viram reservas na viagem certa.',
  'mailAdmin.enabled': 'Importar e-mails de reserva',
  'mailAdmin.enabledHint':
    'Dá a todos nesta instalação um endereço de encaminhamento. Desativado, nenhum endereço recebe e-mails.',
  'mailAdmin.transport.label': 'Como o e-mail chega',
  'mailAdmin.transport.off': 'Somente envio de arquivo',
  'mailAdmin.transport.imap': 'Caixa de correio IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.aiDaily': 'E-mails por IA por pessoa e dia',
  'mailAdmin.aiDailyHint': 'Acima disso, só dados de reserva legíveis por máquina são lidos.',
  'mailAdmin.template': 'Modelo de endereço',
  'mailAdmin.templateHint': 'O endereço de encaminhamento, com {token} no lugar do código de cada pessoa.',
  'mailAdmin.imap.host': 'Servidor',
  'mailAdmin.imap.port': 'Porta',
  'mailAdmin.imap.tls': 'Criptografia',
  'mailAdmin.imap.user': 'Usuário',
  'mailAdmin.imap.pass': 'Senha',
  'mailAdmin.imap.mailbox': 'Pasta',
  'mailAdmin.imap.mailboxHint': 'Os e-mails lidos são movidos para TREK/processed.',
  'mailAdmin.webhook.secret': 'Segredo de assinatura',
  'mailAdmin.webhook.secretHint':
    'Pelo menos 32 caracteres; o remetente assina cada e-mail com ele. Vazio, o webhook fica desativado.',
  'mailAdmin.inboundUrl': 'Endereço do webhook',
  'mailAdmin.inboundUrlHint': 'Seu serviço de e-mail envia cada e-mail para cá, bruto e assinado.',
  'mailAdmin.copyUrl': 'Copiar endereço',
  'mailAdmin.envHint': 'As variáveis de ambiente (MAIL_INGEST_*) têm prioridade sobre estes campos.',
  'mailAdmin.loadError': 'Não foi possível carregar as configurações de importação de e-mails.',
  'mailAdmin.problem.secretShort': 'O segredo precisa ter pelo menos 32 caracteres.',
  'mailAdmin.problem.portInvalid': 'Digite uma porta entre 1 e 65535.',
  'mailAdmin.problem.templateToken': 'O endereço precisa de {token} para o código de cada pessoa.',
  'mailAdmin.problem.dailyInvalid': 'Digite um número inteiro de 0 a 1000.',
  'mailAdmin.status.title': 'Status', // same-as-en
  'mailAdmin.status.lastRead': 'Última leitura {time}',
  'mailAdmin.status.never': 'nunca',
  'mailAdmin.status.mails': 'E-mails, 24 h',
  'mailAdmin.status.added': 'Adicionados automaticamente',
  'mailAdmin.status.waiting': 'Aguardando',
  'mailAdmin.status.failed': 'Com falha',
  'mailAdmin.test.run': 'Testar conexão',
  'mailAdmin.test.ok': 'Conectado',
  'mailAdmin.test.failed': 'Sem conexão',
};
export default mailAdmin;
