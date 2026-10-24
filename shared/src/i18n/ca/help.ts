import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Ajuda i documentació',
  'help.search': 'Cerca a la documentació…',
  'help.contents': 'Contingut',
  'help.noResults': 'No hi ha cap pàgina que hi coincideixi.',
  'help.errorTitle': "No s'ha pogut carregar aquesta pàgina",
  'help.errorBody': 'El contingut de l’ajuda es carrega del wiki de TREK. Comprova la connexió i torna-ho a provar.',

  // center
  'help.center.button': 'Ajuda per a aquesta pantalla',
  'help.center.title': 'Ajuda',
  'help.center.onThisScreen': 'En aquesta pantalla',
  'help.center.screens': 'Pantalles',
  'help.center.thisScreen': 'Actual',
  'help.center.subScreens': '{count} subpantalles',
  'help.center.subScreens.one': '{count} subpantalla',
  'help.center.subScreensLabel': 'Subpantalles',
  'help.center.guidesCount': '{count} guies',
  'help.center.guidesCount.one': '{count} guia',
  'help.center.goToScreen': 'Ves a {screen}',
  'help.center.overview': 'Resum',
  'help.center.howTo': 'Com puc…',
  'help.center.searchPlaceholder': 'Cerca a les guies i la documentació…',
  'help.center.searchEmpty': "No s'ha trobat res per a «{query}».",
  'help.center.searchGuides': 'Guies',
  'help.center.searchDocs': 'Documentació',
  'help.center.searchError': 'Ara mateix la cerca no està disponible.',
  'help.center.back': 'Enrere',
  'help.center.close': 'Tanca l’ajuda',
  'help.center.steps': '{count} passos',
  'help.center.steps.one': '{count} pas',
  'help.center.step': 'Pas {n}',
  'help.center.stepsLabel': 'Passos',
  'help.center.stepOf': 'Pas {n} de {total}',
  'help.center.screenshot': 'Captura de pantalla',
  'help.center.result': 'Què obtens',
  'help.center.tips': 'Convé saber',
  'help.center.related': 'Relacionat',
  'help.center.openDocs': 'Obre a Ajuda i documentació',
  'help.center.docsSection': 'A la documentació',
  'help.center.noContext': 'Encara no hi ha cap guia per a aquesta pantalla.',
  'help.center.noContextHint': "Busca a la documentació o explica'ns què buscaves.",
  'help.center.feedback': 'Hi trobes a faltar alguna cosa?',
  'help.center.feedbackLink': 'Explica-ho a GitHub',
  'help.center.discord': 'Pregunta a Discord',
  'help.center.quick': 'Ràpid',
  'help.center.guide': 'Guia',
  'help.center.tour': 'Visita guiada',
  'help.center.imageAlt': 'Pas {n} de «{title}»',

  // ctx
  'help.ctx.dashboard.title': 'Tauler',
  'help.ctx.dashboard.summary':
    'El tauler mostra tots els teus viatges. La targeta de dalt, amb aspecte de targeta d’embarcament, mostra el viatge en curs o el següent. La fila de sota resumeix tot el que has viatjat fins ara, i les targetes llisten tots els viatges que planifiques, que has arxivat o que ja has acabat.',
  'help.ctx.dashboard.bullet.1':
    "Targeta d'embarcament: el viatge en curs o el següent, amb les dates, els viatgers, els llocs i un compte enrere. Fes-hi clic per obrir el viatge. Els quatre botons de la cantonada superior dreta serveixen per editar-lo, duplicar-lo, arxivar-lo o eliminar-lo.",
  'help.ctx.dashboard.bullet.2':
    'Estadístiques de viatge: països visitats, viatges, dies en ruta i distància volada, de tots els teus viatges.',
  'help.ctx.dashboard.bullet.3':
    'Targetes de viatge, filtrades per «Planificat», «Arxivat» i «Completat», en graella o en llista. El quadre de cerca de sobre busca a tots els teus viatges alhora, per títol, data o un lloc del viatge. Els botons per editar, duplicar, arxivar i eliminar un viatge són a la cantonada superior dreta de la foto de cada targeta.',
  'help.ctx.dashboard.bullet.4':
    'Ginys a la dreta: conversor de divises, «Col·leccions» (si el complement «Col·leccions» està activat), rellotges mundials, properes reserves i ginys de connectors. Els ginys integrats es poden desactivar a «Configuració», «Aparença».',
  'help.ctx.dashboard.bullet.5':
    'Pots començar un viatge nou tant des de la targeta «Viatge nou» com amb el botó de la cantonada inferior dreta.',

  // create-trip
  'help.guide.create-trip.title': 'Crear un viatge',
  'help.guide.create-trip.goal': 'Crea un viatge nou amb un nom, unes dates i una foto de portada.',
  'help.guide.create-trip.step.1':
    'Fes clic a «Viatge nou». La targeta del final dels teus viatges i el botó de la cantonada inferior dreta fan el mateix.',
  'help.guide.create-trip.step.2':
    "Posa un nom al viatge. És l'únic camp necessari; tota la resta ho pots afegir més endavant.",
  'help.guide.create-trip.step.3':
    "Tria una data d'inici i una de final. TREK crea un dia per a cada data, perquè puguis començar a planificar l'itinerari. Encara no tens dates? Deixa-les buides i indica el «Nombre de dies».",
  'help.guide.create-trip.step.4':
    "Opcional: afegeix una foto de portada. Puja'n una de teva, arrossega-la o enganxa-la, o busca la destinació a Unsplash.",
  'help.guide.create-trip.step.5': 'Fes clic a «Crea un viatge nou».',
  'help.guide.create-trip.result':
    "El viatge apareix al tauler. Si és el teu proper viatge, surt a la targeta d'embarcament de dalt de tot.",
  'help.guide.create-trip.tip.1':
    'Pots canviar les dates més endavant. Si ja hi ha reserves, TREK et pregunta si les vols moure juntament amb els dies.',
  'help.guide.create-trip.tip.2':
    'Totes les despeses es converteixen a la moneda del viatge que triïs aquí. Tria la moneda de la destinació.',

  // edit-trip
  'help.guide.edit-trip.title': 'Editar un viatge',
  'help.guide.edit-trip.goal': "Canvia el nom d'un viatge, les seves dates o la seva configuració.",
  'help.guide.edit-trip.step.1':
    "Fes clic al llapis de la cantonada superior dreta de la targeta del viatge (o de la targeta d'embarcament).",
  'help.guide.edit-trip.step.2':
    'Canvia el que calgui: el nom, la descripció, les dates, la portada, la divisa, el recordatori o els companys de viatge.',
  'help.guide.edit-trip.step.3': 'Fes clic a «Actualitza».',
  'help.guide.edit-trip.result': 'La targeta s’actualitza a l’instant per a tots els membres del viatge.',
  'help.guide.edit-trip.tip.1':
    "Si avances o endarrereixes l'inici d'un viatge que té reserves, TREK et pregunta si també cal moure les reserves. Si escurces un viatge, es mostren els dies que s'eliminarien i què hi ha planificat. Només es desa quan fas clic a «Treu els dies i desa».",

  // cover-image
  'help.guide.cover-image.title': 'Posar una foto de portada',
  'help.guide.cover-image.goal':
    "Posa al viatge una imatge que es vegi a la seva targeta i a la targeta d'embarcament.",
  'help.guide.cover-image.step.1': "Obre el formulari d'edició del viatge amb el llapis de la seva targeta.",
  'help.guide.cover-image.step.2':
    'A «Imatge de portada», deixa anar o enganxa una foto, fes clic per pujar-ne una, o escriu una destinació i fes clic a «Cercar a Unsplash».',
  'help.guide.cover-image.step.3': 'Tria una foto i fes clic a «Actualitza».',
  'help.guide.cover-image.result': 'La foto es desa amb el viatge i es mostra a tot arreu on aparegui el viatge.',
  'help.guide.cover-image.tip.1':
    "Les fotos de la cerca d'Unsplash s'atribueixen automàticament; les que puges tu es queden al teu servidor.",

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicar un viatge',
  'help.guide.duplicate-trip.goal': 'Fes servir un viatge com a plantilla per a un de nou.',
  'help.guide.duplicate-trip.step.1': 'Fes clic a la icona de duplicar, a la cantonada superior dreta de la targeta.',
  'help.guide.duplicate-trip.step.2': 'Llegeix què es copiarà i què no, i després fes clic a «Copia el viatge».',
  'help.guide.duplicate-trip.result':
    "Al tauler apareix una còpia amb el nom de l'original seguit de (còpia). Pots canviar-li el nom i les dates.",
  'help.guide.duplicate-trip.tip.1':
    "Es copien els dies, els llocs, les excursions i les rutes per carretera, les reserves, les partides del pressupost, les llistes d'equipatge, les tasques i les notes dels dies; les llistes d'equipatge i les tasques es copien sense marcar. No es copien els membres, el xat, les enquestes, els fitxers ni els enllaços per compartir.",

  // archive-trip
  'help.guide.archive-trip.title': 'Arxivar i restaurar un viatge',
  'help.guide.archive-trip.goal': "Treu un viatge de la llista sense eliminar-lo i recupera'l quan vulguis.",
  'help.guide.archive-trip.step.1': "Fes clic a la icona d'arxivar, a la cantonada superior dreta de la targeta.",
  'help.guide.archive-trip.step.2': 'Per tornar-lo a veure, posa el filtre de sobre les targetes a «Arxivat».',
  'help.guide.archive-trip.step.3':
    'Fes clic a «Restaura» a la targeta per tornar-lo a «Planificat», o a «Completat» si les dates ja han passat.',
  'help.guide.archive-trip.result':
    'Els viatges arxivats conserven totes les dades. Ja no surten al tauler ni al calendari de tots els viatges.',

  // delete-trip
  'help.guide.delete-trip.title': 'Eliminar un viatge',
  'help.guide.delete-trip.goal': 'Elimina definitivament un viatge.',
  'help.guide.delete-trip.step.1': 'Fes clic a la icona de la paperera a la cantonada superior dreta de la targeta.',
  'help.guide.delete-trip.step.2':
    'Confirma amb «Elimina». El diàleg mostra el nom del viatge, perquè sàpigues que és el correcte.',
  'help.guide.delete-trip.result':
    'S’eliminen el viatge i els seus dies, llocs, reserves i fitxers. No es pot desfer, així que, si dubtes, millor arxiva’l.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Trobar viatges completats i canviar entre graella i llista',
  'help.guide.filter-and-view.goal': "Consulta els viatges acabats o arxivats i tria la disposició que més t'agradi.",
  'help.guide.filter-and-view.step.1':
    'Fes servir «Planificat», «Arxivat» i «Completat», a sobre de les targetes. A «Completat» hi ha tots els viatges amb la data de fi ja passada.',
  'help.guide.filter-and-view.step.2':
    'Fes clic a la icona de llista per passar a una llista compacta; torna-hi a fer clic per tornar a la graella.',
  'help.guide.filter-and-view.result': 'El tauler recorda la disposició que has triat en aquest dispositiu.',

  // calendar-feed
  'help.guide.calendar-feed.title': "Subscriure't a tots els viatges des del calendari",
  'help.guide.calendar-feed.goal':
    'Consulta els dies i les reserves de tots els viatges actius a la teva app de calendari, sempre sincronitzats.',
  'help.guide.calendar-feed.step.1': 'Fes clic a la icona del calendari, al costat del selector de vista.',
  'help.guide.calendar-feed.step.2':
    'Fes clic a «Activa la subscripció al calendari». TREK crea un enllaç privat al feed.',
  'help.guide.calendar-feed.step.3':
    "Fes clic a «Afegeix a Google Calendar» o «Afegeix a Calendari d’Apple / Outlook». Per a qualsevol altra aplicació de calendari, obre «O copia un enllaç manualment» i copia l'enllaç des d'allà.",
  'help.guide.calendar-feed.result':
    "Tots els viatges actius apareixen al teu calendari i s'actualitzen sols. No s'hi inclouen els viatges arxivats ni els que van acabar fa més de 90 dies.",
  'help.guide.calendar-feed.tip.1':
    "No comparteixis l'enllaç: qualsevol persona que el tingui pot llegir el feed. Si li arriba a algú altre, «Regenera» et dona un enllaç nou i l'antic deixa de funcionar. «Desactiva» elimina l'enllaç del tot.",

  // widgets
  'help.guide.widgets.title': 'Triar els ginys del tauler',
  'help.guide.widgets.goal': 'Mostra o amaga la fila d’estadístiques i els ginys de la dreta.',
  'help.guide.widgets.step.1': 'Obre el menú del teu avatar, a la cantonada superior dreta, i tria «Configuració».',
  'help.guide.widgets.step.2': 'Ves a la pestanya «Aparença».',
  'help.guide.widgets.step.3':
    "A «Ginys del tauler», activa o desactiva cada giny, per separat per a «Escriptori» i «Mòbil». «Barra lateral dreta» desactiva tota la columna de la dreta d'un cop.",
  'help.guide.widgets.step.4': 'Torna al tauler. El canvi s’aplica a l’instant.',
  'help.guide.widgets.result':
    'Si amagues ginys, els viatges tenen més espai. Desactiva tota la barra lateral dreta per centrar la disposició.',
  'help.guide.widgets.link': "Obre la configuració d'«Aparença»",

  // currency-widget
  'help.guide.currency-widget.title': 'Convertir monedes',
  'help.guide.currency-widget.goal': 'Converteix un import entre dues divises amb el canvi actual.',
  'help.guide.currency-widget.step.1': "Escriu l'import i tria les dues divises.",
  'help.guide.currency-widget.step.2':
    'La fletxa del mig intercanvia les dues divises; la fletxa circular actualitza el tipus de canvi.',
  'help.guide.currency-widget.result':
    'El parell de divises es desa al teu compte, de manera que és el mateix a tots els dispositius.',
  'help.guide.currency-widget.tip.1':
    'Els tipus de canvi provenen del servei gratuït Frankfurter. La fletxa circular de la cantonada del giny obté els més recents.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Afegir rellotges mundials',
  'help.guide.timezones-widget.goal': "Consulta l'hora local de les teves destinacions.",
  'help.guide.timezones-widget.step.1':
    'Fes clic al + del giny «Fusos horaris», busca una ciutat, per exemple Lisboa, i tria-la de la llista.',
  'help.guide.timezones-widget.step.2':
    'Per treure un rellotge, passa-hi el ratolí per sobre i fes clic a la × que apareix a la dreta.',
  'help.guide.timezones-widget.result': 'Els rellotges es desen al teu compte.',
  'help.guide.search-trips.title': 'Cercar els teus viatges',
  'help.guide.search-trips.goal':
    'Troba un viatge pel nom, per una data o per un lloc que hi hagis planificat, també entre els viatges arxivats.',
  'help.guide.search-trips.step.1':
    'Escriu a «Cerca viatges o llocs», a sobre de les targetes. La llista es filtra mentre escrius, entre els viatges planificats, arxivats i completats alhora.',
  'help.guide.search-trips.step.2':
    'Si un viatge coincideix per un dels seus llocs, aquest lloc apareix sota el títol del viatge. Fes clic a la x del quadre, o prem Esc, per tornar a veure tots els viatges.',
  'help.guide.search-trips.result':
    "El tauler només mostra els viatges que coincideixen. Buida el quadre de cerca per tornar a veure'ls tots.",
  'help.guide.search-trips.tip.1':
    "També pots cercar per data: escriu un mes i un any, per exemple maig 2027, o bé 2027-05, i trobaràs els viatges d'aquell mes.",
  'help.guide.search-trips.tip.2':
    'Mentre hi ha una cerca activa, el selector «Planificat», «Arxivat» i «Completat» no s’aplica, així cap viatge no queda amagat per un filtre equivocat.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacances',
  'help.ctx.vacay.summary':
    "«Vacances» és el teu planificador personal de dies lliures: quants dies de vacances tens l'any, quins has registrat i quants te'n queden. La graella mostra tot l'any. La barra lateral conté el selector d'any, les persones amb qui planifiques, els calendaris que t'han compartit, la llegenda i el teu dret.",
  'help.ctx.vacay.bullet.1':
    'Graella anual: dotze targetes de mes, amb una cel·la per dia. Fes clic a un dia per registrar-lo o desmarcar-lo. Un puntet blau marca els dies que ja ocupa un viatge.',
  'help.ctx.vacay.bullet.2':
    "Barra d'eines a baix: el primer botó, amb el teu nom i color, registra vacances; «Festiu de l'empresa» marca els dies que fa festa tota l'empresa. «Mitja jornada» i «Comp. / Flexi» canvien què registra un clic, i «Mitja jornada» també funciona per als festius de l'empresa.",
  'help.ctx.vacay.bullet.3':
    "«Dret»: «Dies», «Utilitzat» i «Restants» de l'any seleccionat, amb els dies traspassats i els dies comp. / flexi al costat. Fes clic al títol de la targeta per plegar-la.",
  'help.ctx.vacay.bullet.4':
    '«Persones» són les persones que comparteixen el teu pla, cadascuna amb el seu color. «Calendaris compartits» mostra els dies lliures d’altres persones com a anells de color. No els pots editar.',
  'help.ctx.vacay.bullet.5':
    "La configuració inclou els caps de setmana, el primer dia de la setmana, els dies traspassats, el teu any de vacances, els festius de l'empresa, els calendaris de festius oficials i de vacances escolars, i «Desfés la fusió» mentre planifiques amb algú altre.",
  // log-day
  'help.guide.log-day.title': 'Registrar un dia de vacances',
  'help.guide.log-day.goal': "Marca un dia lliure a la graella de l'any i mira com s'actualitza el saldo.",
  'help.guide.log-day.step.1':
    "Mira el primer botó de la barra d'eines de baix. Quan mostra el teu nom i el teu color, un clic en un dia hi registra un dia de vacances teu.",
  'help.guide.log-day.step.2':
    'Fes clic en un dia de qualsevol targeta de mes. El dia s’omple amb el teu color i «Utilitzat» suma un dia.',
  'help.guide.log-day.step.3': 'Torna a fer clic al mateix dia per esborrar-lo.',
  'help.guide.log-day.result':
    "El dia queda registrat. «Dies», «Utilitzat» i «Restants» s'actualitzen a l'instant, i tothom qui està fusionat al teu pla veu el canvi de seguida.",
  'help.guide.log-day.tip.1':
    'No es poden registrar caps de setmana mentre «Bloqueja els caps de setmana» està activat a «Configuració». Un dia de cap de setmana registrat abans sí que es pot desmarcar.',
  'help.guide.log-day.tip.2':
    'Un punt blau en una cel·la vol dir que algun dels teus viatges inclou aquell dia, perquè vegis on coincideixen les vacances i els viatges.',
  // half-day
  'help.guide.half-day.title': 'Registrar mig dia',
  'help.guide.half-day.goal': "Agafa't una tarda lliure i gasta només mig dia del teu saldo de vacances.",
  'help.guide.half-day.step.1':
    "Activa «Mitja jornada» a la barra d'eines. El punt taronja és el que indica una mitja jornada a la graella.",
  'help.guide.half-day.step.2': 'Fes clic en un dia. Es compta com a 0,5 i mostra un punt taronja a la cantonada.',
  'help.guide.half-day.step.3':
    'Quan acabis, torna a desactivar «Mitja jornada». Si fas clic en una mitja jornada amb una configuració diferent, passa a tenir la configuració actual.',
  'help.guide.half-day.result':
    '«Utilitzat» augmenta 0,5. «Mitja jornada» i «Comp. / Flexi» són independents, així que també pots registrar mig dia de compensació.',
  'help.guide.half-day.tip.1':
    "La barra d'eines sempre mostra la marca que posarà el teu proper clic, perquè ho puguis comprovar abans de registrar.",
  // comp-day
  'help.guide.comp-day.title': 'Registrar hores compensades o flexibles',
  'help.guide.comp-day.goal': "Agafa't dies de compensació sense gastar dies de vacances.",
  'help.guide.comp-day.step.1':
    "Activa «Comp. / Flexi» a la barra d'eines. El disc ratllat és el que indica un dia de compensació a la graella.",
  'help.guide.comp-day.step.2':
    'Fes clic en un dia. En lloc d’omplir-se de color, es ratlla en diagonal amb el teu color.',
  'help.guide.comp-day.result':
    'Els dies de compensació es compten al costat de les targetes de dies disponibles i mai no redueixen «Restants».',
  'help.guide.comp-day.tip.1':
    "Fes-lo servir per a les hores extres que recuperes com a temps lliure, l'horari flexible o un dia de compensació: qualsevol temps lliure que no siguin vacances.",
  // entitlement
  'help.guide.entitlement.title': 'Definir el teu dret de vacances',
  'help.guide.entitlement.goal': 'Indica a «Vacances» quants dies de vacances tens l’any.',
  'help.guide.entitlement.step.1':
    'A la targeta «Dret» de la barra lateral, fes clic a la casella «Dies» de la teva fila. Si la targeta està plegada, fes clic al títol per desplegar-la.',
  'help.guide.entitlement.step.2':
    'Escriu el teu nombre de dies i prem Retorn. Prem Esc per mantenir el valor anterior.',
  'help.guide.entitlement.result':
    "«Restants» es recalcula a partir dels dies que et corresponen, els dies traspassats, si n'hi ha, i els dies que ja has fet servir.",
  'help.guide.entitlement.tip.1':
    "Cada any té els seus propis dies de vacances, així que si els canvies aquí només afectes l'any seleccionat.",
  // years
  'help.guide.years.title': 'Afegir anys i canviar d’any',
  'help.guide.years.goal': 'Planifica ja l’any vinent o consulta l’any passat.',
  'help.guide.years.step.1':
    "Fes clic al + de la dreta de l'any per afegir l'any següent, o al + de l'esquerra per afegir l'anterior.",
  'help.guide.years.step.2': "Canvia d'any amb les fletxes o amb les fitxes d'any de sota.",
  'help.guide.years.step.3':
    'Per eliminar un any, passa el ratolí per sobre de la seva etiqueta i fes clic al signe menys petit. També se n’eliminen totes les entrades, així que confirma-ho amb compte.',
  'help.guide.years.result':
    'Cada any té els seus propis dies i les seves entrades. El traspàs enllaça un any amb el següent.',
  // company-holidays
  'help.guide.company-holidays.title': "Marcar els festius de l'empresa",
  'help.guide.company-holidays.goal':
    'Bloqueja els dies que tota l’empresa fa festa sense descomptar-los dels dies de ningú.',
  'help.guide.company-holidays.step.1':
    'Obre «Configuració» i comprova que «Festius de l’empresa» està activat. Ho està per defecte. La barra d’eines només mostra el mode mentre està activat.',
  'help.guide.company-holidays.step.2': "De nou a la graella, canvia la barra d'eines a «Festiu de l'empresa».",
  'help.guide.company-holidays.step.3':
    'Fes clic als dies. Es tornen ambre i apareixen a la llegenda. Torna a fer clic a un dia per desmarcar-lo.',
  'help.guide.company-holidays.result':
    "Tothom qui està fusionat al pla veu els festius de l'empresa, i mai no redueixen «Restants».",
  'help.guide.company-holidays.tip.1':
    "Qualsevol persona fusionada pot editar els festius de l'empresa, així que poseu-vos d'acord sobre qui els gestiona.",
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrar els festius',
  'help.guide.public-holidays.goal': 'Mostra a la graella els festius del teu país o regió.',
  'help.guide.public-holidays.step.1': 'Obre la configuració i activa «Festius».',
  'help.guide.public-holidays.step.2':
    'Fes clic a «Afegeix un calendari» i tria el país i, si cal, la regió. També hi pots posar un color i una etiqueta. Després fes clic a «Afegir».',
  'help.guide.public-holidays.step.3': 'Tanca la configuració. Els festius surten a la graella i a la llegenda.',
  'help.guide.public-holidays.result':
    'Els festius oficials es marquen amb el color del calendari i mai no es descompten dels teus dies.',
  'help.guide.public-holidays.tip.1':
    "Pots afegir diversos calendaris, per exemple el de la teva regió i el d'un company fusionat.",
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrar les vacances escolars',
  'help.guide.school-holidays.goal':
    'Consulta les vacances escolars de la teva regió al costat dels teus dies lliures.',
  'help.guide.school-holidays.step.1': 'Obre «Configuració» i activa «Vacances escolars».',
  'help.guide.school-holidays.step.2':
    'Fes clic a «Afegeix un calendari» i tria el país. Si el país té calendaris diferents segons la zona, tria també la regió o el grup i després fes clic a «Afegir».',
  'help.guide.school-holidays.step.3':
    'Tanca «Configuració». Les vacances escolars es mostren ombrejades amb el color del calendari i amb una barra de color a la part inferior dels seus dies.',
  'help.guide.school-holidays.result':
    'Les vacances escolars només es mostren al calendari: no resten mai dies de vacances a ningú.',
  'help.guide.school-holidays.tip.1':
    'No hi és la teva regió? L’administrador pot introduir les vacances escolars a mà a Administrador, Personalització, Vacances escolars.',
  // weekends
  'help.guide.weekends.title': 'Bloquejar els caps de setmana i triar el primer dia de la setmana',
  'help.guide.weekends.goal':
    'Exclou els caps de setmana del recompte i fes que la setmana comenci el dia que prefereixis.',
  'help.guide.weekends.step.1': 'Obre «Configuració».',
  'help.guide.weekends.step.2':
    'Activa «Bloqueja els caps de setmana» i després, a «Dies de cap de setmana», tria els dies que compten com a cap de setmana.',
  'help.guide.weekends.step.3': 'A «La setmana comença el», tria «Dl» o «Dg».',
  'help.guide.weekends.result':
    'Els dies bloquejats apareixen en gris a la graella i no s’hi pot registrar res per error.',
  // leave-year
  'help.guide.leave-year.title': 'Definir el teu any de vacances',
  'help.guide.leave-year.goal':
    'Compta els dies de vacances per any fiscal o des de la data de contractació, en lloc de gener a desembre.',
  'help.guide.leave-year.step.1': 'Obre la configuració i busca «Any de vacances».',
  'help.guide.leave-year.step.2':
    'Tria «Calendari», «Fiscal» (amb el mes i el dia en què comença) o «Contractació» (amb la data en què et van contractar).',
  'help.guide.leave-year.result':
    'El dret, els dies utilitzats i els dies traspassats es compten per a aquest període, i la graella comença pel seu primer mes.',
  'help.guide.leave-year.tip.1':
    'Aquesta opció és personal: en un pla fusionat, cadascú manté el seu propi any de vacances i les seves xifres.',
  // carry-over
  'help.guide.carry-over.title': 'Traspassar els dies no gaudits',
  'help.guide.carry-over.goal': "Passa al període següent els dies que et sobren al final d'un període.",
  'help.guide.carry-over.step.1': 'Obre la configuració.',
  'help.guide.carry-over.step.2': 'Activa «Arrossega el saldo».',
  'help.guide.carry-over.result':
    'Els dies traspassats es recalculen per a tots els teus anys i es mostren sota els dies disponibles.',
  'help.guide.carry-over.tip.1': 'Si el desactives, tots els saldos de dies traspassats tornen a zero.',
  // invite
  'help.guide.invite.title': 'Planificar amb algú altre',
  'help.guide.invite.goal':
    'Uneix el teu pla amb el d’un altre usuari de TREK perquè tots dos vegeu els dies lliures en una sola graella.',
  'help.guide.invite.step.1': 'Fes clic a la icona de persona de la targeta «Persones».',
  'help.guide.invite.step.2': "Tria l'usuari i fes clic a «Envia la invitació».",
  'help.guide.invite.step.3':
    'La persona rep una notificació i una «Sol·licitud de fusió» la propera vegada que obre «Vacances». Mentrestant, la invitació apareix com a pendent; passa-hi el ratolí per cancel·lar-la.',
  'help.guide.invite.result':
    "Els dos plans es fusionen: cada persona té un color, podeu registrar dies l'un per a l'altre i tot se sincronitza en directe.",
  'help.guide.invite.tip.1':
    'Per desfer una fusió, fes clic a «Dissol» a «Configuració». Les entrades de cadascú tornen al seu propi pla.',
  'help.guide.invite.tip.2':
    "Si l'altra persona només ha de veure els teus dies, comparteix-li el calendari en lloc de fusionar-los.",
  // share-calendar
  'help.guide.share-calendar.title': 'Compartir el calendari en mode de només lectura',
  'help.guide.share-calendar.goal': 'Permet que algú vegi quan fas festa sense que pugui canviar el teu pla.',
  'help.guide.share-calendar.step.1': 'Fes clic a la icona de compartir de la targeta «Calendaris compartits».',
  'help.guide.share-calendar.step.2': "Tria l'usuari i fes clic a «Compartir». No cal que ho accepti.",
  'help.guide.share-calendar.step.3':
    "Els calendaris que t'han compartit apareixen a dalt de la targeta: fes clic en un per amagar-lo o mostrar-lo, o passa-hi el ratolí i fes clic a la x per treure'l. A «Comparteixes amb», passa el ratolí per un nom i fes clic a «Deixa de compartir».",
  'help.guide.share-calendar.result':
    'Els teus dies lliures apareixen com un anell de color a la seva graella. No poden editar res del que comparteixes.',
  'help.guide.share-calendar.tip.1':
    "Compartir i fusionar són independents: pots estar fusionat amb una persona i compartir amb d'altres.",
  'help.guide.share-calendar.tip.2':
    "Passa el ratolí per sobre d'un dia amb un anell per veure qui està de vacances i durant quant de temps.",

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atles',
  'help.ctx.atlas.summary':
    'L’Atles mostra en un mapa del món on has viatjat: cada país on t’ha portat un viatge apareix acolorit, i pots afegir a mà els països que vas visitar abans de fer servir TREK. Apropa’t per veure les regions, fes una llista de llocs que encara vols visitar i consulta les teves xifres al panell translúcid de la part inferior.',
  'help.ctx.atlas.bullet.1':
    "El mapa: cada país visitat té el seu propi color fix, els països planificats tenen un contorn discontinu, els de la llista de desitjos tenen ratlles diagonals i la resta són grisos. Passa el ratolí per un país per veure'n els viatges, els llocs i la primera i l'última visita.",
  'help.ctx.atlas.bullet.2':
    "Cerca a dalt: escriu un país o un lloc. Si és un país on no has estat, se n'obre la finestra emergent. Si és un país on has estat, la seva targeta apareix al panell. Si tries un lloc, el mapa n'obre la regió perquè la puguis marcar.",
  'help.ctx.atlas.bullet.3':
    "«Mostra els països planificats», a dalt a la dreta: mostra els països dels teus propers viatges. L'interruptor només apareix si en tens.",
  'help.ctx.atlas.bullet.4':
    "Panell inferior: la pestanya «Estadístiques», amb els països (i al costat els planificats), les regions, els viatges, els llocs, les ciutats, els dies, els continents, la teva ratxa i els viatges d'aquest any; la pestanya «Llista de desitjos», amb els llocs que encara vols visitar; i, amb el complement «Excursions», una pestanya «Excursions» amb la distància i el desnivell de les excursions que has fet.",
  'help.ctx.atlas.bullet.5':
    "Regions: quan t'hi apropes molt, el mapa mostra estats i províncies. Fes clic en una per marcar-la, desmarcar-la o afegir-la a la llista de desitjos.",
  'help.ctx.atlas.bullet.6':
    'Dawarich: amb el complement connectat, un panell a l’esquerra de les estadístiques marca desitjos com a complerts i afegeix països a partir dels teus enregistraments. Només ho fa després que ho confirmis.',
  // mark-country
  'help.guide.mark-country.title': 'Marcar un país com a visitat',
  'help.guide.mark-country.goal':
    'Afegeix un país que vas visitar abans de fer servir TREK, perquè compti al mapa i al recompte.',
  'help.guide.mark-country.step.1': 'Escriu el país al quadre de cerca de dalt del mapa.',
  'help.guide.mark-country.step.2':
    'Tria’l de la llista. El mapa es desplaça fins al país i se n’obre una finestra emergent.',
  'help.guide.mark-country.step.3': 'Tria «Marca com a visitat».',
  'help.guide.mark-country.result':
    'El país rep un color al mapa i el recompte de «Països» augmenta en un. Aquest color és permanent: quan marques més països, els colors dels altres no canvien.',
  'help.guide.mark-country.tip.1':
    'Si fas clic en un país gris del mapa, s’obre la mateixa finestra. Per als països petits, la cerca és més fiable.',
  'help.guide.mark-country.tip.2':
    'Un país que marques a mà sempre compta com a visitat, siguin quines siguin les dates dels viatges que hi vagin.',
  // unmark-country
  'help.guide.unmark-country.title': 'Treure un país que has marcat',
  'help.guide.unmark-country.goal': 'Treu del mapa un país que havies marcat a mà.',
  'help.guide.unmark-country.step.1':
    'Cerca el país i tria’l, o fes-hi clic al mapa. Si és un país que has marcat tu, la finestra emergent et pregunta si el vols treure.',
  'help.guide.unmark-country.step.2': 'Confirma-ho amb «Elimina».',
  'help.guide.unmark-country.result': 'El país torna a ser gris i ja no es compta.',
  'help.guide.unmark-country.tip.1':
    'Així només pots treure els països que has marcat a mà. Un país amb viatges o llocs continua marcat fins que s’eliminen aquests viatges o llocs. Si l’has marcat a mà, també trobaràs «Elimina» a la seva targeta de detall del panell.',
  // country-details
  'help.guide.country-details.title': 'Veure què vas fer en un país',
  'help.guide.country-details.goal': "Obre un país visitat i ves als viatges que t'hi van portar.",
  'help.guide.country-details.step.1': 'Escriu un país que hagis visitat al quadre de cerca de dalt del mapa.',
  'help.guide.country-details.step.2':
    "Tria'l. El mapa s'hi desplaça i al panell de baix apareix una targeta. La targeta mostra la bandera del país, insígnies amb els seus llocs, viatges i regions visitades, i una fitxa per a cadascun dels tres primers viatges.",
  'help.guide.country-details.result': 'Fes clic en la fitxa d’un viatge per obrir-lo al planificador.',
  'help.guide.country-details.tip.1':
    'Si passes el ratolí per sobre del país al mapa, veuràs les mateixes xifres i, a més, la primera i l’última visita.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrar els països on aniràs',
  'help.guide.planned-countries.goal':
    'Mostra al mapa els països dels teus propers viatges sense comptar-los com a visitats.',
  'help.guide.planned-countries.step.1':
    'Activa «Mostra els països planificats», a dalt a la dreta. El número del costat indica quants països planificats hi ha.',
  'help.guide.planned-countries.step.2':
    "Cerca un país planificat i tria'l: el panell indica «Planificat» i la indicació del mapa mostra quan hi vas.",
  'help.guide.planned-countries.result':
    "Els països planificats es mostren amb un contorn discontinu, perquè no es confonguin mai amb els que ja has visitat. L'interruptor recorda la teva elecció.",
  'help.guide.planned-countries.tip.1':
    'Un país compta com a visitat quan el viatge que hi fas ja ha començat. Un viatge en curs també compta. Els viatges sense dates no entren de cap manera a les estadístiques.',
  'help.guide.planned-countries.tip.2': 'L’interruptor només apareix si tens viatges propers.',
  // regions
  'help.guide.regions.title': 'Marcar una regió',
  'help.guide.regions.goal': 'Marca els estats, les províncies o les prefectures on has estat, no només els països.',
  'help.guide.regions.step.1':
    "Apropa't a un país fins que apareguin els límits dels seus estats i províncies. Si busques el país i el tries, el mapa s'hi apropa prou.",
  'help.guide.regions.step.2':
    'Fes clic en una regió. Quan hi passes el ratolí per sobre, en surt el nom. La finestra mostra la regió i el país on és.',
  'help.guide.regions.step.3': 'Tria «Marca com a visitat».',
  'help.guide.regions.result':
    "La regió s'omple amb el color del país. Si marques una regió, el país també compta com a visitat, si encara no ho estava.",
  'help.guide.regions.tip.1':
    'Si fas clic en una regió visitada, se t’ofereix «Elimina», tant si l’has marcada tu com si s’hi ha afegit per un lloc.',
  'help.guide.regions.tip.2': 'Les regions on tens llocs reals es marquen automàticament. No cal que hi facis res.',
  // search-place
  'help.guide.search-place.title': 'Trobar un lloc i marcar-ne la regió',
  'help.guide.search-place.goal': 'Marca Baviera buscant Munic, sense haver de saber a quina regió és una ciutat.',
  'help.guide.search-place.step.1':
    'Escriu una ciutat, un monument o una adreça al quadre de cerca. Primer surten els països; els llocs que coincideixen apareixen a sota, a «Llocs».',
  'help.guide.search-place.step.2': 'Tria el lloc. El mapa s’hi desplaça i troba la regió on és el punt.',
  'help.guide.search-place.step.3':
    'Tria «Marca com a visitat» per a aquesta regió, o «Afegeix a la llista de desitjos» si encara no hi has estat.',
  'help.guide.search-place.result':
    'Es marca la regió i també el país. Per als països que no tenen dades de regions al paquet de mapes, es marca directament el país.',
  'help.guide.search-place.tip.1':
    'Els llocs surten de la mateixa cerca que a la resta de TREK, és a dir, del proveïdor que ha configurat l’administrador.',
  // bucket-country
  'help.guide.bucket-country.title': 'Afegir un país a la llista de desitjos',
  'help.guide.bucket-country.goal':
    'Tingues al mapa una llista de desitjos de països, separada dels països que ja has visitat.',
  'help.guide.bucket-country.step.1': "Busca el país i tria'l, o fes-hi clic al mapa.",
  'help.guide.bucket-country.step.2': 'Tria «Afegeix a la llista de desitjos».',
  'help.guide.bucket-country.step.3':
    'Tria un mes i un any si ja saps quan, i confirma amb «Afegeix a la llista de desitjos».',
  'help.guide.bucket-country.result':
    "El país es mostra amb ratlles diagonals del color que tindrà quan l'hagis visitat, i apareix a la pestanya «Llista de desitjos» del panell.",
  'help.guide.bucket-country.tip.1':
    'Quan el país ja és a la llista, la mateixa finestra ofereix «Elimina de la llista de desitjos».',
  'help.guide.bucket-country.tip.2':
    'Una entrada per data objectiu: el mateix país pot ser a la llista per a dos mesos diferents, però no dues vegades per al mateix mes.',
  // bucket-place
  'help.guide.bucket-place.title': 'Afegir un lloc a la llista de desitjos',
  'help.guide.bucket-place.goal':
    'Desa una ciutat, un monument o una adreça que vulguis visitar, amb les coordenades i una data prevista.',
  'help.guide.bucket-place.step.1': 'Obre la pestanya «Llista de desitjos» al panell de baix.',
  'help.guide.bucket-place.step.2': 'Fes clic a «Afegeix un lloc».',
  'help.guide.bucket-place.step.3':
    'Escriu el nom i prem el botó de cerca; tria el resultat que correspon perquè el lloc tingui coordenades. També pots escriure només el nom i no fer la cerca.',
  'help.guide.bucket-place.step.4': 'Si vols, tria un mes i un any, i fes clic a «Afegir».',
  'help.guide.bucket-place.result':
    'El lloc apareix a dalt de tot de la teva llista de desitjos amb la data prevista. Passa-hi el ratolí per sobre per veure la × que el treu.',
  'help.guide.bucket-place.tip.1':
    'Dawarich només pot marcar més endavant un desig com a complert si té coordenades. Ho fa quan els teus registres mostren que hi has estat.',
  // stats
  'help.guide.stats.title': 'Consultar les teves estadístiques',
  'help.guide.stats.goal': 'Descobreix què compten les xifres del panell i què no hi compten.',
  'help.guide.stats.step.1':
    '«Països» és el nombre de països diferents on has estat realment. Els països planificats es mostren sota el número i no hi compten. «Regions» compta els estats i les províncies on has estat. «Viatges», «Llocs» i «Dies» són totals de tots els teus viatges. «Ciutats» es calcula a partir de les adreces dels teus llocs, així que és una estimació.',
  'help.guide.stats.step.2':
    'Els continents mostren els països visitats de cada continent. L’Antàrtida apareix a la fila quan ja hi has estat. Després hi ha la teva ratxa (anys seguits amb almenys un viatge) i quants viatges has fet aquest any.',
  'help.guide.stats.result':
    "Les xifres s'actualitzen automàticament a mesura que planifiques els viatges. Aquí no cal mantenir res.",
  'help.guide.stats.tip.1':
    "Les ciutats s'extreuen del text de l'adreça, no es consulten enlloc. Per això una adreça curta com «Osteria Francescana, Italy», o una que acaba en una prefectura, pot comptar com a regió en lloc de ciutat.",
  'help.guide.stats.tip.2':
    'Els països marcats a mà compten a «Països» i als continents, però no sumen viatges, llocs ni dies.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Afegir països a partir dels teus registres',
  'help.guide.dawarich-countries.goal':
    "Fes servir Dawarich per saber en quins països has estat durant l'últim any, i afegeix al mapa els que confirmis.",
  'help.guide.dawarich-countries.step.1':
    "Quan el complement Dawarich està connectat, apareix un panell de Dawarich amb dues caselles a la part de baix del mapa, a l'esquerra de les estadístiques. Fes clic a «Països».",
  'help.guide.dawarich-countries.step.2':
    'El diàleg s’obre a la pestanya «Països». Fes clic a «Busca països»: TREK llegeix els països i les ciutats que cobreixen els teus enregistraments dels últims 12 mesos, mes a mes, així que pot trigar una mica. Cada país que encara no tens a l’Atles apareix amb la bandera, el nombre de ciutats i el nom de la primera ciutat. Tots els països estan marcats per defecte. Fes clic en una fila per excloure’l.',
  'help.guide.dawarich-countries.step.3':
    "Confirma amb el botó de baix a la dreta, que diu «Afegeix 5 països» quan hi ha cinc files marcades. El diàleg indica quants se n'han afegit. Quan el tanques, el mapa ja està actualitzat.",
  'help.guide.dawarich-countries.result':
    'Els països confirmats es pinten al mapa i compten a «Països», amb Dawarich com a origen. Els països que has marcat a mà no canvien.',
  'help.guide.dawarich-countries.tip.1':
    'Els països que l’Atles ja mostra com a visitats, ja sigui a mà, per un viatge o per una comprovació anterior, no s’hi inclouen, així les teves marques no canvien mai. Si confirmes aquí un país que havies tret de l’Atles, s’hi torna a afegir.',
  'help.guide.dawarich-countries.tip.2':
    'Si TREK no reconeix el nom d’un país, el nom apareix sota les files i no es descarta. «Tornar a comprovar» torna a consultar Dawarich. La nota sota la llista indica que s’han revisat els darrers 12 mesos. Aquest període no es pot canviar.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Marcar desitjos complerts a partir dels teus enregistraments',
  'help.guide.dawarich-wishes.goal':
    "Descobreix quins llocs de la teva llista de desitjos has visitat de veritat, i marca'ls amb la data en què hi vas arribar.",
  'help.guide.dawarich-wishes.step.1':
    'Al panell de Dawarich, a la part de baix del mapa i a l’esquerra de les estadístiques, fes clic a «Llista de desitjos».',
  'help.guide.dawarich-wishes.step.2':
    "El diàleg s'obre a la pestanya «Llista de desitjos». Fes clic a «Comprova la llista de desitjos»: TREK revisa els teus registres per a cada entrada que té coordenades. Cada desig assolit surt a la llista amb com t'hi vas acostar, quant de temps t'hi vas quedar i quin dia, i apareix marcat per defecte. Els que ja havies marcat diuen «Ja marcat». Sota la llista, una nota compta les entrades sense coordenades i també mostra la regla: «Un desig es considera assolit a menys de 250 m i després de 20 minuts al lloc».",
  'help.guide.dawarich-wishes.step.3':
    "Confirma amb el botó de baix a la dreta, que diu «Marca'n 2» quan hi ha dues files marcades. Després tanca el diàleg i obre la pestanya «Llista de desitjos» del panell del costat.",
  'help.guide.dawarich-wishes.result':
    'Cada desig rep una marca verda amb la data de l’estada, no la d’avui. El text emergent diu «Marcat a partir dels teus enregistraments de Dawarich». Fes clic a la data per desfer-ho.',
  'help.guide.dawarich-wishes.tip.1':
    'Passar-hi pel costat no compta: has d’estar a prop del lloc i quedar-t’hi una estona. Si hi ha diverses estades vàlides, es fa servir la més llarga. Un desig sense coordenades no es pot comprovar, així que afegeix els llocs amb la cerca d’«Afegeix un lloc» i no només amb el nom.',
  'help.guide.dawarich-wishes.tip.2':
    "Cada comprovació revisa fins a 50 entrades, començant per les que encara no estan marcades. Si n'hi ha més, TREK t'ho indica. Un desig que ja estava marcat conserva la seva data.",

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Col·leccions',
  'help.ctx.collections.summary':
    "«Col·leccions» és la teva biblioteca fora dels viatges: llistes amb nom dels llocs que has trobat i vols conservar, cadascun amb l'estat «Idea», «Hi vull anar» o «Visitat» i, amb «Excursions» activat, excursions senceres que has desat d'un viatge. Els llocs i les excursions es copien als viatges i des dels viatges, però no es vinculen mai, de manera que una llista i un viatge no s'afecten mútuament.",
  'help.ctx.collections.bullet.1':
    'La columna de llistes de l’esquerra mostra les teves llistes, les que han compartit amb tu, les invitacions que encara no has respost i «Tot el desat», que reuneix tot el contingut de les llistes que són teves. A dalt hi ha «Nova llista» i la importació de fitxers.',
  'help.ctx.collections.bullet.2':
    'La capçalera de la llista oberta mostra el color, la portada, la descripció i els enllaços, els membres i, a la dreta, «Edita» (només per al propietari), «Exporta» i «Compartir». En una llista que han compartit amb tu, el botó «Compartir» diu «Compartit».',
  'help.ctx.collections.bullet.3':
    "Fila de filtres sobre els llocs: el + per afegir un lloc, els desplegables «Estat», «Categoria», «Valoració» i «Ordena», la icona de la casella per a «Triar» i la icona del núvol per a «Importa des d’un viatge». El filtre d'etiquetes només apareix en aquesta fila quan no es mostra cap mapa.",
  'help.ctx.collections.bullet.4':
    "Files de llocs: foto, nom i adreça, etiquetes i categoria, i la pastilla d'estat a la dreta. Un clic a la pastilla la passa a l'estat següent.",
  'help.ctx.collections.bullet.5':
    "Mapa a la dreta: una xinxeta per a cada lloc amb coordenades. La barra de dalt té «Ampliar el mapa» («Mostra la llista» quan el mapa ocupa tota la pantalla), el filtre d'etiquetes amb el botó per gestionar-les i el quadre «Cerca llocs». Fes clic a una xinxeta per obrir aquell lloc.",
  'help.ctx.collections.bullet.6':
    "Fitxa de detall: fes clic a una fila per veure'n la portada, la categoria, l'estat, la valoració amb estrelles, les etiquetes, la descripció i els enllaços. La càmera de la portada canvia la foto. A baix hi ha «Edita», «Copiar al viatge», el botó de navegació i «Eliminar de la llista».",
  // create-list
  'help.guide.create-list.title': 'Crear una llista',
  'help.guide.create-list.goal': 'Crea una llista nova amb nom, color i portada, a punt per afegir-hi llocs.',
  'help.guide.create-list.step.1': 'Fes clic a «Nova llista», a dalt de la barra lateral de llistes.',
  'help.guide.create-list.step.2':
    'Posa un nom a la llista i tria un color. La imatge de portada, la descripció i els enllaços són opcionals; els pots afegir més tard amb «Edita».',
  'help.guide.create-list.step.3': 'Fes clic a «Crea».',
  'help.guide.create-list.result':
    'La llista s’obre buida i la pots omplir de dues maneres: «Afegir un lloc» i «Importa des d’un viatge».',
  'help.guide.create-list.tip.1':
    "La portada pot ser una imatge que pugis tu o una de trobada amb la cerca d'Unsplash al mateix diàleg.",
  // add-place
  'help.guide.add-place.title': 'Afegir un lloc',
  'help.guide.add-place.goal':
    "Troba un lloc i desa'l a la llista oberta amb nom, categoria, estat i notes en un sol pas.",
  'help.guide.add-place.step.1':
    "Fes clic al + de l'inici de la fila de filtres de sobre els llocs. En una llista encara buida, fes clic a «Afegir un lloc», al mig de la pàgina.",
  'help.guide.add-place.step.2':
    'Escriu el lloc al camp de cerca i tria un resultat. El nom, l’adreça i les coordenades s’omplen a partir del resultat.',
  'help.guide.add-place.step.3':
    'Tria l’estat i, si vols, una categoria, una descripció i enllaços, i fes clic a «Afegir». El diàleg queda obert per al lloc següent; «Cancel·la» el tanca.',
  'help.guide.add-place.result': 'El lloc apareix a la llista i, si té coordenades, com una xinxeta al mapa.',
  'help.guide.add-place.tip.1':
    "Des d'un viatge, «Desar a la col·lecció», a la fitxa del lloc o al menú d'un lloc, afegeix un lloc del viatge a una llista sense sortir del viatge.",
  'help.guide.add-place.tip.2':
    'La llista ha de ser teva o una en què siguis editor o administrador; el + no apareix a «Tot el desat» ni en les llistes que només pots consultar.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importar llocs d’un viatge',
  'help.guide.import-from-trip.goal':
    "Afegeix d'un cop tots els llocs d'un viatge a una llista en lloc de desar-los un per un.",
  'help.guide.import-from-trip.step.1':
    "Fes clic al botó d'importar, el del núvol amb la fletxa, a la fila de filtres. En una llista buida, el mateix botó és al costat d'«Afegir un lloc».",
  'help.guide.import-from-trip.step.2': 'Tria un dels teus viatges.',
  'help.guide.import-from-trip.step.3':
    "Marca els llocs que vulguis. Els que ja són a la llista apareixen en gris. D'entrada queden seleccionats els llocs que no són a cap dia del viatge. Si tots els llocs ja tenen dia, se seleccionen tots els nous. «Només nous» amaga els llocs que la llista ja té.",
  'help.guide.import-from-trip.step.4': 'Fes clic a «Importa». El botó sempre indica quants llocs s’afegiran.',
  'help.guide.import-from-trip.result':
    "Els llocs es copien a la llista amb el nom, l'adreça, les coordenades, la descripció i la categoria. El viatge no canvia.",
  'help.guide.import-from-trip.tip.1':
    'TREK omet automàticament els duplicats per nom o per coordenades, així que pots importar dues vegades sense problema.',
  'help.guide.import-from-trip.tip.2':
    "A la llista de llocs d'un viatge, el mode de selecció ofereix «Desar a la col·lecció» per a un grup de llocs triats a mà.",
  // place-status
  'help.guide.place-status.title': 'Definir l’estat d’un lloc',
  'help.guide.place-status.goal': 'Controla què és una idea, què tens a la llista curta i on ja has estat.',
  'help.guide.place-status.step.1':
    "Fes clic a la píndola d'estat a l'extrem dret de la fila d'un lloc. «Idea» passa a «Hi vull anar».",
  'help.guide.place-status.step.2':
    'Torna-hi a fer clic per marcar-lo com a «Visitat», i un altre cop per tornar a «Idea».',
  'help.guide.place-status.result':
    "La pastilla i el seu color canvien a l'instant, i els recomptes del filtre d'estat de sobre la llista s'actualitzen.",
  'help.guide.place-status.tip.1':
    'L’estat només existeix a «Col·leccions». Quan copies un lloc a un viatge, l’estat no es copia.',
  'help.guide.place-status.tip.2':
    "Des d'un viatge, «Desar a la col·lecció» obre «Desar a la llista» amb una pastilla d'estat per a cada llista on és el lloc, i la barra de selecció del panell de llocs té «Marca com a visitat a les teves llistes».",
  // place-detail
  'help.guide.place-detail.title': 'Obrir un lloc desat',
  'help.guide.place-detail.goal':
    "Consulta tota la informació d'un lloc i què en pots fer: editar-lo, copiar-lo a un viatge, trobar-hi el camí o eliminar-lo.",
  'help.guide.place-detail.step.1':
    'Fes clic a la fila d’un lloc. La fitxa de detall s’obre al costat de la llista i el mapa es desplaça fins al lloc.',
  'help.guide.place-detail.step.2':
    'A baix hi ha «Edita», «Copiar al viatge», el botó de navegació, que obre el lloc en una aplicació de mapes, i «Eliminar de la llista». La càmera de la portada substitueix la foto automàtica per una de teva.',
  'help.guide.place-detail.result':
    "Amb «Edita» pots canviar el nom, la categoria, les etiquetes, l'adreça, les coordenades, la descripció i els enllaços directament a la fitxa.",
  'help.guide.place-detail.tip.1':
    "La portada s'obté automàticament quan el lloc no té imatge pròpia. La teva pot ser JPG, PNG, GIF, WebP o HEIC, de fins a 20 MB. La icona de la paperera del costat de la càmera recupera la foto automàtica.",
  'help.guide.place-detail.tip.2':
    "Tots els membres, tu inclòs, poden deixar una valoració amb estrelles sota l'estat; el filtre «Valoració» de la fila de filtres fa servir la mitjana.",
  // labels
  'help.guide.labels.title': 'Agrupar llocs amb etiquetes',
  'help.guide.labels.goal':
    'Dona a una llista etiquetes pròpies, com ara barris o dies, a més de les categories comunes.',
  'help.guide.labels.step.1':
    'Fes clic a «Afegir etiqueta», al costat de les etiquetes de sobre el mapa («Gestionar etiquetes» quan la llista ja en té). Quan no es mostra el mapa, el botó és al final de la fila de filtres.',
  'help.guide.labels.step.2':
    'Escriu un nom, tria un color i fes clic a «Afegir etiqueta». Al mateix diàleg pots canviar el nom, el color o eliminar les etiquetes existents.',
  'help.guide.labels.step.3':
    'Activa «Triar», marca els llocs i fes clic a «Assignar etiqueta» a la barra de selecció; després tria les etiquetes i confirma amb «Assignar etiqueta». Per a un sol lloc, també pots afegir etiquetes amb «Edita» des de la fitxa de detall.',
  'help.guide.labels.step.4':
    "Fes clic a una o més etiquetes de sobre el mapa per mostrar només els llocs que tenen alguna d'aquestes etiquetes, a la llista i al mapa. Torna a fer clic a una etiqueta per treure-la del filtre.",
  'help.guide.labels.result':
    'Els llocs etiquetats mostren les etiquetes a la fila, i tots els membres poden fer servir el filtre d’etiquetes, també els que només poden veure la llista.',
  'help.guide.labels.tip.1':
    "Les etiquetes pertanyen a la llista on es van crear. Si mous un lloc a una altra llista, se'n treuen les etiquetes.",
  'help.guide.labels.tip.2': "Per gestionar i assignar etiquetes cal tenir permís d'edició a la llista.",
  // filter-select
  'help.guide.filter-select.title': 'Filtrar i seleccionar llocs',
  'help.guide.filter-select.goal': 'Filtra la llista i canvia molts llocs alhora.',
  'help.guide.filter-select.step.1':
    "Fes servir els desplegables de la fila de filtres: estat, categoria, valoració mínima i ordre. L'estat i la categoria mostren quants llocs coincideixen amb cada opció.",
  'help.guide.filter-select.step.2':
    'Fes clic a la icona de la casella, «Triar», després dels desplegables. Cada fila té una casella i apareix una barra de selecció.',
  'help.guide.filter-select.step.3':
    'Marca llocs o fes servir «Seleccionar-ho tot» per triar tots els llocs que mostra el filtre, i després tria «Assignar etiqueta», «Moure a la llista», «Duplicar a la llista», «Copiar al viatge» o «Elimina». Només el propietari o un administrador de la llista poden moure i eliminar.',
  'help.guide.filter-select.result':
    'Les accions s’apliquen a tota la selecció alhora. La × de la dreta tanca el mode de selecció.',
  'help.guide.filter-select.tip.1':
    '«Seleccionar-ho tot» només selecciona els llocs que coincideixen amb el filtre. Per actuar sobre tots els llocs «Hi vull anar», filtra per «Hi vull anar» i fes clic a «Seleccionar-ho tot».',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiar llocs a un viatge',
  'help.guide.copy-to-trip.goal': "Afegeix llocs desats com a parades d'un dels teus viatges.",
  'help.guide.copy-to-trip.step.1':
    'Activa «Triar» i marca els llocs, o obre un lloc i fes servir «Copiar al viatge» a la seva fitxa de detall.',
  'help.guide.copy-to-trip.step.2': 'Fes clic a «Copiar al viatge» a la barra de selecció.',
  'help.guide.copy-to-trip.step.3': 'Tria el viatge. Si la llista és llarga, filtra-la amb el quadre de cerca.',
  'help.guide.copy-to-trip.result':
    'Els llocs s’afegeixen a la llista de llocs del viatge amb el nom, la descripció, la categoria, les notes, el preu, les coordenades, la foto i les etiquetes. A la col·lecció no hi canvia res.',
  'help.guide.copy-to-trip.tip.1':
    'Els lectors d’una llista compartida també ho poden fer. Es copien els llocs de la llista i la llista no canvia.',
  // share-list
  'help.guide.share-list.title': 'Compartir una llista amb algú',
  'help.guide.share-list.goal': "Planifica una llista en directe juntament amb altres persones d'aquest TREK.",
  'help.guide.share-list.step.1': 'Fes clic a «Compartir» a la capçalera de la llista.',
  'help.guide.share-list.step.2': "Tria l'usuari i un rol: «Lector», «Editor» o «Administrador».",
  'help.guide.share-list.step.3':
    'Fes clic a «Envia la invitació». La persona apareix com a pendent fins que accepta la invitació des del seu carril de llistes o des de la notificació.',
  'help.guide.share-list.result':
    'Quan accepten, la llista els apareix a «Compartit» i tots els canvis se sincronitzen en directe. Pots continuar editant els membres i els seus rols des del mateix diàleg.',
  'help.guide.share-list.tip.1':
    'Els lectors poden consultar llocs, valorar-los i copiar-los als seus propis viatges. Els editors afegeixen i editen llocs i etiquetes. Els administradors, a més, poden moure i eliminar.',
  'help.guide.share-list.tip.2':
    'Només el propietari pot convidar i treure persones; un membre pot abandonar una llista compartida pel seu compte.',
  // export-list
  'help.guide.export-list.title': 'Exportar una llista a un fitxer',
  'help.guide.export-list.goal':
    "Passa una llista a algú d'un altre servidor TREK, o obre-la en una aplicació de mapes.",
  'help.guide.export-list.step.1': 'Fes clic a «Exporta», a la capçalera de la llista.',
  'help.guide.export-list.step.2':
    'Tria «Llista del TREK» per fer servir la llista en un altre TREK, amb etiquetes i estat, o GPX per a OsmAnd, Organic Maps, un Garmin i altres apps que llegeixen punts de pas.',
  'help.guide.export-list.result': 'El fitxer es baixa. Qualsevol membre d’una llista compartida la pot exportar.',
  'help.guide.export-list.tip.1':
    "Un lloc sense coordenades no pot ser un punt de referència GPX: queda fora i TREK t'indica quants n'han quedat fora.",
  'help.guide.export-list.tip.2':
    "Les valoracions, els membres i les fotos pujades no s'exporten, i és expressament així: pertanyen a aquest TREK, no a la llista.",
  // import-file
  'help.guide.import-file.title': 'Importar una llista des d’un fitxer',
  'help.guide.import-file.goal':
    'Importa un fitxer de llista de TREK o un fitxer GPX, com a llista nova o en una llista existent.',
  'help.guide.import-file.step.1':
    "Fes clic al botó d'importar amb la fletxa de pujada, al costat de «Nova llista», al carril de llistes.",
  'help.guide.import-file.step.2':
    'Tria el fitxer. Abans d’importar res, TREK et mostra què conté: el nom, quants llocs i quantes etiquetes.',
  'help.guide.import-file.step.3':
    "Deixa «Nova llista» i canvia'n el nom si vols, i fes clic a «Importa». O bé tria «Afegir a una llista» per posar els llocs en una llista que puguis editar, i fes clic a «Afegeix a la llista».",
  'help.guide.import-file.result':
    'La llista s’obre amb els llocs importats. Importar a una llista només hi afegeix llocs. Els que ja hi eren mantenen l’estat, les notes i les etiquetes.',
  'help.guide.import-file.tip.1':
    "D'un GPX, cada punt de referència amb nom es converteix en un lloc. Les traces són línies i queden fora; la previsualització indica quants punts eren.",
  'help.guide.import-file.tip.2':
    "Si el fitxer no és ni una «Llista del TREK» ni un GPX, es rebutja i TREK n'indica el motiu. Si no es pot llegir un lloc concret, només se salta aquell lloc, no tot el fitxer.",
  // edit-list
  'help.guide.edit-list.title': 'Editar o eliminar una llista',
  'help.guide.edit-list.goal':
    "Canvia el nom, el color, la portada, la descripció o els enllaços d'una llista, o elimina-la.",
  'help.guide.edit-list.step.1': 'Fes clic a «Edita», a la capçalera de la llista. Només el propietari ho veu.',
  'help.guide.edit-list.step.2':
    "Canvia el que vulguis i fes clic a «Desa». La icona de la paperera de baix a l'esquerra, «Eliminar llista», elimina la llista i tots els seus llocs un cop ho confirmes.",
  'help.guide.edit-list.result': 'La capçalera de dalt mostra de seguida el nou color, la portada i la descripció.',
  'help.guide.edit-list.tip.1':
    'Eliminar una llista no es pot desfer. Si en vols conservar una còpia, exporta-la abans.',
  // all-saved
  'help.guide.all-saved.title': 'Cercar a tota la teva biblioteca',
  'help.guide.all-saved.goal': 'Consulta d’un cop els llocs de totes les teves llistes.',
  'help.guide.all-saved.step.1':
    'Fes clic a «Tot el desat» al carril de llistes. Mostra en una sola vista els llocs de totes les llistes de les quals ets propietari o copropietari.',
  'help.guide.all-saved.step.2':
    'Escriu a «Cerca llocs», sobre el mapa, i fes servir els filtres com en qualsevol llista. «Triar» també funciona aquí: moure, duplicar, copiar a un viatge o eliminar en diverses llistes alhora.',
  'help.guide.all-saved.result':
    'Aquesta vista mostra tots els teus llocs desats junts. Aquí no pots afegir ni importar llocs, perquè no hi ha cap llista concreta on posar-los.',
  'help.guide.all-saved.tip.1':
    "Les etiquetes i les excursions desades pertanyen a una sola llista, així que cap de les dues no s'ofereix a «Tot el desat».",

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Travessia',
  'help.ctx.journey.summary':
    "«Travessia» és el teu diari de viatge centrat en les fotos. Cada travessia està vinculada a un o més viatges, i l'omples dia a dia amb entrades que tenen història, fotos, estat d'ànim i temps. Aquesta pantalla mostra les teves travessies; obre'n una per escriure.",
  'help.ctx.journey.bullet.1':
    "El bàner de dalt mostra la travessia en curs, o la més recent, amb el recompte d'entrades, fotos i llocs. «Continua escrivint» l'obre al dia d'avui. Quan un viatge acaba de terminar, un bàner «El viatge acaba de terminar» a sobre et proposa convertir-lo en una travessia.",
  'help.ctx.journey.bullet.2':
    "Sota «Totes les travesies», una targeta per travessia amb la portada, l'estat, les dates i els recomptes; la travessia que surt al bàner no s'hi repeteix. Fes clic a una targeta per obrir-la.",
  'help.ctx.journey.bullet.3':
    'L’última targeta de la graella, «Crea una travesia nova», en crea una a partir dels teus viatges.',
  // create-journey
  'help.guide.create-journey.title': 'Crear una travesia',
  'help.guide.create-journey.goal':
    'Comença un diari per a un viatge, amb els llocs del viatge ja afegits com a suggeriments.',
  'help.guide.create-journey.step.1': 'Fes clic a «Crea una travesia nova», l’última targeta de la graella.',
  'help.guide.create-journey.step.2':
    'Posa-li un nom i, si vols, un subtítol, i marca els viatges que en formen part. El comptador indica quants llocs s’hi afegiran.',
  'help.guide.create-journey.step.3': 'Fes clic a «Crea una travesia».',
  'help.guide.create-journey.result':
    "S'obre el diari. Cada lloc dels viatges vinculats apareix a la cronologia com a suggeriment, una vegada per cada dia en què està planificat. Pots escriure una entrada per a cadascun.",
  'help.guide.create-journey.tip.1': 'Més endavant pots vincular-hi més viatges des de «Configuració de la travesia».',
  'help.guide.create-journey.tip.2':
    'També pots crear una travessia sense viatges; llavors hi afegeixes les entrades a mà.',
  // open-journey
  'help.guide.open-journey.title': 'Obrir una travessia',
  'help.guide.open-journey.goal': 'Obre un diari i mira per on s’obre.',
  'help.guide.open-journey.step.1':
    'Fes clic en una targeta. Cada targeta mostra la portada, les dates i quantes entrades, fotos i llocs té la travessia.',
  'help.guide.open-journey.result':
    "Una travessia en curs s'obre al dia d'avui, o a l'última entrada anterior si encara no has escrit res avui. Una travessia acabada s'obre pel principi.",
  'help.guide.open-journey.tip.1':
    'La portada és la primera foto de la travessia, tret que en triïs una a «Configuració de la travesia».',
  // continue-writing
  'help.guide.continue-writing.title': 'Continuar la travessia en curs',
  'help.guide.continue-writing.goal': "Obre directament la pàgina d'avui de la travesia que estàs fent.",
  'help.guide.continue-writing.step.1':
    "Fes clic a «Continua escrivint» al bàner de dalt. Hi surt la travessia que tens en curs o, si no n'hi ha cap, la més recent.",
  'help.guide.continue-writing.result':
    'El diari s’obre pel dia d’avui o, si encara no hi has escrit res, per l’última entrada anterior a avui.',
  'help.guide.continue-writing.tip.1':
    "Quan un viatge acaba de terminar, a sobre d'aquest bàner apareix el bàner «El viatge acaba de terminar»: «Crea una travesia» comença una travessia amb aquest viatge marcat, i «Descarta» amaga l'oferta en aquest navegador.",

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diari',
  'help.ctx.journey-detail.summary':
    "Una travessia oberta: la cronologia a l'esquerra, dia a dia, i el mapa a la dreta amb capes que pots activar per al pla, el que has enregistrat, les entrades i les fotos. La capçalera mostra els recomptes, Studio, l'interruptor de suggeriments i ⋯ per a «Configuració de la travesia». Fes servir la barra d'eines de sota per afegir entrades.",
  'help.ctx.journey-detail.bullet.1':
    "Capçalera: fletxa per tornar enrere i insígnia d'estat, portada, títol i subtítol, els recomptes de dies, llocs, entrades i fotos i, a la dreta, Studio, l'ull que amaga o mostra els suggeriments i ⋯ per a «Configuració de la travesia».",
  'help.ctx.journey-detail.bullet.2':
    "Barra d'eines: les pestanyes «Cronologia» i «Galeria», «Cerca en aquest viatge» i «Afegeix una entrada». A «Galeria», «Pujar» substitueix «Afegeix una entrada».",
  'help.ctx.journey-detail.bullet.3':
    "«Cronologia»: una secció per dia amb el número, el recompte de llocs i un + per afegir una entrada aquell dia. A sota, les targetes de les entrades amb fotos, estat d'ànim, temps i història, i les targetes de suggeriment discontínues dels viatges, cadascuna amb una × per descartar-la.",
  'help.ctx.journey-detail.bullet.4':
    'Mapa: la barra de capes de dalt alterna «Planificat» (xinxetes buides i les rutes GPX discontínues dels viatges), «Enregistrat» (rutes contínues desades de Dawarich), «Entrades» (xinxetes amb els colors dels dies, unides per ordre de data amb una línia fina discontínua) i «Fotos». La (i) del costat explica cada símbol.',
  'help.ctx.journey-detail.bullet.5':
    "«Configuració de la travesia» (⋯): portada, nom i subtítol, estat, traces GPX, dies enregistrats, llocs a partir de les fotos, camps de les entrades, suggeriments descartats, viatges sincronitzats, col·laboradors i quins membres d'un viatge hi tenen accés, compartició pública, arxivar i eliminar.",
  'help.ctx.journey-detail.bullet.6':
    "Al final d'una cronologia llarga hi ha «Torna a dalt», un comptador de dies que et porta a qualsevol dia o entrada, i «Ves a l’última entrada».",
  // add-entry
  'help.guide.add-entry.title': 'Escriure una entrada',
  'help.guide.add-entry.goal': "Afegeix la història d'un dia amb títol, text, estat d'ànim i temps.",
  'help.guide.add-entry.step.1':
    "Fes clic a «Afegeix una entrada» a la barra d'eines, o al + de l'extrem dret de la capçalera d'un dia per començar en aquell dia.",
  'help.guide.add-entry.step.2':
    'Posa un títol a l’entrada i escriu el text. La barra d’eines de sobre el text afegeix negreta, cursiva, títols, cites, enllaços i llistes en Markdown.',
  'help.guide.add-entry.step.3':
    "A la columna de la dreta, comprova la data i l'hora, busca una ubicació o fes servir la teva posició actual, i tria un estat d'ànim i el temps que feia.",
  'help.guide.add-entry.step.4': 'Fes clic a «Desa».',
  'help.guide.add-entry.result':
    'L’entrada apareix al seu dia de la cronologia i com a xinxeta al mapa. Els comptadors de la capçalera s’actualitzen.',
  'help.guide.add-entry.tip.1':
    "Quan escrius a partir d'un suggeriment, fas servir el mateix editor, amb el lloc ja indicat.",
  'help.guide.add-entry.tip.2':
    "Una entrada amb lloc té l'opció «Deixa fora de la ruta»: l'entrada es queda al diari, però no compta per a la distància ni per als països i no apareix al mapa de Studio.",
  // entry-photos
  'help.guide.entry-photos.title': 'Afegir fotos i vídeos a una entrada',
  'help.guide.entry-photos.goal': "Afegeix fotos a un dia; la primera passa a ser la portada de l'entrada.",
  'help.guide.entry-photos.step.1': "Obre el menú d'una entrada amb el ⋯ de la seva targeta i tria «Edita».",
  'help.guide.entry-photos.step.2':
    'Fes clic a «Puja fotos» i tria els fitxers. «Des de la galeria» agafa fotos que ja són a la galeria de la travessia; «External photos» cerca les d’aquell dia en una biblioteca connectada d’Immich o Synology.',
  'help.guide.entry-photos.step.3':
    "Passa el ratolí per sobre d'una imatge i fes clic a «Fes 1r» per triar la portada; després fes clic a «Desa».",
  'help.guide.entry-photos.result':
    'Les fotos es veuen a la targeta i a la galeria; la primera fa de miniatura a tot arreu.',
  'help.guide.entry-photos.tip.1':
    "Els vídeos s'afegeixen a una entrada de la mateixa manera: mp4, m4v, webm o mov de fins a 500 MB. Es desen sense cap canvi.",
  'help.guide.entry-photos.tip.2':
    'Els fitxers HEIC d’un iPhone es converteixen a JPEG en pujar-los, i això n’elimina les metadades de GPS i de la càmera.',
  // suggestions
  'help.guide.suggestions.title': 'Fer servir o descartar els suggeriments',
  'help.guide.suggestions.goal':
    'Converteix en entrades els llocs dels teus viatges, i descarta aquells sobre els quals no escriuràs.',
  'help.guide.suggestions.step.1':
    "Un suggeriment és una targeta amb vora discontínua i un botó «Afegeix una entrada»: un lloc d'un viatge vinculat, el dia en què estava planificat. Fes-hi clic per obrir l'editor amb el lloc i el dia ja definits.",
  'help.guide.suggestions.step.2':
    "Fes clic a la × de l'extrem dret d'una targeta que no faràs servir. La targeta desapareix de la cronologia però no s'elimina, i la sincronització del viatge no la tornarà a suggerir.",
  'help.guide.suggestions.step.3':
    "Has canviat d'idea? Obre «Configuració de la travesia» amb ⋯ a la capçalera: «Recupera els suggeriments descartats» indica quants n'hi ha i els recupera tots.",
  'help.guide.suggestions.result':
    "La línia de temps només mostra les entrades que vols escriure. La icona de l'ull de la capçalera amaga tots els suggeriments alhora mentre llegeixes.",
  'help.guide.suggestions.tip.1': 'Un lloc planificat en dos dies genera un suggeriment a cadascun d’aquests dies.',
  'help.guide.suggestions.tip.2':
    'Els suggeriments no compten mai a les estadístiques; només hi compten les entrades escrites.',
  // add-on-day
  'help.guide.add-on-day.title': 'Afegir una entrada en un dia anterior',
  'help.guide.add-on-day.goal': 'Escriu sobre un dia passat sense haver de canviar la data després.',
  'help.guide.add-on-day.step.1': "Fes clic al + de l'extrem dret de la capçalera d'aquell dia.",
  'help.guide.add-on-day.step.2': 'L’editor s’obre amb aquella data ja posada. Escriu i fes clic a «Desa» com sempre.',
  'help.guide.add-on-day.result': "L'entrada s'afegeix al dia correcte a l'instant.",
  'help.guide.add-on-day.tip.1':
    "Per canviar l'ordre dins d'un dia, passa el ratolí per sobre d'una entrada: a l'esquerra hi apareixen «Puja» i «Baixa».",
  // pros-cons
  'help.guide.pros-cons.title': 'Afegir un veredicte',
  'help.guide.pros-cons.goal': 'Resumeix un dia amb el que va anar molt bé i el que no.',
  'help.guide.pros-cons.step.1':
    "A l'editor, busca «Pros i contres» sota el relat. Escriu un punt a «Pros» o «Contres» i fes servir «Afegeix-ne un altre» per al següent.",
  'help.guide.pros-cons.step.2':
    'Desa. A la targeta, «Veure més» mostra la història i el veredicte en dues llistes breus.',
  'help.guide.pros-cons.result': 'El polze amunt i el polze avall apareixen sota el relat, on els veus d’un cop d’ull.',
  'help.guide.pros-cons.tip.1':
    "Si una travessia no fa servir valoracions finals, pots desactivar la secció a «Camps de l'entrada», dins de «Configuració de la travesia».",
  // search-journey
  'help.guide.search-journey.title': 'Trobar alguna cosa en un diari llarg',
  'help.guide.search-journey.goal': "Troba una entrada sense haver de desplaçar-te per setmanes d'entrades.",
  'help.guide.search-journey.step.1':
    "Escriu a «Cerca en aquest viatge», a la barra d'eines. La cronologia es filtra mentre escrius, per títols, històries, llocs i etiquetes. No importen els accents ni les majúscules.",
  'help.guide.search-journey.step.2':
    'Si prefereixes saltar a un dia, fes clic al comptador de dies de la part de baix de la cronologia, entre «Torna a dalt» i «Ves a l’última entrada».',
  'help.guide.search-journey.result':
    "La cronologia es desplaça fins al dia o l'entrada que has triat, i el mapa s'hi mou. Només es mostren les entrades que coincideixen fins que esborres el quadre de cerca.",
  'help.guide.search-journey.tip.1':
    'Una travessia en curs s’obre a la pàgina d’avui, així que normalment ja tens a la vista la pàgina actual.',
  'help.guide.search-journey.tip.2':
    "L'ull de la capçalera amaga els suggeriments, perquè només vegis les entrades que has escrit.",
  // gallery-map
  'help.guide.gallery-map.title': 'Explorar la galeria i el mapa',
  'help.guide.gallery-map.goal': 'Mira tota la travessia en imatges i com a llocs al mapa.',
  'help.guide.gallery-map.step.1':
    'Canvia a «Galeria» a la barra d’eines. Hi ha totes les fotos de totes les entrades, més les imatges pujades directament a la galeria. Fes clic en una per obrir-la al visor.',
  'help.guide.gallery-map.step.2':
    '«Pujar», a la dreta, afegeix imatges a la galeria. Si tens Immich o Synology connectat, un botó amb el nom de la biblioteca et permet triar-ne imatges.',
  'help.guide.gallery-map.result':
    "Les xinxetes tenen el color del seu dia i s'uneixen per ordre de data amb una línia fina discontínua. La barra de capes de dalt del mapa canvia què s'hi dibuixa.",
  'help.guide.gallery-map.tip.1':
    "Les traces GPX d'un viatge es mostren a la capa «Planificat» del mapa com a línies discontínues. «Mostra totes les traces GPX dels viatges», a «Configuració de la travesia», les desactiva.",
  'help.guide.gallery-map.tip.2':
    'Les fotos de la galeria que tenen ubicació també surten al mapa públic, si comparteixes tant «Galeria» com «Mapa».',
  // entry-fields
  'help.guide.entry-fields.title': 'Desactivar camps de les entrades',
  'help.guide.entry-fields.goal': "Mostra a l'editor només els camps que fa servir aquesta travessia.",
  'help.guide.entry-fields.step.1':
    'Fes clic a ⋯, a dalt a la dreta de la capçalera, per obrir «Configuració de la travesia».',
  'help.guide.entry-fields.step.2': "A «Camps de l'entrada», desactiva «Estat d'ànim», «Clima» o «Pros i contres».",
  'help.guide.entry-fields.result':
    "L'editor deixa de mostrar aquests camps. No es perd res del que has escrit: quan tornes a activar un camp, els valors desats tornen a aparèixer. Una travessia compartida amaga els mateixos camps.",
  'help.guide.entry-fields.tip.1':
    'Els interruptors van per travesia, així que un viatge de feina i unes vacances poden tenir una configuració diferent.',
  // link-trip
  'help.guide.link-trip.title': 'Vincular un altre viatge',
  'help.guide.link-trip.goal': 'Afegeix els llocs d’un segon viatge al diari com a suggeriments.',
  'help.guide.link-trip.step.1':
    'Fes clic a ⋯, a dalt a la dreta de la capçalera, per obrir «Configuració de la travesia».',
  'help.guide.link-trip.step.2': 'A «Viatges sincronitzats», fes clic a «Afegeix un viatge».',
  'help.guide.link-trip.step.3': 'Busca el viatge pel nom o la destinació i fes clic a «Vincula», al costat.',
  'help.guide.link-trip.result':
    "Els seus llocs apareixen a la cronologia com a suggeriments als dies corresponents, i s'afegeixen a la capa «Planificat» del mapa amb les seves traces GPX.",
  'help.guide.link-trip.tip.1':
    "La paperera del costat d'un viatge vinculat el desvincula després de demanar-te confirmació; les entrades que has escrit es mantenen.",
  'help.guide.link-trip.tip.2':
    "Les entrades d'un dia només compten una vegada, encara que aquell dia formi part de diversos viatges.",
  // share-public
  'help.guide.share-public.title': 'Compartir la travessia públicament',
  'help.guide.share-public.goal': 'Dona un enllaç de només lectura a persones que no tenen compte a TREK.',
  'help.guide.share-public.step.1':
    "Obre «Configuració de la travesia» amb ⋯ a la capçalera i desplaça't fins a «Compartició pública».",
  'help.guide.share-public.step.2': 'Fes clic a «Crea un enllaç per compartir».',
  'help.guide.share-public.step.3':
    "Tria què veuen els visitants: «Cronologia», «Galeria» i «Mapa». A «Mapa», «Pla del viatge» hi afegeix els llocs i les rutes planificats, i «Rutes enregistrades», les rutes dels dies que has enregistrat. «Copiar» copia l'enllaç al porta-retalls.",
  'help.guide.share-public.result':
    "Qui tingui l'enllaç veu les seccions activades i res més; els camps que has desactivat a «Camps de l'entrada» també hi queden amagats.",
  'help.guide.share-public.tip.1':
    'Les fotos només apareixen al mapa públic quan «Galeria» i «Mapa» estan activats. Amb «Mapa» desactivat, el servidor n’elimina les coordenades abans d’enviar les fotos.',
  'help.guide.share-public.tip.2': "Fes clic a «Suprimeix l'enllaç», al costat de «Copiar», per deixar de compartir.",
  // contributors
  'help.guide.contributors.title': 'Escriure en companyia',
  'help.guide.contributors.goal': 'Deixa que un altre viatger afegeixi les seves entrades i fotos.',
  'help.guide.contributors.step.1': 'Obre «Configuració de la travesia» amb ⋯ a la capçalera i busca «Col·laboradors».',
  'help.guide.contributors.step.2':
    'Fes clic a «Convida un col·laborador» i cerca l’usuari pel nom o pel correu electrònic.',
  'help.guide.contributors.step.3': 'Tria «Lector» o «Editor» i fes clic a «Convida».',
  'help.guide.contributors.result':
    'La travessia apareix a la seva llista i les seves entrades mostren el seu nom. Per treure un col·laborador, fes clic a la × del costat.',
  'help.guide.contributors.tip.1':
    "Els col·laboradors són per a persones d'aquest TREK. Per a la resta hi ha l'enllaç públic.",
  // studio
  'help.guide.studio.title': 'Maquetar la travessia com un àlbum de fotos',
  'help.guide.studio.goal': 'Converteix el diari en pàgines per imprimir.',
  'help.guide.studio.step.1': "Fes clic a Studio a la capçalera. El dissenyador s'obre a sobre de la travessia.",
  'help.guide.studio.step.2': "Per tornar enrere, fes clic a × a l'extrem dret de la barra superior. Tornaràs on eres.",
  'help.guide.studio.result':
    "La columna i els seus tauler són a l'esquerra, la doble pàgina és a la taula de treball i les propietats són a la dreta. Disseny automàtic crea el llibre a partir de les entrades. Exporta crea un PDF a punt per imprimir.",
  'help.guide.studio.tip.1':
    'L’Estudi necessita una finestra d’almenys 1024 px d’amplada i no està disponible al mòbil.',
  'help.guide.studio.tip.2':
    'El llibre té el mateix accés que la travessia: qui pot llegir la travessia pot obrir el llibre, i qui pot editar la travessia el pot desar.',
  // archive-journey
  'help.guide.archive-journey.title': 'Arxivar o eliminar una travessia',
  'help.guide.archive-journey.goal': 'Tanca una travesia acabada o elimina-la per sempre.',
  'help.guide.archive-journey.step.1':
    'Fes clic a ⋯, a dalt a la dreta de la capçalera, per obrir «Configuració de la travesia».',
  'help.guide.archive-journey.step.2':
    "A baix de tot, «Arxiva el viatge» la dona per acabada i la marca com a arxivada; «Restaura el viatge» la recupera. «Elimina» l'esborra amb totes les entrades i fotos, després de demanar-te confirmació.",
  'help.guide.archive-journey.result':
    "Una travessia arxivada continua sent llegible i es pot continuar compartint; només deixa d'obrir-se al dia d'avui.",
  'help.guide.archive-journey.tip.1': 'Eliminar-la no es pot desfer, i no canvia els viatges que hi estaven vinculats.',
  'help.guide.archive-journey.tip.2': 'La portada, el nom i el subtítol són al mateix diàleg, a la part de dalt.',
  'help.guide.journey-status.title': "Definir l'estat d'una travessia",
  'help.guide.journey-status.goal':
    'Marca tu mateix una travessia com a esborrany, en directe o completada, en lloc de seguir les dates dels seus viatges.',
  'help.guide.journey-status.step.1':
    'Fes clic a ⋯, a dalt a la dreta de la capçalera de la travessia, per obrir «Configuració de la travesia».',
  'help.guide.journey-status.step.2':
    "A «Estat», tria «Esborrany», «En viu» o «Completat». L'opció es desa a l'instant.",
  'help.guide.journey-status.result':
    "La travessia conserva l'estat que has triat: «Esborrany» i «Completat» apareixen com a insígnia a la seva targeta i a la capçalera, i una travessia «En viu» es mostra al bàner de dalt de la llista de travessies.",
  'help.guide.journey-status.tip.1':
    '«Automàtic» torna a fer servir les dates dels viatges vinculats. Si no hi ha cap viatge vinculat, una travessia automàtica es queda com a esborrany.',
  'help.guide.journey-status.tip.2':
    'Un estat que poses a mà es manté fins que el canvies, encara que canviïn les dates del viatge.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    "TREK Studio maqueta una travessia com un àlbum de fotos que pots imprimir. S'obre a sobre del diari: la columna i els seus tauler són a l'esquerra, la doble pàgina en què treballes és al mig i les propietats són a la dreta. Disseny automàtic crea un primer esborrany a partir de les entrades, un tema dona al llibre els colors i les tipografies, i l'assistent pot dissenyar pàgines amb tu. Després pots moure, retallar i canviar l'estil de tot, i pots desfer cada pas.",
  'help.ctx.journey-studio.bullet.1':
    "Barra superior: a l'esquerra, la coberta i el nom de la travessia. A la dreta, qui més és al llibre i si està desat, el format de pàgina, desfés, refés i enganxa, Disseny automàtic, l'assistent, l'ajuda, Exporta i el botó que tanca Studio.",
  'help.ctx.journey-studio.bullet.2':
    "Columna de l'esquerra: Pàgines, Contingut (les fotos i entrades de la travessia), Maquetacions, Elements (text, formes, línies, marcs, icones i adhesius), Viatge (xifres, mapes, països i marques fets a partir de la travessia) i, apartats a sota, Tema i Capes.",
  'help.ctx.journey-studio.bullet.3':
    'Taula de treball: la doble pàgina actual amb el sagnat i els marges de seguretat, i a sota la barra de zoom amb Ajusta a la vista, Vista de llibre i Baixa aquesta doble pàgina.',
  'help.ctx.journey-studio.bullet.4':
    "Propietats a la dreta: tot sobre l'element seleccionat, de la posició, la mida i el retall als colors, els efectes, l'ordre d'apilament i el bloqueig. Quan no hi ha res seleccionat, mostra el fons de pàgina, el tema, els números de pàgina i el document.",
  'help.ctx.journey-studio.bullet.5':
    "El llibre es maqueta com un llibre imprès: coberta, una primera pàgina sola davant l'interior en blanc de la coberta, les dobles pàgines, una última pàgina sola i la contracoberta. Els números de pàgina compten des de la primera pàgina i s'imprimeixen tal com es veuen.",
  'help.ctx.journey-studio.bullet.6':
    'Diverses persones poden dissenyar alhora: tothom veu els punters dels altres amb el seu nom. Si deses una versió que algú altre ha modificat, TREK mostra un conflicte en lloc de sobreescriure-li la feina.',
  'help.ctx.journey-studio.bullet.7':
    'Tema: un aspecte per a tot el llibre, amb el seu paper, la seva tinta i tres accents, les seves tipografies i els seus motius. Els elements vinculats al tema el segueixen quan el canvies.',
  'help.ctx.journey-studio.bullet.8':
    "Assistent: allà on un administrador ha configurat la IA, el globus de la barra superior obre un assistent que maqueta pàgines, escriu peus de foto i canvia l'estil del llibre amb tu. Cada canvi que fa és un pas de desfer.",
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Crear l’àlbum automàticament',
  'help.guide.studio-auto-layout.goal':
    'Obtén amb un clic un primer esborrany complet a partir de les entrades i les fotos del diari.',
  'help.guide.studio-auto-layout.step.1': 'Fes clic a Auto layout a la barra superior.',
  'help.guide.studio-auto-layout.step.2':
    'Tria «Tot el llibre»: substitueix totes les pàgines i manté el títol i la configuració de pàgina. «Aquesta pàgina» només refà la doble pàgina que tens a la pantalla, i només apareix en una doble pàgina creada a partir d’una entrada.',
  'help.guide.studio-auto-layout.step.3':
    'Repassa la columna de pàgines. Si t’agradava més la versió anterior, «Desfer» reverteix tota la disposició.',
  'help.guide.studio-auto-layout.result':
    'Una doble pàgina per entrada, en ordre, amb les fotos, el títol i el text ja col·locats. Cada element queda vinculat a la seva entrada i s’hi actualitza fins que l’edites.',
  'help.guide.studio-auto-layout.tip.1':
    'Totes dues opcions són passos normals de desfer, així que les pots provar i desfer.',
  'help.guide.studio-auto-layout.tip.2':
    "Quan la composició automàtica vincula un element a una entrada, l'element s'actualitza quan edites aquella entrada. Si canvies l'element a «Properties», el vincle desapareix.",
  // studio-pages
  'help.guide.studio-pages.title': 'Afegir, moure i treure dobles pàgines',
  'help.guide.studio-pages.goal': 'Edita el llibre pàgina per pàgina.',
  'help.guide.studio-pages.step.1':
    "Obre Pàgines a la columna. Les miniatures mostren el llibre per ordre: coberta, primera pàgina, dobles pàgines, última pàgina i contracoberta. La primera i la última pàgina es dibuixen al costat de l'interior en blanc de la seva coberta, tal com s'obre el llibre enquadernat.",
  'help.guide.studio-pages.step.2':
    '«Afegeix una pàgina», a la part de baix, afegeix una doble pàgina nova abans de l’última pàgina. El + entre dues miniatures n’insereix una en aquella posició.',
  'help.guide.studio-pages.step.3':
    "Passa el ratolí per una miniatura per veure'n les accions: «Mou abans», «Mou després», «Duplica la pàgina» i «Elimina la pàgina». Fes clic a una miniatura per obrir aquella doble pàgina a la taula de treball.",
  'help.guide.studio-pages.result':
    "La coberta, la primera i l'última pàgina i la contracoberta no es mouen. Les dobles pàgines noves sempre s'afegeixen entremig.",
  'help.guide.studio-pages.tip.1':
    "«Book view», a la barra superior, mostra tot el llibre en fulls, tal com s'enquadernarà.",
  'help.guide.studio-pages.tip.2':
    'Els números de pàgina s’activen a «Document», dins de «Properties», sense res seleccionat.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Aplicar un layout a una doble pàgina',
  'help.guide.studio-layouts.goal': 'Aplica a una doble pàgina una distribució predefinida de marcs de foto i de text.',
  'help.guide.studio-layouts.step.1':
    "Obre Maquetacions a la columna. Primer hi ha les pàgines dissenyades: cobertes i dobles pàgines senceres amb el tema del llibre, que els botons d'estil redueixen a un sol aspecte. Les Les meves disposicions i les Predefinides vénen a continuació, a la mateixa quadrícula.",
  'help.guide.studio-layouts.step.2':
    "Fes clic en una. La doble pàgina de la taula de treball rep els marcs d'aquesta composició, i les fotos i el text que ja hi tenies s'hi col·loquen.",
  'help.guide.studio-layouts.result':
    'Els marcs buits reserven lloc per al contingut: arrossega-hi una foto des de «Contingut» o fes servir «Add to this page».',
  'help.guide.studio-my-layouts.title': 'Desar una pàgina com a disposició pròpia',
  'help.guide.studio-my-layouts.goal': 'Reutilitza una disposició que has fet en altres pàgines del llibre.',
  'help.guide.studio-my-layouts.step.1':
    "Organitza una pàgina com més t'agradi i després obre Maquetacions a la columna.",
  'help.guide.studio-my-layouts.step.2':
    'Fes clic a Desa aquesta pàgina com a disposició sota Les meves disposicions. La pàgina apareix com una targeta a la llista.',
  'help.guide.studio-my-layouts.tip.1':
    'Fes clic a la teva disposició en una altra pàgina per maquetar-la igual, amb les seves fotos i textos.',
  'help.guide.studio-my-layouts.result':
    "Les teves disposicions es desen amb el llibre i s'ofereixen en pàgines del mateix tipus: les d'una coberta per a cobertes, les d'una doble pàgina per a dobles pàgines.",
  'help.guide.studio-layouts.tip.1': 'Una composició és un pas de desfer com qualsevol altre.',
  // studio-content
  'help.guide.studio-content.title': 'Posar fotos i entrades en una pàgina',
  'help.guide.studio-content.goal': 'Afegeix a la doble pàgina les fotos i entrades de la mateixa travessia.',
  'help.guide.studio-content.step.1':
    'Obre «Content» a la barra lateral. A «Photos» hi ha totes les imatges de la travessia, i a «Entries», les entrades amb el seu text.',
  'help.guide.studio-content.step.2':
    "Arrossega una foto sobre la doble pàgina o sobre un marc buit, o fes clic a «Afegeix a aquesta pàgina», a sota. «Puja fotos» afegeix imatges que encara no són a la travessia; «From Immich» o «From Synology» les tria d'una biblioteca connectada.",
  'help.guide.studio-content.step.3':
    'Sota una entrada, «Títol», «Història» i «Lloc» posen aquest text a la pàgina com a element de text. La data i les coordenades s’afegeixen com a marques, i també hi trobes les fotos de l’entrada.',
  'help.guide.studio-content.result':
    'Una foto que hi deixes anar es converteix en un element de foto. El text continua vinculat a l’entrada fins que l’edites.',
  'help.guide.studio-theme.title': 'Donar un tema al llibre',
  'help.guide.studio-theme.goal': "Defineix els colors i les tipografies de tot el llibre d'un sol cop.",
  'help.guide.studio-theme.step.1':
    "Obre Tema a la columna. Cada targeta mostra un tema com una pàgina petita: el seu paper, la seva tipografia i els seus tres colors d'accent.",
  'help.guide.studio-theme.step.2':
    'Fes clic en un tema per provar-lo. Sota les targetes pots canviar-ne la paleta, triar altres tipografies i escollir motius i decoració.',
  'help.guide.studio-theme.step.3':
    'Fes clic a Aplicar al llibre, o a Aplicar a aquesta pàgina per a la doble pàgina en pantalla.',
  'help.guide.studio-theme.tip.1':
    'Els elements vinculats al tema en prenen els colors i les tipografies i el segueixen quan el canvies. Reestilitzar també el que encara no està vinculat vincula primer la resta.',
  'help.guide.studio-theme.tip.2': 'Colors de les fotos crea una paleta a partir de les imatges de la travessia.',
  'help.guide.studio-theme.result':
    'Tots els colors i tipografies vinculats del llibre canvien alhora, i aplicar el tema és un sol pas de desfer.',
  'help.guide.studio-content.tip.1': 'El quadre de cerca de dalt de «Contingut» filtra totes dues llistes.',
  'help.guide.studio-content.tip.2':
    "Quan deixes anar un fitxer de l'escriptori a la taula de treball, TREK el puja i el col·loca d'un sol cop.",
  // studio-elements
  'help.guide.studio-elements.title': 'Afegir text, formes, icones i adhesius',
  'help.guide.studio-elements.goal': 'Decora una doble pàgina amb més coses a part de fotos i textos.',
  'help.guide.studio-elements.step.1':
    'Obre Elements a la columna. Sis pestanyes ordenen el que pots afegir: Text, Formes, Línies, Marcs, Icones i Adhesius.',
  'help.guide.studio-elements.step.2':
    'Fes clic en un estil de text o en un títol dissenyat, una forma, una línia, un marc buit, una icona o un adhesiu. Cadascun es col·loca al mig de la doble pàgina, i després el pots moure.',
  'help.guide.studio-elements.result':
    "Fes doble clic en un element de text per escriure-hi; «Properties» conté el tipus de lletra, el gruix, la mida, l'espaiat i l'alineació.",
  'help.guide.studio-stickers.title': 'Decorar amb adhesius',
  'help.guide.studio-stickers.goal': 'Afegeix il·lustracions, de monuments i menjar a animals i fletxes.',
  'help.guide.studio-stickers.step.1': 'Obre Elements a la columna i tria Adhesius.',
  'help.guide.studio-stickers.step.2':
    'Cerca una paraula o mira els prestatges, i fes clic en un adhesiu per posar-lo a la doble pàgina.',
  'help.guide.studio-stickers.tip.1':
    "Amb un adhesiu seleccionat, Propietats en canvia el color de les parts i l'emmiralla.",
  'help.guide.studio-stickers.result': "L'adhesiu és un dibuix, així que es veu nítid en qualsevol mida.",
  'help.guide.studio-elements.tip.1':
    'Els marcs són espais buits per a fotos: hi pots deixar anar una imatge més endavant.',
  // studio-travel
  'help.guide.studio-travel.title': 'Afegir mapes, xifres, països i marques',
  'help.guide.studio-travel.goal': 'Converteix la mateixa travessia en elements dissenyats a la pàgina.',
  'help.guide.studio-travel.step.1':
    'Obre Viatge a la columna. Quatre pestanyes ordenen el que pots afegir: Xifres, Mapes, Països i Marques.',
  'help.guide.studio-travel.step.2':
    "Cada targeta mostra l'element amb les xifres de la teva travessia, amb els colors del tema: un resum com a cartell, bitllet, senyal de carretera o comptaquilòmetres, un mapa amb parades numerades o retallat a un país, un país com a segell, postal o xinxeta, una data o una distància com a segell, etiqueta o cinta.",
  'help.guide.studio-travel.step.3':
    "Fes clic en una targeta. L'element es col·loca al mig de la doble pàgina, i després el pots moure i canviar-ne la mida.",
  'help.guide.studio-travel.result':
    "L'element apareix a la doble pàgina. Propietats en canvia l'aspecte, i cada xifra, mapa i país s'actualitza quan canvia la travessia.",
  'help.guide.studio-text-effects.title': 'Afegir efectes al text',
  'help.guide.studio-text-effects.goal':
    'Dona a un títol un contorn, una ombra, una corba o lletres emplenades amb un patró.',
  'help.guide.studio-text-effects.step.1': 'Fes clic en un element de text de la pàgina per seleccionar-lo.',
  'help.guide.studio-text-effects.step.2':
    "A Propietats, obre Efectes per afegir un contorn, una ombra o un ressaltat, o emplenar les lletres amb un degradat o un patró. Majúscules i posició corba la línia i l'ajusta al marc.",
  'help.guide.studio-text-effects.tip.1':
    "Ajusta al marc redueix el text fins que hi cap, així que un títol llarg mai no se'n surt.",
  'help.guide.studio-text-effects.result': "L'efecte es dibuixa amb el text, a la impressió igual que a la pantalla.",
  'help.guide.studio-background.title': 'Canviar el fons de la pàgina',
  'help.guide.studio-background.goal':
    'Pinta la pàgina amb un color, un degradat o un patró, o posa-hi una foto a sota.',
  'help.guide.studio-background.step.1':
    'Fes clic en una part buida de la pàgina perquè no hi hagi res seleccionat. Fons de pàgina és a dalt de Propietats.',
  'help.guide.studio-background.step.2':
    'Tria Paper, Sòlid, Degradat o Patró i un color, o fes clic en una foto a Foto de fons.',
  'help.guide.studio-background.tip.1':
    'Aplica a totes les pàgines dona a totes les pàgines del llibre el mateix fons.',
  'help.guide.studio-background.result':
    "El fons arriba fins al sagnat, així que s'imprimeix fins a la vora de la pàgina.",
  'help.guide.studio-layers.title': 'Ordenar, amagar i bloquejar amb capes',
  'help.guide.studio-layers.goal':
    "Mira tot el que hi ha a la doble pàgina per ordre d'apilament i treballa-ho allà mateix.",
  'help.guide.studio-layers.step.1': 'Obre Capes a la columna. La part de dalt de la llista és el davant de la pàgina.',
  'help.guide.studio-layers.step.2':
    "Arrossega una fila per reordenar-la, fes servir l'ull per amagar un element i el cadenat per mantenir-lo al seu lloc. Selecciona'n diversos i agrupa'ls per moure'ls junts.",
  'help.guide.studio-layers.tip.1': "Fes doble clic en una fila per donar a l'element un nom propi.",
  'help.guide.studio-layers.tip.2': 'Els elements amagats no surten al PDF.',
  'help.guide.studio-layers.result':
    "Les pàgines carregades continuen sent fàcils d'editar, i les parts acabades no es poden moure per error.",
  'help.guide.studio-travel.tip.1':
    "A Mapes, Parades llista totes les parades de la ruta. Desactiva'n una per deixar-la fora dels mapes i de les xifres, l'aeroport de casa per exemple.",
  'help.guide.studio-travel.tip.2':
    "Un mapa de país mostra només les parades d'aquell país, així que el país omple la pàgina encara que la travessia hagi començat amb un vol llarg.",
  // studio-properties
  'help.guide.studio-properties.title': 'Editar el que has seleccionat',
  'help.guide.studio-properties.goal': 'Mou, retalla, dona estil i ordena per capes un element amb l’inspector.',
  'help.guide.studio-properties.step.1':
    "Fes clic en un element de la doble pàgina. Apareixen tiradors per canviar-ne la mida i la rotació; arrossega'l per moure'l.",
  'help.guide.studio-properties.step.2':
    "Properties, a la dreta, mostra la configuració de l'element seleccionat: posició i mida, Crop amb el punt focal que decideix què queda dins del marc, Fill o Fit, els filtres de Look, Corner radius, Frame style, l'ordre d'apilament i Lock.",
  'help.guide.studio-properties.step.3':
    '«Duplica» i «Delete» són a dalt de l’inspector. Amb «Undo», a la barra superior, pots desfer qualsevol d’aquests canvis.',
  'help.guide.studio-properties.result':
    'Un element bloquejat no es pot seleccionar ni moure a la pàgina. Així protegeixes una composició acabada mentre treballes amb els altres elements.',
  'help.guide.studio-properties.tip.1':
    'Maj+clic selecciona diversos elements; llavors l’inspector els edita tots junts.',
  'help.guide.studio-properties.tip.2':
    "Si edites un element que ha col·locat la composició automàtica, deixa d'estar vinculat a l'entrada i ja no segueix els canvis que s'hi facin després.",
  // studio-format
  'help.guide.studio-format.title': 'Triar el format de pàgina',
  'help.guide.studio-format.goal': "Defineix la mida d'impressió del llibre abans de muntar el disseny.",
  'help.guide.studio-format.step.1':
    "Fes clic al format de pàgina de la barra superior, al costat de les eines d'edició. Mostra el nom i la forma del format.",
  'help.guide.studio-format.step.2':
    'Tria «Square 21 × 21 cm», «Square 30 × 30 cm», A4 o A5 en horitzontal o vertical, o introdueix una amplada i una alçada personalitzades en mil·límetres. El sagnat i el marge de seguretat són a sota.',
  'help.guide.studio-format.result':
    'Cada doble pàgina es dibuixa amb aquesta mida, amb 3 mm de sang i un marge de seguretat de 5 mm per defecte.',
  'help.guide.studio-format.tip.1':
    'Canvia primer el format i després aplica la disposició automàtica. La disposició automàtica fa servir el format que hi ha definit en el moment d’aplicar-la.',
  'help.guide.studio-format.tip.2':
    'Demana a la impremta els seus valors de sang i de marge de seguretat i introdueix-los.',
  // studio-export
  'help.guide.studio-export.title': 'Exportar l’àlbum en PDF',
  'help.guide.studio-export.goal': 'Obtén un fitxer a punt per imprimir o un per llegir en pantalla.',
  'help.guide.studio-export.step.1': 'Fes clic a «Exporta» a la barra superior.',
  'help.guide.studio-export.step.2':
    'Tria «Pàgines soltes», una pàgina per full en ordre de lectura, que és el que demana una impremta, o «Doble pàgina», dues pàgines alhora tal com s’obre el llibre. «Marques de tall» afegeix el sagnat a totes les vores i indica per on s’ha de tallar.',
  'help.guide.studio-export.step.3':
    'Fes clic a «Vista d’impressió». El navegador obre les pàgines. Tria «Desa com a PDF» per crear el fitxer.',
  'help.guide.studio-export.result':
    'Un PDF amb tants fulls com indicava el diàleg, en el format de pàgina que has triat.',
  'help.guide.studio-export.tip.1': "El PDF només es pot crear a l'ordinador, igual que Studio.",
  'help.guide.studio-export.tip.2':
    'Per a una prova, exporta «Doble pàgina» sense marques de tall; per a la impremta, «Pàgines soltes» amb marques.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Reutilitzar una doble pàgina en un altre llibre',
  'help.guide.studio-spread-file.goal': "Copia un disseny que t'agradi del llibre d'una travessia al d'una altra.",
  'help.guide.studio-spread-file.step.1':
    'Amb la doble pàgina a la taula de treball, fes clic a «Baixa aquesta doble pàgina», a l’extrem dret de la barra de zoom. El fitxer conté el disseny, no les fotos.',
  'help.guide.studio-spread-file.step.2':
    'A l’altre llibre, obre «Pàgines», fes clic a «Importa» al costat d’«Afegeix una pàgina» i tria el fitxer.',
  'help.guide.studio-spread-file.result':
    "La doble pàgina s'importa amb els seus marcs i els estils de text. Deixa anar les fotos de la nova travessia als marcs.",
  'help.guide.studio-spread-file.tip.1':
    "Si un fitxer no és un disseny de doble pàgina, TREK el rebutja i n'explica el motiu.",

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Configuració',
  'help.ctx.settings.summary':
    "La teva configuració personal, amb una pestanya per tema a la barra lateral de l'esquerra. La majoria d'interruptors s'apliquen tan bon punt els canvies. Un formulari amb botó «Desa» només es desa quan hi fas clic. Res del que hi ha aquí no canvia TREK per a ningú més.",
  'help.ctx.settings.bullet.1':
    "Barra lateral de l'esquerra: «Pantalla», «Aparença», «Mapa», «Notificacions», «Integracions», «Fora de línia» i «Compte». «Connectors» apareix quan hi ha algun connector actiu. «Quant a» apareix tret que l'operador l'hagi amagat. La versió es mostra a baix de tot.",
  'help.ctx.settings.bullet.2':
    "«Pantalla» s'obre primer. Inclou l'idioma, l'idioma dels noms de llocs, les unitats, el format d'hora, el primer dia de la setmana i la divisa de visualització, i també com es comporta el mapa del viatge. «Aparença» inclou el tema, els colors, la llegibilitat, la mida del text i els ginys del tauler.",
  'help.ctx.settings.bullet.3':
    '«Mapa» defineix el motor del mapa i el seu estil; «Notificacions», quins esdeveniments van a cada canal; «Integracions» connecta biblioteques de fotos, AirTrail, Dawarich i wanderer, i inclou les claus API i MCP; «Fora de línia» defineix què desa aquest dispositiu.',
  'help.ctx.settings.bullet.4':
    "«Compte» inclou el teu perfil, la contrasenya, l'autenticació de dos factors, les claus d'accés i l'opció d'eliminar el compte.",
  'help.ctx.settings-display.title': 'Pantalla',
  'help.ctx.settings-display.summary':
    "Amb què s'obre TREK, l'idioma i les unitats que fa servir, i com funcionen el mapa del viatge i les reserves. Cada canvi s'aplica a l'instant.",
  'help.ctx.settings-display.bullet.1':
    "«Inici»: «Pàgina d'inici» obre el «Tauler» o el «Viatge actiu»; amb «Viatge actiu», «Pestanya d'inici» tria la pestanya amb què s'obre aquell viatge.",
  'help.ctx.settings-display.bullet.2':
    "«Idioma i regió»: «Divisa de visualització» (o «Divisa del viatge» per no convertir), «Idioma», «Noms de llocs», «Unitat de temperatura», «Unitat de distància», «Format d'hora» i «La setmana comença el».",
  'help.ctx.settings-display.bullet.3':
    "«Viatge i mapa»: «Obre els llocs a», «Data primer als títols dels dies», «Etiquetes de rutes de reserves», «Mostra sempre les rutes de reserva», «Marcadors compactes per als llocs sense planificar», «Explora llocs al mapa», «Difumina els codis de reserva» i «Optimitza la ruta des de l'allotjament».",
  'help.ctx.settings-appearance.title': 'Aparença',
  'help.ctx.settings-appearance.summary':
    'L’aspecte de TREK en aquest compte: clar o fosc, el color d’accent, la translucidesa i les animacions, la mida del text i els ginys que mostra el tauler. Tot s’aplica a l’instant, a tots els dispositius on iniciïs sessió.',
  'help.ctx.settings-appearance.bullet.1':
    "«Tema»: «Mode de color» («Clar», «Fosc» o «Automàtic»), l'«Esquema de colors» i, amb «Personalitzat», el teu propi color d'accent per al mode clar i el fosc, amb una comprovació de contrast.",
  'help.ctx.settings-appearance.bullet.2':
    '«Llegibilitat», marcada com a Experimental: «Transparència», «Reduir el moviment», «Densitat» i «Mida del text», amb un control lliscant per a «Tot» i un per a cadascuna de les mides «Gran», «Mitjana», «Normal» i «Petita».',
  'help.ctx.settings-appearance.bullet.3':
    '«Ginys del tauler»: interruptors separats per a «Escriptori» («Sota la capçalera principal», «Barra lateral dreta») i «Mòbil» («Sota la capçalera principal», «Al peu de la pàgina»).',
  'help.ctx.settings-appearance.bullet.4':
    '«Restableix els valors per defecte», sota les targetes, torna tota la pestanya als valors per defecte.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    "Quin motor dibuixa els mapes del planificador de viatges i del diari, i amb quin estil. Leaflet és el mapa ràster clàssic; Mapbox GL hi afegeix edificis i relleu en 3D amb el teu propi token; MapLibre GL dibuixa tessel·les vectorials d'OpenFreeMap sense necessitat de token. «Atles» sempre fa servir Leaflet.",
  'help.ctx.settings-map.bullet.1':
    '«Proveïdor de mapa»: Leaflet, Mapbox GL (Experimental) o MapLibre GL, cada opció amb una breu descripció.',
  'help.ctx.settings-map.bullet.2':
    "«Plantilla del mapa» i «Clau d'API de CARTO» per a Leaflet; «Estil de mapa» per als dos motors GL, i a més el «Token d'accés de Mapbox» per a Mapbox GL.",
  'help.ctx.settings-map.bullet.3':
    "Només per a Mapbox GL: «Edificis 3D i terreny» i «Mode d'alta qualitat». A sobre de «Desa el mapa» hi ha una vista prèvia en directe. «Desa el mapa» desa el que has triat.",
  'help.ctx.settings-notifications.title': 'Notificacions',
  'help.ctx.settings-notifications.summary':
    "Com et contacta TREK fora de l'aplicació. A dalt, una taula amb una fila per esdeveniment i una columna per canal decideix què s'envia per on. A sota hi ha les targetes del webhook, de ntfy, del push en aquest dispositiu i de qualsevol canal de connector.",
  'help.ctx.settings-notifications.bullet.1':
    "«Notificacions»: activa o desactiva cada esdeveniment per a cada canal. Un cadenat vol dir que l'administrador l'ha desactivat per a tothom.",
  'help.ctx.settings-notifications.bullet.2':
    '«URL del webhook»: un webhook de Discord, de Slack o personalitzat, amb «Provar» i «Desa».',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: «Tema de Ntfy» i, opcionalment, «URL del servidor Ntfy» i «Access Token», amb «Provar» i «Desa».',
  'help.ctx.settings-notifications.bullet.4':
    '«Notificacions push en aquest dispositiu»: «Activa en aquest dispositiu» només afecta aquest navegador; «Envia una prova» envia una notificació de prova. Un canal de connector mostra «Configura» fins que no està configurat.',
  'help.ctx.settings-integrations.title': 'Integracions',
  'help.ctx.settings-integrations.summary':
    "Tot el que es connecta a TREK des de fora: biblioteques de fotos per al diari, AirTrail per als vols, Dawarich per saber on has estat realment, wanderer per als camins, claus API de només lectura per a altres programes, i MCP per als clients d'IA. Una connexió amb un altre servei només apareix quan l'administrador l'ha activada.",
  'help.ctx.settings-integrations.bullet.1':
    'Immich i Synology Photos, AirTrail, Dawarich i wanderer: cada targeta té la seva adreça i clau, «Desa» i «Prova la connexió», i una insígnia «Connectat» o «No connectat».',
  'help.ctx.settings-integrations.bullet.2':
    "«Claus API»: claus de només lectura per a l'API pública, cadascuna limitada a les àrees que triïs, amb l'endpoint per copiar.",
  'help.ctx.settings-integrations.bullet.3':
    "«Configuració MCP»: l'«Endpoint MCP» i, a «Clients OAuth 2.1», els teus clients registrats, la «Configuració del client» per copiar i les «Sessions OAuth actives» amb «Revoca».",
  'help.ctx.settings-integrations.bullet.4':
    "«Tokens d'API»: l'antiga manera de connectar-se a MCP, marcada com a «Obsolet»; fes servir «Clients OAuth 2.1» en lloc seu.",
  'help.ctx.settings-offline.title': 'Fora de línia',
  'help.ctx.settings-offline.summary':
    "Què desa TREK en aquest dispositiu perquè un viatge s'obri també sense connexió, i què passa quan un canvi fet sense connexió entra en conflicte amb un canvi fet en un altre lloc.",
  'help.ctx.settings-offline.bullet.1':
    '«Mode fora de línia»: «Forçar mode fora de línia» primer ho baixa tot i després funciona només amb la memòria cau i deixa els teus canvis en cua.',
  'help.ctx.settings-offline.bullet.2':
    "«Preparar per a l'ús fora de línia»: «Descarregar per a ús fora de línia» baixa les dades dels viatges, els documents i les tessel·les del mapa; «Sincronitzar ara» torna a sincronitzar manualment.",
  'help.ctx.settings-offline.bullet.3':
    "«Què desar fora de línia»: «Desar tessel·les de mapes fora de línia» i un interruptor per a cada viatge. Un viatge acabat només es desa si l'actives.",
  'help.ctx.settings-offline.bullet.4':
    '«Conflictes de sincronització» només apareix quan hi ha dos canvis en conflicte, amb «La meva», «Mantenir la seva» i «Quan es produeix un conflicte». «Memòria cau fora de línia» compta els viatges i els canvis pendents o fallits, amb «Torna-ho a provar», «Descartar» i «Netejar memòria cau».',
  'help.ctx.settings-account.title': 'Compte',
  'help.ctx.settings-account.summary':
    "El teu compte en aquest TREK i com hi inicies sessió: foto de perfil, nom d'usuari i correu, contrasenya, autenticació de dos factors i claus d'accés. «Elimina el compte» és al peu de la targeta «Compte».",
  'help.ctx.settings-account.bullet.1':
    '«Compte»: fes clic a la càmera de la foto per pujar-ne una, i a la paperera vermella per treure-la. «Nom d’usuari» i «Correu» es desen amb «Desa el perfil».',
  'help.ctx.settings-account.bullet.2':
    '«Canvia la contrasenya»: la contrasenya actual, la nova dues vegades, amb els requisits que es van marcant mentre escrius, i després «Actualitza la contrasenya». Si aquest TREK només permet iniciar sessió amb SSO, aquesta targeta no apareix.',
  'help.ctx.settings-account.bullet.3':
    'Autenticació de dos factors (2FA) amb una aplicació d’autenticació i codis de recuperació; claus d’accés per iniciar sessió sense contrasenya.',
  'help.ctx.settings-account.bullet.4':
    "«Elimina el compte» és a l'esquerra del peu de la targeta «Compte» i demana confirmació. L'únic administrador no es pot eliminar a si mateix.",
  // language-region
  'help.guide.language-region.title': 'Definir l’idioma, les unitats i la divisa',
  'help.guide.language-region.goal': 'Fes servir TREK en la teva llengua i amb els formats de la teva regió.',
  'help.guide.language-region.step.1':
    "A «Idioma i regió», tria un «Idioma» de la fila de fitxes. TREK canvia a l'instant, a tots els dispositius on inicies sessió.",
  'help.guide.language-region.step.2':
    "«Noms de llocs» defineix l'idioma de la cerca de llocs, els suggeriments i les adreces; «Igual que l’app» segueix l'idioma de la interfície.",
  'help.guide.language-region.result':
    'Les dates, les distàncies i els imports es mostren en el format que esperes. A «Pressupost», els imports es mostren a la teva divisa de visualització només com a referència; els imports introduïts no canvien.',
  'help.guide.language-region.tip.1':
    '«Divisa del viatge» mostra cada viatge en la seva pròpia divisa, sense conversions.',
  'help.guide.language-region.tip.2': "L'idioma també determina els noms dels dies i dels mesos a Vacances i al diari.",
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Ajustar el mapa del viatge i els títols dels dies',
  'help.guide.travel-map-prefs.goal':
    'Tria què mostra el mapa del viatge i com es veuen les capçaleres dels dies, a tots els viatges.',
  'help.guide.travel-map-prefs.step.1':
    "A «Viatge i mapa», «Obre els llocs a» defineix quina aplicació de mapes obre directament el botó de navegació; «Pregunta cada vegada» et deixa triar l'aplicació cada cop. «Data primer als títols dels dies» mostra primer la data del calendari a la capçalera de cada dia.",
  'help.guide.travel-map-prefs.step.2':
    "«Mostra sempre les rutes de reserva» dibuixa al mapa tots els vols, trens i altres reserves; «Etiquetes de rutes de reserves» posa el nom de l'estació o de l'aeroport a cada extrem. «Marcadors compactes per als llocs sense planificar» redueix els llocs que encara no són a cap dia, perquè les parades planificades es vegin millor.",
  'help.guide.travel-map-prefs.result':
    'El mapa fa servir aquesta configuració a tots els viatges fins que la tornis a canviar.',
  'help.guide.travel-map-prefs.tip.1':
    'Aquestes opcions són del compte, no del viatge. Cada membre d’un viatge compartit veu les seves.',
  'help.guide.travel-map-prefs.tip.2':
    "Un administrador pot definir els valors per defecte per a tothom; el que canviïs aquí només s'aplica a tu.",
  // startup
  'help.guide.startup.title': "Triar amb què s'obre TREK",
  'help.guide.startup.goal': "Fes que TREK s'obri a la pàgina que més fas servir, en lloc d'obrir-se sempre al tauler.",
  'help.guide.startup.step.1':
    "A dalt de tot de «Pantalla», a «Inici», defineix la «Pàgina d'inici» com a «Tauler» o «Viatge actiu».",
  'help.guide.startup.step.2':
    "Amb «Viatge actiu», apareix «Pestanya d'inici»: tria la pestanya amb què s'obre aquell viatge.",
  'help.guide.startup.result': "La propera vegada que obris TREK, s'obrirà directament aquella pàgina.",
  'help.guide.startup.tip.1':
    '«Viatge actiu» és el viatge que està en curs avui, o el pròxim que comença. És el mateix viatge que mostra el tauler a dalt de tot.',
  // theme-scheme
  'help.guide.theme-scheme.title': "Definir el tema i el color d'accent",
  'help.guide.theme-scheme.goal': "Fes TREK clar o fosc, o que segueixi el dispositiu, amb el color que t'agradi.",
  'help.guide.theme-scheme.step.1':
    'A «Tema», posa «Mode de color» a «Clar», «Fosc» o «Automàtic». «Automàtic» segueix el teu dispositiu.',
  'help.guide.theme-scheme.step.2':
    'Tria un «Esquema de colors»: «Predeterminat», «Alt contrast», «Anil», «Xarxet», «Rosa», «Ambre», «Violeta» o «Personalitzat».',
  'help.guide.theme-scheme.step.3':
    "Amb «Personalitzat», tria un dels punts de color, o defineix el teu propi color d'accent per separat per a «Clar» i «Fosc». La pastilla del costat indica «Bon contrast» o «Contrast baix».",
  'help.guide.theme-scheme.result':
    "Els botons, els enllaços i els ressaltats fan servir el color d'accent a tot arreu, en tots els dispositius on inicies sessió.",
  'help.guide.theme-scheme.tip.1':
    'La barra de navegació també té un interruptor ràpid de clar o fosc; canvia el mateix tema.',
  'help.guide.theme-scheme.tip.2': 'Si l’esquema predeterminat costa de llegir, tria «Alt contrast».',
  // readability
  'help.guide.readability.title': 'Ajustar la llegibilitat i la mida del text',
  'help.guide.readability.goal': 'Fes servir menys efecte de vidre i menys animacions, més espai o un text més gran.',
  'help.guide.readability.step.1':
    'A «Llegibilitat», «Transparència» converteix els panells de vidre en superfícies opaques, «Reduir el moviment» redueix al mínim les animacions i «Densitat» tria entre «Còmode» i «Compacte».',
  'help.guide.readability.step.2':
    '«Mida del text»: arrossega «Tot» per canviar la mida de tot el text alhora, o ajusta «Gran», «Mitjana», «Normal» i «Petita» una per una. Cada mida mostra un exemple, perquè vegis el resultat mentre arrossegues.',
  'help.guide.readability.result': 'El canvi s’aplica de cop a tota l’app, també als panells del mapa i al diari.',
  'help.guide.readability.tip.1':
    'Algunes parts de TREK ja redueixen les animacions quan el dispositiu està configurat per reduir el moviment. «Reduir el moviment» les redueix a la resta.',
  'help.guide.readability.tip.2':
    "La mida del text s'aplica mitjançant els nivells tipogràfics, així que no es talla res: si una mida ja no hi cap, el text passa a la línia següent.",
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Triar els ginys del tauler',
  'help.guide.dashboard-widgets.goal': 'Mostra només els ginys que fas servir, per separat a l’ordinador i al mòbil.',
  'help.guide.dashboard-widgets.step.1':
    "A «Ginys del tauler», «Escriptori» mostra els ginys de «Sota la capçalera principal» i de la «Barra lateral dreta». Si desactives «Barra lateral dreta», s'amaga tota la columna i el tauler queda centrat; els seus ginys apareixen atenuats fins que la tornes a activar.",
  'help.guide.dashboard-widgets.step.2':
    '«Mòbil» té els seus propis interruptors, «Sota la capçalera principal» i «Al peu de la pàgina», per al tauler del telèfon.',
  'help.guide.dashboard-widgets.result':
    'El tauler canvia a l’instant. Si la barra lateral dreta està desactivada, el tauler queda centrat.',
  'help.guide.dashboard-widgets.tip.1':
    "Els ginys d'un complement només apareixen si l'administrador té aquell complement activat.",
  'help.guide.dashboard-widgets.tip.2':
    "El tauler recorda per a cada dispositiu si tries la vista de graella o de llista i l'ordre.",
  // map-provider
  'help.guide.map-provider.title': 'Triar el motor i l’estil del mapa',
  'help.guide.map-provider.goal': 'Canvia entre el mapa clàssic, les tessel·les vectorials i el mapa 3D de Mapbox.',
  'help.guide.map-provider.step.1':
    "A «Proveïdor de mapa», tria Leaflet per al mapa 2D clàssic amb qualsevol tessel·la ràster, Mapbox GL per a tessel·les vectorials amb edificis i relleu en 3D, o MapLibre GL per a tessel·les vectorials d'OpenFreeMap sense token.",
  'help.guide.map-provider.step.2':
    "Tria una «Plantilla del mapa» per a Leaflet o un «Estil de mapa» per a un motor GL, o enganxa la teva pròpia URL. Mapbox GL necessita un «Token d'accés de Mapbox», i les plantilles de CARTO, una «Clau d'API de CARTO»; l'enllaç de sota cada camp indica on aconseguir-ne.",
  'help.guide.map-provider.step.3':
    "Amb Mapbox GL, activa «Edificis 3D i terreny» i, si el dispositiu és prou potent, «Mode d'alta qualitat». Revisa la vista prèvia i fes clic a «Desa el mapa».",
  'help.guide.map-provider.result':
    "Els mapes del planificador de viatges i del diari fan servir el motor que has triat. L'«Atles» sempre fa servir Leaflet.",
  'help.guide.map-provider.tip.1': 'Sense token, Mapbox GL fa servir Leaflet en lloc de mostrar un mapa buit.',
  'help.guide.map-provider.tip.2':
    'Les tessel·les de mapa que deses per fer servir sense connexió són del proveïdor que estigui actiu en el moment de baixar-les.',
  // notification-channels
  'help.guide.notification-channels.title': 'Triar on reps les notificacions',
  'help.guide.notification-channels.goal':
    'Rep els recordatoris dels viatges i l’activitat de col·laboració al mòbil o en una altra eina.',
  'help.guide.notification-channels.step.1':
    'Per a un webhook, enganxa una «URL del webhook» de Discord, de Slack o personalitzada, fes clic a «Provar» i després a «Desa».',
  'help.guide.notification-channels.step.2':
    "Per a ntfy, omple el «Tema de Ntfy» i, si en tens un de propi, afegeix la «URL del servidor Ntfy» i un «Access Token». «Provar» envia un missatge a l'instant; «Desa» desa la configuració.",
  'help.guide.notification-channels.step.3':
    "A la targeta «Notificacions» de dalt, activa o desactiva cada esdeveniment per a cada canal. Un cadenat vol dir que l'administrador l'ha desactivat per a tothom. Un canal de connector mostra «Configura» fins que no està configurat; «Envia una prova» el prova.",
  'help.guide.notification-channels.result':
    "Els esdeveniments s'envien pels canals que hi has activat. La columna «A l'aplicació» determina què mostra la campana de la barra de navegació.",
  'help.guide.notification-channels.tip.1':
    "El «Recordatori» propi de cada viatge, és a dir, quants dies abans de la sortida, es defineix al formulari d'edició del viatge.",
  'help.guide.notification-channels.tip.2':
    "L'administrador pot predefinir un servidor ntfy per a tothom; el tema el continues triant tu.",
  // photo-providers
  'help.guide.photo-providers.title': 'Connectar una biblioteca de fotos',
  'help.guide.photo-providers.goal': 'Permet que el diari carregui les fotos del dia des d’Immich o Synology Photos.',
  'help.guide.photo-providers.step.1':
    "A «Integracions», busca la targeta d'Immich o de Synology Photos i introdueix el que et demana: la «URL del servidor» amb una «Clau API» per a Immich, o un «Nom d’usuari» i una «Contrasenya» per a Synology Photos. Immich també pot copiar les fotos de la travessia a la biblioteca d'Immich quan les puges.",
  'help.guide.photo-providers.step.2':
    'Fes clic a «Prova la connexió» i després a «Desa». La insígnia passa a «Connectat».',
  'help.guide.photo-providers.result':
    "La pestanya «Fotos externes» de l'editor d'entrades cerca a la biblioteca connectada les fotos del dia de l'entrada, primer les més properes a la ubicació de l'entrada.",
  'help.guide.photo-providers.tip.1':
    "La connexió és només del teu compte: els altres membres d'una travessia connecten les seves pròpies biblioteques.",
  'help.guide.photo-providers.tip.2':
    'Un proveïdor amb fotos sense dades GPS també funciona. En aquest cas, la llista s’ordena per hora.',
  // api-keys
  'help.guide.api-keys.title': 'Crear una clau API',
  'help.guide.api-keys.goal': "Permet que altres programes llegeixin els teus viatges a través de l'API pública.",
  'help.guide.api-keys.step.1':
    'A «Claus API», fes clic a «Crea una clau», posa-li un «Nom» que indiqui on la faràs servir i, a «Què pot llegir aquesta clau», deixa només les àrees que necessita. Fes clic a «Crea».',
  'help.guide.api-keys.step.2':
    "Copia la clau de «Clau API creada»: només es mostra una vegada. Fes clic a «Fet». L'endpoint al qual s'ha de fer la crida apareix sota la llista.",
  'help.guide.api-keys.result':
    "Els programes que tinguin la clau poden llegir les àrees que has triat, però no poden canviar mai res. La llista mostra quan es va crear cada clau i quan es va fer servir per última vegada, i la paperera l'elimina.",
  'help.guide.api-keys.tip.1':
    'Fes servir una clau per a cada eina; així en pots revocar una sense afectar les altres.',
  'help.guide.api-keys.tip.2':
    "Per deixar que un client d'IA faci canvis, fes servir MCP amb OAuth; les claus API només serveixen per llegir.",
  // mcp-oauth
  'help.guide.mcp-oauth.title': "Connectar un assistent d'IA per MCP",
  'help.guide.mcp-oauth.goal': 'Dona accés als teus viatges a Claude, a un IDE o a un altre client MCP.',
  'help.guide.mcp-oauth.step.1': "A «Configuració MCP», copia l'«Endpoint MCP» per al teu client.",
  'help.guide.mcp-oauth.step.2':
    "A «Clients OAuth 2.1», fes clic a «Client nou» i tria una configuració ràpida («Quick preset»), com ara Claude Desktop o Cursor, o omple tu mateix el «Nom de l'aplicació», les «URIs de redirecció» i els «Àmbits permesos»; per a un servidor sense navegador, tria «Machine client». Fes clic a «Registra el client» i copia el «Secret de client»: només es mostra una vegada.",
  'help.guide.mcp-oauth.step.3':
    'Cada client té «Renova el secret» i «Elimina el client». «Sessions OAuth actives» mostra els clients que tenen la sessió iniciada, amb «Revoca». «Configuració del client» es desplega i mostra un fragment llest per fer servir als clients que funcionen amb JSON.',
  'help.guide.mcp-oauth.result':
    'El client pot llegir i modificar el que permeten els seus àmbits, en nom teu, i cada acció apareix amb el teu nom.',
  'help.guide.mcp-oauth.tip.1':
    'Els permisos limiten què pot fer un client: dona-li només el permís de lectura fins que en necessiti més.',
  'help.guide.mcp-oauth.tip.2':
    'L’administrador pot desactivar MCP per a tota la instància. Aleshores aquesta secció no es mostra.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Tenir els viatges disponibles sense connexió',
  'help.guide.offline-prepare.goal':
    'Desa els teus viatges i els seus mapes en aquest dispositiu abans de quedar-te sense connexió.',
  'help.guide.offline-prepare.step.1':
    "A «Què desar fora de línia», deixa activat «Desar tessel·les de mapes fora de línia» i activa els viatges que vulguis tenir en aquest dispositiu. Un viatge acabat només es desa si l'actives.",
  'help.guide.offline-prepare.step.2':
    "De nou a dalt, a «Preparar per a l'ús fora de línia», fes clic a «Descarregar per a ús fora de línia». Baixa les dades dels viatges, els documents i les tessel·les del mapa, i indica quants viatges ha desat.",
  'help.guide.offline-prepare.step.3':
    "«Forçar mode fora de línia» ho torna a baixar tot un cop més i després funciona només des d'aquest dispositiu, perquè puguis comprovar que no hi falta res abans de marxar.",
  'help.guide.offline-prepare.result':
    "Els viatges s'obren sense connexió. Els canvis que facis es desen en una cua i s'envien quan tornes a tenir connexió.",
  'help.guide.offline-prepare.tip.1':
    'Les tessel·les del mapa són les que ocupen més espai; desactiva-les per desar només les dades dels viatges i els documents.',
  'help.guide.offline-prepare.tip.2':
    'Per a un inici sense connexió més fluid, instal·la TREK com a app des del navegador.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Decidir quina versió es conserva en un conflicte de sincronització',
  'help.guide.offline-conflicts.goal':
    'Tria com resol TREK un conflicte entre un canvi fet sense connexió i un canvi fet en un altre lloc.',
  'help.guide.offline-conflicts.step.1':
    'Quan un canvi que has fet sense connexió entra en conflicte amb un de més recent, apareix «Conflictes de sincronització» a la part de dalt de «Fora de línia». Per a cada canvi, fes clic a «La meva» o «Mantenir la seva».',
  'help.guide.offline-conflicts.step.2':
    "A la mateixa targeta, «Quan es produeix un conflicte» decideix què passarà la propera vegada: «Pregunta'm cada vegada», «Mantingues sempre la meva versió» o «Mantingues sempre la versió del servidor».",
  'help.guide.offline-conflicts.result':
    "Amb «Pregunta'm cada vegada», un conflicte es queda a «Conflictes de sincronització» fins que triïs. Amb les altres dues opcions, TREK el resol automàticament.",
  'help.guide.offline-conflicts.tip.1':
    '«Netejar memòria cau» només esborra la còpia d’aquest dispositiu. Al servidor no canvia res.',
  // profile
  'help.guide.profile.title': 'Canviar el perfil',
  'help.guide.profile.goal': 'Actualitza el teu nom, el correu i la foto.',
  'help.guide.profile.step.1':
    'A la targeta «Compte», fes clic a la càmera de la teva foto per pujar-ne una; la paperera vermella la treu i torna a mostrar la teva inicial.',
  'help.guide.profile.step.2': 'Edita el «Nom d’usuari» i el «Correu» sota la foto.',
  'help.guide.profile.result':
    "El teu nom i la teva foto s'actualitzen a tot arreu alhora, també als viatges que comparteixes.",
  'help.guide.profile.tip.1':
    'Un compte vinculat per SSO mostra una insígnia SSO i «Vinculat amb» seguit del proveïdor.',
  // password
  'help.guide.password.title': 'Canviar la contrasenya',
  'help.guide.password.goal': 'Estableix una contrasenya nova.',
  'help.guide.password.step.1':
    'A «Canvia la contrasenya», introdueix la «Contrasenya actual», després la «Contrasenya nova» i torna-la a escriure a «Confirma la contrasenya nova». La llista de sota marca cada requisit a mesura que el compleixes mentre escrius.',
  'help.guide.password.step.2': 'Fes clic a «Actualitza la contrasenya».',
  'help.guide.password.result':
    "La contrasenya nova s'aplica a l'instant. Es tanca la sessió a tots els altres dispositius, s'eliminen els teus tokens d'API de MCP i els clients OAuth han de tornar a iniciar sessió; aquest dispositiu continua connectat.",
  'help.guide.password.tip.1':
    'Si aquest TREK només permet iniciar sessió amb SSO, no hi ha contrasenya de TREK ni targeta «Canvia la contrasenya».',
  // mfa
  'help.guide.mfa.title': 'Activar l’autenticació de dos factors',
  'help.guide.mfa.goal': 'Protegeix el compte amb un codi d’una aplicació d’autenticació.',
  'help.guide.mfa.step.1': "A «Autenticació de dos factors (2FA)», fes clic a «Configura l'autenticador».",
  'help.guide.mfa.step.2':
    "Escaneja el codi QR amb l'aplicació, o introdueix el secret a mà, escriu el codi de sis xifres que et mostra i fes clic a «Activa el 2FA».",
  'help.guide.mfa.step.3':
    'Desa els codis de recuperació amb «Copia els codis», «Baixa el TXT» o «Imprimeix / PDF» i després fes clic a OK. Cada codi només funciona una vegada. Fes servir un codi quan no tinguis el telèfon a mà.',
  'help.guide.mfa.result': 'Cada vegada que iniciïs sessió, se’t demanarà un codi després de la contrasenya.',
  'help.guide.mfa.tip.1':
    'Per a «Desactiva el 2FA» cal la teva contrasenya i un codi actual o un codi de recuperació no utilitzat.',
  'help.guide.mfa.tip.2':
    "L'administrador pot fer obligatòria la 2FA per a tothom; en aquest cas, aquí no es pot desactivar.",
  // passkeys
  'help.guide.passkeys.title': 'Inicia la sessió amb una passkey',
  'help.guide.passkeys.goal': 'Fes servir l’empremta, la cara o el PIN del dispositiu en lloc d’una contrasenya.',
  'help.guide.passkeys.step.1':
    'A «Passkeys», fes clic a «Afegeix una passkey», confirma la contrasenya actual i posa-li un nom que indiqui de quin dispositiu es tracta; després segueix les indicacions del dispositiu.',
  'help.guide.passkeys.step.2':
    "Cada passkey mostra si és «Sincronitzat» o està vinculada a «Aquest dispositiu», i quan es va fer servir per última vegada. «Canviar el nom» en canvia el nom, i el botó d'eliminar l'elimina un cop has introduït la contrasenya.",
  'help.guide.passkeys.result':
    'La pàgina d’inici de sessió t’ofereix la clau d’accés. Pots continuar iniciant sessió amb la contrasenya.',
  'help.guide.passkeys.tip.1':
    'Una passkey es desa al dispositiu o al seu gestor de contrasenyes, així que afegeix-ne una per a cada dispositiu.',
  'help.guide.passkeys.tip.2':
    "Les passkeys només apareixen quan l'administrador les ha activades. Mentre el servidor no té el domini WebAuthn, la targeta ho indica en lloc d'oferir «Afegeix una passkey».",
  // delete-account
  'help.guide.delete-account.title': 'Eliminar el teu compte',
  'help.guide.delete-account.goal': 'Elimina el teu compte i les dades que són només teves.',
  'help.guide.delete-account.step.1':
    "A la targeta «Compte», fes clic a «Elimina el compte», a l'esquerra del peu de la targeta, i després a «Elimina permanentment».",
  'help.guide.delete-account.result':
    "El teu compte s'elimina, juntament amb els viatges, els llocs i els fitxers dels quals ets propietari. Els viatges que són d'altres persones es mantenen.",
  'help.guide.delete-account.tip.1':
    "Si ets l'únic administrador, TREK mostra «No és possible eliminar-lo»: primer fes administrador un altre usuari.",
  'help.guide.delete-account.tip.2': 'No es pot desfer. Exporta el que vulguis conservar abans de confirmar.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administrador',
  'help.ctx.admin.summary':
    "La configuració de tota la instància de TREK, per a tots els usuaris: qui pot iniciar sessió i com, què està activat, on es desen els fitxers, com contacta el servidor amb la gent i com se'n fan les còpies de seguretat. Només els administradors veuen aquesta pàgina. La barra lateral agrupa les pestanyes a «Usuaris», «Configuració», «Integracions» i «Manteniment», i cada pestanya és una pantalla independent.",
  'help.ctx.admin.bullet.1':
    "A la dreta de la capçalera hi ha el recompte d'usuaris, viatges, llocs i fitxers. A sota apareix el bàner «Actualització disponible» quan hi ha una versió més nova de TREK.",
  'help.ctx.admin.bullet.2':
    "«Usuaris» i «Valors per defecte»: comptes, enllaços d'invitació i permisos, i la configuració i el mapa amb què comença un compte nou.",
  'help.ctx.admin.bullet.3':
    "«Personalització», «Configuració», «Complements», «Connectors» i «Emmagatzematge»: plantilles d'equipatge, categories i vacances escolars; inici de sessió, passkeys, 2FA, claus API i proveïdors de cerca; els mòduls de funcions; els connectors de tercers, i on es desen els fitxers pujats.",
  'help.ctx.admin.bullet.4':
    "«Notificacions», «Accés MCP» i GitHub: els canals que poden triar els usuaris i els valors amb què comencen, els tokens i les sessions dels clients d'IA, i l'historial de versions.",
  'help.ctx.admin.bullet.5':
    'Còpia de seguretat i Auditoria: còpies a demanda i programades, i el registre d’esdeveniments rellevants per a la seguretat.',
  'help.ctx.admin-users.title': 'Usuaris',
  'help.ctx.admin-users.summary':
    "Tots els comptes d'aquest TREK, amb el rol, el correu i l'última activitat, els enllaços d'invitació que permeten registrar-se en una instància tancada, i qui pot fer què als viatges.",
  'help.ctx.admin-users.bullet.1':
    "La taula: usuari, correu, rol, data de creació i «Última activitat», amb «Editar usuari» i «Eliminar usuari» a cada fila. Un punt verd a l'avatar vol dir que la persona està connectada ara mateix; la teva fila diu «(Tu)».",
  'help.ctx.admin-users.bullet.2':
    "«Crea usuari», a dalt a la dreta de la targeta «Usuaris», afegeix un compte manualment amb una contrasenya que li dones tu a l'usuari.",
  'help.ctx.admin-users.bullet.3':
    "«Enllaços d'invitació», a sota: enllaços de registre amb un límit d'usos, una caducitat i, si vols, un viatge al qual s'uneix el nou usuari en registrar-se.",
  'help.ctx.admin-users.bullet.4':
    "«Configuració de permisos», a baix de tot: per a cada acció, qui la pot fer («Tothom», «Membres del viatge», «Propietari del viatge» o «Només l'administrador»). Fes clic a «Desa», a dalt de la targeta, per desar-ho.",
  'help.ctx.admin-defaults.title': 'Valors per defecte',
  'help.ctx.admin-defaults.summary':
    "Amb què comença un compte nou, perquè ningú no l'hagi de configurar abans: mode de color, unitats, format d'hora, primer dia de la setmana, divisa de visualització i codis de reserva difuminats, i també el mapa, les seves claus i els servidors de rutes.",
  'help.ctx.admin-defaults.bullet.1':
    "«Configuració per defecte dels usuaris», a l'esquerra: «Mode de color», «Unitat de temperatura», «Unitat de distància», «Format d'hora», «La setmana comença el», «Divisa de visualització» i «Difumina els codis de reserva».",
  'help.ctx.admin-defaults.bullet.2':
    "«Mapa», a la dreta: «Plantilla del mapa», «Clau CARTO compartida», «Motor de rutes propi» i «Instància Valhalla pròpia», una vista prèvia, i després «Motor de mapes» amb «Estil de mapa», «Token de Mapbox compartit», «Edificis i terreny en 3D» i «Mode d'alta qualitat».",
  'help.ctx.admin-config.title': 'Personalització',
  'help.ctx.admin-config.summary':
    'Opcions que comparteixen tots els viatges de la instància: les plantilles d’equipatge, el conjunt de categories per a llocs i col·leccions, i el catàleg de vacances escolars que fa servir «Vacances».',
  'help.ctx.admin-config.bullet.1':
    "«Plantilles d'equipatge»: llistes amb nom, amb categories i articles, que serveixen de punt de partida per a la llista d'equipatge d'un viatge.",
  'help.ctx.admin-config.bullet.2':
    '«Categories»: nom, icona i color de les categories que es fan servir a tot TREK, de la fitxa del lloc a «Col·leccions», cadascuna editable en un diàleg amb vista prèvia.',
  'help.ctx.admin-config.bullet.3':
    '«Vacances escolars»: el catàleg de països i regions amb els seus períodes de vacances, que tothom pot triar a «Vacances».',
  'help.ctx.admin-settings.title': 'Configuració',
  'help.ctx.admin-settings.summary':
    "Com inicia sessió la gent i quins serveis externs pot fer servir el servidor. A l'esquerra: «Mètodes d'autenticació», «Inici de sessió amb clau d'accés», «Exigir autenticació de dos factors (2FA)» i «Inici de sessió únic (OIDC)». A la dreta: «Tipus de fitxer permesos» i «Claus API», amb els proveïdors de cerca i de transport públic. «Zona de perill» és a baix de tot.",
  'help.ctx.admin-settings.bullet.1':
    "«Mètodes d'autenticació»: «Inici de sessió amb contrasenya», «Registre amb contrasenya» i, quan l'OIDC està configurat, «Inici de sessió SSO» i «Aprovisionament automàtic SSO». «Exigir autenticació de dos factors (2FA)» té una targeta pròpia.",
  'help.ctx.admin-settings.bullet.2':
    "«Inici de sessió amb clau d'accés»: «Activar inici de sessió amb clau d'accés», l'«ID de la part confiable (domini)» i els «Orígens permesos». «Inici de sessió únic (OIDC)»: «Nom visible», «URL de l'emissor», una URL de descoberta opcional, «ID de client» i «Secret de client».",
  'help.ctx.admin-settings.bullet.3':
    "«Claus API»: la TREK Places API va primer i no necessita clau. A sota hi ha la «Clau API de Google Maps» (amb «Provar» i «Per a què s'utilitza la clau»), la clau d'Unsplash i la d'Amap, i un sol botó «Desa» a baix de la targeta.",
  'help.ctx.admin-settings.bullet.4':
    "«Proveïdor de transport públic» i «Proveïdor de la cerca de llocs» trien qui respon les cerques de transport públic i de llocs; «Registre de cerques de llocs» registra quin resultat s'ha triat; «Tipus de fitxer permesos» limita els fitxers que es poden pujar.",
  'help.ctx.admin-addons.title': 'Complements',
  'help.ctx.admin-addons.summary':
    'Els mòduls de TREK, cadascun amb el seu interruptor: Equipatge, Pressupost, Documents, Vacances, Atles, Col·laboració, Travessia, Col·leccions, Viatge per carretera, MCP, AirTrail, Dawarich i l’anàlisi amb IA. Si en desactives un, l’entrada del menú, les rutes i l’API desapareixen per a tothom.',
  'help.ctx.admin-addons.bullet.1':
    'Una casella per complement amb el seu interruptor i, si en té, subfiles per a les seves opcions.',
  'help.ctx.admin-addons.bullet.2':
    'Els proveïdors de fotos i de documents també apareixen aquí com a caselles, perquè puguis oferir Immich o Synology als usuaris.',
  'help.ctx.admin-addons.bullet.3': "«Seguiment d'equipatge» té el seu propi interruptor sota els mosaics.",
  'help.ctx.admin-plugins.title': 'Connectors',
  'help.ctx.admin-plugins.summary':
    "Connectors de tercers que s'executen en un procés propi al costat de TREK, cadascun amb els permisos que va demanar en instal·lar-lo. Instal·la'ls des del catàleg, puja un paquet o vincula una carpeta mentre desenvolupes un connector.",
  'help.ctx.admin-plugins.bullet.1':
    '«Instal·lat» i «Descobreix», amb «Cerca connectors…» i els filtres «Tipus», «Estat» i «Ordena». Cada fila mostra la versió, «Revisat», «Signat» o «Sense signar», a què pot accedir el connector, un interruptor i un menú ⋯.',
  'help.ctx.admin-plugins.bullet.2':
    'Les dues icones de la capçalera de la targeta: «Puja el connector» accepta un .zip, .tgz o .tar.gz (o pots deixar anar un .zip a la pàgina); «Torna a escanejar» detecta una carpeta de connector enllaçada per al desenvolupament.',
  'help.ctx.admin-plugins.bullet.3':
    'Amfitrions permesos per connector: les adreces a què pot connectar-se cada connector, perquè les connexions de sortida estan bloquejades per defecte.',
  'help.ctx.admin-storage.title': 'Emmagatzematge',
  'help.ctx.admin-storage.summary':
    'On es desen els fitxers pujats: al disc local o en un bucket S3, i opcionalment copiats a altres backends. Cada categoria de fitxers pot anar a un backend diferent, i no canvia res fins que fas clic a «Desar els canvis».',
  'help.ctx.admin-storage.bullet.1':
    "«Salut», a dalt: les escriptures fallides a un destí de rèplica, o «No s'ha registrat cap fallada de rèplica.».",
  'help.ctx.admin-storage.bullet.2':
    "«Backends»: nom, tipus, ús i «Mirrored to», amb «Provar», «Edita» i «Elimina». «Calcula ara» calcula què hi ha desat; un backend definit per una variable d'entorn és de només lectura.",
  'help.ctx.admin-storage.bullet.3':
    '«Categories»: documents del viatge, fotos de la travessia, portades, fotos de perfil, imatges de llocs, les memòries cau de fotos i les còpies de seguretat, cadascuna assignada a un backend.',
  'help.ctx.admin-notifications.title': 'Notificacions',
  'help.ctx.admin-notifications.summary':
    'Els canals que la instància ofereix als usuaris, i els que reps tu com a administrador. Els usuaris trien els seus temes i URL a «Configuració»; tu decideixes quins canals hi ha i configures el correu.',
  'help.ctx.admin-notifications.bullet.1':
    "«Correu (SMTP)», Webhook, Ntfy i Web Push tenen cadascun un interruptor per oferir el canal als usuaris; el correu també necessita la configuració del servidor. «A l'aplicació» sempre està activat.",
  'help.ctx.admin-notifications.bullet.2':
    '«Recordatoris de viatge»: si el servidor envia el recordatori abans que comenci un viatge.',
  'help.ctx.admin-notifications.bullet.3':
    "«Webhook d'administrador», «Ntfy d'administrador» i la targeta «Notificacions»: on van els esdeveniments d'administració («Versió nova disponible», «Error de rèplica d'emmagatzematge», «Regió de caiac demanada»), cadascun amb un botó de prova.",
  'help.ctx.admin-mcp-tokens.title': 'Accés MCP',
  'help.ctx.admin-mcp-tokens.summary':
    "Tots els tokens i sessions OAuth que tenen els clients d'IA per a aquest TREK, de tots els usuaris. Pots revocar-ne qualsevol.",
  'help.ctx.admin-mcp-tokens.bullet.1':
    '«Sessions OAuth»: el client, els àmbits que se li han concedit, el propietari i la data, amb una icona de paperera per revocar-la.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    "«Tokens d'API»: nom, propietari, «Creat» i «Últim ús», amb una paperera per eliminar-lo.",
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    "Les novetats de TREK: l'historial de versions de GitHub i si hi ha una versió més nova que la teva. L'actualització es fa fora de l'aplicació, al servidor.",
  'help.ctx.admin-github.bullet.1':
    "«Historial de versions» mostra les versions en una cronologia amb les seves notes. La més recent té l'etiqueta «Última», les versions prèvies diuen «Prellançament» i GitHub obre la pàgina de versions.",
  'help.ctx.admin-github.bullet.2':
    "«Actualització disponible» apareix sota la capçalera de la pàgina quan hi ha una versió més nova; «Com actualitzar» mostra les ordres per a Docker o la guia d'actualització per a altres instal·lacions.",
  'help.ctx.admin-backup.title': 'Còpia de seguretat',
  'help.ctx.admin-backup.summary':
    'Còpies de seguretat completes de la base de dades i dels fitxers pujats, fetes a mà o programades, desades al servidor i descarregables en un sol fitxer. Fes servir «Restaura» per recuperar una còpia.',
  'help.ctx.admin-backup.bullet.1':
    '«Còpia de seguretat de les dades»: «Crea una còpia» i «Puja una còpia de seguretat», a dalt de la targeta, i la llista de còpies amb «Baixa», «Restaura» i una icona de paperera per eliminar-les.',
  'help.ctx.admin-backup.bullet.2':
    "«Puja una còpia de seguretat» restaura a partir d'un fitxer creat en una altra instància o en un dia anterior, després de la mateixa pregunta que «Restaura».",
  'help.ctx.admin-backup.bullet.3':
    "«Còpia automàtica»: activada o desactivada, «Interval», «Executa a les» i el dia, i «Elimina les còpies antigues després de» (de «1 dia» a «Conserva per sempre»), que s'apliquen amb «Desa».",
  'help.ctx.admin-audit.title': 'Auditoria',
  'help.ctx.admin-audit.summary':
    'El registre d’esdeveniments administratius i rellevants per a la seguretat: inicis de sessió i intents fallits, canvis d’MFA, canvis d’usuaris i de configuració, còpies de seguretat i restauracions. És només de lectura i mostra primer el més recent.',
  'help.ctx.admin-audit.bullet.1':
    "Una fila per esdeveniment amb l'hora, l'usuari, l'acció, el recurs, la IP i els detalls.",
  'help.ctx.admin-audit.bullet.2':
    "«Actualitzar», a la capçalera de la targeta, torna a carregar la llista. La insígnia del costat del títol indica quantes entrades s'han carregat del total, i «Carregar més» carrega entrades més antigues.",
  // create-user
  'help.guide.create-user.title': 'Crear un usuari',
  'help.guide.create-user.goal': 'Afegeix un compte a mà, sense invitació.',
  'help.guide.create-user.step.1': 'Fes clic a «Crea usuari», a dalt a la dreta de la targeta «Usuaris».',
  'help.guide.create-user.step.2':
    'Introdueix el «Nom d’usuari», el «Correu» i una «Contrasenya»; la llista de sota la contrasenya mostra quins requisits compleix. Tria el «Rol»: «Usuari» o «Administrador».',
  'help.guide.create-user.step.3': 'Fes clic a «Crea usuari».',
  'help.guide.create-user.result':
    'El compte apareix a la taula i pot iniciar sessió de seguida. Fes arribar la contrasenya a la persona per un canal de confiança.',
  'help.guide.create-user.tip.1':
    "Per a una persona que hagi de triar la seva pròpia contrasenya, és millor un enllaç d'invitació.",
  'help.guide.create-user.tip.2':
    'Un «Administrador» veu aquesta pàgina i ho pot fer tot. El que pot fer un «Usuari» als viatges es defineix més avall, a «Configuració de permisos».',
  // edit-user
  'help.guide.edit-user.title': "Canviar les dades o la contrasenya d'un usuari",
  'help.guide.edit-user.goal':
    "Canvia el nom d'algú, puja'l o baixa'l de rol, o ajuda'l a tornar a iniciar sessió si ha perdut la contrasenya.",
  'help.guide.edit-user.step.1':
    "Fes clic al llapis («Editar usuari») a la fila de l'usuari. El diàleg mostra el correu del compte a dalt.",
  'help.guide.edit-user.step.2':
    "Canvia «Nom d’usuari», «Correu» o «Rol», o escriu una «Contrasenya nova» (deixa-la buida per mantenir l'actual), i fes clic a «Desa». «Restablir claus d'accés», a baix de tot, elimina totes les claus d'accés del compte un cop ho confirmes.",
  'help.guide.edit-user.result':
    "El canvi s'aplica a l'instant. Una contrasenya nova també tanca la sessió de la persona a tots els dispositius, de manera que qualsevol sessió antiga deixa de funcionar.",
  'help.guide.edit-user.tip.1': 'No et pots treure el rol d’administrador si ets l’últim administrador.',
  'help.guide.edit-user.tip.2':
    "Si restableixes les claus d'accés, la contrasenya es manté; la persona afegeix claus noves a «Configuració», «Compte».",
  // invite-links
  'help.guide.invite-links.title': 'Convidar algú amb un enllaç',
  'help.guide.invite-links.goal':
    'Permet que algú es registri en una instància tancada i, si vols, afegeix-lo a un viatge.',
  'help.guide.invite-links.step.1': "Fes clic a «Crea enllaç», a dalt a la dreta de la targeta «Enllaços d'invitació».",
  'help.guide.invite-links.step.2':
    "Tria «Usos màx.» (d'1× a 5×, o ∞) i «Expira després de» (d'1d a 14d, o ∞), opcionalment un viatge a «Afegeix al viatge (opcional)», i fes clic a «Crea i copia».",
  'help.guide.invite-links.step.3':
    "Envia l'enllaç. Cada fila mostra quantes vegades s'ha fet servir, quan caduca, a quin viatge afegeix i qui l'ha creat, amb «Actiu», «Expirat» o «Esgotat» al costat. «Copia enllaç» el torna a copiar, i la paperera l'elimina.",
  'help.guide.invite-links.result':
    'Qui obri l’enllaç es registra amb la seva pròpia contrasenya. Si s’ha triat un viatge, s’hi uneix de seguida.',
  'help.guide.invite-links.tip.1':
    "Els enllaços d'invitació funcionen encara que «Registre amb contrasenya» estigui desactivat a «Configuració».",
  'help.guide.invite-links.tip.2':
    "Per a una sola persona, l'opció més segura és un enllaç d'un sol ús i amb una caducitat curta.",
  // delete-user
  'help.guide.delete-user.title': 'Eliminar un usuari',
  'help.guide.delete-user.goal': 'Elimina un compte i tot el que en depèn.',
  'help.guide.delete-user.step.1':
    "Fes clic a la paperera («Eliminar usuari») a la fila de l'usuari i confirma-ho amb «Elimina».",
  'help.guide.delete-user.result':
    "El compte s'elimina, juntament amb tots els viatges i travessies dels quals és propietari, fins i tot els viatges que compartia amb altres persones. Els viatges dels quals només era membre es queden amb els seus propietaris.",
  'help.guide.delete-user.tip.1': "No es pot desfer. Si no n'estàs segur, fes primer una còpia de seguretat.",
  'help.guide.delete-user.tip.2':
    'La icona de la paperera de la teva pròpia fila no funciona: no et pots eliminar a tu mateix. Ho ha de fer un altre administrador.',
  // permissions
  'help.guide.permissions.title': 'Decidir qui pot fer què',
  'help.guide.permissions.goal': 'Defineix, acció per acció, quin rol la pot fer en aquest TREK.',
  'help.guide.permissions.step.1':
    "A «Configuració de permisos», busca l'acció dins del seu grup, com ara «Elimina els viatges» a «Gestió de viatges», i tria qui la pot fer: «Tothom», «Membres del viatge», «Propietari del viatge» o «Només l'administrador». Una fila modificada es marca com a «personalitzat».",
  'help.guide.permissions.step.2':
    'Fes clic a «Desa», a dalt a la dreta de la targeta. «Restableix els valors per defecte» torna cada fila al nivell original; després també cal fer clic a «Desa».',
  'help.guide.permissions.result':
    'La regla s’aplica a tots els viatges alhora. Qui no arriba al nivell ja no veu els botons ni els menús corresponents.',
  'help.guide.permissions.tip.1':
    '«Propietari del viatge» vol dir la persona que el va crear; els administradors sempre ho poden fer tot.',
  'help.guide.permissions.tip.2':
    "Cada acció té la seva pròpia fila; així, per exemple, pots deixar que els membres planifiquin llocs i dies però reservar al propietari la possibilitat d'eliminar el viatge.",
  // default-map
  'help.guide.default-map.title': 'Definir el mapa per defecte dels usuaris nous',
  'help.guide.default-map.goal': 'Dona a cada compte nou un mapa que funcioni sense testimoni personal.',
  'help.guide.default-map.step.1':
    'A «Mapa», tria una «Plantilla del mapa» o enganxa una URL de tessel·les, i introdueix una «Clau CARTO compartida» si fas servir tessel·les de CARTO. La vista prèvia de sota mostra el resultat.',
  'help.guide.default-map.step.2':
    "Més avall, tria el «Motor de mapes»: «Estàndard (gratuït)», Mapbox (3D) o MapLibre (OpenFreeMap). Per a Mapbox i MapLibre, tria l'«Estil de mapa»; per a Mapbox, afegeix el «Token de Mapbox compartit» i decideix si vols «Edificis i terreny en 3D» i «Mode d'alta qualitat».",
  'help.guide.default-map.result':
    'Els comptes nous comencen amb aquesta configuració; qui ja hagi triat el seu propi mapa a «Configuració» el conserva.',
  'help.guide.default-map.tip.1':
    "Un token o una clau introduïts aquí els comparteix tothom qui no en té cap de propi, així que vigila'n la quota.",
  'help.guide.default-map.tip.2':
    'Els comptes existents que no han canviat mai res a la pestanya del mapa també fan servir aquests valors per defecte.',
  // packing-templates
  'help.guide.packing-templates.title': 'Crear una plantilla d’equipatge',
  'help.guide.packing-templates.goal':
    'Fes que els viatges comencin amb una llista d’equipatge en lloc d’una de buida.',
  'help.guide.packing-templates.step.1': 'Fes clic a «Nova plantilla», escriu un nom i confirma-ho amb la marca.',
  'help.guide.packing-templates.step.2':
    "Fes clic al nom de la plantilla per obrir-la i després a «Afegeix una categoria». El + de dalt d'una categoria hi afegeix articles, i un article només necessita un nom.",
  'help.guide.packing-templates.step.3':
    "Tot es desa a mesura que treballes. El llapis canvia el nom d'una plantilla, d'una categoria o d'un article. La paperera elimina un article a l'instant. En el cas d'una plantilla o una categoria, primer demana confirmació, perquè també s'elimina tot el que contenen.",
  'help.guide.packing-templates.result':
    "La plantilla s'ofereix a la llista d'equipatge de tots els viatges; en aplicar-la, se'n copien els articles, de manera que cada viatge els pot modificar lliurement.",
  'help.guide.packing-templates.tip.1':
    'Funciona millor una plantilla per a cada tipus de viatge (platja, ciutat, senderisme) que no pas una llista molt llarga.',
  'help.guide.packing-templates.tip.2': "Eliminar una plantilla no afecta els viatges que ja l'han aplicada.",
  'help.guide.packing-templates.tip.3':
    "«Desa com a plantilla», a la llista d'equipatge d'un viatge, crea una plantilla amb el pes, la quantitat i la bossa de cada article. Aquí es mostren al costat de l'article, i en aplicar la plantilla els articles van a les mateixes bosses.",
  // categories
  'help.guide.categories.title': 'Gestionar les categories',
  'help.guide.categories.goal':
    'Decideix quines categories poden tenir els llocs i les col·leccions, i quin aspecte tenen.',
  'help.guide.categories.step.1':
    'Fes clic a «Categoria nova», escriu el nom a la línia del títol del diàleg, tria una «Icona» i un «Color» i comprova la «Vista prèvia». Fes clic a «Crea».',
  'help.guide.categories.step.2':
    "A la llista, el llapis («Edita») obre una categoria i «Actualitza» la desa. La paperera («Elimina») l'elimina un cop ho confirmes.",
  'help.guide.categories.result':
    'El conjunt s’aplica a tot arreu alhora: l’inspector de llocs, les xinxetes del mapa, «Col·leccions» i els filtres.',
  'help.guide.categories.tip.1':
    "Els llocs conserven l'identificador de la categoria, així que si canvies el nom d'una categoria, canvia a tots els llocs.",
  'help.guide.categories.tip.2':
    "Quan elimines una categoria, els seus llocs es queden sense categoria. Si això t'importa, primer assigna'ls a una altra categoria.",
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Mantenir les vacances escolars a mà',
  'help.guide.school-holiday-catalog.goal':
    "Mantén les vacances escolars d'un país o regió perquè tothom les pugui triar a «Vacances».",
  'help.guide.school-holiday-catalog.step.1':
    'A «Vacances escolars», tria el «País», o fes clic a + («Afegeix un país»), introdueix el «País» i el seu «Codi del país (p. ex. US)» i desa. «Afegeix una regió» afegeix cadascuna de les parts del país que tenen dates pròpies.',
  'help.guide.school-holiday-catalog.step.2':
    'Fes clic a una regió per obrir «Regió o districte escolar»: «Afegeix un període», posa a cada període un «Nom de les vacances», una «Data inicial» i una «Data de fi», i desa. La paperera elimina un període o una regió; un país es pot eliminar quan ja no té cap regió.',
  'help.guide.school-holiday-catalog.result':
    "Els usuaris trien el país i la regió a la configuració de «Vacances» i veuen els períodes a la graella de l'any.",
  'help.guide.school-holiday-catalog.tip.1':
    'No es pot eliminar una regió que algú ja ha triat al seu calendari de «Vacances».',
  // auth-methods
  'help.guide.auth-methods.title': "Decidir com s'inicia la sessió",
  'help.guide.auth-methods.goal':
    'Activa o desactiva l’inici de sessió amb contrasenya, l’SSO i el registre, i fes obligatori el 2FA.',
  'help.guide.auth-methods.step.1':
    "A «Mètodes d'autenticació», activa o desactiva «Inici de sessió amb contrasenya» i «Registre amb contrasenya»; cada interruptor s'aplica a l'instant. Amb el registre desactivat, només es poden crear comptes nous amb enllaços d'invitació, SSO o «Crea usuari».",
  'help.guide.auth-methods.step.2':
    '«Inici de sessió SSO» i «Aprovisionament automàtic SSO» necessiten que hi hagi configurat «Inici de sessió únic (OIDC)» més avall; l’aprovisionament automàtic crea un compte la primera vegada que algú inicia sessió per SSO.',
  'help.guide.auth-methods.step.3':
    "Activa «Exigir autenticació de dos factors (2FA)» perquè tothom qui no tingui la 2FA l'hagi de configurar a «Configuració» abans de poder fer servir TREK.",
  'help.guide.auth-methods.result':
    "La pàgina d'inici de sessió ofereix exactament els mètodes que has deixat activats.",
  'help.guide.auth-methods.tip.1':
    "TREK no et deixa desactivar l'últim mètode d'inici de sessió: el seu interruptor es posa gris i el text d'ajuda diu «At least one login method must remain enabled».",
  'help.guide.auth-methods.tip.2':
    'Si el servidor té definit OIDC_ONLY, els interruptors de contrasenya queden bloquejats i una nota ho indica.',
  // oidc
  'help.guide.oidc.title': "Connectar l'inici de sessió únic",
  'help.guide.oidc.goal': 'Permet que la gent iniciï sessió amb el teu proveïdor d’identitat.',
  'help.guide.oidc.step.1':
    "A «Inici de sessió únic (OIDC)», introdueix el «Nom visible» del botó, la «URL de l'emissor», l'«ID de client» i el «Secret de client» del teu proveïdor. Omple «URL de descoberta (opcional)» només si el proveïdor no la publica a l'adreça habitual, com passa amb Authentik. Fes clic a «Desa».",
  'help.guide.oidc.step.2': "Activa «Inici de sessió SSO» a «Mètodes d'autenticació».",
  'help.guide.oidc.result':
    "La pàgina d'inici de sessió mostra el botó d'SSO; amb «Aprovisionament automàtic SSO» activat, els usuaris que entren per primera vegada reben un compte automàticament.",
  'help.guide.oidc.tip.1':
    'L’URI de redirecció que demana el proveïdor és l’adreça del teu TREK seguida del camí de retorn d’OIDC que indica la documentació.',
  'help.guide.oidc.tip.2':
    'L’assignació de claims decideix quins grups de l’SSO esdevenen administradors; consulta la pàgina d’OIDC a la documentació.',
  // instance-keys
  'help.guide.instance-keys.title': 'Introduir les claus API',
  'help.guide.instance-keys.goal':
    "Afegeix fotos i valoracions de Google, portades d'Unsplash i la cerca d'Amap per a tota la instància.",
  'help.guide.instance-keys.step.1':
    "A «Claus API», la TREK Places API de dalt ja s'encarrega de la cerca de llocs sense cap clau. «Què hi ha a dins» explica què cobreix i què no.",
  'help.guide.instance-keys.step.2':
    "Per a fotos, valoracions i horaris d'obertura, enganxa una «Clau API de Google Maps» i fes clic a «Provar»; et dirà «Connectat» o «No vàlida». Obre «Per a què s'utilitza la clau» i activa només el que vulguis que es facturi: «Fotos de Llocs», «Autocompletat de Llocs», «Detalls del Lloc», «Enriquiment de llocs» i «Cercar només amb Google», i a més un «Límit diari de crides a Google».",
  'help.guide.instance-keys.step.3':
    "Enganxa la «Clau API d'Unsplash» per a la cerca de portades i la «Clau API d'Amap (高德地图)» per a la cerca de llocs a la Xina continental, i fes clic a «Desa», a baix de la targeta.",
  'help.guide.instance-keys.result':
    'Els usuaris tenen les funcions sense necessitat de claus pròpies. Sense clau de Google, la cerca funciona amb la TREK Places API i OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Quan un usuari té una clau personal a «Configuració», TREK fa servir aquesta clau en lloc de la de la instància per a aquell usuari.',
  'help.guide.instance-keys.tip.2':
    'Les claus també poden venir de variables d’entorn; en aquest cas, aquí es mostren només de lectura.',
  'help.guide.instance-keys.tip.3':
    "«Límit diari de crides a Google» fixa quant pot gastar TREK amb la clau cada dia; la insígnia al costat del títol compta les crides d'avui. Quan s'arriba al límit, les cerques fan servir OpenStreetMap fins a l'endemà (UTC).",
  // places-transit
  'help.guide.places-transit.title': 'Triar els proveïdors de cerca i de transport públic',
  'help.guide.places-transit.goal':
    'Tria quin servei respon les cerques de llocs i les consultes de rutes de transport públic.',
  'help.guide.places-transit.step.1':
    "A «Proveïdor de transport públic», tria «Transitous (gratuït)», que no necessita clau i funciona millor a Europa, o Google, que fa servir la clau de Google. L'opció es desa a l'instant.",
  'help.guide.places-transit.step.2':
    "A «Proveïdor de la cerca de llocs», tria a quin servei recorre TREK quan l'índex de TREK i OpenStreetMap no troben res: «Automàtic» (Google si hi ha clau, i si no, Amap), Google Places, Amap (高德地图) o OpenStreetMap.",
  'help.guide.places-transit.result':
    'Tots els quadres de cerca i totes les rutes de transport públic de TREK fan servir aquesta opció.',
  'help.guide.places-transit.tip.1':
    "Si tries una opció sense la seva clau, aquí apareix un avís. Aleshores la cerca de llocs només fa servir l'índex de TREK i OpenStreetMap, i el transport públic només fa servir Transitous.",
  'help.guide.places-transit.tip.2':
    'Les rutes de transport públic de Google es facturen per petició; les de Transitous, no.',
  // file-types
  'help.guide.file-types.title': 'Limitar els tipus de fitxer',
  'help.guide.file-types.goal': 'Decideix quines extensions de fitxer es poden pujar.',
  'help.guide.file-types.step.1':
    "A «Tipus de fitxer permesos», edita la llista d'extensions separades per comes, o posa * per permetre tots els tipus, i fes clic a «Desa».",
  'help.guide.file-types.result':
    'Les pujades de qualsevol altre tipus es rebutgen amb un missatge clar, tant als documents com al diari i a les portades.',
  'help.guide.file-types.tip.1':
    "No treguis els tipus d'imatge de la llista: les portades i les fotos de les travessies es comproven amb la mateixa llista.",
  // toggle-addon
  'help.guide.toggle-addon.title': 'Activar o desactivar un complement',
  'help.guide.toggle-addon.goal': 'Fes que un mòdul estigui disponible per a tothom, o treu-lo.',
  'help.guide.toggle-addon.step.1':
    "Fes clic a l'interruptor de la casella del complement. L'entrada de navegació apareix o desapareix per a tothom a l'instant.",
  'help.guide.toggle-addon.step.2':
    "Algunes caselles tenen subfiles per a les seves opcions, com ara «Seguiment d'equipatge» a «Llistes» o els proveïdors de fotos a «Travessia»; només es mostren mentre el complement està activat.",
  'help.guide.toggle-addon.result':
    'Quan desactives un complement, se’n conserven les dades. Quan el tornes a activar, les dades tornen a aparèixer.',
  'help.guide.toggle-addon.tip.1':
    "Si desactives MCP, s'eliminen el punt d'accés i les seccions d'«Integracions» que en depenen.",
  'help.guide.toggle-addon.tip.2':
    "Vacances, Atles i Travessia són els complements que més demanen els usuaris; Documents necessita espai d'emmagatzematge per als fitxers pujats.",
  // install-plugin
  'help.guide.install-plugin.title': 'Instal·lar un connector',
  'help.guide.install-plugin.goal': 'Afegeix un connector de tercers i dona-li exactament els permisos que demana.',
  'help.guide.install-plugin.step.1':
    'Obre «Descobreix», busca un connector amb «Cerca connectors…» o amb el filtre «Tipus», i fes clic a «Instal·la». Per a un fitxer de paquet, fes clic a «Puja el connector» (la icona del núvol, a dalt a la dreta de la targeta), o deixa anar el .zip a la pàgina.',
  'help.guide.install-plugin.step.2':
    'A «Instal·lat», llegeix la fila: a què pot accedir el connector, a quins servidors es connecta i si és «Revisat» i «Signat». Després activa «Activar el connector»; la fila mostrarà «Actiu».',
  'help.guide.install-plugin.step.3':
    "El menú ⋯ de la fila ofereix «Reinicia», «Mostra el registre d'errors», «Amfitrions permesos» i «Canvia la versió…», i també els enllaços al codi font; «Elimina» desinstal·la el connector i les seves dades. Una versió més nova apareix a la fila com a actualització, i si demana permisos nous, es queda desactivada fins que els aprovis.",
  'help.guide.install-plugin.result':
    "El connector s'executa en el seu propi procés. Tot el que afegeix, com ara ginys, capes de mapa o eines, apareix on ho defineix el connector.",
  'help.guide.install-plugin.tip.1':
    '«Torna a escanejar» detecta una carpeta de connector enllaçada per al desenvolupament sense paquet.',
  'help.guide.install-plugin.tip.2':
    'Un connector sense signar apareix marcat com a tal; instal·la’l només si confies en el seu origen.',
  // storage-backends
  'help.guide.storage-backends.title': 'Moure els fitxers pujats a S3 o replicar-los',
  'help.guide.storage-backends.goal':
    "Desa els fitxers en un emmagatzematge d'objectes, o copia cada fitxer pujat a un segon backend.",
  'help.guide.storage-backends.step.1':
    "A «Backends», fes clic a «Afegir backend», posa-li un «Nom», tria el «Tipus», «Local» o S3, i omple'n els camps. Per tenir-ne una còpia en un altre lloc, marca els «Objectius del mirall». Fes clic a «Aplicar» i després a «Provar» a la fila nova per comprovar la connexió.",
  'help.guide.storage-backends.step.2':
    'A «Categories», assigna cada tipus de fitxer pujat, com ara «Documents del viatge», «Fotos de la travesia» o «Còpies de seguretat», a un backend.',
  'help.guide.storage-backends.step.3':
    'Fes clic a «Desar els canvis», a baix. Si alguna categoria apunta ara a un altre lloc, TREK et pregunta si vols «Mou els objectes existents» o «Només enruta les escriptures noves».',
  'help.guide.storage-backends.result':
    "Els fitxers nous van al backend assignat. Els fitxers moguts se serveixen des d'allà, i els que has triat no moure es queden on eren.",
  'help.guide.storage-backends.tip.1':
    "Un sistema d'emmagatzematge configurat amb variables d'entorn es mostra, però aquí no es pot editar.",
  'help.guide.storage-backends.tip.2':
    "Un destí de rèplica rep una còpia de cada escriptura nova; «Sincronitza ara», a la fila, copia el que s'havia desat abans. Un destí lent alenteix totes les pujades d'aquell backend.",
  // channels-instance
  'help.guide.channels-instance.title': 'Configurar els canals de notificació',
  'help.guide.channels-instance.goal':
    'Decideix quins canals poden triar els usuaris i configura el correu electrònic.',
  'help.guide.channels-instance.step.1':
    "Activa «Correu (SMTP)» a la capçalera de la seva targeta, introdueix «SMTP Host», «SMTP Port», «SMTP User», «SMTP Password» i la «From Address», i fes clic a «Desa». «Enviar correu de prova» t'envia un correu a tu. «Omet la comprovació del certificat TLS» només és per a un servidor de correu local amb un certificat propi.",
  'help.guide.channels-instance.step.2':
    'Activa Webhook, Ntfy i Web Push per oferir-los. Aleshores els usuaris introdueixen la seva URL o el seu tema, o activen el push a cada dispositiu, a «Configuració», «Notificacions».',
  'help.guide.channels-instance.step.3':
    "«Recordatoris de viatge» activa o desactiva el recordatori abans que comenci un viatge; «A l'aplicació» sempre està activat.",
  'help.guide.channels-instance.result':
    'La pestanya «Notificacions» de cada usuari mostra els canals que has activat.',
  'help.guide.channels-instance.tip.1':
    "La «URL del servidor Ntfy» de la targeta «Ntfy d'administrador» també és el servidor per defecte dels usuaris. Els usuaris poden continuar definint el seu propi servidor.",
  'help.guide.channels-instance.tip.2':
    'Els canals de connectors apareixen automàticament quan hi ha actiu un connector que els ofereix.',
  // admin-channels
  'help.guide.admin-channels.title': "Rebre els esdeveniments d'administració al telèfon",
  'help.guide.admin-channels.goal':
    "Rep avisos de versions noves, de rèpliques d'emmagatzematge que fallen i de sol·licituds de regions de caiac.",
  'help.guide.admin-channels.step.1':
    "A «Ntfy d'administrador», introdueix el «Tema d'administrador» i, si cal, la «URL del servidor Ntfy» i un «Token d'accés (opcional)»; a «Webhook d'administrador», una URL. Fes clic a «Desa» a cada targeta.",
  'help.guide.admin-channels.step.2':
    'Fes clic a «Enviar Ntfy de prova» o «Enviar webhook de prova» per comprovar que arriba un missatge.',
  'help.guide.admin-channels.result':
    "Els esdeveniments d'administració s'envien a tots els administradors dins de l'aplicació i, si els has activat, al tema ntfy i al webhook d'administració.",
  'help.guide.admin-channels.tip.1':
    "Mantén el tema d'administració separat del personal, perquè els avisos de caigudes no es perdin entre els missatges dels viatges.",
  'help.guide.admin-channels.tip.2':
    "El webhook i el tema d'administració són independents dels teus canals personals de «Configuració», «Notificacions».",
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': "Revocar l'accés de la IA",
  'help.guide.mcp-tokens-admin.goal':
    'Consulta i revoca tots els tokens i sessions que té un client d’IA, de qualsevol usuari.',
  'help.guide.mcp-tokens-admin.step.1':
    'A «Sessions OAuth», busca el client pel nom i el propietari; les seves fitxes mostren els àmbits que té concedits. La paperera revoca la sessió un cop ho confirmes.',
  'help.guide.mcp-tokens-admin.step.2':
    "A «Tokens d'API», el mateix per als tokens: nom, propietari, «Creat» i «Últim ús». La paperera elimina el token, i el client deixa de funcionar a l'instant.",
  'help.guide.mcp-tokens-admin.result': 'L’usuari del client l’ha de tornar a connectar. No canvia res més.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Els àmbits indiquen què podria fer un client; un àmbit de només lectura es pot mantenir sense risc.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Desactivar el complement MCP atura tots els clients alhora i amaga aquesta pestanya, però no elimina res: els tokens tornen a funcionar quan el tornes a activar.',
  // release-history
  'help.guide.release-history.title': 'Comprovar si hi ha una versió nova',
  'help.guide.release-history.goal': 'Comprova si el teu TREK està al dia i què porta la versió següent.',
  'help.guide.release-history.step.1':
    "Quan hi ha una versió més nova, «Actualització disponible» apareix sota la capçalera de la pàgina amb la versió que fas servir. «Veure a GitHub» obre la versió, i «Com actualitzar» mostra les ordres per a Docker o la guia d'actualització per a altres instal·lacions.",
  'help.guide.release-history.step.2':
    "«Historial de versions» mostra totes les versions amb les seves notes. «Mostrar els detalls» les desplega, la versió més recent porta l'etiqueta «Última» i «Carregar més» mostra les versions anteriors.",
  'help.guide.release-history.result':
    "L'actualització es fa al servidor, baixant la imatge nova o compilant la nova etiqueta; el directori de dades es conserva.",
  'help.guide.release-history.tip.1':
    'Abans d’actualitzar, fes una còpia de seguretat. La pestanya «Còpia de seguretat» és al costat d’aquesta.',
  'help.guide.release-history.tip.2':
    'Els prellançaments es mostren, però no s’anuncien com a actualitzacions, tret que facis servir un prellançament.',
  // create-backup
  'help.guide.create-backup.title': 'Fer i restaurar una còpia de seguretat',
  'help.guide.create-backup.goal':
    "Fes una còpia de seguretat de tota la instància, guarda'n una còpia en un altre lloc i tingues la possibilitat de restaurar-la.",
  'help.guide.create-backup.step.1':
    'A «Còpia de seguretat de les dades», fes clic a «Crea una còpia», a dalt a la dreta. Desa la base de dades i els fitxers pujats en un sol fitxer al servidor.',
  'help.guide.create-backup.step.2':
    '«Baixa» en desa una còpia fora del servidor; la paperera elimina les antigues un cop ho confirmes.',
  'help.guide.create-backup.step.3':
    '«Restaura» en una còpia, o «Puja una còpia de seguretat» amb un fitxer, substitueix totes les dades actuals quan fas clic a «Sí, restaura» al diàleg «Vols restaurar la còpia?».',
  'help.guide.create-backup.result':
    'Una restauració recupera els usuaris, els viatges, els fitxers i la configuració exactament com eren en aquella còpia.',
  'help.guide.create-backup.tip.1':
    'Restaurar és l’única acció d’aquí que no es pot desfer. Fes abans una còpia de seguretat nova.',
  'help.guide.create-backup.tip.2':
    'Les còpies de seguretat es desen al directori de dades. Copia-les a una altra màquina perquè estiguin protegides si aquesta falla.',
  // auto-backup
  'help.guide.auto-backup.title': 'Programar còpies de seguretat',
  'help.guide.auto-backup.goal': 'Fes que el servidor es faci còpies de seguretat sol i elimini les antigues.',
  'help.guide.auto-backup.step.1':
    "A «Còpia automàtica», activa «Activa la còpia automàtica» i tria l'«Interval» («Cada hora», «Diària», «Setmanal» o «Mensual»), «Executa a les» i, si és setmanal o mensual, el «Dia de la setmana» o el «Dia del mes».",
  'help.guide.auto-backup.step.2':
    "A «Elimina les còpies antigues després de», tria quant de temps es conserva cada còpia, d'«1 dia» a «Conserva per sempre», i fes clic a «Desa».",
  'help.guide.auto-backup.result':
    "Les còpies de seguretat apareixen a la llista segons la programació. Les còpies que superen l'antiguitat que has triat s'eliminen.",
  'help.guide.auto-backup.tip.1':
    "«Executa a les» fa servir l'hora del servidor; la indicació de sota mostra el fus horari del servidor.",
  'help.guide.auto-backup.tip.2':
    "L'espai del servidor és limitat: normalment n'hi ha prou amb 7 o 14 dies, si guardes una còpia baixada en un altre lloc.",
  // audit-log
  'help.guide.audit-log.title': 'Consultar el registre d’auditoria',
  'help.guide.audit-log.goal': 'Descobreix qui ha fet què, i quan.',
  'help.guide.audit-log.step.1':
    "Llegeix les files, de la més recent a la més antiga: «Data i hora», «Usuari», «Acció», «Recurs», IP i «Detalls». Les accions porten el nom del que ha passat, com ara un inici de sessió fallit, un canvi d'MFA o una restauració.",
  'help.guide.audit-log.step.2':
    "«Actualitzar», a dalt a la dreta, torna a carregar la llista. La insígnia del costat del títol indica quantes entrades s'han carregat del total, i «Carregar més» carrega entrades més antigues.",
  'help.guide.audit-log.result':
    'Tens un registre que pots mostrar a qualsevol que pregunti per què ha canviat alguna cosa.',
  'help.guide.audit-log.tip.1': 'Les hores es mostren al fus horari del servidor.',
  'help.guide.audit-log.tip.2':
    "El registre només admet afegir entrades; des de l'aplicació no s'hi pot editar ni eliminar res.",
  // document-providers
  'help.guide.document-providers.title': 'Oferir un magatzem de documents',
  'help.guide.document-providers.goal':
    'Decideix amb quins serveis d’emmagatzematge pot sincronitzar els documents un viatge.',
  'help.guide.document-providers.step.1':
    'La casella «Documents» mostra els gestors en files: Paperless-ngx, Papra, Nextcloud, OpenCloud i Synology Drive. Al principi tots cinc estan desactivats, i les files només apareixen si «Documents» està activat.',
  'help.guide.document-providers.step.2':
    "Activa l'interruptor de la fila de Nextcloud. El missatge diu «Complement actualitzat», i a partir d'aleshores els propietaris dels viatges troben «Sincronització de documents» a la pestanya «Fitxers» dels seus viatges, amb Nextcloud a «Connecta un proveïdor».",
  'help.guide.document-providers.result':
    'El magatzem està disponible a tots els viatges d’aquest TREK. No es connecta res fins que el propietari d’un viatge el connecta.',
  'help.guide.document-providers.tip.1':
    "Aquí només es decideix si es pot oferir un magatzem. L'adreça i les credencials són de cada viatge i les introdueix el propietari del viatge a la pestanya «Fitxers», mai al tauler d'administració.",
  'help.guide.document-providers.tip.2':
    'Si desactives Documents, també es desactiven tots els magatzems, i no en pots activar cap mentre Documents estigui desactivat: el servidor respon Enable the Documents addon first. Un magatzem de la teva pròpia xarxa també necessita ALLOW_INTERNAL_NETWORK=true al servidor.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viatge',
  'help.ctx.trip.summary':
    "Tot el que té a veure amb un viatge: el pla amb els dies, el mapa i els llocs, i les pestanyes d'excursions, transports, reserves, llistes, pressupost, fitxers, col·laboració i diari vinculat. Cadascuna té la seva pròpia pantalla d'ajuda, a sota d'aquesta.",
  'help.ctx.trip.bullet.1':
    'La barra de pestanyes, sota la barra superior: «Planificat», «Excursions», «Transports», «Reserves», «Llistes», «Pressupost», «Fitxers», «Col·laboració» i, quan hi ha un diari vinculat, «Diari». Els complements i els connectors determinen quines pestanyes hi ha al teu TREK.',
  'help.ctx.trip.bullet.2':
    "«Planificat» té tres columnes: els dies a l'esquerra, el mapa al mig i els llocs a la dreta. Amb el complement «Viatge per carretera», la columna de dies comença amb un selector entre «Dies» i «Viatge per carretera»; amb el complement «Excursions», la columna de llocs comença amb «Llocs» i «Excursions». Les reserves i els transports formen part del pla, a la parada i entre parades; les pestanyes en mostren la llista.",
  'help.ctx.trip.bullet.3':
    "«Configuració del viatge», la pastilla del costat del nom del viatge, a dalt a l'esquerra, obre la configuració del viatge: «Persones» (membres i convidats), «Compartint» (l'enllaç públic de només lectura i l'enllaç d'invitació) i «Diari».",
  'help.ctx.trip.bullet.4':
    "El títol, les dates, la portada i la divisa s'editen des d'«Els meus viatges», amb el llapis de la targeta del viatge. El nom del viatge, a dalt a l'esquerra, et torna allà.",
  'help.ctx.trip.bullet.5':
    "La pestanya de la vora interior d'una columna la plega, i el mapa aprofita l'espai lliure. Una columna plegada mostra una petita casella a la cantonada superior del mapa; fes-hi clic per tornar a mostrar la columna. Arrossega el separador fi del costat d'una columna per canviar-ne l'amplada.",
  'help.ctx.trip.bullet.6':
    "La fletxa de desfer de la barra d'eines dels dies desfà els teus últims canvis al pla, un per un.",
  // add-member
  'help.guide.add-member.title': 'Afegir un membre',
  'help.guide.add-member.goal': 'Dona accés a aquest viatge a una persona que tingui compte de TREK.',
  'help.guide.add-member.step.1':
    "Fes clic a «Configuració del viatge», la pastilla del costat del nom del viatge, a dalt a l'esquerra. S'obre a «Persones».",
  'help.guide.add-member.step.2':
    'A «Convida un usuari», tria la persona a «Selecciona un usuari…» i fes clic a «Convida».',
  'help.guide.add-member.step.3':
    "La persona ja apareix a «Accés». La insígnia «Propietari» indica qui és el propietari. «Treure l'accés», al final de cada fila, treu la persona un cop ho confirmes.",
  'help.guide.add-member.result':
    'El membre pot veure i editar el viatge igual que tu, dins dels nivells que l’administrador ha definit a «Configuració de permisos».',
  'help.guide.add-member.tip.1':
    'Si algú no surt a la llista, és que encara no té compte de TREK: afegeix-lo com a convidat o deixa que es registri amb un enllaç d’invitació.',
  'help.guide.add-member.tip.2':
    "El número del costat d'«Accés» compta les persones del viatge; els convidats apareixen a part, a sota.",
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Convidar amb un enllaç',
  'help.guide.trip-invite-link.goal': 'Permet que la gent s’uneixi al viatge pel seu compte.',
  'help.guide.trip-invite-link.step.1':
    "Fes clic a «Configuració del viatge», al costat del nom del viatge, i tria «Compartint» a l'esquerra. A «Enllaç d'invitació al viatge», fes clic a «Crear enllaç d'invitació».",
  'help.guide.trip-invite-link.step.2':
    "Fes clic a «Copiar» i envia l'enllaç. Qualsevol persona amb compte de TREK que l'obri s'hi uneix com a membre.",
  'help.guide.trip-invite-link.step.3':
    "«Regenera» substitueix l'enllaç i l'antic deixa de funcionar; «Desactivar» el desactiva.",
  'help.guide.trip-invite-link.result': 'Qui obre l’enllaç s’uneix al viatge i apareix a «Accés».',
  'help.guide.trip-invite-link.tip.1':
    'Qui no té compte no el pot fer servir. Un administrador crea enllaços de registre a «Administrador», «Usuaris», i en pot vincular un a aquest viatge.',
  'help.guide.trip-invite-link.tip.2':
    "Si has enviat l'enllaç al xat equivocat, torna'l a generar: l'enllaç antic deixa de funcionar a l'instant.",
  // add-guest
  'help.guide.add-guest.title': 'Afegir un convidat sense compte',
  'help.guide.add-guest.goal': 'Afegeix al viatge algú que no fa servir TREK.',
  'help.guide.add-guest.step.1':
    "Fes clic a «Configuració del viatge», al costat del nom del viatge. A «Persones», «Convidats» és l'última part, sota «Accés».",
  'help.guide.add-guest.step.2': 'Escriu el nom a «Nom del convidat» i fes clic a «Afegir convidat».',
  'help.guide.add-guest.result':
    "Pots assignar el convidat a despeses, articles de l'equipatge i tasques, però no pot iniciar la sessió.",
  'help.guide.add-guest.tip.1':
    "«Canviar el nom» (el llapis) canvia el nom d'un convidat. «Treure l'accés» (la paperera) elimina el convidat un cop ho confirmes: s'eliminen les seves assignacions, i la seva part de cada despesa es reparteix entre els altres participants de la divisió.",
  'help.guide.add-guest.tip.2':
    'Si més endavant la persona es fa un compte, convida-la com a membre i elimina el convidat.',
  // public-link
  'help.guide.public-link.title': 'Publicar un enllaç de només lectura',
  'help.guide.public-link.goal': "Mostra el viatge a persones que no l'han d'editar.",
  'help.guide.public-link.step.1':
    "Fes clic a «Configuració del viatge», al costat del nom del viatge, i tria «Compartint» a l'esquerra.",
  'help.guide.public-link.step.2':
    "A la targeta «Enllaç públic», activa què pot mostrar l'enllaç. «Mapa i pla» sempre està activat; «Reserves», «Equipatge», «Pressupost» i «Xat» els tries tu.",
  'help.guide.public-link.step.3':
    'A «Opcions», «Només transport i allotjament» exclou les activitats, les notes dels dies i els dies buits. «Sense fotos» exclou les fotos dels llocs.',
  'help.guide.public-link.result':
    "Qualsevol persona amb l'enllaç veu les parts triades sense iniciar sessió i no pot canviar res.",
  'help.guide.public-link.tip.1':
    'L’enllaç no apareix enlloc, però qualsevol persona que el tingui el pot obrir. Guarda’l amb la mateixa cura que una contrasenya.',
  'help.guide.public-link.tip.2': 'Si vols que la persona pugui editar, afegeix-la com a membre.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Cedir el viatge o abandonar-lo',
  'help.guide.transfer-ownership.goal':
    'Fes que una altra persona sigui la propietària, o surt d’un viatge que no és teu.',
  'help.guide.transfer-ownership.step.1':
    "Fes clic a «Configuració del viatge», al costat del nom del viatge. A «Accés», fes clic a «Fer propietari» (la corona) a la fila d'un membre i confirma-ho.",
  'help.guide.transfer-ownership.step.2':
    "«Abandona el viatge», a la teva fila, et treu del viatge un cop ho confirmes. Si n'ets el propietari, primer has de cedir-ne la propietat.",
  'help.guide.transfer-ownership.result':
    'El nou propietari gestiona els membres i pot eliminar el viatge; tu continues com a membre normal.',
  'help.guide.transfer-ownership.tip.1':
    "El propietari és qui va crear el viatge, fins que se'n cedeix la propietat. Només el propietari pot eliminar el viatge.",
  'help.guide.transfer-ownership.tip.2':
    "«Treure l'accés», a la fila d'un altre membre, funciona al revés: el propietari treu aquell membre del viatge.",
  // collapse-columns
  'help.guide.collapse-columns.title': 'Fer espai per al mapa',
  'help.guide.collapse-columns.goal': 'Plega una columna o fes-la més ampla.',
  'help.guide.collapse-columns.step.1':
    "Fes clic a la pestanya de la vora interior de la columna dels dies, la que té la icona de panell, per plegar la columna; el mapa ocupa l'espai que queda lliure. La columna dels llocs té la mateixa pestanya.",
  'help.guide.collapse-columns.step.2':
    "Quan una columna està plegada, apareix una petita casella amb la icona del panell a la cantonada superior del mapa; el text d'ajuda diu «Planificat» o «Llocs». Fes-hi clic per tornar a mostrar la columna.",
  'help.guide.collapse-columns.step.3':
    'Arrossega el separador fi entre una columna i el mapa per canviar l’amplada de la columna.',
  'help.guide.collapse-columns.result':
    'Les amplades es recorden. La propera vegada, les columnes tornen a estar obertes.',
  'help.guide.collapse-columns.tip.1': 'Pots plegar les dues columnes alhora per veure només el mapa.',
  'help.guide.collapse-columns.tip.2':
    "En una finestra estreta només hi cap una columna: si n'obres una, l'altra es plega. Al telèfon no hi ha columnes; «Viatge», «Planificat» i «Llocs», a dalt, canvien de vista.",
  // undo-change
  'help.guide.undo-change.title': "Desfer l'últim canvi",
  'help.guide.undo-change.goal': 'Desfés l’últim canvi que has fet al pla.',
  'help.guide.undo-change.step.1':
    "Fes clic a la fletxa de desfer de la barra d'eines de sobre els dies; la seva indicació diu quin canvi desfarà.",
  'help.guide.undo-change.result': "El pla torna a estar com abans, i un missatge breu indica què s'ha desfet.",
  'help.guide.undo-change.tip.1':
    '«Desfer» abasta el pla: afegir, assignar, treure, reordenar, moure i bloquejar llocs, buidar un dia, optimitzar una ruta, eliminar llocs, canvis de categoria i importacions.',
  'help.guide.undo-change.tip.2':
    'Torna a fer clic per anar més enrere: TREK conserva els teus últims 30 canvis en aquest viatge, del més recent al més antic, fins que en surts.',
  'help.guide.clear-day.title': 'Buidar un dia',
  'help.guide.clear-day.goal':
    "Treu tots els llocs d'un dia d'un sol cop, per exemple per tornar a planificar el dia de zero.",
  'help.guide.clear-day.step.1': 'Fes clic amb el botó dret a la capçalera del dia al pla.',
  'help.guide.clear-day.step.2': 'Tria «Buida el dia» i confirma.',
  'help.guide.clear-day.result':
    'El dia queda buit i els seus llocs tornen a la llista com a no planificats. La fletxa de desfer de sobre els dies els torna a posar.',
  'help.guide.clear-day.tip.1': 'Només es treuen els llocs. El dia conserva les notes i les reserves.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Llocs',
  'help.ctx.trip-places.summary':
    "La columna de la dreta del pla: tots els llocs del viatge, planificats o no, amb cerca, filtres i ordenació, i les maneres d'afegir-ne: amb la cerca, a mà o des d'una llista compartida. «Llocs» i «Excursions», a dalt, alternen entre els llocs i les excursions del viatge.",
  'help.ctx.trip-places.bullet.1':
    "«Llocs» i «Excursions», a dalt de la columna, canvien la llista. En entrar, s'obre «Llocs». «Excursions» mostra les excursions del viatge i importa fitxers GPX, KML i KMZ amb «Importa GPX o KML»; les excursions no apareixen a la llista de llocs.",
  'help.ctx.trip-places.bullet.2':
    '«Afegeix un lloc / activitat» obre el formulari per a un lloc que busques o escrius. Si hi ha un dia obert, el botó diu «Lloc nou», i «Al dia», al costat, crea el lloc directament en aquell dia.',
  'help.ctx.trip-places.bullet.3':
    '«Importa llocs», el botó amb icona del costat, ofereix «Importa una llista» per a una llista compartida des de Google Maps o Naver Maps. Si un administrador ha desactivat el complement «Excursions», també ofereix «Importa un fitxer» per a fitxers .gpx, .kml i .kmz, i pots deixar anar un fitxer sobre la columna.',
  'help.ctx.trip-places.bullet.4':
    "A sota hi ha la «Cerca», que també busca a les descripcions i les notes, i al costat la casella «Triar». La fila de sota conté els filtres: «Mostrar» alterna entre «Tots», «Sense planificar» i «Planificat», cadascun amb el seu recompte. El botó de l'etiqueta filtra per categoria, l'estrella per valoració mínima, el globus (quan el viatge inclou més d'un país o regió) per país o regió, i «Ordena per» defineix l'ordre de la llista.",
  'help.ctx.trip-places.bullet.5':
    "Cada fila mostra la imatge, el nom i la descripció o l'adreça, i una estrella amb la valoració mitjana quan algú ha valorat el lloc. Fes-hi clic per veure'n els detalls, arrossega-la a un dia, o fes-hi clic amb el botó dret (o fes clic a «Més opcions», els tres punts) per a «Edita», «+ Dia», «Obre el lloc web», «Obre a Google Maps», «Desar a la col·lecció» i «Elimina».",
  'help.ctx.trip-places.bullet.6':
    "Amb un dia obert, el + rodó del final d'una fila («+ Dia») afegeix el lloc a aquell dia. Apareix a tots els llocs que encara no hi són. Aleshores «Planificat» només mostra aquell dia, i la fitxa «Es mostra només el dia obert» t'ho indica. La seva x, «Mostra tot el viatge», tanca el dia.",
  // create-place
  'help.guide.create-place.title': 'Crear un lloc',
  'help.guide.create-place.goal': 'Afegeix un lloc o una activitat a mà, amb tots els detalls que necessita el pla.',
  'help.guide.create-place.step.1':
    "Fes clic a «Afegeix un lloc / activitat», a dalt de la columna de llocs («Lloc nou» si hi ha un dia obert). El formulari s'obre amb el cursor a la cerca.",
  'help.guide.create-place.step.2':
    "Escriu el lloc a «Cerca llocs…» i tria un resultat. S'omplen el nom de dalt del diàleg, «Adreça», «Latitud», «Longitud» i «Lloc web», i «Detalls del lloc», a l'esquerra, mostra imatges, l'horari i una descripció. En un TREK amb clau de Google, «Not the right place? Search Google instead», sota els resultats, fa la mateixa cerca amb Google. Amb «Col·leccions» activat, «Llocs desats», a la dreta, t'ofereix els llocs de les teves llistes de la mateixa manera.",
  'help.guide.create-place.step.3':
    'A «Detalls del lloc», fes clic a una imatge sota «Tria una imatge» perquè sigui la imatge del lloc. «Utilitza aquest text» copia la descripció al formulari.',
  'help.guide.create-place.step.4':
    "Revisa els camps del formulari. El nom, a dalt del diàleg, és l'únic camp obligatori. La pastilla «Categoria» de sota tria una de les categories del viatge, i el + del costat en crea una de nova. «Adreça», «Latitud» i «Longitud» provenen de la cerca o les escrius tu. «Descripció» i «Notes» són per al teu propi text. «Lloc web» és per a l'enllaç, «Adjuntar», a «Fitxers», afegeix un document, i «Telèfon», «Correu electrònic» i «Afegeix l'horari» són per a les dades que la cerca no ha trobat.",
  'help.guide.create-place.step.5':
    'Fes clic a «Afegir». Si al viatge ja hi ha un lloc amb el mateix nom o a la mateixa ubicació, TREK mostra un avís i el botó passa a dir «Afegir igualment».',
  'help.guide.create-place.result':
    'El lloc és a la llista i al mapa, a «Sense planificar» fins que es posa en un dia.',
  'help.guide.create-place.tip.1':
    "«Pressupost», a baix del formulari, amb el complement «Pressupost» activat, obre l'editor de «Pressupost» per a la despesa del lloc just després de desar. Una imatge o un PDF que enganxis al diàleg s'adjunta com un fitxer a «Fitxers».",
  'help.guide.create-place.tip.2':
    'A tots els TREK, els resultats de la cerca provenen de l’índex de TREK i d’OpenStreetMap, i «Detalls del lloc» s’omple automàticament amb Wikipedia, Wikivoyage i Wikimedia. TREK només consulta Google quan cap dels dos troba res, i només Google aporta valoracions.',
  'help.guide.create-place.tip.3':
    "També pots crear un lloc des del mapa: fes clic dret al punt i el formulari s'obre amb les coordenades i l'adreça ja omplertes.",
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Afegir un lloc directament al dia obert',
  'help.guide.place-to-open-day.goal': 'Crea o tria un lloc i afegeix-lo al dia en un sol pas.',
  'help.guide.place-to-open-day.step.1':
    "Fes clic a la capçalera d'un dia a la columna de dies. El dia queda obert: la seva targeta es ressalta i la columna de llocs mostra el botó «Al dia» al costat de «Lloc nou».",
  'help.guide.place-to-open-day.step.2':
    "«Al dia» obre el mateix formulari que «Lloc nou», però el lloc s'afegeix al dia obert tan bon punt fas clic a «Afegir».",
  'help.guide.place-to-open-day.step.3':
    'Per afegir un lloc que ja existeix al dia obert, fes clic al + rodó del final de la seva fila («+ Dia»), o fes-hi clic amb el botó dret i tria «+ Dia». El + apareix a tots els llocs que encara no són en aquell dia.',
  'help.guide.place-to-open-day.step.4':
    "També funciona a l'inrevés, sense obrir abans cap dia: arrossega la fila del lloc fora de la columna i deixa-la anar sobre la targeta d'un dia. Si la deixes anar entre dues parades, es posa just allà.",
  'help.guide.place-to-open-day.result': 'El lloc s’afegeix al final del dia; arrossega’l amunt o avall fins on toqui.',
  'help.guide.place-to-open-day.tip.1':
    'El dia obert també afecta la cerca: quan hi ha un dia obert, el mapa i la cerca de llocs propers parteixen dels llocs que ja són en aquell dia.',
  'help.guide.place-to-open-day.tip.2': "«Desfer», a la barra d'eines de sobre els dies, desfà l'assignació.",
  // filter-places
  'help.guide.filter-places.title': 'Trobar un lloc a la llista',
  'help.guide.filter-places.goal': 'Mostra a la columna només els llocs que busques.',
  'help.guide.filter-places.step.1':
    "«Mostrar», el desplegable de sota la cerca, alterna entre «Tots», «Sense planificar» (encara no és a cap dia) i «Planificat» (és en un dia), cadascun amb el seu recompte. Si el complement «Excursions» està desactivat i s'ha importat una traça GPX, també apareix «Rutes».",
  'help.guide.filter-places.step.2':
    "Escriu a «Cercar», a dalt. La llista es filtra mentre escrius, per nom, adreça, descripció i notes; la x del camp l'esborra.",
  'help.guide.filter-places.step.3':
    "El botó de l'etiqueta, al costat de «Mostrar», mostra les categories: marca'n una o més, «Sense categoria» inclosa. El botó indica quantes n'hi ha de marcades, i «Esborra el filtre», a baix de la llista, les desmarca totes.",
  'help.guide.filter-places.step.4':
    "L'estrella del costat defineix una valoració mínima: 5+, 4+, etc. només mostren els llocs amb una valoració mitjana igual o superior. Els llocs sense valoració s'amaguen.",
  'help.guide.filter-places.result':
    'El número de «Mostrar» indica quants llocs coincideixen, i els filtres es combinen.',
  'help.guide.filter-places.tip.1':
    "Quan hi ha un dia obert, «Planificat» només mostra aquell dia i t'ho indica: «Es mostra només el dia obert», amb «Mostra tot el viatge» al costat.",
  'help.guide.filter-places.tip.2':
    'El mapa també aplica «Mostrar», les categories i la valoració, i amb un dia obert, «Planificat» al mapa només mostra aquell dia. La cerca i el globus només filtren la llista.',
  // edit-place
  'help.guide.edit-place.title': 'Modificar un lloc',
  'help.guide.edit-place.goal': 'Corregeix un nom, mou la xinxeta, afegeix un lloc web o canvia la categoria.',
  'help.guide.edit-place.step.1':
    'Fes clic amb el botó dret a la fila i tria «Edita», o fes clic a «Més opcions» al final de la fila, o obre el lloc i fes clic a «Edita» als seus detalls.',
  'help.guide.edit-place.step.2':
    "Canvia el que calgui a «Edita el lloc»: el nom i la pastilla «Categoria» a la part de dalt del diàleg, «Adreça», «Latitud» i «Longitud», «Descripció», «Notes», «Lloc web», «Telèfon», «Correu electrònic» i l'horari d'obertura. Si el lloc és en un sol dia, o l'has obert des d'un dia, el formulari també té «Inici», «Fi» i «Notes per a aquest dia».",
  'help.guide.edit-place.step.3': 'Fes clic a «Actualitza».',
  'help.guide.edit-place.result':
    "El canvi s'aplica a tot arreu on apareix el lloc: la llista, el mapa i tots els dies en què és.",
  'help.guide.edit-place.tip.1':
    '«Notes per a aquest dia» són del lloc només en aquell dia; «Notes» són del lloc en si.',
  'help.guide.edit-place.tip.2':
    'Si «Fi» és anterior a «Inici», no pots fer clic a «Actualitza»; «Solapament horari amb:» només avisa que una altra parada del dia té la mateixa hora.',
  // delete-place
  'help.guide.delete-place.title': 'Eliminar un lloc',
  'help.guide.delete-place.goal': 'Elimina un lloc del viatge definitivament.',
  'help.guide.delete-place.step.1':
    'Fes clic amb el botó dret a la fila i tria «Elimina» (també és a «Més opcions», al final de la fila), o fes clic a «Elimina» als detalls del lloc.',
  'help.guide.delete-place.step.2':
    'Fes clic a «Elimina» al missatge de confirmació. Si hi havia una nit reservada en aquest lloc o una reserva vinculada, el missatge t’indica què s’eliminarà també.',
  'help.guide.delete-place.result':
    "El lloc desapareix de la llista, del mapa i de tots els dies. «Desfer», a la barra d'eines de sobre els dies, el recupera.",
  'help.guide.delete-place.tip.1':
    "Per treure un lloc només d'un dia, fes servir en canvi «Treure del dia» en aquella parada.",
  'help.guide.delete-place.tip.2':
    'Per eliminar diversos llocs alhora, fes clic a la marca del costat de la cerca per començar una selecció.',
  // select-places
  'help.guide.select-places.title': 'Canviar o eliminar diversos llocs alhora',
  'help.guide.select-places.goal': "Canvia molts llocs alhora en lloc d'anar un per un.",
  'help.guide.select-places.step.1':
    'Fes clic a la marca de selecció del costat del camp de cerca. A les files hi apareixen caselles rodones i, a la part inferior de la columna, una barra amb les accions.',
  'help.guide.select-places.step.2':
    'Fes clic a les files per marcar-les. «Seleccionar-ho tot», la doble marca de la barra, selecciona totes les files que mostren els filtres.',
  'help.guide.select-places.step.3':
    "La barra compta els llocs marcats. «Canviar categoria» els assigna a tots la mateixa categoria; «Desar a la col·lecció» (amb «Col·leccions» activat) els copia a una de les teves col·leccions; «Elimina la selecció» els elimina després d'una confirmació.",
  'help.guide.select-places.step.4': 'Fes clic a «Fet», la X del final de la barra, per acabar la selecció.',
  'help.guide.select-places.result':
    "El canvi s'aplica a tots els llocs seleccionats; una eliminació es pot desfer des de la barra d'eines de sobre els dies.",
  'help.guide.select-places.tip.1':
    'Els filtres continuen funcionant mentre selecciones: filtra primer per «Sense planificar» i «Seleccionar-ho tot» seleccionarà només aquests llocs.',
  'help.guide.select-places.tip.2':
    '«Marca com a visitat a les teves llistes» apareix a la barra quan el complement «Col·leccions» està activat: marca els llocs com a visitats a les col·leccions on estan desats.',
  // import-places-file
  'help.guide.import-places-file.title': "Importar llocs d'un fitxer GPX, KML o KMZ",
  'help.guide.import-places-file.goal':
    'Si el complement «Excursions» està desactivat, importa com a llocs els punts i els traçats que han exportat Google My Maps, Google Earth o un localitzador GPS.',
  'help.guide.import-places-file.step.1':
    "Fes clic a «Importa llocs», el botó amb icona del costat del botó d'afegir, i tria «Importa un fitxer», o deixa anar el fitxer en qualsevol punt de la columna de llocs. Totes dues opcions només hi són si un administrador ha desactivat el complement «Excursions».",
  'help.guide.import-places-file.step.2':
    "Tria el fitxer o arrossega'l al requadre. Per a un GPX, marca què vols importar: «Punts de ruta», «Rutes», «Tracks (amb geometria de ruta)». Per a KML i KMZ, marca «Punts (Placemarks)» i «Rutes (LineStrings)».",
  'help.guide.import-places-file.step.3':
    "El requadre accepta diversos fitxers alhora, però només .gpx, .kml i .kmz. Qualsevol altre tipus de fitxer, o un de més de 10 MB, es rebutja al diàleg i no s'importa.",
  'help.guide.import-places-file.step.4':
    "Fes clic a «Importa». Un missatge indica quants llocs s'han importat. En un fitxer KML o KMZ, el diàleg es queda obert amb un resum del que s'ha creat i del que s'ha omès.",
  'help.guide.import-places-file.result':
    'Els llocs ja són a la llista. Una traça té una línia de color a la seva fila, es dibuixa al mapa i té el seu propi filtre «Rutes».',
  'help.guide.import-places-file.tip.1':
    "Si el fitxer és massa gran, es rebutja i TREK n'indica la mida màxima; torna'l a exportar sense fotos o divideix-lo.",
  'help.guide.import-places-file.tip.2': 'Pots desfer tota la importació des de la barra d’eines de sobre els dies.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importar una llista compartida de Google Maps o de Naver Maps',
  'help.guide.import-places-list.goal': 'Importa llocs a partir de l’enllaç d’una llista compartida.',
  'help.guide.import-places-list.step.1':
    "Fes clic a «Importa llocs», el botó amb icona del costat del botó d'afegir, i tria «Importa una llista».",
  'help.guide.import-places-list.step.2':
    "A «Proveïdor», tria «Llista de Google» o «Llista de Naver» i enganxa l'enllaç compartit de la llista a «Enllaç». També funciona un enllaç d'indicacions de Google Maps: les seves parades es converteixen en llocs, en l'ordre del trajecte.",
  'help.guide.import-places-list.step.3': 'Fes clic a «Importa».',
  'help.guide.import-places-list.result':
    "Tots els llocs de la llista ja són al viatge, amb el mateix nom que a la llista; els llocs que ja hi eren s'ometen.",
  'help.guide.import-places-list.tip.1':
    "La llista ha d'estar compartida públicament; l'enllaç d'una llista privada no importa res.",
  'help.guide.import-places-list.tip.2':
    '«Enriquir llocs mitjançant Google» apareix al diàleg quan el teu TREK té una clau de Google: cerca cada lloc importat i hi afegeix fotos, adreça i detalls.',
  'help.guide.sort-places.title': 'Ordenar la llista de llocs',
  'help.guide.sort-places.goal':
    "Ordena la llista per nom, per valoració o pel que s'ha afegit o modificat més recentment.",
  'help.guide.sort-places.step.1':
    "Fes clic a «Ordena per», el botó de les fletxes al final de la fila de filtres. Una marca indica l'ordre actual, i el text d'ajuda del botó en mostra el nom.",
  'help.guide.sort-places.step.2':
    "Tria un ordre, per exemple «Millor valorats», o ordena per nom. La llista s'actualitza a l'instant.",
  'help.guide.sort-places.result': "La llista mostra els llocs en l'ordre que has triat, fins que en triïs un altre.",
  'help.guide.sort-places.tip.1':
    'Amb qualsevol ordre que no sigui «Afegits recentment», el botó queda destacat, així veus de seguida que la llista està ordenada d’una altra manera.',
  'help.guide.sort-places.tip.2':
    "Ordenar només canvia la llista. Els dies mantenen el seu ordre, i el navegador recorda l'ordre que has triat.",
  'help.guide.place-by-hand.title': 'Afegir un lloc que la cerca no troba',
  'help.guide.place-by-hand.goal':
    'Introdueix tu mateix un lloc, amb telèfon, correu electrònic i horari, quan la cerca de llocs no troba res.',
  'help.guide.place-by-hand.step.1':
    'Al diàleg del lloc, escriu el nom a la cerca i prem Retorn. Si no es troba res, el diàleg t’ho indica i t’ofereix «Afegeix a mà».',
  'help.guide.place-by-hand.step.2':
    'Fes clic a «Afegeix a mà». El text que has cercat passa a ser el nom, i el diàleg es desplaça fins als camps de contacte.',
  'help.guide.place-by-hand.step.3': 'Omple «Telèfon» i «Correu electrònic» si els saps.',
  'help.guide.place-by-hand.step.4':
    "Fes clic a «Afegeix l'horari» i indica quan obre i tanca el lloc cada dia. El botó de copiar aplica a tots els dies l'horari del primer, i l'interruptor d'un dia el marca com a «Tancada».",
  'help.guide.place-by-hand.step.5': 'Fes clic a «Afegir».',
  'help.guide.place-by-hand.result':
    "El lloc s'afegeix a la llista. Als detalls hi surten el telèfon, el correu electrònic i l'horari que has introduït, igual que en un lloc trobat amb la cerca.",
  'help.guide.place-by-hand.tip.1':
    "Quan edites un lloc que no té horari propi, copia automàticament l'horari de «Detalls del lloc», a l'esquerra. Si ja en té, un botó al costat de l'horari et permet copiar el que s'ha consultat.",
  'help.guide.place-by-hand.tip.2':
    'L’horari que introdueixes substitueix el que s’ha trobat, així una cafeteria amb horari de temporada mostra l’horari que tu coneixes.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dies',
  'help.ctx.trip-days.summary':
    "La columna de l'esquerra del pla: una targeta per dia amb les parades en ordre, les notes, les reserves i els transports del dia, i la ruta entre les parades. Aquí és on es planifica realment el viatge.",
  'help.ctx.trip-days.bullet.1':
    "La capçalera de dalt: «Exporta» (PDF, calendari, GPX) a l'esquerra; a la dreta, la fletxa de desfer, «Expandeix tots els dies» / «Contreu tots els dies», «Reordena els dies» i, quan alguna reserva té una ruta per dibuixar, «Mostra totes les rutes de reserva».",
  'help.ctx.trip-days.bullet.2':
    "Una targeta de dia: una casella amb el número del dia i la previsió del temps, el títol («Dia 1» fins que li posis nom) i la data, i a sota pastilles per a l'allotjament de la nit (verda el dia d'entrada, vermella el de sortida i discontínua mentre no està confirmada; la icona del tiquet obre la reserva) i per al cotxe de lloguer. Fes clic a la capçalera per obrir el dia; la fletxa el plega, i el + («Afegeix al dia») obre un menú: «Afegeix un lloc a aquest dia», «Afegeix un allotjament», «Afegeix transport», «Transport públic» i «Afegeix una nota». Amb el botó dret a la capçalera tens les mateixes opcions i, a més, «Buida el dia».",
  'help.ctx.trip-days.bullet.3':
    "Dins d'un dia: les parades en ordre, cadascuna amb la imatge, la icona de la categoria, el nom, l'hora i la descripció, les reserves que hi estan vinculades i qui hi va; les notes; i les reserves i els transports del dia, del color del seu tipus. Passa el ratolí per sobre d'una parada per veure l'agafador, el cadenat de la imatge, les fletxes, «Afegeix una reserva» i els tres punts («Més opcions»). També pots fer clic amb el botó dret a les parades i les notes per obrir-ne el menú.",
  'help.ctx.trip-days.bullet.4':
    'Al dia obert, quan té dues parades, apareix a sota la barra de ruta: «Ruta» mostra el dia al mapa i el temps de desplaçament de cada tram entre parades, les tres icones defineixen «Cotxe», «A peu» o «Bicicleta» per al dia, i després hi ha «Optimitza», «Obre a Google Maps» i «Obre a CoMaps».',
  'help.ctx.trip-days.bullet.5':
    'Pots afegir llocs a un dia de diverses maneres: arrossegant una fila de la columna de llocs, amb «+ Dia» a la mateixa fila, amb «Afegeix un lloc a aquest dia» des del + del dia o en un dia buit, o des dels detalls del lloc.',
  'help.ctx.trip-days.bullet.6':
    '«Cost total», a baix, suma les despeses de «Pressupost» associades a les parades i reserves del dia, cadascuna una sola vegada, en la teva divisa de visualització.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Consultar un dia',
  'help.guide.read-day-plan.goal': "Entén què indica cada part d'una targeta de dia abans de canviar res.",
  'help.guide.read-day-plan.step.1':
    "La capçalera: una casella amb el número del dia i la previsió del temps, després «Dia 1» o el títol que li hagis posat, i la data. A sota, pastilles per a l'allotjament de la nit (verda el dia d'entrada, vermella el de sortida i discontínua mentre no està confirmada; el tiquet que hi ha obre la reserva) i per al cotxe de lloguer. Fes clic a la capçalera per obrir el dia (el seu panell de detalls s'obre sobre el mapa). El + de la dreta («Afegeix al dia») afegeix un lloc, una estada, un transport, una connexió de transport públic o una nota, i la fletxa plega la targeta.",
  'help.guide.read-day-plan.step.2':
    "Cada parada mostra la imatge, la icona de la categoria i el nom; després l'hora, si té «Inici», i la descripció. A sota hi ha les «Notes per a aquest dia». Quan passes el ratolí per la fila, apareixen els controls: amb l'agafador de l'esquerra l'arrossegues, la imatge es converteix en un cadenat per a l'optimització de la ruta, i a l'extrem dret hi ha les fletxes («Puja», «Baixa»), «Afegeix una reserva» i els tres punts («Més opcions»).",
  'help.guide.read-day-plan.step.3':
    "Una reserva en una parada s'hi mostra com una insígnia «Reserva», verda si està confirmada i ambre mentre està pendent, amb l'hora i la companyia. Fes clic a la insígnia per obrir la reserva; el botó de ruta del costat en dibuixa la ruta. Un transport té una fila pròpia, del color del seu tipus, amb l'hora i «Sortida» o «Arribada». Fes clic a una reserva per obrir-ne els detalls; des d'allà, «Edita» et permet modificar-la.",
  'help.guide.read-day-plan.step.4':
    "Amb «Ruta» activat, el connector entre dues parades indica quant dura el tram i quina distància té, segons el mode de desplaçament del dia; fes-hi clic per canviar el mode només d'aquell tram.",
  'help.guide.read-day-plan.step.5':
    'La barra de ruta sota les parades del dia obert: «Ruta» dibuixa el recorregut del dia al mapa, les tres icones trien «Cotxe», «A peu» o «Bicicleta», i després «Optimitza» reordena les parades, i «Obre a Google Maps» i «Obre a CoMaps» hi obren el dia.',
  'help.guide.read-day-plan.result':
    'Cada símbol de la targeta vol dir alguna cosa; les guies següents expliquen com canviar-los tots.',
  'help.guide.read-day-plan.tip.1':
    'Fes clic amb el botó dret a una parada, o als seus tres punts, per obrir-ne el menú: «Edita», «Treure del dia», «Treu de la ruta», «Obre el lloc web», «Desar a la col·lecció» i «Elimina». Les aplicacions de navegació són als detalls del lloc, a «Navegació».',
  'help.guide.read-day-plan.tip.2':
    'Passa el ratolí per sobre d’una parada i, al final de la fila, apareix «Afegeix una reserva». La reserva que hi creïs queda vinculada a aquesta parada d’aquest dia.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Afegir un lloc a un dia',
  'help.guide.place-onto-day.goal':
    "Converteix un lloc de la llista en una parada d'un dia, a la posició que li correspon.",
  'help.guide.place-onto-day.step.1':
    'Arrossega una fila de la columna de llocs fins a la targeta del dia. Deixa-la anar entre dues parades per posar-la just allà, o a la capçalera del dia per afegir-la al final.',
  'help.guide.place-onto-day.step.2':
    'Sense arrossegar: obre el dia fent clic a la seva capçalera i després fes clic al + rodó del final de la fila del lloc («+ Dia»), o fes clic amb el botó dret a la fila i tria «+ Dia».',
  'help.guide.place-onto-day.step.3':
    "«Afegeix un lloc a aquest dia», al menú + del dia o en un dia buit, obre el formulari del lloc, i el lloc nou s'afegeix al dia a l'instant.",
  'help.guide.place-onto-day.step.4':
    "Amb un dia obert, «Afegeix al dia», als detalls d'un lloc, el posa en aquell dia; «Al dia», a la capçalera de la columna de llocs, crea un lloc nou directament al dia obert.",
  'help.guide.place-onto-day.result':
    'Ara el lloc és una parada del dia. Apareix al mapa amb el número del dia, i la columna de llocs el compta a «Planificat».',
  'help.guide.place-onto-day.tip.1':
    "Un lloc pot estar en diversos dies: afegeix-lo al segon dia des de la columna de llocs. En canvi, si arrossegues una parada d'una targeta de dia a una altra, la mous.",
  'help.guide.place-onto-day.tip.2': "La fletxa de desfer de la capçalera desfà l'assignació.",
  'help.guide.place-onto-day.tip.3':
    "No pots deixar anar una parada entre dues entrades amb hora fixa ni abans d'una reserva que ja té hora; el pla es manté en ordre cronològic.",
  // reorder-stops
  'help.guide.reorder-stops.title': 'Canviar l’ordre d’un dia',
  'help.guide.reorder-stops.goal': 'Mou una parada amunt o avall, o a un altre dia.',
  'help.guide.reorder-stops.step.1':
    "Passa el ratolí per sobre de la parada i arrossega-la per l'agafador fins a la nova posició dins de la targeta.",
  'help.guide.reorder-stops.step.2':
    "També pots fer servir les fletxes de l'extrem dret de la parada quan hi passes el ratolí («Puja», «Baixa»): una posició per clic.",
  'help.guide.reorder-stops.step.3':
    "Arrossega la parada fins a la targeta d'un altre dia per moure-la-hi; desapareix del dia anterior.",
  'help.guide.reorder-stops.step.4':
    "Si una parada té una hora fixa i un moviment trencaria l'ordre del dia, TREK et pregunta «Vols eliminar l'hora?», perquè l'hora determina la posició de la parada. «Confirmar» elimina l'hora perquè la parada pugui anar a qualsevol lloc. «Cancel·la» deixa el dia com estava.",
  'help.guide.reorder-stops.result': "La ruta i els temps de desplaçament s'actualitzen a l'instant amb el nou ordre.",
  'help.guide.reorder-stops.tip.1':
    "Una reserva amb hora fixa es queda a la posició que li correspon per l'hora. Si la deixes anar en un altre punt del dia, hi torna. Si l'arrossegues a la targeta d'un altre dia, passa a aquell dia.",
  'help.guide.reorder-stops.tip.2':
    '«Optimitza», a la barra de ruta, ordena tot el dia pel camí més curt quan té tres parades o més. Bloqueja abans una parada si vols que es quedi on és.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Posar hora a una parada',
  'help.guide.set-stop-times.goal':
    'Defineix quan comença i quan acaba una parada perquè el dia funcioni com un horari.',
  'help.guide.set-stop-times.step.1':
    'Fes clic amb el botó dret a la parada, o fes clic als seus tres punts, i tria «Edita». Si obres el formulari des del dia, hi trobaràs «Inici» i «Fi» per a aquell dia, just a sota de la ubicació.',
  'help.guide.set-stop-times.step.2':
    'Introdueix «Inici» i, si vols, «Fi». «Solapament horari amb:» t’avisa que una altra parada del dia amb hora s’hi solapa. Si «Fi» és anterior a «Inici», no pots fer clic a «Actualitza».',
  'help.guide.set-stop-times.step.3':
    'Fes clic a «Actualitza». La parada mostra una etiqueta amb l’hora i es col·loca al lloc que li correspon dins del dia segons l’hora.',
  'help.guide.set-stop-times.result':
    "Les parades amb hora mantenen la seva posició, i les que no en tenen s'ordenen al seu voltant.",
  'help.guide.set-stop-times.tip.1':
    "L'hora pertany a la parada d'aquell dia; el mateix lloc en un altre dia pot tenir una altra hora.",
  'help.guide.set-stop-times.tip.2':
    "Per moure a mà una parada amb hora, arrossega-la. TREK et pregunta «Vols eliminar l'hora?» i, quan fas clic a «Confirmar», l’hora s’elimina.",
  'help.guide.set-stop-times.tip.3':
    "«Notes per a aquest dia», al mateix formulari, és per a informació que només val aquell dia, per exemple una reserva de taula o un número d'entrada.",
  // remove-from-day
  'help.guide.remove-from-day.title': "Treure una parada d'un dia",
  'help.guide.remove-from-day.goal': 'Treu un lloc d’un dia sense eliminar-lo del viatge.',
  'help.guide.remove-from-day.step.1':
    'Fes clic amb el botó dret a la parada, o als seus tres punts, i tria «Treure del dia».',
  'help.guide.remove-from-day.step.2':
    'La parada es treu del dia. El lloc continua a la columna de llocs, a «Sense planificar» si no és a cap altre dia.',
  'help.guide.remove-from-day.result':
    "El dia, la seva ruta i el seu cost s'actualitzen. La fletxa de desfer recupera la parada.",
  'help.guide.remove-from-day.tip.1':
    '«Elimina», al mateix menú, treu el lloc de tot el viatge, inclosos tots els dies.',
  'help.guide.remove-from-day.tip.2':
    '«Treure del dia» també és al panell de detalls del lloc, al costat d’«Afegeix al dia».',
  // lock-stop
  'help.guide.lock-stop.title': 'Fixar una parada al seu lloc',
  'help.guide.lock-stop.goal': "Mantén una parada al seu lloc quan s'optimitzi la ruta.",
  'help.guide.lock-stop.step.1':
    "Passa el ratolí per sobre de la imatge de la parada i fes clic al cadenat: «Mantén la posició durant l'optimització de ruta».",
  'help.guide.lock-stop.step.2':
    '«Optimitza» ara ordena les altres parades al seu voltant. Torna a fer clic al cadenat («Fes clic per desbloquejar») per desbloquejar-la.',
  'help.guide.lock-stop.result': 'El cadenat apareix a la imatge; la parada manté la posició fins que la desbloquegis.',
  'help.guide.lock-stop.tip.1':
    "Una parada amb hora fixa queda bloquejada per la seva hora; l'optimització no la mou mai.",
  'help.guide.lock-stop.tip.2':
    'El bloqueig només dura fins que tornes a carregar la pàgina. Després, totes les parades tornen a estar desbloquejades; només les parades amb hora queden fixes.',
  // day-note
  'help.guide.day-note.title': 'Afegir una nota a un dia',
  'help.guide.day-note.goal': "Desa un recordatori, un número d'entrada o un pla B dins del dia.",
  'help.guide.day-note.step.1': 'Fes clic al + de la capçalera del dia («Afegeix al dia») i tria «Afegeix una nota».',
  'help.guide.day-note.step.2':
    'Escriu el nom de la nota a dalt del diàleg, on diu «Nota». És el nom que mostra la targeta del dia. La resta, escriu-la a «Nota diària»: la barra d’eines de sobre dona format al text (negreta, llistes, enllaços, cites) i «Vista prèvia», a l’esquerra, mostra com quedarà la fila.',
  'help.guide.day-note.step.3':
    'Tria una «Icona» i un «Color» perquè la nota es distingeixi bé de les parades, i fes clic a «Afegir».',
  'help.guide.day-note.step.4':
    'La nota apareix al dia com una parada: arrossega-la on vulguis o fes servir les fletxes. Fes-hi clic per editar-la. «Elimina» és al diàleg i al menú dels tres punts o del clic dret, i abans pregunta «Vols eliminar la nota?».',
  'help.guide.day-note.result': "La nota forma part del dia i del PDF, al lloc on l'has arrossegat.",
  'help.guide.day-note.tip.1':
    "Els enllaços d'una nota s'obren en una pestanya nova, i un salt de línia es manté com a salt de línia.",
  'help.guide.day-note.tip.2': 'Les notes són de cada dia. Una nota per a tot el viatge va a «Col·laboració».',
  // day-route
  'help.guide.day-route.title': 'Mostrar i optimitzar la ruta del dia',
  'help.guide.day-route.goal':
    'Consulta la ruta entre les parades, tria com et desplaces i deixa que TREK n’ordeni la seqüència.',
  'help.guide.day-route.step.1':
    'Obre el dia i fes clic a «Ruta» a la barra de ruta de sota les parades: la ruta entre les parades es dibuixa al mapa, i els connectors entre parades mostren el temps i la distància de cada tram.',
  'help.guide.day-route.step.2':
    'Les tres icones del costat defineixen el mode de desplaçament del dia: «Cotxe», «A peu» o «Bicicleta». Els trams es tornen a calcular. Els connectors poden afegir-hi modes propis.',
  'help.guide.day-route.step.3':
    "Fes clic a un connector per canviar el mode només d'aquell tram: tria un mode, «Transport públic» per buscar-hi una connexió on estigui disponible, o «Usa el valor per defecte del dia» per tornar a fer servir el mode del dia.",
  'help.guide.day-route.step.4':
    '«Optimitza» (la fletxa circular) reordena les parades pel camí més curt, a partir de tres parades. Les parades amb cadenat o amb hora fixa mantenen la posició; si el dia té un allotjament, la ruta hi comença.',
  'help.guide.day-route.step.5':
    '«Obre a Google Maps» o «Obre a CoMaps» obre tot el dia com una ruta en aquella aplicació, per navegar pel camí; CoMaps també fa servir el mode de desplaçament del dia.',
  'help.guide.day-route.result':
    "El dia és una ruta amb horaris; «Cost total» i els trams s'actualitzen quan canvia l'ordre.",
  'help.guide.day-route.tip.1':
    "Per defecte, les rutes les calcula OSRM; l'administrador pot configurar TREK perquè faci servir un altre motor de rutes a «Valors per defecte».",
  'help.guide.day-route.tip.2':
    'Un tram que no s’ha pogut calcular no mostra cap temps. Comprova que les dues parades tinguin coordenades.',
  'help.guide.day-route.tip.3': 'La fletxa de desfer reverteix una optimització.',
  // manage-days
  'help.guide.manage-days.title': 'Afegir, reordenar i canviar el nom dels dies',
  'help.guide.manage-days.goal': 'Modifica els dies mateixos, no només els llocs que hi ha.',
  'help.guide.manage-days.step.1':
    "Els dies surten de les dates del viatge. Canvia les dates al formulari d'edició del viatge, al «Tauler», i s'afegiran o s'eliminaran dies al principi o al final. Abans d'eliminar un dia amb contingut, una llista et mostra quins dies s'eliminaran i què hi ha.",
  'help.guide.manage-days.step.2':
    "«Reordena els dies», a la capçalera, obre una llista: arrossega un dia per l'agafador, o fes servir «Puja» i «Baixa», i el dia es mou amb els seus llocs, notes i reserves. Sota la llista, «Afegeix amb la data següent» afegeix un dia després de l'últim dia amb data i allarga el viatge un dia; «Sense data» afegeix al final un dia sense data. Un viatge sense dates només té «Afegeix un dia».",
  'help.guide.manage-days.step.3':
    "«Elimina el dia», la paperera del final de cada fila, primer et demana confirmació. Mostra què s'eliminarà amb el dia: els seus llocs, notes i reserves, l'estada que hi té l'entrada o la sortida, i els dies que s'avançaran una data. «Elimina el dia» l'elimina i «Cancel·la» el manté; l'últim dia no es pot eliminar.",
  'help.guide.manage-days.step.4':
    'Per canviar el nom d’un dia, obre’l i fes clic al llapis del costat del títol, al panell de detalls de sobre el mapa. El nom substitueix «Dia 1» a la targeta i al PDF.',
  'help.guide.manage-days.step.5':
    '«Expandeix tots els dies» i «Contreu tots els dies», a la capçalera, despleguen o pleguen totes les targetes alhora. Per plegar-ne només una, fes clic a la seva fletxa.',
  'help.guide.manage-days.result':
    'Les dates van lligades a la posició: quan puges un dia, agafa la data anterior, i les seves parades, notes i reserves es mouen amb ell.',
  'help.guide.manage-days.tip.1': 'Moure dies es pot desfer amb la fletxa de desfer; eliminar un dia, no.',
  'help.guide.manage-days.tip.2':
    '«Cost total», a baix del pla, suma tot el viatge; la pestanya «Pressupost» en mostra el desglossament.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Entendre les reserves i els transports del pla',
  'help.guide.bookings-in-plan.goal': 'Mira on apareix una reserva un cop creada i des de quina pantalla es crea.',
  'help.guide.bookings-in-plan.step.1':
    "Un transport (vol, tren, ferri, autobús, cotxe) és una fila del color del seu tipus, amb l'hora i «Sortida» el dia que surt o «Arribada» el dia que arriba; el globus del costat indica el fus horari, i un vol amb escala té una fila per tram. En una connexió de transport públic, fes clic a la fletxa per veure'n les línies. Fes clic a una fila per obrir la reserva; des d'allà, «Edita» et permet modificar-la.",
  'help.guide.bookings-in-plan.step.2':
    'Una reserva vinculada a una parada (un restaurant, una excursió) apareix en aquella parada com una etiqueta «Reserva» amb l’hora. L’etiqueta és verda si està confirmada i ambre mentre està pendent. Una reserva amb dia però sense parada té una fila pròpia dins del dia.',
  'help.guide.bookings-in-plan.step.3':
    "Una nit d'hotel és un allotjament: la seva pastilla a la capçalera del dia és verda el dia d'entrada i vermella el de sortida, i la icona del tiquet obre la reserva. El panell de detalls del dia el mostra a «Allotjament», i la ruta de cadascun d'aquests dies hi comença.",
  'help.guide.bookings-in-plan.step.4':
    "Al mapa, el botó de ruta d'una fila de reserva en dibuixa la ruta; «Mostra totes les rutes de reserva», a la capçalera, les dibuixa totes.",
  'help.guide.bookings-in-plan.step.5':
    'Per crear-ne: «Afegeix una reserva» en passar el ratolí per una parada, «Afegeix transport» i «Transport públic» al menú + del dia, i les pestanyes «Reserves» i «Transports» per a la llista completa, amb importació i fitxers.',
  'help.guide.bookings-in-plan.result':
    'Cada reserva apareix una sola vegada al pla. Les pestanyes mostren les mateixes reserves en forma de llista.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmat i pendent és un estat que defineixes a la reserva; el pla el mostra a la parada, i la pestanya «Reserves» els compta tots dos.',
  'help.guide.bookings-in-plan.tip.2':
    "Si deixes anar una reserva amb hora en un altre punt del seu dia, torna a la posició que li correspon per l'hora. Si l'arrossegues a la targeta d'un altre dia, passa a aquell dia. Per canviar-ne l'hora, edita la reserva.",
  // export-plan
  'help.guide.export-plan.title': 'Exportar el pla',
  'help.guide.export-plan.goal': 'Exporta el pla com a document, al calendari o a un dispositiu GPS.',
  'help.guide.export-plan.step.1': "Fes clic a «Exporta», a l'esquerra de la capçalera de sobre els dies.",
  'help.guide.export-plan.step.2':
    "Document: PDF obre la vista d'impressió de tots els dies amb les parades, les notes i les reserves, començant per un mapa general de la ruta; «El meu pla en PDF» només inclou allò en què participes. A la vista, «Salt de pàgina per dia» comença cada dia en una pàgina nova, «Notes del transport» hi afegeix les notes dels teus transports i «Desa com a PDF» el baixa.",
  'help.guide.export-plan.step.3':
    "«Calendari»: «Baixa .ics» desa les reserves en un fitxer de calendari; «Subscriu-te al calendari» et dona un enllaç que l'aplicació de calendari actualitza automàticament.",
  'help.guide.export-plan.step.4':
    '«Mapes i GPS» (GPX): «Tot el viatge» exporta els llocs, les rutes dels dies i les traces; «Només els llocs», només els punts; «Dies com a rutes», una ruta per dia, per a mapes sense connexió i dispositius GPS.',
  'help.guide.export-plan.result': 'El fitxer es baixa i el viatge no canvia gens.',
  'help.guide.export-plan.tip.1':
    'Per obrir un sol dia en una aplicació de mapes, fes servir la seva barra de ruta: «Obre a Google Maps» o «Obre a CoMaps».',
  'help.guide.export-plan.tip.2':
    'Per a «Subscriu-te al calendari» cal tenir activats els feeds de calendari a la configuració i permís per compartir el viatge; a «Tauler» hi ha una guia sobre això.',
  'help.guide.export-plan.tip.3':
    "Per exportar n'hi ha prou amb permís de lectura: tots els membres del viatge poden exportar el PDF, l'.ics i el GPX.",

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detalls del lloc',
  'help.ctx.trip-place.summary':
    "La targeta que s'obre sobre el mapa quan tries un lloc: tot el que en sap el viatge, les valoracions amb estrelles que li ha donat tothom, la imatge i els fitxers, i els botons per afegir-lo al dia obert, obrir-lo en una aplicació de mapes o desar-lo en una llista.",
  'help.ctx.trip-place.bullet.1':
    "Fes clic a una fila de la columna de llocs, a una parada dins d'un dia o a un marcador del mapa, i la targeta s'obrirà sobre el mapa. Si l'obres des d'un dia, la targeta sap de quina parada es tracta i també en mostra els participants i la reserva. Una excursió (una caminada, una ruta o un passeig de la pestanya «Excursions») obre la seva pròpia targeta d'excursió en lloc d'aquesta.",
  'help.ctx.trip-place.bullet.2':
    "La capçalera mostra la imatge rodona, el nom, l'adreça en una línia i etiquetes amb el que se'n sap: obert o tancat, la categoria, l'hora, el preu, el telèfon, el correu electrònic i les coordenades. Fes clic a la imatge per posar-ne una de teva o una foto dels fitxers del lloc. Fes doble clic al nom per canviar-lo. La X de la dreta tanca la targeta. La imatge, el canvi de nom, «Edita» i «Elimina» només estan disponibles per als viatgers que poden modificar llocs.",
  'help.ctx.trip-place.bullet.3':
    'A sota: les estrelles que cada viatger ha donat al lloc, la descripció, les notes i, si la parada en té, «Notes per a aquest dia».',
  'help.ctx.trip-place.bullet.4':
    "Després hi ha «Horari d'obertura», «Color de la ruta», «Dades de la ruta» i «Fitxers», si escau. «Pujar», al títol «Fitxers», afegeix fitxers de l'ordinador, i la llista també mostra els fitxers fixats a aquesta parada i els de la seva reserva, inclosa la confirmació d'un hotel. Els connectors hi poden afegir les seves pròpies files a sota.",
  'help.ctx.trip-place.bullet.5':
    "La fila de baix: «Afegeix al dia» o «Treure del dia» si hi ha un dia obert, després «Navegació» (o el nom de la teva aplicació de mapes, si n'has triat una a «Configuració»), «Obre el lloc web» i «Desar a la col·lecció». A la dreta, la paperera vermella elimina el lloc i «Edita» n'obre el formulari.",
  'help.ctx.trip-place.bullet.6':
    "Un lloc que has triat de la cerca mostra el que en saben l'índex de TREK o OpenStreetMap: «Obert» o «Tancada» entre les pastilles de dalt, amb un anell verd o vermell al voltant de la imatge, segons l'hora local del lloc; el telèfon, també com a pastilla; «Horari d'obertura» més avall, amb l'horari d'avui a la fila i tota la setmana amb un clic; i el lloc web a «Obre el lloc web». La valoració de Google només es mostra en llocs trobats amb Google, en un TREK amb clau de Google. L'horari d'obertura, el telèfon i el correu electrònic que hagis escrit tu mateix al formulari del lloc substitueixen els consultats i també determinen el color de l'anell.",
  // read-place
  'help.guide.read-place.title': "Què et diu la targeta d'un lloc",
  'help.guide.read-place.goal': "Consulta en una sola targeta tot el que sap el viatge d'un lloc.",
  'help.guide.read-place.step.1':
    'A la columna de dies, fes clic a la parada que vols consultar. La fitxa s’obre damunt del mapa i la parada queda marcada al seu dia.',
  'help.guide.read-place.step.2':
    "A dalt: la imatge rodona, el nom i l'adreça en una línia; el text d'ajuda mostra l'adreça completa. Les pastilles de sota indiquen si ara és «Obert» o «Tancada», segons l'hora local del lloc, amb un anell verd o vermell al voltant de la imatge. També mostren la categoria, l'hora, el telèfon i el correu electrònic (fes-hi clic per obrir l'aplicació de telèfon o de correu) i, en una pantalla ampla, les coordenades exactes. La X de la dreta tanca la targeta.",
  'help.guide.read-place.step.3':
    '«Valoració» és la primera secció sota la capçalera: les estrelles que cada viatger ha donat al lloc, amb la mitjana i el nombre de vots. Mentre ningú no ha votat, hi diu «Encara sense valoració».',
  'help.guide.read-place.step.4':
    'Després hi ha la descripció i, a sota, les notes. Totes dues mostren el text del formulari del lloc amb format: les llistes, els enllaços i la negreta funcionen.',
  'help.guide.read-place.step.5': '«Participants» mostra qui va a aquesta parada. Hi és tothom fins que en treus algú.',
  'help.guide.read-place.step.6':
    '«Horari d’obertura», més avall: la fila mostra l’horari del dia que estàs consultant. Fes-hi clic per veure tota la setmana, amb aquell dia en negreta. Al costat hi ha «Fitxers».',
  'help.guide.read-place.result':
    "La targeta es queda oberta fins que la tanques amb la X o tries un altre lloc. L'horari de la setmana es queda desplegat, i la parada corresponent continua marcada a la columna de dies.",
  'help.guide.read-place.tip.1':
    "Quan tries el lloc a la columna de llocs, la targeta mostra el lloc però no la parada. Per això no mostra participants i només mostra les reserves que pertanyen al lloc mateix, com l'estada d'un hotel. Tria la parada dins del dia per veure-ho tot.",
  'help.guide.read-place.tip.2':
    'Si pots modificar llocs, fes doble clic al nom per canviar-lo sense obrir el formulari. Retorn desa el canvi i Esc el cancel·la.',
  'help.guide.read-place.tip.3':
    "Un lloc introduït a mà només té les dades que s'han escrit al seu formulari. Fes clic a «Edita» i omple tu mateix «Telèfon», «Correu electrònic» i l'horari, o tria el lloc entre els suggeriments de «Cerca llocs…» i fes clic a «Actualitza» perquè es consultin. La valoració de Google necessita una clau de Google.",
  // rate-place
  'help.guide.rate-place.title': 'Valorar un lloc',
  'help.guide.rate-place.goal':
    'Posa les teves estrelles a un lloc i consulta les valoracions que n’han fet els altres.',
  'help.guide.rate-place.step.1':
    "Obre el lloc. La fila d'estrelles és just sota la capçalera i mostra la mitjana dels vots fins ara, amb el nombre de vots entre parèntesis.",
  'help.guide.rate-place.step.2':
    "Fes clic a l'estrella que vulguis. Les estrelles s'omplen quan hi passes el punter per sobre, així veus quina valoració donaràs.",
  'help.guide.rate-place.step.3':
    'El teu vot es compta a la mitjana a l’instant, i les cares del costat mostren qui ha votat. Passa el ratolí per sobre de la fila per veure les estrelles de tothom.',
  'help.guide.rate-place.step.4':
    'La mateixa mitjana apareix a la fila del lloc a la columna de llocs, així trobaràs fàcilment els millors llocs de la llista.',
  'help.guide.rate-place.result':
    "Tots els membres del viatge veuen les teves estrelles al lloc. Ara l'estrella de la fila de filtres de sobre la llista pot mostrar només els llocs amb una valoració mínima.",
  'help.guide.rate-place.tip.1':
    'Tots els viatgers poden valorar, fins i tot en un viatge on només alguns poden modificar llocs.',
  'help.guide.rate-place.tip.2':
    'Fes clic a l’estrella que ja havies donat per eliminar la teva valoració. Si ningú no ha valorat el lloc, torna a mostrar «Encara sense valoració».',
  'help.guide.rate-place.tip.3':
    'Al costat de les estrelles es mostren fins a sis votants com a cares. La indicació emergent els llista tots i et marca a tu.',
  // place-image
  'help.guide.place-image.title': 'Posar una imatge pròpia a un lloc',
  'help.guide.place-image.goal': 'Substitueix la miniatura automàtica per una foto teva.',
  'help.guide.place-image.step.1': 'Obre el lloc des de la columna de llocs.',
  'help.guide.place-image.step.2':
    "Passa el ratolí per la imatge rodona de la capçalera: apareix una càmera i el text d'ajuda diu «Puja una imatge». Fes-hi clic i tria el fitxer. Si el lloc ja té fotos entre els seus fitxers, TREK primer et demana que triïs: «Puja des del dispositiu» o una de les imatges de «Dels fitxers adjunts».",
  'help.guide.place-image.step.3':
    'Ara la part de dalt de la targeta mostra la teva imatge, amb una petita X vermella a la cantonada.',
  'help.guide.place-image.step.4':
    'La mateixa imatge també apareix a la fila del lloc a la columna de llocs i al seu marcador al mapa.',
  'help.guide.place-image.result':
    'La teva imatge es fa servir per al lloc a tot arreu: la fitxa, la columna de llocs, la parada del dia, el marcador del mapa i els viatges compartits.',
  'help.guide.place-image.tip.1':
    "S'accepten JPG, PNG, GIF i WebP, i les imatges HEIC d'un iPhone es converteixen en pujar-les.",
  'help.guide.place-image.tip.2':
    "La X de la cantonada treu la teva imatge i torna a mostrar l'automàtica. El lloc no canvia.",
  'help.guide.place-image.tip.3':
    'Si no hi has afegit cap imatge, TREK en busca una a partir de les coordenades del lloc. Si no en troba cap, mostra la icona de la categoria. Només els viatgers que poden modificar llocs poden posar-ne una.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Afegir el lloc al dia obert o treure’l',
  'help.guide.place-day-assign.goal': 'Fes servir el botó de la fitxa en lloc d’arrossegar la fila pel planificador.',
  'help.guide.place-day-assign.step.1':
    "Fes clic a la capçalera d'un dia a la columna de dies. Aquell dia passa a ser el dia obert, i la targeta s'hi aplica.",
  'help.guide.place-day-assign.step.2':
    "Fes clic a la columna de llocs en un lloc que no sigui en aquell dia. S'obre la seva targeta, i la fila de baix ofereix «Afegeix al dia».",
  'help.guide.place-day-assign.step.3':
    'Fes clic a «Afegeix al dia». La parada s’afegeix al final del dia i el botó passa a dir «Treure del dia».',
  'help.guide.place-day-assign.step.4':
    'La parada ja és al dia, al final de la llista. Arrossega-la amunt fins a la posició que vulguis.',
  'help.guide.place-day-assign.step.5':
    '«Treure del dia» torna a treure la parada del dia, i la targeta torna a mostrar «Afegeix al dia».',
  'help.guide.place-day-assign.result': 'La parada s’afegeix al dia o se’n treu. El lloc en si no canvia.',
  'help.guide.place-day-assign.tip.1':
    'El botó només apareix si hi ha un dia obert. Sense cap dia obert, no hi ha cap dia on afegir el lloc.',
  'help.guide.place-day-assign.tip.2':
    "Si treus una parada d'un dia, el lloc continua al viatge i a la columna de llocs. «Elimina» el treu de tot arreu.",
  'help.guide.place-day-assign.tip.3':
    "Una parada que ha afegit al dia una reserva d'allotjament no mostra cap dels dos botons. Aquella nit s'afegeix i es treu des del bloc de l'allotjament del dia.",
  // place-participants
  'help.guide.place-participants.title': 'Indicar qui va a aquesta parada',
  'help.guide.place-participants.goal': 'Tria qui va a una parada sense canviar qui participa en el viatge.',
  'help.guide.place-participants.step.1':
    "Fes clic a la parada dins del dia. S'obre la targeta i a «Participants» hi surt tothom del viatge.",
  'help.guide.place-participants.step.2':
    'Fes clic a la fitxa d’un viatger per treure’l d’aquesta parada. Quan hi passes el ratolí per sobre, el nom apareix ratllat.',
  'help.guide.place-participants.step.3':
    'Quan hi falta algú, apareix un + amb vora discontínua. Fes-hi clic per veure qui no és a la parada.',
  'help.guide.place-participants.step.4':
    'Fes clic a un nom per tornar a afegir aquella persona. Quan tothom torna a ser-hi, la parada torna a ser de tot el grup.',
  'help.guide.place-participants.result':
    'La parada només mostra els viatgers que has triat. La resta del grup té aquell temps lliure.',
  'help.guide.place-participants.tip.1':
    '«Participants» només apareix quan hi ha una parada seleccionada, així que tria el lloc dins del dia i no a la columna de llocs. A més, només apareix en viatges amb més d’un viatger.',
  'help.guide.place-participants.tip.2':
    "Si no hi ha ningú triat, hi va tothom. Per això no pots treure l'últim viatger d'una parada.",
  'help.guide.place-participants.tip.3':
    'Un convidat, que no té compte propi, també pot ser participant com qualsevol altra persona.',
  // place-booking
  'help.guide.place-booking.title': 'La reserva d’una parada',
  'help.guide.place-booking.goal': 'Consulta la reserva d’una parada, obre-la i vincula-n’hi una de nova.',
  'help.guide.place-booking.step.1':
    'Obre la parada a què pertany la reserva. La targeta la mostra a «Reserves» com una petita targeta pròpia, amb el nom de la reserva i «Confirmat» o «Pendent».',
  'help.guide.place-booking.step.2':
    "La targeta de la reserva mostra la «Data», l'hora i el «Codi de reserva», etiquetes amb altres dades de la reserva (un número de vol, una andana, el registre d'entrada) i les notes que tingui.",
  'help.guide.place-booking.step.3': "Fes clic a la targeta de la reserva. La reserva s'obre sobre el mapa.",
  'help.guide.place-booking.step.4':
    '«Edita», a la part de baix de la reserva, n’obre el formulari. En aquest formulari, «Vincula a una assignació del dia» vincula una reserva a una parada, i ja hi apareix aquesta parada. Torna a tancar el formulari.',
  'help.guide.place-booking.step.5':
    "Les reserves noves per a una parada es creen a la columna dels dies: passa el ratolí per sobre de la parada i fes clic a «Afegeix una reserva», la icona del tiquet que té al final. El formulari s'obre com a «Reserva nova», ja vinculat a la parada.",
  'help.guide.place-booking.result':
    'La reserva queda vinculada a la parada: es mostra a la targeta i al dia, i els seus fitxers també apareixen aquí, a «Fitxers».',
  'help.guide.place-booking.tip.1':
    "Una reserva apareix a la parada on està fixada, i una reserva d'hotel també apareix a l'hotel, l'obris on l'obris. Una reserva sense parada apareix a la pestanya «Reserves».",
  'help.guide.place-booking.tip.2':
    'Una parada pot tenir diverses reserves, per exemple un dinar i una visita guiada que comencen al mateix lloc.',
  'help.guide.place-booking.tip.3':
    'En un tren, un vol o un ferri, «Edita» obre en canvi el formulari de transport, el mateix que fa servir la pestanya «Transports».',
  // place-files
  'help.guide.place-files.title': 'Desar les entrades d’un lloc amb el mateix lloc',
  'help.guide.place-files.goal': 'Adjunta el bitllet, el val o el plànol al lloc corresponent.',
  'help.guide.place-files.step.1':
    "Obre el lloc. «Fitxers» és sota els detalls, al costat d'«Horari d'obertura» si el lloc en té, i es mostra com a «Fitxers» mentre el lloc no en tingui cap.",
  'help.guide.place-files.step.2': 'Fes clic a «Pujar», a la dreta del títol «Fitxers», i tria el fitxer.',
  'help.guide.place-files.step.3': "El botó mostra quants fitxers té el lloc, i la llista s'obre automàticament.",
  'help.guide.place-files.step.4': 'Cada fila mostra el nom i la mida del fitxer. Fes-hi clic per obrir el fitxer.',
  'help.guide.place-files.result':
    'El fitxer queda adjuntat al lloc i es compta a la targeta. També apareix a la pestanya «Fitxers» del viatge.',
  'help.guide.place-files.tip.1':
    "«Fitxers» també mostra el que està fixat a aquesta parada i el que està adjunt a la seva reserva, de manera que la confirmació de l'hotel apareix a l'hotel.",
  'help.guide.place-files.tip.2':
    "«Pujar» admet diversos fitxers alhora, i una foto d'entre ells pot ser la imatge del lloc.",
  'help.guide.place-files.tip.3':
    'Si no tens permís per pujar fitxers, el botó «Pujar» no apareix; els fitxers que ja té el lloc es continuen mostrant.',
  // place-navigation
  'help.guide.place-navigation.title': 'Obrir un lloc en una aplicació de mapes o al seu web',
  'help.guide.place-navigation.goal': 'Obre el lloc a l’aplicació de navegació que fas servir per arribar-hi.',
  'help.guide.place-navigation.step.1': 'Obre el lloc i fes clic a «Navegació», a la fila de baix.',
  'help.guide.place-navigation.step.2':
    'La llista inclou les aplicacions de mapes adequades per a aquest lloc: Google Maps, Waze, Apple Maps, OpenStreetMap i CoMaps, i també «Una altra app de mapes» a Android.',
  'help.guide.place-navigation.step.3':
    "Fes clic a la que facis servir. Quan és possible, TREK envia a l'aplicació el lloc mateix, no només les coordenades, perquè arribis a l'entrada correcta.",
  'help.guide.place-navigation.step.4':
    'Al costat, «Obre el lloc web» obre el web del lloc, amb els horaris i les entrades, en una pestanya nova.',
  'help.guide.place-navigation.result':
    "L'aplicació de mapes s'obre al lloc, el lloc web s'obre en una pestanya nova i no canvia res del viatge. Si tens TREK instal·lat com a aplicació, s'obre l'aplicació de mapes en lloc d'una pestanya nova.",
  'help.guide.place-navigation.tip.1':
    'Waze comença a navegar de seguida. Les altres aplicacions obren el lloc i has de tocar una vegada més per iniciar la navegació.',
  'help.guide.place-navigation.tip.2':
    "Les aplicacions que s'ofereixen depenen del lloc i del dispositiu: Apple Maps no s'ofereix a Android, 高德地图 només s'ofereix per a llocs de la Xina, i Waze, Apple Maps i CoMaps necessiten les coordenades del lloc. «Una altra app de mapes» obre el lloc en qualsevol aplicació de mapes del teu telèfon Android.",
  'help.guide.place-navigation.tip.3':
    "Tria un cop la teva aplicació de mapes a «Configuració», a «Obre els llocs a». A partir d'aleshores, el botó mostra el seu nom i l'obre directament. Fa el mateix quan només hi ha una aplicació adequada per al lloc.",
  // place-to-collection
  'help.guide.place-to-collection.title': 'Desar un lloc en una de les teves llistes',
  'help.guide.place-to-collection.goal': 'Guarda per al proper viatge un lloc que has trobat en aquest.',
  'help.guide.place-to-collection.step.1':
    'Obre el lloc i fes clic a «Desar a la col·lecció» a la fila de la part inferior de la targeta.',
  'help.guide.place-to-collection.step.2':
    '«Desar a la llista» mostra totes les llistes que tens o que comparteixes. Un marcador ple a la dreta indica les llistes que ja contenen aquest lloc.',
  'help.guide.place-to-collection.step.3': 'Fes clic a la llista. El lloc s’hi afegeix immediatament.',
  'help.guide.place-to-collection.step.4': 'Tanca el diàleg amb la X; el botó de la targeta ara diu «Desat».',
  'help.guide.place-to-collection.result':
    "El lloc ja és a la teva llista amb la imatge, les notes i l'adreça, a punt per al proper viatge.",
  'help.guide.place-to-collection.tip.1':
    "El botó només apareix si el complement «Col·leccions» està activat; l'administrador l'activa a «Complements».",
  'help.guide.place-to-collection.tip.2':
    'Un lloc pot ser a diverses llistes alhora, amb un estat diferent a cadascuna: una idea en una i visitat en una altra.',
  'help.guide.place-to-collection.tip.3':
    '«Marca com a visitat», sota el nom del lloc a dalt del selector, marca el lloc com a visitat a la llista. Si el lloc és en diverses de les teves llistes, el botó diu «Visitat pertot» i el marca a totes alhora. «Vista» obre les teves llistes a «Col·leccions».',
  // place-track
  'help.guide.place-track.title': 'Llegir una traça i donar-li un color propi',
  'help.guide.place-track.goal':
    "Consulta la llargada d'una ruta a peu importada i identifica quina línia del mapa és la seva.",
  'help.guide.place-track.step.1':
    'A la columna de llocs, la fila d’un traçat mostra una línia curta del mateix color que el traçat al mapa. Fes-hi clic.',
  'help.guide.place-track.step.2':
    '«Dades de la ruta» indica la longitud del recorregut en les unitats que hagis triat.',
  'help.guide.place-track.step.3':
    '«Color de la ruta», a sobre, mostra el color actual. Fes clic a la fila per obrir les mostres de color.',
  'help.guide.place-track.step.4': 'Tria un color. La línia del mapa i el traç de la fila canvien alhora.',
  'help.guide.place-track.step.5':
    'La casella amb vora discontínua de l’esquerra, «Color automàtic», torna a donar a la traça el color predeterminat. El comptagotes de la dreta obre el selector de colors del sistema per triar-ne qualsevol altre.',
  'help.guide.place-track.result':
    'La traça es dibuixa amb el color que has triat, a la targeta, a la seva fila de la columna de llocs i al mapa.',
  'help.guide.place-track.tip.1':
    "Només els llocs amb un traçat tenen aquests dos blocs: un lloc importat d'un fitxer GPX, KML o KMZ abans que existís «Excursions», o en un TREK amb «Excursions» desactivat. Quan «Excursions» està activat, un fitxer GPX nou es converteix en una excursió, que obre la seva pròpia targeta d'excursió.",
  'help.guide.place-track.tip.2':
    'Si la ruta es va enregistrar amb altituds, també mostra el punt més alt i el més baix, el desnivell positiu i negatiu i el perfil del recorregut.',
  'help.guide.place-track.tip.3':
    'Cada importació dona un color propi a cada traçat que afegeix, així dues caminades no tenen mai el mateix color.',
  // read-place
  'help.guide.read-place.step.7':
    "La fila de baix recull què pots fer des d'aquí: posar el lloc al dia obert o treure'l, obrir-lo en una aplicació de mapes o al seu lloc web, desar-lo en una llista i, a la dreta, eliminar-lo (la paperera vermella) o editar-lo.",

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Fitxers',
  'help.ctx.trip-files.summary':
    'Tots els documents del viatge en una sola llista: bitllets, confirmacions, passis i imatges. Cadascun té una nota, un vincle al lloc o a la reserva a què correspon i una paperera des d’on el pots recuperar.',
  'help.ctx.trip-files.bullet.1':
    "«Arrossega els fitxers aquí», el requadre discontinu de sota la barra, accepta els fitxers que hi deixes anar. Un clic al requadre obre el selector de fitxers. El requadre mostra els tipus de fitxer que accepta aquest TREK i el límit per fitxer (màx. 50 MB, tret que un administrador n'hagi fixat un altre).",
  'help.ctx.trip-files.bullet.2':
    "La barra de dalt conté «Fitxers» i les pestanyes de filtre «Tots», «PDF», «Imatges» i «Documents», cadascuna amb el seu recompte. Una pestanya d'estrella apareix després de «Tots» tan bon punt hi ha algun fitxer destacat, i una pestanya «Notes de col·laboració» apareix al final tan bon punt alguna nota té un adjunt.",
  'help.ctx.trip-files.bullet.3':
    "Cada fila mostra una miniatura o el tipus de fitxer, qui l'ha pujat, el nom, la nota a sota, la mida i la data, i una insígnia per vincle: el lloc, la reserva o el transport, amb el seu nom (passa-hi el ratolí per veure «Pla diari», «Reserva» o «Transport»), i «Des de notes de col·laboració».",
  'help.ctx.trip-files.bullet.4':
    "Al final de cada fila hi ha fins a cinc icones, i cadascuna mostra el nom quan hi passes el ratolí: «Destaca», «Assigna» (el llapis), «Obert», «Baixa» i «Elimina». «Elimina» no demana confirmació: el fitxer va a la paperera, d'on el pots recuperar. Sense connexió, les notes, els vincles, les estrelles i la paperera continuen funcionant i s'envien quan TREK torna a estar en línia; només pujar fitxers i treure un altre vincle necessiten connexió.",
  'help.ctx.trip-files.bullet.5':
    'Les imatges i els vídeos s’obren a pantalla completa, amb les tecles de fletxa i una fila de miniatures. La resta de documents s’obren en un diàleg amb el nom a dalt i, a sota, «Obre en una pestanya nova» i «Baixa». Les targetes de cartera digital es baixen directament.',
  'help.ctx.trip-files.bullet.6':
    "La icona de paperera a l'extrem dret de la barra («Paperera») mostra els fitxers eliminats. Allà pots restaurar-los un per un o eliminar-los per sempre, i «Buida la paperera», a la barra, els elimina tots. «Sincronització de documents» és a l'esquerra de la icona de paperera quan el viatge està connectat a un magatzem de documents, o bé per al propietari del viatge o un administrador tan bon punt s'activa un magatzem.",
  // files-upload
  'help.guide.files-upload.title': 'Afegir un document al viatge',
  'help.guide.files-upload.goal':
    'Puja al viatge un bitllet, una confirmació o una foto de la carpeta de baixades, perquè tots els membres del viatge la puguin obrir.',
  'help.guide.files-upload.step.1':
    'Obre el viatge i fes clic a «Fitxers» a la barra de pestanyes. Hi trobaràs els documents del viatge, amb el quadre per pujar-ne a sobre.',
  'help.guide.files-upload.step.2':
    "Fes clic a «Arrossega els fitxers aquí» i tria un o diversos fitxers. Es pugen un darrere l'altre i, mentrestant, el requadre diu «Pujant...». Dins del requadre, sota «o fes clic per explorar», veuràs els tipus de fitxer que accepta aquest TREK i la mida màxima per fitxer.",
  'help.guide.files-upload.step.3':
    "Quan l'últim fitxer s'ha acabat de pujar, s'obre automàticament «Assigna el fitxer» (si el viatge té llocs o reserves), amb el nom del fitxer a dalt del diàleg. «Afegeix una nota...», a «Nota», afegeix una nota al fitxer, i les llistes de sota el vinculen a un lloc o a una reserva. Tanca'l amb la × de dalt a la dreta; en tancar-lo no es perd res.",
  'help.guide.files-upload.step.4':
    'Els fitxers nous apareixen a dalt de la llista; només els destacats queden per sobre. Cada fila mostra qui ha pujat el fitxer, el nom, la mida i la data. Una imatge té miniatura, i qualsevol altre fitxer en mostra el tipus.',
  'help.guide.files-upload.result':
    'Els documents són al viatge, i tothom qui pot veure el viatge els pot obrir i baixar.',
  'help.guide.files-upload.tip.1':
    "També pots arrossegar un fitxer des de l'escriptori directament al quadre, que es ressalta mentre el fitxer hi és a sobre.",
  'help.guide.files-upload.tip.2':
    "Prem Ctrl+V per afegir a la llista una imatge del porta-retalls; així no cal que desis abans la captura de pantalla d'una reserva.",
  'help.guide.files-upload.tip.3':
    "Per pujar fitxers cal tenir-ne permís; sense permís, el requadre ni tan sols apareix. Un tipus que no és a la llista es rebutja amb un missatge i no es puja res. Un fitxer que supera el límit (50 MB, tret que un administrador n'hagi fixat un altre) es rebutja abans d'enviar res, i el missatge indica el límit. Per pujar també cal connexió: sense connexió, TREK t'ho diu i no puja res.",
  // files-link
  'help.guide.files-link.title': 'Vincular un document a un lloc o a una reserva',
  'help.guide.files-link.goal':
    'Fes que el bitllet sigui fàcil de trobar des del dia a què correspon, i no només des d’aquesta llista.',
  'help.guide.files-link.step.1':
    "Fes clic al llapis del final de la fila («Assigna»). S'obre «Assigna el fitxer», amb el nom del fitxer a dalt del diàleg.",
  'help.guide.files-link.step.2':
    'A «Nota», «Afegeix una nota...» admet una línia, que després apareix sota el nom del fitxer a la llista. Es desa quan prems Retorn o surts del camp.',
  'help.guide.files-link.step.3':
    'A «Lloc», a l’esquerra, hi ha els llocs del viatge agrupats per dia amb la data, i al final «Sense assignar» per als llocs que no són en cap dia. Fes clic en un per marcar-lo.',
  'help.guide.files-link.step.4':
    'A «Reserva i transport», a la dreta, hi ha les reserves del viatge. Fes clic a la que correspon al document; també queda marcada.',
  'help.guide.files-link.step.5':
    "Tanca amb la × de dalt a la dreta. Aquí no hi ha cap botó de desar: cada clic s'ha desat a l'instant.",
  'help.guide.files-link.result':
    'La fila mostra la nota i una etiqueta per vincle: una amb el nom del lloc i una altra amb el nom del vol. Si passes el ratolí per sobre d’una etiqueta, hi diu «Pla diari» o «Transport». El document també queda adjuntat al lloc i al vol.',
  'help.guide.files-link.tip.1':
    'Un fitxer pot tenir diversos vincles alhora, així que una mateixa confirmació pot correspondre alhora a la reserva de l’hotel i al lloc de l’hotel.',
  'help.guide.files-link.tip.2':
    "Torna a fer clic a una entrada marcada per treure aquest vincle; el fitxer es manté. Sense connexió, la nota i les noves marques es desen i s'envien quan TREK torna a estar en línia; només per treure un altre vincle cal connexió.",
  'help.guide.files-link.tip.3':
    "També funciona a l'inrevés: un document adjuntat a un lloc o a una reserva també apareix en aquesta llista, amb la mateixa insígnia a la seva fila.",
  // files-star
  'help.guide.files-star.title': 'Mantenir a dalt els documents importants',
  'help.guide.files-star.goal':
    'Marca els pocs documents que de debò necessitaràs, perquè els trobis ràpidament en una llista llarga.',
  'help.guide.files-star.step.1':
    "Fes clic a l'estrella del final d'una fila («Destaca»). Es torna daurada, apareix una segona estrella davant del nom del fitxer i, si passes el ratolí per sobre del botó, ara hi diu «Treure el destacat».",
  'help.guide.files-star.step.2':
    'La llista es torna a ordenar: els fitxers destacats queden per sobre de tots els altres, i dins de cada grup els més nous van primer.',
  'help.guide.files-star.step.3':
    'Ara apareix una estrella a les pestanyes de filtre de la barra, just després de «Tots», amb el nombre de fitxers destacats al costat. Fes-hi clic per veure només aquests fitxers.',
  'help.guide.files-star.result':
    'Els fitxers destacats es mostren a dalt de tot de la llista, i hi ha una pestanya que només mostra els destacats.',
  'help.guide.files-star.tip.1':
    "La pestanya d'estrella només existeix mentre hi ha algun fitxer destacat. Quan en treus el destacat de l'últim fitxer, la pestanya desapareix.",
  'help.guide.files-star.tip.2':
    'Per destacar cal el mateix permís que per a «Assigna», «Edita les metadades del fitxer». Un membre sense aquest permís veu les estrelles, però un clic a «Destaca» no canvia res.',
  // files-filter
  'help.guide.files-filter.title': 'Trobar un document a la llista',
  'help.guide.files-filter.goal': 'Mostra només el tipus de document que busques.',
  'help.guide.files-filter.step.1':
    'Les pestanyes de filtre són a la barra de dalt, al costat de «Fitxers»: «Tots», «PDF», «Imatges» i «Documents», cadascuna amb el nombre de fitxers al costat.',
  'help.guide.files-filter.step.2': 'Fes clic a «PDF»: la llista només mostra els fitxers PDF.',
  'help.guide.files-filter.step.3':
    'Hi ha dues pestanyes més que només apareixen si el viatge té fitxers d’aquell tipus. Fes clic a «Notes de col·laboració», que apareix quan una nota de la pestanya «Col·laboració» té un fitxer adjunt: llavors la llista només mostra aquests fitxers. La pestanya d’estrella apareix de la mateixa manera, quan destaques un fitxer.',
  'help.guide.files-filter.step.4': '«Tots» torna a mostrar tota la llista.',
  'help.guide.files-filter.result':
    "La llista només mostra els fitxers de la pestanya seleccionada, i el recompte de cada pestanya indica quants n'hi ha.",
  'help.guide.files-filter.tip.1':
    'Aquí no hi ha carpetes i no pots canviar el nom dels fitxers. Per distingir els documents, fes servir la nota d’«Assigna el fitxer», els vincles a llocs i reserves, i l’estrella.',
  'help.guide.files-filter.tip.2':
    "La llista sempre mostra primer els fitxers destacats i després els més recents, així que un document pujat avui surt per sobre d'un del mes passat.",
  // files-preview
  'help.guide.files-preview.title': 'Llegir un document sense sortir de TREK',
  'help.guide.files-preview.goal':
    'Consulta un bitllet o una imatge a l’instant i baixa’l al dispositiu quan el necessitis.',
  'help.guide.files-preview.step.1':
    "Fes clic al nom o a la miniatura d'una imatge. S'obre a pantalla completa, amb el nom del fitxer i la seva posició entre les imatges a dalt a l'esquerra. Un vídeo s'obre de la mateixa manera i s'hi reprodueix.",
  'help.guide.files-preview.step.2':
    'Fes servir les fletxes rodones dels costats, les tecles de fletxa esquerra i dreta o la tira de miniatures de baix per passar per totes les imatges que mostra la llista en aquell moment.',
  'help.guide.files-preview.step.3':
    '«Obre en una pestanya nova» i «Baixa» són els botons rodons de dalt a la dreta, al costat de la ×. Fes clic a la ×, prem Esc o fes clic al fons fosc per tancar la imatge.',
  'help.guide.files-preview.step.4':
    "Un document que no és una imatge s'obre en canvi en un diàleg: el nom a dalt, amb «Obre en una pestanya nova» i «Baixa» com a pastilles a sota, i, si és un PDF, la pàgina mateixa a sota. La × de dalt a la dreta, Esc o un clic fora del diàleg el tanquen.",
  'help.guide.files-preview.step.5':
    'La fletxa del final d’una fila («Baixa») desa el fitxer directament al dispositiu, sense obrir-lo abans.',
  'help.guide.files-preview.result':
    "El document es mostra a la pantalla, i els mateixos dos botons l'obren en una pestanya del navegador o el desen al disc.",
  'help.guide.files-preview.tip.1':
    'En una pantalla tàctil, llisca el dit per passar les imatges en lloc de fer clic a les fletxes.',
  'help.guide.files-preview.tip.2':
    'Una targeta de moneder digital no obre mai cap vista prèvia. Es baixa directament, perquè el telèfon la pugui obrir a l’aplicació de moneder.',
  'help.guide.files-preview.tip.3':
    '«Obre en una pestanya nova» i «Baixa» carreguen el fitxer amb la teva sessió, així que un enllaç copiat de la barra d’adreces no funciona per a ningú més.',
  // files-trash
  'help.guide.files-trash.title': 'Eliminar un document i recuperar-lo',
  'help.guide.files-trash.goal': 'Elimina el que el viatge ja no necessita i recupera els fitxers que encara et calen.',
  'help.guide.files-trash.step.1':
    'Fes clic a la paperera del final d’una fila («Elimina»). El fitxer desapareix de la llista a l’instant i apareix el missatge «Mogut a la paperera». No es demana cap confirmació.',
  'help.guide.files-trash.step.2':
    "La icona de paperera a l'extrem dret de la barra («Paperera») mostra els fitxers eliminats. El títol de la barra passa a ser «Paperera», i les pestanyes de filtre i el quadre de pujada s'amaguen.",
  'help.guide.files-trash.step.3':
    "Les files de la paperera es mostren en gris i tenen dues icones: «Restaura», que recupera el fitxer, i «Elimina», que l'esborra definitivament després de demanar-te confirmació.",
  'help.guide.files-trash.step.4':
    'Fes clic a «Restaura». Apareix el missatge «Fitxer restaurat» i el fitxer surt de la paperera. Es conserven la nota i els vincles.',
  'help.guide.files-trash.step.5':
    '«Buida la paperera», a la barra al costat de la icona de la paperera, elimina definitivament tot el que encara hi ha a la paperera. Abans, el navegador et demana confirmació una vegada. La icona de la paperera torna a la vista de fitxers.',
  'help.guide.files-trash.result': 'El fitxer torna a ser a la llista on era abans.',
  'help.guide.files-trash.tip.1':
    "«Elimina» en una fila no demana confirmació. Per això hi ha la paperera: no s'elimina res de TREK fins que no ho elimines aquí. Tot això també funciona sense connexió, i s'envia quan TREK torna a estar en línia.",
  'help.guide.files-trash.tip.2':
    'Per eliminar i recuperar un fitxer cal permís per eliminar fitxers. Un membre sense aquest permís no veu «Elimina» a la fila ni els botons de la paperera.',
  'help.guide.files-trash.tip.3': 'Un fitxer que elimines definitivament de la paperera ja no es pot recuperar.',
  // files-sync
  'help.guide.files-sync.title': 'Sincronitzar els documents amb el teu magatzem de documents',
  'help.guide.files-sync.goal':
    'Connecta el viatge al teu propi magatzem de documents, perquè els fitxers que pugis aquí es desin allà i els que desis allà apareguin aquí.',
  'help.guide.files-sync.step.1':
    'Fes clic a «Sincronització de documents», al costat de la icona de la paperera, a l’extrem dret de la barra. S’obre el diàleg amb el nom del viatge sota el títol. A l’esquerra, a «Connecta un proveïdor», hi ha els magatzems que l’administrador ha activat, cadascun amb una línia que explica com desa els fitxers: Paperless-ngx i Papra per etiqueta, Nextcloud i Synology Drive en una carpeta, OpenCloud en un espai. A la dreta hi diu «Encara no hi ha res connectat».',
  'help.guide.files-sync.step.2':
    'Fes clic al teu servei d’emmagatzematge, en aquest cas Nextcloud. S’obre un diàleg més petit per a la connexió. Mostra el nom del servei i et demana les dades d’inici de sessió que aquest servei necessita.',
  'help.guide.files-sync.step.3':
    "Omple «Adreça» i les dades d'inici de sessió del gestor: un «Token API» per a Paperless-ngx, una «Clau API» i l'«ID d’organització» per a Papra, «Nom d’usuari» i una «Contrasenya d’aplicació» per a Nextcloud, «Nom d’usuari» i un «Token d’aplicació» per a OpenCloud, i per a Synology Drive, «Nom d’usuari», «Contrasenya» i, si el compte ho demana, un «Codi de doble factor». Fes servir una contrasenya o un token d'aplicació sempre que el gestor ho ofereixi, mai la contrasenya del teu compte. Nextcloud i Synology Drive també admeten una «Carpeta base» opcional, on TREK busca les carpetes dels viatges, en aquest exemple /Reisen. «Accepta un certificat autosignat», a baix, només és per a un gestor de la teva pròpia xarxa amb aquest tipus de certificat.",
  'help.guide.files-sync.step.4':
    "Fes clic a «Prova la connexió». TREK es connecta al gestor amb les dades que has escrit, i el peu de la targeta mostra «Contactat, sessió iniciada com a» seguit del nom del compte. Si les credencials es rebutgen o no es pot accedir a l'adreça, el peu ho indica. En tots dos casos no es desa res.",
  'help.guide.files-sync.step.5':
    'Fes clic a «Connecta». La connexió es desa amb el viatge i TREK et pregunta en quin lloc del magatzem han d’anar els documents del viatge: l’etiqueta, la carpeta o l’espai que els conté. Només se sincronitza el que hi ha allà. «Crea’n un de nou» el crea quan fas clic a «Crea», amb un nom basat en el títol del viatge. A «O fes servir un que ja tinguis» hi ha els que ja existeixen. Fes clic en un, en aquest exemple la carpeta Autumn in Japan.',
  'help.guide.files-sync.step.6':
    "El diàleg es torna a obrir: el teu magatzem apareix a «Aquest viatge», a l'esquerra, i la seva targeta, a la dreta, mostra on se sincronitza, quan es va sincronitzar per última vegada i «Sincronitza ara». La primera sincronització comença automàticament; fes clic a «Sincronitza ara» per sincronitzar quan vulguis. Després d'una sincronització, la insígnia «Encara no s’ha sincronitzat» del costat del nom es converteix en un punt verd, que mostra «Al dia» quan hi passes el ratolí per sobre. La barra de flux mostra quants documents tenen TREK i el magatzem, amb els carrils «Cap al gestor» i «Des del gestor» entremig. Tanca el diàleg amb la × de dalt a la dreta.",
  'help.guide.files-sync.result':
    "Els documents que ja hi havia al magatzem apareixen a dalt de tot de la llista, pujats al teu nom, i tots els documents del viatge també són al magatzem, excepte els de «Notes de col·laboració». A partir d'ara, TREK revisa el magatzem en segon pla i els canvis de la llista es copien al magatzem.",
  'help.guide.files-sync.tip.1':
    'Només el propietari del viatge o un administrador de la instància pot connectar un viatge, perquè les credencials donen accés a tot el compte del magatzem. Un cop connectat, tots els membres veuen «Sincronització de documents» i poden obrir-la, consultar la targeta i prémer «Sincronitza ara».',
  'help.guide.files-sync.tip.2':
    'Un servei d’emmagatzematge a la teva xarxa local necessita ALLOW_INTERNAL_NETWORK=true al servidor de TREK, i la seva adreça ha de ser l’adreça de la màquina a la xarxa, mai localhost. Si no, «Prova la connexió» respon «Aquesta adreça no està permesa.».',
  'help.guide.files-sync.tip.3':
    "«Desconnecta», la icona del costat de «Sincronitza ara», demana confirmació una vegada. Després tanca la connexió i conserva tots els documents a les dues bandes. Si tornes a connectar una etiqueta, una carpeta o un espai, TREK el tracta com a nou i en torna a importar tot el contingut. Per això, després de desconnectar, connecta'n un de buit, no l'antic.",

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detalls del dia',
  'help.ctx.trip-day-detail.summary':
    "El panell que s'obre sobre el mapa quan fas clic a la capçalera d'un dia. Mostra el dia en conjunt: el nom i la data, el temps que farà on seràs, les reserves d'aquell dia i les nits reservades.",
  'help.ctx.trip-day-detail.bullet.1':
    "Fes clic a la capçalera d'un dia a la columna de dies i el panell s'obrirà sobre el centre del mapa. Torna a fer clic a la mateixa capçalera, o a la X de la dreta, per tancar el panell i desseleccionar el dia. Si obres un lloc, des de la columna de llocs o des del mapa, el panell es tanca i es mostra el lloc.",
  'help.ctx.trip-day-detail.bullet.2':
    'La capçalera mostra el nom del dia i la data. El llapis del costat del nom canvia el nom del dia. La doble fletxa plega el panell en una barra estreta perquè tornis a veure el mapa.',
  'help.ctx.trip-day-detail.bullet.3':
    'A dalt de tot hi ha el temps del dia. «Previsió per a» indica el lloc de la previsió: la primera parada del dia o l’allotjament on et despertes.',
  'help.ctx.trip-day-detail.bullet.4':
    "«Reserves» mostra les reserves d'aquell dia, cadascuna amb el seu tipus, la parada a què pertany i els seus horaris. El verd vol dir confirmada, l'ambre, encara pendent, i un trajecte en transport públic és blau i no té estat. Un clic a una fila obre la reserva.",
  'help.ctx.trip-day-detail.bullet.5':
    "«Allotjament» mostra totes les nits reservades que inclouen aquest dia, amb «Registre d'entrada» i «Registre de sortida» els dies corresponents, la franja horària d'entrada, l'hora de sortida i el número de confirmació. Si l'estada té una reserva, un requadre «Reserva» a sota en mostra el nom amb «Pendent» o «Confirmat». Fes-hi clic per obrir la reserva.",
  'help.ctx.trip-day-detail.bullet.6':
    "«Afegeix un allotjament» afegeix una nit d'estada en aquest dia: tria l'establiment entre els llocs del viatge, indica quins dies cobreix i afegeix-hi els horaris i el codi. El + de la capçalera d'un dia, amb el text d'ajuda «Afegeix al dia», també té «Afegeix un allotjament»: obre aquest panell amb el formulari ja obert.",
  // day-panel
  'help.guide.day-panel.title': 'Obrir un dia i consultar-ne els detalls',
  'help.guide.day-panel.goal': 'Mira tot un dia, amb el temps, les reserves i on dorms, sense sortir del mapa.',
  'help.guide.day-panel.step.1':
    'Fes clic a la capçalera d’un dia a la columna de dies. El dia queda seleccionat i els seus detalls s’obren al mig del mapa.',
  'help.guide.day-panel.step.2':
    'La capçalera mostra el nom del dia («Dia 1» fins que li posis un nom) i, a sota, la data.',
  'help.guide.day-panel.step.3':
    "El temps del dia és a dalt. «Previsió per a» indica de quin lloc és: la primera parada del dia, o l'hotel on vas passar la nit anterior.",
  'help.guide.day-panel.step.4': "A sota, «Reserves» mostra les reserves d'aquest dia, amb els horaris.",
  'help.guide.day-panel.step.5':
    "«Allotjament» mostra les nits reservades que inclouen aquest dia, amb «Registre d'entrada» i «Registre de sortida» els dies que toquen.",
  'help.guide.day-panel.step.6':
    'La doble fletxa de la capçalera plega el panell en una barra estreta. La X del costat tanca el panell i desselecciona el dia.',
  'help.guide.day-panel.result':
    "Si plegues el panell fins a la barra, el mapa queda lliure i el dia continua seleccionat. Si el tanques, el dia deixa d'estar seleccionat i el pla es queda com estava.",
  'help.guide.day-panel.tip.1':
    'També el pots plegar fent clic a qualsevol punt de la barra de capçalera del panell. La fletxa només és una de les maneres de fer-ho.',
  'help.guide.day-panel.tip.2':
    'Quan obres un lloc, des de la columna de llocs o des del mapa, el panell del dia es tanca i es mostren els detalls del lloc. Torna a fer clic a la capçalera del dia per tornar a veure el dia.',
  // day-weather
  'help.guide.day-weather.title': 'Consultar el temps del dia',
  'help.guide.day-weather.goal': 'Consulta el temps del lloc on seràs realment aquell dia.',
  'help.guide.day-weather.step.1':
    "«Previsió per a» mostra a quin lloc corresponen les dades: la primera parada del dia o, en un dia sense parades, l'hotel on dorms la nit anterior.",
  'help.guide.day-weather.step.2':
    'El número gran és la temperatura del dia. Al costat hi ha la mínima, la màxima i l’estat del temps en paraules.',
  'help.guide.day-weather.step.3':
    "Les etiquetes de la dreta: la probabilitat de pluja, la quantitat, el vent més fort i l'hora de sortida i de posta del sol.",
  'help.guide.day-weather.step.4':
    "A baix de tot hi ha el dia hora per hora, cada dues hores: l'hora, la icona, la temperatura i la probabilitat de pluja. Les hores amb més d'un 50 per cent es marquen en blau.",
  'help.guide.day-weather.result':
    'La targeta del dia a la columna de dies també mostra el temps en petit sota el número, així veus d’un cop d’ull el temps de tot el viatge.',
  'help.guide.day-weather.tip.1':
    'Els graus i el vent fan servir la «Unitat de temperatura» de «Pantalla», a «Configuració»: si tries °F Fahrenheit, la mateixa previsió es mostra en °F i mph.',
  'help.guide.day-weather.tip.2':
    "Un dia sense cap parada ubicada i sense hotel de la nit anterior no mostra cap previsió: la previsió sempre és d'un lloc, mai del viatge.",
  'help.guide.day-weather.tip.3':
    'A més de 16 dies vista no hi ha previsió disponible. Aleshores les xifres són les mitjanes dels anys anteriors per a aquella data. Estan marcades amb Ø, i una nota a sota ho indica.',
  // rename-day
  'help.guide.rename-day.title': 'Posar nom al dia',
  'help.guide.rename-day.goal': 'Posa a un dia un nom com «Arribada a Kyoto» o «Dia de descans» en lloc de «Dia 5».',
  'help.guide.rename-day.step.1': 'Obre el dia. A la capçalera hi diu «Dia 5», amb la data a sota.',
  'help.guide.rename-day.step.2': 'Fes clic al llapis del costat del nom.',
  'help.guide.rename-day.step.3': 'El nom es converteix en un camp. Escriu el nom que vulguis.',
  'help.guide.rename-day.step.4':
    'Prem Retorn o fes clic en un altre lloc. Esc cancel·la el canvi. La targeta del dia a la columna de dies també mostra el nom.',
  'help.guide.rename-day.result':
    'El nom substitueix «Dia 5» al panell i a la targeta del dia de la columna de dies; la data no canvia.',
  'help.guide.rename-day.tip.1':
    'Si buides el camp i deses, el dia torna a dir-se «Dia 5»: quan no hi ha nom, es mostra el número.',
  'help.guide.rename-day.tip.2':
    "El nom és del dia, no de la data. Si reordenes els dies, el nom es mou amb tota la resta d'aquell dia.",
  // add-accommodation
  'help.guide.add-accommodation.title': 'Reservar una nit en un dia',
  'help.guide.add-accommodation.goal':
    'Afegeix l’hotel al pla una sola vegada, amb els dies que cobreix, els horaris i el número de confirmació.',
  'help.guide.add-accommodation.step.1':
    'Primer, l’allotjament ha de ser un lloc del viatge. Crea’l a la columna de llocs com qualsevol altre lloc: el selector només ofereix llocs que ja existeixen.',
  'help.guide.add-accommodation.step.2':
    "Obre el dia d'arribada i fes clic a «Afegeix un allotjament», a «Allotjament».",
  'help.guide.add-accommodation.step.3':
    "«Aplica als dies» defineix quines nits cobreix l'estada: «Inici» és el dia d'entrada, «Fi» el dia de sortida, i «Tots» cobreix tot el viatge. A dalt del diàleg es mostra l'interval i el nombre de nits.",
  'help.guide.add-accommodation.step.4':
    "Omple «Registre d'entrada», «Fins a» i «Registre de sortida», i posa el número de la reserva a «Confirmació». Tots quatre camps poden quedar buits.",
  'help.guide.add-accommodation.step.5':
    "Tria l'establiment a «Selecciona l'allotjament». «Categoria», sobre la llista, la filtra per una sola categoria.",
  'help.guide.add-accommodation.step.6': 'Fes clic a «Desa».',
  'help.guide.add-accommodation.result':
    "L'estada apareix a tots els dies que cobreix, amb «Registre d'entrada» el primer i «Registre de sortida» l'últim. L'establiment passa a ser una parada del dia d'entrada, de manera que el mapa hi mostra la ruta, i a la pestanya «Reserves» apareix una reserva d'hotel.",
  'help.guide.add-accommodation.tip.1':
    "El selector s'obre al dia des d'on hi has arribat, amb la sortida l'endemà; pots canviar totes dues dates abans de desar.",
  'help.guide.add-accommodation.tip.2':
    'Quan creïs l’hotel, posa-li la categoria «Hotel». Així, amb un sol clic a «Categoria», a sobre de la llista, veuràs només els teus hotels.',
  'help.guide.add-accommodation.tip.3':
    'Totes les hores són opcionals: una estada sense entrada ni codi continua cobrint les seves nits, i la ruta es continua dibuixant.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Modificar o cancel·lar una nit reservada',
  'help.guide.edit-accommodation.goal': 'Mou una estada, corregeix-ne els horaris o treu-la del pla.',
  'help.guide.edit-accommodation.step.1':
    "La targeta mostra l'establiment i la seva adreça, «Registre d'entrada» o «Registre de sortida» els dies corresponents amb els horaris, el número de confirmació i, a «Reserva», la reserva associada.",
  'help.guide.edit-accommodation.step.2':
    "El llapis de la dreta, «Edita l'allotjament», obre l'estada per editar-la. Ara el títol de la finestra és «Edita l'allotjament».",
  'help.guide.edit-accommodation.step.3':
    "Corregeix «Registre d'entrada», «Fins a», «Registre de sortida» i «Confirmació». Aquí també pots canviar els dies de sobre i l’establiment de sota.",
  'help.guide.edit-accommodation.step.4': 'Fes clic a «Desa».',
  'help.guide.edit-accommodation.step.5':
    "La X del costat del llapis, «Elimina», treu l'estada. No demana confirmació, i també s'elimina la reserva d'hotel associada a l'estada.",
  'help.guide.edit-accommodation.result':
    "El canvi s'aplica a l'instant a tots els dies que cobreix l'estada, i a la reserva d'hotel de la pestanya «Reserves».",
  'help.guide.edit-accommodation.tip.1':
    "Una nit al mig d'una estada no té l'etiqueta «Registre d'entrada» ni «Registre de sortida»: només la tenen el primer i l'últim dia de l'interval.",
  'help.guide.edit-accommodation.tip.2':
    'Si anul·les una estada, també s’elimina la parada que havia afegit al dia d’entrada i qualsevol despesa vinculada a la reserva. Si ha estat un error, torna a reservar la nit.',
  // day-bookings
  'help.guide.day-bookings.title': 'Les reserves del dia d’un cop d’ull',
  'help.guide.day-bookings.goal': 'Consulta en un sol lloc què hi ha reservat per a aquest dia i si està confirmat.',
  'help.guide.day-bookings.step.1':
    "«Reserves» mostra les reserves del dia: les que tenen la data d'aquell dia i les que estan fixades a alguna de les seves parades. Una reserva fixada a una parada d'un altre dia només apareix en aquella parada.",
  'help.guide.day-bookings.step.2':
    "Cada fila mostra quin tipus de reserva és, el nom i, si pertany a una parada, aquella parada en gris a continuació. Els horaris apareixen a l'extrem dret, davant del punt d'estat.",
  'help.guide.day-bookings.step.3':
    "El color indica l'estat d'una reserva: verd és confirmada, ambre, encara pendent, i un trajecte en transport públic és blau, sense estat. Els hotels no són en aquesta llista; tenen la seva pròpia secció a sota.",
  'help.guide.day-bookings.step.4':
    'Fes clic a una fila per obrir la reserva. La pastilla de la capçalera la canvia entre «Pendent» i «Confirmat», i «Edita», a baix, canvia la resta. Les reserves noves es creen a la pestanya «Reserves», i els transports, a la pestanya «Transports».',
  'help.guide.day-bookings.result':
    'En aquesta llista hi ha tot el que té la data d’aquell dia i tot el que està vinculat a alguna de les seves parades.',
  'help.guide.day-bookings.tip.1':
    "Una reserva apareix el dia de la seva data. Si canvies la data a la pestanya «Reserves» o «Transports», la reserva passa automàticament a l'altre dia.",
  'help.guide.day-bookings.tip.2':
    "Si no hi ha el bloc «Reserves», el dia no té reserves: s'amaga en lloc de mostrar-se buit.",
  'help.guide.map-lock.title': 'Bloquejar el mapa',
  'help.guide.map-lock.goal': 'Mantén el mapa quiet mentre vas passant per dies i llocs.',
  'help.guide.map-lock.step.1':
    "El cadenat és el de dalt dels dos botons rodons de baix a l'esquerra del mapa; si hi passes el ratolí, diu «Bloqueja la vista del mapa». Fes-hi clic. Mentre està tancat, obrir un dia o triar un lloc ja no apropa ni desplaça el mapa, i el botó passa a dir «Deixa que el mapa segueixi la selecció».",
  'help.guide.map-lock.result': "El mapa es queda on l'has deixat mentre treballes en el pla.",
  'help.guide.map-lock.tip.1':
    "Torna a fer clic al cadenat, que ara diu «Deixa que el mapa segueixi la selecció», i el mapa tornarà a seguir el que triïs. El cadenat només apareix a l'ordinador; al telèfon, el mapa sempre segueix la selecció.",

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'El centre del pla: cada lloc del viatge com una xinxeta, cada excursió com una línia, les rutes entre ells i, als marges del mapa, els botons per bloquejar la vista, passar a la vista de satèl·lit, veure tot el viatge alhora i mostrar els llocs de la zona que estàs mirant.',
  'help.ctx.trip-map.bullet.1':
    "Una xinxeta és un lloc: mostra la foto del lloc si en té; si no, el color de la categoria amb la seva icona. Passa el ratolí per sobre d'una xinxeta per veure una targeta amb la imatge, el nom i l'adreça, i la valoració i la categoria si el lloc en té. Arrossega una xinxeta sobre la targeta d'un dia per planificar-hi el lloc. Una estada amb la reserva encara pendent es mostra esvaïda, amb un anell discontinu.",
  'help.ctx.trip-map.bullet.2':
    "Les xinxetes massa juntes s'agrupen en un cercle fosc amb un recompte. Fes clic al cercle i el mapa s'apropa a les xinxetes que conté. Amb «Marcadors compactes per als llocs sense planificar» activat, a «Configuració» > «Pantalla», dins de «Viatge i mapa», els llocs que encara no són a cap dia es mostren com a punts petits sense foto, perquè les parades planificades es vegin millor.",
  'help.ctx.trip-map.bullet.3':
    'Fes clic en una xinxeta per obrir el lloc en una targeta a la part inferior del mapa, amb la valoració, els fitxers i les accions següents. Fes clic en una zona buida del mapa per tancar la targeta.',
  'help.ctx.trip-map.bullet.4':
    "Amb un dia obert a la columna de dies, les seves parades mostren una petita insígnia blanca amb el número que tenen en aquell dia. Un lloc que apareix dues vegades al dia mostra tots dos números. Els filtres de sobre la llista de llocs («Mostrar», les categories i l'estrella per a la valoració mínima) també filtren les xinxetes del mapa.",
  'help.ctx.trip-map.bullet.5':
    "La fila d'icones de dalt busca a la part del mapa que veus: Restaurants, «Cafeteries», «Bars i oci nocturn», «Allotjament», «Llocs d'interès», «Museus i cultura», «Natura i parcs» i «Activitats». Les categories que afegeix un connector apareixen després d'una línia separadora fina. Quan la fila és més ampla que el mapa, la roda del ratolí la desplaça lateralment. «Cerca en aquesta zona» torna a fer la cerca després de moure el mapa.",
  'help.ctx.trip-map.bullet.6':
    "Fes clic amb el botó dret en qualsevol punt del mapa per obrir el formulari del lloc en aquell punt, amb l'adreça ja consultada. A baix a l'esquerra hi ha dos botons rodons: el cadenat, «Bloqueja la vista del mapa», manté la vista del mapa mentre vas fent clic a dies i llocs, i el botó de sota, «Canvia a vista de satèl·lit», substitueix el mapa dibuixat per imatges de satèl·lit.",
  'help.ctx.trip-map.bullet.7':
    '«Mostra tot el viatge», a baix a la dreta, dibuixa tots els dies de viatge alhora i indica què inclou cada dia. La icona de ruta de la fila d’una reserva dibuixa aquella reserva, i la icona de ruta de la barra d’eines, sobre els dies, les dibuixa totes. Fes clic a l’extrem d’una reserva dibuixada per obrir-ne els detalls.',
  'help.ctx.trip-map.bullet.8':
    "Amb el complement Dawarich activat, el botó rodó de Dawarich, sota «Mostra tot el viatge», mostra la ruta que ha enregistrat realment el teu telèfon. «Mostra el recorregut enregistrat» la dibuixa amb línia discontínua sota la ruta planificada, amb un color per dia. Quan no hi ha cap línia, l'etiqueta del botó n'explica el motiu.",
  // map-markers
  'help.guide.map-markers.title': 'Interpretar el mapa',
  'help.guide.map-markers.goal': 'Entén què vol dir cada marcador, insígnia i bombolla del mapa.',
  'help.guide.map-markers.step.1':
    "El mapa mostra tots els llocs del viatge. Quan les agulles estan tan juntes que no es distingeixen, s'agrupen en un cercle fosc amb el nombre d'agulles a dins. Fes clic al cercle i el mapa s'hi apropa o, amb el zoom màxim, separa les agulles.",
  'help.guide.map-markers.step.2':
    "Una xinxeta mostra la foto del lloc si en té; si no, el color de la categoria amb la seva icona. Una estada amb la reserva encara pendent es mostra esvaïda, amb un anell discontinu. Quan passes el ratolí per sobre d'una xinxeta, s'obre una targeta al costat: la mateixa foto més gran, el nom i l'adreça, amb la valoració i la categoria si el lloc en té.",
  'help.guide.map-markers.step.3':
    "Fes clic a una xinxeta i el lloc s'obre en una targeta a la part de baix del mapa: la imatge, el nom i l'adreça a dalt, i després les estrelles, la descripció i els fitxers, inclosos els de la seva reserva. A baix hi ha les accions: «Afegeix al dia» si hi ha un dia obert («Treure del dia» si el lloc ja hi és), «Navegació», «Obre el lloc web», «Desar a la col·lecció» («Desat» si ja és en una) i, a la dreta, la paperera i «Edita». La X de dalt, o un clic en una zona buida del mapa, la tanca.",
  'help.guide.map-markers.step.4':
    "Obre un dia a la columna dels dies i les seves parades es numeren: la petita insígnia blanca a la cantonada d'una xinxeta indica la posició de la parada dins del dia. Si un lloc apareix dues vegades en el dia, mostra tots dos números. Quan no hi ha cap dia obert, no hi ha números i la cantonada mostra la valoració del lloc, si en té.",
  'help.guide.map-markers.step.5':
    'Arrossega una xinxeta del mapa fins a la targeta d’un dia a la columna de dies i el lloc queda planificat per a aquell dia, igual que si n’arrosseguessis la fila des de la llista de llocs.',
  'help.guide.map-markers.result':
    'Al viatge no ha canviat res: el mapa només el mostra. Cada xinxeta indica quin lloc és, en quin dia és i en quin ordre.',
  'help.guide.map-markers.tip.1':
    "Quan plegues un dia a la columna de dies, les seves parades s'amaguen al mapa. Torna a desplegar el dia per mostrar-les.",
  'help.guide.map-markers.tip.2':
    "Els filtres de sobre la llista de llocs també determinen què mostra el mapa: «Mostrar» («Sense planificar», «Planificat»), les categories del botó de l'etiqueta i la valoració mínima de l'estrella redueixen el nombre de xinxetes. El filtre de país només afecta la llista.",
  'help.guide.map-markers.tip.3':
    "Aquest mapa no té botons de zoom: la roda del ratolí fa zoom, un doble clic s'apropa un nivell, i arrossegant el mapa el desplaces.",
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Trobar llocs a prop teu al mapa',
  'help.guide.map-nearby-places.goal':
    "Cerca restaurants, llocs d'interès o un hotel a la zona que es veu al mapa i afegeix-ne un al viatge.",
  'help.guide.map-nearby-places.step.1':
    "La fila d'icones de dalt del mapa és la cerca per categories: Restaurants, «Cafeteries», «Bars i oci nocturn», «Allotjament», «Llocs d'interès», «Museus i cultura», «Natura i parcs» i «Activitats». Les categories que afegeix un connector apareixen després d'un separador fi; passa el ratolí per una icona per veure'n el nom.",
  'help.guide.map-nearby-places.step.2':
    "Fes clic a una categoria. TREK cerca aquest tipus de lloc a la part visible del mapa i posa una xinxeta del color de la categoria per a cada resultat. Només pots tenir una categoria alhora: si en tries una altra, substitueix l'anterior, i si fas clic a la que està activa, la desactives.",
  'help.guide.map-nearby-places.step.3':
    'Quan mous el mapa, apareix un segon botó sota la fila: «Cerca en aquesta zona» fa la mateixa cerca per a la vista nova. Moure el mapa no inicia cap cerca nova per si sol. Així es fan poques peticions.',
  'help.guide.map-nearby-places.step.4':
    "Mantén el punter sobre una xinxeta per veure el nom del que ha trobat la cerca. Fes clic a la xinxeta i s'obrirà el formulari del lloc amb les dades ja omplertes: el nom a dalt del diàleg, «Adreça», «Latitud» i «Longitud», i el lloc web i el telèfon si la cerca els ha trobat.",
  'help.guide.map-nearby-places.step.5':
    'Revisa el que ha omplert i afegeix el que la cerca no podia saber. La pastilla de categoria de sota el nom ja ve triada si el viatge té una categoria que hi encaixa, com ara restaurant per a un restaurant; si no, diu «Sense categoria» fins que en triïs una. Afegeix-hi una «Descripció» i notes pròpies.',
  'help.guide.map-nearby-places.step.6':
    'Fes clic a «Afegir». Si al viatge ja hi ha un lloc amb el mateix nom o al mateix punt, TREK t’avisa i el botó passa a dir «Afegir igualment».',
  'help.guide.map-nearby-places.result':
    'El lloc és a la llista de llocs i al mapa com una xinxeta més del viatge, a «Sense planificar» fins que el posis en un dia. Les xinxetes de la cerca es queden fins que desactives la categoria.',
  'help.guide.map-nearby-places.tip.1':
    "La fila s'amaga quan «Explora llocs al mapa» està desactivat a «Configuració» > «Pantalla», dins de «Viatge i mapa».",
  'help.guide.map-nearby-places.tip.2':
    "Els resultats provenen de l'índex TREK Places i d'OpenStreetMap, així que és una de les poques coses del pla que necessita connexió.",
  'help.guide.map-nearby-places.tip.3':
    'La cerca només cobreix la zona que es veu a la pantalla, així que apropa el zoom fins al carrer que t’interessa. Si cerques en tota una ciutat, només obtindràs els seixanta primers resultats, sense cap ordre clar.',
  // map-add-place
  'help.guide.map-add-place.title': 'Crear un lloc amb el clic dret al mapa',
  'help.guide.map-add-place.goal': 'Posa un lloc exactament on vulguis, sense haver-lo de cercar abans.',
  'help.guide.map-add-place.step.1':
    'Fes clic amb el botó dret al punt del mapa. S’obre el formulari del lloc amb el títol «Afegeix un lloc / activitat».',
  'help.guide.map-add-place.step.2':
    '«Latitud» i «Longitud» ja tenen les coordenades d’aquell punt. TREK les consulta i omple «Adreça» amb el que hi troba. Si la consulta troba un nom, TREK també l’escriu a la part de dalt del diàleg. Encara no s’ha desat res, així que corregeix el que no sigui correcte.',
  'help.guide.map-add-place.step.3':
    'Escriu un nom que reconeguis al camp de dalt del diàleg. Tria una categoria a la pastilla de sota, que diu «Sense categoria» fins que en triïs una. Després afegeix-hi la resta de dades per al pla: «Descripció», «Notes», «Lloc web».',
  'help.guide.map-add-place.step.4':
    "Fes clic a «Afegir». El lloc s'afegeix a la llista com a no planificat, encara que hi hagi un dia obert: un clic amb el botó dret al mapa defineix la ubicació, no el dia.",
  'help.guide.map-add-place.result':
    'El lloc és a la llista i al mapa, a «Sense planificar» fins que l’assignis a un dia.',
  'help.guide.map-add-place.tip.1':
    "L'adreça es busca a partir de les coordenades, així que pot mostrar un carrer en lloc d'un nom i, en camp obert, pot quedar buida. Pots sobreescriure tots dos camps.",
  'help.guide.map-add-place.tip.2':
    'Als mapes MapLibre GL i Mapbox GL també ho pots fer amb un clic del botó del mig i, en una pantalla tàctil, mantenint premut.',
  // map-satellite
  'help.guide.map-satellite.title': 'Canviar a la vista de satèl·lit',
  'help.guide.map-satellite.goal': 'Passa del mapa dibuixat a les imatges aèries, i a l’inrevés.',
  'help.guide.map-satellite.step.1':
    "El selector de capa base és el de sota dels dos botons rodons de baix a l'esquerra del mapa, sota el cadenat. La icona sempre mostra la capa a la qual canvia, i el text d'ajuda ho indica: «Canvia a vista de satèl·lit». Fes-hi clic.",
  'help.guide.map-satellite.step.2':
    'Ara el mapa mostra imatges aèries. Són prou detallades per distingir edificis individuals, i no et cal cap clau pròpia. Tot el que dibuixa TREK continua a sobre: les xinxetes, la ruta del dia, les traces i les rutes de les reserves.',
  'help.guide.map-satellite.step.3':
    'Ara el botó diu «Canvia a vista de mapa». Fes-hi clic per tornar a la vista de mapa.',
  'help.guide.map-satellite.result': 'El mapa es torna a dibuixar i la capa que has triat es desa al teu compte.',
  'help.guide.map-satellite.tip.1':
    "L'opció es desa al teu compte, no al viatge, de manera que cada viatge s'obre tal com el vas deixar, facis servir el motor de mapes que facis servir.",
  'help.guide.map-satellite.tip.2':
    'Les imatges de satèl·lit no tenen etiquetes: els noms dels carrers, els barris i els números de les cases només surten al mapa dibuixat, així que torna-hi quan busquis una adreça.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Veure tot el viatge i les seves distàncies',
  'help.guide.map-whole-trip.goal':
    'Mostra tots els dies de trajecte del viatge en lloc de només el dia obert, i consulta quants quilòmetres fas cada dia.',
  'help.guide.map-whole-trip.step.1':
    'El botó rodó «Mostra tot el viatge» és a baix a la dreta del mapa. Fes-hi clic i es dibuixen alhora tots els dies de trajecte del viatge, cadascun del seu color, perquè puguis distingir els dies veïns.',
  'help.guide.map-whole-trip.step.2':
    'La targeta de sobre el botó mostra aquests dies: un punt de color, el nom del dia, una icona per a cada mitjà de transport que hi fas servir i la distància que recorres. A dalt de tot hi ha la «Distància total».',
  'help.guide.map-whole-trip.step.3':
    'Fes clic en un dia de la targeta per seleccionar-lo: la fila queda ombrejada i el dia s’obre a la columna de dies. Fes girar la roda del ratolí sobre una ciutat per apropar-t’hi. Els dies que hi passen es mostren un al costat de l’altre, cadascun amb el seu color.',
  'help.guide.map-whole-trip.step.4':
    'Ara el botó diu «Amaga tot el viatge». Fes-hi clic per tornar a veure només el dia obert.',
  'help.guide.map-whole-trip.result':
    'Cada dia de viatge es dibuixa amb el seu color, i la targeta mostra què cobreix cada dia i el total del viatge.',
  'help.guide.map-whole-trip.tip.1':
    "El total es calcula per grups de trams. Mentre hi ha … al darrere, la xifra només és una suma parcial. És definitiva quan s'han calculat tots els trams.",
  'help.guide.map-whole-trip.tip.2':
    'Si el planificador de rutes no pot calcular un tram, el tram queda com una línia recta i no es compta. La fitxa t’ho indica, perquè el total no sembli més baix sense cap avís.',
  'help.guide.map-whole-trip.tip.3':
    "Un dia amb menys de dues parades localitzades i sense cap trajecte en cotxe cap a l'hotel o des de l'hotel no té cap ruta per dibuixar, així que no apareix a la targeta.",
  // map-booking-routes
  'help.guide.map-booking-routes.title': "Mostrar la ruta d'una reserva al mapa",
  'help.guide.map-booking-routes.goal':
    'Mostra al mapa els vols, els trens i els trajectes en cotxe que has reservat, i torna’ls a treure.',
  'help.guide.map-booking-routes.step.1':
    'Les rutes de les reserves estan desactivades fins que n’actives una. A l’extrem dret de la fila d’un transport, a la columna de dies, hi ha una petita icona de ruta: «Mostra les rutes de reserves».',
  'help.guide.map-booking-routes.step.2':
    'Fes-hi clic i la reserva apareixerà al mapa: un vol com un arc de cercle màxim, un trajecte en cotxe per les carreteres reals, un tren com la cadena de les seves estacions. «Confirmat» es dibuixa amb línia contínua i «Pendent», amb línia discontínua, i els extrems de la ruta són pastilles blaves amb la icona del transport.',
  'help.guide.map-booking-routes.step.3':
    "Fes clic a una pastilla d'extrem i s'obriran els detalls de la reserva: l'estat, el tipus i els dies en pastilles a la capçalera de color, els horaris dels dos extrems, la resta de dades a sota i, a baix, «Al mapa», que torna a desactivar aquesta ruta, «Canviar de ruta» en una connexió de transport públic, la paperera que elimina la reserva, i «Edita». La X de la capçalera tanca els detalls.",
  'help.guide.map-booking-routes.step.4':
    "La icona de ruta de la barra d'eines de sobre els dies funciona per a tot el viatge alhora: «Mostra totes les rutes de reserva» dibuixa totes les reserves que tenen ruta.",
  'help.guide.map-booking-routes.step.5':
    'Això substitueix el que havies triat abans, així que es restableixen les rutes que havies activat reserva per reserva. Torna-hi a fer clic, ara amb el text «Amaga totes les rutes de reserva», per amagar totes les rutes de reserva.',
  'help.guide.map-booking-routes.result':
    "Les reserves que has triat es dibuixen al mapa, i l'opció es manté per a aquest viatge en aquest navegador fins que la canviïs.",
  'help.guide.map-booking-routes.tip.1':
    "Els extrems només mostren el codi de l'aeroport o el nom de l'estació si «Etiquetes de rutes de reserves» està activat a «Configuració» > «Pantalla», dins de «Viatge i mapa»; si no, només mostren la icona.",
  'help.guide.map-booking-routes.tip.2':
    '«Mostra sempre les rutes de reserva», a la mateixa secció, les mostra des del principi en tots els viatges on encara no ho hagis configurat tu.',
  'help.guide.map-booking-routes.tip.3':
    'Per poder dibuixar una reserva, cal que tingui un inici i un final amb coordenades; per això un hotel o un restaurant no tenen icona de ruta.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrar el recorregut que has fet de veritat',
  'help.guide.map-dawarich-trail.goal':
    'Mostra al mapa el recorregut que Dawarich ha enregistrat al teu mòbil, amb una línia discontínua al costat de la ruta planificada, i descobreix dia a dia com va anar realment el viatge.',
  'help.guide.map-dawarich-trail.step.1':
    'El botó rodó de Dawarich és a baix a la dreta del mapa, sota «Mostra tot el viatge». Quan hi passes el ratolí, diu «Mostra el recorregut enregistrat». Fes-hi clic. TREK demana al teu Dawarich les dades de les dates del viatge, i un anell gira al voltant del botó mentre TREK espera la resposta.',
  'help.guide.map-dawarich-trail.step.2':
    "La ruta enregistrada apareix com una línia discontínua, amb un color per dia, dibuixada sota la ruta planificada perquè el pla es continuï llegint bé. Ara el botó diu «Amaga el recorregut enregistrat». Cada dia acaba a la mitjanit local. Quan plegues un dia a la columna de dies, la seva línia discontínua i les seves parades s'amaguen al mapa.",
  'help.guide.map-dawarich-trail.step.3':
    'Fes clic també a «Mostra tot el viatge» i cada dia planificat es dibuixarà amb una línia contínua al costat de l’enregistrament discontinu. On les dues línies coincideixen, el dia va anar tal com estava previst. On la línia discontínua se separa de la ruta planificada, no.',
  'help.guide.map-dawarich-trail.result':
    'El que havies planificat i el que has fet de debò es mostren junts al mapa, amb línies discontínues i contínues. La targeta de sobre els botons continua mostrant els dies planificats i les seves distàncies.',
  'help.guide.map-dawarich-trail.tip.1':
    "Si està activat o no es desa per a cada viatge al teu compte, de manera que és igual en tots els navegadors i dispositius. Mentre el recorregut està activat, TREK torna a consultar Dawarich cada dos minuts, així un viatge en curs s'actualitza sense haver de recarregar la pàgina. El recorregut no es desa mai, de manera que no és a la base de dades de TREK ni a les còpies de seguretat, i no està disponible sense connexió.",
  'help.guide.map-dawarich-trail.tip.2':
    'El text del botó t’explica per què el mapa és buit: «S’està carregant el recorregut enregistrat…» mentre es carrega, «No s’ha enregistrat res en aquestes dates», «No s’ha pogut carregar el recorregut enregistrat» o, quan TREK no té connexió, «El recorregut enregistrat necessita connexió».',
  // map-compass
  'help.guide.map-compass.title': 'Girar el mapa i tornar a orientar-lo al nord',
  'help.guide.map-compass.goal':
    "Gira el mapa cap a la direcció en què vas, i torna'l a orientar al nord amb un sol clic.",
  'help.guide.map-compass.step.1':
    "Gira el mapa arrossegant amb el botó dret, o mantén premuda la tecla Ctrl i arrossega amb el botó esquerre; en una pantalla tàctil, gira amb dos dits. La brúixola rodona del costat de la fila d'icones de categories, a dalt del mapa, gira amb el mapa: la seva fletxa sempre apunta al nord, així que s'inclina el mateix angle que el mapa.",
  'help.guide.map-compass.step.2':
    'Fes clic a la brúixola. El botó, «Reset north», gira el mapa perquè el nord torni a quedar a dalt, torna a posar la vista plana i la fletxa torna a apuntar amunt.',
  'help.guide.map-compass.result':
    'El mapa torna a apuntar al nord i torna a estar pla. No ha canviat res del viatge: la brúixola només canvia la vista.',
  'help.guide.map-compass.tip.1':
    "La brúixola només hi és als mapes MapLibre GL i Mapbox GL; el mapa Leaflet no es pot girar i, per tant, no en té. Tries quin mapa fas servir a «Proveïdor de mapa», dins de «Mapa» a la configuració, i amb «Desa el mapa» guardes l'elecció.",
  'help.guide.map-compass.tip.2':
    'El clic també treu la inclinació. Arrossega amunt o avall amb el botó dret del ratolí per inclinar la vista, i «Reset north» l’anivella i en restableix la rotació. A Mapbox GL amb «Edificis 3D i terreny» activat, també aplana la vista 3D fins que la tornis a inclinar.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Col·laboració',
  'help.ctx.trip-collab.summary':
    'La pestanya on el grup planifica plegat, amb cinc targetes: el xat a l’esquerra, «Notes» i «Enllaços» al costat, i «Enquestes» i «Què ve ara» a sota. Tot el que s’hi escriu apareix a l’instant a la pantalla de la resta de membres, sense haver de recarregar.',
  'help.ctx.trip-collab.bullet.1':
    "El xat és la targeta de l'esquerra. Escriu a «Escriu un missatge...» i prem Retorn; amb Maj i Retorn fas un salt de línia. La cara somrient afegeix un emoji, i «Adjunta imatges» afegeix fins a quatre imatges al missatge.",
  'help.ctx.trip-collab.bullet.2':
    "Passa el ratolí per sobre d'un missatge per veure «Respon» i, als teus missatges, «Elimina»; fes-hi clic amb el botó dret per veure les vuit reaccions ràpides. Un missatge eliminat se substitueix per un avís que indica qui l'ha eliminat.",
  'help.ctx.trip-collab.bullet.3':
    "«Notes» és l'espai de notes compartides: «Nota nova», a la capçalera, crea una nota, i l'engranatge del costat obre «Gestiona les categories» per definir-ne els noms i els colors. Quan hi ha categories, una fila de pastilles sota la capçalera filtra les targetes: «Tots» o una categoria. Cada targeta de nota mostra la categoria amb un punt de color i l'enllaç amb un botó rodó, i els seus tres punts («Més opcions») contenen «Ampliar», «Fixa», «Edita» i «Elimina».",
  'help.ctx.trip-collab.bullet.4':
    "«Enllaços» recull les adreces web del viatge. «Afegeix un enllaç» demana un títol i una adreça http o https. «Edita l'enllaç», «Fixa l'enllaç» i «Suprimeix l'enllaç» són al final de la fitxa, i els enllaços fixats queden al davant.",
  'help.ctx.trip-collab.bullet.5':
    'Fes servir les enquestes per prendre decisions. «Enquesta nova» planteja una pregunta amb almenys dues opcions. Fes clic en una opció per votar-la. El cadenat («Tanca») i la paperera («Elimina»), a la dreta de la capçalera d’una enquesta, tanquen la votació o eliminen l’enquesta.',
  'help.ctx.trip-collab.bullet.6':
    '«Què ve ara» mostra les parades del viatge que encara han de venir, fins a vuit, amb els horaris i les persones que hi van. Només llegeix el pla del dia; els horaris es defineixen allà.',
  // write-note
  'help.guide.write-note.title': 'Escriure una nota compartida',
  'help.guide.write-note.goal':
    'Deixa el que necessita tot el grup, com una norma, una adreça o un recordatori, en un lloc on tothom ho trobi.',
  'help.guide.write-note.step.1':
    "Fes clic a «Nota nova» a la capçalera de la targeta «Notes». S'obre el diàleg de la nota, amb el cursor ja al camp del títol.",
  'help.guide.write-note.step.2':
    "Escriu el títol on diu «Títol de la nota», a dalt del diàleg. És l'únic camp obligatori: «Crea» es queda en gris fins que el títol té text, i si prems Retorn al títol, la nota es crea a l'instant.",
  'help.guide.write-note.step.3':
    '«Contingut» conté el text i admet Markdown: una paraula en negreta, una llista, un títol. La targeta mostra les tres primeres línies, i «Ampliar», al seu menú, obre la nota sencera.',
  'help.guide.write-note.step.4':
    "A «Categoria», tria la categoria de la nota. El seu color s'aplica ara a la capçalera del diàleg i, més endavant, a la de la targeta. La primera categoria ja ve triada. Les pastilles són les categories que ja existeixen, i en pots crear una de nova a «Gestiona les categories». Mentre el viatge no té cap categoria, aquesta fila no apareix.",
  'help.guide.write-note.step.5':
    'A «Lloc web» hi pots posar un enllaç relacionat amb la nota. Llavors la targeta mostra a dalt un botó rodó d’enllaç que l’obre.',
  'help.guide.write-note.step.6':
    'Fes clic a «Crea». Només «Cancel·la» i la seva creu tanquen el diàleg, així que un clic fora o Esc no et fan perdre el que has escrit.',
  'help.guide.write-note.result':
    "La nota és una targeta al panell «Notes», amb la part superior del color de la categoria, i tots els altres membres la veuen a l'instant.",
  'help.guide.write-note.tip.1':
    'Els tres punts d’una targeta («Més opcions») obren «Ampliar», «Fixa», «Edita» i «Elimina». «Fixa» manté la nota a dalt del panell, amb un marc del seu color. La resta de notes s’ordenen segons quan es van modificar per última vegada.',
  'help.guide.write-note.tip.2':
    "L'engranatge al costat de «Nota nova» obre «Gestiona les categories». Allà pots donar un color a una categoria, canviar-ne el nom a tot arreu alhora o afegir-la abans que cap nota la faci servir. No es canvia res fins que fas clic a «Desa».",
  'help.guide.write-note.tip.3':
    '«Adjunta fitxers» afegeix un document a la nota, si pots pujar fitxers al viatge. «Adjuntar» obre el selector de fitxers, i també pots enganxar una imatge o un PDF al diàleg.',
  'help.guide.write-note.tip.4':
    'Notes té el seu propi interruptor a «Complements», a sota de «Col·laboració»: un administrador el pot desactivar i mantenir en funcionament el xat, els enllaços, les enquestes i «Què ve després».',
  // shared-links
  'help.guide.shared-links.title': 'Recollir els enllaços del viatge',
  'help.guide.shared-links.goal':
    'Tingues el portal de reserves, l’àlbum compartit i els horaris en un sol lloc, sense haver de buscar-los al xat.',
  'help.guide.shared-links.step.1':
    "Fes clic a «Afegeix un enllaç», a la capçalera de la targeta «Enllaços». El diàleg s'obre amb el cursor al camp de dalt.",
  'help.guide.shared-links.step.2':
    "Escriu el nom a «Títol de l'enllaç», enganxa l'adreça a «Enllaç», a sota, i fes clic a «Desa l'enllaç».",
  'help.guide.shared-links.step.3':
    'L’etiqueta mostra el nom i el lloc web on porta l’enllaç. Fes-hi clic per obrir la pàgina en una pestanya nova.',
  'help.guide.shared-links.step.4':
    "Els tres botons rodons del final són «Edita l'enllaç», «Fixa l'enllaç» i «Suprimeix l'enllaç». «Fixa l'enllaç» mou l'enllaç al principi del panell i el mostra amb el color d'accent. «Suprimeix l'enllaç» et demana confirmació abans, perquè l'enllaç s'elimina per a tots els membres.",
  'help.guide.shared-links.result':
    "L'enllaç apareix com una etiqueta al panell «Enllaços», fixat al principi, i surt a la pantalla de tots els membres a l'instant.",
  'help.guide.shared-links.tip.1':
    'Només s’accepten adreces http o https. Qualsevol altra cosa es rebutja i el diàleg es queda obert amb el que has escrit.',
  'help.guide.shared-links.tip.2':
    'Primer surten els enllaços fixats i després els més nous. La icona petita al costat d’un títol és la icona del mateix lloc web, carregada des del lloc web, així que sense internet l’etiqueta mostra una icona d’enllaç genèrica.',
  'help.guide.shared-links.tip.3':
    '«Enllaços» té el seu propi interruptor a «Complements», sota «Col·laboració», de manera que un administrador pot desactivar el panell sense tocar la resta de la pestanya.',
  // create-poll
  'help.guide.create-poll.title': 'Fer una pregunta al grup',
  'help.guide.create-poll.goal':
    'Converteix una pregunta que ningú no respon al xat en una enquesta en què tothom pugui votar.',
  'help.guide.create-poll.step.1':
    "Fes clic a «Enquesta nova» a la capçalera de la targeta «Enquestes». S'obre el diàleg.",
  'help.guide.create-poll.step.2':
    'Escriu la pregunta a «Pregunta». El text «Compatible amb Markdown», a sota del quadre, vol dir que aquí pots fer servir negreta, salts de línia o una llista curta.',
  'help.guide.create-poll.step.3':
    'Omple «Opció 1» i «Opció 2», a «Opcions». Calen com a mínim dues opcions que no siguin buides, i una opció pot tenir diverses línies.',
  'help.guide.create-poll.step.4':
    '«Afegeix una opció», a sota, n’afegeix una tercera, una quarta, totes les que necessitis. La creu petita al costat d’una fila, que apareix quan en tens més de dues, elimina aquella opció.',
  'help.guide.create-poll.step.5':
    "«Selecció múltiple» permet que tothom marqui més d'una opció. Si està desactivat, el vot d'una persona passa a la nova opció quan en tria una altra.",
  'help.guide.create-poll.step.6': "Fes clic a «Crea l'enquesta».",
  'help.guide.create-poll.result':
    'L’enquesta apareix a dalt del panell «Enquestes», oberta i amb 0 vots a la capçalera.',
  'help.guide.create-poll.tip.1': 'La pregunta es mostra amb format Markdown; les opcions queden en text pla.',
  'help.guide.create-poll.tip.2':
    "«Crea l'enquesta» es queda en gris fins que hi ha una pregunta i almenys dues opcions amb text.",
  'help.guide.create-poll.tip.3':
    'La data límit només es pot posar des de l’aplicació del mòbil. Una enquesta amb data límit mostra el temps que queda en una fitxa ambre a la capçalera i es tanca quan s’acaba el temps.',
  'help.guide.create-poll.tip.4':
    '«Enquestes» té el seu propi interruptor a «Complements», sota «Col·laboració»: un administrador la pot desactivar i mantenir activats els altres quatre panells.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votar i consultar el resultat',
  'help.guide.vote-poll.goal': 'Vota, consulta els resultats del grup i canvia el teu vot.',
  'help.guide.vote-poll.step.1':
    'Fes clic a l’opció que vulguis. El cercle mostra una marca, l’opció queda envoltada d’un marc del color d’accent i la barra del fons creix.',
  'help.guide.vote-poll.step.2':
    'Ara pots veure tot el resultat: la barra mostra la proporció, el percentatge és a la dreta i els cercles petits són les persones que han triat aquella opció, fins a tres.',
  'help.guide.vote-poll.step.3':
    "Has canviat d'opinió? Fes clic a una altra opció. En una enquesta sense «Selecció múltiple», el teu vot passa a la nova opció en lloc de sumar-ne un segon.",
  'help.guide.vote-poll.step.4':
    'El nombre de vots apareix en una fitxa sota la pregunta. Si fas clic a l’opció que ja havies triat, se’t retira el vot i el recompte baixa.',
  'help.guide.vote-poll.result':
    'La teva opció queda marcada, les barres mostren com ha votat el grup i els cercles indiquen qui ha triat cada opció.',
  'help.guide.vote-poll.tip.1':
    "Els percentatges i qui ha votat cada opció només apareixen quan has votat tu, o quan l'enquesta està tancada. El nombre de vots de la capçalera el veu tothom.",
  'help.guide.vote-poll.tip.2':
    "Els vots no són mai anònims: passa el ratolí per un dels cercles d'una opció per veure el nom de qui ha votat.",
  // close-poll
  'help.guide.close-poll.title': 'Tancar o eliminar una enquesta',
  'help.guide.close-poll.goal':
    'Tanca la votació quan el grup ja ha decidit i elimina les enquestes que ja no necessita ningú.',
  'help.guide.close-poll.step.1':
    "«Tanca», el cadenat a la dreta de la capçalera de l'enquesta, posa fi a la votació. Ja no es pot fer clic a les opcions.",
  'help.guide.close-poll.step.2':
    "Una enquesta tancada baixa al final del panell, sota el títol «Tancada» si hi ha enquestes obertes a sobre. Té una fitxa «Tancada» i mostra el resultat a tothom, tant si ha votat com si no. L'opció guanyadora apareix en negreta sobre una barra verda; si és la que vas triar, la barra fa servir el teu color d'accent.",
  'help.guide.close-poll.step.3':
    '«Elimina», la paperera de la dreta de la capçalera, elimina l’enquesta. En una enquesta tancada és l’únic botó, perquè el cadenat ja no hi és. No es demana cap confirmació, i els vots també s’eliminen.',
  'help.guide.close-poll.result':
    'Una enquesta eliminada desapareix del panell de tots els membres. Una enquesta que només has tancat continua visible a la part de baix, amb el resultat.',
  'help.guide.close-poll.tip.1':
    "Tancar una enquesta no es pot desfer: no es pot tornar a obrir. Si l'has tancada per error, l'has de tornar a fer.",
  'help.guide.close-poll.tip.2':
    "«Elimina» elimina l'enquesta i tots els seus vots per a tothom, a l'instant i sense confirmació.",
  // whats-next
  'help.guide.whats-next.title': 'Consultar «Què ve ara»',
  'help.guide.whats-next.goal': 'Consulta què farà el grup a continuació sense obrir el pla.',
  'help.guide.whats-next.step.1':
    "La targeta mostra les properes parades del viatge, fins a vuit, per ordre cronològic i agrupades per dia: «Avui», «Demà» o la data, amb el títol del dia al costat si en té. La capçalera indica quantes n'hi ha.",
  'help.guide.whats-next.step.2':
    'A l’esquerra de cada parada hi ha l’hora: l’inici, «fins a» i el final si la parada en té, o «TBD» si encara no té hora.',
  'help.guide.whats-next.step.3':
    'Al costat hi ha el nom, l’adreça i, en forma d’etiquetes, les persones d’aquella parada. Si no hi ha ningú assignat a la parada, surten totes les persones del viatge.',
  'help.guide.whats-next.result':
    "Una llista del que ve, només per consultar: segueix el pla, i res d'aquí no el canvia.",
  'help.guide.whats-next.tip.1':
    "Aquí no has de definir res. Els horaris provenen del pla del dia; quan els canvies allà, aquesta llista s'actualitza a l'instant.",
  'help.guide.whats-next.tip.2':
    "Només hi apareix el que encara ha de venir: una parada desapareix de la llista quan ha passat la seva hora d'inici, una parada d'avui sense hora s'hi queda fins que acaba el dia, i al final del viatge el panell queda buit.",
  'help.guide.whats-next.tip.3':
    '«Què ve ara» té el seu propi interruptor a «Complements», sota «Col·laboració». És un panell d’escriptori: la pestanya «Col·laboració» de l’app per al mòbil no el mostra.',
  // trip-chat
  'help.guide.trip-chat.title': 'Parlar amb el grup',
  'help.guide.trip-chat.goal':
    "Envia un missatge, respon un missatge concret, reacciona a un altre i elimina'n un de teu.",
  'help.guide.trip-chat.step.1':
    'Escriu a «Escriu un missatge...» i prem Retorn. La fletxa rodona del costat del quadre fa el mateix. Amb Maj i Retorn, en canvi, fas un salt de línia.',
  'help.guide.trip-chat.step.2':
    'La cara somrient obre el selector d’emojis, amb «Cares», «Reaccions» i «Viatge». L’emoji que triïs s’afegeix al text que estàs escrivint. No s’envia sol.',
  'help.guide.trip-chat.step.3':
    "Passa el ratolí per sobre d'un missatge d'una altra persona: a la cantonada apareix un botó rodó petit. És «Respon».",
  'help.guide.trip-chat.step.4':
    "El missatge que respons apareix citat a sobre del quadre de text. Escriu i envia el teu missatge, i la cita s'envia amb ell. Fes clic a la creu de la cita per treure-la.",
  'help.guide.trip-chat.step.5':
    'Fes clic amb el botó dret en un missatge per veure les vuit reaccions ràpides. La teva reacció apareix sota el missatge. Torna a fer clic a la mateixa reacció per treure-la.',
  'help.guide.trip-chat.step.6':
    "Els teus missatges tenen «Elimina», la icona de la paperera, al costat de «Respon». Elimina el missatge a l'instant i apareix una nota que diu que l'has eliminat. No es pot desfer.",
  'help.guide.trip-chat.result':
    "La teva resposta és el missatge més recent, amb el missatge citat a dalt. La teva reacció apareix a sota de l'altre missatge. Al lloc del missatge que has eliminat, un avís indica que l'has eliminat tu.",
  'help.guide.trip-chat.tip.1':
    'Retorn envia el missatge, i Maj i Retorn fan un salt de línia. Un missatge que només té d’un a tres emojis es mostra gran.',
  'help.guide.trip-chat.tip.2':
    'Amb «Adjunta imatges» pots afegir fins a quatre imatges a un missatge. També les pots enganxar o deixar anar sobre el quadre de text.',
  'help.guide.trip-chat.tip.3':
    'Un missatge amb un enllaç mostra a sota una targeta de vista prèvia, que obté el teu propi TREK, de manera que un enllaç a un contingut al qual només tu tens accés es queda com un enllaç normal.',
  'help.guide.trip-chat.tip.4':
    '«Xat» té el seu propi interruptor a «Complements», sota «Col·laboració»: un administrador el pot desactivar i mantenir les notes, els enllaços, les enquestes i «Què ve ara».',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Llistes',
  'help.ctx.trip-lists.summary':
    'Dues llistes per viatge: la llista d’equipatge, amb qui porta què i quant pesa, i la llista de tasques amb tot el que cal fer abans del viatge i durant el viatge. La pestanya es mostra mentre el complement «Llistes» està activat.',
  'help.ctx.trip-lists.bullet.1':
    "«Llista d'equipatge» i «Pendents», a la barra de dalt, alternen entre totes dues i compten el que hi ha a cadascuna; els botons de l'extrem dret de la barra corresponen a la que estigui oberta.",
  'help.ctx.trip-lists.bullet.2':
    "La llista d'equipatge s'organitza en llistes, per exemple Documents o Roba, amb el nom que vulguis. Cada llista és una targeta. La capçalera té un agafador per arrossegar tota la llista a una altra posició, un punt de color, una insígnia amb els articles empaquetats sobre el total, tres punts amb «Canviar el nom», «Marca-ho tot», «Desmarca-ho tot» i «Elimina la categoria», i una fletxa que plega la targeta. «Afegeix una categoria», a la barra de dalt, en crea una de nova.",
  'help.ctx.trip-lists.bullet.3':
    "Cada fila té un agafador per arrossegar-la, una casella i un nom, i després un petit avatar de la persona que porta l'article. Un article amb una quantitat superior a un també té un comptador d'empaquetats, com ara 3/10, amb un menys i un més. Després hi ha la quantitat en una petita insígnia i, mentre «Seguiment d'equipatge» està activat, el pes en grams i un cercle de bossa; i al final, la paperera i un menú de tres punts amb «Canvia la categoria», «Compartint», «Canviar el nom» i «Elimina». Els controls que una fila no fa servir es veuen atenuats fins que hi passes el ratolí per sobre.",
  'help.ctx.trip-lists.bullet.4':
    "«Compartit» i «La meva llista» divideixen la llista d'equipatge en dues: la que veu tothom i la teva. «Tots», «Obert» i «Fet», al costat, filtren la que tinguis oberta. «A a Z», a l'extrem de la fila, ordena els articles de cada llista per nom, i un segon clic torna al teu ordre. La targeta de progrés de dalt compta el que ja està empaquetat.",
  'help.ctx.trip-lists.bullet.5':
    "«Aplica una plantilla» i «Desa com a plantilla» omplen una llista o la desen, perquè no l'hagis d'escriure. Les dues icones de després, «Exporta» i «Importa», exporten la llista per imprimir-la, en PDF o en un fitxer, i n'importen una. El botó vermell de l'extrem dret de la targeta de progrés mostra quants articles hi ha marcats i els elimina.",
  'help.ctx.trip-lists.bullet.6':
    '«Pendents» té la seva pròpia barra lateral: la targeta de progrés, els filtres «Tots», «Les meves tasques», «Vençuda» i «Fet», una fila per llista i, a sota, «Afegeix una categoria». Les tasques són en una targeta. La capçalera mostra el nom del filtre i l’ordre, «Prioritat» o «Data límit». Fes clic en una tasca per obrir-la al panell de la dreta. «Tasca nova», a la barra, obre el diàleg «Tasca nova».',
  // packing-categories
  'help.guide.packing-categories.title': "Preparar la llista d'equipatge",
  'help.guide.packing-categories.goal':
    "Agrupa en llistes el que t'emportes, afegeix-hi articles i tria qui s'encarrega de cada llista.",
  'help.guide.packing-categories.step.1':
    'Fes clic a «Afegeix una categoria», a la barra de sobre les llistes. S’obre un diàleg petit. Escriu el nom a la franja superior, on diu «Nom de la categoria (p. ex. Roba)», i fes clic a «Afegir».',
  'help.guide.packing-categories.step.2':
    'La llista nova comença amb una fila provisional que només mostra tres punts tènues. Fes clic a «Afegeix un article», a la part de baix de la fila, escriu l’article a «Nom de l’article...» i prem Retorn: el primer article substitueix la fila provisional i el camp queda obert per al següent.',
  'help.guide.packing-categories.step.3':
    "Canvia el nom d'una fila fent clic al nom, o amb «Canviar el nom» als tres punts de l'extrem dret.",
  'help.guide.packing-categories.step.4':
    'El cercle discontinu amb una persona, a la franja superior de la llista, assigna membres del viatge a la llista. Tria un nom. Per treure aquella persona, fes clic a la fitxa que apareix.',
  'help.guide.packing-categories.step.5':
    'Els tres punts del costat del comptador obren més opcions: «Canviar el nom», «Marca-ho tot», «Desmarca-ho tot» i «Elimina la categoria». «Elimina la categoria» elimina la llista i tots els seus articles sense tornar a preguntar. La fletxa de l’extrem dret plega la llista.',
  'help.guide.packing-categories.result':
    'La llista nova apareix a la graella amb els seus articles a sota i el seu punt de color, i la seva insígnia compta el que ja tens preparat.',
  'help.guide.packing-categories.tip.1':
    "Una llista només existeix pels seus articles. Si elimines l'últim, la fila es converteix en un marcador perquè la llista conservi la posició i el color; si també elimines aquesta fila, s'elimina la llista.",
  'help.guide.packing-categories.tip.2':
    'Quan assignes algú a una llista, rep una notificació d’equipatge. Això no canvia qui pot veure els articles: ho decideixes a «Compartint», al menú dels tres punts d’una fila.',
  'help.guide.packing-categories.tip.3':
    'Dues llistes poden tenir el mateix nom. TREK les distingeix internament, així que els noms es mantenen tal com els has escrit.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Marcar les coses mentre fas la maleta',
  'help.guide.check-off-packing.goal':
    'Marca el que ja és a la bossa, segueix la barra de progrés i treu els articles empaquetats.',
  'help.guide.check-off-packing.step.1':
    'Fes clic a la casella de l’esquerra d’una fila. El nom queda ratllat i la barra de progrés s’actualitza.',
  'help.guide.check-off-packing.step.2':
    'La targeta de progrés de sobre les llistes mostra quants articles tens preparats del total de la llista, en xifra, en percentatge i en una barra.',
  'help.guide.check-off-packing.step.3':
    'Per marcar tota una llista de cop: als tres punts de la capçalera hi tens «Marca-ho tot» i «Desmarca-ho tot».',
  'help.guide.check-off-packing.step.4':
    '«Tots», «Obert» i «Fet», al costat de «Compartit» i «La meva llista», filtren la graella. «Obert» només mostra el que encara falta, així una llista que ja tens tota feta queda amagada.',
  'help.guide.check-off-packing.step.5':
    "El botó vermell «Treu … marcats», a l'extrem dret de la targeta de progrés, amb el nombre d'articles marcats, els elimina tots alhora després d'una confirmació del navegador.",
  'help.guide.check-off-packing.result':
    'Només es mostren els articles pendents, i la barra de dalt indica quina part de l’equipatge ja està feta.',
  'help.guide.check-off-packing.tip.1': 'Un article marcat encara es pot canviar de nom: fes clic al nom.',
  'help.guide.check-off-packing.tip.2':
    '«Marca-ho tot» i «Desmarca-ho tot» actuen sobre una llista cada vegada, des dels tres punts de la mateixa llista.',
  'help.guide.check-off-packing.tip.3':
    'Quan tots els articles estan marcats, el comptador es substitueix per «Tot preparat!» i la barra es posa verda.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': "Aplicar una plantilla d'equipatge",
  'help.guide.apply-packing-template.goal':
    "Afegeix una llista ja feta al viatge i desa la llista d'aquest viatge per al següent.",
  'help.guide.apply-packing-template.step.1': 'Fes clic a «Aplica una plantilla», a la barra de sobre la llista.',
  'help.guide.apply-packing-template.step.2': 'Tria una plantilla. Cada línia mostra el nom i quants articles té.',
  'help.guide.apply-packing-template.step.3':
    "Els articles s'afegeixen a la vista on ets: «Compartit» els afegeix a la llista compartida que veu tothom, i «La meva llista», a la teva llista personal.",
  'help.guide.apply-packing-template.step.4':
    "Per conservar la llista d'aquest viatge per al proper, fes clic a «Desa com a plantilla». S'obre un diàleg petit. Escriu un nom al camp de dalt, on diu «Nom de la plantilla», i fes clic a «Desa».",
  'help.guide.apply-packing-template.result':
    'Les llistes i els articles de la plantilla s’afegeixen al viatge, al costat del que ja hi havia.',
  'help.guide.apply-packing-template.tip.1':
    "Una plantilla copia la llista, la quantitat, el pes i la bossa de cada article, i crea les bosses que el viatge encara no té. No es copien les marques, i no s'elimina res del que ja hi ha a la llista.",
  'help.guide.apply-packing-template.tip.2':
    "«Aplica una plantilla» només apareix quan hi ha alguna plantilla. Si no n'hi ha cap, el botó no surt.",
  'help.guide.apply-packing-template.tip.3':
    "«Desa com a plantilla» només apareix per als administradors de la instància, i només quan la llista té articles. Desa els articles compartits i els teus, però mai els articles privats d'altres membres.",
  // import-packing-list
  'help.guide.import-packing-list.title': 'Enganxar una llista d’equipatge sencera',
  'help.guide.import-packing-list.goal':
    'Converteix d’un sol cop una llista que ja tens en un altre lloc en articles d’equipatge.',
  'help.guide.import-packing-list.step.1':
    "Fes clic a «Importa», la icona amb la fletxa avall a l'extrem dret de la barra de sobre la llista.",
  'help.guide.import-packing-list.step.2':
    'Un article per línia: categoria, nom, pes en g (opcional), bossa (opcional), checked/unchecked (opcional). L\'exemple gris del requadre mostra els quatre formats, i els números del marge esquerre compten les línies que escrius. També funciona una llista en Markdown: un títol fa de nom de la llista, i "- [ ]" i "- [x]" es converteixen en articles.',
  'help.guide.import-packing-list.step.3':
    'També pots carregar les línies d’un fitxer amb «Carrega CSV/TXT/MD», a baix a l’esquerra del diàleg. Accepta fitxers .csv, .txt o .md i substitueix el que hi hagi al quadre.',
  'help.guide.import-packing-list.step.4':
    'Fes clic a «Importa 3», a baix a la dreta; el número indica quantes línies ha entès TREK.',
  'help.guide.import-packing-list.result':
    'Cada línia es converteix en una fila, a la llista que indica el primer camp. Els articles que ja hi eren no canvien.',
  'help.guide.import-packing-list.tip.1':
    'Les comes, els punts i comes i els tabuladors separen els camps, i les cometes dobles mantenen un camp sencer, així "Camisa, blava" continua sent un sol nom. Una línia amb un sol valor és només un nom. Una línia sense llista pròpia va a «Altres». "3x" davant d’un nom n’indica la quantitat.',
  'help.guide.import-packing-list.tip.2':
    "Si el viatge encara no té la bossa indicada al quart camp, TREK la crea. «Importa» i «Aplica una plantilla» són les dues maneres d'afegir pesos i bosses a molts articles alhora.",
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimir o exportar la llista d’equipatge',
  'help.guide.export-packing-list.goal':
    'Imprimeix la llista, desa-la en PDF o exporta-la en un fitxer per a una altra aplicació o per al proper viatge.',
  'help.guide.export-packing-list.step.1':
    "Fes clic a «Exporta», la icona amb la fletxa amunt de la barra de sobre la llista, just davant d'«Importa».",
  'help.guide.export-packing-list.step.2':
    '«Llista de comprovació en Markdown (.md)» i «CSV per importar (.csv)» desen la llista com a fitxer al moment.',
  'help.guide.export-packing-list.step.3':
    'Fes clic a «Imprimeix o desa com a PDF». La previsualització mostra la llista com una pàgina: a dalt, el viatge, les dates i quant hi ha preparat; després, cada llista en una targeta, amb una casella per marcar a cada article.',
  'help.guide.export-packing-list.step.4':
    "Fes clic a «Imprimeix o desa com a PDF», a sota de la previsualització. El navegador obre el diàleg d'impressió: tria una impressora o «Desa com a PDF» per desar un fitxer.",
  'help.guide.export-packing-list.result':
    'La impressió i els fitxers contenen la vista que tens oberta, «Compartit» o «La meva llista», amb les quantitats, els pesos i les marques.',
  'help.guide.export-packing-list.tip.1':
    'El CSV és el format que llegeix «Importa», bosses incloses, així que el pots fer servir com a plantilla d’equipatge pròpia: importa’l al proper viatge.',
  'help.guide.export-packing-list.tip.2':
    "El fitxer Markdown s'obre com a llista de comprovació a Obsidian, Notion o GitHub, i el pots tornar a importar amb «Importa».",
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidir qui veu un article i qui el porta',
  'help.guide.share-packing-item.goal':
    'Mou un article entre el fons comú del grup, la teva llista i les persones per a qui el portes.',
  'help.guide.share-packing-item.step.1':
    'Sobre les llistes, «Compartit» és la llista que veu tothom i «La meva llista» és la teva. Cadascuna mostra quants articles té. Fes clic a «La meva llista» per veure la teva.',
  'help.guide.share-packing-item.step.2':
    "Torna a «Compartit», obre els tres punts del final d'una fila i fes clic a «Compartint».",
  'help.guide.share-packing-item.step.3':
    'Hi ha tres nivells: «Compartit», visible per a tot el grup; «Personal», que només veus tu; i «Compartit amb…», on tries per a qui és l’article.',
  'help.guide.share-packing-item.step.4':
    'Un article «Personal» només és a «La meva llista». Canvia a «La meva llista» per trobar-lo.',
  'help.guide.share-packing-item.step.5':
    "Torna a obrir «Compartint» i marca un nom a «Compartit amb…». L'article també apareix a la llista d'aquella persona, i la fila mostra una petita insígnia amb el nombre de persones amb qui es comparteix.",
  'help.guide.share-packing-item.result': "L'article és al nivell que has triat, i la fila mostra qui el porta.",
  'help.guide.share-packing-item.tip.1':
    'Només qui porta un article en pot canviar la manera de compartir-lo. Les persones amb qui l’has compartit el veuen a «La meva llista» amb una petita insígnia en forma de mà, que mostra el teu nom quan hi passen el ratolí per sobre. El poden marcar.',
  'help.guide.share-packing-item.tip.2':
    "En un article compartit que porta una altra persona, el menú de tres punts mostra dues opcions diferents en lloc de «Compartint»: «Jo també puc portar això», que t'afegeix al seu costat, i «Copiar a la meva llista», que en fa una còpia privada per a tu.",
  'help.guide.share-packing-item.tip.3':
    "Els articles nous agafen la compartició de la vista on els afegeixes. Els que afegeixes a «Compartit» es comparteixen amb tothom. Els que afegeixes a «La meva llista» són personals, tret que tots els articles d'aquella llista estiguin compartits amb les mateixes persones: en aquest cas, el nou article també es comparteix amb elles.",
  // packing-bags
  'help.guide.packing-bags.title': 'Pesar les maletes',
  'help.guide.packing-bags.goal':
    'Posa el pes de cada article, reparteix els articles en maletes i mantén cada maleta per sota del límit de la companyia aèria.',
  'help.guide.packing-bags.step.1':
    'Fes clic a l’etiqueta de pes que hi ha abans del cercle i escriu el pes de l’article en grams.',
  'help.guide.packing-bags.step.2': "El cercle de després del pes és la bossa de l'article. Fes-hi clic.",
  'help.guide.packing-bags.step.3':
    "Si encara no hi ha cap bossa, fes clic a «Afegeix equipatge», escriu un nom i prem Retorn. Es crea la bossa i l'article s'hi posa.",
  'help.guide.packing-bags.step.4':
    "La targeta «Equipatge» apareix a la dreta de les llistes tan bon punt hi ha una bossa. Cada bossa mostra el nom, qui la porta, una barra d'ompliment, quants articles hi ha i el pes. Sota les bosses hi ha «Sense assignar» i «Pes total», i a sota «Preparats»: el pes ja empaquetat i una barra fina amb la seva proporció.",
  'help.guide.packing-bags.step.5':
    'Fes clic a «Defineix un límit», al costat del pes de la bossa, i escriu el límit en quilograms, tal com l’indiquen les companyies aèries.',
  'help.guide.packing-bags.step.6':
    'El més discontinu del final de la línia del nom de la bossa, just abans de la creu, obre «Assigna membres». Marca els membres que porten la bossa: apareixen al costat del més, i «Per persona», a baix de la targeta, mostra què porta cadascú.',
  'help.guide.packing-bags.result':
    'La targeta «Equipatge», a la dreta, mostra el pes de cada bossa respecte del seu límit, què no és en cap bossa, què porta cada persona i el total, amb la part que ja està empaquetada.',
  'help.guide.packing-bags.tip.1':
    "El camp del pes, el cercle de la bossa i la targeta «Equipatge» només existeixen mentre un administrador té activat «Seguiment d'equipatge» al complement «Llistes». En una finestra més estreta, l'equipatge s'obre des del botó «Equipatge» de sobre la targeta de progrés.",
  'help.guide.packing-bags.tip.2':
    "El servidor calcula el pes d'una maleta amb els articles de tots els membres, també els que tu no veus, així que la xifra és el pes real de la maleta.",
  'help.guide.packing-bags.tip.3':
    'Una maleta sense límit es compara amb la més pesada, perquè puguis comparar les barres. Si li poses un límit, la barra es mesura respecte a aquest límit.',
  // create-todo
  'help.guide.create-todo.title': 'Afegir una tasca',
  'help.guide.create-todo.goal': 'Apunta una tasca, amb una llista, una prioritat, una data i una persona assignada.',
  'help.guide.create-todo.step.1': "Fes clic a «Tasca nova», a l'extrem dret de la barra.",
  'help.guide.create-todo.step.2':
    'S’obre el diàleg «Tasca nova» amb el cursor a la capçalera. Escriu el nom al camp «Nom de la tasca» i afegeix a «Descripció» tot el que vulguis recordar.',
  'help.guide.create-todo.step.3':
    "«Llista» agrupa la tasca. Tria'n una o fes servir el botó + del costat per posar nom a una de nova en un petit diàleg.",
  'help.guide.create-todo.step.4': '«Prioritat» té quatre botons: «Cap», P1, P2 i P3, del vermell al blau.',
  'help.guide.create-todo.step.5':
    '«Data límit», al costat de «Llista», obre un calendari, i «Assignada a» assigna la tasca a una persona.',
  'help.guide.create-todo.step.6': 'Fes clic a «Crea una tasca».',
  'help.guide.create-todo.result':
    "La tasca és a la llista amb la prioritat, la data límit i la llista com a insígnies, i l'avatar de la persona assignada al final de la fila, i s'obre al panell de la dreta.",
  'help.guide.create-todo.tip.1':
    'Només cal el nom. Tota la resta ho pots omplir més endavant des del panell de la dreta.',
  'help.guide.create-todo.tip.2':
    'Si tens una llista seleccionada a la barra lateral, la tasca nova es crea en aquella llista.',
  'help.guide.create-todo.tip.3':
    'Si prems Retorn al camp del nom, la tasca es crea de seguida, sense passar pels altres camps.',
  // todo-filters
  'help.guide.todo-filters.title': 'Trobar i canviar una tasca',
  'help.guide.todo-filters.goal': 'Mostra només les tasques que importen ara i després edita la que has trobat.',
  'help.guide.todo-filters.step.1':
    '«Tasques», a la barra lateral: «Tots» mostra tot el que encara està pendent, «Les meves tasques» mostra el que tens assignat, «Vençuda» mostra les tasques amb una data ja passada i «Fet» mostra les tasques acabades. Cadascun mostra el seu recompte. Fes clic a «Vençuda».',
  'help.guide.todo-filters.step.2':
    "A «Llistes» hi ha una fila per llista. Tria'n una per mostrar aquella llista, tasques acabades incloses.",
  'help.guide.todo-filters.step.3':
    "L'ordre de dalt de la llista canvia l'ordre del que hi ha a la pantalla: «Prioritat» posa primer P1, i «Data límit» posa primer el termini més proper. Només en pots fer servir un alhora, i un segon clic torna al teu ordre.",
  'help.guide.todo-filters.step.4': 'Fes clic en una tasca per obrir-la al panell de la dreta.',
  'help.guide.todo-filters.step.5':
    "Canvia el que calgui: el nom, «Prioritat», «Llista», «Data límit» o «Assignada a». «Descripció» mostra el text amb enllaços que funcionen; fes-hi clic per editar-lo. Després fes clic a «Desar els canvis», a baix del panell. La casella de la capçalera del panell marca la tasca com a feta, i «Elimina», al costat de «Desar els canvis», l'elimina a l'instant.",
  'help.guide.todo-filters.result':
    'La llista mostra només les tasques que has demanat, i al panell de la dreta pots editar la que has triat.',
  'help.guide.todo-filters.tip.1':
    'Cada fila de llista només compta les tasques pendents, però quan la selecciones també es mostren les acabades. «Tots», «Les meves tasques» i «Vençuda» amaguen les tasques acabades; «Fet» només mostra les acabades.',
  'help.guide.todo-filters.tip.2':
    'A l’ordenació, «Prioritat» i «Data límit» no es poden fer servir alhora. Mentre n’hi hagi una d’activa, no pots arrossegar les files per ordenar-les al teu gust.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Reserves',
  'help.ctx.trip-bookings.summary':
    "Aquesta pestanya conté tot el que s'ha reservat per al viatge excepte el transport: allotjaments, taules, entrades, excursions i aparcaments. Cada reserva és una targeta, una fila de la llista o una barra de la cronologia, amb el seu codi, els documents, els viatgers i el cost. Fes clic a una reserva per obrir-ne els detalls.",
  'help.ctx.trip-bookings.bullet.1':
    '«Reserva manual», a l’extrem dret de la barra, obre «Reserva nova». Pots crear sis tipus de reserves: «Allotjament», «Restaurant», «Esdeveniment», «Excursió», «Aparcament» i «Altres». Els vols, els trens i la resta de transports són a la pestanya «Transports» i aquí no apareixen mai.',
  'help.ctx.trip-bookings.bullet.2':
    "La icona de baixada de davant de «Reserva manual», «Importa confirmacions de reserva», puja confirmacions perquè TREK les llegeixi automàticament: EML, PDF, PKPass, HTML o TXT, fins a cinc fitxers de 10 MB com a màxim, i fotos si el model d'IA llegeix imatges. La icona només apareix si el servidor les pot llegir.",
  'help.ctx.trip-bookings.bullet.3':
    "«Cercar» busca als títols, tipus, llocs, notes, codis de reserva i viatgers. «Filtra», l'embut del costat, redueix la pestanya per «Estat», per «Tipus», amb un recompte per a cadascun, i per «Viatgers» quan alguna reserva indica persones. Un número a l'embut mostra quants filtres hi ha actius.",
  'help.ctx.trip-bookings.bullet.4':
    "Les tres icones de després de «Filtra» canvien la vista: «Targetes», «Llista» i «Cronologia». «Opcions de vista», els controls lliscants del costat, agrupa i ordena les targetes i la llista o defineix els carrils de la cronologia, i la icona del full de càlcul que ve després, «Exporta com a full de càlcul (CSV)», baixa en un fitxer el que mostra la pestanya. Per defecte, les targetes s'agrupen en «Confirmat» i «Pendent», i la llista, per dia. Fes clic al títol d'una secció per plegar-la.",
  'help.ctx.trip-bookings.bullet.5':
    "Cada targeta té una capçalera amb el color del seu estat, amb el punt d'estat (un clic l'alterna entre «Pendent» i «Confirmat»), el tipus, el títol, el llapis i la paperera. A sota hi ha els detalls que tingui la reserva: «Data», «Data i hora», «Codi de reserva», «Registre d'entrada» i «Registre de sortida», «Ubicació / adreça», «Allotjament», «Vinculada a» (la parada del pla), «Enllaç», «Notes», «Viatgers», «Fitxers» i les despeses vinculades.",
  'help.ctx.trip-bookings.bullet.6':
    "Un clic en una targeta, una fila o una barra obre el detall de la reserva, amb «Al mapa» (si la reserva té un lloc), la paperera i «Edita» a baix. Per eliminar-la, demana confirmació una vegada («Vols eliminar la reserva?», que t'avisa si també s'eliminen costos). Després s'eliminen la reserva i les despeses vinculades, i en el cas d'un allotjament, les seves nits desapareixen del pla del dia.",
  // booking-views
  'help.guide.booking-views.title': 'Canviar la vista i obrir una reserva',
  'help.guide.booking-views.goal':
    'Mira les reserves com a targetes, en una llista o en una cronologia, i obre’n una per veure’n tots els detalls.',
  'help.guide.booking-views.step.1':
    "Les tres icones de després de «Filtra», a la barra, són les vistes, i cadascuna mostra el seu nom quan hi passes el ratolí: «Targetes», «Llista» i «Cronologia». La pestanya s'obre a «Targetes», amb una targeta per reserva a les seccions «Confirmat» i «Pendent». Fes clic a «Llista», la del mig.",
  'help.guide.booking-views.step.2':
    "«Llista» mostra una fila per reserva sota un títol per dia, amb el dia i l'hora a la dreta; les tecles de fletxa passen d'una fila a l'altra. Fes clic a «Cronologia», l'última de les tres.",
  'help.guide.booking-views.step.3':
    '«Cronologia» mostra les reserves al llarg dels dies del viatge: un carril per tipus i una barra des de l’inici fins al final de cada reserva. Les reserves pendents tenen el contorn discontinu. «Viatge» encabeix tot el viatge a l’amplada; fes clic a l’encapçalament d’un dia per veure aquell dia hora per hora.',
  'help.guide.booking-views.step.4':
    '«Dia» mostra un dia en una escala horària, i la longitud de cada barra indica la seva durada. Les fletxes del costat del nom del dia passen al dia anterior i al següent. Mentre el viatge està en curs, «Avui» salta al dia actual, i el selector «Viatge» i «Dia» de la dreta torna a tot el viatge.',
  'help.guide.booking-views.step.5':
    "Passa el ratolí per sobre d'una barra per veure'n el dia, les hores i el lloc, i fes-hi clic per obrir el detall de la reserva. Una targeta a «Targetes» i una fila a «Llista» obren la mateixa finestra emergent.",
  'help.guide.booking-views.step.6':
    "La capçalera de la vista de detall mostra el títol i unes píndoles amb l'estat (un clic el canvia), el tipus, el dia i el codi de reserva, amb un botó per copiar-lo. A sota hi ha les hores en forma de quadres i, després, el lloc, els viatgers, les notes, les despeses i els fitxers, si la reserva en té. A baix de tot, «Al mapa», la paperera i «Edita».",
  'help.guide.booking-views.result':
    'La reserva s’obre en la vista de detall: «Edita» n’obre el formulari, «Al mapa» la mostra al pla, i «Tanca» o Escape et tornen a la vista d’on venies.',
  'help.guide.booking-views.tip.1':
    '«Opcions de vista», la icona de controls lliscants que hi ha després de les icones de vista, et permet agrupar i ordenar «Targetes» i «Llista» amb «Agrupar per» i «Ordena per». A «Cronologia» ofereix «Un carril per tipus» i «Mostrar l’altra pestanya». «Mostrar l’altra pestanya» mostra les entrades de la pestanya «Transports», atenuades, en un carril estret a la part de dalt. «Restablir la vista» recupera els valors per defecte, i cada pestanya recorda la seva vista en aquest navegador.',
  'help.guide.booking-views.tip.2':
    "Una reserva d'abans o de després del viatge, o sense data, no pot aparèixer a la cronologia. Es mostra sota el gràfic com una petita targeta a «Abans del viatge», «Després del viatge» o «Sense data».",
  'help.guide.booking-views.tip.3':
    "Els mateixos detalls s'obren on sigui que aparegui una reserva: a la pestanya «Transports», al pla del dia, als detalls d'un dia i als d'un lloc. Un clic al títol canvia el nom de la reserva.",
  // create-booking
  'help.guide.create-booking.title': 'Crear una reserva',
  'help.guide.create-booking.goal':
    "Afegeix a mà al viatge un restaurant, un esdeveniment, una excursió, una plaça d'aparcament o qualsevol altra cosa.",
  'help.guide.create-booking.step.1':
    "Fes clic a «Reserva manual», a l'extrem dret de la barra. S'obre «Reserva nova», amb el títol i dues píndoles a la capçalera.",
  'help.guide.create-booking.step.2':
    'Fes clic a l’etiqueta del tipus a la franja superior, que en una reserva nova diu «Altres», i tria el «Tipus de reserva». Des d’aquesta pestanya pots crear sis tipus: «Allotjament», «Restaurant», «Esdeveniment», «Excursió», «Aparcament» i «Altres». El formulari canvia segons el que triïs: només «Allotjament» fa servir un interval de dies en lloc de dates.',
  'help.guide.create-booking.step.3':
    'Escriu el títol a la franja superior, al camp que hi ha sobre les etiquetes. És l’únic camp obligatori, i «Afegir» està desactivat fins que hi escriguis alguna cosa.',
  'help.guide.create-booking.step.4':
    "Indica la «Data» i l'«Hora d'inici», i la «Data de fi» i l'«Hora de fi» si la reserva té final. Els calendaris només ofereixen dies del viatge. Una data i hora de fi que no siguin posteriors a l'inici es mostren en vermell i bloquegen «Afegir». Una hora de fi anterior a l'hora d'inici sense data de fi només genera un avís: si la reserva acaba l'endemà, indica-hi una data de fi.",
  'help.guide.create-booking.step.5':
    "Introdueix el «Codi de reserva» de la confirmació i després fes clic a la pastilla d'estat de la capçalera, al costat del tipus. En una reserva nova diu «Pendent» i canvia a «Confirmat». L'estat determina a quina secció apareix la targeta.",
  'help.guide.create-booking.step.6': 'Fes clic a «Afegir», a baix del formulari.',
  'help.guide.create-booking.result':
    'La reserva apareix com una targeta a la seva secció. El color de la capçalera indica l’estat, i la targeta mostra el tipus, la data, els horaris i el codi. La resta de membres del viatge la veuen a l’instant.',
  'help.guide.create-booking.tip.1':
    '«Ubicació / adreça» et proposa adreces reals mentre escrius; si en tries una, substitueix el que havies escrit, i si escrius una adreça tu mateix, es manté tal qual.',
  'help.guide.create-booking.tip.2':
    "A «Enllaç», posa l'adreça de la pàgina de la reserva al web del proveïdor. La targeta i la vista de detall la mostren com un enllaç que s'obre en una pestanya nova.",
  'help.guide.create-booking.tip.3':
    'Les notes admeten Markdown, així una llista o una línia en negreta es mostren com a llista o en negreta a la targeta i a la vista de detall.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Reservar un allotjament',
  'help.guide.booking-hotel.goal':
    'Introdueix un allotjament perquè compti alhora com a reserva i com a nits al pla del dia.',
  'help.guide.booking-hotel.step.1':
    "Fes clic a «Reserva manual» i tria «Allotjament» amb la pastilla de tipus de la franja superior. Els camps de data se substitueixen per un bloc de camps d'hotel.",
  'help.guide.booking-hotel.step.2':
    "Tria l'hotel a «Allotjament». La llista conté els llocs del viatge, sense les traces ni les excursions importades. Quan en tries un, el nom s'escriu al títol, si és buit, i l'adreça, a «Ubicació / adreça».",
  'help.guide.booking-hotel.step.3':
    'Defineix «De» i «Fins a»: la primera nit i el matí que marxes. Tots dos ofereixen els dies del viatge amb les dates, i TREK fa que «Fins a» sempre sigui posterior a «De».',
  'help.guide.booking-hotel.step.4':
    "Omple «Registre d'entrada», «Registre fins a» i «Registre de sortida», i el «Codi de reserva» de la confirmació.",
  'help.guide.booking-hotel.step.5': 'Fes clic a «Afegir».',
  'help.guide.booking-hotel.result':
    'La targeta mostra l’interval de dies a «Data», les hores d’entrada i de sortida i l’adreça. L’estada també apareix ara en aquests dies del pla.',
  'help.guide.booking-hotel.tip.1':
    '«Allotjament» és l’únic tipus sense «Data» ni «Hora d’inici». Les seves dates són «Des del» i «Fins al», i hi tries dies del viatge, no dates del calendari.',
  'help.guide.booking-hotel.tip.2':
    "Deixa «Allotjament» buit i escriu-hi l'adreça: el lloc es busca, es crea i es marca al mapa automàticament.",
  'help.guide.booking-hotel.tip.3': 'Si elimines la reserva, les seves nits també desapareixen del pla del dia.',
  // link-booking
  'help.guide.link-booking.title': 'Vincular una reserva al pla',
  'help.guide.link-booking.goal':
    'Vincula una reserva a la seva parada i al seu lloc perquè aparegui on la necessites.',
  'help.guide.link-booking.step.1':
    "Passa el punter per sobre de la targeta que vols vincular i fes clic al llapis de la capçalera. S'obre «Edita la reserva».",
  'help.guide.link-booking.step.2':
    'Obre «Vincula a una assignació del dia». La llista mostra el teu pla: un títol per a cada dia i, a sota, les parades d’aquell dia, numerades i amb les hores. Tria la parada a què correspon la reserva.',
  'help.guide.link-booking.step.3':
    '«Lloc / Activitat» vincula el lloc en si. Tria’l aquí i, si estan buits, s’omplen el títol i «Ubicació / adreça».',
  'help.guide.link-booking.step.4': 'Fes clic a «Actualitza».',
  'help.guide.link-booking.result':
    'La targeta mostra el dia i la parada a «Vinculada a», i la reserva apareix amb aquella parada al pla del dia.',
  'help.guide.link-booking.tip.1':
    '«Sense vincle (independent)», a dalt de la llista, elimina el vincle. «Allotjament» no té selector de parades: es vincula a través de les nits.',
  'help.guide.link-booking.tip.2':
    "Si tries una parada d'un dia amb data, s'omple automàticament una «Data» buida. Si ja havies posat una data, no es canvia.",
  // booking-travelers
  'help.guide.booking-travelers.title': 'Indicar per a qui és una reserva',
  'help.guide.booking-travelers.goal':
    'Indica per a quins viatgers és una reserva i després mostra només les seves reserves.',
  'help.guide.booking-travelers.step.1':
    'Obre la reserva amb el llapis de la targeta. «Viatgers» és al costat de «Codi de reserva». Mentre no hi hagi ningú assignat a la reserva, mostra «Assigna viatgers».',
  'help.guide.booking-travelers.step.2':
    'Fes-hi clic i tria les persones per a qui és aquesta reserva; els convidats amb nom també hi surten. Una persona seleccionada té una marca i el seu avatar apareix al camp. Torna a fer clic al nom per treure-la.',
  'help.guide.booking-travelers.step.3': 'Fes clic a «Actualitza».',
  'help.guide.booking-travelers.step.4':
    'Fes clic a «Filtra» a la barra: a «Viatgers», fes clic en una persona per veure només les seves reserves. En pots activar diverses alhora.',
  'help.guide.booking-travelers.result':
    'La targeta mostra les persones per a qui és, i «Filtra» redueix la pestanya a les reserves de les persones que triïs.',
  'help.guide.booking-travelers.tip.1':
    'A la targeta i a la vista de detall, els viatgers només es mostren; no els pots canviar allà. Els indiques aquí, al formulari.',
  'help.guide.booking-travelers.tip.2':
    '«Viatgers» apareix a «Filtra» quan el viatge té més d’un membre i almenys una reserva té algú assignat. La teva tria es manté fins que tanques la pestanya del navegador.',
  // booking-files
  'help.guide.booking-files.title': 'Desar el comprovant amb la reserva',
  'help.guide.booking-files.goal': 'Adjunta la confirmació, el bitllet o el passi a la reserva corresponent.',
  'help.guide.booking-files.step.1':
    "Obre la reserva amb el llapis de la seva targeta. «Fitxers» és al costat de «Vincula»; fes-hi clic a «Adjunta un fitxer». En una reserva que ja existeix, el document es puja a l'instant i TREK mostra «Fitxer pujat».",
  'help.guide.booking-files.step.2': 'El document apareix amb el seu nom, un botó per obrir-lo i una X al costat.',
  'help.guide.booking-files.step.3':
    "«Vincula un fitxer existent» et mostra els documents del viatge que encara no són en aquesta reserva. Tria'n un i s'adjunta sense haver-lo de tornar a pujar.",
  'help.guide.booking-files.step.4': 'Fes clic a «Actualitza».',
  'help.guide.booking-files.result':
    'La targeta i la vista de detall mostren els documents a «Fitxers». Fes clic a un document per obrir-lo. «Mostrar als fitxers», a sobre de la llista de la vista de detall, et porta a la pestanya «Fitxers».',
  'help.guide.booking-files.tip.1':
    'En una reserva que encara estàs creant, el document es puja quan fas clic a «Afegir». Per pujar-lo cal connexió.',
  'help.guide.booking-files.tip.2':
    'La X del costat d’un document elimina el vincle, no el document. El document es queda a la pestanya «Fitxers» del viatge.',
  'help.guide.booking-files.tip.3':
    'L’administrador decideix quins tipus de fitxer es poden adjuntar, a «Tipus de fitxer permesos». Per defecte, es permeten documents, text i imatges.',
  // booking-cost
  'help.guide.booking-cost.title': "Convertir el preu d'una reserva en una despesa",
  'help.guide.booking-cost.goal':
    "Afegeix el cost d'una reserva a «Pressupost», repartit entre les persones que la paguen.",
  'help.guide.booking-cost.step.1':
    'Obre la reserva amb el llapis de la targeta i baixa fins al final del formulari. A «Pressupost» hi ha «Crear despesa» i «Vincular despesa existent», amb la nota «Desa la reserva i després obre l’editor de Pressupost».',
  'help.guide.booking-cost.step.2':
    "Fes clic a «Crear despesa». La reserva es desa, el formulari es tanca i l'editor de despeses s'obre com a «Afegir despesa».",
  'help.guide.booking-cost.step.3':
    "El nom de la capçalera ja és el títol de la reserva, i «Dia» ja és el dia de la reserva. Introdueix l'«Import total» i comprova la «Divisa» del costat.",
  'help.guide.booking-cost.step.4':
    "La píndola de la capçalera és la «Categoria», ja posada en la que correspon al tipus de reserva. A «Qui ha pagat?» tria qui ha pagat, i a «Dividir» tria com es reparteix l'import.",
  'help.guide.booking-cost.step.5': 'Fes clic a «Afegir despesa».',
  'help.guide.booking-cost.result':
    'La targeta mostra l’import a la part de baix, el formulari de la reserva inclou la despesa a «Despeses vinculades» i la mateixa despesa apareix a la pestanya «Pressupost», vinculada a aquesta reserva.',
  'help.guide.booking-cost.tip.1':
    'La categoria depèn del tipus: Restaurant passa a «Menjar i beguda», «Allotjament» passa a «Allotjament», «Aparcament» passa a «Aparcament», i «Esdeveniment» i «Excursió» passen tots dos a «Altres».',
  'help.guide.booking-cost.tip.2':
    "Una reserva pot tenir diverses despeses. «Vincular despesa existent» ofereix les despeses de «Pressupost» que encara no estan vinculades a res. En una despesa vinculada, «Desvincular, conservar la despesa» treu el vincle i manté la despesa a «Pressupost», mentre que la paperera l'elimina.",
  'help.guide.booking-cost.tip.3':
    '«Pressupost» només apareix al formulari si el complement «Pressupost» està activat. L’administrador l’activa a «Complements».',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Trobar una reserva',
  'help.guide.filter-bookings.goal': 'Filtra una pestanya llarga per paraula, estat, tipus o persona.',
  'help.guide.filter-bookings.step.1':
    'Escriu a «Cercar», a la barra. Busca en els títols, els tipus, els llocs i les adreces, les notes, els codis de reserva i els noms dels viatgers, i la pestanya mostra menys resultats a mesura que escrius. Escape buida el quadre.',
  'help.guide.filter-bookings.step.2':
    'Fes clic a «Filtra», l’embut que hi ha al costat de la cerca. El panell inclou «Estat», «Tipus» i, quan alguna reserva té persones assignades, «Viatgers».',
  'help.guide.filter-bookings.step.3':
    'A «Estat», tria «Confirmat» o «Pendent» per veure només aquestes reserves; «Tots» les mostra totes.',
  'help.guide.filter-bookings.step.4':
    'A «Tipus», fes clic a un o més tipus per quedar-te només amb aquests. Cada tipus mostra quantes reserves té, i una marca indica els seleccionats.',
  'help.guide.filter-bookings.step.5':
    'Un número a «Filtra» indica quants filtres hi ha activats, i una etiqueta al costat de la cerca mostra quantes reserves queden del total. Fes clic a l’etiqueta, o a «Restablir els filtres» a la part de baix del panell, per tornar a veure-ho tot.',
  'help.guide.filter-bookings.result':
    'La pestanya mostra només el que has triat, tant a «Targetes» com a «Llista» i «Cronologia», i els filtres es mantenen per a aquest viatge fins que tanques la pestanya del navegador.',
  'help.guide.filter-bookings.tip.1':
    "«Tipus» només apareix quan la pestanya té més d'un tipus, i només hi surten els tipus que hi ha a la pestanya. Així, si la pestanya no té cap excursió, a «Tipus» no hi haurà l'opció «Excursió».",
  'help.guide.filter-bookings.tip.2':
    'Si res no coincideix amb el filtre, la pestanya mostra «Res no coincideix amb aquests filtres» i, just a sota, «Restablir els filtres».',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Importar una reserva des de la confirmació',
  'help.guide.import-booking-file.goal':
    "Fes que TREK llegeixi la reserva del correu o del PDF que t'ha enviat el proveïdor, perquè no l'hagis de tornar a escriure.",
  'help.guide.import-booking-file.step.1':
    "Fes clic a la icona de baixada de la barra, «Importa confirmacions de reserva»; el nom apareix quan hi passes el ratolí. S'obre el diàleg amb el mateix nom.",
  'help.guide.import-booking-file.step.2':
    "Deixa anar les confirmacions al requadre, o fes-hi clic i tria-les: EML, PDF, PKPass, HTML i TXT, fins a cinc fitxers de 10 MB cadascun, i fotos (JPG, PNG, WEBP) si el model d'IA pot llegir imatges. El requadre mostra els noms dels fitxers triats.",
  'help.guide.import-booking-file.step.3':
    'Fes clic a «Importa». El diàleg es tanca de seguida, perquè la lectura es fa en segon pla.',
  'help.guide.import-booking-file.step.4':
    "Una targeta a baix a la dreta mostra el progrés sota el nom del fitxer. Continua visible mentre navegues per l'aplicació i després de tornar a carregar la pàgina. «Analitzant els fitxers…» es converteix en una marca de verificació quan acaba la lectura, i la targeta ofereix «Importa». Fes-hi clic.",
  'help.guide.import-booking-file.step.5':
    "Cada reserva trobada s'obre a «Reserva nova», una darrere l'altra, ja emplenada. En el cas d'un hotel, hi trobaràs el nom com a títol i, si el lloc és al viatge, a «Allotjament», la seva «Ubicació / adreça», «De» i «Fins a» a les nits corresponents, «Registre d'entrada» i «Registre de sortida», el «Codi de reserva», la confirmació a «Fitxers» i, si «Pressupost» està activat, el preu com a «Despesa vinculada». Revisa-ho i fes clic a «Afegir».",
  'help.guide.import-booking-file.result':
    'La reserva apareix com una targeta a «Pendent» amb les nits, el codi i la confirmació a «Fitxers». L’estada apareix en aquests dies del pla. Si «Pressupost» està activat, el preu s’afegeix com una despesa vinculada a la reserva.',
  'help.guide.import-booking-file.tip.1':
    'La icona d’importació només apareix si el servidor pot llegir confirmacions. Per a això cal l’extractor o el complement «Anàlisi amb IA». L’administrador activa el complement «Anàlisi amb IA» a «Complements». Una pestanya sense reserves també el mostra com el botó «Importa des d’un fitxer».',
  'help.guide.import-booking-file.tip.2':
    "Si no s'ha pogut llegir res, la targeta t'ho indica. Amb «Anàlisi amb IA» activat, ofereix «Provar l'anàlisi per IA», que envia els mateixos fitxers directament al model. Una anàlisi acabada es conserva deu minuts; comença la revisió dins d'aquest temps.",
  'help.guide.import-booking-file.tip.3':
    "La confirmació només s'adjunta si el seu tipus és a «Tipus de fitxer permesos» de la configuració d'administració. El PDF està permès per defecte; un correu, EML, s'hi ha d'afegir primer, o la reserva es desarà sense la confirmació.",
  // edit-booking
  'help.guide.edit-booking.title': 'Modificar una reserva',
  'help.guide.edit-booking.goal':
    "Corregeix una hora, afegeix el codi que t'ha arribat més tard o passa una reserva de «Pendent» a «Confirmat».",
  'help.guide.edit-booking.step.1':
    "Passa el punter per sobre de la targeta i fes clic al llapis de la capçalera. S'obre «Edita la reserva» amb tots els detalls de la reserva.",
  'help.guide.edit-booking.step.2':
    'Canvia el que calgui, per exemple el «Codi de reserva» que t’ha enviat més tard l’operador.',
  'help.guide.edit-booking.step.3':
    'Fes clic a l’etiqueta «Pendent» de la franja superior. Passa a «Confirmat» i la franja es torna verda.',
  'help.guide.edit-booking.step.4': 'Fes clic a «Actualitza».',
  'help.guide.edit-booking.result':
    'La targeta es mou: una reserva confirmada apareix a la secció «Confirmat» amb un punt verd i una franja superior verda, i tots els membres del viatge veuen com es mou.',
  'help.guide.edit-booking.tip.1':
    'Si no pots llegir un «Codi de reserva», és que tens activada l’opció «Difumina els codis de reserva» a «Configuració», a «Pantalla». Passa el ratolí per sobre del codi, o fes-hi clic, per llegir-lo.',
  'help.guide.edit-booking.tip.2':
    "Si canvies el tipus, la categoria de la despesa vinculada també canvia, tret que hagis triat una categoria a mà a l'editor de despeses.",
  'help.guide.edit-booking.tip.3':
    "El botó «Edita» de la part inferior de la vista de detall obre el mateix formulari. També pots canviar l'estat sense cap formulari: fes clic al punt d'una targeta o d'una fila, o a la píndola d'estat de la vista de detall.",
  // delete-booking
  'help.guide.delete-booking.title': 'Eliminar una reserva',
  'help.guide.delete-booking.goal': 'Treu del viatge una reserva cancel·lada.',
  'help.guide.delete-booking.step.1':
    "Passa el ratolí per la targeta i fes clic a la paperera de la capçalera. La paperera de baix del detall d'una reserva fa el mateix.",
  'help.guide.delete-booking.step.2':
    "«Vols eliminar la reserva?» mostra el nom de la reserva que has triat i avisa que s'eliminarà definitivament. Si té costos vinculats, avisa que també s'eliminaran.",
  'help.guide.delete-booking.step.3': 'Fes clic a «Elimina».',
  'help.guide.delete-booking.result':
    'La targeta s’elimina per a tots els membres del viatge. Eliminar una reserva no es pot desfer, així que la pregunta de confirmació és l’última oportunitat per cancel·lar.',
  'help.guide.delete-booking.tip.1':
    "Si elimines una reserva, també s'eliminen les despeses que hi estan vinculades. Si elimines un allotjament, també se'n treuen les nits del pla dels dies.",
  'help.guide.delete-booking.tip.2':
    "Els documents adjunts es queden a la pestanya «Fitxers» del viatge; només se'n treu la vinculació amb la reserva.",

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Pressupost',
  'help.ctx.trip-costs.summary':
    "Els diners del viatge: cada despesa en un llibre de comptes per dates o en una taula, qui l'ha introduïda i qui l'ha de pagar, en la divisa del rebut. La columna de la dreta mostra qui ha de pagar a qui per quadrar els comptes.",
  'help.ctx.trip-costs.bullet.1':
    "La barra de dalt mostra les dates del viatge i els viatgers entre els quals es reparteixen les despeses. També conté «Cercar despeses…», «Filtra» (l'embut), «Exporta CSV» (la icona de baixada) i el selector «Llista» / «Taula».",
  'help.ctx.trip-costs.bullet.2':
    'A l’extrem dret, «Liquidar comptes» registra de cop totes les transferències pendents, «Escanejar rebut» omple una despesa a partir d’una foto quan el complement «Anàlisi amb IA» pot llegir imatges, i «Afegir despesa» obre l’editor.',
  'help.ctx.trip-costs.bullet.3':
    "Quatre targetes sota la barra: «Deus» i «Et deuen» són la teva part de la liquidació, «Import pendent» és el que s'ha registrat però encara no té pagador, i «Despesa total del viatge» ho suma tot, amb «La teva part» i «Vas pagar tu» a sota.",
  'help.ctx.trip-costs.bullet.4':
    "El llibre de comptes s'agrupa per dia, del més recent al més antic, i cada dia indica quantes entrades té i quant s'hi ha gastat. Cada fila mostra la categoria com una pestanya de color, el nom, les fitxes dels pagadors amb el que ha pagat cadascú i, a sota, «Dividir» amb la part de cada viatger (una marca indica qui ja ha pagat la seva), després la nota i l'import, i també «has prestat» o «t'han prestat» quan la divisió fa que altres et deguin diners o que tu en deguis.",
  'help.ctx.trip-costs.bullet.5':
    "La columna de la dreta mostra els resultats: «Liquidar comptes» indica qui paga a qui, «Balanços» mostra el saldo a favor o en contra de cada viatger, «Pressupost final» mostra quant costa el viatge a cadascú i «Per categoria» mostra en què s'han gastat els diners.",
  'help.ctx.trip-costs.bullet.6':
    "Un pagament registrat apareix al mateix llibre de comptes com a fila pròpia, amb un llapis i «Desfer» al costat. Una despesa té un llapis i una paperera, i la paperera demana confirmació abans d'eliminar la despesa. Una despesa amb rebuts té una fitxa «Rebut» al costat del nom que els obre.",
  'help.ctx.trip-costs.bullet.7':
    '«Taula», a la barra, mostra les mateixes despeses en format de full de càlcul, agrupades per categoria, amb «Persones» i «Dies» i l’import per persona i per dia. Aleshores «Resum» substitueix «Per categoria». «Pressupost» recorda la vista que has triat.',
  // add-expense
  'help.guide.add-expense.title': 'Afegir una despesa',
  'help.guide.add-expense.goal': "Registra quant ha costat una cosa, qui l'ha pagada i amb qui es comparteix.",
  'help.guide.add-expense.step.1':
    "Fes clic a «Afegir despesa», a l'extrem dret de la barra. S'obre l'editor amb la data d'avui, pagada per tu i amb tothom ja inclòs a la divisió.",
  'help.guide.add-expense.step.2':
    'Escriu en què ha consistit la despesa al camp de dalt del diàleg. Mentre és buit, mostra «p. ex. Sopar, records, benzina…». És el nom de la despesa i, sense nom, no la pots desar.',
  'help.guide.add-expense.step.3':
    "L'etiqueta de sota el nom és la «Categoria», que és «Menjar i beguda» fins que en triïs una altra. N'hi ha catorze i no es poden modificar. La capçalera pren el color de la categoria que triïs, i també la pestanya de la fila i la seva barra a «Per categoria».",
  'help.guide.add-expense.step.4':
    "Escriu l'import del rebut a «Import total». La «Divisa» del costat és, d'entrada, la mateixa en què es mostra «Pressupost»; si la canvies, l'editor mostra l'import convertit. «Dia» és, d'entrada, avui, i la despesa s'agrupa sota aquest dia a la llista.",
  'help.guide.add-expense.step.5':
    'A «Qui ha pagat?», fes clic a la persona que ha pagat de veritat. «Tu» ja surt seleccionat. «Ningú ha pagat encara» registra l’import sense que ningú degui res, i «Han pagat diverses persones», al selector del costat del títol, reparteix el compte entre diverses persones.',
  'help.guide.add-expense.step.6':
    '«Dividir», a sota, comença amb «A parts iguals», amb tothom marcat i la part de cadascú al costat del nom. Deixa-ho així o canvia-ho. Fes clic a «Afegir despesa», a la part de baix del diàleg, per desar.',
  'help.guide.add-expense.result':
    'La despesa és al llibre de comptes, al seu dia, compta a «Despesa total del viatge», i la columna de liquidació ha tornat a calcular qui deu a qui.',
  'help.guide.add-expense.tip.1':
    "Si no canvies els valors per defecte, la despesa té la data d'avui, està pagada per tu i es divideix a parts iguals entre tothom: només cal omplir el nom i l'import.",
  'help.guide.add-expense.tip.2':
    'El ± del costat de l’import converteix la despesa en un reemborsament. Un total negatiu vol dir que es retornen diners, i el repartiment s’inverteix.',
  'help.guide.add-expense.tip.3':
    '«Adjuntar», al costat de «Rebuts i factures», a baix del diàleg, admet imatges i PDF. Es pugen quan deses i es guarden als «Fitxers» del viatge, i a la llista apareix una fitxa «Rebut» al costat del nom.',
  // expense-payers
  'help.guide.expense-payers.title': 'Indicar qui ha pagat',
  'help.guide.expense-payers.goal':
    "Indica qui ha pagat una despesa: és l'altra meitat del càlcul per liquidar comptes.",
  'help.guide.expense-payers.step.1':
    'Obre una despesa amb el llapis del costat de la fila i mira «Qui ha pagat?». Al selector del costat del títol, l’opció predeterminada és «Ha pagat una sola persona»: cada viatger és una fitxa, i la fitxa amb contorn és la persona que ha pagat. Fes clic en una altra fitxa per canviar-la.',
  'help.guide.expense-payers.step.2':
    '«Ningú ha pagat encara», l’etiqueta amb vora discontínua que hi ha després dels viatgers, registra l’import sense que ningú hagi de deure res. La despesa continua comptant a «Despesa total del viatge».',
  'help.guide.expense-payers.step.3':
    "«Han pagat diverses persones», l'altra opció d'aquest selector, mostra tots els viatgers amb una casella per marcar, i cada persona marcada té un camp d'import. Marca qui ha pagat i escriu quant ha pagat cadascú; els imports han de sumar el total.",
  'help.guide.expense-payers.step.4':
    'Una despesa que no ha pagat ningú es marca com a «Sense finalitzar» a la seva fila i es compta a la targeta «Import pendent», que suma les despeses que encara no tenen pagador.',
  'help.guide.expense-payers.result':
    'Qui ha pagat determina a qui s’ha de retornar, el repartiment determina qui paga, i «Balanços» és la diferència entre tots dos.',
  'help.guide.expense-payers.tip.1':
    "«Qui ha pagat?» i «Dividir» són independents: pots pagar un sopar al qual no vas anar i participar en el repartiment d'un que no vas pagar.",
  'help.guide.expense-payers.tip.2':
    "Si hi ha diversos pagadors, els imports han de sumar el total. Quan marques un pagador més, la resta es torna a repartir entre els imports que no has escrit tu. Mentre els imports no quadrin, l'editor mostra el total que han de sumar i no deixa desar.",
  'help.guide.expense-payers.tip.3':
    'Si tornes una despesa a «Ningú ha pagat encara», no s’elimina: l’import es manté a «Despesa total del viatge» i la fila passa a «Sense finalitzar».',
  // split-expense
  'help.guide.split-expense.title': 'Repartir una factura entre els viatgers',
  'help.guide.split-expense.goal':
    'Decideix qui ha de pagar una despesa: tothom a parts iguals, per imports o concepte per concepte del rebut.',
  'help.guide.split-expense.step.1':
    "A l'editor de la despesa, «Dividir» mostra tots els viatgers amb una casella per marcar. Desmarca un nom per excloure aquella persona d'aquesta despesa: el nom es posa gris, perd la seva part i no deu res per aquesta despesa.",
  'help.guide.split-expense.step.2':
    '«A parts iguals», al selector del costat de l’encapçalament, és l’opció predeterminada: cada viatger marcat paga la mateixa part, que es mostra al costat del nom. Les insígnies de sota la llista indiquen entre quantes persones es reparteix i de quant és cada part.',
  'help.guide.split-expense.step.3':
    "«Personalitzat» substitueix les parts per camps d'import. Escriu el que deu cada viatger. La insígnia de sota s'actualitza mentre escrius i es posa verda amb «El repartiment quadra amb el total». No pots desar mentre els imports no quadrin amb el total.",
  'help.guide.split-expense.step.4':
    '«Tiquet» reparteix el rebut línia per línia: «Afegeix un article» i, després, un nom i un preu per a cada línia, i al costat de «Repartit entre:» els viatgers que comparteixen aquella línia.',
  'help.guide.split-expense.step.5':
    '«Part de cadascú», sota les línies, mostra el que deu cada viatger al final, i «Import total», a dalt, és la suma de les línies. Fes clic a «Desa», a la part inferior del diàleg.',
  'help.guide.split-expense.result':
    'Tots els balanços es calculen a partir de la divisió. Es desa amb la despesa, apareix a la seva fila com a «Dividir» amb la part de cada viatger, i es pot canviar més endavant sense modificar res més.',
  'help.guide.split-expense.tip.1':
    'Un viatger que desmarques no deu res d’aquesta despesa concreta; els altres paguen la seva part.',
  'help.guide.split-expense.tip.2':
    '«A parts iguals» reparteix fins al cèntim: el cèntim que sobra va a una persona diferent a cada despesa, perquè no el pagui sempre la mateixa.',
  'help.guide.split-expense.tip.3':
    "El mode «Tiquet» calcula sol l'«Import total» i posa el camp en gris: el total és la suma dels conceptes del rebut.",
  'help.guide.split-expense.tip.4':
    'Un repartiment personalitzat també es pot introduir en percentatges: posa «Introdueix les parts com a» en %, i les parts han de sumar el 100 % perquè es pugui desar la despesa.',
  // expense-currency
  'help.guide.expense-currency.title': 'Introduir una despesa en una altra divisa',
  'help.guide.expense-currency.goal': "Escriu l'import que diu el rebut i TREK desarà el tipus de canvi.",
  'help.guide.expense-currency.step.1':
    'Obre «Afegir despesa». Escriu el nom a dalt del diàleg i introdueix a «Import total» l’import exacte del tiquet, no un import convertit.',
  'help.guide.expense-currency.step.2':
    'Obre «Divisa», al costat de l’import, i tria la divisa del tiquet. La llista inclou tots els codis que coneix TREK i s’hi pot cercar: escriu les tres lletres.',
  'help.guide.expense-currency.step.3':
    "Sota els camps apareix una fila d'insígnies: l'import que has escrit i el seu valor actual, marcat com a «tipus de canvi actual». Només és una vista prèvia. No és el valor que es desa.",
  'help.guide.expense-currency.step.4':
    'Fes clic a «Afegir despesa», a baix del diàleg. El tipus de canvi queda fixat en aquell moment: la despesa conserva el valor que tenia el dia que la vas introduir.',
  'help.guide.expense-currency.step.5':
    'Al registre, la fila mostra els dos imports sota el nom: el que has escrit, una fletxa i l’import en la divisa del viatge. Tots els totals, balanços i liquidacions de la pestanya «Pressupost» fan servir el segon import.',
  'help.guide.expense-currency.result':
    "La despesa conserva l'import i la divisa que has escrit. El registre mostra totes dues coses, i els totals i els saldos del viatge es calculen en la divisa del viatge.",
  'help.guide.expense-currency.tip.1':
    'El tipus de canvi queda fixat en el moment de desar, perquè un deute liquidat no canviï si el tipus de canvi varia la setmana següent. Només es desa un tipus nou si canvies la divisa de la despesa.',
  'help.guide.expense-currency.tip.2':
    '«Divisa de visualització», a «Configuració», només canvia com es mostren els imports. Els imports desats no canvien mai. Si la deixes buida, cada viatge es mostra en la seva moneda.',
  'help.guide.expense-currency.tip.3':
    'La divisa del viatge es defineix al mateix viatge, a «Edita el viatge», i cal el permís «Edita els detalls del viatge». Si la canvies, tots els tipus de canvi fixats es recalculen per a la nova divisa. Els imports, en canvi, no es converteixen.',
  // filter-costs
  'help.guide.filter-costs.title': "Trobar una despesa, o el que s'ha gastat un dia",
  'help.guide.filter-costs.goal': 'Filtra una llista llarga de despeses per veure només el que busques.',
  'help.guide.filter-costs.step.1':
    'Escriu a «Cercar despeses…», a la barra. Busca en el nom de les despeses mentre escrius, i Esc l’esborra.',
  'help.guide.filter-costs.step.2':
    "«Filtra», l'embut al costat de la cerca, obre els filtres. El selector de dalt és la teva vista del registre: «Tots», «Pagat per mi» per al que has pagat tu, i «Em deuen» per a les despeses en què has pagat més que la teva part.",
  'help.guide.filter-costs.step.3':
    "A «Categoria», tria una de les catorze categories i només es mostraran les despeses d'aquella categoria. L'embut indica quants filtres tens activats.",
  'help.guide.filter-costs.step.4':
    'A «Dia», tria un dels dies amb despeses. Un bàner substitueix les capçaleres dels dies i mostra aquell dia sencer, quantes despeses té i el total.',
  'help.guide.filter-costs.step.5':
    '«Exporta CSV», la icona de baixada que hi ha al costat de l’embut, desa totes les despeses en un fitxer, amb l’import original, la divisa i l’import convertit.',
  'help.guide.filter-costs.result':
    "Pots combinar els filtres, i els grups de cada dia s'actualitzen amb els seus propis totals per a les despeses que queden.",
  'help.guide.filter-costs.tip.1':
    'Els pagaments registrats no tenen nom ni categoria, així que una cerca o un filtre de categoria els amaga, igual que «Em deuen». El filtre de dia els manté, al dia en què es va fer el pagament.',
  'help.guide.filter-costs.tip.2':
    '«Exporta CSV» sempre exporta totes les despeses, independentment del que hi hagi filtrat a la pantalla, amb una fila per despesa.',
  'help.guide.filter-costs.tip.3':
    '«Restablir els filtres», a la part de baix del menú de filtres quan n’hi ha algun d’activat, els desactiva tots alhora.',
  // settle-up
  'help.guide.settle-up.title': 'Veure qui deu a qui i liquidar els deutes',
  'help.guide.settle-up.goal':
    'Converteix moltes despeses compartides en el mínim de transferències que salden tots els deutes, i registra les transferències quan es facin.',
  'help.guide.settle-up.step.1':
    'La targeta «Liquidar comptes», a la columna de la dreta, mostra les transferències que saldarien tots els deutes: qui paga a qui, amb dos avatars que mostren el nom en passar-hi el ratolí, i quant. El número de la capçalera indica quantes en queden pendents.',
  'help.guide.settle-up.step.2':
    '«Liquidar», al costat d’una transferència, la marca com a feta. La transferència desapareix de la targeta i els balanços s’actualitzen.',
  'help.guide.settle-up.step.3':
    "La transferència registrada és una fila del llibre de comptes, al dia en què es va fer, marcada com a «Pagament» amb els dos viatgers i l'import.",
  'help.guide.settle-up.step.4':
    "Al costat d'aquesta fila, el llapis corregeix un pagament i «Desfer» l'anul·la, i la transferència torna a la targeta «Liquidar comptes».",
  'help.guide.settle-up.step.5':
    "«Afegir pagament», a la capçalera de la targeta, registra una transferència que no segueix cap suggeriment. Tria «De» i «A», l'import, la divisa i el dia en què es va fer, afegeix-hi una «Nota» si vols, per exemple com es va pagar, i fes clic a «Afegir pagament», a baix del diàleg.",
  'help.guide.settle-up.step.6':
    '«Liquidar comptes», a la barra de dalt, registra de cop totes les transferències pendents, sense preguntar. Va bé, per exemple, quan el grup salda tots els deutes al final del viatge.',
  'help.guide.settle-up.result':
    'Cada transferència registrada és una fila del registre i treu una línia de la targeta «Liquidar comptes». Quan la targeta mostra «Tothom està al dia», el viatge està totalment pagat.',
  'help.guide.settle-up.tip.1':
    'La targeta mostra el mínim de transferències, no tots els deutes: si tres persones es deuen diners en cercle, es redueix a un o dos pagaments.',
  'help.guide.settle-up.tip.2':
    '«Liquidar» només registra una transferència. No envia diners. Paga amb el mitjà de pagament de sempre i després fes clic a «Liquidar».',
  'help.guide.settle-up.tip.3':
    'Un pagament es pot fer en qualsevol divisa, així que és normal pagar en euros un deute en iens: el diàleg té el seu propi selector de divisa i també fixa aquest tipus de canvi.',
  // final-budget
  'help.guide.final-budget.title': 'Veure quant ha costat el viatge a cada viatger',
  'help.guide.final-budget.goal': 'Consulta les xifres de cada persona: el balanç actual i el cost real per persona.',
  'help.guide.final-budget.step.1':
    '«Balanços» mostra la situació de cada viatger: una barra verda cap a la dreta si el viatge li deu diners, una barra vermella cap a l’esquerra si és ell qui en deu, i l’import al costat del nom.',
  'help.guide.final-budget.step.2':
    "«Pressupost final», a sota, respon una altra pregunta: no qui deu què ara mateix, sinó quant li costa el viatge a cada viatger un cop s'ha retornat tot.",
  'help.guide.final-budget.step.3':
    'Fes clic a un nom per veure el càlcul: «Despeses pagades» i, a sota, «Reemborsaments nets» i «Reemborsaments pendents».',
  'help.guide.final-budget.step.4':
    'Sota les tres línies, hi ha una llista amb el nom de cada viatger i les files que formen aquella línia: les despeses que ha pagat aquell viatger, les transferències ja registrades i les que encara queden pendents. Cada llista suma exactament el mateix que la línia amb el mateix nom.',
  'help.guide.final-budget.result':
    '«Balanços» mostra a qui se li deuen diners i qui en deu avui. «Pressupost final» mostra quant costa el viatge a cadascú quan ja s’ha retornat tot.',
  'help.guide.final-budget.tip.1':
    'Registrar un pagament no canvia el pressupost final de ningú. Només mou un import dels reemborsaments pendents als reemborsaments nets.',
  'help.guide.final-budget.tip.2':
    'Una despesa sense pagador queda fora de les dues targetes, igual que queda fora dels suggeriments de liquidació.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Convertir una reserva en una despesa',
  'help.guide.expense-from-booking.goal':
    'Associa el que ha costat de veritat un vol, un hotel o un lloc al registre corresponent.',
  'help.guide.expense-from-booking.step.1':
    'Busca la reserva a la pestanya «Transports» o «Reserves» i fes clic al llapis de la part de dalt de la seva targeta.',
  'help.guide.expense-from-booking.step.2':
    'Baixa fins a «Pressupost», cap al final del formulari. Hi trobaràs «Crear despesa», que primer desa la reserva, i «Vincular despesa existent», per a una despesa que ja és a «Pressupost».',
  'help.guide.expense-from-booking.step.3':
    "Fes clic a «Crear despesa». La reserva es desa, el formulari es tanca i s'obre l'editor de «Pressupost» amb el títol de la reserva com a nom, el tipus assignat a una categoria i el dia de la reserva com a dia de la despesa.",
  'help.guide.expense-from-booking.step.4':
    'Omple l’import i la moneda, qui ha pagat i el repartiment com en qualsevol despesa, i fes clic a «Afegir despesa». Quan tornis a obrir la reserva, la despesa apareix a «Despeses vinculades», amb un llapis per editar-la, «Desvincular, conservar la despesa» per treure el vincle i mantenir la despesa, i una paperera per eliminar-la.',
  'help.guide.expense-from-booking.result':
    'La reserva mostra el seu cost, i la despesa és una fila normal de la pestanya «Pressupost», amb un pagador, un repartiment i una divisa com qualsevol altra.',
  'help.guide.expense-from-booking.tip.1':
    "Eliminar la reserva també elimina les despeses vinculades, i la pregunta de confirmació t'ho indica. «Eliminar despesa», al bloc «Pressupost» de la reserva, fa el contrari: elimina la despesa i conserva la reserva. «Desvincular, conservar la despesa» les conserva totes dues.",
  'help.guide.expense-from-booking.tip.2':
    'Els llocs tenen el mateix bloc al seu formulari; allà, «Crear despesa» primer desa el lloc.',
  // costs-table
  'help.guide.costs-table.title': 'Planificar el pressupost en una taula',
  'help.guide.costs-table.goal':
    'Consulta i modifica les despeses en forma de taula, ordenades per categoria i calculades per persona i per dia.',
  'help.guide.costs-table.step.1':
    "Fes clic a «Taula», la segona icona del selector «Llista / Taula» de la barra. Una taula amb les mateixes despeses substitueix el registre, i la cerca i els filtres també s'hi apliquen.",
  'help.guide.costs-table.step.2':
    "La taula s'agrupa per categoria. La capçalera de cada grup mostra el nom, quantes despeses té i el subtotal; fes-hi clic per plegar el grup. Les columnes són «Nom», «Data», «Total», «Persones» i «Dies», i després «Per persona», «Per dia» i «Per pers. / dia», calculades a partir de les anteriors sobre fons gris. Una fila «Total», a baix, ho suma tot.",
  'help.guide.costs-table.step.3':
    "Fes clic a una cel·la per canviar-la directament: un nom, un total, «Persones» o «Dies». Escriu i prem Retorn o fes clic en un altre lloc per desar-ho, o prem Esc per cancel·lar; la data obre el calendari. «Per persona» i les altres columnes calculades s'actualitzen a l'instant.",
  'help.guide.costs-table.step.4':
    'Un total amb cadenat no es pot modificar aquí: algú l’ha pagat o es va introduir en una altra moneda, i el text emergent t’indica quin és el cas. Si hi fas clic, s’obre la despesa, perquè els saldos i el tipus de canvi fixat es mantinguin correctes.',
  'help.guide.costs-table.step.5':
    '«Afegir despesa», al final d’una categoria, hi afegeix una fila anomenada «Entrada nova» amb la data de l’entrada més recent de la categoria. El camp del nom ja està obert perquè el puguis canviar. Escriu un total de la mateixa manera.',
  'help.guide.costs-table.step.6':
    "En aquesta vista, la columna de la dreta mostra «Resum» en lloc de «Per categoria». Suma les despeses de quatre maneres: «Categoria», «Dia», «Pagador», amb «Encara sense pagador» per a les no pagades, i «Estat», «Pagat» enfront d'«Obert».",
  'help.guide.costs-table.result':
    "Cada despesa apareix a la seva categoria amb l'import per persona i per dia. Quan canvies un total en una cel·la, les targetes de dalt i el «Resum» s'actualitzen a l'instant.",
  'help.guide.costs-table.tip.1':
    '«Pressupost» recorda la vista en aquest navegador: s’obre en forma de taula fins que tornes a fer clic a «Llista».',
  'help.guide.costs-table.tip.2':
    'Una despesa dividida amb «Personalitzat» o «Tiquet» no té una part única per persona, així que «Per persona» i «Per pers. / dia» queden buits.',
  'help.guide.costs-table.tip.3':
    "Els pagadors, el repartiment, la nota i els rebuts s'editen a la mateixa despesa: «Més opcions», al final de cada fila, té «Edita» i «Elimina» per treure la fila.",

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transports', // same-as-en
  'help.ctx.trip-transports.summary':
    'Totes les maneres com et desplaces entre les parades: vols, trens, autobusos, cotxes, taxis, bicicletes, creuers, ferris, telefèrics i les connexions de transport públic que TREK et busca. La pestanya els mostra en una llista. També els pots crear i consultar al pla, i es dibuixen al mapa.',
  'help.ctx.trip-transports.bullet.1':
    'La pestanya només mostra els trajectes. Els allotjaments, restaurants, esdeveniments i entrades són a la pestanya «Reserves», perquè una mateixa entrada no aparegui mai dues vegades.',
  'help.ctx.trip-transports.bullet.2':
    "La barra de dalt té «Cercar», «Filtra» per l'estat, els tipus i els viatgers, les tres vistes «Targetes», «Llista» i «Cronologia», «Opcions de vista» i «Exporta com a full de càlcul (CSV)», que baixa el que es mostra. «Transport», a la dreta, afegeix un trajecte a mà. Les icones de davant, «Importa confirmacions de reserva» i «Importar des d'AirTrail», apareixen quan el servidor pot llegir confirmacions o hi ha un AirTrail connectat. Si la pestanya és buida, les mateixes accions apareixen al mig com a «Transport», «Importa des d'un fitxer» i AirTrail.",
  'help.ctx.trip-transports.bullet.3':
    "«Targetes» és la vista amb què s'obre la pestanya: primer «Confirmat» i després «Pendent». Pots plegar cada secció fent clic al seu títol. Les connexions de transport públic planificades no tenen estat i es mostren entre els trajectes confirmats per ordre horari, tret que «Opcions de vista» els doni una secció pròpia, «Transport públic automatitzat». «Llista» agrupa per dia, i «Cronologia» mostra tots els trajectes al llarg dels dies del viatge.",
  'help.ctx.trip-transports.bullet.4':
    "La franja superior d'una targeta té el color del seu estat: verd si està confirmada, ambre si està pendent i blau si és una connexió planificada. Mostra el punt d'estat, el tipus, el títol, el llapis i la paperera. A sota: la data, l'hora, el «Codi de reserva», la ruta i la companyia aèria i el número de vol, o el número de tren, l'andana i el seient. Fes clic a la targeta per obrir-ne els detalls.",
  'help.ctx.trip-transports.bullet.5':
    "També pots crear transports al pla: el + de la capçalera d'un dia (el text d'ajuda diu «Afegeix al dia»), o un clic amb el botó dret a la capçalera, ofereix «Afegeix transport» i «Transport públic». El connector de temps de desplaçament entre dues parades obre la mateixa cerca per a aquell tram.",
  'help.ctx.trip-transports.bullet.6':
    'Un transport amb origen i destinació dibuixa una línia al mapa. La icona de ruta de la seva fila al pla del dia i «Al mapa» als seus detalls activen aquesta línia. «Mostra totes les rutes de reserva», a la barra d’eines de sobre els dies, activa o desactiva les línies de tot el viatge.',
  // transports-list
  'help.guide.transports-list.title': 'Llegir la pestanya «Transports»',
  'help.guide.transports-list.goal': 'Entén què mostra la llista abans de canviar-hi res.',
  'help.guide.transports-list.step.1':
    "«Transports» és una pestanya del viatge, després de «Planificat» (i d'«Excursions», si aquest complement està activat). Només conté els trajectes: els hotels, restaurants, esdeveniments i entrades són a la pestanya «Reserves».",
  'help.guide.transports-list.step.2':
    "«Cercar», a l'esquerra de la barra, filtra els trajectes mentre escrius. «Filtra», l'embut del costat, obre les opcions: «Estat», amb «Tots», «Confirmat» i «Pendent», i després cada tipus en ús amb el seu recompte. Marca un o diversos tipus per mostrar només aquests. Un número a l'embut indica quants filtres hi ha actius, i la barra mostra quants trajectes es veuen, per exemple 1 de 4. «Restablir els filtres», al final del menú, torna a mostrar tots els trajectes.",
  'help.guide.transports-list.step.3':
    'Al costat, «Targetes», «Llista» i «Cronologia» mostren els transports com a targetes, com a files agrupades per dia o com a barres al llarg dels dies del viatge. «Opcions de vista», la icona dels controls lliscants, defineix «Agrupar per» i «Ordena per» a «Targetes» i «Llista», i els carrils a «Cronologia». «Restablir la vista» torna als valors predeterminats. A «Targetes», «Transport públic en una secció pròpia» mostra les connexions planificades a «Transport públic automatitzat».',
  'help.guide.transports-list.step.4':
    'Cada targeta mostra tots els detalls. La franja superior és verda si està «Confirmat» i ambre si està «Pendent», i mostra el punt d’estat, el tipus i el títol. A sota, «Data» mostra els dies que abasta amb les dates. Després hi ha «Data i hora», «Codi de reserva», «Ruta» amb la icona del tipus entre les parades, i l’aerolínia i el número de vol, o bé el número de tren, l’andana i el seient. Fes clic a la targeta per obrir-ne els detalls.',
  'help.guide.transports-list.step.5':
    "Fes clic al punt d'estat per canviar el trajecte entre «Pendent» i «Confirmat»; el text d'ajuda indica cap a quin estat, per exemple «Set to Pending». El llapis de la capçalera obre el formulari del transport, i la paperera l'elimina després de la pregunta «Vols eliminar la reserva?», que detalla què s'eliminarà, inclosos els costos vinculats.",
  'help.guide.transports-list.result':
    'Cada targeta mostra si el trajecte està reservat, i pots fer servir la barra per filtrar o ordenar la llista en qualsevol moment.',
  'help.guide.transports-list.tip.1':
    "La pestanya recorda la teva configuració: la vista, l'agrupació i l'ordre en aquest navegador, les seccions plegades de cada viatge i els filtres fins que tanques la pestanya del navegador.",
  'help.guide.transports-list.tip.2':
    "«Importa confirmacions de reserva» i «Importar des d'AirTrail», les dues icones abans de «Transport manual», només apareixen quan el servidor pot llegir confirmacions i quan hi ha una instància d’AirTrail connectada. Sense aquestes opcions, omples la llista a mà o amb la cerca de transport públic.",
  // add-transport
  'help.guide.add-transport.title': 'Afegir un transport a un dia',
  'help.guide.add-transport.goal': "Afegeix el transport que et porta d'una parada a la següent al dia en què el fas.",
  'help.guide.add-transport.step.1':
    "A la capçalera del dia del trajecte, fes clic al + (el text d'ajuda diu «Afegeix al dia») i tria «Afegeix transport». Amb el botó dret a la capçalera del dia tens el mateix menú. El formulari s'obre amb aquell dia ja omplert.",
  'help.guide.add-transport.step.2':
    "La pastilla de tipus de la capçalera mostra el tipus de transport, per defecte «Vol». Fes-hi clic per triar «Vol», «Tren», «Autobús», «Cotxe», Taxi, «Bicicleta», «Creuer», «Ferri», «Telefèric» o «Altres», i el formulari s'hi adapta: un vol té un aeroport a cada parada; un tren, una cadena d'estacions; un creuer, «Embarcament», «Port d'escala» i «Desembarcament», i un cotxe, «Recollida», «Devolució» i «Parades pel camí».",
  'help.guide.add-transport.step.3':
    'Escriu el títol directament a la franja superior, on hi ha el text d’exemple en gris. És l’únic camp obligatori: fins que no l’omples, la línia de sota diu «Títol *» i «Afegir» queda en gris. Posa-hi un títol que reconeixeries en un panell de sortides.',
  'help.guide.add-transport.step.4':
    'A «Ruta», «Des de» i «Fins a» admeten una estació, un port o una adreça. Abans que escriguis, se t’ofereixen els llocs del viatge. Escriu almenys tres lletres per cercar i tria un resultat. Si només escrius un nom i no el tries dels resultats, no es desa i no es mostra res al mapa.',
  'help.guide.add-transport.step.5':
    "«Data» i «Hora d'inici» indiquen quan comença, i «Data de fi» i «Hora de fi», quan acaba; per a un trajecte que arriba l'endemà, posa-hi el dia següent. «Codi de reserva» i «Notes», més avall, són opcionals. Fes clic a la pastilla «Pendent» de la capçalera per canviar-la a «Confirmat».",
  'help.guide.add-transport.step.6': 'Fes clic a «Afegir».',
  'help.guide.add-transport.result':
    'El transport apareix com una fila al dia, a la seva hora entre les parades, i com una targeta a la pestanya «Transports», a «Pendent» o «Confirmat».',
  'help.guide.add-transport.tip.1':
    "La fila se situa segons la seva hora d'inici, després de l'última parada que comença abans. Arrossega-la per la nansa a una altra posició del dia o a un altre dia.",
  'help.guide.add-transport.tip.2':
    "Amb «Adjunta un fitxer», a «Fitxers», hi afegeixes el bitllet. «Crear despesa», a «Pressupost», desa la reserva i obre l'editor de «Pressupost» perquè hi posis el preu.",
  'help.guide.add-transport.tip.3':
    '«Viatgers», el primer bloc del formulari, indica qui fa aquest trajecte. Quan el viatge té més d’un membre i un transport té algú assignat, «Filtra», a la pestanya, també ofereix «Viatgers», per veure només els transports d’una persona.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Importar un vol des del bitllet electrònic',
  'help.guide.import-transport-file.goal':
    "Fes que TREK llegeixi un vol, un tren o un ferri del bitllet que t'ha enviat la companyia, i revisa'l abans de desar-lo.",
  'help.guide.import-transport-file.step.1':
    "A la barra de la pestanya «Transports», fes clic a la icona de baixada de davant de «Transport», amb el text d'ajuda «Importa confirmacions de reserva». S'obre el diàleg amb aquest nom, el mateix que té la pestanya «Reserves». Si la pestanya és buida, «Importa des d'un fitxer», al mig, fa el mateix.",
  'help.guide.import-transport-file.step.2':
    "Deixa anar el bitllet al requadre, o fes-hi clic i tria el fitxer: EML, PDF, PKPass, HTML i TXT, fins a cinc fitxers de 10 MB cadascun, i fotos d'un bitllet (JPG, PNG, WEBP) si el teu servidor té un model d'IA que les pugui llegir. El requadre mostra els noms dels fitxers que has triat.",
  'help.guide.import-transport-file.step.3':
    'Fes clic a «Importa». El diàleg es tanca de seguida, i el fitxer es llegeix en segon pla.',
  'help.guide.import-transport-file.step.4':
    'Una targeta a baix a la dreta mostra el progrés sota el nom del fitxer. Quan acaba la lectura, «Analitzant els fitxers…» es converteix en una marca de verificació i la targeta ofereix «Importa». Fes-hi clic.',
  'help.guide.import-transport-file.step.5':
    "Un vol s'obre a «Afegeix transport» ja omplert: l'etiqueta del tipus a «Vol», l'aerolínia i el número de vol com a títol a la capçalera, els dos aeroports a «Ruta» amb «Sortida» i «Arribada», les seves hores i zones horàries, «Aerolínia» i «Núm. de vol», el «Codi de reserva» i el bitllet a «Fitxers». Revisa-ho i fes clic a «Afegir».",
  'help.guide.import-transport-file.result':
    'El vol apareix com una targeta a «Pendent» a la pestanya Transports i com una fila al dia de sortida, amb el bitllet a «Fitxers». Si es coneixen tots dos aeroports, el vol es dibuixa com una corba al mapa.',
  'help.guide.import-transport-file.tip.1':
    'Les dues pestanyes fan servir la mateixa importació. Si un fitxer conté un vol i un hotel, s’obre el vol a «Afegeix transport» i després l’hotel a «Reserva nova», sigui quina sigui la pestanya des d’on has començat.',
  'help.guide.import-transport-file.tip.2':
    'Els aeroports se situen pel codi. Si no s’ha pogut localitzar una estació o un port, el nom apareix en ambre a la targeta d’importació, a baix a la dreta. Tria’l a mà a «Ruta» abans de fer clic a «Afegir»; si no, el transport no es mostrarà al mapa.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planificar una connexió de transport públic',
  'help.guide.plan-transit.goal':
    "Fes que TREK busqui els trens i autobusos reals entre dos punts d'un dia i afegeixi al pla el que triïs.",
  'help.guide.plan-transit.step.1':
    'Fes clic al + de la capçalera del dia i tria «Transport públic». La cerca s’obre per a aquell dia: el dia apareix com una pastilla a la capçalera, i «Transport manual» i «Transport automatitzat», al costat, canvien entre aquesta cerca i el formulari normal.',
  'help.guide.plan-transit.step.2':
    "«De» i «A» admeten una parada o una estació. Mentre el camp és buit, TREK et suggereix l'allotjament del dia, les estacions i els aeroports de les reserves del dia i les parades del mateix dia. Quan escrius dues lletres, busca a les estacions de l'horari. «Intercanviar», entre els dos camps, inverteix «De» i «A».",
  'help.guide.plan-transit.step.3':
    "«Sortida» o «Arribada» amb una hora indica quan vols viatjar, i «La millor ruta», «Menys transbords» o «Caminar menys» indica com s'ordenen els resultats.",
  'help.guide.plan-transit.step.4':
    "Les etiquetes de sota mostren quins mitjans es poden fer servir: «Tren», «Metro», «Tramvia», «Autobús», «Ferri» i «Telefèric». Desactiva'n un per excloure'l; n'ha de quedar almenys un d'actiu. Després fes clic a «Cercar».",
  'help.guide.plan-transit.step.5':
    'Cada resultat mostra la sortida i l’arribada, quant dura, quants transbords i quant camí a peu hi ha, i les línies com a etiquetes, amb els seus colors si l’horari els inclou. Fes clic en un resultat per desplegar-lo i veure cada tram, amb les parades on puges i on fas transbord, les andanes i els trams a peu entre línies.',
  'help.guide.plan-transit.step.6': 'Fes clic a «Afegeix al dia».',
  'help.guide.plan-transit.result':
    'La connexió és una fila al dia amb les insígnies de les línies. Fes clic a la seva fletxa per veure cada tram. També és una targeta de color blau a la pestanya «Transports», entre els trajectes confirmats.',
  'help.guide.plan-transit.tip.1':
    "Les connexions provenen de Transitous, un servei comunitari gratuït que fa servir dades públiques d'horaris: sense clau ni compte. Un administrador pot configurar la cerca perquè faci servir Google en lloc seu.",
  'help.guide.plan-transit.tip.2':
    'No trobes res? Les dades cobreixen una regió i un període concrets. Prova una altra hora, activa més modes de transport o tria una estació en lloc del lloc mateix. El missatge indica quin servei ha respost. Un viatge sense dates no té cap dia on buscar, així que només ofereix el formulari normal.',
  'help.guide.plan-transit.tip.3':
    'La mateixa cerca s’obre per a un sol tram: fes clic al connector de temps de trajecte entre dues parades i tria «Transport públic». «De», «Fins a» i l’hora de sortida ja estan omplerts.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Obrir i canviar una connexió planificada',
  'help.guide.change-transit-route.goal':
    'Consulta la connexió línia per línia, canvia-li el nom o torna a cercar la ruta.',
  'help.guide.change-transit-route.step.1':
    'A la pestanya «Transports», una connexió planificada és una targeta amb la franja superior blava, ordenada per hora entre els transports confirmats. Si tens activat «Transport públic en una secció pròpia» a «Opcions de vista», surt a «Transport públic automatitzat». Fes clic a la targeta. La connexió s’obre com una reserva.',
  'help.guide.change-transit-route.step.2':
    'Les caselles de dalt mostren la sortida i l’arribada amb les parades, la «Durada», els «Transbords» i el trajecte «A peu». A sota, «Itinerari» mostra la connexió línia per línia, amb les hores, les andanes i els trams a peu entre línies.',
  'help.guide.change-transit-route.step.3':
    "«Canviar de ruta», a baix de la reserva, torna a obrir la cerca, ja omplerta amb els dos extrems d'aquesta connexió i el dia.",
  'help.guide.change-transit-route.step.4':
    "Fes clic a «Cercar», obre una altra connexió i fes clic a «Afegeix al dia»; substitueix l'anterior. «Edita», a l'extrem dret de la part de baix de la reserva, obre en canvi el formulari normal de transport, on pots editar el «Codi de reserva», els viatgers, les notes i els fitxers.",
  'help.guide.change-transit-route.result':
    'Ara el trajecte fa servir el nou itinerari, i la seva targeta a la pestanya «Transports» mostra les línies i els horaris nous.',
  'help.guide.change-transit-route.tip.1':
    "Fes clic al títol de la capçalera de la reserva per canviar el nom de la connexió sense modificar la ruta. Les notes s'escriuen al formulari de transport que s'obre amb «Edita».",
  'help.guide.change-transit-route.tip.2':
    'La paperera de la part inferior de la reserva elimina la connexió després de demanar-te confirmació; el dia conserva les seves parades.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Canviar com es fa un tram',
  'help.guide.leg-travel-mode.goal':
    'Fes a peu un tram d’un dia en cotxe, o planifica aquest tram amb la cerca de transport públic.',
  'help.guide.leg-travel-mode.step.1':
    'Els connectors entre les parades només apareixen quan la ruta del dia està activada. Fes clic a la capçalera del dia per obrir-lo i després a «Ruta», a la barra de sota les parades.',
  'help.guide.leg-travel-mode.step.2':
    "Cada connector mostra el temps de desplaçament i la distància del tram, amb la icona del mode amb què s'ha calculat: un cotxe per anar en cotxe, un peu per anar a peu i una bicicleta per anar en bici.",
  'help.guide.leg-travel-mode.step.3':
    'Fes clic al connector. El menú ofereix «Cotxe», «A peu» i «Bicicleta», «Transport públic» només per a aquest tram, i «Usa el valor per defecte del dia».',
  'help.guide.leg-travel-mode.step.4': 'Tria «A peu». Només canvia aquest tram; la resta del dia manté el seu mode.',
  'help.guide.leg-travel-mode.result':
    'El tram mostra la icona del peu i el temps a peu, i els altres trams del dia mantenen el mitjà de transport del dia.',
  'help.guide.leg-travel-mode.tip.1':
    'El mode pertany al tram, no al dia: els botons «Cotxe», «A peu» i «Bicicleta» de tot el dia no sobreescriuen mai un tram que hagis definit a mà. «Usa el valor per defecte del dia» fa que el tram torni a seguir aquests botons.',
  'help.guide.leg-travel-mode.tip.2':
    "«Transport públic», al mateix menú, obre la cerca de connexions per a aquest tram concret, amb els dos extrems i l'hora de sortida ja omplerts.",
  'help.guide.leg-travel-mode.tip.3':
    'Els temps els calcula un servei públic de rutes sobre carreteres i camins reals. Si no pot calcular un tram, el tram es queda amb la línia recta i no mostra cap temps.',
  // edit-transport
  'help.guide.edit-transport.title': 'Modificar o eliminar un transport',
  'help.guide.edit-transport.goal':
    'Corregeix una hora, una andana o un codi de reserva, o treu el transport del viatge.',
  'help.guide.edit-transport.step.1':
    "Al pla del dia, un transport és una fila entre les parades, del color del seu tipus. Fes-hi clic per obrir-ne la reserva: l'estat, el tipus, els dies i el «Codi de reserva» (amb un botó per copiar-lo) com a pastilles a dalt, i a sota les hores de sortida i d'arribada amb els aeroports o les estacions.",
  'help.guide.edit-transport.step.2':
    "«Edita», a baix de la reserva, obre el formulari amb què es va crear, amb «Edita el transport» a sobre del títol de la capçalera. Allà ho pots canviar tot: el títol, les pastilles d'estat i de tipus, la ruta, els dies i els horaris, i el «Codi de reserva».",
  'help.guide.edit-transport.step.3':
    "La ruta d'un vol és una cadena d'aeroports; la d'un tren, una cadena d'estacions, i la d'un creuer, una cadena de ports. «Afegeix una escala» («Afegeix un port» en un creuer) n'afegeix una altra entremig, i cada tram conserva els seus horaris i el seu número de vol o de tren.",
  'help.guide.edit-transport.step.4':
    "Fes clic a «Actualitza». Per eliminar del tot el transport, fes servir la paperera de l'esquerra de la mateixa barra, la de baix de la reserva o la de la seva targeta a la pestanya «Transports», i confirma-ho.",
  'help.guide.edit-transport.result':
    'El canvi es veu a tot arreu on apareix el transport: a la pestanya «Transports», al dia en què es fa i a la seva línia al mapa.',
  'help.guide.edit-transport.tip.1':
    "El mateix formulari s'obre des de dos llocs: amb «Edita» a la reserva que s'obre des d'una fila del pla del dia, i amb el llapis de la targeta a la pestanya «Transports». Una connexió de transport públic planificada també s'obre com a reserva; allà, «Canviar de ruta» torna a obrir la cerca i «Edita» obre aquest formulari.",
  'help.guide.edit-transport.tip.2':
    "Per moure un transport a un altre dia no cal el formulari: arrossega'n la fila d'una targeta de dia a l'altra.",
  // transport-on-map
  'help.guide.transport-on-map.title': 'Mostrar un transport al mapa',
  'help.guide.transport-on-map.goal': 'Mira el recorregut real d’un vol, d’un trajecte en cotxe o d’una connexió.',
  'help.guide.transport-on-map.step.1':
    "Un transport amb els dos extrems definits mostra una petita icona de ruta a la seva fila del pla del dia. Fes-hi clic; el text d'ajuda passa a dir «Amaga les rutes de reserves».",
  'help.guide.transport-on-map.step.2':
    'La ruta es dibuixa al mapa, amb un marcador en forma de pastilla a cada extrem que mostra la icona del transport.',
  'help.guide.transport-on-map.step.3':
    'Fes clic en un marcador d’extrem i la reserva s’obrirà damunt del mapa. La capçalera mostra l’estat, el tipus, els dies i el «Codi de reserva». A sota hi ha els horaris amb els aeroports o les estacions, la companyia aèria i el número de vol. Fes clic a «Tanca» a la capçalera per tancar-la.',
  'help.guide.transport-on-map.step.4':
    "La icona de ruta de la barra d'eines de sobre els dies afecta tot el viatge alhora: «Mostra totes les rutes de reserva», i «Amaga totes les rutes de reserva» per tornar-les a amagar.",
  'help.guide.transport-on-map.step.5':
    "Una connexió de transport públic planificada no té icona de ruta pròpia. Es dibuixa amb l'interruptor «Ruta» del dia, de manera que «Amaga totes les rutes de reserva» no l'amaga mentre la ruta d'aquell dia continuï activada.",
  'help.guide.transport-on-map.result':
    'Les rutes apareixen al mapa amb un marcador a cada extrem i s’hi queden fins que les desactivis.',
  'help.guide.transport-on-map.tip.1':
    'Els vols, els creuers i els ferris es dibuixen com una corba. Els cotxes, els autobusos, els taxis i les bicicletes segueixen les carreteres reals. Els trens i les connexions planificades passen per les estacions on paren.',
  'help.guide.transport-on-map.tip.2':
    "Una reserva confirmada es dibuixa amb línia contínua, i una de pendent, amb línia discontínua. L'opció «Etiquetes de rutes de reserves» mostra el codi de l'aeroport o el nom de l'estació als marcadors dels extrems.",
  'help.guide.transport-on-map.tip.3':
    "«Mostra totes les rutes de reserva» no s'afegeix a les rutes que ja mostres: substitueix el que hagis configurat amb les icones individuals. Un cop el prems, totes les rutes queden visibles o totes amagades.",
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importar vols des d’AirTrail',
  'help.guide.airtrail-import.goal':
    "Importa d'un cop al viatge els vols que ja tens a AirTrail i, a partir d'aleshores, mantén-los actualitzats des d'AirTrail.",
  'help.guide.airtrail-import.step.1':
    "Quan el complement AirTrail està activat i la teva instància està connectada a «Integracions», dins de la configuració, la barra de la pestanya Transports mostra una icona d'avió, «Importar des d'AirTrail», abans de «Transport». Fes-hi clic.",
  'help.guide.airtrail-import.step.2':
    "«Importar des d'AirTrail» mostra els vols del teu compte en dos grups. A «Durant aquest viatge» hi ha els vols amb data dins del viatge, ja marcats. A «Altres vols» hi ha la resta, sense marcar. Els vols que ja són al viatge apareixen en gris i marcats com a «Importat».",
  'help.guide.airtrail-import.step.3':
    'Cada fila és una casella amb l’aerolínia i el número de vol, els dos aeroports i la data. Fes clic a una fila per incloure o excloure el vol. Els vols d’«Altres vols» només s’importen si els marques.',
  'help.guide.airtrail-import.step.4':
    "Els vols amb connexió s'agrupen: cadascun surt de l'aeroport on va aterrar l'anterior, en menys d'un dia. La casella de sota, «Importar com un sol vol amb escala a aquell aeroport», ja està activada. Deixa-la activada per tenir una sola reserva amb escala, o desactiva-la per importar els trams com a vols separats.",
  'help.guide.airtrail-import.step.5':
    "Fes clic al botó de baix a la dreta, que mostra el nombre de vols marcats, per exemple «Importa 2». El missatge posterior indica quants vols s'han importat.",
  'help.guide.airtrail-import.step.6':
    'Els vols apareixen com a targetes a «Confirmat», cadascuna amb una pastilla blava d’AirTrail al costat del títol, i com a files als dies en què es fan. Un vol amb escala és una sola targeta, i la seva ruta passa per l’escala.',
  'help.guide.airtrail-import.result':
    "Els vols d'AirTrail apareixen com a targetes a la pestanya «Transports» i com a files als dies corresponents, cadascun amb l'etiqueta AirTrail que n'indica l'origen.",
  'help.guide.airtrail-import.tip.1':
    "Si un vol ja és al viatge amb el mateix número i la mateixa data, se salta, i un missatge t'indica quants se n'han saltat. La fletxa de desfer de la barra d'eines de sobre els dies desfà tota la importació.",
  'help.guide.airtrail-import.tip.2':
    'AirTrail continua sent la font principal de les dades. TREK en llegeix els canvis quan obres el viatge i, en segon pla, cada pocs minuts. Si elimines un vol a AirTrail, la targeta es manté a TREK i la seva etiqueta passa a «No sincronitzat». Els canvis que facis a TREK només s’envien a AirTrail si tens activat «Sincronitzar els canvis cap a AirTrail» a «Integracions».',
  'help.guide.airtrail-import.tip.3':
    'Una connexió combinada no és un únic vol d’AirTrail que es pugui sincronitzar, així que s’importa una sola vegada: conserva l’etiqueta blava i, si hi passes el ratolí per sobre, t’ho indica. El mateix passa amb un vol sincronitzat si hi afegeixes una escala a mà.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viatge per carretera',
  'help.ctx.trip-roadtrip.summary':
    'El pla com un sol recorregut en cotxe: els mateixos dies i els mateixos llocs, connectats com a parades amb els trajectes entre elles, en un recorregut a la columna esquerra i al mapa. Mostra la distància i el temps de conducció, on cal posar combustible i què hi ha al llarg de la carretera.',
  'help.ctx.trip-roadtrip.bullet.1':
    '«Dies» i «Viatge per carretera», a dalt de la columna esquerra, alternen entre el pla dels dies i el trajecte en cotxe. No es copia ni es canvia res: «Dies» mostra el pla exactament com estava.',
  'help.ctx.trip-roadtrip.bullet.2':
    'La part de dalt del carril mostra els totals del viatge: «Distància», «Temps de conducció» i «Parades». A sota hi ha una targeta per a cada dia amb trajecte: el número i la data del dia en una casella, i després pastilles amb els quilòmetres i el temps de conducció, el nombre de parades, el que travessa i una insígnia «Traça». Un vol, un tren o un ferri reservat apareix a la seqüència com una targeta a part.',
  'help.ctx.trip-roadtrip.bullet.3':
    "Una parada numerada és un lloc que és l'objectiu del dia. Una parada pel camí, com ara per repostar, carregar o descansar, mostra la icona del seu tipus en lloc d'un número i no compta. Fes clic a un número per canviar-ne el tipus, a la insígnia «Parada» per indicar quanta estona t'hi estàs, i arrossega una parada per moure-la dins del dia o a un altre dia.",
  'help.ctx.trip-roadtrip.bullet.4':
    'Entre dues parades, una franja de conducció mostra la distància i el temps del tram. Fes-hi clic per obrir «Rutes per a aquest tram», o fes clic a la ruta al mapa per fer passar el tram per un punt intermedi.',
  'help.ctx.trip-roadtrip.bullet.5':
    "La columna de la dreta es converteix en «Durant el trajecte»: tria què vols buscar i el dia en una mateixa línia, l'amplada del corredor i fes clic a «Cercar». El més d'un resultat, «Afegir», l'afegeix al trajecte en el punt on realment hi passes, i la icona del llit d'un hotel hi afegeix una nit d'estada. «Manual» afegeix un lloc que la cerca no ha trobat, i els tres punts del costat del títol importen una ruta de Google Maps.",
  'help.ctx.trip-roadtrip.bullet.6':
    '«Preferències de conducció», a sota, conté els límits, el cotxe i la seva autonomia, els temps de conducció diaris, què cal evitar, com es dibuixa la línia i si els avisos actuals es mostren al mapa. Pertanyen al viatge, de manera que tothom planifica amb el mateix cotxe.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Veure el viatge com un sol trajecte',
  'help.guide.roadtrip-mode.goal': 'Passa el pla al mode de viatge per carretera i entén què mostra el carril.',
  'help.guide.roadtrip-mode.step.1':
    "Fes clic a «Viatge per carretera» al selector «Dies» i «Viatge per carretera», a dalt de la columna de l'esquerra. El pla dels dies se substitueix pel trajecte, i el mapa mostra tots els dies que tenen ruta.",
  'help.guide.roadtrip-mode.step.2':
    'La targeta de dalt del carril mostra els totals de tot el viatge: «Distància», «Temps de conducció» i «Parades». Es queda fixa quan desplaces els dies.',
  'help.guide.roadtrip-mode.step.3':
    'A sota hi ha una targeta per a cada dia amb trajecte; els dies sense trajecte no hi surten. La capçalera de la targeta mostra el número del dia amb la data a sota, i després pastilles amb la distància i el temps del trajecte i el nombre de parades del dia.',
  'help.guide.roadtrip-mode.step.4':
    "Dins de la targeta, el dia es mostra com una seqüència: una parada numerada per a cada lloc, un tram de conducció entre cada parell de parades i l'hora d'arribada a la vora dreta. Un vol, un tren o un ferri que hagis reservat apareix a la seqüència com una targeta pròpia.",
  'help.guide.roadtrip-mode.step.5':
    "Fes clic a la capçalera d'un dia per plegar-lo; la fletxa del final gira. Un dia plegat també s'amaga al mapa. Torna a fer clic a la capçalera per tornar-lo a mostrar.",
  'help.guide.roadtrip-mode.result':
    'La columna de l’esquerra mostra el trajecte i el mapa en mostra tots els dies. «Dies» torna directament al pla, sense cap canvi.',
  'help.guide.roadtrip-mode.tip.1':
    "L'opció es desa per viatge al teu compte, així que, després de tornar a carregar la pàgina, en un altre navegador o en un altre dispositiu, el viatge es torna a obrir en la vista de viatge per carretera.",
  'help.guide.roadtrip-mode.tip.2':
    "L'interruptor només apareix quan un administrador ha activat el complement «Viatge per carretera», a «Complements» del tauler d'administració.",
  'help.guide.roadtrip-mode.tip.3':
    'Al mòbil no hi ha selector: el complement afegeix la seva pròpia pestanya «Viatge per carretera» al costat de «Planificat».',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Parades pel camí i quant de temps t’hi quedes',
  'help.guide.roadtrip-stops.goal':
    'Converteix un lloc del trajecte en una parada pel camí, i defineix quanta estona dura cada parada.',
  'help.guide.roadtrip-stops.step.1':
    "Fes clic al número de davant d'una parada, al carril. La seva etiqueta és «Converteix en parada del camí», i obre els tipus de parada com una fila de discos de colors a sota.",
  'help.guide.roadtrip-stops.step.2':
    "Tria un tipus. Passa el ratolí per sobre d’un cercle per veure’n el nom: «Allotjament», «Combustible», «Càrrega», «Àrea de descans», «Càmping», «Menjar» o «Llocs d'interès». El número es converteix en la icona d’aquell tipus i les parades de sota es tornen a numerar.",
  'help.guide.roadtrip-stops.step.3':
    'Una parada pel camí no és una destinació, així que la capçalera del dia compta una parada menys.',
  'help.guide.roadtrip-stops.step.4':
    'Torna a fer clic a la icona, «Canvia el tipus de parada», i tria «Torna a ser una destinació» perquè la parada recuperi el seu número.',
  'help.guide.roadtrip-stops.step.5':
    'Cada parada té una insígnia «Parada», que mostra un més mentre no hi ha res planificat. Fes-hi clic per obrir «Temps en aquesta parada».',
  'help.guide.roadtrip-stops.step.6':
    'Defineix la durada amb el control lliscant, amb els botons de menys i més o amb un dels valors predefinits. «Sortida» canvia, mentre que «Arribada» es manté a l’hora en què arribes. Després fes clic a «Desa».',
  'help.guide.roadtrip-stops.result':
    'L’etiqueta «Parada» de la parada que has canviat mostra la nova durada, i totes les hores d’arribada posteriors s’ajusten. Una parada que has canviat a un tipus i després has tornat a deixar com estava torna a ser una destinació numerada.',
  'help.guide.roadtrip-stops.tip.1':
    "L'estada pertany al lloc, no a una visita concreta: un lloc planificat en dos dies té la mateixa estada tots dos dies.",
  'help.guide.roadtrip-stops.tip.2':
    'Les parades pel camí també apareixen a «Dies». Si desactives «Mostra també a Dies», a «Parades de servei», dins de «Preferències de conducció», només apareixen a «Viatge per carretera».',
  'help.guide.roadtrip-stops.tip.3': '«Sense estada», al mateix diàleg, torna a eliminar la durada.',
  'help.guide.roadtrip-stops.tip.4':
    'Fes clic en una parada pel camí o en una nit reservada per obrir-ne la targeta sobre el mapa. Amb «Viatge per carretera» activat, «Edita» obre allà el diàleg compacte que fa servir la cerca, en lloc del formulari del lloc, i «Més detalls», en aquest diàleg, obre el formulari complet.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Trobar combustible, menjar i on dormir al llarg de la ruta',
  'help.guide.roadtrip-corridor.goal':
    'Cerca al llarg de la carretera que fas de veritat i afegeix el que trobis al tram que toca.',
  'help.guide.roadtrip-corridor.step.1':
    'A «Es busca», obre la llista i marca el que necessitis. Pots combinar «Combustible», «Càrrega», «Àrea de descans», «Càmping», «Allotjament», «Menjar» i «Llocs d’interès»: la llista queda oberta per triar-ne més d’un, i el camp mostra una icona per a cada tipus.',
  'help.guide.roadtrip-corridor.step.2':
    "Tria el dia al desplegable del final de la mateixa línia. Ofereix els dies que tenen targeta al carril, i «Cercar» espera fins que s'ha calculat la ruta del dia que has triat.",
  'help.guide.roadtrip-corridor.step.3':
    'A «En un radi de», tria fins a quina distància vols buscar a cada costat de la carretera, 2 km, 5 km o 10 km, i fes clic a «Cercar».',
  'help.guide.roadtrip-corridor.step.4':
    "Els resultats s'agrupen per tipus, en l'ordre en què hi passes. Cadascun indica a quina distància és de la ruta i en quin punt del trajecte del dia es troba.",
  'help.guide.roadtrip-corridor.step.5':
    "Fes clic a «Afegir», el més d'un resultat. «Afegeix com a parada» indica a quin dia i en quina posició s'afegeix, i et demana el «Tipus de parada» i el «Temps en aquesta parada»; un punt de càrrega també mostra «Disponibilitat i tarifes». «Afegir» el posa al trajecte, i «Més detalls» obre en canvi el formulari complet del lloc.",
  'help.guide.roadtrip-corridor.result':
    'La parada que has afegit apareix a la ruta, al punt on hi passes, amb la icona del seu tipus. La ruta del dia es torna a calcular passant per la parada, i això buida la llista: torna a cercar per trobar la parada següent.',
  'help.guide.roadtrip-corridor.tip.1':
    'No es busca res fins que prems «Cercar»: cada cerca envia moltes peticions a un servei compartit.',
  'help.guide.roadtrip-corridor.tip.2':
    "«Filtra per nom» filtra els resultats sense fer una cerca nova, i «Esborra resultats» buida la llista i en treu les xinxetes. Fes clic a un resultat per veure'l al mapa.",
  'help.guide.roadtrip-corridor.tip.3':
    'També pots arrossegar un resultat del mapa fins a la ruta. Així tries tu el tram quan passes dues vegades per la mateixa carretera. «Manual», al costat de «Cercar», afegeix un lloc que la cerca no ha trobat, buscant-lo pel nom.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Fer passar un tram per un punt intermedi',
  'help.guide.roadtrip-via.goal': 'Fes que un tram passi per la carretera que vulguis, sense afegir-hi cap parada.',
  'help.guide.roadtrip-via.step.1':
    "Mostra al mapa el tram que vulguis: fes clic a una parada del carril i després tanca la targeta que s'obre sobre el mapa.",
  'help.guide.roadtrip-via.step.2':
    'Fes clic a la ruta dibuixada. S’afegeix un punt de pas al tram on has fet clic, i la ruta del tram es torna a calcular passant per aquest punt.',
  'help.guide.roadtrip-via.step.3':
    "El recorregut s'actualitza: la capçalera del dia mostra la nova distància i el nou temps de conducció, i totes les arribades posteriors al punt de pas canvien en conseqüència.",
  'help.guide.roadtrip-via.step.4':
    "Passa el ratolí per sobre del punt d'arrossegament per veure què fa: «Arrossega per canviar la forma de la ruta, clic dret per eliminar-lo». Arrossega'l a un altre lloc i el tram es torna a dibuixar passant pel punt nou.",
  'help.guide.roadtrip-via.step.5':
    'Fes clic amb el botó dret al punt d’arrossegament per treure’l. El tram torna a fer la ruta directa.',
  'help.guide.roadtrip-via.result':
    'El tram segueix la carretera que has triat, i es tornen a calcular la distància, el temps de conducció i les hores d’arribada del dia.',
  'help.guide.roadtrip-via.tip.1':
    "Un punt de pas no és una parada: no té número, ni estada, ni hora d'arribada, i no compta entre les parades del dia.",
  'help.guide.roadtrip-via.tip.2':
    'Els agafadors només apareixen a partir del nivell de zoom 9, així que un mapa que mostra tot el viatge mostra la línia sense agafadors.',
  'help.guide.roadtrip-via.tip.3':
    'Els clics a més de dos quilòmetres de qualsevol tram dibuixat s’ignoren, igual que els clics sobre un vol, un tren o un ferri.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Provar una altra carretera per a un tram',
  'help.guide.roadtrip-alternatives.goal':
    "Consulta les altres rutes que proposa el càlcul de rutes per a un tram del trajecte i tria'n una.",
  'help.guide.roadtrip-alternatives.step.1':
    'Fes clic en una franja de conducció de la barra lateral, la fila entre dues parades que mostra la distància i el temps del tram. La seva etiqueta és «Altres rutes».',
  'help.guide.roadtrip-alternatives.step.2':
    '«Rutes per a aquest tram» s’obre sobre el mapa, amb una entrada per carretera i la seva longitud. El mapa dibuixa cada carretera amb el temps de conducció: la carretera actual en blau intens i les altres en un blau més clar.',
  'help.guide.roadtrip-alternatives.step.3':
    'Passa el ratolí per una entrada per ressaltar aquella carretera. «Actual» és la carretera que fas servir i «La més ràpida» és la de menys temps; les altres indiquen quant més lentes són o quin tipus de carretera eviten.',
  'help.guide.roadtrip-alternatives.step.4':
    'Fes clic a una entrada per fer servir aquella ruta, o a «Tanca» per mantenir la ruta actual.',
  'help.guide.roadtrip-alternatives.result':
    'Ara el tram va per la carretera que has triat, i la distància de la columna lateral i les hores d’arribada posteriors també canvien.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Quan tries una altra carretera, TREK primer la comprova amb el calculador de rutes del viatge per carretera. Després manté el tram en aquella carretera amb els mínims punts de pas necessaris i substitueix els punts de pas que ja tenia el tram. Una carretera que el calculador no pot seguir no es desa. Si tries la carretera que proposa el mateix calculador, els punts de pas es tornen a eliminar.',
  'help.guide.roadtrip-alternatives.tip.2':
    '«Sense autopista», «Sense peatges» i «Sense ferri» els calcula un segon motor amb el seu propi model de velocitat, així que els temps no es poden comparar amb els de les altres rutes.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Definir el cotxe i els límits de conducció',
  'help.guide.roadtrip-limits.goal':
    'Indica a TREK quin vehicle condueixes i quanta estona vols conduir sense fer cap pausa.',
  'help.guide.roadtrip-limits.step.1':
    '«Preferències de conducció» és sota la cerca, a la columna de la dreta. Les seves insígnies mostren què hi ha configurat; fes-hi clic per obrir-les.',
  'help.guide.roadtrip-limits.step.2':
    'A «Conducció», «Trajecte més llarg seguit» i «Conducció per dia» van en minuts. Un camp buit vol dir que està desactivat, i no es marca res.',
  'help.guide.roadtrip-limits.step.3':
    'A «Vehicle», indica què condueixes. «Benzina» només reposta a les parades de combustible, «Elèctric» només a les de càrrega i «Tots dos» a totes dues.',
  'help.guide.roadtrip-limits.step.4':
    "Escriu tu mateix l'«Autonomia per dipòsit» o l'«Autonomia per càrrega». També pots obrir «Calcula-ho a partir del cotxe», sota «Omple fins a»: agafa la mida del «Dipòsit» i el «Consum», o la «Bateria», el «Consum» i el «Desgast bateria», i en calcula l'autonomia.",
  'help.guide.roadtrip-limits.step.5':
    "«Evita quan sigui possible», a la columna de l'esquerra, és una preferència, no una prohibició: si un dia no té cap altra alternativa, la ruta passa igualment per aquella carretera i ho indica amb una nota a la capçalera del dia.",
  'help.guide.roadtrip-limits.step.6':
    'Fes clic a «Tanca». Les insígnies de la targeta mostren què hi ha configurat, i el carril marca cada tram i cada dia que supera un límit.',
  'help.guide.roadtrip-limits.result':
    'Les insígnies de la targeta mostren què hi ha configurat, i cada tram i cada dia que supera un límit té una insígnia al recorregut.',
  'help.guide.roadtrip-limits.tip.1':
    'La configuració és del viatge, així que tothom qui hi participa planifica amb el mateix cotxe i els mateixos límits.',
  'help.guide.roadtrip-limits.tip.2':
    '«Omple fins a» indica fins a quin punt omple el dipòsit o la bateria una parada, perquè a la carretera ningú no carrega fins al 100 %. Una parada de combustible o de càrrega ho pot canviar amb la insígnia de la bateria de la seva fila.',
  'help.guide.roadtrip-limits.tip.3':
    'A «Línia de la ruta», «Connecta els dies» també calcula el trajecte des de l’última parada d’un dia fins a la primera del dia següent. «Comença i acaba cada dia a l’allotjament» fa que cada dia comenci i acabi a l’allotjament reservat per a aquelles nits. «Un color per dia» mostra cada dia amb el seu color.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Definir l’hora d’inici i de final del dia de conducció',
  'help.guide.roadtrip-day-window.goal': "Deixa de conduir a l'hora que triïs i defineix on ha d'acabar el dia.",
  'help.guide.roadtrip-day-window.step.1':
    "Obre «Preferències de conducció» a la columna de la dreta i busca «Horaris diaris», a la columna de l'esquerra del diàleg.",
  'help.guide.roadtrip-day-window.step.2':
    'Defineix un «Inici del dia». Per si sol no fa res: calen totes dues hores, com indica la nota de sota.',
  'help.guide.roadtrip-day-window.step.3':
    'Defineix un «Final del dia». Ara el trajecte s’atura a aquella hora i continua l’endemà al matí, cosa que es mostra amb una fila «Final del dia» i una fila «Continuar el viatge» a la columna lateral.',
  'help.guide.roadtrip-day-window.step.4':
    "A «Final del dia», tria «Durant el trajecte» per fer una pausa a la carretera a l'hora de finalització, o «A l’últim lloc» per aturar-te abans que el trajecte següent el deixi enrere.",
  'help.guide.roadtrip-day-window.step.5':
    'Fes clic a «Tanca». La targeta «Preferències de conducció» mostra les dues hores en una insígnia.',
  'help.guide.roadtrip-day-window.result':
    "El trajecte es divideix en dies de viatge de la durada que has indicat, i el que no hi cap continua en dies calculats després de l'últim. Els teus dies i els seus llocs no canvien.",
  'help.guide.roadtrip-day-window.tip.1':
    'Si esborres qualsevol de les dues hores, aquesta funció es torna a desactivar. Les hores que poses tu mateix en una parada sempre tenen prioritat.',
  'help.guide.roadtrip-day-window.tip.2':
    'Si defineixes horaris diaris, els dies queden sempre connectats: el trajecte de l’última parada d’un dia fins a la primera del dia següent es calcula i es compta.',
  'help.guide.roadtrip-day-window.tip.3':
    "Cada final de dia també és un marcador al mapa: una lluna amb el número del dia. Arrossega'l per la ruta, o sobre un lloc, per acabar el dia en un altre punt. Fes-hi clic amb el botó dret per recuperar el final automàtic. «Restaura els finals de dia automàtics», en aquest diàleg, desfà tots aquests canvis. Per acabar un dia en una parada concreta, fes clic a la parada i activa «Acaba el dia aquí» a la seva targeta.",
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Repostar abans que el dipòsit es buidi',
  'help.guide.roadtrip-refuel.goal':
    'Troba un lloc per repostar en el tram de la ruta on el cotxe encara pot arribar, i afegeix-lo al trajecte.',
  'help.guide.roadtrip-refuel.step.1':
    'Amb una autonomia definida, la columna lateral mostra una franja al tram on s’acaba el combustible o la bateria: «Aquí s’esgota el dipòsit» o, en un cotxe elèctric, «Aquí s’acaba la bateria». A sota, s’indica en quin punt del tram passa.',
  'help.guide.roadtrip-refuel.step.2':
    "La icona del llum de la franja és el botó: «Cerca combustible» o, per a un cotxe elèctric, «Cerca un punt de recàrrega». Busca al llarg de la carretera abans d'aquell punt i mostra «Cercant al llarg de la ruta…» mentre cerca.",
  'help.guide.roadtrip-refuel.step.3':
    "Es mostren fins a tres estacions de servei, cadascuna amb la distància a la ruta i l'autonomia que et quedaria.",
  'help.guide.roadtrip-refuel.step.4':
    'El signe més d’una oferta l’afegeix com a parada per repostar. «Afegeix com a parada» s’obre amb el tipus i l’hora ja omplerts, i «Afegir» la col·loca al tram, al punt exacte per on passa la ruta.',
  'help.guide.roadtrip-refuel.result':
    'La parada apareix al tram correcte amb la seva icona, i l’autonomia es torna a comptar des d’aquesta parada. La franja es desplaça fins al punt on ara es buida el dipòsit, o desapareix si pots arribar al final del trajecte sense cap altra parada.',
  'help.guide.roadtrip-refuel.tip.1':
    "L'autonomia es compta des de l'última parada de combustible o de càrrega, encara que sigui d'un altre dia. El tipus de vehicle determina quines parades compten: «Benzina», només les de combustible, i «Elèctric», només les de càrrega.",
  'help.guide.roadtrip-refuel.tip.2':
    "La cerca mira la carretera abans del punt on s'acaba el combustible, deixa un marge de reserva i compta dues vegades el desviament, de manera que tots els llocs que ofereix són realment accessibles.",
  'help.guide.roadtrip-refuel.tip.3':
    'Si no hi ha resultats, pots tornar a cercar: la bombeta passa a «Torna-ho a provar», perquè la cerca de llocs és un servei compartit que de vegades no respon a temps.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Fer que un dia segueixi una traça importada',
  'help.guide.roadtrip-track.goal':
    "Fes servir una ruta panoràmica que hagis importat com a traça GPX o KML per al trajecte d'un dia.",
  'help.guide.roadtrip-track.step.1':
    'Fes clic a l’etiqueta «Traça» de la capçalera d’un dia. El diàleg s’obre en aquell dia.',
  'help.guide.roadtrip-track.step.2':
    'Tria una traça. Cadascuna mostra la longitud i si segueix la ruta d’aquest dia o a quina distància queda. La traça més propera surt primer.',
  'help.guide.roadtrip-track.step.3':
    "Fes clic a «Segueix aquesta traça». TREK afegeix punts de pas on el trajecte s'allunya més de la traça, torna a calcular la ruta i ho repeteix diverses vegades.",
  'help.guide.roadtrip-track.step.4':
    "El diàleg indica quants punts de pas s'han col·locat i com de prop de la traça va ara la ruta, o bé que la ruta ja seguia la traça. «Treure els punts de pas», a baix a l'esquerra, els elimina i el calculador de rutes torna a planificar el dia. Si tanques el diàleg, la traça es conserva.",
  'help.guide.roadtrip-track.result':
    'El trajecte del dia segueix la traça en lloc de la carretera que hauria triat el calculador de rutes. Passa el ratolí per la seva insígnia «Traça» per veure el nom de la traça. Quan els punts de pas mantenen el trajecte sobre la traça, la insígnia també es ressalta.',
  'help.guide.roadtrip-track.tip.1':
    'El diàleg mostra els llocs del viatge que tenen un traçat: un GPX o KML importat amb «Importa un fitxer» a la columna de llocs, sota «Dies», amb «Rutes» o «Tracks (amb geometria de ruta)» marcats en un GPX, o «Rutes (LineStrings)» en un KML. «Importa un fitxer» només apareix mentre el complement «Excursions» està desactivat; amb «Excursions» activat, un GPX es converteix en una excursió, que aquest diàleg no mostra. Fins que el viatge no té cap traça, cap dia mostra la insígnia.',
  'help.guide.roadtrip-track.tip.2':
    'Si segueixes una traça, se substitueixen els punts de pas que ja tenien els trams del dia, així que ajusta els trams a mà després d’aplicar la traça, no abans.',
  'help.guide.dateless-trip.step.1': 'Fes clic a «Viatge nou» i posa un nom al viatge.',
  'help.guide.edit-trip.tip.2':
    "Els «Companys de viatge» que afegeixes o treus aquí s'actualitzen a l'instant, sense haver de fer clic a «Actualitza».",
  'help.guide.trip-reminder.result':
    'Reps el recordatori el nombre de dies que hagis triat abans que comenci el viatge, pels canals on reps les notificacions.',
  'help.guide.upcoming-reservations.step.1':
    "Busca «Properes reserves» a la columna de la dreta. Hi surten les sis properes reserves de tots els teus viatges, de la més pròxima a la més llunyana, amb la data, l'hora i el tipus.",
  'help.guide.half-company-holiday.step.1': "Canvia la barra d'eines a «Festiu de l'empresa».",
  'help.guide.edit-holiday-calendar.result':
    "La graella i la llegenda s'actualitzen a l'instant després de cada canvi.",
  'help.guide.person-color.result': 'Tots els dies que ha registrat la persona es mostren ara amb el color nou.',
  'help.guide.answer-fusion-request.step.1':
    "Obre «Vacances» quan algú t'hagi convidat. El diàleg «Sol·licitud de fusió» s'obre automàticament.",
  'help.guide.log-for-partner.step.1':
    "A la targeta «Persones», fes clic al nom de la persona. Una marca indica que l'has seleccionada.",
  'help.guide.dissolve-fusion.step.1': 'Obre «Configuració».',
  'help.guide.country-places.step.2': 'Fes clic a la insígnia «Llocs» de la targeta, la que té la xinxeta.',
  'help.guide.search-place.tip.2': 'Si la regió ja està marcada, la finestra emergent et pregunta si la vols treure.',
  'help.guide.tour-activity-stats.step.4':
    "Les insígnies de la dreta indiquen en què es basen les sumes: «Planificat» per a les excursions comptades segons la planificació del viatge, «Enregistrat» per a les excursions amb una traça real vinculada. «Per fer», «Sense dia» i «Sense data» compten les excursions que encara no s'hi inclouen. La i n'explica la regla.",
  'help.guide.move-to-list.step.2':
    "Fes clic a «Duplicar a la llista» per conservar-los també aquí, o a «Moure a la llista» per treure'ls d'aquesta llista.",
  'help.guide.accept-list-invite.title': 'Acceptar una invitació a una llista',
  'help.guide.tour-collection-add-to-trip.step.3':
    "A «Punts de ruta», tria la casella amb els punts de ruta per afegir l'inici, les parades i el final en ordre, o «Només la línia» per afegir només la línia desada.",
  'help.guide.tour-collection-manage.step.1':
    'Obre una llista. Cada excursió desada mostra el grau, el tipus, el viatge des del qual es va desar, la distància, el desnivell i quants punts de ruta té. Passa el ratolí per sobre del nom del viatge per veure qui la va desar.',
  'help.guide.entry-draft.step.1': "A l'editor, activa «Esborrany» a la columna de la dreta.",
  'help.guide.journey-map-layers.step.3':
    'Fes clic a una xinxeta buida o a un punt petit del mapa. Una targeta et diu què és: un lloc planificat i el seu dia, o una estada amb «Obre l’entrada», que et porta a la crònica del dia corresponent.',
  'help.guide.journey-keep-route.step.3': 'Fes clic a «Desa la ruta».',
  'help.guide.journey-day-stays.step.3':
    "Fes clic a «No és un lloc que hagi visitat» a l'estada que no vulguis. L'estada desapareix de la llista.",
  'help.guide.journey-take-over-day.step.3':
    'Si vols una sola entrada per a tot el dia, canvia «Entrades» a «Crònica del dia»: una entrada recull totes les estades triades amb els seus horaris.',
  'help.guide.journey-auto-prepare.step.2':
    'A «Dies enregistrats», activa «Prepara automàticament els dies enregistrats».',
  'help.guide.photo-location.step.2': 'A «Fotos», activa «Situa les entrades segons les seves fotos».',
  'help.guide.link-trip.tip.3':
    "Si escrius una entrada en un dia d'un viatge que encara no està vinculat, l'editor t'ofereix «Vincula un viatge» directament a l'entrada.",
  'help.ctx.settings-plugins.summary':
    "La teva configuració dels connectors que ha instal·lat l'administrador: les claus i preferències que et demana cada connector, i un registre del que han fet els connectors en nom teu. La pestanya només apareix mentre hi ha algun connector actiu.",
  'help.ctx.settings-about.bullet.3':
    'A Ko-fi, Buy Me a Coffee i Discord pots donar suport a TREK o parlar amb la gent que el fa.',
  'help.guide.language-region.step.3':
    "Tria la «Divisa de visualització», o deixa «Divisa del viatge» per veure cada viatge en la seva divisa. Després tria «Unitat de temperatura», «Unitat de distància», «Format d'hora» i, a «La setmana comença el», el dia en què comença la setmana.",
  'help.guide.travel-map-prefs.step.3':
    "«Explora llocs al mapa» mostra la pastilla de categories per trobar llocs propers. «Difumina els codis de reserva» amaga els números de confirmació fins que hi passes el ratolí per sobre o els toques. «Optimitza la ruta des de l'allotjament» fa que el dia comenci i acabi al teu hotel.",
  'help.guide.web-push-device.step.2':
    "A la targeta «Notificacions» de dalt, la columna Push defineix quins esdeveniments s'envien als teus dispositius.",
  'help.guide.connect-airtrail.goal': 'Fes que TREK importi i sincronitzi els vols del teu propi AirTrail.',
  'help.guide.connect-dawarich.goal': 'Fes que TREK sàpiga on has estat de veritat a partir del teu propi Dawarich.',
  'help.guide.tour-connect-wanderer.goal':
    'Fes que TREK llegeixi els camins del teu propi wanderer per importar-los com a excursions.',
  'help.guide.tour-wanderer-watch.title': 'Rebre un avís quan canviïn els teus camins de wanderer',
  'help.guide.plugin-settings.tip.2':
    'Un canal de connector a «Notificacions» té un botó «Configura» que obre aquesta pàgina.',
  'help.guide.default-user-settings.result':
    'Els comptes nous, i tothom que no hagi canviat mai aquesta configuració, veuen el que has triat.',
  'help.guide.own-routing-engine.goal':
    'Calcula les rutes dels dies i dels viatges per carretera amb un servidor OSRM o Valhalla propi, en lloc dels públics.',
  'help.guide.admin-passkeys.tip.1':
    "Si TREK encara no pot determinar cap domini, un avís t'ho indica, i les claus d'accés queden amagades fins que defineixis APP_URL o el Relying Party ID.",
  'help.guide.rotate-jwt-secret.step.1':
    'A baix de tot de la pestanya «Configuració», a «Zona de perill», fes clic a «Renova» al costat de «Rota el secret JWT».',
  'help.guide.storage-backends.tip.3':
    'TREK pot tornar a baixar les memòries cau de fotos, així que replicar-les sol ser malbaratar espai.',
  'help.guide.admin-channels.step.3':
    "A la targeta «Notificacions» de sota, tria per a cada esdeveniment quins canals l'envien: «Versió nova disponible», «Error de rèplica d'emmagatzematge» i «Regió de caiac demanada». Cada interruptor es desa a l'instant.",
  'help.guide.notification-defaults.tip.1':
    '«Desactivat» és un valor per defecte que cada usuari encara pot activar; «Bloquejat» el desactiva per a tothom.',
  'help.ctx.notifications.bullet.4':
    "Al costat de l'hora de cada notificació, «Marca com a llegida» (la doble marca) i «Elimina» (la paperera) s'apliquen només a aquella. «Marca-ho tot com a llegit» i «Elimina-ho tot», a dalt, s'apliquen a tota la llista.",
  'help.guide.read-notifications.tip.2':
    "Una notificació sense botó és només informativa. Llegeix-la al panell i marca-la com a llegida des d'allà.",
  'help.guide.filter-notifications.result':
    'La llista només mostra el que encara no has llegit, de més recent a més antic.',
  'help.guide.delete-notifications.title': 'Eliminar notificacions',
  'help.guide.notification-settings.goal':
    "Decideix quins esdeveniments apareixen a la campana i quins t'arriben també per correu, webhook, ntfy o push.",
  'help.guide.public-link.step.4': "Fes clic a «Crea l'enllaç», després a «Copiar», i envia'l.",
  'help.guide.link-journal.step.2': 'Fes clic a «Enllaçar un diari» i tria un dels teus diaris a «Tria un diari».',
  'help.guide.dawarich-stays.title': 'Convertir una estada enregistrada en un lloc',
  'help.guide.dawarich-stays.tip.2':
    "Si elimines un lloc que provenia d'una estada, l'estada torna a la llista com a «En espera».",
  'help.guide.leave-stop-off-route.goal':
    'Mantén una parada al dia sense que la ruta hi passi, per a un lloc on vas a peu o que només vols tenir al mapa.',
  'help.guide.day-route.tip.4':
    'Per a una parada que vols al dia però no a la ruta, tria «Treu de la ruta» al seu menú.',
  'help.guide.move-booking-day.step.2':
    "Arrossega la fila fins a la capçalera de la targeta d'un altre dia. Una reserva d'un sol dia es mou sencera a aquell dia. En una reserva de diversos dies, la fila «Sortida» canvia el dia d'inici i la fila «Arribada», el dia de final.",
  'help.guide.place-image-from-file.title': 'Fer servir una foto adjunta com a imatge del lloc',
  'help.guide.place-image-from-file.tip.2': "També s'ofereix una foto fixada a la parada o adjunta a la seva reserva.",
  'help.guide.place-own-hours.step.5':
    "Fes clic a «Actualitza». Ara la targeta mostra el teu horari a «Horari d'obertura», i l'«Obert» o «Tancada» de dalt es basa en aquest horari.",
  'help.guide.confirm-stay-booking.step.3':
    "Fes clic a «Pendent», a dalt. El text d'ajuda diu «Set to Confirmed» i el punt es torna verd.",
  'help.guide.map-nearby-places.tip.4':
    "Si la cerca d'una categoria falla, la categoria mostra un punt vermell i «Cerca en aquesta zona» es torna vermell amb un senyal d'avís: fes-hi clic per tornar-ho a provar.",
  'help.guide.tour-map-lines.tip.1':
    "Quan plegues un dia a la columna de dies, les seves excursions i parades s'amaguen del mapa.",
  'help.guide.car-stops.step.3':
    "Escriu un títol a la capçalera. A «Ruta», tria on recolliràs el cotxe a «De» i on el retornaràs a «A»; abans d'escriure ja se t'ofereixen els llocs del viatge. «Recollida» i «Hora de recollida» indiquen quan el reculls, i «Devolució» i «Hora de devolució», quan el tornes.",
  'help.guide.transport-details.step.1':
    "A la pestanya «Transports», fes clic a una targeta. Els detalls s'obren damunt de la pestanya, amb la capçalera del mateix color que la targeta. La fila d'un transport al pla del dia obre els mateixos detalls.",
  'help.guide.export-transports-csv.tip.2':
    'La pestanya «Reserves» té la mateixa icona i genera un fitxer propi, que acaba en bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    "A «Agrupar per», tria «Estat», «Dia», «Tipus» o «Sense agrupar». La pestanya s'ordena de seguida en aquestes seccions.",
  'help.guide.export-bookings-csv.result':
    'El navegador baixa un fitxer amb el nom del viatge i de la pestanya, per exemple autumn-in-japan-bookings.csv, amb una fila per cada reserva que mostrava la pestanya.',
  'help.guide.arrange-packing-list.result':
    "Les llistes queden en l'ordre en què les has arrossegat, i els articles s'ordenen de la A a la Z fins que ho desactives. TREK continua desant el teu ordre.",
  'help.guide.count-packed-pieces.step.2':
    'Davant de la quantitat apareix un comptador: 0/5, amb un menys i un més. Fes clic al més per cada peça que fiquis a la bossa.',
  'help.guide.expense-receipts.step.4':
    "De nou al llibre de comptes, la fila té una fitxa «Rebut» al costat del nom, amb el nombre entre parèntesis si n'hi ha diversos. Fes-hi clic per obrir el rebut.",
  'help.guide.final-budget.tip.3':
    "Qui ha deixat el viatge conserva una fila a «Balanços» i a «Pressupost final» mentre encara li deguin diners o n'hagi de pagar.",
  'help.guide.files-sync-settings.step.2':
    'La barra de flux mostra TREK i el teu gestor, amb els documents que té cadascun, i dos carrils entre tots dos: «Cap al gestor» i «Des del gestor». Fes clic a «Cap al gestor» per desactivar-lo. El carril es posa gris i la línia de sota els carrils diu «Only coming in». Torna-hi a fer clic per activar-lo de nou.',
  'help.guide.files-sync-settings.tip.4':
    "Només el propietari del viatge o un administrador poden canviar res d'això. La resta de membres veuen la barra de flux amb una línia com «Documents move both ways», però no veuen «Configuració».",
  'help.guide.manage-notes.step.2':
    "«Ampliar» obre la nota sencera: el text complet, el «Lloc web» i els «Fitxers». Fes clic a un fitxer per previsualitzar-lo. «Edita», a baix, passa directament a l'editor; la creu de dalt a la dreta torna a tancar la nota.",
  'help.guide.note-categories.goal':
    "Dona a les notes del grup categories amb nom i color, i mostra'n una cada vegada.",
  'help.guide.note-categories.tip.1':
    'La paperera només elimina una categoria que no fa servir cap nota. Una categoria que encara fan servir algunes notes es queda a la llista fins que les mous a una altra categoria.',
  'help.guide.roadtrip-reorder.title': 'Reordenar una parada o moure-la a un altre dia',
  'help.guide.roadtrip-reorder.tip.3':
    "TREK no et pregunta res sobre una hora que has fixat: el carril recalcula el dia a l'instant i marca les parades a les quals ja no es pot arribar a temps.",
  'help.guide.roadtrip-overnight.step.3':
    "A dalt del diàleg, «Pernoctar» hi afegeix una nit d'estada i «Parada» el converteix en una parada d'una estona. Un hotel s'obre amb «Pernoctar» i un càmping amb «Parada». Una nit només demana el «Registre d'entrada», que pots deixar buit.",
  'help.guide.roadtrip-stop-fill.step.1':
    "En una parada de combustible o de càrrega del carril, fes clic a la insígnia de la bateria. Mostra el nivell fins al qual omple la parada: esvaït mentre fa servir el teu valor d'«Omple fins a», i sòlid quan té un valor propi.",
  'help.guide.roadtrip-bookings.step.1':
    "Reserva el trajecte com a reserva de «Vol», «Tren», «Ferri», «Creuer» o «Autobús» el dia que toca, amb els dos extrems ubicats. La ruta per carretera l'inclou automàticament: la carretera acaba a la terminal d'on surt i torna a començar on arriba.",
  'help.guide.roadtrip-google-import.result':
    "Les parades de la ruta s'afegeixen després de l'última parada d'aquell dia, i la ruta del carril i del mapa hi passa.",
  'help.guide.roadtrip-hazards.step.3':
    "Els avisos es dibuixen al mapa com a zones. Fes clic en una per veure de què tracta, quin servei l'ha notificada i quan s'ha actualitzat per última vegada.",
  'help.ctx.trip-tours.bullet.2':
    "A dalt, «Importa GPX o KML» importa fitxers com a excursions. El botó de filtre de sota (al principi «Tots», amb el nombre d'excursions) filtra la llista per estat, origen, límit de ruta i tipus.",
  'help.guide.tour-show-list.step.2':
    "Cada fila és una excursió. La barra de color és la seva línia al mapa, i la casella rodona mostra el límit de ruta (T1 a T6) d'una caminada planificada a TREK o la icona del seu tipus. Les insígnies de sota el nom mostren els dies en què és, el temps, la distància i el desnivell positiu. En una excursió de diversos dies, la lluna amb un número indica quantes etapes té.",
  'help.guide.tour-add-to-day.title': 'Posar una excursió en un dia',
  'help.guide.tour-add-to-day.tip.2':
    "Si el viatge acaba abans de l'última etapa, l'opció mostra l'última etapa que hi cap, i les etapes següents queden sense dia.",
  'help.guide.tour-day-times.step.3':
    "Fes clic a «Actualitza». Ara la fila mostra inici → final. Una hora de final calculada es veu més clara, amb ≈ si és una estimació, ≥ si una estada encara no té hora i +1 si passa de mitjanit. Passa-hi el ratolí per veure com s'ha calculat.",
  'help.guide.tour-remove-from-day.goal': 'Treu una excursió de la planificació sense eliminar-la.',
  'help.guide.tour-filter-list.goal':
    "Redueix una llista llarga a les excursions que vols: les que encara no has planificat, les d'un fitxer o les d'un tipus.",
  'help.guide.tour-filter-list.result':
    'A la llista només hi ha les excursions que has filtrat; les altres continuen al viatge.',
  'help.guide.tour-hide-on-map.result':
    'Al mapa només hi ha les excursions que vols, i les amagades continuen a la llista, atenuades.',
  'help.guide.tour-import-plan-tab.result':
    'La traça ja és una excursió del viatge: una fila a la llista amb una insígnia GPX i una línia al mapa.',
  'help.guide.tour-detail-read.title': 'Obrir una excursió i llegir-ne la targeta',
  'help.guide.tour-detail-read.step.7': 'Tanca la targeta amb la X de dalt o prem Esc.',
  'help.guide.tour-rename-colour.goal':
    'Dona a una excursió un nom que reconeguis i un color de línia que es vegi bé al mapa.',
  'help.guide.tour-take-along.title': 'Baixar una excursió al telèfon o al GPS',
  'help.guide.tour-take-along.tip.4':
    "A la pestanya «Excursions», la mateixa baixada és a dalt de la columna de l'esquerra. Si l'excursió té canvis sense desar, primer et demana que la desis.",
  'help.guide.tour-copy-keep.tip.1':
    "Totes dues són còpies: els canvis que facis després a l'excursió no afecten ni la còpia ni la versió que vas desar a la col·lecció.",
  'help.guide.tour-packing-link.step.2':
    "A «Vincula amb», tria «Tota la llista d'equipatge» o una de les seves llistes. Cada fila mostra quants articles conté.",
  'help.guide.tour-files.title': 'Adjuntar fitxers a una excursió',
  'help.guide.tour-activity-link.title': 'Vincular la traça que vas fer realment',
  'help.guide.tour-activity-link.tip.2':
    "Només pots vincular una traça importada que no s'hagi fet servir per planificar una excursió, i cada traça només es pot vincular a una excursió.",
  'help.guide.tour-activity-compare.step.4':
    "«Canvia», a sota de la traça, tria un altre enregistrament. «Desvincula» la treu de l'excursió, i la traça es queda al viatge com a importació.",
  'help.guide.tour-origin-check.step.3':
    'Una excursió que has dibuixat a la pestanya «Excursions» mostra «planificada a TREK», amb el dia a «Creat».',
  'help.ctx.trip-tour-planner.bullet.2':
    "El carril de l'esquerra és l'editor. Si no hi ha res obert, ofereix «Planifica una nova excursió». Una excursió oberta mostra el nom, el tipus, els punts de ruta, les targetes del seu tipus i els detalls, amb «Descartar» i «Desa» a baix.",
  'help.guide.tour-open-workspace.step.2':
    "El carril de l'esquerra és l'editor. Si no hi ha cap excursió oberta, ofereix «Planifica una nova excursió», que comença una excursió al mapa.",
  'help.guide.tour-open-workspace.tip.3':
    "Si obres una altra excursió mentre l'editor té canvis sense desar, primer et pregunta si vols «Descarta els canvis» o continuar editant.",
  'help.guide.tour-draw-route.step.5':
    "Fes clic als punts següents en l'ordre en què els recorreràs. Cada clic afegeix el punt com a nou final, i a partir de dos punts TREK planifica la ruta pels camins.",
  'help.guide.tour-type-profile.goal':
    "Tria el tipus d'excursió i, si és en bici, el perfil, perquè la ruta passi pels camins adequats.",
  'help.guide.tour-edit-points.title': 'Moure, reordenar i treure punts',
  'help.guide.tour-edit-points.tip.1':
    "El primer punt té una insígnia «Inici» i l'últim, «Fi». Si mous un punt a dalt de tot o a baix de tot, passa a ser l'inici o el final.",
  'help.guide.tour-shaping-points.step.4':
    "Per convertir una parada en punt de forma o a l'inrevés, obre «Més accions» a la seva fila i tria «Converteix-lo en punt de forma» o «Converteix-lo en parada».",
  'help.guide.tour-loop-reverse.step.2':
    "Ara l'última fila mostra «Tornada a l’inici», i la ruta del mapa acaba on començava.",
  'help.guide.tour-leg-by-hand.step.1':
    'Obre «Més accions» al punt on comença el tram i tria «Dibuixa a mà el tram següent».',
  'help.guide.tour-trip-places.goal': "Afegeix com a parada de l'excursió un lloc que ja tens planificat al viatge.",
  'help.guide.tour-trip-places.result': "L'excursió té una parada nova per al lloc del viatge, amb el mateix nom.",
  'help.guide.tour-details-times.tip.2':
    "En una caminada, «Detalls» també inclou la «Dificultat màxima del sender» i l'«Elecció de ruta», que s'expliquen a les guies de caminades. Un passeig urbà no té «Pauses»: s'hi compta el temps que passes a cada parada.",
  'help.guide.tour-save.step.4': "Ara l'excursió apareix a «Excursions d'aquest viatge», encara sense dia.",
  'help.guide.tour-edit-saved.step.2':
    'Canvia el que calgui, com en una excursió nova: mou o afegeix punts, canvia el tipus o edita els detalls, com aquí la «Descripció».',
  'help.guide.tour-summary-profile.goal':
    "Consulta la llargada i el pendent de l'excursió, i a quin punt de la ruta correspon cada altitud.",
  'help.guide.tour-summary-profile.result':
    "Saps quant fa l'excursió, quant desnivell puja, quant dura i on hi ha més pendent.",
  'help.guide.tour-list-manage.tip.1':
    'Cada excursió compta una sola vegada als totals, encara que sigui en diversos dies. Una suma amb ≥ al davant no inclou algunes excursions. Passa-hi el ratolí per veure quantes.',
  'help.guide.tour-delete.tip.1': "No es pot desfer, i «Desfer» no recupera l'excursió.",
  'help.guide.tour-saved-elsewhere.step.3':
    "Si igualment fas clic a «Desa», s'obre «Canviada mentrestant» i no se sobreescriu res.",
  'help.ctx.trip-tour-import.bullet.2':
    '«Previsualització de la importació» mostra totes les traces dels fitxers en un mapa, amb la distància, el desnivell positiu i negatiu i els punts, abans de desar res. A «Importa com a» indiques què són les traces.',
  'help.guide.tour-import-gpx.step.3':
    "S'obre la «Previsualització de la importació» i encara no s'ha desat res. El mapa mostra tot el recorregut, i cada traça dels fitxers és una fila numerada amb la distància, el desnivell positiu i negatiu i els punts. Una traça enregistrada també indica quan es va fer i quant va durar.",
  'help.guide.tour-import-gpx.result':
    "L'excursió és a «Excursions d'aquest viatge», encara sense dia. Si només n'hi ha una, s'obre directament al mapa com a «Excursió GPX».",
  'help.guide.tour-view-import.tip.3': "Un camí de wanderer s'obre igual, com a «Excursió de wanderer».",
  'help.guide.tour-plan-from-import.tip.1': '«Descartar» elimina el suggeriment. No es desa res fins que no ho desis.',
  'help.guide.tour-restore-recorded.step.2': 'Fes clic a «Restaura la traça enregistrada».',
  'help.guide.tour-take-over.step.2': "Tria «Agafar una ruta d'un altre viatge».",
  'help.guide.tour-take-over.result':
    "Un missatge confirma que l'has agafada, i l'excursió s'obre a l'editor, a punt per posar-la en un dia.",
  'help.guide.tour-import-wanderer.tip.2':
    "La importació és una còpia: els canvis que es facin després a wanderer no afecten l'excursió. «Comprova la font», a l'«Origen» de l'excursió, t'indica quan ha canviat el camí.",
  'help.ctx.trip-tour-map.bullet.3':
    "«Cerca un lloc o una adreça», a dalt del mapa, porta el mapa a un poble, un refugi o un cim sense afegir res a l'excursió.",
  'help.guide.tour-map-layers.result':
    "L'excursió es dibuixa sobre el mapa que li escau, i la pastilla mostra quin està activat.",
  'help.guide.tour-along-search.step.3':
    "A «Dins d'aquesta distància de la ruta», tria fins a quina distància de la línia vols buscar: 250 m, 500 m, 1 km o 2 km.",
  'help.guide.tour-along-add-stop.goal':
    "Fes passar l'excursió per un mirador, un refugi o una font que hagis trobat pel camí.",
  'help.guide.tour-along-add-stop.tip.3':
    'Un tram on no pots afegir cap parada (una via ferrada o un transport per terra afegit com a línia fixa, o un tram dibuixat a mà) es mostra atenuat a la llista, amb el motiu al costat.',
  'help.guide.tour-3d-terrain.result':
    "Has vist l'excursió sobre el relleu en 3D, amb els trams de més pendent en color, i tornes a tenir el mapa pla per planificar.",
  'help.guide.tour-3d-flyover.step.3':
    "«Pausa» atura el vol on és, i «Reprodueix el sobrevol» el reprèn des d'allà. «Torna a començar» torna a l'inici i inicia el vol de nou.",
  'help.guide.tour-map-overlays.step.1':
    "Obre una excursió d'esquí a la pestanya «Excursions». Les pistes es mostren des del principi: el seu interruptor és la muntanya nevada de la pastilla de baix a l'esquerra, «Pistes, circuits de fons i remuntadors». Fes-hi clic per amagar-les del mapa, i torna-hi a fer clic per mostrar-les.",
  'help.ctx.trip-tour-stages.title': 'Excursions de diversos dies',
  'help.guide.tour-multi-day.goal': 'Divideix una ruta en etapes, una per cada dia de marxa.',
  'help.guide.tour-multi-day.tip.2':
    "Per tornar a unir dues etapes, tria «Treu el final d’etapa» al menú de la parada amb la lluna. Si treus aquesta parada, també s'uneixen, i un avís t'ofereix «Desfer».",
  'help.guide.tour-stages-on-days.step.3':
    "Tria «Etapes a partir d’aquest dia»: l'etapa 1 va en aquest dia i cada etapa següent, al dia següent. «Ruta sencera en aquest dia», en canvi, posa tota la ruta en aquest únic dia.",
  'help.guide.tour-stages-on-days.result':
    "Cada etapa és al seu dia del viatge, i l'etapa que has obert és a l'editor.",
  'help.ctx.trip-tour-hike.bullet.6':
    "«Resum de l'excursió», a la dreta, mostra la distància, el desnivell, el temps estimat a peu o corrent, les pauses i el total planificat, amb el perfil d'elevació a sota. «Desa», a baix de l'editor, desa l'excursió.",
  'help.guide.tour-hike-plan.step.6': "Fes clic a «Desa» a baix de la columna de l'esquerra.",
  'help.guide.tour-hike-trail-details.step.1':
    "Obre la caminada des d'«Excursions d'aquest viatge» i busca «Detalls del camí» sota la targeta «Punts de ruta». Activa «Mostra al llarg de la ruta».",
  'help.guide.tour-hike-trail-details.tip.3':
    "Res d'aquesta targeta canvia l'excursió, i cal connexió. Una caminada importada mostra la mateixa targeta a la seva vista, sense límit de ruta.",
  'help.guide.tour-hike-round.result':
    "La caminada segueix la volta que has triat i torna a l'inici. «Ruta agafada», a baix del mapa, té «Desfer», i «Desa» la conserva.",
  'help.guide.tour-hike-compare-ways.step.3':
    "Les insígnies d'una fila indiquen quant més llarg, més alt o més lent és respecte del camí actual. Fes clic al que vulguis.",
  'help.guide.tour-ferrata-add.step.1':
    "Amb una caminada oberta, fes clic a «Vies ferrades» a la fila de botons del mapa de baix a l'esquerra. La insígnia compta les vies ferrades visibles; si t'ho demana, apropa el zoom.",
  'help.guide.tour-ferrata-add.tip.3':
    "El tram de via ferrada es ressalta al perfil d'elevació, perquè vegis en quin moment del dia hi arribes.",
  'help.guide.tour-run-plan.step.5': "Posa un nom a la cursa a «Nom de l'excursió» i fes clic a «Desa».",
  'help.guide.tour-run-ways.step.1':
    "Obre la cursa des d'«Excursions d'aquest viatge» i activa «Mostra al llarg de la ruta» a «Detalls del camí», sota la targeta «Punts de ruta».",
  'help.ctx.trip-tour-walk.bullet.1':
    'El «Tipus de ruta» «Passeig urbà / turístic» converteix una excursió en un passeig. Els seus punts són parades amb una «Etiqueta», una estada i una importància. Un passeig no té límit de senderisme ni camp «Pauses»: es fan servir les estades.',
  'help.guide.tour-walk-plan.step.2':
    'Afegeix les parades: comprova que «Afegeix un punt» estigui activat i fes clic al mapa a cada parada, o fes clic a «Llocs del viatge» per afegir un lloc que ja té el viatge.',
  'help.guide.tour-walk-plan.result':
    "El passeig mostra les parades amb les estades, i el «Resum de l'excursió» les suma. Posa'l en un dia per veure quan arribes a cada parada.",
  'help.guide.tour-walk-sights.tip.1': 'Passa a ser una parada del passeig, no un lloc del viatge.',
  'help.guide.tour-walk-day-times.step.3':
    "Torna a obrir el passeig a la pestanya «Excursions». A dalt de «Punts de ruta», «Horaris per a» mostra el dia i l'hora d'inici. En un passeig planificat en diversos dies, fes-hi clic per triar-ne un altre.",
  'help.guide.tour-walk-google-import.goal':
    "Enganxa una ruta a peu compartida des de Google Maps i carrega'n les parades com a passeig.",
  'help.guide.tour-walk-google-import.result':
    "S'obre un passeig urbà nou a l'editor amb les parades de Google Maps, llest per desar.",
  'help.guide.tour-walk-check-off.tip.2':
    'La fila del passeig al pla del dia també mostra el recompte, per exemple 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Amb el perfil «BTT», la mateixa targeta mostra els graus de dificultat dels camins (mtb:scale) allà on els cartògrafs els han afegit. Un camí sense grau és desconegut, no fàcil.',
  'help.guide.tour-bike-profile.step.6':
    "Escriu un nom a «Nom de l'excursió» i fes clic a «Desa» a baix del carril de l'esquerra.",
  'help.guide.tour-bike-surfaces.goal':
    "Descobreix quina part de la ruta és d'asfalt, de grava o desconeguda, i per quins tipus de via passa.",
  'help.guide.tour-bike-surfaces.tip.3':
    "La targeta fa servir la ruta tal com l'ha planificat el calculador i no canvia res de l'excursió. Cal connexió; sense connexió t'ho indica, i la ruta no es veu afectada.",
  'help.guide.tour-bike-mtb-grades.tip.1':
    '«Sense grau a les dades» vol dir desconegut, no fàcil. Un grau no indica si un camí és adequat per a tu.',
  'help.ctx.trip-tour-ski.bullet.3':
    "Cada punt on fas clic al mapa s'uneix a l'anterior per pistes, remuntadors i camins. Sota cada punt, el seu tram es mostra en fitxes, amb les pistes del color del seu grau i els minuts. Un tram que no es pot planificar es posa vermell, n'explica el motiu i ofereix una solució o «Dibuixa recte».",
  'help.guide.tour-ski-plan.step.4':
    "Comprova que «Afegeix un punt» estigui activat i fes clic al mapa on comences i a cada lloc on vulguis arribar, per ordre. El calculador de pistes uneix cada punt a l'anterior per pistes, remuntadors i camins.",
  'help.guide.tour-ski-options.title': 'Indicar al calculador de pistes com esquies',
  'help.guide.tour-ski-options.tip.2':
    '«Fer servir remuntadors» està activat per defecte per a «Alpí» i «Surf de neu», i desactivat per a les altres disciplines. «Excloure» i «Baixar amb remuntador si cal» només es mostren quan es fan servir remuntadors.',
  'help.guide.tour-ski-fix-leg.tip.1':
    "També pots arrossegar el punt al mapa més a prop d'una pista, un camí o un remuntador. El tram es torna a planificar quan el deixes anar.",
  'help.guide.tour-ski-summary.step.2':
    '«Esquiant», «En remuntadors», «En espera» i «A peu» indiquen el temps de cada cosa. «Pistes», «Baixada per pistes» i «Viatges en remuntador» indiquen la longitud de les pistes, el desnivell que baixes esquiant-hi i quants remuntadors agafes.',
  'help.guide.tour-ski-pistes-layer.goal':
    "Consulta les pistes, els circuits de fons i els remuntadors al voltant de la teva excursió d'esquí, i què vol dir cada color.",
  'help.guide.tour-ski-import.title': "Importar una traça d'esquí i indicar què era",
  'help.guide.tour-ski-import.tip.1':
    "Una traça importada es conserva tal com es va enregistrar: TREK no l'ajusta a les pistes, i la seva targeta mostra «Temps d’esquí» com a «Sense calcular».",
  'help.ctx.trip-tour-paddle.bullet.3':
    "«Més accions», en un punt, conté les eines de rem: planificar el tram següent per l'aigua o dibuixar-lo a mà, «Porta l’embarcació per terra des d’aquí» i «Resclosa en aquest punt».",
  'help.guide.tour-paddle-setup.step.3':
    "A «Vaixell», tria «Caiac», «Canoa», SUP o «Altres». L'embarcació determina la velocitat que suggereix TREK.",
  'help.guide.tour-paddle-setup.tip.4':
    '«El rem té riscos», la fila del final de la columna, obre «Seguretat a l’aigua». Llegeix-la un cop abans de la teva primera excursió.',
  'help.guide.tour-paddle-water-route.step.5':
    'Per planificar alhora tots els trams dibuixats a mà, fes clic a «Planifica per l’aigua els trams dibuixats a mà», les ones de la capçalera de «Punts de ruta».',
  'help.guide.tour-paddle-portage.step.1':
    "Passa el ratolí per la parada on surts de l'aigua i fes clic a «Més accions», els tres punts.",
  'help.guide.tour-paddle-portage.result':
    "El tram és un transport per terra al mapa i als punts de ruta, i l'«Estimació de temps» el compta com a transport per terra.",
  'help.guide.tour-paddle-lock.tip.2':
    "Si un transport per terra evita la resclosa, la resclosa es mostra atenuada i marcada com a «Evitada per terra». Compta el temps del transport per terra, i els minuts de la resclosa no s'inclouen.",
  'help.guide.tour-paddle-time.step.4':
    "Si l'excursió té un transport per terra, la fila «Transport per terra» compta aquest tram. Fes clic a la velocitat i escriu a quina velocitat portes l'embarcació. «Sortida i reembarcament» afegeix els minuts a cada transport per terra.",
  'help.guide.tour-paddle-wind.step.1':
    "Posa l'excursió de rem en un dia del viatge. Aleshores, la targeta «Vent» de la columna de l'esquerra mostra la previsió d'aquell dia a l'inici de l'excursió.",
  'help.guide.tour-paddle-wind.result': "Saps quin vent farà aquell dia al punt on entres a l'aigua, hora a hora.",
  'help.guide.tour-paddle-checklist.tip.1':
    'Per a cada obstacle, tria què faràs: «Passar remant», «Portar per terra», «Rodejar» o «No afecta». «Següent» et porta a la següent entrada pendent.',
  'help.guide.tour-paddle-track-marks.step.1':
    'A la pestanya «Excursions», fes clic a «Afegeix una ruta» a la columna de la dreta, tria «Importa GPX o KML» i selecciona el fitxer.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '«Descartar» elimina les marques que no has desat. La traça enregistrada no es redibuixa mai.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK no calcula cap temps a cavall. Si vols que el dia en tingui, introdueix un temps a «Planificat», a «Detalls».',
  'help.guide.tour-horse-plan.step.5':
    'Tria un tram a «Seccions». Comprova el «Sentit» en què el fas i què indica «Accés a cavall» al llarg del tram.',
  'help.guide.tour-horse-plan.tip.5':
    "En una ruta a cavall no es calcula cap traçat: un clic a la línia dibuixada no afegeix cap punt de forma, i els punts dels extrems d'un tram es queden on els té la ruta.",
  'help.guide.tour-horse-gap.tip.1':
    'Cap calculador ni cap ruta eqüestre ha comprovat un tram manual. Mira el mapa per veure per on passa realment.',
  'help.guide.tour-horse-recorded.step.4':
    "La ruta s'obre a la columna de l'esquerra. La targeta «Ruta enregistrada» mostra «Tal com es va enregistrar», «Sense temps a cavall» i «Accés sense comprovar». Passa el ratolí per sobre d'una insígnia per veure'n el motiu.",
  'help.guide.dateless-trip.step.2':
    "Deixa buides «Data d'inici» i «Data de fi». A sota apareix el camp «Nombre de dies»: indica quants dies vols planificar.",
  'help.guide.trip-reminder.tip.1':
    "Només el propietari del viatge (o un administrador) veu el bloc «Recordatori». Si està en gris, primer un administrador ha d'activar els recordatoris de viatge a «Administrador», «Notificacions».",
  'help.guide.upcoming-reservations.step.2': 'Fes clic a una reserva per obrir el viatge al qual pertany.',
  'help.guide.timezones-widget.tip.1':
    'La llista fa servir els noms oficials dels fusos horaris, com ara Europe/Lisbon o America/New_York, així que busca la ciutat que apareix al nom.',
  'help.guide.half-company-holiday.step.2': "Activa «Mitja jornada» a la mateixa barra d'eines.",
  'help.guide.edit-holiday-calendar.tip.1': "Cada canvi es desa a l'instant. No hi ha cap botó «Desa».",
  'help.guide.person-color.tip.1': "El mateix color identifica la persona a la barra d'eines i a la targeta «Dret».",
  'help.guide.answer-fusion-request.step.2':
    'Llegeix què implica fusionar: un sol calendari compartit, entrades que us podeu editar entre vosaltres i una configuració de vacances compartida.',
  'help.guide.log-for-partner.step.2': "Mira la barra d'eines: ara el primer botó mostra el seu nom i el seu color.",
  'help.guide.dissolve-fusion.step.2': 'A «Desfés la fusió», a baix de tot, fes clic a «Dissol».',
  'help.guide.country-places.step.3':
    "El diàleg mostra tots els llocs comptats per al país, agrupats per viatge; si n'hi ha més de sis, «Cerca llocs», a dalt, filtra la llista. Fes clic a un lloc o al títol d'un viatge per obrir aquell viatge al planificador.",
  'help.guide.tour-activity-stats.step.5':
    "Fes clic a «Mostra les excursions». S'obre «Les meves excursions fetes» amb els totals, el desglossament «Per tipus» i totes les excursions del període amb el dia, el viatge, la distància i el desnivell. Les pastilles de la capçalera també permeten canviar aquí el període i el tipus.",
  'help.guide.move-to-list.step.3':
    "Tria la llista de destinació. Si n'hi ha més de tres, un quadre de cerca a dalt permet filtrar-les.",
  'help.guide.accept-list-invite.goal': 'Uneix-te a una llista que algú ha compartit amb tu, o rebutja la invitació.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Si vols, canvia el «Nom al viatge» i després fes clic a «Afegeix a un viatge».',
  'help.guide.tour-collection-manage.step.2':
    'Escriu a «Cerca llocs». Filtra les excursions pel nom, juntament amb els llocs.',
  'help.guide.create-journey.tip.3':
    'Quan un viatge acaba de terminar, «Crea una travesia» al bàner «El viatge acaba de terminar», a dalt, comença una travessia amb aquest viatge ja seleccionat.',
  'help.guide.entry-draft.step.2': 'Fes clic a «Desa». Ara la targeta mostra la insígnia «Esborrany».',
  'help.guide.gallery-map.step.3':
    "De nou a «Cronologia», el mapa de la dreta segueix el desplaçament: l'entrada que tens a la vista té un anell del color del seu dia. Fes clic a una xinxeta perquè la cronologia es desplaci fins a la seva entrada.",
  'help.guide.journey-map-layers.tip.1':
    "Una línia de color discontínua és la ruta GPX d'un viatge, que forma part del pla; una de contínua és una ruta enregistrada aquell dia.",
  'help.guide.journey-keep-route.tip.1':
    "On s'atura l'enregistrament, també s'atura la línia. TREK només dibuixa el que s'ha enregistrat.",
  'help.guide.journey-day-stays.tip.1':
    'La fila només apareix a les persones que poden editar el diari i tenen el seu propi Dawarich connectat, i només els dies en què encara hi ha alguna cosa per decidir.',
  'help.guide.journey-take-over-day.step.4':
    'Deixa activat «Desar també la ruta del dia» per conservar també la ruta i després fes clic al botó «Agafar». El botó indica quants esborranys crearà.',
  'help.guide.journey-auto-prepare.step.3':
    "La línia de sota indica quan es van obtenir per última vegada les teves estades, o per què no ha funcionat. Fes clic a «Consulta ara» per demanar-les a Dawarich a l'instant.",
  'help.guide.photo-location.tip.1': 'Els llocs que hagis fixat tu no es mouen mai.',
  'help.ctx.settings-plugins.bullet.1':
    '«Configuració dels connectors»: a sota, una targeta per a cada connector que necessita dades teves, amb els seus camps i «Desa». Un camp secret no es torna a mostrar un cop desat.',
  'help.guide.dashboard-widgets.step.3':
    '«Restableix els valors per defecte», sota les targetes, torna tota la pestanya «Aparença» a la configuració original.',
  'help.guide.web-push-device.result':
    "La targeta mostra «Activat en aquest dispositiu», i els esdeveniments activats a Push t'arriben encara que TREK estigui tancat.",
  'help.guide.connect-airtrail.step.1':
    'A «Integracions», busca AirTrail i introdueix la «URL de la instància» i una clau API. La clau es crea a AirTrail, a «Settings», «Security».',
  'help.guide.connect-dawarich.step.1':
    "A «Integracions», busca Dawarich i introdueix l'«Adreça de la instància» i la clau API que trobaràs a Dawarich, a «Account», «API key».",
  'help.guide.tour-connect-wanderer.step.1':
    'A «Integracions», busca wanderer i introdueix la «URL de la instància» i un token API. El token es crea a wanderer, a «Settings», «Account», «API tokens»; comença per wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal':
    'Fes que TREK comprovi en segon pla si els camins que has importat han canviat.',
  'help.guide.mcp-oauth.tip.3':
    "Els «Tokens d'API» encara funcionen, però estan marcats com a «Obsolet»; passa a un client OAuth.",
  'help.guide.offline-conflicts.tip.2': "L'opció només s'aplica a aquest dispositiu.",
  'help.guide.default-user-settings.tip.1':
    "El que hagi triat un usuari a «Configuració» sempre té prioritat; aquests valors s'apliquen a tothom qui no hagi canviat aquella opció.",
  'help.guide.own-routing-engine.step.1':
    "A «Mapa», dins de «Valors per defecte», introdueix l'adreça del teu servidor OSRM a «Motor de rutes propi».",
  'help.guide.admin-passkeys.tip.2':
    "Si més endavant canvies el domini, totes les claus d'accés que ja hagi afegit la gent deixaran de funcionar.",
  'help.guide.instance-keys.tip.4': "La clau d'Amap ha de ser una clau Web 服务 (servei web), no una clau de JS API.",
  'help.guide.rotate-jwt-secret.step.2': "Llegeix l'avís i fes clic a «Rota i tanca la sessió».",
  'help.guide.notification-defaults.tip.2': "Un valor per defecte només s'aplica a qui no hagi canviat aquella cel·la.",
  'help.ctx.notifications.bullet.5':
    'A «Configuració», dins de «Notificacions», tries quins esdeveniments reps aquí i quins reps per correu, webhook, ntfy o push.',
  'help.guide.read-notifications.result':
    'Ets a la pantalla a què feia referència la notificació, i el número de la campana baixa en un.',
  'help.guide.mark-notifications-read.title': 'Marcar les notificacions com a llegides',
  'help.guide.delete-notifications.goal': 'Mantén la llista curta eliminant el que ja no necessites.',
  'help.guide.notification-settings.step.1': 'Fes clic al teu nom, a dalt a la dreta.',
  'help.guide.public-link.step.5':
    "Pots canviar les opcions mentre l'enllaç existeixi. «Suprimeix l'enllaç» el desactiva.",
  'help.guide.link-journal.step.3':
    'Per a cada persona del viatge, tria «Sense accés», «Llegir» o «Edita». «Tothom pot llegir» i «Ningú» ho defineixen per a tothom alhora.',
  'help.guide.collapse-columns.tip.3': 'Quan el separador té el focus, també el pots moure amb les tecles de fletxa.',
  'help.guide.edit-place.tip.3':
    'Si fas clic fora del diàleg, no perds els canvis: TREK primer et pregunta «Vols descartar els canvis?», i «Continua editant» et torna al formulari.',
  'help.guide.dawarich-stays.goal':
    'Afegeix els llocs on Dawarich va enregistrar les teves estades durant el viatge, després de revisar-los un per un.',
  'help.guide.leave-stop-off-route.step.1':
    'Fes clic amb el botó dret a la parada, o fes clic als seus tres punts, i tria «Treu de la ruta».',
  'help.guide.move-booking-day.step.3':
    "Ara la fila apareix al nou dia, a la seva hora. Obre la reserva si també has de canviar l'hora.",
  'help.guide.place-image-from-file.goal':
    'Fes servir com a imatge del lloc una foto que ja és entre els seus fitxers, sense tornar-la a pujar.',
  'help.guide.place-image-from-file.tip.3': 'Només els viatgers que poden modificar llocs poden canviar la imatge.',
  'help.guide.place-own-hours.result':
    "La targeta mostra el teu telèfon, el teu correu electrònic i el teu horari, i l'anell al voltant de la imatge és verd o vermell segons el teu horari.",
  'help.guide.confirm-stay-booking.step.4':
    "Tanca la reserva amb la X de dalt a la dreta. A «Reserva», la targeta de l'estada ara mostra «Confirmat».",
  'help.guide.tour-map-lines.title': 'Trobar les teves excursions al mapa',
  'help.guide.tour-map-lines.tip.2':
    "Amagar una excursió només t'afecta a tu i es desa en aquest navegador per a aquest viatge: l'excursió, els seus dies i el seu color no canvien per a ningú. «Mostra-les totes», a sobre de la llista d'«Excursions», torna a mostrar totes les excursions amagades, i el mapa del telèfon sempre les mostra totes.",
  'help.guide.car-stops.step.4':
    "A «Parades pel camí», fes clic a «Afegeix una escala» per a cada lloc per on passa el trajecte i tria'l, amb una hora al costat si vols. Una parada sense cap lloc triat s'elimina en desar.",
  'help.guide.transport-details.step.2':
    "Les pastilles de la capçalera mostren l'estat, el tipus, el dia i el «Codi de reserva». Fes clic a la pastilla d'estat per canviar entre «Pendent» i «Confirmat». La petita icona de copiar de la pastilla del codi, «Copiar el codi de reserva», copia el codi al porta-retalls.",
  'help.guide.group-sort-bookings.step.3':
    "A «Ordena per», tria «Data», «Títol», «Tipus» o «Estat». La fila de sota inverteix l'ordre: «Més aviat primer» o «Més tard primer» per a les dates, «A a Z» o «De la Z a la A» per a la resta.",
  'help.guide.booking-on-map.title': 'Trobar una reserva al mapa',
  'help.guide.export-bookings-csv.tip.1':
    'Les columnes són «Tipus», «Títol», «Estat», «Inici», «Fi», «De», «A», «Ubicació», «Confirmació» i «Notes».',
  'help.guide.arrange-packing-list.tip.1':
    'Mentre «A a Z» està activat, no pots arrossegar articles, però sí llistes senceres.',
  'help.guide.count-packed-pieces.step.3':
    "Mentre només hi hagi algunes peces empaquetades, el comptador es mostra amb el teu color d'accent i la casella té un contorn d'aquest color. Fes clic al menys per treure una peça del recompte.",
  'help.guide.expense-receipts.step.5':
    "La vista prèvia mostra el rebut, amb «Obre en una pestanya nova» i «Baixa» a dalt. Si hi ha diversos rebuts, pots passar d'un a l'altre amb les tecles de fletxa, i Esc tanca la vista prèvia.",
  'help.guide.files-sync-settings.step.3':
    "Fes clic a «Configuració», sota la barra de flux, per veure la resta d'opcions.",
  'help.guide.manage-notes.step.3':
    '«Fixa», al mateix menú, manté la nota a dalt del panell, amb un marc del color de la seva categoria i una xinxeta al costat del títol. «Desfixa», al mateix menú, torna la nota a la seva posició normal.',
  'help.guide.note-categories.step.1':
    "Fes clic a l'engranatge del costat de «Nota nova», a la capçalera de la targeta «Notes». S'obre «Gestiona les categories», amb una fila per a cada categoria: el color, el nom, sis punts de color i una paperera.",
  'help.guide.note-categories.tip.2':
    "Una categoria sense notes només es desa al teu navegador. Els altres membres la veuen quan s'hi classifica alguna nota.",
  'help.guide.roadtrip-reorder.goal':
    "Canvia l'ordre del trajecte, o mou una parada a un altre dia, directament des del carril.",
  'help.guide.roadtrip-overnight.step.4':
    '«Troba allotjament», al costat, mostra el nom per copiar-lo i enllaços a webs de reserves: trivago o CHECK24 per a un hotel, PiNCAMP o Pitchup per a un càmping. Comprova el lloc, les dates i els hostes al web.',
  'help.guide.roadtrip-stop-fill.step.2':
    "A «Omple al», tria entre 50 i 100. La línia de sota els botons indica fins on pots arribar des d'aquí amb aquesta càrrega.",
  'help.guide.roadtrip-bookings.step.2':
    "Al carril, el trajecte és una targeta del color del seu tipus, amb l'horari a la columna d'arribada i els punts d'inici i de final sota el títol.",
  'help.guide.roadtrip-google-import.tip.1':
    'TREK calcula la seva pròpia ruta entre les parades; no copia la carretera de Google.',
  'help.guide.roadtrip-hazards.result':
    'El mapa mostra els avisos actuals a la zona del teu viatge, i la ruta no canvia.',
  'help.ctx.trip-tours.bullet.3':
    "Cada fila: la barra de color és la línia de l'excursió al mapa, la casella rodona mostra el límit de ruta (T1 a T6) o el tipus, una petita insígnia GPX o wanderer indica que és una importació, i les insígnies mostren els dies, el temps, la distància i el desnivell positiu. Una lluna amb un número indica quantes etapes té una excursió de diversos dies.",
  'help.guide.tour-show-list.step.3': "Fes clic a una fila. La targeta de l'excursió s'obre damunt del mapa.",
  'help.guide.tour-add-to-day.goal':
    'Planifica quan faràs una excursió perquè aparegui al dia, amb la seva línia al mapa.',
  'help.guide.tour-add-to-day.tip.3':
    'Només pots afegir una excursió una vegada a cada dia. Si la deixes anar en un dia que ja la té, TREK només mostra «Aquesta excursió ja és en aquest dia.».',
  'help.guide.tour-day-times.step.4':
    "Si l'excursió acaba després que comenci l'element següent del dia, una nota sota la fila t'ho indica, per exemple «Ends at 13:30, after Lunch at Gostner Schwaige starts at 12:30». No es mou res.",
  'help.guide.tour-remove-from-day.step.1':
    "A la columna de dies, passa el ratolí per la fila de l'excursió, fes clic a «Més opcions» i tria «Treure del dia».",
  'help.guide.tour-filter-list.step.1':
    "Fes clic al botó de filtre sota «Importa GPX o KML». Mostra l'estat pel qual filtra, al principi «Tots», amb el nombre d'excursions al costat.",
  'help.guide.tour-hide-on-map.title': "Amagar la línia d'una excursió al mapa",
  'help.guide.tour-import-plan-tab.title': 'Importar una traça des de la pestanya «Planificat»',
  'help.ctx.trip-tour-detail.title': "Detalls de l'excursió",
  'help.guide.tour-detail-read.goal':
    "Consulta tota la informació del viatge sobre una excursió: els dies, la distància i les altituds, el perfil i l'origen.",
  'help.guide.tour-detail-read.tip.1':
    'Una pastilla ambre «use with caution» vol dir que la importació té altituds o mesures incompletes. Tingues-ho en compte quan en consultis el desnivell i el perfil.',
  'help.guide.tour-rename-colour.step.1':
    "Obre la targeta de l'excursió i fes clic al llapis del costat del nom. El nom es converteix en un camp editable.",
  'help.guide.tour-take-along.goal':
    "Obtén indicacions fins a l'inici d'una excursió, obre'n la pàgina web o baixa'n la ruta com a fitxer GPX.",
  'help.guide.tour-take-along.result':
    "Tens el camí fins a l'inici a l'aplicació de mapes i tota la ruta en un fitxer GPX.",
  'help.guide.tour-copy-keep.tip.2':
    "«Desar a la col·lecció», al menú d'una excursió del pla del dia, obre aquest mateix diàleg, així que la ruta també s'hi desa.",
  'help.guide.tour-packing-link.step.3': 'Fes clic a «Vincula».',
  'help.guide.tour-files.goal':
    "Afegeix a l'excursió una reserva, un mapa o una descripció de la ruta, i torna-la a obrir des de la targeta de l'excursió.",
  'help.guide.tour-activity-link.goal':
    'Vincula una traça GPX enregistrada a una excursió planificada sense canviar-ne el pla.',
  'help.guide.tour-activity-link.tip.3':
    "«Temps emprat» va de la primera a l'última marca horària de la traça, pauses incloses.",
  'help.guide.tour-activity-compare.tip.1':
    '«Compara al mapa» només està disponible quan la targeta es mostra al costat del mapa, no al telèfon.',
  'help.guide.tour-origin-check.tip.1':
    "Una excursió agafada d'un altre viatge indica aquell viatge i l'excursió a «Agafada de».",
  'help.ctx.trip-tour-planner.bullet.3':
    "«Excursions d'aquest viatge», el carril de la dreta, mostra totes les excursions, amb el filtre i els «Totals del viatge» a sobre de la llista. Mentre hi ha una excursió oberta, el «Resum de l'excursió», a dalt, en mostra la distància, el desnivell, el temps i el perfil d'elevació. El més de dalt, «Afegeix una ruta», serveix per planificar, importar o agafar una excursió.",
  'help.guide.tour-open-workspace.step.3':
    "El carril de la dreta, «Excursions d'aquest viatge», mostra totes les excursions del viatge, amb el filtre i els «Totals del viatge» a sobre de la llista.",
  'help.guide.tour-open-workspace.result':
    "La pestanya «Excursions»: l'editor a l'esquerra, les excursions del viatge a la dreta i el mapa al mig.",
  'help.guide.tour-draw-route.step.6':
    "A «Punts de ruta», cada punt té una fila amb el seu número, que agafa el nom del lloc quan s'ha carregat. Mentre TREK treballa, un puntet al costat de «Nova excursió» n'indica l'estat.",
  'help.guide.tour-type-profile.step.1':
    "Fes clic a «Tipus de ruta», sota «Nom de l'excursió». Mostra el tipus actual amb una línia que explica com es planifica.",
  'help.guide.tour-edit-points.goal': "Canvia per on passa l'excursió movent-ne els punts al mapa o a la llista.",
  'help.guide.tour-edit-points.tip.2':
    'Una fila mostra les coordenades fins que es carrega el nom del lloc. «Desfer» i «Refer» no tenen drecera de teclat.',
  'help.guide.tour-shaping-points.tip.1': "L'inici i el final sempre són parades.",
  'help.guide.tour-loop-reverse.step.3':
    "Fes clic a «Inverteix el sentit», al costat, per fer tota l'excursió en sentit contrari.",
  'help.guide.tour-leg-by-hand.step.2':
    'El tram es converteix en una línia recta discontínua, i sota la fila la llista mostra «Dibuixat a mà, sense calcular», amb la seva longitud.',
  'help.guide.tour-trip-places.step.1':
    "Fes clic a «Llocs del viatge», al costat d'«Afegeix un punt», a «Punts de ruta». A sota apareixen els llocs del viatge.",
  'help.guide.tour-details-times.title': "Posar nom a l'excursió i planificar-ne el temps",
  'help.guide.tour-details-times.tip.3':
    "Fes clic a la fletxa del costat de «Detalls» per plegar-lo. S'obre automàticament quan algun dels seus camps té un valor que «Desa» no accepta.",
  'help.guide.tour-save.tip.1':
    "«Descartar», al costat de «Desa», descarta els canvis no desats després d'una confirmació. No modifica cap excursió desada.",
  'help.guide.tour-edit-saved.step.3':
    "Fes clic a «Desa». Apareix «Excursió desada», i l'excursió conserva els seus dies, fitxers i notes.",
  'help.guide.tour-summary-profile.step.1':
    "El «Resum de l'excursió», a dalt d'«Excursions d'aquest viatge», mostra la «Distància», el «Desnivell positiu» i el «Desnivell negatiu» de l'excursió oberta a l'editor, el temps estimat, les pauses i el total planificat.",
  'help.guide.tour-list-manage.title': 'Gestionar les excursions del viatge',
  'help.guide.tour-list-manage.tip.2':
    "Al menú del dia, els dies que ja tenen l'excursió apareixen en gris. En una excursió de diversos dies, TREK et pregunta si les etapes comencen aquell dia o si tota l'excursió va en aquell dia.",
  'help.guide.tour-delete.tip.2': "Si només la vols treure d'un dia, fes servir «Treure del dia» al menú del dia.",
  'help.guide.tour-saved-elsewhere.step.4':
    "Tria «Desa com a excursió nova» per conservar-les totes dues, «Carrega la més nova» per carregar l'altra versió, o «Sobreescriu» per substituir l'altra versió per la teva.",
  'help.ctx.trip-tour-import.bullet.3':
    "Una importació s'obre com a «Excursió GPX» o «Excursió de wanderer»: la seva línia, el «Resum de l'excursió» i el perfil d'elevació, exactament com s'han importat. La seva fila a la llista té la insígnia «Importació GPX».",
  'help.guide.tour-import-gpx.step.4':
    "A «Importa com a», comprova què són les traces. «Senderisme» ve predefinit. «Ruta en bicicleta» o «Córrer» demanen el perfil; «Ruta en piragua», l'embarcació i el tipus d'aigua, i «Esquí i hivern», la disciplina.",
  'help.guide.tour-view-import.title': 'Consultar una traça importada',
  'help.guide.tour-view-import.result':
    'Veus la traça enregistrada exactament com es va importar, sense res recalculat.',
  'help.guide.tour-plan-from-import.tip.2':
    "Si la targeta indica que el suggeriment s'allunya de la traça en trams llargs, revisa aquests trams al mapa abans de planificar amb ell.",
  'help.guide.tour-restore-recorded.step.3':
    "Confirma amb «Restaura la traça enregistrada». S'eliminen els punts de ruta i la línia calculada, i es mantenen els dies i les notes.",
  'help.guide.tour-take-over.step.3':
    "Busca l'excursió: escriu a «Cerca per nom» o filtra la llista amb els filtres «Viatge» i «Tipus».",
  'help.guide.tour-import-wanderer.title': 'Importar un camí de wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    "Un camí que ja és al viatge es marca com a «En aquest viatge» i ofereix «Obre l'excursió». Un camí que ha canviat des de la importació ofereix «Importa com a versió nova» al costat de l'antiga.",
  'help.ctx.trip-tour-map.bullet.4':
    "«Al llarg de la ruta», una targeta del panell de l'esquerra, busca miradors, fonts, refugis, llocs per menjar i més coses a prop de la ruta, i en mostra els resultats. Pots afegir un lloc de la llista a l'excursió com a parada.",
  'help.guide.tour-map-layers.tip.1':
    "El mapa que triïs es manté per a totes les excursions que obris fins que recarreguis la pàgina. Una excursió el tipus de la qual no l'ofereix s'obre amb «Mapa», i el mapa de la pestanya «Planificat» i l'opció de «Configuració» no canvien.",
  'help.guide.tour-along-search.step.4':
    "Fes clic a «Cerca al llarg de la ruta». TREK només busca: l'excursió no canvia.",
  'help.guide.tour-along-add-stop.step.1':
    "Fes clic a un lloc de la llista «Al llarg de la ruta», o a la seva xinxeta al mapa. La seva targeta s'obre sobre el mapa: què és, a quina distància és de la ruta i en quin punt de l'excursió es troba.",
  'help.guide.tour-3d-terrain.title': 'Veure una excursió en 3D',
  'help.guide.tour-3d-terrain.tip.1':
    "«Vista general», a la mateixa fila, torna a mostrar tota la ruta després d'haver mogut la vista.",
  'help.guide.tour-3d-flyover.step.4': "Fes clic a «Vista general» per tornar a veure tota l'excursió.",
  'help.guide.tour-map-overlays.step.2':
    "Fes clic a «Llegenda de pistes», el quadradet de punts de colors del costat de l'interruptor.",
  'help.ctx.trip-tour-stages.summary':
    'Una excursió de diversos dies és una sola ruta dividida en etapes, una per cada dia de marxa. Aquí defineixes on acaba cada dia, consultes les mesures de cada etapa i poses les etapes als dies del viatge.',
  'help.guide.tour-multi-day.step.1': "A «Excursions d'aquest viatge», fes clic a l'excursió per obrir-la a l'editor.",
  'help.guide.tour-multi-day.tip.3':
    "El temps d'una etapa no inclou les pauses. Un temps en el color d'avís, «Més d’un dia en moviment», dura més d'un dia.",
  'help.guide.tour-stages-on-days.step.4':
    "Fes clic al botó amb la lluna i el nombre d'etapes, «Mostra les etapes», per veure-les.",
  'help.ctx.trip-tour-hike.title': 'Caminades i curses',
  'help.guide.tour-hike-plan.title': 'Planificar una caminada amb un límit de dificultat',
  'help.guide.tour-hike-plan.result':
    "La caminada apareix a «Excursions d'aquest viatge» amb la distància, el desnivell i el temps a peu, llesta per posar-la en un dia.",
  'help.guide.tour-hike-trail-details.step.2':
    'Tria què vols veure: SAC per al grau de dificultat, «Ferm» o «Tipus de via». La ruta del mapa fa servir els mateixos colors que la llista.',
  'help.guide.tour-hike-round.title': "Trobar una caminada circular d'una llargada aproximada",
  'help.guide.tour-hike-round.tip.1':
    'Les voltes no superen la «Dificultat màxima del sender» de la caminada; la pastilla T de la targeta indica quina és.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Fes clic a «Fes servir aquest camí». TREK comprova amb el calculador de rutes que la ruta realment el segueix.',
  'help.guide.tour-ferrata-add.step.2':
    'Fes clic a una via ferrada al mapa, a la seva línia discontínua o al seu senyal. La seva targeta mostra el nom, el grau i la longitud.',
  'help.guide.tour-ferrata-add.tip.4':
    "«Mostra a OpenStreetMap», a la targeta, obre les dades de la via ferrada. La insígnia es torna ambre quan no es pot carregar res, i el text d'ajuda n'explica el motiu.",
  'help.guide.tour-run-plan.result':
    "La cursa apareix a «Excursions d'aquest viatge» amb el seu «Temps de cursa (previst)», i el perfil i el ritme es desen amb ella.",
  'help.guide.tour-run-ways.step.2':
    'Ara la part de dalt de la targeta mostra quina part de la cursa no està asfaltada i el camí amb el grau més difícil del recorregut.',
  'help.ctx.trip-tour-walk.bullet.2':
    "«Punts de ruta» mostra les parades en ordre. Un anell al voltant del número d'una parada la marca com a «Imprescindible» (continu) o «Opcional» (discontinu), un petit escut la marca com a «Protegida», i una pastilla sota el nom indica quanta estona t'hi estàs.",
  'help.guide.tour-walk-plan.step.3':
    'Passa el ratolí per una parada de «Punts de ruta», fes clic a «Més accions», al costat, i tria «Edita la parada».',
  'help.guide.tour-walk-sights.title': "Afegir punts d'interès a un passeig urbà",
  'help.guide.tour-walk-sights.tip.2':
    'Després de canviar la ruta, el botó mostra «Torna a cercar», perquè els llocs trobats corresponen a la ruta anterior.',
  'help.guide.tour-walk-day-times.step.4':
    "Sota cada parada veus quan hi arribes i quanta estona t'hi estàs. Apareix un avís quan un lloc és tancat a aquella hora o tanca durant l'estada.",
  'help.guide.tour-walk-google-import.step.1':
    "A «Excursions d'aquest viatge», fes clic a «Afegeix una ruta» (el + de dalt) i tria «Importa un passeig de Google Maps».",
  'help.guide.tour-walk-check-off.title': "Marcar les parades d'un passeig el mateix dia",
  'help.guide.tour-walk-check-off.tip.3':
    "Si poses un passeig en un dia sense connexió, el podràs marcar un cop s'hagi sincronitzat.",
  'help.guide.tour-bike-profile.title': 'Planificar una ruta en bicicleta segons com pedales',
  'help.guide.tour-bike-profile.result':
    "La ruta en bicicleta queda desada i apareix a «Excursions d'aquest viatge», calculada per al seu perfil i amb el temps de pedalada al «Resum de l'excursió».",
  'help.guide.tour-bike-surfaces.step.1':
    "A «Excursions d'aquest viatge», a la dreta, fes clic a una ruta en bicicleta per obrir-la. Quan se n'ha calculat la ruta, la targeta «Ferm i camins» apareix sota «Punts de ruta».",
  'help.guide.tour-bike-surfaces.tip.4':
    'Fes clic al títol de la targeta per plegar-la. Es manté plegada en aquest navegador encara que recarreguis la pàgina.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'On els cartògrafs han classificat les pujades, a sota apareix «Grau de pujada (mtb:scale:uphill)» amb les seves pròpies files.',
  'help.ctx.trip-tour-ski.bullet.4':
    "La targeta «Ruta per pistes», sota els punts de ruta, divideix el dia en «Esquiant», «En remuntadors», «En espera» i «A peu», amb la longitud de les pistes, el desnivell que baixes per les pistes i els viatges en remuntador. «Temps d’esquí», al «Resum de l'excursió» de la dreta, ho suma tot quan tots els trams estan planificats.",
  'help.guide.tour-ski-plan.step.5':
    'Sota cada punt, el seu tram es mostra en fitxes: cada pista, remuntador i tram a peu amb el seu nom o tipus, les pistes amb un punt del color del seu grau, i els minuts de cadascun.',
  'help.guide.tour-ski-options.goal':
    "Defineix les pistes més difícils, què prefereixes, el teu ritme i quins remuntadors vols fer servir, perquè els trams s'adaptin a tu.",
  'help.guide.tour-ski-options.tip.3':
    '«Evitar enllaços suposats» evita que la ruta passi per connexions que les dades del mapa només suposen, com ara un tram sense cartografiar entre dues pistes.',
  'help.guide.tour-ski-fix-leg.tip.2':
    "Mentre encara es baixen les dades de pistes d'una zona, el planificador espera i ho torna a provar automàticament.",
  'help.guide.tour-ski-summary.step.3':
    "Al «Resum de l'excursió» de la dreta, «Temps d’esquí» ho suma tot. El seu punt d'informació explica com es calcula.",
  'help.guide.tour-ski-pistes-layer.step.1':
    "Mentre hi ha oberta una excursió d'«Esquí i hivern», el mapa mostra les pistes automàticament. L'interruptor de la muntanya nevada, a la fila de baix a l'esquerra del mapa, les amaga i les torna a mostrar; el text d'ajuda diu «Pistes, circuits de fons i remuntadors».",
  'help.guide.tour-ski-import.goal':
    "Importa una traça enregistrada d'esquí, d'esquí de fons o de raquetes i assigna-li la disciplina correcta.",
  'help.guide.tour-ski-import.tip.2':
    "Per editar-la com una excursió planificada, fes servir «Planifica una versió editable» a la seva targeta «Versió editable». Els seus punts s'uneixen amb línies rectes.",
  'help.ctx.trip-tour-paddle.bullet.4':
    "«Estimació de temps» suma el temps a l'aigua, el transport per terra de l'embarcació, les sortides i els reembarcaments, les rescloses i les pauses, a partir de velocitats i minuts que pots modificar.",
  'help.guide.tour-paddle-setup.step.4':
    "A «Aigua», tria «Riu» o «Llac». No pots desar l'excursió fins que no hagis triat l'embarcació i el tipus d'aigua.",
  'help.guide.tour-paddle-setup.result':
    "Una nova ruta en piragua amb la seva embarcació, el seu tipus d'aigua i la seva velocitat, llesta per al primer punt al mapa.",
  'help.guide.tour-paddle-water-route.tip.1':
    "Quan falten les dades de l'aigua, TREK les baixa automàticament per a la regió o les demana a un administrador, segons com estigui configurada la instància. Aleshores el tram mostra «Loading the water data» i es planifica automàticament quan les dades hi són, normalment en un a tres minuts.",
  'help.guide.tour-paddle-portage.step.2':
    'Tria «Porta l’embarcació per terra des d’aquí». El tram fins al punt següent passa a ser un transport per terra, dibuixat per terra.',
  'help.guide.tour-paddle-lock.title': "Afegir una resclosa i el seu temps d'espera",
  'help.guide.tour-paddle-lock.tip.3': '«Elimina la resclosa» és a baix de la targeta oberta i a «Més accions».',
  'help.guide.tour-paddle-time.step.5':
    "Fins que totes les rescloses no tenen els seus temps, l'estimació mostra «Incompleta» i una nota sota les files indica què hi falta.",
  'help.guide.tour-paddle-wind.step.2':
    'Consulta la direcció del vent, el «Mitjà» i les «Ratxes». «Mitjà» és la mitjana horària més alta del dia, i «Ratxes», la ratxa més forta.',
  'help.guide.tour-paddle-checklist.title': "Revisar la llista d'obstacles",
  'help.guide.tour-paddle-checklist.tip.2':
    '«Portar per terra» no planifica automàticament cap transport per terra. Fes clic a «Planifica el transport per terra» per configurar-lo al mapa.',
  'help.guide.tour-paddle-track-marks.step.2':
    "A la «Previsualització de la importació», posa «Importa com a» a «Ruta en piragua» i després tria el «Vaixell» i l'«Aigua». La importació no pot continuar fins que no hagis triat totes dues coses.",
  'help.guide.tour-paddle-track-marks.tip.3':
    "En una traça enregistrada, la fila «Aigua» de l'«Estimació de temps» té una velocitat pròpia: fes-hi clic i escriu a quina velocitat vas remar.",
  'help.ctx.trip-tour-horse.bullet.5':
    "Una ruta a cavall importada d'un fitxer GPX es manté exactament com es va enregistrar, i la seva targeta «Ruta enregistrada» indica què no ha pogut calcular la importació.",
  'help.guide.tour-horse-plan.step.6':
    "Fes clic a «Agafa el tram». El tram s'afegeix a la ruta com una insígnia amb el nom de la ruta a la targeta «Punts de ruta». Afegeix més trams de la mateixa manera.",
  'help.guide.tour-horse-gap.title': 'Salvar un buit entre rutes eqüestres',
  'help.guide.tour-horse-gap.tip.2':
    "Els punts que marques al mapa s'afegeixen a la ruta de la mateixa manera, com a trams rectes sense comprovar.",
  'help.guide.tour-horse-recorded.result':
    'La ruta és al viatge exactament com la vas fer, amb la distància i les altituds del fitxer.',
  'help.guide.dateless-trip.step.3': 'Fes clic a «Crea un viatge nou».',
  'help.guide.trip-reminder.tip.2':
    "Un viatge nou té de sèrie un recordatori 3 dies abans de la sortida. Els canals per on t'arriba els tries a «Configuració», «Notificacions».",
  'help.guide.upcoming-reservations.result':
    "S'obre el viatge. Quan tornes al tauler, el giny continua mostrant el que ve a continuació.",
  'help.guide.entitlement.tip.2':
    'En un pla fusionat, cadascú té la seva fila, i també pots definir el dret dels altres.',
  'help.guide.half-company-holiday.step.3': 'Fes clic al dia. La meitat de la cel·la es torna ambre.',
  'help.guide.school-holidays.tip.2':
    "Passa el ratolí per un dia de vacances per veure'n el nom a «Vacances escolars».",
  'help.guide.answer-fusion-request.step.3':
    'Fes clic a «Accepta i fusiona» per unir els plans, o a «Rebutjar» per mantenir el teu pla per separat.',
  'help.guide.log-for-partner.step.3':
    'Fes clic als dies que vulguis registrar i després torna a fer clic al teu nom a «Persones».',
  'help.guide.dissolve-fusion.result':
    'Cadascú torna al seu propi pla amb les seves entrades, i «Persones» només et mostra a tu.',
  'help.guide.country-places.result': "El planificador s'obre amb el viatge al qual pertany el lloc.",
  'help.guide.tour-activity-stats.step.6':
    "Per a una excursió que no es va fer, fes clic a «Excloure», el botó rodó del final de la fila. L'excursió es queda a la llista, atenuada i marcada com a «Exclosa». El mateix botó, que ara diu «Torna a comptar», la torna a comptar.",
  'help.guide.move-to-list.tip.1':
    'Les etiquetes pertanyen a una sola llista, així que un lloc mogut o duplicat no té etiquetes a la llista nova.',
  'help.guide.accept-list-invite.step.1':
    "Busca la invitació a «Invitacions», al carril de llistes. Si has arribat des de la notificació d'invitació, la targeta és a dalt de la pàgina. Hi surt el nom de la llista i qui te la convida.",
  'help.guide.tour-collection-add-to-trip.tip.1':
    "La nova excursió encara no és a cap dia i no afegeix cap lloc. Ni la llista ni l'excursió original canvien.",
  'help.guide.tour-collection-manage.step.3':
    "Fes clic a la paperera del final de la fila de l'excursió i confirma amb «Treu de la col·lecció».",
  'help.ctx.journey-detail.bullet.7':
    "Amb Dawarich connectat, la capçalera d'un dia també mostra «Agafar l’enregistrament» (o la distància de la ruta desada per al dia) i «Incorporar el dia». En un dia amb estades «En espera», aquestes estades s'agrupen en una sola fila al final del dia.",
  'help.guide.entry-draft.tip.1':
    "Els col·laboradors continuen veient els esborranys. Només l'enllaç públic l'amaga fins que desactives «Esborrany».",
  'help.guide.journey-map-layers.tip.2':
    "Un interruptor atenuat encara no té res per mostrar, i el text d'ajuda n'explica el motiu. El que triïs es desa per a cada travessia en aquest navegador.",
  'help.guide.journey-keep-route.tip.2':
    'Més endavant, fes clic a la distància de la capçalera del dia per tornar a comparar-la amb Dawarich: «Substitueix» agafa la versió nova i «Treu la ruta» elimina la ruta del dia de la travessia.',
  'help.guide.journey-day-stays.tip.2':
    'Per a un dia atapeït, «Incorporar el dia», al final de la fila, gestiona totes les estades alhora.',
  'help.guide.journey-take-over-day.tip.1':
    'No es desa res fins que no fas clic a aquest botó, i res no es desa dues vegades: una estada que ja és al diari queda marcada i no es pot tornar a triar.',
  'help.guide.journey-auto-prepare.tip.1':
    "Només es preparen els dies de viatges vinculats que tenen dates, i no s'afegeix res al diari automàticament.",
  'help.guide.photo-location.result':
    'Una entrada sense lloc agafa la ubicació on es va fer la primera foto amb GPS, i apareix al mapa.',
  'help.guide.contributors.tip.2':
    "«A través de viatges» mostra les persones que hi tenen accés per un viatge vinculat. Canvia'n l'accés a la configuració d'aquell viatge, no aquí.",
  'help.ctx.settings-plugins.bullet.2':
    "Un connector pot afegir «Accions» a la seva targeta, que s'executen després de confirmar-les, i «Connecta» o «Desconnecta» quan inicia sessió en un altre servei en nom teu.",
  'help.guide.web-push-device.tip.1':
    "Push funciona per navegador: repeteix-ho a cada telèfon i ordinador on vulguis rebre notificacions. «Desactiva en aquest dispositiu» l'atura només en aquell dispositiu.",
  'help.guide.connect-airtrail.step.2':
    "«Permetre certificats autodirigits» només és per a una instància de confiança de la teva pròpia xarxa. «Sincronitzar els canvis cap a AirTrail» està desactivat per defecte, de manera que TREK només llegeix; activa'l per enviar-hi les teves modificacions.",
  'help.guide.connect-dawarich.step.2':
    '«Comprova automàticament si hi ha estades noves» fa que TREK ho comprovi pel seu compte. Si està desactivat, TREK només consulta Dawarich quan tu ho demanes. «Permet un certificat autosignat» només és per a una instància en què el teu servidor no confia.',
  'help.guide.tour-connect-wanderer.step.2':
    'Activa «Permet un certificat autosignat» només per a una instància de la teva pròpia xarxa.',
  'help.guide.tour-wanderer-watch.step.1':
    'A la targeta de wanderer, activa «Comprovar canvis en els meus camins». Abans cal tenir una connexió desada.',
  'help.guide.plugin-settings.title': 'Configurar un connector per a tu',
  'help.guide.default-user-settings.tip.2':
    '«Divisa de visualització» només converteix els imports per mostrar-los. Els imports introduïts a «Pressupost» no canvien.',
  'help.guide.own-routing-engine.step.2':
    "Per a rutes que evitin peatges, autopistes o ferris, introdueix l'adreça del teu Valhalla a «Instància Valhalla pròpia». Cada camp es desa en sortir-ne; després reinicia el servidor de TREK i recarrega la pàgina.",
  'help.guide.admin-passkeys.tip.3':
    "Si un usuari ha perdut el dispositiu amb les seves claus d'accés, elimina-les amb «Restablir claus d'accés» a «Editar usuari».",
  'help.guide.rotate-jwt-secret.result':
    'Hi ha un nou secret de signatura, i tots els usuaris, tu inclòs, han de tornar a iniciar sessió.',
  'help.guide.read-notifications.title': 'Llegir les notificacions',
  'help.guide.filter-notifications.title': 'Veure totes les notificacions o només les no llegides',
  'help.guide.mark-notifications-read.goal':
    'Treu el ressaltat i el número de la campana quan ja hagis vist les novetats.',
  'help.guide.delete-notifications.step.1':
    "Fes clic a «Elimina», la paperera del costat de l'hora d'una notificació, per eliminar només aquella.",
  'help.guide.notification-settings.step.2': 'Fes clic a «Configuració» al menú.',
  'help.guide.public-link.tip.3': "Passa el ratolí per sobre d'una opció per veure què amaga.",
  'help.guide.link-journal.step.4':
    'Llegeix la nota groga: indica qui tindrà accés al diari per primera vegada. Després fes clic a «Vincula el diari».',
  'help.guide.dawarich-stays.step.1':
    'Amb Dawarich connectat a «Configuració», «Integracions», a sobre de la llista de llocs apareix «Des de Dawarich». La capçalera indica quan ho va comprovar TREK per última vegada i quantes estades hi ha en espera. Fes-hi clic per obrir la llista.',
  'help.guide.leave-stop-off-route.step.2':
    'Al costat del nom apareix la insígnia «Fora de ruta». La parada es queda al dia i al mapa, però la ruta del dia i els temps dels trams no la tenen en compte.',
  'help.guide.move-booking-day.result': "La reserva passa a ser del nou dia al pla, i l'hora no canvia.",
  'help.guide.clear-day.tip.2': 'Aquesta opció del menú només apareix en dies que tenen llocs.',
  'help.guide.place-image-from-file.step.1':
    'Obre un lloc que tingui una foto entre els seus «Fitxers». El bloc «Fitxers», a prop de la part de baix de la targeta, indica quants fitxers té el lloc.',
  'help.guide.place-own-hours.title': "Corregir l'horari, el telèfon o el correu d'un lloc",
  'help.guide.place-own-hours.tip.1':
    "L'horari que introdueixes substitueix el que havia consultat TREK, així que una cafeteria amb horari de temporada mostra el que tu saps.",
  'help.guide.day-panel.tip.3':
    'Planifiques amb el calendari? Activa «Data primer als títols dels dies» a «Configuració», dins de «Pantalla», i la capçalera mostrarà primer la data, amb «Dia 1» o el nom del dia a sota.',
  'help.guide.confirm-stay-booking.result':
    "La reserva d'hotel queda confirmada, tant a la targeta de l'estada com a la pestanya «Reserves».",
  'help.guide.tour-map-lines.goal':
    "Distingeix les excursions del viatge al mapa, obre'n una des de la seva línia i amaga les que ara no necessites.",
  'help.guide.tour-map-lines.tip.3':
    "«Treu de la ruta», al menú de la fila de l'excursió al pla del dia, fa que la ruta del dia deixi d'anar a l'inici i al final de l'excursió. «Torna a afegir a la ruta» els torna a connectar.",
  'help.guide.car-stops.step.5':
    "L'ordre de les parades defineix la ruta. «Puja» i «Baixa», a l'esquerra d'una parada, el canvien, i «Elimina la parada», la creu de la dreta, la treu.",
  'help.guide.transport-details.step.3':
    "Les caselles de sota mostren la sortida i l'arribada amb les estacions o els aeroports, i després l'andana i el seient si s'han indicat. Un trajecte amb parades intermèdies les mostra a «Ruta», i un de reservat per trams mostra el codi de cada tram a «Codis per tram». Després hi ha «Viatgers», «Notes», «Pressupost» i «Fitxers»; «Mostrar als fitxers» obre el bitllet a la pestanya «Fitxers».",
  'help.guide.export-transports-csv.title': 'Exportar els transports com a full de càlcul',
  'help.guide.group-sort-bookings.step.4':
    "Fes clic al títol d'una secció per plegar-la. El número del costat indica quantes reserves conté, i amb un segon clic es torna a obrir.",
  'help.guide.booking-on-map.goal': "Salta d'una reserva al lloc on és al pla i al mapa.",
  'help.guide.export-bookings-csv.tip.2':
    'Les columnes van separades per punt i coma, i Excel obre el fitxer amb els accents intactes.',
  'help.guide.arrange-packing-list.tip.2':
    "TREK recorda «A a Z» en aquest navegador, de manera que la propera vegada la llista també s'obre ordenada. Només canvia el que veus tu, mai l'ordre que veuen els altres.",
  'help.guide.count-packed-pieces.step.4':
    "Quan el comptador arriba a la quantitat, l'article es marca automàticament i compta com a empaquetat.",
  'help.guide.expense-receipts.result':
    "El rebut es desa amb la despesa: la fitxa de la fila l'obre, i el fitxer també és als «Fitxers» del viatge.",
  'help.guide.files-sync-settings.step.4':
    "A «Quan s’elimina un document», tria què passa amb la còpia de l'altra banda. «Conserva les dues còpies» deixa la còpia del gestor on és. «Mou a la paperera» l'envia a la paperera del gestor quan el document s'elimina a TREK.",
  'help.ctx.trip-collab.bullet.7':
    'Tot el que hi ha aquí necessita connexió. Sense connexió, no es desa cap missatge, nota, enllaç, enquesta ni vot, i TREK mostra «This needs a connection. Try again once TREK is back online.». Els membres que no poden editar «Col·laboració» ho poden llegir tot, però no tenen «Nota nova», «Afegeix un enllaç» ni «Enquesta nova», i el quadre de missatges els apareix en gris.',
  'help.guide.manage-notes.step.4':
    '«Edita» obre el diàleg de la nota amb tot omplert. Canvia el que calgui, en aquest cas una línia més a «Contingut», i fes clic a «Desa».',
  'help.guide.note-categories.step.2':
    'Escriu un nom a «Categoria nova...», a baix, i prem Retorn o fes clic al més del costat. La nova categoria rep el color següent i una fila pròpia.',
  'help.guide.note-categories.tip.3':
    "En una targeta, la categoria només és el punt de color de la capçalera. Passa el ratolí per sobre del punt per veure'n el nom.",
  'help.guide.roadtrip-reorder.step.1':
    "Arrossega una parada per la fila i deixa-la anar sobre una altra parada del mateix dia. N'ocupa el lloc, i la ruta del dia es torna a calcular amb el nou ordre.",
  'help.guide.roadtrip-overnight.step.5':
    "Fes clic a «Afegir». La nit queda reservada d'aquest dia al següent, i el lloc s'afegeix al trajecte com la nit d'aquell dia.",
  'help.guide.roadtrip-stop-fill.step.3':
    'Per tornar a fer servir la teva configuració en aquesta parada, torna a obrir la insígnia i fes clic a «Usa el meu valor per defecte».',
  'help.guide.roadtrip-bookings.step.3':
    "La pastilla «Registre d'entrada» o «Embarcament» indica a quina hora com a màxim t'ha de deixar el trajecte a la terminal: la sortida s'avança aquest temps respecte de l'horari.",
  'help.guide.roadtrip-google-import.title': 'Importar una ruta de Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    "L'enllaç ha de tenir com a mínim dues parades que TREK pugui situar, i com a màxim 30.",
  'help.guide.roadtrip-hazards.tip.1':
    'Els avisos no són talls de carretera: la ruta no canvia mai per culpa seva, i són avisos actuals, no una previsió per a les teves dates.',
  'help.ctx.trip-tours.bullet.4':
    "Passa el ratolí per una fila per veure'n l'ull («Amaga al mapa») i el + rodó («Afegeix al dia»). Arrossega una fila fins a un dia de la columna de l'esquerra per planificar-la allà, o fes-hi clic per obrir la targeta de l'excursió sobre el mapa.",
  'help.guide.tour-show-list.step.4':
    "La targeta mostra les mesures de l'excursió i, a «Dies del viatge», els dies en què és. Per canviar la ruta mateixa, obre la pestanya «Excursions» i fes clic a l'excursió a «Excursions d'aquest viatge».",
  'help.guide.tour-add-to-day.step.1':
    "Passa el ratolí per sobre de l'excursió a la llista i fes clic al + rodó de la dreta de la fila («Afegeix al dia»).",
  'help.guide.tour-add-to-day.tip.4':
    "Amb un dia obert (fes clic a la seva capçalera), la targeta de l'excursió també ofereix «Afegeix al dia» per a aquell dia. La fletxa de desfer de sobre els dies desfà l'assignació.",
  'help.guide.tour-day-times.tip.1': 'Una hora de final que introdueixis substitueix la calculada.',
  'help.guide.tour-remove-from-day.step.2':
    "L'excursió es queda a la llista de la dreta. Ja no té la insígnia «Dia», i el filtre la torna a comptar a «Sense planificar».",
  'help.guide.tour-filter-list.step.2':
    'A «Estat», tria «Sense planificar» per a les excursions que encara no tenen dia, o «Planificat» per a les que ja en tenen. Cada línia indica quantes excursions hi coincideixen.',
  'help.guide.tour-hide-on-map.goal':
    'Amaga del mapa les excursions que ara no necessites, sense canviar-les per a ningú.',
  'help.guide.tour-import-plan-tab.goal': 'Importa una traça GPX o KML com a excursió mentre planifiques els dies.',
  'help.ctx.trip-tour-detail.summary':
    "La targeta que s'obre sobre el mapa quan tries una excursió a la pestanya «Planificat»: els seus dies, les mesures i el perfil, d'on prové, i els botons per enviar-la al telèfon, copiar-la, desar-la en una col·lecció o vincular-la a la llista d'equipatge.",
  'help.guide.tour-detail-read.step.1':
    "A dalt de la columna de la dreta, canvia de «Llocs» a «Excursions» i després fes clic a una excursió. La seva targeta s'obre sobre el mapa. La seva fila dins d'un dia, o la seva línia al mapa, obren la mateixa targeta.",
  'help.guide.tour-detail-read.tip.2':
    'Una ruta en piragua no mostra altituds ni perfil: els punts són a les ribes, així que les altituds no serien correctes.',
  'help.guide.tour-rename-colour.step.2':
    'Escriu el nom nou i fes clic al botó rodó de confirmació, o prem Retorn. Esc manté el nom anterior.',
  'help.guide.tour-take-along.step.1':
    "Obre la targeta de l'excursió. «Navegació», a baix de la targeta, obre l'inici de l'excursió en una aplicació de mapes, i si n'hi ha diverses, primer te les mostra. Et porta fins a l'inici, no pel recorregut.",
  'help.guide.tour-copy-keep.title': 'Copiar una excursió o desar-la en una col·lecció',
  'help.guide.tour-copy-keep.tip.3':
    "A la pestanya «Excursions», el marcador de dalt de la columna de l'esquerra fa el mateix per a l'excursió oberta. Si té canvis sense desar, primer et demana que la desis.",
  'help.guide.tour-packing-link.step.4':
    'Ara la targeta mostra la llista, quants dels seus articles estan empaquetats, una barra i els primers articles. Els empaquetats apareixen ratllats.',
  'help.guide.tour-files.step.1':
    "Obre la targeta de l'excursió i desplaça't fins a «Fitxers», al final. Fes clic a «Pujar», a la capçalera de la secció, i tria un o més fitxers.",
  'help.guide.tour-activity-link.step.1':
    "Obre la targeta de l'excursió planificada i desplaça't fins a «Traç real». Fes clic a «Afegeix el traç real».",
  'help.guide.tour-activity-link.result':
    "La traça queda vinculada a l'excursió, i la targeta mostra el pla i el que vas fer un al costat de l'altre.",
  'help.guide.tour-activity-compare.tip.2':
    "Les excursions fetes de l'«Atles» compten la traça vinculada en lloc dels valors planificats.",
  'help.guide.tour-origin-check.tip.2':
    "Una excursió de wanderer té una fletxa al costat de l'origen, «Obre a wanderer», i «Comprova la font» a la capçalera de la secció. La comprovació pregunta a wanderer si el camí ha canviat des de la importació. Aleshores, «Importa com a nova instantània» importa la versió nova com una excursió a part. Aquesta excursió conserva els seus dies i notes.",
  'help.ctx.trip-tour-planner.bullet.4':
    'Mentre «Afegeix un punt» està activat («Posar punts» a la pastilla del mapa), un clic al mapa hi posa un punt. Arrossega una xinxeta per moure-la, fes clic a la ruta dibuixada per afegir-hi un punt de forma i tria un lloc del viatge amb «Llocs del viatge».',
  'help.guide.tour-open-workspace.step.4':
    "El més de dalt del carril de la dreta, «Afegeix una ruta», ofereix «Importa GPX o KML», «Importa un passeig de Google Maps» i «Agafar una ruta d'un altre viatge». Si hi ha una excursió oberta, també hi ha «Planifica una nova excursió».",
  'help.guide.tour-draw-route.title': 'Dibuixar una excursió nova',
  'help.guide.tour-draw-route.tip.1':
    "Mentre «Posar punts» està activat, el punter és una creu. Desactiva'l per arrossegar el mapa sense afegir punts. En 3D comença desactivat, perquè en 3D arrossegues el mapa per mirar al voltant.",
  'help.guide.tour-type-profile.step.2':
    'Tria el tipus a la llista: «Senderisme», «Passeig urbà / turístic», «Córrer», «Ruta en bicicleta», «Ruta en piragua», «Ruta a cavall» o «Esquí i hivern». Cadascun explica què planifica, i en canviar de tipus la ruta es torna a planificar.',
  'help.guide.tour-edit-points.step.1':
    'Arrossega una xinxeta numerada del mapa fins on ha de ser el punt. La ruta es torna a planificar passant pel nou punt.',
  'help.guide.tour-edit-points.result':
    "Els punts són on vols i en l'ordre que vols, i la ruta s'ha tornat a planificar.",
  'help.guide.tour-shaping-points.tip.2':
    "Un punt de forma no pot ser el final d'una etapa d'una excursió de diversos dies.",
  'help.guide.tour-loop-reverse.tip.1':
    "Quan l'excursió ja és circular, «Torna a l’inici» diu «La ruta ja torna a l’inici».",
  'help.guide.tour-leg-by-hand.step.3':
    'Perquè el calculador de rutes el torni a planificar, obre el mateix menú i tria «Torna a calcular el tram següent».',
  'help.guide.tour-trip-places.step.2':
    'Busca a «Cerca als llocs del viatge», o mira a «A prop de l’excursió»: els llocs a menys de dos quilòmetres de la ruta, del més proper al més llunyà, cadascun amb la seva distància.',
  'help.guide.tour-details-times.goal':
    "Posa a l'excursió un nom, una descripció i un enllaç, i afegeix pauses al temps previst.",
  'help.guide.tour-details-times.result': "Ara l'excursió té el seu nom, les seves notes i el temps que hi preveus.",
  'help.guide.tour-save.tip.2':
    "«Torna a excursions», a dalt del carril, tanca l'editor, i abans et pregunta si hi ha canvis sense desar.",
  'help.guide.tour-edit-saved.step.4':
    "Fes clic a «Torna a excursions» per tancar-la. Si hi ha canvis sense desar, abans pregunta «Vols descartar els canvis sense desar de l'excursió?».",
  'help.guide.tour-summary-profile.step.2': "El punt d'informació del costat del temps estimat explica com es calcula.",
  'help.guide.tour-list-manage.goal':
    "Consulta els totals de les excursions del viatge, posa'n una en un dia i filtra la llista per veure el que necessites.",
  'help.guide.tour-list-manage.tip.3':
    "La paperera d'una fila elimina l'excursió. La pestanya «Planificat» mostra les mateixes excursions quan la columna de la dreta està a «Excursions».",
  'help.guide.tour-delete.tip.3':
    "Les excursions s'eliminen aquí, a la pestanya «Excursions». La paperera només apareix als viatgers que poden editar els llocs del viatge.",
  'help.guide.tour-saved-elsewhere.tip.1':
    "«Desa com a excursió nova» posa a la teva còpia el nom de l'excursió seguit de (my version).",
  'help.ctx.trip-tour-import.bullet.4':
    "«Versió editable» converteix una importació en una excursió amb punts de ruta que pots moure. «Substitueix la importació» conserva la traça enregistrada, i la targeta «Traça enregistrada» de l'editor et permet tornar-hi.",
  'help.guide.tour-import-gpx.step.5':
    'Fes clic a «Importa 1 excursió» (o «Importa 3 excursions» si el fitxer té tres traces).',
  'help.guide.tour-view-import.goal':
    "Consulta el recorregut, les mesures i l'altitud d'una excursió importada tal com s'ha importat.",
  'help.guide.tour-plan-from-import.title': "Planificar una excursió editable a partir d'una importació",
  'help.guide.tour-plan-from-import.tip.3':
    "Una importació de piragua o d'esquí no es calcula pels camins: els seus punts s'uneixen amb línies rectes.",
  'help.guide.tour-restore-recorded.tip.1':
    "La targeta només apareix en una excursió que s'ha substituït amb «Substitueix la importació» i que després s'ha desat.",
  'help.guide.tour-take-over.step.4':
    "Fes clic a l'excursió. A la dreta en veuràs la línia, les mesures i el viatge d'on prové.",
  'help.guide.tour-import-wanderer.goal': 'Importa al viatge, com a excursió, un dels camins del teu propi wanderer.',
  'help.guide.tour-import-wanderer.tip.4': '«Obre a wanderer» obre el camí a la teva instància.',
  'help.ctx.trip-tour-map.bullet.5':
    "En 3D, la ruta es mostra sobre el relleu, acolorida segons el pendent, amb una llegenda que en resumeix els pendents i un sobrevol que la recorre de l'inici al final.",
  'help.guide.tour-map-layers.tip.2':
    "«Excursionisme» i «Bicicleta» provenen de servidors de voluntaris i només estan disponibles si l'administrador ho permet. Quan un deixa de respondre, el seu segment mostra un ! i pots canviar a un altre mapa; l'excursió no canvia.",
  'help.guide.tour-along-search.step.5':
    'Els llocs trobats apareixen a la llista amb la distància a la ruta i es dibuixen al mapa amb el seu color. Una estrella marca els més coneguts, i «A l’excursió», els que ja són una parada. Ara el botó diu «Torna a cercar».',
  'help.guide.tour-along-add-stop.step.2':
    '«On va» proposa el tram on encaixa millor el lloc. Fes-hi clic per triar entre quines dues parades va, o «Com a nou final». El mapa mostra la nova ruta amb una línia discontínua abans de canviar res.',
  'help.guide.tour-3d-terrain.goal': "Mira l'excursió sobre el relleu real, acolorida segons el pendent.",
  'help.guide.tour-3d-terrain.tip.2':
    "En 3D també es fa servir el mapa que has triat, i també s'hi veuen les vies ferrades, les pistes i les marques nàutiques. Mentre edites una excursió, pots arrossegar-ne els punts sobre el relleu, i amb «Posar punts» activat, un clic n'afegeix un.",
  'help.guide.tour-3d-flyover.result':
    "Has vist l'excursió des de l'aire, de l'inici al final, a la velocitat que has triat.",
  'help.guide.tour-map-overlays.step.3':
    'La llegenda explica què vol dir cada color: les pistes de baixada, de «Principiant» a «Freeride», «Circuits d’esquí de fons», «Senders d’hivern i de raquetes», «Pistes de trineu» i «Remuntadors». «Llegenda completa a OpenSnowMap» mostra tots els símbols. Prem Esc per tancar-la.',
  'help.ctx.trip-tour-stages.bullet.1':
    "«Dies», a l'editor, converteix l'excursió oberta en una excursió d'«Un dia» o de «Diversos dies». Si tornes a una excursió d'un dia, s'eliminen tots els finals d'etapa un cop ho confirmes, i la ruta no canvia.",
  'help.guide.tour-multi-day.step.2':
    "A «Dies», fes clic a «Diversos dies». Una nota indica on s'ha posat el final de la primera etapa.",
  'help.guide.tour-multi-day.tip.4':
    "Les etapes es desen quan fas clic a «Desa». Si un canvi elimina una etapa que és en un dia del viatge, un avís t'indica que en desar es traurà d'aquell dia.",
  'help.guide.tour-stages-on-days.step.5':
    "Cada etapa mostra el dia en què és. Fes clic al dia per moure l'etapa a un altre dia, o tria «Sense dia» per treure-la'n.",
  'help.ctx.trip-tour-hike.summary':
    "Una caminada o una cursa oberta a la pestanya «Excursions»: l'editor a l'esquerra, el mapa al mig, i el resum de l'excursió i les altres excursions del viatge a la dreta. Una caminada no supera la dificultat de sender que permets, una cursa es calcula segons el teu ritme, i totes dues mostren el que OpenStreetMap té registrat pel camí.",
  'help.guide.tour-hike-plan.goal':
    'Comença una caminada, defineix-ne les parades, tria el grau de sender més difícil que pot fer servir la ruta i desa-la.',
  'help.guide.tour-hike-plan.tip.1':
    'Una caminada nova comença amb T2 («Senderisme de muntanya»). T3 hi afegeix un avís: aquests camins poden ser exposats i demanen pas segur i no patir de vertigen.',
  'help.guide.tour-hike-trail-details.step.3':
    'Les insígnies ho resumeixen: quina part de la ruta és «Conegut», el grau «Màxim conegut» i, a part, el «Límit de ruta» amb què es va planificar la caminada.',
  'help.guide.tour-hike-round.goal':
    "Fes que TREK et proposi voltes de la llargada que vulguis, a partir d'una parada d'una caminada.",
  'help.guide.tour-hike-round.tip.2':
    "S'accepten distàncies d'1 a 60 km, i es proposen voltes que no s'allunyin més d'un 20 % de la teva.",
  'help.guide.tour-hike-compare-ways.result':
    'Aquell tram segueix el camí que has triat, i la resta de la caminada es queda com estava. «Camí adoptat», a baix del mapa, té «Desfer».',
  'help.guide.tour-ferrata-add.step.3':
    "Fes clic a «Afegeix a la ruta». La via ferrada s'afegeix al final de la ruta com un tram propi, amb un punt a cada extrem.",
  'help.guide.tour-run-plan.title': 'Planificar una cursa al teu ritme',
  'help.guide.tour-run-plan.tip.1': 'Sense ritme, no es pot desar la cursa.',
  'help.guide.tour-run-ways.step.3':
    'Fes clic a «Ferm» i després a un ferm de la llista per dibuixar al mapa només aquells trams.',
  'help.ctx.trip-tour-walk.bullet.3':
    "Quan el passeig és en un dia amb hora d'inici, «Horaris per a», a dalt de «Punts de ruta», mostra aquell dia, i cada parada indica l'hora d'arribada, l'estada i què diu el seu horari d'obertura.",
  'help.guide.tour-walk-plan.step.4':
    "Posa a la parada una «Etiqueta» i una «Estada en minuts». Deixa l'estada buida mentre no la sàpigues, i posa 0 per a un punt pel qual només passes.",
  'help.guide.tour-walk-sights.goal': 'Tria un tema, busca al llarg del passeig i afegeix un lloc com a parada.',
  'help.guide.tour-walk-sights.tip.3':
    "Els horaris i els llocs web provenen de la font, sobretot d'OpenStreetMap. Comprova'ls abans d'anar-hi.",
  'help.guide.tour-walk-day-times.tip.1':
    "Sense hora d'inici, la línia ho indica: «Give the walk a time on this day to see arrivals and opening hours».",
  'help.guide.tour-walk-google-import.step.2':
    "Enganxa l'enllaç a «Enllaç a la ruta a peu» i fes clic a «Llegeix l'enllaç».",
  'help.guide.tour-walk-check-off.goal':
    'Marca les parades com a visitades o saltades durant el dia i mira quant et queda per caminar.',
  'help.guide.tour-walk-check-off.result':
    'Les parades visitades queden marcades, les saltades, ratllades, i el temps restant només compta el que encara tens per davant.',
  'help.guide.tour-bike-profile.goal':
    'Comença una ruta en bicicleta i fes que TREK la calculi per a cicloturisme, carretera, grava o BTT.',
  'help.guide.tour-bike-profile.tip.1':
    'Si després canvies el perfil, tota la ruta es torna a planificar segons el nou perfil.',
  'help.guide.tour-bike-surfaces.step.2':
    'La insígnia de la capçalera de la targeta indica quina part de la ruta se sap que no està asfaltada.',
  'help.guide.tour-bike-mtb-grades.title': "Comprovar els graus dels camins d'una ruta de BTT",
  'help.guide.tour-bike-mtb-grades.tip.3':
    "Si no s'han pogut llegir els graus, la targeta t'ho indica. Fes clic a «Torna-ho a provar».",
  'help.ctx.trip-tour-ski.bullet.5':
    "Mentre hi ha oberta una excursió d'«Esquí i hivern», el mapa mostra les pistes d'OpenSnowMap, amb «Llegenda de pistes» al costat del seu interruptor. Tot són dades cartogràfiques: res d'això no indica si una pista o un remuntador és obert, com està la neu ni res sobre allaus.",
  'help.guide.tour-ski-plan.step.6': "Posa un nom a l'excursió a «Nom de l'excursió» i fes clic a «Desa».",
  'help.guide.tour-ski-options.step.1':
    "En una excursió d'«Esquí i hivern», les opcions del calculador de rutes són sota la «Disciplina». Només veus les que fa servir la teva disciplina: per exemple, «Esquí de fons» no té «Pistes més difícils».",
  'help.guide.tour-ski-options.result':
    "L'excursió es torna a planificar dins dels teus límits, i la targeta «Ruta per pistes» mostra les pistes més difícils que ha evitat.",
  'help.guide.tour-ski-fix-leg.tip.3':
    "Sense connexió, de moment els trams es dibuixen rectes. Una fila grisa sobre camins d'estiu és una nota, no un error.",
  'help.guide.tour-ski-summary.tip.1':
    '«Evitades» mostra les pistes més difícils que el calculador ha evitat pel teu límit de «Pistes més difícils».',
  'help.guide.tour-ski-pistes-layer.step.2':
    "Fes clic a «Llegenda de pistes», el botó amb quatre punts de colors al costat de l'interruptor.",
  'help.guide.tour-ski-import.step.1':
    "A la pestanya «Excursions», fes clic a «Afegeix una ruta» (el més de sobre «Excursions d'aquest viatge»), tria «Importa GPX o KML» i selecciona el fitxer.",
  'help.guide.tour-ski-import.tip.3':
    'També pots deixar anar fitxers GPX, KML o KMZ a qualsevol punt de la pestanya «Excursions» per obrir la mateixa previsualització.',
  'help.ctx.trip-tour-paddle.bullet.5':
    "«Vent» mostra la previsió a l'inici de l'excursió per al dia en què està planificada. «Llista de comprovació» mostra els obstacles de la ruta desada i què has decidit per a cadascun.",
  'help.guide.tour-paddle-setup.step.5':
    'En un llac, «Pels llacs» defineix la ruta: «En línia recta» és la més curta, i «A prop de la riba» va arran de la vora per als dies de vent.',
  'help.guide.tour-paddle-water-route.title': "Planificar els trams per l'aigua",
  'help.guide.tour-paddle-water-route.tip.2':
    "On la ruta porta l'embarcació per terra per esquivar un assut o passa per una resclosa, TREK hi posa un punt propi, marcat com a «Detectat». Si el mous o el modifiques, passa a ser un punt teu.",
  'help.guide.tour-paddle-portage.step.3':
    'Sota el punt apareix una targeta «Transport per terra» amb la seva longitud i els minuts addicionals. Fes-hi clic per obrir-la.',
  'help.guide.tour-paddle-lock.goal':
    "Afegeix una resclosa a l'excursió i inclou l'espera i el pas en el temps previst.",
  'help.guide.tour-paddle-lock.result':
    "La resclosa és a l'excursió amb els seus minuts, i l'«Estimació de temps» els suma.",
  'help.guide.tour-paddle-time.tip.1':
    "TREK comença amb 4 km/h a l'aigua, 2 km/h en el transport per terra i 10 minuts a cada transport per terra. Són valors inicials per ajustar, no mesures.",
  'help.guide.tour-paddle-wind.step.3':
    "Les barres mostren les hores del dia, amb les ratxes darrere del vent mitjà. Passa el ratolí per sobre d'una barra per veure les dades i la direcció d'aquella hora.",
  'help.guide.tour-paddle-checklist.goal':
    "Consulta què se sap dels assuts, les rescloses i les normes d'accés d'una ruta desada, i decideix què fas a cada lloc.",
  'help.guide.tour-paddle-checklist.tip.3':
    "Una entrada marcada amb «Tornar a comprovar» es va decidir abans que canviés la ruta o les dades. Torna-la a decidir, o tria «Mantén la decisió» o «Elimina la decisió». Les decisions que ja no s'apliquen apareixen a «Decisions anteriors».",
  'help.guide.tour-paddle-track-marks.step.3': 'Fes clic a «Importa 1 excursió».',
  'help.guide.tour-paddle-track-marks.result':
    'La traça enregistrada inclou els seus transports per terra i les rescloses, i la seva «Estimació de temps» els té en compte.',
  'help.guide.tour-horse-plan.title': 'Planificar una ruta a cavall per itineraris eqüestres',
  'help.guide.tour-horse-plan.step.7':
    "Posa un nom a la ruta a «Nom de l'excursió» i després fes clic a «Desa», a baix de la columna de l'esquerra.",
  'help.guide.tour-horse-gap.goal': 'Continua amb un tram que comença lluny del final de la teva ruta.',
  'help.guide.tour-horse-gap.tip.3':
    "Un tram que comença a menys de 25 m del final de la teva ruta continua directament des d'allà, i «Enllaç amb la teva ruta» diu «Enllaça amb el final de la teva ruta».",
  'help.guide.tour-horse-recorded.tip.1':
    'La línia es manté exactament com la va enregistrar el fitxer. No es torna a calcular res, i una ruta enregistrada no té versió editable.',
  'help.guide.dateless-trip.result':
    "La targeta mostra «Idea» i «Sense dates», i el viatge té tants dies buits com n'has demanat.",
  'help.guide.trip-reminder.title': "Rebre un recordatori abans d'un viatge",
  'help.guide.upcoming-reservations.tip.1':
    "Una estada d'hotel apareix dues vegades: una per a l'entrada i una altra per a la sortida.",
  'help.guide.half-company-holiday.result':
    "L'empresa fa festa mitja jornada, i un dia de vacances registrat aquell dia només compta com a mig dia.",
  'help.guide.edit-holiday-calendar.title': 'Canviar o eliminar un calendari de festius',
  'help.guide.answer-fusion-request.result':
    "Després d'«Accepta i fusiona», els dos plans es mostren en una sola graella, cada persona amb el seu color.",
  'help.guide.log-for-partner.result':
    "Els dies es mostren amb el color de l'altra persona i es descompten del seu dret, no del teu.",
  'help.guide.dissolve-fusion.tip.1':
    '«Cancel·la», en aquesta finestra, deixa el pla com està; les teves entrades es conserven en tots dos casos.',
  'help.guide.country-places.tip.1':
    "Un lloc que surt en un país equivocat sol tenir una adreça o unes coordenades errònies. Obre el viatge des d'aquí i corregeix-hi el lloc.",
  'help.guide.tour-activity-stats.title': 'Veure què has fet a les teves excursions',
  'help.guide.tour-activity-stats.result':
    "Les sumes del diàleg i de la pestanya «Excursions» ja no inclouen l'excursió que has exclòs. La ruta, els dies i el viatge no canvien.",
  'help.guide.move-to-list.tip.2':
    'Moure treu llocs de la llista, així que només el propietari o un administrador veuen «Moure a la llista». «Duplicar a la llista» funciona des de qualsevol llista que puguis obrir.',
  'help.guide.accept-list-invite.step.2':
    "Fes clic a «Acceptar» per unir-t'hi o a «Rebutjar» per declinar la invitació.",
  'help.guide.tour-collection-add-to-trip.tip.2':
    "Si una excursió es va desar sense línia, cal afegir-ne els punts de ruta. El diàleg t'ho indica i selecciona aquesta opció per tu.",
  'help.guide.tour-collection-manage.tip.1':
    "Treure una excursió de la llista no canvia les excursions que ja se n'han creat als teus viatges.",
  'help.guide.entry-draft.tip.2':
    'Quan agafes un dia de Dawarich, les seves entrades són esborranys. Comprova la insígnia abans de compartir.',
  'help.guide.journey-map-layers.result':
    "El mapa només mostra les capes que vols, i cada xinxeta, punt i línia s'explica a la llegenda.",
  'help.guide.journey-keep-route.result':
    'La capçalera del dia mostra la distància, i la ruta es dibuixa amb línia contínua a la capa «Enregistrat» del mapa per a tots els membres de la travessia. Un enllaç compartit només la mostra si «Rutes enregistrades» està activat.',
  'help.guide.journey-day-stays.result':
    'Les estades sobre les quals has decidit desapareixen de la fila. Les entrades que has escrit apareixen al seu dia com qualsevol altra entrada, i hi pots afegir fotos i text com sempre.',
  'help.guide.journey-take-over-day.tip.2':
    'Els esborranys no apareixen als enllaços compartits. Afegeix-hi fotos i text i després desactiva «Esborrany» a cada entrada.',
  'help.guide.journey-auto-prepare.tip.2':
    "Un punt al botó de llista d'un dia vol dir que el dia encara no és definitiu; el text d'ajuda n'explica el motiu.",
  'help.ctx.settings-plugins.bullet.3':
    '«Activitat dels connectors», a baix, mostra totes les accions que un connector ha fet en nom teu, de la més recent a la més antiga, amb «Actualitzar».',
  'help.guide.language-region.tip.3':
    '«La setmana comença el» defineix la primera columna de tots els selectors de dates; «Vacances» té la seva pròpia opció.',
  'help.guide.web-push-device.tip.2':
    "A l'iPhone i l'iPad, primer afegeix TREK a la pantalla d'inici i obre'l des d'allà.",
  'help.guide.connect-airtrail.step.3':
    "Fes clic a «Desa» i després a «Prova la connexió». T'indica quants vols ha trobat, i la insígnia passa a «Connectat».",
  'help.guide.connect-dawarich.step.3':
    "Fes clic a «Desa» i després a «Prova la connexió»: compta les estades dels últims 30 dies. Un cop connectat, «Comprova-ho ara» ho comprova a l'instant, i «Desconnecta», a la dreta, tanca la connexió.",
  'help.guide.tour-connect-wanderer.step.3':
    "Fes clic a «Desa» i després a «Prova la connexió». T'indica quants dels teus camins pots importar, i la insígnia passa a «Connectat».",
  'help.guide.tour-wanderer-watch.step.2':
    "Com a màxim un cop al dia, TREK consulta la fitxa resumida de cada camí que has importat, i la fila mostra quan ho va comprovar per última vegada. Quan un camí pot haver canviat, reps una notificació i «Avisos» el compta: fes clic a «Avisos» per veure cada excursió com a «Pot haver canviat», «Canviat» o «No comprovable», i obre-la des d'allà.",
  'help.guide.plugin-settings.goal':
    'Dona a un connector les teves claus i preferències, i consulta què ha fet en nom teu.',
  'help.guide.own-routing-engine.result': 'Les rutes de tots els viatges es calculen als teus servidors.',
  'help.guide.admin-passkeys.title': "Oferir l'inici de sessió amb passkeys",
  'help.guide.rotate-jwt-secret.tip.1': "A tu també se't tanca la sessió, així que torna a iniciar-la tot seguit.",
  'help.guide.notification-defaults.title': 'Definir les notificacions per defecte dels usuaris',
  'help.ctx.notifications.title': 'Notificacions',
  'help.guide.read-notifications.goal': 'Mira què ha passat als teus viatges mentre no hi eres i obre-ho directament.',
  'help.guide.filter-notifications.goal': 'Repassa totes les notificacions, o només les que encara no has llegit.',
  'help.guide.mark-notifications-read.step.1':
    "Fes clic a «Marca com a llegida», la doble marca del costat de l'hora d'una notificació, per marcar només aquella.",
  'help.guide.delete-notifications.step.2':
    "«Elimina-ho tot», a dalt, elimina tota la llista d'un cop, després que un diàleg et demani confirmació.",
  'help.guide.notification-settings.step.3':
    "Fes clic a «Notificacions» a la barra lateral de «Configuració». La primera targeta té una fila per esdeveniment, i la columna «A l'aplicació» determina què mostra la campana.",
  'help.guide.link-journal.result':
    'A la barra de pestanyes del viatge apareix la pestanya «Diari». Tothom a qui hagis donat «Llegir» o «Edita» pot obrir-hi el diari, amb actualitzacions en directe.',
  'help.guide.create-place.tip.4':
    "Un enllaç copiat de Google Maps també funciona a la cerca: enganxa'l, prem Retorn i TREK n'extreu el lloc. Quan el formulari ja té una posició, «Llocs a prop d’aquest marcador», la creu del costat de la cerca, mostra el que hi ha al voltant.",
  'help.guide.dawarich-stays.step.2':
    "Les estades s'agrupen per dia, cadascuna amb l'hora d'arribada i de sortida; una icona de mesurador indica una estada de la qual Dawarich no estava segur. Fes clic a «Afegeix-ho com a lloc», la xinxeta del costat d'una estada.",
  'help.guide.leave-stop-off-route.step.3':
    'Per tornar-la a incloure a la ruta, obre el mateix menú i tria «Torna a afegir a la ruta».',
  'help.guide.move-booking-day.tip.1':
    "Les files esvaïdes dels dies intermedis d'una reserva de diversos dies no es poden arrossegar, i tampoc un sol tram d'un vol amb escales.",
  'help.guide.place-image-from-file.step.2':
    "Fes clic a la imatge rodona de la capçalera. Com que el lloc té fotos, una finestra petita et pregunta d'on ha de sortir la imatge.",
  'help.guide.place-own-hours.goal':
    "Posa a la targeta l'horari que has comprovat tu, quan el consultat és erroni o no hi és.",
  'help.guide.place-own-hours.tip.2':
    "El telèfon i el correu electrònic apareixen com a pastilles a la capçalera de la targeta. Fes clic en una per obrir-la a l'aplicació de telèfon o de correu.",
  'help.guide.edit-accommodation.tip.3':
    'Amb «Difumina els codis de reserva» activat a «Configuració», dins de «Pantalla», el número de confirmació queda difuminat. Passa-hi el ratolí per sobre o fes-hi clic per llegir-lo.',
  'help.guide.confirm-stay-booking.tip.1': 'Torna a fer clic a la pastilla i la reserva tornarà a «Pendent».',
  'help.guide.map-markers.tip.4':
    'Amb «Marcadors compactes per als llocs sense planificar» activat, a «Configuració» > «Pantalla», dins de «Viatge i mapa», els llocs que encara no són a cap dia es mostren com a punts petits sense foto ni valoració. El lloc que tries sempre es mostra complet.',
  'help.guide.tour-map-lines.step.1':
    "Cada excursió del viatge es dibuixa al mapa com una línia del seu color, amb una xinxeta on comença. Si has triat un color per a l'excursió, la línia el fa servir. Si no, fa servir el color de la seva categoria.",
  'help.guide.car-stops.step.6': 'Fes clic a «Afegir».',
  'help.guide.transport-details.step.4':
    "Fes clic al títol per canviar el nom del trajecte sense obrir el formulari. «Canviar el nom» s'obre amb el nom omplert: escriu-ne el nou i fes clic a «Desa».",
  'help.guide.export-transports-csv.goal':
    'Exporta els trajectes del viatge des de TREK en un fitxer CSV, per a un full de càlcul, una agència de viatges o per imprimir-los.',
  'help.guide.group-sort-bookings.result':
    "Les reserves apareixen en les seccions i l'ordre que has triat, i aquest navegador recorda l'opció per a la propera visita.",
  'help.guide.booking-on-map.step.1':
    "Fes clic a la targeta d'una reserva que tingui un lloc, vinculat a «Lloc / Activitat» o, en el cas d'una estada, a «Allotjament». S'obre el detall.",
  'help.guide.export-bookings-csv.title': 'Exportar les reserves com a full de càlcul',
  'help.guide.export-bookings-csv.tip.3':
    'El botó apareix tan bon punt la pestanya té una reserva. La pestanya «Transports» exporta les seves entrades de la mateixa manera.',
  'help.guide.arrange-packing-list.title': "Ordenar la llista d'equipatge al teu gust",
  'help.guide.count-packed-pieces.result':
    "La fila mostra quantes peces estan empaquetades, i l'article es marca quan hi has posat l'última.",
  'help.guide.expense-receipts.title': 'Adjuntar un rebut a una despesa',
  'help.guide.expense-receipts.tip.1':
    "A l'editor, un clic al nom d'un fitxer de la llista obre la mateixa vista prèvia. Aleshores Esc només tanca la vista prèvia, no la despesa.",
  'help.guide.files-sync-settings.step.5':
    "«Quan han canviat les dues bandes» decideix quina còpia es conserva quan un document s'ha editat als dos llocs: «Pregunta-m'ho», «Conserva la còpia del TREK» o «Conserva la còpia del magatzem». «Sincronitza automàticament» fa que TREK comprovi els canvis en segon pla; si està desactivat, la targeta diu «En pausa» i només «Sincronitza ara» fa una sincronització. Cada canvi que fas aquí es desa a l'instant.",
  'help.guide.manage-notes.step.5':
    "«Elimina» primer et pregunta «Vols eliminar la nota?», perquè la nota s'elimina per a tots els membres, amb els seus fitxers. Fes clic a «Elimina» per confirmar-ho.",
  'help.guide.note-categories.step.3':
    "Fes clic al nom d'una categoria per canviar-lo. Escriu el nom nou i prem Retorn; Esc manté l'anterior.",
  'help.guide.roadtrip-reorder.step.2':
    "Per moure una parada a un altre dia, deixa-la anar sobre una parada de la targeta d'aquell dia. Mentre arrossegues, els dies amb menys de dues parades apareixen com a targetes discontínues al final del carril, i també hi pots deixar anar la parada.",
  'help.guide.roadtrip-corridor.tip.4':
    "Sota el filtre, tria una parada del dia, o «A mig camí entre dues», per quedar-te només amb el que hi ha a menys de 25, 50 o 100 km d'aquell punt. Si hi ha punts de càrrega a la llista, «Qualsevol connector» i «Qualsevol potència» els filtren pel tipus de connector i la potència.",
  'help.guide.roadtrip-overnight.result':
    "El lloc apareix al trajecte com la parada per dormir d'aquell dia, i l'estada queda reservada al viatge com qualsevol altra.",
  'help.guide.roadtrip-stop-fill.result':
    "En aquesta parada, el dipòsit s'omple fins al nivell que has triat. L'autonomia a partir d'aquí, inclosa qualsevol franja «Aquí s’esgota el dipòsit», es calcula a partir d'aquest valor.",
  'help.guide.roadtrip-bookings.step.4': 'Fes clic a la targeta per obrir la reserva.',
  'help.guide.roadtrip-google-import.goal':
    "Converteix una ruta que has planificat a Google Maps en parades d'un dels teus dies.",
  'help.guide.roadtrip-google-import.tip.3':
    'Per importar cal connexió i permís per editar tant els llocs com els dies.',
  'help.guide.roadtrip-hazards.tip.2':
    "DWD cobreix Alemanya i GDACS informa de desastres a tot el món. Un avís que només s'indica com un punt vol dir que se'n desconeix la zona afectada.",
  'help.ctx.trip-tours.bullet.5':
    "A la columna de dies, una excursió és una fila com una parada. Si té «Inici», mostra inici → final, amb el final calculat segons el temps de l'excursió, i «Més opcions» conté «Edita», «Treure del dia», «Treu de la ruta» i «Desar a la col·lecció».",
  'help.guide.tour-show-list.step.5': 'Fes clic a «Llocs» al mateix selector per tornar a veure la llista de llocs.',
  'help.guide.tour-add-to-day.step.2':
    "Tria el dia. El menú mostra tots els dies del viatge amb la data i el títol; els dies que ja tenen l'excursió apareixen en gris.",
  'help.guide.tour-add-to-day.result':
    "L'excursió apareix sota el seu dia, i la seva línia forma part d'aquell dia al mapa.",
  'help.guide.tour-day-times.tip.2':
    "Un dia amb una etapa d'una excursió de diversos dies no té hora de final calculada, perquè el temps de l'excursió és el de tota la ruta.",
  'help.guide.tour-remove-from-day.step.3':
    "També pots fer clic a la capçalera del dia per obrir-lo, fer clic a l'excursió de la llista i després a «Treure del dia», a baix de la seva targeta.",
  'help.guide.tour-filter-list.step.3':
    'Si la llista en té de diversos, «Origen» (TREK, «Importació GPX», wanderer), «Límit de ruta» (T1 a T6) i «Tipus» («Senderisme», «Ruta en bicicleta», etc.) la filtren encara més. Torna a fer clic en un valor marcat per desmarcar-lo.',
  'help.guide.tour-hide-on-map.step.1':
    "Passa el ratolí per sobre d'una excursió de la llista i fes clic a l'ull que apareix a la dreta de la fila («Amaga al mapa»).",
  'help.guide.tour-import-plan-tab.step.1':
    'A la pestanya «Planificat», fes clic a «Excursions» al selector de dalt de la columna de la dreta.',
  'help.ctx.trip-tour-detail.bullet.1':
    "Fes clic a una excursió de la llista «Excursions» (primer canvia la columna de la dreta de «Llocs» a «Excursions»), a la seva fila dins d'un dia o a la seva línia al mapa, i se n'obrirà la targeta sobre el mapa. Pots continuar fent servir el mapa mentre la targeta està oberta.",
  'help.guide.tour-detail-read.step.2':
    "La capçalera mostra el nom de l'excursió i un resum en pastilles: quin tipus d'excursió és, d'on prové si s'ha importat, el temps previst, la distància, el desnivell positiu i el desnivell negatiu.",
  'help.guide.tour-detail-read.tip.3':
    "Algunes excursions mostren més coses: un passeig urbà, les seves parades; una ruta en piragua, les comprovacions i el vent; una excursió ja feta, el seu «Traç real», i una excursió vinculada a una llista, la seva «Llista d'equipatge».",
  'help.guide.tour-rename-colour.step.3':
    "Fes clic al punt de color de la cantonada de la casella rodona de l'excursió, «Color del traç». La secció «Color del traç» s'obre sota la capçalera.",
  'help.guide.tour-take-along.step.2':
    "Si l'excursió té una pàgina web, el botó del costat mostra el nom del web (Komoot, AllTrails, Outdooractive o Wanderer) o «Lloc web» en qualsevol altre cas. Obre la pàgina en una pestanya nova.",
  'help.guide.tour-copy-keep.goal':
    "Crea una variant d'una excursió en aquest viatge, o desa-la en una de les teves col·leccions per a futurs viatges.",
  'help.guide.tour-copy-keep.tip.4':
    '«Col·lecció» només apareix si el complement «Col·leccions» està activat. No pots triar una llista de només lectura, i si encara no tens cap llista, el diàleg ofereix «Obre les col·leccions».',
  'help.guide.tour-packing-link.step.5':
    "Fes clic a «Obre la llista d'equipatge» per anar marcant coses. TREK passa a la pestanya «Llistes», a la llista d'equipatge.",
  'help.guide.tour-files.step.2': "Ara la fila de sota en mostra el recompte, i la llista s'obre.",
  'help.guide.tour-activity-link.step.2':
    'A «Feta el», comprova el dia que la vas fer. Tria «Sense dia» si no correspon a cap.',
  'help.guide.tour-activity-compare.title': 'Comparar el pla amb el que vas fer',
  'help.guide.tour-activity-compare.result': 'Pots comparar ràpidament el dia amb el pla, a la targeta i al mapa.',
  'help.guide.tour-origin-check.tip.3':
    "«Sense connexió amb wanderer» vol dir que el teu compte encara no està connectat. Connecta'l a «Configuració», dins d'«Integracions».",
  'help.ctx.trip-tour-planner.bullet.5':
    "«Cerca un lloc o una adreça», a dalt del mapa, desplaça el mapa. La pastilla de baix a l'esquerra canvia entre els mapes que ofereix el tipus d'excursió, com ara Topo o «Satèl·lit», i conté els interruptors de l'excursió oberta, com ara «Posar punts» i 3D.",
  'help.guide.tour-open-workspace.step.5':
    "«Cerca un lloc o una adreça», a dalt del mapa, porta el mapa a un lloc, perquè puguis començar on és l'excursió.",
  'help.guide.tour-draw-route.goal':
    "Posa els punts d'una excursió nova al mapa i deixa que TREK calculi la ruta entre ells.",
  'help.guide.tour-draw-route.tip.2':
    "Topo o «Excursionisme», a la pastilla del mapa, mostren els camins, i així és més fàcil fer-hi clic. Si un punt és massa lluny de qualsevol via que pugui fer servir el tipus, apareix un avís en lloc d'una ruta.",
  'help.guide.tour-type-profile.step.3':
    'Una ruta en bicicleta demana el «Perfil» sota el tipus: «Cicloturisme», «Carretera», «Grava» o «BTT». La línia de sota explica què prioritza el perfil.',
  'help.guide.tour-edit-points.step.2':
    'Fes clic a una fila de «Punts de ruta» per seleccionar-ne el punt. La seva xinxeta es ressalta al mapa.',
  'help.guide.tour-shaping-points.title': 'Canviar la ruta amb un punt de forma',
  'help.guide.tour-shaping-points.tip.3':
    'En una ruta a cavall, un clic a la línia no afegeix res, perquè cap calculador de rutes no li dona forma.',
  'help.guide.tour-loop-reverse.tip.2':
    "Treu la fila «Tornada a l’inici» perquè torni a ser una excursió d'anada. Un tram dibuixat a mà continua dibuixat a mà quan s'inverteix l'excursió.",
  'help.guide.tour-leg-by-hand.step.4':
    '«Torna a calcular el tram següent» torna a demanar al calculador de rutes només aquell tram, sense tocar els altres.',
  'help.guide.tour-trip-places.step.3':
    "Fes clic a un lloc. S'afegeix com a nou final de l'excursió, i la llista es queda oberta per al següent.",
  'help.guide.tour-details-times.step.1':
    "«Nom de l'excursió», a dalt del carril de l'esquerra, conté el nom. En una excursió nova, el text gris que hi apareix, per exemple «Ruta de senderisme sense títol», només és un text d'exemple: escriu-hi el teu.",
  'help.guide.tour-save.title': 'Desar una excursió',
  'help.guide.tour-save.tip.3':
    "«Desa» tampoc no funciona si algun camp té un valor no vàlid, com ara un lloc web que no és una adreça. «Detalls» s'obre automàticament per mostrar-ho.",
  'help.guide.tour-edit-saved.tip.1': '«Desa» queda en gris en una excursió que no has modificat.',
  'help.guide.tour-summary-profile.step.3':
    "Mou el punter pel «Perfil d'altitud». Mostra la distància i l'altitud en aquell punt, i un punt marca el mateix lloc al mapa.",
  'help.guide.tour-list-manage.step.1':
    "«Totals del viatge» és a sobre de la llista. Plegat, mostra el nombre d'excursions i quantes en són «Planificat» i «Sense planificar». La fletxa de la dreta obre una línia per tipus amb la distància, el desnivell positiu i negatiu i els temps sumats.",
  'help.guide.tour-list-manage.result':
    'Veus els totals de les excursions que mostra el filtre, i cada excursió és al dia que vols.',
  'help.guide.tour-delete.result': "L'excursió desapareix de la llista, del mapa i de tots els dies.",
  'help.guide.tour-saved-elsewhere.tip.2':
    "Passa el mateix si has modificat l'excursió en un altre dispositiu. Una excursió que no has modificat simplement es torna a carregar, i una nota t'ho indica.",
  'help.ctx.trip-tour-import.bullet.5':
    'Un cop connectat wanderer a «Configuració», «Integracions», apareix un botó wanderer al costat de «Planifica una nova excursió» mentre no hi ha cap excursió oberta. Mostra els teus camins per importar-los.',
  'help.guide.tour-import-gpx.tip.1':
    "També pots arrossegar els fitxers de l'ordinador fins a la pestanya «Excursions» i deixar-los-hi anar. S'obre la mateixa previsualització.",
  'help.guide.tour-view-import.step.1':
    "A la pestanya «Excursions», fes clic a una excursió amb la insígnia «Importació GPX» a «Excursions d'aquest viatge».",
  'help.guide.tour-plan-from-import.goal':
    "Obtén punts de ruta que pots moure a partir d'una traça enregistrada, i comprova com de prop s'hi manté la nova ruta.",
  'help.guide.tour-plan-from-import.tip.4': 'Una «Ruta a cavall» no té versió editable: es conserva tal com es va fer.',
  'help.guide.tour-restore-recorded.tip.2':
    "Una excursió creada amb «Planifica com a excursió nova» no té traça enregistrada pròpia. La importació d'on prové continua a la llista.",
  'help.guide.tour-take-over.step.5': 'Si vols, posa-li un altre nom a «Nom en aquest viatge».',
  'help.guide.tour-import-wanderer.step.1':
    'A la pestanya «Excursions», sense cap excursió oberta, fes clic a wanderer, al costat de «Planifica una nova excursió».',
  'help.guide.tour-import-wanderer.result':
    "El camí ja és una excursió del viatge i s'obre al mapa com a «Excursió de wanderer».",
  'help.guide.tour-map-layers.title': "Triar el mapa d'una excursió",
  'help.guide.tour-map-layers.tip.3':
    "Una ruta en piragua i un passeig urbà només ofereixen «Mapa» i «Satèl·lit»; una cursa, una excursió d'esquí i una ruta a cavall ofereixen «Mapa», Topo i «Satèl·lit».",
  'help.guide.tour-along-search.result':
    'Els llocs al llarg de la ruta apareixen a la llista i al mapa, a punt per consultar-los.',
  'help.guide.tour-along-add-stop.step.3':
    'Fes clic a «Afegeix com a parada». La insígnia del costat és una estimació aproximada del desviament, mesurada en línia recta.',
  'help.guide.tour-3d-terrain.step.1':
    "Obre una excursió a la pestanya «Excursions» i fes clic a 3D, a l'extrem de la pastilla de baix a l'esquerra. El mapa s'inclina i mostra el relleu en 3D, amb la ruta dibuixada a sobre.",
  'help.guide.tour-3d-terrain.tip.3':
    "El relleu necessita connexió: les altituds provenen de les tessel·les obertes de relleu de Mapzen. Una ruta en piragua es dibuixa amb el seu propi color i sense pendents, perquè l'aigua és plana.",
  'help.guide.tour-3d-flyover.tip.1':
    'Fes girar la roda del ratolí durant el sobrevol per apropar-te o allunyar-te; la càmera continua centrada en el punt. No pots arrossegar el mapa fins que no facis una pausa.',
  'help.guide.tour-map-overlays.step.4':
    "En una ruta en piragua, la pastilla ofereix en canvi «Senyals nàutics». Fes-hi clic per mostrar boies, balises i senyals portuaris a l'aigua.",
  'help.ctx.trip-tour-stages.bullet.2':
    "«Acaba l’etapa aquí», al menú «Més accions» d'una parada, acaba una etapa en aquella parada. Aleshores «Punts de ruta» mostra un títol «Etapa N» per a cada etapa, amb la distància i el temps, i la parada que acaba una etapa té una icona de lluna.",
  'help.guide.tour-multi-day.step.3':
    'Passa el ratolí per la parada on acaba el primer dia, fes clic a «Més accions» i tria «Acaba l’etapa aquí».',
  'help.guide.tour-multi-day.result':
    'Una sola ruta amb les seves etapes, cadascuna amb les seves mesures. Fes clic a «Desa» per conservar-les.',
  'help.guide.tour-stages-on-days.step.6':
    "La fletxa del costat, «Obre aquesta etapa al planificador», obre l'excursió a l'editor en aquella etapa.",
  'help.ctx.trip-tour-hike.bullet.1':
    "«Tipus de ruta», a dalt de l'editor, determina com es planifica la ruta. «Senderisme» fa servir camins fins a la «Dificultat màxima del sender» indicada a «Detalls»; «Córrer» fa servir vies aptes per córrer i et demana el «Ritme previst».",
  'help.guide.tour-hike-plan.step.1':
    "Fes clic a «Planifica una nova excursió», a dalt de la columna de l'esquerra. L'editor s'obre com a «Nova excursió».",
  'help.guide.tour-hike-plan.tip.2':
    "A partir de T4, primer et pregunta «Vols activar les rutes alpines?». Confirma-ho només si la ruta pot passar per terreny exposat o sense senyalitzar; la pregunta surt una vegada per sessió d'edició.",
  'help.guide.tour-hike-trail-details.step.4':
    'Fes clic a un grau de la llista per dibuixar al mapa només aquells trams. Torna-hi a fer clic per mostrar tota la ruta.',
  'help.guide.tour-hike-round.step.1':
    "Amb la caminada oberta, fes clic a «Ruta circular des de l’inici» a la capçalera de la targeta «Punts de ruta». Des d'una altra parada, obre'n «Més accions» i tria «Ruta circular des d’aquí».",
  'help.guide.tour-hike-round.tip.3':
    '«Torna a cercar» et torna a la distància, i «Cancel·la» tanca la targeta sense canviar res.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Només les caminades ofereixen aquesta opció, i només per a trams que ha planificat el calculador de rutes, no per als dibuixats a mà.',
  'help.guide.tour-ferrata-add.step.4':
    'A «Punts de ruta», el tram entre aquests dos punts mostra el nom, el grau i la longitud de la via ferrada.',
  'help.guide.tour-run-plan.goal':
    "Planifica una cursa per vies aptes per córrer i calcula'n el temps segons el teu ritme.",
  'help.guide.tour-run-plan.tip.2':
    'El temps no té en compte les pujades, les baixades ni la dificultat tècnica del camí: és la distància multiplicada pel ritme i res més.',
  'help.guide.tour-run-ways.result': "Abans de sortir, saps quines parts de la cursa no són d'asfalt.",
  'help.ctx.trip-tour-walk.bullet.4':
    "«Al llarg de la ruta» troba punts d'interès segons el «Tema de la ruta» dins d'una distància de la ruta, i «Afegeix com a parada» n'incorpora un al passeig on triïs.",
  'help.guide.tour-walk-plan.step.5':
    "Posa «Importància» a «Habitual», «Opcional» o «Imprescindible». Activa «Protegida» en una parada que s'hagi de quedar on és quan més endavant es proposi un canvi, i després fes clic a «Desa».",
  'help.guide.tour-walk-sights.step.1':
    "Amb un passeig urbà obert, busca «Al llarg de la ruta» a la columna de l'esquerra i tria un «Tema de la ruta»: «Cultura i història», «Parcs i vistes», «Menjar i vida local» o «Una mica de tot».",
  'help.guide.tour-walk-sights.result':
    "El punt d'interès ja és una parada del passeig, inclosa a la ruta entre les parades que has triat.",
  'help.guide.tour-walk-day-times.tip.2':
    "Si una parada encara no té temps d'estada, les hores d'arribada posteriors es mostren com les més aviat possibles.",
  'help.guide.tour-walk-google-import.step.3':
    "Revisa «Parades de l'enllaç». Una parada que no té posició a l'enllaç queda marcada i s'exclou.",
  'help.guide.tour-walk-check-off.step.1':
    "A la pestanya «Planificat», fes clic al passeig urbà al seu dia. La seva targeta s'obre al costat del mapa.",
  'help.ctx.trip-tour-bike.title': 'Rutes en bicicleta',
  'help.guide.tour-bike-profile.step.1':
    "A la pestanya «Excursions», fes clic a «Planifica una nova excursió», a dalt del carril de l'esquerra.",
  'help.guide.tour-bike-profile.tip.2':
    'Un perfil només orienta el calculador de rutes. No indica si una via és transitable en bicicleta: la targeta «Ferm i camins» mostra per on passa la ruta.',
  'help.guide.tour-bike-surfaces.step.3':
    'A «Ferm», fes clic a una fila com ara «Grava» o «Terra natural». Els seus trams es ressalten al mapa. Torna a fer clic a la fila per treure el ressaltat.',
  'help.guide.tour-bike-mtb-grades.goal': "Consulta com de difícils són els camins d'una ruta de BTT abans de fer-la.",
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Si canvies el «Perfil» a un que no sigui «BTT», les seccions de grau desapareixen. Aleshores la ruta es torna a planificar segons el nou perfil.',
  'help.guide.tour-ski-plan.title': "Planificar una excursió d'esquí i hivern",
  'help.guide.tour-ski-plan.tip.1':
    "Per a «Esquí de fons», tria també la «Tècnica»: «Clàssica», «Patinador» o «Desconeguda». L'avís de sota els camps indica què hi falta encara.",
  'help.guide.tour-ski-options.step.2':
    'Obre «Pistes més difícils» i tria el grau més alt que vulguis esquiar, de «Principiant» a «Expert». El valor per defecte és «Intermèdia».',
  'help.guide.tour-ski-fix-leg.title': "Arreglar un tram d'esquí que no s'ha pogut planificar",
  'help.guide.tour-ski-fix-leg.tip.4':
    "Fins que no estan planificats tots els trams, la targeta «Ruta per pistes» indica que encara no hi ha temps d'esquí.",
  'help.guide.tour-ski-summary.tip.2':
    "«Temps d’esquí» queda com a «Sense calcular» fins que no estan planificats tots els trams. Per donar igualment un temps a l'excursió, introdueix un total previst als seus detalls.",
  'help.guide.tour-ski-pistes-layer.step.3':
    "La llegenda mostra les pistes de baixada per dificultat, els circuits de fons, els senders d'hivern i de raquetes, les pistes de trineu i els remuntadors. «Llegenda completa a OpenSnowMap» obre la llegenda completa.",
  'help.guide.tour-ski-import.step.2':
    'A la «Previsualització de la importació», obre «Importa com a» i tria «Esquí i hivern».',
  'help.guide.tour-ski-import.result':
    "La traça ja és a «Excursions d'aquest viatge», amb la disciplina i la tècnica a la seva targeta «Traça d’esquí».",
  'help.ctx.trip-tour-paddle.bullet.6':
    "«El rem té riscos», la fila de baix de la columna de l'esquerra, obre «Seguretat a l’aigua». El mapa ofereix «Mapa» i «Satèl·lit», i «Senyals nàutics» com a capa superposada.",
  'help.guide.tour-paddle-setup.step.6':
    "«Velocitat de rem» mostra en gris la velocitat suggerida per a l'embarcació. Si n'escrius una de pròpia, el camp diu «Velocitat pròpia»; l'enllaç de sota, «Usa el suggerit», torna a la velocitat de l'embarcació.",
  'help.guide.tour-paddle-water-route.goal':
    "Fes que TREK planifiqui un tram pel riu o pel llac, i entén les notes d'un tram que no ha pogut planificar.",
  'help.guide.tour-paddle-water-route.tip.3':
    'Les notes de sota un tram planificat indiquen «Aigües braves» amb el seu grau, un «Pas per a canoes» o un «Buit a les dades del mapa» salvat amb una línia recta.',
  'help.guide.tour-paddle-portage.step.4':
    "A «Ruta», «Seguir el camí» fa servir una via cartografiada i «Línia recta» va directament. TREK busca el camí automàticament i t'avisa quan no n'hi ha cap sense fer una gran volta.",
  'help.guide.tour-paddle-lock.step.1':
    'Passa el ratolí per la parada de la resclosa i fes clic a «Més accions», els tres punts.',
  'help.guide.tour-paddle-time.title': "Consultar i ajustar el temps d'una ruta en piragua",
  'help.guide.tour-paddle-time.tip.2': "L'estimació no té en compte el corrent ni el vent.",
  'help.guide.tour-paddle-wind.step.4':
    'Obre «Què significa el vent quan remes» per saber com afecten una embarcació el vent de cara, el vent lateral, les travessies en aigües obertes i les ratxes.',
  'help.guide.tour-paddle-checklist.step.1':
    "Desa la ruta en piragua i després busca «Llista de comprovació» a la columna de l'esquerra. La insígnia de la capçalera resumeix com està la llista.",
  'help.guide.tour-paddle-checklist.tip.4':
    "Els obstacles provenen de les dades d'OpenStreetMap de les regions que té TREK. On no n'hi ha, la targeta t'ho indica, i has de comprovar tu mateix els assuts, les rescloses i els transports per terra.",
  'help.guide.tour-paddle-track-marks.step.4':
    "Fes clic a la traça a «Excursions d'aquest viatge». La columna de l'esquerra la mostra tal com es va enregistrar, amb la targeta «Transports per terra i rescloses».",
  'help.ctx.trip-tour-horse.title': 'Rutes a cavall',
  'help.guide.tour-horse-plan.goal':
    'Crea una ruta a cavall amb trams dels itineraris eqüestres senyalitzats a la vista del mapa.',
  'help.guide.tour-horse-plan.result':
    "La ruta segueix els trams que has agafat, cadascun amb el nom del seu itinerari, el punt d'accés i la longitud, i apareix a «Excursions d'aquest viatge».",
  'help.guide.tour-horse-gap.step.1':
    'Amb un tram ja a la ruta, obre un altre itinerari i tria un tram que no toqui el final de la teva ruta. A «Enllaç amb la teva ruta», un avís indica a quina distància queden.',
  'help.guide.tour-horse-recorded.title': "Conservar una ruta a cavall enregistrada d'un fitxer GPX",
  'help.guide.tour-horse-recorded.tip.2':
    "Un fitxer sense altituds mostra «Sense altituds al fitxer» en lloc d'un desnivell positiu de zero.",
  'help.guide.dateless-trip.tip.1':
    "Quan sàpigues quan viatges, obre el formulari amb el llapis de la targeta i tria les dates. Els dies que ja has planificat mantenen l'ordre i reben les dates en aquest mateix ordre.",
  'help.guide.trip-reminder.goal': 'Rep un recordatori uns dies abans de marxar.',
  'help.guide.upcoming-reservations.tip.2':
    '«Pendent» indica una reserva que encara no està confirmada. Les reserves cancel·lades i els viatges arxivats no hi surten.',
  'help.guide.half-company-holiday.tip.1':
    'Les vacances ja registrades aquell dia es redueixen a mig dia. Qui registri aquell dia més endavant només gastarà 0,5 dies.',
  'help.guide.edit-holiday-calendar.goal':
    "Canvia el nom, el color o la posició d'un calendari de festius oficials o de vacances escolars que hagis afegit, o elimina'l.",
  'help.guide.person-color.title': "Canviar el color d'una persona",
  'help.guide.answer-fusion-request.tip.1':
    "La sol·licitud es queda oberta fins que la responguis. Si n'hi ha diverses, les veuràs l'una darrere l'altra.",
  'help.guide.log-for-partner.tip.1':
    '«Mitja jornada» i «Comp. / Flexi» també funcionen per a la persona seleccionada.',
  'help.guide.dissolve-fusion.tip.2': 'Si només vols que algú vegi els teus dies, comparteix-li el calendari.',
  'help.guide.country-details.tip.2':
    'Fes clic a la insígnia «Llocs» per veure tots els llocs comptats per al país, agrupats per viatge.',
  'help.guide.country-places.tip.2':
    'La insígnia només apareix quan el país té llocs propis. Un país que només has marcat a mà no en té cap.',
  'help.guide.tour-activity-stats.goal':
    "Consulta la distància, el desnivell i el nombre d'excursions que has fet en tots els teus viatges, per període i per tipus, i exclou les que no es van fer.",
  'help.guide.tour-activity-stats.tip.1':
    'Una excursió compta quan ha passat el seu últim dia. Una excursió que no és en cap dia, o només en dies sense data, no compta mai. Perquè compti, posa-la en un dia amb data del seu viatge.',
  'help.guide.move-to-list.result':
    "Els llocs ja són a l'altra llista, i una nota breu indica quants se n'han mogut o duplicat.",
  'help.guide.accept-list-invite.tip.1':
    "El que pots fer a la llista depèn del rol que t'ha assignat el propietari: «Lector», «Editor» o «Administrador».",
  'help.guide.tour-collection-add-to-trip.title': "Afegir una excursió d'una llista a un viatge",
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Per desar una excursió en una llista, obre una excursió desada al viatge i fes clic a «Col·lecció», a baix de tot.',
  'help.guide.tour-collection-manage.tip.2': 'Només el propietari i els administradors de la llista veuen la paperera.',
  'help.guide.entry-draft.result':
    "L'entrada es queda a la cronologia, marcada com a «Esborrany», i no apareix a l'enllaç compartit.",
  'help.guide.journey-map-layers.title': 'Triar què mostra el mapa de la travessia',
  'help.guide.journey-keep-route.title': 'Conservar la ruta que has enregistrat un dia',
  'help.guide.journey-day-stays.title': 'Escriure entrades a partir de les estades enregistrades per Dawarich',
  'help.guide.journey-take-over-day.title': 'Incorporar un dia enregistrat sencer',
  'help.guide.journey-take-over-day.result':
    'Ara el dia té un esborrany per estada o per grup unit, o una sola crònica del dia, i les seves estades ja no apareixen com a pendents.',
  'help.guide.journey-auto-prepare.result':
    'Mentre dura un viatge vinculat, les estades de cada dia apareixen en aquell dia, a punt per a «Incorporar el dia».',
  'help.ctx.settings-about.title': 'Quant a',
  'help.guide.web-push-device.tip.3':
    'Push necessita que obris TREK per HTTPS. Si les notificacions estan bloquejades, permet-les a la configuració del navegador i torna-ho a provar.',
  'help.guide.connect-airtrail.result':
    "La insígnia mostra «Connectat», i la pestanya «Transports» de cada viatge ofereix «Importar des d'AirTrail».",
  'help.guide.connect-dawarich.result':
    "La insígnia mostra «Connectat», i el planificador de viatges, el diari i l'«Atles» poden oferir el que ha enregistrat Dawarich.",
  'help.guide.tour-connect-wanderer.result':
    'La insígnia mostra «Connectat», i la pestanya «Excursions» de cada viatge pot buscar al teu wanderer i importar-ne els camins.',
  'help.guide.tour-wanderer-watch.result':
    "TREK comprova els camins que has importat i t'avisa quan algun pot haver canviat. Una excursió només canvia quan acceptes el canvi.",
  'help.guide.plugin-settings.step.1':
    "Obre «Connectors» a la barra lateral de la configuració. Sota «Configuració dels connectors», cada connector que necessita dades teves té una targeta amb els seus camps: omple'ls i fes clic a «Desa». Les accions de la targeta s'executen després de confirmar-les.",
  'help.guide.profile.step.3': 'Fes clic a «Desa el perfil», a la dreta del peu de la targeta.',
  'help.guide.default-user-settings.title': 'Definir amb què comencen els usuaris nous',
  'help.guide.own-routing-engine.tip.1':
    "Els servidors OSRM públics admeten aproximadament una petició per segon. N'hi ha prou per a un dia, però pot ser massa lent per a un viatge per carretera.",
  'help.guide.admin-passkeys.goal':
    "Permet que la gent iniciï sessió amb l'empremta digital, la cara o el PIN del dispositiu.",
  'help.guide.rotate-jwt-secret.tip.2':
    "Si només vols tancar la sessió d'una persona, posa-li una «Contrasenya nova» a «Editar usuari». Així només es tanquen les seves sessions.",
  'help.guide.notification-defaults.goal':
    'Decideix com comencen les notificacions de cada usuari, i bloqueja del tot un canal per a un esdeveniment.',
  'help.ctx.notifications.summary':
    "Totes les notificacions que TREK t'ha mostrat dins de l'aplicació, de la més recent a la més antiga: una reserva que algú ha modificat, un missatge nou al xat d'un viatge, un calendari que t'han compartit. La campana de dalt a la dreta mostra les deu més recents, i aquesta pàgina les mostra totes.",
  'help.guide.read-notifications.step.1':
    'Fes clic a la campana de dalt a la dreta. El número vermell indica quantes notificacions encara no has llegit.',
  'help.guide.filter-notifications.step.1': 'Fes clic a la campana de dalt a la dreta.',
  'help.guide.mark-notifications-read.step.2':
    'Fes clic a «Marca-ho tot com a llegit», a dalt, per marcar totes les notificacions com a llegides alhora.',
  'help.guide.delete-notifications.tip.1':
    "Eliminar una notificació només l'elimina per a tu. La reserva, el missatge o la compartició a què feia referència no canvia.",
  'help.guide.notification-settings.tip.1':
    "Un cadenat en una cel·la vol dir que l'administrador ha desactivat aquell esdeveniment per a tothom.",
  'help.guide.add-guest.tip.3':
    "Només el propietari del viatge pot afegir convidats, canviar-los el nom i eliminar-los. Un convidat que ha pagat una despesa no es pot eliminar fins que canviïs qui l'ha pagada o eliminis el pagament.",
  'help.guide.link-journal.tip.1':
    'Només pots vincular diaris dels quals ets propietari. No pots vincular un diari en què només pots escriure.',
  'help.ctx.trip-places.bullet.7':
    'La marca del costat de la cerca inicia una selecció. Fes servir la barra de baix de la columna per canviar alhora la categoria de diverses files, afegir-les a una col·lecció, marcar-les com a visitades o eliminar-les.',
  'help.guide.filter-places.step.5':
    "Quan el viatge inclou més d'un país o regió, el globus filtra la llista per un país, o per una regió d'aquest país, cadascun amb el seu recompte. «Esborra el filtre» torna a «Tots els països».",
  'help.guide.import-places-file.tip.3':
    "Quan «Excursions» està activat, que és el que ve per defecte, els fitxers s'importen des d'«Excursions», a dalt de la columna, amb «Importa GPX o KML», i les seves línies es converteixen en excursions. Els punts del fitxer no s'hi importen, perquè les excursions només contenen línies.",
  'help.guide.dawarich-stays.step.3':
    'Revisa el «Nom», «Arribada» i «Sortida», tria un «Dia» o deixa-ho a «Encara no és en cap dia», afegeix «Notes» si vols i fes clic a «Afegeix un lloc».',
  'help.guide.leave-stop-off-route.result':
    'La parada continua formant part del dia i del PDF; mentre està marcada com a «Fora de ruta», la ruta va directament de la parada anterior a la següent.',
  'help.guide.move-booking-day.tip.2':
    "Dins del seu dia, una reserva amb hora sempre torna a la posició que li correspon per l'hora.",
  'help.guide.place-image-from-file.step.3':
    "A «Dels fitxers adjunts», fes clic a la foto que vulguis. «Puja des del dispositiu», a sobre, et permet triar-ne una de nova de l'ordinador.",
  'help.guide.place-own-hours.step.1':
    "Obre el lloc i fes clic a «Edita», a baix a la dreta de la targeta. S'obre el formulari del lloc.",
  'help.guide.place-own-hours.tip.3':
    "Fes clic a «Elimina l'horari» i després a «Actualitza» perquè la targeta torni a mostrar l'horari trobat automàticament.",
  'help.guide.confirm-stay-booking.title': "Confirmar la reserva d'una estada",
  'help.guide.confirm-stay-booking.tip.2':
    'La mateixa pastilla funciona en totes les reserves, també a les de «Reserves» del dia.',
  'help.guide.map-lock.tip.2':
    "Aquest navegador recorda el cadenat de cada viatge. Quan obres un viatge, el mapa s'ajusta igualment al viatge un cop, perquè no s'obri mai sobre una zona buida.",
  'help.guide.tour-map-lines.step.2':
    "Fes clic a la línia o a la xinxeta del seu inici. La targeta de l'excursió s'obre a la part de baix del mapa, i la línia es dibuixa més gruixuda i amb una vora blanca, perquè la distingeixis entre les altres. La X de la capçalera de la targeta la tanca.",
  'help.guide.car-stops.title': 'Planificar un trajecte en cotxe amb parades pel camí',
  'help.guide.car-stops.result':
    'El trajecte és una targeta a la pestanya «Transports» i una fila al seu dia, i la seva línia al mapa va de la recollida a la devolució passant per totes les parades, en ordre.',
  'help.guide.transport-details.step.5':
    "«Al mapa», a baix dels detalls, mostra la línia del trajecte i obre «Planificat» en aquell dia. «Edita», a l'extrem dret, obre el formulari complet, i la paperera del costat elimina el trajecte un cop ho confirmes.",
  'help.guide.export-transports-csv.step.1':
    "Si només en vols una part, filtra primer la llista. «Cercar», «Filtra» i l'ordre d'«Opcions de vista» es tenen en compte: el fitxer conté el que mostra la pestanya i en el mateix ordre.",
  'help.guide.group-sort-bookings.tip.1':
    '«Targetes» i «Llista» tenen cadascuna la seva agrupació: «Targetes» comença per «Estat» i «Llista», per «Dia». Un punt a «Opcions de vista» indica que hi ha alguna cosa diferent del valor per defecte, i «Restablir la vista», a baix del panell, torna als valors per defecte.',
  'help.guide.booking-on-map.step.2': 'Fes clic a «Al mapa», a baix dels detalls.',
  'help.guide.export-bookings-csv.goal':
    'Exporta les reserves del viatge en un fitxer CSV per obrir-lo amb Excel, Numbers o qualsevol altre full de càlcul.',
  'help.guide.arrange-packing-list.goal':
    'Mou llistes senceres i articles concrets on vulguis, o mostra cada llista ordenada per nom.',
  'help.guide.check-off-packing.tip.4':
    "En un article amb una quantitat superior a un, també pots marcar les peces com a empaquetades una per una. Consulta «Empaquetar diverses unitats d'un article».",
  'help.guide.count-packed-pieces.tip.1':
    'Si marques la casella, empaquetes totes les peces alhora, i si la desmarques, les treus totes.',
  'help.guide.expense-receipts.goal':
    "Guarda el rebut o la factura amb la despesa corresponent i torna'l a obrir des del llibre de comptes.",
  'help.guide.expense-receipts.tip.2':
    "La paperera del costat d'un rebut el treu de la despesa quan deses. El fitxer es queda a «Fitxers»; elimina'l allà per esborrar-lo del tot.",
  'help.guide.files-sync.tip.4':
    "Si la targeta mostra un avís groc amb «Torna a connectar», el gestor d'emmagatzematge ja no accepta l'inici de sessió desat. Fes clic a «Torna a connectar», introdueix una nova contrasenya d'aplicació o un token nou, i la sincronització es reprèn.",
  'help.guide.files-sync-settings.result':
    'A partir de la propera execució, el viatge només se sincronitza en el sentit que has triat, i les eliminacions i les edicions en conflicte es gestionen segons les regles que has definit.',
  'help.guide.manage-notes.result':
    "La nota desapareix de la targeta «Notes» per a tots els membres alhora. Una nota que només has fixat o modificat es manté, i els altres la veuen tal com l'has deixada.",
  'help.guide.note-categories.step.4':
    "Els punts de color d'una fila defineixen el color d'aquella categoria: «Anil», «Vermell», «Ambre», Maragda, «Blau» o «Violeta». En aquest exemple, «Allotjament» passa a ambre.",
  'help.guide.roadtrip-reorder.step.3':
    'Amb el teclat, posa el focus en una parada i prem Alt amb la fletxa amunt o avall per moure-la una posició dins del seu dia.',
  'help.guide.roadtrip-overnight.title': 'Passar una nit pel camí',
  'help.guide.roadtrip-overnight.tip.1':
    "La nit dura fins al dia següent. Per a altres dates, modifica la reserva: canvia les dates a «Dies», juntament amb la resta de l'estada.",
  'help.guide.roadtrip-stop-fill.tip.1':
    'Només les parades on el teu cotxe pot repostar mostren la insígnia: les de combustible per a «Benzina», les de càrrega per a «Elèctric», i totes dues per a «Tots dos».',
  'help.guide.roadtrip-bookings.result':
    "Cada trajecte reservat apareix a la ruta en el punt on té lloc, i la ruta d'abans i de després va fins a les seves terminals i en surt.",
  'help.guide.roadtrip-google-import.step.1':
    'Fes clic als tres punts de dalt de «Durant el trajecte» i tria «Importa una ruta de Google Maps».',
  'help.guide.roadtrip-hazards.title': 'Mostrar els avisos actuals al mapa',
  'help.guide.roadtrip-hazards.tip.3':
    "Les dades s'actualitzen cada deu minuts i necessiten connexió. Com la resta de preferències de conducció, l'interruptor es desa per al viatge.",
  'help.ctx.trip-tours.bullet.6':
    "Per canviar una ruta o eliminar una excursió, ves a la pestanya «Excursions», a «Excursions d'aquest viatge».",
  'help.guide.tour-show-list.tip.1':
    "Fes clic a la línia d'una excursió al mapa, i la llista marcarà aquella excursió i s'hi desplaçarà.",
  'help.guide.tour-add-to-day.step.3':
    "«Afegit al dia 10» ho confirma, la fila rep la insígnia «Dia», i el dia de la columna de l'esquerra mostra l'excursió amb el temps, la distància i el desnivell positiu.",
  'help.guide.tour-day-times.title': "Posar una hora d'inici a una excursió el seu dia",
  'help.guide.tour-day-times.tip.3':
    "«Treu de la ruta», al mateix menú, manté l'excursió al dia però la treu de la ruta del dia al mapa. «Torna a afegir a la ruta» ho desfà.",
  'help.guide.tour-remove-from-day.tip.1':
    "Una excursió de diversos dies es treu d'un dia cada vegada, perquè cada dia té la seva pròpia etapa.",
  'help.guide.tour-filter-list.step.4':
    "Tanca el menú. Ara el botó mostra l'estat, el nombre d'excursions que queden i +1 per cada filtre addicional que hagis aplicat.",
  'help.guide.tour-hide-on-map.step.2':
    "La línia de l'excursió s'amaga del mapa. La seva fila es queda a la llista, atenuada, i mostra un ull ratllat («Mostra al mapa»). Fes-hi clic per tornar a mostrar la línia.",
  'help.guide.tour-import-plan-tab.step.2':
    'Fes clic a «Importa GPX o KML», a dalt de la llista, i tria els fitxers (GPX, KML o KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    "La capçalera mostra la casella rodona de l'excursió, el nom amb un llapis per canviar-lo, un punt de color amb el color de la línia i pastilles amb el tipus, l'origen, el temps previst, la distància, el desnivell positiu i el desnivell negatiu. La X de la dreta tanca la targeta, igual que Esc.",
  'help.guide.tour-detail-read.step.3':
    'Passa el ratolí pel temps per veure com es compon: el temps en moviment, les pauses i el total previst.',
  'help.guide.tour-detail-read.tip.4':
    "La targeta no canvia la ruta. Per moure un punt o redibuixar un tram, obre la pestanya «Excursions» i fes clic a l'excursió a «Excursions d'aquest viatge».",
  'help.guide.tour-rename-colour.step.4':
    "Tria un color. «Color automàtic», la primera casella, torna la línia al seu color per defecte, i «Tria un color personalitzat», l'última, et permet triar qualsevol color. La línia del mapa i la franja de la llista d'«Excursions» canvien a l'instant.",
  'help.guide.tour-take-along.step.3':
    "Fes clic a GPX per baixar l'excursió desada com a fitxer GPX: tota la ruta amb les altituds que té, llesta per a una aplicació de navegació o un dispositiu GPS.",
  'help.guide.tour-copy-keep.step.1':
    "Obre la targeta de l'excursió i fes clic a «Copiar», a baix. TREK crea una excursió nova i independent, sense els seus dies, i l'original no canvia.",
  'help.guide.tour-copy-keep.result':
    'El viatge té una segona excursió que pots modificar lliurement, i la col·lecció en té la seva pròpia còpia, llesta per afegir-la a un altre viatge.',
  'help.guide.tour-packing-link.tip.1':
    "Només és un vincle. No es copia ni es mou res, i els articles es queden a «Llistes». Si en marques un allà, l'excursió ho mostra a l'instant.",
  'help.guide.tour-files.step.3': 'Fes clic a un fitxer per obrir-lo.',
  'help.guide.tour-activity-link.step.3':
    "Tria l'enregistrament a «Traça», o fes clic a «Importa GPX» per afegir-ne un fitxer nou.",
  'help.guide.tour-activity-compare.goal': "Consulta on el traç real es desvia del pla, i canvia'l o desvincula'l.",
  'help.guide.tour-origin-check.title': "Veure d'on prové una excursió",
  'help.guide.tour-origin-check.result': "Saps d'on prové l'excursió, de quan és i si ha canviat des d'aleshores.",
  'help.ctx.trip-tour-planner.bullet.6':
    'Els esborranys sense desar es conserven: torna a obrir la pestanya «Excursions» i es recuperen amb el missatge «Esborrany sense desar restaurat». «Torna a excursions» i «Descartar» et pregunten abans de descartar canvis.',
  'help.guide.tour-open-workspace.step.6':
    "La pastilla de baix a l'esquerra canvia el mapa, al principi entre «Mapa» i «Satèl·lit». Amb una excursió oberta, ofereix els mapes del seu tipus, com ara Topo o «Excursionisme», i interruptors com ara «Posar punts» i 3D.",
  'help.guide.tour-draw-route.step.1':
    "Fes clic a «Planifica una nova excursió», a dalt del carril de l'esquerra. El carril passa a «Nova excursió», que és una caminada si no tries un altre tipus.",
  'help.guide.tour-draw-route.tip.3':
    'Si un esborrany té canvis sense desar, «Planifica una nova excursió», al menú «Afegeix una ruta», primer et pregunta «Vols començar una nova excursió?», amb «Descarta i comença».',
  'help.guide.tour-type-profile.step.4':
    "La ruta es torna a planificar segons el perfil, i el «Resum de l'excursió», a la dreta, en mostra la distància i el temps.",
  'help.guide.tour-edit-points.step.3':
    "Per canviar l'ordre, passa el ratolí per una fila i arrossega-la per l'agafador que apareix a la seva vora esquerra.",
  'help.guide.tour-shaping-points.goal': 'Fes passar la ruta per un altre camí sense afegir-hi cap parada.',
  'help.guide.tour-shaping-points.result':
    "La ruta passa per on l'has arrossegat, i les parades mantenen la numeració.",
  'help.guide.tour-loop-reverse.tip.3':
    'En una caminada, «Ruta circular des de l’inici», al costat, busca rutes circulars de la llargada que triïs.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Cap calculador de rutes no ha comprovat un tram dibuixat a mà: pot travessar aigua, terrenys privats o un penya-segat.',
  'help.guide.tour-trip-places.step.4':
    'Sota el nom, la fila diu «Lloc del viatge». «Desenllaça del lloc», a «Més accions», manté el punt però en treu el vincle.',
  'help.guide.tour-details-times.step.2': "A «Detalls», escriu una «Descripció» i afegeix un «Lloc web» si n'hi ha.",
  'help.guide.tour-save.goal': "Conserva al viatge l'excursió que has dibuixat.",
  'help.guide.tour-save.result': "L'excursió queda desada al viatge, llesta per posar-la en un dia.",
  'help.guide.tour-edit-saved.tip.2':
    "Una traça GPX o KML importada s'obre com a «Excursió GPX», per consultar-la. Des d'allà, «Planifica una versió editable» en crea una excursió que pots modificar.",
  'help.guide.tour-summary-profile.step.4':
    "«Replega el perfil d'altitud», la fletxa del costat del títol, amaga el perfil; torna-hi a fer clic per mostrar-lo.",
  'help.guide.tour-list-manage.step.2':
    'Passa el ratolí per una excursió i fes clic al més rodó de la seva fila, «Afegeix al dia», per obrir els dies del viatge.',
  'help.guide.tour-delete.title': 'Eliminar una excursió',
  'help.guide.tour-saved-elsewhere.title': "Quan l'excursió s'ha desat des d'un altre lloc",
  'help.guide.tour-saved-elsewhere.result': 'No es perd cap canvi tret que algú decideixi descartar-lo.',
  'help.guide.tour-import-gpx.title': 'Importar un fitxer GPX, KML o KMZ com a excursió',
  'help.guide.tour-import-gpx.tip.2':
    "Cada traça o ruta d'un fitxer es converteix en una excursió independent. Les traces no s'uneixen mai.",
  'help.guide.tour-view-import.step.2':
    "La columna de l'esquerra la mostra com a «Excursió GPX»: el «Resum de l'excursió» amb la distància, les altituds i el temps enregistrat, i a sota el perfil d'elevació. El mapa en mostra la línia.",
  'help.guide.tour-plan-from-import.step.1':
    "Obre l'excursió importada a la pestanya «Excursions». A la targeta «Versió editable» de l'esquerra, fes clic a «Planifica una versió editable».",
  'help.guide.tour-plan-from-import.result':
    "Ara l'excursió té punts de ruta que pots arrossegar, i el seu «Origen» diu «Replanificat, traça enregistrada conservada».",
  'help.guide.tour-restore-recorded.result':
    "L'excursió torna a ser una «Excursió GPX» i mostra la línia amb què es va enregistrar.",
  'help.guide.tour-take-over.step.6': 'Fes clic a «Agafar».',
  'help.guide.tour-import-wanderer.step.2':
    'Escriu a «Cerca senders». «Cerca en aquesta zona del mapa» només mostra els camins que són a la part visible del mapa.',
  'help.ctx.trip-tour-map.title': "Mapa de l'excursió",
  'help.guide.tour-map-layers.goal':
    "Planifica sobre el mapa que s'adigui millor al tipus d'excursió: corbes de nivell per a les pujades, senders senyalitzats o rutes ciclistes, o imatges aèries.",
  'help.guide.tour-along-search.title': "Trobar llocs al llarg d'una excursió",
  'help.guide.tour-along-search.tip.1':
    'Si canvies la ruta, els tipus de lloc o la distància, «Torna a cercar» es ressalta i indica que la llista es va obtenir per a la ruta anterior. Fes-hi clic per actualitzar la llista.',
  'help.guide.tour-along-add-stop.step.4':
    "La ruta es torna a planificar passant pel lloc, i «Al llarg de la ruta» indica quanta distància i quant temps s'ha afegit a l'excursió. «Desfer», a la mateixa línia, torna a treure la parada.",
  'help.guide.tour-3d-terrain.step.2':
    "La ruta s'acoloreix segons el pendent. Fes clic a «Pendent», a la fila de baix, per dibuixar-la amb el color de l'excursió, i torna-hi a fer clic per tornar a veure els pendents.",
  'help.guide.tour-3d-flyover.title': 'Sobrevolar una excursió',
  'help.guide.tour-3d-flyover.tip.2':
    "El sobrevol només comença quan s'ha carregat el relleu de tota la ruta, perquè no s'aturi a mig camí per carregar dades del mapa. Passa el ratolí per l'anell per veure quina part s'ha carregat.",
  'help.guide.tour-map-overlays.result':
    'Les pistes o els senyals nàutics es dibuixen sobre el mapa, i la llegenda els explica.',
  'help.ctx.trip-tour-stages.bullet.3':
    "El «Resum de l'excursió» mostra totes les etapes a «Etapes», des de la parada on comencen fins a la parada on acaben. Un clic en una etapa en selecciona l'última parada i marca el punt al perfil d'elevació.",
  'help.guide.tour-multi-day.step.4':
    'Ara «Punts de ruta» es divideix en «Etapa 1» i «Etapa 2», cadascuna amb la seva distància i el seu temps. La parada que acaba una etapa mostra una icona de lluna.',
  'help.guide.tour-stages-on-days.title': 'Posar una excursió de diversos dies als dies del viatge',
  'help.guide.tour-stages-on-days.tip.1':
    "Si el viatge acaba abans de l'última etapa, l'opció indica quina és l'última etapa que hi cap. Les etapes posteriors queden sense dia.",
  'help.ctx.trip-tour-hike.bullet.2':
    '«Punts de ruta» mostra les parades en ordre. «Afegeix un punt» està activat des del principi, de manera que un clic al mapa posa el punt següent; «Llocs del viatge», al costat, converteix un refugi o un hotel del viatge en una parada.',
  'help.guide.tour-hike-plan.step.2':
    'Obre «Tipus de ruta» i tria «Senderisme»: a peu, sense superar la dificultat que defineixis.',
  'help.guide.tour-hike-plan.tip.3':
    '«Elecció de ruta», sota la dificultat, defineix preferències per a la ruta: «Evitar pujades fortes», «Evita escales» i «Evita transbordadors». Si no hi ha cap altre camí, la ruta hi passa igualment.',
  'help.guide.tour-hike-trail-details.step.5':
    "Fes clic a «Ferm» per veure la mateixa ruta segons el terreny que trepitges, des de l'asfalt fins al terra natural i la roca.",
  'help.guide.tour-hike-round.step.2':
    "S'obre la targeta «Ruta circular» sobre el mapa. Comprova l'inici a «De» i escriu la «Distància» que vulguis. La pastilla del costat mostra l'interval de llargades que pot tenir una ruta circular.",
  'help.guide.tour-hike-compare-ways.title': "Comparar altres camins per a un tram d'una caminada",
  'help.guide.tour-hike-compare-ways.tip.2':
    "Quan el calculador de rutes no coneix cap altre camí, la targeta t'ho indica. Quan no pot seguir el camí que has triat, el tram es queda com estava i la targeta t'ho diu.",
  'help.guide.tour-ferrata-add.step.5':
    "El «Resum de l'excursió», a la dreta, mostra la insígnia «Via ferrada» amb el seu grau, i la capçalera de l'editor avisa: «La ruta passa per una via ferrada».",
  'help.guide.tour-run-plan.step.1': 'Fes clic a «Planifica una nova excursió», obre «Tipus de ruta» i tria «Córrer».',
  'help.guide.tour-run-plan.tip.3': 'Si les teves distàncies són en milles, el ritme també és per milla.',
  'help.guide.tour-run-ways.tip.1': "Res d'aquí no canvia la ruta de la cursa ni el seu temps.",
  'help.ctx.trip-tour-walk.bullet.5':
    "«Afegeix una ruta», a «Excursions d'aquest viatge», importa una ruta a peu compartida des de Google Maps. A la pestanya «Planificat», un passeig obert des del seu dia et permet marcar-ne les parades per a aquell dia.",
  'help.guide.tour-walk-plan.step.6':
    "El «Resum de l'excursió», a la dreta, mostra «Temps est.», «Estades» i «Planificat», que és la suma de tots dos. Fes clic a «Desa», a baix de la columna de l'esquerra, per conservar el passeig.",
  'help.guide.tour-walk-sights.step.2':
    "El tema omple «Què cercar». Obre'l per activar o desactivar tipus de lloc, i tria fins a quina distància vols buscar a «Dins d'aquesta distància de la ruta».",
  'help.guide.tour-walk-day-times.title': "Veure les hores d'arribada i els horaris d'obertura del dia",
  'help.guide.tour-walk-day-times.tip.3':
    "Els horaris d'obertura provenen d'OpenStreetMap o del lloc del viatge al qual correspon una parada, i la pastilla del costat indica d'on. Comprova'ls abans d'anar-hi.",
  'help.guide.tour-walk-google-import.step.4':
    'Fes clic a «Carrega com a passeig». TREK planifica pel seu compte el camí a peu entre les parades. Fes clic a «Desa» per conservar el passeig.',
  'help.guide.tour-walk-check-off.step.2':
    "Desplaça't fins a «Parades de la ruta». Cada parada mostra quanta estona t'hi estàs i, si el passeig té hora d'inici, a quina hora hi arribes.",
  'help.ctx.trip-tour-bike.summary':
    "Una ruta en bicicleta oberta a l'editor de la pestanya «Excursions»: el perfil per al qual es calcula, el temps de pedalada, per quin terreny passa la ruta i, en una ruta de BTT, quina dificultat tenen els seus camins.",
  'help.guide.tour-bike-profile.step.2': 'Obre el camp «Tipus de ruta» i tria «Ruta en bicicleta».',
  'help.guide.tour-bike-profile.tip.3':
    "Quan cap via per a bicicletes no passa a prop d'un punt, el carril mostra «No way for bikes reaches point N». Mou el punt, o obre «Més accions» al punt anterior i tria «Dibuixa a mà el tram següent».",
  'help.guide.tour-bike-surfaces.step.4':
    'A «Tipus de camí», fes clic a una fila com ara «Camí agrícola o forestal» o «Carretera amb trànsit» per veure per on hi passa la ruta.',
  'help.guide.tour-bike-mtb-grades.step.1':
    "Obre la ruta en bicicleta a l'editor i comprova que el «Perfil» sigui «BTT». Els graus dels camins només es llegeixen amb aquest perfil.",
  'help.ctx.trip-tour-ski.title': "Excursions d'esquí i hivern",
  'help.guide.tour-ski-plan.goal':
    "Planifica un dia a les pistes, un circuit d'esquí de fons, una travessa amb esquís o una sortida amb raquetes per les pistes, remuntadors i senders cartografiats.",
  'help.guide.tour-ski-plan.tip.2':
    "El punt d'informació del costat de «Disciplina» explica què fa TREK amb les excursions d'esquí. Ni allà ni enlloc d'aquí no s'indica res sobre la neu, les allaus o si les pistes, els remuntadors i els senders són oberts.",
  'help.guide.tour-ski-options.step.3':
    'A «Preferir», tria «La més ràpida», «Més esquí» o «Més fàcil». A «Ritme», tria «Tranquil», «Normal» o «Esportiu»: canvia el temps que el calculador assigna a cada pista.',
  'help.guide.tour-ski-fix-leg.goal':
    "Fes que un tram vermell es planifiqui amb un sol clic, o dibuixa'l en línia recta.",
  'help.guide.tour-ski-fix-leg.result':
    'Ja no hi ha cap tram vermell: cadascun segueix les pistes o va en línia recta entre els seus punts.',
  'help.guide.tour-ski-summary.tip.3':
    "Una excursió desada s'obre tal com es va desar. Mou un punt o canvia una opció per tornar-la a planificar amb les dades de pistes actuals.",
  'help.guide.tour-ski-pistes-layer.tip.1':
    "Si l'interruptor continua en gris i diu «Apropa el mapa per veure les pistes», apropa't a l'estació d'esquí.",
  'help.guide.tour-ski-import.step.3':
    'Tria la «Disciplina» i, per a «Esquí de fons», la «Tècnica». Fins que no ho facis, el diàleg mostra «Choose a discipline to import the track as ski».',
  'help.ctx.trip-tour-paddle.title': 'Rutes en piragua',
  'help.guide.tour-paddle-setup.title': 'Planificar una ruta en piragua',
  'help.guide.tour-paddle-setup.step.7':
    "Comprova que «Afegeix un punt» estigui activat i fes clic al mapa: primer el punt on entres a l'aigua, després els punts intermedis i, finalment, el punt on en surts.",
  'help.guide.tour-paddle-water-route.step.1':
    "Un tram dibuixat a mà mostra «Dibuixat a mà, sense calcular» sota el seu punt, amb la seva longitud. TREK manté la línia tal com l'has dibuixada.",
  'help.guide.tour-paddle-water-route.tip.4':
    "No pots desar mentre hi hagi un tram sense planificar. Primer planifica'l per l'aigua o dibuixa'l a mà.",
  'help.guide.tour-paddle-portage.step.5':
    "A «Sortida i entrada», escriu els minuts que necessites per sortir, descarregar i tornar a entrar a l'aigua. Si ho deixes buit, TREK hi posa 10 minuts.",
  'help.guide.tour-paddle-lock.step.2':
    'Tria «Resclosa en aquest punt». Sota el punt apareix una targeta «Resclosa», marcada amb «Falta el temps».',
  'help.guide.tour-paddle-time.goal':
    "Mira com se sumen el temps a l'aigua, el transport per terra, les rescloses i les pauses, i defineix els teus propis valors.",
  'help.guide.tour-paddle-time.tip.3':
    "Les pauses i un total previst propi es defineixen a «Detalls». Si hi ha un total previst, la targeta mostra «La teva durada planificada» al costat de l'estimació.",
  'help.guide.tour-paddle-wind.tip.1':
    'Només hi ha previsió per als pròxims 16 dies. Per a un dia més llunyà, indica a partir de quina data hi haurà previsió. Per a un dia que ja ha passat, ho indica.',
  'help.guide.tour-paddle-checklist.step.2':
    "La línia de sota indica com d'actuals són les dades: «Data OSM» per a OpenStreetMap, «Consultades» per a quan les va llegir TREK, i «Dades d’obstacles» on no cobreixen tota la ruta.",
  'help.guide.tour-paddle-checklist.tip.5':
    'Una llista de comprovació no és cap aprovació de seguretat ni legal. La teva decisió no anul·la cap prohibició ni cap terreny privat que consti a OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    "Fes clic a «Transport per terra» i després fes clic a la línia on vas sortir de l'aigua i on hi vas tornar a entrar.",
  'help.ctx.trip-tour-horse.summary':
    'Una ruta a cavall no es calcula mai. Es construeix amb trams dels itineraris eqüestres senyalitzats que coneix OpenStreetMap, units amb trams que dibuixes a mà, o es conserva exactament tal com la vas enregistrar.',
  'help.guide.tour-horse-plan.step.1':
    "Mostra al mapa la zona on vols muntar i després fes clic a «Planifica una nova excursió», a dalt de la columna de l'esquerra.",
  'help.guide.tour-horse-plan.tip.1':
    "Que hi hagi un itinerari eqüestre no vol dir que tinguis permís per recórrer-lo a cavall. «Accés a cavall» només mostra el que indiquen les etiquetes d'OpenStreetMap. Respecta sempre la senyalització del lloc.",
  'help.guide.tour-horse-gap.step.2':
    'Activa «Uneix amb un tram manual». El buit es dibuixa en línia recta i sense comprovar.',
  'help.guide.tour-horse-recorded.goal':
    'Importa una ruta que hagis enregistrat amb un dispositiu GPS o una aplicació, i conserva-la exactament tal com la vas fer.',
  'help.guide.tour-horse-recorded.tip.3':
    'També pots deixar anar el fitxer a qualsevol punt de la pestanya «Excursions» per obrir la mateixa previsualització.',
  'help.guide.create-trip.tip.3':
    'A «Companys de viatge» pots afegir persones que ja tenen un compte en aquest TREK. Passen a ser membres del viatge tan bon punt es crea.',
  'help.guide.trip-reminder.step.1':
    'Fes clic al llapis de la targeta del viatge. Per a un viatge nou, el formulari «Viatge nou» té la mateixa secció.',
  'help.guide.company-holidays.tip.2':
    "Un festiu de l'empresa de dia sencer elimina les vacances ja registrades aquell dia, perquè ningú no hi gasti dies de vacances.",
  'help.guide.half-company-holiday.tip.2':
    "Torna a fer clic al dia amb la mateixa configuració per desmarcar-lo, o amb «Mitja jornada» desactivat per convertir-lo en un festiu de l'empresa de dia sencer.",
  'help.guide.edit-holiday-calendar.step.1':
    'Obre «Configuració» i busca el calendari a «Festius» o «Vacances escolars».',
  'help.guide.person-color.goal': "Posa't a tu o a algú amb qui planifiques un color que es distingeixi més fàcilment.",
  'help.guide.answer-fusion-request.tip.2':
    'Qualsevol de vosaltres pot desfer la fusió més endavant, i les entrades es conserven.',
  'help.guide.log-for-partner.tip.2':
    "L'altra persona veu el canvi a l'instant, i la seva fila de «Dret» s'actualitza de seguida.",
  'help.guide.country-places.title': "Veure tots els llocs d'un país",
  'help.guide.tour-activity-stats.step.1':
    "Al panell de baix del mapa, obre la pestanya «Excursions», al costat d'«Estadístiques» i «Llista de desitjos».",
  'help.guide.tour-activity-stats.tip.2':
    "Vincula la traça que vas fer realment amb «Afegeix el traç real» al detall de l'excursió, i aquí els valors enregistrats substituiran els planificats. Una excursió planificada en diversos dies compta una sola vegada.",
  'help.ctx.collections.bullet.7':
    "Excursions desades: les excursions que has desat d'un viatge són les primeres files d'una llista, amb el grau, el tipus, el viatge d'on provenen i les seves mesures. «Afegeix a un viatge» en crea una excursió nova, i la icona de la paperera la treu de la llista.",
  'help.guide.move-to-list.title': 'Moure o duplicar llocs a una altra llista',
  'help.guide.copy-to-trip.tip.2': "Els llocs que el viatge ja té s'ometen, i TREK indica quants se n'han omès.",
  'help.guide.accept-list-invite.tip.2':
    "Fes clic a «Compartit», a dalt de la llista, per veure'n els membres. Des d'allà, «Sortir de la llista» et permet tornar a sortir-ne.",
  'help.guide.tour-collection-add-to-trip.goal':
    "Crea una excursió nova en un dels teus viatges a partir d'una excursió desada en una llista, amb els seus punts de ruta o sense.",
  'help.guide.tour-collection-add-to-trip.result':
    "El diàleg confirma que l'excursió ja pertany a aquell viatge. «Obre el viatge» t'hi porta i «Tanca» et deixa a «Col·leccions».",
  'help.guide.tour-collection-manage.tip.3':
    'Les excursions desades només apareixen a la seva llista, no a «Tot el desat».',
  'help.guide.search-journey.step.3':
    "Fes clic a un dia per anar-hi, o a la seva fletxa per veure les entrades d'aquell dia i triar-ne una.",
  'help.guide.journey-map-layers.goal': 'Distingeix el pla del que va passar realment, i activa o desactiva capes.',
  'help.guide.journey-keep-route.goal':
    "Afegeix al mapa de la travessia la ruta real d'un dia des de Dawarich i conserva-la-hi.",
  'help.guide.journey-day-stays.goal': 'Converteix en entrades, una per una, les estades que ha enregistrat Dawarich.',
  'help.guide.journey-take-over-day.goal':
    "Converteix les estades d'un dia en esborranys d'entrada, o en una sola crònica del dia, d'un sol cop.",
  'help.guide.journey-auto-prepare.title': 'Fer que TREK prepari els teus dies enregistrats',
  'help.guide.photo-location.title': 'Situar les entrades on es van fer les fotos',
  'help.ctx.settings-about.summary':
    "Què és TREK, quina versió fa servir aquest servidor i on trobar el projecte: la documentació, on informar d'errors i les maneres de donar suport al projecte.",
  'help.guide.startup.tip.2':
    "Si la pestanya d'inici pertany a un complement que has desactivat, s'obre el pla en el seu lloc.",
  'help.guide.web-push-device.title': 'Rebre notificacions push en aquest dispositiu',
  'help.guide.connect-airtrail.tip.1': "La targeta només apareix si l'administrador té activat el complement AirTrail.",
  'help.guide.connect-dawarich.tip.1':
    "TREK només suggereix entrades, llocs i països; no s'afegeix res fins que no ho confirmes, i no s'escriu res a Dawarich.",
  'help.guide.tour-connect-wanderer.tip.1':
    "La targeta només apareix si l'administrador permet wanderer a «Excursions».",
  'help.guide.tour-wanderer-watch.tip.1':
    "Un avís no canvia mai una excursió; la comprovació de la font de l'excursió mostra què ha canviat de veritat.",
  'help.guide.api-keys.tip.3':
    'Envia la clau com a Authorization: Bearer o X-API-Key a /api/v1. Cada compte pot tenir fins a 10 claus.',
  'help.guide.plugin-settings.step.2':
    '«Activitat dels connectors» mostra totes les accions que un connector ha fet en nom teu, de la més recent a la més antiga; «Actualitzar» carrega les últimes.',
  'help.ctx.admin-github.bullet.3':
    "«Quant a»: Ko-fi, Buy Me a Coffee, Discord, «Informa d'un error», «Sol·licita una funció» i la Wiki.",
  'help.guide.default-user-settings.goal':
    "Dona a tots els comptes unes unitats, un mode de color i una divisa adequats sense que ningú hagi d'obrir «Configuració».",
  'help.guide.default-map.step.3':
    "Cada camp es desa en sortir-ne. L'enllaç «Restaurar» del costat del nom d'un camp torna al valor per defecte de TREK.",
  'help.guide.own-routing-engine.tip.2':
    "Si només hi ha definit el teu motor de rutes propi, tampoc no es fa servir el Valhalla públic. L'enllaç «Restaurar» del costat d'un camp el torna a buidar.",
  'help.guide.admin-passkeys.step.1':
    "A la pestanya «Configuració», a «Inici de sessió amb clau d'accés», activa «Activar inici de sessió amb clau d'accés».",
  'help.guide.storage-backends.step.4':
    "«Salut», a dalt, mostra les escriptures fallides a un destí de rèplica. Si diu «No s'ha registrat cap fallada de rèplica.», tot funciona correctament.",
  'help.guide.channels-instance.tip.3':
    "Web Push necessita HTTPS. A l'iPhone i l'iPad, primer cal afegir TREK a la pantalla d'inici.",
  'help.guide.notification-defaults.step.1':
    "A la pestanya «Notificacions», desplaça't fins a «Valors per defecte dels usuaris», a baix de tot. Cada fila és un esdeveniment i cada columna, un canal.",
  'help.ctx.notifications.bullet.1':
    'La campana de dalt a la dreta compta les notificacions que encara no has llegit. Fes-hi clic per veure les deu més recents, i fes clic a «Mostra totes les notificacions», a baix, per anar a aquesta pàgina.',
  'help.guide.read-notifications.step.2':
    'El panell mostra les deu més recents. Cadascuna indica qui ha fet què i on, i les no llegides tenen el fons ressaltat.',
  'help.guide.filter-notifications.step.2': 'A baix del panell, fes clic a «Mostra totes les notificacions».',
  'help.guide.mark-notifications-read.tip.1': 'Obrir una notificació amb el seu botó també la marca com a llegida.',
  'help.guide.delete-notifications.tip.2':
    'Una notificació eliminada no es pot recuperar. Per amagar una notificació sense perdre-la, marca-la com a llegida i fes servir «No llegides».',
  'help.guide.notification-settings.tip.2':
    "No hi ha opcions per viatge: cada interruptor s'aplica a tots els teus viatges.",
  'help.guide.link-journal.title': 'Vincular un diari al viatge',
  'help.guide.link-journal.tip.2':
    "A partir d'aleshores, les persones a qui dones accés també veuen el diari a la seva llista de «Travessia».",
  'help.ctx.trip-places.bullet.8':
    'Amb Dawarich connectat, «Des de Dawarich», a dalt de la llista, mostra les estades que Dawarich ha enregistrat durant el viatge. «Afegeix-ho com a lloc» converteix una estada en un lloc, i «No és un lloc que hagi visitat» la treu de la llista.',
  'help.guide.dawarich-stays.step.4':
    'Si una estada no va ser una visita de veritat, fes clic a «No és un lloc que hagi visitat», la x del costat, per treure-la. «Mostra … ja tractades», a baix de la llista, mostra les estades que has afegit o tret. «Torna-ho a posar» torna a la llista una estada que havies tret.',
  'help.guide.leave-stop-off-route.tip.1':
    "Aquesta opció només la tenen les parades amb coordenades, i només s'aplica a aquest dia: el mateix lloc en un altre dia continua formant part de la ruta.",
  'help.guide.move-booking-day.title': 'Moure una reserva a un altre dia',
  'help.guide.place-image-from-file.step.4':
    'Ara la foto és la imatge del lloc. Fes clic a la petita X vermella de la cantonada per treure-la.',
  'help.guide.place-own-hours.step.2': 'Sota «Lloc web», omple «Telèfon» i «Correu electrònic» si els saps.',
  'help.guide.add-accommodation.tip.4':
    "Una manera més ràpida: el + de la capçalera del dia, amb el text d'ajuda «Afegeix al dia», té «Afegeix un allotjament». Obre el dia amb aquest formulari ja obert.",
  'help.guide.confirm-stay-booking.goal':
    "Marca com a confirmada la reserva d'hotel d'una estada, directament des del dia.",
  'help.guide.map-whole-trip.tip.4':
    "Si es mostra tot el viatge o no es desa per a cada viatge al teu compte, de manera que el viatge s'obre igual en un altre navegador.",
  'help.guide.tour-map-lines.step.3':
    "Obre a la columna de dies un dia en què sigui l'excursió, i l'excursió passarà a formar part de la ruta del dia: la ruta va fins on comença l'excursió i continua des d'on acaba.",
  'help.guide.car-stops.goal':
    "Indica la recollida, la devolució i les parades intermèdies d'un cotxe de lloguer o del teu cotxe.",
  'help.guide.car-stops.tip.1':
    'No hi ha cap tipus específic per al lloguer: tant un cotxe de lloguer com el teu són un «Cotxe».',
  'help.guide.transport-details.result':
    "«Planificat» s'obre al dia del trajecte, amb la seva línia dibuixada al mapa i la icona de ruta de la seva fila activada.",
  'help.guide.export-transports-csv.step.2':
    "Fes clic a la icona del full de càlcul, després d'«Opcions de vista», amb el text d'ajuda «Exporta com a full de càlcul (CSV)».",
  'help.guide.group-sort-bookings.title': 'Agrupar i ordenar les reserves',
  'help.guide.group-sort-bookings.tip.2':
    "A «Cronologia», el mateix botó conté «Un carril per tipus» i «Mostrar l'altra pestanya».",
  'help.guide.booking-on-map.result':
    "El detall es tanca i la pestanya «Planificat» s'obre al dia de la reserva, amb el seu lloc seleccionat al mapa.",
  'help.guide.export-bookings-csv.step.1':
    'Per exportar només una part de la pestanya, filtra-la primer amb «Cercar» o «Filtra». El fitxer conté exactament el que mostra la pestanya.',
  'help.guide.import-booking-file.tip.4':
    "Per llegir una confirmació cal connexió. Sense connexió, «Importa» t'ho indica, i ho pots tornar a provar quan TREK torni a estar en línia.",
  'help.guide.arrange-packing-list.step.1':
    "Arrossega l'agafador de l'extrem esquerre de la capçalera d'una llista, davant del punt de color, i deixa anar la llista sobre una altra targeta. Un contorn del teu color d'accent marca la targeta de destinació, i la llista n'ocupa el lloc per a tots els membres del viatge.",
  'help.guide.count-packed-pieces.title': "Empaquetar diverses unitats d'un article",
  'help.guide.count-packed-pieces.tip.2':
    "Amb «Seguiment d'equipatge» activat, «Preparats», a la targeta «Equipatge», només compta les peces que ja has comptat.",
  'help.guide.packing-bags.tip.4':
    "El pes d'una bossa que porten diverses persones es reparteix a parts iguals entre elles a «Per persona». Aquest pes apareix subratllat amb punts i, si hi passes el ratolí, mostra una nota que ho explica.",
  'help.guide.expense-receipts.step.1':
    "Fes clic al llapis del costat de la fila de la despesa. S'obre l'editor amb la despesa, i «Rebuts i factures» és a prop de la part de baix.",
  'help.guide.expense-receipts.tip.3':
    'Per adjuntar cal connexió i permís per pujar fitxers, perquè el rebut es desa com un dels fitxers del viatge.',
  'help.guide.files-sync-settings.title': 'Triar el sentit de sincronització dels documents',
  'help.guide.files-sync-settings.tip.1':
    "Sempre n'hi ha un carril activat: si fas clic a l'únic carril que queda activat, no passa res.",
  'help.guide.manage-notes.title': 'Llegir, fixar i editar una nota',
  'help.guide.manage-notes.tip.1':
    '«Ampliar» només apareix al menú quan la nota té text. Un membre que no pot editar «Col·laboració» només veu «Ampliar».',
  'help.guide.note-categories.step.5':
    "Fes clic a «Desa». Totes les notes d'una categoria amb nom o color nous canvien alhora, per a tots els membres. «Cancel·la» descarta els canvis.",
  'help.guide.trip-chat.tip.5':
    'El xat mostra primer els missatges més recents. «Carrega missatges anteriors», a dalt del xat, carrega els missatges anteriors.',
  'help.guide.roadtrip-reorder.result':
    "Les parades queden en l'ordre que has triat, i es tornen a calcular la distància, el temps de conducció i les hores d'arribada de cada dia que has modificat.",
  'help.guide.roadtrip-overnight.goal': 'Troba un lloc per dormir pel camí i afegeix la nit al trajecte com a reserva.',
  'help.guide.roadtrip-overnight.tip.2':
    "Si tornes a posar una nit reservada a «Parada», des d'«Edita» a la seva targeta, primer et pregunta «Treure la pernoctació?». «Converteix en pausa» elimina la nit, amb la reserva i qualsevol despesa vinculada, i manté la parada al trajecte.",
  'help.guide.roadtrip-stop-fill.tip.2':
    'Si tries el valor que la parada ja té, la parada torna al teu valor per defecte.',
  'help.guide.roadtrip-bookings.tip.1':
    "L'hora d'arribada a la terminal s'avança respecte de l'horari per tenir temps de fer el registre: una hora per a un vol o un creuer, mitja hora per a un ferri, i deu minuts per a un tren o un autobús.",
  'help.guide.roadtrip-google-import.step.2':
    "Enganxa l'enllaç d'una ruta que hagis compartit des de Google Maps i fes clic a «Vista prèvia».",
  'help.guide.roadtrip-hazards.goal':
    'Consulta al mapa els avisos meteorològics i les alertes de desastres a la zona del teu trajecte.',
  'help.ctx.trip-tours.title': 'Excursions al pla',
  'help.guide.tour-show-list.title': 'Mostrar les excursions del viatge al pla',
  'help.guide.tour-show-list.tip.2':
    'Encara no hi ha excursions? «Importa GPX o KML», a dalt de la llista, importa un fitxer, i «Planifica una nova excursió», a la pestanya «Excursions», en crea una de nova.',
  'help.guide.tour-add-to-day.step.4':
    "També pots arrossegar la fila fora de la llista i deixar-la anar en un dia de la columna de l'esquerra. Si la deixes anar entre dues parades, es posa just allà.",
  'help.guide.tour-day-times.goal':
    'Mira a quina hora acaba una excursió i si se solapa amb el que ve després aquell dia.',
  'help.guide.tour-day-times.tip.4':
    "«Desar a la col·lecció», al mateix menú, desa l'excursió en una col·lecció amb la seva ruta, igual que el botó «Col·lecció» de la targeta.",
  'help.guide.tour-remove-from-day.tip.2':
    "En aquests menús i a la targeta no hi ha «Elimina». Les excursions s'eliminen a la pestanya «Excursions», amb la paperera de la seva fila a «Excursions d'aquest viatge».",
  'help.guide.tour-filter-list.tip.1':
    '«Límit de ruta» és la dificultat màxima que es va permetre en planificar la ruta, no la dificultat mesurada al sender.',
  'help.guide.tour-hide-on-map.step.3':
    "Mentre hi ha alguna excursió amagada, una línia sobre la llista diu «Amagada al mapa» i quantes n'hi ha. «Mostra-les totes» les torna a mostrar totes alhora.",
  'help.guide.tour-import-plan-tab.step.3':
    'La «Previsualització de la importació» mostra cada traça abans de desar res. A «Importa com a», tria el tipus («Senderisme», «Ruta en bicicleta», etc.) i després fes clic a «Importa 1 excursió».',
  'help.ctx.trip-tour-detail.bullet.3':
    "A sota hi ha «Dies del viatge», amb una casella per a cada dia en què és l'excursió, les mesures amb el perfil d'elevació i, si escau: les parades d'un passeig urbà, les comprovacions i el vent d'una ruta en piragua, «Traç real», «Llista d'equipatge», «Descripció», «Notes», «Origen» i «Fitxers».",
  'help.guide.tour-detail-read.step.4':
    "«Dies del viatge» mostra una casella per a cada dia en què és l'excursió, amb la seva data. «Encara no és en cap dia del viatge» vol dir que encara no està planificada.",
  'help.guide.tour-detail-read.tip.5':
    "Al telèfon, la targeta s'obre com un full des de baix, per consultar-la i per endur-te l'excursió.",
  'help.guide.tour-rename-colour.tip.1':
    "El nom i el color pertanyen al viatge, així que els veu tothom qui hi participa. Per amagar una excursió al teu mapa sense canviar-la per a ningú més, fes servir l'ull de la llista d'«Excursions».",
  'help.guide.tour-take-along.tip.1':
    'En un dispositiu que pot compartir fitxers, apareix «Compartir» al costat de GPX, que envia el mateix fitxer directament a una altra aplicació.',
  'help.guide.tour-copy-keep.step.2':
    "La còpia s'obre de seguida, amb el nom de l'original seguit de (còpia). Fes clic al llapis per posar-li un nom propi.",
  'help.guide.tour-packing-link.title': "Vincular una excursió a la llista d'equipatge",
  'help.guide.tour-packing-link.tip.2':
    "«Canvia», a la capçalera de la secció, vincula l'excursió a una altra llista. «Elimina l'enllaç», en aquell diàleg, elimina el vincle, i la llista no canvia.",
  'help.guide.tour-files.tip.1':
    'Els fitxers també són fitxers del viatge, així que també apareixen a la pestanya «Fitxers».',
  'help.guide.tour-activity-link.step.4': 'Revisa el que ha mesurat a «Real» i després fes clic a «Vincula».',
  'help.guide.tour-activity-compare.step.1':
    "Obre la targeta de l'excursió. «Pla i real» mostra la «Distància», el «Desnivell positiu», el «Desnivell negatiu» i el «Temps amb pauses» del pla al costat dels de la traça, amb la «Diferència».",
  'help.guide.tour-origin-check.goal':
    "Esbrina si una excursió es va dibuixar a TREK o es va importar, de quin fitxer, i si ha canviat des d'aleshores.",
  'help.ctx.trip-tour-planner.title': 'Excursions',
  'help.guide.tour-open-workspace.title': 'Orientar-se a la pestanya «Excursions»',
  'help.guide.tour-open-workspace.step.7':
    "Fes clic a una excursió del carril de la dreta. Una excursió planificada a TREK s'obre a l'editor. Una traça importada s'obre sense canvis, com a «Excursió GPX», per consultar-la.",
  'help.guide.tour-draw-route.step.2':
    "Escriu on comença l'excursió a «Cerca un lloc o una adreça» i tria el resultat. El mapa s'hi desplaça.",
  'help.guide.tour-draw-route.tip.4':
    'Els esborranys sense desar es conserven. Torna a obrir la pestanya «Excursions» del viatge i es recuperarà amb el missatge «Esborrany sense desar restaurat».',
  'help.guide.tour-type-profile.tip.1':
    "Un canvi de tipus compta com un pas a l'historial: «Desfés el canvi al punt de pas», a la capçalera del carril, recupera el tipus anterior i la seva ruta.",
  'help.guide.tour-edit-points.step.4':
    'També pots obrir «Més accions» (els tres punts) a la fila i triar «Mou el punt de pas amunt» o «Mou el punt de pas avall».',
  'help.guide.tour-shaping-points.step.1':
    'Fes clic a la ruta dibuixada al mapa allà on vulguis que passi per un altre lloc. Hi apareix un puntet: un punt de forma.',
  'help.guide.tour-loop-reverse.title': "Fer una ruta circular o invertir l'excursió",
  'help.guide.tour-loop-reverse.result':
    'Una volta que acaba on ha començat, o la mateixa excursió en sentit contrari.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Un punt al qual no arriba cap camí mostra un avís amb «Show point» i el seu número. Mou el punt fins a un camí, o dibuixa a mà el tram que hi porta.',
  'help.guide.tour-trip-places.tip.1':
    "Un lloc que ja és a l'excursió queda marcat amb «A l’excursió» i no es pot triar dues vegades.",
  'help.guide.tour-details-times.step.3': "Introdueix les «Pauses», per exemple 0:45. S'afegeixen al temps estimat.",
  'help.guide.tour-save.step.1': "Escriu un nom a «Nom de l'excursió». Sense nom, «Desa» queda en gris.",
  'help.guide.tour-edit-saved.title': 'Modificar una excursió desada',
  'help.guide.tour-edit-saved.tip.3':
    '«Baixa el GPX» i «Desar en una col·lecció», a la capçalera del carril, funcionen un cop desats els canvis.',
  'help.guide.tour-summary-profile.tip.1': 'Fes clic al títol de la targeta per plegar tot el resum.',
  'help.guide.tour-list-manage.step.3': "Tria el dia. L'excursió s'afegeix a aquell dia, i la seva fila mostra el dia.",
  'help.guide.tour-delete.goal': 'Elimina definitivament una excursió del viatge.',
  'help.guide.tour-saved-elsewhere.goal':
    "Decideix què passa quan algú altre ha desat l'excursió mentre tu la modificaves.",
  'help.ctx.trip-tour-import.title': 'Importar excursions',
  'help.guide.tour-import-gpx.goal':
    "Converteix una traça d'un rellotge GPS, d'una aplicació o de Google Earth en una excursió del viatge, revisant-la abans de desar res.",
  'help.guide.tour-import-gpx.tip.3': "Una traça que el viatge ja té apareix en gris com a «Ja és al viatge» i s'omet.",
  'help.guide.tour-view-import.step.3': "«Torna a excursions», la fletxa de dalt a l'esquerra, la torna a tancar.",
  'help.guide.tour-plan-from-import.step.2':
    'TREK agafa punts de control de la traça i torna a calcular-ne la ruta. El mapa dibuixa la importació amb línia de punts i el suggeriment amb línia contínua, i la targeta en compara les longituds, la proporció «Dins de 50 m de la traça» i la «Desviació màxima».',
  'help.guide.tour-restore-recorded.title': 'Tornar a la traça enregistrada',
  'help.guide.tour-take-over.title': "Agafar una excursió d'un altre viatge",
  'help.guide.tour-take-over.tip.1':
    "La còpia és una excursió independent. Encara no és en cap dia, i els canvis posteriors a l'original no afecten la còpia, ni a l'inrevés. El seu «Origen» indica el viatge d'on s'ha agafat.",
  'help.guide.tour-import-wanderer.step.3':
    'Fes clic a un camí. Apareix al mapa, i la columna mostra les mesures del seu fitxer GPX, la descripció i si és públic o privat a wanderer.',
  'help.ctx.trip-tour-map.summary':
    "El mapa del centre de la pestanya «Excursions», per a l'excursió que tens oberta: els mapes adequats al seu tipus, les pistes o els senyals nàutics superposats, els llocs al llarg de la ruta i la mateixa excursió en 3D sobre el relleu real.",
  'help.guide.tour-map-layers.step.1':
    "Obre la pestanya «Excursions» i fes clic a una excursió d'«Excursions d'aquest viatge», a la dreta. S'obre al planificador, i la pastilla de baix a l'esquerra del mapa mostra els mapes que ofereix aquest tipus d'excursió.",
  'help.guide.tour-along-search.goal':
    "Busca miradors, fonts, refugis o un lloc per menjar a prop de la ruta de l'excursió que estàs planificant.",
  'help.guide.tour-along-search.tip.2':
    'En un passeig urbà, quatre temes de sobre la llista et seleccionen els tipus de lloc adequats.',
  'help.guide.tour-along-add-stop.result':
    "Ara l'excursió passa pel lloc, amb la nova distància i el nou temps al «Resum de l'excursió». Desa l'excursió per conservar el canvi.",
  'help.guide.tour-3d-terrain.step.3':
    "Fes clic a la pastilla «Distribució dels pendents», a la dreta. Es desplega i mostra quina part de l'excursió té un pendent de «menys del 5 %», «del 5 al 10 %», «del 10 al 18 %», «del 18 al 27 %» i «27 % o més». Plegada, mostra el punt més alt i el tram de més pendent.",
  'help.guide.tour-3d-flyover.goal':
    "Mira tota l'excursió de l'inici al final abans de fer-la a peu, en bicicleta o amb esquís.",
  'help.guide.tour-3d-flyover.tip.3':
    "Mentre el vol està en pausa, mou-te pel perfil d'elevació per portar el punt fins a aquell lloc. «Reprodueix el sobrevol» continua des d'allà.",
  'help.guide.tour-map-overlays.tip.1':
    "Les pistes són dades cartogràfiques, no un informe en directe: no indiquen què és obert o trepitjat, com està la neu ni res sobre allaus. Quan t'allunyes més enllà de l'estació d'esquí, l'interruptor diu «Apropa el mapa per veure les pistes».",
  'help.ctx.trip-tour-stages.bullet.4':
    "A «Excursions d'aquest viatge», una excursió de diversos dies mostra una lluna amb el nombre d'etapes. Aquest botó, «Mostra les etapes», desplega la llista d'etapes amb el dia en què és cadascuna i els totals de «Ruta sencera».",
  'help.guide.tour-multi-day.step.5':
    "El «Resum de l'excursió» mostra totes les etapes a «Etapes». Fes clic en una per veure on acaba: se'n selecciona l'última parada i el perfil d'elevació en marca el punt.",
  'help.guide.tour-stages-on-days.goal': "Posa cada etapa en un dia diferent, o tota l'excursió en un sol dia.",
  'help.guide.tour-stages-on-days.tip.2':
    "«Ruta sencera en aquest dia» apareix en gris en un dia que ja té l'excursió. «Etapes a partir d’aquest dia» continua funcionant aquell dia i substitueix l'excursió sencera en aquell dia.",
  'help.ctx.trip-tour-hike.bullet.3':
    'La capçalera de la targeta «Punts de ruta» té les eines de ruta: «Inverteix el sentit», «Torna a l’inici» i, en una caminada, «Ruta circular des de l’inici». «Més accions», en una parada, té «Compara camins del tram següent».',
  'help.guide.tour-hike-plan.step.3': "Escriu un nom a «Nom de l'excursió».",
  'help.guide.tour-hike-plan.tip.4':
    'El temps a peu segueix la regla dels pals indicadors de senderisme (DIN 33466) i no inclou les pauses. Afegeix-les a «Pauses», dins de «Detalls», i apareixeran al total previst.',
  'help.guide.tour-hike-trail-details.result':
    'Saps quin grau té cada part de la caminada, de quin terreny és i on es troba al mapa.',
  'help.guide.tour-hike-round.step.3':
    'Fes clic a «Cerca rutes». «Volta A», «Volta B», etc. apareixen a la llista i al mapa, cadascuna amb el seu color.',
  'help.guide.tour-hike-compare-ways.goal':
    "Mira quins altres camins pot seguir una caminada entre dues parades, i tria'n un.",
  'help.guide.tour-hike-compare-ways.tip.3': '«Cancel·la» tanca la targeta sense canviar la ruta.',
  'help.guide.tour-ferrata-add.result':
    "La caminada segueix la via ferrada per la seva pròpia línia d'OpenStreetMap. Fes clic al mapa per continuar des de dalt. El calculador de rutes només planifica el camí fins a la via ferrada i el de després.",
  'help.guide.tour-run-plan.step.2':
    'Tria un «Perfil»: «Córrer» per a vies sobretot asfaltades a la ciutat, als parcs i a la vora dels rius, i «Curses de muntanya» per a pistes forestals i senders naturals.',
  'help.guide.tour-run-plan.tip.4':
    '«Curses de muntanya» fa servir camins fins al senderisme de muntanya (T2), mai més difícils.',
  'help.guide.tour-run-ways.tip.2':
    'Canvia el «Perfil» a «Curses de muntanya» perquè la ruta passi més per senders naturals, o a «Córrer» perquè vagi per terreny ferm.',
  'help.guide.tour-walk-plan.title': 'Planificar un passeig urbà de parada en parada',
  'help.guide.tour-walk-plan.tip.1':
    "L'anell al voltant del número d'una parada n'indica la importància: continu per a «Imprescindible» i discontinu per a «Opcional». Un petit escut marca una parada «Protegida».",
  'help.guide.tour-walk-sights.step.3':
    "Fes clic a «Cerca al llarg de la ruta». Una estrella davant d'un nom marca un «Imprescindible», un dels llocs més coneguts de la zona.",
  'help.guide.tour-walk-day-times.goal':
    'Sàpigues a quina hora arribes a cada parada el dia del passeig, i quins llocs seran tancats en aquell moment.',
  'help.guide.tour-walk-day-times.tip.4':
    "Dos passejos el mateix dia: a la pestanya «Planificat», fes clic al tram que hi ha entre tots dos («Canvia el mitjà de transport») i tria «Transport públic». La cerca comença on acaba el primer passeig, a l'hora en què acaba, i t'avisa si una connexió arriba després que comenci el passeig següent.",
  'help.guide.tour-walk-google-import.tip.1':
    'Només es llegeixen rutes planificades a peu. Canvia Google Maps al mode a peu abans de compartir-la.',
  'help.guide.tour-walk-check-off.step.3':
    'Fes clic a «Marca com a visitat» en una parada que ja has vist, o a «Omet» en una que no faràs.',
  'help.ctx.trip-tour-bike.bullet.1':
    '«Perfil», sota «Tipus de ruta», indica per a quin tipus de ciclisme planifica el calculador de rutes: «Cicloturisme», «Carretera», «Grava» o «BTT». La línia de sota explica què busca el calculador, i si el canvies, es torna a planificar tota la ruta.',
  'help.guide.tour-bike-profile.step.3':
    'A «Perfil», tria «Cicloturisme», «Carretera», «Grava» o «BTT». La línia de sota explica què busca el calculador de rutes amb aquest perfil.',
  'help.guide.tour-bike-profile.tip.4':
    "«Desa» queda en gris fins que l'excursió té nom i la ruta i les altituds estan calculades.",
  'help.guide.tour-bike-surfaces.result':
    "El mapa marca els trams de la fila que has triat, i saps per quins ferms passa la ruta. L'excursió no canvia.",
  'help.guide.tour-bike-mtb-grades.step.2':
    "A la targeta «Ferm i camins», consulta «Grau del corriol (mtb:scale)»: la proporció de la ruta des de «S0, sense dificultat especial» fins a «S4 o més, terreny d'experts».",
  'help.ctx.trip-tour-ski.summary':
    "Una excursió del tipus «Esquí i hivern» a la pestanya «Excursions»: un dia a les pistes, un circuit d'esquí de fons, una travessa amb esquís, una sortida amb raquetes o una caminada d'hivern. Els seus trams segueixen les pistes, els remuntadors i els senders cartografiats a OpenStreetMap, planificats pel calculador de pistes segons la teva disciplina i els teus límits, i una traça d'esquí enregistrada s'importa amb la seva disciplina.",
  'help.guide.tour-ski-plan.step.1':
    "A la pestanya «Excursions», fes clic a «Planifica una nova excursió», a dalt del carril de l'esquerra.",
  'help.guide.tour-ski-plan.tip.3':
    "Si canvies la disciplina més endavant, els punts es mantenen i els trams es tornen a planificar amb les opcions d'aquella disciplina.",
  'help.guide.tour-ski-options.step.4':
    'Fes servir els interruptors: «Fer servir remuntadors», «Permetre rutes freeride», «Baixar amb remuntador si cal» i «Evitar enllaços suposats». «Esquí de fons» hi afegeix «Només circuits trepitjats» i «Només circuits il·luminats», i «Esquí de muntanya», «Pujar pel marge de la pista».',
  'help.guide.tour-ski-fix-leg.step.1':
    'Un tram que el calculador no ha pogut planificar mostra una fila vermella sota el seu punt amb el motiu, per exemple «Only a lift you left out joins these points», i la pista o el remuntador afectats.',
  'help.guide.tour-ski-summary.title': "Consultar la ruta per pistes d'una excursió d'esquí",
  'help.guide.tour-ski-summary.tip.4':
    "A baix de la targeta hi ha el nom de les estacions d'esquí i la data de les dades del mapa amb què es va planificar l'excursió.",
  'help.guide.tour-ski-pistes-layer.tip.2':
    "Si les pistes deixen de carregar-se, l'interruptor mostra un senyal d'avís. El mapa i la teva ruta continuen funcionant.",
  'help.guide.tour-ski-import.step.4': 'Fes clic a «Importa 1 excursió».',
  'help.ctx.trip-tour-paddle.summary':
    "Una ruta en caiac, canoa o SUP per un riu o un llac. Indica l'embarcació i el tipus d'aigua, segueix l'aigua on TREK en té dades, compta els transports per terra i les rescloses en el temps previst, i mostra el vent del dia que remes i el que se sap dels obstacles del recorregut.",
  'help.guide.tour-paddle-setup.goal':
    'Comença una ruta en caiac, canoa o SUP i indica amb què remes, per quina aigua i a quina velocitat.',
  'help.guide.tour-paddle-setup.tip.1':
    "Amb «Vaixell» posat a «Altres» no hi ha velocitat suggerida. Introdueix-ne una, o el temps a l'aigua es quedarà buit.",
  'help.guide.tour-paddle-water-route.step.2':
    "Perquè un tram es planifiqui per l'aigua, passa el ratolí per la parada anterior i fes clic a «Més accions», els tres punts.",
  'help.guide.tour-paddle-water-route.result':
    "Cada tram segueix l'aigua o està dibuixat a mà expressament, i un tram que TREK no ha pogut planificar n'explica el motiu.",
  'help.guide.tour-paddle-portage.tip.1':
    'Si al final vols fer aquell tram remant, torna a obrir «Més accions» al punt i tria «Torna a remar aquest tram». Torna a ser un tram dibuixat a mà.',
  'help.guide.tour-paddle-lock.step.3': 'Fes clic a la targeta «Resclosa» per obrir-la.',
  'help.guide.tour-paddle-time.step.1':
    "«Estimació de temps» és a la columna de l'esquerra, sota els punts de ruta. La insígnia de la capçalera és el total, amb les pauses incloses.",
  'help.guide.tour-paddle-time.result': "L'estimació compta el que has introduït i indica què hi falta encara.",
  'help.guide.tour-paddle-wind.tip.2':
    'Una excursió de diversos dies mostra una fitxa «Dia» per a cada dia a la capçalera de la targeta. Fes-hi clic per veure aquell dia.',
  'help.guide.tour-paddle-checklist.step.3':
    "Les entrades segueixen la ruta: assuts, rescloses, ràpids, punts d'entrada a l'aigua i normes d'accés d'OpenStreetMap, i els teus propis transports per terra i rescloses, marcats com a «Propi».",
  'help.guide.tour-paddle-checklist.result':
    'Cada entrada de la ruta té una decisió, i has llegit la nota de seguretat.',
  'help.guide.tour-paddle-track-marks.step.6': 'Fes clic a «Resclosa» i després fes clic a la línia on és la resclosa.',
  'help.ctx.trip-tour-horse.bullet.1':
    "Posa «Tipus de ruta» a «Ruta a cavall» a l'editor i apareixerà la targeta «Rutes eqüestres» a la columna de l'esquerra. «Cerca a la vista» mostra les rutes que hi ha a la vista del mapa.",
  'help.guide.tour-horse-plan.step.2':
    "Fes clic al camp «Tipus de ruta», sota «Nom de l'excursió», i tria «Ruta a cavall». La targeta «Rutes eqüestres» apareix sota «Punts de ruta».",
  'help.guide.tour-horse-plan.tip.2':
    'TREK no calcula cap temps per a les rutes a cavall. Si vols tenir un temps al dia, introdueix-lo a «Planificat», dins de «Detalls».',
  'help.guide.tour-horse-gap.step.3':
    "Fes clic a «Agafa el tram». Mentre l'interruptor no estigui activat, el botó queda en gris.",
  'help.guide.tour-horse-recorded.step.1':
    "A «Excursions d'aquest viatge», fes clic a «Afegeix una ruta» (el +), tria «Importa GPX o KML» i selecciona el fitxer de la teva ruta.",
  'help.guide.dateless-trip.title': 'Planificar un viatge sense dates',
  'help.guide.trip-reminder.step.2':
    'A «Recordatori», tria 1, 3 o 9 dies. Per a una altra antelació, fes clic a «Personalitzat» i escriu un nombre de dies entre 1 i 30.',
  'help.guide.upcoming-reservations.title': 'Anar directament a les properes reserves',
  'help.guide.half-company-holiday.title': "Marcar mig dia festiu de l'empresa",
  'help.guide.edit-holiday-calendar.step.2':
    'Fes clic al quadrat de color per triar-ne un de nou, o escriu una etiqueta nova i prem Retorn.',
  'help.guide.person-color.step.1': 'A la targeta «Persones», fes clic al punt de color de davant del nom.',
  'help.guide.answer-fusion-request.title': 'Respondre una sol·licitud de fusió',
  'help.guide.log-for-partner.title': 'Registrar dies per a algú amb qui planifiques',
  'help.guide.dissolve-fusion.title': 'Deixar de planificar junts',
  'help.guide.country-places.goal':
    'Consulta els llocs que TREK compta per a un país, per revisar què hi vas fer o per trobar un lloc que TREK ha assignat a un país equivocat.',
  'help.guide.regions.tip.3':
    '«Afegeix a la llista de desitjos» també funciona amb les regions. La regió es mostra amb el mateix ratllat que un país de la llista de desitjos.',
  'help.guide.tour-activity-stats.step.2':
    "Tria un període i un tipus amb les dues pastilles de l'esquerra. «Període» ofereix «Des de sempre», «Aquest any», «Últims 12 mesos» i cada any anterior en què tinguis excursions; «Tipus» filtra les xifres per un tipus d'excursió, o «Tots els tipus».",
  'help.guide.tour-activity-stats.tip.3':
    'Un dia amb participants indicats només compta per a ells; un dia sense participants indicats compta per a tots els membres del viatge. La pestanya carrega dades en directe i necessita connexió a internet.',
  'help.guide.move-to-list.goal':
    "Reorganitza les teves llistes movent llocs d'una a l'altra o copiant-los en una segona llista.",
  'help.guide.accept-list-invite.result':
    "La llista apareix a «Compartit», al carril, i s'obre amb els seus llocs. Els canvis que hi fan els membres es veuen en directe.",
  'help.guide.tour-collection-add-to-trip.step.1':
    "Obre la llista. Les excursions desades són les primeres files, a sobre dels llocs. Fes clic a «Afegeix a un viatge» a l'excursió, o a la fila mateixa.",
  'help.guide.tour-collection-manage.title': 'Trobar i treure excursions desades',
  'help.guide.tour-collection-manage.result': "L'excursió desapareix de la llista, i un missatge breu ho confirma.",
  'help.guide.entry-draft.title': 'Conservar una entrada com a esborrany',
  'help.guide.journey-map-layers.step.1':
    'A dalt del mapa, la barra de capes té «Planificat», «Enregistrat», «Entrades» i «Fotos», cadascuna amb el seu recompte. Fes clic en una per amagar-la o mostrar-la.',
  'help.guide.journey-keep-route.step.1':
    'A la capçalera del dia, fes clic al botó de Dawarich, «Agafar l’enregistrament».',
  'help.guide.journey-day-stays.step.1':
    "Un dia amb estades per revisar acaba amb una fila com ara «4 estades de Dawarich» i l'interval horari. Fes-hi clic per mostrar les estades.",
  'help.guide.journey-take-over-day.step.1':
    "Fes clic a «Incorporar el dia», al final de la fila d'estades del dia, o al botó de llista de la capçalera del dia, que indica quantes estades hi ha pendents.",
  'help.guide.journey-auto-prepare.goal':
    'Fes que les estades de cada dia es preparin automàticament per revisar-les mentre dura el viatge.',
  'help.guide.photo-location.goal': 'Situa les entrades al mapa sense haver de buscar un lloc per a cadascuna.',
  'help.ctx.settings-about.bullet.1': 'La versió que fa servir aquest servidor es mostra al costat del títol.',
  'help.guide.readability.tip.3':
    '«Llegibilitat» està marcada com a Experimental. Si alguna cosa es veu malament, fes clic a «Restableix els valors per defecte», a baix de la pestanya, per recuperar la configuració per defecte.',
  'help.guide.web-push-device.goal':
    "Rep les notificacions de TREK al telèfon o a l'ordinador encara que TREK estigui tancat.",
  'help.guide.connect-airtrail.tip.2':
    "La clau es desa xifrada i no es torna a mostrar mai; els punts del camp indiquen que n'hi ha una de desada.",
  'help.guide.connect-dawarich.tip.2':
    'Sota els botons, la targeta indica quan ho va comprovar TREK per última vegada i què no ofereix la teva versió de Dawarich.',
  'help.guide.tour-connect-wanderer.tip.2':
    "Una instància amb una adreça privada pot necessitar que l'administrador permeti les xarxes internes.",
  'help.guide.tour-wanderer-watch.tip.2':
    '«En pausa fins a» vol dir que wanderer no ha respost; «Testimoni rebutjat» vol dir que el token necessita una prova de connexió correcta o un token nou.',
  'help.guide.plugin-settings.result':
    'El connector funciona amb la teva configuració, i totes les accions que fa per tu apareixen a «Activitat dels connectors».',
  'help.ctx.admin-defaults.bullet.3':
    "L'enllaç «Restaurar» del costat d'un camp que has definit recupera el valor per defecte de TREK. La configuració pròpia d'un usuari sempre té prioritat sobre aquests valors.",
  'help.ctx.admin-settings.bullet.5':
    '«Zona de perill»: «Rota el secret JWT» tanca la sessió de tots els usuaris, tu inclòs.',
  'help.guide.default-user-settings.step.1':
    "A «Configuració per defecte dels usuaris», tria «Mode de color» («Clar», «Fosc» o «Automàtic»), «Unitat de temperatura», «Unitat de distància», «Format d'hora», «La setmana comença el», la «Divisa de visualització» i si «Difumina els codis de reserva» està activat o desactivat. Cada opció es desa a l'instant.",
  'help.guide.admin-passkeys.step.2':
    "Introdueix l'«ID de la part confiable (domini)», com ara trek.example.org, i els «Orígens permesos» des d'on s'accedeix al teu TREK, i fes clic a «Desa». Deixa'ls tots dos buits per fer servir APP_URL.",
  'help.guide.rotate-jwt-secret.title': 'Tancar la sessió de tothom alhora',
  'help.guide.notification-defaults.step.2':
    "Fes clic a una cel·la per passar-la a l'estat següent: «Activat», «Desactivat», «Bloquejat». El text d'ajuda indica l'estat següent, i cada clic es desa a l'instant.",
  'help.ctx.notifications.bullet.2':
    '«Tots» i «No llegides», a dalt, alternen entre totes les notificacions i només les que no has llegit. La llista en carrega més a mesura que et desplaces.',
  'help.guide.read-notifications.step.3':
    'Fes clic al botó de sota una notificació, «Mostra Vacay aquí», per obrir allò a què fa referència. Així també es marca com a llegida.',
  'help.guide.filter-notifications.step.3':
    'Fes clic a «No llegides» per veure només les notificacions que no has llegit. «Tots» les torna a mostrar totes.',
  'help.guide.mark-notifications-read.tip.2':
    "Marcar-la com a llegida només canvia el color de fons i el recompte. La notificació es queda a la llista fins que l'eliminis.",
  'help.guide.delete-notifications.result': 'La notificació desapareix de la llista i de la campana.',
  'help.guide.notification-settings.result':
    "«Configuració» s'obre a «Notificacions», amb un interruptor per a cada esdeveniment i canal.",
  'help.guide.link-journal.goal':
    'Mostra un dels teus diaris de «Travessia» dins del viatge, per a les persones que triïs.',
  'help.guide.link-journal.tip.3':
    "Més endavant, «Diari», a «Configuració del viatge», té «Edita l'accés», «Canvia el diari» i «Desvincula». Si el desvincules, la pestanya desapareix; les persones que hagis afegit al diari mateix en conserven l'accés.",
  'help.guide.dawarich-stays.result':
    "L'estada ja és un lloc del viatge, al dia que has triat o a «Sense planificar», i el panell la marca com a resolta.",
  'help.ctx.trip-days.bullet.7': "Mentre el viatge està en curs, el pla s'obre al dia d'avui i s'hi desplaça.",
  'help.guide.leave-stop-off-route.tip.2':
    '«Treure del dia», en canvi, treu la parada del dia; «Treu de la ruta» la manté al pla.',
  'help.guide.move-booking-day.goal':
    'Mou un transport o una reserva a un altre dia directament des del pla, sense obrir-ne el formulari.',
  'help.guide.place-image-from-file.result':
    'La foto és la imatge del lloc a la targeta, a la columna de llocs, al dia i al mapa.',
  'help.guide.place-own-hours.step.3':
    "A sota, «Horari d'obertura» mostra la setmana, amb una fila per dia. Si TREK ha trobat l'horari del lloc, ja està omplert; si no, fes clic primer a «Afegeix l'horari». Escriu quan obre i tanca cada dia, i fes clic a «Tancada» els dies que no obre.",
  'help.guide.add-accommodation.tip.5':
    "Les traces GPX i els llocs d'excursions no s'ofereixen mai com a allotjament, només els llocs normals del viatge.",
  'help.guide.confirm-stay-booking.step.1':
    "Obre el dia d'entrada. A la targeta de l'estada, a «Reserva», hi ha la reserva d'hotel d'aquella nit, amb «Pendent» o «Confirmat». Fes clic en aquest requadre.",
  'help.guide.tour-map-lines.step.4':
    "Per treure una excursió del mapa, canvia la columna de la dreta a «Excursions», passa el ratolí per l'excursió i fes clic a l'ull, «Amaga al mapa». La seva línia i la seva xinxeta desapareixen del mapa, i la fila es queda a la llista, atenuada, amb un ull ratllat, «Mostra al mapa», que la torna a mostrar.",
  'help.guide.car-stops.step.1':
    "A la capçalera del dia en què recolliràs el cotxe, fes clic al + (el text d'ajuda diu «Afegeix al dia») i tria «Afegeix transport».",
  'help.guide.car-stops.tip.2': '«Puja» i «Baixa» només apareixen quan el trajecte té dues parades o més.',
  'help.guide.transport-details.title': 'Obrir un transport i fer servir els seus detalls',
  'help.guide.transport-details.tip.1':
    'Si tornes a fer clic a «Al mapa» en un trajecte que té la línia dibuixada, la línia es desactiva.',
  'help.guide.export-transports-csv.result':
    'El navegador desa un fitxer amb el nom del viatge, per exemple autumn-in-japan-transports.csv, amb una fila per trajecte: «Tipus», «Títol», «Estat», «Inici», «Fi», «De», «A», «Ubicació», «Confirmació» i «Notes».',
  'help.guide.group-sort-bookings.goal':
    "Organitza les targetes o la llista per estat, per dia o per tipus, en l'ordre que vulguis.",
  'help.guide.booking-on-map.tip.1':
    "«Al mapa» només apareix en reserves amb un lloc. Tria'n un a «Lloc / Activitat» al formulari, i el botó apareixerà.",
  'help.guide.export-bookings-csv.step.2':
    'Obre «Opcions de vista», els controls lliscants de després de les icones de vista, i tria un ordre a «Ordena per». Les files el segueixen, amb una fila per reserva i sense seccions.',
  'help.guide.edit-booking.tip.4':
    'Si has canviat alguna cosa, un clic fora del formulari, o Esc, et pregunta «Vols descartar els canvis?». «Continua editant» et torna al formulari.',
  'help.guide.arrange-packing-list.step.2':
    "Dins d'una llista, l'agafador de l'esquerra d'una fila arrossega aquell article amunt o avall. Una línia del teu color d'accent a la vora esquerra d'una fila indica on anirà.",
  'help.guide.count-packed-pieces.goal':
    "Posa una quantitat a un article i marca'n les peces com a empaquetades una per una.",
  'help.guide.count-packed-pieces.tip.3': 'Si la quantitat és un, no hi ha comptador; només hi ha la casella.',
  'help.guide.expense-receipts.step.2':
    "Fes clic a «Adjuntar», al costat de «Rebuts i factures», i tria la foto o el PDF; també en pots triar diversos alhora. Cada fitxer apareix sota el títol, amb una paperera per treure'l.",
  'help.guide.files-sync-settings.goal':
    "Decideix si els documents només s'importen del teu gestor, només s'hi exporten o totes dues coses, i què passa quan un document s'elimina o es modifica als dos llocs.",
  'help.guide.files-sync-settings.tip.2':
    "Amb «Pregunta-m'ho», un document editat als dos llocs queda en espera a «Cal revisar-ho», sota la targeta. Fes clic a «Resol» i tria «Conserva la versió de TREK», «Conserva la versió del proveïdor» o «Conserva-les totes dues».",
  'help.guide.manage-notes.goal':
    'Obre una nota sencera, mantén la important a dalt de tot, i corregeix o elimina el que hagi quedat desfasat.',
  'help.guide.manage-notes.tip.2':
    "Mentre edites, la creu vermella d'un fitxer ja adjunt l'elimina a l'instant, abans que facis clic a «Desa», i no va a la paperera. Tots els fitxers d'una nota també apareixen a la pestanya «Fitxers» del viatge.",
  'help.guide.note-categories.step.6':
    "De nou a la targeta «Notes», les pastilles de sota la capçalera filtren les targetes. Fes clic a una categoria per veure'n només les notes; «Tots», o tornar a fer clic a la mateixa pastilla, les mostra totes.",
  'help.guide.roadtrip-reorder.tip.1':
    'Si mous una parada aquí, també es mou al pla del dia: «Dies» mostra el mateix ordre.',
  'help.guide.roadtrip-overnight.step.1':
    'A «Durant el trajecte», marca «Allotjament» a «Es busca», o «Càmping» per a una parcel·la, tria el dia en què vols aturar-te i fes clic a «Cercar».',
  'help.guide.roadtrip-overnight.tip.3':
    "Amb «Comença i acaba cada dia a l’allotjament» activat, a «Línia de la ruta», dins de «Preferències de conducció», el trajecte de l'endemà surt d'on has dormit.",
  'help.guide.roadtrip-stop-fill.title': "Definir fins on s'omple en una parada",
  'help.guide.roadtrip-bookings.title': 'Incloure el vol, el tren o el ferri al trajecte',
  'help.guide.roadtrip-bookings.tip.2':
    'Una taula o una entrada reservades en una parada apareixen com una pastilla en aquella parada; el que no pertany a cap parada apareix a «També reservat aquest dia».',
  'help.guide.roadtrip-google-import.step.3':
    "Revisa les parades que ha trobat. Cadascuna mostra on és; una parada marcada com a «Location unresolved» s'omet.",
  'help.guide.roadtrip-hazards.step.1': 'Obre «Preferències de conducció» a la columna de la dreta.',
  'help.ctx.trip-tours.summary':
    "La columna de la dreta de la pestanya «Planificat» en mode «Excursions»: totes les excursions del viatge en una llista, al costat dels dies. Des d'aquí poses excursions en dies, filtres la llista, amagues línies del mapa i importes fitxers GPX o KML. Les rutes es dibuixen i es modifiquen a la pestanya «Excursions».",
  'help.guide.tour-show-list.goal':
    'Substitueix la columna de llocs per les excursions del viatge, per veure-les i triar-les al costat dels dies.',
  'help.guide.tour-show-list.tip.3':
    'Amb el complement «Excursions» activat, les traces no apareixen mai a la llista de «Llocs»: cada traça importada és una excursió i apareix aquí.',
  'help.guide.tour-add-to-day.step.5':
    "Si l'excursió té etapes, el mateix menú et pregunta què vols fer. «Etapes a partir d’aquest dia» posa l'etapa 1 aquell dia i cada etapa següent el dia després; «Ruta sencera en aquest dia» la posa tota en aquell dia.",
  'help.guide.tour-day-times.step.1':
    "A la columna de dies, passa el ratolí per la fila de l'excursió, fes clic a «Més opcions» (els tres punts) i tria «Edita».",
  'help.guide.tour-day-times.result':
    "L'excursió apareix a la cronologia del dia amb la seva hora d'inici i de final, com qualsevol parada amb hora.",
  'help.guide.tour-remove-from-day.result':
    "El dia ja no mostra l'excursió, i la seva fila a la llista ja no té la insígnia «Dia».",
  'help.guide.tour-filter-list.tip.2':
    'Una secció només apareix quan les excursions es diferencien en aquell aspecte, així que una llista curta pot oferir només «Estat».',
  'help.guide.tour-hide-on-map.tip.1':
    "Amagar només t'afecta a tu i es desa en aquest navegador per a aquest viatge: l'excursió, els seus dies i el seu color no canvien, i l'excursió continua visible al mapa dels altres.",
  'help.guide.tour-import-plan-tab.tip.1':
    "Una traça que ja és al viatge queda marcada com a «Ja és al viatge» i no s'importa dues vegades.",
  'help.ctx.trip-tour-detail.bullet.4':
    "La fila de baix: «Afegeix al dia» o «Treure del dia» si hi ha un dia obert, «Navegació» fins a l'inici, la pàgina web de l'excursió, GPX, «Compartir» si el dispositiu pot compartir fitxers, «Col·lecció» i «Copiar».",
  'help.guide.tour-detail-read.step.5':
    "A sota hi ha les mesures: «Distància», «Altitud mínima», «Altitud màxima», «Desnivell positiu» i «Desnivell negatiu», els temps a sota i el perfil d'elevació amb el color de la línia de l'excursió.",
  'help.guide.tour-detail-read.result':
    "La targeta de l'excursió és oberta al costat del pla, i saps en quins dies és, quina llargada i quin pendent té, i d'on prové.",
  'help.guide.tour-rename-colour.tip.2': 'El llapis i el punt només funcionen per als membres que poden editar llocs.',
  'help.guide.tour-take-along.tip.2':
    "Tria una aplicació de mapes preferida a «Configuració», i «Navegació» obrirà directament aquella aplicació en lloc de mostrar-te'n la llista.",
  'help.guide.tour-copy-keep.step.3':
    'Per conservar una excursió per a altres viatges, obre-la i fes clic a «Col·lecció», a baix de la seva targeta.',
  'help.guide.tour-packing-link.goal':
    "Mostra a la targeta de l'excursió què cal portar, a partir de la llista d'equipatge del viatge o d'una de les seves llistes.",
  'help.guide.tour-packing-link.tip.3':
    'Per vincular cal permís per editar llocs. La resta veuen la llista vinculada, però no poden canviar el vincle.',
  'help.guide.tour-files.tip.2': "«Pujar» només apareix als membres que poden modificar l'excursió i afegir fitxers.",
  'help.guide.tour-activity-link.step.5':
    'Ara la traça apareix a «Traç real», amb els seus propis valors i el seu propi perfil al costat del pla.',
  'help.guide.tour-activity-compare.step.2':
    "«Distància màxima al pla» mostra la distància més gran entre la traça i la línia planificada, i «Fora del pla», quina part de la traça es va desviar d'aquesta línia.",
  'help.guide.tour-origin-check.step.1':
    "Obre la targeta de l'excursió i desplaça't fins a «Origen». «Origen» indica d'on prové: «Importació GPX» amb el nom del fitxer, importació KML o KMZ, o wanderer amb la seva adreça.",
  'help.ctx.trip-tour-planner.summary':
    "El planificador d'excursions del viatge: l'editor a l'esquerra, totes les excursions del viatge a la dreta i el mapa al mig. Aquí dibuixes una excursió punt per punt, en calcules la ruta per camins i carreteres reals, hi afegeixes els detalls i la deses al viatge.",
  'help.guide.tour-open-workspace.goal': "Obre el planificador d'excursions i descobreix per a què serveix cada part.",
  'help.guide.tour-open-workspace.tip.1':
    "«Contraure», a la pestanya de la vora interior de cada carril, amaga el carril per deixar més espai al mapa; «Planificat» i «Excursions d'aquest viatge» tornen a mostrar els carrils. Arrossega la vora d'un carril per fer-lo més ample o més estret.",
  'help.guide.tour-draw-route.step.3':
    "Comprova que «Afegeix un punt», a «Punts de ruta», estigui activat (és el mateix interruptor que «Posar punts» a la pastilla del mapa) i fes clic al mapa on comença l'excursió.",
  'help.guide.tour-draw-route.result':
    'Una ruta numerada al mapa i els seus punts a «Punts de ruta», a punt per posar-li nom i desar-la.',
  'help.guide.tour-type-profile.tip.2':
    "Alguns tipus demanen més dades abans de poder desar: «Córrer», el «Ritme previst»; «Ruta en piragua», l'embarcació i el tipus d'aigua, i una excursió d'«Esquí i hivern», la disciplina.",
  'help.guide.tour-edit-points.step.5': "«Elimina el punt de pas», la paperera del costat, treu el punt de l'excursió.",
  'help.guide.tour-shaping-points.step.2':
    'Arrossega el punt fins al camí per on ha de passar la ruta. La ruta es torna a planificar passant per aquell punt.',
  'help.guide.tour-loop-reverse.goal': "Fes que l'excursió acabi on comença, o inverteix-ne el sentit.",
  'help.guide.tour-leg-by-hand.title': 'Dibuixar un tram a mà o tornar-lo a planificar',
  'help.guide.tour-leg-by-hand.result':
    'El tram és una línia recta per on has triat, marcada com a dibuixada a mà, o torna a estar calculat.',
  'help.guide.tour-trip-places.tip.2':
    'Si treus la parada o la desvincules, el lloc es queda al viatge tal com estava, amb els seus dies.',
  'help.guide.tour-details-times.step.4':
    '«Planificat» mostra el total. Escriu-ne un de propi per substituir-lo; aleshores es marca com a «Valor manual».',
  'help.guide.tour-save.step.2':
    'Espera que desaparegui el punt del costat de «Nova excursió». Per desar cal tenir la ruta i totes les altituds.',
  'help.guide.tour-edit-saved.goal': 'Obre una excursió que ja havies planificat, modifica-la i torna-la a desar.',
  'help.guide.tour-edit-saved.result': "L'excursió desada ja inclou els teus canvis.",
  'help.guide.tour-summary-profile.tip.2':
    "Una ruta que passa per una via ferrada mostra una insígnia d'avís amb el seu grau a sobre de les xifres.",
  'help.guide.tour-list-manage.step.4':
    "El botó de sobre «Totals del viatge» és el filtre. Mostra l'estat pel qual filtra, al principi «Tots», amb el nombre d'excursions.",
  'help.guide.tour-delete.step.1':
    "Passa el ratolí per l'excursió a «Excursions d'aquest viatge» i fes clic a la paperera de la dreta de la fila, «Elimina» seguit del nom de l'excursió.",
  'help.guide.tour-saved-elsewhere.step.1':
    'Mentre edites, apareix «Aquesta excursió s’ha desat en un altre lloc» a dalt del carril. Els teus canvis es conserven fins que decideixis què fer.',
  'help.ctx.trip-tour-import.summary':
    "Aquí importes al viatge excursions que ja existeixen en un altre lloc: un fitxer GPX, KML o KMZ d'un rellotge o d'una aplicació, una excursió d'un altre dels teus viatges o un camí del teu propi wanderer. Una importació es conserva exactament tal com es va enregistrar, i en pots planificar una versió editable.",
  'help.guide.tour-import-gpx.step.1':
    "Obre la pestanya «Excursions» del viatge. A dalt d'«Excursions d'aquest viatge», a la dreta, fes clic al + («Afegeix una ruta»).",
  'help.guide.tour-import-gpx.tip.4':
    'Un fitxer KML o KMZ també mostra a «No importat» el que contenia a més de les línies: punts, àrees i altres elements.',
  'help.guide.tour-view-import.tip.1':
    'Una importació no es pot editar punt per punt. «Planifica una versió editable», a la targeta «Versió editable» de dalt, en crea una excursió que pots modificar.',
  'help.guide.tour-plan-from-import.step.3':
    'Fes clic a «Substitueix la importació» per tornar a planificar aquesta excursió al mateix lloc: els seus dies i notes es mantenen, i la traça enregistrada es conserva perquè la puguis recuperar. «Planifica com a excursió nova» no canvia la importació i en crea una segona excursió al costat.',
  'help.guide.tour-restore-recorded.goal':
    "Desfés la replanificació d'una importació i recupera la traça original, encara que hagi passat molt de temps.",
  'help.guide.tour-take-over.goal':
    'Reaprofita una excursió que ja has planificat o importat en un altre dels teus viatges, sense haver-la de tornar a dibuixar.',
  'help.guide.tour-take-over.tip.2':
    'Només apareixen els teus altres viatges, i només les 100 primeres excursions. Busca o filtra per trobar la resta.',
  'help.guide.tour-import-wanderer.step.4': 'Fes clic a «Importa al viatge».',
  'help.ctx.trip-tour-map.bullet.1':
    "La pastilla de baix a l'esquerra del mapa té els mapes base que ofereix el tipus de l'excursió oberta: «Mapa», Topo, «Excursionisme» en una caminada, «Bicicleta» en una ruta en bicicleta, i «Satèl·lit». El que hi triïs només s'aplica al planificador i no canvia mai l'opció de mapa de «Configuració».",
  'help.guide.tour-map-layers.step.2':
    'Fes clic a Topo per veure corbes de nivell i relleu ombrejat, el mapa que mostra el pendent del terreny. El mapa que has triat queda ressaltat a la pastilla.',
  'help.guide.tour-along-search.step.1':
    "Obre una excursió a la pestanya «Excursions» i desplaça el panell de l'esquerra fins a «Al llarg de la ruta», sota les parades de l'excursió. La targeta hi apareix quan l'excursió té una ruta.",
  'help.guide.tour-along-search.tip.3':
    "Els resultats provenen d'OpenStreetMap i de l'índex de llocs de TREK, així que la cerca necessita connexió. Si no troba res, «Amplia a» prova la distància següent; si un servidor està saturat, «Torna-ho a provar» mostra un compte enrere fins que ho puguis tornar a provar.",
  'help.guide.tour-along-add-stop.tip.1':
    "El lloc passa a ser una parada de l'excursió, no un lloc del viatge, així que no apareix a la llista de llocs.",
  'help.guide.tour-3d-terrain.step.4':
    'Arrossega el control lliscant «Relleu» per fer els turons fins a tres vegades més alts, cosa que ajuda en terrenys suaus.',
  'help.guide.tour-3d-flyover.step.1':
    "Passa l'excursió a 3D. Mentre es carrega el relleu de la ruta, s'omple un anell on apareixerà el botó de reproducció; quan és ple, fes clic a «Reprodueix el sobrevol». La càmera segueix un punt per la ruta, i el cursor del perfil d'elevació del «Resum de l'excursió» s'hi mou alhora.",
  'help.guide.tour-map-overlays.title': 'Mostrar pistes o senyals nàutics sobre el mapa',
  'help.guide.tour-map-overlays.tip.2':
    "L'interruptor de les pistes també hi és quan no hi ha cap excursió oberta, perquè puguis mirar una estació d'esquí abans de planificar res. En una caminada, la pastilla ofereix en canvi «Vies ferrades», amb el nombre de vies que hi ha a la vista.",
  'help.ctx.trip-tour-stages.bullet.5':
    "El més de la fila d'una excursió, «Afegeix al dia», posa les etapes al viatge, una per dia a partir del dia que triïs, o tota l'excursió en aquell dia.",
  'help.guide.tour-multi-day.step.6':
    "Per tornar-la a convertir en una excursió d'un dia, fes clic a «Un dia» i confirma «Convertir-la en una ruta d’un dia?» amb «Treu els finals d’etapa». La ruta no canvia.",
  'help.guide.tour-stages-on-days.step.1':
    "A «Excursions d'aquest viatge», passa el ratolí per l'excursió de diversos dies i fes clic al més, «Afegeix al dia».",
  'help.guide.tour-stages-on-days.tip.3':
    "Si arrossegues una excursió de diversos dies a un dia de la pestanya «Planificat», et fa la mateixa pregunta en un diàleg, i també «Afegeix al dia» a la targeta de l'excursió.",
  'help.ctx.trip-tour-hike.bullet.4':
    "«Detalls del camí», sota els punts de ruta, mostra el grau SAC, el ferm i el tipus de via de cada tram segons OpenStreetMap, i acoloreix la ruta del mapa a partir d'aquestes dades. Res d'això no canvia l'excursió.",
  'help.guide.tour-hike-plan.step.4':
    '«Afegeix un punt» està activat des del principi: fes clic al mapa on comença la caminada i on acaba. «Llocs del viatge», al costat, et permet triar en canvi un refugi o un hotel del viatge. A partir de dos punts, TREK calcula la ruta a peu.',
  'help.guide.tour-hike-trail-details.title': "Veure graus, ferms i tipus de via d'una caminada",
  'help.guide.tour-hike-trail-details.tip.1':
    "Les vies sense cap valor a OpenStreetMap apareixen a «Desconeguda», i desconegut no vol dir fàcil. Si n'hi ha que mostren «No s'ha pogut consultar aquesta vegada», fes clic a «Torna-ho a provar».",
  'help.guide.tour-hike-round.step.4':
    'Fes clic a una volta per triar-la. La seva fila mostra la distància, el desnivell i el temps, i quant es desvia de la distància que has demanat.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Passa el ratolí per la parada on comença el tram, fes clic a «Més accions» a la seva fila i tria «Compara camins del tram següent».',
  'help.guide.tour-ferrata-add.title': 'Afegir una via ferrada a una caminada',
  'help.guide.tour-ferrata-add.tip.1':
    "Una via ferrada requereix equip i experiència. El text d'ajuda de la insígnia indica quina part en recorre la ruta.",
  'help.guide.tour-run-plan.step.3':
    'Escriu el teu «Ritme previst» en minuts i segons per quilòmetre, per exemple 7:30.',
  'help.guide.tour-run-ways.title': 'Veure per quines vies passa una cursa',
  'help.ctx.trip-tour-walk.title': 'Passeig urbà',
  'help.guide.tour-walk-plan.goal':
    "Crea un passeig turístic amb parades, indicant quanta estona t'hi estàs i quines són importants.",
  'help.guide.tour-walk-plan.tip.2':
    "Un passeig urbà no té límit de senderisme ni camp «Pauses»: es fan servir els temps d'estada.",
  'help.guide.tour-walk-sights.step.4':
    "Fes clic a un lloc de la llista. La seva targeta s'obre sobre el mapa: a «On va», tria entre quines dues parades ha d'anar.",
  'help.guide.tour-walk-day-times.step.1':
    "Posa el passeig en un dia: a «Excursions d'aquest viatge», fes clic al + rodó de la seva fila («Afegeix al dia») i tria el dia.",
  'help.guide.tour-walk-day-times.result':
    'Pots reordenar les parades o canviar les estades fins que tots els llocs siguin oberts quan hi arribis.',
  'help.guide.tour-walk-google-import.tip.2':
    "«Fes servir un altre enllaç» et torna al camp de l'enllaç. Carregar el passeig substitueix els canvis no desats del planificador, i el diàleg t'avisa abans.",
  'help.guide.tour-walk-check-off.step.4':
    'A dalt de la llista es compten les parades visitades i es mostra el temps a peu que queda. «Desfés» en una parada en treu la marca.',
  'help.ctx.trip-tour-bike.bullet.2':
    "El «Resum de l'excursió», a la dreta, mostra «Temps en bici (estimat)», el temps que calcula el calculador de rutes per al perfil, amb les pujades incloses. Les pauses no hi són.",
  'help.guide.tour-bike-profile.step.4':
    "A «Punts de ruta», fes clic a «Llocs del viatge» i tria l'inici i el final, en aquest cas l'Hotel Alpenroyal i després l'Hotel Greif. També pots comprovar que «Afegeix un punt» estigui activat i fer clic al mapa. A partir de dos punts, TREK calcula la ruta.",
  'help.guide.tour-bike-profile.tip.5':
    "Si un administrador permet el mapa CyclOSM, la fila de capes del mapa també ofereix «Bicicleta» mentre hi ha una ruta en bicicleta oberta. Si deixa de carregar-se, canvia a «Mapa». L'excursió no canvia.",
  'help.guide.tour-bike-surfaces.tip.1':
    '«No consta a les dades» vol dir que OpenStreetMap no hi registra cap ferm. El ferm és desconegut, no necessàriament bo.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Fes clic a una fila de grau per ressaltar aquells camins al mapa.',
  'help.ctx.trip-tour-ski.bullet.1':
    "Primer es tria la «Disciplina», i no n'hi ha cap de preseleccionada: «Alpí», «Surf de neu», «Esquí de fons», «Esquí de muntanya», «Raquetes de neu» o «Excursió hivernal». «Esquí de fons» també demana la «Tècnica»: «Clàssica», «Patinador» o «Desconeguda». Sense disciplina, l'excursió no es pot desar.",
  'help.guide.tour-ski-plan.step.2': 'Obre «Tipus de ruta» i tria «Esquí i hivern».',
  'help.guide.tour-ski-plan.tip.4':
    "On no hi ha dades de pistes, el tram és una línia recta entre els punts. Per a raquetes de neu i excursions hivernals, pot fer servir camins d'estiu, i una nota grisa al tram ho indica.",
  'help.guide.tour-ski-options.step.5':
    'A «Excloure», prem cada tipus de remuntador que no vulguis agafar: «Teleesquís», «Telecadires oberts», «Telecabines», «Telefèrics» o «Funiculars i trens». Els que prems apareixen ratllats.',
  'help.guide.tour-ski-fix-leg.step.2':
    "Fes clic a la solució que ofereix la fila: «Permetre pistes més difícils», «Permetre aquest remuntador», «Baixar amb remuntador», «Canviar de tècnica» o «Canviar de disciplina». L'opció canvia i el tram es torna a planificar.",
  'help.guide.tour-ski-summary.goal':
    'Mira com es reparteix el dia entre esquiar, els remuntadors, les esperes i el temps a peu.',
  'help.guide.tour-ski-summary.result': 'Saps quant de temps passaràs a les pistes, als remuntadors i esperant-los.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    "La capa són dades cartogràfiques, no un informe en directe: no indica què és obert o trepitjat, com està la neu ni res sobre allaus. L'interruptor també hi és sense cap excursió oberta, perquè puguis mirar una estació d'esquí abans de planificar.",
  'help.guide.tour-ski-import.step.5':
    "Fes clic a la traça a «Excursions d'aquest viatge» per obrir-la. Per corregir-ne la disciplina més endavant, fes clic a «Canvia» a la seva targeta «Traça d’esquí».",
  'help.ctx.trip-tour-paddle.bullet.1':
    "A «Tipus de ruta», «Ruta en piragua» demana un «Vaixell» («Caiac», «Canoa», SUP o «Altres») i l'«Aigua» («Riu» o «Llac»). No es pot desar l'excursió fins que no hagis triat totes dues coses.",
  'help.guide.tour-paddle-setup.step.1':
    "A la pestanya «Excursions», fes clic a «Planifica una nova excursió», a dalt de la columna de l'esquerra.",
  'help.guide.tour-paddle-setup.tip.2':
    "El mapa d'una ruta en piragua ofereix «Mapa» i «Satèl·lit», i «Senyals nàutics» d'OpenSeaMap com a capa superposada.",
  'help.guide.tour-paddle-water-route.step.3':
    "Tria «Planifica el tram següent per l’aigua». TREK planifica el tram pel riu o pel llac des d'aquest punt fins al següent.",
  'help.guide.tour-paddle-portage.title': "Portar l'embarcació per terra per esquivar un obstacle",
  'help.guide.tour-paddle-portage.tip.2':
    "A l'últim punt, «Porta l’embarcació per terra des d’aquí» s'aplica quan hi poses el punt següent. La fila diu «Portejar des d'aquí», i la seva creu, «Al final no portejar», ho desfà.",
  'help.guide.tour-paddle-lock.step.4':
    "Escriu els minuts d'«Espera» i de «Pas». Quan hi ha tots dos valors, la targeta en mostra la suma.",
  'help.guide.tour-paddle-time.step.2':
    "La franja mostra la ruta de l'inici al final: l'aigua, els transports per terra en marró i les rescloses com a marques. Els obstacles de la ruta són marques en què pots fer clic per trobar-los al mapa.",
  'help.guide.tour-paddle-wind.title': "Consultar el vent d'un dia de rem",
  'help.guide.tour-paddle-wind.tip.3':
    'Un dia de vent amb una travessia de llac, la targeta ofereix «Planifica a prop de la riba», que planifica els llacs seguint la vora.',
  'help.guide.tour-paddle-checklist.step.4':
    "Fes clic a una entrada. El mapa s'hi desplaça: si és un obstacle, se n'obre la targeta amb la teva decisió; si és un transport per terra o una resclosa teus, se'n selecciona el punt.",
  'help.guide.tour-paddle-track-marks.title':
    'Marcar transports per terra i rescloses en una traça de rem enregistrada',
  'help.guide.tour-paddle-track-marks.step.7': 'Obre les targetes, escriu-hi els minuts i fes clic a «Desa».',
  'help.ctx.trip-tour-horse.bullet.2':
    "Cada itinerari s'obre en un diàleg propi: tria un tram i el «Sentit» en què el fas, revisa l'«Accés a cavall» i després fes clic a «Agafa el tram».",
  'help.guide.tour-horse-plan.step.3':
    'A la targeta «Rutes eqüestres», fes clic a «Cerca a la vista». Hi apareixen tots els itineraris eqüestres senyalitzats de la vista, amb la seva longitud.',
  'help.guide.tour-horse-plan.tip.3':
    "Has mogut el mapa després de buscar? El botó diu «Cerca en aquesta vista». Si la vista és massa gran, et demana que primer t'hi apropis.",
  'help.guide.tour-horse-gap.step.4':
    "A la targeta «Punts de ruta», l'enllaç mostra «Manual, sense comprovar», amb la seva longitud. Passa-hi el ratolí per veure'n el motiu.",
  'help.guide.tour-horse-recorded.step.2':
    "S'obre la «Previsualització de la importació», i encara no s'ha desat res. A «Importa com a», posa «Tipus de ruta» a «Ruta a cavall». Tres insígnies indiquen què conserva la importació i què no calcula.",
  'help.guide.dateless-trip.goal': 'Comença a planificar abans de saber quan viatjaràs.',
  'help.guide.trip-reminder.step.3': 'Fes clic a «Actualitza».',
  'help.guide.upcoming-reservations.goal':
    'Mira què tens reservat pròximament a tots els teus viatges i obre el viatge corresponent.',
  'help.guide.log-day.tip.3':
    "No es pot registrar un dia marcat com a festiu de l'empresa de dia sencer. En un festiu de l'empresa de mitja jornada, un dia de vacances només compta 0,5.",
  'help.guide.half-company-holiday.goal':
    'Dona a tothom una tarda lliure, per exemple la vigília de Nadal, sense tancar tot el dia.',
  'help.guide.public-holidays.tip.2': "Passa el ratolí per un festiu de la graella per veure'n el nom.",
  'help.guide.edit-holiday-calendar.step.3':
    'Canvia el país o la regió a les seves llistes, o fes clic a la paperera per eliminar el calendari.',
  'help.guide.person-color.step.2': "Tria un color. Es desa a l'instant i el diàleg es tanca.",
  'help.guide.answer-fusion-request.goal':
    "Decideix si vols fusionar el teu pla de vacances amb el de la persona que t'ha convidat.",
  'help.guide.log-for-partner.goal':
    "Registra un dia lliure per a una persona fusionada al teu pla, per exemple quan t'ho demana.",
  'help.guide.dissolve-fusion.goal': 'Torna a separar un pla fusionat en plans independents.',
  'help.guide.country-places.step.1':
    "Busca un país que hagis visitat i tria'l. La seva targeta apareix al panell de baix.",
  'help.guide.tour-activity-stats.step.3':
    "Consulta les xifres: la distància, amb el nombre d'excursions a la cantonada, i després «Desnivell positiu» i «Desnivell negatiu». Amb «Tots els tipus», a continuació apareixen els tres tipus que més has fet, cadascun amb el recompte i la distància.",
  'help.guide.move-to-list.step.1':
    'Fes clic a la icona de la casella, «Triar», a la fila de filtres i marca els llocs.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'A «Al viatge», tria el viatge. Els viatges als quals no pots afegir excursions apareixen atenuats.',
  'help.guide.tour-collection-manage.goal':
    "Mira quines excursions conté una llista i d'on provenen, i treu les que ja no necessitis.",
  'help.guide.entry-draft.goal':
    'Escriu una entrada ara i amaga-la de la travessia compartida fins que estigui llesta.',
  'help.guide.journey-map-layers.step.2':
    "Fes clic a la (i) de l'extrem de la barra per veure la llegenda del mapa: explica cada xinxeta, punt i línia.",
  'help.guide.journey-keep-route.step.2':
    "Revisa el «Fus horari del dia», que determina on comença i on acaba el dia, i revisa l'enregistrament: distància, interval horari, trossos i buits.",
  'help.guide.journey-day-stays.step.2':
    "Fes clic a «Escriu una entrada de diari» en una estada. L'entrada s'afegeix a aquell dia a l'hora d'arribada, amb el nom i la posició de l'estada.",
  'help.guide.journey-take-over-day.step.2':
    'Marca les estades que vols conservar i corregeix-ne els noms. «Unir en una entrada», entre dues estades marcades, les fusiona, i «Mantenir separades» les torna a separar.',
  'help.guide.journey-auto-prepare.step.1':
    'Fes clic a ⋯, a dalt a la dreta de la capçalera, per obrir «Configuració de la travesia».',
  'help.guide.photo-location.step.1':
    'Fes clic a ⋯, a dalt a la dreta de la capçalera, per obrir «Configuració de la travesia».',
  'help.guide.share-public.tip.3':
    "Els esborranys no apareixen mai a l'enllaç, i les rutes enregistrades només es mostren els dies que tenen una entrada publicada.",
  'help.ctx.settings-plugins.title': 'Connectors',
  'help.ctx.settings-about.bullet.2':
    "«Informa d'un error» i «Sol·licita una funció» obren el projecte a GitHub; Wiki obre la documentació.",
  'help.guide.map-provider.tip.3':
    'En un mapa GL, fes clic amb el botó dret i arrossega per girar-lo i inclinar-lo; el clic del mig afegeix un lloc.',
  'help.guide.web-push-device.step.1':
    "A «Notificacions push en aquest dispositiu», fes clic a «Activa en aquest dispositiu» i permet les notificacions quan el navegador t'ho demani. «Envia una prova» comprova que n'arriba una.",
  'help.guide.connect-airtrail.title': 'Connectar el teu AirTrail',
  'help.guide.connect-dawarich.title': 'Connectar el teu Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Connectar el teu wanderer',
  'help.guide.tour-connect-wanderer.tip.3': '«Desconnecta», a la dreta, torna a eliminar el token.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Els canals per a aquests avisos es trien a «Notificacions», a la fila «wanderer: avisos sobre els teus camins».',
  'help.guide.plugin-settings.tip.1':
    'Aquesta configuració és només teva; els altres membres configuren el connector pel seu compte.',
  'help.guide.offline-conflicts.step.3':
    'Els canvis que el servidor continua rebutjant apareixen a «Memòria cau fora de línia» com a «Canvis fallits»: «Torna-ho a provar» els torna a enviar, i «Descartar» manté la versió del servidor.',
  'help.ctx.admin-notifications.bullet.4':
    '«Valors per defecte dels usuaris», a baix de tot: per a cada esdeveniment i canal, «Activat», «Desactivat» o «Bloquejat» per a tothom qui no ho hagi canviat.',
  'help.guide.default-user-settings.step.2':
    'Un camp que hagis definit mostra un enllaç «Restaurar» al costat del nom, que recupera el valor per defecte de TREK.',
  'help.guide.own-routing-engine.title': 'Fer servir els teus propis servidors de rutes',
  'help.guide.admin-passkeys.result':
    "La pàgina d'inici de sessió ofereix «Inicia la sessió amb una passkey», i la gent pot afegir passkeys des de la seva configuració.",
  'help.guide.rotate-jwt-secret.goal': "Tanca totes les sessions si sospites d'una filtració.",
  'help.guide.notification-defaults.result':
    'Tothom qui no hagi canviat una cel·la comença amb el que has triat, i les cel·les bloquejades apareixen bloquejades a la seva configuració.',
  'help.ctx.notifications.bullet.3':
    "Cada notificació indica qui ha fet què i on. Les no llegides tenen el fons ressaltat. Un botó a sota, com ara «Mostra el viatge» o «Mostra Vacay», t'hi porta i la marca com a llegida.",
  'help.guide.read-notifications.tip.1':
    "La campana és a totes les pantalles que tenen barra de navegació, i el número s'actualitza automàticament quan arriba alguna cosa nova.",
  'help.guide.filter-notifications.tip.1':
    'La pàgina carrega notificacions més antigues a mesura que et desplaces cap avall, així que no es perd res després de la primera pantalla.',
  'help.guide.mark-notifications-read.result':
    'Ja no hi ha cap notificació amb el fons ressaltat, i el número vermell de la campana ha desaparegut.',
  'help.guide.notification-settings.title': 'Triar de què vols rebre avisos',
  'help.guide.link-journal.step.1':
    "Fes clic a «Configuració del viatge», al costat del nom del viatge, i tria «Diari» a l'esquerra.",
  'help.guide.dawarich-stays.tip.1':
    "No s'afegeix res al viatge fins que no fas clic a «Afegeix un lloc». Un lloc afegit des d'una estada ho indica als seus detalls: «Afegit des dels teus registres de Dawarich».",
  'help.guide.leave-stop-off-route.title': 'Deixar una parada fora de la ruta',
  'help.guide.move-booking-day.step.1':
    "Passa el ratolí per sobre de la fila de la reserva al dia: l'agafador de l'esquerra indica que es pot arrossegar.",
  'help.guide.place-image-from-file.tip.1': "Només s'ofereixen fitxers JPG, PNG, GIF i WebP; un bitllet en PDF, no.",
  'help.guide.place-own-hours.step.4':
    "Els botons de la dreta d'«Horari d'obertura»: el botó de copiar aplica l'horari del dilluns a tots els dies, i la X torna a eliminar el teu horari. Si TREK havia trobat un horari propi, «Agafa-ho dels detalls del lloc» el recupera.",
  'help.guide.confirm-stay-booking.step.2':
    "La reserva s'obre sobre el pla. La primera pastilla de la capçalera en mostra l'estat.",
  'help.ctx.trip-map.bullet.9':
    "Cada excursió del viatge és una línia del seu color, amb una xinxeta on comença. Fes clic a la línia per obrir la targeta de l'excursió. En un dia amb una excursió, la ruta del dia va fins on comença l'excursió i continua des d'on acaba. L'ull del costat d'una excursió a la llista d'«Excursions», «Amaga al mapa», treu la seva línia del teu mapa.",
  'help.guide.tour-map-lines.result':
    "Les excursions que vols són al mapa, cadascuna amb el seu color, i la que has amagat apareix atenuada a la llista d'«Excursions».",
  'help.guide.car-stops.step.2':
    "Fes clic a la pastilla de tipus de la capçalera i tria «Cotxe». El formulari canvia: «Data» i «Hora d'inici» passen a ser «Recollida» i «Hora de recollida», «Data de fi» i «Hora de fi» passen a ser «Devolució» i «Hora de devolució», i sota «De» i «A» apareix «Parades pel camí».",
  'help.guide.transport-details.goal':
    "Consulta tots els detalls d'un trajecte en un sol lloc, copia'n el codi de reserva, canvia-li el nom o ves-hi directament al mapa.",
  'help.guide.transport-details.tip.2':
    "Esc o un clic fora dels detalls els tanca. Si hi ha obert «Canviar el nom» o la pregunta d'eliminar, primer es tanca això.",
  'help.guide.export-transports-csv.tip.1':
    'La icona només apareix a la barra mentre la pestanya té almenys un trajecte.',
  'help.guide.group-sort-bookings.step.1':
    'A «Targetes» o «Llista», fes clic a «Opcions de vista», els controls lliscants de després de les tres icones de vista.',
  'help.guide.create-booking.tip.4':
    'Sense connexió, la reserva es desa en aquest dispositiu i se sincronitza quan tornes a estar en línia. Els fitxers nous necessiten connexió, així que treu-los o desa més tard. Si fas clic fora del formulari per error, o prems Esc, TREK et pregunta «Vols descartar els canvis?» abans que es perdi res del que has escrit.',
  'help.guide.booking-on-map.tip.2': "Una estada s'obre a la primera nit.",
  'help.guide.export-bookings-csv.step.3':
    "Fes clic a «Exporta com a full de càlcul (CSV)», la icona del full de càlcul de després d'«Opcions de vista».",
  'help.guide.arrange-packing-list.step.3':
    "«A a Z», a l'extrem dret de la fila amb «Compartit» i «La meva llista», ordena per nom els articles de cada llista, perquè vegis ràpidament si una cosa ja hi és. Torna-hi a fer clic per tornar al teu ordre.",
  'help.guide.count-packed-pieces.step.1':
    "Fes clic a la insígnia de quantitat d'una fila, el número petit seguit d'una x, escriu quantes unitats t'emportes, per exemple 5, i prem Retorn.",
  'help.guide.expense-receipts.step.3':
    'Fes clic a «Desa», a baix del diàleg. Els fitxers es pugen amb la despesa i també apareixen als «Fitxers» del viatge.',
  'help.guide.files-sync-settings.step.1':
    "Fes clic a «Sincronització de documents», a l'extrem dret de la barra. Si el viatge ja està vinculat, la targeta del teu gestor s'obre a la dreta; si n'hi ha més d'un, fes clic al que vulguis a «Aquest viatge», a l'esquerra.",
  'help.guide.files-sync-settings.tip.3':
    "«Actualitzacions instantànies», un enllaç amb «Copiar» al costat, només apareix per als gestors en què TREK no es pot subscriure automàticament als canvis. Enganxa l'enllaç al gestor i els canvis arribaran a l'instant en lloc d'arribar a la propera comprovació.",
  'help.guide.manage-notes.step.1':
    "Fes clic als tres punts de la capçalera d'una targeta de nota («Més opcions»). El menú conté «Ampliar», «Fixa», «Edita» i «Elimina».",
  'help.guide.note-categories.title': 'Classificar les notes en categories',
  'help.guide.note-categories.result':
    'Les notes mostren els noms i els colors nous, i la targeta «Notes» només mostra la categoria que has triat.',
  'help.guide.roadtrip-stops.tip.5':
    'Una parada amb hora de fi al pla del dia dura fins a aquella hora. El diàleg indica quan surt el trajecte, i «Treu l’hora de fi» et permet tornar a definir tu la durada.',
  'help.guide.roadtrip-reorder.tip.2':
    'Els trajectes reservats i les seves terminals es queden on els posa la reserva; només es poden arrossegar llocs.',
  'help.guide.roadtrip-overnight.step.2':
    "Un hotel mostra una icona de llit en lloc del més. Fes-hi clic, «Afegeix com a pernoctació», per obrir «Afegeix com a parada» per a la nit. Un càmping té l'«Afegir» habitual.",
  'help.guide.roadtrip-stop-fill.goal':
    'Defineix un nivell de càrrega propi per a una parada de combustible o de càrrega, com ara un 80 % en un carregador ràpid o un 100 % a la nit.',
  'help.guide.roadtrip-bookings.goal':
    "Mira on encaixa un trajecte reservat dins de la ruta, i a quina hora hi has d'arribar.",
  'help.guide.roadtrip-bookings.tip.3':
    "Un trajecte que no és en cap dia del viatge no forma part de la ruta: una nota a dalt del carril l'esmenta, amb «Obre la reserva» per posar-li una data.",
  'help.guide.roadtrip-google-import.step.4': 'A «Dia», tria el dia en què van les parades i fes clic a «Importa».',
  'help.guide.roadtrip-hazards.step.2':
    'A «Avisos actuals», a baix de la columna de la dreta del diàleg, activa «Mostra zones de perill» i fes clic a «Tanca».',
  'help.ctx.trip-tours.bullet.1':
    'El selector «Llocs» i «Excursions», a dalt de la columna de la dreta, substitueix la llista de llocs per les excursions. Només apareix si el complement «Excursions» està activat, i aleshores les excursions no apareixen mai a la llista de «Llocs».',
  'help.guide.tour-show-list.step.1':
    'A la pestanya «Planificat», fes clic a «Excursions» al selector de dalt de la columna de la dreta. Ara la columna mostra les excursions en lloc dels llocs.',
  'help.guide.tour-show-list.result':
    'La columna de la dreta mostra les excursions del viatge, i la que has triat és oberta a la seva targeta.',
  'help.guide.tour-add-to-day.tip.1':
    'Si arrossegues a un dia una excursió amb etapes, et fa la mateixa pregunta en un diàleg petit. «Cancel·la» deixa el pla com estava.',
  'help.guide.tour-day-times.step.2':
    "Indica l'«Inici» i deixa «Fi» buit. La línia de sota els camps mostra l'hora de final que calcula TREK: l'inici més el temps de l'excursió.",
  'help.guide.tour-remove-from-day.title': "Treure una excursió d'un dia",
  'help.guide.tour-filter-list.title': "Filtrar la llista d'excursions",
  'help.guide.tour-filter-list.tip.3':
    'Si no en queda cap, la llista diu «Cap excursió coincideix amb aquests filtres», i «Restablir els filtres» els esborra tots. Els filtres només canvien el que mostra la llista, mai una excursió ni un dia.',
  'help.guide.tour-hide-on-map.tip.2':
    "El mapa del telèfon sempre mostra totes les excursions, i la pestanya «Excursions» no té l'ull: les excursions s'amaguen aquí, a la pestanya «Planificat».",
  'help.guide.tour-import-plan-tab.tip.2':
    "Aquí la importació es queda a la llista i no s'obre en cap planificador. Posa-la en un dia amb el seu + rodó, o obre la pestanya «Excursions» per consultar-la allà.",
  'help.ctx.trip-tour-detail.bullet.5':
    "La targeta serveix per consultar l'excursió i el que hi va associat. La ruta en si es modifica a la pestanya «Excursions»: obre-la i fes clic a l'excursió a «Excursions d'aquest viatge». Les excursions també s'eliminen allà, no aquí.",
  'help.guide.tour-detail-read.step.6':
    "Continua baixant per veure la «Descripció» i les «Notes», i després l'«Origen»: «planificada a TREK», el fitxer des d'on es va importar o el camí de wanderer d'on prové, amb la data.",
  'help.guide.tour-rename-colour.title': "Canviar el nom i el color d'una excursió",
  'help.guide.tour-rename-colour.result':
    "L'excursió mostra el seu nom nou a tot el viatge, i la seva línia es dibuixa amb el color que has triat.",
  'help.guide.tour-take-along.tip.3':
    "El fitxer prové del servidor, així que cal connexió. Una excursió creada sense connexió es pot baixar un cop s'ha sincronitzat.",
  'help.guide.tour-copy-keep.step.4':
    'Tria la llista a «Col·lecció», revisa el «Nom a la col·lecció» i fes clic a «Desa».',
  'help.guide.tour-packing-link.step.1':
    "Obre la targeta de l'excursió i desplaça't fins a «Llista d'equipatge». Fes clic a «Vincula una llista d'equipatge».",
  'help.guide.tour-packing-link.result':
    "Ets a la llista d'equipatge de la pestanya «Llistes», i la targeta de l'excursió mostra cada article que vas marcant.",
  'help.guide.tour-files.result': "Els fitxers queden adjunts a l'excursió i s'obren des de la seva targeta.",
  'help.guide.tour-activity-link.tip.1':
    'El pla no canvia. La traça només queda vinculada, i «Desvincula» torna a treure el vincle.',
  'help.guide.tour-activity-compare.step.3':
    'Fes clic a «Compara al mapa» per dibuixar el traç real amb línia de punts al costat del pla. «Acaba la comparació» el torna a treure.',
  'help.guide.tour-origin-check.step.2':
    "«Importat» mostra el dia de la importació. «Aquí» mostra l'estat actual: «Tal com es va importar», «Editat a TREK» o «Replanificat, traça enregistrada conservada».",
  'help.ctx.trip-tour-planner.bullet.1':
    "«Excursions» és a la barra de pestanyes del viatge, just després de «Planificat», mentre el complement «Excursions» està activat. La pestanya apareix a l'ordinador i a la tauleta; al telèfon, les excursions es consulten i es posen en dies des de la pestanya «Planificat», però no s'hi poden dibuixar.",
  'help.guide.tour-open-workspace.step.1':
    'Fes clic a «Excursions» a la barra de pestanyes del viatge, just després de «Planificat». El mapa ocupa tota la pantalla, amb un carril a cada costat.',
  'help.guide.tour-open-workspace.tip.2':
    "Deixa anar fitxers GPX, KML o KMZ en qualsevol punt d'aquesta pestanya per importar-los com a excursions del viatge.",
  'help.guide.tour-draw-route.step.4':
    'A baix del mapa apareix «Punt posat». «Desfer», al costat, torna a treure el punt.',
  'help.guide.tour-type-profile.title': "Triar el tipus d'excursió",
  'help.guide.tour-type-profile.result': "La ruta de l'excursió es calcula segons el tipus i el perfil que has triat.",
  'help.guide.tour-edit-points.step.6':
    '«Desfés el canvi al punt de pas» i «Refés el canvi al punt de pas», a la capçalera del carril, desfan o refan cada canvi, un per un.',
  'help.guide.tour-shaping-points.step.3':
    'A «Punts de ruta» apareix amb una insígnia «Punt de forma» i sense número, de manera que les parades mantenen la seva numeració.',
  'help.guide.tour-loop-reverse.step.1':
    "Fes clic a «Torna a l’inici» a la capçalera de la targeta «Punts de ruta». L'excursió rep un últim tram que torna al primer punt.",
  'help.guide.tour-leg-by-hand.goal':
    'Uneix dos punts amb una línia recta on el calculador de rutes no troba cap camí, o torna a planificar un tram.',
  'help.guide.tour-trip-places.title': 'Fer servir un lloc del viatge com a parada',
  'help.guide.tour-trip-places.tip.3': "Les altres excursions del viatge no s'ofereixen mai com a parada.",
  'help.guide.tour-details-times.tip.1': 'Els temps es poden escriure com a 2:56, 2 h 56 o 176 minuts.',
  'help.guide.tour-save.step.3':
    "Fes clic a «Desa», a baix del carril de l'esquerra. Apareix «Excursió desada», i el títol del carril passa a ser «Edita excursió».",
  'help.guide.tour-edit-saved.step.1':
    "Fes clic a l'excursió a «Excursions d'aquest viatge». S'obre al carril de l'esquerra com a «Edita excursió», i el mapa en mostra la ruta.",
  'help.guide.tour-summary-profile.title': "Consultar el resum de l'excursió i el perfil d'elevació",
  'help.guide.tour-summary-profile.tip.3':
    "Una ruta en piragua no mostra altituds, perquè a l'aigua les úniques altituds disponibles serien les de les ribes.",
  'help.guide.tour-list-manage.step.5':
    'Tria «Sense planificar» per a les excursions que encara no tenen dia, o filtra per «Origen», «Límit de ruta» o «Tipus». Cada línia indica quantes excursions hi coincideixen, i els totals segueixen el filtre.',
  'help.guide.tour-delete.step.2':
    "Llegeix què s'elimina amb l'excursió: la ruta, els punts de ruta editables i les assignacions als dies. Fes clic a «Elimina permanentment».",
  'help.guide.tour-saved-elsewhere.step.2':
    "«Carrega la més nova» substitueix els teus canvis per la versió més recent, després d'una confirmació.",
  'help.ctx.trip-tour-import.bullet.1':
    "El + de dalt d'«Excursions d'aquest viatge» és «Afegeix una ruta». Ofereix «Importa GPX o KML», «Importa un passeig de Google Maps» i «Agafar una ruta d'un altre viatge». També pots deixar anar fitxers en qualsevol punt de la pestanya «Excursions».",
  'help.guide.tour-import-gpx.step.2':
    'Tria «Importa GPX o KML» i selecciona un o més fitxers .gpx, .kml o .kmz, de fins a 10 MB cadascun.',
  'help.guide.tour-import-gpx.tip.5':
    'Un fitxer sense altituds mostra «Sense altituds al fitxer». La línia i la distància són correctes, però el desnivell positiu i el negatiu queden desconeguts.',
  'help.guide.tour-view-import.tip.2':
    'La icona de baixada de la capçalera la torna a desar com a fitxer GPX, i el marcador la desa en una col·lecció.',
  'help.guide.tour-plan-from-import.step.4':
    "L'excursió s'obre a l'editor amb els seus punts de ruta. Modifica-la si vols i fes clic a «Desa», a baix de la columna.",
  'help.guide.tour-restore-recorded.step.1':
    "A «Excursions d'aquest viatge», fes clic a l'excursió que has replanificat. La targeta «Traça enregistrada» de l'editor indica que es conserva la traça amb què es va enregistrar.",
  'help.guide.tour-take-over.step.1':
    "Obre la pestanya «Excursions» del viatge on ha d'anar l'excursió. A dalt d'«Excursions d'aquest viatge», fes clic al + («Afegeix una ruta»).",
  'help.guide.tour-take-over.tip.3':
    "Per agafar una excursió cal connexió. Si l'editor té canvis sense desar, la còpia s'afegeix igualment a la llista, però no s'obre, perquè no perdis la feina que tens oberta.",
  'help.guide.tour-import-wanderer.tip.1':
    'El botó apareix quan wanderer està connectat a «Configuració», «Integracions». Fins aleshores, la llista ofereix «Connecta a la configuració».',
  'help.ctx.trip-tour-map.bullet.2':
    "Després del separador de la pastilla hi ha els interruptors del tipus d'excursió: «Posar punts» mentre edites una excursió, «Vies ferrades» en una caminada, «Senyals nàutics» en una ruta en piragua i les pistes en una excursió d'esquí. 3D, al final, mostra l'excursió sobre un relleu en 3D.",
  'help.guide.tour-map-layers.step.3':
    'En una caminada, fes clic a «Excursionisme» per veure els senders senyalitzats i els seus números; una ruta en bicicleta ofereix en canvi «Bicicleta» per a les rutes ciclistes. «Satèl·lit» mostra imatges aèries, i «Mapa» torna al mapa estàndard.',
  'help.guide.tour-along-search.step.2':
    "Fes clic a «Què cercar» i marca els tipus de lloc que vulguis, fins a sis alhora: «Miradors», «Cims», «Refugis i aixoplucs», «Aigua potable», «Menjar» i més. La llista ofereix els que s'adiuen al tipus d'excursió, i una excursió comença amb tres de marcats.",
  'help.guide.tour-along-add-stop.title': "Afegir com a parada un lloc al llarg de l'excursió",
  'help.guide.tour-along-add-stop.tip.2':
    "Un lloc que passa a ser el nou final queda marcat com a «Allarga la ruta»: l'antic final deixa de ser-ho, i l'excursió continua fins a aquest lloc.",
  'help.guide.tour-3d-terrain.step.5': 'Torna a fer clic a 3D per tornar al mapa pla i continuar planificant.',
  'help.guide.tour-3d-flyover.step.2':
    "A «Velocitat», tria 1×, 2× o 4×. A 1×, la majoria d'excursions duren uns 45 segons de l'inici al final.",
  'help.guide.tour-map-overlays.goal':
    "Mostra al mapa les pistes i els remuntadors, o les boies i els senyals portuaris, mentre planifiques una excursió d'esquí o en piragua.",
  'help.guide.tour-map-overlays.tip.3':
    'Quan una capa deixa de carregar-se, el seu interruptor mostra un ! i una explicació; el mapa i la teva ruta continuen funcionant sense la capa.',
  'help.guide.tour-multi-day.title': 'Planificar una excursió de diversos dies',
  'help.guide.tour-multi-day.tip.1':
    "«Acaba l’etapa aquí» també funciona en una excursió d'un dia: aleshores l'excursió passa automàticament a ser de diversos dies. La primera i l'última parada i els punts de forma no poden acabar una etapa.",
  'help.guide.tour-stages-on-days.step.2': 'Tria el dia en què comences la primera etapa.',
  'help.guide.tour-stages-on-days.tip.4':
    "Al pla del dia, cada etapa es mostra com a «Etapa N» amb la seva distància i el seu temps. «Desfer», a sobre dels dies de la pestanya «Planificat», desfà tota la distribució d'un sol cop.",
  'help.ctx.trip-tour-hike.bullet.5':
    "En una caminada, «Vies ferrades», a la fila de botons del mapa de baix a l'esquerra, mostra les vies ferrades properes. La targeta d'una via ferrada l'afegeix a la ruta com un tram independent.",
  'help.guide.tour-hike-plan.step.5':
    'A «Detalls», obre «Dificultat màxima del sender» i tria fins a quin punt poden ser difícils els senders, de T1 («Senderisme») a T6 («Senderisme alpí difícil»). La ruta es torna a planificar sense superar aquest límit.',
  'help.guide.tour-hike-trail-details.goal':
    "Consulta què registra OpenStreetMap sobre els camins d'una caminada i troba aquells trams al mapa.",
  'help.guide.tour-hike-trail-details.tip.2':
    'Un grau superior al límit de la caminada mostra la insígnia «Per sobre del límit» a la seva fila.',
  'help.guide.tour-hike-round.step.5':
    'Fes clic a «Agafa aquesta ruta» i després a «Substitueix» quan et pregunti si vols substituir la ruta planificada.',
  'help.guide.tour-hike-compare-ways.step.2':
    "S'obre «Altres camins per a aquest tram» sobre el mapa, amb el «Camí actual» i «Camí A», «Camí B», etc. Cadascun es dibuixa al mapa amb el seu color, i si passes el ratolí per una fila, se'n ressalta la línia.",
  'help.guide.tour-ferrata-add.goal':
    "Troba les vies ferrades de la zona de la teva caminada i incorpora'n una a la ruta.",
  'help.guide.tour-ferrata-add.tip.2':
    "Les vies ferrades només s'ofereixen en caminades. Una via ferrada per on ja passa la ruta mostra «Part de la ruta» a la seva targeta en lloc d'«Afegeix a la ruta».",
  'help.guide.tour-run-plan.step.4':
    "Posa l'inici i el final al mapa, o tria'ls amb «Llocs del viatge». Sota el ritme, veuràs el temps de cursa: la distància multiplicada pel ritme.",
  'help.guide.tour-run-ways.goal':
    "Comprova quina part d'una cursa no està asfaltada i com de difícils són els seus camins.",
  'help.ctx.trip-tour-walk.summary':
    "Una excursió a peu de parada en parada, planificada a la pestanya «Excursions»: quanta estona t'estàs a cada parada, quines són importants, els punts d'interès del camí i a quina hora arribes a cadascun el dia del passeig, comparat amb el seu horari d'obertura.",
  'help.guide.tour-walk-plan.step.1':
    "Fes clic a «Planifica una nova excursió», a dalt de la columna de l'esquerra, obre «Tipus de ruta» i tria «Passeig urbà / turístic».",
  'help.guide.tour-walk-plan.tip.3':
    "«Desenllaça del lloc», a «Més accions» d'una parada, només desfà el vincle amb un lloc del viatge. El lloc es queda al viatge.",
  'help.guide.tour-walk-sights.step.5':
    "Fes clic a «Afegeix com a parada». Un avís indica quant s'allarga el passeig, amb «Desfer» al costat.",
  'help.guide.tour-walk-day-times.step.2':
    "Posa-li una hora d'inici aquell dia: a la pestanya «Planificat», fes clic amb el botó dret al passeig dins del dia, tria «Edita» i introdueix un «Inici».",
  'help.guide.tour-walk-google-import.title': 'Convertir una ruta a peu de Google Maps en un passeig urbà',
  'help.guide.tour-walk-google-import.tip.3':
    "Només s'agafen les parades, no la línia dibuixada a Google Maps. Un enllaç curt maps.app.goo.gl necessita connexió per poder-lo seguir.",
  'help.guide.tour-walk-check-off.tip.1':
    "Les marques es desen per dia: obre el passeig des del seu dia al pla, no des de la llista d'excursions.",
  'help.ctx.trip-tour-bike.bullet.3':
    'La targeta «Ferm i camins», sota «Punts de ruta», mostra el terreny de la ruta: els ferms, els tipus de via i la proporció que se sap que no està asfaltada. Fes clic a una fila per ressaltar-ne els trams al mapa.',
  'help.guide.tour-bike-profile.step.5':
    "Consulta «Temps en bici (estimat)» al «Resum de l'excursió», a la dreta. Passa el ratolí pel seu punt d'informació per veure com es calcula.",
  'help.guide.tour-bike-surfaces.title': "Veure els ferms d'una ruta en bicicleta",
  'help.guide.tour-bike-surfaces.tip.2':
    'Amb el perfil «Carretera», un avís a sobre de les barres indica quina distància se sap que no està asfaltada. «Mostra al mapa» marca aquells trams.',
  'help.guide.tour-bike-mtb-grades.result':
    "El mapa marca els camins del grau que has triat, i saps quins trams de l'excursió són els difícils.",
  'help.ctx.trip-tour-ski.bullet.2':
    "Sota la disciplina hi ha les opcions del calculador de pistes, només les que fa servir la teva disciplina: «Pistes més difícils», «Preferir», «Ritme», interruptors com ara «Fer servir remuntadors», i «Excloure» per als tipus de remuntador que no vulguis agafar. Cada canvi torna a planificar l'excursió.",
  'help.guide.tour-ski-plan.step.3':
    "A «Disciplina», tria què faràs: «Alpí», «Surf de neu», «Esquí de fons», «Esquí de muntanya», «Raquetes de neu» o «Excursió hivernal». No n'hi ha cap de preseleccionada, i l'excursió no es pot desar sense disciplina.",
  'help.guide.tour-ski-plan.result':
    "Una excursió d'«Esquí i hivern» desada a «Excursions d'aquest viatge», amb els trams per les pistes, els remuntadors i els senders cartografiats, i el temps calculat al «Resum de l'excursió».",
  'help.guide.tour-ski-options.tip.1': "Cada canvi torna a planificar l'excursió, tram per tram.",
  'help.guide.tour-ski-fix-leg.step.3':
    'Si cap solució no et convé, fes clic a «Dibuixa recte». El tram es converteix en una línia recta entre els seus dos punts.',
  'help.guide.tour-ski-summary.step.1':
    'Sota els punts de ruta, busca la targeta «Ruta per pistes». Fes clic al títol per plegar-la o tornar-la a obrir.',
  'help.guide.tour-ski-pistes-layer.title': 'Mostrar les pistes al mapa',
  'help.guide.tour-ski-pistes-layer.result':
    "Les pistes es dibuixen sota l'excursió, i pots interpretar-ne els colors.",
  'help.guide.tour-ski-import.step.6':
    'A «Classificar la traça d’esquí», tria la disciplina o la tècnica correctes i fes clic a «Desa».',
  'help.ctx.trip-tour-paddle.bullet.2':
    "Cada punt mostra la seva funció en una insígnia: «Embarcament», «Desembarcament», «Reembarcament» o «Desembarcament final». Sota cada punt veus què ve després: un tram dibuixat a mà, un transport per terra, una resclosa o per què no s'ha pogut planificar un tram.",
  'help.guide.tour-paddle-setup.step.2':
    "Obre «Tipus de ruta» i tria «Ruta en piragua», «A l'aigua, amb caiac, canoa o SUP».",
  'help.guide.tour-paddle-setup.tip.3':
    "En una ruta en piragua, «Al llarg de la ruta» busca primer «Punts d'embarcament», «Lloguer de barques» i «Aigua potable».",
  'help.guide.tour-paddle-water-route.step.4':
    "Un tram que TREK no ha pogut planificar es posa vermell i n'explica el motiu, per exemple que encara no hi ha dades de l'aigua de la zona. Fes clic a «Dibuixa recte» per dibuixar-lo a mà de moment.",
  'help.guide.tour-paddle-portage.goal':
    "Marca un tram en què portes l'embarcació per terra, perquè compti com a terra, amb temps per sortir de l'aigua i tornar-hi a entrar.",
  'help.guide.tour-paddle-portage.tip.3':
    'El transport per terra es calcula a 2 km/h fins que defineixes la teva pròpia «Velocitat de transport» a la targeta «Estimació de temps».',
  'help.guide.tour-paddle-lock.tip.1':
    "TREK no coneix els horaris de les rescloses. Els temps són només els que introdueixes, així que comprova tu mateix l'horari de la resclosa.",
  'help.guide.tour-paddle-time.step.3':
    "La fila «Aigua» és la distància a l'aigua a la teva «Velocitat de rem». Canvia la velocitat al camp «Velocitat de rem», a dalt de la columna.",
  'help.guide.tour-paddle-wind.goal': "Consulta el vent previst a l'inici de l'excursió el dia que remes.",
  'help.guide.tour-paddle-wind.tip.4':
    'Que no hi hagi cap valor de previsió no vol dir que sigui segur. Comprova les condicions al lloc.',
  'help.guide.tour-paddle-checklist.step.5':
    'A baix de la columna, fes clic a «El rem té riscos» per llegir «Seguretat a l’aigua» abans de sortir.',
  'help.guide.tour-paddle-track-marks.goal':
    "Importa una traça de rem del rellotge i indica on vas portar l'embarcació per terra i on vas passar per una resclosa.",
  'help.guide.tour-paddle-track-marks.tip.1':
    "Fes clic just a sobre de la traça: un clic massa lluny de la línia es rebutja, i la targeta t'ho indica.",
  'help.ctx.trip-tour-horse.bullet.3':
    "Cada tram és una insígnia a la targeta «Punts de ruta» amb el nom de l'itinerari, un punt d'accés i la seva longitud. Un tram que no cobreix cap itinerari eqüestre diu «Manual, sense comprovar».",
  'help.guide.tour-horse-plan.step.4':
    "Fes clic a un itinerari de la llista. S'obre en un mapa propi, amb els trams numerats.",
  'help.guide.tour-horse-plan.tip.4':
    "«Desfés el canvi al punt de pas», a la capçalera de la columna de l'esquerra, desfà un tram sencer d'un sol cop.",
  'help.guide.tour-horse-gap.result': 'La ruta ja no té cap buit, i el tram afegit queda marcat com a dibuixat a mà.',
  'help.guide.tour-horse-recorded.step.3': 'Fes clic a «Importa 1 excursió».',
  'help.guide.dissolve-fusion.step.3': 'Confirma-ho amb «Dissol» a la finestra que apareix.',
};

export default help;
