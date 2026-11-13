import type { TranslationStrings } from '../types';

const mailAdmin: TranslationStrings = {
  'mailAdmin.title': 'Import des e-mails de réservation',
  'mailAdmin.hint': 'Les confirmations de réservation transférées deviennent des réservations dans le bon voyage.',
  'mailAdmin.enabled': 'Importer les e-mails de réservation',
  'mailAdmin.enabledHint':
    'Donne à chaque utilisateur de cette installation une adresse de transfert. Désactivé, aucune adresse ne reçoit d’e-mails.',
  'mailAdmin.transport.label': 'Mode de réception des e-mails',
  'mailAdmin.transport.off': 'Import de fichiers uniquement',
  'mailAdmin.transport.imap': 'Boîte aux lettres IMAP',
  'mailAdmin.transport.webhook': 'Webhook', // same-as-en
  'mailAdmin.transport.offInfo':
    'Pas de boîte mail : on importe un e-mail enregistré en fichier .eml dans ses paramètres, et TREK le lit de la même façon. Idéal pour essayer.',
  'mailAdmin.transport.imapInfo':
    'TREK consulte une boîte mail toutes les deux minutes et récupère les nouveaux e-mails. Utilise une boîte dédiée qui accepte les adresses avec + (trek+…@ton-domaine), pas une boîte personnelle : les e-mails lus vont dans TREK/processed.',
  'mailAdmin.transport.webhookInfo':
    'Un service mail, comme un Cloudflare Email Worker, remet chaque e-mail directement à TREK et le signe avec la clé ci-dessous, pour que personne d’autre ne puisse glisser des e-mails. Pour les installations sans boîte mail.',
  'mailAdmin.aiDaily': 'E-mails traités par IA par personne et par jour',
  'mailAdmin.aiDailyHint': 'Au-delà, seules les données de réservation lisibles par machine sont lues.',
  'mailAdmin.template': 'Modèle d’adresse',
  'mailAdmin.templateHint': 'L’adresse de transfert, avec {token} à l’endroit où va le code de chaque personne.',
  'mailAdmin.imap.host': 'Serveur',
  'mailAdmin.imap.port': 'Port', // same-as-en
  'mailAdmin.imap.tls': 'Chiffrement',
  'mailAdmin.imap.user': 'Utilisateur',
  'mailAdmin.imap.pass': 'Mot de passe',
  'mailAdmin.imap.mailbox': 'Dossier',
  'mailAdmin.imap.mailboxHint': 'Les e-mails lus sont déplacés vers TREK/processed.',
  'mailAdmin.webhook.secret': 'Secret de signature',
  'mailAdmin.webhook.secretHint':
    'Au moins 32 caractères ; l’expéditeur signe chaque e-mail avec. Vide, le webhook est désactivé.',
  'mailAdmin.inboundUrl': 'Adresse du webhook',
  'mailAdmin.inboundUrlHint': 'Votre service de messagerie y envoie chaque e-mail, brut et signé.',
  'mailAdmin.copyUrl': 'Copier l’adresse',
  'mailAdmin.envHint': 'Les variables d’environnement (MAIL_INGEST_*) l’emportent sur ces champs.',
  'mailAdmin.loadError': 'Les paramètres d’import des e-mails n’ont pas pu être chargés.',
  'mailAdmin.problem.secretShort': 'Le secret doit comporter au moins 32 caractères.',
  'mailAdmin.problem.portInvalid': 'Saisissez un port entre 1 et 65535.',
  'mailAdmin.problem.templateToken': 'L’adresse doit contenir {token} pour le code de chaque personne.',
  'mailAdmin.problem.dailyInvalid': 'Saisissez un nombre entier de 0 à 1000.',
  'mailAdmin.status.title': 'État',
  'mailAdmin.status.lastRead': 'Dernière lecture {time}',
  'mailAdmin.status.never': 'jamais',
  'mailAdmin.status.mails': 'E-mails, 24 h',
  'mailAdmin.status.added': 'Ajoutés automatiquement',
  'mailAdmin.status.waiting': 'En attente',
  'mailAdmin.status.failed': 'Échoués',
  'mailAdmin.test.run': 'Tester la connexion',
  'mailAdmin.test.ok': 'Connecté',
  'mailAdmin.test.failed': 'Pas de connexion',
};
export default mailAdmin;
