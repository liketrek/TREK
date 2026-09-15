import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    'Connectez votre propre instance Dawarich pour voir où vous êtes réellement allé. TREK la consulte et vous propose des entrées de journal, des lieux et des pays — rien n’est ajouté sans votre confirmation, et rien n’est réécrit dans Dawarich.',
  'dawarich.url': 'Adresse de l’instance',
  'dawarich.apiKey': 'Clé API',
  'dawarich.apiKeyPlaceholder': 'Collez votre clé API Dawarich',
  'dawarich.apiKeyHint':
    'Disponible dans Dawarich sous Compte → Clé API. Stockée chiffrée et jamais affichée à nouveau.',
  'dawarich.allowInsecureTls': 'Autoriser un certificat auto-signé',
  'dawarich.allowInsecureTlsHint':
    'Nécessaire uniquement si votre instance utilise un certificat auquel votre serveur ne fait pas confiance.',
  'dawarich.syncEnabled': 'Rechercher automatiquement les nouveaux séjours',
  'dawarich.syncEnabledHint': 'Désactivé, TREK ne consulte Dawarich que lorsque vous le lui demandez.',
  'dawarich.test.button': 'Tester la connexion',
  'dawarich.test.success': 'Connecté. {count} séjours trouvés sur les 30 derniers jours.',
  'dawarich.test.failed': 'Impossible de joindre Dawarich.',
  'dawarich.syncNow': 'Vérifier maintenant',
  'dawarich.connected': 'Connecté',
  'dawarich.notConnected': 'Non connecté',
  'dawarich.disconnect': 'Déconnecter',
  'dawarich.lastSync': 'Dernière vérification {when}',
  'dawarich.neverSynced': 'Jamais vérifié',
  'dawarich.syncPartial': 'certains voyages n’ont pas pu être lus',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Connexion Dawarich enregistrée',
  'dawarich.toast.saveError': 'Impossible d’enregistrer la connexion',
  'dawarich.toast.disconnected': 'Dawarich déconnecté',
  'dawarich.toast.synced': '{count} nouveaux séjours trouvés',
  'dawarich.toast.syncError': 'Impossible de lire Dawarich',
  'dawarich.toast.syncRunning': 'Une vérification est déjà en cours',
  'dawarich.toast.acceptError': 'Impossible d’ajouter cet élément',
  'dawarich.toast.updateError': 'Impossible de mettre à jour cette suggestion',
  'dawarich.toast.accepted.place': 'Ajouté au voyage',
  'dawarich.toast.accepted.journal': 'Ajouté au journal',
  'dawarich.toast.accepted.bucket_list': 'Coché dans votre liste de souhaits',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': 'séjours',
  'dawarich.capability.track': 'trajet enregistré',
  'dawarich.capability.locations': 'correspondance avec la liste de souhaits',
  'dawarich.capability.visitedCities': 'pays et villes',
  'dawarich.capability.missing': 'Cette version de Dawarich ne propose pas : {features}.',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'TREK n’a pas pu joindre cette adresse.',
  'dawarich.error.unauthorized': 'Dawarich a refusé la clé API.',
  'dawarich.error.forbidden': 'Cette clé API n’a pas le droit de lire ces données.',
  'dawarich.error.not_found': 'Cette version de Dawarich ne dispose pas de ce point d’accès.',
  'dawarich.error.rate_limited': 'Dawarich a demandé à TREK de ralentir. Réessayez dans un instant.',
  'dawarich.error.server_error': 'Dawarich a répondu par une erreur.',
  'dawarich.error.invalid_response': 'Cette adresse a répondu quelque chose qui n’est pas Dawarich.',
  'dawarich.error.too_large': 'Dawarich a envoyé plus de données que TREK n’en lit en une fois.',
  'dawarich.error.not_connected': 'Aucune instance Dawarich n’est encore connectée.',
  'dawarich.error.addon_disabled': 'Le module Dawarich est désactivé sur cette instance.',
  'dawarich.error.offline': 'Cela demande une connexion — TREK est hors ligne pour le moment.',
  'dawarich.error.invalid_url': 'TREK ne peut pas utiliser cette adresse.',
  'dawarich.warning.private_ip': 'Cette adresse pointe vers une IP privée ({ip}). Vérifiez que c’est voulu — le serveur peut avoir besoin de ALLOW_INTERNAL_NETWORK=true pour l’atteindre.',
  'dawarich.error.unknown': 'Un problème est survenu lors de l’échange avec Dawarich.',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': 'Afficher le trajet enregistré',
  'dawarich.trail.hide': 'Masquer le trajet enregistré',
  'dawarich.trail.loading': 'Chargement du trajet enregistré…',
  'dawarich.trail.empty': 'Rien n’a été enregistré à ces dates',
  'dawarich.trail.offline': 'Le trajet enregistré nécessite une connexion',
  'dawarich.trail.unavailable': 'Le trajet enregistré n’a pas pu être chargé',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes} min',
  'dawarich.duration.hours': '{hours} h',
  'dawarich.duration.hoursMinutes': '{hours} h {minutes} min',
  'dawarich.checkedAgo': 'vérifié {ago}',

  'dawarich.badge.lowConfidence': 'Incertain',
  'dawarich.badge.sourceChanged': 'Modifié dans Dawarich',
  'dawarich.badge.sourceMissing': 'Disparu de Dawarich',

  'dawarich.suggestions.title': 'Depuis Dawarich',
  'dawarich.suggestions.pending': '{count} en attente',
  'dawarich.suggestions.loading': 'Lecture de Dawarich…',
  'dawarich.suggestions.notConnected':
    'Connectez Dawarich dans les Paramètres pour voir vos séjours ici.',
  'dawarich.suggestions.unavailable': 'Dawarich n’a pas pu être lu.',
  'dawarich.suggestions.allHandled': 'Tout ce qui a été enregistré ici a été traité.',
  'dawarich.suggestions.asJournal': 'Écrire une entrée de journal',
  'dawarich.suggestions.asPlace': 'Ajouter comme lieu',
  'dawarich.suggestions.dismiss': 'Je n’ai pas visité ce lieu',
  'dawarich.suggestions.dismissed': 'Ignoré',
  'dawarich.suggestions.restore': 'Rétablir',
  'dawarich.suggestions.showHandled': 'Afficher les {count} déjà traités',
  'dawarich.suggestions.hideHandled': 'Masquer ceux déjà traités',
  'dawarich.suggestions.matchesWish': 'Dans votre liste de souhaits : {name}',
  'dawarich.suggestions.acceptedAs.place': 'Ajouté comme lieu',
  'dawarich.suggestions.acceptedAs.journal': 'Dans le journal',
  'dawarich.suggestions.acceptedAs.bucket_list': 'Souhait coché',
  'dawarich.suggestions.sourceChanged':
    'Ce séjour a changé dans Dawarich depuis que vous l’avez utilisé. Ce que vous avez écrit dans TREK reste intact.',
  'dawarich.suggestions.sourceMissing':
    'Ce séjour n’existe plus dans Dawarich. Ce que vous avez écrit dans TREK reste intact.',
  'dawarich.sourceStatus.suggested': 'Détecté, non confirmé',
  'dawarich.confidence.high': 'Détection sûre',
  'dawarich.confidence.medium': 'Détection plutôt sûre',
  'dawarich.confidence.low': 'Détection incertaine',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'Ajouter ce séjour comme lieu',
  'dawarich.accept.title.journal': 'Écrire une entrée de journal',
  'dawarich.accept.title.bucket_list': 'Cocher un souhait',
  'dawarich.accept.confirm.place': 'Ajouter le lieu',
  'dawarich.accept.confirm.journal': 'Ajouter l’entrée',
  'dawarich.accept.confirm.bucket_list': 'Le cocher',
  'dawarich.accept.recorded': 'Enregistré du {from} au {to}',
  'dawarich.accept.duration': '{minutes} min',
  'dawarich.accept.name': 'Nom',
  'dawarich.accept.date': 'Date',
  'dawarich.accept.from': 'Arrivée',
  'dawarich.accept.to': 'Départ',
  'dawarich.accept.trip': 'Voyage',
  'dawarich.accept.thisTrip': 'Ce voyage',
  'dawarich.accept.pickTrip': 'Choisir un voyage',
  'dawarich.accept.day': 'Jour',
  'dawarich.accept.noDay': 'Pas encore rattaché à un jour',
  'dawarich.accept.journal': 'Journal',
  'dawarich.accept.pickJournal': 'Choisir un journal',
  'dawarich.accept.notes': 'Notes',
  'dawarich.accept.story': 'Votre histoire',
  'dawarich.accept.storyPlaceholder': 'Que s’est-il passé ici ?',
  'dawarich.accept.photosHint': 'Ajoutez des photos à l’entrée une fois qu’elle est créée.',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'Ajouté depuis vos enregistrements Dawarich',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'Confronter votre liste de souhaits à Dawarich',
  'dawarich.bucket.description':
    'Parcourt vos enregistrements à la recherche des lieux que vous vouliez atteindre. Une visite exige à la fois la proximité et du temps passé sur place — passer devant en voiture ne compte pas.',
  'dawarich.bucket.scan': 'Vérifier la liste de souhaits',
  'dawarich.bucket.scanning': 'Vérification…',
  'dawarich.bucket.noMatches': 'Rien de votre liste de souhaits n’apparaît dans vos enregistrements.',
  'dawarich.bucket.alreadyVisited': 'Déjà coché',
  'dawarich.bucket.confirm': 'Cocher {count}',
  'dawarich.bucket.confirmed': '{count} souhaits cochés',
  'dawarich.bucket.skipped': '{count} entrées n’ont pas de coordonnées et n’ont pas pu être vérifiées.',
  'dawarich.bucket.truncated':
    'Seules les premières entrées ont été vérifiées. Relancez pour traiter le reste.',
  'dawarich.bucket.visitedFrom': 'Coché à partir de vos enregistrements Dawarich',
  'dawarich.bucket.clearVisit': 'Annuler',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Pays issus de Dawarich',
  'dawarich.atlas.description':
    'Les pays où vos enregistrements indiquent que vous êtes allé. Confirmez ceux que vous voulez dans votre Atlas — rien n’est ajouté tout seul, et ce que vous avez marqué à la main vous appartient.',
  'dawarich.atlas.load': 'Rechercher des pays',
  'dawarich.atlas.loading': 'Lecture de vos enregistrements…',
  'dawarich.atlas.empty': 'Vos enregistrements ne révèlent aucun pays que TREK ne connaisse déjà.',
  'dawarich.atlas.cities': '{count} villes',
  'dawarich.atlas.citiesOne': '1 ville',
  'dawarich.atlas.accept': 'Ajouter {count} pays',
  'dawarich.atlas.accepted': '{count} pays ajoutés',
  'dawarich.atlas.unresolved': 'TREK n’a pas pu rattacher ceci à un pays : {names}.',
  'dawarich.atlas.source': 'Depuis Dawarich',
  'dawarich.atlas.range': 'Période examinée : du {from} au {to}',

  'dawarich.atlas.trigger': 'Envies et pays issus de vos enregistrements',
  'dawarich.atlas.dialogSubtitle': 'Ce que vos enregistrements disent de votre Atlas',
  'dawarich.atlas.tab.wishes': 'Liste d’envies',
  'dawarich.atlas.tab.countries': 'Pays',
  'dawarich.atlas.window': 'Les 12 derniers mois ont été examinés.',
  'dawarich.selected': '{count} sélectionnés',
  'dawarich.again': 'Vérifier à nouveau',
  'dawarich.bucket.metersAway': 'à {meters} m',
  'dawarich.bucket.kilometersAway': 'à {km} km',
  'dawarich.bucket.rule': 'Une envie est atteinte à moins de {meters} m et après {minutes} minutes sur place.',

};

export default dawarich;
