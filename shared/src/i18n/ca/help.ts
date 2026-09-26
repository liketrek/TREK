import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Ajuda i documentació',
  'help.search': 'Cerca a la documentació…',
  'help.contents': 'Continguts',
  'help.noResults': 'No hi ha pàgines que coincideixin.',
  'help.errorTitle': "No s'ha pogut carregar aquesta pàgina",
  'help.errorBody': "El contingut d'ajuda s'obté del wiki de TREK. Comprova la teva connexió i torna-ho a provar.",

  // center
  'help.center.button': 'Ajuda per a aquesta pantalla',
  'help.center.title': 'Ajuda',
  'help.center.onThisScreen': 'En aquesta pantalla',
  'help.center.screens': 'Pantalles',
  'help.center.thisScreen': 'Aquesta pantalla',
  'help.center.subScreens': 'Subpantalles: {count}',
  'help.center.subScreensLabel': 'Subpantalles',
  'help.center.guidesCount': '{count} guies',
  'help.center.goToScreen': 'Ves a {screen}',
  'help.center.overview': 'Resum',
  'help.center.howTo': 'Com puc…',
  'help.center.searchPlaceholder': 'Cerca a les guies i la documentació…',
  'help.center.searchEmpty': "No s'ha trobat res per a «{query}».",
  'help.center.searchGuides': 'Guies',
  'help.center.searchDocs': 'Documentació',
  'help.center.searchError': 'La cerca no està disponible ara mateix.',
  'help.center.back': 'Enrere',
  'help.center.close': "Tanca l'ajuda",
  'help.center.steps': '{count} passos',
  'help.center.step': 'Pas {n}',
  'help.center.stepsLabel': 'Passos',
  'help.center.stepOf': 'Pas {n} de {total}',
  'help.center.screenshot': 'Captura',
  'help.center.result': 'El que obtens',
  'help.center.tips': 'Convé saber',
  'help.center.related': 'Relacionat',
  'help.center.openDocs': 'Obre a Ajuda i documentació',
  'help.center.docsSection': 'A la documentació',
  'help.center.noContext': 'Encara no hi ha cap guia per a aquesta pantalla.',
  'help.center.noContextHint': 'Cerca a la documentació o digues-nos què buscaves.',
  'help.center.feedback': 'Hi falta alguna cosa?',
  'help.center.feedbackLink': 'Digues-nos-ho a GitHub',
  'help.center.discord': 'Pregunta a Discord',
  'help.center.quick': 'Ràpid',
  'help.center.guide': 'Guia',
  'help.center.tour': 'Recorregut',
  'help.center.imageAlt': 'Pas {n} de «{title}»',

  // ctx
  'help.ctx.dashboard.title': 'Tauler',
  'help.ctx.dashboard.summary':
    "El tauler és la porta d'entrada a tots els teus viatges. La targeta d'embarcament de dalt destaca el viatge en curs o el següent, la fila de sota compta el que ja has viatjat, i les targetes llisten tot el que planifiques, has arxivat o ja has acabat.",
  'help.ctx.dashboard.bullet.1':
    "Targeta d'embarcament: el viatge en curs o el següent, amb dates, viatgers, llocs i un compte enrere. Fes-hi clic per obrir el viatge.",
  'help.ctx.dashboard.bullet.2':
    'Estadístiques: països visitats, viatges, dies de viatge i distància volada, sumant tots els teus viatges.',
  'help.ctx.dashboard.bullet.3':
    'Targetes de viatge, filtrades per Planificats, Arxivat i Completat, en graella o en llista. Passa el ratolí per una targeta per editar, duplicar, arxivar i eliminar.',
  'help.ctx.dashboard.bullet.4':
    'Ginys a la dreta: convertidor de moneda, rellotges mundials, properes reserves i col·leccions. Cadascun es pot desactivar.',
  'help.ctx.dashboard.bullet.5':
    'La targeta «Viatge nou» i el botó de la cantonada inferior dreta inicien tots dos un viatge nou.',

  // create-trip
  'help.guide.create-trip.title': 'Crear un viatge',
  'help.guide.create-trip.goal': 'Començar un viatge nou amb nom, dates i foto de portada.',
  'help.guide.create-trip.step.1':
    'Fes clic a «Viatge nou». La targeta al final dels teus viatges i el botó de la cantonada inferior dreta fan el mateix.',
  'help.guide.create-trip.step.2':
    "Posa un nom al viatge. És l'únic camp obligatori; tota la resta es pot afegir més tard.",
  'help.guide.create-trip.step.3':
    "Tria una data d'inici i una de fi. TREK crea un dia per data, així l'itinerari queda a punt per omplir.",
  'help.guide.create-trip.step.4':
    "Opcional: afegeix una foto de portada. Puja la teva, arrossega'n una o cerca la destinació a Unsplash.",
  'help.guide.create-trip.step.5': 'Fes clic a «Crea un viatge nou».',
  'help.guide.create-trip.result':
    "El viatge apareix al teu tauler. Si és el següent, ocupa la targeta d'embarcament de dalt.",
  'help.guide.create-trip.tip.1':
    "Les dates es poden canviar més tard. Si ja hi ha reserves, TREK pregunta si s'han de moure juntament amb els dies.",
  'help.guide.create-trip.tip.2':
    'La moneda del viatge que tries aquí és a la qual es converteix cada despesa. Tria la moneda de la destinació.',

  // edit-trip
  'help.guide.edit-trip.title': 'Editar un viatge',
  'help.guide.edit-trip.goal': "Canviar el nom d'un viatge, les dates o la configuració.",
  'help.guide.edit-trip.step.1':
    "Passa el ratolí per la targeta del viatge (o la targeta d'embarcament) i fes clic al llapis.",
  'help.guide.edit-trip.step.2':
    'Canvia el que calgui: nom, descripció, dates, portada, moneda, recordatori o membres.',
  'help.guide.edit-trip.step.3': 'Fes clic a «Actualitzar».',
  'help.guide.edit-trip.result': "La targeta s'actualitza a l'instant, per a tots els membres del viatge.",
  'help.guide.edit-trip.tip.1':
    "Moure les dates d'un viatge que ja té reserves obre un segon pas que pregunta si les reserves també s'han de moure.",

  // cover-image
  'help.guide.cover-image.title': 'Posar una foto de portada',
  'help.guide.cover-image.goal': "Donar al viatge una imatge que es vegi a la targeta i a la targeta d'embarcament.",
  'help.guide.cover-image.step.1': "Obre el formulari d'edició del viatge amb el llapis de la targeta.",
  'help.guide.cover-image.step.2':
    "A «Imatge de portada», deixa-hi anar una foto, fes clic per pujar-ne una o escriu una destinació a la cerca d'Unsplash.",
  'help.guide.cover-image.step.3': 'Tria una foto i fes clic a «Actualitzar».',
  'help.guide.cover-image.result': 'La foto es desa amb el viatge i es mostra a tot arreu on apareix el viatge.',
  'help.guide.cover-image.tip.1':
    "Les fotos de la cerca d'Unsplash s'acrediten automàticament; les teves pujades es queden al teu servidor.",

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicar un viatge',
  'help.guide.duplicate-trip.goal': 'Reutilitzar un viatge com a plantilla per a un de nou.',
  'help.guide.duplicate-trip.step.1': 'Passa el ratolí per la targeta i fes clic a la icona de duplicar.',
  'help.guide.duplicate-trip.step.2': 'Llegeix què es copiarà i què no, i confirma.',
  'help.guide.duplicate-trip.result':
    "Apareix una còpia al costat de l'original, a punt per canviar-li el nom i les dates.",
  'help.guide.duplicate-trip.tip.1':
    "Es copien dies, llocs, reserves, partides del pressupost, llistes d'equipatge i notes del dia. No es copien membres, xat, enquestes, fitxers ni enllaços compartits.",

  // archive-trip
  'help.guide.archive-trip.title': 'Arxivar i restaurar un viatge',
  'help.guide.archive-trip.goal': 'Apartar un viatge sense esborrar-lo i recuperar-lo més endavant.',
  'help.guide.archive-trip.step.1': 'Passa el ratolí per la targeta i fes clic a «Arxiva».',
  'help.guide.archive-trip.step.2': 'Canvia el filtre de sobre les targetes a «Arxivat» per tornar-lo a veure.',
  'help.guide.archive-trip.step.3': 'Fes clic a «Restaura» a la targeta per tornar-lo a «Planificats».',
  'help.guide.archive-trip.result':
    "Els viatges arxivats ho conserven tot. Només deixen d'ocupar el tauler i el calendari de tots els viatges.",

  // delete-trip
  'help.guide.delete-trip.title': 'Eliminar un viatge',
  'help.guide.delete-trip.goal': 'Treure un viatge per sempre.',
  'help.guide.delete-trip.step.1': 'Passa el ratolí per la targeta i fes clic a la paperera.',
  'help.guide.delete-trip.step.2': 'Confirma. El diàleg anomena el viatge, perquè sàpigues que és el correcte.',
  'help.guide.delete-trip.result':
    "El viatge, els seus dies, llocs, reserves i fitxers desapareixen. No es pot desfer; si dubtes, arxiva'l.",

  // filter-and-view
  'help.guide.filter-and-view.title': 'Trobar viatges completats, canviar entre graella i llista',
  'help.guide.filter-and-view.goal': 'Veure viatges acabats o arxivats i triar la disposició que prefereixis.',
  'help.guide.filter-and-view.step.1':
    'Fes servir «Planificats», «Arxivat» i «Completat» a sobre de les targetes. Completat és tot viatge amb la data de fi passada.',
  'help.guide.filter-and-view.step.2':
    'Fes clic a la icona de llista per passar a una llista compacta; torna-hi a fer clic per a la graella.',
  'help.guide.filter-and-view.result': 'El tauler recorda la teva disposició en aquest dispositiu.',

  // calendar-feed
  'help.guide.calendar-feed.title': "Subscriure't a tots els viatges al teu calendari",
  'help.guide.calendar-feed.goal':
    'Veure els dies i les reserves de cada viatge actiu a la teva app de calendari, sempre sincronitzats.',
  'help.guide.calendar-feed.step.1': 'Fes clic a la icona de calendari al costat del selector de vista.',
  'help.guide.calendar-feed.step.2':
    'Fes clic a «Enable calendar subscription». TREK genera un enllaç privat del feed.',
  'help.guide.calendar-feed.step.3':
    "Afegeix el feed amb un dels botons (Google, Apple, Outlook) o copia l'enllaç a qualsevol app de calendari que se subscrigui a URL.",
  'help.guide.calendar-feed.result':
    "Cada viatge actiu apareix al teu calendari i s'actualitza sol. En queden fora els viatges arxivats i els que van acabar fa més de 90 dies.",
  'help.guide.calendar-feed.tip.1':
    "L'enllaç és secret. Qui el tingui pot llegir el feed; revoca'l des del mateix diàleg si es filtra.",

  // widgets
  'help.guide.widgets.title': 'Triar els ginys del tauler',
  'help.guide.widgets.goal': "Mostrar o amagar la fila d'estadístiques i els ginys de la dreta.",
  'help.guide.widgets.step.1': 'Obre el menú del teu avatar a dalt a la dreta i tria «Configuració».',
  'help.guide.widgets.step.2': 'Canvia a la pestanya «Aparença».',
  'help.guide.widgets.step.3':
    'A «Ginys del tauler», activa o desactiva cada giny. Escriptori i mòbil es configuren per separat.',
  'help.guide.widgets.step.4': "Torna al tauler. El canvi s'aplica a l'instant.",
  'help.guide.widgets.result':
    'Els ginys amagats deixen espai per als teus viatges; desactiva tota la columna dreta per centrar la disposició.',
  'help.guide.widgets.link': "Obre la configuració d'aparença",

  // currency-widget
  'help.guide.currency-widget.title': 'Convertir monedes',
  'help.guide.currency-widget.goal': 'Convertir un import entre dues monedes amb tipus de canvi actuals.',
  'help.guide.currency-widget.step.1': "Escriu l'import i tria les dues monedes.",
  'help.guide.currency-widget.step.2':
    'La fletxa entremig intercanvia el parell; la fletxa circular actualitza el tipus de canvi.',
  'help.guide.currency-widget.result':
    'El teu parell de monedes es recorda al teu compte, així que és el mateix a tots els dispositius.',
  'help.guide.currency-widget.tip.1':
    "Els tipus de canvi vénen del Banc Central Europeu i s'actualitzen un cop al dia.",

  // timezones-widget
  'help.guide.timezones-widget.title': 'Afegir rellotges mundials',
  'help.guide.timezones-widget.goal': "Tenir a la vista l'hora local de les teves destinacions.",
  'help.guide.timezones-widget.step.1': 'Fes clic a + al giny «Fusos horaris» i cerca una ciutat.',
  'help.guide.timezones-widget.step.2': 'Treu un rellotge amb la × del costat.',
  'help.guide.timezones-widget.result': 'Els teus rellotges es desen amb el teu compte.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    "Vacay és el teu planificador personal de vacances: quants dies tens a l'any, quins has registrat i quants en queden. La graella mostra tot l'any d'un cop d'ull; la barra lateral reuneix el selector d'any, les persones amb qui planifiques, els calendaris compartits amb tu, la llegenda i el teu saldo.",
  'help.ctx.vacay.bullet.1':
    'Graella anual: dotze targetes de mes, una cel·la per dia. Fes clic en un dia per registrar-lo o esborrar-lo. Un puntet blau marca els dies que ja cobreix un viatge.',
  'help.ctx.vacay.bullet.2':
    "Barra inferior: mode Vacances o Festiu de l'empresa, més els interruptors Mitja jornada i Comp. / Flexi que canvien què registra un clic.",
  'help.ctx.vacay.bullet.3':
    "Dret: els teus dies de l'any, quants n'has fet servir i quants en queden, amb el traspàs del període anterior.",
  'help.ctx.vacay.bullet.4':
    "Persones són qui s'ha fusionat amb el teu pla, cadascú amb el seu color. Calendaris compartits són anells de només lectura dels dies lliures d'altres.",
  'help.ctx.vacay.bullet.5':
    "La configuració cobreix caps de setmana, inici de setmana, traspàs, el teu any de vacances, festius de l'empresa i calendaris de festius o vacances escolars.",
  // log-day
  'help.guide.log-day.title': 'Registrar un dia de vacances',
  'help.guide.log-day.goal': 'Marcar un dia lliure a la graella i veure com el saldo el segueix.',
  'help.guide.log-day.step.1':
    "Mira la barra inferior: el botó de l'esquerra, amb el teu color, vol dir que un clic registra un dia de vacances per a tu.",
  'help.guide.log-day.step.2':
    "Fes clic en un dia de qualsevol targeta de mes. S'omple amb el teu color i Utilitzats compta un dia més.",
  'help.guide.log-day.step.3': 'Torna a fer clic al mateix dia per esborrar-lo.',
  'help.guide.log-day.result':
    "El dia queda registrat, Dies, Utilitzats i Restants s'actualitzen a l'instant, i qui estigui fusionat amb el teu pla ho veu en directe.",
  'help.guide.log-day.tip.1':
    'Els caps de setmana no es poden registrar mentre Bloqueja els caps de setmana estigui activat a la configuració.',
  'help.guide.log-day.tip.2':
    'Un punt blau en una cel·la vol dir que un dels teus viatges cobreix aquell dia, així veus on coincideixen vacances i viatge.',
  // half-day
  'help.guide.half-day.title': 'Registrar mig dia',
  'help.guide.half-day.goal': 'Agafar una tarda sense gastar un dia sencer de saldo.',
  'help.guide.half-day.step.1':
    'Activa Mitja jornada a la barra. El seu punt taronja és la marca que rep un mig dia a la graella.',
  'help.guide.half-day.step.2': 'Fes clic en un dia. Es registra com a 0,5 i porta el punt taronja al racó.',
  'help.guide.half-day.step.3':
    'Desactiva Mitja jornada quan acabis; fer clic en un mig dia amb altres ajustos el converteix al mateix lloc.',
  'help.guide.half-day.result':
    'Utilitzats creix 0,5. Mitja jornada i Comp. / Flexi són independents, així que també hi cap mig dia de compensació.',
  'help.guide.half-day.tip.1':
    'La barra sempre mostra la marca que posarà el teu proper clic, per comprovar-ho abans de registrar.',
  // comp-day
  'help.guide.comp-day.title': 'Registrar compensació o flex',
  'help.guide.comp-day.goal': 'Agafar temps compensatori que no costa dies de vacances.',
  'help.guide.comp-day.step.1':
    "Activa Comp. / Flexi a la barra. El disc ratllat és l'aspecte d'un dia de compensació a la graella.",
  'help.guide.comp-day.step.2':
    "Fes clic en un dia. S'omple amb ratlles diagonals del teu color en lloc d'un bloc sòlid.",
  'help.guide.comp-day.result':
    'Els dies de compensació es compten al costat de les targetes de saldo i mai no redueixen Restants.',
  'help.guide.comp-day.tip.1':
    'Hores extra recuperades, flexibilitat horària, un dia de compensació: tot el que és lliure però no vacances va aquí.',
  // entitlement
  'help.guide.entitlement.title': 'Definir el teu saldo de vacances',
  'help.guide.entitlement.goal': "Dir a Vacay quants dies de vacances tens a l'any.",
  'help.guide.entitlement.step.1': 'A la barra lateral, fes clic a la targeta Dies sota Dret.',
  'help.guide.entitlement.step.2': 'Escriu el teu nombre de dies i prem Retorn.',
  'help.guide.entitlement.result':
    "Restants es recalcula a partir del teu saldo, del traspàs si n'hi ha i dels dies fets.",
  'help.guide.entitlement.tip.1':
    "Cada any té el seu propi saldo, així que un canvi aquí només afecta l'any seleccionat.",
  // years
  'help.guide.years.title': 'Afegir anys i canviar-ne',
  'help.guide.years.goal': "Planificar ja l'any vinent, o repassar l'anterior.",
  'help.guide.years.step.1':
    "Fes clic al + a la dreta de l'any per afegir el següent, o al + de l'esquerra per a l'anterior.",
  'help.guide.years.step.2': "Canvia d'any amb les fletxes o amb les fitxes d'any de sota.",
  'help.guide.years.step.3':
    "Per treure un any, passa el ratolí per la seva fitxa i fes clic al petit menys. Les seves entrades se'n van amb ell, així que confirma amb compte.",
  'help.guide.years.result': 'Cada any conserva el seu propi saldo i les seves entrades; el traspàs els enllaça.',
  // company-holidays
  'help.guide.company-holidays.title': "Marcar festius de l'empresa",
  'help.guide.company-holidays.goal': "Bloquejar els dies en què tota l'empresa tanca sense gastar el saldo de ningú.",
  'help.guide.company-holidays.step.1':
    "Obre la configuració i comprova que Festius de l'empresa està activat. Ho està per defecte; la barra només ofereix el mode mentre ho estigui.",
  'help.guide.company-holidays.step.2': "De tornada a la graella, posa la barra en mode Festiu de l'empresa.",
  'help.guide.company-holidays.step.3': 'Fes clic als dies. Es tornen ambre i apareixen a la llegenda.',
  'help.guide.company-holidays.result':
    "Els festius de l'empresa els veu tothom que està fusionat amb el pla i mai no redueixen Restants.",
  'help.guide.company-holidays.tip.1':
    "Qualsevol persona fusionada pot editar els festius de l'empresa, així que acordeu qui les manté.",
  // public-holidays
  'help.guide.public-holidays.title': 'Mostrar festius',
  'help.guide.public-holidays.goal': 'Posar a la graella els festius del teu país o regió.',
  'help.guide.public-holidays.step.1': 'Obre la configuració i activa Festius.',
  'help.guide.public-holidays.step.2':
    'Fes clic a Afegeix un calendari, tria el país i, quan importi, la regió. Dona-li un color i una etiqueta si vols.',
  'help.guide.public-holidays.step.3': 'Tanca la configuració. Els festius apareixen a la graella i a la llegenda.',
  'help.guide.public-holidays.result':
    'Els festius es marquen amb el color del calendari i mai no compten contra el teu saldo.',
  'help.guide.public-holidays.tip.1':
    "Pots afegir diversos calendaris, per exemple la teva regió i la d'un company fusionat.",
  // school-holidays
  'help.guide.school-holidays.title': 'Mostrar vacances escolars',
  'help.guide.school-holidays.goal': 'Veure les vacances escolars de la teva regió al costat dels teus dies lliures.',
  'help.guide.school-holidays.step.1': 'Obre la configuració i activa School Holidays.',
  'help.guide.school-holidays.step.2':
    'Fes clic a Afegeix un calendari i tria el país. Si un país divideix el calendari, tria també la regió o el grup.',
  'help.guide.school-holidays.step.3':
    'Tanca la configuració. Cada període rep una banda de color a la part baixa dels seus dies.',
  'help.guide.school-holidays.result':
    'Les vacances escolars són purament visuals: mai no redueixen el saldo de ningú.',
  'help.guide.school-holidays.tip.1':
    "Falta la teva regió? L'administrador pot mantenir les vacances escolars a mà a Admin, Personalització, Vacances escolars.",
  // weekends
  'help.guide.weekends.title': "Bloquejar caps de setmana i fixar l'inici de setmana",
  'help.guide.weekends.goal':
    'Deixar els caps de setmana fora del còmput i començar la setmana el dia a què estàs acostumat.',
  'help.guide.weekends.step.1': 'Obre la configuració.',
  'help.guide.weekends.step.2':
    'Activa Bloqueja els caps de setmana i tria quins dies compten com el teu cap de setmana.',
  'help.guide.weekends.step.3': 'A La setmana comença el, tria dilluns o diumenge.',
  'help.guide.weekends.result': 'Els dies bloquejats surten en gris a la graella i no es poden registrar per error.',
  // leave-year
  'help.guide.leave-year.title': 'Definir el teu any de vacances',
  'help.guide.leave-year.goal':
    'Comptar el saldo per any fiscal o des de la data de contractació en lloc de gener a desembre.',
  'help.guide.leave-year.step.1': 'Obre la configuració i busca Any de vacances.',
  'help.guide.leave-year.step.2':
    'Tria Natural, Fiscal (amb el mes i el dia en què comença) o Contractació (amb la data en què et van contractar).',
  'help.guide.leave-year.result':
    'Saldo, dies fets i traspàs segueixen aquest període, i la graella comença pel seu primer mes.',
  'help.guide.leave-year.tip.1':
    'Aquest ajust és personal: en un pla fusionat cadascú conserva el seu propi any de vacances i les seves xifres.',
  // carry-over
  'help.guide.carry-over.title': 'Traspassar els dies no fets',
  'help.guide.carry-over.goal': "Sumar el que sobra al final d'un període al següent.",
  'help.guide.carry-over.step.1': 'Obre la configuració.',
  'help.guide.carry-over.step.2': 'Activa Arrossega el saldo.',
  'help.guide.carry-over.result':
    'La quantitat traspassada es recalcula en tots els teus anys i es mostra sota el saldo.',
  'help.guide.carry-over.tip.1': 'Desactivar-ho posa tots els saldos de traspàs a zero.',
  // invite
  'help.guide.invite.title': 'Planificar amb algú',
  'help.guide.invite.goal':
    'Fusionar el teu pla amb un altre usuari de TREK per veure els dies lliures de tots dos en una sola graella.',
  'help.guide.invite.step.1': 'Fes clic a la icona de persona del panell Persones.',
  'help.guide.invite.step.2': "Tria l'usuari i envia la invitació.",
  'help.guide.invite.step.3': 'Rep una notificació i accepta. Fins llavors la invitació apareix com a pendent.',
  'help.guide.invite.result':
    "Els dos plans es fusionen: cada persona té un color, podeu registrar dies l'un per l'altre i tot se sincronitza en directe.",
  'help.guide.invite.tip.1':
    'Per desfer una fusió, fes servir Dissol a la configuració. Les entrades de cadascú tornen al seu propi pla.',
  'help.guide.invite.tip.2':
    "Si l'altra persona només ha de veure els teus dies, comparteix el calendari en lloc de fusionar.",
  // share-calendar
  'help.guide.share-calendar.title': 'Compartir el calendari en només lectura',
  'help.guide.share-calendar.goal': 'Deixar que algú vegi quan ets lliure sense donar-li veu al teu pla.',
  'help.guide.share-calendar.step.1': 'Fes clic a la icona de compartir del panell Calendaris compartits.',
  'help.guide.share-calendar.step.2': "Tria l'usuari i fes clic a Comparteix. No cal cap acceptació.",
  'help.guide.share-calendar.step.3':
    "Els calendaris compartits amb tu apareixen al mateix panell; l'ull n'amaga un, Deixa de compartir revoca el teu.",
  'help.guide.share-calendar.result':
    "Els teus dies lliures apareixen com un anell de color a la seva graella. Res del que comparteixes es pot editar des d'allà.",
  'help.guide.share-calendar.tip.1':
    "Compartir i fusionar són independents: pots estar fusionat amb una persona i compartir amb d'altres.",
  'help.guide.share-calendar.tip.2':
    'Passa el ratolí per un dia amb anell per veure qui és lliure i durant quant de temps.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'L’Atlas és la teva empremta viatgera en un mapa del món: cada país on t’ha dut un viatge està acolorit, i els que vas visitar abans de TREK els afegeixes a mà. Fes zoom per veure regions, mantén una llista de desitjos de llocs que encara vols veure i llegeix les teves xifres al panell de vidre de baix.',
  'help.ctx.atlas.bullet.1':
    'El mapa: els països visitats porten un color que és seu, els planificats tenen contorn discontinu, els de la llista de desitjos un ratllat diagonal i tota la resta és gris. Passa el ratolí per un país per veure viatges, llocs i primera i última visita.',
  'help.ctx.atlas.bullet.2':
    'Cerca a dalt: escriu un país o un lloc. Triar un país hi vola i obre la seva finestra; triar un lloc aterra a la seva regió perquè la puguis marcar.',
  'help.ctx.atlas.bullet.3':
    'Mostra els països planificats, a dalt a la dreta: revela els països dels teus propers viatges. L’interruptor només apareix mentre en tinguis.',
  'help.ctx.atlas.bullet.4':
    'Panell de baix: la pestanya Estadístiques amb països, viatges, llocs, ciutats, dies, continents i la teva ratxa; la pestanya Llista de desitjos amb el que encara t’espera.',
  'help.ctx.atlas.bullet.5':
    'Regions: a partir del nivell de zoom 5 el mapa passa a estats i províncies, cadascun clicable per marcar-lo o treure’l.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: amb l’addon connectat, un panell a l’esquerra de les estadístiques ratlla desitjos i afegeix països dels teus registres, mai sense la teva confirmació.',
  // mark-country
  'help.guide.mark-country.title': 'Marcar un país com a visitat',
  'help.guide.mark-country.goal':
    'Afegeix un país on vas ser abans de TREK, perquè el mapa i el teu recompte l’incloguin.',
  'help.guide.mark-country.step.1': 'Escriu el país al quadre de cerca de la part superior del mapa.',
  'help.guide.mark-country.step.2': 'Tria’l de la llista. El mapa hi vola i s’obre una finestra per a aquest país.',
  'help.guide.mark-country.step.3': 'Tria Marca com a visitat.',
  'help.guide.mark-country.result':
    'El país agafa el seu color al mapa i Països en compta un més. Aquest color és permanent: marcar més països mai reordena la resta.',
  'help.guide.mark-country.tip.1':
    'Fer clic en un país gris del mapa obre la mateixa finestra; la cerca és el camí segur per als països petits.',
  'help.guide.mark-country.tip.2':
    'Un país marcat a mà sempre compta com a visitat, siguin quines siguin les dates de qualsevol viatge que hi vagi.',
  // unmark-country
  'help.guide.unmark-country.title': 'Treure un país que has marcat',
  'help.guide.unmark-country.goal': 'Torna a treure del mapa un país marcat a mà.',
  'help.guide.unmark-country.step.1':
    'Cerca el país i tria’l, o fes-hi clic al mapa. Per a un país que has marcat tu, la finestra pregunta si cal treure’l.',
  'help.guide.unmark-country.step.2': 'Confirma amb Elimina.',
  'help.guide.unmark-country.result': 'El país torna a ser gris i surt del teu recompte.',
  'help.guide.unmark-country.tip.1':
    'Només els països marcats a mà es poden treure així. Un país amb viatges o llocs es queda mentre els tingui; Elimina també és a la seva targeta de detall del panell quan es va marcar a mà.',
  // country-details
  'help.guide.country-details.title': 'Veure què vas fer en un país',
  'help.guide.country-details.goal': 'Obre un país visitat i salta als viatges que t’hi van dur.',
  'help.guide.country-details.step.1': 'Cerca un país que hagis visitat.',
  'help.guide.country-details.step.2':
    'Tria’l. El mapa hi vola i el panell de baix afegeix una targeta amb la bandera, llocs, viatges i un xip per viatge.',
  'help.guide.country-details.result': 'Fes clic en un xip de viatge per obrir aquell viatge al planificador.',
  'help.guide.country-details.tip.1':
    'Passar el ratolí pel país al mapa mostra les mateixes xifres més la primera i l’última visita.',
  // planned-countries
  'help.guide.planned-countries.title': 'Mostrar els països on vas',
  'help.guide.planned-countries.goal':
    'Porta al mapa els països dels teus propers viatges sense comptar-los com a visitats.',
  'help.guide.planned-countries.step.1':
    'Activa Mostra els països planificats, a dalt a la dreta. El nombre del costat diu quants n’esperen.',
  'help.guide.planned-countries.step.2':
    'Cerca un país planificat i tria’l: el panell diu Planificat i el rètol del mapa mostra quan hi vas.',
  'help.guide.planned-countries.result':
    'Els països planificats apareixen amb contorn discontinu, perquè mai semblin un lloc on ja has estat. L’interruptor recorda la teva tria.',
  'help.guide.planned-countries.tip.1':
    'Un país compta com a visitat quan el viatge cap allà ha començat; un viatge en curs també compta. Els viatges sense dates queden del tot fora de les estadístiques.',
  'help.guide.planned-countries.tip.2': 'L’interruptor només existeix mentre tinguis viatges propers.',
  // regions
  'help.guide.regions.title': 'Marcar una regió',
  'help.guide.regions.goal': 'Més fi que països: marca els estats, províncies o prefectures on has estat.',
  'help.guide.regions.step.1':
    'Fes zoom en un país fins que apareguin les seves regions, a partir del nivell 5. Cercar el país i triar-lo t’hi acosta prou.',
  'help.guide.regions.step.2':
    'Fes clic en una regió. En passar-hi el ratolí surt el nom; la finestra mostra la regió i el seu país.',
  'help.guide.regions.step.3': 'Tria Marca com a visitat.',
  'help.guide.regions.result':
    'La regió s’omple amb el color del país. Marcar una regió també compta el país com a visitat si encara no ho era.',
  'help.guide.regions.tip.1':
    'Fer clic en una regió visitada ofereix Elimina, tant si l’has marcat tu com si un lloc l’hi ha posat.',
  'help.guide.regions.tip.2': 'Les regions on tens llocs reals es marquen per tu; allà no hi ha res a fer.',
  // search-place
  'help.guide.search-place.title': 'Trobar un lloc i marcar la seva regió',
  'help.guide.search-place.goal': 'Marca Baviera cercant Munic, sense saber a quina regió és una ciutat.',
  'help.guide.search-place.step.1':
    'Escriu una ciutat, un monument o una adreça al quadre de cerca. Els països van primer; els llocs coincidents apareixen a sota, sota Llocs.',
  'help.guide.search-place.step.2': 'Tria el lloc. El mapa hi vola i esbrina a quina regió és el punt.',
  'help.guide.search-place.step.3':
    'Tria Marca com a visitat per a aquella regió, o Afegeix a la llista de desitjos si encara t’espera.',
  'help.guide.search-place.result':
    'La regió queda marcada, i amb ella el país. Els països sense dades de regions al paquet de mapes recorren al país mateix.',
  'help.guide.search-place.tip.1':
    'Els llocs vénen de la mateixa cerca que a tot TREK, així que segueixen el proveïdor que va configurar el teu admin.',
  // bucket-country
  'help.guide.bucket-country.title': 'Posar un país a la llista de desitjos',
  'help.guide.bucket-country.goal':
    'Mantén una llista de desitjos de països directament al mapa, a part dels que ja has visitat.',
  'help.guide.bucket-country.step.1': 'Cerca el país i tria’l, o fes-hi clic al mapa.',
  'help.guide.bucket-country.step.2': 'Tria Afegeix a la llista de desitjos.',
  'help.guide.bucket-country.step.3': 'Tria mes i any si ja saps quan, i confirma amb Afegeix a la llista de desitjos.',
  'help.guide.bucket-country.result':
    'El país es dibuixa amb ratllat diagonal en el color que tindrà quan hi arribis, i apareix a la pestanya Llista de desitjos del panell.',
  'help.guide.bucket-country.tip.1':
    'La mateixa finestra ofereix Elimina de la llista de desitjos un cop el país és a la llista.',
  'help.guide.bucket-country.tip.2':
    'Una entrada per data objectiu: el mateix país pot ser a la llista per a dos mesos diferents, però no dues vegades per al mateix.',
  // bucket-place
  'help.guide.bucket-place.title': 'Afegir un lloc a la llista de desitjos',
  'help.guide.bucket-place.goal':
    'Desa una ciutat, un monument o una adreça que somies, amb coordenades i data objectiu.',
  'help.guide.bucket-place.step.1': 'Obre la pestanya Llista de desitjos al panell de baix.',
  'help.guide.bucket-place.step.2': 'Fes clic a Afegeix un lloc.',
  'help.guide.bucket-place.step.3':
    'Escriu el nom i prem el botó de cerca; tria la coincidència perquè el lloc tingui coordenades. Escriure només un nom i saltar-te la cerca també funciona.',
  'help.guide.bucket-place.step.4': 'Tria mes i any si vols i fes clic a Afegir.',
  'help.guide.bucket-place.result':
    'El lloc queda a dalt de la teva llista de desitjos amb la seva data objectiu; la × del costat el torna a treure.',
  'help.guide.bucket-place.tip.1':
    'Un desig amb coordenades és el que Dawarich pot ratllar per tu més endavant, quan els teus registres mostrin que hi vas ser.',
  // stats
  'help.guide.stats.title': 'Llegir les teves estadístiques',
  'help.guide.stats.goal': 'Saber què compten les xifres del panell, i què no.',
  'help.guide.stats.step.1':
    'Països és el nombre de països diferents on realment has estat; els planificats es mostren al costat, no a dins. Viatges, Llocs i Dies són totals de tots els teus viatges. Ciutats es dedueix de les adreces dels teus llocs, així que és una estimació.',
  'help.guide.stats.step.2':
    'Els continents mostren països visitats per continent; l’Antàrtida s’afegeix a la fila quan hi hagis estat. Després la teva ratxa, anys consecutius amb almenys un viatge, i quants viatges has fet aquest any.',
  'help.guide.stats.result':
    'Les xifres segueixen els teus viatges a mesura que els planifiques; aquí no cal mantenir res.',
  'help.guide.stats.tip.1':
    'Les ciutats es llegeixen del text de l’adreça, no es consulten, així que una adreça curta com «Osteria Francescana, Italy» o una que acaba en una prefectura pot donar una regió en lloc d’una ciutat.',
  'help.guide.stats.tip.2':
    'Els països marcats a mà compten a Països i als continents, però no aporten viatges, llocs ni dies.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Afegir països a partir dels teus registres',
  'help.guide.dawarich-countries.goal':
    'Deixa que Dawarich digui a quins països has estat durant l’últim any, i posa al mapa els que confirmis.',
  'help.guide.dawarich-countries.step.1':
    'Amb l’addon Dawarich connectat, un panell Dawarich és a la part de baix del mapa, a l’esquerra de les estadístiques, amb dos mosaics. Fes clic a Països.',
  'help.guide.dawarich-countries.step.2':
    'El diàleg s’obre a la pestanya Països. Fes clic a Busca països: TREK llegeix els països i les ciutats que cobreixen els teus registres dels darrers 12 mesos, mes a mes, així que dona-li un moment. Cada país que el teu Atlas encara no té surt llistat amb la seva bandera, quantes ciutats i la primera d’elles pel nom, i comença marcat; fes clic a una fila per deixar-la fora.',
  'help.guide.dawarich-countries.step.3':
    'Confirma amb el botó de baix a la dreta, que diu Afegeix 5 països quan hi ha cinc files marcades. El diàleg diu quants s’han afegit; tanca’l i el mapa ja s’ha tornat a llegir.',
  'help.guide.dawarich-countries.result':
    'Els països confirmats porten un color al mapa i compten a Països, registrats com a vinguts de Dawarich. El que has marcat a mà queda intacte.',
  'help.guide.dawarich-countries.tip.1':
    'Els països que l’Atlas ja mostra com a visitats, a mà, per un viatge o per una comprovació anterior, queden fora, així que les teves pròpies marques mai no es reetiqueten. Un país que abans havies tret de l’Atlas torna quan el confirmes aquí.',
  'help.guide.dawarich-countries.tip.2':
    'Un nom de país que TREK no pot aparellar surt llistat sota les files en lloc de descartar-se, i Tornar a comprovar ho torna a demanar a Dawarich. La nota sota la llista diu que s’han revisat els darrers 12 mesos; aquesta finestra és fixa.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Marcar desitjos a partir dels teus registres',
  'help.guide.dawarich-wishes.goal':
    'Descobreix quins llocs de la teva llista de desitjos has assolit de debò, i marca’ls el dia que va passar.',
  'help.guide.dawarich-wishes.step.1':
    'Al panell Dawarich de la part de baix del mapa, a l’esquerra de les estadístiques, fes clic a Llista de desitjos.',
  'help.guide.dawarich-wishes.step.2':
    'El diàleg s’obre a la pestanya Llista de desitjos. Fes clic a Comprova la llista de desitjos: TREK repassa els teus registres buscant cada entrada que té coordenades. Un desig que has assolit surt llistat amb com t’hi vas acostar, quant t’hi vas quedar i el dia, i comença marcat; un que ja havies marcat diu Ja marcat. Sota la llista, una nota compta les entrades sense coordenades, i la regla també hi és: Un desig es considera assolit a menys de 250 m i després de 20 minuts al lloc.',
  'help.guide.dawarich-wishes.step.3':
    'Confirma amb el botó de baix a la dreta, que diu Marca’n 2 quan hi ha dues files marcades. Després tanca el diàleg i obre la pestanya Llista de desitjos del panell del costat.',
  'help.guide.dawarich-wishes.result':
    'Cada desig porta un tic verd amb la data de l’estada, no la d’avui; el seu rètol diu Marcat a partir dels teus enregistraments de Dawarich, i un clic a la data ho desfà.',
  'help.guide.dawarich-wishes.tip.1':
    'Passar-hi de llarg no compta: la regla demana proximitat i temps alhora, i de diverses estades que hi encaixen guanya la més llarga. Un desig sense coordenades no es pot comprovar, així que afegeix els llocs amb la cerca d’Afegeix un lloc i no només pel nom.',
  'help.guide.dawarich-wishes.tip.2':
    'Una comprovació mira fins a 50 entrades, primer les que encara no estan marcades, i ho diu quan n’hi havia més. Un desig que ja estava marcat conserva la seva pròpia data.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Col·leccions',
  'help.ctx.collections.summary':
    'Collections és la teva biblioteca de llocs fora de qualsevol viatge: llistes amb nom de llocs que has trobat i vols conservar, cada lloc amb un estat Idea, Hi vull anar o Visitat. Els llocs es copien cap a dins i cap a fora dels viatges, mai s’enllacen, de manera que una llista i un viatge no es canvien mai l’un a l’altre.',
  'help.ctx.collections.bullet.1':
    'Barra de llistes a l’esquerra: les teves llistes, les compartides amb tu, invitacions que esperen un sí, Tot el desat com la unió de tot el que és teu, i Nova llista més la importació de fitxer a dalt de tot.',
  'help.ctx.collections.bullet.2':
    'Capçalera de la llista oberta: el seu color, portada, descripció i enllaços, els membres, i les accions Editar, Exporta i Compartir a la dreta.',
  'help.ctx.collections.bullet.3':
    'Fila de filtres sobre els llocs: estat, categoria, valoració i ordre, el filtre d’etiquetes, el + per afegir un lloc, la importació des d’un viatge i Triar per a accions en bloc.',
  'help.ctx.collections.bullet.4':
    'Files de llocs: avatar, nom i adreça, etiquetes i categoria, i la píndola d’estat a la dreta, que canvia amb un clic.',
  'help.ctx.collections.bullet.5':
    'Mapa a la dreta: una xinxeta per lloc amb coordenades, el commutador llista o mapa, el quadre de cerca i el filtre d’etiquetes. Fer clic en una xinxeta obre aquell lloc.',
  'help.ctx.collections.bullet.6':
    'Fitxa de detall: fes clic en una fila per veure portada, categoria, etiquetes, estat, descripció i enllaços, amb Editar, Copiar al viatge i Eliminar de la llista.',
  // create-list
  'help.guide.create-list.title': 'Crear una llista',
  'help.guide.create-list.goal': 'Comença una llista nova amb nom, amb un color i una portada, a punt per rebre llocs.',
  'help.guide.create-list.step.1': 'Fes clic a Nova llista a dalt de la barra de llistes.',
  'help.guide.create-list.step.2':
    'Posa un nom a la llista i tria un color. Imatge de portada, descripció i enllaços són opcionals; els pots afegir més tard amb Editar.',
  'help.guide.create-list.step.3': 'Fes clic a Crear.',
  'help.guide.create-list.result':
    'La llista s’obre buida, amb Afegir un lloc i Importa des d’un viatge com les dues maneres d’omplir-la.',
  'help.guide.create-list.tip.1':
    'La portada pot ser una pujada teva o una imatge trobada amb la cerca d’Unsplash al mateix diàleg.',
  // add-place
  'help.guide.add-place.title': 'Afegir un lloc',
  'help.guide.add-place.goal':
    'Troba un lloc i desa’l a la llista oberta amb nom, categoria, estat i notes d’una vegada.',
  'help.guide.add-place.step.1': 'Fes clic al + de la fila de filtres sobre els llocs.',
  'help.guide.add-place.step.2':
    'Escriu el lloc al camp de cerca i tria un resultat. Nom, adreça i coordenades s’omplen a partir d’ell.',
  'help.guide.add-place.step.3':
    'Posa l’estat i, si vols, una categoria, una descripció i enllaços, i després fes clic a Afegir. El diàleg es queda obert per al lloc següent; Cancel·lar el tanca.',
  'help.guide.add-place.result': 'El lloc apareix a la llista i, quan té coordenades, com una xinxeta al mapa.',
  'help.guide.add-place.tip.1':
    'Des de dins d’un viatge, Desar a la col·lecció a l’inspector del lloc o al menú del lloc posa un lloc del viatge en una llista sense sortir del viatge.',
  'help.guide.add-place.tip.2':
    'La llista ha de ser teva o una on siguis editor o administrador; el + no hi és a Tot el desat ni en una llista que només mires.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importar llocs d’un viatge',
  'help.guide.import-from-trip.goal':
    'Porta d’un cop tots els llocs d’un viatge a una llista en lloc de desar-los un per un.',
  'help.guide.import-from-trip.step.1':
    'Fes clic al botó d’importar amb la fletxa de núvol a la fila de filtres. En una llista buida la mateixa acció és al costat d’Afegir un lloc.',
  'help.guide.import-from-trip.step.2': 'Tria un dels teus viatges.',
  'help.guide.import-from-trip.step.3':
    'Marca els llocs que vulguis. Els que ja són a la llista surten en gris; els que no són en cap dia del viatge comencen seleccionats. Només nous amaga el que ja tens.',
  'help.guide.import-from-trip.step.4': 'Fes clic a Importa. El botó sempre diu quants estan a punt d’afegir-se.',
  'help.guide.import-from-trip.result':
    'Els llocs es copien a la llista amb nom, adreça, coordenades, descripció i categoria. El viatge es queda com estava.',
  'help.guide.import-from-trip.tip.1':
    'Els duplicats per nom o coordenades se salten automàticament, així que importar dues vegades no fa cap mal.',
  'help.guide.import-from-trip.tip.2':
    'Dins la llista de llocs d’un viatge, el mode de selecció ofereix en canvi Desar a la col·lecció per a un conjunt de llocs triats a mà.',
  // place-status
  'help.guide.place-status.title': 'Posar l’estat d’un lloc',
  'help.guide.place-status.goal': 'Tingues clar què és una idea, què és a la llista curta i on has estat.',
  'help.guide.place-status.step.1':
    'Fes clic a la píndola d’estat a l’extrem dret d’una fila de lloc. Idea passa a Hi vull anar.',
  'help.guide.place-status.step.2': 'Torna-hi a fer clic per a Visitat, i un cop més per tornar a començar a Idea.',
  'help.guide.place-status.result':
    'La píndola i el seu color canvien a l’instant; el filtre d’estat sobre la llista en porta el compte.',
  'help.guide.place-status.tip.1': 'L’estat és cosa de Collections: copiar un lloc a un viatge no se l’endú.',
  'help.guide.place-status.tip.2':
    'Des d’un viatge, Desar a la col·lecció mostra una píndola d’estat per cada llista on és el lloc, i el panell de llocs té l’acció Marca com a visitat per a una selecció.',
  // place-detail
  'help.guide.place-detail.title': 'Obrir un lloc desat',
  'help.guide.place-detail.goal': 'Mira-ho tot d’un lloc i actua: editar, copiar a un viatge, eliminar.',
  'help.guide.place-detail.step.1':
    'Fes clic en una fila de lloc. La fitxa de detall s’obre al costat de la llista i el mapa es desplaça fins al lloc.',
  'help.guide.place-detail.step.2':
    'A baix hi ha Editar, Copiar al viatge i Eliminar de la llista; la càmera de la portada canvia la foto automàtica per una de teva.',
  'help.guide.place-detail.result':
    'Editar desbloqueja nom, categoria, etiquetes, adreça, coordenades, descripció i enllaços directament a la fitxa.',
  'help.guide.place-detail.tip.1':
    'La portada s’obté automàticament quan el lloc no té imatge pròpia. La teva pujada pot ser JPG, PNG, GIF o WebP fins a 20 MB.',
  'help.guide.place-detail.tip.2':
    'Els membres d’una llista compartida també hi poden deixar una valoració amb estrelles, i el filtre de valoració de la fila de filtres fa servir la mitjana.',
  // labels
  'help.guide.labels.title': 'Agrupar llocs amb etiquetes',
  'help.guide.labels.goal':
    'Dona a una llista les seves pròpies etiquetes, com barris o dies, més enllà de les categories comunes.',
  'help.guide.labels.step.1': 'Obre el gestor d’etiquetes des del control d’etiquetes de la fila de filtres.',
  'help.guide.labels.step.2':
    'Escriu un nom, tria un color i fes clic a Afegir etiqueta. Reanomena, recolora o elimina etiquetes existents al mateix diàleg.',
  'help.guide.labels.step.3':
    'Activa Triar, marca els llocs i fes clic a Assignar etiqueta a la barra de selecció. Un sol lloc també rep etiquetes amb Editar a la seva fitxa de detall.',
  'help.guide.labels.step.4':
    'Tria una o més etiquetes a la fila de filtres per reduir la llista i el mapa als llocs que en portin alguna.',
  'help.guide.labels.result':
    'Els llocs etiquetats mostren les seves etiquetes a la fila; el filtre d’etiquetes hi és per a tots els membres, lectors inclosos.',
  'help.guide.labels.tip.1':
    'Les etiquetes pertanyen a l’única llista on es van crear. Moure un lloc a una altra llista les deixa enrere.',
  'help.guide.labels.tip.2': 'Gestionar i assignar etiquetes requereix drets d’edició a la llista.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrar i seleccionar llocs',
  'help.guide.filter-select.goal': 'Redueix la llista i actua sobre molts llocs alhora.',
  'help.guide.filter-select.step.1':
    'Fes servir els desplegables de la fila de filtres: estat, categoria, valoració mínima i ordre. Cadascun mostra quants llocs deixaria.',
  'help.guide.filter-select.step.2': 'Fes clic a Triar. Cada fila rep una casella i apareix una barra de selecció.',
  'help.guide.filter-select.step.3':
    'Marca llocs o fes servir Seleccionar-ho tot per a tot el que ara està filtrat, i després tria Assignar etiqueta, Moure a la llista, Duplicar a la llista, Copiar al viatge o Eliminar.',
  'help.guide.filter-select.result':
    'Les accions s’apliquen a tota la selecció d’un cop. La × de la dreta surt del mode de selecció.',
  'help.guide.filter-select.tip.1':
    'Seleccionar-ho tot segueix el filtre, així que filtrar per Hi vull anar i seleccionar-ho tot és la manera ràpida d’actuar sobre la llista curta.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Copiar llocs a un viatge',
  'help.guide.copy-to-trip.goal': 'Converteix llocs desats en parades d’un dels teus viatges.',
  'help.guide.copy-to-trip.step.1':
    'Activa Triar i marca els llocs, o obre un lloc i fes servir Copiar al viatge a la seva fitxa de detall.',
  'help.guide.copy-to-trip.step.2': 'Fes clic a Copiar al viatge a la barra de selecció.',
  'help.guide.copy-to-trip.step.3': 'Tria el viatge. El quadre de cerca escurça una llista llarga.',
  'help.guide.copy-to-trip.result':
    'Els llocs aterren a la llista de llocs d’aquell viatge amb nom, descripció, categoria, notes, preu, coordenades, foto i tags. No canvia res a la col·lecció.',
  'help.guide.copy-to-trip.tip.1':
    'Els lectors d’una llista compartida també ho poden fer; copia des de la llista, no la canvia.',
  // share-list
  'help.guide.share-list.title': 'Compartir una llista amb algú',
  'help.guide.share-list.goal': 'Planifica una llista juntament amb altres persones d’aquest TREK, en directe.',
  'help.guide.share-list.step.1': 'Fes clic a Compartir a la capçalera de la teva llista.',
  'help.guide.share-list.step.2': 'Selecciona l’usuari i un rol: Lector, Editor o Administrador.',
  'help.guide.share-list.step.3':
    'Fes clic a Envia la invitació. La persona apareix com a invitació pendent fins que accepta la invitació a la seva barra de llistes.',
  'help.guide.share-list.result':
    'Un cop acceptada, la llista li apareix sota Compartit i cada canvi se sincronitza en directe. Els membres i els seus rols continuen sent editables al mateix diàleg.',
  'help.guide.share-list.tip.1':
    'Els lectors poden mirar, valorar i copiar llocs als seus propis viatges. Els editors afegeixen i editen llocs i etiquetes. Els administradors també poden eliminar.',
  'help.guide.share-list.tip.2':
    'Només el propietari convida i treu persones; un membre pot deixar una llista compartida pel seu compte.',
  // export-list
  'help.guide.export-list.title': 'Exportar una llista com a fitxer',
  'help.guide.export-list.goal': 'Passa una llista a algú d’un altre TREK, o emporta-te-la a una app de mapes.',
  'help.guide.export-list.step.1': 'Fes clic a Exporta a la capçalera de la llista.',
  'help.guide.export-list.step.2':
    'Tria Llista del TREK per a un altre TREK, amb etiquetes i estat, o GPX per a OsmAnd, Organic Maps, un Garmin i altres apps que llegeixen waypoints.',
  'help.guide.export-list.result': 'El fitxer es descarrega. Qualsevol membre d’una llista compartida la pot exportar.',
  'help.guide.export-list.tip.1':
    'Un lloc sense coordenades no pot ser un waypoint GPX; es deixa fora i TREK et diu quants n’han quedat.',
  'help.guide.export-list.tip.2':
    'Valoracions, membres i fotos pujades es queden enrere a propòsit; pertanyen a aquest TREK, no a la llista.',
  // import-file
  'help.guide.import-file.title': 'Importar una llista des d’un fitxer',
  'help.guide.import-file.goal':
    'Porta un fitxer de Llista del TREK o un fitxer GPX, com a llista nova o a una que ja tens.',
  'help.guide.import-file.step.1':
    'Fes clic al botó d’importar amb la fletxa de pujada al costat de Nova llista a la barra de llistes.',
  'help.guide.import-file.step.2':
    'Tria el fitxer. TREK mostra què hi ha abans que passi res: el nom, quants llocs i quantes etiquetes.',
  'help.guide.import-file.step.3':
    'Deixa Llista nova i canvia el nom si vols, o tria Afegeix a una llista per posar els llocs en una llista que puguis editar, i després fes clic a Importa.',
  'help.guide.import-file.result':
    'Aterres a la llista amb els llocs importats. Afegeix a una llista només afegeix; els llocs que ja hi eren conserven l’estat, les notes i les etiquetes.',
  'help.guide.import-file.tip.1':
    'D’un GPX, cada waypoint amb nom es converteix en un lloc; els tracks són línies i es deixen fora, i la vista prèvia diu quants punts eren.',
  'help.guide.import-file.tip.2':
    'Un fitxer que no és ni una Llista del TREK ni un GPX es rebutja amb un motiu; un sol lloc il·legible se salta, no tot el fitxer.',
  // edit-list
  'help.guide.edit-list.title': 'Editar o eliminar una llista',
  'help.guide.edit-list.goal':
    'Canvia el nom, el color, la portada, la descripció o els enllaços d’una llista, o elimina la llista.',
  'help.guide.edit-list.step.1': 'Fes clic a Editar a la capçalera de la llista. Només el propietari ho veu.',
  'help.guide.edit-list.step.2':
    'Canvia el que vulguis i fes clic a Desar. Eliminar llista, a baix a l’esquerra, elimina la llista amb tots els seus llocs, després d’una confirmació.',
  'help.guide.edit-list.result': 'La capçalera agafa el nou color, la portada i la descripció de seguida.',
  'help.guide.edit-list.tip.1':
    'Eliminar una llista no es pot desfer. Exporta-la abans si vols conservar-ne una còpia.',
  // all-saved
  'help.guide.all-saved.title': 'Cercar a tota la teva biblioteca',
  'help.guide.all-saved.goal': 'Mira d’un cop totes les llistes que són teves.',
  'help.guide.all-saved.step.1':
    'Fes clic a Tot el desat a la barra de llistes. Uneix els llocs de cada llista que tens en propietat o en copropietat.',
  'help.guide.all-saved.step.2':
    'Fes servir el quadre de cerca i els filtres com a qualsevol llista; Triar també funciona aquí per copiar a un viatge.',
  'help.guide.all-saved.result':
    'Una sola vista sobre tots els teus llocs desats, sense afegir ni importar, ja que no hi ha cap llista concreta on posar-los.',
  'help.guide.all-saved.tip.1':
    'Les etiquetes són per llista, així que el filtre d’etiquetes no s’ofereix a Tot el desat.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Travesia',
  'help.ctx.journey.summary':
    'Travesia és el teu diari de viatge amb les fotos al davant. Cada travesia està lligada a un o més viatges i creix dia a dia a partir d’entrades amb relat, fotos, estat d’ànim i temps. Aquesta pantalla llista les teves travesies; obre’n una per escriure.',
  'help.ctx.journey.bullet.1':
    'El bàner de dalt mostra la travesia en curs, o la més recent, amb els seus recomptes d’entrades, fotos i llocs. Continua escrivint l’obre al dia d’avui.',
  'help.ctx.journey.bullet.2':
    'A sota, una targeta per travesia amb la portada, el subtítol, les dates i els recomptes. Fes clic en una targeta per obrir-la.',
  'help.ctx.journey.bullet.3':
    'L’última targeta de la graella, Crea una travesia nova, en comença una a partir dels teus viatges.',
  // create-journey
  'help.guide.create-journey.title': 'Crear una travesia',
  'help.guide.create-journey.goal':
    'Començar un diari per a un viatge, amb els llocs del viatge ja esperant com a suggeriments.',
  'help.guide.create-journey.step.1': 'Fes clic a Crea una travesia nova, l’última targeta de la graella.',
  'help.guide.create-journey.step.2':
    'Posa-li un nom i, si vols, un subtítol, i marca els viatges als quals pertany. El comptador diu quants llocs hi entraran.',
  'help.guide.create-journey.step.3': 'Fes clic a Crea una travesia.',
  'help.guide.create-journey.result':
    'El diari s’obre. Cada lloc dels viatges vinculats és a la cronologia com a suggeriment, un per cada dia en què es troba, a punt per escriure-hi.',
  'help.guide.create-journey.tip.1': 'Més viatges es poden vincular després des de Configuració de la travesia.',
  'help.guide.create-journey.tip.2':
    'Una travesia sense viatges també funciona; aleshores afegeixes les entrades a mà.',
  // open-journey
  'help.guide.open-journey.title': 'Obrir una travesia',
  'help.guide.open-journey.goal': 'Entrar en un diari, i saber on s’obre.',
  'help.guide.open-journey.step.1':
    'Fes clic en una targeta. Cadascuna mostra la portada, les dates i quantes entrades, fotos i llocs conté la travesia.',
  'help.guide.open-journey.result':
    'Una travesia en curs s’obre al dia d’avui, o a l’última entrada abans d’avui quan encara no hi ha res escrit; una d’acabada s’obre al principi.',
  'help.guide.open-journey.tip.1':
    'La portada és la primera foto de la travesia, tret que en fixis una a Configuració de la travesia.',
  // continue-writing
  'help.guide.continue-writing.title': 'Continuar la travesia en curs',
  'help.guide.continue-writing.goal': 'Anar directament a la pàgina d’avui de la travesia en què ets.',
  'help.guide.continue-writing.step.1':
    'Fes clic a Continua escrivint al bàner de dalt. Mostra la travesia en curs, o la més recent quan no n’hi ha cap.',
  'help.guide.continue-writing.result':
    'El diari s’obre al dia d’avui, o a l’última entrada abans d’avui quan encara no hi ha res escrit.',
  'help.guide.continue-writing.tip.1':
    'El bàner també ofereix un suggeriment per a un viatge que encara no té travesia; Descarta l’amaga.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Diari',
  'help.ctx.journey-detail.summary':
    'Una travesia oberta: la cronologia a l’esquerra, dia a dia, i el mapa a la dreta amb cada entrada i els llocs dels viatges vinculats. Tot el que afegeix al diari és a dalt; la capçalera té els recomptes, Studio, l’interruptor de suggeriments i Configuració de la travesia.',
  'help.ctx.journey-detail.bullet.1':
    'Capçalera: portada, títol i subtítol, els recomptes de dies, llocs, entrades i fotos, i a la dreta Studio, l’interruptor de suggeriments i Configuració de la travesia.',
  'help.ctx.journey-detail.bullet.2':
    'Barra d’eines: les pestanyes Cronologia i Galeria, Cerca en aquest viatge i Afegeix una entrada.',
  'help.ctx.journey-detail.bullet.3':
    'Cronologia: una secció per dia amb un + per afegir una entrada aquell dia; targetes d’entrada amb fotos, estat d’ànim, temps i relat; suggeriments dels viatges en un estil més clar, amb Descarta aquest suggeriment.',
  'help.ctx.journey-detail.bullet.4':
    'Mapa: les entrades com a xinxetes, unides per ordre de data amb una línia discontínua, els llocs dels viatges i les traces GPX importades en aquests viatges.',
  'help.ctx.journey-detail.bullet.5':
    'Configuració de la travesia: portada, nom i subtítol, traces al mapa, camps de l’entrada, suggeriments descartats, viatges vinculats, col·laboradors, compartició pública, arxivar i eliminar.',
  'help.ctx.journey-detail.bullet.6':
    'Dos botons rodons suren sobre una cronologia llarga: tornar a dalt i saltar a l’última entrada.',
  // add-entry
  'help.guide.add-entry.title': 'Escriure una entrada',
  'help.guide.add-entry.goal': 'Afegir el relat d’un dia amb títol, text, estat d’ànim i temps.',
  'help.guide.add-entry.step.1':
    'Fes clic a Afegeix una entrada a la barra d’eines, o al + de la capçalera d’un dia per començar aquell dia.',
  'help.guide.add-entry.step.2':
    'Posa nom al moment i escriu el relat. La barra sobre el text afegeix negreta, cursiva, títols, cites, enllaços i llistes en Markdown.',
  'help.guide.add-entry.step.3':
    'Tria un estat d’ànim i el temps, comprova la data i fixa una ubicació si vols: cerca un lloc o fes servir la teva posició actual.',
  'help.guide.add-entry.step.4': 'Fes clic a Desar.',
  'help.guide.add-entry.result':
    'L’entrada apareix al seu dia a la cronologia i com a xinxeta al mapa. Els seus recomptes s’actualitzen a la capçalera.',
  'help.guide.add-entry.tip.1': 'Escriure en un suggeriment és el mateix editor, amb el lloc ja posat.',
  'help.guide.add-entry.tip.2':
    'Les etiquetes de baix són text lliure, joia amagada o millor menjar, i la cerca les troba.',
  // entry-photos
  'help.guide.entry-photos.title': 'Afegir fotos i vídeos a una entrada',
  'help.guide.entry-photos.goal': 'Posar imatges en un dia; la primera es converteix en la portada de l’entrada.',
  'help.guide.entry-photos.step.1': 'Obre el menú d’una entrada amb el ⋯ de la seva targeta i tria Editar.',
  'help.guide.entry-photos.step.2':
    'Fes clic a Puja fotos i tria els fitxers. Des de la galeria agafa imatges que ja són a la galeria de la travesia; External photos cerca aquell dia en una biblioteca Immich o Synology connectada.',
  'help.guide.entry-photos.step.3':
    'Passa el ratolí per una imatge per Fes 1r i triar la portada, després fes clic a Desar.',
  'help.guide.entry-photos.result':
    'Les fotos es veuen a la targeta i a la galeria; la primera és la miniatura a tot arreu.',
  'help.guide.entry-photos.tip.1':
    'Els vídeos van en una entrada de la mateixa manera: mp4, m4v, webm o mov fins a 500 MB, desats tal com es pugen.',
  'help.guide.entry-photos.tip.2':
    'Els fitxers HEIC d’un iPhone es converteixen a JPEG en pujar-los, cosa que n’elimina les metadades de GPS i càmera.',
  // suggestions
  'help.guide.suggestions.title': 'Usar o descartar els suggeriments',
  'help.guide.suggestions.goal':
    'Convertir els llocs dels teus viatges en entrades, i treure del mig aquells sobre els quals no escriuràs.',
  'help.guide.suggestions.step.1':
    'Un suggeriment és una targeta més clara amb el nom del lloc en cursiva. Fes-hi clic per obrir l’editor amb el lloc i el dia ja posats.',
  'help.guide.suggestions.step.2':
    'Fes clic a Descarta aquest suggeriment en una targeta que no faràs servir. Surt de la cronologia sense esborrar-se, i la sincronització del viatge no el tornarà a oferir.',
  'help.guide.suggestions.step.3':
    'Has canviat d’idea? Configuració de la travesia mostra quants n’hi ha de descartats, i Recupera els suggeriments descartats els retorna tots.',
  'help.guide.suggestions.result':
    'La cronologia només conté el que penses escriure; l’interruptor de la capçalera amaga tots els suggeriments de cop mentre llegeixes.',
  'help.guide.suggestions.tip.1': 'Un lloc mantingut durant dos dies dona un suggeriment a cadascun.',
  'help.guide.suggestions.tip.2':
    'Els suggeriments mai no compten a les estadístiques; només compten les entrades escrites.',
  // add-on-day
  'help.guide.add-on-day.title': 'Afegir una entrada en un dia anterior',
  'help.guide.add-on-day.goal': 'Escriure sobre un dia que ja ha passat sense corregir la data després.',
  'help.guide.add-on-day.step.1': 'Fes clic al + de la capçalera d’aquell dia.',
  'help.guide.add-on-day.step.2': 'L’editor s’obre amb aquella data posada. Escriu i Desar com sempre.',
  'help.guide.add-on-day.result': 'L’entrada cau directament al dia correcte.',
  'help.guide.add-on-day.tip.1': 'Dins d’un dia, les fletxes del menú d’una entrada la mouen abans o després.',
  // pros-cons
  'help.guide.pros-cons.title': 'Afegir un veredicte',
  'help.guide.pros-cons.goal': 'Resumir un dia amb el que va ser genial i el que no.',
  'help.guide.pros-cons.step.1':
    'A l’editor, busca Pros i contres sota el relat. Escriu un punt a Pros o Contres i fes servir Afegeix-ne un altre per al següent.',
  'help.guide.pros-cons.step.2': 'Desar. El veredicte apareix a la targeta com dues llistes curtes.',
  'help.guide.pros-cons.result': 'Polze amunt i polze avall d’un cop d’ull, sota el relat.',
  'help.guide.pros-cons.tip.1':
    'Una travesia que no fa servir veredictes pot apagar la secció a Camps de l’entrada, a Configuració de la travesia.',
  // search-journey
  'help.guide.search-journey.title': 'Trobar alguna cosa en un diari llarg',
  'help.guide.search-journey.goal': 'Arribar a l’entrada que busques sense desplaçar-te per setmanes.',
  'help.guide.search-journey.step.1':
    'Escriu a Cerca en aquest viatge, a la barra d’eines. La cronologia es filtra mentre escrius, en títols, relats, llocs i etiquetes. Els accents i les majúscules no importen.',
  'help.guide.search-journey.step.2':
    'L’interruptor de suggeriments de la capçalera amaga les targetes sense escriure mentre llegeixes. Quan la cronologia es fa llarga, dos botons rodons suren sobre la vora inferior: tornar a dalt i saltar a l’última entrada.',
  'help.guide.search-journey.result':
    'Només queden les entrades que coincideixen; buida el quadre per tornar-ho a veure tot.',
  'help.guide.search-journey.tip.1':
    'Una travesia en curs s’obre al dia d’avui, així que la pàgina actual sol estar ja a la vista.',
  'help.guide.search-journey.tip.2':
    'Les etiquetes també compten: cercar joia amagada troba cada entrada etiquetada així.',
  // gallery-map
  'help.guide.gallery-map.title': 'Recórrer la galeria i el mapa',
  'help.guide.gallery-map.goal': 'Veure tota la travesia com a imatges, i com a llocs al mapa.',
  'help.guide.gallery-map.step.1':
    'Canvia a Galeria a la barra d’eines: cada foto de cada entrada, més les imatges pujades directament a la galeria. Fes clic en una per al visor.',
  'help.guide.gallery-map.step.2':
    'El mapa de la dreta mostra les entrades com a xinxetes per ordre de data, els llocs dels viatges vinculats i qualsevol traça GPX importada en aquests viatges, amb el color que té al planificador.',
  'help.guide.gallery-map.result':
    'Passa el ratolí per una traça per veure’n el nom. La línia discontínua entre entrades la dibuixa TREK; una traça és el recorregut que vas enregistrar de debò.',
  'help.guide.gallery-map.tip.1': 'Les traces es poden apagar per a una travesia a Configuració de la travesia.',
  'help.guide.gallery-map.tip.2':
    'Les fotos de la galeria amb ubicació també apareixen al mapa públic, quan Galeria i Mapa es comparteixen tots dos.',
  // entry-fields
  'help.guide.entry-fields.title': 'Apagar camps de l’entrada',
  'help.guide.entry-fields.goal': 'Limitar l’editor al que fa servir aquesta travesia.',
  'help.guide.entry-fields.step.1': 'Obre Configuració de la travesia des de la capçalera.',
  'help.guide.entry-fields.step.2': 'A Camps de l’entrada, apaga Estat d’ànim, Temps o Pros i contres.',
  'help.guide.entry-fields.result':
    'L’editor deixa de demanar-los. Res del que has escrit es perd: tornar a encendre un camp porta a la vista els valors desats, i una travesia compartida amaga els mateixos camps.',
  'help.guide.entry-fields.tip.1':
    'Els interruptors són per travesia, així que un viatge de feina i unes vacances poden diferir.',
  // link-trip
  'help.guide.link-trip.title': 'Vincular un altre viatge',
  'help.guide.link-trip.goal': 'Portar els llocs d’un segon viatge al diari com a suggeriments.',
  'help.guide.link-trip.step.1': 'Obre Configuració de la travesia des de la capçalera.',
  'help.guide.link-trip.step.2': 'Sota els viatges vinculats, fes clic a Afegeix un viatge.',
  'help.guide.link-trip.step.3': 'Tria el viatge.',
  'help.guide.link-trip.result':
    'Els seus llocs arriben a la cronologia com a suggeriments als seus dies, i les seves traces GPX s’afegeixen al mapa.',
  'help.guide.link-trip.tip.1':
    'La × al costat d’un viatge vinculat el desvincula de nou; les entrades que vas escriure es queden.',
  'help.guide.link-trip.tip.2':
    'Les entrades d’un dia compten només una vegada, per molts viatges que cobreixin aquell dia.',
  // share-public
  'help.guide.share-public.title': 'Compartir la travesia públicament',
  'help.guide.share-public.goal': 'Donar a gent sense compte de TREK un enllaç de només lectura.',
  'help.guide.share-public.step.1': 'Obre Configuració de la travesia i busca Compartició pública.',
  'help.guide.share-public.step.2': 'Fes clic a Crea un enllaç per compartir.',
  'help.guide.share-public.step.3':
    'Tria què veuen els visitants: Cronologia, Galeria i Mapa són interruptors separats. Copia posa l’enllaç al teu porta-retalls.',
  'help.guide.share-public.result':
    'Qui tingui l’enllaç veu les seccions activades i res més; els camps que vas apagar a Camps de l’entrada també hi queden amagats.',
  'help.guide.share-public.tip.1':
    'Les fotos apareixen al mapa públic només quan Galeria i Mapa estan tots dos encesos; amb Mapa apagat, les seves coordenades s’eliminen abans de sortir del servidor.',
  'help.guide.share-public.tip.2': 'Elimina l’enllaç al mateix lloc per acabar de compartir.',
  // contributors
  'help.guide.contributors.title': 'Escriure junts',
  'help.guide.contributors.goal': 'Deixar que un company de viatge afegeixi les seves pròpies entrades i fotos.',
  'help.guide.contributors.step.1': 'Obre Configuració de la travesia i baixa fins als col·laboradors.',
  'help.guide.contributors.step.2': 'Fes clic a Convida un col·laborador i cerca l’usuari per nom o correu.',
  'help.guide.contributors.step.3': 'Tria un rol i confirma.',
  'help.guide.contributors.result':
    'La travesia apareix a la seva llista i les seves entrades porten el seu nom. Treu un col·laborador amb la × del costat.',
  'help.guide.contributors.tip.1':
    'Els col·laboradors són per a gent d’aquest TREK. Per a tots els altres hi ha l’enllaç públic.',
  // studio
  'help.guide.studio.title': 'Maquetar la travesia com un àlbum de fotos',
  'help.guide.studio.goal': 'Convertir el diari en pàgines imprimibles.',
  'help.guide.studio.step.1': 'Fes clic a Studio a la capçalera. El dissenyador s’obre damunt de la travesia.',
  'help.guide.studio.step.2':
    'El nom de la travesia a l’esquerra de la barra superior és el camí de tornada; et deixa on eres.',
  'help.guide.studio.result':
    'La tira de pàgines a l’esquerra, la doble pàgina a la taula de treball, les propietats a la dreta. Auto layout construeix l’àlbum a partir de les teves entrades; Export genera un PDF a punt per imprimir.',
  'help.guide.studio.tip.1': 'Studio necessita una finestra d’almenys 1024 px d’amplada i no s’ofereix al mòbil.',
  'help.guide.studio.tip.2':
    'L’àlbum hereta l’accés de la travesia: qui pot llegir la travesia pot obrir-lo, qui pot editar-la pot desar.',
  // archive-journey
  'help.guide.archive-journey.title': 'Arxivar o eliminar una travesia',
  'help.guide.archive-journey.goal': 'Tancar una travesia acabada, o treure’n una per sempre.',
  'help.guide.archive-journey.step.1': 'Obre Configuració de la travesia.',
  'help.guide.archive-journey.step.2':
    'A baix de tot, Arxiva el viatge l’acaba i la marca com a arxivada; Restaura el viatge la torna. Eliminar la treu amb totes les entrades i fotos, després d’una confirmació.',
  'help.guide.archive-journey.result':
    'Una travesia arxivada continua sent llegible i compartible; només deixa d’obrir-se al dia d’avui.',
  'help.guide.archive-journey.tip.1':
    'Eliminar no es pot desfer, i no toca els viatges als quals la travesia estava vinculada.',
  'help.guide.archive-journey.tip.2': 'La portada, el nom i el subtítol són al mateix diàleg, a dalt.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio maqueta una travesia com un llibre de fotos imprimible. S’obre sobre el diari: la llista de pàgines i el contingut a l’esquerra, la doble pàgina en què treballes al mig, les seves propietats a la dreta. Auto layout construeix un primer esborrany a partir de les teves entrades; tot el que ve després és teu per moure, retallar i canviar d’estil, amb desfer per a cada pas.',
  'help.ctx.journey-studio.bullet.1':
    'Barra superior: Back to the journey, Book view, Undo i Redo, Page format, Auto layout i Export. La marca Desat al costat del títol et diu quan el llibre està emmagatzemat.',
  'help.ctx.journey-studio.bullet.2':
    'Columna a l’esquerra amb cinc seccions: Pages, Content (les fotos i entrades de la travesia), Elements (text, formes, línies, graelles, marcs, icones), Viatge (mapes, països, banderes i marques construïdes a partir de la travesia) i Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Taula de treball: la doble pàgina actual amb el sagnat i els marges de seguretat, la barra de zoom a sota, Fit to view i Baixa aquesta doble pàgina a la dreta.',
  'help.ctx.journey-studio.bullet.4':
    'Properties a la dreta: posició i mida, retall i punt focal, emplenar o ajustar, look, cantonades, marc, ordre d’apilament i bloqueig del que hi ha seleccionat; números de pàgina i el document quan no hi ha res.',
  'help.ctx.journey-studio.bullet.5':
    'El llibre té la forma d’un d’enquadernat: coberta, una primera pàgina solta, les dobles pàgines, una última pàgina solta i la contracoberta. Els números de pàgina compten des de la primera pàgina i s’imprimeixen tal com es mostren.',
  'help.ctx.journey-studio.bullet.6':
    'Diverses persones poden dissenyar alhora: cadascú veu els punters dels altres amb els seus noms, i desar sobre una versió que algú altre ha canviat torna com un conflicte en lloc de sobreescriure la seva feina.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Construir el llibre automàticament',
  'help.guide.studio-auto-layout.goal':
    'Aconsegueix amb un clic un primer esborrany complet a partir de les entrades i fotos del diari.',
  'help.guide.studio-auto-layout.step.1': 'Fes clic a Auto layout a la barra superior.',
  'help.guide.studio-auto-layout.step.2':
    'Tria Tot el llibre: substitueix totes les pàgines i conserva el teu títol i la configuració de pàgina. Aquesta pàgina només reconstrueix la que hi ha a la pantalla, i s’ofereix en una doble pàgina que ha sortit d’una entrada.',
  'help.guide.studio-auto-layout.step.3':
    'Repassa la llista de pàgines. Undo retorna tot el disseny si preferies el que tenies.',
  'help.guide.studio-auto-layout.result':
    'Una doble pàgina per entrada, en ordre, amb les fotos, el títol i la història col·locats per tu. Cada element continua seguint la seva entrada fins que l’edites.',
  'help.guide.studio-auto-layout.tip.1': 'Les dues opcions són passos de desfer normals, així que prova-les sense por.',
  'help.guide.studio-auto-layout.tip.2':
    'Un element que Auto layout ha lligat a una entrada segueix els canvis d’aquesta entrada fins que el toques a Properties; això trenca el vincle.',
  // studio-pages
  'help.guide.studio-pages.title': 'Afegir, moure i treure dobles pàgines',
  'help.guide.studio-pages.goal': 'Dona forma al llibre pàgina a pàgina.',
  'help.guide.studio-pages.step.1':
    'Obre Pages a la columna. Les miniatures són el llibre en ordre: coberta, primera pàgina, dobles pàgines, última pàgina, contracoberta.',
  'help.guide.studio-pages.step.2':
    'Afegeix una pàgina, a baix, en posa una de nova abans de l’última pàgina; el + entre dues miniatures n’insereix una just allà.',
  'help.guide.studio-pages.step.3':
    'Passa el ratolí per una miniatura per veure’n les accions: Mou abans, Mou després, Duplica la pàgina i Elimina la pàgina. Fes clic en una miniatura per obrir aquella doble pàgina a la taula de treball.',
  'help.guide.studio-pages.result':
    'La coberta, la primera i l’última pàgina i la contracoberta es queden on són; les dobles pàgines noves sempre cauen entremig.',
  'help.guide.studio-pages.tip.1':
    'Book view a la barra superior mostra tot el llibre en fulls, tal com s’enquadernarà.',
  'help.guide.studio-pages.tip.2': 'Els números de pàgina s’activen sota Document a Properties, sense res seleccionat.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Aplicar un layout a una doble pàgina',
  'help.guide.studio-layouts.goal': 'Dona a una doble pàgina una disposició a punt de marcs de foto i text.',
  'help.guide.studio-layouts.step.1':
    'Obre Layouts a la columna. Tretze layouts de doble pàgina i un joc a part per a la coberta, la contracoberta i les pàgines soltes.',
  'help.guide.studio-layouts.step.2':
    'Fes clic en un. La doble pàgina de la taula de treball n’agafa els marcs; les fotos i el text que ja tenies s’hi aboquen.',
  'help.guide.studio-layouts.result':
    'Els marcs buits esperen contingut: arrossega-hi una foto des de Content, o fes servir Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Un layout és un pas de desfer com qualsevol altre.',
  // studio-content
  'help.guide.studio-content.title': 'Posar fotos i entrades en una pàgina',
  'help.guide.studio-content.goal': 'Porta el material propi de la travesia a la doble pàgina.',
  'help.guide.studio-content.step.1':
    'Obre Content a la columna. Photos llista cada imatge de la travesia; Entries llista les entrades amb el seu text.',
  'help.guide.studio-content.step.2':
    'Arrossega una foto a la doble pàgina, o a un marc buit, o fes clic a Add to this page a sota. Puja fotos afegeix imatges que encara no són a la travesia.',
  'help.guide.studio-content.step.3':
    'Sota una entrada, Title, Story i Place posen aquell text a la pàgina com a element de text; Data i les coordenades arriben com a marques, i les fotos de l’entrada apareixen llistades allà mateix.',
  'help.guide.studio-content.result':
    'Una foto deixada anar es converteix en un element de foto; el text continua seguint l’entrada fins que l’edites.',
  'help.guide.studio-content.tip.1': 'El quadre de cerca a dalt de Content filtra les dues llistes.',
  'help.guide.studio-content.tip.2':
    'Deixar anar un fitxer des de l’escriptori a la taula de treball el puja i el col·loca d’un sol cop.',
  // studio-elements
  'help.guide.studio-elements.title': 'Afegir text, formes i icones',
  'help.guide.studio-elements.goal': 'Decora una doble pàgina més enllà de fotos i històries.',
  'help.guide.studio-elements.step.1': 'Obre Elements a la columna.',
  'help.guide.studio-elements.step.2':
    'Fes clic en un estil de text per a un titular o un peu, una forma, una línia, una graella, un marc buit amb un estil de marc o una icona de la biblioteca amb cercador. Cadascun cau al mig de la doble pàgina, a punt per moure.',
  'help.guide.studio-elements.result':
    'Fes doble clic en un element de text per escriure-hi; Properties conté tipus de lletra, pes, mida, espaiat i alineació.',
  'help.guide.studio-elements.tip.1': 'Els marcs són espais de foto buits: deixa-hi anar una imatge més tard.',
  // studio-travel
  'help.guide.studio-travel.title': 'Afegir un mapa, banderes i xifres',
  'help.guide.studio-travel.goal': 'Converteix la travesia mateixa en xifres sobre la pàgina.',
  'help.guide.studio-travel.step.1': 'Obre Viatge a la columna.',
  'help.guide.studio-travel.step.2':
    'Tria què afegir: un mapa del recorregut de les entrades, siluetes de països, una llista o graella de països, banderes, una marca de data, de dia o de distància, o un resum de tot el viatge. Cadascun es construeix amb les dades de la travesia i s’actualitza amb elles.',
  'help.guide.studio-travel.result':
    'L’element apareix a la doble pàgina; Properties n’ajusta l’estil, i al mapa l’àrea.',
  'help.guide.studio-travel.tip.1':
    'Les marques segueixen l’entrada d’on ha sortit la doble pàgina, així que una marca de data en una doble pàgina maquetada automàticament ja mostra aquell dia.',
  // studio-properties
  'help.guide.studio-properties.title': 'Editar el que has seleccionat',
  'help.guide.studio-properties.goal': 'Mou, retalla, dona estil i apila un element amb l’inspector.',
  'help.guide.studio-properties.step.1':
    'Fes clic en un element de la doble pàgina. Apareixen nanses per a la mida i la rotació; arrossega’l per moure’l.',
  'help.guide.studio-properties.step.2':
    'Properties a la dreta segueix la selecció: posició i mida, Crop amb el punt focal que decideix què queda dins del marc, Fill o Fit, els filtres de Look, el radi a Corner, l’estil a Marc, l’ordre d’apilament i Lock.',
  'help.guide.studio-properties.step.3':
    'Duplica i Delete són a dalt de l’inspector; Undo a la barra superior reverteix qualsevol d’aquests canvis.',
  'help.guide.studio-properties.result':
    'Un element bloquejat ja no es pot agafar a la pàgina, cosa que manté segur un disseny acabat mentre hi treballes al voltant.',
  'help.guide.studio-properties.tip.1': 'Maj+clic selecciona diversos elements; l’inspector els edita llavors junts.',
  'help.guide.studio-properties.tip.2':
    'Editar un element que Auto layout ha col·locat trenca el seu vincle amb l’entrada; deixa de seguir els canvis posteriors d’aquesta entrada.',
  // studio-format
  'help.guide.studio-format.title': 'Triar el format de pàgina',
  'help.guide.studio-format.goal': 'Fixa la mida a què s’imprimirà el llibre, abans que el disseny en depengui.',
  'help.guide.studio-format.step.1': 'Fes clic a Page format a la barra superior.',
  'help.guide.studio-format.step.2':
    'Tria Square 21 × 21 cm, Square 30 × 30 cm, A4 o A5 landscape o portrait, o introdueix una amplada i una alçada pròpies en mil·límetres. Sagnat i Seguretat són just a sota.',
  'help.guide.studio-format.result':
    'Cada doble pàgina es dibuixa a aquesta mida, amb 3 mm de sagnat i 5 mm de marge de seguretat per defecte.',
  'help.guide.studio-format.tip.1':
    'Canvia primer el format i després executa Auto layout; el disseny es construeix per a la mida que troba.',
  'help.guide.studio-format.tip.2': 'Demana a la teva impremta els seus valors de sagnat i seguretat i introdueix-los.',
  // studio-export
  'help.guide.studio-export.title': 'Exportar el llibre com a PDF',
  'help.guide.studio-export.goal': 'Aconsegueix un fitxer a punt per imprimir, o un per llegir en pantalla.',
  'help.guide.studio-export.step.1': 'Fes clic a Export a la barra superior.',
  'help.guide.studio-export.step.2':
    'Tria Pàgines soltes, una pàgina per full en ordre de lectura, que és el que vol una impremta, o Doble pàgina, dues pàgines alhora tal com s’obre el llibre. Marques de tall afegeix el sagnat a cada vora i marca per on tallar.',
  'help.guide.studio-export.step.3':
    'Fes clic a Vista d’impressió. El navegador obre les pàgines i Desa com a PDF les converteix en el fitxer.',
  'help.guide.studio-export.result':
    'Un PDF amb tants fulls com ha anunciat el diàleg, en el format de pàgina que has fixat.',
  'help.guide.studio-export.tip.1': 'Crear el PDF només es pot fer a l’escriptori, com Studio mateix.',
  'help.guide.studio-export.tip.2':
    'Per a una prova, exporta Doble pàgina sense marques de tall; per a la impremta, Pàgines soltes amb marques.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Reutilitzar una doble pàgina en un altre llibre',
  'help.guide.studio-spread-file.goal': 'Emporta’t un disseny que t’agrada del llibre d’una travesia a un altre.',
  'help.guide.studio-spread-file.step.1':
    'Amb la doble pàgina a la taula de treball, fes clic a Baixa aquesta doble pàgina a l’extrem dret de la barra de zoom. El fitxer conté el disseny, no les fotografies.',
  'help.guide.studio-spread-file.step.2':
    'A l’altre llibre, obre Pages i fes clic a Importa al costat d’Afegeix una pàgina, i després tria el fitxer.',
  'help.guide.studio-spread-file.result':
    'La doble pàgina arriba amb els seus marcs i estils de text; deixa anar les fotos de la nova travesia als marcs.',
  'help.guide.studio-spread-file.tip.1': 'Un fitxer que no és un disseny de doble pàgina es rebutja amb un motiu.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Configuració',
  'help.ctx.settings.summary':
    'La teva configuració personal, una pestanya per tema a la barra lateral de l’esquerra. La majoria d’interruptors s’apliquen en el moment que els canvies; un formulari amb un botó Desar a baix l’espera. Res d’aquí no canvia el TREK de ningú més.',
  'help.ctx.settings.bullet.1':
    'Barra lateral esquerra: Pantalla, Aparença, Mapa, Notificacions, Integracions, Fora de línia i Compte. Connectors apareix quan n’hi ha un d’instal·lat, Quant a allà on l’admin no ho hagi tret.',
  'help.ctx.settings.bullet.2':
    'Pantalla és idioma, unitats, divisa i amb què s’obre l’app; Aparença és tema, colors, mida del text i els ginys del tauler.',
  'help.ctx.settings.bullet.3':
    'Mapa tria el motor de renderització i el seu estil; Notificacions els canals que t’arriben; Integracions biblioteques de fotos, claus API i MCP; Fora de línia el que l’app guarda en aquest dispositiu.',
  'help.ctx.settings.bullet.4':
    'Compte conté el teu perfil, contrasenya, autenticació de dos factors, passkeys i l’eliminació del teu compte.',
  'help.ctx.settings-display.title': 'Pantalla',
  'help.ctx.settings-display.summary':
    'Idioma, unitats i divisa, com es comporten el mapa i les reserves, i amb què s’obre TREK. Cada canvi aquí s’aplica a l’instant.',
  'help.ctx.settings-display.bullet.1':
    'Idioma i regió: l’idioma de la interfície, el format d’hora, el primer dia de la setmana, la divisa de visualització, i les unitats de distància i temperatura.',
  'help.ctx.settings-display.bullet.2':
    'Viatge i mapa: rutes de reserva sempre al mapa, la píndola Explora llocs, optimització de la ruta des del teu allotjament, codis de reserva difuminats i rutes de reserva etiquetades.',
  'help.ctx.settings-display.bullet.3':
    'Inici: si TREK s’obre al tauler o al viatge actiu, i quina pestanya d’un viatge surt primer.',
  'help.ctx.settings-appearance.title': 'Aparença',
  'help.ctx.settings-appearance.summary':
    'Com es veu TREK en aquest compte: clar o fosc, el color d’accent, vidre i moviment, mida del text, i quins ginys mostra el tauler. Tot s’aplica en viu, a cada dispositiu on inicies sessió.',
  'help.ctx.settings-appearance.bullet.1':
    "Tema: Clar, Fosc o Automàtic, i l’Esquema de colors amb un Color d'accent personalitzat teu.",
  'help.ctx.settings-appearance.bullet.2':
    'Llegibilitat: Transparència, Reduir el moviment, Densitat i Mida del text, amb mides avançades per nivell.',
  'help.ctx.settings-appearance.bullet.3':
    'Ginys del tauler: un interruptor per giny, per separat per a Escriptori i Mòbil.',
  'help.ctx.settings-appearance.bullet.4': 'Restablir valors per defecte a baix ho torna tot al seu lloc.',
  'help.ctx.settings-map.title': 'Mapa',
  'help.ctx.settings-map.summary':
    'Quin motor dibuixa els mapes i amb quin estil. Leaflet és el mapa ràster clàssic, MapLibre dibuixa tessel·les vectorials sense cap token, Mapbox hi afegeix edificis 3D i relleu amb el teu propi token.',
  'help.ctx.settings-map.bullet.1':
    'Proveïdor de mapa: Leaflet, MapLibre o Mapbox, cadascun amb una línia sobre què necessita.',
  'help.ctx.settings-map.bullet.2':
    'Estil de mapa i Plantilla del mapa: l’aspecte de les tessel·les, més el token o la clau que demana un proveïdor.',
  'help.ctx.settings-map.bullet.3':
    "Mode d'alta qualitat per a l’antialiàsing i la projecció de globus; Desa el mapa escriu la tria.",
  'help.ctx.settings-notifications.title': 'Notificacions',
  'help.ctx.settings-notifications.summary':
    'On et troba TREK fora de l’app: notificacions push en aquest dispositiu, un tema de ntfy, un webhook o un canal que aporta un connector. Sota els canals, una fila per esdeveniment decideix què va on.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: el tema, un servidor propi opcional i un token d’accés opcional, amb Prova per enviar-ne un a l’instant.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: una URL que rep cada esdeveniment com a JSON, amb Prova.',
  'help.ctx.settings-notifications.bullet.3':
    'Notificacions push en aquest dispositiu: Activa en aquest dispositiu només afecta el navegador que fas servir, així que repeteix-ho a cada mòbil o ordinador. Envia una prova arriba a tots.',
  'help.ctx.settings-notifications.bullet.4':
    'Les files de preferències: per esdeveniment, quin canal està actiu. Els canals de connectors mostren Configura fins que estan configurats.',
  'help.ctx.settings-integrations.title': 'Integracions',
  'help.ctx.settings-integrations.summary':
    'Tot el que es connecta a TREK des de fora: biblioteques de fotos per a la travesia, claus API per a scripts, i l’endpoint MCP amb els seus tokens i clients OAuth per a assistents d’IA.',
  'help.ctx.settings-integrations.bullet.1':
    'Proveïdors de fotos: Immich i Synology Photos, cadascun amb la seva URL i clau, Prova la connexió i Desar.',
  'help.ctx.settings-integrations.bullet.2':
    'Claus API: claus personals per a scripts i altres eines que criden l’API de TREK en nom teu.',
  'help.ctx.settings-integrations.bullet.3':
    'Configuració MCP: l’endpoint, una configuració de client a punt per copiar, i els tokens API.',
  'help.ctx.settings-integrations.bullet.4':
    'Clients OAuth 2.1: apps que inicien sessió a través de TREK, amb URIs de redirecció, àmbits permesos, clients de màquina i les sessions actives.',
  'help.ctx.settings-offline.title': 'Fora de línia',
  'help.ctx.settings-offline.summary':
    'El que TREK guarda en aquest dispositiu perquè un viatge s’obri igualment sense connexió, i què passa quan un canvi fet fora de línia xoca amb un de fet en un altre lloc.',
  'help.ctx.settings-offline.bullet.1':
    'Mode fora de línia: Forçar mode fora de línia fa que l’app es comporti com si la xarxa hagués desaparegut, per provar o en una connexió amb dades limitades.',
  'help.ctx.settings-offline.bullet.2':
    "Preparar per a l'ús fora de línia: Descarregar per a ús fora de línia baixa ara els teus viatges i les seves tessel·les de mapa.",
  'help.ctx.settings-offline.bullet.3':
    'Què desar fora de línia: tessel·les de mapa actives o no, i un interruptor per viatge.',
  'help.ctx.settings-offline.bullet.4':
    'Conflictes de sincronització i Memòria cau fora de línia: l’estratègia per a les col·lisions, el recompte de canvis pendents i fallits, Sincronitzar ara i Netejar memòria cau.',
  'help.ctx.settings-account.title': 'Compte',
  'help.ctx.settings-account.summary':
    'Qui ets en aquest TREK i com inicies sessió: perfil i avatar, contrasenya, autenticació de dos factors, passkeys, i al final de tot l’eliminació del compte.',
  'help.ctx.settings-account.bullet.1': 'Perfil: usuari, correu i avatar, desats amb Desa el perfil.',
  'help.ctx.settings-account.bullet.2':
    'Canvia la contrasenya: contrasenya actual, la nova dues vegades, Actualitza la contrasenya.',
  'help.ctx.settings-account.bullet.3':
    'Autenticació de dos factors (2FA) amb una app d’autenticació i codis de reserva; Passkeys per iniciar sessió sense contrasenya.',
  'help.ctx.settings-account.bullet.4':
    'Elimina el compte a baix, darrere d’una confirmació. L’últim admin no es pot eliminar a si mateix.',
  // language-region
  'help.guide.language-region.title': 'Definir idioma, unitats i divisa',
  'help.guide.language-region.goal': 'Fes que TREK parli la teva llengua i compti com tu.',
  'help.guide.language-region.step.1':
    'Tria l’idioma de la interfície a Idioma i regió. TREK canvia a l’instant, a cada dispositiu on inicies sessió.',
  'help.guide.language-region.step.2':
    'A sota, tria el format d’hora, el dia en què comença la setmana a tots els selectors de data, la divisa de visualització, i les unitats de distància i temperatura.',
  'help.guide.language-region.result':
    'Dates, distàncies i diners es llegeixen com esperes; la divisa pròpia d’un viatge continua apareixent al costat dels imports convertits.',
  'help.guide.language-region.tip.1':
    'La divisa de visualització és per als totals entre viatges; cada viatge conserva la divisa que li vas donar.',
  'help.guide.language-region.tip.2': 'L’idioma també fixa els noms de dies i mesos a Vacay i a la travesia.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Ajustar com es comporten el mapa i les reserves',
  'help.guide.travel-map-prefs.goal': 'Decideix què mostra el mapa del viatge per defecte.',
  'help.guide.travel-map-prefs.step.1':
    "A Viatge i mapa, Mostra sempre les rutes de reserva manté vols i trens al mapa encara que el seu dia no estigui obert; Explora llocs al mapa mostra la píndola per trobar llocs; Optimitza la ruta des de l'allotjament comença la ruta on dorms.",
  'help.guide.travel-map-prefs.step.2':
    'Difumina els codis de reserva amaga els números de confirmació fins que hi passes el ratolí; Etiquetes de rutes de reserves escriu el nom de la reserva al llarg de la seva ruta.',
  'help.guide.travel-map-prefs.result':
    'El mapa del viatge segueix aquests ajustos a tots els viatges, fins que els tornis a canviar.',
  'help.guide.travel-map-prefs.tip.1':
    'Són per compte, no per viatge. Cada membre d’un viatge compartit veu les seves pròpies tries.',
  // startup
  'help.guide.startup.title': 'Triar amb què s’obre TREK',
  'help.guide.startup.goal': 'Aterra on més treballes, no al tauler cada vegada.',
  'help.guide.startup.step.1': "A Inici, posa Pàgina d'inici a Tauler o Viatge actiu.",
  'help.guide.startup.step.2': "Pestanya d'inici tria quina pestanya d’un viatge surt primer quan n’obres un.",
  'help.guide.startup.result': 'El proper inici de sessió i el proper toc al logo hi porten directament.',
  'help.guide.startup.tip.1': 'Viatge actiu és el viatge en curs avui, o el següent quan no n’hi ha cap.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Definir el tema i el color d’accent',
  'help.guide.theme-scheme.goal': 'Fes TREK clar, fosc o com el teu dispositiu, en el color que t’agradi.',
  'help.guide.theme-scheme.step.1': 'A Tema, tria Clar, Fosc o Automàtic. Automàtic segueix el teu dispositiu.',
  'help.guide.theme-scheme.step.2':
    'Tria un Esquema de colors: Per defecte, Alt contrast, Anil, Xarxet, Rosa, Ambre, Violeta o Personalitzat.',
  'help.guide.theme-scheme.step.3':
    'Amb Personalitzat, tria un accent dels predefinits o introdueix el teu. Una comprovació de contrast al costat diu si el text s’hi continua llegint.',
  'help.guide.theme-scheme.result':
    'Botons, enllaços i ressaltats prenen l’accent a tot arreu, a cada dispositiu on inicies sessió.',
  'help.guide.theme-scheme.tip.1':
    'La barra de navegació també té un interruptor ràpid clar o fosc; fixa el mateix tema.',
  'help.guide.theme-scheme.tip.2': 'Alt contrast és l’esquema a triar quan el per defecte es llegeix massa suau.',
  // readability
  'help.guide.readability.title': 'Ajustar la llegibilitat i la mida del text',
  'help.guide.readability.goal': 'Menys vidre, menys moviment, més espai o lletra més gran.',
  'help.guide.readability.step.1':
    'A Llegibilitat, Transparència canvia els panells de vidre per superfícies sòlides, Reduir el moviment redueix les animacions al mínim, i Densitat tria Còmode o Compacte.',
  'help.guide.readability.step.2':
    'Mida del text escala Tot d’una vegada; Mides de text avançades deixa que títols, subtítols, cos i peus difereixin.',
  'help.guide.readability.result': 'Tota l’app segueix a l’instant, inclosos els panells del mapa i la travesia.',
  'help.guide.readability.tip.1': 'Reduir el moviment també segueix l’ajust del teu sistema quan no el toques.',
  'help.guide.readability.tip.2':
    'La mida del text s’aplica a través dels nivells tipogràfics, així que res no es talla; una mida que ja no hi cap salta de línia.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Triar els ginys del tauler',
  'help.guide.dashboard-widgets.goal': 'Mostra només els ginys que fas servir, per separat a l’escriptori i al mòbil.',
  'help.guide.dashboard-widgets.step.1':
    'A Ginys del tauler, activa o desactiva cada giny per a Escriptori i per a Mòbil: la barra lateral dreta sencera, divisa, col·leccions, zones horàries, properes reserves, països de l’Atlas i les xifres de viatge.',
  'help.guide.dashboard-widgets.step.2': 'Restablir valors per defecte a baix torna tota la pestanya a com venia.',
  'help.guide.dashboard-widgets.result':
    'El tauler es reordena a l’instant; amb la barra lateral dreta apagada es centra.',
  'help.guide.dashboard-widgets.tip.1':
    'Els ginys d’un addon només apareixen mentre l’admin tingui aquell addon actiu.',
  'help.guide.dashboard-widgets.tip.2':
    'El mateix tauler recorda la teva vista de quadrícula o llista i l’ordre per dispositiu.',
  // map-provider
  'help.guide.map-provider.title': 'Triar el motor i l’estil del mapa',
  'help.guide.map-provider.goal': 'Canvia entre el mapa clàssic, les tessel·les vectorials i el mapa 3D de Mapbox.',
  'help.guide.map-provider.step.1':
    'A Proveïdor de mapa, tria Leaflet per al mapa 2D clàssic amb qualsevol tessel·la ràster, MapLibre per a tessel·les vectorials d’OpenFreeMap sense token, o Mapbox per a tessel·les vectorials amb edificis 3D i relleu.',
  'help.guide.map-provider.step.2':
    "Tria un Estil de mapa o una Plantilla del mapa per a l’aspecte. Mapbox necessita un Token d'accés de Mapbox, alguns estils ràster una Clau d'API de CARTO; l’enllaç al costat del camp porta on aconseguir-ne una.",
  'help.guide.map-provider.step.3':
    "Mode d'alta qualitat afegeix antialiàsing i la projecció de globus. Fes clic a Desa el mapa.",
  'help.guide.map-provider.result':
    'Cada mapa de TREK, viatges, Atlas, Col·leccions i la travesia, el dibuixa el motor que has triat.',
  'help.guide.map-provider.tip.1': 'Sense token, Mapbox recorre al mapa per defecte en lloc de no mostrar res.',
  'help.guide.map-provider.tip.2':
    'Les tessel·les de mapa que deses fora de línia vénen del proveïdor actiu quan les descarregues.',
  // notification-channels
  'help.guide.notification-channels.title': 'Configurar on t’arriben les notificacions',
  'help.guide.notification-channels.goal':
    'Rep recordatoris de viatge i esdeveniments de col·laboració al mòbil o en una altra eina.',
  'help.guide.notification-channels.step.1':
    "A Notificacions, omple un Tema de Ntfy; afegeix la teva pròpia URL del servidor Ntfy (opcional) i un Token d'accés (opcional) si en tens un. Prova envia un missatge a l’instant.",
  'help.guide.notification-channels.step.2':
    'O indica una URL del webhook que rebi cada esdeveniment com a JSON, i prova-la igual amb Prova.',
  'help.guide.notification-channels.step.3':
    'A les files de sota, activa o desactiva cada esdeveniment per canal. Un canal de connector diu Configura fins que està configurat a la configuració del connector; Envia una prova en prova un.',
  'help.guide.notification-channels.result':
    'Els esdeveniments surten pels canals actius. La campana de la barra de navegació els continua mostrant a l’app igualment.',
  'help.guide.notification-channels.tip.1':
    'Les preferències per viatge viuen al mateix viatge, a la seva configuració de notificacions.',
  'help.guide.notification-channels.tip.2':
    'L’admin pot preomplir un servidor ntfy per defecte per a tothom; tu continues triant el teu propi tema.',
  // photo-providers
  'help.guide.photo-providers.title': 'Connectar una biblioteca de fotos',
  'help.guide.photo-providers.goal': 'Deixa que la travesia agafi les fotos del dia d’Immich o Synology Photos.',
  'help.guide.photo-providers.step.1':
    'A Integracions, busca la secció del proveïdor i introdueix la seva URL i clau API. Immich també ofereix reflectir les pujades de la travesia de tornada a la biblioteca.',
  'help.guide.photo-providers.step.2': 'Fes clic a Prova la connexió i després a Desar.',
  'help.guide.photo-providers.result':
    'La pestanya External photos de l’editor d’entrades cerca a la biblioteca connectada el dia de l’entrada, primer les més properes a la ubicació de l’entrada.',
  'help.guide.photo-providers.tip.1':
    'La connexió és teva: els altres membres d’una travesia connecten les seves pròpies biblioteques.',
  'help.guide.photo-providers.tip.2':
    'Un proveïdor sense dades GPS a les fotos funciona igualment; la llista va llavors en ordre de temps.',
  // api-keys
  'help.guide.api-keys.title': 'Crear una clau API',
  'help.guide.api-keys.goal': 'Deixa que un script o una altra eina cridi l’API de TREK com tu.',
  'help.guide.api-keys.step.1': 'A Claus API, fes clic a Crea una clau i posa-li un nom que digui on es farà servir.',
  'help.guide.api-keys.step.2':
    'Copia la clau del diàleg: només es mostra una vegada. Elimina una clau de la llista quan l’eina ja no la necessiti.',
  'help.guide.api-keys.result':
    'Les peticions amb aquesta clau actuen amb els teus permisos; la llista mostra quan es va crear i es va usar per última vegada cada clau.',
  'help.guide.api-keys.tip.1': 'Una clau per eina fa que revocar sigui indolor.',
  'help.guide.api-keys.tip.2':
    'Per a un assistent d’IA fes servir MCP amb OAuth; les claus API són per a clients HTTP senzills.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Connectar un assistent d’IA per MCP',
  'help.guide.mcp-oauth.goal': 'Dóna a Claude, a un IDE o a un altre client MCP accés als teus viatges.',
  'help.guide.mcp-oauth.step.1':
    'A Configuració MCP, copia l’Endpoint MCP, o tota la Configuració del client per a un client que accepti un fragment JSON.',
  'help.guide.mcp-oauth.step.2':
    'Els clients que inicien sessió pel navegador fan servir OAuth 2.1: Client nou a Clients OAuth 2.1, amb les seves URIs de redirecció, els Àmbits permesos i, per a un servidor sense navegador, Client de màquina.',
  'help.guide.mcp-oauth.step.3':
    'Renova el secret i Elimina el client són a cada client; Sessions OAuth actives llista què té la sessió iniciada i et deixa revocar-ho. Tokens API amb Crea un token nou és la via antiga d’entrada.',
  'help.guide.mcp-oauth.result':
    'El client pot llegir i canviar el que els seus àmbits permeten, com tu, i cada acció apareix amb el teu nom.',
  'help.guide.mcp-oauth.tip.1':
    'Els àmbits són la xarxa de seguretat: dóna a un client només l’àmbit de lectura fins que en necessiti més.',
  'help.guide.mcp-oauth.tip.2': 'L’admin pot desactivar MCP per a tota la instància; llavors aquesta secció no hi és.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Endur-se viatges fora de línia',
  'help.guide.offline-prepare.goal':
    'Tingues els teus viatges i els seus mapes en aquest dispositiu abans que caigui la connexió.',
  'help.guide.offline-prepare.step.1':
    'A Què desar fora de línia, deixa Desar tessel·les de mapes fora de línia activat i activa els viatges que vols en aquest dispositiu.',
  'help.guide.offline-prepare.step.2':
    "Fes clic a Descarregar per a ús fora de línia a Preparar per a l'ús fora de línia. Baixa els viatges i les tessel·les al voltant dels seus llocs.",
  'help.guide.offline-prepare.step.3':
    'Forçar mode fora de línia a Mode fora de línia et deixa comprovar que hi és tot abans de marxar.',
  'help.guide.offline-prepare.result':
    'Els viatges s’obren sense connexió; els canvis que fas esperen en una cua i surten en reconnectar.',
  'help.guide.offline-prepare.tip.1':
    'Les tessel·les són el que més espai ocupa: la secció Memòria cau fora de línia mostra què hi ha desat, per viatge.',
  'help.guide.offline-prepare.tip.2':
    'Instal·la TREK com a app des del navegador per a l’inici fora de línia més fluid.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Decidir què guanya en un conflicte de sincronització',
  'help.guide.offline-conflicts.goal':
    'Tria com resol TREK un canvi fet fora de línia davant d’un de fet en un altre lloc.',
  'help.guide.offline-conflicts.step.1':
    "A Conflictes de sincronització, tria Pregunta'm cada vegada, Mantingues sempre la meva versió o Mantingues sempre la versió del servidor.",
  'help.guide.offline-conflicts.step.2':
    'Memòria cau fora de línia mostra viatges, canvis pendents i fallits i conflictes; Sincronitzar ara empeny la cua, Netejar memòria cau buida el dispositiu.',
  'help.guide.offline-conflicts.result':
    "Amb Pregunta'm, un conflicte mostra les dues versions i et deixa triar; amb les altres dues es resol en silenci.",
  'help.guide.offline-conflicts.tip.1':
    'Netejar memòria cau només elimina la còpia d’aquest dispositiu; res del servidor no es toca.',
  // profile
  'help.guide.profile.title': 'Canviar el teu perfil',
  'help.guide.profile.goal': 'Actualitza el teu nom, correu i imatge.',
  'help.guide.profile.step.1':
    'A Compte, edita Usuari i Correu. L’avatar admet una pujada teva; treu-lo per tornar a les inicials.',
  'help.guide.profile.step.2': 'Fes clic a Desa el perfil.',
  'help.guide.profile.result':
    'El teu nom i la teva imatge s’actualitzen a tot arreu alhora, inclosos els viatges que comparteixes.',
  'help.guide.profile.tip.1':
    'Un compte que inicia sessió per OIDC ho mostra aquí; el correu ve llavors del proveïdor.',
  // password
  'help.guide.password.title': 'Canviar la teva contrasenya',
  'help.guide.password.goal': 'Posa una contrasenya nova.',
  'help.guide.password.step.1':
    'A Canvia la contrasenya, escriu la teva contrasenya actual i després la nova dues vegades.',
  'help.guide.password.step.2': 'Fes clic a Actualitza la contrasenya.',
  'help.guide.password.result':
    'La contrasenya nova val des del proper inici de sessió; les altres sessions continuen obertes.',
  'help.guide.password.tip.1': 'Un compte que inicia sessió per OIDC no té contrasenya de TREK per canviar.',
  // mfa
  'help.guide.mfa.title': 'Activar l’autenticació de dos factors',
  'help.guide.mfa.goal': 'Protegeix el compte amb un codi d’una app d’autenticació.',
  'help.guide.mfa.step.1': "A Autenticació de dos factors (2FA), fes clic a Configura l'autenticador.",
  'help.guide.mfa.step.2':
    'Escaneja el codi QR amb la teva app, o introdueix el secret a mà, després tecleja el codi de sis dígits que mostra i fes clic a Activa el 2FA.',
  'help.guide.mfa.step.3':
    'Guarda els codis de reserva: copia’ls, descarrega’ls o imprimeix-los. Cadascun serveix una vegada, quan no tens el mòbil a mà.',
  'help.guide.mfa.result': 'Cada inici de sessió demana un codi després de la contrasenya.',
  'help.guide.mfa.tip.1': 'Desactiva el 2FA necessita la teva contrasenya i un codi vigent.',
  'help.guide.mfa.tip.2': 'L’admin pot exigir el 2FA a tothom; llavors no es pot desactivar aquí.',
  // passkeys
  'help.guide.passkeys.title': 'Iniciar sessió amb una passkey',
  'help.guide.passkeys.goal': 'Fes servir l’empremta, la cara o el PIN del teu dispositiu en lloc d’una contrasenya.',
  'help.guide.passkeys.step.1':
    'A Passkeys, fes clic a Afegeix una passkey i confirma amb el teu dispositiu. Posa-li un nom que digui quin dispositiu és.',
  'help.guide.passkeys.step.2':
    'La llista mostra cada passkey amb el seu nom i l’últim ús; el botó d’eliminar en treu una.',
  'help.guide.passkeys.result':
    'La pàgina d’inici de sessió ofereix la passkey; la contrasenya queda com a alternativa.',
  'help.guide.passkeys.tip.1':
    'Una passkey viu al dispositiu o al seu gestor de contrasenyes, així que afegeix-ne una per dispositiu.',
  'help.guide.passkeys.tip.2':
    'Les passkeys necessiten HTTPS; en una instància amb HTTP senzill la secció explica per què no estan disponibles.',
  // delete-account
  'help.guide.delete-account.title': 'Eliminar el teu compte',
  'help.guide.delete-account.goal': 'Elimina el teu compte i les dades que són només teves.',
  'help.guide.delete-account.step.1': 'Al final de tot de Compte, fes clic a Elimina el compte i confirma.',
  'help.guide.delete-account.result':
    'El teu compte, els teus propis viatges i les teves travesies desapareixen; els viatges que comparteixes amb altres es queden amb ells.',
  'help.guide.delete-account.tip.1':
    'L’últim admin d’una instància no es pot eliminar a si mateix; fes admin algú altre abans.',
  'help.guide.delete-account.tip.2': 'No es pot desfer. Exporta el que vulguis conservar abans de confirmar.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administració',
  'help.ctx.admin.summary':
    'La instància darrere del TREK de tothom: qui pot iniciar sessió i com, què està activat, on viuen els fitxers, com el servidor arriba a la gent i com es fa la còpia de seguretat. Només els admins veuen aquesta pàgina; cada pestanya és una pantalla pròpia a la barra lateral.',
  'help.ctx.admin.bullet.1':
    'Les quatre targetes de dalt compten usuaris, viatges, llocs i fitxers; un bàner a sobre anuncia una versió més nova de TREK.',
  'help.ctx.admin.bullet.2':
    'Usuaris i Valors per defecte: comptes, enllaços d’invitació i la configuració de mapa amb què comença un compte nou.',
  'help.ctx.admin.bullet.3':
    'Personalització, Configuració, Complements i Connectors: plantilles d’equipatge, categories i vacances escolars; mètodes d’inici de sessió i claus API; els mòduls de funcions; connectors de tercers.',
  'help.ctx.admin.bullet.4':
    'Emmagatzematge, Notificacions, Accés MCP i GitHub: on van les pujades, els canals de tota la instància, tokens i sessions de clients d’IA, i l’historial de versions.',
  'help.ctx.admin.bullet.5':
    'Còpia de seguretat i Auditoria: còpies a demanda i programades, i el registre d’esdeveniments rellevants per a la seguretat.',
  'help.ctx.admin-users.title': 'Usuaris',
  'help.ctx.admin-users.summary':
    'Cada compte d’aquest TREK, amb rol, correu i últim inici de sessió, i els enllaços d’invitació que permeten a la gent registrar-se en una instància tancada.',
  'help.ctx.admin-users.bullet.1':
    'La taula: usuari, correu, rol, data de creació, últim accés i les accions per fila. Tu apareixes marcat com a tu.',
  'help.ctx.admin-users.bullet.2': 'Crea usuari a dalt afegeix un compte a mà, amb una contrasenya que entregues tu.',
  'help.ctx.admin-users.bullet.3':
    "Enllaços d'invitació a sota: enllaços de registre d’un sol ús amb un límit d’usos, una caducitat i, si vols, un viatge al qual el nou usuari s’uneix en arribar.",
  'help.ctx.admin-users.bullet.4':
    "Configuració de permisos a baix de tot: per acció, qui la pot fer, Tothom, Membres del viatge, Propietari del viatge o Només l'administrador.",
  'help.ctx.admin-defaults.title': 'Valors per defecte',
  'help.ctx.admin-defaults.summary':
    'La configuració amb què comença un compte nou, perquè ningú hagi de buscar primer la pestanya del mapa: motor de mapes, estil, tokens i qualitat.',
  'help.ctx.admin-defaults.bullet.1':
    'Motor de mapes, estil i token de Mapbox, clau CARTO i qualitat de Mapbox, exactament com els posaria un usuari a Configuració, Mapa.',
  'help.ctx.admin-defaults.bullet.2':
    'Restaurar per camp torna la tria pròpia de TREK; la configuració pròpia d’un usuari sempre guanya a aquestes.',
  'help.ctx.admin-config.title': 'Personalització',
  'help.ctx.admin-config.summary':
    'El que comparteixen tots els viatges de la instància: plantilles d’equipatge, el conjunt de categories per a llocs i col·leccions, i el catàleg de vacances escolars del qual beu Vacay.',
  'help.ctx.admin-config.bullet.1':
    "Plantilles d'equipatge: llistes amb nom de categories i articles de les quals pot partir la llista d’equipatge d’un viatge.",
  'help.ctx.admin-config.bullet.2':
    'Categories: nom, icona i color de les categories que s’usen a tot TREK, de l’inspector de llocs a Col·leccions.',
  'help.ctx.admin-config.bullet.3':
    'Vacances escolars: el catàleg de països i regions, per a llocs que les fonts integrades no cobreixen.',
  'help.ctx.admin-settings.title': 'Configuració',
  'help.ctx.admin-settings.summary':
    'Com entra la gent i amb què pot parlar el servidor: mètodes d’inici de sessió i registre, SSO, claus d’accés, política de dos factors, les claus API per a mapes, llocs i imatges, els proveïdors de cerca i transport, i els tipus de fitxer que poden tenir les pujades.',
  'help.ctx.admin-settings.bullet.1':
    "Mètodes d'autenticació: Inici de sessió amb contrasenya, Registre amb contrasenya, Inici de sessió SSO, Aprovisionament automàtic SSO i Exigir autenticació de dos factors (2FA).",
  'help.ctx.admin-settings.bullet.2':
    "Inici de sessió únic (OIDC) amb emissor, client i nom visible; Inici de sessió amb clau d'accés amb ID de la part confiable i orígens.",
  'help.ctx.admin-settings.bullet.3':
    "Claus API: Google Maps, Unsplash i Amap, cadascuna amb Provar; Per a què s'utilitza la clau limita la clau de Google a les funcions que vols pagar.",
  'help.ctx.admin-settings.bullet.4':
    'Proveïdor de la cerca de llocs i Proveïdor de transport públic trien qui respon cerques i rutes; Tipus de fitxer permesos limita les pujades.',
  'help.ctx.admin-addons.title': 'Complements',
  'help.ctx.admin-addons.summary':
    'Els mòduls de funcions de TREK, cadascun amb un interruptor: Llistes, Pressupost, Documents, Vacay, Atlas, Col·laboració, Travessia, Col·leccions, Viatge per carretera, MCP, AirTrail, Dawarich i l’anàlisi amb IA. Desactivat vol dir que l’entrada de navegació, les rutes i l’API desapareixen per a tothom.',
  'help.ctx.admin-addons.bullet.1':
    'Un mosaic per complement amb el seu interruptor i, quan en té, subfiles per a les seves opcions.',
  'help.ctx.admin-addons.bullet.2':
    'Els proveïdors de fotos i de documents també apareixen aquí com a mosaics, per oferir Immich o Synology als usuaris.',
  'help.ctx.admin-addons.bullet.3': "Seguiment d'equipatge té el seu propi interruptor sota els mosaics.",
  'help.ctx.admin-plugins.title': 'Connectors',
  'help.ctx.admin-plugins.summary':
    'Connectors de tercers que corren en un procés propi al costat de TREK, cadascun amb els permisos que va demanar en instal·lar-se. Instal·la des del catàleg, puja un paquet o enllaça una carpeta mentre en desenvolupes un.',
  'help.ctx.admin-plugins.bullet.1':
    'La llista: cada connector instal·lat amb versió, estat, signatura i els permisos que té; activa, desactiva, actualitza o desinstal·la per fila.',
  'help.ctx.admin-plugins.bullet.2':
    'Puja el connector accepta un fitxer de paquet; Torna a escanejar detecta una carpeta de connector enllaçada per al desenvolupament.',
  'help.ctx.admin-plugins.bullet.3':
    'Amfitrions permesos per connector: les adreces que un connector pot cridar, ja que la sortida es denega per defecte.',
  'help.ctx.admin-storage.title': 'Emmagatzematge',
  'help.ctx.admin-storage.summary':
    'On viuen les pujades: el disc local, un bucket S3 o un mirall que escriu a tots dos. Cada categoria de pujada pot anar a un backend diferent, i Estat diu si cada backend respon.',
  'help.ctx.admin-storage.bullet.1':
    'Backends: nom i tipus de cadascun, amb Provar, Editar i Suprimir; un de definit per l’entorn és només de lectura aquí.',
  'help.ctx.admin-storage.bullet.2':
    'Categories: portades, documents, fotos de la travessia i la resta, cadascuna assignada a un backend; canviar-ne una ofereix moure els fitxers existents.',
  'help.ctx.admin-storage.bullet.3':
    'Estat: una comprovació per backend, i el fitxer llavor que demostra que la configuració és la que veu el servidor.',
  'help.ctx.admin-notifications.title': 'Notificacions',
  'help.ctx.admin-notifications.summary':
    'Els canals que la instància ofereix als seus usuaris, i els que t’arriben a tu com a admin. Els usuaris trien els seus propis temes i URL a Configuració; tu decideixes què existeix i configures el correu.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Correu (SMTP), Ntfy, Webhook i Web Push: un panell cadascun, amb un interruptor que ofereix el canal als usuaris i la configuració del costat del servidor que necessita.',
  'help.ctx.admin-notifications.bullet.2':
    'Recordatoris de viatge: si el servidor envia el recordatori abans que comenci un viatge.',
  'help.ctx.admin-notifications.bullet.3':
    "Ntfy d'administrador i Webhook d'administrador: on van els esdeveniments d’admin com una còpia fallida o una versió nova, amb Provar.",
  'help.ctx.admin-mcp-tokens.title': 'Accés MCP',
  'help.ctx.admin-mcp-tokens.summary':
    'Cada token i sessió OAuth que els clients d’IA tenen contra aquest TREK, de tots els usuaris, amb el poder de revocar-ne qualsevol.',
  'help.ctx.admin-mcp-tokens.bullet.1': "Tokens d'API: qui el va crear, quan es va usar per última vegada, i Eliminar.",
  'help.ctx.admin-mcp-tokens.bullet.2': 'Sessions OAuth: el client, l’usuari i els àmbits concedits, i Revocar.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Què hi ha de nou a TREK: l’historial de versions de GitHub, la versió que executes, i si n’ha sortit una de més nova. L’actualització en si passa fora de l’app, a l’amfitrió.',
  'help.ctx.admin-github.bullet.1':
    'Historial de versions llista les versions amb les seves notes; la més nova porta Última, i la teva està marcada.',
  'help.ctx.admin-github.bullet.2':
    'Actualització disponible apareix a la capçalera quan existeix una versió més nova, amb com actualitzar a Docker i a altres instal·lacions.',
  'help.ctx.admin-backup.title': 'Còpia de seguretat',
  'help.ctx.admin-backup.summary':
    'Còpies completes de la base de dades i les pujades, fetes a mà o programades, guardades al servidor i descarregables com un sol fitxer. Restaura en torna a posar una.',
  'help.ctx.admin-backup.bullet.1':
    'Còpia de seguretat de les dades: Crea una còpia, i la llista de les existents amb Baixa, Restaura i eliminar.',
  'help.ctx.admin-backup.bullet.2':
    'Puja una còpia de seguretat porta un fitxer fet en una altra instància o en un dia anterior.',
  'help.ctx.admin-backup.bullet.3': 'Còpia automàtica: activada o no, interval, hora i dia, i quantes conservar.',
  'help.ctx.admin-audit.title': 'Auditoria',
  'help.ctx.admin-audit.summary':
    'El registre d’esdeveniments administratius i rellevants per a la seguretat: inicis de sessió i errors, canvis d’MFA, canvis d’usuaris i de configuració, còpies i restauracions. Només lectura, el més nou primer.',
  'help.ctx.admin-audit.bullet.1': 'Una fila per esdeveniment amb hora, usuari, acció, recurs, IP i detalls.',
  'help.ctx.admin-audit.bullet.2': 'Actualitzar recarrega; Carregar més va més enrere.',
  // create-user
  'help.guide.create-user.title': 'Crear un usuari',
  'help.guide.create-user.goal': 'Afegeix un compte a mà, sense invitació.',
  'help.guide.create-user.step.1': 'Fes clic a Crea usuari a la part superior de la pestanya Usuaris.',
  'help.guide.create-user.step.2':
    'Introdueix Usuari, Correu i una Contrasenya, i tria el Rol: Usuari o Administrador.',
  'help.guide.create-user.step.3': 'Fes clic a Crea usuari.',
  'help.guide.create-user.result':
    'El compte apareix a la taula i pot iniciar sessió de seguida; entrega la contrasenya per un canal en què confiïs.',
  'help.guide.create-user.tip.1':
    'Per a algú que hagi de triar la seva pròpia contrasenya, un enllaç d’invitació és la millor manera d’entrar.',
  'help.guide.create-user.tip.2':
    'Els admins veuen aquesta pàgina i el registre d’auditoria; tota la resta és igual per als dos rols.',
  // edit-user
  'help.guide.edit-user.title': 'Canviar el rol o la contrasenya d’un usuari',
  'help.guide.edit-user.goal': 'Ascendeix algú, degrada’l o torna’l a fer entrar després d’una contrasenya perduda.',
  'help.guide.edit-user.step.1':
    'Fes clic al llapis de la fila de l’usuari. Editar usuari s’obre amb les dades del compte.',
  'help.guide.edit-user.step.2':
    "Canvia el Rol, posa una Contrasenya nova, o fes clic a Restablir claus d'accés quan la persona hagi perdut el dispositiu on tenia les claus d’accés, i després Desar.",
  'help.guide.edit-user.result':
    'El canvi s’aplica a la petició següent; una contrasenya nova funciona des del següent inici de sessió.',
  'help.guide.edit-user.tip.1': 'No et pots treure el rol d’admin mentre siguis l’últim admin.',
  'help.guide.edit-user.tip.2':
    'Restablir les claus d’accés conserva la contrasenya; la persona afegeix claus d’accés noves a Configuració, Compte.',
  // invite-links
  'help.guide.invite-links.title': 'Convidar algú amb un enllaç',
  'help.guide.invite-links.goal':
    'Deixa que una persona es registri en una instància tancada i, si vols, aterri en un viatge.',
  'help.guide.invite-links.step.1': "A Enllaços d'invitació, fes clic a Crea enllaç.",
  'help.guide.invite-links.step.2':
    'Posa Usos màx. i Expira després de, opcionalment Afegeix al viatge (opcional), i fes clic a Crea i copia.',
  'help.guide.invite-links.step.3':
    'Envia l’enllaç. Cada fila mostra quantes vegades s’ha usat i qui el va crear; Copia enllaç el torna a copiar, i els enllaços esgotats o expirats estan marcats.',
  'help.guide.invite-links.result':
    'Qui obre l’enllaç es registra amb la seva pròpia contrasenya i, si hi ha un viatge triat, s’hi uneix de seguida.',
  'help.guide.invite-links.tip.1':
    'Els enllaços d’invitació funcionen encara que Registre amb contrasenya estigui desactivat a Configuració.',
  'help.guide.invite-links.tip.2':
    'Un enllaç d’un sol ús i caducitat curta és el valor més segur per a una sola persona.',
  // delete-user
  'help.guide.delete-user.title': 'Eliminar un usuari',
  'help.guide.delete-user.goal': 'Treu un compte i tot el que només li pertany a ell.',
  'help.guide.delete-user.step.1': 'Fes clic a la icona de paperera de la fila de l’usuari i confirma Eliminar usuari.',
  'help.guide.delete-user.result':
    'El compte, els seus propis viatges i les seves travessies desapareixen; els viatges compartits amb altres es queden amb els membres restants.',
  'help.guide.delete-user.tip.1': 'No es pot desfer. Fes abans una còpia de seguretat si no n’estàs segur.',
  'help.guide.delete-user.tip.2': 'L’últim admin no es pot eliminar; fes abans admin algú altre.',
  // permissions
  'help.guide.permissions.title': 'Decidir qui pot fer què',
  'help.guide.permissions.goal': 'Defineix, per acció, quin rol la pot fer en aquest TREK.',
  'help.guide.permissions.step.1':
    "A Configuració de permisos, busca l’acció dins del seu grup, per exemple Elimina viatges dins de Gestió de viatges, i tria el nivell: Tothom, Membres del viatge, Propietari del viatge o Només l'administrador. Una fila canviada queda marcada com a personalitzat.",
  'help.guide.permissions.step.2':
    'Fes clic a Desar. Restableix els valors per defecte torna cada fila al nivell integrat.',
  'help.guide.permissions.result':
    'La regla s’aplica a tots els viatges alhora; els botons i menús de qui és per sota del nivell desapareixen.',
  'help.guide.permissions.tip.1':
    'Propietari del viatge és la persona que ha creat el viatge; els admins sempre poden fer-ho tot.',
  'help.guide.permissions.tip.2':
    'Abaixa un nivell en lloc d’eliminar un membre: un membre que no pot editar encara pot llegir i comentar.',
  // default-map
  'help.guide.default-map.title': 'Definir el mapa per defecte per als usuaris nous',
  'help.guide.default-map.goal': 'Dona a cada compte nou un mapa que funcioni sense token personal.',
  'help.guide.default-map.step.1':
    "A Mapa, tria el Motor de mapes i, per a Mapbox o MapLibre, l’Estil de mapa, el Token de Mapbox compartit i el Mode d'alta qualitat; per a un mapa ràster, la Plantilla del mapa i la Clau CARTO compartida.",
  'help.guide.default-map.step.2':
    'Al costat de qualsevol camp que hagis canviat, Restaurar torna la tria pròpia de TREK. Configuració per defecte dels usuaris a l’esquerra fa el mateix per a Mode de color, les unitats i la divisa.',
  'help.guide.default-map.result':
    'Els comptes nous comencen amb això; qui hagi posat el seu propi mapa a Configuració conserva el seu.',
  'help.guide.default-map.tip.1':
    'Un token introduït aquí el comparteixen tots els que no en tenen un de propi, així que vigila la seva quota.',
  'help.guide.default-map.tip.2':
    'Els comptes existents que mai han tocat la pestanya del mapa també segueixen aquests valors.',
  // packing-templates
  'help.guide.packing-templates.title': 'Construir una plantilla d’equipatge',
  'help.guide.packing-templates.goal': 'Dona als viatges una llista d’equipatge de partida en lloc d’una de buida.',
  'help.guide.packing-templates.step.1': 'Fes clic a Nova plantilla, escriu un nom i confirma amb la marca.',
  'help.guide.packing-templates.step.2':
    'Obre la plantilla i fes clic a Afegeix una categoria; sota cada categoria, el + afegeix articles, i un article només necessita un nom.',
  'help.guide.packing-templates.step.3':
    'Tot es desa a mesura que avances. El llapis reanomena una plantilla, una categoria o un article, la paperera l’elimina.',
  'help.guide.packing-templates.result':
    'La plantilla s’ofereix a la llista d’equipatge de cada viatge; aplicar-la copia els articles, així que un viatge els pot canviar lliurement.',
  'help.guide.packing-templates.tip.1':
    'Una plantilla per tipus de viatge, platja, ciutat, senderisme, és millor que una llista gegant.',
  'help.guide.packing-templates.tip.2': 'Eliminar una plantilla no toca els viatges que ja l’han aplicada.',
  // categories
  'help.guide.categories.title': 'Gestionar el conjunt de categories',
  'help.guide.categories.goal':
    'Decideix quines categories poden portar els llocs i les col·leccions, i quin aspecte tenen.',
  'help.guide.categories.step.1':
    'Fes clic a Categoria nova, posa-li un nom, tria una icona i un color; la Vista prèvia mostra el resultat. Fes clic a Crea.',
  'help.guide.categories.step.2':
    'Passa el ratolí per una categoria de la llista per editar-la o eliminar-la. Eliminar demana confirmació.',
  'help.guide.categories.result':
    'El conjunt s’aplica a tot arreu alhora: l’inspector de llocs, els pins del mapa, Col·leccions i els filtres.',
  'help.guide.categories.tip.1':
    'Els llocs conserven l’id de categoria, així que reanomenar una categoria la reanomena a cada lloc.',
  'help.guide.categories.tip.2':
    'Una categoria eliminada deixa els seus llocs sense cap; reassigna’ls abans si això importa.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Mantenir les vacances escolars a mà',
  'help.guide.school-holiday-catalog.goal':
    'Cobreix un país o una regió que les fonts de vacances integrades no cobreixen.',
  'help.guide.school-holiday-catalog.step.1':
    'A Vacances escolars, fes clic a Afegeix un país, introdueix el País i el seu Codi del país (p. ex. US), i Desar; després Afegeix una regió per a cada part que sigui diferent.',
  'help.guide.school-holiday-catalog.step.2':
    'Fes clic en una regió per obrir Regió o districte escolar: Afegeix un període, dona a cadascun un Nom de les vacances, Data inicial i Data final, i Desar. La paperera treu un període, una regió o, quan ja no li queden regions, un país.',
  'help.guide.school-holiday-catalog.result':
    'Els usuaris troben el país i la regió a Configuració dins de Vacay i veuen els períodes a la seva graella anual.',
  'help.guide.school-holiday-catalog.tip.1':
    'Les regions de les fonts integrades no es poden editar aquí; afegeix al costat una regió manual si una data és errònia.',
  // auth-methods
  'help.guide.auth-methods.title': 'Decidir com inicia sessió la gent',
  'help.guide.auth-methods.goal': 'Obre o tanca l’inici de sessió amb contrasenya, l’SSO i el registre, i exigeix 2FA.',
  'help.guide.auth-methods.step.1':
    "A Mètodes d'autenticació, activa o desactiva Inici de sessió amb contrasenya i Registre amb contrasenya. Registre desactivat vol dir comptes nous només per enllaços d’invitació, SSO o a mà.",
  'help.guide.auth-methods.step.2':
    'Inici de sessió SSO i Aprovisionament automàtic SSO necessiten un Inici de sessió únic (OIDC) configurat més avall; l’aprovisionament automàtic crea un compte la primera vegada que algú entra per SSO.',
  'help.guide.auth-methods.step.3':
    "Exigir autenticació de dos factors (2FA) fa que cada inici de sessió amb contrasenya configuri un autenticador al següent accés. Inici de sessió amb clau d'accés necessita l’ID de la part confiable i els orígens pels quals s’arriba al teu TREK.",
  'help.guide.auth-methods.result':
    'La pàgina d’inici de sessió ofereix exactament els mètodes que has deixat activats.',
  'help.guide.auth-methods.tip.1':
    'Apareix un avís abans que et deixis fora: almenys una via d’entrada per als admins es manté activa.',
  'help.guide.auth-methods.tip.2': 'Els valors definits per variables d’entorn es mostren aquí com a només lectura.',
  // oidc
  'help.guide.oidc.title': 'Connectar l’inici de sessió únic',
  'help.guide.oidc.goal': 'Deixa que la gent iniciï sessió amb el teu proveïdor d’identitat.',
  'help.guide.oidc.step.1':
    "A Inici de sessió únic (OIDC), introdueix el Nom visible per al botó i l’URL de l'emissor, el Client ID i el Client Secret del teu proveïdor, i després Desar.",
  'help.guide.oidc.step.2': "Activa Inici de sessió SSO a Mètodes d'autenticació.",
  'help.guide.oidc.result':
    'La pàgina d’inici de sessió mostra el botó d’SSO; amb Aprovisionament automàtic SSO activat, qui entra per primera vegada rep un compte automàticament.',
  'help.guide.oidc.tip.1':
    'L’URI de redirecció que necessita el teu proveïdor és l’adreça del teu TREK més el camí de callback d’OIDC de la documentació.',
  'help.guide.oidc.tip.2':
    'El mapatge de claims decideix quins grups d’SSO es converteixen en admins; mira la pàgina d’OIDC a la documentació.',
  // instance-keys
  'help.guide.instance-keys.title': 'Introduir les claus API',
  'help.guide.instance-keys.goal':
    'Desbloqueja la cerca de llocs de Google, les portades d’Unsplash i Amap per a tota la instància.',
  'help.guide.instance-keys.step.1':
    'A Claus API, enganxa la Clau API de Google Maps i fes clic a Provar; el camp diu si la clau respon.',
  'help.guide.instance-keys.step.2':
    "A Per a què s'utilitza la clau, activa només les funcions que vols que es facturin a aquesta clau: autocompletat, detalls, fotos, enriquiment, el registre de cerques.",
  'help.guide.instance-keys.step.3':
    "Clau API d'Unsplash alimenta la cerca de portades; Clau API d'Amap (高德地图) la cerca de llocs a la Xina. Prova cadascuna de la mateixa manera.",
  'help.guide.instance-keys.result':
    'Els usuaris obtenen les funcions sense claus pròpies; sense clau de Google, TREK cerca a través de la pila lliure d’OpenStreetMap i la TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'La clau personal d’un usuari a Configuració guanya a la clau de la instància per a aquest usuari.',
  'help.guide.instance-keys.tip.2':
    'Les claus també poden venir de variables d’entorn; aquestes es mostren aquí com a només lectura.',
  // places-transit
  'help.guide.places-transit.title': 'Triar els proveïdors de cerca i transport',
  'help.guide.places-transit.goal': 'Decideix qui respon les cerques de llocs i les rutes de transport públic.',
  'help.guide.places-transit.step.1':
    'A Proveïdor de la cerca de llocs, tria Automàtic, Google Places, Amap (高德地图) o OpenStreetMap. Automàtic fa servir la millor clau que existeixi.',
  'help.guide.places-transit.step.2':
    'A Proveïdor de transport públic, tria Transitous (gratuït), mundial i sense clau, o Google, que necessita la clau de Google.',
  'help.guide.places-transit.result': 'Cada quadre de cerca i cada ruta de transport públic de TREK segueix la tria.',
  'help.guide.places-transit.tip.1': 'Un proveïdor sense la seva clau mostra un avís aquí i recorre a OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Les rutes de transport de Google es facturen per petició; Transitous no.',
  // file-types
  'help.guide.file-types.title': 'Limitar els tipus de fitxer',
  'help.guide.file-types.goal': 'Decideix quines extensions de fitxer poden tenir les pujades.',
  'help.guide.file-types.step.1':
    'A Tipus de fitxer permesos, edita la llista d’extensions separades per comes i desa.',
  'help.guide.file-types.result':
    'Les pujades de qualsevol altre tipus es rebutgen amb un missatge clar, als documents, al diari i a les portades.',
  'help.guide.file-types.tip.1':
    'Mantén els tipus d’imatge a la llista; les portades i les fotos de la travessia passen per la mateixa comprovació.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Activar o desactivar un complement',
  'help.guide.toggle-addon.goal': 'Ofereix un mòdul de funcions a tothom, o treu-lo.',
  'help.guide.toggle-addon.step.1':
    'Canvia l’interruptor del mosaic del complement. L’entrada de navegació apareix o desapareix per a tothom alhora.',
  'help.guide.toggle-addon.step.2':
    "Alguns mosaics porten subfiles per a les seves opcions, com Seguiment d'equipatge sota Llistes o els proveïdors de fotos sota Travessia; només es mostren mentre el complement està activat.",
  'help.guide.toggle-addon.result':
    'Les dades d’un complement desactivat es conserven; tornar-lo a activar les mostra de nou.',
  'help.guide.toggle-addon.tip.1': 'MCP desactivat treu l’endpoint i les seccions d’Integracions que en depenen.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas i Travessia són els complements que més demanen els usuaris; Documents necessita emmagatzematge per a les pujades.',
  // install-plugin
  'help.guide.install-plugin.title': 'Instal·lar un connector',
  'help.guide.install-plugin.goal': 'Afegeix un connector de tercers i dona-li exactament els permisos que demana.',
  'help.guide.install-plugin.step.1':
    'Obre Descobreix, tria un connector i fes clic a Instal·la; o fes clic a Puja el connector i tria un paquet .zip o .tar.gz.',
  'help.guide.install-plugin.step.2':
    'De tornada a Instal·lat, llegeix la fila: què pot llegir o escriure el connector, els amfitrions que crida i si està signat. Activa Activar el connector.',
  'help.guide.install-plugin.step.3':
    "El menú de la fila ofereix Reinicia, Mostra el registre d'errors, Amfitrions permesos i Canvia la versió…; Eliminar el desinstal·la. S’ofereix una actualització a la fila quan existeix una versió més nova, i una que demana drets nous es queda desactivada fins que els aprovis.",
  'help.guide.install-plugin.result':
    'El connector corre en un procés propi; el que afegeix, ginys, capes de mapa, eines, apareix on el connector ho declara.',
  'help.guide.install-plugin.tip.1':
    'Torna a escanejar detecta una carpeta de connector enllaçada per al desenvolupament sense paquet.',
  'help.guide.install-plugin.tip.2':
    'Un connector sense signar es marca com a tal; instal·la’l només quan confiïs en la seva font.',
  // storage-backends
  'help.guide.storage-backends.title': 'Moure les pujades a S3 o a un mirall',
  'help.guide.storage-backends.goal': 'Mantén els fitxers en emmagatzematge d’objectes, o en disc i bucket alhora.',
  'help.guide.storage-backends.step.1':
    'A Backends, fes clic a Afegir backend, posa-li un Nom, tria el Tipus, Local, S3 o Mirall, omple els camps i Aplicar. Provar comprova la connexió, Desar els canvis l’escriu.',
  'help.guide.storage-backends.step.2':
    'A Categories, assigna cada categoria de pujada a un backend. Canviar-ne una pregunta si Mou els objectes existents o Només enruta les escriptures noves.',
  'help.guide.storage-backends.step.3':
    'Estat a dalt comprova cada backend; una entrada vermella anomena què ha fallat.',
  'help.guide.storage-backends.result':
    'Les pujades noves van al backend assignat; els fitxers moguts se serveixen des d’allà.',
  'help.guide.storage-backends.tip.1':
    'Un backend configurat per variables d’entorn es mostra però no es pot editar aquí.',
  'help.guide.storage-backends.tip.2':
    'Un mirall escriu a tots dos destins i llegeix del primer; fes-lo servir per migrar sense temps d’inactivitat.',
  // channels-instance
  'help.guide.channels-instance.title': 'Configurar els canals de notificació',
  'help.guide.channels-instance.goal': 'Decideix quins canals poden triar els usuaris, i configura el correu.',
  'help.guide.channels-instance.step.1':
    'A Correu (SMTP), introdueix SMTP Host, SMTP Port, SMTP User, SMTP Password i la From Address; Enviar correu de prova t’envia un correu a tu.',
  'help.guide.channels-instance.step.2':
    'Activa Web Push, Ntfy i Webhook per oferir-los; els usuaris activen llavors el push per a cada dispositiu, o introdueixen el seu propi tema o URL, a Configuració, Notificacions.',
  'help.guide.channels-instance.step.3':
    'Recordatoris de viatge controla el recordatori abans que comenci un viatge; In-App sempre està activat i aquí només s’explica.',
  'help.guide.channels-instance.result': 'La pestanya Notificacions de cada usuari mostra els canals que has activat.',
  'help.guide.channels-instance.tip.1':
    'Un servidor ntfy per defecte introduït aquí apareix preomplert per als usuaris; tot i així poden indicar el seu.',
  'help.guide.channels-instance.tip.2':
    'Els canals de connectors apareixen sols quan hi ha actiu un connector amb aquesta capacitat.',
  // admin-channels
  'help.guide.admin-channels.title': 'Rebre els esdeveniments d’admin al mòbil',
  'help.guide.admin-channels.goal':
    'Assabenta’t de còpies fallides, versions noves i altres esdeveniments de la instància.',
  'help.guide.admin-channels.step.1':
    "A Ntfy d'administrador, introdueix un tema i, si cal, servidor i token; a Webhook d'administrador, un URL.",
  'help.guide.admin-channels.step.2':
    'Fes clic a Enviar Ntfy de prova o Enviar webhook de prova per veure arribar un missatge.',
  'help.guide.admin-channels.result': 'Els esdeveniments d’admin hi van a més de la campana de l’app de cada admin.',
  'help.guide.admin-channels.tip.1':
    'Mantén el tema d’admin separat del personal, perquè una caiguda no s’ofegui en la xerrameca dels viatges.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Revocar l’accés de la IA',
  'help.guide.mcp-tokens-admin.goal': 'Mira i talla cada token i sessió que té un client d’IA, de qualsevol usuari.',
  'help.guide.mcp-tokens-admin.step.1':
    "A Tokens d'API, troba el token per usuari i nom; la paperera l’elimina i el client s’atura de seguida.",
  'help.guide.mcp-tokens-admin.step.2':
    'A Sessions OAuth, el mateix per als clients basats en navegador: client, usuari i data, i la paperera revoca la sessió.',
  'help.guide.mcp-tokens-admin.result': 'El client ha de ser connectat de nou pel seu usuari; res més no canvia.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Els àmbits et diuen què podia fer un client; deixar un àmbit de només lectura és inofensiu.',
  'help.guide.mcp-tokens-admin.tip.2': 'Desactivar el complement MCP ho revoca tot d’una vegada.',
  // release-history
  'help.guide.release-history.title': 'Comprovar si hi ha una versió nova',
  'help.guide.release-history.goal': 'Sàpigues si el teu TREK està al dia i què porta la següent versió.',
  'help.guide.release-history.step.1':
    'Quan existeix una versió més nova, Actualització disponible apareix a la part superior de la pàgina d’admin; Veure a GitHub l’obre, i Com actualitzar explica l’actualització per a Docker i per a altres instal·lacions.',
  'help.guide.release-history.step.2':
    'Historial de versions llista cada versió amb les seves notes; Mostrar els detalls les desplega, la més nova porta Última, i Carregar més va més enrere.',
  'help.guide.release-history.result':
    'L’actualització passa a l’amfitrió, baixant la imatge nova o construint l’etiqueta nova; el directori de dades es queda.',
  'help.guide.release-history.tip.1':
    'Fes una còpia de seguretat abans d’actualitzar; la pestanya Còpia de seguretat és al costat.',
  'help.guide.release-history.tip.2':
    'Les versions preliminars es mostren però no s’anuncien com a actualitzacions, tret que n’executis una.',
  // create-backup
  'help.guide.create-backup.title': 'Fer i restaurar una còpia de seguretat',
  'help.guide.create-backup.goal':
    'Fes una instantània de tota la instància, guarda’n una còpia en un altre lloc, i sigues capaç de tornar-la a posar.',
  'help.guide.create-backup.step.1':
    'A Còpia de seguretat de les dades, fes clic a Crea una còpia. Empaqueta la base de dades i les pujades en un sol fitxer al servidor.',
  'help.guide.create-backup.step.2':
    'Baixa guarda una còpia fora de la màquina; la paperera elimina les antigues per alliberar espai.',
  'help.guide.create-backup.step.3':
    'Restaura sobre una còpia, o Puja una còpia de seguretat amb un fitxer, substitueix les dades actuals després que Vols restaurar la còpia? pregunti una vegada.',
  'help.guide.create-backup.result':
    'Una restauració torna usuaris, viatges, fitxers i configuració a l’estat d’aquella còpia; tothom queda desconnectat.',
  'help.guide.create-backup.tip.1': 'Restaurar és l’única acció d’aquí que no es pot desfer. Fes abans una còpia nova.',
  'help.guide.create-backup.tip.2':
    'Les còpies viuen al directori de dades; una còpia en una altra màquina és el que les converteix en còpia de seguretat.',
  // auto-backup
  'help.guide.auto-backup.title': 'Programar còpies de seguretat',
  'help.guide.auto-backup.goal': 'Deixa que el servidor es faci còpies sol i conservi només les últimes.',
  'help.guide.auto-backup.step.1':
    'A Còpia automàtica, activa Activa la còpia automàtica i tria l’Interval, Executa a les i, per a setmanal o mensual, el Dia de la setmana o el Dia del mes.',
  'help.guide.auto-backup.step.2':
    'Elimina les còpies antigues després de fixa quant de temps es conserva una còpia; les més antigues se’n van quan se’n fa una de nova.',
  'help.guide.auto-backup.result':
    'Les còpies apareixen a la llista segons la programació; una fallada arriba als canals d’admin.',
  'help.guide.auto-backup.tip.1':
    'Les hores segueixen la zona horària del servidor, que es mostra a la pestanya Auditoria.',
  'help.guide.auto-backup.tip.2':
    'L’emmagatzematge del servidor és finit; conservar-ne de tres a cinc sol ser suficient.',
  // audit-log
  'help.guide.audit-log.title': 'Llegir el registre d’auditoria',
  'help.guide.audit-log.goal': 'Esbrina qui va fer què, i quan.',
  'help.guide.audit-log.step.1':
    'Llegeix les files: hora, usuari, acció, recurs, IP i detalls, el més nou primer. Les accions s’anomenen pel que va passar, com un error d’inici de sessió, un canvi d’MFA o una restauració.',
  'help.guide.audit-log.step.2': 'Actualitzar recarrega la part de dalt; Carregar més va més enrere.',
  'help.guide.audit-log.result': 'Un rastre que pots entregar a qui pregunti per què ha canviat alguna cosa.',
  'help.guide.audit-log.tip.1': 'Les hores es mostren en la zona horària del servidor, indicada a sobre de la taula.',
  'help.guide.audit-log.tip.2': 'El registre és només d’afegir; res d’aquí no es pot editar ni eliminar des de l’app.',
  // document-providers
  'help.guide.document-providers.title': 'Oferir un magatzem de documents',
  'help.guide.document-providers.goal':
    'Decideix amb quins magatzems un viatge pot mantenir els seus documents al dia.',
  'help.guide.document-providers.step.1':
    'El mosaic Documents porta els magatzems com a files al seu prestatge: Paperless-ngx, Papra, Nextcloud, OpenCloud i Synology Drive. Els cinc comencen desactivats, i el prestatge només hi és mentre Documents mateix està activat.',
  'help.guide.document-providers.step.2':
    'Gira l’interruptor de la fila Nextcloud. El missatge diu Complement actualitzat, i a partir d’ara els propietaris de viatge troben Sincronització de documents a la pestanya Fitxers dels seus viatges, amb Nextcloud sota Connecta un proveïdor.',
  'help.guide.document-providers.result':
    'El magatzem s’ofereix a cada viatge d’aquest TREK; no hi ha res connectat fins que un propietari de viatge ho fa.',
  'help.guide.document-providers.tip.1':
    'Aquí només es decideix si un magatzem es pot oferir. L’adreça i les credencials pertanyen a un viatge i les introdueix el propietari del viatge a la seva pestanya Fitxers, mai al panell d’administració.',
  'help.guide.document-providers.tip.2':
    'Desactivar Documents desactiva tots els magatzems amb ell, i un magatzem no es pot activar mentre Documents està desactivat: el servidor respon Enable the Documents addon first. Un magatzem a la teva pròpia xarxa també necessita ALLOW_INTERNAL_NETWORK=true al servidor.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Viatge',
  'help.ctx.trip.summary':
    'Un viatge, tot sencer: el pla amb els seus dies, mapa i llocs, i les pestanyes de transports, reserves, llistes, despeses, fitxers i col·laboració. Cadascuna és una pantalla d’ajuda pròpia sota aquesta.',
  'help.ctx.trip.bullet.1':
    'La barra de pestanyes: Planificació, Transports, Reserves, Llistes, Despeses, Fitxers i Col·laboració. Els addons i els plugins decideixen quines pestanyes hi ha al teu TREK.',
  'help.ctx.trip.bullet.2':
    'Planificació són tres columnes: els dies a l’esquerra, el mapa al mig, els llocs a la dreta. Les reserves i els transports viuen dins del pla, a la parada i entre parades; les pestanyes els llisten.',
  'help.ctx.trip.bullet.3':
    'Comparteix, a dalt a la dreta, obre la gent del viatge: membres, convidats, l’enllaç d’invitació i l’enllaç públic de només lectura.',
  'help.ctx.trip.bullet.4':
    'El títol, les dates, la portada i la moneda s’editen des d’Els meus viatges, amb el llapis de la targeta del viatge.',
  'help.ctx.trip.bullet.5':
    'Els chevrons de la vora interior d’una columna la pleguen i el mapa ocupa l’espai; el separador prim al costat d’una columna en canvia l’amplada.',
  'help.ctx.trip.bullet.6': 'La fletxa de desfer a la barra d’eines dels dies retira l’últim canvi al pla.',
  // add-member
  'help.guide.add-member.title': 'Afegir un membre',
  'help.guide.add-member.goal': 'Dona accés a aquest viatge a algú amb compte de TREK.',
  'help.guide.add-member.step.1': 'Fes clic a Comparteix, a dalt a la dreta.',
  'help.guide.add-member.step.2': 'A Convida un usuari, tria la persona de la llista i fes clic a Convida.',
  'help.guide.add-member.step.3':
    'La persona ara apareix a Accés. La corona marca el propietari; la icona al final d’una fila torna a treure l’accés.',
  'help.guide.add-member.result':
    'El membre veu i edita el viatge com tu, dins dels nivells que l’admin ha fixat a Configuració de permisos.',
  'help.guide.add-member.tip.1':
    'Qui falti a la llista encara no té compte de TREK: afegeix-lo com a convidat, o deixa que es registri amb un enllaç d’invitació.',
  'help.guide.add-member.tip.2':
    'El nombre al costat d’Accés compta la gent del viatge; els convidats es llisten a part, a sota.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Convidar per enllaç',
  'help.guide.trip-invite-link.goal': 'Deixa que la gent s’uneixi al viatge pel seu compte.',
  'help.guide.trip-invite-link.step.1':
    'Fes clic a Comparteix i després, a Enllaç d’invitació al viatge, fes clic a Crear enllaç d’invitació.',
  'help.guide.trip-invite-link.step.2':
    'Fes clic a Copiar i envia l’enllaç. Qualsevol amb compte de TREK que l’obri s’hi uneix com a membre.',
  'help.guide.trip-invite-link.step.3':
    'Tornar a generar substitueix l’enllaç i deixa l’antic inservible; Desactivar l’apaga.',
  'help.guide.trip-invite-link.result': 'Qui obri l’enllaç és al viatge i apareix a Accés.',
  'help.guide.trip-invite-link.tip.1':
    'Algú sense compte no el pot fer servir. Un admin reparteix enllaços de registre a Administració, Usuaris, i en pot lligar un a aquest viatge.',
  'help.guide.trip-invite-link.tip.2':
    'Torna a generar-lo quan un enllaç hagi anat al xat equivocat: l’antic deixa de funcionar a l’instant.',
  // add-guest
  'help.guide.add-guest.title': 'Afegir un convidat sense compte',
  'help.guide.add-guest.goal': 'Compta amb algú que no fa servir TREK.',
  'help.guide.add-guest.step.1': 'Fes clic a Comparteix i baixa fins a Convidats.',
  'help.guide.add-guest.step.2': 'Escriu el nom a Nom del convidat i fes clic a Afegir convidat.',
  'help.guide.add-guest.result':
    'El convidat es pot assignar a despeses, articles d’equipatge i tasques, però no pot iniciar sessió.',
  'help.guide.add-guest.tip.1':
    'El llapis reanomena un convidat; la icona al final de la fila el treu juntament amb les seves parts i assignacions.',
  'help.guide.add-guest.tip.2':
    'Si la persona obté un compte més endavant, convida-la com a membre i treu el convidat.',
  // public-link
  'help.guide.public-link.title': 'Publicar un enllaç de només lectura',
  'help.guide.public-link.goal': 'Mostra el viatge a gent que no l’ha d’editar.',
  'help.guide.public-link.step.1':
    'Fes clic a Comparteix; a la dreta, a Enllaç públic, marca el que l’enllaç pot mostrar. Mapa i pla sempre està actiu; Reserves, Equipatge, Pressupost i Xat els tries tu.',
  'help.guide.public-link.step.2': 'Fes clic a Crea l’enllaç i després a Copiar.',
  'help.guide.public-link.step.3': 'Les marques es poden canviar mentre l’enllaç existeixi; Elimina l’enllaç l’atura.',
  'help.guide.public-link.result':
    'Qualsevol amb l’enllaç veu les parts triades sense iniciar sessió i no pot canviar res.',
  'help.guide.public-link.tip.1':
    'L’enllaç no apareix llistat enlloc; qui el tingui el pot obrir, així que tracta’l com una contrasenya.',
  'help.guide.public-link.tip.2': 'Per a drets d’edició, afegeix la persona com a membre en lloc d’això.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Cedir el viatge o abandonar-lo',
  'help.guide.transfer-ownership.goal': 'Fes propietari algú altre, o surt d’un viatge que no és teu.',
  'help.guide.transfer-ownership.step.1':
    'Fes clic a Comparteix. A Accés, la corona a la fila d’un membre fa propietària aquella persona; confirma la pregunta.',
  'help.guide.transfer-ownership.step.2':
    'Abandona el viatge a la teva pròpia fila et treu del viatge; com a propietari, cedeix-lo primer.',
  'help.guide.transfer-ownership.result':
    'El nou propietari gestiona els membres i pot eliminar el viatge; tu et quedes com a membre normal.',
  'help.guide.transfer-ownership.tip.1':
    'El propietari és qui va crear el viatge fins que el cedeix; eliminar el viatge és cosa seva i de ningú més.',
  'help.guide.transfer-ownership.tip.2':
    'Treure l’accés en una altra fila és el mateix botó a l’inrevés: el propietari treu un membre.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Fer lloc per al mapa',
  'help.guide.collapse-columns.goal': 'Plega una columna o dona-li més amplada.',
  'help.guide.collapse-columns.step.1':
    'Fes clic al chevron de la vora interior de la columna dels dies per plegar-la; el mapa ocupa l’espai. La columna dels llocs té el mateix chevron.',
  'help.guide.collapse-columns.step.2': 'Torna a fer clic al chevron per recuperar la columna.',
  'help.guide.collapse-columns.step.3':
    'Arrossega el separador prim entre una columna i el mapa per canviar l’amplada de la columna.',
  'help.guide.collapse-columns.result': 'Les amplades es recorden; les columnes tornen obertes a la propera visita.',
  'help.guide.collapse-columns.tip.1': 'Les dues columnes es poden plegar alhora per a una vista només de mapa.',
  'help.guide.collapse-columns.tip.2':
    'En un telèfon no hi ha columnes: Planificació i Llocs són els dos botons a la part de baix del mapa.',
  // undo-change
  'help.guide.undo-change.title': 'Desfer l’últim canvi',
  'help.guide.undo-change.goal': 'Retira el que acabes de fer al pla.',
  'help.guide.undo-change.step.1':
    'Fes clic a la fletxa de desfer de la barra d’eines sobre els dies; el seu rètol anomena el canvi que retirarà.',
  'help.guide.undo-change.result': 'El pla torna a ser com era, i la fletxa es posa grisa fins al proper canvi.',
  'help.guide.undo-change.tip.1':
    'Desfer cobreix el pla: assignar, treure, reordenar i moure llocs, optimitzar una ruta, eliminar llocs, canvis de categoria i importacions.',
  'help.guide.undo-change.tip.2':
    'Només té un pas de profunditat: només es pot retirar l’últim canvi, i un canvi nou el substitueix.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Llocs',
  'help.ctx.trip-places.summary':
    'La columna dreta del pla: tots els llocs del viatge, planificats o no, amb cerca i filtres, i les maneres de fer entrar llocs, a mà, des d’un fitxer o des d’una llista compartida.',
  'help.ctx.trip-places.bullet.1':
    'Afegeix un lloc / activitat, a dalt, obre el formulari d’un lloc que escrius o cerques. Mentre hi ha un dia obert el botó diu Lloc nou, i Al dia, al costat, crea el lloc directament en aquell dia.',
  'help.ctx.trip-places.bullet.2':
    'Importa un fitxer accepta fitxers .gpx, .kml i .kmz; Importa una llista accepta una llista compartida de Google Maps o de Naver Maps. Un fitxer també es pot deixar caure simplement sobre la columna.',
  'help.ctx.trip-places.bullet.3':
    'El desplegable canvia entre Tot, Sense planificar, Planificats i, un cop s’ha importat una ruta, Rutes; a sota hi ha la cerca, el filtre de categoria i l’estrella per a una valoració mínima.',
  'help.ctx.trip-places.bullet.4':
    'Una fila mostra imatge, nom i descripció o adreça. Fes-hi clic per als detalls del lloc, arrossega-la a un dia, o fes clic dret per a Editar, + Dia, Obre el lloc web, Obre a Google Maps, Desar a la col·lecció i Eliminar.',
  'help.ctx.trip-places.bullet.5':
    'Amb un dia obert, un + al final d’una fila sense planificar posa el lloc en aquell dia, i Planificats llista només aquell dia, amb Mostra tot el viatge per tornar a eixamplar.',
  'help.ctx.trip-places.bullet.6':
    'La marca de selecció a l’extrem dret de la fila de filtres inicia una selecció: diverses files alhora reben una categoria nova, van a una col·lecció o s’eliminen.',
  // create-place
  'help.guide.create-place.title': 'Crear un lloc',
  'help.guide.create-place.goal': 'Afegeix un lloc o una activitat a mà, amb tot el que el pla n’ha de saber.',
  'help.guide.create-place.step.1':
    'Fes clic a Afegeix un lloc / activitat, a dalt de la columna de llocs (Lloc nou mentre hi ha un dia obert). S’obre el formulari.',
  'help.guide.create-place.step.2':
    'Escriu el lloc a Cerca llocs..., a dalt, i tria un resultat. Nom, Adreça, Latitud, Longitud i Lloc web s’omplen, i Detalls del lloc, a l’esquerra, mostra imatges, l’horari d’obertura i una descripció. En un TREK amb clau de Google, sota la llista hi ha No és el lloc correcte? Cerca a Google, que torna a fer la mateixa cerca amb Google.',
  'help.guide.create-place.step.3':
    'A Detalls del lloc, un clic en una imatge sota Tria una imatge la converteix en la imatge del lloc; Utilitza aquest text porta la descripció al formulari.',
  'help.guide.create-place.step.4':
    'Revisa els camps: Nom és obligatori; Descripció i Notes són teves; Adreça, Latitud i Longitud surten de la cerca o s’escriuen; Categoria tria una de les categories del viatge, i el + del costat en crea una de nova a l’instant; Lloc web recull l’enllaç.',
  'help.guide.create-place.step.5':
    'Fes clic a Afegir. Si ja hi ha un lloc amb el mateix nom al viatge, el formulari ho diu i el botó passa a ser Afegir igualment.',
  'help.guide.create-place.result':
    'El lloc és a la llista i al mapa, sota Sense planificar fins que no es posa en un dia.',
  'help.guide.create-place.tip.1':
    'Fitxers i Despeses, al final del formulari, adjunten un document al lloc, o obren l’editor de Despeses per a la seva despesa just després de desar.',
  'help.guide.create-place.tip.2':
    'L’índex de TREK i OpenStreetMap responen la cerca a qualsevol TREK, i Detalls del lloc s’omple amb Wikipedia, Wikivoyage i Wikimedia. Google només es consulta on tots dos queden buits, i només ell porta les valoracions.',
  'help.guide.create-place.tip.3':
    'Un lloc també pot començar al mapa: fes clic dret al punt, i el formulari s’obre amb les coordenades i l’adreça posades.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Afegir un lloc directament al dia obert',
  'help.guide.place-to-open-day.goal': 'Salta’t el segon pas: crea o tria el lloc i posa’l al dia de seguida.',
  'help.guide.place-to-open-day.step.1':
    'Fes clic a la capçalera d’un dia a la columna dels dies. El dia és obert: la seva targeta queda destacada, i la columna de llocs guanya el botó Al dia.',
  'help.guide.place-to-open-day.step.2':
    'Al dia obre el mateix formulari que Lloc nou, només que el lloc va a parar al dia obert en el moment que fas clic a Afegir.',
  'help.guide.place-to-open-day.step.3':
    'Un lloc que ja existeix va al dia obert amb el + al final de la seva fila, o amb clic dret, + Dia.',
  'help.guide.place-to-open-day.step.4':
    'A l’inrevés també funciona, i sense obrir abans cap dia: arrossega la fila del lloc fora de la columna i deixa-la anar sobre una targeta de dia. Si la deixes entre dues parades, hi va a parar exactament.',
  'help.guide.place-to-open-day.result':
    'El lloc queda llistat sota el dia, al final; arrossega’l amunt o avall fins on toca.',
  'help.guide.place-to-open-day.tip.1':
    'El dia obert també guia la cerca: amb un dia obert, el mapa i la cerca dels voltants parteixen d’on ja va aquell dia.',
  'help.guide.place-to-open-day.tip.2': 'Desfés, a la barra d’eines sobre els dies, retira l’assignació.',
  // filter-places
  'help.guide.filter-places.title': 'Trobar un lloc a la llista',
  'help.guide.filter-places.goal': 'Estreny la columna fins als llocs que busques.',
  'help.guide.filter-places.step.1':
    'El desplegable de dalt canvia entre Tot, Sense planificar (encara en cap dia), Planificats (en un dia) i Rutes (rutes GPX importades), cadascun amb el seu recompte.',
  'help.guide.filter-places.step.2': 'Escriu a Cerca llocs...; la llista s’estreny mentre escrius.',
  'help.guide.filter-places.step.3':
    'Totes les categories obre una llista per marcar una o més categories, Sense categoria inclosa; Esborra el filtre, al final, la reinicia.',
  'help.guide.filter-places.step.4':
    'L’estrella del costat fixa una valoració mínima: 5+, 4+ i així successivament mostren només els llocs que has valorat com a mínim tan amunt.',
  'help.guide.filter-places.result': 'El recompte sobre les files diu quants llocs encaixen; els filtres es combinen.',
  'help.guide.filter-places.tip.1':
    'Amb un dia obert, Planificats llista només aquell dia i ho diu: Es mostra només el dia obert, amb Mostra tot el viatge al costat.',
  'help.guide.filter-places.tip.2':
    'El mapa també s’estreny al dia obert; Tot a la llista continua mostrant tots els llocs del viatge.',
  // edit-place
  'help.guide.edit-place.title': 'Canviar un lloc',
  'help.guide.edit-place.goal': 'Corregeix un nom, mou la xinxeta, afegeix un lloc web o canvia la categoria.',
  'help.guide.edit-place.step.1':
    'Fes clic dret a la fila i tria Editar, o obre el lloc i fes clic a Editar als seus detalls.',
  'help.guide.edit-place.step.2':
    'Canvia el que et calgui: Nom, Descripció, Notes, Adreça, Latitud i Longitud, Categoria, Lloc web. Obert des d’un dia, el formulari també té Notes per a aquest dia i Inici i Fi per a aquell dia.',
  'help.guide.edit-place.step.3': 'Fes clic a Actualitzar.',
  'help.guide.edit-place.result':
    'El canvi s’aplica a tot arreu on apareix el lloc: la llista, el mapa i cada dia en què està.',
  'help.guide.edit-place.tip.1':
    'Notes per a aquest dia pertany al lloc en aquell únic dia; Notes pertany al lloc mateix.',
  'help.guide.edit-place.tip.2':
    'Un Fi anterior a l’Inici bloqueja Actualitzar; Solapament horari amb: només avisa que una altra parada del dia té la mateixa hora.',
  // delete-place
  'help.guide.delete-place.title': 'Eliminar un lloc',
  'help.guide.delete-place.goal': 'Treu un lloc del viatge per sempre.',
  'help.guide.delete-place.step.1':
    'Fes clic dret a la fila i tria Eliminar, o fes clic a Eliminar als detalls del lloc.',
  'help.guide.delete-place.step.2':
    'Confirma. Si al lloc hi havia una nit reservada, o hi ha una reserva lligada, la pregunta diu què se’n va amb ell.',
  'help.guide.delete-place.result':
    'El lloc desapareix de la llista, del mapa i de cada dia; Desfés, a la barra d’eines sobre els dies, el torna.',
  'help.guide.delete-place.tip.1':
    'Per treure un lloc només d’un dia, fes servir en lloc d’això Treure del dia en aquella parada.',
  'help.guide.delete-place.tip.2':
    'Diversos llocs alhora: la marca de selecció al costat dels filtres inicia una selecció.',
  // select-places
  'help.guide.select-places.title': 'Canviar o eliminar diversos llocs alhora',
  'help.guide.select-places.goal': 'Endreça la llista d’un sol cop en comptes de lloc per lloc.',
  'help.guide.select-places.step.1':
    'Fes clic a la marca de selecció a l’extrem dret de la fila de filtres. Les files reben caselles i apareix una barra amb les accions.',
  'help.guide.select-places.step.2':
    'Marca les files, o fes servir Seleccionar-ho tot a la barra; la barra compta el que està seleccionat.',
  'help.guide.select-places.step.3':
    'Canviar categoria posa una mateixa categoria a tots; Desar a la col·lecció els copia a una de les teves col·leccions; Elimina la selecció els treu després d’una confirmació.',
  'help.guide.select-places.step.4': 'Torna a fer clic a la marca de selecció per sortir de la selecció.',
  'help.guide.select-places.result':
    'El canvi s’aplica a cada lloc seleccionat; una eliminació es pot desfer des de la barra d’eines sobre els dies.',
  'help.guide.select-places.tip.1':
    'Els filtres continuen funcionant mentre selecciones: filtra primer per Sense planificar, i així Seleccionar-ho tot agafa exactament aquells.',
  'help.guide.select-places.tip.2':
    'Marca com a visitat a les teves llistes apareix a la barra quan l’addon Col·leccions està actiu: marca els llocs a les col·leccions on estan desats.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importar llocs des d’un fitxer GPX, KML o KMZ',
  'help.guide.import-places-file.goal':
    'Fes entrar el que han exportat Google My Maps, Google Earth o un registrador GPS.',
  'help.guide.import-places-file.step.1':
    'Fes clic a Importa un fitxer, o deixa caure el fitxer en qualsevol punt de la columna de llocs.',
  'help.guide.import-places-file.step.2':
    'Tria el fitxer o arrossega’l dins el quadre. Per a un GPX, marca què vols importar: Punts de ruta, Rutes, Tracks (amb geometria de ruta); per a KML i KMZ, Punts (Placemarks) i Rutes (LineStrings).',
  'help.guide.import-places-file.step.3':
    'El quadre accepta diversos fitxers alhora, i només .gpx, .kml i .kmz. Un altre tipus de fitxer, o un de més de 10 MB, es rebutja al diàleg i no s’importa.',
  'help.guide.import-places-file.step.4':
    'Fes clic a Importar. Un missatge diu quants llocs han entrat; amb un fitxer KML o KMZ el diàleg es queda obert amb un resum del que s’ha creat i del que s’ha omès.',
  'help.guide.import-places-file.result':
    'Els llocs són a la llista; una ruta porta una marca d’itinerari a la seva fila, es dibuixa al mapa i rep el seu propi filtre Rutes.',
  'help.guide.import-places-file.tip.1':
    'Un fitxer massa gran es rebutja indicant el límit de mida; torna a exportar-lo sense fotos, o parteix-lo.',
  'help.guide.import-places-file.tip.2': 'La importació es pot desfer sencera des de la barra d’eines sobre els dies.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importar una llista compartida de Google Maps o de Naver Maps',
  'help.guide.import-places-list.goal': 'Converteix l’enllaç d’una llista compartida en llocs.',
  'help.guide.import-places-list.step.1': 'Fes clic a Importa una llista i tria Llista de Google o Llista de Naver.',
  'help.guide.import-places-list.step.2':
    'Enganxa l’enllaç compartit de la llista. Un enllaç d’indicacions de Google Maps també serveix: les seves parades es converteixen en llocs, en l’ordre del trajecte.',
  'help.guide.import-places-list.step.3': 'Fes clic a Importar.',
  'help.guide.import-places-list.result':
    'Cada lloc de la llista és al viatge, amb el nom que té a la llista; els llocs que ja són al viatge s’ometen.',
  'help.guide.import-places-list.tip.1':
    'La llista ha d’estar compartida públicament; l’enllaç d’una llista privada no importa res.',
  'help.guide.import-places-list.tip.2':
    'Enriquir llocs mitjançant Google apareix al diàleg quan el teu TREK té una clau de Google: consulta cada lloc importat i completa fotos, adreça i detalls.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dies',
  'help.ctx.trip-days.summary':
    'La columna esquerra del pla: una targeta per dia amb les seves parades en ordre, les notes, les reserves i els transports del dia, i la ruta entre les parades. És aquí on el viatge es planifica de debò.',
  'help.ctx.trip-days.bullet.1':
    'La barra d’eines de dalt: Exporta (PDF, calendari, GPX), Expandeix tots els dies / Contreu tots els dies, la fletxa Desfés, Reordena els dies i Mostra totes les rutes de reserva.',
  'help.ctx.trip-days.bullet.2':
    'Una targeta de dia: número, temps, títol, data i el cost del dia a la capçalera; fes clic a la capçalera per obrir el dia, la fletxeta la plega. Transport públic, Afegeix transport i Afegeix una nota també són a la capçalera.',
  'help.ctx.trip-days.bullet.3':
    'Dins d’un dia: les parades en ordre, cadascuna amb imatge, nom, hora i un cadenat sobre la imatge; les notes; les reserves que pertanyen al dia; i entre les parades el temps de viatge de cada tram.',
  'help.ctx.trip-days.bullet.4':
    'Sota les parades, la barra de ruta: Ruta dibuixa el dia al mapa, Optimitza ordena les parades, En cotxe / A peu fixa el mitjà de transport del dia, Obre a Google Maps i Obre a CoMaps lliuren el dia.',
  'help.ctx.trip-days.bullet.5':
    'Els llocs arriben a un dia arrossegant una fila de la columna de llocs, amb el + d’aquella fila, amb Afegeix un lloc a aquest dia en un dia buit, o des dels detalls del lloc.',
  'help.ctx.trip-days.bullet.6':
    'Cost total, a baix, suma cada parada i cada reserva amb un preu, en la moneda del viatge.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Llegir un dia',
  'help.guide.read-day-plan.goal': 'Saber què et diu cada part d’una targeta de dia abans de canviar res.',
  'help.guide.read-day-plan.step.1':
    'La capçalera: el número del dia, la previsió per al dia, Dia 1 o el títol que li has posat, la data i el cost del dia. Fes clic a la capçalera per obrir el dia (els Detalls del dia s’obren sobre el mapa); la fletxeta de la dreta plega i desplega la targeta.',
  'help.guide.read-day-plan.step.2':
    'Una parada: la nansa de l’esquerra l’arrossega, la imatge porta un cadenat per a l’optimització de ruta, després el nom, la descripció i, si n’hi ha, les Notes per a aquest dia. Una etiqueta d’hora mostra Inici i Fi quan la parada els té; les fletxes que apareixen al seu extrem dret la pugen o la baixen.',
  'help.guide.read-day-plan.step.3':
    'Una reserva del dia: una reserva en una parada la marca com a Reserva confirmada o Reserva pendent, i un transport apareix com a Sortida o Arribada amb la seva hora i el seu trajecte, amb un petit interruptor que dibuixa aquesta ruta al mapa.',
  'help.guide.read-day-plan.step.4':
    'Entre dues parades, el connector diu quant dura el tram i quina distància fa, en el mitjà de transport del dia; fes-hi clic per canviar el mitjà d’aquell sol tram.',
  'help.guide.read-day-plan.step.5':
    'La barra de ruta del final: Ruta dibuixa el camí del dia al mapa, Optimitza reordena les parades, els botons de mode trien En cotxe o A peu, Obre a Google Maps i Obre a CoMaps obren el dia allà.',
  'help.guide.read-day-plan.result':
    'Cada símbol de la targeta té un significat; les guies de sota els canvien un per un.',
  'help.guide.read-day-plan.tip.1':
    'Fes clic dret en una parada per al seu menú: Editar, Treure del dia, Obre el lloc web, les aplicacions de navegació (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Desar a la col·lecció, Eliminar.',
  'help.guide.read-day-plan.tip.2':
    'Passa el ratolí per una parada i al seu extrem apareix Afegeix una reserva: una reserva creada allà queda lligada a aquesta parada en aquest dia.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Posar un lloc en un dia',
  'help.guide.place-onto-day.goal': 'Convertir un lloc de la llista en una parada del dia, allà on li toca en l’ordre.',
  'help.guide.place-onto-day.step.1':
    'Arrossega una fila de la columna de llocs fins a la targeta del dia. Deixa-la anar entre dues parades per posar-la exactament allà, o en qualsevol punt de la targeta per afegir-la al final.',
  'help.guide.place-onto-day.step.2':
    'Sense arrossegar: obre el dia fent clic a la capçalera, després fes clic al + del final de la fila del lloc, o fes clic dret a la fila i tria + Dia.',
  'help.guide.place-onto-day.step.3':
    'En un dia buit, Afegeix un lloc a aquest dia obre el formulari de lloc, i el lloc nou cau al dia de seguida.',
  'help.guide.place-onto-day.step.4':
    'Des dels detalls d’un lloc, Afegeix al dia pregunta quin dia; des de la capçalera del dia, Al dia a la columna de llocs crea un lloc nou al dia obert.',
  'help.guide.place-onto-day.result':
    'El lloc és una parada del dia, al mapa amb el número del dia, i la columna de llocs el compta sota Planificats.',
  'help.guide.place-onto-day.tip.1':
    'Un lloc pot ser en diversos dies: posa’l al segon dia des de la columna de llocs. Arrossegar una parada d’una targeta de dia a una altra la mou en comptes de copiar-la.',
  'help.guide.place-onto-day.tip.2': 'La fletxa Desfés de la barra d’eines desfà l’assignació.',
  'help.guide.place-onto-day.tip.3':
    'Una parada no es pot deixar anar entre dues entrades amb hores fixes, ni abans d’una reserva que ja té hora; el pla manté la seva cronologia.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Canviar l’ordre d’un dia',
  'help.guide.reorder-stops.goal': 'Pujar o baixar una parada, o portar-la a un altre dia.',
  'help.guide.reorder-stops.step.1': 'Arrossega la parada per la nansa fins a la nova posició dins la targeta.',
  'help.guide.reorder-stops.step.2':
    'O fes servir les fletxes de l’extrem dret de la parada: un pas amunt o avall per clic.',
  'help.guide.reorder-stops.step.3':
    'Arrossega la parada a una altra targeta de dia per moure-la allà; deixa el dia antic.',
  'help.guide.reorder-stops.step.4':
    'Una parada amb una hora fixa pregunta Vols eliminar l’hora? quan moure-la trencaria l’ordre del dia, perquè l’hora decidia el seu lloc: Confirmar treu l’hora i la deixa anar a qualsevol lloc.',
  'help.guide.reorder-stops.result': 'La ruta i els temps de viatge segueixen el nou ordre a l’instant.',
  'help.guide.reorder-stops.tip.1':
    'Les reserves amb hora fixa no es poden reordenar; es queden allà on la seva hora les posa.',
  'help.guide.reorder-stops.tip.2':
    'Optimitza, a la barra de ruta, ordena tot el dia pel camí més curt; bloqueja abans una parada perquè es quedi on és.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Donar una hora a una parada',
  'help.guide.set-stop-times.goal':
    'Fixar quan comença i quan acaba una parada, perquè el dia es llegeixi com un horari.',
  'help.guide.set-stop-times.step.1':
    'Fes clic dret a la parada i tria Editar. Obert des del dia, el formulari té Inici i Fi a baix.',
  'help.guide.set-stop-times.step.2':
    'Posa Inici i, si vols, Fi. Solapament horari amb: avisa que una altra parada del dia amb hora se solapa; un Fi anterior a l’Inici bloqueja Actualitzar.',
  'help.guide.set-stop-times.step.3':
    'Fes clic a Actualitzar. La parada rep una etiqueta d’hora i es mou allà on la seva hora la col·loca dins el dia.',
  'help.guide.set-stop-times.result':
    'Les parades amb hora mantenen el seu lloc en l’ordre; les parades sense hora s’ordenen al seu voltant.',
  'help.guide.set-stop-times.tip.1':
    'L’hora pertany a la parada d’aquell dia; el mateix lloc en un altre dia pot tenir una altra hora.',
  'help.guide.set-stop-times.tip.2':
    'Per moure a mà una parada amb hora, arrossega-la: la pregunta Vols eliminar l’hora? treu l’hora pel camí, tan bon punt fas clic a Confirmar.',
  'help.guide.set-stop-times.tip.3':
    'El camp Notes per a aquest dia, al mateix formulari, guarda el que només val en aquest dia, una taula reservada, un número d’entrada.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Treure una parada d’un dia',
  'help.guide.remove-from-day.goal': 'Desplanificar un lloc sense esborrar-lo del viatge.',
  'help.guide.remove-from-day.step.1': 'Fes clic dret a la parada i tria Treure del dia.',
  'help.guide.remove-from-day.step.2':
    'La parada ja no és al dia; el lloc es queda a la columna de llocs, sota Sense planificar si no és en cap altre dia.',
  'help.guide.remove-from-day.result':
    'El dia, la seva ruta i el seu cost s’actualitzen; la fletxa Desfés torna a portar la parada.',
  'help.guide.remove-from-day.tip.1': 'Eliminar, al mateix menú, treu el lloc de tot el viatge, cada dia inclòs.',
  'help.guide.remove-from-day.tip.2':
    'Treure del dia també és al plafó de detalls del lloc, al costat d’Afegeix al dia.',
  // lock-stop
  'help.guide.lock-stop.title': 'Fixar una parada al seu lloc',
  'help.guide.lock-stop.goal': 'Mantenir una parada on és quan s’optimitza la ruta.',
  'help.guide.lock-stop.step.1':
    'Passa el ratolí per la imatge de la parada i fes clic al cadenat: Mantén la posició durant l’optimització de ruta.',
  'help.guide.lock-stop.step.2':
    'Optimitza ara ordena les altres parades al seu voltant; fes clic al cadenat una altra vegada (Fes clic per desbloquejar) per alliberar-la.',
  'help.guide.lock-stop.result':
    'El cadenat es veu a la imatge; la parada manté la seva posició fins que la desbloquegis.',
  'help.guide.lock-stop.tip.1':
    'Una parada amb hora fixa està bloquejada per la seva hora; durant l’optimització no es mou mai.',
  'help.guide.lock-stop.tip.2':
    'El bloqueig dura aquesta visita: després de recarregar, cada parada torna a ser lliure, només les parades amb hora queden fixes.',
  // day-note
  'help.guide.day-note.title': 'Afegir una nota a un dia',
  'help.guide.day-note.goal': 'Guardar un recordatori, un número d’entrada o un pla B dins el dia mateix.',
  'help.guide.day-note.step.1': 'Fes clic a Afegeix una nota a la capçalera del dia.',
  'help.guide.day-note.step.2':
    'Posa-li un nom a Nota, és el que es veu al dia, i escriu la resta a Nota diària. La barra d’eines de sobre dona format al text (Negreta, Llista amb pics, Enllaç, Cita), i Vista prèvia, a l’esquerra, mostra com quedarà la nota al dia.',
  'help.guide.day-note.step.3':
    'Tria una Icona i un Color, perquè la nota destaqui entre les parades, i després Afegir.',
  'help.guide.day-note.step.4':
    'La nota és al dia com una parada: arrossega-la al seu lloc, fes-hi clic dret per a Editar i Eliminar.',
  'help.guide.day-note.result':
    'La nota forma part del dia, també al PDF; una nota amb hora s’ordena amb les parades amb hora.',
  'help.guide.day-note.tip.1':
    'Una nota amb hora pot fer de transport del qual no tens cap reserva: «08:15 S3 des de l’estació central».',
  'help.guide.day-note.tip.2': 'Les notes són per dia; una nota per a tot el viatge pertany a Col·laboració.',
  // day-route
  'help.guide.day-route.title': 'Mostrar i optimitzar la ruta del dia',
  'help.guide.day-route.goal':
    'Veure el camí entre les parades, triar com viatges i deixar que el TREK ordeni la seqüència.',
  'help.guide.day-route.step.1':
    'Obre el dia i fes clic a Ruta a la barra de ruta: el camí entre les parades es dibuixa al mapa, i els connectors entre les parades mostren el temps i la distància de cada tram.',
  'help.guide.day-route.step.2':
    'En cotxe i A peu, al costat, fixen el mitjà de transport del dia; els trams es recalculen. Els plugins poden afegir mitjans propis.',
  'help.guide.day-route.step.3':
    'Fes clic en un connector per canviar el mitjà d’aquell sol tram: tria un mitjà, o Usa el valor per defecte del dia per tornar al del dia.',
  'help.guide.day-route.step.4':
    'Optimitza reordena les parades pel camí més curt. Les parades amb un cadenat o amb hora fixa mantenen el seu lloc; amb un allotjament al dia, la ruta comença allà.',
  'help.guide.day-route.step.5':
    'Obre a Google Maps o Obre a CoMaps obre tot el dia com a ruta en aquella aplicació, per navegar pel camí.',
  'help.guide.day-route.result':
    'El dia és una ruta amb hores; Cost total i els trams s’actualitzen a mesura que canvia l’ordre.',
  'help.guide.day-route.tip.1':
    'Les rutes venen d’OSRM per defecte; l’administrador pot apuntar el TREK a un altre motor de rutes sota Valors per defecte.',
  'help.guide.day-route.tip.2':
    'Un tram que no s’ha pogut calcular no mostra cap temps; comprova que totes dues parades tinguin coordenades.',
  'help.guide.day-route.tip.3': 'La fletxa Desfés desfà una optimització.',
  // manage-days
  'help.guide.manage-days.title': 'Afegir, reordenar i reanomenar dies',
  'help.guide.manage-days.goal': 'Donar forma als dies mateixos, no només al que hi ha a sobre.',
  'help.guide.manage-days.step.1':
    'Els dies surten de les dates del viatge; canvia les dates a la targeta del viatge sota Tauler i s’afegeixen o es treuen dies als extrems. Abans que es tregui un dia amb contingut, una llista diu quins dies marxen i què porten.',
  'help.guide.manage-days.step.2':
    'Reordena els dies a la barra d’eines obre una llista: Puja i Baixa desplacen un dia amb tot el que porta, i Elimina el dia, la paperera del costat, el treu. Sota la llista, el botó amb la data següent afegeix un dia just després de l’últim amb data i allarga el viatge un dia; Sense data n’afegeix un sense data al final.',
  'help.guide.manage-days.step.3':
    'Elimina el dia pregunta primer: la llista mostra què marxa amb el dia, els seus llocs, notes i reserves, un allotjament amb entrada o sortida aquell dia i els dies que avancen una data. Elimina el dia el treu i Cancel·lar el conserva; l’últim dia no es pot eliminar.',
  'help.guide.manage-days.step.4':
    'Per reanomenar un dia, obre’l i fes clic al llapis del costat del títol als Detalls del dia sobre el mapa; el nom substitueix Dia 1 a la targeta i al PDF.',
  'help.guide.manage-days.step.5':
    'Expandeix tots els dies i Contreu tots els dies a la barra d’eines pleguen totes les targetes alhora; una targeta sola es plega amb la seva fletxeta.',
  'help.guide.manage-days.result':
    'Les dates es queden amb la posició: un dia que puja pren la data anterior, i les seves parades, notes i reserves viatgen amb ell.',
  'help.guide.manage-days.tip.1': 'Moure dies es pot desfer des de la barra d’eines; eliminar un dia, no.',
  'help.guide.manage-days.tip.2':
    'El cost a la capçalera d’un dia suma les parades i les reserves d’aquell dia que porten un preu.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Llegir reserves i transports al pla',
  'help.guide.bookings-in-plan.goal': 'Saber on apareix una reserva un cop existeix, i quina pantalla la crea.',
  'help.guide.bookings-in-plan.step.1':
    'Un transport (Vol, Tren, Ferri, Autobús, Cotxe) apareix al dia en què surt com a Sortida i al dia en què arriba com a Arribada, amb hora i trajecte; un de diversos dies abasta els dies del mig.',
  'help.guide.bookings-in-plan.step.2':
    'Una reserva lligada a una parada (un Restaurant, una Excursió) marca aquella parada com a Reserva confirmada o Reserva pendent; una reserva amb dia però sense parada és una fila pròpia dins el dia.',
  'help.guide.bookings-in-plan.step.3':
    'Una nit a l’hotel és un allotjament: és als Detalls del dia sota Allotjament, del Registre d’entrada al Registre de sortida, i la ruta de cadascun d’aquells dies comença allà.',
  'help.guide.bookings-in-plan.step.4':
    'Al mapa, l’interruptor d’una fila de transport dibuixa la seva ruta; Mostra totes les rutes de reserva, a la barra d’eines, les dibuixa totes.',
  'help.guide.bookings-in-plan.step.5':
    'Per crear-les: Afegeix una reserva en una parada amb el ratolí a sobre, Afegeix transport i Transport públic a la capçalera del dia, i les pestanyes Reserves i Transports per a la llista completa amb importació i fitxers.',
  'help.guide.bookings-in-plan.result':
    'Una reserva, un lloc al pla; les pestanyes són les mateixes reserves en forma de llista.',
  'help.guide.bookings-in-plan.tip.1':
    'Confirmada i Pendent és un estat que poses a la reserva; el pla el mostra a la parada, la pestanya Reserves les compta totes dues.',
  'help.guide.bookings-in-plan.tip.2':
    'Un transport amb hora fixa no es pot arrossegar; en lloc d’això, canvia-li l’hora a la reserva.',
  // export-plan
  'help.guide.export-plan.title': 'Exportar el pla',
  'help.guide.export-plan.goal': 'Endur-te el pla com a document, al teu calendari o a un GPS.',
  'help.guide.export-plan.step.1': 'Fes clic a Exporta a la barra d’eines de sobre els dies.',
  'help.guide.export-plan.step.2':
    'Document: PDF obre la vista d’impressió de cada dia amb les seves parades, notes i reserves; Salt de pàgina per dia comença cada dia en una pàgina nova, Desa com a PDF el baixa.',
  'help.guide.export-plan.step.3':
    'Calendari: Baixa .ics desa les reserves com a fitxer de calendari; Subscriu-te al calendari dona un enllaç que la teva aplicació de calendari refresca tota sola.',
  'help.guide.export-plan.step.4':
    'Mapes i GPS · GPX: Tot el viatge exporta llocs, rutes dels dies i traces; Només els llocs, els punts; Dies com a rutes, una ruta per dia, per a mapes fora de línia i aparells GPS.',
  'help.guide.export-plan.result': 'El fitxer es baixa; al viatge no canvia res.',
  'help.guide.export-plan.tip.1':
    'Un dia sol va cap a una aplicació de mapes des de la seva barra de ruta: Obre a Google Maps o Obre a CoMaps.',
  'help.guide.export-plan.tip.2':
    'Subscriu-te al calendari necessita els canals de calendari activats als teus ajustos; el Tauler té una guia per fer-ho.',
  'help.guide.export-plan.tip.3': 'Exportar és llegir: qualsevol membre del viatge ho pot fer.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Detalls del lloc',
  'help.ctx.trip-place.summary':
    'La fitxa que s’obre damunt del mapa quan tries un lloc: tot el que el viatge en sap, les estrelles que hi ha posat tothom, la seva imatge i els seus fitxers, i els botons que el posen al dia obert, a una llista o a una aplicació de mapes.',
  'help.ctx.trip-place.bullet.1':
    'Fes clic a una fila de la columna de llocs, a una parada dins d’un dia o a un marcador del mapa, i la fitxa s’obre damunt del mapa. Triar-lo dins d’un dia diu a la fitxa de quina parada parles, i això és el que hi porta els participants de la parada i la seva reserva.',
  'help.ctx.trip-place.bullet.2':
    'La capçalera duu la imatge rodona, el nom, la categoria, l’adreça i les coordenades. Fes clic a la imatge per posar-ne una de teva, fes doble clic al nom per canviar el nom del lloc a l’instant, i la X de la dreta tanca la fitxa.',
  'help.ctx.trip-place.bullet.3':
    'A sota: el preu si en té, les estrelles que cada viatger ha donat al lloc, la descripció i les notes, i Notes per a aquest dia quan la parada en duu.',
  'help.ctx.trip-place.bullet.4':
    'Horari d’obertura, Color de la ruta, Dades de la ruta i Fitxers vénen després, en la mesura que s’apliquin. Fitxers accepta qualsevol cosa de les teves carpetes i també llista el que penja de la reserva d’aquesta parada.',
  'help.ctx.trip-place.bullet.5':
    'La fila de baix: Afegeix al dia o Treure del dia mentre hi ha un dia obert, després Desar a la col·lecció, Navegació, Obre el lloc web, Editar i Eliminar.',
  'help.ctx.trip-place.bullet.6':
    'Un lloc triat de la cerca porta el que l’índex de TREK o OpenStreetMap en saben: un anell verd Obert o vermell Tancat al voltant de la imatge, jutjat pel rellotge del lloc mateix, el telèfon sota les estrelles, Horari d’obertura més avall amb la línia del dia a la fila i tota la setmana darrere d’un clic, i el seu lloc web darrere d’Obre el lloc web. La valoració de Google només surt en un lloc trobat per Google, en un TREK amb una clau de Google.',
  // read-place
  'help.guide.read-place.title': 'Què et diu la fitxa d’un lloc',
  'help.guide.read-place.goal': 'Llegeix tot el que el viatge sap d’un lloc, en una sola fitxa.',
  'help.guide.read-place.step.1':
    'A la columna dels dies, fes clic a la parada que vols llegir. La fitxa s’obre damunt del mapa i la parada queda marcada al seu dia.',
  'help.guide.read-place.step.2':
    'La capçalera: la imatge rodona, el nom, l’adreça i les coordenades exactes. Un anell verd amb Obert, o un de vermell amb Tancat, al voltant de la imatge diu si el lloc és obert ara mateix, pel seu propi rellotge, un cop TREK en coneix l’horari. La X de la dreta torna a tancar la fitxa.',
  'help.guide.read-place.step.3':
    'A sota, les estrelles que cada viatger ha donat al lloc, amb la mitjana i quants han votat. Encara sense valoració mentre no ho hagi fet ningú. Just a sota, el telèfon on el lloc en té: un clic hi passa el número a la teva aplicació de telèfon.',
  'help.guide.read-place.step.4':
    'Després la descripció i, a sota, les notes. Totes dues són el text del formulari del lloc, renderitzat: llistes, enllaços i negreta funcionen.',
  'help.guide.read-place.step.5': 'Participants diu qui va a aquesta parada. Hi són tots fins que en treus algú.',
  'help.guide.read-place.step.6':
    'Horari d’obertura, més avall: la fila porta l’horari del dia que estàs mirant, i un clic la desplega amb tota la setmana i aquell dia en negreta. Fitxers hi és al costat.',
  'help.guide.read-place.result':
    'La fitxa queda oberta fins que la tanques amb la X o tries un altre lloc, l’horari de la setmana queda desplegat, i la parada a la qual pertany queda marcada a la columna dels dies.',
  'help.guide.read-place.tip.1':
    'Triada des de la columna de llocs, la fitxa coneix el lloc però no cap parada, així que no mostra ni participants ni reserva. Tria la parada dins del dia i hi són tots dos.',
  'help.guide.read-place.tip.2':
    'Fes doble clic al nom per canviar el nom del lloc sense obrir el formulari. Retorn desa, Esc descarta el canvi.',
  'help.guide.read-place.tip.3':
    'Un lloc escrit a mà no mostra res d’això: la fitxa només coneix el que té el seu formulari. Obre’l amb Editar, tria’l entre els suggeriments sota Cerca llocs… i fes clic a Actualitzar, i l’horari, el telèfon i el lloc web hi vénen. La valoració de Google necessita una clau de Google.',
  // rate-place
  'help.guide.rate-place.title': 'Valorar un lloc',
  'help.guide.rate-place.goal': 'Posa les teves estrelles a un lloc, i mira les que hi ha posat tothom.',
  'help.guide.rate-place.step.1':
    'Obre el lloc. La fila d’estrelles seu just sota la capçalera i duu la mitjana dels vots fins ara, amb el seu nombre entre parèntesis.',
  'help.guide.rate-place.step.2':
    'Fes clic a l’estrella que vols. Les estrelles s’omplen mentre hi passes per sobre, així veus què estàs a punt de donar.',
  'help.guide.rate-place.step.3':
    'El teu vot entra a la mitjana de seguida, i les cares del costat són qui ha votat. Deixa el punter sobre la fila per veure les estrelles de tothom.',
  'help.guide.rate-place.step.4':
    'La mateixa mitjana és a la fila del lloc a la columna de llocs, així els bons destaquen a la llista.',
  'help.guide.rate-place.result':
    'Les teves estrelles són al lloc, a la vista de tot el viatge, i l’estrella de la fila de filtres sobre la llista ja pot deixar només els llocs que arriben a un mínim.',
  'help.guide.rate-place.tip.1':
    'Tot viatger pot valorar, fins i tot en un viatge on només alguns tenen el permís Afegeix / edita / elimina llocs.',
  'help.guide.rate-place.tip.2':
    'Fes clic a l’estrella que ja has donat per retirar el teu vot. Sense ningú votant, el lloc torna a dir Encara sense valoració.',
  'help.guide.rate-place.tip.3':
    'Al costat de les estrelles hi caben fins a sis votants com a cares; el rètol els anomena tots, i marca el teu.',
  // place-image
  'help.guide.place-image.title': 'Posar la teva pròpia imatge a un lloc',
  'help.guide.place-image.goal': 'Substitueix la miniatura automàtica per una foto teva.',
  'help.guide.place-image.step.1': 'Obre el lloc des de la columna de llocs.',
  'help.guide.place-image.step.2':
    'Deixa el punter sobre la imatge rodona de la capçalera: apareix una càmera i el rètol diu Puja una imatge. Fes-hi clic i tria el teu fitxer.',
  'help.guide.place-image.step.3': 'La capçalera mostra ara la teva imatge, amb una X vermella petita al seu cantó.',
  'help.guide.place-image.step.4':
    'La mateixa imatge és a la fila del lloc a la columna de llocs, i al seu marcador del mapa.',
  'help.guide.place-image.result':
    'La teva imatge és la imatge del lloc a tot arreu: la fitxa, la columna de llocs, la parada del dia, el marcador del mapa i un viatge compartit.',
  'help.guide.place-image.tip.1': 'S’accepten JPG, PNG, GIF i WebP, i un HEIC d’un iPhone es converteix en entrar.',
  'help.guide.place-image.tip.2':
    'La X del cantó treu la teva imatge i torna l’automàtica. El lloc mateix queda intacte.',
  'help.guide.place-image.tip.3':
    'Sense una imatge teva el TREK en busca una a partir de les coordenades del lloc, i recorre a la icona de la categoria.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Posar el lloc al dia obert, o treure’l',
  'help.guide.place-day-assign.goal':
    'Fes servir el botó de la fitxa mateixa en comptes d’arrossegar la fila pel planificador.',
  'help.guide.place-day-assign.step.1':
    'Fes clic a la capçalera d’un dia a la columna dels dies. Aquell dia ara és l’obert, i la fitxa hi treballa.',
  'help.guide.place-day-assign.step.2':
    'Fes clic a la columna de llocs en un lloc que no és en aquell dia. La seva fitxa s’obre i la fila de baix ofereix Afegeix al dia.',
  'help.guide.place-day-assign.step.3':
    'Fes clic a Afegeix al dia. La parada cau al final del dia i el botó passa a ser Treure del dia.',
  'help.guide.place-day-assign.step.4':
    'La parada ja és al dia, l’última de la llista. Arrossega-la amunt fins al seu lloc.',
  'help.guide.place-day-assign.step.5':
    'Treure del dia torna a treure aquella parada del dia, i la fitxa ofereix Afegeix al dia un altre cop.',
  'help.guide.place-day-assign.result':
    'El dia duu la parada, o ja no la duu, i el lloc mateix queda intacte en tots dos casos.',
  'help.guide.place-day-assign.tip.1':
    'El botó només existeix mentre hi ha un dia obert. Sense cap dia, la fitxa no té on afegir el lloc.',
  'help.guide.place-day-assign.tip.2':
    'Treure una parada d’un dia deixa el lloc al viatge i a la columna de llocs. Eliminar és el que el treu de tot arreu.',
  'help.guide.place-day-assign.tip.3':
    'Una parada que una reserva d’allotjament ha posat al dia no ofereix cap dels dos botons: aquella nit s’afegeix i es treu al bloc Allotjament del dia.',
  // place-participants
  'help.guide.place-participants.title': 'Dir qui va a aquesta parada',
  'help.guide.place-participants.goal': 'Divideix el grup per a una parada sense dividir el viatge.',
  'help.guide.place-participants.step.1':
    'Fes clic a la parada dins del dia. La fitxa s’obre i Participants llista tothom del viatge.',
  'help.guide.place-participants.step.2':
    'Fes clic al nom d’un viatger per treure’l d’aquesta parada. El nom es ratlla mentre hi passes per sobre.',
  'help.guide.place-participants.step.3':
    'Apareix un + de traç discontinu tan bon punt hi falta algú. Fes-hi clic per veure qui no és a la parada.',
  'help.guide.place-participants.step.4':
    'Fes clic a un nom per tornar-lo a posar. Amb tothom de nou dins, la parada torna a ser de tot el grup.',
  'help.guide.place-participants.result':
    'La parada duu els viatgers que has triat, i la resta del grup té aquella tarda per a ells.',
  'help.guide.place-participants.tip.1':
    'Participants només apareix amb una parada seleccionada, així que tria el lloc dins del dia i no a la columna de llocs, i només en un viatge amb més d’un viatger.',
  'help.guide.place-participants.tip.2':
    'Ningú triat vol dir que hi van tots, i per això l’últim viatger que queda en una parada no es pot treure.',
  'help.guide.place-participants.tip.3':
    'Un convidat, que no té compte propi, pot ser participant com qualsevol altre.',
  // place-booking
  'help.guide.place-booking.title': 'La reserva d’una parada',
  'help.guide.place-booking.goal': 'Llegeix la reserva que pertany a una parada, obre-la, i penja-n’hi una de nova.',
  'help.guide.place-booking.step.1':
    'Obre la parada a la qual pertany la reserva. La fitxa mostra una franja amb Confirmada o Pendent i el nom de la reserva.',
  'help.guide.place-booking.step.2':
    'La franja duu la Data, l’Hora i el Codi de reserva, i les notes que tingui la reserva.',
  'help.guide.place-booking.step.3': 'Fes clic a la franja. El formulari de la reserva s’hi obre al damunt.',
  'help.guide.place-booking.step.4':
    'Vincula a una assignació del dia és el que penja una reserva d’una parada, i aquí ja n’anomena aquesta. Torna a tancar el formulari.',
  'help.guide.place-booking.step.5':
    'Una reserva nova per a una parada comença a la columna dels dies: passa per sobre de la parada i fes clic al + del seu extrem. El formulari s’obre com a Reserva nova, ja vinculada a ella.',
  'help.guide.place-booking.result':
    'La reserva penja de la parada: és a la fitxa, és al dia, i els seus fitxers també apareixen aquí sota Fitxers.',
  'help.guide.place-booking.tip.1':
    'La franja només es mostra a la parada de la qual penja la reserva. Una reserva sense parada viu a la pestanya Reserves.',
  'help.guide.place-booking.tip.2':
    'Diverses reserves poden compartir una parada: el dinar i la visita que surt de la mateixa porta.',
  'help.guide.place-booking.tip.3':
    'Un tren, un vol o un ferri obre en canvi el formulari de transport, el mateix que fa servir la pestanya Transports.',
  // place-files
  'help.guide.place-files.title': 'Tenir les entrades d’un lloc amb el lloc',
  'help.guide.place-files.goal': 'Posa l’entrada, el val o el plànol d’un lloc allà on el buscaràs.',
  'help.guide.place-files.step.1':
    'Obre el lloc. Fitxers seu al peu de la fitxa i diu Fitxers mentre el lloc no en té cap.',
  'help.guide.place-files.step.2': 'Fes clic a Pujar, al costat, i tria el fitxer.',
  'help.guide.place-files.step.3': 'El botó compta el que el lloc guarda, i la llista s’obre tota sola.',
  'help.guide.place-files.step.4': 'Cada fila és el nom del fitxer amb la seva mida. Fes-hi clic per obrir el fitxer.',
  'help.guide.place-files.result':
    'El fitxer seu al lloc, comptat a la fitxa, i també és a la pestanya Fitxers del viatge.',
  'help.guide.place-files.tip.1':
    'Fitxers també llista el que penja de la reserva d’aquesta parada, així una confirmació d’hotel apareix a l’hotel.',
  'help.guide.place-files.tip.2': 'Pujar accepta diversos fitxers alhora.',
  'help.guide.place-files.tip.3':
    'Sense el permís Puja fitxers el botó Pujar no hi és; els fitxers que ja són al lloc s’hi queden.',
  // place-navigation
  'help.guide.place-navigation.title': 'Obrir un lloc en una aplicació de mapes o al seu lloc web',
  'help.guide.place-navigation.goal': 'Passa el lloc a l’aplicació que t’hi portarà de debò.',
  'help.guide.place-navigation.step.1': 'Obre el lloc i fes clic a Navegació a la fila de baix.',
  'help.guide.place-navigation.step.2':
    'La llista són les aplicacions de mapes que encaixen amb aquest lloc: Google Maps, Waze, Apple Maps, OpenStreetMap i CoMaps.',
  'help.guide.place-navigation.step.3':
    'Fes clic a la que fas servir. El TREK li passa el lloc mateix quan pot, no només un parell de coordenades, així arribes a l’entrada bona.',
  'help.guide.place-navigation.step.4':
    'Obre el lloc web, al costat, obre la pàgina pròpia del lloc, els seus horaris i les seves entrades, en una pestanya nova.',
  'help.guide.place-navigation.result':
    'L’aplicació de mapes s’obre al lloc, el lloc web en una pestanya pròpia, i al viatge no canvia res.',
  'help.guide.place-navigation.tip.1':
    'El Waze comença a navegar de seguida. Les altres obren el lloc, i sortir des d’allà és un toc més.',
  'help.guide.place-navigation.tip.2':
    'Quines aplicacions s’ofereixen depèn del lloc i del teu dispositiu: l’Apple Maps queda fora a Android, el 高德地图 només surt per a un lloc a la Xina, i Waze, Apple Maps i CoMaps necessiten les coordenades del lloc.',
  'help.guide.place-navigation.tip.3':
    'Quan només hi encaixa una aplicació, el botó duu el nom d’aquesta aplicació i l’obre directament.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Desar un lloc a una de les teves llistes',
  'help.guide.place-to-collection.goal': 'Guarda per al proper viatge un lloc que has trobat en aquest.',
  'help.guide.place-to-collection.step.1': 'Obre el lloc i fes clic a Desar a la col·lecció al capdavall de la fitxa.',
  'help.guide.place-to-collection.step.2':
    'Desar a la llista mostra totes les llistes que són teves o que comparteixes. Una marca assenyala les que ja tenen aquest lloc.',
  'help.guide.place-to-collection.step.3': 'Fes clic a la llista. El lloc hi és de seguida.',
  'help.guide.place-to-collection.step.4': 'Tanca, i el botó de la fitxa diu Desat.',
  'help.guide.place-to-collection.result':
    'El lloc és a la teva llista amb la seva imatge, les seves notes i la seva adreça, a punt per al proper viatge.',
  'help.guide.place-to-collection.tip.1':
    'El botó només hi és mentre el complement Col·leccions està actiu, cosa que l’administrador engega a Complements.',
  'help.guide.place-to-collection.tip.2':
    'Un lloc pot ser a diverses llistes alhora, amb un estat propi a cadascuna: una Idea a l’una, Visitat a l’altra.',
  'help.guide.place-to-collection.tip.3':
    'Marca com a visitat, al costat del nom del lloc al selector, el marca a la llista; amb el lloc a diverses de les teves llistes la píndola diu Visitat pertot i les fa totes de cop.',
  // place-track
  'help.guide.place-track.title': 'Llegir una ruta i donar-li un color propi',
  'help.guide.place-track.goal':
    'Mira com de llarga és una caminada importada, i distingeix la seva línia de les altres al mapa.',
  'help.guide.place-track.step.1':
    'A la columna de llocs, la fila d’una ruta duu un traç curt del color amb què està dibuixat el seu traçat. Fes-hi clic.',
  'help.guide.place-track.step.2':
    'Dades de la ruta dóna la llargada del camí, en la Unitat de distància que hagis posat.',
  'help.guide.place-track.step.3':
    'Color de la ruta, a sobre, mostra el color en ús. Fes clic a la fila per obrir les mostres.',
  'help.guide.place-track.step.4': 'Tria un color. El traçat del mapa i el traç de la fila canvien amb ell.',
  'help.guide.place-track.step.5':
    'La cel·la de traç discontinu de l’esquerra, Color automàtic, torna a la ruta el color que hereta; la pipeta de la dreta obre el selector de colors del teu sistema per a qualsevol altre.',
  'help.guide.place-track.result':
    'La ruta es dibuixa amb el color que has triat, a la fitxa, a la seva fila de la columna de llocs i al mapa.',
  'help.guide.place-track.tip.1':
    'Només un lloc que duu un camí, importat d’un fitxer GPX, KML o KMZ, té aquests dos blocs.',
  'help.guide.place-track.tip.2':
    'Una ruta enregistrada amb altituds mostra també el seu punt més alt i més baix, els metres de pujada i de baixada, i el perfil de la caminada.',
  'help.guide.place-track.tip.3':
    'Una importació dóna a cada ruta que porta un color propi, així dues caminades mai no arriben amb el mateix.',
  // read-place
  'help.guide.read-place.step.7':
    'La fila de baix és el que pots fer des d’aquí: treure el lloc del dia obert o posar-l’hi, desar-lo a una llista, obrir-lo en una aplicació de mapes, editar-lo o eliminar-lo.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Fitxers',
  'help.ctx.trip-files.summary':
    'Tots els documents del viatge en una llista: bitllets, confirmacions, passis i imatges, cadascun amb una nota, un enllaç al lloc o a la reserva a què pertany, i una paperera d’on pot tornar a sortir.',
  'help.ctx.trip-files.bullet.1':
    'Arrossega els fitxers aquí, a dalt, agafa els fitxers; un clic al quadre obre el selector de fitxers. La línia de sota enumera els tipus de fitxer que accepta aquest TREK i el límit de 50 MB per fitxer.',
  'help.ctx.trip-files.bullet.2':
    'Les pestanyes diuen què mostra la llista: Tot, PDF, Imatges i Documents, cadascuna amb el seu recompte. Una pestanya d’estrella s’hi afegeix així que un fitxer es destaca, i Notes de col·laboració així que una nota porta un adjunt.',
  'help.ctx.trip-files.bullet.3':
    'Una fila porta qui la va pujar, el nom, la nota a sota, la mida i la data, i una etiqueta per enllaç: Pla diari i el lloc, Reserva o Transport i la reserva, Des de notes de col·laboració.',
  'help.ctx.trip-files.bullet.4':
    'Al final d’una fila hi ha Destaca, Assigna, Obrir, Baixa i Eliminar. Eliminar no pregunta: el fitxer va a la paperera, d’on es pot recuperar.',
  'help.ctx.trip-files.bullet.5':
    'Una imatge o un vídeo s’obre a pantalla completa, amb les tecles de fletxa i una tira de miniatures; qualsevol altre document s’obre en una vista prèvia sobre la pàgina, amb Obre en una pestanya nova i Baixa. Un passi de wallet es baixa de seguida.',
  'help.ctx.trip-files.bullet.6':
    'Paperera, a l’extrem dret, canvia la llista als fitxers eliminats, on cadascun es restaura o s’elimina per sempre i Buida la paperera els treu tots. On un administrador ha connectat un magatzem de documents, al costat hi ha Sincronització de documents.',
  // files-upload
  'help.guide.files-upload.title': 'Posar un document al viatge',
  'help.guide.files-upload.goal':
    'Treu un bitllet, una confirmació o una foto de la teva carpeta de baixades i posa’ls al viatge, on hi pot arribar tothom qui hi és.',
  'help.guide.files-upload.step.1':
    'Obre el viatge i fes clic a Fitxers a la barra de pestanyes. Allà hi ha llistats els documents del viatge, amb el quadre de pujada a sobre.',
  'help.guide.files-upload.step.2':
    'Fes clic a Arrossega els fitxers aquí i tria un o diversos fitxers. Es pugen l’un darrere l’altre i al quadre hi diu Pujant... mentre dura. La línia de sota del quadre diu quins tipus accepta aquest TREK, i que un fitxer pot fer 50 MB com a màxim.',
  'help.guide.files-upload.step.3':
    'Així que el darrer fitxer és a dalt, Assigna el fitxer s’obre tot sol per a ell. Afegeix una nota... dona al fitxer una línia pròpia, i les llistes de sota el lliguen a un lloc o a una reserva. Tanca’l amb la ×; en tancar-lo no es perd res.',
  'help.guide.files-upload.step.4':
    'Els fitxers nous queden a dalt de tot de la llista. Una fila mostra qui el va pujar, el nom, la mida i la data; una imatge rep una miniatura, qualsevol altre fitxer el seu tipus.',
  'help.guide.files-upload.result':
    'Els documents són al viatge, i tothom qui pot veure el viatge els pot obrir i baixar.',
  'help.guide.files-upload.tip.1':
    'Un fitxer també es pot arrossegar des de l’escriptori directament al quadre, que s’il·lumina mentre el fitxer hi és a sobre.',
  'help.guide.files-upload.tip.2':
    'Una imatge del porta-retalls entra a la llista amb Ctrl+V, així una captura de pantalla d’una reserva no s’ha de desar mai abans.',
  'help.guide.files-upload.tip.3':
    'Pujar demana el dret Puja fitxers; sense ell el quadre no hi és gens. Un tipus que no és a la llista es rebutja amb un missatge i no es puja res. Un fitxer de més de 50 MB el descarta el quadre mateix, abans que s’enviï res.',
  // files-link
  'help.guide.files-link.title': 'Lligar un document a un lloc o a una reserva',
  'help.guide.files-link.goal':
    'Fes que el bitllet es pugui trobar des del dia a què pertany, i no només des d’aquesta llista.',
  'help.guide.files-link.step.1':
    'Fes clic a Assigna, el llapis al final de la fila. S’obre Assigna el fitxer, amb el nom del fitxer.',
  'help.guide.files-link.step.2':
    'Sota Nota, Afegeix una nota... admet una línia, que després queda sota el nom del fitxer a la llista. Es desa en el moment que surts del camp.',
  'help.guide.files-link.step.3':
    'Sota Lloc hi ha els llocs del viatge, agrupats pel dia en què són, amb Sense assignar al final per als que no són en cap dia. Fes clic en un i rep una marca.',
  'help.guide.files-link.step.4':
    'Sota Reserva i Transport hi ha les reserves del viatge. Fes clic a aquella a què pertany el document; també rep la seva marca.',
  'help.guide.files-link.step.5': 'Tanca amb la ×. Aquí no hi ha botó de desar: cada clic s’ha escrit mentre el feies.',
  'help.guide.files-link.result':
    'La fila porta la nota i una etiqueta per enllaç, Pla diari i el nom del lloc, Transport i el nom del vol, i el document també penja del lloc i del vol.',
  'help.guide.files-link.tip.1':
    'Un fitxer pot tenir diversos enllaços alhora, així la mateixa confirmació pertany a l’hotel i a la nit que cobreix.',
  'help.guide.files-link.tip.2':
    'Tornar a fer clic en una entrada marcada treu aquell enllaç; el fitxer mateix es queda.',
  'help.guide.files-link.tip.3':
    'Funciona també a l’inrevés: un document adjuntat a un lloc o a una reserva també és en aquesta llista, amb la mateixa etiqueta a la seva fila.',
  // files-star
  'help.guide.files-star.title': 'Mantenir a dalt els documents importants',
  'help.guide.files-star.goal':
    'Treu els dos o tres papers que necessitaràs de debò d’una llista que creix tot el viatge.',
  'help.guide.files-star.step.1':
    'Fes clic a Destaca al final d’una fila. L’estrella s’omple de groc, una segona estrella apareix davant del nom del fitxer, i el botó ara diu Treure el destacat.',
  'help.guide.files-star.step.2':
    'La llista es torna a ordenar: els fitxers destacats queden per damunt de tots els altres, els més nous primer dins de cada grup.',
  'help.guide.files-star.step.3':
    'A dalt s’ha afegit una estrella a les pestanyes, amb el nombre de fitxers destacats al darrere. Fes-hi clic per veure només aquests.',
  'help.guide.files-star.result':
    'Els papers que necessites al taulell són a dalt de tot de la llista, i una pestanya no mostra res més.',
  'help.guide.files-star.tip.1':
    'La pestanya d’estrella només existeix mentre hi ha alguna cosa destacada. Treu el destacat del darrer fitxer i la pestanya se’n va amb ell.',
  'help.guide.files-star.tip.2':
    'Destacar compta com una edició: un membre que només pot llegir els fitxers del viatge veu les estrelles, però no les pot posar.',
  // files-filter
  'help.guide.files-filter.title': 'Trobar un document a la llista',
  'help.guide.files-filter.goal': 'Redueix una llista amb tot a l’únic tipus de paper que busques.',
  'help.guide.files-filter.step.1':
    'Les pestanyes de sobre la llista són Tot, PDF, Imatges i Documents, cadascuna amb el nombre de fitxers al darrere.',
  'help.guide.files-filter.step.2': 'Fes clic a PDF: la llista es queda amb els fitxers PDF i res més.',
  'help.guide.files-filter.step.3':
    'Dues pestanyes més van i vénen amb el que hi ha al viatge. Fes clic a Notes de col·laboració, que hi és així que una nota de la pestanya Col·laboració porta un adjunt: la llista es queda aquests fitxers i res més. Una estrella s’afegeix a la fila igual, així que un fitxer es destaca.',
  'help.guide.files-filter.step.4': 'Tot torna a portar la llista sencera.',
  'help.guide.files-filter.result':
    'La llista mostra només el que anomena la pestanya, i el recompte de cada pestanya diu quants n’hi ha.',
  'help.guide.files-filter.tip.1':
    'Aquí no hi ha carpetes ni canvis de nom: la nota d’Assigna el fitxer, els enllaços a llocs i reserves, i l’estrella són allò pel qual s’ordena un document.',
  'help.guide.files-filter.tip.2':
    'La llista mateixa va sempre destacats primer i després els més nous primer, així un document pujat avui queda per damunt d’un del mes passat.',
  // files-preview
  'help.guide.files-preview.title': 'Llegir un document sense sortir de TREK',
  'help.guide.files-preview.goal':
    'Mira un bitllet o una imatge allà mateix, i porta’ls a la teva màquina quan els necessitis allà.',
  'help.guide.files-preview.step.1':
    'Fes clic al nom d’una imatge o a la seva miniatura. S’obre a pantalla completa, amb el nom del fitxer i el seu lloc entre les imatges a la capçalera.',
  'help.guide.files-preview.step.2':
    'Les fletxes rodones dels costats, les tecles de fletxa esquerra i dreta i la tira de miniatures de baix recorren totes les imatges que la llista mostra en aquell moment.',
  'help.guide.files-preview.step.3':
    'Obre en una pestanya nova i Baixa són a la capçalera; la × o Esc torna a tancar la imatge.',
  'help.guide.files-preview.step.4':
    'Un document que no és una imatge s’obre en canvi en una vista prèvia sobre la pàgina, amb els mateixos dos botons a la seva capçalera. Aquesta es tanca amb la × o amb un clic al costat.',
  'help.guide.files-preview.step.5':
    'Baixa al final d’una fila desa el fitxer directament a la teva màquina, sense obrir res abans.',
  'help.guide.files-preview.result':
    'El document és a la pantalla, i els mateixos dos botons el posen en una pestanya del navegador o al teu disc.',
  'help.guide.files-preview.tip.1':
    'En una pantalla tàctil llisques per les imatges en comptes de fer clic a les fletxes.',
  'help.guide.files-preview.tip.2':
    'Un passi de wallet no obre mai una vista prèvia: es baixa de seguida, perquè el telèfon el pugui passar a la seva aplicació de wallet.',
  'help.guide.files-preview.tip.3':
    'Obre en una pestanya nova i Baixa van a buscar tots dos el fitxer amb la teva sessió, així un enllaç copiat de la barra d’adreces no serveix a ningú més.',
  // files-trash
  'help.guide.files-trash.title': 'Llençar un document, i recuperar-lo',
  'help.guide.files-trash.goal':
    'Neteja el que el viatge ja no necessita, sense perdre res que al final sí que necessitaves.',
  'help.guide.files-trash.step.1':
    'Fes clic a Eliminar al final d’una fila. El fitxer surt de la llista a l’instant i el missatge diu Mogut a la paperera. No pregunta res abans.',
  'help.guide.files-trash.step.2':
    'Paperera, a l’extrem dret de la barra d’eines, canvia la llista al que s’ha llençat. El títol diu Paperera i les pestanyes de filtre desapareixen.',
  'help.guide.files-trash.step.3':
    'Una fila llençada queda grisa i li queden dos botons: Restaura, que torna el fitxer, i Eliminar, que el treu per sempre després d’una pregunta.',
  'help.guide.files-trash.step.4':
    'Fes clic a Restaura. El missatge diu Fitxer restaurat i la fila surt de la paperera, amb la nota i els enllaços encara posats.',
  'help.guide.files-trash.step.5':
    'Buida la paperera, a dalt, treu per sempre tot el que encara hi ha aquí, i el navegador ho pregunta un cop abans de fer-ho. Paperera torna a canviar als fitxers.',
  'help.guide.files-trash.result': 'El fitxer torna a ser a la llista on era, com si no hagués passat res.',
  'help.guide.files-trash.tip.1':
    'Eliminar en una fila no pregunta abans, i per això hi ha la paperera: res no surt de TREK fins que ho dius aquí dins.',
  'help.guide.files-trash.tip.2':
    'Llençar un fitxer i recuperar-lo demana el dret Elimina fitxers. Un membre que no el té no veu ni Eliminar a la fila ni els botons de la paperera.',
  'help.guide.files-trash.tip.3': 'Un fitxer eliminat per sempre a la paperera no es pot recuperar.',
  // files-sync
  'help.guide.files-sync.title': 'Mantenir els documents al dia amb el teu magatzem de documents',
  'help.guide.files-sync.goal':
    'Lliga el viatge al teu propi magatzem de documents, perquè el que es puja aquí arribi allà i el que s’arxiva allà aparegui aquí.',
  'help.guide.files-sync.step.1':
    'Fes clic a Sincronització de documents, al costat de Paperera a l’extrem dret de la barra d’eines. El diàleg s’obre amb el nom del viatge sota el títol. A l’esquerra, sota Connecta un proveïdor, hi ha els magatzems que un administrador ha activat, cadascun amb una línia sobre com arxiva: Paperless-ngx i Papra per etiqueta, Nextcloud i Synology Drive en una carpeta, OpenCloud en un espai. A la dreta diu Encara no hi ha res connectat.',
  'help.guide.files-sync.step.2':
    'Fes clic al teu magatzem, aquí Nextcloud. S’obre un diàleg més petit per a la connexió, amb el nom del magatzem, que et demana les dades amb què s’inicia la sessió en aquest magatzem.',
  'help.guide.files-sync.step.3':
    'Omple Adreça i l’inici de sessió propi del magatzem: un Token API per a Paperless-ngx, una Clau API i l’ID d’organització per a Papra, Nom d’usuari i una Contrasenya d’aplicació per a Nextcloud, Nom d’usuari i un Token d’aplicació per a OpenCloud, i per a Synology Drive Nom d’usuari, Contrasenya i, si el compte en demana un, un Codi de doble factor. Fes servir una contrasenya o un token d’aplicació sempre que el magatzem n’ofereixi, mai la contrasenya del teu compte. Nextcloud i Synology Drive també admeten una Carpeta base opcional, on TREK busca les carpetes dels viatges, aquí /Reisen. Accepta un certificat autosignat, a baix, només és per a un magatzem de la teva pròpia xarxa amb un certificat així.',
  'help.guide.files-sync.step.4':
    'Fes clic a Prova la connexió. TREK arriba al magatzem amb el que has escrit i el peu diu Contactat, sessió iniciada com a seguit del nom del compte. Unes credencials rebutjades o una adreça que no es pot abastar hi surten en lloc d’això, i en cap dels dos casos no es desa res.',
  'help.guide.files-sync.step.5':
    'Fes clic a Connecta. La connexió es desa amb el viatge i TREK pregunta on ha d’anar el viatge dins del magatzem: l’etiqueta, la carpeta o l’espai que en conté els documents. Només se sincronitza el que hi ha allà dins. Crea’n un de nou el crea en fer Crea, amb un nom preomplert a partir del títol del viatge; sota O fes servir un que ja tinguis hi ha els que ja existeixen. Fes clic a un, aquí la carpeta Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'El diàleg torna a ser-hi: el teu magatzem és sota Aquest viatge a l’esquerra, i la seva targeta a la dreta porta on se sincronitza, quan es va executar per última vegada i Sincronitza ara. Una primera execució comença sola; Sincronitza ara en llança una quan vulguis. Un cop una execució ha acabat, la insígnia Encara no s’ha sincronitzat al costat del nom deixa pas a un punt verd, Al dia quan hi apuntes, i la barra de flux compta els documents que TREK i el magatzem tenen cadascun, amb els carrils Cap al gestor i Des del gestor entremig. Tanca el diàleg amb la ×.',
  'help.guide.files-sync.result':
    'Els documents que ja hi eren són a dalt de tot de la llista, pujats a nom teu, i cada document del viatge també és al magatzem. A partir d’ara TREK revisa el magatzem en segon pla, i el magatzem segueix la llista.',
  'help.guide.files-sync.tip.1':
    'Només el propietari del viatge o un administrador de la instància pot lligar un viatge, ja que les credencials arriben a tot aquell compte del magatzem. Tots els membres poden obrir Sincronització de documents, llegir la targeta i prémer Sincronitza ara.',
  'help.guide.files-sync.tip.2':
    'Un magatzem a la teva pròpia xarxa necessita ALLOW_INTERNAL_NETWORK=true al servidor de TREK, i la seva adreça ha de ser l’adreça de la màquina a la xarxa, mai localhost. Sense això, Prova la connexió respon Aquesta adreça no està permesa.',
  'help.guide.files-sync.tip.3':
    'Desconnecta a la targeta acaba l’aparellament i conserva tots els documents a les dues bandes. Una etiqueta, carpeta o espai lligat per segona vegada es tracta com a nou, i tot el que hi ha torna a entrar, així que després d’un Desconnecta lliga’n un de buit en lloc del vell.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Detalls del dia',
  'help.ctx.trip-day-detail.summary':
    'El panell que la capçalera d’un dia obre sobre el mapa: el dia sencer, el seu nom i la seva data, el temps allà on seràs, les reserves que hi cauen i les nits reservades per a ell.',
  'help.ctx.trip-day-detail.bullet.1':
    'Fes clic a la capçalera d’un dia a la columna dels dies i el panell s’obre sobre el centre del mapa. La mateixa capçalera un altre cop, o la creu de la seva dreta, el tanca i deixa anar el dia.',
  'help.ctx.trip-day-detail.bullet.2':
    'La capçalera porta el nom del dia i la seva data. El llapis del costat del nom canvia el nom del dia, el doble chevron plega el panell en una barra estreta perquè el mapa torni a quedar lliure.',
  'help.ctx.trip-day-detail.bullet.3':
    'A dalt de tot, el temps del dia. Previsió per a anomena el lloc al qual correspon: la primera parada del dia, o l’allotjament on et despertes.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reserves llista les reserves d’aquell dia, cadascuna amb el seu tipus, la parada a la qual pertany i els seus horaris. Verd vol dir confirmada, ambre encara pendent; només és una lectura, les reserves es canvien a la pestanya Reserves.',
  'help.ctx.trip-day-detail.bullet.5':
    'Allotjament mostra cada nit reservada sobre aquest dia, amb Registre d’entrada i Registre de sortida als dies en què passen, la franja d’entrada, l’hora de sortida i el número de confirmació.',
  'help.ctx.trip-day-detail.bullet.6':
    'Afegeix un allotjament reserva una nit en aquest dia: tria l’establiment entre els llocs del viatge, digues quins dies cobreix, i afegeix els horaris i el codi.',
  // day-panel
  'help.guide.day-panel.title': 'Obrir un dia i llegir-ne els detalls',
  'help.guide.day-panel.goal':
    'Veure un dia sencer, el seu temps, les seves reserves i on dorms, sense deixar el mapa.',
  'help.guide.day-panel.step.1':
    'Fes clic a la capçalera d’un dia a la columna dels dies. El dia queda seleccionat i els seus detalls s’obren sobre el centre del mapa.',
  'help.guide.day-panel.step.2': 'La capçalera anomena el dia, Dia 1 mentre no li donis un nom, amb la data a sota.',
  'help.guide.day-panel.step.3':
    'A dalt de tot, el temps del dia. Previsió per a diu a quin lloc correspon: la primera parada del dia, o l’allotjament on et despertes.',
  'help.guide.day-panel.step.4': 'Reserves, a sota, llista les reserves que cauen en aquest dia, amb els seus horaris.',
  'help.guide.day-panel.step.5':
    'Allotjament mostra les nits reservades sobre aquest dia, amb Registre d’entrada i Registre de sortida als dies en què passen.',
  'help.guide.day-panel.step.6':
    'El doble chevron de la capçalera plega el panell en una barra estreta. La creu del costat tanca el panell i deixa anar el dia.',
  'help.guide.day-panel.result':
    'Plegat a la seva barra, el panell deixa el mapa lliure i manté el dia seleccionat; tancat, el dia queda desseleccionat i el pla és com era.',
  'help.guide.day-panel.tip.1':
    'Fer clic a qualsevol punt de la barra de capçalera del panell també el plega. El chevron només n’és el botó.',
  'help.guide.day-panel.tip.2':
    'Obrir un lloc des de la columna dels llocs posa els detalls del lloc a l’espai del panell. Tanca’ls i el dia torna.',
  // day-weather
  'help.guide.day-weather.title': 'Llegir el temps del dia',
  'help.guide.day-weather.goal': 'Saber com serà el dia allà on ets realment aquell dia.',
  'help.guide.day-weather.step.1':
    'Previsió per a anomena el lloc al qual corresponen els números: la primera parada del dia o, en un dia sense cap, l’allotjament on et despertes.',
  'help.guide.day-weather.step.2':
    'El número gran és la temperatura del dia, al costat la mínima i la màxima, i la condició en paraules.',
  'help.guide.day-weather.step.3':
    'Els xips de sota: la probabilitat de pluja, quanta en cau, el vent més fort, i l’alba i el capvespre.',
  'help.guide.day-weather.step.4':
    'A baix de tot, el dia hora per hora, cada dues hores: l’hora, la icona, la temperatura i la probabilitat de pluja. Una hora per sobre del 50 per cent queda ombrejada de blau.',
  'help.guide.day-weather.result':
    'La targeta del dia a la columna dels dies porta el mateix temps en petit sota el seu número, de manera que tot el viatge es llegeix d’un cop d’ull.',
  'help.guide.day-weather.tip.1':
    'Els graus i el vent segueixen Unitat de temperatura, a Pantalla dins de Configuració: tria °F Fahrenheit i la mateixa previsió es dona en °F i mph.',
  'help.guide.day-weather.tip.2':
    'Un dia sense cap parada localitzada i sense allotjament on despertar-se no mostra cap temps: la previsió sempre és per a un lloc, mai per al viatge.',
  'help.guide.day-weather.tip.3':
    'Més enllà de 16 dies no hi ha previsió a obtenir. Els números són llavors les mitjanes d’anys anteriors per a aquella data, marcats amb Ø i indicats com a tals a sota.',
  // rename-day
  'help.guide.rename-day.title': 'Donar un nom al dia',
  'help.guide.rename-day.goal': 'Dir-li a un dia el que és, Arribada a Kyoto o Dia de descans, en comptes de Dia 5.',
  'help.guide.rename-day.step.1': 'Obre el dia. La seva capçalera diu Dia 5, amb la data a sota.',
  'help.guide.rename-day.step.2': 'Fes clic al llapis del costat del nom.',
  'help.guide.rename-day.step.3': 'El nom es converteix en un camp. Escriu el nom que vulguis.',
  'help.guide.rename-day.step.4':
    'Prem Retorn, o simplement fes clic en un altre lloc; Esc llença el canvi. La targeta del dia a la columna dels dies també porta el nom.',
  'help.guide.rename-day.result':
    'El nom substitueix Dia 5 al panell i a la targeta del dia de la columna dels dies; la data es queda on era.',
  'help.guide.rename-day.tip.1':
    'Buida el camp i desa, i el dia torna a ser Dia 5: el número és el que surt quan no hi ha nom.',
  'help.guide.rename-day.tip.2':
    'El nom pertany al dia, no a la seva data. Reordena els dies i el nom viatja amb tota la resta d’aquell dia.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Reservar una nit en un dia',
  'help.guide.add-accommodation.goal':
    'Posar l’hotel al pla una sola vegada, amb els dies que cobreix, els seus horaris i el seu número de confirmació.',
  'help.guide.add-accommodation.step.1':
    'L’establiment primer ha de ser un lloc del viatge. Crea’l a la columna dels llocs com faries amb qualsevol altre lloc: el selector només ofereix el que ja hi és.',
  'help.guide.add-accommodation.step.2':
    'Obre el dia de la teva arribada i fes clic a Afegeix un allotjament, sota Allotjament.',
  'help.guide.add-accommodation.step.3':
    'Aplica als dies diu quines nits cobreix l’estada: el dia d’entrada a l’esquerra, el dia de sortida a la dreta. Tots agafa tot el viatge.',
  'help.guide.add-accommodation.step.4':
    'Omple Registre d’entrada, Fins a i Registre de sortida, i posa el número de la reserva a Confirmació. Tots quatre poden quedar buits.',
  'help.guide.add-accommodation.step.5':
    'Tria l’establiment entre els llocs del viatge. Els xips de sobre la llista la redueixen a una sola categoria.',
  'help.guide.add-accommodation.step.6': 'Fes clic a Desar.',
  'help.guide.add-accommodation.result':
    'L’estada surt a cada dia que cobreix, Registre d’entrada al primer i Registre de sortida a l’últim. L’establiment es converteix en una parada del dia d’entrada, de manera que el mapa dibuixa el camí fins allà, i a la pestanya Reserves apareix una reserva de tipus Allotjament.',
  'help.guide.add-accommodation.tip.1':
    'El selector s’obre al dia d’on venies, amb la sortida l’endemà; tots dos es poden moure abans de desar.',
  'help.guide.add-accommodation.tip.2':
    'Dona a l’hotel la categoria Hotel del viatge quan el creïs i els xips de sobre la llista la redueixen als teus hotels amb un sol clic.',
  'help.guide.add-accommodation.tip.3':
    'Els horaris són tots opcionals: una estada sense entrada i sense codi cobreix igualment les seves nits i dibuixa igualment la seva ruta.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Canviar o anul·lar una nit reservada',
  'help.guide.edit-accommodation.goal': 'Moure una estada, corregir-ne els horaris, o treure-la del pla altre cop.',
  'help.guide.edit-accommodation.step.1':
    'A cada dia de l’estada la targeta mostra l’establiment, la franja d’entrada, l’hora de sortida i el número de confirmació.',
  'help.guide.edit-accommodation.step.2':
    'El llapis de la seva dreta torna a obrir l’estada. La finestra ara diu Edita l’allotjament.',
  'help.guide.edit-accommodation.step.3':
    'Corregeix la fila de camps: Registre d’entrada, Fins a, Registre de sortida i Confirmació. Els dies de sobre i l’establiment de sota també es canvien aquí.',
  'help.guide.edit-accommodation.step.4': 'Fes clic a Desar.',
  'help.guide.edit-accommodation.step.5':
    'La creu del costat del llapis acaba l’estada. No pregunta res, i la reserva de tipus Allotjament que li pertany se’n va amb ella.',
  'help.guide.edit-accommodation.result':
    'El canvi arriba de cop a cada dia que l’estada cobreix, i a la reserva de tipus Allotjament de la pestanya Reserves amb ell.',
  'help.guide.edit-accommodation.tip.1':
    'Una nit al mig d’una estada no porta ni l’etiqueta Registre d’entrada ni Registre de sortida: només les porten el primer i l’últim dia del rang.',
  'help.guide.edit-accommodation.tip.2':
    'Anul·lar una estada s’emporta també la parada que va posar al dia d’entrada i qualsevol despesa lligada a la seva reserva. Reserva la nit de nou si va ser un error.',
  // day-bookings
  'help.guide.day-bookings.title': 'Les reserves del dia d’un cop d’ull',
  'help.guide.day-bookings.goal': 'Veure en un sol lloc què hi ha ja reservat per a aquest dia i si està confirmat.',
  'help.guide.day-bookings.step.1':
    'Reserves llista les reserves del dia: les datades en ell, i les que pengen d’alguna de les seves parades.',
  'help.guide.day-bookings.step.2':
    'Una fila mostra de quin tipus de reserva es tracta, el seu nom i, quan pertany a una parada, aquella parada després d’un punt. Els seus horaris queden a l’extrem dret.',
  'help.guide.day-bookings.step.3':
    'El color diu com està una reserva: una fila verda està confirmada, una d’ambre encara està pendent. Els allotjaments no surten en aquesta llista, tenen el seu propi bloc a sota.',
  'help.guide.day-bookings.step.4':
    'La llista només llegeix les reserves. Una reserva es crea i es canvia a la pestanya Reserves.',
  'help.guide.day-bookings.result':
    'Tot el que està datat al dia, i tot el que penja d’alguna de les seves parades, és en aquesta única llista.',
  'help.guide.day-bookings.tip.1':
    'Una reserva cau en un dia per la seva pròpia data. Canvia la data a la pestanya Reserves i passa a l’altre dia tota sola.',
  'help.guide.day-bookings.tip.2':
    'Que no hi hagi bloc Reserves vol dir que el dia no té reserves: s’amaga en lloc de mostrar-se buit.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Mapa',
  'help.ctx.trip-map.summary':
    'El centre del pla: cada lloc del viatge com una xinxeta, les rutes que els uneixen i els interruptors de les vores del mapa per al satèl·lit, per a tot el viatge alhora i per als llocs del voltant de la zona que estàs mirant.',
  'help.ctx.trip-map.bullet.1':
    'Una xinxeta és un lloc: la seva pròpia foto quan en té una, si no el color de la seva categoria amb la icona de la categoria. Deixa-hi el punter a sobre per veure una fitxa amb el nom i l’adreça, més la categoria i la valoració quan el lloc les duu. Arrossega una xinxeta fins a una targeta del dia per planificar-hi el lloc.',
  'help.ctx.trip-map.bullet.2':
    'Les xinxetes massa juntes per distingir-les es pleguen en una bombolla fosca amb un recompte. Fes clic a la bombolla i el mapa s’acosta al que hi ha a dins.',
  'help.ctx.trip-map.bullet.3':
    'Fes clic en una xinxeta per obrir el lloc sota el mapa, amb la seva valoració, els seus fitxers i què fer-ne tot seguit; fes clic en un tros buit del mapa per deixar-lo anar de nou.',
  'help.ctx.trip-map.bullet.4':
    'Amb un dia obert a la columna dels dies, les seves parades porten una petita insígnia blanca amb el seu número dins d’aquell dia, i un lloc planificat en dos dies porta els dos números, units per ·.',
  'help.ctx.trip-map.bullet.5':
    'La fila d’icones de dalt cerca a la part del mapa que veus: Restaurants, Cafeteries, Bars i oci nocturn, Allotjament, Llocs d’interès, Museus i cultura, Natura i parcs i Activitats. Cerca en aquesta zona la torna a executar després que moguis el mapa.',
  'help.ctx.trip-map.bullet.6':
    'Un clic dret a qualsevol punt del mapa obre el formulari de lloc en aquell punt, amb l’adreça ja consultada. El botó rodó de baix a l’esquerra bescanvia el mapa dibuixat per imatges aèries.',
  'help.ctx.trip-map.bullet.7':
    'Mostra tot el viatge, a baix a la dreta, dibuixa tots els dies de trajecte alhora i llista què cobreix cadascun; la icona de ruta a la fila d’una reserva dibuixa aquella reserva, i la de la barra d’eines sobre els dies les dibuixa totes.',
  // map-markers
  'help.guide.map-markers.title': 'Llegir el mapa',
  'help.guide.map-markers.goal': 'Saber què t’està dient cada xinxeta, insígnia i bombolla del mapa.',
  'help.guide.map-markers.step.1':
    'El mapa porta tots els llocs del viatge. Allà on les xinxetes queden massa juntes per distingir-les, es pleguen en una bombolla fosca que porta el nombre que hi ha a dins; fes clic a la bombolla i el mapa s’acosta al que hi havia a dins, o, al zoom més profund, desplega les xinxetes en ventall.',
  'help.guide.map-markers.step.2':
    'Una xinxeta és la foto pròpia del lloc quan en té una, si no el color de la seva categoria amb la icona de la categoria. Deixa-hi el punter a sobre i una fitxa en dona el nom i l’adreça, amb la categoria i la valoració quan el lloc les duu.',
  'help.guide.map-markers.step.3':
    'Fes clic en una xinxeta i el lloc s’obre en una fitxa sota el mapa: les seves coordenades, la seva valoració, els seus fitxers, i a baix de tot què fer-ne tot seguit, entre això Navegació, Editar i Eliminar, amb Afegeix al dia mentre hi ha un dia obert. Fes clic en un tros buit del mapa per deixar-lo anar de nou.',
  'help.guide.map-markers.step.4':
    'Obre un dia a la columna dels dies i les seves parades es numeren: la petita insígnia blanca al cantó d’una xinxeta és el lloc que ocupa aquella parada dins del dia. Un lloc planificat en dos dies porta els dos números, units per ·. Sense cap dia obert no hi ha números, i el cantó porta la valoració al seu lloc.',
  'help.guide.map-markers.step.5':
    'Arrossega una xinxeta del mapa fins a una targeta del dia a la columna dels dies i el lloc queda planificat aquell dia, exactament com si arrosseguessis la seva fila fora de la llista de llocs.',
  'help.guide.map-markers.result':
    'Al viatge no ha canviat res: el mapa n’és una vista, i cada xinxeta diu quin lloc, quin dia i en quin ordre.',
  'help.guide.map-markers.tip.1':
    'Un dia plegat a la columna dels dies s’emporta les seves parades fora del mapa; torna a obrir el dia i hi tornen a ser.',
  'help.guide.map-markers.tip.2':
    'El filtre de sobre la llista de llocs també decideix què dibuixa el mapa: tria Sense planificar i només hi queden els llocs que encara no tenen dia.',
  'help.guide.map-markers.tip.3':
    'Aquest mapa no té botons de zoom: la roda fa zoom, un doble clic s’acosta un pas, i arrossegar el mapa mateix el mou.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Trobar llocs del teu voltant al mapa',
  'help.guide.map-nearby-places.goal':
    'Deixa que el mapa busqui restaurants, llocs d’interès o un hotel a la zona que estàs mirant, i porta’n un al viatge.',
  'help.guide.map-nearby-places.step.1':
    'La fila d’icones de dalt del mapa és la cerca per categoria: Restaurants, Cafeteries, Bars i oci nocturn, Allotjament, Llocs d’interès, Museus i cultura, Natura i parcs i Activitats.',
  'help.guide.map-nearby-places.step.2':
    'Fes clic en una categoria. TREK busca aquest tipus de lloc a la part del mapa que veus i posa una xinxeta del color de la categoria per a cada resultat. Una categoria alhora: fer clic en una altra la bescanvia, i fer clic en la que està activa l’apaga.',
  'help.guide.map-nearby-places.step.3':
    'Mou el mapa i sota la fila apareix un segon botó: Cerca en aquesta zona torna a fer la mateixa cerca per a la vista nova. Moure el mapa tot sol no torna a cercar mai, cosa que manté baix el nombre de peticions.',
  'help.guide.map-nearby-places.step.4':
    'Les xinxetes porten el nom del que s’ha trobat. Fes clic en una i el formulari de lloc s’obre ja emplenat a partir d’ella: Nom, Adreça, Latitud i Longitud, i el lloc web i el telèfon allà on OpenStreetMap els té.',
  'help.guide.map-nearby-places.step.5':
    'Revisa el que s’ha emplenat i afegeix el que la cerca no podia saber: una Descripció, una Categoria, notes teves.',
  'help.guide.map-nearby-places.step.6':
    'Fes clic a Afegir. Si ja hi ha un lloc amb el mateix nom al viatge, el formulari ho diu i el botó passa a ser Afegir igualment.',
  'help.guide.map-nearby-places.result':
    'El lloc és a la llista de llocs i al mapa com una de les xinxetes pròpies del viatge, sota Sense planificar fins que el posis en un dia. Les xinxetes de la cerca es queden fins que apaguis la categoria.',
  'help.guide.map-nearby-places.tip.1':
    'La fila no hi és quan Explora llocs al mapa està desactivat a Configuració, sota Viatge i mapa.',
  'help.guide.map-nearby-places.tip.2':
    'Les respostes vénen de l’índex de llocs de TREK i d’OpenStreetMap, així que això és una de les poques coses del pla que necessita connexió.',
  'help.guide.map-nearby-places.tip.3':
    'Una cerca cobreix el que hi ha a la pantalla, així que acosta el zoom al carrer pel qual preguntes: una ciutat sencera respon amb els primers seixanta resultats i amb poc ordre.',
  // map-add-place
  'help.guide.map-add-place.title': 'Crear un lloc amb un clic dret al mapa',
  'help.guide.map-add-place.goal': 'Posa un lloc exactament on el vols, sense buscar-lo abans.',
  'help.guide.map-add-place.step.1':
    'Fes clic dret al punt del mapa que vols. S’obre el formulari de lloc, amb el títol Afegeix un lloc / activitat.',
  'help.guide.map-add-place.step.2':
    'Latitud i Longitud ja són en aquell punt, i TREK consulta les coordenades i omple Adreça amb el que hi troba, i també Nom quan la consulta en dona un. Encara no s’ha desat res, així que sobreescriu tot el que no vagi bé.',
  'help.guide.map-add-place.step.3':
    'Dona-li un Nom que reconeguis, i la resta del que el pla ha de saber: Descripció, Notes, Categoria, Lloc web.',
  'help.guide.map-add-place.step.4':
    'Fes clic a Afegir. El lloc cau a la llista com a no planificat fins i tot amb un dia obert: un clic dret al mapa diu on, no quan.',
  'help.guide.map-add-place.result':
    'El lloc és a la llista i al mapa, sota Sense planificar fins que el posis en un dia.',
  'help.guide.map-add-place.tip.1':
    'L’adreça surt d’una consulta de les coordenades, així que pot llegir-se com un carrer i no com un nom, i en camp obert pot tornar buida. Els dos camps són teus per sobreescriure’ls.',
  'help.guide.map-add-place.tip.2':
    'Als mapes MapLibre GL i Mapbox GL un clic amb el botó del mig fa el mateix, i en una pantalla tàctil una pulsació llarga.',
  // map-satellite
  'help.guide.map-satellite.title': 'Canviar a satèl·lit',
  'help.guide.map-satellite.goal': 'Bescanvia el mapa dibuixat per imatges aèries, i torna.',
  'help.guide.map-satellite.step.1':
    'El botó rodó de baix a l’esquerra del mapa és el commutador de capa base. La seva icona mostra sempre la capa cap a la qual aniria, i passar-hi el punter diu quina: Canvia a vista de satèl·lit. Fes-hi clic.',
  'help.guide.map-satellite.step.2':
    'Ara el mapa són imatges aèries, prou detallades per distingir un sol edifici i sense cap clau teva. Tot el que dibuixa TREK es queda a sobre: les xinxetes, la ruta del dia, les rutes importades i les rutes de reserves.',
  'help.guide.map-satellite.step.3': 'El botó ara diu Canvia a vista de mapa. Fes-hi clic per tornar al mapa dibuixat.',
  'help.guide.map-satellite.result':
    'El mapa torna a estar dibuixat, i la capa on el vas deixar es recorda al teu compte.',
  'help.guide.map-satellite.tip.1':
    'La tria es guarda al teu compte i no al viatge, de manera que cada viatge s’obre tal com el vas deixar, sigui quin sigui el motor de mapes que facis servir.',
  'help.guide.map-satellite.tip.2':
    'Les imatges no porten cap text: els noms de carrer, els barris i els números són al mapa dibuixat, així que torna-hi quan busquis una adreça.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Veure tot el viatge i les seves distàncies',
  'help.guide.map-whole-trip.goal':
    'Bescanvia l’únic dia obert per tots els dies de trajecte del viatge, i llegeix fins on arriba cadascun.',
  'help.guide.map-whole-trip.step.1':
    'El botó rodó Mostra tot el viatge és a baix a la dreta del mapa. Fes-hi clic i tots els dies de trajecte del viatge es dibuixen alhora, cadascun amb el seu color sobre una vora blanca, perquè els dies veïns quedin separats.',
  'help.guide.map-whole-trip.step.2':
    'La fitxa de sobre el botó llista aquests dies: un punt de color, el nom del dia, una icona per a cada manera com el recorres, i la distància que cobreix. Distància total és a dalt de tot.',
  'help.guide.map-whole-trip.step.3':
    'Fes clic en un dia de la fitxa per seleccionar-lo, igual que si el triessis a la columna dels dies: el mapa enquadra aquell dia, i les seves parades recuperen els números.',
  'help.guide.map-whole-trip.step.4': 'El botó ara diu Amaga tot el viatge. Prem-lo per tornar a l’únic dia obert.',
  'help.guide.map-whole-trip.result':
    'Cada dia de trajecte està dibuixat amb el seu color, i la fitxa diu què cobreix cadascun i a quant arriba el viatge.',
  'help.guide.map-whole-trip.tip.1':
    'El total arriba uns quants trams cada vegada. Mentre el segueixi un …, el nombre encara és una suma parcial; queda fixat un cop cada tram ha respost.',
  'help.guide.map-whole-trip.tip.2':
    'Un tram que l’encaminador rebutja es queda com una línia recta i no compta res, i la fitxa ho diu en comptes de mostrar en silenci una xifra massa baixa.',
  'help.guide.map-whole-trip.tip.3':
    'Un dia amb menys de dues parades localitzades no té cap ruta per dibuixar, així que queda del tot fora de la fitxa.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Mostrar la ruta d’una reserva al mapa',
  'help.guide.map-booking-routes.goal':
    'Dibuixa al mapa els vols, els trens i els trajectes en cotxe que has reservat, i treu-los de nou.',
  'help.guide.map-booking-routes.step.1':
    'Les rutes de reserves estan apagades fins que en demanes una. A la fila d’una reserva, a la columna dels dies, hi ha una petita icona de ruta: Mostra les rutes de reserves.',
  'help.guide.map-booking-routes.step.2':
    'Fes-hi clic i la reserva apareix al mapa: un vol com un arc de cercle màxim, un trajecte en cotxe per les carreteres reals, un tren com la cadena de les seves estacions. Confirmada es dibuixa contínua, Pendent discontínua, i els extrems de la ruta són píndoles blaves amb la icona del transport.',
  'help.guide.map-booking-routes.step.3':
    'Fes clic en una píndola d’extrem i s’obre la reserva que hi ha al darrere, amb els seus horaris, la seva referència i d’on surt. Tancar la desa de nou.',
  'help.guide.map-booking-routes.step.4':
    'La icona de ruta de la barra d’eines sobre els dies fa tot el viatge alhora: Mostra totes les rutes de reserva dibuixa totes les reserves que en tenen una.',
  'help.guide.map-booking-routes.step.5':
    'És un full en blanc i no una capa a sobre, de manera que el que havies triat reserva per reserva es deixa anar. Torna a prémer-lo, que ara diu Amaga totes les rutes de reserva, i el mapa queda net.',
  'help.guide.map-booking-routes.result':
    'Les reserves que has demanat estan dibuixades al mapa, i la tria es guarda per a aquest viatge en aquest navegador fins que la canviïs.',
  'help.guide.map-booking-routes.tip.1':
    'Els extrems porten el codi de l’aeroport o el nom de l’estació només quan Etiquetes de rutes de reserves està activat a Configuració, sota Viatge i mapa; si no, només mostren la icona.',
  'help.guide.map-booking-routes.tip.2':
    'Mostra sempre les rutes de reserva, a la mateixa configuració, les dibuixa des del principi a cada viatge sobre el qual encara no has decidit.',
  'help.guide.map-booking-routes.tip.3':
    'Una reserva necessita dos extrems amb coordenades abans de poder-se dibuixar, així que un hotel o un restaurant no porta icona de ruta.',
  'help.ctx.trip-map.bullet.8':
    'Amb l’addon Dawarich activat, el botó rodó Dawarich sota Mostra tot el viatge dibuixa el recorregut que el teu telèfon va enregistrar de debò: Mostra el recorregut enregistrat el posa discontinu sota la ruta planificada, un color per dia, i l’etiqueta del botó diu per què no hi ha línia quan no n’hi ha.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Mostrar el recorregut que has fet de debò',
  'help.guide.map-dawarich-trail.goal':
    'Posa sobre el mapa el recorregut que Dawarich va enregistrar al teu telèfon, discontinu al costat del que havies planificat, i llegeix el viatge dia a dia tal com va anar de debò.',
  'help.guide.map-dawarich-trail.step.1':
    'El botó rodó Dawarich és a baix a la dreta del mapa, sota Mostra tot el viatge; passar-hi per sobre diu Mostra el recorregut enregistrat. Fes-hi clic. TREK demana al teu Dawarich les dates del viatge, i un anell gira al voltant del botó mentre la resposta és de camí.',
  'help.guide.map-dawarich-trail.step.2':
    'El recorregut enregistrat arriba com una línia discontínua, un color per dia, dibuixada sota la ruta planificada perquè el pla es continuï llegint bé. El botó ara diu Amaga el recorregut enregistrat. Els dies es tallen a la mitjanit local, i un dia plegat a la columna dels dies s’emporta la seva línia discontínua fora del mapa juntament amb les seves parades.',
  'help.guide.map-dawarich-trail.step.3':
    'Fes clic també a Mostra tot el viatge i cada dia planificat es dibuixa en línia contínua al costat de l’enregistrament discontinu. On les dues van juntes, el dia va anar com estava planificat; on la línia discontínua se’n desvia és on no.',
  'help.guide.map-dawarich-trail.result':
    'El que havies planificat i el que vas fer de debò són junts al mapa, discontinu contra continu, i la targeta sobre els botons encara llista els dies planificats i les seves distàncies.',
  'help.guide.map-dawarich-trail.tip.1':
    'Activat o desactivat es recorda per viatge durant aquesta sessió del navegador. Mentre el recorregut és activat, TREK torna a preguntar a Dawarich cada dos minuts, així que un viatge en marxa es posa al dia sense recarregar; el recorregut mateix no es desa mai, així que no és a la base de dades de TREK, ni a les còpies de seguretat, ni hi és fora de línia.',
  'help.guide.map-dawarich-trail.tip.2':
    'L’etiqueta del botó explica un mapa buit: S’està carregant el recorregut enregistrat… mentre és de camí, No s’ha enregistrat res en aquestes dates, No s’ha pogut carregar el recorregut enregistrat, o El recorregut enregistrat necessita connexió quan TREK és fora de línia.',
  // map-compass
  'help.guide.map-compass.title': 'Girar el mapa i tornar a trobar el nord',
  'help.guide.map-compass.goal': 'Gira el mapa per encarar-lo cap on vas, i torna’l al nord amb un sol clic.',
  'help.guide.map-compass.step.1':
    'Gira el mapa arrossegant amb el botó dret, o mantén premuda Ctrl i arrossega amb el botó esquerre; en una pantalla tàctil, gira amb dos dits. La brúixola rodona al costat de la fila d’icones de categoria a dalt del mapa gira amb ell: la seva fletxa sempre apunta al nord, així que s’inclina tant com hagis girat.',
  'help.guide.map-compass.step.2':
    'Fes clic a la brúixola. Reset north, que és com es diu el botó, torna el mapa suaument al nord a dalt i a una vista plana, i la fletxa torna a quedar dreta.',
  'help.guide.map-compass.result':
    'El mapa torna a tenir el nord a dalt i és pla, i res del viatge no ha canviat: la brúixola només mou la càmera.',
  'help.guide.map-compass.tip.1':
    'La brúixola només existeix als mapes MapLibre GL i Mapbox GL; el mapa Leaflet no es pot girar, així que no en té. Proveïdor de mapa a Configuració, sota Mapa, decideix quin fas servir, i Desa el mapa conserva la tria.',
  'help.guide.map-compass.tip.2':
    'El clic també treu la inclinació: arrossegar amb el botó dret amunt o avall inclina la vista, i Reset north l’anivella juntament amb el gir. A Mapbox GL amb Edificis 3D i terreny activat, això aplana també la vista 3D, fins que la tornis a inclinar.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Col·laboració',
  'help.ctx.trip-collab.summary':
    'La pestanya on el grup planifica plegat: Missatges a l’esquerra, les notes compartides i els enllaços al costat, les enquestes a sota i Què ve ara al final. Tot el que s’escriu aquí és a l’instant a la pantalla de tots els altres membres, sense recarregar.',
  'help.ctx.trip-collab.bullet.1':
    'Missatges és la columna de l’esquerra. Escriu a Escriu un missatge... i prem Enter; Shift i Enter fan una línia nova. El smiley hi posa un emoji, Adjunta imatges penja fins a quatre imatges al missatge.',
  'help.ctx.trip-collab.bullet.2':
    'Passa el ratolí per sobre d’un missatge per a Respon i, en els teus, Eliminar; amb clic dret surten les vuit reaccions ràpides. Un missatge eliminat deixa una línia que diu que l’has eliminat.',
  'help.ctx.trip-collab.bullet.3':
    'Notes és el bloc compartit: Nota nova en escriu una, i l’engranatge del costat obre Gestiona les categories per als seus noms i colors. Una targeta porta Ampliar, Fixa, Edita i Elimina.',
  'help.ctx.trip-collab.bullet.4':
    'Enllaços recull les adreces sobre les quals va el viatge. Afegeix un enllaç pren un títol i una adreça http o https; Edita l’enllaç, Fixa l’enllaç i Suprimeix l’enllaç són al final de la fitxa, i els enllaços fixats es queden al davant.',
  'help.ctx.trip-collab.bullet.5':
    'Enquestes decideix les coses. Enquesta nova planteja una pregunta amb almenys dues opcions; un clic en una opció és el teu vot, Tanca acaba la votació i Elimina treu l’enquesta.',
  'help.ctx.trip-collab.bullet.6':
    'Què ve ara llista les parades del viatge que encara són al davant, fins a vuit, amb les seves hores i la gent que hi va. Només llegeix el pla del dia; les hores es fixen allà.',
  // write-note
  'help.guide.write-note.title': 'Escriure una nota compartida',
  'help.guide.write-note.goal':
    'Posa el que necessita tot el grup, una norma, una adreça, un recordatori, allà on tothom ho torna a trobar.',
  'help.guide.write-note.step.1': 'Fes clic a Nota nova a dalt del panell Notes. S’obre el formulari.',
  'help.guide.write-note.step.2':
    'Títol de la nota és el nom que porta la targeta. És l’única cosa que el formulari exigeix: Crea es queda gris mentre no hi hagi res.',
  'help.guide.write-note.step.3':
    'El requadre gran de sota conté el text i accepta Markdown: una paraula en negreta, una llista, un títol. La targeta mostra les primeres línies, i Ampliar a sobre obre la nota sencera.',
  'help.guide.write-note.step.4':
    'A Categoria, tria la que correspon a la nota; el seu color passa a ser el color de la targeta. Les píndoles són les categories que ja existeixen, i una de nova es crea a Gestiona les categories.',
  'help.guide.write-note.step.5':
    'Lloc web recull un enllaç que pertany a la nota. La targeta porta llavors un requadre Link que l’obre.',
  'help.guide.write-note.step.6': 'Fes clic a Crea.',
  'help.guide.write-note.result':
    'La nota és una targeta al panell Notes, amb el color de la seva categoria, i ja és a la pantalla de tots els altres membres.',
  'help.guide.write-note.tip.1':
    'Fixa en una targeta la manté a dalt del panell; tot el que hi ha a sota s’ordena per quan es va canviar per última vegada.',
  'help.guide.write-note.tip.2':
    'L’engranatge del costat de Nota nova obre Gestiona les categories: allà una categoria rep el seu color, es reanomena arreu de cop, o s’afegeix abans que cap nota la faci servir.',
  'help.guide.write-note.tip.3':
    'Adjunta fitxers penja un document a la nota. Adjunta obre el selector de fitxers, i una imatge o un PDF també es poden enganxar directament al formulari.',
  'help.guide.write-note.tip.4':
    'Notes és un interruptor propi a Complements, sota Col·laboració: un administrador la pot apagar i deixar funcionant el Xat, els Enllaços, les Enquestes i Què ve després.',
  // shared-links
  'help.guide.shared-links.title': 'Recollir els enllaços del viatge',
  'help.guide.shared-links.goal':
    'Tingues el portal de reserves, l’àlbum compartit i l’horari en un sol lloc en comptes de buscar-los per Missatges.',
  'help.guide.shared-links.step.1': 'Fes clic a Afegeix un enllaç a dalt del panell Enllaços.',
  'help.guide.shared-links.step.2':
    'Dona un nom a l’enllaç a Títol de l’enllaç, enganxa l’adreça al camp de sota i després fes clic a Desa l’enllaç.',
  'help.guide.shared-links.step.3':
    'La fitxa mostra el nom i el lloc al qual apunta. Un clic a sobre obre la pàgina en una pestanya nova.',
  'help.guide.shared-links.step.4':
    'Els tres botons petits del final són Edita l’enllaç, Fixa l’enllaç i Suprimeix l’enllaç. Fixa l’enllaç mou la fitxa al davant del panell; Suprimeix l’enllaç no pregunta res.',
  'help.guide.shared-links.result':
    'L’enllaç és una fitxa al panell Enllaços, fixada al davant, i a la pantalla de tots els membres alhora.',
  'help.guide.shared-links.tip.1':
    'Només s’accepten adreces http i https; el camp rebutja qualsevol altra cosa abans de desar.',
  'help.guide.shared-links.tip.2':
    'Els enllaços fixats van primer, després els més nous. La icona petita del costat d’un títol és la favicon del lloc mateix, agafada del lloc, per això sense internet la fitxa mostra un símbol d’enllaç senzill.',
  'help.guide.shared-links.tip.3':
    'Enllaços és un interruptor propi a Complements, sota Col·laboració, de manera que un administrador pot apagar el panell sense tocar la resta de la pestanya.',
  // create-poll
  'help.guide.create-poll.title': 'Preguntar al grup',
  'help.guide.create-poll.goal':
    'Converteix una pregunta que ningú no respon a Missatges en una enquesta que tothom pot marcar.',
  'help.guide.create-poll.step.1': 'Fes clic a Enquesta nova a dalt del panell Enquestes.',
  'help.guide.create-poll.step.2':
    'Escriu la pregunta. Compatible amb Markdown, sota el requadre, vol dir que aquí funcionen una paraula en negreta, un salt de línia o una llista curta.',
  'help.guide.create-poll.step.3': 'Omple Opció 1 i Opció 2. Dues opcions amb alguna cosa a dins són el mínim.',
  'help.guide.create-poll.step.4':
    '+ Afegeix una opció n’afegeix una tercera, una quarta, tantes com calgui; la creueta del costat d’una fila en treu una.',
  'help.guide.create-poll.step.5':
    'Selecció múltiple deixa que tothom marqui més d’una opció. Si es deixa apagada, un vot es trasllada quan algú tria una altra cosa.',
  'help.guide.create-poll.step.6': 'Fes clic a Crea l’enquesta.',
  'help.guide.create-poll.result': 'L’enquesta és a dalt del panell Enquestes, oberta, i encara no ha votat ningú.',
  'help.guide.create-poll.tip.1': 'La pregunta es mostra com a Markdown; les opcions es queden en text pla.',
  'help.guide.create-poll.tip.2':
    'Crea l’enquesta es queda gris fins que hi ha una pregunta i almenys dues opcions amb alguna cosa a dins.',
  'help.guide.create-poll.tip.3':
    'Una data límit només es pot posar a l’aplicació de mòbil. Una enquesta que en té una mostra aquí el temps que queda en una fitxa ambre i compta com a tancada quan s’acaba.',
  'help.guide.create-poll.tip.4':
    'Enquestes és un interruptor propi a Complements, sota Col·laboració: un administrador les pot apagar i deixar funcionant els altres quatre panells.',
  // vote-poll
  'help.guide.vote-poll.title': 'Votar i llegir el resultat',
  'help.guide.vote-poll.goal': 'Dona el teu vot, mira on és el grup i canvia d’opinió.',
  'help.guide.vote-poll.step.1': 'Fes clic a l’opció que vulguis. El seu cercle s’omple i la barra de darrere creix.',
  'help.guide.vote-poll.step.2':
    'Ara es llegeix tot el resultat: la barra és la proporció, el percentatge és a la dreta, i els cercles petits són les persones que han triat aquella opció.',
  'help.guide.vote-poll.step.3':
    'Has canviat d’opinió? Fes clic en una altra opció. En una enquesta sense Selecció múltiple el teu vot es trasllada en comptes d’afegir-ne un segon.',
  'help.guide.vote-poll.step.4':
    'Sota la pregunta hi ha quants vots té l’enquesta. Un clic a l’opció que ja havies triat et torna a treure el vot, i el comptador baixa.',
  'help.guide.vote-poll.result':
    'La teva marca és en una opció, les barres mostren com es reparteix el grup, i els cercles diuen qui ha triat què.',
  'help.guide.vote-poll.tip.1':
    'Les barres i els percentatges només apareixen quan has votat tu mateix, o quan l’enquesta està tancada, perquè ningú no es deixi influir pel resultat provisional.',
  'help.guide.vote-poll.tip.2':
    'Un vot no és mai anònim: passa el ratolí per un dels cercles d’una opció per veure el nom que hi ha darrere.',
  // close-poll
  'help.guide.close-poll.title': 'Tancar una enquesta o treure-la',
  'help.guide.close-poll.goal':
    'Atura la votació quan el grup ja ha decidit, i treu del mig una enquesta que ja no necessita ningú.',
  'help.guide.close-poll.step.1':
    'Tanca, el cadenat de la cantonada d’una enquesta, acaba la votació. Les opcions deixen d’acceptar clics.',
  'help.guide.close-poll.step.2':
    'Una enquesta tancada baixa sota el títol Tancades al final del panell, porta una insígnia Tancada i ensenya el resultat a tothom, hagin votat o no. L’opció guanyadora es tenyeix de verd.',
  'help.guide.close-poll.step.3':
    'Elimina, la paperera al mateix racó, treu l’enquesta. Res no pregunta dues vegades, i els vots se’n van amb ella.',
  'help.guide.close-poll.result':
    'L’enquesta ha desaparegut del panell de tots els membres. Una que només has tancat es queda llegible a baix, amb el seu resultat.',
  'help.guide.close-poll.tip.1':
    'Tancar no es pot desfer: no hi ha cap reobertura. Una enquesta tancada sense voler s’ha de tornar a plantejar.',
  'help.guide.close-poll.tip.2':
    'Elimina treu l’enquesta i tots els seus vots a tothom, de seguida i sense cap pregunta.',
  // whats-next
  'help.guide.whats-next.title': 'Llegir Què ve ara',
  'help.guide.whats-next.goal': 'Mira què fa el grup a continuació sense obrir el pla.',
  'help.guide.whats-next.step.1':
    'El panell llista les parades del viatge que encara són al davant, fins a vuit, en ordre d’hora, sota un títol per dia: Avui, Demà o la data.',
  'help.guide.whats-next.step.2':
    'A l’esquerra d’una fila hi ha la seva hora: l’inici, fins a, i el final quan la parada en té, o TBD quan encara no s’hi ha posat cap hora.',
  'help.guide.whats-next.step.3':
    'Les fitxes de sota el nom són les persones d’aquella parada. Si no s’hi ha triat ningú, hi surt tothom del viatge.',
  'help.guide.whats-next.result': 'Una llista del que ve, només per llegir: segueix el pla, i res d’aquí no el canvia.',
  'help.guide.whats-next.tip.1':
    'Aquí no es fixa res. Les hores vénen del pla del dia; canvia-les allà i aquesta llista ho segueix a l’instant.',
  'help.guide.whats-next.tip.2':
    'Només es llista el que encara és al davant: una parada amb l’hora ja passada en surt, i al final d’un viatge el panell és buit.',
  'help.guide.whats-next.tip.3':
    'Què ve després és un interruptor propi a Complements, sota Col·laboració, i és un panell d’escriptori: la pestanya Col·laboració de l’aplicació de mòbil no l’ofereix.',
  // trip-chat
  'help.guide.trip-chat.title': 'Parlar amb el grup',
  'help.guide.trip-chat.goal':
    'Digues alguna cosa, respon a un missatge concret, reacciona a un altre i retira el teu.',
  'help.guide.trip-chat.step.1':
    'Escriu a Escriu un missatge... i prem Enter. La fletxa blava del costat del requadre fa el mateix; Shift i Enter, en canvi, fan una línia nova.',
  'help.guide.trip-chat.step.2':
    'El smiley obre el selector d’emojis, amb Smileys, Reactions i Travel a dins. El que tries s’afegeix al que estàs escrivint, no s’envia tot sol.',
  'help.guide.trip-chat.step.3':
    'Passa el ratolí per sobre del missatge d’una altra persona: a la seva cantonada apareix un botó rodó petit. Aquest és Respon.',
  'help.guide.trip-chat.step.4':
    'El missatge que respons queda citat sobre el requadre. Escriu i envia, i la citació viatja dins la teva bombolla; la creu de la citació la deixa anar.',
  'help.guide.trip-chat.step.5':
    'Fes clic dret en un missatge per a les vuit reaccions ràpides. La teva es posa sota la bombolla, i un segon clic a la mateixa la retira.',
  'help.guide.trip-chat.step.6':
    'Els teus missatges porten Eliminar al costat de Respon. Treu el missatge i deixa una línia que diu que l’has eliminat: no hi ha marxa enrere.',
  'help.guide.trip-chat.result':
    'La teva resposta és sota el missatge que cita, una reacció penja d’un tercer, i el que has retirat deixa una sola línia que ho diu.',
  'help.guide.trip-chat.tip.1':
    'Enter envia, Shift i Enter fan una línia nova. Un missatge que només són emojis es mostra gros.',
  'help.guide.trip-chat.tip.2':
    'Adjunta imatges pren fins a quatre imatges per a un missatge; també es poden enganxar o deixar caure al requadre.',
  'help.guide.trip-chat.tip.3':
    'Un missatge amb un enllaç a dins rep a sota una targeta de vista prèvia, agafada pel teu propi TREK, per això un enllaç a una cosa a la qual només tu pots arribar es queda en un enllaç simple.',
  'help.guide.trip-chat.tip.4':
    'Xat és un interruptor propi a Complements, sota Col·laboració: un administrador el pot apagar i deixar funcionant les Notes, els Enllaços, les Enquestes i Què ve després.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Llistes',
  'help.ctx.trip-lists.summary':
    'Dues llistes per a un viatge: la llista d’equipatge, amb qui porta què i quant pesa, i la llista de tot el que ha de passar abans i durant. La pestanya hi és mentre l’addon Llistes està actiu.',
  'help.ctx.trip-lists.bullet.1':
    'Llista d’equipatge i Pendents, a dalt, canvien entre les dues i compten què hi ha a cadascuna; els botons de la dreta pertanyen a la que està oberta.',
  'help.ctx.trip-lists.bullet.2':
    'La llista d’equipatge està agrupada en llistes, Documents, Roba, com les vulguis anomenar, cadascuna amb un punt de color, un comptador de preparats sobre el total i tres punts amb Canvia el nom, Marca-ho tot, Desmarca-ho tot i Elimina la categoria. Afegeix una categoria, a la barra de sobre, en crea una de nova.',
  'help.ctx.trip-lists.bullet.3':
    'Una fila és una casella i un nom, després, com a petites insígnies, qui porta l’article, la quantitat i el pes en grams, i un cercle d’equipatge mentre Seguiment d’equipatge està actiu, i després la paperera i tres punts amb Canvia la categoria, Compartir, Canviar nom i Eliminar. El que una fila no fa servir queda atenuat fins que hi passes el ratolí per sobre, i la nansa de l’esquerra la puja o la baixa dins de la seva llista.',
  'help.ctx.trip-lists.bullet.4':
    'Compartit i La meva llista parteixen la llista d’equipatge en dues: el fons comú que tothom veu, i la teva. Tot, Pendents i Fet estrenyen la que està oberta, i la barra de sobre compta què hi ha preparat.',
  'help.ctx.trip-lists.bullet.5':
    'Aplica una plantilla i Desa com a plantilla omplen o conserven una llista sense teclejar-la, i les dues icones del costat exporten la llista, com a impressió, PDF o fitxer, i n’importen una. El botó vermell al costat de la barra de progrés diu quants articles estan marcats i els retira.',
  'help.ctx.trip-lists.bullet.6':
    'Pendents té una barra lateral pròpia: la targeta de progrés, els filtres Tot, Les meves tasques, Vençuda i Fet, una fila per categoria i, a sota, Afegeix una categoria. Les tasques són en una targeta amb una capçalera que anomena el filtre i porta l’ordenació, Prioritat o Data límit. Un clic en una tasca l’obre al panell de la dreta, i Tasca nova obre el formulari Tasca nova sobre el mig de la pantalla.',
  // packing-categories
  'help.guide.packing-categories.title': 'Construir la llista d’equipatge',
  'help.guide.packing-categories.goal':
    'Agrupa en llistes el que t’emportes, omple-les d’articles i digues qui s’ocupa de cada llista.',
  'help.guide.packing-categories.step.1':
    'Fes clic a Afegeix una categoria a la barra que hi ha sobre les llistes, escriu el nom a Nom de la categoria (p. ex. Roba) i fes clic a Afegir.',
  'help.guide.packing-categories.step.2':
    'La llista nova comença amb una fila buida. Fes clic a Afegeix un article, escriu l’article a Nom de l’article... i prem Retorn; el camp es queda obert per al següent.',
  'help.guide.packing-categories.step.3':
    'Canvia el nom d’una fila fent clic al seu nom, o amb Canviar nom als tres punts del seu extrem dret.',
  'help.guide.packing-categories.step.4':
    'El cercle discontinu de la capçalera de la llista assigna membres del viatge a la llista. Tria un nom; l’etiqueta que apareix en treu aquella persona amb un clic.',
  'help.guide.packing-categories.step.5':
    'Els tres punts al final de la capçalera guarden la resta: Canvia el nom, Marca-ho tot, Desmarca-ho tot i Elimina la categoria, que s’emporta la llista i tot el que hi ha dins sense tornar a preguntar.',
  'help.guide.packing-categories.result':
    'La llista nova se situa a la graella amb els seus articles a sota i el seu punt de color, i el seu comptador compta el que ja està preparat.',
  'help.guide.packing-categories.tip.1':
    'Una llista només són els seus articles. Elimina l’últim i la fila es converteix en un marcador de posició perquè la llista conservi el seu lloc i el seu color; elimina també aquella fila i la llista desapareix.',
  'help.guide.packing-categories.tip.2':
    'Assignar algú a una llista li envia una notificació d’equipatge. No canvia qui pot veure els articles, això és Compartir, als tres punts d’una fila.',
  'help.guide.packing-categories.tip.3':
    'Dues llistes poden dur el mateix nom. TREK les distingeix internament, de manera que els noms queden tal com els has escrit.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Marcar mentre prepares l’equipatge',
  'help.guide.check-off-packing.goal': 'Marca el que ja és a la bossa, mira la barra i retira els articles preparats.',
  'help.guide.check-off-packing.step.1':
    'Fes clic a la casella de l’esquerra d’una fila. El nom queda ratllat i la barra es mou.',
  'help.guide.check-off-packing.step.2':
    'La barra de sobre compta el que està preparat contra tot el que hi ha a la llista, com a nombre i com a percentatge.',
  'help.guide.check-off-packing.step.3':
    'Una llista sencera de cop: els tres punts de la seva capçalera guarden Marca-ho tot i Desmarca-ho tot.',
  'help.guide.check-off-packing.step.4':
    'Tot, Pendents i Fet estrenyen la graella. Pendents deixa només el que encara falta, de manera que una llista del tot preparada en surt.',
  'help.guide.check-off-packing.step.5':
    'Elimina 3 marcats, al costat de la barra de progrés, esborra tots els articles marcats de cop, després d’una confirmació del navegador.',
  'help.guide.check-off-packing.result':
    'Només surt el que encara és obert, i la barra de sobre diu per on va la preparació.',
  'help.guide.check-off-packing.tip.1': 'Un article marcat encara es pot reanomenar: fes clic al seu nom.',
  'help.guide.check-off-packing.tip.2':
    'Marca-ho tot i Desmarca-ho tot actuen sobre una llista cada vegada, des dels tres punts d’aquella llista.',
  'help.guide.check-off-packing.tip.3':
    'Quan tots els articles estan marcats, Tot preparat! substitueix el comptador i la barra es posa verda.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Aplicar una plantilla d’equipatge',
  'help.guide.apply-packing-template.goal':
    'Porta una llista ja feta al viatge, i conserva la llista d’aquest viatge per al següent.',
  'help.guide.apply-packing-template.step.1': 'Fes clic a Aplica una plantilla a la barra de sobre la llista.',
  'help.guide.apply-packing-template.step.2': 'Tria una plantilla. Cada línia la nomena i diu quants articles conté.',
  'help.guide.apply-packing-template.step.3':
    'Els articles cauen a la vista on ets: Compartit els posa al fons comú que tothom veu, La meva llista els fa teus.',
  'help.guide.apply-packing-template.step.4':
    'Conservar la llista d’aquest viatge per al següent: Desa com a plantilla obre un diàleg, escriu un nom i fes clic a Desar.',
  'help.guide.apply-packing-template.result':
    'Les llistes i els articles de la plantilla són al viatge, al costat del que ja hi havia.',
  'help.guide.apply-packing-template.tip.1':
    'Una plantilla només porta noms i llistes. Les quantitats, els pesos, l’equipatge i el que ja està marcat es queden enrere.',
  'help.guide.apply-packing-template.tip.2':
    'Aplica una plantilla només hi és un cop existeix una plantilla. Sense cap, el botó no apareix gens.',
  'help.guide.apply-packing-template.tip.3':
    'Desa com a plantilla apareix només per a un administrador de la instància, i només mentre la llista té articles. Desa el fons comú més els teus propis articles, mai els privats d’un altre membre.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Enganxar una llista d’equipatge sencera',
  'help.guide.import-packing-list.goal':
    'Converteix d’una sola vegada una llista que ja tens en un altre lloc en articles d’equipatge.',
  'help.guide.import-packing-list.step.1':
    'Fes clic al botó d’importar amb la fletxa cap avall a la barra de sobre la llista.',
  'help.guide.import-packing-list.step.2':
    'Un article per línia: Categoria, Nom, Pes en g (opcional), Equipatge (opcional), checked/unchecked (opcional). L’exemple gris del quadre mostra les quatre formes. També funciona una llista en Markdown: un títol dona nom a la llista, i "- [ ]" i "- [x]" es converteixen en articles.',
  'help.guide.import-packing-list.step.3':
    'O carrega les línies d’un fitxer amb Carrega CSV/TXT/MD. Accepta un .csv, un .txt o un .md i substitueix el que hi hagi al quadre.',
  'help.guide.import-packing-list.step.4': 'Fes clic a Importa. El botó compta les línies que ha entès.',
  'help.guide.import-packing-list.result':
    'Cada línia és una fila, a la llista que nomena el seu primer camp, i res del que ja hi havia no es toca.',
  'help.guide.import-packing-list.tip.1':
    'Les comes, els punts i comes i els tabuladors separen camps, i les cometes mantenen un camp sencer, de manera que «Camisa, blava» continua sent un sol nom. Una línia amb un sol valor és només un nom, una línia sense llista pròpia va a parar a Altres, i "3x" davant d’un nom en fixa la quantitat.',
  'help.guide.import-packing-list.tip.2':
    'Una peça d’equipatge anomenada al quart camp es crea si el viatge encara no la té. Aquest és l’únic lloc que carrega pesos i equipatge en bloc; una plantilla només porta noms i llistes.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Imprimir o exportar la llista d’equipatge',
  'help.guide.export-packing-list.goal':
    'Emporta’t la llista en paper, en PDF o com a fitxer per a una altra aplicació o per al proper viatge.',
  'help.guide.export-packing-list.step.1':
    'Fes clic al botó d’exportar amb la fletxa cap amunt a la barra de sobre la llista.',
  'help.guide.export-packing-list.step.2':
    'Llista de comprovació en Markdown (.md) i CSV per importar (.csv) desen la llista com a fitxer de seguida.',
  'help.guide.export-packing-list.step.3':
    'Fes clic a Imprimeix o desa com a PDF. La previsualització mostra la llista com una pàgina: el viatge i les seves dates a dalt, i després cada llista com una targeta amb una casella per marcar.',
  'help.guide.export-packing-list.step.4':
    'Fes clic a Imprimeix o desa com a PDF sota la previsualització. El navegador obre el seu diàleg d’impressió: tria una impressora, o Desa com a PDF per quedar-te un fitxer.',
  'help.guide.export-packing-list.result':
    'La impressió i els fitxers recullen la vista que està oberta, Compartit o La meva llista, amb les quantitats, els pesos i les marques.',
  'help.guide.export-packing-list.tip.1':
    'El CSV és el format que llegeix Importa, equipatge inclòs, així que serveix com a plantilla d’equipatge pròpia: importa’l al proper viatge.',
  'help.guide.export-packing-list.tip.2':
    'El fitxer Markdown s’obre com a llista de comprovació a Obsidian, Notion o GitHub, i torna a entrar igual per Importa.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Decidir qui veu un article i qui el porta',
  'help.guide.share-packing-item.goal':
    'Mou un article entre el fons comú del grup, la teva pròpia llista i les persones per a qui el portes.',
  'help.guide.share-packing-item.step.1':
    'Compartit, sobre les llistes, és el fons comú que tothom veu, La meva llista és la teva, i cadascuna compta el que conté. Fes clic a La meva llista per mirar la teva.',
  'help.guide.share-packing-item.step.2':
    'De tornada a Compartit, obre els tres punts del final d’una fila i fes clic a Compartir.',
  'help.guide.share-packing-item.step.3':
    'Tres nivells: Compartit, al fons comú del grup i visible per a tothom; Personal, que només tu pots veure; i Compartit amb…, on tries les persones que l’article cobreix.',
  'help.guide.share-packing-item.step.4':
    'Un article Personal només és a La meva llista. Canvia de vista per trobar-lo.',
  'help.guide.share-packing-item.step.5':
    'Obre Compartir un altre cop i marca un nom sota Compartit amb…. L’article surt també a la llista d’aquella persona, i la fila rep una petita insígnia que compta les persones amb qui es comparteix.',
  'help.guide.share-packing-item.result': 'L’article es col·loca al nivell que has triat, i la fila diu qui el porta.',
  'help.guide.share-packing-item.tip.1':
    'Només qui porta un article en canvia la manera de compartir-lo. Aquell amb qui l’has compartit el veu a la seva pròpia La meva llista, marcat amb el teu nom, i el pot marcar.',
  'help.guide.share-packing-item.tip.2':
    'En un article que porta una altra persona obtens dos botons diferents: Jo també puc portar això, que t’afegeix al seu costat, i Copiar a la meva llista, que en fa una còpia privada teva.',
  'help.guide.share-packing-item.tip.3':
    'Els articles nous hereten la vista on els afegeixes. Afegits a La meva llista són Personal, afegits a Compartit van al fons comú.',
  // packing-bags
  'help.guide.packing-bags.title': 'Pesar l’equipatge',
  'help.guide.packing-bags.goal':
    'Posa un pes a cada article, reparteix els articles a les peces d’equipatge i mantén cadascuna per sota del límit de la companyia aèria.',
  'help.guide.packing-bags.step.1':
    'Fes clic a la insígnia de pes anterior al cercle i escriu el pes de l’article en grams.',
  'help.guide.packing-bags.step.2': 'El cercle del final de la fila és la seva peça d’equipatge. Fes-hi clic.',
  'help.guide.packing-bags.step.3':
    'Encara sense equipatge: Afegeix equipatge, un nom, Retorn. La peça es crea i l’article hi entra directament.',
  'help.guide.packing-bags.step.4':
    'El panell Equipatge apareix a la dreta tan bon punt existeix una peça: nom, pes, una barra d’ompliment, qui la porta i quants articles hi ha a dins, i després Sense assignar i Pes total.',
  'help.guide.packing-bags.step.5':
    'Fes clic a Defineix un límit i escriu el límit en quilograms, tal com l’indiquen les companyies aèries.',
  'help.guide.packing-bags.step.6': 'El signe més discontinu al costat del nom d’una peça diu qui la porta.',
  'help.guide.packing-bags.result':
    'El panell Equipatge de la dreta mostra el pes de cada peça contra el seu límit, el que no és a cap peça, i el total.',
  'help.guide.packing-bags.tip.1':
    'El camp de pes, el cercle d’equipatge i el panell Equipatge només existeixen mentre un administrador té Seguiment d’equipatge activat sota l’addon Llistes.',
  'help.guide.packing-bags.tip.2':
    'El pes d’una peça se suma al servidor sobre els articles de tots els membres, inclosos els que tu no pots veure, de manera que el nombre és realment el que pesa la peça.',
  'help.guide.packing-bags.tip.3':
    'Una peça sense límit es dibuixa contra la més pesada, perquè les barres continuïn sent comparables. Dona-li un límit i la barra es llegeix contra aquest.',
  // create-todo
  'help.guide.create-todo.title': 'Afegir una tasca',
  'help.guide.create-todo.goal':
    'Apunta alguna cosa que ha de passar, amb una categoria, una prioritat, una data i un nom al costat.',
  'help.guide.create-todo.step.1': 'Fes clic a Tasca nova, a dalt a la dreta.',
  'help.guide.create-todo.step.2':
    'Posa-li nom a Nom de la tasca, i escriu sota Descripció tot el que valgui la pena recordar.',
  'help.guide.create-todo.step.3':
    'Categoria agrupa la tasca. Tria’n una, o fes servir el signe més del costat per posar nom a una de nova en un petit diàleg.',
  'help.guide.create-todo.step.4': 'Prioritat són quatre botons: Cap, P1, P2 i P3, del vermell al blau.',
  'help.guide.create-todo.step.5': 'Data límit obre un calendari, i Assignada a posa un nom a la tasca.',
  'help.guide.create-todo.step.6': 'Fes clic a Crea una tasca.',
  'help.guide.create-todo.result':
    'La tasca és a la llista amb els seus distintius, la prioritat, la data límit, la categoria i la persona a qui està assignada, i s’obre al panell de la dreta.',
  'help.guide.create-todo.tip.1':
    'Només el nom és obligatori. Tota la resta es pot omplir més tard des del panell de la dreta.',
  'help.guide.create-todo.tip.2':
    'Amb una categoria seleccionada a la barra lateral, una tasca nova comença en aquella categoria.',
  'help.guide.create-todo.tip.3': 'Retorn al camp del nom crea la tasca de seguida, sense tocar els altres camps.',
  // todo-filters
  'help.guide.todo-filters.title': 'Trobar i canviar una tasca',
  'help.guide.todo-filters.goal':
    'Retalla la llista de tasques fins al que importa ara, i després edita la tasca on has anat a parar.',
  'help.guide.todo-filters.step.1':
    'Tasques a la barra lateral: Tot és tot el que encara és obert, Les meves tasques el que et toca a tu, Vençuda el que té una data passada, Fet el que està acabat. Cadascun porta el seu recompte; fes clic a Vençuda.',
  'help.guide.todo-filters.step.2':
    'Sota Categories hi ha una fila per categoria. Triar-ne una mostra aquella categoria, tasques acabades incloses.',
  'help.guide.todo-filters.step.3':
    'L’ordenació a la capçalera de la llista reordena el que hi ha a la pantalla: Prioritat posa P1 primer, Data límit posa el termini més proper primer. Només un dels dos alhora, i un segon clic torna al teu propi ordre.',
  'help.guide.todo-filters.step.4': 'Fes clic en una tasca per obrir-la al panell de la dreta.',
  'help.guide.todo-filters.step.5':
    'Canvia el que et calgui, Descripció, Prioritat, Categoria, Data límit o Assignada a, i després Desa els canvis. La casella de la capçalera del panell marca la tasca com a feta, i Elimina se l’emporta a l’instant.',
  'help.guide.todo-filters.result':
    'La llista mostra només les tasques que has demanat, i el panell de la dreta edita la que has triat.',
  'help.guide.todo-filters.tip.1':
    'Una fila de categoria compta només el que encara és obert, però seleccionar-la mostra també les tasques acabades. Tot, Les meves tasques i Vençuda amaguen el que està fet; Fet no mostra res més.',
  'help.guide.todo-filters.tip.2':
    'Prioritat i Data límit a l’ordenació s’exclouen, i mentre un dels dos està actiu les files ja no es poden arrossegar a un ordre propi.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Reserves',
  'help.ctx.trip-bookings.summary':
    'La pestanya que guarda tot el que s’ha reservat per al viatge i no és una manera de desplaçar-se: els allotjaments, les taules, les entrades, les excursions, els aparcaments. Cada reserva és una targeta a Pendent o a Confirmada, amb el seu codi, el seu document, els seus viatgers i el seu cost.',
  'help.ctx.trip-bookings.bullet.1':
    'Reserva manual, a dalt a la dreta, obre el formulari. Els sis tipus que crea són Allotjament, Restaurant, Esdeveniment, Excursió, Aparcament i Altres; els vols, els trens i la resta viuen a la pestanya Transports i aquí no apareixen mai.',
  'help.ctx.trip-bookings.bullet.2':
    'Importa des d’un fitxer lliura una confirmació a l’anàlisi: EML, PDF, PKPass, HTML o TXT, com a màxim cinc fitxers de 10 MB. El botó només hi és si el servidor els sap llegir.',
  'help.ctx.trip-bookings.bullet.3':
    'Els xips al costat del títol filtren per tipus, cadascun amb el seu propi recompte, i Tot ho torna a portar tot. Un cop una reserva anomena persones, la filera d’avatars al costat dels xips estreny la pestanya a una d’elles.',
  'help.ctx.trip-bookings.bullet.4':
    'Les targetes estan en dues seccions, Pendent i Confirmada, cadascuna amb el seu recompte. Un clic al títol d’una secció la plega, i si està oberta es recorda per a aquest viatge.',
  'help.ctx.trip-bookings.bullet.5':
    'Una targeta porta el punt d’estat, el tipus, el títol, les dates i les hores, el Codi de reserva, la Ubicació / adreça, allò a què la reserva està vinculada, el seu Enllaç, les Notes, els Fitxers i els Viatgers.',
  'help.ctx.trip-bookings.bullet.6':
    'El llapis d’una targeta torna a obrir el mateix formulari; la paperera pregunta un cop i llavors la reserva ja no hi és. Amb un allotjament, les seves nits al Pla per dies i la seva despesa vinculada se’n van amb ella.',
  // create-booking
  'help.guide.create-booking.title': 'Crear una reserva',
  'help.guide.create-booking.goal':
    'Posa a mà al viatge un restaurant, un esdeveniment, una excursió, una plaça d’aparcament o qualsevol altra cosa.',
  'help.guide.create-booking.step.1':
    'Fes clic a Reserva manual, a dalt a la dreta de la pestanya. S’obre Reserva nova.',
  'help.guide.create-booking.step.2':
    'Tria el Tipus de reserva a la llista de dalt del formulari, al costat de Viatgers. Allotjament, Restaurant, Esdeveniment, Excursió, Aparcament i Altres són els sis que fa aquesta pestanya, i el formulari canvia amb la tria: només Allotjament bescanvia les dates per un interval de dies.',
  'help.guide.create-booking.step.3':
    'Escriu el Títol. És l’únic camp en què el formulari insisteix, i Afegir es queda mort fins que hi hagi alguna cosa.',
  'help.guide.create-booking.step.4':
    'Posa Data i Hora d’inici, i Data de fi i Hora de fi si la reserva té un final. Els calendaris només ofereixen dies de dins del viatge, i un final que no és posterior a l’inici ho diu en vermell i bloqueja Afegir.',
  'help.guide.create-booking.step.5':
    'Posa el Codi de reserva de la confirmació i posa l’Estat. Pendent o Confirmada decideix a quina de les dues seccions aterra la targeta.',
  'help.guide.create-booking.step.6': 'Fes clic a Afegir.',
  'help.guide.create-booking.result':
    'La reserva és una targeta a la seva secció, amb el seu xip de tipus, les seves dates i el seu codi, i tothom més del viatge la veu aparèixer.',
  'help.guide.create-booking.tip.1':
    'Ubicació / adreça ofereix adreces reals mentre escrius; triar-ne una substitueix el que havies escrit, i una adreça escrita per tu es queda tal com és.',
  'help.guide.create-booking.tip.2':
    'Enllaç recull la pàgina pròpia de la reserva al proveïdor. La targeta en fa un enllaç que s’obre en una pestanya nova.',
  'help.guide.create-booking.tip.3':
    'Les Notes són Markdown, així que una llista o una línia en negreta es mostren com a tals a la targeta.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Reservar un allotjament',
  'help.guide.booking-hotel.goal':
    'Introdueix un allotjament perquè compti alhora com a reserva i com a nits al Pla per dies.',
  'help.guide.booking-hotel.step.1':
    'Fes clic a Reserva manual i tria Allotjament. Els camps de data se’n van i un bloc de camps d’hotel ocupa el seu lloc.',
  'help.guide.booking-hotel.step.2':
    'Tria l’hotel sota Allotjament. La llista són els llocs propis del viatge, i triar-ne un escriu el seu nom a Títol i la seva adreça a Ubicació / adreça.',
  'help.guide.booking-hotel.step.3':
    'Posa Des del i Fins al: la primera nit i el matí que marxes. Tots dos ofereixen els dies del viatge amb les seves dates, i es mantenen en ordre l’un a l’altre.',
  'help.guide.booking-hotel.step.4':
    'Omple Registre d’entrada, Registre fins a i Registre de sortida, i el Codi de reserva de la confirmació.',
  'help.guide.booking-hotel.step.5': 'Fes clic a Afegir.',
  'help.guide.booking-hotel.result':
    'La targeta porta un interval de dies en comptes d’una data, amb les hores d’entrada i de sortida i l’adreça, i la mateixa estada ara seu en aquells dies del pla.',
  'help.guide.booking-hotel.tip.1':
    'Allotjament és l’únic tipus sense Data ni Hora d’inici. Les seves dates són Des del i Fins al, i són dies del viatge en lloc d’un calendari.',
  'help.guide.booking-hotel.tip.2':
    'Deixa Allotjament buit i escriu l’adreça al seu lloc: el lloc es cerca, es crea i es marca al mapa per tu.',
  'help.guide.booking-hotel.tip.3': 'Eliminar la reserva s’emporta les nits del Pla per dies amb ella.',
  // link-booking
  'help.guide.link-booking.title': 'Lligar una reserva al pla',
  'help.guide.link-booking.goal':
    'Penja una reserva de la parada i del lloc als quals pertany, perquè aparegui allà on la voldràs.',
  'help.guide.link-booking.step.1': 'Fes clic al llapis de la targeta que vols vincular. S’obre Edita la reserva.',
  'help.guide.link-booking.step.2':
    'Obre Vincula a una assignació del dia. La llista és el teu pla: un títol per dia, després les parades d’aquell dia, numerades i amb les seves hores. Tria aquella a la qual pertany la reserva.',
  'help.guide.link-booking.step.3':
    'Lloc / Activitat vincula el lloc mateix. Tria’l allà, i Títol i Ubicació / adreça s’omplen allà on els havies deixat buits.',
  'help.guide.link-booking.step.4': 'Fes clic a Actualitzar.',
  'help.guide.link-booking.result':
    'La targeta anomena el dia i la parada sota Vincula a una assignació del dia, i la reserva viatja amb aquella parada al Pla per dies.',
  'help.guide.link-booking.tip.1':
    'Sense vincle (independent), a dalt de la llista, torna a treure el vincle. Allotjament no té cap selector de parada: es vincula a través de les seves nits.',
  'help.guide.link-booking.tip.2':
    'Triar una parada en un dia amb data omple una Data buida per tu. Una data que ja havies posat es deixa estar.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Dir per a qui és una reserva',
  'help.guide.booking-travelers.goal': 'Marca els viatgers que cobreix una reserva i després mira només les seves.',
  'help.guide.booking-travelers.step.1':
    'Obre la reserva amb el llapis. Viatgers és a dalt del formulari, al costat de Tipus de reserva, i diu Assigna viatgers mentre no hi ha ningú a la reserva.',
  'help.guide.booking-travelers.step.2':
    'Fes-hi clic i tria les persones per a qui és aquesta reserva; els convidats amb nom també són a la llista. La que tries rep una marca i el seu avatar al camp. Torna a fer clic al nom per treure-la.',
  'help.guide.booking-travelers.step.3': 'Fes clic a Actualitzar.',
  'help.guide.booking-travelers.step.4':
    'A dalt, a la barra d’eines, al costat dels xips de tipus, fes clic a l’avatar d’un viatger per veure només les seves reserves.',
  'help.guide.booking-travelers.result':
    'La targeta llista les persones per a qui és, i la filera d’avatars estreny la pestanya a una d’elles.',
  'help.guide.booking-travelers.tip.1':
    'A la targeta els viatgers només es mostren, mai no es canvien. Es posen aquí, al formulari.',
  'help.guide.booking-travelers.tip.2':
    'La filera d’avatars apareix un cop el viatge té més d’un membre i almenys una reserva anomena algú. El que tries dura aquesta sessió del navegador.',
  // booking-files
  'help.guide.booking-files.title': 'Guardar el comprovant amb la reserva',
  'help.guide.booking-files.goal': 'Adjunta la confirmació, el bitllet o el passi a la reserva a la qual pertanyen.',
  'help.guide.booking-files.step.1':
    'Obre la reserva amb el llapis, baixa fins a Fitxers i fes clic a Adjunta un fitxer. En una reserva que ja existeix el document puja de seguida i TREK diu Fitxer pujat.',
  'help.guide.booking-files.step.2': 'El document apareix amb el seu nom, amb un botó per obrir-lo i una X al costat.',
  'help.guide.booking-files.step.3':
    'Vincula un fitxer existent ofereix els documents del viatge que encara no són en aquesta reserva. Tria’n un i s’adjunta sense tornar a pujar res.',
  'help.guide.booking-files.step.4': 'Fes clic a Actualitzar.',
  'help.guide.booking-files.result': 'La targeta llista els documents sota Fitxers, i un clic en un d’ells l’obre.',
  'help.guide.booking-files.tip.1':
    'En una reserva que encara estàs creant el document espera i puja en el moment que fas clic a Afegir.',
  'help.guide.booking-files.tip.2':
    'La X al costat d’un document treu el vincle, no el document. Es queda a la pestanya Fitxers del viatge.',
  'help.guide.booking-files.tip.3':
    'Quins tipus de fitxer es poden adjuntar és la llista Tipus de fitxer permesos de l’administrador; els documents, el text i les imatges estan permesos de sèrie.',
  // booking-cost
  'help.guide.booking-cost.title': 'Convertir el preu d’una reserva en un cost',
  'help.guide.booking-cost.goal':
    'Porta el que costa una reserva a les Despeses, repartit entre les persones que ho paguen.',
  'help.guide.booking-cost.step.1':
    'Obre la reserva i vés al peu del formulari. Sota Despeses hi ha Crear despesa i Vincular despesa existent, amb la nota Desa la reserva i obre l’editor de Despeses.',
  'help.guide.booking-cost.step.2':
    'Fes clic a Crear despesa. La reserva es desa, el seu formulari es tanca i l’editor de Despeses s’obre.',
  'help.guide.booking-cost.step.3':
    'Per a què ha estat? ja és el títol de la reserva. Posa l’Import total i comprova la Divisa i el Dia.',
  'help.guide.booking-cost.step.4':
    'Categoria és la que implica el tipus de reserva. Posa Qui ha pagat? i com es reparteix l’import.',
  'help.guide.booking-cost.step.5': 'Fes clic a Afegir despesa.',
  'help.guide.booking-cost.result':
    'El formulari de la reserva ara mostra la despesa sota Despeses vinculades amb el seu import, i la mateixa despesa és a la pestanya Despeses, lligada a aquesta reserva.',
  'help.guide.booking-cost.tip.1':
    'La categoria segueix el tipus: Restaurant passa a Menjar i beguda, Allotjament passa a Allotjament, Aparcament passa a Aparcament, i Esdeveniment i Excursió cauen tots dos a Altres.',
  'help.guide.booking-cost.tip.2':
    'Una reserva pot portar diverses despeses. Vincular despesa existent ofereix les de Despeses que encara no pertanyen a res. En una de vinculada, Desvincular, conservar la despesa la deixa anar i la manté a Despeses, mentre que la paperera la treu.',
  'help.guide.booking-cost.tip.3':
    'Despeses només és al formulari mentre l’addon Pressupost està activat, que l’administrador engega a Complements.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Trobar una reserva',
  'help.guide.filter-bookings.goal': 'Redueix una pestanya llarga al tipus, a la persona o a l’estat que busques.',
  'help.guide.filter-bookings.step.1':
    'Els xips al costat del títol són els tipus que aquest viatge fa servir de debò, cadascun amb el nombre que conté. Tot és la pestanya sencera.',
  'help.guide.filter-bookings.step.2':
    'Fes clic a un xip per quedar-te només amb aquell tipus. Fes clic a un segon i tots dos es mantenen.',
  'help.guide.filter-bookings.step.3': 'Tot ho torna a posar tot.',
  'help.guide.filter-bookings.step.4':
    'Els avatars al costat dels xips filtren per viatger, una persona o diverses alhora.',
  'help.guide.filter-bookings.step.5':
    'Pendent i Confirmada són les dues seccions, cadascuna amb el seu recompte. Fes clic a un títol per plegar-ne una; encara està plegada quan tornes.',
  'help.guide.filter-bookings.result':
    'La pestanya mostra només el que has triat, i encara està triat quan hi tornes en aquesta sessió del navegador.',
  'help.guide.filter-bookings.tip.1':
    'Els xips només ofereixen els tipus que el viatge té, així que un viatge sense ni una sola excursió no té xip Excursió.',
  'help.guide.filter-bookings.tip.2':
    'Un filtre que no coincideix amb res deixa la pestanya buida amb No s’han trobat llocs. La redacció és la de la llista de llocs; el sentit és el mateix.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Llegir una reserva de la seva confirmació',
  'help.guide.import-booking-file.goal':
    'Deixa que TREK tregui la reserva del correu o del PDF que ha enviat el proveïdor, en lloc de tornar-la a escriure.',
  'help.guide.import-booking-file.step.1':
    'Fes clic a Importa des d’un fitxer a la barra d’eines. S’obre Importa confirmacions de reserva.',
  'help.guide.import-booking-file.step.2':
    'Deixa anar les confirmacions sobre la caixa, o fes-hi clic i tria-les: EML, PDF, PKPass, HTML i TXT, fins a cinc fitxers de 10 MB cadascun. Les que has triat surten amb el seu nom a la caixa.',
  'help.guide.import-booking-file.step.3':
    'Fes clic a Importar. El diàleg es tanca de seguida, perquè la lectura passa en segon pla.',
  'help.guide.import-booking-file.step.4':
    'Una targeta a baix a la dreta informa de l’execució sota el nom del fitxer, i et segueix per l’aplicació i a través d’una recàrrega. Analitzant els fitxers… es converteix en un tic quan la lectura ha acabat, i la targeta ofereix Importar. Fes-hi clic.',
  'help.guide.import-booking-file.result':
    'La reserva és una targeta a Pendent amb les seves nits, el seu codi i la confirmació sota Fitxers, l’estada és en aquells dies del pla, i amb Despeses activat el preu és una despesa lligada a ella.',
  'help.guide.import-booking-file.tip.1':
    'Importa des d’un fitxer només hi és si el servidor sap llegir confirmacions, i això demana o bé l’extractor o bé l’addon Anàlisi amb IA. Aquest l’administrador l’engega a Complements.',
  'help.guide.import-booking-file.tip.2':
    'Si no s’ha pogut llegir res, la targeta ho diu i ofereix Provar l’anàlisi per IA, que envia els mateixos fitxers directament al model. Una anàlisi acabada es guarda deu minuts; engega la revisió dins d’aquest marge.',
  'help.guide.import-booking-file.tip.3':
    'La confirmació només s’adjunta quan el seu tipus és als Tipus de fitxer permesos de la configuració d’administració. PDF hi és d’entrada; un correu, EML, s’ha d’afegir primer, o la reserva es desa sense.',
  // edit-booking
  'help.guide.edit-booking.title': 'Canviar una reserva',
  'help.guide.edit-booking.goal':
    'Corregeix una hora, afegeix el codi que ha arribat més tard, o passa una reserva de Pendent a Confirmada.',
  'help.guide.edit-booking.step.1':
    'Fes clic al llapis de la capçalera de la targeta. Edita la reserva s’obre amb tot el que la reserva sap.',
  'help.guide.edit-booking.step.2':
    'Canvia el que calgui canviar, aquí el Codi de reserva que l’operador ha acabat enviant.',
  'help.guide.edit-booking.step.3': 'Posa Estat a Confirmada.',
  'help.guide.edit-booking.step.4': 'Fes clic a Actualitzar.',
  'help.guide.edit-booking.result':
    'La targeta es mou: una reserva confirmada és a la secció Confirmada darrere d’un punt verd, i tothom del viatge la veu moure’s.',
  'help.guide.edit-booking.tip.1':
    'Un Codi de reserva que no pots llegir és Difumina els codis de reserva a la Configuració, sota Pantalla. Passa-hi el ratolí per sobre, o fes-hi clic, i es torna llegible.',
  'help.guide.edit-booking.tip.2':
    'Canvia el tipus i la categoria d’una despesa vinculada el segueix, tret que haguessis triat una categoria a mà a l’editor de Despeses.',
  'help.guide.edit-booking.tip.3':
    'Un allotjament també s’edita aquí: els seus dies Des del i Fins al són al mateix formulari.',
  // delete-booking
  'help.guide.delete-booking.title': 'Eliminar una reserva',
  'help.guide.delete-booking.goal': 'Treu del viatge una reserva que ha fallat.',
  'help.guide.delete-booking.step.1': 'Fes clic a la paperera de la capçalera de la targeta.',
  'help.guide.delete-booking.step.2':
    'Vols eliminar la reserva? anomena la que has triat i diu que s’eliminarà permanentment.',
  'help.guide.delete-booking.step.3': 'Fes clic a Confirmar.',
  'help.guide.delete-booking.result':
    'La targeta ja no hi és, per a tothom del viatge. Una reserva no té desfer, així que la pregunta és l’última parada.',
  'help.guide.delete-booking.tip.1':
    'Eliminar una reserva d’allotjament també treu les seves nits del Pla per dies i elimina la despesa que hi estava vinculada.',
  'help.guide.delete-booking.tip.2':
    'Els documents que hi havia adjunts es queden a la pestanya Fitxers del viatge; només se’n va el seu vincle amb la reserva.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Cada reserva trobada s’obre a Reserva nova, l’una darrere l’altra, ja omplerta. Per a un hotel, això és el nom a Títol i, quan el viatge té el lloc, sota Allotjament, la seva Ubicació / adreça, Des del i Fins al a les seves nits, Registre d’entrada i Registre de sortida, el Codi de reserva, la confirmació sota Fitxers i, amb Despeses activat, el preu com a Despesa vinculada. Comprova-ho i fes clic a Afegir.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Despeses',
  'help.ctx.trip-costs.summary':
    'Els diners del viatge: cada despesa en un registre amb data, qui la va avançar i qui la deu, en la divisa en què era el rebut, i, a la columna de la dreta, qui ha de pagar a qui perquè torni a quadrar.',
  'help.ctx.trip-costs.bullet.1':
    'Quatre targetes a dalt: Deus i Et deuen són el teu propi costat de la liquidació, Import pendent és el que està registrat però encara no té pagador, i Despesa total del viatge ho suma tot, amb La teva part i Vas pagar tu a sota.',
  'help.ctx.trip-costs.bullet.2':
    'Afegir despesa, a dalt a la dreta, obre l’editor; Liquidar comptes, al costat, registra de cop totes les transferències obertes.',
  'help.ctx.trip-costs.bullet.3':
    'El registre està agrupat per dies, el més recent primer, amb el total d’aquell dia a la dreta. Una fila porta la categoria com a pestanya de color, el nom, les fitxes dels pagadors, la nota i l’import, més has prestat o has manllevat quan el repartiment et deixa a favor o en contra en aquella despesa.',
  'help.ctx.trip-costs.bullet.4':
    'Sobre la llista hi ha Cercar despeses…, un filtre de categoria, un filtre de dia, el selector Tot / Pagat per mi / Em deuen i el botó Exporta CSV.',
  'help.ctx.trip-costs.bullet.5':
    'La columna de la dreta és la resposta: Liquidar comptes llista qui paga a qui, Balanços mostra el superàvit o el dèficit de cada viatger, Pressupost final el que el viatge costa a cadascun d’ells, i Per categoria on han anat els diners.',
  'help.ctx.trip-costs.bullet.6':
    'Un pagament registrat és al mateix registre com a fila pròpia, amb Editar i Desfer al costat; una despesa té un llapis i una paperera, i la paperera l’elimina sense preguntar.',
  // add-expense
  'help.guide.add-expense.title': 'Afegir una despesa',
  'help.guide.add-expense.goal': 'Registra el que ha costat alguna cosa, qui ho ha pagat i amb qui es reparteix.',
  'help.guide.add-expense.step.1':
    'Fes clic a Afegir despesa, a dalt a la dreta de la pestanya Despeses. L’editor s’obre, amb la data d’avui i amb tothom ja al repartiment.',
  'help.guide.add-expense.step.2':
    'Escriu per a què ha estat a Per a què ha estat?, l’únic camp que s’ha d’omplir, i la xifra del rebut a Import total.',
  'help.guide.add-expense.step.3':
    'Divisa i Dia són sota l’import. Divisa comença en la del viatge; canvia-la i l’editor mostra el que val l’import en la divisa del viatge. Dia comença en avui i és el dia sota el qual el registre agrupa la despesa.',
  'help.guide.add-expense.step.4':
    'Tria una Categoria. N’hi ha catorze i no es poden canviar: la que triïs és la pestanya de color de la fila i la barra a Per categoria.',
  'help.guide.add-expense.step.5':
    'A Qui ha pagat?, tria la persona que realment va avançar els diners. Tu ve preseleccionat; Ningú ha pagat encara registra l’import sense que ningú el degui, i Han pagat diverses persones reparteix el compte entre diversos pagadors.',
  'help.guide.add-expense.step.6':
    'Dividir comença a A parts iguals amb tothom inclòs, i al costat de cada nom hi ha la part que en surt. Fes clic a Afegir despesa per desar.',
  'help.guide.add-expense.result':
    'La despesa és al registre sota el seu dia, comptada a Despesa total del viatge, i la columna de liquidació ha tornat a calcular qui deu a qui.',
  'help.guide.add-expense.tip.1':
    'Tal com s’obre, la despesa és en la divisa del viatge, amb la data d’avui i repartida a parts iguals entre tothom: només el nom i l’import s’han d’omplir de debò.',
  'help.guide.add-expense.tip.2':
    'El ± al costat de l’import converteix la despesa en una devolució. Un total negatiu retorna diners en lloc de prendre’ls, i el repartiment va a la inversa.',
  'help.guide.add-expense.tip.3':
    'Adjuntar rebut / factura, a baix, accepta imatges i PDF. Es pugen quan deses, van als Fitxers del viatge, i al costat del nom a la llista apareix una fitxa Rebuts.',
  // expense-payers
  'help.guide.expense-payers.title': 'Dir qui ha pagat el compte',
  'help.guide.expense-payers.goal':
    'Registra qui ha avançat els diners d’una despesa, l’altra meitat del càlcul de la liquidació.',
  'help.guide.expense-payers.step.1':
    'Obre una despesa amb el llapis del costat de la seva fila i mira Qui ha pagat?. Ha pagat una sola persona és l’opció per defecte: el desplegable anomena l’única persona que va avançar els diners.',
  'help.guide.expense-payers.step.2':
    'Ningú ha pagat encara, la primera entrada d’aquest desplegable, registra l’import sense que ningú degui res. La despesa compta igualment a Despesa total del viatge.',
  'help.guide.expense-payers.step.3':
    'Han pagat diverses persones, l’enllaç al costat de l’etiqueta, obre una fila per viatger. Inclou els qui han pagat i escriu el que ha posat cadascun; els imports han de sumar el total.',
  'help.guide.expense-payers.step.4':
    'Una despesa que ningú ha pagat es marca com a Sense finalitzar a la seva fila i es compta a la targeta Import pendent, on s’acumula la despesa registrada però no liquidada.',
  'help.guide.expense-payers.result':
    'Qui ha pagat decideix a qui se li torna, el repartiment decideix qui paga, i Balanços és la diferència entre tots dos.',
  'help.guide.expense-payers.tip.1':
    'Qui ha pagat? i Dividir són independents: pots pagar un sopar on no vas ser, i entrar al repartiment d’un que no vas pagar.',
  'help.guide.expense-payers.tip.2':
    'Amb diversos pagadors els imports han de sumar el total. Inclou-ne un més i els altres es reordenen al seu voltant; mentre no quadrin, l’editor diu quant han de sumar i es nega a desar.',
  'help.guide.expense-payers.tip.3':
    'Treure un pagador no treu la despesa: l’import continua a Despesa total del viatge i la fila passa a Sense finalitzar.',
  // split-expense
  'help.guide.split-expense.title': 'Repartir un compte entre els viatgers',
  'help.guide.split-expense.goal':
    'Decideix qui deu per una despesa: tothom a parts iguals, per import, o línia per línia del rebut.',
  'help.guide.split-expense.step.1':
    'A l’editor de la despesa, Dividir llista tots els viatgers. Fes clic a un nom per deixar-lo fora d’aquesta despesa; un viatger exclòs indica Exclòs i no deu res per ella.',
  'help.guide.split-expense.step.2':
    'A parts iguals és l’opció per defecte: cada viatger inclòs rep la mateixa part, i la línia de sota la llista diu entre quants es reparteix i a quant surt cada part.',
  'help.guide.split-expense.step.3':
    'Personalitzat canvia les parts per camps d’import. Escriu el que deu cada viatger; la línia de sota va comptant i es posa verda a El repartiment quadra amb el total. No es desa mentre no quadri.',
  'help.guide.split-expense.step.4':
    'Tiquet reparteix el rebut línia per línia: Afegeix un article, després un nom i un preu per línia, i sota Repartit entre: els viatgers que comparteixen aquella línia.',
  'help.guide.split-expense.step.5':
    'Part de cadascú, sota les línies, mostra el que acaba devent cada viatger, i Import total, a dalt, se suma a partir de les línies. Fes clic a Desar.',
  'help.guide.split-expense.result':
    'El repartiment és allò a partir del qual es construeix cada balanç. Es desa amb la despesa i es pot canviar més tard sense tocar res més.',
  'help.guide.split-expense.tip.1':
    'Un viatger que deixes fora indica Exclòs i no deu res per aquesta despesa concreta; els altres n’assumeixen la part.',
  'help.guide.split-expense.tip.2':
    'A parts iguals quadra fins al cèntim: el cèntim que sobra va rotant de despesa en despesa, perquè no sigui sempre el mateix qui el paga.',
  'help.guide.split-expense.tip.3':
    'El mode Tiquet suma Import total ell mateix i deixa el camp en gris: les línies del rebut són el total.',
  // expense-currency
  'help.guide.expense-currency.title': 'Introduir una despesa en una altra divisa',
  'help.guide.expense-currency.goal':
    'Introdueix el que diu realment el rebut i deixa que TREK guardi el tipus de canvi.',
  'help.guide.expense-currency.step.1':
    'Obre Afegir despesa i omple el nom i l’import exactament tal com diu el rebut, la xifra mateixa i no una conversió seva.',
  'help.guide.expense-currency.step.2':
    'Obre Divisa i tria la divisa del rebut. La llista porta tots els codis que TREK coneix i s’hi pot cercar: escriu les tres lletres.',
  'help.guide.expense-currency.step.3':
    'Sota els camps apareix una línia amb el que val l’import ara mateix, marcada amb tipus de canvi actual. És una vista prèvia, no el que es desa.',
  'help.guide.expense-currency.step.4':
    'Fes clic a Afegir despesa. El tipus de canvi es congela a l’instant: a partir d’aquí aquesta despesa val el que valia el dia que la vas introduir.',
  'help.guide.expense-currency.step.5':
    'Al registre la fila porta les dues xifres sota el nom: el que vas escriure, una fletxa, i el que compta en la divisa del viatge. Cada total, cada balanç i cada liquidació de dalt fa servir la segona.',
  'help.guide.expense-currency.result':
    'La despesa conserva l’import i la divisa que vas escriure. El registre mostra tots dos, i els totals i els balanços del viatge es mantenen en la divisa del viatge.',
  'help.guide.expense-currency.tip.1':
    'El tipus de canvi es congela en el moment que deses, perquè un deute liquidat no es torni a obrir perquè el mercat s’ha mogut la setmana següent. Només canviar la divisa de la despesa en congela un de nou.',
  'help.guide.expense-currency.tip.2':
    'Divisa de visualització a Configuració només canvia el que llegeixes; els imports desats no es mouen mai. Si es deixa buida, cada viatge es mostra en la seva pròpia divisa.',
  'help.guide.expense-currency.tip.3':
    'La divisa del viatge viu al viatge mateix, a Edita el viatge, i demana el dret Edita els detalls del viatge. Canviar-la torna a ancorar cada tipus de canvi congelat en lloc de redenominar els imports.',
  // filter-costs
  'help.guide.filter-costs.title': 'Trobar una despesa, o la despesa d’un dia',
  'help.guide.filter-costs.goal': 'Redueix un registre llarg al que realment busques.',
  'help.guide.filter-costs.step.1':
    'Escriu a Cercar despeses…, sobre la llista. Cerca al nom de la despesa mentre escrius.',
  'help.guide.filter-costs.step.2':
    'Totes les categories obre les catorze categories. Tria’n una i només queden les despeses d’aquella categoria.',
  'help.guide.filter-costs.step.3':
    'Tots els dies llista cada dia en què s’ha gastat alguna cosa. Tria’n un i un bàner substitueix les capçaleres de dia per aquell dia, quantes despeses conté i el seu total.',
  'help.guide.filter-costs.step.4':
    'El selector Tot / Pagat per mi / Em deuen és la teva pròpia vista del registre: allò en què vas posar diners, i allò que encara tens pendent de recuperar.',
  'help.guide.filter-costs.step.5':
    'Exporta CSV, al final de la fila, escriu cada despesa en un fitxer, amb l’import original, la seva divisa i l’import convertit.',
  'help.guide.filter-costs.result':
    'Els filtres es combinen, i els grups de dia es tornen a dibuixar amb els seus propis totals per al que queda.',
  'help.guide.filter-costs.tip.1':
    'Els pagaments registrats no porten ni nom ni categoria, de manera que una cerca o un filtre de categoria els amaga. El filtre de dia els manté, sota el dia en què es va registrar el pagament.',
  'help.guide.filter-costs.tip.2':
    'Exporta CSV exporta sempre totes les despeses, sigui el que sigui el que hi ha filtrat a la pantalla, una fila per despesa.',
  // settle-up
  'help.guide.settle-up.title': 'Esbrinar qui deu a qui, i liquidar-ho',
  'help.guide.settle-up.goal':
    'Converteix un munt de despeses compartides en el mínim nombre de transferències que deixen tothom al dia, i registra-les a mesura que passen.',
  'help.guide.settle-up.step.1':
    'La targeta Liquidar comptes, a la columna de la dreta, llista les transferències que deixarien tothom al dia: qui paga a qui, i quant. El nombre al costat del títol és quantes encara són obertes.',
  'help.guide.settle-up.step.2':
    'Liquidar, al costat d’una transferència, la registra com a feta. El flux desapareix de la targeta i els balanços es tornen a dibuixar.',
  'help.guide.settle-up.step.3':
    'La transferència registrada és una fila del registre, sota el dia en què va passar, marcada com a Pagament amb els dos viatgers i l’import.',
  'help.guide.settle-up.step.4':
    'Al costat d’aquesta fila el llapis corregeix un pagament i Desfer el retira, i la transferència torna a la targeta Liquidar comptes.',
  'help.guide.settle-up.step.5':
    'Afegir pagament, a la capçalera de la targeta, registra una transferència que no ha seguit cap suggeriment. Tria De i A, l’Import, la seva divisa i el dia en què va passar.',
  'help.guide.settle-up.step.6':
    'Liquidar comptes, a la capçalera de dalt de la pantalla, registra de cop totes les transferències obertes, com un grup que es posa al dia al final d’un viatge.',
  'help.guide.settle-up.result':
    'Cada transferència registrada és una fila del registre i una línia menys a la targeta Liquidar comptes. Quan la targeta diu Tothom està al dia, el viatge està pagat.',
  'help.guide.settle-up.tip.1':
    'La targeta mostra el mínim nombre de transferències, no cada deute: tres persones que es deuen en cercle es redueixen a un o dos pagaments.',
  'help.guide.settle-up.tip.2':
    'Liquidar registra una transferència, no mou diners. Envia-la pel mitjà que facis servir i després fes-hi clic.',
  'help.guide.settle-up.tip.3':
    'Un pagament es pot fer en qualsevol divisa, de manera que pagar en euros un deute en iens és normal: el diàleg té el seu propi selector de divisa i també congela aquell tipus de canvi.',
  // final-budget
  'help.guide.final-budget.title': 'Veure el que el viatge ha costat a cada viatger',
  'help.guide.final-budget.goal':
    'Llegeix el costat per persona del registre: el balanç d’avui, i el cost real per persona.',
  'help.guide.final-budget.step.1':
    'Balanços mostra la posició de cada viatger: una barra verda cap a la dreta si el viatge li deu, una barra vermella cap a l’esquerra si ell deu al viatge, i l’import al costat del nom.',
  'help.guide.final-budget.step.2':
    'Pressupost final, a sota, respon una altra pregunta: no qui deu què ara mateix, sinó el que el viatge costa a cada viatger un cop s’ha tornat tot.',
  'help.guide.final-budget.step.3':
    'Fes clic a un nom per obrir el càlcul: Despeses pagades, després Reemborsaments nets i Reemborsaments pendents a sota.',
  'help.guide.final-budget.step.4':
    'Sota cada línia hi ha les files de què està feta: les despeses que ha pagat aquell viatger, les transferències ja registrades i les que encara són obertes. Sumen exactament la línia de sobre.',
  'help.guide.final-budget.result':
    'Balanços és qui està a favor o en contra avui; Pressupost final és el que el viatge acaba costant a cadascun de vosaltres un cop s’ha tornat tot.',
  'help.guide.final-budget.tip.1':
    'Registrar un pagament no canvia el pressupost final de ningú. Només mou un import dels reemborsaments pendents als reemborsaments nets.',
  'help.guide.final-budget.tip.2':
    'Una despesa sense pagador queda fora de les dues targetes, igual que queda fora dels suggeriments de liquidació.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Convertir una reserva en una despesa',
  'help.guide.expense-from-booking.goal':
    'Adjunta el que realment ha costat un vol, un hotel o un lloc a la fitxa a què pertany.',
  'help.guide.expense-from-booking.step.1':
    'Obre la reserva a la pestanya Transports o Reserves i fes clic al seu llapis.',
  'help.guide.expense-from-booking.step.2':
    'Baixa fins al bloc Despeses al final del formulari. Ofereix Crear despesa, que primer desa la reserva, i Vincular despesa existent per a una que ja és a Despeses.',
  'help.guide.expense-from-booking.step.3':
    'Fes clic a Crear despesa. La reserva es desa, el formulari es tanca, i l’editor de Despeses s’obre amb el títol de la reserva com a nom i el seu tipus ja associat a una categoria.',
  'help.guide.expense-from-booking.step.4':
    'Omple l’import i la seva moneda, qui ha pagat i el repartiment com en qualsevol despesa, i desa. En tornar a obrir la reserva apareix sota Despeses vinculades, amb un llapis per editar-la, Desvincular, conservar la despesa per deixar-la anar i una paperera per treure-la.',
  'help.guide.expense-from-booking.result':
    'La reserva porta el seu cost, i la despesa és una fila corrent de la pestanya Despeses, amb un pagador, un repartiment i una divisa com qualsevol altra.',
  'help.guide.expense-from-booking.tip.1':
    'Eliminar la reserva elimina també les seves despeses vinculades. Eliminar despesa, al bloc Despeses de la reserva, fa el contrari: la despesa se’n va, la reserva es queda. Desvincular, conservar la despesa les manté totes dues.',
  'help.guide.expense-from-booking.tip.2':
    'Un lloc té el mateix bloc al seu formulari, on Crear despesa desa primer el lloc.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transports',
  'help.ctx.trip-transports.summary':
    'Tot allò que et porta entre les parades: vols, trens, autobusos, cotxes, taxis, bicicletes, creuers, ferris i les connexions de transport públic que TREK cerca per tu. La pestanya n’és la llista; també es creen i es llegeixen al pla, i es dibuixen al mapa.',
  'help.ctx.trip-transports.bullet.1':
    'La pestanya només guarda els trajectes. Allotjaments, restaurants, esdeveniments i entrades viuen a Reserves, de manera que la mateixa entrada no surt mai dues vegades.',
  'help.ctx.trip-transports.bullet.2':
    'La barra d’eines els compta tots sota Tot i dona a cada tipus en ús el seu propi xip amb el seu recompte, Vol, Tren, Cotxe, Transport públic. Transport manual, a la dreta, n’afegeix un a mà.',
  'help.ctx.trip-transports.bullet.3':
    'Les targetes vénen en tres grups, cadascun plegable pel seu títol: Transport públic automatitzat per a les connexions que ha planificat la cerca, després Pendent, després Confirmada.',
  'help.ctx.trip-transports.bullet.4':
    'Una targeta porta l’estat, el tipus, els dies que abasta, les hores, el Codi de reserva, la ruta i l’Aerolínia amb el Núm. de vol, o bé el Núm. de tren, l’Andana i el Seient. El llapis l’obre, la paperera l’elimina després d’una pregunta.',
  'help.ctx.trip-transports.bullet.5':
    'Els transports també neixen al pla: cada capçalera de dia té un més per a Afegeix transport i un botó de tramvia per a Transport públic, i el connector de temps de viatge entre dues parades obre la mateixa cerca per a aquell sol tram.',
  'help.ctx.trip-transports.bullet.6':
    'Un transport amb els dos extrems posats dibuixa una línia al mapa. La icona de ruta a la seva fila del pla del dia encén aquesta línia, i Mostra totes les rutes de reserva, a la barra sobre els dies, commuta tot el viatge.',
  // transports-list
  'help.guide.transports-list.title': 'Llegir la pestanya Transports',
  'help.guide.transports-list.goal': 'Saber què et diu la llista abans de canviar-hi res.',
  'help.guide.transports-list.step.1':
    'Transports és la segona pestanya del viatge. Només guarda els trajectes: hotels, restaurants, esdeveniments i entrades són a Reserves.',
  'help.guide.transports-list.step.2':
    'La barra d’eines compta cada transport sota Tot i dona a cada tipus en ús el seu propi xip amb el seu recompte. Fes clic en un xip per quedar-te només amb aquell tipus, torna-hi a fer clic per deixar-lo anar. Diversos xips poden estar actius alhora, i Tot els neteja.',
  'help.guide.transports-list.step.3':
    'Transport públic automatitzat és un grup propi, les connexions que ha planificat la cerca de transport públic. Pendent i Confirmada guarden tot el que s’ha entrat a mà. La fletxa del costat d’un títol plega un grup.',
  'help.guide.transports-list.step.4':
    'Una targeta ho diu tot: el punt d’estat amb Pendent o Confirmada, el tipus, els dies que abasta amb les seves dates, les hores, el Codi de reserva, la ruta, i l’Aerolínia amb el Núm. de vol, o bé el Núm. de tren, l’Andana i el Seient.',
  'help.guide.transports-list.step.5':
    'El llapis obre el transport per editar-lo, la paperera l’elimina, després d’una pregunta que diu què se’n va.',
  'help.guide.transports-list.result':
    'La llista queda reduïda al que buscaves, i cada targeta diu d’un cop d’ull si el trajecte està reservat.',
  'help.guide.transports-list.tip.1':
    'Els xips i els grups plegats es recorden per viatge, així que la pestanya es torna a obrir tal com la vas deixar.',
  'help.guide.transports-list.tip.2':
    "Importa des d'un fitxer i AirTrail només s’afegeixen a Transport manual a la barra d’eines quan el servidor sap llegir confirmacions de reserva i quan hi ha una instància d’AirTrail connectada. Sense ells, la llista s’omple a mà i amb la cerca de transport públic.",
  // add-transport
  'help.guide.add-transport.title': 'Afegir un transport a un dia',
  'help.guide.add-transport.goal': 'Posar el trajecte que et duu d’una parada a la següent al dia en què passa.',
  'help.guide.add-transport.step.1':
    'Cada capçalera de dia porta quatre botons petits a la dreta. Fes clic al més, el consell del qual diu Afegeix transport. El formulari s’obre amb Data ja posada en aquell dia.',
  'help.guide.add-transport.step.2':
    'Tipus de reserva tria què agafes: Vol, Tren, Autobús, Cotxe, Taxi, Bicicleta, Creuer, Ferri o Altres. El formulari el segueix. Un vol rep un aeroport a cada tram, un tren una cadena d’estacions, un cotxe les paraules Recollida i Devolució i Parades pel camí.',
  'help.guide.add-transport.step.3':
    'Títol és l’únic camp que s’ha d’omplir; Afegir es queda gris sense ell. Escriu-hi allò que reconeixeries en un plafó d’andana.',
  'help.guide.add-transport.step.4':
    'Des de i Fins a cerquen una estació, un port o una adreça. Escriu almenys tres lletres i tria un resultat de la llista. Un nom només escrit no porta coordenades, així que no dibuixa res al mapa.',
  'help.guide.add-transport.step.5':
    "Data i Hora d'inici diuen quan va, Data de fi i Hora de fi quan s’ha acabat; un trajecte que arriba l’endemà hi pren el dia següent. Codi de reserva, Estat amb Pendent o Confirmada, i Notes són opcionals.",
  'help.guide.add-transport.step.6': 'Fes clic a Afegir.',
  'help.guide.add-transport.result':
    'El transport és una fila al dia, a la seva hora entre les parades, i una targeta a la pestanya Transports sota Pendent o Confirmada.',
  'help.guide.add-transport.tip.1':
    'La fila cau on la posa la seva hora d’inici, darrere de l’última parada que comença abans. La seva nansa l’arrossega a qualsevol altre lloc del dia, o a un altre dia.',
  'help.guide.add-transport.tip.2':
    'Adjunta un fitxer, sota Fitxers, recull el bitllet, i Crear despesa, sota Despeses, desa la reserva i obre l’editor de Despeses per al preu.',
  'help.guide.add-transport.tip.3':
    'Viatgers marca qui va en aquest trajecte. Tan bon punt un transport té viatgers, la barra d’eines de la pestanya fa créixer els seus avatars i filtra la llista per ells.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planificar una connexió de transport públic',
  'help.guide.plan-transit.goal':
    'Deixar que TREK cerqui els trens i autobusos reals entre dos punts d’un dia i posar al pla el que triïs.',
  'help.guide.plan-transit.step.1':
    'A la capçalera del dia, fes clic al botó de tramvia, Transport públic. La cerca s’obre per a aquell dia.',
  'help.guide.plan-transit.step.2':
    'Des de i Fins a accepten una parada o una estació. Amb la casella encara buida s’ofereixen les parades pròpies del dia i els allotjaments del viatge; en escriure dues lletres es cerquen en canvi les estacions de l’horari. Intercanviar, entre les dues caselles, gira la connexió del revés.',
  'help.guide.plan-transit.step.3':
    'Sortida o Arribada amb una hora diu quan vols viatjar, i La millor ruta, Menys transbords o Caminar menys diu com s’han d’ordenar les respostes.',
  'help.guide.plan-transit.step.4':
    'Els xips de sota diuen quins mitjans es poden fer servir: Tren, Metro, Tramvia, Autobús, Ferri i Telefèric. Apaga’n un per deixar-lo fora, almenys un queda encès. Després fes clic a Cercar.',
  'help.guide.plan-transit.step.5':
    'Cada resultat dona sortida i arribada, quant dura, quants transbords i quanta estona a peu, i les línies amb els seus colors. Fes clic en un per desplegar-lo parada a parada, amb les andanes i els trams a peu entre les línies.',
  'help.guide.plan-transit.step.6': 'Fes clic a Afegir al dia.',
  'help.guide.plan-transit.result':
    'La connexió és una fila al dia amb les seves línies, els seus transbords i el seu temps a peu, i una targeta a la pestanya Transports sota Transport públic automatitzat.',
  'help.guide.plan-transit.tip.1':
    'Les connexions vénen de Transitous, un servei comunitari lliure sobre dades públiques d’horaris: sense clau, sense compte. Un administrador pot apuntar la cerca a Google en lloc seu.',
  'help.guide.plan-transit.tip.2':
    'No has trobat res? Les fonts cobreixen una regió i un període. Prova una altra hora, encén més mitjans, o tria una estació en lloc del lloc mateix. El missatge diu quin servei ha respost.',
  'help.guide.plan-transit.tip.3':
    'La mateixa cerca s’obre per a un sol tram: fes clic al connector de temps de viatge entre dues parades i tria Transport públic. Des de, Fins a i l’hora de sortida ja et vénen omplerts.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Obrir i canviar una connexió planificada',
  'help.guide.change-transit-route.goal':
    'Llegir la connexió parada a parada, canviar-li el nom, o tornar a cercar la ruta.',
  'help.guide.change-transit-route.step.1':
    'A la pestanya Transports, les connexions planificades són sota Transport públic automatitzat. Fes clic a la targeta.',
  'help.guide.change-transit-route.step.2':
    'Durada, Transbords i A peu són a dalt. Itinerari, a sota, recorre la connexió parada a parada, amb les andanes i els trams a peu entre les línies.',
  'help.guide.change-transit-route.step.3':
    'Canviar de ruta torna a executar la cerca, ja plena amb els dos extrems d’aquesta connexió i amb el seu dia.',
  'help.guide.change-transit-route.step.4':
    'Tria una altra connexió i fes clic a Afegir al dia; ocupa el lloc de l’anterior. Editar detalls, al costat de Canviar de ruta, obre en canvi el formulari de transport corrent, on viuen el Codi de reserva, l’Estat, els viatgers i els fitxers.',
  'help.guide.change-transit-route.result':
    'El trajecte porta el nou itinerari, i la seva targeta a la pestanya Transports mostra les línies i les hores noves.',
  'help.guide.change-transit-route.tip.1':
    'El títol del trajecte només és text: el llapis del costat el canvia de nom sense tocar la ruta. Notes, a sota, accepten markdown i tenen una pestanya Editar i una de Vista prèvia.',
  'help.guide.change-transit-route.tip.2':
    'Eliminar, al peu del trajecte, treu la connexió del viatge; el dia manté les seves parades.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Canviar com es fa un tram',
  'help.guide.leg-travel-mode.goal':
    'Fer a peu un tram d’un dia que per la resta es fa en cotxe, o donar aquell tram a la cerca de transport públic.',
  'help.guide.leg-travel-mode.step.1':
    'Els connectors entre les parades només apareixen quan la ruta del dia està encesa. Fes clic al dia per obrir-lo, després a Ruta sota les seves parades.',
  'help.guide.leg-travel-mode.step.2':
    'Cada connector diu el temps de viatge i la distància d’aquell tram, amb la icona del mitjà amb què s’ha calculat: un cotxe per conduir, un peu per caminar.',
  'help.guide.leg-travel-mode.step.3':
    'Fes clic al connector. El menú ofereix En cotxe i A peu, Transport públic, i Usa el valor per defecte del dia.',
  'help.guide.leg-travel-mode.step.4': 'Tria A peu. Només canvia aquest tram; la resta del dia manté el seu mitjà.',
  'help.guide.leg-travel-mode.result':
    'El tram mostra la icona del peu i el seu temps a peu, i els altres trams del dia mantenen el mitjà del dia.',
  'help.guide.leg-travel-mode.tip.1':
    'El mitjà pertany al tram, no al dia: els botons En cotxe i A peu de tot el dia no sobreescriuen mai un tram que has posat a mà. Usa el valor per defecte del dia els torna el tram.',
  'help.guide.leg-travel-mode.tip.2':
    'Transport públic, al mateix menú, obre la cerca de connexions per a exactament aquest tram, amb els dos extrems i l’hora de sortida ja omplerts.',
  'help.guide.leg-travel-mode.tip.3':
    'Els temps vénen d’un encaminador públic sobre carreteres i camins de vianants reals. Un tram que no pot respondre manté la seva línia recta i no mostra cap temps.',
  // edit-transport
  'help.guide.edit-transport.title': 'Canviar o eliminar un transport',
  'help.guide.edit-transport.goal':
    'Corregir una hora, una andana o un codi de reserva, o treure el trajecte del viatge.',
  'help.guide.edit-transport.step.1':
    'Al pla del dia un transport és una fila de color entre les parades. Fes-hi clic.',
  'help.guide.edit-transport.step.2':
    'El formulari és el mateix que el va crear, amb Edita el transport a la barra de títol. Tot es pot canviar: el tipus, la ruta, els dies i les hores, el Codi de reserva, l’Estat.',
  'help.guide.edit-transport.step.3':
    'La ruta d’un vol és una cadena d’aeroports, la d’un tren una cadena d’estacions. Afegeix una escala en posa una altra al mig, i cada tram manté les seves hores i el seu número de vol o de tren.',
  'help.guide.edit-transport.step.4':
    'Fes clic a Actualitzar. Per treure el transport del tot, fes servir la paperera de la seva targeta a la pestanya Transports i confirma.',
  'help.guide.edit-transport.result':
    'El canvi es veu a tot arreu on surt el transport: la pestanya Transports, el dia en què va, i la seva línia al mapa.',
  'help.guide.edit-transport.tip.1':
    'El mateix formulari s’obre pels dos costats, amb el llapis de la targeta a la pestanya Transports i amb la fila pròpia del transport al pla del dia. Una connexió de transport públic planificada és l’excepció: la seva fila obre la vista del trajecte, i Editar detalls hi porta a aquest formulari.',
  'help.guide.edit-transport.tip.2':
    'Moure un transport a un altre dia no necessita gens el formulari: arrossega la seva fila d’una targeta de dia a la següent.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Dibuixar un transport al mapa',
  'help.guide.transport-on-map.goal': 'Veure per on passa realment un vol, un trajecte en cotxe o una connexió.',
  'help.guide.transport-on-map.step.1':
    'Un transport amb els dos extrems posats porta una icona de ruta petita a la seva fila del pla del dia. Fes-hi clic; l’etiqueta passa a Amaga les rutes de reserves.',
  'help.guide.transport-on-map.step.2':
    'La ruta es dibuixa al mapa, amb un marcador en forma de píndola a cada extrem que porta la icona del transport.',
  'help.guide.transport-on-map.step.3':
    'Fes clic en un marcador d’extrem per llegir la reserva sense deixar el mapa: les hores, l’Aerolínia i el Núm. de vol, el Codi de reserva i l’adreça. Tancar aparta el full.',
  'help.guide.transport-on-map.step.4':
    'La icona de ruta a la barra sobre els dies fa tot el viatge de cop: Mostra totes les rutes de reserva, i Amaga totes les rutes de reserva per tornar-les a netejar.',
  'help.guide.transport-on-map.step.5':
    'Una connexió de transport públic planificada no té icona pròpia. Es dibuixa amb l’interruptor Ruta del dia, i per això Amaga totes les rutes de reserva no la neteja mentre la ruta d’aquell dia encara està encesa.',
  'help.guide.transport-on-map.result':
    'Les rutes són al mapa amb un marcador a cada extrem, i s’hi queden fins que les tornes a apagar.',
  'help.guide.transport-on-map.tip.1':
    'Un vol, un creuer i un ferri es dibuixen com una corba, un cotxe, un autobús, un taxi i una bicicleta segueixen les carreteres reals, i un tren o una connexió planificada passa per les estacions on para.',
  'help.guide.transport-on-map.tip.2':
    'Una reserva confirmada és una línia contínua, una de pendent és discontínua. L’opció Etiquetes de rutes de reserves escriu el codi de l’aeroport o el nom de l’estació als marcadors dels extrems.',
  'help.guide.transport-on-map.tip.3':
    'Mostra totes les rutes de reserva és fer taula rasa, no és una capa: descarta el que havien posat les icones individuals, de manera que prémer-ho dues vegades et deixa amb tot encès o tot apagat.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Llegir un vol del seu bitllet electrònic',
  'help.guide.import-transport-file.goal':
    'Deixa que TREK tregui un vol, un tren o un ferri del bitllet que ha enviat la companyia, i comprova’l abans que es desi.',
  'help.guide.import-transport-file.step.1':
    'Fes clic a Importa des d’un fitxer a la barra d’eines de la pestanya Transports, al costat de Transport manual. S’obre Importa confirmacions de reserva, el mateix diàleg que té la pestanya Reserves.',
  'help.guide.import-transport-file.step.2':
    'Deixa anar el bitllet sobre la caixa, o fes-hi clic i tria’l: EML, PDF, PKPass, HTML i TXT, fins a cinc fitxers de 10 MB cadascun. Els fitxers que has triat surten amb el seu nom a la caixa.',
  'help.guide.import-transport-file.step.3':
    'Fes clic a Importar. El diàleg es tanca de seguida; la lectura passa en segon pla.',
  'help.guide.import-transport-file.step.4':
    'Una targeta a baix a la dreta informa de l’execució sota el nom del fitxer. Analitzant els fitxers… es converteix en un tic quan la lectura ha acabat, i la targeta ofereix Importar. Fes-hi clic.',
  'help.guide.import-transport-file.step.5':
    'Un vol s’obre a Afegeix transport, ja omplert: Tipus de reserva a Vol, l’aerolínia i el número de vol a Títol, els dos aeroports sota Ruta amb Sortida i Arribada, les seves hores i les seves zones horàries, Aerolínia i Núm. de vol, el Codi de reserva i el bitllet sota Fitxers. Comprova-ho i fes clic a Afegir.',
  'help.guide.import-transport-file.result':
    'El vol és una targeta a Pendent a la pestanya Transports i una fila al dia que surt, amb el bitllet sota Fitxers, i amb els dos aeroports coneguts dibuixa la seva corba al mapa.',
  'help.guide.import-transport-file.tip.1':
    'Les dues pestanyes comparteixen una sola importació: un fitxer que conté un vol i un hotel obre el vol a Afegeix transport i l’hotel a Reserva nova, l’un darrere l’altre, sigui quina sigui la pestanya des d’on has començat.',
  'help.guide.import-transport-file.tip.2':
    'Els aeroports es col·loquen pel seu codi. Una estació o un port que la lectura no ha pogut localitzar surt en ambre a la targeta; tria’l a mà sota Ruta abans de fer clic a Afegir, o el transport no dibuixa res al mapa.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importar vols des d’AirTrail',
  'help.guide.airtrail-import.goal':
    'Porta al viatge d’un sol cop els vols que ja tens a AirTrail, i deixa que a partir de llavors segueixin AirTrail.',
  'help.guide.airtrail-import.step.1':
    'Amb l’addon AirTrail activat i la teva instància connectada sota Integracions a Configuració, la barra d’eines de la pestanya Transports porta un botó AirTrail al costat de Transport manual. Fes-hi clic.',
  'help.guide.airtrail-import.step.2':
    'Importar des d’AirTrail llista els vols del teu compte en dos grups. Durant aquest viatge té els datats dins del viatge, ja marcats; Altres vols té la resta, sense marcar. Un vol que ja és al viatge surt en gris i marcat com a Importat.',
  'help.guide.airtrail-import.step.3':
    'Cada fila és una casella amb l’aerolínia i el número de vol, els dos aeroports i la data. Fes clic a una fila per incloure el vol o deixar-lo fora; els d’Altres vols només entren quan els marques.',
  'help.guide.airtrail-import.step.4':
    'Els vols que enllacen, cadascun sortint de l’aeroport on el d’abans va aterrar en menys d’un dia, s’emmarquen junts. La casella de sota, Importar com un sol vol amb escala a aquell aeroport, ja està activada: deixa-la activada per a una sola reserva amb escala, o desactiva-la per importar els trams com a vols separats.',
  'help.guide.airtrail-import.step.5':
    'Fes clic a Importar. El botó compta els vols marcats, i el missatge de després diu quants n’han entrat.',
  'help.guide.airtrail-import.step.6':
    'Els vols són targetes sota Confirmada, cadascuna amb una insígnia blava AirTrail al costat del seu estat, i files als dies que operen. Una connexió unida és una sola targeta, amb la seva ruta passant per l’escala.',
  'help.guide.airtrail-import.result':
    'Els vols d’AirTrail són targetes a la pestanya Transports i files als seus dies, cadascuna amb la insígnia AirTrail que diu d’on ve.',
  'help.guide.airtrail-import.tip.1':
    'Un vol que ja és al viatge amb el mateix número i la mateixa data se salta, i un missatge diu quants n’hi havia. Desfés a la barra d’eines sobre els dies retira tota la importació.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail continua sent la font de la veritat. TREK en llegeix els canvis quan obres el viatge i cada pocs minuts en segon pla; un vol eliminat allà conserva la seva targeta, amb la insígnia canviada a No sincronitzat. Els canvis fets a TREK només hi tornen amb Sincronitzar els canvis cap a AirTrail activat sota Integracions.',
  'help.guide.airtrail-import.tip.3':
    'Una connexió unida no té cap vol d’AirTrail únic a seguir, així que és una importació d’un sol cop: conserva la insígnia blava, i passar per sobre de la insígnia ho diu. El mateix passa amb un vol sincronitzat al qual dones una escala a mà.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Viatge per carretera',
  'help.ctx.trip-roadtrip.summary':
    'El pla llegit com un sol trajecte: els mateixos dies i els mateixos llocs, encadenats en parades amb la conducció entremig, en una llista al llarg de la columna esquerra i al mapa. Diu quant hi ha i quant dura, on s’esgota el dipòsit, i què hi ha vora la carretera.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Dies i Viatge per carretera, a dalt de la columna esquerra, canvien entre el pla dels dies i el trajecte. No es copia res i no es canvia res: Dies torna el pla exactament tal com era.',
  'help.ctx.trip-roadtrip.bullet.2':
    'El cap de la llista suma el viatge: Distància, Temps de conducció i Parades. A sota ve una targeta per dia, amb els quilòmetres propis del dia, per a quantes parades és, allò que supera, i una etiqueta Traça.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Una parada numerada és un lloc per al qual existeix el dia. Una parada del camí, combustible, càrrega, una àrea de descans, porta la icona del seu tipus en lloc d’un número i no es compta. Fes clic en un número per canviar què és, i a l’etiqueta Parada per dir quant dura.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Entre dues parades, una banda de conducció dona el tram en distància i temps. Fes-hi clic per a Rutes per a aquest tram, o fes clic a la ruta dibuixada al mapa per doblegar el tram per un punt de pas.',
  'help.ctx.trip-roadtrip.bullet.5':
    'La columna dreta passa a ser Al llarg de la ruta: tria un dia, què vols buscar i quina amplada té el corredor, i després Cerca. Afegeix posa un resultat al trajecte al punt pel qual es passa de debò.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Les Preferències de conducció de sota guarden els límits, el cotxe i la seva autonomia, els horaris diaris, què s’ha d’evitar i com es dibuixa la línia. Pertanyen al viatge, així que tothom planifica amb el mateix cotxe.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Llegir el viatge com un sol trajecte',
  'help.guide.roadtrip-mode.goal': 'Passa el pla al mode viatge per carretera i llegeix què t’explica la llista.',
  'help.guide.roadtrip-mode.step.1':
    'Fes clic a Viatge per carretera al selector Dies i Viatge per carretera, a dalt de la columna esquerra. El pla dels dies queda substituït pel trajecte, i el mapa dibuixa cada dia que té ruta calculada.',
  'help.guide.roadtrip-mode.step.2': 'El cap de la llista suma tot el viatge: Distància, Temps de conducció i Parades.',
  'help.guide.roadtrip-mode.step.3':
    'A sota ve una targeta per dia. La seva capçalera porta el número i la data del dia, la conducció en distància i temps, i per a quantes parades és el dia.',
  'help.guide.roadtrip-mode.step.4':
    'Dins la targeta el dia és una cadena: una parada numerada per lloc, una banda de conducció entre cada parell, i l’hora d’arribada a la vora dreta.',
  'help.guide.roadtrip-mode.step.5':
    'Fes clic a la capçalera d’un dia per plegar-lo. Un dia plegat també desapareix del mapa; torna a fer clic a la capçalera per recuperar-lo.',
  'help.guide.roadtrip-mode.result':
    'La columna esquerra és el trajecte i el mapa en mostra cada dia. Dies torna directament al pla, sense canvis.',
  'help.guide.roadtrip-mode.tip.1':
    'La tria es recorda per viatge mentre la pestanya del navegador segueixi oberta, així que una recàrrega torna al trajecte.',
  'help.guide.roadtrip-mode.tip.2':
    'El selector només existeix un cop un administrador ha activat el complement Viatge per carretera, a Complements dins d’Administració.',
  'help.guide.roadtrip-mode.tip.3':
    'Al mòbil no hi ha selector: el complement afegeix una pestanya Viatge per carretera pròpia al costat de Planificació.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Les parades del camí, i quanta estona t’hi quedes',
  'help.guide.roadtrip-stops.goal':
    'Converteix un lloc del trajecte en una parada del camí, i digues quant dura cada parada.',
  'help.guide.roadtrip-stops.step.1':
    'Fes clic al número que hi ha davant d’una parada a la llista. La seva etiqueta és Converteix en parada del camí, i obre Tipus de parada.',
  'help.guide.roadtrip-stops.step.2':
    'Tria un tipus: Allotjament, Combustible, Càrrega, Àrea de descans, Càmping, Menjar o Llocs d’interès. El número es converteix en la icona d’aquell tipus i les parades de sota es renumeren.',
  'help.guide.roadtrip-stops.step.3':
    'Una parada del camí no és una destinació, així que la capçalera del dia compta una parada menys.',
  'help.guide.roadtrip-stops.step.4':
    'Torna a fer clic a la icona, Canvia el tipus de parada, i tria Torna a ser una destinació per retornar el número a la parada.',
  'help.guide.roadtrip-stops.step.5':
    'Cada parada porta una etiqueta Parada. Fes-hi clic per obrir Temps en aquesta parada.',
  'help.guide.roadtrip-stops.step.6':
    'Fixa la durada amb el control lliscant, amb els botons menys i més o amb un dels valors predefinits, mira què fan Arribada i Sortida, i després fes clic a Desar.',
  'help.guide.roadtrip-stops.result':
    'La parada a la qual has posat temps porta l’hora a la seva etiqueta Parada i cada arribada posterior s’ha desplaçat amb ella, i la que has enviat a un tipus i de tornada torna a ser una destinació numerada.',
  'help.guide.roadtrip-stops.tip.1':
    'Una estada pertany al lloc, no a una visita: en un lloc planificat en dos dies s’hi és la mateixa estona tots dos dies.',
  'help.guide.roadtrip-stops.tip.2':
    'Les parades del camí també surten a Dies. Apagar Mostra també a Dies, dins de Parades de servei a les Preferències de conducció, les manté només al Viatge per carretera.',
  'help.guide.roadtrip-stops.tip.3': 'Sense estada, al mateix diàleg, torna a treure aquest temps.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Trobar combustible, menjar i llit al llarg de la ruta',
  'help.guide.roadtrip-corridor.goal':
    'Cerca a la carretera que condueixes de debò, i posa el que trobis al tram correcte.',
  'help.guide.roadtrip-corridor.step.1':
    'Tria el dia a dalt de Al llarg de la ruta. Només s’ofereixen els dies amb ruta calculada.',
  'help.guide.roadtrip-corridor.step.2':
    'A Es busca, marca el que et cal. Combustible, Càrrega, Àrea de descans, Càmping, Allotjament, Menjar i Llocs d’interès es poden combinar.',
  'help.guide.roadtrip-corridor.step.3':
    'A En un radi de, tria fins on mirar a banda i banda de la carretera, 2 km, 5 km o 10 km, i després fes clic a Cerca.',
  'help.guide.roadtrip-corridor.step.4':
    'Els resultats tornen agrupats per tipus, en l’ordre en què els passes, cadascun amb el punt del dia on es troba i a quina distància queda de la ruta.',
  'help.guide.roadtrip-corridor.step.5':
    'Afegeix en un resultat obre Afegeix com a parada. Diu en quin dia i en quina posició cau la parada, demana el tipus i el temps a la parada, i Afegeix la posa al trajecte.',
  'help.guide.roadtrip-corridor.result':
    'Els resultats es llisten en l’ordre en què els passes i es dibuixen al mapa, i el que has afegit queda al trajecte al punt pel qual es passa de debò.',
  'help.guide.roadtrip-corridor.tip.1':
    'No es busca res fins que prems Cerca: una execució són moltes peticions a un servei compartit.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtra per nom estreny el que ha tornat sense tornar a preguntar, i Esborra resultats buida la llista i les seves xinxetes. Fes clic en un resultat per portar-lo a la vista al mapa.',
  'help.guide.roadtrip-corridor.tip.3':
    'Un resultat també es pot arrossegar del mapa fins a la ruta dibuixada, que és com tries tu mateix el tram on la mateixa carretera es fa dues vegades. Afegeix manualment, al costat de Cerca, busca en canvi un lloc pel nom.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Doblegar un tram per un punt de pas',
  'help.guide.roadtrip-via.goal': 'Envia un tram per la carretera que vols de debò, sense afegir-hi una parada.',
  'help.guide.roadtrip-via.step.1':
    'Porta a la vista el tram que vols: fes clic en una parada de la llista i tanca després la targeta que s’obre sobre el mapa.',
  'help.guide.roadtrip-via.step.2':
    'Fes clic a la ruta dibuixada. Es deixa un punt de pas al tram on has fet clic, i el tram es torna a calcular passant per ell.',
  'help.guide.roadtrip-via.step.3':
    'La llista ho segueix: la capçalera del dia porta la nova distància i el nou temps de conducció, i cada arribada posterior al punt de pas es desplaça amb ell.',
  'help.guide.roadtrip-via.step.4':
    'Passa el ratolí per sobre de la nansa i diu què sap fer: Arrossega per remodelar la ruta, clic dret per eliminar. Arrossega-la a un altre lloc i el tram es torna a dibuixar pel punt nou.',
  'help.guide.roadtrip-via.step.5': 'Fes clic dret a la nansa per treure-la. El tram torna a fer el camí directe.',
  'help.guide.roadtrip-via.result':
    'El tram segueix la carretera que has triat, i la distància, el temps de conducció i les arribades del dia es tornen a calcular per a ella.',
  'help.guide.roadtrip-via.tip.1':
    'Un punt de pas no és una parada: no té número, ni estada, ni hora d’arribada, i no compta entre les parades del dia.',
  'help.guide.roadtrip-via.tip.2':
    'Les nanses es dibuixen a partir del nivell de zoom 9, així que un mapa ajustat a tot el viatge mostra la línia sense elles.',
  'help.guide.roadtrip-via.tip.3':
    'Un clic a més de dos quilòmetres de qualsevol tram dibuixat s’ignora, i un clic sobre un vol, un tren o un ferri també.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Provar una altra manera de fer un tram',
  'help.guide.roadtrip-alternatives.goal': 'Mira què més ofereix l’encaminador per a un tros, i agafa-ho.',
  'help.guide.roadtrip-alternatives.step.1':
    'Fes clic en una banda de conducció de la llista, la fila entre dues parades que dona el tram en distància i temps. La seva etiqueta és Altres rutes.',
  'help.guide.roadtrip-alternatives.step.2':
    'Rutes per a aquest tram s’obre sobre el mapa, una entrada per carretera, cadascuna dibuixada al mapa amb el seu color.',
  'help.guide.roadtrip-alternatives.step.3':
    'Passa el ratolí per una entrada per encendre aquella carretera. Actual és la carretera per on es va i La més ràpida la més veloç; les altres diuen quant són més lentes, o quina classe de carretera deixen fora.',
  'help.guide.roadtrip-alternatives.step.4':
    'Fes clic en una entrada per anar per allà, o a Tancar per quedar-te amb la carretera on ets.',
  'help.guide.roadtrip-alternatives.result':
    'El tram va per la carretera que has triat, i la distància de la llista i les arribades posteriors canvien amb ella.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Triar una altra carretera posa un punt de pas al tram i substitueix els que ja hi havia; triar la carretera pròpia de l’encaminador els torna a treure.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Sense autopista, Sense peatges i Sense ferri venen d’un segon motor amb el seu propi model de velocitat, així que els seus temps no són comparables amb els altres.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Fixar el cotxe i els límits de conducció',
  'help.guide.roadtrip-limits.goal': 'Digues a TREK què condueixes i fins on estàs disposat a conduir d’una tirada.',
  'help.guide.roadtrip-limits.step.1':
    'Preferències de conducció és a sota de la cerca, a la columna dreta. Les seves etiquetes diuen què hi ha fixat; fes-hi clic per obrir-ho.',
  'help.guide.roadtrip-limits.step.2':
    'A Conducció, Trajecte més llarg seguit i Conducció per dia van en minuts. Un camp buit vol dir desactivat, i no es marca res.',
  'help.guide.roadtrip-limits.step.3':
    'A Vehicle, digues què condueixes. Benzina només reposta a les parades de combustible, Elèctric només a les de càrrega, Tots dos a totes dues.',
  'help.guide.roadtrip-limits.step.4':
    'Escriu tu mateix Autonomia per dipòsit, o Autonomia per càrrega. Calcula-ho a partir del cotxe, a sota, agafa Dipòsit i Consum, o Bateria i Consum, i fa el compte.',
  'help.guide.roadtrip-limits.step.5':
    'Evita quan sigui possible és una preferència, no una prohibició: un dia sense manera de voltar-ho fa servir igualment la carretera, i ho diu a la seva capçalera.',
  'help.guide.roadtrip-limits.step.6':
    'Tanca el diàleg. La targeta diu què hi ha fixat, i la llista marca cada tram i cada dia que se’n passa.',
  'help.guide.roadtrip-limits.result':
    'Les etiquetes de la targeta diuen què hi ha fixat, i cada tram i cada dia per sobre d’un límit porta una etiqueta a la llista.',
  'help.guide.roadtrip-limits.tip.1':
    'Les preferències pertanyen al viatge, així que tothom qui hi és planifica amb el mateix cotxe i els mateixos límits.',
  'help.guide.roadtrip-limits.tip.2':
    'Omple fins a diu fins on omple una parada, perquè ningú carrega al 100 % a la carretera. Una parada de combustible o de càrrega ho pot sobreescriure per a ella mateixa.',
  'help.guide.roadtrip-limits.tip.3':
    'Línia de la ruta decideix com es dibuixa el trajecte: Connecta els dies calcula la nit entre dos dies, i Un color per dia dona a cada dia el seu.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Donar un començament i un final al dia de conducció',
  'help.guide.roadtrip-day-window.goal': 'Deixa de conduir a l’hora que triïs, i digues on ha d’acabar el dia.',
  'help.guide.roadtrip-day-window.step.1': 'Obre Preferències de conducció a la columna dreta i troba Horaris diaris.',
  'help.guide.roadtrip-day-window.step.2':
    'Posa un Inici del dia. Sol no fa res: calen totes dues hores, tal com diu la nota de sota.',
  'help.guide.roadtrip-day-window.step.3':
    'Posa un Final del dia. El trajecte ara s’atura a aquella hora i passa la resta al matí següent, com una fila Final del dia i una fila Continuar el viatge a la llista.',
  'help.guide.roadtrip-day-window.step.4':
    'A Final del dia, tria Durant el trajecte per fer pausa a la carretera a l’hora de final, o A l’últim lloc per aturar-te abans que el trajecte següent la superi.',
  'help.guide.roadtrip-day-window.step.5':
    'Tanca el diàleg. La targeta Preferències de conducció porta les dues hores com a etiqueta.',
  'help.guide.roadtrip-day-window.result':
    'El trajecte es talla en dies de viatge de la llargada que has fixat, i el que no hi cap continua en dies calculats després de l’últim. Els teus dies i els seus llocs no es canvien.',
  'help.guide.roadtrip-day-window.tip.1':
    'Buidar qualsevol de les dues hores ho torna a desactivar tot. Les hores que has fixat tu mateix en una parada sempre tenen prioritat.',
  'help.guide.roadtrip-day-window.tip.2':
    'Amb els horaris diaris fixats els dies sempre estan connectats: el trajecte de l’última parada d’un dia fins a la primera del següent es calcula i es compta.',
  'help.guide.roadtrip-day-window.tip.3':
    'Cada final de dia també és un marcador al mapa, una lluna amb el número del dia. Arrossega’l per la ruta, o fins a un lloc, per acabar el dia en un altre punt; fes-hi clic dret per tornar a posar el final automàtic, i Restaura els finals de dia automàtics en aquest diàleg ho desfà tot.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Omplir el dipòsit abans que s’esgoti',
  'help.guide.roadtrip-refuel.goal': 'Troba on repostar al tram on el cotxe encara arriba, i posa-ho al trajecte.',
  'help.guide.roadtrip-refuel.step.1':
    'Amb una autonomia fixada, la llista dibuixa una banda travessant el tram allà on s’acaba: Aquí s’esgota el dipòsit, i a sota a quina distància dins del tram cau.',
  'help.guide.roadtrip-refuel.step.2':
    'El llum de la banda és el botó. Cerca combustible mira al llarg de la carretera que ja has fet, amb Cercant al llarg de la ruta… mentre ho fa.',
  'help.guide.roadtrip-refuel.step.3':
    'Tornen fins a tres estacions, cadascuna amb a quina distància queda de la ruta i quanta autonomia deixaria de marge.',
  'help.guide.roadtrip-refuel.step.4':
    'El més d’una oferta l’afegeix com a parada de combustible. Afegeix com a parada s’obre amb el tipus i el temps ja omplerts, i Afegeix la posa al tram al punt pel qual es passa de debò.',
  'help.guide.roadtrip-refuel.result':
    'La parada és al tram correcte amb la seva icona, l’autonomia torna a comptar des d’ella, i la banda ha desaparegut.',
  'help.guide.roadtrip-refuel.tip.1':
    'L’autonomia compta des de l’última parada de combustible o de càrrega, d’un dia a l’altre. Què condueixes decideix quines parades compten: Benzina només el combustible, Elèctric només la càrrega.',
  'help.guide.roadtrip-refuel.tip.2':
    'La cerca mira la carretera anterior al punt sec, guarda una reserva i compta el desviament dues vegades, així que a tot el que ofereix s’hi arriba de debò.',
  'help.guide.roadtrip-refuel.tip.3':
    'Una resposta buida no és un carreró sense sortida: el llum passa a Torna-ho a provar, perquè la cerca de llocs és un servei compartit que de tant en tant expira.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Fer que un dia segueixi una traça importada',
  'help.guide.roadtrip-track.goal':
    'Posa el trajecte d’un dia sobre una carretera bonica que has importat com a traça GPX o KML.',
  'help.guide.roadtrip-track.step.1':
    'Fes clic a l’etiqueta Traça a la capçalera d’un dia. El diàleg s’obre en aquell dia.',
  'help.guide.roadtrip-track.step.2':
    'Tria una traça. Cadascuna diu quant fa i si va al llarg d’aquest dia o a quina distància queda, la més propera primer.',
  'help.guide.roadtrip-track.step.3':
    'Fes clic a Segueix aquesta traça. TREK deixa punts de pas allà on el trajecte s’allunya més de la traça, i torna a calcular, ronda rere ronda.',
  'help.guide.roadtrip-track.step.4':
    'Diu quants punts de pas ha col·locat i a quina distància es manté ara el trajecte. El botó de sota torna a treure aquests punts de pas i retorna el dia a l’encaminador; tancar el diàleg manté la traça.',
  'help.guide.roadtrip-track.result':
    'El trajecte del dia segueix la traça en lloc de la carretera que va triar l’encaminador, i la seva etiqueta Traça està encesa i anomena aquella traça quan hi apuntes.',
  'help.guide.roadtrip-track.tip.1':
    'Importa el fitxer a Dies amb Importa un fitxer, amb Rutes o Tracks marcats. Mentre el viatge no en tingui cap, cap dia no porta l’etiqueta.',
  'help.guide.roadtrip-track.tip.2':
    'Seguir una traça substitueix els punts de pas que els trams del dia ja tenien, així que dona forma a un tram a mà després de la traça, no abans.',
};

export default help;
