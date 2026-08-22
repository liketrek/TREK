import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Répertoire racine',
  'storage.help.root': 'Chemin absolu sur le serveur où ce backend stocke ses objets.',
  'storage.field.endpoint': 'URL du point de terminaison',
  'storage.help.endpoint':
    'URL de base du service compatible S3, par ex. https://s3.example.com ou http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': "ID de clé d'accès",
  'storage.field.secretAccessKey': "Clé d'accès secrète",
  'storage.field.region': 'Région',
  'storage.help.region': 'Conserve la valeur par défaut, sauf si ton fournisseur exige une région spécifique.',
  'storage.field.keyPrefix': 'Préfixe de clé',
  'storage.help.keyPrefix': "Préfixe optionnel ajouté à chaque clé d'objet, par ex. trek/prod.",
  'storage.field.retries': 'Tentatives',
  'storage.field.timeoutMs': "Délai d'expiration (ms)",
  'storage.field.primary': 'Backend principal',
  'storage.field.replicas': 'Répliques',
  'storage.title': 'Stockage',
  'storage.description':
    "Où TREK conserve les fichiers, photos et sauvegardes envoyés. Rien ne change tant que tu n'enregistres pas.",
  'storage.loading': 'Chargement…',
  'storage.saved': 'Configuration de stockage enregistrée',
  'storage.save': 'Enregistrer les modifications',
  'storage.unsaved': 'Modifications non enregistrées',
  'storage.saveConflict':
    "La configuration de stockage a changé depuis son chargement, vos modifications n'ont donc pas été enregistrées. Abandonnez-les et rechargez la configuration enregistrée pour recommencer.",
  'storage.discardAndReload': 'Abandonner mes modifications et recharger',
  'storage.configError.banner':
    "Échec du chargement des paramètres de stockage enregistrés — l'enregistrement les remplacera : {error}",
  'storage.backends.title': 'Backends',
  'storage.backends.add': 'Ajouter un backend',
  'storage.backends.usedBy': 'Utilisé par : {categories}',
  'storage.backends.unused': 'Non assigné à aucune catégorie',
  'storage.backends.envReadOnly': "Défini par une variable d'environnement — lecture seule",
  'storage.source.built-in': 'Intégré',
  'storage.source.env': 'Environnement',
  'storage.source.settings': 'Paramètres',
  'storage.type.local': 'Local',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Miroir',
  'storage.actions.test': 'Tester',
  'storage.actions.edit': 'Modifier',
  'storage.actions.remove': 'Supprimer',
  'storage.test.running': 'Test en cours…',
  'storage.test.ok': 'Connexion OK',
  'storage.test.failed': 'Échec du test',
  'storage.remove.title': 'Supprimer le backend',
  'storage.remove.body':
    "Supprimer {name} de la configuration ? Le serveur refuse l'enregistrement si quelque chose en dépend encore.",
  'storage.remove.stillAssigned': 'Encore assigné à : {categories}',
  'storage.form.addTitle': 'Ajouter un backend',
  'storage.form.editTitle': 'Modifier le backend',
  'storage.form.name': 'Nom',
  'storage.form.type': 'Type',
  'storage.form.apply': 'Appliquer',
  'storage.form.cancel': 'Annuler',
  'storage.form.duplicateName': 'Un backend nommé {name} existe déjà',
  'storage.categories.title': 'Catégories',
  'storage.categories.default': 'par défaut',
  'storage.categories.reassignWarning':
    'Les objets existants ne sont pas déplacés : les nouveaux objets vont vers le backend nouvellement assigné, les anciens restent où ils sont.',
  'storage.category.files': 'Documents de voyage',
  'storage.category.journey': 'Photos du journal de voyage',
  'storage.category.covers': 'Images de couverture',
  'storage.category.avatars': 'Photos de profil',
  'storage.category.places': 'Images de lieux',
  'storage.category.photos-google': 'Cache photos Google',
  'storage.category.photos-trek': 'Cache photos TREK',
  'storage.category.backups': 'Sauvegardes',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Fichiers joints envoyés dans les voyages — billets, PDF, confirmations de réservation et fichiers partagés dans le chat du voyage.',
  'storage.categoryDesc.journey': 'Photos et vignettes associées aux entrées du journal de voyage.',
  'storage.categoryDesc.covers':
    'Images de couverture des voyages et des collections, y compris celles récupérées depuis Unsplash.',
  'storage.categoryDesc.avatars': 'Photos de profil des comptes utilisateurs.',
  'storage.categoryDesc.places': 'Images associées aux lieux et aux lieux de collections — importées ou téléversées.',
  'storage.categoryDesc.photos-google':
    'Copies en cache des photos de Google Places — récupérables à nouveau, leur perte est sans risque.',
  'storage.categoryDesc.photos-trek':
    'Photos en cache du service photo de TREK utilisé par Photos (Memories) — récupérables à nouveau, leur perte est sans risque.',
  'storage.categoryDesc.backups':
    'Archives de sauvegarde du serveur créées par le panneau Sauvegarde ou par la planification.',
  'storage.health.title': 'État',
  'storage.health.allClear': 'Aucune défaillance de réplique enregistrée.',
  'storage.health.seedFile':
    'Un fichier de départ storage-config.json est présent mais ignoré — des lignes de configuration existent déjà. Gère le stockage ici.',
  'storage.health.failureLine': '{op} de {key} sur {backend} a échoué : {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Cibles du miroir',
  'storage.mirror.targetsHelp': 'Chaque écriture sur ce backend est également copiée vers chaque cible sélectionnée.',
  'storage.mirror.latencyNote':
    "Les répliques sont écrites l'une après l'autre à chaque envoi — une cible lente ou inaccessible ralentit chaque envoi de chaque catégorie sur ce backend.",
  'storage.mirror.mirroredTo': 'Reflété vers : {targets}',
  'storage.mirror.replicaOf': 'Réplique de : {primaries}',
  'storage.mirror.cacheWarning':
    'Non recommandé : cette catégorie contient du contenu récupérable à nouveau — le répliquer est généralement inutile.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Un second miroir enveloppe {primary} — le panneau ne gère que le premier ; supprime celui-ci pour gérer le miroir depuis {primary}.',
  'storage.mirror.degenerate.env-primary':
    "Enveloppe un backend défini par une variable d'environnement — non modifiable ici.",
  'storage.mirror.degenerate.missing-primary': "Référence un backend qui n'existe plus.",
  'storage.remove.usedAsReplicaBy': 'Utilisé comme réplique par : {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Synchroniser maintenant',
  'storage.sync.running': 'Synchronisation… {done}/{total}',
  'storage.sync.counts': '{copied} copiés · {skipped} ignorés · {failed} échoués',
  'storage.sync.cancel': 'Annuler la synchronisation',
  'storage.sync.done': 'Synchronisation terminée : {copied} copiés, {deleted} supprimés, {failed} échoués',
  'storage.sync.cancelled': 'Synchronisation annulée',
  'storage.sync.error': 'Échec de la synchronisation : {error}',
  'storage.sync.prompt': 'Les objets existants ne sont pas encore répliqués — synchroniser maintenant ?',
  'storage.sync.dismiss': 'Ignorer',
  'storage.usage.line': '{objects} objets · {size}',
  'storage.usage.computed': 'Utilisation calculée {age}',
  'storage.usage.never': 'Utilisation pas encore calculée',
  'storage.usage.refresh': 'Actualiser',
  'storage.usage.compute': 'Calculer maintenant',
  'storage.usage.legacyNote': "inclut l'ancienne bibliothèque de photos",

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': 'Déplacer les objets existants vers le nouveau backend ?',
  'storage.migrate.promptLine': '{category} : {objects} objets ({size}) de {from} vers {to}',
  'storage.migrate.promptLineUnknown':
    '{category} : taille inconnue (utilisation pas encore calculée) de {from} vers {to}',
  'storage.migrate.move': 'Déplacer les objets existants',
  'storage.migrate.routeOnly': 'Router uniquement les nouvelles écritures',
  'storage.migrate.running': 'Déplacement de {category}… {done}/{total}',
  'storage.migrate.done': 'Déplacement terminé : {copied} copiés, {skipped} ignorés',
  'storage.migrate.doneFailures': "{failed} en échec — ces objets n'ont pas été copiés vers le nouveau backend",
  'storage.migrate.failed': "Échec du déplacement : {error} — la catégorie n'a pas été changée",
  'storage.migrate.cancelled': "Déplacement annulé — rien n'a été changé",
  'storage.migrate.reclaimable': '{objects} objets ({size}) restent sur {from} — à récupérer manuellement',
  'storage.migrate.cancel': 'Annuler le déplacement',
  'storage.migrate.promptCancel': 'Annuler',
  'storage.migrate.queued': "En file d'attente : {categories}",
  'storage.migrate.queueDropped': "Impossible de démarrer le déplacement suivant — la file d'attente restante a été vidée : {categories}",
};
export default storage;
