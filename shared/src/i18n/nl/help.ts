import type { TranslationStrings } from '../types';

// English fallback until 'nl' is translated.
const help: TranslationStrings = {
  'help.title': 'Help & Docs',
  'help.search': 'Search docs…',
  'help.contents': 'Contents',
  'help.noResults': 'No matching pages.',
  'help.errorTitle': "Couldn't load this page",
  'help.errorBody': 'The help content is fetched from the TREK wiki. Check your connection and try again.',

  // center
  'help.center.button': 'Hulp bij dit scherm',
  'help.center.title': 'Hulp',
  'help.center.onThisScreen': 'Op dit scherm',
  'help.center.screens': 'Schermen',
  'help.center.thisScreen': 'Dit scherm',
  'help.center.subScreens': 'Subschermen: {count}',
  'help.center.subScreensLabel': 'Subschermen',
  'help.center.guidesCount': '{count} handleidingen',
  'help.center.goToScreen': 'Ga naar {screen}',
  'help.center.overview': 'Overzicht',
  'help.center.howTo': 'Hoe kan ik…',
  'help.center.searchPlaceholder': 'Zoek in handleidingen en documentatie…',
  'help.center.searchEmpty': "Niets gevonden voor '{query}'.",
  'help.center.searchGuides': 'Handleidingen',
  'help.center.searchDocs': 'Documentatie',
  'help.center.searchError': 'Zoeken is op dit moment niet beschikbaar.',
  'help.center.back': 'Terug',
  'help.center.close': 'Hulp sluiten',
  'help.center.steps': '{count} stappen',
  'help.center.step': 'Stap {n}',
  'help.center.stepsLabel': 'Stappen',
  'help.center.stepOf': 'Stap {n} van {total}',
  'help.center.screenshot': 'Schermafbeelding',
  'help.center.result': 'Wat je krijgt',
  'help.center.tips': 'Goed om te weten',
  'help.center.related': 'Gerelateerd',
  'help.center.openDocs': 'Openen in Hulp & documentatie',
  'help.center.docsSection': 'In de documentatie',
  'help.center.noContext': 'Voor dit scherm is nog geen handleiding.',
  'help.center.noContextHint': 'Zoek in de documentatie, of vertel ons wat je zocht.',
  'help.center.feedback': 'Mis je iets?',
  'help.center.feedbackLink': 'Laat het ons weten op GitHub',
  'help.center.discord': 'Vraag het op Discord',
  'help.center.quick': 'Snel',
  'help.center.guide': 'Handleiding',
  'help.center.tour': 'Rondleiding',
  'help.center.imageAlt': "Stap {n} van '{title}'",

  // ctx
  'help.ctx.dashboard.title': 'Dashboard',
  'help.ctx.dashboard.summary':
    'Het dashboard is de voordeur van al je reizen. De instapkaart bovenaan zet de reis in de schijnwerper die nu loopt of als volgende komt, de rij eronder telt wat je al gereisd hebt, en de kaarten tonen alles wat je plant, gearchiveerd hebt of al achter de rug hebt.',
  'help.ctx.dashboard.bullet.1':
    'Instapkaart: de lopende of volgende reis met data, reizigers, plaatsen en een aftelling. Klik erop om de reis te openen.',
  'help.ctx.dashboard.bullet.2':
    'Reisstatistieken: bezochte landen, reizen, dagen onderweg en gevlogen afstand, over al je reizen.',
  'help.ctx.dashboard.bullet.3':
    'Reiskaarten, gefilterd op Gepland, Gearchiveerd en Voltooid, als raster of lijst. Beweeg over een kaart voor bewerken, dupliceren, archiveren en verwijderen.',
  'help.ctx.dashboard.bullet.4':
    'Widgets rechts: valutaomrekenaar, wereldklokken, aankomende reserveringen en collecties. Elke widget kan uit.',
  'help.ctx.dashboard.bullet.5': "De kaart 'Nieuwe reis' en de knop rechtsonder starten allebei een nieuwe reis.",

  // create-trip
  'help.guide.create-trip.title': 'Een reis aanmaken',
  'help.guide.create-trip.goal': 'Een nieuwe reis starten met een naam, data en een omslagfoto.',
  'help.guide.create-trip.step.1':
    "Klik op 'Nieuwe reis'. De kaart aan het einde van je reizen en de knop rechtsonder doen hetzelfde.",
  'help.guide.create-trip.step.2':
    'Geef de reis een naam. Dat is het enige verplichte veld; al het andere kun je later toevoegen.',
  'help.guide.create-trip.step.3':
    'Kies een begin- en einddatum. TREK maakt per datum een dag aan, zodat je reisplan klaar is om te vullen.',
  'help.guide.create-trip.step.4':
    'Optioneel: voeg een omslagfoto toe. Upload je eigen foto, sleep er een in, of zoek de bestemming op Unsplash.',
  'help.guide.create-trip.step.5': "Klik op 'Nieuwe reis aanmaken'.",
  'help.guide.create-trip.result':
    'De reis verschijnt op je dashboard. Is het je volgende reis, dan neemt hij de instapkaart bovenaan over.',
  'help.guide.create-trip.tip.1':
    'Data kun je later wijzigen. Zijn er al boekingen, dan vraagt TREK of die met de dagen mee moeten verschuiven.',
  'help.guide.create-trip.tip.2':
    'De reisvaluta die je hier kiest, is waarin elke uitgave wordt omgerekend. Kies de valuta van de bestemming.',

  // edit-trip
  'help.guide.edit-trip.title': 'Een reis bewerken',
  'help.guide.edit-trip.goal': 'Een reis hernoemen, de data wijzigen of de instellingen aanpassen.',
  'help.guide.edit-trip.step.1': 'Beweeg over de reiskaart (of de instapkaart) en klik op het potlood.',
  'help.guide.edit-trip.step.2':
    'Wijzig wat je nodig hebt: naam, beschrijving, data, omslag, valuta, herinnering of leden.',
  'help.guide.edit-trip.step.3': "Klik op 'Bijwerken'.",
  'help.guide.edit-trip.result': 'De kaart wordt meteen bijgewerkt, voor elk lid van de reis.',
  'help.guide.edit-trip.tip.1':
    'Verschuif je de data van een reis met boekingen, dan volgt een tweede stap met de vraag of de boekingen mee moeten verhuizen.',

  // cover-image
  'help.guide.cover-image.title': 'Een omslagfoto instellen',
  'help.guide.cover-image.goal': 'Een reis een afbeelding geven die op de kaart en de instapkaart te zien is.',
  'help.guide.cover-image.step.1': 'Open het bewerkformulier van de reis via het potlood op de kaart.',
  'help.guide.cover-image.step.2':
    "Sleep bij 'Omslagafbeelding' een foto naar binnen, klik om er een te uploaden, of typ een bestemming in het Unsplash-zoekveld.",
  'help.guide.cover-image.step.3': "Kies een foto en klik op 'Bijwerken'.",
  'help.guide.cover-image.result': 'De foto wordt bij de reis opgeslagen en overal getoond waar de reis staat.',
  'help.guide.cover-image.tip.1':
    "Foto's uit de Unsplash-zoekopdracht krijgen automatisch een naamsvermelding; je eigen uploads blijven op je server.",

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Een reis dupliceren',
  'help.guide.duplicate-trip.goal': 'Een reis hergebruiken als sjabloon voor een nieuwe.',
  'help.guide.duplicate-trip.step.1': 'Beweeg over de kaart en klik op het dupliceerpictogram.',
  'help.guide.duplicate-trip.step.2': 'Lees wat wel en niet wordt gekopieerd en bevestig.',
  'help.guide.duplicate-trip.result':
    'Naast het origineel verschijnt een kopie, klaar om te hernoemen en van nieuwe data te voorzien.',
  'help.guide.duplicate-trip.tip.1':
    'Dagen, plaatsen, reserveringen, budgetposten, paklijsten en dagnotities gaan mee. Leden, chat, peilingen, bestanden en deellinks niet.',

  // archive-trip
  'help.guide.archive-trip.title': 'Een reis archiveren en herstellen',
  'help.guide.archive-trip.goal': 'Een reis opbergen zonder te verwijderen en later terughalen.',
  'help.guide.archive-trip.step.1': "Beweeg over de kaart en klik op 'Archiveren'.",
  'help.guide.archive-trip.step.2': "Zet het filter boven de kaarten op 'Gearchiveerd' om de reis terug te zien.",
  'help.guide.archive-trip.step.3': "Klik op 'Herstellen' op de kaart om hem terug naar 'Gepland' te zetten.",
  'help.guide.archive-trip.result':
    'Gearchiveerde reizen behouden alles. Ze staan alleen niet meer in de weg op het dashboard en in de agendafeed van alle reizen.',

  // delete-trip
  'help.guide.delete-trip.title': 'Een reis verwijderen',
  'help.guide.delete-trip.goal': 'Een reis voorgoed weghalen.',
  'help.guide.delete-trip.step.1': 'Beweeg over de kaart en klik op de prullenbak.',
  'help.guide.delete-trip.step.2':
    'Bevestig. Het venster noemt de reis bij naam, zodat je zeker weet dat je de juiste hebt.',
  'help.guide.delete-trip.result':
    'De reis met dagen, plaatsen, boekingen en bestanden is weg. Dit kan niet ongedaan worden gemaakt; archiveer bij twijfel.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Voltooide reizen vinden, wisselen tussen raster en lijst',
  'help.guide.filter-and-view.goal':
    'Afgeronde of gearchiveerde reizen zien en de indeling kiezen die jij prettig vindt.',
  'help.guide.filter-and-view.step.1':
    "Gebruik 'Gepland', 'Gearchiveerd' en 'Voltooid' boven de kaarten. Voltooid is elke reis waarvan de einddatum voorbij is.",
  'help.guide.filter-and-view.step.2':
    'Klik op het lijstpictogram voor een compacte lijst; klik nog eens voor het raster.',
  'help.guide.filter-and-view.result': 'Het dashboard onthoudt je indeling op dit apparaat.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Alle reizen in je agenda volgen',
  'help.guide.calendar-feed.goal':
    'De dagen en boekingen van elke actieve reis in je agenda-app zien, altijd gesynchroniseerd.',
  'help.guide.calendar-feed.step.1': 'Klik op het agendapictogram naast de weergaveschakelaar.',
  'help.guide.calendar-feed.step.2': "Klik op 'Enable calendar subscription'. TREK maakt een privé feedlink aan.",
  'help.guide.calendar-feed.step.3':
    "Voeg de feed toe met een van de knoppen (Google, Apple, Outlook) of kopieer de link naar elke agenda-app die URL's kan volgen.",
  'help.guide.calendar-feed.result':
    'Elke actieve reis staat in je agenda en werkt zichzelf bij. Gearchiveerde reizen en reizen die meer dan 90 dagen geleden eindigden, blijven erbuiten.',
  'help.guide.calendar-feed.tip.1':
    'De link is geheim. Iedereen die hem heeft kan de feed lezen; trek hem in hetzelfde venster in als hij uitlekt.',

  // widgets
  'help.guide.widgets.title': 'Je dashboardwidgets kiezen',
  'help.guide.widgets.goal': 'De statistiekenrij en de widgets rechts tonen of verbergen.',
  'help.guide.widgets.step.1': "Open het avatarmenu rechtsboven en kies 'Instellingen'.",
  'help.guide.widgets.step.2': "Ga naar het tabblad 'Appearance'.",
  'help.guide.widgets.step.3':
    "Zet onder 'Dashboard widgets' elke widget aan of uit. Desktop en mobiel stel je apart in.",
  'help.guide.widgets.step.4': 'Ga terug naar het dashboard. De wijziging geldt meteen.',
  'help.guide.widgets.result':
    'Verborgen widgets maken ruimte voor je reizen; zet de hele rechterkolom uit om de indeling te centreren.',
  'help.guide.widgets.link': 'Weergave-instellingen openen',

  // currency-widget
  'help.guide.currency-widget.title': 'Valuta omrekenen',
  'help.guide.currency-widget.goal': "Een bedrag met actuele koersen omrekenen tussen twee valuta's.",
  'help.guide.currency-widget.step.1': "Typ het bedrag en kies de twee valuta's.",
  'help.guide.currency-widget.step.2': 'De pijl ertussen wisselt het paar om; de ronde pijl haalt de koers opnieuw op.',
  'help.guide.currency-widget.result':
    'Je valutapaar wordt in je account onthouden en is dus op elk apparaat hetzelfde.',
  'help.guide.currency-widget.tip.1':
    'De koersen komen van de Europese Centrale Bank en worden eenmaal per dag bijgewerkt.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Wereldklokken toevoegen',
  'help.guide.timezones-widget.goal': 'De lokale tijd op je bestemmingen in het oog houden.',
  'help.guide.timezones-widget.step.1': "Klik op + in de widget 'Tijdzones' en zoek een stad.",
  'help.guide.timezones-widget.step.2': 'Verwijder een klok met de × ernaast.',
  'help.guide.timezones-widget.result': 'Je klokken worden bij je account opgeslagen.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay is je persoonlijke verlofplanner: hoeveel vakantiedagen je per jaar hebt, welke je hebt opgenomen en wat er over is. Het raster toont het hele jaar in één oogopslag; in de zijbalk staan de jaarkeuze, de mensen met wie je plant, kalenders die met je gedeeld zijn, de legenda en je verlofsaldo.',
  'help.ctx.vacay.bullet.1':
    'Jaarraster: twaalf maandkaarten, één cel per dag. Klik op een dag om hem in te voeren of te wissen. Een blauw stipje markeert dagen die al door een reis gedekt zijn.',
  'help.ctx.vacay.bullet.2':
    'Werkbalk onderaan: modus Vakantie of Bedrijfsvakantie, plus de schakelaars Halve dag en Compensatie die bepalen wat een klik invoert.',
  'help.ctx.vacay.bullet.3':
    'Recht: je dagen voor het jaar, hoeveel je gebruikt hebt en hoeveel er over zijn, met overdracht uit de vorige periode.',
  'help.ctx.vacay.bullet.4':
    'Personen zijn mensen die met je plan samengevoegd zijn, elk in een eigen kleur. Gedeelde kalenders zijn alleen-lezen ringen van andermans vrije dagen.',
  'help.ctx.vacay.bullet.5':
    'Instellingen regelen weekends, weekstart, overdracht, je vakantiejaar, bedrijfsvakanties en kalenders voor feestdagen of schoolvakanties.',
  // log-day
  'help.guide.log-day.title': 'Een vakantiedag invoeren',
  'help.guide.log-day.goal': 'Een vrije dag in het jaarraster markeren en je saldo zien meebewegen.',
  'help.guide.log-day.step.1':
    'Kijk naar de werkbalk onderaan: de linkerknop, in jouw kleur, betekent dat een klik een vakantiedag voor jou invoert.',
  'help.guide.log-day.step.2':
    'Klik op een dag in een maandkaart. Hij vult zich met jouw kleur en Gebruikt telt een dag meer.',
  'help.guide.log-day.step.3': 'Klik nog eens op dezelfde dag om hem te wissen.',
  'help.guide.log-day.result':
    'De dag is ingevoerd, Dagen, Gebruikt en Resterend worden meteen bijgewerkt, en iedereen die met je plan samengevoegd is ziet het live.',
  'help.guide.log-day.tip.1': 'Weekends kun je niet invoeren zolang Weekenden blokkeren in de Instellingen aanstaat.',
  'help.guide.log-day.tip.2':
    'Een blauw stipje in een cel betekent dat een van je reizen die dag dekt, zodat je ziet waar verlof en reis samenvallen.',
  // half-day
  'help.guide.half-day.title': 'Een halve dag invoeren',
  'help.guide.half-day.goal': 'Een middag vrij nemen zonder een hele verlofdag te besteden.',
  'help.guide.half-day.step.1':
    'Zet Halve dag aan in de werkbalk. De oranje stip is de markering die een halve dag in het raster krijgt.',
  'help.guide.half-day.step.2': 'Klik op een dag. Hij wordt als 0,5 ingevoerd en draagt de oranje stip in de hoek.',
  'help.guide.half-day.step.3':
    'Zet Halve dag weer uit als je klaar bent; op een halve dag klikken met andere instellingen zet hem ter plekke om.',
  'help.guide.half-day.result':
    'Gebruikt groeit met 0,5. Halve dag en Compensatie zijn onafhankelijk, dus een halve compensatiedag kan ook.',
  'help.guide.half-day.tip.1':
    'De werkbalk toont altijd de markering die je volgende klik plaatst, zodat je kunt controleren voor je invoert.',
  // comp-day
  'help.guide.comp-day.title': 'Compensatie of flextijd invoeren',
  'help.guide.comp-day.goal': 'Tijd-voor-tijd opnemen die geen vakantiedagen kost.',
  'help.guide.comp-day.step.1':
    'Zet Compensatie aan in de werkbalk. De gearceerde schijf is hoe een compensatiedag er in het raster uitziet.',
  'help.guide.comp-day.step.2':
    'Klik op een dag. Hij vult zich met een diagonale arcering in jouw kleur in plaats van een egaal vlak.',
  'help.guide.comp-day.result': 'Compensatiedagen worden naast de saldotegels geteld en verlagen Resterend nooit.',
  'help.guide.comp-day.tip.1':
    'Opgenomen overuren, flextijd, een dag tijd-voor-tijd: alles wat vrij is maar geen vakantie hoort hier.',
  // entitlement
  'help.guide.entitlement.title': 'Je verlofsaldo instellen',
  'help.guide.entitlement.goal': 'Vacay vertellen hoeveel vakantiedagen je per jaar hebt.',
  'help.guide.entitlement.step.1': 'Klik in de zijbalk op de tegel Dagen onder Recht.',
  'help.guide.entitlement.step.2': 'Typ je aantal dagen en druk op Enter.',
  'help.guide.entitlement.result':
    'Resterend wordt opnieuw berekend uit je saldo, eventuele overdracht en de gebruikte dagen.',
  'help.guide.entitlement.tip.1':
    'Elk jaar heeft zijn eigen saldo, dus een wijziging hier geldt alleen voor het gekozen jaar.',
  // years
  'help.guide.years.title': 'Jaren toevoegen en wisselen',
  'help.guide.years.goal': 'Volgend jaar alvast plannen, of terugkijken op het vorige.',
  'help.guide.years.step.1':
    'Klik op de + rechts van het jaartal om het volgende jaar toe te voegen, of op de + links voor het vorige.',
  'help.guide.years.step.2': 'Wissel tussen jaren met de pijlen of de jaarchips eronder.',
  'help.guide.years.step.3':
    'Om een jaar te verwijderen beweeg je over zijn chip en klik je op het kleine minteken. Zijn invoer gaat mee, dus bevestig zorgvuldig.',
  'help.guide.years.result': 'Elk jaar houdt zijn eigen saldo en invoer; de overdracht verbindt ze.',
  // company-holidays
  'help.guide.company-holidays.title': 'Bedrijfsvakanties markeren',
  'help.guide.company-holidays.goal':
    'Dagen blokkeren waarop het hele bedrijf vrij is zonder iemands saldo aan te spreken.',
  'help.guide.company-holidays.step.1':
    'Open Instellingen en controleer dat Bedrijfsvakanties aanstaat. Dat is de standaard; de werkbalk biedt de modus alleen zolang het aanstaat.',
  'help.guide.company-holidays.step.2': 'Terug in het raster zet je de werkbalk op de modus Bedrijfsvakantie.',
  'help.guide.company-holidays.step.3': 'Klik op de dagen. Ze worden amberkleurig en verschijnen in de legenda.',
  'help.guide.company-holidays.result':
    'Bedrijfsvakanties zijn zichtbaar voor iedereen die met het plan samengevoegd is en verlagen Resterend nooit.',
  'help.guide.company-holidays.tip.1':
    'Elke samengevoegde persoon kan bedrijfsvakanties bewerken, dus spreek af wie ze bijhoudt.',
  // public-holidays
  'help.guide.public-holidays.title': 'Feestdagen tonen',
  'help.guide.public-holidays.goal': 'De feestdagen van je land of regio in het raster zetten.',
  'help.guide.public-holidays.step.1': 'Open Instellingen en zet Feestdagen aan.',
  'help.guide.public-holidays.step.2':
    'Klik op Kalender toevoegen, kies het land en, waar het ertoe doet, de regio. Geef het een kleur en een label als je wilt.',
  'help.guide.public-holidays.step.3': 'Sluit Instellingen. De feestdagen verschijnen in het raster en in de legenda.',
  'help.guide.public-holidays.result':
    'Feestdagen krijgen de kleur van de kalender en tellen nooit mee tegen je saldo.',
  'help.guide.public-holidays.tip.1':
    'Je kunt meerdere kalenders toevoegen, bijvoorbeeld je eigen regio en die van een samengevoegde collega.',
  // school-holidays
  'help.guide.school-holidays.title': 'Schoolvakanties tonen',
  'help.guide.school-holidays.goal': 'De schoolvakanties van je regio naast je eigen vrije dagen zien.',
  'help.guide.school-holidays.step.1': 'Open Instellingen en zet School Holidays aan.',
  'help.guide.school-holidays.step.2':
    'Klik op Kalender toevoegen en kies het land. Waar een land zijn kalender opsplitst, kies je ook de regio of groep.',
  'help.guide.school-holidays.step.3':
    'Sluit Instellingen. Elke vakantie krijgt een gekleurde band onderaan zijn dagen.',
  'help.guide.school-holidays.result': 'Schoolvakanties zijn puur visueel: ze verlagen niemands saldo.',
  'help.guide.school-holidays.tip.1':
    'Ontbreekt je regio? Je beheerder kan schoolvakanties handmatig bijhouden onder Admin, Personalisatie, Schoolvakanties.',
  // weekends
  'help.guide.weekends.title': 'Weekenden blokkeren en de weekstart instellen',
  'help.guide.weekends.goal':
    'Weekends buiten de telling houden en de week laten beginnen op de dag die je gewend bent.',
  'help.guide.weekends.step.1': 'Open Instellingen.',
  'help.guide.weekends.step.2': 'Zet Weekenden blokkeren aan en kies welke dagen als jouw weekend gelden.',
  'help.guide.weekends.step.3': 'Kies onder Week begint op maandag of zondag.',
  'help.guide.weekends.result':
    'Geblokkeerde dagen zijn grijs in het raster en kunnen niet per ongeluk ingevoerd worden.',
  // leave-year
  'help.guide.leave-year.title': 'Je vakantiejaar instellen',
  'help.guide.leave-year.goal':
    'Je saldo tellen over een boekjaar of vanaf je indiensttreding in plaats van januari tot december.',
  'help.guide.leave-year.step.1': 'Open Instellingen en zoek Vakantiejaar.',
  'help.guide.leave-year.step.2':
    'Kies Kalenderjaar, Boekjaar (met de maand en dag waarop het begint) of Indiensttreding (met de datum waarop je in dienst kwam).',
  'help.guide.leave-year.result':
    'Saldo, gebruikte dagen en overdracht volgen die periode, en het raster begint bij de eerste maand ervan.',
  'help.guide.leave-year.tip.1':
    'Deze instelling is persoonlijk: in een samengevoegd plan houdt iedereen zijn eigen vakantiejaar en cijfers.',
  // carry-over
  'help.guide.carry-over.title': 'Ongebruikte dagen meenemen',
  'help.guide.carry-over.goal': 'Wat aan het eind van een periode over is bij de volgende optellen.',
  'help.guide.carry-over.step.1': 'Open Instellingen.',
  'help.guide.carry-over.step.2': 'Zet Overdracht aan.',
  'help.guide.carry-over.result':
    'Het overgedragen aantal wordt over al je jaren opnieuw berekend en onder het saldo getoond.',
  'help.guide.carry-over.tip.1': 'Uitzetten zet elk overdrachtssaldo terug op nul.',
  // invite
  'help.guide.invite.title': 'Samen met iemand plannen',
  'help.guide.invite.goal':
    'Je plan samenvoegen met een andere TREK-gebruiker zodat jullie elkaars vrije dagen in één raster zien.',
  'help.guide.invite.step.1': 'Klik op het persoonsicoon in het paneel Personen.',
  'help.guide.invite.step.2': 'Kies de gebruiker en verstuur de uitnodiging.',
  'help.guide.invite.step.3': 'Die krijgt een melding en accepteert. Tot dan staat de uitnodiging als in behandeling.',
  'help.guide.invite.result':
    'Beide plannen smelten samen: iedereen heeft een kleur, jullie kunnen dagen voor elkaar invoeren, en alles synchroniseert live.',
  'help.guide.invite.tip.1':
    'Om een samenvoeging ongedaan te maken gebruik je Opheffen in Instellingen. Ieders invoer keert terug naar het eigen plan.',
  'help.guide.invite.tip.2': 'Moet de ander alleen je dagen zien, deel dan je kalender in plaats van samen te voegen.',
  // share-calendar
  'help.guide.share-calendar.title': 'Je kalender alleen-lezen delen',
  'help.guide.share-calendar.goal': 'Iemand laten zien wanneer je vrij bent zonder inspraak in je plan.',
  'help.guide.share-calendar.step.1': 'Klik op het deelicoon in het paneel Gedeelde kalenders.',
  'help.guide.share-calendar.step.2': 'Kies de gebruiker en klik op Delen. Accepteren is niet nodig.',
  'help.guide.share-calendar.step.3':
    'Kalenders die met jou gedeeld zijn verschijnen in hetzelfde paneel; het oog verbergt er een, Stoppen met delen trekt de jouwe in.',
  'help.guide.share-calendar.result':
    'Je vrije dagen verschijnen als een gekleurde ring in hun raster. Niets van wat je deelt kan daar bewerkt worden.',
  'help.guide.share-calendar.tip.1':
    'Delen en samenvoegen zijn onafhankelijk: je kunt met één persoon samengevoegd zijn en met anderen delen.',
  'help.guide.share-calendar.tip.2': 'Beweeg over een omringde dag om te zien wie vrij is en hoe lang.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'De Atlas is je reisvoetafdruk op een wereldkaart: elk land waar een reis je heen bracht is ingekleurd, en de landen van vóór TREK voeg je met de hand toe. Zoom in voor regio’s, houd een bucketlist bij van plekken die je nog wilt zien en lees je cijfers af in het glazen paneel onderaan.',
  'help.ctx.atlas.bullet.1':
    'De kaart: bezochte landen dragen een kleur die van hen blijft, geplande landen hebben een gestippelde rand, bucketlist-landen een diagonale arcering, al het andere is grijs. Beweeg over een land voor zijn reizen, plekken en eerste en laatste bezoek.',
  'help.ctx.atlas.bullet.2':
    'Zoeken bovenaan: typ een land of een plek. Een land kiezen vliegt erheen en opent zijn pop-up; een plek kiezen landt in zijn regio, zodat je die kunt markeren.',
  'help.ctx.atlas.bullet.3':
    'Geplande landen tonen, rechtsboven: laat de landen van je komende reizen zien. De schakelaar verschijnt alleen zolang je er hebt.',
  'help.ctx.atlas.bullet.4':
    'Paneel onderaan: het tabblad Statistieken met landen, reizen, plekken, steden, dagen, continenten en je reeks; het tabblad Bucketlist met wat nog voor je ligt.',
  'help.ctx.atlas.bullet.5':
    'Regio’s: vanaf zoomniveau 5 schakelt de kaart naar staten en provincies, elk aanklikbaar om te markeren of te verwijderen.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: met de add-on verbonden vinkt een paneel links van de statistieken wensen af en voegt landen toe uit je opnames, nooit zonder je bevestiging.',
  // mark-country
  'help.guide.mark-country.title': 'Een land als bezocht markeren',
  'help.guide.mark-country.goal':
    'Voeg een land toe waar je vóór TREK bent geweest, zodat de kaart en je telling het meenemen.',
  'help.guide.mark-country.step.1': 'Typ het land in het zoekvak bovenaan de kaart.',
  'help.guide.mark-country.step.2':
    'Kies het uit de lijst. De kaart vliegt erheen en er opent een pop-up voor dat land.',
  'help.guide.mark-country.step.3': 'Kies Markeren als bezocht.',
  'help.guide.mark-country.result':
    'Het land krijgt zijn kleur op de kaart en Landen telt er één meer. Die kleur is blijvend: meer landen markeren husselt de rest nooit door elkaar.',
  'help.guide.mark-country.tip.1':
    'Op een grijs land op de kaart klikken opent dezelfde pop-up; zoeken is de zekere weg bij kleine landen.',
  'help.guide.mark-country.tip.2':
    'Een land dat je met de hand markeert telt altijd als bezocht, wat de datums van een reis erheen ook zijn.',
  // unmark-country
  'help.guide.unmark-country.title': 'Een gemarkeerd land verwijderen',
  'help.guide.unmark-country.goal': 'Haal een met de hand gemarkeerd land weer van de kaart.',
  'help.guide.unmark-country.step.1':
    'Zoek het land en kies het, of klik het aan op de kaart. Bij een land dat je zelf markeerde vraagt de pop-up of het weg moet.',
  'help.guide.unmark-country.step.2': 'Bevestig met Verwijderen.',
  'help.guide.unmark-country.result': 'Het land wordt weer grijs en verlaat je telling.',
  'help.guide.unmark-country.tip.1':
    'Alleen met de hand gemarkeerde landen kun je zo verwijderen. Een land met reizen of plekken blijft zolang die er zijn; Verwijderen staat ook in zijn detailkaart in het paneel als het met de hand gemarkeerd is.',
  // country-details
  'help.guide.country-details.title': 'Zien wat je in een land deed',
  'help.guide.country-details.goal': 'Open een bezocht land en spring naar de reizen die je erheen brachten.',
  'help.guide.country-details.step.1': 'Zoek een land dat je hebt bezocht.',
  'help.guide.country-details.step.2':
    'Kies het. De kaart vliegt erheen en het paneel onderaan krijgt een kaart met vlag, plekken, reizen en een chip per reis.',
  'help.guide.country-details.result': 'Klik op een reischip om die reis in de planner te openen.',
  'help.guide.country-details.tip.1':
    'Over het land bewegen op de kaart toont dezelfde cijfers plus het eerste en laatste bezoek.',
  // planned-countries
  'help.guide.planned-countries.title': 'De landen tonen waar je heen gaat',
  'help.guide.planned-countries.goal':
    'Zet de landen van je komende reizen op de kaart zonder ze als bezocht te tellen.',
  'help.guide.planned-countries.step.1':
    'Zet Geplande landen tonen aan, rechtsboven. Het getal ernaast zegt hoeveel er wachten.',
  'help.guide.planned-countries.step.2':
    'Zoek een gepland land en kies het: het paneel zegt Gepland en de tooltip op de kaart toont wanneer je gaat.',
  'help.guide.planned-countries.result':
    'Geplande landen verschijnen met een gestippelde rand, zodat ze nooit lijken op een plek waar je al was. De schakelaar onthoudt je keuze.',
  'help.guide.planned-countries.tip.1':
    'Een land telt als bezocht zodra de reis erheen is begonnen; een lopende reis telt ook. Reizen zonder datums blijven helemaal buiten de statistieken.',
  'help.guide.planned-countries.tip.2': 'De schakelaar bestaat alleen zolang je komende reizen hebt.',
  // regions
  'help.guide.regions.title': 'Een regio markeren',
  'help.guide.regions.goal': 'Fijner dan landen: markeer de staten, provincies of prefecturen waar je bent geweest.',
  'help.guide.regions.step.1':
    'Zoom in op een land tot zijn regio’s verschijnen, vanaf zoomniveau 5. Het land zoeken en kiezen brengt je dichtbij genoeg.',
  'help.guide.regions.step.2':
    'Klik een regio aan. Eroverheen bewegen noemt de naam; de pop-up toont de regio en zijn land.',
  'help.guide.regions.step.3': 'Kies Markeren als bezocht.',
  'help.guide.regions.result':
    'De regio vult zich met de kleur van het land. Een regio markeren telt ook het land als bezocht als dat nog niet zo was.',
  'help.guide.regions.tip.1':
    'Op een bezochte regio klikken biedt Verwijderen, of je die nu markeerde of een plek haar daar zette.',
  'help.guide.regions.tip.2':
    'Regio’s waar je echte plekken hebt worden voor je gemarkeerd; daar hoef je niets te doen.',
  // search-place
  'help.guide.search-place.title': 'Een plek vinden en zijn regio markeren',
  'help.guide.search-place.goal':
    'Markeer Beieren door naar München te zoeken, zonder te weten in welke regio een stad ligt.',
  'help.guide.search-place.step.1':
    'Typ een stad, een bezienswaardigheid of een adres in het zoekvak. Landen komen eerst; de passende plekken verschijnen eronder onder Plekken.',
  'help.guide.search-place.step.2': 'Kies de plek. De kaart vliegt erheen en zoekt uit in welke regio het punt ligt.',
  'help.guide.search-place.step.3':
    'Kies Markeren als bezocht voor die regio, of Aan bucket list toevoegen als die nog voor je ligt.',
  'help.guide.search-place.result':
    'De regio is gemarkeerd, en het land ermee. Landen zonder regiogegevens in het kaartpakket vallen terug op het land zelf.',
  'help.guide.search-place.tip.1':
    'Plekken komen uit dezelfde zoekfunctie als overal in TREK, dus ze volgen de aanbieder die je beheerder instelde.',
  // bucket-country
  'help.guide.bucket-country.title': 'Een land op de bucketlist zetten',
  'help.guide.bucket-country.goal':
    'Houd een bucketlist van landen bij, direct op de kaart, los van de landen waar je was.',
  'help.guide.bucket-country.step.1': 'Zoek het land en kies het, of klik het aan op de kaart.',
  'help.guide.bucket-country.step.2': 'Kies Aan bucket list toevoegen.',
  'help.guide.bucket-country.step.3':
    'Kies een maand en jaar als je al weet wanneer, en bevestig met Aan bucket list toevoegen.',
  'help.guide.bucket-country.result':
    'Het land wordt met een diagonale arcering getekend in de kleur die het krijgt zodra je er bent, en het verschijnt in het tabblad Bucketlist van het paneel.',
  'help.guide.bucket-country.tip.1':
    'Dezelfde pop-up biedt Uit bucket list verwijderen zodra het land op de lijst staat.',
  'help.guide.bucket-country.tip.2':
    'Eén item per streefdatum: hetzelfde land kan voor twee verschillende maanden op de lijst staan, maar niet twee keer voor dezelfde.',
  // bucket-place
  'help.guide.bucket-place.title': 'Een plek aan de bucketlist toevoegen',
  'help.guide.bucket-place.goal':
    'Bewaar een stad, een bezienswaardigheid of een adres waar je van droomt, met coördinaten en een streefdatum.',
  'help.guide.bucket-place.step.1': 'Open het tabblad Bucketlist in het paneel onderaan.',
  'help.guide.bucket-place.step.2': 'Klik op Plaats toevoegen.',
  'help.guide.bucket-place.step.3':
    'Typ de naam en druk op de zoekknop; kies de treffer zodat de plek coördinaten krijgt. Alleen een naam typen en het zoeken overslaan kan ook.',
  'help.guide.bucket-place.step.4': 'Kies eventueel een maand en jaar en klik op Toevoegen.',
  'help.guide.bucket-place.result':
    'De plek staat bovenaan je bucketlist met zijn streefdatum; de × ernaast haalt hem weer weg.',
  'help.guide.bucket-place.tip.1':
    'Een wens met coördinaten is wat Dawarich later voor je kan afvinken, zodra je opnames laten zien dat je er was.',
  // stats
  'help.guide.stats.title': 'Je statistieken lezen',
  'help.guide.stats.goal': 'Weten wat de cijfers in het paneel tellen, en wat niet.',
  'help.guide.stats.step.1':
    'Landen is het aantal verschillende landen waar je echt bent geweest; geplande staan ernaast, niet erin. Reizen, Plaatsen en Dagen zijn totalen over al je reizen. Steden wordt afgeleid uit de adressen van je plekken, dus het is een schatting.',
  'help.guide.stats.step.2':
    'De continenten tonen bezochte landen per continent; Antarctica komt in de rij zodra je er bent geweest. Dan je reeks, opeenvolgende jaren met minstens één reis, en hoeveel reizen je dit jaar maakte.',
  'help.guide.stats.result': 'De cijfers volgen je reizen terwijl je ze plant; hier hoeft niets bijgehouden te worden.',
  'help.guide.stats.tip.1':
    'Steden worden uit de adrestekst gelezen, niet opgezocht, dus een kort adres als „Osteria Francescana, Italy“ of een dat eindigt op een prefectuur kan een regio opleveren in plaats van een stad.',
  'help.guide.stats.tip.2':
    'Met de hand gemarkeerde landen tellen mee in Landen en de continenten, maar brengen geen reizen, plekken of dagen mee.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Landen toevoegen uit je opnames',
  'help.guide.dawarich-countries.goal':
    'Laat Dawarich zeggen in welke landen je het afgelopen jaar was, en zet de landen die je bevestigt op de kaart.',
  'help.guide.dawarich-countries.step.1':
    'Met de add-on Dawarich verbonden zit er onderaan de kaart, links van de statistieken, een paneel Dawarich met twee tegels. Klik op Landen.',
  'help.guide.dawarich-countries.step.2':
    'Het venster gaat open op zijn tabblad Landen. Klik op Naar landen zoeken: TREK leest de landen en steden die je opnames in de laatste 12 maanden beslaan, maand voor maand, dus geef het even. Elk land dat je Atlas nog niet heeft staat in de lijst met zijn vlag, hoeveel steden, en de eerste daarvan bij naam, en begint aangevinkt; klik op een rij om hem weg te laten.',
  'help.guide.dawarich-countries.step.3':
    'Bevestig met de knop rechtsonder, die 5 landen toevoegen leest als er vijf rijen zijn aangevinkt. Het venster zegt hoeveel er zijn toegevoegd; sluit het en de kaart heeft zichzelf opnieuw ingelezen.',
  'help.guide.dawarich-countries.result':
    'De bevestigde landen dragen een kleur op de kaart en tellen mee in Landen, vastgelegd als afkomstig uit Dawarich. Wat je met de hand markeerde blijft ongemoeid.',
  'help.guide.dawarich-countries.tip.1':
    'Landen die de Atlas al als bezocht toont, met de hand, uit een reis of uit een eerdere controle, worden weggelaten, dus je eigen markeringen krijgen nooit een ander label. Een land dat je eerder uit de Atlas haalde komt terug als je het hier bevestigt.',
  'help.guide.dawarich-countries.tip.2':
    'Een landnaam die TREK niet kan koppelen staat onder de rijen in plaats van weg te vallen, en Opnieuw controleren vraagt het Dawarich nog eens. De notitie onder de lijst zegt dat de laatste 12 maanden zijn bekeken; dat venster ligt vast.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Wensen afvinken uit je opnames',
  'help.guide.dawarich-wishes.goal':
    'Kom erachter welke plekken op je bucketlist je echt hebt bereikt, en vink ze af op de dag dat het gebeurde.',
  'help.guide.dawarich-wishes.step.1':
    'Klik in het paneel Dawarich onderaan de kaart, links van de statistieken, op Wensenlijst.',
  'help.guide.dawarich-wishes.step.2':
    'Het venster gaat open op zijn tabblad Wensenlijst. Klik op Wensenlijst controleren: TREK zoekt in je opnames naar elke vermelding die coördinaten heeft. Een wens die je bereikte staat in de lijst met hoe dichtbij je kwam, hoe lang je bleef en de dag, en begint aangevinkt; een die je al afvinkte zegt Al afgevinkt. Onder de lijst telt een notitie de vermeldingen zonder coördinaten, en daar staat ook de regel: Een wens telt als bereikt binnen 250 m en na 20 minuten ter plaatse.',
  'help.guide.dawarich-wishes.step.3':
    'Bevestig met de knop rechtsonder, die 2 afvinken leest als er twee rijen zijn aangevinkt. Sluit dan het venster en open het tabblad Bucketlist van het paneel ernaast.',
  'help.guide.dawarich-wishes.result':
    'Elke wens draagt een groen vinkje met de datum van het verblijf, niet van vandaag; zijn tooltip zegt Afgevinkt op basis van je Dawarich-opnames, en een klik op de datum maakt het ongedaan.',
  'help.guide.dawarich-wishes.tip.1':
    'Voorbijrijden telt niet: de regel vraagt zowel nabijheid als tijd, en van meerdere verblijven die voldoen wint het langste. Een wens zonder coördinaten kan niet worden gecontroleerd, voeg plekken dus toe via het zoeken in Plaats toevoegen in plaats van alleen bij naam.',
  'help.guide.dawarich-wishes.tip.2':
    'Eén controle bekijkt tot 50 vermeldingen, eerst de nog niet afgevinkte, en zegt het als er meer waren. Een wens die al was afgevinkt houdt zijn eigen datum.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Collecties',
  'help.ctx.collections.summary':
    'Collections is je plekkenbibliotheek buiten elke reis: lijsten met een naam vol plekken die je vond en wilt bewaren, elke plek met een status Idee, Wil heen of Bezocht. Plekken worden reizen in en uit gekopieerd, nooit gekoppeld, dus een lijst en een reis veranderen elkaar nooit.',
  'help.ctx.collections.bullet.1':
    'Lijstenbalk links: je eigen lijsten, de lijsten die met je gedeeld zijn, uitnodigingen die op een ja wachten, Alle opgeslagen als de som van alles wat van jou is, en Nieuwe lijst plus de bestandsimport bovenaan.',
  'help.ctx.collections.bullet.2':
    'Kop van de open lijst: zijn kleur, omslag, beschrijving en links, de leden, en rechts de acties Bewerken, Exporteren en Delen.',
  'help.ctx.collections.bullet.3':
    'Filterrij boven de plekken: status, categorie, beoordeling en sortering, het labelfilter, de + om een plek toe te voegen, de import uit een reis en Kiezen voor bulkacties.',
  'help.ctx.collections.bullet.4':
    'Plekrijen: avatar, naam en adres, labels en categorie, en rechts de statuspil die met één klik doorschakelt.',
  'help.ctx.collections.bullet.5':
    'Kaart rechts: een speld per plek met coördinaten, de schakelaar lijst of kaart, het zoekvak en het labelfilter. Op een speld klikken opent die plek.',
  'help.ctx.collections.bullet.6':
    'Detailblad: klik op een rij voor omslag, categorie, labels, status, beschrijving en links, met Bewerken, Naar reis kopiëren en Uit lijst verwijderen.',
  // create-list
  'help.guide.create-list.title': 'Een lijst aanmaken',
  'help.guide.create-list.goal': 'Begin een nieuwe lijst met een naam, een kleur en een omslag, klaar voor plekken.',
  'help.guide.create-list.step.1': 'Klik op Nieuwe lijst bovenaan de lijstenbalk.',
  'help.guide.create-list.step.2':
    'Geef de lijst een naam en kies een kleur. Omslagfoto, beschrijving en links zijn optioneel; je kunt ze later toevoegen met Bewerken.',
  'help.guide.create-list.step.3': 'Klik op Aanmaken.',
  'help.guide.create-list.result':
    'De lijst opent leeg, met Plaats toevoegen en Importeren uit een reis als de twee manieren om hem te vullen.',
  'help.guide.create-list.tip.1':
    'De omslag kan een eigen upload zijn of een foto uit de Unsplash-zoekfunctie in hetzelfde dialoogvenster.',
  // add-place
  'help.guide.add-place.title': 'Een plek toevoegen',
  'help.guide.add-place.goal':
    'Vind een plek en sla hem in één keer op in de open lijst, met naam, categorie, status en notities.',
  'help.guide.add-place.step.1': 'Klik op de + in de filterrij boven de plekken.',
  'help.guide.add-place.step.2':
    'Typ de plek in het zoekveld en kies een resultaat. Naam, adres en coördinaten worden daaruit ingevuld.',
  'help.guide.add-place.step.3':
    'Stel de status in en, als je wilt, een categorie, een beschrijving en links, en klik dan op Toevoegen. Het dialoogvenster blijft open voor de volgende plek; Annuleren sluit het.',
  'help.guide.add-place.result': 'De plek verschijnt in de lijst en, als hij coördinaten heeft, als speld op de kaart.',
  'help.guide.add-place.tip.1':
    'Vanuit een reis zet In collectie opslaan in de plekinspector of het plekmenu een reisplek op een lijst zonder de reis te verlaten.',
  'help.guide.add-place.tip.2':
    'De lijst moet van jou zijn of een waar je bewerker of beheerder bent; de + is er niet op Alle opgeslagen of op een lijst die je alleen bekijkt.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Plekken uit een reis importeren',
  'help.guide.import-from-trip.goal':
    'Haal alle plekken van een reis in één keer op een lijst in plaats van ze één voor één op te slaan.',
  'help.guide.import-from-trip.step.1':
    'Klik op de importknop met de wolkpijl in de filterrij. Op een lege lijst staat dezelfde actie naast Plaats toevoegen.',
  'help.guide.import-from-trip.step.2': 'Kies een van je reizen.',
  'help.guide.import-from-trip.step.3':
    'Vink de plekken aan die je wilt. Plekken die al op de lijst staan zijn grijs; de plekken die in geen enkele dag van de reis zitten staan vooraf aangevinkt. Alleen nieuwe verbergt wat je al hebt.',
  'help.guide.import-from-trip.step.4': 'Klik op Importeren. De knop zegt altijd hoeveel er zo worden toegevoegd.',
  'help.guide.import-from-trip.result':
    'De plekken worden met naam, adres, coördinaten, beschrijving en categorie naar de lijst gekopieerd. De reis blijft zoals hij was.',
  'help.guide.import-from-trip.tip.1':
    'Dubbelen op naam of coördinaten worden automatisch overgeslagen, dus twee keer importeren kan geen kwaad.',
  'help.guide.import-from-trip.tip.2':
    'In de plekkenlijst van een reis biedt de selectiemodus in plaats daarvan In collectie opslaan voor een handmatig gekozen set plekken.',
  // place-status
  'help.guide.place-status.title': 'De status van een plek instellen',
  'help.guide.place-status.goal': 'Houd bij wat een idee is, wat op de shortlist staat en waar je al bent geweest.',
  'help.guide.place-status.step.1': 'Klik op de statuspil aan het rechtereind van een plekrij. Idee wordt Wil heen.',
  'help.guide.place-status.step.2': 'Klik nog eens voor Bezocht, en nog een keer om weer bij Idee te beginnen.',
  'help.guide.place-status.result': 'De pil en zijn kleur veranderen meteen; het statusfilter boven de lijst telt mee.',
  'help.guide.place-status.tip.1':
    'Status is iets van Collections: een plek naar een reis kopiëren neemt hem niet mee.',
  'help.guide.place-status.tip.2':
    'Vanuit een reis toont In collectie opslaan een statuspil per lijst waar de plek op staat, en het plekkenpaneel heeft de actie Markeer als bezocht voor een selectie.',
  // place-detail
  'help.guide.place-detail.title': 'Een opgeslagen plek openen',
  'help.guide.place-detail.goal':
    'Zie alles over een plek en doe er iets mee: bewerken, naar een reis kopiëren, verwijderen.',
  'help.guide.place-detail.step.1':
    'Klik op een plekrij. Het detailblad opent naast de lijst en de kaart schuift naar de plek.',
  'help.guide.place-detail.step.2':
    'Onderaan staan Bewerken, Naar reis kopiëren en Uit lijst verwijderen; de camera op de omslag wisselt de automatische foto voor een eigen foto.',
  'help.guide.place-detail.result':
    'Bewerken maakt naam, categorie, labels, adres, coördinaten, beschrijving en links direct in het blad bewerkbaar.',
  'help.guide.place-detail.tip.1':
    'De omslag wordt automatisch opgehaald als de plek geen eigen foto heeft. Je eigen upload mag JPG, PNG, GIF of WebP zijn tot 20 MB.',
  'help.guide.place-detail.tip.2':
    'Leden van een gedeelde lijst kunnen hier ook een sterrenbeoordeling achterlaten, en het beoordelingsfilter in de filterrij gebruikt het gemiddelde.',
  // labels
  'help.guide.labels.title': 'Plekken groeperen met labels',
  'help.guide.labels.goal': 'Geef een lijst eigen labels, zoals wijken of dagen, naast de gedeelde categorieën.',
  'help.guide.labels.step.1': 'Open het labelbeheer via het labelelement in de filterrij.',
  'help.guide.labels.step.2':
    'Typ een naam, kies een kleur en klik op Label toevoegen. Hernoem, herkleur of verwijder bestaande labels in hetzelfde dialoogvenster.',
  'help.guide.labels.step.3':
    'Zet Kiezen aan, vink de plekken aan en klik op Label toewijzen in de selectiebalk. Een enkele plek krijgt ook labels via Bewerken op zijn detailblad.',
  'help.guide.labels.step.4':
    'Kies een of meer labels in de filterrij om de lijst en de kaart te beperken tot plekken die een ervan dragen.',
  'help.guide.labels.result':
    'Gelabelde plekken tonen hun labels op de rij; het labelfilter is er voor elk lid, ook voor kijkers.',
  'help.guide.labels.tip.1':
    'Labels horen bij de ene lijst waarin ze zijn gemaakt. Een plek naar een andere lijst verplaatsen laat ze vallen.',
  'help.guide.labels.tip.2': 'Labels beheren en toewijzen vereist bewerkrechten op de lijst.',
  // filter-select
  'help.guide.filter-select.title': 'Plekken filteren en selecteren',
  'help.guide.filter-select.goal': 'Perk de lijst in en doe iets met veel plekken tegelijk.',
  'help.guide.filter-select.step.1':
    'Gebruik de keuzemenu’s in de filterrij: status, categorie, minimale beoordeling en sorteervolgorde. Elk laat zien hoeveel plekken het zou overlaten.',
  'help.guide.filter-select.step.2':
    'Klik op Kiezen. Elke rij krijgt een selectievakje en er verschijnt een selectiebalk.',
  'help.guide.filter-select.step.3':
    'Vink plekken aan of gebruik Alles selecteren voor alles wat nu gefilterd is, en kies dan Label toewijzen, Naar lijst verplaatsen, Naar lijst dupliceren, Naar reis kopiëren of Verwijderen.',
  'help.guide.filter-select.result':
    'De acties gelden voor de hele selectie in één keer. De × rechts verlaat de selectiemodus.',
  'help.guide.filter-select.tip.1':
    'Alles selecteren volgt het filter, dus filteren op Wil heen en alles selecteren is de snelle weg om de shortlist aan te pakken.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Plekken naar een reis kopiëren',
  'help.guide.copy-to-trip.goal': 'Maak van opgeslagen plekken stops op een van je reizen.',
  'help.guide.copy-to-trip.step.1':
    'Zet Kiezen aan en vink de plekken aan, of open één plek en gebruik Naar reis kopiëren op zijn detailblad.',
  'help.guide.copy-to-trip.step.2': 'Klik op Naar reis kopiëren in de selectiebalk.',
  'help.guide.copy-to-trip.step.3': 'Kies de reis. Het zoekvak perkt een lange lijst in.',
  'help.guide.copy-to-trip.result':
    'De plekken landen in de plekkenlijst van die reis met naam, beschrijving, categorie, notities, prijs, coördinaten, foto en tags. In de collectie verandert niets.',
  'help.guide.copy-to-trip.tip.1':
    'Kijkers van een gedeelde lijst kunnen dit ook; het kopieert uit de lijst, het verandert de lijst niet.',
  // share-list
  'help.guide.share-list.title': 'Een lijst met iemand delen',
  'help.guide.share-list.goal': 'Plan een lijst live samen met andere mensen op deze TREK.',
  'help.guide.share-list.step.1': 'Klik op Delen in de kop van je lijst.',
  'help.guide.share-list.step.2': 'Selecteer de gebruiker en een rol: Kijker, Bewerker of Beheerder.',
  'help.guide.share-list.step.3':
    'Klik op Uitnodiging sturen. De persoon staat als uitnodiging in afwachting tot hij of zij de uitnodiging in de eigen lijstenbalk accepteert.',
  'help.guide.share-list.result':
    'Na acceptatie verschijnt de lijst bij die persoon onder Gedeeld en synchroniseert elke wijziging live. Leden en hun rollen blijven in hetzelfde dialoogvenster te bewerken.',
  'help.guide.share-list.tip.1':
    'Kijkers kunnen kijken, beoordelen en plekken naar hun eigen reizen kopiëren. Bewerkers voegen plekken en labels toe en bewerken ze. Beheerders kunnen ook verwijderen.',
  'help.guide.share-list.tip.2':
    'Alleen de eigenaar nodigt mensen uit en verwijdert ze; een lid kan een gedeelde lijst zelf verlaten.',
  // export-list
  'help.guide.export-list.title': 'Een lijst als bestand exporteren',
  'help.guide.export-list.goal': 'Geef een lijst aan iemand op een andere TREK, of neem hem mee naar een kaarten-app.',
  'help.guide.export-list.step.1': 'Klik op Exporteren in de kop van de lijst.',
  'help.guide.export-list.step.2':
    'Kies TREK-lijst voor een andere TREK, met labels en status, of GPX voor OsmAnd, Organic Maps, een Garmin en andere apps die waypoints lezen.',
  'help.guide.export-list.result': 'Het bestand wordt gedownload. Elk lid van een gedeelde lijst mag hem exporteren.',
  'help.guide.export-list.tip.1':
    'Een plek zonder coördinaten kan geen GPX-waypoint zijn; hij wordt weggelaten en TREK vertelt je hoeveel dat er waren.',
  'help.guide.export-list.tip.2':
    'Beoordelingen, leden en geüploade foto’s blijven bewust achter; ze horen bij deze TREK, niet bij de lijst.',
  // import-file
  'help.guide.import-file.title': 'Een lijst uit een bestand importeren',
  'help.guide.import-file.goal':
    'Haal een TREK-lijstbestand of een GPX-bestand binnen, als nieuwe lijst of in een lijst die je al hebt.',
  'help.guide.import-file.step.1': 'Klik op de importknop met de uploadpijl naast Nieuwe lijst in de lijstenbalk.',
  'help.guide.import-file.step.2':
    'Kies het bestand. TREK laat zien wat erin zit voordat er iets gebeurt: de naam, hoeveel plekken en labels.',
  'help.guide.import-file.step.3':
    'Laat Nieuwe lijst staan en verander de naam als je wilt, of kies Aan een lijst toevoegen om de plekken in een lijst te zetten die je kunt bewerken, en klik dan op Importeren.',
  'help.guide.import-file.result':
    'Je komt op de lijst met de geïmporteerde plekken. Aan een lijst toevoegen voegt alleen maar toe; plekken die er al staan houden hun status, notities en labels.',
  'help.guide.import-file.tip.1':
    'Uit een GPX wordt elk benoemd waypoint een plek; tracks zijn lijnen en worden weggelaten, en het voorbeeld zegt hoeveel punten dat waren.',
  'help.guide.import-file.tip.2':
    'Een bestand dat noch een TREK-lijst noch een GPX is, wordt met een reden geweigerd; een enkele onleesbare plek wordt overgeslagen, niet het hele bestand.',
  // edit-list
  'help.guide.edit-list.title': 'Een lijst bewerken of verwijderen',
  'help.guide.edit-list.goal':
    'Verander de naam, kleur, omslag, beschrijving of links van een lijst, of haal de lijst weg.',
  'help.guide.edit-list.step.1': 'Klik op Bewerken in de kop van de lijst. Alleen de eigenaar ziet het.',
  'help.guide.edit-list.step.2':
    'Verander wat je wilt en klik op Opslaan. Lijst verwijderen linksonder haalt de lijst met al zijn plekken weg, na een bevestiging.',
  'help.guide.edit-list.result': 'De kop neemt de nieuwe kleur, omslag en beschrijving meteen over.',
  'help.guide.edit-list.tip.1':
    'Een lijst verwijderen kan niet ongedaan worden gemaakt. Exporteer hem eerst als je een kopie wilt bewaren.',
  // all-saved
  'help.guide.all-saved.title': 'Je hele bibliotheek doorzoeken',
  'help.guide.all-saved.goal': 'Kijk in één keer over elke lijst die van jou is.',
  'help.guide.all-saved.step.1':
    'Klik op Alle opgeslagen in de lijstenbalk. Het voegt de plekken samen van elke lijst waarvan je eigenaar of mede-eigenaar bent.',
  'help.guide.all-saved.step.2':
    'Gebruik het zoekvak en de filters zoals op elke lijst; Kiezen werkt hier ook, om naar een reis te kopiëren.',
  'help.guide.all-saved.result':
    'Eén weergave over al je opgeslagen plekken, zonder toevoegen of importeren, omdat er geen enkele lijst is om ze op te zetten.',
  'help.guide.all-saved.tip.1': 'Labels zijn per lijst, dus het labelfilter wordt op Alle opgeslagen niet aangeboden.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Reisverslag',
  'help.ctx.journey.summary':
    'Reisverslag is je reisdagboek met de foto’s voorop. Elk reisverslag hangt aan een of meer reizen en groeit dag na dag uit vermeldingen met een verhaal, foto’s, stemming en weer. Dit scherm toont je reisverslagen; open er een om te schrijven.',
  'help.ctx.journey.bullet.1':
    'De banner bovenaan toont het lopende reisverslag, of je nieuwste, met zijn aantallen vermeldingen, foto’s en plekken. Verder schrijven opent het op vandaag.',
  'help.ctx.journey.bullet.2':
    'Daaronder één kaart per reisverslag met omslag, ondertitel, data en aantallen. Klik op een kaart om het te openen.',
  'help.ctx.journey.bullet.3':
    'De laatste kaart in het raster, Nieuw reisverslag aanmaken, start er een uit je reizen.',
  // create-journey
  'help.guide.create-journey.title': 'Een reisverslag aanmaken',
  'help.guide.create-journey.goal':
    'Een dagboek voor een reis beginnen, met de plekken van de reis al klaar als suggesties.',
  'help.guide.create-journey.step.1': 'Klik op Nieuw reisverslag aanmaken, de laatste kaart in het raster.',
  'help.guide.create-journey.step.2':
    'Geef het een naam en, als je wilt, een ondertitel, en vink de reizen aan waar het bij hoort. De teller zegt hoeveel plekken erin komen.',
  'help.guide.create-journey.step.3': 'Klik op Reisverslag aanmaken.',
  'help.guide.create-journey.result':
    'Het dagboek opent. Elke plek van de gekoppelde reizen staat als suggestie in de tijdlijn, één per dag waarop hij valt, klaar om over te schrijven.',
  'help.guide.create-journey.tip.1': 'Meer reizen koppel je later via Reisverslaginstellingen.',
  'help.guide.create-journey.tip.2':
    'Een reisverslag zonder reizen werkt ook; je voegt vermeldingen dan met de hand toe.',
  // open-journey
  'help.guide.open-journey.title': 'Een reisverslag openen',
  'help.guide.open-journey.goal': 'In een dagboek komen, en weten waar het opent.',
  'help.guide.open-journey.step.1':
    'Klik op een kaart. Elke kaart toont de omslag, de data en hoeveel vermeldingen, foto’s en plekken het reisverslag bevat.',
  'help.guide.open-journey.result':
    'Een lopend reisverslag opent op vandaag, of op de laatste vermelding vóór vandaag als er nog niets geschreven is; een afgerond verslag opent aan het begin.',
  'help.guide.open-journey.tip.1':
    'De omslag is de eerste foto van het reisverslag, tenzij je er een instelt in Reisverslaginstellingen.',
  // continue-writing
  'help.guide.continue-writing.title': 'Verder met het lopende reisverslag',
  'help.guide.continue-writing.goal': 'Meteen naar de pagina van vandaag van het reisverslag waar je middenin zit.',
  'help.guide.continue-writing.step.1':
    'Klik op Verder schrijven in de banner bovenaan. Die toont het lopende reisverslag, of het nieuwste als er geen loopt.',
  'help.guide.continue-writing.result':
    'Het dagboek opent op vandaag, of op de laatste vermelding vóór vandaag als er nog niets geschreven is.',
  'help.guide.continue-writing.tip.1':
    'De banner doet ook een suggestie voor een reis die nog geen reisverslag heeft; Sluiten verbergt die.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Dagboek',
  'help.ctx.journey-detail.summary':
    'Eén geopend reisverslag: links de tijdlijn, dag na dag, en rechts de kaart met elke vermelding en de plekken van de gekoppelde reizen. Alles wat iets aan het dagboek toevoegt zit bovenaan; de kop bevat de aantallen, Studio, de suggestieschakelaar en Reisverslaginstellingen.',
  'help.ctx.journey-detail.bullet.1':
    'Kop: omslag, titel en ondertitel, de aantallen dagen, plekken, vermeldingen en foto’s, en rechts Studio, de suggestieschakelaar en Reisverslaginstellingen.',
  'help.ctx.journey-detail.bullet.2':
    'Werkbalk: de tabbladen Tijdlijn en Galerij, Zoeken in deze reis en Vermelding toevoegen.',
  'help.ctx.journey-detail.bullet.3':
    'Tijdlijn: één sectie per dag met een + om op die dag een vermelding toe te voegen; vermeldingskaarten met foto’s, stemming, weer en verhaal; suggesties uit de reizen in een lichtere stijl, met Deze suggestie verwerpen.',
  'help.ctx.journey-detail.bullet.4':
    'Kaart: vermeldingen als spelden, in datumvolgorde verbonden door een stippellijn, de plekken van de reizen en alle GPX-tracks die in die reizen zijn geïmporteerd.',
  'help.ctx.journey-detail.bullet.5':
    'Reisverslaginstellingen: omslag, naam en ondertitel, tracks op de kaart, velden van het item, verworpen suggesties, gekoppelde reizen, bijdragers, openbaar delen, archiveren en verwijderen.',
  'help.ctx.journey-detail.bullet.6':
    'Twee ronde knoppen zweven boven een lange tijdlijn: terug naar boven, en spring naar de laatste vermelding.',
  // add-entry
  'help.guide.add-entry.title': 'Een vermelding schrijven',
  'help.guide.add-entry.goal': 'Het verhaal van een dag toevoegen met titel, tekst, stemming en weer.',
  'help.guide.add-entry.step.1':
    'Klik op Vermelding toevoegen in de werkbalk, of op de + in de kop van een dag om op die dag te beginnen.',
  'help.guide.add-entry.step.2':
    'Geef het moment een naam en schrijf het verhaal. De balk boven de tekst voegt vet, cursief, koppen, citaten, links en lijsten toe in Markdown.',
  'help.guide.add-entry.step.3':
    'Kies een stemming en het weer, controleer de datum en zet als je wilt een locatie vast: zoek een plek of gebruik je huidige positie.',
  'help.guide.add-entry.step.4': 'Klik op Opslaan.',
  'help.guide.add-entry.result':
    'De vermelding verschijnt op zijn dag in de tijdlijn en als speld op de kaart. De aantallen in de kop worden bijgewerkt.',
  'help.guide.add-entry.tip.1': 'In een suggestie schrijven is dezelfde editor, met de plek al ingevuld.',
  'help.guide.add-entry.tip.2':
    'Tags onderaan zijn vrije tekst, verborgen parel of beste maaltijd, en de zoekfunctie vindt ze.',
  // entry-photos
  'help.guide.entry-photos.title': 'Foto’s en video’s aan een vermelding toevoegen',
  'help.guide.entry-photos.goal': 'Beelden op een dag zetten; de eerste wordt de omslag van de vermelding.',
  'help.guide.entry-photos.step.1': 'Open het menu van een vermelding met de ⋯ op zijn kaart en kies Bewerken.',
  'help.guide.entry-photos.step.2':
    'Klik op Foto’s uploaden en kies de bestanden. Uit galerij neemt beelden die al in de galerij van het reisverslag staan; External photos doorzoekt een gekoppelde Immich- of Synology-bibliotheek voor die dag.',
  'help.guide.entry-photos.step.3':
    'Beweeg over een beeld voor Maak 1e om de omslag te kiezen, en klik dan op Opslaan.',
  'help.guide.entry-photos.result': 'De foto’s staan op de kaart en in de galerij; de eerste is overal de miniatuur.',
  'help.guide.entry-photos.tip.1':
    'Video’s gaan op dezelfde manier op een vermelding: mp4, m4v, webm of mov tot 500 MB, opgeslagen zoals geüpload.',
  'help.guide.entry-photos.tip.2':
    'HEIC-bestanden van een iPhone worden bij het uploaden naar JPEG omgezet, waardoor hun GPS- en camerametadata verdwijnen.',
  // suggestions
  'help.guide.suggestions.title': 'Suggesties gebruiken of verwerpen',
  'help.guide.suggestions.goal':
    'De plekken van je reizen omzetten in vermeldingen, en de plekken opruimen waarover je niet gaat schrijven.',
  'help.guide.suggestions.step.1':
    'Een suggestie is een lichtere kaart met de plaatsnaam cursief. Klik erop om de editor te openen met plek en dag al ingevuld.',
  'help.guide.suggestions.step.2':
    'Klik op Deze suggestie verwerpen bij een kaart die je niet gebruikt. Ze verlaat de tijdlijn zonder verwijderd te worden, en de reissynchronisatie biedt ze niet opnieuw aan.',
  'help.guide.suggestions.step.3':
    'Van gedachten veranderd? Reisverslaginstellingen toont hoeveel er verworpen zijn, en Verworpen suggesties terughalen brengt ze allemaal terug.',
  'help.guide.suggestions.result':
    'De tijdlijn bevat alleen wat je echt wilt schrijven; de schakelaar in de kop verbergt alle suggesties in één keer terwijl je leest.',
  'help.guide.suggestions.tip.1': 'Een plek die twee dagen beslaat geeft op elk van die dagen een suggestie.',
  'help.guide.suggestions.tip.2':
    'Suggesties tellen nooit mee in de statistieken; alleen geschreven vermeldingen tellen.',
  // add-on-day
  'help.guide.add-on-day.title': 'Een vermelding op een eerdere dag toevoegen',
  'help.guide.add-on-day.goal': 'Schrijven over een dag die al voorbij is zonder achteraf de datum te corrigeren.',
  'help.guide.add-on-day.step.1': 'Klik op de + in de kop van die dag.',
  'help.guide.add-on-day.step.2': 'De editor opent met die datum ingesteld. Schrijf en Opslaan zoals altijd.',
  'help.guide.add-on-day.result': 'De vermelding komt meteen op de juiste dag terecht.',
  'help.guide.add-on-day.tip.1':
    'Binnen een dag verplaatsen de pijlen in het menu van een vermelding hem naar voren of naar achteren.',
  // pros-cons
  'help.guide.pros-cons.title': 'Een oordeel toevoegen',
  'help.guide.pros-cons.goal': 'Een dag samenvatten met wat geweldig was en wat niet.',
  'help.guide.pros-cons.step.1':
    'Zoek in de editor Voor- & nadelen onder het verhaal. Typ een punt in Voordelen of Nadelen en gebruik Nog een toevoegen voor de volgende.',
  'help.guide.pros-cons.step.2': 'Opslaan. Het oordeel staat op de kaart als twee korte lijsten.',
  'help.guide.pros-cons.result': 'Duim omhoog en duim omlaag in één oogopslag, onder het verhaal.',
  'help.guide.pros-cons.tip.1':
    'Een reisverslag dat geen oordelen gebruikt, kan de sectie uitschakelen onder Velden van het item in Reisverslaginstellingen.',
  // search-journey
  'help.guide.search-journey.title': 'Iets vinden in een lang dagboek',
  'help.guide.search-journey.goal': 'Bij de vermelding komen die je bedoelt zonder door weken te scrollen.',
  'help.guide.search-journey.step.1':
    'Typ in Zoeken in deze reis in de werkbalk. De tijdlijn filtert terwijl je typt, over titels, verhalen, plekken en tags. Accenten en hoofdletters maken niet uit.',
  'help.guide.search-journey.step.2':
    'De suggestieschakelaar in de kop verbergt de ongeschreven kaarten terwijl je leest. Zodra de tijdlijn lang is, zweven twee ronde knoppen boven de onderrand: terug naar boven, en spring naar de laatste vermelding.',
  'help.guide.search-journey.result':
    'Alleen passende vermeldingen blijven staan; maak het vak leeg om weer alles te zien.',
  'help.guide.search-journey.tip.1':
    'Een lopend reisverslag opent op vandaag, dus de huidige pagina is meestal al in beeld.',
  'help.guide.search-journey.tip.2':
    'Tags tellen ook mee: zoeken op verborgen parel vindt elke vermelding met die tag.',
  // gallery-map
  'help.guide.gallery-map.title': 'De galerij en de kaart bekijken',
  'help.guide.gallery-map.goal': 'Het hele reisverslag zien als beelden, en als plekken op de kaart.',
  'help.guide.gallery-map.step.1':
    'Schakel in de werkbalk naar Galerij: elke foto van elke vermelding, plus beelden die rechtstreeks naar de galerij zijn geüpload. Klik op een foto voor de lightbox.',
  'help.guide.gallery-map.step.2':
    'De kaart rechts toont de vermeldingen als spelden in datumvolgorde, de plekken van de gekoppelde reizen en elke GPX-track die in die reizen is geïmporteerd, in de kleur die hij in de planner heeft.',
  'help.guide.gallery-map.result':
    'Beweeg over een track voor zijn naam. De stippellijn tussen vermeldingen tekent TREK; een track is de route die je echt hebt opgenomen.',
  'help.guide.gallery-map.tip.1': 'Tracks kun je per reisverslag uitschakelen onder Reisverslaginstellingen.',
  'help.guide.gallery-map.tip.2':
    'Galerijfoto’s met een locatie verschijnen ook op de openbare kaart, als Galerij en Kaart allebei gedeeld zijn.',
  // entry-fields
  'help.guide.entry-fields.title': 'Velden van het item uitschakelen',
  'help.guide.entry-fields.goal': 'De editor beperken tot wat dit reisverslag gebruikt.',
  'help.guide.entry-fields.step.1': 'Open Reisverslaginstellingen vanuit de kop.',
  'help.guide.entry-fields.step.2': 'Schakel onder Velden van het item Stemming, Weer of Plus- en minpunten uit.',
  'help.guide.entry-fields.result':
    'De editor vraagt er niet meer om. Niets wat je schreef gaat verloren: een veld weer inschakelen brengt de opgeslagen waarden terug in beeld, en een gedeeld reisverslag verbergt dezelfde velden.',
  'help.guide.entry-fields.tip.1':
    'De schakelaars gelden per reisverslag, dus een werkreis en een vakantie mogen verschillen.',
  // link-trip
  'help.guide.link-trip.title': 'Nog een reis koppelen',
  'help.guide.link-trip.goal': 'De plekken van een tweede reis als suggesties in het dagboek halen.',
  'help.guide.link-trip.step.1': 'Open Reisverslaginstellingen vanuit de kop.',
  'help.guide.link-trip.step.2': 'Klik onder de gekoppelde reizen op Reis toevoegen.',
  'help.guide.link-trip.step.3': 'Kies de reis.',
  'help.guide.link-trip.result':
    'Zijn plekken komen als suggesties op hun dagen in de tijdlijn, en zijn GPX-tracks komen op de kaart.',
  'help.guide.link-trip.tip.1':
    'De × naast een gekoppelde reis ontkoppelt hem weer; vermeldingen die je schreef blijven staan.',
  'help.guide.link-trip.tip.2': 'Vermeldingen op een dag tellen maar één keer, hoeveel reizen die dag ook dekken.',
  // share-public
  'help.guide.share-public.title': 'Het reisverslag openbaar delen',
  'help.guide.share-public.goal': 'Mensen zonder TREK-account een alleen-lezen-link geven.',
  'help.guide.share-public.step.1': 'Open Reisverslaginstellingen en zoek Openbaar delen.',
  'help.guide.share-public.step.2': 'Klik op Deellink aanmaken.',
  'help.guide.share-public.step.3':
    'Kies wat bezoekers zien: Tijdlijn, Galerij en Kaart zijn aparte schakelaars. Kopiëren zet de link op je klembord.',
  'help.guide.share-public.result':
    'Iedereen met de link ziet de ingeschakelde onderdelen en verder niets; velden die je onder Velden van het item hebt uitgeschakeld blijven daar ook verborgen.',
  'help.guide.share-public.tip.1':
    'Foto’s verschijnen alleen op de openbare kaart als Galerij en Kaart allebei aan staan; met Kaart uit worden hun coördinaten verwijderd voordat ze de server verlaten.',
  'help.guide.share-public.tip.2': 'Verwijder de link op dezelfde plek om het delen te beëindigen.',
  // contributors
  'help.guide.contributors.title': 'Samen schrijven',
  'help.guide.contributors.goal': 'Een reisgenoot eigen vermeldingen en foto’s laten toevoegen.',
  'help.guide.contributors.step.1': 'Open Reisverslaginstellingen en scrol naar de bijdragers.',
  'help.guide.contributors.step.2': 'Klik op Bijdrager uitnodigen en zoek de gebruiker op naam of e-mail.',
  'help.guide.contributors.step.3': 'Kies een rol en bevestig.',
  'help.guide.contributors.result':
    'Het reisverslag verschijnt in hun lijst en hun vermeldingen dragen hun naam. Verwijder een bijdrager met de × ernaast.',
  'help.guide.contributors.tip.1':
    'Bijdragers zijn voor mensen op deze TREK. Voor alle anderen is er de openbare link.',
  // studio
  'help.guide.studio.title': 'Het reisverslag opmaken als fotoboek',
  'help.guide.studio.goal': 'Het dagboek omzetten in afdrukbare pagina’s.',
  'help.guide.studio.step.1': 'Klik op Studio in de kop. De ontwerper opent boven op het reisverslag.',
  'help.guide.studio.step.2':
    'De naam van het reisverslag links in de bovenbalk is de weg terug; hij zet je af waar je was.',
  'help.guide.studio.result':
    'De paginastrook links, de spread op de werkbank, de eigenschappen rechts. Auto layout bouwt het boek uit je vermeldingen; Export maakt een drukklare PDF.',
  'help.guide.studio.tip.1':
    'Studio heeft een venster van minstens 1024 px breed nodig en wordt op een telefoon niet aangeboden.',
  'help.guide.studio.tip.2':
    'Het boek erft de toegang van het reisverslag: wie het reisverslag mag lezen mag het openen, wie mag bewerken mag opslaan.',
  // archive-journey
  'help.guide.archive-journey.title': 'Een reisverslag archiveren of verwijderen',
  'help.guide.archive-journey.goal': 'Een afgerond reisverslag afsluiten, of er een voorgoed verwijderen.',
  'help.guide.archive-journey.step.1': 'Open Reisverslaginstellingen.',
  'help.guide.archive-journey.step.2':
    'Helemaal onderaan beëindigt Reis archiveren het en markeert het als gearchiveerd; Reis herstellen brengt het terug. Verwijderen verwijdert het met alle vermeldingen en foto’s, na een bevestiging.',
  'help.guide.archive-journey.result':
    'Een gearchiveerd reisverslag blijft leesbaar en deelbaar; het opent alleen niet meer op vandaag.',
  'help.guide.archive-journey.tip.1':
    'Verwijderen kan niet ongedaan worden gemaakt, en het raakt de reizen waaraan het reisverslag gekoppeld was niet.',
  'help.guide.archive-journey.tip.2': 'Omslag, naam en ondertitel staan in hetzelfde dialoogvenster, bovenaan.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio',
  'help.ctx.journey-studio.summary':
    'TREK Studio zet een reisverslag op als een afdrukbaar fotoboek. Het opent boven het verslag: de paginalijst en de inhoud links, de dubbele pagina waaraan je werkt in het midden, de eigenschappen ervan rechts. Auto layout bouwt een eerste opzet uit je vermeldingen; alles daarna is van jou om te verplaatsen, bij te snijden en anders vorm te geven, met ongedaan maken voor elke stap.',
  'help.ctx.journey-studio.bullet.1':
    'Bovenbalk: Back to the journey, Book view, Undo en Redo, Page format, Auto layout en Export. Het teken Opgeslagen naast de titel vertelt je wanneer het boek is bewaard.',
  'help.ctx.journey-studio.bullet.2':
    'Kolom links met vijf secties: Pages, Content (de foto’s en vermeldingen van het reisverslag), Elements (tekst, vormen, lijnen, rasters, kaders, iconen), Reis (kaarten, landen, vlaggen en markeringen uit het reisverslag) en Layouts.',
  'help.ctx.journey-studio.bullet.3':
    'Werkblad: de huidige dubbele pagina met afloop en veilige marges, de zoombalk eronder, Fit to view en Deze dubbele pagina downloaden rechts.',
  'help.ctx.journey-studio.bullet.4':
    'Properties rechts: positie en grootte, uitsnede en focuspunt, vullen of passen, look, hoeken, kader, stapelvolgorde en vergrendeling van wat is geselecteerd; paginanummers en het document als niets is geselecteerd.',
  'help.ctx.journey-studio.bullet.5':
    'Het boek heeft de vorm van een gebonden boek: omslag, één losse eerste pagina, de dubbele pagina’s, één losse laatste pagina en de achterkant. Paginanummers tellen vanaf de eerste pagina en worden afgedrukt zoals getoond.',
  'help.ctx.journey-studio.bullet.6':
    'Meerdere mensen kunnen tegelijk ontwerpen: iedereen ziet de aanwijzers van de anderen met hun namen, en opslaan op een versie die iemand anders heeft gewijzigd komt terug als een conflict in plaats van diens werk te overschrijven.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Het boek automatisch opbouwen',
  'help.guide.studio-auto-layout.goal':
    'Krijg met één klik een complete eerste opzet uit de vermeldingen en foto’s van het verslag.',
  'help.guide.studio-auto-layout.step.1': 'Klik op Auto layout in de bovenbalk.',
  'help.guide.studio-auto-layout.step.2':
    'Kies Het hele boek: het vervangt elke pagina en behoudt je titel en pagina-instellingen. Deze pagina bouwt alleen die op het scherm opnieuw op, en wordt aangeboden op een dubbele pagina die uit een vermelding is ontstaan.',
  'help.guide.studio-auto-layout.step.3':
    'Loop de paginalijst door. Undo haalt de hele indeling terug als je liever had wat je had.',
  'help.guide.studio-auto-layout.result':
    'Eén dubbele pagina per vermelding, op volgorde, met foto’s, titel en verhaal voor je geplaatst. Elk element blijft zijn vermelding volgen tot je het bewerkt.',
  'help.guide.studio-auto-layout.tip.1': 'Beide opties zijn gewone stappen van ongedaan maken, dus probeer ze gerust.',
  'help.guide.studio-auto-layout.tip.2':
    'Een element dat Auto layout aan een vermelding heeft gekoppeld, volgt wijzigingen aan die vermelding tot je het in Properties aanraakt; dat verbreekt de koppeling.',
  // studio-pages
  'help.guide.studio-pages.title': 'Dubbele pagina’s toevoegen, verplaatsen en verwijderen',
  'help.guide.studio-pages.goal': 'Geef het boek pagina voor pagina vorm.',
  'help.guide.studio-pages.step.1':
    'Open Pages in de kolom. De miniaturen zijn het boek op volgorde: omslag, eerste pagina, dubbele pagina’s, laatste pagina, achterkant.',
  'help.guide.studio-pages.step.2':
    'Pagina toevoegen onderaan zet een nieuwe vóór de laatste pagina; de + tussen twee miniaturen voegt er precies daar een in.',
  'help.guide.studio-pages.step.3':
    'Beweeg over een miniatuur voor de acties: Naar voren, Naar achteren, Pagina dupliceren en Pagina verwijderen. Klik op een miniatuur om die dubbele pagina op het werkblad te openen.',
  'help.guide.studio-pages.result':
    'De omslag, de eerste en laatste pagina en de achterkant blijven waar ze zijn; nieuwe dubbele pagina’s landen altijd daartussen.',
  'help.guide.studio-pages.tip.1':
    'Book view in de bovenbalk toont het hele boek als vellen, zoals het gebonden wordt.',
  'help.guide.studio-pages.tip.2':
    'Paginanummers zet je aan onder Document in Properties, zonder dat er iets is geselecteerd.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Een layout op een dubbele pagina toepassen',
  'help.guide.studio-layouts.goal': 'Geef een dubbele pagina een kant-en-klare indeling van foto- en tekstkaders.',
  'help.guide.studio-layouts.step.1':
    'Open Layouts in de kolom. Dertien layouts voor dubbele pagina’s, en een aparte set voor de omslag, de achterkant en de losse pagina’s.',
  'help.guide.studio-layouts.step.2':
    'Klik er een aan. De dubbele pagina op het werkblad neemt de kaders over; foto’s en tekst die je al had, worden erin gegoten.',
  'help.guide.studio-layouts.result':
    'Lege kaders wachten op inhoud: sleep een foto uit Content erop, of gebruik Add to this page.',
  'help.guide.studio-layouts.tip.1': 'Een layout is een stap van ongedaan maken als elke andere.',
  // studio-content
  'help.guide.studio-content.title': 'Foto’s en vermeldingen op een pagina zetten',
  'help.guide.studio-content.goal': 'Breng het eigen materiaal van het reisverslag op de dubbele pagina.',
  'help.guide.studio-content.step.1':
    'Open Content in de kolom. Photos toont elke foto van het reisverslag; Entries toont de vermeldingen met hun tekst.',
  'help.guide.studio-content.step.2':
    "Sleep een foto op de dubbele pagina, of op een leeg kader, of klik op Add to this page eronder. Foto's uploaden voegt foto’s toe die nog niet in het reisverslag staan.",
  'help.guide.studio-content.step.3':
    'Onder een vermelding zetten Title, Story en Place die tekst als tekstelement op de pagina; Datum en de coördinaten komen als markeringen, en de foto’s van de vermelding staan daar meteen opgesomd.',
  'help.guide.studio-content.result':
    'Een neergezette foto wordt een foto-element; tekst blijft de vermelding volgen tot je hem bewerkt.',
  'help.guide.studio-content.tip.1': 'Het zoekvak bovenaan Content filtert beide lijsten.',
  'help.guide.studio-content.tip.2':
    'Een bestand van je bureaublad op het werkblad neerzetten uploadt het en plaatst het in één keer.',
  // studio-elements
  'help.guide.studio-elements.title': 'Tekst, vormen en iconen toevoegen',
  'help.guide.studio-elements.goal': 'Versier een dubbele pagina met meer dan foto’s en verhalen.',
  'help.guide.studio-elements.step.1': 'Open Elements in de kolom.',
  'help.guide.studio-elements.step.2':
    'Klik op een tekststijl voor een kop of een bijschrift, een vorm, een lijn, een raster, een leeg kader met een kaderstijl of een icoon uit de doorzoekbare bibliotheek. Elk landt in het midden van de dubbele pagina, klaar om te verplaatsen.',
  'help.guide.studio-elements.result':
    'Dubbelklik op een tekstelement om erin te typen; Properties bevat lettertype, gewicht, grootte, spatiëring en uitlijning.',
  'help.guide.studio-elements.tip.1': 'Kaders zijn lege fotoplekken: zet er later een foto in.',
  // studio-travel
  'help.guide.studio-travel.title': 'Een kaart, vlaggen en cijfers toevoegen',
  'help.guide.studio-travel.goal': 'Maak van de reis zelf cijfers op de pagina.',
  'help.guide.studio-travel.step.1': 'Open Reis in de kolom.',
  'help.guide.studio-travel.step.2':
    'Kies wat je toevoegt: een routekaart van de vermeldingen, landomtrekken, een landenlijst of landenraster, vlaggen, een datum-, dag- of afstandsmarkering, of een overzicht van de hele reis. Elk wordt gebouwd uit de gegevens van het reisverslag en vernieuwt daarmee mee.',
  'help.guide.studio-travel.result':
    'Het element verschijnt op de dubbele pagina; Properties past de stijl aan, en bij de kaart het gebied.',
  'help.guide.studio-travel.tip.1':
    'Markeringen volgen de vermelding waaruit de dubbele pagina is ontstaan, dus een datummarkering op een automatisch ingedeelde dubbele pagina toont die dag al.',
  // studio-properties
  'help.guide.studio-properties.title': 'Bewerken wat je hebt geselecteerd',
  'help.guide.studio-properties.goal': 'Verplaats, snijd bij, geef stijl en stapel een element met de inspector.',
  'help.guide.studio-properties.step.1':
    'Klik op een element op de dubbele pagina. Er verschijnen grepen voor grootte en rotatie; sleep het om het te verplaatsen.',
  'help.guide.studio-properties.step.2':
    'Properties rechts volgt de selectie: positie en grootte, Crop met het focuspunt dat bepaalt wat in het kader blijft, Fill of Fit, Look-filters, de hoekstraal onder Corner, de stijl onder Kader, stapelvolgorde en Lock.',
  'help.guide.studio-properties.step.3':
    'Dupliceren en Delete staan bovenaan de inspector; Undo in de bovenbalk draait alles ervan terug.',
  'help.guide.studio-properties.result':
    'Een vergrendeld element kun je op de pagina niet meer vastpakken, wat een afgeronde indeling veilig houdt terwijl je eromheen werkt.',
  'help.guide.studio-properties.tip.1': 'Shift-klik selecteert meerdere elementen; de inspector bewerkt ze dan samen.',
  'help.guide.studio-properties.tip.2':
    'Een element bewerken dat Auto layout heeft geplaatst, verbreekt de koppeling met de vermelding; het volgt latere wijzigingen aan die vermelding niet meer.',
  // studio-format
  'help.guide.studio-format.title': 'Het paginaformaat kiezen',
  'help.guide.studio-format.goal':
    'Stel de grootte in waarop het boek wordt gedrukt, voordat de indeling ervan afhangt.',
  'help.guide.studio-format.step.1': 'Klik op Page format in de bovenbalk.',
  'help.guide.studio-format.step.2':
    'Kies Square 21 × 21 cm, Square 30 × 30 cm, A4 of A5 landscape of portrait, of voer een eigen breedte en hoogte in millimeters in. Afloop en Veilig staan eronder.',
  'help.guide.studio-format.result':
    'Elke dubbele pagina wordt op die grootte getekend, standaard met 3 mm afloop en een veilige marge van 5 mm.',
  'help.guide.studio-format.tip.1':
    'Wijzig eerst het formaat en start dan Auto layout; de indeling wordt gebouwd voor de grootte die hij aantreft.',
  'help.guide.studio-format.tip.2': 'Vraag je drukker naar de waarden voor afloop en veilige marge en voer die in.',
  // studio-export
  'help.guide.studio-export.title': 'Het boek als PDF exporteren',
  'help.guide.studio-export.goal': 'Krijg een drukklaar bestand, of een om op het scherm te lezen.',
  'help.guide.studio-export.step.1': 'Klik op Export in de bovenbalk.',
  'help.guide.studio-export.step.2':
    'Kies Losse pagina’s, één blad per vel op leesvolgorde, wat een drukker wil, of Spreads, twee pagina’s tegelijk zoals het boek opengaat. Snijtekens voegen de afloop aan elke rand toe en markeren waar te snijden.',
  'help.guide.studio-export.step.3':
    'Klik op Afdrukweergave. Je browser opent de pagina’s en Opslaan als PDF maakt er het bestand van.',
  'help.guide.studio-export.result':
    'Een PDF met zoveel vellen als het venster aankondigde, op het paginaformaat dat je hebt ingesteld.',
  'help.guide.studio-export.tip.1': 'De PDF maken kan alleen op desktop, net als Studio zelf.',
  'help.guide.studio-export.tip.2':
    'Voor een proefdruk exporteer je Spreads zonder snijtekens; voor de drukkerij Losse pagina’s met snijtekens.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Een dubbele pagina in een ander boek hergebruiken',
  'help.guide.studio-spread-file.goal':
    'Neem een ontwerp dat je bevalt mee van het boek van het ene reisverslag naar het andere.',
  'help.guide.studio-spread-file.step.1':
    'Klik met de dubbele pagina op het werkblad op Deze dubbele pagina downloaden aan het rechteruiteinde van de zoombalk. Het bestand bevat het ontwerp, niet de foto’s.',
  'help.guide.studio-spread-file.step.2':
    'Open in het andere boek Pages en klik op Importeren naast Pagina toevoegen, kies dan het bestand.',
  'help.guide.studio-spread-file.result':
    'De dubbele pagina komt aan met de kaders en tekststijlen; zet de foto’s van het nieuwe reisverslag in de kaders.',
  'help.guide.studio-spread-file.tip.1':
    'Een bestand dat geen ontwerp van een dubbele pagina is, wordt met een reden geweigerd.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Instellingen',
  'help.ctx.settings.summary':
    'Je persoonlijke instellingen, één tabblad per onderwerp in de zijbalk links. De meeste schakelaars gelden zodra je ze omzet; een formulier met een knop Opslaan onderaan wacht daarop. Niets hier verandert de TREK van iemand anders.',
  'help.ctx.settings.bullet.1':
    'Zijbalk links: Weergave, Appearance, Kaart, Meldingen, Integraties, Offline en Account. Plug-ins verschijnt zodra er een is geïnstalleerd, Over daar waar de beheerder het niet heeft weggehaald.',
  'help.ctx.settings.bullet.2':
    'Weergave is taal, eenheden, valuta en waarmee de app opent; Appearance is thema, kleuren, tekstgrootte en de dashboardwidgets.',
  'help.ctx.settings.bullet.3':
    'Kaart kiest de renderer en zijn stijl; Meldingen de kanalen die je bereiken; Integraties fotobibliotheken, API-sleutels en MCP; Offline wat de app op dit apparaat bewaart.',
  'help.ctx.settings.bullet.4':
    'Account bevat je profiel, wachtwoord, tweefactorauthenticatie, passkeys en het verwijderen van je account.',
  'help.ctx.settings-display.title': 'Weergave',
  'help.ctx.settings-display.summary':
    'Taal, eenheden en valuta, hoe kaart en boekingen zich gedragen, en waarmee TREK opent. Elke wijziging hier geldt meteen.',
  'help.ctx.settings-display.bullet.1':
    'Language & region: de taal van de interface, de tijdnotatie, de eerste dag van de week, de weergavevaluta, en de eenheden voor afstand en temperatuur.',
  'help.ctx.settings-display.bullet.2':
    'Travel & map: boekingsroutes altijd op de kaart, de pil Plaatsen ontdekken, routeoptimalisatie vanaf je accommodatie, vervaagde boekingscodes en boekingsroutes met label.',
  'help.ctx.settings-display.bullet.3':
    'Opstarten: of TREK opent op het dashboard of op de actieve reis, en welk tabblad van een reis als eerste verschijnt.',
  'help.ctx.settings-appearance.title': 'Appearance',
  'help.ctx.settings-appearance.summary':
    'Hoe TREK eruitziet op dit account: licht of donker, de accentkleur, glas en beweging, tekstgrootte, en welke widgets het dashboard toont. Alles geldt live, op elk apparaat waarop je inlogt.',
  'help.ctx.settings-appearance.bullet.1':
    'Theme: Licht, Donker of Automatisch, en het Color scheme met een Custom accent van jezelf.',
  'help.ctx.settings-appearance.bullet.2':
    'Readability: Transparency, Reduce motion, Density en Text size, met geavanceerde groottes per niveau.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboard widgets: één schakelaar per widget, apart voor Desktop en Mobile.',
  'help.ctx.settings-appearance.bullet.4': 'Reset to defaults onderaan zet alles terug.',
  'help.ctx.settings-map.title': 'Kaart',
  'help.ctx.settings-map.summary':
    'Welke engine de kaarten tekent en in welke stijl. Leaflet is de klassieke rasterkaart, MapLibre tekent vectortegels zonder enig token, Mapbox voegt 3D-gebouwen en terrein toe met je eigen token.',
  'help.ctx.settings-map.bullet.1':
    'Kaartprovider: Leaflet, MapLibre of Mapbox, elk met een regel over wat hij nodig heeft.',
  'help.ctx.settings-map.bullet.2':
    'Kaartstijl en Kaartsjabloon: de look van de tegels, plus het token of de sleutel waar een provider om vraagt.',
  'help.ctx.settings-map.bullet.3':
    'Hoge kwaliteit modus voor antialiasing en de globeprojectie; Kaart opslaan legt de keuze vast.',
  'help.ctx.settings-notifications.title': 'Meldingen',
  'help.ctx.settings-notifications.summary':
    'Waar TREK je buiten de app bereikt: pushmeldingen op dit apparaat, een ntfy-onderwerp, een webhook of een kanaal dat een plug-in levert. Onder de kanalen bepaalt één rij per gebeurtenis wat waarheen gaat.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: het onderwerp, optioneel een eigen server en een optioneel toegangstoken, met Testen om er meteen een te sturen.',
  'help.ctx.settings-notifications.bullet.2': 'Webhook: één URL die elke gebeurtenis als JSON ontvangt, met Testen.',
  'help.ctx.settings-notifications.bullet.3':
    'Pushmeldingen op dit apparaat: Inschakelen op dit apparaat geldt alleen voor de browser die je nu gebruikt, dus herhaal het op elke telefoon of computer. Test versturen bereikt ze allemaal.',
  'help.ctx.settings-notifications.bullet.4':
    'De voorkeursrijen: per gebeurtenis welk kanaal aan staat. Plug-inkanalen tonen Instellen tot ze zijn ingesteld.',
  'help.ctx.settings-integrations.title': 'Integraties',
  'help.ctx.settings-integrations.summary':
    'Alles wat van buitenaf met TREK verbindt: fotobibliotheken voor het reisverslag, API-sleutels voor scripts, en het MCP-eindpunt met zijn tokens en OAuth-clients voor AI-assistenten.',
  'help.ctx.settings-integrations.bullet.1':
    'Fotoproviders: Immich en Synology Photos, elk met zijn URL en sleutel, Verbinding testen en Opslaan.',
  'help.ctx.settings-integrations.bullet.2':
    'API-sleutels: persoonlijke sleutels voor scripts en andere tools die de TREK-API uit jouw naam aanroepen.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP-configuratie: het eindpunt, een kant-en-klare clientconfiguratie om te kopiëren, en de API-tokens.',
  'help.ctx.settings-integrations.bullet.4':
    'OAuth 2.1-clients: apps die via TREK inloggen, met redirect-URI’s, toegestane rechten, machineclients en de actieve sessies.',
  'help.ctx.settings-offline.title': 'Offline',
  'help.ctx.settings-offline.summary':
    'Wat TREK op dit apparaat bewaart zodat een reis ook zonder verbinding opent, en wat er gebeurt als een offline gemaakte wijziging botst met een die elders is gemaakt.',
  'help.ctx.settings-offline.bullet.1':
    'Offlinemodus: Offlinemodus forceren laat de app doen alsof het netwerk weg is, om te testen of op een verbinding met datalimiet.',
  'help.ctx.settings-offline.bullet.2':
    'Voorbereiden op offline: Downloaden voor offline gebruik haalt je reizen en hun kaarttegels nu op.',
  'help.ctx.settings-offline.bullet.3': 'Wat offline opslaan: kaarttegels aan of uit, en een schakelaar per reis.',
  'help.ctx.settings-offline.bullet.4':
    'Synchronisatieconflicten en Offline cache: de strategie bij botsingen, het aantal wachtende en mislukte wijzigingen, Nu opnieuw synchroniseren en Cache wissen.',
  'help.ctx.settings-account.title': 'Account',
  'help.ctx.settings-account.summary':
    'Wie je bent op deze TREK en hoe je inlogt: profiel en avatar, wachtwoord, tweefactorauthenticatie, passkeys, en helemaal onderaan het verwijderen van het account.',
  'help.ctx.settings-account.bullet.1': 'Profiel: gebruikersnaam, e-mail en avatar, opgeslagen met Profiel opslaan.',
  'help.ctx.settings-account.bullet.2':
    'Wachtwoord wijzigen: huidig wachtwoord, nieuw wachtwoord twee keer, Wachtwoord bijwerken.',
  'help.ctx.settings-account.bullet.3':
    'Tweefactorauthenticatie (2FA) met een authenticator-app en back-upcodes; Passkeys om in te loggen zonder wachtwoord.',
  'help.ctx.settings-account.bullet.4':
    'Account verwijderen onderaan, achter een bevestiging. De laatste beheerder kan zichzelf niet verwijderen.',
  // language-region
  'help.guide.language-region.title': 'Taal, eenheden en valuta instellen',
  'help.guide.language-region.goal': 'Laat TREK jouw taal spreken en tellen zoals jij.',
  'help.guide.language-region.step.1':
    'Kies de taal van de interface in Language & region. TREK schakelt meteen om, op elk apparaat waarop je inlogt.',
  'help.guide.language-region.step.2':
    'Daaronder kies je de tijdnotatie, de dag waarop de week in elke datumkiezer begint, de weergavevaluta, en de eenheden voor afstand en temperatuur.',
  'help.guide.language-region.result':
    'Datums, afstanden en geld lezen zoals je verwacht; de eigen valuta van een reis staat nog steeds naast omgerekende bedragen.',
  'help.guide.language-region.tip.1':
    'De weergavevaluta is voor totalen over reizen heen; elke reis houdt de valuta die je hem gaf.',
  'help.guide.language-region.tip.2': 'De taal bepaalt ook de dag- en maandnamen in Vacay en het reisverslag.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Afstellen hoe kaart en boekingen zich gedragen',
  'help.guide.travel-map-prefs.goal': 'Bepaal wat de reiskaart standaard toont.',
  'help.guide.travel-map-prefs.step.1':
    'In Travel & map houdt Boekingsroutes altijd tonen vluchten en treinen op de kaart, ook als hun dag niet open is; Plaatsen op de kaart ontdekken toont de pil om plaatsen te vinden; Route optimaliseren vanaf accommodatie laat de route beginnen waar je slaapt.',
  'help.guide.travel-map-prefs.step.2':
    'Boekingscodes vervagen verbergt bevestigingsnummers tot je eroverheen beweegt; Routelabels voor boekingen schrijft de naam van de boeking langs zijn route.',
  'help.guide.travel-map-prefs.result': 'De reiskaart volgt dit op elke reis, tot je het weer terugzet.',
  'help.guide.travel-map-prefs.tip.1':
    'Dit is per account, niet per reis. Leden van een gedeelde reis zien elk hun eigen keuzes.',
  // startup
  'help.guide.startup.title': 'Kiezen waarmee TREK opent',
  'help.guide.startup.goal': 'Land waar je het meest werkt, niet elke keer op het dashboard.',
  'help.guide.startup.step.1': 'Zet onder Opstarten de Startpagina op Dashboard of Actieve reis.',
  'help.guide.startup.step.2':
    'Starttabblad kiest welk tabblad van een reis als eerste verschijnt als je er een opent.',
  'help.guide.startup.result': 'De volgende keer inloggen en de volgende tik op het logo gaan er meteen heen.',
  'help.guide.startup.tip.1': 'Actieve reis is de reis die vandaag loopt, of de volgende als er geen loopt.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Het thema en de accentkleur instellen',
  'help.guide.theme-scheme.goal': 'Maak TREK licht, donker of gelijk aan je apparaat, in de kleur die jij mooi vindt.',
  'help.guide.theme-scheme.step.1': 'Kies onder Theme Licht, Donker of Automatisch. Automatisch volgt je apparaat.',
  'help.guide.theme-scheme.step.2':
    'Kies een Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet of Custom.',
  'help.guide.theme-scheme.step.3':
    'Met Custom kies je een accent uit de voorinstellingen of voer je je eigen in. Een contrastcheck ernaast zegt of tekst erop leesbaar blijft.',
  'help.guide.theme-scheme.result':
    'Knoppen, links en markeringen nemen het accent overal over, op elk apparaat waarop je inlogt.',
  'help.guide.theme-scheme.tip.1':
    'De navigatiebalk heeft ook een snelle licht-of-donkerschakelaar; die stelt hetzelfde thema in.',
  'help.guide.theme-scheme.tip.2': 'High contrast is het schema om te kiezen als de standaard te zacht leest.',
  // readability
  'help.guide.readability.title': 'Leesbaarheid en tekstgrootte aanpassen',
  'help.guide.readability.goal': 'Minder glas, minder beweging, meer ruimte of grotere letters.',
  'help.guide.readability.step.1':
    'Onder Readability zet Transparency de glazen panelen om in dichte vlakken, Reduce motion beperkt animaties tot een minimum, en Density kiest Comfortable of Compact.',
  'help.guide.readability.step.2':
    'Text size schaalt Everything in één keer; Advanced text sizes laat titels, ondertitels, lopende tekst en bijschriften verschillen.',
  'help.guide.readability.result': 'De hele app volgt meteen, inclusief de kaartpanelen en het reisverslag.',
  'help.guide.readability.tip.1': 'Reduce motion volgt ook de instelling van je systeem als je er vanaf blijft.',
  'help.guide.readability.tip.2':
    'De tekstgrootte gaat via de typografische niveaus, dus er wordt niets afgesneden; een grootte die niet meer past, loopt door naar de volgende regel.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'De dashboardwidgets kiezen',
  'help.guide.dashboard-widgets.goal': 'Toon alleen de widgets die je gebruikt, apart op desktop en op de telefoon.',
  'help.guide.dashboard-widgets.step.1':
    'Zet onder Dashboard widgets elke widget aan of uit voor Desktop en voor Mobile: de rechterzijbalk als geheel, valuta, collecties, tijdzones, komende reserveringen, Atlas-landen en de reiscijfers.',
  'help.guide.dashboard-widgets.step.2':
    'Reset to defaults onderaan zet het hele tabblad terug zoals het geleverd werd.',
  'help.guide.dashboard-widgets.result':
    'Het dashboard schikt zich meteen opnieuw; met de rechterzijbalk uit centreert het.',
  'help.guide.dashboard-widgets.tip.1':
    'Widgets van een add-on verschijnen alleen zolang de beheerder die add-on aan heeft.',
  'help.guide.dashboard-widgets.tip.2':
    'Het dashboard zelf onthoudt je raster- of lijstweergave en de sorteervolgorde per apparaat.',
  // map-provider
  'help.guide.map-provider.title': 'De kaartengine en stijl kiezen',
  'help.guide.map-provider.goal': 'Wissel tussen de klassieke kaart, vectortegels en de 3D-kaart van Mapbox.',
  'help.guide.map-provider.step.1':
    'Kies onder Kaartprovider Leaflet voor de klassieke 2D-kaart met willekeurige rastertegels, MapLibre voor OpenFreeMap-vectortegels zonder token, of Mapbox voor vectortegels met 3D-gebouwen en terrein.',
  'help.guide.map-provider.step.2':
    'Kies een Kaartstijl of een Kaartsjabloon voor de look. Mapbox heeft een Mapbox Access Token nodig, sommige rasterstijlen een CARTO API-sleutel; de link naast het veld leidt naar waar je er een krijgt.',
  'help.guide.map-provider.step.3':
    'Hoge kwaliteit modus voegt antialiasing en de globeprojectie toe. Klik op Kaart opslaan.',
  'help.guide.map-provider.result':
    'Elke kaart in TREK, reizen, Atlas, Collecties en het reisverslag, wordt getekend door de engine die je koos.',
  'help.guide.map-provider.tip.1': 'Zonder token valt Mapbox terug op de standaardkaart in plaats van niets te tonen.',
  'help.guide.map-provider.tip.2':
    'De kaarttegels die je offline opslaat, komen van de provider die actief is als je ze downloadt.',
  // notification-channels
  'help.guide.notification-channels.title': 'Instellen waar meldingen je bereiken',
  'help.guide.notification-channels.goal':
    'Ontvang reisherinneringen en samenwerkingsgebeurtenissen op je telefoon of in een andere tool.',
  'help.guide.notification-channels.step.1':
    'Vul onder Meldingen een Ntfy-onderwerp in; voeg je eigen Ntfy-server-URL (optioneel) en een Toegangstoken (optioneel) toe als je er een draait. Testen stuurt meteen een bericht.',
  'help.guide.notification-channels.step.2':
    'Of geef een Webhook-URL op die elke gebeurtenis als JSON ontvangt, en test die op dezelfde manier met Testen.',
  'help.guide.notification-channels.step.3':
    'Zet in de rijen eronder elke gebeurtenis per kanaal aan of uit. Een plug-inkanaal zegt Instellen tot het in de instellingen van de plug-in is ingesteld; Test versturen probeert er een.',
  'help.guide.notification-channels.result':
    'Gebeurtenissen gaan uit via de kanalen die aan staan. De bel in de navigatiebalk blijft ze hoe dan ook in de app tonen.',
  'help.guide.notification-channels.tip.1':
    'Voorkeuren per reis staan op de reis zelf, onder zijn meldingsinstellingen.',
  'help.guide.notification-channels.tip.2':
    'De beheerder kan voor iedereen een standaard ntfy-server invullen; je eigen onderwerp kies je nog steeds zelf.',
  // photo-providers
  'help.guide.photo-providers.title': 'Een fotobibliotheek verbinden',
  'help.guide.photo-providers.goal': 'Laat het reisverslag de foto’s van de dag ophalen uit Immich of Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Zoek onder Integraties het gedeelte van de provider en vul zijn URL en API-sleutel in. Immich biedt ook aan om uploads van het reisverslag terug te spiegelen naar de bibliotheek.',
  'help.guide.photo-providers.step.2': 'Klik op Verbinding testen en dan op Opslaan.',
  'help.guide.photo-providers.result':
    'Het tabblad External photos van de vermeldingseditor doorzoekt de verbonden bibliotheek op de dag van de vermelding, de dichtstbijzijnde bij de locatie van de vermelding eerst.',
  'help.guide.photo-providers.tip.1':
    'De verbinding is van jou: andere leden van een reisverslag verbinden hun eigen bibliotheken.',
  'help.guide.photo-providers.tip.2':
    'Een provider zonder GPS-gegevens in zijn foto’s werkt ook; de lijst staat dan op tijdsvolgorde.',
  // api-keys
  'help.guide.api-keys.title': 'Een API-sleutel aanmaken',
  'help.guide.api-keys.goal': 'Laat een script of een andere tool de TREK-API als jou aanroepen.',
  'help.guide.api-keys.step.1':
    'Klik onder API-sleutels op Sleutel aanmaken en geef hem een naam die zegt waar hij gebruikt wordt.',
  'help.guide.api-keys.step.2':
    'Kopieer de sleutel uit het dialoogvenster: hij wordt één keer getoond. Verwijder een sleutel uit de lijst als de tool hem niet meer nodig heeft.',
  'help.guide.api-keys.result':
    'Verzoeken met die sleutel handelen met jouw rechten; de lijst toont wanneer elke sleutel is aangemaakt en voor het laatst gebruikt.',
  'help.guide.api-keys.tip.1': 'Eén sleutel per tool maakt intrekken pijnloos.',
  'help.guide.api-keys.tip.2':
    'Gebruik voor een AI-assistent liever MCP met OAuth; API-sleutels zijn voor gewone HTTP-clients.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Een AI-assistent via MCP verbinden',
  'help.guide.mcp-oauth.goal': 'Geef Claude, een IDE of een andere MCP-client toegang tot je reizen.',
  'help.guide.mcp-oauth.step.1':
    'Kopieer onder MCP-configuratie het MCP-eindpunt, of de hele Clientconfiguratie voor een client die een JSON-fragment aanneemt.',
  'help.guide.mcp-oauth.step.2':
    "Clients die via de browser inloggen gebruiken OAuth 2.1: Nieuwe client onder OAuth 2.1-clients, met zijn Redirect-URI's, de Toegestane rechten en, voor een server zonder browser, Machineclient.",
  'help.guide.mcp-oauth.step.3':
    'Geheim vernieuwen en Client verwijderen staan bij elke client; Actieve OAuth-sessies toont wat is ingelogd en laat je het intrekken. API-tokens met Nieuw token aanmaken is de oudere ingang.',
  'help.guide.mcp-oauth.result':
    'De client kan lezen en wijzigen wat zijn rechten toelaten, als jou, en elke actie verschijnt onder jouw naam.',
  'help.guide.mcp-oauth.tip.1':
    'Rechten zijn het vangnet: geef een client alleen het leesrecht tot hij meer nodig heeft.',
  'help.guide.mcp-oauth.tip.2': 'De beheerder kan MCP voor de hele instantie uitzetten; dan is dit gedeelte er niet.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Reizen offline meenemen',
  'help.guide.offline-prepare.goal': 'Heb je reizen en hun kaarten op dit apparaat voordat de verbinding wegvalt.',
  'help.guide.offline-prepare.step.1':
    'Laat onder Wat offline opslaan Kaarttegels offline opslaan aan en zet de reizen aan die je op dit apparaat wilt.',
  'help.guide.offline-prepare.step.2':
    'Klik op Downloaden voor offline gebruik onder Voorbereiden op offline. Dat haalt de reizen en de tegels rond hun plaatsen op.',
  'help.guide.offline-prepare.step.3':
    'Offlinemodus forceren onder Offlinemodus laat je controleren of alles er is voordat je vertrekt.',
  'help.guide.offline-prepare.result':
    'De reizen openen zonder verbinding; wijzigingen die je maakt wachten in een wachtrij en gaan uit bij het opnieuw verbinden.',
  'help.guide.offline-prepare.tip.1':
    'Tegels nemen de meeste ruimte in: het gedeelte Offline cache toont wat er is opgeslagen, per reis.',
  'help.guide.offline-prepare.tip.2': 'Installeer TREK als app vanuit de browser voor de soepelste offline start.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Bepalen wat wint bij een synchronisatieconflict',
  'help.guide.offline-conflicts.goal':
    'Kies hoe TREK een offline gemaakte wijziging afweegt tegen een die elders is gemaakt.',
  'help.guide.offline-conflicts.step.1':
    'Kies onder Synchronisatieconflicten Vraag het me elke keer, Altijd mijn versie behouden of Altijd de serverversie behouden.',
  'help.guide.offline-conflicts.step.2':
    'Offline cache toont reizen, wachtende en mislukte wijzigingen en conflicten; Nu opnieuw synchroniseren duwt de wachtrij door, Cache wissen maakt het apparaat leeg.',
  'help.guide.offline-conflicts.result':
    'Met Vraag het me toont een conflict beide versies en laat het je kiezen; met de andere twee wordt het stilletjes afgehandeld.',
  'help.guide.offline-conflicts.tip.1':
    'Cache wissen verwijdert alleen de kopie op dit apparaat; op de server wordt niets aangeraakt.',
  // profile
  'help.guide.profile.title': 'Je profiel wijzigen',
  'help.guide.profile.goal': 'Werk je naam, e-mail en foto bij.',
  'help.guide.profile.step.1':
    'Bewerk onder Account Gebruikersnaam en E-mail. De avatar neemt een eigen upload; verwijder hem om terug te gaan naar de initialen.',
  'help.guide.profile.step.2': 'Klik op Profiel opslaan.',
  'help.guide.profile.result': 'Je naam en foto worden overal tegelijk bijgewerkt, ook op reizen die je deelt.',
  'help.guide.profile.tip.1':
    'Een account dat via OIDC inlogt, laat dat hier zien; de e-mail komt dan van de provider.',
  // password
  'help.guide.password.title': 'Je wachtwoord wijzigen',
  'help.guide.password.goal': 'Stel een nieuw wachtwoord in.',
  'help.guide.password.step.1': 'Voer onder Wachtwoord wijzigen je huidige wachtwoord in, dan twee keer het nieuwe.',
  'help.guide.password.step.2': 'Klik op Wachtwoord bijwerken.',
  'help.guide.password.result':
    'Het nieuwe wachtwoord werkt bij de volgende keer inloggen; andere sessies blijven ingelogd.',
  'help.guide.password.tip.1': 'Een account dat via OIDC inlogt, heeft geen TREK-wachtwoord om te wijzigen.',
  // mfa
  'help.guide.mfa.title': 'Tweefactorauthenticatie inschakelen',
  'help.guide.mfa.goal': 'Bescherm het account met een code uit een authenticator-app.',
  'help.guide.mfa.step.1': 'Klik onder Tweefactorauthenticatie (2FA) op Authenticator instellen.',
  'help.guide.mfa.step.2':
    'Scan de QR-code met je app, of voer het geheim met de hand in, typ dan de zescijferige code die hij toont en klik op 2FA inschakelen.',
  'help.guide.mfa.step.3':
    'Bewaar de back-upcodes: kopieer, download of print ze. Elke code werkt één keer, als je geen telefoon bij de hand hebt.',
  'help.guide.mfa.result': 'Elke keer inloggen vraagt na het wachtwoord om een code.',
  'help.guide.mfa.tip.1': '2FA uitschakelen vraagt je wachtwoord en een actuele code.',
  'help.guide.mfa.tip.2': 'De beheerder kan 2FA voor iedereen verplichten; dan kan het hier niet worden uitgezet.',
  // passkeys
  'help.guide.passkeys.title': 'Inloggen met een passkey',
  'help.guide.passkeys.goal':
    'Gebruik de vingerafdruk, het gezicht of de pincode van je apparaat in plaats van een wachtwoord.',
  'help.guide.passkeys.step.1':
    'Klik onder Passkeys op Een passkey toevoegen en bevestig met je apparaat. Geef hem een naam die zegt welk apparaat het is.',
  'help.guide.passkeys.step.2':
    'De lijst toont elke passkey met zijn naam en wanneer hij het laatst is gebruikt; de verwijderknop haalt er een weg.',
  'help.guide.passkeys.result': 'De inlogpagina biedt de passkey aan; het wachtwoord blijft als terugvaloptie.',
  'help.guide.passkeys.tip.1':
    'Een passkey leeft op het apparaat of in zijn wachtwoordmanager, dus voeg er een per apparaat toe.',
  'help.guide.passkeys.tip.2':
    'Passkeys hebben HTTPS nodig; op een instantie met gewoon HTTP legt het gedeelte uit waarom ze niet beschikbaar zijn.',
  // delete-account
  'help.guide.delete-account.title': 'Je account verwijderen',
  'help.guide.delete-account.goal': 'Verwijder je account en de gegevens die alleen van jou zijn.',
  'help.guide.delete-account.step.1': 'Klik helemaal onderaan Account op Account verwijderen en bevestig.',
  'help.guide.delete-account.result':
    'Je account, je eigen reizen en je reisverslagen zijn weg; reizen die je met anderen deelt, blijven bij hen.',
  'help.guide.delete-account.tip.1':
    'De laatste beheerder van een instantie kan zichzelf niet verwijderen; maak eerst iemand anders beheerder.',
  'help.guide.delete-account.tip.2': 'Er is geen ongedaan maken. Exporteer wat je wilt bewaren voordat je bevestigt.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Beheer',
  'help.ctx.admin.summary':
    'De instantie achter ieders TREK: wie mag inloggen en hoe, wat aanstaat, waar bestanden staan, hoe de server mensen bereikt en hoe er een back-up van wordt gemaakt. Alleen beheerders zien deze pagina; elk tabblad is een eigen scherm in de zijbalk.',
  'help.ctx.admin.bullet.1':
    'De vier kaarten bovenaan tellen gebruikers, reizen, plekken en bestanden; een banner erboven kondigt een nieuwere TREK-release aan.',
  'help.ctx.admin.bullet.2':
    'Gebruikers en Standaardinstellingen: accounts, uitnodigingslinks en de kaartinstellingen waarmee een nieuw account begint.',
  'help.ctx.admin.bullet.3':
    'Personalisatie, Instellingen, Add-ons en Plugins: paksjablonen, categorieën en schoolvakanties; inlogmethoden en API-sleutels; de functiemodules; plugins van derden.',
  'help.ctx.admin.bullet.4':
    'Opslag, Meldingen, MCP-toegang en GitHub: waar uploads heen gaan, de kanalen van de hele instantie, tokens en sessies van AI-clients, en de release-geschiedenis.',
  'help.ctx.admin.bullet.5':
    'Back-up en Audit: back-ups op verzoek en volgens schema, en het logboek van beveiligingsrelevante gebeurtenissen.',
  'help.ctx.admin-users.title': 'Gebruikers',
  'help.ctx.admin-users.summary':
    'Elk account op deze TREK, met rol, e-mail en laatste login, en de uitnodigingslinks waarmee mensen zich op een gesloten instantie kunnen registreren.',
  'help.ctx.admin-users.bullet.1':
    'De tabel: gebruikersnaam, e-mail, rol, aanmaakdatum, laatste login en de acties per rij. Jij bent gemarkeerd als jij.',
  'help.ctx.admin-users.bullet.2':
    'Gebruiker aanmaken bovenaan voegt met de hand een account toe, met een wachtwoord dat jij overhandigt.',
  'help.ctx.admin-users.bullet.3':
    'Uitnodigingslinks eronder: eenmalige registratielinks met een gebruikslimiet, een vervaldatum en, als je wilt, een reis waar de nieuwe gebruiker bij aankomst aan wordt toegevoegd.',
  'help.ctx.admin-users.bullet.4':
    'Rechtinstellingen onderaan: per actie wie het mag doen, Iedereen, Reisleden, Reiseigenaar of Alleen beheerder.',
  'help.ctx.admin-defaults.title': 'Standaardinstellingen',
  'help.ctx.admin-defaults.summary':
    'De instellingen waarmee een nieuw account begint, zodat niemand eerst het kaarttabblad hoeft te zoeken: kaartmotor, stijl, tokens en kwaliteit.',
  'help.ctx.admin-defaults.bullet.1':
    'Kaartmotor, Mapbox-stijl en -token, CARTO-sleutel en Mapbox-kwaliteit, precies zoals een gebruiker ze onder Instellingen, Kaart zou instellen.',
  'help.ctx.admin-defaults.bullet.2':
    'Terugzetten per veld brengt de eigen keuze van TREK terug; de eigen instelling van een gebruiker wint altijd van deze.',
  'help.ctx.admin-config.title': 'Personalisatie',
  'help.ctx.admin-config.summary':
    'Wat elke reis op de instantie deelt: paksjablonen, de set categorieën voor plekken en collecties, en de schoolvakantiecatalogus waar Vacay uit put.',
  'help.ctx.admin-config.bullet.1':
    'Paksjablonen: benoemde lijsten van categorieën en items waarmee de paklijst van een reis kan beginnen.',
  'help.ctx.admin-config.bullet.2':
    'Categorieën: naam, icoon en kleur van de categorieën die overal in TREK worden gebruikt, van de plaatsinspector tot Collecties.',
  'help.ctx.admin-config.bullet.3':
    'Schoolvakanties: de catalogus van landen en regio’s, voor plekken die de ingebouwde feeds niet dekken.',
  'help.ctx.admin-settings.title': 'Instellingen',
  'help.ctx.admin-settings.summary':
    'Hoe mensen binnenkomen en waarmee de server mag praten: inlog- en registratiemethoden, SSO, passkeys, het tweestapsbeleid, de API-sleutels voor kaarten, plekken en afbeeldingen, de zoek- en ov-providers, en de bestandstypen die uploads mogen hebben.',
  'help.ctx.admin-settings.bullet.1':
    'Authenticatiemethoden: Inloggen met wachtwoord, Registreren met wachtwoord, Inloggen via SSO, Automatische SSO-provisioning en Tweestapsverificatie (2FA) verplichten.',
  'help.ctx.admin-settings.bullet.2':
    'Single Sign-On (OIDC) met issuer, client en weergavenaam; Inloggen met passkey met Relying Party ID en origins.',
  'help.ctx.admin-settings.bullet.3':
    'API-sleutels: Google Maps, Unsplash en Amap, elk met Testen; Waarvoor de sleutel wordt gebruikt beperkt de Google-sleutel tot de functies waarvoor je wilt betalen.',
  'help.ctx.admin-settings.bullet.4':
    'Provider voor plaatszoeken en Ov-provider bepalen wie zoekopdrachten en routes beantwoordt; Toegestane bestandstypen beperkt uploads.',
  'help.ctx.admin-addons.title': 'Add-ons',
  'help.ctx.admin-addons.summary':
    'De functiemodules van TREK, elk met een schakelaar: Lijsten, Onkosten, Documenten, Vacay, Atlas, Samenwerking, Reisverslag, Collecties, Roadtrip, MCP, AirTrail, Dawarich en de AI-verwerking. Uit betekent dat het navigatie-item, de routes en de API voor iedereen weg zijn.',
  'help.ctx.admin-addons.bullet.1':
    'Eén tegel per add-on met zijn schakelaar en, waar hij die heeft, subrijen voor zijn opties.',
  'help.ctx.admin-addons.bullet.2':
    'Fotoproviders en documentproviders verschijnen hier ook als tegels, zodat Immich of Synology aan gebruikers kan worden aangeboden.',
  'help.ctx.admin-addons.bullet.3': 'Bagagetracking heeft een eigen schakelaar onder de tegels.',
  'help.ctx.admin-plugins.title': 'Plugins',
  'help.ctx.admin-plugins.summary':
    'Plugins van derden die in een eigen proces naast TREK draaien, elk met de rechten waar het bij de installatie om vroeg. Installeer uit de catalogus, upload een pakket, of koppel een map terwijl je er een ontwikkelt.',
  'help.ctx.admin-plugins.bullet.1':
    'De lijst: elke geïnstalleerde plugin met versie, status, handtekening en de rechten die hij heeft; per rij activeren, deactiveren, bijwerken of verwijderen.',
  'help.ctx.admin-plugins.bullet.2':
    'Plugin uploaden neemt een pakketbestand; Opnieuw scannen pikt een pluginmap op die voor ontwikkeling is gekoppeld.',
  'help.ctx.admin-plugins.bullet.3':
    'Toegestane hosts per plugin: de adressen die een plugin mag aanroepen, want uitgaand verkeer is standaard geblokkeerd.',
  'help.ctx.admin-storage.title': 'Opslag',
  'help.ctx.admin-storage.summary':
    'Waar uploads staan: de lokale schijf, een S3-bucket, of een mirror die naar allebei schrijft. Elke uploadcategorie kan naar een andere backend, en Status zegt of elke backend antwoordt.',
  'help.ctx.admin-storage.bullet.1':
    'Backends: naam en type van elk, met Testen, Bewerken en Verwijderen; een backend die via de omgeving is ingesteld is hier alleen-lezen.',
  'help.ctx.admin-storage.bullet.2':
    'Categorieën: omslagen, documenten, reisverslagfoto’s en de rest, elk toegewezen aan een backend; er een wijzigen biedt aan de bestaande bestanden te verplaatsen.',
  'help.ctx.admin-storage.bullet.3':
    'Status: een controle per backend, en het seed-bestand dat bewijst dat de configuratie is wat de server ziet.',
  'help.ctx.admin-notifications.title': 'Meldingen',
  'help.ctx.admin-notifications.summary':
    'De kanalen die de instantie zijn gebruikers aanbiedt, en de kanalen die jou als beheerder bereiken. Gebruikers kiezen hun eigen topics en URL’s onder Instellingen; jij bepaalt wat er bestaat en stelt e-mail in.',
  'help.ctx.admin-notifications.bullet.1':
    'In-App, Email (SMTP), Ntfy, Webhook en Web Push: elk een paneel, met een schakelaar die het kanaal aan gebruikers aanbiedt en de serverconfiguratie die het nodig heeft.',
  'help.ctx.admin-notifications.bullet.2':
    'Reisherinneringen: of de server de herinnering stuurt voordat een reis begint.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin-Ntfy en Admin-webhook: waar beheergebeurtenissen zoals een mislukte back-up of een nieuwe release heen gaan, met Testen.',
  'help.ctx.admin-mcp-tokens.title': 'MCP-toegang',
  'help.ctx.admin-mcp-tokens.summary':
    'Elk token en elke OAuth-sessie die AI-clients op deze TREK hebben, over alle gebruikers heen, met de mogelijkheid om er elk van in te trekken.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'API-tokens: wie het aanmaakte, wanneer het voor het laatst is gebruikt, en Verwijderen.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'OAuth-sessies: de client, de gebruiker en de toegekende scopes, en Intrekken.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Wat er nieuw is in TREK: de release-geschiedenis van GitHub, de versie die je draait, en of er een nieuwere uit is. Het bijwerken zelf gebeurt buiten de app, op de host.',
  'help.ctx.admin-github.bullet.1':
    'Release-geschiedenis somt de releases op met hun notities; de nieuwste draagt Nieuwste, en jouw versie is gemarkeerd.',
  'help.ctx.admin-github.bullet.2':
    'Update beschikbaar verschijnt in de kop zodra er een nieuwere release bestaat, met hoe je bijwerkt voor Docker en andere installaties.',
  'help.ctx.admin-backup.title': 'Back-up',
  'help.ctx.admin-backup.summary':
    'Volledige back-ups van de database en de uploads, met de hand of volgens schema gemaakt, bewaard op de server en als één bestand te downloaden. Herstellen zet er een terug.',
  'help.ctx.admin-backup.bullet.1':
    'Gegevensback-up: Back-up aanmaken, en de lijst van bestaande back-ups met Downloaden, Herstellen en verwijderen.',
  'help.ctx.admin-backup.bullet.2':
    'Back-up uploaden brengt een bestand binnen dat op een andere instantie of een eerdere dag is gemaakt.',
  'help.ctx.admin-backup.bullet.3': 'Auto-back-up: aan of uit, interval, uur en dag, en hoeveel er bewaard blijven.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Het logboek van beveiligingsrelevante en administratieve gebeurtenissen: logins en mislukkingen, MFA-wijzigingen, gebruikers- en instellingswijzigingen, back-ups en herstelacties. Alleen-lezen, nieuwste eerst.',
  'help.ctx.admin-audit.bullet.1': 'Eén rij per gebeurtenis met tijd, gebruiker, actie, resource, IP en details.',
  'help.ctx.admin-audit.bullet.2': 'Vernieuwen laadt opnieuw; Meer laden gaat verder terug.',
  // create-user
  'help.guide.create-user.title': 'Een gebruiker aanmaken',
  'help.guide.create-user.goal': 'Voeg met de hand een account toe, zonder uitnodiging.',
  'help.guide.create-user.step.1': 'Klik op Gebruiker aanmaken bovenaan het tabblad Gebruikers.',
  'help.guide.create-user.step.2':
    'Vul Gebruikersnaam, E-mail en een Wachtwoord in en kies de Rol: Gebruiker of Beheerder.',
  'help.guide.create-user.step.3': 'Klik op Gebruiker aanmaken.',
  'help.guide.create-user.result':
    'Het account verschijnt in de tabel en kan meteen inloggen; geef het wachtwoord door via een kanaal dat je vertrouwt.',
  'help.guide.create-user.tip.1':
    'Voor iemand die zijn eigen wachtwoord moet kiezen, is een uitnodigingslink de betere ingang.',
  'help.guide.create-user.tip.2':
    'Beheerders zien deze pagina en het auditlogboek; al het andere is voor beide rollen gelijk.',
  // edit-user
  'help.guide.edit-user.title': 'De rol of het wachtwoord van een gebruiker wijzigen',
  'help.guide.edit-user.goal': 'Promoveer iemand, degradeer hem, of help hem weer binnen na een verloren wachtwoord.',
  'help.guide.edit-user.step.1':
    'Klik op het potlood in de rij van de gebruiker. Gebruiker bewerken opent met de gegevens van het account.',
  'help.guide.edit-user.step.2':
    'Wijzig de Rol, stel een Nieuw wachtwoord in, of klik op Passkeys resetten als de persoon het apparaat met zijn passkeys is kwijtgeraakt, en dan Opslaan.',
  'help.guide.edit-user.result':
    'De wijziging geldt bij het volgende verzoek; een nieuw wachtwoord werkt vanaf de volgende login.',
  'help.guide.edit-user.tip.1': 'Je kunt jezelf de beheerdersrol niet afnemen zolang je de laatste beheerder bent.',
  'help.guide.edit-user.tip.2':
    'Passkeys resetten houdt het wachtwoord; de persoon voegt nieuwe passkeys toe onder Instellingen, Account.',
  // invite-links
  'help.guide.invite-links.title': 'Iemand uitnodigen met een link',
  'help.guide.invite-links.goal':
    'Laat iemand zich registreren op een gesloten instantie en, als je wilt, meteen in een reis landen.',
  'help.guide.invite-links.step.1': 'Klik onder Uitnodigingslinks op Link aanmaken.',
  'help.guide.invite-links.step.2':
    'Stel Max. gebruik en Verloopt na in, optioneel Toevoegen aan reis (optioneel), en klik op Aanmaken en kopiëren.',
  'help.guide.invite-links.step.3':
    'Verstuur de link. Elke rij toont hoe vaak hij is gebruikt en wie hem aanmaakte; Link kopiëren kopieert hem opnieuw, en opgebruikte of verlopen links zijn gemarkeerd.',
  'help.guide.invite-links.result':
    'Wie de link opent registreert zich met een eigen wachtwoord en wordt, als er een reis is gekozen, meteen lid.',
  'help.guide.invite-links.tip.1':
    'Uitnodigingslinks werken ook als Registreren met wachtwoord onder Instellingen uitstaat.',
  'help.guide.invite-links.tip.2':
    'Een link met één gebruik en een korte geldigheid is de veiligste standaard voor één persoon.',
  // delete-user
  'help.guide.delete-user.title': 'Een gebruiker verwijderen',
  'help.guide.delete-user.goal': 'Verwijder een account en alles wat alleen van dat account is.',
  'help.guide.delete-user.step.1':
    'Klik op het prullenbakicoon in de rij van de gebruiker en bevestig Gebruiker verwijderen.',
  'help.guide.delete-user.result':
    'Het account, zijn eigen reizen en zijn reisverslagen zijn weg; reizen die met anderen zijn gedeeld blijven bij de overige leden.',
  'help.guide.delete-user.tip.1': 'Er is geen ongedaan maken. Maak eerst een back-up als je niet zeker bent.',
  'help.guide.delete-user.tip.2':
    'De laatste beheerder kan niet worden verwijderd; maak eerst iemand anders beheerder.',
  // permissions
  'help.guide.permissions.title': 'Bepalen wie wat mag',
  'help.guide.permissions.goal': 'Stel per actie in welke rol die op deze TREK mag uitvoeren.',
  'help.guide.permissions.step.1':
    'Zoek onder Rechtinstellingen de actie in zijn groep, bijvoorbeeld Reizen verwijderen onder Reisbeheer, en kies het niveau: Iedereen, Reisleden, Reiseigenaar of Alleen beheerder. Een gewijzigde rij is gemarkeerd als aangepast.',
  'help.guide.permissions.step.2':
    'Klik op Opslaan. Standaardwaarden herstellen zet elke rij terug op het ingebouwde niveau.',
  'help.guide.permissions.result':
    'De regel geldt meteen voor elke reis; de knoppen en menu’s van mensen onder het niveau verdwijnen.',
  'help.guide.permissions.tip.1':
    'Reiseigenaar is de persoon die de reis heeft aangemaakt; beheerders mogen altijd alles.',
  'help.guide.permissions.tip.2':
    'Verlaag liever een niveau dan een lid te verwijderen: een lid dat niet mag bewerken kan nog wel lezen en reageren.',
  // default-map
  'help.guide.default-map.title': 'De kaartstandaarden voor nieuwe gebruikers instellen',
  'help.guide.default-map.goal': 'Geef elk nieuw account een werkende kaart zonder persoonlijk token.',
  'help.guide.default-map.step.1':
    'Kies onder Kaart de Kaartmotor en, voor Mapbox of MapLibre, de Kaartstijl, het Gedeeld Mapbox-token en de Hogekwaliteitsmodus; voor een rasterkaart het Kaartsjabloon en de Gedeelde CARTO-sleutel.',
  'help.guide.default-map.step.2':
    'Naast elk veld dat je hebt gewijzigd brengt terugzetten de eigen keuze van TREK terug. Standaard gebruikersinstellingen links doet hetzelfde voor Kleurmodus, eenheden en de valuta.',
  'help.guide.default-map.result':
    'Nieuwe accounts beginnen hiermee; wie onder Instellingen een eigen kaart instelde, houdt die.',
  'help.guide.default-map.tip.1':
    'Een token dat je hier invult wordt gedeeld door iedereen zonder eigen token, dus let op het quotum.',
  'help.guide.default-map.tip.2':
    'Bestaande accounts die het kaarttabblad nooit hebben aangeraakt volgen deze standaarden ook.',
  // packing-templates
  'help.guide.packing-templates.title': 'Een paksjabloon bouwen',
  'help.guide.packing-templates.goal': 'Geef reizen een paklijst om mee te beginnen in plaats van een lege.',
  'help.guide.packing-templates.step.1': 'Klik op Nieuw sjabloon, typ een naam en bevestig met het vinkje.',
  'help.guide.packing-templates.step.2':
    'Open het sjabloon en klik op Categorie toevoegen; onder elke categorie voegt de + items toe, en een item heeft alleen een naam nodig.',
  'help.guide.packing-templates.step.3':
    'Alles wordt direct opgeslagen. Het potlood hernoemt een sjabloon, een categorie of een item, de prullenbak verwijdert het.',
  'help.guide.packing-templates.result':
    'Het sjabloon wordt op de paklijst van elke reis aangeboden; toepassen kopieert de items, dus een reis kan ze vrij aanpassen.',
  'help.guide.packing-templates.tip.1':
    'Eén sjabloon per soort reis, strand, stad, wandelen, verslaat één reuzenlijst.',
  'help.guide.packing-templates.tip.2': 'Een sjabloon verwijderen raakt reizen die het al hebben toegepast niet.',
  // categories
  'help.guide.categories.title': 'De categorieset beheren',
  'help.guide.categories.goal': 'Bepaal welke categorieën plekken en collecties kunnen dragen, en hoe ze eruitzien.',
  'help.guide.categories.step.1':
    'Klik op Nieuwe categorie, geef hem een naam, kies een icoon en een kleur; het Voorbeeld toont het resultaat. Klik op Aanmaken.',
  'help.guide.categories.step.2':
    'Beweeg over een categorie in de lijst om hem te bewerken of te verwijderen. Verwijderen vraagt om bevestiging.',
  'help.guide.categories.result':
    'De set geldt overal tegelijk: de plaatsinspector, de kaartpins, Collecties en de filters.',
  'help.guide.categories.tip.1':
    'Plekken houden hun categorie-id, dus een categorie hernoemen hernoemt hem op elke plek.',
  'help.guide.categories.tip.2':
    'Een verwijderde categorie laat zijn plekken zonder categorie achter; wijs ze eerst opnieuw toe als dat uitmaakt.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Schoolvakanties met de hand bijhouden',
  'help.guide.school-holiday-catalog.goal': 'Dek een land of regio af die de ingebouwde vakantiefeeds niet kennen.',
  'help.guide.school-holiday-catalog.step.1':
    'Klik onder Schoolvakanties op Land toevoegen, vul Land en de Landcode (bijv. US) in, en Opslaan; dan Regio toevoegen voor elk deel ervan dat afwijkt.',
  'help.guide.school-holiday-catalog.step.2':
    'Klik op een regio om Regio of schooldistrict te openen: Vakantieperiode toevoegen, geef elke periode een Naam van de vakantie, Begindatum en Einddatum, en Opslaan. De prullenbak verwijdert een periode, een regio of, zodra er geen regio’s meer over zijn, een land.',
  'help.guide.school-holiday-catalog.result':
    'Gebruikers vinden het land en de regio onder Instellingen in Vacay en zien de periodes op hun jaarraster.',
  'help.guide.school-holiday-catalog.tip.1':
    'Regio’s uit de ingebouwde feeds kun je hier niet bewerken; voeg er een handmatige regio naast toe als een datum fout is.',
  // auth-methods
  'help.guide.auth-methods.title': 'Bepalen hoe mensen inloggen',
  'help.guide.auth-methods.goal': 'Open of sluit inloggen met wachtwoord, SSO en registratie, en verplicht 2FA.',
  'help.guide.auth-methods.step.1':
    'Zet onder Authenticatiemethoden Inloggen met wachtwoord en Registreren met wachtwoord aan of uit. Registratie uit betekent nieuwe accounts alleen via uitnodigingslinks, SSO of met de hand.',
  'help.guide.auth-methods.step.2':
    'Inloggen via SSO en Automatische SSO-provisioning hebben een ingestelde Single Sign-On (OIDC) hieronder nodig; automatische provisioning maakt een account aan de eerste keer dat iemand via SSO inlogt.',
  'help.guide.auth-methods.step.3':
    'Tweestapsverificatie (2FA) verplichten laat elke wachtwoordlogin bij de volgende keer inloggen een authenticator instellen. Inloggen met passkey heeft de Relying Party ID en de origins nodig waarop jouw TREK bereikbaar is.',
  'help.guide.auth-methods.result': 'De inlogpagina biedt precies de methoden aan die je hebt aangelaten.',
  'help.guide.auth-methods.tip.1':
    'Er verschijnt een waarschuwing voordat je jezelf buitensluit: minstens één ingang voor beheerders blijft aan.',
  'help.guide.auth-methods.tip.2':
    'Waarden die via omgevingsvariabelen zijn ingesteld verschijnen hier als alleen-lezen.',
  // oidc
  'help.guide.oidc.title': 'Single sign-on koppelen',
  'help.guide.oidc.goal': 'Laat mensen inloggen met jouw identity provider.',
  'help.guide.oidc.step.1':
    'Vul onder Single Sign-On (OIDC) de Weergavenaam voor de knop in en de Issuer-URL, Client ID en Client Secret van je provider, en dan Opslaan.',
  'help.guide.oidc.step.2': 'Zet Inloggen via SSO aan onder Authenticatiemethoden.',
  'help.guide.oidc.result':
    'De inlogpagina toont de SSO-knop; met Automatische SSO-provisioning aan krijgen nieuwe gebruikers automatisch een account.',
  'help.guide.oidc.tip.1':
    'De redirect-URI die je provider nodig heeft is het adres van jouw TREK plus het OIDC-callbackpad uit de documentatie.',
  'help.guide.oidc.tip.2':
    'De claim-mapping bepaalt welke SSO-groepen beheerder worden; zie de OIDC-pagina in de documentatie.',
  // instance-keys
  'help.guide.instance-keys.title': 'De API-sleutels invullen',
  'help.guide.instance-keys.goal': 'Ontgrendel Google-plaatszoeken, Unsplash-omslagen en Amap voor de hele instantie.',
  'help.guide.instance-keys.step.1':
    'Plak onder API-sleutels de Google Maps API-sleutel en klik op Testen; het veld zegt of de sleutel antwoordt.',
  'help.guide.instance-keys.step.2':
    'Zet onder Waarvoor de sleutel wordt gebruikt alleen de functies aan die je op die sleutel wilt laten factureren: autocomplete, details, foto’s, verrijking, het zoeklogboek.',
  'help.guide.instance-keys.step.3':
    'Unsplash API-sleutel drijft het zoeken naar omslagen aan; Amap (高德地图) API-sleutel het plaatszoeken in China. Test elk op dezelfde manier.',
  'help.guide.instance-keys.result':
    'Gebruikers krijgen de functies zonder eigen sleutels; zonder Google-sleutel zoekt TREK via de gratis OpenStreetMap-stack en de TREK Places API.',
  'help.guide.instance-keys.tip.1':
    'De persoonlijke sleutel van een gebruiker onder Instellingen wint voor die gebruiker van de instantiesleutel.',
  'help.guide.instance-keys.tip.2':
    'Sleutels kunnen ook uit omgevingsvariabelen komen; die verschijnen hier als alleen-lezen.',
  // places-transit
  'help.guide.places-transit.title': 'De zoek- en ov-providers kiezen',
  'help.guide.places-transit.goal': 'Bepaal wie plaatszoekopdrachten en ov-routes beantwoordt.',
  'help.guide.places-transit.step.1':
    'Kies onder Provider voor plaatszoeken Automatisch, Google Places, Amap (高德地图) of OpenStreetMap. Automatisch gebruikt de beste sleutel die er is.',
  'help.guide.places-transit.step.2':
    'Kies onder Ov-provider Transitous (gratis), wereldwijd en zonder sleutel, of Google, dat de Google-sleutel nodig heeft.',
  'help.guide.places-transit.result': 'Elk zoekvak en elke ov-route in TREK volgt de keuze.',
  'help.guide.places-transit.tip.1':
    'Een provider zonder zijn sleutel toont hier een waarschuwing en valt terug op OpenStreetMap.',
  'help.guide.places-transit.tip.2': 'Ov-routes van Google worden per verzoek gefactureerd; Transitous niet.',
  // file-types
  'help.guide.file-types.title': 'De bestandstypen beperken',
  'help.guide.file-types.goal': 'Bepaal welke bestandsextensies uploads mogen hebben.',
  'help.guide.file-types.step.1':
    'Bewerk onder Toegestane bestandstypen de door komma’s gescheiden lijst van extensies en sla op.',
  'help.guide.file-types.result':
    'Uploads van elk ander type worden met een duidelijke melding geweigerd, in de documenten, het reisverslag en de omslagen.',
  'help.guide.file-types.tip.1':
    'Houd afbeeldingstypen in de lijst; omslagen en reisverslagfoto’s gaan door dezelfde controle.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Een add-on aan- of uitzetten',
  'help.guide.toggle-addon.goal': 'Bied iedereen een functiemodule aan, of neem hem weg.',
  'help.guide.toggle-addon.step.1':
    'Zet de schakelaar op de tegel van de add-on om. Het navigatie-item verschijnt of verdwijnt voor iedereen tegelijk.',
  'help.guide.toggle-addon.step.2':
    'Sommige tegels hebben subrijen voor hun opties, zoals Bagagetracking onder Lijsten of de fotoproviders onder Reisverslag; ze verschijnen alleen zolang de add-on aanstaat.',
  'help.guide.toggle-addon.result':
    'Gegevens van een uitgezette add-on blijven bewaard; hem weer aanzetten toont ze opnieuw.',
  'help.guide.toggle-addon.tip.1': 'MCP uit verwijdert het eindpunt en de Integraties-onderdelen die ervan afhangen.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas en Reisverslag zijn de add-ons waar gebruikers het meest om vragen; Documenten heeft opslag voor uploads nodig.',
  // install-plugin
  'help.guide.install-plugin.title': 'Een plugin installeren',
  'help.guide.install-plugin.goal': 'Voeg een plugin van derden toe en geef hem precies de rechten waar hij om vraagt.',
  'help.guide.install-plugin.step.1':
    'Open Ontdekken, kies een plugin en klik op Installeren; of klik op Plugin uploaden en kies een .zip- of .tar.gz-pakket.',
  'help.guide.install-plugin.step.2':
    'Terug onder Geïnstalleerd lees je de rij: wat de plugin mag lezen of schrijven, de hosts die hij aanroept en of hij is ondertekend. Zet Plugin inschakelen aan.',
  'help.guide.install-plugin.step.3':
    'Het menu van de rij biedt Opnieuw starten, Foutenlog bekijken, Toegestane hosts en Versie wijzigen…; Verwijderen deïnstalleert hem. Een update wordt op de rij aangeboden als er een nieuwere versie bestaat, en een die om nieuwe rechten vraagt blijft uit tot je die goedkeurt.',
  'help.guide.install-plugin.result':
    'De plugin draait in zijn eigen proces; wat hij toevoegt, widgets, kaartlagen, tools, verschijnt waar de plugin het aangeeft.',
  'help.guide.install-plugin.tip.1':
    'Opnieuw scannen pikt een voor ontwikkeling gekoppelde pluginmap op zonder pakket.',
  'help.guide.install-plugin.tip.2':
    'Een niet-ondertekende plugin is als zodanig gemarkeerd; installeer hem alleen als je de bron vertrouwt.',
  // storage-backends
  'help.guide.storage-backends.title': 'Uploads naar S3 of een mirror verplaatsen',
  'help.guide.storage-backends.goal': 'Bewaar bestanden op objectopslag, of op schijf en in een bucket tegelijk.',
  'help.guide.storage-backends.step.1':
    'Klik onder Backends op Backend toevoegen, geef hem een Naam, kies het Type, Lokaal, S3 of Mirror, vul de velden in en Toepassen. Testen controleert de verbinding, Wijzigingen opslaan schrijft hem weg.',
  'help.guide.storage-backends.step.2':
    'Wijs onder Categorieën elke uploadcategorie toe aan een backend. Er een wijzigen vraagt of je Bestaande objecten verplaatsen of Alleen nieuwe schrijfacties omleiden wilt.',
  'help.guide.storage-backends.step.3':
    'Status bovenaan controleert elke backend; een rode regel noemt wat er misging.',
  'help.guide.storage-backends.result':
    'Nieuwe uploads gaan naar de toegewezen backend; verplaatste bestanden worden van daaruit geleverd.',
  'help.guide.storage-backends.tip.1':
    'Een backend die via omgevingsvariabelen is geconfigureerd wordt getoond maar kan hier niet worden bewerkt.',
  'help.guide.storage-backends.tip.2':
    'Een mirror schrijft naar beide doelen en leest van het eerste; gebruik hem om zonder downtime te migreren.',
  // channels-instance
  'help.guide.channels-instance.title': 'De meldingskanalen instellen',
  'help.guide.channels-instance.goal': 'Bepaal welke kanalen gebruikers mogen kiezen, en stel e-mail in.',
  'help.guide.channels-instance.step.1':
    'Vul onder Email (SMTP) SMTP Host, SMTP Port, SMTP User, SMTP Password en de From Address in; Test-e-mail verzenden stuurt een mail naar jou.',
  'help.guide.channels-instance.step.2':
    'Zet Web Push, Ntfy en Webhook aan om ze aan te bieden; gebruikers zetten dan push per apparaat aan, of vullen hun eigen topic of URL in, onder Instellingen, Meldingen.',
  'help.guide.channels-instance.step.3':
    'Reisherinneringen schakelt de herinnering voordat een reis begint; In-App staat altijd aan en wordt hier alleen uitgelegd.',
  'help.guide.channels-instance.result':
    'Het tabblad Meldingen van elke gebruiker toont de kanalen die je hebt aangezet.',
  'help.guide.channels-instance.tip.1':
    'Een standaard-ntfy-server die je hier invult is voor gebruikers vooraf ingevuld; ze kunnen nog steeds hun eigen server opgeven.',
  'help.guide.channels-instance.tip.2':
    'Pluginkanalen verschijnen vanzelf zodra een plugin met die mogelijkheid actief is.',
  // admin-channels
  'help.guide.admin-channels.title': 'Beheergebeurtenissen op je telefoon krijgen',
  'help.guide.admin-channels.goal':
    'Hoor van mislukte back-ups, nieuwe releases en andere gebeurtenissen op de instantie.',
  'help.guide.admin-channels.step.1':
    'Vul onder Admin-Ntfy een topic in en, indien nodig, server en token; onder Admin-webhook een URL.',
  'help.guide.admin-channels.step.2':
    'Klik op Test-Ntfy verzenden of Testwebhook verzenden om een bericht te zien aankomen.',
  'help.guide.admin-channels.result': 'Beheergebeurtenissen gaan daarheen, naast de in-app-bel van elke beheerder.',
  'help.guide.admin-channels.tip.1':
    'Houd het beheer-topic gescheiden van je persoonlijke, zodat een storing niet verdrinkt in het reisgebabbel.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AI-toegang intrekken',
  'help.guide.mcp-tokens-admin.goal':
    'Zie en kap elk token en elke sessie die een AI-client heeft, voor elke gebruiker.',
  'help.guide.mcp-tokens-admin.step.1':
    'Zoek onder API-tokens het token op gebruiker en naam; de prullenbak verwijdert het en de client stopt meteen.',
  'help.guide.mcp-tokens-admin.step.2':
    'Onder OAuth-sessies hetzelfde voor browsergebaseerde clients: client, gebruiker en datum, en de prullenbak trekt de sessie in.',
  'help.guide.mcp-tokens-admin.result':
    'De client moet door zijn gebruiker opnieuw worden verbonden; verder verandert er niets.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Scopes vertellen je wat een client kon doen; een alleen-lezen scope laten staan is onschuldig.',
  'help.guide.mcp-tokens-admin.tip.2': 'De MCP-add-on uitzetten trekt alles in één keer in.',
  // release-history
  'help.guide.release-history.title': 'Controleren op een nieuwe release',
  'help.guide.release-history.goal': 'Weet of jouw TREK actueel is en wat de volgende versie brengt.',
  'help.guide.release-history.step.1':
    'Als er een nieuwere release bestaat, staat Update beschikbaar bovenaan de beheerpagina; Bekijk op GitHub opent hem, en Hoe bij te werken legt het bijwerken uit voor Docker en voor andere installaties.',
  'help.guide.release-history.step.2':
    'Release-geschiedenis somt elke release op met zijn notities; Details tonen klapt ze uit, de nieuwste draagt Nieuwste, en Meer laden gaat verder terug.',
  'help.guide.release-history.result':
    'Het bijwerken gebeurt op de host, door de nieuwe image te pullen of de nieuwe tag te bouwen; de datamap blijft.',
  'help.guide.release-history.tip.1': 'Maak een back-up voor een update; het tabblad Back-up zit ernaast.',
  'help.guide.release-history.tip.2':
    'Pre-releases worden getoond maar niet als update aangekondigd, tenzij je er een draait.',
  // create-backup
  'help.guide.create-backup.title': 'Een back-up maken en herstellen',
  'help.guide.create-backup.goal':
    'Maak een momentopname van de hele instantie, bewaar ergens anders een kopie, en kun hem terugzetten.',
  'help.guide.create-backup.step.1':
    'Klik onder Gegevensback-up op Back-up aanmaken. Dat pakt de database en de uploads in één bestand op de server.',
  'help.guide.create-backup.step.2':
    'Downloaden bewaart een kopie buiten de machine; de prullenbak verwijdert oude om ruimte vrij te maken.',
  'help.guide.create-backup.step.3':
    'Herstellen bij een back-up, of Back-up uploaden met een bestand, vervangt de huidige gegevens nadat Back-up herstellen? één keer heeft gevraagd.',
  'help.guide.create-backup.result':
    'Een herstel brengt gebruikers, reizen, bestanden en instellingen terug naar de stand van die back-up; iedereen wordt uitgelogd.',
  'help.guide.create-backup.tip.1':
    'Herstellen is de enige actie hier die niet ongedaan kan worden gemaakt. Maak eerst een verse back-up.',
  'help.guide.create-backup.tip.2':
    'Back-ups staan in de datamap; pas een kopie op een andere machine maakt ze tot een echte back-up.',
  // auto-backup
  'help.guide.auto-backup.title': 'Back-ups inplannen',
  'help.guide.auto-backup.goal': 'Laat de server zichzelf back-uppen en alleen de laatste paar bewaren.',
  'help.guide.auto-backup.step.1':
    'Zet onder Auto-back-up Auto-back-up inschakelen aan en kies het Interval, Uitvoeren om en, voor wekelijks of maandelijks, de Dag van de week of Dag van de maand.',
  'help.guide.auto-backup.step.2':
    'Oude back-ups verwijderen na bepaalt hoe lang een back-up bewaard blijft; oudere verdwijnen als er een nieuwe wordt gemaakt.',
  'help.guide.auto-backup.result':
    'Back-ups verschijnen volgens schema in de lijst; een mislukking bereikt de beheerkanalen.',
  'help.guide.auto-backup.tip.1': 'Tijden volgen de tijdzone van de server, die in het tabblad Audit staat.',
  'help.guide.auto-backup.tip.2': 'Opslag op de server is eindig; drie tot vijf bewaren is meestal genoeg.',
  // audit-log
  'help.guide.audit-log.title': 'Het auditlogboek lezen',
  'help.guide.audit-log.goal': 'Kom erachter wie wat deed, en wanneer.',
  'help.guide.audit-log.step.1':
    'Lees de rijen: tijd, gebruiker, actie, resource, IP en details, nieuwste eerst. Acties zijn genoemd naar wat er gebeurde, zoals een mislukte login, een MFA-wijziging of een herstel.',
  'help.guide.audit-log.step.2': 'Vernieuwen laadt de bovenkant opnieuw; Meer laden gaat verder terug.',
  'help.guide.audit-log.result': 'Een spoor dat je kunt geven aan wie vraagt waarom iets is veranderd.',
  'help.guide.audit-log.tip.1': 'Tijden worden getoond in de tijdzone van de server, die boven de tabel staat.',
  'help.guide.audit-log.tip.2':
    'Het logboek is alleen-toevoegen; niets hier kan vanuit de app worden bewerkt of verwijderd.',
  // document-providers
  'help.guide.document-providers.title': 'Een documentopslag aanbieden',
  'help.guide.document-providers.goal': 'Bepaal met welke opslagen een reis haar documenten in de pas mag houden.',
  'help.guide.document-providers.step.1':
    'De tegel Documenten draagt de opslagen als rijen op zijn plank: Paperless-ngx, Papra, Nextcloud, OpenCloud en Synology Drive. Alle vijf beginnen uitgeschakeld, en de plank is er alleen zolang Documenten zelf aanstaat.',
  'help.guide.document-providers.step.2':
    'Zet de schakelaar op de rij Nextcloud om. De melding leest Add-on bijgewerkt, en vanaf nu vinden reiseigenaren Documentsynchronisatie op het tabblad Bestanden van hun reizen, met Nextcloud onder Aanbieder koppelen.',
  'help.guide.document-providers.result':
    'De opslag wordt op elke reis van deze TREK aangeboden; er is niets verbonden tot een reiseigenaar dat doet.',
  'help.guide.document-providers.tip.1':
    'Hier wordt alleen beslist of een opslag mag worden aangeboden. Het adres en de inloggegevens horen bij een reis en worden door de eigenaar van de reis op haar tabblad Bestanden ingevoerd, nooit in het beheerpaneel.',
  'help.guide.document-providers.tip.2':
    'Documenten uitzetten zet elke opslag mee uit, en een opslag kan niet aan zolang Documenten uit staat: de server antwoordt Enable the Documents addon first. Een opslag op je eigen netwerk heeft daarnaast ALLOW_INTERNAL_NETWORK=true op de server nodig.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Reis',
  'help.ctx.trip.summary':
    'Eén reis, helemaal: het plan met zijn dagen, kaart en plekken, en de tabbladen voor transport, boekingen, lijsten, onkosten, bestanden en samenwerking. Elk daarvan is een eigen hulpscherm onder dit scherm.',
  'help.ctx.trip.bullet.1':
    'De tabbladbalk: Plan, Transport, Boekingen, Lijsten, Onkosten, Bestanden en Samenwerking. Add-ons en plugins bepalen welke tabbladen er op jouw TREK zijn.',
  'help.ctx.trip.bullet.2':
    'Plan is drie kolommen: de dagen links, de kaart in het midden, de plekken rechts. Boekingen en transport leven in het plan, bij de stop en tussen stops; de tabbladen zetten ze op een rij.',
  'help.ctx.trip.bullet.3':
    'Delen rechtsboven opent de mensen van de reis: leden, gasten, de uitnodigingslink en de openbare alleen-lezen link.',
  'help.ctx.trip.bullet.4':
    'Titel, data, cover en valuta bewerk je vanuit Mijn reizen, met het potlood op de reiskaart.',
  'help.ctx.trip.bullet.5':
    'De chevrons aan de binnenrand van een kolom klappen haar weg en de kaart neemt de ruimte; de dunne scheidingslijn naast een kolom verandert haar breedte.',
  'help.ctx.trip.bullet.6':
    'De ongedaan-maken-pijl in de werkbalk van de dagen neemt de laatste wijziging aan het plan terug.',
  // add-member
  'help.guide.add-member.title': 'Een lid toevoegen',
  'help.guide.add-member.goal': 'Geef iemand met een TREK-account toegang tot deze reis.',
  'help.guide.add-member.step.1': 'Klik rechtsboven op Delen.',
  'help.guide.add-member.step.2': 'Kies onder Gebruiker uitnodigen de persoon uit de lijst en klik op Uitnodigen.',
  'help.guide.add-member.step.3':
    'De persoon staat nu onder Toegang. De kroon markeert de eigenaar; het pictogram aan het eind van een rij verwijdert de toegang weer.',
  'help.guide.add-member.result':
    'Het lid ziet en bewerkt de reis zoals jij, binnen de niveaus die de beheerder onder Rechtinstellingen heeft ingesteld.',
  'help.guide.add-member.tip.1':
    'Wie in de lijst ontbreekt, heeft nog geen TREK-account: voeg die persoon toe als gast, of laat hem of haar zich registreren via een uitnodigingslink.',
  'help.guide.add-member.tip.2': 'Het getal naast Toegang telt de mensen in de reis; gasten staan apart, eronder.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Uitnodigen via link',
  'help.guide.trip-invite-link.goal': 'Laat mensen zelf bij de reis aansluiten.',
  'help.guide.trip-invite-link.step.1':
    'Klik op Delen en dan onder Uitnodigingslink voor reis op Uitnodigingslink maken.',
  'help.guide.trip-invite-link.step.2':
    'Klik op Kopiëren en stuur de link. Iedereen met een TREK-account die hem opent, sluit aan als lid.',
  'help.guide.trip-invite-link.step.3':
    'Opnieuw genereren vervangt de link en maakt de oude onbruikbaar; Uitschakelen zet hem uit.',
  'help.guide.trip-invite-link.result': 'Wie de link opent, zit in de reis en verschijnt onder Toegang.',
  'help.guide.trip-invite-link.tip.1':
    'Iemand zonder account kan hem niet gebruiken. Een beheerder deelt registratielinks uit onder Beheer, Gebruikers, en kan er een aan deze reis koppelen.',
  'help.guide.trip-invite-link.tip.2':
    'Genereer opnieuw als een link in de verkeerde chat is beland: de oude werkt meteen niet meer.',
  // add-guest
  'help.guide.add-guest.title': 'Een gast zonder account toevoegen',
  'help.guide.add-guest.goal': 'Tel iemand mee die TREK niet gebruikt.',
  'help.guide.add-guest.step.1': 'Klik op Delen en scrol naar Gasten.',
  'help.guide.add-guest.step.2': 'Typ de naam in Naam van gast en klik op Gast toevoegen.',
  'help.guide.add-guest.result':
    'De gast kan aan onkosten, inpakitems en taken worden toegewezen, maar kan niet inloggen.',
  'help.guide.add-guest.tip.1':
    'Het potlood hernoemt een gast; het pictogram aan het eind van de rij verwijdert de gast samen met zijn aandelen en toewijzingen.',
  'help.guide.add-guest.tip.2':
    'Krijgt de persoon later een account, nodig hem of haar dan uit als lid en verwijder de gast.',
  // public-link
  'help.guide.public-link.title': 'Een alleen-lezen link publiceren',
  'help.guide.public-link.goal': 'Laat de reis zien aan mensen die hem niet mogen bewerken.',
  'help.guide.public-link.step.1':
    'Klik op Delen; rechts, onder Openbare link, vink aan wat de link mag tonen. Kaart en plan staat altijd aan; Boekingen, Inpaklijst, Onkosten en Chat kies je zelf.',
  'help.guide.public-link.step.2': 'Klik op Link aanmaken en dan op Kopiëren.',
  'help.guide.public-link.step.3': 'De vinkjes kun je veranderen zolang de link bestaat; Link verwijderen stopt hem.',
  'help.guide.public-link.result':
    'Iedereen met de link ziet de gekozen delen zonder in te loggen en kan niets veranderen.',
  'help.guide.public-link.tip.1':
    'De link staat nergens vermeld; wie hem heeft, kan hem openen, dus behandel hem als een wachtwoord.',
  'help.guide.public-link.tip.2': 'Voor bewerkrechten voeg je de persoon in plaats daarvan toe als lid.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'De reis overdragen of verlaten',
  'help.guide.transfer-ownership.goal': 'Maak iemand anders eigenaar, of stap uit een reis die niet van jou is.',
  'help.guide.transfer-ownership.step.1':
    'Klik op Delen. Onder Toegang maakt de kroon op de rij van een lid die persoon eigenaar; bevestig de vraag.',
  'help.guide.transfer-ownership.step.2':
    'Reis verlaten op je eigen rij haalt je uit de reis; als eigenaar draag je hem eerst over.',
  'help.guide.transfer-ownership.result':
    'De nieuwe eigenaar beheert de leden en kan de reis verwijderen; jij blijft een gewoon lid.',
  'help.guide.transfer-ownership.tip.1':
    'De eigenaar is wie de reis heeft aangemaakt, tot hij wordt overgedragen; de reis verwijderen mag alleen de eigenaar.',
  'help.guide.transfer-ownership.tip.2':
    'Toegang verwijderen op een andere rij is dezelfde knop andersom: de eigenaar haalt een lid eruit.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Ruimte maken voor de kaart',
  'help.guide.collapse-columns.goal': 'Klap een kolom weg of geef haar meer breedte.',
  'help.guide.collapse-columns.step.1':
    'Klik op de chevron aan de binnenrand van de dagenkolom om haar in te klappen; de kaart neemt de ruimte. De plekkenkolom heeft dezelfde chevron.',
  'help.guide.collapse-columns.step.2': 'Klik nog eens op de chevron om de kolom terug te halen.',
  'help.guide.collapse-columns.step.3':
    'Sleep de dunne scheidingslijn tussen een kolom en de kaart om de breedte van de kolom te veranderen.',
  'help.guide.collapse-columns.result':
    'De breedtes worden onthouden; de kolommen komen bij het volgende bezoek open terug.',
  'help.guide.collapse-columns.tip.1':
    'Beide kolommen kunnen tegelijk worden weggeklapt voor een weergave met alleen de kaart.',
  'help.guide.collapse-columns.tip.2':
    'Op een telefoon zijn er geen kolommen: Plan en Plaatsen zijn de twee knoppen onderaan de kaart.',
  // undo-change
  'help.guide.undo-change.title': 'De laatste wijziging ongedaan maken',
  'help.guide.undo-change.goal': 'Neem terug wat je net aan het plan hebt gedaan.',
  'help.guide.undo-change.step.1':
    'Klik op de ongedaan-maken-pijl in de werkbalk boven de dagen; zijn tooltip noemt de wijziging die hij terugneemt.',
  'help.guide.undo-change.result': 'Het plan is weer zoals het was, en de pijl wordt grijs tot de volgende wijziging.',
  'help.guide.undo-change.tip.1':
    'Ongedaan maken dekt het plan: plekken toewijzen, verwijderen, herschikken en verplaatsen, een route optimaliseren, plekken wissen, categoriewijzigingen en imports.',
  'help.guide.undo-change.tip.2':
    'Het gaat één stap diep: alleen de laatste wijziging kan worden teruggenomen, en een nieuwe wijziging vervangt haar.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Plekken',
  'help.ctx.trip-places.summary':
    'De rechterkolom van het plan: elke plek van de reis, gepland of niet, met zoeken en filters, en de manieren om plekken binnen te halen, met de hand, uit een bestand of uit een gedeelde lijst.',
  'help.ctx.trip-places.bullet.1':
    'Plaats/activiteit toevoegen bovenaan opent het formulier voor een plek die je typt of zoekt. Zolang een dag open is heet de knop Nieuwe plek, en Naar dag ernaast maakt de plek meteen op die dag aan.',
  'help.ctx.trip-places.bullet.2':
    'Bestand importeren neemt .gpx-, .kml- en .kmz-bestanden; Lijst importeren neemt een gedeelde lijst van Google Maps of Naver Maps. Een bestand kun je ook gewoon op de kolom laten vallen.',
  'help.ctx.trip-places.bullet.3':
    'Het uitklapmenu wisselt tussen Alle, Ongepland, Gepland en, zodra een track is geïmporteerd, Tracks; daaronder zitten het zoekveld, het categoriefilter en de ster voor een minimale beoordeling.',
  'help.ctx.trip-places.bullet.4':
    'Een rij toont afbeelding, naam en beschrijving of adres. Klik erop voor de plaatsdetails, sleep hem op een dag, of klik met rechts voor Bewerken, + Dag, Website openen, Google Maps, In collectie opslaan en Verwijderen.',
  'help.ctx.trip-places.bullet.5':
    'Met een dag open zet een + aan het eind van een ongeplande rij de plek op die dag, en Gepland toont alleen die dag, met Hele reis tonen om weer te verbreden.',
  'help.ctx.trip-places.bullet.6':
    'Het vinkje uiterst rechts in de filterrij start een selectie: meerdere rijen tegelijk krijgen een nieuwe categorie, gaan in een collectie of worden verwijderd.',
  // create-place
  'help.guide.create-place.title': 'Een plek aanmaken',
  'help.guide.create-place.goal':
    'Voeg met de hand een plek of activiteit toe, met alles wat het plan erover moet weten.',
  'help.guide.create-place.step.1':
    'Klik bovenaan de plekkenkolom op Plaats/activiteit toevoegen (Nieuwe plek zolang een dag open is). Het formulier gaat open.',
  'help.guide.create-place.step.2':
    'Typ de plek bovenin in Plaatsen zoeken... en kies een resultaat. Naam, Adres, Breedtegraad, Lengtegraad en Website vullen zich, en Plaatsdetails links toont afbeeldingen, de openingstijden en een beschrijving erbij. Op een TREK met Google-sleutel staat onder de lijst Niet de juiste plek? Zoek in plaats daarvan op Google, dat dezelfde zoekopdracht nog eens via Google draait.',
  'help.guide.create-place.step.3':
    'In Plaatsdetails maakt een klik op een afbeelding onder Kies een afbeelding deze tot de afbeelding van de plek; Deze tekst gebruiken neemt de beschrijving over in het formulier.',
  'help.guide.create-place.step.4':
    'Loop de velden na: Naam is verplicht; Beschrijving en Notities zijn van jou; Adres, Breedtegraad en Lengtegraad komen uit de zoekopdracht of typ je zelf; Categorie kiest een van de categorieën van de reis, en de + ernaast maakt er ter plekke een nieuwe aan; Website neemt de link.',
  'help.guide.create-place.step.5':
    'Klik op Toevoegen. Ligt er al een plek met dezelfde naam in de reis, dan zegt het formulier dat en wordt de knop Toch toevoegen.',
  'help.guide.create-place.result':
    'De plek staat in de lijst en op de kaart, onder Ongepland tot hij op een dag wordt gezet.',
  'help.guide.create-place.tip.1':
    'Bestanden en Kosten onderaan het formulier hangen een document aan de plek, of openen meteen na het opslaan de Kosten-editor voor de uitgave ervan.',
  'help.guide.create-place.tip.2':
    'De TREK-index en OpenStreetMap beantwoorden de zoekopdracht op elke TREK, en Plaatsdetails vult zichzelf uit Wikipedia, Wikivoyage en Wikimedia. Google wordt alleen gevraagd waar die twee leeg blijven, en alleen Google levert beoordelingen.',
  'help.guide.create-place.tip.3':
    'Een plek kan ook op de kaart beginnen: klik met rechts op het punt, en het formulier gaat open met de coördinaten en het adres al ingevuld.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Een plek meteen aan de open dag toevoegen',
  'help.guide.place-to-open-day.goal':
    'Sla de tweede stap over: maak de plek aan of kies hem, en zet hem meteen op de dag.',
  'help.guide.place-to-open-day.step.1':
    'Klik in de dagenkolom op de kop van een dag. De dag is open: zijn kaart is gemarkeerd, en de plekkenkolom krijgt de knop Naar dag erbij.',
  'help.guide.place-to-open-day.step.2':
    'Naar dag opent hetzelfde formulier als Nieuwe plek, alleen komt de plek op de open dag terecht op het moment dat je op Toevoegen klikt.',
  'help.guide.place-to-open-day.step.3':
    'Een plek die al bestaat gaat naar de open dag met de + aan het eind van zijn rij, of met rechts klikken, + Dag.',
  'help.guide.place-to-open-day.step.4':
    'Andersom kan ook, en zonder eerst een dag te openen: sleep de rij van de plek uit de kolom en laat hem los op een dagkaart. Laat je hem tussen twee stops los, dan belandt hij precies daar.',
  'help.guide.place-to-open-day.result':
    'De plek staat onder de dag, helemaal onderaan; sleep hem omhoog of omlaag naar waar hij hoort.',
  'help.guide.place-to-open-day.tip.1':
    'De geopende dag stuurt ook het zoeken: staat een dag open, dan beginnen de kaart en het zoeken in de buurt daar waar die dag toch al komt.',
  'help.guide.place-to-open-day.tip.2': 'Ongedaan maken in de werkbalk boven de dagen neemt de toewijzing terug.',
  // filter-places
  'help.guide.filter-places.title': 'Een plek in de lijst vinden',
  'help.guide.filter-places.goal': 'Versmal de kolom tot de plekken die je zoekt.',
  'help.guide.filter-places.step.1':
    'Het uitklapmenu bovenaan wisselt tussen Alle, Ongepland (nog op geen enkele dag), Gepland (op een dag) en Tracks (geïmporteerde GPX-tracks), elk met zijn aantal.',
  'help.guide.filter-places.step.2': 'Typ in Plaatsen zoeken...; de lijst wordt smaller terwijl je typt.',
  'help.guide.filter-places.step.3':
    'Alle categorieën opent een lijst om een of meer categorieën aan te vinken, Geen categorie daarbij; Filter wissen onderaan zet hem terug.',
  'help.guide.filter-places.step.4':
    'De ster ernaast zet een minimale beoordeling: 5+, 4+ enzovoort tonen alleen plekken die je minstens zo hoog hebt beoordeeld.',
  'help.guide.filter-places.result': 'Het aantal boven de rijen zegt hoeveel plekken passen; de filters werken samen.',
  'help.guide.filter-places.tip.1':
    'Met een dag open toont Gepland alleen die dag en zegt dat ook: Alleen de geopende dag wordt getoond, met Hele reis tonen ernaast.',
  'help.guide.filter-places.tip.2':
    'De kaart versmalt ook tot de open dag; Alle in de lijst toont nog steeds elke plek van de reis.',
  // edit-place
  'help.guide.edit-place.title': 'Een plek wijzigen',
  'help.guide.edit-place.goal': 'Verbeter een naam, verplaats de speld, voeg een website toe of wissel de categorie.',
  'help.guide.edit-place.step.1':
    'Klik met rechts op de rij en kies Bewerken, of open de plek en klik op Bewerken in de details.',
  'help.guide.edit-place.step.2':
    'Wijzig wat je nodig hebt: Naam, Beschrijving, Notities, Adres, Breedtegraad en Lengtegraad, Categorie, Website. Vanuit een dag geopend heeft het formulier ook Notities voor deze dag en Starttijd en Einde voor die dag.',
  'help.guide.edit-place.step.3': 'Klik op Bijwerken.',
  'help.guide.edit-place.result':
    'De wijziging geldt overal waar de plek opduikt: in de lijst, op de kaart en op elke dag waarop hij staat.',
  'help.guide.edit-place.tip.1':
    'Notities voor deze dag hoort bij de plek op die ene dag; Notities hoort bij de plek zelf.',
  'help.guide.edit-place.tip.2':
    'Een Einde vóór de Starttijd blokkeert Bijwerken; Tijdoverlap met: waarschuwt er alleen voor dat een andere stop van de dag dezelfde tijd heeft.',
  // delete-place
  'help.guide.delete-place.title': 'Een plek verwijderen',
  'help.guide.delete-place.goal': 'Haal een plek voorgoed uit de reis.',
  'help.guide.delete-place.step.1':
    'Klik met rechts op de rij en kies Verwijderen, of klik op Verwijderen in de plaatsdetails.',
  'help.guide.delete-place.step.2':
    'Bevestig. Is er op de plek een nacht geboekt, of hangt er een boeking aan, dan zegt de vraag wat er meegaat.',
  'help.guide.delete-place.result':
    'De plek is weg uit de lijst, van de kaart en van elke dag; Ongedaan maken in de werkbalk boven de dagen haalt hem terug.',
  'help.guide.delete-place.tip.1':
    'Om een plek alleen van één dag te halen, gebruik je in plaats daarvan Verwijderen van dag op die stop.',
  'help.guide.delete-place.tip.2': 'Meerdere plekken tegelijk: het vinkje naast de filters start een selectie.',
  // select-places
  'help.guide.select-places.title': 'Meerdere plekken tegelijk wijzigen of verwijderen',
  'help.guide.select-places.goal': 'Ruim de lijst in één keer op in plaats van plek voor plek.',
  'help.guide.select-places.step.1':
    'Klik op het vinkje uiterst rechts in de filterrij. De rijen krijgen vakjes en er verschijnt een balk met de acties.',
  'help.guide.select-places.step.2':
    'Vink de rijen aan, of gebruik Alles selecteren in de balk; de balk telt wat er geselecteerd is.',
  'help.guide.select-places.step.3':
    'Change category geeft ze allemaal één categorie; In collectie opslaan kopieert ze naar een van je collecties; Selectie verwijderen haalt ze na een bevestiging weg.',
  'help.guide.select-places.step.4': 'Klik nog eens op het vinkje om de selectie te verlaten.',
  'help.guide.select-places.result':
    'De wijziging geldt voor elke geselecteerde plek; een verwijdering kun je ongedaan maken vanuit de werkbalk boven de dagen.',
  'help.guide.select-places.tip.1':
    'De filters blijven werken terwijl je selecteert: filter eerst op Ongepland, dan pakt Alles selecteren precies die.',
  'help.guide.select-places.tip.2':
    'Markeer als bezocht in je lijsten verschijnt in de balk als de add-on Collecties aan staat: hij vinkt de plekken af in de collecties waarin ze zijn opgeslagen.',
  // import-places-file
  'help.guide.import-places-file.title': 'Plekken importeren uit een GPX-, KML- of KMZ-bestand',
  'help.guide.import-places-file.goal':
    'Haal binnen wat Google My Maps, Google Earth of een GPS-tracker heeft geëxporteerd.',
  'help.guide.import-places-file.step.1':
    'Klik op Bestand importeren, of laat het bestand ergens op de plekkenkolom vallen.',
  'help.guide.import-places-file.step.2':
    'Kies het bestand of sleep het in het vak. Bij een GPX vink je aan wat je importeert: Waypoints, Routes, Tracks (met routegeometrie); bij KML en KMZ Punten (Placemarks) en Paden (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Het vak neemt meerdere bestanden tegelijk, en alleen .gpx, .kml en .kmz. Een ander soort bestand, of een bestand groter dan 10 MB, wordt in het dialoogvenster geweigerd en niet geïmporteerd.',
  'help.guide.import-places-file.step.4':
    'Klik op Importeren. Een melding zegt hoeveel plekken er binnen zijn gekomen; bij een KML- of KMZ-bestand blijft het dialoogvenster open met een samenvatting van wat is aangemaakt en wat is overgeslagen.',
  'help.guide.import-places-file.result':
    'De plekken staan in de lijst; een track draagt een routemarkering op zijn rij, tekent zich op de kaart en krijgt zijn eigen filter Tracks.',
  'help.guide.import-places-file.tip.1':
    'Een te groot bestand wordt geweigerd met de groottelimiet; exporteer het opnieuw zonder foto’s, of splits het.',
  'help.guide.import-places-file.tip.2':
    'De import kun je in zijn geheel ongedaan maken vanuit de werkbalk boven de dagen.',
  // import-places-list
  'help.guide.import-places-list.title': 'Een gedeelde lijst van Google Maps of Naver Maps importeren',
  'help.guide.import-places-list.goal': 'Maak van de link van een gedeelde lijst plekken.',
  'help.guide.import-places-list.step.1': 'Klik op Lijst importeren en kies Google Lijst of Naver Lijst.',
  'help.guide.import-places-list.step.2':
    'Plak de gedeelde link van de lijst. Een routebeschrijvingslink van Google Maps werkt ook: zijn stops worden plekken, in rijvolgorde.',
  'help.guide.import-places-list.step.3': 'Klik op Importeren.',
  'help.guide.import-places-list.result':
    'Elke plek van de lijst zit in de reis, met de naam uit de lijst; plekken die al in de reis zitten worden overgeslagen.',
  'help.guide.import-places-list.tip.1':
    'De lijst moet openbaar gedeeld zijn; de link van een privélijst importeert niets.',
  'help.guide.import-places-list.tip.2':
    'Plaatsen verrijken via Google verschijnt in het dialoogvenster als jouw TREK een Google-sleutel heeft: het zoekt elke geïmporteerde plek op en vult foto’s, adres en details aan.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dagen',
  'help.ctx.trip-days.summary':
    'De linkerkolom van het plan: één kaart per dag met de stops op volgorde, de notities, de boekingen en het vervoer van de dag, en de route tussen de stops. Hier wordt de reis echt gepland.',
  'help.ctx.trip-days.bullet.1':
    'De werkbalk bovenaan: Exporteren (PDF, agenda, GPX), Expand all days / Collapse all days, de pijl Ongedaan maken, Dagen herordenen en Alle boekingsroutes tonen.',
  'help.ctx.trip-days.bullet.2':
    'Een dagkaart: nummer, weer, titel, datum en de kosten van de dag in de kop; klik op de kop om de dag te openen, het pijltje vouwt hem dicht. Openbaar vervoer, Vervoer toevoegen en Notitie toevoegen staan ook in de kop.',
  'help.ctx.trip-days.bullet.3':
    'Binnen een dag: de stops op volgorde, elk met afbeelding, naam, tijd en een slotje op de afbeelding; notities; boekingen die bij de dag horen; en tussen de stops de reistijd van elk traject.',
  'help.ctx.trip-days.bullet.4':
    'Onder de stops de routebalk: Route tekent de dag op de kaart, Optimaliseren sorteert de stops, Auto / Lopen zet de vervoerswijze van de dag, Openen in Google Maps en Openen in CoMaps geven de dag door.',
  'help.ctx.trip-days.bullet.5':
    'Plekken komen op een dag door een rij uit de plekkenkolom te slepen, met de + op die rij, met Plaats toevoegen aan deze dag op een lege dag, of vanuit de plaatsdetails.',
  'help.ctx.trip-days.bullet.6':
    'Totale kosten onderaan telt elke stop en elke boeking met een prijs bij elkaar op, in de valuta van de reis.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Een dag lezen',
  'help.guide.read-day-plan.goal': 'Weten wat elk onderdeel van een dagkaart je vertelt voordat je iets verandert.',
  'help.guide.read-day-plan.step.1':
    'De kop: het dagnummer, de voorspelling voor de dag, Dag 1 of de titel die je hebt gegeven, de datum en de kosten van de dag. Klik op de kop om de dag te openen (de Dagdetails gaan open boven de kaart); het pijltje rechts vouwt de kaart dicht en weer open.',
  'help.guide.read-day-plan.step.2':
    'Een stop: het greepje links sleept hem, de afbeelding draagt een slotje voor de route-optimalisatie, dan de naam, de beschrijving en, als ze er zijn, de Notities voor deze dag. Een tijdlabel toont Starttijd en Einde als de stop die heeft; de pijlen die aan het rechteruiteinde verschijnen zetten hem omhoog of omlaag.',
  'help.guide.read-day-plan.step.3':
    'Een boeking op de dag: een reservering bij een stop markeert die stop als Reservering bevestigd of Reservering in behandeling, en vervoer verschijnt als Vertrek of Aankomst met tijd en traject, met een klein schakelaartje dat die route op de kaart tekent.',
  'help.guide.read-day-plan.step.4':
    'Tussen twee stops zegt de verbinding hoe lang het traject duurt en hoe ver het is, in de vervoerswijze van de dag; klik erop om de wijze voor dat ene traject te veranderen.',
  'help.guide.read-day-plan.step.5':
    'De routebalk aan het eind: Route tekent de weg van de dag op de kaart, Optimaliseren zet de stops op een nieuwe volgorde, de knoppen kiezen Auto of Lopen, Openen in Google Maps en Openen in CoMaps openen de dag daar.',
  'help.guide.read-day-plan.result':
    'Elk symbool op de kaart heeft een betekenis; de gidsen hieronder veranderen ze stuk voor stuk.',
  'help.guide.read-day-plan.tip.1':
    'Klik met rechts op een stop voor zijn menu: Bewerken, Verwijderen van dag, Website openen, de navigatie-apps (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), In collectie opslaan, Verwijderen.',
  'help.guide.read-day-plan.tip.2':
    'Ga met de muis over een stop en aan het eind verschijnt Boeking toevoegen: een reservering die je daar maakt hangt aan deze stop op deze dag.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Een plek op een dag zetten',
  'help.guide.place-onto-day.goal':
    'Van een plek uit de lijst een stop van de dag maken, daar waar hij in de volgorde hoort.',
  'help.guide.place-onto-day.step.1':
    'Sleep een rij uit de plekkenkolom op de dagkaart. Laat hem tussen twee stops vallen om hem precies daar te zetten, of ergens op de kaart om hem achteraan toe te voegen.',
  'help.guide.place-onto-day.step.2':
    'Zonder slepen: open de dag met een klik op de kop, klik dan op de + aan het eind van de rij van de plek, of klik met rechts op de rij en kies + Dag.',
  'help.guide.place-onto-day.step.3':
    'Op een lege dag opent Plaats toevoegen aan deze dag het plaatsformulier, en de nieuwe plek belandt meteen op de dag.',
  'help.guide.place-onto-day.step.4':
    'Vanuit de plaatsdetails vraagt Toevoegen aan dag welke dag; vanuit de kop van de dag maakt Naar dag in de plekkenkolom een nieuwe plek op de geopende dag aan.',
  'help.guide.place-onto-day.result':
    'De plek is een stop van de dag, op de kaart met het nummer van de dag, en de plekkenkolom telt hem onder Gepland.',
  'help.guide.place-onto-day.tip.1':
    'Een plek kan op meerdere dagen staan: zet hem vanuit de plekkenkolom op de tweede dag. Een stop van de ene dagkaart naar de andere slepen verplaatst hem juist.',
  'help.guide.place-onto-day.tip.2': 'De pijl Ongedaan maken in de werkbalk draait de toewijzing terug.',
  'help.guide.place-onto-day.tip.3':
    'Een stop kan niet tussen twee items met vaste tijden worden losgelaten, en ook niet vóór een boeking die al een tijd heeft; het plan houdt zijn chronologie.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'De volgorde van een dag veranderen',
  'help.guide.reorder-stops.goal': 'Een stop omhoog of omlaag zetten, of naar een andere dag.',
  'help.guide.reorder-stops.step.1': 'Sleep de stop aan zijn greepje naar de nieuwe plek in de kaart.',
  'help.guide.reorder-stops.step.2':
    'Of gebruik de pijlen aan het rechteruiteinde van de stop: één stap omhoog of omlaag per klik.',
  'help.guide.reorder-stops.step.3':
    'Sleep de stop op een andere dagkaart om hem daarheen te verplaatsen; hij verlaat de oude dag.',
  'help.guide.reorder-stops.step.4':
    'Een stop met een vast tijdstip vraagt Tijd verwijderen? als de verplaatsing de volgorde van de dag zou doorbreken, want het tijdstip bepaalde zijn plek: Bevestigen haalt het tijdstip weg en dan mag hij overal heen.',
  'help.guide.reorder-stops.result': 'De route en de reistijden volgen de nieuwe volgorde meteen.',
  'help.guide.reorder-stops.tip.1':
    'Boekingen met een vast tijdstip kunnen niet worden verplaatst; ze staan waar hun tijd ze zet.',
  'help.guide.reorder-stops.tip.2':
    'Optimaliseren in de routebalk zet de hele dag op de kortste weg; vergrendel eerst een stop om hem te laten staan waar hij staat.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Een stop een tijd geven',
  'help.guide.set-stop-times.goal':
    'Vastleggen wanneer een stop begint en eindigt, zodat de dag als een dienstregeling leest.',
  'help.guide.set-stop-times.step.1':
    'Klik met rechts op de stop en kies Bewerken. Geopend vanuit de dag heeft het formulier onderaan Starttijd en Einde.',
  'help.guide.set-stop-times.step.2':
    'Vul Starttijd in en, als je wilt, Einde. Tijdoverlap met: waarschuwt dat een andere stop van de dag met een tijd overlapt; een Einde vóór de Starttijd blokkeert Bijwerken.',
  'help.guide.set-stop-times.step.3':
    'Klik op Bijwerken. De stop krijgt een tijdlabel en schuift naar de plek waar zijn tijd in de dag hoort.',
  'help.guide.set-stop-times.result':
    'Stops met een tijd houden hun plek in de volgorde; stops zonder tijd sorteren zich eromheen.',
  'help.guide.set-stop-times.tip.1':
    'De tijd hoort bij de stop op die dag; dezelfde plek kan op een andere dag een andere tijd hebben.',
  'help.guide.set-stop-times.tip.2':
    'Om een stop met tijd met de hand te verplaatsen, sleep je hem: de vraag Tijd verwijderen? haalt het tijdstip onderweg weg, zodra je op Bevestigen klikt.',
  'help.guide.set-stop-times.tip.3':
    'Het veld Notities voor deze dag in hetzelfde formulier houdt vast wat alleen op deze dag geldt, een gereserveerde tafel, een ticketnummer.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Een stop van een dag halen',
  'help.guide.remove-from-day.goal': 'Een plek uit de planning halen zonder hem uit de reis te verwijderen.',
  'help.guide.remove-from-day.step.1': 'Klik met rechts op de stop en kies Verwijderen van dag.',
  'help.guide.remove-from-day.step.2':
    'De stop is weg uit de dag; de plek blijft in de plekkenkolom, onder Ongepland als hij op geen enkele andere dag staat.',
  'help.guide.remove-from-day.result':
    'De dag, zijn route en zijn kosten worden bijgewerkt; de pijl Ongedaan maken haalt de stop terug.',
  'help.guide.remove-from-day.tip.1':
    'Verwijderen in hetzelfde menu haalt de plek uit de hele reis, elke dag inbegrepen.',
  'help.guide.remove-from-day.tip.2':
    'Verwijderen van dag staat ook in het detailpaneel van de plek, naast Toevoegen aan dag.',
  // lock-stop
  'help.guide.lock-stop.title': 'Een stop op zijn plek vastzetten',
  'help.guide.lock-stop.goal': 'Een stop houden waar hij staat als de route wordt geoptimaliseerd.',
  'help.guide.lock-stop.step.1':
    'Ga met de muis over de afbeelding van de stop en klik op het slotje: Positie behouden tijdens route-optimalisatie.',
  'help.guide.lock-stop.step.2':
    'Optimaliseren sorteert nu de andere stops eromheen; klik nog eens op het slotje (Klik om te ontgrendelen) om hem los te laten.',
  'help.guide.lock-stop.result':
    'Het slotje staat op de afbeelding; de stop houdt zijn positie tot je hem ontgrendelt.',
  'help.guide.lock-stop.tip.1':
    'Een stop met een vaste tijd is door zijn tijd vergrendeld; hij beweegt tijdens het optimaliseren nooit.',
  'help.guide.lock-stop.tip.2':
    'Het slot geldt voor dit bezoek: na een herlaadbeurt is elke stop weer vrij, alleen stops met een tijd blijven vast.',
  // day-note
  'help.guide.day-note.title': 'Een notitie aan een dag toevoegen',
  'help.guide.day-note.goal': 'Een geheugensteun, een ticketnummer of een plan B in de dag zelf bewaren.',
  'help.guide.day-note.step.1': 'Klik op Notitie toevoegen in de kop van de dag.',
  'help.guide.day-note.step.2':
    'Geef hem een naam onder Notitie, dat is wat er in de dag te zien is, en schrijf de rest onder Dagnotitie. De werkbalk erboven maakt de tekst op (Vet, Opsomming, Link, Citaat), en Voorbeeld, links, toont hoe de notitie er in de dag uit komt te zien.',
  'help.guide.day-note.step.3':
    'Kies een Pictogram en een Kleur, zodat de notitie opvalt tussen de stops, en dan Toevoegen.',
  'help.guide.day-note.step.4':
    'De notitie staat in de dag als een stop: sleep hem op zijn plek, klik met rechts voor Bewerken en Verwijderen.',
  'help.guide.day-note.result':
    'De notitie hoort bij de dag, ook in de PDF; een notitie met een tijd sorteert mee met de stops met een tijd.',
  'help.guide.day-note.tip.1':
    'Een notitie met een tijd kan invallen voor vervoer waarvoor je geen boeking hebt: „08:15 S3 vanaf het centraal station“.',
  'help.guide.day-note.tip.2': 'Notities gelden per dag; een notitie voor de hele reis hoort in Samenwerking.',
  // day-route
  'help.guide.day-route.title': 'De route van de dag tonen en optimaliseren',
  'help.guide.day-route.goal': 'De weg tussen de stops zien, kiezen hoe je reist, en TREK de volgorde laten sorteren.',
  'help.guide.day-route.step.1':
    'Open de dag en klik op Route in de routebalk: de weg tussen de stops wordt op de kaart getekend, en de verbindingen tussen de stops tonen de tijd en de afstand van elk traject.',
  'help.guide.day-route.step.2':
    'Auto en Lopen ernaast zetten de vervoerswijze van de dag; de trajecten worden opnieuw berekend. Plugins kunnen eigen vervoerswijzen toevoegen.',
  'help.guide.day-route.step.3':
    'Klik op een verbinding om de wijze van dat ene traject te veranderen: kies een wijze, of Dagstandaard gebruiken om terug te vallen op die van de dag.',
  'help.guide.day-route.step.4':
    'Optimaliseren zet de stops op de kortste weg. Stops met een slotje of een vaste tijd houden hun plek; met een accommodatie op de dag begint de route daar.',
  'help.guide.day-route.step.5':
    'Openen in Google Maps of Openen in CoMaps opent de hele dag als route in die app, om onderweg op te navigeren.',
  'help.guide.day-route.result':
    'De dag is een route met tijden; Totale kosten en de trajecten veranderen mee met de volgorde.',
  'help.guide.day-route.tip.1':
    'Routes komen standaard van OSRM; de beheerder kan TREK onder Standaardinstellingen op een andere routeringsdienst richten.',
  'help.guide.day-route.tip.2':
    'Een traject dat niet kon worden berekend toont geen tijd; controleer of beide stops coördinaten hebben.',
  'help.guide.day-route.tip.3': 'De pijl Ongedaan maken draait een optimalisatie terug.',
  // manage-days
  'help.guide.manage-days.title': 'Dagen toevoegen, herordenen en hernoemen',
  'help.guide.manage-days.goal': 'De dagen zelf vormgeven, niet alleen wat erop staat.',
  'help.guide.manage-days.step.1':
    'De dagen komen uit de data van de reis; verander de data op de reiskaart onder Dashboard en er komen dagen bij of vallen dagen weg aan de uiteinden. Voordat een dag met inhoud wegvalt, laat een lijst zien welke dagen verdwijnen en wat erop staat.',
  'help.guide.manage-days.step.2':
    'Dagen herordenen in de werkbalk opent een lijst: Omhoog en Omlaag verschuiven een dag met alles wat erop staat, en Dag verwijderen, de prullenbak ernaast, haalt hem weg. Onder de lijst voegt de knop met de volgende datum een dag toe direct na de laatste dag met datum en verlengt de reis met een dag; Zonder datum zet een dag zonder datum achteraan.',
  'help.guide.manage-days.step.3':
    'Dag verwijderen vraagt eerst: de lijst laat zien wat er met de dag verdwijnt, zijn plekken, notities en boekingen, een verblijf met in- of uitchecken op die dag en de dagen die een datum naar voren schuiven. Dag verwijderen haalt hem weg, Annuleren houdt hem; de laatste dag kan niet worden verwijderd.',
  'help.guide.manage-days.step.4':
    'Om een dag te hernoemen open je hem en klik je op het potlood naast de titel in de Dagdetails boven de kaart; de naam vervangt Dag 1 in de kaart en in de PDF.',
  'help.guide.manage-days.step.5':
    'Expand all days en Collapse all days in de werkbalk vouwen elke kaart in één keer; een enkele kaart vouwt met zijn eigen pijltje.',
  'help.guide.manage-days.result':
    'De data blijven bij de positie: een dag die omhoog gaat krijgt de eerdere datum, en zijn stops, notities en boekingen reizen mee.',
  'help.guide.manage-days.tip.1':
    'Dagen verschuiven kan via de werkbalk ongedaan worden gemaakt, een dag verwijderen niet.',
  'help.guide.manage-days.tip.2':
    'De kosten in de kop van een dag tellen de stops en boekingen van die dag op die een prijs dragen.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Boekingen en vervoer in het plan lezen',
  'help.guide.bookings-in-plan.goal': 'Weten waar een boeking opduikt zodra ze bestaat, en welk scherm haar aanmaakt.',
  'help.guide.bookings-in-plan.step.1':
    'Vervoer (Vlucht, Trein, Veerboot, Bus, Auto) verschijnt op de dag van vertrek als Vertrek en op de dag van aankomst als Aankomst, met tijd en traject; een rit over meerdere dagen overspant de dagen ertussen.',
  'help.guide.bookings-in-plan.step.2':
    'Een reservering die aan een stop hangt (een Restaurant, een Rondleiding) markeert die stop als Reservering bevestigd of Reservering in behandeling; een boeking met een dag maar zonder stop is een eigen rij in de dag.',
  'help.guide.bookings-in-plan.step.3':
    'Een nacht in een hotel is een accommodatie: die staat in de Dagdetails onder Accommodatie, van Inchecken tot Uitchecken, en de route van elk van die dagen begint daar.',
  'help.guide.bookings-in-plan.step.4':
    'Op de kaart tekent het schakelaartje op een vervoersrij zijn route; Alle boekingsroutes tonen in de werkbalk tekent ze allemaal.',
  'help.guide.bookings-in-plan.step.5':
    'Aanmaken: Boeking toevoegen op een stop waar je met de muis overheen gaat, Vervoer toevoegen en Openbaar vervoer in de kop van de dag, en de tabbladen Boekingen en Transport voor de volledige lijst met import en bestanden.',
  'help.guide.bookings-in-plan.result':
    'Eén boeking, één plek in het plan; de tabbladen zijn dezelfde boekingen als lijst.',
  'help.guide.bookings-in-plan.tip.1':
    'Bevestigd en In behandeling is een status die je op de boeking zet; het plan toont hem op de stop, het tabblad Boekingen telt ze allebei.',
  'help.guide.bookings-in-plan.tip.2':
    'Vervoer met een vast tijdstip kan niet worden gesleept; verander in plaats daarvan de tijd in de boeking.',
  // export-plan
  'help.guide.export-plan.title': 'Het plan exporteren',
  'help.guide.export-plan.goal': 'Het plan meenemen als document, in je agenda of op een gps.',
  'help.guide.export-plan.step.1': 'Klik op Exporteren in de werkbalk boven de dagen.',
  'help.guide.export-plan.step.2':
    'Document: PDF opent de afdrukweergave van elke dag met zijn stops, notities en boekingen; Pagina-einde per dag begint elke dag op een nieuwe pagina, Opslaan als PDF haalt hem binnen.',
  'help.guide.export-plan.step.3':
    'Agenda: .ics downloaden bewaart de boekingen als agendabestand; Abonneren op kalender geeft een link die je agenda-app zelf ververst.',
  'help.guide.export-plan.step.4':
    'Kaarten en gps · GPX: Hele reis exporteert plekken, dagroutes en tracks; Alleen plekken de punten; Dagen als routes één route per dag, voor offlinekaarten en gps-apparaten.',
  'help.guide.export-plan.result': 'Het bestand wordt gedownload; in de reis verandert niets.',
  'help.guide.export-plan.tip.1':
    'Eén losse dag gaat vanuit zijn routebalk naar een kaartenapp: Openen in Google Maps of Openen in CoMaps.',
  'help.guide.export-plan.tip.2':
    'Abonneren op kalender heeft ingeschakelde agendafeeds in je instellingen nodig; Dashboard heeft er een gids voor.',
  'help.guide.export-plan.tip.3': 'Exporteren is lezen: elk lid van de reis kan het.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Plaatsdetails',
  'help.ctx.trip-place.summary':
    'De plaatsdetails gaan boven de kaart open als je een plek kiest: alles wat de reis over hem weet, de sterren die iedereen gaf, zijn afbeelding en zijn bestanden, en de knoppen die hem op de open dag, in een lijst of in een kaarten-app zetten.',
  'help.ctx.trip-place.bullet.1':
    'Klik op een rij in de plekkenkolom, op een stop in een dag of op een marker op de kaart, en de plaatsdetails gaan boven de kaart open. Kies je hem in een dag, dan weten de details welke stop je bedoelt, en dat is wat de deelnemers van de stop en zijn boeking meebrengt.',
  'help.ctx.trip-place.bullet.2':
    'De kop draagt de ronde afbeelding, de naam, de categorie, het adres en de coördinaten. Klik op de afbeelding om er een van jezelf te nemen, dubbelklik op de naam om de plek ter plekke te hernoemen, en de X rechts sluit de details.',
  'help.ctx.trip-place.bullet.3':
    'Daaronder: de prijs als hij er een heeft, de sterren die elke reiziger de plek gaf, de beschrijving en de notities, en Notities voor deze dag als de stop die draagt.',
  'help.ctx.trip-place.bullet.4':
    'Openingstijden, Routekleur, Routegegevens en Bestanden volgen, voor zover ze van toepassing zijn. Bestanden neemt alles uit je mappen en toont ook wat aan de boeking van deze stop hangt.',
  'help.ctx.trip-place.bullet.5':
    'De rij onderaan: Toevoegen aan dag of Verwijderen van dag zolang een dag open is, dan In collectie opslaan, Navigatie, Website openen, Bewerken en Verwijderen.',
  'help.ctx.trip-place.bullet.6':
    'Een plek die uit het zoeken is gekozen draagt wat de TREK-index of OpenStreetMap over hem weten: een groene ring met Openingstijden of een rode met Gesloten om de afbeelding, beoordeeld naar de eigen klok van de plek, het telefoonnummer onder de sterren, Openingstijden verderop met de regel van de dag op de rij en de hele week achter een klik, en zijn website achter Website openen. De beoordeling van Google verschijnt alleen bij een plek die via Google is gevonden, op een TREK met een Google-sleutel.',
  // read-place
  'help.guide.read-place.title': 'Wat de plaatsdetails je over een plek vertellen',
  'help.guide.read-place.goal': 'Lees alles wat de reis over een plek weet, in één venster.',
  'help.guide.read-place.step.1':
    'Klik in de dagenkolom op de stop die je wilt lezen. De plaatsdetails gaan boven de kaart open en de stop blijft gemarkeerd in zijn dag.',
  'help.guide.read-place.step.2':
    'De kop: de ronde afbeelding, de naam, het adres en de exacte coördinaten. Een groene ring met Openingstijden, of een rode met Gesloten, om de afbeelding zegt of de plek op dit moment open is, naar zijn eigen klok, zodra TREK zijn tijden kent. De X rechts sluit de details weer.',
  'help.guide.read-place.step.3':
    'Daaronder de sterren die elke reiziger de plek gaf, met het gemiddelde en hoeveel er stemden. Nog niet beoordeeld zolang niemand dat deed. Direct daaronder het telefoonnummer waar de plek er een heeft: een klik erop geeft het nummer door aan je telefoon-app.',
  'help.guide.read-place.step.4':
    'Dan de beschrijving en daaronder de notities. Allebei zijn het de tekst uit het formulier van de plek, gerenderd: lijsten, links en vet werken allemaal.',
  'help.guide.read-place.step.5':
    'Deelnemers zegt wie er naar deze stop gaat. Iedereen doet mee tot je iemand eruit haalt.',
  'help.guide.read-place.step.6':
    'Openingstijden, verderop: de rij draagt de tijden van de dag waar je naar kijkt, en een klik erop vouwt de hele week open met die dag in vet. Bestanden staat ernaast.',
  'help.guide.read-place.result':
    'De details blijven open tot je ze met de X sluit of een andere plek kiest, de tijden van de week blijven opengevouwen, en de stop waar ze bij horen blijft gemarkeerd in de dagenkolom.',
  'help.guide.read-place.tip.1':
    'Vanuit de plekkenkolom gekozen kennen de details de plek maar geen stop, dus tonen ze geen deelnemers en geen boeking. Kies in plaats daarvan de stop in de dag, dan zijn ze er allebei.',
  'help.guide.read-place.tip.2':
    'Dubbelklik op de naam om de plek te hernoemen zonder het formulier te openen. Enter slaat op, Escape laat de wijziging vallen.',
  'help.guide.read-place.tip.3':
    'Een plek die met de hand is ingetypt toont daar niets van: de details kennen alleen wat het formulier bevat. Open hem met Bewerken, kies hem uit de suggesties onder Plaatsen zoeken… en klik op Bijwerken, en de tijden, het telefoonnummer en de website komen mee. De beoordeling van Google heeft een Google-sleutel nodig.',
  // rate-place
  'help.guide.rate-place.title': 'Een plek beoordelen',
  'help.guide.rate-place.goal': 'Geef een plek je eigen sterren, en zie wat iedereen hem gaf.',
  'help.guide.rate-place.step.1':
    'Open de plek. De sterrenrij zit direct onder de kop en draagt het gemiddelde van de stemmen tot nu toe, met hun aantal tussen haakjes.',
  'help.guide.rate-place.step.2':
    'Klik op de ster die je bedoelt. De sterren vullen zich terwijl je eroverheen gaat, zo zie je wat je op het punt staat te geven.',
  'help.guide.rate-place.step.3':
    'Je stem telt meteen mee in het gemiddelde, en de gezichten ernaast zijn wie er stemden. Houd de muis op de rij om ieders sterren te zien.',
  'help.guide.rate-place.step.4':
    'Hetzelfde gemiddelde staat op de rij van de plek in de plekkenkolom, zo vallen de goede op in de lijst.',
  'help.guide.rate-place.result':
    'Je sterren staan op de plek voor de hele reis, en de ster in de filterrij boven de lijst kan nu alleen de plekken houden die een ondergrens halen.',
  'help.guide.rate-place.tip.1':
    'Elke reiziger mag beoordelen, ook op een reis waar maar sommigen het recht Plaatsen toevoegen / bewerken / verwijderen hebben.',
  'help.guide.rate-place.tip.2':
    'Klik op de ster die je al gaf om je stem terug te nemen. Als er niemand meer stemt, leest de plek weer Nog niet beoordeeld.',
  'help.guide.rate-place.tip.3':
    'Er passen tot zes stemmers als gezichten naast de sterren; de tooltip noemt ze allemaal, en markeert de jouwe.',
  // place-image
  'help.guide.place-image.title': 'Je eigen afbeelding op een plek zetten',
  'help.guide.place-image.goal': 'Vervang de automatische miniatuur door een foto van jezelf.',
  'help.guide.place-image.step.1': 'Open de plek vanuit de plekkenkolom.',
  'help.guide.place-image.step.2':
    'Houd de muis op de ronde afbeelding in de kop: er verschijnt een camera en de tooltip zegt Afbeelding uploaden. Klik erop en kies je bestand.',
  'help.guide.place-image.step.3': 'De kop toont nu jouw afbeelding, met een kleine rode X in de hoek.',
  'help.guide.place-image.step.4':
    'Dezelfde afbeelding staat op de rij van de plek in de plekkenkolom, en op zijn marker op de kaart.',
  'help.guide.place-image.result':
    'Jouw afbeelding is overal de afbeelding van de plek: de details, de plekkenkolom, de stop in de dag, de marker op de kaart en een gedeelde reis.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF en WebP worden aangenomen, en een HEIC van een iPhone wordt onderweg omgezet.',
  'help.guide.place-image.tip.2':
    'De X in de hoek haalt jouw afbeelding er weer af en de automatische komt terug. De plek zelf blijft ongemoeid.',
  'help.guide.place-image.tip.3':
    'Zonder een eigen afbeelding zoekt TREK er een op uit de coördinaten van de plek, en valt terug op het icoon van de categorie.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'De plek op de open dag zetten, of eraf halen',
  'help.guide.place-day-assign.goal': 'Gebruik de knop in de details in plaats van de rij door de planner te slepen.',
  'help.guide.place-day-assign.step.1':
    'Klik in de dagenkolom op de kop van een dag. Die dag is nu de open dag, en de details werken daarmee.',
  'help.guide.place-day-assign.step.2':
    'Klik in de plekkenkolom op een plek die niet op die dag staat. Zijn details gaan open en de rij onderaan biedt Toevoegen aan dag.',
  'help.guide.place-day-assign.step.3':
    'Klik op Toevoegen aan dag. De stop belandt aan het eind van de dag en de knop wordt Verwijderen van dag.',
  'help.guide.place-day-assign.step.4':
    'De stop staat nu in de dag, als laatste in de lijst. Sleep hem omhoog naar zijn plaats.',
  'help.guide.place-day-assign.step.5':
    'Verwijderen van dag haalt die stop weer van de dag, en de details bieden opnieuw Toevoegen aan dag.',
  'help.guide.place-day-assign.result':
    'De dag draagt de stop, of draagt hem niet meer, en de plek zelf blijft hoe dan ook ongemoeid.',
  'help.guide.place-day-assign.tip.1':
    'De knop bestaat alleen zolang een dag open is. Zonder dag hebben de details niets om de plek aan toe te voegen.',
  'help.guide.place-day-assign.tip.2':
    'Een stop van een dag halen laat de plek in de reis en in de plekkenkolom staan. Verwijderen is wat hem overal weghaalt.',
  'help.guide.place-day-assign.tip.3':
    'Een stop die een overnachtingsboeking op de dag zette biedt geen van beide knoppen: die nacht wordt toegevoegd en weggehaald in het blok Accommodatie van de dag.',
  // place-participants
  'help.guide.place-participants.title': 'Zeggen wie er naar deze stop gaat',
  'help.guide.place-participants.goal': 'Splits de groep voor één stop zonder de reis te splitsen.',
  'help.guide.place-participants.step.1':
    'Klik op de stop in de dag. De details gaan open en Deelnemers toont iedereen in de reis.',
  'help.guide.place-participants.step.2':
    'Klik op de naam van een reiziger om hem uit deze stop te halen. De naam wordt doorgestreept terwijl je erover zweeft.',
  'help.guide.place-participants.step.3':
    'Zodra er iemand mist verschijnt er een gestippelde +. Klik erop om te zien wie er niet op de stop staat.',
  'help.guide.place-participants.step.4':
    'Klik op een naam om hem terug te zetten. Met iedereen terug is de stop weer van de hele groep.',
  'help.guide.place-participants.result':
    'De stop draagt de reizigers die je koos, en de rest van de groep heeft die middag voor zichzelf.',
  'help.guide.place-participants.tip.1':
    'Deelnemers verschijnt alleen met een geselecteerde stop, kies de plek dus in de dag en niet in de plekkenkolom, en alleen op een reis met meer dan één reiziger.',
  'help.guide.place-participants.tip.2':
    'Niemand gekozen betekent dat iedereen meegaat, en daarom kan de laatste reiziger die op een stop over is er niet uit worden gehaald.',
  'help.guide.place-participants.tip.3':
    'Een gast, die geen eigen account heeft, kan net als ieder ander deelnemer zijn.',
  // place-booking
  'help.guide.place-booking.title': 'De boeking op een stop',
  'help.guide.place-booking.goal': 'Lees de boeking die bij een stop hoort, open hem, en hang er een nieuwe aan.',
  'help.guide.place-booking.step.1':
    'Open de stop waar de boeking bij hoort. De details tonen een strook met Bevestigd of In behandeling en de naam van de boeking.',
  'help.guide.place-booking.step.2':
    'De strook draagt de Datum, de Tijd en de Boekingscode, en de notities die de boeking heeft.',
  'help.guide.place-booking.step.3': 'Klik op de strook. Het eigen formulier van de boeking gaat erop open.',
  'help.guide.place-booking.step.4':
    'Koppelen aan dagtoewijzing is wat een boeking aan een stop hangt, en hier noemt het deze al. Sluit het formulier weer.',
  'help.guide.place-booking.step.5':
    'Een nieuwe boeking voor een stop begint in de dagenkolom: zweef over de stop en klik op de + aan het eind. Het formulier gaat open als Nieuwe reservering, al eraan gekoppeld.',
  'help.guide.place-booking.result':
    'De boeking hangt aan de stop: hij staat in de details, hij staat in de dag, en zijn bestanden staan hier ook onder Bestanden.',
  'help.guide.place-booking.tip.1':
    'De strook verschijnt alleen bij de stop waaraan de boeking hangt. Een boeking zonder stop woont op het tabblad Boekingen.',
  'help.guide.place-booking.tip.2':
    'Meerdere boekingen kunnen één stop delen: de lunch en de tour die bij dezelfde deur vertrekt.',
  'help.guide.place-booking.tip.3':
    'Een trein, een vlucht of een veerboot opent in plaats daarvan het transportformulier, dat van het tabblad Transport.',
  // place-files
  'help.guide.place-files.title': 'De tickets van een plek bij de plek houden',
  'help.guide.place-files.goal': 'Leg het ticket, de voucher of de plattegrond voor een plek waar je hem zult zoeken.',
  'help.guide.place-files.step.1':
    'Open de plek. Bestanden zit onderaan de details en leest Bestanden zolang de plek er geen heeft.',
  'help.guide.place-files.step.2': 'Klik ernaast op Uploaden en kies het bestand.',
  'help.guide.place-files.step.3': 'De knop telt wat de plek heeft, en de lijst gaat vanzelf open.',
  'help.guide.place-files.step.4':
    'Elke rij is de naam van het bestand met zijn grootte. Klik erop om het bestand te openen.',
  'help.guide.place-files.result':
    'Het bestand zit op de plek, geteld in de details, en het staat ook op het tabblad Bestanden van de reis.',
  'help.guide.place-files.tip.1':
    'Bestanden toont ook wat aan de boeking van deze stop hangt, dus een hotelbevestiging duikt op bij het hotel.',
  'help.guide.place-files.tip.2': 'Uploaden neemt meerdere bestanden tegelijk.',
  'help.guide.place-files.tip.3':
    'Zonder het recht Bestanden uploaden is de knop Uploaden er niet; bestanden die al op de plek staan blijven.',
  // place-navigation
  'help.guide.place-navigation.title': 'Een plek in een kaarten-app of op zijn website openen',
  'help.guide.place-navigation.goal': 'Geef de plek door aan de app die je er echt heen brengt.',
  'help.guide.place-navigation.step.1': 'Open de plek en klik op Navigatie in de rij onderaan.',
  'help.guide.place-navigation.step.2':
    'De lijst is de kaarten-apps die bij deze plek passen: Google Maps, Waze, Apple Maps, OpenStreetMap en CoMaps.',
  'help.guide.place-navigation.step.3':
    'Klik op degene die je gebruikt. TREK geeft hem waar het kan de plek zelf mee, niet alleen een paar coördinaten, zo kom je bij de juiste ingang uit.',
  'help.guide.place-navigation.step.4':
    'Website openen ernaast opent de eigen pagina van de plek, zijn tijden en zijn tickets, in een nieuw tabblad.',
  'help.guide.place-navigation.result':
    'De kaarten-app gaat open op de plek, de website in een eigen tabblad, en in de reis verandert er niets.',
  'help.guide.place-navigation.tip.1':
    'Waze begint meteen met navigeren. De andere openen de plek, en van daaruit starten is nog één tik.',
  'help.guide.place-navigation.tip.2':
    'Welke apps worden aangeboden hangt af van de plek en van je apparaat: Apple Maps valt weg op Android, 高德地图 komt alleen op bij een plek in China, en Waze, Apple Maps en CoMaps hebben de coördinaten van de plek nodig.',
  'help.guide.place-navigation.tip.3':
    'Als er maar één app past, draagt de knop de naam van die app en opent hij hem meteen.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Een plek in een van je lijsten opslaan',
  'help.guide.place-to-collection.goal': 'Bewaar een plek die je op deze reis vond voor de volgende.',
  'help.guide.place-to-collection.step.1': 'Open de plek en klik onderaan de details op In collectie opslaan.',
  'help.guide.place-to-collection.step.2':
    'In lijst opslaan toont elke lijst die van jou is of die je deelt. Een vinkje markeert de lijsten die deze plek al hebben.',
  'help.guide.place-to-collection.step.3': 'Klik op de lijst. De plek zit er meteen in.',
  'help.guide.place-to-collection.step.4': 'Sluit, en de knop in de details leest Opgeslagen.',
  'help.guide.place-to-collection.result':
    'De plek zit in je lijst met zijn afbeelding, zijn notities en zijn adres, klaar voor de volgende reis.',
  'help.guide.place-to-collection.tip.1':
    'De knop is er alleen zolang de add-on Collecties aan staat, die de beheerder onder Add-ons inschakelt.',
  'help.guide.place-to-collection.tip.2':
    'Een plek kan tegelijk in meerdere lijsten zitten, met een eigen status in elke: een Idee in de ene, Bezocht in de andere.',
  'help.guide.place-to-collection.tip.3':
    'Markeer als bezocht, naast de naam van de plek in de kiezer, vinkt hem af in de lijst; staat de plek in meerdere van je lijsten, dan leest de pil Overal bezocht en doet ze allemaal tegelijk.',
  // place-track
  'help.guide.place-track.title': 'Een track lezen en hem zijn eigen kleur geven',
  'help.guide.place-track.goal':
    'Zie hoe lang een geïmporteerde wandeling is, en onderscheid zijn lijn van de andere op de kaart.',
  'help.guide.place-track.step.1':
    'De rij van een track in de plekkenkolom draagt een kort streepje in de kleur waarin zijn lijn is getekend. Klik erop.',
  'help.guide.place-track.step.2': 'Routegegevens geeft de lengte van het pad, in de Afstandseenheid die je instelde.',
  'help.guide.place-track.step.3':
    'Routekleur erboven toont de kleur die in gebruik is. Klik op de rij om de staaltjes te openen.',
  'help.guide.place-track.step.4': 'Kies een kleur. De lijn op de kaart en het streepje op de rij veranderen mee.',
  'help.guide.place-track.step.5':
    'De gestippelde cel links, Automatische kleur, geeft de track de kleur terug die hij erft; de pipet rechts opent de kleurkiezer van je systeem voor al het andere.',
  'help.guide.place-track.result':
    'De track wordt getekend in de kleur die je koos, in de details, op zijn rij in de plekkenkolom en op de kaart.',
  'help.guide.place-track.tip.1':
    'Alleen een plek die een pad draagt, geïmporteerd uit een GPX-, KML- of KMZ-bestand, heeft deze twee blokken.',
  'help.guide.place-track.tip.2':
    'Een track die met hoogtes is opgenomen toont ook zijn hoogste en laagste punt, de meters omhoog en omlaag, en het profiel van de wandeling.',
  'help.guide.place-track.tip.3':
    'Een import geeft elke track die hij binnenhaalt een eigen kleur, zo komen twee wandelingen nooit in dezelfde binnen.',
  // read-place
  'help.guide.read-place.step.7':
    'De rij onderaan is wat je hiervandaan kunt doen: de plek van de open dag halen of erop zetten, hem in een lijst opslaan, hem in een kaarten-app openen, hem bewerken of verwijderen.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Bestanden',
  'help.ctx.trip-files.summary':
    'Elk document van de reis in één lijst: tickets, bevestigingen, passen en foto’s, elk met een notitie, een koppeling naar de plek of de boeking waar het bij hoort, en een prullenbak waar het weer uit kan komen.',
  'help.ctx.trip-files.bullet.1':
    'Sleep bestanden hierheen bovenaan neemt de bestanden aan; een klik op het vak opent de bestandskiezer. De regel eronder noemt de bestandstypen die deze TREK aanneemt en de grens van 50 MB per bestand.',
  'help.ctx.trip-files.bullet.2':
    "De tabbladen zeggen wat de lijst toont: Alle, PDF's, Afbeeldingen en Documenten, elk met zijn aantal. Een stertabblad komt erbij zodra een bestand een ster heeft, Collab-notities zodra een notitie een bijlage draagt.",
  'help.ctx.trip-files.bullet.3':
    'Een rij draagt wie hem heeft geüpload, de naam, de notitie eronder, de grootte en de datum, en één label per koppeling: Dagplan en de plek, Boeking of Transport en de boeking, Uit Collab-notities.',
  'help.ctx.trip-files.bullet.4':
    'Aan het eind van een rij zitten Ster, Toewijzen, Openen, Downloaden en Verwijderen. Verwijderen vraagt niets: het bestand gaat naar de prullenbak, waar het weer uit kan worden gehaald.',
  'help.ctx.trip-files.bullet.5':
    'Een afbeelding of een video opent schermvullend, met de pijltjestoetsen en een strook miniaturen; elk ander document opent in een voorbeeld over de pagina heen, met Openen in nieuw tabblad en Downloaden. Een wallet-pas wordt meteen gedownload.',
  'help.ctx.trip-files.bullet.6':
    'Prullenbak uiterst rechts zet de lijst over naar de verwijderde bestanden, waar elk wordt hersteld of voorgoed verwijderd en Prullenbak legen ze allemaal weghaalt. Waar een beheerder een documentopslag heeft gekoppeld, staat Documentsynchronisatie ernaast.',
  // files-upload
  'help.guide.files-upload.title': 'Een document in de reis zetten',
  'help.guide.files-upload.goal':
    'Haal een ticket, een bevestiging of een foto uit je downloadmap in de reis, waar iedereen die erbij hoort erbij kan.',
  'help.guide.files-upload.step.1':
    'Open de reis en klik op Bestanden in de tabbladenbalk. Daar staan de documenten van de reis, met het uploadvak erboven.',
  'help.guide.files-upload.step.2':
    'Klik op Sleep bestanden hierheen en kies één of meer bestanden. Ze worden na elkaar geüpload en in het vak staat Uploaden... zolang het loopt. De regel onder het vak zegt welke typen deze TREK aanneemt, en dat een bestand hoogstens 50 MB mag zijn.',
  'help.guide.files-upload.step.3':
    'Zodra het laatste bestand binnen is, gaat Bestand toewijzen er vanzelf voor open. Notitie toevoegen... geeft het bestand een eigen regel, en de lijsten eronder binden het aan een plek of een boeking. Sluit het met de ×; door te sluiten gaat er niets verloren.',
  'help.guide.files-upload.step.4':
    'De nieuwe bestanden staan bovenaan de lijst. Een rij toont wie hem heeft geüpload, de naam, de grootte en de datum; een afbeelding krijgt een miniatuur, elk ander bestand zijn type.',
  'help.guide.files-upload.result':
    'De documenten staan in de reis, en iedereen die de reis kan zien kan ze openen en downloaden.',
  'help.guide.files-upload.tip.1':
    'Een bestand kan ook van het bureaublad rechtstreeks op het vak worden gesleept, dat oplicht zolang het bestand erboven hangt.',
  'help.guide.files-upload.tip.2':
    'Een afbeelding op het klembord komt met Ctrl+V in de lijst, zodat een schermafbeelding van een boeking nooit eerst hoeft te worden opgeslagen.',
  'help.guide.files-upload.tip.3':
    'Uploaden vraagt het recht Bestanden uploaden; zonder dat recht is het vak er helemaal niet. Een type dat niet op de lijst staat wordt met een melding geweigerd en er wordt niets geüpload. Een bestand boven 50 MB laat het vak zelf vallen, nog voordat er iets wordt verstuurd.',
  // files-link
  'help.guide.files-link.title': 'Een document aan een plek of een boeking binden',
  'help.guide.files-link.goal':
    'Maak het ticket vindbaar vanaf de dag waar het bij hoort, niet alleen vanuit deze lijst.',
  'help.guide.files-link.step.1':
    'Klik op Toewijzen, het potlood aan het eind van de rij. Bestand toewijzen gaat open, met de naam van het bestand.',
  'help.guide.files-link.step.2':
    'Onder Notitie neemt Notitie toevoegen... één regel aan, die daarna in de lijst onder de naam van het bestand staat. Hij wordt opgeslagen op het moment dat je het veld verlaat.',
  'help.guide.files-link.step.3':
    'Onder Plaats staan de plekken van de reis, gegroepeerd per dag waarop ze staan, met Niet toegewezen aan het eind voor de plekken zonder dag. Klik er een aan en die krijgt een vinkje.',
  'help.guide.files-link.step.4':
    'Onder Boeking en Transport staan de boekingen van de reis. Klik die aan waar het document bij hoort; die krijgt ook zijn vinkje.',
  'help.guide.files-link.step.5':
    'Sluit met de ×. Een opslaanknop is er hier niet: elke klik is geschreven op het moment dat je hem maakte.',
  'help.guide.files-link.result':
    'De rij draagt de notitie en één label per koppeling, Dagplan en de naam van de plek, Transport en de naam van de vlucht, en het document hangt ook aan de plek en aan de vlucht.',
  'help.guide.files-link.tip.1':
    'Een bestand kan meerdere koppelingen tegelijk dragen, zodat dezelfde bevestiging bij het hotel hoort en bij de nacht die hij dekt.',
  'help.guide.files-link.tip.2':
    'Nog een keer op een aangevinkte regel klikken haalt die koppeling weg; het bestand zelf blijft.',
  'help.guide.files-link.tip.3':
    'Het werkt ook andersom: een document dat aan een plek of aan een boeking hangt, staat ook in deze lijst, met hetzelfde label op zijn rij.',
  // files-star
  'help.guide.files-star.title': 'De belangrijke documenten bovenaan houden',
  'help.guide.files-star.goal':
    'Haal de twee of drie papieren die je echt nodig hebt uit een lijst die de hele reis lang groeit.',
  'help.guide.files-star.step.1':
    'Klik op Ster aan het eind van een rij. De ster kleurt geel, een tweede ster verschijnt voor de naam van het bestand, en de knop heet nu Ster verwijderen.',
  'help.guide.files-star.step.2':
    'De lijst sorteert zichzelf opnieuw: bestanden met een ster staan boven alle andere, binnen elke groep de nieuwste eerst.',
  'help.guide.files-star.step.3':
    'Bovenaan is een ster bij de tabbladen gekomen, met het aantal bestanden met een ster erachter. Klik erop om alleen die te zien.',
  'help.guide.files-star.result':
    'De papieren die je aan de balie nodig hebt staan bovenaan de lijst, en één tabblad toont niets anders.',
  'help.guide.files-star.tip.1':
    'Het stertabblad bestaat alleen zolang er iets een ster heeft. Haal de ster bij het laatste bestand weg en het tabblad verdwijnt ermee.',
  'help.guide.files-star.tip.2':
    'Een ster zetten telt als bewerken: een lid dat de bestanden van de reis alleen mag lezen ziet de sterren wel, maar kan ze niet zetten.',
  // files-filter
  'help.guide.files-filter.title': 'Een document in de lijst vinden',
  'help.guide.files-filter.goal': 'Breng een lijst met alles terug tot het ene soort papier dat je zoekt.',
  'help.guide.files-filter.step.1':
    "De tabbladen boven de lijst zijn Alle, PDF's, Afbeeldingen en Documenten, elk met het aantal bestanden erachter.",
  'help.guide.files-filter.step.2': "Klik op PDF's: de lijst houdt de PDF-bestanden over en niets anders.",
  'help.guide.files-filter.step.3':
    'Nog twee tabbladen komen en gaan met wat er in de reis zit. Klik op Collab-notities, dat er is zodra een notitie in het tabblad Samenwerking een bijlage draagt: de lijst houdt die bestanden en niets anders. Een ster voegt zich op dezelfde manier bij de rij, zodra een bestand een ster heeft.',
  'help.guide.files-filter.step.4': 'Alle haalt de hele lijst terug.',
  'help.guide.files-filter.result':
    'De lijst toont alleen wat het tabblad noemt, en het aantal op elk tabblad zegt hoeveel dat er zijn.',
  'help.guide.files-filter.tip.1':
    'Mappen zijn er hier niet en hernoemen ook niet: de notitie in Bestand toewijzen, de koppelingen naar plekken en boekingen, en de ster zijn waar een document op wordt gesorteerd.',
  'help.guide.files-filter.tip.2':
    'De lijst zelf staat altijd eerst met ster, daarna nieuwste eerst, zodat een document dat vandaag is geüpload boven een document van vorige maand staat.',
  // files-preview
  'help.guide.files-preview.title': 'Een document lezen zonder TREK te verlaten',
  'help.guide.files-preview.goal':
    'Bekijk een ticket of een afbeelding ter plekke, en haal het naar je eigen machine wanneer je het daar nodig hebt.',
  'help.guide.files-preview.step.1':
    'Klik op de naam van een afbeelding of op de miniatuur. Hij opent schermvullend, met de naam van het bestand en zijn plaats in de afbeeldingen in de kop.',
  'help.guide.files-preview.step.2':
    'De ronde pijlen aan de zijkanten, de pijltjestoetsen links en rechts en de strook miniaturen onderaan lopen door elke afbeelding die de lijst op dat moment toont.',
  'help.guide.files-preview.step.3':
    'Openen in nieuw tabblad en Downloaden zitten in de kop; de × of Escape sluit de afbeelding weer.',
  'help.guide.files-preview.step.4':
    'Een document dat geen afbeelding is opent in plaats daarvan in een voorbeeld over de pagina heen, met dezelfde twee knoppen in zijn kop. Dat sluit met de × of met een klik ernaast.',
  'help.guide.files-preview.step.5':
    'Downloaden aan het eind van een rij zet het bestand rechtstreeks op je machine, zonder eerst iets te openen.',
  'help.guide.files-preview.result':
    'Het document staat op het scherm, en dezelfde twee knoppen zetten het in een tabblad van de browser of op je schijf.',
  'help.guide.files-preview.tip.1':
    'Op een aanraakscherm veeg je door de afbeeldingen in plaats van op de pijlen te klikken.',
  'help.guide.files-preview.tip.2':
    'Een wallet-pas opent nooit een voorbeeld: hij wordt meteen gedownload, zodat de telefoon hem aan zijn wallet-app kan geven.',
  'help.guide.files-preview.tip.3':
    'Openen in nieuw tabblad en Downloaden halen het bestand allebei op met jouw sessie, zodat een link die uit de adresbalk is gekopieerd voor niemand anders iets doet.',
  // files-trash
  'help.guide.files-trash.title': 'Een document weggooien, en terughalen',
  'help.guide.files-trash.goal':
    'Ruim op wat de reis niet meer nodig heeft, zonder iets te verliezen dat je toch nodig had.',
  'help.guide.files-trash.step.1':
    'Klik op Verwijderen aan het eind van een rij. Het bestand verlaat de lijst meteen en de melding zegt Naar prullenbak verplaatst. Niets vraagt eerst.',
  'help.guide.files-trash.step.2':
    'Prullenbak uiterst rechts in de werkbalk zet de lijst over naar wat is weggegooid. De kop zegt Prullenbak en de filtertabbladen zijn weg.',
  'help.guide.files-trash.step.3':
    'Een weggegooide rij is grijs en heeft nog twee knoppen: Herstellen, dat het bestand terughaalt, en Verwijderen, dat het na een vraag voorgoed weghaalt.',
  'help.guide.files-trash.step.4':
    'Klik op Herstellen. De melding zegt Bestand hersteld en de rij verlaat de prullenbak, met zijn notitie en zijn koppelingen er nog op.',
  'help.guide.files-trash.step.5':
    'Prullenbak legen bovenaan haalt alles wat hier nog ligt voorgoed weg, en de browser vraagt het één keer voordat hij het doet. Prullenbak schakelt terug naar de bestanden.',
  'help.guide.files-trash.result': 'Het bestand staat weer in de lijst waar het stond, alsof er niets was gebeurd.',
  'help.guide.files-trash.tip.1':
    'Verwijderen op een rij vraagt niets vooraf, en daar is de prullenbak voor: niets verlaat TREK tot jij het hier zegt.',
  'help.guide.files-trash.tip.2':
    'Een bestand weggooien en terughalen vraagt het recht Bestanden verwijderen. Een lid zonder dat recht ziet Verwijderen op de rij niet en de knoppen in de prullenbak ook niet.',
  'help.guide.files-trash.tip.3':
    'Een bestand dat in de prullenbak voorgoed is verwijderd, kan niet worden teruggehaald.',
  // files-sync
  'help.guide.files-sync.title': 'De documenten in de pas houden met je documentopslag',
  'help.guide.files-sync.goal':
    'Koppel de reis aan je eigen documentopslag, zodat wat hier wordt geüpload daar belandt en wat daar wordt opgeborgen hier opduikt.',
  'help.guide.files-sync.step.1':
    'Klik op Documentsynchronisatie, naast Prullenbak aan de rechterkant van de werkbalk. Het venster gaat open met de naam van de reis onder zijn titel. Links, onder Aanbieder koppelen, staan de opslagen die een beheerder heeft aangezet, elk met een regel over hoe hij ordent: Paperless-ngx en Papra op tag, Nextcloud en Synology Drive in een map, OpenCloud in een ruimte. Rechts leest het Nog niets verbonden.',
  'help.guide.files-sync.step.2':
    'Klik op je opslag, hier Nextcloud. Een kleiner venster gaat open voor de verbinding, genoemd naar de opslag, en vraagt om de gegevens waarmee je bij die opslag inlogt.',
  'help.guide.files-sync.step.3':
    'Vul Adres in en de eigen aanmelding van de opslag: een API-token voor Paperless-ngx, een API-sleutel en de Organisatie-ID voor Papra, Gebruikersnaam en een App-wachtwoord voor Nextcloud, Gebruikersnaam en een App-token voor OpenCloud, en voor Synology Drive Gebruikersnaam, Wachtwoord en, als het account erom vraagt, een Tweestapscode. Gebruik een app-wachtwoord of token overal waar de opslag er een aanbiedt, nooit je accountwachtwoord. Nextcloud en Synology Drive nemen ook een optionele Basismap, waar TREK naar reismappen zoekt, hier /Reisen. Zelfondertekend certificaat toestaan onderaan is alleen voor een opslag op je eigen netwerk met zo’n certificaat.',
  'help.guide.files-sync.step.4':
    'Klik op Verbinding testen. TREK bereikt de opslag met wat je typte en de voettekst leest Bereikt, aangemeld als gevolgd door de naam van het account. Inloggegevens die worden geweigerd of een adres dat niet bereikbaar is staan daar in plaats daarvan, en in beide gevallen wordt er niets opgeslagen.',
  'help.guide.files-sync.step.5':
    'Klik op Verbinden. De verbinding wordt bij de reis opgeslagen en TREK vraagt waar de reis in de opslag moet komen te staan: de tag, map of ruimte die haar documenten bevat. Alleen wat daarin staat wordt gesynchroniseerd. Een nieuwe maken maakt hem aan bij Aanmaken, met een naam die uit de titel van de reis is voorgevuld; onder Of gebruik er een die je al hebt staan de bestaande. Klik op een ervan, hier de map Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Het venster is terug: je opslag staat links onder Deze reis, en zijn kaart rechts draagt waarheen hij synchroniseert, wanneer hij voor het laatst liep en Nu synchroniseren. Een eerste uitvoering start vanzelf; Nu synchroniseren draait er een wanneer je maar wilt. Zodra een uitvoering klaar is, maakt de badge Nog niet gesynchroniseerd naast de naam plaats voor een groene stip, Synchroon als je erop wijst, en de stroombalk telt de documenten die TREK en de opslag elk hebben, met de banen Naar de opslag en Uit de opslag ertussen. Sluit het venster met de ×.',
  'help.guide.files-sync.result':
    'De documenten die er al stonden staan bovenaan de lijst, geüpload op jouw naam, en elk document van de reis staat ook in de opslag. Vanaf nu controleert TREK de opslag op de achtergrond en volgt de opslag de lijst.',
  'help.guide.files-sync.tip.1':
    'Alleen de eigenaar van de reis of een beheerder van de instantie kan een reis koppelen, omdat de inloggegevens dat hele account bij de opslag bereiken. Elk lid kan Documentsynchronisatie openen, de kaart lezen en op Nu synchroniseren drukken.',
  'help.guide.files-sync.tip.2':
    'Een opslag op je eigen netwerk heeft ALLOW_INTERNAL_NETWORK=true op de TREK-server nodig, en zijn adres moet het adres van de machine op het netwerk zijn, nooit localhost. Zonder dat antwoordt Verbinding testen Dat adres is niet toegestaan.',
  'help.guide.files-sync.tip.3':
    'Verbinding verbreken op de kaart beëindigt de koppeling en houdt elk document aan beide kanten. Een tag, map of ruimte die een tweede keer wordt gekoppeld geldt als nieuw, en alles erin komt opnieuw binnen, koppel na een Verbinding verbreken dus liever een lege dan de oude.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Dagdetails',
  'help.ctx.trip-day-detail.summary':
    'Het paneel dat de kop van een dag over de kaart opent: de dag als geheel, zijn naam en zijn datum, het weer waar je zult zijn, de boekingen die op hem vallen en de nachten die voor hem geboekt zijn.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klik in de dagenkolom op de kop van een dag en het paneel gaat open over het midden van de kaart. Dezelfde kop nog eens, of het kruisje rechts ervan, sluit het en laat de dag weer los.',
  'help.ctx.trip-day-detail.bullet.2':
    'De kop draagt de naam van de dag en zijn datum. Het potlood naast de naam hernoemt de dag, de dubbele chevron vouwt het paneel tot een smalle balk zodat de kaart weer vrij is.',
  'help.ctx.trip-day-detail.bullet.3':
    'Bovenaan het weer van de dag. Voorspelling voor noemt de plek waar het voor geldt: de eerste stop van de dag, of het hotel waar je wakker wordt.',
  'help.ctx.trip-day-detail.bullet.4':
    'Reserveringen zet de boekingen van die dag op een rij, elk met zijn soort, de stop waar hij bij hoort en zijn tijden. Groen betekent bevestigd, amberkleurig nog in behandeling; het is alleen een uitlezing, boekingen wijzig je onder Boekingen.',
  'help.ctx.trip-day-detail.bullet.5':
    'Accommodatie toont elke nacht die over deze dag geboekt is, met Inchecken en Uitchecken op de dagen waarop ze gebeuren, het incheckvenster, de uitchecktijd en het bevestigingsnummer.',
  'help.ctx.trip-day-detail.bullet.6':
    'Accommodatie toevoegen boekt een nacht op deze dag: kies het pand uit de plekken van de reis, zeg welke dagen hij beslaat, en vul de tijden en de code aan.',
  // day-panel
  'help.guide.day-panel.title': 'Een dag openen en zijn details lezen',
  'help.guide.day-panel.goal':
    'Eén dag in zijn geheel zien, zijn weer, zijn boekingen en waar je slaapt, zonder de kaart te verlaten.',
  'help.guide.day-panel.step.1':
    'Klik in de dagenkolom op de kop van een dag. De dag wordt geselecteerd en zijn details gaan open over het midden van de kaart.',
  'help.guide.day-panel.step.2': 'De kop noemt de dag, Dag 1 zolang je hem geen naam geeft, met zijn datum eronder.',
  'help.guide.day-panel.step.3':
    'Bovenaan het weer van de dag. Voorspelling voor zegt om welke plek het gaat: de eerste stop van de dag, of het hotel waar je wakker wordt.',
  'help.guide.day-panel.step.4':
    'Reserveringen daaronder zet de boekingen die op deze dag vallen op een rij, met hun tijden.',
  'help.guide.day-panel.step.5':
    'Accommodatie toont de nachten die over deze dag geboekt zijn, met Inchecken en Uitchecken op de dagen waarop ze gebeuren.',
  'help.guide.day-panel.step.6':
    'De dubbele chevron in de kop vouwt het paneel tot een smalle balk. Het kruisje ernaast sluit het paneel en laat de dag weer los.',
  'help.guide.day-panel.result':
    'Tot zijn balk gevouwen laat het paneel de kaart vrij en houdt het de dag geselecteerd; gesloten is de dag niet meer geselecteerd en is het plan als voorheen.',
  'help.guide.day-panel.tip.1':
    'Klikken op een willekeurige plek van de kopbalk van het paneel vouwt het ook op. De chevron is er alleen de knop voor.',
  'help.guide.day-panel.tip.2':
    'Een plek openen uit de plekkenkolom zet de plaatsdetails op de plaats van het paneel. Sluit ze en de dag is terug.',
  // day-weather
  'help.guide.day-weather.title': 'Het weer van de dag lezen',
  'help.guide.day-weather.goal': 'Weten hoe de dag wordt daar waar je die dag echt bent.',
  'help.guide.day-weather.step.1':
    'Voorspelling voor noemt de plek waar de cijfers voor gelden: de eerste stop van de dag of, op een dag zonder stop, het hotel waar je wakker wordt.',
  'help.guide.day-weather.step.2':
    'Het grote getal is de temperatuur van de dag, ernaast de laagste en de hoogste, en de toestand in woorden.',
  'help.guide.day-weather.step.3':
    'De chips eronder: de regenkans, hoeveel er valt, de sterkste wind, en zonsopgang en zonsondergang.',
  'help.guide.day-weather.step.4':
    'Onderaan de dag uur voor uur, om het andere uur: de tijd, het icoon, de temperatuur en de regenkans. Een uur boven de 50 procent krijgt een blauwe achtergrond.',
  'help.guide.day-weather.result':
    'De dagkaart in de dagenkolom draagt hetzelfde weer klein onder haar nummer, zodat de hele reis in één oogopslag te lezen is.',
  'help.guide.day-weather.tip.1':
    'Graden en wind volgen Temperatuureenheid onder Weergave in Instellingen: kies °F Fahrenheit en dezelfde voorspelling wordt in °F en mph gegeven.',
  'help.guide.day-weather.tip.2':
    'Een dag zonder gelokaliseerde stop en zonder hotel om in wakker te worden toont helemaal geen weer: de voorspelling geldt altijd voor een plek, nooit voor de reis.',
  'help.guide.day-weather.tip.3':
    'Verder dan 16 dagen vooruit valt er geen voorspelling te halen. De cijfers zijn dan de gemiddelden van eerdere jaren voor die datum, gemarkeerd met Ø en daaronder ook als zodanig vermeld.',
  // rename-day
  'help.guide.rename-day.title': 'De dag een naam geven',
  'help.guide.rename-day.goal': 'Een dag noemen wat hij is, Aankomst in Kyoto of Rustdag, in plaats van Dag 5.',
  'help.guide.rename-day.step.1': 'Open de dag. In zijn kop staat Dag 5, met de datum eronder.',
  'help.guide.rename-day.step.2': 'Klik op het potlood naast de naam.',
  'help.guide.rename-day.step.3': 'De naam wordt een veld. Typ de naam die je wilt.',
  'help.guide.rename-day.step.4':
    'Druk op Enter, of klik gewoon ergens anders; Escape gooit de wijziging weg. De dagkaart in de dagenkolom draagt de naam ook.',
  'help.guide.rename-day.result':
    'De naam vervangt Dag 5 in het paneel en op de dagkaart in de dagenkolom; de datum blijft waar hij was.',
  'help.guide.rename-day.tip.1':
    'Maak het veld leeg en sla op, en de dag heet weer Dag 5: het nummer is wat er staat als er geen naam is.',
  'help.guide.rename-day.tip.2':
    'De naam hoort bij de dag, niet bij zijn datum. Zet de dagen in een andere volgorde en hij reist mee met al het andere van die dag.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Een nacht op een dag boeken',
  'help.guide.add-accommodation.goal':
    'Het hotel één keer in het plan zetten, met de dagen die het beslaat, zijn tijden en zijn bevestigingsnummer.',
  'help.guide.add-accommodation.step.1':
    'Het pand moet eerst een plek van de reis zijn. Maak het in de plekkenkolom aan zoals elke andere plek: de kiezer biedt alleen aan wat er al is.',
  'help.guide.add-accommodation.step.2':
    'Open de dag van je aankomst en klik onder Accommodatie op Accommodatie toevoegen.',
  'help.guide.add-accommodation.step.3':
    'Toepassen op dagen zegt welke nachten het verblijf beslaat: de incheckdag links, de uitcheckdag rechts. Alle neemt de hele reis.',
  'help.guide.add-accommodation.step.4':
    'Vul Inchecken, Tot en Uitchecken in, en zet het nummer van de boeking onder Bevestiging. Alle vier mogen leeg blijven.',
  'help.guide.add-accommodation.step.5':
    'Kies het pand uit de plekken van de reis. De chips boven de lijst beperken haar tot één categorie.',
  'help.guide.add-accommodation.step.6': 'Klik op Opslaan.',
  'help.guide.add-accommodation.result':
    'Het verblijf staat op elke dag die het beslaat, Inchecken op de eerste en Uitchecken op de laatste. Het pand wordt een stop op de incheckdag, zodat de kaart de weg ernaartoe tekent, en onder Boekingen verschijnt een boeking van het type Accommodatie.',
  'help.guide.add-accommodation.tip.1':
    'De kiezer opent op de dag waar je vandaan kwam, met uitchecken de dag erna; beide kun je nog verzetten voor je opslaat.',
  'help.guide.add-accommodation.tip.2':
    'Geef het hotel bij het aanmaken de categorie Hotel van de reis en de chips boven de lijst beperken haar met één klik tot je hotels.',
  'help.guide.add-accommodation.tip.3':
    'De tijden zijn allemaal optioneel: een verblijf zonder inchecktijd en zonder code beslaat zijn nachten toch en tekent toch zijn route.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Een geboekte nacht wijzigen of annuleren',
  'help.guide.edit-accommodation.goal':
    'Een verblijf verplaatsen, zijn tijden verbeteren, of het weer uit het plan halen.',
  'help.guide.edit-accommodation.step.1':
    'Op elke dag van het verblijf toont de kaart van het verblijf het pand, het incheckvenster, de uitchecktijd en het bevestigingsnummer.',
  'help.guide.edit-accommodation.step.2':
    'Het potlood aan de rechterkant ervan opent het verblijf opnieuw. Het venster heet nu Accommodatie bewerken.',
  'help.guide.edit-accommodation.step.3':
    'Verbeter de rij velden: Inchecken, Tot, Uitchecken en Bevestiging. De dagen erboven en het pand eronder zijn hier ook te wijzigen.',
  'help.guide.edit-accommodation.step.4': 'Klik op Opslaan.',
  'help.guide.edit-accommodation.step.5':
    'Het kruisje naast het potlood beëindigt het verblijf. Het vraagt niets, en de boeking van het type Accommodatie die erbij hoort gaat mee.',
  'help.guide.edit-accommodation.result':
    'De wijziging bereikt in één keer elke dag die het verblijf beslaat, en de boeking van het type Accommodatie onder Boekingen erbij.',
  'help.guide.edit-accommodation.tip.1':
    'Een nacht midden in een verblijf draagt geen label Inchecken en geen label Uitchecken: alleen de eerste en de laatste dag van het bereik doen dat.',
  'help.guide.edit-accommodation.tip.2':
    'Een verblijf annuleren neemt ook de stop mee die het op de incheckdag zette en alle kosten die aan zijn boeking hangen. Boek de nacht opnieuw als het een vergissing was.',
  // day-bookings
  'help.guide.day-bookings.title': 'De boekingen van de dag in één oogopslag',
  'help.guide.day-bookings.goal': 'Op één plek zien wat er al voor deze dag geboekt is en of het bevestigd is.',
  'help.guide.day-bookings.step.1':
    'Reserveringen zet de boekingen van de dag op een rij: die op hem gedateerd zijn, en die aan een van zijn stops hangen.',
  'help.guide.day-bookings.step.2':
    'Een rij toont wat voor soort boeking het is, zijn naam en, als hij bij een stop hoort, die stop na een punt. Zijn tijden staan helemaal rechts.',
  'help.guide.day-bookings.step.3':
    'De kleur zegt hoe een boeking ervoor staat: een groene rij is bevestigd, een amberkleurige is nog in behandeling. Accommodaties staan niet in deze lijst, die hebben hun eigen blok eronder.',
  'help.guide.day-bookings.step.4':
    'De lijst leest de boekingen alleen uit. Een boeking maak en wijzig je onder Boekingen.',
  'help.guide.day-bookings.result':
    'Alles wat op de dag gedateerd is, en alles wat aan een van zijn stops hangt, staat in deze ene lijst.',
  'help.guide.day-bookings.tip.1':
    'Een boeking belandt op een dag door zijn eigen datum. Wijzig de datum onder Boekingen en hij verhuist vanzelf naar de andere dag.',
  'help.guide.day-bookings.tip.2':
    'Geen blok Reserveringen betekent dat de dag geen boekingen heeft: het wordt verborgen in plaats van leeg getoond.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Kaart',
  'help.ctx.trip-map.summary':
    'Het midden van het plan: elke plek van de reis als speld, de routes die ze verbinden, en de schakelaars langs de randen van de kaart voor satelliet, voor de hele reis in één keer en voor de plekken rond de buurt waar je naar kijkt.',
  'help.ctx.trip-map.bullet.1':
    'Een speld is een plek: de eigen foto als die er is, anders de kleur van zijn categorie met het categorie-icoon. Houd de aanwijzer erop voor een kaartje met zijn naam en zijn adres, plus zijn categorie en zijn beoordeling waar de plek die draagt. Sleep een speld op een dagkaart om de plek daar in te plannen.',
  'help.ctx.trip-map.bullet.2':
    'Spelden die te dicht bij elkaar zitten om uit elkaar te houden, vouwen samen tot één donkere bel met een aantal. Klik op de bel en de kaart zoomt in op wat erin zit.',
  'help.ctx.trip-map.bullet.3':
    'Klik op een speld om de plek onder de kaart te openen, met zijn beoordeling, zijn bestanden en wat er verder mee kan; klik op een leeg stuk van de kaart om hem weer los te laten.',
  'help.ctx.trip-map.bullet.4':
    'Met een dag open in de dagenkolom dragen zijn stops een kleine witte badge met hun nummer in die dag, en een plek die op twee dagen is gepland draagt beide nummers, verbonden door ·.',
  'help.ctx.trip-map.bullet.5':
    'De rij iconen bovenaan doorzoekt het stuk kaart dat je ziet: Restaurants, Cafés, Bars & uitgaan, Accommodatie, Bezienswaardigheden, Musea & cultuur, Natuur & parken en Activiteiten. Dit gebied doorzoeken draait de zoekopdracht opnieuw nadat je de kaart hebt verschoven.',
  'help.ctx.trip-map.bullet.6':
    'Met een rechterklik ergens op de kaart gaat het plekformulier open op dat punt, met het adres al opgezocht. De ronde knop linksonder ruilt de getekende kaart in voor luchtbeelden.',
  'help.ctx.trip-map.bullet.7':
    'Hele reis tonen rechtsonder tekent elke reisdag in één keer en zet op een rij wat elke dag beslaat; het route-icoon op de rij van een boeking tekent die boeking, en dat in de werkbalk boven de dagen tekent ze allemaal.',
  // map-markers
  'help.guide.map-markers.title': 'De kaart lezen',
  'help.guide.map-markers.goal': 'Weten wat elke speld, badge en bel op de kaart je vertelt.',
  'help.guide.map-markers.step.1':
    'De kaart draagt elke plek van de reis. Waar spelden te dicht bij elkaar zitten om uit elkaar te houden, vouwen ze samen tot één donkere bel met het aantal dat erin zit; klik op de bel en de kaart zoomt in op wat erin zat, of waaiert op het diepste zoomniveau de spelden uit.',
  'help.guide.map-markers.step.2':
    'Een speld is de eigen foto van de plek als die er is, anders de kleur van zijn categorie met het categorie-icoon. Houd de aanwijzer erop en een kaartje geeft zijn naam en zijn adres, met zijn categorie en zijn beoordeling waar de plek die draagt.',
  'help.guide.map-markers.step.3':
    'Klik op een speld en de plek gaat open in een kaartje onder de kaart: zijn coördinaten, zijn beoordeling, zijn bestanden, en onderaan wat je er daarna mee kunt doen, waaronder Navigatie, Bewerken en Verwijderen, met Toevoegen aan dag zolang er een dag open is. Klik op een leeg stuk van de kaart om hem weer los te laten.',
  'help.guide.map-markers.step.4':
    'Open een dag in de dagenkolom en zijn stops krijgen nummers: de kleine witte badge in de hoek van een speld is de plaats van die stop in de dag. Een plek die op twee dagen is gepland draagt beide nummers, verbonden door ·. Zonder open dag zijn er geen nummers, en draagt de hoek in plaats daarvan de beoordeling.',
  'help.guide.map-markers.step.5':
    'Sleep een speld van de kaart op een dagkaart in de dagenkolom en de plek is op die dag ingepland, precies zoals wanneer je zijn rij uit de plekkenlijst sleept.',
  'help.guide.map-markers.result':
    'Aan de reis is niets veranderd: de kaart is er een weergave van, en elke speld zegt welke plek, welke dag en in welke volgorde.',
  'help.guide.map-markers.tip.1':
    'Een dag die in de dagenkolom is dichtgeklapt neemt zijn stops van de kaart mee; klap de dag weer open en ze zijn terug.',
  'help.guide.map-markers.tip.2':
    'Het filter boven de plekkenlijst bepaalt ook wat de kaart tekent: kies Ongepland en alleen de plekken die nog geen dag hebben blijven erop staan.',
  'help.guide.map-markers.tip.3':
    'Deze kaart heeft geen zoomknoppen: het wiel zoomt, een dubbele klik zoomt een stap in, en de kaart zelf slepen verschuift hem.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Plekken in je omgeving op de kaart vinden',
  'help.guide.map-nearby-places.goal':
    'Laat de kaart zoeken naar restaurants, bezienswaardigheden of een hotel in de buurt waar je naar kijkt, en haal er een de reis in.',
  'help.guide.map-nearby-places.step.1':
    'De rij iconen bovenaan de kaart is het zoeken per categorie: Restaurants, Cafés, Bars & uitgaan, Accommodatie, Bezienswaardigheden, Musea & cultuur, Natuur & parken en Activiteiten.',
  'help.guide.map-nearby-places.step.2':
    'Klik op een categorie. TREK zoekt dat soort plek in het stuk kaart dat je ziet en zet voor elke treffer een speld in de kleur van de categorie. Eén categorie tegelijk: op een andere klikken wisselt hem, en op de actieve klikken zet hem uit.',
  'help.guide.map-nearby-places.step.3':
    'Verschuif de kaart en er verschijnt een tweede knop onder de rij: Dit gebied doorzoeken draait dezelfde zoekopdracht voor het nieuwe beeld. Verschuiven alleen zoekt nooit opnieuw, wat het aantal verzoeken laag houdt.',
  'help.guide.map-nearby-places.step.4':
    'De spelden dragen de naam van wat er gevonden is. Klik er een aan en het plekformulier gaat open, al ingevuld vanuit die treffer: Naam, Adres, Breedtegraad en Lengtegraad, en de website en het telefoonnummer waar OpenStreetMap ze heeft.',
  'help.guide.map-nearby-places.step.5':
    'Loop na wat er is ingevuld en vul aan wat de zoekopdracht niet kon weten: een Beschrijving, een Categorie, eigen notities.',
  'help.guide.map-nearby-places.step.6':
    'Klik op Toevoegen. Ligt er al een plek met dezelfde naam in de reis, dan zegt het formulier dat en wordt de knop Toch toevoegen.',
  'help.guide.map-nearby-places.result':
    'De plek staat in de plekkenlijst en op de kaart als een van de eigen spelden van de reis, onder Ongepland tot je hem op een dag zet. De zoekspelden blijven staan tot je de categorie uitzet.',
  'help.guide.map-nearby-places.tip.1':
    'De rij is weg als Plaatsen op de kaart ontdekken uit staat in Instellingen, onder Travel & map.',
  'help.guide.map-nearby-places.tip.2':
    'De antwoorden komen uit de TREK-plaatsenindex en van OpenStreetMap, dus dit is een van de weinige dingen in het plan die een verbinding nodig hebben.',
  'help.guide.map-nearby-places.tip.3':
    'Een zoekopdracht dekt wat er op het scherm staat, dus zoom in op de straat waar je naar vraagt: een hele stad antwoordt met de eerste zestig treffers en met weinig ordening daarin.',
  // map-add-place
  'help.guide.map-add-place.title': 'Een plek aanmaken met een rechterklik op de kaart',
  'help.guide.map-add-place.goal': 'Zet een plek precies waar je hem wilt, zonder er eerst naar te zoeken.',
  'help.guide.map-add-place.step.1':
    'Klik met rechts op het punt op de kaart dat je bedoelt. Het plekformulier gaat open, met de titel Plaats/activiteit toevoegen.',
  'help.guide.map-add-place.step.2':
    'Breedtegraad en Lengtegraad staan al op dat punt, en TREK zoekt de coördinaten op en vult Adres met wat het daar vindt, en Naam ook waar het opzoeken er een oplevert. Er is nog niets opgeslagen, dus overschrijf wat niet klopt.',
  'help.guide.map-add-place.step.3':
    'Geef hem een Naam die je herkent, en de rest van wat het plan moet weten: Beschrijving, Notities, Categorie, Website.',
  'help.guide.map-add-place.step.4':
    'Klik op Toevoegen. De plek belandt ongepland in de lijst, ook met een dag open: een rechterklik op de kaart zegt waar, niet wanneer.',
  'help.guide.map-add-place.result':
    'De plek staat in de lijst en op de kaart, onder Ongepland tot je hem op een dag zet.',
  'help.guide.map-add-place.tip.1':
    'Het adres komt uit een opzoeking van de coördinaten, dus het kan meer als een straat dan als een naam lezen, en boven open land kan het leeg terugkomen. Beide velden mag je overschrijven.',
  'help.guide.map-add-place.tip.2':
    'Op de kaarten van MapLibre GL en Mapbox GL doet een middelklik hetzelfde, en op een aanraakscherm een lange druk.',
  // map-satellite
  'help.guide.map-satellite.title': 'Overschakelen naar satelliet',
  'help.guide.map-satellite.goal': 'Ruil de getekende kaart in voor luchtbeelden, en terug.',
  'help.guide.map-satellite.step.1':
    'De ronde knop linksonder op de kaart is de schakelaar voor de onderlaag. Zijn icoon toont altijd de laag waar hij heen zou gaan, en erop zweven zegt welke: Overschakelen naar satellietweergave. Klik erop.',
  'help.guide.map-satellite.step.2':
    'De kaart is nu luchtbeeld, diep genoeg om een enkel gebouw te onderscheiden en zonder een eigen sleutel. Alles wat TREK tekent blijft erbovenop staan: de spelden, de route van de dag, de tracks en de boekingsroutes.',
  'help.guide.map-satellite.step.3':
    'De knop zegt nu Overschakelen naar kaartweergave. Klik erop om terug te gaan naar de getekende kaart.',
  'help.guide.map-satellite.result':
    'De kaart is weer getekend, en de laag waarop je hem hebt achtergelaten wordt op je account onthouden.',
  'help.guide.map-satellite.tip.1':
    'De keuze hangt aan je account en niet aan de reis, dus elke reis gaat open zoals je hem hebt achtergelaten, met welke kaartrenderer je ook werkt.',
  'help.guide.map-satellite.tip.2':
    'De beelden dragen geen tekst: straatnamen, wijken en huisnummers staan op de getekende kaart, dus schakel terug als je een adres zoekt.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'De hele reis en zijn afstanden zien',
  'help.guide.map-whole-trip.goal':
    'Ruil de ene open dag in voor elke reisdag van de reis, en lees hoe ver elke dag gaat.',
  'help.guide.map-whole-trip.step.1':
    'De ronde knop Hele reis tonen zit rechtsonder op de kaart. Klik erop en elke reisdag van de reis wordt in één keer getekend, elk in zijn eigen kleur over een witte omlijning, zodat dagen naast elkaar uit elkaar blijven.',
  'help.guide.map-whole-trip.step.2':
    'Het kaartje boven de knop somt die dagen op: een gekleurde stip, de naam van de dag, een icoon voor elke manier waarop je hem aflegt, en de afstand die hij beslaat. Totale afstand staat bovenaan.',
  'help.guide.map-whole-trip.step.3':
    'Klik op een dag in het kaartje om hem te kiezen, net als kiezen in de dagenkolom: de kaart brengt die dag in beeld, en zijn stops krijgen hun nummers terug.',
  'help.guide.map-whole-trip.step.4':
    'De knop zegt nu Hele reis verbergen. Druk erop om terug te vallen op die ene open dag.',
  'help.guide.map-whole-trip.result':
    'Elke reisdag is in zijn eigen kleur getekend, en het kaartje zegt wat elke dag beslaat en waar de reis op uitkomt.',
  'help.guide.map-whole-trip.tip.1':
    'Het totaal komt binnen in een paar etappes tegelijk. Zolang er een … achter staat, is het getal nog een deelsom; het ligt vast zodra elke etappe heeft geantwoord.',
  'help.guide.map-whole-trip.tip.2':
    'Een etappe die de router weigert blijft een rechte lijn en telt niets mee, en het kaartje zegt dat, in plaats van stilletjes te laag uit te komen.',
  'help.guide.map-whole-trip.tip.3':
    'Een dag met minder dan twee stops met een locatie heeft geen route om te tekenen en valt dus helemaal buiten het kaartje.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'De route van een boeking op de kaart tonen',
  'help.guide.map-booking-routes.goal':
    'Teken de vluchten, treinen en ritten die je hebt geboekt op de kaart, en haal ze er weer af.',
  'help.guide.map-booking-routes.step.1':
    'Boekingsroutes staan uit tot je erom vraagt. Op de rij van een boeking in de dagenkolom zit een klein route-icoon: Boekingsroutes tonen.',
  'help.guide.map-booking-routes.step.2':
    'Klik erop en de boeking verschijnt op de kaart: een vlucht als een grootcirkelboog, een rit langs de echte wegen, een trein als de keten van zijn stations. Bevestigd wordt doorgetrokken getekend, In behandeling gestreept, en de uiteinden van de route zijn blauwe pillen met het icoon van het vervoer.',
  'help.guide.map-booking-routes.step.3':
    'Klik op een eindpil en de boeking erachter gaat open, met de tijden, de referentie en waar hij begint. Sluiten bergt hem weer op.',
  'help.guide.map-booking-routes.step.4':
    'Het route-icoon in de werkbalk boven de dagen doet de hele reis in één keer: Alle boekingsroutes tonen tekent elke boeking die er een heeft.',
  'help.guide.map-booking-routes.step.5':
    'Het is een schone lei en geen laag erbovenop, dus wat je boeking voor boeking had gekozen, valt weg. Druk er nog eens op, nu het Alle boekingsroutes verbergen zegt, en de kaart is leeg.',
  'help.guide.map-booking-routes.result':
    'De boekingen waar je om vroeg staan op de kaart getekend, en de keuze blijft voor deze reis in deze browser bewaard tot je hem verandert.',
  'help.guide.map-booking-routes.tip.1':
    'De uiteinden dragen de luchthavencode of de naam van het station alleen als Routelabels voor boekingen aan staat in Instellingen, onder Travel & map; anders tonen ze alleen het icoon.',
  'help.guide.map-booking-routes.tip.2':
    'Boekingsroutes altijd tonen, in dezelfde instellingen, tekent ze vanaf het begin op elke reis waarover je nog niet hebt beslist.',
  'help.guide.map-booking-routes.tip.3':
    'Een boeking heeft twee uiteinden met coördinaten nodig voordat hij getekend kan worden, dus een hotel of een restaurant draagt geen route-icoon.',
  'help.ctx.trip-map.bullet.8':
    'Met de add-on Dawarich aan tekent de ronde knop Dawarich onder Hele reis tonen de route die je telefoon echt heeft opgenomen: Opgenomen route tonen legt hem gestreept onder de geplande route, één kleur per dag, en het label van de knop zegt waarom er geen lijn is als die er niet is.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'De route tonen die je echt hebt afgelegd',
  'help.guide.map-dawarich-trail.goal':
    'Leg de route die Dawarich op je telefoon opnam over de kaart, gestreept naast de route die je plande, en lees de reis dag voor dag zoals hij echt ging.',
  'help.guide.map-dawarich-trail.step.1':
    'De ronde knop Dawarich zit rechtsonder op de kaart, onder Hele reis tonen; erover zweven zegt Opgenomen route tonen. Klik erop. TREK vraagt je Dawarich naar de datums van de reis, en er draait een ring om de knop zolang het antwoord onderweg is.',
  'help.guide.map-dawarich-trail.step.2':
    'De opgenomen route landt als een gestreepte lijn, één kleur per dag, onder de geplande route getekend zodat het plan leesbaar blijft. De knop leest nu Opgenomen route verbergen. Dagen worden bij plaatselijke middernacht geknipt, en een dag die in de dagenkolom is dichtgeklapt neemt zijn gestreepte lijn samen met zijn stops van de kaart.',
  'help.guide.map-dawarich-trail.step.3':
    'Klik ook op Hele reis tonen en elke geplande dag wordt doorgetrokken naast de gestreepte opname getekend. Waar de twee samenlopen ging de dag zoals gepland; waar de gestreepte lijn afdwaalt is waar dat niet zo was.',
  'help.guide.map-dawarich-trail.result':
    'Wat je plande en wat je echt deed staan samen op de kaart, gestreept tegenover doorgetrokken, en het kaartje boven de knoppen noemt nog steeds de geplande dagen en hun afstanden.',
  'help.guide.map-dawarich-trail.tip.1':
    'Aan of uit wordt per reis onthouden voor deze browsersessie. Zolang de route aanstaat vraagt TREK Dawarich elke twee minuten opnieuw, zo loopt een reis die bezig is bij zonder herladen; de route zelf wordt nooit opgeslagen, dus hij zit niet in de database van TREK, niet in back-ups en is er offline niet.',
  'help.guide.map-dawarich-trail.tip.2':
    'Het label van de knop verklaart een lege kaart: De opgenomen route wordt geladen… zolang hij onderweg is, Op deze datums is er niets opgenomen, De opgenomen route kon niet worden geladen, of De opgenomen route heeft een verbinding nodig als TREK offline is.',
  // map-compass
  'help.guide.map-compass.title': 'De kaart draaien en het noorden terugvinden',
  'help.guide.map-compass.goal':
    'Draai de kaart in de richting waarin je gaat, en zet hem met één klik terug naar het noorden.',
  'help.guide.map-compass.step.1':
    'Draai de kaart door met de rechtermuisknop te slepen, of houd Ctrl ingedrukt en sleep met de linkerknop; op een aanraakscherm draai je met twee vingers. Het ronde kompas naast de rij categorie-iconen bovenaan de kaart draait mee: zijn pijl wijst altijd naar het noorden, dus hij helt zover als jij hebt gedraaid.',
  'help.guide.map-compass.step.2':
    'Klik op het kompas. Reset north, zoals de knop heet, laat de kaart soepel terugkeren naar het noorden bovenaan en naar een vlak beeld, en de pijl staat weer rechtop.',
  'help.guide.map-compass.result':
    'De kaart staat weer met het noorden boven en vlak, en aan de reis is niets veranderd: het kompas beweegt alleen de camera.',
  'help.guide.map-compass.tip.1':
    'Het kompas bestaat alleen op de kaarten van MapLibre GL en Mapbox GL; de Leaflet-kaart kan niet worden gedraaid, dus die heeft er geen. Kaartprovider in Instellingen, onder Kaart, bepaalt welke je gebruikt, en Kaart opslaan houdt de keuze vast.',
  'help.guide.map-compass.tip.2':
    'De klik haalt ook de kanteling eruit: met de rechtermuisknop omhoog of omlaag slepen kantelt het beeld, en Reset north zet het samen met de draaiing weer vlak. Op Mapbox GL met 3D-gebouwen & terrein aan maakt dat ook het 3D-beeld plat, tot je het weer kantelt.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Samenwerking',
  'help.ctx.trip-collab.summary':
    'Het tabblad waar de groep samen plant: links de chat, daarnaast de gedeelde notities en links, daaronder de polls en aan het eind Wat komt er. Alles wat hier geschreven wordt, staat meteen op het scherm van elk ander lid, zonder herladen.',
  'help.ctx.trip-collab.bullet.1':
    'De chat is de linkerkolom. Typ in Typ een bericht... en druk op Enter; Shift en Enter maken een nieuwe regel. De smiley zet er een emoji in, Afbeeldingen toevoegen hangt tot vier afbeeldingen aan het bericht.',
  'help.ctx.trip-collab.bullet.2':
    'Ga met de muis over een bericht voor Beantwoorden en, bij je eigen bericht, Verwijderen; met rechts klikken komen de acht snelle reacties. Een verwijderd bericht laat één regel achter die zegt dat jij het verwijderd hebt.',
  'help.ctx.trip-collab.bullet.3':
    'Notities is het gedeelde blok: Nieuwe notitie schrijft er een, en het tandwiel ernaast opent Categorieën beheren voor hun namen en kleuren. Een kaart draagt Uitvouwen, Vastpinnen, Bewerken en Verwijderen.',
  'help.ctx.trip-collab.bullet.4':
    'Links verzamelt de adressen waar de reis op draait. Link toevoegen neemt een titel en een http- of https-adres; Link bewerken, Link vastmaken en Link verwijderen zitten aan het eind van de chip, en vastgemaakte links blijven vooraan.',
  'help.ctx.trip-collab.bullet.5':
    'Polls beslissen dingen. Nieuwe poll stelt een vraag met minstens twee opties; een klik op een optie is jouw stem, Sluiten beëindigt de stemming en Verwijderen haalt de poll weg.',
  'help.ctx.trip-collab.bullet.6':
    'Wat komt er toont de stops van de reis die nog voor je liggen, tot acht ervan, met hun tijden en de mensen die erbij zijn. Het leest alleen het dagplan; de tijden worden daar gezet.',
  // write-note
  'help.guide.write-note.title': 'Een gedeelde notitie schrijven',
  'help.guide.write-note.goal':
    'Zet wat de hele groep nodig heeft, een afspraak, een adres, een herinnering, daar waar iedereen het terugvindt.',
  'help.guide.write-note.step.1': 'Klik bovenaan het paneel Notities op Nieuwe notitie. Het formulier gaat open.',
  'help.guide.write-note.step.2':
    'Notitietitel is de naam die de kaart draagt. Het is het enige waar het formulier op staat: Aanmaken blijft grijs zolang er niets in staat.',
  'help.guide.write-note.step.3':
    'Het grote vak eronder bevat de tekst en neemt Markdown: een vet woord, een lijst, een kop. De kaart toont de eerste regels, en Uitvouwen erop opent de hele notitie.',
  'help.guide.write-note.step.4':
    'Kies onder Categorie die waar de notitie bij hoort; haar kleur wordt de kleur van de kaart. De pillen zijn de categorieën die al bestaan, en een nieuwe maak je onder Categorieën beheren.',
  'help.guide.write-note.step.5':
    'Website neemt een link die bij de notitie hoort. De kaart draagt dan een tegel Link die hem opent.',
  'help.guide.write-note.step.6': 'Klik op Aanmaken.',
  'help.guide.write-note.result':
    'De notitie is een kaart in het paneel Notities, in de kleur van haar categorie, en staat al op het scherm van elk ander lid.',
  'help.guide.write-note.tip.1':
    'Vastpinnen op een kaart houdt hem bovenaan het paneel; alles daaronder is gesorteerd op wanneer het het laatst is gewijzigd.',
  'help.guide.write-note.tip.2':
    'Het tandwiel naast Nieuwe notitie opent Categorieën beheren: daar krijgt een categorie haar kleur, wordt ze overal in één keer hernoemd, of wordt ze aangemaakt voordat een notitie haar gebruikt.',
  'help.guide.write-note.tip.3':
    'Bestanden bijvoegen hangt een document aan de notitie. Bijvoegen opent de bestandskiezer, en een afbeelding of een PDF kun je ook gewoon in het formulier plakken.',
  'help.guide.write-note.tip.4':
    'Notities is een eigen schakelaar onder Add-ons, onder Samenwerking: een beheerder kan hem uitzetten en de Chat, de Links, de Polls en Wat nu laten draaien.',
  // shared-links
  'help.guide.shared-links.title': 'De links van de reis verzamelen',
  'help.guide.shared-links.goal':
    'Houd het boekingsportaal, het gedeelde album en de dienstregeling op één plek in plaats van er de chat voor door te scrollen.',
  'help.guide.shared-links.step.1': 'Klik bovenaan het paneel Links op Link toevoegen.',
  'help.guide.shared-links.step.2':
    'Geef de link een naam in Linktitel, plak het adres in het veld eronder en klik dan op Link opslaan.',
  'help.guide.shared-links.step.3':
    'De chip toont de naam en de site waar hij naartoe wijst. Een klik erop opent de pagina in een nieuw tabblad.',
  'help.guide.shared-links.step.4':
    'De drie kleine knoppen aan het eind zijn Link bewerken, Link vastmaken en Link verwijderen. Link vastmaken zet de chip vooraan in het paneel; Link verwijderen vraagt niets.',
  'help.guide.shared-links.result':
    'De link is een chip in het paneel Links, vooraan vastgemaakt, en tegelijk op het scherm van elk lid.',
  'help.guide.shared-links.tip.1':
    'Alleen http- en https-adressen worden aangenomen; het veld weigert al het andere voordat het opslaat.',
  'help.guide.shared-links.tip.2':
    'Vastgemaakte links komen eerst, dan de nieuwste. Het kleine pictogram naast een titel is de eigen favicon van de site, opgehaald bij de site zelf, dus zonder internet toont de chip in plaats daarvan een gewoon linkteken.',
  'help.guide.shared-links.tip.3':
    'Links is een eigen schakelaar onder Add-ons, onder Samenwerking, zodat een beheerder het paneel kan uitzetten zonder de rest van het tabblad aan te raken.',
  // create-poll
  'help.guide.create-poll.title': 'De groep vragen',
  'help.guide.create-poll.goal':
    'Maak van een vraag die in de chat niemand beantwoordt een poll die iedereen kan aantikken.',
  'help.guide.create-poll.step.1': 'Klik bovenaan het paneel Polls op Nieuwe poll.',
  'help.guide.create-poll.step.2':
    'Schrijf de vraag. Markdown wordt ondersteund onder het vak betekent dat een vet woord, een regeleinde of een korte lijst hier werkt.',
  'help.guide.create-poll.step.3': 'Vul Optie 1 en Optie 2 in. Twee opties met iets erin zijn het minimum.',
  'help.guide.create-poll.step.4':
    '+ Optie toevoegen voegt een derde toe, een vierde, zoveel als je nodig hebt; het kleine kruisje naast een rij haalt er weer een weg.',
  'help.guide.create-poll.step.5':
    'Meerkeuze laat iedereen meer dan één optie aantikken. Staat hij uit, dan schuift een stem mee als iemand iets anders kiest.',
  'help.guide.create-poll.step.6': 'Klik op Poll aanmaken.',
  'help.guide.create-poll.result': 'De poll staat bovenaan het paneel Polls, open, en niemand heeft nog gestemd.',
  'help.guide.create-poll.tip.1': 'De vraag wordt als Markdown weergegeven; de opties blijven platte tekst.',
  'help.guide.create-poll.tip.2':
    'Poll aanmaken blijft grijs tot er een vraag is en minstens twee opties met iets erin.',
  'help.guide.create-poll.tip.3':
    'Een deadline kun je alleen in de telefoonapp zetten. Een poll die er een heeft toont hier de resterende tijd in een amberkleurige chip en geldt als gesloten zodra die afloopt.',
  'help.guide.create-poll.tip.4':
    'Polls is een eigen schakelaar onder Add-ons, onder Samenwerking: een beheerder kan hem uitzetten en de andere vier panelen laten draaien.',
  // vote-poll
  'help.guide.vote-poll.title': 'Stemmen en het resultaat lezen',
  'help.guide.vote-poll.goal': 'Breng je stem uit, zie waar de groep staat, en verander van gedachten.',
  'help.guide.vote-poll.step.1': 'Klik op de optie die je wilt. De cirkel ervan vult zich en de balk erachter groeit.',
  'help.guide.vote-poll.step.2':
    'Nu is het hele resultaat te lezen: de balk is het aandeel, het percentage staat rechts, en de kleine cirkels zijn de mensen die die optie kozen.',
  'help.guide.vote-poll.step.3':
    'Van gedachten veranderd? Klik op een andere optie. Bij een poll zonder Meerkeuze schuift je stem mee in plaats van dat er een tweede bij komt.',
  'help.guide.vote-poll.step.4':
    'Onder de vraag staat hoeveel stemmen de poll heeft. Een klik op de optie die je al koos haalt je stem er weer uit, en de teller daalt.',
  'help.guide.vote-poll.result':
    'Je vinkje staat op één optie, de balken tonen hoe de groep verdeeld is, en de cirkels zeggen wie wat koos.',
  'help.guide.vote-poll.tip.1':
    'De balken en de percentages verschijnen pas als je zelf gestemd hebt, of als de poll gesloten is, zodat niemand door de tussenstand gestuurd wordt.',
  'help.guide.vote-poll.tip.2':
    'Een stem is nooit anoniem: ga met de muis over een van de cirkels bij een optie voor de naam erachter.',
  // close-poll
  'help.guide.close-poll.title': 'Een poll sluiten of weghalen',
  'help.guide.close-poll.goal':
    'Stop de stemming zodra de groep beslist heeft, en ruim een poll op die niemand meer nodig heeft.',
  'help.guide.close-poll.step.1':
    'Sluiten, het slotje in de hoek van een poll, beëindigt de stemming. De opties nemen geen klikken meer aan.',
  'help.guide.close-poll.step.2':
    'Een gesloten poll zakt onder de kop Gesloten onderaan het paneel, draagt een badge Gesloten en toont iedereen het resultaat, of ze nu gestemd hebben of niet. De winnende optie krijgt een groene tint.',
  'help.guide.close-poll.step.3':
    'Verwijderen, de prullenbak in dezelfde hoek, haalt de poll weg. Niets vraagt het twee keer, en de stemmen gaan mee.',
  'help.guide.close-poll.result':
    'De poll is uit het paneel van elk lid verdwenen. Een die je alleen gesloten hebt, blijft onderaan leesbaar, met zijn resultaat.',
  'help.guide.close-poll.tip.1':
    'Sluiten kan niet ongedaan gemaakt worden: heropenen bestaat niet. Een poll die per ongeluk gesloten is, moet opnieuw gesteld worden.',
  'help.guide.close-poll.tip.2':
    'Verwijderen haalt de poll en elke stem erop voor iedereen weg, meteen en zonder vraag.',
  // whats-next
  'help.guide.whats-next.title': 'Wat komt er lezen',
  'help.guide.whats-next.goal': 'Zie wat de groep hierna doet zonder het plan te openen.',
  'help.guide.whats-next.step.1':
    'Het paneel toont de stops van de reis die nog voor je liggen, tot acht ervan, op tijd gesorteerd, onder een kop per dag: Vandaag, Morgen of de datum.',
  'help.guide.whats-next.step.2':
    'Links in een rij staat de tijd: het begin, tot, en het einde als de stop dat heeft, of TBD als er nog geen tijd op gezet is.',
  'help.guide.whats-next.step.3':
    'De chips onder de naam zijn de mensen bij die stop. Is er niemand voor gekozen, dan staat iedereen in de reis er.',
  'help.guide.whats-next.result':
    'Een lijst van wat eraan komt, alleen om te lezen: hij volgt het plan, en niets hier verandert het.',
  'help.guide.whats-next.tip.1':
    'Hier wordt niets gezet. De tijden komen uit het dagplan; verander ze daar en deze lijst volgt meteen.',
  'help.guide.whats-next.tip.2':
    'Alleen wat nog voor je ligt staat erin: een stop waarvan de tijd voorbij is valt eruit, en aan het eind van een reis is het paneel leeg.',
  'help.guide.whats-next.tip.3':
    'Wat nu is een eigen schakelaar onder Add-ons, onder Samenwerking, en het is een paneel voor de desktop: het tabblad Samenwerking van de telefoonapp biedt het niet.',
  // trip-chat
  'help.guide.trip-chat.title': 'Met de groep praten',
  'help.guide.trip-chat.goal':
    'Zeg iets, antwoord op één bepaald bericht, reageer op een ander, en neem je eigen bericht terug.',
  'help.guide.trip-chat.step.1':
    'Typ in Typ een bericht... en druk op Enter. De blauwe pijl naast het vak doet hetzelfde; Shift en Enter maken in plaats daarvan een nieuwe regel.',
  'help.guide.trip-chat.step.2':
    'De smiley opent de emojikiezer, met Smileys, Reactions en Travel erin. Wat je kiest wordt toegevoegd aan wat je aan het schrijven bent, het wordt niet op zichzelf verstuurd.',
  'help.guide.trip-chat.step.3':
    'Ga met de muis over het bericht van iemand anders: in de hoek verschijnt een klein rond knopje. Dat is Beantwoorden.',
  'help.guide.trip-chat.step.4':
    'Het bericht waarop je antwoordt staat als citaat boven het vak. Schrijf en verstuur, en het citaat reist mee in je bubbel; het kruisje op het citaat laat het weer vallen.',
  'help.guide.trip-chat.step.5':
    'Klik met rechts op een bericht voor de acht snelle reacties. De jouwe zit onder de bubbel, en een tweede klik op dezelfde haalt hem terug.',
  'help.guide.trip-chat.step.6':
    'Je eigen berichten dragen Verwijderen naast Beantwoorden. Het haalt het bericht weg en laat één regel achter die zegt dat jij het verwijderd hebt: terug kan niet.',
  'help.guide.trip-chat.result':
    'Je antwoord staat onder het bericht dat het citeert, een reactie hangt aan een derde, en het bericht dat je terugnam laat één enkele regel achter die dat zegt.',
  'help.guide.trip-chat.tip.1':
    'Enter verstuurt, Shift en Enter maken een nieuwe regel. Een bericht dat alleen uit emoji bestaat wordt groot getoond.',
  'help.guide.trip-chat.tip.2':
    'Afbeeldingen toevoegen neemt tot vier afbeeldingen voor één bericht; ze kunnen ook gewoon geplakt of op het vak gesleept worden.',
  'help.guide.trip-chat.tip.3':
    'Een bericht met een link erin krijgt er een voorbeeldkaart onder, opgehaald door je eigen TREK, dus een link naar iets wat alleen jij kunt bereiken blijft een gewone link.',
  'help.guide.trip-chat.tip.4':
    'Chat is een eigen schakelaar onder Add-ons, onder Samenwerking: een beheerder kan hem uitzetten en de Notities, de Links, de Polls en Wat nu laten draaien.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Lijsten',
  'help.ctx.trip-lists.summary':
    'Twee lijsten voor één reis: de inpaklijst, met wie wat meeneemt en wat het weegt, en de takenlijst met alles wat vooraf en onderweg moet gebeuren. Het tabblad is er zolang de addon Lijsten aan staat.',
  'help.ctx.trip-lists.bullet.1':
    'Inpaklijst en Taken bovenaan wisselen tussen de twee en tellen wat er in elk zit; de knoppen rechts horen bij degene die open is.',
  'help.ctx.trip-lists.bullet.2':
    'De inpaklijst is gegroepeerd in lijsten, Documenten, Kleding, hoe je ze ook noemt, elk met een kleurstip, een teller van ingepakt op totaal en drie puntjes met Hernoemen, Alles aanvinken, Alles uitvinken en Lijst verwijderen. Lijst toevoegen in de balk erboven maakt er een nieuwe.',
  'help.ctx.trip-lists.bullet.3':
    'Een rij is een vinkvakje en een naam, dan als kleine badges wie het item meeneemt, het aantal en het gewicht in grammen, en een bagagerondje zolang Bagagetracking aan staat, dan de prullenbak en drie puntjes met Naar lijst verplaatsen, Delen, Hernoemen en Verwijderen. Wat een rij niet gebruikt, blijft gedimd tot je erop wijst, en de greep links sleept hem omhoog of omlaag binnen zijn lijst.',
  'help.ctx.trip-lists.bullet.4':
    'Gedeeld en Mijn lijst splitsen de inpaklijst in tweeën: de pot die iedereen ziet, en die van jou. Alle, Openstaand en Klaar versmallen degene die open is, en de balk erboven telt wat er ingepakt is.',
  'help.ctx.trip-lists.bullet.5':
    'Sjabloon toepassen en Opslaan als sjabloon vullen of bewaren een lijst zonder hem uit te typen, en de twee pictogrammen ernaast exporteren de lijst, als afdruk, als PDF of als bestand, en importeren er een. De rode knop naast de voortgangsbalk noemt hoeveel items aangevinkt zijn en ruimt ze op.',
  'help.ctx.trip-lists.bullet.6':
    'Taken heeft een eigen zijbalk: de voortgangskaart, de filters Alles, Mijn taken, Verlopen en Klaar, één rij per lijst en daaronder Lijst toevoegen. De taken staan in een kaart waarvan de kop het filter noemt en de sortering bevat, Prioriteit of Vervaldatum. Een klik op een taak opent hem in het paneel rechts, en Nieuwe taak opent het formulier Nieuwe taak over het midden van het scherm.',
  // packing-categories
  'help.guide.packing-categories.title': 'De inpaklijst opbouwen',
  'help.guide.packing-categories.goal':
    'Groepeer wat je meeneemt in lijsten, vul ze met items en zeg wie zich om welke lijst bekommert.',
  'help.guide.packing-categories.step.1':
    'Klik in de balk boven de lijsten op Lijst toevoegen, typ de naam in Lijstnaam (bijv. Kleding) en klik op Toevoegen.',
  'help.guide.packing-categories.step.2':
    'De nieuwe lijst begint met één lege rij. Klik op Item toevoegen, typ het item in Itemnaam... en druk op Enter; het veld blijft open voor het volgende.',
  'help.guide.packing-categories.step.3':
    'Hernoem een rij door op de naam te klikken, of met Hernoemen in de drie puntjes aan het rechteruiteinde.',
  'help.guide.packing-categories.step.4':
    'Het gestippelde rondje in de kop van de lijst wijst reisleden aan de lijst toe. Kies een naam; het label dat verschijnt haalt die persoon er met een klik weer af.',
  'help.guide.packing-categories.step.5':
    'De drie puntjes aan het eind van de kop bevatten de rest: Hernoemen, Alles aanvinken, Alles uitvinken en Lijst verwijderen, dat de lijst met alles erin meeneemt zonder nog eens te vragen.',
  'help.guide.packing-categories.result':
    'De nieuwe lijst staat in het raster met zijn items eronder en zijn kleurstip, en zijn teller telt wat er al ingepakt is.',
  'help.guide.packing-categories.tip.1':
    'Een lijst is niets anders dan zijn items. Verwijder de laatste en de rij wordt een plaatshouder zodat de lijst zijn plek en zijn kleur houdt; verwijder ook die rij en de lijst is weg.',
  'help.guide.packing-categories.tip.2':
    'Iemand aan een lijst toewijzen stuurt die persoon een bagagemelding. Het verandert niet wie de items kan zien, dat is Delen, in de drie puntjes van een rij.',
  'help.guide.packing-categories.tip.3':
    'Twee lijsten mogen dezelfde naam dragen. TREK houdt ze intern uit elkaar, de namen blijven dus zoals je ze getypt hebt.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Afvinken terwijl je inpakt',
  'help.guide.check-off-packing.goal': 'Markeer wat in de tas zit, kijk naar de balk en ruim de ingepakte items op.',
  'help.guide.check-off-packing.step.1':
    'Klik op het vakje links van een rij. De naam wordt doorgestreept en de balk beweegt.',
  'help.guide.check-off-packing.step.2':
    'De balk erboven telt wat ingepakt is tegen alles op de lijst, als getal en als percentage.',
  'help.guide.check-off-packing.step.3':
    'Een hele lijst in één keer: de drie puntjes in zijn kop bevatten Alles aanvinken en Alles uitvinken.',
  'help.guide.check-off-packing.step.4':
    'Alle, Openstaand en Klaar versmallen het raster. Openstaand laat alleen wat nog ontbreekt, een volledig ingepakte lijst valt er dus uit.',
  'help.guide.check-off-packing.step.5':
    '3 aangevinkte verwijderen naast de voortgangsbalk wist alle aangevinkte items in één keer, na één bevestiging van de browser.',
  'help.guide.check-off-packing.result':
    'Alleen wat nog open staat wordt getoond, en de balk erboven zegt hoe ver het inpakken is.',
  'help.guide.check-off-packing.tip.1': 'Een aangevinkt item kun je toch hernoemen: klik op de naam.',
  'help.guide.check-off-packing.tip.2':
    'Alles aanvinken en Alles uitvinken werken op één lijst tegelijk, vanuit de drie puntjes van die lijst.',
  'help.guide.check-off-packing.tip.3':
    'Als elk item aangevinkt is, wordt de teller vervangen door Alles ingepakt! en kleurt de balk groen.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Een inpaksjabloon toepassen',
  'help.guide.apply-packing-template.goal':
    'Haal een kant-en-klare lijst de reis in, en bewaar de lijst van deze reis voor de volgende.',
  'help.guide.apply-packing-template.step.1': 'Klik op Sjabloon toepassen in de balk boven de lijst.',
  'help.guide.apply-packing-template.step.2':
    'Kies een sjabloon. Elke regel noemt hem en zegt hoeveel items hij bevat.',
  'help.guide.apply-packing-template.step.3':
    'De items landen in de weergave waarin je zit: Gedeeld zet ze in de pot die iedereen ziet, Mijn lijst maakt ze van jou.',
  'help.guide.apply-packing-template.step.4':
    'De lijst van deze reis bewaren voor de volgende: Opslaan als sjabloon opent een venster, typ een naam en klik op Opslaan.',
  'help.guide.apply-packing-template.result':
    'De lijsten en items van het sjabloon staan in de reis, naast wat er al was.',
  'help.guide.apply-packing-template.tip.1':
    'Een sjabloon draagt alleen namen en lijsten. Aantallen, gewichten, bagage en wat al aangevinkt is blijven achter.',
  'help.guide.apply-packing-template.tip.2':
    'Sjabloon toepassen is er pas zodra er een sjabloon bestaat. Zonder sjabloon verschijnt de knop helemaal niet.',
  'help.guide.apply-packing-template.tip.3':
    'Opslaan als sjabloon verschijnt alleen voor een beheerder van de instantie, en alleen zolang de lijst items heeft. Het slaat de gedeelde pot plus je eigen items op, nooit de privé-items van een ander lid.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Een hele inpaklijst erin plakken',
  'help.guide.import-packing-list.goal': 'Maak in één keer inpakitems van een lijst die je ergens anders al hebt.',
  'help.guide.import-packing-list.step.1': 'Klik op de importknop met de pijl omlaag in de balk boven de lijst.',
  'help.guide.import-packing-list.step.2':
    'Eén item per regel: Categorie, Naam, Gewicht in g (optioneel), Bagage (optioneel), checked/unchecked (optioneel). Het grijze voorbeeld in het vak toont alle vier de vormen. Een Markdown-lijst werkt ook: een kop geeft de lijst een naam, en "- [ ]" en "- [x]" worden items.',
  'help.guide.import-packing-list.step.3':
    'Of laad de regels uit een bestand met CSV/TXT/MD laden. Het neemt een .csv, een .txt of een .md en vervangt wat er in het vak staat.',
  'help.guide.import-packing-list.step.4': 'Klik op Importeren. De knop telt de regels die hij begrepen heeft.',
  'help.guide.import-packing-list.result':
    'Elke regel wordt een rij, in de lijst die zijn eerste veld noemt, en niets van wat er al stond wordt aangeraakt.',
  'help.guide.import-packing-list.tip.1':
    'Komma’s, puntkomma’s en tabs scheiden allemaal velden, en aanhalingstekens houden een veld bij elkaar, zodat „Shirt, blauw“ één naam blijft. Een regel met één enkele waarde is alleen een naam, een regel zonder eigen lijst komt in Overig terecht, en "3x" voor een naam stelt het aantal in.',
  'help.guide.import-packing-list.tip.2':
    'Een bagagestuk dat in het vierde veld genoemd wordt, wordt aangemaakt als de reis het nog niet heeft. Dit is de enige plek die gewichten en bagage in bulk laadt; een sjabloon brengt alleen namen en lijsten.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'De inpaklijst afdrukken of exporteren',
  'help.guide.export-packing-list.goal':
    'Neem de lijst mee op papier, als PDF of als bestand voor een andere app of de volgende reis.',
  'help.guide.export-packing-list.step.1': 'Klik op de exportknop met de pijl omhoog in de balk boven de lijst.',
  'help.guide.export-packing-list.step.2':
    'Markdown-checklist (.md) en CSV voor import (.csv) slaan de lijst meteen op als bestand.',
  'help.guide.export-packing-list.step.3':
    'Klik op Afdrukken of opslaan als pdf. Het voorbeeld toont de lijst als pagina: bovenaan de reis en de datums, dan elke lijst als kaart met een vakje om af te vinken.',
  'help.guide.export-packing-list.step.4':
    'Klik onder het voorbeeld op Afdrukken of opslaan als pdf. De browser opent zijn afdrukvenster: kies een printer, of Opslaan als pdf om een bestand te bewaren.',
  'help.guide.export-packing-list.result':
    'De afdruk en de bestanden bevatten de weergave die open is, Gedeeld of Mijn lijst, met de aantallen, gewichten en vinkjes.',
  'help.guide.export-packing-list.tip.1':
    'De CSV is het formaat dat Importeren leest, bagage inbegrepen, dus hij werkt als je eigen inpaksjabloon: importeer hem in de volgende reis.',
  'help.guide.export-packing-list.tip.2':
    'Het Markdown-bestand opent als checklist in Obsidian, Notion of GitHub, en komt via Importeren net zo goed weer terug.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Bepalen wie een item ziet en wie het meeneemt',
  'help.guide.share-packing-item.goal':
    'Verplaats een item tussen de pot van de groep, je eigen lijst en de mensen voor wie je het meeneemt.',
  'help.guide.share-packing-item.step.1':
    'Gedeeld boven de lijsten is de pot die iedereen ziet, Mijn lijst is die van jou, en elk telt wat erin zit. Klik op Mijn lijst om die van jou te bekijken.',
  'help.guide.share-packing-item.step.2':
    'Terug in Gedeeld open je de drie puntjes aan het eind van een rij en klik je op Delen.',
  'help.guide.share-packing-item.step.3':
    'Drie niveaus: Gedeeld, in de pot van de groep en voor iedereen zichtbaar; Persoonlijk, dat alleen jij ziet; en Delen met…, waar je de mensen kiest voor wie het item geldt.',
  'help.guide.share-packing-item.step.4':
    'Een Persoonlijk item staat alleen op Mijn lijst. Schakel over om het te vinden.',
  'help.guide.share-packing-item.step.5':
    'Open Delen opnieuw en vink een naam aan onder Delen met…. Het item staat dan ook op de lijst van die persoon, en de rij krijgt een kleine badge die telt met hoeveel mensen het gedeeld is.',
  'help.guide.share-packing-item.result': 'Het item zit in het niveau dat je koos, en de rij zegt wie het meeneemt.',
  'help.guide.share-packing-item.tip.1':
    'Alleen wie een item meeneemt verandert het delen ervan. Degene met wie je het gedeeld hebt ziet het op zijn eigen Mijn lijst, gemarkeerd met jouw naam, en kan het afvinken.',
  'help.guide.share-packing-item.tip.2':
    'Bij een item dat iemand anders meeneemt krijg je in plaats daarvan twee andere knoppen: Ik kan het ook meenemen, dat jou ernaast zet, en Kopiëren naar mijn lijst, dat er een eigen privékopie van maakt.',
  'help.guide.share-packing-item.tip.3':
    'Nieuwe items erven de weergave waarin je ze toevoegt. Toegevoegd in Mijn lijst zijn ze Persoonlijk, toegevoegd in Gedeeld gaan ze in de pot.',
  // packing-bags
  'help.guide.packing-bags.title': 'De bagage wegen',
  'help.guide.packing-bags.goal':
    'Zet een gewicht op elk item, verdeel de items over de bagage en houd elk stuk onder de limiet van de luchtvaartmaatschappij.',
  'help.guide.packing-bags.step.1':
    'Klik op de gewichtsbadge vóór het rondje en typ het gewicht van het item in grammen.',
  'help.guide.packing-bags.step.2': 'Het rondje aan het eind van de rij is zijn bagagestuk. Klik erop.',
  'help.guide.packing-bags.step.3':
    'Nog geen bagage: Bagage toevoegen, een naam, Enter. Het bagagestuk wordt aangemaakt en het item gaat er meteen in.',
  'help.guide.packing-bags.step.4':
    'Het paneel Bagage verschijnt rechts zodra er één bagagestuk bestaat: naam, gewicht, een vulbalk, wie het draagt en hoeveel items erin zitten, dan Niet toegewezen en Totaalgewicht.',
  'help.guide.packing-bags.step.5':
    'Klik op Limiet instellen en typ de limiet in kilogrammen, zoals luchtvaartmaatschappijen hem opgeven.',
  'help.guide.packing-bags.step.6': 'De gestippelde plus naast de naam van een bagagestuk zegt wie het draagt.',
  'help.guide.packing-bags.result':
    'Het paneel Bagage rechts toont het gewicht van elk bagagestuk tegen zijn limiet, wat in geen enkel stuk zit, en het totaal.',
  'help.guide.packing-bags.tip.1':
    'Het gewichtsveld, het bagagerondje en het paneel Bagage bestaan alleen zolang een beheerder Bagagetracking onder de addon Lijsten aan heeft staan.',
  'help.guide.packing-bags.tip.2':
    'Het gewicht van een bagagestuk wordt op de server opgeteld over de items van elk lid, ook die je niet kunt zien, het getal is dus echt wat het stuk weegt.',
  'help.guide.packing-bags.tip.3':
    'Een bagagestuk zonder limiet wordt tegen het zwaarste stuk getekend, zodat de balken vergelijkbaar blijven. Geef het een limiet en de balk leest daartegen af.',
  // create-todo
  'help.guide.create-todo.title': 'Een taak toevoegen',
  'help.guide.create-todo.goal':
    'Schrijf op wat er moet gebeuren, met een lijst, een prioriteit, een datum en een naam erbij.',
  'help.guide.create-todo.step.1': 'Klik rechtsboven op Nieuwe taak.',
  'help.guide.create-todo.step.2':
    'Geef hem een naam in Taaknaam, en zet alles wat het onthouden waard is onder Beschrijving.',
  'help.guide.create-todo.step.3':
    'Lijst groepeert de taak. Kies er een, of gebruik de plus ernaast om een nieuwe te benoemen in een klein dialoogvenster.',
  'help.guide.create-todo.step.4': 'Prioriteit is vier knoppen: Geen, P1, P2 en P3, van rood tot blauw.',
  'help.guide.create-todo.step.5': 'Vervaldatum opent een kalender, en Toegewezen aan zet een naam op de taak.',
  'help.guide.create-todo.step.6': 'Klik op Taak aanmaken.',
  'help.guide.create-todo.result':
    'De taak staat in de lijst met zijn badges, de prioriteit, de vervaldatum, de lijst en de persoon aan wie hij is toegewezen, en hij opent in het paneel rechts.',
  'help.guide.create-todo.tip.1':
    'Alleen de naam is verplicht. Al het andere kan later vanuit het paneel rechts worden ingevuld.',
  'help.guide.create-todo.tip.2': 'Met een lijst geselecteerd in de zijbalk begint een nieuwe taak in die lijst.',
  'help.guide.create-todo.tip.3':
    'Enter in het naamveld maakt de taak meteen aan, zonder de andere velden aan te raken.',
  // todo-filters
  'help.guide.todo-filters.title': 'Een taak vinden en wijzigen',
  'help.guide.todo-filters.goal':
    'Snoei de takenlijst terug tot wat nu telt, en bewerk dan de taak waarop je terechtkwam.',
  'help.guide.todo-filters.step.1':
    'Taken in de zijbalk: Alles is alles wat nog open staat, Mijn taken wat bij jou ligt, Verlopen wat een datum in het verleden heeft, Klaar wat af is. Elk draagt zijn telling; klik op Verlopen.',
  'help.guide.todo-filters.step.2':
    'Onder Lijsten staat één rij per lijst. Er een kiezen toont die lijst, afgeronde taken inbegrepen.',
  'help.guide.todo-filters.step.3':
    'De sortering in de kop van de lijst herschikt wat op het scherm staat: Prioriteit zet P1 vooraan, Vervaldatum zet de dichtstbijzijnde deadline vooraan. Maar één van de twee tegelijk, en een tweede klik gaat terug naar je eigen volgorde.',
  'help.guide.todo-filters.step.4': 'Klik op een taak om hem in het paneel rechts te openen.',
  'help.guide.todo-filters.step.5':
    'Verander wat je nodig hebt, Beschrijving, Prioriteit, Lijst, Vervaldatum of Toegewezen aan, en dan Wijzigingen opslaan. Het vakje in de kop van het paneel vinkt de taak af, en Verwijderen haalt hem meteen weg.',
  'help.guide.todo-filters.result':
    'De lijst toont alleen de taken waar je om vroeg, en het paneel rechts bewerkt degene die je koos.',
  'help.guide.todo-filters.tip.1':
    'Een lijstrij telt alleen wat nog open staat, maar hem selecteren toont ook de afgeronde taken. Alles, Mijn taken en Verlopen verbergen wat af is; Klaar toont niets anders.',
  'help.guide.todo-filters.tip.2':
    'Prioriteit en Vervaldatum in de sortering sluiten elkaar uit, en zolang een van beide aan staat kunnen de rijen niet meer in een eigen volgorde gesleept worden.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Boekingen',
  'help.ctx.trip-bookings.summary':
    'Het tabblad dat alles bewaart wat voor de reis geboekt is en geen manier is om je te verplaatsen: de accommodaties, de tafels, de kaartjes, de rondleidingen, het parkeren. Elke boeking is een kaart in In behandeling of in Bevestigd, met haar code, haar document, haar reizigers en haar kosten.',
  'help.ctx.trip-bookings.bullet.1':
    'Handmatige boeking rechtsboven opent het formulier. De zes soorten die het maakt zijn Accommodatie, Restaurant, Evenement, Rondleiding, Parkeren en Overig; vluchten, treinen en de rest wonen op het tabblad Transport en komen hier nooit voor.',
  'help.ctx.trip-bookings.bullet.2':
    'Importeren vanuit bestand geeft een bevestiging aan de verwerking: EML, PDF, PKPass, HTML of TXT, hoogstens vijf bestanden van 10 MB. De knop is er alleen als de server ze kan lezen.',
  'help.ctx.trip-bookings.bullet.3':
    'De chips naast de kop filteren op soort, elk met zijn eigen aantal, en Alles haalt alles terug. Zodra een boeking mensen noemt, versmalt de rij avatars naast de chips het tabblad tot één van hen.',
  'help.ctx.trip-bookings.bullet.4':
    'De kaarten staan in twee secties, In behandeling en Bevestigd, elk met zijn aantal. Een klik op een sectiekop klapt hem weg, en of hij open staat wordt voor deze reis onthouden.',
  'help.ctx.trip-bookings.bullet.5':
    'Een kaart draagt de statusstip, de soort, de titel, de data en tijden, de Boekingscode, de Locatie / Adres, waaraan de boeking gekoppeld is, haar Link, Notities, Bestanden en Reizigers.',
  'help.ctx.trip-bookings.bullet.6':
    'Het potlood op een kaart opent hetzelfde formulier opnieuw; de prullenbak vraagt één keer en dan is de boeking weg. Bij een accommodatie gaan haar nachten in het Dagplan en haar gekoppelde kostenpost mee.',
  // create-booking
  'help.guide.create-booking.title': 'Een boeking aanmaken',
  'help.guide.create-booking.goal':
    'Zet met de hand een restaurant, een evenement, een rondleiding, een parkeerplaats of wat dan ook in de reis.',
  'help.guide.create-booking.step.1':
    'Klik rechtsboven op het tabblad op Handmatige boeking. Nieuwe reservering gaat open.',
  'help.guide.create-booking.step.2':
    'Kies het Boekingstype uit de lijst bovenaan het formulier, naast Reizigers. Accommodatie, Restaurant, Evenement, Rondleiding, Parkeren en Overig zijn de zes die dit tabblad maakt, en het formulier verandert met de keuze: alleen Accommodatie ruilt haar data in voor een reeks dagen.',
  'help.guide.create-booking.step.3':
    'Typ de Titel. Het is het enige veld waar het formulier op staat, en Toevoegen blijft dood tot er iets in staat.',
  'help.guide.create-booking.step.4':
    'Zet Datum en Starttijd, en Einddatum en Eindtijd als de boeking een eind heeft. De kalenders bieden alleen dagen binnen de reis, en een eind dat niet na het begin ligt zegt dat in rood en blokkeert Toevoegen.',
  'help.guide.create-booking.step.5':
    'Vul de Boekingscode uit de bevestiging in en zet Status. In behandeling of Bevestigd bepaalt in welke van de twee secties de kaart landt.',
  'help.guide.create-booking.step.6': 'Klik op Toevoegen.',
  'help.guide.create-booking.result':
    'De boeking is een kaart in haar sectie, met haar chip voor de soort, haar data en haar code, en alle anderen in de reis zien hem verschijnen.',
  'help.guide.create-booking.tip.1':
    'Locatie / Adres biedt echte adressen terwijl je typt; er een kiezen vervangt wat je had geschreven, en een adres dat je zelf typte blijft zoals het is.',
  'help.guide.create-booking.tip.2':
    'Link neemt de eigen pagina van de boeking bij de aanbieder op. De kaart maakt er een link van die in een nieuw tabblad opent.',
  'help.guide.create-booking.tip.3':
    'Notities zijn Markdown, dus een lijst of een vetgedrukte regel wordt op de kaart ook zo weergegeven.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Een accommodatie boeken',
  'help.guide.booking-hotel.goal':
    'Voer een accommodatie in, zodat ze tegelijk als boeking en als nachten in het Dagplan telt.',
  'help.guide.booking-hotel.step.1':
    'Klik op Handmatige boeking en kies Accommodatie. De datumvelden verdwijnen en een blok hotelvelden neemt hun plaats in.',
  'help.guide.booking-hotel.step.2':
    'Kies het hotel onder Accommodatie. De lijst zijn de eigen plekken van de reis, en er een kiezen schrijft zijn naam in Titel en zijn adres in Locatie / Adres.',
  'help.guide.booking-hotel.step.3':
    'Zet Van en Tot: de eerste nacht en de ochtend waarop je vertrekt. Beide bieden de dagen van de reis met hun data, en die twee houden elkaar op volgorde.',
  'help.guide.booking-hotel.step.4':
    'Vul Inchecken, Check-in tot en Uitchecken in, en de Boekingscode uit de bevestiging.',
  'help.guide.booking-hotel.step.5': 'Klik op Toevoegen.',
  'help.guide.booking-hotel.result':
    'De kaart draagt een reeks dagen in plaats van een datum, met de tijden van inchecken en uitchecken en het adres, en hetzelfde verblijf staat nu op die dagen van het plan.',
  'help.guide.booking-hotel.tip.1':
    'Accommodatie is het enige type zonder Datum en zonder Starttijd. Haar data zijn Van en Tot, en dat zijn dagen van de reis in plaats van een kalender.',
  'help.guide.booking-hotel.tip.2':
    'Laat Accommodatie leeg en typ in plaats daarvan het adres: de plek wordt voor je opgezocht, aangemaakt en op de kaart gezet.',
  'help.guide.booking-hotel.tip.3': 'De boeking verwijderen neemt de nachten uit het Dagplan mee.',
  // link-booking
  'help.guide.link-booking.title': 'Een boeking aan het plan binden',
  'help.guide.link-booking.goal':
    'Hang een boeking aan de stop en de plek waar ze bij hoort, zodat ze opduikt waar je haar wilt hebben.',
  'help.guide.link-booking.step.1':
    'Klik op het potlood van de kaart die je wilt koppelen. Reservering bewerken gaat open.',
  'help.guide.link-booking.step.2':
    'Open Koppelen aan dagtoewijzing. De lijst is jouw plan: een kop per dag, dan de stops van die dag, genummerd en met hun tijden. Kies degene waar de boeking bij hoort.',
  'help.guide.link-booking.step.3':
    'Plaats / Activiteit koppelt de plek zelf. Kies hem daar, en Titel en Locatie / Adres vullen zich overal waar je ze leeg liet.',
  'help.guide.link-booking.step.4': 'Klik op Bijwerken.',
  'help.guide.link-booking.result':
    'De kaart noemt de dag en de stop onder Koppelen aan dagtoewijzing, en de boeking reist met die stop mee in het Dagplan.',
  'help.guide.link-booking.tip.1':
    'Geen koppeling (zelfstandig) bovenaan de lijst haalt de koppeling er weer af. Accommodatie heeft helemaal geen stopkeuze: ze koppelt via haar nachten.',
  'help.guide.link-booking.tip.2':
    'Een stop op een gedateerde dag kiezen vult een lege Datum voor je in. Een datum die je al had gezet blijft met rust.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Zeggen voor wie een boeking is',
  'help.guide.booking-travelers.goal': 'Markeer de reizigers die een boeking dekt, en zie daarna alleen die van hen.',
  'help.guide.booking-travelers.step.1':
    'Open de boeking met het potlood. Reizigers staat bovenaan het formulier, naast Boekingstype, en toont Reizigers toewijzen zolang er niemand op de boeking staat.',
  'help.guide.booking-travelers.step.2':
    'Klik erop en kies de mensen voor wie deze boeking is; genoemde gasten staan ook in de lijst. Een gekozen persoon krijgt een vinkje en zijn avatar in het veld. Klik nog eens op de naam om hem eraf te halen.',
  'help.guide.booking-travelers.step.3': 'Klik op Bijwerken.',
  'help.guide.booking-travelers.step.4':
    'Boven in de werkbalk, naast de chips voor de soort, klik je op de avatar van een reiziger om alleen zijn boekingen te zien.',
  'help.guide.booking-travelers.result':
    'De kaart somt de mensen op voor wie ze is, en de rij avatars versmalt het tabblad tot één van hen.',
  'help.guide.booking-travelers.tip.1':
    'Op de kaart worden de reizigers alleen getoond, nooit gewijzigd. Ze worden hier gezet, in het formulier.',
  'help.guide.booking-travelers.tip.2':
    'De rij avatars verschijnt zodra de reis meer dan één lid heeft en minstens één boeking iemand noemt. Wat je kiest houdt stand voor deze browsersessie.',
  // booking-files
  'help.guide.booking-files.title': 'De voucher bij de boeking houden',
  'help.guide.booking-files.goal': 'Voeg de bevestiging, het kaartje of de pas toe aan de boeking waar ze bij horen.',
  'help.guide.booking-files.step.1':
    'Open de boeking met het potlood, ga omlaag naar Bestanden en klik op Bestand bijvoegen. Bij een boeking die al bestaat gaat het document meteen omhoog en zegt TREK Bestand geüpload.',
  'help.guide.booking-files.step.2':
    'Het document staat er met zijn naam, met een knop om het te openen en een X ernaast.',
  'help.guide.booking-files.step.3':
    'Bestaand bestand koppelen biedt de documenten van de reis die nog niet aan deze boeking hangen. Kies er een en het wordt gekoppeld zonder dat er iets opnieuw wordt geüpload.',
  'help.guide.booking-files.step.4': 'Klik op Bijwerken.',
  'help.guide.booking-files.result':
    'De kaart somt de documenten op onder Bestanden, en een klik op een ervan opent het.',
  'help.guide.booking-files.tip.1':
    'Bij een boeking die je nog aan het maken bent wacht het document en gaat het omhoog op het moment dat je op Toevoegen klikt.',
  'help.guide.booking-files.tip.2':
    'De X naast een document haalt de koppeling weg, niet het document. Het blijft in het tabblad Bestanden van de reis.',
  'help.guide.booking-files.tip.3':
    'Welke soorten bestanden bijgevoegd mogen worden is de lijst Toegestane bestandstypen van de beheerder; documenten, tekst en afbeeldingen zijn standaard toegestaan.',
  // booking-cost
  'help.guide.booking-cost.title': 'De prijs van een boeking in kosten omzetten',
  'help.guide.booking-cost.goal': 'Breng wat een boeking kost in Onkosten, verdeeld over de mensen die ervoor betalen.',
  'help.guide.booking-cost.step.1':
    'Open de boeking en ga naar de voet van het formulier. Onder Kosten staan Kostenpost aanmaken en Bestaande kostenpost koppelen, met de notitie Boeking opslaan en daarna de Onkosteneditor openen.',
  'help.guide.booking-cost.step.2':
    'Klik op Kostenpost aanmaken. De boeking wordt opgeslagen, het formulier gaat dicht en de Kosten-editor gaat open.',
  'help.guide.booking-cost.step.3':
    'Waar was het voor? is al de titel van de boeking. Vul het Totaalbedrag in en controleer de Valuta en de Dag.',
  'help.guide.booking-cost.step.4':
    'Categorie is die welke het boekingstype impliceert. Zet Wie heeft betaald? en hoe het bedrag verdeeld wordt.',
  'help.guide.booking-cost.step.5': 'Klik op Uitgave toevoegen.',
  'help.guide.booking-cost.result':
    'Het formulier van de boeking toont de uitgave nu onder Gekoppelde kostenposten met het bedrag, en dezelfde uitgave staat in het tabblad Onkosten, vast aan deze boeking.',
  'help.guide.booking-cost.tip.1':
    'De categorie volgt het type: Restaurant wordt Eten & drinken, Accommodatie wordt Accommodatie, Parkeren wordt Parkeren, en Evenement en Rondleiding landen allebei in Overig.',
  'help.guide.booking-cost.tip.2':
    'Een boeking kan meerdere kostenposten dragen. Bestaande kostenpost koppelen biedt de posten in Onkosten aan die nog nergens bij horen. Bij een gekoppelde maakt Ontkoppelen, kostenpost behouden hem los en laat hem in Onkosten staan, terwijl de prullenbak hem weghaalt.',
  'help.guide.booking-cost.tip.3':
    'Kosten staat alleen in het formulier zolang de add-on Onkosten aan staat, die de beheerder onder Add-ons omzet.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Een boeking vinden',
  'help.guide.filter-bookings.goal': 'Breng een lang tabblad terug tot de soort, de persoon of de staat die je zoekt.',
  'help.guide.filter-bookings.step.1':
    'De chips naast de kop zijn de soorten die deze reis echt gebruikt, elk met het aantal dat het bevat. Alles is het hele tabblad.',
  'help.guide.filter-bookings.step.2':
    'Klik op een chip om alleen die soort te houden. Klik op een tweede en beide blijven.',
  'help.guide.filter-bookings.step.3': 'Alles zet alles terug.',
  'help.guide.filter-bookings.step.4':
    'De avatars naast de chips filteren op reiziger, één persoon of meerdere tegelijk.',
  'help.guide.filter-bookings.step.5':
    'In behandeling en Bevestigd zijn de twee secties, elk met zijn aantal. Klik op een kop om er een weg te klappen; hij is nog steeds ingeklapt als je terugkomt.',
  'help.guide.filter-bookings.result':
    'Het tabblad toont alleen wat je koos, en dat is nog steeds gekozen als je er in deze browsersessie naar terugkomt.',
  'help.guide.filter-bookings.tip.1':
    'De chips bieden alleen de soorten die de reis heeft, dus een reis zonder ook maar één rondleiding heeft geen chip Rondleiding.',
  'help.guide.filter-bookings.tip.2':
    'Een filter dat nergens op past laat het tabblad leeg achter met Geen plaatsen gevonden. De formulering is die van de plekkenlijst; de betekenis is dezelfde.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Een boeking uit haar bevestiging lezen',
  'help.guide.import-booking-file.goal':
    'Laat TREK de boeking uit de mail of de PDF halen die de aanbieder stuurde, in plaats van haar opnieuw te typen.',
  'help.guide.import-booking-file.step.1':
    'Klik in de werkbalk op Importeren vanuit bestand. Boekingsbevestigingen importeren gaat open.',
  'help.guide.import-booking-file.step.2':
    'Laat de bevestigingen op het vak vallen, of klik erop en kies ze: EML, PDF, PKPass, HTML en TXT, tot vijf bestanden van elk 10 MB. Die je koos staan met naam op het vak.',
  'help.guide.import-booking-file.step.3':
    'Klik op Importeren. Het venster sluit meteen, want het lezen gebeurt op de achtergrond.',
  'help.guide.import-booking-file.step.4':
    'Een kaart rechtsonder doet verslag van de uitvoering onder de naam van het bestand, en die volgt je door de app en door een herlaadbeurt heen. Bestanden verwerken… wordt een vinkje als het lezen klaar is, en de kaart biedt Importeren aan. Klik erop.',
  'help.guide.import-booking-file.result':
    'De boeking is een kaart in In behandeling met haar nachten, haar code en de bevestiging onder Bestanden, het verblijf staat op die dagen van het plan, en met Onkosten aan is de prijs een uitgave die eraan hangt.',
  'help.guide.import-booking-file.tip.1':
    'Importeren vanuit bestand is er alleen als de server bevestigingen kan lezen, en dat vraagt ofwel de uitlezer ofwel de add-on AI-analyse. Die laatste zet de beheerder onder Add-ons om.',
  'help.guide.import-booking-file.tip.2':
    'Als er niets gelezen kon worden zegt de kaart dat en biedt ze Try AI parsing aan, dat dezelfde bestanden rechtstreeks naar het model stuurt. Een afgeronde verwerking wordt tien minuten bewaard; start de controle binnen dat venster.',
  'help.guide.import-booking-file.tip.3':
    'De bevestiging wordt alleen bijgevoegd als haar type bij de Toegestane bestandstypen van de beheerinstellingen staat. PDF staat er standaard; een mail, EML, moet eerst worden toegevoegd, anders wordt de boeking zonder opgeslagen.',
  // edit-booking
  'help.guide.edit-booking.title': 'Een boeking wijzigen',
  'help.guide.edit-booking.goal':
    'Corrigeer een tijd, voeg de code toe die later aankwam, of haal een boeking van In behandeling naar Bevestigd.',
  'help.guide.edit-booking.step.1':
    'Klik op het potlood in de kop van de kaart. Reservering bewerken gaat open met alles wat de boeking weet.',
  'help.guide.edit-booking.step.2':
    'Wijzig wat gewijzigd moet worden, hier de Boekingscode die de aanbieder eindelijk stuurde.',
  'help.guide.edit-booking.step.3': 'Zet Status op Bevestigd.',
  'help.guide.edit-booking.step.4': 'Klik op Bijwerken.',
  'help.guide.edit-booking.result':
    'De kaart verhuist: een bevestigde boeking staat in de sectie Bevestigd achter een groene stip, en iedereen in de reis ziet haar verhuizen.',
  'help.guide.edit-booking.tip.1':
    'Een Boekingscode die je niet kunt lezen is Boekingscodes vervagen in Instellingen, onder Weergave. Ga er met de muis overheen, of klik erop, en hij is leesbaar.',
  'help.guide.edit-booking.tip.2':
    'Wijzig het type en de categorie van een gekoppelde kostenpost gaat mee, tenzij je in de Kosten-editor met de hand een categorie had gekozen.',
  'help.guide.edit-booking.tip.3':
    'Een accommodatie wordt hier ook bewerkt: haar dagen Van en Tot staan in hetzelfde formulier.',
  // delete-booking
  'help.guide.delete-booking.title': 'Een boeking verwijderen',
  'help.guide.delete-booking.goal': 'Haal een boeking die niet doorging uit de reis.',
  'help.guide.delete-booking.step.1': 'Klik op de prullenbak in de kop van de kaart.',
  'help.guide.delete-booking.step.2':
    'Boeking verwijderen? noemt degene die je koos en zegt dat ze permanent verwijderd wordt.',
  'help.guide.delete-booking.step.3': 'Klik op Bevestigen.',
  'help.guide.delete-booking.result':
    'De kaart is weg, voor iedereen in de reis. Een boeking heeft geen ongedaan maken, dus de vraag is de laatste halte.',
  'help.guide.delete-booking.tip.1':
    'Een accommodatieboeking verwijderen haalt ook haar nachten uit het Dagplan en verwijdert de kostenpost die eraan gekoppeld was.',
  'help.guide.delete-booking.tip.2':
    'Documenten die bijgevoegd waren blijven in het tabblad Bestanden van de reis; alleen hun koppeling met de boeking gaat weg.',
  // import-booking-file
  'help.guide.import-booking-file.step.5':
    'Elke boeking die is gevonden opent in Nieuwe reservering, de een na de ander, al ingevuld. Voor een hotel is dat de naam in Titel en, als de reis de plek heeft, onder Accommodatie, zijn Locatie / Adres, Van en Tot op zijn nachten, Inchecken en Uitchecken, de Boekingscode, de bevestiging onder Bestanden en, met Onkosten aan, de prijs als Gekoppelde kostenpost. Kijk het na en klik op Toevoegen.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Onkosten',
  'help.ctx.trip-costs.summary':
    'Het geld van de reis: elke uitgave in een gedateerd overzicht, wie hem heeft voorgeschoten en wie ervoor verschuldigd is, in de valuta van het bonnetje, en, in de rechterkolom, wie wie moet betalen om het weer gelijk te trekken.',
  'help.ctx.trip-costs.bullet.1':
    'Vier kaarten bovenaan: Jij bent verschuldigd en Jij krijgt nog zijn jouw eigen kant van de afrekening, Openstaand bedrag is wat is vastgelegd maar nog geen betaler heeft, en Totale reisuitgaven telt alles op, met Jouw aandeel en Jij hebt betaald eronder.',
  'help.ctx.trip-costs.bullet.2':
    'Uitgave toevoegen rechtsboven opent de editor; Afrekenen ernaast legt alle openstaande overboekingen in één keer vast.',
  'help.ctx.trip-costs.bullet.3':
    'Het overzicht is per dag gegroepeerd, het nieuwste eerst, met het totaal van die dag rechts. Een rij draagt de categorie als gekleurd tabblad, de naam, de betalerschips, de notitie en het bedrag, plus je hebt voorgeschoten of je hebt geleend wanneer de verdeling je op die uitgave omhoog of omlaag brengt.',
  'help.ctx.trip-costs.bullet.4':
    'Boven de lijst zitten Uitgaven zoeken…, een categoriefilter, een dagfilter, de schakelaar Alles / Door mij betaald / Mij verschuldigd en de knop CSV exporteren.',
  'help.ctx.trip-costs.bullet.5':
    'De rechterkolom is het antwoord: Afrekenen somt op wie wie betaalt, Saldi toont het overschot of tekort van elke reiziger, Eindbudget wat de reis elk van hen kost, en Per categorie waar het geld heen is gegaan.',
  'help.ctx.trip-costs.bullet.6':
    'Een vastgelegde betaling staat in hetzelfde overzicht als een eigen rij, met Bewerken en Ongedaan maken ernaast; een uitgave heeft een potlood en een prullenbak, en de prullenbak verwijdert hem zonder te vragen.',
  // add-expense
  'help.guide.add-expense.title': 'Een uitgave toevoegen',
  'help.guide.add-expense.goal': 'Leg vast wat iets heeft gekost, wie het heeft betaald en met wie het wordt gedeeld.',
  'help.guide.add-expense.step.1':
    'Klik rechtsboven op het tabblad Onkosten op Uitgave toevoegen. De editor gaat open, met de datum van vandaag en met iedereen al in de verdeling.',
  'help.guide.add-expense.step.2':
    'Typ waar het voor was in Waar was het voor?, het enige veld dat ingevuld moet worden, en het bedrag van het bonnetje in Totaalbedrag.',
  'help.guide.add-expense.step.3':
    'Valuta en Dag zitten onder het bedrag. Valuta begint op die van de reis; verander hem en de editor toont wat het bedrag waard is in de valuta van de reis. Dag begint op vandaag en is de dag waaronder het overzicht de uitgave groepeert.',
  'help.guide.add-expense.step.4':
    'Kies een Categorie. Er zijn er veertien en ze kunnen niet gewijzigd worden: de gekozen categorie is het gekleurde tabblad op de rij en de balk in Per categorie.',
  'help.guide.add-expense.step.5':
    'Kies onder Wie heeft betaald? de persoon die het geld werkelijk heeft voorgeschoten. Jij staat voorgeselecteerd; Nog niemand heeft betaald legt het bedrag vast zonder dat iemand ervoor verschuldigd is, en Meerdere personen hebben betaald verdeelt de rekening over meerdere betalers.',
  'help.guide.add-expense.step.6':
    'Split begint op Equally met iedereen erbij, en bij elke naam staat het aandeel dat eruit komt. Klik op Uitgave toevoegen om op te slaan.',
  'help.guide.add-expense.result':
    'De uitgave staat in het overzicht onder zijn dag, meegeteld in Totale reisuitgaven, en de afrekenkolom heeft opnieuw berekend wie wie verschuldigd is.',
  'help.guide.add-expense.tip.1':
    'Zoals hij opengaat, staat de uitgave in de valuta van de reis, met de datum van vandaag en gelijk verdeeld over iedereen: alleen de naam en het bedrag moeten echt worden ingevuld.',
  'help.guide.add-expense.tip.2':
    'De ± naast het bedrag maakt van de uitgave een terugbetaling. Een negatief totaal geeft geld terug in plaats van het te nemen, en de verdeling loopt de andere kant op.',
  'help.guide.add-expense.tip.3':
    'Bon / factuur bijvoegen onderaan neemt afbeeldingen en PDF-bestanden. Ze worden geüpload als je opslaat, komen in de Bestanden van de reis terecht, en naast de naam in de lijst verschijnt een chip Bonnetjes.',
  // expense-payers
  'help.guide.expense-payers.title': 'Zeggen wie de rekening heeft betaald',
  'help.guide.expense-payers.goal': 'Leg vast wie een uitgave heeft voorgeschoten, de andere helft van de afrekensom.',
  'help.guide.expense-payers.step.1':
    'Open een uitgave met het potlood naast zijn rij en kijk naar Wie heeft betaald?. Eén persoon heeft betaald is de standaard: het uitklapmenu noemt de ene persoon die het geld heeft voorgeschoten.',
  'help.guide.expense-payers.step.2':
    'Nog niemand heeft betaald, de eerste vermelding van dat uitklapmenu, legt het bedrag vast zonder dat iemand iets verschuldigd is. De uitgave telt toch mee in Totale reisuitgaven.',
  'help.guide.expense-payers.step.3':
    'Meerdere personen hebben betaald, de link naast het label, opent een rij per reiziger. Voeg degenen toe die hebben betaald en typ wat ieder van hen heeft ingelegd; de bedragen moeten samen optellen tot het totaal.',
  'help.guide.expense-payers.step.4':
    'Een uitgave die niemand heeft betaald, krijgt op zijn rij de markering Onvoltooid en wordt meegeteld in de kaart Openstaand bedrag, waar vastgelegde maar niet afgerekende uitgaven samenkomen.',
  'help.guide.expense-payers.result':
    'Wie heeft betaald bepaalt wie terugkrijgt, de verdeling bepaalt wie betaalt, en Saldi is het verschil tussen die twee.',
  'help.guide.expense-payers.tip.1':
    'Wie heeft betaald? en Split staan los van elkaar: je kunt een diner betalen waar je niet bij was, en meegeteld worden in de verdeling van een diner dat je niet hebt betaald.',
  'help.guide.expense-payers.tip.2':
    'Met meerdere betalers moeten de bedragen optellen tot het totaal. Voeg er nog een toe en de anderen schikken zich eromheen; zolang ze niet kloppen, zegt de editor waartoe ze moeten optellen en slaat niet op.',
  'help.guide.expense-payers.tip.3':
    'Een betaler verwijderen verwijdert de uitgave niet: het bedrag blijft in Totale reisuitgaven en de rij wordt Onvoltooid.',
  // split-expense
  'help.guide.split-expense.title': 'Een rekening over de reizigers verdelen',
  'help.guide.split-expense.goal':
    'Bepaal wie voor een uitgave verschuldigd is: iedereen gelijk, per bedrag, of regel voor regel van het bonnetje.',
  'help.guide.split-expense.step.1':
    'In de uitgave-editor somt Split elke reiziger op. Klik op een naam om hem buiten deze uitgave te laten; een uitgesloten reiziger toont Niet inbegrepen en is er niets voor verschuldigd.',
  'help.guide.split-expense.step.2':
    'Equally is de standaard: elke opgenomen reiziger krijgt hetzelfde aandeel, en de regel onder de lijst zegt over hoeveel het wordt verdeeld en op hoeveel elk aandeel uitkomt.',
  'help.guide.split-expense.step.3':
    'Custom vervangt de aandelen door bedragvelden. Typ wat elke reiziger verschuldigd is; de regel eronder telt mee en wordt groen bij Verdeling klopt met het totaal. Er wordt niet opgeslagen zolang het niet klopt.',
  'help.guide.split-expense.step.4':
    'Ticket verdeelt het bonnetje regel voor regel: Item toevoegen, dan per regel een naam en een prijs, en onder Verdeeld over: de reizigers die die regel delen.',
  'help.guide.split-expense.step.5':
    'Aandeel per persoon onder de regels toont wat elke reiziger uiteindelijk verschuldigd is, en Totaalbedrag bovenaan wordt uit de regels opgeteld. Klik op Opslaan.',
  'help.guide.split-expense.result':
    'De verdeling is waaruit elk saldo wordt opgebouwd. Ze wordt met de uitgave opgeslagen en kan later worden gewijzigd zonder iets anders aan te raken.',
  'help.guide.split-expense.tip.1':
    'Een reiziger die je eruit laat toont Niet inbegrepen en is niets verschuldigd voor deze ene uitgave; de anderen nemen zijn aandeel over.',
  'help.guide.split-expense.tip.2':
    'Equally klopt tot op de cent: de overgebleven cent rouleert van uitgave naar uitgave, zodat niet altijd dezelfde hem betaalt.',
  'help.guide.split-expense.tip.3':
    'De modus Ticket telt Totaalbedrag zelf op en maakt het veld grijs: de regels van het bonnetje zijn het totaal.',
  // expense-currency
  'help.guide.expense-currency.title': 'Een uitgave in een andere valuta invoeren',
  'help.guide.expense-currency.goal': 'Voer in wat er echt op het bonnetje staat en laat TREK de koers vasthouden.',
  'help.guide.expense-currency.step.1':
    'Open Uitgave toevoegen en vul de naam en het bedrag precies in zoals het bonnetje het zegt, het getal zelf en niet een omrekening ervan.',
  'help.guide.expense-currency.step.2':
    'Open Valuta en kies de valuta van het bonnetje. De lijst bevat elke code die TREK kent en is doorzoekbaar: typ de drie letters.',
  'help.guide.expense-currency.step.3':
    'Onder de velden verschijnt een regel met wat het bedrag op dit moment waard is, gemarkeerd met live koers. Het is een voorbeeld, niet wat wordt opgeslagen.',
  'help.guide.expense-currency.step.4':
    'Klik op Uitgave toevoegen. De koers wordt ter plekke vastgezet: vanaf nu is deze uitgave waard wat hij waard was op de dag dat je hem invoerde.',
  'help.guide.expense-currency.step.5':
    'In het overzicht draagt de rij beide getallen onder de naam: wat je hebt getypt, een pijl, en waarvoor het meetelt in de valuta van de reis. Elk totaal, elk saldo en elke afrekening hierboven gebruikt het tweede.',
  'help.guide.expense-currency.result':
    'De uitgave houdt het bedrag en de valuta die je hebt getypt. Het overzicht toont beide, en de totalen en saldi van de reis blijven in de valuta van de reis.',
  'help.guide.expense-currency.tip.1':
    'De koers wordt vastgezet op het moment dat je opslaat, zodat een afgerekende schuld niet opnieuw opengaat omdat de markt een week later bewoog. Alleen het wijzigen van de valuta van de uitgave zet een nieuwe vast.',
  'help.guide.expense-currency.tip.2':
    'Weergavevaluta in Instellingen verandert alleen wat je leest; de opgeslagen bedragen bewegen nooit. Leeg gelaten wordt elke reis in zijn eigen valuta getoond.',
  'help.guide.expense-currency.tip.3':
    'De valuta van de reis zelf zit op de reis, onder Reis bewerken, en vraagt het recht Reisdetails bewerken. Hem wijzigen verankert elke vastgezette koers opnieuw in plaats van de bedragen om te rekenen naar een nieuwe munt.',
  // filter-costs
  'help.guide.filter-costs.title': 'Een uitgave vinden, of de uitgaven van één dag',
  'help.guide.filter-costs.goal': 'Beperk een lang overzicht tot wat je echt zoekt.',
  'help.guide.filter-costs.step.1':
    'Typ in Uitgaven zoeken… boven de lijst. Het zoekt in de naam van de uitgave terwijl je typt.',
  'help.guide.filter-costs.step.2':
    'Alle categorieën opent de veertien categorieën. Kies er een en alleen de uitgaven van die categorie blijven over.',
  'help.guide.filter-costs.step.3':
    'Alle dagen somt elke dag op waarop iets is uitgegeven. Kies er een en een banner vervangt de dagkoppen door die dag, hoeveel uitgaven hij bevat en zijn totaal.',
  'help.guide.filter-costs.step.4':
    'De schakelaar Alles / Door mij betaald / Mij verschuldigd is jouw eigen blik op het overzicht: waarvoor jij geld hebt voorgeschoten, en waarvoor je nog altijd uit eigen zak zit.',
  'help.guide.filter-costs.step.5':
    'CSV exporteren aan het eind van de rij schrijft elke uitgave naar een bestand, met het oorspronkelijke bedrag, zijn valuta en het omgerekende bedrag.',
  'help.guide.filter-costs.result':
    'De filters werken samen, en de daggroepen tekenen zich opnieuw met hun eigen totalen voor wat overblijft.',
  'help.guide.filter-costs.tip.1':
    'Vastgelegde betalingen hebben geen naam en geen categorie, dus een zoekopdracht of een categoriefilter verbergt ze. Het dagfilter houdt ze, onder de dag waarop de betaling is vastgelegd.',
  'help.guide.filter-costs.tip.2':
    'CSV exporteren exporteert altijd elke uitgave, wat er ook op het scherm gefilterd is, één rij per uitgave.',
  // settle-up
  'help.guide.settle-up.title': 'Uitzoeken wie wie verschuldigd is, en het afrekenen',
  'help.guide.settle-up.goal':
    'Maak van een stapel gedeelde uitgaven het kleinste aantal overboekingen dat iedereen gelijk zet, en leg ze vast zodra ze gebeuren.',
  'help.guide.settle-up.step.1':
    'De kaart Afrekenen in de rechterkolom somt de overboekingen op die iedereen gelijk zouden zetten: wie wie betaalt, en hoeveel. Het getal naast de titel is hoeveel er nog openstaan.',
  'help.guide.settle-up.step.2':
    'Afrekenen naast een overboeking legt hem als gedaan vast. De stroom verdwijnt van de kaart en de saldi tekenen zich opnieuw.',
  'help.guide.settle-up.step.3':
    'De vastgelegde overboeking is een rij in het overzicht, onder de dag waarop hij plaatsvond, gemarkeerd als Betaling met de twee reizigers en het bedrag.',
  'help.guide.settle-up.step.4':
    'Naast die rij corrigeert het potlood een betaling en Ongedaan maken neemt hem terug, en de overboeking keert terug naar de kaart Afrekenen.',
  'help.guide.settle-up.step.5':
    'Betaling toevoegen in de kop van de kaart legt een overboeking vast die geen suggestie volgde. Kies Van en Aan, het Bedrag, de valuta ervan en de dag waarop hij plaatsvond.',
  'help.guide.settle-up.step.6':
    'Afrekenen in de kop bovenaan het scherm legt alle openstaande overboekingen in één keer vast, zoals een groep aan het eind van een reis alles gelijktrekt.',
  'help.guide.settle-up.result':
    'Elke vastgelegde overboeking is een rij in het overzicht en een regel minder op de kaart Afrekenen. Als de kaart Iedereen is quitte toont, is de reis betaald.',
  'help.guide.settle-up.tip.1':
    'De kaart toont het kleinste aantal overboekingen, niet elke schuld: drie mensen die elkaar in een kring verschuldigd zijn, vallen samen tot een of twee betalingen.',
  'help.guide.settle-up.tip.2':
    'Afrekenen legt een overboeking vast, het verplaatst geen geld. Stuur hem via het middel dat je gebruikt en klik er daarna op.',
  'help.guide.settle-up.tip.3':
    'Een betaling kan in elke valuta gebeuren, dus een schuld in yen in euro betalen is normaal: het dialoogvenster heeft zijn eigen valutakiezer en zet ook die koers vast.',
  // final-budget
  'help.guide.final-budget.title': 'Zien wat de reis elke reiziger heeft gekost',
  'help.guide.final-budget.goal':
    'Lees de kant per persoon van het overzicht: het saldo van vandaag, en de echte kosten per persoon.',
  'help.guide.final-budget.step.1':
    'Saldi toont de positie van elke reiziger: een groene balk naar rechts als de reis hem iets verschuldigd is, een rode balk naar links als hij de reis iets verschuldigd is, en het bedrag naast de naam.',
  'help.guide.final-budget.step.2':
    'Eindbudget daaronder beantwoordt een andere vraag: niet wie op dit moment wat verschuldigd is, maar wat de reis elke reiziger kost zodra alles is terugbetaald.',
  'help.guide.final-budget.step.3':
    'Klik op een naam om de rekensom te openen: Betaalde uitgaven, daaronder Terugbetalingen netto en Openstaande terugbetalingen.',
  'help.guide.final-budget.step.4':
    'Onder elke regel zitten de rijen waaruit hij bestaat: de uitgaven die die reiziger heeft betaald, de al vastgelegde overboekingen en de nog openstaande. Samen zijn ze precies de regel erboven.',
  'help.guide.final-budget.result':
    'Saldi is wie er vandaag boven of onder zit; Eindbudget is wat de reis uiteindelijk elk van jullie kost zodra alles is terugbetaald.',
  'help.guide.final-budget.tip.1':
    'Een betaling vastleggen verandert niemands eindbudget. Het verplaatst alleen een bedrag van de openstaande terugbetalingen naar de terugbetalingen netto.',
  'help.guide.final-budget.tip.2':
    'Een uitgave zonder betaler blijft buiten beide kaarten, net zoals hij buiten de afrekensuggesties blijft.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Van een boeking een uitgave maken',
  'help.guide.expense-from-booking.goal':
    'Hang wat een vlucht, een hotel of een plek echt heeft gekost aan het item waar het bij hoort.',
  'help.guide.expense-from-booking.step.1':
    'Open de boeking op het tabblad Transport of Boekingen en klik op zijn potlood.',
  'help.guide.expense-from-booking.step.2':
    'Scroll naar het blok Kosten onderaan het formulier. Het biedt Kostenpost aanmaken aan, dat eerst de boeking opslaat, en Bestaande kostenpost koppelen voor een post die al in Onkosten staat.',
  'help.guide.expense-from-booking.step.3':
    'Klik op Kostenpost aanmaken. De boeking wordt opgeslagen, het formulier gaat dicht, en de Onkosteneditor gaat open met de titel van de boeking als naam en zijn type al gekoppeld aan een categorie.',
  'help.guide.expense-from-booking.step.4':
    'Vul het bedrag en de valuta ervan, wie heeft betaald en de verdeling in zoals bij elke uitgave, en sla op. Als je de boeking opnieuw opent, staat hij onder Gekoppelde kostenposten, met een potlood om hem te bewerken, Ontkoppelen, kostenpost behouden om hem los te maken en een prullenbak om hem te verwijderen.',
  'help.guide.expense-from-booking.result':
    'De boeking draagt zijn kosten, en de uitgave is een gewone rij op het tabblad Onkosten, met een betaler, een verdeling en een valuta zoals elke andere.',
  'help.guide.expense-from-booking.tip.1':
    'De boeking verwijderen verwijdert ook zijn gekoppelde kostenposten. Kostenpost verwijderen in het blok Kosten van de boeking doet het omgekeerde: de kostenpost gaat weg, de boeking blijft. Ontkoppelen, kostenpost behouden houdt ze allebei.',
  'help.guide.expense-from-booking.tip.2':
    'Een plek heeft hetzelfde blok in zijn formulier, waar Kostenpost aanmaken eerst de plek opslaat.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transport',
  'help.ctx.trip-transports.summary':
    'Alles wat je tussen de stops vervoert: vluchten, treinen, bussen, auto’s, taxi’s, fietsen, cruises, veerboten en de verbindingen met openbaar vervoer die TREK voor je opzoekt. Het tabblad is de lijst ervan; ze worden ook in het plan gemaakt en gelezen, en op de kaart getekend.',
  'help.ctx.trip-transports.bullet.1':
    'Het tabblad houdt alleen de ritten. Accommodatie, restaurants, evenementen en tickets wonen onder Boekingen, zodat dezelfde vermelding nooit twee keer opduikt.',
  'help.ctx.trip-transports.bullet.2':
    'De werkbalk telt ze allemaal onder Alles en geeft elk gebruikt type een eigen chip met een eigen aantal, Vlucht, Trein, Auto, Openbaar vervoer. Vervoer rechts voegt er met de hand een toe.',
  'help.ctx.trip-transports.bullet.3':
    'De kaarten komen in drie groepen, elk inklapbaar via de kop: Automatisch openbaar vervoer voor de verbindingen die het zoeken plande, dan In behandeling, dan Bevestigd.',
  'help.ctx.trip-transports.bullet.4':
    'Een kaart draagt de status, het type, de dagen die hij beslaat, de tijden, de Boekingscode, de route en de Luchtvaartmaatschappij met het Vluchtnr., of het Treinnr., het Perron en de Stoel. Het potlood opent hem, de prullenbak verwijdert hem na een vraag.',
  'help.ctx.trip-transports.bullet.5':
    'Vervoer ontstaat ook in het plan: elke dagkop heeft een plus voor Vervoer toevoegen en een tramknop voor Openbaar vervoer, en de reistijdverbinding tussen twee stops opent hetzelfde zoeken voor dat ene traject.',
  'help.ctx.trip-transports.bullet.6':
    'Een transport met beide uiteinden gezet tekent een lijn op de kaart. Het route-icoon op zijn rij in het dagplan zet die lijn aan, en Alle boekingsroutes tonen in de balk boven de dagen schakelt de hele reis om.',
  // transports-list
  'help.guide.transports-list.title': 'Het tabblad Transport lezen',
  'help.guide.transports-list.goal': 'Weten wat de lijst je vertelt voordat je er iets aan verandert.',
  'help.guide.transports-list.step.1':
    'Transport is het tweede tabblad van de reis. Het houdt alleen de ritten: hotels, restaurants, evenementen en tickets staan onder Boekingen.',
  'help.guide.transports-list.step.2':
    'De werkbalk telt elk transport onder Alles en geeft elk gebruikt type een eigen chip met een eigen aantal. Klik op een chip om alleen dat type te houden, klik er nog eens op om hem los te laten. Meerdere chips kunnen tegelijk aan staan, en Alles ruimt ze op.',
  'help.guide.transports-list.step.3':
    'Automatisch openbaar vervoer is een eigen groep, de verbindingen die het ov-zoeken plande. In behandeling en Bevestigd houden alles wat met de hand is ingevoerd. De pijl naast een kop klapt een groep weg.',
  'help.guide.transports-list.step.4':
    'Een kaart zegt het allemaal: de statusstip met In behandeling of Bevestigd, het type, de dagen die hij beslaat met hun datums, de tijden, de Boekingscode, de route, en de Luchtvaartmaatschappij met het Vluchtnr., of het Treinnr., het Perron en de Stoel.',
  'help.guide.transports-list.step.5':
    'Het potlood opent het transport om te bewerken, de prullenbak verwijdert het, na een vraag die noemt wat er weggaat.',
  'help.guide.transports-list.result':
    'De lijst is ingeperkt tot waar je naar zocht, en elke kaart zegt in één oogopslag of de rit geboekt is.',
  'help.guide.transports-list.tip.1':
    'De chips en de ingeklapte groepen worden per reis onthouden, dus het tabblad gaat weer open zoals je het achterliet.',
  'help.guide.transports-list.tip.2':
    'Importeren vanuit bestand en AirTrail voegen zich alleen bij Vervoer in de werkbalk wanneer de server boekingsbevestigingen kan lezen en wanneer er een AirTrail-instantie verbonden is. Zonder die twee vult de lijst zich met de hand en via het ov-zoeken.',
  // add-transport
  'help.guide.add-transport.title': 'Vervoer aan een dag toevoegen',
  'help.guide.add-transport.goal':
    'Zet de rit die je van de ene stop naar de volgende brengt in de dag waarop hij plaatsvindt.',
  'help.guide.add-transport.step.1':
    'Elke dagkop draagt rechts vier kleine knoppen. Klik op de plus, waarvan de tooltip Vervoer toevoegen luidt. Het formulier gaat open met Datum al op die dag gezet.',
  'help.guide.add-transport.step.2':
    'Boekingstype kiest wat je neemt: Vlucht, Trein, Bus, Auto, Taxi, Fiets, Cruise, Veerboot of Overig. Het formulier volgt. Een vlucht krijgt op elk traject een luchthaven, een trein een keten van stations, een auto de woorden Ophalen en Inleveren en Stops onderweg.',
  'help.guide.add-transport.step.3':
    'Titel is het enige veld dat ingevuld moet zijn; Toevoegen blijft zonder titel grijs. Schrijf op wat je op een vertrekbord zou herkennen.',
  'help.guide.add-transport.step.4':
    'Van en Naar zoeken een station, een haven of een adres. Typ minstens drie letters en kies een resultaat uit de lijst. Een naam die alleen getypt is draagt geen coördinaten en tekent dus niets op de kaart.',
  'help.guide.add-transport.step.5':
    'Datum en Starttijd zeggen wanneer hij rijdt, Einddatum en Eindtijd wanneer hij voorbij is; een rit die de volgende dag aankomt neemt daar de volgende dag. Boekingscode, Status met In behandeling of Bevestigd, en Notities zijn optioneel.',
  'help.guide.add-transport.step.6': 'Klik op Toevoegen.',
  'help.guide.add-transport.result':
    'Het transport is een rij op de dag, op zijn tijd tussen de stops, en een kaart in het tabblad Transport onder In behandeling of Bevestigd.',
  'help.guide.add-transport.tip.1':
    'De rij belandt waar zijn starttijd hem zet, na de laatste stop die eerder begint. Zijn greep sleept hem overal anders in de dag naartoe, of naar een andere dag.',
  'help.guide.add-transport.tip.2':
    'Bestand bijvoegen onder Bestanden neemt het ticket, en Kostenpost aanmaken onder Kosten bewaart de boeking en opent de Onkosten-editor voor de prijs.',
  'help.guide.add-transport.tip.3':
    'Reizigers markeert wie er mee gaat op deze rit. Zodra één transport reizigers heeft, laat de werkbalk van het tabblad hun avatars groeien en filtert hij de lijst erop.',
  // plan-transit
  'help.guide.plan-transit.title': 'Een ov-verbinding plannen',
  'help.guide.plan-transit.goal':
    'Laat TREK de echte treinen en bussen tussen twee punten van een dag opzoeken en zet die je kiest in het plan.',
  'help.guide.plan-transit.step.1':
    'Klik in de dagkop op de tramknop, Openbaar vervoer. Het zoeken gaat open voor die dag.',
  'help.guide.plan-transit.step.2':
    'Van en Naar nemen een halte of een station. Zolang het veld leeg is worden de eigen stops van de dag en de accommodaties van de reis aangeboden; vanaf twee letters worden in plaats daarvan de stations van de dienstregeling doorzocht. Wisselen tussen de twee velden draait de verbinding om.',
  'help.guide.plan-transit.step.3':
    'Vertrek of Aankomst met een tijd zegt wanneer je wilt reizen, en Beste route, Minder overstappen of Minder lopen zegt hoe de antwoorden geordend moeten worden.',
  'help.guide.plan-transit.step.4':
    'De chips eronder zeggen welke vervoerswijzen gebruikt mogen worden: Trein, Metro, Tram, Bus, Veerboot en Kabelbaan. Zet er een uit om hem weg te laten, minstens één blijft aan. Klik dan op Zoeken.',
  'help.guide.plan-transit.step.5':
    'Elk resultaat geeft vertrek en aankomst, hoe lang het duurt, hoeveel keer overstappen en hoeveel lopen, en de lijnen in hun eigen kleuren. Klik er een aan om hem halte voor halte uit te klappen, met de perrons en de stukken lopen tussen de lijnen.',
  'help.guide.plan-transit.step.6': 'Klik op Toevoegen aan dag.',
  'help.guide.plan-transit.result':
    'De verbinding is een rij op de dag met haar lijnen, haar overstappen en haar looptijd, en een kaart in het tabblad Transport onder Automatisch openbaar vervoer.',
  'help.guide.plan-transit.tip.1':
    'De verbindingen komen van Transitous, een vrije gemeenschapsdienst op publieke dienstregelingsdata: geen sleutel, geen account. Een beheerder kan het zoeken in plaats daarvan op Google richten.',
  'help.guide.plan-transit.tip.2':
    'Niets gevonden? De feeds dekken een regio en een periode. Probeer een andere tijd, zet meer vervoerswijzen aan, of kies een station in plaats van de plek zelf. Het bericht noemt de dienst die antwoordde.',
  'help.guide.plan-transit.tip.3':
    'Hetzelfde zoeken gaat open voor één traject: klik op de reistijdverbinding tussen twee stops en kies Openbaar vervoer. Van, Naar en de vertrektijd zijn al voor je ingevuld.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Een geplande verbinding openen en wijzigen',
  'help.guide.change-transit-route.goal':
    'De verbinding halte voor halte lezen, hernoemen, of de route opnieuw laten opzoeken.',
  'help.guide.change-transit-route.step.1':
    'In het tabblad Transport zitten de geplande verbindingen onder Automatisch openbaar vervoer. Klik op de kaart.',
  'help.guide.change-transit-route.step.2':
    'Duur, Overstappen en Lopen staan bovenaan. Reisplan daaronder loopt de verbinding halte voor halte door, met de perrons en de stukken lopen tussen de lijnen.',
  'help.guide.change-transit-route.step.3':
    'Route wijzigen draait het zoeken opnieuw, al gevuld met de twee uiteinden van deze verbinding en met haar dag.',
  'help.guide.change-transit-route.step.4':
    'Kies een andere verbinding en klik op Toevoegen aan dag; die neemt de plaats van de oude in. Details bewerken, naast Route wijzigen, opent in plaats daarvan het gewone vervoersformulier, waar de Boekingscode, de Status, de reizigers en de bestanden wonen.',
  'help.guide.change-transit-route.result':
    'De ov-reis draagt het nieuwe reisplan, en haar kaart in het tabblad Transport toont de nieuwe lijnen en tijden.',
  'help.guide.change-transit-route.tip.1':
    'De titel van de ov-reis is alleen tekst: het potlood ernaast hernoemt hem zonder de route aan te raken. Notities eronder nemen markdown en hebben een tabblad Bewerken en een tabblad Voorbeeld.',
  'help.guide.change-transit-route.tip.2':
    'Verwijderen onderaan de ov-reis haalt de verbinding uit de reis; de dag houdt zijn stops.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Wijzigen hoe één traject wordt afgelegd',
  'help.guide.leg-travel-mode.goal':
    'Eén traject van een dag die verder met de auto gaat te voet doen, of dat traject aan het ov-zoeken overlaten.',
  'help.guide.leg-travel-mode.step.1':
    'De verbindingsstukken tussen de stops verschijnen pas als de route van de dag aan staat. Klik op de dag om hem te openen, dan op Route onder zijn stops.',
  'help.guide.leg-travel-mode.step.2':
    'Elk verbindingsstuk noemt de reistijd en de afstand van dat traject, met het icoon van de wijze waarin het berekend is: een auto voor rijden, een voet voor lopen.',
  'help.guide.leg-travel-mode.step.3':
    'Klik op het verbindingsstuk. Het menu biedt Auto en Lopen, Openbaar vervoer, en Dagstandaard gebruiken.',
  'help.guide.leg-travel-mode.step.4':
    'Kies Lopen. Alleen dit traject verandert; de rest van de dag houdt zijn eigen wijze.',
  'help.guide.leg-travel-mode.result':
    'Het traject toont het voeticoon en zijn looptijd, en de andere trajecten van de dag houden de wijze van de dag.',
  'help.guide.leg-travel-mode.tip.1':
    'De wijze hoort bij het traject, niet bij de dag: de knoppen Auto en Lopen van de hele dag overschrijven nooit een traject dat je met de hand hebt gezet. Dagstandaard gebruiken geeft het traject aan hen terug.',
  'help.guide.leg-travel-mode.tip.2':
    'Openbaar vervoer in hetzelfde menu opent het verbindingszoeken voor precies dit traject, met beide uiteinden en de vertrektijd al ingevuld.',
  'help.guide.leg-travel-mode.tip.3':
    'De tijden komen van een publieke router over echte wegen en voetpaden. Een traject dat hij niet kan beantwoorden houdt zijn rechte lijn en toont geen tijd.',
  // edit-transport
  'help.guide.edit-transport.title': 'Vervoer wijzigen of verwijderen',
  'help.guide.edit-transport.goal':
    'Een tijd, een perron of een boekingscode rechtzetten, of de rit uit de reis halen.',
  'help.guide.edit-transport.step.1': 'In het dagplan is een transport een gekleurde rij tussen de stops. Klik erop.',
  'help.guide.edit-transport.step.2':
    'Het formulier is hetzelfde dat het aanmaakte, met Vervoer bewerken in de titelbalk. Alles kan veranderen: het type, de route, de dagen en tijden, de Boekingscode, de Status.',
  'help.guide.edit-transport.step.3':
    'De route van een vlucht is een keten van luchthavens, die van een trein een keten van stations. Tussenstop toevoegen zet er nog een tussenin, en elk traject houdt zijn eigen tijden en zijn eigen vlucht- of treinnummer.',
  'help.guide.edit-transport.step.4':
    'Klik op Bijwerken. Om het transport helemaal weg te halen, gebruik je de prullenbak op zijn kaart in het tabblad Transport en bevestig je.',
  'help.guide.edit-transport.result':
    'De wijziging is overal te zien waar het transport voorkomt: het tabblad Transport, de dag waarop het rijdt, en zijn lijn op de kaart.',
  'help.guide.edit-transport.tip.1':
    'Hetzelfde formulier gaat van twee kanten open, via het potlood op de kaart in het tabblad Transport en via de eigen rij van het transport in het dagplan. Een geplande ov-verbinding is de uitzondering: haar rij opent de ov-reis, en Details bewerken leidt daar naar dit formulier.',
  'help.guide.edit-transport.tip.2':
    'Een transport naar een andere dag verplaatsen heeft het formulier helemaal niet nodig: sleep zijn rij van de ene dagkaart naar de volgende.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Vervoer op de kaart tekenen',
  'help.guide.transport-on-map.goal': 'Zien waar een vlucht, een autorit of een verbinding echt langsgaat.',
  'help.guide.transport-on-map.step.1':
    'Een transport met beide uiteinden gezet draagt een klein route-icoon op zijn rij in het dagplan. Klik erop; het label wordt Boekingsroutes verbergen.',
  'help.guide.transport-on-map.step.2':
    'De route wordt op de kaart getekend, met aan elk uiteinde een pilvormige markering die het icoon van het transport draagt.',
  'help.guide.transport-on-map.step.3':
    'Klik op een eindmarkering om de boeking te lezen zonder de kaart te verlaten: de tijden, de Luchtvaartmaatschappij en het Vluchtnr., de Boekingscode en het adres. Sluiten ruimt het blad op.',
  'help.guide.transport-on-map.step.4':
    'Het route-icoon in de balk boven de dagen doet de hele reis in één keer: Alle boekingsroutes tonen, en Alle boekingsroutes verbergen om ze weer op te ruimen.',
  'help.guide.transport-on-map.step.5':
    'Een geplande ov-verbinding heeft geen eigen icoon. Ze wordt getekend met de schakelaar Route van de dag, en daarom ruimt Alle boekingsroutes verbergen haar niet op zolang de route van die dag nog aan staat.',
  'help.guide.transport-on-map.result':
    'De routes liggen op de kaart met aan elk uiteinde een markering, en ze blijven daar tot je ze weer uitzet.',
  'help.guide.transport-on-map.tip.1':
    'Een vlucht, een cruise en een veerboot tekenen als een boog, een auto, een bus, een taxi en een fiets volgen de echte wegen, en een trein of een geplande verbinding loopt door de stations waar hij stopt.',
  'help.guide.transport-on-map.tip.2':
    'Een bevestigde boeking is een doorgetrokken lijn, een boeking in behandeling een gestippelde. De instelling Routelabels voor boekingen zet de luchthavencode of de stationsnaam in de eindmarkeringen.',
  'help.guide.transport-on-map.tip.3':
    'Alle boekingsroutes tonen is een schone lei, geen laag: het gooit weg wat de losse iconen hadden gezet, dus twee keer drukken laat je met alles aan of alles uit achter.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Een vlucht uit haar e-ticket lezen',
  'help.guide.import-transport-file.goal':
    'Laat TREK een vlucht, een trein of een veerboot uit het ticket halen dat de vervoerder stuurde, en kijk het na voor het wordt opgeslagen.',
  'help.guide.import-transport-file.step.1':
    'Klik op Importeren vanuit bestand in de werkbalk van het tabblad Transport, naast Vervoer. Boekingsbevestigingen importeren gaat open, hetzelfde venster als het tabblad Boekingen heeft.',
  'help.guide.import-transport-file.step.2':
    'Laat het ticket op het vak vallen, of klik erop en kies het: EML, PDF, PKPass, HTML en TXT, tot vijf bestanden van elk 10 MB. De bestanden die je koos staan met naam op het vak.',
  'help.guide.import-transport-file.step.3':
    'Klik op Importeren. Het venster sluit meteen; het lezen gebeurt op de achtergrond.',
  'help.guide.import-transport-file.step.4':
    'Een kaart rechtsonder doet verslag van de uitvoering onder de naam van het bestand. Bestanden verwerken… wordt een vinkje als het lezen klaar is, en de kaart biedt Importeren aan. Klik erop.',
  'help.guide.import-transport-file.step.5':
    'Een vlucht gaat open in Vervoer toevoegen, al ingevuld: Boekingstype op Vlucht, de luchtvaartmaatschappij en het vluchtnummer in Titel, beide luchthavens onder Route met Vertrek en Aankomst, hun tijden en hun tijdzones, Luchtvaartmaatschappij en Vluchtnr., de Boekingscode en het ticket onder Bestanden. Kijk het na en klik op Toevoegen.',
  'help.guide.import-transport-file.result':
    'De vlucht is een kaart in In behandeling op het tabblad Transport en een rij op de dag waarop hij vertrekt, met het ticket onder Bestanden, en met beide luchthavens bekend tekent hij zijn boog op de kaart.',
  'help.guide.import-transport-file.tip.1':
    'De twee tabbladen delen één import: een bestand dat een vlucht en een hotel bevat opent de vlucht in Vervoer toevoegen en het hotel in Nieuwe reservering, de een na de ander, vanuit welk tabblad je ook begon.',
  'help.guide.import-transport-file.tip.2':
    'Luchthavens worden op hun code geplaatst. Een station of een haven die het lezen niet kon vinden staat amberkleurig op de kaart; kies het met de hand onder Route voor je op Toevoegen klikt, anders tekent het transport niets op de kaart.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Vluchten importeren uit AirTrail',
  'help.guide.airtrail-import.goal':
    'Haal de vluchten die je al in AirTrail bijhoudt in één keer de reis in, en laat ze vanaf dan AirTrail volgen.',
  'help.guide.airtrail-import.step.1':
    'Met de add-on AirTrail aan en je instantie verbonden onder Integraties in Instellingen draagt de werkbalk van het tabblad Transport een knop AirTrail naast Vervoer. Klik erop.',
  'help.guide.airtrail-import.step.2':
    'Importeren uit AirTrail noemt de vluchten van je account in twee groepen. Tijdens deze reis bevat de vluchten die binnen de reis gedateerd zijn, al aangevinkt; Andere vluchten bevat de rest, niet aangevinkt. Een vlucht die al in de reis zit is grijs en gemarkeerd als Geïmporteerd.',
  'help.guide.airtrail-import.step.3':
    'Elke rij is een vinkvak met de luchtvaartmaatschappij en het vluchtnummer, de twee luchthavens en de datum. Klik op een rij om de vlucht mee te nemen of weg te laten; die onder Andere vluchten komen alleen mee als je ze aanvinkt.',
  'help.guide.airtrail-import.step.4':
    'Vluchten die op elkaar aansluiten, elk binnen een dag vertrekkend van de luchthaven waar de vorige landde, staan samen in een kader. Het vinkje eronder, Importeren als één vlucht met een tussenstop in die luchthaven, staat al aan: laat het aan voor één boeking met een tussenstop, of zet het uit om de segmenten als losse vluchten te importeren.',
  'help.guide.airtrail-import.step.5':
    'Klik op Importeren. De knop telt de aangevinkte vluchten, en de melding daarna zegt hoeveel er binnenkwamen.',
  'help.guide.airtrail-import.step.6':
    'De vluchten zijn kaarten onder Bevestigd, elk met een blauwe badge AirTrail naast zijn status, en rijen op de dagen waarop ze gaan. Een samengevoegde verbinding is één kaart, met zijn route door de tussenstop.',
  'help.guide.airtrail-import.result':
    'De vluchten uit AirTrail zijn kaarten op het tabblad Transport en rijen op hun dagen, elk met de badge AirTrail die zegt waar hij vandaan komt.',
  'help.guide.airtrail-import.tip.1':
    'Een vlucht die al in de reis zit onder hetzelfde nummer en dezelfde datum wordt overgeslagen, en een melding zegt hoeveel dat er waren. Ongedaan maken in de werkbalk boven de dagen neemt de hele import terug.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail blijft de bron van de waarheid. TREK leest zijn wijzigingen als je de reis opent en om de paar minuten op de achtergrond; een vlucht die daar is verwijderd houdt zijn kaart, met de badge omgezet naar Niet gesynchroniseerd. Wijzigingen in TREK gaan alleen terug met Wijzigingen terugschrijven naar AirTrail aan onder Integraties.',
  'help.guide.airtrail-import.tip.3':
    'Een samengevoegde verbinding heeft geen enkele AirTrail-vlucht om te volgen, dus het is een eenmalige import: hij houdt de blauwe badge, en over de badge zweven zegt dat. Hetzelfde gebeurt met een gesynchroniseerde vlucht die je met de hand een tussenstop geeft.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Roadtrip',
  'help.ctx.trip-roadtrip.summary':
    'Het plan gelezen als één rit: dezelfde dagen en dezelfde plekken, aaneengeregen tot stops met het rijden ertussen, in een lijst langs de linkerkolom en op de kaart. Het zegt hoe ver en hoe lang, waar de tank leeg is, en wat er langs de weg ligt.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Dagen en Roadtrip boven aan de linkerkolom wisselen tussen het dagplan en de rit. Er wordt niets gekopieerd en niets gewijzigd: Dagen geeft het plan precies terug zoals het was.',
  'help.ctx.trip-roadtrip.bullet.2':
    'De kop van de lijst telt de reis op: Afstand, Rijtijd en Stops. Daaronder komt één kaartje per dag, met de eigen kilometers van de dag, voor hoeveel stops hij is, waar hij overheen gaat, en een badge Track.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Een genummerde stop is een plek waarvoor de dag bestaat. Een stop onderweg, tanken, laden, een rustplaats, draagt het pictogram van zijn soort in plaats van een nummer en telt niet mee. Klik op een nummer om te wijzigen wat het is, en op de badge Duur om te zeggen hoe lang hij duurt.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Tussen twee stops geeft een ritbalk het traject als afstand en tijd. Klik erop voor Routes voor dit traject, of klik op de getekende route op de kaart om het traject via een tussenpunt om te buigen.',
  'help.ctx.trip-roadtrip.bullet.5':
    'De rechterkolom wordt Langs de route: kies een dag, wat je zoekt en hoe breed de corridor is, en dan Zoeken. Toevoegen zet een resultaat op de rit op het punt waar je er echt langskomt.',
  'help.ctx.trip-roadtrip.bullet.6':
    'De Rij-instellingen eronder houden de grenzen, de auto en zijn bereik, de dagelijkse reistijden, wat vermeden moet worden en hoe de lijn wordt getekend. Ze horen bij de reis, dus iedereen plant met dezelfde auto.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'De reis als één rit lezen',
  'help.guide.roadtrip-mode.goal': 'Zet het plan over naar de roadtripmodus en lees wat de lijst je vertelt.',
  'help.guide.roadtrip-mode.step.1':
    'Klik op Roadtrip in de schakelaar Dagen en Roadtrip boven aan de linkerkolom. Het dagplan wordt vervangen door de rit, en de kaart tekent elke dag waarvoor een route is berekend.',
  'help.guide.roadtrip-mode.step.2': 'De kop van de lijst telt de hele reis op: Afstand, Rijtijd en Stops.',
  'help.guide.roadtrip-mode.step.3':
    'Daaronder komt één kaartje per dag. De koptekst draagt het nummer en de datum van de dag, het rijden als afstand en tijd, en voor hoeveel stops de dag is.',
  'help.guide.roadtrip-mode.step.4':
    'In het kaartje is de dag een ketting: een genummerde stop per plek, een ritbalk tussen elk paar, en de aankomsttijd aan de rechterrand.',
  'help.guide.roadtrip-mode.step.5':
    'Klik op de koptekst van een dag om hem in te klappen. Een ingeklapte dag verdwijnt ook van de kaart; klik nog eens op de koptekst om hem terug te halen.',
  'help.guide.roadtrip-mode.result':
    'De linkerkolom is de rit en de kaart toont elke dag ervan. Dagen schakelt meteen terug naar het plan, ongewijzigd.',
  'help.guide.roadtrip-mode.tip.1':
    'De keuze wordt per reis onthouden zolang het browsertabblad open staat, dus na een herlaad kom je weer in de rit terecht.',
  'help.guide.roadtrip-mode.tip.2':
    'De schakelaar bestaat pas als een beheerder de add-on Roadtrip heeft aangezet, onder Add-ons in Beheer.',
  'help.guide.roadtrip-mode.tip.3':
    'Op een telefoon is er geen schakelaar: de add-on voegt een eigen tabblad Roadtrip toe naast Plan.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Stops onderweg, en hoe lang je blijft',
  'help.guide.roadtrip-stops.goal': 'Maak van een plek op de rit een stop onderweg, en zeg hoe lang elke stop duurt.',
  'help.guide.roadtrip-stops.step.1':
    'Klik op het nummer voor een stop in de lijst. Het label is Maak er een stop onderweg van, en het opent Soort stop.',
  'help.guide.roadtrip-stops.step.2':
    'Kies een soort: Accommodatie, Tanken, Laden, Rustplaats, Camping, Eten of Bezienswaardig. Het nummer wordt het pictogram van die soort en de stops eronder worden hernummerd.',
  'help.guide.roadtrip-stops.step.3':
    'Een stop onderweg is geen bestemming, dus de koptekst van de dag telt één stop minder.',
  'help.guide.roadtrip-stops.step.4':
    'Klik nog eens op het pictogram, Soort stop wijzigen, en kies Weer een bestemming om de stop zijn nummer terug te geven.',
  'help.guide.roadtrip-stops.step.5': 'Elke stop draagt een badge Duur. Klik erop om Tijd bij deze stop te openen.',
  'help.guide.roadtrip-stops.step.6':
    'Stel de lengte in met de schuif, met de knoppen min en plus of met een van de voorkeuzes, kijk wat Aankomst en Vertrek doen, en klik dan op Opslaan.',
  'help.guide.roadtrip-stops.result':
    'De stop waarvan je de tijd zette draagt het uur op zijn badge Duur en elke aankomst erna is meegeschoven, en die je naar een soort en weer terug stuurde is weer een genummerde bestemming.',
  'help.guide.roadtrip-stops.tip.1':
    'Een verblijf hoort bij de plek, niet bij één bezoek: op een plek die op twee dagen gepland staat, sta je op beide even lang.',
  'help.guide.roadtrip-stops.tip.2':
    'Stops onderweg verschijnen ook onder Dagen. Ook in Dagen tonen uitzetten, onder Servicestops in de Rij-instellingen, houdt ze alleen in Roadtrip.',
  'help.guide.roadtrip-stops.tip.3': 'Geen verblijf, in hetzelfde venster, haalt die tijd er weer af.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Tanken, eten en een bed vinden langs de route',
  'help.guide.roadtrip-corridor.goal': 'Doorzoek de weg die je echt rijdt, en zet wat je vindt op het juiste traject.',
  'help.guide.roadtrip-corridor.step.1':
    'Kies de dag boven in Langs de route. Alleen dagen met een berekende route worden aangeboden.',
  'help.guide.roadtrip-corridor.step.2':
    'Vink onder Gezocht wordt aan wat je nodig hebt. Tanken, Laden, Rustplaats, Camping, Accommodatie, Eten en Bezienswaardig zijn te combineren.',
  'help.guide.roadtrip-corridor.step.3':
    'Kies onder Binnen hoe ver er aan weerszijden van de weg gezocht wordt, 2 km, 5 km of 10 km, en klik dan op Zoeken.',
  'help.guide.roadtrip-corridor.step.4':
    'De treffers komen per soort gegroepeerd terug, in de volgorde waarin je ze passeert, elk met hoe ver in de dag hij ligt en hoe ver hij van de route af ligt.',
  'help.guide.roadtrip-corridor.step.5':
    'Toevoegen op een treffer opent Als stop toevoegen. Daar staat op welke dag en op welke positie de stop terechtkomt, het vraagt om de soort en de tijd bij de stop, en Toevoegen zet hem op de rit.',
  'help.guide.roadtrip-corridor.result':
    'De treffers staan in de volgorde waarin je ze passeert en zijn op de kaart getekend, en de toegevoegde zit op de rit op het punt waar je er echt langskomt.',
  'help.guide.roadtrip-corridor.tip.1':
    'Er wordt pas gezocht als je op Zoeken drukt: één ronde zijn veel verzoeken aan een gedeelde dienst.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filteren op naam versmalt wat er terugkwam zonder opnieuw te vragen, en Resultaten wissen leegt de lijst en haar spelden. Klik op een treffer om hem op de kaart in beeld te halen.',
  'help.guide.roadtrip-corridor.tip.3':
    'Een treffer kun je ook van de kaart op de getekende route slepen, zo kies je zelf het traject waar dezelfde weg twee keer gereden wordt. Handmatig toevoegen, naast Zoeken, zoekt in plaats daarvan een plek op naam op.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Een traject via een tussenpunt ombuigen',
  'help.guide.roadtrip-via.goal':
    'Stuur een traject over de weg die je echt wilt, zonder er een stop aan toe te voegen.',
  'help.guide.roadtrip-via.step.1':
    'Haal het gewenste traject in beeld: klik op een stop in de lijst en sluit dan het kaartje dat over de kaart opengaat.',
  'help.guide.roadtrip-via.step.2':
    'Klik op de getekende route. Er wordt een tussenpunt op het aangeklikte traject gezet, en het traject wordt er opnieuw langs berekend.',
  'help.guide.roadtrip-via.step.3':
    'De lijst volgt: de koptekst van de dag draagt de nieuwe afstand en rijtijd, en elke aankomst na het tussenpunt schuift mee.',
  'help.guide.roadtrip-via.step.4':
    'Ga met de muis over de greep en hij zegt wat hij kan: Sleep om de route te hervormen, rechtsklik om te verwijderen. Sleep hem ergens anders heen en het traject wordt via de nieuwe plek opnieuw getekend.',
  'help.guide.roadtrip-via.step.5':
    'Rechtsklik op de greep om hem weg te halen. Het traject rijdt weer de directe weg.',
  'help.guide.roadtrip-via.result':
    'Het traject volgt de weg die je hebt gekozen, en de afstand, de rijtijd en de aankomsten van de dag worden er opnieuw voor uitgerekend.',
  'help.guide.roadtrip-via.tip.1':
    'Een tussenpunt is geen stop: het heeft geen nummer, geen verblijf en geen aankomsttijd, en het telt niet mee bij de stops van de dag.',
  'help.guide.roadtrip-via.tip.2':
    'De grepen worden vanaf zoomniveau 9 getekend, dus een kaart die op de hele reis is ingepast toont de lijn zonder ze.',
  'help.guide.roadtrip-via.tip.3':
    'Een klik verder dan twee kilometer van elk getekend traject wordt genegeerd, en een klik op een vlucht, een trein of een veerboot ook.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Een andere manier om een traject te rijden proberen',
  'help.guide.roadtrip-alternatives.goal': 'Kijk wat de router nog meer voor één stuk aanbiedt, en neem het.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klik op een ritbalk in de lijst, de rij tussen twee stops die het traject als afstand en tijd geeft. Het label is Andere routes.',
  'help.guide.roadtrip-alternatives.step.2':
    'Routes voor dit traject gaat over de kaart open, één regel per weg, elk in een eigen kleur op de kaart getekend.',
  'help.guide.roadtrip-alternatives.step.3':
    'Ga met de muis over een regel om die weg te laten oplichten. Huidig is de weg waarover wordt gereden en Snelste de snelste; de andere zeggen hoeveel langzamer ze zijn, of welke wegklasse ze weglaten.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klik op een regel om zo te rijden, of op Sluiten om de weg te houden waarop je zit.',
  'help.guide.roadtrip-alternatives.result':
    'Het traject rijdt de weg die je hebt gekozen, en de afstand in de lijst en de aankomsten erna veranderen mee.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Een andere weg kiezen zet een tussenpunt op het traject en vervangt de tussenpunten die het al had; de eigen weg van de router kiezen haalt ze er weer af.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Zonder snelweg, Zonder tol en Zonder veerboot komen van een tweede motor met een eigen snelheidsmodel, dus hun tijden zijn niet met de andere te vergelijken.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'De auto en de rijgrenzen instellen',
  'help.guide.roadtrip-limits.goal': 'Vertel TREK wat je rijdt en hoe ver je achter elkaar wilt rijden.',
  'help.guide.roadtrip-limits.step.1':
    'Rij-instellingen staat onder het zoeken in de rechterkolom. De badges zeggen wat er is ingesteld; klik erop om het te openen.',
  'help.guide.roadtrip-limits.step.2':
    'Onder Rijden zijn Langste rit achtereen en Rijden per dag in minuten. Een leeg veld betekent uit, en er wordt niets gemarkeerd.',
  'help.guide.roadtrip-limits.step.3':
    'Zeg onder Voertuig wat je rijdt. Benzine tankt alleen bij tankstops bij, Elektrisch alleen bij laadstops, Beide bij allebei.',
  'help.guide.roadtrip-limits.step.4':
    'Typ Bereik per tank, of Actieradius per lading, zelf in. Uit de autogegevens berekenen eronder neemt Tankinhoud en Verbruik, of Accu en Verbruik, en rekent het uit.',
  'help.guide.roadtrip-limits.step.5':
    'Vermijden waar het kan is een voorkeur, geen verbod: een dag zonder weg eromheen gebruikt die weg toch, en zegt dat in zijn koptekst.',
  'help.guide.roadtrip-limits.step.6':
    'Sluit het venster. Het kaartje zegt wat er is ingesteld, en de lijst markeert elk traject en elke dag die eroverheen gaat.',
  'help.guide.roadtrip-limits.result':
    'De badges op het kaartje zeggen wat er is ingesteld, en elk traject en elke dag boven een grens draagt een badge in de lijst.',
  'help.guide.roadtrip-limits.tip.1':
    'De instellingen horen bij de reis, dus iedereen erin plant met dezelfde auto en dezelfde grenzen.',
  'help.guide.roadtrip-limits.tip.2':
    'Vullen tot zegt hoe vol een stop tankt, want niemand laadt onderweg tot 100 %. Een tank- of laadstop kan dat voor zichzelf overschrijven.',
  'help.guide.roadtrip-limits.tip.3':
    'Routelijn bepaalt hoe de rit getekend wordt: Dagen verbinden berekent de nacht tussen twee dagen, en Een kleur per dag geeft elke dag zijn eigen kleur.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'De rijdag een begin en een einde geven',
  'help.guide.roadtrip-day-window.goal':
    'Stop met rijden op een uur dat je zelf kiest, en zeg waar de dag moet eindigen.',
  'help.guide.roadtrip-day-window.step.1': 'Open Rij-instellingen in de rechterkolom en zoek Dagelijkse reistijden.',
  'help.guide.roadtrip-day-window.step.2':
    'Stel een Begin van de dag in. Op zichzelf doet het niets: beide tijden zijn nodig, zoals de notitie eronder zegt.',
  'help.guide.roadtrip-day-window.step.3':
    'Stel een Einde van de dag in. De rit stopt nu op dat uur en draagt de rest over naar de volgende ochtend, als een regel Einde van de dag en een regel Reis hervatten in de lijst.',
  'help.guide.roadtrip-day-window.step.4':
    'Kies onder Dag afsluiten de optie Onderweg om op de eindtijd op de weg te pauzeren, of Bij de laatste plek om te stoppen voordat de volgende rit die tijd zou overschrijden.',
  'help.guide.roadtrip-day-window.step.5':
    'Sluit het venster. Het kaartje Rij-instellingen draagt de twee tijden als badge.',
  'help.guide.roadtrip-day-window.result':
    'De rit wordt in reisdagen geknipt van de lengte die je hebt ingesteld, en wat niet past gaat verder op berekende dagen na de laatste. Je dagen en hun plekken worden niet gewijzigd.',
  'help.guide.roadtrip-day-window.tip.1':
    'Een van beide tijden leegmaken zet het geheel weer uit. Tijden die je zelf op een stop hebt vastgezet gaan altijd voor.',
  'help.guide.roadtrip-day-window.tip.2':
    'Met dagelijkse reistijden ingesteld zijn de dagen altijd verbonden: de rit van de laatste stop van een dag naar de eerste van de volgende wordt berekend en meegeteld.',
  'help.guide.roadtrip-day-window.tip.3':
    'Elk dageinde is ook een markering op de kaart, een maan met het dagnummer. Sleep hem langs de route, of naar een plek, om de dag ergens anders te laten eindigen; rechtsklik erop om het automatische einde terug te zetten, en Automatische dageinden herstellen in dit venster maakt alles ongedaan.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tanken voordat de tank leeg is',
  'help.guide.roadtrip-refuel.goal':
    'Vind op het stuk dat de auto nog haalt een plek om te tanken, en zet die op de rit.',
  'help.guide.roadtrip-refuel.step.1':
    'Met een bereik ingesteld tekent de lijst een balk dwars over het traject waar het opraakt: Hier is de tank leeg, en eronder hoe ver in het traject dat is.',
  'help.guide.roadtrip-refuel.step.2':
    'Het lampje op de balk is de knop. Tankstation zoeken kijkt langs de weg die je al gereden hebt, met Zoeken langs de route… zolang het bezig is.',
  'help.guide.roadtrip-refuel.step.3':
    'Er komen tot drie stations terug, elk met hoe ver het van de route af ligt en hoeveel bereik het zou overlaten.',
  'help.guide.roadtrip-refuel.step.4':
    'De plus op een aanbod voegt het toe als tankstop. Als stop toevoegen gaat open met de soort en de tijd al ingevuld, en Toevoegen zet het op het traject op het punt waar je er echt langskomt.',
  'help.guide.roadtrip-refuel.result':
    'De stop staat op het juiste traject met een eigen pictogram, het bereik telt vanaf daar opnieuw, en de balk is weg.',
  'help.guide.roadtrip-refuel.tip.1':
    'Het bereik telt vanaf de laatste tank- of laadstop, over dagen heen. Wat je rijdt bepaalt welke stops meetellen: Benzine alleen tanken, Elektrisch alleen laden.',
  'help.guide.roadtrip-refuel.tip.2':
    'De zoekopdracht kijkt naar de weg voor het droge punt, houdt een reserve aan en telt de omweg dubbel, dus alles wat ze aanbiedt is echt haalbaar.',
  'help.guide.roadtrip-refuel.tip.3':
    'Een leeg antwoord is geen doodlopende weg: het lampje wordt Opnieuw, want het plaatsenzoeken is een gedeelde dienst die weleens een time-out geeft.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Een dag een geïmporteerde track laten volgen',
  'help.guide.roadtrip-track.goal':
    'Zet de rit van een dag op een mooie route die je als GPX- of KML-track hebt geïmporteerd.',
  'help.guide.roadtrip-track.step.1':
    'Klik op de badge Track in de koptekst van een dag. Het venster gaat open op die dag.',
  'help.guide.roadtrip-track.step.2':
    'Kies een track. Elke track zegt hoe lang hij is en of hij langs deze dag loopt of hoe ver hij eraf ligt, de dichtstbijzijnde eerst.',
  'help.guide.roadtrip-track.step.3':
    'Klik op Deze track volgen. TREK zet tussenpunten waar de rit het verst van de track afdwaalt, en berekent opnieuw, ronde na ronde.',
  'help.guide.roadtrip-track.step.4':
    'Het zegt hoeveel tussenpunten het heeft geplaatst en hoe dicht de rit nu blijft. De knop eronder haalt die tussenpunten er weer af en geeft de dag terug aan de router; het venster sluiten behoudt de track.',
  'help.guide.roadtrip-track.result':
    'De rit van de dag volgt de track in plaats van de weg die de router koos, en zijn badge Track brandt en noemt die track als je erop wijst.',
  'help.guide.roadtrip-track.tip.1':
    'Importeer het bestand onder Dagen met Bestand importeren, met Routes of Tracks aangevinkt. Zolang de reis er geen heeft, draagt geen enkele dag de badge.',
  'help.guide.roadtrip-track.tip.2':
    'Een track volgen vervangt de tussenpunten die de trajecten van de dag al hadden, vorm een traject dus met de hand na de track, niet ervoor.',
};

export default help;
