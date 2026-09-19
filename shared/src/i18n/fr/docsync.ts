import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Synchronisation des documents',
  'docsync.noProviders': 'Aucun fournisseur de documents n’est disponible',
  'docsync.noProvidersHint': 'Un administrateur de l’instance les active dans Admin, Extensions, Documents.',
  'docsync.addProvider': 'Connecter un fournisseur',
  'docsync.test': 'Tester la connexion',
  'docsync.connect.optional': 'Facultatif',
  'docsync.connected': 'Connecté',
  'docsync.chooseFolder': 'Choisir le dossier',
  'docsync.noFolders': 'Rien trouvé sur cette instance pour le moment.',
  'docsync.newFolderPlaceholder': 'Nom du nouveau dossier',
  'docsync.syncNow': 'Synchroniser maintenant',
  'docsync.unlink': 'Déconnecter',
  'docsync.confirmUnlink':
    'Les documents restent dans TREK et chez le fournisseur. Seule l’association entre les deux disparaît.',
  'docsync.syncEnabled': 'Synchroniser automatiquement',
  'docsync.deletePolicy': 'À la suppression d’un document',
  'docsync.deleteUnlink': 'Garder les deux copies',
  'docsync.deleteTrash': 'Mettre à la corbeille',
  'docsync.conflictPolicy': 'Quand les deux côtés ont changé',
  'docsync.onConflict.manual': 'Me demander',
  'docsync.onConflict.trek_wins': 'Garder la copie TREK',
  'docsync.onConflict.provider_wins': 'Garder la copie du stockage',
  'docsync.webhookHint':
    'Collez cette URL chez votre fournisseur pour que les changements arrivent immédiatement. Sans cela, TREK vérifie à intervalles réguliers.',

  // Champs du formulaire de connexion. Les clés reprennent la colonne `label` de
  // document_provider_fields, qui stocke un suffixe de clé plutôt qu’un texte.
  'docsync.providerUrl': 'Adresse',
  'docsync.providerApiToken': 'Jeton API',
  'docsync.providerApiKey': 'Clé API',
  'docsync.providerAppPassword': 'Mot de passe d’application',
  'docsync.providerAppToken': 'Jeton d’application',
  'docsync.providerUsername': 'Nom d’utilisateur',
  'docsync.providerPassword': 'Mot de passe',
  'docsync.providerOrganization': 'ID d’organisation',
  'docsync.providerBasePath': 'Dossier de base',
  'docsync.providerOTP': 'Code à deux facteurs',
  'docsync.allowInsecureTls': 'Accepter un certificat auto-signé',

  'docsync.hintPaperlessToken': 'À créer dans Paperless sous Mon profil. Il donne tous les droits de ce compte.',
  'docsync.hintPapraKey':
    'À créer dans Papra sous Clés API. Une clé Papra atteint toujours toutes les organisations dont vous faites partie.',
  'docsync.hintPapraOrg': 'L’identifiant org_… affiché dans la barre d’adresse de Papra.',
  'docsync.hintNextcloudLogin': 'Votre identifiant de connexion Nextcloud, pas votre adresse e-mail.',
  'docsync.hintNextcloudAppPassword':
    'Paramètres, Sécurité, Créer un nouveau mot de passe d’application. Jamais le mot de passe de votre compte.',
  'docsync.hintOpenCloudToken': 'À créer dans OpenCloud sous les jetons d’application.',
  'docsync.hintBasePath': 'Là où TREK cherche les dossiers de voyage. Par défaut /TREK.',
  'docsync.hintSynologyUrl': 'Indiquez le port, par exemple https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'De préférence un compte DSM dédié, avec accès à ce seul dossier partagé.',
  'docsync.hintSynologyOtp': 'Nécessaire une seule fois, si le compte utilise l’authentification à deux facteurs.',

  'docsync.linkState.never': 'Pas encore synchronisé',
  'docsync.linkState.ok': 'À jour',
  'docsync.linkState.partial': 'Partiellement synchronisé',
  'docsync.linkState.failed': 'Échec',
  'docsync.linkState.needs_reauth': 'Reconnectez-vous',
  'docsync.linkState.scope_lost': 'Dossier introuvable',
  'docsync.linkState.orphaned': 'Le propriétaire a quitté le voyage',

  'docsync.state.pending': 'En attente',
  'docsync.state.synced': 'Synchronisé',
  'docsync.state.conflict': 'Conflit',
  'docsync.state.rejected_type': 'Type non autorisé',
  'docsync.state.too_large': 'Trop volumineux',
  'docsync.state.error': 'Erreur',
  'docsync.state.remote_missing': 'Absent chez le fournisseur',
  'docsync.state.local_deleted': 'Supprimé dans TREK',
  'docsync.state.scope_drift': 'Sorti du dossier',

  'docsync.conflict.resolve': "Régler {count}",

  'docsync.conflict.title': 'Les deux copies ont changé',
  'docsync.conflict.keepTrek': 'Garder la version TREK',
  'docsync.conflict.keepProvider': 'Garder la version du fournisseur',
  'docsync.conflict.keepBoth': 'Garder les deux',

  // Les causes d’échec circulent sous forme de codes, jamais de texte venu du fournisseur :
  // celui-ci répond en anglais, ou renvoie la page de connexion HTML d’un proxy, et ni l’un
  // ni l’autre n’a sa place ici.
  'docsync.error.unreachable': 'Le fournisseur n’a pas pu être joint.',
  'docsync.error.tls_untrusted':
    'Le certificat a été rejeté. Autorisez les certificats auto-signés si vous faites confiance à cette instance.',
  'docsync.error.unauthorized': 'Les identifiants ont été refusés.',
  'docsync.error.forbidden': 'Ce compte n’a pas le droit de faire cela.',
  'docsync.error.not_found': 'Introuvable chez le fournisseur.',
  'docsync.error.scope_missing': 'Le dossier connecté n’existe plus.',
  'docsync.error.rate_limited': 'Le fournisseur limite nos requêtes. TREK réessaiera plus tard.',
  'docsync.error.too_large': 'Le fichier dépasse la taille acceptée par le fournisseur.',
  'docsync.error.unsupported_type': 'Le fournisseur n’accepte pas ce type de fichier.',
  'docsync.error.quota_exceeded': 'Le fournisseur n’a plus d’espace libre.',
  'docsync.error.conflict': 'Le document a changé des deux côtés.',
  'docsync.error.checksum_mismatch': 'Le transfert n’est pas arrivé intact.',
  'docsync.error.provider_error': 'Le fournisseur a signalé une erreur.',
  'docsync.error.timeout': 'Le fournisseur a mis trop de temps à répondre.',
  'docsync.error.ssrf_blocked': 'Cette adresse n’est pas autorisée.',
  'docsync.error.mass_delete_guard':
    'La plupart des documents ont disparu d’un coup, rien n’a donc été modifié. Vérifiez que le dossier est toujours monté.',
  'docsync.error.unknown': 'Une erreur est survenue.',

  // ── La fenêtre ─────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Ce voyage',
  'docsync.addAnother': 'Ajouter un autre',
  'docsync.syncing': 'Synchronisation',
  'docsync.card.pickFolder': 'Connecté, choisissez un dossier',

  'docsync.empty.title': 'Rien de connecté pour le moment',
  'docsync.empty.hintOwner':
    'Choisissez un fournisseur à gauche. TREK garde sa propre copie de tout, rien n’est donc perdu s’il disparaît.',
  'docsync.empty.hintMember':
    'C’est le propriétaire du voyage qui met cela en place. Dans tous les cas, les documents restent dans TREK.',

  // Comment chaque produit classe les documents. Affiché avant toute connexion,
  // car c’est ce que l’écran suivant va demander.
  'docsync.model.paperless': 'Classe par étiquette',
  'docsync.model.papra': 'Classe par étiquette, dans une organisation',
  'docsync.model.nextcloud': 'Classe dans un dossier',
  'docsync.model.opencloud': 'Classe dans un espace',
  'docsync.model.synologydrive': 'Classe dans un dossier sur le NAS',

  // ── La barre de flux ───────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'Vers le fournisseur',
  'docsync.flow.toTrek': 'Depuis le fournisseur',
  'docsync.flow.documents': 'documents',
  'docsync.flow.summary.both': 'Les documents circulent dans les deux sens.',
  'docsync.flow.summary.pull': 'Les documents ne font qu’entrer.',
  'docsync.flow.summary.push': 'Les documents ne font que sortir.',
  'docsync.flow.summaryEditable.both': 'Dans les deux sens. Touchez une voie pour l’arrêter.',
  'docsync.flow.summaryEditable.pull': 'Entrée seule. Touchez l’autre voie pour envoyer aussi.',
  'docsync.flow.summaryEditable.push': 'Sortie seule. Touchez l’autre voie pour recevoir aussi.',

  // ── Une association ────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Réglages',
  'docsync.binding.folder': 'Dossier',
  'docsync.binding.lastRun': 'Dernière exécution',
  'docsync.binding.autoOff': 'En pause',
  'docsync.binding.neverRun': 'jamais exécutée',
  'docsync.binding.deleteHint': 'Ce qu’il advient de la copie de l’autre côté.',
  'docsync.binding.conflictHint': 'Quelle copie reste quand un document a été modifié des deux côtés.',
  'docsync.binding.autoHint': 'Chercher les changements en arrière-plan.',
  'docsync.binding.webhookTitle': 'Mises à jour instantanées',
  'docsync.binding.copy': 'Copier',
  'docsync.binding.copied': 'Copié',

  // ── La connexion ───────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Connecter',
  'docsync.connect.testing': 'Tentative de connexion',
  'docsync.connect.okAs': 'Contact établi, connecté en tant que {account}',
  'docsync.connect.insecureHint': 'Pour une instance sur votre propre réseau, avec un certificat auto-signé.',
  'docsync.connect.about.paperless':
    'TREK classe ce voyage sous sa propre étiquette et ne touche jamais au reste de vos archives.',
  'docsync.connect.about.papra':
    'Choisissez l’organisation à laquelle ce voyage appartient. TREK l’y classe sous sa propre étiquette.',
  'docsync.connect.about.nextcloud':
    'Utilisez un mot de passe d’application, pas celui de votre compte : il résiste à la double authentification et se révoque séparément.',
  'docsync.connect.about.opencloud': 'TREK reçoit son propre espace pour ce voyage, séparé de tout le reste.',
  'docsync.connect.about.synologydrive':
    'De préférence un compte DSM qui n’atteint que le dossier partagé prévu pour ce voyage.',

  // ── Choix du conteneur ─────────────────────────────────────────────────────
  'docsync.scope.title': 'Où ce voyage doit-il se trouver dans {provider} ?',
  'docsync.scope.intro':
    'Seul ce qui se trouve ici est synchronisé. Tout le reste de votre fournisseur reste hors de TREK.',
  'docsync.scope.createTitle': 'En créer un nouveau',
  'docsync.scope.createAction': 'Créer',
  'docsync.scope.pickTitle': 'Ou en utiliser un existant',
  'docsync.scope.search': 'Rechercher',
  'docsync.scope.noMatch': 'Aucun résultat.',

  // ── Ce qui demande une décision ────────────────────────────────────────────
  'docsync.issues.title': 'À vérifier',
  'docsync.issues.conflict': 'Modifié des deux côtés. Choisissez la version à garder.',
  'docsync.issues.remote_missing': 'Disparu chez le fournisseur. La copie TREK est toujours là.',
  'docsync.issues.rejected_type': 'Ce type de fichier n’est pas autorisé ici.',
  'docsync.issues.too_large': 'Dépasse la limite.',
  'docsync.issues.error': 'Le transfert n’a pas abouti.',

  'docsync.error.unknown_provider': 'Ce fournisseur n’est pas disponible sur cette instance.',
  'docsync.error.provider_disabled': 'En pause : un administrateur a désactivé ce fournisseur. La synchronisation reprendra dès qu’il sera réactivé.',
};

export default docsync;
