import type { TranslationStrings } from '../types';

const journey: TranslationStrings = {
  'journey.search.placeholder': 'Rechercher des journaux…',
  'journey.search.noResults': 'Aucun journal ne correspond à « {query} »',
  'journey.title': 'Journal de voyage',
  'journey.subtitle': 'Suivez vos voyages en temps réel',
  'journey.new': 'Nouveau journal',
  'journey.create': 'Créer',
  'journey.titlePlaceholder': 'Où allez-vous ?',
  'journey.empty': 'Aucun journal pour le moment',
  'journey.emptyHint': 'Commencez à documenter votre prochain voyage',
  'journey.deleted': 'Journal supprimé',
  'journey.createError': 'Impossible de créer le journal',
  'journey.deleteError': 'Impossible de supprimer le journal',
  'journey.deleteConfirmTitle': 'Supprimer',
  'journey.deleteConfirmMessage': 'Supprimer « {title} » ? Cette action est irréversible.',
  'journey.deleteConfirmGeneric': 'Êtes-vous sûr de vouloir supprimer ceci ?',
  'journey.notFound': 'Journal introuvable',
  'journey.photos': 'Photos',
  'journey.timelineEmpty': 'Aucune étape pour le moment',
  'journey.timelineEmptyHint': 'Ajoutez un check-in ou écrivez une entrée de journal pour commencer',
  'journey.status.draft': 'Brouillon',
  'journey.status.active': 'Actif',
  'journey.status.completed': 'Terminé',
  'journey.status.upcoming': 'À venir',
  'journey.status.archived': 'Archivé',
  'journey.checkin.add': 'Check-in',
  'journey.checkin.namePlaceholder': 'Nom du lieu',
  'journey.checkin.notesPlaceholder': 'Notes (facultatif)',
  'journey.checkin.save': 'Enregistrer',
  'journey.checkin.error': "Impossible d'enregistrer le check-in",
  'journey.entry.add': 'Journal',
  'journey.entry.edit': "Modifier l'entrée",
  'journey.entry.titlePlaceholder': 'Titre (facultatif)',
  'journey.entry.bodyPlaceholder': "Que s'est-il passé aujourd'hui ?",
  'journey.entry.save': 'Enregistrer',
  'journey.entry.error': "Impossible d'enregistrer l'entrée",
  'journey.photo.add': 'Photo',
  'journey.photo.uploadError': 'Échec du téléversement',
  'journey.share.share': 'Partager',
  'journey.share.public': 'Public',
  'journey.share.linkCopied': 'Lien public copié',
  'journey.share.disabled': 'Partage public désactivé',
  'journey.editor.titlePlaceholder': 'Donnez un nom à ce moment...',
  'journey.editor.bodyPlaceholder': "Racontez l'histoire de cette journée...",
  'journey.editor.placePlaceholder': 'Lieu (facultatif)',
  'journey.editor.tagsPlaceholder': 'Tags : pépite cachée, meilleur repas, à revisiter...',
  'journey.visibility.private': 'Privé',
  'journey.visibility.shared': 'Partagé',
  'journey.visibility.public': 'Public',
  'journey.emptyState.title': 'Votre histoire commence ici',
  'journey.emptyState.subtitle': 'Faites un check-in ou écrivez votre première entrée de journal',
  'journey.frontpage.subtitle': 'Transformez vos voyages en histoires inoubliables',
  'journey.frontpage.createJourney': 'Créer un journal',
  'journey.frontpage.activeJourney': 'Journal actif',
  'journey.frontpage.latestJourney': 'Dernier journal',
  'journey.frontpage.allJourneys': 'Tous les journaux',
  'journey.frontpage.journeys': 'journaux',
  'journey.frontpage.createNew': 'Créer un nouveau journal',
  'journey.frontpage.createNewSub': 'Choisissez des voyages, écrivez des récits, partagez vos aventures',
  'journey.frontpage.live': 'En direct',
  'journey.frontpage.synced': 'Synchronisé',
  'journey.frontpage.continueWriting': 'Continuer à écrire',
  'journey.frontpage.updated': 'Mis à jour {time}',
  'journey.frontpage.suggestionLabel': 'Voyage terminé récemment',
  'journey.frontpage.suggestionText': 'Transformez <strong>{title}</strong> en journal de voyage',
  'journey.frontpage.dismiss': 'Ignorer',
  'journey.frontpage.journeyName': 'Nom du journal',
  'journey.frontpage.namePlaceholder': 'ex. Asie du Sud-Est 2026',
  'journey.frontpage.selectTrips': 'Sélectionner des voyages',
  'journey.frontpage.tripsSelected': 'voyages sélectionnés',
  'journey.frontpage.trips': 'voyages',
  'journey.frontpage.placesImported': 'lieux seront importés',
  'journey.frontpage.places': 'lieux',
  'journey.detail.backToJourney': 'Retour au journal',
  'journey.detail.syncedWithTrips': 'Synchronisé avec les voyages',
  'journey.detail.addEntry': 'Ajouter une entrée',
  'journey.detail.jumpToTop': 'Revenir en haut',
  'journey.detail.jumpToLast': 'Aller à la dernière entrée',
  'journey.detail.newEntry': 'Nouvelle entrée',
  'journey.detail.editEntry': "Modifier l'entrée",
  'journey.detail.noEntries': 'Aucune entrée pour le moment',
  'journey.detail.noEntriesHint': 'Ajoutez un voyage pour commencer avec des entrées préremplies',
  'journey.detail.noPhotos': 'Aucune photo pour le moment',
  'journey.detail.noPhotosHint':
    'Téléversez des photos dans les entrées ou parcourez votre bibliothèque Immich/Synology',
  'journey.detail.journeyStats': 'Statistiques du journal',
  'journey.detail.syncedTrips': 'Voyages synchronisés',
  'journey.detail.noTripsLinked': 'Aucun voyage lié pour le moment',
  'journey.detail.contributors': 'Contributeurs',
  'journey.detail.readMore': 'Lire la suite',
  'journey.detail.prosCons': 'Pour et contre',
  'journey.detail.photos': 'photos',
  'journey.detail.day': 'Jour {number}',
  'journey.detail.places': 'lieux',
  'journey.stats.days': 'Jours',
  'journey.stats.cities': 'Villes',
  'journey.stats.entries': 'Entrées',
  'journey.stats.photos': 'Photos',
  'journey.stats.places': 'Lieux',
  'journey.skeletons.show': 'Afficher les suggestions',
  'journey.skeletons.hide': 'Masquer les suggestions',
  'journey.verdict.lovedIt': 'Adoré',
  'journey.verdict.couldBeBetter': 'Pourrait être mieux',
  'journey.synced.places': 'lieux',
  'journey.synced.synced': 'synchronisé',
  'journey.editor.discardChangesConfirm': 'Vous avez des modifications non enregistrées. Les ignorer ?',
  'journey.editor.uploadFailed': 'Échec du téléversement des photos',
  'journey.editor.uploadPhotos': 'Téléverser des photos',
  'journey.editor.uploading': 'Envoi...',
  'journey.editor.uploadingProgress': 'Téléversement {done}/{total}…',
  'journey.editor.uploadPartialFailed': '{failed} sur {total} photos ont échoué — sauvegardez à nouveau pour réessayer',
  'journey.editor.fromGallery': 'Depuis la galerie',
  'journey.editor.allPhotosAdded': 'Toutes les photos ont déjà été ajoutées',
  'journey.editor.writeStory': 'Écrivez votre histoire...',
  'journey.editor.prosCons': 'Pour et contre',
  'journey.editor.pros': 'Pour',
  'journey.editor.cons': 'Contre',
  'journey.editor.proPlaceholder': 'Quelque chose de génial...',
  'journey.editor.conPlaceholder': 'Pas si génial...',
  'journey.editor.addAnother': 'Ajouter un autre',
  'journey.editor.date': 'Date',
  'journey.editor.location': 'Lieu',
  'journey.editor.searchLocation': 'Rechercher un lieu...',
  'journey.editor.mood': 'Humeur',
  'journey.editor.weather': 'Météo',
  'journey.editor.photoFirst': '1er',
  'journey.editor.makeFirst': 'Mettre en 1er',
  'journey.editor.searching': 'Recherche...',
  'journey.editor.useCurrentLocation': 'Utiliser ma position actuelle',
  'journey.editor.locationPermissionDenied':
    "L'accès à la position a été refusé. Autorisez-le dans les paramètres de votre navigateur et réessayez.",
  'journey.editor.locationTimeout': 'Délai dépassé pour obtenir votre position. Réessayez.',
  'journey.editor.locationUnavailable': 'Impossible de déterminer votre position.',
  'journey.editor.locationInsecureContext': 'La géolocalisation nécessite une connexion sécurisée (HTTPS).',
  'journey.mood.amazing': 'Incroyable',
  'journey.mood.good': 'Bien',
  'journey.mood.neutral': 'Neutre',
  'journey.mood.rough': 'Difficile',
  'journey.weather.sunny': 'Ensoleillé',
  'journey.weather.partly': 'Partiellement nuageux',
  'journey.weather.cloudy': 'Nuageux',
  'journey.weather.rainy': 'Pluvieux',
  'journey.weather.stormy': 'Orageux',
  'journey.weather.cold': 'Neigeux',
  'journey.trips.linkTrip': 'Lier un voyage',
  'journey.trips.searchTrip': 'Rechercher un voyage',
  'journey.trips.searchPlaceholder': 'Nom du voyage ou destination...',
  'journey.trips.noTripsAvailable': 'Aucun voyage disponible',
  'journey.trips.link': 'Lier',
  'journey.trips.tripLinked': 'Voyage lié',
  'journey.trips.linkFailed': 'Échec de la liaison du voyage',
  'journey.trips.addTrip': 'Ajouter un voyage',
  'journey.trips.unlinkTrip': 'Délier le voyage',
  'journey.trips.unlinkMessage':
    'Délier « {title} » ? Toutes les entrées et photos synchronisées de ce voyage seront définitivement supprimées. Cette action est irréversible.',
  'journey.trips.unlink': 'Délier',
  'journey.trips.tripUnlinked': 'Voyage délié',
  'journey.trips.unlinkFailed': 'Échec de la suppression du lien',
  'journey.trips.noTripsLinkedSettings': 'Aucun voyage lié',
  'journey.contributors.invite': 'Inviter un contributeur',
  'journey.contributors.searchUser': 'Rechercher un utilisateur',
  'journey.contributors.searchPlaceholder': "Nom d'utilisateur ou e-mail...",
  'journey.contributors.noUsers': 'Aucun utilisateur trouvé',
  'journey.contributors.role': 'Rôle',
  'journey.contributors.added': 'Contributeur ajouté',
  'journey.contributors.addFailed': "Échec de l'ajout du contributeur",
  'journey.share.publicShare': 'Partage public',
  'journey.share.createLink': 'Créer un lien de partage',
  'journey.share.linkCreated': 'Lien de partage créé',
  'journey.share.createFailed': 'Échec de la création du lien',
  'journey.share.copy': 'Copier',
  'journey.share.copied': 'Copié !',
  'journey.share.timeline': 'Chronologie',
  'journey.share.gallery': 'Galerie',
  'journey.share.map': 'Carte',
  'journey.share.removeLink': 'Supprimer le lien de partage',
  'journey.share.linkDeleted': 'Lien de partage supprimé',
  'journey.share.deleteFailed': 'Échec de la suppression',
  'journey.share.updateFailed': 'Échec de la mise à jour',
  'journey.invite.role': 'Rôle',
  'journey.invite.viewer': 'Lecteur',
  'journey.invite.editor': 'Éditeur',
  'journey.invite.invite': 'Inviter',
  'journey.invite.inviting': 'Invitation...',
  'journey.settings.title': 'Paramètres du journal',
  'journey.settings.coverImage': 'Image de couverture',
  'journey.settings.changeCover': 'Changer la couverture',
  'journey.settings.addCover': 'Ajouter une image de couverture',
  'journey.settings.name': 'Nom',
  'journey.settings.subtitle': 'Sous-titre',
  'journey.settings.subtitlePlaceholder': 'ex. Thaïlande, Vietnam et Cambodge',
  'journey.settings.endJourney': 'Archiver le journal',
  'journey.settings.reopenJourney': 'Restaurer le journal',
  'journey.settings.archived': 'Journal archivé',
  'journey.settings.reopened': 'Journal rouvert',
  'journey.settings.endDescription': "Masque l'indicateur En direct. Vous pouvez rouvrir à tout moment.",
  'journey.settings.delete': 'Supprimer',
  'journey.settings.deleteJourney': 'Supprimer le journal',
  'journey.settings.deleteMessage': 'Supprimer « {title} » ? Toutes les entrées et photos seront perdues.',
  'journey.settings.saved': 'Paramètres enregistrés',
  'journey.settings.saveFailed': "Échec de l'enregistrement",
  'journey.settings.coverUpdated': 'Couverture mise à jour',
  'journey.settings.coverFailed': 'Échec du téléversement',
  'journey.settings.failedToDelete': 'Échec de la suppression',
  'journey.entries.deleteTitle': "Supprimer l'entrée",
  'journey.photosUploaded': '{count} photos téléversées',
  'journey.photosUploadFailed': "Certaines photos n'ont pas pu être téléversées",
  'journey.photosAdded': '{count} photos ajoutées',
  'journey.public.notFound': 'Introuvable',
  'journey.public.notFoundMessage': "Ce journal n'existe pas ou le lien a expiré.",
  'journey.public.readOnly': 'Lecture seule · Journal public',
  'journey.public.tagline': 'Travel Resource & Exploration Kit',
  'journey.public.sharedVia': 'Partagé via',
  'journey.public.madeWith': 'Créé avec',
  'journey.pdf.journeyBook': 'Carnet de voyage',
  'journey.pdf.madeWith': 'Créé avec TREK',
  'journey.pdf.day': 'Jour',
  'journey.pdf.theEnd': 'Fin',
  'journey.pdf.saveAsPdf': 'Enregistrer en PDF',
  'journey.pdf.pages': 'pages',
  'journey.picker.tripPeriod': 'Période du voyage',
  'journey.picker.dateRange': 'Plage de dates',
  'journey.picker.allPhotos': 'Toutes les photos',
  'journey.picker.albums': 'Albums',
  'journey.picker.selected': 'sélectionnés',
  'journey.picker.addTo': 'Ajouter à',
  'journey.picker.newGallery': 'Nouvelle galerie',
  'journey.picker.selectAll': 'Tout sélectionner',
  'journey.picker.deselectAll': 'Tout désélectionner',
  'journey.picker.noAlbums': 'Aucun album trouvé',
  'journey.picker.selectDate': 'Sélectionner une date',
  'journey.picker.search': 'Rechercher',
  'journey.detail.journeyTab': 'Journey', // en-fallback
  'journey.contributors.remove': 'Remove contributor', // en-fallback
  'journey.contributors.removeConfirm': 'Remove {username} from this journey?', // en-fallback
  'journey.contributors.removed': 'Contributor removed', // en-fallback
  'journey.contributors.removeFailed': 'Failed to remove contributor', // en-fallback
  'journey.editor.externalPhotos': 'External photos', // en-fallback
  'journey.editor.externalPhotosFor': 'Photos for {date}', // en-fallback
  'journey.editor.externalPhotosNearby': 'Nearby photos first', // en-fallback
  'journey.editor.externalPhotosNoLocation': 'All photos from this day', // en-fallback
  'journey.editor.externalPhotosQueued': 'queued', // en-fallback
  'journey.editor.externalPhotosUnavailable': 'No connected photo providers are available.', // en-fallback
  'journey.editor.externalPhotosPartialFailed': '{failed} photo groups failed — save again to retry', // en-fallback
  'journey.picker.day': 'This day', // en-fallback
  'journey.studio.title': 'TREK Studio', // en-fallback
  'journey.studio.open': 'Studio', // en-fallback
  'journey.studio.openAria': 'Open the photo book studio', // en-fallback
  'journey.studio.backToJourney': 'Back to the journey', // en-fallback
  'journey.studio.format': 'Page format', // en-fallback
  'journey.studio.formatA4Landscape': 'A4 landscape', // en-fallback
  'journey.studio.formatA4Portrait': 'A4 portrait', // en-fallback
  'journey.studio.formatSquare21': 'Square 21 × 21 cm', // en-fallback
  'journey.studio.formatSquare30': 'Square 30 × 30 cm', // en-fallback
  'journey.studio.pages': 'Pages', // en-fallback
  'journey.studio.cover': 'Cover', // en-fallback
  'journey.studio.inspector': 'Properties', // en-fallback
  'journey.studio.inspectorEmpty': 'Select something on the page to edit it.', // en-fallback
  'journey.studio.emptySpread': 'This spread is still empty', // en-fallback
  'journey.studio.autoLayout': 'Auto layout', // en-fallback
  'journey.studio.export': 'Export', // en-fallback
  'journey.studio.day': 'JOUR',
  'journey.studio.stations': 'Étapes',
  'journey.studio.peersHere': 'ici',
  'journey.studio.folioAuto': 'Automatique',
  'journey.studio.exportLayout': 'Mise en page',
  'journey.studio.exportPages': 'Pages simples',
  'journey.studio.exportPagesHint': 'Un feuillet par page, dans l’ordre de lecture. Ce qu’attend un imprimeur.',
  'journey.studio.exportSpreads': 'Doubles pages',
  'journey.studio.exportSpreadsHint': 'Deux pages à la fois, comme le livre s’ouvre. Pour la lecture.',
  'journey.studio.exportFinishing': 'Façonnage',
  'journey.studio.exportMarks': 'Traits de coupe',
  'journey.studio.exportMarksHint': 'Ajoute {bleed} mm de fond perdu sur chaque bord et indique où couper',
  'journey.studio.exportNote': '{sheets} feuillets de {width} × {height} mm. Le navigateur transforme l’aperçu en PDF.',
  'journey.studio.exportOpen': 'Aperçu avant impression',
  'journey.studio.exportSave': 'Enregistrer en PDF',
  'journey.studio.exportPreparing': 'Préparation',
  'journey.studio.exportSheetCount': '{count} feuillets',
  'journey.studio.undo': 'Undo', // en-fallback
  'journey.studio.redo': 'Redo', // en-fallback
  'journey.studio.zoomIn': 'Zoom in', // en-fallback
  'journey.studio.zoomOut': 'Zoom out', // en-fallback
  'journey.studio.zoomFit': 'Fit to view', // en-fallback
  'journey.studio.downloadSpread': 'Télécharger cette double page',
  'journey.studio.downloadSpreadHint':
    'Enregistre la mise en page de cette double page dans un fichier, sans les photos, à partager ou à réutiliser',
  'journey.studio.importSpread': 'Importer',
  'journey.studio.importSpreadHint': "Ajoute une double page à partir d'un fichier de mise en page téléchargé",
  'journey.studio.importSpreadFailed': "Ce fichier n'est pas une double page TREK Studio",
  'journey.studio.desktopOnly': 'Studio needs a bigger screen', // en-fallback
  'journey.studio.desktopOnlyHint':
    "Composer un livre demande de la place, donc Studio n'existe que sur ordinateur, et le PDF aussi. Tout le reste de votre voyage fonctionne ici comme d'habitude.", // en-fallback
  'journey.studio.formatA5Landscape': 'A5 landscape', // en-fallback
  'journey.studio.bookView': 'Book view', // en-fallback
  'journey.studio.multiple': 'Several', // en-fallback
  'journey.studio.kind.photo': 'Photo', // en-fallback
  'journey.studio.kind.text': 'Text', // en-fallback
  'journey.studio.kind.shape': 'Shape', // en-fallback
  'journey.studio.position': 'Position', // en-fallback
  'journey.studio.width': 'W', // en-fallback
  'journey.studio.height': 'H', // en-fallback
  'journey.studio.text': 'Text', // en-fallback
  'journey.studio.typography': 'Type', // en-fallback
  'journey.studio.leading': 'Line', // en-fallback
  'journey.studio.colour': 'Colour', // en-fallback
  'journey.studio.autoColour': 'Automatique',
  'journey.studio.countryNames': 'Noms',
  'journey.studio.crop': 'Crop', // en-fallback
  'journey.studio.look': 'Look', // en-fallback
  'journey.studio.radius': 'Corner', // en-fallback
  'journey.studio.shape': 'Shape', // en-fallback
  'journey.studio.arrange': 'Arrange', // en-fallback
  'journey.studio.toFront': 'Bring to front', // en-fallback
  'journey.studio.forward': 'Bring forward', // en-fallback
  'journey.studio.backward': 'Send backward', // en-fallback
  'journey.studio.toBack': 'Send to back', // en-fallback
  'journey.studio.lock': 'Lock', // en-fallback
  'journey.studio.unlock': 'Unlock', // en-fallback
  'journey.studio.delete': 'Delete', // en-fallback
  'journey.studio.pageHint': 'Page', // en-fallback
  'journey.studio.boundHint': 'Follows the journal entry. Editing it here breaks that link.', // en-fallback
  'journey.studio.fit.cover': 'Fill', // en-fallback
  'journey.studio.fit.contain': 'Fit', // en-fallback
  'journey.studio.filter.none': 'Original', // en-fallback
  'journey.studio.filter.bw': 'Black & white', // en-fallback
  'journey.studio.filter.warm': 'Warm', // en-fallback
  'journey.studio.shapeKind.rect': 'Rectangle', // en-fallback
  'journey.studio.shapeKind.ellipse': 'Ellipse', // en-fallback
  'journey.studio.focalHint': 'Drag the point to choose what stays in frame.', // en-fallback
  'journey.studio.backCover': 'Back cover', // en-fallback
  'journey.studio.sections': 'Sections', // en-fallback
  'journey.studio.content': 'Content', // en-fallback
  'journey.studio.elements': 'Elements', // en-fallback
  'journey.studio.templates': 'Layouts', // en-fallback
  'journey.studio.photos': 'Photos', // en-fallback
  'journey.studio.entries': 'Entries', // en-fallback
  'journey.studio.addToPage': 'Add to this page', // en-fallback
  'journey.studio.noPhotos': 'This journey has no photos yet.', // en-fallback
  'journey.studio.untitled': 'Untitled', // en-fallback
  'journey.studio.addTitle': 'Title', // en-fallback
  'journey.studio.addStory': 'Story', // en-fallback
  'journey.studio.addPlace': 'Place', // en-fallback
  'journey.studio.shapes': 'Shapes', // en-fallback
  'journey.studio.frames': 'Cadres', // en-fallback
  'journey.studio.emptyFrame': 'Empty frame', // en-fallback
  'journey.studio.frameHint': 'An empty frame marks where a picture goes. Drop one on it from Content.', // en-fallback
  'journey.studio.shapeKind.line': 'Line', // en-fallback
  'journey.studio.styleTitle': 'Heading', // en-fallback
  'journey.studio.styleSubtitle': 'Subheading', // en-fallback
  'journey.studio.styleBody': 'Body text', // en-fallback
  'journey.studio.styleCaption': 'Caption', // en-fallback
  'journey.studio.sampleHeading': 'A heading', // en-fallback
  'journey.studio.sampleSubheading': 'A subheading', // en-fallback
  'journey.studio.sampleBody': 'Write something about this day.', // en-fallback
  'journey.studio.sampleCaption': 'Caption', // en-fallback
  'journey.studio.templatesCoverHint':
    'Layouts apply to the inside spreads. The cover and the back are designed on their own.', // en-fallback
  'journey.studio.tpl.heroStory': 'Hero and story', // en-fallback
  'journey.studio.tpl.fullBleed': 'One picture, full spread', // en-fallback
  'journey.studio.tpl.twoUp': 'Two full pages', // en-fallback
  'journey.studio.tpl.grid4': 'Four up', // en-fallback
  'journey.studio.tpl.grid6': 'Six up', // en-fallback
  'journey.studio.tpl.strip': 'Strip and text', // en-fallback
  'journey.studio.tpl.quietText': 'Text only', // en-fallback
  'journey.studio.tpl.portraitPair': 'A pair', // en-fallback
  'journey.studio.dropPhotoHere': 'Glisse ta photo\nici',
  'journey.studio.searchContent': 'Search photos and entries', // en-fallback
  'journey.studio.noMatches': 'Nothing matches that.', // en-fallback
  'journey.studio.decorations': 'Decoration', // en-fallback
  'journey.studio.quoteMark': 'Quotation mark', // en-fallback
  'journey.studio.circleOutline': 'Outlined circle', // en-fallback
  'journey.studio.roundFrame': 'Rounded frame', // en-fallback
  'journey.studio.shapeKind.rounded': 'Rounded rectangle', // en-fallback
  'journey.studio.shapeKind.triangle': 'Triangle', // en-fallback
  'journey.studio.shapeKind.outline': 'Outline only', // en-fallback
  'journey.studio.travel': 'Voyage',
  'journey.studio.travelEmpty': 'Les chiffres de ce voyage ne sont pas encore prêts.',
  'journey.studio.grids': 'Grilles',
  'journey.studio.gridHint': 'Une grille dépose un bloc de cadres vides. Faites-y glisser des photos depuis Contenu.',
  'journey.studio.lines': 'Lignes',
  'journey.studio.frameStyles': 'Styles de cadre',
  'journey.studio.frameShapes': 'Formes de cadre',
  'journey.studio.plainFrame': 'Simple',
  'journey.studio.polaroidFrame': 'Polaroid',
  'journey.studio.whiteFrame': 'Bord blanc',
  'journey.studio.shadowFrame': 'Ombre portée',
  'journey.studio.filmFrame': 'Pellicule',
  'journey.studio.tapeFrame': 'Scotché',
  'journey.studio.shapeGroup.basic': 'Bases',
  'journey.studio.shapeGroup.polygons': 'Polygones',
  'journey.studio.shapeGroup.stars': 'Étoiles',
  'journey.studio.shapeGroup.arrows': 'Flèches',
  'journey.studio.shapeGroup.speech': 'Bulles',
  'journey.studio.shapeGroup.travel': 'Voyage',
  'journey.studio.shapeGroup.decor': 'Décoration',
  'journey.studio.shapeGroup.banners': 'Bannières',
  'journey.studio.summary': 'Résumé',
  'journey.studio.tripSummary': 'Résumé du voyage',
  'journey.studio.statsRow': 'Une ligne',
  'journey.studio.statsFull': 'Tout',
  'journey.studio.routeMap': 'Carte de l’itinéraire',
  'journey.studio.mapStyle.minimal': 'Minimal',
  'journey.studio.mapStyle.outline': 'Contour',
  'journey.studio.mapStyle.paper': 'Papier',
  'journey.studio.mapStyle.dark': 'Sombre',
  'journey.studio.countries': 'Pays',
  'journey.studio.countryList': 'Liste des pays',
  'journey.studio.countryGrid': 'Grille des pays',
  'journey.studio.noCountries': 'Aucun pays déterminé pour ce voyage pour l’instant.',
  'journey.studio.noRoute': 'Aucune étape avec coordonnées.',
  'journey.studio.marks': 'Repères',
  'journey.studio.dateMark': 'Date',
  'journey.studio.dayMark': 'Compteur de jours',
  'journey.studio.dayWord': 'JOUR',
  'journey.studio.coordsMark': 'Coordonnées',
  'journey.studio.coordsDms': 'Degrés',
  'journey.studio.coordsDecimal': 'Décimal',
  'journey.studio.flagMark': 'Drapeau',
  'journey.studio.distanceMark': 'Distance',
  'journey.studio.metric.distance': 'Distance',
  'journey.studio.metric.days': 'Jours',
  'journey.studio.metric.steps': 'Étapes',
  'journey.studio.metric.photos': 'Photos',
  'journey.studio.metric.countries': 'Pays',
  'journey.studio.metric.places': 'Lieux',
  'journey.studio.metric.furthest': 'Le plus loin',
  'journey.studio.kind.map': 'Carte',
  'journey.studio.kind.stats': 'Chiffres',
  'journey.studio.kind.countries': 'Pays',
  'journey.studio.kind.badge': 'Repère',
  'journey.studio.kind.list': 'Liste',
  'journey.studio.kind.icon': 'Icône',
  'journey.studio.duplicate': 'Dupliquer',
  'journey.studio.style': 'Style',
  'journey.studio.shows': 'Affichage',
  'journey.studio.size': 'Taille',
  'journey.studio.weight': 'Graisse',
  'journey.studio.italic': 'Italique',
  'journey.studio.tracking': 'Interlettrage',
  'journey.studio.rotation': 'Rotation',
  'journey.studio.opacity': 'Opacité',
  'journey.studio.fill': 'Fond',
  'journey.studio.fillOn': 'Rempli',
  'journey.studio.stroke': 'Contour',
  'journey.studio.strokeWidth': 'Épaisseur',
  'journey.studio.gradient': 'Fondu',
  'journey.studio.gradientDown': 'Vers le bas',
  'journey.studio.gradientUp': 'Vers le haut',
  'journey.studio.showIcons': 'Icônes',
  'journey.studio.mapFit': 'Cadrer sur',
  'journey.studio.mapPadding': 'Espace',
  'journey.studio.mapShape': 'Forme',
  'journey.studio.align.left': 'Gauche',
  'journey.studio.align.center': 'Centre',
  'journey.studio.align.right': 'Droite',
  'journey.studio.markStyle.plain': 'Simple',
  'journey.studio.markStyle.chip': 'Pastille',
  'journey.studio.markStyle.outline': 'Contour',
  'journey.studio.markStyle.stacked': 'Empilé',
  'journey.studio.icon': 'Icône',
  'journey.studio.iconAndLabel': 'Icône et texte',
  'journey.studio.iconOnly': 'Icône seule',
  'journey.studio.labelOnly': 'Texte seul',
  'journey.studio.icons': 'Icônes',
  'journey.studio.iconsForTravel': 'Pour le voyage',
  'journey.studio.iconsAll': 'Toutes les icônes',
  'journey.studio.searchIcons': 'Rechercher une icône',
  'journey.studio.lineWidth': 'Épaisseur',
  'journey.studio.mask': 'Découper en forme',
  'journey.studio.maskNone': 'Aucune',
  'journey.studio.frameStyle': 'Cadre',
  'journey.studio.mapLayers': 'Calques',
  'journey.studio.showLand': 'Pays',
  'journey.studio.showRoute': 'Itinéraire',
  'journey.studio.showPins': 'Étapes',
  'journey.studio.showLabels': 'Étiquettes',
  'journey.studio.units': 'Unités',
  'journey.studio.metrics': 'Chiffres',
  'journey.studio.layout': 'Disposition',
  'journey.studio.layoutGrid': 'Grille',
  'journey.studio.layoutRow': 'Ligne',
  'journey.studio.layoutColumn': 'Colonne',
  'journey.studio.layoutList': 'Liste',
  'journey.studio.showOutline': 'Contours',
  'journey.studio.showFlag': 'Drapeaux',
  'journey.studio.showName': 'Noms',
  'journey.studio.textScale': 'Taille du texte',
  'journey.studio.accent': 'Accent',
  'journey.studio.refresh': 'Mettre à jour depuis le voyage',
  'journey.studio.staleHint': 'Le voyage a changé depuis que ces chiffres ont été relevés.',
  'journey.studio.align': 'Alignement',
  'journey.studio.filter.cool': 'Froid',
  'journey.studio.filter.fade': 'Délavé',
  'journey.studio.filter.contrast': 'Contrasté',
  'journey.studio.strokeStyle': 'Trait',
  'journey.studio.strokeSolid': 'Plein',
  'journey.studio.strokeDashed': 'Tirets',
  'journey.studio.strokeDotted': 'Pointillés',
  'journey.studio.singleFigures': 'Chiffres isolés',
  'journey.studio.addPage': 'Ajouter une page',
  'journey.studio.addPageAfter': 'Insérer une page après',
  'journey.studio.duplicatePage': 'Dupliquer la page',
  'journey.studio.deletePage': 'Supprimer la page',
  'journey.studio.movePageUp': 'Déplacer avant',
  'journey.studio.movePageDown': 'Déplacer après',
  'journey.studio.beta': 'Beta',
  'journey.studio.addProsCons': 'Pour et contre',
  'journey.studio.showMarks': 'Repères',
  'journey.studio.formatCustom': 'Format libre',
  'journey.studio.document': 'Document',
  'journey.studio.pageNumbers': 'Numéros de page',
  'journey.studio.pageNumbersOn': 'Oui',
  'journey.studio.pageNumbersOff': 'Non',
  'journey.studio.folio.outer': 'Extérieur',
  'journey.studio.folio.inner': 'Intérieur',
  'journey.studio.folio.centre': 'Centré',
  'journey.studio.folioStart': 'Commence à',
  'journey.studio.folioMargin': 'Marge',
  'journey.studio.relayoutSpread': 'Cette page',
  'journey.studio.relayoutSpreadHint': 'La refaire depuis son entrée',
  'journey.studio.relayoutSpreadNone': 'Cette page ne vient pas d’une entrée',
  'journey.studio.relayoutBook': 'Tout le livre',
  'journey.studio.relayoutBookHint': 'Remplace toutes les pages — annulable',
  'journey.studio.tpl.coverFull': 'Pleine page',
  'journey.studio.tpl.coverBand': 'Image et bandeau',
  'journey.studio.tpl.coverWindow': 'Encadré',
  'journey.studio.tpl.coverQuiet': 'Texte seul',
  'journey.studio.tpl.coverHalf': 'Deux moitiés',
  'journey.studio.tpl.fullText': 'Image et récit',
  'journey.studio.tpl.grid9': 'Neuf',
  'journey.studio.tpl.mosaic': 'Mosaïque',
  'journey.studio.tpl.bandQuote': 'Mots au milieu',
  'journey.studio.tpl.staggerFour': 'Quatre décalées',
  'journey.studio.weightMissing': 'Cette police n’a pas cette graisse',
  'journey.studio.mapSource': 'Source de la carte',
  'journey.studio.mapSourceVector': 'Contours',
  'journey.studio.mapSourceRelief': 'Relief',
  'journey.studio.mapSourceSatellite': 'Satellite',
  'journey.studio.mapSourceSatelliteHint':
    'Sentinel-2 sans nuages, libre à l’impression avec son crédit. Net jusqu’à la rue.',
  'journey.studio.routeLook': 'Le tracé',
  'journey.studio.routeStyle': 'Trait',
  'journey.studio.routePlain': 'Simple',
  'journey.studio.routeDrawn': 'Dessiné',
  'journey.studio.routeArc': 'Longs trajets',
  'journey.studio.routeStraight': 'Droits',
  'journey.studio.routeBow': 'Courbes',
  'journey.studio.routeDashArcs': 'Courbes en pointillés',
  'journey.studio.mapStops': 'Étapes',
  'journey.studio.pinDot': 'Points',
  'journey.studio.pinPhoto': 'Photos',
  'journey.studio.pinPhotoNone': 'Pas encore de photo sur ces étapes, elles sont donc dessinées en points.',
  'journey.studio.roads': 'Routes',
  'journey.studio.roadsFetch': 'Suivre les routes',
  'journey.studio.roadsFollow': 'Par la route',
  'journey.studio.roadsDirect': 'Direct',
  'journey.studio.recommended': 'recommandé',
  'journey.studio.bleed': 'Fond perdu',
  'journey.studio.safeArea': 'Sécurité',
  'journey.studio.roadsAgain': 'Relancer',
  'journey.studio.roadsClear': 'Effacer',
  'journey.studio.roadsBusy': 'Recherche',
  'journey.studio.roadsHint':
    'Demande à un service d’itinéraires le chemin parcouru sur chaque trajet. Les longs trajets restent tels quels.',
  'journey.studio.roadsHave': 'Les routes sont enregistrées dans ce livre, il imprime donc le même tracé hors ligne.',
  'journey.studio.mapSourceReliefHint':
    'Relief ombré de la NASA, libre à l’impression. Parfait pour un pays ou un continent, trop grossier pour une ville.',
  'journey.studio.mapPrintDpi': 'Impression à environ',
  'journey.studio.mapPrintDpiLow': 'flou à cette taille, essayez une vue plus large ou une autre source',
  'journey.studio.mapPerTrip': 'Un voyage à la fois',
  'journey.studio.mapWholeJourney': 'Tout le journal',
  'journey.studio.mapScope': 'Affichage',
  'journey.studio.mapSourceTiles': 'Tuiles',
  'journey.studio.mapSourceStatic': 'Mapbox',
  'journey.studio.mapSourceHint': 'Téléchargée au rendu et imprimée avec son crédit',
  'journey.studio.mapZoom': 'Zoom',
  'journey.studio.mapFraming': 'Cadrage',
  'journey.studio.mapFitStops': 'Étapes',
  'journey.studio.mapFitCountry': 'Pays entier',
  'journey.studio.mapPadTight': 'Serré',
  'journey.studio.mapPadNormal': 'Normal',
  'journey.studio.mapPadWide': 'Large',
  'journey.studio.mapPadFar': 'Très large',
  'journey.studio.mapClipRect': 'Dans un cadre',
  'journey.studio.mapClipCountry': 'Détouré',
  'journey.studio.mapClipNeedsCountry': 'Il faut un pays pour détourer',
  'journey.studio.mapCutVector': 'Détourage',
  'journey.studio.mapCutTiles': 'Carte détourée',
  'journey.studio.mapZoomAuto': 'Ajuster',
  'journey.studio.saving': 'Enregistrement',
  'journey.studio.saved': 'Enregistré',
  'journey.studio.saveFailed': 'Non enregistré',
  'journey.studio.saveRetry': 'Réessayer',
  'journey.studio.saveConflict': 'Quelqu’un d’autre a enregistré ce livre',
  'journey.studio.saveTakeTheirs': 'La leur',
  'journey.studio.saveKeepMine': 'La mienne',
  'journey.studio.rotate': 'Pivoter',
  'journey.studio.rotateLeft': 'Pivoter à gauche',
  'journey.studio.rotateRight': 'Pivoter à droite',
  'journey.studio.saveReadOnly': "Lecture seule, rien n'est enregistré",
};
export default journey;
