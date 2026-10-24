import type { TranslationStrings } from '../types';

// English fallback until 'fr' is translated.
const help: TranslationStrings = {
  'help.title': 'Aide et documentation',
  'help.search': 'Rechercher dans la documentation…',
  'help.contents': 'Sommaire',
  'help.noResults': 'Aucune page ne correspond.',
  'help.errorTitle': 'Impossible de charger cette page',
  'help.errorBody': "Le contenu de l'aide est chargé depuis le wiki TREK. Vérifiez votre connexion et réessayez.",

  // center
  'help.center.button': 'Aide pour cet écran',
  'help.center.title': 'Aide',
  'help.center.onThisScreen': 'Sur cet écran',
  'help.center.screens': 'Écrans',
  'help.center.thisScreen': 'Actuel',
  'help.center.subScreens': '{count} sous-écrans',
  'help.center.subScreens.one': '{count} sous-écran',
  'help.center.subScreensLabel': 'Sous-écrans',
  'help.center.guidesCount': '{count} guides', // same-as-en
  'help.center.guidesCount.one': '{count} guide', // same-as-en
  'help.center.goToScreen': 'Aller à {screen}',
  'help.center.overview': 'Aperçu',
  'help.center.howTo': 'Comment faire pour…',
  'help.center.searchPlaceholder': 'Rechercher dans les guides et la documentation…',
  'help.center.searchEmpty': 'Aucun résultat pour « {query} ».',
  'help.center.searchGuides': 'Guides', // same-as-en
  'help.center.searchDocs': 'Documentation',
  'help.center.searchError': 'La recherche est indisponible pour le moment.',
  'help.center.back': 'Retour',
  'help.center.close': 'Fermer l’aide',
  'help.center.steps': '{count} étapes',
  'help.center.steps.one': '{count} étape',
  'help.center.step': 'Étape {n}',
  'help.center.stepsLabel': 'Étapes',
  'help.center.stepOf': 'Étape {n} sur {total}',
  'help.center.screenshot': 'Capture d’écran',
  'help.center.result': 'Résultat',
  'help.center.tips': 'Bon à savoir',
  'help.center.related': 'Voir aussi',
  'help.center.openDocs': 'Ouvrir dans Aide et documentation',
  'help.center.docsSection': 'Dans la documentation',
  'help.center.noContext': 'Aucun guide pour cet écran pour le moment.',
  'help.center.noContextHint': 'Cherchez dans la documentation, ou dites-nous ce que vous cherchiez.',
  'help.center.feedback': 'Il vous manque quelque chose ?',
  'help.center.feedbackLink': 'Dites-le-nous sur GitHub',
  'help.center.discord': 'Poser la question sur Discord',
  'help.center.quick': 'En bref',
  'help.center.guide': 'Guide', // same-as-en
  'help.center.tour': 'Visite guidée',
  'help.center.imageAlt': 'Étape {n} de « {title} »',

  // ctx
  'help.ctx.dashboard.title': 'Tableau de bord',
  'help.ctx.dashboard.summary':
    'Le tableau de bord affiche tous vos voyages. La carte du haut, en forme de carte d’embarquement, présente le voyage en cours ou le prochain. La rangée en dessous fait le bilan de vos voyages passés, et les cartes listent tous les voyages que vous préparez, avez archivés ou avez déjà terminés.',
  'help.ctx.dashboard.bullet.1':
    'Carte d’embarquement : le voyage en cours ou le prochain, avec ses dates, ses voyageurs, ses lieux et un compte à rebours. Cliquez dessus pour ouvrir le voyage. Les quatre boutons en haut à droite permettent de le modifier, le dupliquer, l’archiver ou le supprimer.',
  'help.ctx.dashboard.bullet.2':
    'Statistiques de voyage : pays visités, voyages, jours sur la route et distance parcourue en avion, tous voyages confondus.',
  'help.ctx.dashboard.bullet.3':
    'Les cartes de voyage, filtrées par « Prévu », « Archivé » et « Terminé », en grille ou en liste. Le champ de recherche au-dessus cherche dans tous vos voyages à la fois, par titre, date ou lieu du voyage. Les boutons pour modifier, dupliquer, archiver et supprimer un voyage se trouvent en haut à droite de la photo de chaque carte.',
  'help.ctx.dashboard.bullet.4':
    'Les widgets à droite : convertisseur de devises, Collections (si l’extension Collections est activée), horloges mondiales, prochaines réservations et widgets des plugins. Vous pouvez désactiver les widgets intégrés dans Paramètres, Apparence.',
  'help.ctx.dashboard.bullet.5':
    'La carte « Nouveau voyage » et le bouton en bas à droite permettent tous deux de créer un voyage.',

  // create-trip
  'help.guide.create-trip.title': 'Créer un voyage',
  'help.guide.create-trip.goal': 'Créer un voyage avec un nom, des dates et une photo de couverture.',
  'help.guide.create-trip.step.1':
    'Cliquez sur « Nouveau voyage ». La carte placée après vos voyages et le bouton en bas à droite font la même chose.',
  'help.guide.create-trip.step.2':
    'Donnez un nom au voyage. C’est le seul champ obligatoire ; tout le reste peut être ajouté plus tard.',
  'help.guide.create-trip.step.3':
    'Choisissez une date de début et une date de fin. TREK crée un jour pour chaque date : vous pouvez commencer à planifier votre programme. Pas encore de dates ? Laissez les deux champs vides et indiquez plutôt le « Nombre de jours ».',
  'help.guide.create-trip.step.4':
    'Facultatif : ajoutez une photo de couverture. Importez la vôtre, faites-en glisser ou collez-en une, ou cherchez la destination sur Unsplash.',
  'help.guide.create-trip.step.5': 'Cliquez sur « Créer un nouveau voyage ».',
  'help.guide.create-trip.result':
    "Le voyage apparaît sur votre tableau de bord. S'il s'agit de votre prochain voyage, il s'affiche dans la carte d'embarquement en haut.",
  'help.guide.create-trip.tip.1':
    "Vous pourrez modifier les dates plus tard. S'il existe déjà des réservations, TREK vous demande s'il faut les décaler avec les jours.",
  'help.guide.create-trip.tip.2':
    'Toutes les dépenses sont converties dans la devise du voyage choisie ici. Choisissez celle de la destination.',

  // edit-trip
  'help.guide.edit-trip.title': 'Modifier un voyage',
  'help.guide.edit-trip.goal': 'Renommer un voyage, changer ses dates ou modifier ses réglages.',
  'help.guide.edit-trip.step.1':
    'Cliquez sur le crayon en haut à droite de la carte du voyage (ou de la carte d’embarquement).',
  'help.guide.edit-trip.step.2':
    'Modifiez ce qu’il faut : nom, description, dates, couverture, devise, rappel ou compagnons de voyage.',
  'help.guide.edit-trip.step.3': 'Cliquez sur « Mettre à jour ».',
  'help.guide.edit-trip.result': 'La carte se met à jour immédiatement, pour tous les membres du voyage.',
  'help.guide.edit-trip.tip.1':
    'Si vous décalez le début d’un voyage qui comporte des réservations, TREK vous demande s’il faut aussi les décaler. Si vous raccourcissez un voyage, TREK liste les jours qui seraient supprimés et ce qui y est prévu. L’enregistrement n’a lieu qu’après un clic sur « Retirer les jours et enregistrer ».',

  // cover-image
  'help.guide.cover-image.title': 'Choisir une photo de couverture',
  'help.guide.cover-image.goal': "Donner au voyage une image, affichée sur sa carte et sur la carte d'embarquement.",
  'help.guide.cover-image.step.1': 'Ouvrez le formulaire de modification du voyage avec le crayon de sa carte.',
  'help.guide.cover-image.step.2':
    'Sous « Image de couverture », déposez ou collez une photo, cliquez pour en importer une, ou saisissez une destination et cliquez sur « Rechercher sur Unsplash ».',
  'help.guide.cover-image.step.3': 'Choisissez une photo et cliquez sur « Mettre à jour ».',
  'help.guide.cover-image.result': "La photo est enregistrée avec le voyage et s'affiche partout où il apparaît.",
  'help.guide.cover-image.tip.1':
    'Les photos issues de la recherche Unsplash sont créditées automatiquement ; vos propres images restent sur votre serveur.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Dupliquer un voyage',
  'help.guide.duplicate-trip.goal': 'Réutiliser un voyage comme modèle pour un nouveau.',
  'help.guide.duplicate-trip.step.1': 'Cliquez sur l’icône de duplication en haut à droite de la carte.',
  'help.guide.duplicate-trip.step.2':
    'Lisez ce qui sera copié et ce qui ne le sera pas, puis cliquez sur « Copier le voyage ».',
  'help.guide.duplicate-trip.result':
    'Une copie apparaît sur votre tableau de bord. Elle porte le nom de l’original suivi de « (copie) ». Vous pouvez la renommer et changer ses dates.',
  'help.guide.duplicate-trip.tip.1':
    'Les jours, lieux, sorties et itinéraires de road trip, réservations, postes de budget, listes de bagages, tâches et notes de jour sont copiés ; les listes de bagages et les tâches le sont décochées. Les membres, la discussion, les sondages, les fichiers et les liens de partage ne sont pas copiés.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archiver et restaurer un voyage',
  'help.guide.archive-trip.goal': 'Retirer un voyage de votre liste sans le supprimer, et le restaurer plus tard.',
  'help.guide.archive-trip.step.1': 'Cliquez sur l’icône d’archivage en haut à droite de la carte.',
  'help.guide.archive-trip.step.2': 'Réglez le filtre au-dessus des cartes sur « Archivé » pour le retrouver.',
  'help.guide.archive-trip.step.3':
    'Cliquez sur « Restaurer » sur la carte pour le remettre dans « Prévu », ou dans « Terminé » si ses dates sont passées.',
  'help.guide.archive-trip.result':
    "Les voyages archivés conservent toutes leurs données. Ils n'apparaissent plus sur le tableau de bord ni dans le flux d'agenda de tous les voyages.",

  // delete-trip
  'help.guide.delete-trip.title': 'Supprimer un voyage',
  'help.guide.delete-trip.goal': 'Supprimer définitivement un voyage.',
  'help.guide.delete-trip.step.1': 'Cliquez sur l’icône de corbeille en haut à droite de la carte.',
  'help.guide.delete-trip.step.2':
    'Confirmez avec « Supprimer ». La boîte de dialogue affiche le nom du voyage, pour que vous soyez sûr de supprimer le bon.',
  'help.guide.delete-trip.result':
    'Le voyage, ses jours, ses lieux, ses réservations et ses fichiers sont supprimés. Cette action est irréversible : en cas de doute, archivez plutôt le voyage.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Retrouver les voyages terminés, basculer entre grille et liste',
  'help.guide.filter-and-view.goal':
    'Afficher les voyages terminés ou archivés et choisir la présentation qui vous convient.',
  'help.guide.filter-and-view.step.1':
    'Utilisez « Prévu », « Archivé » et « Terminé » au-dessus des cartes. « Terminé » regroupe tous les voyages dont la date de fin est passée.',
  'help.guide.filter-and-view.step.2':
    "Cliquez sur l'icône de liste pour passer à une liste compacte, puis cliquez de nouveau pour revenir à la grille.",
  'help.guide.filter-and-view.result': 'Le tableau de bord mémorise votre affichage sur cet appareil.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'S’abonner à tous vos voyages dans votre agenda',
  'help.guide.calendar-feed.goal':
    'Voir les jours et les réservations de tous vos voyages actifs dans votre application d’agenda, toujours synchronisés.',
  'help.guide.calendar-feed.step.1': "Cliquez sur l'icône de calendrier à côté du sélecteur d'affichage.",
  'help.guide.calendar-feed.step.2':
    'Cliquez sur « Activer l’abonnement au calendrier ». TREK crée un lien de flux privé.',
  'help.guide.calendar-feed.step.3':
    'Cliquez sur « Ajouter à Google Agenda » ou « Ajouter à Calendrier Apple / Outlook ». Pour toute autre application d’agenda, ouvrez « Ou copier un lien manuellement » et copiez le lien qui s’y trouve.',
  'help.guide.calendar-feed.result':
    'Chaque voyage actif apparaît dans votre agenda et se met à jour automatiquement. Les voyages archivés et ceux terminés depuis plus de 90 jours ne sont pas inclus.',
  'help.guide.calendar-feed.tip.1':
    'Gardez ce lien secret : toute personne qui l’a peut lire le flux. S’il a circulé, « Régénérer » vous donne un nouveau lien et l’ancien cesse de fonctionner. « Désactiver » supprime complètement le lien.',

  // widgets
  'help.guide.widgets.title': 'Choisir les widgets du tableau de bord',
  'help.guide.widgets.goal': 'Afficher ou masquer la rangée de statistiques et les widgets de droite.',
  'help.guide.widgets.step.1': 'Ouvrez le menu de votre avatar en haut à droite et choisissez « Paramètres ».',
  'help.guide.widgets.step.2': 'Passez à l’onglet « Apparence ».',
  'help.guide.widgets.step.3':
    'Sous « Widgets du tableau de bord », activez ou désactivez chaque widget, séparément pour ordinateur et pour mobile. « Barre latérale droite » désactive d’un coup toute la colonne de droite.',
  'help.guide.widgets.step.4': 'Revenez au tableau de bord. La modification s’applique immédiatement.',
  'help.guide.widgets.result':
    "En masquant des widgets, vous laissez plus de place à vos voyages. Désactivez toute la colonne de droite pour centrer l'affichage.",
  'help.guide.widgets.link': "Ouvrir les paramètres d'apparence",

  // currency-widget
  'help.guide.currency-widget.title': 'Convertir des devises',
  'help.guide.currency-widget.goal': "Convertir un montant d'une devise à une autre au taux actuel.",
  'help.guide.currency-widget.step.1': 'Saisissez le montant et choisissez les deux devises.',
  'help.guide.currency-widget.step.2':
    'La flèche entre les deux inverse les devises ; la flèche circulaire actualise le taux.',
  'help.guide.currency-widget.result':
    'Votre paire de devises est mémorisée dans votre compte : elle est donc la même sur tous vos appareils.',
  'help.guide.currency-widget.tip.1':
    'Les taux proviennent du service gratuit Frankfurter. La flèche circulaire dans le coin du widget récupère les plus récents.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Ajouter des horloges mondiales',
  'help.guide.timezones-widget.goal': "Connaître l'heure locale de vos destinations.",
  'help.guide.timezones-widget.step.1':
    'Cliquez sur + dans le widget « Fuseau horaire », cherchez une ville, par exemple Lisbonne, et choisissez-la dans la liste.',
  'help.guide.timezones-widget.step.2':
    'Pour retirer une horloge, survolez-la et cliquez sur le × qui apparaît à droite.',
  'help.guide.timezones-widget.result': 'Vos horloges sont enregistrées dans votre compte.',
  'help.guide.search-trips.title': 'Rechercher dans vos voyages',
  'help.guide.search-trips.goal':
    'Retrouver un voyage par son nom, une date ou un lieu prévu, y compris parmi les voyages archivés.',
  'help.guide.search-trips.step.1':
    'Tapez dans « Rechercher voyages ou lieux », au-dessus des cartes. La liste se filtre au fil de la saisie, parmi les voyages prévus, archivés et terminés à la fois.',
  'help.guide.search-trips.step.2':
    'Si un voyage correspond grâce à l’un de ses lieux, ce lieu s’affiche sous le titre du voyage. Cliquez sur le x dans le champ, ou appuyez sur Échap, pour réafficher tous vos voyages.',
  'help.guide.search-trips.result':
    "Le tableau de bord n'affiche plus que les voyages correspondants. Videz le champ de recherche pour retrouver tous vos voyages.",
  'help.guide.search-trips.tip.1':
    'Vous pouvez aussi chercher par date : saisissez un mois et une année, par exemple mai 2027, ou 2027-05, pour retrouver les voyages de ce mois.',
  'help.guide.search-trips.tip.2':
    "Pendant une recherche, le sélecteur « Prévu », « Archivé » et « Terminé » ne s'applique pas : un mauvais filtre ne masque donc jamais un voyage.",

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacances',
  'help.ctx.vacay.summary':
    'Vacances est votre planificateur de congés personnel : combien de jours de congé vous avez sur l’année, lesquels vous avez posés et combien il en reste. La grille affiche toute l’année. La barre latérale regroupe le sélecteur d’année, les personnes avec qui vous planifiez, les calendriers partagés avec vous, la légende et vos droits.',
  'help.ctx.vacay.bullet.1':
    'La grille annuelle : douze cartes de mois, une case par jour. Cliquez sur un jour pour le saisir ou l’effacer. Un petit point bleu signale les jours déjà couverts par un voyage.',
  'help.ctx.vacay.bullet.2':
    "La barre d’outils en bas : le premier bouton, à votre nom et dans votre couleur, saisit des congés ; « Jour férié d'entreprise » marque les jours où toute l’entreprise est fermée. « Demi-journée » et « Récup / RTT » modifient ce qu’un clic enregistre, et « Demi-journée » fonctionne aussi pour les jours fériés d’entreprise.",
  'help.ctx.vacay.bullet.3':
    '« Droits » : « Jours », « Utilisé » et « Restants » pour l’année sélectionnée, avec les reports et les jours de récup / RTT à côté. Cliquez sur le titre de la carte pour la replier.',
  'help.ctx.vacay.bullet.4':
    'Les « Personnes » partagent votre planning, chacune dans sa couleur. Les « Calendriers partagés » affichent les congés des autres sous forme d’anneaux colorés. Vous ne pouvez pas les modifier.',
  'help.ctx.vacay.bullet.5':
    'Les paramètres regroupent les week-ends, le premier jour de la semaine, les reports, votre année de congés, les jours fériés d’entreprise, les calendriers de jours fériés et de vacances scolaires, ainsi que « Séparer les calendriers » quand vous planifiez avec quelqu’un.',
  // log-day
  'help.guide.log-day.title': 'Poser un jour de congé',
  'help.guide.log-day.goal': 'Marquer un jour de congé dans la grille annuelle et voir votre solde se mettre à jour.',
  'help.guide.log-day.step.1':
    'Regardez le premier bouton de la barre d’outils en bas. S’il affiche votre nom et votre couleur, un clic sur un jour y saisit un jour de congé pour vous.',
  'help.guide.log-day.step.2':
    "Cliquez sur un jour dans n'importe quel mois. Il prend votre couleur, et « Utilisé » augmente d'un jour.",
  'help.guide.log-day.step.3': "Cliquez de nouveau sur le même jour pour l'effacer.",
  'help.guide.log-day.result':
    'Le jour est saisi. « Jours », « Utilisé » et « Restants » se mettent à jour immédiatement, et toutes les personnes dont le planning est fusionné avec le vôtre voient le changement aussitôt.',
  'help.guide.log-day.tip.1':
    'Les week-ends ne peuvent pas être saisis tant que « Bloquer les week-ends » est activé dans « Paramètres ». Un jour de week-end saisi auparavant peut toujours être effacé.',
  'help.guide.log-day.tip.2':
    'Un point bleu dans une case signifie qu’un de vos voyages couvre ce jour : vous voyez ainsi où congés et voyages coïncident.',
  // half-day
  'help.guide.half-day.title': 'Saisir une demi-journée',
  'help.guide.half-day.goal': "Prendre un après-midi en ne décomptant qu'une demi-journée de vos droits.",
  'help.guide.half-day.step.1':
    "Activez « Demi-journée » dans la barre d'outils. Son point orange signale une demi-journée dans la grille.",
  'help.guide.half-day.step.2':
    'Cliquez sur un jour. Il est décompté pour 0,5 et affiche un point orange dans son coin.',
  'help.guide.half-day.step.3':
    "Désactivez « Demi-journée » une fois terminé. Si vous cliquez sur une demi-journée qui a d'autres réglages, elle prend les réglages actuels.",
  'help.guide.half-day.result':
    '« Utilisé » augmente de 0,5. « Demi-journée » et « Récup / RTT » sont indépendants : vous pouvez aussi saisir une demi-journée de récupération.',
  'help.guide.half-day.tip.1':
    'La barre d’outils affiche toujours le marqueur que placera votre prochain clic : vous pouvez vérifier avant de saisir.',
  // comp-day
  'help.guide.comp-day.title': 'Saisir une récupération ou un RTT',
  'help.guide.comp-day.goal': 'Récupérer des heures sans entamer vos jours de congé.',
  'help.guide.comp-day.step.1':
    "Activez « Récup / RTT » dans la barre d'outils. Le disque hachuré signale un jour de récupération dans la grille.",
  'help.guide.comp-day.step.2':
    "Cliquez sur un jour. Il est hachuré en diagonale dans votre couleur au lieu d'être rempli d'une couleur unie.",
  'help.guide.comp-day.result':
    'Les jours de récupération sont comptés à côté des tuiles de droits et ne réduisent jamais « Restants ».',
  'help.guide.comp-day.tip.1':
    'Utilisez cette option pour des heures supplémentaires récupérées, des horaires variables ou un jour de compensation : tout repos qui n’est pas un congé.',
  // entitlement
  'help.guide.entitlement.title': 'Définir vos droits à congés',
  'help.guide.entitlement.goal': 'Indiquer à Vacances combien de jours de congé vous avez dans l’année.',
  'help.guide.entitlement.step.1':
    'Dans la carte « Droits » de la barre latérale, cliquez sur la tuile « Jours » de votre ligne. Si la carte est repliée, cliquez sur son titre pour la déplier.',
  'help.guide.entitlement.step.2':
    'Saisissez votre nombre de jours et appuyez sur Entrée. Appuyez sur Échap pour conserver l’ancienne valeur.',
  'help.guide.entitlement.result':
    "« Restants » est recalculé à partir de vos droits, d'un éventuel report et des jours déjà pris.",
  'help.guide.entitlement.tip.1':
    "Chaque année a ses propres droits : une modification ici ne concerne que l'année sélectionnée.",
  // years
  'help.guide.years.title': "Ajouter des années et passer de l'une à l'autre",
  'help.guide.years.goal': "Préparer dès maintenant l'année prochaine, ou consulter l'année passée.",
  'help.guide.years.step.1':
    'Cliquez sur le + à droite de l’année pour ajouter l’année suivante, ou sur le + à gauche pour l’année précédente.',
  'help.guide.years.step.2': 'Passez d’une année à l’autre avec les flèches ou les pastilles d’année en dessous.',
  'help.guide.years.step.3':
    'Pour supprimer une année, survolez sa pastille et cliquez sur le petit moins. Toutes ses entrées sont aussi supprimées : confirmez avec prudence.',
  'help.guide.years.result':
    "Chaque année a ses propres droits et ses propres saisies. Le report fait le lien d'une année à la suivante.",
  // company-holidays
  'help.guide.company-holidays.title': "Marquer les fermetures d'entreprise",
  'help.guide.company-holidays.goal':
    "Bloquer les jours de fermeture de l'entreprise, sans les décompter des droits de chacun.",
  'help.guide.company-holidays.step.1':
    "Ouvrez les Paramètres et vérifiez que « Jours fériés d'entreprise » est activé. C'est le cas par défaut. La barre d'outils ne propose ce mode que lorsqu'il est activé.",
  'help.guide.company-holidays.step.2':
    "De retour dans la grille, passez sur « Jour férié d'entreprise » dans la barre d’outils.",
  'help.guide.company-holidays.step.3':
    'Cliquez sur les jours. Ils deviennent orange et apparaissent dans la légende. Cliquez de nouveau sur un jour pour l’effacer.',
  'help.guide.company-holidays.result':
    'Toutes les personnes du planning fusionné voient les jours fériés d’entreprise, qui ne réduisent jamais « Restants ».',
  'help.guide.company-holidays.tip.1':
    'Toute personne du planning fusionné peut modifier les jours fériés d’entreprise : convenez de qui s’en charge.',
  // public-holidays
  'help.guide.public-holidays.title': 'Afficher les jours fériés',
  'help.guide.public-holidays.goal': 'Afficher sur la grille les jours fériés de votre pays ou de votre région.',
  'help.guide.public-holidays.step.1': 'Ouvrez les Paramètres et activez « Jours fériés ».',
  'help.guide.public-holidays.step.2':
    'Cliquez sur « Ajouter un calendrier », puis choisissez le pays et, si besoin, la région. Vous pouvez aussi lui attribuer une couleur et un libellé. Cliquez ensuite sur « Ajouter ».',
  'help.guide.public-holidays.step.3':
    'Fermez les Paramètres. Les jours fériés apparaissent sur la grille et dans la légende.',
  'help.guide.public-holidays.result':
    'Les jours fériés sont marqués dans la couleur du calendrier et ne sont jamais décomptés de vos droits.',
  'help.guide.public-holidays.tip.1':
    'Vous pouvez ajouter plusieurs calendriers, par exemple celui de votre région et celui d’un collègue avec qui vous avez fusionné.',
  // school-holidays
  'help.guide.school-holidays.title': 'Afficher les vacances scolaires',
  'help.guide.school-holidays.goal': 'Voir les vacances scolaires de votre région à côté de vos propres congés.',
  'help.guide.school-holidays.step.1': 'Ouvrez les Paramètres et activez « Vacances scolaires ».',
  'help.guide.school-holidays.step.2':
    'Cliquez sur « Ajouter un calendrier » et choisissez le pays. Si le pays a plusieurs calendriers, choisissez aussi la région ou le groupe, puis cliquez sur « Ajouter ».',
  'help.guide.school-holidays.step.3':
    'Fermez « Paramètres ». Les vacances scolaires sont colorées dans la teinte du calendrier, avec une barre de couleur en bas de leurs jours.',
  'help.guide.school-holidays.result':
    "Les vacances scolaires s'affichent seulement dans le calendrier : elles ne réduisent jamais les droits de qui que ce soit.",
  'help.guide.school-holidays.tip.1':
    "Votre région n'est pas proposée ? Votre administrateur peut saisir les vacances scolaires manuellement dans Administration, Personnalisation, Vacances scolaires.",
  // weekends
  'help.guide.weekends.title': 'Bloquer les week-ends et choisir le premier jour de la semaine',
  'help.guide.weekends.goal': 'Exclure les week-ends du décompte et commencer la semaine le jour de votre choix.',
  'help.guide.weekends.step.1': 'Ouvrez « Paramètres ».',
  'help.guide.weekends.step.2':
    'Activez « Bloquer les week-ends », puis sous « Jours de week-end », choisissez les jours qui composent votre week-end.',
  'help.guide.weekends.step.3': 'Sous « La semaine commence le », choisissez « Lun » ou « Dim ».',
  'help.guide.weekends.result':
    'Les jours bloqués sont grisés dans la grille et ne peuvent pas être saisis par erreur.',
  // leave-year
  'help.guide.leave-year.title': 'Définir votre année de congés',
  'help.guide.leave-year.goal':
    "Calculer vos droits sur un exercice fiscal ou à partir de votre date d'embauche, plutôt que de janvier à décembre.",
  'help.guide.leave-year.step.1': 'Ouvrez les Paramètres et repérez « Année de congés ».',
  'help.guide.leave-year.step.2':
    "Choisissez « Année civile », « Année fiscale » (avec le mois et le jour de début) ou « Date d'embauche » (avec la date de votre embauche).",
  'help.guide.leave-year.result':
    'Les droits, les jours utilisés et les reports sont calculés sur cette période, et la grille commence par son premier mois.',
  'help.guide.leave-year.tip.1':
    'Ce réglage est personnel : dans un planning fusionné, chacun conserve son année de congés et ses chiffres.',
  // carry-over
  'help.guide.carry-over.title': 'Reporter les jours non pris',
  'help.guide.carry-over.goal': "Reporter sur la période suivante ce qui reste à la fin d'une période.",
  'help.guide.carry-over.step.1': 'Ouvrez les Paramètres.',
  'help.guide.carry-over.step.2': 'Activez « Report ».',
  'help.guide.carry-over.result': "Le report est recalculé sur l'ensemble de vos années et affiché sous les droits.",
  'help.guide.carry-over.tip.1': 'Désactiver cette option remet tous les soldes reportés à zéro.',
  // invite
  'help.guide.invite.title': 'Planifier à plusieurs',
  'help.guide.invite.goal':
    'Fusionner votre planning avec celui d’un autre utilisateur TREK pour voir vos congés à tous les deux dans une seule grille.',
  'help.guide.invite.step.1': 'Cliquez sur l’icône de personne dans la carte « Personnes ».',
  'help.guide.invite.step.2': "Choisissez l’utilisateur et cliquez sur « Envoyer l'invitation ».",
  'help.guide.invite.step.3':
    'La personne reçoit une notification et une « Demande de fusion » à sa prochaine ouverture de Vacances. En attendant, l’invitation apparaît comme en attente ; survolez-la pour l’annuler.',
  'help.guide.invite.result':
    "Vos deux plannings fusionnent : chaque personne a sa couleur, vous pouvez poser des jours l'un pour l'autre et tout se synchronise en temps réel.",
  'help.guide.invite.tip.1':
    'Pour annuler une fusion, cliquez sur « Dissoudre » dans « Paramètres ». Les entrées de chacun retournent dans son propre planning.',
  'help.guide.invite.tip.2':
    "Si l'autre personne doit seulement voir vos jours, partagez votre calendrier plutôt que de fusionner.",
  // share-calendar
  'help.guide.share-calendar.title': 'Partager votre calendrier en lecture seule',
  'help.guide.share-calendar.goal': 'Permettre à quelqu’un de voir vos absences sans pouvoir modifier votre planning.',
  'help.guide.share-calendar.step.1': 'Cliquez sur l’icône de partage dans la carte « Calendriers partagés ».',
  'help.guide.share-calendar.step.2':
    'Choisissez l’utilisateur et cliquez sur « Partager ». Aucune acceptation n’est nécessaire.',
  'help.guide.share-calendar.step.3':
    'Les calendriers partagés avec vous apparaissent en haut de la carte : cliquez sur l’un d’eux pour le masquer ou l’afficher, ou survolez-le et cliquez sur le x pour le retirer. Sous « Vous partagez avec », survolez un nom et cliquez sur « Arrêter le partage ».',
  'help.guide.share-calendar.result':
    'Vos congés apparaissent sous forme d’anneau coloré sur sa grille. La personne ne peut rien modifier de ce que vous partagez.',
  'help.guide.share-calendar.tip.1':
    "Partage et fusion sont indépendants : vous pouvez fusionner avec une personne et partager avec d'autres.",
  'help.guide.share-calendar.tip.2':
    "Survolez un jour entouré d'un anneau pour voir qui est absent et pour combien de temps.",

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas', // same-as-en
  'help.ctx.atlas.summary':
    "L'Atlas affiche sur une carte du monde les endroits où vous avez voyagé : chaque pays où un voyage vous a mené est coloré, et vous pouvez ajouter manuellement les pays visités avant d'utiliser TREK. Zoomez pour voir les régions, tenez une bucket list des lieux que vous voulez encore découvrir et consultez vos chiffres dans le panneau translucide en bas.",
  'help.ctx.atlas.bullet.1':
    'La carte : chaque pays visité a sa propre couleur fixe, les pays prévus ont un contour en pointillés, ceux de la bucket list sont hachurés, et tous les autres sont gris. Survolez un pays pour voir ses voyages, ses lieux, et vos première et dernière visites.',
  'help.ctx.atlas.bullet.2':
    'La recherche en haut : saisissez un pays ou un lieu. Pour un pays où vous n’êtes pas allé, sa fenêtre s’ouvre. Pour un pays où vous êtes allé, sa fiche apparaît dans le panneau. Si vous choisissez un lieu, la carte affiche sa région pour que vous puissiez la marquer.',
  'help.ctx.atlas.bullet.3':
    '« Afficher les pays prévus », en haut à droite : affiche les pays de vos prochains voyages. L’interrupteur n’apparaît que si vous en avez.',
  'help.ctx.atlas.bullet.4':
    'Panneau du bas : l’onglet « Statistiques » avec les pays (et à côté ceux qui sont prévus), les régions, les voyages, les lieux, les villes, les jours, les continents, votre série et les voyages de l’année ; l’onglet Bucket List avec les lieux que vous voulez encore découvrir ; avec l’extension Sorties, un onglet « Sorties » avec la distance et le dénivelé des sorties effectuées.',
  'help.ctx.atlas.bullet.5':
    'Régions : en zoomant suffisamment, la carte affiche les États et les provinces. Cliquez sur l’un d’eux pour le marquer, le démarquer ou l’ajouter à la bucket list.',
  'help.ctx.atlas.bullet.6':
    'Dawarich : si l’extension est connectée, un panneau à gauche des statistiques coche des envies et ajoute des pays à partir de vos enregistrements, uniquement après votre confirmation.',
  // mark-country
  'help.guide.mark-country.title': 'Marquer un pays comme visité',
  'help.guide.mark-country.goal':
    "Ajouter un pays visité avant d'utiliser TREK, pour qu'il apparaisse sur la carte et dans votre total.",
  'help.guide.mark-country.step.1': 'Saisissez le pays dans le champ de recherche en haut de la carte.',
  'help.guide.mark-country.step.2':
    "Choisissez-le dans la liste. La carte se centre sur le pays et une fenêtre s'ouvre.",
  'help.guide.mark-country.step.3': 'Choisissez « Marquer comme visité ».',
  'help.guide.mark-country.result':
    'Le pays prend une couleur sur la carte et le compteur « Pays » augmente d’une unité. Cette couleur est définitive : quand vous marquez d’autres pays, la couleur des autres ne change pas.',
  'help.guide.mark-country.tip.1':
    'Cliquer sur un pays gris de la carte ouvre la même fenêtre. Pour les petits pays, la recherche est plus fiable.',
  'help.guide.mark-country.tip.2':
    "Un pays marqué manuellement compte toujours comme visité, quelles que soient les dates des voyages qui s'y rendent.",
  // unmark-country
  'help.guide.unmark-country.title': 'Retirer un pays marqué',
  'help.guide.unmark-country.goal': 'Retirer de la carte un pays que vous avez marqué manuellement.',
  'help.guide.unmark-country.step.1':
    "Recherchez le pays et sélectionnez-le, ou cliquez dessus sur la carte. Pour un pays que vous avez marqué vous-même, la fenêtre vous demande s'il faut le retirer.",
  'help.guide.unmark-country.step.2': 'Confirmez avec « Retirer ».',
  'help.guide.unmark-country.result': 'Le pays redevient gris et n’est plus compté.',
  'help.guide.unmark-country.tip.1':
    'Seuls les pays marqués à la main peuvent être retirés ainsi. Un pays qui a des voyages ou des lieux reste marqué tant que ces voyages ou lieux existent. Pour un pays marqué à la main, « Retirer » figure aussi dans sa fiche, dans le panneau.',
  // country-details
  'help.guide.country-details.title': 'Voir ce que vous avez fait dans un pays',
  'help.guide.country-details.goal': 'Ouvrir un pays visité et accéder aux voyages qui vous y ont menés.',
  'help.guide.country-details.step.1':
    'Saisissez un pays que vous avez visité dans le champ de recherche en haut de la carte.',
  'help.guide.country-details.step.2':
    'Sélectionnez-le. La carte se centre dessus, et une fiche apparaît dans le panneau du bas. Elle affiche le drapeau du pays, des badges pour ses lieux, ses voyages et les régions visitées, et une pastille pour chacun de ses trois premiers voyages.',
  'help.guide.country-details.result': "Cliquez sur la pastille d'un voyage pour l'ouvrir dans le planificateur.",
  'help.guide.country-details.tip.1':
    "Au survol du pays sur la carte, les mêmes chiffres s'affichent, ainsi que la première et la dernière visite.",
  // planned-countries
  'help.guide.planned-countries.title': 'Afficher les pays où vous allez',
  'help.guide.planned-countries.goal':
    'Afficher sur la carte les pays de vos prochains voyages sans les compter comme visités.',
  'help.guide.planned-countries.step.1':
    'Activez « Afficher les pays prévus », en haut à droite. Le chiffre à côté indique le nombre de pays prévus.',
  'help.guide.planned-countries.step.2':
    "Recherchez un pays prévu et sélectionnez-le : le panneau indique « Prévu » et l'infobulle de la carte affiche la date de votre départ.",
  'help.guide.planned-countries.result':
    "Les pays prévus ont un contour en pointillés, pour ne jamais être confondus avec des pays déjà visités. L'interrupteur mémorise votre choix.",
  'help.guide.planned-countries.tip.1':
    "Un pays compte comme visité dès que le voyage qui s'y rend a commencé, y compris s'il est en cours. Les voyages sans dates ne sont pas du tout pris en compte dans les statistiques.",
  'help.guide.planned-countries.tip.2': "L'interrupteur n'apparaît que si vous avez des voyages à venir.",
  // regions
  'help.guide.regions.title': 'Marquer une région',
  'help.guide.regions.goal':
    'Marquer les États, provinces ou préfectures où vous êtes allé, et pas seulement les pays.',
  'help.guide.regions.step.1':
    'Zoomez sur un pays jusqu’à voir apparaître les frontières de ses États et provinces. Si vous recherchez le pays et le sélectionnez, la carte zoome suffisamment.',
  'help.guide.regions.step.2':
    'Cliquez sur une région. Son nom s’affiche au survol. La fenêtre affiche la région et son pays.',
  'help.guide.regions.step.3': 'Choisissez « Marquer comme visité ».',
  'help.guide.regions.result':
    "La région prend la couleur du pays. Marquer une région compte aussi le pays comme visité, s'il ne l'était pas déjà.",
  'help.guide.regions.tip.1':
    "Quand vous cliquez sur une région visitée, « Retirer » vous est proposé, que vous l'ayez marquée vous-même ou qu'elle ait été ajoutée à cause d'un lieu.",
  'help.guide.regions.tip.2':
    "Les régions où se trouvent vos lieux réels sont marquées automatiquement. Vous n'avez rien à faire.",
  // search-place
  'help.guide.search-place.title': 'Trouver un lieu et marquer sa région',
  'help.guide.search-place.goal':
    'Marquer la Bavière en cherchant Munich, sans savoir dans quelle région se trouve la ville.',
  'help.guide.search-place.step.1':
    'Saisissez une ville, un monument ou une adresse dans le champ de recherche. Les pays s’affichent en premier ; les lieux correspondants apparaissent en dessous, sous « Lieux ».',
  'help.guide.search-place.step.2':
    'Sélectionnez le lieu. La carte se centre dessus et identifie la région où il se trouve.',
  'help.guide.search-place.step.3':
    "Choisissez « Marquer comme visité » pour cette région, ou « Ajouter à la bucket list » si vous n'y êtes pas encore allé.",
  'help.guide.search-place.result':
    "La région est marquée, ainsi que le pays. Pour les pays dont la carte ne contient pas de données régionales, c'est le pays lui-même qui est marqué.",
  'help.guide.search-place.tip.1':
    'Les lieux proviennent de la même recherche que partout ailleurs dans TREK : ils utilisent donc le fournisseur configuré par votre administrateur.',
  // bucket-country
  'help.guide.bucket-country.title': 'Ajouter un pays à la bucket list',
  'help.guide.bucket-country.goal': 'Tenir sur la carte une liste de pays à découvrir, distincte des pays visités.',
  'help.guide.bucket-country.step.1': 'Recherchez le pays et sélectionnez-le, ou cliquez dessus sur la carte.',
  'help.guide.bucket-country.step.2': 'Choisissez « Ajouter à la bucket list ».',
  'help.guide.bucket-country.step.3':
    'Indiquez un mois et une année si vous savez déjà quand, puis validez avec « Ajouter à la bucket list ».',
  'help.guide.bucket-country.result':
    "Le pays s'affiche avec des hachures dans la couleur qu'il prendra une fois visité, et il apparaît dans l'onglet « Bucket List » du panneau.",
  'help.guide.bucket-country.tip.1':
    'Une fois le pays dans la liste, la même fenêtre propose « Retirer de la bucket list ».',
  'help.guide.bucket-country.tip.2':
    'Une entrée par date visée : un même pays peut figurer dans la liste pour deux mois différents, mais pas deux fois pour le même mois.',
  // bucket-place
  'help.guide.bucket-place.title': 'Ajouter un lieu à la bucket list',
  'help.guide.bucket-place.goal':
    'Enregistrer une ville, un site ou une adresse que vous voulez découvrir, avec ses coordonnées et une date cible.',
  'help.guide.bucket-place.step.1': 'Ouvrez l’onglet Bucket List dans le panneau du bas.',
  'help.guide.bucket-place.step.2': 'Cliquez sur « Ajouter un lieu ».',
  'help.guide.bucket-place.step.3':
    'Saisissez le nom et cliquez sur le bouton de recherche, puis choisissez le bon résultat pour que le lieu ait des coordonnées. Vous pouvez aussi saisir un nom sans lancer la recherche.',
  'help.guide.bucket-place.step.4': 'Indiquez un mois et une année si vous le souhaitez, puis cliquez sur « Ajouter ».',
  'help.guide.bucket-place.result':
    'Le lieu apparaît en haut de votre bucket list avec sa date cible. Survolez-le pour afficher le × qui permet de le retirer.',
  'help.guide.bucket-place.tip.1':
    'Dawarich ne peut cocher une envie plus tard que si elle a des coordonnées. Il le fait dès que vos enregistrements montrent que vous y êtes allé.',
  // stats
  'help.guide.stats.title': 'Consulter vos statistiques',
  'help.guide.stats.goal': 'Comprendre ce que comptent les chiffres du panneau, et ce qu’ils ne comptent pas.',
  'help.guide.stats.step.1':
    '« Pays » indique le nombre de pays différents où vous êtes réellement allé. Les pays prévus s’affichent sous ce chiffre sans y être comptés. « Régions » compte les États et provinces où vous êtes allé. « Voyages », « Lieux » et « Jours » sont des totaux sur l’ensemble de vos voyages. « Villes » est déduit des adresses de vos lieux : c’est donc une estimation.',
  'help.guide.stats.step.2':
    'Les continents indiquent le nombre de pays visités par continent. L’Antarctique n’apparaît dans la rangée qu’une fois visité. Viennent ensuite votre série (années consécutives avec au moins un voyage) et le nombre de voyages de l’année en cours.',
  'help.guide.stats.result':
    "Les chiffres se mettent à jour automatiquement au fil de vos voyages. Vous n'avez rien à tenir à jour ici.",
  'help.guide.stats.tip.1':
    "Les villes sont déduites du texte de l'adresse, sans recherche. Une adresse courte comme « Osteria Francescana, Italy », ou qui se termine par une préfecture, peut donc être comptée comme une région plutôt que comme une ville.",
  'help.guide.stats.tip.2':
    "Les pays marqués manuellement comptent dans « Pays » et dans les continents, mais n'ajoutent ni voyages, ni lieux, ni jours.",
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Ajouter des pays à partir de vos enregistrements',
  'help.guide.dawarich-countries.goal':
    'Utiliser Dawarich pour savoir dans quels pays vous êtes allé au cours de l’année écoulée, et ajouter à la carte ceux que vous confirmez.',
  'help.guide.dawarich-countries.step.1':
    'Quand l’extension Dawarich est connectée, un panneau Dawarich à deux tuiles apparaît en bas de la carte, à gauche des statistiques. Cliquez sur « Pays ».',
  'help.guide.dawarich-countries.step.2':
    'La boîte de dialogue s’ouvre sur son onglet « Pays ». Cliquez sur « Rechercher des pays » : TREK lit les pays et villes couverts par vos enregistrements des 12 derniers mois, mois par mois, ce qui peut prendre un moment. Chaque pays absent de votre Atlas est listé avec son drapeau, son nombre de villes et le nom de la première ville. Chaque pays est coché par défaut. Cliquez sur une ligne pour l’exclure.',
  'help.guide.dawarich-countries.step.3':
    'Validez avec le bouton en bas à droite, qui affiche « Ajouter 5 pays » quand cinq lignes sont cochées. La fenêtre indique combien de pays ont été ajoutés. Quand vous la fermez, la carte est déjà à jour.',
  'help.guide.dawarich-countries.result':
    'Les pays confirmés sont colorés sur la carte et comptés dans « Pays », avec Dawarich comme source. Les pays que vous avez marqués manuellement ne changent pas.',
  'help.guide.dawarich-countries.tip.1':
    "Les pays que l'Atlas affiche déjà comme visités, manuellement, par un voyage ou lors d'une vérification précédente, sont ignorés : vos propres marquages ne changent donc jamais. Un pays que vous aviez retiré de l'Atlas est de nouveau ajouté si vous le confirmez ici.",
  'help.guide.dawarich-countries.tip.2':
    "Si TREK ne parvient pas à reconnaître un nom de pays, ce nom est listé sous les lignes au lieu d'être ignoré. « Vérifier à nouveau » interroge de nouveau Dawarich. La note sous la liste indique que les 12 derniers mois ont été vérifiés. Cette période n'est pas modifiable.",
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Cocher des envies grâce à vos enregistrements',
  'help.guide.dawarich-wishes.goal':
    'Découvrir quels lieux de votre bucket list vous avez réellement visités, et les marquer comme atteints avec la date correspondante.',
  'help.guide.dawarich-wishes.step.1':
    'Dans le panneau Dawarich en bas de la carte, à gauche des statistiques, cliquez sur « Liste d’envies ».',
  'help.guide.dawarich-wishes.step.2':
    "La fenêtre s'ouvre sur l'onglet « Liste d’envies ». Cliquez sur « Vérifier la liste de souhaits » : TREK parcourt vos enregistrements pour chaque entrée qui possède des coordonnées. Chaque envie atteinte s'affiche avec la distance à laquelle vous vous en êtes approché, la durée sur place et le jour, et elle est cochée par défaut. Celles déjà cochées indiquent « Déjà coché ». Sous la liste, une note indique le nombre d'entrées sans coordonnées et rappelle la règle : une envie compte comme atteinte à moins de 250 m et après 20 minutes sur place.",
  'help.guide.dawarich-wishes.step.3':
    "Validez avec le bouton en bas à droite, qui affiche « Cocher 2 » quand deux lignes sont cochées. Fermez ensuite la fenêtre et ouvrez l'onglet « Bucket List » du panneau voisin.",
  'help.guide.dawarich-wishes.result':
    'Chaque envie reçoit une coche verte avec la date du séjour, et non celle du jour. Son infobulle indique « Coché à partir de vos enregistrements Dawarich ». Cliquez sur la date pour annuler.',
  'help.guide.dawarich-wishes.tip.1':
    "Passer à proximité ne suffit pas : vous devez être près du lieu et y rester un certain temps. Si plusieurs séjours remplissent les conditions, c'est le plus long qui est retenu. Une envie sans coordonnées ne peut pas être vérifiée : ajoutez donc les lieux via la recherche dans « Ajouter un lieu », et pas seulement par leur nom.",
  'help.guide.dawarich-wishes.tip.2':
    'Une vérification examine jusqu’à 50 entrées, en commençant par celles qui ne sont pas encore cochées. S’il y en a davantage, TREK vous le signale. Une envie déjà cochée conserve sa propre date.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Collections', // same-as-en
  'help.ctx.collections.summary':
    'Collections est votre bibliothèque en dehors de tout voyage : des listes nommées de lieux que vous avez repérés et voulez garder, chacun avec un statut « Idée », « À visiter » ou « Visité » et, si Sorties est activé, des sorties entières conservées depuis un voyage. Lieux et sorties sont copiés vers et depuis les voyages, jamais liés : une liste et un voyage ne se modifient donc jamais l’un l’autre.',
  'help.ctx.collections.bullet.1':
    'La colonne des listes, à gauche, affiche vos propres listes, celles partagées avec vous, les invitations en attente de réponse et « Tous les enregistrés », qui réunit le contenu de toutes les listes qui vous appartiennent. « Nouvelle liste » et l’import de fichier se trouvent en haut.',
  'help.ctx.collections.bullet.2':
    'L’en-tête de la liste ouverte affiche sa couleur, sa couverture, sa description et ses liens, les membres et, à droite, « Modifier » (propriétaire uniquement), « Exporter » et « Partager ». Sur une liste partagée avec vous, le bouton « Partager » affiche « Partagée ».',
  'help.ctx.collections.bullet.3':
    'La rangée de filtres au-dessus des lieux : le + pour ajouter un lieu, les listes déroulantes « Statut », « Catégorie », « Note » et « Trier », l’icône de case à cocher pour « Choisir » et l’icône de nuage pour « Importer depuis un voyage ». Le filtre par libellé n’apparaît dans cette rangée que si aucune carte n’est affichée.',
  'help.ctx.collections.bullet.4':
    'Les lignes de lieux : photo, nom et adresse, libellés et catégorie, et la pastille de statut à droite. Un clic sur la pastille la fait passer au statut suivant.',
  'help.ctx.collections.bullet.5':
    'La carte à droite : une épingle pour chaque lieu doté de coordonnées. Sa barre supérieure contient « Agrandir la carte » (« Afficher la liste » une fois la carte en plein écran), le filtre par libellé avec le bouton de gestion des libellés, et le champ « Rechercher des lieux ». Cliquez sur une épingle pour ouvrir le lieu.',
  'help.ctx.collections.bullet.6':
    'La fiche détaillée : cliquez sur une ligne pour afficher la couverture, la catégorie, le statut, la note en étoiles, les libellés, la description et les liens. L’appareil photo sur la couverture permet de changer la photo. En bas se trouvent « Modifier », « Copier vers un voyage », le bouton de navigation et « Retirer de la liste ».',
  // create-list
  'help.guide.create-list.title': 'Créer une liste',
  'help.guide.create-list.goal':
    'Créer une liste avec un nom, une couleur et une couverture, prête à accueillir des lieux.',
  'help.guide.create-list.step.1': 'Cliquez sur « Nouvelle liste » en haut de la colonne des listes.',
  'help.guide.create-list.step.2':
    "Donnez un nom à la liste et choisissez une couleur. L'image de couverture, la description et les liens sont facultatifs : vous pourrez les ajouter plus tard avec « Modifier ».",
  'help.guide.create-list.step.3': 'Cliquez sur « Créer ».',
  'help.guide.create-list.result':
    'La liste s’ouvre vide, avec deux moyens de la remplir : « Ajouter un lieu » et « Importer depuis un voyage ».',
  'help.guide.create-list.tip.1':
    'La couverture peut être une image que vous importez ou une photo trouvée via la recherche Unsplash, dans la même boîte de dialogue.',
  // add-place
  'help.guide.add-place.title': 'Ajouter un lieu',
  'help.guide.add-place.goal':
    "Trouver un lieu et l'enregistrer dans la liste ouverte, avec nom, catégorie, statut et notes, en une seule étape.",
  'help.guide.add-place.step.1':
    'Cliquez sur le + au début de la rangée de filtres au-dessus des lieux. Sur une liste encore vide, cliquez sur « Ajouter un lieu » au centre de la page.',
  'help.guide.add-place.step.2':
    "Saisissez le lieu dans le champ de recherche et choisissez un résultat. Le nom, l'adresse et les coordonnées sont remplis à partir du résultat.",
  'help.guide.add-place.step.3':
    'Définissez le statut et, si vous le souhaitez, une catégorie, une description et des liens, puis cliquez sur « Ajouter ». La fenêtre reste ouverte pour le lieu suivant. « Annuler » la ferme.',
  'help.guide.add-place.result':
    'Le lieu apparaît dans la liste et, s’il a des coordonnées, sous forme d’épingle sur la carte.',
  'help.guide.add-place.tip.1':
    'Depuis un voyage, « Enregistrer dans une collection », dans la fiche d’un lieu ou dans son menu, ajoute un lieu du voyage à une liste sans quitter le voyage.',
  'help.guide.add-place.tip.2':
    'La liste doit vous appartenir, ou vous devez en être éditeur ou administrateur ; le + n’apparaît ni dans « Tous les enregistrés » ni sur une liste que vous pouvez seulement consulter.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importer les lieux d’un voyage',
  'help.guide.import-from-trip.goal':
    "Ajouter d'un coup tous les lieux d'un voyage à une liste, sans les enregistrer un par un.",
  'help.guide.import-from-trip.step.1':
    "Cliquez sur le bouton d'import, avec le nuage et la flèche, dans la ligne des filtres. Sur une liste vide, ce bouton se trouve à côté de « Ajouter un lieu ».",
  'help.guide.import-from-trip.step.2': "Choisissez l'un de vos voyages.",
  'help.guide.import-from-trip.step.3':
    'Cochez les lieux voulus. Ceux qui figurent déjà dans la liste sont grisés. Au départ, les lieux qui ne sont sur aucun jour du voyage sont sélectionnés ; si tous les lieux sont déjà sur un jour, tous les nouveaux lieux sont sélectionnés. « Nouveaux seulement » masque les lieux que la liste contient déjà.',
  'help.guide.import-from-trip.step.4':
    'Cliquez sur « Importer ». Le bouton indique toujours combien de lieux vont être ajoutés.',
  'help.guide.import-from-trip.result':
    'Les lieux sont copiés dans la liste avec leur nom, leur adresse, leurs coordonnées, leur description et leur catégorie. Le voyage n’est pas modifié.',
  'help.guide.import-from-trip.tip.1':
    'TREK ignore automatiquement les doublons par nom ou par coordonnées : vous pouvez importer deux fois sans risque.',
  'help.guide.import-from-trip.tip.2':
    'Dans la liste des lieux d’un voyage, le mode sélection propose plutôt « Enregistrer dans une collection » pour une sélection de lieux choisis un par un.',
  // place-status
  'help.guide.place-status.title': 'Définir le statut d’un lieu',
  'help.guide.place-status.goal':
    'Distinguer les simples idées, les lieux présélectionnés et ceux où vous êtes déjà allé.',
  'help.guide.place-status.step.1':
    "Cliquez sur la pastille de statut à droite d'une ligne de lieu. « Idée » devient « À visiter ».",
  'help.guide.place-status.step.2': 'Cliquez de nouveau pour « Visité », puis encore une fois pour revenir à « Idée ».',
  'help.guide.place-status.result':
    'La pastille et sa couleur changent immédiatement, et les compteurs du filtre de statut au-dessus de la liste se mettent à jour.',
  'help.guide.place-status.tip.1':
    "Le statut n'existe que dans les Collections. Quand vous copiez un lieu dans un voyage, son statut n'est pas copié.",
  'help.guide.place-status.tip.2':
    'Depuis un voyage, « Enregistrer dans une collection » ouvre « Enregistrer dans une liste » avec une pastille de statut pour chaque liste qui contient le lieu, et la barre de sélection du panneau des lieux propose « Marquer comme visité dans vos listes ».',
  // place-detail
  'help.guide.place-detail.title': 'Ouvrir un lieu enregistré',
  'help.guide.place-detail.goal':
    'Tout savoir sur un lieu et voir ce que vous pouvez en faire : le modifier, le copier vers un voyage, trouver l’itinéraire, le retirer.',
  'help.guide.place-detail.step.1':
    'Cliquez sur la ligne d’un lieu. Sa fiche s’ouvre à côté de la liste et la carte se centre sur le lieu.',
  'help.guide.place-detail.step.2':
    'En bas se trouvent « Modifier », « Copier vers un voyage », le bouton de navigation qui ouvre le lieu dans une application de cartographie, et « Retirer de la liste ». L’appareil photo sur la couverture remplace la photo automatique par l’une des vôtres.',
  'help.guide.place-detail.result':
    "Avec « Modifier », vous pouvez changer le nom, la catégorie, les libellés, l'adresse, les coordonnées, la description et les liens directement dans la fiche.",
  'help.guide.place-detail.tip.1':
    'La couverture est récupérée automatiquement quand le lieu n’a pas sa propre image. Votre image peut être au format JPG, PNG, GIF, WebP ou HEIC, jusqu’à 20 Mo. L’icône de corbeille à côté de l’appareil photo rétablit la photo automatique.',
  'help.guide.place-detail.tip.2':
    'Chaque membre, vous compris, peut attribuer une note en étoiles sous le statut ; le filtre « Note » de la rangée de filtres utilise la moyenne.',
  // labels
  'help.guide.labels.title': 'Regrouper des lieux avec des libellés',
  'help.guide.labels.goal':
    'Donner à une liste ses propres libellés, par exemple des quartiers ou des jours, en plus des catégories communes.',
  'help.guide.labels.step.1':
    'Cliquez sur « Ajouter un libellé » à côté des libellés au-dessus de la carte (« Gérer les libellés » dès que la liste en a). Si aucune carte n’est affichée, le bouton se trouve au bout de la rangée de filtres.',
  'help.guide.labels.step.2':
    'Saisissez un nom, choisissez une couleur et cliquez sur « Ajouter un libellé ». Vous pouvez renommer, recolorer ou supprimer les libellés existants dans la même fenêtre.',
  'help.guide.labels.step.3':
    'Activez « Choisir », cochez les lieux et cliquez sur « Attribuer un libellé » dans la barre de sélection, puis choisissez les libellés et validez avec « Attribuer un libellé ». Pour un seul lieu, vous pouvez aussi ajouter des libellés via « Modifier » dans sa fiche.',
  'help.guide.labels.step.4':
    'Cliquez sur un ou plusieurs libellés au-dessus de la carte pour n’afficher, dans la liste et sur la carte, que les lieux qui portent au moins l’un d’eux. Cliquez de nouveau sur un libellé pour le retirer du filtre.',
  'help.guide.labels.result':
    'Les lieux libellés affichent leurs libellés sur leur ligne ; le filtre par libellé est disponible pour tous les membres, lecteurs compris.',
  'help.guide.labels.tip.1':
    'Les libellés appartiennent à la liste où ils ont été créés. Si vous déplacez un lieu vers une autre liste, ses libellés sont supprimés.',
  'help.guide.labels.tip.2': 'Gérer et attribuer des libellés nécessite des droits de modification sur la liste.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrer et sélectionner des lieux',
  'help.guide.filter-select.goal': 'Filtrer la liste et modifier plusieurs lieux à la fois.',
  'help.guide.filter-select.step.1':
    'Utilisez les listes déroulantes de la rangée de filtres : statut, catégorie, note minimale et ordre de tri. Le statut et la catégorie indiquent le nombre de lieux correspondant à chaque choix.',
  'help.guide.filter-select.step.2':
    'Cliquez sur l’icône de case à cocher, « Choisir », après les listes déroulantes. Chaque ligne reçoit une case à cocher et une barre de sélection apparaît.',
  'help.guide.filter-select.step.3':
    'Cochez des lieux ou utilisez « Tout sélectionner » pour tous les lieux affichés par le filtre, puis choisissez « Attribuer un libellé », « Déplacer vers une liste », « Dupliquer dans une liste », « Copier vers un voyage » ou « Supprimer ». Seul le propriétaire ou un administrateur de la liste peut déplacer et supprimer.',
  'help.guide.filter-select.result':
    "Les actions s'appliquent à toute la sélection d'un coup. Le × à droite quitte le mode sélection.",
  'help.guide.filter-select.tip.1':
    '« Tout sélectionner » ne sélectionne que les lieux qui correspondent au filtre. Pour agir sur tous vos lieux « À visiter », filtrez sur « À visiter » puis cliquez sur « Tout sélectionner ».',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copier des lieux dans un voyage',
  'help.guide.copy-to-trip.goal': 'Ajouter des lieux enregistrés comme étapes à l’un de vos voyages.',
  'help.guide.copy-to-trip.step.1':
    'Activez « Choisir » et cochez les lieux, ou ouvrez un lieu et utilisez « Copier vers un voyage » dans sa fiche.',
  'help.guide.copy-to-trip.step.2': 'Cliquez sur « Copier vers un voyage » dans la barre de sélection.',
  'help.guide.copy-to-trip.step.3':
    'Choisissez le voyage. Utilisez le champ de recherche pour filtrer une longue liste.',
  'help.guide.copy-to-trip.result':
    'Les lieux sont ajoutés à la liste des lieux de ce voyage, avec leur nom, leur description, leur catégorie, leurs notes, leur prix, leurs coordonnées, leur photo et leurs tags. Rien ne change dans la collection.',
  'help.guide.copy-to-trip.tip.1':
    "Les lecteurs d'une liste partagée peuvent aussi le faire. Les lieux sont copiés depuis la liste, qui reste inchangée.",
  // share-list
  'help.guide.share-list.title': 'Partager une liste',
  'help.guide.share-list.goal': 'Préparer une liste à plusieurs avec d’autres utilisateurs de ce TREK, en temps réel.',
  'help.guide.share-list.step.1': 'Cliquez sur « Partager » dans l’en-tête de votre liste.',
  'help.guide.share-list.step.2': "Choisissez l'utilisateur et un rôle : Lecteur, Éditeur ou Admin.",
  'help.guide.share-list.step.3':
    'Cliquez sur « Envoyer l’invitation ». La personne apparaît en attente jusqu’à ce qu’elle accepte l’invitation dans sa colonne des listes ou depuis la notification.',
  'help.guide.share-list.result':
    "Une fois l'invitation acceptée, la liste apparaît pour la personne sous « Partagée », et chaque modification se synchronise en temps réel. Vous pouvez toujours modifier les membres et leurs rôles dans la même fenêtre.",
  'help.guide.share-list.tip.1':
    'Les lecteurs peuvent consulter, noter et copier des lieux dans leurs propres voyages. Les éditeurs ajoutent et modifient lieux et libellés. Les administrateurs peuvent aussi déplacer et supprimer.',
  'help.guide.share-list.tip.2':
    'Seul le propriétaire peut inviter et retirer des personnes. Un membre peut quitter lui-même une liste partagée.',
  // export-list
  'help.guide.export-list.title': 'Exporter une liste dans un fichier',
  'help.guide.export-list.goal':
    'Transmettre une liste à quelqu’un qui utilise un autre serveur TREK, ou l’ouvrir dans une application de cartographie.',
  'help.guide.export-list.step.1': 'Cliquez sur « Exporter » dans l’en-tête de la liste.',
  'help.guide.export-list.step.2':
    'Choisissez « Liste TREK » pour utiliser la liste dans un autre TREK, avec libellés et statuts, ou GPX pour OsmAnd, Organic Maps, un Garmin et les autres applications qui lisent les points de passage.',
  'help.guide.export-list.result': "Le fichier est téléchargé. Tout membre d'une liste partagée peut l'exporter.",
  'help.guide.export-list.tip.1':
    'Un lieu sans coordonnées ne peut pas devenir un waypoint GPX : il est ignoré, et TREK vous indique combien de lieux sont concernés.',
  'help.guide.export-list.tip.2':
    'Les avis, les membres et les photos importées ne sont volontairement pas exportés : ils appartiennent à cette instance TREK, pas à la liste.',
  // import-file
  'help.guide.import-file.title': 'Importer une liste depuis un fichier',
  'help.guide.import-file.goal':
    'Importer un fichier de liste TREK ou un fichier GPX, comme nouvelle liste ou dans une liste existante.',
  'help.guide.import-file.step.1':
    'Cliquez sur le bouton d’import à flèche montante, à côté de « Nouvelle liste », dans la colonne des listes.',
  'help.guide.import-file.step.2':
    'Choisissez le fichier. Avant toute importation, TREK affiche son contenu : le nom, le nombre de lieux et de libellés.',
  'help.guide.import-file.step.3':
    'Gardez « Nouvelle liste » et changez le nom si vous le souhaitez, puis cliquez sur « Importer ». Vous pouvez aussi choisir « Ajouter à une liste » pour placer les lieux dans une liste que vous pouvez modifier, puis cliquer sur « Ajouter à la liste ».',
  'help.guide.import-file.result':
    "La liste s'ouvre avec les lieux importés. Un import dans une liste ne fait qu'ajouter des lieux. Ceux qui y figurent déjà conservent leur statut, leurs notes et leurs libellés.",
  'help.guide.import-file.tip.1':
    "Dans un fichier GPX, chaque waypoint nommé devient un lieu. Les traces sont des lignes et sont ignorées : l'aperçu indique combien de points cela représente.",
  'help.guide.import-file.tip.2':
    "Un fichier qui n'est ni une liste TREK ni un GPX est refusé, et TREK en indique la raison. Si un lieu ne peut pas être lu, seul ce lieu est ignoré, pas le fichier entier.",
  // edit-list
  'help.guide.edit-list.title': 'Modifier ou supprimer une liste',
  'help.guide.edit-list.goal':
    'Modifier le nom, la couleur, la couverture, la description ou les liens d’une liste, ou supprimer la liste.',
  'help.guide.edit-list.step.1':
    'Cliquez sur « Modifier » dans l’en-tête de la liste. Seul le propriétaire voit ce bouton.',
  'help.guide.edit-list.step.2':
    'Modifiez ce que vous voulez et cliquez sur « Enregistrer ». L’icône de corbeille en bas à gauche, « Supprimer la liste », supprime la liste et tous ses lieux après confirmation.',
  'help.guide.edit-list.result':
    "L'en-tête affiche immédiatement la nouvelle couleur, la nouvelle couverture et la nouvelle description.",
  'help.guide.edit-list.tip.1':
    'La suppression d’une liste est définitive. Exportez-la d’abord si vous voulez en garder une copie.',
  // all-saved
  'help.guide.all-saved.title': 'Rechercher dans toute votre bibliothèque',
  'help.guide.all-saved.goal': "Voir d'un coup les lieux de toutes vos listes.",
  'help.guide.all-saved.step.1':
    'Cliquez sur « Tous les enregistrés » dans la colonne des listes. Cette vue réunit les lieux de toutes les listes dont vous êtes propriétaire ou copropriétaire.',
  'help.guide.all-saved.step.2':
    'Tapez dans « Rechercher des lieux » au-dessus de la carte et utilisez les filtres comme sur n’importe quelle liste. « Choisir » fonctionne aussi ici : déplacer, dupliquer, copier vers un voyage ou supprimer, toutes listes confondues.',
  'help.guide.all-saved.result':
    "Cette vue regroupe tous vos lieux enregistrés. Vous ne pouvez pas y ajouter ni y importer de lieux, car il n'y a pas de liste unique à laquelle les ajouter.",
  'help.guide.all-saved.tip.1':
    'Les libellés et les sorties enregistrées sont propres à chaque liste : ni les uns ni les autres ne sont proposés dans « Tous les enregistrés ».',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journal de voyage',
  'help.ctx.journey.summary':
    'Journal de voyage est votre carnet de voyage centré sur les photos. Chaque journal est lié à un ou plusieurs voyages, et vous le remplissez jour après jour avec des entrées qui comportent un récit, des photos, une humeur et la météo. Cet écran liste vos journaux ; ouvrez-en un pour écrire.',
  'help.ctx.journey.bullet.1':
    'La bannière en haut affiche le journal en cours, ou le plus récent, avec son nombre d’entrées, de photos et de lieux. « Continuer à écrire » l’ouvre sur la journée d’aujourd’hui. Quand un voyage vient de se terminer, une bannière « Voyage terminé récemment » au-dessus propose d’en faire un journal.',
  'help.ctx.journey.bullet.2':
    'Sous « Tous les journaux », une carte par journal avec sa couverture, son statut, ses dates et ses compteurs ; le journal mis en avant dans la bannière n’y apparaît pas une deuxième fois. Cliquez sur une carte pour l’ouvrir.',
  'help.ctx.journey.bullet.3':
    'La dernière carte de la grille, « Créer un nouveau journal », crée un journal à partir de vos voyages.',
  // create-journey
  'help.guide.create-journey.title': 'Créer un journal',
  'help.guide.create-journey.goal':
    'Commencer un journal pour un voyage, avec les lieux du voyage déjà proposés en suggestions.',
  'help.guide.create-journey.step.1': 'Cliquez sur « Créer un nouveau journal », la dernière carte de la grille.',
  'help.guide.create-journey.step.2':
    'Donnez-lui un nom et, si vous le souhaitez, un sous-titre, puis cochez les voyages concernés. Le compteur indique combien de lieux seront ajoutés.',
  'help.guide.create-journey.step.3': 'Cliquez sur « Créer un journal ».',
  'help.guide.create-journey.result':
    "Le journal s'ouvre. Chaque lieu des voyages associés apparaît comme suggestion dans la chronologie, une fois pour chaque jour où il est prévu. Vous pouvez rédiger une entrée pour chacun.",
  'help.guide.create-journey.tip.1': 'Vous pourrez lier d’autres voyages plus tard depuis « Paramètres du journal ».',
  'help.guide.create-journey.tip.2':
    'Un journal sans voyage fonctionne aussi ; vous ajoutez alors les entrées à la main.',
  // open-journey
  'help.guide.open-journey.title': 'Ouvrir un journal',
  'help.guide.open-journey.goal': "Ouvrir un journal et savoir sur quelle page il s'ouvre.",
  'help.guide.open-journey.step.1':
    "Cliquez sur une carte. Chacune affiche la couverture, les dates, ainsi que le nombre d'entrées, de photos et de lieux du journal.",
  'help.guide.open-journey.result':
    'Un journal en cours s’ouvre sur la journée d’aujourd’hui, ou sur la dernière entrée précédente si rien n’est encore écrit pour aujourd’hui. Un journal terminé s’ouvre au début.',
  'help.guide.open-journey.tip.1':
    'La couverture est la première photo du journal, sauf si vous en définissez une dans « Paramètres du journal ».',
  // continue-writing
  'help.guide.continue-writing.title': 'Poursuivre le journal en cours',
  'help.guide.continue-writing.goal': 'Ouvrir directement la page du jour du journal en cours.',
  'help.guide.continue-writing.step.1':
    'Cliquez sur « Continuer à écrire » dans la bannière en haut. Elle affiche le journal en cours ou, à défaut, le plus récent.',
  'help.guide.continue-writing.result':
    "Le journal s'ouvre sur aujourd'hui, ou sur la dernière entrée avant aujourd'hui si rien n'est encore écrit.",
  'help.guide.continue-writing.tip.1':
    'Quand un voyage vient de se terminer, une bannière « Voyage terminé récemment » s’affiche au-dessus de celle-ci : « Créer un journal » crée un journal avec ce voyage coché, « Ignorer » masque la proposition dans ce navigateur.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Journal', // same-as-en
  'help.ctx.journey-detail.summary':
    'Un journal ouvert : la chronologie à gauche, jour par jour, et la carte à droite avec des couches activables pour le programme, vos enregistrements, les entrées et les photos. L’en-tête affiche les compteurs, Studio, l’interrupteur des suggestions et ⋯ pour « Paramètres du journal ». La barre d’outils en dessous permet d’ajouter des entrées.',
  'help.ctx.journey-detail.bullet.1':
    'L’en-tête : flèche de retour et badge de statut, couverture, titre et sous-titre, nombre de jours, de lieux, d’entrées et de photos, et à droite Studio, l’œil qui masque ou affiche les suggestions, et ⋯ pour « Paramètres du journal ».',
  'help.ctx.journey-detail.bullet.2':
    'La barre d’outils : onglets « Chronologie » et « Galerie », « Rechercher dans ce carnet » et « Ajouter une entrée ». Dans « Galerie », « Importer » remplace « Ajouter une entrée ».',
  'help.ctx.journey-detail.bullet.3':
    '« Chronologie » : une section par jour avec son numéro, le nombre de lieux et un + pour ajouter une entrée ce jour-là. En dessous, les cartes d’entrées avec photos, humeur, météo et récit, ainsi que les cartes de suggestion en pointillés issues des voyages, chacune avec un × pour l’écarter.',
  'help.ctx.journey-detail.bullet.4':
    'La carte : la barre des couches en haut active ou désactive « Prévu » (épingles creuses et itinéraires GPX en pointillés des voyages), « Enregistré » (trajets en trait continu issus de Dawarich), « Entrées » (épingles aux couleurs des jours, reliées dans l’ordre chronologique par une fine ligne en pointillés) et « Photos ». Le (i) à côté explique chaque symbole.',
  'help.ctx.journey-detail.bullet.5':
    '« Paramètres du journal » (⋯) : couverture, nom et sous-titre, statut, traces GPX, journées enregistrées, lieux tirés des photos, champs des entrées, suggestions écartées, voyages synchronisés, contributeurs et membres d’un voyage qui ont accès, partage public, archivage et suppression.',
  'help.ctx.journey-detail.bullet.6':
    'En bas d’une longue chronologie, vous trouvez « Revenir en haut », un compteur de jours qui permet d’aller à n’importe quel jour ou entrée, et « Aller à la dernière entrée ».',
  // add-entry
  'help.guide.add-entry.title': 'Rédiger une entrée',
  'help.guide.add-entry.goal': 'Ajouter le récit d’une journée avec un titre, un texte, une humeur et la météo.',
  'help.guide.add-entry.step.1':
    'Cliquez sur « Ajouter une entrée » dans la barre d’outils, ou sur le + tout à droite de l’en-tête d’un jour pour commencer directement ce jour-là.',
  'help.guide.add-entry.step.2':
    'Donnez un titre à l’entrée et rédigez votre texte. La barre d’outils au-dessus du texte ajoute gras, italique, titres, citations, liens et listes en Markdown.',
  'help.guide.add-entry.step.3':
    'Dans la colonne de droite, vérifiez la date et l’heure, cherchez un lieu ou utilisez votre position actuelle, et choisissez une humeur et la météo.',
  'help.guide.add-entry.step.4': 'Cliquez sur « Enregistrer ».',
  'help.guide.add-entry.result':
    "L'entrée apparaît à sa date dans la chronologie et sous forme de repère sur la carte. Les compteurs de l'en-tête se mettent à jour.",
  'help.guide.add-entry.tip.1':
    "Quand vous rédigez à partir d'une suggestion, vous utilisez le même éditeur, avec le lieu déjà renseigné.",
  'help.guide.add-entry.tip.2':
    "Une entrée associée à un lieu propose l’option « Exclure de l'itinéraire » : l’entrée reste dans le journal, mais elle n’est comptée ni dans la distance ni dans les pays, et n’apparaît pas sur la carte dans Studio.",
  // entry-photos
  'help.guide.entry-photos.title': 'Ajouter des photos et des vidéos à une entrée',
  'help.guide.entry-photos.goal': 'Ajouter des photos à une journée ; la première devient la couverture de l’entrée.',
  'help.guide.entry-photos.step.1': 'Ouvrez le menu d’une entrée avec ⋯ sur sa carte et choisissez « Modifier ».',
  'help.guide.entry-photos.step.2':
    'Cliquez sur « Téléverser des photos » et choisissez les fichiers. « Depuis la galerie » reprend des photos déjà présentes dans la galerie du journal ; « Photos externes » cherche les photos de ce jour dans une bibliothèque Immich ou Synology connectée.',
  'help.guide.entry-photos.step.3':
    'Survolez une photo et cliquez sur « Mettre en 1er » pour en faire la couverture, puis cliquez sur « Enregistrer ».',
  'help.guide.entry-photos.result':
    "Les photos s'affichent sur la carte et dans la galerie. La première sert de vignette partout.",
  'help.guide.entry-photos.tip.1':
    "Les vidéos s'ajoutent à une entrée de la même façon : mp4, m4v, webm ou mov, jusqu'à 500 Mo. Elles sont stockées telles quelles.",
  'help.guide.entry-photos.tip.2':
    "Les fichiers HEIC d'un iPhone sont convertis en JPEG à l'import, ce qui supprime leurs métadonnées GPS et d'appareil photo.",
  // suggestions
  'help.guide.suggestions.title': 'Utiliser ou écarter les suggestions',
  'help.guide.suggestions.goal':
    'Transformer les lieux de vos voyages en entrées, et écarter ceux dont vous ne parlerez pas.',
  'help.guide.suggestions.step.1':
    'Une suggestion est une carte à bordure en pointillés avec un bouton « Ajouter une entrée » : un lieu d’un voyage lié, au jour où il était prévu. Cliquez dessus pour ouvrir l’éditeur avec le lieu et le jour déjà renseignés.',
  'help.guide.suggestions.step.2':
    'Cliquez sur le × tout à droite d’une carte que vous n’utiliserez pas. La carte disparaît de la chronologie sans être supprimée, et la synchronisation du voyage ne la proposera plus.',
  'help.guide.suggestions.step.3':
    'Vous avez changé d’avis ? Ouvrez « Paramètres du journal » avec ⋯ dans l’en-tête : « Récupérer les suggestions écartées » indique leur nombre et les rétablit toutes.',
  'help.guide.suggestions.result':
    'La chronologie n’affiche que les entrées que vous voulez écrire. L’icône en forme d’œil dans l’en-tête masque toutes les suggestions d’un coup pendant votre lecture.',
  'help.guide.suggestions.tip.1': 'Un lieu prévu sur deux jours donne lieu à une suggestion pour chacun de ces jours.',
  'help.guide.suggestions.tip.2':
    'Les suggestions ne comptent jamais dans les statistiques, seules les entrées rédigées sont prises en compte.',
  // add-on-day
  'help.guide.add-on-day.title': 'Ajouter une entrée à une date passée',
  'help.guide.add-on-day.goal': 'Écrire sur une journée passée sans avoir à corriger la date ensuite.',
  'help.guide.add-on-day.step.1': 'Cliquez sur le + tout à droite de l’en-tête de ce jour.',
  'help.guide.add-on-day.step.2': "L'éditeur s'ouvre avec cette date. Rédigez et enregistrez comme d'habitude.",
  'help.guide.add-on-day.result': 'L’entrée est ajoutée immédiatement au bon jour.',
  'help.guide.add-on-day.tip.1':
    'Pour changer l’ordre au sein d’une journée, survolez une entrée : « Monter » et « Descendre » apparaissent à sa gauche.',
  // pros-cons
  'help.guide.pros-cons.title': 'Ajouter un verdict',
  'help.guide.pros-cons.goal': 'Résumer une journée par ce qui était génial et ce qui l’était moins.',
  'help.guide.pros-cons.step.1':
    "Dans l'éditeur, repérez « Pour et contre » sous le récit. Saisissez un point dans « Pour » ou « Contre », puis cliquez sur « Ajouter un autre » pour le suivant.",
  'help.guide.pros-cons.step.2':
    'Enregistrez. Sur la carte, « Voir plus » affiche le récit et le verdict sous forme de deux courtes listes.',
  'help.guide.pros-cons.result': "Les pouces levés et baissés s'affichent sous le récit, visibles d'un coup d'œil.",
  'help.guide.pros-cons.tip.1':
    "Si un journal n'utilise pas de verdicts, vous pouvez désactiver la section sous « Champs de l'entrée » dans « Paramètres du journal ».",
  // search-journey
  'help.guide.search-journey.title': 'Retrouver un passage dans un long journal',
  'help.guide.search-journey.goal': 'Trouver une entrée sans faire défiler des semaines d’entrées.',
  'help.guide.search-journey.step.1':
    'Tapez dans « Rechercher dans ce carnet », dans la barre d’outils. La chronologie se filtre au fil de la saisie, dans les titres, les récits, les lieux et les tags. Les accents et les majuscules ne comptent pas.',
  'help.guide.search-journey.step.2':
    'Pour aller plutôt directement à un jour, cliquez sur le compteur de jours en bas de la chronologie, entre « Revenir en haut » et « Aller à la dernière entrée ».',
  'help.guide.search-journey.result':
    'La chronologie défile jusqu’au jour ou à l’entrée choisi, et la carte s’y centre. Seules les entrées correspondantes sont affichées tant que vous n’avez pas vidé le champ de recherche.',
  'help.guide.search-journey.tip.1':
    'Un journal en cours s’ouvre sur la page du jour : la page actuelle est donc généralement déjà visible.',
  'help.guide.search-journey.tip.2':
    'L’œil dans l’en-tête masque les suggestions : vous ne voyez plus que les entrées que vous avez rédigées.',
  // gallery-map
  'help.guide.gallery-map.title': 'Parcourir la galerie et la carte',
  'help.guide.gallery-map.goal': 'Voir tout le journal en images, et ses lieux sur la carte.',
  'help.guide.gallery-map.step.1':
    "Passez à « Galerie » dans la barre d'outils. Elle affiche toutes les photos de toutes les entrées, ainsi que les images importées directement dans la galerie. Cliquez sur une image pour l'agrandir.",
  'help.guide.gallery-map.step.2':
    '« Importer », à droite, ajoute des photos à la galerie. Si Immich ou Synology est connecté, un bouton au nom de la bibliothèque vous permet d’y choisir des photos.',
  'help.guide.gallery-map.result':
    'Les épingles prennent la couleur de leur jour et sont reliées dans l’ordre chronologique par une fine ligne en pointillés. La barre des couches, en haut de la carte, détermine ce qui est affiché.',
  'help.guide.gallery-map.tip.1':
    'Les traces GPX d’un voyage apparaissent en pointillés sur la couche « Prévu » de la carte. « Afficher toutes les traces GPX des voyages », dans « Paramètres du journal », permet de les masquer.',
  'help.guide.gallery-map.tip.2':
    'Les photos de la galerie qui ont une localisation apparaissent aussi sur la carte publique, quand « Galerie » et « Carte » sont toutes deux partagées.',
  // entry-fields
  'help.guide.entry-fields.title': 'Désactiver des champs d’entrée',
  'help.guide.entry-fields.goal': 'N’afficher dans l’éditeur que les champs utilisés par ce journal.',
  'help.guide.entry-fields.step.1':
    'Cliquez sur ⋯ en haut à droite de l’en-tête pour ouvrir « Paramètres du journal ».',
  'help.guide.entry-fields.step.2':
    "Sous « Champs de l'entrée », désactivez « Humeur », « Météo » ou « Pour et contre ».",
  'help.guide.entry-fields.result':
    "L'éditeur n'affiche plus ces champs. Rien de ce que vous avez écrit n'est perdu : si vous réactivez un champ, les valeurs enregistrées réapparaissent. Un journal partagé masque les mêmes champs.",
  'help.guide.entry-fields.tip.1':
    "Les options se règlent par journal : un voyage d'affaires et des vacances peuvent donc être différents.",
  // link-trip
  'help.guide.link-trip.title': 'Associer un autre voyage',
  'help.guide.link-trip.goal': "Ajouter au journal, en suggestions, les lieux d'un deuxième voyage.",
  'help.guide.link-trip.step.1': 'Cliquez sur ⋯ en haut à droite de l’en-tête pour ouvrir « Paramètres du journal ».',
  'help.guide.link-trip.step.2': 'Sous « Voyages synchronisés », cliquez sur « Ajouter un voyage ».',
  'help.guide.link-trip.step.3': 'Cherchez le voyage par son nom ou sa destination et cliquez sur « Lier » à côté.',
  'help.guide.link-trip.result':
    'Ses lieux apparaissent dans la chronologie comme suggestions à leurs jours respectifs, et sont ajoutés à la couche « Prévu » de la carte avec ses traces GPX.',
  'help.guide.link-trip.tip.1':
    'La corbeille à côté d’un voyage lié le délie après confirmation ; les entrées que vous avez rédigées sont conservées.',
  'help.guide.link-trip.tip.2':
    'Les entrées d’un jour ne comptent qu’une fois, quel que soit le nombre de voyages qui couvrent ce jour.',
  // share-public
  'help.guide.share-public.title': 'Partager le journal publiquement',
  'help.guide.share-public.goal': 'Donner un lien en lecture seule à des personnes sans compte TREK.',
  'help.guide.share-public.step.1':
    'Ouvrez « Paramètres du journal » avec ⋯ dans l’en-tête et faites défiler jusqu’à « Partage public ».',
  'help.guide.share-public.step.2': 'Cliquez sur « Créer un lien de partage ».',
  'help.guide.share-public.step.3':
    'Choisissez ce que voient les visiteurs : « Chronologie », « Galerie » et « Carte ». Sous « Carte », « Programme du voyage » ajoute les lieux et itinéraires prévus, et « Trajets enregistrés » les trajets des journées enregistrées. « Copier » copie le lien dans votre presse-papiers.',
  'help.guide.share-public.result':
    "Toute personne disposant du lien voit les sections activées, et rien d'autre. Les champs désactivés dans « Champs de l'entrée » y restent également masqués.",
  'help.guide.share-public.tip.1':
    'Les photos n’apparaissent sur la carte publique que si « Galerie » et « Carte » sont toutes deux activées. Si « Carte » est désactivée, le serveur supprime leurs coordonnées avant d’envoyer les photos.',
  'help.guide.share-public.tip.2': 'Cliquez sur « Supprimer le lien » à côté de « Copier » pour arrêter le partage.',
  // contributors
  'help.guide.contributors.title': 'Écrire à plusieurs',
  'help.guide.contributors.goal': "Permettre à un autre voyageur d'ajouter ses propres entrées et photos.",
  'help.guide.contributors.step.1':
    'Ouvrez « Paramètres du journal » avec ⋯ dans l’en-tête et repérez « Contributeurs ».',
  'help.guide.contributors.step.2':
    "Cliquez sur « Inviter un contributeur » et recherchez l'utilisateur par son nom ou son e-mail.",
  'help.guide.contributors.step.3': 'Choisissez « Lecteur » ou « Éditeur » et cliquez sur « Inviter ».',
  'help.guide.contributors.result':
    'Le journal apparaît dans la liste de la personne, et ses entrées portent son nom. Pour retirer un contributeur, cliquez sur le × à côté de son nom.',
  'help.guide.contributors.tip.1':
    'Les contributeurs sont des utilisateurs de ce TREK. Pour toutes les autres personnes, il y a le lien public.',
  // studio
  'help.guide.studio.title': 'Mettre le journal en page sous forme de livre photo',
  'help.guide.studio.goal': 'Transformer le journal en pages imprimables.',
  'help.guide.studio.step.1':
    "Cliquez sur « Studio » dans l'en-tête. L'éditeur de mise en page s'ouvre par-dessus le journal.",
  'help.guide.studio.step.2':
    'Pour revenir, cliquez sur × à l’extrémité droite de la barre du haut. Vous retrouvez l’endroit où vous étiez.',
  'help.guide.studio.result':
    'La colonne et ses panneaux sont à gauche, la double page sur le plan de travail et les propriétés à droite. Mise en page auto construit le livre à partir de vos entrées. Exporter crée un PDF prêt à imprimer.',
  'help.guide.studio.tip.1':
    "Le Studio nécessite une fenêtre d'au moins 1024 px de large et n'est pas disponible sur téléphone.",
  'help.guide.studio.tip.2':
    'Le livre a les mêmes droits d’accès que le journal : toute personne qui peut lire le journal peut ouvrir le livre, et toute personne qui peut modifier le journal peut l’enregistrer.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archiver ou supprimer un journal',
  'help.guide.archive-journey.goal': 'Clôturer un journal terminé, ou en supprimer un définitivement.',
  'help.guide.archive-journey.step.1':
    'Cliquez sur ⋯ en haut à droite de l’en-tête pour ouvrir « Paramètres du journal ».',
  'help.guide.archive-journey.step.2':
    "Tout en bas, « Archiver le journal » le clôture et le marque comme archivé, « Restaurer le journal » le restaure. « Supprimer » l'efface avec toutes ses entrées et photos, après confirmation.",
  'help.guide.archive-journey.result':
    'Un journal archivé reste lisible et partageable ; il ne s’ouvre simplement plus sur la journée en cours.',
  'help.guide.archive-journey.tip.1':
    'La suppression est irréversible et ne modifie pas les voyages associés au journal.',
  'help.guide.archive-journey.tip.2':
    'La couverture, le nom et le sous-titre se trouvent dans la même fenêtre, en haut.',
  'help.guide.journey-status.title': 'Définir le statut d’un journal',
  'help.guide.journey-status.goal':
    'Marquer vous-même un journal comme brouillon, en direct ou terminé, au lieu de suivre les dates de ses voyages.',
  'help.guide.journey-status.step.1':
    'Cliquez sur ⋯ en haut à droite de l’en-tête du journal pour ouvrir « Paramètres du journal ».',
  'help.guide.journey-status.step.2':
    'Sous « Statut », choisissez « Brouillon », « En direct » ou « Terminé ». Votre choix est enregistré immédiatement.',
  'help.guide.journey-status.result':
    'Le journal conserve le statut choisi : « Brouillon » et « Terminé » apparaissent sous forme de badge sur sa carte et dans son en-tête, et un journal « En direct » s’affiche dans la bannière en haut de la liste des journaux.',
  'help.guide.journey-status.tip.1':
    '« Automatique » reprend les dates des voyages associés. Sans voyage associé, un journal en mode automatique reste un brouillon.',
  'help.guide.journey-status.tip.2':
    "Un statut défini manuellement reste en place jusqu'à ce que vous le changiez, même si les dates du voyage changent.",

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio met en page un journal sous forme de livre photo imprimable. Il s’ouvre par-dessus le journal : la colonne et ses panneaux à gauche, la double page en cours au centre, ses propriétés à droite. Mise en page auto crée un premier jet à partir de vos entrées, un thème donne au livre ses couleurs et ses polices, et l’assistant peut composer des pages avec vous. Vous pouvez ensuite tout déplacer, recadrer et restyler, et annuler chaque étape.',
  'help.ctx.journey-studio.bullet.1':
    'Barre du haut : à gauche, la couverture et le nom du journal. À droite, qui d’autre est dans le livre et si celui-ci est enregistré, le format de page, annuler, rétablir et coller, Mise en page auto, l’assistant, l’aide, Exporter et le bouton qui ferme Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Colonne de gauche : Pages, Contenu (les photos et les entrées du journal), Mises en page, Éléments (texte, formes, lignes, cadres, icônes et autocollants), Voyage (chiffres, cartes, pays et repères tirés du journal) et, à part en dessous, Thème et Calques.',
  'help.ctx.journey-studio.bullet.3':
    'Plan de travail : la double page en cours avec son fond perdu et ses marges de sécurité, et en dessous la barre de zoom avec Ajuster à la vue, Vue livre et Télécharger cette double page.',
  'help.ctx.journey-studio.bullet.4':
    'Propriétés à droite : tout ce qui concerne l’élément sélectionné, de la position, la taille et le recadrage aux couleurs, effets, ordre de superposition et verrouillage. Quand rien n’est sélectionné, le panneau affiche le fond de page, le thème, les numéros de page et le document.',
  'help.ctx.journey-studio.bullet.5':
    'Le livre est mis en page comme un livre imprimé : couverture, une première page seule en face de l’intérieur vierge de la couverture, les doubles pages, une dernière page seule et la quatrième de couverture. Les numéros de page partent de la première page et s’impriment tels qu’affichés.',
  'help.ctx.journey-studio.bullet.6':
    'Plusieurs personnes peuvent travailler en même temps sur la maquette : chacun voit les pointeurs des autres avec leur nom. Si vous enregistrez une version modifiée entre-temps par quelqu’un d’autre, TREK signale un conflit au lieu d’écraser son travail.',
  'help.ctx.journey-studio.bullet.7':
    'Thème : un seul style pour tout le livre, avec son papier, son encre et trois couleurs d’accent, ses polices et ses motifs. Les éléments liés au thème le suivent quand vous le changez.',
  'help.ctx.journey-studio.bullet.8':
    'Assistant : lorsqu’un administrateur a configuré l’IA, la bulle de la barre du haut ouvre un assistant qui compose des pages, rédige des légendes et restyle le livre avec vous. Chacune de ses modifications peut être annulée.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Construire le livre automatiquement',
  'help.guide.studio-auto-layout.goal':
    'Obtenir en un clic une première maquette complète à partir des entrées et des photos du journal.',
  'help.guide.studio-auto-layout.step.1': 'Cliquez sur « Auto layout » dans la barre du haut.',
  'help.guide.studio-auto-layout.step.2':
    "Choisissez « Tout le livre » : toutes les pages sont remplacées, en conservant votre titre et la configuration des pages. « Cette page » ne recrée que la double page affichée. Cette option n'est proposée que sur une double page créée à partir d'une entrée.",
  'help.guide.studio-auto-layout.step.3':
    'Parcourez la colonne des pages. Si vous préfériez la version précédente, « Annuler » rétablit toute la mise en page.',
  'help.guide.studio-auto-layout.result':
    'Une double page par entrée, dans l’ordre, avec ses photos, son titre et son texte déjà placés. Chaque élément reste lié à son entrée et se met à jour avec elle jusqu’à ce que vous le modifiiez.',
  'help.guide.studio-auto-layout.tip.1':
    'Ces deux options s’annulent comme n’importe quelle action : vous pouvez les essayer puis revenir en arrière.',
  'help.guide.studio-auto-layout.tip.2':
    'Quand la mise en page automatique lie un élément à une entrée, l’élément se met à jour si vous modifiez cette entrée. Si vous modifiez l’élément dans les propriétés, le lien est supprimé.',
  // studio-pages
  'help.guide.studio-pages.title': 'Ajouter, déplacer et supprimer des doubles pages',
  'help.guide.studio-pages.goal': 'Modifier le livre page par page.',
  'help.guide.studio-pages.step.1':
    'Ouvrez Pages dans la colonne. Les vignettes montrent le livre dans l’ordre : couverture, première page, doubles pages, dernière page et quatrième de couverture. La première et la dernière page sont dessinées à côté de l’intérieur vierge de leur couverture, comme s’ouvre le livre relié.',
  'help.guide.studio-pages.step.2':
    '« Ajouter une page », en bas, ajoute une nouvelle double page avant la dernière page. Le + entre deux vignettes en insère une à cet endroit.',
  'help.guide.studio-pages.step.3':
    'Survolez une miniature pour afficher ses actions : « Déplacer avant », « Déplacer après », « Dupliquer la page » et « Supprimer la page ». Cliquez sur une miniature pour ouvrir cette double page sur le plan de travail.',
  'help.guide.studio-pages.result':
    "La couverture, la première et la dernière page ainsi que la quatrième de couverture restent à leur place. Les nouvelles doubles pages s'insèrent toujours entre elles.",
  'help.guide.studio-pages.tip.1':
    'La vue livre, dans la barre du haut, affiche tout le livre en feuilles, tel qu’il sera relié.',
  'help.guide.studio-pages.tip.2':
    'Les numéros de page s’activent sous « Document » dans les propriétés, quand rien n’est sélectionné.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Appliquer une mise en page à une double page',
  'help.guide.studio-layouts.goal': 'Appliquer à une double page une disposition toute prête de cadres photo et texte.',
  'help.guide.studio-layouts.step.1':
    'Ouvrez Mises en page dans la colonne. Les pages dessinées viennent d’abord : couvertures et doubles pages entières composées dans le thème du livre, que les pastilles de style réduisent à un seul aspect. Mes dispositions et Intégrées suivent en dessous, dans la même grille.',
  'help.guide.studio-layouts.step.2':
    'Cliquez sur l’une d’elles. La double page du plan de travail reprend les cadres de cette mise en page, et vos photos et textes existants y sont placés.',
  'help.guide.studio-layouts.result':
    'Les cadres vides sont des emplacements réservés : faites-y glisser une photo depuis « Contenu », ou utilisez « Ajouter à cette page ».',
  'help.guide.studio-my-layouts.title': 'Enregistrer une page comme votre propre disposition',
  'help.guide.studio-my-layouts.goal':
    'Réutilisez une disposition que vous avez construite sur d’autres pages du livre.',
  'help.guide.studio-my-layouts.step.1':
    'Disposez une page comme vous le souhaitez, puis ouvrez Mises en page dans la colonne.',
  'help.guide.studio-my-layouts.step.2':
    'Cliquez sur Enregistrer cette page comme disposition sous Mes dispositions. La page apparaît sous forme de carte dans la liste.',
  'help.guide.studio-my-layouts.tip.1':
    'Cliquez sur votre disposition sur une autre page pour la composer de la même façon, avec ses propres photos et ses propres textes.',
  'help.guide.studio-my-layouts.result':
    'Vos dispositions sont enregistrées avec le livre et proposées sur les pages du même type : celles d’une couverture pour les couvertures, celles d’une double page pour les doubles pages.',
  'help.guide.studio-layouts.tip.1': 'Appliquer une mise en page s’annule comme n’importe quelle autre action.',
  // studio-content
  'help.guide.studio-content.title': 'Placer des photos et des entrées sur une page',
  'help.guide.studio-content.goal': 'Ajouter à la double page les photos et les entrées du journal.',
  'help.guide.studio-content.step.1':
    'Ouvrez « Content » dans la colonne de gauche. « Photos » liste toutes les images du journal, « Entries » liste les entrées avec leur texte.',
  'help.guide.studio-content.step.2':
    'Faites glisser une photo sur la double page ou dans un cadre vide, ou cliquez sur « Ajouter à cette page » en dessous. « Téléverser des photos » ajoute des images qui ne sont pas encore dans le journal ; « Depuis Immich » ou « Depuis Synology » permet de les choisir dans une bibliothèque connectée.',
  'help.guide.studio-content.step.3':
    "Sous une entrée, « Title », « Story » et « Place » placent ce texte sur la page sous forme d'élément texte. La date et les coordonnées sont ajoutées sous forme de repères, et les photos de l'entrée sont aussi listées à cet endroit.",
  'help.guide.studio-content.result':
    'Une photo déposée devient un élément photo. Le texte reste lié à l’entrée jusqu’à ce que vous le modifiiez.',
  'help.guide.studio-theme.title': 'Donner un thème au livre',
  'help.guide.studio-theme.goal': 'Définissez les couleurs et les polices de tout le livre d’un seul coup.',
  'help.guide.studio-theme.step.1':
    'Ouvrez Thème dans la colonne. Chaque carte montre un thème sous forme de petite page : son papier, sa police et ses trois couleurs d’accent.',
  'help.guide.studio-theme.step.2':
    'Cliquez sur un thème pour l’essayer. Sous les cartes, vous pouvez modifier sa palette, choisir d’autres polices, ainsi que des motifs et une décoration.',
  'help.guide.studio-theme.step.3':
    'Cliquez sur Appliquer au livre, ou sur Appliquer à cette page pour la double page affichée.',
  'help.guide.studio-theme.tip.1':
    'Les éléments liés au thème prennent ses couleurs et ses polices et suivent quand vous le changez. Restyler aussi ce qui n’est pas encore lié lie d’abord le reste.',
  'help.guide.studio-theme.tip.2': 'Couleurs des photos crée une palette à partir des images du journal.',
  'help.guide.studio-theme.result':
    'Chaque couleur et chaque police liée du livre change en même temps, et l’application du thème est une seule étape d’annulation.',
  'help.guide.studio-content.tip.1': 'Le champ de recherche en haut de « Contenu » filtre les deux listes.',
  'help.guide.studio-content.tip.2':
    'Quand vous déposez un fichier de votre ordinateur sur le plan de travail, TREK l’importe et le place en une seule opération.',
  // studio-elements
  'help.guide.studio-elements.title': 'Ajouter du texte, des formes, des icônes et des autocollants',
  'help.guide.studio-elements.goal': 'Décorer une double page en plus des photos et des récits.',
  'help.guide.studio-elements.step.1':
    'Ouvrez Éléments dans la colonne. Six onglets classent ce que vous pouvez ajouter : Texte, Formes, Lignes, Cadres, Icônes et Autocollants.',
  'help.guide.studio-elements.step.2':
    'Cliquez sur un style de texte ou un titre dessiné, une forme, une ligne, un cadre vide, une icône ou un autocollant. Chacun est placé au milieu de la double page, et vous pouvez ensuite le déplacer.',
  'help.guide.studio-elements.result':
    'Double-cliquez sur un élément de texte pour y écrire ; les propriétés regroupent la police, la graisse, la taille, l’espacement et l’alignement.',
  'help.guide.studio-stickers.title': 'Décorer avec des autocollants',
  'help.guide.studio-stickers.goal':
    'Ajoutez des illustrations, des monuments et de la cuisine aux animaux et aux flèches.',
  'help.guide.studio-stickers.step.1': 'Ouvrez Éléments dans la colonne et choisissez Autocollants.',
  'help.guide.studio-stickers.step.2':
    'Cherchez un mot ou parcourez les étagères, puis cliquez sur un autocollant pour le placer sur la double page.',
  'help.guide.studio-stickers.tip.1':
    'Quand un autocollant est sélectionné, Propriétés recolore ses parties et le retourne en miroir.',
  'help.guide.studio-stickers.result': 'L’autocollant est un dessin, il reste donc net à toutes les tailles.',
  'help.guide.studio-elements.tip.1':
    'Les cadres sont des emplacements photo vides : vous y déposerez une image plus tard.',
  // studio-travel
  'help.guide.studio-travel.title': 'Ajouter des cartes, des chiffres, des pays et des repères',
  'help.guide.studio-travel.goal': 'Transformez le voyage lui-même en éléments dessinés sur la page.',
  'help.guide.studio-travel.step.1':
    'Ouvrez Voyage dans la colonne. Quatre onglets classent ce que vous pouvez ajouter : Chiffres, Cartes, Pays et Repères.',
  'help.guide.studio-travel.step.2':
    'Chaque carte montre l’élément avec les chiffres propres à votre journal, aux couleurs du thème : un récapitulatif en affiche, en billet, en panneau routier ou en compteur kilométrique, une carte avec des étapes numérotées ou découpée sur un pays, un pays en tampon, en carte postale ou en épingle, une date ou une distance en tampon, en étiquette ou en ruban.',
  'help.guide.studio-travel.step.3':
    'Cliquez sur une carte. L’élément est placé au milieu de la double page, et vous pouvez ensuite le déplacer et le redimensionner.',
  'help.guide.studio-travel.result':
    'L’élément apparaît sur la double page. Propriétés change son apparence, et chaque chiffre, carte et pays se met à jour quand le journal change.',
  'help.guide.studio-text-effects.title': 'Ajouter des effets au texte',
  'help.guide.studio-text-effects.goal':
    'Donnez à un titre un contour, une ombre, une courbe ou des lettres remplies d’un motif.',
  'help.guide.studio-text-effects.step.1': 'Cliquez sur un élément de texte de la page pour le sélectionner.',
  'help.guide.studio-text-effects.step.2':
    'Dans Propriétés, ouvrez Effets pour ajouter un contour, une ombre ou un surlignage, ou remplir les lettres d’un dégradé ou d’un motif. Casse et position courbe la ligne et l’ajuste à son cadre.',
  'help.guide.studio-text-effects.tip.1':
    'Ajuster au cadre réduit le texte jusqu’à ce qu’il tienne dans son cadre, si bien qu’un long titre ne déborde jamais.',
  'help.guide.studio-text-effects.result': 'L’effet est dessiné avec le texte, à l’impression comme à l’écran.',
  'help.guide.studio-background.title': 'Changer le fond de la page',
  'help.guide.studio-background.goal':
    'Peignez la page d’une couleur, d’un dégradé ou d’un motif, ou posez une photo en dessous.',
  'help.guide.studio-background.step.1':
    'Cliquez sur une zone vide de la page pour ne rien sélectionner. Fond de page se trouve en haut de Propriétés.',
  'help.guide.studio-background.step.2':
    'Choisissez Papier, Uni, Dégradé ou Motif et une couleur, ou cliquez sur une photo sous Photo en arrière-plan.',
  'help.guide.studio-background.tip.1': 'Appliquer à toutes les pages donne le même fond à chaque page du livre.',
  'help.guide.studio-background.result':
    'Le fond déborde dans le fond perdu, il s’imprime donc jusqu’au bord de la page.',
  'help.guide.studio-layers.title': 'Organiser, masquer et verrouiller avec les calques',
  'help.guide.studio-layers.goal':
    'Voyez tout ce que contient la double page dans l’ordre de superposition et travaillez dessus à cet endroit.',
  'help.guide.studio-layers.step.1':
    'Ouvrez Calques dans la colonne. Le haut de la liste correspond à l’avant de la page.',
  'help.guide.studio-layers.step.2':
    'Faites glisser une ligne pour la repositionner, utilisez l’œil pour masquer un élément et le cadenas pour le garder en place. Sélectionnez-en plusieurs et groupez-les pour les déplacer ensemble.',
  'help.guide.studio-layers.tip.1': 'Double-cliquez sur une ligne pour donner un nom à l’élément.',
  'help.guide.studio-layers.tip.2': 'Les éléments masqués ne figurent pas dans le PDF.',
  'help.guide.studio-layers.result':
    'Les pages chargées restent faciles à modifier, et les parties terminées ne peuvent pas être déplacées par accident.',
  'help.guide.studio-travel.tip.1':
    'Sous Cartes, Étapes liste chaque étape du parcours. Désactivez-en une pour l’écarter des cartes et des chiffres, votre aéroport de départ par exemple.',
  'help.guide.studio-travel.tip.2':
    'Une carte de pays n’affiche que les étapes de ce pays, si bien que le pays remplit la page même quand le journal a commencé par un long vol.',
  // studio-properties
  'help.guide.studio-properties.title': 'Modifier la sélection',
  'help.guide.studio-properties.goal': 'Déplacer, recadrer, styliser et superposer un élément avec l’inspecteur.',
  'help.guide.studio-properties.step.1':
    "Cliquez sur un élément de la double page. Des poignées apparaissent pour la taille et la rotation. Faites glisser l'élément pour le déplacer.",
  'help.guide.studio-properties.step.2':
    "« Properties », à droite, affiche les réglages de l'élément sélectionné : position et taille, « Crop » avec le point focal qui détermine ce qui reste dans le cadre, « Fill » ou « Fit », les filtres « Look », « Corner radius », le style de « Cadre », l'ordre de superposition et « Lock ».",
  'help.guide.studio-properties.step.3':
    "« Dupliquer » et « Supprimer » se trouvent en haut de l'inspecteur. « Annuler », dans la barre du haut, permet de revenir sur chacune de ces modifications.",
  'help.guide.studio-properties.result':
    'Un élément verrouillé ne peut être ni sélectionné ni déplacé sur la page. Cela protège une mise en page terminée pendant que vous travaillez sur les autres éléments.',
  'help.guide.studio-properties.tip.1':
    "Maj + clic sélectionne plusieurs éléments, que l'inspecteur modifie alors ensemble.",
  'help.guide.studio-properties.tip.2':
    'Si vous modifiez un élément placé par la mise en page automatique, il n’est plus lié à l’entrée et ne suit plus ses modifications ultérieures.',
  // studio-format
  'help.guide.studio-format.title': 'Choisir le format de page',
  'help.guide.studio-format.goal': "Choisir le format d'impression du livre avant de créer la mise en page.",
  'help.guide.studio-format.step.1':
    'Cliquez sur le format de page dans la barre du haut, à côté des outils d’édition. Il indique le nom et la forme du format.',
  'help.guide.studio-format.step.2':
    'Choisissez « Square 21 × 21 cm », « Square 30 × 30 cm », A4 ou A5 en paysage ou en portrait, ou saisissez une largeur et une hauteur personnalisées en millimètres. Le fond perdu et la marge de sécurité se règlent juste en dessous.',
  'help.guide.studio-format.result':
    'Chaque double page est affichée à ce format, avec par défaut 3 mm de fond perdu et une marge de sécurité de 5 mm.',
  'help.guide.studio-format.tip.1':
    "Changez d'abord le format, puis lancez « Auto layout ». La mise en page automatique utilise le format défini au moment où elle s'exécute.",
  'help.guide.studio-format.tip.2':
    'Demandez à votre imprimeur ses valeurs de fond perdu et de marge de sécurité, et saisissez-les.',
  // studio-export
  'help.guide.studio-export.title': 'Exporter le livre en PDF',
  'help.guide.studio-export.goal': "Obtenir un fichier prêt à imprimer ou à lire à l'écran.",
  'help.guide.studio-export.step.1': 'Cliquez sur « Exporter » dans la barre du haut.',
  'help.guide.studio-export.step.2':
    "Choisissez « Pages simples », une page par feuille dans l'ordre de lecture, ce qu'attend un imprimeur, ou « Doubles pages », deux pages à la fois, comme le livre ouvert. « Traits de coupe » ajoute le fond perdu sur chaque bord et indique où couper.",
  'help.guide.studio-export.step.3':
    'Cliquez sur « Aperçu avant impression ». Votre navigateur ouvre les pages. Choisissez « Enregistrer en PDF » pour créer le fichier.',
  'help.guide.studio-export.result':
    'Un PDF comptant autant de feuilles qu’annoncé par la boîte de dialogue, au format de page choisi.',
  'help.guide.studio-export.tip.1': 'Le PDF ne peut être créé que sur ordinateur, comme Studio lui-même.',
  'help.guide.studio-export.tip.2':
    'Pour une épreuve, exportez en « Doubles pages » sans traits de coupe ; pour l’imprimeur, en « Pages simples » avec traits de coupe.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Réutiliser une double page dans un autre livre',
  'help.guide.studio-spread-file.goal': "Copier une mise en page qui vous plaît du livre d'un journal vers un autre.",
  'help.guide.studio-spread-file.step.1':
    'La double page étant sur le plan de travail, cliquez sur « Télécharger cette double page » à droite de la barre de zoom. Le fichier contient la mise en page, pas les photos.',
  'help.guide.studio-spread-file.step.2':
    "Dans l'autre livre, ouvrez « Pages » et cliquez sur « Importer » à côté de « Ajouter une page », puis choisissez le fichier.",
  'help.guide.studio-spread-file.result':
    'La double page est importée avec ses cadres et ses styles de texte. Déposez les photos du nouveau journal dans les cadres.',
  'help.guide.studio-spread-file.tip.1':
    'Si un fichier n’est pas une maquette de double page, TREK le refuse et en indique la raison.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Paramètres',
  'help.ctx.settings.summary':
    'Vos réglages personnels, avec un onglet par thème dans la barre latérale de gauche. La plupart des interrupteurs s’appliquent dès que vous les modifiez. Un formulaire doté d’un bouton « Enregistrer » n’est enregistré que lorsque vous cliquez dessus. Rien ici ne modifie TREK pour les autres.',
  'help.ctx.settings.bullet.1':
    'La barre latérale à gauche : « Affichage », « Apparence », « Carte », « Notifications », « Intégrations », « Hors ligne » et « Compte ». « Plugins » apparaît dès qu’un plugin est actif. « À propos » apparaît sauf si l’exploitant l’a masqué. La version est indiquée en bas.',
  'help.ctx.settings.bullet.2':
    '« Affichage » s’ouvre en premier. Il regroupe la langue, la langue des noms de lieux, les unités, le format de l’heure, le premier jour de la semaine et la devise d’affichage, ainsi que le comportement de la carte du voyage. « Apparence » regroupe le thème, les couleurs, la lisibilité, la taille du texte et les widgets du tableau de bord.',
  'help.ctx.settings.bullet.3':
    '« Carte » règle le moteur de carte et son style ; « Notifications » détermine quels événements passent par quel canal ; « Intégrations » connecte les photothèques, AirTrail, Dawarich et wanderer, et regroupe les clés API et MCP ; « Hors ligne » détermine ce que cet appareil garde en mémoire.',
  'help.ctx.settings.bullet.4':
    "« Compte » regroupe votre profil, votre mot de passe, l'authentification à deux facteurs, les passkeys et la suppression de votre compte.",
  'help.ctx.settings-display.title': 'Affichage',
  'help.ctx.settings-display.summary':
    'L’écran d’ouverture de TREK, la langue et les unités utilisées, et le comportement de la carte du voyage et des réservations. Chaque modification s’applique immédiatement.',
  'help.ctx.settings-display.bullet.1':
    '« Démarrage » : « Page de démarrage » ouvre le « Tableau de bord » ou le « Voyage en cours » ; avec « Voyage en cours », « Onglet de démarrage » détermine l’onglet sur lequel s’ouvre ce voyage.',
  'help.ctx.settings-display.bullet.2':
    "« Langue et région » : « Devise d'affichage » (ou « Devise du voyage » pour ne rien convertir), « Langue », « Noms de lieux », « Unité de température », « Unité de distance », « Format de l'heure » et « La semaine commence le ».",
  'help.ctx.settings-display.bullet.3':
    "« Voyage et carte » : « Ouvrir les lieux dans », « Date en premier dans les titres de jour », « Étiquettes des itinéraires », « Toujours afficher les itinéraires de réservation », « Repères compacts pour les lieux non planifiés », « Explorer les lieux sur la carte », « Masquer les codes de réservation » et « Optimiser l'itinéraire depuis l'hébergement ».",
  'help.ctx.settings-appearance.title': 'Apparence',
  'help.ctx.settings-appearance.summary':
    "L'apparence de TREK pour ce compte : thème clair ou sombre, couleur d'accent, effets de transparence et animations, taille du texte et widgets affichés sur le tableau de bord. Tout s'applique immédiatement, sur tous les appareils où vous vous connectez.",
  'help.ctx.settings-appearance.bullet.1':
    '« Thème » : « Mode de couleur » (« Clair », « Sombre » ou « Auto »), le jeu de couleurs et, avec « Personnalisé », votre propre couleur d’accent pour les modes clair et sombre, avec un contrôle du contraste.',
  'help.ctx.settings-appearance.bullet.2':
    '« Lisibilité », marquée « Expérimental » : transparence, « Réduire les animations », densité et « Taille du texte », avec un curseur pour « Tout » et un pour chacune des tailles « Grand », « Moyen », « Normal » et « Petit ».',
  'help.ctx.settings-appearance.bullet.3':
    '« Widgets du tableau de bord » : des interrupteurs distincts pour ordinateur (« Sous la bannière », « Barre latérale droite ») et pour mobile (« Sous la bannière », « Bas de page »).',
  'help.ctx.settings-appearance.bullet.4':
    '« Réinitialiser par défaut », sous les cartes, rétablit les valeurs par défaut de tout l’onglet.',
  'help.ctx.settings-map.title': 'Carte',
  'help.ctx.settings-map.summary':
    'Le moteur qui affiche les cartes du planificateur et du journal, et son style. Leaflet est la carte raster classique, Mapbox GL ajoute les bâtiments et le relief en 3D avec votre propre jeton, MapLibre GL affiche les tuiles vectorielles OpenFreeMap sans jeton. Atlas utilise toujours Leaflet.',
  'help.ctx.settings-map.bullet.1':
    '« Fournisseur de carte » : Leaflet, Mapbox GL (Expérimental) ou MapLibre GL, chacun avec une courte description.',
  'help.ctx.settings-map.bullet.2':
    "« Modèle de carte » et « Clé d'API CARTO » pour Leaflet ; « Style de carte » pour les deux moteurs GL, ainsi que le « Jeton d'accès Mapbox » pour Mapbox GL.",
  'help.ctx.settings-map.bullet.3':
    'Pour Mapbox GL uniquement : « Bâtiments 3D & terrain » et « Mode haute qualité ». Un aperçu en direct s’affiche au-dessus de « Enregistrer la carte », qui enregistre votre choix.',
  'help.ctx.settings-notifications.title': 'Notifications', // same-as-en
  'help.ctx.settings-notifications.summary':
    'La façon dont TREK vous contacte en dehors de l’application. En haut, un tableau avec une ligne par événement et une colonne par canal détermine ce qui est envoyé où. En dessous se trouvent les cartes du webhook, de ntfy, du push sur cet appareil et des éventuels canaux de plugin.',
  'help.ctx.settings-notifications.bullet.1':
    '« Notifications » : activez ou désactivez chaque événement pour chaque canal. Un cadenas signifie que l’administrateur l’a désactivé pour tout le monde.',
  'help.ctx.settings-notifications.bullet.2':
    '« URL du webhook » : un webhook Discord, Slack ou personnalisé, avec « Tester » et « Enregistrer ».',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy : « Sujet Ntfy », « URL du serveur Ntfy » et jeton d’accès (facultatifs), avec « Tester » et « Enregistrer ».',
  'help.ctx.settings-notifications.bullet.4':
    '« Notifications push sur cet appareil » : « Activer sur cet appareil » ne concerne que ce navigateur ; « Envoyer un test » envoie une notification de test. Un canal de plugin affiche « Configurer » tant qu’il n’est pas configuré.',
  'help.ctx.settings-integrations.title': 'Intégrations',
  'help.ctx.settings-integrations.summary':
    'Tout ce qui se connecte à TREK depuis l’extérieur : photothèques pour le journal, AirTrail pour les vols, Dawarich pour savoir où vous êtes réellement allé, wanderer pour les sentiers, clés API en lecture seule pour d’autres logiciels, et MCP pour les clients d’IA. Une connexion à un autre service n’apparaît qu’une fois activée par l’administrateur.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich et Synology Photos, AirTrail, Dawarich et wanderer : chaque carte comporte son adresse et sa clé, « Enregistrer » et « Tester la connexion », ainsi qu’un badge « Connecté » ou « Non connecté ».',
  'help.ctx.settings-integrations.bullet.2':
    '« Clés API » : des clés en lecture seule pour l’API publique, chacune limitée aux domaines que vous choisissez, avec le « Point de terminaison » à copier.',
  'help.ctx.settings-integrations.bullet.3':
    '« Configuration MCP » : le « Point de terminaison MCP » et, sous « Clients OAuth 2.1 », vos clients enregistrés, la « Configuration du client » à copier et les « Sessions OAuth actives » avec « Révoquer ».',
  'help.ctx.settings-integrations.bullet.4':
    '« Tokens API » : l’ancienne méthode de connexion à MCP, marquée « Obsolète » ; utilisez plutôt « Clients OAuth 2.1 ».',
  'help.ctx.settings-offline.title': 'Hors ligne',
  'help.ctx.settings-offline.summary':
    "Ce que TREK enregistre sur cet appareil pour qu'un voyage s'ouvre même sans connexion, et ce qui se passe quand une modification faite hors ligne entre en conflit avec une modification faite ailleurs.",
  'help.ctx.settings-offline.bullet.1':
    '« Mode hors ligne » : « Forcer le mode hors ligne » télécharge d’abord tout, puis fonctionne uniquement à partir du cache et met vos modifications en file d’attente.',
  'help.ctx.settings-offline.bullet.2':
    '« Préparer le mode hors ligne » : « Télécharger pour une utilisation hors ligne » récupère les données des voyages, les documents et les tuiles de carte ; « Resynchroniser maintenant » relance une synchronisation manuelle.',
  'help.ctx.settings-offline.bullet.3':
    '« Que stocker hors ligne » : « Stocker les tuiles de carte hors ligne », et un interrupteur par voyage. Un voyage terminé n’est stocké que si vous l’activez.',
  'help.ctx.settings-offline.bullet.4':
    '« Conflits de synchronisation » n’apparaît qu’en cas de conflit entre deux modifications, avec « La mienne », « Conserver la leur » et « En cas de conflit ». « Cache hors ligne » compte les voyages et les modifications en attente ou en échec, avec « Réessayer », « Ignorer » et « Vider le cache ».',
  'help.ctx.settings-account.title': 'Compte',
  'help.ctx.settings-account.summary':
    'Votre compte sur ce TREK et votre façon de vous connecter : photo de profil, nom d’utilisateur et e-mail, mot de passe, authentification à deux facteurs et passkeys. « Supprimer le compte » se trouve en bas de la carte « Compte ».',
  'help.ctx.settings-account.bullet.1':
    '« Compte » : cliquez sur l’appareil photo de l’image pour en importer une, et sur la corbeille rouge pour la supprimer. « Nom d’utilisateur » et « E-mail » sont enregistrés avec « Enregistrer le profil ».',
  'help.ctx.settings-account.bullet.2':
    '« Changer le mot de passe » : le mot de passe actuel, le nouveau deux fois, avec les règles cochées au fil de la saisie, puis « Mettre à jour le mot de passe ». Si ce TREK n’autorise que la connexion par SSO, cette carte n’apparaît pas.',
  'help.ctx.settings-account.bullet.3':
    "Authentification à deux facteurs (2FA) avec une application d'authentification et des codes de secours, et passkeys pour se connecter sans mot de passe.",
  'help.ctx.settings-account.bullet.4':
    '« Supprimer le compte » se trouve à gauche du pied de la carte « Compte » et demande confirmation. L’unique administrateur ne peut pas supprimer son propre compte.',
  // language-region
  'help.guide.language-region.title': 'Régler la langue, les unités et la devise',
  'help.guide.language-region.goal': 'Utiliser TREK dans votre langue et avec les formats de votre région.',
  'help.guide.language-region.step.1':
    'Sous « Langue et région », choisissez une « Langue » dans la rangée de pastilles. TREK change aussitôt, sur tous les appareils où vous êtes connecté.',
  'help.guide.language-region.step.2':
    '« Noms de lieux » définit la langue utilisée par la recherche de lieux, les suggestions et les adresses ; « Comme l’application » suit la langue de l’interface.',
  'help.guide.language-region.result':
    'Les dates, les distances et les montants s’affichent dans le format qui vous est familier. Dans « Coûts », les montants sont convertis dans votre devise d’affichage à titre indicatif ; les montants saisis restent inchangés.',
  'help.guide.language-region.tip.1':
    '« Devise du voyage » affiche chaque voyage dans sa propre devise, sans conversion.',
  'help.guide.language-region.tip.2':
    'La langue définit aussi les noms des jours et des mois dans Vacances et dans le journal.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Régler la carte du voyage et les titres des jours',
  'help.guide.travel-map-prefs.goal':
    'Choisir ce qu’affiche la carte du voyage et l’apparence des en-têtes de jour, pour tous vos voyages.',
  'help.guide.travel-map-prefs.step.1':
    'Dans « Voyage et carte », « Ouvrir les lieux dans » définit l’application de cartographie que le bouton de navigation ouvre directement ; « Demander à chaque fois » vous laisse choisir l’application à chaque fois. « Date en premier dans les titres de jour » affiche d’abord la date du calendrier dans chaque en-tête de jour.',
  'help.guide.travel-map-prefs.step.2':
    '« Toujours afficher les itinéraires de réservation » trace sur la carte chaque vol, train et autre réservation ; « Étiquettes des itinéraires » affiche le nom de la gare ou de l’aéroport à chaque extrémité. « Repères compacts pour les lieux non planifiés » réduit les lieux pas encore placés sur un jour, pour mieux distinguer les étapes planifiées.',
  'help.guide.travel-map-prefs.result':
    "La carte utilise ces réglages pour tous vos voyages, jusqu'à ce que vous les modifiiez.",
  'help.guide.travel-map-prefs.tip.1':
    "Ces réglages sont propres à chaque compte, pas à chaque voyage. Les membres d'un voyage partagé voient chacun leurs propres choix.",
  'help.guide.travel-map-prefs.tip.2':
    'Un administrateur peut définir les valeurs par défaut pour tout le monde ; ce que vous réglez ici ne s’applique qu’à vous.',
  // startup
  'help.guide.startup.title': 'Choisir l’écran d’ouverture de TREK',
  'help.guide.startup.goal':
    'Ouvrir TREK sur la page que vous utilisez le plus, plutôt que sur le tableau de bord à chaque fois.',
  'help.guide.startup.step.1':
    'En haut de « Affichage », sous « Démarrage », réglez « Page de démarrage » sur « Tableau de bord » ou « Voyage en cours ».',
  'help.guide.startup.step.2':
    'Avec « Voyage en cours », « Onglet de démarrage » apparaît : choisissez l’onglet sur lequel s’ouvre ce voyage.',
  'help.guide.startup.result': 'La prochaine fois que vous ouvrirez TREK, il s’ouvrira directement sur cette page.',
  'help.guide.startup.tip.1':
    '« Voyage en cours » désigne le voyage qui a lieu aujourd’hui, ou le prochain à venir. C’est le même voyage que celui mis en avant en haut du tableau de bord.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Régler le thème et la couleur d’accent',
  'help.guide.theme-scheme.goal':
    'Passer TREK en mode clair, sombre ou automatique selon votre appareil, dans la couleur de votre choix.',
  'help.guide.theme-scheme.step.1':
    'Sous « Thème », réglez « Mode de couleur » sur « Clair », « Sombre » ou « Auto ». « Auto » suit le réglage de votre appareil.',
  'help.guide.theme-scheme.step.2':
    'Choisissez un jeu de couleurs : « Par défaut », « Contraste élevé », Indigo, Bleu canard, Rose, « Ambre », Violet ou « Personnalisé ».',
  'help.guide.theme-scheme.step.3':
    'Avec « Personnalisé », choisissez l’une des pastilles de couleur, ou définissez votre propre couleur d’accent séparément pour « Clair » et « Sombre ». La pastille à côté indique « Bon contraste » ou « Faible contraste ».',
  'help.guide.theme-scheme.result':
    "Les boutons, les liens et les éléments mis en évidence prennent la couleur d'accent partout, sur tous les appareils où vous vous connectez.",
  'help.guide.theme-scheme.tip.1':
    'La barre de navigation propose aussi un bouton rapide clair/sombre, qui règle le même thème.',
  'help.guide.theme-scheme.tip.2': 'Choisissez le thème « High contrast » si le thème par défaut est difficile à lire.',
  // readability
  'help.guide.readability.title': 'Régler la lisibilité et la taille du texte',
  'help.guide.readability.goal':
    'Réduire les effets de transparence et les animations, aérer l’affichage ou agrandir le texte.',
  'help.guide.readability.step.1':
    'Sous « Lisibilité », la transparence remplace les panneaux translucides par des surfaces opaques, « Réduire les animations » limite les animations au minimum, et la densité propose Confortable ou Compact.',
  'help.guide.readability.step.2':
    '« Taille du texte » : faites glisser « Tout » pour agrandir ou réduire tout le texte d’un coup, ou réglez « Grand », « Moyen », « Normal » et « Petit » séparément. Chaque taille affiche un exemple, pour voir le résultat pendant le réglage.',
  'help.guide.readability.result':
    'La modification s’applique immédiatement à toute l’application, y compris aux panneaux de la carte et au journal.',
  'help.guide.readability.tip.1':
    'Certaines parties de TREK réduisent déjà les animations quand votre appareil est réglé pour limiter les mouvements. « Réduire les animations » les réduit dans les autres parties.',
  'help.guide.readability.tip.2':
    "La taille du texte s'applique via les niveaux typographiques : rien n'est tronqué, et un texte trop grand passe à la ligne.",
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Choisir les widgets du tableau de bord',
  'help.guide.dashboard-widgets.goal':
    "N'afficher que les widgets que vous utilisez, séparément sur ordinateur et sur téléphone.",
  'help.guide.dashboard-widgets.step.1':
    'Sous « Widgets du tableau de bord », la partie ordinateur liste les widgets « Sous la bannière » et la « Barre latérale droite ». Désactiver « Barre latérale droite » masque toute la colonne et centre le tableau de bord ; ses widgets restent estompés jusqu’à ce que vous la réactiviez.',
  'help.guide.dashboard-widgets.step.2':
    'Sur mobile, des interrupteurs distincts, « Sous la bannière » et « Bas de page », règlent le tableau de bord de votre téléphone.',
  'help.guide.dashboard-widgets.result':
    'Le tableau de bord change immédiatement. Si la colonne de droite est désactivée, il est centré.',
  'help.guide.dashboard-widgets.tip.1':
    'Les widgets d’une extension n’apparaissent que si l’administrateur a activé cette extension.',
  'help.guide.dashboard-widgets.tip.2':
    'Le tableau de bord mémorise lui-même, pour chaque appareil, la vue en grille ou en liste et l’ordre de tri.',
  // map-provider
  'help.guide.map-provider.title': 'Choisir le moteur et le style de la carte',
  'help.guide.map-provider.goal': 'Choisir entre la carte classique, les tuiles vectorielles et la carte 3D de Mapbox.',
  'help.guide.map-provider.step.1':
    'Sous « Fournisseur de carte », choisissez Leaflet pour la carte 2D classique avec n’importe quelles tuiles raster, Mapbox GL pour des tuiles vectorielles avec bâtiments et relief en 3D, ou MapLibre GL pour les tuiles vectorielles OpenFreeMap sans jeton.',
  'help.guide.map-provider.step.2':
    "Choisissez un « Modèle de carte » pour Leaflet ou un « Style de carte » pour un moteur GL, ou collez votre propre URL. Mapbox GL nécessite un « Jeton d'accès Mapbox », et les modèles CARTO une « Clé d'API CARTO » ; le lien sous chaque champ indique où l’obtenir.",
  'help.guide.map-provider.step.3':
    'Avec Mapbox GL, activez « Bâtiments 3D & terrain » et, si votre appareil est assez puissant, « Mode haute qualité ». Vérifiez l’aperçu, puis cliquez sur « Enregistrer la carte ».',
  'help.guide.map-provider.result':
    'Le planificateur de voyage et les cartes du journal utilisent le moteur choisi. Atlas utilise toujours Leaflet.',
  'help.guide.map-provider.tip.1': 'Sans jeton, Mapbox GL utilise Leaflet au lieu d’afficher une carte vide.',
  'help.guide.map-provider.tip.2':
    'Les tuiles enregistrées pour une utilisation hors ligne proviennent du fournisseur actif au moment du téléchargement.',
  // notification-channels
  'help.guide.notification-channels.title': 'Choisir où recevoir les notifications',
  'help.guide.notification-channels.goal':
    'Recevoir les rappels de voyage et les activités de collaboration sur votre téléphone ou dans un autre outil.',
  'help.guide.notification-channels.step.1':
    'Pour un webhook, collez une URL de webhook Discord, Slack ou personnalisée, cliquez sur « Tester », puis sur « Enregistrer ».',
  'help.guide.notification-channels.step.2':
    'Pour ntfy, renseignez le « Sujet Ntfy » et, si vous avez votre propre serveur, son « URL du serveur Ntfy » et un jeton d’accès. « Tester » envoie immédiatement un message ; « Enregistrer » sauvegarde les réglages.',
  'help.guide.notification-channels.step.3':
    'Dans la carte « Notifications » en haut, activez ou désactivez chaque événement pour chaque canal. Un cadenas signifie que l’administrateur l’a désactivé pour tout le monde. Un canal de plugin affiche « Configurer » tant qu’il n’est pas configuré ; « Envoyer un test » permet de l’essayer.',
  'help.guide.notification-channels.result':
    'Les événements sont envoyés par les canaux que vous avez activés pour eux. La colonne « Dans l’application » détermine ce qu’affiche la cloche de la barre de navigation.',
  'help.guide.notification-channels.tip.1':
    'Le « Rappel » propre à un voyage, c’est-à-dire combien de jours avant le départ, se règle dans le formulaire de modification du voyage.',
  'help.guide.notification-channels.tip.2':
    'L’administrateur peut prédéfinir un serveur ntfy par défaut pour tout le monde ; vous choisissez toujours votre propre sujet.',
  // photo-providers
  'help.guide.photo-providers.title': 'Connecter une photothèque',
  'help.guide.photo-providers.goal':
    'Permettre au journal de charger les photos du jour depuis Immich ou Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Sous « Intégrations », repérez la carte Immich ou Synology Photos et saisissez les informations demandées : l’« URL du serveur » avec une « Clé API » pour Immich, ou un « Nom d’utilisateur » et un « Mot de passe » pour Synology Photos. Immich peut aussi copier les photos du journal dans la bibliothèque Immich lors de leur import.',
  'help.guide.photo-providers.step.2':
    'Cliquez sur « Tester la connexion », puis sur « Enregistrer ». Le badge passe à « Connecté ».',
  'help.guide.photo-providers.result':
    "L'onglet « External photos » de l'éditeur d'entrée cherche dans la photothèque connectée les photos du jour de l'entrée, en commençant par les plus proches de son emplacement.",
  'help.guide.photo-providers.tip.1':
    "La connexion est propre à votre compte : les autres membres d'un journal connectent leur propre photothèque.",
  'help.guide.photo-providers.tip.2':
    "Un fournisseur dont les photos n'ont pas de données GPS fonctionne quand même. La liste est alors triée par date.",
  // api-keys
  'help.guide.api-keys.title': 'Créer une clé API',
  'help.guide.api-keys.goal': 'Permettre à d’autres logiciels de lire vos voyages via l’API publique.',
  'help.guide.api-keys.step.1':
    'Sous « Clés API », cliquez sur « Créer une clé », donnez-lui un « Nom » qui indique où elle sera utilisée et, sous « Ce que cette clé peut lire », ne gardez que les domaines nécessaires. Cliquez sur « Créer ».',
  'help.guide.api-keys.step.2':
    'Copiez la clé depuis « Clé API créée » : elle n’est affichée qu’une seule fois. Cliquez sur « Terminé ». Le « Point de terminaison » à appeler est indiqué sous la liste.',
  'help.guide.api-keys.result':
    'Un logiciel muni de la clé peut lire les domaines choisis, sans jamais rien modifier. La liste indique quand chaque clé a été créée et utilisée pour la dernière fois, et la corbeille permet de la supprimer.',
  'help.guide.api-keys.tip.1':
    'Utilisez une clé par outil : vous pourrez ainsi révoquer une clé sans affecter les autres outils.',
  'help.guide.api-keys.tip.2':
    'Pour qu’un client d’IA puisse modifier des données, utilisez plutôt MCP avec OAuth ; les clés API ne permettent que la lecture.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Connecter un assistant IA via MCP',
  'help.guide.mcp-oauth.goal': 'Donner à Claude, à un IDE ou à un autre client MCP l’accès à vos voyages.',
  'help.guide.mcp-oauth.step.1':
    'Sous « Configuration MCP », copiez le « Point de terminaison MCP » pour votre client.',
  'help.guide.mcp-oauth.step.2':
    "Sous « Clients OAuth 2.1 », cliquez sur « Nouveau client » et choisissez un préréglage rapide comme Claude Desktop ou Cursor, ou remplissez vous-même « Nom de l'application », « URIs de redirection » et « Portées autorisées » ; pour un serveur sans navigateur, choisissez Machine client. Cliquez sur « Enregistrer le client » et copiez le « Secret client » : il n’est affiché qu’une seule fois.",
  'help.guide.mcp-oauth.step.3':
    'Chaque client dispose de « Renouveler le secret » et « Supprimer le client ». « Sessions OAuth actives » liste les clients connectés, avec « Révoquer ». « Configuration du client » se déplie pour afficher un extrait prêt à l’emploi pour les clients qui utilisent du JSON.',
  'help.guide.mcp-oauth.result':
    'Le client peut consulter et modifier ce que ses autorisations permettent, en votre nom, et chacune de ses actions apparaît sous votre nom.',
  'help.guide.mcp-oauth.tip.1':
    "Les portées limitent ce qu'un client peut faire : accordez-lui uniquement la portée de lecture tant qu'il n'a pas besoin de plus.",
  'help.guide.mcp-oauth.tip.2':
    "L'administrateur peut désactiver MCP pour toute l'instance. Cette section n'est alors pas affichée.",
  // offline-prepare
  'help.guide.offline-prepare.title': 'Rendre des voyages disponibles hors ligne',
  'help.guide.offline-prepare.goal':
    'Enregistrer vos voyages et leurs cartes sur cet appareil avant de perdre la connexion.',
  'help.guide.offline-prepare.step.1':
    'Sous « Que stocker hors ligne », laissez « Stocker les tuiles de carte hors ligne » activé et activez les voyages que vous voulez sur cet appareil. Un voyage terminé n’est stocké que si vous l’activez.',
  'help.guide.offline-prepare.step.2':
    'De retour en haut, sous « Préparer le mode hors ligne », cliquez sur « Télécharger pour une utilisation hors ligne ». TREK récupère les données des voyages, les documents et les tuiles de carte, puis indique combien de voyages ont été stockés.',
  'help.guide.offline-prepare.step.3':
    '« Forcer le mode hors ligne » relance un téléchargement, puis fonctionne uniquement depuis cet appareil : vous pouvez ainsi vérifier que tout est bien là avant de partir.',
  'help.guide.offline-prepare.result':
    'Les voyages s’ouvrent sans connexion. Vos modifications sont mises en file d’attente et envoyées dès votre retour en ligne.',
  'help.guide.offline-prepare.tip.1':
    'Les tuiles de carte occupent le plus de place ; désactivez-les pour ne garder que les données des voyages et les documents.',
  'help.guide.offline-prepare.tip.2':
    'Installez TREK comme application depuis le navigateur pour un démarrage hors ligne plus fluide.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Choisir la version conservée en cas de conflit de synchronisation',
  'help.guide.offline-conflicts.goal':
    'Choisir comment TREK résout un conflit entre une modification faite hors ligne et une modification faite ailleurs.',
  'help.guide.offline-conflicts.step.1':
    'Quand une modification faite hors ligne entre en conflit avec une modification plus récente, « Conflits de synchronisation » apparaît en haut de « Hors ligne ». Pour chaque modification, cliquez sur « La mienne » ou « Conserver la leur ».',
  'help.guide.offline-conflicts.step.2':
    'Dans la même carte, « En cas de conflit » détermine le comportement pour la prochaine fois : « Me demander à chaque fois », « Toujours conserver ma version » ou « Toujours conserver la version du serveur ».',
  'help.guide.offline-conflicts.result':
    'Avec « Me demander à chaque fois », un conflit reste dans « Conflits de synchronisation » jusqu’à ce que vous tranchiez. Avec les deux autres options, TREK le résout automatiquement.',
  'help.guide.offline-conflicts.tip.1':
    '« Vider le cache » supprime uniquement la copie sur cet appareil. Rien ne change sur le serveur.',
  // profile
  'help.guide.profile.title': 'Modifier votre profil',
  'help.guide.profile.goal': 'Mettre à jour votre nom, votre e-mail et votre photo.',
  'help.guide.profile.step.1':
    'Dans la carte « Compte », cliquez sur l’appareil photo de votre image pour en importer une ; la corbeille rouge la supprime et rétablit votre initiale.',
  'help.guide.profile.step.2': 'Modifiez « Nom d’utilisateur » et « E-mail » sous l’image.',
  'help.guide.profile.result':
    'Votre nom et votre photo sont mis à jour partout à la fois, y compris dans les voyages que vous partagez.',
  'help.guide.profile.tip.1': 'Un compte lié par SSO affiche un badge SSO et « Lié avec » suivi de son fournisseur.',
  // password
  'help.guide.password.title': 'Changer votre mot de passe',
  'help.guide.password.goal': 'Définir un nouveau mot de passe.',
  'help.guide.password.step.1':
    'Sous « Changer le mot de passe », saisissez votre « Mot de passe actuel », puis le « Nouveau mot de passe », une seconde fois dans « Confirmer le nouveau mot de passe ». La liste en dessous coche chaque règle respectée au fil de la saisie.',
  'help.guide.password.step.2': 'Cliquez sur « Mettre à jour le mot de passe ».',
  'help.guide.password.result':
    'Le nouveau mot de passe s’applique immédiatement. Tous vos autres appareils sont déconnectés, vos tokens API MCP sont supprimés et les clients OAuth doivent se reconnecter ; cet appareil reste connecté.',
  'help.guide.password.tip.1':
    'Si ce TREK ne permet que la connexion par SSO, il n’y a ni mot de passe TREK ni carte « Changer le mot de passe ».',
  // mfa
  'help.guide.mfa.title': "Activer l'authentification à deux facteurs",
  'help.guide.mfa.goal': "Protéger le compte avec un code fourni par une application d'authentification.",
  'help.guide.mfa.step.1':
    "Sous « Authentification à deux facteurs (2FA) », cliquez sur « Configurer l'authentificateur ».",
  'help.guide.mfa.step.2':
    'Scannez le QR code avec votre application, ou saisissez le secret à la main, puis tapez le code à six chiffres qu’elle affiche et cliquez sur « Activer 2FA ».',
  'help.guide.mfa.step.3':
    'Sauvegardez les codes de secours avec « Copier les codes », « Télécharger TXT » ou « Imprimer / PDF », puis cliquez sur OK. Chaque code ne sert qu’une fois. Utilisez un code si vous n’avez pas votre téléphone.',
  'help.guide.mfa.result': 'Chaque connexion demande un code après le mot de passe.',
  'help.guide.mfa.tip.1':
    '« Désactiver 2FA » demande votre mot de passe et un code en cours de validité ou un code de secours inutilisé.',
  'help.guide.mfa.tip.2':
    "L'administrateur peut rendre la 2FA obligatoire pour tous : vous ne pouvez alors plus la désactiver ici.",
  // passkeys
  'help.guide.passkeys.title': 'Se connecter avec une passkey',
  'help.guide.passkeys.goal':
    "Utiliser l'empreinte digitale, la reconnaissance faciale ou le code PIN de votre appareil à la place d'un mot de passe.",
  'help.guide.passkeys.step.1':
    'Sous « Passkeys », cliquez sur « Ajouter une passkey », confirmez votre mot de passe actuel et donnez-lui un nom qui identifie l’appareil, puis suivez les instructions de votre appareil.',
  'help.guide.passkeys.step.2':
    'Chaque passkey indique si elle est « Synchronisé » ou liée à « Cet appareil », et quand elle a été utilisée pour la dernière fois. « Renommer » change son nom, et le bouton de suppression la supprime après saisie de votre mot de passe.',
  'help.guide.passkeys.result':
    'La page de connexion propose la passkey. Vous pouvez toujours vous connecter avec votre mot de passe.',
  'help.guide.passkeys.tip.1':
    'Une passkey est stockée sur l’appareil ou dans son gestionnaire de mots de passe : ajoutez-en donc une pour chaque appareil.',
  'help.guide.passkeys.tip.2':
    'Les passkeys n’apparaissent qu’une fois activées par l’administrateur. Tant que le serveur n’a pas son domaine WebAuthn, la carte l’indique au lieu de proposer « Ajouter une passkey ».',
  // delete-account
  'help.guide.delete-account.title': 'Supprimer votre compte',
  'help.guide.delete-account.goal': 'Supprimer votre compte et les données qui n’appartiennent qu’à vous.',
  'help.guide.delete-account.step.1':
    'Dans la carte « Compte », cliquez sur « Supprimer le compte », à gauche en bas de la carte, puis sur « Supprimer définitivement ».',
  'help.guide.delete-account.result':
    'Votre compte est supprimé, ainsi que les voyages, lieux et fichiers qui vous appartiennent. Les voyages appartenant à d’autres personnes sont conservés.',
  'help.guide.delete-account.tip.1':
    'Si vous êtes le seul administrateur, TREK affiche « Suppression impossible » : nommez d’abord un autre utilisateur administrateur.',
  'help.guide.delete-account.tip.2':
    'Cette action est irréversible. Exportez ce que vous souhaitez conserver avant de confirmer.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administration',
  'help.ctx.admin.summary':
    'Les réglages de toute l’instance TREK, pour tous les utilisateurs : qui peut se connecter et comment, ce qui est activé, où sont stockés les fichiers, comment le serveur contacte les utilisateurs et comment il est sauvegardé. Seuls les administrateurs voient cette page. La barre latérale regroupe les onglets sous Utilisateurs, Configuration, Intégrations et Maintenance, et chaque onglet est un écran distinct.',
  'help.ctx.admin.bullet.1':
    'L’en-tête affiche à droite le nombre d’utilisateurs, de voyages, de lieux et de fichiers. En dessous, une bannière « Mise à jour disponible » apparaît quand une version plus récente de TREK est disponible.',
  'help.ctx.admin.bullet.2':
    '« Utilisateurs » et « Valeurs par défaut » : les comptes, les liens d’invitation et les permissions, ainsi que les réglages et la carte d’un nouveau compte.',
  'help.ctx.admin.bullet.3':
    '« Personnalisation », « Paramètres », « Extensions », « Plugins » et « Stockage » : modèles de bagages, catégories et vacances scolaires ; connexion, passkeys, 2FA, clés API et fournisseurs de recherche ; les modules fonctionnels ; les plugins tiers ; l’emplacement des fichiers importés.',
  'help.ctx.admin.bullet.4':
    '« Notifications », « Accès MCP » et GitHub : les canaux que les utilisateurs peuvent choisir et leurs réglages par défaut, les tokens et sessions des clients d’IA, et l’historique des versions.',
  'help.ctx.admin.bullet.5':
    'Sauvegarde et audit : sauvegardes à la demande et planifiées, et journal des événements liés à la sécurité.',
  'help.ctx.admin-users.title': 'Utilisateurs',
  'help.ctx.admin-users.summary':
    'Tous les comptes de ce TREK, avec leur rôle, leur e-mail et leur dernière activité, les liens d’invitation qui permettent de s’inscrire sur une instance fermée, et qui peut faire quoi dans les voyages.',
  'help.ctx.admin-users.bullet.1':
    "Le tableau : utilisateur, e-mail, rôle, date de création et « Dernière activité », avec « Modifier l'utilisateur » et « Supprimer l'utilisateur » sur chaque ligne. Un point vert sur l’avatar signifie que la personne est en ligne ; votre propre ligne indique « (Vous) ».",
  'help.ctx.admin-users.bullet.2':
    '« Créer un utilisateur », en haut à droite de la carte « Utilisateurs », ajoute un compte manuellement, avec un mot de passe que vous transmettez à l’utilisateur.',
  'help.ctx.admin-users.bullet.3':
    "« Liens d'invitation », en dessous : des liens d’inscription avec un nombre d’utilisations limité, une date d’expiration et, si vous le souhaitez, un voyage que le nouvel utilisateur rejoint à son inscription.",
  'help.ctx.admin-users.bullet.4':
    '« Paramètres des permissions », en bas : pour chaque action, qui peut l’effectuer (« Tout le monde », « Membres du voyage », « Propriétaire du voyage » ou « Administrateur uniquement »). Cliquez sur « Enregistrer » en haut de la carte pour valider.',
  'help.ctx.admin-defaults.title': 'Valeurs par défaut',
  'help.ctx.admin-defaults.summary':
    'Les réglages de départ d’un nouveau compte, pour que personne n’ait à tout configurer d’abord : mode de couleur, unités, format de l’heure, premier jour de la semaine, devise d’affichage et codes de réservation masqués, ainsi que la carte, ses clés et les serveurs de calcul d’itinéraire.',
  'help.ctx.admin-defaults.bullet.1':
    "« Paramètres utilisateur par défaut », à gauche : « Mode de couleur », « Unité de température », « Unité de distance », « Format de l'heure », « La semaine commence le », « Devise d'affichage » et « Masquer les codes de réservation ».",
  'help.ctx.admin-defaults.bullet.2':
    '« Carte », à droite : « Modèle de carte », « Clé CARTO partagée », « Moteur de calcul d’itinéraire propre » et « Instance Valhalla propre », un aperçu, puis « Moteur cartographique » avec « Style de carte », « Jeton Mapbox partagé », « Bâtiments & terrain en 3D » et « Mode haute qualité ».',
  'help.ctx.admin-config.title': 'Personnalisation',
  'help.ctx.admin-config.summary':
    'Les réglages communs à tous les voyages de l’instance : modèles de bagages, jeu de catégories des lieux et collections, et catalogue des vacances scolaires utilisé par Vacances.',
  'help.ctx.admin-config.bullet.1':
    "Modèles de bagages : des listes nommées de catégories et d'articles, qui servent de point de départ à la liste de bagages d'un voyage.",
  'help.ctx.admin-config.bullet.2':
    'Catégories : nom, icône et couleur des catégories utilisées dans tout TREK, de la fiche de lieu aux Collections, chacune modifiable dans une boîte de dialogue avec aperçu.',
  'help.ctx.admin-config.bullet.3':
    'Vacances scolaires : le catalogue des pays et régions avec leurs périodes de vacances, que chacun peut choisir dans Vacances.',
  'help.ctx.admin-settings.title': 'Paramètres',
  'help.ctx.admin-settings.summary':
    "La façon dont les utilisateurs se connectent et les services externes que le serveur peut utiliser. À gauche : « Méthodes d’authentification », « Connexion par passkey », « Exiger l'authentification à deux facteurs (2FA) » et « Authentification unique (OIDC) ». À droite : « Types de fichiers autorisés » et « Clés API » avec les fournisseurs de recherche et de transports en commun. La « Zone de danger » se trouve en bas.",
  'help.ctx.admin-settings.bullet.1':
    "« Méthodes d’authentification » : connexion par mot de passe, inscription par mot de passe et, une fois OIDC configuré, connexion SSO et provisionnement automatique SSO. « Exiger l'authentification à deux facteurs (2FA) » a sa propre carte.",
  'help.ctx.admin-settings.bullet.2':
    "« Connexion par passkey » : « Activer la connexion par passkey », le « Relying Party ID (domaine) » et les « Origines autorisées ». « Authentification unique (OIDC) » : « Nom d'affichage », « URL de l'émetteur », une URL de découverte facultative, « ID client » et « Secret client ».",
  'help.ctx.admin-settings.bullet.3':
    '« Clés API » : l’« API TREK Places » vient en premier et ne nécessite aucune clé. En dessous figurent la « Clé API Google Maps » (avec « Tester » et « Ce à quoi sert la clé »), la clé Unsplash et la clé Amap, et un seul bouton « Enregistrer » en bas de la carte.',
  'help.ctx.admin-settings.bullet.4':
    '« Fournisseur de transports en commun » et « Fournisseur de recherche de lieux » déterminent qui répond aux recherches de transports et de lieux ; « Journal des recherches de lieux » enregistre le résultat choisi ; « Types de fichiers autorisés » limite les imports.',
  'help.ctx.admin-addons.title': 'Extensions',
  'help.ctx.admin-addons.summary':
    "Les modules de TREK, chacun avec son interrupteur : Bagages, Coûts, Documents, Vacances, Atlas, Collaboration, Journal de voyage, Collections, Road trip, MCP, AirTrail, Dawarich et l'analyse par IA. Désactiver un module supprime pour tout le monde son entrée de navigation, ses routes et son API.",
  'help.ctx.admin-addons.bullet.1':
    'Une tuile par extension avec son interrupteur et, le cas échéant, des sous-lignes pour ses options.',
  'help.ctx.admin-addons.bullet.2':
    'Les fournisseurs de photos et de documents apparaissent aussi ici sous forme de tuiles, pour proposer Immich ou Synology aux utilisateurs.',
  'help.ctx.admin-addons.bullet.3': '« Suivi des bagages » a son propre interrupteur sous les tuiles.',
  'help.ctx.admin-plugins.title': 'Plugins', // same-as-en
  'help.ctx.admin-plugins.summary':
    "Des plugins tiers qui tournent dans leur propre processus à côté de TREK, chacun avec les permissions demandées à l'installation. Installez-les depuis le catalogue, importez un paquet ou liez un dossier pendant le développement d'un plugin.",
  'help.ctx.admin-plugins.bullet.1':
    '« Installé » et « Découvrir », avec « Rechercher des plugins… » et les filtres « Type », « Statut » et « Trier ». Chaque ligne indique la version, « Vérifié », « Signé » ou « Non signé », ce à quoi le plugin peut accéder, avec un interrupteur et un menu ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Les deux icônes de l’en-tête de la carte : « Téléverser un plugin » accepte un .zip, .tgz ou .tar.gz (vous pouvez aussi déposer un .zip sur la page) ; « Réanalyser » détecte un dossier de plugin lié pour le développement.',
  'help.ctx.admin-plugins.bullet.3':
    "« Hôtes autorisés » par plugin : les adresses qu'un plugin peut contacter, car les connexions sortantes sont bloquées par défaut.",
  'help.ctx.admin-storage.title': 'Stockage',
  'help.ctx.admin-storage.summary':
    'L’emplacement des fichiers importés : le disque local ou un bucket S3, avec éventuellement une copie vers d’autres backends. Chaque catégorie de fichiers peut utiliser un backend différent, et rien ne change tant que vous n’avez pas cliqué sur « Enregistrer les modifications ».',
  'help.ctx.admin-storage.bullet.1':
    '« Santé », en haut : les écritures échouées vers une cible miroir, ou « Aucune défaillance de réplique enregistrée. »',
  'help.ctx.admin-storage.bullet.2':
    '« Backends » : nom, type, espace utilisé et cibles de miroir (Mirrored to), avec « Tester », « Modifier » et « Retirer ». « Calculer maintenant » mesure l’espace occupé ; un backend défini par une variable d’environnement est en lecture seule.',
  'help.ctx.admin-storage.bullet.3':
    '« Catégories » : documents de voyage, photos de journal, couvertures, photos de profil, images de lieux, caches de photos et sauvegardes, chacune attribuée à un backend.',
  'help.ctx.admin-notifications.title': 'Notifications', // same-as-en
  'help.ctx.admin-notifications.summary':
    'Les canaux que l’instance propose à ses utilisateurs, et ceux par lesquels vous êtes averti en tant qu’administrateur. Les utilisateurs choisissent leurs propres sujets et URL dans « Paramètres » ; vous décidez de ce qui est disponible et configurez l’e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    '« E-mail (SMTP) », Webhook, Ntfy et Web Push ont chacun un interrupteur pour proposer le canal aux utilisateurs ; l’e-mail nécessite aussi les réglages de son serveur. « Dans l’application » est toujours activé.',
  'help.ctx.admin-notifications.bullet.2':
    '« Rappels de voyage » : le serveur envoie ou non le rappel avant le début d’un voyage.',
  'help.ctx.admin-notifications.bullet.3':
    '« Webhook admin », « Ntfy admin » et la carte « Notifications » : la destination des événements d’administration (« Nouvelle version disponible », « Échec de réplique de stockage », « Région de pagaie demandée »), chacun avec un bouton de test.',
  'help.ctx.admin-mcp-tokens.title': 'Accès MCP',
  'help.ctx.admin-mcp-tokens.summary':
    "Tous les jetons et sessions OAuth dont disposent les clients IA sur cette instance TREK, pour tous les utilisateurs. Vous pouvez révoquer n'importe lequel d'entre eux.",
  'help.ctx.admin-mcp-tokens.bullet.1':
    'Sessions OAuth : le client, les portées qui lui ont été accordées, son propriétaire et la date, avec une icône de corbeille pour révoquer la session.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'Tokens API : nom, propriétaire, « Créé le » et « Dernière utilisation », avec une corbeille pour supprimer le token.',
  'help.ctx.admin-github.title': 'GitHub', // same-as-en
  'help.ctx.admin-github.summary':
    'Les nouveautés de TREK : l’historique des versions publiées sur GitHub, et la disponibilité éventuelle d’une version plus récente que la vôtre. La mise à jour elle-même se fait en dehors de l’application, sur le serveur hôte.',
  'help.ctx.admin-github.bullet.1':
    '« Historique des versions » présente les versions sous forme de chronologie avec leurs notes. La plus récente porte la mention « Dernière », les préversions la mention « Pré-version », et GitHub ouvre la page des versions.',
  'help.ctx.admin-github.bullet.2':
    '« Mise à jour disponible » apparaît sous l’en-tête de la page dès qu’une version plus récente existe ; « Comment mettre à jour » affiche les commandes pour Docker ou le guide de mise à jour pour les autres installations.',
  'help.ctx.admin-backup.title': 'Sauvegarde',
  'help.ctx.admin-backup.summary':
    'Des sauvegardes complètes de la base de données et des fichiers importés, manuelles ou programmées, conservées sur le serveur et téléchargeables en un seul fichier. Utilisez « Restaurer » pour rétablir une sauvegarde.',
  'help.ctx.admin-backup.bullet.1':
    '« Sauvegarde des données » : « Créer une sauvegarde » et « Importer une sauvegarde » en haut de la carte, et la liste des sauvegardes avec « Télécharger », « Restaurer » et une icône de corbeille pour supprimer.',
  'help.ctx.admin-backup.bullet.2':
    '« Importer une sauvegarde » restaure à partir d’un fichier créé sur une autre instance ou à une date antérieure, après la même question que « Restaurer ».',
  'help.ctx.admin-backup.bullet.3':
    "Sauvegarde automatique : activée ou désactivée, « Intervalle », « Exécuter à l'heure » et le jour, et « Supprimer les anciennes sauvegardes après » (de 1 jour à « Conserver indéfiniment »), appliqués avec « Enregistrer ».",
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Le journal des événements de sécurité et d’administration : connexions et échecs de connexion, modifications MFA, modifications d’utilisateurs et de réglages, sauvegardes et restaurations. En lecture seule, des plus récents aux plus anciens.',
  'help.ctx.admin-audit.bullet.1':
    "Une ligne par événement, avec l'heure, l'utilisateur, l'action, la ressource, l'adresse IP et les détails.",
  'help.ctx.admin-audit.bullet.2':
    '« Actualiser », dans l’en-tête de la carte, recharge la liste. Le badge à côté du titre indique le nombre d’entrées chargées sur le total, et « Charger plus » charge les entrées plus anciennes.',
  // create-user
  'help.guide.create-user.title': 'Créer un utilisateur',
  'help.guide.create-user.goal': 'Ajouter un compte manuellement, sans invitation.',
  'help.guide.create-user.step.1':
    'Cliquez sur « Créer un utilisateur » en haut à droite de la carte « Utilisateurs ».',
  'help.guide.create-user.step.2':
    'Saisissez « Nom d’utilisateur », « E-mail » et un « Mot de passe » ; la liste sous le mot de passe indique les règles respectées. Choisissez le « Rôle » : « Utilisateur » ou « Administrateur ».',
  'help.guide.create-user.step.3': 'Cliquez sur « Créer un utilisateur ».',
  'help.guide.create-user.result':
    'Le compte apparaît dans le tableau et peut se connecter immédiatement. Transmettez le mot de passe à la personne par un canal de confiance.',
  'help.guide.create-user.tip.1':
    'Pour une personne qui doit choisir elle-même son mot de passe, préférez un lien d’invitation.',
  'help.guide.create-user.tip.2':
    'Un « Administrateur » voit cette page et peut tout faire. Ce qu’un « Utilisateur » peut faire dans les voyages se règle plus bas, dans « Paramètres des permissions ».',
  // edit-user
  'help.guide.edit-user.title': 'Modifier les informations ou le mot de passe d’un utilisateur',
  'help.guide.edit-user.goal':
    'Renommer un utilisateur, changer son rôle, ou l’aider à se reconnecter après la perte de son mot de passe.',
  'help.guide.edit-user.step.1':
    "Cliquez sur le crayon (« Modifier l'utilisateur ») sur la ligne de l’utilisateur. La boîte de dialogue affiche l’e-mail du compte en haut.",
  'help.guide.edit-user.step.2':
    'Modifiez « Nom d’utilisateur », « E-mail » ou « Rôle », ou saisissez un « Nouveau mot de passe » (laissez vide pour garder l’actuel), puis cliquez sur « Enregistrer ». « Réinitialiser les passkeys », en bas, supprime toutes les passkeys du compte après confirmation.',
  'help.guide.edit-user.result':
    'La modification s’applique immédiatement. Un nouveau mot de passe déconnecte aussi la personne sur tous ses appareils : une ancienne session ne fonctionne donc plus.',
  'help.guide.edit-user.tip.1':
    'Vous ne pouvez pas vous retirer le rôle d’administrateur tant que vous êtes le dernier administrateur.',
  'help.guide.edit-user.tip.2':
    'La réinitialisation des passkeys conserve le mot de passe. La personne ajoute ensuite de nouvelles passkeys dans Paramètres, Compte.',
  // invite-links
  'help.guide.invite-links.title': "Inviter quelqu'un avec un lien",
  'help.guide.invite-links.goal':
    "Permettre à une personne de s'inscrire sur une instance fermée et, si vous le souhaitez, l'ajouter à un voyage.",
  'help.guide.invite-links.step.1':
    "Cliquez sur « Créer un lien » en haut à droite de la carte « Liens d'invitation ».",
  'help.guide.invite-links.step.2':
    'Choisissez « Utilisations max. » (de 1× à 5×, ou ∞) et « Expire après » (de 1 j à 14 j, ou ∞), éventuellement un voyage sous « Ajouter à un voyage (facultatif) », puis cliquez sur « Créer et copier ».',
  'help.guide.invite-links.step.3':
    'Envoyez le lien. Chaque ligne indique combien de fois il a été utilisé, sa date d’expiration, le voyage auquel il donne accès et qui l’a créé, avec « Actif », « Expiré » ou « Épuisé » à côté. « Copier le lien » le copie de nouveau, et la corbeille le supprime.',
  'help.guide.invite-links.result':
    "La personne qui ouvre le lien s'inscrit avec son propre mot de passe. Si un voyage a été choisi, elle le rejoint immédiatement.",
  'help.guide.invite-links.tip.1':
    'Les liens d’invitation fonctionnent même si l’inscription par mot de passe est désactivée dans « Paramètres ».',
  'help.guide.invite-links.tip.2':
    'Un lien à usage unique avec une courte durée de validité est le choix le plus sûr pour une seule personne.',
  // delete-user
  'help.guide.delete-user.title': 'Supprimer un utilisateur',
  'help.guide.delete-user.goal': 'Supprimer un compte et tout ce qui lui appartient.',
  'help.guide.delete-user.step.1':
    "Cliquez sur la corbeille (« Supprimer l'utilisateur ») sur la ligne de l’utilisateur et confirmez avec « Supprimer ».",
  'help.guide.delete-user.result':
    'Le compte est supprimé, ainsi que tous les voyages et journaux qui lui appartiennent, même ceux qu’il partageait avec d’autres. Les voyages dont il n’était que membre restent à leurs propriétaires.',
  'help.guide.delete-user.tip.1': "Cette action est irréversible. En cas de doute, faites d'abord une sauvegarde.",
  'help.guide.delete-user.tip.2':
    'L’icône de corbeille de votre propre ligne est inactive : vous ne pouvez pas vous supprimer vous-même. Un autre administrateur doit s’en charger.',
  // permissions
  'help.guide.permissions.title': 'Définir qui peut faire quoi',
  'help.guide.permissions.goal': "Définir, pour chaque action, quel rôle peut l'effectuer sur cette instance TREK.",
  'help.guide.permissions.step.1':
    'Sous « Paramètres des permissions », repérez l’action dans son groupe, par exemple « Supprimer des voyages » sous « Gestion des voyages », et choisissez qui peut l’effectuer : « Tout le monde », « Membres du voyage », « Propriétaire du voyage » ou « Administrateur uniquement ». Une ligne modifiée est marquée « personnalisé ».',
  'help.guide.permissions.step.2':
    'Cliquez sur « Enregistrer » en haut à droite de la carte. « Réinitialiser par défaut » rétablit le niveau d’origine de chaque ligne ; cliquez ensuite aussi sur « Enregistrer ».',
  'help.guide.permissions.result':
    "La règle s'applique d'un coup à tous les voyages. Les personnes en dessous du niveau requis ne voient plus les boutons et menus correspondants.",
  'help.guide.permissions.tip.1':
    '« Propriétaire du voyage » désigne la personne qui a créé le voyage ; les administrateurs peuvent toujours tout faire.',
  'help.guide.permissions.tip.2':
    'Chaque action a sa propre ligne : vous pouvez par exemple laisser les membres planifier lieux et jours, tout en réservant la suppression du voyage à son propriétaire.',
  // default-map
  'help.guide.default-map.title': 'Définir la carte par défaut des nouveaux utilisateurs',
  'help.guide.default-map.goal': 'Fournir à chaque nouveau compte une carte fonctionnelle sans jeton personnel.',
  'help.guide.default-map.step.1':
    'Sous « Carte », choisissez un « Modèle de carte » ou collez une URL de tuiles, et saisissez une « Clé CARTO partagée » si vous utilisez des tuiles CARTO. L’aperçu en dessous montre le résultat.',
  'help.guide.default-map.step.2':
    'Plus bas, choisissez le « Moteur cartographique » : « Standard (gratuit) », Mapbox (3D) ou MapLibre (OpenFreeMap). Pour Mapbox et MapLibre, choisissez le « Style de carte » ; pour Mapbox, ajoutez le « Jeton Mapbox partagé » et choisissez d’activer ou non « Bâtiments & terrain en 3D » et « Mode haute qualité ».',
  'help.guide.default-map.result':
    'Les nouveaux comptes démarrent avec ces réglages. Ceux qui ont choisi leur propre carte dans les Paramètres la conservent.',
  'help.guide.default-map.tip.1':
    'Un jeton ou une clé saisi ici est partagé par tous ceux qui n’en ont pas, surveillez donc son quota.',
  'help.guide.default-map.tip.2':
    "Les comptes existants qui n'ont jamais rien modifié dans l'onglet de la carte utilisent aussi ces valeurs par défaut.",
  // packing-templates
  'help.guide.packing-templates.title': 'Créer un modèle de bagages',
  'help.guide.packing-templates.goal': "Proposer aux voyages une liste de bagages de départ plutôt qu'une liste vide.",
  'help.guide.packing-templates.step.1': 'Cliquez sur « Nouveau modèle », saisissez un nom et validez avec la coche.',
  'help.guide.packing-templates.step.2':
    'Cliquez sur le nom du modèle pour l’ouvrir, puis sur « Ajouter une catégorie ». Le + en haut d’une catégorie ajoute des articles, et un article n’a besoin que d’un nom.',
  'help.guide.packing-templates.step.3':
    'Tout est enregistré au fur et à mesure. Le crayon renomme un modèle, une catégorie ou un article. La corbeille supprime immédiatement un article. Pour un modèle ou une catégorie, elle demande d’abord confirmation, car tout son contenu est aussi supprimé.',
  'help.guide.packing-templates.result':
    'Le modèle est proposé sur la liste de bagages de chaque voyage ; l’appliquer copie les articles, que chaque voyage peut ensuite modifier librement.',
  'help.guide.packing-templates.tip.1':
    'Un modèle par type de voyage (plage, ville, randonnée) fonctionne mieux qu’une seule liste interminable.',
  'help.guide.packing-templates.tip.2':
    'Supprimer un modèle ne modifie pas les voyages auxquels il a déjà été appliqué.',
  'help.guide.packing-templates.tip.3':
    '« Enregistrer comme modèle », sur la liste de bagages d’un voyage, crée un modèle avec le poids, la quantité et le sac de chaque article. Ces informations s’affichent ici à côté de l’article, et appliquer le modèle range les articles dans les mêmes sacs.',
  // categories
  'help.guide.categories.title': 'Gérer les catégories',
  'help.guide.categories.goal':
    'Choisir les catégories disponibles pour les lieux et les collections, ainsi que leur apparence.',
  'help.guide.categories.step.1':
    'Cliquez sur « Nouvelle catégorie », saisissez le nom dans la ligne de titre de la boîte de dialogue, choisissez une « Icône » et une « Couleur », et vérifiez l’« Aperçu ». Cliquez sur « Créer ».',
  'help.guide.categories.step.2':
    'Dans la liste, le crayon (« Modifier ») ouvre une catégorie, et « Mettre à jour » l’enregistre. La corbeille (« Supprimer ») la supprime après confirmation.',
  'help.guide.categories.result':
    "Les catégories s'appliquent partout à la fois : dans l'inspecteur de lieu, sur les repères de la carte, dans les Collections et dans les filtres.",
  'help.guide.categories.tip.1':
    'Les lieux conservent l’identifiant de leur catégorie : renommer une catégorie la renomme donc sur tous les lieux.',
  'help.guide.categories.tip.2':
    'Quand vous supprimez une catégorie, ses lieux n’ont plus de catégorie. Si c’est important, attribuez-les d’abord à une autre catégorie.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Gérer les vacances scolaires à la main',
  'help.guide.school-holiday-catalog.goal':
    'Gérer les vacances scolaires d’un pays ou d’une région, que chacun peut ensuite choisir dans Vacances.',
  'help.guide.school-holiday-catalog.step.1':
    'Sous « Vacances scolaires », choisissez le « Pays », ou cliquez sur + (« Ajouter un pays »), saisissez le « Pays » et son « Code du pays (ex. US) », puis enregistrez. « Ajouter une région » ajoute chacune de ses parties qui a ses propres dates.',
  'help.guide.school-holiday-catalog.step.2':
    'Cliquez sur une région pour ouvrir « Région ou district scolaire » : « Ajouter une période », donnez à chacune un « Nom des vacances », une « Date de début » et une « Date de fin », puis enregistrez. La corbeille supprime une période ou une région ; un pays peut être supprimé dès qu’il n’a plus de région.',
  'help.guide.school-holiday-catalog.result':
    'Les utilisateurs choisissent le pays et la région dans les Paramètres de Vacances et voient les périodes sur leur grille annuelle.',
  'help.guide.school-holiday-catalog.tip.1':
    'Une région déjà choisie par quelqu’un dans son calendrier Vacances ne peut pas être supprimée.',
  // auth-methods
  'help.guide.auth-methods.title': 'Choisir les modes de connexion',
  'help.guide.auth-methods.goal':
    "Activer ou désactiver la connexion par mot de passe, le SSO et l'inscription, et rendre la 2FA obligatoire.",
  'help.guide.auth-methods.step.1':
    'Sous « Méthodes d’authentification », activez ou désactivez la connexion par mot de passe et l’inscription par mot de passe ; chaque interrupteur s’applique immédiatement. Si l’inscription est désactivée, les nouveaux comptes ne peuvent venir que des liens d’invitation, du SSO ou de « Créer un utilisateur ».',
  'help.guide.auth-methods.step.2':
    "« Connexion SSO » et « SSO Auto-Provisioning » nécessitent que « Authentification unique (OIDC) » soit configurée plus bas. Le provisionnement automatique crée un compte la première fois qu'une personne se connecte via SSO.",
  'help.guide.auth-methods.step.3':
    "Activez « Exiger l'authentification à deux facteurs (2FA) » pour obliger toute personne sans 2FA à la configurer dans « Paramètres » avant de pouvoir utiliser TREK.",
  'help.guide.auth-methods.result':
    'La page de connexion propose exactement les méthodes que vous avez laissées activées.',
  'help.guide.auth-methods.tip.1':
    'TREK ne vous laisse pas désactiver la dernière méthode de connexion : son interrupteur devient gris, et l’info-bulle indique « Au moins une méthode de connexion doit rester activée ».',
  'help.guide.auth-methods.tip.2':
    'Si OIDC_ONLY est défini sur le serveur, les interrupteurs liés au mot de passe sont verrouillés et une remarque le signale.',
  // oidc
  'help.guide.oidc.title': 'Connecter l’authentification unique',
  'help.guide.oidc.goal': 'Permettre aux utilisateurs de se connecter avec votre fournisseur d’identité.',
  'help.guide.oidc.step.1':
    "Sous « Authentification unique (OIDC) », saisissez le « Nom d'affichage » du bouton, l’« URL de l'émetteur », l’« ID client » et le « Secret client » fournis par votre fournisseur. Ne remplissez « URL de découverte (facultative) » que si votre fournisseur ne la publie pas à l’adresse habituelle, comme c’est le cas avec Authentik. Cliquez sur « Enregistrer ».",
  'help.guide.oidc.step.2': "Activez « Connexion SSO » sous « Méthodes d'authentification ».",
  'help.guide.oidc.result':
    'La page de connexion affiche le bouton SSO. Avec « SSO Auto-Provisioning » activé, les utilisateurs qui se connectent pour la première fois reçoivent automatiquement un compte.',
  'help.guide.oidc.tip.1':
    "L'URI de redirection demandée par votre fournisseur correspond à l'adresse de votre instance TREK suivie du chemin de rappel OIDC indiqué dans la documentation.",
  'help.guide.oidc.tip.2':
    'Le mappage des claims détermine quels groupes SSO deviennent administrateurs. Consultez la page OIDC de la documentation.',
  // instance-keys
  'help.guide.instance-keys.title': 'Saisir les clés API',
  'help.guide.instance-keys.goal':
    'Activer pour toute l’instance les photos et notes Google, les couvertures Unsplash et la recherche Amap.',
  'help.guide.instance-keys.step.1':
    "Sous « Clés API », l’« API TREK Places », en haut, assure déjà la recherche de lieux sans clé. « Ce qu'il contient » indique ce qu’elle couvre et ce qu’elle ne couvre pas.",
  'help.guide.instance-keys.step.2':
    "Pour les photos, les notes et les horaires d’ouverture, collez une « Clé API Google Maps » et cliquez sur « Tester » ; le résultat indique « Connecté » ou « Invalide ». Ouvrez « Ce à quoi sert la clé » et n’activez que ce que vous acceptez de voir facturé : « Photos de lieux », « Autocomplétion des lieux », « Détails du lieu », « Enrichissement des lieux » et « Rechercher uniquement avec Google », ainsi qu’une « Limite quotidienne d'appels à Google ».",
  'help.guide.instance-keys.step.3':
    'Collez la « Clé API Unsplash » pour la recherche de couvertures et la « Clé API Amap (高德地图) » pour la recherche de lieux en Chine continentale, puis cliquez sur « Enregistrer » en bas de la carte.',
  'help.guide.instance-keys.result':
    'Les utilisateurs profitent des fonctionnalités sans avoir leurs propres clés. Sans clé Google, la recherche s’appuie sur l’API TREK Places et OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Si un utilisateur a une clé personnelle dans « Paramètres », TREK l’utilise pour lui à la place de la clé de l’instance.',
  'help.guide.instance-keys.tip.2':
    'Les clés peuvent aussi provenir de variables d’environnement ; elles apparaissent alors ici en lecture seule.',
  'help.guide.instance-keys.tip.3':
    "« Limite quotidienne d'appels à Google » plafonne ce que TREK peut dépenser chaque jour sur la clé. Le badge à côté du titre compte les appels du jour. Une fois la limite atteinte, les recherches passent par OpenStreetMap jusqu'au lendemain (UTC).",
  // places-transit
  'help.guide.places-transit.title': 'Choisir les fournisseurs de recherche et de transports en commun',
  'help.guide.places-transit.goal':
    "Choisir le service qui répond aux recherches de lieux et aux demandes d'itinéraires en transports en commun.",
  'help.guide.places-transit.step.1':
    'Sous « Fournisseur de transports en commun », choisissez « Transitous (gratuit) », sans clé et le plus complet en Europe, ou Google, qui utilise la clé Google. Le choix est enregistré immédiatement.',
  'help.guide.places-transit.step.2':
    'Sous « Fournisseur de recherche de lieux », choisissez le service que TREK interroge quand l’index TREK et OpenStreetMap ne trouvent rien : « Automatique » (Google si une clé existe, sinon Amap), Google Places, Amap (高德地图) ou OpenStreetMap.',
  'help.guide.places-transit.result':
    'Tous les champs de recherche et tous les itinéraires en transports en commun de TREK utilisent ce choix.',
  'help.guide.places-transit.tip.1':
    'Un choix sans la clé correspondante affiche un avertissement ici. La recherche de lieux n’utilise alors que l’index TREK et OpenStreetMap, et les transports en commun uniquement Transitous.',
  'help.guide.places-transit.tip.2':
    'Les itinéraires en transports en commun Google sont facturés à la requête, contrairement à Transitous.',
  // file-types
  'help.guide.file-types.title': 'Limiter les types de fichiers',
  'help.guide.file-types.goal': 'Choisir les extensions de fichiers autorisées à l’import.',
  'help.guide.file-types.step.1':
    'Sous « Types de fichiers autorisés », modifiez la liste d’extensions séparées par des virgules, ou saisissez * pour autoriser tous les types, puis cliquez sur « Enregistrer ».',
  'help.guide.file-types.result':
    'Les fichiers de tout autre type sont refusés avec un message explicite, que ce soit dans les documents, le journal ou les couvertures.',
  'help.guide.file-types.tip.1':
    "Laissez les types d'images dans la liste : les couvertures et les photos des journaux sont contrôlées avec cette même liste.",
  // toggle-addon
  'help.guide.toggle-addon.title': 'Activer ou désactiver une extension',
  'help.guide.toggle-addon.goal': 'Rendre un module disponible pour tout le monde, ou le retirer.',
  'help.guide.toggle-addon.step.1':
    'Cliquez sur l’interrupteur de la tuile de l’extension. L’entrée de navigation apparaît ou disparaît immédiatement pour tout le monde.',
  'help.guide.toggle-addon.step.2':
    'Certaines tuiles ont des sous-lignes pour leurs options, comme « Suivi des bagages » sous « Listes » ou les fournisseurs de photos sous « Journal de voyage » ; elles n’apparaissent que si l’extension est activée.',
  'help.guide.toggle-addon.result':
    'Quand vous désactivez une extension, ses données sont conservées. Quand vous la réactivez, elles réapparaissent.',
  'help.guide.toggle-addon.tip.1':
    "Désactiver MCP supprime le point d'accès ainsi que les sections « Intégrations » qui en dépendent.",
  'help.guide.toggle-addon.tip.2':
    'Vacances, Atlas et Journal de voyage sont les extensions les plus demandées. Documents nécessite un espace de stockage pour les fichiers importés.',
  // install-plugin
  'help.guide.install-plugin.title': 'Installer un plugin',
  'help.guide.install-plugin.goal': "Ajouter un plugin tiers et lui accorder exactement les permissions qu'il demande.",
  'help.guide.install-plugin.step.1':
    'Ouvrez « Découvrir », trouvez un plugin avec « Rechercher des plugins… » ou le filtre « Type », et cliquez sur « Installer ». Pour un fichier de paquet, cliquez sur « Téléverser un plugin » (l’icône de nuage en haut à droite de la carte), ou déposez le .zip sur la page.',
  'help.guide.install-plugin.step.2':
    'Sous « Installé », lisez la ligne : ce à quoi le plugin peut accéder, les hôtes auxquels il se connecte, et s’il est « Vérifié » et « Signé ». Activez ensuite « Activer le plugin » ; la ligne affiche « Actif ».',
  'help.guide.install-plugin.step.3':
    "Le menu ⋯ de la ligne propose « Redémarrer », « Voir le journal d'erreurs », « Hôtes autorisés » et « Changer de version… », ainsi que les liens vers le code source ; « Supprimer » désinstalle le plugin et ses données. Une version plus récente apparaît comme mise à jour sur la ligne, et une version qui demande de nouveaux droits reste désactivée tant que vous ne les avez pas approuvés.",
  'help.guide.install-plugin.result':
    'Le plugin s’exécute dans son propre processus. Tout ce qu’il ajoute, comme des widgets, des couches de carte ou des outils, apparaît à l’endroit défini par le plugin.',
  'help.guide.install-plugin.tip.1':
    '« Réanalyser » détecte un dossier de plugin lié pour le développement, sans paquet.',
  'help.guide.install-plugin.tip.2':
    'Un plugin non signé est signalé comme tel ; ne l’installez que si vous faites confiance à sa source.',
  // storage-backends
  'help.guide.storage-backends.title': 'Déplacer les fichiers importés vers S3 ou les dupliquer',
  'help.guide.storage-backends.goal':
    'Stocker les fichiers sur un stockage objet, ou copier chaque fichier importé vers un second backend.',
  'help.guide.storage-backends.step.1':
    'Sous « Backends », cliquez sur « Ajouter un backend », donnez-lui un « Nom », choisissez le « Type », « Local » ou « S3 », et remplissez ses champs. Pour conserver une copie ailleurs, cochez les « Cibles du miroir ». Cliquez sur « Appliquer », puis sur « Tester » sur la nouvelle ligne pour vérifier la connexion.',
  'help.guide.storage-backends.step.2':
    'Sous « Catégories », attribuez chaque type de fichier importé, par exemple « Documents de voyage », « Photos du journal de voyage » ou « Sauvegardes », à un backend.',
  'help.guide.storage-backends.step.3':
    'Cliquez sur « Enregistrer les modifications » en bas. Si une catégorie pointe désormais ailleurs, TREK vous demande s’il faut « Déplacer les objets existants » ou « Router uniquement les nouvelles écritures ».',
  'help.guide.storage-backends.result':
    'Les nouveaux fichiers importés vont vers le backend attribué. Les fichiers déplacés sont servis depuis celui-ci, et ce que vous avez choisi de ne pas déplacer reste à sa place.',
  'help.guide.storage-backends.tip.1':
    "Un backend configuré par variables d'environnement est affiché, mais ne peut pas être modifié ici.",
  'help.guide.storage-backends.tip.2':
    'Une cible miroir reçoit une copie de chaque nouvelle écriture ; « Synchroniser maintenant », sur la ligne, copie ce qui était stocké auparavant. Une cible lente ralentit tous les imports sur ce backend.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurer les canaux de notification',
  'help.guide.channels-instance.goal': "Choisir les canaux proposés aux utilisateurs et configurer l'e-mail.",
  'help.guide.channels-instance.step.1':
    'Activez « E-mail (SMTP) » dans l’en-tête de sa carte, saisissez SMTP Host, SMTP Port, SMTP User, SMTP Password et l’adresse d’expéditeur, puis cliquez sur « Enregistrer ». « Envoyer un e-mail de test » vous envoie un e-mail. « Ignorer la vérification du certificat TLS » ne sert que pour un serveur de messagerie local doté de son propre certificat.',
  'help.guide.channels-instance.step.2':
    'Activez Webhook, Ntfy et Web Push pour les proposer. Les utilisateurs saisissent alors leur propre URL ou sujet, ou activent le push appareil par appareil, dans Paramètres, Notifications.',
  'help.guide.channels-instance.step.3':
    '« Rappels de voyage » active le rappel envoyé avant le début d’un voyage ; « Dans l’application » est toujours activé.',
  'help.guide.channels-instance.result':
    "L'onglet Notifications de chaque utilisateur affiche les canaux que vous avez activés.",
  'help.guide.channels-instance.tip.1':
    'L’« URL du serveur Ntfy » de la carte « Ntfy admin » sert aussi de serveur par défaut pour les utilisateurs. Ceux-ci peuvent toujours définir leur propre serveur.',
  'help.guide.channels-instance.tip.2':
    'Les canaux de plugin apparaissent automatiquement dès qu’un plugin doté de cette capacité est actif.',
  // admin-channels
  'help.guide.admin-channels.title': 'Recevoir les événements d’administration sur votre téléphone',
  'help.guide.admin-channels.goal':
    'Être averti des nouvelles versions, des échecs de réplication du stockage et des demandes de région de pagaie.',
  'help.guide.admin-channels.step.1':
    "Sous « Ntfy admin », saisissez le « Sujet admin » et, si besoin, l’« URL du serveur Ntfy » et un « Jeton d'accès (optionnel) » ; sous « Webhook admin », une URL. Cliquez sur « Enregistrer » dans chaque carte.",
  'help.guide.admin-channels.step.2':
    'Cliquez sur « Envoyer un Ntfy de test » ou « Envoyer un webhook de test » pour vérifier qu’un message arrive.',
  'help.guide.admin-channels.result':
    'Les événements d’administration sont envoyés à chaque administrateur dans l’application et, si vous les avez activés, au sujet ntfy et au webhook d’administration.',
  'help.guide.admin-channels.tip.1':
    "Séparez le canal d'administration de votre canal personnel, pour que les alertes de panne ne se perdent pas au milieu des messages de voyage.",
  'help.guide.admin-channels.tip.2':
    'Le webhook et le sujet d’administration sont distincts de vos propres canaux définis dans Paramètres, Notifications.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': "Révoquer l'accès des IA",
  'help.guide.mcp-tokens-admin.goal':
    "Voir et révoquer tous les jetons et sessions détenus par un client IA, pour n'importe quel utilisateur.",
  'help.guide.mcp-tokens-admin.step.1':
    'Sous « Sessions OAuth », repérez le client par son nom et son propriétaire ; ses pastilles indiquent les portées qui lui ont été accordées. La corbeille révoque la session après confirmation.',
  'help.guide.mcp-tokens-admin.step.2':
    'Sous « Tokens API », même principe pour les tokens : nom, propriétaire, « Créé le » et « Dernière utilisation ». La corbeille supprime le token, et le client cesse immédiatement de fonctionner.',
  'help.guide.mcp-tokens-admin.result': "L'utilisateur du client doit le reconnecter. Rien d'autre ne change.",
  'help.guide.mcp-tokens-admin.tip.1':
    'Les portées indiquent ce qu’un client pourrait faire ; une portée en lecture seule peut être conservée sans risque.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Désactiver l’extension MCP arrête tous les clients d’un coup et masque cet onglet, sans rien supprimer : les tokens fonctionnent de nouveau dès qu’elle est réactivée.',
  // release-history
  'help.guide.release-history.title': 'Vérifier si une nouvelle version est disponible',
  'help.guide.release-history.goal': 'Savoir si votre TREK est à jour et ce qu’apporte la prochaine version.',
  'help.guide.release-history.step.1':
    'Quand une version plus récente existe, « Mise à jour disponible » s’affiche sous l’en-tête de la page avec la version que vous utilisez. « Voir sur GitHub » ouvre la version, et « Comment mettre à jour » affiche les commandes pour Docker ou le guide de mise à jour pour les autres installations.',
  'help.guide.release-history.step.2':
    "« Historique des versions » liste toutes les versions avec leurs notes. « Afficher les détails » les déplie, la version la plus récente porte l'étiquette « Dernière » et « Charger plus » affiche les versions plus anciennes.",
  'help.guide.release-history.result':
    "La mise à jour se fait sur l'hôte, en récupérant la nouvelle image ou en compilant le nouveau tag. Le répertoire de données est conservé.",
  'help.guide.release-history.tip.1':
    "Faites une sauvegarde avant une mise à jour. L'onglet « Sauvegarde » se trouve juste à côté.",
  'help.guide.release-history.tip.2':
    'Les préversions sont affichées, mais ne sont pas annoncées comme mises à jour, sauf si vous utilisez vous-même une préversion.',
  // create-backup
  'help.guide.create-backup.title': 'Créer et restaurer une sauvegarde',
  'help.guide.create-backup.goal':
    'Sauvegarder toute l’instance, en conserver une copie ailleurs et pouvoir la restaurer.',
  'help.guide.create-backup.step.1':
    'Sous « Sauvegarde des données », cliquez sur « Créer une sauvegarde » en haut à droite. La base de données et les fichiers importés sont enregistrés dans un seul fichier sur le serveur.',
  'help.guide.create-backup.step.2':
    '« Télécharger » conserve une copie hors du serveur ; la corbeille supprime les anciennes sauvegardes après confirmation.',
  'help.guide.create-backup.step.3':
    '« Restaurer » sur une sauvegarde, ou « Importer une sauvegarde » avec un fichier, remplace toutes les données actuelles dès que vous cliquez sur « Oui, restaurer » dans « Restaurer la sauvegarde ? ».',
  'help.guide.create-backup.result':
    'Une restauration rétablit les utilisateurs, les voyages, les fichiers et les réglages exactement tels qu’ils étaient dans cette sauvegarde.',
  'help.guide.create-backup.tip.1':
    'La restauration est la seule action irréversible de cette page. Créez d’abord une nouvelle sauvegarde.',
  'help.guide.create-backup.tip.2':
    "Les sauvegardes sont stockées dans le répertoire de données. Copiez-les sur une autre machine pour qu'elles restent à l'abri si celle-ci tombe en panne.",
  // auto-backup
  'help.guide.auto-backup.title': 'Planifier les sauvegardes',
  'help.guide.auto-backup.goal':
    'Laisser le serveur se sauvegarder automatiquement et supprimer les anciennes sauvegardes.',
  'help.guide.auto-backup.step.1':
    "Sous « Sauvegarde automatique », activez « Activer la sauvegarde automatique » et choisissez l’« Intervalle » (« Toutes les heures », « Quotidien », « Hebdomadaire » ou « Mensuel »), « Exécuter à l'heure » et, pour une sauvegarde hebdomadaire ou mensuelle, le « Jour de la semaine » ou le « Jour du mois ».",
  'help.guide.auto-backup.step.2':
    'Sous « Supprimer les anciennes sauvegardes après », choisissez la durée de conservation d’une sauvegarde, de « 1 jour » à « Conserver indéfiniment », puis cliquez sur « Enregistrer ».',
  'help.guide.auto-backup.result':
    'Les sauvegardes apparaissent dans la liste selon la fréquence choisie. Les sauvegardes plus anciennes que la durée choisie sont supprimées.',
  'help.guide.auto-backup.tip.1':
    "« Exécuter à l'heure » utilise l’heure du serveur ; l’indication en dessous précise le fuseau horaire du serveur.",
  'help.guide.auto-backup.tip.2':
    'L’espace de stockage du serveur est limité : 7 ou 14 jours suffisent généralement, avec une copie téléchargée conservée ailleurs.',
  // audit-log
  'help.guide.audit-log.title': "Consulter le journal d'audit",
  'help.guide.audit-log.goal': 'Savoir qui a fait quoi, et quand.',
  'help.guide.audit-log.step.1':
    'Parcourez les lignes, des plus récentes aux plus anciennes : « Heure », « Utilisateur », « Action », « Ressource », « IP » et « Détails ». Chaque action porte le nom de ce qui s’est passé, par exemple une connexion échouée, une modification de MFA ou une restauration.',
  'help.guide.audit-log.step.2':
    '« Actualiser », en haut à droite, recharge la liste. Le badge à côté du titre indique le nombre d’entrées chargées sur le total, et « Charger plus » charge les entrées plus anciennes.',
  'help.guide.audit-log.result':
    'Vous disposez d’un historique à montrer à quiconque demande pourquoi quelque chose a changé.',
  'help.guide.audit-log.tip.1': 'Les heures sont affichées dans le fuseau horaire du serveur.',
  'help.guide.audit-log.tip.2':
    'Le journal ne fait qu’ajouter des entrées : rien ne peut y être modifié ni supprimé depuis l’application.',
  // document-providers
  'help.guide.document-providers.title': 'Proposer un stockage de documents',
  'help.guide.document-providers.goal': 'Choisir avec quels stockages un voyage peut synchroniser ses documents.',
  'help.guide.document-providers.step.1':
    'La tuile « Documents » liste les stockages sous forme de lignes : Paperless-ngx, Papra, Nextcloud, OpenCloud et Synology Drive. Tous les cinq sont désactivés au départ, et ces lignes n’apparaissent que si « Documents » lui-même est activé.',
  'help.guide.document-providers.step.2':
    'Activez l’interrupteur de la ligne Nextcloud. Le message « Extension mise à jour » s’affiche, et les propriétaires de voyage trouvent désormais « Synchronisation des documents » dans l’onglet « Fichiers » de leurs voyages, avec Nextcloud sous « Connecter un fournisseur ».',
  'help.guide.document-providers.result':
    'Le stockage est disponible dans tous les voyages de ce TREK. Rien n’est connecté tant qu’un propriétaire de voyage ne l’a pas fait.',
  'help.guide.document-providers.tip.1':
    "Vous décidez seulement ici si un stockage peut être proposé. L'adresse et les identifiants sont propres à chaque voyage : c'est le propriétaire du voyage qui les saisit dans son onglet « Fichiers », jamais dans le panneau d'administration.",
  'help.guide.document-providers.tip.2':
    'Désactiver Documents désactive aussi tous les stockages, et vous ne pouvez pas activer un stockage tant que Documents est désactivé : le serveur répond « Enable the Documents addon first ». Un stockage sur votre propre réseau nécessite aussi ALLOW_INTERNAL_NETWORK=true sur le serveur.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Voyage',
  'help.ctx.trip.summary':
    'Tout ce qui concerne un voyage : le programme avec ses jours, sa carte et ses lieux, et les onglets des sorties, transports, réservations, listes, coûts, fichiers, de la collaboration et d’un journal lié. Chacun a son propre écran d’aide, sous celui-ci.',
  'help.ctx.trip.bullet.1':
    'La barre d’onglets sous la barre supérieure : « Prévu », « Sorties », « Transports », « Réservations », « Listes », « Coûts », « Fichiers », « Collaboration » et, si un journal est lié, « Journal ». Les extensions et les plugins déterminent quels onglets existent sur votre TREK.',
  'help.ctx.trip.bullet.2':
    '« Prévu » comporte trois colonnes : les jours à gauche, la carte au centre, les lieux à droite. Avec l’extension Road trip, la colonne des jours commence par un sélecteur « Jours » / « Road trip » ; avec l’extension Sorties, la colonne des lieux commence par « Lieux » / « Sorties ». Les réservations et les transports font partie du programme, au niveau des étapes et entre elles ; les onglets les répertorient.',
  'help.ctx.trip.bullet.3':
    '« Paramètres du voyage », la pastille à côté du nom du voyage en haut à gauche, ouvre les réglages du voyage : « Personnes » (membres et invités), « Partagé » (le lien public en lecture seule et le lien d’invitation) et « Journal ».',
  'help.ctx.trip.bullet.4':
    'Le titre, les dates, la couverture et la devise se modifient depuis « Mes voyages », avec le crayon de la carte du voyage. Le nom du voyage, en haut à gauche, vous y ramène.',
  'help.ctx.trip.bullet.5':
    'L’onglet au bord intérieur d’une colonne la replie, et la carte occupe l’espace libéré. Une colonne repliée laisse une petite tuile dans le coin supérieur de la carte ; cliquez dessus pour réafficher la colonne. Faites glisser le fin séparateur à côté d’une colonne pour changer sa largeur.',
  'help.ctx.trip.bullet.6':
    'La flèche d’annulation dans la barre d’outils des jours annule vos dernières modifications du programme, une par une.',
  // add-member
  'help.guide.add-member.title': 'Ajouter un membre',
  'help.guide.add-member.goal': 'Donner accès à ce voyage à une personne qui a un compte TREK.',
  'help.guide.add-member.step.1':
    'Cliquez sur « Paramètres du voyage », la pastille à côté du nom du voyage en haut à gauche. Ils s’ouvrent sur « Personnes ».',
  'help.guide.add-member.step.2':
    'Sous « Inviter un utilisateur », choisissez la personne dans « Sélectionner un utilisateur… » et cliquez sur « Inviter ».',
  'help.guide.add-member.step.3':
    "La personne apparaît maintenant sous « Accès ». Le badge « Propriétaire » signale le propriétaire. « Retirer l'accès », en bout de ligne, retire la personne après confirmation.",
  'help.guide.add-member.result':
    "Le membre peut voir et modifier le voyage comme vous, dans les limites fixées par l'administrateur dans « Paramètres des permissions ».",
  'help.guide.add-member.tip.1':
    "Une personne absente de la liste n'a pas encore de compte TREK : ajoutez-la comme invitée, ou laissez-la s'inscrire via un lien d'invitation.",
  'help.guide.add-member.tip.2':
    'Le chiffre à côté de « Accès » compte les participants du voyage ; les invités sont listés à part, en dessous.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Inviter par lien',
  'help.guide.trip-invite-link.goal': 'Permettre à d’autres personnes de rejoindre le voyage par elles-mêmes.',
  'help.guide.trip-invite-link.step.1':
    "Cliquez sur « Paramètres du voyage » à côté du nom du voyage et choisissez « Partagé » à gauche. Sous « Lien d'invitation au voyage », cliquez sur « Créer un lien d'invitation ».",
  'help.guide.trip-invite-link.step.2':
    "Cliquez sur « Copier » et envoyez le lien. Toute personne disposant d'un compte TREK qui l'ouvre rejoint le voyage en tant que membre.",
  'help.guide.trip-invite-link.step.3':
    "« Régénérer » remplace le lien, et l'ancien cesse de fonctionner. « Désactiver » le désactive.",
  'help.guide.trip-invite-link.result':
    'Toute personne qui ouvre le lien rejoint le voyage et apparaît sous « Accès ».',
  'help.guide.trip-invite-link.tip.1':
    "Une personne sans compte ne peut pas l'utiliser. Un administrateur crée des liens d'inscription dans Administration, Utilisateurs, et peut en associer un à ce voyage.",
  'help.guide.trip-invite-link.tip.2':
    'Si vous avez envoyé le lien dans la mauvaise conversation, régénérez-le : l’ancien lien cesse immédiatement de fonctionner.',
  // add-guest
  'help.guide.add-guest.title': 'Ajouter un invité sans compte',
  'help.guide.add-guest.goal': 'Ajouter au voyage une personne qui n’utilise pas TREK.',
  'help.guide.add-guest.step.1':
    'Cliquez sur « Paramètres du voyage » à côté du nom du voyage. Dans « Personnes », la section « Invités » se trouve tout en bas, sous « Accès ».',
  'help.guide.add-guest.step.2': "Saisissez le nom dans « Nom de l'invité » et cliquez sur « Ajouter un invité ».",
  'help.guide.add-guest.result':
    "L'invité peut être associé à des dépenses, des articles de bagages et des tâches, mais ne peut pas se connecter.",
  'help.guide.add-guest.tip.1':
    "« Renommer » (le crayon) change le nom d’un invité. « Retirer l'accès » (la corbeille) retire l’invité après confirmation : ses attributions sont supprimées, et sa part de chaque dépense est répartie entre les autres participants à cette dépense.",
  'help.guide.add-guest.tip.2':
    "Si la personne crée un compte plus tard, invitez-la comme membre et supprimez l'invité.",
  // public-link
  'help.guide.public-link.title': 'Publier un lien en lecture seule',
  'help.guide.public-link.goal': 'Montrer le voyage à des personnes qui ne doivent pas le modifier.',
  'help.guide.public-link.step.1':
    'Cliquez sur « Paramètres du voyage » à côté du nom du voyage et choisissez « Partagé » à gauche.',
  'help.guide.public-link.step.2':
    'Dans la carte « Lien public », activez ce que le lien peut afficher. « Carte et plan » est toujours activé ; « Réservations », « Bagages », « Coûts » et la discussion sont à votre choix.',
  'help.guide.public-link.step.3':
    'Sous « Options », « Trajets et hébergements uniquement » exclut les activités, les notes de jour et les jours vides. « Sans photos » exclut les photos des lieux.',
  'help.guide.public-link.result':
    'Toute personne qui a le lien voit les parties choisies sans se connecter et ne peut rien modifier.',
  'help.guide.public-link.tip.1':
    'Le lien n’est répertorié nulle part, mais toute personne qui l’a peut l’ouvrir. Gardez-le aussi confidentiel qu’un mot de passe.',
  'help.guide.public-link.tip.2': 'Pour donner des droits de modification, ajoutez plutôt la personne comme membre.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Transférer le voyage ou le quitter',
  'help.guide.transfer-ownership.goal': "Désigner un autre propriétaire, ou quitter un voyage qui n'est pas le vôtre.",
  'help.guide.transfer-ownership.step.1':
    'Cliquez sur « Paramètres du voyage » à côté du nom du voyage. Sous « Accès », cliquez sur « Définir comme propriétaire » (la couronne) sur la ligne d’un membre et confirmez.',
  'help.guide.transfer-ownership.step.2':
    '« Quitter le voyage », sur votre propre ligne, vous retire du voyage après confirmation. Si vous en êtes le propriétaire, transférez d’abord la propriété.',
  'help.guide.transfer-ownership.result':
    'Le nouveau propriétaire gère les membres et peut supprimer le voyage. Vous restez un membre ordinaire.',
  'help.guide.transfer-ownership.tip.1':
    'Le propriétaire est la personne qui a créé le voyage, tant que la propriété n’a pas été transférée. Seul le propriétaire peut supprimer le voyage.',
  'help.guide.transfer-ownership.tip.2':
    "« Retirer l'accès » sur la ligne d’un autre membre fonctionne dans l’autre sens : le propriétaire retire ce membre du voyage.",
  // collapse-columns
  'help.guide.collapse-columns.title': 'Agrandir la carte',
  'help.guide.collapse-columns.goal': "Replier une colonne ou l'élargir.",
  'help.guide.collapse-columns.step.1':
    "Cliquez sur l'onglet, avec l'icône de panneau, au bord intérieur de la colonne des jours pour la replier : la carte occupe l'espace libéré. La colonne des lieux dispose du même onglet.",
  'help.guide.collapse-columns.step.2':
    'Quand une colonne est repliée, une petite tuile avec l’icône du panneau apparaît dans le coin supérieur de la carte ; son info-bulle indique « Prévu » ou « Lieux ». Cliquez dessus pour réafficher la colonne.',
  'help.guide.collapse-columns.step.3':
    'Faites glisser le fin séparateur entre une colonne et la carte pour modifier la largeur de la colonne.',
  'help.guide.collapse-columns.result':
    'Les largeurs sont mémorisées. Les colonnes sont de nouveau ouvertes à votre prochaine visite.',
  'help.guide.collapse-columns.tip.1': 'Vous pouvez replier les deux colonnes à la fois pour n’afficher que la carte.',
  'help.guide.collapse-columns.tip.2':
    'Dans une fenêtre étroite, une seule colonne tient à l’écran : en ouvrir une replie l’autre. Sur téléphone, il n’y a pas de colonnes ; « Voyage », « Prévu » et « Lieux », en haut, permettent de passer d’une vue à l’autre.',
  // undo-change
  'help.guide.undo-change.title': 'Annuler la dernière modification',
  'help.guide.undo-change.goal': 'Annuler votre dernière modification du programme.',
  'help.guide.undo-change.step.1':
    "Cliquez sur la flèche d'annulation dans la barre d'outils au-dessus des jours. Son infobulle indique la modification qui sera annulée.",
  'help.guide.undo-change.result':
    'Le programme revient à son état précédent, et un court message indique ce qui a été annulé.',
  'help.guide.undo-change.tip.1':
    '« Annuler » s’applique au programme : ajout, affectation, retrait, réorganisation, déplacement et verrouillage de lieux, vidage d’un jour, optimisation d’un itinéraire, suppression de lieux, changements de catégorie et imports.',
  'help.guide.undo-change.tip.2':
    'Cliquez de nouveau pour revenir encore en arrière : TREK conserve vos 30 dernières modifications sur ce voyage, des plus récentes aux plus anciennes, tant que vous ne le quittez pas.',
  'help.guide.clear-day.title': 'Vider un jour',
  'help.guide.clear-day.goal':
    'Retirer d’un coup tous les lieux d’un jour, par exemple pour replanifier la journée de zéro.',
  'help.guide.clear-day.step.1': 'Faites un clic droit sur l’en-tête du jour dans le programme.',
  'help.guide.clear-day.step.2': 'Choisissez « Vider le jour » et confirmez.',
  'help.guide.clear-day.result':
    "La journée est vide et ses lieux retournent dans la liste, non planifiés. La flèche d'annulation au-dessus des jours les remet en place.",
  'help.guide.clear-day.tip.1': 'Seuls les lieux sont retirés. La journée conserve ses notes et ses réservations.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Lieux',
  'help.ctx.trip-places.summary':
    'La colonne de droite du programme : tous les lieux du voyage, planifiés ou non, avec recherche, filtres et tri, et les moyens d’ajouter des lieux : par la recherche, à la main ou depuis une liste partagée. « Lieux » et « Sorties », en haut, permettent de passer des lieux aux sorties du voyage.',
  'help.ctx.trip-places.bullet.1':
    '« Lieux » et « Sorties », en haut de la colonne, changent la liste affichée. « Lieux » est affiché à l’ouverture. « Sorties » liste les sorties du voyage et importe des fichiers GPX, KML et KMZ avec « Importer un GPX ou KML » ; une sortie n’apparaît pas dans la liste des lieux.',
  'help.ctx.trip-places.bullet.2':
    '« Ajouter un lieu/activité » ouvre le formulaire d’un lieu, à rechercher ou à saisir. Quand un jour est ouvert, le bouton devient « Nouveau lieu », et « Au jour », juste à côté, crée le lieu directement sur ce jour.',
  'help.ctx.trip-places.bullet.3':
    '« Importer des lieux », le bouton icône juste à côté, propose « Import de liste » pour une liste partagée depuis Google Maps ou Naver Maps. Si un administrateur a désactivé l’extension Sorties, il propose aussi « Importer un fichier » pour les fichiers .gpx, .kml et .kmz, et vous pouvez déposer un fichier sur la colonne.',
  'help.ctx.trip-places.bullet.4':
    'En dessous, « Rechercher », qui cherche aussi dans les descriptions et les notes, avec la case « Choisir » juste à côté. La rangée suivante contient les filtres : « Afficher » permet de passer de « Tous » à « Non planifiés » ou « Prévu », chacun avec son nombre. Le bouton étiquette filtre par catégorie, l’étoile par note minimale, le globe (dès que le voyage couvre plusieurs pays ou régions) par pays ou région, et « Trier par » définit l’ordre de la liste.',
  'help.ctx.trip-places.bullet.5':
    "Chaque ligne affiche l’image, le nom et la description ou l’adresse, et une étoile avec la note moyenne dès que le lieu a été noté. Cliquez dessus pour voir les détails du lieu, faites-la glisser sur un jour, ou faites un clic droit (ou cliquez sur « Plus d'options », ses trois points) pour « Modifier », « + Jour », « Ouvrir le site web », Google Maps, « Enregistrer dans une collection » et « Supprimer ».",
  'help.ctx.trip-places.bullet.6':
    'Quand un jour est ouvert, le + rond en bout de ligne (« + Jour ») ajoute le lieu à ce jour. Il apparaît sur chaque lieu qui n’y figure pas encore. « Prévu » ne liste alors que ce jour, comme l’indique la pastille « Seul le jour ouvert est affiché ». Son x, « Afficher tout le voyage », ferme le jour.',
  // create-place
  'help.guide.create-place.title': 'Créer un lieu',
  'help.guide.create-place.goal':
    'Ajouter manuellement un lieu ou une activité, avec toutes les informations nécessaires au programme.',
  'help.guide.create-place.step.1':
    'Cliquez sur « Ajouter un lieu/activité » en haut de la colonne des lieux (« Nouveau lieu » quand un jour est ouvert). Le formulaire s’ouvre avec le curseur dans la recherche.',
  'help.guide.create-place.step.2':
    'Tapez le lieu dans « Rechercher des lieux… » et choisissez un résultat. Le nom en haut de la boîte de dialogue, « Adresse », « Latitude », « Longitude » et « Site web » se remplissent, et « Détails du lieu », à gauche, affiche des images, les horaires d’ouverture et une description. Sur un TREK doté d’une clé Google, « Ce n’est pas le bon lieu ? Chercher plutôt avec Google », sous les résultats, relance la même recherche via Google. Si Collections est activé, « Lieux enregistrés », à droite, propose de la même façon les lieux de vos listes.',
  'help.guide.create-place.step.3':
    'Dans « Détails du lieu », cliquez sur une image sous « Choisir une image » pour en faire l’image du lieu. « Utiliser ce texte » copie la description dans le formulaire.',
  'help.guide.create-place.step.4':
    'Vérifiez les champs du formulaire. Le nom, en haut de la boîte de dialogue, est le seul champ obligatoire. La pastille « Catégorie » en dessous permet de choisir l’une des catégories du voyage, et le + à côté en crée une nouvelle. « Adresse », « Latitude » et « Longitude » proviennent de la recherche ou se saisissent à la main. « Description » et « Notes » sont pour vos propres textes. « Site web » accueille le lien, « Joindre » sous « Fichiers » ajoute un document, et « Téléphone », « E-mail » et « Ajouter les horaires » servent aux informations que la recherche n’a pas trouvées.',
  'help.guide.create-place.step.5':
    'Cliquez sur « Ajouter ». Si un lieu du même nom ou au même emplacement figure déjà dans le voyage, TREK affiche un avertissement et le bouton devient « Ajouter quand même ».',
  'help.guide.create-place.result':
    'Le lieu figure dans la liste et sur la carte, parmi les « Non planifiés » tant qu’il n’est placé sur aucun jour.',
  'help.guide.create-place.tip.1':
    '« Coûts », en bas du formulaire, si l’extension Budget est activée, ouvre l’éditeur de coûts pour la dépense du lieu juste après l’enregistrement. Une image ou un PDF collé dans la boîte de dialogue est joint comme un fichier sous « Fichiers ».',
  'help.guide.create-place.tip.2':
    'Sur chaque TREK, l’index TREK et OpenStreetMap fournissent les résultats de recherche, et « Détails du lieu » est rempli automatiquement à partir de Wikipédia, Wikivoyage et Wikimedia. TREK n’interroge Google que si ces deux sources ne trouvent rien, et seul Google fournit des notes.',
  'help.guide.create-place.tip.3':
    "Vous pouvez aussi créer un lieu depuis la carte : faites un clic droit à l'endroit voulu, et le formulaire s'ouvre avec les coordonnées et l'adresse déjà remplies.",
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Ajouter un lieu directement au jour ouvert',
  'help.guide.place-to-open-day.goal': "Créer ou choisir un lieu et l'ajouter à la journée en une seule étape.",
  'help.guide.place-to-open-day.step.1':
    'Cliquez sur l’en-tête d’un jour dans la colonne des jours. Le jour est ouvert : sa carte est mise en évidence, et la colonne des lieux affiche le bouton « Au jour » à côté de « Nouveau lieu ».',
  'help.guide.place-to-open-day.step.2':
    '« Au jour » ouvre le même formulaire que « Nouveau lieu », mais le lieu est ajouté au jour ouvert dès que vous cliquez sur « Ajouter ».',
  'help.guide.place-to-open-day.step.3':
    'Pour ajouter un lieu existant au jour ouvert, cliquez sur le + rond au bout de sa ligne (« + Jour »), ou faites un clic droit dessus et choisissez « + Jour ». Le + apparaît sur chaque lieu qui ne figure pas encore sur ce jour.',
  'help.guide.place-to-open-day.step.4':
    'Cela fonctionne aussi dans l’autre sens, sans ouvrir de jour au préalable : faites glisser la ligne du lieu hors de la colonne et déposez-la sur une carte de jour. Déposée entre deux étapes, elle se place exactement à cet endroit.',
  'help.guide.place-to-open-day.result':
    "Le lieu apparaît sous le jour, à la fin. Faites-le glisser vers le haut ou le bas jusqu'à sa place.",
  'help.guide.place-to-open-day.tip.1':
    'Le jour ouvert influe aussi sur la recherche : quand un jour est ouvert, la carte et la recherche à proximité partent des lieux déjà prévus ce jour-là.',
  'help.guide.place-to-open-day.tip.2':
    '« Annuler », dans la barre d’outils au-dessus des jours, annule l’affectation.',
  // filter-places
  'help.guide.filter-places.title': 'Trouver un lieu dans la liste',
  'help.guide.filter-places.goal': "N'afficher dans la colonne que les lieux que vous cherchez.",
  'help.guide.filter-places.step.1':
    '« Afficher », la liste déroulante sous la recherche, permet de passer de « Tous » à « Non planifiés » (sur aucun jour pour l’instant) ou « Prévu » (sur un jour), chacun avec son nombre. Si l’extension Sorties est désactivée et qu’une trace GPX a été importée, « Traces » est aussi proposé.',
  'help.guide.filter-places.step.2':
    'Tapez dans « Rechercher », en haut. La liste se filtre au fil de la saisie, par nom, adresse, description et notes ; le x dans le champ l’efface.',
  'help.guide.filter-places.step.3':
    'Le bouton étiquette à côté de « Afficher » liste les catégories : cochez-en une ou plusieurs, y compris « Sans catégorie ». Le bouton indique combien sont cochées, et « Effacer le filtre », en bas de la liste, les décoche toutes.',
  'help.guide.filter-places.step.4':
    'L’étoile juste à côté fixe une note minimale : 5+, 4+, etc. ne gardent que les lieux dont la note moyenne est au moins égale. Les lieux sans note sont masqués.',
  'help.guide.filter-places.result':
    'Le chiffre sur « Afficher » indique le nombre de lieux correspondants, et les filtres se cumulent.',
  'help.guide.filter-places.tip.1':
    "Quand un jour est ouvert, « Prévu » n'affiche que ce jour et le signale : « Seul le jour ouvert est affiché », avec « Afficher tout le voyage » juste à côté.",
  'help.guide.filter-places.tip.2':
    'La carte applique aussi « Afficher », les catégories et la note ; quand un jour est ouvert, « Prévu » n’affiche sur la carte que ce jour. La recherche et le globe ne filtrent que la liste.',
  // edit-place
  'help.guide.edit-place.title': 'Modifier un lieu',
  'help.guide.edit-place.goal': 'Corriger un nom, déplacer le repère, ajouter un site web ou changer la catégorie.',
  'help.guide.edit-place.step.1':
    "Faites un clic droit sur la ligne et choisissez « Modifier », ou cliquez sur « Plus d'options » au bout de la ligne, ou ouvrez le lieu et cliquez sur « Modifier » dans ses détails.",
  'help.guide.edit-place.step.2':
    'Modifiez ce qu’il faut dans « Modifier le lieu » : le nom et la pastille « Catégorie » en haut de la boîte de dialogue, « Adresse », « Latitude » et « Longitude », « Description », « Notes », « Site web », « Téléphone », « E-mail » et les horaires d’ouverture. Si le lieu figure sur un seul jour, ou si vous l’avez ouvert depuis un jour, le formulaire comporte aussi « Début », « Fin » et « Notes pour ce jour ».',
  'help.guide.edit-place.step.3': 'Cliquez sur « Mettre à jour ».',
  'help.guide.edit-place.result':
    'La modification s’applique partout où le lieu apparaît : dans la liste, sur la carte et dans tous les jours où il figure.',
  'help.guide.edit-place.tip.1':
    '« Notes pour ce jour » concerne le lieu pour ce seul jour ; « Notes » concerne le lieu lui-même.',
  'help.guide.edit-place.tip.2':
    'Une heure de « Fin » antérieure au « Début » bloque « Mettre à jour ». « Chevauchement horaire avec : » est un simple avertissement : une autre étape du jour a le même horaire.',
  // delete-place
  'help.guide.delete-place.title': 'Supprimer un lieu',
  'help.guide.delete-place.goal': 'Supprimer définitivement un lieu du voyage.',
  'help.guide.delete-place.step.1':
    "Faites un clic droit sur la ligne et choisissez « Supprimer » (également disponible dans « Plus d'options » en bout de ligne), ou cliquez sur « Supprimer » dans les détails du lieu.",
  'help.guide.delete-place.step.2':
    "Cliquez sur « Supprimer » dans la demande de confirmation. Si une nuit a été réservée dans ce lieu ou qu'une réservation y est liée, la demande indique ce qui sera supprimé en même temps.",
  'help.guide.delete-place.result':
    'Le lieu est retiré de la liste, de la carte et de tous les jours. « Annuler », dans la barre d’outils au-dessus des jours, le restaure.',
  'help.guide.delete-place.tip.1':
    'Pour retirer un lieu d’un seul jour, utilisez plutôt « Retirer du jour » sur cette étape.',
  'help.guide.delete-place.tip.2':
    'Pour supprimer plusieurs lieux à la fois, cliquez sur la case à côté de la recherche pour lancer une sélection.',
  // select-places
  'help.guide.select-places.title': 'Modifier ou supprimer plusieurs lieux à la fois',
  'help.guide.select-places.goal': "Modifier plusieurs lieux à la fois plutôt qu'un par un.",
  'help.guide.select-places.step.1':
    "Cliquez sur la coche à côté du champ de recherche. Des cases rondes apparaissent sur les lignes, ainsi qu'une barre d'actions en bas de la colonne.",
  'help.guide.select-places.step.2':
    'Cliquez sur les lignes pour les cocher. « Tout sélectionner », la double coche dans la barre, sélectionne toutes les lignes affichées par les filtres.',
  'help.guide.select-places.step.3':
    'La barre compte les lieux cochés. « Changer de catégorie » leur attribue à tous la même catégorie ; « Enregistrer dans une collection » (si Collections est activé) les copie dans l’une de vos collections ; « Supprimer la sélection » les supprime après confirmation.',
  'help.guide.select-places.step.4': 'Cliquez sur « Terminé », le X au bout de la barre, pour terminer la sélection.',
  'help.guide.select-places.result':
    'La modification s’applique à tous les lieux sélectionnés ; une suppression peut être annulée depuis la barre d’outils au-dessus des jours.',
  'help.guide.select-places.tip.1':
    'Les filtres restent actifs pendant la sélection : filtrez d’abord sur « Non planifiés », puis « Tout sélectionner » ne sélectionne que ces lieux.',
  'help.guide.select-places.tip.2':
    "« Marquer comme visité dans vos listes » apparaît dans la barre quand l'extension Collections est activée : les lieux sont alors marqués comme visités dans les collections où ils sont enregistrés.",
  // import-places-file
  'help.guide.import-places-file.title': 'Importer des lieux depuis un fichier GPX, KML ou KMZ',
  'help.guide.import-places-file.goal':
    'Si l’extension Sorties est désactivée, importer comme lieux les épingles et tracés exportés depuis Google My Maps, Google Earth ou un traceur GPS.',
  'help.guide.import-places-file.step.1':
    'Cliquez sur « Importer des lieux », le bouton icône à côté du bouton d’ajout, et choisissez « Importer un fichier », ou déposez le fichier n’importe où sur la colonne des lieux. Ces deux options ne sont disponibles que si un administrateur a désactivé l’extension Sorties.',
  'help.guide.import-places-file.step.2':
    'Choisissez le fichier ou faites-le glisser dans la zone. Pour un GPX, cochez ce qu’il faut importer : « Points de passage », « Trajets », « Traces (avec géométrie) ». Pour KML et KMZ, cochez « Points (Placemarks) » et « Chemins (LineStrings) ».',
  'help.guide.import-places-file.step.3':
    'La zone accepte plusieurs fichiers à la fois, mais uniquement au format .gpx, .kml et .kmz. Tout autre type de fichier, ou un fichier de plus de 10 Mo, est refusé dans la boîte de dialogue et n’est pas importé.',
  'help.guide.import-places-file.step.4':
    'Cliquez sur « Importer ». Un message indique combien de lieux ont été importés. Pour un fichier KML ou KMZ, la boîte de dialogue reste ouverte avec un récapitulatif de ce qui a été créé et de ce qui a été ignoré.',
  'help.guide.import-places-file.result':
    'Les lieux figurent dans la liste. Une trace a une ligne de couleur sur sa rangée, apparaît sur la carte et a son propre filtre « Traces ».',
  'help.guide.import-places-file.tip.1':
    'Un fichier trop volumineux est refusé et TREK indique la taille maximale. Exportez-le de nouveau sans les photos, ou découpez-le.',
  'help.guide.import-places-file.tip.2':
    "Vous pouvez annuler l'import entier depuis la barre d'outils au-dessus des jours.",
  // import-places-list
  'help.guide.import-places-list.title': 'Importer une liste partagée Google Maps ou Naver Maps',
  'help.guide.import-places-list.goal': "Importer des lieux à partir du lien d'une liste partagée.",
  'help.guide.import-places-list.step.1':
    'Cliquez sur « Importer des lieux », le bouton icône à côté du bouton d’ajout, et choisissez « Import de liste ».',
  'help.guide.import-places-list.step.2':
    'Sous « Fournisseur », choisissez « Liste Google » ou « Liste Naver », puis collez le lien de partage de la liste dans « Lien ». Un lien d’itinéraire Google Maps fonctionne aussi : ses étapes deviennent des lieux, dans l’ordre du trajet.',
  'help.guide.import-places-list.step.3': 'Cliquez sur « Importer ».',
  'help.guide.import-places-list.result':
    'Tous les lieux de la liste figurent dans le voyage, sous le même nom que dans la liste ; les lieux déjà présents dans le voyage sont ignorés.',
  'help.guide.import-places-list.tip.1':
    'La liste doit être partagée publiquement ; le lien d’une liste privée n’importe rien.',
  'help.guide.import-places-list.tip.2':
    '« Enrichir les lieux via Google » apparaît dans la boîte de dialogue si votre TREK dispose d’une clé Google : chaque lieu importé est recherché et complété avec photos, adresse et détails.',
  'help.guide.sort-places.title': 'Trier la liste des lieux',
  'help.guide.sort-places.goal': 'Trier la liste par nom, par note, ou selon les derniers ajouts ou modifications.',
  'help.guide.sort-places.step.1':
    'Cliquez sur « Trier par », le bouton fléché au bout de la rangée de filtres. Une coche indique l’ordre actuel, et l’info-bulle du bouton affiche son nom.',
  'help.guide.sort-places.step.2':
    'Choisissez un ordre, par exemple « Mieux notés », ou triez par nom. La liste se met à jour aussitôt.',
  'help.guide.sort-places.result':
    'La liste affiche les lieux dans l’ordre choisi, jusqu’à ce que vous en choisissiez un autre.',
  'help.guide.sort-places.tip.1':
    'Tout autre tri que « Ajoutés récemment » met le bouton en évidence : vous voyez immédiatement que la liste est triée autrement.',
  'help.guide.sort-places.tip.2':
    'Le tri ne modifie que la liste. Les jours gardent leur propre ordre, et votre navigateur mémorise l’ordre choisi.',
  'help.guide.place-by-hand.title': 'Ajouter un lieu introuvable dans la recherche',
  'help.guide.place-by-hand.goal':
    "Saisir vous-même un lieu, avec son téléphone, son e-mail et ses horaires d'ouverture, quand la recherche ne trouve rien.",
  'help.guide.place-by-hand.step.1':
    "Dans la fenêtre du lieu, saisissez le nom dans la recherche et appuyez sur Entrée. Si rien n'est trouvé, la fenêtre vous le signale et propose « Ajouter à la main ».",
  'help.guide.place-by-hand.step.2':
    "Cliquez sur « Ajouter à la main ». Le texte recherché devient le nom, et la fenêtre défile jusqu'aux champs de contact.",
  'help.guide.place-by-hand.step.3': 'Renseignez « Téléphone » et « E-mail » si vous les connaissez.',
  'help.guide.place-by-hand.step.4':
    'Cliquez sur « Ajouter les horaires » et indiquez les heures d’ouverture et de fermeture de chaque jour. Le bouton de copie applique à tous les jours les horaires du premier, et l’interrupteur d’un jour le marque « Fermé ».',
  'help.guide.place-by-hand.step.5': 'Cliquez sur « Ajouter ».',
  'help.guide.place-by-hand.result':
    "Le lieu est ajouté à la liste. Sa fiche affiche le téléphone, l'e-mail et les horaires d'ouverture que vous avez saisis, comme pour un lieu trouvé par la recherche.",
  'help.guide.place-by-hand.tip.1':
    "Quand vous modifiez un lieu qui n'a pas ses propres horaires, il reprend automatiquement les horaires d'ouverture de « Détails du lieu », à gauche. S'il a déjà des horaires, un bouton à côté permet de reprendre ceux trouvés par la recherche.",
  'help.guide.place-by-hand.tip.2':
    'Les horaires que vous saisissez remplacent ceux trouvés par la recherche : un café aux horaires saisonniers affiche ainsi ceux que vous connaissez.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Jours',
  'help.ctx.trip-days.summary':
    'La colonne de gauche du programme : une carte par jour avec ses étapes dans l’ordre, les notes, les réservations et transports du jour, et l’itinéraire entre les étapes. C’est ici que le voyage se planifie concrètement.',
  'help.ctx.trip-days.bullet.1':
    'L’en-tête : « Exporter » (PDF, calendrier, GPX) à gauche ; à droite, la flèche d’annulation, « Déplier tous les jours » / « Replier tous les jours », « Réorganiser les jours », et « Afficher tous les itinéraires » dès qu’une réservation a un itinéraire à tracer.',
  'help.ctx.trip-days.bullet.2':
    'Chaque carte de jour : une tuile avec le numéro du jour et la météo prévue, le titre (« Jour 1 » tant que vous ne le renommez pas) et la date, et en dessous des pastilles pour l’hébergement de la nuit (vert le jour de l’arrivée, rouge le jour du départ, en pointillés tant qu’il n’est pas confirmé ; son icône de billet ouvre la réservation) et pour une voiture de location. Cliquez sur l’en-tête pour ouvrir le jour, le chevron le replie, et le + (« Ajouter au jour ») ouvre un menu : « Ajouter un lieu à ce jour », « Ajouter un hébergement », « Ajouter un transport », « Transports en commun » et « Ajouter une note ». Un clic droit sur l’en-tête propose les mêmes options, plus « Vider le jour ».',
  'help.ctx.trip-days.bullet.3':
    "Dans une journée : les étapes dans l’ordre, chacune avec son image, l’icône de sa catégorie, son nom, son heure et sa description, les réservations qui y sont liées et les participants ; les notes ; les réservations et transports du jour, colorés selon leur type. Survolez une étape pour afficher sa poignée, le cadenas sur son image, les flèches, « Ajouter une réservation » et les trois points (« Plus d'options »). Un clic droit sur une étape ou une note ouvre aussi son menu.",
  'help.ctx.trip-days.bullet.4':
    'Sur le jour ouvert, dès qu’il compte deux étapes, la barre d’itinéraire apparaît en dessous : « Itinéraire » affiche la journée sur la carte avec la durée de chaque tronçon entre les étapes, les trois icônes règlent « Voiture », « À pied » ou « Vélo » pour la journée, puis viennent « Optimiser », « Ouvrir dans Google Maps » et « Ouvrir dans CoMaps ».',
  'help.ctx.trip-days.bullet.5':
    'Vous pouvez ajouter des lieux à un jour de plusieurs façons : faire glisser une ligne de la colonne des lieux, utiliser « + Jour » sur cette ligne, utiliser « Ajouter un lieu à ce jour » depuis le + du jour ou sur un jour vide, ou passer par les détails du lieu.',
  'help.ctx.trip-days.bullet.6':
    '« Coût total », en bas, additionne les dépenses de « Coûts » liées aux étapes et aux réservations de la journée, chacune une seule fois, dans votre devise d’affichage.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Lire le programme d’une journée',
  'help.guide.read-day-plan.goal': "Comprendre chaque élément d'une carte de jour avant de modifier quoi que ce soit.",
  'help.guide.read-day-plan.step.1':
    'L’en-tête : une tuile avec le numéro du jour et la météo prévue, puis « Jour 1 » ou le titre que vous lui avez donné, et la date. En dessous, des pastilles pour l’hébergement de la nuit (vert le jour de l’arrivée, rouge le jour du départ, en pointillés tant qu’il n’est pas confirmé ; son icône de billet ouvre la réservation) et pour une voiture de location. Cliquez sur l’en-tête pour ouvrir le jour (son panneau de détails s’ouvre par-dessus la carte). Le + à droite (« Ajouter au jour ») ajoute un lieu, un hébergement, un transport, une liaison en transports en commun ou une note, et le chevron replie la carte.',
  'help.guide.read-day-plan.step.2':
    "Chaque étape affiche son image, l’icône de sa catégorie et son nom, puis son heure dès qu’elle a un « Début », et sa description. Les notes pour ce jour s’affichent en dessous. Au survol de la ligne, ses commandes apparaissent : la poignée à gauche permet de la faire glisser, l’image se transforme en cadenas pour l’optimisation de l’itinéraire, et tout à droite se trouvent les flèches (« Monter », « Descendre »), « Ajouter une réservation » et les trois points (« Plus d'options »).",
  'help.guide.read-day-plan.step.3':
    'Une réservation liée à une étape y apparaît sous forme de badge « Réservation », vert si elle est confirmée et orange tant qu’elle est en attente, avec son heure et son transporteur. Cliquez sur le badge pour ouvrir la réservation ; le bouton d’itinéraire à côté trace son itinéraire. Un transport a sa propre ligne, colorée selon son type, avec son heure et « Départ » ou « Arrivée ». Cliquez sur une réservation pour en ouvrir les détails ; « Modifier » permet alors de la changer.',
  'help.guide.read-day-plan.step.4':
    'Quand « Itinéraire » est activé, le lien entre deux étapes indique la durée et la distance du tronçon, selon le mode de déplacement du jour ; cliquez dessus pour changer le mode de ce seul tronçon.',
  'help.guide.read-day-plan.step.5':
    'La barre d’itinéraire sous les étapes du jour ouvert : « Itinéraire » trace le parcours du jour sur la carte, les trois icônes choisissent « Voiture », « À pied » ou « Vélo », puis « Optimiser » réordonne les étapes, et « Ouvrir dans Google Maps » et « Ouvrir dans CoMaps » y ouvrent la journée.',
  'help.guide.read-day-plan.result':
    "Chaque symbole de la carte a une signification. Les guides ci-dessous expliquent comment modifier chacun d'eux.",
  'help.guide.read-day-plan.tip.1':
    'Faites un clic droit sur une étape, ou cliquez sur ses trois points, pour ouvrir son menu : « Modifier », « Retirer du jour », « Retirer de l’itinéraire », « Ouvrir le site web », « Enregistrer dans une collection », « Supprimer ». Les applications de navigation se trouvent dans les détails du lieu, sous « Navigation ».',
  'help.guide.read-day-plan.tip.2':
    'Survolez une étape : « Ajouter une réservation » apparaît en bout de ligne. Une réservation créée ainsi est liée à cette étape, ce jour-là.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Ajouter un lieu à un jour',
  'help.guide.place-onto-day.goal':
    'Faire d’un lieu de la liste une étape d’une journée, à la bonne place dans l’ordre.',
  'help.guide.place-onto-day.step.1':
    'Faites glisser une ligne de la colonne des lieux sur la carte du jour. Déposez-la entre deux étapes pour la placer exactement à cet endroit, ou sur l’en-tête du jour pour l’ajouter à la fin.',
  'help.guide.place-onto-day.step.2':
    'Sans glisser-déposer : ouvrez le jour en cliquant sur son en-tête, puis cliquez sur le + rond au bout de la ligne du lieu (« + Jour »), ou faites un clic droit sur la ligne et choisissez « + Jour ».',
  'help.guide.place-onto-day.step.3':
    '« Ajouter un lieu à ce jour », dans le menu + du jour ou sur un jour vide, ouvre le formulaire de lieu, et le nouveau lieu est immédiatement ajouté au jour.',
  'help.guide.place-onto-day.step.4':
    'Quand un jour est ouvert, « Ajouter au jour », dans les détails d’un lieu, l’ajoute à ce jour ; « Au jour », dans l’en-tête de la colonne des lieux, crée un nouveau lieu directement sur le jour ouvert.',
  'help.guide.place-onto-day.result':
    'Le lieu est désormais une étape de la journée. Il apparaît sur la carte avec le numéro du jour, et la colonne des lieux le compte parmi les « Prévu ».',
  'help.guide.place-onto-day.tip.1':
    "Un lieu peut figurer sur plusieurs jours : ajoutez-le au deuxième jour depuis la colonne des lieux. En revanche, faire glisser une étape d'une carte de jour à une autre la déplace.",
  'help.guide.place-onto-day.tip.2': 'La flèche d’annulation dans l’en-tête annule l’affectation.',
  'help.guide.place-onto-day.tip.3':
    "Vous ne pouvez pas déposer une étape entre deux entrées à horaire fixe, ni avant une réservation qui a déjà un horaire : le programme reste dans l'ordre chronologique.",
  // reorder-stops
  'help.guide.reorder-stops.title': "Changer l'ordre d'une journée",
  'help.guide.reorder-stops.goal': 'Monter ou descendre une étape, ou la déplacer vers un autre jour.',
  'help.guide.reorder-stops.step.1':
    'Survolez l’étape et faites-la glisser par sa poignée jusqu’à sa nouvelle place dans la carte.',
  'help.guide.reorder-stops.step.2':
    'Ou utilisez les flèches à droite de l’étape survolée (« Monter », « Descendre ») : d’un cran à chaque clic.',
  'help.guide.reorder-stops.step.3':
    'Faites glisser l’étape sur la carte d’un autre jour pour l’y déplacer ; elle est retirée de l’ancien jour.',
  'help.guide.reorder-stops.step.4':
    "Si une étape a une heure fixe et qu’un déplacement bouleverse l’ordre de la journée, TREK demande « Supprimer l'heure ? », car c’est l’heure qui détermine la place de l’étape. « Confirmer » supprime l’heure pour que l’étape puisse aller n’importe où. « Annuler » laisse la journée inchangée.",
  'help.guide.reorder-stops.result': 'L’itinéraire et les temps de trajet s’adaptent immédiatement au nouvel ordre.',
  'help.guide.reorder-stops.tip.1':
    'Une réservation à heure fixe reste à la place correspondant à son heure. Si vous la déposez ailleurs dans sa journée, elle y revient. Si vous la faites glisser sur la carte d’un autre jour, elle passe à ce jour.',
  'help.guide.reorder-stops.tip.2':
    '« Optimiser », dans la barre d’itinéraire, réordonne toute la journée selon le trajet le plus court quand elle compte au moins trois étapes. Verrouillez d’abord une étape pour la garder à sa place.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Donner une heure à une étape',
  'help.guide.set-stop-times.goal':
    "Définir l'heure de début et de fin d'une étape pour que la journée suive un horaire.",
  'help.guide.set-stop-times.step.1':
    "Faites un clic droit sur l'étape, ou cliquez sur ses trois points, et choisissez « Modifier ». Ouvert depuis le jour, le formulaire propose « Début » et « Fin » pour ce jour, juste sous le lieu.",
  'help.guide.set-stop-times.step.2':
    "Renseignez « Début » et, si vous le souhaitez, « Fin ». « Chevauchement horaire avec : » signale qu'une autre étape horodatée de la journée se chevauche. Une « Fin » antérieure au « Début » bloque « Mettre à jour ».",
  'help.guide.set-stop-times.step.3':
    "Cliquez sur « Mettre à jour ». L'étape reçoit un badge horaire et se place au bon endroit dans la journée selon son horaire.",
  'help.guide.set-stop-times.result':
    'Les étapes à heure fixe gardent leur place dans l’ordre ; les étapes sans heure se répartissent autour.',
  'help.guide.set-stop-times.tip.1':
    'L’heure est propre à l’étape de ce jour-là : le même lieu peut avoir une autre heure un autre jour.',
  'help.guide.set-stop-times.tip.2':
    "Pour déplacer à la main une étape à heure fixe, faites-la glisser. TREK demande « Supprimer l'heure ? », et l’heure est supprimée quand vous cliquez sur « Confirmer ».",
  'help.guide.set-stop-times.tip.3':
    'Le champ « Notes pour ce jour », dans le même formulaire, sert aux informations valables uniquement ce jour-là, par exemple une réservation de table ou un numéro de billet.',
  // remove-from-day
  'help.guide.remove-from-day.title': "Retirer une étape d'un jour",
  'help.guide.remove-from-day.goal': "Retirer un lieu d'une journée sans le supprimer du voyage.",
  'help.guide.remove-from-day.step.1':
    'Faites un clic droit sur l’étape, ou cliquez sur ses trois points, et choisissez « Retirer du jour ».',
  'help.guide.remove-from-day.step.2':
    "L'étape est retirée de la journée. Le lieu reste dans la colonne des lieux, sous « Non planifiés » s'il ne figure sur aucun autre jour.",
  'help.guide.remove-from-day.result':
    'La journée, son itinéraire et son coût sont mis à jour. La flèche d’annulation rétablit l’étape.',
  'help.guide.remove-from-day.tip.1':
    '« Supprimer », dans le même menu, retire le lieu de tout le voyage, de tous les jours compris.',
  'help.guide.remove-from-day.tip.2':
    '« Retirer du jour » figure aussi dans le panneau de détails du lieu, à côté de « Ajouter au jour ».',
  // lock-stop
  'help.guide.lock-stop.title': 'Verrouiller une étape à sa place',
  'help.guide.lock-stop.goal': "Garder une étape à sa place lors de l'optimisation de l'itinéraire.",
  'help.guide.lock-stop.step.1':
    "Survolez l'image de l'étape et cliquez sur le cadenas : « Maintenir la position lors de l'optimisation de l'itinéraire ».",
  'help.guide.lock-stop.step.2':
    "« Optimiser » trie désormais les autres étapes autour d'elle. Cliquez de nouveau sur le cadenas (« Cliquez pour déverrouiller ») pour la déverrouiller.",
  'help.guide.lock-stop.result':
    'Le cadenas s’affiche sur l’image ; l’étape garde sa place jusqu’à ce que vous la déverrouilliez.',
  'help.guide.lock-stop.tip.1':
    'Une étape à heure fixe est verrouillée par son heure ; elle ne bouge jamais lors de l’optimisation.',
  'help.guide.lock-stop.tip.2':
    'Le verrouillage ne dure que jusqu’au rechargement de la page. Après un rechargement, toutes les étapes sont de nouveau déverrouillées ; seules les étapes à heure fixe restent en place.',
  // day-note
  'help.guide.day-note.title': 'Ajouter une note à un jour',
  'help.guide.day-note.goal': 'Noter dans la journée un rappel, un numéro de billet ou un plan B.',
  'help.guide.day-note.step.1':
    'Cliquez sur le + dans l’en-tête du jour (« Ajouter au jour ») et choisissez « Ajouter une note ».',
  'help.guide.day-note.step.2':
    "Saisissez le nom de la note en haut de la fenêtre, à l'emplacement « Note ». C'est ce nom qui s'affiche sur la carte du jour. Rédigez le reste sous « Note du jour » : la barre d'outils au-dessus met le texte en forme (gras, listes, liens, citations), et « Aperçu », à gauche, montre le rendu de la ligne.",
  'help.guide.day-note.step.3':
    'Choisissez une « Icône » et une « Couleur » pour distinguer facilement la note des étapes, puis cliquez sur « Ajouter ».',
  'help.guide.day-note.step.4':
    'La note s’insère dans la journée comme une étape : faites-la glisser à sa place ou utilisez ses flèches. Cliquez dessus pour la modifier. « Supprimer » se trouve dans la boîte de dialogue, dans ses trois points et dans le menu du clic droit, et demande d’abord « Supprimer la note ? ».',
  'help.guide.day-note.result': 'La note fait partie de la journée et du PDF, à l’endroit où vous l’avez placée.',
  'help.guide.day-note.tip.1':
    'Les liens d’une note s’ouvrent dans un nouvel onglet, et un simple retour à la ligne est conservé tel quel.',
  'help.guide.day-note.tip.2':
    'Les notes sont propres à chaque jour. Pour une note concernant tout le voyage, utilisez « Collaboration ».',
  // day-route
  'help.guide.day-route.title': 'Afficher et optimiser l’itinéraire de la journée',
  'help.guide.day-route.goal':
    'Voir l’itinéraire entre les étapes, choisir votre mode de déplacement et laisser TREK optimiser l’ordre.',
  'help.guide.day-route.step.1':
    'Ouvrez le jour et cliquez sur « Itinéraire » dans la barre d’itinéraire sous ses étapes : l’itinéraire entre les étapes apparaît sur la carte, et les liens entre les étapes indiquent la durée et la distance de chaque tronçon.',
  'help.guide.day-route.step.2':
    'Les trois icônes à côté règlent le mode de déplacement de la journée : « Voiture », « À pied » ou « Vélo ». Les tronçons sont recalculés. Des plugins peuvent ajouter leurs propres modes.',
  'help.guide.day-route.step.3':
    'Cliquez sur un lien entre deux étapes pour changer le mode de ce seul tronçon : choisissez un mode, « Transports en commun » pour y chercher une correspondance là où c’est proposé, ou « Utiliser le mode du jour » pour revenir au mode de la journée.',
  'help.guide.day-route.step.4':
    '« Optimiser » (la flèche circulaire) réordonne les étapes selon le trajet le plus court, à partir de trois étapes. Les étapes verrouillées ou à heure fixe gardent leur place ; si la journée comporte un hébergement, l’itinéraire part de celui-ci.',
  'help.guide.day-route.step.5':
    '« Ouvrir dans Google Maps » ou « Ouvrir dans CoMaps » ouvre toute la journée sous forme d’itinéraire dans cette application, pour naviguer en route ; CoMaps reprend aussi le mode de déplacement du jour.',
  'help.guide.day-route.result':
    "La journée devient un itinéraire avec horaires. « Coût total » et les tronçons se mettent à jour quand l'ordre change.",
  'help.guide.day-route.tip.1':
    "Par défaut, les itinéraires sont calculés par OSRM. L'administrateur peut configurer TREK pour utiliser un autre moteur de calcul dans « Valeurs par défaut ».",
  'help.guide.day-route.tip.2':
    "Un tronçon dont l'itinéraire n'a pas pu être calculé n'affiche pas de durée. Vérifiez que les deux étapes ont des coordonnées.",
  'help.guide.day-route.tip.3': "La flèche d'annulation annule une optimisation.",
  // manage-days
  'help.guide.manage-days.title': 'Ajouter, réorganiser et renommer des jours',
  'help.guide.manage-days.goal': 'Modifier les jours eux-mêmes, et pas seulement les lieux qu’ils contiennent.',
  'help.guide.manage-days.step.1':
    'Les jours découlent des dates du voyage. Modifiez les dates dans le formulaire du voyage, sur le « Tableau de bord », et des jours sont ajoutés ou supprimés au début ou à la fin. Avant de supprimer un jour qui contient des éléments, une liste vous indique quels jours seront supprimés et ce qu’ils contiennent.',
  'help.guide.manage-days.step.2':
    '« Réorganiser les jours », dans l’en-tête, ouvre une liste : faites glisser un jour par sa poignée, ou utilisez « Monter » et « Descendre » ; il est déplacé avec ses lieux, ses notes et ses réservations. Sous la liste, « Ajouter » avec la date suivante ajoute un jour après le dernier jour daté et prolonge le voyage d’un jour ; « Sans date » ajoute un jour non daté à la fin. Un voyage sans dates propose uniquement « Ajouter un jour ».',
  'help.guide.manage-days.step.3':
    '« Supprimer le jour », la corbeille en bout de ligne, demande d’abord confirmation. TREK liste ce qui sera supprimé avec le jour : ses lieux, notes et réservations, un séjour dont l’arrivée ou le départ tombe ce jour-là, et les jours qui seront avancés d’une date. « Supprimer le jour » le supprime, « Annuler » le conserve ; le dernier jour ne peut pas être supprimé.',
  'help.guide.manage-days.step.4':
    'Pour renommer un jour, ouvrez-le et cliquez sur le crayon à côté de son titre, dans le panneau de détails au-dessus de la carte. Le nom remplace « Jour 1 » sur la carte du jour et dans le PDF.',
  'help.guide.manage-days.step.5':
    '« Déplier tous les jours » et « Replier tous les jours », dans l’en-tête, déplient ou replient toutes les cartes d’un coup. Pour replier une seule carte, cliquez sur son chevron.',
  'help.guide.manage-days.result':
    'Les dates restent liées à la position : un jour remonté prend la date précédente, et ses étapes, ses notes et ses réservations le suivent.',
  'help.guide.manage-days.tip.1':
    'Le déplacement de jours peut être annulé avec la flèche d’annulation ; la suppression d’un jour, non.',
  'help.guide.manage-days.tip.2':
    '« Coût total », en bas du programme, additionne les dépenses de tout le voyage ; l’onglet « Coûts » en donne le détail.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Comprendre les réservations et les transports dans le programme',
  'help.guide.bookings-in-plan.goal':
    'Savoir où apparaît une réservation une fois créée, et depuis quel écran la créer.',
  'help.guide.bookings-in-plan.step.1':
    'Un transport (vol, train, ferry, bus, voiture) est une ligne colorée selon son type, avec son heure et « Départ » le jour du départ, ou « Arrivée » le jour de l’arrivée ; le globe à côté indique le fuseau horaire, et un vol avec escale a une ligne par tronçon. Pour une liaison en transports en commun, cliquez sur le chevron pour afficher ses lignes. Cliquez sur une ligne pour ouvrir la réservation ; « Modifier » permet alors de la changer.',
  'help.guide.bookings-in-plan.step.2':
    "Une réservation liée à une étape (un restaurant, une visite) apparaît comme un badge « Réservation » sur cette étape, avec son horaire. Le badge est vert une fois confirmé et ambre tant qu'il est en attente. Une réservation associée à un jour mais à aucune étape a sa propre ligne dans la journée.",
  'help.guide.bookings-in-plan.step.3':
    'Une nuit à l’hôtel est un hébergement : sa pastille dans l’en-tête du jour est verte le jour de l’arrivée et rouge le jour du départ, et son icône de billet ouvre la réservation. Le panneau de détails du jour l’affiche sous « Hébergement », et l’itinéraire de chacun de ces jours part de là.',
  'help.guide.bookings-in-plan.step.4':
    'Sur la carte, le bouton d’itinéraire d’une ligne de réservation trace son itinéraire ; « Afficher tous les itinéraires », dans l’en-tête, les trace tous.',
  'help.guide.bookings-in-plan.step.5':
    'Pour créer : « Ajouter une réservation » sur une étape survolée, « Ajouter un transport » et « Transports en commun » dans le menu + du jour, et les onglets « Réservations » et « Transports » pour la liste complète avec import et fichiers.',
  'help.guide.bookings-in-plan.result':
    'Chaque réservation apparaît une seule fois dans le programme. Les onglets affichent les mêmes réservations sous forme de liste.',
  'help.guide.bookings-in-plan.tip.1':
    '« Confirmé » et « En attente » sont des statuts que vous définissez sur la réservation ; le programme l’affiche sur l’étape, et l’onglet « Réservations » compte les deux.',
  'help.guide.bookings-in-plan.tip.2':
    'Si vous déposez une réservation horodatée ailleurs dans sa journée, elle revient à la place correspondant à son heure. Si vous la faites glisser sur la carte d’un autre jour, elle passe à ce jour. Pour changer son heure, modifiez la réservation.',
  // export-plan
  'help.guide.export-plan.title': 'Exporter le programme',
  'help.guide.export-plan.goal':
    'Exporter le programme sous forme de document, vers votre agenda ou vers un appareil GPS.',
  'help.guide.export-plan.step.1': 'Cliquez sur « Exporter », à gauche de la barre d’en-tête au-dessus des jours.',
  'help.guide.export-plan.step.2':
    '« Document : PDF » ouvre la vue d’impression de tous les jours avec leurs étapes, notes et réservations, précédée d’une carte d’ensemble de l’itinéraire ; « Mon plan en PDF » ne garde que ce à quoi vous participez. Dans cette vue, « Saut de page par jour » fait commencer chaque jour sur une nouvelle page, « Notes de transport » ajoute les notes de vos transports, et « Enregistrer en PDF » télécharge le document.',
  'help.guide.export-plan.step.3':
    "Agenda : « Télécharger le .ics » enregistre les réservations dans un fichier de calendrier. « S'abonner au calendrier » fournit un lien que votre application d'agenda actualise automatiquement.",
  'help.guide.export-plan.step.4':
    '« Cartes et GPS » (GPX) : « Tout le voyage » exporte les lieux, les itinéraires des jours et les traces ; « Lieux uniquement », seulement les épingles ; « Journées en itinéraires », un itinéraire par jour, pour les cartes hors ligne et les appareils GPS.',
  'help.guide.export-plan.result': 'Le fichier est téléchargé, et rien ne change dans le voyage.',
  'help.guide.export-plan.tip.1':
    "Pour ouvrir une seule journée dans une application de cartographie, utilisez sa barre d'itinéraire : « Ouvrir dans Google Maps » ou « Ouvrir dans CoMaps ».",
  'help.guide.export-plan.tip.2':
    "« S'abonner au calendrier » nécessite que les flux de calendrier soient activés dans vos paramètres et que vous ayez le droit de partager le voyage ; un guide du « Tableau de bord » l’explique.",
  'help.guide.export-plan.tip.3':
    'Exporter ne nécessite qu’un accès en lecture : tous les membres du voyage peuvent exporter le PDF, le .ics et le GPX.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Détails du lieu',
  'help.ctx.trip-place.summary':
    'La fiche qui s’ouvre par-dessus la carte quand vous choisissez un lieu : tout ce que le voyage sait de lui, les étoiles attribuées par chacun, son image et ses fichiers, et les boutons pour l’ajouter au jour ouvert, l’ouvrir dans une application de cartographie ou l’enregistrer dans une liste.',
  'help.ctx.trip-place.bullet.1':
    'Cliquez sur une ligne de la colonne des lieux, sur une étape dans une journée ou sur un repère de la carte : la fiche s’ouvre par-dessus la carte. Si vous l’ouvrez depuis une journée, la fiche sait de quelle étape il s’agit et affiche aussi ses participants et sa réservation. Une sortie (randonnée, sortie à vélo ou balade de l’onglet « Sorties ») ouvre plutôt sa propre fiche de sortie.',
  'help.ctx.trip-place.bullet.2':
    'L’en-tête affiche l’image ronde, le nom, l’adresse sur une ligne et des pastilles pour les informations connues : ouvert ou fermé, la catégorie, l’heure, le prix, le numéro de téléphone, l’e-mail et les coordonnées. Cliquez sur l’image pour utiliser votre propre image ou une photo des fichiers du lieu. Double-cliquez sur le nom pour renommer le lieu. Le X à droite ferme la fiche. L’image, le renommage, « Modifier » et « Supprimer » ne sont disponibles que pour les voyageurs autorisés à modifier les lieux.',
  'help.ctx.trip-place.bullet.3':
    "En dessous : les étoiles attribuées au lieu par chaque voyageur, la description et les notes, ainsi que « Notes pour ce jour » si l'étape en a.",
  'help.ctx.trip-place.bullet.4':
    "Viennent ensuite, le cas échéant, « Horaires d'ouverture », « Couleur du parcours », « Données du parcours » et « Fichiers ». « Importer », dans le titre « Fichiers », ajoute des fichiers depuis votre ordinateur, et la liste affiche aussi les fichiers liés à cette étape et ceux de sa réservation, y compris la confirmation d’un hôtel. Des plugins peuvent ajouter leurs propres lignes en dessous.",
  'help.ctx.trip-place.bullet.5':
    'La rangée du bas : « Ajouter au jour » ou « Retirer du jour » quand un jour est ouvert, puis « Navigation » (ou le nom de votre application de cartographie, une fois choisie dans « Paramètres »), « Ouvrir le site web » et « Enregistrer dans une collection ». À droite, la corbeille rouge supprime le lieu et « Modifier » ouvre son formulaire.',
  'help.ctx.trip-place.bullet.6':
    "Un lieu choisi dans la recherche affiche ce que l’index TREK ou OpenStreetMap savent de lui : « Ouvert » ou « Fermé » parmi les pastilles du haut, avec un anneau vert ou rouge autour de l’image, d’après l’heure locale du lieu ; son numéro de téléphone, également en pastille ; « Horaires d'ouverture » plus bas, avec les horaires du jour sur la ligne et toute la semaine en un clic ; et son site web sous « Ouvrir le site web ». La note Google ne s’affiche que pour un lieu trouvé via Google, sur un TREK disposant d’une clé Google. Les horaires, le numéro de téléphone et l’e-mail que vous avez saisis vous-même dans le formulaire du lieu remplacent ceux trouvés automatiquement et déterminent aussi la couleur de l’anneau.",
  // read-place
  'help.guide.read-place.title': 'Ce qu’indique la fiche d’un lieu',
  'help.guide.read-place.goal': 'Voir sur une seule fiche tout ce que le voyage sait d’un lieu.',
  'help.guide.read-place.step.1':
    'Dans la colonne des jours, cliquez sur l’étape à consulter. La fiche s’ouvre par-dessus la carte, et l’étape reste mise en évidence dans sa journée.',
  'help.guide.read-place.step.2':
    'En haut : l’image ronde, le nom et l’adresse sur une ligne ; l’info-bulle affiche l’adresse complète. Les pastilles en dessous indiquent « Ouvert » ou « Fermé » en ce moment, selon l’heure locale du lieu, avec un anneau vert ou rouge assorti autour de l’image. Elles affichent aussi la catégorie, l’heure, le numéro de téléphone et l’e-mail (cliquez dessus pour ouvrir votre téléphone ou votre messagerie) et, sur grand écran, les coordonnées exactes. Le X à droite ferme la fiche.',
  'help.guide.read-place.step.3':
    "« Note » est la première section sous l'en-tête : les étoiles attribuées au lieu par chaque voyageur, avec la moyenne et le nombre de votes. Tant que personne n'a voté, elle affiche « Pas encore noté ».",
  'help.guide.read-place.step.4':
    'Viennent ensuite la description puis, en dessous, les notes. Les deux reprennent le texte du formulaire du lieu, avec sa mise en forme : listes, liens et gras fonctionnent.',
  'help.guide.read-place.step.5':
    '« Participants » indique qui se rend à cette étape. Tout le monde y participe tant que vous ne retirez personne.',
  'help.guide.read-place.step.6':
    "« Horaires d'ouverture », plus bas : la ligne affiche les horaires du jour consulté. Cliquez dessus pour voir toute la semaine, avec ce jour en gras. « Fichiers » se trouve juste à côté.",
  'help.guide.read-place.result':
    'La fiche reste ouverte jusqu’à ce que vous la fermiez avec le X ou choisissiez un autre lieu. Les horaires de la semaine restent dépliés, et l’étape correspondante reste mise en évidence dans la colonne des jours.',
  'help.guide.read-place.tip.1':
    'Quand vous choisissez le lieu dans la colonne des lieux, la fiche affiche le lieu, mais pas une étape. Elle n’affiche donc aucun participant, et seulement les réservations liées au lieu lui-même, comme le séjour d’un hôtel. Choisissez l’étape dans la journée pour tout voir.',
  'help.guide.read-place.tip.2':
    'Si vous pouvez modifier les lieux, double-cliquez sur le nom pour renommer le lieu sans ouvrir le formulaire. Entrée enregistre, Échap annule la modification.',
  'help.guide.read-place.tip.3':
    'Un lieu saisi à la main ne contient que les informations renseignées dans son formulaire. Cliquez sur « Modifier » et remplissez vous-même « Téléphone », « E-mail » et les horaires d’ouverture, ou choisissez le lieu parmi les suggestions sous « Rechercher des lieux… » et cliquez sur « Mettre à jour » pour que TREK les recherche. La note Google nécessite une clé Google.',
  // rate-place
  'help.guide.rate-place.title': 'Noter un lieu',
  'help.guide.rate-place.goal': 'Donner vos propres étoiles à un lieu et voir les notes attribuées par les autres.',
  'help.guide.rate-place.step.1':
    "Ouvrez le lieu. La rangée d'étoiles se trouve juste sous l'en-tête et affiche la moyenne des votes, avec leur nombre entre parenthèses.",
  'help.guide.rate-place.step.2':
    "Cliquez sur l'étoile de votre choix. Les étoiles se remplissent au survol, pour que vous voyiez la note que vous allez donner.",
  'help.guide.rate-place.step.3':
    'Votre vote est immédiatement pris en compte dans la moyenne, et les avatars à côté montrent qui a voté. Survolez la ligne pour voir les étoiles de chacun.',
  'help.guide.rate-place.step.4':
    "La même moyenne s'affiche sur la ligne du lieu dans la colonne des lieux, pour repérer facilement les meilleurs lieux de la liste.",
  'help.guide.rate-place.result':
    'Tous les participants du voyage voient vos étoiles sur le lieu. L’étoile de la rangée de filtres, au-dessus de la liste, permet désormais de n’afficher que les lieux ayant une note minimale.',
  'help.guide.rate-place.tip.1':
    'Chaque voyageur peut noter, même dans un voyage où seuls certains peuvent modifier les lieux.',
  'help.guide.rate-place.tip.2':
    'Cliquez sur l’étoile que vous avez déjà attribuée pour retirer votre note. Si plus personne n’a noté le lieu, il affiche de nouveau « Pas encore noté ».',
  'help.guide.rate-place.tip.3':
    "Jusqu'à six votants apparaissent sous forme d'avatars à côté des étoiles. L'infobulle les liste tous et vous signale parmi eux.",
  // place-image
  'help.guide.place-image.title': 'Mettre votre propre photo sur un lieu',
  'help.guide.place-image.goal': 'Remplacer la vignette automatique par votre propre photo.',
  'help.guide.place-image.step.1': 'Ouvrez le lieu depuis la colonne des lieux.',
  'help.guide.place-image.step.2':
    "Survolez l’image ronde dans l’en-tête : un appareil photo apparaît et l’info-bulle indique « Importer une image ». Cliquez dessus et choisissez votre fichier. Si le lieu a déjà des photos parmi ses fichiers, TREK vous demande d’abord de choisir : « Importer depuis l'appareil », ou l’une des images sous « Depuis les fichiers joints ».",
  'help.guide.place-image.step.3':
    'Le haut de la fiche affiche maintenant votre image, avec une petite croix rouge dans son coin.',
  'help.guide.place-image.step.4':
    'La même image apparaît aussi sur la ligne du lieu dans la colonne des lieux, et sur son repère de la carte.',
  'help.guide.place-image.result':
    'Votre image est utilisée partout pour ce lieu : sur la fiche, dans la colonne des lieux, sur l’étape de la journée, sur le repère de la carte et dans un voyage partagé.',
  'help.guide.place-image.tip.1':
    "Les formats JPG, PNG, GIF et WebP sont acceptés, et les photos HEIC d'iPhone sont converties à l'import.",
  'help.guide.place-image.tip.2':
    "La croix dans le coin supprime votre photo, et l'image automatique réapparaît. Le lieu lui-même ne change pas.",
  'help.guide.place-image.tip.3':
    'Si vous n’avez pas ajouté d’image, TREK en cherche une à partir des coordonnées du lieu. S’il n’en trouve aucune, il affiche l’icône de la catégorie. Seuls les voyageurs autorisés à modifier les lieux peuvent en définir une.',
  // place-day-assign
  'help.guide.place-day-assign.title': "Ajouter le lieu au jour ouvert, ou l'en retirer",
  'help.guide.place-day-assign.goal':
    'Utiliser le bouton de la carte plutôt que de faire glisser la ligne à travers le planificateur.',
  'help.guide.place-day-assign.step.1':
    'Cliquez sur l’en-tête d’un jour dans la colonne des jours. Ce jour devient le jour ouvert, et la fiche s’y rapporte.',
  'help.guide.place-day-assign.step.2':
    'Dans la colonne des lieux, cliquez sur un lieu qui ne figure pas sur ce jour. Sa fiche s’ouvre, et la rangée du bas propose « Ajouter au jour ».',
  'help.guide.place-day-assign.step.3':
    'Cliquez sur « Ajouter au jour ». L’étape est ajoutée à la fin de la journée, et le bouton devient « Retirer du jour ».',
  'help.guide.place-day-assign.step.4':
    "L'étape figure maintenant dans la journée, en fin de liste. Faites-la glisser vers le haut jusqu'à la bonne position.",
  'help.guide.place-day-assign.step.5':
    "« Retirer du jour » retire de nouveau l'étape de la journée, et la carte propose de nouveau « Ajouter au jour ».",
  'help.guide.place-day-assign.result':
    "L'étape est ajoutée à la journée ou en est retirée. Le lieu lui-même ne change pas.",
  'help.guide.place-day-assign.tip.1':
    "Le bouton n'apparaît que lorsqu'un jour est ouvert. Sans jour ouvert, il n'y a pas de jour auquel ajouter le lieu.",
  'help.guide.place-day-assign.tip.2':
    'Si vous retirez une étape d’un jour, le lieu reste dans le voyage et dans la colonne des lieux. « Supprimer » le retire partout.',
  'help.guide.place-day-assign.tip.3':
    'Une étape ajoutée au jour par une réservation d’hébergement n’affiche aucun de ces deux boutons. Cette nuitée s’ajoute et se retire dans le bloc d’hébergement du jour.',
  // place-participants
  'help.guide.place-participants.title': 'Indiquer qui participe à cette étape',
  'help.guide.place-participants.goal': 'Choisir qui participe à une étape, sans changer les participants du voyage.',
  'help.guide.place-participants.step.1':
    "Cliquez sur l'étape dans la journée. La carte s'ouvre et « Participants » liste toutes les personnes du voyage.",
  'help.guide.place-participants.step.2':
    "Cliquez sur la pastille d'un voyageur pour le retirer de cette étape. Au survol de la pastille, le nom est barré.",
  'help.guide.place-participants.step.3':
    "Un + en pointillés apparaît dès qu'une personne manque. Cliquez dessus pour voir qui ne participe pas à l'étape.",
  'help.guide.place-participants.step.4':
    'Cliquez sur un nom pour ajouter de nouveau cette personne. Quand tout le monde est de nouveau ajouté, l’étape concerne de nouveau tout le groupe.',
  'help.guide.place-participants.result':
    'L’étape n’affiche que les voyageurs choisis. Le reste du groupe est libre pendant ce temps.',
  'help.guide.place-participants.tip.1':
    '« Participants » n’apparaît que si une étape est sélectionnée : choisissez donc le lieu dans la journée, pas dans la colonne des lieux. Cette option n’apparaît aussi que dans un voyage qui compte plusieurs voyageurs.',
  'help.guide.place-participants.tip.2':
    "Si personne n'est sélectionné, tout le monde participe. C'est pourquoi vous ne pouvez pas retirer le dernier voyageur d'une étape.",
  'help.guide.place-participants.tip.3': "Un invité, même sans compte, peut participer comme n'importe qui.",
  // place-booking
  'help.guide.place-booking.title': "La réservation d'une étape",
  'help.guide.place-booking.goal': "Voir la réservation d'une étape, l'ouvrir et y lier une nouvelle réservation.",
  'help.guide.place-booking.step.1':
    'Ouvrez l’étape à laquelle la réservation est liée. La fiche la liste sous « Réservations » sous forme de petite carte, avec le nom de la réservation et « Confirmé » ou « En attente ».',
  'help.guide.place-booking.step.2':
    'La carte de la réservation affiche la « Date », l’« Heure » et le « Code de réservation », des pastilles pour les autres détails (numéro de vol, quai, enregistrement) et les éventuelles notes de la réservation.',
  'help.guide.place-booking.step.3':
    'Cliquez sur la carte de la réservation. La réservation s’ouvre par-dessus la carte.',
  'help.guide.place-booking.step.4':
    "« Modifier », en bas de la réservation, ouvre son propre formulaire. Dans ce formulaire, « Lier à l'affectation du jour » lie une réservation à une étape, et affiche déjà celle-ci. Refermez le formulaire.",
  'help.guide.place-booking.step.5':
    "Pour créer une réservation liée à une étape, passez par la colonne des jours : survolez l'étape et cliquez sur « Ajouter une réservation », l'icône de billet en bout de ligne. Le formulaire s'ouvre sous le titre « Nouvelle réservation », déjà lié à l'étape.",
  'help.guide.place-booking.result':
    "La réservation est liée à l'étape : elle s'affiche sur la carte et dans la journée, et ses fichiers apparaissent aussi ici, sous « Fichiers ».",
  'help.guide.place-booking.tip.1':
    'Une réservation s’affiche sur l’étape à laquelle elle est liée, et une réservation d’hôtel s’affiche aussi sur l’hôtel, où que vous l’ouvriez. Une réservation sans étape s’affiche dans l’onglet « Réservations ».',
  'help.guide.place-booking.tip.2':
    'Plusieurs réservations peuvent partager une même étape, par exemple un déjeuner et une visite qui partent du même endroit.',
  'help.guide.place-booking.tip.3':
    'Pour un train, un vol ou un ferry, « Modifier » ouvre plutôt le formulaire de transport, celui de l’onglet « Transports ».',
  // place-files
  'help.guide.place-files.title': "Garder les billets d'un lieu avec le lieu",
  'help.guide.place-files.goal': 'Joindre le billet, le bon ou le plan au lieu correspondant.',
  'help.guide.place-files.step.1':
    "Ouvrez le lieu. « Fichiers » se trouve sous ses détails, à côté de « Horaires d'ouverture » si le lieu en a, et affiche « Fichiers » tant que le lieu n’en a aucun.",
  'help.guide.place-files.step.2': 'Cliquez sur « Importer » à droite du titre « Fichiers » et choisissez le fichier.',
  'help.guide.place-files.step.3':
    'Le bouton indique combien de fichiers le lieu contient, et la liste s’ouvre automatiquement.',
  'help.guide.place-files.step.4': 'Chaque ligne indique le nom et la taille du fichier. Cliquez dessus pour l’ouvrir.',
  'help.guide.place-files.result':
    "Le fichier est joint au lieu et comptabilisé sur sa carte. Il apparaît aussi dans l'onglet « Fichiers » du voyage.",
  'help.guide.place-files.tip.1':
    '« Fichiers » liste aussi ce qui est épinglé à cette étape et ce qui est joint à sa réservation : une confirmation d’hôtel apparaît donc sur l’hôtel.',
  'help.guide.place-files.tip.2':
    '« Importer » accepte plusieurs fichiers à la fois, et l’une des photos peut devenir l’image du lieu.',
  'help.guide.place-files.tip.3':
    "Si vous n'avez pas le droit d'importer des fichiers, le bouton « Importer » n'est pas affiché. Les fichiers déjà joints au lieu restent visibles.",
  // place-navigation
  'help.guide.place-navigation.title': 'Ouvrir un lieu dans une application de cartographie ou sur son site web',
  'help.guide.place-navigation.goal':
    "Ouvrir le lieu dans l'application de navigation que vous utilisez pour vous y rendre.",
  'help.guide.place-navigation.step.1': 'Ouvrez le lieu et cliquez sur « Navigation » dans la rangée du bas.',
  'help.guide.place-navigation.step.2':
    'La liste propose les applications de cartographie adaptées à ce lieu : Google Maps, Waze, Apple Maps, OpenStreetMap et CoMaps, ainsi que « Autre application de cartes » sur Android.',
  'help.guide.place-navigation.step.3':
    'Cliquez sur celle que vous utilisez. Quand c’est possible, TREK transmet à l’application le lieu lui-même, et pas seulement ses coordonnées : vous arrivez ainsi à la bonne entrée.',
  'help.guide.place-navigation.step.4':
    '« Ouvrir le site web », à côté, ouvre le site du lieu, avec ses horaires et sa billetterie, dans un nouvel onglet.',
  'help.guide.place-navigation.result':
    'L’application de cartographie s’ouvre sur le lieu, le site web s’ouvre dans un nouvel onglet, et rien ne change dans le voyage. Si TREK est installé comme application, c’est l’application de cartographie qui s’ouvre au lieu d’un nouvel onglet.',
  'help.guide.place-navigation.tip.1':
    'Waze lance la navigation immédiatement. Les autres applications ouvrent le lieu, et il faut appuyer une fois de plus pour démarrer la navigation.',
  'help.guide.place-navigation.tip.2':
    'Les applications proposées dépendent du lieu et de votre appareil : Apple Maps n’est pas proposé sur Android, 高德地图 ne l’est que pour un lieu situé en Chine, et Waze, Apple Maps et CoMaps nécessitent les coordonnées du lieu. « Autre application de cartes » ouvre le lieu dans n’importe quelle application de cartographie de votre téléphone Android.',
  'help.guide.place-navigation.tip.3':
    'Choisissez une fois pour toutes votre application de cartographie dans « Paramètres », sous « Ouvrir les lieux dans ». Le bouton affiche alors son nom et l’ouvre directement. Il fait de même quand une seule application convient au lieu.',
  // place-to-collection
  'help.guide.place-to-collection.title': "Enregistrer un lieu dans l'une de vos listes",
  'help.guide.place-to-collection.goal': 'Garder pour le prochain voyage un lieu découvert lors de celui-ci.',
  'help.guide.place-to-collection.step.1':
    'Ouvrez le lieu et cliquez sur « Enregistrer dans une collection » dans la rangée en bas de la fiche.',
  'help.guide.place-to-collection.step.2':
    '« Enregistrer dans une liste » affiche toutes les listes que vous possédez ou partagez. Un signet plein à droite indique les listes qui contiennent déjà ce lieu.',
  'help.guide.place-to-collection.step.3': 'Cliquez sur la liste. Le lieu y est ajouté immédiatement.',
  'help.guide.place-to-collection.step.4':
    'Fermez la boîte de dialogue avec le X : le bouton de la fiche indique désormais « Enregistré ».',
  'help.guide.place-to-collection.result':
    'Le lieu figure dans votre liste avec son image, ses notes et son adresse, prêt pour votre prochain voyage.',
  'help.guide.place-to-collection.tip.1':
    'Le bouton n’apparaît que si l’extension Collections est activée, ce que l’administrateur règle sous « Extensions ».',
  'help.guide.place-to-collection.tip.2':
    'Un lieu peut figurer dans plusieurs listes à la fois, avec un statut différent dans chacune : idée dans l’une, visité dans une autre.',
  'help.guide.place-to-collection.tip.3':
    '« Marquer comme visité », sous le nom du lieu en haut du sélecteur, marque le lieu comme visité dans la liste. Si le lieu figure dans plusieurs de vos listes, le bouton indique « Visité partout » et le marque dans toutes d’un coup. « Affichage » ouvre vos listes dans Collections.',
  // place-track
  'help.guide.place-track.title': 'Consulter une trace et lui attribuer une couleur',
  'help.guide.place-track.goal': "Connaître la longueur d'une randonnée importée et repérer sa trace sur la carte.",
  'help.guide.place-track.step.1':
    "Dans la colonne des lieux, la ligne d'une trace affiche un petit trait de la couleur de la trace sur la carte. Cliquez dessus.",
  'help.guide.place-track.step.2':
    '« Données du parcours » indique la longueur du trajet, dans les unités que vous avez choisies.',
  'help.guide.place-track.step.3':
    '« Couleur du parcours », au-dessus, indique la couleur utilisée. Cliquez sur la ligne pour ouvrir les nuanciers.',
  'help.guide.place-track.step.4':
    'Choisissez une couleur. Le tracé sur la carte et le trait de la ligne changent en même temps.',
  'help.guide.place-track.step.5':
    'La case en pointillés à gauche, « Couleur automatique », rétablit la couleur par défaut de la trace. La pipette à droite ouvre le sélecteur de couleur de votre système pour choisir n’importe quelle autre couleur.',
  'help.guide.place-track.result':
    "La trace s'affiche dans la couleur choisie : sur la carte du lieu, sur sa ligne dans la colonne des lieux et sur la carte.",
  'help.guide.place-track.tip.1':
    'Seul un lieu doté d’un tracé a ces deux blocs : un lieu importé depuis un fichier GPX, KML ou KMZ avant l’arrivée de Sorties, ou sur un TREK où Sorties est désactivé. Quand Sorties est activé, un nouveau fichier GPX devient une sortie, qui a sa propre fiche.',
  'help.guide.place-track.tip.2':
    "Une trace enregistrée avec l'altitude indique aussi son point le plus haut et le plus bas, le dénivelé positif et négatif, et le profil de la randonnée.",
  'help.guide.place-track.tip.3':
    "Un import attribue une couleur différente à chaque trace qu'il ajoute : deux randonnées n'ont donc jamais la même couleur.",
  // read-place
  'help.guide.read-place.step.7':
    'La rangée du bas regroupe les actions possibles : ajouter le lieu au jour ouvert ou l’en retirer, l’ouvrir dans une application de cartographie ou sur son site web, l’enregistrer dans une liste et, à droite, le supprimer (la corbeille rouge) ou le modifier.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Fichiers',
  'help.ctx.trip-files.summary':
    'Tous les documents du voyage dans une seule liste : billets, confirmations, pass et photos. Chacun a une note, un lien vers le lieu ou la réservation correspondante, et une corbeille depuis laquelle vous pouvez le restaurer.',
  'help.ctx.trip-files.bullet.1':
    '« Déposez les fichiers ici », la zone en pointillés sous la barre, accepte les fichiers que vous y déposez. Un clic dessus ouvre le sélecteur de fichiers. La zone indique les types de fichiers acceptés par ce TREK et la limite par fichier (50 Mo maximum, sauf si un administrateur en a fixé une autre).',
  'help.ctx.trip-files.bullet.2':
    'La barre du haut contient « Fichiers » et les onglets de filtre « Tous », « PDF », Images et Documents, chacun avec son nombre. Un onglet étoile apparaît après « Tous » dès qu’un fichier est mis en favori, et un onglet « Notes Collab » à la fin dès qu’une note a une pièce jointe.',
  'help.ctx.trip-files.bullet.3':
    'Une ligne affiche une miniature ou le type du fichier, qui l’a importé, le nom, la note en dessous, la taille et la date, ainsi qu’un badge par lien : le lieu, la réservation ou le transport avec son nom (survolez-le pour voir « Plan du jour », « Réservation » ou « Transport »), et « Depuis les notes Collab ».',
  'help.ctx.trip-files.bullet.4':
    'Au bout d’une ligne se trouvent jusqu’à cinq icônes, dont le nom s’affiche au survol : « Favori », « Assigner » (le crayon), « Ouvrir », « Télécharger » et « Supprimer ». « Supprimer » ne demande pas de confirmation : le fichier va dans la corbeille, d’où vous pouvez le restaurer. Hors ligne, les notes, les liens, les favoris et la corbeille fonctionnent toujours et sont envoyés dès que TREK est de nouveau en ligne ; seuls l’import et la suppression d’un autre lien nécessitent une connexion.',
  'help.ctx.trip-files.bullet.5':
    'Une image ou une vidéo s’ouvre en plein écran, avec navigation au clavier et une rangée de miniatures. Tout autre document s’ouvre dans une boîte de dialogue, avec son nom en haut et « Ouvrir dans un nouvel onglet » et « Télécharger » en dessous. Une carte de portefeuille électronique est téléchargée directement.',
  'help.ctx.trip-files.bullet.6':
    "L'icône de corbeille à l'extrémité droite de la barre (« Corbeille ») affiche les fichiers supprimés. Vous pouvez y restaurer chaque fichier ou le supprimer définitivement, et « Vider la corbeille », dans la barre, les supprime tous. « Synchronisation des documents » se trouve à gauche de la corbeille lorsque le voyage est connecté à un stockage de documents, ou, pour le propriétaire du voyage ou un administrateur, dès qu'un stockage est activé.",
  // files-upload
  'help.guide.files-upload.title': 'Ajouter un document au voyage',
  'help.guide.files-upload.goal':
    "Importer dans le voyage un billet, une confirmation ou une photo depuis votre dossier de téléchargements, pour que tous les participants puissent l'ouvrir.",
  'help.guide.files-upload.step.1':
    "Ouvrez le voyage et cliquez sur « Fichiers » dans la barre d'onglets. Les documents du voyage y sont listés, avec la zone d'import au-dessus.",
  'help.guide.files-upload.step.2':
    'Cliquez sur « Déposez les fichiers ici » et choisissez un ou plusieurs fichiers. Ils sont importés l’un après l’autre, et la zone affiche « Importation… » pendant l’opération. Dans la zone, sous « ou cliquez pour parcourir », figurent les types de fichiers acceptés par ce TREK et la taille maximale d’un fichier.',
  'help.guide.files-upload.step.3':
    'Une fois le dernier fichier importé, « Assigner le fichier » s’ouvre automatiquement pour lui (si le voyage a des lieux ou des réservations), avec le nom du fichier en haut de la boîte de dialogue. « Ajouter une note… », sous « Note », ajoute une note au fichier, et les listes en dessous le lient à un lieu ou à une réservation. Fermez avec le × en haut à droite ; rien n’est perdu à la fermeture.',
  'help.guide.files-upload.step.4':
    'Les nouveaux fichiers apparaissent en haut de la liste ; seuls les favoris sont placés au-dessus. Une ligne indique qui a importé le fichier, son nom, sa taille et sa date. Une image a une miniature, tout autre fichier affiche son type.',
  'help.guide.files-upload.result':
    'Les documents figurent dans le voyage, et toutes les personnes qui voient le voyage peuvent les ouvrir et les télécharger.',
  'help.guide.files-upload.tip.1':
    'Vous pouvez aussi faire glisser un fichier depuis le bureau directement dans la zone, qui se met en surbrillance quand le fichier la survole.',
  'help.guide.files-upload.tip.2':
    "Appuyez sur Ctrl+V pour ajouter à la liste une image du presse-papiers : inutile d'enregistrer d'abord la capture d'écran d'une réservation.",
  'help.guide.files-upload.tip.3':
    'L’import nécessite le droit d’importer des fichiers ; sans ce droit, la zone n’apparaît pas. Un type absent de la liste est refusé avec un message, et rien n’est importé. Un fichier qui dépasse la limite (50 Mo, sauf si un administrateur en a fixé une autre) est refusé avant tout envoi, et le message indique la limite. L’import nécessite aussi une connexion : hors ligne, TREK vous le signale et n’importe rien.',
  // files-link
  'help.guide.files-link.title': 'Lier un document à un lieu ou à une réservation',
  'help.guide.files-link.goal':
    'Retrouver facilement le billet depuis le jour concerné, et pas seulement depuis cette liste.',
  'help.guide.files-link.step.1':
    'Cliquez sur le crayon en bout de ligne (« Assigner »). « Assigner le fichier » s’ouvre, avec le nom du fichier en haut de la boîte de dialogue.',
  'help.guide.files-link.step.2':
    'Sous « Note », « Ajouter une note… » accepte une ligne de texte, qui s’affiche ensuite sous le nom du fichier dans la liste. Elle est enregistrée quand vous appuyez sur Entrée ou quittez le champ.',
  'help.guide.files-link.step.3':
    'Sous « Lieu », à gauche, figurent les lieux du voyage, regroupés par jour avec la date, et « Non attribué » à la fin pour les lieux qui ne sont sur aucun jour. Cliquez sur l’un d’eux pour le cocher.',
  'help.guide.files-link.step.4':
    'Sous « Réservation » et « Transport », à droite, figurent les réservations du voyage. Cliquez sur celle à laquelle se rapporte le document : elle est cochée à son tour.',
  'help.guide.files-link.step.5':
    "Fermez avec le × en haut à droite. Il n'y a pas de bouton d'enregistrement : chaque clic a été enregistré immédiatement.",
  'help.guide.files-link.result':
    "La ligne affiche la note et un badge par lien : l'un avec le nom du lieu, l'autre avec celui du vol. Au survol, un badge indique « Plan du jour » ou « Transport ». Le document est aussi joint au lieu et au vol.",
  'help.guide.files-link.tip.1':
    "Un fichier peut avoir plusieurs liens à la fois : une même confirmation peut ainsi être liée à la fois à la réservation de l'hôtel et au lieu de l'hôtel.",
  'help.guide.files-link.tip.2':
    'Cliquez de nouveau sur une entrée cochée pour supprimer ce lien ; le fichier lui-même est conservé. Hors ligne, la note et les nouvelles coches sont enregistrées et envoyées dès que TREK est de nouveau en ligne ; seule la suppression d’un autre lien nécessite une connexion.',
  'help.guide.files-link.tip.3':
    'Cela fonctionne aussi dans l’autre sens : un document joint à un lieu ou à une réservation figure également dans cette liste, avec le même badge sur sa ligne.',
  // files-star
  'help.guide.files-star.title': 'Garder les documents importants en haut',
  'help.guide.files-star.goal':
    'Marquer les quelques documents dont vous aurez vraiment besoin, pour les retrouver vite dans une longue liste.',
  'help.guide.files-star.step.1':
    "Cliquez sur l'étoile en bout de ligne (« Favori »). Elle devient dorée, une deuxième étoile apparaît devant le nom du fichier et, au survol, le bouton indique désormais « Retirer des favoris ».",
  'help.guide.files-star.step.2':
    'La liste est triée de nouveau : les favoris passent au-dessus de tous les autres fichiers, du plus récent au plus ancien dans chaque groupe.',
  'help.guide.files-star.step.3':
    "Une étoile apparaît maintenant dans les onglets de filtre de la barre, juste après « Tous », avec le nombre de favoris. Cliquez dessus pour n'afficher que ces fichiers.",
  'help.guide.files-star.result':
    "Les favoris s'affichent en haut de la liste, et un onglet n'affiche que les favoris.",
  'help.guide.files-star.tip.1':
    'L’onglet étoile n’existe que tant qu’un fichier est en favori. Quand vous retirez le dernier favori, l’onglet disparaît.',
  'help.guide.files-star.tip.2':
    'Mettre en favori nécessite le même droit que « Assigner », « Modifier les métadonnées des fichiers ». Un membre qui n’a pas ce droit voit les étoiles, mais un clic sur « Favori » ne change rien pour lui.',
  // files-filter
  'help.guide.files-filter.title': 'Trouver un document dans la liste',
  'help.guide.files-filter.goal': "N'afficher que le type de document que vous cherchez.",
  'help.guide.files-filter.step.1':
    'Les onglets de filtre se trouvent dans la barre du haut, à côté de « Fichiers » : « Tous », « PDF », « Images » et « Documents », chacun avec son nombre de fichiers.',
  'help.guide.files-filter.step.2': "Cliquez sur « PDF » : la liste n'affiche plus que les fichiers PDF.",
  'help.guide.files-filter.step.3':
    "Deux onglets supplémentaires n'apparaissent que si le voyage contient des fichiers correspondants. Cliquez sur « Notes Collab », qui apparaît dès qu'une note de l'onglet Collaboration a une pièce jointe : la liste n'affiche alors que ces fichiers. Un onglet étoile apparaît de la même façon, dès qu'un fichier est mis en favori.",
  'help.guide.files-filter.step.4': '« Tous » réaffiche toute la liste.',
  'help.guide.files-filter.result':
    'La liste n’affiche que les fichiers de l’onglet choisi, et le chiffre de chaque onglet indique leur nombre.',
  'help.guide.files-filter.tip.1':
    'Il n’y a pas de dossiers ici, et les fichiers ne peuvent pas être renommés. Pour distinguer les documents, utilisez la note dans « Assigner le fichier », les liens vers les lieux et réservations, et l’étoile.',
  'help.guide.files-filter.tip.2':
    "La liste affiche toujours les favoris en premier, puis les fichiers du plus récent au plus ancien : un document importé aujourd'hui apparaît donc avant un document du mois dernier.",
  // files-preview
  'help.guide.files-preview.title': 'Consulter un document sans quitter TREK',
  'help.guide.files-preview.goal':
    'Consulter immédiatement un billet ou une image, et le télécharger sur votre appareil si besoin.',
  'help.guide.files-preview.step.1':
    'Cliquez sur le nom ou la miniature d’une image. Elle s’ouvre en plein écran, avec le nom du fichier et sa position parmi les images en haut à gauche. Une vidéo s’ouvre de la même façon et se lit sur place.',
  'help.guide.files-preview.step.2':
    'Utilisez les flèches rondes sur les côtés, les touches fléchées gauche et droite ou la bande de vignettes en bas pour parcourir toutes les images actuellement affichées dans la liste.',
  'help.guide.files-preview.step.3':
    '« Ouvrir dans un nouvel onglet » et « Télécharger » sont les boutons ronds en haut à droite, à côté du ×. Cliquez sur le ×, appuyez sur Échap ou cliquez sur le fond sombre pour fermer l’image.',
  'help.guide.files-preview.step.4':
    'Un document qui n’est pas une image s’ouvre plutôt dans une boîte de dialogue : son nom en haut, avec « Ouvrir dans un nouvel onglet » et « Télécharger » en pastilles en dessous et, pour un PDF, la page elle-même plus bas. Le × en haut à droite, la touche Échap ou un clic en dehors de la boîte de dialogue la ferme.',
  'help.guide.files-preview.step.5':
    'La flèche en bout de ligne (« Télécharger ») enregistre directement le fichier sur votre appareil, sans l’ouvrir.',
  'help.guide.files-preview.result':
    "Le document s'affiche à l'écran, et les deux mêmes boutons permettent de l'ouvrir dans un onglet du navigateur ou de l'enregistrer sur votre disque.",
  'help.guide.files-preview.tip.1':
    "Sur un écran tactile, faites défiler les images d'un geste du doigt au lieu de cliquer sur les flèches.",
  'help.guide.files-preview.tip.2':
    "Un pass Wallet n'ouvre jamais d'aperçu. Il est téléchargé immédiatement, pour que le téléphone puisse l'ouvrir dans son application Wallet.",
  'help.guide.files-preview.tip.3':
    "« Ouvrir dans un nouvel onglet » et « Télécharger » chargent tous deux le fichier avec votre session : un lien copié depuis la barre d'adresse ne fonctionne donc pour personne d'autre.",
  // files-trash
  'help.guide.files-trash.title': 'Supprimer un document et le restaurer',
  'help.guide.files-trash.goal':
    'Supprimer ce dont le voyage n’a plus besoin, et restaurer les fichiers dont vous avez encore besoin.',
  'help.guide.files-trash.step.1':
    'Cliquez sur la corbeille en bout de ligne (« Supprimer »). Le fichier disparaît aussitôt de la liste et le message « Déplacé dans la corbeille » s’affiche. Aucune confirmation n’est demandée.',
  'help.guide.files-trash.step.2':
    "L'icône de corbeille à l'extrémité droite de la barre (« Corbeille ») affiche les fichiers supprimés. Le titre de la barre devient « Corbeille », et les onglets de filtre ainsi que la zone d'import sont masqués.",
  'help.guide.files-trash.step.3':
    'Dans la corbeille, une ligne est grisée et propose deux icônes : « Restaurer », qui restaure le fichier, et « Supprimer », qui le supprime définitivement après confirmation.',
  'help.guide.files-trash.step.4':
    "Cliquez sur « Restaurer ». Le message « Fichier restauré » s'affiche et le fichier quitte la corbeille. Sa note et ses liens sont conservés.",
  'help.guide.files-trash.step.5':
    "« Vider la corbeille », dans la barre à côté de l'icône de corbeille, supprime définitivement tout ce qui se trouve encore dans la corbeille. Le navigateur demande une confirmation avant. L'icône de corbeille revient ensuite à la liste des fichiers.",
  'help.guide.files-trash.result': 'Le fichier a retrouvé sa place dans la liste.',
  'help.guide.files-trash.tip.1':
    '« Supprimer » sur une ligne ne demande pas de confirmation. C’est pour cela qu’il existe une corbeille : rien n’est effacé de TREK tant que vous ne le supprimez pas ici. Tout cela fonctionne aussi hors ligne et est envoyé dès que TREK est de nouveau en ligne.',
  'help.guide.files-trash.tip.2':
    'Supprimer et restaurer un fichier nécessite le droit de supprimer des fichiers. Un membre qui ne l’a pas ne voit ni « Supprimer » sur la ligne ni les boutons de la corbeille.',
  'help.guide.files-trash.tip.3': 'Un fichier supprimé définitivement de la corbeille ne peut plus être récupéré.',
  // files-sync
  'help.guide.files-sync.title': 'Synchroniser les documents avec votre stockage de documents',
  'help.guide.files-sync.goal':
    'Connecter le voyage à votre propre stockage de documents, pour que les fichiers importés ici y soient enregistrés et que ceux enregistrés là-bas apparaissent ici.',
  'help.guide.files-sync.step.1':
    "Cliquez sur « Synchronisation des documents », à côté de l'icône de corbeille à droite de la barre. La fenêtre s'ouvre avec le nom du voyage sous son titre. À gauche, sous « Connecter un fournisseur », figurent les stockages activés par un administrateur, chacun avec une ligne indiquant son mode de classement : Paperless-ngx et Papra par étiquette, Nextcloud et Synology Drive dans un dossier, OpenCloud dans un espace. À droite s'affiche « Rien de connecté pour le moment ».",
  'help.guide.files-sync.step.2':
    "Cliquez sur votre stockage, ici Nextcloud. Une fenêtre plus petite s'ouvre pour la connexion. Elle porte le nom du stockage et demande les identifiants dont ce stockage a besoin.",
  'help.guide.files-sync.step.3':
    'Renseignez « Adresse » et les identifiants propres au stockage : un « Jeton API » pour Paperless-ngx, une « Clé API » et l’« ID d’organisation » pour Papra, « Nom d’utilisateur » et un « Mot de passe d’application » pour Nextcloud, « Nom d’utilisateur » et un « Jeton d’application » pour OpenCloud, et pour Synology Drive « Nom d’utilisateur », « Mot de passe » et, si le compte le demande, un « Code à deux facteurs ». Utilisez un mot de passe ou un jeton d’application chaque fois que le stockage le permet, jamais le mot de passe de votre compte. Nextcloud et Synology Drive acceptent aussi un « Dossier de base » facultatif, où TREK cherche les dossiers de voyage, ici /Reisen. « Accepter un certificat auto-signé », en bas, ne sert que pour un stockage sur votre propre réseau doté d’un tel certificat.',
  'help.guide.files-sync.step.4':
    'Cliquez sur « Tester la connexion ». TREK se connecte au stockage avec les informations saisies, et le bas de la carte indique « Connexion réussie, connecté en tant que » suivi du nom du compte. Si les identifiants sont refusés ou si l’adresse est injoignable, le bas de la carte l’indique à la place. Dans les deux cas, rien n’est enregistré.',
  'help.guide.files-sync.step.5':
    'Cliquez sur « Connecter ». La connexion est enregistrée avec le voyage, et TREK vous demande où se trouvent les documents du voyage dans le stockage : l’étiquette, le dossier ou l’espace qui les contient. Seul son contenu est synchronisé. « En créer un nouveau » le crée quand vous cliquez sur « Créer », avec un nom tiré du titre du voyage. Sous « Ou en utiliser un existant » figurent ceux qui existent déjà. Cliquez sur l’un d’eux, ici le dossier Autumn in Japan.',
  'help.guide.files-sync.step.6':
    "La fenêtre s'ouvre de nouveau : votre stockage figure sous « Ce voyage » à gauche, et sa carte à droite indique la destination de la synchronisation, la date de la dernière exécution et « Synchroniser maintenant ». La première synchronisation démarre automatiquement. Cliquez sur « Synchroniser maintenant » pour en lancer une à tout moment. Après une synchronisation, le badge « Pas encore synchronisé » à côté du nom laisse place à un point vert, qui affiche « À jour » au survol. La barre de flux indique le nombre de documents côté TREK et côté stockage, avec entre les deux les voies « Vers le fournisseur » et « Depuis le fournisseur ». Fermez la fenêtre avec le × en haut à droite.",
  'help.guide.files-sync.result':
    'Les documents déjà présents dans le stockage apparaissent en haut de la liste, importés à votre nom, et tous les documents du voyage se trouvent aussi dans le stockage, sauf ceux des « Notes Collab ». Désormais, TREK vérifie le stockage en arrière-plan, et les modifications de la liste y sont copiées.',
  'help.guide.files-sync.tip.1':
    "Seul le propriétaire du voyage ou un administrateur de l'instance peut connecter un voyage, car les identifiants donnent accès à tout le compte sur le stockage. Une fois le voyage connecté, chaque membre voit « Synchronisation des documents » et peut l'ouvrir, consulter la carte et cliquer sur « Synchroniser maintenant ».",
  'help.guide.files-sync.tip.2':
    'Un stockage sur votre propre réseau nécessite ALLOW_INTERNAL_NETWORK=true sur le serveur TREK, et son adresse doit être celle de la machine sur le réseau, jamais localhost. Sinon, « Tester la connexion » répond « Cette adresse n’est pas autorisée. ».',
  'help.guide.files-sync.tip.3':
    '« Déconnecter », l’icône à côté de « Synchroniser maintenant », demande une seule confirmation. La connexion est alors coupée, et tous les documents sont conservés des deux côtés. Si vous connectez une seconde fois une étiquette, un dossier ou un espace, TREK le considère comme nouveau et en réimporte tout le contenu. Après une déconnexion, connectez donc un emplacement vide plutôt que l’ancien.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Détails du jour',
  'help.ctx.trip-day-detail.summary':
    'Le panneau qui s’ouvre par-dessus la carte quand vous cliquez sur l’en-tête d’un jour. Il présente la journée dans son ensemble : son nom et sa date, la météo là où vous serez, les réservations du jour et les nuits réservées.',
  'help.ctx.trip-day-detail.bullet.1':
    'Cliquez sur l’en-tête d’un jour dans la colonne des jours : le panneau s’ouvre au centre de la carte. Cliquez de nouveau sur cet en-tête, ou sur le X à sa droite, pour fermer le panneau et désélectionner le jour. Ouvrir un lieu, depuis la colonne des lieux ou la carte, ferme le panneau et affiche le lieu à la place.',
  'help.ctx.trip-day-detail.bullet.2':
    'L’en-tête affiche le nom et la date du jour. Le crayon à côté du nom permet de renommer le jour. Le double chevron réduit le panneau à une barre étroite pour libérer la carte.',
  'help.ctx.trip-day-detail.bullet.3':
    'En haut s’affiche la météo du jour. « Prévisions pour » indique le lieu concerné : la première étape du jour, ou l’hôtel où vous vous réveillez.',
  'help.ctx.trip-day-detail.bullet.4':
    '« Réservations » liste les réservations de ce jour, chacune avec son type, l’étape à laquelle elle est liée et ses horaires. Vert signifie confirmé, orange encore en attente, et un trajet en transports en commun est en bleu, sans statut. Un clic sur une ligne ouvre la réservation.',
  'help.ctx.trip-day-detail.bullet.5':
    '« Hébergement » affiche chaque nuit réservée sur ce jour, avec « Arrivée » et « Départ » les jours concernés, la plage horaire d’arrivée, l’heure de départ et le numéro de confirmation. Si le séjour a une réservation, une case « Réservation » en dessous l’indique avec « En attente » ou « Confirmé ». Cliquez dessus pour ouvrir la réservation.',
  'help.ctx.trip-day-detail.bullet.6':
    '« Ajouter un hébergement » ajoute une nuitée à ce jour : choisissez l’établissement parmi les lieux du voyage, indiquez les jours concernés, puis ajoutez les horaires et le code. Le + dans l’en-tête d’un jour, avec l’info-bulle « Ajouter au jour », propose aussi « Ajouter un hébergement » : il ouvre ce panneau avec le formulaire déjà ouvert.',
  // day-panel
  'help.guide.day-panel.title': 'Ouvrir un jour et consulter ses détails',
  'help.guide.day-panel.goal':
    'Voir toute une journée, avec sa météo, ses réservations et votre hébergement, sans quitter la carte.',
  'help.guide.day-panel.step.1':
    "Cliquez sur l'en-tête d'un jour dans la colonne des jours. Le jour est sélectionné et ses détails s'ouvrent au milieu de la carte.",
  'help.guide.day-panel.step.2':
    "L'en-tête affiche le nom du jour, « Jour 1 » tant que vous ne l'avez pas renommé, avec sa date en dessous.",
  'help.guide.day-panel.step.3':
    'La météo du jour figure en haut. « Prévisions pour » indique le lieu concerné : la première étape du jour, ou l’hôtel où vous avez passé la nuit précédente.',
  'help.guide.day-panel.step.4': '« Réservations », en dessous, liste les réservations de ce jour avec leurs horaires.',
  'help.guide.day-panel.step.5':
    '« Hébergement » affiche les nuits réservées sur ce jour, avec « Arrivée » et « Départ » les jours concernés.',
  'help.guide.day-panel.step.6':
    "Le double chevron de l'en-tête réduit le panneau à une barre étroite. La croix à côté ferme le panneau et désélectionne le jour.",
  'help.guide.day-panel.result':
    'Quand vous réduisez le panneau à sa barre, la carte est dégagée et le jour reste sélectionné. Quand vous le fermez, le jour est désélectionné et le programme reste inchangé.',
  'help.guide.day-panel.tip.1':
    "Cliquer n'importe où sur la barre d'en-tête du panneau le réduit aussi. Le chevron n'est qu'une des façons de le faire.",
  'help.guide.day-panel.tip.2':
    'Quand vous ouvrez un lieu, depuis la colonne des lieux ou la carte, le panneau du jour se ferme et les détails du lieu s’affichent à la place. Cliquez de nouveau sur l’en-tête du jour pour réafficher la journée.',
  // day-weather
  'help.guide.day-weather.title': 'Consulter la météo du jour',
  'help.guide.day-weather.goal': 'Voir la météo à l’endroit où vous vous trouvez réellement ce jour-là.',
  'help.guide.day-weather.step.1':
    '« Prévisions pour » indique le lieu concerné par les chiffres : la première étape du jour ou, pour un jour sans étape, l’hôtel où vous avez passé la nuit précédente.',
  'help.guide.day-weather.step.2':
    'Le grand chiffre est la température du jour. À côté figurent la minimale, la maximale et la description du temps.',
  'help.guide.day-weather.step.3':
    "Les pastilles à sa droite indiquent le risque de pluie, la quantité de précipitations, le vent le plus fort, ainsi que l'heure du lever et du coucher du soleil.",
  'help.guide.day-weather.step.4':
    "En bas, la journée heure par heure, toutes les deux heures : l'heure, l'icône, la température et le risque de pluie. Les heures au-delà de 50 % sont surlignées en bleu.",
  'help.guide.day-weather.result':
    "La carte du jour dans la colonne des jours affiche aussi la météo en petit sous son numéro : vous voyez ainsi d'un coup d'œil la météo de tout le voyage.",
  'help.guide.day-weather.tip.1':
    "Les degrés et le vent suivent l'« Unité de température » définie dans les Paramètres, sous « Affichage » : si vous choisissez °F Fahrenheit, la même prévision s'affiche en °F et en mph.",
  'help.guide.day-weather.tip.2':
    'Un jour sans étape localisée ni hôtel la nuit précédente n’affiche aucune météo : les prévisions portent toujours sur un lieu, jamais sur le voyage.',
  'help.guide.day-weather.tip.3':
    'Au-delà de 16 jours, aucune prévision n’est disponible. Les chiffres sont alors des moyennes des années précédentes pour cette date. Ils sont marqués d’un Ø, et une remarque en dessous le signale.',
  // rename-day
  'help.guide.rename-day.title': 'Donner un nom au jour',
  'help.guide.rename-day.goal':
    'Donner à un jour un nom comme « Arrivée à Kyoto » ou « Jour de repos » au lieu de « Jour 5 ».',
  'help.guide.rename-day.step.1': 'Ouvrez le jour. Son en-tête affiche « Jour 5 », avec la date en dessous.',
  'help.guide.rename-day.step.2': 'Cliquez sur le crayon à côté du nom.',
  'help.guide.rename-day.step.3': 'Le nom devient un champ modifiable. Saisissez le nom souhaité.',
  'help.guide.rename-day.step.4':
    'Appuyez sur Entrée, ou cliquez ailleurs. Échap annule la modification. La carte du jour, dans la colonne des jours, affiche aussi le nom.',
  'help.guide.rename-day.result':
    'Le nom remplace « Jour 5 » dans le panneau et sur la carte du jour dans la colonne des jours ; la date ne change pas.',
  'help.guide.rename-day.tip.1':
    'Si vous videz le champ et enregistrez, le jour reprend le nom « Jour 5 » : le numéro s’affiche en l’absence de nom.',
  'help.guide.rename-day.tip.2':
    'Le nom appartient au jour, pas à sa date. Si vous réorganisez les jours, le nom suit tout le contenu de ce jour.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Réserver une nuit pour un jour',
  'help.guide.add-accommodation.goal':
    "Ajouter l'hôtel au programme une seule fois, avec les jours concernés, ses horaires et son numéro de confirmation.",
  'help.guide.add-accommodation.step.1':
    "L'établissement doit d'abord être un lieu du voyage. Créez-le dans la colonne des lieux comme n'importe quel autre lieu : le sélecteur ne propose que des lieux existants.",
  'help.guide.add-accommodation.step.2':
    'Ouvrez le jour de votre arrivée et cliquez sur « Ajouter un hébergement » sous « Hébergement ».',
  'help.guide.add-accommodation.step.3':
    '« Appliquer aux jours » définit les nuits couvertes par le séjour : « Début » correspond au jour d’arrivée, « Fin » au jour de départ, et « Tous » couvre tout le voyage. Le haut de la boîte de dialogue indique la période et le nombre de nuits.',
  'help.guide.add-accommodation.step.4':
    "Renseignez « Arrivée », « Jusqu'à » et « Départ », et le numéro de réservation sous « Confirmation ». Ces quatre champs peuvent rester vides.",
  'help.guide.add-accommodation.step.5':
    'Choisissez l’établissement sous « Sélectionner un hébergement ». « Catégorie », au-dessus de la liste, la limite à une seule catégorie.',
  'help.guide.add-accommodation.step.6': 'Cliquez sur « Enregistrer ».',
  'help.guide.add-accommodation.result':
    'Le séjour apparaît sur chaque jour qu’il couvre, « Arrivée » le premier jour et « Départ » le dernier. L’établissement devient une étape le jour de l’arrivée, la carte affiche donc l’itinéraire pour s’y rendre, et une réservation d’hôtel apparaît dans l’onglet « Réservations ».',
  'help.guide.add-accommodation.tip.1':
    "Le sélecteur s'ouvre sur le jour d'où vous venez, avec le départ le lendemain. Vous pouvez modifier les deux avant d'enregistrer.",
  'help.guide.add-accommodation.tip.2':
    "Attribuez la catégorie « Hôtel » à l'hôtel lors de sa création. « Catégorie », au-dessus de la liste, permet alors d'afficher uniquement vos hôtels en un clic.",
  'help.guide.add-accommodation.tip.3':
    "Tous les horaires sont facultatifs : un séjour sans heure d'arrivée ni code couvre quand même ses nuits, et son itinéraire est quand même tracé.",
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Modifier ou annuler une nuitée réservée',
  'help.guide.edit-accommodation.goal': 'Déplacer un séjour, corriger ses horaires ou le retirer du programme.',
  'help.guide.edit-accommodation.step.1':
    'La carte affiche l’établissement et son adresse, « Arrivée » ou « Départ » les jours concernés avec les horaires, le numéro de confirmation et, sous « Réservation », la réservation associée.',
  'help.guide.edit-accommodation.step.2':
    "Le crayon à sa droite, « Modifier l'hébergement », ouvre le séjour en modification. La fenêtre s’intitule alors « Modifier l'hébergement ».",
  'help.guide.edit-accommodation.step.3':
    "Corrigez « Arrivée », « Jusqu'à », « Départ » et « Confirmation ». Vous pouvez aussi changer ici les jours, au-dessus, et l’établissement, en dessous.",
  'help.guide.edit-accommodation.step.4': 'Cliquez sur « Enregistrer ».',
  'help.guide.edit-accommodation.step.5':
    'Le X à côté du crayon, « Retirer », supprime le séjour. Aucune confirmation n’est demandée, et la réservation d’hôtel liée au séjour est également supprimée.',
  'help.guide.edit-accommodation.result':
    'La modification s’applique immédiatement à tous les jours du séjour, ainsi qu’à la réservation d’hôtel dans l’onglet « Réservations ».',
  'help.guide.edit-accommodation.tip.1':
    "Une nuit au milieu d'un séjour n'affiche ni « Arrivée » ni « Départ » : seuls le premier et le dernier jour de la période en ont un.",
  'help.guide.edit-accommodation.tip.2':
    "Annuler un séjour supprime aussi l'étape qu'il avait ajoutée au jour d'arrivée, ainsi que toute dépense liée à sa réservation. En cas d'erreur, réservez de nouveau la nuit.",
  // day-bookings
  'help.guide.day-bookings.title': "Les réservations du jour en un coup d'œil",
  'help.guide.day-bookings.goal': 'Voir en un seul endroit ce qui est déjà réservé pour ce jour et si c’est confirmé.',
  'help.guide.day-bookings.step.1':
    '« Réservations » liste les réservations de la journée : celles datées de ce jour et celles liées à l’une de ses étapes. Une réservation liée à une étape d’un autre jour n’apparaît qu’à cette étape.',
  'help.guide.day-bookings.step.2':
    'Une ligne indique le type de réservation, son nom et, si elle est liée à une étape, le nom de cette étape en gris. Ses horaires figurent tout à droite, avant le point de statut.',
  'help.guide.day-bookings.step.3':
    'La couleur indique le statut d’une réservation : vert pour confirmé, orange pour en attente, et un trajet en transports en commun apparaît en bleu, sans statut. Les hôtels ne figurent pas dans cette liste, ils ont leur propre section plus bas.',
  'help.guide.day-bookings.step.4':
    'Cliquez sur une ligne pour ouvrir la réservation. La pastille de son en-tête la fait passer de « En attente » à « Confirmé », ou l’inverse, et « Modifier », en bas, permet de changer le reste. Les nouvelles réservations se créent dans l’onglet « Réservations », les transports dans l’onglet « Transports ».',
  'help.guide.day-bookings.result':
    'Tout ce qui est daté de ce jour, et tout ce qui est lié à l’une de ses étapes, figure dans cette liste.',
  'help.guide.day-bookings.tip.1':
    'Une réservation apparaît le jour correspondant à sa date. Si vous modifiez la date dans l’onglet « Réservations » ou « Transports », la réservation passe automatiquement sur l’autre jour.',
  'help.guide.day-bookings.tip.2':
    "S'il n'y a pas de bloc « Réservations », c'est que la journée n'a aucune réservation : le bloc est masqué plutôt qu'affiché vide.",
  'help.guide.map-lock.title': 'Verrouiller la carte',
  'help.guide.map-lock.goal': 'Garder la carte immobile pendant que vous parcourez les jours et les lieux.',
  'help.guide.map-lock.step.1':
    'Le cadenas est le plus haut des deux boutons ronds en bas à gauche de la carte ; au survol, il indique « Verrouiller la vue de la carte ». Cliquez dessus. Tant qu’il est fermé, ouvrir un jour ou choisir un lieu ne zoome plus et ne déplace plus la carte, et le bouton indique désormais « Laisser la carte suivre la sélection ».',
  'help.guide.map-lock.result':
    'La carte reste là où vous l’avez laissée pendant que vous travaillez sur le programme.',
  'help.guide.map-lock.tip.1':
    'Cliquez de nouveau sur le cadenas, désormais « Laisser la carte suivre la sélection », et la carte suit à nouveau ce que vous choisissez. Le cadenas n’existe que sur ordinateur ; sur téléphone, la carte suit toujours la sélection.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Carte',
  'help.ctx.trip-map.summary':
    'Le centre du programme : chaque lieu du voyage sous forme d’épingle, chaque sortie sous forme de tracé, les itinéraires entre eux, et les boutons sur les bords de la carte pour verrouiller la vue, passer en vue satellite, afficher tout le voyage d’un coup et afficher les lieux de la zone que vous regardez.',
  'help.ctx.trip-map.bullet.1':
    'Chaque épingle est un lieu : elle affiche sa photo s’il en a une, sinon la couleur et l’icône de sa catégorie. Survolez une épingle pour afficher une fiche avec son image, son nom et son adresse, ainsi que sa note et sa catégorie si le lieu en a. Faites glisser une épingle sur une carte de jour pour y planifier le lieu. Un séjour dont la réservation est encore en attente apparaît estompé, avec un anneau en pointillés.',
  'help.ctx.trip-map.bullet.2':
    'Les épingles trop proches les unes des autres sont regroupées en un cercle sombre avec un chiffre. Cliquez sur le cercle pour zoomer sur les épingles qu’il contient. Si « Repères compacts pour les lieux non planifiés » est activé, dans Paramètres > Affichage sous « Voyage et carte », les lieux qui ne sont encore sur aucun jour apparaissent comme de petits points sans photo, pour mieux distinguer les étapes planifiées.',
  'help.ctx.trip-map.bullet.3':
    'Cliquez sur un repère pour ouvrir le lieu dans une fiche en bas de la carte, avec sa note, ses fichiers et les actions possibles. Cliquez sur une zone vide de la carte pour fermer la fiche.',
  'help.ctx.trip-map.bullet.4':
    'Quand un jour est ouvert dans la colonne des jours, ses étapes portent un petit badge blanc avec leur numéro dans la journée. Un lieu présent deux fois dans la journée affiche ses deux numéros. Les filtres au-dessus de la liste des lieux (« Afficher », les catégories et l’étoile de note minimale) filtrent aussi les épingles de la carte.',
  'help.ctx.trip-map.bullet.5':
    'La rangée d’icônes en haut cherche dans la partie visible de la carte : Restaurants, Cafés, « Bars & vie nocturne », « Hébergement », « Sites touristiques », « Musées & culture », « Nature & parcs » et « Activités ». Les catégories ajoutées par un plugin suivent après un fin séparateur. Si la rangée dépasse la largeur de la carte, la molette de la souris la fait défiler horizontalement. « Rechercher dans cette zone » relance la recherche après un déplacement de la carte.',
  'help.ctx.trip-map.bullet.6':
    'Faites un clic droit n’importe où sur la carte pour ouvrir le formulaire de lieu à cet endroit, avec l’adresse déjà recherchée. Deux boutons ronds se trouvent en bas à gauche : le cadenas, « Verrouiller la vue de la carte », fige la vue pendant que vous parcourez jours et lieux, et le bouton en dessous, « Passer à la vue satellite », remplace la carte par des images satellite.',
  'help.ctx.trip-map.bullet.7':
    "« Afficher tout le voyage », en bas à droite, trace d'un coup tous les jours de trajet et liste ce que couvre chaque jour. L'icône d'itinéraire sur la ligne d'une réservation trace cette réservation, et celle de la barre d'outils au-dessus des jours trace toutes les réservations. Cliquez sur l'extrémité d'une réservation tracée pour ouvrir ses détails.",
  'help.ctx.trip-map.bullet.8':
    'Si l’extension Dawarich est activée, le bouton rond Dawarich sous « Afficher tout le voyage » affiche le trajet réellement enregistré par votre téléphone. « Afficher le trajet enregistré » le trace en pointillés sous l’itinéraire prévu, avec une couleur par jour. S’il n’y a pas de tracé, le libellé du bouton en indique la raison.',
  // map-markers
  'help.guide.map-markers.title': 'Lire la carte',
  'help.guide.map-markers.goal': 'Comprendre ce que signifient chaque épingle, badge et bulle de la carte.',
  'help.guide.map-markers.step.1':
    'La carte affiche tous les lieux du voyage. Lorsque des repères sont trop proches pour être distingués, ils sont regroupés dans un cercle sombre qui indique leur nombre. Cliquez sur le cercle pour zoomer sur ces repères ou, au niveau de zoom maximal, pour les écarter les uns des autres.',
  'help.guide.map-markers.step.2':
    'Une épingle affiche la photo du lieu s’il en a une, sinon la couleur et l’icône de sa catégorie. Un séjour dont la réservation est encore en attente apparaît estompé, avec un anneau en pointillés. Au survol d’une épingle, une fiche s’ouvre à côté : la même photo en plus grand, le nom et l’adresse, ainsi que la note et la catégorie si le lieu en a.',
  'help.guide.map-markers.step.3':
    'Cliquez sur une épingle : le lieu s’ouvre dans une fiche en bas de la carte, avec l’image, le nom et l’adresse en haut, puis les étoiles, la description et les fichiers, y compris ceux de sa réservation. En bas se trouvent les actions : « Ajouter au jour » quand un jour est ouvert (« Retirer du jour » si le lieu y figure déjà), « Navigation », « Ouvrir le site web », « Enregistrer dans une collection » (« Enregistré » une fois ajouté), et à droite la corbeille et « Modifier ». Le X en haut, ou un clic sur une zone vide de la carte, ferme la fiche.',
  'help.guide.map-markers.step.4':
    "Ouvrez un jour dans la colonne des jours : ses étapes sont numérotées. Le petit badge blanc dans le coin d'un repère indique la position de l'étape dans la journée. Un lieu qui figure deux fois dans la journée affiche ses deux numéros. Quand aucun jour n'est ouvert, il n'y a pas de numéros, et le coin affiche à la place la note du lieu, s'il en a une.",
  'help.guide.map-markers.step.5':
    'Faites glisser un repère de la carte sur une carte de jour dans la colonne des jours : le lieu est planifié ce jour-là, comme si vous faisiez glisser sa ligne depuis la liste des lieux.',
  'help.guide.map-markers.result':
    "Rien n'a changé dans le voyage : la carte se contente de l'afficher. Chaque repère indique de quel lieu il s'agit, à quel jour il est prévu et dans quel ordre.",
  'help.guide.map-markers.tip.1':
    'Quand vous repliez un jour dans la colonne des jours, ses étapes sont masquées sur la carte. Dépliez de nouveau le jour pour les réafficher.',
  'help.guide.map-markers.tip.2':
    'Les filtres au-dessus de la liste des lieux déterminent aussi ce qu’affiche la carte : « Afficher » (« Non planifiés », « Prévu »), les catégories sous le bouton étiquette et une note minimale sous l’étoile réduisent tous le nombre d’épingles. Le filtre par pays ne s’applique qu’à la liste.',
  'help.guide.map-markers.tip.3':
    'Cette carte n’a pas de boutons de zoom : la molette zoome, un double-clic zoome d’un cran, et faire glisser la carte la déplace.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Trouver des lieux autour de vous sur la carte',
  'help.guide.map-nearby-places.goal':
    'Chercher des restaurants, des sites à visiter ou un hôtel dans le quartier affiché sur la carte, et en ajouter un au voyage.',
  'help.guide.map-nearby-places.step.1':
    'La rangée d’icônes en haut de la carte permet de chercher par catégorie : Restaurants, Cafés, « Bars & vie nocturne », « Hébergement », « Sites touristiques », « Musées & culture », « Nature & parcs » et « Activités ». Les catégories ajoutées par un plugin suivent après un fin séparateur ; survolez une icône pour voir son nom.',
  'help.guide.map-nearby-places.step.2':
    'Cliquez sur une catégorie. TREK cherche ce type de lieu dans la partie visible de la carte et place un repère de la couleur de la catégorie pour chaque résultat. Une seule catégorie à la fois : cliquer sur une autre la remplace, et cliquer sur la catégorie active la désactive.',
  'help.guide.map-nearby-places.step.3':
    'Quand vous déplacez la carte, un second bouton apparaît sous la rangée : « Rechercher dans cette zone » relance la même recherche pour la nouvelle vue. Déplacer la carte ne lance pas de nouvelle recherche automatiquement, ce qui limite le nombre de requêtes.',
  'help.guide.map-nearby-places.step.4':
    'Survolez une épingle pour voir le nom de ce que la recherche a trouvé. Cliquez sur l’épingle : le formulaire du lieu s’ouvre avec ses informations déjà remplies, à savoir le nom en haut de la boîte de dialogue, « Adresse », « Latitude » et « Longitude », ainsi que le site web et le numéro de téléphone si la recherche les a trouvés.',
  'help.guide.map-nearby-places.step.5':
    'Vérifiez ce qui a été rempli et complétez ce que la recherche ne pouvait pas savoir. La pastille de catégorie sous le nom est déjà réglée si le voyage a une catégorie correspondante, par exemple restaurant pour un restaurant ; sinon, elle indique « Sans catégorie » jusqu’à ce que vous en choisissiez une. Ajoutez une « Description » et vos propres notes.',
  'help.guide.map-nearby-places.step.6':
    'Cliquez sur « Ajouter ». Si un lieu du même nom ou au même endroit figure déjà dans le voyage, TREK vous le signale et le bouton devient « Ajouter quand même ».',
  'help.guide.map-nearby-places.result':
    'Le lieu figure dans la liste des lieux et sur la carte comme une épingle du voyage, parmi les « Non planifiés » tant que vous ne l’avez pas placé sur un jour. Les épingles de recherche restent affichées jusqu’à ce que vous désactiviez la catégorie.',
  'help.guide.map-nearby-places.tip.1':
    'La rangée est masquée si « Explorer les lieux sur la carte » est désactivé dans Paramètres > Affichage, sous « Voyage et carte ».',
  'help.guide.map-nearby-places.tip.2':
    'Les résultats proviennent de l’index TREK Places et d’OpenStreetMap : c’est l’une des rares fonctions du programme qui nécessite une connexion.',
  'help.guide.map-nearby-places.tip.3':
    'Une recherche ne couvre que la zone affichée : zoomez donc sur la rue qui vous intéresse. Une recherche sur toute une ville ne renvoie que les soixante premiers résultats, sans ordre précis.',
  // map-add-place
  'help.guide.map-add-place.title': "Créer un lieu d'un clic droit sur la carte",
  'help.guide.map-add-place.goal': 'Placer un lieu exactement où vous le voulez, sans le chercher au préalable.',
  'help.guide.map-add-place.step.1':
    "Faites un clic droit à l'endroit voulu sur la carte. Le formulaire de lieu s'ouvre avec le titre « Ajouter un lieu/activité ».",
  'help.guide.map-add-place.step.2':
    "« Latitude » et « Longitude » sont déjà réglées sur ce point. TREK recherche les coordonnées et remplit « Adresse » avec le résultat. Si la recherche trouve un nom, TREK remplit aussi le nom en haut de la fenêtre. Rien n'est encore enregistré : corrigez ce qui est inexact.",
  'help.guide.map-add-place.step.3':
    'Saisissez un nom facile à reconnaître dans le champ en haut de la boîte de dialogue. Choisissez une catégorie dans la pastille en dessous, qui affiche « Sans catégorie » tant que vous n’en avez pas choisi. Ajoutez ensuite les autres informations utiles : « Description », « Notes », « Site web ».',
  'help.guide.map-add-place.step.4':
    'Cliquez sur « Ajouter ». Le lieu est ajouté à la liste comme non planifié, même si un jour est ouvert : le clic droit sur la carte définit l’emplacement, pas le jour.',
  'help.guide.map-add-place.result':
    'Le lieu figure dans la liste et sur la carte, parmi les « Non planifiés » tant que vous ne l’avez pas placé sur un jour.',
  'help.guide.map-add-place.tip.1':
    "L'adresse est déduite des coordonnées : elle peut donc afficher une rue plutôt qu'un nom, voire rester vide en rase campagne. Vous pouvez modifier les deux champs.",
  'help.guide.map-add-place.tip.2':
    'Sur les cartes MapLibre GL et Mapbox GL, un clic du milieu a le même effet, tout comme un appui long sur un écran tactile.',
  // map-satellite
  'help.guide.map-satellite.title': 'Passer en vue satellite',
  'help.guide.map-satellite.goal': 'Passer de la carte classique aux images aériennes, et inversement.',
  'help.guide.map-satellite.step.1':
    'Le sélecteur de fond de carte est le plus bas des deux boutons ronds en bas à gauche de la carte, sous le cadenas. Son icône montre toujours le fond vers lequel il bascule, et son info-bulle le précise : « Passer à la vue satellite ». Cliquez dessus.',
  'help.guide.map-satellite.step.2':
    'La carte affiche maintenant des images aériennes. Elles sont assez détaillées pour distinguer chaque bâtiment, et vous n’avez pas besoin de votre propre clé. Tout ce que TREK affiche reste par-dessus : les épingles, l’itinéraire du jour, les traces et les itinéraires des réservations.',
  'help.guide.map-satellite.step.3':
    'Le bouton indique désormais « Passer à la vue carte ». Cliquez dessus pour revenir à la vue carte.',
  'help.guide.map-satellite.result': 'La carte est redessinée, et le fond choisi est mémorisé dans votre compte.',
  'help.guide.map-satellite.tip.1':
    "Ce choix est enregistré dans votre compte et non dans le voyage : chaque voyage s'ouvre tel que vous l'avez laissé, quel que soit le moteur de carte utilisé.",
  'help.guide.map-satellite.tip.2':
    "Les images satellite n'ont pas de libellés : les noms de rues, les quartiers et les numéros ne figurent que sur la carte classique. Revenez-y pour chercher une adresse.",
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Voir tout le voyage et ses distances',
  'help.guide.map-whole-trip.goal':
    'Afficher tous les jours de voyage au lieu du seul jour ouvert, et voir la distance parcourue chaque jour.',
  'help.guide.map-whole-trip.step.1':
    "Le bouton rond « Afficher tout le voyage » se trouve en bas à droite de la carte. Cliquez dessus pour afficher d'un coup tous les jours de trajet du voyage, chacun dans sa propre couleur, afin de distinguer les jours voisins.",
  'help.guide.map-whole-trip.step.2':
    'La carte récapitulative au-dessus du bouton liste ces jours : une pastille de couleur, le nom du jour, une icône pour chaque mode de transport utilisé et la distance parcourue. « Distance totale » figure en haut.',
  'help.guide.map-whole-trip.step.3':
    "Cliquez sur un jour dans la carte récapitulative pour le sélectionner : sa ligne est surlignée et le jour s'ouvre dans la colonne des jours. Utilisez la molette au-dessus d'une ville pour zoomer : les jours qui passent par cette ville s'affichent côte à côte, chacun dans sa couleur.",
  'help.guide.map-whole-trip.step.4':
    "Le bouton affiche maintenant « Masquer tout le voyage ». Cliquez dessus pour n'afficher de nouveau que le jour ouvert.",
  'help.guide.map-whole-trip.result':
    'Chaque jour de voyage est tracé dans sa propre couleur, et la fiche indique ce que couvre chaque jour ainsi que le total du voyage.',
  'help.guide.map-whole-trip.tip.1':
    'Le total est calculé quelques tronçons à la fois. Tant que … s’affiche après lui, le chiffre n’est qu’une somme partielle. Il est définitif une fois tous les tronçons calculés.',
  'help.guide.map-whole-trip.tip.2':
    'Si le calcul d’itinéraire échoue pour un tronçon, celui-ci reste une ligne droite et n’est pas compté. La fiche vous le signale, pour que le total ne paraisse pas plus bas sans avertissement.',
  'help.guide.map-whole-trip.tip.3':
    "Un jour qui compte moins de deux étapes localisées et aucun trajet vers ou depuis son hôtel n'a pas d'itinéraire à tracer : il n'apparaît donc pas du tout dans la carte récapitulative.",
  // map-booking-routes
  'help.guide.map-booking-routes.title': "Afficher l'itinéraire d'une réservation sur la carte",
  'help.guide.map-booking-routes.goal':
    'Afficher sur la carte les vols, les trains et les trajets en voiture réservés, puis les masquer.',
  'help.guide.map-booking-routes.step.1':
    "Les itinéraires des réservations sont masqués tant que vous n'en activez pas un. À droite de la ligne d'un transport, dans la colonne des jours, se trouve une petite icône d'itinéraire : « Afficher les itinéraires ».",
  'help.guide.map-booking-routes.step.2':
    'Cliquez dessus : la réservation apparaît sur la carte. Un vol sous forme d’arc de grand cercle, un trajet en voiture sur les routes réelles, un train comme une suite de gares. « Confirmé » est tracé en trait continu, « En attente » en pointillés, et les extrémités de l’itinéraire sont des pastilles bleues avec l’icône du transport.',
  'help.guide.map-booking-routes.step.3':
    "Cliquez sur une pastille d’extrémité : les détails de la réservation s’ouvrent, avec le statut, le type et les jours en pastilles dans l’en-tête coloré, les horaires aux deux extrémités, les autres détails en dessous et, en bas, « Sur la carte », qui désactive à nouveau cet itinéraire, « Modifier l'itinéraire » pour une liaison en transports en commun, la corbeille qui supprime la réservation, et « Modifier ». Le X dans l’en-tête ferme les détails.",
  'help.guide.map-booking-routes.step.4':
    'L’icône d’itinéraire dans la barre d’outils au-dessus des jours agit sur tout le voyage d’un coup : « Afficher tous les itinéraires » trace toutes les réservations qui ont un itinéraire.',
  'help.guide.map-booking-routes.step.5':
    'Cette action remplace vos choix précédents : les itinéraires activés réservation par réservation sont réinitialisés. Cliquez de nouveau sur le bouton, devenu « Masquer tous les itinéraires », pour masquer tous les itinéraires des réservations.',
  'help.guide.map-booking-routes.result':
    "Les réservations choisies sont tracées sur la carte, et ce choix est conservé pour ce voyage dans ce navigateur jusqu'à ce que vous le modifiiez.",
  'help.guide.map-booking-routes.tip.1':
    'Les extrémités n’affichent le code de l’aéroport ou le nom de la gare que si « Étiquettes des itinéraires » est activé dans Paramètres > Affichage, sous « Voyage et carte » ; sinon, elles n’affichent que l’icône.',
  'help.guide.map-booking-routes.tip.2':
    '« Toujours afficher les itinéraires de réservation », dans la même section, les affiche d’emblée sur tous les voyages où vous n’avez pas encore fait ce réglage vous-même.',
  'help.guide.map-booking-routes.tip.3':
    "Pour être tracée, une réservation doit avoir un départ et une arrivée avec des coordonnées : un hôtel ou un restaurant n'a donc pas d'icône d'itinéraire.",
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Afficher le trajet réellement parcouru',
  'help.guide.map-dawarich-trail.goal':
    "Afficher sur la carte le trajet enregistré par Dawarich sur votre téléphone, en pointillés à côté de l'itinéraire prévu, et voir jour par jour comment s'est réellement passé le voyage.",
  'help.guide.map-dawarich-trail.step.1':
    'Le bouton rond Dawarich se trouve en bas à droite de la carte, sous « Afficher tout le voyage ». Au survol, il indique « Afficher le trajet enregistré ». Cliquez dessus. TREK demande à votre Dawarich les données des dates du voyage, et un anneau tourne autour du bouton en attendant la réponse.',
  'help.guide.map-dawarich-trail.step.2':
    'Le trajet enregistré apparaît en pointillés, avec une couleur par jour, sous l’itinéraire prévu pour que le programme reste lisible. Le bouton indique désormais « Masquer le trajet enregistré ». Chaque jour se termine à minuit, heure locale. Quand vous repliez un jour dans la colonne des jours, ses pointillés et ses étapes sont masqués sur la carte.',
  'help.guide.map-dawarich-trail.step.3':
    'Cliquez aussi sur « Afficher tout le voyage » : chaque jour prévu est tracé en trait continu à côté de l’enregistrement en pointillés. Là où les deux lignes se superposent, la journée s’est déroulée comme prévu. Là où les pointillés s’écartent de l’itinéraire prévu, ce n’est pas le cas.',
  'help.guide.map-dawarich-trail.result':
    "Ce que vous aviez prévu et ce que vous avez réellement fait s'affichent ensemble sur la carte, en pointillés et en trait plein. La carte récapitulative au-dessus des boutons liste toujours les jours prévus et leurs distances.",
  'help.guide.map-dawarich-trail.tip.1':
    "L'activation est enregistrée pour chaque voyage dans votre compte : elle est donc la même dans tous les navigateurs et sur tous les appareils. Tant que le trajet est affiché, TREK interroge Dawarich toutes les deux minutes, pour qu'un voyage en cours se mette à jour sans recharger la page. Le trajet lui-même n'est jamais stocké : il ne figure ni dans la base de données de TREK, ni dans les sauvegardes, et n'est pas disponible hors ligne.",
  'help.guide.map-dawarich-trail.tip.2':
    'Le libellé du bouton explique pourquoi la carte est vide : « Chargement du trajet enregistré… » pendant le chargement, « Rien n’a été enregistré à ces dates », « Le trajet enregistré n’a pas pu être chargé », ou « Le trajet enregistré nécessite une connexion » quand TREK est hors ligne.',
  // map-compass
  'help.guide.map-compass.title': 'Faire pivoter la carte et retrouver le nord',
  'help.guide.map-compass.goal':
    'Orienter la carte dans votre direction de déplacement, et la remettre au nord d’un clic.',
  'help.guide.map-compass.step.1':
    'Faites pivoter la carte en la faisant glisser avec le bouton droit, ou en maintenant Ctrl et en glissant avec le bouton gauche ; sur un écran tactile, tournez avec deux doigts. La boussole ronde à côté de la rangée d’icônes de catégories, en haut de la carte, tourne avec elle : sa flèche indique toujours le nord et s’incline donc du même angle que la carte.',
  'help.guide.map-compass.step.2':
    'Cliquez sur la boussole. Ce bouton, « Réorienter au nord », remet le nord en haut de la carte, rétablit une vue à plat, et la flèche pointe de nouveau vers le haut.',
  'help.guide.map-compass.result':
    "La carte est de nouveau orientée vers le nord et à plat. Le voyage n'a pas changé : la boussole ne modifie que l'affichage.",
  'help.guide.map-compass.tip.1':
    "La boussole n'existe que sur les cartes MapLibre GL et Mapbox GL. La carte Leaflet ne peut pas pivoter, elle n'a donc pas de boussole. « Fournisseur de carte », dans les Paramètres, sous « Carte », détermine la carte utilisée, et « Enregistrer la carte » enregistre ce choix.",
  'help.guide.map-compass.tip.2':
    "Le clic supprime aussi l'inclinaison. Faites glisser vers le haut ou le bas avec le bouton droit de la souris pour incliner la vue, et « Reset north » la remet à plat et réinitialise la rotation. Sur Mapbox GL avec « Bâtiments 3D & terrain » activé, cela aplatit aussi la vue 3D jusqu'à ce que vous l'incliniez de nouveau.",

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collaboration',
  'help.ctx.trip-collab.summary':
    'L’onglet où le groupe planifie ensemble, en cinq cartes : la discussion à gauche, « Notes » et « Liens » à côté, « Sondages » et « À venir » en dessous. Tout ce qui est écrit ici apparaît aussitôt sur l’écran de tous les autres membres, sans rechargement.',
  'help.ctx.trip-collab.bullet.1':
    "Le chat est la carte de gauche. Écrivez dans « Écrire un message… » et appuyez sur Entrée. Maj + Entrée permet d'aller à la ligne. Le smiley ajoute un emoji, et « Joindre des images » ajoute jusqu'à quatre images au message.",
  'help.ctx.trip-collab.bullet.2':
    "Survolez un message pour afficher « Répondre » et, sur vos propres messages, « Supprimer ». Faites un clic droit pour les huit réactions rapides. Un message supprimé est remplacé par une mention indiquant qui l'a supprimé.",
  'help.ctx.trip-collab.bullet.3':
    "« Notes » est l’espace de notes partagé : « Nouvelle note », dans son en-tête, crée une note, et l’engrenage à côté ouvre « Gérer les catégories » pour leurs noms et couleurs. Dès qu’il existe des catégories, une rangée de pastilles sous l’en-tête filtre les cartes : « Tous », ou une seule catégorie. Une carte de note affiche sa catégorie sous forme de point coloré et son lien sous forme de bouton rond, et ses trois points (« Plus d'options ») contiennent « Développer », « Épingler », « Modifier » et « Supprimer ».",
  'help.ctx.trip-collab.bullet.4':
    '« Liens » rassemble les adresses web du voyage. « Ajouter un lien » demande un titre et une adresse http ou https. « Modifier le lien », « Épingler le lien » et « Supprimer le lien » se trouvent en bout de pastille, et les liens épinglés restent en tête.',
  'help.ctx.trip-collab.bullet.5':
    "Utilisez les sondages pour prendre des décisions. « Nouveau sondage » pose une question avec au moins deux options. Cliquez sur une option pour voter. Le cadenas (« Fermer ») et la corbeille (« Supprimer »), à droite de l'en-tête d'un sondage, clôturent le vote ou suppriment le sondage.",
  'help.ctx.trip-collab.bullet.6':
    '« À venir » liste les étapes du voyage encore à venir, jusqu’à huit, avec leurs horaires et les participants. Cette carte ne fait que lire le programme du jour ; les horaires se règlent là-bas.',
  // write-note
  'help.guide.write-note.title': 'Rédiger une note partagée',
  'help.guide.write-note.goal':
    'Mettre à la disposition de tous ce dont le groupe a besoin, comme une règle, une adresse ou un rappel.',
  'help.guide.write-note.step.1':
    "Cliquez sur « Nouvelle note » dans l'en-tête de la carte Notes. La fenêtre de la note s'ouvre, avec le curseur déjà placé dans le champ du titre.",
  'help.guide.write-note.step.2':
    "Saisissez le titre à l'emplacement « Titre de la note », en haut de la fenêtre. C'est le seul champ obligatoire : « Créer » reste grisé tant que le titre est vide, et appuyer sur Entrée dans le titre crée immédiatement la note.",
  'help.guide.write-note.step.3':
    '« Contenu » accueille le texte et prend en charge le Markdown : un mot en gras, une liste, un titre. La carte affiche les trois premières lignes, et « Développer », dans son menu, ouvre la note complète.',
  'help.guide.write-note.step.4':
    'Sous « Catégorie », choisissez celle de la note. Sa couleur s’applique dès maintenant à l’en-tête de la boîte de dialogue, puis à celui de la carte. La première catégorie est présélectionnée. Les pastilles correspondent aux catégories existantes, et vous en créez une nouvelle dans « Gérer les catégories ». Tant que le voyage n’a aucune catégorie, cette ligne n’apparaît pas.',
  'help.guide.write-note.step.5':
    "« Site web » accueille un lien associé à la note. La carte affiche alors en haut un bouton de lien rond qui l'ouvre.",
  'help.guide.write-note.step.6':
    'Cliquez sur « Créer ». Seuls « Annuler » et sa croix ferment la boîte de dialogue : un clic en dehors ou Échap ne vous fait donc pas perdre ce que vous avez écrit.',
  'help.guide.write-note.result':
    'La note apparaît sous forme de carte dans le panneau « Notes », avec un en-tête à la couleur de sa catégorie, et tous les autres membres la voient immédiatement.',
  'help.guide.write-note.tip.1':
    "Les trois points d’une carte (« Plus d'options ») proposent « Développer », « Épingler », « Modifier » et « Supprimer ». « Épingler » garde la note en haut du panneau, avec un cadre à sa couleur. Toutes les autres notes sont triées par date de dernière modification.",
  'help.guide.write-note.tip.2':
    "L'engrenage à côté de « Nouvelle note » ouvre « Gérer les catégories ». Vous pouvez y attribuer une couleur à une catégorie, la renommer partout d'un coup, ou la créer avant qu'une note ne l'utilise. Rien ne change tant que vous n'avez pas cliqué sur « Enregistrer ».",
  'help.guide.write-note.tip.3':
    '« Joindre des fichiers » ajoute un document à la note, si vous avez le droit d’importer des fichiers dans le voyage. « Joindre » ouvre le sélecteur de fichiers, et vous pouvez aussi coller une image ou un PDF dans la boîte de dialogue.',
  'help.guide.write-note.tip.4':
    'Les notes ont leur propre interrupteur sous « Extensions », en dessous de « Collaboration » : un administrateur peut les désactiver tout en gardant le chat, les liens, les sondages et « Et ensuite ».',
  // shared-links
  'help.guide.shared-links.title': 'Rassembler les liens du voyage',
  'help.guide.shared-links.goal':
    "Regrouper au même endroit le portail de réservation, l'album partagé et les horaires, pour ne plus avoir à les chercher dans le chat.",
  'help.guide.shared-links.step.1':
    'Cliquez sur « Ajouter un lien » dans l’en-tête de la carte « Liens ». La boîte de dialogue s’ouvre avec le curseur dans le champ du haut.',
  'help.guide.shared-links.step.2':
    'Saisissez le nom dans « Titre du lien », collez l’adresse dans « Lien » en dessous, puis cliquez sur « Enregistrer le lien ».',
  'help.guide.shared-links.step.3':
    'La pastille affiche le nom et le site vers lequel elle pointe. Cliquez dessus pour ouvrir la page dans un nouvel onglet.',
  'help.guide.shared-links.step.4':
    "Les trois boutons ronds en bout de ligne sont « Modifier le lien », « Épingler le lien » et « Supprimer le lien ». « Épingler le lien » place la pastille en tête du panneau et l'affiche dans la couleur d'accent. « Supprimer le lien » demande d'abord une confirmation, car le lien disparaît pour tous les membres.",
  'help.guide.shared-links.result':
    "Le lien apparaît en pastille dans le panneau « Liens », épinglé en tête, et s'affiche immédiatement sur l'écran de chaque membre.",
  'help.guide.shared-links.tip.1':
    'Seules les adresses http ou https sont acceptées. Tout le reste est refusé, et la fenêtre reste ouverte avec ce que vous avez saisi.',
  'help.guide.shared-links.tip.2':
    "Les liens épinglés apparaissent en premier, puis les plus récents. La petite icône à côté d'un titre est le favicon du site, chargé depuis le site lui-même : sans connexion internet, la pastille affiche donc une simple icône de lien.",
  'help.guide.shared-links.tip.3':
    '« Liens » a son propre interrupteur sous « Extensions », sous « Collaboration » : un administrateur peut donc désactiver ce panneau sans toucher au reste de l’onglet.',
  // create-poll
  'help.guide.create-poll.title': 'Consulter le groupe',
  'help.guide.create-poll.goal':
    'Transformer une question restée sans réponse dans la discussion en un sondage auquel tout le monde peut répondre.',
  'help.guide.create-poll.step.1':
    "Cliquez sur « Nouveau sondage » dans l'en-tête de la carte Sondages. La fenêtre s'ouvre.",
  'help.guide.create-poll.step.2':
    'Rédigez la question sous « Question ». La mention « Markdown pris en charge » sous le champ signifie que le gras, les retours à la ligne ou une courte liste fonctionnent ici.',
  'help.guide.create-poll.step.3':
    'Remplissez « Option 1 » et « Option 2 » sous « Options ». Il faut au moins deux options non vides, et une option peut tenir sur plusieurs lignes.',
  'help.guide.create-poll.step.4':
    "« Ajouter une option », en dessous, ajoute une troisième option, une quatrième, autant que nécessaire. La petite croix à côté d'une ligne, visible dès que vous avez plus de deux options, supprime cette option.",
  'help.guide.create-poll.step.5':
    '« Choix multiples » permet à chacun de cocher plusieurs options. Si l’option est désactivée, le vote d’une personne se déplace vers la nouvelle option quand elle en choisit une autre.',
  'help.guide.create-poll.step.6': 'Cliquez sur « Créer le sondage ».',
  'help.guide.create-poll.result':
    'Le sondage apparaît en haut du panneau « Sondages », ouvert, avec 0 vote dans son en-tête.',
  'help.guide.create-poll.tip.1': 'La question est mise en forme en Markdown, les options restent en texte brut.',
  'help.guide.create-poll.tip.2':
    "« Créer le sondage » reste grisé tant qu'il n'y a pas de question et au moins deux options remplies.",
  'help.guide.create-poll.tip.3':
    "Une date limite ne peut être fixée que dans l'application mobile. Un sondage avec date limite affiche le temps restant dans une pastille ambre de son en-tête et se ferme une fois le délai écoulé.",
  'help.guide.create-poll.tip.4':
    'Les sondages ont leur propre interrupteur sous « Extensions », en dessous de « Collaboration » : un administrateur peut les désactiver tout en gardant les quatre autres panneaux.',
  // vote-poll
  'help.guide.vote-poll.title': 'Voter et consulter le résultat',
  'help.guide.vote-poll.goal': 'Voter, voir les résultats du groupe et modifier votre vote.',
  'help.guide.vote-poll.step.1':
    'Cliquez sur l’option de votre choix. Son cercle affiche une coche, l’option reçoit un cadre dans la couleur d’accent et la barre derrière elle s’allonge.',
  'help.guide.vote-poll.step.2':
    "Le résultat complet s'affiche alors : la barre représente la part des votes, le pourcentage est à droite et les petits cercles montrent les personnes ayant choisi cette option, jusqu'à trois.",
  'help.guide.vote-poll.step.3':
    "Vous avez changé d'avis ? Cliquez sur une autre option. Sur un sondage sans « Choix multiples », votre vote passe sur la nouvelle option au lieu de s'ajouter.",
  'help.guide.vote-poll.step.4':
    "Le nombre de votes s'affiche dans une pastille sous la question. Cliquer sur l'option déjà choisie retire votre vote, et le compteur diminue.",
  'help.guide.vote-poll.result':
    'Votre option est cochée, les barres montrent comment le groupe a voté et les cercles indiquent qui a choisi quelle option.',
  'help.guide.vote-poll.tip.1':
    'Les pourcentages et le détail des votes n’apparaissent qu’après votre propre vote, ou une fois le sondage clos. Le nombre de votes dans l’en-tête est visible par tous.',
  'help.guide.vote-poll.tip.2':
    'Un vote n’est jamais anonyme : survolez l’un des cercles d’une option pour voir le nom de la personne qui a voté.',
  // close-poll
  'help.guide.close-poll.title': 'Clore ou supprimer un sondage',
  'help.guide.close-poll.goal':
    'Clore le vote une fois que le groupe a tranché, et supprimer un sondage devenu inutile.',
  'help.guide.close-poll.step.1':
    "« Fermer », le cadenas à droite de l'en-tête d'un sondage, met fin au vote. Les options ne sont plus cliquables.",
  'help.guide.close-poll.step.2':
    'Un sondage clos passe en bas du panneau, sous un titre « Fermé » si des sondages ouverts se trouvent au-dessus. Il porte une pastille « Fermé » et montre le résultat à tout le monde, que chacun ait voté ou non. L’option gagnante est en gras sur une barre verte ; si c’est celle que vous avez choisie, la barre prend plutôt votre couleur d’accent.',
  'help.guide.close-poll.step.3':
    "« Supprimer », la corbeille à droite de l'en-tête, supprime le sondage. Sur un sondage fermé, c'est le seul bouton, car le cadenas a disparu. Aucune confirmation n'est demandée, et les votes sont supprimés aussi.",
  'help.guide.close-poll.result':
    'Un sondage supprimé disparaît du panneau de chaque membre. Un sondage simplement fermé reste visible en bas, avec son résultat.',
  'help.guide.close-poll.tip.1':
    'La clôture est définitive : il n’est pas possible de rouvrir un sondage. Un sondage clos par erreur doit être reposé.',
  'help.guide.close-poll.tip.2':
    '« Supprimer » supprime le sondage et tous ses votes pour tout le monde, immédiatement et sans confirmation.',
  // whats-next
  'help.guide.whats-next.title': 'Consulter « À venir »',
  'help.guide.whats-next.goal': 'Voir la prochaine activité du groupe sans ouvrir le programme.',
  'help.guide.whats-next.step.1':
    "La carte liste les prochaines étapes du voyage, jusqu'à huit, dans l'ordre chronologique, sous un titre par jour : « Aujourd'hui », « Demain » ou la date, suivi du nom du jour s'il en a un. L'en-tête indique leur nombre.",
  'help.guide.whats-next.step.2':
    "À gauche de chaque étape figure son horaire : le début, « à », puis la fin si l'étape en a une, ou « TBD » si aucun horaire n'est encore défini.",
  'help.guide.whats-next.step.3':
    "À côté figurent le nom, l'adresse et, sous forme de pastilles, les personnes qui participent à cette étape. Si personne n'est associé à l'étape, tous les participants du voyage sont listés.",
  'help.guide.whats-next.result':
    'Une liste en lecture seule de ce qui vous attend : elle suit le programme, sans jamais le modifier.',
  'help.guide.whats-next.tip.1':
    'Vous n’avez rien à régler ici. Les horaires proviennent du programme du jour ; si vous les y modifiez, cette liste se met à jour aussitôt.',
  'help.guide.whats-next.tip.2':
    'Seul ce qui reste à venir est listé : une étape disparaît de la liste dès son heure de début passée, une étape du jour sans heure reste jusqu’à la fin de la journée, et à la fin d’un voyage le panneau est vide.',
  'help.guide.whats-next.tip.3':
    '« À venir » a son propre interrupteur sous « Extensions », sous « Collaboration ». C’est un panneau réservé à l’ordinateur : l’onglet « Collaboration » de l’application mobile ne l’affiche pas.',
  // trip-chat
  'help.guide.trip-chat.title': 'Discuter avec le groupe',
  'help.guide.trip-chat.goal':
    "Envoyer un message, répondre à un message précis, réagir à un autre message et supprimer l'un des vôtres.",
  'help.guide.trip-chat.step.1':
    "Écrivez dans « Écrire un message… » et appuyez sur Entrée. La flèche ronde à côté du champ a le même effet. Maj + Entrée permet d'aller à la ligne.",
  'help.guide.trip-chat.step.2':
    "Le smiley ouvre le sélecteur d'emoji, avec « Smileys », « Reactions » et « Travel ». L'emoji choisi est ajouté au texte que vous rédigez. Il n'est pas envoyé seul.",
  'help.guide.trip-chat.step.3':
    'Survolez le message de quelqu’un d’autre : un petit bouton rond apparaît dans son coin. C’est « Répondre ».',
  'help.guide.trip-chat.step.4':
    'Le message auquel vous répondez est cité au-dessus de la zone de saisie. Rédigez et envoyez votre message : la citation l’accompagne. Cliquez sur la croix de la citation pour la retirer.',
  'help.guide.trip-chat.step.5':
    'Faites un clic droit sur un message pour afficher les huit réactions rapides. Votre réaction apparaît sous le message. Cliquez de nouveau sur la même réaction pour la retirer.',
  'help.guide.trip-chat.step.6':
    "Vos propres messages affichent « Supprimer », l'icône de corbeille, à côté de « Répondre ». Le message est supprimé immédiatement, et une mention indique que vous l'avez supprimé. Cette action est irréversible.",
  'help.guide.trip-chat.result':
    "Votre réponse est le message le plus récent, avec le message cité en haut. Votre réaction apparaît sous l'autre message. À la place du message supprimé, une mention indique que vous l'avez supprimé.",
  'help.guide.trip-chat.tip.1':
    "Entrée envoie le message, Maj + Entrée va à la ligne. Un message composé uniquement d'un à trois emoji s'affiche en grand.",
  'help.guide.trip-chat.tip.2':
    "Avec « Joindre des images », vous pouvez ajouter jusqu'à quatre images à un message. Vous pouvez aussi les coller ou les déposer dans le champ.",
  'help.guide.trip-chat.tip.3':
    'Un message contenant un lien affiche en dessous une carte d’aperçu, récupérée par votre propre TREK : un lien vers une ressource à laquelle vous seul avez accès reste donc un simple lien.',
  'help.guide.trip-chat.tip.4':
    'La discussion a son propre interrupteur sous « Extensions », sous « Collaboration » : un administrateur peut la désactiver tout en conservant les notes, les liens, les sondages et « À venir ».',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listes',
  'help.ctx.trip-lists.summary':
    "Deux listes pour un voyage : la liste de bagages, qui indique qui apporte quoi et combien cela pèse, et la liste de tout ce qu'il faut faire avant et pendant le voyage. L'onglet s'affiche tant que l'extension Listes est activée.",
  'help.ctx.trip-lists.bullet.1':
    '« Liste de bagages » et « À faire », dans la barre du haut, permettent de passer de l’une à l’autre et indiquent ce que chacune contient ; les boutons tout à droite de la barre concernent celle qui est ouverte.',
  'help.ctx.trip-lists.bullet.2':
    'La liste de bagages se divise en listes, par exemple « Documents » ou « Vêtements », que vous nommez comme vous voulez. Chaque liste est une carte. Son en-tête comporte une poignée pour déplacer toute la liste, une pastille de couleur, un badge articles emballés/total, trois points avec « Renommer », « Tout cocher », « Tout décocher » et « Supprimer la liste », et une flèche pour replier la carte. « Ajouter une liste », dans la barre du dessus, en crée une nouvelle.',
  'help.ctx.trip-lists.bullet.3':
    'Chaque ligne comporte une poignée, une case à cocher et un nom, puis le petit avatar de la personne qui apporte l’article. Un article en plusieurs exemplaires a aussi un compteur, par exemple 3/10, avec un moins et un plus. Viennent ensuite la quantité dans un petit badge et, si « Suivi des bagages » est activé, le poids en grammes et une pastille de sac, puis la corbeille et un menu à trois points avec « Déplacer vers une liste », « Partagé », « Renommer » et « Supprimer ». Les commandes inutilisées d’une ligne restent estompées jusqu’à ce que vous les survoliez.',
  'help.ctx.trip-lists.bullet.4':
    '« Partagée » et « Ma liste » divisent la liste de bagages en deux : la liste que tout le monde voit, et la vôtre. « Tous », « Ouvert » et « Terminé », juste à côté, filtrent celle qui est ouverte. « A à Z », tout au bout de la rangée, trie les articles de chaque liste par nom, et un second clic rétablit votre propre ordre. La carte de progression au-dessus compte ce qui est déjà emballé.',
  'help.ctx.trip-lists.bullet.5':
    '« Appliquer un modèle » et « Enregistrer comme modèle » remplissent une liste ou l’enregistrent, pour vous éviter de tout saisir. Les deux icônes suivantes, « Exporter » et « Importer », exportent la liste en version imprimable, en PDF ou en fichier, et importent une liste. Le bouton rouge tout à droite de la carte de progression indique le nombre d’articles cochés et les supprime.',
  'help.ctx.trip-lists.bullet.6':
    "« À faire » a sa propre barre latérale : la carte de progression, les filtres « Tous », « Mes tâches », « En retard » et « Terminé », une ligne par liste, et « Ajouter une liste » en dessous. Les tâches figurent dans une carte dont l’en-tête indique le filtre et l’ordre de tri, « Priorité » ou « Date d'échéance ». Cliquez sur une tâche pour l’ouvrir dans le volet de droite. « Nouvelle tâche », dans la barre, ouvre la boîte de dialogue « Nouvelle tâche ».",
  // packing-categories
  'help.guide.packing-categories.title': 'Constituer la liste de bagages',
  'help.guide.packing-categories.goal':
    "Regrouper vos affaires en listes, y ajouter des articles et choisir qui s'occupe de chaque liste.",
  'help.guide.packing-categories.step.1':
    "Cliquez sur « Ajouter une liste » dans la barre au-dessus des listes. Une petite fenêtre s'ouvre. Saisissez le nom dans son bandeau du haut, à l'emplacement « Nom de la liste (ex. Vêtements) », puis cliquez sur « Ajouter ».",
  'help.guide.packing-categories.step.2':
    "La nouvelle liste commence par une ligne vide qui n'affiche que trois points pâles. Cliquez sur « Ajouter un article » en bas de la ligne, saisissez l'article dans « Nom de l'article... » et appuyez sur Entrée : le premier article remplace la ligne vide, et le champ reste ouvert pour le suivant.",
  'help.guide.packing-categories.step.3':
    'Renommez une ligne en cliquant sur son nom, ou avec « Renommer » dans les trois points tout à droite.',
  'help.guide.packing-categories.step.4':
    'Le cercle en pointillés avec une silhouette, dans le bandeau supérieur de la liste, attribue des membres du voyage à la liste. Choisissez un nom. Pour retirer cette personne, cliquez sur la pastille qui apparaît.',
  'help.guide.packing-categories.step.5':
    'Les trois points à côté du compteur ouvrent d’autres options : « Renommer », « Tout cocher », « Tout décocher » et « Supprimer la liste ». « Supprimer la liste » supprime la liste et tous ses articles sans autre confirmation. La flèche tout à droite replie la liste.',
  'help.guide.packing-categories.result':
    'La nouvelle liste apparaît dans la grille, avec ses articles en dessous et sa pastille de couleur. Son badge indique ce qui est déjà emballé.',
  'help.guide.packing-categories.tip.1':
    "Une liste n'existe qu'à travers ses articles. Si vous supprimez le dernier article, la ligne devient un emplacement réservé, pour que la liste garde sa position et sa couleur. Si vous supprimez aussi cette ligne, la liste est supprimée.",
  'help.guide.packing-categories.tip.2':
    "Quand vous attribuez une liste à quelqu'un, cette personne reçoit une notification de bagages. Cela ne change pas qui peut voir les articles : ce réglage se trouve sous « Partagé », dans le menu à trois points d'une ligne.",
  'help.guide.packing-categories.tip.3':
    'Deux listes peuvent porter le même nom. TREK les distingue en interne : les noms restent donc tels que vous les avez saisis.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Cocher les articles en faisant vos bagages',
  'help.guide.check-off-packing.goal':
    'Cocher ce qui est dans le sac, suivre la barre de progression et retirer les articles emballés.',
  'help.guide.check-off-packing.step.1':
    'Cliquez sur la case à gauche d’une ligne. Le nom est barré et la barre de progression se met à jour.',
  'help.guide.check-off-packing.step.2':
    "La carte de progression au-dessus des listes indique combien d'articles sont emballés sur le total, en nombre, en pourcentage et sous forme de barre.",
  'help.guide.check-off-packing.step.3':
    "Pour cocher toute une liste d'un coup, le menu à trois points de son en-tête propose « Tout cocher » et « Tout décocher ».",
  'help.guide.check-off-packing.step.4':
    "« Tous », « Ouvert » et « Terminé », à côté de « Partagée » et « Ma liste », filtrent la grille. « Ouvert » n'affiche que ce qui manque encore : une liste entièrement emballée est donc masquée.",
  'help.guide.check-off-packing.step.5':
    'Le bouton rouge « Retirer … cochés », tout à droite de la carte de progression, avec le nombre d’articles cochés, les supprime tous d’un coup après une confirmation du navigateur.',
  'help.guide.check-off-packing.result':
    'Seuls les articles restants sont listés, et la barre au-dessus indique où en sont vos bagages.',
  'help.guide.check-off-packing.tip.1': 'Un article coché peut toujours être renommé : cliquez sur son nom.',
  'help.guide.check-off-packing.tip.2':
    '« Tout cocher » et « Tout décocher » agissent sur une liste à la fois, depuis les trois points de cette liste.',
  'help.guide.check-off-packing.tip.3':
    'Quand tous les articles sont cochés, le compteur est remplacé par « Tout est emballé ! » et la barre passe au vert.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Appliquer un modèle de bagages',
  'help.guide.apply-packing-template.goal':
    'Ajouter une liste toute prête au voyage, et enregistrer la liste de ce voyage pour le prochain.',
  'help.guide.apply-packing-template.step.1':
    'Cliquez sur « Appliquer un modèle » dans la barre au-dessus de la liste.',
  'help.guide.apply-packing-template.step.2':
    "Choisissez un modèle. Chaque ligne affiche son nom et son nombre d'articles.",
  'help.guide.apply-packing-template.step.3':
    'Les articles sont ajoutés à la vue où vous vous trouvez : « Partagée » les ajoute à la liste commune visible par tous, « Ma liste » à votre propre liste.',
  'help.guide.apply-packing-template.step.4':
    'Pour conserver la liste de ce voyage pour le prochain, cliquez sur « Enregistrer comme modèle ». Une petite boîte de dialogue s’ouvre. Saisissez un nom dans le champ du haut, à l’emplacement de « Nom du modèle », et cliquez sur « Enregistrer ».',
  'help.guide.apply-packing-template.result':
    'Les listes et articles du modèle sont ajoutés au voyage, à côté de ce qui s’y trouvait déjà.',
  'help.guide.apply-packing-template.tip.1':
    'Un modèle copie la liste, la quantité, le poids et le sac de chaque article, et crée les sacs que le voyage n’a pas encore. Les coches ne sont pas copiées, et rien de ce qui figure déjà dans la liste n’est supprimé.',
  'help.guide.apply-packing-template.tip.2':
    "« Appliquer un modèle » n'apparaît que s'il existe au moins un modèle. Sinon, le bouton n'est pas affiché du tout.",
  'help.guide.apply-packing-template.tip.3':
    "« Enregistrer comme modèle » n'apparaît que pour un administrateur de l'instance, et seulement si la liste contient des articles. Le modèle reprend les articles partagés et vos propres articles, jamais les articles privés d'un autre membre.",
  // import-packing-list
  'help.guide.import-packing-list.title': 'Coller une liste de bagages complète',
  'help.guide.import-packing-list.goal':
    "Transformer d'un coup en articles de bagages une liste que vous avez déjà ailleurs.",
  'help.guide.import-packing-list.step.1':
    'Cliquez sur « Importer », l’icône avec la flèche vers le bas, tout à droite de la barre au-dessus de la liste.',
  'help.guide.import-packing-list.step.2':
    'Un article par ligne : catégorie, nom, poids en g (facultatif), sac (facultatif), checked/unchecked (facultatif). L’exemple grisé dans le cadre montre les quatre formats, et les numéros sur son bord gauche comptent les lignes saisies. Une liste Markdown fonctionne aussi : un titre donne le nom de la liste, et "- [ ]" et "- [x]" deviennent des articles.',
  'help.guide.import-packing-list.step.3':
    'Vous pouvez aussi charger les lignes depuis un fichier avec « Charger CSV/TXT/MD », en bas à gauche de la boîte de dialogue. Il accepte un fichier .csv, .txt ou .md et remplace le contenu du cadre.',
  'help.guide.import-packing-list.step.4':
    'Cliquez sur « Importer 3 » en bas à droite. Le chiffre correspond au nombre de lignes que TREK a reconnues.',
  'help.guide.import-packing-list.result':
    'Chaque ligne devient un article, dans la liste indiquée dans son premier champ. Les articles déjà présents ne changent pas.',
  'help.guide.import-packing-list.tip.1':
    'Les virgules, les points-virgules et les tabulations séparent les champs, et les guillemets droits regroupent un champ : "Chemise, bleue" reste ainsi un seul nom. Une ligne avec une seule valeur est simplement un nom. Une ligne sans liste propre va dans « Autre ». "3x" devant un nom définit la quantité.',
  'help.guide.import-packing-list.tip.2':
    'Si le voyage n’a pas encore le sac indiqué dans le quatrième champ, TREK le crée. « Importer » et « Appliquer un modèle » sont les deux façons d’ajouter poids et sacs à de nombreux articles d’un coup.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimer ou exporter la liste de bagages',
  'help.guide.export-packing-list.goal':
    'Imprimer la liste, l’enregistrer en PDF ou l’exporter en fichier pour une autre application ou un prochain voyage.',
  'help.guide.export-packing-list.step.1':
    'Cliquez sur « Exporter », l’icône à flèche montante dans la barre au-dessus de la liste, juste avant « Importer ».',
  'help.guide.export-packing-list.step.2':
    '« Checklist Markdown (.md) » et « CSV pour l’import (.csv) » enregistrent immédiatement la liste dans un fichier.',
  'help.guide.export-packing-list.step.3':
    "Cliquez sur « Imprimer ou enregistrer en PDF ». L'aperçu présente la liste sous forme de page : en haut le voyage, ses dates et l'avancement des bagages, puis chaque liste sous forme de carte, avec une case à cocher pour chaque article.",
  'help.guide.export-packing-list.step.4':
    "Cliquez sur « Imprimer ou enregistrer en PDF » sous l'aperçu. Le navigateur ouvre sa fenêtre d'impression : choisissez une imprimante, ou « Enregistrer en PDF » pour obtenir un fichier.",
  'help.guide.export-packing-list.result':
    "L'impression et les fichiers reprennent la vue ouverte, « Partagée » ou « Ma liste », avec les quantités, les poids et les coches.",
  'help.guide.export-packing-list.tip.1':
    "Le CSV est le format lu par « Importer », bagages compris : vous pouvez donc l'utiliser comme modèle de bagages personnel en l'important dans votre prochain voyage.",
  'help.guide.export-packing-list.tip.2':
    'Le fichier Markdown s’ouvre comme une liste à cocher dans Obsidian, Notion ou GitHub, et vous pouvez le réimporter avec « Importer ».',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Choisir qui voit un article et qui l’apporte',
  'help.guide.share-packing-item.goal':
    'Faire passer un article entre la liste commune du groupe, votre propre liste et les personnes pour qui vous l’apportez.',
  'help.guide.share-packing-item.step.1':
    "Au-dessus des listes, « Partagée » est la liste visible par tous et « Ma liste » est la vôtre. Chacune indique son nombre d'articles. Cliquez sur « Ma liste » pour voir la vôtre.",
  'help.guide.share-packing-item.step.2':
    'De retour dans « Partagée », ouvrez le menu à trois points en bout de ligne et cliquez sur « Partagé ».',
  'help.guide.share-packing-item.step.3':
    "Il existe trois niveaux : « Partagé », visible par tout le groupe, « Personnel », visible par vous seul, et « Partager avec… », où vous choisissez les personnes concernées par l'article.",
  'help.guide.share-packing-item.step.4':
    'Un article « Personnel » ne figure que dans « Ma liste ». Passez à « Ma liste » pour le retrouver.',
  'help.guide.share-packing-item.step.5':
    'Rouvrez « Partagé » et cochez un nom sous « Partager avec… ». L’article apparaît aussi dans la liste de cette personne, et la ligne reçoit un petit badge indiquant avec combien de personnes il est partagé.',
  'help.guide.share-packing-item.result':
    'L’article est rangé dans le niveau de partage choisi, et la ligne indique qui l’apporte.',
  'help.guide.share-packing-item.tip.1':
    'Seule la personne qui apporte un article peut modifier son partage. Une personne avec qui vous l’avez partagé le voit dans sa propre « Ma liste », avec un petit badge en forme de main qui affiche votre nom au survol. Elle peut le cocher.',
  'help.guide.share-packing-item.tip.2':
    "Sur un article partagé qu'une autre personne apporte, le menu à trois points propose deux autres options à la place de « Partagé » : « Je peux l'apporter aussi », qui vous ajoute à côté d'elle, et « Copier dans ma liste », qui crée une copie privée pour vous.",
  'help.guide.share-packing-item.tip.3':
    'Les nouveaux articles prennent le partage de la vue dans laquelle vous les ajoutez. Les articles ajoutés dans « Partagé » sont partagés avec tout le monde. Ceux ajoutés dans « Ma liste » sont « Personnel », sauf si tous les articles de cette liste sont partagés avec les mêmes personnes : le nouvel article est alors partagé avec elles aussi.',
  // packing-bags
  'help.guide.packing-bags.title': 'Peser les bagages',
  'help.guide.packing-bags.goal':
    'Indiquer le poids de chaque article, répartir les articles dans les bagages et respecter la limite de la compagnie aérienne pour chacun.',
  'help.guide.packing-bags.step.1':
    "Cliquez sur le badge de poids avant le cercle et saisissez le poids de l'article en grammes.",
  'help.guide.packing-bags.step.2': 'Le cercle après le poids représente le sac de l’article. Cliquez dessus.',
  'help.guide.packing-bags.step.3':
    'S’il n’existe pas encore de sac, cliquez sur « Ajouter un bagage », saisissez un nom et appuyez sur Entrée. Le sac est créé et l’article y est rangé.',
  'help.guide.packing-bags.step.4':
    'La carte « Bagages » apparaît à droite des listes dès qu’un sac existe. Chaque sac affiche son nom, qui le porte, une barre de remplissage, le nombre d’articles qu’il contient et son poids. Sous les sacs se trouvent « Non attribué » et « Poids total », avec « Emballés » en dessous : le poids déjà emballé, et une fine barre qui indique sa part.',
  'help.guide.packing-bags.step.5':
    'Cliquez sur « Définir une limite » à côté du poids du sac et saisissez la limite en kilogrammes, comme l’indiquent les compagnies aériennes.',
  'help.guide.packing-bags.step.6':
    'Le plus en pointillés au bout de la ligne du nom du sac, juste avant la croix, ouvre « Attribuer des membres ». Cochez les membres qui portent le sac : ils apparaissent à côté du plus, et « Par personne », en bas de la carte, liste ce que chacun porte.',
  'help.guide.packing-bags.result':
    'La carte « Bagages », à droite, affiche le poids de chaque sac par rapport à sa limite, ce qui n’est dans aucun sac, ce que porte chaque personne, et le total avec la part déjà emballée.',
  'help.guide.packing-bags.tip.1':
    "Le champ de poids, la pastille de bagage et la carte « Bagages » n'existent que si un administrateur a activé « Suivi des bagages » dans l'extension Listes. Dans une fenêtre plus étroite, les bagages s'ouvrent plutôt via le bouton « Bagages » au-dessus de la carte de progression.",
  'help.guide.packing-bags.tip.2':
    "Le serveur calcule le poids d'un bagage à partir des articles de tous les membres, y compris ceux que vous ne voyez pas : le chiffre correspond donc au poids réel du bagage.",
  'help.guide.packing-bags.tip.3':
    'Un bagage sans limite est comparé au bagage le plus lourd, pour que vous puissiez comparer les barres. Si vous lui fixez une limite, sa barre est mesurée par rapport à cette limite.',
  // create-todo
  'help.guide.create-todo.title': 'Ajouter une tâche',
  'help.guide.create-todo.goal': 'Noter une tâche, avec une liste, une priorité, une date et une personne assignée.',
  'help.guide.create-todo.step.1': 'Cliquez sur « Nouvelle tâche », tout à droite de la barre.',
  'help.guide.create-todo.step.2':
    'La boîte de dialogue « Nouvelle tâche » s’ouvre avec le curseur dans son en-tête. Saisissez le nom dans le champ « Nom de la tâche », et ajoutez sous « Description » tout ce dont vous voulez vous souvenir.',
  'help.guide.create-todo.step.3':
    '« Liste » sert à classer la tâche. Choisissez-en une, ou cliquez sur le plus juste à côté pour en créer une nouvelle dans une petite fenêtre.',
  'help.guide.create-todo.step.4':
    '« Priorité » propose quatre boutons : « Aucun », « P1 », « P2 » et « P3 », du rouge au bleu.',
  'help.guide.create-todo.step.5':
    "« Date d'échéance », à côté de « Liste », ouvre un calendrier, et « Assigné à » attribue la tâche à une personne.",
  'help.guide.create-todo.step.6': 'Cliquez sur « Créer la tâche ».',
  'help.guide.create-todo.result':
    'La tâche figure dans la liste avec la priorité, l’échéance et la liste en badges, et l’avatar de la personne assignée en bout de ligne. Elle s’ouvre dans le volet de droite.',
  'help.guide.create-todo.tip.1':
    'Seul le nom est obligatoire. Tout le reste peut être renseigné plus tard depuis le volet de droite.',
  'help.guide.create-todo.tip.2':
    'Si une liste est sélectionnée dans la barre latérale, la nouvelle tâche est créée dans cette liste.',
  'help.guide.create-todo.tip.3':
    'Appuyer sur Entrée dans le champ du nom crée immédiatement la tâche, sans toucher aux autres champs.',
  // todo-filters
  'help.guide.todo-filters.title': 'Retrouver et modifier une tâche',
  'help.guide.todo-filters.goal':
    "N'afficher que les tâches utiles pour l'instant, puis modifier celle que vous cherchiez.",
  'help.guide.todo-filters.step.1':
    '« Tâches », dans la colonne latérale : « Tous » affiche tout ce qui reste à faire, « Mes tâches » ce qui vous est assigné, « En retard » les tâches dont la date est passée et « Terminé » les tâches finies. Chaque filtre indique son nombre. Cliquez sur « En retard ».',
  'help.guide.todo-filters.step.2':
    'Sous « Listes », chaque liste a sa ligne. Choisissez-en une pour l’afficher, tâches terminées comprises.',
  'help.guide.todo-filters.step.3':
    "Le tri en haut de la liste change l’ordre de ce qui est affiché : « Priorité » place P1 en premier, « Date d'échéance » l’échéance la plus proche. Vous ne pouvez utiliser qu’un seul des deux à la fois, et un second clic rétablit votre propre ordre.",
  'help.guide.todo-filters.step.4': 'Cliquez sur une tâche pour l’ouvrir dans le volet de droite.',
  'help.guide.todo-filters.step.5':
    "Modifiez ce qu’il faut : le nom, « Priorité », « Liste », « Date d'échéance » ou « Assigné à ». « Description » affiche son texte avec des liens cliquables ; cliquez dedans pour le modifier. Cliquez ensuite sur « Enregistrer les modifications » en bas du volet. La case dans l’en-tête du volet marque la tâche comme terminée, et « Supprimer », à côté de « Enregistrer les modifications », la supprime immédiatement.",
  'help.guide.todo-filters.result':
    "La liste n'affiche que les tâches demandées, et le panneau de droite permet de modifier celle que vous avez sélectionnée.",
  'help.guide.todo-filters.tip.1':
    "Une ligne de liste ne compte que les tâches ouvertes, mais quand vous la sélectionnez, les tâches terminées s'affichent aussi. « Tous », « Mes tâches » et « En retard » masquent les tâches terminées, « Terminé » n'affiche que celles-ci.",
  'help.guide.todo-filters.tip.2':
    "Dans le tri, « Priorité » et « Date d'échéance » ne peuvent pas être combinés. Tant que l'un des deux est actif, vous ne pouvez pas réorganiser les lignes par glisser-déposer.",

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Réservations',
  'help.ctx.trip-bookings.summary':
    'Cet onglet regroupe tout ce qui est réservé pour le voyage, hors transports : hébergements, tables, billets, visites et parkings. Chaque réservation est une carte, une ligne de liste ou une barre sur la chronologie, avec son code, ses documents, ses voyageurs et son coût. Cliquez sur une réservation pour ouvrir ses détails.',
  'help.ctx.trip-bookings.bullet.1':
    '« Réservation manuelle », tout à droite de la barre, ouvre « Nouvelle réservation ». Elle permet de créer six types de réservation : « Hébergement », Restaurant, « Événement », « Visite », Parking et « Autre ». Les vols, trains et autres transports se trouvent dans l’onglet « Transports » et n’apparaissent jamais ici.',
  'help.ctx.trip-bookings.bullet.2':
    'L’icône de téléchargement devant « Réservation manuelle », « Importer des confirmations de réservation », importe des confirmations que TREK lit automatiquement : EML, PDF, PKPass, HTML ou TXT, cinq fichiers de 10 Mo maximum, ainsi que des photos si le modèle d’IA sait lire les images. L’icône n’apparaît que si le serveur peut les lire.',
  'help.ctx.trip-bookings.bullet.3':
    "« Rechercher » porte sur les titres, les types, les lieux, les notes, les codes de réservation et les voyageurs. « Filtrer », l'entonnoir juste à côté, affine l'onglet par « Statut », par « Type » avec le nombre pour chacun, et par « Voyageurs » dès qu'une réservation mentionne des personnes. Un chiffre sur l'entonnoir indique le nombre de filtres actifs.",
  'help.ctx.trip-bookings.bullet.4':
    "Les trois icônes après « Filtrer » changent la vue : « Cartes », « Liste » et « Chronologie ». « Options d'affichage », les curseurs à côté, permet de grouper et trier les cartes et la liste, ou de régler les lignes de la chronologie, et l’icône de tableur suivante, « Exporter en tableur (CSV) », télécharge le contenu affiché sous forme de fichier. Par défaut, les cartes sont regroupées en « Confirmé » et « En attente », et la liste par jour. Cliquez sur le titre d’une section pour la replier.",
  'help.ctx.trip-bookings.bullet.5':
    "Une carte a un en-tête coloré selon son statut, avec le point de statut (un clic bascule entre « En attente » et « Confirmé »), le type, le titre, le crayon et la corbeille. En dessous figurent les informations dont dispose la réservation : « Date », « Heure », « Code de réservation », « Arrivée » et « Départ », « Lieu / Adresse », « Hébergement », « Lié à » (l'étape du programme), « Lien », « Notes », « Voyageurs », « Fichiers » et les dépenses liées.",
  'help.ctx.trip-bookings.bullet.6':
    'Un clic sur une carte, une ligne ou une barre ouvre le détail de la réservation, avec en bas « Sur la carte » (si la réservation a un lieu), la corbeille et « Modifier ». La suppression demande une seule confirmation (« Supprimer la réservation ? », qui précise si des coûts sont supprimés avec elle). La réservation et ses dépenses liées sont alors supprimées et, pour un hébergement, ses nuits sont retirées du programme.',
  // booking-views
  'help.guide.booking-views.title': "Changer d'affichage et ouvrir une réservation",
  'help.guide.booking-views.goal':
    'Afficher les réservations en cartes, en liste ou sur une chronologie, et en ouvrir une pour voir tous ses détails.',
  'help.guide.booking-views.step.1':
    'Les trois icônes après « Filtrer », dans la barre, sont les vues ; chacune affiche son nom au survol : « Cartes », « Liste » et « Chronologie ». L’onglet s’ouvre sur « Cartes », avec une carte par réservation dans les sections « Confirmé » et « En attente ». Cliquez sur « Liste », l’icône du milieu.',
  'help.guide.booking-views.step.2':
    '« Liste » affiche une ligne par réservation sous un titre par jour, avec le jour et l’heure à droite ; les flèches du clavier permettent de passer d’une ligne à l’autre. Cliquez sur « Chronologie », la dernière des trois.',
  'help.guide.booking-views.step.3':
    '« Chronologie » affiche les réservations sur les jours du voyage : une ligne par type, et une barre du début à la fin de chacune. Une réservation en attente a un contour en pointillés. « Voyage » fait tenir tout le voyage dans la largeur ; cliquez sur le titre d’un jour pour afficher ce jour heure par heure.',
  'help.guide.booking-views.step.4':
    "« Jour » affiche une journée sur une échelle horaire, et la longueur de chaque barre correspond à sa durée. Les flèches à côté du nom du jour passent au jour précédent ou suivant. Pendant le voyage, « Aujourd'hui » va directement au jour en cours, et le sélecteur « Voyage » / « Jour » à droite revient au voyage entier.",
  'help.guide.booking-views.step.5':
    'Survolez une barre pour voir son jour, ses horaires et son lieu, puis cliquez dessus pour ouvrir le détail de la réservation. Une carte dans « Cartes » et une ligne dans « Liste » ouvrent la même fenêtre.',
  'help.guide.booking-views.step.6':
    "L'en-tête du détail affiche le titre et des pastilles pour le statut (un clic le change), le type, le jour et le code de réservation, avec un bouton pour le copier. En dessous viennent les horaires sous forme de tuiles, puis le lieu, les voyageurs, les notes, les dépenses et les fichiers, si la réservation en a, et tout en bas « Sur la carte », la corbeille et « Modifier ».",
  'help.guide.booking-views.result':
    "La réservation s'ouvre dans son détail : « Modifier » ouvre son formulaire, « Sur la carte » l'affiche sur le programme, et « Fermer » ou Échap vous ramène à l'affichage précédent.",
  'help.guide.booking-views.tip.1':
    "« Options d'affichage », l'icône des curseurs après les icônes d'affichage, permet de regrouper et trier « Cartes » et « Liste » avec « Grouper par » et « Trier par ». En « Chronologie », elle propose « Une ligne par type » et « Afficher l'autre onglet ». « Afficher l'autre onglet » montre les éléments de l'onglet Transports, estompés, dans un fin couloir en haut. « Réinitialiser l'affichage » rétablit les valeurs par défaut, et chaque onglet mémorise son affichage dans ce navigateur.",
  'help.guide.booking-views.tip.2':
    'Une réservation antérieure ou postérieure au voyage, ou sans date, ne peut pas figurer sur la chronologie. Elle apparaît sous le graphique, sous forme de petite carte, sous « Avant le voyage », « Après le voyage » ou « Aucune date ».',
  'help.guide.booking-views.tip.3':
    'Le même détail s’ouvre partout où apparaît une réservation : dans l’onglet « Transports », dans le programme du jour, dans les détails d’un jour et dans ceux d’un lieu. Un clic sur son titre permet de renommer la réservation.',
  // create-booking
  'help.guide.create-booking.title': 'Créer une réservation',
  'help.guide.create-booking.goal':
    'Ajouter manuellement au voyage un restaurant, un événement, une visite guidée, une place de parking ou tout autre élément.',
  'help.guide.create-booking.step.1':
    "Cliquez sur « Réservation manuelle » à droite de la barre. « Nouvelle réservation » s'ouvre, avec le titre et deux pastilles dans un en-tête en haut.",
  'help.guide.create-booking.step.2':
    "Cliquez sur l'étiquette de type dans le bandeau du haut, qui indique « Autre » sur une nouvelle réservation, et choisissez le « Type de réservation ». Cet onglet crée six types : « Hébergement », « Restaurant », « Événement », « Visite », « Parking » et « Autre ». Le formulaire s'adapte à votre choix : seul « Hébergement » utilise une plage de jours au lieu de dates.",
  'help.guide.create-booking.step.3':
    "Saisissez le titre dans le bandeau du haut, le champ situé au-dessus des pastilles. C'est le seul champ obligatoire, et « Ajouter » reste grisé tant qu'il est vide.",
  'help.guide.create-booking.step.4':
    'Renseignez « Date » et « Heure de début », ainsi que « Date de fin » et « Heure de fin » si la réservation a une fin. Les calendriers ne proposent que des jours du voyage. Une date et une heure de fin qui ne sont pas postérieures au début s’affichent en rouge et bloquent « Ajouter ». Une heure de fin antérieure à l’heure de début, sans date de fin, déclenche seulement un avertissement : si la réservation se termine le lendemain, indiquez une date de fin.',
  'help.guide.create-booking.step.5':
    'Saisissez le « Code de réservation » de la confirmation, puis cliquez sur la pastille de statut dans l’en-tête, à côté du type. Elle affiche « En attente » sur une nouvelle réservation et passe à « Confirmé ». Le statut détermine la section où apparaît la carte.',
  'help.guide.create-booking.step.6': 'Cliquez sur « Ajouter » en bas du formulaire.',
  'help.guide.create-booking.result':
    'La réservation apparaît sous forme de carte dans sa section. La couleur de son en-tête indique son statut, et la carte affiche son type, sa date, ses horaires et son code. Tous les autres participants du voyage la voient aussitôt.',
  'help.guide.create-booking.tip.1':
    "« Lieu / Adresse » propose des adresses réelles pendant la saisie. En choisir une remplace ce que vous avez écrit, tandis qu'une adresse saisie par vous-même est conservée telle quelle.",
  'help.guide.create-booking.tip.2':
    "Dans « Lien », indiquez la page de la réservation chez le prestataire. La carte et le détail l'affichent sous forme de lien qui s'ouvre dans un nouvel onglet.",
  'help.guide.create-booking.tip.3':
    "Les notes acceptent le Markdown : une liste ou une ligne en gras s'affiche comme telle sur la carte et dans le détail.",
  // booking-hotel
  'help.guide.booking-hotel.title': 'Réserver un hébergement',
  'help.guide.booking-hotel.goal':
    'Saisir un hébergement pour qu’il compte à la fois comme réservation et comme nuitées dans le programme.',
  'help.guide.booking-hotel.step.1':
    'Cliquez sur « Réservation manuelle » et choisissez « Hébergement » avec la pastille de type dans le bandeau du haut. Les champs de date sont remplacés par un bloc de champs propres à l’hôtel.',
  'help.guide.booking-hotel.step.2':
    'Choisissez l’hôtel sous « Hébergement ». La liste contient les lieux du voyage, hors traces et sorties importées. Dès que vous en choisissez un, son nom remplit le titre s’il est vide, et son adresse remplit « Lieu / Adresse ».',
  'help.guide.booking-hotel.step.3':
    'Renseignez « De » et « À » : la première nuit et le matin du départ. Les deux champs proposent les jours du voyage avec leurs dates, et TREK veille à ce que « À » soit postérieur à « De ».',
  'help.guide.booking-hotel.step.4':
    "Renseignez « Arrivée », « Check-in jusqu'à » et « Départ », ainsi que le « Code de réservation » figurant sur la confirmation.",
  'help.guide.booking-hotel.step.5': 'Cliquez sur « Ajouter ».',
  'help.guide.booking-hotel.result':
    "La carte affiche la plage de jours sous « Date », les heures d'arrivée et de départ, et l'adresse. Le séjour apparaît aussi désormais sur ces jours du programme.",
  'help.guide.booking-hotel.tip.1':
    '« Hébergement » est le seul type sans « Date » ni « Heure de début ». Ses dates sont « De » et « À », et vous choisissez des jours du voyage, pas des dates du calendrier.',
  'help.guide.booking-hotel.tip.2':
    'Laissez « Hébergement » vide et saisissez plutôt l’adresse : le lieu est recherché, créé et épinglé sur la carte pour vous.',
  'help.guide.booking-hotel.tip.3': 'Si vous supprimez la réservation, ses nuitées sont aussi retirées du programme.',
  // link-booking
  'help.guide.link-booking.title': 'Lier une réservation au programme',
  'help.guide.link-booking.goal':
    'Associer une réservation à son étape et à son lieu, pour la retrouver là où vous en avez besoin.',
  'help.guide.link-booking.step.1':
    "Survolez la carte à lier et cliquez sur le crayon dans son en-tête. « Modifier la réservation » s'ouvre.",
  'help.guide.link-booking.step.2':
    "Ouvrez « Lier à l'affectation du jour ». La liste reprend votre programme : un titre par jour, puis les étapes de ce jour, numérotées et avec leurs horaires. Choisissez l'étape à laquelle se rattache la réservation.",
  'help.guide.link-booking.step.3':
    "« Lieu / Activité » lie le lieu lui-même. Choisissez-le ici : le titre et « Lieu / Adresse » sont remplis s'ils sont vides.",
  'help.guide.link-booking.step.4': 'Cliquez sur « Mettre à jour ».',
  'help.guide.link-booking.result':
    'La carte affiche le jour et l’étape sous « Lié à », et la réservation apparaît avec cette étape dans le programme du jour.',
  'help.guide.link-booking.tip.1':
    '« Aucun lien (autonome) », en haut de la liste, supprime le lien. Un hébergement n’a pas de sélecteur d’étape : il est lié par ses nuitées.',
  'help.guide.link-booking.tip.2':
    "Si vous choisissez une étape sur un jour daté, le champ « Date » est rempli automatiquement s'il est vide. Une date déjà saisie n'est pas modifiée.",
  // booking-travelers
  'help.guide.booking-travelers.title': 'Indiquer pour qui est une réservation',
  'help.guide.booking-travelers.goal':
    "Indiquer les voyageurs concernés par une réservation, puis n'afficher que leurs réservations.",
  'help.guide.booking-travelers.step.1':
    "Ouvrez la réservation avec le crayon de sa carte. « Voyageurs » se trouve à côté du « Code de réservation ». Le champ affiche « Assigner des voyageurs » tant que personne n'est associé à la réservation.",
  'help.guide.booking-travelers.step.2':
    'Cliquez dessus et choisissez les personnes concernées par la réservation ; les invités nommés figurent aussi dans la liste. Une personne sélectionnée reçoit une coche et son avatar apparaît dans le champ. Cliquez de nouveau sur le nom pour la retirer.',
  'help.guide.booking-travelers.step.3': 'Cliquez sur « Mettre à jour ».',
  'help.guide.booking-travelers.step.4':
    'Cliquez sur « Filtrer » dans la barre : sous « Voyageurs », cliquez sur une personne pour n’afficher que ses réservations. Vous pouvez en sélectionner plusieurs à la fois.',
  'help.guide.booking-travelers.result':
    "La carte indique les personnes concernées, et « Filtrer » permet de n'afficher que les réservations des personnes choisies.",
  'help.guide.booking-travelers.tip.1':
    'Sur la carte et dans le détail, les voyageurs sont seulement affichés, vous ne pouvez pas les y modifier. Vous les définissez ici, dans le formulaire.',
  'help.guide.booking-travelers.tip.2':
    "« Voyageurs » apparaît dans « Filtrer » dès que le voyage compte plusieurs membres et qu'au moins une réservation mentionne quelqu'un. Votre choix est conservé jusqu'à la fermeture de l'onglet du navigateur.",
  // booking-files
  'help.guide.booking-files.title': 'Garder le bon de réservation avec la réservation',
  'help.guide.booking-files.goal': 'Joindre la confirmation, le billet ou le pass à la réservation correspondante.',
  'help.guide.booking-files.step.1':
    'Ouvrez la réservation avec le crayon de sa carte. « Fichiers » se trouve à côté de « Lier » ; cliquez sur « Joindre un fichier ». Sur une réservation existante, le document est importé immédiatement et TREK affiche « Fichier importé ».',
  'help.guide.booking-files.step.2': 'Le document est listé sous son nom, avec un bouton pour l’ouvrir et un X à côté.',
  'help.guide.booking-files.step.3':
    '« Lier un fichier existant » propose les documents du voyage qui ne sont pas encore joints à cette réservation. Choisissez-en un : il est joint sans nouvel import.',
  'help.guide.booking-files.step.4': 'Cliquez sur « Mettre à jour ».',
  'help.guide.booking-files.result':
    'La carte et la vue détaillée listent les documents sous « Fichiers ». Cliquez sur un document pour l’ouvrir. « Afficher dans les fichiers », au-dessus de la liste dans la vue détaillée, vous emmène à l’onglet « Fichiers ».',
  'help.guide.booking-files.tip.1':
    'Sur une réservation en cours de création, le document est importé quand vous cliquez sur « Ajouter ». L’import nécessite une connexion.',
  'help.guide.booking-files.tip.2':
    "La croix à côté d'un document supprime le lien, pas le document, qui reste dans l'onglet « Fichiers » du voyage.",
  'help.guide.booking-files.tip.3':
    "L'administrateur définit les types de fichiers autorisés sous « Types de fichiers autorisés ». Les documents, les fichiers texte et les images sont autorisés par défaut.",
  // booking-cost
  'help.guide.booking-cost.title': 'Transformer le prix d’une réservation en dépense',
  'help.guide.booking-cost.goal':
    'Ajouter le coût d’une réservation aux « Coûts », réparti entre les personnes qui paient.',
  'help.guide.booking-cost.step.1':
    'Ouvrez la réservation avec le crayon de sa carte et descendez en bas du formulaire. Sous « Coûts » se trouvent « Créer une dépense » et « Lier une dépense existante », avec la mention « Enregistre la réservation, puis ouvre l’éditeur de coûts ».',
  'help.guide.booking-cost.step.2':
    "Cliquez sur « Créer une dépense ». La réservation est enregistrée, son formulaire se ferme et l'éditeur des Coûts s'ouvre sur « Ajouter une dépense ».",
  'help.guide.booking-cost.step.3':
    'Le nom dans l’en-tête reprend déjà le titre de la réservation, et « Jour » le jour de la réservation. Saisissez le « Montant total » et vérifiez la « Devise » à côté.',
  'help.guide.booking-cost.step.4':
    "La pastille de l'en-tête indique la « Catégorie », déjà réglée sur celle qui correspond au type de réservation. Sous « Qui a payé ? », choisissez qui a payé, et sous « Répartition », comment le montant est partagé.",
  'help.guide.booking-cost.step.5': 'Cliquez sur « Ajouter une dépense ».',
  'help.guide.booking-cost.result':
    "La carte affiche le montant en bas, le formulaire de la réservation liste la dépense sous « Dépenses liées », et la même dépense apparaît dans l'onglet Coûts, liée à cette réservation.",
  'help.guide.booking-cost.tip.1':
    'La catégorie dépend du type : Restaurant devient « Nourriture et boissons », « Hébergement » reste « Hébergement », Parking reste Parking, et « Événement » et « Visite » deviennent tous deux « Autre ».',
  'help.guide.booking-cost.tip.2':
    'Une réservation peut avoir plusieurs dépenses. « Lier une dépense existante » propose les dépenses de « Coûts » qui ne sont encore liées à rien. Sur une dépense liée, « Délier, garder la dépense » supprime le lien et conserve la dépense dans « Coûts », tandis que la corbeille la supprime.',
  'help.guide.booking-cost.tip.3':
    '« Coûts » n’apparaît dans le formulaire que si l’extension Coûts est activée, ce que l’administrateur règle sous « Extensions ».',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Retrouver une réservation',
  'help.guide.filter-bookings.goal': 'Filtrer un long onglet par mot, statut, type ou personne.',
  'help.guide.filter-bookings.step.1':
    "Saisissez votre recherche dans « Rechercher », dans la barre. La recherche porte sur les titres, les types, les lieux et adresses, les notes, les codes de réservation et les noms des voyageurs, et les résultats s'affinent au fil de la saisie. Échap vide le champ.",
  'help.guide.filter-bookings.step.2':
    "Cliquez sur « Filtrer », l'entonnoir à côté de la recherche. Le panneau contient « Statut », « Type » et, dès qu'une réservation a des personnes associées, « Voyageurs ».",
  'help.guide.filter-bookings.step.3':
    'Sous « Statut », choisissez « Confirmé » ou « En attente » pour n’afficher que ces réservations ; « Tous » affiche les deux.',
  'help.guide.filter-bookings.step.4':
    'Sous « Type », cliquez sur un ou plusieurs types pour n’afficher que ceux-là. Chaque type indique son nombre de réservations, et une coche signale ceux qui sont sélectionnés.',
  'help.guide.filter-bookings.step.5':
    'Un chiffre sur « Filtrer » indique le nombre de filtres actifs, et une pastille à côté de la recherche indique combien de réservations restent affichées sur le total. Cliquez sur la pastille, ou sur « Réinitialiser les filtres » en bas du panneau, pour tout réafficher.',
  'help.guide.filter-bookings.result':
    "L'onglet n'affiche que votre sélection, en « Cartes », en « Liste » comme en « Chronologie », et les filtres restent actifs pour ce voyage jusqu'à la fermeture de l'onglet du navigateur.",
  'help.guide.filter-bookings.tip.1':
    "« Type » n'apparaît que si l'onglet contient plusieurs types, et il ne liste que ceux qui y figurent. Si l'onglet ne contient aucune visite, « Type » ne propose donc pas « Visite ».",
  'help.guide.filter-bookings.tip.2':
    "Si aucun élément ne correspond au filtre, l'onglet affiche « Aucun résultat pour ces filtres », avec « Réinitialiser les filtres » juste en dessous.",
  // import-booking-file
  'help.guide.import-booking-file.title': 'Importer une réservation depuis sa confirmation',
  'help.guide.import-booking-file.goal':
    'Laisser TREK lire la réservation dans l’e-mail ou le PDF envoyé par le prestataire, pour ne pas avoir à la saisir de nouveau.',
  'help.guide.import-booking-file.step.1':
    'Cliquez sur l’icône de téléchargement dans la barre, « Importer des confirmations de réservation » ; son nom s’affiche au survol. La boîte de dialogue du même nom s’ouvre.',
  'help.guide.import-booking-file.step.2':
    'Déposez les confirmations dans la zone, ou cliquez dessus et choisissez-les : EML, PDF, PKPass, HTML et TXT, jusqu’à cinq fichiers de 10 Mo chacun, ainsi que des photos (JPG, PNG, WEBP) si le modèle d’IA sait lire les images. La zone affiche le nom des fichiers choisis.',
  'help.guide.import-booking-file.step.3':
    'Cliquez sur « Importer ». La boîte de dialogue se ferme aussitôt, car la lecture se fait en arrière-plan.',
  'help.guide.import-booking-file.step.4':
    "Une carte en bas à droite affiche la progression sous le nom du fichier. Elle reste visible quand vous naviguez dans l'application, et même après un rechargement. « Analyse des fichiers… » se transforme en coche une fois la lecture terminée, et la carte propose « Importer ». Cliquez dessus.",
  'help.guide.import-booking-file.step.5':
    "Chaque réservation trouvée s'ouvre dans « Nouvelle réservation », l'une après l'autre, déjà remplie. Pour un hôtel : son nom en titre et, si le voyage contient le lieu, sous « Hébergement », son « Lieu / Adresse », « De » et « À » sur ses nuits, « Arrivée » et « Départ », le « Code de réservation », la confirmation sous « Fichiers » et, si les Coûts sont activés, le prix en « Dépense liée ». Vérifiez le tout et cliquez sur « Ajouter ».",
  'help.guide.import-booking-file.result':
    "La réservation apparaît en carte sous « En attente », avec ses nuits, son code et la confirmation sous « Fichiers ». Le séjour s'affiche sur ces jours du programme. Si les Coûts sont activés, le prix est ajouté comme dépense liée à la réservation.",
  'help.guide.import-booking-file.tip.1':
    "L'icône d'import n'apparaît que si le serveur peut lire les confirmations. Il faut pour cela l'extracteur ou l'extension « Analyse par IA », que l'administrateur active sous « Extensions ». Un onglet sans réservation l'affiche aussi sous forme de bouton « Importer depuis un fichier ».",
  'help.guide.import-booking-file.tip.2':
    'Si rien n’a pu être lu, la carte vous le signale. Si « Analyse par IA » est activée, elle propose « Essayer l’analyse par IA », qui envoie les mêmes fichiers directement au modèle. Une analyse terminée est conservée dix minutes ; lancez la vérification dans ce délai.',
  'help.guide.import-booking-file.tip.3':
    'La confirmation n’est jointe que si son type figure dans les « Types de fichiers autorisés » des paramètres d’administration. Le PDF est autorisé par défaut ; un e-mail (EML) doit d’abord être ajouté, sinon la réservation est enregistrée sans lui.',
  // edit-booking
  'help.guide.edit-booking.title': 'Modifier une réservation',
  'help.guide.edit-booking.goal':
    'Corriger un horaire, ajouter un code reçu plus tard ou faire passer une réservation de « En attente » à « Confirmé ».',
  'help.guide.edit-booking.step.1':
    "Survolez la carte et cliquez sur le crayon dans son en-tête. « Modifier la réservation » s'ouvre avec toutes les informations de la réservation.",
  'help.guide.edit-booking.step.2':
    "Modifiez ce qui doit l'être, par exemple le « Code de réservation » envoyé plus tard par le prestataire.",
  'help.guide.edit-booking.step.3':
    'Cliquez sur la pastille « En attente » dans le bandeau du haut. Elle passe à « Confirmé », et le bandeau devient vert.',
  'help.guide.edit-booking.step.4': 'Cliquez sur « Mettre à jour ».',
  'help.guide.edit-booking.result':
    'La carte change de place : une réservation confirmée apparaît dans la section « Confirmé » avec un point vert et un bandeau supérieur vert, et tous les participants du voyage la voient se déplacer.',
  'help.guide.edit-booking.tip.1':
    'Si vous ne pouvez pas lire un « Code de réservation », c’est que « Masquer les codes de réservation » est activé dans Paramètres, sous « Affichage ». Survolez le code, ou cliquez dessus, pour le lire.',
  'help.guide.edit-booking.tip.2':
    "Si vous changez le type, la catégorie de la dépense liée change aussi, sauf si vous l'avez choisie manuellement dans l'éditeur des Coûts.",
  'help.guide.edit-booking.tip.3':
    "« Modifier », en bas du détail d'une réservation, ouvre le même formulaire. Vous pouvez aussi changer le statut sans formulaire : cliquez sur le point d'une carte ou d'une ligne, ou sur la pastille de statut dans le détail.",
  // delete-booking
  'help.guide.delete-booking.title': 'Supprimer une réservation',
  'help.guide.delete-booking.goal': 'Retirer du voyage une réservation annulée.',
  'help.guide.delete-booking.step.1':
    'Survolez la carte et cliquez sur la corbeille de son en-tête. La corbeille en bas du détail d’une réservation fait la même chose.',
  'help.guide.delete-booking.step.2':
    '« Supprimer la réservation ? » indique la réservation choisie et précise qu’elle sera définitivement supprimée. Si des coûts y sont liés, la question précise qu’ils seront aussi supprimés.',
  'help.guide.delete-booking.step.3': 'Cliquez sur « Supprimer ».',
  'help.guide.delete-booking.result':
    'La carte est supprimée pour tous les participants du voyage. La suppression d’une réservation est définitive : la question de confirmation est votre dernière chance d’annuler.',
  'help.guide.delete-booking.tip.1':
    'Supprimer une réservation supprime aussi les dépenses qui lui sont liées. Supprimer un hébergement retire aussi ses nuits du programme des jours.',
  'help.guide.delete-booking.tip.2':
    "Les documents joints restent dans l'onglet « Fichiers » du voyage, seul leur lien avec la réservation est supprimé.",

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Coûts',
  'help.ctx.trip-costs.summary':
    'Les finances du voyage : chaque dépense dans un registre daté ou un tableau, avec qui l’a saisie et qui la doit, dans la devise du reçu. La colonne de droite indique qui doit payer qui pour équilibrer les comptes.',
  'help.ctx.trip-costs.bullet.1':
    'La barre du haut affiche les dates du voyage et les voyageurs entre lesquels les coûts sont répartis. Elle contient aussi « Rechercher des dépenses… », « Filtrer » (l’entonnoir), « Exporter CSV » (l’icône de téléchargement) et le sélecteur « Liste » / « Tableau ».',
  'help.ctx.trip-costs.bullet.2':
    'Tout à droite, « Régler » enregistre d’un coup tous les virements en attente, « Scanner un reçu » remplit une dépense à partir d’une photo si l’extension « Analyse par IA » sait lire les images, et « Ajouter une dépense » ouvre l’éditeur.',
  'help.ctx.trip-costs.bullet.3':
    'Quatre cartes sous la barre : « Vous devez » et « On vous doit » montrent votre part du règlement, « Montant en attente » correspond aux dépenses enregistrées sans payeur, et « Dépenses totales du voyage » additionne le tout, avec « Votre part » et « Vous avez payé » en dessous.',
  'help.ctx.trip-costs.bullet.4':
    'Le registre est groupé par jour, du plus récent au plus ancien, chaque jour indiquant son nombre d’entrées et le montant dépensé. Une ligne affiche la catégorie sous forme d’onglet coloré, le nom, les pastilles des payeurs avec ce que chacun a payé et, en dessous, « Répartition » avec la part de chaque voyageur (une coche indique qui a réglé la sienne), puis la note et le montant, ainsi que « vous avez prêté » ou « vous avez emprunté » quand la répartition fait que d’autres vous doivent de l’argent ou que vous en devez.',
  'help.ctx.trip-costs.bullet.5':
    "La colonne de droite présente les résultats : « Régler » indique qui doit payer qui, « Soldes » montre l'excédent ou le déficit de chaque voyageur, « Budget final » ce que le voyage coûte à chacun, et « Par catégorie » à quoi l'argent a été dépensé.",
  'help.ctx.trip-costs.bullet.6':
    'Un paiement enregistré apparaît dans le même registre, sur sa propre ligne, avec un crayon et « Annuler » à côté. Une dépense a un crayon et une corbeille, et la corbeille demande confirmation avant de supprimer la dépense. Une dépense avec des justificatifs affiche une pastille « Reçu » à côté de son nom pour les ouvrir.',
  'help.ctx.trip-costs.bullet.7':
    "« Tableau », dans la barre, présente les mêmes dépenses sous forme de feuille de calcul, regroupées par catégorie, avec « Personnes » et « Jours » et le montant par personne et par jour. « Résumé » remplace alors « Par catégorie ». Les Coûts mémorisent l'affichage choisi.",
  // add-expense
  'help.guide.add-expense.title': 'Ajouter une dépense',
  'help.guide.add-expense.goal': 'Enregistrer le coût d’un achat, qui l’a payé et avec qui il est partagé.',
  'help.guide.add-expense.step.1':
    'Cliquez sur « Ajouter une dépense », tout à droite de la barre. L’éditeur s’ouvre, daté d’aujourd’hui, avec vous comme payeur et tout le monde déjà inclus dans la répartition.',
  'help.guide.add-expense.step.2':
    'Saisissez l’objet de la dépense dans le champ en haut de la boîte de dialogue. Tant qu’il est vide, il affiche « ex. dîner, souvenirs, essence… ». C’est le nom de la dépense, indispensable pour l’enregistrer.',
  'help.guide.add-expense.step.3':
    "La pastille sous le nom indique la « Catégorie », « Nourriture et boissons » tant que vous n'en choisissez pas une autre. Il en existe quatorze, non modifiables. L'en-tête prend la couleur de la catégorie choisie, tout comme l'onglet de la ligne et sa barre dans « Par catégorie ».",
  'help.guide.add-expense.step.4':
    "Saisissez le montant du reçu dans « Montant total ». « Devise », juste à côté, est d'abord réglée sur la devise d'affichage des Coûts. Si vous la changez, l'éditeur affiche le montant converti. « Jour » est d'abord réglé sur aujourd'hui, et la dépense est classée sous ce jour dans la liste.",
  'help.guide.add-expense.step.5':
    "Sous « Qui a payé ? », cliquez sur la personne qui a réellement payé. « Vous » est présélectionné. « Personne n'a encore payé » enregistre le montant sans que personne ne doive d'argent, et « Plusieurs personnes ont payé », dans le sélecteur à côté du titre, répartit l'addition entre plusieurs payeurs.",
  'help.guide.add-expense.step.6':
    '« Répartition », en dessous, est réglée sur « À parts égales », avec tout le monde coché et la part de chacun à côté de son nom. Conservez ce réglage ou modifiez-le. Cliquez sur « Ajouter une dépense » en bas de la fenêtre pour enregistrer.',
  'help.guide.add-expense.result':
    'La dépense figure dans le registre sous son jour et compte dans « Dépenses totales du voyage », et la colonne de règlement a recalculé qui doit combien à qui.',
  'help.guide.add-expense.tip.1':
    'Si vous ne changez pas les valeurs par défaut, la dépense est datée d’aujourd’hui, payée par vous et répartie à parts égales entre tous : seuls le nom et le montant sont à renseigner.',
  'help.guide.add-expense.tip.2':
    'Le ± à côté du montant transforme la dépense en remboursement. Un total négatif signifie que de l’argent est rendu, et la répartition est inversée.',
  'help.guide.add-expense.tip.3':
    '« Joindre », à côté de « Reçus et factures » en bas de la boîte de dialogue, accepte les images et les PDF. Ils sont importés à l’enregistrement et rangés dans les « Fichiers » du voyage, et une pastille « Reçu » apparaît à côté du nom dans la liste.',
  // expense-payers
  'help.guide.expense-payers.title': 'Indiquer qui a payé',
  'help.guide.expense-payers.goal':
    "Indiquer qui a payé une dépense : c'est l'autre moitié du calcul des remboursements.",
  'help.guide.expense-payers.step.1':
    "Ouvrez une dépense avec le crayon à côté de sa ligne et regardez « Qui a payé ? ». « Une seule personne a payé » est l'option par défaut du sélecteur à côté du titre : chaque voyageur a sa pastille, et la pastille encadrée désigne la personne qui a payé. Cliquez sur une autre pastille pour changer.",
  'help.guide.expense-payers.step.2':
    "« Personne n'a encore payé », la pastille en pointillés après les voyageurs, enregistre le montant sans que personne ne doive rien. La dépense compte quand même dans « Dépenses totales du voyage ».",
  'help.guide.expense-payers.step.3':
    '« Plusieurs personnes ont payé », l’autre option de ce sélecteur, liste chaque voyageur avec une case à cocher, et chaque personne cochée reçoit un champ de montant. Cochez les personnes qui ont payé et saisissez combien chacune a payé ; la somme doit être égale au total.',
  'help.guide.expense-payers.step.4':
    'Une dépense que personne n’a payée est marquée « Inachevé » sur sa ligne et comptée dans la carte « Montant en attente », qui additionne les dépenses encore sans payeur.',
  'help.guide.expense-payers.result':
    'Qui a payé détermine qui est remboursé, la répartition détermine qui paie, et « Soldes » correspond à la différence entre les deux.',
  'help.guide.expense-payers.tip.1':
    "« Qui a payé ? » et « Répartition » sont indépendants : vous pouvez payer un dîner auquel vous n'avez pas participé, et être inclus dans la répartition d'un dîner que vous n'avez pas payé.",
  'help.guide.expense-payers.tip.2':
    "Avec plusieurs payeurs, la somme des montants doit correspondre au total. Quand vous cochez un payeur de plus, le reste est de nouveau réparti entre les montants que vous n'avez pas saisis vous-même. Tant que les montants ne correspondent pas, l'éditeur affiche le total à atteindre et n'enregistre pas.",
  'help.guide.expense-payers.tip.3':
    "Repasser une dépense sur « Personne n'a encore payé » ne la supprime pas : le montant reste dans « Dépenses totales du voyage » et la ligne passe en « Inachevé ».",
  // split-expense
  'help.guide.split-expense.title': 'Répartir une addition entre les voyageurs',
  'help.guide.split-expense.goal':
    'Définir qui doit quoi pour une dépense : tout le monde à parts égales, par montant, ou article par article d’après le reçu.',
  'help.guide.split-expense.step.1':
    'Dans l’éditeur de dépense, « Répartition » liste chaque voyageur avec une case à cocher. Décochez un nom pour l’exclure de cette dépense : le nom est grisé, perd sa part et ne doit rien pour cette dépense.',
  'help.guide.split-expense.step.2':
    '« À parts égales », dans le sélecteur à côté du titre, est le choix par défaut : chaque voyageur coché reçoit la même part, affichée à côté de son nom. Les badges sous la liste indiquent le nombre de personnes concernées et le montant de chaque part.',
  'help.guide.split-expense.step.3':
    '« Personnalisé » remplace les parts par des champs de montant. Saisissez ce que doit chaque voyageur. Le badge en dessous se met à jour pendant la saisie et passe au vert avec « La répartition correspond au total ». Vous ne pouvez pas enregistrer tant que les montants ne correspondent pas au total.',
  'help.guide.split-expense.step.4':
    '« Reçu » répartit le ticket ligne par ligne : « Ajouter un article », puis un nom et un prix par ligne, et à côté de « Partagé entre : » les voyageurs qui se partagent cette ligne.',
  'help.guide.split-expense.step.5':
    '« Part de chacun », sous les lignes, indique ce que chaque voyageur doit au final, et « Montant total », en haut, correspond à la somme des lignes. Cliquez sur « Enregistrer » en bas de la fenêtre.',
  'help.guide.split-expense.result':
    'Tous les soldes sont calculés d’après la répartition. Elle est enregistrée avec la dépense, s’affiche sur sa ligne sous « Répartition » avec la part de chaque voyageur, et peut être modifiée plus tard sans rien changer d’autre.',
  'help.guide.split-expense.tip.1':
    'Un voyageur que vous décochez ne doit rien pour cette dépense, les autres paient leur part.',
  'help.guide.split-expense.tip.2':
    '« À parts égales » répartit au centime près : le centime restant revient à une personne différente à chaque dépense, pour que ce ne soit pas toujours la même qui le paie.',
  'help.guide.split-expense.tip.3':
    'Le mode « Reçu » calcule lui-même le « Montant total » et grise le champ : le total correspond à la somme des lignes du reçu.',
  'help.guide.split-expense.tip.4':
    'Une répartition personnalisée peut aussi être saisie en pourcentage : réglez « Saisir les parts en » sur %, et les parts doivent totaliser 100 % pour que la dépense puisse être enregistrée.',
  // expense-currency
  'help.guide.expense-currency.title': 'Saisir une dépense dans une autre devise',
  'help.guide.expense-currency.goal': 'Saisir le montant du reçu et laisser TREK enregistrer le taux de change.',
  'help.guide.expense-currency.step.1':
    'Ouvrez « Ajouter une dépense ». Saisissez le nom en haut de la fenêtre, puis le montant dans « Montant total », exactement comme sur le reçu, sans le convertir.',
  'help.guide.expense-currency.step.2':
    'Ouvrez « Devise » à côté du montant et choisissez la devise du reçu. La liste contient tous les codes connus de TREK et vous pouvez y chercher : tapez les trois lettres.',
  'help.guide.expense-currency.step.3':
    'Une rangée de badges apparaît sous les champs : le montant saisi et sa valeur actuelle, marquée « taux en direct ». Il ne s’agit que d’un aperçu, pas de la valeur enregistrée.',
  'help.guide.expense-currency.step.4':
    'Cliquez sur « Ajouter une dépense » en bas de la boîte de dialogue. Le taux est figé à ce moment-là : cette dépense conserve la valeur qu’elle avait le jour de sa saisie.',
  'help.guide.expense-currency.step.5':
    'Dans le registre, la ligne affiche les deux montants sous le nom : celui que vous avez saisi, une flèche, puis le montant dans la devise du voyage. Tous les totaux, soldes et règlements de l’onglet « Coûts » utilisent ce second montant.',
  'help.guide.expense-currency.result':
    'La dépense conserve le montant et la devise saisis. Le registre affiche les deux, et les totaux et soldes du voyage sont calculés dans la devise du voyage.',
  'help.guide.expense-currency.tip.1':
    "Le taux est figé à l'enregistrement : une dette réglée ne change pas si le taux de change évolue la semaine suivante. Un nouveau taux n'est enregistré que si vous changez la devise de la dépense.",
  'help.guide.expense-currency.tip.2':
    "« Devise d'affichage », dans les Paramètres, ne change que l'affichage des montants. Les montants enregistrés ne changent jamais. Si ce champ est vide, chaque voyage s'affiche dans sa propre devise.",
  'help.guide.expense-currency.tip.3':
    'La devise du voyage se définit sur le voyage lui-même, dans « Modifier le voyage », et nécessite la permission « Modifier les détails du voyage ». Si vous la changez, tous les taux figés sont recalculés pour la nouvelle devise. Les montants eux-mêmes ne sont pas convertis.',
  // filter-costs
  'help.guide.filter-costs.title': 'Retrouver une dépense, ou les dépenses d’une journée',
  'help.guide.filter-costs.goal': 'Filtrer une longue liste de dépenses pour n’afficher que ce que vous cherchez.',
  'help.guide.filter-costs.step.1':
    'Tapez dans « Rechercher des dépenses… », dans la barre. La recherche porte sur le nom des dépenses au fil de la saisie, et Échap l’efface.',
  'help.guide.filter-costs.step.2':
    "« Filtrer », l'entonnoir à côté de la recherche, ouvre les filtres. Le sélecteur en haut vous donne votre propre vue du registre : « Tous », « Payées par moi » pour ce que vous avez réglé, et « On me doit » pour les dépenses où vous avez payé plus que votre part.",
  'help.guide.filter-costs.step.3':
    "Sous « Catégorie », choisissez l'une des quatorze catégories pour n'afficher que ses dépenses. L'entonnoir indique le nombre de filtres actifs.",
  'help.guide.filter-costs.step.4':
    "Sous « Jour », choisissez l'un des jours comportant des dépenses. Un bandeau remplace les en-têtes de jour et affiche la date complète, le nombre de dépenses et leur total.",
  'help.guide.filter-costs.step.5':
    "« Exporter CSV », l'icône de téléchargement à côté de l'entonnoir, enregistre toutes les dépenses dans un fichier, avec le montant d'origine, sa devise et le montant converti.",
  'help.guide.filter-costs.result':
    'Vous pouvez combiner les filtres, et les groupes par jour se mettent à jour avec leurs propres totaux pour les dépenses restantes.',
  'help.guide.filter-costs.tip.1':
    'Les paiements enregistrés n’ont ni nom ni catégorie : une recherche ou un filtre par catégorie les masque, tout comme « On me doit ». Le filtre par jour les conserve, sous le jour du paiement.',
  'help.guide.filter-costs.tip.2':
    '« Exporter CSV » exporte toujours toutes les dépenses, quel que soit le filtre affiché, à raison d’une ligne par dépense.',
  'help.guide.filter-costs.tip.3':
    '« Réinitialiser les filtres », en bas du menu des filtres dès qu’un filtre est actif, les désactive tous d’un coup.',
  // settle-up
  'help.guide.settle-up.title': 'Voir qui doit combien à qui et régler les dettes',
  'help.guide.settle-up.goal':
    'Réduire de nombreuses dépenses partagées au plus petit nombre de virements qui soldent toutes les dettes, et enregistrer ces virements une fois effectués.',
  'help.guide.settle-up.step.1':
    'La carte « Régler », dans la colonne de droite, liste les virements qui solderaient toutes les dettes : qui paie qui, représentés par deux avatars avec les noms en infobulle, et le montant. Le chiffre dans son en-tête indique combien de virements restent à effectuer.',
  'help.guide.settle-up.step.2':
    "« Régler », à côté d'un virement, l'enregistre comme effectué. Le virement disparaît de la carte et les soldes sont mis à jour.",
  'help.guide.settle-up.step.3':
    'Le virement enregistré apparaît sur une ligne du registre, sous le jour où il a eu lieu, marquée « Paiement », avec les deux voyageurs et le montant.',
  'help.guide.settle-up.step.4':
    'À côté de cette ligne, le crayon corrige un paiement et « Annuler » l’annule ; le virement revient alors dans la carte « Régler ».',
  'help.guide.settle-up.step.5':
    '« Ajouter un paiement », dans l’en-tête de la carte, enregistre un virement qui ne correspond pas à une suggestion. Choisissez « De » et « À », le montant, sa devise et le jour du paiement, ajoutez si vous le souhaitez une « Note », par exemple le moyen de paiement, puis cliquez sur « Ajouter un paiement » en bas de la boîte de dialogue.',
  'help.guide.settle-up.step.6':
    '« Régler », dans la barre du haut, enregistre d’un coup tous les virements en attente, sans demander de confirmation, par exemple quand le groupe solde toutes ses dettes à la fin d’un voyage.',
  'help.guide.settle-up.result':
    'Chaque remboursement enregistré devient une ligne du registre et fait disparaître une ligne de la carte « Régler ». Quand la carte affiche « Tout le monde est quitte », tout est réglé pour ce voyage.',
  'help.guide.settle-up.tip.1':
    "La carte affiche le minimum de virements, pas chaque dette : si trois personnes se doivent de l'argent en cercle, cela se réduit à un ou deux paiements.",
  'help.guide.settle-up.tip.2':
    "« Régler » ne fait qu'enregistrer un virement, sans envoyer d'argent. Payez avec votre moyen de paiement habituel, puis cliquez sur « Régler ».",
  'help.guide.settle-up.tip.3':
    "Un paiement peut se faire dans n'importe quelle devise : rembourser une dette en yens avec des euros n'a donc rien d'anormal. La fenêtre a son propre sélecteur de devise et fige aussi ce taux.",
  // final-budget
  'help.guide.final-budget.title': 'Voir ce que le voyage a coûté à chaque voyageur',
  'help.guide.final-budget.goal':
    'Voir les chiffres de chaque personne : le solde actuel et le coût réel par personne.',
  'help.guide.final-budget.step.1':
    '« Soldes » affiche la situation de chaque voyageur : une barre verte vers la droite si le voyage lui doit de l’argent, une barre rouge vers la gauche s’il en doit, et le montant à côté du nom.',
  'help.guide.final-budget.step.2':
    "« Budget final », juste en dessous, répond à une autre question : non pas qui doit quoi pour l'instant, mais combien le voyage coûte à chaque voyageur une fois tous les remboursements effectués.",
  'help.guide.final-budget.step.3':
    'Cliquez sur un nom pour voir le détail du calcul : « Dépenses payées », puis « Remboursements nets » et « Remboursements en attente » en dessous.',
  'help.guide.final-budget.step.4':
    'Sous les trois lignes, une liste sous le nom de chaque voyageur détaille ce qui compose chaque ligne : les dépenses payées par ce voyageur, les virements déjà enregistrés et ceux encore à effectuer. Le total de chaque liste correspond exactement à la ligne du même nom.',
  'help.guide.final-budget.result':
    "« Soldes » indique qui doit de l'argent et à qui on en doit aujourd'hui. « Budget final » indique ce que le voyage coûte à chacun une fois tous les remboursements effectués.",
  'help.guide.final-budget.tip.1':
    'Enregistrer un paiement ne modifie le budget final de personne. Cela fait seulement passer un montant des remboursements en attente aux remboursements nets.',
  'help.guide.final-budget.tip.2':
    'Une dépense sans payeur n’apparaît dans aucune des deux cartes, tout comme elle n’est pas prise en compte dans les suggestions de règlement.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Transformer une réservation en dépense',
  'help.guide.expense-from-booking.goal':
    "Associer le coût réel d'un vol, d'un hôtel ou d'un lieu à la fiche correspondante.",
  'help.guide.expense-from-booking.step.1':
    'Repérez la réservation dans l’onglet « Transports » ou « Réservations » et cliquez sur le crayon en haut de sa carte.',
  'help.guide.expense-from-booking.step.2':
    "Faites défiler jusqu'à « Coûts », vers la fin du formulaire. Vous y trouvez « Créer une dépense », qui enregistre d'abord la réservation, et « Lier une dépense existante » pour une dépense déjà saisie dans les Coûts.",
  'help.guide.expense-from-booking.step.3':
    'Cliquez sur « Créer une dépense ». La réservation est enregistrée, le formulaire se ferme et l’éditeur de coûts s’ouvre, avec le titre de la réservation comme nom, une catégorie correspondant à son type et le jour de la réservation comme jour de la dépense.',
  'help.guide.expense-from-booking.step.4':
    'Renseignez le montant et sa devise, qui a payé et la répartition, comme pour toute dépense, puis cliquez sur « Ajouter une dépense ». Quand vous rouvrez la réservation, la dépense apparaît sous « Dépenses liées », avec un crayon pour la modifier, « Délier, garder la dépense » pour supprimer le lien en conservant la dépense, et une corbeille pour la supprimer.',
  'help.guide.expense-from-booking.result':
    "La réservation affiche son coût, et la dépense est une ligne ordinaire de l'onglet Coûts, avec un payeur, une répartition et une devise comme toute autre dépense.",
  'help.guide.expense-from-booking.tip.1':
    'Supprimer la réservation supprime aussi ses dépenses liées, et la demande de confirmation vous le signale. « Retirer la dépense », dans le bloc « Coûts » de la réservation, fait l’inverse : il supprime la dépense et conserve la réservation. « Délier, garder la dépense » conserve les deux.',
  'help.guide.expense-from-booking.tip.2':
    'Le formulaire d’un lieu comporte le même bloc ; « Créer une dépense » y enregistre d’abord le lieu.',
  // costs-table
  'help.guide.costs-table.title': 'Planifier les coûts dans un tableau',
  'help.guide.costs-table.goal':
    'Consulter et modifier les dépenses sous forme de tableau, triées par catégorie et calculées par personne et par jour.',
  'help.guide.costs-table.step.1':
    "Cliquez sur « Tableau », la deuxième icône du sélecteur « Liste / Tableau » dans la barre. Un tableau des mêmes dépenses remplace le registre, et la recherche comme les filtres s'y appliquent aussi.",
  'help.guide.costs-table.step.2':
    'Le tableau est groupé par catégorie. L’en-tête de chaque groupe indique son nom, son nombre de dépenses et son sous-total ; cliquez dessus pour replier le groupe. Les colonnes sont « Nom », « Date », « Total », « Personnes » et « Jours », puis « Par personne », « Par jour » et « P. p / Jour », calculées à partir des précédentes, sur fond gris. Une ligne « Total » en bas fait la somme de l’ensemble.',
  'help.guide.costs-table.step.3':
    "Cliquez sur une cellule pour la modifier directement : un nom, un total, « Personnes » ou « Jours ». Saisissez la valeur, puis appuyez sur Entrée ou cliquez ailleurs pour l'enregistrer, ou appuyez sur Échap pour annuler. La date ouvre le calendrier. « Par personne » et les autres colonnes calculées se mettent à jour immédiatement.",
  'help.guide.costs-table.step.4':
    "Un total accompagné d'un cadenas ne peut pas être modifié ici : quelqu'un l'a payé, ou il a été saisi dans une autre devise, et son infobulle précise le cas. Un clic ouvre alors la dépense elle-même, pour que les soldes et le taux de change figé restent justes.",
  'help.guide.costs-table.step.5':
    '« Ajouter une dépense », en fin de catégorie, y ajoute une ligne nommée « Nouvelle entrée », datée comme la dernière entrée de cette catégorie. Le champ du nom est déjà ouvert pour que vous puissiez le modifier. Saisissez un total de la même façon.',
  'help.guide.costs-table.step.6':
    'Dans cette vue, la colonne de droite affiche « Résumé » au lieu de « Par catégorie ». Les dépenses y sont totalisées de quatre façons : catégorie, jour, « Payeur », avec « Pas encore de payeur » pour celles qui ne sont pas réglées, et statut, « Payé » ou ouvert.',
  'help.guide.costs-table.result':
    'Chaque dépense apparaît dans sa catégorie avec son montant par personne et par jour. Quand vous modifiez un total dans une case, les cartes au-dessus et « Résumé » se mettent à jour immédiatement.',
  'help.guide.costs-table.tip.1':
    '« Coûts » mémorise la vue dans ce navigateur : l’onglet s’ouvre sur le tableau jusqu’à ce que vous recliquiez sur « Liste ».',
  'help.guide.costs-table.tip.2':
    "Une dépense répartie en « Personnalisé » ou « Reçu » n'a pas de part unique par personne : ses colonnes « Par personne » et « P. p / Jour » restent donc vides.",
  'help.guide.costs-table.tip.3':
    "Les payeurs, la répartition, la note et les reçus se modifient dans la dépense elle-même : « Plus d'options », en bout de ligne, propose « Modifier », et « Supprimer » pour retirer la ligne.",

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transports', // same-as-en
  'help.ctx.trip-transports.summary':
    'Tous vos déplacements entre les étapes : vols, trains, bus, voitures, taxis, vélos, croisières, ferries, téléphériques et les liaisons de transports en commun que TREK recherche pour vous. L’onglet les répertorie. Vous pouvez aussi les créer et les consulter dans le programme, et ils sont tracés sur la carte.',
  'help.ctx.trip-transports.bullet.1':
    'L’onglet ne contient que les trajets. Les hébergements, restaurants, événements et billets se trouvent dans l’onglet « Réservations » : une même entrée n’apparaît donc jamais deux fois.',
  'help.ctx.trip-transports.bullet.2':
    "La barre du haut comporte « Rechercher », « Filtrer » pour le statut, les types et les voyageurs, les trois vues « Cartes », « Liste » et « Chronologie », « Options d'affichage » et « Exporter en tableur (CSV) », qui télécharge ce qui est affiché. « Transport », à droite, ajoute un trajet à la main. Les icônes qui le précèdent, « Importer des confirmations de réservation » et « Importer depuis AirTrail », apparaissent si le serveur peut lire des confirmations ou si un AirTrail est connecté. Dans un onglet vide, les mêmes actions apparaissent au centre : « Transport », « Importer depuis un fichier » et AirTrail.",
  'help.ctx.trip-transports.bullet.3':
    "« Cartes » est la vue par défaut de l’onglet : « Confirmé » d’abord, puis « En attente ». Vous pouvez replier chaque section en cliquant sur son titre. Les liaisons de transports en commun planifiées n’ont pas de statut et apparaissent parmi les trajets confirmés, dans l’ordre chronologique, sauf si « Options d'affichage » leur attribue leur propre section, « Transports en commun automatisés ». « Liste » regroupe par jour, et « Chronologie » affiche tous les trajets sur les jours du voyage.",
  'help.ctx.trip-transports.bullet.4':
    'Le bandeau supérieur d’une carte est coloré selon son statut : vert pour confirmé, orange pour en attente, bleu pour une liaison planifiée. Il affiche le point de statut, le type, le titre, le crayon et la corbeille. En dessous : la date, l’heure, le « Code de réservation », l’itinéraire et la compagnie aérienne et le numéro de vol, ou le numéro de train, le quai et la place. Cliquez sur la carte pour ouvrir ses détails.',
  'help.ctx.trip-transports.bullet.5':
    'Vous pouvez aussi créer des transports dans le programme : le + dans l’en-tête d’un jour (son info-bulle indique « Ajouter au jour »), ou un clic droit sur l’en-tête, propose « Ajouter un transport » et « Transports en commun ». Le lien de durée de trajet entre deux étapes ouvre la même recherche pour ce seul tronçon.',
  'help.ctx.trip-transports.bullet.6':
    'Un transport dont les deux extrémités sont renseignées trace une ligne sur la carte. L’icône d’itinéraire de sa ligne dans le programme du jour et « Sur la carte » dans ses détails affichent ce tracé. « Afficher tous les itinéraires », dans la barre d’outils au-dessus des jours, affiche ou masque les tracés de tout le voyage.',
  // transports-list
  'help.guide.transports-list.title': "Comprendre l'onglet Transports",
  'help.guide.transports-list.goal': "Comprendre ce qu'affiche la liste avant d'y modifier quoi que ce soit.",
  'help.guide.transports-list.step.1':
    '« Transports » est un onglet du voyage, après « Prévu » (et « Sorties » si cette extension est activée). Il ne contient que les trajets : hôtels, restaurants, événements et billets se trouvent dans l’onglet « Réservations ».',
  'help.guide.transports-list.step.2':
    '« Rechercher », à gauche de la barre, filtre les trajets au fil de la saisie. « Filtrer », l’entonnoir juste à côté, ouvre les options : « Statut » avec « Tous », « Confirmé » et « En attente », puis chaque type utilisé avec son nombre. Cochez un ou plusieurs types pour n’afficher que ceux-là. Un chiffre sur l’entonnoir indique le nombre de filtres actifs, et la barre indique combien de trajets sont affichés, par exemple 1 sur 4. « Réinitialiser les filtres », en bas du menu, réaffiche tous les trajets.',
  'help.guide.transports-list.step.3':
    "« Cartes », « Liste » et « Chronologie », juste à côté, affichent les transports sous forme de cartes, de lignes regroupées par jour ou de barres réparties sur les jours du voyage. « Options d'affichage », l'icône des curseurs, règle « Grouper par » et « Trier par » pour « Cartes » et « Liste », ainsi que les couloirs de « Chronologie ». « Réinitialiser l'affichage » rétablit les valeurs par défaut. Dans « Cartes », « Transports en commun dans une section à part » affiche les liaisons prévues sous « Transports en commun automatisés ».",
  'help.guide.transports-list.step.4':
    "Chaque carte affiche toutes les informations. Le bandeau du haut est vert pour « Confirmé » et ambre pour « En attente », et affiche le point de statut, le type et le titre. En dessous, « Date » indique les jours couverts avec leurs dates. Viennent ensuite « Heure », « Code de réservation », « Itinéraire » avec l'icône du type entre les arrêts, puis la compagnie aérienne et le numéro de vol, ou le numéro du train, le quai et la place. Cliquez sur la carte pour ouvrir ses détails.",
  'help.guide.transports-list.step.5':
    'Cliquez sur le point de statut pour faire passer le trajet de « En attente » à « Confirmé », ou l’inverse ; son info-bulle indique le sens, par exemple « Passer à En attente ». Le crayon dans l’en-tête ouvre le formulaire du transport, et la corbeille le supprime après la question « Supprimer la réservation ? », qui liste tout ce qui sera supprimé, y compris les coûts liés.',
  'help.guide.transports-list.result':
    'Chaque carte indique si le trajet est réservé, et la barre permet à tout moment de filtrer ou de trier la liste.',
  'help.guide.transports-list.tip.1':
    'L’onglet mémorise vos réglages : la vue, le regroupement et le tri dans ce navigateur, les sections repliées pour chaque voyage, et les filtres jusqu’à la fermeture de l’onglet du navigateur.',
  'help.guide.transports-list.tip.2':
    '« Importer des confirmations de réservation » et « Importer depuis AirTrail », les deux icônes devant « Transport », n’apparaissent que si le serveur peut lire les confirmations et si une instance AirTrail est connectée. Sinon, vous remplissez la liste à la main ou avec la recherche de transports en commun.',
  // add-transport
  'help.guide.add-transport.title': 'Ajouter un transport à un jour',
  'help.guide.add-transport.goal': "Ajouter au bon jour le transport qui vous mène d'une étape à la suivante.",
  'help.guide.add-transport.step.1':
    'Dans l’en-tête du jour du trajet, cliquez sur le +, dont l’info-bulle indique « Ajouter au jour », et choisissez « Ajouter un transport ». Un clic droit sur l’en-tête du jour propose le même menu. Le formulaire s’ouvre avec ce jour déjà renseigné.',
  'help.guide.add-transport.step.2':
    'La pastille de type dans l’en-tête indique le type de transport, « Vol » par défaut. Cliquez dessus pour choisir « Vol », « Train », « Bus », « Voiture », « Taxi », « Vélo », « Croisière », « Ferry », « Téléphérique » ou « Autre », et le formulaire s’adapte : un vol a un aéroport à chaque étape, un train une suite de gares, une croisière « Embarquement », « Escale » et « Débarquement », une voiture « Prise en charge », « Restitution » et « Étapes en chemin ».',
  'help.guide.add-transport.step.3':
    "Saisissez le titre directement dans le bandeau du haut, à la place du texte d'exemple gris. C'est le seul champ obligatoire : tant qu'il est vide, la ligne en dessous affiche « Titre * » et « Ajouter » reste grisé. Choisissez un titre que vous reconnaîtriez sur un tableau des départs.",
  'help.guide.add-transport.step.4':
    "Sous « Itinéraire », « De » et « À » acceptent une gare, un port ou une adresse. Les lieux du voyage sont proposés avant même que vous commenciez à saisir. Tapez au moins trois lettres pour lancer la recherche, puis choisissez un résultat. Un nom saisi sans être choisi dans les résultats n'est pas enregistré, et rien ne s'affiche sur la carte.",
  'help.guide.add-transport.step.5':
    '« Date » et « Heure de début » indiquent le départ, « Date de fin » et « Heure de fin » l’arrivée ; pour un trajet qui arrive le lendemain, indiquez le jour suivant. « Code de réservation » et « Notes », plus bas, sont facultatifs. Cliquez sur la pastille « En attente » dans l’en-tête pour passer à « Confirmé ».',
  'help.guide.add-transport.step.6': 'Cliquez sur « Ajouter ».',
  'help.guide.add-transport.result':
    'Le transport apparaît sur une ligne de la journée, à son heure parmi les étapes, et sous forme de carte dans l’onglet « Transports », sous « En attente » ou « Confirmé ».',
  'help.guide.add-transport.tip.1':
    'La ligne se place selon son heure de départ, après la dernière étape qui commence plus tôt. Faites-la glisser par sa poignée pour la déplacer ailleurs dans la journée ou sur un autre jour.',
  'help.guide.add-transport.tip.2':
    "Utilisez « Joindre un fichier » sous « Fichiers » pour ajouter le billet. « Créer une dépense » sous « Coûts » enregistre la réservation et ouvre l'éditeur des Coûts pour le prix du billet.",
  'help.guide.add-transport.tip.3':
    "« Voyageurs », le premier bloc du formulaire, indique qui prend ce transport. Dès que le voyage compte plusieurs membres et qu'un transport mentionne quelqu'un, « Filtrer » propose aussi « Voyageurs » dans l'onglet, pour n'afficher que les transports d'une personne.",
  // import-transport-file
  'help.guide.import-transport-file.title': 'Importer un vol depuis son billet électronique',
  'help.guide.import-transport-file.goal':
    'Laisser TREK lire un vol, un train ou un ferry à partir du billet envoyé par le transporteur, et le vérifier avant de l’enregistrer.',
  'help.guide.import-transport-file.step.1':
    'Dans la barre de l’onglet « Transports », cliquez sur l’icône de téléchargement devant « Transport », dont l’info-bulle indique « Importer des confirmations de réservation ». La boîte de dialogue du même nom s’ouvre, identique à celle de l’onglet « Réservations ». Dans un onglet vide, « Importer depuis un fichier », au centre, fait la même chose.',
  'help.guide.import-transport-file.step.2':
    'Déposez le billet dans la zone, ou cliquez sur la zone et choisissez le fichier : EML, PDF, PKPass, HTML et TXT, jusqu’à cinq fichiers de 10 Mo chacun, ainsi que des photos de billet (JPG, PNG, WEBP) si votre serveur dispose d’un modèle d’IA pour les lire. La zone affiche le nom des fichiers choisis.',
  'help.guide.import-transport-file.step.3':
    'Cliquez sur « Importer ». La boîte de dialogue se ferme aussitôt, et le fichier est lu en arrière-plan.',
  'help.guide.import-transport-file.step.4':
    'Une carte en bas à droite affiche la progression sous le nom du fichier. « Analyse des fichiers… » laisse place à une coche une fois la lecture terminée, et la carte propose « Importer ». Cliquez dessus.',
  'help.guide.import-transport-file.step.5':
    "Un vol s'ouvre dans « Ajouter un transport », déjà rempli : la pastille de type sur « Vol », la compagnie et le numéro de vol en titre dans l'en-tête, les deux aéroports sous « Itinéraire » avec « Départ » et « Arrivée », leurs horaires et leurs fuseaux horaires, « Compagnie aérienne » et « N° de vol », le « Code de réservation » et le billet sous « Fichiers ». Vérifiez le tout et cliquez sur « Ajouter ».",
  'help.guide.import-transport-file.result':
    "Le vol apparaît en carte sous « En attente » dans l'onglet Transports et en ligne le jour du départ, avec le billet sous « Fichiers ». Quand les deux aéroports sont connus, le vol s'affiche en arc sur la carte.",
  'help.guide.import-transport-file.tip.1':
    "Les deux onglets utilisent le même import. Un fichier contenant un vol et un hôtel ouvre d'abord le vol dans « Ajouter un transport », puis l'hôtel dans « Nouvelle réservation », quel que soit l'onglet de départ.",
  'help.guide.import-transport-file.tip.2':
    "Les aéroports sont localisés grâce à leur code. Si une gare ou un port n'a pas pu être localisé, son nom s'affiche en ambre sur la carte d'import en bas à droite. Choisissez-le manuellement sous « Itinéraire » avant de cliquer sur « Ajouter », sinon le transport n'apparaît pas sur la carte.",
  // plan-transit
  'help.guide.plan-transit.title': 'Planifier une liaison en transports en commun',
  'help.guide.plan-transit.goal':
    'Laisser TREK chercher les trains et bus réels entre deux points d’une journée et ajouter au programme celui que vous choisissez.',
  'help.guide.plan-transit.step.1':
    'Cliquez sur le + dans l’en-tête du jour et choisissez « Transports en commun ». La recherche s’ouvre pour ce jour : le jour apparaît sous forme de pastille dans l’en-tête, et « Manuel » et « Automatique », juste à côté, permettent de passer de cette recherche au formulaire classique.',
  'help.guide.plan-transit.step.2':
    '« De » et « À » acceptent une étape ou une gare. Tant que le champ est vide, TREK propose l’hébergement du jour, les gares et aéroports des réservations du jour et les étapes du jour. Dès que vous tapez deux lettres, il cherche plutôt parmi les gares du réseau. « Inverser », entre les deux champs, intervertit « De » et « À ».',
  'help.guide.plan-transit.step.3':
    "« Départ » ou « Arrivée » avec une heure indique quand vous souhaitez voyager, et « Meilleur itinéraire », « Moins de correspondances » ou « Moins de marche » détermine l'ordre des résultats.",
  'help.guide.plan-transit.step.4':
    "Les pastilles en dessous indiquent les modes autorisés : Train, Métro, Tramway, Bus, Ferry et Téléphérique. Désactivez-en un pour l'exclure, au moins un reste actif. Cliquez ensuite sur « Rechercher ».",
  'help.guide.plan-transit.step.5':
    "Chaque résultat indique le départ et l'arrivée, la durée, le nombre de correspondances et le temps de marche, ainsi que les lignes sous forme de badges, dans leurs couleurs quand l'horaire les fournit. Cliquez sur un résultat pour le déplier et voir chaque tronçon, avec les arrêts de montée et de correspondance, les quais et les trajets à pied entre les lignes.",
  'help.guide.plan-transit.step.6': 'Cliquez sur « Ajouter au jour ».',
  'help.guide.plan-transit.result':
    'La liaison apparaît sur une ligne de la journée, avec les badges de ses lignes. Cliquez sur son chevron pour voir chaque tronçon. Elle figure aussi en bleu, sous forme de carte, dans l’onglet « Transports », parmi les trajets confirmés.',
  'help.guide.plan-transit.tip.1':
    'Les liaisons proviennent de Transitous, un service communautaire gratuit qui utilise les données horaires publiques : sans clé ni compte. Un administrateur peut configurer la recherche pour utiliser Google à la place.',
  'help.guide.plan-transit.tip.2':
    'Aucun résultat ? Les données couvrent une région et une période. Essayez un autre horaire, activez davantage de modes ou choisissez une gare plutôt que le lieu lui-même. Le message indique le service qui a répondu. Un voyage sans dates n’a pas de jour sur lequel chercher : seul le formulaire classique est proposé.',
  'help.guide.plan-transit.tip.3':
    'La même recherche s’ouvre pour un seul tronçon : cliquez sur le lien de durée de trajet entre deux étapes et choisissez « Transports en commun ». Le départ, l’arrivée et l’heure de départ sont préremplis.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Ouvrir et modifier une liaison prévue',
  'help.guide.change-transit-route.goal':
    "Consulter la liaison ligne par ligne, la renommer ou relancer la recherche d'itinéraire.",
  'help.guide.change-transit-route.step.1':
    "Dans l'onglet Transports, une liaison prévue est une carte à bandeau bleu, classée par ordre chronologique avec les transports confirmés. Si « Transports en commun dans une section à part » est activé dans « Options d'affichage », elle apparaît plutôt sous « Transports en commun automatisés ». Cliquez sur la carte : la liaison s'ouvre comme une réservation.",
  'help.guide.change-transit-route.step.2':
    "Les tuiles du haut affichent le départ et l'arrivée avec leurs arrêts, la « Durée », les « Correspondances » et le temps « À pied ». En dessous, « Itinéraire » détaille la liaison ligne par ligne, avec les horaires, les quais et les trajets à pied entre les lignes.",
  'help.guide.change-transit-route.step.3':
    "« Modifier l'itinéraire », en bas de la réservation, rouvre la recherche, déjà renseignée avec les deux extrémités de cette liaison et son jour.",
  'help.guide.change-transit-route.step.4':
    'Cliquez sur « Rechercher », ouvrez une autre liaison et cliquez sur « Ajouter au jour » ; elle remplace l’ancienne. « Modifier », tout à droite en bas de la réservation, ouvre plutôt le formulaire de transport habituel, où vous pouvez modifier le « Code de réservation », les voyageurs, les notes et les fichiers.',
  'help.guide.change-transit-route.result':
    'Le trajet suit désormais le nouvel itinéraire, et sa carte dans l’onglet « Transports » affiche les nouvelles lignes et les nouveaux horaires.',
  'help.guide.change-transit-route.tip.1':
    "Cliquez sur le titre dans l'en-tête de la réservation pour renommer la liaison sans modifier l'itinéraire. Ses notes se saisissent dans le formulaire de transport qui s'ouvre avec « Modifier ».",
  'help.guide.change-transit-route.tip.2':
    'La corbeille en bas de la réservation supprime la liaison après confirmation. La journée conserve ses étapes.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': "Changer le mode de transport d'un tronçon",
  'help.guide.leg-travel-mode.goal':
    "Passer un tronçon d'une journée en voiture à pied, ou planifier ce tronçon avec la recherche de transports en commun.",
  'help.guide.leg-travel-mode.step.1':
    'Les liens entre les étapes n’apparaissent qu’une fois l’itinéraire du jour activé. Cliquez sur l’en-tête du jour pour l’ouvrir, puis sur « Itinéraire » dans la barre sous ses étapes.',
  'help.guide.leg-travel-mode.step.2':
    'Chaque lien indique la durée et la distance du tronçon, avec l’icône du mode de calcul utilisé : une voiture pour la voiture, un pied pour la marche, un vélo pour le vélo.',
  'help.guide.leg-travel-mode.step.3':
    'Cliquez sur le lien entre les étapes. Le menu propose « Voiture », « À pied » et « Vélo », « Transports en commun » pour ce seul tronçon, et « Utiliser le mode du jour ».',
  'help.guide.leg-travel-mode.step.4':
    'Choisissez « À pied ». Seul ce tronçon change ; le reste de la journée garde son propre mode.',
  'help.guide.leg-travel-mode.result':
    'Le tronçon affiche l’icône du piéton et son temps de marche, et les autres tronçons de la journée gardent le mode du jour.',
  'help.guide.leg-travel-mode.tip.1':
    'Le mode est propre au tronçon, pas à la journée : les boutons « Voiture », « À pied » et « Vélo » de la journée n’écrasent jamais un tronçon réglé à la main. « Utiliser le mode du jour » refait suivre ces boutons au tronçon.',
  'help.guide.leg-travel-mode.tip.2':
    "« Transports en commun », dans le même menu, ouvre la recherche de liaisons pour ce tronçon précis, avec les deux extrémités et l'heure de départ déjà remplies.",
  'help.guide.leg-travel-mode.tip.3':
    "Les durées proviennent d'un calculateur d'itinéraire public, sur de vraies routes et de vrais chemins piétons. S'il ne parvient pas à calculer un tronçon, celui-ci reste en ligne droite, sans durée.",
  // edit-transport
  'help.guide.edit-transport.title': 'Modifier ou supprimer un transport',
  'help.guide.edit-transport.goal':
    'Corriger un horaire, un quai ou un code de réservation, ou retirer le transport du voyage.',
  'help.guide.edit-transport.step.1':
    'Dans le programme du jour, un transport est une ligne entre les étapes, colorée selon son type. Cliquez dessus pour ouvrir sa réservation : en haut, le statut, le type, les jours et le « Code de réservation » (avec un bouton pour le copier) sous forme de pastilles, et en dessous les heures de départ et d’arrivée avec leurs aéroports ou gares.',
  'help.guide.edit-transport.step.2':
    '« Modifier », en bas de la réservation, ouvre le formulaire qui l’a créée, avec « Modifier le transport » au-dessus du titre dans l’en-tête. Vous pouvez tout y changer : le titre, les pastilles de statut et de type, l’itinéraire, les jours et horaires, le « Code de réservation ».',
  'help.guide.edit-transport.step.3':
    'L’itinéraire d’un vol est une suite d’aéroports, celui d’un train une suite de gares, celui d’une croisière une suite de ports. « Ajouter une escale » (« Ajouter une escale » aussi pour une croisière) en insère une autre entre deux, et chaque tronçon conserve ses propres horaires et son propre numéro de vol ou de train.',
  'help.guide.edit-transport.step.4':
    'Cliquez sur « Mettre à jour ». Pour supprimer complètement le transport, utilisez la corbeille à gauche de la même barre, celle en bas de sa réservation ou celle de sa carte dans l’onglet « Transports », puis confirmez.',
  'help.guide.edit-transport.result':
    'La modification apparaît partout où figure le transport : dans l’onglet « Transports », dans la journée concernée et sur son tracé de la carte.',
  'help.guide.edit-transport.tip.1':
    "Le même formulaire s'ouvre depuis deux endroits : via « Modifier » dans la réservation qui s'ouvre depuis une ligne du programme du jour, et via le crayon sur la carte de l'onglet Transports. Une liaison en transports en commun prévue s'ouvre aussi comme une réservation : « Modifier l'itinéraire » y relance la recherche et « Modifier » ouvre ce formulaire.",
  'help.guide.edit-transport.tip.2':
    "Pour déplacer un transport vers un autre jour, pas besoin du formulaire : faites glisser sa ligne d'une carte de jour à l'autre.",
  // transport-on-map
  'help.guide.transport-on-map.title': 'Afficher un transport sur la carte',
  'help.guide.transport-on-map.goal': "Voir l'itinéraire réel d'un vol, d'un trajet en voiture ou d'une liaison.",
  'help.guide.transport-on-map.step.1':
    'Un transport dont les deux extrémités sont renseignées affiche une petite icône d’itinéraire sur sa ligne dans le programme du jour. Cliquez dessus ; son info-bulle devient « Masquer les itinéraires ».',
  'help.guide.transport-on-map.step.2':
    'L’itinéraire est tracé sur la carte, avec à chaque extrémité un marqueur en forme de pastille qui affiche l’icône du transport.',
  'help.guide.transport-on-map.step.3':
    'Cliquez sur un marqueur d’extrémité : la réservation s’ouvre par-dessus la carte. Son en-tête affiche le statut, le type, les jours et le « Code de réservation ». En dessous figurent les horaires avec les aéroports ou gares, la compagnie aérienne et le numéro de vol. Cliquez sur « Fermer » dans l’en-tête pour la fermer.',
  'help.guide.transport-on-map.step.4':
    "L'icône d'itinéraire dans la barre d'outils au-dessus des jours agit sur tout le voyage d'un coup : « Afficher tous les itinéraires », puis « Masquer tous les itinéraires » pour les masquer de nouveau.",
  'help.guide.transport-on-map.step.5':
    "Une liaison en transports en commun prévue n'a pas sa propre icône d'itinéraire. Elle est tracée avec le bouton « Itinéraire » du jour : « Masquer tous les itinéraires » ne la masque donc pas tant que l'itinéraire de ce jour est affiché.",
  'help.guide.transport-on-map.result':
    "Les itinéraires s'affichent sur la carte avec un marqueur à chaque extrémité, et y restent jusqu'à ce que vous les désactiviez.",
  'help.guide.transport-on-map.tip.1':
    "Un vol, une croisière et un ferry sont tracés en arc. Une voiture, un bus, un taxi et un vélo suivent les routes réelles. Un train ou une liaison prévue passe par les gares où il s'arrête.",
  'help.guide.transport-on-map.tip.2':
    'Une réservation confirmée est tracée en trait continu, une réservation en attente en pointillés. Le réglage « Étiquettes des itinéraires » affiche le code de l’aéroport ou le nom de la gare dans les marqueurs d’extrémité.',
  'help.guide.transport-on-map.tip.3':
    '« Afficher tous les itinéraires » ne s’ajoute pas aux itinéraires déjà affichés : il remplace les réglages faits avec les icônes individuelles. Après un clic, tous les itinéraires sont soit affichés, soit masqués.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importer des vols depuis AirTrail',
  'help.guide.airtrail-import.goal':
    "Importer d'un coup dans le voyage les vols déjà enregistrés dans AirTrail, puis les garder synchronisés avec AirTrail.",
  'help.guide.airtrail-import.step.1':
    "Quand l'extension AirTrail est activée et que votre instance est connectée sous « Intégrations » dans les Paramètres, la barre de l'onglet Transports affiche une icône d'avion, « Importer depuis AirTrail », avant « Transport ». Cliquez dessus.",
  'help.guide.airtrail-import.step.2':
    '« Importer depuis AirTrail » liste les vols de votre compte en deux groupes. « Pendant ce voyage » contient les vols datés pendant le voyage, déjà cochés. « Autres vols » contient le reste, non coché. Un vol déjà présent dans le voyage est grisé et marqué « Importé ».',
  'help.guide.airtrail-import.step.3':
    'Chaque ligne est une case à cocher avec la compagnie et le numéro de vol, les deux aéroports et la date. Cliquez sur une ligne pour inclure ou exclure le vol. Les vols sous « Autres vols » ne sont importés que si vous les cochez.',
  'help.guide.airtrail-import.step.4':
    'Les vols avec correspondance sont regroupés : chacun part, dans la journée, de l’aéroport où le précédent a atterri. La case en dessous, « Importer comme un seul vol avec escale dans cet aéroport », est déjà cochée. Laissez-la cochée pour une seule réservation avec escale, ou décochez-la pour importer les tronçons comme des vols distincts.',
  'help.guide.airtrail-import.step.5':
    'Cliquez sur le bouton en bas à droite, qui indique le nombre de vols cochés, par exemple « Importer 2 ». Le message qui suit indique combien de vols ont été importés.',
  'help.guide.airtrail-import.step.6':
    'Les vols apparaissent sous forme de cartes sous « Confirmé », chacune avec une pastille AirTrail bleue à côté du titre, et sous forme de lignes les jours concernés. Un vol avec correspondance forme une seule carte, et son itinéraire passe par l’escale.',
  'help.guide.airtrail-import.result':
    "Les vols d'AirTrail apparaissent en cartes dans l'onglet Transports et en lignes sur leurs jours, chacun avec la pastille AirTrail qui indique sa provenance.",
  'help.guide.airtrail-import.tip.1':
    "Un vol déjà présent dans le voyage avec le même numéro et la même date est ignoré, et un message indique combien de vols l'ont été. La flèche d'annulation dans la barre d'outils au-dessus des jours annule l'import entier.",
  'help.guide.airtrail-import.tip.2':
    "AirTrail reste la source principale des données. TREK récupère ses modifications à l'ouverture du voyage, puis toutes les quelques minutes en arrière-plan. Un vol supprimé dans AirTrail garde sa carte dans TREK, et son étiquette passe à « Non synchronisé ». Les modifications faites dans TREK ne sont renvoyées à AirTrail que si « Réécrire les modifications dans AirTrail » est activé sous « Intégrations ».",
  'help.guide.airtrail-import.tip.3':
    "Une correspondance regroupée ne correspond pas à un vol AirTrail unique synchronisable : il s'agit donc d'un import ponctuel. Elle garde la pastille bleue, qui vous l'indique au survol. Il en va de même pour un vol synchronisé auquel vous ajoutez manuellement une escale.",

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Road trip', // same-as-en
  'help.ctx.trip-roadtrip.summary':
    'Le programme présenté comme un seul trajet en voiture : les mêmes jours et les mêmes lieux, reliés en étapes avec la route entre elles, dans une frise de la colonne de gauche et sur la carte. Vous y voyez la distance et le temps de conduite, les endroits où faire le plein et ce qui se trouve le long de la route.',
  'help.ctx.trip-roadtrip.bullet.1':
    "« Jours » et « Road trip », en haut de la colonne de gauche, basculent entre le programme des jours et le trajet en voiture. Rien n'est copié ni modifié : « Jours » affiche le programme exactement tel qu'il était.",
  'help.ctx.trip-roadtrip.bullet.2':
    'Le haut de la frise affiche les totaux du voyage : « Distance », « Temps de conduite » et « Étapes ». En dessous, une carte pour chaque jour comportant un trajet : le numéro et la date du jour sur une tuile, puis des pastilles pour ses kilomètres et son temps de conduite, son nombre d’étapes, ce qu’il traverse, et un badge « Trace ». Un vol, un train ou un ferry réservé apparaît dans la suite sous forme de carte distincte.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Une étape numérotée est un lieu qui justifie la journée. Un arrêt en chemin, comme un plein, une recharge ou une aire de repos, affiche l’icône de son type au lieu d’un numéro et n’est pas compté. Cliquez sur un numéro pour changer de catégorie, sur le badge « Étape » pour définir la durée de l’arrêt, et faites glisser une étape pour la déplacer dans sa journée ou sur un autre jour.',
  'help.ctx.trip-roadtrip.bullet.4':
    "Entre deux étapes, un bandeau de conduite indique la distance et la durée du tronçon. Cliquez dessus pour « Itinéraires pour cette étape », ou cliquez sur l'itinéraire sur la carte pour faire passer le tronçon par un point de passage.",
  'help.ctx.trip-roadtrip.bullet.5':
    'La colonne de droite devient « Sur le trajet » : choisissez sur une même ligne ce que vous cherchez et le jour, puis la largeur du couloir, et cliquez sur « Rechercher ». Le plus sur un résultat, « Ajouter », l’ajoute au trajet à l’endroit où vous passez réellement, et l’icône de lit sur un hôtel ajoute une nuitée. « Manuel » ajoute un lieu que la recherche n’a pas trouvé, et les trois points à côté du titre importent un itinéraire Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    '« Réglages de conduite », en dessous, regroupe les limites, la voiture et son autonomie, les temps de conduite par jour, ce qu’il faut éviter, l’affichage du tracé et l’affichage ou non des alertes en cours sur la carte. Ces réglages appartiennent au voyage : tout le monde planifie avec la même voiture.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Voir le voyage comme un seul trajet',
  'help.guide.roadtrip-mode.goal': 'Passer le programme en mode road trip et comprendre ce qu’affiche la frise.',
  'help.guide.roadtrip-mode.step.1':
    'Cliquez sur « Road trip » dans le sélecteur « Jours » / « Road trip » en haut de la colonne de gauche. Le programme des jours est remplacé par le trajet, et la carte affiche chaque jour qui a un itinéraire.',
  'help.guide.roadtrip-mode.step.2':
    'La carte en haut de la frise totalise tout le voyage : « Distance », « Temps de conduite » et « Étapes ». Elle reste fixe pendant que vous faites défiler les jours.',
  'help.guide.roadtrip-mode.step.3':
    'En dessous, une carte pour chaque jour comportant un trajet en voiture ; un jour sans trajet n’apparaît pas. L’en-tête de la carte affiche le numéro du jour avec la date en dessous, puis des pastilles pour la distance et la durée du trajet et pour le nombre d’étapes de la journée.',
  'help.guide.roadtrip-mode.step.4':
    'Dans la carte, la journée se présente comme une suite : une étape numérotée pour chaque lieu, un tronçon de route entre chaque paire, et l’heure d’arrivée sur le bord droit. Un vol, un train ou un ferry réservé apparaît dans la suite sous forme de carte distincte.',
  'help.guide.roadtrip-mode.step.5':
    'Cliquez sur l’en-tête d’un jour pour le replier ; la flèche au bout pivote. Un jour replié est aussi masqué sur la carte. Cliquez de nouveau sur l’en-tête pour le réafficher.',
  'help.guide.roadtrip-mode.result':
    'La colonne de gauche affiche le trajet, et la carte montre chacune de ses journées. « Jours » permet de revenir directement au programme, inchangé.',
  'help.guide.roadtrip-mode.tip.1':
    "Ce choix est enregistré pour chaque voyage dans votre compte : après un rechargement, dans un autre navigateur ou sur un autre appareil, le voyage s'ouvre de nouveau en vue road trip.",
  'help.guide.roadtrip-mode.tip.2':
    "Le sélecteur n'apparaît qu'une fois qu'un administrateur a activé l'extension Road trip, sous « Extensions » dans le panneau d'administration.",
  'help.guide.roadtrip-mode.tip.3':
    "Sur téléphone, il n'y a pas de sélecteur : l'extension ajoute son propre onglet « Road trip » à côté de « Prévu ».",
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Les haltes en chemin et la durée de chaque arrêt',
  'help.guide.roadtrip-stops.goal':
    'Faire d’un lieu du trajet un arrêt en chemin, et définir la durée de chaque arrêt.',
  'help.guide.roadtrip-stops.step.1':
    'Cliquez sur le numéro devant une étape dans la frise. Son libellé est « En faire un arrêt en chemin », et il ouvre en dessous les types d’arrêt sous forme d’une rangée de pastilles colorées.',
  'help.guide.roadtrip-stops.step.2':
    'Choisissez un type. Survolez une pastille pour voir son nom : « Hébergement », « Carburant », « Recharge », « Aire de repos », « Camping », « Restauration » ou « Sites touristiques ». Le numéro est remplacé par l’icône de ce type, et les étapes suivantes sont renumérotées.',
  'help.guide.roadtrip-stops.step.3':
    "Une halte en chemin n'est pas une destination : l'en-tête du jour compte donc une étape de moins.",
  'help.guide.roadtrip-stops.step.4':
    "Cliquez de nouveau sur l'icône, « Changer le type d’arrêt », et choisissez « Redevenir une destination » pour que l'étape retrouve son numéro.",
  'help.guide.roadtrip-stops.step.5':
    'Chaque étape a un badge « Étape », qui affiche un plus tant que rien n’est prévu. Cliquez dessus pour ouvrir « Temps sur place ».',
  'help.guide.roadtrip-stops.step.6':
    "Réglez la durée avec le curseur, les boutons moins et plus ou l'un des préréglages. « Départ » change, tandis qu'« Arrivée » reste à l'heure d'arrivée du trajet. Cliquez ensuite sur « Enregistrer ».",
  'help.guide.roadtrip-stops.result':
    "Le badge « Étape » de l'arrêt modifié affiche la nouvelle durée, et toutes les heures d'arrivée suivantes sont décalées en conséquence. Un arrêt dont vous avez changé le type puis rétabli redevient une destination numérotée.",
  'help.guide.roadtrip-stops.tip.1':
    'La durée d’arrêt appartient au lieu, pas à une visite : un lieu prévu sur deux jours a la même durée d’arrêt les deux jours.',
  'help.guide.roadtrip-stops.tip.2':
    'Les arrêts en chemin apparaissent aussi sous « Jours ». Désactiver « Afficher aussi dans Jours », sous « Arrêts de service » dans les « Réglages de conduite », les réserve à la vue « Road trip ».',
  'help.guide.roadtrip-stops.tip.3': '« Aucune durée », dans la même boîte de dialogue, supprime la durée d’arrêt.',
  'help.guide.roadtrip-stops.tip.4':
    'Cliquez sur une halte en chemin ou sur une nuit réservée pour ouvrir sa fiche par-dessus la carte. Quand le road trip est activé, « Modifier » y ouvre la fenêtre compacte de la recherche au lieu du formulaire de lieu, et « Plus de détails » dans cette fenêtre ouvre le formulaire complet.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Trouver du carburant, de quoi manger et un hébergement sur le trajet',
  'help.guide.roadtrip-corridor.goal':
    'Chercher le long de la route que vous empruntez vraiment, et ajouter vos trouvailles au bon tronçon.',
  'help.guide.roadtrip-corridor.step.1':
    'Sous « Recherche de », ouvrez la liste et cochez ce dont vous avez besoin. Vous pouvez combiner « Carburant », « Recharge », « Aire de repos », « Camping », « Hébergement », « Restauration » et « Sites touristiques » : la liste reste ouverte pour un deuxième choix, et le champ affiche ensuite une icône par type.',
  'help.guide.roadtrip-corridor.step.2':
    'Choisissez le jour dans la liste déroulante au bout de la même ligne. Elle propose les jours qui ont une carte dans la frise, et « Rechercher » attend que l’itinéraire du jour choisi soit calculé.',
  'help.guide.roadtrip-corridor.step.3':
    'Sous « Dans un rayon de », choisissez jusqu’où chercher de chaque côté de la route, 2 km, 5 km ou 10 km, puis cliquez sur « Rechercher ».',
  'help.guide.roadtrip-corridor.step.4':
    'Les résultats sont regroupés par type, dans l’ordre où vous les croisez. Chacun indique sa distance par rapport à l’itinéraire et à quel point du trajet de la journée il se trouve.',
  'help.guide.roadtrip-corridor.step.5':
    'Cliquez sur « Ajouter », le plus sur un résultat. « Ajouter comme arrêt » indique à quel jour et à quelle position il sera ajouté, et demande le « Type d’arrêt » et le « Temps sur place » ; une borne de recharge affiche aussi « Disponibilité et tarifs ». « Ajouter » l’intègre au trajet, et « Plus de détails » ouvre plutôt le formulaire complet du lieu.',
  'help.guide.roadtrip-corridor.result':
    'L’arrêt ajouté apparaît sur le trajet à l’endroit où vous passez, avec l’icône de son type. L’itinéraire du jour est recalculé en passant par l’arrêt, ce qui vide la liste : relancez la recherche pour l’arrêt suivant.',
  'help.guide.roadtrip-corridor.tip.1':
    "Aucune recherche n'est lancée tant que vous n'appuyez pas sur « Rechercher » : chaque recherche envoie de nombreuses requêtes à un service partagé.",
  'help.guide.roadtrip-corridor.tip.2':
    "« Filtrer par nom » filtre les résultats sans nouvelle recherche, et « Effacer les résultats » vide la liste et retire ses repères. Cliquez sur un résultat pour l'afficher sur la carte.",
  'help.guide.roadtrip-corridor.tip.3':
    "Vous pouvez aussi faire glisser un résultat de la carte sur l'itinéraire. Vous choisissez ainsi vous-même le tronçon quand vous empruntez deux fois la même route. « Manuel », à côté de « Rechercher », ajoute un lieu que la recherche n'a pas trouvé, en le cherchant par son nom.",
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Faire passer un tronçon par un point de passage',
  'help.guide.roadtrip-via.goal': 'Faire passer un tronçon par la route de votre choix, sans y ajouter d’arrêt.',
  'help.guide.roadtrip-via.step.1':
    'Affichez sur la carte le tronçon voulu : cliquez sur une étape dans la frise, puis fermez la fiche qui s’ouvre par-dessus la carte.',
  'help.guide.roadtrip-via.step.2':
    'Cliquez sur l’itinéraire tracé. Un point de passage est ajouté sur le tronçon cliqué, et le tronçon est recalculé en passant par lui.',
  'help.guide.roadtrip-via.step.3':
    "La frise se met à jour : l'en-tête du jour affiche la nouvelle distance et le nouveau temps de conduite, et toutes les heures d'arrivée après le point de passage sont recalculées.",
  'help.guide.roadtrip-via.step.4':
    "Survolez la poignée pour voir à quoi elle sert : « Faites glisser pour modifier l'itinéraire, clic droit pour supprimer ». Faites-la glisser ailleurs, et le tronçon est recalculé en passant par le nouveau point.",
  'help.guide.roadtrip-via.step.5':
    "Faites un clic droit sur la poignée pour la supprimer. Le tronçon reprend l'itinéraire direct.",
  'help.guide.roadtrip-via.result':
    "Le tronçon suit la route choisie, et la distance, le temps de conduite et les heures d'arrivée de la journée sont recalculés.",
  'help.guide.roadtrip-via.tip.1':
    'Un point de passage n’est pas un arrêt : il n’a ni numéro, ni durée d’arrêt, ni heure d’arrivée, et il n’est pas compté parmi les arrêts du jour.',
  'help.guide.roadtrip-via.tip.2':
    'Les poignées ne s’affichent qu’à partir du niveau de zoom 9 : une carte qui montre tout le voyage affiche donc le tracé sans elles.',
  'help.guide.roadtrip-via.tip.3':
    'Un clic à plus de deux kilomètres de tout tronçon tracé est ignoré, tout comme un clic sur un vol, un train ou un ferry.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Essayer un autre itinéraire pour un tronçon',
  'help.guide.roadtrip-alternatives.goal':
    'Voir les autres itinéraires proposés par le calculateur pour une portion du trajet, et en choisir un.',
  'help.guide.roadtrip-alternatives.step.1':
    'Cliquez sur un bandeau de conduite dans la colonne, la ligne entre deux étapes qui indique la distance et la durée du tronçon. Son libellé est « Autres itinéraires ».',
  'help.guide.roadtrip-alternatives.step.2':
    "« Itinéraires pour cette étape » s'ouvre par-dessus la carte, avec une entrée par route et sa longueur. La carte trace chaque route avec son temps de conduite : votre route actuelle en bleu plein, les autres en bleu plus clair.",
  'help.guide.roadtrip-alternatives.step.3':
    'Survolez une entrée pour mettre cette route en évidence. « Actuel » est la route empruntée et « La plus rapide » la plus rapide ; les autres indiquent de combien elles sont plus lentes, ou quelle catégorie de route elles évitent.',
  'help.guide.roadtrip-alternatives.step.4':
    'Cliquez sur une entrée pour emprunter cette route, ou sur « Fermer » pour garder la route actuelle.',
  'help.guide.roadtrip-alternatives.result':
    'Le tronçon emprunte désormais la route choisie, et la distance dans la colonne latérale ainsi que les heures d’arrivée suivantes changent aussi.',
  'help.guide.roadtrip-alternatives.tip.1':
    "Quand vous choisissez une autre route, TREK la vérifie d'abord avec le calculateur d'itinéraire du road trip. Il maintient ensuite le tronçon sur cette route avec le moins de points de passage possible, en remplaçant ceux qui existaient déjà. Une route que le calculateur ne peut pas suivre n'est pas enregistrée. Choisir la route proposée par le calculateur supprime de nouveau les points de passage.",
  'help.guide.roadtrip-alternatives.tip.2':
    "« Sans autoroute », « Sans péage » et « Sans ferry » proviennent d'un second moteur, avec son propre modèle de vitesse : leurs durées ne sont donc pas comparables aux autres.",
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Définir la voiture et les limites de conduite',
  'help.guide.roadtrip-limits.goal':
    'Indiquer à TREK le véhicule que vous conduisez et la distance que vous voulez parcourir sans pause.',
  'help.guide.roadtrip-limits.step.1':
    '« Réglages de conduite » se trouve sous la recherche, dans la colonne de droite. Ses badges indiquent ce qui est réglé ; cliquez dessus pour l’ouvrir.',
  'help.guide.roadtrip-limits.step.2':
    'Sous « Conduite », « Plus long trajet d’affilée » et « Conduite par jour » s’expriment en minutes. Un champ vide signifie désactivé, et rien n’est signalé.',
  'help.guide.roadtrip-limits.step.3':
    'Sous « Véhicule », indiquez ce que vous conduisez. « Carburant » ne fait le plein qu’aux stations-service, « Électrique » qu’aux bornes de recharge, « Les deux » aux deux.',
  'help.guide.roadtrip-limits.step.4':
    'Saisissez vous-même « Autonomie par plein », ou « Autonomie par charge ». Vous pouvez aussi ouvrir « Calculer d’après la voiture », sous « Remplir jusqu’à » : il utilise « Réservoir » et « Consommation », ou « Batterie », « Consommation » et « Usure batterie », et calcule l’autonomie.',
  'help.guide.roadtrip-limits.step.5':
    '« Éviter si possible », dans la colonne de gauche, est une préférence et non une interdiction : si une journée n’a pas d’autre option, elle emprunte quand même la route et l’indique dans son en-tête.',
  'help.guide.roadtrip-limits.step.6':
    'Cliquez sur « Fermer ». Les badges de la carte indiquent ce qui est réglé, et la frise signale chaque tronçon et chaque journée qui dépasse une limite.',
  'help.guide.roadtrip-limits.result':
    'Les badges de la carte indiquent les limites définies, et chaque tronçon ou jour qui les dépasse porte un badge dans la frise.',
  'help.guide.roadtrip-limits.tip.1':
    'Ces réglages appartiennent au voyage : tous les participants planifient avec la même voiture et les mêmes limites.',
  'help.guide.roadtrip-limits.tip.2':
    '« Remplir jusqu’à » indique jusqu’à quel niveau un arrêt remplit le réservoir ou la batterie, car personne ne recharge à 100 % sur la route. Un arrêt carburant ou recharge peut avoir sa propre valeur grâce au badge de batterie de sa ligne.',
  'help.guide.roadtrip-limits.tip.3':
    "Sous « Ligne de l’itinéraire », « Relier les jours » calcule aussi le trajet entre la dernière étape d'un jour et la première du lendemain. « Commencer et finir chaque jour à votre hébergement » fait démarrer et terminer chaque journée à l'hébergement réservé pour ces nuits. « Une couleur par jour » affiche chaque jour dans sa propre couleur.",
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': "Définir le début et la fin d'une journée de route",
  'help.guide.roadtrip-day-window.goal':
    'Arrêter de conduire à l’heure de votre choix, et définir où se termine la journée.',
  'help.guide.roadtrip-day-window.step.1':
    'Ouvrez « Réglages de conduite » dans la colonne de droite et repérez « Horaires quotidiens », dans la colonne de gauche de la boîte de dialogue.',
  'help.guide.roadtrip-day-window.step.2':
    'Définissez un « Début de journée ». Seul, il n’a aucun effet : les deux horaires sont nécessaires, comme l’indique la remarque en dessous.',
  'help.guide.roadtrip-day-window.step.3':
    'Définissez une « Fin de journée ». Le trajet s’arrête désormais à cette heure et reprend le lendemain matin, avec une ligne « Fin de journée » et une ligne « Reprendre le trajet » dans la colonne latérale.',
  'help.guide.roadtrip-day-window.step.4':
    "Sous « Fin de journée », choisissez « Sur le trajet » pour faire une pause sur la route à l'heure de fin, ou « Au dernier lieu » pour vous arrêter avant que le trajet suivant ne dépasse cette heure.",
  'help.guide.roadtrip-day-window.step.5':
    'Cliquez sur « Fermer ». La carte « Réglages de conduite » affiche les deux horaires dans un badge.',
  'help.guide.roadtrip-day-window.result':
    'Le trajet est découpé en journées de route de la durée choisie, et ce qui ne tient pas se poursuit sur des jours calculés après le dernier. Vos jours et leurs lieux ne sont pas modifiés.',
  'help.guide.roadtrip-day-window.tip.1':
    "Si vous effacez l'une des deux heures, cette fonction est de nouveau désactivée. Les horaires que vous avez fixés vous-même sur une étape restent toujours prioritaires.",
  'help.guide.roadtrip-day-window.tip.2':
    "Quand des horaires quotidiens sont définis, les jours sont toujours reliés : le trajet entre la dernière étape d'un jour et la première du lendemain est calculé et pris en compte.",
  'help.guide.roadtrip-day-window.tip.3':
    'Chaque fin de journée apparaît aussi sur la carte sous forme de repère : une lune avec le numéro du jour. Faites-la glisser le long de l’itinéraire, ou sur un lieu, pour terminer la journée ailleurs. Faites un clic droit dessus pour rétablir la fin automatique. « Rétablir les fins de journée automatiques », dans cette boîte de dialogue, annule toutes ces modifications. Pour terminer une journée à une étape précise, cliquez sur l’étape et activez « Terminer la journée ici » dans sa carte.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Faire le plein avant la panne sèche',
  'help.guide.roadtrip-refuel.goal':
    'Trouver où faire le plein sur la portion d’itinéraire que la voiture peut encore atteindre, et l’ajouter au trajet.',
  'help.guide.roadtrip-refuel.step.1':
    'Si une autonomie est définie, la colonne latérale affiche une bande sur le tronçon où le carburant ou la batterie s’épuise : « Réservoir vide ici », ou « La batterie est vide ici » pour une voiture électrique. En dessous, vous voyez à quelle distance du début du tronçon cela se produit.',
  'help.guide.roadtrip-refuel.step.2':
    "L'icône de lampe sur le bandeau est le bouton : « Chercher du carburant », ou « Chercher une borne » pour une voiture électrique. La recherche porte sur la route avant ce point et affiche « Recherche le long du trajet… » pendant qu'elle s'exécute.",
  'help.guide.roadtrip-refuel.step.3':
    "Jusqu'à trois stations s'affichent, chacune avec sa distance par rapport à l'itinéraire et l'autonomie qu'il vous resterait.",
  'help.guide.roadtrip-refuel.step.4':
    "Le plus sur une proposition l'ajoute comme arrêt carburant. « Ajouter comme arrêt » s'ouvre avec le type et l'heure déjà remplis, et « Ajouter » la place sur le tronçon à l'endroit où l'itinéraire passe réellement.",
  'help.guide.roadtrip-refuel.result':
    "L'arrêt apparaît sur le bon tronçon avec sa propre icône, et l'autonomie est recalculée à partir de cet arrêt. Le bandeau se déplace jusqu'au point où le réservoir est désormais vide, ou disparaît si vous pouvez atteindre la fin du trajet sans autre arrêt.",
  'help.guide.roadtrip-refuel.tip.1':
    'L’autonomie se calcule depuis le dernier arrêt carburant ou recharge, d’un jour à l’autre. Votre type de véhicule détermine les arrêts pris en compte : « Carburant » uniquement les stations-service, « Électrique » uniquement les bornes de recharge.',
  'help.guide.roadtrip-refuel.tip.2':
    'La recherche examine la route avant le point où le réservoir est vide, garde une réserve et compte le détour deux fois : chaque lieu proposé est donc réellement accessible.',
  'help.guide.roadtrip-refuel.tip.3':
    'En l’absence de résultat, vous pouvez relancer la recherche : la lampe devient « Réessayer », car la recherche de lieux est un service partagé qui expire parfois.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Faire suivre une trace importée à un jour',
  'help.guide.roadtrip-track.goal':
    "Utiliser pour le trajet d'une journée une route panoramique importée sous forme de trace GPX ou KML.",
  'help.guide.roadtrip-track.step.1':
    "Cliquez sur le badge « Trace » dans l'en-tête d'un jour. La fenêtre s'ouvre sur ce jour.",
  'help.guide.roadtrip-track.step.2':
    "Choisissez une trace. Chacune indique sa longueur et si elle suit l'itinéraire de ce jour, ou à quelle distance elle se trouve. La trace la plus proche apparaît en premier.",
  'help.guide.roadtrip-track.step.3':
    'Cliquez sur « Suivre cette trace ». TREK ajoute des points de passage là où le trajet s’éloigne le plus de la trace, recalcule l’itinéraire, et répète l’opération plusieurs fois.',
  'help.guide.roadtrip-track.step.4':
    'La boîte de dialogue indique combien de points de passage ont été placés et à quelle distance le trajet reste maintenant de la trace, ou bien que le trajet suivait déjà la trace. « Retirer les points de passage », en bas à gauche, les supprime, et le calcul d’itinéraire replanifie la journée. Fermer la boîte de dialogue conserve la trace.',
  'help.guide.roadtrip-track.result':
    'Le trajet de la journée suit la trace au lieu de la route que le calcul d’itinéraire aurait choisie. Survolez son badge « Trace » pour voir le nom de la trace. Si des points de passage maintiennent le trajet sur la trace, le badge est aussi mis en évidence.',
  'help.guide.roadtrip-track.tip.1':
    'La boîte de dialogue liste les lieux du voyage qui ont un tracé : un GPX ou KML importé avec « Importer un fichier » dans la colonne des lieux sous « Jours », en cochant « Trajets » ou « Traces (avec géométrie) » pour un GPX, ou « Chemins (LineStrings) » pour un KML. « Importer un fichier » n’est proposé que si l’extension Sorties est désactivée ; si Sorties est activée, un GPX devient une sortie, que cette boîte de dialogue ne liste pas. Tant que le voyage n’a pas de trace, aucun jour n’affiche le badge.',
  'help.guide.roadtrip-track.tip.2':
    'Suivre une trace remplace les points de passage existants des tronçons du jour : modelez donc un tronçon à la main après avoir suivi la trace, pas avant.',
  'help.guide.dateless-trip.step.1': 'Cliquez sur « Nouveau voyage » et donnez un nom au voyage.',
  'help.guide.edit-trip.tip.2':
    'Les compagnons de voyage que vous ajoutez ou retirez ici sont pris en compte immédiatement, sans passer par « Mettre à jour ».',
  'help.guide.trip-reminder.result':
    'Vous recevez le rappel le nombre de jours choisi avant le départ, sur les canaux où vous recevez vos notifications.',
  'help.guide.upcoming-reservations.step.1':
    'Repérez « Prochaines réservations » dans la colonne de droite. Vous y trouvez les six prochaines réservations de tous vos voyages, de la plus proche à la plus lointaine, avec leur date, leur heure et leur type.',
  'help.guide.half-company-holiday.step.1': "Dans la barre d’outils, passez sur « Jour férié d'entreprise ».",
  'help.guide.edit-holiday-calendar.result': 'La grille et la légende se mettent à jour dès chaque modification.',
  'help.guide.person-color.result':
    'Tous les jours saisis par cette personne s’affichent désormais dans la nouvelle couleur.',
  'help.guide.answer-fusion-request.step.1':
    'Ouvrez Vacances après avoir reçu une invitation. La boîte de dialogue « Demande de fusion » s’ouvre automatiquement.',
  'help.guide.log-for-partner.step.1':
    'Dans la carte « Personnes », cliquez sur le nom de la personne. Une coche indique qu’elle est sélectionnée.',
  'help.guide.dissolve-fusion.step.1': 'Ouvrez « Paramètres ».',
  'help.guide.country-places.step.2': 'Cliquez sur le badge « Lieux » de la carte, celui avec l’épingle.',
  'help.guide.search-place.tip.2': 'Si la région est déjà marquée, la fenêtre vous propose plutôt de la retirer.',
  'help.guide.tour-activity-stats.step.4':
    'Les badges à droite indiquent sur quoi reposent les totaux : « Prévu » pour les sorties comptées d’après la planification de vos voyages, « Enregistré » pour celles qui ont une trace réelle liée. « À venir », « Sans jour » et « Aucune date » comptent les sorties qui ne sont pas encore prises en compte. Le i explique la règle.',
  'help.guide.move-to-list.step.2':
    'Cliquez sur « Dupliquer dans une liste » pour les garder aussi ici, ou sur « Déplacer vers une liste » pour les retirer de cette liste.',
  'help.guide.accept-list-invite.title': 'Accepter une invitation à une liste',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Sous « Points de passage », choisissez la tuile avec les points de passage pour ajouter le départ, les étapes et l’arrivée dans l’ordre, ou « Tracé seul » pour n’ajouter que la ligne enregistrée.',
  'help.guide.tour-collection-manage.step.1':
    'Ouvrez une liste. Chaque sortie enregistrée affiche sa difficulté, son type, le voyage d’où elle provient, sa distance, son dénivelé et son nombre de points de passage. Survolez le nom du voyage pour voir qui l’a enregistrée.',
  'help.guide.entry-draft.step.1': 'Dans l’éditeur, activez « Brouillon » dans la colonne de droite.',
  'help.guide.journey-map-layers.step.3':
    'Cliquez sur une épingle creuse ou un petit point de la carte. Une fiche indique de quoi il s’agit : un lieu prévu et son jour, ou un séjour avec « Ouvrir le récit », qui vous emmène au récit du jour correspondant.',
  'help.guide.journey-keep-route.step.3': 'Cliquez sur « Conserver l’itinéraire ».',
  'help.guide.journey-day-stays.step.3':
    'Cliquez sur « Je n’ai pas visité ce lieu » sur un séjour que vous ne voulez pas garder. Il disparaît de la liste.',
  'help.guide.journey-take-over-day.step.3':
    'Pour une seule entrée couvrant toute la journée, réglez « Entrées » sur « Récit du jour » : une seule entrée regroupe alors chaque séjour choisi avec ses horaires.',
  'help.guide.journey-auto-prepare.step.2':
    'Sous « Journées enregistrées », activez « Préparer automatiquement les jours enregistrés ».',
  'help.guide.photo-location.step.2': "Sous « Photos », activez « Placer les entrées d'après leurs photos ».",
  'help.guide.link-trip.tip.3':
    'Si vous écrivez une entrée pour un jour d’un voyage qui n’est pas encore lié, l’éditeur vous propose « Lier un voyage » directement dans l’entrée.',
  'help.ctx.settings-plugins.summary':
    'Vos réglages personnels pour les plugins installés par l’administrateur : les clés et préférences demandées par chaque plugin, et l’historique de ce que les plugins ont fait en votre nom. L’onglet n’apparaît que si un plugin est actif.',
  'help.ctx.settings-about.bullet.3':
    'Ko-fi, Buy Me a Coffee et Discord : c’est là que vous pouvez soutenir TREK ou échanger avec l’équipe qui le développe.',
  'help.guide.language-region.step.3':
    "Réglez la « Devise d'affichage », ou gardez « Devise du voyage » pour voir chaque voyage dans sa propre devise. Choisissez ensuite « Unité de température », « Unité de distance », « Format de l'heure » et le jour où commence la semaine.",
  'help.guide.travel-map-prefs.step.3':
    "« Explorer les lieux sur la carte » affiche la pastille de catégories pour trouver des lieux à proximité. « Masquer les codes de réservation » cache les numéros de confirmation jusqu’à ce que vous les survoliez ou les touchiez. « Optimiser l'itinéraire depuis l'hébergement » fait commencer et finir chaque journée à votre hôtel.",
  'help.guide.web-push-device.step.2':
    'Dans la carte « Notifications » en haut, la colonne Push détermine quels événements sont envoyés à vos appareils.',
  'help.guide.connect-airtrail.goal':
    'Permettre à TREK d’importer et de synchroniser les vols de votre propre AirTrail.',
  'help.guide.connect-dawarich.goal':
    'Permettre à TREK de savoir où vous êtes réellement allé, grâce à votre propre Dawarich.',
  'help.guide.tour-connect-wanderer.goal':
    'Permettre à TREK de lire les sentiers de votre propre wanderer pour les importer comme sorties.',
  'help.guide.tour-wanderer-watch.title': 'Être averti quand vos sentiers wanderer changent',
  'help.guide.plugin-settings.tip.2':
    'Un canal de plugin sous « Notifications » comporte un bouton « Configurer » qui ouvre cette page.',
  'help.guide.default-user-settings.result':
    'Les nouveaux comptes, ainsi que tous ceux qui n’ont jamais modifié ces réglages, voient vos choix.',
  'help.guide.own-routing-engine.goal':
    'Calculer les itinéraires des journées et des road trips avec votre propre serveur OSRM ou Valhalla plutôt qu’avec les serveurs publics.',
  'help.guide.admin-passkeys.tip.1':
    'Si TREK ne peut pas encore déterminer de domaine, un avertissement le signale, et les passkeys restent masquées tant que vous n’avez pas défini APP_URL ou le Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'En bas de l’onglet « Paramètres », sous « Zone de danger », cliquez sur « Renouveler » à côté de « Renouveler le secret JWT ».',
  'help.guide.storage-backends.tip.3':
    'TREK peut retélécharger les caches de photos : les dupliquer gaspille donc généralement de l’espace.',
  'help.guide.admin-channels.step.3':
    'Dans la carte « Notifications » en dessous, choisissez pour chaque événement les canaux qui l’envoient : « Nouvelle version disponible », « Échec de réplique de stockage » et « Région de pagaie demandée ». Chaque interrupteur est enregistré immédiatement.',
  'help.guide.notification-defaults.tip.1':
    '« Désactivé » est une valeur par défaut que chaque utilisateur peut encore activer ; « Bloqué » désactive l’événement pour tout le monde.',
  'help.ctx.notifications.bullet.4':
    'À côté de l’heure de chaque notification, « Marquer comme lu » (la double coche) et « Supprimer » (la corbeille) s’appliquent à cette notification. « Tout marquer comme lu » et « Tout supprimer », en haut, s’appliquent à toute la liste.',
  'help.guide.read-notifications.tip.2':
    'Une notification sans bouton sert uniquement à vous informer. Lisez-la dans le panneau et marquez-la comme lue au même endroit.',
  'help.guide.filter-notifications.result':
    'La liste n’affiche que les notifications non lues, des plus récentes aux plus anciennes.',
  'help.guide.delete-notifications.title': 'Supprimer des notifications',
  'help.guide.notification-settings.goal':
    'Choisir quels événements apparaissent sous l’icône de cloche et lesquels vous sont aussi envoyés par e-mail, webhook, ntfy ou push.',
  'help.guide.public-link.step.4': 'Cliquez sur « Créer un lien », puis sur « Copier », et envoyez-le.',
  'help.guide.link-journal.step.2':
    'Cliquez sur « Lier un journal » et choisissez l’un de vos journaux dans « Choisir un journal ».',
  'help.guide.dawarich-stays.title': 'Transformer un séjour enregistré en lieu',
  'help.guide.dawarich-stays.tip.2':
    'Si vous supprimez un lieu issu d’un séjour, le séjour revient dans la liste, en attente.',
  'help.guide.leave-stop-off-route.goal':
    'Garder une étape dans la journée sans que l’itinéraire y passe, pour un lieu que vous traversez à pied ou que vous voulez seulement voir sur la carte.',
  'help.guide.day-route.tip.4':
    'Pour une étape que vous voulez garder dans la journée mais pas sur l’itinéraire, choisissez « Retirer de l’itinéraire » dans son menu.',
  'help.guide.move-booking-day.step.2':
    'Faites glisser la ligne sur l’en-tête d’une autre carte de jour. Une réservation d’un jour passe entièrement sur ce jour. Pour une réservation sur plusieurs jours, la ligne « Départ » déplace le jour de début et la ligne « Arrivée » le jour de fin.',
  'help.guide.place-image-from-file.title': 'Utiliser une photo jointe comme image du lieu',
  'help.guide.place-image-from-file.tip.2':
    'Une photo épinglée à l’étape ou jointe à sa réservation est également proposée.',
  'help.guide.place-own-hours.step.5':
    "Cliquez sur « Mettre à jour ». La fiche affiche désormais vos horaires sous « Horaires d'ouverture », et « Ouvert » ou « Fermé » en haut s’appuie sur eux.",
  'help.guide.confirm-stay-booking.step.3':
    'Cliquez sur « En attente » en haut. Son info-bulle indique « Passer à Confirmé », et le point devient vert.',
  'help.guide.map-nearby-places.tip.4':
    'Une catégorie dont la recherche a échoué reçoit un point rouge, et « Rechercher dans cette zone » passe au rouge avec un symbole d’avertissement : cliquez dessus pour réessayer.',
  'help.guide.tour-map-lines.tip.1':
    'Quand vous repliez un jour dans la colonne des jours, ses sorties et ses étapes sont masquées sur la carte.',
  'help.guide.car-stops.step.3':
    'Saisissez un titre dans l’en-tête. Sous « Itinéraire », indiquez dans « De » où vous prenez la voiture et dans « À » où vous la rendez ; les lieux du voyage sont proposés avant même que vous tapiez. « Prise en charge » et « Heure prise en charge » indiquent quand vous la récupérez, « Restitution » et « Heure restitution » quand vous la rendez.',
  'help.guide.transport-details.step.1':
    'Dans l’onglet « Transports », cliquez sur une carte. Ses détails s’ouvrent par-dessus l’onglet, avec un en-tête de la même couleur que la carte. La ligne d’un transport dans le programme du jour ouvre les mêmes détails.',
  'help.guide.export-transports-csv.tip.2':
    'L’onglet « Réservations » a la même icône et génère son propre fichier, dont le nom se termine par bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'Sous « Grouper par », choisissez « Statut », « Jour », « Type » ou « Sans regroupement ». L’onglet se réorganise aussitôt en sections.',
  'help.guide.export-bookings-csv.result':
    'Votre navigateur télécharge un fichier nommé d’après le voyage et l’onglet, par exemple autumn-in-japan-bookings.csv, avec une ligne pour chaque réservation affichée dans l’onglet.',
  'help.guide.arrange-packing-list.result':
    'Les listes apparaissent dans l’ordre où vous les avez placées, et les articles sont triés de A à Z jusqu’à ce que vous désactiviez cette option. TREK conserve malgré tout votre propre ordre.',
  'help.guide.count-packed-pieces.step.2':
    'Un compteur apparaît devant la quantité : 0/5, avec un moins et un plus. Cliquez sur le plus pour chaque pièce que vous mettez dans le sac.',
  'help.guide.expense-receipts.step.4':
    'De retour dans le registre, la ligne affiche une pastille « Reçu » à côté de son nom, avec le nombre entre parenthèses s’il y en a plusieurs. Cliquez dessus pour ouvrir le reçu.',
  'help.guide.final-budget.tip.3':
    'Une personne qui a quitté le voyage garde une ligne dans « Soldes » et « Budget final » tant qu’elle doit encore de l’argent ou qu’on lui en doit.',
  'help.guide.files-sync-settings.step.2':
    'La barre de flux affiche TREK et votre stockage avec les documents de chacun, et deux voies entre les deux : « Vers le fournisseur » et « Depuis le fournisseur ». Cliquez sur « Vers le fournisseur » pour la désactiver. La voie est grisée et la ligne en dessous indique « Seulement en entrée ». Cliquez de nouveau pour la réactiver.',
  'help.guide.files-sync-settings.tip.4':
    'Seul le propriétaire du voyage ou un administrateur peut modifier ces réglages. Les autres membres voient la barre de flux avec une mention comme « Les documents circulent dans les deux sens », mais pas « Paramètres ».',
  'help.guide.manage-notes.step.2':
    '« Développer » affiche la note en entier : tout le texte, son « Site web » et ses « Fichiers ». Cliquez sur un fichier pour l’afficher en aperçu. « Modifier », en bas, ouvre directement l’éditeur ; la croix en haut à droite referme la note.',
  'help.guide.note-categories.goal':
    'Classer les notes du groupe dans des catégories nommées et colorées, et n’en afficher qu’une à la fois.',
  'help.guide.note-categories.tip.1':
    'La corbeille ne supprime qu’une catégorie qu’aucune note n’utilise. Une catégorie encore utilisée reste dans la liste jusqu’à ce que vous déplaciez ses notes vers une autre catégorie.',
  'help.guide.roadtrip-reorder.title': 'Réordonner une étape ou la déplacer sur un autre jour',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK ne vous demande rien pour une heure que vous avez fixée : la frise recalcule aussitôt la journée et signale toute étape qui ne peut plus être atteinte à temps.',
  'help.guide.roadtrip-overnight.step.3':
    'En haut de la boîte de dialogue, « Nuitée » ajoute une nuit sur place et « Pause » en fait un arrêt temporaire. Un hôtel s’ouvre sur « Nuitée », un camping sur « Pause ». Une nuitée ne demande que l’« Arrivée », que vous pouvez laisser vide.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Sur un arrêt carburant ou recharge dans la frise, cliquez sur le badge de batterie. Il indique le niveau atteint à cet arrêt : estompé tant qu’il reprend votre valeur « Remplir jusqu’à », plein dès qu’il a sa propre valeur.',
  'help.guide.roadtrip-bookings.step.1':
    'Réservez le trajet comme vol, train, ferry, croisière ou bus le jour concerné, avec un lieu de départ et d’arrivée. Le road trip l’intègre automatiquement : la route s’arrête au terminal de départ et reprend au point d’arrivée.',
  'help.guide.roadtrip-google-import.result':
    'Les étapes de l’itinéraire sont ajoutées après la dernière étape de ce jour, et le trajet dans la frise et sur la carte passe par elles.',
  'help.guide.roadtrip-hazards.step.3':
    'Les alertes s’affichent sur la carte sous forme de zones. Cliquez sur l’une d’elles pour savoir de quoi il s’agit, quel service l’a signalée et quand elle a été mise à jour pour la dernière fois.',
  'help.ctx.trip-tours.bullet.2':
    'En haut, « Importer un GPX ou KML » ajoute des fichiers en tant que sorties. Le bouton de filtre en dessous (« Tous » au départ, avec le nombre de sorties) affine la liste par statut, source, limite de calcul d’itinéraire et type.',
  'help.guide.tour-show-list.step.2':
    'Chaque ligne correspond à une sortie. La barre de couleur représente son tracé sur la carte, et la tuile ronde affiche la limite de calcul d’itinéraire (T1 à T6) d’une randonnée planifiée dans TREK, ou l’icône de son type. Les badges sous le nom indiquent ses jours, sa durée, sa distance et son dénivelé positif. Pour une sortie sur plusieurs jours, la lune accompagnée d’un chiffre indique le nombre d’étapes.',
  'help.guide.tour-add-to-day.title': 'Placer une sortie sur un jour',
  'help.guide.tour-add-to-day.tip.2':
    'Si le voyage se termine avant la dernière étape, l’option indique la dernière étape qui tient dans le voyage, et les étapes suivantes restent sans jour.',
  'help.guide.tour-day-times.step.3':
    'Cliquez sur « Mettre à jour ». La ligne affiche maintenant début → fin. Une heure de fin calculée apparaît plus claire, avec ≈ pour une estimation, ≥ tant qu’un séjour n’a pas encore d’heure, et +1 après minuit. Survolez-la pour voir comment elle a été calculée.',
  'help.guide.tour-remove-from-day.goal': 'Retirer une sortie du programme sans la supprimer.',
  'help.guide.tour-filter-list.goal':
    'Réduire une longue liste aux sorties qui vous intéressent : pas encore planifiées, issues d’un fichier, d’un seul type.',
  'help.guide.tour-filter-list.result':
    'Seules les sorties filtrées apparaissent dans la liste ; les autres restent dans le voyage.',
  'help.guide.tour-hide-on-map.result':
    'Seules les sorties voulues apparaissent sur la carte, et les sorties masquées restent dans la liste, estompées.',
  'help.guide.tour-import-plan-tab.result':
    'La trace devient une sortie du voyage : une ligne dans la liste avec un badge GPX, et un tracé sur la carte.',
  'help.guide.tour-detail-read.title': 'Ouvrir une sortie et lire sa fiche',
  'help.guide.tour-detail-read.step.7': 'Fermez la fiche avec le X en haut, ou appuyez sur Échap.',
  'help.guide.tour-rename-colour.goal':
    'Donner à une sortie un nom facile à reconnaître et une couleur de tracé bien visible sur la carte.',
  'help.guide.tour-take-along.title': 'Télécharger une sortie sur votre téléphone ou votre GPS',
  'help.guide.tour-take-along.tip.4':
    'Dans l’onglet « Sorties », le même téléchargement se trouve en haut de la colonne de gauche. Si la sortie comporte des modifications non enregistrées, le téléchargement vous demande d’abord de les enregistrer.',
  'help.guide.tour-copy-keep.tip.1':
    'Les deux sont des copies : les modifications ultérieures de la sortie ne changent ni la copie ni la version enregistrée dans la collection.',
  'help.guide.tour-packing-link.step.2':
    'Sous « Lier à », choisissez « Toute la liste de bagages » ou l’une de ses listes. Chaque ligne indique le nombre d’articles qu’elle contient.',
  'help.guide.tour-files.title': 'Joindre des fichiers à une sortie',
  'help.guide.tour-activity-link.title': 'Lier la trace réellement parcourue',
  'help.guide.tour-activity-link.tip.2':
    'Vous ne pouvez lier qu’une trace importée qui n’a pas servi à planifier une sortie, et chaque trace ne peut être liée qu’à une seule sortie.',
  'help.guide.tour-activity-compare.step.4':
    '« Changer », sous la trace, permet de choisir un autre enregistrement. « Délier » la retire de la sortie, et la trace reste dans le voyage en tant qu’import.',
  'help.guide.tour-origin-check.step.3':
    'Une sortie tracée dans l’onglet « Sorties » affiche « planifiée dans TREK », avec sa date de création sous « Créé le ».',
  'help.ctx.trip-tour-planner.bullet.2':
    'Le volet de gauche est l’éditeur. Quand rien n’est ouvert, il propose « Planifier une nouvelle sortie ». Une sortie ouverte affiche son nom, son type, ses points de passage, les cartes propres à son type et ses détails, avec « Ignorer » et « Enregistrer » en bas.',
  'help.guide.tour-open-workspace.step.2':
    'Le volet de gauche est l’éditeur. Quand aucune sortie n’est ouverte, il propose « Planifier une nouvelle sortie », qui démarre une sortie sur la carte.',
  'help.guide.tour-open-workspace.tip.3':
    'Si vous ouvrez une autre sortie alors que l’éditeur contient des modifications non enregistrées, TREK vous demande d’abord : « Abandonner les modifications », ou poursuivre l’édition.',
  'help.guide.tour-draw-route.step.5':
    'Cliquez sur les endroits suivants dans l’ordre de votre parcours. Chaque clic ajoute le point comme nouvelle arrivée et, dès deux points, TREK calcule l’itinéraire en suivant les chemins.',
  'help.guide.tour-type-profile.goal':
    'Choisir le type de sortie et, pour une sortie à vélo, son profil, afin que l’itinéraire emprunte les bonnes voies.',
  'help.guide.tour-edit-points.title': 'Déplacer, réordonner et supprimer des points',
  'help.guide.tour-edit-points.tip.1':
    'Le premier point porte le badge « Début » et le dernier le badge « Fin ». Placer un point tout en haut ou tout en bas en fait le départ ou l’arrivée.',
  'help.guide.tour-shaping-points.step.4':
    'Pour transformer une étape en point de guidage, ou l’inverse, ouvrez « Plus d’actions » sur sa ligne et choisissez « En faire un point de guidage » ou « En faire une étape ».',
  'help.guide.tour-loop-reverse.step.2':
    'La dernière ligne affiche maintenant « Retour au départ », et l’itinéraire sur la carte se termine à son point de départ.',
  'help.guide.tour-leg-by-hand.step.1':
    'Ouvrez « Plus d’actions » sur le point où commence le tronçon et choisissez « Tracer le tronçon suivant à la main ».',
  'help.guide.tour-trip-places.goal': 'Ajouter comme étape de la sortie un lieu déjà prévu dans le voyage.',
  'help.guide.tour-trip-places.result': 'La sortie compte une nouvelle étape pour ce lieu du voyage, sous le même nom.',
  'help.guide.tour-details-times.tip.2':
    'Pour une randonnée, « Détails » contient aussi « Difficulté maximale du sentier » et « Choix de l’itinéraire », présentés dans les guides de randonnée. Une balade urbaine n’a pas de « Pauses » : c’est le temps passé à ses étapes qui compte.',
  'help.guide.tour-save.step.4': 'La sortie figure maintenant dans « Sorties de ce voyage », sans jour pour l’instant.',
  'help.guide.tour-edit-saved.step.2':
    'Modifiez ce qu’il faut, comme pour une nouvelle sortie : déplacez ou ajoutez des points, changez de type ou modifiez les détails, ici la « Description ».',
  'help.guide.tour-summary-profile.goal':
    'Voir la longueur et la pente de la sortie, et où se situe chaque altitude sur le parcours.',
  'help.guide.tour-summary-profile.result':
    'Vous connaissez la longueur de la sortie, son dénivelé, sa durée et les endroits où ça grimpe.',
  'help.guide.tour-list-manage.tip.1':
    'Chaque sortie n’est comptée qu’une fois dans les totaux, même si elle s’étend sur plusieurs jours. Un total précédé de ≥ n’inclut pas certaines sorties. Survolez-le pour voir combien.',
  'help.guide.tour-delete.tip.1': 'Cette action est définitive, et « Annuler » ne restaure pas une sortie.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Si vous cliquez quand même sur « Enregistrer », la fenêtre « Modifiée entre-temps » s’ouvre à la place, et rien n’est écrasé.',
  'help.ctx.trip-tour-import.bullet.2':
    "« Aperçu de l'import » affiche sur une carte chaque trace des fichiers, avec sa distance, son dénivelé positif, son dénivelé négatif et ses points, avant tout enregistrement. Sous « Importer comme », vous indiquez de quoi il s’agit.",
  'help.guide.tour-import-gpx.step.3':
    "L’« Aperçu de l'import » s’ouvre, sans rien enregistrer pour l’instant. La carte affiche le parcours complet, et chaque trace des fichiers apparaît sur une ligne numérotée avec sa distance, son dénivelé positif, son dénivelé négatif et ses points. Une trace enregistrée indique aussi sa date et sa durée.",
  'help.guide.tour-import-gpx.result':
    'La sortie figure dans « Sorties de ce voyage », sans jour pour l’instant. Si vous n’en importez qu’une, elle s’ouvre directement sur la carte en tant que sortie GPX.',
  'help.guide.tour-view-import.tip.3': 'Un sentier wanderer s’ouvre de la même façon, en tant que sortie wanderer.',
  'help.guide.tour-plan-from-import.tip.1':
    '« Ignorer » supprime la suggestion. Rien n’est enregistré tant que vous n’avez pas sauvegardé.',
  'help.guide.tour-restore-recorded.step.2': 'Cliquez sur « Restaurer la trace enregistrée ».',
  'help.guide.tour-take-over.step.2': "Choisissez « Reprendre un itinéraire d'un autre voyage ».",
  'help.guide.tour-take-over.result':
    'Un message confirme la reprise, et la sortie s’ouvre dans l’éditeur, prête à être placée sur un jour.',
  'help.guide.tour-import-wanderer.tip.2':
    'L’import est une copie : les modifications ultérieures dans wanderer ne changent pas la sortie. « Vérifier la source », dans l’« Origine » de la sortie, vous indique si le sentier a changé.',
  'help.ctx.trip-tour-map.bullet.3':
    '« Rechercher un lieu ou une adresse », en haut de la carte, centre la carte sur une ville, un refuge ou un sommet sans rien ajouter à la sortie.',
  'help.guide.tour-map-layers.result':
    'La sortie s’affiche sur le fond de carte le mieux adapté, et la pastille indique lequel est actif.',
  'help.guide.tour-along-search.step.3':
    "Sous « À cette distance de l'itinéraire », choisissez jusqu’où chercher autour du tracé : 250 m, 500 m, 1 km ou 2 km.",
  'help.guide.tour-along-add-stop.goal':
    'Faire passer la sortie par un point de vue, un refuge ou une source repérés en chemin.',
  'help.guide.tour-along-add-stop.tip.3':
    'Un tronçon où vous ne pouvez pas ajouter d’étape (une via ferrata ou un portage ajouté comme tracé fixe, ou un tronçon tracé à la main) reste estompé dans la liste, avec la raison indiquée à côté.',
  'help.guide.tour-3d-terrain.result':
    'Vous avez vu la sortie sur le relief 3D, avec les passages raides en couleur, et la carte à plat est de retour pour la planification.',
  'help.guide.tour-3d-flyover.step.3':
    '« Pause » arrête le survol à l’endroit où il se trouve, et « Lancer le survol » le reprend à partir de là. « Recommencer » revient au début et relance le survol.',
  'help.guide.tour-map-overlays.step.1':
    'Ouvrez une sortie de ski dans l’onglet « Sorties ». Les pistes sont affichées d’emblée : leur interrupteur est la montagne enneigée dans la pastille en bas à gauche, « Pistes, pistes de fond et remontées ». Cliquez dessus pour les masquer sur la carte, puis de nouveau pour les afficher.',
  'help.ctx.trip-tour-stages.title': 'Sorties sur plusieurs jours',
  'help.guide.tour-multi-day.goal': 'Découper un itinéraire en étapes, une pour chaque jour de route.',
  'help.guide.tour-multi-day.tip.2':
    'Pour fusionner à nouveau deux étapes, choisissez « Retirer la fin d’étape » dans le menu de l’arrêt marqué d’une lune. Supprimer cet arrêt les fusionne aussi, et un message propose « Annuler ».',
  'help.guide.tour-stages-on-days.step.3':
    'Choisissez « Étapes à partir de ce jour » : l’étape 1 est placée sur ce jour et chaque étape suivante sur le jour d’après. « L’itinéraire complet sur ce jour » place au contraire tout l’itinéraire sur ce seul jour.',
  'help.guide.tour-stages-on-days.result':
    'Chaque étape est placée sur son jour du voyage, et l’étape que vous avez ouverte est dans l’éditeur.',
  'help.ctx.trip-tour-hike.bullet.6':
    '« Résumé de la sortie », à droite, indique la distance, le dénivelé, le temps de marche ou de course estimé, les pauses et le total prévu, avec le profil d’altitude en dessous. « Enregistrer », en bas de l’éditeur, sauvegarde la sortie.',
  'help.guide.tour-hike-plan.step.6': 'Cliquez sur « Enregistrer » en bas de la colonne de gauche.',
  'help.guide.tour-hike-trail-details.step.1':
    'Ouvrez la randonnée depuis « Sorties de ce voyage » et repérez « Détails du sentier » sous la carte « Points de passage ». Activez « Afficher le long de l’itinéraire ».',
  'help.guide.tour-hike-trail-details.tip.3':
    'Rien dans cette carte ne modifie la sortie, et elle nécessite une connexion. Une randonnée importée affiche la même carte dans sa vue, sans limite de calcul d’itinéraire.',
  'help.guide.tour-hike-round.result':
    'La randonnée suit la boucle choisie et revient à son point de départ. « Boucle reprise », en bas de la carte, propose « Annuler », et « Enregistrer » la conserve.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Les badges d’une ligne indiquent de combien elle est plus longue, plus haute ou plus lente que le chemin actuel. Cliquez sur celle que vous voulez.',
  'help.guide.tour-ferrata-add.step.1':
    'Avec une randonnée ouverte, cliquez sur « Via ferrata » dans la rangée de boutons en bas à gauche de la carte. Le badge compte les via ferrata visibles ; zoomez si on vous le demande.',
  'help.guide.tour-ferrata-add.tip.3':
    'Le passage en via ferrata est mis en évidence sur le profil d’altitude, pour que vous voyiez à quel moment de la journée vous l’atteignez.',
  'help.guide.tour-run-plan.step.5':
    'Donnez un nom à la course dans « Nom de la sortie » et cliquez sur « Enregistrer ».',
  'help.guide.tour-run-ways.step.1':
    'Ouvrez la course depuis « Sorties de ce voyage » et activez « Afficher le long de l’itinéraire » dans « Détails du sentier », sous la carte « Points de passage ».',
  'help.ctx.trip-tour-walk.bullet.1':
    'Le type de sortie « Balade urbaine / touristique » transforme une sortie en balade. Ses points sont des étapes avec un « Libellé », une durée d’arrêt et une importance. Une balade n’a ni limite de randonnée ni champ « Pauses » : ce sont les durées d’arrêt qui comptent.',
  'help.guide.tour-walk-plan.step.2':
    'Ajoutez les étapes : vérifiez que « Ajouter un point » est activé et cliquez sur la carte à chaque étape, ou cliquez sur « Lieux du voyage » pour reprendre un lieu déjà prévu dans le voyage.',
  'help.guide.tour-walk-plan.result':
    'La balade liste ses étapes avec leurs durées d’arrêt, et « Résumé de la sortie » en fait le total. Placez-la sur un jour pour savoir à quelle heure vous atteignez chaque étape.',
  'help.guide.tour-walk-sights.tip.1': 'Il devient une étape de la balade, pas un lieu du voyage.',
  'help.guide.tour-walk-day-times.step.3':
    'Rouvrez la balade dans l’onglet « Sorties ». En haut de « Points de passage », « Horaires pour » affiche le jour et son heure de départ. Pour une balade prévue sur plusieurs jours, cliquez dessus pour en choisir un autre.',
  'help.guide.tour-walk-google-import.goal':
    'Coller un itinéraire à pied partagé depuis Google Maps et en importer les étapes sous forme de balade.',
  'help.guide.tour-walk-google-import.result':
    'Une nouvelle balade urbaine s’ouvre dans l’éditeur avec les étapes de Google Maps, prête à être enregistrée.',
  'help.guide.tour-walk-check-off.tip.2':
    'La ligne de la balade dans le programme du jour affiche aussi le compteur, par exemple 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Avec le profil VTT, la même carte affiche les niveaux de difficulté des sentiers (mtb:scale) là où les contributeurs les ont renseignés. Un chemin sans niveau est inconnu, pas facile.',
  'help.guide.tour-bike-profile.step.6':
    'Saisissez un nom dans « Nom de la sortie », puis cliquez sur « Enregistrer » en bas du volet de gauche.',
  'help.guide.tour-bike-surfaces.goal':
    'Savoir quelle part de l’itinéraire est en asphalte, en gravier ou de revêtement inconnu, et quels types de voies il emprunte.',
  'help.guide.tour-bike-surfaces.tip.3':
    'La carte se base sur l’itinéraire tel que le calcul d’itinéraire l’a planifié et ne modifie rien à la sortie. Elle nécessite une connexion ; hors ligne, elle le signale, et l’itinéraire reste inchangé.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '« Pas de difficulté dans les données » signifie inconnu, pas facile. Un niveau ne dit pas si un sentier vous convient.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Chaque point sur lequel vous cliquez sur la carte est relié au précédent par les pistes, les remontées et les sentiers. Sous chaque point, son tronçon s’affiche en pastilles, les pistes dans la couleur de leur niveau, avec leur durée en minutes. Un tronçon impossible à calculer passe au rouge, indique pourquoi et propose une solution ou « Tracer en ligne droite ».',
  'help.guide.tour-ski-plan.step.4':
    'Vérifiez que « Ajouter un point » est activé, puis cliquez sur la carte à votre point de départ et à chaque endroit que vous voulez rejoindre, dans l’ordre. Le calcul d’itinéraire sur pistes relie chaque point au précédent par les pistes, les remontées et les sentiers.',
  'help.guide.tour-ski-options.title': 'Indiquer au calcul d’itinéraire votre façon de skier',
  'help.guide.tour-ski-options.tip.2':
    '« Prendre les remontées » est activé par défaut pour l’alpin et le snowboard, et désactivé pour les autres disciplines. « Exclure » et « Redescendre en remontée si besoin » ne s’affichent que si les remontées sont utilisées.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Vous pouvez aussi faire glisser le point sur la carte plus près d’une piste, d’un sentier ou d’une remontée. Le tronçon est recalculé dès que vous le relâchez.',
  'help.guide.tour-ski-summary.step.2':
    '« Ski », « En remontée », « Attente » et « À pied » indiquent le temps passé pour chacun. « Pistes », « Descente sur pistes » et « Montées en remontée » indiquent la longueur des pistes, le dénivelé que vous y descendez et le nombre de remontées empruntées.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Voir les pistes, les pistes de fond et les remontées autour de votre sortie de ski, et ce que signifient leurs couleurs.',
  'help.guide.tour-ski-import.title': 'Importer une trace de ski et préciser son type',
  'help.guide.tour-ski-import.tip.1':
    'Une trace importée est conservée telle qu’elle a été enregistrée : TREK ne la cale pas sur les pistes, et sa fiche affiche « Temps de ski » comme « Non calculé ».',
  'help.ctx.trip-tour-paddle.bullet.3':
    '« Plus d’actions » sur un point regroupe les outils de pagaie : calculer le tronçon suivant sur l’eau ou le tracer à la main, « Porter l’embarcation à partir d’ici » et « Écluse à cet endroit ».',
  'help.guide.tour-paddle-setup.step.3':
    'Sous « Bateau », choisissez « Kayak », « Canoë », « SUP » ou « Autre ». Le bateau détermine la vitesse proposée par TREK.',
  'help.guide.tour-paddle-setup.tip.4':
    '« La pagaie comporte des risques », la ligne en bas de la colonne, ouvre « Sécurité sur l’eau ». Lisez-la une fois avant votre première sortie.',
  'help.guide.tour-paddle-water-route.step.5':
    'Pour calculer d’un coup tous les tronçons tracés à la main, cliquez sur « Planifier sur l’eau les tronçons tracés à la main », les vagues dans l’en-tête de « Points de passage ».',
  'help.guide.tour-paddle-portage.step.1':
    'Survolez l’étape où vous sortez de l’eau et cliquez sur « Plus d’actions », les trois points.',
  'help.guide.tour-paddle-portage.result':
    'Le tronçon apparaît comme un portage sur la carte et dans les points de passage, et l’« Estimation du temps » le compte comme du portage.',
  'help.guide.tour-paddle-lock.tip.2':
    'Si un portage contourne l’écluse, celle-ci est estompée et marquée « Contournée ». C’est alors le temps de portage qui compte, et les minutes de l’écluse ne sont pas incluses.',
  'help.guide.tour-paddle-time.step.4':
    'Si la sortie comporte un portage, la ligne « Portage » en tient compte. Cliquez sur sa vitesse et saisissez la vitesse à laquelle vous portez le bateau. « Débarquer et rembarquer » ajoute les minutes nécessaires à chaque portage.',
  'help.guide.tour-paddle-wind.step.1':
    'Placez la sortie en pagaie sur un jour du voyage. La carte « Vent » de la colonne de gauche affiche alors les prévisions de ce jour au point de départ.',
  'help.guide.tour-paddle-wind.result':
    'Vous connaissez le vent du jour à votre point de mise à l’eau, heure par heure.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Pour chaque obstacle, choisissez ce que vous ferez : « Franchir », « Faire un portage », « Contourner » ou « Non concerné ». « Suivant » vous mène à l’entrée suivante encore ouverte.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Dans l’onglet « Sorties », cliquez sur « Ajouter une sortie » dans la colonne de droite, choisissez « Importer un GPX ou KML » et sélectionnez le fichier.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '« Ignorer » supprime les repères non enregistrés. La trace enregistrée elle-même n’est jamais retracée.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK ne calcule pas de temps à cheval. Saisissez une durée sous « Prévu » dans « Détails » si vous voulez en afficher une dans la journée.',
  'help.guide.tour-horse-plan.step.5':
    'Choisissez un tronçon sous « Sections ». Vérifiez le « Sens » dans lequel vous le parcourez et ce qu’indique « Accès à cheval » sur son tracé.',
  'help.guide.tour-horse-plan.tip.5':
    'Une sortie à cheval n’utilise aucun calcul d’itinéraire : cliquer sur le tracé n’ajoute pas de point de guidage, et les points aux extrémités d’un tronçon restent là où l’itinéraire les place.',
  'help.guide.tour-horse-gap.tip.1':
    'Aucun calcul d’itinéraire ni aucun itinéraire équestre n’a vérifié un tronçon manuel. Regardez la carte pour voir par où il passe réellement.',
  'help.guide.tour-horse-recorded.step.4':
    'La sortie s’ouvre dans la colonne de gauche. La carte « Sortie enregistrée » affiche « Tel qu’enregistré », « Pas de temps à cheval » et « Accès non vérifié ». Survolez un badge pour en connaître la raison.',
  'help.guide.dateless-trip.step.2':
    'Laissez « Date de début » et « Date de fin » vides. Un champ « Nombre de jours » apparaît en dessous : indiquez le nombre de jours à planifier.',
  'help.guide.trip-reminder.tip.1':
    'Seul le propriétaire du voyage (ou un administrateur) voit le bloc « Rappel ». S’il est grisé, un administrateur doit d’abord activer les rappels de voyage, dans Admin, Notifications.',
  'help.guide.upcoming-reservations.step.2': 'Cliquez sur une réservation pour ouvrir le voyage correspondant.',
  'help.guide.timezones-widget.tip.1':
    'La liste utilise les noms officiels des fuseaux horaires, comme Europe/Lisbon ou America/New_York : cherchez donc la ville qui figure dans le nom.',
  'help.guide.half-company-holiday.step.2': 'Activez « Demi-journée » dans la même barre d’outils.',
  'help.guide.edit-holiday-calendar.tip.1':
    'Chaque modification est enregistrée immédiatement. Il n’y a pas de bouton « Enregistrer ».',
  'help.guide.person-color.tip.1':
    'La même couleur désigne la personne dans la barre d’outils et dans la carte « Droits ».',
  'help.guide.answer-fusion-request.step.2':
    'Lisez ce qu’implique la fusion : un calendrier commun, des entrées que vous pouvez modifier l’un pour l’autre et des réglages de congés partagés.',
  'help.guide.log-for-partner.step.2':
    'Regardez la barre d’outils : son premier bouton affiche maintenant le nom et la couleur de cette personne.',
  'help.guide.dissolve-fusion.step.2': 'Sous « Séparer les calendriers », en bas, cliquez sur « Dissoudre ».',
  'help.guide.country-places.step.3':
    'La boîte de dialogue liste tous les lieux comptés pour le pays, regroupés par voyage ; au-delà de six, « Rechercher des lieux », en haut, permet d’affiner la liste. Cliquez sur un lieu ou sur le titre d’un voyage pour ouvrir ce voyage dans le planificateur.',
  'help.guide.tour-activity-stats.step.5':
    'Cliquez sur « Voir les sorties ». « Mes sorties réalisées » s’ouvre avec les totaux, la répartition « Par type » et chaque sortie de la période avec son jour, son voyage, sa distance et son dénivelé. Les pastilles de son en-tête permettent aussi d’y changer la période et le type.',
  'help.guide.move-to-list.step.3':
    'Choisissez la liste de destination. Au-delà de trois listes, un champ de recherche en haut permet de les filtrer.',
  'help.guide.accept-list-invite.goal':
    'Rejoindre une liste que quelqu’un a partagée avec vous, ou décliner l’invitation.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Modifiez « Nom dans le voyage » si vous le souhaitez, puis cliquez sur « Ajouter à un voyage ».',
  'help.guide.tour-collection-manage.step.2':
    'Tapez dans « Rechercher des lieux ». La recherche filtre les sorties par nom en même temps que les lieux.',
  'help.guide.create-journey.tip.3':
    'Quand un voyage vient de se terminer, « Créer un journal » dans la bannière « Voyage terminé récemment », en haut, crée un journal avec ce voyage déjà sélectionné.',
  'help.guide.entry-draft.step.2': 'Cliquez sur « Enregistrer ». La carte affiche maintenant un badge « Brouillon ».',
  'help.guide.gallery-map.step.3':
    'De retour dans « Chronologie », la carte de droite suit votre défilement : l’entrée visible est entourée d’un anneau dans la couleur de son jour. Cliquez sur une épingle pour faire défiler la chronologie jusqu’à son entrée.',
  'help.guide.journey-map-layers.tip.1':
    'Une ligne de couleur en pointillés est l’itinéraire GPX d’un voyage, qui fait partie du programme ; une ligne continue est un itinéraire enregistré ce jour-là.',
  'help.guide.journey-keep-route.tip.1':
    'Là où l’enregistrement s’interrompt, la ligne s’interrompt aussi. TREK ne trace que ce qui a été enregistré.',
  'help.guide.journey-day-stays.tip.1':
    'Cette ligne n’apparaît que pour les personnes autorisées à modifier le journal et dont le propre Dawarich est connecté, et uniquement les jours où il reste quelque chose à trancher.',
  'help.guide.journey-take-over-day.step.4':
    'Laissez « Garder aussi le trajet du jour » activé pour conserver également le trajet, puis cliquez sur le bouton « Reprendre ». Il indique combien de brouillons seront créés.',
  'help.guide.journey-auto-prepare.step.3':
    'La ligne en dessous indique quand vos séjours ont été récupérés pour la dernière fois, ou pourquoi la récupération a échoué. Cliquez sur « Récupérer maintenant » pour interroger Dawarich tout de suite.',
  'help.guide.photo-location.tip.1': 'Les lieux que vous avez définis vous-même ne sont jamais déplacés.',
  'help.ctx.settings-plugins.bullet.1':
    '« Paramètres des modules » : en dessous, une carte pour chaque plugin qui a besoin d’informations de votre part, avec ses champs et « Enregistrer ». Un champ secret n’est plus jamais affiché une fois enregistré.',
  'help.guide.dashboard-widgets.step.3':
    '« Réinitialiser par défaut », sous les cartes, rétablit les réglages d’origine de tout l’onglet « Apparence ».',
  'help.guide.web-push-device.result':
    'La carte affiche « Activé sur cet appareil », et les événements activés dans la colonne Push vous parviennent même quand TREK est fermé.',
  'help.guide.connect-airtrail.step.1':
    "Sous « Intégrations », repérez AirTrail et saisissez son « URL de l'instance » et une clé API. Vous créez la clé dans AirTrail, sous Paramètres, Sécurité.",
  'help.guide.connect-dawarich.step.1':
    'Sous « Intégrations », repérez Dawarich et saisissez son « Adresse de l’instance » et la clé API que vous trouvez dans Dawarich sous Compte, Clé API.',
  'help.guide.tour-connect-wanderer.step.1':
    "Sous « Intégrations », repérez wanderer et saisissez son « URL de l'instance » et un jeton API. Vous créez le jeton dans wanderer sous Paramètres, Compte, Jetons API ; il commence par wanderer_key_.",
  'help.guide.tour-wanderer-watch.goal':
    'Laisser TREK surveiller en arrière-plan les modifications des sentiers que vous avez importés.',
  'help.guide.mcp-oauth.tip.3':
    'Les tokens API fonctionnent toujours, mais sont marqués « Obsolète » : passez à un client OAuth.',
  'help.guide.offline-conflicts.tip.2': 'Ce choix ne concerne que cet appareil.',
  'help.guide.default-user-settings.tip.1':
    'Le choix personnel d’un utilisateur dans « Paramètres » est toujours prioritaire ; ces valeurs s’appliquent à tous ceux qui n’ont pas modifié ce réglage.',
  'help.guide.own-routing-engine.step.1':
    'Sous « Carte », dans « Valeurs par défaut », saisissez l’adresse de votre serveur OSRM sous « Moteur de calcul d’itinéraire propre ».',
  'help.guide.admin-passkeys.tip.2':
    'Si vous changez de domaine par la suite, toutes les passkeys déjà ajoutées par les utilisateurs cessent de fonctionner.',
  'help.guide.instance-keys.tip.4': 'La clé Amap doit être une clé Web 服务 (service web), et non une clé JS API.',
  'help.guide.rotate-jwt-secret.step.2': 'Lisez l’avertissement et cliquez sur « Renouveler et se déconnecter ».',
  'help.guide.notification-defaults.tip.2':
    'Une valeur par défaut ne s’applique qu’aux personnes qui n’ont pas modifié cette case elles-mêmes.',
  'help.ctx.notifications.bullet.5':
    'Dans « Paramètres », sous « Notifications », vous choisissez quels événements vous recevez ici et lesquels vous recevez par e-mail, webhook, ntfy ou push.',
  'help.guide.read-notifications.result':
    'Vous êtes sur l’écran concerné par la notification, et le chiffre sur la cloche diminue d’une unité.',
  'help.guide.mark-notifications-read.title': 'Marquer des notifications comme lues',
  'help.guide.delete-notifications.goal': 'Garder une liste courte en supprimant ce dont vous n’avez plus besoin.',
  'help.guide.notification-settings.step.1': 'Cliquez sur votre nom en haut à droite.',
  'help.guide.public-link.step.5':
    'Vous pouvez modifier ces choix tant que le lien existe. « Supprimer le lien » désactive le lien.',
  'help.guide.link-journal.step.3':
    'Pour chaque participant du voyage, choisissez « Aucun accès », « Lire » ou « Modifier ». « Tous en lecture » et « Personne » règlent tout le monde d’un coup.',
  'help.guide.collapse-columns.tip.3':
    'Quand le séparateur a le focus, vous pouvez aussi le déplacer avec les flèches du clavier.',
  'help.guide.edit-place.tip.3':
    'Si vous cliquez en dehors de la boîte de dialogue, vos modifications ne sont pas perdues : TREK demande d’abord « Abandonner vos modifications ? », et « Continuer la modification » vous ramène au formulaire.',
  'help.guide.dawarich-stays.goal':
    'Ajouter les lieux où Dawarich a enregistré vos séjours pendant le voyage, après les avoir vérifiés un par un.',
  'help.guide.leave-stop-off-route.step.1':
    'Faites un clic droit sur l’étape, ou cliquez sur ses trois points, et choisissez « Retirer de l’itinéraire ».',
  'help.guide.move-booking-day.step.3':
    'La ligne apparaît maintenant sur le nouveau jour, à son heure. Ouvrez la réservation si vous devez aussi changer l’heure.',
  'help.guide.place-image-from-file.goal':
    'Utiliser comme image du lieu une photo qui figure déjà dans ses fichiers, sans la réimporter.',
  'help.guide.place-image-from-file.tip.3':
    'Seuls les voyageurs autorisés à modifier les lieux peuvent changer l’image.',
  'help.guide.place-own-hours.result':
    'La fiche affiche votre numéro de téléphone, votre e-mail et vos horaires d’ouverture, et l’anneau autour de l’image est vert ou rouge selon vos horaires.',
  'help.guide.confirm-stay-booking.step.4':
    'Fermez la réservation avec le X en haut à droite. Sous « Réservation », la carte du séjour affiche maintenant « Confirmé ».',
  'help.guide.tour-map-lines.title': 'Retrouver vos sorties sur la carte',
  'help.guide.tour-map-lines.tip.2':
    'Masquer une sortie ne concerne que vous et n’est mémorisé que dans ce navigateur, pour ce voyage : la sortie, ses jours et sa couleur restent identiques pour tout le monde. « Tout afficher », au-dessus de la liste « Sorties », réaffiche toutes les sorties masquées, et la carte sur téléphone affiche toujours toutes les sorties.',
  'help.guide.car-stops.step.4':
    'Sous « Étapes en chemin », cliquez sur « Ajouter une escale » pour chaque lieu traversé par le trajet et choisissez-le, avec une heure à côté si vous le souhaitez. Une étape sans lieu choisi est supprimée à l’enregistrement.',
  'help.guide.transport-details.step.2':
    'Les pastilles de l’en-tête affichent le statut, le type, le jour et le « Code de réservation ». Cliquez sur la pastille de statut pour passer de « En attente » à « Confirmé », ou l’inverse. La petite icône de copie dans la pastille du code, « Copier le code de réservation », copie le code dans votre presse-papiers.',
  'help.guide.group-sort-bookings.step.3':
    "Sous « Trier par », choisissez « Date », « Titre », « Type » ou « Statut ». La rangée en dessous inverse l’ordre : « Plus tôt d'abord » ou « Plus tard d'abord » pour les dates, « A à Z » ou « De Z à A » pour le reste.",
  'help.guide.booking-on-map.title': 'Retrouver une réservation sur la carte',
  'help.guide.export-bookings-csv.tip.1':
    'Les colonnes sont Type, Title, Status, Start, End, From, To, Location, Confirmation et Notes.',
  'help.guide.arrange-packing-list.tip.1':
    'Quand « A à Z » est activé, vous ne pouvez pas déplacer les articles, mais vous pouvez toujours déplacer des listes entières.',
  'help.guide.count-packed-pieces.step.3':
    'Tant qu’une partie seulement des pièces est emballée, le compteur prend votre couleur d’accent et la case à cocher est entourée de cette couleur. Cliquez sur le moins pour retirer une pièce du compte.',
  'help.guide.expense-receipts.step.5':
    'L’aperçu affiche le reçu, avec « Ouvrir dans un nouvel onglet » et « Télécharger » en haut. S’il y a plusieurs reçus, les flèches du clavier permettent de passer de l’un à l’autre, et Échap ferme l’aperçu.',
  'help.guide.files-sync-settings.step.3':
    'Cliquez sur « Paramètres » sous la barre de flux pour afficher les autres options.',
  'help.guide.manage-notes.step.3':
    '« Épingler », dans le même menu, garde la note en haut du panneau, avec un cadre dans la couleur de sa catégorie et une épingle à côté du titre. « Désépingler », dans le même menu, remet la note à sa place habituelle.',
  'help.guide.note-categories.step.1':
    'Cliquez sur l’engrenage à côté de « Nouvelle note » dans l’en-tête de la carte « Notes ». « Gérer les catégories » s’ouvre, avec une ligne par catégorie : sa couleur, son nom, six pastilles de couleur et une corbeille.',
  'help.guide.note-categories.tip.2':
    'Une catégorie sans note n’est conservée que dans votre navigateur. Les autres membres la voient dès qu’une note y est classée.',
  'help.guide.roadtrip-reorder.goal':
    'Modifier l’ordre du trajet, ou déplacer une étape sur un autre jour, directement dans la frise.',
  'help.guide.roadtrip-overnight.step.4':
    '« Trouver un hébergement », juste à côté, affiche le nom à copier et des liens vers des sites de réservation : trivago ou CHECK24 pour un hôtel, PiNCAMP ou Pitchup pour un camping. Vérifiez le lieu, les dates et le nombre de personnes sur le site.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Sous « Remplit à », choisissez une valeur de 50 à 100. La ligne sous les boutons indique la distance que vous pouvez parcourir depuis cet arrêt avec ce niveau.',
  'help.guide.roadtrip-bookings.step.2':
    'Dans la frise, le trajet est une carte à la couleur de son type, avec les horaires dans la colonne d’arrivée et ses points de départ et d’arrivée sous le titre.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK calcule son propre itinéraire entre les étapes ; il ne reprend pas le tracé routier de Google.',
  'help.guide.roadtrip-hazards.result':
    'La carte affiche les alertes en cours autour de votre voyage, sans modifier l’itinéraire.',
  'help.ctx.trip-tours.bullet.3':
    'Chaque ligne : la barre de couleur est le tracé de la sortie sur la carte, la tuile ronde indique la limite de calcul d’itinéraire (T1 à T6) ou le type, un petit badge GPX ou wanderer signale un import, et les badges donnent les jours, la durée, la distance et le dénivelé positif. Une lune avec un chiffre indique le nombre d’étapes d’une sortie sur plusieurs jours.',
  'help.guide.tour-show-list.step.3': 'Cliquez sur une ligne. La fiche de la sortie s’ouvre par-dessus la carte.',
  'help.guide.tour-add-to-day.goal':
    'Planifier le jour d’une sortie, pour qu’elle apparaisse dans la journée avec son tracé sur la carte.',
  'help.guide.tour-add-to-day.tip.3':
    'Vous ne pouvez ajouter une sortie qu’une seule fois à un même jour. Si vous la déposez sur un jour qui la contient déjà, TREK affiche simplement « Cette sortie est déjà sur ce jour ».',
  'help.guide.tour-day-times.step.4':
    'Si la sortie se termine après le début de l’élément suivant de la journée, une remarque sous la ligne vous le signale, par exemple « Se termine à 13:30, après le début de Déjeuner à Gostner Schwaige à 12:30 ». Rien n’est déplacé.',
  'help.guide.tour-remove-from-day.step.1':
    "Dans la colonne des jours, survolez la ligne de la sortie, cliquez sur « Plus d'options » et choisissez « Retirer du jour ».",
  'help.guide.tour-filter-list.step.1':
    'Cliquez sur le bouton de filtre sous « Importer un GPX ou KML ». Il affiche le statut filtré, « Tous » au départ, avec le nombre de sorties à côté.',
  'help.guide.tour-hide-on-map.title': 'Masquer le tracé d’une sortie sur la carte',
  'help.guide.tour-import-plan-tab.title': 'Importer une trace depuis l’onglet « Prévu »',
  'help.ctx.trip-tour-detail.title': 'Détails de la sortie',
  'help.guide.tour-detail-read.goal':
    'Voir toutes les informations du voyage sur une sortie : ses jours, sa distance et ses altitudes, son profil et sa source.',
  'help.guide.tour-detail-read.tip.1':
    'Une pastille orange « à utiliser avec prudence » signifie que l’import contient des altitudes ou des mesures incomplètes. Tenez-en compte en lisant son dénivelé et son profil.',
  'help.guide.tour-rename-colour.step.1':
    'Ouvrez la fiche de la sortie et cliquez sur le crayon à côté de son nom. Le nom devient modifiable.',
  'help.guide.tour-take-along.goal':
    'Obtenir l’itinéraire jusqu’au départ d’une sortie, ouvrir sa page web ou télécharger son tracé au format GPX.',
  'help.guide.tour-take-along.result':
    'Vous avez le chemin jusqu’au départ dans votre application de cartographie et l’itinéraire complet en fichier GPX.',
  'help.guide.tour-copy-keep.tip.2':
    '« Enregistrer dans une collection », dans le menu d’une sortie du programme du jour, ouvre la même boîte de dialogue : l’itinéraire y est donc enregistré aussi.',
  'help.guide.tour-packing-link.step.3': 'Cliquez sur « Lier ».',
  'help.guide.tour-files.goal':
    'Ajouter à la sortie une réservation, une carte ou une description de l’itinéraire, et la rouvrir depuis la fiche de la sortie.',
  'help.guide.tour-activity-link.goal':
    'Lier une trace GPX enregistrée à une sortie planifiée sans modifier le programme.',
  'help.guide.tour-activity-link.tip.3':
    '« Temps mis » couvre la période du premier au dernier horodatage de la trace, pauses comprises.',
  'help.guide.tour-activity-compare.tip.1':
    '« Comparer sur la carte » n’est disponible que lorsque la fiche s’affiche à côté de la carte, pas sur téléphone.',
  'help.guide.tour-origin-check.tip.1':
    'Une sortie reprise d’un autre voyage indique ce voyage et la sortie d’origine sous « Repris de ».',
  'help.ctx.trip-tour-planner.bullet.3':
    '« Sorties de ce voyage », le volet de droite, liste toutes les sorties, avec le filtre et « Totaux du voyage » au-dessus de la liste. Quand une sortie est ouverte, « Résumé de la sortie », en haut, donne sa distance, son dénivelé, sa durée et son profil d’altitude. Le plus en haut, « Ajouter une sortie », permet de planifier, d’importer ou de reprendre une sortie.',
  'help.guide.tour-open-workspace.step.3':
    'Le volet de droite, « Sorties de ce voyage », liste toutes les sorties du voyage, avec le filtre et « Totaux du voyage » au-dessus de la liste.',
  'help.guide.tour-open-workspace.result':
    'L’onglet « Sorties » : l’éditeur à gauche, les sorties du voyage à droite, la carte au milieu.',
  'help.guide.tour-draw-route.step.6':
    'Sous « Points de passage », chaque point a sa ligne avec son numéro, et prend le nom du lieu une fois celui-ci chargé. Pendant que TREK calcule, un petit point à côté de « Nouvelle sortie » indique l’état en cours.',
  'help.guide.tour-type-profile.step.1':
    'Cliquez sur « Type de sortie » sous « Nom de la sortie ». Il affiche le type actuel avec une ligne expliquant comment il est calculé.',
  'help.guide.tour-edit-points.goal':
    'Modifier le parcours de la sortie en déplaçant ses points sur la carte ou dans la liste.',
  'help.guide.tour-edit-points.tip.2':
    'Une ligne affiche les coordonnées tant que le nom du lieu n’est pas chargé. « Annuler » et « Rétablir » n’ont pas de raccourci clavier.',
  'help.guide.tour-shaping-points.tip.1': 'Le départ et l’arrivée sont toujours des étapes.',
  'help.guide.tour-loop-reverse.step.3':
    'Cliquez sur « Inverser le sens », juste à côté, pour parcourir toute la sortie dans l’autre sens.',
  'help.guide.tour-leg-by-hand.step.2':
    'Le tronçon devient une ligne droite en pointillés, et la liste affiche sous la ligne « Tracé à la main, non calculé », avec sa longueur.',
  'help.guide.tour-trip-places.step.1':
    'Cliquez sur « Lieux du voyage » à côté de « Ajouter un point », sous « Points de passage ». Les lieux du voyage s’affichent en dessous.',
  'help.guide.tour-details-times.title': 'Nommer la sortie et planifier sa durée',
  'help.guide.tour-details-times.tip.3':
    'Cliquez sur la flèche à côté de « Détails » pour replier la section. Elle s’ouvre automatiquement si l’un de ses champs contient une valeur refusée par « Enregistrer ».',
  'help.guide.tour-save.tip.1':
    '« Ignorer », à côté de « Enregistrer », abandonne les modifications non enregistrées après confirmation. Il ne modifie pas une sortie déjà enregistrée.',
  'help.guide.tour-edit-saved.step.3':
    'Cliquez sur « Enregistrer ». « Sortie enregistrée » s’affiche, et la sortie conserve ses jours, ses fichiers et ses notes.',
  'help.guide.tour-summary-profile.step.1':
    '« Résumé de la sortie », en haut de « Sorties de ce voyage », indique la « Distance », le « Dénivelé positif » et le « Dénivelé négatif » de la sortie ouverte dans l’éditeur, sa durée estimée, les pauses et le total prévu.',
  'help.guide.tour-list-manage.title': 'Gérer les sorties du voyage',
  'help.guide.tour-list-manage.tip.2':
    'Un jour qui contient déjà la sortie est grisé dans le menu des jours. Pour une sortie sur plusieurs jours, TREK vous demande si ses étapes commencent ce jour-là ou si toute la sortie se fait ce jour-là.',
  'help.guide.tour-delete.tip.2':
    'Pour la retirer seulement d’un jour, utilisez plutôt « Retirer du jour » dans le menu du jour.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Choisissez « Enregistrer comme nouvelle sortie » pour garder les deux, « Charger la plus récente » pour charger l’autre version, ou « Écraser » pour remplacer l’autre version par la vôtre.',
  'help.ctx.trip-tour-import.bullet.3':
    'Un import s’ouvre en tant que sortie GPX ou sortie wanderer : son tracé, le « Résumé de la sortie » et le profil d’altitude, exactement tels qu’importés. Sa ligne dans la liste porte le badge « Import GPX ».',
  'help.guide.tour-import-gpx.step.4':
    'Sous « Importer comme », indiquez de quoi il s’agit. « Randonnée » est présélectionné. Une « Sortie à vélo » ou une « Course à pied » demande son profil, une « Sortie en pagaie » son embarcation et son plan d’eau, « Ski et hiver » sa discipline.',
  'help.guide.tour-view-import.title': 'Consulter une trace importée',
  'help.guide.tour-view-import.result':
    'Vous voyez la trace enregistrée exactement telle qu’elle a été importée, sans aucun recalcul.',
  'help.guide.tour-plan-from-import.tip.2':
    'Si la fiche indique que la suggestion s’écarte de la trace sur de longues portions, vérifiez ces passages sur la carte avant de planifier avec elle.',
  'help.guide.tour-restore-recorded.step.3':
    'Confirmez avec « Restaurer la trace enregistrée ». Les points de passage et le tracé calculé sont supprimés ; les jours et les notes sont conservés.',
  'help.guide.tour-take-over.step.3':
    'Trouvez la sortie : tapez dans « Rechercher par nom », ou affinez la liste avec les filtres « Voyage » et « Type ».',
  'help.guide.tour-import-wanderer.title': 'Importer un sentier depuis wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'Un sentier déjà présent dans le voyage est marqué « Dans ce voyage » et propose « Ouvrir la sortie ». Un sentier modifié depuis l’import propose « Importer comme nouvelle version » à côté de l’ancienne.',
  'help.ctx.trip-tour-map.bullet.4':
    "« Le long de l'itinéraire », une carte du panneau de gauche, recherche points de vue, points d’eau, refuges, restauration et bien plus à proximité de l’itinéraire, et liste les résultats. Vous pouvez ajouter un lieu de la liste à la sortie comme étape.",
  'help.guide.tour-map-layers.tip.1':
    'Le fond de carte choisi reste actif pour toutes les sorties que vous ouvrez, jusqu’au rechargement de la page. Une sortie dont le type ne le propose pas s’ouvre sur « Carte », et ni la carte de l’onglet « Prévu » ni le réglage dans « Paramètres » ne changent.',
  'help.guide.tour-along-search.step.4':
    "Cliquez sur « Chercher le long de l'itinéraire ». TREK effectue seulement la recherche : la sortie ne change pas.",
  'help.guide.tour-along-add-stop.step.1':
    "Cliquez sur un lieu dans la liste « Le long de l'itinéraire », ou sur son épingle sur la carte. Sa fiche s’ouvre par-dessus la carte : de quoi il s’agit, sa distance par rapport à l’itinéraire et sa position le long de la sortie.",
  'help.guide.tour-3d-terrain.title': 'Voir une sortie en 3D',
  'help.guide.tour-3d-terrain.tip.1':
    '« Aperçu », dans la même rangée, réaffiche tout l’itinéraire après que vous avez déplacé la vue.',
  'help.guide.tour-3d-flyover.step.4': 'Cliquez sur « Aperçu » pour réafficher toute la sortie.',
  'help.guide.tour-map-overlays.step.2':
    'Cliquez sur « Légende des pistes », le petit carré de points colorés à côté de l’interrupteur.',
  'help.ctx.trip-tour-stages.summary':
    'Une sortie sur plusieurs jours est un itinéraire découpé en étapes, une par jour de route. Ici, vous définissez où se termine chaque journée, consultez les mesures de chaque étape et placez les étapes sur les jours du voyage.',
  'help.guide.tour-multi-day.step.1':
    'Dans « Sorties de ce voyage », cliquez sur la sortie pour l’ouvrir dans l’éditeur.',
  'help.guide.tour-multi-day.tip.3':
    'La durée d’une étape n’inclut pas les pauses. Une durée affichée dans la couleur d’alerte, « Plus d’une journée en mouvement », dépasse une journée.',
  'help.guide.tour-stages-on-days.step.4':
    'Cliquez sur le bouton avec la lune et le nombre d’étapes, « Afficher les étapes », pour les afficher.',
  'help.ctx.trip-tour-hike.title': 'Randonnées et courses à pied',
  'help.guide.tour-hike-plan.title': 'Planifier une randonnée selon la difficulté de votre choix',
  'help.guide.tour-hike-plan.result':
    'La randonnée figure dans « Sorties de ce voyage » avec sa distance, son dénivelé et son temps de marche, prête à être placée sur un jour.',
  'help.guide.tour-hike-trail-details.step.2':
    'Choisissez ce qu’il faut afficher : SAC pour la cotation de randonnée, « Revêtement » ou « Type de voie ». L’itinéraire sur la carte reprend les couleurs de la liste.',
  'help.guide.tour-hike-round.title': 'Trouver une boucle d’une longueur approximative',
  'help.guide.tour-hike-round.tip.1':
    'Les boucles respectent la « Difficulté maximale du sentier » de la randonnée ; la pastille T de la carte indique laquelle.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Cliquez sur « Prendre ce chemin ». TREK vérifie auprès du calcul d’itinéraire que le parcours l’emprunte réellement.',
  'help.guide.tour-ferrata-add.step.2':
    'Cliquez sur une via ferrata sur la carte, sur son tracé en pointillés ou sur son panneau. Sa fiche affiche le nom, la cotation et la longueur.',
  'help.guide.tour-ferrata-add.tip.4':
    '« Voir dans OpenStreetMap », sur la fiche, ouvre les données de la via ferrata. Le badge devient orange si rien ne peut être chargé, avec la raison dans son info-bulle.',
  'help.guide.tour-run-plan.result':
    'La course figure dans « Sorties de ce voyage » avec son « Temps de course (prévu) », et son profil et son allure sont enregistrés avec elle.',
  'help.guide.tour-run-ways.step.2':
    'Le haut de la carte indique désormais la part non revêtue de la course et le sentier le plus difficile qu’elle emprunte.',
  'help.ctx.trip-tour-walk.bullet.2':
    '« Points de passage » liste les étapes dans l’ordre. Un anneau autour du numéro d’une étape la signale comme « Incontournable » (plein) ou « Facultatif » (pointillés), un petit bouclier la marque « Protégée », et une pastille sous son nom indique la durée de l’arrêt.',
  'help.guide.tour-walk-plan.step.3':
    "Survolez une étape dans « Points de passage », cliquez sur « Plus d’actions » à côté et choisissez « Modifier l'étape ».",
  'help.guide.tour-walk-sights.title': 'Ajouter des sites à voir le long d’une balade urbaine',
  'help.guide.tour-walk-sights.tip.2':
    'Si vous modifiez l’itinéraire, le bouton affiche « Chercher à nouveau », car les lieux trouvés correspondent à l’ancien itinéraire.',
  'help.guide.tour-walk-day-times.step.4':
    'Sous chaque étape, vous voyez votre heure d’arrivée et la durée de l’arrêt. Un avertissement apparaît si un lieu est fermé à cette heure-là ou ferme pendant l’arrêt.',
  'help.guide.tour-walk-google-import.step.1':
    'Dans « Sorties de ce voyage », cliquez sur « Ajouter une sortie » (le + en haut) et choisissez « Importer une balade depuis Google Maps ».',
  'help.guide.tour-walk-check-off.title': 'Cocher les étapes d’une balade le jour J',
  'help.guide.tour-walk-check-off.tip.3':
    'Si vous placez une balade sur un jour hors ligne, vous pourrez la cocher une fois la synchronisation effectuée.',
  'help.guide.tour-bike-profile.title': 'Planifier une sortie à vélo adaptée à votre pratique',
  'help.guide.tour-bike-profile.result':
    'La sortie à vélo est enregistrée et figure dans « Sorties de ce voyage », calculée selon son profil, avec son temps de vélo dans le « Résumé de la sortie ».',
  'help.guide.tour-bike-surfaces.step.1':
    'Dans « Sorties de ce voyage », à droite, cliquez sur une sortie à vélo pour l’ouvrir. Une fois son itinéraire calculé, la carte « Revêtement et voies » apparaît sous « Points de passage ».',
  'help.guide.tour-bike-surfaces.tip.4':
    'Cliquez sur le titre de la carte pour la replier. Elle reste repliée dans ce navigateur, même après rechargement.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Là où les contributeurs ont coté les montées, « Difficulté en montée (mtb:scale:uphill) » suit en dessous, avec ses propres lignes.',
  'help.ctx.trip-tour-ski.bullet.4':
    'La carte « Itinéraire sur pistes », sous les points de passage, répartit la journée entre « Ski », « En remontée », « Attente » et « À pied », avec la longueur des pistes, le dénivelé descendu et les remontées empruntées. « Temps de ski », dans le « Résumé de la sortie » à droite, fait le total dès que tous les tronçons sont calculés.',
  'help.guide.tour-ski-plan.step.5':
    'Sous chaque point, son tronçon apparaît en pastilles : chaque piste, remontée et passage à pied, avec son nom ou son type, les pistes marquées d’un point à la couleur de leur niveau, et les minutes de chacun.',
  'help.guide.tour-ski-options.goal':
    'Définir les pistes les plus difficiles, vos préférences, votre rythme et les remontées à utiliser, pour des tronçons qui vous conviennent.',
  'help.guide.tour-ski-options.tip.3':
    '« Éviter les liaisons supposées » écarte l’itinéraire des connexions que les données cartographiques ne font que supposer, comme un passage non cartographié entre deux pistes.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Tant que les données de pistes d’une zone sont en cours de téléchargement, le calcul attend et réessaie automatiquement.',
  'help.guide.tour-ski-summary.step.3':
    'Dans le « Résumé de la sortie » à droite, « Temps de ski » fait le total. Son point d’information explique le calcul.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Quand une sortie « Ski et hiver » est ouverte, la carte affiche automatiquement les pistes. L’interrupteur en forme de montagne enneigée, dans la rangée en bas à gauche de la carte, les masque et les réaffiche ; son info-bulle indique « Pistes, pistes de fond et remontées ».',
  'help.guide.tour-ski-import.goal':
    'Importer une trace enregistrée de ski, de ski de fond ou de raquettes et lui attribuer la bonne discipline.',
  'help.guide.tour-ski-import.tip.2':
    'Pour la modifier comme une sortie planifiée, utilisez « Planifier une version modifiable » dans sa carte « Version modifiable ». Ses points sont reliés par des lignes droites.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '« Estimation du temps » additionne le temps sur l’eau, le portage, les débarquements et rembarquements, les écluses et les pauses, d’après des vitesses et des durées que vous pouvez modifier.',
  'help.guide.tour-paddle-setup.step.4':
    'Sous « Plan d’eau », choisissez « Rivière » ou « Lac ». Vous ne pouvez pas enregistrer la sortie tant que vous n’avez pas choisi à la fois une embarcation et un type de plan d’eau.',
  'help.guide.tour-paddle-setup.result':
    'Une nouvelle sortie en pagaie avec son embarcation, son plan d’eau et sa vitesse, prête pour son premier point sur la carte.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Si les données hydrographiques manquent, TREK les télécharge automatiquement pour la région ou les demande à un administrateur, selon la configuration de l’instance. Le tronçon affiche alors « Chargement des données d’eau » et est calculé automatiquement dès que les données sont disponibles, généralement en une à trois minutes.',
  'help.guide.tour-paddle-portage.step.2':
    'Choisissez « Porter l’embarcation à partir d’ici ». Le tronçon jusqu’au point suivant devient un portage, tracé sur la terre ferme.',
  'help.guide.tour-paddle-lock.title': 'Ajouter une écluse et son temps d’attente',
  'help.guide.tour-paddle-lock.tip.3':
    '« Supprimer l’écluse » se trouve en bas de la fiche ouverte et dans « Plus d’actions ».',
  'help.guide.tour-paddle-time.step.5':
    'Tant que toutes les écluses n’ont pas leurs durées, l’estimation affiche « Incomplète » et une remarque sous les lignes indique ce qui manque.',
  'help.guide.tour-paddle-wind.step.2':
    'Vérifiez la direction du vent, sa valeur « Moyen » et ses « Rafales ». « Moyen » correspond à la moyenne horaire la plus forte de la journée, « Rafales » à la rafale la plus forte.',
  'help.guide.tour-paddle-checklist.title': 'Passer en revue la liste des obstacles',
  'help.guide.tour-paddle-checklist.tip.2':
    '« Faire un portage » ne crée pas automatiquement de portage. Cliquez sur « Planifier le portage » pour le tracer sur la carte.',
  'help.guide.tour-paddle-track-marks.step.2':
    "Dans l’« Aperçu de l'import », réglez « Importer comme » sur « Sortie en pagaie », puis choisissez le « Bateau » et le « Plan d’eau ». L’import ne peut pas continuer tant que les deux ne sont pas choisis.",
  'help.guide.tour-paddle-track-marks.tip.3':
    'Sur une trace enregistrée, la ligne « Plan d’eau » de l’« Estimation du temps » a sa propre vitesse : cliquez dessus et saisissez la vitesse à laquelle vous avez pagayé.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Une sortie importée depuis un fichier GPX reste exactement telle qu’elle a été enregistrée, et sa carte « Sortie enregistrée » indique ce que l’import n’a pas pu calculer.',
  'help.guide.tour-horse-plan.step.6':
    'Cliquez sur « Reprendre le tronçon ». Le tronçon est ajouté à la sortie sous forme de badge au nom de l’itinéraire dans la carte « Points de passage ». Ajoutez d’autres tronçons de la même façon.',
  'help.guide.tour-horse-gap.title': 'Relier deux itinéraires équestres',
  'help.guide.tour-horse-gap.tip.2':
    'Les points sur lesquels vous cliquez sur la carte sont ajoutés à la sortie de la même façon, comme des tronçons droits non vérifiés.',
  'help.guide.tour-horse-recorded.result':
    'La sortie figure dans le voyage exactement telle que vous l’avez faite, avec la distance et les altitudes du fichier.',
  'help.guide.dateless-trip.step.3': 'Cliquez sur « Créer un nouveau voyage ».',
  'help.guide.trip-reminder.tip.2':
    'Un nouveau voyage comporte d’office un rappel 3 jours avant le départ. Vous choisissez ses canaux dans Paramètres, Notifications.',
  'help.guide.upcoming-reservations.result':
    'Le voyage s’ouvre. De retour sur le tableau de bord, le widget continue d’afficher les prochaines échéances.',
  'help.guide.entitlement.tip.2':
    'Dans un planning fusionné, chacun a sa propre ligne, et vous pouvez aussi définir les droits des autres.',
  'help.guide.half-company-holiday.step.3': 'Cliquez sur le jour. La moitié de la case devient orange.',
  'help.guide.school-holidays.tip.2':
    'Survolez un jour de vacances pour afficher leur nom sous « Vacances scolaires ».',
  'help.guide.answer-fusion-request.step.3':
    'Cliquez sur « Accepter et fusionner » pour réunir les plannings, ou sur « Refuser » pour garder votre planning à part.',
  'help.guide.log-for-partner.step.3':
    'Cliquez sur les jours à saisir, puis cliquez de nouveau sur votre propre nom dans « Personnes ».',
  'help.guide.dissolve-fusion.result':
    'Chacun retrouve son propre planning avec ses propres entrées, et « Personnes » n’affiche plus que vous.',
  'help.guide.country-places.result': 'Le planificateur s’ouvre sur le voyage auquel appartient le lieu.',
  'help.guide.tour-activity-stats.step.6':
    'Pour une sortie qui n’a pas eu lieu, cliquez sur « Exclure », le bouton rond en bout de ligne. La sortie reste dans la liste, estompée et marquée « Exclue ». Le même bouton, devenu « Compter à nouveau », la réintègre dans le décompte.',
  'help.guide.move-to-list.tip.1':
    'Les libellés sont propres à chaque liste : un lieu déplacé ou dupliqué n’a donc aucun libellé dans la nouvelle liste.',
  'help.guide.accept-list-invite.step.1':
    'Repérez l’invitation sous « Invitations » dans la colonne des listes. Si vous avez suivi la notification d’invitation, la carte se trouve en haut de la page. Elle indique le nom de la liste et qui vous l’envoie.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'La nouvelle sortie n’est encore sur aucun jour et n’ajoute aucun lieu. Ni la liste ni la sortie d’origine ne sont modifiées.',
  'help.guide.tour-collection-manage.step.3':
    'Cliquez sur la corbeille en bout de ligne de la sortie et confirmez avec « Retirer de la collection ».',
  'help.ctx.journey-detail.bullet.7':
    'Si Dawarich est connecté, l’en-tête d’un jour affiche aussi « Reprendre l’enregistrement » (ou la distance du trajet enregistré pour ce jour) et « Reprendre la journée ». Un jour avec des séjours en attente les regroupe sur une seule ligne, en fin de journée.',
  'help.guide.entry-draft.tip.1':
    'Les contributeurs voient quand même un brouillon. Seul le lien public le masque tant que vous n’avez pas désactivé « Brouillon ».',
  'help.guide.journey-map-layers.tip.2':
    'Un interrupteur estompé n’a encore rien à afficher, et son info-bulle en donne la raison. Votre choix est mémorisé pour chaque journal dans ce navigateur.',
  'help.guide.journey-keep-route.tip.2':
    'Cliquez plus tard sur la distance dans l’en-tête du jour pour comparer de nouveau avec Dawarich : « Remplacer » adopte la nouvelle version, « Retirer l’itinéraire » supprime le trajet du jour du journal.',
  'help.guide.journey-day-stays.tip.2':
    'Pour une journée chargée, « Reprendre la journée », en bout de ligne, traite tous ses séjours d’un coup.',
  'help.guide.journey-take-over-day.tip.1':
    'Rien n’est enregistré avant que vous cliquiez sur ce bouton, et rien n’est enregistré en double : un séjour déjà présent dans le journal est signalé et ne peut pas être choisi à nouveau.',
  'help.guide.journey-auto-prepare.tip.1':
    'Seuls les jours des voyages liés et datés sont préparés, et rien n’est ajouté automatiquement au journal.',
  'help.guide.photo-location.result':
    'Une entrée sans lieu prend l’emplacement où sa première photo géolocalisée a été prise, et apparaît sur la carte.',
  'help.guide.contributors.tip.2':
    '« Via des voyages » liste les personnes qui ont accès par un voyage lié. Modifiez leur accès dans les paramètres de ce voyage, pas ici.',
  'help.ctx.settings-plugins.bullet.2':
    'Un plugin peut ajouter à sa carte des « Actions », exécutées après votre confirmation, ainsi que « Connecter » ou « Déconnecter » s’il se connecte à un autre service à votre place.',
  'help.guide.web-push-device.tip.1':
    'Le push fonctionne navigateur par navigateur : répétez l’opération sur chaque téléphone et ordinateur où vous voulez recevoir des notifications. « Désactiver sur cet appareil » ne l’arrête que sur cet appareil.',
  'help.guide.connect-airtrail.step.2':
    '« Autoriser les certificats auto-signés » ne sert que pour une instance de confiance sur votre propre réseau. « Réécrire les modifications dans AirTrail » est désactivé par défaut, TREK se contente donc de lire ; activez-le pour renvoyer vos modifications.',
  'help.guide.connect-dawarich.step.2':
    '« Rechercher automatiquement les nouveaux séjours » permet à TREK de vérifier de lui-même. Si l’option est désactivée, TREK ne consulte Dawarich que sur demande. « Autoriser un certificat auto-signé » ne sert que pour une instance que votre serveur ne reconnaît pas comme fiable.',
  'help.guide.tour-connect-wanderer.step.2':
    'N’activez « Autoriser un certificat auto-signé » que pour une instance sur votre propre réseau.',
  'help.guide.tour-wanderer-watch.step.1':
    'Dans la carte wanderer, activez « Vérifier les changements de mes sentiers ». Une connexion enregistrée est nécessaire au préalable.',
  'help.guide.plugin-settings.title': 'Configurer un plugin pour vous',
  'help.guide.default-user-settings.tip.2':
    "« Devise d'affichage » ne convertit les montants qu’à l’affichage. Les montants saisis dans « Coûts » restent inchangés.",
  'help.guide.own-routing-engine.step.2':
    'Pour des itinéraires qui évitent les péages, les autoroutes ou les ferries, saisissez l’adresse de votre Valhalla sous « Instance Valhalla propre ». Chaque champ est enregistré quand vous le quittez ; redémarrez ensuite le serveur TREK et rechargez la page.',
  'help.guide.admin-passkeys.tip.3':
    "Si un utilisateur a perdu l’appareil contenant ses passkeys, supprimez-les avec « Réinitialiser les passkeys » dans « Modifier l'utilisateur ».",
  'help.guide.rotate-jwt-secret.result':
    'Un nouveau secret de signature est en place, et tous les utilisateurs, vous compris, doivent se reconnecter.',
  'help.guide.read-notifications.title': 'Lire vos notifications',
  'help.guide.filter-notifications.title': 'Afficher toutes les notifications, ou seulement les non lues',
  'help.guide.mark-notifications-read.goal':
    'Supprimer la mise en évidence et le chiffre sur la cloche une fois les nouveautés consultées.',
  'help.guide.delete-notifications.step.1':
    'Cliquez sur « Supprimer », la corbeille à côté de l’heure d’une notification, pour supprimer uniquement celle-ci.',
  'help.guide.notification-settings.step.2': 'Cliquez sur « Paramètres » dans le menu.',
  'help.guide.public-link.tip.3': 'Survolez une option pour voir ce qu’elle masque.',
  'help.guide.link-journal.step.4':
    'Lisez la remarque jaune : elle indique qui accède au journal pour la première fois. Cliquez ensuite sur « Lier le journal ».',
  'help.guide.dawarich-stays.step.1':
    'Si Dawarich est connecté dans Paramètres, Intégrations, « Depuis Dawarich » apparaît au-dessus de la liste des lieux. Son en-tête indique quand TREK a vérifié pour la dernière fois et combien de séjours sont en attente. Cliquez dessus pour ouvrir la liste.',
  'help.guide.leave-stop-off-route.step.2':
    'Un badge « Hors itinéraire » apparaît à côté du nom. L’étape reste dans la journée et sur la carte, mais l’itinéraire du jour et les durées de trajet n’en tiennent plus compte.',
  'help.guide.move-booking-day.result':
    'La réservation est rattachée au nouveau jour dans le programme, à la même heure.',
  'help.guide.clear-day.tip.2': 'Cette option du menu n’apparaît que sur un jour qui contient des lieux.',
  'help.guide.place-image-from-file.step.1':
    'Ouvrez un lieu qui a une photo dans ses « Fichiers ». Le bloc « Fichiers », vers le bas de la fiche, indique combien de fichiers le lieu contient.',
  'help.guide.place-own-hours.title': 'Corriger les horaires, le téléphone ou l’e-mail d’un lieu',
  'help.guide.place-own-hours.tip.1':
    'Les horaires que vous saisissez remplacent ceux trouvés par TREK : un café aux horaires saisonniers affiche ainsi ce que vous savez.',
  'help.guide.day-panel.tip.3':
    'Vous planifiez selon le calendrier ? Activez « Date en premier dans les titres de jour » dans Paramètres, sous « Affichage » : l’en-tête affiche alors d’abord la date, avec « Jour 1 » ou le nom du jour en dessous.',
  'help.guide.confirm-stay-booking.result':
    'La réservation d’hôtel est confirmée, aussi bien sur la carte du séjour que dans l’onglet « Réservations ».',
  'help.guide.tour-map-lines.goal':
    'Distinguer les sorties du voyage sur la carte, en ouvrir une depuis son tracé et masquer celles dont vous n’avez pas besoin pour l’instant.',
  'help.guide.tour-map-lines.tip.3':
    '« Retirer de l’itinéraire », dans le menu de la ligne de la sortie dans le programme du jour, fait que l’itinéraire du jour ne passe plus par le départ et l’arrivée de la sortie. « Remettre dans l’itinéraire » les relie à nouveau.',
  'help.guide.car-stops.step.5':
    'L’ordre des étapes définit l’itinéraire. « Monter » et « Descendre », à gauche d’une étape, le modifient, et « Supprimer l’étape », la croix à sa droite, la supprime.',
  'help.guide.transport-details.step.3':
    'Les tuiles en dessous indiquent le départ et l’arrivée avec leurs gares ou aéroports, puis le quai et la place s’ils sont renseignés. Un trajet avec des arrêts intermédiaires les liste sous « Itinéraire », et un trajet réservé tronçon par tronçon liste le code de chaque tronçon sous « Codes par tronçon ». Suivent « Voyageurs », « Notes », « Coûts » et « Fichiers » ; « Afficher dans les fichiers » ouvre le billet dans l’onglet « Fichiers ».',
  'help.guide.export-transports-csv.title': 'Exporter les transports sous forme de tableur',
  'help.guide.group-sort-bookings.step.4':
    'Cliquez sur le titre d’une section pour la replier. Le chiffre à côté indique combien de réservations elle contient, et un second clic la rouvre.',
  'help.guide.booking-on-map.goal': 'Passer d’une réservation à son emplacement dans le programme et sur la carte.',
  'help.guide.export-bookings-csv.tip.2':
    'Les colonnes sont séparées par des points-virgules, et Excel ouvre le fichier avec les accents intacts.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK mémorise « A à Z » dans ce navigateur : la liste s’ouvrira donc triée la prochaine fois aussi. Cela ne change que votre affichage, jamais l’ordre vu par les autres.',
  'help.guide.count-packed-pieces.step.4':
    'Dès que le compteur atteint la quantité, l’article est coché automatiquement et compté comme emballé.',
  'help.guide.expense-receipts.result':
    'Le reçu est enregistré avec la dépense : la pastille de sa ligne permet de l’ouvrir, et le fichier figure aussi dans les « Fichiers » du voyage.',
  'help.guide.files-sync-settings.step.4':
    'Sous « À la suppression d’un document », choisissez ce qu’il advient de la copie de l’autre côté. « Garder les deux copies » laisse la copie du stockage en place. « Mettre à la corbeille » l’envoie dans la corbeille du stockage quand le document est supprimé dans TREK.',
  'help.ctx.trip-collab.bullet.7':
    'Tout ce qui se trouve ici nécessite une connexion. Hors ligne, un message, une note, un lien, un sondage ou un vote n’est pas enregistré, et TREK affiche « Cela nécessite une connexion. Réessayez une fois TREK de nouveau en ligne. » Les membres qui n’ont pas le droit de modifier « Collaboration » peuvent tout lire, mais « Nouvelle note », « Ajouter un lien » et « Nouveau sondage » ne leur sont pas proposés et la zone de message est grisée.',
  'help.guide.manage-notes.step.4':
    '« Modifier » ouvre la boîte de dialogue de la note avec tous les champs remplis. Modifiez ce qu’il faut, ici une ligne de plus sous « Contenu », et cliquez sur « Enregistrer ».',
  'help.guide.note-categories.step.2':
    'Saisissez un nom dans « Nouvelle catégorie… » en bas et appuyez sur Entrée ou cliquez sur le plus à côté. La nouvelle catégorie reçoit la couleur suivante et sa propre ligne.',
  'help.guide.note-categories.tip.3':
    'Sur une carte, la catégorie n’est représentée que par le point coloré de l’en-tête. Survolez le point pour voir son nom.',
  'help.guide.roadtrip-reorder.step.1':
    'Faites glisser une étape par sa ligne et déposez-la sur une autre étape du même jour. Elle prend la place de cette étape, et l’itinéraire du jour est recalculé dans le nouvel ordre.',
  'help.guide.roadtrip-overnight.step.5':
    'Cliquez sur « Ajouter ». La nuit est réservée de ce jour au lendemain, et le lieu est ajouté au trajet comme étape de nuit de ce jour.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Pour rétablir votre réglage habituel sur cet arrêt, rouvrez le badge et cliquez sur « Utiliser ma valeur par défaut ».',
  'help.guide.roadtrip-bookings.step.3':
    'La pastille « Arrivée » ou « Embarquement » indique l’heure à laquelle vous devez être au terminal : le départ est avancé d’autant par rapport à l’horaire.',
  'help.guide.roadtrip-google-import.title': 'Importer un itinéraire depuis Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'Le lien doit contenir au moins deux étapes que TREK peut localiser, et 30 au maximum.',
  'help.guide.roadtrip-hazards.tip.1':
    'Les alertes ne sont pas des fermetures de route : l’itinéraire n’est jamais modifié à cause d’elles, et il s’agit d’avis en cours, pas de prévisions pour vos dates.',
  'help.ctx.trip-tours.bullet.4':
    'Survolez une ligne pour afficher son œil (« Masquer sur la carte ») et son + rond (« Ajouter au jour »). Faites glisser une ligne sur un jour de la colonne de gauche pour l’y planifier, ou cliquez dessus pour ouvrir la fiche de la sortie par-dessus la carte.',
  'help.guide.tour-show-list.step.4':
    'La fiche affiche les mesures de la sortie et, sous « Jours du voyage », les jours où elle a lieu. Pour modifier l’itinéraire lui-même, ouvrez l’onglet « Sorties » et cliquez sur la sortie sous « Sorties de ce voyage ».',
  'help.guide.tour-add-to-day.step.1':
    'Survolez la sortie dans la liste et cliquez sur le + rond à droite de sa ligne (« Ajouter au jour »).',
  'help.guide.tour-add-to-day.tip.4':
    'Quand un jour est ouvert (cliquez sur son en-tête), la fiche de la sortie propose aussi « Ajouter au jour » pour ce jour. La flèche d’annulation au-dessus des jours annule l’affectation.',
  'help.guide.tour-day-times.tip.1': 'Une heure de fin que vous saisissez remplace celle qui a été calculée.',
  'help.guide.tour-remove-from-day.step.2':
    'La sortie reste dans la liste de droite. Son badge « Jour » a disparu, et le filtre la compte de nouveau parmi les « Non planifiés ».',
  'help.guide.tour-filter-list.step.2':
    'Sous « Statut », choisissez « Non planifiés » pour les sorties qui ne sont encore sur aucun jour, ou « Prévu » pour celles déjà placées. Chaque ligne indique le nombre de sorties correspondantes.',
  'help.guide.tour-hide-on-map.goal':
    'Masquer sur la carte les sorties inutiles pour l’instant, sans rien changer pour les autres.',
  'help.guide.tour-import-plan-tab.goal':
    'Importer une trace GPX ou KML comme sortie pendant la planification des journées.',
  'help.ctx.trip-tour-detail.summary':
    'La fiche qui s’ouvre par-dessus la carte quand vous choisissez une sortie dans l’onglet « Prévu » : ses jours, ses mesures et son profil, sa provenance, et les boutons pour l’envoyer sur votre téléphone, la copier, l’enregistrer dans une collection ou la lier à la liste de bagages.',
  'help.guide.tour-detail-read.step.1':
    'En haut de la colonne de droite, passez de « Lieux » à « Sorties », puis cliquez sur une sortie. Sa fiche s’ouvre par-dessus la carte. Sa ligne dans une journée, ou son tracé sur la carte, ouvre la même fiche.',
  'help.guide.tour-detail-read.tip.2':
    'Une sortie en pagaie n’affiche ni altitudes ni profil : ses points se trouvent sur les berges, les altitudes seraient donc fausses.',
  'help.guide.tour-rename-colour.step.2':
    'Saisissez le nouveau nom et cliquez sur le bouton rond de validation, ou appuyez sur Entrée. Échap conserve l’ancien nom.',
  'help.guide.tour-take-along.step.1':
    'Ouvrez la fiche de la sortie. « Navigation », en bas de la fiche, ouvre le point de départ de la sortie dans une application de cartographie, en proposant d’abord la liste des applications s’il y en a plusieurs. Elle vous guide jusqu’au départ, pas le long de l’itinéraire.',
  'help.guide.tour-copy-keep.title': 'Copier une sortie ou l’enregistrer dans une collection',
  'help.guide.tour-copy-keep.tip.3':
    'Dans l’onglet « Sorties », le signet en haut de la colonne de gauche fait la même chose pour la sortie ouverte. Si elle comporte des modifications non enregistrées, il vous demande d’abord de l’enregistrer.',
  'help.guide.tour-packing-link.step.4':
    'La fiche affiche maintenant la liste, le nombre d’articles emballés, une barre de progression et les premiers articles. Les articles emballés sont barrés.',
  'help.guide.tour-files.step.1':
    'Ouvrez la fiche de la sortie et faites défiler jusqu’à « Fichiers », tout en bas. Cliquez sur « Importer » dans l’en-tête de la section et choisissez un ou plusieurs fichiers.',
  'help.guide.tour-activity-link.step.1':
    'Ouvrez la fiche de la sortie planifiée et faites défiler jusqu’à « Trace réelle ». Cliquez sur « Ajouter la trace réelle ».',
  'help.guide.tour-activity-link.result':
    'La trace est liée à la sortie, et la fiche affiche côte à côte le programme et ce que vous avez réellement fait.',
  'help.guide.tour-activity-compare.tip.2':
    'Les sorties réalisées dans l’Atlas comptent la trace liée au lieu des valeurs prévues.',
  'help.guide.tour-origin-check.tip.2':
    'Une sortie issue de wanderer a une flèche à côté de sa source, « Ouvrir dans wanderer », et « Vérifier la source » dans l’en-tête de la section. La vérification demande à wanderer si le sentier a changé depuis l’import. « Importer comme nouvel instantané » importe alors la nouvelle version comme sortie distincte. Cette sortie-ci conserve ses jours et ses notes.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Tant que « Ajouter un point » est activé (« Placer des points » dans la pastille de la carte), un clic sur la carte place un point. Faites glisser une épingle pour la déplacer, cliquez sur le tracé pour y ajouter un point de guidage, et choisissez un lieu du voyage avec « Lieux du voyage ».',
  'help.guide.tour-open-workspace.step.4':
    "Le plus en haut du volet de droite, « Ajouter une sortie », propose « Importer un GPX ou KML », « Importer une balade depuis Google Maps » et « Reprendre un itinéraire d'un autre voyage ». Quand une sortie est ouverte, « Planifier une nouvelle sortie » y figure aussi.",
  'help.guide.tour-draw-route.title': 'Tracer une nouvelle sortie',
  'help.guide.tour-draw-route.tip.1':
    'Tant que « Placer des points » est activé, le pointeur prend la forme d’un réticule. Désactivez-le pour déplacer la carte sans ajouter de points. En 3D, il est désactivé au départ, car on y fait glisser la carte pour regarder autour de soi.',
  'help.guide.tour-type-profile.step.2':
    'Choisissez le type dans la liste : « Randonnée », « Balade urbaine / touristique », « Course à pied », « Sortie à vélo », « Sortie en pagaie », « Randonnée équestre » ou « Ski et hiver ». Chacun précise ce qu’il calcule, et changer de type recalcule l’itinéraire.',
  'help.guide.tour-edit-points.step.1':
    'Faites glisser une épingle numérotée sur la carte jusqu’à l’emplacement voulu. L’itinéraire est recalculé en passant par ce nouvel endroit.',
  'help.guide.tour-edit-points.result':
    'Les points sont placés où vous le voulez et dans l’ordre voulu, et l’itinéraire a été recalculé.',
  'help.guide.tour-shaping-points.tip.2':
    'Un point de guidage ne peut pas marquer la fin d’une étape d’une sortie sur plusieurs jours.',
  'help.guide.tour-loop-reverse.tip.1':
    'Une fois la sortie transformée en boucle, « Retour au départ » indique « La sortie revient déjà au départ ».',
  'help.guide.tour-leg-by-hand.step.3':
    'Pour que le calcul d’itinéraire le reprenne, ouvrez le même menu et choisissez « Calculer à nouveau le tronçon suivant ».',
  'help.guide.tour-trip-places.step.2':
    'Utilisez « Chercher dans les lieux du voyage », ou regardez sous « Près de la sortie » : les lieux situés à moins de deux kilomètres de l’itinéraire, du plus proche au plus éloigné, chacun avec sa distance.',
  'help.guide.tour-details-times.goal':
    'Donner à la sortie un nom, une description et un lien, et ajouter des pauses à sa durée.',
  'help.guide.tour-details-times.result': 'La sortie a maintenant son nom, ses notes et la durée que vous prévoyez.',
  'help.guide.tour-save.tip.2':
    '« Retour aux sorties », en haut du volet, ferme l’éditeur, en demandant d’abord confirmation s’il reste des modifications non enregistrées.',
  'help.guide.tour-edit-saved.step.4':
    'Cliquez sur « Retour aux sorties » pour la fermer. S’il reste des modifications non enregistrées, TREK demande d’abord « Abandonner les modifications non enregistrées de la sortie ? ».',
  'help.guide.tour-summary-profile.step.2':
    'Le point d’information à côté de la durée estimée explique comment elle est calculée.',
  'help.guide.tour-list-manage.goal':
    'Voir les totaux des sorties du voyage, en placer une sur un jour et filtrer la liste selon vos besoins.',
  'help.guide.tour-list-manage.tip.3':
    'La corbeille d’une ligne supprime la sortie. L’onglet « Prévu » liste les mêmes sorties quand sa colonne de droite est réglée sur « Sorties ».',
  'help.guide.tour-delete.tip.3':
    'Une sortie se supprime ici, dans l’onglet « Sorties ». La corbeille n’apparaît que pour les voyageurs autorisés à modifier les lieux du voyage.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '« Enregistrer comme nouvelle sortie » nomme votre copie d’après la sortie, suivie de « (ma version) ».',
  'help.ctx.trip-tour-import.bullet.4':
    "« Version modifiable » transforme un import en sortie dont vous pouvez déplacer les points de passage. « Remplacer l'import » conserve la trace enregistrée, et la carte « Trace enregistrée » de l’éditeur permet d’y revenir.",
  'help.guide.tour-import-gpx.step.5':
    'Cliquez sur « Importer 1 sortie » (ou « Importer 3 sorties » pour un fichier contenant trois traces).',
  'help.guide.tour-view-import.goal':
    'Voir le parcours, les mesures et l’altitude d’une sortie importée, telles qu’elles ont été importées.',
  'help.guide.tour-plan-from-import.title': 'Planifier une sortie modifiable à partir d’un import',
  'help.guide.tour-plan-from-import.tip.3':
    'Pour un import en pagaie ou à ski, les points sont reliés par des lignes droites au lieu d’être calculés.',
  'help.guide.tour-restore-recorded.tip.1':
    "Cette carte ne s’affiche que pour une sortie remplacée avec « Remplacer l'import » puis enregistrée.",
  'help.guide.tour-take-over.step.4':
    'Cliquez sur la sortie. La partie droite affiche son tracé, ses mesures et le voyage dont elle provient.',
  'help.guide.tour-import-wanderer.goal':
    'Importer comme sortie dans le voyage l’un des sentiers de votre propre wanderer.',
  'help.guide.tour-import-wanderer.tip.4': '« Ouvrir dans wanderer » ouvre le sentier sur votre instance.',
  'help.ctx.trip-tour-map.bullet.5':
    'En 3D, l’itinéraire s’affiche sur le relief, coloré selon sa pente, avec une légende qui résume ses déclivités et un survol qui le suit du départ à l’arrivée.',
  'help.guide.tour-map-layers.tip.2':
    '« Randonnée » et « Vélo » proviennent de serveurs bénévoles et ne sont disponibles que si votre administrateur les autorise. Si l’un d’eux ne répond plus, son segment affiche un ! et vous pouvez passer à une autre carte ; votre sortie n’est pas modifiée.',
  'help.guide.tour-along-search.step.5':
    'Les lieux trouvés sont listés avec leur distance par rapport à l’itinéraire et affichés sur la carte dans leur couleur. Une étoile signale les plus connus, et « Dans la sortie » ceux qui sont déjà des étapes. Le bouton indique maintenant « Chercher à nouveau ».',
  'help.guide.tour-along-add-stop.step.2':
    '« Où l’insérer » suggère le tronçon le plus adapté au lieu. Cliquez dessus pour choisir plutôt entre quelles étapes l’insérer, ou « Comme nouvelle arrivée ». La carte affiche le nouvel itinéraire en pointillés avant toute modification.',
  'help.guide.tour-3d-terrain.goal': 'Voir la sortie sur le relief réel, colorée selon la pente.',
  'help.guide.tour-3d-terrain.tip.2':
    'Le fond de carte choisi est aussi utilisé en 3D, tout comme les via ferrata, les pistes et les balises maritimes. Pendant la modification d’une sortie, vous pouvez faire glisser ses points sur le relief et, avec « Placer des points » activé, un clic en ajoute un.',
  'help.guide.tour-3d-flyover.result': 'Vous avez survolé la sortie du départ à l’arrivée, à la vitesse choisie.',
  'help.guide.tour-map-overlays.step.3':
    'La légende explique les couleurs : les pistes de descente de « Débutant » à Freeride, « Pistes de ski de fond », « Sentiers piétons et raquettes », « Pistes de luge » et « Remontées mécaniques ». « Légende complète sur OpenSnowMap » affiche tous les symboles. Appuyez sur Échap pour la fermer.',
  'help.ctx.trip-tour-stages.bullet.1':
    '« Jours », dans l’éditeur, fait de la sortie ouverte une sortie « Une journée » ou « Plusieurs jours ». Si vous repassez à une sortie d’une journée, toutes les fins d’étape sont supprimées après confirmation, et l’itinéraire reste inchangé.',
  'help.guide.tour-multi-day.step.2':
    'Sous « Jours », cliquez sur « Plusieurs jours ». Une remarque indique où se place la première fin d’étape.',
  'help.guide.tour-multi-day.tip.4':
    'Les étapes sont enregistrées quand vous cliquez sur « Enregistrer ». Si une modification supprime une étape placée sur un jour du voyage, un message vous prévient que l’enregistrement la retirera de ce jour.',
  'help.guide.tour-stages-on-days.step.5':
    'Chaque étape affiche le jour où elle est placée. Cliquez sur ce jour pour déplacer l’étape sur un autre jour, ou choisissez « Sans jour » pour l’en retirer.',
  'help.ctx.trip-tour-hike.summary':
    'Une randonnée ou une course à pied ouverte dans l’onglet « Sorties » : l’éditeur à gauche, la carte au centre, le résumé de la sortie et les autres sorties du voyage à droite. Une randonnée respecte la difficulté de sentier que vous autorisez, une course est chronométrée selon votre propre allure, et les deux affichent ce qu’OpenStreetMap répertorie le long du parcours.',
  'help.guide.tour-hike-plan.goal':
    'Créer une randonnée, définir ses étapes, choisir la cotation de sentier la plus difficile autorisée, puis l’enregistrer.',
  'help.guide.tour-hike-plan.tip.1':
    'Une nouvelle randonnée démarre en T2 (« Randonnée en montagne »). T3 ajoute un avertissement : ces sentiers peuvent être exposés et demandent un pied sûr et l’absence de vertige.',
  'help.guide.tour-hike-trail-details.step.3':
    'Les badges font la synthèse : la part de l’itinéraire « Connu », la cotation « Plus haute connue » et, à part, la « Limite d’itinéraire » utilisée pour planifier la randonnée.',
  'help.guide.tour-hike-round.goal':
    'Laisser TREK proposer des boucles de la longueur voulue, au départ de l’une des étapes d’une randonnée.',
  'help.guide.tour-hike-round.tip.2':
    'Les distances acceptées vont de 1 à 60 km, et TREK propose des boucles à 20 % près de la longueur demandée.',
  'help.guide.tour-hike-compare-ways.result':
    'Ce tronçon suit le chemin choisi, et le reste de la randonnée reste inchangé. « Chemin adopté », en bas de la carte, propose « Annuler ».',
  'help.guide.tour-ferrata-add.step.3':
    'Cliquez sur « Ajouter à la randonnée ». La via ferrata est ajoutée à la fin de l’itinéraire comme tronçon distinct, avec un point à chaque extrémité.',
  'help.guide.tour-run-plan.title': 'Planifier une course à votre rythme',
  'help.guide.tour-run-plan.tip.1': 'Sans allure, la course ne peut pas être enregistrée.',
  'help.guide.tour-run-ways.step.3':
    'Cliquez sur « Revêtement », puis sur un revêtement de la liste pour n’afficher que ces portions sur la carte.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Une fois la balade placée sur un jour avec une heure de départ, « Horaires pour », en haut de « Points de passage », indique ce jour, et chaque étape affiche son heure d’arrivée, la durée de l’arrêt et ce qu’en disent les horaires d’ouverture.',
  'help.guide.tour-walk-plan.step.4':
    'Donnez à l’étape un « Libellé » et un « Arrêt en minutes ». Laissez la durée vide si vous ne la connaissez pas encore, et saisissez 0 pour un point où vous ne faites que passer.',
  'help.guide.tour-walk-sights.goal': 'Choisir un thème, chercher le long de la balade et ajouter un lieu comme étape.',
  'help.guide.tour-walk-sights.tip.3':
    'Les horaires d’ouverture et les sites web proviennent de la source, le plus souvent OpenStreetMap. Vérifiez-les avant de partir.',
  'help.guide.tour-walk-day-times.tip.1':
    'Sans heure de départ, la ligne le signale : « Donnez une heure à la balade sur ce jour pour voir les arrivées et les horaires d’ouverture ».',
  'help.guide.tour-walk-google-import.step.2':
    "Collez le lien sous « Lien vers l'itinéraire à pied » et cliquez sur « Lire le lien ».",
  'help.guide.tour-walk-check-off.goal':
    'Marquer les étapes visitées ou sautées le jour J et voir combien de marche il reste.',
  'help.guide.tour-walk-check-off.result':
    'Les étapes visitées sont cochées, celles sautées sont barrées, et le temps restant ne compte que ce qui reste à faire.',
  'help.guide.tour-bike-profile.goal':
    'Créer une sortie à vélo et laisser TREK calculer l’itinéraire pour le vélo de randonnée, de route, le gravel ou le VTT.',
  'help.guide.tour-bike-profile.tip.1':
    'Si vous changez de profil par la suite, tout l’itinéraire est recalculé pour le nouveau profil.',
  'help.guide.tour-bike-surfaces.step.2':
    'Le badge dans l’en-tête de la carte indique la part de l’itinéraire connue comme non revêtue.',
  'help.guide.tour-bike-mtb-grades.title': 'Vérifier la difficulté des sentiers d’une sortie en VTT',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Si les cotations n’ont pas pu être lues, la carte le signale. Cliquez sur « Réessayer ».',
  'help.ctx.trip-tour-ski.bullet.5':
    'Quand une sortie « Ski et hiver » est ouverte, la carte affiche les pistes d’OpenSnowMap, avec « Légende des pistes » à côté de leur interrupteur. Ce ne sont que des données cartographiques : rien n’indique si une piste ou une remontée est ouverte, l’état de la neige, ni quoi que ce soit sur le risque d’avalanche.',
  'help.guide.tour-ski-plan.step.6':
    'Donnez un nom à la sortie dans « Nom de la sortie » et cliquez sur « Enregistrer ».',
  'help.guide.tour-ski-options.step.1':
    'Dans une sortie « Ski et hiver », les options du calcul d’itinéraire se trouvent sous « Discipline ». Seules celles qui concernent votre discipline s’affichent : le « Ski de fond » n’a pas de « Pistes les plus difficiles », par exemple.',
  'help.guide.tour-ski-options.result':
    'La sortie est recalculée en respectant vos limites, et la carte « Itinéraire sur pistes » liste les pistes plus difficiles évitées.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Hors ligne, les tronçons sont tracés en ligne droite pour le moment. Une ligne grise mentionnant les sentiers d’été est une simple remarque, pas une erreur.',
  'help.guide.tour-ski-summary.tip.1':
    '« Évité » liste les pistes plus difficiles que le calcul a écartées à cause de votre limite « Pistes les plus difficiles ».',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Cliquez sur « Légende des pistes », le bouton aux quatre points colorés à côté de l’interrupteur.',
  'help.guide.tour-ski-import.step.1':
    'Dans l’onglet « Sorties », cliquez sur « Ajouter une sortie » (le plus au-dessus de « Sorties de ce voyage »), choisissez « Importer un GPX ou KML » et sélectionnez le fichier.',
  'help.guide.tour-ski-import.tip.3':
    'Vous pouvez aussi déposer des fichiers GPX, KML ou KMZ n’importe où dans l’onglet « Sorties » pour ouvrir le même aperçu.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '« Vent » affiche les prévisions au point de départ pour le jour où la sortie est planifiée. « Liste de contrôle » liste les obstacles de l’itinéraire enregistré et ce que vous avez décidé pour chacun.',
  'help.guide.tour-paddle-setup.step.5':
    'Sur un lac, « Sur les lacs » définit l’itinéraire : « Tout droit » est le plus court, « Près de la rive » longe la berge pour les jours de vent.',
  'help.guide.tour-paddle-water-route.title': 'Calculer les tronçons sur l’eau',
  'help.guide.tour-paddle-water-route.tip.2':
    'Là où l’itinéraire contourne un barrage en portant le bateau ou franchit une écluse, TREK place son propre point, marqué « Détecté ». Si vous le déplacez ou le modifiez, il devient votre propre point.',
  'help.guide.tour-paddle-portage.step.3':
    'Une carte « Portage » apparaît sous le point avec sa longueur et les minutes supplémentaires. Cliquez dessus pour l’ouvrir.',
  'help.guide.tour-paddle-lock.goal':
    'Ajouter une écluse à la sortie et inclure l’attente et le passage dans sa durée.',
  'help.guide.tour-paddle-lock.result':
    'L’écluse figure sur la sortie avec ses minutes, et l’« Estimation du temps » les additionne.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK part de 4 km/h sur l’eau, 2 km/h en portage et 10 minutes à chaque portage. Ce sont des valeurs de départ à ajuster, pas des mesures.',
  'help.guide.tour-paddle-wind.step.3':
    'Les barres représentent les heures de la journée, avec les rafales derrière le vent moyen. Survolez une barre pour voir les valeurs et la direction à cette heure-là.',
  'help.guide.tour-paddle-checklist.goal':
    'Voir ce que l’on sait des barrages, des écluses et des règles d’accès sur un itinéraire enregistré, et décider quoi faire à chaque fois.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Une entrée marquée « Vérifier à nouveau » a été tranchée avant que l’itinéraire ou les données changent. Tranchez-la à nouveau, ou choisissez « Conserver la décision » ou « Supprimer la décision ». Les décisions qui ne s’appliquent plus sont listées sous « Décisions antérieures ».',
  'help.guide.tour-paddle-track-marks.step.3': 'Cliquez sur « Importer 1 sortie ».',
  'help.guide.tour-paddle-track-marks.result':
    'La trace enregistrée comporte ses portages et ses écluses, et son « Estimation du temps » en tient compte.',
  'help.guide.tour-horse-plan.title': 'Planifier une sortie à cheval sur des itinéraires équestres',
  'help.guide.tour-horse-plan.step.7':
    'Donnez un nom à la sortie dans « Nom de la sortie », puis cliquez sur « Enregistrer » en bas de la colonne de gauche.',
  'help.guide.tour-horse-gap.goal': 'Poursuivre avec un tronçon qui commence loin de la fin de votre sortie.',
  'help.guide.tour-horse-gap.tip.3':
    'Un tronçon qui commence à moins de 25 m de la fin de votre sortie la prolonge directement, et « Raccord à votre randonnée » indique « Se raccorde à la fin de votre randonnée ».',
  'help.guide.tour-horse-recorded.tip.1':
    'Le tracé reste exactement tel que le fichier l’a enregistré. Rien n’est recalculé, et une sortie enregistrée n’a pas de version modifiable.',
  'help.guide.dateless-trip.result':
    'La carte affiche « Idée » et « Aucune date définie », et le voyage compte autant de jours vides que vous l’avez demandé.',
  'help.guide.trip-reminder.title': 'Recevoir un rappel avant un voyage',
  'help.guide.upcoming-reservations.tip.1':
    'Un séjour à l’hôtel apparaît deux fois : une fois pour l’arrivée, une fois pour le départ.',
  'help.guide.half-company-holiday.result':
    'L’entreprise est fermée la demi-journée, et un jour de congé saisi ce jour-là ne compte que pour une demi-journée.',
  'help.guide.edit-holiday-calendar.title': 'Modifier ou supprimer un calendrier de jours fériés',
  'help.guide.answer-fusion-request.result':
    'Après « Accepter et fusionner », les deux plannings s’affichent dans une seule grille, chaque personne dans sa couleur.',
  'help.guide.log-for-partner.result':
    'Les jours s’affichent dans la couleur de l’autre personne et sont décomptés de ses droits, pas des vôtres.',
  'help.guide.dissolve-fusion.tip.1':
    '« Annuler » dans cette fenêtre laisse le planning inchangé ; vos entrées sont conservées dans tous les cas.',
  'help.guide.country-places.tip.1':
    'Un lieu rangé sous le mauvais pays a généralement une adresse ou des coordonnées erronées. Ouvrez son voyage d’ici et corrigez le lieu là-bas.',
  'help.guide.tour-activity-stats.title': 'Voir le bilan de vos sorties',
  'help.guide.tour-activity-stats.result':
    'Les totaux de la boîte de dialogue et de l’onglet « Sorties » n’incluent plus la sortie exclue. Son itinéraire, ses jours et le voyage restent inchangés.',
  'help.guide.move-to-list.tip.2':
    'Déplacer retire des lieux de la liste : seul son propriétaire ou un administrateur voit donc « Déplacer vers une liste ». « Dupliquer dans une liste » fonctionne depuis n’importe quelle liste que vous pouvez ouvrir.',
  'help.guide.accept-list-invite.step.2':
    'Cliquez sur « Accepter » pour la rejoindre, ou sur « Refuser » pour décliner l’invitation.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Si une sortie a été enregistrée sans tracé, ses points de passage doivent être ajoutés avec elle. La boîte de dialogue vous le signale et sélectionne cette option pour vous.',
  'help.guide.tour-collection-manage.tip.1':
    'Retirer une sortie de la liste ne modifie pas les sorties déjà créées à partir d’elle dans vos voyages.',
  'help.guide.entry-draft.tip.2':
    'Quand vous reprenez une journée depuis Dawarich, ses entrées sont des brouillons. Vérifiez le badge avant de partager.',
  'help.guide.journey-map-layers.result':
    'La carte n’affiche que les couches voulues, et la légende explique chaque épingle, point et ligne.',
  'help.guide.journey-keep-route.result':
    'L’en-tête du jour affiche la distance, et le trajet apparaît en trait continu sur la couche « Enregistré » de la carte pour tous les participants du journal. Un lien partagé ne l’affiche que si « Trajets enregistrés » est activé.',
  'help.guide.journey-day-stays.result':
    'Les séjours que vous avez traités disparaissent de la ligne. Les entrées rédigées apparaissent à leur jour comme toutes les autres, et vous pouvez y ajouter photos et texte comme d’habitude.',
  'help.guide.journey-take-over-day.tip.2':
    'Les brouillons n’apparaissent pas sur les liens partagés. Ajoutez photos et texte, puis désactivez « Brouillon » dans chaque entrée.',
  'help.guide.journey-auto-prepare.tip.2':
    'Un point sur le bouton de liste d’un jour signifie que ce jour n’est pas encore définitif ; son info-bulle en donne la raison.',
  'help.ctx.settings-plugins.bullet.3':
    '« Activité des plugins », en bas, liste toutes les actions effectuées par un plugin en votre nom, des plus récentes aux plus anciennes, avec « Actualiser ».',
  'help.guide.language-region.tip.3':
    '« La semaine commence le » définit la première colonne de tous les sélecteurs de date ; Vacances a son propre réglage.',
  'help.guide.web-push-device.tip.2':
    'Sur iPhone et iPad, ajoutez d’abord TREK à l’écran d’accueil, puis ouvrez-le depuis celui-ci.',
  'help.guide.connect-airtrail.step.3':
    'Cliquez sur « Enregistrer », puis sur « Tester la connexion ». Le test indique le nombre de vols trouvés, et le badge passe à « Connecté ».',
  'help.guide.connect-dawarich.step.3':
    'Cliquez sur « Enregistrer », puis sur « Tester la connexion » : le test compte les séjours des 30 derniers jours. Une fois la connexion établie, « Vérifier maintenant » lance une vérification immédiate, et « Déconnecter », à droite, met fin à la connexion.',
  'help.guide.tour-connect-wanderer.step.3':
    'Cliquez sur « Enregistrer », puis sur « Tester la connexion ». Le test indique combien de vos sentiers peuvent être importés, et le badge passe à « Connecté ».',
  'help.guide.tour-wanderer-watch.step.2':
    'Une fois par jour au maximum, TREK consulte la fiche résumée de chaque sentier importé, et la ligne indique la date de la dernière vérification. Si un sentier a pu changer, vous recevez une notification et « Signalements » le compte : cliquez sur « Signalements » pour voir chaque sortie marquée « A peut-être changé », « Modifié » ou « Non vérifiable », et l’ouvrir depuis là.',
  'help.guide.plugin-settings.goal':
    'Fournir à un plugin vos propres clés et préférences, et voir ce qu’il a fait en votre nom.',
  'help.guide.own-routing-engine.result': 'Les itinéraires de tous les voyages sont calculés sur vos serveurs.',
  'help.guide.admin-passkeys.title': 'Proposer la connexion par passkey',
  'help.guide.rotate-jwt-secret.tip.1': 'Vous êtes vous aussi déconnecté : reconnectez-vous juste après.',
  'help.guide.notification-defaults.title': 'Définir les notifications par défaut des utilisateurs',
  'help.ctx.notifications.title': 'Notifications', // same-as-en
  'help.guide.read-notifications.goal':
    'Voir ce qui s’est passé dans vos voyages pendant votre absence, et y accéder directement.',
  'help.guide.filter-notifications.goal':
    'Parcourir toutes vos notifications, ou seulement celles que vous n’avez pas encore lues.',
  'help.guide.mark-notifications-read.step.1':
    'Cliquez sur « Marquer comme lu », la double coche à côté de l’heure d’une notification, pour ne marquer que celle-ci.',
  'help.guide.delete-notifications.step.2':
    '« Tout supprimer », en haut, supprime toute la liste d’un coup, après une demande de confirmation.',
  'help.guide.notification-settings.step.3':
    'Cliquez sur « Notifications » dans la barre latérale des paramètres. Sa première carte comporte une ligne par événement, et la colonne « Dans l’application » détermine ce qu’affiche la cloche.',
  'help.guide.link-journal.result':
    'Un onglet « Journal » apparaît dans la barre d’onglets du voyage. Toutes les personnes à qui vous avez donné « Lire » ou « Modifier » peuvent y ouvrir le journal, mis à jour en temps réel.',
  'help.guide.create-place.tip.4':
    'Un lien copié depuis Google Maps fonctionne aussi dans la recherche : collez-le, appuyez sur Entrée, et TREK en extrait le lieu. Dès que le formulaire a une position, « Lieux près de ce repère », le réticule à côté de la recherche, liste ce qui se trouve autour.',
  'help.guide.dawarich-stays.step.2':
    'Les séjours sont regroupés par jour, chacun avec vos heures d’arrivée et de départ ; une icône de jauge signale un séjour dont Dawarich n’était pas certain. Cliquez sur « Ajouter comme lieu », l’épingle à côté d’un séjour.',
  'help.guide.leave-stop-off-route.step.3':
    'Pour la réintégrer à l’itinéraire, ouvrez le même menu et choisissez « Remettre dans l’itinéraire ».',
  'help.guide.move-booking-day.tip.1':
    'Les lignes estompées des jours intermédiaires d’une réservation sur plusieurs jours ne peuvent pas être déplacées, pas plus qu’un tronçon isolé d’un vol avec escales.',
  'help.guide.place-image-from-file.step.2':
    'Cliquez sur l’image ronde dans l’en-tête. Comme le lieu a des photos, une petite fenêtre vous demande d’où doit provenir l’image.',
  'help.guide.place-own-hours.goal':
    'Afficher sur la fiche les horaires que vous avez vous-même vérifiés, quand ceux trouvés sont faux ou absents.',
  'help.guide.place-own-hours.tip.2':
    'Le numéro de téléphone et l’e-mail apparaissent sous forme de pastilles dans l’en-tête de la fiche. Cliquez dessus pour les ouvrir dans votre téléphone ou votre messagerie.',
  'help.guide.edit-accommodation.tip.3':
    'Si « Masquer les codes de réservation » est activé dans Paramètres, sous « Affichage », le numéro de confirmation reste flouté. Survolez-le ou cliquez dessus pour le lire.',
  'help.guide.confirm-stay-booking.tip.1':
    'Cliquez de nouveau sur la pastille pour repasser la réservation à « En attente ».',
  'help.guide.map-markers.tip.4':
    'Si « Repères compacts pour les lieux non planifiés » est activé, dans Paramètres > Affichage sous « Voyage et carte », les lieux qui ne sont encore sur aucun jour apparaissent comme de petits points sans photo ni note. Le lieu que vous choisissez est toujours affiché en entier.',
  'help.guide.tour-map-lines.step.1':
    'Chaque sortie du voyage est tracée sur la carte dans sa couleur, avec son épingle au point de départ. Si vous avez choisi une couleur pour la sortie, le tracé l’utilise. Sinon, il prend la couleur de sa catégorie.',
  'help.guide.car-stops.step.6': 'Cliquez sur « Ajouter ».',
  'help.guide.transport-details.step.4':
    'Cliquez sur le titre pour renommer le trajet sans ouvrir le formulaire. « Renommer » s’ouvre avec le nom prérempli : saisissez le nouveau et cliquez sur « Enregistrer ».',
  'help.guide.export-transports-csv.goal':
    'Exporter les trajets du voyage depuis TREK en fichier CSV, pour un tableur, une agence de voyages ou une impression.',
  'help.guide.group-sort-bookings.result':
    'Les réservations apparaissent dans les sections et l’ordre choisis, et ce navigateur garde ce choix pour votre prochaine visite.',
  'help.guide.booking-on-map.step.1':
    'Cliquez sur la carte d’une réservation qui a un lieu, lié sous « Lieu / Activité » ou, pour un séjour, sous « Hébergement ». Son détail s’ouvre.',
  'help.guide.export-bookings-csv.title': 'Exporter les réservations sous forme de tableur',
  'help.guide.export-bookings-csv.tip.3':
    'Le bouton apparaît dès que l’onglet contient une réservation. L’onglet « Transports » exporte ses propres entrées de la même façon.',
  'help.guide.arrange-packing-list.title': 'Organiser la liste de bagages à votre façon',
  'help.guide.count-packed-pieces.result':
    'La ligne indique combien de pièces sont emballées, et l’article est coché dès que la dernière l’est.',
  'help.guide.expense-receipts.title': 'Joindre un reçu à une dépense',
  'help.guide.expense-receipts.tip.1':
    'Dans l’éditeur, un clic sur le nom d’un fichier listé ouvre le même aperçu. Échap ferme alors uniquement l’aperçu, pas la dépense.',
  'help.guide.files-sync-settings.step.5':
    '« Quand les deux côtés ont changé » détermine quelle copie est conservée si un document a été modifié des deux côtés : « Me demander », « Garder la copie TREK » ou « Garder la copie du stockage ». « Synchroniser automatiquement » laisse TREK rechercher les changements en arrière-plan ; si l’option est désactivée, la carte indique « En pause » et seul « Synchroniser maintenant » lance une synchronisation. Chaque modification ici est enregistrée immédiatement.',
  'help.guide.manage-notes.step.5':
    '« Supprimer » demande d’abord confirmation, « Supprimer la note ? », car la note est supprimée pour tous les membres, avec ses fichiers. Cliquez sur « Supprimer » pour confirmer.',
  'help.guide.note-categories.step.3':
    'Cliquez sur le nom d’une catégorie pour la renommer. Saisissez le nouveau nom et appuyez sur Entrée ; Échap conserve l’ancien.',
  'help.guide.roadtrip-reorder.step.2':
    'Pour déplacer une étape sur un autre jour, déposez-la sur une étape de la carte de ce jour. Pendant le glissement, un jour qui compte moins de deux étapes apparaît comme une carte en pointillés à la fin de la frise, et vous pouvez aussi y déposer l’étape.',
  'help.guide.roadtrip-corridor.tip.4':
    'Sous le filtre, choisissez une étape de la journée, ou « À mi-chemin » entre deux étapes, pour ne garder que ce qui se trouve à moins de 25, 50 ou 100 km de ce point. Si la liste contient des bornes de recharge, « Toute prise » et « Toute puissance » les filtrent par prise et par puissance.',
  'help.guide.roadtrip-overnight.result':
    'Le lieu apparaît sur le trajet comme étape de nuit de ce jour, et le séjour est réservé dans le voyage comme n’importe quel autre.',
  'help.guide.roadtrip-stop-fill.result':
    'À cet arrêt, le réservoir est rempli jusqu’au niveau choisi. L’autonomie qui suit, y compris une éventuelle bande « Réservoir vide ici », est calculée à partir de là.',
  'help.guide.roadtrip-bookings.step.4': 'Cliquez sur la carte pour ouvrir la réservation.',
  'help.guide.roadtrip-google-import.goal':
    'Transformer un itinéraire préparé dans Google Maps en étapes de l’une de vos journées.',
  'help.guide.roadtrip-google-import.tip.3':
    'L’import nécessite une connexion, ainsi que le droit de modifier à la fois les lieux et les jours.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD couvre l’Allemagne, et GDACS signale les catastrophes dans le monde entier. Une alerte indiquée seulement par un point signifie que sa zone concernée est inconnue.',
  'help.ctx.trip-tours.bullet.5':
    "Dans la colonne des jours, une sortie est une ligne, comme une étape. Si elle a un « Début », elle affiche début → fin, l’heure de fin étant calculée d’après la durée de la sortie, et « Plus d'options » contient « Modifier », « Retirer du jour », « Retirer de l’itinéraire » et « Enregistrer dans une collection ».",
  'help.guide.tour-show-list.step.5': 'Cliquez sur « Lieux » dans le même sélecteur pour revenir à la liste des lieux.',
  'help.guide.tour-add-to-day.step.2':
    'Choisissez le jour. Le menu liste tous les jours du voyage avec leur date et leur titre ; un jour qui contient déjà la sortie est grisé.',
  'help.guide.tour-add-to-day.result':
    'La sortie apparaît sous son jour, et son tracé fait partie de ce jour sur la carte.',
  'help.guide.tour-day-times.tip.2':
    'Un jour qui contient une étape d’une sortie sur plusieurs jours n’a pas d’heure de fin calculée, car la durée de la sortie correspond à l’itinéraire complet.',
  'help.guide.tour-remove-from-day.step.3':
    'Vous pouvez aussi cliquer sur l’en-tête du jour pour l’ouvrir, cliquer sur la sortie dans la liste, puis sur « Retirer du jour » en bas de sa fiche.',
  'help.guide.tour-filter-list.step.3':
    'Si la liste en mélange plusieurs, « Source » (TREK, « Import GPX », wanderer), « Limite d’itinéraire » (T1 à T6) et « Type » (« Randonnée », « Sortie à vélo », etc.) permettent de l’affiner. Cliquez de nouveau sur une valeur cochée pour l’annuler.',
  'help.guide.tour-hide-on-map.step.1':
    'Survolez une sortie dans la liste et cliquez sur l’œil qui apparaît à droite de sa ligne (« Masquer sur la carte »).',
  'help.guide.tour-import-plan-tab.step.1':
    'Dans l’onglet « Prévu », cliquez sur « Sorties » dans le sélecteur en haut de la colonne de droite.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Cliquez sur une sortie dans la liste « Sorties » (passez d’abord la colonne de droite de « Lieux » à « Sorties »), sur sa ligne dans une journée ou sur son tracé : sa fiche s’ouvre par-dessus la carte. La carte reste utilisable tant que la fiche est ouverte.',
  'help.guide.tour-detail-read.step.2':
    'L’en-tête affiche le nom de la sortie et un résumé en pastilles : le type de sortie, sa provenance si elle a été importée, la durée prévue, la distance, le dénivelé positif et le dénivelé négatif.',
  'help.guide.tour-detail-read.tip.3':
    'Certaines sorties affichent davantage : une balade urbaine ses étapes, une sortie en pagaie ses vérifications et le vent, une sortie déjà faite sa « Trace réelle », et une sortie liée à une liste sa « Liste de bagages ».',
  'help.guide.tour-rename-colour.step.3':
    'Cliquez sur la pastille de couleur au coin de la tuile ronde de la sortie, « Couleur de la trace ». La section « Couleur de la trace » s’ouvre sous l’en-tête.',
  'help.guide.tour-take-along.step.2':
    'Si la sortie a une page web, le bouton à côté affiche le nom du site (Komoot, AllTrails, Outdooractive ou Wanderer), ou « Site web » pour tout autre site. Il ouvre la page dans un nouvel onglet.',
  'help.guide.tour-copy-keep.goal':
    'Créer une variante d’une sortie dans ce voyage, ou la conserver dans l’une de vos collections pour de futurs voyages.',
  'help.guide.tour-copy-keep.tip.4':
    '« Collection » n’apparaît que si l’extension Collections est activée. Une liste en lecture seule ne peut pas être choisie et, si vous n’avez encore aucune liste, la boîte de dialogue propose « Ouvrir les collections ».',
  'help.guide.tour-packing-link.step.5':
    'Cliquez sur « Ouvrir la liste de bagages » pour cocher des articles. TREK passe à l’onglet « Listes », sur la liste de bagages.',
  'help.guide.tour-files.step.2': 'La ligne en dessous affiche désormais leur nombre, et la liste se déplie.',
  'help.guide.tour-activity-link.step.2':
    'Sous « Réalisée le », vérifiez le jour où vous l’avez faite. Choisissez « Sans jour » si elle ne correspond à aucun.',
  'help.guide.tour-activity-compare.title': 'Comparer le programme avec ce que vous avez fait',
  'help.guide.tour-activity-compare.result':
    'Vous comparez rapidement la journée au programme, sur la fiche comme sur la carte.',
  'help.guide.tour-origin-check.tip.3':
    '« Aucune connexion wanderer » signifie que votre compte n’est pas encore connecté. Connectez-le dans Paramètres, sous « Intégrations ».',
  'help.ctx.trip-tour-planner.bullet.5':
    '« Rechercher un lieu ou une adresse », en haut de la carte, déplace la carte. La pastille en bas à gauche permet de passer d’un fond de carte à l’autre parmi ceux que propose le type de sortie, comme Topo ou Satellite, et regroupe les interrupteurs de la sortie ouverte, comme « Placer des points » et 3D.',
  'help.guide.tour-open-workspace.step.5':
    '« Rechercher un lieu ou une adresse », en haut de la carte, centre la carte sur un lieu, pour commencer là où se trouve la sortie.',
  'help.guide.tour-draw-route.goal':
    'Placer les points d’une nouvelle sortie sur la carte et laisser TREK calculer l’itinéraire entre eux.',
  'help.guide.tour-draw-route.tip.2':
    'Topo ou « Randonnée », dans la pastille de la carte, affichent les chemins, ce qui permet de cliquer plus facilement dessus. Un point trop éloigné de toute voie utilisable par ce type reçoit un avertissement au lieu d’un itinéraire.',
  'help.guide.tour-type-profile.step.3':
    'Une sortie à vélo demande son « Profil » sous le type : « Voyage », « Route », Gravel ou « VTT ». La ligne en dessous indique ce que privilégie le profil.',
  'help.guide.tour-edit-points.step.2':
    'Cliquez sur une ligne sous « Points de passage » pour sélectionner son point. Son épingle est mise en évidence sur la carte.',
  'help.guide.tour-shaping-points.title': 'Modifier l’itinéraire avec un point de guidage',
  'help.guide.tour-shaping-points.tip.3':
    'Sur une sortie à cheval, un clic sur le tracé n’ajoute rien, car aucun calcul d’itinéraire ne le façonne.',
  'help.guide.tour-loop-reverse.tip.2':
    'Supprimez la ligne « Retour au départ » pour revenir à une sortie aller simple. Un tronçon tracé à la main le reste quand la sortie est inversée.',
  'help.guide.tour-leg-by-hand.step.4':
    '« Recalculer le tronçon suivant » relance le calcul d’itinéraire pour ce seul tronçon, sans toucher aux autres.',
  'help.guide.tour-trip-places.step.3':
    'Cliquez sur un lieu. Il est ajouté comme nouvelle arrivée de la sortie, et la liste reste ouverte pour le suivant.',
  'help.guide.tour-details-times.step.1':
    '« Nom de la sortie », en haut du volet de gauche, contient le nom. Sur une nouvelle sortie, le texte grisé, « Randonnée sans titre » par exemple, n’est qu’un exemple : saisissez votre propre nom.',
  'help.guide.tour-save.title': 'Enregistrer une sortie',
  'help.guide.tour-save.tip.3':
    '« Enregistrer » ne fonctionne pas non plus tant qu’un champ contient une valeur non valide, comme un site web qui n’est pas une adresse. « Détails » s’ouvre automatiquement pour vous le montrer.',
  'help.guide.tour-edit-saved.tip.1': '« Enregistrer » reste grisé sur une sortie que vous n’avez pas modifiée.',
  'help.guide.tour-summary-profile.step.3':
    'Déplacez le pointeur le long du « Profil altimétrique ». Il indique la distance et l’altitude à cet endroit, et un point marque le même endroit sur la carte.',
  'help.guide.tour-list-manage.step.1':
    '« Totaux du voyage » se trouve au-dessus de la liste. Replié, il indique le nombre de sorties et combien sont « Prévu » et « Non planifiés ». La flèche à droite affiche une ligne par type avec le total de la distance, du dénivelé positif, du dénivelé négatif et des durées.',
  'help.guide.tour-list-manage.result':
    'Vous voyez les totaux des sorties affichées par le filtre, et chaque sortie est placée sur le jour voulu.',
  'help.guide.tour-delete.result': 'La sortie a disparu de la liste, de la carte et de tous les jours.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'C’est la même chose si vous avez modifié la sortie sur un autre appareil. Une sortie que vous n’avez pas modifiée se recharge simplement, et une remarque le signale.',
  'help.ctx.trip-tour-import.bullet.5':
    'Une fois wanderer connecté dans Paramètres, Intégrations, un bouton wanderer apparaît à côté de « Planifier une nouvelle sortie » tant qu’aucune sortie n’est ouverte. Il liste vos propres sentiers à importer.',
  'help.guide.tour-import-gpx.tip.1':
    'Vous pouvez aussi faire glisser les fichiers depuis votre ordinateur et les déposer sur l’onglet « Sorties ». Le même aperçu s’ouvre.',
  'help.guide.tour-view-import.step.1':
    'Dans l’onglet « Sorties », cliquez sur une sortie portant le badge « Import GPX » dans « Sorties de ce voyage ».',
  'help.guide.tour-plan-from-import.goal':
    'Obtenir des points de passage modifiables à partir d’une trace enregistrée, et voir dans quelle mesure le nouvel itinéraire la suit.',
  'help.guide.tour-plan-from-import.tip.4':
    'Une « Randonnée équestre » n’a pas de version modifiable : elle est conservée telle qu’elle a été parcourue.',
  'help.guide.tour-restore-recorded.tip.2':
    'Une sortie créée avec « Planifier comme nouvelle sortie » n’a pas de trace enregistrée propre. L’import dont elle provient figure toujours dans la liste.',
  'help.guide.tour-take-over.step.5': 'Si vous le souhaitez, donnez-lui un autre nom dans « Nom dans ce voyage ».',
  'help.guide.tour-import-wanderer.step.1':
    'Dans l’onglet « Sorties », sans sortie ouverte, cliquez sur wanderer à côté de « Planifier une nouvelle sortie ».',
  'help.guide.tour-import-wanderer.result':
    'Le sentier devient une sortie du voyage et s’ouvre sur la carte en tant que sortie wanderer.',
  'help.guide.tour-map-layers.title': 'Choisir le fond de carte d’une sortie',
  'help.guide.tour-map-layers.tip.3':
    'Une sortie en pagaie et une balade urbaine ne proposent que « Carte » et Satellite ; une course, une sortie à ski et une sortie à cheval proposent « Carte », Topo et Satellite.',
  'help.guide.tour-along-search.result':
    'Les lieux le long de l’itinéraire figurent dans la liste et sur la carte, prêts à être consultés.',
  'help.guide.tour-along-add-stop.step.3':
    'Cliquez sur « Ajouter comme arrêt ». Le badge à côté donne une estimation approximative du détour, mesurée à vol d’oiseau.',
  'help.guide.tour-3d-terrain.step.1':
    'Ouvrez une sortie dans l’onglet « Sorties » et cliquez sur 3D au bout de la pastille en bas à gauche. La carte s’incline et affiche le relief en 3D, avec l’itinéraire tracé dessus.',
  'help.guide.tour-3d-terrain.tip.3':
    'Le relief nécessite une connexion : ses altitudes proviennent des tuiles de terrain libres Mapzen. Une sortie en pagaie est tracée dans sa propre couleur, sans pente, puisque l’eau est plate.',
  'help.guide.tour-3d-flyover.tip.1':
    'Pendant le survol, utilisez la molette de la souris pour zoomer ou dézoomer ; la caméra reste centrée sur le point. Vous ne pouvez pas faire glisser la carte tant que le survol n’est pas en pause.',
  'help.guide.tour-map-overlays.step.4':
    'Sur une sortie en pagaie, la pastille propose plutôt « Balisage maritime ». Cliquez dessus pour afficher les bouées, balises et marques de port sur l’eau.',
  'help.ctx.trip-tour-stages.bullet.2':
    '« Terminer l’étape ici », dans le menu « Plus d’actions » d’un arrêt, termine une étape à cet arrêt. « Points de passage » affiche alors un titre « Étape N » pour chaque étape, avec sa distance et sa durée, et l’arrêt qui termine une étape porte une icône de lune.',
  'help.guide.tour-multi-day.step.3':
    'Survolez l’arrêt où se termine le premier jour, cliquez sur « Plus d’actions » et choisissez « Terminer l’étape ici ».',
  'help.guide.tour-multi-day.result':
    'Un seul itinéraire avec ses étapes, chacune mesurée séparément. Cliquez sur « Enregistrer » pour les conserver.',
  'help.guide.tour-stages-on-days.step.6':
    'La flèche à côté, « Ouvrir cette étape dans le planificateur », ouvre la sortie dans l’éditeur sur cette étape.',
  'help.ctx.trip-tour-hike.bullet.1':
    '« Type de sortie », en haut de l’éditeur, détermine comment l’itinéraire est calculé. « Randonnée » utilise les sentiers jusqu’à la « Difficulté maximale du sentier » définie sous « Détails » ; « Course à pied » utilise les voies praticables en courant et demande votre « Allure prévue ».',
  'help.guide.tour-hike-plan.step.1':
    'Cliquez sur « Planifier une nouvelle sortie » en haut de la colonne de gauche. L’éditeur s’ouvre sur « Nouvelle sortie ».',
  'help.guide.tour-hike-plan.tip.2':
    "À partir de T4, TREK demande d’abord « Activer le calcul d'itinéraires alpins ? ». Ne confirmez que si l’itinéraire peut traverser un terrain exposé ou non balisé ; la question n’est posée qu’une fois par session de modification.",
  'help.guide.tour-hike-trail-details.step.4':
    'Cliquez sur une cotation de la liste pour n’afficher que ces portions sur la carte. Cliquez de nouveau pour afficher tout l’itinéraire.',
  'help.guide.tour-hike-round.step.1':
    'Avec la randonnée ouverte, cliquez sur « Boucle depuis le départ » dans l’en-tête de la carte « Points de passage ». Depuis une autre étape, ouvrez son menu « Plus d’actions » et choisissez « Boucle depuis ici ».',
  'help.guide.tour-hike-round.tip.3':
    '« Chercher à nouveau » revient au choix de la distance, et « Annuler » ferme la carte sans rien modifier.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Seules les randonnées proposent cette option, et uniquement pour un tronçon calculé, pas pour un tronçon tracé à la main.',
  'help.guide.tour-ferrata-add.step.4':
    'Dans « Points de passage », le tronçon entre ces deux points affiche le nom, la cotation et la longueur de la via ferrata.',
  'help.guide.tour-run-plan.goal':
    'Planifier une course sur des voies praticables en courant et obtenir sa durée d’après votre allure.',
  'help.guide.tour-run-plan.tip.2':
    'Les montées, les descentes et la technicité du terrain ne sont pas prises en compte : la durée est simplement la distance multipliée par l’allure.',
  'help.guide.tour-run-ways.result':
    'Vous savez avant de partir quelles portions de la course ne sont pas goudronnées.',
  'help.ctx.trip-tour-walk.bullet.4':
    "« Le long de l'itinéraire » trouve des sites à voir par « Thème de la balade » dans un rayon donné autour de l’itinéraire, et « Ajouter comme arrêt » en intègre un à la balade à l’endroit de votre choix.",
  'help.guide.tour-walk-plan.step.5':
    "Réglez « Importance de l'étape » sur « Normale », « Facultatif » ou « Incontournable ». Activez « Protégée » pour une étape qui doit rester à sa place si une modification est proposée plus tard, puis cliquez sur « Enregistrer ».",
  'help.guide.tour-walk-sights.step.1':
    "Avec une balade urbaine ouverte, repérez « Le long de l'itinéraire » dans la colonne de gauche et choisissez un « Thème de la balade » : « Culture et histoire », « Parcs et points de vue », « Cuisine et vie locale » ou « Un peu de tout ».",
  'help.guide.tour-walk-sights.result':
    'Le site devient une étape de la balade, intégrée à l’itinéraire entre les étapes choisies.',
  'help.guide.tour-walk-day-times.tip.2':
    'Si une étape n’a pas encore de durée d’arrêt, les heures d’arrivée suivantes sont indiquées comme les plus tôt possibles.',
  'help.guide.tour-walk-google-import.step.3':
    'Vérifiez « Étapes du lien ». Une étape sans position dans le lien est signalée et ignorée.',
  'help.guide.tour-walk-check-off.step.1':
    'Dans l’onglet « Prévu », cliquez sur la balade urbaine dans sa journée. Sa fiche s’ouvre à côté de la carte.',
  'help.ctx.trip-tour-bike.title': 'Sorties à vélo',
  'help.guide.tour-bike-profile.step.1':
    'Dans l’onglet « Sorties », cliquez sur « Planifier une nouvelle sortie » en haut du volet de gauche.',
  'help.guide.tour-bike-profile.tip.2':
    'Un profil ne fait qu’orienter le calcul d’itinéraire. Il ne dit pas si une voie est praticable : la carte « Revêtement et voies » montre sur quoi roule l’itinéraire.',
  'help.guide.tour-bike-surfaces.step.3':
    'Sous « Revêtement », cliquez sur une ligne comme Gravel ou « Sol naturel ». Ses portions sont mises en évidence sur la carte. Cliquez de nouveau sur la ligne pour annuler la mise en évidence.',
  'help.guide.tour-bike-mtb-grades.goal':
    'Connaître la difficulté des sentiers d’une sortie en VTT avant de les emprunter.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Si vous changez le « Profil » pour autre chose que « VTT », les sections de difficulté disparaissent. L’itinéraire est alors recalculé pour le nouveau profil.',
  'help.guide.tour-ski-plan.title': 'Planifier une sortie de ski ou d’hiver',
  'help.guide.tour-ski-plan.tip.1':
    'Pour le « Ski de fond », choisissez aussi la « Technique » : « Classique », Skating ou « Inconnue ». La remarque sous les champs indique ce qui manque encore.',
  'help.guide.tour-ski-options.step.2':
    'Ouvrez « Pistes les plus difficiles » et choisissez le niveau le plus élevé que vous voulez skier, de « Débutant » à Expert. « Intermédiaire » est la valeur par défaut.',
  'help.guide.tour-ski-fix-leg.title': 'Corriger un tronçon de ski impossible à calculer',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Tant que tous les tronçons ne sont pas calculés, la carte « Itinéraire sur pistes » indique qu’il n’y a pas encore de temps de ski.',
  'help.guide.tour-ski-summary.tip.2':
    '« Temps de ski » reste « Non calculé » tant que tous les tronçons ne sont pas calculés. Pour donner malgré tout une durée à la sortie, saisissez un total prévu dans ses détails.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'La légende présente les pistes de descente par difficulté, les pistes de ski de fond, les sentiers piétons et raquettes, les pistes de luge et les remontées mécaniques. « Légende complète sur OpenSnowMap » ouvre la légende complète.',
  'help.guide.tour-ski-import.step.2':
    "Dans l’« Aperçu de l'import », ouvrez « Importer comme » et choisissez « Ski et hiver ».",
  'help.guide.tour-ski-import.result':
    'La trace figure dans « Sorties de ce voyage », avec sa discipline et sa technique sur sa carte « Trace de ski ».',
  'help.ctx.trip-tour-paddle.bullet.6':
    '« La pagaie comporte des risques », la ligne en bas de la colonne de gauche, ouvre « Sécurité sur l’eau ». La carte propose « Carte » et Satellite, ainsi que « Balisage maritime » en surcouche.',
  'help.guide.tour-paddle-setup.step.6':
    '« Vitesse de pagaie » affiche en gris la vitesse suggérée pour l’embarcation. Saisissez la vôtre et le champ indique « Vitesse choisie » ; le lien en dessous, « Utiliser la suggestion », rétablit la vitesse de l’embarcation.',
  'help.guide.tour-paddle-water-route.goal':
    'Laisser TREK calculer un tronçon sur la rivière ou le lac, et comprendre les remarques sur un tronçon qu’il n’a pas pu calculer.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Les remarques sous un tronçon calculé signalent « Eaux vives » avec leur classe, une « Passe à canoës » ou une « Lacune dans les données cartographiques » comblée par une ligne droite.',
  'help.guide.tour-paddle-portage.step.4':
    'Sous « Itinéraire », « Suivre le chemin » emprunte une voie cartographiée et « Ligne droite » coupe tout droit. TREK cherche le chemin de lui-même et vous prévient s’il n’en existe pas sans long détour.',
  'help.guide.tour-paddle-lock.step.1':
    'Survolez l’arrêt situé à l’écluse et cliquez sur « Plus d’actions », les trois points.',
  'help.guide.tour-paddle-time.title': 'Consulter et ajuster la durée d’une sortie en pagaie',
  'help.guide.tour-paddle-time.tip.2': 'Le courant et le vent ne sont pas pris en compte dans l’estimation.',
  'help.guide.tour-paddle-wind.step.4':
    'Ouvrez « Ce que le vent change pour la pagaie » pour savoir comment le vent de face, le vent de travers, les traversées à découvert et les rafales agissent sur une embarcation.',
  'help.guide.tour-paddle-checklist.step.1':
    'Enregistrez la sortie en pagaie, puis repérez « Liste de contrôle » dans la colonne de gauche. Le badge de son en-tête résume l’état de la liste.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Les obstacles proviennent des données OpenStreetMap des régions disponibles dans TREK. Là où il n’y en a pas, la carte le signale, et c’est à vous de vérifier barrages, écluses et portages.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Cliquez sur la trace dans « Sorties de ce voyage ». La colonne de gauche l’affiche telle qu’elle a été enregistrée, avec la carte « Portages et écluses ».',
  'help.ctx.trip-tour-horse.title': 'Sorties à cheval',
  'help.guide.tour-horse-plan.goal':
    'Composer une sortie à cheval à partir de tronçons d’itinéraires équestres balisés, dans la vue carte.',
  'help.guide.tour-horse-plan.result':
    'La sortie suit les tronçons choisis, chacun avec le nom de son itinéraire, son indicateur d’accès et sa longueur, et elle figure dans « Sorties de ce voyage ».',
  'help.guide.tour-horse-gap.step.1':
    'Une fois un tronçon ajouté à la sortie, ouvrez un autre itinéraire et choisissez un tronçon qui ne touche pas la fin de votre sortie. Sous « Raccord à votre randonnée », une remarque indique la distance qui les sépare.',
  'help.guide.tour-horse-recorded.title': 'Conserver une sortie enregistrée depuis un fichier GPX',
  'help.guide.tour-horse-recorded.tip.2':
    'Un fichier sans altitudes affiche « Aucune altitude dans le fichier » au lieu d’un dénivelé nul.',
  'help.guide.dateless-trip.tip.1':
    'Dès que vous connaissez vos dates, ouvrez le formulaire avec le crayon de la carte et choisissez-les. Vos jours planifiés gardent leur ordre et reçoivent les dates dans cet ordre.',
  'help.guide.trip-reminder.goal': 'Recevoir un rappel quelques jours avant le départ.',
  'help.guide.upcoming-reservations.tip.2':
    '« En attente » signale une réservation pas encore confirmée. Les réservations annulées et les voyages archivés ne sont pas affichés.',
  'help.guide.half-company-holiday.tip.1':
    'Les congés déjà saisis ce jour-là sont ramenés à une demi-journée. Toute personne qui saisit ce jour plus tard ne décompte que 0,5 jour.',
  'help.guide.edit-holiday-calendar.goal':
    'Renommer, changer la couleur, déplacer ou supprimer un calendrier de jours fériés ou de vacances scolaires que vous avez ajouté.',
  'help.guide.person-color.title': 'Changer la couleur d’une personne',
  'help.guide.answer-fusion-request.tip.1':
    'La demande reste ouverte tant que vous n’y avez pas répondu. S’il y en a plusieurs, elles s’affichent l’une après l’autre.',
  'help.guide.log-for-partner.tip.1':
    '« Demi-journée » et « Récup / RTT » fonctionnent aussi pour la personne sélectionnée.',
  'help.guide.dissolve-fusion.tip.2':
    'Pour que quelqu’un puisse seulement voir vos jours, partagez plutôt votre calendrier.',
  'help.guide.country-details.tip.2':
    'Cliquez sur le badge « Lieux » pour voir tous les lieux comptés pour le pays, regroupés par voyage.',
  'help.guide.country-places.tip.2':
    'Le badge n’apparaît que si le pays a ses propres lieux. Un pays que vous avez seulement marqué à la main n’en a aucun.',
  'help.guide.tour-activity-stats.goal':
    'Consulter la distance, le dénivelé et le nombre de sorties effectuées sur l’ensemble de vos voyages, par période et par type, et exclure une sortie qui n’a pas eu lieu.',
  'help.guide.tour-activity-stats.tip.1':
    'Une sortie est comptée une fois son dernier jour passé. Une sortie sur aucun jour, ou uniquement sur des jours sans date, n’est jamais comptée. Pour qu’elle le soit, placez-la sur un jour daté de son voyage.',
  'help.guide.move-to-list.result':
    'Les lieux figurent dans l’autre liste, et un court message indique combien ont été déplacés ou dupliqués.',
  'help.guide.accept-list-invite.tip.1':
    'Ce que vous pouvez faire dans la liste dépend du rôle que le propriétaire vous a attribué : « Lecteur », « Éditeur » ou Admin.',
  'help.guide.tour-collection-add-to-trip.title': 'Ajouter à un voyage une sortie d’une liste',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Pour conserver une sortie dans une liste, ouvrez une sortie enregistrée dans le voyage et cliquez sur « Collection » en bas de sa fiche.',
  'help.guide.tour-collection-manage.tip.2':
    'Seuls le propriétaire et les administrateurs de la liste voient la corbeille.',
  'help.guide.entry-draft.result':
    'L’entrée reste dans votre chronologie, marquée « Brouillon », et n’apparaît pas sur le lien partagé.',
  'help.guide.journey-map-layers.title': 'Choisir ce qu’affiche la carte du journal',
  'help.guide.journey-keep-route.title': 'Conserver le trajet enregistré d’une journée',
  'help.guide.journey-day-stays.title': 'Rédiger des entrées à partir des séjours enregistrés par Dawarich',
  'help.guide.journey-take-over-day.title': 'Reprendre toute une journée enregistrée',
  'help.guide.journey-take-over-day.result':
    'La journée compte maintenant un brouillon par séjour ou par groupe fusionné, ou un seul récit du jour, et ses séjours ne sont plus listés comme en attente.',
  'help.guide.journey-auto-prepare.result':
    'Pendant un voyage lié, les séjours de chaque jour sont listés à leur jour, prêts pour « Reprendre la journée ».',
  'help.ctx.settings-about.title': 'À propos',
  'help.guide.web-push-device.tip.3':
    'Le push nécessite que TREK soit ouvert en HTTPS. Si les notifications sont bloquées, autorisez-les dans les paramètres du navigateur et réessayez.',
  'help.guide.connect-airtrail.result':
    'Le badge affiche « Connecté », et l’onglet « Transports » d’un voyage propose « Importer depuis AirTrail ».',
  'help.guide.connect-dawarich.result':
    'Le badge affiche « Connecté », et le planificateur de voyage, le journal et Atlas peuvent proposer ce que Dawarich a enregistré.',
  'help.guide.tour-connect-wanderer.result':
    'Le badge affiche « Connecté », et l’onglet « Sorties » d’un voyage permet de chercher dans votre wanderer et d’en importer les sentiers.',
  'help.guide.tour-wanderer-watch.result':
    'TREK vérifie vos sentiers importés et vous prévient si l’un d’eux a pu changer. Une sortie n’est modifiée que si vous acceptez le changement.',
  'help.guide.plugin-settings.step.1':
    'Ouvrez « Plugins » dans la barre latérale des paramètres. Sous « Paramètres des modules », chaque plugin qui a besoin de réglages de votre part a une carte avec ses champs : remplissez-les et cliquez sur « Enregistrer ». Les actions de la carte s’exécutent après votre confirmation.',
  'help.guide.profile.step.3': 'Cliquez sur « Enregistrer le profil » à droite, en bas de la carte.',
  'help.guide.default-user-settings.title': 'Définir les réglages de départ des nouveaux utilisateurs',
  'help.guide.own-routing-engine.tip.1':
    'Les serveurs OSRM publics acceptent environ une requête par seconde. C’est suffisant pour une journée, mais parfois trop lent pour un road trip.',
  'help.guide.admin-passkeys.goal':
    'Permettre aux utilisateurs de se connecter avec leur empreinte, leur visage ou le code PIN de leur appareil.',
  'help.guide.rotate-jwt-secret.tip.2':
    "Pour déconnecter une seule personne, attribuez-lui plutôt un « Nouveau mot de passe » dans « Modifier l'utilisateur ». Seules ses sessions sont alors fermées.",
  'help.guide.notification-defaults.goal':
    'Définir les notifications de départ de chaque utilisateur, et bloquer complètement un canal pour un événement.',
  'help.ctx.notifications.summary':
    'Toutes les notifications que TREK vous a affichées dans l’application, des plus récentes aux plus anciennes : une réservation modifiée par quelqu’un, un nouveau message dans la discussion d’un voyage, un calendrier partagé avec vous. La cloche en haut à droite affiche les dix plus récentes, cette page les affiche toutes.',
  'help.guide.read-notifications.step.1':
    'Cliquez sur la cloche en haut à droite. Le chiffre rouge indique le nombre de notifications non lues.',
  'help.guide.filter-notifications.step.1': 'Cliquez sur la cloche en haut à droite.',
  'help.guide.mark-notifications-read.step.2':
    'Cliquez sur « Tout marquer comme lu » en haut pour marquer toutes les notifications comme lues d’un coup.',
  'help.guide.delete-notifications.tip.1':
    'La suppression ne concerne que vous. La réservation, le message ou le partage concerné reste inchangé.',
  'help.guide.notification-settings.tip.1':
    'Un cadenas dans une case signifie que l’administrateur a désactivé cet événement pour tout le monde.',
  'help.guide.add-guest.tip.3':
    'Seul le propriétaire du voyage peut ajouter, renommer et retirer des invités. Un invité qui a payé une dépense ne peut pas être retiré tant que vous n’avez pas changé le payeur ou supprimé le paiement.',
  'help.guide.link-journal.tip.1':
    'Vous ne pouvez lier que les journaux dont vous êtes propriétaire. Un journal dans lequel vous pouvez seulement écrire ne peut pas être lié.',
  'help.ctx.trip-places.bullet.7':
    'La case à côté de la recherche lance une sélection. La barre en bas de la colonne permet ensuite de donner une nouvelle catégorie à plusieurs lignes d’un coup, de les ajouter à une collection, de les marquer comme visitées ou de les supprimer.',
  'help.guide.filter-places.step.5':
    'Dès que le voyage couvre plusieurs pays ou régions, le globe filtre la liste sur un pays, ou sur une de ses régions, chacun affiché avec son nombre. « Effacer le filtre » revient à « Tous les pays ».',
  'help.guide.import-places-file.tip.3':
    'Quand Sorties est activé, ce qui est le cas par défaut, vous importez un fichier via « Sorties » en haut de la colonne, avec « Importer un GPX ou KML », et ses tracés deviennent des sorties. Les épingles du fichier n’y sont pas importées, car les sorties ne contiennent que des tracés.',
  'help.guide.dawarich-stays.step.3':
    'Vérifiez « Nom », « Arrivée » et « Départ », choisissez un « Jour » ou laissez « Pas encore rattaché à un jour », ajoutez des « Notes » si vous le souhaitez, puis cliquez sur « Ajouter un lieu ».',
  'help.guide.leave-stop-off-route.result':
    'L’étape fait toujours partie de la journée et du PDF ; tant qu’elle est marquée « Hors itinéraire », l’itinéraire va directement de l’étape précédente à la suivante.',
  'help.guide.move-booking-day.tip.2':
    'Au sein de sa propre journée, une réservation horodatée revient toujours à la place correspondant à son heure.',
  'help.guide.place-image-from-file.step.3':
    "Sous « Depuis les fichiers joints », cliquez sur la photo voulue. « Importer depuis l'appareil », au-dessus, permet plutôt d’en choisir une nouvelle sur votre ordinateur.",
  'help.guide.place-own-hours.step.1':
    'Ouvrez le lieu et cliquez sur « Modifier » en bas à droite de la fiche. Le formulaire du lieu s’ouvre.',
  'help.guide.place-own-hours.tip.3':
    'Cliquez sur « Supprimer les horaires », puis sur « Mettre à jour », pour réafficher sur la fiche les horaires trouvés automatiquement.',
  'help.guide.confirm-stay-booking.title': 'Confirmer la réservation d’un séjour',
  'help.guide.confirm-stay-booking.tip.2':
    'La même pastille fonctionne dans toutes les réservations, y compris celles listées sous « Réservations » dans la journée.',
  'help.guide.map-lock.tip.2':
    'Ce navigateur mémorise le verrouillage pour chaque voyage. À l’ouverture d’un voyage, la carte se cadre quand même une fois sur le voyage, pour ne jamais s’ouvrir sur une zone vide.',
  'help.guide.tour-map-lines.step.2':
    'Cliquez sur le tracé, ou sur l’épingle de départ. La fiche de la sortie s’ouvre en bas de la carte, et son tracé s’élargit avec un liseré blanc pour se distinguer des autres. Le X dans l’en-tête de la fiche la ferme.',
  'help.guide.car-stops.title': 'Planifier un trajet en voiture avec des étapes',
  'help.guide.car-stops.result':
    'Le trajet apparaît comme une carte dans l’onglet « Transports » et comme une ligne sur son jour, et son tracé sur la carte va du lieu de prise en charge au lieu de restitution en passant par chaque étape, dans l’ordre.',
  'help.guide.transport-details.step.5':
    '« Sur la carte », en bas des détails, affiche le tracé du trajet et ouvre « Prévu » sur son jour. « Modifier », tout à droite, ouvre le formulaire complet, et la corbeille à côté supprime le trajet après confirmation.',
  'help.guide.export-transports-csv.step.1':
    "Filtrez d’abord la liste si vous n’en voulez qu’une partie. « Rechercher », « Filtrer » et le tri dans « Options d'affichage » sont tous pris en compte : le fichier contient ce qu’affiche l’onglet, dans le même ordre.",
  'help.guide.group-sort-bookings.tip.1':
    "« Cartes » et « Liste » ont chacune leur propre regroupement : « Cartes » démarre sur « Statut », « Liste » sur « Jour ». Un point sur « Options d'affichage » indique que quelque chose diffère du réglage par défaut, et « Réinitialiser l'affichage », en bas du panneau, le rétablit.",
  'help.guide.booking-on-map.step.2': 'Cliquez sur « Sur la carte » en bas des détails.',
  'help.guide.export-bookings-csv.goal':
    'Exporter les réservations du voyage en fichier CSV à ouvrir dans Excel, Numbers ou tout autre tableur.',
  'help.guide.arrange-packing-list.goal':
    'Placer des listes entières et des articles isolés où vous le voulez, ou trier chaque liste par nom.',
  'help.guide.check-off-packing.tip.4':
    'Pour un article en plusieurs exemplaires, vous pouvez aussi marquer les pièces comme emballées une par une. Voir « Emballer plusieurs exemplaires d’un article ».',
  'help.guide.count-packed-pieces.tip.1':
    'Cocher la case emballe toutes les pièces d’un coup, et la décocher les déballe toutes.',
  'help.guide.expense-receipts.goal':
    'Garder le reçu ou la facture avec la dépense correspondante, et le rouvrir depuis le registre.',
  'help.guide.expense-receipts.tip.2':
    'La corbeille à côté d’un reçu le retire de la dépense à l’enregistrement. Le fichier lui-même reste dans « Fichiers » ; supprimez-le là-bas pour l’effacer complètement.',
  'help.guide.files-sync.tip.4':
    'Si la carte affiche un avertissement jaune avec « Reconnecter », le stockage n’accepte plus l’identification enregistrée. Cliquez sur « Reconnecter », saisissez un nouveau mot de passe d’application ou un nouveau jeton, et la synchronisation reprend.',
  'help.guide.files-sync-settings.result':
    'Dès la prochaine exécution, le voyage ne se synchronise que dans le sens choisi, et les suppressions et modifications contradictoires suivent les règles que vous avez définies.',
  'help.guide.manage-notes.result':
    'La note a disparu de la carte « Notes », pour tous les membres à la fois. Une note que vous avez seulement épinglée ou modifiée est conservée, et les autres la voient telle que vous l’avez laissée.',
  'help.guide.note-categories.step.4':
    'Les pastilles de couleur d’une ligne définissent la couleur de la catégorie : Indigo, « Rouge », « Ambre », Émeraude, « Bleu » ou Violet. Ici, « Hébergement » passe en ambre.',
  'help.guide.roadtrip-reorder.step.3':
    'Au clavier, placez le focus sur une étape et appuyez sur Alt avec la flèche haut ou bas pour la déplacer d’un cran dans sa journée.',
  'help.guide.roadtrip-overnight.title': 'Passer une nuit en chemin',
  'help.guide.roadtrip-overnight.tip.1':
    'La nuitée dure jusqu’au lendemain. Pour d’autres dates, modifiez la réservation : changez les dates sous « Jours », avec le reste du séjour.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Seuls les arrêts où votre voiture peut faire le plein affichent le badge : les stations-service pour « Carburant », les bornes de recharge pour « Électrique », les deux pour « Les deux ».',
  'help.guide.roadtrip-bookings.result':
    'Chaque trajet réservé apparaît dans le parcours à l’endroit où il a lieu, et la route avant et après mène à ses terminaux et en repart.',
  'help.guide.roadtrip-google-import.step.1':
    'Cliquez sur les trois points en haut de « Sur le trajet » et choisissez « Importer un itinéraire Google Maps ».',
  'help.guide.roadtrip-hazards.title': 'Afficher les alertes en cours sur la carte',
  'help.guide.roadtrip-hazards.tip.3':
    'Les données sont actualisées toutes les dix minutes et nécessitent une connexion. Comme les autres réglages de conduite, l’interrupteur est enregistré pour le voyage.',
  'help.ctx.trip-tours.bullet.6':
    'La modification d’un itinéraire et la suppression d’une sortie se font dans l’onglet « Sorties », sous « Sorties de ce voyage ».',
  'help.guide.tour-show-list.tip.1':
    'Cliquez sur le tracé d’une sortie sur la carte : la liste met cette sortie en évidence et défile jusqu’à elle.',
  'help.guide.tour-add-to-day.step.3':
    'Le message « Ajoutée au jour 10 » le confirme, la ligne reçoit un badge « Jour », et le jour dans la colonne de gauche affiche la sortie avec sa durée, sa distance et son dénivelé positif.',
  'help.guide.tour-day-times.title': 'Donner une heure de départ à une sortie',
  'help.guide.tour-day-times.tip.3':
    '« Retirer de l’itinéraire », dans le même menu, garde la sortie dans la journée mais l’exclut de l’itinéraire du jour sur la carte. « Remettre dans l’itinéraire » annule cette action.',
  'help.guide.tour-remove-from-day.tip.1':
    'Une sortie sur plusieurs jours se retire jour par jour, car chaque jour a sa propre étape.',
  'help.guide.tour-filter-list.step.4':
    'Fermez le menu. Le bouton affiche maintenant le statut, le nombre de sorties restantes et +1 pour chaque filtre supplémentaire.',
  'help.guide.tour-hide-on-map.step.2':
    'Le tracé de la sortie est masqué sur la carte. Sa ligne reste dans la liste, estompée, avec un œil barré (« Afficher sur la carte »). Cliquez dessus pour réafficher le tracé.',
  'help.guide.tour-import-plan-tab.step.2':
    'Cliquez sur « Importer un GPX ou KML » en haut de la liste et choisissez vos fichiers (GPX, KML ou KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'L’en-tête affiche la tuile ronde de la sortie, son nom avec un crayon pour le renommer, une pastille pour la couleur de son tracé, et des pastilles pour le type, la provenance, la durée prévue, la distance, le dénivelé positif et le dénivelé négatif. Le X à droite ferme la fiche, tout comme la touche Échap.',
  'help.guide.tour-detail-read.step.3':
    'Survolez la durée pour voir son détail : le temps en mouvement, les pauses et le total prévu.',
  'help.guide.tour-detail-read.tip.4':
    'La fiche ne modifie pas l’itinéraire. Pour déplacer un point ou retracer un tronçon, ouvrez l’onglet « Sorties » et cliquez sur la sortie sous « Sorties de ce voyage ».',
  'help.guide.tour-rename-colour.step.4':
    'Choisissez une couleur. « Couleur automatique », la première case, rétablit la couleur par défaut du tracé, et « Choisir une couleur personnalisée », la dernière, permet de choisir n’importe quelle couleur. Le tracé sur la carte et la bande dans la liste « Sorties » changent immédiatement.',
  'help.guide.tour-take-along.step.3':
    'Cliquez sur GPX pour télécharger la sortie enregistrée en fichier GPX : tout son itinéraire avec ses altitudes, prêt pour une application de navigation ou un appareil GPS.',
  'help.guide.tour-copy-keep.step.1':
    'Ouvrez la fiche de la sortie et cliquez sur « Copier » en bas. TREK crée une nouvelle sortie indépendante, sans ses jours, et l’originale reste inchangée.',
  'help.guide.tour-copy-keep.result':
    'Le voyage contient une seconde sortie que vous pouvez modifier librement, et la collection a sa propre copie, prête à être ajoutée à un autre voyage.',
  'help.guide.tour-packing-link.tip.1':
    'Il s’agit seulement d’un lien. Rien n’est copié ni déplacé, et les articles restent dans « Listes ». Cochez-en un là-bas, et la sortie l’affiche aussitôt.',
  'help.guide.tour-files.step.3': 'Cliquez sur un fichier pour l’ouvrir.',
  'help.guide.tour-activity-link.step.3':
    'Choisissez l’enregistrement sous « Trace », ou cliquez sur « Importer un GPX » pour ajouter un nouveau fichier.',
  'help.guide.tour-activity-compare.goal': 'Voir où la trace réelle s’écarte du programme, et la changer ou la délier.',
  'help.guide.tour-origin-check.title': 'Connaître la provenance d’une sortie',
  'help.guide.tour-origin-check.result': 'Vous savez d’où vient la sortie, depuis quand, et si elle a changé depuis.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Un brouillon non enregistré est conservé : rouvrez l’onglet « Sorties » et il est restauré, avec la mention « Brouillon non enregistré restauré ». « Retour aux sorties » et « Ignorer » demandent confirmation avant d’abandonner des modifications.',
  'help.guide.tour-open-workspace.step.6':
    'La pastille en bas à gauche change de fond de carte, « Carte » ou Satellite au départ. Quand une sortie est ouverte, elle propose les fonds adaptés à son type, comme Topo ou « Randonnée », ainsi que des interrupteurs comme « Placer des points » et 3D.',
  'help.guide.tour-draw-route.step.1':
    'Cliquez sur « Planifier une nouvelle sortie » en haut du volet de gauche. Le volet passe sur « Nouvelle sortie », une randonnée sauf si vous choisissez un autre type.',
  'help.guide.tour-draw-route.tip.3':
    'Si un brouillon comporte des modifications non enregistrées, « Planifier une nouvelle sortie » dans le menu « Ajouter une sortie » demande d’abord « Commencer une nouvelle sortie ? », avec « Abandonner et commencer ».',
  'help.guide.tour-type-profile.step.4':
    'L’itinéraire est recalculé selon le profil, et « Résumé de la sortie », à droite, affiche sa distance et sa durée.',
  'help.guide.tour-edit-points.step.3':
    'Pour changer l’ordre, survolez une ligne et faites-la glisser par la poignée qui apparaît sur son bord gauche.',
  'help.guide.tour-shaping-points.goal': 'Faire passer l’itinéraire par un autre chemin sans ajouter d’étape.',
  'help.guide.tour-shaping-points.result':
    'L’itinéraire passe là où vous l’avez fait glisser, et les étapes gardent leur numérotation.',
  'help.guide.tour-loop-reverse.tip.3':
    'Sur une randonnée, « Boucle depuis le départ », juste à côté, cherche des boucles de la longueur de votre choix.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Aucun calcul d’itinéraire n’a vérifié un tronçon tracé à la main : il peut traverser de l’eau, une propriété privée ou une falaise.',
  'help.guide.tour-trip-places.step.4':
    'Sa ligne affiche « Lieu du voyage » sous le nom. « Détacher du lieu », dans « Plus d’actions », conserve le point mais supprime le lien.',
  'help.guide.tour-details-times.step.2':
    'Sous « Détails », rédigez une « Description » et ajoutez un « Site web » s’il en existe un.',
  'help.guide.tour-save.goal': 'Conserver dans le voyage la sortie que vous avez tracée.',
  'help.guide.tour-save.result': 'La sortie est enregistrée dans le voyage, prête à être placée sur un jour.',
  'help.guide.tour-edit-saved.tip.2':
    'Une trace GPX ou KML importée s’ouvre en tant que sortie GPX, en consultation. « Planifier une version modifiable » y crée une sortie que vous pouvez modifier.',
  'help.guide.tour-summary-profile.step.4':
    '« Réduire le profil altimétrique », la flèche à côté de son titre, masque le profil ; cliquez de nouveau pour le réafficher.',
  'help.guide.tour-list-manage.step.2':
    'Survolez une sortie et cliquez sur le plus rond de sa ligne, « Ajouter au jour », pour afficher les jours du voyage.',
  'help.guide.tour-delete.title': 'Supprimer une sortie',
  'help.guide.tour-saved-elsewhere.title': 'Si la sortie a été enregistrée ailleurs',
  'help.guide.tour-saved-elsewhere.result':
    'Aucune modification n’est perdue, sauf si quelqu’un choisit de l’abandonner.',
  'help.guide.tour-import-gpx.title': 'Importer un fichier GPX, KML ou KMZ comme sortie',
  'help.guide.tour-import-gpx.tip.2':
    'Chaque trace ou itinéraire d’un fichier devient une sortie distincte. Les traces ne sont jamais fusionnées.',
  'help.guide.tour-view-import.step.2':
    'La colonne de gauche l’affiche en tant que sortie GPX : « Résumé de la sortie » avec sa distance, ses altitudes et sa durée enregistrée, et le profil altimétrique en dessous. La carte affiche son tracé.',
  'help.guide.tour-plan-from-import.step.1':
    'Ouvrez la sortie importée dans l’onglet « Sorties ». Dans la carte « Version modifiable », à gauche, cliquez sur « Planifier une version modifiable ».',
  'help.guide.tour-plan-from-import.result':
    'La sortie a maintenant des points de passage que vous pouvez faire glisser, et son « Origine » indique « Replanifié, tracé enregistré conservé ».',
  'help.guide.tour-restore-recorded.result': 'La sortie redevient une sortie GPX et affiche son tracé d’origine.',
  'help.guide.tour-take-over.step.6': 'Cliquez sur « Reprendre ».',
  'help.guide.tour-import-wanderer.step.2':
    'Tapez dans « Rechercher des sentiers ». « Rechercher dans cette zone de la carte » n’affiche que les sentiers situés dans la partie visible de la carte.',
  'help.ctx.trip-tour-map.title': 'Carte de la sortie',
  'help.guide.tour-map-layers.goal':
    'Planifier sur le fond de carte le mieux adapté au type de sortie : courbes de niveau pour les montées, sentiers balisés ou itinéraires cyclables, ou vue aérienne.',
  'help.guide.tour-along-search.title': 'Trouver des lieux le long d’une sortie',
  'help.guide.tour-along-search.tip.1':
    'Si vous modifiez l’itinéraire, les types de lieux ou la distance, « Chercher à nouveau » est mis en évidence et indique que la liste correspond à l’ancien itinéraire. Cliquez dessus pour mettre la liste à jour.',
  'help.guide.tour-along-add-stop.step.4':
    "L’itinéraire est recalculé en passant par le lieu, et « Le long de l'itinéraire » indique la distance et le temps ajoutés à la sortie. « Annuler », sur la même ligne, retire l’étape.",
  'help.guide.tour-3d-terrain.step.2':
    'L’itinéraire est coloré selon la pente. Cliquez sur « Pente » dans la rangée du bas pour l’afficher plutôt dans la couleur de la sortie, puis de nouveau pour revenir aux pentes.',
  'help.guide.tour-3d-flyover.title': 'Survoler une sortie',
  'help.guide.tour-3d-flyover.tip.2':
    'Le survol ne démarre qu’une fois le relief chargé sur tout l’itinéraire, pour ne pas s’interrompre à mi-parcours. Survolez l’anneau pour voir la progression du chargement.',
  'help.guide.tour-map-overlays.result':
    'Les pistes ou le balisage maritime s’affichent sur la carte, et la légende les explique.',
  'help.ctx.trip-tour-stages.bullet.3':
    '« Résumé de la sortie » liste chaque étape sous « Étapes », de l’arrêt où elle commence à celui où elle se termine. Un clic sur une étape sélectionne son dernier arrêt et marque l’endroit sur le profil altimétrique.',
  'help.guide.tour-multi-day.step.4':
    '« Points de passage » se divise maintenant en « Étape 1 » et « Étape 2 », chacune avec sa distance et sa durée. L’arrêt qui termine une étape affiche une icône de lune.',
  'help.guide.tour-stages-on-days.title': 'Placer une sortie sur plusieurs jours sur les jours du voyage',
  'help.guide.tour-stages-on-days.tip.1':
    'Si le voyage se termine avant la dernière étape, l’option indique la dernière étape qui tient dans le voyage. Les étapes suivantes restent sans jour.',
  'help.ctx.trip-tour-hike.bullet.2':
    '« Points de passage » liste les étapes dans l’ordre. « Ajouter un point » est activé d’emblée : un clic sur la carte place l’étape suivante ; « Lieux du voyage », juste à côté, transforme un refuge ou un hôtel du voyage en étape.',
  'help.guide.tour-hike-plan.step.2':
    'Ouvrez « Type de sortie » et choisissez « Randonnée » : à pied, dans la limite de difficulté que vous fixez.',
  'help.guide.tour-hike-plan.tip.3':
    '« Choix de l’itinéraire », sous la difficulté, définit vos préférences : « Éviter les fortes montées », « Éviter les escaliers » et « Éviter les bacs ». S’il n’y a pas d’autre possibilité, l’itinéraire y passe quand même.',
  'help.guide.tour-hike-trail-details.step.5':
    'Cliquez sur « Revêtement » pour voir le même itinéraire selon le type de sol, de l’asphalte au sol naturel et à la roche.',
  'help.guide.tour-hike-round.step.2':
    'La carte « Randonnée en boucle » s’ouvre par-dessus la carte. Vérifiez le point de départ sous « De » et saisissez la « Distance » voulue. La pastille à côté indique la fourchette de longueurs possible pour une boucle.',
  'help.guide.tour-hike-compare-ways.title': 'Comparer d’autres chemins pour un tronçon de randonnée',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Si le calcul d’itinéraire ne connaît pas d’autre chemin, la carte le signale. S’il ne peut pas suivre le chemin choisi, le tronçon reste inchangé et la carte vous en informe.',
  'help.guide.tour-ferrata-add.step.5':
    '« Résumé de la sortie », à droite, affiche le badge « Parcours via ferrata » avec sa cotation, et l’en-tête de l’éditeur avertit « L’itinéraire passe par une via ferrata ».',
  'help.guide.tour-run-plan.step.1':
    'Cliquez sur « Planifier une nouvelle sortie », ouvrez « Type de sortie » et choisissez « Course à pied ».',
  'help.guide.tour-run-plan.tip.3': 'Si vos distances sont en miles, l’allure s’exprime aussi par mile.',
  'help.guide.tour-run-ways.tip.1': 'Rien ici ne modifie l’itinéraire de la course ni sa durée.',
  'help.ctx.trip-tour-walk.bullet.5':
    '« Ajouter une sortie », dans « Sorties de ce voyage », importe un itinéraire à pied partagé depuis Google Maps. Dans l’onglet « Prévu », une balade ouverte depuis son jour permet de cocher ses étapes pour ce jour.',
  'help.guide.tour-walk-plan.step.6':
    '« Résumé de la sortie », à droite, affiche « Temps estimé », « Séjours » et « Prévu », la somme des deux. Cliquez sur « Enregistrer » en bas de la colonne de gauche pour conserver la balade.',
  'help.guide.tour-walk-sights.step.2':
    "Le thème remplit « Quoi chercher ». Ouvrez-le pour cocher ou décocher des types de lieux, et choisissez le rayon de recherche sous « À cette distance de l'itinéraire ».",
  'help.guide.tour-walk-day-times.title': 'Voir les heures d’arrivée et les horaires d’ouverture de la journée',
  'help.guide.tour-walk-day-times.tip.3':
    'Les horaires d’ouverture proviennent d’OpenStreetMap ou du lieu du voyage auquel l’étape correspond, et la pastille à côté indique la source. Vérifiez-les avant de partir.',
  'help.guide.tour-walk-google-import.step.4':
    'Cliquez sur « Charger comme balade ». TREK calcule lui-même l’itinéraire à pied entre les étapes. Cliquez sur « Enregistrer » pour conserver la balade.',
  'help.guide.tour-walk-check-off.step.2':
    'Faites défiler jusqu’à « Étapes de la balade ». Chaque étape indique la durée de l’arrêt et, si la balade a une heure de départ, votre heure d’arrivée.',
  'help.ctx.trip-tour-bike.summary':
    'Une sortie à vélo ouverte dans l’éditeur de l’onglet « Sorties » : le profil selon lequel elle est calculée, son temps de vélo, les revêtements empruntés et, pour une sortie en VTT, la difficulté de ses sentiers.',
  'help.guide.tour-bike-profile.step.2': 'Ouvrez le champ « Type de sortie » et choisissez « Sortie à vélo ».',
  'help.guide.tour-bike-profile.tip.3':
    'Si aucune voie cyclable n’approche d’un point, le volet indique « Aucune voie cyclable n’atteint le point N ». Déplacez le point, ou ouvrez « Plus d’actions » sur le point précédent et choisissez « Tracer le tronçon suivant à la main ».',
  'help.guide.tour-bike-surfaces.step.4':
    'Sous « Type de voie », cliquez sur une ligne comme « Chemin agricole ou forestier » ou « Route avec circulation » pour voir où l’itinéraire l’emprunte.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Ouvrez la sortie à vélo dans l’éditeur et vérifiez que « Profil » est réglé sur « VTT ». Les difficultés des sentiers ne sont lues qu’avec ce profil.',
  'help.ctx.trip-tour-ski.title': 'Sorties ski et hiver',
  'help.guide.tour-ski-plan.goal':
    'Planifier une journée sur les pistes, une boucle de ski de fond, une sortie en ski de randonnée ou en raquettes, sur les pistes, remontées et sentiers cartographiés.',
  'help.guide.tour-ski-plan.tip.2':
    'Le point d’information à côté de « Discipline » explique ce que TREK fait des sorties à ski. Ni là ni ailleurs, rien n’indique l’état de la neige, le risque d’avalanche ou l’ouverture des pistes, remontées et sentiers.',
  'help.guide.tour-ski-options.step.3':
    'Sous « Privilégier », choisissez « La plus rapide », « Le plus de ski » ou « Le plus facile ». Sous « Rythme », choisissez « Tranquille », « Normal » ou « Sportif » : cela modifie la durée que le calcul attribue à chaque piste.',
  'help.guide.tour-ski-fix-leg.goal': 'Faire calculer un tronçon rouge en un clic, ou le tracer en ligne droite.',
  'help.guide.tour-ski-fix-leg.result':
    'Plus aucun tronçon n’est rouge : chacun suit les pistes ou va en ligne droite entre ses points.',
  'help.guide.tour-ski-summary.tip.3':
    'Une sortie enregistrée s’ouvre telle qu’elle a été enregistrée. Déplacez un point ou changez une option pour la recalculer avec les données de pistes actuelles.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Si l’interrupteur reste grisé et indique « Zoomez pour voir les pistes », zoomez sur le domaine skiable.',
  'help.guide.tour-ski-import.step.3':
    'Choisissez la « Discipline » et, pour le « Ski de fond », la « Technique ». Tant que ce n’est pas fait, la boîte de dialogue indique « Choisissez une discipline pour importer la trace comme ski ».',
  'help.ctx.trip-tour-paddle.title': 'Sorties en pagaie',
  'help.guide.tour-paddle-setup.title': 'Planifier une sortie en pagaie',
  'help.guide.tour-paddle-setup.step.7':
    'Vérifiez que « Ajouter un point » est activé, puis cliquez sur la carte : d’abord votre point de mise à l’eau, puis les points intermédiaires et votre point de sortie de l’eau.',
  'help.guide.tour-paddle-water-route.step.1':
    'Un tronçon tracé à la main affiche « Tracé à la main, non calculé » sous son point, avec sa longueur. TREK conserve son tracé tel que vous l’avez dessiné.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Vous ne pouvez pas enregistrer tant qu’un tronçon n’est pas calculé. Calculez-le d’abord sur l’eau ou tracez-le à la main.',
  'help.guide.tour-paddle-portage.step.5':
    'Sous « Débarquer et rembarquer », saisissez les minutes nécessaires pour sortir de l’eau, décharger et remettre à l’eau. Si vous laissez le champ vide, TREK compte 10 minutes.',
  'help.guide.tour-paddle-lock.step.2':
    'Choisissez « Écluse à cet endroit ». Une carte « Écluse » apparaît sous le point, marquée « Temps manquant ».',
  'help.guide.tour-paddle-time.goal':
    'Voir comment se répartit le temps entre l’eau, le portage, les écluses et les pauses, et définir vos propres valeurs.',
  'help.guide.tour-paddle-time.tip.3':
    'Les pauses et votre propre total prévu se règlent sous « Détails ». Avec un total prévu, la carte affiche « Votre durée prévue » à côté de l’estimation.',
  'help.guide.tour-paddle-wind.tip.1':
    'Les prévisions ne couvrent que les 16 prochains jours. Pour un jour plus lointain, la carte indique à partir de quelle date elles seront disponibles. Pour un jour passé, elle indique qu’il est passé.',
  'help.guide.tour-paddle-checklist.step.2':
    'La ligne en dessous indique la fraîcheur des données : « État OSM » pour OpenStreetMap, « Récupérées » pour la date à laquelle TREK les a lues, et « Données d’obstacles » là où elles ne couvrent pas tout l’itinéraire.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Une liste de contrôle ne vaut ni validation de sécurité ni autorisation légale. Votre décision ne lève pas une interdiction ou une propriété privée enregistrée dans OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Cliquez sur « Portage », puis cliquez sur le tracé à l’endroit où vous êtes sorti de l’eau et à celui où vous êtes remis à l’eau.',
  'help.ctx.trip-tour-horse.summary':
    'Une sortie à cheval n’est jamais calculée. Elle se compose de tronçons d’itinéraires équestres balisés connus d’OpenStreetMap, reliés par des portions que vous tracez à la main, ou elle est conservée exactement telle que vous l’avez enregistrée.',
  'help.guide.tour-horse-plan.step.1':
    'Affichez sur la carte la zone où vous voulez monter, puis cliquez sur « Planifier une nouvelle sortie » en haut de la colonne de gauche.',
  'help.guide.tour-horse-plan.tip.1':
    'Un itinéraire équestre ne vaut pas autorisation de l’emprunter. « Accès à cheval » n’indique que ce que renseigne OpenStreetMap. Respectez toujours la signalisation sur place.',
  'help.guide.tour-horse-gap.step.2':
    'Activez « Relier par un tronçon manuel ». L’écart est tracé en ligne droite, sans vérification.',
  'help.guide.tour-horse-recorded.goal':
    'Importer une sortie enregistrée sur un GPS ou dans une application, et la conserver exactement telle que vous l’avez faite.',
  'help.guide.tour-horse-recorded.tip.3':
    'Vous pouvez aussi déposer le fichier n’importe où dans l’onglet « Sorties » pour ouvrir le même aperçu.',
  'help.guide.create-trip.tip.3':
    'Sous « Compagnons de voyage », vous pouvez ajouter des personnes qui ont déjà un compte sur ce TREK. Elles deviennent membres du voyage dès sa création.',
  'help.guide.trip-reminder.step.1':
    'Cliquez sur le crayon de la carte du voyage. Pour un nouveau voyage, le formulaire « Nouveau voyage » comporte la même section.',
  'help.guide.company-holidays.tip.2':
    'Un jour férié d’entreprise complet supprime tout congé déjà saisi ce jour-là : personne ne consomme donc de droits à congé pour ce jour.',
  'help.guide.half-company-holiday.tip.2':
    'Cliquez de nouveau sur le jour avec les mêmes réglages pour l’effacer, ou avec « Demi-journée » désactivé pour en faire un jour férié d’entreprise complet.',
  'help.guide.edit-holiday-calendar.step.1':
    'Ouvrez « Paramètres » et repérez le calendrier sous « Jours fériés » ou « Vacances scolaires ».',
  'help.guide.person-color.goal':
    'Vous attribuer, à vous ou à la personne avec qui vous planifiez, une couleur plus facile à distinguer.',
  'help.guide.answer-fusion-request.tip.2':
    'L’un ou l’autre pourra séparer les plannings plus tard, et vos entrées seront conservées.',
  'help.guide.log-for-partner.tip.2':
    'La personne voit la modification immédiatement, et sa ligne « Droits » se met à jour aussitôt.',
  'help.guide.country-places.title': 'Voir tous les lieux d’un pays',
  'help.guide.tour-activity-stats.step.1':
    'Dans le panneau en bas de la carte, ouvrez l’onglet « Sorties », à côté de « Statistiques » et de Bucket List.',
  'help.guide.tour-activity-stats.tip.2':
    'Liez la trace réellement parcourue avec « Ajouter la trace réelle » dans le détail de la sortie : ses valeurs enregistrées remplacent ici les valeurs prévues. Une sortie planifiée sur plusieurs jours n’est comptée qu’une fois.',
  'help.ctx.collections.bullet.7':
    'Sorties enregistrées : les sorties conservées depuis un voyage forment les premières lignes d’une liste, avec leur difficulté, leur type, le voyage dont elles proviennent et leurs mesures. « Ajouter à un voyage » crée une nouvelle sortie à partir de l’une d’elles, et l’icône de corbeille la retire de la liste.',
  'help.guide.move-to-list.title': 'Déplacer ou dupliquer des lieux vers une autre liste',
  'help.guide.copy-to-trip.tip.2': 'Un lieu déjà présent dans le voyage est ignoré, et TREK indique combien l’ont été.',
  'help.guide.accept-list-invite.tip.2':
    'Cliquez sur « Partagée », en haut de la liste, pour voir ses membres. Cliquez sur « Quitter la liste » pour la quitter.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Créer une nouvelle sortie dans l’un de vos voyages à partir d’une sortie enregistrée dans une liste, avec ou sans ses points de passage.',
  'help.guide.tour-collection-add-to-trip.result':
    'La boîte de dialogue confirme que la sortie fait désormais partie de ce voyage. « Ouvrir le voyage » vous y emmène, « Fermer » vous laisse dans Collections.',
  'help.guide.tour-collection-manage.tip.3':
    'Les sorties enregistrées n’apparaissent que dans leur propre liste, pas dans « Tous les enregistrés ».',
  'help.guide.search-journey.step.3':
    'Cliquez sur un jour pour y aller, ou sur sa flèche pour lister les entrées de ce jour et en choisir une.',
  'help.guide.journey-map-layers.goal':
    'Voir l’écart entre le programme et ce qui s’est réellement passé, et activer ou désactiver les couches.',
  'help.guide.journey-keep-route.goal':
    'Ajouter à la carte du journal le trajet réel d’une journée enregistré par Dawarich, et l’y conserver.',
  'help.guide.journey-day-stays.goal': 'Transformer en entrées, un par un, les séjours enregistrés par Dawarich.',
  'help.guide.journey-take-over-day.goal':
    'Transformer en une seule fois les séjours d’une journée en brouillons d’entrées, ou en un seul récit du jour.',
  'help.guide.journey-auto-prepare.title': 'Laisser TREK préparer vos journées enregistrées',
  'help.guide.photo-location.title': 'Situer les entrées là où leurs photos ont été prises',
  'help.ctx.settings-about.summary':
    'Ce qu’est TREK, la version installée sur ce serveur et où trouver le projet : la documentation, l’endroit où signaler un bug et les moyens de soutenir le projet.',
  'help.guide.startup.tip.2':
    'Un onglet de démarrage appartenant à une extension que vous avez désactivée ouvre le programme à la place.',
  'help.guide.web-push-device.title': 'Recevoir des notifications push sur cet appareil',
  'help.guide.connect-airtrail.tip.1': 'La carte n’apparaît que si l’administrateur a activé l’extension AirTrail.',
  'help.guide.connect-dawarich.tip.1':
    'TREK se contente de suggérer des entrées, des lieux et des pays ; rien n’est ajouté sans votre confirmation, et rien n’est renvoyé vers Dawarich.',
  'help.guide.tour-connect-wanderer.tip.1':
    'La carte n’apparaît que si l’administrateur autorise wanderer dans « Sorties ».',
  'help.guide.tour-wanderer-watch.tip.1':
    'Un signalement ne modifie jamais une sortie ; la vérification de la source de la sortie montre ce qui a réellement changé.',
  'help.guide.api-keys.tip.3':
    'Envoyez la clé dans l’en-tête Authorization: Bearer ou X-API-Key vers /api/v1. Un compte peut avoir jusqu’à 10 clés.',
  'help.guide.plugin-settings.step.2':
    '« Activité des plugins » liste toutes les actions effectuées par un plugin en votre nom, des plus récentes aux plus anciennes ; « Actualiser » charge les dernières.',
  'help.ctx.admin-github.bullet.3':
    '« À propos » : Ko-fi, Buy Me a Coffee, Discord, « Signaler un bug », « Proposer une fonctionnalité » et le Wiki.',
  'help.guide.default-user-settings.goal':
    'Attribuer à chaque compte des unités, un mode de couleur et une devise adaptés, sans que personne ait à ouvrir les paramètres.',
  'help.guide.default-map.step.3':
    'Chaque champ est enregistré quand vous le quittez. Le lien « réinitialiser » à côté du nom d’un champ rétablit la valeur par défaut de TREK.',
  'help.guide.own-routing-engine.tip.2':
    'Si seul votre propre moteur de calcul d’itinéraire est défini, le Valhalla public n’est pas utilisé non plus. Le lien « réinitialiser » à côté d’un champ le vide à nouveau.',
  'help.guide.admin-passkeys.step.1':
    'Dans l’onglet « Paramètres », sous « Connexion par passkey », activez « Activer la connexion par passkey ».',
  'help.guide.storage-backends.step.4':
    '« Santé », en haut, liste les écritures échouées vers une cible miroir. Si elle indique « Aucune défaillance de réplique enregistrée. », tout fonctionne.',
  'help.guide.channels-instance.tip.3':
    'Web Push nécessite HTTPS. Sur iPhone et iPad, les utilisateurs doivent d’abord ajouter TREK à l’écran d’accueil.',
  'help.guide.notification-defaults.step.1':
    'Dans l’onglet « Notifications », faites défiler jusqu’à « Valeurs par défaut des utilisateurs », en bas. Chaque ligne est un événement, chaque colonne un canal.',
  'help.ctx.notifications.bullet.1':
    'La cloche en haut à droite indique le nombre de notifications non lues. Cliquez dessus pour voir les dix plus récentes, et sur « Voir toutes les notifications », en bas, pour accéder à cette page.',
  'help.guide.read-notifications.step.2':
    'Le panneau affiche vos dix notifications les plus récentes. Chacune indique qui a fait quoi et où, et les non lues ont un fond coloré.',
  'help.guide.filter-notifications.step.2': 'En bas du panneau, cliquez sur « Voir toutes les notifications ».',
  'help.guide.mark-notifications-read.tip.1': 'Ouvrir une notification par son bouton la marque aussi comme lue.',
  'help.guide.delete-notifications.tip.2':
    'Une notification supprimée ne peut pas être restaurée. Pour masquer une notification tout en la gardant, marquez-la comme lue et utilisez « Non lues ».',
  'help.guide.notification-settings.tip.2':
    'Il n’existe pas de réglages par voyage : chaque interrupteur s’applique à tous vos voyages.',
  'help.guide.link-journal.title': 'Lier un journal au voyage',
  'help.guide.link-journal.tip.2':
    'Dès lors, les personnes à qui vous donnez accès voient aussi le journal dans leur propre liste de journaux.',
  'help.ctx.trip-places.bullet.8':
    'Si Dawarich est connecté, « Depuis Dawarich », en haut de la liste, affiche les séjours enregistrés par Dawarich pendant le voyage. « Ajouter comme lieu » transforme un séjour en lieu. « Je n’ai pas visité ce lieu » le retire de la liste.',
  'help.guide.dawarich-stays.step.4':
    'Si un séjour ne correspond pas à une vraie visite, cliquez sur « Je n’ai pas visité ce lieu », le x à côté, pour le retirer. « Afficher … déjà traités », en bas de la liste, affiche les séjours que vous avez ajoutés ou retirés. « Rétablir » remet un séjour retiré dans la liste.',
  'help.guide.leave-stop-off-route.tip.1':
    'Seule une étape dotée de coordonnées propose cette option, et le réglage ne vaut que pour ce jour : le même lieu reste intégré à l’itinéraire les autres jours.',
  'help.guide.move-booking-day.title': 'Déplacer une réservation sur un autre jour',
  'help.guide.place-image-from-file.step.4':
    'La photo est désormais l’image du lieu. Cliquez sur la petite croix rouge dans son coin pour la retirer.',
  'help.guide.place-own-hours.step.2':
    'Sous « Site web », renseignez « Téléphone » et « E-mail » si vous les connaissez.',
  'help.guide.add-accommodation.tip.4':
    'Plus rapide : le + dans l’en-tête du jour, avec l’info-bulle « Ajouter au jour », propose « Ajouter un hébergement ». Il ouvre le jour avec ce formulaire déjà ouvert.',
  'help.guide.confirm-stay-booking.goal':
    'Marquer comme confirmée la réservation d’hôtel liée à un séjour, directement depuis la journée.',
  'help.guide.map-whole-trip.tip.4':
    'L’affichage du voyage entier est enregistré pour chaque voyage dans votre compte : le voyage s’ouvre donc de la même façon dans un autre navigateur.',
  'help.guide.tour-map-lines.step.3':
    'Ouvrez dans la colonne des jours un jour où figure la sortie : elle s’intègre à l’itinéraire de la journée, qui va jusqu’au départ de la sortie et repart de son arrivée.',
  'help.guide.car-stops.goal':
    'Indiquer pour une voiture de location ou votre propre voiture le lieu de prise en charge, de restitution et les arrêts intermédiaires.',
  'help.guide.car-stops.tip.1':
    'Il n’existe pas de type distinct pour la location : une voiture de location et votre propre voiture sont toutes deux du type « Voiture ».',
  'help.guide.transport-details.result':
    'L’onglet « Prévu » est ouvert sur le jour du trajet, avec son tracé sur la carte et l’icône d’itinéraire de sa ligne activée.',
  'help.guide.export-transports-csv.step.2':
    "Cliquez sur l’icône de tableur après « Options d'affichage », dont l’info-bulle indique « Exporter en tableur (CSV) ».",
  'help.guide.group-sort-bookings.title': 'Grouper et trier les réservations',
  'help.guide.group-sort-bookings.tip.2':
    "En vue « Chronologie », le même bouton propose « Une ligne par type » et « Afficher l'autre onglet ».",
  'help.guide.booking-on-map.result':
    'Le détail se ferme et l’onglet « Prévu » s’ouvre sur le jour de la réservation, avec son lieu sélectionné sur la carte.',
  'help.guide.export-bookings-csv.step.1':
    'Pour n’exporter qu’une partie de l’onglet, filtrez-le d’abord avec « Rechercher » ou « Filtrer ». Le fichier contient exactement ce qu’affiche l’onglet.',
  'help.guide.import-booking-file.tip.4':
    'La lecture d’une confirmation nécessite une connexion. Hors ligne, « Importer » vous le signale, et vous pourrez réessayer une fois TREK de nouveau en ligne.',
  'help.guide.arrange-packing-list.step.1':
    'Faites glisser la poignée à gauche de l’en-tête d’une liste, devant sa pastille de couleur, et déposez la liste sur une autre carte. Un contour dans votre couleur d’accent indique la carte cible, et la liste prend la place de cette carte pour tous les participants du voyage.',
  'help.guide.count-packed-pieces.title': 'Emballer plusieurs exemplaires d’un article',
  'help.guide.count-packed-pieces.tip.2':
    'Si « Suivi des bagages » est activé, « Emballés », dans la carte « Bagages », ne compte que les pièces déjà comptées.',
  'help.guide.packing-bags.tip.4':
    'Le poids d’un sac porté par plusieurs personnes est réparti à parts égales entre elles sous « Par personne ». Ce poids est souligné en pointillés et affiche une remarque à ce sujet au survol.',
  'help.guide.expense-receipts.step.1':
    'Cliquez sur le crayon à côté de la ligne de la dépense. L’éditeur s’ouvre sur celle-ci, avec « Reçus et factures » vers le bas.',
  'help.guide.expense-receipts.tip.3':
    'Joindre un reçu nécessite une connexion et le droit d’importer des fichiers, car un reçu est enregistré parmi les fichiers du voyage.',
  'help.guide.files-sync-settings.title': 'Choisir le sens de synchronisation des documents',
  'help.guide.files-sync-settings.tip.1':
    'Une voie reste toujours active : cliquer sur la seule voie encore active n’a aucun effet.',
  'help.guide.manage-notes.title': 'Lire, épingler et modifier une note',
  'help.guide.manage-notes.tip.1':
    '« Développer » n’apparaît dans le menu que si la note contient du texte. Un membre qui n’a pas le droit de modifier « Collaboration » ne voit que « Développer ».',
  'help.guide.note-categories.step.5':
    'Cliquez sur « Enregistrer ». Toutes les notes d’une catégorie renommée ou recolorée changent aussitôt, pour tous les membres. « Annuler » abandonne vos modifications.',
  'help.guide.trip-chat.tip.5':
    'La discussion affiche d’abord les derniers messages. « Charger les messages précédents », en haut de la discussion, affiche les messages plus anciens.',
  'help.guide.roadtrip-reorder.result':
    'Les étapes sont dans l’ordre choisi, et la distance, le temps de conduite et les heures d’arrivée de chaque journée modifiée sont recalculés.',
  'help.guide.roadtrip-overnight.goal':
    'Trouver où dormir en chemin et ajouter la nuitée au trajet sous forme de réservation.',
  'help.guide.roadtrip-overnight.tip.2':
    'Si vous repassez une nuitée réservée en « Pause », via « Modifier » dans sa carte, TREK demande d’abord « Supprimer la nuitée ? ». « En faire une pause » supprime la nuitée, avec sa réservation et toute dépense liée, et conserve l’arrêt sur le trajet.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Si vous choisissez la valeur que l’arrêt a déjà, celui-ci revient à votre valeur par défaut.',
  'help.guide.roadtrip-bookings.tip.1':
    'L’heure au terminal est avancée par rapport à l’horaire pour tenir compte de l’enregistrement : une heure pour un vol ou une croisière, une demi-heure pour un ferry, dix minutes pour un train ou un bus.',
  'help.guide.roadtrip-google-import.step.2':
    'Collez le lien d’un itinéraire partagé depuis Google Maps et cliquez sur « Aperçu ».',
  'help.guide.roadtrip-hazards.goal':
    'Voir sur la carte les alertes météo et les alertes catastrophe autour de votre trajet.',
  'help.ctx.trip-tours.title': 'Les sorties dans le programme',
  'help.guide.tour-show-list.title': 'Afficher les sorties du voyage dans le programme',
  'help.guide.tour-show-list.tip.2':
    'Pas encore de sorties ? « Importer un GPX ou KML », en haut de la liste, importe un fichier, et « Planifier une nouvelle sortie », dans l’onglet « Sorties », en crée une.',
  'help.guide.tour-add-to-day.step.4':
    'Vous pouvez aussi faire glisser la ligne hors de la liste et la déposer sur un jour de la colonne de gauche. Déposée entre deux étapes, elle se place à cet endroit.',
  'help.guide.tour-day-times.goal': 'Savoir quand une sortie se termine et si elle empiète sur la suite de la journée.',
  'help.guide.tour-day-times.tip.4':
    '« Enregistrer dans une collection », dans le même menu, conserve la sortie et son itinéraire dans une collection, comme le bouton « Collection » de la fiche.',
  'help.guide.tour-remove-from-day.tip.2':
    'Ces menus et la fiche ne proposent pas de suppression. Une sortie se supprime dans l’onglet « Sorties », avec la corbeille de sa ligne sous « Sorties de ce voyage ».',
  'help.guide.tour-filter-list.tip.1':
    '« Limite d’itinéraire » correspond à la difficulté maximale autorisée lors du calcul de l’itinéraire, et non à la difficulté réelle du sentier.',
  'help.guide.tour-hide-on-map.step.3':
    'Tant qu’une sortie est masquée, une ligne au-dessus de la liste indique « Masqué sur la carte », avec leur nombre. « Tout afficher » réaffiche toutes les sorties d’un coup.',
  'help.guide.tour-import-plan-tab.step.3':
    "L’« Aperçu de l'import » affiche chaque trace avant tout enregistrement. Sous « Importer comme », choisissez le type (« Randonnée », « Sortie à vélo », etc.), puis cliquez sur « Importer 1 sortie ».",
  'help.ctx.trip-tour-detail.bullet.3':
    'En dessous viennent « Jours du voyage », avec une tuile pour chaque jour de la sortie, les mesures avec le profil altimétrique, puis, selon le cas : les étapes d’une balade urbaine, les vérifications et le vent d’une sortie en pagaie, « Trace réelle », « Liste de bagages », « Description », « Notes », « Origine » et « Fichiers ».',
  'help.guide.tour-detail-read.step.4':
    '« Jours du voyage » affiche une tuile pour chaque jour de la sortie, avec sa date. « Sur aucun jour du voyage pour l’instant » signifie qu’elle n’est pas encore planifiée.',
  'help.guide.tour-detail-read.tip.5':
    'Sur téléphone, la fiche s’ouvre en volet depuis le bas, pour la consulter et emporter la sortie avec vous.',
  'help.guide.tour-rename-colour.tip.1':
    'Le nom et la couleur appartiennent au voyage : tous ses participants les voient. Pour masquer une sortie sur votre propre carte sans rien changer pour les autres, utilisez l’œil dans la liste « Sorties ».',
  'help.guide.tour-take-along.tip.1':
    'Sur un appareil capable de partager des fichiers, « Partager » apparaît à côté de GPX et envoie le même fichier directement à une autre application.',
  'help.guide.tour-copy-keep.step.2':
    'La copie s’ouvre immédiatement, avec le nom de l’original suivi de « (copie) ». Cliquez sur le crayon pour lui donner son propre nom.',
  'help.guide.tour-packing-link.title': 'Lier une sortie à la liste de bagages',
  'help.guide.tour-packing-link.tip.2':
    '« Changer », dans l’en-tête de la section, lie la sortie à une autre liste. « Supprimer le lien », dans cette boîte de dialogue, supprime le lien, et la liste reste inchangée.',
  'help.guide.tour-files.tip.1':
    'Ces fichiers font aussi partie des fichiers du voyage : ils apparaissent donc également dans l’onglet « Fichiers ».',
  'help.guide.tour-activity-link.step.4': 'Vérifiez ce qu’elle a mesuré sous « Réel », puis cliquez sur « Lier ».',
  'help.guide.tour-activity-compare.step.1':
    'Ouvrez la fiche de la sortie. « Prévu et réel » affiche « Distance », « Dénivelé positif », « Dénivelé négatif » et « Temps avec pauses » du programme à côté de ceux de la trace, avec l’« Écart ».',
  'help.guide.tour-origin-check.goal':
    'Savoir si une sortie a été tracée dans TREK ou importée, depuis quel fichier, et si elle a été modifiée depuis.',
  'help.ctx.trip-tour-planner.title': 'Sorties',
  'help.guide.tour-open-workspace.title': 'Se repérer dans l’onglet « Sorties »',
  'help.guide.tour-open-workspace.step.7':
    'Cliquez sur une sortie dans le volet de droite. Une sortie planifiée dans TREK s’ouvre dans l’éditeur. Une trace importée s’ouvre telle quelle, en tant que sortie GPX, en consultation.',
  'help.guide.tour-draw-route.step.2':
    'Saisissez le point de départ de la sortie dans « Rechercher un lieu ou une adresse » et choisissez le résultat. La carte se centre dessus.',
  'help.guide.tour-draw-route.tip.4':
    'Un brouillon non enregistré est conservé. Rouvrez l’onglet « Sorties » du voyage : il est restauré, avec la mention « Brouillon non enregistré restauré ».',
  'help.guide.tour-type-profile.tip.1':
    'Un changement de type compte comme une étape de l’historique : « Annuler la modification du point de passage », en haut du volet, rétablit l’ancien type et son itinéraire.',
  'help.guide.tour-edit-points.step.4':
    'Vous pouvez aussi ouvrir « Plus d’actions » (les trois points) sur la ligne et choisir « Monter le point de passage » ou « Descendre le point de passage ».',
  'help.guide.tour-shaping-points.step.1':
    'Cliquez sur l’itinéraire tracé, à l’endroit où il doit passer autrement. Un petit point apparaît : c’est un point de guidage.',
  'help.guide.tour-loop-reverse.title': 'Faire une boucle ou inverser la sortie',
  'help.guide.tour-loop-reverse.result':
    'Une boucle qui se termine à son point de départ, ou la même sortie dans le sens inverse.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Un point qu’aucun chemin n’atteint affiche un avertissement avec « Afficher le point » et son numéro. Déplacez le point sur un chemin, ou tracez à la main le tronçon qui y mène.',
  'help.guide.tour-trip-places.tip.1':
    'Un lieu déjà présent dans la sortie est marqué « Dans la sortie » et ne peut pas être choisi deux fois.',
  'help.guide.tour-details-times.step.3':
    'Saisissez les « Pauses », par exemple 0:45. Elles s’ajoutent à la durée estimée.',
  'help.guide.tour-save.step.1': 'Saisissez un nom dans « Nom de la sortie ». Sans nom, « Enregistrer » reste grisé.',
  'help.guide.tour-edit-saved.title': 'Modifier une sortie enregistrée',
  'help.guide.tour-edit-saved.tip.3':
    '« Télécharger le GPX » et « Garder dans une collection », en haut du volet, fonctionnent une fois les modifications enregistrées.',
  'help.guide.tour-summary-profile.tip.1': 'Cliquez sur le titre de la carte pour replier tout le résumé.',
  'help.guide.tour-list-manage.step.3': 'Choisissez le jour. La sortie est ajoutée à ce jour, et sa ligne l’affiche.',
  'help.guide.tour-delete.goal': 'Supprimer définitivement une sortie du voyage.',
  'help.guide.tour-saved-elsewhere.goal':
    'Choisir que faire quand quelqu’un d’autre a enregistré la sortie pendant que vous la modifiiez.',
  'help.ctx.trip-tour-import.title': 'Importer des sorties',
  'help.guide.tour-import-gpx.goal':
    'Transformer une trace issue d’une montre GPS, d’une application ou de Google Earth en sortie du voyage, vérifiée avant tout enregistrement.',
  'help.guide.tour-import-gpx.tip.3':
    'Une trace déjà présente dans le voyage est grisée avec la mention « Déjà dans le voyage » et ignorée.',
  'help.guide.tour-view-import.step.3': '« Retour aux sorties », la flèche en haut à gauche, la referme.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK prend des points de contrôle sur la trace et recalcule l’itinéraire. La carte affiche l’import en pointillés et la suggestion en trait continu, et la fiche compare leurs longueurs, la part « À moins de 50 m de la trace » et l’« Écart maximal ».',
  'help.guide.tour-restore-recorded.title': 'Revenir à la trace enregistrée',
  'help.guide.tour-take-over.title': 'Reprendre une sortie d’un autre voyage',
  'help.guide.tour-take-over.tip.1':
    'La copie est une sortie distincte. Elle n’est encore sur aucun jour, et les modifications ultérieures de l’original n’affectent pas la copie, ni l’inverse. Son « Origine » indique le voyage d’où elle a été reprise.',
  'help.guide.tour-import-wanderer.step.3':
    'Cliquez sur un sentier. Il apparaît sur la carte, et la colonne affiche les mesures de son fichier GPX, sa description et s’il est public ou privé dans wanderer.',
  'help.ctx.trip-tour-map.summary':
    'La carte au centre de l’onglet « Sorties », pour la sortie ouverte : les fonds de carte adaptés à son type, les pistes ou le balisage maritime superposés, les lieux le long de son itinéraire, et la même sortie en 3D sur le relief réel.',
  'help.guide.tour-map-layers.step.1':
    'Ouvrez l’onglet « Sorties » et cliquez sur une sortie sous « Sorties de ce voyage », à droite. Elle s’ouvre dans le planificateur, et la pastille en bas à gauche de la carte liste les fonds de carte proposés pour ce type de sortie.',
  'help.guide.tour-along-search.goal':
    'Chercher des points de vue, des points d’eau, des refuges ou un endroit où manger près de l’itinéraire de la sortie en préparation.',
  'help.guide.tour-along-search.tip.2':
    'Sur une balade urbaine, quatre thèmes au-dessus de la liste sélectionnent pour vous les bons types de lieux.',
  'help.guide.tour-along-add-stop.result':
    'La sortie passe maintenant par le lieu, avec sa nouvelle distance et sa nouvelle durée dans « Résumé de la sortie ». Enregistrez la sortie pour conserver la modification.',
  'help.guide.tour-3d-terrain.step.3':
    'Cliquez sur la pastille « Répartition des pentes », à droite. Elle se déplie pour indiquer la part de la sortie à « moins de 5 % », « de 5 à 10 % », « de 10 à 18 % », « de 18 à 27 % » et à « 27 % et plus ». Repliée, elle affiche le point culminant et le passage le plus raide.',
  'help.guide.tour-3d-flyover.goal':
    'Voir toute la sortie du départ à l’arrivée avant de la faire à pied, à vélo ou à ski.',
  'help.guide.tour-3d-flyover.tip.3':
    'Quand le survol est en pause, déplacez-vous le long du profil altimétrique pour amener le point à cet endroit. « Lancer le survol » reprend à partir de là.',
  'help.guide.tour-map-overlays.tip.1':
    'Les pistes sont des données cartographiques, pas un bulletin en temps réel : elles ne disent rien de ce qui est ouvert ou damé, de la neige ni des avalanches. Si vous dézoomez au-delà du domaine skiable, l’interrupteur indique « Zoomez pour voir les pistes ».',
  'help.ctx.trip-tour-stages.bullet.4':
    'Dans « Sorties de ce voyage », une sortie sur plusieurs jours affiche une lune avec son nombre d’étapes. Ce bouton, « Afficher les étapes », déplie la liste des étapes avec le jour de chacune et les totaux de l’« Itinéraire complet ».',
  'help.guide.tour-multi-day.step.5':
    '« Résumé de la sortie » liste toutes les étapes sous « Étapes ». Cliquez sur l’une d’elles pour voir où elle se termine : son dernier arrêt est sélectionné et le profil altimétrique marque l’endroit.',
  'help.guide.tour-stages-on-days.goal':
    'Placer chaque étape sur son propre jour, ou toute la sortie sur un seul jour.',
  'help.guide.tour-stages-on-days.tip.2':
    '« L’itinéraire complet sur ce jour » est grisé pour un jour qui contient déjà la sortie. « Étapes à partir de ce jour » y fonctionne toujours et remplace la sortie complète sur ce jour.',
  'help.ctx.trip-tour-hike.bullet.3':
    'L’en-tête de la carte « Points de passage » regroupe les outils d’itinéraire : « Inverser le sens », « Retour au départ » et, pour une randonnée, « Boucle depuis le départ ». « Plus d’actions » sur une étape propose « Comparer les chemins du tronçon suivant ».',
  'help.guide.tour-hike-plan.step.3': 'Saisissez un nom dans « Nom de la sortie ».',
  'help.guide.tour-hike-plan.tip.4':
    'Le temps de marche suit la règle des panneaux de randonnée (DIN 33466) et n’inclut pas les pauses. Ajoutez-les sous « Pauses », dans « Détails » : elles apparaissent dans le total prévu.',
  'help.guide.tour-hike-trail-details.result':
    'Vous savez quelle cotation a chaque portion de la randonnée, sur quel sol elle se fait et où elle se situe sur la carte.',
  'help.guide.tour-hike-round.step.3':
    'Cliquez sur « Chercher des boucles ». Les boucles A, B, etc. apparaissent dans la liste et sur la carte, chacune dans sa couleur.',
  'help.guide.tour-hike-compare-ways.goal':
    'Voir quels autres chemins une randonnée pourrait emprunter entre deux étapes, et en choisir un.',
  'help.guide.tour-hike-compare-ways.tip.3': '« Annuler » ferme la carte sans modifier l’itinéraire.',
  'help.guide.tour-ferrata-add.result':
    'La randonnée suit la via ferrata sur son propre tracé issu d’OpenStreetMap. Cliquez sur la carte pour continuer depuis le sommet. Le calcul d’itinéraire ne planifie que l’approche de la via ferrata et la suite du parcours.',
  'help.guide.tour-run-plan.step.2':
    'Choisissez un « Profil » : « Course » pour des voies surtout revêtues en ville, dans les parcs et le long des rivières, « Trail » pour les chemins forestiers et les sentiers naturels.',
  'help.guide.tour-run-plan.tip.4':
    'Le profil « Trail » emprunte des sentiers jusqu’aux sentiers de montagne (T2), jamais plus difficiles.',
  'help.guide.tour-run-ways.tip.2':
    'Passez le « Profil » sur « Trail » pour que l’itinéraire emprunte davantage de sentiers naturels, ou sur « Course » pour rester sur un sol ferme.',
  'help.guide.tour-walk-plan.title': 'Planifier une balade urbaine d’étape en étape',
  'help.guide.tour-walk-plan.tip.1':
    'L’anneau autour du numéro d’une étape indique son importance : plein pour « Incontournable », en pointillés pour « Facultatif ». Un petit bouclier signale une étape « Protégée ».',
  'help.guide.tour-walk-sights.step.3':
    "Cliquez sur « Chercher le long de l'itinéraire ». Une étoile devant un nom signale un « Incontournable », l’un des lieux les plus connus du coin.",
  'help.guide.tour-walk-day-times.goal':
    'Savoir à quelle heure vous atteignez chaque étape le jour de la balade, et quels lieux sont alors fermés.',
  'help.guide.tour-walk-day-times.tip.4':
    'Deux balades le même jour : dans l’onglet « Prévu », cliquez sur le tronçon qui les relie (« Changer de mode de transport ») et choisissez « Transports en commun ». La recherche part de la fin de la première balade, à l’heure où elle se termine, et vous avertit si une correspondance arrive après le début de la balade suivante.',
  'help.guide.tour-walk-google-import.tip.1':
    'Seul un itinéraire calculé à pied est lu. Passez Google Maps en mode marche avant de le partager.',
  'help.guide.tour-walk-check-off.step.3':
    'Cliquez sur « Marquer comme visité » sur une étape que vous avez vue, ou sur « Passer » sur une étape que vous laissez de côté.',
  'help.ctx.trip-tour-bike.bullet.1':
    '« Profil », sous « Type de sortie », indique pour quelle pratique l’itinéraire est calculé : « Voyage », « Route », Gravel ou « VTT ». La ligne en dessous précise ce que recherche le calcul, et changer de profil recalcule tout l’itinéraire.',
  'help.guide.tour-bike-profile.step.3':
    'Sous « Profil », choisissez « Voyage », « Route », Gravel ou « VTT ». La ligne en dessous indique ce que recherche le calcul avec ce profil.',
  'help.guide.tour-bike-profile.tip.4':
    '« Enregistrer » reste grisé tant que la sortie n’a pas de nom et que l’itinéraire et ses altitudes ne sont pas calculés.',
  'help.guide.tour-bike-surfaces.result':
    'La carte met en évidence les portions de la ligne choisie, et vous savez quels revêtements l’itinéraire emprunte. La sortie elle-même n’est pas modifiée.',
  'help.guide.tour-bike-mtb-grades.step.2':
    "Dans la carte « Revêtement et voies », consultez « Difficulté du sentier (mtb:scale) » : la part de l’itinéraire de « S0, sans difficulté particulière » à « S4 et plus, terrain d'experts ».",
  'help.ctx.trip-tour-ski.summary':
    'Une sortie de type « Ski et hiver » dans l’onglet « Sorties » : une journée sur les pistes, une boucle de ski de fond, une sortie en ski de randonnée, en raquettes ou une marche hivernale. Ses tronçons suivent les pistes, remontées et sentiers cartographiés dans OpenStreetMap, calculés selon votre discipline et vos limites, et une trace de ski enregistrée est importée avec sa discipline.',
  'help.guide.tour-ski-plan.step.1':
    'Dans l’onglet « Sorties », cliquez sur « Planifier une nouvelle sortie » en haut du volet de gauche.',
  'help.guide.tour-ski-plan.tip.3':
    'Si vous changez de discipline par la suite, vos points sont conservés et les tronçons sont recalculés avec les options de cette discipline.',
  'help.guide.tour-ski-options.step.4':
    'Utilisez les interrupteurs : « Prendre les remontées », « Autoriser les itinéraires freeride », « Redescendre en remontée si besoin » et « Éviter les liaisons supposées ». Le « Ski de fond » ajoute « Pistes damées uniquement » et « Pistes éclairées uniquement », et le « Ski de randonnée » ajoute « Monter en bord de piste ».',
  'help.guide.tour-ski-fix-leg.step.1':
    'Un tronçon impossible à calculer affiche sous son point une ligne rouge avec la raison, par exemple « Seule une remontée que vous avez exclue relie ces points », ainsi que la piste ou la remontée concernée.',
  'help.guide.tour-ski-summary.title': 'Lire l’itinéraire sur pistes d’une sortie de ski',
  'help.guide.tour-ski-summary.tip.4':
    'Le bas de la carte indique les domaines skiables et la date des données cartographiques utilisées pour planifier la sortie.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Si les pistes ne se chargent plus, l’interrupteur affiche un symbole d’avertissement. La carte et votre itinéraire continuent de fonctionner.',
  'help.guide.tour-ski-import.step.4': 'Cliquez sur « Importer 1 sortie ».',
  'help.ctx.trip-tour-paddle.summary':
    'Une sortie en kayak, canoë ou SUP sur une rivière ou un lac. Elle précise son embarcation et son plan d’eau, suit l’eau là où TREK dispose des données, intègre portages et écluses à sa durée, et affiche le vent du jour de la sortie ainsi que ce que l’on sait des obstacles sur le parcours.',
  'help.guide.tour-paddle-setup.goal':
    'Créer une sortie en kayak, canoë ou SUP en précisant l’embarcation, le plan d’eau et votre vitesse.',
  'help.guide.tour-paddle-setup.tip.1':
    'Si « Bateau » est réglé sur « Autre », aucune vitesse n’est suggérée. Saisissez-en une, sinon le temps sur l’eau reste vide.',
  'help.guide.tour-paddle-water-route.step.2':
    'Pour calculer un tronçon sur l’eau, survolez l’étape qui le précède et cliquez sur « Plus d’actions », les trois points.',
  'help.guide.tour-paddle-water-route.result':
    'Chaque tronçon suit l’eau ou est volontairement tracé à la main, et un tronçon que TREK n’a pas pu calculer en indique la raison.',
  'help.guide.tour-paddle-portage.tip.1':
    'Pour finalement pagayer ce tronçon, rouvrez « Plus d’actions » sur le point et choisissez « Pagayer de nouveau ce tronçon ». Il redevient un tronçon tracé à la main.',
  'help.guide.tour-paddle-lock.step.3': 'Cliquez sur la carte « Écluse » pour l’ouvrir.',
  'help.guide.tour-paddle-time.step.1':
    '« Estimation du temps » se trouve dans la colonne de gauche, sous les points de passage. Le badge de son en-tête indique le total, pauses comprises.',
  'help.guide.tour-paddle-time.result':
    'L’estimation tient compte de ce que vous avez saisi et indique ce qui manque encore.',
  'help.guide.tour-paddle-wind.tip.2':
    'Une sortie sur plusieurs jours affiche une pastille « Jour » pour chacun dans l’en-tête de la carte. Cliquez sur l’une d’elles pour voir ce jour.',
  'help.guide.tour-paddle-checklist.step.3':
    'Les entrées suivent l’itinéraire : barrages, écluses, rapides, mises à l’eau et règles d’accès issus d’OpenStreetMap, ainsi que vos propres portages et écluses, marqués « Personnel ».',
  'help.guide.tour-paddle-checklist.result':
    'Chaque entrée de l’itinéraire a une décision, et vous avez lu la note de sécurité.',
  'help.guide.tour-paddle-track-marks.step.6':
    'Cliquez sur « Écluse », puis cliquez sur le tracé à l’emplacement de l’écluse.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Réglez « Type de sortie » sur « Randonnée équestre » dans l’éditeur : la carte « Itinéraires équestres » apparaît dans la colonne de gauche. « Chercher dans la vue » liste les itinéraires visibles sur la carte.',
  'help.guide.tour-horse-plan.step.2':
    'Cliquez sur le champ « Type de sortie » sous « Nom de la sortie » et choisissez « Randonnée équestre ». La carte « Itinéraires équestres » apparaît sous « Points de passage ».',
  'help.guide.tour-horse-plan.tip.2':
    'TREK ne calcule pas de temps à cheval pour une sortie. Saisissez une durée sous « Prévu » dans « Détails » si vous voulez en afficher une dans la journée.',
  'help.guide.tour-horse-gap.step.3':
    'Cliquez sur « Reprendre le tronçon ». Tant que l’interrupteur n’est pas activé, le bouton reste grisé.',
  'help.guide.tour-horse-recorded.step.1':
    'Dans « Sorties de ce voyage », cliquez sur « Ajouter une sortie » (le +), choisissez « Importer un GPX ou KML » et sélectionnez le fichier de votre sortie.',
  'help.guide.dateless-trip.title': 'Planifier un voyage sans dates',
  'help.guide.trip-reminder.step.2':
    'Sous « Rappel », choisissez 1, 3 ou 9 jours. Pour un autre délai, cliquez sur « Personnalisé » et saisissez un nombre de jours entre 1 et 30.',
  'help.guide.upcoming-reservations.title': 'Accéder à vos prochaines réservations',
  'help.guide.half-company-holiday.title': 'Marquer une demi-journée fériée d’entreprise',
  'help.guide.edit-holiday-calendar.step.2':
    'Cliquez sur le carré de couleur pour choisir une nouvelle couleur, ou saisissez un nouveau libellé et appuyez sur Entrée.',
  'help.guide.person-color.step.1': 'Dans la carte « Personnes », cliquez sur la pastille de couleur devant le nom.',
  'help.guide.answer-fusion-request.title': 'Répondre à une demande de fusion',
  'help.guide.log-for-partner.title': 'Saisir des jours pour la personne avec qui vous planifiez',
  'help.guide.dissolve-fusion.title': 'Arrêter de planifier ensemble',
  'help.guide.country-places.goal':
    'Lister les lieux que TREK compte pour un pays, pour vérifier ce que vous y avez fait ou repérer un lieu rattaché par erreur à un autre pays.',
  'help.guide.regions.tip.3':
    '« Ajouter à la bucket list » fonctionne aussi pour une région. Elle apparaît avec les mêmes hachures qu’un pays de votre bucket list.',
  'help.guide.tour-activity-stats.step.2':
    'Choisissez une période et un type avec les deux pastilles de gauche. « Période » propose « Depuis le début », « Cette année », « 12 derniers mois » et chaque année antérieure où vous avez des sorties ; « Type » limite les chiffres à un type de sortie, ou « Tous les types ».',
  'help.guide.tour-activity-stats.tip.3':
    'Un jour qui indique des participants ne compte que pour eux ; un jour qui n’indique personne compte pour tous les participants du voyage. L’onglet charge des données en temps réel et nécessite une connexion Internet.',
  'help.guide.move-to-list.goal':
    'Réorganiser vos listes en y déplaçant des lieux ou en les copiant dans une autre liste.',
  'help.guide.accept-list-invite.result':
    'La liste apparaît sous « Partagée » dans la colonne et s’ouvre avec ses lieux. Les modifications de ses membres s’affichent en temps réel.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Ouvrez la liste. Les sorties enregistrées forment les premières lignes, au-dessus des lieux. Cliquez sur « Ajouter à un voyage » sur la sortie, ou sur la ligne elle-même.',
  'help.guide.tour-collection-manage.title': 'Retrouver et retirer des sorties enregistrées',
  'help.guide.tour-collection-manage.result': 'La sortie est retirée de la liste, et un court message le confirme.',
  'help.guide.entry-draft.title': 'Garder une entrée en brouillon',
  'help.guide.journey-map-layers.step.1':
    'En haut de la carte, la barre des couches comporte « Prévu », « Enregistré », « Entrées » et « Photos », chacune avec son nombre. Cliquez sur l’une d’elles pour la masquer ou l’afficher.',
  'help.guide.journey-keep-route.step.1':
    'Dans l’en-tête du jour, cliquez sur le bouton Dawarich, « Reprendre l’enregistrement ».',
  'help.guide.journey-day-stays.step.1':
    'Un jour qui a des séjours à examiner se termine par une ligne du type « 4 séjours depuis Dawarich » avec la plage horaire. Cliquez dessus pour afficher les séjours.',
  'help.guide.journey-take-over-day.step.1':
    'Cliquez sur « Reprendre la journée » au bout de la ligne des séjours du jour, ou sur le bouton de liste dans l’en-tête du jour, qui indique combien de séjours sont en attente.',
  'help.guide.journey-auto-prepare.goal':
    'Faire préparer automatiquement les séjours de chaque jour pour examen pendant un voyage.',
  'help.guide.photo-location.goal': 'Placer les entrées sur la carte sans chercher un lieu pour chacune.',
  'help.ctx.settings-about.bullet.1': 'La version installée sur ce serveur s’affiche à côté du titre.',
  'help.guide.readability.tip.3':
    '« Lisibilité » est marquée « Expérimental ». Si quelque chose s’affiche mal, cliquez sur « Réinitialiser par défaut » en bas de l’onglet pour rétablir les réglages par défaut.',
  'help.guide.web-push-device.goal':
    'Recevoir les notifications TREK sur votre téléphone ou votre ordinateur, même quand TREK est fermé.',
  'help.guide.connect-airtrail.tip.2':
    'La clé est stockée chiffrée et n’est plus jamais affichée ; des points dans le champ indiquent qu’une clé est enregistrée.',
  'help.guide.connect-dawarich.tip.2':
    'Sous les boutons, la carte indique quand TREK a vérifié pour la dernière fois et ce que votre version de Dawarich ne propose pas.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Pour une instance sur une adresse privée, l’administrateur devra peut-être autoriser les réseaux internes.',
  'help.guide.tour-wanderer-watch.tip.2':
    '« En pause jusqu’à » signifie que wanderer n’a pas répondu ; « Jeton refusé » signifie qu’il faut un test de connexion réussi ou un nouveau jeton.',
  'help.guide.plugin-settings.result':
    'Le plugin fonctionne avec vos réglages, et chaque action qu’il effectue pour vous est listée sous « Activité des plugins ».',
  'help.ctx.admin-defaults.bullet.3':
    'Le lien « réinitialiser » à côté d’un champ modifié rétablit la valeur par défaut de TREK. Le réglage personnel d’un utilisateur est toujours prioritaire sur ces valeurs.',
  'help.ctx.admin-settings.bullet.5':
    '« Zone de danger » : « Renouveler le secret JWT » déconnecte tous les utilisateurs, vous compris.',
  'help.guide.default-user-settings.step.1':
    "Sous « Paramètres utilisateur par défaut », choisissez « Mode de couleur » (« Clair », « Sombre » ou « Auto »), « Unité de température », « Unité de distance », « Format de l'heure », « La semaine commence le », la « Devise d'affichage » et si « Masquer les codes de réservation » est activé ou désactivé. Chaque choix est enregistré immédiatement.",
  'help.guide.admin-passkeys.step.2':
    'Saisissez le « Relying Party ID (domaine) », par exemple trek.example.org, et les « Origines autorisées » par lesquelles on accède à votre TREK, puis cliquez sur « Enregistrer ». Laissez les deux champs vides pour utiliser APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Déconnecter tout le monde d’un coup',
  'help.guide.notification-defaults.step.2':
    'Cliquez sur une case pour la faire passer à l’état suivant : « Activé », « Désactivé », « Bloqué ». L’info-bulle indique l’état suivant, et chaque clic est enregistré immédiatement.',
  'help.ctx.notifications.bullet.2':
    '« Tous » et « Non lues », en haut, permettent de passer de toutes les notifications aux seules non lues. La liste se charge au fur et à mesure du défilement.',
  'help.guide.read-notifications.step.3':
    'Cliquez sur le bouton sous une notification, ici « Voir Vacay », pour ouvrir ce qu’elle concerne. Elle est alors aussi marquée comme lue.',
  'help.guide.filter-notifications.step.3':
    'Cliquez sur « Non lues » pour n’afficher que les notifications non lues. « Tous » les réaffiche toutes.',
  'help.guide.mark-notifications-read.tip.2':
    'Marquer comme lu ne change que la couleur de fond et le compteur. La notification reste dans la liste jusqu’à ce que vous la supprimiez.',
  'help.guide.delete-notifications.result': 'La notification disparaît de la liste et de la cloche.',
  'help.guide.notification-settings.result':
    '« Paramètres » est ouvert sur « Notifications », avec un interrupteur par événement et par canal.',
  'help.guide.link-journal.goal':
    'Afficher l’un de vos journaux de voyage dans le voyage, pour les personnes de votre choix.',
  'help.guide.link-journal.tip.3':
    "Par la suite, « Journal » dans « Paramètres du voyage » propose « Modifier l'accès », « Changer de journal » et « Délier ». Délier supprime l’onglet ; les personnes que vous avez ajoutées dans le journal lui-même conservent leur accès.",
  'help.guide.dawarich-stays.result':
    'Le séjour devient un lieu du voyage, sur le jour choisi ou parmi les « Non planifiés », et le panneau l’indique comme traité.',
  'help.ctx.trip-days.bullet.7':
    'Pendant le voyage, le programme s’ouvre sur le jour en cours et y fait défiler la liste.',
  'help.guide.leave-stop-off-route.tip.2':
    '« Retirer du jour » retire l’étape de la journée ; « Retirer de l’itinéraire » la garde dans le programme.',
  'help.guide.move-booking-day.goal':
    'Déplacer un transport ou une réservation sur un autre jour directement depuis le programme, sans ouvrir son formulaire.',
  'help.guide.place-image-from-file.result':
    'La photo devient l’image du lieu sur sa fiche, dans la colonne des lieux, dans la journée et sur la carte.',
  'help.guide.place-own-hours.step.3':
    "« Horaires d'ouverture », en dessous, affiche la semaine, une ligne par jour. Si TREK a trouvé des horaires pour le lieu, ils sont déjà remplis ; sinon, cliquez d’abord sur « Ajouter les horaires ». Saisissez l’heure d’ouverture et de fermeture de chaque jour, et cliquez sur « Fermé » pour un jour de fermeture.",
  'help.guide.add-accommodation.tip.5':
    'Les traces GPX et les lieux de sorties ne sont jamais proposés comme hébergement, seulement les lieux ordinaires du voyage.',
  'help.guide.confirm-stay-booking.step.1':
    'Ouvrez le jour de votre arrivée. Sur la carte du séjour, sous « Réservation », figure la réservation d’hôtel de cette nuit, avec « En attente » ou « Confirmé ». Cliquez sur cette case.',
  'help.guide.tour-map-lines.step.4':
    'Pour retirer une sortie de la carte, passez la colonne de droite sur « Sorties », survolez la sortie et cliquez sur l’œil, « Masquer sur la carte ». Son tracé et son épingle disparaissent de la carte, et sa ligne reste dans la liste, estompée, avec un œil barré, « Afficher sur la carte », qui la réaffiche.',
  'help.guide.car-stops.step.1':
    'Dans l’en-tête du jour où vous prenez la voiture, cliquez sur le +, dont l’info-bulle indique « Ajouter au jour », et choisissez « Ajouter un transport ».',
  'help.guide.car-stops.tip.2': '« Monter » et « Descendre » n’apparaissent qu’à partir de deux étapes.',
  'help.guide.transport-details.title': 'Ouvrir un transport et consulter ses détails',
  'help.guide.transport-details.tip.1':
    'Cliquer de nouveau sur « Sur la carte », pour un trajet dont le tracé est affiché, masque le tracé.',
  'help.guide.export-transports-csv.result':
    'Votre navigateur enregistre un fichier nommé d’après le voyage, par exemple autumn-in-japan-transports.csv, avec une ligne par trajet : Type, Title, Status, Start, End, From, To, Location, Confirmation et Notes.',
  'help.guide.group-sort-bookings.goal':
    'Organiser les cartes ou la liste par statut, par jour ou par type, dans l’ordre de votre choix.',
  'help.guide.booking-on-map.tip.1':
    '« Sur la carte » n’apparaît que pour une réservation associée à un lieu. Choisissez-en un sous « Lieu / Activité » dans le formulaire, et le bouton apparaît.',
  'help.guide.export-bookings-csv.step.2':
    "Ouvrez « Options d'affichage », les curseurs après les icônes de vue, et choisissez un ordre sous « Trier par ». Les lignes le suivent, à raison d’une ligne par réservation, sans sections.",
  'help.guide.edit-booking.tip.4':
    'Si vous avez modifié quelque chose, un clic en dehors du formulaire, ou la touche Échap, affiche « Abandonner vos modifications ? ». « Continuer la modification » vous ramène au formulaire.',
  'help.guide.arrange-packing-list.step.2':
    'Dans une liste, la poignée à gauche d’une ligne permet de déplacer l’article vers le haut ou le bas. Un trait dans votre couleur d’accent, sur le bord gauche d’une ligne, indique où il sera placé.',
  'help.guide.count-packed-pieces.goal':
    'Indiquer la quantité d’un article et marquer ses pièces comme emballées une par une.',
  'help.guide.count-packed-pieces.tip.3':
    'Avec une quantité de un, aucun compteur ne s’affiche : seule la case à cocher est présente.',
  'help.guide.expense-receipts.step.2':
    'Cliquez sur « Joindre » à côté de « Reçus et factures » et choisissez la photo ou le PDF ; vous pouvez aussi en choisir plusieurs à la fois. Chaque fichier est listé sous le titre, avec une corbeille pour le retirer.',
  'help.guide.files-sync-settings.goal':
    'Choisir si les documents sont seulement importés depuis votre stockage, seulement exportés vers lui, ou les deux, et ce qui se passe quand un document est supprimé ou modifié des deux côtés.',
  'help.guide.files-sync-settings.tip.2':
    'Avec « Me demander », un document modifié des deux côtés attend sous « À vérifier », sous la carte. Cliquez sur « Résoudre » et choisissez « Garder la version TREK », « Garder la version du fournisseur » ou « Garder les deux ».',
  'help.guide.manage-notes.goal':
    'Ouvrir une note en entier, garder la plus importante en haut, et corriger ou supprimer ce qui n’est plus à jour.',
  'help.guide.manage-notes.tip.2':
    'Pendant la modification, la croix rouge sur un fichier déjà joint le supprime immédiatement, avant même que vous cliquiez sur « Enregistrer », et il ne passe pas par la corbeille. Tous les fichiers d’une note apparaissent aussi dans l’onglet « Fichiers » du voyage.',
  'help.guide.note-categories.step.6':
    'De retour dans la carte « Notes », les pastilles sous l’en-tête filtrent les cartes. Cliquez sur une catégorie pour n’afficher que ses notes ; « Tous », ou un nouveau clic sur la même pastille, les réaffiche toutes.',
  'help.guide.roadtrip-reorder.tip.1':
    'Déplacer une étape ici la déplace aussi dans le programme du jour : « Jours » affiche le même ordre.',
  'help.guide.roadtrip-overnight.step.1':
    'Dans « Sur le trajet », cochez « Hébergement » sous « Recherche de », ou « Camping » pour un emplacement, choisissez le jour où vous voulez vous arrêter, et cliquez sur « Rechercher ».',
  'help.guide.roadtrip-overnight.tip.3':
    'Si « Commencer et finir chaque jour à votre hébergement » est activé, sous « Ligne de l’itinéraire » dans « Réglages de conduite », le trajet du lendemain part de l’endroit où vous avez dormi.',
  'help.guide.roadtrip-stop-fill.title': 'Définir le niveau de remplissage d’un arrêt',
  'help.guide.roadtrip-bookings.title': 'Intégrer votre vol, train ou ferry au trajet',
  'help.guide.roadtrip-bookings.tip.2':
    'Une table ou un billet réservé à une étape apparaît en pastille sur cette étape ; ce qui ne se rattache à aucune étape est listé sous « Également réservé ce jour ».',
  'help.guide.roadtrip-google-import.step.3':
    'Vérifiez les étapes trouvées. Chacune indique où elle se situe ; une étape marquée « Lieu non résolu » est ignorée.',
  'help.guide.roadtrip-hazards.step.1': 'Ouvrez « Réglages de conduite » dans la colonne de droite.',
  'help.ctx.trip-tours.summary':
    'La colonne de droite de l’onglet « Prévu » en mode « Sorties » : toutes les sorties du voyage dans une seule liste, à côté des jours. D’ici, vous placez des sorties sur des jours, filtrez la liste, masquez des tracés sur la carte et importez des fichiers GPX ou KML. Les itinéraires se tracent et se modifient dans l’onglet « Sorties ».',
  'help.guide.tour-show-list.goal':
    'Remplacer la colonne des lieux par les sorties du voyage, pour les voir et les choisir à côté des jours.',
  'help.guide.tour-show-list.tip.3':
    'Avec l’extension Sorties activée, les traces n’apparaissent jamais dans la liste des lieux : chaque trace importée devient une sortie et figure ici.',
  'help.guide.tour-add-to-day.step.5':
    'Pour une sortie en plusieurs étapes, le même menu pose ensuite une question. « Étapes à partir de ce jour » place l’étape 1 sur ce jour et chaque étape suivante sur le jour d’après ; « L’itinéraire complet sur ce jour » place toute la sortie sur ce seul jour.',
  'help.guide.tour-day-times.step.1':
    "Dans la colonne des jours, survolez la ligne de la sortie, cliquez sur « Plus d'options » (les trois points) et choisissez « Modifier ».",
  'help.guide.tour-day-times.result':
    'La sortie apparaît dans la chronologie de la journée avec son début et sa fin, comme toute étape à heure fixe.',
  'help.guide.tour-remove-from-day.result':
    'La sortie n’apparaît plus dans la journée, et sa ligne dans la liste n’a plus de badge « Jour ».',
  'help.guide.tour-filter-list.tip.2':
    'Une section n’apparaît que si les sorties diffèrent sur ce critère : une courte liste peut donc ne proposer que « Statut ».',
  'help.guide.tour-hide-on-map.tip.1':
    'Le masquage ne concerne que vous et n’est mémorisé que dans ce navigateur, pour ce voyage : la sortie, ses jours et sa couleur ne changent pas, et elle reste visible sur la carte des autres.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Une trace déjà présente dans le voyage est marquée « Déjà dans le voyage » et n’est pas importée deux fois.',
  'help.ctx.trip-tour-detail.bullet.4':
    'La rangée du bas : « Ajouter au jour » ou « Retirer du jour » quand un jour est ouvert, « Navigation » vers le départ, la page web de la sortie, GPX, « Partager » si votre appareil peut partager des fichiers, « Collection » et « Copier ».',
  'help.guide.tour-detail-read.step.5':
    'Viennent ensuite les mesures : « Distance », « Altitude minimale », « Altitude maximale », « Dénivelé positif » et « Dénivelé négatif », les durées en dessous, et le profil altimétrique dans la couleur du tracé de la sortie.',
  'help.guide.tour-detail-read.result':
    'La fiche de la sortie est ouverte à côté du programme : vous savez sur quels jours elle a lieu, sa longueur, sa difficulté en dénivelé et sa provenance.',
  'help.guide.tour-rename-colour.tip.2':
    'Le crayon et la pastille de couleur ne fonctionnent que pour les membres autorisés à modifier les lieux.',
  'help.guide.tour-take-along.tip.2':
    'Choisissez une application de cartographie préférée dans « Paramètres » : « Navigation » ouvrira directement cette application au lieu de proposer la liste.',
  'help.guide.tour-copy-keep.step.3':
    'Pour conserver une sortie pour d’autres voyages, ouvrez-la et cliquez sur « Collection » en bas de sa fiche.',
  'help.guide.tour-packing-link.goal':
    'Afficher dans la fiche d’une sortie ce qu’il faut emporter, depuis la liste de bagages du voyage ou l’une de ses listes.',
  'help.guide.tour-packing-link.tip.3':
    'Lier nécessite le droit de modifier les lieux. Les autres voient la liste liée, mais ne peuvent pas modifier le lien.',
  'help.guide.tour-files.tip.2':
    '« Importer » n’apparaît que pour les membres autorisés à modifier la sortie et à ajouter des fichiers.',
  'help.guide.tour-activity-link.step.5':
    'La trace apparaît désormais sous « Trace réelle », avec ses propres valeurs et son propre profil à côté du programme.',
  'help.guide.tour-activity-compare.step.2':
    '« Écart maximal au plan » indique la plus grande distance entre la trace et le tracé prévu, et « Hors du plan » la part de la trace qui s’est écartée de ce tracé.',
  'help.guide.tour-origin-check.step.1':
    'Ouvrez la fiche de la sortie et faites défiler jusqu’à « Origine ». « Source » indique sa provenance : « Import GPX » avec le nom du fichier, import KML ou KMZ, ou wanderer avec son adresse.',
  'help.ctx.trip-tour-planner.summary':
    'Le planificateur de sorties du voyage : l’éditeur à gauche, toutes les sorties du voyage à droite et la carte au centre. Vous y tracez une sortie point par point, calculez son itinéraire sur de vrais chemins et routes, ajoutez ses détails et l’enregistrez dans le voyage.',
  'help.guide.tour-open-workspace.goal':
    'Ouvrir le planificateur de sorties et savoir à quoi sert chacune de ses parties.',
  'help.guide.tour-open-workspace.tip.1':
    '« Réduire », sur l’onglet au bord intérieur de chaque volet, masque le volet pour agrandir la carte ; « Prévu » et « Sorties de ce voyage » réaffichent les volets. Faites glisser le bord d’un volet pour l’élargir ou le rétrécir.',
  'help.guide.tour-draw-route.step.3':
    'Vérifiez que « Ajouter un point », sous « Points de passage », est activé (c’est le même interrupteur que « Placer des points » dans la pastille de la carte), puis cliquez sur la carte au point de départ de la sortie.',
  'help.guide.tour-draw-route.result':
    'Un itinéraire numéroté sur la carte et ses points sous « Points de passage », prêt à être nommé et enregistré.',
  'help.guide.tour-type-profile.tip.2':
    'Certains types demandent davantage avant de pouvoir être enregistrés : une « Course à pied » son « Allure prévue », une « Sortie en pagaie » son embarcation et son plan d’eau, une sortie « Ski et hiver » sa discipline.',
  'help.guide.tour-edit-points.step.5':
    '« Supprimer le point de passage », la corbeille à côté, retire le point de la sortie.',
  'help.guide.tour-shaping-points.step.2':
    'Faites glisser le point sur le chemin que l’itinéraire doit emprunter. L’itinéraire est recalculé en passant par lui.',
  'help.guide.tour-loop-reverse.goal': 'Faire revenir la sortie à son point de départ, ou inverser son sens.',
  'help.guide.tour-leg-by-hand.title': 'Tracer un tronçon à la main, ou le recalculer',
  'help.guide.tour-leg-by-hand.result':
    'Le tronçon est une ligne droite à l’endroit choisi, marquée comme tracée à la main, ou il est de nouveau calculé.',
  'help.guide.tour-trip-places.tip.2':
    'Supprimer l’étape ou la détacher laisse le lieu inchangé dans le voyage, y compris ses jours.',
  'help.guide.tour-details-times.step.4':
    '« Prévu » affiche le total. Saisissez votre propre valeur pour le remplacer ; elle est alors marquée « Valeur manuelle ».',
  'help.guide.tour-save.step.2':
    'Attendez que le point à côté de « Nouvelle sortie » ait disparu. L’enregistrement nécessite l’itinéraire et toutes ses altitudes.',
  'help.guide.tour-edit-saved.goal': 'Ouvrir une sortie planifiée auparavant, la modifier et l’enregistrer à nouveau.',
  'help.guide.tour-edit-saved.result': 'La sortie enregistrée contient désormais vos modifications.',
  'help.guide.tour-summary-profile.tip.2':
    'Un itinéraire qui passe par une via ferrata reçoit, au-dessus des chiffres, un badge d’avertissement avec sa cotation.',
  'help.guide.tour-list-manage.step.4':
    'Le bouton au-dessus de « Totaux du voyage » est le filtre. Il indique le statut affiché, « Tous » au départ, avec le nombre de sorties.',
  'help.guide.tour-delete.step.1':
    'Survolez la sortie sous « Sorties de ce voyage » et cliquez sur la corbeille à droite de sa ligne, « Supprimer » suivi du nom de la sortie.',
  'help.guide.tour-saved-elsewhere.step.1':
    '« Cette sortie a été enregistrée ailleurs » apparaît en haut du volet pendant votre modification. Vos modifications sont conservées jusqu’à votre décision.',
  'help.ctx.trip-tour-import.summary':
    'Ici, vous importez dans le voyage des sorties qui existent déjà ailleurs : un fichier GPX, KML ou KMZ issu d’une montre ou d’une application, une sortie d’un autre de vos voyages, ou un sentier de votre propre wanderer. Un import est conservé exactement tel qu’il a été enregistré, et vous pouvez en planifier une version modifiable.',
  'help.guide.tour-import-gpx.step.1':
    'Ouvrez l’onglet « Sorties » du voyage. En haut de « Sorties de ce voyage », à droite, cliquez sur le + (« Ajouter une sortie »).',
  'help.guide.tour-import-gpx.tip.4':
    'Un fichier KML ou KMZ liste aussi sous « Non importé » ce qu’il contenait en plus de ses tracés : épingles, zones et autres éléments.',
  'help.guide.tour-view-import.tip.1':
    'Un import ne peut pas être modifié point par point. « Planifier une version modifiable », dans la carte « Version modifiable » au-dessus, en fait une sortie que vous pouvez modifier.',
  'help.guide.tour-plan-from-import.step.3':
    "Cliquez sur « Remplacer l'import » pour recalculer cette sortie à sa place : ses jours et ses notes sont conservés, ainsi que la trace enregistrée, que vous pourrez restaurer. « Planifier comme nouvelle sortie » ne modifie pas l’import et crée une seconde sortie à côté.",
  'help.guide.tour-restore-recorded.goal':
    'Annuler le recalcul d’un import et retrouver la trace d’origine, même longtemps après.',
  'help.guide.tour-take-over.goal':
    'Réutiliser une sortie déjà planifiée ou importée dans un autre de vos voyages, sans la retracer.',
  'help.guide.tour-take-over.tip.2':
    'Seuls vos autres voyages sont listés, et seulement les 100 premières sorties. Utilisez la recherche ou les filtres pour trouver les autres.',
  'help.guide.tour-import-wanderer.step.4': 'Cliquez sur « Importer dans le voyage ».',
  'help.ctx.trip-tour-map.bullet.1':
    'La pastille en bas à gauche de la carte regroupe les fonds de carte proposés pour le type de la sortie ouverte : « Carte », Topo, « Randonnée » pour une randonnée, « Vélo » pour une sortie à vélo, et Satellite. Ce choix ne s’applique qu’au planificateur et ne modifie jamais le réglage de carte dans « Paramètres ».',
  'help.guide.tour-map-layers.step.2':
    'Cliquez sur Topo pour afficher les courbes de niveau et l’ombrage du relief, la carte qui montre la pente du terrain. Le fond choisi reste en surbrillance dans la pastille.',
  'help.guide.tour-along-search.step.1':
    "Ouvrez une sortie dans l’onglet « Sorties » et faites défiler le panneau de gauche jusqu’à « Le long de l'itinéraire », sous les étapes de la sortie. La carte apparaît dès que la sortie a un itinéraire.",
  'help.guide.tour-along-search.tip.3':
    'Les résultats proviennent d’OpenStreetMap et de l’index de lieux de TREK : la recherche nécessite donc une connexion. Si rien n’est trouvé, « Élargir à » essaie la distance suivante ; si un serveur est surchargé, « Réessayer » affiche un compte à rebours avant de pouvoir relancer.',
  'help.guide.tour-along-add-stop.tip.1':
    'Le lieu devient une étape de la sortie, pas un lieu du voyage : il n’apparaît donc pas dans la liste des lieux.',
  'help.guide.tour-3d-terrain.step.4':
    'Faites glisser le curseur « Relief » pour rendre les reliefs jusqu’à trois fois plus hauts, ce qui aide sur un terrain peu accidenté.',
  'help.guide.tour-3d-flyover.step.1':
    'Passez la sortie en 3D. Pendant le chargement du relief le long de l’itinéraire, un anneau se remplit à l’emplacement du bouton de lecture ; une fois plein, cliquez sur « Lancer le survol ». La caméra suit un point le long de l’itinéraire, et le curseur du profil altimétrique, dans « Résumé de la sortie », se déplace en même temps.',
  'help.guide.tour-map-overlays.title': 'Afficher les pistes ou le balisage maritime sur la carte',
  'help.guide.tour-map-overlays.tip.2':
    'Sans sortie ouverte, l’interrupteur des pistes est aussi disponible, pour consulter un domaine skiable avant de planifier quoi que ce soit. Sur une randonnée, la pastille propose plutôt « Via ferrata », avec le nombre d’itinéraires visibles.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Le plus sur la ligne d’une sortie, « Ajouter au jour », place les étapes sur le voyage, une par jour à partir du jour choisi, ou toute la sortie sur ce seul jour.',
  'help.guide.tour-multi-day.step.6':
    'Pour revenir à une sortie d’une journée, cliquez sur « Une journée » et confirmez « En faire une sortie d’une journée ? » avec « Retirer les fins d’étape ». L’itinéraire reste inchangé.',
  'help.guide.tour-stages-on-days.step.1':
    'Dans « Sorties de ce voyage », survolez la sortie sur plusieurs jours et cliquez sur le plus, « Ajouter au jour ».',
  'help.guide.tour-stages-on-days.tip.3':
    'Faire glisser une sortie sur plusieurs jours sur un jour de l’onglet « Prévu » pose la même question dans une boîte de dialogue, tout comme « Ajouter au jour » dans la fiche de la sortie.',
  'help.ctx.trip-tour-hike.bullet.4':
    '« Détails du sentier », sous les points de passage, affiche la cotation SAC, le revêtement et le type de voie de chaque portion d’après OpenStreetMap, et colore l’itinéraire sur la carte en conséquence. Rien dans cette carte ne modifie la sortie.',
  'help.guide.tour-hike-plan.step.4':
    '« Ajouter un point » est activé d’emblée : cliquez sur la carte au départ et à l’arrivée de la randonnée. « Lieux du voyage », juste à côté, permet plutôt de choisir un refuge ou un hôtel du voyage. Dès deux points, TREK calcule l’itinéraire de marche.',
  'help.guide.tour-hike-trail-details.title': 'Voir cotations, revêtements et types de voie le long d’une randonnée',
  'help.guide.tour-hike-trail-details.tip.1':
    'Les voies sans valeur dans OpenStreetMap sont listées sous « Inconnu », et inconnu ne veut pas dire facile. Si certaines affichent « Pas interrogeable cette fois », cliquez sur « Réessayer ».',
  'help.guide.tour-hike-round.step.4':
    'Cliquez sur une boucle pour la choisir. Sa ligne indique la distance, le dénivelé et la durée, ainsi que l’écart avec la distance demandée.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Survolez l’étape où commence le tronçon, cliquez sur « Plus d’actions » sur sa ligne et choisissez « Comparer les chemins du tronçon suivant ».',
  'help.guide.tour-ferrata-add.title': 'Ajouter une via ferrata à une randonnée',
  'help.guide.tour-ferrata-add.tip.1':
    'Une via ferrata demande du matériel et de l’expérience. L’info-bulle du badge indique quelle part de l’itinéraire est en via ferrata.',
  'help.guide.tour-run-plan.step.3':
    'Saisissez votre « Allure prévue » en minutes et secondes par kilomètre, par exemple 7:30.',
  'help.guide.tour-run-ways.title': 'Voir quelles voies emprunte une course',
  'help.ctx.trip-tour-walk.title': 'Balade urbaine',
  'help.guide.tour-walk-plan.goal':
    'Composer une balade touristique à partir d’étapes, avec la durée de chaque arrêt et l’importance de chacune.',
  'help.guide.tour-walk-plan.tip.2':
    'Une balade urbaine n’a ni limite de randonnée ni champ « Pauses » : ce sont les durées d’arrêt qui comptent.',
  'help.guide.tour-walk-sights.step.4':
    'Cliquez sur un lieu de la liste. Sa fiche s’ouvre par-dessus la carte : sous « Où l’insérer », choisissez les deux étapes entre lesquelles il se place.',
  'help.guide.tour-walk-day-times.step.1':
    'Placez la balade sur un jour : dans « Sorties de ce voyage », cliquez sur le + rond de sa ligne (« Ajouter au jour ») et choisissez le jour.',
  'help.guide.tour-walk-day-times.result':
    'Vous pouvez réordonner les étapes ou modifier les durées d’arrêt jusqu’à ce que chaque lieu soit ouvert à votre arrivée.',
  'help.guide.tour-walk-google-import.tip.2':
    '« Prendre un autre lien » vous ramène au champ du lien. Le chargement remplace les modifications non enregistrées dans le planificateur, et la boîte de dialogue vous prévient d’abord.',
  'help.guide.tour-walk-check-off.step.4':
    'Le haut de la liste compte les étapes visitées et indique le temps de marche restant. « Annuler » sur une étape retire son marquage.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Le « Résumé de la sortie », à droite, indique « Temps à vélo (estimé) », la durée calculée pour le profil, montées comprises. Les pauses ne sont pas incluses.',
  'help.guide.tour-bike-profile.step.4':
    'Sous « Points de passage », cliquez sur « Lieux du voyage » et choisissez le départ et l’arrivée, ici Hotel Alpenroyal puis Hotel Greif. Vous pouvez aussi vérifier que « Ajouter un point » est activé et cliquer sur la carte. Dès deux points, TREK calcule l’itinéraire.',
  'help.guide.tour-bike-profile.tip.5':
    'Si un administrateur autorise la carte CyclOSM, la rangée des couches propose aussi « Vélo » quand une sortie à vélo est ouverte. Si elle ne se charge plus, passez à « Carte ». La sortie n’est pas modifiée.',
  'help.guide.tour-bike-surfaces.tip.1':
    '« Absent des données » signifie qu’OpenStreetMap n’indique aucun revêtement à cet endroit. Le revêtement est inconnu, pas forcément bon.',
  'help.guide.tour-bike-mtb-grades.step.3':
    'Cliquez sur une ligne de difficulté pour mettre ces sentiers en évidence sur la carte.',
  'help.ctx.trip-tour-ski.bullet.1':
    '« Discipline » vient en premier, sans présélection : « Alpin », Snowboard, « Ski de fond », « Ski de randonnée », « Raquettes » ou « Rando hivernale ». Le « Ski de fond » demande aussi la « Technique » : « Classique », Skating ou « Inconnue ». Sans discipline, la sortie ne peut pas être enregistrée.',
  'help.guide.tour-ski-plan.step.2': 'Ouvrez « Type de sortie » et choisissez « Ski et hiver ».',
  'help.guide.tour-ski-plan.tip.4':
    'En l’absence de données de pistes, un tronçon est une ligne droite entre ses points. Pour les raquettes et la randonnée hivernale, il peut emprunter des sentiers d’été à la place, ce qu’indique une remarque grise sur le tronçon.',
  'help.guide.tour-ski-options.step.5':
    'Sous « Exclure », appuyez sur chaque type de remontée que vous ne voulez pas prendre : « Téléskis », « Télésièges ouverts », « Télécabines », « Téléphériques » ou « Funiculaires et trains ». Un type sélectionné apparaît barré.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Cliquez sur la solution proposée par la ligne : « Autoriser des pistes plus difficiles », « Autoriser cette remontée », « Redescendre en remontée », « Changer de technique » ou « Changer de discipline ». L’option change et le tronçon est recalculé.',
  'help.guide.tour-ski-summary.goal': 'Voir comment la journée se répartit entre ski, remontées, attente et marche.',
  'help.guide.tour-ski-summary.result':
    'Vous savez combien de temps la journée prend sur les pistes, sur les remontées et dans les files d’attente.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Cette couche affiche des données cartographiques, pas un bulletin en temps réel : elle ne dit rien de ce qui est ouvert ou damé, de la neige ni des avalanches. L’interrupteur est aussi disponible sans sortie ouverte, pour consulter un domaine skiable avant de planifier.',
  'help.guide.tour-ski-import.step.5':
    'Cliquez sur la trace dans « Sorties de ce voyage » pour l’ouvrir. Pour corriger sa discipline plus tard, cliquez sur « Changer » dans sa carte « Trace de ski ».',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Sous « Type de sortie », « Sortie en pagaie » demande un « Bateau » (« Kayak », « Canoë », « SUP » ou « Autre ») et le « Plan d’eau » (« Rivière » ou « Lac »). La sortie ne peut pas être enregistrée tant que les deux ne sont pas choisis.',
  'help.guide.tour-paddle-setup.step.1':
    'Dans l’onglet « Sorties », cliquez sur « Planifier une nouvelle sortie » en haut de la colonne de gauche.',
  'help.guide.tour-paddle-setup.tip.2':
    'La carte d’une sortie en pagaie propose « Carte » et Satellite, ainsi que le « Balisage maritime » d’OpenSeaMap en surcouche.',
  'help.guide.tour-paddle-water-route.step.3':
    'Choisissez « Planifier le tronçon suivant sur l’eau ». TREK calcule le tronçon le long de la rivière ou du lac, de ce point jusqu’au suivant.',
  'help.guide.tour-paddle-portage.title': 'Porter l’embarcation pour contourner un obstacle',
  'help.guide.tour-paddle-portage.tip.2':
    "Sur le dernier point, « Porter l’embarcation à partir d’ici » s’applique dès que vous placez le point suivant. La ligne indique « Portage à partir d'ici », et sa croix, « Finalement ne pas porter », annule l’action.",
  'help.guide.tour-paddle-lock.step.4':
    'Saisissez les minutes pour « Attente » et pour « Éclusage ». Une fois les deux renseignés, la carte affiche leur somme.',
  'help.guide.tour-paddle-time.step.2':
    'La bande représente l’itinéraire du départ à l’arrivée : l’eau, les portages en marron et les écluses sous forme de traits. Les obstacles de l’itinéraire sont des repères sur lesquels vous pouvez cliquer pour les retrouver sur la carte.',
  'help.guide.tour-paddle-wind.title': 'Consulter le vent pour une journée de pagaie',
  'help.guide.tour-paddle-wind.tip.3':
    'Par jour de vent avec une traversée de lac, la carte propose « Planifier près de la rive », qui fait longer la berge sur les lacs.',
  'help.guide.tour-paddle-checklist.step.4':
    'Cliquez sur une entrée. La carte se centre dessus : pour un obstacle, sa fiche s’ouvre avec votre décision ; pour votre propre portage ou écluse, son point est sélectionné.',
  'help.guide.tour-paddle-track-marks.title': 'Marquer portages et écluses sur une trace de pagaie enregistrée',
  'help.guide.tour-paddle-track-marks.step.7':
    'Ouvrez les cartes, saisissez leurs minutes et cliquez sur « Enregistrer ».',
  'help.ctx.trip-tour-horse.bullet.2':
    'Un itinéraire s’ouvre dans sa propre boîte de dialogue : choisissez un tronçon et le « Sens » dans lequel vous le parcourez, vérifiez « Accès à cheval », puis cliquez sur « Reprendre le tronçon ».',
  'help.guide.tour-horse-plan.step.3':
    'Dans la carte « Itinéraires équestres », cliquez sur « Chercher dans la vue ». Chaque itinéraire équestre balisé visible est listé avec sa longueur dans la zone affichée.',
  'help.guide.tour-horse-plan.tip.3':
    'Vous avez déplacé la carte après une recherche ? Le bouton indique « Chercher dans cette vue ». Si la zone affichée est trop grande, TREK vous demande d’abord de zoomer.',
  'help.guide.tour-horse-gap.step.4':
    'Dans la carte « Points de passage », la liaison affiche « Manuel, non vérifié », avec sa longueur. Survolez-la pour en connaître la raison.',
  'help.guide.tour-horse-recorded.step.2':
    "L’« Aperçu de l'import » s’ouvre, sans rien enregistrer pour l’instant. Sous « Importer comme », réglez « Type de sortie » sur « Randonnée équestre ». Trois badges indiquent ce que l’import conserve et ce qu’il ne calcule pas.",
  'help.guide.dateless-trip.goal': 'Commencer à planifier avant de connaître vos dates de voyage.',
  'help.guide.trip-reminder.step.3': 'Cliquez sur « Mettre à jour ».',
  'help.guide.upcoming-reservations.goal':
    'Voir les prochaines réservations de tous vos voyages et ouvrir le voyage correspondant.',
  'help.guide.log-day.tip.3':
    'Un jour marqué comme jour férié d’entreprise complet ne peut pas être saisi. Lors d’une demi-journée fériée d’entreprise, un jour de congé ne compte que pour 0,5.',
  'help.guide.half-company-holiday.goal':
    'Offrir à tous un après-midi libre, par exemple la veille de Noël, sans fermer toute la journée.',
  'help.guide.public-holidays.tip.2': 'Survolez un jour férié dans la grille pour voir son nom.',
  'help.guide.edit-holiday-calendar.step.3':
    'Changez le pays ou la région dans ses listes, ou cliquez sur la corbeille pour supprimer le calendrier.',
  'help.guide.person-color.step.2':
    'Choisissez une couleur. Elle est enregistrée immédiatement et la boîte de dialogue se ferme.',
  'help.guide.answer-fusion-request.goal':
    'Décider de fusionner ou non votre planning de congés avec celui de la personne qui vous a invité.',
  'help.guide.log-for-partner.goal':
    'Saisir un jour de congé pour une personne dont le planning est fusionné avec le vôtre, par exemple à sa demande.',
  'help.guide.dissolve-fusion.goal': 'Séparer un planning fusionné en plannings distincts.',
  'help.guide.country-places.step.1':
    'Recherchez un pays que vous avez visité et sélectionnez-le. Sa fiche apparaît dans le panneau du bas.',
  'help.guide.tour-activity-stats.step.3':
    'Lisez les chiffres : la distance, avec le nombre de sorties dans son coin, puis « Dénivelé positif » et « Dénivelé négatif ». Avec « Tous les types », les trois types que vous avez le plus pratiqués suivent, chacun avec son nombre et sa distance.',
  'help.guide.move-to-list.step.1':
    'Cliquez sur l’icône de case à cocher, « Choisir », dans la rangée de filtres et cochez les lieux.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Sous « Dans le voyage », choisissez le voyage. Un voyage auquel vous ne pouvez pas ajouter de sorties est estompé.',
  'help.guide.tour-collection-manage.goal':
    'Voir quelles sorties contient une liste et d’où elles viennent, et retirer celles dont vous n’avez plus besoin.',
  'help.guide.entry-draft.goal':
    'Rédiger une entrée maintenant et la masquer du journal partagé jusqu’à ce qu’elle soit prête.',
  'help.guide.journey-map-layers.step.2':
    'Cliquez sur le (i) au bout de la barre pour afficher la légende : elle explique chaque épingle, point et ligne.',
  'help.guide.journey-keep-route.step.2':
    'Vérifiez « Fuseau horaire du jour », qui détermine le début et la fin de la journée, ainsi que l’enregistrement : distance, plage horaire, segments et interruptions.',
  'help.guide.journey-day-stays.step.2':
    'Cliquez sur « Écrire une entrée de journal » sur un séjour. L’entrée est ajoutée à ce jour, à l’heure d’arrivée, avec le nom et la position du séjour.',
  'help.guide.journey-take-over-day.step.2':
    'Cochez les séjours à garder et corrigez leurs noms. « Regrouper en une entrée », entre deux séjours cochés, les fusionne ; « Garder séparés » les sépare à nouveau.',
  'help.guide.journey-auto-prepare.step.1':
    'Cliquez sur ⋯ en haut à droite de l’en-tête pour ouvrir « Paramètres du journal ».',
  'help.guide.photo-location.step.1':
    'Cliquez sur ⋯ en haut à droite de l’en-tête pour ouvrir « Paramètres du journal ».',
  'help.guide.share-public.tip.3':
    'Les brouillons n’apparaissent jamais sur le lien, et les trajets enregistrés ne s’affichent que les jours qui ont une entrée publiée.',
  'help.ctx.settings-plugins.title': 'Plugins', // same-as-en
  'help.ctx.settings-about.bullet.2':
    '« Signaler un bug » et « Proposer une fonctionnalité » ouvrent le projet sur GitHub ; Wiki ouvre la documentation.',
  'help.guide.map-provider.tip.3':
    'Sur une carte GL, faites un clic droit et glissez pour la faire pivoter et l’incliner ; un clic avec la molette ajoute un lieu.',
  'help.guide.web-push-device.step.1':
    'Sous « Notifications push sur cet appareil », cliquez sur « Activer sur cet appareil » et autorisez les notifications quand le navigateur le demande. « Envoyer un test » vérifie qu’elles arrivent bien.',
  'help.guide.connect-airtrail.title': 'Connecter votre AirTrail',
  'help.guide.connect-dawarich.title': 'Connecter votre Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Connecter votre wanderer',
  'help.guide.tour-connect-wanderer.tip.3': '« Déconnecter », à droite, supprime le jeton.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Vous choisissez les canaux de ces signalements dans « Notifications », sur la ligne « wanderer : signalements sur vos sentiers ».',
  'help.guide.plugin-settings.tip.1':
    'Ces réglages ne concernent que vous ; les autres membres configurent le plugin pour eux-mêmes.',
  'help.guide.offline-conflicts.step.3':
    'Les modifications que le serveur refuse obstinément apparaissent sous « Cache hors ligne » comme « Modifications échouées » : « Réessayer » les renvoie, « Ignorer » conserve la version du serveur.',
  'help.ctx.admin-notifications.bullet.4':
    '« Valeurs par défaut des utilisateurs », en bas : pour chaque événement et chaque canal, « Activé », « Désactivé » ou « Bloqué » pour tous ceux qui n’ont pas modifié ce réglage.',
  'help.guide.default-user-settings.step.2':
    'Un champ modifié reçoit un lien « réinitialiser » à côté de son nom ; il rétablit la valeur par défaut de TREK.',
  'help.guide.own-routing-engine.title': 'Utiliser vos propres serveurs de calcul d’itinéraire',
  'help.guide.admin-passkeys.result':
    'La page de connexion propose « Se connecter avec une passkey », et les utilisateurs peuvent ajouter des passkeys dans leurs paramètres.',
  'help.guide.rotate-jwt-secret.goal': 'Fermer toutes les sessions après une fuite présumée.',
  'help.guide.notification-defaults.result':
    'Tous ceux qui n’ont pas modifié une case partent de votre choix, et les cases bloquées apparaissent verrouillées dans leurs paramètres.',
  'help.ctx.notifications.bullet.3':
    'Chaque notification indique qui a fait quoi et où. Les non lues ont un fond coloré. Un bouton en dessous, comme « Voir le voyage » ou « Voir Vacay », vous y emmène et la marque comme lue.',
  'help.guide.read-notifications.tip.1':
    'La cloche figure sur tous les écrans dotés de la barre de navigation, et son chiffre se met à jour automatiquement à chaque nouveauté.',
  'help.guide.filter-notifications.tip.1':
    'La page charge les notifications plus anciennes au fil du défilement : rien n’est coupé après le premier écran.',
  'help.guide.mark-notifications-read.result':
    'Plus aucune notification n’a de fond coloré, et le chiffre rouge sur la cloche a disparu.',
  'help.guide.notification-settings.title': 'Choisir ce qui vous est notifié',
  'help.guide.link-journal.step.1':
    'Cliquez sur « Paramètres du voyage » à côté du nom du voyage et choisissez « Journal » à gauche.',
  'help.guide.dawarich-stays.tip.1':
    'Rien n’est ajouté au voyage tant que vous n’avez pas cliqué sur « Ajouter un lieu ». Un lieu ajouté depuis un séjour l’indique dans ses détails : « Ajouté depuis vos enregistrements Dawarich ».',
  'help.guide.leave-stop-off-route.title': 'Exclure une étape de l’itinéraire',
  'help.guide.move-booking-day.step.1':
    'Survolez la ligne de la réservation dans la journée : la poignée à sa gauche indique qu’elle peut être déplacée.',
  'help.guide.place-image-from-file.tip.1':
    'Seuls les fichiers JPG, PNG, GIF et WebP sont proposés ; un billet en PDF ne l’est pas.',
  'help.guide.place-own-hours.step.4':
    "Les boutons à droite de « Horaires d'ouverture » : le bouton de copie applique à tous les jours les horaires du lundi, et le X supprime vos horaires. Si TREK a trouvé ses propres horaires, « Reprendre depuis les détails du lieu » les rétablit.",
  'help.guide.confirm-stay-booking.step.2':
    'La réservation s’ouvre par-dessus le programme. La première pastille de son en-tête indique son statut.',
  'help.ctx.trip-map.bullet.9':
    'Chaque sortie du voyage est tracée dans sa couleur, avec une épingle au départ. Cliquez sur le tracé pour ouvrir la fiche de la sortie. Un jour qui comporte une sortie a un itinéraire qui va jusqu’au départ de la sortie et repart de son arrivée. L’œil à côté d’une sortie dans la liste « Sorties », « Masquer sur la carte », retire son tracé de votre carte.',
  'help.guide.tour-map-lines.result':
    'Les sorties voulues sont sur la carte, chacune dans sa couleur, et celle que vous avez masquée apparaît estompée dans la liste « Sorties ».',
  'help.guide.car-stops.step.2':
    'Cliquez sur la pastille de type dans l’en-tête et choisissez « Voiture ». Le formulaire s’adapte : « Date » et « Heure de début » deviennent « Prise en charge » et « Heure prise en charge », « Date de fin » et « Heure de fin » deviennent « Restitution » et « Heure restitution », et « Étapes en chemin » apparaît sous « De » et « À ».',
  'help.guide.transport-details.goal':
    'Voir tous les détails d’un trajet au même endroit, copier son code de réservation, le renommer ou le retrouver sur la carte.',
  'help.guide.transport-details.tip.2':
    'La touche Échap ou un clic en dehors des détails les ferme. Si « Renommer » ou la question de suppression est ouvert, c’est lui qui se ferme d’abord.',
  'help.guide.export-transports-csv.tip.1':
    'L’icône n’apparaît dans la barre que si l’onglet contient au moins un trajet.',
  'help.guide.group-sort-bookings.step.1':
    "En vue « Cartes » ou « Liste », cliquez sur « Options d'affichage », les curseurs après les trois icônes de vue.",
  'help.guide.create-booking.tip.4':
    'Hors ligne, la réservation est enregistrée sur cet appareil et synchronisée dès votre retour en ligne. Les nouveaux fichiers nécessitent une connexion : retirez-les ou enregistrez plus tard. Si vous cliquez par mégarde en dehors du formulaire, ou appuyez sur Échap, TREK demande « Abandonner vos modifications ? » avant que votre saisie soit perdue.',
  'help.guide.booking-on-map.tip.2': 'Un séjour s’ouvre sur sa première nuit.',
  'help.guide.export-bookings-csv.step.3':
    "Cliquez sur « Exporter en tableur (CSV) », l’icône de tableur après « Options d'affichage ».",
  'help.guide.arrange-packing-list.step.3':
    '« A à Z », tout à droite de la rangée qui contient « Partagée » et « Ma liste », trie les articles de chaque liste par nom, pour voir rapidement si un article y figure déjà. Cliquez de nouveau dessus pour revenir à votre propre ordre.',
  'help.guide.count-packed-pieces.step.1':
    'Cliquez sur le badge de quantité d’une ligne, le petit chiffre suivi d’un x, saisissez le nombre à emporter, par exemple 5, et appuyez sur Entrée.',
  'help.guide.expense-receipts.step.3':
    'Cliquez sur « Enregistrer » en bas de la boîte de dialogue. Les fichiers sont importés avec la dépense et apparaissent aussi dans les « Fichiers » du voyage.',
  'help.guide.files-sync-settings.step.1':
    'Cliquez sur « Synchronisation des documents », tout à droite de la barre. Si le voyage est associé à un stockage, sa carte s’ouvre à droite ; s’il y en a plusieurs, cliquez sur celui voulu sous « Ce voyage », à gauche.',
  'help.guide.files-sync-settings.tip.3':
    '« Mises à jour instantanées », un lien avec « Copier » à côté, n’apparaît que pour les stockages auxquels TREK ne peut pas s’abonner automatiquement. Collez le lien dans le stockage : les changements arrivent aussitôt, sans attendre la prochaine vérification.',
  'help.guide.manage-notes.step.1':
    "Cliquez sur les trois points dans l’en-tête d’une carte de note (« Plus d'options »). Le menu contient « Développer », « Épingler », « Modifier » et « Supprimer ».",
  'help.guide.note-categories.title': 'Classer les notes par catégories',
  'help.guide.note-categories.result':
    'Les notes affichent les nouveaux noms et couleurs, et la carte « Notes » n’affiche que la catégorie choisie.',
  'help.guide.roadtrip-stops.tip.5':
    'Une étape qui a une heure de fin dans le programme du jour dure jusqu’à cette heure. Sa boîte de dialogue indique l’heure de départ du trajet, et « Supprimer l’heure de fin » vous permet de redéfinir vous-même la durée.',
  'help.guide.roadtrip-reorder.tip.2':
    'Les trajets réservés et leurs terminaux restent à la place définie par la réservation ; seuls les lieux peuvent être déplacés.',
  'help.guide.roadtrip-overnight.step.2':
    'Un hôtel affiche une icône de lit au lieu du plus. Cliquez dessus, « Ajouter comme nuitée », pour ouvrir « Ajouter comme arrêt » pour la nuit. Un camping affiche le bouton « Ajouter » habituel.',
  'help.guide.roadtrip-stop-fill.goal':
    'Donner à un arrêt carburant ou recharge son propre niveau de remplissage, par exemple 80 % sur une borne rapide ou 100 % pour la nuit.',
  'help.guide.roadtrip-bookings.goal':
    'Voir où un trajet réservé s’insère dans le parcours, et à quelle heure vous devez y être.',
  'help.guide.roadtrip-bookings.tip.3':
    'Un trajet qui n’est sur aucun jour du voyage ne fait pas partie du parcours : une remarque en haut de la frise l’indique, avec « Ouvrir la réservation » pour lui donner une date.',
  'help.guide.roadtrip-google-import.step.4':
    'Sous « Jour », choisissez le jour où placer les étapes, puis cliquez sur « Importer ».',
  'help.guide.roadtrip-hazards.step.2':
    'Sous « Alertes actuelles », en bas de la colonne de droite de la boîte de dialogue, activez « Afficher les zones à risque », puis cliquez sur « Fermer ».',
  'help.ctx.trip-tours.bullet.1':
    'Le sélecteur « Lieux » / « Sorties », en haut de la colonne de droite, remplace la liste des lieux par celle des sorties. Il n’apparaît que si l’extension Sorties est activée, et les sorties ne figurent alors jamais dans la liste des lieux.',
  'help.guide.tour-show-list.step.1':
    'Dans l’onglet « Prévu », cliquez sur « Sorties » dans le sélecteur en haut de la colonne de droite. La colonne liste maintenant les sorties au lieu des lieux.',
  'help.guide.tour-show-list.result':
    'La colonne de droite liste les sorties du voyage, et celle sur laquelle vous avez cliqué est ouverte dans sa fiche.',
  'help.guide.tour-add-to-day.tip.1':
    'Faire glisser une sortie en plusieurs étapes sur un jour pose la même question dans une petite boîte de dialogue. « Annuler » laisse le programme inchangé.',
  'help.guide.tour-day-times.step.2':
    'Renseignez « Début » et laissez « Fin » vide. La ligne sous les champs indique l’heure de fin calculée par TREK : le début plus la durée de la sortie.',
  'help.guide.tour-remove-from-day.title': 'Retirer une sortie d’un jour',
  'help.guide.tour-filter-list.title': 'Filtrer la liste des sorties',
  'help.guide.tour-filter-list.tip.3':
    'S’il ne reste rien, la liste indique « Aucune sortie ne correspond à ces filtres », et « Réinitialiser les filtres » les efface tous. Les filtres ne modifient que l’affichage de la liste, jamais une sortie ni un jour.',
  'help.guide.tour-hide-on-map.tip.2':
    'La carte sur téléphone affiche toujours toutes les sorties, et l’onglet « Sorties » n’a pas d’œil : le masquage se fait ici, dans l’onglet « Prévu ».',
  'help.guide.tour-import-plan-tab.tip.2':
    'L’import reste dans la liste et ne s’ouvre pas dans un planificateur. Placez-le sur un jour avec son + rond, ou ouvrez l’onglet « Sorties » pour le consulter.',
  'help.ctx.trip-tour-detail.bullet.5':
    'La fiche sert à consulter la sortie et ce qui l’accompagne. L’itinéraire lui-même se modifie dans l’onglet « Sorties » : ouvrez-le et cliquez sur la sortie sous « Sorties de ce voyage ». C’est aussi là, et non ici, qu’une sortie se supprime.',
  'help.guide.tour-detail-read.step.6':
    'Faites défiler pour voir la « Description » et les « Notes », puis « Origine » : planifiée dans TREK, le fichier d’où elle a été importée ou le sentier wanderer dont elle provient, avec la date.',
  'help.guide.tour-rename-colour.title': 'Renommer une sortie et changer sa couleur',
  'help.guide.tour-rename-colour.result':
    'La sortie affiche son nouveau nom partout dans le voyage, et son tracé apparaît dans la couleur choisie.',
  'help.guide.tour-take-along.tip.3':
    'Le fichier provient du serveur et nécessite donc une connexion. Une sortie créée hors ligne peut être téléchargée une fois synchronisée.',
  'help.guide.tour-copy-keep.step.4':
    'Choisissez la liste sous « Collection », vérifiez « Nom dans la collection », puis cliquez sur « Garder ».',
  'help.guide.tour-packing-link.step.1':
    'Ouvrez la fiche de la sortie et faites défiler jusqu’à « Liste de bagages ». Cliquez sur « Lier une liste de bagages ».',
  'help.guide.tour-packing-link.result':
    'Vous êtes sur la liste de bagages, dans l’onglet « Listes », et la fiche de la sortie affiche chaque article que vous cochez.',
  'help.guide.tour-files.result': 'Les fichiers sont joints à la sortie et s’ouvrent depuis sa fiche.',
  'help.guide.tour-activity-link.tip.1':
    'Le programme reste inchangé. La trace est simplement liée, et « Délier » supprime ce lien.',
  'help.guide.tour-activity-compare.step.3':
    'Cliquez sur « Comparer sur la carte » pour afficher la trace réelle en pointillés à côté du programme. « Terminer la comparaison » la masque à nouveau.',
  'help.guide.tour-origin-check.step.2':
    '« Importé » indique la date de l’import. « Ici » indique son état actuel : « Tel qu’importé », « Modifié dans TREK » ou « Replanifié, tracé enregistré conservé ».',
  'help.ctx.trip-tour-planner.bullet.1':
    '« Sorties » se trouve dans la barre d’onglets du voyage, juste après « Prévu », quand l’extension Sorties est activée. L’onglet est disponible sur ordinateur et tablette ; sur téléphone, les sorties se consultent et se placent sur des jours depuis l’onglet « Prévu », mais ne se tracent pas.',
  'help.guide.tour-open-workspace.step.1':
    'Cliquez sur « Sorties » dans la barre d’onglets du voyage, juste après « Prévu ». La carte occupe l’écran, avec un volet de chaque côté.',
  'help.guide.tour-open-workspace.tip.2':
    'Déposez des fichiers GPX, KML ou KMZ n’importe où dans cet onglet pour les importer comme sorties du voyage.',
  'help.guide.tour-draw-route.step.4':
    '« Point placé » apparaît en bas de la carte. « Annuler », à côté, supprime le point.',
  'help.guide.tour-type-profile.title': 'Choisir le type de sortie',
  'help.guide.tour-type-profile.result': 'L’itinéraire de la sortie est calculé selon le type et le profil choisis.',
  'help.guide.tour-edit-points.step.6':
    '« Annuler la modification du point de passage » et « Rétablir la modification du point de passage », en haut du volet, annulent ou rétablissent chaque changement, un par un.',
  'help.guide.tour-shaping-points.step.3':
    'Sous « Points de passage », il apparaît avec un badge « Point de guidage » et sans numéro : les étapes gardent ainsi leur numérotation.',
  'help.guide.tour-loop-reverse.step.1':
    'Cliquez sur « Retour au départ » dans l’en-tête de la carte « Points de passage ». La sortie reçoit un dernier tronçon qui revient à son premier point.',
  'help.guide.tour-leg-by-hand.goal':
    'Relier deux points par une ligne droite là où le calcul d’itinéraire ne trouve aucun chemin, ou recalculer un tronçon.',
  'help.guide.tour-trip-places.title': 'Utiliser un lieu du voyage comme étape',
  'help.guide.tour-trip-places.tip.3': 'Les autres sorties du voyage ne sont jamais proposées comme étapes.',
  'help.guide.tour-details-times.tip.1': 'Les durées peuvent être saisies sous la forme 2:56, 2 h 56 ou 176 minutes.',
  'help.guide.tour-save.step.3':
    'Cliquez sur « Enregistrer » en bas du volet de gauche. « Sortie enregistrée » s’affiche, et le titre du volet devient « Modifier la sortie ».',
  'help.guide.tour-edit-saved.step.1':
    'Cliquez sur la sortie sous « Sorties de ce voyage ». Elle s’ouvre dans le volet de gauche sous « Modifier la sortie », et la carte affiche son itinéraire.',
  'help.guide.tour-summary-profile.title': 'Lire le résumé de la sortie et le profil altimétrique',
  'help.guide.tour-summary-profile.tip.3':
    'Une sortie en pagaie n’affiche pas d’altitudes : sur l’eau, seules celles des berges seraient disponibles.',
  'help.guide.tour-list-manage.step.5':
    'Choisissez « Non planifiés » pour les sorties qui ne sont encore sur aucun jour, ou filtrez par « Source », « Limite d’itinéraire » ou « Type ». Chaque ligne indique le nombre de sorties correspondantes, et les totaux suivent le filtre.',
  'help.guide.tour-delete.step.2':
    'Lisez ce qui sera supprimé avec elle : l’itinéraire, les points de passage modifiables et les affectations aux jours. Cliquez sur « Supprimer définitivement ».',
  'help.guide.tour-saved-elsewhere.step.2':
    '« Charger la plus récente » remplace vos modifications par la version la plus récente, après confirmation.',
  'help.ctx.trip-tour-import.bullet.1':
    "Le + en haut de « Sorties de ce voyage » correspond à « Ajouter une sortie ». Il propose « Importer un GPX ou KML », « Importer une balade depuis Google Maps » et « Reprendre un itinéraire d'un autre voyage ». Vous pouvez aussi déposer des fichiers n’importe où dans l’onglet « Sorties ».",
  'help.guide.tour-import-gpx.step.2':
    'Choisissez « Importer un GPX ou KML » et sélectionnez un ou plusieurs fichiers .gpx, .kml ou .kmz, de 10 Mo maximum chacun.',
  'help.guide.tour-import-gpx.tip.5':
    'Un fichier sans altitudes affiche « Aucune altitude dans le fichier ». Le tracé et la distance restent justes, mais le dénivelé positif et négatif reste inconnu.',
  'help.guide.tour-view-import.tip.2':
    'L’icône de téléchargement dans l’en-tête l’enregistre à nouveau en fichier GPX, et le signet l’enregistre dans une collection.',
  'help.guide.tour-plan-from-import.step.4':
    'La sortie s’ouvre dans l’éditeur avec ses points de passage. Modifiez-la si vous le souhaitez, puis cliquez sur « Enregistrer » en bas de la colonne.',
  'help.guide.tour-restore-recorded.step.1':
    'Dans « Sorties de ce voyage », cliquez sur la sortie recalculée. La carte « Trace enregistrée », dans l’éditeur, indique que la trace d’origine est conservée.',
  'help.guide.tour-take-over.step.1':
    'Ouvrez l’onglet « Sorties » du voyage auquel la sortie est destinée. En haut de « Sorties de ce voyage », cliquez sur le + (« Ajouter une sortie »).',
  'help.guide.tour-take-over.tip.3':
    'Reprendre un itinéraire nécessite une connexion. Si l’éditeur contient des modifications non enregistrées, la copie est quand même ajoutée à la liste, mais ne s’ouvre pas : votre travail reste ouvert.',
  'help.guide.tour-import-wanderer.tip.1':
    'Le bouton apparaît une fois wanderer connecté dans Paramètres, Intégrations. Avant cela, la liste propose « Connecter dans les paramètres ».',
  'help.ctx.trip-tour-map.bullet.2':
    'Après le séparateur de la pastille viennent les interrupteurs propres au type de sortie : « Placer des points » pendant la modification d’une sortie, « Via ferrata » pour une randonnée, « Balisage maritime » pour une sortie en pagaie et les pistes pour une sortie à ski. 3D, tout au bout, affiche la sortie sur un relief en 3D.',
  'help.guide.tour-map-layers.step.3':
    'Pour une randonnée, cliquez sur « Randonnée » pour afficher les sentiers balisés et leurs numéros ; pour une sortie à vélo, « Vélo » affiche plutôt les itinéraires cyclables. Satellite affiche une vue aérienne, et « Carte » revient au fond de carte standard.',
  'help.guide.tour-along-search.step.2':
    'Cliquez sur « Quoi chercher » et cochez les types voulus, jusqu’à six à la fois : « Points de vue », « Sommets », « Refuges et abris », « Eau potable », « Restauration », etc. La liste propose ce qui convient au type de sortie, et une sortie démarre avec trois types cochés.',
  'help.guide.tour-along-add-stop.title': 'Ajouter comme étape un lieu situé le long de la sortie',
  'help.guide.tour-along-add-stop.tip.2':
    'Un lieu qui devient la nouvelle arrivée est marqué « Allonge la sortie » : l’ancienne arrivée n’est plus la fin, et la sortie se prolonge jusqu’à ce lieu.',
  'help.guide.tour-3d-terrain.step.5':
    'Cliquez de nouveau sur 3D pour revenir à la carte à plat et poursuivre la planification.',
  'help.guide.tour-3d-flyover.step.2':
    'Sous « Vitesse », choisissez 1×, 2× ou 4×. À 1×, la plupart des sorties durent environ 45 secondes du départ à l’arrivée.',
  'help.guide.tour-map-overlays.goal':
    'Afficher sur la carte les pistes et remontées, ou les bouées et marques de port, pendant la planification d’une sortie à ski ou en pagaie.',
  'help.guide.tour-map-overlays.tip.3':
    'Si une couche ne se charge plus, son interrupteur affiche un ! et une explication ; la carte et votre itinéraire fonctionnent sans elle.',
  'help.guide.tour-multi-day.title': 'Planifier une sortie sur plusieurs jours',
  'help.guide.tour-multi-day.tip.1':
    '« Terminer l’étape ici » fonctionne aussi sur une sortie d’une journée : elle devient alors automatiquement une sortie sur plusieurs jours. Le premier et le dernier arrêt, ainsi qu’un point de guidage, ne peuvent pas terminer une étape.',
  'help.guide.tour-stages-on-days.step.2': 'Choisissez le jour où commence la première étape.',
  'help.guide.tour-stages-on-days.tip.4':
    'Dans le programme du jour, chaque étape apparaît sous la forme « Étape N », avec sa propre distance et sa propre durée. « Annuler », au-dessus des jours dans l’onglet « Prévu », annule toute la répartition d’un coup.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Pour une randonnée, « Via ferrata », dans la rangée de boutons en bas à gauche de la carte, affiche les via ferrata à proximité. La fiche d’une via ferrata permet de l’ajouter à l’itinéraire comme tronçon distinct.',
  'help.guide.tour-hike-plan.step.5':
    'Sous « Détails », ouvrez « Difficulté maximale du sentier » et choisissez le niveau de difficulté autorisé, de T1 (« Randonnée ») à T6 (« Randonnée alpine difficile »). L’itinéraire est recalculé dans cette limite.',
  'help.guide.tour-hike-trail-details.goal':
    'Voir ce qu’OpenStreetMap répertorie pour les voies d’une randonnée, et retrouver ces portions sur la carte.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Une cotation supérieure à la limite de la randonnée affiche un badge « Au-dessus de la limite » sur sa ligne.',
  'help.guide.tour-hike-round.step.5':
    'Cliquez sur « Prendre cette boucle », puis sur « Remplacer » quand TREK vous demande s’il faut remplacer l’itinéraire prévu.',
  'help.guide.tour-hike-compare-ways.step.2':
    '« Autres chemins pour ce tronçon » s’ouvre par-dessus la carte avec le « Chemin actuel » et les chemins A, B, etc. Chacun est tracé sur la carte dans sa couleur, et survoler une ligne met son tracé en évidence.',
  'help.guide.tour-ferrata-add.goal':
    'Trouver les via ferrata autour de votre randonnée et intégrer l’une d’elles à l’itinéraire.',
  'help.guide.tour-ferrata-add.tip.2':
    'Les via ferrata ne sont proposées que pour les randonnées. Une via ferrata que l’itinéraire emprunte déjà affiche « Fait partie de la randonnée » sur sa fiche au lieu de « Ajouter à la randonnée ».',
  'help.guide.tour-run-plan.step.4':
    'Placez le départ et l’arrivée sur la carte, ou choisissez-les avec « Lieux du voyage ». Sous l’allure s’affiche le temps de course : la distance multipliée par l’allure.',
  'help.guide.tour-run-ways.goal':
    'Vérifier quelle part d’une course est non revêtue et jusqu’où va la difficulté de ses sentiers.',
  'help.ctx.trip-tour-walk.summary':
    'Une sortie à pied d’étape en étape, planifiée dans l’onglet « Sorties » : la durée de chaque arrêt, les étapes importantes, les sites à voir en chemin et l’heure à laquelle vous atteignez chacune le jour de la balade, au regard de ses horaires d’ouverture.',
  'help.guide.tour-walk-plan.step.1':
    'Cliquez sur « Planifier une nouvelle sortie » en haut de la colonne de gauche, puis ouvrez « Type de sortie » et choisissez « Balade urbaine / touristique ».',
  'help.guide.tour-walk-plan.tip.3':
    '« Détacher du lieu », dans « Plus d’actions » d’une étape, supprime seulement le lien avec un lieu du voyage. Le lieu lui-même reste dans le voyage.',
  'help.guide.tour-walk-sights.step.5':
    'Cliquez sur « Ajouter comme arrêt ». Un message indique de combien la balade s’allonge, avec « Annuler » à côté.',
  'help.guide.tour-walk-day-times.step.2':
    'Donnez-lui une heure de départ ce jour-là : dans l’onglet « Prévu », faites un clic droit sur la balade dans la journée, choisissez « Modifier » et renseignez un « Début ».',
  'help.guide.tour-walk-google-import.title': 'Transformer un itinéraire à pied Google Maps en balade urbaine',
  'help.guide.tour-walk-google-import.tip.3':
    'Seules les étapes sont reprises, pas le tracé dessiné dans Google Maps. Un lien court maps.app.goo.gl nécessite une connexion pour être suivi.',
  'help.guide.tour-walk-check-off.tip.1':
    'Les marquages sont enregistrés par jour : ouvrez la balade depuis son jour dans le programme, et non depuis la liste des sorties.',
  'help.ctx.trip-tour-bike.bullet.3':
    'La carte « Revêtement et voies », sous « Points de passage », indique sur quoi roule l’itinéraire : les revêtements, les types de voie et la part connue comme non revêtue. Cliquez sur une ligne pour mettre ses portions en évidence sur la carte.',
  'help.guide.tour-bike-profile.step.5':
    'Consultez « Temps à vélo (estimé) » dans le « Résumé de la sortie », à droite. Survolez son point d’information pour voir comment il est calculé.',
  'help.guide.tour-bike-surfaces.title': 'Voir les revêtements d’une sortie à vélo',
  'help.guide.tour-bike-surfaces.tip.2':
    'Avec le profil « Route », un avertissement au-dessus des barres indique la distance connue comme non revêtue. « Afficher sur la carte » met ces portions en évidence.',
  'help.guide.tour-bike-mtb-grades.result':
    'La carte met en évidence les sentiers de la difficulté choisie, et vous savez quelles portions de la sortie sont les plus exigeantes.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Sous la discipline figurent les options du calcul d’itinéraire, uniquement celles qui concernent votre discipline : « Pistes les plus difficiles », « Privilégier », « Rythme », des interrupteurs comme « Prendre les remontées », et « Exclure » pour les types de remontées que vous ne voulez pas prendre. Chaque modification recalcule la sortie.',
  'help.guide.tour-ski-plan.step.3':
    'Sous « Discipline », choisissez votre pratique : « Alpin », Snowboard, « Ski de fond », « Ski de randonnée », « Raquettes » ou « Rando hivernale ». Rien n’est présélectionné, et la sortie ne peut pas être enregistrée sans discipline.',
  'help.guide.tour-ski-plan.result':
    'Une sortie « Ski et hiver » enregistrée dans « Sorties de ce voyage », avec ses tronçons sur les pistes, remontées et sentiers cartographiés, et sa durée calculée dans le « Résumé de la sortie ».',
  'help.guide.tour-ski-options.tip.1': 'Chaque modification recalcule la sortie, tronçon par tronçon.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Si aucune solution ne vous convient, cliquez sur « Tracer en ligne droite ». Le tronçon devient une ligne droite entre ses deux points.',
  'help.guide.tour-ski-summary.step.1':
    'Sous les points de passage, repérez la carte « Itinéraire sur pistes ». Cliquez sur son titre pour la replier ou la déplier.',
  'help.guide.tour-ski-pistes-layer.title': 'Afficher les pistes sur la carte',
  'help.guide.tour-ski-pistes-layer.result':
    'Les pistes s’affichent sous la sortie, et vous pouvez lire leurs couleurs.',
  'help.guide.tour-ski-import.step.6':
    'Dans « Classer la trace de ski », choisissez la bonne discipline ou technique et cliquez sur « Enregistrer ».',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Chaque point affiche son rôle dans un badge : « Embarquement », « Débarquement », « Rembarquement » ou « Débarquement final ». Sous un point s’affiche ce qui suit : un tronçon tracé à la main, un portage, une écluse, ou la raison pour laquelle un tronçon n’a pas pu être calculé.',
  'help.guide.tour-paddle-setup.step.2':
    "Ouvrez « Type de sortie » et choisissez « Sortie en pagaie », « Sur l'eau, en kayak, canoë ou SUP ».",
  'help.guide.tour-paddle-setup.tip.3':
    "Pour une sortie en pagaie, « Le long de l'itinéraire » cherche en priorité « Mises à l'eau », « Location de bateaux » et « Eau potable ».",
  'help.guide.tour-paddle-water-route.step.4':
    'Un tronçon que TREK n’a pas pu calculer passe au rouge et en indique la raison, par exemple l’absence de données hydrographiques pour la zone. Cliquez sur « Tracer en ligne droite » pour le tracer à la main en attendant.',
  'help.guide.tour-paddle-portage.goal':
    'Marquer une portion où vous portez l’embarcation, pour qu’elle compte comme un trajet à terre, avec le temps de débarquer et de rembarquer.',
  'help.guide.tour-paddle-portage.tip.3':
    'Le portage est compté à 2 km/h tant que vous n’avez pas défini votre propre « Vitesse de portage » dans la carte « Estimation du temps ».',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK ne connaît pas les horaires des écluses. Les durées sont uniquement celles que vous saisissez : vérifiez vous-même les horaires de l’écluse.',
  'help.guide.tour-paddle-time.step.3':
    'La ligne « Sur l’eau » correspond à la distance sur l’eau à votre « Vitesse de pagaie ». Modifiez la vitesse dans le champ « Vitesse de pagaie » en haut de la colonne.',
  'help.guide.tour-paddle-wind.goal': 'Voir le vent prévu au point de départ le jour de votre sortie.',
  'help.guide.tour-paddle-wind.tip.4':
    'L’absence de valeur prévue ne signifie pas que les conditions sont sûres. Vérifiez-les sur place.',
  'help.guide.tour-paddle-checklist.step.5':
    'En bas de la colonne, cliquez sur « La pagaie comporte des risques » pour lire « Sécurité sur l’eau » avant de partir.',
  'help.guide.tour-paddle-track-marks.goal':
    'Importer une trace de pagaie depuis votre montre et y ajouter les portages et les passages d’écluse.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Cliquez exactement sur la trace : un clic trop éloigné du tracé est refusé, et la carte le signale.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Chaque tronçon apparaît sous forme de badge dans la carte « Points de passage », avec le nom de l’itinéraire, un indicateur d’accès et sa longueur. Une portion qu’aucun itinéraire équestre ne couvre affiche « Manuel, non vérifié ».',
  'help.guide.tour-horse-plan.step.4':
    'Cliquez sur un itinéraire dans la liste. Il s’ouvre sur sa propre carte, avec ses tronçons numérotés.',
  'help.guide.tour-horse-plan.tip.4':
    '« Annuler la modification du point de passage », en haut de la colonne de gauche, annule tout un tronçon d’un coup.',
  'help.guide.tour-horse-gap.result':
    'La sortie n’a plus d’interruption, et la liaison est marquée comme tracée à la main.',
  'help.guide.tour-horse-recorded.step.3': 'Cliquez sur « Importer 1 sortie ».',
  'help.guide.dissolve-fusion.step.3': 'Validez avec « Dissoudre » dans la fenêtre de confirmation.',
};

export default help;
