import type { TranslationStrings } from '../types';

// English fallback until 'fr' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Aide pour cet écran',
  'help.center.title': 'Aide',
  'help.center.onThisScreen': 'Sur cet écran',
  'help.center.screens': 'Écrans',
  'help.center.thisScreen': 'Cet écran',
  'help.center.subScreens': 'Sous-écrans : {count}',
  'help.center.subScreensLabel': 'Sous-écrans',
  'help.center.guidesCount': '{count} guides',
  'help.center.goToScreen': 'Aller à {screen}',
  'help.center.overview': 'Aperçu',
  'help.center.howTo': 'Comment faire pour…',
  'help.center.searchPlaceholder': 'Rechercher dans les guides et la doc…',
  'help.center.searchEmpty': 'Aucun résultat pour « {query} ».',
  'help.center.searchGuides': 'Guides',
  'help.center.searchDocs': 'Documentation',
  'help.center.searchError': 'La recherche est indisponible pour le moment.',
  'help.center.back': 'Retour',
  'help.center.close': "Fermer l'aide",
  'help.center.steps': '{count} étapes',
  'help.center.step': 'Étape {n}',
  'help.center.stepsLabel': 'Étapes',
  'help.center.stepOf': 'Étape {n} sur {total}',
  'help.center.screenshot': 'Capture',
  'help.center.result': 'Résultat',
  'help.center.tips': 'Bon à savoir',
  'help.center.related': 'En lien',
  'help.center.openDocs': 'Ouvrir dans Aide & Doc',
  'help.center.docsSection': 'Dans la doc',
  'help.center.noContext': 'Pas encore de guide pour cet écran.',
  'help.center.noContextHint': 'Cherchez dans la doc, ou dites-nous ce que vous cherchiez.',
  'help.center.feedback': 'Il manque quelque chose ?',
  'help.center.feedbackLink': 'Dites-le-nous sur GitHub',
  'help.center.discord': 'Demander sur Discord',
  'help.center.quick': 'Rapide',
  'help.center.guide': 'Guide',
  'help.center.tour': 'Démonstration',
  'help.center.imageAlt': 'Étape {n} de « {title} »',

  // ctx
  'help.ctx.dashboard.title': 'Tableau de bord',
  'help.ctx.dashboard.summary':
    "Le tableau de bord est la porte d'entrée de tous vos voyages. La carte d'embarquement en haut met en avant le voyage en cours ou le prochain, la rangée en dessous compte ce que vous avez déjà parcouru, et les cartes listent tout ce que vous planifiez, avez archivé ou déjà terminé.",
  'help.ctx.dashboard.bullet.1':
    "Carte d'embarquement : le voyage en cours ou le prochain, avec ses dates, ses voyageurs, ses lieux et un compte à rebours. Cliquez dessus pour ouvrir le voyage.",
  'help.ctx.dashboard.bullet.2':
    "Statistiques : pays visités, voyages, jours sur la route et distance parcourue en avion, sur l'ensemble de vos voyages.",
  'help.ctx.dashboard.bullet.3':
    'Cartes de voyage, filtrées par Planifiés, Archivé et Terminé, en grille ou en liste. Survolez une carte pour modifier, dupliquer, archiver et supprimer.',
  'help.ctx.dashboard.bullet.4':
    'Widgets à droite : convertisseur de devises, horloges mondiales, réservations à venir et collections. Chacun peut être désactivé.',
  'help.ctx.dashboard.bullet.5':
    'La carte « Nouveau voyage » et le bouton en bas à droite démarrent tous deux un nouveau voyage.',

  // create-trip
  'help.guide.create-trip.title': 'Créer un voyage',
  'help.guide.create-trip.goal': 'Démarrer un nouveau voyage avec un nom, des dates et une photo de couverture.',
  'help.guide.create-trip.step.1':
    'Cliquez sur « Nouveau voyage ». La carte à la fin de vos voyages et le bouton en bas à droite font la même chose.',
  'help.guide.create-trip.step.2':
    "Donnez un nom au voyage. C'est le seul champ obligatoire ; tout le reste peut être ajouté plus tard.",
  'help.guide.create-trip.step.3':
    'Choisissez une date de début et une date de fin. TREK crée un jour par date, votre itinéraire est prêt à être rempli.',
  'help.guide.create-trip.step.4':
    'Facultatif : ajoutez une photo de couverture. Téléversez la vôtre, glissez-en une, ou cherchez la destination sur Unsplash.',
  'help.guide.create-trip.step.5': 'Cliquez sur « Créer un nouveau voyage ».',
  'help.guide.create-trip.result':
    "Le voyage apparaît sur votre tableau de bord. Si c'est le prochain, il prend la carte d'embarquement en haut.",
  'help.guide.create-trip.tip.1':
    "Les dates peuvent être changées plus tard. S'il existe déjà des réservations, TREK demande s'il faut les déplacer avec les jours.",
  'help.guide.create-trip.tip.2':
    'La devise du voyage choisie ici est celle dans laquelle chaque dépense est convertie. Prenez la devise de la destination.',

  // edit-trip
  'help.guide.edit-trip.title': 'Modifier un voyage',
  'help.guide.edit-trip.goal': 'Renommer un voyage, changer ses dates ou ajuster ses réglages.',
  'help.guide.edit-trip.step.1': "Survolez la carte du voyage (ou la carte d'embarquement) et cliquez sur le crayon.",
  'help.guide.edit-trip.step.2':
    "Changez ce qu'il faut : nom, description, dates, couverture, devise, rappel ou membres.",
  'help.guide.edit-trip.step.3': 'Cliquez sur « Mettre à jour ».',
  'help.guide.edit-trip.result': 'La carte se met à jour immédiatement, pour chaque membre du voyage.',
  'help.guide.edit-trip.tip.1':
    "Déplacer les dates d'un voyage qui a déjà des réservations ouvre une seconde étape qui demande si les réservations doivent suivre.",

  // cover-image
  'help.guide.cover-image.title': 'Définir une photo de couverture',
  'help.guide.cover-image.goal':
    "Donner au voyage une image qui s'affiche sur sa carte et sur la carte d'embarquement.",
  'help.guide.cover-image.step.1': 'Ouvrez le formulaire de modification du voyage via le crayon sur sa carte.',
  'help.guide.cover-image.step.2':
    'Dans « Image de couverture », déposez une photo, cliquez pour en téléverser une, ou tapez une destination dans la recherche Unsplash.',
  'help.guide.cover-image.step.3': 'Choisissez une photo et cliquez sur « Mettre à jour ».',
  'help.guide.cover-image.result':
    "La photo est enregistrée avec le voyage et s'affiche partout où le voyage est listé.",
  'help.guide.cover-image.tip.1':
    'Les photos de la recherche Unsplash sont créditées automatiquement ; vos propres envois restent sur votre serveur.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Dupliquer un voyage',
  'help.guide.duplicate-trip.goal': 'Réutiliser un voyage comme modèle pour un nouveau.',
  'help.guide.duplicate-trip.step.1': "Survolez la carte et cliquez sur l'icône de duplication.",
  'help.guide.duplicate-trip.step.2': 'Lisez ce qui sera copié et ce qui ne le sera pas, puis confirmez.',
  'help.guide.duplicate-trip.result': "Une copie apparaît à côté de l'original, prête à être renommée et redatée.",
  'help.guide.duplicate-trip.tip.1':
    'Jours, lieux, réservations, postes de budget, listes de bagages et notes de jour sont copiés. Membres, chat, sondages, fichiers et liens de partage ne le sont pas.',

  // archive-trip
  'help.guide.archive-trip.title': 'Archiver et restaurer un voyage',
  'help.guide.archive-trip.goal': 'Ranger un voyage sans le supprimer, et le récupérer plus tard.',
  'help.guide.archive-trip.step.1': 'Survolez la carte et cliquez sur « Archiver ».',
  'help.guide.archive-trip.step.2': 'Passez le filtre au-dessus des cartes sur « Archivé » pour le revoir.',
  'help.guide.archive-trip.step.3': 'Cliquez sur « Restaurer » sur la carte pour le ramener dans « Planifiés ».',
  'help.guide.archive-trip.result':
    "Les voyages archivés gardent tout. Ils cessent simplement d'encombrer le tableau de bord et le flux de calendrier de tous les voyages.",

  // delete-trip
  'help.guide.delete-trip.title': 'Supprimer un voyage',
  'help.guide.delete-trip.goal': 'Retirer un voyage pour de bon.',
  'help.guide.delete-trip.step.1': 'Survolez la carte et cliquez sur la corbeille.',
  'help.guide.delete-trip.step.2': 'Confirmez. La boîte de dialogue nomme le voyage, pour être sûr de tenir le bon.',
  'help.guide.delete-trip.result':
    "Le voyage, ses jours, lieux, réservations et fichiers disparaissent. Il n'y a pas de retour possible : archivez plutôt en cas de doute.",

  // filter-and-view
  'help.guide.filter-and-view.title': 'Retrouver les voyages terminés, passer de la grille à la liste',
  'help.guide.filter-and-view.goal':
    'Voir les voyages terminés ou archivés et choisir la disposition qui vous convient.',
  'help.guide.filter-and-view.step.1':
    'Utilisez « Planifiés », « Archivé » et « Terminé » au-dessus des cartes. Terminé regroupe tout voyage dont la date de fin est passée.',
  'help.guide.filter-and-view.step.2':
    "Cliquez sur l'icône de liste pour passer à une liste compacte ; cliquez de nouveau pour la grille.",
  'help.guide.filter-and-view.result': 'Le tableau de bord retient votre disposition sur cet appareil.',

  // calendar-feed
  'help.guide.calendar-feed.title': "S'abonner à tous les voyages dans son calendrier",
  'help.guide.calendar-feed.goal':
    'Voir les jours et les réservations de chaque voyage actif dans votre application de calendrier, toujours synchronisés.',
  'help.guide.calendar-feed.step.1': "Cliquez sur l'icône de calendrier à côté du sélecteur de vue.",
  'help.guide.calendar-feed.step.2': 'Cliquez sur « Enable calendar subscription ». TREK génère un lien de flux privé.',
  'help.guide.calendar-feed.step.3':
    "Ajoutez le flux avec l'un des boutons (Google, Apple, Outlook) ou copiez le lien dans toute application de calendrier qui s'abonne à des URL.",
  'help.guide.calendar-feed.result':
    'Chaque voyage actif apparaît dans votre calendrier et se met à jour tout seul. Les voyages archivés et ceux terminés depuis plus de 90 jours sont exclus.',
  'help.guide.calendar-feed.tip.1':
    "Le lien est un secret. Quiconque l'a peut lire le flux ; révoquez-le depuis la même boîte de dialogue s'il fuite.",

  // widgets
  'help.guide.widgets.title': 'Choisir les widgets du tableau de bord',
  'help.guide.widgets.goal': 'Afficher ou masquer la rangée de statistiques et les widgets de droite.',
  'help.guide.widgets.step.1': 'Ouvrez le menu de votre avatar en haut à droite et choisissez « Paramètres ».',
  'help.guide.widgets.step.2': "Passez à l'onglet « Appearance ».",
  'help.guide.widgets.step.3':
    'Sous « Dashboard widgets », activez ou désactivez chaque widget. Ordinateur et mobile se règlent séparément.',
  'help.guide.widgets.step.4': "Revenez au tableau de bord. Le changement s'applique immédiatement.",
  'help.guide.widgets.result':
    'Les widgets masqués libèrent de la place pour vos voyages ; désactivez toute la colonne de droite pour centrer la disposition.',
  'help.guide.widgets.link': "Ouvrir les réglages d'apparence",

  // currency-widget
  'help.guide.currency-widget.title': 'Convertir des devises',
  'help.guide.currency-widget.goal': 'Convertir un montant entre deux devises avec les taux du jour.',
  'help.guide.currency-widget.step.1': 'Saisissez le montant et choisissez les deux devises.',
  'help.guide.currency-widget.step.2':
    'La flèche entre les deux inverse la paire ; la flèche circulaire rafraîchit le taux.',
  'help.guide.currency-widget.result':
    'Votre paire de devises est mémorisée sur votre compte, elle est donc la même sur tous vos appareils.',
  'help.guide.currency-widget.tip.1':
    'Les taux viennent de la Banque centrale européenne et sont mis à jour une fois par jour.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Ajouter des horloges mondiales',
  'help.guide.timezones-widget.goal': "Garder un œil sur l'heure locale de vos destinations.",
  'help.guide.timezones-widget.step.1': 'Cliquez sur + dans le widget « Fuseau horaire » et cherchez une ville.',
  'help.guide.timezones-widget.step.2': 'Retirez une horloge avec le × à côté.',
  'help.guide.timezones-widget.result': 'Vos horloges sont enregistrées avec votre compte.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    "Vacay est votre planificateur de congés personnel : combien de jours de vacances vous avez dans l'année, lesquels vous avez posés et ce qu'il reste. La grille montre toute l'année d'un coup d'œil ; la barre latérale contient le sélecteur d'année, les personnes avec qui vous planifiez, les calendriers partagés avec vous, la légende et votre solde.",
  'help.ctx.vacay.bullet.1':
    "Grille annuelle : douze cartes de mois, une cellule par jour. Cliquez sur un jour pour le poser ou l'effacer. Un petit point bleu marque les jours déjà couverts par un voyage.",
  'help.ctx.vacay.bullet.2':
    "Barre en bas : mode Vacances ou Jour férié d'entreprise, plus les interrupteurs Demi-journée et Récup / RTT qui changent ce qu'un clic enregistre.",
  'help.ctx.vacay.bullet.3':
    "Droits : vos jours pour l'année, combien sont utilisés et combien il en reste, avec le report de la période précédente.",
  'help.ctx.vacay.bullet.4':
    'Les Personnes sont les gens fusionnés à votre plan, chacun dans sa couleur. Les Calendriers partagés sont des anneaux en lecture seule des jours de congé des autres.',
  'help.ctx.vacay.bullet.5':
    "Les Paramètres couvrent les week-ends, le début de semaine, le report, votre année de congés, les jours fériés d'entreprise et les calendriers de jours fériés ou de vacances scolaires.",
  // log-day
  'help.guide.log-day.title': 'Poser un jour de congé',
  'help.guide.log-day.goal': 'Marquer un jour de repos dans la grille et voir le solde suivre.',
  'help.guide.log-day.step.1':
    "Regardez la barre en bas : le bouton de gauche, à votre couleur, signifie qu'un clic pose un jour de congé pour vous.",
  'help.guide.log-day.step.2':
    "Cliquez sur un jour dans n'importe quelle carte de mois. Il se remplit de votre couleur et Utilisés compte un jour de plus.",
  'help.guide.log-day.step.3': "Cliquez à nouveau sur le même jour pour l'effacer.",
  'help.guide.log-day.result':
    'Le jour est posé, Jours, Utilisés et Restants se mettent à jour aussitôt, et toute personne fusionnée à votre plan le voit en direct.',
  'help.guide.log-day.tip.1':
    'Les week-ends ne peuvent pas être posés tant que Bloquer les week-ends est activé dans les Paramètres.',
  'help.guide.log-day.tip.2':
    "Un point bleu dans une cellule signifie qu'un de vos voyages couvre ce jour : vous voyez où congés et voyages coïncident.",
  // half-day
  'help.guide.half-day.title': 'Poser une demi-journée',
  'help.guide.half-day.goal': 'Prendre un après-midi sans dépenser une journée entière de congé.',
  'help.guide.half-day.step.1':
    "Activez Demi-journée dans la barre. Son point orange est le marqueur qu'une demi-journée reçoit dans la grille.",
  'help.guide.half-day.step.2': 'Cliquez sur un jour. Il est posé comme 0,5 et porte le point orange dans son coin.',
  'help.guide.half-day.step.3':
    "Désactivez Demi-journée quand vous avez fini ; cliquer sur une demi-journée avec d'autres réglages la convertit sur place.",
  'help.guide.half-day.result':
    'Utilisés augmente de 0,5. Demi-journée et Récup / RTT sont indépendants : une demi-journée de récup est donc possible aussi.',
  'help.guide.half-day.tip.1':
    'La barre montre toujours le marqueur que votre prochain clic placera, pour vérifier avant de poser.',
  // comp-day
  'help.guide.comp-day.title': 'Poser une récup ou du flex',
  'help.guide.comp-day.goal': 'Prendre du temps compensatoire qui ne coûte pas de jours de congé.',
  'help.guide.comp-day.step.1':
    "Activez Récup / RTT dans la barre. Le disque hachuré est l'apparence d'un jour de récup dans la grille.",
  'help.guide.comp-day.step.2':
    "Cliquez sur un jour. Il se remplit de hachures diagonales à votre couleur au lieu d'un bloc plein.",
  'help.guide.comp-day.result':
    'Les jours de récup sont comptés à côté des tuiles de solde et ne réduisent jamais Restants.',
  'help.guide.comp-day.tip.1':
    'Heures sup récupérées, flextime, jour de compensation : tout ce qui est du repos mais pas des vacances va ici.',
  // entitlement
  'help.guide.entitlement.title': 'Définir votre solde de congés',
  'help.guide.entitlement.goal': "Dire à Vacay combien de jours de congé vous avez dans l'année.",
  'help.guide.entitlement.step.1': 'Dans la barre latérale, cliquez sur la tuile Jours sous Droits.',
  'help.guide.entitlement.step.2': 'Saisissez votre nombre de jours et appuyez sur Entrée.',
  'help.guide.entitlement.result':
    "Restants est recalculé à partir de votre solde, d'un éventuel report et des jours utilisés.",
  'help.guide.entitlement.tip.1':
    "Chaque année a son propre solde : un changement ici ne concerne que l'année sélectionnée.",
  // years
  'help.guide.years.title': "Ajouter et changer d'année",
  'help.guide.years.goal': "Planifier déjà l'an prochain, ou revoir l'an dernier.",
  'help.guide.years.step.1':
    "Cliquez sur le + à droite de l'année pour ajouter la suivante, ou sur le + à gauche pour la précédente.",
  'help.guide.years.step.2': "Passez d'une année à l'autre avec les flèches ou les pastilles d'année en dessous.",
  'help.guide.years.step.3':
    'Pour retirer une année, survolez sa pastille et cliquez sur le petit moins. Ses entrées partent avec elle, confirmez avec soin.',
  'help.guide.years.result': 'Chaque année garde son propre solde et ses entrées ; le report les relie.',
  // company-holidays
  'help.guide.company-holidays.title': "Marquer les jours fériés d'entreprise",
  'help.guide.company-holidays.goal':
    "Bloquer les jours où toute l'entreprise est fermée sans entamer le solde de personne.",
  'help.guide.company-holidays.step.1':
    "Ouvrez les Paramètres et vérifiez que Jours fériés d'entreprise est activé. C'est le réglage par défaut ; la barre ne propose ce mode que s'il l'est.",
  'help.guide.company-holidays.step.2': "De retour dans la grille, passez la barre en mode Jour férié d'entreprise.",
  'help.guide.company-holidays.step.3': 'Cliquez sur les jours. Ils deviennent ambre et apparaissent dans la légende.',
  'help.guide.company-holidays.result':
    "Les jours fériés d'entreprise sont visibles par toutes les personnes fusionnées au plan et ne réduisent jamais Restants.",
  'help.guide.company-holidays.tip.1':
    "Toute personne fusionnée peut modifier les jours fériés d'entreprise : mettez-vous d'accord sur qui les gère.",
  // public-holidays
  'help.guide.public-holidays.title': 'Afficher les jours fériés',
  'help.guide.public-holidays.goal': 'Mettre les jours fériés de votre pays ou de votre région sur la grille.',
  'help.guide.public-holidays.step.1': 'Ouvrez les Paramètres et activez Jours fériés.',
  'help.guide.public-holidays.step.2':
    "Cliquez sur Ajouter un calendrier, puis choisissez le pays et, quand c'est utile, la région. Donnez-lui une couleur et un libellé si vous voulez.",
  'help.guide.public-holidays.step.3':
    'Fermez les Paramètres. Les jours fériés apparaissent sur la grille et dans la légende.',
  'help.guide.public-holidays.result':
    'Les jours fériés sont marqués de la couleur du calendrier et ne comptent jamais contre votre solde.',
  'help.guide.public-holidays.tip.1':
    "Vous pouvez ajouter plusieurs calendriers, par exemple votre région et celle d'un collègue fusionné.",
  // school-holidays
  'help.guide.school-holidays.title': 'Afficher les vacances scolaires',
  'help.guide.school-holidays.goal': 'Voir les vacances scolaires de votre région à côté de vos propres congés.',
  'help.guide.school-holidays.step.1': 'Ouvrez les Paramètres et activez School Holidays.',
  'help.guide.school-holidays.step.2':
    'Cliquez sur Ajouter un calendrier et choisissez le pays. Quand un pays découpe son calendrier, choisissez aussi la région ou la zone.',
  'help.guide.school-holidays.step.3':
    'Fermez les Paramètres. Chaque période reçoit une bande colorée en bas de ses jours.',
  'help.guide.school-holidays.result':
    'Les vacances scolaires sont purement visuelles : elles ne réduisent le solde de personne.',
  'help.guide.school-holidays.tip.1':
    'Région manquante ? Votre administrateur peut gérer les vacances scolaires à la main dans Admin, Personnalisation, Vacances scolaires.',
  // weekends
  'help.guide.weekends.title': 'Bloquer les week-ends et fixer le début de semaine',
  'help.guide.weekends.goal':
    "Garder les week-ends hors du décompte et commencer la semaine le jour dont vous avez l'habitude.",
  'help.guide.weekends.step.1': 'Ouvrez les Paramètres.',
  'help.guide.weekends.step.2':
    'Activez Bloquer les week-ends et choisissez quels jours comptent comme votre week-end.',
  'help.guide.weekends.step.3': 'Sous La semaine commence le, choisissez lundi ou dimanche.',
  'help.guide.weekends.result': 'Les jours bloqués sont grisés dans la grille et ne peuvent pas être posés par erreur.',
  // leave-year
  'help.guide.leave-year.title': 'Définir votre année de congés',
  'help.guide.leave-year.goal':
    "Compter votre solde sur un exercice fiscal ou depuis votre date d'embauche plutôt que de janvier à décembre.",
  'help.guide.leave-year.step.1': 'Ouvrez les Paramètres et trouvez Année de congés.',
  'help.guide.leave-year.step.2':
    "Choisissez Année civile, Année fiscale (avec le mois et le jour de début) ou Date d'embauche (avec la date de votre embauche).",
  'help.guide.leave-year.result':
    'Solde, jours utilisés et report suivent cette période, et la grille commence par son premier mois.',
  'help.guide.leave-year.tip.1':
    'Ce réglage est personnel : dans un plan fusionné, chacun garde sa propre année de congés et ses chiffres.',
  // carry-over
  'help.guide.carry-over.title': 'Reporter les jours non pris',
  'help.guide.carry-over.goal': "Ajouter ce qui reste à la fin d'une période à la suivante.",
  'help.guide.carry-over.step.1': 'Ouvrez les Paramètres.',
  'help.guide.carry-over.step.2': 'Activez Report.',
  'help.guide.carry-over.result': 'Le montant reporté est recalculé sur toutes vos années et affiché sous le solde.',
  'help.guide.carry-over.tip.1': 'Le désactiver remet chaque report à zéro.',
  // invite
  'help.guide.invite.title': "Planifier avec quelqu'un",
  'help.guide.invite.goal':
    'Fusionner votre plan avec un autre utilisateur TREK pour voir vos congés respectifs dans une seule grille.',
  'help.guide.invite.step.1': "Cliquez sur l'icône de personne dans le panneau Personnes.",
  'help.guide.invite.step.2': "Choisissez l'utilisateur et envoyez l'invitation.",
  'help.guide.invite.step.3':
    "Il reçoit une notification et accepte. D'ici là, l'invitation apparaît comme en attente.",
  'help.guide.invite.result':
    "Les deux plans fusionnent : chacun a une couleur, vous pouvez poser des jours l'un pour l'autre, et tout se synchronise en direct.",
  'help.guide.invite.tip.1':
    'Pour annuler une fusion, utilisez Dissoudre dans les Paramètres. Les entrées de chacun reviennent dans son propre plan.',
  'help.guide.invite.tip.2':
    "Si l'autre personne doit seulement voir vos jours, partagez votre calendrier au lieu de fusionner.",
  // share-calendar
  'help.guide.share-calendar.title': 'Partager votre calendrier en lecture seule',
  'help.guide.share-calendar.goal':
    "Laisser quelqu'un voir quand vous êtes absent sans lui donner la main sur votre plan.",
  'help.guide.share-calendar.step.1': "Cliquez sur l'icône de partage dans le panneau Calendriers partagés.",
  'help.guide.share-calendar.step.2':
    "Choisissez l'utilisateur et cliquez sur Partager. Aucune acceptation n'est nécessaire.",
  'help.guide.share-calendar.step.3':
    "Les calendriers partagés avec vous apparaissent dans le même panneau ; l'œil en masque un, Arrêter le partage révoque le vôtre.",
  'help.guide.share-calendar.result':
    "Vos congés apparaissent sous forme d'anneau coloré sur sa grille. Rien de ce que vous partagez ne peut être modifié de son côté.",
  'help.guide.share-calendar.tip.1':
    "Partage et fusion sont indépendants : vous pouvez être fusionné avec une personne et partager avec d'autres.",
  'help.guide.share-calendar.tip.2': 'Survolez un jour entouré pour voir qui est absent et pour combien de temps.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'L’Atlas est votre empreinte de voyage sur une carte du monde : chaque pays où un voyage vous a emmené est colorié, et vous ajoutez à la main ceux visités avant TREK. Zoomez pour les régions, tenez une bucket list des lieux qu’il vous reste à voir et lisez vos chiffres dans le panneau de verre en bas.',
  'help.ctx.atlas.bullet.1':
    'La carte : les pays visités portent une couleur qui leur reste, les pays prévus ont un contour en pointillés, ceux de la bucket list des hachures, tout le reste est gris. Survolez un pays pour ses voyages, ses lieux et ses première et dernière visites.',
  'help.ctx.atlas.bullet.2':
    'Recherche en haut : tapez un pays ou un lieu. Choisir un pays y fait voler la carte et ouvre sa fenêtre ; choisir un lieu atterrit dans sa région pour que vous puissiez la marquer.',
  'help.ctx.atlas.bullet.3':
    'Afficher les pays prévus, en haut à droite : révèle les pays de vos voyages à venir. L’interrupteur n’apparaît que tant que vous en avez.',
  'help.ctx.atlas.bullet.4':
    'Panneau en bas : l’onglet Statistiques avec pays, voyages, lieux, villes, jours, continents et votre série ; l’onglet Bucket List avec ce qui vous attend encore.',
  'help.ctx.atlas.bullet.5':
    'Régions : à partir du niveau de zoom 5, la carte passe aux états et provinces, chacun cliquable pour le marquer ou le retirer.',
  'help.ctx.atlas.bullet.6':
    'Dawarich : avec le module connecté, un panneau à gauche des statistiques coche des envies et ajoute des pays depuis vos enregistrements, jamais sans votre confirmation.',
  // mark-country
  'help.guide.mark-country.title': 'Marquer un pays comme visité',
  'help.guide.mark-country.goal':
    'Ajoutez un pays où vous êtes allé avant TREK, pour que la carte et votre compte l’incluent.',
  'help.guide.mark-country.step.1': 'Tapez le pays dans le champ de recherche en haut de la carte.',
  'help.guide.mark-country.step.2': 'Choisissez-le dans la liste. La carte y vole et une fenêtre s’ouvre pour ce pays.',
  'help.guide.mark-country.step.3': 'Choisissez Marquer comme visité.',
  'help.guide.mark-country.result':
    'Le pays prend sa couleur sur la carte et Pays compte un de plus. Cette couleur est permanente : marquer d’autres pays ne rebat jamais les autres.',
  'help.guide.mark-country.tip.1':
    'Cliquer un pays gris sur la carte ouvre la même fenêtre ; la recherche est le chemin sûr pour les petits pays.',
  'help.guide.mark-country.tip.2':
    'Un pays marqué à la main compte toujours comme visité, quelles que soient les dates d’un voyage qui y va.',
  // unmark-country
  'help.guide.unmark-country.title': 'Retirer un pays marqué',
  'help.guide.unmark-country.goal': 'Retirez de la carte un pays marqué à la main.',
  'help.guide.unmark-country.step.1':
    'Cherchez le pays et choisissez-le, ou cliquez-le sur la carte. Pour un pays que vous avez marqué vous-même, la fenêtre demande s’il faut le retirer.',
  'help.guide.unmark-country.step.2': 'Confirmez avec Retirer.',
  'help.guide.unmark-country.result': 'Le pays redevient gris et quitte votre compte.',
  'help.guide.unmark-country.tip.1':
    'Seuls les pays marqués à la main se retirent ainsi. Un pays avec des voyages ou des lieux reste tant qu’ils y sont ; Retirer figure aussi dans sa carte de détail du panneau quand il a été marqué à la main.',
  // country-details
  'help.guide.country-details.title': 'Voir ce que vous avez fait dans un pays',
  'help.guide.country-details.goal': 'Ouvrez un pays visité et sautez aux voyages qui vous y ont emmené.',
  'help.guide.country-details.step.1': 'Cherchez un pays que vous avez visité.',
  'help.guide.country-details.step.2':
    'Choisissez-le. La carte y vole et le panneau en bas gagne une carte avec son drapeau, ses lieux, ses voyages et une puce par voyage.',
  'help.guide.country-details.result': 'Cliquez une puce de voyage pour ouvrir ce voyage dans le planificateur.',
  'help.guide.country-details.tip.1':
    'Survoler le pays sur la carte montre les mêmes chiffres plus les première et dernière visites.',
  // planned-countries
  'help.guide.planned-countries.title': 'Afficher les pays où vous allez',
  'help.guide.planned-countries.goal':
    'Mettez sur la carte les pays de vos voyages à venir sans les compter comme visités.',
  'help.guide.planned-countries.step.1':
    'Activez Afficher les pays prévus, en haut à droite. Le nombre à côté dit combien attendent.',
  'help.guide.planned-countries.step.2':
    'Cherchez un pays prévu et choisissez-le : le panneau dit Prévu et l’infobulle de la carte montre quand vous partez.',
  'help.guide.planned-countries.result':
    'Les pays prévus apparaissent avec un contour en pointillés, pour ne jamais ressembler à un endroit déjà visité. L’interrupteur retient votre choix.',
  'help.guide.planned-countries.tip.1':
    'Un pays compte comme visité dès que le voyage là-bas a commencé ; un voyage en cours compte aussi. Les voyages sans dates restent tout à fait hors des statistiques.',
  'help.guide.planned-countries.tip.2': 'L’interrupteur n’existe que tant que vous avez des voyages à venir.',
  // regions
  'help.guide.regions.title': 'Marquer une région',
  'help.guide.regions.goal': 'Plus fin que les pays : marquez les états, provinces ou préfectures où vous êtes allé.',
  'help.guide.regions.step.1':
    'Zoomez dans un pays jusqu’à ce que ses régions apparaissent, à partir du niveau 5. Chercher le pays et le choisir vous amène assez près.',
  'help.guide.regions.step.2': 'Cliquez une région. Le survol la nomme ; la fenêtre montre la région et son pays.',
  'help.guide.regions.step.3': 'Choisissez Marquer comme visité.',
  'help.guide.regions.result':
    'La région se remplit de la couleur du pays. Marquer une région compte aussi le pays comme visité s’il ne l’était pas déjà.',
  'help.guide.regions.tip.1':
    'Cliquer une région visitée propose Retirer, que vous l’ayez marquée ou qu’un lieu l’y ait mise.',
  'help.guide.regions.tip.2': 'Les régions où vous avez de vrais lieux sont marquées pour vous ; rien à faire là.',
  // search-place
  'help.guide.search-place.title': 'Trouver un lieu et marquer sa région',
  'help.guide.search-place.goal':
    'Marquez la Bavière en cherchant Munich, sans savoir dans quelle région se trouve une ville.',
  'help.guide.search-place.step.1':
    'Tapez une ville, un monument ou une adresse dans le champ de recherche. Les pays viennent d’abord ; les lieux correspondants apparaissent dessous, sous Lieux.',
  'help.guide.search-place.step.2':
    'Choisissez le lieu. La carte y vole et détermine dans quelle région se trouve l’endroit.',
  'help.guide.search-place.step.3':
    'Choisissez Marquer comme visité pour cette région, ou Ajouter à la bucket list si elle vous attend encore.',
  'help.guide.search-place.result':
    'La région est marquée, et le pays avec elle. Les pays sans données de régions dans le paquet cartographique retombent sur le pays lui-même.',
  'help.guide.search-place.tip.1':
    'Les lieux viennent de la même recherche que partout dans TREK, ils suivent donc le fournisseur configuré par votre admin.',
  // bucket-country
  'help.guide.bucket-country.title': 'Mettre un pays sur la bucket list',
  'help.guide.bucket-country.goal':
    'Tenez une bucket list de pays directement sur la carte, à part de ceux où vous êtes allé.',
  'help.guide.bucket-country.step.1': 'Cherchez le pays et choisissez-le, ou cliquez-le sur la carte.',
  'help.guide.bucket-country.step.2': 'Choisissez Ajouter à la bucket list.',
  'help.guide.bucket-country.step.3':
    'Choisissez un mois et une année si vous savez déjà quand, puis confirmez avec Ajouter à la bucket list.',
  'help.guide.bucket-country.result':
    'Le pays est dessiné avec des hachures dans la couleur qu’il portera une fois que vous y serez, et il apparaît dans l’onglet Bucket List du panneau.',
  'help.guide.bucket-country.tip.1': 'La même fenêtre propose Retirer de la bucket list une fois le pays sur la liste.',
  'help.guide.bucket-country.tip.2':
    'Une entrée par date cible : le même pays peut être sur la liste pour deux mois différents, mais pas deux fois pour le même.',
  // bucket-place
  'help.guide.bucket-place.title': 'Ajouter un lieu à la bucket list',
  'help.guide.bucket-place.goal':
    'Enregistrez une ville, un site ou une adresse dont vous rêvez, avec coordonnées et date cible.',
  'help.guide.bucket-place.step.1': 'Ouvrez l’onglet Bucket List dans le panneau en bas.',
  'help.guide.bucket-place.step.2': 'Cliquez Ajouter un lieu.',
  'help.guide.bucket-place.step.3':
    'Tapez le nom et appuyez sur le bouton de recherche ; choisissez le résultat pour que le lieu ait des coordonnées. Taper un nom et sauter la recherche marche aussi.',
  'help.guide.bucket-place.step.4': 'Choisissez un mois et une année si vous voulez et cliquez Ajouter.',
  'help.guide.bucket-place.result':
    'Le lieu se place en haut de votre bucket list avec sa date cible ; le × à côté le retire.',
  'help.guide.bucket-place.tip.1':
    'Une envie avec des coordonnées est ce que Dawarich pourra cocher pour vous plus tard, une fois que vos enregistrements montrent que vous y étiez.',
  // stats
  'help.guide.stats.title': 'Lire vos statistiques',
  'help.guide.stats.goal': 'Savoir ce que comptent les chiffres du panneau, et ce qu’ils ne comptent pas.',
  'help.guide.stats.step.1':
    'Pays est le nombre de pays distincts où vous êtes vraiment allé ; les prévus sont affichés à côté, pas dedans. Voyages, Lieux et Jours sont des totaux sur tous vos voyages. Villes est déduit des adresses de vos lieux, c’est donc une estimation.',
  'help.guide.stats.step.2':
    'Les continents montrent les pays visités par continent ; l’Antarctique rejoint la rangée dès que vous y êtes allé. Puis votre série, années consécutives avec au moins un voyage, et le nombre de voyages faits cette année.',
  'help.guide.stats.result':
    'Les chiffres suivent vos voyages à mesure que vous les planifiez ; rien ici ne demande d’entretien.',
  'help.guide.stats.tip.1':
    'Les villes sont lues dans le texte de l’adresse, pas cherchées, donc une adresse courte comme « Osteria Francescana, Italy » ou une qui finit sur une préfecture peut donner une région plutôt qu’une ville.',
  'help.guide.stats.tip.2':
    'Les pays marqués à la main comptent dans Pays et les continents, mais n’apportent ni voyages, ni lieux, ni jours.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Ajouter des pays depuis vos enregistrements',
  'help.guide.dawarich-countries.goal':
    'Laissez Dawarich dire dans quels pays vous étiez au cours de l’année écoulée, et posez sur la carte ceux que vous confirmez.',
  'help.guide.dawarich-countries.step.1':
    'Avec le module Dawarich connecté, un panneau Dawarich se trouve en bas de la carte, à gauche des statistiques, avec deux tuiles. Cliquez sur Pays.',
  'help.guide.dawarich-countries.step.2':
    'Le dialogue s’ouvre sur son onglet Pays. Cliquez sur Rechercher des pays : TREK lit les pays et les villes que vos enregistrements couvrent sur les 12 derniers mois, un mois à la fois, laissez-lui donc un instant. Chaque pays que votre Atlas n’a pas encore est listé avec son drapeau, le nombre de villes et le nom de la première, et il est coché d’emblée ; cliquez sur une ligne pour la laisser de côté.',
  'help.guide.dawarich-countries.step.3':
    'Confirmez avec le bouton en bas à droite, qui dit Ajouter 5 pays quand cinq lignes sont cochées. Le dialogue dit combien ont été ajoutés ; fermez-le et la carte s’est relue.',
  'help.guide.dawarich-countries.result':
    'Les pays confirmés portent une couleur sur la carte et comptent dans Pays, notés comme venant de Dawarich. Ce que vous avez marqué à la main n’est pas touché.',
  'help.guide.dawarich-countries.tip.1':
    'Les pays que l’Atlas montre déjà comme visités, à la main, par un voyage ou par une vérification antérieure, sont laissés de côté, si bien que vos propres marques ne sont jamais réétiquetées. Un pays que vous aviez retiré de l’Atlas revient quand vous le confirmez ici.',
  'help.guide.dawarich-countries.tip.2':
    'Un nom de pays que TREK ne sait pas associer est listé sous les lignes plutôt qu’abandonné, et Vérifier à nouveau interroge Dawarich une fois de plus. La note sous la liste dit que Les 12 derniers mois ont été examinés ; cette fenêtre est fixe.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Cocher des envies depuis vos enregistrements',
  'help.guide.dawarich-wishes.goal':
    'Découvrez quels lieux de votre bucket list vous avez réellement atteints, et cochez-les au jour où c’est arrivé.',
  'help.guide.dawarich-wishes.step.1':
    'Dans le panneau Dawarich en bas de la carte, à gauche des statistiques, cliquez sur Liste d’envies.',
  'help.guide.dawarich-wishes.step.2':
    'Le dialogue s’ouvre sur son onglet Liste d’envies. Cliquez sur Vérifier la liste de souhaits : TREK parcourt vos enregistrements pour chaque entrée qui a des coordonnées. Une envie que vous avez atteinte est listée avec la distance à laquelle vous êtes passé, la durée de votre séjour et le jour, et elle est cochée d’emblée ; une déjà cochée dit Déjà coché. Sous la liste, une note compte les entrées sans coordonnées, et la règle y figure aussi : Une envie est atteinte à moins de 250 m et après 20 minutes sur place.',
  'help.guide.dawarich-wishes.step.3':
    'Confirmez avec le bouton en bas à droite, qui dit Cocher 2 quand deux lignes sont cochées. Fermez ensuite le dialogue et ouvrez l’onglet Bucket List du panneau à côté.',
  'help.guide.dawarich-wishes.result':
    'Chaque envie porte une coche verte avec la date du séjour, pas celle d’aujourd’hui ; son infobulle dit Coché à partir de vos enregistrements Dawarich, et un clic sur la date l’annule.',
  'help.guide.dawarich-wishes.tip.1':
    'Passer devant ne compte pas : la règle exige à la fois la proximité et le temps, et de plusieurs séjours qui conviennent, le plus long l’emporte. Une envie sans coordonnées ne peut pas être vérifiée, ajoutez donc les lieux par la recherche dans Ajouter un lieu plutôt que par leur seul nom.',
  'help.guide.dawarich-wishes.tip.2':
    'Une vérification regarde jusqu’à 50 entrées, celles pas encore cochées d’abord, et le dit quand il y en avait plus. Une envie déjà cochée garde sa propre date.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Collections',
  'help.ctx.collections.summary':
    'Collections est votre bibliothèque de lieux en dehors de tout voyage : des listes nommées de lieux que vous avez trouvés et voulez garder, chaque lieu avec un statut Idée, À visiter ou Visité. Les lieux sont copiés vers et depuis les voyages, jamais liés, si bien qu’une liste et un voyage ne se modifient jamais l’un l’autre.',
  'help.ctx.collections.bullet.1':
    'Barre des listes à gauche : vos propres listes, celles partagées avec vous, les invitations qui attendent un oui, Tous les enregistrés comme réunion de tout ce qui vous appartient, et Nouvelle liste plus l’import de fichier tout en haut.',
  'help.ctx.collections.bullet.2':
    'En-tête de la liste ouverte : sa couleur, sa couverture, sa description et ses liens, les membres, et les actions Modifier, Exporter et Partager à droite.',
  'help.ctx.collections.bullet.3':
    'Ligne de filtres au-dessus des lieux : statut, catégorie, note et tri, le filtre par libellé, le + pour ajouter un lieu, l’import depuis un voyage et Choisir pour les actions groupées.',
  'help.ctx.collections.bullet.4':
    'Lignes de lieux : avatar, nom et adresse, libellés et catégorie, et la pastille de statut à droite qui change d’un clic.',
  'help.ctx.collections.bullet.5':
    'Carte à droite : une épingle par lieu ayant des coordonnées, le sélecteur liste ou carte, le champ de recherche et le filtre par libellé. Cliquer une épingle ouvre ce lieu.',
  'help.ctx.collections.bullet.6':
    'Fiche de détail : cliquez une ligne pour la couverture, la catégorie, les libellés, le statut, la description et les liens, avec Modifier, Copier vers un voyage et Retirer de la liste.',
  // create-list
  'help.guide.create-list.title': 'Créer une liste',
  'help.guide.create-list.goal':
    'Démarrez une nouvelle liste nommée, avec une couleur et une couverture, prête pour des lieux.',
  'help.guide.create-list.step.1': 'Cliquez Nouvelle liste en haut de la barre des listes.',
  'help.guide.create-list.step.2':
    'Donnez un nom à la liste et choisissez une couleur. Image de couverture, description et liens sont facultatifs ; vous pourrez les ajouter plus tard avec Modifier.',
  'help.guide.create-list.step.3': 'Cliquez Créer.',
  'help.guide.create-list.result':
    'La liste s’ouvre vide, avec Ajouter un lieu et Importer depuis un voyage comme les deux façons de la remplir.',
  'help.guide.create-list.tip.1':
    'La couverture peut être un envoi de votre part ou une image trouvée via la recherche Unsplash dans le même dialogue.',
  // add-place
  'help.guide.add-place.title': 'Ajouter un lieu',
  'help.guide.add-place.goal':
    'Trouvez un lieu et enregistrez-le dans la liste ouverte avec nom, catégorie, statut et notes en une fois.',
  'help.guide.add-place.step.1': 'Cliquez le + dans la ligne de filtres au-dessus des lieux.',
  'help.guide.add-place.step.2':
    'Tapez le lieu dans le champ de recherche et choisissez un résultat. Nom, adresse et coordonnées se remplissent à partir de lui.',
  'help.guide.add-place.step.3':
    'Définissez le statut et, si vous voulez, une catégorie, une description et des liens, puis cliquez Ajouter. Le dialogue reste ouvert pour le lieu suivant ; Annuler le ferme.',
  'help.guide.add-place.result':
    'Le lieu apparaît dans la liste et, s’il a des coordonnées, comme épingle sur la carte.',
  'help.guide.add-place.tip.1':
    'Depuis un voyage, Enregistrer dans une collection dans l’inspecteur de lieu ou le menu du lieu met un lieu du voyage sur une liste sans quitter le voyage.',
  'help.guide.add-place.tip.2':
    'La liste doit être à vous ou une où vous êtes éditeur ou admin ; le + n’est pas là sur Tous les enregistrés ni sur une liste que vous ne faites que consulter.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importer les lieux d’un voyage',
  'help.guide.import-from-trip.goal':
    'Amenez d’un coup tous les lieux d’un voyage sur une liste au lieu de les enregistrer un par un.',
  'help.guide.import-from-trip.step.1':
    'Cliquez le bouton d’import avec la flèche nuage dans la ligne de filtres. Sur une liste vide, la même action se trouve à côté de Ajouter un lieu.',
  'help.guide.import-from-trip.step.2': 'Choisissez l’un de vos voyages.',
  'help.guide.import-from-trip.step.3':
    'Cochez les lieux que vous voulez. Les lieux déjà sur la liste sont grisés ; ceux qu’aucun jour du voyage ne contient sont cochés d’avance. Nouveaux seulement masque ce que vous avez déjà.',
  'help.guide.import-from-trip.step.4': 'Cliquez Importer. Le bouton dit toujours combien vont être ajoutés.',
  'help.guide.import-from-trip.result':
    'Les lieux sont copiés sur la liste avec leur nom, adresse, coordonnées, description et catégorie. Le voyage reste tel quel.',
  'help.guide.import-from-trip.tip.1':
    'Les doublons par nom ou coordonnées sont ignorés automatiquement, importer deux fois ne fait donc aucun mal.',
  'help.guide.import-from-trip.tip.2':
    'Dans la liste des lieux d’un voyage, le mode sélection propose plutôt Enregistrer dans une collection pour un ensemble de lieux choisis à la main.',
  // place-status
  'help.guide.place-status.title': 'Définir le statut d’un lieu',
  'help.guide.place-status.goal':
    'Gardez trace de ce qui est une idée, de ce qui est sur la liste courte et de là où vous êtes allé.',
  'help.guide.place-status.step.1':
    'Cliquez la pastille de statut au bout droit d’une ligne de lieu. Idée devient À visiter.',
  'help.guide.place-status.step.2': 'Cliquez-la encore pour Visité, et une fois de plus pour repartir à Idée.',
  'help.guide.place-status.result':
    'La pastille et sa couleur changent aussitôt ; le filtre de statut au-dessus de la liste compte avec.',
  'help.guide.place-status.tip.1':
    'Le statut est propre à Collections : copier un lieu dans un voyage ne l’emporte pas.',
  'help.guide.place-status.tip.2':
    'Depuis un voyage, Enregistrer dans une collection montre une pastille de statut par liste où se trouve le lieu, et le panneau des lieux a une action Marquer comme visité pour une sélection.',
  // place-detail
  'help.guide.place-detail.title': 'Ouvrir un lieu enregistré',
  'help.guide.place-detail.goal': 'Voyez tout sur un lieu et agissez : modifier, copier vers un voyage, retirer.',
  'help.guide.place-detail.step.1':
    'Cliquez une ligne de lieu. La fiche de détail s’ouvre à côté de la liste et la carte se déplace vers le lieu.',
  'help.guide.place-detail.step.2':
    'En bas se trouvent Modifier, Copier vers un voyage et Retirer de la liste ; l’appareil photo sur la couverture remplace la photo automatique par une des vôtres.',
  'help.guide.place-detail.result':
    'Modifier déverrouille nom, catégorie, libellés, adresse, coordonnées, description et liens directement dans la fiche.',
  'help.guide.place-detail.tip.1':
    'La couverture est récupérée automatiquement quand le lieu n’a pas d’image à lui. Votre propre envoi peut être un JPG, PNG, GIF ou WebP jusqu’à 20 Mo.',
  'help.guide.place-detail.tip.2':
    'Les membres d’une liste partagée peuvent aussi laisser ici une note en étoiles, et le filtre de note dans la ligne de filtres utilise la moyenne.',
  // labels
  'help.guide.labels.title': 'Grouper des lieux avec des libellés',
  'help.guide.labels.goal':
    'Donnez à une liste ses propres libellés, comme des quartiers ou des jours, au-delà des catégories communes.',
  'help.guide.labels.step.1':
    'Ouvrez le gestionnaire de libellés depuis le contrôle des libellés dans la ligne de filtres.',
  'help.guide.labels.step.2':
    'Tapez un nom, choisissez une couleur et cliquez Ajouter un libellé. Renommez, recolorez ou supprimez les libellés existants dans le même dialogue.',
  'help.guide.labels.step.3':
    'Activez Choisir, cochez les lieux et cliquez Attribuer un libellé dans la barre de sélection. Un seul lieu prend aussi des libellés via Modifier sur sa fiche de détail.',
  'help.guide.labels.step.4':
    'Choisissez un ou plusieurs libellés dans la ligne de filtres pour restreindre la liste et la carte aux lieux qui en portent au moins un.',
  'help.guide.labels.result':
    'Les lieux libellés montrent leurs libellés sur la ligne ; le filtre par libellé est là pour chaque membre, lecteurs compris.',
  'help.guide.labels.tip.1':
    'Les libellés appartiennent à la seule liste où ils ont été créés. Déplacer un lieu vers une autre liste les fait tomber.',
  'help.guide.labels.tip.2': 'Gérer et attribuer des libellés demande des droits d’édition sur la liste.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrer et sélectionner des lieux',
  'help.guide.filter-select.goal': 'Restreignez la liste et agissez sur beaucoup de lieux à la fois.',
  'help.guide.filter-select.step.1':
    'Utilisez les menus déroulants de la ligne de filtres : statut, catégorie, note minimale et ordre de tri. Chacun montre combien de lieux il laisserait.',
  'help.guide.filter-select.step.2':
    'Cliquez Choisir. Chaque ligne reçoit une case à cocher et une barre de sélection apparaît.',
  'help.guide.filter-select.step.3':
    'Cochez des lieux ou utilisez Tout sélectionner pour tout ce qui est filtré en ce moment, puis choisissez Attribuer un libellé, Déplacer vers une liste, Dupliquer dans une liste, Copier vers un voyage ou Supprimer.',
  'help.guide.filter-select.result':
    'Les actions s’appliquent à toute la sélection d’un coup. Le × à droite quitte le mode sélection.',
  'help.guide.filter-select.tip.1':
    'Tout sélectionner suit le filtre, donc filtrer sur À visiter et tout sélectionner est le moyen rapide d’agir sur la liste courte.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copier des lieux dans un voyage',
  'help.guide.copy-to-trip.goal': 'Transformez des lieux enregistrés en étapes de l’un de vos voyages.',
  'help.guide.copy-to-trip.step.1':
    'Activez Choisir et cochez les lieux, ou ouvrez un lieu et utilisez Copier vers un voyage sur sa fiche de détail.',
  'help.guide.copy-to-trip.step.2': 'Cliquez Copier vers un voyage dans la barre de sélection.',
  'help.guide.copy-to-trip.step.3': 'Choisissez le voyage. Le champ de recherche restreint une longue liste.',
  'help.guide.copy-to-trip.result':
    'Les lieux atterrissent dans la liste des lieux de ce voyage avec nom, description, catégorie, notes, prix, coordonnées, photo et tags. Rien ne change dans la collection.',
  'help.guide.copy-to-trip.tip.1':
    'Les lecteurs d’une liste partagée peuvent le faire aussi ; cela copie hors de la liste, cela ne la modifie pas.',
  // share-list
  'help.guide.share-list.title': 'Partager une liste avec quelqu’un',
  'help.guide.share-list.goal': 'Planifiez une liste avec d’autres personnes de ce TREK, en direct.',
  'help.guide.share-list.step.1': 'Cliquez Partager dans l’en-tête de votre liste.',
  'help.guide.share-list.step.2': 'Sélectionnez l’utilisateur et un rôle : Lecteur, Éditeur ou Admin.',
  'help.guide.share-list.step.3':
    'Cliquez Envoyer l’invitation. La personne apparaît en invitation en attente jusqu’à ce qu’elle accepte l’invitation dans sa barre des listes.',
  'help.guide.share-list.result':
    'Une fois acceptée, la liste apparaît pour elle sous Partagée et chaque changement se synchronise en direct. Les membres et leurs rôles restent modifiables dans le même dialogue.',
  'help.guide.share-list.tip.1':
    'Les lecteurs peuvent regarder, noter et copier des lieux dans leurs propres voyages. Les éditeurs ajoutent et modifient lieux et libellés. Les admins peuvent aussi supprimer.',
  'help.guide.share-list.tip.2':
    'Seul le propriétaire invite et retire des personnes ; un membre peut quitter lui-même une liste partagée.',
  // export-list
  'help.guide.export-list.title': 'Exporter une liste en fichier',
  'help.guide.export-list.goal':
    'Remettez une liste à quelqu’un sur un autre TREK, ou emportez-la dans une appli de cartes.',
  'help.guide.export-list.step.1': 'Cliquez Exporter dans l’en-tête de la liste.',
  'help.guide.export-list.step.2':
    'Choisissez Liste TREK pour un autre TREK, avec libellés et statut, ou GPX pour OsmAnd, Organic Maps, un Garmin et d’autres applis qui lisent des waypoints.',
  'help.guide.export-list.result': 'Le fichier se télécharge. Tout membre d’une liste partagée peut l’exporter.',
  'help.guide.export-list.tip.1':
    'Un lieu sans coordonnées ne peut pas être un waypoint GPX ; il est laissé de côté et TREK vous dit combien l’ont été.',
  'help.guide.export-list.tip.2':
    'Les notes, les membres et les photos envoyées restent volontairement en arrière ; ils appartiennent à ce TREK, pas à la liste.',
  // import-file
  'help.guide.import-file.title': 'Importer une liste depuis un fichier',
  'help.guide.import-file.goal':
    'Faites entrer un fichier de liste TREK ou un fichier GPX, comme nouvelle liste ou dans une que vous avez.',
  'help.guide.import-file.step.1':
    'Cliquez le bouton d’import avec la flèche d’envoi à côté de Nouvelle liste dans la barre des listes.',
  'help.guide.import-file.step.2':
    'Choisissez le fichier. TREK montre ce qu’il contient avant que quoi que ce soit n’arrive : le nom, combien de lieux et de libellés.',
  'help.guide.import-file.step.3':
    'Gardez Nouvelle liste et changez le nom si vous voulez, ou choisissez Ajouter à une liste pour mettre les lieux dans une liste que vous pouvez modifier, puis cliquez Importer.',
  'help.guide.import-file.result':
    'Vous arrivez sur la liste avec les lieux importés. Ajouter à une liste ne fait jamais qu’ajouter ; les lieux déjà là gardent leur statut, leurs notes et leurs libellés.',
  'help.guide.import-file.tip.1':
    'D’un GPX, chaque waypoint nommé devient un lieu ; les traces sont des lignes et sont laissées de côté, et l’aperçu dit combien de points cela faisait.',
  'help.guide.import-file.tip.2':
    'Un fichier qui n’est ni une liste TREK ni un GPX est refusé avec une raison ; un seul lieu illisible est ignoré, pas tout le fichier.',
  // edit-list
  'help.guide.edit-list.title': 'Modifier ou supprimer une liste',
  'help.guide.edit-list.goal':
    'Changez le nom, la couleur, la couverture, la description ou les liens d’une liste, ou retirez la liste.',
  'help.guide.edit-list.step.1': 'Cliquez Modifier dans l’en-tête de la liste. Seul le propriétaire le voit.',
  'help.guide.edit-list.step.2':
    'Changez ce que vous voulez et cliquez Enregistrer. Supprimer la liste en bas à gauche retire la liste avec tous ses lieux, après une confirmation.',
  'help.guide.edit-list.result': 'L’en-tête prend aussitôt la nouvelle couleur, la couverture et la description.',
  'help.guide.edit-list.tip.1':
    'Supprimer une liste ne peut pas être annulé. Exportez-la d’abord si vous voulez en garder une copie.',
  // all-saved
  'help.guide.all-saved.title': 'Chercher dans toute votre bibliothèque',
  'help.guide.all-saved.goal': 'Regardez d’un coup toutes les listes qui vous appartiennent.',
  'help.guide.all-saved.step.1':
    'Cliquez Tous les enregistrés dans la barre des listes. Il réunit les lieux de chaque liste que vous possédez ou copossédez.',
  'help.guide.all-saved.step.2':
    'Utilisez le champ de recherche et les filtres comme sur n’importe quelle liste ; Choisir marche ici aussi pour copier vers un voyage.',
  'help.guide.all-saved.result':
    'Une seule vue sur tous vos lieux enregistrés, sans ajout ni import, puisqu’il n’y a pas de liste unique où les mettre.',
  'help.guide.all-saved.tip.1':
    'Les libellés sont par liste, le filtre par libellé n’est donc pas proposé sur Tous les enregistrés.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journal de voyage',
  'help.ctx.journey.summary':
    'Journal de voyage est votre carnet de voyage où les photos passent en premier. Chaque journal est lié à un ou plusieurs voyages et grandit jour après jour à partir d’entrées avec un récit, des photos, une humeur et la météo. Cet écran liste vos journaux ; ouvrez-en un pour écrire.',
  'help.ctx.journey.bullet.1':
    'La bannière en haut montre le journal en cours, ou le plus récent, avec ses nombres d’entrées, de photos et de lieux. Continuer à écrire l’ouvre sur aujourd’hui.',
  'help.ctx.journey.bullet.2':
    'En dessous, une carte par journal avec sa couverture, son sous-titre, ses dates et ses nombres. Cliquez une carte pour l’ouvrir.',
  'help.ctx.journey.bullet.3':
    'La dernière carte de la grille, Créer un nouveau journal, en démarre un à partir de vos voyages.',
  // create-journey
  'help.guide.create-journey.title': 'Créer un journal',
  'help.guide.create-journey.goal':
    'Commencer un carnet pour un voyage, avec les lieux du voyage déjà en attente comme suggestions.',
  'help.guide.create-journey.step.1': 'Cliquez Créer un nouveau journal, la dernière carte de la grille.',
  'help.guide.create-journey.step.2':
    'Donnez-lui un nom et, si vous voulez, un sous-titre, puis cochez les voyages auxquels il appartient. Le compteur indique combien de lieux vont arriver.',
  'help.guide.create-journey.step.3': 'Cliquez Créer un journal.',
  'help.guide.create-journey.result':
    'Le carnet s’ouvre. Chaque lieu des voyages liés se trouve dans la chronologie comme suggestion, une par jour où il figure, prête à être écrite.',
  'help.guide.create-journey.tip.1': 'D’autres voyages peuvent être liés plus tard depuis Paramètres du journal.',
  'help.guide.create-journey.tip.2':
    'Un journal sans voyage fonctionne aussi ; vous ajoutez alors les entrées à la main.',
  // open-journey
  'help.guide.open-journey.title': 'Ouvrir un journal',
  'help.guide.open-journey.goal': 'Entrer dans un carnet, et savoir où il s’ouvre.',
  'help.guide.open-journey.step.1':
    'Cliquez une carte. Chacune montre la couverture, les dates et combien d’entrées, de photos et de lieux le journal contient.',
  'help.guide.open-journey.result':
    'Un journal en cours s’ouvre sur aujourd’hui, ou sur la dernière entrée avant aujourd’hui quand rien n’est encore écrit ; un journal terminé s’ouvre au début.',
  'help.guide.open-journey.tip.1':
    'La couverture est la première photo du journal, sauf si vous en définissez une dans Paramètres du journal.',
  // continue-writing
  'help.guide.continue-writing.title': 'Continuer le journal en cours',
  'help.guide.continue-writing.goal': 'Aller directement à la page d’aujourd’hui du journal que vous vivez.',
  'help.guide.continue-writing.step.1':
    'Cliquez Continuer à écrire dans la bannière en haut. Elle montre le journal en cours, ou le plus récent quand aucun n’est en cours.',
  'help.guide.continue-writing.result':
    'Le carnet s’ouvre sur aujourd’hui, ou sur la dernière entrée avant aujourd’hui quand rien n’est encore écrit.',
  'help.guide.continue-writing.tip.1':
    'La bannière propose aussi une suggestion pour un voyage qui n’a pas encore de journal ; Ignorer masque celle-ci.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Carnet',
  'help.ctx.journey-detail.summary':
    'Un journal ouvert : la chronologie à gauche, jour par jour, et la carte à droite avec chaque entrée et les lieux des voyages liés. Tout ce qui ajoute au carnet se trouve en haut ; l’en-tête contient les nombres, Studio, l’interrupteur des suggestions et Paramètres du journal.',
  'help.ctx.journey-detail.bullet.1':
    'En-tête : couverture, titre et sous-titre, les nombres de jours, de lieux, d’entrées et de photos, et à droite Studio, l’interrupteur des suggestions et Paramètres du journal.',
  'help.ctx.journey-detail.bullet.2':
    'Barre d’outils : les onglets Chronologie et Galerie, Rechercher dans ce carnet et Ajouter une entrée.',
  'help.ctx.journey-detail.bullet.3':
    'Chronologie : une section par jour avec un + pour ajouter une entrée ce jour-là ; des cartes d’entrée avec photos, humeur, météo et récit ; des suggestions issues des voyages, dans un style plus clair, avec Écarter cette suggestion.',
  'help.ctx.journey-detail.bullet.4':
    'Carte : les entrées comme épingles, reliées par ordre de date par une ligne en pointillés, les lieux des voyages, et les traces GPX importées dans ces voyages.',
  'help.ctx.journey-detail.bullet.5':
    'Paramètres du journal : couverture, nom et sous-titre, traces sur la carte, champs de l’entrée, suggestions écartées, voyages liés, contributeurs, partage public, archivage et suppression.',
  'help.ctx.journey-detail.bullet.6':
    'Deux boutons ronds flottent sur une longue chronologie : retour en haut, et saut à la dernière entrée.',
  // add-entry
  'help.guide.add-entry.title': 'Écrire une entrée',
  'help.guide.add-entry.goal': 'Ajouter le récit d’une journée avec titre, texte, humeur et météo.',
  'help.guide.add-entry.step.1':
    'Cliquez Ajouter une entrée dans la barre d’outils, ou le + dans l’en-tête d’un jour pour commencer ce jour-là.',
  'help.guide.add-entry.step.2':
    'Donnez un nom au moment et écrivez le récit. La barre au-dessus du texte ajoute gras, italique, titres, citations, liens et listes en Markdown.',
  'help.guide.add-entry.step.3':
    'Choisissez une humeur et la météo, vérifiez la date, et épinglez un lieu si vous voulez : cherchez un lieu ou utilisez votre position actuelle.',
  'help.guide.add-entry.step.4': 'Cliquez Enregistrer.',
  'help.guide.add-entry.result':
    'L’entrée apparaît à son jour dans la chronologie et comme épingle sur la carte. Ses nombres se mettent à jour dans l’en-tête.',
  'help.guide.add-entry.tip.1': 'Écrire dans une suggestion, c’est le même éditeur, avec le lieu déjà renseigné.',
  'help.guide.add-entry.tip.2':
    'Les tags en bas sont du texte libre, pépite cachée ou meilleur repas, et la recherche les trouve.',
  // entry-photos
  'help.guide.entry-photos.title': 'Ajouter des photos et des vidéos à une entrée',
  'help.guide.entry-photos.goal': 'Mettre des images sur une journée ; la première devient la couverture de l’entrée.',
  'help.guide.entry-photos.step.1': 'Ouvrez le menu d’une entrée avec le ⋯ sur sa carte et choisissez Modifier.',
  'help.guide.entry-photos.step.2':
    'Cliquez Téléverser des photos et choisissez les fichiers. Depuis la galerie prend des images déjà dans la galerie du journal ; External photos cherche ce jour-là dans une bibliothèque Immich ou Synology connectée.',
  'help.guide.entry-photos.step.3':
    'Survolez une image pour Mettre en 1er afin de choisir la couverture, puis cliquez Enregistrer.',
  'help.guide.entry-photos.result':
    'Les photos apparaissent sur la carte et dans la galerie ; la première est la vignette partout.',
  'help.guide.entry-photos.tip.1':
    'Les vidéos vont sur une entrée de la même façon : mp4, m4v, webm ou mov jusqu’à 500 Mo, stockées telles que téléversées.',
  'help.guide.entry-photos.tip.2':
    'Les fichiers HEIC d’un iPhone sont convertis en JPEG au téléversement, ce qui supprime leurs métadonnées GPS et appareil.',
  // suggestions
  'help.guide.suggestions.title': 'Utiliser ou écarter les suggestions',
  'help.guide.suggestions.goal':
    'Transformer les lieux de vos voyages en entrées, et écarter ceux dont vous n’écrirez pas.',
  'help.guide.suggestions.step.1':
    'Une suggestion est une carte plus claire avec le nom du lieu en italique. Cliquez-la pour ouvrir l’éditeur avec le lieu et le jour déjà renseignés.',
  'help.guide.suggestions.step.2':
    'Cliquez Écarter cette suggestion sur une carte que vous n’utiliserez pas. Elle quitte la chronologie sans être supprimée, et la synchronisation du voyage ne la proposera plus.',
  'help.guide.suggestions.step.3':
    'Changement d’avis ? Paramètres du journal indique combien sont écartées, et Récupérer les suggestions écartées les ramène toutes.',
  'help.guide.suggestions.result':
    'La chronologie ne contient que ce que vous comptez écrire ; l’interrupteur de l’en-tête masque toutes les suggestions d’un coup pendant que vous lisez.',
  'help.guide.suggestions.tip.1': 'Un lieu gardé sur deux jours donne une suggestion sur chacun d’eux.',
  'help.guide.suggestions.tip.2':
    'Les suggestions ne comptent jamais dans les statistiques ; seules les entrées écrites comptent.',
  // add-on-day
  'help.guide.add-on-day.title': 'Ajouter une entrée un jour antérieur',
  'help.guide.add-on-day.goal': 'Écrire sur un jour déjà passé sans corriger la date ensuite.',
  'help.guide.add-on-day.step.1': 'Cliquez le + dans l’en-tête de ce jour.',
  'help.guide.add-on-day.step.2':
    'L’éditeur s’ouvre avec cette date renseignée. Écrivez et Enregistrer comme d’habitude.',
  'help.guide.add-on-day.result': 'L’entrée arrive directement au bon jour.',
  'help.guide.add-on-day.tip.1':
    'Dans une journée, les flèches du menu d’une entrée la déplacent plus tôt ou plus tard.',
  // pros-cons
  'help.guide.pros-cons.title': 'Ajouter un verdict',
  'help.guide.pros-cons.goal': 'Résumer une journée avec ce qui était formidable et ce qui ne l’était pas.',
  'help.guide.pros-cons.step.1':
    'Dans l’éditeur, trouvez Pour et contre sous le récit. Tapez un point dans Pour ou Contre et utilisez Ajouter un autre pour le suivant.',
  'help.guide.pros-cons.step.2': 'Enregistrer. Le verdict apparaît sur la carte sous forme de deux courtes listes.',
  'help.guide.pros-cons.result': 'Pouce levé et pouce baissé en un coup d’œil, sous le récit.',
  'help.guide.pros-cons.tip.1':
    'Un journal qui n’utilise pas les verdicts peut désactiver la section sous Champs de l’entrée dans Paramètres du journal.',
  // search-journey
  'help.guide.search-journey.title': 'Trouver quelque chose dans un long carnet',
  'help.guide.search-journey.goal': 'Atteindre l’entrée voulue sans faire défiler des semaines.',
  'help.guide.search-journey.step.1':
    'Tapez dans Rechercher dans ce carnet dans la barre d’outils. La chronologie se filtre à mesure, sur les titres, les récits, les lieux et les tags. Accents et majuscules n’ont pas d’importance.',
  'help.guide.search-journey.step.2':
    'L’interrupteur des suggestions dans l’en-tête masque les cartes non écrites pendant que vous lisez. Quand la chronologie devient longue, deux boutons ronds flottent au-dessus de son bord inférieur : retour en haut, et saut à la dernière entrée.',
  'help.guide.search-journey.result': 'Seules les entrées correspondantes restent ; videz le champ pour tout revoir.',
  'help.guide.search-journey.tip.1':
    'Un journal en cours s’ouvre sur aujourd’hui, la page du jour est donc généralement déjà visible.',
  'help.guide.search-journey.tip.2':
    'Les tags comptent aussi : chercher pépite cachée trouve chaque entrée qui porte ce tag.',
  // gallery-map
  'help.guide.gallery-map.title': 'Parcourir la galerie et la carte',
  'help.guide.gallery-map.goal': 'Voir tout le journal en images, et en lieux sur la carte.',
  'help.guide.gallery-map.step.1':
    'Passez à Galerie dans la barre d’outils : chaque photo de chaque entrée, plus les images téléversées directement dans la galerie. Cliquez-en une pour la visionneuse.',
  'help.guide.gallery-map.step.2':
    'La carte à droite montre les entrées comme épingles par ordre de date, les lieux des voyages liés et toute trace GPX importée dans ces voyages, dans la couleur qu’elle a dans le planificateur.',
  'help.guide.gallery-map.result':
    'Survolez une trace pour son nom. La ligne en pointillés entre les entrées est tracée par TREK ; une trace est l’itinéraire que vous avez réellement enregistré.',
  'help.guide.gallery-map.tip.1': 'Les traces peuvent être désactivées pour un journal sous Paramètres du journal.',
  'help.guide.gallery-map.tip.2':
    'Les photos de la galerie avec un lieu apparaissent aussi sur la carte publique, quand Galerie et Carte sont toutes deux partagées.',
  // entry-fields
  'help.guide.entry-fields.title': 'Désactiver des champs de l’entrée',
  'help.guide.entry-fields.goal': 'Limiter l’éditeur à ce que ce journal utilise.',
  'help.guide.entry-fields.step.1': 'Ouvrez Paramètres du journal depuis l’en-tête.',
  'help.guide.entry-fields.step.2': 'Sous Champs de l’entrée, désactivez Humeur, Météo ou Pour et contre.',
  'help.guide.entry-fields.result':
    'L’éditeur ne les demande plus. Rien d’écrit n’est perdu : réactiver un champ ramène les valeurs enregistrées, et un journal partagé masque les mêmes champs.',
  'help.guide.entry-fields.tip.1':
    'Les interrupteurs sont propres à chaque journal, un voyage de travail et des vacances peuvent donc différer.',
  // link-trip
  'help.guide.link-trip.title': 'Lier un autre voyage',
  'help.guide.link-trip.goal': 'Amener les lieux d’un second voyage dans le carnet comme suggestions.',
  'help.guide.link-trip.step.1': 'Ouvrez Paramètres du journal depuis l’en-tête.',
  'help.guide.link-trip.step.2': 'Sous les voyages liés, cliquez Ajouter un voyage.',
  'help.guide.link-trip.step.3': 'Choisissez le voyage.',
  'help.guide.link-trip.result':
    'Ses lieux arrivent dans la chronologie comme suggestions à leurs jours, et ses traces GPX rejoignent la carte.',
  'help.guide.link-trip.tip.1': 'Le × à côté d’un voyage lié le délie ; les entrées que vous avez écrites restent.',
  'help.guide.link-trip.tip.2':
    'Les entrées d’un jour ne comptent qu’une fois, quel que soit le nombre de voyages couvrant ce jour.',
  // share-public
  'help.guide.share-public.title': 'Partager le journal publiquement',
  'help.guide.share-public.goal': 'Donner aux personnes sans compte TREK un lien en lecture seule.',
  'help.guide.share-public.step.1': 'Ouvrez Paramètres du journal et trouvez Partage public.',
  'help.guide.share-public.step.2': 'Cliquez Créer un lien de partage.',
  'help.guide.share-public.step.3':
    'Choisissez ce que les visiteurs voient : Chronologie, Galerie et Carte sont des interrupteurs séparés. Copier met le lien dans votre presse-papiers.',
  'help.guide.share-public.result':
    'Quiconque a le lien voit les sections activées et rien d’autre ; les champs désactivés sous Champs de l’entrée y restent masqués aussi.',
  'help.guide.share-public.tip.1':
    'Les photos n’apparaissent sur la carte publique que si Galerie et Carte sont toutes deux activées ; avec Carte désactivée, leurs coordonnées sont retirées avant de quitter le serveur.',
  'help.guide.share-public.tip.2': 'Supprimez le lien au même endroit pour mettre fin au partage.',
  // contributors
  'help.guide.contributors.title': 'Écrire à plusieurs',
  'help.guide.contributors.goal': 'Laisser un compagnon de voyage ajouter ses propres entrées et photos.',
  'help.guide.contributors.step.1': 'Ouvrez Paramètres du journal et descendez jusqu’aux contributeurs.',
  'help.guide.contributors.step.2': 'Cliquez Inviter un contributeur et cherchez l’utilisateur par nom ou e-mail.',
  'help.guide.contributors.step.3': 'Choisissez un rôle et confirmez.',
  'help.guide.contributors.result':
    'Le journal apparaît dans sa liste et ses entrées portent son nom. Retirez un contributeur avec le × à côté de lui.',
  'help.guide.contributors.tip.1':
    'Les contributeurs sont pour les personnes de ce TREK. Pour tous les autres, il y a le lien public.',
  // studio
  'help.guide.studio.title': 'Mettre le journal en page comme un livre photo',
  'help.guide.studio.goal': 'Transformer le carnet en pages imprimables.',
  'help.guide.studio.step.1': 'Cliquez Studio dans l’en-tête. Le concepteur s’ouvre par-dessus le journal.',
  'help.guide.studio.step.2':
    'Le nom du journal à gauche de la barre du haut est le chemin du retour ; il vous ramène là où vous étiez.',
  'help.guide.studio.result':
    'La bande des pages à gauche, la double page sur l’établi, les propriétés à droite. Auto layout construit le livre à partir de vos entrées ; Export produit un PDF prêt à imprimer.',
  'help.guide.studio.tip.1':
    'Studio a besoin d’une fenêtre d’au moins 1024 px de large et n’est pas proposé sur téléphone.',
  'help.guide.studio.tip.2':
    'Le livre hérite de l’accès du journal : qui peut lire le journal peut l’ouvrir, qui peut le modifier peut enregistrer.',
  // archive-journey
  'help.guide.archive-journey.title': 'Archiver ou supprimer un journal',
  'help.guide.archive-journey.goal': 'Clore un journal terminé, ou en retirer un pour de bon.',
  'help.guide.archive-journey.step.1': 'Ouvrez Paramètres du journal.',
  'help.guide.archive-journey.step.2':
    'Tout en bas, Archiver le journal le termine et le marque archivé ; Restaurer le journal le ramène. Supprimer le retire avec toutes ses entrées et photos, après une confirmation.',
  'help.guide.archive-journey.result':
    'Un journal archivé reste lisible et partageable ; il ne s’ouvre simplement plus sur aujourd’hui.',
  'help.guide.archive-journey.tip.1':
    'La suppression est irréversible, et elle ne touche pas aux voyages auxquels le journal était lié.',
  'help.guide.archive-journey.tip.2':
    'La couverture, le nom et le sous-titre se trouvent dans le même dialogue, en haut.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio met en page un journal de voyage sous forme de livre photo imprimable. Il s’ouvre par-dessus le journal : la liste des pages et le contenu à gauche, la double page sur laquelle vous travaillez au milieu, ses propriétés à droite. Auto layout construit un premier brouillon à partir de vos entrées ; tout ce qui suit vous appartient, à déplacer, recadrer et restyler, avec une annulation pour chaque étape.',
  'help.ctx.journey-studio.bullet.1':
    'Barre du haut : Back to the journey, Book view, Undo et Redo, Page format, Auto layout et Export. La marque Enregistré à côté du titre vous dit quand le livre est sauvegardé.',
  'help.ctx.journey-studio.bullet.2':
    'Colonne de gauche en cinq sections : Pages, Content (les photos et les entrées du journal), Elements (texte, formes, lignes, grilles, cadres, icônes), Voyage (cartes, pays, drapeaux et repères construits à partir du journal) et Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Plan de travail : la double page en cours avec son fond perdu et sa marge de sécurité, la barre de zoom en dessous, Fit to view, et Télécharger cette double page à droite.',
  'help.ctx.journey-studio.bullet.4':
    'Properties à droite : position et taille, recadrage et point focal, remplissage ou ajustement, look, coins, cadre, ordre d’empilement et verrouillage de ce qui est sélectionné ; numéros de page et document quand rien ne l’est.',
  'help.ctx.journey-studio.bullet.5':
    'Le livre a la forme d’un livre relié : couverture, une première page seule, les doubles pages, une dernière page seule et la quatrième de couverture. Les numéros de page comptent à partir de la première page et s’impriment tels qu’affichés.',
  'help.ctx.journey-studio.bullet.6':
    'Plusieurs personnes peuvent concevoir en même temps : chacun voit les pointeurs des autres avec leur nom, et un enregistrement sur une version que quelqu’un d’autre a modifiée revient comme un conflit au lieu d’écraser son travail.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Construire le livre automatiquement',
  'help.guide.studio-auto-layout.goal':
    'Obtenez en un clic un premier brouillon complet à partir des entrées et des photos du journal.',
  'help.guide.studio-auto-layout.step.1': 'Cliquez sur Auto layout dans la barre du haut.',
  'help.guide.studio-auto-layout.step.2':
    'Choisissez Tout le livre : cela remplace chaque page en conservant votre titre et la configuration de page. Cette page ne reconstruit que celle à l’écran, et n’est proposée que sur une double page issue d’une entrée.',
  'help.guide.studio-auto-layout.step.3':
    'Parcourez la liste des pages. Undo reprend toute la mise en page si vous préfériez ce que vous aviez.',
  'help.guide.studio-auto-layout.result':
    'Une double page par entrée, dans l’ordre, avec ses photos, son titre et son récit placés pour vous. Chaque élément continue de suivre son entrée jusqu’à ce que vous le modifiiez.',
  'help.guide.studio-auto-layout.tip.1':
    'Les deux options sont des étapes d’annulation ordinaires, essayez-les librement.',
  'help.guide.studio-auto-layout.tip.2':
    'Un élément qu’Auto layout a lié à une entrée suit les modifications de cette entrée jusqu’à ce que vous y touchiez dans Properties ; cela rompt le lien.',
  // studio-pages
  'help.guide.studio-pages.title': 'Ajouter, déplacer et retirer des doubles pages',
  'help.guide.studio-pages.goal': 'Façonnez le livre page par page.',
  'help.guide.studio-pages.step.1':
    'Ouvrez Pages dans la colonne. Les vignettes sont le livre dans l’ordre : couverture, première page, doubles pages, dernière page, quatrième de couverture.',
  'help.guide.studio-pages.step.2':
    'Ajouter une page en bas en place une nouvelle avant la dernière page ; le + entre deux vignettes en insère une juste là.',
  'help.guide.studio-pages.step.3':
    'Survolez une vignette pour ses actions : Déplacer avant, Déplacer après, Dupliquer la page et Supprimer la page. Cliquez sur une vignette pour ouvrir cette double page sur le plan de travail.',
  'help.guide.studio-pages.result':
    'La couverture, la première et la dernière page et la quatrième de couverture restent où elles sont ; les nouvelles doubles pages atterrissent toujours entre elles.',
  'help.guide.studio-pages.tip.1':
    'Book view dans la barre du haut montre tout le livre en feuilles, tel qu’il sera relié.',
  'help.guide.studio-pages.tip.2':
    'Les numéros de page s’activent sous Document dans Properties, sans rien de sélectionné.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Appliquer une mise en page à une double page',
  'help.guide.studio-layouts.goal': 'Donnez à une double page un agencement tout prêt de cadres photo et texte.',
  'help.guide.studio-layouts.step.1':
    'Ouvrez Layouts dans la colonne. Treize mises en page de double page, et un jeu à part pour la couverture, le dos et les pages seules.',
  'help.guide.studio-layouts.step.2':
    'Cliquez sur l’une d’elles. La double page sur le plan de travail prend ses cadres ; les photos et le texte que vous aviez déjà y sont versés.',
  'help.guide.studio-layouts.result':
    'Les cadres vides attendent du contenu : glissez une photo depuis Content sur l’un d’eux, ou utilisez Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Une mise en page est une étape d’annulation comme une autre.',
  // studio-content
  'help.guide.studio-content.title': 'Mettre des photos et des entrées sur une page',
  'help.guide.studio-content.goal': 'Amenez le matériel propre du journal sur la double page.',
  'help.guide.studio-content.step.1':
    'Ouvrez Content dans la colonne. Photos liste chaque image du journal ; Entries liste les entrées avec leur texte.',
  'help.guide.studio-content.step.2':
    'Glissez une photo sur la double page, ou sur un cadre vide, ou cliquez sur Add to this page en dessous. Téléverser des photos ajoute des images qui ne sont pas encore dans le journal.',
  'help.guide.studio-content.step.3':
    'Sous une entrée, Title, Story et Place posent ce texte sur la page comme élément texte ; Date et les coordonnées arrivent comme repères, et les photos de l’entrée sont listées juste là.',
  'help.guide.studio-content.result':
    'Une photo déposée devient un élément photo ; le texte continue de suivre l’entrée jusqu’à ce que vous le modifiiez.',
  'help.guide.studio-content.tip.1': 'Le champ de recherche en haut de Content filtre les deux listes.',
  'help.guide.studio-content.tip.2':
    'Déposer un fichier depuis votre bureau sur le plan de travail le téléverse et le place en une fois.',
  // studio-elements
  'help.guide.studio-elements.title': 'Ajouter du texte, des formes et des icônes',
  'help.guide.studio-elements.goal': 'Décorez une double page au-delà des photos et des récits.',
  'help.guide.studio-elements.step.1': 'Ouvrez Elements dans la colonne.',
  'help.guide.studio-elements.step.2':
    'Cliquez sur un style de texte pour un titre ou une légende, une forme, une ligne, une grille, un cadre vide avec un style de cadre, ou une icône de la bibliothèque consultable. Chacun atterrit au milieu de la double page, prêt à être déplacé.',
  'help.guide.studio-elements.result':
    'Double-cliquez sur un élément texte pour y écrire ; Properties contient police, graisse, taille, espacement et alignement.',
  'help.guide.studio-elements.tip.1': 'Les cadres sont des emplacements photo vides : déposez-y une image plus tard.',
  // studio-travel
  'help.guide.studio-travel.title': 'Ajouter une carte, des drapeaux et des chiffres',
  'help.guide.studio-travel.goal': 'Transformez le voyage lui-même en chiffres sur la page.',
  'help.guide.studio-travel.step.1': 'Ouvrez Voyage dans la colonne.',
  'help.guide.studio-travel.step.2':
    'Choisissez quoi ajouter : une carte de l’itinéraire des entrées, des contours de pays, une liste ou une grille des pays, des drapeaux, un repère de date, de jour ou de distance, ou un résumé de tout le voyage. Chacun est construit à partir des données du journal et se rafraîchit avec elles.',
  'help.guide.studio-travel.result':
    'L’élément apparaît sur la double page ; Properties règle son style, et pour la carte sa zone.',
  'help.guide.studio-travel.tip.1':
    'Les repères suivent l’entrée dont la double page est issue, donc un repère de date sur une double page mise en page automatiquement montre déjà ce jour-là.',
  // studio-properties
  'help.guide.studio-properties.title': 'Modifier ce que vous avez sélectionné',
  'help.guide.studio-properties.goal': 'Déplacez, recadrez, stylisez et empilez un élément avec l’inspecteur.',
  'help.guide.studio-properties.step.1':
    'Cliquez sur un élément de la double page. Des poignées apparaissent pour la taille et la rotation ; faites-le glisser pour le déplacer.',
  'help.guide.studio-properties.step.2':
    'Properties à droite suit la sélection : position et taille, Crop avec le point focal qui décide de ce qui reste dans le cadre, Fill ou Fit, les filtres Look, le rayon Corner, le style Cadre, l’ordre d’empilement et Lock.',
  'help.guide.studio-properties.step.3':
    'Dupliquer et Delete sont en haut de l’inspecteur ; Undo dans la barre du haut annule tout cela.',
  'help.guide.studio-properties.result':
    'Un élément verrouillé ne peut plus être saisi sur la page, ce qui protège une mise en page terminée pendant que vous travaillez autour.',
  'help.guide.studio-properties.tip.1':
    'Maj-clic sélectionne plusieurs éléments ; l’inspecteur les modifie alors ensemble.',
  'help.guide.studio-properties.tip.2':
    'Modifier un élément placé par Auto layout rompt son lien avec l’entrée ; il cesse de suivre les changements ultérieurs de cette entrée.',
  // studio-format
  'help.guide.studio-format.title': 'Choisir le format de page',
  'help.guide.studio-format.goal':
    'Fixez la taille à laquelle le livre sera imprimé, avant que la mise en page n’en dépende.',
  'help.guide.studio-format.step.1': 'Cliquez sur Page format dans la barre du haut.',
  'help.guide.studio-format.step.2':
    'Choisissez Square 21 × 21 cm, Square 30 × 30 cm, A4 ou A5 landscape ou portrait, ou saisissez une largeur et une hauteur libres en millimètres. Fond perdu et Sécurité sont juste en dessous.',
  'help.guide.studio-format.result':
    'Chaque double page est dessinée à cette taille, avec 3 mm de fond perdu et 5 mm de marge de sécurité par défaut.',
  'help.guide.studio-format.tip.1':
    'Changez d’abord le format, puis lancez Auto layout ; la mise en page est construite pour la taille qu’elle trouve.',
  'help.guide.studio-format.tip.2':
    'Demandez à votre imprimeur ses valeurs de fond perdu et de sécurité, et saisissez-les.',
  // studio-export
  'help.guide.studio-export.title': 'Exporter le livre en PDF',
  'help.guide.studio-export.goal': 'Obtenez un fichier prêt à imprimer, ou un fichier à lire à l’écran.',
  'help.guide.studio-export.step.1': 'Cliquez sur Export dans la barre du haut.',
  'help.guide.studio-export.step.2':
    'Choisissez Pages simples, une page par feuille dans l’ordre de lecture, ce que veut un imprimeur, ou Doubles pages, deux pages à la fois comme le livre s’ouvre. Traits de coupe ajoute le fond perdu sur chaque bord et marque où couper.',
  'help.guide.studio-export.step.3':
    'Cliquez sur Aperçu avant impression. Votre navigateur ouvre les pages et Enregistrer en PDF en fait le fichier.',
  'help.guide.studio-export.result':
    'Un PDF avec autant de feuilles que le dialogue l’a annoncé, au format de page que vous avez défini.',
  'help.guide.studio-export.tip.1': 'Créer le PDF n’est possible que sur ordinateur, comme Studio lui-même.',
  'help.guide.studio-export.tip.2':
    'Pour une épreuve, exportez Doubles pages sans traits de coupe ; pour l’imprimerie, Pages simples avec.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Réutiliser une double page dans un autre livre',
  'help.guide.studio-spread-file.goal': 'Emportez un design qui vous plaît du livre d’un journal vers un autre.',
  'help.guide.studio-spread-file.step.1':
    'Avec la double page sur le plan de travail, cliquez sur Télécharger cette double page à l’extrémité droite de la barre de zoom. Le fichier contient le design, pas les photographies.',
  'help.guide.studio-spread-file.step.2':
    'Dans l’autre livre, ouvrez Pages et cliquez sur Importer à côté d’Ajouter une page, puis choisissez le fichier.',
  'help.guide.studio-spread-file.result':
    'La double page arrive avec ses cadres et ses styles de texte ; déposez les photos du nouveau journal dans les cadres.',
  'help.guide.studio-spread-file.tip.1': 'Un fichier qui n’est pas un design de double page est refusé avec un motif.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Paramètres',
  'help.ctx.settings.summary':
    'Vos réglages personnels, un onglet par sujet dans la barre latérale à gauche. La plupart des interrupteurs s’appliquent dès que vous les basculez ; un formulaire avec un bouton Enregistrer en bas l’attend. Rien ici ne change le TREK de quelqu’un d’autre.',
  'help.ctx.settings.bullet.1':
    'Barre latérale à gauche : Affichage, Appearance, Carte, Notifications, Intégrations, Offline et Compte. Modules apparaît dès qu’un module est installé, À propos partout où l’admin ne l’a pas retiré.',
  'help.ctx.settings.bullet.2':
    'Affichage, c’est la langue, les unités, la devise et ce sur quoi l’application s’ouvre ; Appearance, c’est le thème, les couleurs, la taille du texte et les widgets du tableau de bord.',
  'help.ctx.settings.bullet.3':
    'Carte choisit le moteur de rendu et son style ; Notifications les canaux qui vous joignent ; Intégrations les photothèques, les clés API et MCP ; Offline ce que l’application garde sur cet appareil.',
  'help.ctx.settings.bullet.4':
    'Compte contient votre profil, votre mot de passe, l’authentification à deux facteurs, les passkeys et la suppression de votre compte.',
  'help.ctx.settings-display.title': 'Affichage',
  'help.ctx.settings-display.summary':
    'Langue, unités et devise, le comportement de la carte et des réservations, et ce sur quoi TREK s’ouvre. Chaque changement ici s’applique aussitôt.',
  'help.ctx.settings-display.bullet.1':
    'Language & region : la langue de l’interface, le format de l’heure, le premier jour de la semaine, la devise d’affichage, et les unités de distance et de température.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map : les itinéraires de réservation toujours sur la carte, la pastille Explorer les lieux, l’optimisation de l’itinéraire depuis votre hébergement, les codes de réservation masqués et les itinéraires de réservation étiquetés.',
  'help.ctx.settings-display.bullet.3':
    'Démarrage : si TREK s’ouvre sur le tableau de bord ou sur le voyage en cours, et quel onglet d’un voyage vient en premier.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'L’apparence de TREK sur ce compte : clair ou sombre, la couleur d’accent, le verre et le mouvement, la taille du texte, et les widgets que le tableau de bord affiche. Tout s’applique en direct, sur chaque appareil où vous vous connectez.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme : Clair, Sombre ou Auto, et le Color scheme avec un Custom accent à vous.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability : Transparency, Reduce motion, Density et Text size, avec des tailles avancées par niveau.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets : un interrupteur par widget, séparément pour Desktop et Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults, en bas, remet tout en place.',
  'help.ctx.settings-map.title': 'Carte',
  'help.ctx.settings-map.summary':
    'Quel moteur dessine les cartes et dans quel style. Leaflet est la carte raster classique, MapLibre dessine des tuiles vectorielles sans aucun jeton, Mapbox ajoute bâtiments 3D et relief avec votre propre jeton.',
  'help.ctx.settings-map.bullet.1':
    'Fournisseur de carte : Leaflet, MapLibre ou Mapbox, chacun avec une ligne sur ce qu’il lui faut.',
  'help.ctx.settings-map.bullet.2':
    'Style de carte et Modèle de carte : l’aspect des tuiles, plus le jeton ou la clé qu’un fournisseur demande.',
  'help.ctx.settings-map.bullet.3':
    'Mode haute qualité pour l’anticrénelage et la projection en globe ; Enregistrer la carte écrit le choix.',
  'help.ctx.settings-notifications.title': 'Notifications',
  'help.ctx.settings-notifications.summary':
    'Où TREK vous joint en dehors de l’application : des notifications push sur cet appareil, un sujet ntfy, un webhook ou un canal fourni par un module. Sous les canaux, une ligne par événement décide de ce qui va où.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy : le sujet, un serveur à vous en option et un jeton d’accès en option, avec Tester pour en envoyer un tout de suite.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook : une URL qui reçoit chaque événement en JSON, avec Tester.',
  'help.ctx.settings-notifications.bullet.3':
    'Notifications push sur cet appareil : Activer sur cet appareil ne concerne que le navigateur que vous utilisez, alors répétez-le sur chaque téléphone ou ordinateur. Envoyer un test les atteint tous.',
  'help.ctx.settings-notifications.bullet.4':
    'Les lignes de préférences : par événement, quel canal est actif. Les canaux de modules affichent Configurer tant qu’ils ne sont pas configurés.',
  'help.ctx.settings-integrations.title': 'Intégrations',
  'help.ctx.settings-integrations.summary':
    'Tout ce qui se connecte à TREK de l’extérieur : les photothèques pour le journal, les clés API pour les scripts, et le point de terminaison MCP avec ses tokens et ses clients OAuth pour les assistants IA.',
  'help.ctx.settings-integrations.bullet.1':
    'Fournisseurs de photos : Immich et Synology Photos, chacun avec son URL et sa clé, Tester la connexion et Enregistrer.',
  'help.ctx.settings-integrations.bullet.2':
    'Clés API : des clés personnelles pour les scripts et autres outils qui appellent l’API TREK en votre nom.',
  'help.ctx.settings-integrations.bullet.3':
    'Configuration MCP : le point de terminaison, une configuration de client prête à copier, et les tokens API.',
  'help.ctx.settings-integrations.bullet.4':
    'Clients OAuth 2.1 : les applications qui se connectent via TREK, avec URIs de redirection, portées autorisées, clients machine et sessions actives.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Ce que TREK garde sur cet appareil pour qu’un voyage s’ouvre encore sans connexion, et ce qui se passe quand un changement fait hors ligne entre en collision avec un autre fait ailleurs.',
  'help.ctx.settings-offline.bullet.1':
    'Mode hors ligne : Forcer le mode hors ligne fait se comporter l’application comme si le réseau avait disparu, pour tester ou sur une connexion facturée au volume.',
  'help.ctx.settings-offline.bullet.2':
    'Préparer le mode hors ligne : Télécharger pour une utilisation hors ligne récupère vos voyages et leurs tuiles de carte maintenant.',
  'help.ctx.settings-offline.bullet.3':
    'Que stocker hors ligne : les tuiles de carte, actives ou non, et un interrupteur par voyage.',
  'help.ctx.settings-offline.bullet.4':
    'Conflits de synchronisation et Cache hors ligne : la stratégie en cas de collision, le nombre de changements en attente et en échec, Resynchroniser maintenant et Vider le cache.',
  'help.ctx.settings-account.title': 'Compte',
  'help.ctx.settings-account.summary':
    'Qui vous êtes sur ce TREK et comment vous vous connectez : profil et avatar, mot de passe, authentification à deux facteurs, passkeys, et tout en bas la suppression du compte.',
  'help.ctx.settings-account.bullet.1':
    'Profil : nom d’utilisateur, e-mail et avatar, enregistrés avec Enregistrer le profil.',
  'help.ctx.settings-account.bullet.2':
    'Changer le mot de passe : mot de passe actuel, nouveau mot de passe deux fois, Mettre à jour le mot de passe.',
  'help.ctx.settings-account.bullet.3':
    'Authentification à deux facteurs (2FA) avec une application d’authentification et des codes de secours ; Passkeys pour se connecter sans mot de passe.',
  'help.ctx.settings-account.bullet.4':
    'Supprimer le compte, en bas, derrière une confirmation. Le dernier admin ne peut pas se supprimer lui-même.',
  // language-region
  'help.guide.language-region.title': 'Régler la langue, les unités et la devise',
  'help.guide.language-region.goal': 'Faites parler TREK dans votre langue et compter comme vous.',
  'help.guide.language-region.step.1':
    'Choisissez la langue de l’interface dans Language & region. TREK change aussitôt, sur chaque appareil où vous vous connectez.',
  'help.guide.language-region.step.2':
    'En dessous, choisissez le format de l’heure, le jour par lequel commence la semaine dans tous les sélecteurs de date, la devise d’affichage, et les unités de distance et de température.',
  'help.guide.language-region.result':
    'Dates, distances et montants se lisent comme vous l’attendez ; la devise propre à un voyage reste affichée à côté des montants convertis.',
  'help.guide.language-region.tip.1':
    'La devise d’affichage sert aux totaux entre voyages ; chaque voyage garde la devise que vous lui avez donnée.',
  'help.guide.language-region.tip.2': 'La langue fixe aussi les noms des jours et des mois dans Vacay et le journal.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Régler le comportement de la carte et des réservations',
  'help.guide.travel-map-prefs.goal': 'Décidez ce que la carte du voyage affiche par défaut.',
  'help.guide.travel-map-prefs.step.1':
    "Dans Travel & map, Toujours afficher les itinéraires de réservation garde vols et trains sur la carte même quand leur jour n’est pas ouvert ; Explorer les lieux sur la carte affiche la pastille pour trouver des lieux ; Optimiser l'itinéraire depuis l'hébergement fait partir l’itinéraire de là où vous dormez.",
  'help.guide.travel-map-prefs.step.2':
    'Masquer les codes de réservation cache les numéros de confirmation jusqu’au survol ; Étiquettes des itinéraires écrit le nom de la réservation le long de son itinéraire.',
  'help.guide.travel-map-prefs.result':
    'La carte du voyage suit ces réglages sur chaque voyage, jusqu’à ce que vous les rebasculiez.',
  'help.guide.travel-map-prefs.tip.1':
    'Ces réglages sont par compte, pas par voyage. Les membres d’un voyage partagé voient chacun leurs propres choix.',
  // startup
  'help.guide.startup.title': 'Choisir ce sur quoi TREK s’ouvre',
  'help.guide.startup.goal': 'Arrivez là où vous travaillez le plus, pas sur le tableau de bord à chaque fois.',
  'help.guide.startup.step.1': 'Sous Démarrage, réglez Page de démarrage sur Tableau de bord ou Voyage en cours.',
  'help.guide.startup.step.2':
    'Onglet de démarrage choisit quel onglet d’un voyage vient en premier quand vous en ouvrez un.',
  'help.guide.startup.result': 'La prochaine connexion et le prochain appui sur le logo y mènent directement.',
  'help.guide.startup.tip.1':
    'Voyage en cours désigne le voyage en route aujourd’hui, ou le prochain s’il n’y en a aucun.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Régler le thème et la couleur d’accent',
  'help.guide.theme-scheme.goal':
    'Rendez TREK clair, sombre ou fidèle à votre appareil, dans la couleur qui vous plaît.',
  'help.guide.theme-scheme.step.1': 'Sous Theme, choisissez Clair, Sombre ou Auto. Auto suit votre appareil.',
  'help.guide.theme-scheme.step.2':
    'Choisissez un Color scheme : Default, High contrast, Indigo, Teal, Rose, Amber, Violet ou Custom.',
  'help.guide.theme-scheme.step.3':
    'Avec Custom, choisissez un accent parmi les préréglages ou saisissez le vôtre. Un contrôle de contraste à côté dit si le texte reste lisible dessus.',
  'help.guide.theme-scheme.result':
    'Boutons, liens et surlignages prennent l’accent partout, sur chaque appareil où vous vous connectez.',
  'help.guide.theme-scheme.tip.1':
    'La barre du haut a aussi un interrupteur rapide clair ou sombre ; il règle le même thème.',
  'help.guide.theme-scheme.tip.2': 'High contrast est le schéma à choisir quand le défaut paraît trop doux.',
  // readability
  'help.guide.readability.title': 'Ajuster la lisibilité et la taille du texte',
  'help.guide.readability.goal': 'Moins de verre, moins de mouvement, plus d’espace ou des caractères plus grands.',
  'help.guide.readability.step.1':
    'Sous Readability, Transparency passe les panneaux de verre en surfaces opaques, Reduce motion réduit les animations au minimum, et Density choisit Comfortable ou Compact.',
  'help.guide.readability.step.2':
    'Text size met Everything à l’échelle d’un coup ; Advanced text sizes laisse titres, sous-titres, corps et légendes différer.',
  'help.guide.readability.result':
    'Toute l’application suit aussitôt, y compris les panneaux de la carte et le journal.',
  'help.guide.readability.tip.1': 'Reduce motion suit aussi le réglage de votre système quand vous n’y touchez pas.',
  'help.guide.readability.tip.2':
    'La taille du texte passe par les niveaux typographiques, donc rien n’est coupé ; une taille qui ne tient plus passe à la ligne.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Choisir les widgets du tableau de bord',
  'help.guide.dashboard-widgets.goal':
    'N’affichez que les widgets que vous utilisez, séparément sur l’ordinateur et sur le téléphone.',
  'help.guide.dashboard-widgets.step.1':
    'Sous Dashboard widgets, activez ou désactivez chaque widget pour Desktop et pour Mobile : la barre latérale droite dans son ensemble, la devise, les collections, les fuseaux horaires, les réservations à venir, les pays de l’Atlas et les chiffres de voyage.',
  'help.guide.dashboard-widgets.step.2': 'Reset to defaults, en bas, ramène tout l’onglet à son état de livraison.',
  'help.guide.dashboard-widgets.result':
    'Le tableau de bord se réorganise aussitôt ; sans la barre latérale droite, il se centre.',
  'help.guide.dashboard-widgets.tip.1':
    'Les widgets d’un module n’apparaissent que tant que l’admin a ce module activé.',
  'help.guide.dashboard-widgets.tip.2':
    'Le tableau de bord lui-même retient votre vue en grille ou en liste et l’ordre de tri par appareil.',
  // map-provider
  'help.guide.map-provider.title': 'Choisir le moteur et le style de carte',
  'help.guide.map-provider.goal': 'Passez de la carte classique aux tuiles vectorielles ou à la carte 3D de Mapbox.',
  'help.guide.map-provider.step.1':
    'Sous Fournisseur de carte, choisissez Leaflet pour la carte 2D classique avec n’importe quelles tuiles raster, MapLibre pour les tuiles vectorielles OpenFreeMap sans jeton, ou Mapbox pour des tuiles vectorielles avec bâtiments 3D et relief.',
  'help.guide.map-provider.step.2':
    "Choisissez un Style de carte ou un Modèle de carte pour l’aspect. Mapbox demande un Jeton d'accès Mapbox, certains styles raster une Clé d'API CARTO ; le lien à côté du champ mène là où en obtenir.",
  'help.guide.map-provider.step.3':
    'Mode haute qualité ajoute l’anticrénelage et la projection en globe. Cliquez sur Enregistrer la carte.',
  'help.guide.map-provider.result':
    'Chaque carte de TREK, voyages, Atlas, Collections et journal, est dessinée par le moteur que vous avez choisi.',
  'help.guide.map-provider.tip.1':
    'Sans jeton, Mapbox se rabat sur la carte par défaut plutôt que de ne rien afficher.',
  'help.guide.map-provider.tip.2':
    'Les tuiles de carte que vous stockez hors ligne viennent du fournisseur actif au moment du téléchargement.',
  // notification-channels
  'help.guide.notification-channels.title': 'Régler où les notifications vous joignent',
  'help.guide.notification-channels.goal':
    'Recevez les rappels de voyage et les événements de collaboration sur votre téléphone ou dans un autre outil.',
  'help.guide.notification-channels.step.1':
    "Sous Notifications, renseignez un Sujet Ntfy ; ajoutez votre propre URL du serveur Ntfy (optionnel) et un Jeton d'accès (optionnel) si vous en faites tourner un. Tester envoie un message tout de suite.",
  'help.guide.notification-channels.step.2':
    'Ou donnez une URL du webhook qui reçoit chaque événement en JSON, et testez-la de la même façon avec Tester.',
  'help.guide.notification-channels.step.3':
    'Dans les lignes en dessous, activez ou désactivez chaque événement par canal. Un canal de module affiche Configurer tant qu’il n’est pas configuré dans les paramètres du module ; Envoyer un test en essaie un.',
  'help.guide.notification-channels.result':
    'Les événements partent par les canaux actifs. La cloche de la barre du haut continue de les afficher dans l’application quoi qu’il arrive.',
  'help.guide.notification-channels.tip.1':
    'Les préférences par voyage vivent sur le voyage lui-même, dans ses paramètres de notification.',
  'help.guide.notification-channels.tip.2':
    'L’admin peut préremplir un serveur ntfy par défaut pour tout le monde ; vous choisissez quand même votre propre sujet.',
  // photo-providers
  'help.guide.photo-providers.title': 'Connecter une photothèque',
  'help.guide.photo-providers.goal': 'Laissez le journal tirer les photos du jour depuis Immich ou Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Sous Intégrations, trouvez la section du fournisseur et saisissez son URL et sa clé API. Immich propose aussi de renvoyer les envois du journal dans la photothèque.',
  'help.guide.photo-providers.step.2': 'Cliquez sur Tester la connexion, puis sur Enregistrer.',
  'help.guide.photo-providers.result':
    'L’onglet External photos de l’éditeur d’entrée cherche dans la photothèque connectée le jour de l’entrée, les plus proches du lieu de l’entrée en premier.',
  'help.guide.photo-providers.tip.1':
    'La connexion est à vous : les autres membres d’un journal connectent leurs propres photothèques.',
  'help.guide.photo-providers.tip.2':
    'Un fournisseur sans données GPS dans ses photos fonctionne quand même ; la liste est alors dans l’ordre chronologique.',
  // api-keys
  'help.guide.api-keys.title': 'Créer une clé API',
  'help.guide.api-keys.goal': 'Laissez un script ou un autre outil appeler l’API TREK en votre nom.',
  'help.guide.api-keys.step.1':
    'Sous Clés API, cliquez sur Créer une clé et donnez-lui un nom qui dit où elle sera utilisée.',
  'help.guide.api-keys.step.2':
    'Copiez la clé depuis la boîte de dialogue : elle n’est affichée qu’une fois. Supprimez une clé de la liste quand l’outil n’en a plus besoin.',
  'help.guide.api-keys.result':
    'Les requêtes avec cette clé agissent avec vos permissions ; la liste montre quand chaque clé a été créée et utilisée pour la dernière fois.',
  'help.guide.api-keys.tip.1': 'Une clé par outil rend la révocation indolore.',
  'help.guide.api-keys.tip.2':
    'Pour un assistant IA, utilisez plutôt MCP avec OAuth ; les clés API sont pour les clients HTTP simples.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Connecter un assistant IA via MCP',
  'help.guide.mcp-oauth.goal': 'Donnez à Claude, à un IDE ou à un autre client MCP l’accès à vos voyages.',
  'help.guide.mcp-oauth.step.1':
    'Sous Configuration MCP, copiez le Point de terminaison MCP, ou toute la Configuration du client pour un client qui prend un extrait JSON.',
  'help.guide.mcp-oauth.step.2':
    'Les clients qui se connectent via le navigateur utilisent OAuth 2.1 : Nouveau client sous Clients OAuth 2.1, avec ses URIs de redirection, les Portées autorisées et, pour un serveur sans navigateur, Client machine.',
  'help.guide.mcp-oauth.step.3':
    'Renouveler le secret et Supprimer le client sont sur chaque client ; Sessions OAuth actives liste ce qui est connecté et vous laisse le révoquer. Tokens API avec Créer un token est l’ancienne voie d’entrée.',
  'help.guide.mcp-oauth.result':
    'Le client peut lire et modifier ce que ses portées permettent, en votre nom, et chaque action apparaît sous votre nom.',
  'help.guide.mcp-oauth.tip.1':
    'Les portées sont le filet de sécurité : ne donnez à un client que la portée de lecture tant qu’il n’a pas besoin de plus.',
  'help.guide.mcp-oauth.tip.2': 'L’admin peut désactiver MCP pour toute l’instance ; cette section n’est alors pas là.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Emporter des voyages hors ligne',
  'help.guide.offline-prepare.goal':
    'Ayez vos voyages et leurs cartes sur cet appareil avant que la connexion ne tombe.',
  'help.guide.offline-prepare.step.1':
    'Sous Que stocker hors ligne, laissez Stocker les tuiles de carte hors ligne actif et activez les voyages que vous voulez sur cet appareil.',
  'help.guide.offline-prepare.step.2':
    'Cliquez sur Télécharger pour une utilisation hors ligne sous Préparer le mode hors ligne. Cela récupère les voyages et les tuiles autour de leurs lieux.',
  'help.guide.offline-prepare.step.3':
    'Forcer le mode hors ligne sous Mode hors ligne vous laisse vérifier que tout est là avant de partir.',
  'help.guide.offline-prepare.result':
    'Les voyages s’ouvrent sans connexion ; les changements que vous faites attendent dans une file et partent à la reconnexion.',
  'help.guide.offline-prepare.tip.1':
    'Les tuiles prennent le plus de place : la section Cache hors ligne montre ce qui est stocké, par voyage.',
  'help.guide.offline-prepare.tip.2':
    'Installez TREK comme application depuis le navigateur pour le démarrage hors ligne le plus fluide.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Décider qui gagne en cas de conflit de synchronisation',
  'help.guide.offline-conflicts.goal':
    'Choisissez comment TREK tranche entre un changement fait hors ligne et un autre fait ailleurs.',
  'help.guide.offline-conflicts.step.1':
    'Sous Conflits de synchronisation, choisissez Me demander à chaque fois, Toujours conserver ma version ou Toujours conserver la version du serveur.',
  'help.guide.offline-conflicts.step.2':
    'Cache hors ligne montre les voyages, les changements en attente et en échec et les conflits ; Resynchroniser maintenant pousse la file, Vider le cache vide l’appareil.',
  'help.guide.offline-conflicts.result':
    'Avec Me demander, un conflit montre les deux versions et vous laisse choisir ; avec les deux autres, il est tranché en silence.',
  'help.guide.offline-conflicts.tip.1':
    'Vider le cache ne retire que la copie sur cet appareil ; rien n’est touché sur le serveur.',
  // profile
  'help.guide.profile.title': 'Modifier votre profil',
  'help.guide.profile.goal': 'Mettez à jour votre nom, votre e-mail et votre photo.',
  'help.guide.profile.step.1':
    "Sous Compte, modifiez Nom d'utilisateur et E-mail. L’avatar accepte un envoi à vous ; retirez-le pour revenir aux initiales.",
  'help.guide.profile.step.2': 'Cliquez sur Enregistrer le profil.',
  'help.guide.profile.result':
    'Votre nom et votre photo se mettent à jour partout d’un coup, y compris sur les voyages que vous partagez.',
  'help.guide.profile.tip.1': 'Un compte qui se connecte via OIDC l’indique ici ; l’e-mail vient alors du fournisseur.',
  // password
  'help.guide.password.title': 'Changer votre mot de passe',
  'help.guide.password.goal': 'Définissez un nouveau mot de passe.',
  'help.guide.password.step.1':
    'Sous Changer le mot de passe, saisissez votre mot de passe actuel, puis le nouveau deux fois.',
  'help.guide.password.step.2': 'Cliquez sur Mettre à jour le mot de passe.',
  'help.guide.password.result':
    'Le nouveau mot de passe vaut dès la prochaine connexion ; les autres sessions restent connectées.',
  'help.guide.password.tip.1': 'Un compte qui se connecte via OIDC n’a pas de mot de passe TREK à changer.',
  // mfa
  'help.guide.mfa.title': 'Activer l’authentification à deux facteurs',
  'help.guide.mfa.goal': 'Protégez le compte avec un code d’une application d’authentification.',
  'help.guide.mfa.step.1': "Sous Authentification à deux facteurs (2FA), cliquez sur Configurer l'authentificateur.",
  'help.guide.mfa.step.2':
    'Scannez le code QR avec votre application, ou saisissez le secret à la main, puis tapez le code à six chiffres qu’elle affiche et cliquez sur Activer 2FA.',
  'help.guide.mfa.step.3':
    'Conservez les codes de secours : copiez-les, téléchargez-les ou imprimez-les. Chacun sert une fois, quand vous n’avez pas de téléphone sous la main.',
  'help.guide.mfa.result': 'Chaque connexion demande un code après le mot de passe.',
  'help.guide.mfa.tip.1': 'Désactiver 2FA demande votre mot de passe et un code en cours.',
  'help.guide.mfa.tip.2': 'L’admin peut imposer la 2FA à tout le monde ; elle ne peut alors pas être désactivée ici.',
  // passkeys
  'help.guide.passkeys.title': 'Se connecter avec une passkey',
  'help.guide.passkeys.goal':
    'Utilisez l’empreinte, le visage ou le code PIN de votre appareil au lieu d’un mot de passe.',
  'help.guide.passkeys.step.1':
    'Sous Passkeys, cliquez sur Ajouter une passkey et confirmez avec votre appareil. Donnez-lui un nom qui dit de quel appareil il s’agit.',
  'help.guide.passkeys.step.2':
    'La liste montre chaque passkey avec son nom et sa dernière utilisation ; le bouton de suppression en retire une.',
  'help.guide.passkeys.result': 'La page de connexion propose la passkey ; le mot de passe reste en secours.',
  'help.guide.passkeys.tip.1':
    'Une passkey vit sur l’appareil ou dans son gestionnaire de mots de passe, ajoutez-en donc une par appareil.',
  'help.guide.passkeys.tip.2':
    'Les passkeys exigent HTTPS ; sur une instance en simple HTTP, la section explique pourquoi elles sont indisponibles.',
  // delete-account
  'help.guide.delete-account.title': 'Supprimer votre compte',
  'help.guide.delete-account.goal': 'Retirez votre compte et les données qui ne sont qu’à vous.',
  'help.guide.delete-account.step.1': 'Tout en bas de Compte, cliquez sur Supprimer le compte et confirmez.',
  'help.guide.delete-account.result':
    'Votre compte, vos propres voyages et vos journaux disparaissent ; les voyages que vous partagez avec d’autres restent chez eux.',
  'help.guide.delete-account.tip.1':
    'Le dernier admin d’une instance ne peut pas se supprimer lui-même ; nommez d’abord quelqu’un d’autre admin.',
  'help.guide.delete-account.tip.2':
    'Il n’y a pas de retour en arrière. Exportez ce que vous voulez garder avant de confirmer.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administration',
  'help.ctx.admin.summary':
    'L’instance derrière le TREK de tout le monde : qui peut se connecter et comment, ce qui est activé, où vivent les fichiers, comment le serveur joint les gens et comment il est sauvegardé. Seuls les admins voient cette page ; chaque onglet est un écran à part dans la barre latérale.',
  'help.ctx.admin.bullet.1':
    'Les quatre cartes en haut comptent utilisateurs, voyages, lieux et fichiers ; une bannière au-dessus annonce une version plus récente de TREK.',
  'help.ctx.admin.bullet.2':
    'Utilisateurs et Valeurs par défaut : les comptes, les liens d’invitation et les réglages de carte avec lesquels un nouveau compte démarre.',
  'help.ctx.admin.bullet.3':
    'Personnalisation, Paramètres, Extensions et Plugins : modèles de bagages, catégories et vacances scolaires ; méthodes de connexion et clés API ; les modules de fonctionnalités ; les plugins tiers.',
  'help.ctx.admin.bullet.4':
    'Stockage, Notifications, Accès MCP et GitHub : où vont les envois, les canaux de toute l’instance, les tokens et sessions des clients IA, et l’historique des versions.',
  'help.ctx.admin.bullet.5':
    'Sauvegarde et Audit : sauvegardes à la demande et planifiées, et le journal des événements liés à la sécurité.',
  'help.ctx.admin-users.title': 'Utilisateurs',
  'help.ctx.admin-users.summary':
    'Chaque compte de ce TREK, avec rôle, e-mail et dernière connexion, et les liens d’invitation qui permettent aux gens de s’inscrire sur une instance fermée.',
  'help.ctx.admin-users.bullet.1':
    'Le tableau : nom d’utilisateur, e-mail, rôle, date de création, dernière connexion et les actions par ligne. Vous êtes marqué comme vous.',
  'help.ctx.admin-users.bullet.2':
    'Créer un utilisateur en haut ajoute un compte à la main, avec un mot de passe que vous transmettez.',
  'help.ctx.admin-users.bullet.3':
    "Liens d'invitation en dessous : des liens d’inscription à usage unique avec une limite d’utilisations, une expiration et, si vous voulez, un voyage que le nouvel utilisateur rejoint à son arrivée.",
  'help.ctx.admin-users.bullet.4':
    'Paramètres des permissions tout en bas : par action, qui peut la faire, Tout le monde, Membres du voyage, Propriétaire du voyage ou Administrateur uniquement.',
  'help.ctx.admin-defaults.title': 'Valeurs par défaut',
  'help.ctx.admin-defaults.summary':
    'Les réglages avec lesquels un nouveau compte démarre, pour que personne n’ait à chercher d’abord l’onglet carte : moteur cartographique, style, jetons et qualité.',
  'help.ctx.admin-defaults.bullet.1':
    'Moteur cartographique, style et jeton Mapbox, clé CARTO et qualité Mapbox, exactement comme un utilisateur les réglerait sous Paramètres, Carte.',
  'help.ctx.admin-defaults.bullet.2':
    'Réinitialiser par champ rend le choix propre à TREK ; le réglage personnel d’un utilisateur l’emporte toujours sur ceux-ci.',
  'help.ctx.admin-config.title': 'Personnalisation',
  'help.ctx.admin-config.summary':
    'Ce que tous les voyages de l’instance partagent : les modèles de bagages, le jeu de catégories pour les lieux et les collections, et le catalogue de vacances scolaires où puise Vacay.',
  'help.ctx.admin-config.bullet.1':
    'Modèles de bagages : des listes nommées de catégories et d’articles dont la liste de bagages d’un voyage peut partir.',
  'help.ctx.admin-config.bullet.2':
    'Catégories : nom, icône et couleur des catégories utilisées dans tout TREK, de l’inspecteur de lieu aux Collections.',
  'help.ctx.admin-config.bullet.3':
    'Vacances scolaires : le catalogue des pays et régions, pour les endroits que les flux intégrés ne couvrent pas.',
  'help.ctx.admin-settings.title': 'Paramètres',
  'help.ctx.admin-settings.summary':
    'Comment les gens entrent et à quoi le serveur peut parler : méthodes de connexion et d’inscription, SSO, passkeys, politique de double authentification, les clés API pour les cartes, les lieux et les images, les fournisseurs de recherche et de transports, et les types de fichiers que les envois peuvent avoir.',
  'help.ctx.admin-settings.bullet.1':
    "Authentication Methods : Password Login, Password Registration, SSO Login, SSO Auto-Provisioning et Exiger l'authentification à deux facteurs (2FA).",
  'help.ctx.admin-settings.bullet.2':
    'Authentification unique (OIDC) avec émetteur, client et nom d’affichage ; Connexion par passkey avec Relying Party ID et origines.',
  'help.ctx.admin-settings.bullet.3':
    'Clés API : Google Maps, Unsplash et Amap, chacune avec Tester ; Ce à quoi sert la clé restreint la clé Google aux fonctions que vous voulez payer.',
  'help.ctx.admin-settings.bullet.4':
    'Fournisseur de recherche de lieux et Fournisseur de transports en commun choisissent qui répond aux recherches et aux itinéraires ; Types de fichiers autorisés limite les envois.',
  'help.ctx.admin-addons.title': 'Extensions',
  'help.ctx.admin-addons.summary':
    'Les modules de fonctionnalités de TREK, chacun avec un interrupteur : Listes, Coûts, Documents, Vacay, Atlas, Collaboration, Journal de voyage, Collections, Road trip, MCP, AirTrail, Dawarich et l’analyse par IA. Désactivé veut dire que l’entrée de navigation, les routes et l’API disparaissent pour tout le monde.',
  'help.ctx.admin-addons.bullet.1':
    'Une tuile par extension avec son interrupteur et, quand elle en a, des sous-lignes pour ses options.',
  'help.ctx.admin-addons.bullet.2':
    'Les fournisseurs de photos et de documents apparaissent ici aussi comme tuiles, pour proposer Immich ou Synology aux utilisateurs.',
  'help.ctx.admin-addons.bullet.3': 'Suivi des bagages a son propre interrupteur sous les tuiles.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Des plugins tiers qui tournent dans leur propre processus à côté de TREK, chacun avec les permissions demandées à l’installation. Installez depuis le catalogue, téléversez un paquet, ou liez un dossier pendant que vous en développez un.',
  'help.ctx.admin-plugins.bullet.1':
    'La liste : chaque plugin installé avec version, état, signature et les permissions qu’il détient ; activer, désactiver, mettre à jour ou désinstaller par ligne.',
  'help.ctx.admin-plugins.bullet.2':
    'Téléverser un plugin prend un fichier de paquet ; Réanalyser détecte un dossier de plugin lié pour le développement.',
  'help.ctx.admin-plugins.bullet.3':
    'Hôtes autorisés par plugin : les adresses qu’un plugin peut appeler, puisque les sorties sont refusées par défaut.',
  'help.ctx.admin-storage.title': 'Stockage',
  'help.ctx.admin-storage.summary':
    'Où vivent les envois : le disque local, un bucket S3, ou un miroir qui écrit dans les deux. Chaque catégorie d’envoi peut aller vers un backend différent, et État dit si chaque backend répond.',
  'help.ctx.admin-storage.bullet.1':
    'Backends : nom et type de chacun, avec Tester, Modifier et Supprimer ; un backend défini par l’environnement est en lecture seule ici.',
  'help.ctx.admin-storage.bullet.2':
    'Catégories : couvertures, documents, photos du journal et le reste, chacune assignée à un backend ; en changer une propose de déplacer les fichiers existants.',
  'help.ctx.admin-storage.bullet.3':
    'État : une vérification par backend, et le fichier témoin qui prouve que la configuration est bien celle que le serveur voit.',
  'help.ctx.admin-notifications.title': 'Notifications',
  'help.ctx.admin-notifications.summary':
    'Les canaux que l’instance propose à ses utilisateurs, et ceux qui vous joignent en tant qu’admin. Les utilisateurs choisissent leurs propres sujets et URL sous Paramètres ; vous décidez de ce qui existe et configurez l’e-mail.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook et Web Push : un panneau chacun, avec un interrupteur qui propose le canal aux utilisateurs et la configuration côté serveur dont il a besoin.',
  'help.ctx.admin-notifications.bullet.2':
    'Rappels de voyage : si le serveur envoie le rappel avant le début d’un voyage.',
  'help.ctx.admin-notifications.bullet.3':
    'Ntfy admin et Webhook admin : où vont les événements admin comme une sauvegarde échouée ou une nouvelle version, avec Tester.',
  'help.ctx.admin-mcp-tokens.title': 'Accès MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Chaque token et session OAuth que des clients IA détiennent sur ce TREK, tous utilisateurs confondus, avec le pouvoir de révoquer n’importe lequel.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'Tokens API : qui l’a créé, quand il a servi pour la dernière fois, et Supprimer.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'Sessions OAuth : le client, l’utilisateur et les portées accordées, et Révoquer.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Ce qui est nouveau dans TREK : l’historique des versions depuis GitHub, la version que vous faites tourner, et si une plus récente est sortie. La mise à jour elle-même se fait hors de l’application, sur l’hôte.',
  'help.ctx.admin-github.bullet.1':
    'Historique des versions liste les versions avec leurs notes ; la plus récente porte Dernière, et la vôtre est marquée.',
  'help.ctx.admin-github.bullet.2':
    'Mise à jour disponible apparaît dans l’en-tête dès qu’une version plus récente existe, avec la marche à suivre pour Docker et les autres installations.',
  'help.ctx.admin-backup.title': 'Sauvegarde',
  'help.ctx.admin-backup.summary':
    'Des sauvegardes complètes de la base de données et des envois, faites à la main ou selon un planning, conservées sur le serveur et téléchargeables en un seul fichier. Restaurer en remet une en place.',
  'help.ctx.admin-backup.bullet.1':
    'Sauvegarde des données : Créer une sauvegarde, et la liste des sauvegardes existantes avec Télécharger, Restaurer et supprimer.',
  'help.ctx.admin-backup.bullet.2':
    'Importer une sauvegarde apporte un fichier fait sur une autre instance ou un autre jour.',
  'help.ctx.admin-backup.bullet.3':
    'Sauvegarde automatique : activée ou non, intervalle, heure et jour, et combien en garder.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Le journal des événements de sécurité et d’administration : connexions et échecs, changements de MFA, changements d’utilisateurs et de réglages, sauvegardes et restaurations. En lecture seule, le plus récent en premier.',
  'help.ctx.admin-audit.bullet.1': 'Une ligne par événement avec heure, utilisateur, action, ressource, IP et détails.',
  'help.ctx.admin-audit.bullet.2': 'Actualiser recharge ; Charger plus remonte plus loin.',
  // create-user
  'help.guide.create-user.title': 'Créer un utilisateur',
  'help.guide.create-user.goal': 'Ajoutez un compte à la main, sans invitation.',
  'help.guide.create-user.step.1': 'Cliquez sur Créer un utilisateur en haut de l’onglet Utilisateurs.',
  'help.guide.create-user.step.2':
    "Saisissez Nom d'utilisateur, E-mail et un Mot de passe, et choisissez le Rôle : Utilisateur ou Administrateur.",
  'help.guide.create-user.step.3': 'Cliquez sur Créer un utilisateur.',
  'help.guide.create-user.result':
    'Le compte apparaît dans le tableau et peut se connecter tout de suite ; transmettez le mot de passe par un canal de confiance.',
  'help.guide.create-user.tip.1':
    'Pour une personne qui doit choisir son propre mot de passe, un lien d’invitation est la meilleure porte d’entrée.',
  'help.guide.create-user.tip.2':
    'Les admins voient cette page et le journal d’audit ; tout le reste est identique pour les deux rôles.',
  // edit-user
  'help.guide.edit-user.title': 'Changer le rôle ou le mot de passe d’un utilisateur',
  'help.guide.edit-user.goal': 'Promouvez quelqu’un, rétrogradez-le, ou faites-le revenir après un mot de passe perdu.',
  'help.guide.edit-user.step.1':
    "Cliquez sur le crayon dans la ligne de l’utilisateur. Modifier l'utilisateur s’ouvre avec les détails du compte.",
  'help.guide.edit-user.step.2':
    'Changez le Rôle, définissez un Nouveau mot de passe, ou cliquez sur Réinitialiser les passkeys quand la personne a perdu l’appareil qui portait ses passkeys, puis Enregistrer.',
  'help.guide.edit-user.result':
    'Le changement s’applique à la requête suivante ; un nouveau mot de passe fonctionne dès la prochaine connexion.',
  'help.guide.edit-user.tip.1': 'Vous ne pouvez pas vous retirer le rôle d’admin tant que vous êtes le dernier admin.',
  'help.guide.edit-user.tip.2':
    'Réinitialiser les passkeys garde le mot de passe ; la personne ajoute de nouvelles passkeys sous Paramètres, Compte.',
  // invite-links
  'help.guide.invite-links.title': 'Inviter quelqu’un avec un lien',
  'help.guide.invite-links.goal':
    'Laissez une personne s’inscrire sur une instance fermée, et atterrir dans un voyage si vous voulez.',
  'help.guide.invite-links.step.1': "Sous Liens d'invitation, cliquez sur Créer un lien.",
  'help.guide.invite-links.step.2':
    'Réglez Utilisations max. et Expire après, éventuellement Ajouter à un voyage (facultatif), et cliquez sur Créer et copier.',
  'help.guide.invite-links.step.3':
    'Envoyez le lien. Chaque ligne montre combien de fois il a servi et qui l’a créé ; Copier le lien le copie de nouveau, et les liens épuisés ou expirés sont marqués.',
  'help.guide.invite-links.result':
    'Qui ouvre le lien s’inscrit avec son propre mot de passe et, si un voyage est choisi, le rejoint aussitôt.',
  'help.guide.invite-links.tip.1':
    'Les liens d’invitation fonctionnent même quand Password Registration est désactivé sous Paramètres.',
  'help.guide.invite-links.tip.2':
    'Un lien à une seule utilisation et à expiration courte est le réglage le plus sûr pour une seule personne.',
  // delete-user
  'help.guide.delete-user.title': 'Supprimer un utilisateur',
  'help.guide.delete-user.goal': 'Retirez un compte et tout ce qui n’appartient qu’à lui.',
  'help.guide.delete-user.step.1':
    "Cliquez sur l’icône de corbeille dans la ligne de l’utilisateur et confirmez Supprimer l'utilisateur.",
  'help.guide.delete-user.result':
    'Le compte, ses propres voyages et ses journaux disparaissent ; les voyages partagés avec d’autres restent aux membres restants.',
  'help.guide.delete-user.tip.1':
    'Il n’y a pas de retour en arrière. Faites d’abord une sauvegarde si vous n’êtes pas sûr.',
  'help.guide.delete-user.tip.2':
    'Le dernier admin ne peut pas être supprimé ; nommez d’abord quelqu’un d’autre admin.',
  // permissions
  'help.guide.permissions.title': 'Décider qui peut faire quoi',
  'help.guide.permissions.goal': 'Définissez, par action, quel rôle a le droit de la faire sur ce TREK.',
  'help.guide.permissions.step.1':
    'Sous Paramètres des permissions, trouvez l’action dans son groupe, par exemple Supprimer des voyages sous Gestion des voyages, et choisissez le niveau : Tout le monde, Membres du voyage, Propriétaire du voyage ou Administrateur uniquement. Une ligne modifiée est marquée personnalisé.',
  'help.guide.permissions.step.2':
    'Cliquez sur Enregistrer. Réinitialiser par défaut remet chaque ligne au niveau intégré.',
  'help.guide.permissions.result':
    'La règle s’applique à tous les voyages d’un coup ; les boutons et menus des personnes sous le niveau disparaissent.',
  'help.guide.permissions.tip.1':
    'Propriétaire du voyage désigne la personne qui a créé le voyage ; les admins peuvent toujours tout faire.',
  'help.guide.permissions.tip.2':
    'Abaissez un niveau plutôt que de supprimer un membre : un membre qui ne peut pas modifier peut encore lire et commenter.',
  // default-map
  'help.guide.default-map.title': 'Régler la carte par défaut des nouveaux utilisateurs',
  'help.guide.default-map.goal': 'Donnez à chaque nouveau compte une carte qui fonctionne sans jeton personnel.',
  'help.guide.default-map.step.1':
    'Sous Carte, choisissez le Moteur cartographique et, pour Mapbox ou MapLibre, le Style de carte, le Jeton Mapbox partagé et le Mode haute qualité ; pour une carte raster, le Modèle de carte et la Clé CARTO partagée.',
  'help.guide.default-map.step.2':
    'À côté de tout champ modifié, réinitialiser rend le choix propre à TREK. Paramètres utilisateur par défaut à gauche fait de même pour Mode de couleur, les unités et la devise.',
  'help.guide.default-map.result':
    'Les nouveaux comptes démarrent avec ces réglages ; qui a réglé sa propre carte sous Paramètres garde la sienne.',
  'help.guide.default-map.tip.1':
    'Un jeton saisi ici est partagé par tous ceux qui n’en ont pas, alors surveillez son quota.',
  'help.guide.default-map.tip.2':
    'Les comptes existants qui n’ont jamais touché l’onglet carte suivent aussi ces valeurs par défaut.',
  // packing-templates
  'help.guide.packing-templates.title': 'Construire un modèle de bagages',
  'help.guide.packing-templates.goal': 'Donnez aux voyages une liste de bagages de départ plutôt qu’une liste vide.',
  'help.guide.packing-templates.step.1': 'Cliquez sur Nouveau modèle, tapez un nom et confirmez avec la coche.',
  'help.guide.packing-templates.step.2':
    'Ouvrez le modèle et cliquez sur Ajouter une catégorie ; sous chaque catégorie, le + ajoute des articles, et un article n’a besoin que d’un nom.',
  'help.guide.packing-templates.step.3':
    'Tout s’enregistre au fur et à mesure. Le crayon renomme un modèle, une catégorie ou un article, la corbeille le supprime.',
  'help.guide.packing-templates.result':
    'Le modèle est proposé sur la liste de bagages de chaque voyage ; l’appliquer copie les articles, donc un voyage peut les changer librement.',
  'help.guide.packing-templates.tip.1':
    'Un modèle par type de voyage, plage, ville, randonnée, vaut mieux qu’une liste géante.',
  'help.guide.packing-templates.tip.2': 'Supprimer un modèle ne touche pas aux voyages qui l’ont déjà appliqué.',
  // categories
  'help.guide.categories.title': 'Gérer le jeu de catégories',
  'help.guide.categories.goal':
    'Décidez quelles catégories les lieux et les collections peuvent porter, et à quoi elles ressemblent.',
  'help.guide.categories.step.1':
    'Cliquez sur Nouvelle catégorie, donnez-lui un nom, choisissez une icône et une couleur ; l’Aperçu montre le résultat. Cliquez sur Créer.',
  'help.guide.categories.step.2':
    'Survolez une catégorie dans la liste pour la modifier ou la supprimer. La suppression demande confirmation.',
  'help.guide.categories.result':
    'Le jeu s’applique partout à la fois : l’inspecteur de lieu, les épingles de la carte, Collections et les filtres.',
  'help.guide.categories.tip.1':
    'Les lieux gardent leur id de catégorie, donc renommer une catégorie la renomme sur chaque lieu.',
  'help.guide.categories.tip.2':
    'Une catégorie supprimée laisse ses lieux sans catégorie ; réassignez-les d’abord si cela compte.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Tenir les vacances scolaires à la main',
  'help.guide.school-holiday-catalog.goal':
    'Couvrez un pays ou une région que les flux de vacances intégrés ne couvrent pas.',
  'help.guide.school-holiday-catalog.step.1':
    'Sous Vacances scolaires, cliquez sur Ajouter un pays, saisissez le Pays et son Code du pays (ex. US), et Enregistrer ; puis Ajouter une région pour chaque partie qui diffère.',
  'help.guide.school-holiday-catalog.step.2':
    'Cliquez sur une région pour ouvrir Région ou district scolaire : Ajouter une période, donnez à chacune un Nom des vacances, une Date de début et une Date de fin, et Enregistrer. La corbeille retire une période, une région ou, une fois qu’il n’a plus de régions, un pays.',
  'help.guide.school-holiday-catalog.result':
    'Les utilisateurs trouvent le pays et la région sous Paramètres dans Vacay et voient les périodes sur leur grille annuelle.',
  'help.guide.school-holiday-catalog.tip.1':
    'Les régions des flux intégrés ne se modifient pas ici ; ajoutez une région manuelle à côté si une date est fausse.',
  // auth-methods
  'help.guide.auth-methods.title': 'Décider comment les gens se connectent',
  'help.guide.auth-methods.goal':
    'Ouvrez ou fermez la connexion par mot de passe, le SSO et l’inscription, et exigez la 2FA.',
  'help.guide.auth-methods.step.1':
    'Sous Authentication Methods, activez ou désactivez Password Login et Password Registration. Inscription désactivée veut dire : nouveaux comptes uniquement par liens d’invitation, SSO ou à la main.',
  'help.guide.auth-methods.step.2':
    'SSO Login et SSO Auto-Provisioning ont besoin d’une Authentification unique (OIDC) configurée plus bas ; l’auto-provisionnement crée un compte la première fois que quelqu’un se connecte par SSO.',
  'help.guide.auth-methods.step.3':
    "Exiger l'authentification à deux facteurs (2FA) oblige chaque connexion par mot de passe à configurer un authentificateur à la prochaine connexion. Connexion par passkey a besoin du Relying Party ID et des origines par lesquelles votre TREK est joint.",
  'help.guide.auth-methods.result':
    'La page de connexion propose exactement les méthodes que vous avez laissées actives.',
  'help.guide.auth-methods.tip.1':
    'Un avertissement apparaît avant que vous ne vous enfermiez dehors : au moins une porte d’entrée reste ouverte aux admins.',
  'help.guide.auth-methods.tip.2':
    'Les valeurs définies par variables d’environnement s’affichent ici en lecture seule.',
  // oidc
  'help.guide.oidc.title': 'Connecter l’authentification unique',
  'help.guide.oidc.goal': 'Laissez les gens se connecter avec votre fournisseur d’identité.',
  'help.guide.oidc.step.1':
    "Sous Authentification unique (OIDC), saisissez le Nom d'affichage du bouton et l’URL de l'émetteur, le Client ID et le Client Secret de votre fournisseur, puis Enregistrer.",
  'help.guide.oidc.step.2': 'Activez SSO Login sous Authentication Methods.',
  'help.guide.oidc.result':
    'La page de connexion montre le bouton SSO ; avec SSO Auto-Provisioning activé, les nouveaux venus reçoivent un compte automatiquement.',
  'help.guide.oidc.tip.1':
    'L’URI de redirection dont votre fournisseur a besoin est l’adresse de votre TREK plus le chemin de rappel OIDC indiqué dans la documentation.',
  'help.guide.oidc.tip.2':
    'Le mappage des claims décide quels groupes SSO deviennent admins ; voir la page OIDC de la documentation.',
  // instance-keys
  'help.guide.instance-keys.title': 'Saisir les clés API',
  'help.guide.instance-keys.goal':
    'Débloquez la recherche de lieux Google, les couvertures Unsplash et Amap pour toute l’instance.',
  'help.guide.instance-keys.step.1':
    'Sous Clés API, collez la Clé API Google Maps et cliquez sur Tester ; le champ dit si la clé répond.',
  'help.guide.instance-keys.step.2':
    'Sous Ce à quoi sert la clé, n’activez que les fonctions que vous voulez facturer sur cette clé : autocomplétion, détails, photos, enrichissement, le journal des recherches.',
  'help.guide.instance-keys.step.3':
    'Clé API Unsplash alimente la recherche de couvertures ; Clé API Amap (高德地图) la recherche de lieux en Chine. Testez chacune de la même façon.',
  'help.guide.instance-keys.result':
    'Les utilisateurs obtiennent les fonctions sans clés personnelles ; sans clé Google, TREK cherche via la pile OpenStreetMap gratuite et la TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'La clé personnelle d’un utilisateur sous Paramètres l’emporte sur la clé de l’instance pour cet utilisateur.',
  'help.guide.instance-keys.tip.2':
    'Les clés peuvent aussi venir de variables d’environnement ; celles-là s’affichent ici en lecture seule.',
  // places-transit
  'help.guide.places-transit.title': 'Choisir les fournisseurs de recherche et de transports',
  'help.guide.places-transit.goal':
    'Décidez qui répond aux recherches de lieux et aux itinéraires en transports en commun.',
  'help.guide.places-transit.step.1':
    'Sous Fournisseur de recherche de lieux, choisissez Automatique, Google Places, Amap (高德地图) ou OpenStreetMap. Automatique utilise la meilleure clé disponible.',
  'help.guide.places-transit.step.2':
    'Sous Fournisseur de transports en commun, choisissez Transitous (gratuit), mondial et sans clé, ou Google, qui a besoin de la clé Google.',
  'help.guide.places-transit.result':
    'Chaque champ de recherche et chaque itinéraire en transports de TREK suit ce choix.',
  'help.guide.places-transit.tip.1':
    'Un fournisseur sans sa clé affiche un avertissement ici et se rabat sur OpenStreetMap.',
  'help.guide.places-transit.tip.2':
    'Les itinéraires de transports Google sont facturés à la requête ; Transitous non.',
  // file-types
  'help.guide.file-types.title': 'Limiter les types de fichiers',
  'help.guide.file-types.goal': 'Décidez quelles extensions de fichiers les envois peuvent avoir.',
  'help.guide.file-types.step.1':
    'Sous Types de fichiers autorisés, modifiez la liste d’extensions séparées par des virgules et enregistrez.',
  'help.guide.file-types.result':
    'Les envois de tout autre type sont refusés avec un message clair, dans les documents, le journal et les couvertures.',
  'help.guide.file-types.tip.1':
    'Gardez les types d’images dans la liste ; les couvertures et les photos du journal passent par le même contrôle.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Activer ou désactiver une extension',
  'help.guide.toggle-addon.goal': 'Proposez un module de fonctionnalités à tout le monde, ou retirez-le.',
  'help.guide.toggle-addon.step.1':
    'Basculez l’interrupteur sur la tuile de l’extension. L’entrée de navigation apparaît ou disparaît pour tout le monde d’un coup.',
  'help.guide.toggle-addon.step.2':
    'Certaines tuiles portent des sous-lignes pour leurs options, comme Suivi des bagages sous Listes ou les fournisseurs de photos sous Journal de voyage ; elles ne s’affichent que tant que l’extension est active.',
  'help.guide.toggle-addon.result':
    'Les données d’une extension désactivée sont conservées ; la réactiver les montre de nouveau.',
  'help.guide.toggle-addon.tip.1':
    'MCP désactivé retire le point de terminaison et les sections Intégrations qui en dépendent.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas et Journal de voyage sont les extensions que les utilisateurs demandent le plus ; Documents a besoin d’un stockage pour les envois.',
  // install-plugin
  'help.guide.install-plugin.title': 'Installer un plugin',
  'help.guide.install-plugin.goal': 'Ajoutez un plugin tiers et donnez-lui exactement les permissions qu’il demande.',
  'help.guide.install-plugin.step.1':
    'Ouvrez Découvrir, choisissez un plugin et cliquez sur Installer ; ou cliquez sur Téléverser un plugin et choisissez un paquet .zip ou .tar.gz.',
  'help.guide.install-plugin.step.2':
    'De retour sous Installé, lisez la ligne : ce que le plugin peut lire ou écrire, les hôtes qu’il appelle et s’il est signé. Activez Activer le plugin.',
  'help.guide.install-plugin.step.3':
    "Le menu de la ligne propose Redémarrer, Voir le journal d'erreurs, Hôtes autorisés et Changer de version… ; Supprimer le désinstalle. Une mise à jour est proposée sur la ligne quand une version plus récente existe, et celle qui demande de nouveaux droits reste inactive jusqu’à ce que vous les approuviez.",
  'help.guide.install-plugin.result':
    'Le plugin tourne dans son propre processus ; ce qu’il ajoute, widgets, couches de carte, outils, apparaît là où le plugin le déclare.',
  'help.guide.install-plugin.tip.1': 'Réanalyser détecte un dossier de plugin lié pour le développement, sans paquet.',
  'help.guide.install-plugin.tip.2':
    'Un plugin non signé est marqué comme tel ; ne l’installez que si vous faites confiance à sa source.',
  // storage-backends
  'help.guide.storage-backends.title': 'Déplacer les envois vers S3 ou un miroir',
  'help.guide.storage-backends.goal':
    'Gardez les fichiers sur un stockage objet, ou à la fois sur disque et dans un bucket.',
  'help.guide.storage-backends.step.1':
    'Sous Backends, cliquez sur Ajouter un backend, donnez-lui un Nom, choisissez le Type, Local, S3 ou Miroir, remplissez les champs et Appliquer. Tester vérifie la connexion, Enregistrer les modifications l’écrit.',
  'help.guide.storage-backends.step.2':
    'Sous Catégories, assignez chaque catégorie d’envoi à un backend. En changer une demande s’il faut Déplacer les objets existants ou Router uniquement les nouvelles écritures.',
  'help.guide.storage-backends.step.3': 'État en haut vérifie chaque backend ; une entrée rouge nomme ce qui a échoué.',
  'help.guide.storage-backends.result':
    'Les nouveaux envois vont vers le backend assigné ; les fichiers déplacés sont servis depuis là.',
  'help.guide.storage-backends.tip.1':
    'Un backend configuré par variables d’environnement est affiché mais ne peut pas être modifié ici.',
  'help.guide.storage-backends.tip.2':
    'Un miroir écrit dans les deux cibles et lit depuis la première ; servez-vous-en pour migrer sans interruption.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurer les canaux de notification',
  'help.guide.channels-instance.goal': 'Décidez quels canaux les utilisateurs peuvent choisir, et configurez l’e-mail.',
  'help.guide.channels-instance.step.1':
    'Sous Email (SMTP), saisissez SMTP Host, SMTP Port, SMTP User, SMTP Password et la From Address ; Envoyer un e-mail de test vous envoie un message.',
  'help.guide.channels-instance.step.2':
    'Activez Web Push, Ntfy et Webhook pour les proposer ; les utilisateurs activent ensuite le push appareil par appareil, ou saisissent leur propre sujet ou URL, sous Paramètres, Notifications.',
  'help.guide.channels-instance.step.3':
    'Rappels de voyage commande le rappel avant le début d’un voyage ; In-App est toujours actif et seulement expliqué ici.',
  'help.guide.channels-instance.result':
    'L’onglet Notifications de chaque utilisateur montre les canaux que vous avez activés.',
  'help.guide.channels-instance.tip.1':
    'Un serveur ntfy par défaut saisi ici est prérempli pour les utilisateurs ; ils peuvent quand même indiquer le leur.',
  'help.guide.channels-instance.tip.2':
    'Les canaux de plugins apparaissent d’eux-mêmes dès qu’un plugin avec cette capacité est actif.',
  // admin-channels
  'help.guide.admin-channels.title': 'Recevoir les événements admin sur votre téléphone',
  'help.guide.admin-channels.goal':
    'Soyez informé des sauvegardes échouées, des nouvelles versions et des autres événements de l’instance.',
  'help.guide.admin-channels.step.1':
    'Sous Ntfy admin, saisissez un sujet et, au besoin, serveur et jeton ; sous Webhook admin, une URL.',
  'help.guide.admin-channels.step.2':
    'Cliquez sur Envoyer un Ntfy de test ou Envoyer un webhook de test pour voir un message arriver.',
  'help.guide.admin-channels.result': 'Les événements admin y partent en plus de la cloche in-app de chaque admin.',
  'help.guide.admin-channels.tip.1':
    'Gardez le sujet admin séparé de votre sujet personnel, pour qu’une panne ne se noie pas dans le bavardage des voyages.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Révoquer l’accès des IA',
  'help.guide.mcp-tokens-admin.goal':
    'Voyez et coupez chaque token et session qu’un client IA détient, pour n’importe quel utilisateur.',
  'help.guide.mcp-tokens-admin.step.1':
    'Sous Tokens API, trouvez le token par utilisateur et nom ; la corbeille le supprime et le client s’arrête aussitôt.',
  'help.guide.mcp-tokens-admin.step.2':
    'Sous Sessions OAuth, la même chose pour les clients passant par le navigateur : client, utilisateur et date, et la corbeille révoque la session.',
  'help.guide.mcp-tokens-admin.result': 'Le client doit être reconnecté par son utilisateur ; rien d’autre ne change.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Les portées vous disent ce qu’un client pouvait faire ; une portée en lecture seule ne fait pas de mal si on la laisse.',
  'help.guide.mcp-tokens-admin.tip.2': 'Désactiver l’extension MCP révoque tout d’un coup.',
  // release-history
  'help.guide.release-history.title': 'Vérifier s’il y a une nouvelle version',
  'help.guide.release-history.goal': 'Sachez si votre TREK est à jour et ce que la prochaine version apporte.',
  'help.guide.release-history.step.1':
    'Quand une version plus récente existe, Mise à jour disponible s’affiche en haut de la page admin ; Voir sur GitHub l’ouvre, et Comment mettre à jour explique la mise à jour pour Docker et pour les autres installations.',
  'help.guide.release-history.step.2':
    'Historique des versions liste chaque version avec ses notes ; Afficher les détails les déplie, la plus récente porte Dernière, et Charger plus remonte plus loin.',
  'help.guide.release-history.result':
    'La mise à jour se fait sur l’hôte, en tirant la nouvelle image ou en construisant le nouveau tag ; le répertoire de données reste.',
  'help.guide.release-history.tip.1':
    'Faites une sauvegarde avant une mise à jour ; l’onglet Sauvegarde est juste à côté.',
  'help.guide.release-history.tip.2':
    'Les préversions sont affichées mais pas annoncées comme mises à jour, sauf si vous en faites tourner une.',
  // create-backup
  'help.guide.create-backup.title': 'Faire et restaurer une sauvegarde',
  'help.guide.create-backup.goal':
    'Prenez un instantané de toute l’instance, gardez-en une copie ailleurs, et soyez capable de la remettre en place.',
  'help.guide.create-backup.step.1':
    'Sous Sauvegarde des données, cliquez sur Créer une sauvegarde. Elle empaquette la base de données et les envois dans un seul fichier sur le serveur.',
  'help.guide.create-backup.step.2':
    'Télécharger garde une copie hors de la machine ; la corbeille supprime les anciennes pour libérer de l’espace.',
  'help.guide.create-backup.step.3':
    'Restaurer sur une sauvegarde, ou Importer une sauvegarde avec un fichier, remplace les données actuelles après que Restaurer la sauvegarde ? a demandé une fois.',
  'help.guide.create-backup.result':
    'Une restauration ramène utilisateurs, voyages, fichiers et réglages à l’état de cette sauvegarde ; tout le monde est déconnecté.',
  'help.guide.create-backup.tip.1':
    'La restauration est la seule action ici qui ne peut pas être annulée. Faites d’abord une sauvegarde fraîche.',
  'help.guide.create-backup.tip.2':
    'Les sauvegardes vivent dans le répertoire de données ; c’est une copie sur une autre machine qui en fait une vraie sauvegarde.',
  // auto-backup
  'help.guide.auto-backup.title': 'Planifier les sauvegardes',
  'help.guide.auto-backup.goal': 'Laissez le serveur se sauvegarder lui-même et ne garder que les dernières.',
  'help.guide.auto-backup.step.1':
    "Sous Sauvegarde automatique, activez Activer la sauvegarde automatique et choisissez l’Intervalle, Exécuter à l'heure et, pour hebdomadaire ou mensuel, le Jour de la semaine ou le Jour du mois.",
  'help.guide.auto-backup.step.2':
    'Supprimer les anciennes sauvegardes après règle combien de temps une sauvegarde est gardée ; les plus anciennes partent quand une nouvelle est faite.',
  'help.guide.auto-backup.result':
    'Les sauvegardes apparaissent dans la liste selon le planning ; un échec atteint les canaux admin.',
  'help.guide.auto-backup.tip.1': 'Les heures suivent le fuseau horaire du serveur, indiqué dans l’onglet Audit.',
  'help.guide.auto-backup.tip.2': 'Le stockage du serveur n’est pas infini ; en garder trois à cinq suffit en général.',
  // audit-log
  'help.guide.audit-log.title': 'Lire le journal d’audit',
  'help.guide.audit-log.goal': 'Découvrez qui a fait quoi, et quand.',
  'help.guide.audit-log.step.1':
    'Lisez les lignes : heure, utilisateur, action, ressource, IP et détails, le plus récent en premier. Les actions sont nommées d’après ce qui s’est passé, comme un échec de connexion, un changement de MFA ou une restauration.',
  'help.guide.audit-log.step.2': 'Actualiser recharge le haut ; Charger plus remonte plus loin.',
  'help.guide.audit-log.result':
    'Une trace que vous pouvez remettre à quiconque demande pourquoi quelque chose a changé.',
  'help.guide.audit-log.tip.1':
    'Les heures sont affichées dans le fuseau horaire du serveur, nommé au-dessus du tableau.',
  'help.guide.audit-log.tip.2':
    'Le journal est en ajout seul ; rien ici ne peut être modifié ou supprimé depuis l’application.',
  // document-providers
  'help.guide.document-providers.title': 'Proposer un stockage de documents',
  'help.guide.document-providers.goal':
    'Décidez avec quels stockages un voyage peut garder ses documents synchronisés.',
  'help.guide.document-providers.step.1':
    'La tuile Documents porte les stockages en sous-lignes : Paperless-ngx, Papra, Nextcloud, OpenCloud et Synology Drive. Les cinq sont désactivés au départ, et ces lignes ne sont là que tant que Documents lui-même est actif.',
  'help.guide.document-providers.step.2':
    'Basculez l’interrupteur de la ligne Nextcloud. Le message dit Extension mise à jour, et désormais les propriétaires de voyage trouvent Synchronisation des documents dans l’onglet Fichiers de leurs voyages, avec Nextcloud sous Connecter un fournisseur.',
  'help.guide.document-providers.result':
    'Le stockage est proposé sur chaque voyage de ce TREK ; rien n’est connecté tant qu’un propriétaire de voyage ne le fait pas.',
  'help.guide.document-providers.tip.1':
    'Seule la question de savoir si un stockage peut être proposé se décide ici. L’adresse et les identifiants appartiennent à un voyage et sont saisis dans son onglet Fichiers par le propriétaire du voyage, jamais dans le panneau d’administration.',
  'help.guide.document-providers.tip.2':
    'Désactiver Documents désactive chaque stockage avec lui, et un stockage ne peut pas être activé tant que Documents est désactivé : le serveur répond Enable the Documents addon first. Un stockage sur votre propre réseau a aussi besoin de ALLOW_INTERNAL_NETWORK=true sur le serveur.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Voyage',
  'help.ctx.trip.summary':
    'Un voyage, tout entier : le plan avec ses jours, sa carte et ses lieux, et les onglets pour les transports, les réservations, les listes, les coûts, les fichiers et la collaboration. Chacun d’eux a sa propre page d’aide sous celle-ci.',
  'help.ctx.trip.bullet.1':
    'La barre d’onglets : Plan, Transports, Réservations, Listes, Coûts, Fichiers et Collaboration. Les modules et les plugins décident quels onglets existent sur votre TREK.',
  'help.ctx.trip.bullet.2':
    'Plan, ce sont trois colonnes : les jours à gauche, la carte au milieu, les lieux à droite. Les réservations et les transports vivent dans le plan, à l’étape et entre les étapes ; les onglets les listent.',
  'help.ctx.trip.bullet.3':
    'Partager, en haut à droite, ouvre les personnes du voyage : membres, invités, le lien d’invitation et le lien public en lecture seule.',
  'help.ctx.trip.bullet.4':
    'Le titre, les dates, la couverture et la devise se modifient depuis Mes voyages, avec le crayon sur la carte du voyage.',
  'help.ctx.trip.bullet.5':
    'Les chevrons au bord intérieur d’une colonne la replient et la carte prend la place ; le fin séparateur à côté d’une colonne change sa largeur.',
  'help.ctx.trip.bullet.6':
    'La flèche d’annulation dans la barre d’outils des jours reprend la dernière modification du plan.',
  // add-member
  'help.guide.add-member.title': 'Ajouter un membre',
  'help.guide.add-member.goal': 'Donnez à quelqu’un qui a un compte TREK l’accès à ce voyage.',
  'help.guide.add-member.step.1': 'Cliquez sur Partager en haut à droite.',
  'help.guide.add-member.step.2':
    'Sous Inviter un utilisateur, choisissez la personne dans la liste et cliquez sur Inviter.',
  'help.guide.add-member.step.3':
    'La personne apparaît maintenant sous Accès. La couronne marque le propriétaire ; l’icône au bout d’une ligne retire l’accès.',
  'help.guide.add-member.result':
    'Le membre voit et modifie le voyage comme vous, dans les limites des niveaux fixés par l’admin sous Paramètres des permissions.',
  'help.guide.add-member.tip.1':
    'Quelqu’un qui manque dans la liste n’a pas encore de compte TREK : ajoutez-le comme invité, ou laissez-le s’inscrire via un lien d’invitation.',
  'help.guide.add-member.tip.2':
    'Le nombre à côté d’Accès compte les personnes du voyage ; les invités sont listés à part, en dessous.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Inviter par lien',
  'help.guide.trip-invite-link.goal': 'Laissez les gens rejoindre le voyage eux-mêmes.',
  'help.guide.trip-invite-link.step.1':
    'Cliquez sur Partager, puis sous Lien d’invitation au voyage, cliquez sur Créer un lien d’invitation.',
  'help.guide.trip-invite-link.step.2':
    'Cliquez sur Copier et envoyez le lien. Quiconque a un compte TREK et l’ouvre rejoint le voyage comme membre.',
  'help.guide.trip-invite-link.step.3':
    'Régénérer remplace le lien et rend l’ancien inutilisable ; Désactiver l’éteint.',
  'help.guide.trip-invite-link.result': 'Quiconque ouvre le lien est dans le voyage et apparaît sous Accès.',
  'help.guide.trip-invite-link.tip.1':
    'Quelqu’un sans compte ne peut pas l’utiliser. Un admin distribue des liens d’inscription sous Administration, Utilisateurs, et peut en lier un à ce voyage.',
  'help.guide.trip-invite-link.tip.2':
    'Régénérez quand un lien est parti dans le mauvais chat : l’ancien cesse de fonctionner aussitôt.',
  // add-guest
  'help.guide.add-guest.title': 'Ajouter un invité sans compte',
  'help.guide.add-guest.goal': 'Comptez quelqu’un qui n’utilise pas TREK.',
  'help.guide.add-guest.step.1': 'Cliquez sur Partager et faites défiler jusqu’à Invités.',
  'help.guide.add-guest.step.2': 'Tapez le nom dans Nom de l’invité et cliquez sur Ajouter un invité.',
  'help.guide.add-guest.result':
    'L’invité peut être assigné à des coûts, des articles de bagages et des tâches, mais ne peut pas se connecter.',
  'help.guide.add-guest.tip.1':
    'Le crayon renomme un invité ; l’icône au bout de la ligne le retire avec ses parts et ses assignations.',
  'help.guide.add-guest.tip.2':
    'Si la personne obtient un compte plus tard, invitez-la comme membre et retirez l’invité.',
  // public-link
  'help.guide.public-link.title': 'Publier un lien en lecture seule',
  'help.guide.public-link.goal': 'Montrez le voyage à des personnes qui ne doivent pas le modifier.',
  'help.guide.public-link.step.1':
    'Cliquez sur Partager ; à droite, sous Lien public, cochez ce que le lien peut montrer. Carte et plan est toujours actif ; Réservations, Bagages, Coûts et Chat sont à votre choix.',
  'help.guide.public-link.step.2': 'Cliquez sur Créer un lien, puis sur Copier.',
  'help.guide.public-link.step.3':
    'Les cases peuvent être changées tant que le lien existe ; Supprimer le lien l’arrête.',
  'help.guide.public-link.result':
    'Quiconque a le lien voit les parties choisies sans se connecter et ne peut rien changer.',
  'help.guide.public-link.tip.1':
    'Le lien n’est listé nulle part ; quiconque l’a peut l’ouvrir, traitez-le donc comme un mot de passe.',
  'help.guide.public-link.tip.2': 'Pour des droits de modification, ajoutez plutôt la personne comme membre.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Transmettre le voyage ou le quitter',
  'help.guide.transfer-ownership.goal':
    'Faites de quelqu’un d’autre le propriétaire, ou sortez d’un voyage qui n’est pas le vôtre.',
  'help.guide.transfer-ownership.step.1':
    'Cliquez sur Partager. Sous Accès, la couronne sur la ligne d’un membre fait de cette personne le propriétaire ; confirmez la question.',
  'help.guide.transfer-ownership.step.2':
    'Quitter le voyage sur votre propre ligne vous sort du voyage ; en tant que propriétaire, transmettez-le d’abord.',
  'help.guide.transfer-ownership.result':
    'Le nouveau propriétaire gère les membres et peut supprimer le voyage ; vous restez un membre ordinaire.',
  'help.guide.transfer-ownership.tip.1':
    'Le propriétaire est celui qui a créé le voyage, jusqu’à ce qu’il soit transmis ; supprimer le voyage n’appartient qu’à lui.',
  'help.guide.transfer-ownership.tip.2':
    'Retirer l’accès sur une autre ligne est le même bouton dans l’autre sens : le propriétaire sort un membre.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Faire de la place pour la carte',
  'help.guide.collapse-columns.goal': 'Repliez une colonne ou donnez-lui plus de largeur.',
  'help.guide.collapse-columns.step.1':
    'Cliquez sur le chevron au bord intérieur de la colonne des jours pour la replier ; la carte prend l’espace. La colonne des lieux a le même chevron.',
  'help.guide.collapse-columns.step.2': 'Cliquez de nouveau sur le chevron pour ramener la colonne.',
  'help.guide.collapse-columns.step.3':
    'Faites glisser le fin séparateur entre une colonne et la carte pour changer la largeur de la colonne.',
  'help.guide.collapse-columns.result':
    'Les largeurs sont mémorisées ; les colonnes reviennent ouvertes à la prochaine visite.',
  'help.guide.collapse-columns.tip.1': 'Les deux colonnes peuvent être repliées à la fois pour une vue carte seule.',
  'help.guide.collapse-columns.tip.2':
    'Sur un téléphone, il n’y a pas de colonnes : Plan et Lieux sont les deux boutons en bas de la carte.',
  // undo-change
  'help.guide.undo-change.title': 'Annuler la dernière modification',
  'help.guide.undo-change.goal': 'Reprenez ce que vous venez de faire au plan.',
  'help.guide.undo-change.step.1':
    'Cliquez sur la flèche d’annulation dans la barre d’outils au-dessus des jours ; son infobulle nomme la modification qu’elle va reprendre.',
  'help.guide.undo-change.result':
    'Le plan est revenu tel qu’il était, et la flèche se grise jusqu’à la prochaine modification.',
  'help.guide.undo-change.tip.1':
    'L’annulation couvre le plan : assigner, retirer, réordonner et déplacer des lieux, optimiser un itinéraire, supprimer des lieux, les changements de catégorie et les imports.',
  'help.guide.undo-change.tip.2':
    'Elle n’a qu’un cran de profondeur : seule la dernière modification peut être reprise, et une nouvelle modification la remplace.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Lieux',
  'help.ctx.trip-places.summary':
    'La colonne de droite du plan : tous les lieux du voyage, planifiés ou non, avec la recherche et les filtres, et les façons de faire entrer des lieux, à la main, depuis un fichier ou depuis une liste partagée.',
  'help.ctx.trip-places.bullet.1':
    'Ajouter un lieu/activité en haut ouvre le formulaire pour un lieu que vous tapez ou cherchez. Tant qu’un jour est ouvert, le bouton affiche Nouveau lieu, et Au jour à côté crée le lieu directement sur ce jour.',
  'help.ctx.trip-places.bullet.2':
    'Importer un fichier prend les fichiers .gpx, .kml et .kmz ; Import de liste prend une liste partagée de Google Maps ou de Naver Maps. Un fichier peut aussi être simplement déposé sur la colonne.',
  'help.ctx.trip-places.bullet.3':
    'Le menu déroulant bascule entre Tous, Non planifiés, Planifiés et, dès qu’une trace a été importée, Traces ; en dessous se trouvent la recherche, le filtre de catégorie et l’étoile pour une note minimale.',
  'help.ctx.trip-places.bullet.4':
    'Une ligne montre l’image, le nom et la description ou l’adresse. Cliquez dessus pour les détails du lieu, glissez-la sur un jour, ou faites un clic droit pour Modifier, + Jour, Ouvrir le site web, Google Maps, Enregistrer dans une collection et Supprimer.',
  'help.ctx.trip-places.bullet.5':
    'Avec un jour ouvert, un + au bout d’une ligne non planifiée pose le lieu sur ce jour, et Planifiés ne liste que ce jour, avec Afficher tout le voyage pour élargir de nouveau.',
  'help.ctx.trip-places.bullet.6':
    'La coche au bout droit de la ligne de filtres démarre une sélection : plusieurs lignes à la fois reçoivent une nouvelle catégorie, partent dans une collection ou sont supprimées.',
  // create-place
  'help.guide.create-place.title': 'Créer un lieu',
  'help.guide.create-place.goal': 'Ajoutez un lieu ou une activité à la main, avec tout ce que le plan doit en savoir.',
  'help.guide.create-place.step.1':
    'Cliquez sur Ajouter un lieu/activité en haut de la colonne des lieux (Nouveau lieu tant qu’un jour est ouvert). Le formulaire s’ouvre.',
  'help.guide.create-place.step.2':
    'Tapez le lieu dans Rechercher des lieux… en haut et choisissez un résultat. Nom, Adresse, Latitude, Longitude et Site web se remplissent, et Détails du lieu à gauche montre des images, les horaires d’ouverture et une description. Sur un TREK avec clé Google, Ce n’est pas le bon lieu ? Rechercher sur Google se trouve sous la liste et relance la même recherche via Google.',
  'help.guide.create-place.step.3':
    'Dans Détails du lieu, un clic sur une image sous Choisir une image en fait l’image du lieu ; Utiliser ce texte reprend la description dans le formulaire.',
  'help.guide.create-place.step.4':
    'Vérifiez les champs : Nom est obligatoire ; Description et Notes sont à vous ; Adresse, Latitude et Longitude viennent de la recherche ou se tapent ; Catégorie choisit une des catégories du voyage, et le + à côté en crée une nouvelle sur place ; Site web prend le lien.',
  'help.guide.create-place.step.5':
    'Cliquez sur Ajouter. Si un lieu du même nom est déjà dans le voyage, le formulaire le signale et le bouton devient Ajouter quand même.',
  'help.guide.create-place.result':
    'Le lieu est dans la liste et sur la carte, sous Non planifiés tant qu’il n’est pas posé sur un jour.',
  'help.guide.create-place.tip.1':
    'Fichiers et Coûts en bas du formulaire attachent un document au lieu, ou ouvrent l’éditeur de Coûts pour sa dépense juste après l’enregistrement.',
  'help.guide.create-place.tip.2':
    'L’index TREK et OpenStreetMap répondent à la recherche sur chaque TREK, et Détails du lieu se remplit depuis Wikipédia, Wikivoyage et Wikimedia. Google n’est interrogé que là où les deux restent vides, et lui seul apporte les notes.',
  'help.guide.create-place.tip.3':
    'Un lieu peut aussi commencer sur la carte : faites un clic droit sur l’endroit, et le formulaire s’ouvre avec les coordonnées et l’adresse déjà remplies.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Ajouter un lieu directement au jour ouvert',
  'help.guide.place-to-open-day.goal':
    'Sautez la deuxième étape : créez ou choisissez le lieu et posez-le tout de suite sur le jour.',
  'help.guide.place-to-open-day.step.1':
    'Cliquez sur l’en-tête d’un jour dans la colonne des jours. Le jour est ouvert : sa carte est mise en évidence, et la colonne des lieux gagne le bouton Au jour.',
  'help.guide.place-to-open-day.step.2':
    'Au jour ouvre le même formulaire que Nouveau lieu, sauf que le lieu se pose sur le jour ouvert au moment où vous cliquez sur Ajouter.',
  'help.guide.place-to-open-day.step.3':
    'Un lieu qui existe déjà va sur le jour ouvert avec le + au bout de sa ligne, ou par un clic droit, + Jour.',
  'help.guide.place-to-open-day.step.4':
    'L’inverse marche aussi, et sans ouvrir de jour au préalable : fais glisser la ligne du lieu hors de la colonne et lâche-la sur une carte de jour. Lâchée entre deux étapes, elle se pose exactement là.',
  'help.guide.place-to-open-day.result':
    'Le lieu est listé sous le jour, à la fin ; glissez-le vers le haut ou vers le bas jusqu’à sa place.',
  'help.guide.place-to-open-day.tip.1':
    'Le jour ouvert oriente aussi la recherche : un jour ouvert, la carte et la recherche à proximité partent de là où ce jour passe déjà.',
  'help.guide.place-to-open-day.tip.2': 'Annuler dans la barre d’outils au-dessus des jours reprend l’affectation.',
  // filter-places
  'help.guide.filter-places.title': 'Trouver un lieu dans la liste',
  'help.guide.filter-places.goal': 'Resserrez la colonne sur les lieux que vous cherchez.',
  'help.guide.filter-places.step.1':
    'Le menu déroulant en haut bascule entre Tous, Non planifiés (pas encore sur un jour), Planifiés (sur un jour) et Traces (traces GPX importées), chacun avec son compte.',
  'help.guide.filter-places.step.2': 'Tapez dans Rechercher des lieux… ; la liste se resserre à mesure que vous tapez.',
  'help.guide.filter-places.step.3':
    'Toutes les catégories ouvre une liste où cocher une ou plusieurs catégories, Sans catégorie comprise ; Effacer le filtre, en bas, la remet à zéro.',
  'help.guide.filter-places.step.4':
    'L’étoile à côté fixe une note minimale : 5+, 4+ et ainsi de suite ne montrent que les lieux que vous avez notés au moins aussi haut.',
  'help.guide.filter-places.result':
    'Le compte au-dessus des lignes dit combien de lieux correspondent ; les filtres se combinent.',
  'help.guide.filter-places.tip.1':
    'Avec un jour ouvert, Planifiés ne liste que ce jour et le dit : Seul le jour ouvert est affiché, avec Afficher tout le voyage à côté.',
  'help.guide.filter-places.tip.2':
    'La carte se resserre elle aussi sur le jour ouvert ; Tous dans la liste montre toujours tous les lieux du voyage.',
  // edit-place
  'help.guide.edit-place.title': 'Modifier un lieu',
  'help.guide.edit-place.goal': 'Corrigez un nom, déplacez l’épingle, ajoutez un site web ou changez la catégorie.',
  'help.guide.edit-place.step.1':
    'Faites un clic droit sur la ligne et choisissez Modifier, ou ouvrez le lieu et cliquez sur Modifier dans ses détails.',
  'help.guide.edit-place.step.2':
    'Changez ce qu’il faut : Nom, Description, Notes, Adresse, Latitude et Longitude, Catégorie, Site web. Ouvert depuis un jour, le formulaire a aussi Notes pour ce jour ainsi que Début et Fin pour ce jour.',
  'help.guide.edit-place.step.3': 'Cliquez sur Mettre à jour.',
  'help.guide.edit-place.result':
    'La modification s’applique partout où le lieu apparaît : la liste, la carte et chaque jour où il se trouve.',
  'help.guide.edit-place.tip.1':
    'Notes pour ce jour appartient au lieu sur ce seul jour ; Notes appartient au lieu lui-même.',
  'help.guide.edit-place.tip.2':
    'Une Fin avant le Début bloque Mettre à jour ; Chevauchement horaire avec : avertit seulement qu’une autre étape du jour a la même heure.',
  // delete-place
  'help.guide.delete-place.title': 'Supprimer un lieu',
  'help.guide.delete-place.goal': 'Sortez un lieu du voyage pour de bon.',
  'help.guide.delete-place.step.1':
    'Faites un clic droit sur la ligne et choisissez Supprimer, ou cliquez sur Supprimer dans les détails du lieu.',
  'help.guide.delete-place.step.2':
    'Confirmez. Si une nuit a été réservée au lieu, ou si une réservation y est liée, la question dit ce qui part avec.',
  'help.guide.delete-place.result':
    'Le lieu a disparu de la liste, de la carte et de chaque jour ; Annuler dans la barre d’outils au-dessus des jours le ramène.',
  'help.guide.delete-place.tip.1':
    'Pour retirer un lieu d’un seul jour, utilisez plutôt Retirer du jour sur cette étape.',
  'help.guide.delete-place.tip.2': 'Plusieurs lieux à la fois : la coche à côté des filtres démarre une sélection.',
  // select-places
  'help.guide.select-places.title': 'Modifier ou supprimer plusieurs lieux à la fois',
  'help.guide.select-places.goal': 'Rangez la liste en une seule fois au lieu d’y aller lieu par lieu.',
  'help.guide.select-places.step.1':
    'Cliquez sur la coche au bout droit de la ligne de filtres. Les lignes reçoivent des cases et une barre avec les actions apparaît.',
  'help.guide.select-places.step.2':
    'Cochez les lignes, ou Tout sélectionner dans la barre ; la barre compte ce qui est sélectionné.',
  'help.guide.select-places.step.3':
    'Change category donne à tous une seule catégorie ; Enregistrer dans une collection les copie dans une de vos collections ; Supprimer la sélection les retire après une confirmation.',
  'help.guide.select-places.step.4': 'Cliquez de nouveau sur la coche pour quitter la sélection.',
  'help.guide.select-places.result':
    'La modification s’applique à chaque lieu sélectionné ; une suppression peut être annulée depuis la barre d’outils au-dessus des jours.',
  'help.guide.select-places.tip.1':
    'Les filtres continuent de marcher pendant que vous sélectionnez : filtrez d’abord sur Non planifiés, puis Tout sélectionner attrape exactement ceux-là.',
  'help.guide.select-places.tip.2':
    'Marquer comme visité dans vos listes apparaît dans la barre quand le module Collections est actif : il coche les lieux dans les collections où ils sont enregistrés.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importer des lieux depuis un fichier GPX, KML ou KMZ',
  'help.guide.import-places-file.goal':
    'Faites entrer ce que Google My Maps, Google Earth ou un traceur GPS a exporté.',
  'help.guide.import-places-file.step.1':
    'Cliquez sur Importer un fichier, ou déposez le fichier n’importe où sur la colonne des lieux.',
  'help.guide.import-places-file.step.2':
    'Choisissez le fichier ou glissez-le dans le cadre. Pour un GPX, cochez ce qui doit être importé : Points de passage, Itinéraires, Traces (avec géométrie) ; pour KML et KMZ, Points (Placemarks) et Chemins (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Le cadre prend plusieurs fichiers à la fois, et seulement du .gpx, du .kml et du .kmz. Un autre type de fichier, ou un fichier de plus de 10 MB, est refusé dans la boîte de dialogue et n’est pas importé.',
  'help.guide.import-places-file.step.4':
    'Cliquez sur Importer. Un message dit combien de lieux sont arrivés ; pour un fichier KML ou KMZ, la boîte de dialogue reste ouverte avec un résumé de ce qui a été créé et de ce qui a été ignoré.',
  'help.guide.import-places-file.result':
    'Les lieux sont dans la liste ; une trace porte un repère d’itinéraire sur sa ligne, se dessine sur la carte et obtient son propre filtre Traces.',
  'help.guide.import-places-file.tip.1':
    'Un fichier trop gros est refusé avec la limite de taille ; exportez-le de nouveau sans les photos, ou coupez-le en plusieurs.',
  'help.guide.import-places-file.tip.2':
    'L’import peut être annulé en bloc depuis la barre d’outils au-dessus des jours.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importer une liste partagée de Google Maps ou de Naver Maps',
  'help.guide.import-places-list.goal': 'Transformez le lien d’une liste partagée en lieux.',
  'help.guide.import-places-list.step.1': 'Cliquez sur Import de liste et choisissez Liste Google ou Liste Naver.',
  'help.guide.import-places-list.step.2':
    'Collez le lien partagé de la liste. Un lien d’itinéraire Google Maps marche aussi : ses étapes deviennent des lieux, dans l’ordre du trajet.',
  'help.guide.import-places-list.step.3': 'Cliquez sur Importer.',
  'help.guide.import-places-list.result':
    'Chaque lieu de la liste est dans le voyage, nommé comme dans la liste ; les lieux déjà dans le voyage sont ignorés.',
  'help.guide.import-places-list.tip.1':
    'La liste doit être partagée publiquement ; le lien d’une liste privée n’importe rien.',
  'help.guide.import-places-list.tip.2':
    'Enrichir les lieux via Google apparaît dans la boîte de dialogue quand votre TREK a une clé Google : il recherche chaque lieu importé et complète les photos, l’adresse et les détails.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Jours',
  'help.ctx.trip-days.summary':
    'La colonne de gauche du plan : une carte par jour avec ses étapes dans l’ordre, les notes, les réservations et les transports du jour, et l’itinéraire entre les étapes. C’est ici que le voyage se planifie vraiment.',
  'help.ctx.trip-days.bullet.1':
    'La barre d’outils en haut : Exporter (PDF, agenda, GPX), Expand all days / Collapse all days, la flèche Annuler, Réorganiser les jours et Afficher tous les itinéraires.',
  'help.ctx.trip-days.bullet.2':
    'Une carte de jour : numéro, météo, titre, date et coût du jour dans l’en-tête ; cliquez sur l’en-tête pour ouvrir le jour, son chevron la replie. Transports en commun, Ajouter un transport et Ajouter une note se trouvent aussi dans l’en-tête.',
  'help.ctx.trip-days.bullet.3':
    'Dans un jour : les étapes dans l’ordre, chacune avec image, nom, heure et un cadenas sur l’image ; les notes ; les réservations qui appartiennent au jour ; et entre les étapes le temps de trajet de chaque tronçon.',
  'help.ctx.trip-days.bullet.4':
    'Sous les étapes, la barre d’itinéraire : Itinéraire trace le jour sur la carte, Optimiser trie les étapes, Voiture / Marche règle le mode de transport du jour, Ouvrir dans Google Maps et Ouvrir dans CoMaps transmettent le jour.',
  'help.ctx.trip-days.bullet.5':
    'Les lieux arrivent sur un jour en glissant une ligne de la colonne des lieux, avec le + de cette ligne, avec Ajouter un lieu à ce jour sur un jour vide, ou depuis les détails du lieu.',
  'help.ctx.trip-days.bullet.6':
    'Coût total, en bas, additionne chaque étape et chaque réservation qui porte un prix, dans la devise du voyage.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Lire un jour',
  'help.guide.read-day-plan.goal':
    'Savoir ce que chaque partie d’une carte de jour vous dit, avant de changer quoi que ce soit.',
  'help.guide.read-day-plan.step.1':
    'L’en-tête : le numéro du jour, les prévisions du jour, Jour 1 ou le titre que vous lui avez donné, la date et le coût du jour. Cliquez sur l’en-tête pour ouvrir le jour (ses Détails du jour s’ouvrent au-dessus de la carte) ; le chevron à droite replie et déplie la carte.',
  'help.guide.read-day-plan.step.2':
    'Une étape : la poignée à gauche la fait glisser, l’image porte un cadenas pour l’optimisation de l’itinéraire, puis le nom, la description et, si elles sont remplies, les Notes pour ce jour. Un badge horaire affiche Début et Fin quand l’étape en a ; les flèches qui apparaissent à son extrémité droite la montent ou la descendent.',
  'help.guide.read-day-plan.step.3':
    'Une réservation du jour : une réservation liée à une étape marque celle-ci Réservation confirmée ou Réservation en attente, et un transport s’affiche comme Départ ou Arrivée avec son heure et son trajet, avec un petit interrupteur qui trace cet itinéraire sur la carte.',
  'help.guide.read-day-plan.step.4':
    'Entre deux étapes, le connecteur indique combien de temps dure le tronçon et quelle distance il fait, dans le mode de transport du jour ; cliquez dessus pour changer le mode de ce seul tronçon.',
  'help.guide.read-day-plan.step.5':
    'La barre d’itinéraire à la fin : Itinéraire trace le chemin du jour sur la carte, Optimiser réordonne les étapes, les boutons de mode choisissent Voiture ou Marche, Ouvrir dans Google Maps et Ouvrir dans CoMaps ouvrent le jour là-bas.',
  'help.guide.read-day-plan.result':
    'Chaque symbole de la carte a un sens ; les guides ci-dessous changent chacun d’eux.',
  'help.guide.read-day-plan.tip.1':
    'Faites un clic droit sur une étape pour son menu : Modifier, Retirer du jour, Ouvrir le site web, les applications de navigation (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Enregistrer dans une collection, Supprimer.',
  'help.guide.read-day-plan.tip.2':
    'Survolez une étape et Ajouter une réservation apparaît à son extrémité : une réservation créée là est liée à cette étape, ce jour-là.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Poser un lieu sur un jour',
  'help.guide.place-onto-day.goal': 'Faire d’un lieu de la liste une étape du jour, là où il a sa place dans l’ordre.',
  'help.guide.place-onto-day.step.1':
    'Glissez une ligne de la colonne des lieux sur la carte du jour. Déposez-la entre deux étapes pour la mettre exactement là, ou n’importe où sur la carte pour l’ajouter à la fin.',
  'help.guide.place-onto-day.step.2':
    'Sans glisser : ouvrez le jour en cliquant sur son en-tête, puis cliquez sur le + au bout de la ligne du lieu, ou faites un clic droit sur la ligne et choisissez + Jour.',
  'help.guide.place-onto-day.step.3':
    'Sur un jour vide, Ajouter un lieu à ce jour ouvre le formulaire de lieu, et le nouveau lieu se pose aussitôt sur le jour.',
  'help.guide.place-onto-day.step.4':
    'Depuis les détails d’un lieu, Ajouter au jour demande quel jour ; depuis l’en-tête du jour, Au jour dans la colonne des lieux crée un nouveau lieu sur le jour ouvert.',
  'help.guide.place-onto-day.result':
    'Le lieu est une étape du jour, sur la carte avec le numéro du jour, et la colonne des lieux le compte sous Planifiés.',
  'help.guide.place-onto-day.tip.1':
    'Un lieu peut être sur plusieurs jours : posez-le sur le deuxième jour depuis la colonne des lieux. Glisser une étape d’une carte de jour à une autre la déplace au lieu de la copier.',
  'help.guide.place-onto-day.tip.2': 'La flèche Annuler dans la barre d’outils annule l’affectation.',
  'help.guide.place-onto-day.tip.3':
    'Une étape ne peut pas être déposée entre deux entrées à heure fixe, ni avant une réservation qui a déjà une heure ; le plan garde sa chronologie.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Changer l’ordre d’un jour',
  'help.guide.reorder-stops.goal': 'Monter ou descendre une étape, ou l’envoyer sur un autre jour.',
  'help.guide.reorder-stops.step.1': 'Glissez l’étape par sa poignée jusqu’à sa nouvelle position dans la carte.',
  'help.guide.reorder-stops.step.2':
    'Ou utilisez les flèches à l’extrémité droite de l’étape : un pas vers le haut ou vers le bas par clic.',
  'help.guide.reorder-stops.step.3':
    'Glissez l’étape sur une autre carte de jour pour l’y déplacer ; elle quitte l’ancien jour.',
  'help.guide.reorder-stops.step.4':
    'Une étape avec une heure fixe demande Supprimer l’heure ? quand le déplacement briserait l’ordre chronologique du jour, car l’heure décidait de sa place : Confirmer retire l’heure et la laisse aller n’importe où.',
  'help.guide.reorder-stops.result': 'L’itinéraire et les temps de trajet suivent le nouvel ordre aussitôt.',
  'help.guide.reorder-stops.tip.1':
    'Les réservations avec une heure fixe ne peuvent pas être réorganisées ; elles restent là où leur heure les place.',
  'help.guide.reorder-stops.tip.2':
    'Optimiser dans la barre d’itinéraire trie tout le jour par le chemin le plus court ; verrouillez d’abord une étape pour la garder où elle est.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Donner une heure à une étape',
  'help.guide.set-stop-times.goal':
    'Fixer quand une étape commence et finit, pour que le jour se lise comme un horaire.',
  'help.guide.set-stop-times.step.1':
    'Faites un clic droit sur l’étape et choisissez Modifier. Ouvert depuis le jour, le formulaire a Début et Fin en bas.',
  'help.guide.set-stop-times.step.2':
    'Saisissez Début et, si vous voulez, Fin. Chevauchement horaire avec : prévient qu’une autre étape du jour avec une heure se chevauche ; une Fin avant le Début bloque Mettre à jour.',
  'help.guide.set-stop-times.step.3':
    'Cliquez sur Mettre à jour. L’étape reçoit un badge horaire et se place là où son heure a sa place dans le jour.',
  'help.guide.set-stop-times.result':
    'Les étapes avec une heure gardent leur place dans l’ordre ; les étapes sans heure se rangent autour d’elles.',
  'help.guide.set-stop-times.tip.1':
    'L’heure appartient à l’étape de ce jour-là ; le même lieu peut avoir une autre heure un autre jour.',
  'help.guide.set-stop-times.tip.2':
    'Pour déplacer une étape à heure fixe à la main, glissez-la : la question Supprimer l’heure ? retire l’heure au passage, dès que vous cliquez sur Confirmer.',
  'help.guide.set-stop-times.tip.3':
    'Le champ Notes pour ce jour, dans le même formulaire, retient ce qui ne vaut que ce jour-là, une table réservée, un numéro de billet.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Retirer une étape d’un jour',
  'help.guide.remove-from-day.goal': 'Déplanifier un lieu sans le supprimer du voyage.',
  'help.guide.remove-from-day.step.1': 'Faites un clic droit sur l’étape et choisissez Retirer du jour.',
  'help.guide.remove-from-day.step.2':
    'L’étape a disparu du jour ; le lieu reste dans la colonne des lieux, sous Non planifiés s’il n’est sur aucun autre jour.',
  'help.guide.remove-from-day.result':
    'Le jour, son itinéraire et son coût se mettent à jour ; la flèche Annuler ramène l’étape.',
  'help.guide.remove-from-day.tip.1':
    'Supprimer, dans le même menu, retire le lieu de tout le voyage, chaque jour compris.',
  'help.guide.remove-from-day.tip.2':
    'Retirer du jour se trouve aussi dans le panneau de détails du lieu, à côté d’Ajouter au jour.',
  // lock-stop
  'help.guide.lock-stop.title': 'Verrouiller une étape à sa place',
  'help.guide.lock-stop.goal': 'Garder une étape là où elle est quand l’itinéraire est optimisé.',
  'help.guide.lock-stop.step.1':
    'Survolez l’image de l’étape et cliquez sur le cadenas : Maintenir la position lors de l’optimisation de l’itinéraire.',
  'help.guide.lock-stop.step.2':
    'Optimiser trie désormais les autres étapes autour d’elle ; cliquez de nouveau sur le cadenas (Cliquez pour déverrouiller) pour la libérer.',
  'help.guide.lock-stop.result':
    'Le cadenas s’affiche sur l’image ; l’étape garde sa position jusqu’à ce que vous la déverrouilliez.',
  'help.guide.lock-stop.tip.1':
    'Une étape à heure fixe est verrouillée par son heure ; elle ne bouge jamais pendant l’optimisation.',
  'help.guide.lock-stop.tip.2':
    'Le verrou dure le temps de la visite : après un rechargement, chaque étape est de nouveau libre, seules les étapes à heure fixe restent en place.',
  // day-note
  'help.guide.day-note.title': 'Ajouter une note à un jour',
  'help.guide.day-note.goal': 'Garder un rappel, un numéro de billet ou un plan B directement dans le jour.',
  'help.guide.day-note.step.1': 'Cliquez sur Ajouter une note dans l’en-tête du jour.',
  'help.guide.day-note.step.2':
    'Donnez-lui un nom sous Note, c’est ce qui s’affiche dans le jour, et écrivez le reste sous Note du jour. La barre d’outils au-dessus met le texte en forme (Gras, Liste à puces, Lien, Citation), et Aperçu, à gauche, montre ce que la note donnera dans le jour.',
  'help.guide.day-note.step.3':
    'Choisissez une Icône et une Couleur, pour que la note se distingue des étapes, puis Ajouter.',
  'help.guide.day-note.step.4':
    'La note tient dans le jour comme une étape : glissez-la à sa place, faites un clic droit dessus pour Modifier et Supprimer.',
  'help.guide.day-note.result':
    'La note fait partie du jour, dans le PDF aussi ; une note avec une heure se range avec les étapes qui en ont une.',
  'help.guide.day-note.tip.1':
    'Une note avec une heure peut tenir lieu de transport pour lequel vous n’avez pas de réservation : « 08:15 S3 depuis la gare centrale ».',
  'help.guide.day-note.tip.2':
    'Les notes valent pour un jour ; une note pour tout le voyage a sa place dans Collaboration.',
  // day-route
  'help.guide.day-route.title': 'Afficher et optimiser l’itinéraire du jour',
  'help.guide.day-route.goal':
    'Voir le chemin entre les étapes, choisir comment vous voyagez, et laisser TREK trier l’ordre.',
  'help.guide.day-route.step.1':
    'Ouvrez le jour et cliquez sur Itinéraire dans la barre d’itinéraire : le chemin entre les étapes se trace sur la carte, et les connecteurs entre les étapes affichent le temps et la distance de chaque tronçon.',
  'help.guide.day-route.step.2':
    'Voiture et Marche à côté règlent le mode de transport du jour ; les tronçons se recalculent. Des plugins peuvent ajouter leurs propres modes.',
  'help.guide.day-route.step.3':
    'Cliquez sur un connecteur pour changer le mode de ce seul tronçon : choisissez un mode, ou Utiliser le mode du jour pour revenir à celui du jour.',
  'help.guide.day-route.step.4':
    'Optimiser réordonne les étapes par le chemin le plus court. Les étapes avec un cadenas ou une heure fixe gardent leur place ; avec un hébergement sur le jour, l’itinéraire part de là.',
  'help.guide.day-route.step.5':
    'Ouvrir dans Google Maps ou Ouvrir dans CoMaps ouvre le jour entier comme itinéraire dans cette application, pour naviguer en route.',
  'help.guide.day-route.result':
    'Le jour est un itinéraire avec des horaires ; Coût total et les tronçons se mettent à jour quand l’ordre change.',
  'help.guide.day-route.tip.1':
    'Les itinéraires viennent d’OSRM par défaut ; l’administrateur peut pointer TREK vers un autre moteur de calcul sous Valeurs par défaut.',
  'help.guide.day-route.tip.2':
    'Un tronçon qui n’a pas pu être calculé n’affiche pas de temps ; vérifiez que les deux étapes ont des coordonnées.',
  'help.guide.day-route.tip.3': 'La flèche Annuler annule une optimisation.',
  // manage-days
  'help.guide.manage-days.title': 'Ajouter, réorganiser et renommer des jours',
  'help.guide.manage-days.goal': 'Façonner les jours eux-mêmes, pas seulement ce qu’il y a dessus.',
  'help.guide.manage-days.step.1':
    'Les jours viennent des dates du voyage ; changez les dates sur la carte du voyage sous Tableau de bord et des jours sont ajoutés ou retirés aux extrémités. Avant qu’un jour avec du contenu ne soit retiré, une liste indique quels jours partent et ce qu’ils contiennent.',
  'help.guide.manage-days.step.2':
    'Réorganiser les jours dans la barre d’outils ouvre une liste : Monter et Descendre décalent un jour avec tout ce qu’il porte, et Supprimer le jour, la corbeille à côté, le retire. Sous la liste, le bouton avec la date suivante ajoute un jour juste après le dernier jour daté et prolonge le voyage d’un jour ; Sans date ajoute un jour sans date à la fin.',
  'help.guide.manage-days.step.3':
    'Supprimer le jour demande d’abord : la liste montre ce qui part avec le jour, ses lieux, notes et réservations, un hébergement dont l’arrivée ou le départ tombe ce jour-là et les jours qui avancent d’une date. Supprimer le jour le retire, Annuler le garde ; le dernier jour ne peut pas être supprimé.',
  'help.guide.manage-days.step.4':
    'Pour renommer un jour, ouvrez-le et cliquez sur le crayon à côté de son titre dans les Détails du jour au-dessus de la carte ; le nom remplace Jour 1 dans la carte et dans le PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days et Collapse all days dans la barre d’outils replient toutes les cartes d’un coup ; une carte seule se replie avec son chevron.',
  'help.guide.manage-days.result':
    'Les dates restent attachées à la position : un jour monté prend la date antérieure, ses étapes, ses notes et ses réservations voyagent avec lui.',
  'help.guide.manage-days.tip.1':
    'Déplacer des jours peut être annulé depuis la barre d’outils ; supprimer un jour, non.',
  'help.guide.manage-days.tip.2':
    'Le coût dans l’en-tête d’un jour additionne les étapes et les réservations de ce jour qui portent un prix.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Lire les réservations et les transports dans le plan',
  'help.guide.bookings-in-plan.goal':
    'Savoir où une réservation apparaît une fois qu’elle existe, et quel écran la crée.',
  'help.guide.bookings-in-plan.step.1':
    'Un transport (Vol, Train, Ferry, Bus, Voiture) s’affiche le jour de son départ comme Départ et le jour de son arrivée comme Arrivée, avec heure et trajet ; un transport sur plusieurs jours couvre les jours intermédiaires.',
  'help.guide.bookings-in-plan.step.2':
    'Une réservation liée à une étape (un Restaurant, une Visite) marque cette étape Réservation confirmée ou Réservation en attente ; une réservation avec un jour mais sans étape forme sa propre ligne dans le jour.',
  'help.guide.bookings-in-plan.step.3':
    'Une nuit à l’hôtel est un hébergement : elle se trouve dans les Détails du jour sous Hébergement, de l’Arrivée au Départ, et l’itinéraire de chacun de ces jours part de là.',
  'help.guide.bookings-in-plan.step.4':
    'Sur la carte, l’interrupteur d’une ligne de transport trace son itinéraire ; Afficher tous les itinéraires dans la barre d’outils les trace tous.',
  'help.guide.bookings-in-plan.step.5':
    'Pour créer : Ajouter une réservation sur une étape survolée, Ajouter un transport et Transports en commun dans l’en-tête du jour, et les onglets Réservations et Transports pour la liste complète avec import et fichiers.',
  'help.guide.bookings-in-plan.result':
    'Une réservation, une place dans le plan ; les onglets montrent les mêmes réservations sous forme de liste.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmée et En attente est un statut que vous posez sur la réservation ; le plan l’affiche sur l’étape, l’onglet Réservations compte les deux.',
  'help.guide.bookings-in-plan.tip.2':
    'Un transport à heure fixe ne peut pas être glissé ; changez plutôt son heure dans la réservation.',
  // export-plan
  'help.guide.export-plan.title': 'Exporter le plan',
  'help.guide.export-plan.goal': 'Emporter le plan comme document, dans votre agenda ou sur un GPS.',
  'help.guide.export-plan.step.1': 'Cliquez sur Exporter dans la barre d’outils au-dessus des jours.',
  'help.guide.export-plan.step.2':
    'Document : PDF ouvre la vue d’impression de chaque jour avec ses étapes, ses notes et ses réservations ; Saut de page par jour commence chaque jour sur une nouvelle page, Enregistrer en PDF le télécharge.',
  'help.guide.export-plan.step.3':
    'Agenda : Télécharger le .ics enregistre les réservations comme fichier de calendrier ; S’abonner au calendrier donne un lien que votre application d’agenda actualise d’elle-même.',
  'help.guide.export-plan.step.4':
    'Cartes et GPS · GPX : Tout le voyage exporte les lieux, les itinéraires des jours et les traces ; Lieux uniquement les points ; Journées en itinéraires un itinéraire par jour, pour les cartes hors ligne et les appareils GPS.',
  'help.guide.export-plan.result': 'Le fichier se télécharge ; rien ne change dans le voyage.',
  'help.guide.export-plan.tip.1':
    'Un jour seul part vers une application de cartes depuis sa barre d’itinéraire : Ouvrir dans Google Maps ou Ouvrir dans CoMaps.',
  'help.guide.export-plan.tip.2':
    'S’abonner au calendrier demande que les flux de calendrier soient activés dans vos réglages ; Tableau de bord a un guide pour cela.',
  'help.guide.export-plan.tip.3': 'Exporter, c’est lire : chaque membre du voyage peut le faire.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Détails du lieu',
  'help.ctx.trip-place.summary':
    'La fiche qui s’ouvre par-dessus la carte quand vous choisissez un lieu : tout ce que le voyage sait de lui, les étoiles que chacun lui a données, son image et ses fichiers, et les boutons qui le posent sur le jour ouvert, dans une liste ou dans une application de cartes.',
  'help.ctx.trip-place.bullet.1':
    'Cliquez sur une ligne dans la colonne des lieux, sur une étape dans un jour ou sur un marqueur sur la carte, et la fiche s’ouvre par-dessus la carte. La choisir dans un jour dit à la fiche de quelle étape il s’agit, et c’est ce qui amène les participants de l’étape et sa réservation.',
  'help.ctx.trip-place.bullet.2':
    'L’en-tête porte l’image ronde, le nom, la catégorie, l’adresse et les coordonnées. Cliquez sur l’image pour en mettre une à vous, double-cliquez sur le nom pour renommer le lieu sur place, et le X à droite ferme la fiche.',
  'help.ctx.trip-place.bullet.3':
    'En dessous : le prix s’il en a un, les étoiles que chaque voyageur a données au lieu, la description et les notes, et Notes pour ce jour quand l’étape en porte.',
  'help.ctx.trip-place.bullet.4':
    'Horaires d’ouverture, Couleur du parcours, Données du parcours et Fichiers suivent, dans la mesure où ils s’appliquent. Fichiers prend n’importe quoi dans vos dossiers et liste aussi ce qui est accroché à la réservation de cette étape.',
  'help.ctx.trip-place.bullet.5':
    'La ligne du bas : Ajouter au jour ou Retirer du jour tant qu’un jour est ouvert, puis Enregistrer dans une collection, Navigation, Ouvrir le site web, Modifier et Supprimer.',
  'help.ctx.trip-place.bullet.6':
    'Un lieu choisi dans la recherche porte ce que l’index TREK ou OpenStreetMap savent de lui : un anneau vert Ouvert ou rouge Fermé autour de l’image, jugé à l’heure du lieu lui-même, le numéro de téléphone sous les étoiles, Horaires d’ouverture plus bas avec la ligne du jour sur la ligne et toute la semaine derrière un clic, et son site web derrière Ouvrir le site web. La note de Google ne s’affiche que sur un lieu trouvé par Google, sur un TREK avec une clé Google.',
  // read-place
  'help.guide.read-place.title': 'Ce que la fiche vous dit d’un lieu',
  'help.guide.read-place.goal': 'Lisez tout ce que le voyage sait d’un lieu, dans une seule fiche.',
  'help.guide.read-place.step.1':
    'Dans la colonne des jours, cliquez sur l’étape que vous voulez lire. La fiche s’ouvre par-dessus la carte et l’étape reste marquée dans son jour.',
  'help.guide.read-place.step.2':
    'L’en-tête : l’image ronde, le nom, l’adresse et les coordonnées exactes. Un anneau vert avec Ouvert, ou rouge avec Fermé, autour de l’image dit si le lieu est ouvert en ce moment, à sa propre heure, dès que TREK connaît ses horaires. Le X à droite referme la fiche.',
  'help.guide.read-place.step.3':
    'En dessous, les étoiles que chaque voyageur a données au lieu, avec la moyenne et le nombre de votants. Pas encore noté tant que personne n’a voté. Juste en dessous, le numéro de téléphone quand le lieu en a un : un clic dessus passe le numéro à votre application de téléphone.',
  'help.guide.read-place.step.4':
    'Puis la description et, en dessous, les notes. Les deux sont le texte du formulaire du lieu, rendu : listes, liens et gras fonctionnent.',
  'help.guide.read-place.step.5':
    'Participants dit qui va à cette étape. Tout le monde en est tant que vous n’en retirez personne.',
  'help.guide.read-place.step.6':
    'Horaires d’ouverture, plus bas : la ligne porte les horaires du jour que vous regardez, et un clic dessus déplie toute la semaine avec ce jour en gras. Fichiers se trouve à côté.',
  'help.guide.read-place.result':
    'La fiche reste ouverte jusqu’à ce que vous la fermiez avec le X ou choisissiez un autre lieu, les horaires de la semaine restent dépliés, et l’étape à laquelle elle appartient reste marquée dans la colonne des jours.',
  'help.guide.read-place.tip.1':
    'Choisie depuis la colonne des lieux, la fiche connaît le lieu mais pas d’étape, elle ne montre donc ni participants ni réservation. Choisissez plutôt l’étape dans le jour et les deux sont là.',
  'help.guide.read-place.tip.2':
    'Double-cliquez sur le nom pour renommer le lieu sans ouvrir le formulaire. Entrée enregistre, Échap abandonne la modification.',
  'help.guide.read-place.tip.3':
    'Un lieu saisi à la main ne montre rien de tout cela : la fiche ne connaît que ce que contient son formulaire. Ouvrez-le avec Modifier, choisissez-le dans les suggestions sous Rechercher des lieux… et cliquez sur Mettre à jour, et les horaires, le numéro de téléphone et le site web viennent avec. La note de Google demande une clé Google.',
  // rate-place
  'help.guide.rate-place.title': 'Noter un lieu',
  'help.guide.rate-place.goal':
    'Donnez vos propres étoiles à un lieu, et voyez celles que tous les autres lui ont données.',
  'help.guide.rate-place.step.1':
    'Ouvrez le lieu. La ligne d’étoiles se trouve juste sous l’en-tête et porte la moyenne des votes existants, avec leur nombre entre parenthèses.',
  'help.guide.rate-place.step.2':
    'Cliquez sur l’étoile que vous visez. Les étoiles se remplissent à mesure que vous les parcourez, vous voyez donc ce que vous êtes sur le point de donner.',
  'help.guide.rate-place.step.3':
    'Votre vote entre tout de suite dans la moyenne, et les visages à côté sont ceux qui ont voté. Laissez le pointeur sur la ligne pour voir les étoiles de chacun.',
  'help.guide.rate-place.step.4':
    'La même moyenne est sur la ligne du lieu dans la colonne des lieux, ainsi les bons ressortent dans la liste.',
  'help.guide.rate-place.result':
    'Vos étoiles sont sur le lieu, visibles par tout le voyage, et l’étoile de la ligne de filtres au-dessus de la liste peut maintenant ne garder que les lieux qui atteignent un seuil.',
  'help.guide.rate-place.tip.1':
    'Chaque voyageur peut noter, même sur un voyage où seuls certains ont le droit Ajouter / modifier / supprimer des lieux.',
  'help.guide.rate-place.tip.2':
    'Cliquez sur l’étoile que vous avez déjà donnée pour reprendre votre vote. Sans personne pour voter, le lieu affiche de nouveau Pas encore noté.',
  'help.guide.rate-place.tip.3':
    'Jusqu’à six votants tiennent à côté des étoiles sous forme de visages ; l’infobulle les nomme tous, et marque le vôtre.',
  // place-image
  'help.guide.place-image.title': 'Mettre votre propre image sur un lieu',
  'help.guide.place-image.goal': 'Remplacez la vignette automatique par une photo à vous.',
  'help.guide.place-image.step.1': 'Ouvrez le lieu depuis la colonne des lieux.',
  'help.guide.place-image.step.2':
    'Laissez le pointeur sur l’image ronde de l’en-tête : un appareil photo apparaît et l’infobulle affiche Importer une image. Cliquez dessus et choisissez votre fichier.',
  'help.guide.place-image.step.3': 'L’en-tête montre maintenant votre image, avec un petit X rouge dans son coin.',
  'help.guide.place-image.step.4':
    'La même image est sur la ligne du lieu dans la colonne des lieux, et sur son marqueur sur la carte.',
  'help.guide.place-image.result':
    'Votre image est l’image du lieu partout : la fiche, la colonne des lieux, l’étape dans le jour, le marqueur sur la carte et un voyage partagé.',
  'help.guide.place-image.tip.1': 'JPG, PNG, GIF et WebP sont acceptés, et un HEIC d’iPhone est converti au passage.',
  'help.guide.place-image.tip.2':
    'Le X du coin retire votre image et l’automatique revient. Le lieu lui-même n’est pas touché.',
  'help.guide.place-image.tip.3':
    'Sans image à vous, TREK en cherche une à partir des coordonnées du lieu, et se rabat sur l’icône de la catégorie.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Poser le lieu sur le jour ouvert, ou l’en retirer',
  'help.guide.place-day-assign.goal': 'Utilisez le bouton de la fiche au lieu de glisser la ligne à travers le plan.',
  'help.guide.place-day-assign.step.1':
    'Cliquez sur l’en-tête d’un jour dans la colonne des jours. Ce jour est le jour ouvert désormais, et la fiche travaille avec lui.',
  'help.guide.place-day-assign.step.2':
    'Cliquez dans la colonne des lieux sur un lieu qui n’est pas sur ce jour. Sa fiche s’ouvre et la ligne du bas propose Ajouter au jour.',
  'help.guide.place-day-assign.step.3':
    'Cliquez sur Ajouter au jour. L’étape se pose à la fin du jour et le bouton devient Retirer du jour.',
  'help.guide.place-day-assign.step.4':
    'L’étape est dans le jour, en dernier dans la liste. Glissez-la vers le haut jusqu’à sa place.',
  'help.guide.place-day-assign.step.5':
    'Retirer du jour enlève de nouveau cette étape du jour, et la fiche propose encore Ajouter au jour.',
  'help.guide.place-day-assign.result':
    'Le jour porte l’étape, ou ne la porte plus, et le lieu lui-même n’est pas touché dans un cas comme dans l’autre.',
  'help.guide.place-day-assign.tip.1':
    'Le bouton n’existe que tant qu’un jour est ouvert. Sans jour, la fiche n’a rien sur quoi poser le lieu.',
  'help.guide.place-day-assign.tip.2':
    'Retirer une étape d’un jour laisse le lieu dans le voyage et dans la colonne des lieux. C’est Supprimer qui l’enlève partout.',
  'help.guide.place-day-assign.tip.3':
    'Une étape qu’une réservation d’hébergement a posée sur le jour ne propose aucun des deux boutons : cette nuit s’ajoute et se retire dans le bloc Hébergement du jour.',
  // place-participants
  'help.guide.place-participants.title': 'Dire qui va à cette étape',
  'help.guide.place-participants.goal': 'Séparez le groupe pour une étape sans séparer le voyage.',
  'help.guide.place-participants.step.1':
    'Cliquez sur l’étape dans le jour. La fiche s’ouvre et Participants liste tout le monde dans le voyage.',
  'help.guide.place-participants.step.2':
    'Cliquez sur le nom d’un voyageur pour le retirer de cette étape. Le nom est barré quand vous le survolez.',
  'help.guide.place-participants.step.3':
    'Un + en pointillés apparaît dès que quelqu’un manque. Cliquez dessus pour voir qui n’est pas sur l’étape.',
  'help.guide.place-participants.step.4':
    'Cliquez sur un nom pour le remettre. Une fois tout le monde revenu, l’étape est de nouveau celle du groupe entier.',
  'help.guide.place-participants.result':
    'L’étape porte les voyageurs que vous avez choisis, et le reste du groupe a cet après-midi pour lui.',
  'help.guide.place-participants.tip.1':
    'Participants n’apparaît qu’avec une étape sélectionnée, choisissez donc le lieu dans le jour plutôt que dans la colonne des lieux, et seulement sur un voyage à plus d’un voyageur.',
  'help.guide.place-participants.tip.2':
    'Personne de choisi veut dire que tout le monde y va, et c’est pour cela que le dernier voyageur restant sur une étape ne peut pas être retiré.',
  'help.guide.place-participants.tip.3':
    'Un invité, qui n’a pas de compte à lui, peut être participant comme n’importe qui.',
  // place-booking
  'help.guide.place-booking.title': 'La réservation sur une étape',
  'help.guide.place-booking.goal':
    'Lisez la réservation qui appartient à une étape, ouvrez-la, et accrochez-en une nouvelle à cette étape.',
  'help.guide.place-booking.step.1':
    'Ouvrez l’étape à laquelle appartient la réservation. La fiche montre un bandeau avec Confirmée ou En attente et le nom de la réservation.',
  'help.guide.place-booking.step.2':
    'Le bandeau porte la Date, l’Heure et le Code de réservation, ainsi que les notes de la réservation.',
  'help.guide.place-booking.step.3': 'Cliquez sur le bandeau. Le formulaire de la réservation s’ouvre dessus.',
  'help.guide.place-booking.step.4':
    'Lier à l’affectation du jour est ce qui accroche une réservation à une étape, et ici il nomme déjà celle-ci. Refermez le formulaire.',
  'help.guide.place-booking.step.5':
    'Une nouvelle réservation pour une étape commence dans la colonne des jours : survolez l’étape et cliquez sur le + à son bout. Le formulaire s’ouvre en Nouvelle réservation, déjà liée à elle.',
  'help.guide.place-booking.result':
    'La réservation est accrochée à l’étape : elle est sur la fiche, elle est dans le jour, et ses fichiers sont listés sous Fichiers ici aussi.',
  'help.guide.place-booking.tip.1':
    'Le bandeau ne s’affiche que pour l’étape à laquelle la réservation est accrochée. Une réservation sans étape vit dans l’onglet Résa.',
  'help.guide.place-booking.tip.2':
    'Plusieurs réservations peuvent partager une étape : le déjeuner et la visite qui part de la même porte.',
  'help.guide.place-booking.tip.3':
    'Un train, un vol ou un ferry ouvre à la place le formulaire de transport, celui qu’utilise l’onglet Transports.',
  // place-files
  'help.guide.place-files.title': 'Garder les billets d’un lieu avec le lieu',
  'help.guide.place-files.goal': 'Mettez le billet, le bon ou le plan d’un lieu là où vous le chercherez.',
  'help.guide.place-files.step.1':
    'Ouvrez le lieu. Fichiers se trouve au pied de la fiche et affiche Fichiers tant que le lieu n’en a aucun.',
  'help.guide.place-files.step.2': 'Cliquez sur Importer à côté et choisissez le fichier.',
  'help.guide.place-files.step.3': 'Le bouton compte ce que le lieu détient, et la liste s’ouvre d’elle-même.',
  'help.guide.place-files.step.4':
    'Chaque ligne est le nom du fichier avec sa taille. Cliquez dessus pour ouvrir le fichier.',
  'help.guide.place-files.result':
    'Le fichier est sur le lieu, compté dans la fiche, et il est aussi dans l’onglet Fichiers du voyage.',
  'help.guide.place-files.tip.1':
    'Fichiers liste aussi ce qui est accroché à la réservation de cette étape, une confirmation d’hôtel apparaît donc sur l’hôtel.',
  'help.guide.place-files.tip.2': 'Importer prend plusieurs fichiers à la fois.',
  'help.guide.place-files.tip.3':
    'Sans le droit Télécharger des fichiers, le bouton Importer n’est pas là ; les fichiers déjà sur le lieu y restent.',
  // place-navigation
  'help.guide.place-navigation.title': 'Ouvrir un lieu dans une application de cartes ou sur son site',
  'help.guide.place-navigation.goal': 'Confiez le lieu à l’application qui vous y emmènera vraiment.',
  'help.guide.place-navigation.step.1': 'Ouvrez le lieu et cliquez sur Navigation dans la ligne du bas.',
  'help.guide.place-navigation.step.2':
    'La liste, ce sont les applications de cartes qui conviennent à ce lieu : Google Maps, Waze, Apple Maps, OpenStreetMap et CoMaps.',
  'help.guide.place-navigation.step.3':
    'Cliquez sur celle que vous utilisez. TREK lui passe le lieu lui-même quand il le peut, pas seulement un couple de coordonnées, vous arrivez donc à la bonne entrée.',
  'help.guide.place-navigation.step.4':
    'Ouvrir le site web à côté ouvre la page du lieu, ses horaires et ses billets, dans un nouvel onglet.',
  'help.guide.place-navigation.result':
    'L’application de cartes s’ouvre sur le lieu, le site dans un onglet à lui, et rien ne change dans le voyage.',
  'help.guide.place-navigation.tip.1':
    'Waze démarre la navigation tout de suite. Les autres ouvrent le lieu, et partir de là demande un appui de plus.',
  'help.guide.place-navigation.tip.2':
    'Les applications proposées dépendent du lieu et de votre appareil : Apple Maps est écarté sur Android, 高德地图 ne sort que pour un lieu en Chine, et Waze, Apple Maps et CoMaps ont besoin des coordonnées du lieu.',
  'help.guide.place-navigation.tip.3':
    'Quand une seule application s’applique, le bouton porte le nom de cette application et l’ouvre directement.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Enregistrer un lieu dans une de vos listes',
  'help.guide.place-to-collection.goal': 'Gardez pour le prochain voyage un lieu trouvé sur celui-ci.',
  'help.guide.place-to-collection.step.1':
    'Ouvrez le lieu et cliquez sur Enregistrer dans une collection en bas de la fiche.',
  'help.guide.place-to-collection.step.2':
    'Enregistrer dans une liste montre toutes les listes qui sont à vous ou que vous partagez. Une coche marque celles qui contiennent déjà ce lieu.',
  'help.guide.place-to-collection.step.3': 'Cliquez sur la liste. Le lieu y est tout de suite.',
  'help.guide.place-to-collection.step.4': 'Fermez, et le bouton de la fiche affiche Enregistré.',
  'help.guide.place-to-collection.result':
    'Le lieu est dans votre liste avec son image, ses notes et son adresse, prêt pour le prochain voyage.',
  'help.guide.place-to-collection.tip.1':
    'Le bouton n’est là que tant que l’extension Collections est active, ce que l’administrateur règle sous Extensions.',
  'help.guide.place-to-collection.tip.2':
    'Un lieu peut se trouver dans plusieurs listes à la fois, avec son propre statut dans chacune : une Idée dans l’une, Visité dans l’autre.',
  'help.guide.place-to-collection.tip.3':
    'Marquer comme visité, à côté du nom du lieu dans le sélecteur, le coche dans la liste ; avec le lieu dans plusieurs de vos listes, la pastille affiche Visité partout et les fait toutes d’un coup.',
  // place-track
  'help.guide.place-track.title': 'Lire une trace et lui donner sa propre couleur',
  'help.guide.place-track.goal':
    'Voyez la longueur d’une marche importée, et distinguez son tracé des autres sur la carte.',
  'help.guide.place-track.step.1':
    'Dans la colonne des lieux, la ligne d’une trace porte un court trait de la couleur dans laquelle son tracé est dessiné. Cliquez dessus.',
  'help.guide.place-track.step.2':
    'Données du parcours donne la longueur du chemin, dans l’Unité de distance que vous avez réglée.',
  'help.guide.place-track.step.3':
    'Couleur du parcours au-dessus montre la couleur en usage. Cliquez sur la ligne pour ouvrir les échantillons.',
  'help.guide.place-track.step.4':
    'Choisissez une couleur. Le tracé sur la carte et le trait de la ligne changent avec elle.',
  'help.guide.place-track.step.5':
    'La case en pointillés à gauche, Couleur automatique, rend à la trace la couleur dont elle hérite ; la pipette à droite ouvre le sélecteur de couleur de votre système pour tout le reste.',
  'help.guide.place-track.result':
    'La trace est dessinée dans la couleur que vous avez choisie, dans la fiche, sur sa ligne dans la colonne des lieux et sur la carte.',
  'help.guide.place-track.tip.1':
    'Seul un lieu qui porte un chemin, importé d’un fichier GPX, KML ou KMZ, a ces deux blocs.',
  'help.guide.place-track.tip.2':
    'Une trace enregistrée avec les altitudes montre aussi son point le plus haut et le plus bas, les mètres de montée et de descente, et le profil de la marche.',
  'help.guide.place-track.tip.3':
    'Un import donne à chaque trace qu’il amène une couleur à elle, deux marches n’arrivent donc jamais dans la même.',
  // read-place
  'help.guide.read-place.step.7':
    'La ligne du bas est ce que vous pouvez faire d’ici : retirer le lieu du jour ouvert ou l’y poser, l’enregistrer dans une liste, l’ouvrir dans une application de cartes, le modifier ou le supprimer.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Fichiers',
  'help.ctx.trip-files.summary':
    'Tous les documents du voyage en une seule liste : billets, confirmations, cartes et photos, chacun avec une note, un lien vers le lieu ou la réservation auquel il appartient, et une corbeille d’où il peut ressortir.',
  'help.ctx.trip-files.bullet.1':
    'Déposez les fichiers ici, en haut, prend les fichiers ; un clic sur la zone ouvre le sélecteur de fichiers. La ligne en dessous indique les types de fichiers que ce TREK accepte et la limite de 50 MB par fichier.',
  'help.ctx.trip-files.bullet.2':
    'Les onglets disent ce que la liste montre : Tous, PDF, Images et Documents, chacun avec son compte. Un onglet étoile les rejoint dès qu’un fichier est en favori, Notes Collab dès qu’une note porte une pièce jointe.',
  'help.ctx.trip-files.bullet.3':
    'Une ligne porte qui l’a importé, le nom, la note en dessous, la taille et la date, et un badge par lien : Plan du jour et le lieu, Réservation ou Transport et la réservation, Depuis les notes Collab.',
  'help.ctx.trip-files.bullet.4':
    'Au bout d’une ligne se trouvent Favori, Assigner, Ouvrir, Télécharger et Supprimer. Supprimer ne demande rien : le fichier part à la corbeille, d’où il peut être ramené.',
  'help.ctx.trip-files.bullet.5':
    'Une image ou une vidéo s’ouvre en plein écran, avec les touches fléchées et une bande de miniatures ; tout autre document s’ouvre dans un aperçu par-dessus la page, avec Ouvrir dans un nouvel onglet et Télécharger. Une carte de wallet est téléchargée aussitôt.',
  'help.ctx.trip-files.bullet.6':
    'Corbeille, tout à droite, fait basculer la liste sur les fichiers supprimés, où chacun est restauré ou supprimé définitivement et où Vider la corbeille les enlève tous. Là où un administrateur a connecté un stockage de documents, Synchronisation des documents se trouve juste à côté.',
  // files-upload
  'help.guide.files-upload.title': 'Mettre un document dans le voyage',
  'help.guide.files-upload.goal':
    'Sortez un billet, une confirmation ou une photo de votre dossier de téléchargements et mettez-les dans le voyage, où tous ceux qui en font partie peuvent les atteindre.',
  'help.guide.files-upload.step.1':
    'Ouvrez le voyage et cliquez sur Fichiers dans la barre d’onglets. Les documents du voyage y sont listés, avec la zone d’import au-dessus.',
  'help.guide.files-upload.step.2':
    'Cliquez sur Déposez les fichiers ici et choisissez un ou plusieurs fichiers. Ils sont importés l’un après l’autre et la zone affiche Importation… pendant l’opération. La ligne sous la zone dit quels types ce TREK accepte, et qu’un fichier peut faire 50 MB au maximum.',
  'help.guide.files-upload.step.3':
    'Dès que le dernier fichier est en place, Assigner le fichier s’ouvre tout seul pour lui. Ajouter une note… donne au fichier une ligne à lui, et les listes en dessous le rattachent à un lieu ou à une réservation. Fermez avec le × ; rien n’est perdu en fermant.',
  'help.guide.files-upload.step.4':
    'Les nouveaux fichiers se trouvent en haut de la liste. Une ligne montre qui l’a importé, le nom, la taille et la date ; une image reçoit une miniature, tout autre fichier son type.',
  'help.guide.files-upload.result':
    'Les documents sont dans le voyage, et tous ceux qui voient le voyage peuvent les ouvrir et les télécharger.',
  'help.guide.files-upload.tip.1':
    'Un fichier peut aussi être glissé du bureau directement sur la zone, qui s’illumine tant que le fichier est au-dessus.',
  'help.guide.files-upload.tip.2':
    'Une image dans le presse-papiers entre dans la liste avec Ctrl+V, si bien qu’une capture d’écran d’une réservation n’a jamais besoin d’être enregistrée d’abord.',
  'help.guide.files-upload.tip.3':
    'Importer demande le droit Télécharger des fichiers ; sans lui la zone n’est pas là du tout. Un type qui n’est pas sur la liste est refusé avec un message et rien n’est importé. Un fichier de plus de 50 MB est écarté par la zone elle-même, avant que quoi que ce soit ne parte.',
  // files-link
  'help.guide.files-link.title': 'Rattacher un document à un lieu ou à une réservation',
  'help.guide.files-link.goal':
    'Rendez le billet trouvable depuis le jour auquel il appartient, et pas seulement depuis cette liste.',
  'help.guide.files-link.step.1':
    'Cliquez sur Assigner, le crayon au bout de la ligne. Assigner le fichier s’ouvre, au nom du fichier.',
  'help.guide.files-link.step.2':
    'Sous Note, Ajouter une note… prend une ligne, qui apparaît ensuite sous le nom du fichier dans la liste. Elle est enregistrée dès que vous quittez le champ.',
  'help.guide.files-link.step.3':
    'Sous Lieu se trouvent les lieux du voyage, groupés par le jour où ils sont, avec Non attribué à la fin pour ceux qui ne sont sur aucun jour. Cliquez sur l’un d’eux et il reçoit une coche.',
  'help.guide.files-link.step.4':
    'Sous Réservation et Transport se trouvent les réservations du voyage. Cliquez sur celle à laquelle le document appartient ; elle reçoit sa coche elle aussi.',
  'help.guide.files-link.step.5':
    'Fermez avec le ×. Il n’y a pas de bouton d’enregistrement ici : chaque clic a été écrit au moment où vous l’avez fait.',
  'help.guide.files-link.result':
    'La ligne porte la note et un badge par lien, Plan du jour et le nom du lieu, Transport et le nom du vol, et le document est aussi accroché au lieu et au vol.',
  'help.guide.files-link.tip.1':
    'Un fichier peut tenir plusieurs liens à la fois, si bien que la même confirmation appartient à l’hôtel et à la nuit qu’elle couvre.',
  'help.guide.files-link.tip.2': 'Cliquer de nouveau sur une entrée cochée retire ce lien ; le fichier lui-même reste.',
  'help.guide.files-link.tip.3':
    'Cela marche aussi dans l’autre sens : un document attaché à un lieu ou à une réservation est dans cette liste également, avec le même badge sur sa ligne.',
  // files-star
  'help.guide.files-star.title': 'Garder les documents importants en haut',
  'help.guide.files-star.goal':
    'Sortez d’une liste qui grossit tout au long du voyage les deux ou trois papiers dont vous aurez vraiment besoin.',
  'help.guide.files-star.step.1':
    'Cliquez sur Favori au bout d’une ligne. L’étoile se remplit de jaune, une deuxième étoile apparaît devant le nom du fichier, et le bouton affiche maintenant Retirer des favoris.',
  'help.guide.files-star.step.2':
    'La liste se retrie : les fichiers en favori passent au-dessus de tous les autres, du plus récent au plus ancien dans chaque groupe.',
  'help.guide.files-star.step.3':
    'Une étoile a rejoint les onglets en haut, avec le nombre de fichiers en favori derrière elle. Cliquez dessus pour ne voir que ceux-là.',
  'help.guide.files-star.result':
    'Les papiers dont vous avez besoin au guichet sont en haut de la liste, et un onglet ne montre rien d’autre.',
  'help.guide.files-star.tip.1':
    'L’onglet étoile n’existe que tant que quelque chose est en favori. Retirez des favoris le dernier fichier et l’onglet disparaît avec lui.',
  'help.guide.files-star.tip.2':
    'Mettre en favori compte comme une modification : un membre qui peut seulement lire les fichiers du voyage voit les étoiles mais ne peut pas les poser.',
  // files-filter
  'help.guide.files-filter.title': 'Trouver un document dans la liste',
  'help.guide.files-filter.goal': 'Réduisez une liste de tout au seul genre de papier que vous cherchez.',
  'help.guide.files-filter.step.1':
    'Les onglets au-dessus de la liste sont Tous, PDF, Images et Documents, chacun avec le nombre de fichiers derrière lui.',
  'help.guide.files-filter.step.2': 'Cliquez sur PDF : la liste garde les fichiers PDF et rien d’autre.',
  'help.guide.files-filter.step.3':
    'Deux autres onglets vont et viennent selon ce qu’il y a dans le voyage. Cliquez sur Notes Collab, qui est là dès qu’une note de l’onglet Collaboration porte une pièce jointe : la liste garde ces fichiers et rien d’autre. Une étoile rejoint la rangée de la même façon, dès qu’un fichier est en favori.',
  'help.guide.files-filter.step.4': 'Tous ramène la liste entière.',
  'help.guide.files-filter.result':
    'La liste ne montre que ce que l’onglet nomme, et le compte sur chaque onglet dit combien cela fait.',
  'help.guide.files-filter.tip.1':
    'Il n’y a pas de dossiers ici ni de renommage : la note dans Assigner le fichier, les liens vers les lieux et les réservations, et l’étoile sont ce par quoi un document est trié.',
  'help.guide.files-filter.tip.2':
    'La liste elle-même est toujours favoris d’abord, puis du plus récent au plus ancien, si bien qu’un document importé aujourd’hui passe au-dessus d’un document du mois dernier.',
  // files-preview
  'help.guide.files-preview.title': 'Lire un document sans quitter TREK',
  'help.guide.files-preview.goal':
    'Regardez un billet ou une image sur place, et mettez-les sur votre propre machine quand c’est là que vous en avez besoin.',
  'help.guide.files-preview.step.1':
    'Cliquez sur le nom d’une image ou sur sa miniature. Elle s’ouvre en plein écran, avec le nom du fichier et sa place dans les images dans l’en-tête.',
  'help.guide.files-preview.step.2':
    'Les flèches rondes sur les côtés, les touches fléchées gauche et droite et la bande de miniatures en bas parcourent toutes les images que la liste montre à cet instant.',
  'help.guide.files-preview.step.3':
    'Ouvrir dans un nouvel onglet et Télécharger se trouvent dans l’en-tête ; le × ou Échap referme l’image.',
  'help.guide.files-preview.step.4':
    'Un document qui n’est pas une image s’ouvre à la place dans un aperçu par-dessus la page, avec les deux mêmes boutons dans son en-tête. Celui-ci se ferme sur le × ou sur un clic à côté.',
  'help.guide.files-preview.step.5':
    'Télécharger au bout d’une ligne enregistre le fichier directement sur votre machine, sans rien ouvrir d’abord.',
  'help.guide.files-preview.result':
    'Le document est à l’écran, et les deux mêmes boutons le mettent dans un onglet du navigateur ou sur votre disque.',
  'help.guide.files-preview.tip.1':
    'Sur un écran tactile, vous balayez à travers les images au lieu de cliquer sur les flèches.',
  'help.guide.files-preview.tip.2':
    'Une carte de wallet n’ouvre jamais d’aperçu : elle est téléchargée aussitôt, pour que le téléphone puisse la remettre à son application wallet.',
  'help.guide.files-preview.tip.3':
    'Ouvrir dans un nouvel onglet et Télécharger vont tous deux chercher le fichier avec votre session, si bien qu’un lien copié depuis la barre d’adresse ne sert à personne d’autre.',
  // files-trash
  'help.guide.files-trash.title': 'Jeter un document, et le récupérer',
  'help.guide.files-trash.goal':
    'Faites le ménage de ce dont le voyage n’a plus besoin, sans perdre ce dont vous aviez besoin malgré tout.',
  'help.guide.files-trash.step.1':
    'Cliquez sur Supprimer au bout d’une ligne. Le fichier quitte la liste aussitôt et le message affiche Déplacé dans la corbeille. Rien ne demande avant.',
  'help.guide.files-trash.step.2':
    'Corbeille, au bout droit de la barre d’outils, fait basculer la liste sur ce qui a été jeté. Le titre affiche Corbeille et les onglets de filtre ont disparu.',
  'help.guide.files-trash.step.3':
    'Une ligne jetée est grisée et n’a plus que deux boutons : Restaurer, qui ramène le fichier, et Supprimer, qui l’enlève définitivement après une question.',
  'help.guide.files-trash.step.4':
    'Cliquez sur Restaurer. Le message affiche Fichier restauré et la ligne quitte la corbeille, avec sa note et ses liens toujours dessus.',
  'help.guide.files-trash.step.5':
    'Vider la corbeille en haut enlève définitivement tout ce qui reste ici, et le navigateur demande une fois avant de le faire. Corbeille rebascule vers les fichiers.',
  'help.guide.files-trash.result': 'Le fichier est de retour dans la liste où il était, comme si de rien n’était.',
  'help.guide.files-trash.tip.1':
    'Supprimer sur une ligne ne demande pas avant, et c’est à cela que sert la corbeille : rien ne quitte TREK tant que vous ne le dites pas ici.',
  'help.guide.files-trash.tip.2':
    'Jeter un fichier et le récupérer demande le droit Supprimer des fichiers. Un membre qui ne l’a pas ne voit ni Supprimer sur la ligne ni les boutons dans la corbeille.',
  'help.guide.files-trash.tip.3': 'Un fichier supprimé définitivement dans la corbeille ne peut pas être ramené.',
  // files-sync
  'help.guide.files-sync.title': 'Garder les documents synchronisés avec votre stockage de documents',
  'help.guide.files-sync.goal':
    'Liez le voyage à votre propre stockage de documents, pour que ce qui est importé ici arrive là-bas et que ce qui est classé là-bas apparaisse ici.',
  'help.guide.files-sync.step.1':
    'Cliquez sur Synchronisation des documents, à côté de Corbeille à l’extrémité droite de la barre d’outils. Le dialogue s’ouvre avec le nom du voyage sous son titre. À gauche, sous Connecter un fournisseur, se trouvent les stockages qu’un administrateur a activés, chacun avec une ligne sur sa façon de classer : Paperless-ngx et Papra par étiquette, Nextcloud et Synology Drive dans un dossier, OpenCloud dans un espace. À droite, on lit Rien de connecté pour le moment.',
  'help.guide.files-sync.step.2':
    'Cliquez sur votre stockage, ici Nextcloud. Un dialogue plus petit s’ouvre pour la connexion, au nom du stockage, et demande ce dont ce stockage a besoin pour vous connecter.',
  'help.guide.files-sync.step.3':
    'Remplissez Adresse et les identifiants propres au stockage : un Jeton API pour Paperless-ngx, une Clé API et l’ID d’organisation pour Papra, Nom d’utilisateur et un Mot de passe d’application pour Nextcloud, Nom d’utilisateur et un Jeton d’application pour OpenCloud, et pour Synology Drive Nom d’utilisateur, Mot de passe et, si le compte en demande un, un Code à deux facteurs. Utilisez un mot de passe ou un jeton d’application partout où le stockage en propose un, jamais le mot de passe de votre compte. Nextcloud et Synology Drive acceptent aussi un Dossier de base facultatif, où TREK cherche les dossiers de voyage, ici /Reisen. Accepter un certificat auto-signé, en bas, n’est que pour un stockage sur votre propre réseau avec un tel certificat.',
  'help.guide.files-sync.step.4':
    'Cliquez sur Tester la connexion. TREK joint le stockage avec ce que vous avez saisi et le pied de page dit Contact établi, connecté en tant que suivi du nom du compte. Des identifiants refusés ou une adresse injoignable y sont nommés à la place, et rien n’est enregistré dans un cas comme dans l’autre.',
  'help.guide.files-sync.step.5':
    'Cliquez sur Connecter. La connexion est enregistrée avec le voyage et TREK demande où le voyage doit se trouver dans le stockage : l’étiquette, le dossier ou l’espace qui contient ses documents. Seul ce qui s’y trouve est synchronisé. En créer un nouveau le crée avec Créer, avec un nom prérempli d’après le titre du voyage ; sous Ou en utiliser un existant se trouvent ceux qui existent déjà. Cliquez sur l’un d’eux, ici le dossier Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Le dialogue est de retour : votre stockage se trouve sous Ce voyage à gauche, et sa carte à droite indique où il se synchronise, la date de sa dernière exécution et Synchroniser maintenant. Une première exécution démarre d’elle-même ; Synchroniser maintenant en lance une quand vous voulez. Une fois une exécution terminée, le badge Pas encore synchronisé à côté du nom cède la place à un point vert, À jour quand vous le pointez, et la barre de flux compte les documents que TREK et le stockage tiennent chacun, avec les voies Vers le fournisseur et Depuis le fournisseur entre eux. Fermez le dialogue avec le ×.',
  'help.guide.files-sync.result':
    'Les documents qui étaient déjà là-bas figurent en haut de la liste, importés en votre nom, et chaque document du voyage est aussi dans le stockage. Désormais TREK vérifie le stockage en arrière-plan, et le stockage suit la liste.',
  'help.guide.files-sync.tip.1':
    'Seul le propriétaire du voyage ou un administrateur de l’instance peut lier un voyage, puisque les identifiants donnent accès à tout ce compte sur le stockage. Chaque membre peut ouvrir Synchronisation des documents, lire la carte et appuyer sur Synchroniser maintenant.',
  'help.guide.files-sync.tip.2':
    'Un stockage sur votre propre réseau a besoin de ALLOW_INTERNAL_NETWORK=true sur le serveur TREK, et son adresse doit être celle de la machine sur le réseau, jamais localhost. Sans cela, Tester la connexion répond Cette adresse n’est pas autorisée.',
  'help.guide.files-sync.tip.3':
    'Déconnecter sur la carte met fin à l’appariement et garde chaque document des deux côtés. Une étiquette, un dossier ou un espace lié une seconde fois est traité comme nouveau, et tout ce qu’il contient entre à nouveau, alors après un Déconnecter, liez-en un vide plutôt que l’ancien.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Détails du jour',
  'help.ctx.trip-day-detail.summary':
    'Le panneau que l’en-tête d’un jour ouvre par-dessus la carte : le jour dans son ensemble, son nom et sa date, la météo là où vous serez, les réservations qui tombent ce jour-là et les nuits réservées pour lui.',
  'help.ctx.trip-day-detail.bullet.1':
    'Cliquez sur l’en-tête d’un jour dans la colonne des jours et le panneau s’ouvre au milieu de la carte. Le même en-tête de nouveau, ou la croix à sa droite, le ferme et relâche le jour.',
  'help.ctx.trip-day-detail.bullet.2':
    'L’en-tête porte le nom du jour et sa date. Le crayon à côté du nom renomme le jour, le double chevron replie le panneau en une barre étroite pour libérer la carte.',
  'help.ctx.trip-day-detail.bullet.3':
    'Tout en haut, la météo du jour. Prévisions pour nomme le lieu concerné : la première étape du jour, ou l’hébergement où vous vous réveillez.',
  'help.ctx.trip-day-detail.bullet.4':
    'Réservations liste les réservations de ce jour, chacune avec son type, l’étape à laquelle elle appartient et ses horaires. Vert veut dire confirmée, ambre encore en attente ; c’est un simple relevé, les réservations se modifient dans l’onglet Réservations.',
  'help.ctx.trip-day-detail.bullet.5':
    'Hébergement montre chaque nuit réservée sur ce jour, avec Arrivée et Départ aux jours où ils ont lieu, la plage horaire d’arrivée, l’heure de départ et le numéro de confirmation.',
  'help.ctx.trip-day-detail.bullet.6':
    'Ajouter un hébergement réserve une nuit sur ce jour : choisissez l’établissement parmi les lieux du voyage, dites quels jours elle couvre, et ajoutez les horaires et le code.',
  // day-panel
  'help.guide.day-panel.title': 'Ouvrir un jour et lire ses détails',
  'help.guide.day-panel.goal':
    'Voir un jour en entier, sa météo, ses réservations et où vous dormez, sans quitter la carte.',
  'help.guide.day-panel.step.1':
    'Cliquez sur l’en-tête d’un jour dans la colonne des jours. Le jour est sélectionné et ses détails s’ouvrent au milieu de la carte.',
  'help.guide.day-panel.step.2':
    'L’en-tête nomme le jour, Jour 1 tant que vous ne lui donnez pas de nom, avec sa date en dessous.',
  'help.guide.day-panel.step.3':
    'Tout en haut, la météo du jour. Prévisions pour dit de quel lieu il s’agit : la première étape du jour, ou l’hébergement où vous vous réveillez.',
  'help.guide.day-panel.step.4':
    'Réservations en dessous liste les réservations qui tombent ce jour-là, avec leurs horaires.',
  'help.guide.day-panel.step.5':
    'Hébergement montre les nuits réservées sur ce jour, avec Arrivée et Départ aux jours où ils ont lieu.',
  'help.guide.day-panel.step.6':
    'Le double chevron dans l’en-tête replie le panneau en une barre étroite. La croix à côté ferme le panneau et relâche le jour.',
  'help.guide.day-panel.result':
    'Replié en barre, le panneau laisse la carte libre et garde le jour sélectionné ; fermé, le jour est désélectionné et le plan est comme avant.',
  'help.guide.day-panel.tip.1':
    'Cliquer n’importe où sur la barre d’en-tête du panneau le replie aussi. Le chevron n’en est que le bouton.',
  'help.guide.day-panel.tip.2':
    'Ouvrir un lieu depuis la colonne des lieux met les détails du lieu à la place du panneau. Fermez-les et le jour revient.',
  // day-weather
  'help.guide.day-weather.title': 'Lire la météo du jour',
  'help.guide.day-weather.goal': 'Savoir le temps qu’il fera là où vous serez vraiment ce jour-là.',
  'help.guide.day-weather.step.1':
    'Prévisions pour nomme le lieu auquel les chiffres se rapportent : la première étape du jour ou, un jour sans étape, l’hébergement où vous vous réveillez.',
  'help.guide.day-weather.step.2':
    'Le grand chiffre est la température du jour, à côté le minimum et le maximum, et la condition en toutes lettres.',
  'help.guide.day-weather.step.3':
    'Les pastilles en dessous : la probabilité de pluie, la quantité de précipitations, le vent le plus fort, et le lever et le coucher du soleil.',
  'help.guide.day-weather.step.4':
    'Tout en bas, le jour heure par heure, une heure sur deux : l’heure, l’icône, la température et la probabilité de pluie. Une heure au-dessus de 50 pour cent est teintée de bleu.',
  'help.guide.day-weather.result':
    'La fiche du jour dans la colonne des jours porte la même météo en petit sous son numéro, si bien que tout le voyage se lit d’un coup d’œil.',
  'help.guide.day-weather.tip.1':
    'Les degrés et le vent suivent Unité de température, sous Affichage dans Paramètres : choisissez °F Fahrenheit et la même prévision est donnée en °F et mph.',
  'help.guide.day-weather.tip.2':
    'Un jour sans étape localisée et sans hébergement où se réveiller n’affiche aucune météo : la prévision vaut toujours pour un lieu, jamais pour le voyage.',
  'help.guide.day-weather.tip.3':
    'Au-delà de 16 jours, il n’y a pas de prévision à obtenir. Les chiffres sont alors les moyennes des années passées pour cette date, marquées d’un Ø et signalées comme telles en dessous.',
  // rename-day
  'help.guide.rename-day.title': 'Donner un nom au jour',
  'help.guide.rename-day.goal':
    'Appeler un jour par ce qu’il est, Arrivée à Kyoto ou Jour de repos, au lieu de Jour 5.',
  'help.guide.rename-day.step.1': 'Ouvrez le jour. Son en-tête indique Jour 5, avec la date en dessous.',
  'help.guide.rename-day.step.2': 'Cliquez sur le crayon à côté du nom.',
  'help.guide.rename-day.step.3': 'Le nom devient un champ. Tapez le nom voulu.',
  'help.guide.rename-day.step.4':
    'Appuyez sur Entrée, ou cliquez simplement ailleurs ; Échap annule la modification. La fiche du jour dans la colonne des jours porte le nom elle aussi.',
  'help.guide.rename-day.result':
    'Le nom remplace Jour 5 dans le panneau et sur la fiche du jour dans la colonne des jours ; la date reste où elle était.',
  'help.guide.rename-day.tip.1':
    'Videz le champ et enregistrez, et le jour redevient Jour 5 : le numéro est ce qui s’affiche quand il n’y a pas de nom.',
  'help.guide.rename-day.tip.2':
    'Le nom appartient au jour, pas à sa date. Réordonnez les jours et il voyage avec tout le reste de ce jour.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Réserver une nuit sur un jour',
  'help.guide.add-accommodation.goal':
    'Mettre l’hôtel dans le plan une seule fois, avec les jours qu’il couvre, ses horaires et son numéro de confirmation.',
  'help.guide.add-accommodation.step.1':
    'L’établissement doit d’abord être un lieu du voyage. Créez-le dans la colonne des lieux comme n’importe quel autre lieu : le sélecteur ne propose que ce qui est déjà là.',
  'help.guide.add-accommodation.step.2':
    'Ouvrez le jour de votre arrivée et cliquez sur Ajouter un hébergement sous Hébergement.',
  'help.guide.add-accommodation.step.3':
    'Appliquer aux jours dit quelles nuits le séjour couvre : le jour d’arrivée à gauche, le jour de départ à droite. Tous prend le voyage entier.',
  'help.guide.add-accommodation.step.4':
    'Remplissez Arrivée, Jusqu’à et Départ, et mettez le numéro de la réservation sous Confirmation. Les quatre peuvent rester vides.',
  'help.guide.add-accommodation.step.5':
    'Choisissez l’établissement parmi les lieux du voyage. Les pastilles au-dessus de la liste la réduisent à une seule catégorie.',
  'help.guide.add-accommodation.step.6': 'Cliquez sur Enregistrer.',
  'help.guide.add-accommodation.result':
    'Le séjour s’affiche sur chaque jour qu’il couvre, Arrivée sur le premier et Départ sur le dernier. L’établissement devient une étape du jour d’arrivée, si bien que la carte trace le chemin jusque-là, et une réservation de type Hébergement apparaît dans l’onglet Réservations.',
  'help.guide.add-accommodation.tip.1':
    'Le sélecteur s’ouvre sur le jour d’où vous venez, avec le départ le lendemain ; les deux peuvent être déplacés avant d’enregistrer.',
  'help.guide.add-accommodation.tip.2':
    'Donnez à l’hôtel la catégorie Hotel du voyage à sa création et les pastilles au-dessus de la liste la réduisent à vos hôtels en un clic.',
  'help.guide.add-accommodation.tip.3':
    'Les horaires sont tous facultatifs : un séjour sans arrivée et sans code couvre quand même ses nuits et trace quand même son itinéraire.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Modifier ou annuler une nuit réservée',
  'help.guide.edit-accommodation.goal': 'Déplacer un séjour, corriger ses horaires, ou le retirer du plan.',
  'help.guide.edit-accommodation.step.1':
    'Sur chaque jour du séjour, la fiche montre l’établissement, la plage horaire d’arrivée, l’heure de départ et le numéro de confirmation.',
  'help.guide.edit-accommodation.step.2':
    'Le crayon à sa droite rouvre le séjour. La fenêtre s’intitule maintenant Modifier l’hébergement.',
  'help.guide.edit-accommodation.step.3':
    'Corrigez la rangée de champs : Arrivée, Jusqu’à, Départ et Confirmation. Les jours au-dessus et l’établissement en dessous se changent aussi ici.',
  'help.guide.edit-accommodation.step.4': 'Cliquez sur Enregistrer.',
  'help.guide.edit-accommodation.step.5':
    'La croix à côté du crayon met fin au séjour. Elle ne demande rien, et la réservation de type Hébergement qui lui appartient part avec lui.',
  'help.guide.edit-accommodation.result':
    'La modification atteint d’un coup chaque jour que le séjour couvre, et la réservation de type Hébergement dans l’onglet Réservations avec.',
  'help.guide.edit-accommodation.tip.1':
    'Une nuit au milieu d’un séjour ne porte ni l’étiquette Arrivée ni l’étiquette Départ : seuls le premier et le dernier jour de la plage les portent.',
  'help.guide.edit-accommodation.tip.2':
    'Annuler un séjour emporte aussi l’étape qu’il avait posée sur le jour d’arrivée et tout coût attaché à sa réservation. Réservez la nuit de nouveau si c’était une erreur.',
  // day-bookings
  'help.guide.day-bookings.title': 'Les réservations du jour d’un coup d’œil',
  'help.guide.day-bookings.goal': 'Voir en un seul endroit ce qui est déjà réservé pour ce jour et si c’est confirmé.',
  'help.guide.day-bookings.step.1':
    'Réservations liste les réservations du jour : celles qui y sont datées, et celles qui sont rattachées à l’une de ses étapes.',
  'help.guide.day-bookings.step.2':
    'Une ligne montre le type de réservation, son nom et, quand elle appartient à une étape, cette étape après un point. Ses horaires se trouvent tout à droite.',
  'help.guide.day-bookings.step.3':
    'La couleur dit où en est une réservation : une ligne verte est confirmée, une ligne ambre est encore en attente. Les hébergements ne sont pas dans cette liste, ils ont leur propre bloc en dessous.',
  'help.guide.day-bookings.step.4':
    'La liste ne fait que relever les réservations. Une réservation se crée et se modifie dans l’onglet Réservations.',
  'help.guide.day-bookings.result':
    'Tout ce qui est daté du jour, et tout ce qui est rattaché à l’une de ses étapes, est dans cette seule liste.',
  'help.guide.day-bookings.tip.1':
    'Une réservation atterrit sur un jour par sa propre date. Changez la date dans l’onglet Réservations et elle passe à l’autre jour toute seule.',
  'help.guide.day-bookings.tip.2':
    'Pas de bloc Réservations veut dire que le jour n’a aucune réservation : il est masqué plutôt qu’affiché vide.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Carte',
  'help.ctx.trip-map.summary':
    'Le milieu du plan : chaque lieu du voyage en épingle, les itinéraires qui les relient, et les boutons sur les bords de la carte pour le satellite, pour tout le voyage d’un coup et pour les lieux autour du quartier que vous regardez.',
  'help.ctx.trip-map.bullet.1':
    'Une épingle est un lieu : sa propre photo quand il en a une, sinon la couleur de sa catégorie avec l’icône de la catégorie. Posez le pointeur dessus pour une fiche avec son nom et son adresse, plus sa catégorie et sa note quand le lieu en porte. Faites glisser une épingle sur une carte du jour pour y planifier le lieu.',
  'help.ctx.trip-map.bullet.2':
    'Les épingles trop proches pour être distinguées se replient en une bulle sombre portant un compte. Cliquez la bulle et la carte zoome sur ce qu’elle contient.',
  'help.ctx.trip-map.bullet.3':
    'Cliquez sur une épingle pour ouvrir le lieu sous la carte, avec sa note, ses fichiers et ce qu’il y a à en faire ensuite ; cliquez sur un endroit vide de la carte pour le relâcher.',
  'help.ctx.trip-map.bullet.4':
    'Avec un jour ouvert dans la colonne des jours, ses étapes portent un petit badge blanc avec leur numéro dans ce jour, et un lieu planifié sur deux jours porte les deux numéros, joints par ·.',
  'help.ctx.trip-map.bullet.5':
    'La rangée d’icônes en haut cherche dans la partie de la carte que vous voyez : Restaurants, Cafés, Bars & vie nocturne, Hébergement, Sites touristiques, Musées & culture, Nature & parcs et Activités. Rechercher dans cette zone la relance après que vous avez déplacé la carte.',
  'help.ctx.trip-map.bullet.6':
    'Un clic droit n’importe où sur la carte ouvre le formulaire de lieu à cet endroit, avec l’adresse déjà recherchée. Le bouton rond en bas à gauche échange la carte dessinée contre des images aériennes.',
  'help.ctx.trip-map.bullet.7':
    'Afficher tout le voyage, en bas à droite, dessine chaque jour de trajet d’un coup et liste ce que chacun couvre ; l’icône d’itinéraire sur la ligne d’une réservation dessine cette réservation, et celle de la barre d’outils au-dessus des jours les dessine toutes.',
  // map-markers
  'help.guide.map-markers.title': 'Lire la carte',
  'help.guide.map-markers.goal': 'Savoir ce que chaque épingle, badge et bulle de la carte vous dit.',
  'help.guide.map-markers.step.1':
    'La carte porte chaque lieu du voyage. Là où des épingles sont trop proches pour être distinguées, elles se replient en une bulle sombre portant le nombre qu’elle contient ; cliquez la bulle et la carte zoome sur ce qu’elle contenait, ou, au zoom le plus profond, déploie les épingles en éventail.',
  'help.guide.map-markers.step.2':
    'Une épingle est la photo du lieu quand il en a une, sinon la couleur de sa catégorie avec l’icône de la catégorie. Posez le pointeur dessus et une fiche donne son nom et son adresse, avec sa catégorie et sa note quand le lieu en porte.',
  'help.guide.map-markers.step.3':
    'Cliquez sur une épingle et le lieu s’ouvre dans une fiche sous la carte : ses coordonnées, sa note, ses fichiers, et en bas ce qu’il est possible d’en faire ensuite, dont Navigation, Modifier et Supprimer, avec Ajouter au jour tant qu’un jour est ouvert. Cliquez sur un endroit vide de la carte pour le relâcher.',
  'help.guide.map-markers.step.4':
    'Ouvrez un jour dans la colonne des jours et ses étapes se numérotent : le petit badge blanc au coin d’une épingle est la place de cette étape dans le jour. Un lieu planifié sur deux jours porte les deux numéros, joints par ·. Sans jour ouvert il n’y a pas de numéros, et le coin porte la note à la place.',
  'help.guide.map-markers.step.5':
    'Faites glisser une épingle de la carte sur une carte du jour dans la colonne des jours et le lieu est planifié ce jour-là, exactement comme si vous sortiez sa ligne de la liste des lieux.',
  'help.guide.map-markers.result':
    'Rien n’a changé dans le voyage : la carte en est une vue, et chaque épingle dit quel lieu, quel jour et dans quel ordre.',
  'help.guide.map-markers.tip.1':
    'Un jour replié dans la colonne des jours emporte ses étapes hors de la carte ; rouvrez le jour et elles reviennent.',
  'help.guide.map-markers.tip.2':
    'Le filtre au-dessus de la liste des lieux décide aussi de ce que la carte dessine : choisissez Non planifiés et il ne reste dessus que les lieux encore sans jour.',
  'help.guide.map-markers.tip.3':
    'Cette carte n’a pas de boutons de zoom : la molette zoome, un double clic zoome d’un cran, et faire glisser la carte elle-même la déplace.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Trouver des lieux autour de vous sur la carte',
  'help.guide.map-nearby-places.goal':
    'Laissez la carte chercher des restaurants, des sites touristiques ou un hôtel dans le quartier que vous regardez, et faites-en entrer un dans le voyage.',
  'help.guide.map-nearby-places.step.1':
    'La rangée d’icônes en haut de la carte est la recherche par catégorie : Restaurants, Cafés, Bars & vie nocturne, Hébergement, Sites touristiques, Musées & culture, Nature & parcs et Activités.',
  'help.guide.map-nearby-places.step.2':
    'Cliquez une catégorie. TREK cherche ce genre de lieu dans la partie de la carte que vous voyez et pose une épingle de la couleur de la catégorie pour chaque résultat. Une catégorie à la fois : cliquer sur une autre l’échange, et cliquer sur celle qui est active la désactive.',
  'help.guide.map-nearby-places.step.3':
    'Déplacez la carte et un second bouton apparaît sous la rangée : Rechercher dans cette zone relance la même recherche pour la nouvelle vue. Le déplacement seul ne recherche jamais de nouveau, ce qui limite le nombre de requêtes.',
  'help.guide.map-nearby-places.step.4':
    'Les épingles portent le nom de ce qui a été trouvé. Cliquez-en une et le formulaire de lieu s’ouvre déjà rempli à partir d’elle : Nom, Adresse, Latitude et Longitude, ainsi que le site web et le numéro de téléphone là où OpenStreetMap les a.',
  'help.guide.map-nearby-places.step.5':
    'Vérifiez ce qui a été rempli et ajoutez ce que la recherche ne pouvait pas savoir : une Description, une Catégorie, vos propres notes.',
  'help.guide.map-nearby-places.step.6':
    'Cliquez sur Ajouter. Si un lieu du même nom est déjà dans le voyage, le formulaire le signale et le bouton devient Ajouter quand même.',
  'help.guide.map-nearby-places.result':
    'Le lieu est dans la liste des lieux et sur la carte parmi les épingles propres au voyage, sous Non planifiés tant que vous ne le posez pas sur un jour. Les épingles de recherche restent jusqu’à ce que vous désactiviez la catégorie.',
  'help.guide.map-nearby-places.tip.1':
    'La rangée disparaît quand Explorer les lieux sur la carte est désactivé dans Paramètres, sous Travel & map.',
  'help.guide.map-nearby-places.tip.2':
    'Les réponses viennent de l’index de lieux TREK et d’OpenStreetMap, c’est donc une des rares choses du plan qui demande une connexion.',
  'help.guide.map-nearby-places.tip.3':
    'Une recherche couvre ce qui est à l’écran, alors zoomez sur la rue qui vous intéresse : une ville entière répond avec les soixante premiers résultats et sans grand ordre.',
  // map-add-place
  'help.guide.map-add-place.title': 'Créer un lieu par un clic droit sur la carte',
  'help.guide.map-add-place.goal': 'Posez un lieu exactement où vous le voulez, sans le chercher d’abord.',
  'help.guide.map-add-place.step.1':
    'Faites un clic droit sur l’endroit de la carte que vous visez. Le formulaire de lieu s’ouvre, intitulé Ajouter un lieu/activité.',
  'help.guide.map-add-place.step.2':
    'Latitude et Longitude sont déjà à ce point, et TREK recherche les coordonnées et remplit Adresse avec ce qu’il trouve là, et Nom aussi quand la recherche en donne un. Rien n’est encore enregistré, alors écrasez tout ce qui est faux.',
  'help.guide.map-add-place.step.3':
    'Donnez-lui un Nom que vous reconnaîtrez, et le reste de ce que le plan doit savoir : Description, Notes, Catégorie, Site web.',
  'help.guide.map-add-place.step.4':
    'Cliquez sur Ajouter. Le lieu arrive dans la liste comme non planifié même avec un jour ouvert : un clic droit sur la carte dit où, pas quand.',
  'help.guide.map-add-place.result':
    'Le lieu est dans la liste et sur la carte, sous Non planifiés tant que vous ne le posez pas sur un jour.',
  'help.guide.map-add-place.tip.1':
    'L’adresse vient d’une recherche des coordonnées, elle peut donc se lire comme une rue plutôt que comme un nom, et en pleine campagne elle peut revenir vide. Les deux champs sont à vous d’écraser.',
  'help.guide.map-add-place.tip.2':
    'Sur les cartes MapLibre GL et Mapbox GL, un clic du milieu fait la même chose, et sur un écran tactile un appui long.',
  // map-satellite
  'help.guide.map-satellite.title': 'Passer au satellite',
  'help.guide.map-satellite.goal': 'Échangez la carte dessinée contre des images aériennes, et revenez.',
  'help.guide.map-satellite.step.1':
    'Le bouton rond en bas à gauche de la carte est le commutateur de fond de carte. Son icône montre toujours la couche vers laquelle il irait, et le survol dit laquelle : Passer à la vue satellite. Cliquez-le.',
  'help.guide.map-satellite.step.2':
    'La carte est maintenant des images aériennes, assez précises pour distinguer un seul bâtiment et sans clé à vous. Tout ce que TREK dessine reste par-dessus : les épingles, l’itinéraire du jour, les traces et les itinéraires des réservations.',
  'help.guide.map-satellite.step.3':
    'Le bouton affiche maintenant Passer à la vue carte. Cliquez-le pour revenir à la carte dessinée.',
  'help.guide.map-satellite.result':
    'La carte est de nouveau dessinée, et la couche sur laquelle vous l’avez laissée est retenue sur votre compte.',
  'help.guide.map-satellite.tip.1':
    'Le choix est gardé sur votre compte et non sur le voyage, donc chaque voyage s’ouvre comme vous l’avez laissé, quel que soit le moteur de carte que vous utilisez.',
  'help.guide.map-satellite.tip.2':
    'Les images ne portent aucune écriture : les noms de rue, les quartiers et les numéros sont sur la carte dessinée, alors revenez-y quand vous cherchez une adresse.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Voir tout le voyage et ses distances',
  'help.guide.map-whole-trip.goal':
    'Échangez le seul jour ouvert contre chaque jour de trajet du voyage, et lisez la distance de chacun.',
  'help.guide.map-whole-trip.step.1':
    'Le bouton rond Afficher tout le voyage se trouve en bas à droite de la carte. Cliquez-le et chaque jour de trajet du voyage est dessiné d’un coup, chacun dans sa couleur par-dessus un liseré blanc, pour que les jours voisins restent distincts.',
  'help.guide.map-whole-trip.step.2':
    'La fiche au-dessus du bouton liste ces jours : une pastille de couleur, le nom du jour, une icône par mode de transport utilisé, et la distance couverte. Distance totale est en haut.',
  'help.guide.map-whole-trip.step.3':
    'Cliquez un jour dans la fiche pour le sélectionner, comme si vous le choisissiez dans la colonne des jours : la carte cadre ce jour, et ses étapes retrouvent leurs numéros.',
  'help.guide.map-whole-trip.step.4':
    'Le bouton affiche maintenant Masquer tout le voyage. Appuyez dessus pour revenir au seul jour ouvert.',
  'help.guide.map-whole-trip.result':
    'Chaque jour de trajet est dessiné dans sa propre couleur, et la fiche dit ce que chacun couvre et ce que le voyage totalise.',
  'help.guide.map-whole-trip.tip.1':
    'Le total arrive quelques étapes à la fois. Tant qu’un … le suit, le nombre n’est qu’une somme partielle ; il se fixe une fois que chaque étape a répondu.',
  'help.guide.map-whole-trip.tip.2':
    'Une étape que le routeur refuse reste une ligne droite et ne compte rien, et la fiche le dit au lieu d’afficher discrètement une valeur trop basse.',
  'help.guide.map-whole-trip.tip.3':
    'Un jour avec moins de deux étapes localisées n’a pas d’itinéraire à dessiner, il est donc entièrement laissé hors de la fiche.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Afficher l’itinéraire d’une réservation sur la carte',
  'help.guide.map-booking-routes.goal':
    'Dessinez sur la carte les vols, les trains et les trajets en voiture que vous avez réservés, et retirez-les ensuite.',
  'help.guide.map-booking-routes.step.1':
    'Les itinéraires des réservations sont masqués jusqu’à ce que vous en demandiez un. Sur la ligne d’une réservation dans la colonne des jours se trouve une petite icône d’itinéraire : Afficher les itinéraires.',
  'help.guide.map-booking-routes.step.2':
    'Cliquez-la et la réservation apparaît sur la carte : un vol en arc de grand cercle, un trajet en voiture le long des vraies routes, un train comme la chaîne de ses gares. Confirmée est dessinée en trait plein, En attente en pointillés, et les extrémités de l’itinéraire sont des pastilles bleues portant l’icône du transport.',
  'help.guide.map-booking-routes.step.3':
    'Cliquez une pastille d’extrémité et la réservation derrière s’ouvre, avec ses horaires, sa référence et l’endroit d’où elle part. Fermer la referme.',
  'help.guide.map-booking-routes.step.4':
    'L’icône d’itinéraire dans la barre d’outils au-dessus des jours fait tout le voyage d’un coup : Afficher tous les itinéraires dessine chaque réservation qui en a un.',
  'help.guide.map-booking-routes.step.5':
    'C’est une remise à zéro et non une couche par-dessus, donc ce que vous aviez choisi réservation par réservation est abandonné. Appuyez de nouveau, le bouton affichant maintenant Masquer tous les itinéraires, et la carte est nette.',
  'help.guide.map-booking-routes.result':
    'Les réservations que vous avez demandées sont dessinées sur la carte, et le choix est gardé pour ce voyage dans ce navigateur jusqu’à ce que vous le changiez.',
  'help.guide.map-booking-routes.tip.1':
    'Les extrémités portent le code de l’aéroport ou le nom de la gare seulement quand Étiquettes des itinéraires est activé dans Paramètres, sous Travel & map ; sinon elles ne montrent que l’icône.',
  'help.guide.map-booking-routes.tip.2':
    'Toujours afficher les itinéraires de réservation, dans les mêmes paramètres, les dessine dès le départ sur chaque voyage pour lequel vous n’avez pas déjà décidé.',
  'help.guide.map-booking-routes.tip.3':
    'Une réservation a besoin de deux extrémités avec des coordonnées avant de pouvoir être dessinée, un hôtel ou un restaurant ne porte donc pas d’icône d’itinéraire.',
  'help.ctx.trip-map.bullet.8':
    'Avec le module Dawarich actif, le bouton rond Dawarich sous Afficher tout le voyage dessine le trajet que votre téléphone a réellement enregistré : Afficher le trajet enregistré le pose en pointillés sous l’itinéraire prévu, une couleur par jour, et le libellé du bouton dit pourquoi il n’y a pas de ligne quand il n’y en a pas.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Afficher le trajet que vous avez réellement parcouru',
  'help.guide.map-dawarich-trail.goal':
    'Posez sur la carte le trajet que Dawarich a enregistré sur votre téléphone, en pointillés à côté de celui que vous aviez prévu, et lisez le voyage jour par jour tel qu’il s’est vraiment passé.',
  'help.guide.map-dawarich-trail.step.1':
    'Le bouton rond Dawarich se trouve en bas à droite de la carte, sous Afficher tout le voyage ; le survoler dit Afficher le trajet enregistré. Cliquez dessus. TREK demande à votre Dawarich les dates du voyage, et un anneau tourne autour du bouton pendant que la réponse est en chemin.',
  'help.guide.map-dawarich-trail.step.2':
    'Le trajet enregistré arrive en ligne pointillée, une couleur par jour, dessinée sous l’itinéraire prévu pour que le plan reste lisible. Le bouton dit maintenant Masquer le trajet enregistré. Les jours sont coupés à minuit, heure locale, et un jour replié dans la colonne des jours retire de la carte sa ligne pointillée avec ses étapes.',
  'help.guide.map-dawarich-trail.step.3':
    'Cliquez aussi sur Afficher tout le voyage et chaque jour prévu est dessiné en trait plein à côté de l’enregistrement en pointillés. Là où les deux se confondent, la journée s’est passée comme prévu ; là où la ligne pointillée s’écarte, ce n’est pas le cas.',
  'help.guide.map-dawarich-trail.result':
    'Ce que vous aviez prévu et ce que vous avez réellement fait sont ensemble sur la carte, pointillés contre trait plein, et la fiche au-dessus des boutons liste toujours les jours prévus et leurs distances.',
  'help.guide.map-dawarich-trail.tip.1':
    'Activé ou non est mémorisé par voyage pour cette session du navigateur. Tant que le trajet est affiché, TREK réinterroge Dawarich toutes les deux minutes, si bien qu’un voyage en cours se met à jour sans rechargement ; le trajet lui-même n’est jamais stocké, il n’est donc ni dans la base de données de TREK, ni dans les sauvegardes, ni disponible hors ligne.',
  'help.guide.map-dawarich-trail.tip.2':
    'Le libellé du bouton explique une carte vide : Chargement du trajet enregistré… pendant qu’il est en chemin, Rien n’a été enregistré à ces dates, Le trajet enregistré n’a pas pu être chargé, ou Le trajet enregistré nécessite une connexion quand TREK est hors ligne.',
  // map-compass
  'help.guide.map-compass.title': 'Tourner la carte et retrouver le nord',
  'help.guide.map-compass.goal':
    'Faites pivoter la carte pour qu’elle regarde dans votre direction, et ramenez-la au nord d’un seul clic.',
  'help.guide.map-compass.step.1':
    'Tournez la carte en la faisant glisser avec le bouton droit, ou maintenez Ctrl et faites glisser avec le bouton gauche ; sur un écran tactile, pivotez avec deux doigts. La boussole ronde à côté de la rangée d’icônes de catégories en haut de la carte tourne avec elle : sa flèche pointe toujours vers le nord, elle penche donc autant que vous avez tourné.',
  'help.guide.map-compass.step.2':
    'Cliquez sur la boussole. Reset north, c’est le nom du bouton, ramène en douceur la carte au nord en haut et à une vue à plat, et la flèche se redresse.',
  'help.guide.map-compass.result':
    'La carte est de nouveau orientée au nord et à plat, et rien n’a changé sur le voyage : la boussole ne déplace que la caméra.',
  'help.guide.map-compass.tip.1':
    'La boussole n’existe que sur les cartes MapLibre GL et Mapbox GL ; la carte Leaflet ne peut pas être tournée, elle n’en a donc pas. Fournisseur de carte dans Paramètres, sous Carte, décide de celle que vous utilisez, et Enregistrer la carte garde le choix.',
  'help.guide.map-compass.tip.2':
    'Le clic enlève aussi l’inclinaison : un glisser vers le haut ou le bas avec le bouton droit incline la vue, et Reset north la remet à plat en même temps que la rotation. Sur Mapbox GL avec Bâtiments 3D & terrain actif, cela aplatit aussi la vue 3D, jusqu’à ce que vous l’incliniez de nouveau.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Collaboration',
  'help.ctx.trip-collab.summary':
    'L’onglet où le groupe planifie ensemble : la Discussion à gauche, les notes partagées et les liens à côté, les sondages en dessous et À venir à la fin. Tout ce qui s’écrit ici est aussitôt sur l’écran de chaque autre membre, sans rechargement.',
  'help.ctx.trip-collab.bullet.1':
    'La Discussion est la colonne de gauche. Écrivez dans Écrire un message… et appuyez sur Enter ; Shift et Enter font un saut de ligne. Le smiley ajoute un emoji, Joindre des images accroche jusqu’à quatre images au message.',
  'help.ctx.trip-collab.bullet.2':
    'Survolez un message pour Répondre et, sur les vôtres, Supprimer ; le clic droit ouvre les huit réactions rapides. Un message supprimé laisse une ligne qui dit que vous l’avez supprimé.',
  'help.ctx.trip-collab.bullet.3':
    'Notes est le bloc partagé : Nouvelle note en écrit une, et l’engrenage à côté ouvre Gérer les catégories pour leurs noms et leurs couleurs. Une carte porte Développer, Épingler, Modifier et Supprimer.',
  'help.ctx.trip-collab.bullet.4':
    'Liens rassemble les adresses sur lesquelles tourne le voyage. Ajouter un lien prend un titre et une adresse http ou https ; Modifier le lien, Épingler le lien et Supprimer le lien sont au bout de la pastille, et les liens épinglés restent devant.',
  'help.ctx.trip-collab.bullet.5':
    'Sondages tranche les questions. Nouveau sondage pose une question avec au moins deux options ; un clic sur une option est votre vote, Fermer met fin au vote et Supprimer retire le sondage.',
  'help.ctx.trip-collab.bullet.6':
    'À venir liste les étapes du voyage encore devant vous, jusqu’à huit d’entre elles, avec leurs heures et les personnes qui y sont. Il ne fait que lire le plan du jour ; les heures se règlent là-bas.',
  // write-note
  'help.guide.write-note.title': 'Écrire une note partagée',
  'help.guide.write-note.goal':
    'Mettez ce dont tout le groupe a besoin, une règle, une adresse, un rappel, là où chacun le retrouve.',
  'help.guide.write-note.step.1': 'Cliquez sur Nouvelle note en haut du panneau Notes. Le formulaire s’ouvre.',
  'help.guide.write-note.step.2':
    'Titre de la note est le nom que porte la carte. C’est la seule chose que le formulaire exige : Créer reste gris tant qu’il est vide.',
  'help.guide.write-note.step.3':
    'La grande zone en dessous contient le texte et accepte le Markdown : un mot en gras, une liste, un titre. La carte montre les premières lignes, et Développer dessus ouvre la note entière.',
  'help.guide.write-note.step.4':
    'Sous Catégorie, choisissez celle à laquelle la note appartient ; sa couleur devient la couleur de la carte. Les pastilles sont les catégories qui existent déjà, et une nouvelle se crée sous Gérer les catégories.',
  'help.guide.write-note.step.5':
    'Site web prend un lien qui appartient à la note. La carte porte alors une tuile Link qui l’ouvre.',
  'help.guide.write-note.step.6': 'Cliquez sur Créer.',
  'help.guide.write-note.result':
    'La note est une carte dans le panneau Notes, dans la couleur de sa catégorie, et elle est déjà sur l’écran de chaque autre membre.',
  'help.guide.write-note.tip.1':
    'Épingler sur une carte la garde en haut du panneau ; tout ce qui est en dessous est trié par date de dernière modification.',
  'help.guide.write-note.tip.2':
    'L’engrenage à côté de Nouvelle note ouvre Gérer les catégories : là, une catégorie reçoit sa couleur, est renommée partout d’un coup, ou est ajoutée avant qu’une note l’utilise.',
  'help.guide.write-note.tip.3':
    'Joindre des fichiers accroche un document à la note. Joindre ouvre le sélecteur de fichiers, et une image ou un PDF peut aussi être simplement collé dans le formulaire.',
  'help.guide.write-note.tip.4':
    'Notes est un interrupteur à part sous Extensions, sous Collaboration : un administrateur peut l’éteindre et laisser tourner le Chat, les Liens, les Sondages ainsi que Et ensuite.',
  // shared-links
  'help.guide.shared-links.title': 'Rassembler les liens du voyage',
  'help.guide.shared-links.goal':
    'Gardez le portail de réservation, l’album partagé et les horaires au même endroit au lieu de fouiller la Discussion pour les retrouver.',
  'help.guide.shared-links.step.1': 'Cliquez sur Ajouter un lien en haut du panneau Liens.',
  'help.guide.shared-links.step.2':
    'Donnez un nom au lien dans Titre du lien, collez l’adresse dans le champ en dessous, puis cliquez sur Enregistrer le lien.',
  'help.guide.shared-links.step.3':
    'La pastille montre le nom et le site vers lequel elle pointe. Un clic dessus ouvre la page dans un nouvel onglet.',
  'help.guide.shared-links.step.4':
    'Les trois petits boutons au bout sont Modifier le lien, Épingler le lien et Supprimer le lien. Épingler le lien déplace la pastille devant le panneau ; Supprimer le lien ne demande rien.',
  'help.guide.shared-links.result':
    'Le lien est une pastille dans le panneau Liens, épinglée devant, et sur l’écran de chaque membre en même temps.',
  'help.guide.shared-links.tip.1':
    'Seules les adresses http et https sont acceptées ; le champ refuse tout le reste avant d’enregistrer.',
  'help.guide.shared-links.tip.2':
    'Les liens épinglés viennent d’abord, puis les plus récents. La petite icône à côté d’un titre est le favicon du site, récupéré sur le site lui-même, donc sans internet la pastille montre un simple symbole de lien à la place.',
  'help.guide.shared-links.tip.3':
    'Liens est un interrupteur à part sous Extensions, sous Collaboration, un administrateur peut donc éteindre le panneau sans toucher au reste de l’onglet.',
  // create-poll
  'help.guide.create-poll.title': 'Demander au groupe',
  'help.guide.create-poll.goal':
    'Transformez une question à laquelle personne ne répond dans la Discussion en un sondage que tout le monde peut cocher.',
  'help.guide.create-poll.step.1': 'Cliquez sur Nouveau sondage en haut du panneau Sondages.',
  'help.guide.create-poll.step.2':
    'Écrivez la question. Markdown pris en charge sous la zone signifie qu’un mot en gras, un saut de ligne ou une courte liste fonctionnent ici.',
  'help.guide.create-poll.step.3':
    'Remplissez Option 1 et Option 2. Deux options avec quelque chose dedans sont le minimum.',
  'help.guide.create-poll.step.4':
    '+ Ajouter une option en ajoute une troisième, une quatrième, autant que nécessaire ; la petite croix à côté d’une ligne en retire une.',
  'help.guide.create-poll.step.5':
    'Choix multiples laisse chacun cocher plus d’une option. Laissé éteint, un vote se déplace quand quelqu’un choisit autre chose.',
  'help.guide.create-poll.step.6': 'Cliquez sur Créer le sondage.',
  'help.guide.create-poll.result': 'Le sondage est en haut du panneau Sondages, ouvert, et personne n’a encore voté.',
  'help.guide.create-poll.tip.1': 'La question est rendue en Markdown ; les options restent du texte brut.',
  'help.guide.create-poll.tip.2':
    'Créer le sondage reste gris tant qu’il n’y a pas une question et au moins deux options avec quelque chose dedans.',
  'help.guide.create-poll.tip.3':
    'Une date limite ne peut être fixée que dans l’application mobile. Un sondage qui en a une montre ici le temps restant dans une pastille ambre et compte comme fermé dès qu’il est écoulé.',
  'help.guide.create-poll.tip.4':
    'Sondages est un interrupteur à part sous Extensions, sous Collaboration : un administrateur peut l’éteindre et laisser tourner les quatre autres panneaux.',
  // vote-poll
  'help.guide.vote-poll.title': 'Voter et lire le résultat',
  'help.guide.vote-poll.goal': 'Donnez votre voix, voyez où en est le groupe, et changez d’avis.',
  'help.guide.vote-poll.step.1':
    'Cliquez sur l’option que vous voulez. Son cercle se remplit et la barre derrière elle grandit.',
  'help.guide.vote-poll.step.2':
    'Maintenant tout le résultat est lisible : la barre est la part, le pourcentage est à droite, et les petits cercles sont les personnes qui ont choisi cette option.',
  'help.guide.vote-poll.step.3':
    'Vous avez changé d’avis ? Cliquez sur une autre option. Sur un sondage sans Choix multiples, votre vote se déplace au lieu d’en ajouter un second.',
  'help.guide.vote-poll.step.4':
    'Sous la question figure le nombre de votes du sondage. Un clic sur l’option que vous avez déjà choisie retire votre vote, et le compteur redescend.',
  'help.guide.vote-poll.result':
    'Votre coche est sur une option, les barres montrent comment le groupe se partage, et les cercles disent qui a choisi quoi.',
  'help.guide.vote-poll.tip.1':
    'Les barres et les pourcentages n’apparaissent qu’une fois que vous avez voté vous-même, ou une fois le sondage fermé, pour que personne ne soit influencé par les résultats en cours.',
  'help.guide.vote-poll.tip.2':
    'Un vote n’est jamais anonyme : survolez l’un des cercles d’une option pour le nom derrière.',
  // close-poll
  'help.guide.close-poll.title': 'Fermer un sondage, ou le retirer',
  'help.guide.close-poll.goal':
    'Arrêtez le vote une fois que le groupe a décidé, et enlevez un sondage dont personne n’a plus besoin.',
  'help.guide.close-poll.step.1':
    'Fermer, le cadenas dans le coin d’un sondage, met fin au vote. Les options n’acceptent plus les clics.',
  'help.guide.close-poll.step.2':
    'Un sondage fermé descend sous le titre Fermés en bas du panneau, porte un badge Fermé et montre le résultat à tout le monde, que l’on ait voté ou non. L’option gagnante est teintée en vert.',
  'help.guide.close-poll.step.3':
    'Supprimer, la corbeille dans le même coin, retire le sondage. Rien ne demande deux fois, et les votes partent avec lui.',
  'help.guide.close-poll.result':
    'Le sondage a disparu du panneau de chaque membre. Celui que vous avez seulement fermé reste lisible en bas, avec son résultat.',
  'help.guide.close-poll.tip.1':
    'Fermer ne s’annule pas : il n’y a pas de réouverture. Un sondage fermé par erreur doit être reposé.',
  'help.guide.close-poll.tip.2':
    'Supprimer retire le sondage et chacun de ses votes à tout le monde, tout de suite et sans question.',
  // whats-next
  'help.guide.whats-next.title': 'Lire À venir',
  'help.guide.whats-next.goal': 'Voyez ce que le groupe fait ensuite sans ouvrir le plan.',
  'help.guide.whats-next.step.1':
    'Le panneau liste les étapes du voyage encore devant vous, jusqu’à huit d’entre elles, dans l’ordre chronologique, sous un titre par jour : Aujourd’hui, Demain ou la date.',
  'help.guide.whats-next.step.2':
    'À gauche d’une ligne figure son heure : le début, à, et la fin quand l’étape en a une, ou TBD quand aucune heure n’est encore fixée.',
  'help.guide.whats-next.step.3':
    'Les pastilles sous le nom sont les personnes présentes à cette étape. Si personne n’a été choisi, tout le monde dans le voyage est listé.',
  'help.guide.whats-next.result':
    'Une liste de ce qui vient, en lecture seule : elle suit le plan, et rien ici ne le change.',
  'help.guide.whats-next.tip.1':
    'Rien ne se règle ici. Les heures viennent du plan du jour ; changez-les là-bas et cette liste suit aussitôt.',
  'help.guide.whats-next.tip.2':
    'Seul ce qui est encore devant est listé : une étape dont l’heure est passée sort de la liste, et à la fin d’un voyage le panneau est vide.',
  'help.guide.whats-next.tip.3':
    'Et ensuite est un interrupteur à part sous Extensions, sous Collaboration, et c’est un panneau de bureau : l’onglet Collaboration de l’application mobile ne le propose pas.',
  // trip-chat
  'help.guide.trip-chat.title': 'Parler au groupe',
  'help.guide.trip-chat.goal':
    'Dites quelque chose, répondez à un message précis, réagissez à un autre, et reprenez le vôtre.',
  'help.guide.trip-chat.step.1':
    'Écrivez dans Écrire un message… et appuyez sur Enter. La flèche bleue à côté de la zone fait la même chose ; Shift et Enter font un saut de ligne à la place.',
  'help.guide.trip-chat.step.2':
    'Le smiley ouvre le sélecteur d’emoji, avec Smileys, Reactions et Travel dedans. Ce que vous choisissez s’ajoute à ce que vous êtes en train d’écrire, ce n’est pas envoyé tout seul.',
  'help.guide.trip-chat.step.3':
    'Survolez le message de quelqu’un d’autre : un petit bouton rond apparaît dans son coin. C’est Répondre.',
  'help.guide.trip-chat.step.4':
    'Le message auquel vous répondez est cité au-dessus de la zone. Écrivez et envoyez, et la citation voyage avec votre bulle ; la croix sur la citation l’abandonne.',
  'help.guide.trip-chat.step.5':
    'Faites un clic droit sur un message pour les huit réactions rapides. La vôtre se place sous la bulle, et un second clic sur la même la retire.',
  'help.guide.trip-chat.step.6':
    'Vos propres messages portent Supprimer à côté de Répondre. Cela retire le message et laisse une ligne qui dit que vous l’avez supprimé : il n’y a pas de retour.',
  'help.guide.trip-chat.result':
    'Votre réponse est sous le message qu’elle cite, une réaction est accrochée à un troisième, et celui que vous avez repris laisse une seule ligne qui le dit.',
  'help.guide.trip-chat.tip.1':
    'Enter envoie, Shift et Enter font un saut de ligne. Un message qui n’est fait que d’emoji est affiché en grand.',
  'help.guide.trip-chat.tip.2':
    'Joindre des images prend jusqu’à quatre images pour un message ; elles peuvent aussi être simplement collées ou déposées sur la zone.',
  'help.guide.trip-chat.tip.3':
    'Un message contenant un lien reçoit une carte d’aperçu en dessous, récupérée par votre propre TREK, donc un lien vers quelque chose que vous seul pouvez atteindre reste un simple lien.',
  'help.guide.trip-chat.tip.4':
    'Chat est un interrupteur à part sous Extensions, sous Collaboration : un administrateur peut l’éteindre et laisser tourner les Notes, les Liens, les Sondages ainsi que Et ensuite.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listes',
  'help.ctx.trip-lists.summary':
    'Deux listes pour un voyage : la liste de bagages, avec qui apporte quoi et ce que cela pèse, et la liste de tout ce qui doit se faire avant et pendant. L’onglet est là tant que l’addon Listes est activé.',
  'help.ctx.trip-lists.bullet.1':
    'Liste de bagages et À faire en haut basculent entre les deux et comptent ce que chacune contient ; les boutons à droite appartiennent à celle qui est ouverte.',
  'help.ctx.trip-lists.bullet.2':
    'La liste de bagages est groupée en listes, Documents, Vêtements, comme vous voulez les appeler, chacune avec une pastille de couleur, un compteur emballé sur total et trois points contenant Renommer, Tout cocher, Tout décocher et Supprimer la liste. Ajouter une liste, dans la barre au-dessus, en crée une nouvelle.',
  'help.ctx.trip-lists.bullet.3':
    'Une ligne, c’est une case à cocher et un nom, puis, en petits badges, qui apporte l’article, la quantité et le poids en grammes, et une pastille de bagage tant que Suivi des bagages est activé, puis la corbeille et trois points contenant Déplacer vers une liste, Partage, Renommer et Supprimer. Ce qu’une ligne n’utilise pas reste estompé jusqu’à ce que vous le survoliez, et la poignée à gauche la fait monter ou descendre dans sa liste.',
  'help.ctx.trip-lists.bullet.4':
    'Partagé et Ma liste coupent la liste de bagages en deux : le fonds commun que tout le monde voit, et la vôtre. Tous, À faire et Fait restreignent celle qui est ouverte, et la barre au-dessus compte ce qui est emballé.',
  'help.ctx.trip-lists.bullet.5':
    'Appliquer un modèle et Enregistrer comme modèle remplissent ou conservent une liste sans la retaper, et les deux icônes à côté exportent la liste, en impression, en PDF ou en fichier, et en importent une. Le bouton rouge près de la barre de progression indique combien d’articles sont cochés et les efface.',
  'help.ctx.trip-lists.bullet.6':
    'À faire a sa propre barre latérale : la carte de progression, les filtres Tout, Mes tâches, En retard et Terminé, une ligne par liste et Ajouter une liste en dessous. Les tâches sont dans une carte dont l’en-tête nomme le filtre et porte le tri, Priorité ou Date d’échéance. Un clic sur une tâche l’ouvre dans le panneau de droite, et Nouvelle tâche ouvre le formulaire Nouvelle tâche au milieu de l’écran.',
  // packing-categories
  'help.guide.packing-categories.title': 'Construire la liste de bagages',
  'help.guide.packing-categories.goal':
    'Groupez ce que vous emportez en listes, remplissez-les d’articles et dites qui s’occupe de chaque liste.',
  'help.guide.packing-categories.step.1':
    'Cliquez sur Ajouter une liste dans la barre au-dessus des listes, tapez le nom dans Nom de la liste (ex. Vêtements) et cliquez sur Ajouter.',
  'help.guide.packing-categories.step.2':
    'La nouvelle liste commence par une ligne vide. Cliquez sur Ajouter un article, tapez l’article dans Nom de l’article… et appuyez sur Entrée ; le champ reste ouvert pour le suivant.',
  'help.guide.packing-categories.step.3':
    'Renommez une ligne en cliquant sur son nom, ou avec Renommer dans les trois points à son extrémité droite.',
  'help.guide.packing-categories.step.4':
    'Le cercle en pointillés dans l’en-tête de la liste attribue des membres du voyage à la liste. Choisissez un nom ; la pastille qui apparaît retire de nouveau cette personne d’un clic.',
  'help.guide.packing-categories.step.5':
    'Les trois points au bout de l’en-tête contiennent le reste : Renommer, Tout cocher, Tout décocher, et Supprimer la liste, qui emporte la liste et tout ce qu’elle contient sans demander de nouveau.',
  'help.guide.packing-categories.result':
    'La nouvelle liste s’installe dans la grille avec ses articles en dessous et sa pastille de couleur, et son compteur indique ce qui est déjà emballé.',
  'help.guide.packing-categories.tip.1':
    'Une liste n’est que ses articles. Supprimez le dernier et la ligne devient un espace réservé pour que la liste garde sa place et sa couleur ; supprimez aussi cette ligne et la liste disparaît.',
  'help.guide.packing-categories.tip.2':
    'Attribuer quelqu’un à une liste lui envoie une notification de bagages. Cela ne change pas qui peut voir les articles, c’est Partage, dans les trois points d’une ligne.',
  'help.guide.packing-categories.tip.3':
    'Deux listes peuvent porter le même nom. TREK les distingue en interne, les noms restent donc tels que vous les avez tapés.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Cocher au fur et à mesure',
  'help.guide.check-off-packing.goal':
    'Marquez ce qui est dans le sac, regardez la barre, et effacez les articles emballés.',
  'help.guide.check-off-packing.step.1':
    'Cliquez sur la case à gauche d’une ligne. Le nom est barré et la barre bouge.',
  'help.guide.check-off-packing.step.2':
    'La barre au-dessus compte ce qui est emballé par rapport à tout ce qui est sur la liste, en nombre et en pourcentage.',
  'help.guide.check-off-packing.step.3':
    'Une liste entière d’un coup : les trois points de son en-tête contiennent Tout cocher et Tout décocher.',
  'help.guide.check-off-packing.step.4':
    'Tous, À faire et Fait restreignent la grille. À faire ne laisse que ce qui manque encore, une liste entièrement emballée en sort donc.',
  'help.guide.check-off-packing.step.5':
    'Supprimer 3 cochés à côté de la barre de progression supprime tous les articles cochés d’un coup, après une confirmation du navigateur.',
  'help.guide.check-off-packing.result':
    'Seul ce qui reste ouvert est listé, et la barre au-dessus dit où en est l’emballage.',
  'help.guide.check-off-packing.tip.1': 'Un article coché peut quand même être renommé : cliquez sur son nom.',
  'help.guide.check-off-packing.tip.2':
    'Tout cocher et Tout décocher agissent sur une liste à la fois, depuis les trois points de cette liste.',
  'help.guide.check-off-packing.tip.3':
    'Quand chaque article est coché, le compteur est remplacé par Tout est emballé ! et la barre passe au vert.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Appliquer un modèle de bagages',
  'help.guide.apply-packing-template.goal':
    'Faites entrer une liste toute prête dans le voyage, et gardez la liste de ce voyage pour le suivant.',
  'help.guide.apply-packing-template.step.1': 'Cliquez sur Appliquer un modèle dans la barre au-dessus de la liste.',
  'help.guide.apply-packing-template.step.2':
    'Choisissez un modèle. Chaque ligne le nomme et dit combien d’articles il contient.',
  'help.guide.apply-packing-template.step.3':
    'Les articles arrivent dans la vue où vous êtes : Partagé les met dans le fonds commun que tout le monde voit, Ma liste les rend vôtres.',
  'help.guide.apply-packing-template.step.4':
    'Garder la liste de ce voyage pour le prochain : Enregistrer comme modèle ouvre une boîte de dialogue, tapez un nom et cliquez sur Enregistrer.',
  'help.guide.apply-packing-template.result':
    'Les listes et les articles du modèle sont dans le voyage, à côté de ce qui s’y trouvait déjà.',
  'help.guide.apply-packing-template.tip.1':
    'Un modèle ne porte que des noms et des listes. Les quantités, les poids, les bagages et ce qui est déjà coché restent en arrière.',
  'help.guide.apply-packing-template.tip.2':
    'Appliquer un modèle n’est là qu’une fois qu’un modèle existe. Sans modèle, le bouton n’apparaît pas du tout.',
  'help.guide.apply-packing-template.tip.3':
    'Enregistrer comme modèle n’apparaît que pour un administrateur de l’instance, et seulement tant que la liste a des articles. Il enregistre le fonds commun plus vos propres articles, jamais les articles privés d’un autre membre.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Coller une liste de bagages entière',
  'help.guide.import-packing-list.goal':
    'Transformez d’un seul coup une liste que vous avez déjà ailleurs en articles de bagages.',
  'help.guide.import-packing-list.step.1':
    'Cliquez sur le bouton d’import avec la flèche vers le bas dans la barre au-dessus de la liste.',
  'help.guide.import-packing-list.step.2':
    'Un article par ligne : Catégorie, Nom, Poids en g (facultatif), Bagage (facultatif), checked/unchecked (facultatif). L’exemple gris dans le cadre montre les quatre formes. Une liste Markdown fonctionne aussi : un titre nomme la liste, et "- [ ]" et "- [x]" deviennent des articles.',
  'help.guide.import-packing-list.step.3':
    'Ou chargez les lignes depuis un fichier avec Charger CSV/TXT/MD. Il prend un .csv, un .txt ou un .md et remplace ce qui est dans le cadre.',
  'help.guide.import-packing-list.step.4': 'Cliquez sur Importer. Le bouton compte les lignes qu’il a comprises.',
  'help.guide.import-packing-list.result':
    'Chaque ligne devient un article, dans la liste que nomme son premier champ, et rien de ce qui était déjà là n’est touché.',
  'help.guide.import-packing-list.tip.1':
    'Les virgules, les points-virgules et les tabulations séparent les champs de la même façon, et les guillemets tiennent un champ ensemble, de sorte que « Chemise, bleue » reste un seul nom. Une ligne avec une seule valeur n’est qu’un nom, une ligne sans liste à elle atterrit dans Autre, et "3x" devant un nom fixe la quantité.',
  'help.guide.import-packing-list.tip.2':
    'Un bagage nommé dans le quatrième champ est créé si le voyage ne l’a pas encore. C’est le seul endroit qui charge des poids et des bagages en masse ; un modèle n’apporte que des noms et des listes.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimer ou exporter la liste de bagages',
  'help.guide.export-packing-list.goal':
    'Emportez la liste sur papier, en PDF ou sous forme de fichier pour une autre application ou le prochain voyage.',
  'help.guide.export-packing-list.step.1':
    'Cliquez sur le bouton d’export avec la flèche vers le haut dans la barre au-dessus de la liste.',
  'help.guide.export-packing-list.step.2':
    'Checklist Markdown (.md) et CSV pour l’import (.csv) enregistrent aussitôt la liste dans un fichier.',
  'help.guide.export-packing-list.step.3':
    'Cliquez sur Imprimer ou enregistrer en PDF. L’aperçu montre la liste sous forme de page : le voyage et ses dates en haut, puis chaque liste sous forme de carte avec une case à cocher.',
  'help.guide.export-packing-list.step.4':
    'Cliquez sur Imprimer ou enregistrer en PDF sous l’aperçu. Le navigateur ouvre sa boîte de dialogue d’impression : choisissez une imprimante, ou Enregistrer au format PDF pour garder un fichier.',
  'help.guide.export-packing-list.result':
    'L’impression et les fichiers reprennent la vue ouverte, Partagé ou Ma liste, avec les quantités, les poids et les coches.',
  'help.guide.export-packing-list.tip.1':
    'Le CSV est le format que lit Importer, bagages compris, il sert donc de modèle de bagages bien à vous : importez-le dans le prochain voyage.',
  'help.guide.export-packing-list.tip.2':
    'Le fichier Markdown s’ouvre comme une checklist dans Obsidian, Notion ou GitHub, et revient de la même façon par Importer.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Décider qui voit un article et qui l’apporte',
  'help.guide.share-packing-item.goal':
    'Déplacez un article entre le fonds commun du groupe, votre propre liste et les personnes pour qui vous l’apportez.',
  'help.guide.share-packing-item.step.1':
    'Partagé au-dessus des listes est le fonds commun que tout le monde voit, Ma liste est la vôtre, et chacune compte ce qu’elle contient. Cliquez sur Ma liste pour regarder la vôtre.',
  'help.guide.share-packing-item.step.2':
    'De retour dans Partagé, ouvrez les trois points au bout d’une ligne et cliquez sur Partage.',
  'help.guide.share-packing-item.step.3':
    'Trois niveaux : Partagé, dans le fonds commun du groupe et visible par tous ; Personnel, que vous seul voyez ; et Partager avec…, où vous choisissez les personnes que l’article couvre.',
  'help.guide.share-packing-item.step.4': 'Un article Personnel n’est que sur Ma liste. Basculez pour le retrouver.',
  'help.guide.share-packing-item.step.5':
    'Ouvrez de nouveau Partage et cochez un nom sous Partager avec…. L’article apparaît aussi sur la liste de cette personne, et la ligne reçoit un petit badge qui compte les personnes avec qui il est partagé.',
  'help.guide.share-packing-item.result':
    'L’article se place dans le niveau que vous avez choisi, et la ligne dit qui l’apporte.',
  'help.guide.share-packing-item.tip.1':
    'Seule la personne qui apporte un article change son partage. Celui avec qui vous l’avez partagé le voit sur sa propre Ma liste, marqué de votre nom, et peut le cocher.',
  'help.guide.share-packing-item.tip.2':
    'Sur un article apporté par quelqu’un d’autre, vous obtenez deux autres boutons à la place : Je peux l’apporter aussi, qui vous ajoute à côté, et Copier dans ma liste, qui en fait une copie privée à vous.',
  'help.guide.share-packing-item.tip.3':
    'Les nouveaux articles héritent de la vue dans laquelle vous les ajoutez. Ajoutés dans Ma liste ils sont Personnel, ajoutés dans Partagé ils vont dans le fonds commun.',
  // packing-bags
  'help.guide.packing-bags.title': 'Peser les bagages',
  'help.guide.packing-bags.goal':
    'Mettez un poids sur chaque article, répartissez les articles dans les bagages et gardez chaque bagage sous sa limite de compagnie aérienne.',
  'help.guide.packing-bags.step.1':
    'Cliquez sur le badge de poids avant le cercle et tapez le poids de l’article en grammes.',
  'help.guide.packing-bags.step.2': 'Le cercle au bout de la ligne est son bagage. Cliquez dessus.',
  'help.guide.packing-bags.step.3':
    'Pas encore de bagage : Ajouter un bagage, un nom, Entrée. Le bagage est créé et l’article y va directement.',
  'help.guide.packing-bags.step.4':
    'Le panneau Bagages apparaît à droite dès qu’un bagage existe : nom, poids, une barre de remplissage, qui le porte et combien d’articles il contient, puis Non assigné et Poids total.',
  'help.guide.packing-bags.step.5':
    'Cliquez sur Définir une limite et tapez la limite en kilogrammes, comme les compagnies aériennes l’indiquent.',
  'help.guide.packing-bags.step.6': 'Le signe plus en pointillés à côté du nom d’un bagage dit qui le porte.',
  'help.guide.packing-bags.result':
    'Le panneau Bagages à droite montre le poids de chaque bagage face à sa limite, ce qui n’est dans aucun bagage, et le total.',
  'help.guide.packing-bags.tip.1':
    'Le champ de poids, la pastille de bagage et le panneau Bagages n’existent que tant qu’un administrateur a activé Suivi des bagages sous l’addon Listes.',
  'help.guide.packing-bags.tip.2':
    'Le poids d’un bagage est additionné sur le serveur sur les articles de tous les membres, y compris ceux que vous ne pouvez pas voir, le chiffre est donc vraiment ce que pèse le bagage.',
  'help.guide.packing-bags.tip.3':
    'Un bagage sans limite est dessiné par rapport au bagage le plus lourd, pour que les barres restent comparables. Donnez-lui une limite et la barre se lit par rapport à elle.',
  // create-todo
  'help.guide.create-todo.title': 'Ajouter une tâche',
  'help.guide.create-todo.goal':
    'Notez quelque chose qui doit se faire, avec une liste, une priorité, une date et un nom en face.',
  'help.guide.create-todo.step.1': 'Cliquez sur Nouvelle tâche en haut à droite.',
  'help.guide.create-todo.step.2':
    'Nommez-la dans Nom de la tâche, et mettez tout ce qui vaut la peine d’être retenu sous Description.',
  'help.guide.create-todo.step.3':
    'Liste groupe la tâche. Choisissez-en une, ou utilisez le signe plus à côté pour en nommer une nouvelle dans une petite fenêtre.',
  'help.guide.create-todo.step.4': 'Priorité, ce sont quatre boutons : Aucune, P1, P2 et P3, du rouge au bleu.',
  'help.guide.create-todo.step.5': 'Date d’échéance ouvre un calendrier, et Assigné à met un nom sur la tâche.',
  'help.guide.create-todo.step.6': 'Cliquez sur Créer la tâche.',
  'help.guide.create-todo.result':
    'La tâche est dans la liste avec ses badges, la priorité, la date d’échéance, la liste et la personne à qui elle est assignée, et elle s’ouvre dans le panneau de droite.',
  'help.guide.create-todo.tip.1':
    'Seul le nom est obligatoire. Tout le reste peut être rempli plus tard depuis le panneau de droite.',
  'help.guide.create-todo.tip.2':
    'Avec une liste sélectionnée dans la barre latérale, une nouvelle tâche démarre dans cette liste.',
  'help.guide.create-todo.tip.3':
    'Entrée dans le champ du nom crée la tâche tout de suite, sans toucher aux autres champs.',
  // todo-filters
  'help.guide.todo-filters.title': 'Trouver et modifier une tâche',
  'help.guide.todo-filters.goal':
    'Réduisez la liste des tâches à ce qui compte maintenant, puis modifiez la tâche sur laquelle vous êtes tombé.',
  'help.guide.todo-filters.step.1':
    'Tâches dans la barre latérale : Tout, c’est tout ce qui reste ouvert, Mes tâches ce qui est sur vous, En retard ce qui a une date passée, Terminé ce qui est fini. Chacun porte son compte ; cliquez sur En retard.',
  'help.guide.todo-filters.step.2':
    'Sous Listes se trouve une ligne par liste. En choisir une montre cette liste, tâches terminées comprises.',
  'help.guide.todo-filters.step.3':
    'Le tri dans l’en-tête de la liste réordonne ce qui est à l’écran : Priorité met P1 en premier, Date d’échéance met l’échéance la plus proche en premier. Un seul des deux à la fois, et un second clic revient à votre propre ordre.',
  'help.guide.todo-filters.step.4': 'Cliquez sur une tâche pour l’ouvrir dans le panneau de droite.',
  'help.guide.todo-filters.step.5':
    'Changez ce qu’il vous faut, Description, Priorité, Liste, Date d’échéance ou Assigné à, puis Enregistrer les modifications. La case dans l’en-tête du panneau coche la tâche, et Supprimer l’emporte aussitôt.',
  'help.guide.todo-filters.result':
    'La liste ne montre que les tâches que vous avez demandées, et le panneau de droite modifie celle que vous avez choisie.',
  'help.guide.todo-filters.tip.1':
    'Une ligne de liste ne compte que ce qui reste ouvert, mais la sélectionner montre aussi les tâches terminées. Tout, Mes tâches et En retard cachent ce qui est fait ; Terminé ne montre rien d’autre.',
  'help.guide.todo-filters.tip.2':
    'Priorité et Date d’échéance dans le tri s’excluent, et tant que l’un des deux est actif, les lignes ne peuvent plus être glissées dans un ordre à vous.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Réservations',
  'help.ctx.trip-bookings.summary':
    'L’onglet qui tient tout ce qui est réservé pour le voyage sans être un moyen de se déplacer : les hébergements, les tables, les billets, les visites, les parkings. Chaque réservation est une carte dans En attente ou dans Confirmée, avec son code, son document, ses voyageurs et son coût.',
  'help.ctx.trip-bookings.bullet.1':
    'Réservation manuelle, en haut à droite, ouvre le formulaire. Les six sortes qu’il crée sont Hébergement, Restaurant, Événement, Visite, Parking et Autre ; les vols, les trains et le reste vivent dans l’onglet Transports et n’apparaissent jamais ici.',
  'help.ctx.trip-bookings.bullet.2':
    'Importer depuis un fichier remet une confirmation à l’analyse : EML, PDF, PKPass, HTML ou TXT, cinq fichiers de 10 Mo au plus. Le bouton n’est là que si le serveur sait les lire.',
  'help.ctx.trip-bookings.bullet.3':
    'Les pastilles à côté du titre filtrent par sorte, chacune avec son propre compte, et Tout ramène tout. Dès qu’une réservation nomme des personnes, la rangée d’avatars à côté des pastilles réduit l’onglet à l’une d’elles.',
  'help.ctx.trip-bookings.bullet.4':
    'Les cartes se tiennent dans deux sections, En attente et Confirmée, chacune avec son compte. Un clic sur le titre d’une section la replie, et le fait qu’elle soit ouverte est retenu pour ce voyage.',
  'help.ctx.trip-bookings.bullet.5':
    'Une carte porte le point de statut, la sorte, le titre, les dates et les heures, son Code de réservation, son Lieu / Adresse, ce à quoi la réservation est liée, son Lien, ses Notes, ses Fichiers et ses Voyageurs.',
  'help.ctx.trip-bookings.bullet.6':
    'Le crayon d’une carte rouvre le même formulaire ; la corbeille demande une fois et la réservation a disparu. Pour un hébergement, ses nuits dans le Plan du jour et sa dépense liée partent avec elle.',
  // create-booking
  'help.guide.create-booking.title': 'Créer une réservation',
  'help.guide.create-booking.goal':
    'Ajoutez à la main au voyage un restaurant, un événement, une visite, une place de parking ou n’importe quoi d’autre.',
  'help.guide.create-booking.step.1':
    'Cliquez sur Réservation manuelle en haut à droite de l’onglet. Nouvelle réservation s’ouvre.',
  'help.guide.create-booking.step.2':
    'Choisissez le Type de réservation dans la liste en haut du formulaire, à côté de Voyageurs. Hébergement, Restaurant, Événement, Visite, Parking et Autre sont les six que cet onglet crée, et le formulaire change avec le choix : seul Hébergement échange ses dates contre une plage de jours.',
  'help.guide.create-booking.step.3':
    'Tapez le Titre. C’est le seul champ sur lequel le formulaire insiste, et Ajouter reste mort tant qu’il est vide.',
  'help.guide.create-booking.step.4':
    'Réglez Date et Heure de début, puis Date de fin et Heure de fin si la réservation a une fin. Les calendriers ne proposent que les jours à l’intérieur du voyage, et une fin qui n’est pas après le début le dit en rouge et bloque Ajouter.',
  'help.guide.create-booking.step.5':
    'Entrez le Code de réservation de la confirmation et réglez Statut. En attente ou Confirmée décide dans laquelle des deux sections la carte atterrit.',
  'help.guide.create-booking.step.6': 'Cliquez sur Ajouter.',
  'help.guide.create-booking.result':
    'La réservation est une carte dans sa section, avec sa pastille de sorte, ses dates et son code, et tous les autres du voyage la voient apparaître.',
  'help.guide.create-booking.tip.1':
    'Lieu / Adresse propose de vraies adresses pendant que vous tapez ; en choisir une remplace ce que vous aviez écrit, et une adresse que vous avez tapée vous-même est gardée telle quelle.',
  'help.guide.create-booking.tip.2':
    'Lien prend la page de la réservation chez le prestataire. La carte en fait un lien qui s’ouvre dans un nouvel onglet.',
  'help.guide.create-booking.tip.3':
    'Les Notes sont du Markdown, une liste ou une ligne en gras est donc rendue comme telle sur la carte.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Réserver un hébergement',
  'help.guide.booking-hotel.goal':
    'Entrez un hébergement pour qu’il compte à la fois comme réservation et comme nuits dans le Plan du jour.',
  'help.guide.booking-hotel.step.1':
    'Cliquez sur Réservation manuelle et choisissez Hébergement. Les champs de date s’en vont et un bloc de champs d’hôtel prend leur place.',
  'help.guide.booking-hotel.step.2':
    'Choisissez l’hôtel sous Hébergement. La liste, ce sont les lieux du voyage, et en choisir un écrit son nom dans Titre et son adresse dans Lieu / Adresse.',
  'help.guide.booking-hotel.step.3':
    'Réglez Du et Au : la première nuit et le matin de votre départ. Les deux proposent les jours du voyage avec leurs dates, et ils se tiennent en ordre l’un l’autre.',
  'help.guide.booking-hotel.step.4':
    'Remplissez Arrivée, Check-in jusqu’à et Départ, ainsi que le Code de réservation de la confirmation.',
  'help.guide.booking-hotel.step.5': 'Cliquez sur Ajouter.',
  'help.guide.booking-hotel.result':
    'La carte porte une plage de jours au lieu d’une date, avec les heures d’arrivée et de départ et l’adresse, et le même séjour se trouve désormais sur ces jours du plan.',
  'help.guide.booking-hotel.tip.1':
    'Hébergement est le seul type sans Date ni Heure de début. Ses dates sont Du et Au, et ce sont des jours du voyage plutôt qu’un calendrier.',
  'help.guide.booking-hotel.tip.2':
    'Laissez Hébergement vide et tapez plutôt l’adresse : le lieu est cherché, créé et épinglé sur la carte pour vous.',
  'help.guide.booking-hotel.tip.3': 'Supprimer la réservation retire les nuits du Plan du jour avec elle.',
  // link-booking
  'help.guide.link-booking.title': 'Rattacher une réservation au plan',
  'help.guide.link-booking.goal':
    'Accrochez une réservation à l’étape et au lieu auxquels elle appartient, pour qu’elle apparaisse là où vous en aurez besoin.',
  'help.guide.link-booking.step.1':
    'Cliquez sur le crayon de la carte que vous voulez lier. Modifier la réservation s’ouvre.',
  'help.guide.link-booking.step.2':
    'Ouvrez Lier à l’affectation du jour. La liste, c’est votre plan : un titre par jour, puis les étapes de ce jour, numérotées et avec leurs heures. Choisissez celle à laquelle la réservation appartient.',
  'help.guide.link-booking.step.3':
    'Lieu / Activité lie le lieu lui-même. Choisissez-le là, et Titre et Lieu / Adresse se remplissent partout où vous les avez laissés vides.',
  'help.guide.link-booking.step.4': 'Cliquez sur Mettre à jour.',
  'help.guide.link-booking.result':
    'La carte nomme le jour et l’étape sous Lier à l’affectation du jour, et la réservation voyage avec cette étape dans le Plan du jour.',
  'help.guide.link-booking.tip.1':
    'Aucun lien (autonome), en haut de la liste, retire le lien. Hébergement n’a aucun sélecteur d’étape : il se lie par ses nuits.',
  'help.guide.link-booking.tip.2':
    'Choisir une étape sur un jour daté remplit une Date vide pour vous. Une date que vous avez déjà réglée est laissée telle quelle.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Dire pour qui est une réservation',
  'help.guide.booking-travelers.goal': 'Marquez les voyageurs que couvre une réservation, puis ne voyez que les leurs.',
  'help.guide.booking-travelers.step.1':
    'Ouvrez la réservation avec le crayon. Voyageurs se trouve en haut du formulaire, à côté de Type de réservation, et affiche Assigner des voyageurs tant que personne n’est sur la réservation.',
  'help.guide.booking-travelers.step.2':
    'Cliquez dessus et choisissez les personnes pour qui est cette réservation ; les invités nommés sont aussi dans la liste. Une personne choisie reçoit une coche et son avatar dans le champ. Cliquez de nouveau sur le nom pour l’enlever.',
  'help.guide.booking-travelers.step.3': 'Cliquez sur Mettre à jour.',
  'help.guide.booking-travelers.step.4':
    'En haut, dans la barre d’outils, à côté des pastilles de sorte, cliquez l’avatar d’un voyageur pour ne voir que ses réservations.',
  'help.guide.booking-travelers.result':
    'La carte liste les personnes pour qui elle est, et la rangée d’avatars réduit l’onglet à l’une d’elles.',
  'help.guide.booking-travelers.tip.1':
    'Sur la carte, les voyageurs sont seulement montrés, jamais modifiés. Ils se règlent ici, dans le formulaire.',
  'help.guide.booking-travelers.tip.2':
    'La rangée d’avatars apparaît dès que le voyage a plus d’un membre et qu’au moins une réservation nomme quelqu’un. Ce que vous choisissez dure le temps de cette session du navigateur.',
  // booking-files
  'help.guide.booking-files.title': 'Garder le justificatif avec la réservation',
  'help.guide.booking-files.goal':
    'Joignez la confirmation, le billet ou le laissez-passer à la réservation à laquelle ils appartiennent.',
  'help.guide.booking-files.step.1':
    'Ouvrez la réservation avec le crayon, descendez jusqu’à Fichiers et cliquez sur Joindre un fichier. Sur une réservation qui existe déjà, le document part tout de suite et TREK dit Fichier importé.',
  'help.guide.booking-files.step.2': 'Le document est listé par son nom, avec un bouton pour l’ouvrir et un X à côté.',
  'help.guide.booking-files.step.3':
    'Lier un fichier existant propose les documents du voyage qui ne sont pas encore sur cette réservation. Choisissez-en un et il est joint sans rien importer de nouveau.',
  'help.guide.booking-files.step.4': 'Cliquez sur Mettre à jour.',
  'help.guide.booking-files.result': 'La carte liste les documents sous Fichiers, et un clic sur l’un d’eux l’ouvre.',
  'help.guide.booking-files.tip.1':
    'Sur une réservation que vous êtes en train de créer, le document attend et part au moment où vous cliquez sur Ajouter.',
  'help.guide.booking-files.tip.2':
    'Le X à côté d’un document retire le lien, pas le document. Il reste dans l’onglet Fichiers du voyage.',
  'help.guide.booking-files.tip.3':
    'Quels types de fichiers peuvent être joints relève de la liste Types de fichiers autorisés de l’administrateur ; les documents, le texte et les images sont permis d’origine.',
  // booking-cost
  'help.guide.booking-cost.title': 'Transformer le prix d’une réservation en coût',
  'help.guide.booking-cost.goal':
    'Faites entrer ce que coûte une réservation dans les Coûts, partagé entre les personnes qui paient.',
  'help.guide.booking-cost.step.1':
    'Ouvrez la réservation et descendez au bas du formulaire. Sous Coûts se trouvent Créer une dépense et Lier une dépense existante, avec la note Enregistre la réservation, puis ouvre l’éditeur de dépenses.',
  'help.guide.booking-cost.step.2':
    'Cliquez sur Créer une dépense. La réservation est enregistrée, son formulaire se ferme et l’éditeur de Coûts s’ouvre.',
  'help.guide.booking-cost.step.3':
    'C’était pour quoi ? est déjà le titre de la réservation. Entrez le Montant total et vérifiez la Devise et le Jour.',
  'help.guide.booking-cost.step.4':
    'Catégorie est celle qu’implique le type de réservation. Réglez Qui a payé ? et la façon dont le montant est partagé.',
  'help.guide.booking-cost.step.5': 'Cliquez sur Ajouter une dépense.',
  'help.guide.booking-cost.result':
    'Le formulaire de la réservation affiche maintenant la dépense sous Dépenses liées avec son montant, et la même dépense se trouve dans l’onglet Coûts, rattachée à cette réservation.',
  'help.guide.booking-cost.tip.1':
    'La catégorie suit le type : Restaurant devient Nourriture et boissons, Hébergement devient Hébergement, Parking devient Parking, et Événement et Visite atterrissent tous deux dans Autre.',
  'help.guide.booking-cost.tip.2':
    'Une réservation peut porter plusieurs dépenses. Lier une dépense existante propose celles de Coûts qui ne sont encore rattachées à rien. Sur une dépense liée, Délier, garder la dépense la détache et la laisse dans Coûts, tandis que la corbeille la retire.',
  'help.guide.booking-cost.tip.3':
    'Coûts n’est dans le formulaire que tant que l’extension Coûts est activée, ce que l’administrateur règle sous Extensions.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Retrouver une réservation',
  'help.guide.filter-bookings.goal': 'Réduisez un onglet long à la sorte, à la personne ou à l’état que vous cherchez.',
  'help.guide.filter-bookings.step.1':
    'Les pastilles à côté du titre sont les sortes que ce voyage utilise vraiment, chacune avec le nombre qu’elle contient. Tout, c’est l’onglet entier.',
  'help.guide.filter-bookings.step.2':
    'Cliquez une pastille pour ne garder que cette sorte. Cliquez-en une deuxième et les deux sont gardées.',
  'help.guide.filter-bookings.step.3': 'Tout remet tout en place.',
  'help.guide.filter-bookings.step.4':
    'Les avatars à côté des pastilles filtrent par voyageur, une personne ou plusieurs à la fois.',
  'help.guide.filter-bookings.step.5':
    'En attente et Confirmée sont les deux sections, chacune avec son compte. Cliquez un titre pour en replier une ; elle est encore repliée quand vous revenez.',
  'help.guide.filter-bookings.result':
    'L’onglet ne montre que ce que vous avez choisi, et c’est encore choisi quand vous y revenez dans cette session du navigateur.',
  'help.guide.filter-bookings.tip.1':
    'Les pastilles ne proposent que les sortes que le voyage a, un voyage sans une seule visite n’a donc pas de pastille Visite.',
  'help.guide.filter-bookings.tip.2':
    'Un filtre qui ne trouve rien laisse l’onglet vide avec Aucun lieu trouvé. La formulation est celle de la liste des lieux ; le sens est le même.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Lire une réservation dans sa confirmation',
  'help.guide.import-booking-file.goal':
    'Laissez TREK tirer la réservation du courriel ou du PDF envoyé par le prestataire, au lieu de la retaper.',
  'help.guide.import-booking-file.step.1':
    'Cliquez sur Importer depuis un fichier dans la barre d’outils. Importer des confirmations de réservation s’ouvre.',
  'help.guide.import-booking-file.step.2':
    'Déposez les confirmations sur la zone, ou cliquez-la et choisissez-les : EML, PDF, PKPass, HTML et TXT, jusqu’à cinq fichiers de 10 Mo chacun. Celles que vous avez choisies sont nommées sur la zone.',
  'help.guide.import-booking-file.step.3':
    'Cliquez sur Importer. Le dialogue se ferme aussitôt, car la lecture se fait en arrière-plan.',
  'help.guide.import-booking-file.step.4':
    'Une carte en bas à droite rend compte de l’exécution sous le nom du fichier, et elle vous suit à travers l’application et à travers un rechargement. Analyse des fichiers… devient une coche quand la lecture est finie, et la carte propose Importer. Cliquez dessus.',
  'help.guide.import-booking-file.result':
    'La réservation est une carte dans En attente avec ses nuits, son code et la confirmation sous Fichiers, le séjour se pose sur ces jours du plan, et avec Coûts activé le prix est une dépense qui lui est liée.',
  'help.guide.import-booking-file.tip.1':
    'Importer depuis un fichier n’est là que si le serveur sait lire les confirmations, ce qui demande soit l’extracteur, soit l’extension Analyse par IA. Celle-ci, l’administrateur la règle sous Extensions.',
  'help.guide.import-booking-file.tip.2':
    'Si rien n’a pu être lu, la carte le dit et propose Try AI parsing, qui envoie les mêmes fichiers directement au modèle. Une analyse terminée est gardée dix minutes ; lancez la revue dans ce délai.',
  'help.guide.import-booking-file.tip.3':
    'La confirmation n’est jointe que si son type figure dans les Types de fichiers autorisés des réglages d’administration. PDF y est d’office ; un courriel, EML, doit d’abord être ajouté, sinon la réservation est enregistrée sans lui.',
  // edit-booking
  'help.guide.edit-booking.title': 'Modifier une réservation',
  'help.guide.edit-booking.goal':
    'Corrigez une heure, ajoutez le code arrivé plus tard, ou faites passer une réservation de En attente à Confirmée.',
  'help.guide.edit-booking.step.1':
    'Cliquez sur le crayon dans l’en-tête de la carte. Modifier la réservation s’ouvre avec tout ce que la réservation sait.',
  'help.guide.edit-booking.step.2':
    'Changez ce qui doit changer, ici le Code de réservation que le prestataire a fini par envoyer.',
  'help.guide.edit-booking.step.3': 'Mettez Statut sur Confirmée.',
  'help.guide.edit-booking.step.4': 'Cliquez sur Mettre à jour.',
  'help.guide.edit-booking.result':
    'La carte se déplace : une réservation confirmée se tient dans la section Confirmée derrière un point vert, et tout le monde dans le voyage la voit bouger.',
  'help.guide.edit-booking.tip.1':
    'Un Code de réservation que vous n’arrivez pas à lire, c’est Masquer les codes de réservation dans les Paramètres, sous Affichage. Survolez-le, ou cliquez-le, et il devient lisible.',
  'help.guide.edit-booking.tip.2':
    'Changez le type et la catégorie d’une dépense liée suit, sauf si vous aviez choisi une catégorie à la main dans l’éditeur de Coûts.',
  'help.guide.edit-booking.tip.3':
    'Un hébergement se modifie ici aussi : ses jours Du et Au sont dans le même formulaire.',
  // delete-booking
  'help.guide.delete-booking.title': 'Supprimer une réservation',
  'help.guide.delete-booking.goal': 'Sortez du voyage une réservation qui est tombée à l’eau.',
  'help.guide.delete-booking.step.1': 'Cliquez sur la corbeille dans l’en-tête de la carte.',
  'help.guide.delete-booking.step.2':
    'Supprimer la réservation ? nomme celle que vous avez choisie et dit qu’elle sera définitivement supprimée.',
  'help.guide.delete-booking.step.3': 'Cliquez sur Confirmer.',
  'help.guide.delete-booking.result':
    'La carte a disparu, pour tout le monde dans le voyage. Une réservation n’a pas d’annulation, la question est donc le dernier arrêt.',
  'help.guide.delete-booking.tip.1':
    'Supprimer une réservation d’hébergement retire aussi ses nuits du Plan du jour et supprime la dépense qui y était liée.',
  'help.guide.delete-booking.tip.2':
    'Les documents qui étaient joints restent dans l’onglet Fichiers du voyage ; seul leur lien avec la réservation s’en va.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Chaque réservation trouvée s’ouvre dans Nouvelle réservation, l’une après l’autre, déjà remplie. Pour un hôtel, c’est le nom dans Titre et, quand le voyage a le lieu, sous Hébergement, son Lieu / Adresse, Du et Au sur ses nuits, Arrivée et Départ, le Code de réservation, la confirmation sous Fichiers et, avec Coûts activé, le prix en Dépense liée. Contrôlez-la et cliquez sur Ajouter.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Coûts',
  'help.ctx.trip-costs.summary':
    'L’argent du voyage : chaque dépense dans un registre daté, qui l’a avancée et qui la doit, dans la devise du reçu, et, dans la colonne de droite, qui doit payer qui pour que tout soit à nouveau équilibré.',
  'help.ctx.trip-costs.bullet.1':
    'Quatre cartes en haut : Vous devez et On vous doit sont votre propre côté du règlement, Montant en attente est ce qui est enregistré mais n’a pas encore de payeur, et Dépenses totales du voyage additionne tout, avec Votre part et Vous avez payé en dessous.',
  'help.ctx.trip-costs.bullet.2':
    'Ajouter une dépense en haut à droite ouvre l’éditeur ; Régler à côté enregistre d’un coup tous les transferts ouverts.',
  'help.ctx.trip-costs.bullet.3':
    'Le registre est groupé par jour, le plus récent en premier, avec le total de ce jour à droite. Une ligne porte la catégorie comme onglet coloré, le nom, les pastilles des payeurs, la note et le montant, plus vous avez prêté ou vous avez emprunté quand le partage vous laisse en positif ou en négatif dessus.',
  'help.ctx.trip-costs.bullet.4':
    'Au-dessus de la liste se trouvent Rechercher des dépenses…, un filtre de catégorie, un filtre de jour, le sélecteur Toutes / Payées par moi / On me doit et le bouton Exporter CSV.',
  'help.ctx.trip-costs.bullet.5':
    'La colonne de droite est la réponse : Régler liste qui paie qui, Soldes montre l’excédent ou le déficit de chaque voyageur, Budget final ce que le voyage coûte à chacun d’eux, et Par catégorie où est parti l’argent.',
  'help.ctx.trip-costs.bullet.6':
    'Un paiement enregistré est dans le même registre comme sa propre ligne, avec Modifier et Annuler à côté ; une dépense a un crayon et une corbeille, et la corbeille la supprime sans demander.',
  // add-expense
  'help.guide.add-expense.title': 'Ajouter une dépense',
  'help.guide.add-expense.goal': 'Enregistrez ce qu’une chose a coûté, qui l’a payée et avec qui elle est partagée.',
  'help.guide.add-expense.step.1':
    'Cliquez sur Ajouter une dépense en haut à droite de l’onglet Coûts. L’éditeur s’ouvre, daté d’aujourd’hui, avec tout le monde déjà dans le partage.',
  'help.guide.add-expense.step.2':
    'Tapez à quoi elle a servi dans C’était pour quoi ?, le seul champ qui doit être rempli, et le chiffre du reçu dans Montant total.',
  'help.guide.add-expense.step.3':
    'Devise et Jour se trouvent sous le montant. Devise part sur celle du voyage ; changez-la et l’éditeur montre ce que le montant vaut dans la devise du voyage. Jour part sur aujourd’hui et c’est sous ce jour que le registre groupe la dépense.',
  'help.guide.add-expense.step.4':
    'Choisissez une Catégorie. Il y en a quatorze et elles ne peuvent pas être modifiées : celle que vous choisissez est l’onglet coloré de la ligne et la barre dans Par catégorie.',
  'help.guide.add-expense.step.5':
    'Sous Qui a payé ?, choisissez la personne qui a réellement avancé l’argent. Vous est présélectionné ; Personne n’a encore payé enregistre le montant sans que personne ne le doive, et Plusieurs personnes ont payé répartit l’addition entre plusieurs payeurs.',
  'help.guide.add-expense.step.6':
    'Split part sur Equally avec tout le monde inclus, et chaque nom affiche la part qui en résulte. Cliquez sur Ajouter une dépense pour enregistrer.',
  'help.guide.add-expense.result':
    'La dépense est dans le registre sous son jour, comptée dans Dépenses totales du voyage, et la colonne de règlement a recalculé qui doit à qui.',
  'help.guide.add-expense.tip.1':
    'Laissée telle qu’elle s’ouvre, la dépense est dans la devise du voyage, datée d’aujourd’hui et partagée à parts égales entre tous : seuls le nom et le montant doivent vraiment être remplis.',
  'help.guide.add-expense.tip.2':
    'Le ± à côté du montant transforme la dépense en remboursement. Un total négatif rend de l’argent au lieu d’en prendre, et le partage fonctionne dans l’autre sens.',
  'help.guide.add-expense.tip.3':
    'Joindre un reçu / une facture en bas prend des images et des PDF. Ils sont téléversés quand vous enregistrez, arrivent dans les Fichiers du voyage, et une pastille Reçus apparaît à côté du nom dans la liste.',
  // expense-payers
  'help.guide.expense-payers.title': 'Dire qui a payé l’addition',
  'help.guide.expense-payers.goal':
    'Enregistrez qui a avancé l’argent pour une dépense, l’autre moitié du calcul du règlement.',
  'help.guide.expense-payers.step.1':
    'Ouvrez une dépense avec le crayon à côté de sa ligne et regardez Qui a payé ?. Une seule personne a payé est le réglage par défaut : le menu déroulant nomme la personne qui a avancé l’argent.',
  'help.guide.expense-payers.step.2':
    'Personne n’a encore payé, la première entrée de ce menu déroulant, enregistre le montant sans que personne ne doive quoi que ce soit. La dépense compte quand même dans Dépenses totales du voyage.',
  'help.guide.expense-payers.step.3':
    'Plusieurs personnes ont payé, le lien à côté du libellé, ouvre une ligne par voyageur. Incluez celles qui ont payé et tapez ce que chacune a mis ; les montants doivent être égaux au total.',
  'help.guide.expense-payers.step.4':
    'Une dépense que personne n’a payée est marquée Inachevé sur sa ligne et comptée dans la carte Montant en attente, là où s’accumulent les dépenses enregistrées mais non réglées.',
  'help.guide.expense-payers.result':
    'Qui a payé décide qui est remboursé, le partage décide qui paie, et Soldes est la différence entre les deux.',
  'help.guide.expense-payers.tip.1':
    'Qui a payé ? et Split sont indépendants : vous pouvez payer un dîner auquel vous n’étiez pas, et être compté dans le partage d’un dîner que vous n’avez pas payé.',
  'help.guide.expense-payers.tip.2':
    'Avec plusieurs payeurs, les montants doivent être égaux au total. Incluez-en un de plus et les autres se réorganisent autour de lui ; tant qu’ils ne correspondent pas, l’éditeur dit à combien ils doivent s’élever et refuse d’enregistrer.',
  'help.guide.expense-payers.tip.3':
    'Retirer un payeur ne retire pas la dépense : le montant reste dans Dépenses totales du voyage et la ligne devient Inachevé.',
  // split-expense
  'help.guide.split-expense.title': 'Partager une addition entre les voyageurs',
  'help.guide.split-expense.goal':
    'Décidez qui doit quoi sur une dépense : tout le monde à parts égales, par montant, ou ligne par ligne d’après le reçu.',
  'help.guide.split-expense.step.1':
    'Dans l’éditeur de dépense, Split liste tous les voyageurs. Cliquez sur un nom pour le laisser en dehors de cette dépense ; un voyageur exclu affiche Exclu et ne doit rien dessus.',
  'help.guide.split-expense.step.2':
    'Equally est le réglage par défaut : chaque voyageur inclus reçoit la même part, et la ligne sous la liste indique en combien de parts la dépense est partagée et à combien revient chaque part.',
  'help.guide.split-expense.step.3':
    'Custom remplace les parts par des champs de montant. Tapez ce que chaque voyageur doit ; la ligne en dessous compte au fur et à mesure et passe au vert sur La répartition correspond au total. Rien ne s’enregistre tant que cela ne correspond pas.',
  'help.guide.split-expense.step.4':
    'Ticket partage le reçu ligne par ligne : Ajouter un article, puis un nom et un prix par ligne, et sous Partagé entre : les voyageurs qui se partagent cette ligne.',
  'help.guide.split-expense.step.5':
    'Part de chacun sous les lignes montre ce que chaque voyageur doit au final, et Montant total en haut est la somme des lignes. Cliquez sur Enregistrer.',
  'help.guide.split-expense.result':
    'Le partage est ce à partir de quoi chaque solde est construit. Il est enregistré avec la dépense et peut être modifié plus tard sans toucher à quoi que ce soit d’autre.',
  'help.guide.split-expense.tip.1':
    'Un voyageur que vous laissez de côté affiche Exclu et ne doit rien sur cette dépense-là ; les autres reprennent sa part.',
  'help.guide.split-expense.tip.2':
    'Equally est juste au centime près : le centime restant tourne d’une dépense à l’autre, pour que ce ne soit pas toujours la même personne qui le paie.',
  'help.guide.split-expense.tip.3':
    'Le mode Ticket calcule lui-même Montant total et grise le champ : les lignes du reçu font le total.',
  // expense-currency
  'help.guide.expense-currency.title': 'Saisir une dépense dans une autre devise',
  'help.guide.expense-currency.goal': 'Saisissez ce que le reçu dit vraiment et laissez TREK garder le taux.',
  'help.guide.expense-currency.step.1':
    'Ouvrez Ajouter une dépense et remplissez le nom et le montant exactement comme le dit le reçu, le chiffre lui-même et non une conversion de celui-ci.',
  'help.guide.expense-currency.step.2':
    'Ouvrez Devise et choisissez la devise du reçu. La liste porte tous les codes que TREK connaît et se recherche : tapez les trois lettres.',
  'help.guide.expense-currency.step.3':
    'Une ligne apparaît sous les champs avec ce que vaut le montant en ce moment, marquée taux en direct. C’est un aperçu, pas ce qui est enregistré.',
  'help.guide.expense-currency.step.4':
    'Cliquez sur Ajouter une dépense. Le taux est figé sur-le-champ : à partir de là, cette dépense vaut ce qu’elle valait le jour où vous l’avez saisie.',
  'help.guide.expense-currency.step.5':
    'Dans le registre, la ligne porte les deux chiffres sous le nom : ce que vous avez tapé, une flèche, et ce que cela compte dans la devise du voyage. Chaque total, chaque solde et chaque règlement au-dessus utilise le second.',
  'help.guide.expense-currency.result':
    'La dépense garde le montant et la devise que vous avez tapés. Le registre montre les deux, et les totaux et les soldes du voyage restent dans la devise du voyage.',
  'help.guide.expense-currency.tip.1':
    'Le taux est figé au moment où vous enregistrez, pour qu’une dette réglée ne rouvre pas parce que le marché a bougé la semaine suivante. Seul un changement de devise de la dépense en fige un nouveau.',
  'help.guide.expense-currency.tip.2':
    'Devise d’affichage dans Paramètres ne change que ce que vous lisez ; les montants enregistrés ne bougent jamais. Laissée vide, chaque voyage est affiché dans sa propre devise.',
  'help.guide.expense-currency.tip.3':
    'La devise du voyage elle-même vit sur le voyage, sous Modifier le voyage, et demande le droit Modifier les détails du voyage. La changer ré-ancre chaque taux figé au lieu de redénominer les montants.',
  // filter-costs
  'help.guide.filter-costs.title': 'Trouver une dépense, ou les dépenses d’un jour',
  'help.guide.filter-costs.goal': 'Resserrez un long registre sur ce que vous cherchez vraiment.',
  'help.guide.filter-costs.step.1':
    'Tapez dans Rechercher des dépenses… au-dessus de la liste. La recherche porte sur le nom de la dépense, au fur et à mesure que vous tapez.',
  'help.guide.filter-costs.step.2':
    'Toutes les catégories ouvre les quatorze catégories. Choisissez-en une et seules les dépenses de cette catégorie restent.',
  'help.guide.filter-costs.step.3':
    'Tous les jours liste chaque jour où quelque chose a été dépensé. Choisissez-en un et une bannière remplace les en-têtes de jour par ce jour, le nombre de dépenses qu’il contient et son total.',
  'help.guide.filter-costs.step.4':
    'Le sélecteur Toutes / Payées par moi / On me doit est votre propre vue du registre : ce pour quoi vous avez avancé de l’argent, et ce sur quoi vous êtes encore de votre poche.',
  'help.guide.filter-costs.step.5':
    'Exporter CSV au bout de la ligne écrit chaque dépense dans un fichier, avec le montant d’origine, sa devise et le montant converti.',
  'help.guide.filter-costs.result':
    'Les filtres se combinent, et les groupes de jours se redessinent avec leurs propres totaux pour ce qui reste.',
  'help.guide.filter-costs.tip.1':
    'Les paiements enregistrés n’ont ni nom ni catégorie, une recherche ou un filtre de catégorie les cache donc. Le filtre de jour les garde, sous le jour où le paiement a été enregistré.',
  'help.guide.filter-costs.tip.2':
    'Exporter CSV exporte toujours toutes les dépenses, quel que soit le filtre à l’écran, une ligne par dépense.',
  // settle-up
  'help.guide.settle-up.title': 'Déterminer qui doit à qui, et régler',
  'help.guide.settle-up.goal':
    'Transformez un tas de dépenses partagées en le plus petit nombre de transferts qui mettent tout le monde à égalité, et enregistrez-les au fur et à mesure.',
  'help.guide.settle-up.step.1':
    'La carte Régler dans la colonne de droite liste les transferts qui mettraient tout le monde à égalité : qui paie qui, et combien. Le nombre à côté du titre indique combien sont encore ouverts.',
  'help.guide.settle-up.step.2':
    'Régler à côté d’un transfert l’enregistre comme fait. Le flux disparaît de la carte et les soldes se redessinent.',
  'help.guide.settle-up.step.3':
    'Le transfert enregistré est une ligne du registre, sous le jour où il a eu lieu, marquée Paiement avec les deux voyageurs et le montant.',
  'help.guide.settle-up.step.4':
    'À côté de cette ligne, le crayon corrige un paiement et Annuler le reprend, et le transfert revient dans la carte Régler.',
  'help.guide.settle-up.step.5':
    'Ajouter un paiement dans l’en-tête de la carte enregistre un transfert qui n’a suivi aucune suggestion. Choisissez De et À, le Montant, sa devise et le jour où il a eu lieu.',
  'help.guide.settle-up.step.6':
    'Régler dans l’en-tête en haut de l’écran enregistre d’un coup tous les transferts ouverts, comme un groupe qui solde tout à la fin d’un voyage.',
  'help.guide.settle-up.result':
    'Chaque transfert enregistré est une ligne du registre et une ligne de moins sur la carte Régler. Quand la carte affiche Tout le monde est quitte, le voyage est soldé.',
  'help.guide.settle-up.tip.1':
    'La carte montre le plus petit nombre de transferts, pas chaque dette : trois personnes qui se doivent en cercle se réduisent à un ou deux paiements.',
  'help.guide.settle-up.tip.2':
    'Régler enregistre un transfert, cela ne déplace pas d’argent. Envoyez-le par le moyen que vous utilisez, puis cliquez dessus.',
  'help.guide.settle-up.tip.3':
    'Un paiement peut se faire dans n’importe quelle devise, payer une dette en yens avec des euros est donc normal : la boîte de dialogue a son propre sélecteur de devise et fige ce taux-là aussi.',
  // final-budget
  'help.guide.final-budget.title': 'Voir ce que le voyage a coûté à chaque voyageur',
  'help.guide.final-budget.goal':
    'Lisez le côté par personne du registre : le solde d’aujourd’hui, et le coût réel par personne.',
  'help.guide.final-budget.step.1':
    'Soldes montre la position de chaque voyageur : une barre verte vers la droite si le voyage lui doit, une barre rouge vers la gauche s’il doit au voyage, et le montant à côté du nom.',
  'help.guide.final-budget.step.2':
    'Budget final en dessous répond à une autre question : pas qui doit quoi en ce moment, mais ce que le voyage coûte à chaque voyageur une fois que tout a été remboursé.',
  'help.guide.final-budget.step.3':
    'Cliquez sur un nom pour ouvrir le calcul : Dépenses payées, puis Remboursements nets et Remboursements en attente en dessous.',
  'help.guide.final-budget.step.4':
    'Sous chaque ligne se trouvent les lignes dont elle est faite : les dépenses que ce voyageur a payées, les transferts déjà enregistrés et ceux encore ouverts. Leur somme fait exactement la ligne au-dessus.',
  'help.guide.final-budget.result':
    'Soldes, c’est qui est en positif ou en négatif aujourd’hui ; Budget final, c’est ce que le voyage finit par coûter à chacun de vous une fois que tout est remboursé.',
  'help.guide.final-budget.tip.1':
    'Enregistrer un paiement ne change le budget final de personne. Cela déplace seulement un montant des remboursements en attente vers les remboursements nets.',
  'help.guide.final-budget.tip.2':
    'Une dépense sans payeur reste en dehors des deux cartes, de la même façon qu’elle reste en dehors des suggestions de règlement.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Transformer une réservation en dépense',
  'help.guide.expense-from-booking.goal':
    'Attachez ce qu’un vol, un hôtel ou un lieu a réellement coûté à la fiche à laquelle cela appartient.',
  'help.guide.expense-from-booking.step.1':
    'Ouvrez la réservation dans l’onglet Transports ou Réservations et cliquez sur son crayon.',
  'help.guide.expense-from-booking.step.2':
    'Faites défiler jusqu’au bloc Coûts en bas du formulaire. Il propose Créer une dépense, qui enregistre d’abord la réservation, et Lier une dépense existante pour une dépense déjà dans l’onglet Coûts.',
  'help.guide.expense-from-booking.step.3':
    'Cliquez sur Créer une dépense. La réservation est enregistrée, le formulaire se ferme, et l’éditeur de Coûts s’ouvre avec le titre de la réservation comme nom et son type déjà associé à une catégorie.',
  'help.guide.expense-from-booking.step.4':
    'Remplissez le montant et sa devise, qui a payé et le partage comme pour n’importe quelle dépense, puis enregistrez. En rouvrant la réservation, elle apparaît sous Dépenses liées, avec un crayon pour la modifier, Délier, garder la dépense pour la détacher et une corbeille pour la retirer.',
  'help.guide.expense-from-booking.result':
    'La réservation porte son coût, et la dépense est une ligne ordinaire de l’onglet Coûts, avec un payeur, un partage et une devise comme n’importe quelle autre.',
  'help.guide.expense-from-booking.tip.1':
    'Supprimer la réservation supprime aussi ses dépenses liées. Retirer la dépense dans le bloc Coûts de la réservation fait l’inverse : la dépense part, la réservation reste. Délier, garder la dépense garde les deux.',
  'help.guide.expense-from-booking.tip.2':
    'Un lieu a le même bloc dans son formulaire, où Créer une dépense enregistre d’abord le lieu.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transports',
  'help.ctx.trip-transports.summary':
    'Tout ce qui vous porte d’une étape à l’autre : vols, trains, bus, voitures, taxis, vélos, croisières, ferries et les liaisons en transports en commun que TREK cherche pour vous. L’onglet en est la liste ; ils se créent et se lisent aussi dans le plan, et se dessinent sur la carte.',
  'help.ctx.trip-transports.bullet.1':
    'L’onglet ne tient que les trajets. Hébergements, restaurants, événements et billets vivent sous Réservations, si bien que la même entrée n’apparaît jamais deux fois.',
  'help.ctx.trip-transports.bullet.2':
    'La barre d’outils les compte tous sous Tout et donne à chaque type utilisé sa propre puce avec son propre compte, Vol, Train, Voiture, Transports en commun. Transport, à droite, en ajoute un à la main.',
  'help.ctx.trip-transports.bullet.3':
    'Les cartes viennent en trois groupes, chacun repliable par son titre : Transports en commun automatisés pour les liaisons planifiées par la recherche, puis En attente, puis Confirmée.',
  'help.ctx.trip-transports.bullet.4':
    'Une carte porte le statut, le type, les jours qu’elle couvre, les heures, le Code de réservation, l’itinéraire, et la Compagnie aérienne avec le N° de vol, ou le N° de train, le Quai et la Place. Le crayon l’ouvre, la corbeille la supprime après une question.',
  'help.ctx.trip-transports.bullet.5':
    'Les transports se créent aussi dans le plan : chaque en-tête de jour a un plus pour Ajouter un transport et un bouton tram pour Transports en commun, et le connecteur de temps de trajet entre deux étapes ouvre la même recherche pour ce seul tronçon.',
  'help.ctx.trip-transports.bullet.6':
    'Un transport dont les deux extrémités sont posées trace une ligne sur la carte. L’icône d’itinéraire sur sa ligne dans le plan du jour allume cette ligne, et Afficher tous les itinéraires dans la barre au-dessus des jours bascule tout le voyage.',
  // transports-list
  'help.guide.transports-list.title': 'Lire l’onglet Transports',
  'help.guide.transports-list.goal': 'Savoir ce que la liste vous dit avant d’y changer quoi que ce soit.',
  'help.guide.transports-list.step.1':
    'Transports est le deuxième onglet du voyage. Il ne tient que les trajets : hôtels, restaurants, événements et billets sont sous Réservations.',
  'help.guide.transports-list.step.2':
    'La barre d’outils compte chaque transport sous Tout et donne à chaque type utilisé sa propre puce avec son propre compte. Cliquez sur une puce pour ne garder que ce type, cliquez de nouveau pour la relâcher. Plusieurs puces peuvent être actives à la fois, et Tout les efface.',
  'help.guide.transports-list.step.3':
    'Transports en commun automatisés est un groupe à part, les liaisons planifiées par la recherche de transports en commun. En attente et Confirmée tiennent tout ce qui a été saisi à la main. La flèche à côté d’un titre replie un groupe.',
  'help.guide.transports-list.step.4':
    'Une carte dit tout : le point de statut avec En attente ou Confirmée, le type, les jours qu’elle couvre avec leurs dates, les heures, le Code de réservation, l’itinéraire, et la Compagnie aérienne avec le N° de vol, ou le N° de train, le Quai et la Place.',
  'help.guide.transports-list.step.5':
    'Le crayon ouvre le transport pour le modifier, la corbeille le supprime, après une question qui nomme ce qui part.',
  'help.guide.transports-list.result':
    'La liste est réduite à ce que vous cherchiez, et chaque carte dit d’un coup d’œil si le trajet est réservé.',
  'help.guide.transports-list.tip.1':
    'Les puces et les groupes repliés sont retenus par voyage, si bien que l’onglet se rouvre comme vous l’avez laissé.',
  'help.guide.transports-list.tip.2':
    'Importer depuis un fichier et AirTrail ne rejoignent Transport dans la barre d’outils que lorsque le serveur sait lire les confirmations de réservation et lorsqu’une instance AirTrail est connectée. Sans eux, la liste se remplit à la main et par la recherche de transports en commun.',
  // add-transport
  'help.guide.add-transport.title': 'Ajouter un transport à un jour',
  'help.guide.add-transport.goal':
    'Mettre le trajet qui vous mène d’une étape à la suivante dans le jour où il a lieu.',
  'help.guide.add-transport.step.1':
    'Chaque en-tête de jour porte quatre petits boutons à sa droite. Cliquez sur le plus, dont l’infobulle indique Ajouter un transport. Le formulaire s’ouvre avec Date déjà réglée sur ce jour.',
  'help.guide.add-transport.step.2':
    'Type de réservation choisit ce que vous prenez : Vol, Train, Bus, Voiture, Taxi, Vélo, Croisière, Ferry ou Autre. Le formulaire suit. Un vol reçoit un aéroport sur chaque tronçon, un train une chaîne de gares, une voiture les mots Prise en charge et Restitution ainsi que Étapes en chemin.',
  'help.guide.add-transport.step.3':
    'Titre est le seul champ qui doit être rempli ; Ajouter reste gris sans lui. Écrivez ce que vous reconnaîtriez sur un tableau d’affichage.',
  'help.guide.add-transport.step.4':
    'De et À cherchent une gare, un port ou une adresse. Tapez au moins trois lettres et choisissez un résultat dans la liste. Un nom seulement tapé ne porte pas de coordonnées, il ne trace donc rien sur la carte.',
  'help.guide.add-transport.step.5':
    'Date et Heure de début disent quand il roule, Date de fin et Heure de fin quand il est terminé ; un trajet qui arrive le lendemain y prend le jour suivant. Code de réservation, Statut avec En attente ou Confirmée, et Notes sont facultatifs.',
  'help.guide.add-transport.step.6': 'Cliquez sur Ajouter.',
  'help.guide.add-transport.result':
    'Le transport est une ligne sur le jour, à son heure parmi les étapes, et une carte dans l’onglet Transports sous En attente ou Confirmée.',
  'help.guide.add-transport.tip.1':
    'La ligne se pose là où son heure de début la met, après la dernière étape qui commence plus tôt. Sa poignée la glisse n’importe où ailleurs dans le jour, ou sur un autre jour.',
  'help.guide.add-transport.tip.2':
    'Joindre un fichier sous Fichiers prend le billet, et Créer une dépense sous Coûts enregistre la réservation et ouvre l’éditeur de Coûts pour le prix.',
  'help.guide.add-transport.tip.3':
    'Voyageurs marque qui est de ce trajet. Dès qu’un transport a des voyageurs, la barre d’outils de l’onglet fait pousser leurs avatars et filtre la liste par eux.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planifier une liaison en transports en commun',
  'help.guide.plan-transit.goal':
    'Laisser TREK chercher les vrais trains et bus entre deux points d’un jour et poser dans le plan celui que vous choisissez.',
  'help.guide.plan-transit.step.1':
    'Dans l’en-tête du jour, cliquez sur le bouton tram, Transports en commun. La recherche s’ouvre pour ce jour.',
  'help.guide.plan-transit.step.2':
    'Départ et Arrivée prennent un arrêt ou une gare. Tant que le champ est vide, les étapes du jour lui-même et les hébergements du voyage sont proposés ; à partir de deux lettres, ce sont les gares de l’horaire qui sont cherchées. Inverser entre les deux champs retourne la liaison.',
  'help.guide.plan-transit.step.3':
    'Le choix Départ ou Arrivée avec une heure dit quand vous voulez voyager, et Meilleur itinéraire, Moins de correspondances ou Moins de marche dit comment les réponses doivent être triées.',
  'help.guide.plan-transit.step.4':
    'Les puces en dessous disent quels modes peuvent servir : Train, Métro, Tramway, Bus, Ferry et Téléphérique. Désactivez-en une pour l’exclure, au moins une reste active. Puis cliquez sur Rechercher.',
  'help.guide.plan-transit.step.5':
    'Chaque résultat donne le départ et l’arrivée, la durée, le nombre de correspondances et la marche, et les lignes dans leurs propres couleurs. Cliquez sur l’un pour le déplier arrêt par arrêt, avec les voies et les marches entre les lignes.',
  'help.guide.plan-transit.step.6': 'Cliquez sur Ajouter au jour.',
  'help.guide.plan-transit.result':
    'La liaison est une ligne sur le jour avec ses lignes de transport, ses correspondances et son temps de marche, et une carte dans l’onglet Transports sous Transports en commun automatisés.',
  'help.guide.plan-transit.tip.1':
    'Les liaisons viennent de Transitous, un service communautaire libre bâti sur des données horaires publiques : pas de clé, pas de compte. Un administrateur peut diriger la recherche vers Google à la place.',
  'help.guide.plan-transit.tip.2':
    'Rien trouvé ? Les flux couvrent une région et une période. Essayez une autre heure, activez plus de modes, ou choisissez une gare plutôt que le lieu lui-même. Le message nomme le service qui a répondu.',
  'help.guide.plan-transit.tip.3':
    'La même recherche s’ouvre pour un seul tronçon : cliquez sur le connecteur de temps de trajet entre deux étapes et choisissez Transports en commun. Départ, Arrivée et l’heure de départ sont remplis pour vous.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Ouvrir et modifier une liaison planifiée',
  'help.guide.change-transit-route.goal':
    'Lire la liaison arrêt par arrêt, la renommer, ou rechercher de nouveau l’itinéraire.',
  'help.guide.change-transit-route.step.1':
    'Dans l’onglet Transports, les liaisons planifiées sont sous Transports en commun automatisés. Cliquez sur la carte.',
  'help.guide.change-transit-route.step.2':
    'Durée, Correspondances et Marche sont en haut. Itinéraire en dessous parcourt la liaison arrêt par arrêt, avec les voies et les marches entre les lignes.',
  'help.guide.change-transit-route.step.3':
    "Modifier l'itinéraire relance la recherche, déjà remplie avec les deux extrémités de cette liaison et son jour.",
  'help.guide.change-transit-route.step.4':
    "Choisissez une autre liaison et cliquez sur Ajouter au jour ; elle prend la place de l’ancienne. Modifier les détails, à côté de Modifier l'itinéraire, ouvre au contraire le formulaire de transport ordinaire, où vivent le Code de réservation, le Statut, les voyageurs et les fichiers.",
  'help.guide.change-transit-route.result':
    'Le trajet porte le nouvel itinéraire, et sa carte dans l’onglet Transports montre les nouvelles lignes et les nouvelles heures.',
  'help.guide.change-transit-route.tip.1':
    'Le titre du trajet n’est que du texte : le crayon à côté le renomme sans toucher à l’itinéraire. Notes en dessous accepte le markdown et a un onglet Modifier et un onglet Aperçu.',
  'help.guide.change-transit-route.tip.2':
    'Supprimer au pied du trajet sort la liaison du voyage ; le jour garde ses étapes.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Changer la façon de parcourir un tronçon',
  'help.guide.leg-travel-mode.goal':
    'Faire à pied un tronçon d’un jour autrement parcouru en voiture, ou confier ce tronçon à la recherche de transports en commun.',
  'help.guide.leg-travel-mode.step.1':
    'Les connecteurs entre les étapes n’apparaissent qu’une fois l’itinéraire du jour activé. Cliquez sur le jour pour l’ouvrir, puis sur Itinéraire sous ses étapes.',
  'help.guide.leg-travel-mode.step.2':
    'Chaque connecteur nomme le temps de trajet et la distance de ce tronçon, avec l’icône du mode dans lequel il a été calculé : une voiture pour la conduite, un pied pour la marche.',
  'help.guide.leg-travel-mode.step.3':
    'Cliquez sur le connecteur. Le menu propose Voiture et Marche, Transports en commun, et Utiliser le mode du jour.',
  'help.guide.leg-travel-mode.step.4':
    'Choisissez Marche. Seul ce tronçon change ; le reste du jour garde son propre mode.',
  'help.guide.leg-travel-mode.result':
    'Le tronçon montre l’icône du pied et son temps de marche, et les autres tronçons du jour gardent le mode du jour.',
  'help.guide.leg-travel-mode.tip.1':
    'Le mode appartient au tronçon, pas au jour : les boutons Voiture et Marche du jour entier n’écrasent jamais un tronçon que vous avez réglé à la main. Utiliser le mode du jour leur rend le tronçon.',
  'help.guide.leg-travel-mode.tip.2':
    'Transports en commun dans le même menu ouvre la recherche de liaisons pour exactement ce tronçon, avec les deux extrémités et l’heure de départ déjà remplies.',
  'help.guide.leg-travel-mode.tip.3':
    'Les temps viennent d’un routeur public sur de vraies routes et de vrais chemins piétons. Un tronçon auquel il ne sait pas répondre garde sa ligne droite et n’affiche pas de temps.',
  // edit-transport
  'help.guide.edit-transport.title': 'Modifier ou supprimer un transport',
  'help.guide.edit-transport.goal':
    'Corriger une heure, un quai ou un code de réservation, ou sortir le trajet du voyage.',
  'help.guide.edit-transport.step.1':
    'Dans le plan du jour, un transport est une ligne colorée entre les étapes. Cliquez dessus.',
  'help.guide.edit-transport.step.2':
    'Le formulaire est celui qui l’a créé, avec Modifier le transport dans sa barre de titre. Tout peut changer : le type, l’itinéraire, les jours et les heures, le Code de réservation, le Statut.',
  'help.guide.edit-transport.step.3':
    'L’itinéraire d’un vol est une chaîne d’aéroports, celui d’un train une chaîne de gares. Ajouter une escale en met une autre au milieu, et chaque tronçon garde ses propres heures et son propre numéro de vol ou de train.',
  'help.guide.edit-transport.step.4':
    'Cliquez sur Mettre à jour. Pour retirer complètement le transport, utilisez la corbeille sur sa carte dans l’onglet Transports et confirmez.',
  'help.guide.edit-transport.result':
    'Le changement se voit partout où le transport apparaît : l’onglet Transports, le jour où il roule, et sa ligne sur la carte.',
  'help.guide.edit-transport.tip.1':
    'Le même formulaire s’ouvre des deux côtés, par le crayon sur la carte dans l’onglet Transports et par la ligne propre du transport dans le plan du jour. Une liaison en transports en commun planifiée fait exception : sa ligne ouvre la vue du trajet, et Modifier les détails y mène à ce formulaire.',
  'help.guide.edit-transport.tip.2':
    'Déplacer un transport vers un autre jour n’a pas besoin du formulaire du tout : glissez sa ligne d’une carte de jour à la suivante.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Tracer un transport sur la carte',
  'help.guide.transport-on-map.goal': 'Voir où passent réellement un vol, un trajet en voiture ou une liaison.',
  'help.guide.transport-on-map.step.1':
    'Un transport dont les deux extrémités sont posées porte une petite icône d’itinéraire sur sa ligne dans le plan du jour. Cliquez dessus ; son libellé devient Masquer les itinéraires.',
  'help.guide.transport-on-map.step.2':
    'L’itinéraire est tracé sur la carte, avec un marqueur en pastille à chaque extrémité portant l’icône du transport.',
  'help.guide.transport-on-map.step.3':
    'Cliquez sur un marqueur d’extrémité pour lire la réservation sans quitter la carte : les heures, la Compagnie aérienne et le N° de vol, le Code de réservation et l’adresse. Fermer range la fiche.',
  'help.guide.transport-on-map.step.4':
    'L’icône d’itinéraire dans la barre au-dessus des jours fait tout le voyage d’un coup : Afficher tous les itinéraires, et Masquer tous les itinéraires pour les effacer de nouveau.',
  'help.guide.transport-on-map.step.5':
    'Une liaison en transports en commun planifiée n’a pas d’icône à elle. Elle est tracée par le bouton Itinéraire du jour, et c’est pourquoi Masquer tous les itinéraires ne l’efface pas tant que l’itinéraire de ce jour est encore actif.',
  'help.guide.transport-on-map.result':
    'Les itinéraires sont sur la carte avec un marqueur à chaque extrémité, et ils y restent jusqu’à ce que vous les éteigniez de nouveau.',
  'help.guide.transport-on-map.tip.1':
    'Un vol, une croisière et un ferry se tracent en courbe, une voiture, un bus, un taxi et un vélo suivent les vraies routes, et un train ou une liaison planifiée passe par les gares qu’il dessert.',
  'help.guide.transport-on-map.tip.2':
    'Une réservation confirmée est une ligne pleine, une réservation en attente une ligne pointillée. Le réglage Étiquettes des itinéraires inscrit le code de l’aéroport ou le nom de la gare dans les marqueurs d’extrémité.',
  'help.guide.transport-on-map.tip.3':
    'Afficher tous les itinéraires fait table rase, ce n’est pas une couche : il jette ce que les icônes individuelles avaient réglé, appuyer deux fois vous laisse donc avec tout activé ou tout désactivé.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Lire un vol dans son billet électronique',
  'help.guide.import-transport-file.goal':
    'Laissez TREK tirer un vol, un train ou un ferry du billet envoyé par le transporteur, et contrôlez-le avant qu’il soit enregistré.',
  'help.guide.import-transport-file.step.1':
    'Cliquez sur Importer depuis un fichier dans la barre d’outils de l’onglet Transports, à côté de Transport. Importer des confirmations de réservation s’ouvre, le même dialogue que celui de l’onglet Réservations.',
  'help.guide.import-transport-file.step.2':
    'Déposez le billet sur la zone, ou cliquez-la et choisissez-le : EML, PDF, PKPass, HTML et TXT, jusqu’à cinq fichiers de 10 Mo chacun. Les fichiers que vous avez choisis sont nommés sur la zone.',
  'help.guide.import-transport-file.step.3':
    'Cliquez sur Importer. Le dialogue se ferme aussitôt ; la lecture se fait en arrière-plan.',
  'help.guide.import-transport-file.step.4':
    'Une carte en bas à droite rend compte de l’exécution sous le nom du fichier. Analyse des fichiers… devient une coche quand la lecture est finie, et la carte propose Importer. Cliquez dessus.',
  'help.guide.import-transport-file.step.5':
    'Un vol s’ouvre dans Ajouter un transport, déjà rempli : Type de réservation sur Vol, la compagnie et le numéro de vol dans Titre, les deux aéroports sous Itinéraire avec Départ et Arrivée, leurs heures et leurs fuseaux horaires, Compagnie aérienne et N° de vol, le Code de réservation et le billet sous Fichiers. Contrôlez-le et cliquez sur Ajouter.',
  'help.guide.import-transport-file.result':
    'Le vol est une carte dans En attente sur l’onglet Transports et une ligne sur le jour de son départ, avec le billet sous Fichiers, et avec les deux aéroports connus il dessine sa courbe sur la carte.',
  'help.guide.import-transport-file.tip.1':
    'Les deux onglets partagent un seul import : un fichier qui contient un vol et un hôtel ouvre le vol dans Ajouter un transport et l’hôtel dans Nouvelle réservation, l’un après l’autre, quel que soit l’onglet de départ.',
  'help.guide.import-transport-file.tip.2':
    'Les aéroports sont placés par leur code. Une gare ou un port que la lecture n’a pas su situer est nommé en ambre sur la carte ; choisissez-le à la main sous Itinéraire avant de cliquer sur Ajouter, sinon le transport ne dessine rien sur la carte.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importer des vols depuis AirTrail',
  'help.guide.airtrail-import.goal':
    'Amenez d’un coup dans le voyage les vols que vous tenez déjà dans AirTrail, et laissez-les suivre AirTrail à partir de là.',
  'help.guide.airtrail-import.step.1':
    'Avec le module AirTrail actif et votre instance connectée sous Intégrations dans Paramètres, la barre d’outils de l’onglet Transports porte un bouton AirTrail à côté de Transport. Cliquez dessus.',
  'help.guide.airtrail-import.step.2':
    'Importer depuis AirTrail liste les vols de votre compte en deux groupes. Pendant ce voyage tient ceux datés dans le voyage, déjà cochés ; Autres vols tient le reste, non cochés. Un vol déjà dans le voyage est grisé et marqué Importé.',
  'help.guide.airtrail-import.step.3':
    'Chaque ligne est une case à cocher avec la compagnie et le numéro de vol, les deux aéroports et la date. Cliquez sur une ligne pour prendre le vol ou le laisser ; ceux sous Autres vols n’entrent que si vous les cochez.',
  'help.guide.airtrail-import.step.4':
    'Les vols qui se suivent, chacun partant dans la journée de l’aéroport où le précédent a atterri, sont encadrés ensemble. La case en dessous, Importer comme un seul vol avec escale à cet aéroport, est déjà cochée : laissez-la pour une seule réservation avec escale, ou décochez-la pour importer les segments comme des vols séparés.',
  'help.guide.airtrail-import.step.5':
    'Cliquez sur Importer. Le bouton compte les vols cochés, et le message qui suit dit combien sont entrés.',
  'help.guide.airtrail-import.step.6':
    'Les vols sont des cartes sous Confirmée, chacune avec un badge AirTrail bleu à côté de son statut, et des lignes sur les jours où ils ont lieu. Une correspondance jointe est une seule carte, avec son itinéraire passant par l’escale.',
  'help.guide.airtrail-import.result':
    'Les vols venus d’AirTrail sont des cartes dans l’onglet Transports et des lignes sur leurs jours, chacune portant le badge AirTrail qui dit d’où elle vient.',
  'help.guide.airtrail-import.tip.1':
    'Un vol déjà dans le voyage sous le même numéro et la même date est sauté, et un message dit combien l’ont été. Annuler dans la barre d’outils au-dessus des jours reprend tout l’import.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail reste la source de vérité. TREK lit ses changements quand vous ouvrez le voyage et toutes les quelques minutes en arrière-plan ; un vol supprimé là-bas garde sa carte, avec le badge passé à Non synchronisé. Les modifications faites dans TREK ne repartent que si Réécrire les modifications dans AirTrail est activé sous Intégrations.',
  'help.guide.airtrail-import.tip.3':
    'Une correspondance jointe n’a pas de vol AirTrail unique à suivre, c’est donc un import ponctuel : elle garde le badge bleu, et survoler le badge le dit. Il en va de même pour un vol synchronisé auquel vous donnez une escale à la main.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Road trip',
  'help.ctx.trip-roadtrip.summary':
    'Le plan lu comme un seul trajet : les mêmes jours et les mêmes lieux, enchaînés en arrêts avec la conduite entre eux, dans une liste le long de la colonne de gauche et sur la carte. Il dit la distance et la durée, où le réservoir se vide, et ce qui se trouve au bord de la route.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Jours et Road trip en haut de la colonne de gauche basculent entre le plan des jours et le trajet. Rien n’est copié et rien n’est modifié : Jours redonne le plan exactement tel qu’il était.',
  'help.ctx.trip-roadtrip.bullet.2':
    'La tête de la liste totalise le voyage : Distance, Temps de conduite et Étapes. En dessous vient une fiche par jour, avec les kilomètres propres au jour, le nombre d’arrêts pour lesquels il existe, ce qu’il dépasse, et un badge Trace.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Un arrêt numéroté est un lieu pour lequel le jour existe. Un arrêt en chemin, carburant, recharge, une aire de repos, porte l’icône de son type au lieu d’un numéro et n’est pas compté. Cliquez sur un numéro pour changer ce qu’il est, et sur le badge Durée pour dire combien de temps il prend.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Entre deux arrêts, une bande de conduite donne l’étape en distance et en temps. Cliquez dessus pour Itinéraires pour cette étape, ou cliquez sur l’itinéraire tracé sur la carte pour courber l’étape par un point de passage.',
  'help.ctx.trip-roadtrip.bullet.5':
    'La colonne de droite devient Le long de l’itinéraire : choisissez un jour, ce que vous cherchez et la largeur du couloir, puis Rechercher. Ajouter pose un résultat sur le trajet à l’endroit où il est réellement passé.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Les Réglages de conduite en dessous tiennent les limites, la voiture et son autonomie, les horaires quotidiens, ce qu’il faut éviter et la façon dont la ligne est tracée. Ils appartiennent au voyage, donc tout le monde planifie avec la même voiture.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Lire le voyage comme un seul trajet',
  'help.guide.roadtrip-mode.goal': 'Basculez le plan en mode road trip et lisez ce que la liste vous dit.',
  'help.guide.roadtrip-mode.step.1':
    'Cliquez sur Road trip dans le sélecteur Jours et Road trip en haut de la colonne de gauche. Le plan des jours est remplacé par le trajet, et la carte trace chaque jour dont l’itinéraire est calculé.',
  'help.guide.roadtrip-mode.step.2':
    'La tête de la liste totalise tout le voyage : Distance, Temps de conduite et Étapes.',
  'help.guide.roadtrip-mode.step.3':
    'En dessous vient une fiche par jour. Son en-tête porte le numéro et la date du jour, la conduite en distance et en temps, et le nombre d’arrêts pour lesquels le jour existe.',
  'help.guide.roadtrip-mode.step.4':
    'Dans la fiche, le jour est une chaîne : un arrêt numéroté par lieu, une bande de conduite entre chaque paire, et l’heure d’arrivée au bord droit.',
  'help.guide.roadtrip-mode.step.5':
    'Cliquez sur l’en-tête d’un jour pour le replier. Un jour replié disparaît aussi de la carte ; cliquez de nouveau sur l’en-tête pour le ramener.',
  'help.guide.roadtrip-mode.result':
    'La colonne de gauche est le trajet et la carte en montre chaque jour. Jours revient directement au plan, inchangé.',
  'help.guide.roadtrip-mode.tip.1':
    'Le choix est retenu par voyage tant que l’onglet du navigateur reste ouvert, un rechargement revient donc sur le trajet.',
  'help.guide.roadtrip-mode.tip.2':
    'Le sélecteur n’existe qu’une fois qu’un administrateur a activé l’extension Road trip, sous Extensions dans l’Administration.',
  'help.guide.roadtrip-mode.tip.3':
    'Sur téléphone il n’y a pas de sélecteur : l’extension ajoute son propre onglet Road trip à côté de Plan.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Les arrêts en chemin, et combien de temps vous restez',
  'help.guide.roadtrip-stops.goal':
    'Transformez un lieu du trajet en arrêt en chemin, et dites combien de temps prend chaque arrêt.',
  'help.guide.roadtrip-stops.step.1':
    'Cliquez sur le numéro devant un arrêt dans la liste. Son libellé est En faire un arrêt en chemin, et il ouvre Type d’arrêt.',
  'help.guide.roadtrip-stops.step.2':
    'Choisissez un type : Hébergement, Carburant, Recharge, Aire de repos, Camping, Restauration ou À voir. Le numéro devient l’icône de ce type et les arrêts en dessous sont renumérotés.',
  'help.guide.roadtrip-stops.step.3':
    'Un arrêt en chemin n’est pas une destination, l’en-tête du jour compte donc un arrêt de moins.',
  'help.guide.roadtrip-stops.step.4':
    'Cliquez de nouveau sur l’icône, Changer le type d’arrêt, et choisissez Redevenir une destination pour rendre son numéro à l’arrêt.',
  'help.guide.roadtrip-stops.step.5': 'Chaque arrêt porte un badge Durée. Cliquez dessus pour ouvrir Temps sur place.',
  'help.guide.roadtrip-stops.step.6':
    'Réglez la durée avec le curseur, avec les boutons moins et plus ou avec l’un des préréglages, regardez ce que font Arrivee et Depart, puis cliquez sur Enregistrer.',
  'help.guide.roadtrip-stops.result':
    'L’arrêt dont vous avez réglé la durée porte l’heure sur son badge Durée et chaque arrivée après lui a bougé avec, et celui que vous avez envoyé vers un type puis ramené est de nouveau une destination numérotée.',
  'help.guide.roadtrip-stops.tip.1':
    'Une durée appartient au lieu, pas à une visite : un lieu planifié sur deux jours reçoit le même temps sur les deux.',
  'help.guide.roadtrip-stops.tip.2':
    'Les arrêts en chemin apparaissent aussi sous Jours. Décocher Afficher aussi dans Jours, sous Arrêts de service dans les Réglages de conduite, les garde uniquement dans Road trip.',
  'help.guide.roadtrip-stops.tip.3': 'Aucune duree, dans la même boîte de dialogue, retire de nouveau ce temps.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Trouver du carburant, à manger et un lit le long de l’itinéraire',
  'help.guide.roadtrip-corridor.goal':
    'Cherchez sur la route que vous roulez vraiment, et posez ce que vous trouvez sur la bonne étape.',
  'help.guide.roadtrip-corridor.step.1':
    'Choisissez le jour en haut de Le long de l’itinéraire. Seuls les jours dont l’itinéraire est calculé sont proposés.',
  'help.guide.roadtrip-corridor.step.2':
    'Sous Recherche de, cochez ce qu’il vous faut. Carburant, Recharge, Aire de repos, Camping, Hébergement, Restauration et À voir se combinent.',
  'help.guide.roadtrip-corridor.step.3':
    'Sous Dans un rayon de, choisissez jusqu’où chercher de part et d’autre de la route, 2 km, 5 km ou 10 km, puis cliquez sur Rechercher.',
  'help.guide.roadtrip-corridor.step.4':
    'Les résultats reviennent groupés par type, dans l’ordre où vous les passez, chacun avec sa position le long du jour et sa distance hors itinéraire.',
  'help.guide.roadtrip-corridor.step.5':
    'Ajouter sur un résultat ouvre Ajouter comme arrêt. La boîte dit sur quel jour et à quelle position l’arrêt se pose, demande le type et le temps sur place, et Ajouter le met sur le trajet.',
  'help.guide.roadtrip-corridor.result':
    'Les résultats sont listés dans l’ordre où vous les passez et tracés sur la carte, et celui que vous avez ajouté se pose sur le trajet à l’endroit où il est réellement passé.',
  'help.guide.roadtrip-corridor.tip.1':
    'Rien n’est cherché tant que vous n’appuyez pas sur Rechercher : une exécution représente de nombreuses requêtes vers un service partagé.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtrer par nom restreint ce qui est revenu sans redemander, et Effacer les résultats vide la liste et ses repères. Cliquez sur un résultat pour l’amener dans le champ de la carte.',
  'help.guide.roadtrip-corridor.tip.3':
    'Un résultat peut aussi être glissé de la carte sur l’itinéraire tracé, c’est ainsi que vous choisissez vous-même l’étape là où la même route est parcourue deux fois. Ajouter manuellement, à côté de Rechercher, cherche plutôt un lieu par son nom.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Courber une étape par un point de passage',
  'help.guide.roadtrip-via.goal': 'Envoyez une étape sur la route que vous voulez vraiment, sans y ajouter d’arrêt.',
  'help.guide.roadtrip-via.step.1':
    'Amenez l’étape voulue dans le champ de vision : cliquez sur un arrêt dans la liste, puis fermez la fiche qui s’ouvre par-dessus la carte.',
  'help.guide.roadtrip-via.step.2':
    'Cliquez sur l’itinéraire tracé. Un point de passage est posé sur l’étape cliquée, et l’étape est recalculée en passant par lui.',
  'help.guide.roadtrip-via.step.3':
    'La liste suit : l’en-tête du jour porte la nouvelle distance et le nouveau temps de conduite, et chaque arrivée après le point de passage bouge avec lui.',
  'help.guide.roadtrip-via.step.4':
    'Survolez la poignée et elle dit ce qu’elle sait faire : Faites glisser pour remodeler l’itinéraire, clic droit pour supprimer. Glissez-la ailleurs et l’étape est retracée par le nouvel endroit.',
  'help.guide.roadtrip-via.step.5':
    'Faites un clic droit sur la poignée pour l’enlever. L’étape reprend le chemin direct.',
  'help.guide.roadtrip-via.result':
    'L’étape suit la route que vous avez choisie, et la distance, le temps de conduite et les arrivées du jour sont recalculés pour elle.',
  'help.guide.roadtrip-via.tip.1':
    'Un point de passage n’est pas un arrêt : il n’a ni numéro, ni durée, ni heure d’arrivée, et il n’est pas compté dans les arrêts du jour.',
  'help.guide.roadtrip-via.tip.2':
    'Les poignées sont tracées à partir du niveau de zoom 9, une carte ajustée à tout le voyage montre donc la ligne sans elles.',
  'help.guide.roadtrip-via.tip.3':
    'Un clic à plus de deux kilomètres de toute étape tracée est ignoré, et un clic sur un vol, un train ou un ferry l’est aussi.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Essayer un autre itinéraire pour une étape',
  'help.guide.roadtrip-alternatives.goal': 'Voyez ce que le calculateur propose d’autre pour un tronçon, et prenez-le.',
  'help.guide.roadtrip-alternatives.step.1':
    'Cliquez sur une bande de conduite dans la liste, la ligne entre deux arrêts qui donne l’étape en distance et en temps. Son libellé est Autres itinéraires.',
  'help.guide.roadtrip-alternatives.step.2':
    'Itinéraires pour cette étape s’ouvre par-dessus la carte, une entrée par route, chacune tracée sur la carte dans sa propre couleur.',
  'help.guide.roadtrip-alternatives.step.3':
    'Survolez une entrée pour allumer cette route. Actuel est la route empruntée et La plus rapide la plus rapide ; les autres disent de combien elles sont plus lentes, ou quelle classe de route elles laissent de côté.',
  'help.guide.roadtrip-alternatives.step.4':
    'Cliquez sur une entrée pour rouler par là, ou sur Fermer pour garder la route où vous êtes.',
  'help.guide.roadtrip-alternatives.result':
    'L’étape emprunte la route que vous avez choisie, et la distance dans la liste ainsi que les arrivées suivantes changent avec elle.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Choisir une autre route pose un point de passage sur l’étape et remplace ceux qu’elle avait déjà ; choisir la route propre du calculateur les retire de nouveau.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Sans autoroute, Sans peage et Sans ferry viennent d’un second moteur avec son propre modèle de vitesse, leurs temps ne sont donc pas comparables aux autres.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Régler la voiture et les limites de conduite',
  'help.guide.roadtrip-limits.goal':
    'Dites à TREK ce que vous conduisez et jusqu’où vous acceptez de rouler d’une traite.',
  'help.guide.roadtrip-limits.step.1':
    'Réglages de conduite se trouve sous la recherche dans la colonne de droite. Ses badges disent ce qui est réglé ; cliquez dessus pour ouvrir.',
  'help.guide.roadtrip-limits.step.2':
    'Sous Conduite, Plus long trajet d’affilée et Conduite par jour sont en minutes. Un champ vide vaut désactivé, et rien n’est signalé.',
  'help.guide.roadtrip-limits.step.3':
    'Sous Véhicule, dites ce que vous conduisez. Carburant ne refait le plein qu’aux arrêts carburant, Électrique seulement aux arrêts de recharge, Les deux aux deux.',
  'help.guide.roadtrip-limits.step.4':
    'Tapez vous-même Autonomie par plein, ou Autonomie par charge. Calculer d’après la voiture en dessous prend Réservoir et Consommation, ou Batterie et Consommation, et fait le calcul.',
  'help.guide.roadtrip-limits.step.5':
    'Éviter si possible est une préférence, pas une interdiction : un jour sans contournement emprunte quand même la route, et le dit dans son en-tête.',
  'help.guide.roadtrip-limits.step.6':
    'Fermez la boîte de dialogue. La fiche dit ce qui est réglé, et la liste marque chaque étape et chaque jour qui dépasse.',
  'help.guide.roadtrip-limits.result':
    'Les badges de la fiche disent ce qui est réglé, et chaque étape et chaque jour au-delà d’une limite porte un badge dans la liste.',
  'help.guide.roadtrip-limits.tip.1':
    'Les réglages appartiennent au voyage, donc tout le monde y planifie avec la même voiture et les mêmes limites.',
  'help.guide.roadtrip-limits.tip.2':
    'Remplir jusqu’à dit jusqu’où un arrêt remplit, parce que personne ne recharge à 100 % sur la route. Un arrêt carburant ou de recharge peut le remplacer pour lui-même.',
  'help.guide.roadtrip-limits.tip.3':
    'Ligne de l’itinéraire décide comment le trajet est tracé : Relier les jours calcule la nuit entre deux jours, et Une couleur par jour donne à chaque jour la sienne.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Donner un début et une fin à la journée de conduite',
  'help.guide.roadtrip-day-window.goal':
    'Arrêtez de rouler à l’heure que vous choisissez, et dites où la journée doit se terminer.',
  'help.guide.roadtrip-day-window.step.1':
    'Ouvrez Réglages de conduite dans la colonne de droite et trouvez Horaires quotidiens.',
  'help.guide.roadtrip-day-window.step.2':
    'Réglez un Début de journée. Seul, il ne fait rien : les deux heures sont nécessaires, comme le dit la note en dessous.',
  'help.guide.roadtrip-day-window.step.3':
    'Réglez une Fin de journée. Le trajet s’arrête désormais à cette heure et reporte le reste au lendemain matin, sous la forme d’une ligne Fin de journée et d’une ligne Reprendre le trajet dans la liste.',
  'help.guide.roadtrip-day-window.step.4':
    'Sous Fin de journée, choisissez Sur le trajet pour faire une pause sur la route à l’heure de fin, ou Au dernier lieu pour vous arrêter avant que le trajet suivant ne la dépasse.',
  'help.guide.roadtrip-day-window.step.5':
    'Fermez la boîte de dialogue. La fiche Réglages de conduite porte les deux heures en badge.',
  'help.guide.roadtrip-day-window.result':
    'Le trajet est découpé en journées de route de la longueur que vous avez fixée, et ce qui ne rentre pas continue sur des jours calculés après le dernier. Vos jours et leurs lieux ne sont pas modifiés.',
  'help.guide.roadtrip-day-window.tip.1':
    'Effacer l’une des deux heures désactive de nouveau l’ensemble. Les heures que vous avez fixées vous-même sur un arrêt sont toujours prioritaires.',
  'help.guide.roadtrip-day-window.tip.2':
    'Avec des horaires quotidiens réglés, les jours sont toujours reliés : le trajet du dernier arrêt d’un jour au premier du suivant est calculé et compté.',
  'help.guide.roadtrip-day-window.tip.3':
    'Chaque fin de journée est aussi un repère sur la carte, une lune avec le numéro du jour. Glissez-la le long de l’itinéraire, ou sur un lieu, pour terminer la journée ailleurs ; faites un clic droit dessus pour remettre la fin automatique, et Rétablir les fins de journée automatiques dans cette boîte de dialogue annule le tout.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Faire le plein avant que le réservoir ne se vide',
  'help.guide.roadtrip-refuel.goal':
    'Trouvez où refaire le plein sur la portion que la voiture peut encore atteindre, et posez-le sur le trajet.',
  'help.guide.roadtrip-refuel.step.1':
    'Avec une autonomie réglée, la liste trace une bande en travers de l’étape à l’endroit où elle s’épuise : Réservoir vide ici, et en dessous à quelle distance dans l’étape cela tombe.',
  'help.guide.roadtrip-refuel.step.2':
    'La lampe sur la bande est le bouton. Chercher du carburant regarde le long de la route déjà parcourue, avec Recherche le long du trajet… pendant ce temps.',
  'help.guide.roadtrip-refuel.step.3':
    'Jusqu’à trois stations reviennent, chacune avec sa distance hors itinéraire et l’autonomie qu’elle laisserait en réserve.',
  'help.guide.roadtrip-refuel.step.4':
    'Le plus sur une proposition l’ajoute comme arrêt carburant. Ajouter comme arrêt s’ouvre avec le type et le temps déjà remplis, et Ajouter le pose sur l’étape à l’endroit où il est réellement passé.',
  'help.guide.roadtrip-refuel.result':
    'L’arrêt est sur la bonne étape avec sa propre icône, l’autonomie repart de lui, et la bande a disparu.',
  'help.guide.roadtrip-refuel.tip.1':
    'L’autonomie compte depuis le dernier arrêt carburant ou de recharge, d’un jour à l’autre. Ce que vous conduisez décide des arrêts qui comptent : Carburant seulement le carburant, Électrique seulement la recharge.',
  'help.guide.roadtrip-refuel.tip.2':
    'La recherche regarde la route avant le point de panne, garde une réserve et compte le détour deux fois, tout ce qu’elle propose est donc réellement atteignable.',
  'help.guide.roadtrip-refuel.tip.3':
    'Une réponse vide n’est pas une impasse : la lampe devient Réessayer, parce que la recherche de lieux est un service partagé qui expire parfois.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Faire suivre à un jour une trace importée',
  'help.guide.roadtrip-track.goal':
    'Posez le trajet d’un jour sur une route panoramique que vous avez importée comme trace GPX ou KML.',
  'help.guide.roadtrip-track.step.1':
    'Cliquez sur le badge Trace dans l’en-tête d’un jour. La boîte de dialogue s’ouvre sur ce jour.',
  'help.guide.roadtrip-track.step.2':
    'Choisissez une trace. Chacune dit sa longueur et si elle longe ce jour ou à quelle distance elle se trouve, la plus proche en premier.',
  'help.guide.roadtrip-track.step.3':
    'Cliquez sur Suivre cette trace. TREK pose des points de passage là où le trajet s’écarte le plus de la trace, et recalcule, tour après tour.',
  'help.guide.roadtrip-track.step.4':
    'Il dit combien de points de passage il a posés et à quelle distance le trajet reste désormais. Le bouton en dessous retire ces points de passage et rend le jour au calculateur ; fermer la boîte de dialogue garde la trace.',
  'help.guide.roadtrip-track.result':
    'Le trajet du jour suit la trace au lieu de la route choisie par le calculateur, et son badge Trace est allumé et nomme cette trace quand vous le survolez.',
  'help.guide.roadtrip-track.tip.1':
    'Importez le fichier sous Jours avec Importer un fichier, en cochant Itinéraires ou Traces. Tant que le voyage n’en contient aucune, aucun jour ne porte le badge.',
  'help.guide.roadtrip-track.tip.2':
    'Suivre une trace remplace les points de passage que les étapes du jour avaient déjà, façonnez donc une étape à la main après la trace, pas avant.',
};

export default help;
