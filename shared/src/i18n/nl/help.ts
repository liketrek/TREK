import type { TranslationStrings } from '../types';

// English fallback until 'nl' is translated.
const help: TranslationStrings = {
  'help.title': 'Hulp en documentatie',
  'help.search': 'Zoeken in de documentatie…',
  'help.contents': 'Inhoud',
  'help.noResults': "Geen pagina's gevonden.",
  'help.errorTitle': 'Deze pagina kon niet worden geladen',
  'help.errorBody':
    'De hulpteksten worden opgehaald uit de TREK-wiki. Controleer je verbinding en probeer het opnieuw.',

  // center
  'help.center.button': 'Hulp bij dit scherm',
  'help.center.title': 'Hulp',
  'help.center.onThisScreen': 'Op dit scherm',
  'help.center.screens': 'Schermen',
  'help.center.thisScreen': 'Huidig',
  'help.center.subScreens': '{count} subschermen',
  'help.center.subScreens.one': '{count} subscherm',
  'help.center.subScreensLabel': 'Subschermen',
  'help.center.guidesCount': '{count} handleidingen',
  'help.center.guidesCount.one': '{count} handleiding',
  'help.center.goToScreen': 'Naar {screen}',
  'help.center.overview': 'Overzicht',
  'help.center.howTo': 'Hoe kan ik…',
  'help.center.searchPlaceholder': 'Zoeken in handleidingen en documentatie…',
  'help.center.searchEmpty': "Niets gevonden voor '{query}'.",
  'help.center.searchGuides': 'Handleidingen',
  'help.center.searchDocs': 'Documentatie',
  'help.center.searchError': 'Zoeken is op dit moment niet beschikbaar.',
  'help.center.back': 'Terug',
  'help.center.close': 'Hulp sluiten',
  'help.center.steps': '{count} stappen',
  'help.center.steps.one': '{count} stap',
  'help.center.step': 'Stap {n}',
  'help.center.stepsLabel': 'Stappen',
  'help.center.stepOf': 'Stap {n} van {total}',
  'help.center.screenshot': 'Schermafbeelding',
  'help.center.result': 'Wat je krijgt',
  'help.center.tips': 'Goed om te weten',
  'help.center.related': 'Gerelateerd',
  'help.center.openDocs': 'Openen in Hulp & documentatie',
  'help.center.docsSection': 'In de documentatie',
  'help.center.noContext': 'Voor dit scherm is er nog geen handleiding.',
  'help.center.noContextHint': 'Doorzoek de documentatie of laat ons weten wat je zocht.',
  'help.center.feedback': 'Mis je iets?',
  'help.center.feedbackLink': 'Laat het ons weten op GitHub',
  'help.center.discord': 'Stel je vraag op Discord',
  'help.center.quick': 'Snel',
  'help.center.guide': 'Handleiding',
  'help.center.tour': 'Rondleiding',
  'help.center.imageAlt': 'Stap {n} van ‘{title}’',

  // ctx
  'help.ctx.dashboard.title': 'Dashboard', // same-as-en
  'help.ctx.dashboard.summary':
    'Op je dashboard zie je al je reizen. De kaart bovenaan, vormgegeven als instapkaart, toont de reis die nu loopt of als eerstvolgende op de planning staat. De rij daaronder telt wat je tot nu toe hebt gereisd, en de kaarten tonen elke reis die je plant, hebt gearchiveerd of al hebt afgerond.',
  'help.ctx.dashboard.bullet.1':
    'Instapkaart: de lopende of eerstvolgende reis met data, reizigers, plaatsen en een aftelling. Klik erop om de reis te openen. Met de vier knoppen rechtsboven bewerk, dupliceer, archiveer of verwijder je de reis.',
  'help.ctx.dashboard.bullet.2':
    'Reisstatistieken: bezochte landen, reizen, dagen onderweg en gevlogen afstand, over al je reizen samen.',
  'help.ctx.dashboard.bullet.3':
    'Reiskaarten, te filteren op Gepland, Gearchiveerd en Voltooid, als raster of als lijst. Het zoekvak erboven doorzoekt al je reizen tegelijk, op titel, datum of een plaats in de reis. De knoppen om een reis te bewerken, dupliceren, archiveren of verwijderen staan rechtsboven op de foto van elke kaart.',
  'help.ctx.dashboard.bullet.4':
    'Widgets rechts: valuta-omrekenaar, Collecties (als de add-on Collecties aanstaat), wereldklokken, aankomende reserveringen en widgets van plugins. De ingebouwde widgets kun je uitzetten onder Instellingen, Weergave.',
  'help.ctx.dashboard.bullet.5':
    "Met de kaart 'Nieuwe reis' en met de knop rechtsonder start je allebei een nieuwe reis.",

  // create-trip
  'help.guide.create-trip.title': 'Een reis aanmaken',
  'help.guide.create-trip.goal': 'Begin een nieuwe reis met een naam, data en een omslagfoto.',
  'help.guide.create-trip.step.1':
    'Klik op ‘Nieuwe reis’. De kaart achter je laatste reis en de knop rechtsonder doen precies hetzelfde.',
  'help.guide.create-trip.step.2': 'Geef de reis een naam. Meer heb je niet nodig: de rest kun je later toevoegen.',
  'help.guide.create-trip.step.3':
    'Kies een begin- en einddatum. TREK maakt voor elke datum een dag aan, zodat je meteen aan je reisschema kunt beginnen. Nog geen data? Laat beide leeg en vul in plaats daarvan het ‘Aantal dagen’ in.',
  'help.guide.create-trip.step.4':
    'Optioneel: voeg een omslagfoto toe. Upload een eigen foto, sleep of plak er een in, of zoek op Unsplash naar je bestemming.',
  'help.guide.create-trip.step.5': 'Klik op ‘Nieuwe reis aanmaken’.',
  'help.guide.create-trip.result':
    'De reis verschijnt op je dashboard. Is het je eerstvolgende reis, dan staat hij op de instapkaart bovenaan.',
  'help.guide.create-trip.tip.1':
    'De data kun je later nog wijzigen. Zijn er al boekingen, dan vraagt TREK of die met de dagen mee moeten schuiven.',
  'help.guide.create-trip.tip.2':
    'Alle kosten worden omgerekend naar de reisvaluta die je hier kiest. Kies de valuta van je bestemming.',

  // edit-trip
  'help.guide.edit-trip.title': 'Een reis bewerken',
  'help.guide.edit-trip.goal': 'Geef een reis een andere naam, wijzig de data of pas de instellingen aan.',
  'help.guide.edit-trip.step.1': 'Klik op het potlood rechtsboven op de reiskaart (of op de instapkaart).',
  'help.guide.edit-trip.step.2':
    'Pas aan wat je wilt: naam, beschrijving, data, omslag, valuta, herinnering of reisgenoten.',
  'help.guide.edit-trip.step.3': 'Klik op Bijwerken.',
  'help.guide.edit-trip.result': 'De kaart wordt meteen bijgewerkt, voor iedereen in de reis.',
  'help.guide.edit-trip.tip.1':
    'Verschuif je het begin van een reis met boekingen, dan vraagt TREK of de boekingen mee moeten schuiven. Kort je een reis in, dan zie je welke dagen zouden verdwijnen en wat daarop gepland staat. Er wordt pas opgeslagen als je op ‘Dagen verwijderen en opslaan’ klikt.',

  // cover-image
  'help.guide.cover-image.title': 'Een omslagfoto instellen',
  'help.guide.cover-image.goal': 'Geef een reis een afbeelding die op de reiskaart en op de instapkaart staat.',
  'help.guide.cover-image.step.1': 'Open het bewerkformulier van de reis met het potlood op de kaart.',
  'help.guide.cover-image.step.2':
    'Sleep of plak onder ‘Omslagafbeelding’ een foto, klik om er een te uploaden, of typ een bestemming en klik op ‘Zoeken op Unsplash’.',
  'help.guide.cover-image.step.3': 'Kies een foto en klik op Bijwerken.',
  'help.guide.cover-image.result':
    'De foto wordt bij de reis opgeslagen en verschijnt overal waar de reis wordt getoond.',
  'help.guide.cover-image.tip.1':
    "Bij foto's uit de zoekfunctie van Unsplash wordt de fotograaf automatisch vermeld. Je eigen uploads blijven op je eigen server.",

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Een reis dupliceren',
  'help.guide.duplicate-trip.goal': 'Gebruik een reis als sjabloon voor een nieuwe reis.',
  'help.guide.duplicate-trip.step.1': 'Klik op het dupliceerpictogram rechtsboven op de kaart.',
  'help.guide.duplicate-trip.step.2': 'Lees wat er wel en niet wordt gekopieerd en klik dan op ‘Reis kopiëren’.',
  'help.guide.duplicate-trip.result':
    'Er verschijnt een kopie op je dashboard, met de naam van het origineel en (kopie) erachter. Je kunt de kopie een andere naam en andere data geven.',
  'help.guide.duplicate-trip.tip.1':
    "Dagen, plaatsen, tochten en roadtriproutes, reserveringen, budgetposten, inpaklijsten, to-do's en dagnotities worden gekopieerd. Inpaklijsten en to-do's worden zonder vinkjes gekopieerd. Leden, chat, peilingen, bestanden en deellinks worden niet gekopieerd.",

  // archive-trip
  'help.guide.archive-trip.title': 'Een reis archiveren en terugzetten',
  'help.guide.archive-trip.goal': 'Haal een reis uit je reizenlijst zonder hem te verwijderen, en zet hem later terug.',
  'help.guide.archive-trip.step.1': 'Klik op het archiefpictogram rechtsboven op de kaart.',
  'help.guide.archive-trip.step.2': 'Zet het filter boven de kaarten op Gearchiveerd om de reis weer te zien.',
  'help.guide.archive-trip.step.3':
    'Klik op de kaart op ‘Herstellen’ om de reis terug te zetten naar ‘Gepland’, of naar ‘Voltooid’ als de data al voorbij zijn.',
  'help.guide.archive-trip.result':
    'Gearchiveerde reizen behouden al hun gegevens. Ze staan alleen niet meer op het dashboard en niet meer in de agendafeed met alle reizen.',

  // delete-trip
  'help.guide.delete-trip.title': 'Een reis verwijderen',
  'help.guide.delete-trip.goal': 'Verwijder een reis definitief.',
  'help.guide.delete-trip.step.1': 'Klik op de prullenbak rechtsboven op de kaart.',
  'help.guide.delete-trip.step.2':
    'Bevestig met ‘Verwijderen’. Het venster noemt de reis, zodat je weet dat je de juiste hebt.',
  'help.guide.delete-trip.result':
    'De reis wordt verwijderd, met alle dagen, plekken, boekingen en bestanden. Dit kun je niet ongedaan maken. Twijfel je, archiveer de reis dan liever.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Voltooide reizen vinden en wisselen tussen raster en lijst',
  'help.guide.filter-and-view.goal':
    'Bekijk afgeronde of gearchiveerde reizen en kies de weergave die je prettig vindt.',
  'help.guide.filter-and-view.step.1':
    'Gebruik Gepland, Gearchiveerd en Voltooid boven de kaarten. Onder Voltooid staan alle reizen waarvan de einddatum voorbij is.',
  'help.guide.filter-and-view.step.2':
    'Klik op het lijsticoon voor een compacte lijst; klik er nog eens op voor het raster.',
  'help.guide.filter-and-view.result': 'Het dashboard onthoudt je indeling op dit apparaat.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Je abonneren op al je reizen in je agenda',
  'help.guide.calendar-feed.goal':
    'Zie de dagen en boekingen van al je actieve reizen in je agenda-app, altijd up-to-date.',
  'help.guide.calendar-feed.step.1': 'Klik op het agendapictogram naast de schakelaar voor de weergave.',
  'help.guide.calendar-feed.step.2':
    'Klik op ‘Agenda-abonnement inschakelen’. TREK maakt een privélink voor de feed aan.',
  'help.guide.calendar-feed.step.3':
    'Klik op ‘Toevoegen aan Google Agenda’ of ‘Toevoegen aan Apple Agenda / Outlook’. Gebruik je een andere agenda-app, open dan ‘Of kopieer een link handmatig’ en kopieer daar de link.',
  'help.guide.calendar-feed.result':
    'Elke actieve reis staat in je agenda en wordt automatisch bijgewerkt. Gearchiveerde reizen en reizen die meer dan 90 dagen geleden zijn afgelopen, staan er niet in.',
  'help.guide.calendar-feed.tip.1':
    'Houd de link geheim: iedereen die hem heeft, kan de feed lezen. Hebben anderen hem toch gekregen, dan geeft ‘Opnieuw genereren’ je een nieuwe link en werkt de oude niet meer. Met ‘Uitschakelen’ verwijder je de link helemaal.',

  // widgets
  'help.guide.widgets.title': 'Je dashboardwidgets kiezen',
  'help.guide.widgets.goal': 'Toon of verberg de rij met statistieken en de widgets rechts.',
  'help.guide.widgets.step.1': 'Open rechtsboven het menu achter je avatar en kies Instellingen.',
  'help.guide.widgets.step.2': 'Ga naar het tabblad Weergave.',
  'help.guide.widgets.step.3':
    'Zet onder Dashboardwidgets elke widget aan of uit, apart voor Desktop en Mobiel. Met ‘Rechter zijbalk’ zet je de hele rechterkolom in één keer uit.',
  'help.guide.widgets.step.4': 'Ga terug naar het dashboard. De wijziging is meteen zichtbaar.',
  'help.guide.widgets.result':
    'Verberg je widgets, dan krijgen je reizen meer ruimte. Zet de hele rechterzijbalk uit om de indeling te centreren.',
  'help.guide.widgets.link': 'Weergave-instellingen openen',

  // currency-widget
  'help.guide.currency-widget.title': 'Valuta omrekenen',
  'help.guide.currency-widget.goal': "Reken een bedrag om tussen twee valuta's met de actuele koersen.",
  'help.guide.currency-widget.step.1': "Typ het bedrag en kies de twee valuta's.",
  'help.guide.currency-widget.step.2':
    "Met de pijl ertussen draai je de twee valuta's om, met de ronde pijl ververs je de koers.",
  'help.guide.currency-widget.result':
    'Je valutapaar wordt in je account onthouden, dus het is op elk apparaat hetzelfde.',
  'help.guide.currency-widget.tip.1':
    'De wisselkoersen komen van de gratis dienst Frankfurter. Met de ronde pijl in de hoek van de widget haal je de nieuwste koersen op.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Wereldklokken toevoegen',
  'help.guide.timezones-widget.goal': 'Zie hoe laat het op je bestemmingen is.',
  'help.guide.timezones-widget.step.1':
    'Klik op + in de widget Tijdzones, zoek een stad, bijvoorbeeld Lissabon, en kies die uit de lijst.',
  'help.guide.timezones-widget.step.2':
    'Wil je een klok verwijderen? Ga er met de muis overheen en klik op het × dat rechts verschijnt.',
  'help.guide.timezones-widget.result': 'Je klokken worden in je account opgeslagen.',
  'help.guide.search-trips.title': 'Je reizen doorzoeken',
  'help.guide.search-trips.goal':
    'Zoek een reis op naam, op datum of op een plek die je erin hebt gepland, ook als de reis gearchiveerd is.',
  'help.guide.search-trips.step.1':
    'Typ in ‘Zoek trips of plekken’ boven de kaarten. De lijst wordt gefilterd terwijl je typt, in geplande, gearchiveerde en voltooide reizen tegelijk.',
  'help.guide.search-trips.step.2':
    'Wordt een reis gevonden door een van de plekken erin, dan staat die plek onder de titel van de reis. Klik op de x in het zoekveld of druk op Escape om weer al je reizen te zien.',
  'help.guide.search-trips.result':
    'Het dashboard toont alleen de reizen die overeenkomen. Maak het zoekveld leeg om weer alle reizen te zien.',
  'help.guide.search-trips.tip.1':
    'Je kunt ook op datum zoeken: typ een maand en een jaar, bijvoorbeeld mei 2027, of 2027-05, en je vindt de reizen in die maand.',
  'help.guide.search-trips.tip.2':
    'Zolang je zoekt, wordt de keuze tussen Gepland, Gearchiveerd en Voltooid niet toegepast, zodat een reis nooit wegvalt door het verkeerde filter.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vakantie',
  'help.ctx.vacay.summary':
    'Vacay is je persoonlijke verlofplanner: hoeveel vakantiedagen je in een jaar hebt, welke je al hebt ingevoerd en hoeveel je er nog over hebt. Het raster toont het hele jaar. In de zijbalk vind je de jaarkeuze, de mensen met wie je plant, kalenders die met je gedeeld zijn, de legenda en je verlofrecht.',
  'help.ctx.vacay.bullet.1':
    'Jaaroverzicht: twaalf maandkaarten met een vakje per dag. Klik op een dag om die in te voeren of te wissen. Een blauw stipje markeert dagen waarop je al op reis bent.',
  'help.ctx.vacay.bullet.2':
    'Werkbalk onderaan: met de eerste knop, met je naam en kleur, leg je vakantie vast; ‘Bedrijfsvakantie’ markeert dagen waarop het hele bedrijf vrij is. ‘Halve dag’ en ‘Compensatie’ bepalen wat een klik vastlegt, en ‘Halve dag’ werkt ook voor bedrijfsvakanties.',
  'help.ctx.vacay.bullet.3':
    'Recht: ‘Dagen’, ‘Gebruikt’ en ‘Over’ voor het gekozen jaar, met overgedragen dagen en compensatiedagen ernaast. Klik op de kop van de kaart om die in te klappen.',
  'help.ctx.vacay.bullet.4':
    'Personen zijn de mensen met wie je je plan deelt, elk in een eigen kleur. Gedeelde kalenders tonen de vrije dagen van anderen als gekleurde ringen. Die kun je niet bewerken.',
  'help.ctx.vacay.bullet.5':
    'In de instellingen regel je weekenden, de eerste dag van de week, het meenemen van restdagen, je verlofjaar, bedrijfsvakanties, kalenders met feestdagen en schoolvakanties, en ‘Fusie opheffen’ als je samen met iemand plant.',
  // log-day
  'help.guide.log-day.title': 'Een vakantiedag invoeren',
  'help.guide.log-day.goal': 'Markeer een vrije dag in het jaaroverzicht en zie je saldo meteen bijwerken.',
  'help.guide.log-day.step.1':
    'Kijk naar de eerste knop in de werkbalk onderaan. Staan daar jouw naam en kleur, dan registreer je met een klik op een dag een vakantiedag voor jezelf.',
  'help.guide.log-day.step.2':
    'Klik op een dag in een van de maanden. De dag krijgt jouw kleur, en Gebruikt gaat één dag omhoog.',
  'help.guide.log-day.step.3': 'Klik nog eens op dezelfde dag om hem weer leeg te maken.',
  'help.guide.log-day.result':
    'De dag is ingevoerd. Dagen, Gebruikt en Resterend worden meteen bijgewerkt, en iedereen met wie je plan is samengevoegd, ziet de wijziging direct.',
  'help.guide.log-day.tip.1':
    'Zolang ‘Weekenden blokkeren’ in Instellingen aan staat, kun je geen weekenddagen invoeren. Een weekenddag die je al eerder hebt ingevoerd, kun je nog wel wissen.',
  'help.guide.log-day.tip.2':
    'Een blauw stipje in een vakje betekent dat een van je reizen op die dag valt. Zo zie je waar verlof en reizen samenvallen.',
  // half-day
  'help.guide.half-day.title': 'Een halve dag invoeren',
  'help.guide.half-day.goal': 'Neem een middag vrij en gebruik daarvoor maar een halve dag van je verlofrecht.',
  'help.guide.half-day.step.1':
    "Zet 'Halve dag' aan in de werkbalk. De oranje stip geeft in het overzicht een halve dag aan.",
  'help.guide.half-day.step.2': 'Klik op een dag. Die telt als 0,5 en krijgt een oranje stip in de hoek.',
  'help.guide.half-day.step.3':
    "Zet 'Halve dag' weer uit als je klaar bent. Klik je op een halve dag met andere instellingen, dan krijgt die de huidige instellingen.",
  'help.guide.half-day.result':
    'Gebruikt gaat met 0,5 omhoog. ‘Halve dag’ en Compensatie staan los van elkaar, dus je kunt ook een halve compensatiedag invoeren.',
  'help.guide.half-day.tip.1':
    'De werkbalk laat altijd zien welke markering je volgende klik plaatst, zodat je kunt controleren voordat je invoert.',
  // comp-day
  'help.guide.comp-day.title': 'Compensatie of flextijd invoeren',
  'help.guide.comp-day.goal': 'Neem compensatieverlof op zonder vakantiedagen te gebruiken.',
  'help.guide.comp-day.step.1':
    "Zet 'Compensatie' aan in de werkbalk. De gearceerde cirkel geeft in het overzicht een compensatiedag aan.",
  'help.guide.comp-day.step.2':
    'Klik op een dag. Die krijgt schuine strepen in jouw kleur in plaats van een egale kleur.',
  'help.guide.comp-day.result':
    'Compensatiedagen worden naast de tegels met je verlofrecht geteld en gaan nooit af van Resterend.',
  'help.guide.comp-day.tip.1':
    'Gebruik dit voor overuren die je als vrije tijd opneemt, voor flextijd of voor een compensatiedag: elke vrije dag die geen vakantie is.',
  // entitlement
  'help.guide.entitlement.title': 'Je verlofrecht instellen',
  'help.guide.entitlement.goal': 'Laat Vacay weten hoeveel vakantiedagen je dit jaar hebt.',
  'help.guide.entitlement.step.1':
    'Klik in de kaart ‘Recht’ in de zijbalk op de tegel ‘Dagen’ in jouw rij. Is de kaart ingeklapt, klik dan op de kop om hem te openen.',
  'help.guide.entitlement.step.2': 'Typ je aantal dagen en druk op Enter. Met Escape houd je de oude waarde.',
  'help.guide.entitlement.result':
    'Resterend wordt opnieuw berekend op basis van je verlofrecht, eventuele overgedragen dagen en de dagen die je hebt gebruikt.',
  'help.guide.entitlement.tip.1':
    'Elk jaar heeft zijn eigen verlofrecht, dus een wijziging hier geldt alleen voor het gekozen jaar.',
  // years
  'help.guide.years.title': 'Jaren toevoegen en wisselen',
  'help.guide.years.goal': 'Plan nu al volgend jaar, of kijk terug op vorig jaar.',
  'help.guide.years.step.1':
    'Klik op de + rechts van het jaartal om het volgende jaar toe te voegen, of op de + links voor het vorige jaar.',
  'help.guide.years.step.2': 'Wissel van jaar met de pijlen of met de jaarlabels eronder.',
  'help.guide.years.step.3':
    'Wil je een jaar verwijderen, beweeg de muis dan over het jaarlabel en klik op het kleine minteken. Alle invoer van dat jaar wordt dan ook verwijderd, dus bevestig met zorg.',
  'help.guide.years.result':
    'Elk jaar heeft een eigen verlofrecht en eigen invoer. Overgedragen dagen verbinden het ene jaar met het volgende.',
  // company-holidays
  'help.guide.company-holidays.title': 'Collectieve vrije dagen markeren',
  'help.guide.company-holidays.goal':
    'Blokkeer dagen waarop het hele bedrijf vrij is, zonder dat het iemands verlofrecht kost.',
  'help.guide.company-holidays.step.1':
    'Open Instellingen en controleer of Bedrijfsvakanties aan staat. Dat is standaard zo. De werkbalk toont de modus alleen zolang dit aan staat.',
  'help.guide.company-holidays.step.2': 'Zet terug in het raster de werkbalk op ‘Bedrijfsvakantie’.',
  'help.guide.company-holidays.step.3':
    'Klik op de dagen. Ze kleuren amber en komen in de legenda te staan. Klik nog een keer op een dag om hem te wissen.',
  'help.guide.company-holidays.result':
    'Iedereen met wie het plan is samengevoegd, ziet de bedrijfsvakanties, en ze gaan nooit af van Resterend.',
  'help.guide.company-holidays.tip.1':
    'Iedereen met wie je bent samengevoegd, kan bedrijfsvakanties bewerken. Spreek dus af wie ze bijhoudt.',
  // public-holidays
  'help.guide.public-holidays.title': 'Feestdagen tonen',
  'help.guide.public-holidays.goal': 'Zet de feestdagen van je land of regio in het raster.',
  'help.guide.public-holidays.step.1': 'Open Instellingen en zet Feestdagen aan.',
  'help.guide.public-holidays.step.2':
    'Klik op ‘Kalender toevoegen’ en kies het land en zo nodig de regio. Je kunt de kalender ook een kleur en een label geven. Klik daarna op ‘Toevoegen’.',
  'help.guide.public-holidays.step.3':
    'Sluit Instellingen. De feestdagen verschijnen in het overzicht en in de legenda.',
  'help.guide.public-holidays.result':
    'Feestdagen krijgen de kleur van de kalender en gaan nooit af van je verlofrecht.',
  'help.guide.public-holidays.tip.1':
    'Je kunt meerdere kalenders toevoegen, bijvoorbeeld die van je eigen regio en die van een collega met wie je bent samengevoegd.',
  // school-holidays
  'help.guide.school-holidays.title': 'Schoolvakanties tonen',
  'help.guide.school-holidays.goal': 'Zie de schoolvakanties in je regio naast je eigen vrije dagen.',
  'help.guide.school-holidays.step.1': 'Open Instellingen en zet ‘School Holidays’ aan.',
  'help.guide.school-holidays.step.2':
    'Klik op ‘Kalender toevoegen’ en kies het land. Heeft een land meerdere kalenders, kies dan ook de regio of groep en klik op ‘Toevoegen’.',
  'help.guide.school-holidays.step.3':
    'Sluit Instellingen. Schoolvakanties zijn gearceerd in de kleur van de kalender en hebben een gekleurde balk onderaan hun dagen.',
  'help.guide.school-holidays.result':
    'Schoolvakanties zie je alleen in de kalender: ze gaan nooit van iemands verlofrecht af.',
  'help.guide.school-holidays.tip.1':
    'Staat je regio er niet bij? Je beheerder kan schoolvakanties zelf bijhouden onder Beheerder, Personalisatie, Schoolvakanties.',
  // weekends
  'help.guide.weekends.title': 'Weekenden blokkeren en de eerste dag van de week instellen',
  'help.guide.weekends.goal': 'Tel weekends niet mee en laat de week beginnen op de dag die jij wilt.',
  'help.guide.weekends.step.1': 'Open Instellingen.',
  'help.guide.weekends.step.2':
    'Zet ‘Weekenden blokkeren’ aan en kies dan onder ‘Weekenddagen’ de dagen die voor jou als weekend tellen.',
  'help.guide.weekends.step.3': 'Kies onder ‘Week begint op’ voor Ma of Zo.',
  'help.guide.weekends.result': 'Geblokkeerde dagen worden grijs in het raster en kun je niet per ongeluk invoeren.',
  // leave-year
  'help.guide.leave-year.title': 'Je verlofjaar instellen',
  'help.guide.leave-year.goal':
    'Tel je verlofrecht over een boekjaar of vanaf je datum van indiensttreding, in plaats van van januari tot december.',
  'help.guide.leave-year.step.1': 'Open Instellingen en zoek Vakantiejaar.',
  'help.guide.leave-year.step.2':
    'Kies Agenda, Boekjaar (met de maand en dag waarop het begint) of Indiensttreding (met de datum waarop je in dienst kwam).',
  'help.guide.leave-year.result':
    'Verlofrecht, gebruikte dagen en overgedragen dagen worden over die periode geteld, en het raster begint met de eerste maand ervan.',
  'help.guide.leave-year.tip.1':
    'Deze instelling is persoonlijk: in een samengevoegd plan houdt iedereen zijn eigen verlofjaar en eigen aantallen.',
  // carry-over
  'help.guide.carry-over.title': 'Ongebruikte dagen meenemen',
  'help.guide.carry-over.goal': 'Neem wat er aan het eind van een periode over is mee naar de volgende.',
  'help.guide.carry-over.step.1': 'Open Instellingen.',
  'help.guide.carry-over.step.2': 'Zet Overdracht aan.',
  'help.guide.carry-over.result':
    'Het overgedragen aantal wordt over al je jaren opnieuw berekend en onder je verlofrecht getoond.',
  'help.guide.carry-over.tip.1': 'Zet je dit uit, dan gaat elk overgedragen saldo terug naar nul.',
  // invite
  'help.guide.invite.title': 'Samen met iemand plannen',
  'help.guide.invite.goal':
    'Voeg je plan samen met dat van een andere TREK-gebruiker, zodat jullie allebei je vrije dagen in één raster zien.',
  'help.guide.invite.step.1': 'Klik op het personenpictogram in de kaart ‘Personen’.',
  'help.guide.invite.step.2': 'Kies de gebruiker en klik op ‘Uitnodiging verzenden’.',
  'help.guide.invite.step.3':
    'De ander krijgt een melding en een Fusieverzoek zodra hij of zij Vakantie weer opent. Tot die tijd staat de uitnodiging op ‘in behandeling’. Beweeg je muis erover om hem te annuleren.',
  'help.guide.invite.result':
    'De twee plannen worden samengevoegd: iedereen heeft een eigen kleur, jullie kunnen dagen voor elkaar invoeren, en alles wordt direct gesynchroniseerd.',
  'help.guide.invite.tip.1':
    'Wil je een fusie ongedaan maken? Klik dan in Instellingen op ‘Opheffen’. Ieders dagen gaan terug naar de eigen planning.',
  'help.guide.invite.tip.2':
    'Wil je dat de ander alleen je dagen ziet? Deel dan je kalender in plaats van jullie kalenders samen te voegen.',
  // share-calendar
  'help.guide.share-calendar.title': 'Je kalender delen zonder dat anderen kunnen bewerken',
  'help.guide.share-calendar.goal': 'Laat iemand zien wanneer je vrij bent, zonder dat diegene je plan kan wijzigen.',
  'help.guide.share-calendar.step.1': 'Klik op het deelpictogram in de kaart Gedeelde kalenders.',
  'help.guide.share-calendar.step.2': 'Kies de gebruiker en klik op Delen. De ander hoeft niets te accepteren.',
  'help.guide.share-calendar.step.3':
    'Kalenders die met jou zijn gedeeld, staan bovenaan de kaart: klik op een kalender om hem te verbergen of te tonen, of beweeg je muis erover en klik op het kruisje om hem te verwijderen. Beweeg onder ‘Jij deelt met’ je muis over een naam en klik op ‘Delen stoppen’.',
  'help.guide.share-calendar.result':
    'Je vrije dagen verschijnen als gekleurde ring in hun raster. Ze kunnen niets bewerken van wat je deelt.',
  'help.guide.share-calendar.tip.1':
    'Delen en samenvoegen staan los van elkaar: je kunt met de ene persoon samengevoegd zijn en met anderen delen.',
  'help.guide.share-calendar.tip.2': 'Ga met de muis over een dag met een ring om te zien wie er vrij is en hoe lang.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas', // same-as-en
  'help.ctx.atlas.summary':
    "Atlas toont op een wereldkaart waar je bent geweest: elk land waar je met een reis bent geweest, is ingekleurd, en landen waar je was voordat je TREK gebruikte, voeg je zelf toe. Zoom in om regio's te zien, houd een bucketlist bij van plekken die je nog wilt zien, en bekijk je cijfers in het glazen paneel onderaan.",
  'help.ctx.atlas.bullet.1':
    'De kaart: elk bezocht land heeft een eigen, vaste kleur, geplande landen hebben een gestippelde rand, landen op je bucketlist zijn diagonaal gearceerd en alle andere landen zijn grijs. Beweeg de muis over een land om de reizen, plekken en het eerste en laatste bezoek te zien.',
  'help.ctx.atlas.bullet.2':
    'Zoeken bovenaan: typ een land of een plaats. Bij een land waar je nog niet bent geweest, opent een pop-up. Bij een land waar je wel bent geweest, verschijnt de kaart ervan in het paneel. Kies je een plaats, dan opent de kaart de regio ervan, zodat je die kunt markeren.',
  'help.ctx.atlas.bullet.3':
    '‘Geplande landen tonen’, rechtsboven: toont de landen van je komende reizen. De schakelaar verschijnt alleen als je zulke reizen hebt.',
  'help.ctx.atlas.bullet.4':
    "Paneel onderaan: het tabblad ‘Statistieken’ met landen (de geplande ernaast), regio's, reizen, plaatsen, steden, dagen, continenten, je reeks en de reizen van dit jaar; het tabblad ‘Bucketlist’ met de plekken die je nog wilt bezoeken; met de add-on Tochten ook een tabblad ‘Tochten’ met de afstand en de hoogtemeters van de tochten die je hebt gemaakt.",
  'help.ctx.atlas.bullet.5':
    "Regio's: zoom je ver in, dan toont de kaart staten en provincies. Klik erop om ze te markeren, de markering weg te halen of ze op de bucketlist te zetten.",
  'help.ctx.atlas.bullet.6':
    'Dawarich: is de add-on gekoppeld, dan staat links van de statistieken een paneel dat wensen als bereikt markeert en landen uit je opnames toevoegt. Dat gebeurt pas nadat je hebt bevestigd.',
  // mark-country
  'help.guide.mark-country.title': 'Een land als bezocht markeren',
  'help.guide.mark-country.goal':
    'Voeg een land toe waar je al was voordat je TREK gebruikte, zodat het op de kaart staat en meetelt.',
  'help.guide.mark-country.step.1': 'Typ het land in het zoekveld bovenaan de kaart.',
  'help.guide.mark-country.step.2':
    'Kies het uit de lijst. De kaart gaat naar het land en er opent een pop-up voor dat land.',
  'help.guide.mark-country.step.3': 'Kies ‘Markeren als bezocht’.',
  'help.guide.mark-country.result':
    'Het land krijgt een kleur op de kaart en de teller bij Landen gaat één omhoog. Die kleur blijft: markeer je meer landen, dan veranderen de kleuren van de andere landen niet.',
  'help.guide.mark-country.tip.1':
    'Klik je op de kaart op een grijs land, dan opent dezelfde pop-up. Bij kleine landen werkt zoeken betrouwbaarder.',
  'help.guide.mark-country.tip.2':
    'Een land dat je zelf markeert, telt altijd als bezocht, wat de data van je reizen erheen ook zijn.',
  // unmark-country
  'help.guide.unmark-country.title': 'Een gemarkeerd land weer weghalen',
  'help.guide.unmark-country.goal': 'Haal een land dat je zelf hebt gemarkeerd weer van de kaart.',
  'help.guide.unmark-country.step.1':
    'Zoek het land en kies het, of klik erop op de kaart. Heb je het land zelf gemarkeerd, dan vraagt de pop-up of je het wilt verwijderen.',
  'help.guide.unmark-country.step.2': 'Bevestig met Verwijderen.',
  'help.guide.unmark-country.result': 'Het land wordt weer grijs en telt niet meer mee.',
  'help.guide.unmark-country.tip.1':
    'Op deze manier kun je alleen landen verwijderen die je zelf hebt gemarkeerd. Een land met reizen of plekken blijft gemarkeerd tot die reizen of plekken zijn verwijderd. Bij een land dat je zelf hebt gemarkeerd, staat Verwijderen ook op de detailkaart in het paneel.',
  // country-details
  'help.guide.country-details.title': 'Zien wat je in een land hebt gedaan',
  'help.guide.country-details.goal': 'Open een bezocht land en ga naar de reizen waarmee je er was.',
  'help.guide.country-details.step.1': 'Typ een land waar je bent geweest in het zoekvak bovenaan de kaart.',
  'help.guide.country-details.step.2':
    "Kies het land. De kaart gaat erheen, en in het paneel onderaan verschijnt een kaart met de vlag van het land, badges voor de plaatsen, reizen en bezochte regio's, en een chip voor elk van de eerste drie reizen.",
  'help.guide.country-details.result': 'Klik op een reis om die in de planner te openen.',
  'help.guide.country-details.tip.1':
    'Ga je op de kaart met de muis over het land, dan zie je dezelfde cijfers, plus je eerste en laatste bezoek.',
  // planned-countries
  'help.guide.planned-countries.title': 'Landen tonen waar je nog heen gaat',
  'help.guide.planned-countries.goal':
    'Toon de landen van je komende reizen op de kaart zonder dat ze als bezocht meetellen.',
  'help.guide.planned-countries.step.1':
    'Zet rechtsboven ‘Geplande landen tonen’ aan. Het getal ernaast geeft aan hoeveel geplande landen er zijn.',
  'help.guide.planned-countries.step.2':
    'Zoek een gepland land en kies het: in het paneel staat Gepland, en de tooltip op de kaart toont wanneer je gaat.',
  'help.guide.planned-countries.result':
    'Geplande landen krijgen een gestippelde rand, zodat je ze nooit verwart met landen waar je al bent geweest. De schakelaar onthoudt je keuze.',
  'help.guide.planned-countries.tip.1':
    'Een land telt als bezocht zodra de reis erheen is begonnen. Een reis die nog bezig is, telt ook mee. Reizen zonder data tellen helemaal niet mee in de statistieken.',
  'help.guide.planned-countries.tip.2': 'De schakelaar is er alleen als je komende reizen hebt.',
  // regions
  'help.guide.regions.title': 'Een regio markeren',
  'help.guide.regions.goal':
    'Markeer niet alleen landen, maar ook de staten, provincies of prefecturen waar je bent geweest.',
  'help.guide.regions.step.1':
    'Zoom in op een land tot de grenzen van de staten en provincies verschijnen. Zoek je het land op en kies je het, dan zoomt de kaart ver genoeg in.',
  'help.guide.regions.step.2':
    'Klik op een regio. Beweeg je de muis over een regio, dan zie je de naam. De pop-up toont de regio en het land.',
  'help.guide.regions.step.3': 'Kies ‘Markeren als bezocht’.',
  'help.guide.regions.result':
    'De regio kleurt in met de kleur van het land. Markeer je een regio, dan telt het land ook als bezocht, als dat nog niet zo was.',
  'help.guide.regions.tip.1':
    'Klik je op een bezochte regio, dan kun je kiezen voor Verwijderen, of je de regio nu zelf hebt gemarkeerd of dat hij is toegevoegd door een plaats.',
  'help.guide.regions.tip.2':
    "Regio's waar je echte plaatsen hebt, worden automatisch gemarkeerd. Daar hoef je zelf niets voor te doen.",
  // search-place
  'help.guide.search-place.title': 'Een plek zoeken en de regio ervan markeren',
  'help.guide.search-place.goal':
    'Markeer Beieren door op München te zoeken, zonder te weten in welke regio een stad ligt.',
  'help.guide.search-place.step.1':
    'Typ een stad, bezienswaardigheid of adres in het zoekveld. Landen staan bovenaan, de passende plekken verschijnen daaronder bij Plaatsen.',
  'help.guide.search-place.step.2': 'Kies de plek. De kaart gaat erheen en zoekt uit in welke regio het punt ligt.',
  'help.guide.search-place.step.3':
    'Kies ‘Markeren als bezocht’ voor die regio, of ‘Aan bucket list toevoegen’ als je er nog niet bent geweest.',
  'help.guide.search-place.result':
    'De regio is gemarkeerd, en het land ook. Heeft het kaartpakket voor een land geen regiogegevens, dan wordt het land zelf gemarkeerd.',
  'help.guide.search-place.tip.1':
    'Plaatsen komen uit dezelfde zoekfunctie als overal in TREK, dus ze gebruiken de provider die je beheerder heeft ingesteld.',
  // bucket-country
  'help.guide.bucket-country.title': 'Een land op de bucketlist zetten',
  'help.guide.bucket-country.goal':
    'Houd op de kaart een verlanglijst van landen bij, los van de landen waar je al bent geweest.',
  'help.guide.bucket-country.step.1': 'Zoek het land en kies het, of klik erop op de kaart.',
  'help.guide.bucket-country.step.2': 'Kies ‘Aan bucket list toevoegen’.',
  'help.guide.bucket-country.step.3':
    'Kies een maand en jaar als je al weet wanneer, en bevestig met ‘Aan bucket list toevoegen’.',
  'help.guide.bucket-country.result':
    'Het land krijgt schuine strepen in de kleur die het krijgt zodra je er bent geweest, en het staat in het tabblad Bucketlist van het paneel.',
  'help.guide.bucket-country.tip.1':
    "Staat het land op de lijst, dan vind je in dezelfde pop-up 'Uit bucket list verwijderen'.",
  'help.guide.bucket-country.tip.2':
    'Eén vermelding per streefdatum: hetzelfde land kan voor twee verschillende maanden op de lijst staan, maar niet twee keer voor dezelfde maand.',
  // bucket-place
  'help.guide.bucket-place.title': 'Een plek op je bucketlist zetten',
  'help.guide.bucket-place.goal':
    'Bewaar een stad, bezienswaardigheid of adres dat je wilt bezoeken, met coördinaten en een streefdatum.',
  'help.guide.bucket-place.step.1': 'Open in het paneel onderaan het tabblad Bucketlist.',
  'help.guide.bucket-place.step.2': 'Klik op ‘Plaats toevoegen’.',
  'help.guide.bucket-place.step.3':
    'Typ de naam en klik op de zoekknop; kies de juiste treffer, dan krijgt de plek coördinaten. Je kunt ook alleen een naam typen en het zoeken overslaan.',
  'help.guide.bucket-place.step.4': 'Kies eventueel een maand en een jaar en klik op Toevoegen.',
  'help.guide.bucket-place.result':
    'De plaats staat bovenaan je bucketlist met de streefdatum. Ga er met de muis overheen om het × te zien waarmee je hem verwijdert.',
  'help.guide.bucket-place.tip.1':
    'Dawarich kan een wens later alleen afvinken als die coördinaten heeft. Dat gebeurt zodra je opnames laten zien dat je er bent geweest.',
  // stats
  'help.guide.stats.title': 'Je statistieken bekijken',
  'help.guide.stats.goal': 'Ontdek wat de getallen in het paneel tellen, en wat niet.',
  'help.guide.stats.step.1':
    "‘Landen’ is het aantal verschillende landen waar je echt bent geweest. Geplande landen staan onder het getal en tellen niet mee. ‘Regio's’ telt de staten en provincies waar je bent geweest. ‘Reizen’, ‘Plaatsen’ en ‘Dagen’ zijn totalen over al je reizen. ‘Steden’ wordt berekend uit de adressen van je plaatsen en is dus een schatting.",
  'help.guide.stats.step.2':
    'Bij de continenten zie je de bezochte landen per continent. Antarctica verschijnt in de rij zodra je er bent geweest. Daarna volgen je reeks (opeenvolgende jaren met minstens één reis) en hoeveel reizen je dit jaar hebt gemaakt.',
  'help.guide.stats.result':
    'De getallen worden automatisch bijgewerkt terwijl je je reizen plant. Je hoeft hier zelf niets bij te houden.',
  'help.guide.stats.tip.1':
    "Steden worden uit de adrestekst gehaald, niet opgezocht. Een kort adres als 'Osteria Francescana, Italy', of een adres dat op een prefectuur eindigt, kan daardoor als regio meetellen in plaats van als stad.",
  'help.guide.stats.tip.2':
    'Landen die je zelf hebt gemarkeerd, tellen mee bij Landen en de continenten, maar voegen geen reizen, plaatsen of dagen toe.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Landen toevoegen uit je opnames',
  'help.guide.dawarich-countries.goal':
    'Zoek met Dawarich uit in welke landen je het afgelopen jaar bent geweest en zet de landen die je bevestigt op de kaart.',
  'help.guide.dawarich-countries.step.1':
    'Is de add-on Dawarich gekoppeld, dan verschijnt onder aan de kaart, links van de statistieken, een Dawarich-paneel met twee tegels. Klik op Landen.',
  'help.guide.dawarich-countries.step.2':
    'Het venster opent op het tabblad Landen. Klik op ‘Naar landen zoeken’: TREK leest maand voor maand de landen en steden uit je opnames van de afgelopen 12 maanden, dus dat kan even duren. Elk land dat nog niet in je Atlas staat, verschijnt in de lijst met de vlag, het aantal steden en de naam van de eerste stad. Elk land is standaard aangevinkt. Klik op een rij om het land over te slaan.',
  'help.guide.dawarich-countries.step.3':
    'Bevestig met de knop rechtsonder. Zijn er vijf rijen aangevinkt, dan staat daar ‘5 landen toevoegen’. Het venster laat zien hoeveel landen er zijn toegevoegd. Sluit je het, dan is de kaart al bijgewerkt.',
  'help.guide.dawarich-countries.result':
    'De bevestigde landen worden ingekleurd op de kaart en tellen mee bij Landen, met Dawarich als bron. De landen die je zelf hebt gemarkeerd, blijven zoals ze zijn.',
  'help.guide.dawarich-countries.tip.1':
    'Landen die de Atlas al als bezocht toont, omdat je ze zelf hebt gemarkeerd, door een reis of door een eerdere controle, worden overgeslagen, zodat je eigen markeringen nooit veranderen. Een land dat je eerder uit de Atlas hebt verwijderd, wordt weer toegevoegd als je het hier bevestigt.',
  'help.guide.dawarich-countries.tip.2':
    "Kan TREK een landnaam niet herkennen, dan staat die naam onder de rijen en valt hij niet weg. 'Opnieuw controleren' vraagt het Dawarich nog een keer. De notitie onder de lijst vermeldt dat de afgelopen 12 maanden zijn gecontroleerd. Die periode kun je niet wijzigen.",
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Wensen afvinken op basis van je opnames',
  'help.guide.dawarich-wishes.goal':
    'Ontdek welke plekken op je bucketlist je echt hebt bereikt, en markeer ze als bereikt met de datum waarop je er was.',
  'help.guide.dawarich-wishes.step.1':
    'Klik in het Dawarich-paneel onder aan de kaart, links van de statistieken, op Wensenlijst.',
  'help.guide.dawarich-wishes.step.2':
    'Het venster opent op het tabblad Wensenlijst. Klik op ‘Wensenlijst controleren’: TREK zoekt in je opnames naar elk item met coördinaten. Een wens die je hebt bereikt, staat in de lijst met hoe dichtbij je kwam, hoe lang je bleef en op welke dag, en is standaard aangevinkt. Bij een wens die je al had afgevinkt, staat ‘Al afgevinkt’. Onder de lijst staat hoeveel items geen coördinaten hebben, en ook de regel: een wens telt als bereikt binnen 250 m en na 20 minuten ter plaatse.',
  'help.guide.dawarich-wishes.step.3':
    "Bevestig met de knop rechtsonder; als er twee rijen zijn aangevinkt, staat daar '2 afvinken'. Sluit daarna het venster en open het tabblad Bucketlist in het paneel ernaast.",
  'help.guide.dawarich-wishes.result':
    "Elke wens krijgt een groen vinkje met de datum van het verblijf, niet die van vandaag. In de tooltip staat 'Afgevinkt op basis van je Dawarich-opnames'. Klik op de datum om dit ongedaan te maken.",
  'help.guide.dawarich-wishes.tip.1':
    "Voorbijrijden telt niet: je moet dicht bij de plek zijn en er een tijdje blijven. Komen meerdere verblijven in aanmerking, dan telt het langste. Een wens zonder coördinaten kan niet worden gecontroleerd, dus voeg plekken toe via de zoekfunctie in 'Plaats toevoegen', niet alleen met een naam.",
  'help.guide.dawarich-wishes.tip.2':
    'Eén controle bekijkt maximaal 50 items, te beginnen met de items die nog niet zijn afgevinkt. Zijn er meer, dan laat TREK dat weten. Een wens die al was afgevinkt, houdt zijn eigen datum.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Collecties',
  'help.ctx.collections.summary':
    'Collecties is je bibliotheek buiten je reizen: lijsten met een eigen naam met plaatsen die je hebt gevonden en wilt bewaren, elk met de status Idee, Wil heen of Bezocht, en, als Tochten aan staat, complete tochten die je uit een reis hebt bewaard. Plaatsen en tochten worden naar en uit reizen gekopieerd, nooit gekoppeld, dus een lijst en een reis beïnvloeden elkaar nooit.',
  'help.ctx.collections.bullet.1':
    'De lijstenkolom links toont je eigen lijsten, de lijsten die met je gedeeld zijn, uitnodigingen waarop je nog niet hebt gereageerd en ‘Alle opgeslagen’, waarin alles uit je eigen lijsten samenkomt. ‘Nieuwe lijst’ en het importeren van een bestand staan bovenaan.',
  'help.ctx.collections.bullet.2':
    'De kop van de geopende lijst toont de kleur, omslagfoto, beschrijving en links, de leden, en rechts ‘Bewerken’ (alleen voor de eigenaar), ‘Exporteren’ en ‘Delen’. Bij een lijst die met jou is gedeeld, staat op de knop Delen ‘Gedeeld’.',
  'help.ctx.collections.bullet.3':
    "Filterrij boven de plaatsen: de + om een plaats toe te voegen, de keuzemenu's Status, Categorie, Beoordeling en Sorteren, het vinkjespictogram voor ‘Kiezen’ en het wolkje voor ‘Importeren uit een reis’. Het labelfilter verschijnt alleen in deze rij als er geen kaart wordt getoond.",
  'help.ctx.collections.bullet.4':
    'Plaatsrijen: foto, naam en adres, labels en categorie, en rechts de statuspil. Eén klik op de pil zet de status op de volgende stap.',
  'help.ctx.collections.bullet.5':
    'Kaart rechts: een speld voor elke plaats met coördinaten. In de balk bovenaan staan ‘Kaart vergroten’ (‘Lijst tonen’ zodra de kaart het hele scherm vult), het labelfilter met de knop om labels te beheren, en het zoekvak ‘Plaatsen zoeken’. Klik op een speld om die plaats te openen.',
  'help.ctx.collections.bullet.6':
    'Detailweergave: klik op een rij voor de omslag, categorie, status, sterren, labels, beschrijving en links. Met de camera op de omslag wissel je de foto. Onderaan staan ‘Bewerken’, ‘Naar reis kopiëren’, de navigatieknop en ‘Uit lijst verwijderen’.',
  // create-list
  'help.guide.create-list.title': 'Een lijst aanmaken',
  'help.guide.create-list.goal':
    'Maak een nieuwe lijst met een naam, een kleur en een omslag, klaar om plekken aan toe te voegen.',
  'help.guide.create-list.step.1': "Klik bovenaan de zijbalk met lijsten op 'Nieuwe lijst'.",
  'help.guide.create-list.step.2':
    'Geef de lijst een naam en kies een kleur. Omslagafbeelding, beschrijving en links zijn optioneel; die kun je later toevoegen met Bewerken.',
  'help.guide.create-list.step.3': 'Klik op Aanmaken.',
  'help.guide.create-list.result':
    'De lijst opent leeg. Je kunt hem op twee manieren vullen: met ‘Plaats toevoegen’ en met ‘Importeren uit een reis’.',
  'help.guide.create-list.tip.1':
    'Als omslag kun je een eigen foto uploaden of in hetzelfde venster een foto zoeken via Unsplash.',
  // add-place
  'help.guide.add-place.title': 'Een plek toevoegen',
  'help.guide.add-place.goal':
    'Zoek een plek en sla hem in één keer op in de geopende lijst, met naam, categorie, status en notities.',
  'help.guide.add-place.step.1':
    'Klik op de + aan het begin van de filterrij boven de plaatsen. Is de lijst nog leeg, klik dan midden op de pagina op ‘Plaats toevoegen’.',
  'help.guide.add-place.step.2':
    'Typ de plaats in het zoekveld en kies een resultaat. Naam, adres en coördinaten worden dan automatisch ingevuld.',
  'help.guide.add-place.step.3':
    'Stel de status in en eventueel een categorie, een beschrijving en links, en klik dan op Toevoegen. Het venster blijft open voor de volgende plaats; met Annuleren sluit je het.',
  'help.guide.add-place.result': 'De plek staat in de lijst en, als hij coördinaten heeft, als speld op de kaart.',
  'help.guide.add-place.tip.1':
    'Vanuit een reis zet je met ‘In collectie opslaan’ in de details van een plaats of in het menu ervan een plaats uit de reis op een lijst, zonder de reis te verlaten.',
  'help.guide.add-place.tip.2':
    'De lijst moet van jou zijn, of je moet er bewerker of beheerder van zijn. Bij ‘Alle opgeslagen’ en bij een lijst die je alleen mag bekijken, staat de + er niet.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Plekken uit een reis importeren',
  'help.guide.import-from-trip.goal':
    'Zet alle plekken van een reis in één keer op een lijst, in plaats van ze een voor een op te slaan.',
  'help.guide.import-from-trip.step.1':
    "Klik in de filterrij op de importknop met de wolk en de pijl. Is de lijst nog leeg, dan staat dezelfde knop naast 'Plaats toevoegen'.",
  'help.guide.import-from-trip.step.2': 'Kies een van je reizen.',
  'help.guide.import-from-trip.step.3':
    'Vink de plaatsen aan die je wilt. Plaatsen die al op de lijst staan, zijn grijs. Plaatsen die op geen enkele dag van de reis staan, zijn vooraf geselecteerd. Staat elke plaats al op een dag, dan zijn alle nieuwe plaatsen geselecteerd. ‘Alleen nieuwe’ verbergt de plaatsen die al op de lijst staan.',
  'help.guide.import-from-trip.step.4':
    'Klik op Importeren. Op de knop staat altijd hoeveel plaatsen er worden toegevoegd.',
  'help.guide.import-from-trip.result':
    'De plekken worden met naam, adres, coördinaten, beschrijving en categorie naar de lijst gekopieerd. Aan de reis verandert niets.',
  'help.guide.import-from-trip.tip.1':
    'TREK slaat dubbele plekken met dezelfde naam of dezelfde coördinaten automatisch over, dus twee keer importeren kan geen kwaad.',
  'help.guide.import-from-trip.tip.2':
    'In de plaatsenlijst van een reis biedt de selectiemodus in plaats daarvan ‘In collectie opslaan’ voor plaatsen die je zelf uitkiest.',
  // place-status
  'help.guide.place-status.title': 'De status van een plek instellen',
  'help.guide.place-status.goal': 'Houd bij wat nog een idee is, wat op je shortlist staat en waar je al bent geweest.',
  'help.guide.place-status.step.1':
    "Klik op het statuslabel rechts in de rij van een plek. 'Idee' wordt dan 'Wil heen'.",
  'help.guide.place-status.step.2': 'Klik nog een keer voor Bezocht, en nog een keer om terug te gaan naar Idee.',
  'help.guide.place-status.result':
    'Het label en de kleur ervan veranderen meteen, en de aantallen in het statusfilter boven de lijst worden bijgewerkt.',
  'help.guide.place-status.tip.1':
    'Een status bestaat alleen in Collecties. Kopieer je een plaats naar een reis, dan gaat de status niet mee.',
  'help.guide.place-status.tip.2':
    'Vanuit een reis opent ‘In collectie opslaan’ het venster ‘In lijst opslaan’ met een statuspil voor elke lijst waarop de plaats staat, en de selectiebalk van het plaatsenpaneel heeft ‘Markeer als bezocht in je lijsten’.',
  // place-detail
  'help.guide.place-detail.title': 'Een opgeslagen plek openen',
  'help.guide.place-detail.goal':
    'Bekijk alles over een plaats en wat je ermee kunt: bewerken, naar een reis kopiëren, de weg vinden, verwijderen.',
  'help.guide.place-detail.step.1':
    'Klik op de rij van een plek. Het detailvenster opent naast de lijst en de kaart gaat naar de plek.',
  'help.guide.place-detail.step.2':
    'Onderaan staan ‘Bewerken’, ‘Naar reis kopiëren’, de navigatieknop die de plaats in een kaart-app opent, en ‘Uit lijst verwijderen’. Met de camera op de omslag vervang je de automatische foto door een eigen foto.',
  'help.guide.place-detail.result':
    'Met Bewerken wijzig je naam, categorie, labels, adres, coördinaten, beschrijving en links direct in het detailvenster.',
  'help.guide.place-detail.tip.1':
    'Heeft de plaats geen eigen afbeelding, dan wordt de omslag automatisch opgehaald. Je kunt zelf een JPG, PNG, GIF, WebP of HEIC tot 20 MB uploaden. Met de prullenbak naast de camera zet je de automatische foto terug.',
  'help.guide.place-detail.tip.2':
    'Elk lid, jij ook, kan onder de status sterren geven. Het filter Beoordeling in de filterrij gebruikt het gemiddelde.',
  // labels
  'help.guide.labels.title': 'Plekken groeperen met labels',
  'help.guide.labels.goal': 'Geef een lijst eigen labels, zoals wijken of dagen, naast de gedeelde categorieën.',
  'help.guide.labels.step.1':
    'Klik op ‘Label toevoegen’ naast de labels boven de kaart (‘Labels beheren’ zodra de lijst labels heeft). Als er geen kaart wordt getoond, staat de knop aan het eind van de filterrij.',
  'help.guide.labels.step.2':
    "Typ een naam, kies een kleur en klik op 'Label toevoegen'. In hetzelfde venster kun je bestaande labels hernoemen, een andere kleur geven of verwijderen.",
  'help.guide.labels.step.3':
    'Zet ‘Kiezen’ aan, vink de plaatsen aan en klik in de selectiebalk op ‘Label toewijzen’. Kies de labels en bevestig met ‘Label toewijzen’. Bij één plaats kun je labels ook toevoegen via ‘Bewerken’ op het detailblad.',
  'help.guide.labels.step.4':
    'Klik boven de kaart op een of meer labels om alleen plaatsen met een van die labels te tonen, in de lijst en op de kaart. Klik nog een keer op een label om het uit het filter te halen.',
  'help.guide.labels.result':
    'Plekken met labels tonen die labels op de rij. Het labelfilter is er voor elk lid, ook voor wie alleen mag kijken.',
  'help.guide.labels.tip.1':
    'Labels horen bij de lijst waarin ze zijn aangemaakt. Verplaats je een plek naar een andere lijst, dan verdwijnen de labels ervan.',
  'help.guide.labels.tip.2': 'Om labels te beheren en toe te wijzen, heb je bewerkrechten op de lijst nodig.',
  // filter-select
  'help.guide.filter-select.title': 'Plekken filteren en selecteren',
  'help.guide.filter-select.goal': 'Filter de lijst en pas veel plekken tegelijk aan.',
  'help.guide.filter-select.step.1':
    "Gebruik de keuzemenu's in de filterrij: status, categorie, minimale beoordeling en sorteervolgorde. Bij status en categorie zie je hoeveel plaatsen er bij elke keuze horen.",
  'help.guide.filter-select.step.2':
    "Klik na de keuzemenu's op het vinkjespictogram, ‘Kiezen’. Elke rij krijgt een selectievakje en er verschijnt een selectiebalk.",
  'help.guide.filter-select.step.3':
    'Vink plaatsen aan of kies ‘Alles selecteren’ voor alle plaatsen die het filter toont. Kies dan ‘Label toewijzen’, ‘Naar lijst verplaatsen’, ‘Naar lijst dupliceren’, ‘Naar reis kopiëren’ of ‘Verwijderen’. Verplaatsen en verwijderen kan alleen de eigenaar of een beheerder van de lijst.',
  'help.guide.filter-select.result':
    'De acties gelden in één keer voor de hele selectie. Met het kruisje rechts sluit je de selectiemodus.',
  'help.guide.filter-select.tip.1':
    "'Alles selecteren' selecteert alleen de plaatsen die aan het filter voldoen. Wil je iets doen met al je plaatsen met 'Wil heen'? Filter dan op 'Wil heen' en klik op 'Alles selecteren'.",
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Plekken naar een reis kopiëren',
  'help.guide.copy-to-trip.goal': 'Zet opgeslagen plekken als stops in een van je reizen.',
  'help.guide.copy-to-trip.step.1':
    'Zet Kiezen aan en vink de plekken aan, of open één plek en gebruik ‘Naar reis kopiëren’ in het detailvenster.',
  'help.guide.copy-to-trip.step.2': 'Klik in de selectiebalk op ‘Naar reis kopiëren’.',
  'help.guide.copy-to-trip.step.3': 'Kies de reis. Is de lijst lang, filter hem dan met het zoekveld.',
  'help.guide.copy-to-trip.result':
    'De plaatsen worden toegevoegd aan de plaatsenlijst van die reis, met naam, beschrijving, categorie, notities, prijs, coördinaten, foto en tags. In de collectie verandert niets.',
  'help.guide.copy-to-trip.tip.1':
    'Kijkers van een gedeelde lijst kunnen dit ook. De plaatsen worden uit de lijst gekopieerd; de lijst zelf verandert niet.',
  // share-list
  'help.guide.share-list.title': 'Een lijst met iemand delen',
  'help.guide.share-list.goal': 'Werk live samen aan een lijst met anderen op deze TREK.',
  'help.guide.share-list.step.1': 'Klik boven in je lijst op Delen.',
  'help.guide.share-list.step.2': 'Kies de gebruiker en een rol: Kijker, Bewerker of Beheerder.',
  'help.guide.share-list.step.3':
    'Klik op ‘Uitnodiging sturen’. De persoon staat op ‘in behandeling’ tot hij of zij de uitnodiging accepteert in de lijstenbalk of via de melding.',
  'help.guide.share-list.result':
    'Zodra de ander accepteert, staat de lijst bij hem of haar onder Gedeeld, en elke wijziging wordt direct gesynchroniseerd. Leden en hun rollen kun je in hetzelfde venster blijven aanpassen.',
  'help.guide.share-list.tip.1':
    'Kijkers kunnen plaatsen bekijken, beoordelen en naar hun eigen reizen kopiëren. Bewerkers kunnen plaatsen en labels toevoegen en bewerken. Beheerders kunnen ook verplaatsen en verwijderen.',
  'help.guide.share-list.tip.2':
    'Alleen de eigenaar kan mensen uitnodigen en verwijderen; een lid kan een gedeelde lijst zelf verlaten.',
  // export-list
  'help.guide.export-list.title': 'Een lijst als bestand exporteren',
  'help.guide.export-list.goal': 'Geef een lijst aan iemand op een andere TREK-server, of open hem in een kaartenapp.',
  'help.guide.export-list.step.1': 'Klik boven in de lijst op Exporteren.',
  'help.guide.export-list.step.2':
    'Kies TREK-lijst om de lijst in een andere TREK te gebruiken, met labels en status, of GPX voor OsmAnd, Organic Maps, een Garmin en andere apps die waypoints kunnen lezen.',
  'help.guide.export-list.result':
    'Het bestand wordt gedownload. Elk lid van een gedeelde lijst mag de lijst exporteren.',
  'help.guide.export-list.tip.1':
    'Een plek zonder coördinaten kan geen GPX-waypoint worden. Zulke plekken worden overgeslagen, en TREK laat weten hoeveel het er waren.',
  'help.guide.export-list.tip.2':
    "Beoordelingen, leden en geüploade foto's worden bewust niet geëxporteerd: die horen bij deze TREK, niet bij de lijst.",
  // import-file
  'help.guide.import-file.title': 'Een lijst uit een bestand importeren',
  'help.guide.import-file.goal':
    'Importeer een TREK-lijstbestand of een GPX-bestand als nieuwe lijst of in een bestaande lijst.',
  'help.guide.import-file.step.1': 'Klik in de lijstenbalk op de importknop met de uploadpijl, naast ‘Nieuwe lijst’.',
  'help.guide.import-file.step.2':
    'Kies het bestand. Voordat TREK iets importeert, zie je wat erin staat: de naam en het aantal plekken en labels.',
  'help.guide.import-file.step.3':
    'Laat ‘Nieuwe lijst’ staan en pas eventueel de naam aan, en klik op ‘Importeren’. Of kies ‘Aan een lijst toevoegen’ om de plaatsen in een lijst te zetten die je mag bewerken, en klik op ‘Aan lijst toevoegen’.',
  'help.guide.import-file.result':
    'De lijst opent met de geïmporteerde plaatsen. Bij een import in een lijst worden alleen plaatsen toegevoegd. Plaatsen die er al stonden, houden hun status, notities en labels.',
  'help.guide.import-file.tip.1':
    'Uit een GPX wordt elk waypoint met een naam een plek. Tracks zijn lijnen en worden overgeslagen, en in het voorbeeld zie je hoeveel punten dat waren.',
  'help.guide.import-file.tip.2':
    'Een bestand dat geen TREK-lijst en geen GPX is, wordt geweigerd, en TREK vertelt waarom. Kan één plek niet worden gelezen, dan wordt alleen die plek overgeslagen, niet het hele bestand.',
  // edit-list
  'help.guide.edit-list.title': 'Een lijst bewerken of verwijderen',
  'help.guide.edit-list.goal':
    'Wijzig de naam, kleur, omslag, beschrijving of links van een lijst, of verwijder de lijst.',
  'help.guide.edit-list.step.1': 'Klik boven in de lijst op Bewerken. Alleen de eigenaar ziet deze knop.',
  'help.guide.edit-list.step.2':
    'Pas aan wat je wilt en klik op ‘Opslaan’. Met de prullenbak linksonder, ‘Lijst verwijderen’, verwijder je na bevestiging de lijst met al zijn plaatsen.',
  'help.guide.edit-list.result': 'De kop bovenaan toont meteen de nieuwe kleur, omslag en beschrijving.',
  'help.guide.edit-list.tip.1':
    'Een verwijderde lijst kun je niet terughalen. Exporteer hem eerst als je een kopie wilt bewaren.',
  // all-saved
  'help.guide.all-saved.title': 'Je hele bibliotheek doorzoeken',
  'help.guide.all-saved.goal': 'Bekijk de plaatsen uit al je eigen lijsten in één keer.',
  'help.guide.all-saved.step.1':
    'Klik in de lijstenbalk op ‘Alle opgeslagen’. Je ziet dan de plaatsen van alle lijsten waarvan je eigenaar of mede-eigenaar bent in één overzicht.',
  'help.guide.all-saved.step.2':
    'Typ in ‘Plaatsen zoeken’ boven de kaart en gebruik de filters zoals bij elke lijst. ‘Kiezen’ werkt hier ook: verplaatsen, dupliceren, naar een reis kopiëren of verwijderen, over alle lijsten heen.',
  'help.guide.all-saved.result':
    'Hier zie je al je opgeslagen plaatsen bij elkaar. Je kunt hier geen plaatsen toevoegen of importeren, omdat er niet één lijst is waar ze in kunnen.',
  'help.guide.all-saved.tip.1':
    'Labels en bewaarde tochten horen bij één lijst, dus je vindt ze niet bij ‘Alle opgeslagen’.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Reisverslag',
  'help.ctx.journey.summary':
    "Reisverslag is je reisdagboek waarin foto's centraal staan. Elk reisverslag is gekoppeld aan een of meer reizen, en je vult het dag voor dag met vermeldingen met een verhaal, foto's, stemming en weer. Dit scherm toont je reisverslagen. Open er een om te schrijven.",
  'help.ctx.journey.bullet.1':
    "De banner bovenaan toont het reisverslag waar je nu mee bezig bent, of je laatste, met het aantal vermeldingen, foto's en plaatsen. ‘Verder schrijven’ opent het op vandaag. Is er net een reis afgelopen, dan staat daarboven een banner ‘Reis net afgelopen’ waarmee je van die reis een reisverslag kunt maken.",
  'help.ctx.journey.bullet.2':
    'Onder ‘Alle reisverslagen’ staat per reisverslag een kaart met omslagfoto, status, data en aantallen; het reisverslag in de banner komt daar niet nog eens terug. Klik op een kaart om het reisverslag te openen.',
  'help.ctx.journey.bullet.3':
    'Met de laatste kaart in het raster, ‘Nieuw reisverslag aanmaken’, begin je een nieuw reisverslag op basis van je reizen.',
  // create-journey
  'help.guide.create-journey.title': 'Een reisverslag aanmaken',
  'help.guide.create-journey.goal':
    'Begin een reisverslag voor een reis, met de plaatsen van de reis al als suggesties erin.',
  'help.guide.create-journey.step.1': "Klik op 'Nieuw reisverslag aanmaken', de laatste kaart in het overzicht.",
  'help.guide.create-journey.step.2':
    'Geef het een naam en eventueel een ondertitel, en vink de reizen aan waar het bij hoort. De teller laat zien hoeveel plaatsen er worden toegevoegd.',
  'help.guide.create-journey.step.3': 'Klik op ‘Reisverslag aanmaken’.',
  'help.guide.create-journey.result':
    'Het reisverslag opent. Elke plek uit de gekoppelde reizen staat als suggestie in de tijdlijn, één keer voor elke dag waarop hij gepland is. Je kunt voor elke suggestie een vermelding schrijven.',
  'help.guide.create-journey.tip.1': 'Meer reizen kun je later koppelen via Reisverslaginstellingen.',
  'help.guide.create-journey.tip.2': 'Een reisverslag zonder reizen kan ook. Je voegt de vermeldingen dan zelf toe.',
  // open-journey
  'help.guide.open-journey.title': 'Een reisverslag openen',
  'help.guide.open-journey.goal': 'Open een reisverslag en zie waar het opent.',
  'help.guide.open-journey.step.1':
    "Klik op een kaart. Op elke kaart zie je de omslag, de data en hoeveel vermeldingen, foto's en plaatsen het reisverslag bevat.",
  'help.guide.open-journey.result':
    'Een reisverslag dat nog loopt, opent op vandaag, of op de laatste vermelding vóór vandaag als je voor vandaag nog niets hebt geschreven. Een afgerond reisverslag opent bij het begin.',
  'help.guide.open-journey.tip.1':
    'De omslag is de eerste foto van het reisverslag, tenzij je zelf een omslag kiest in Reisverslaginstellingen.',
  // continue-writing
  'help.guide.continue-writing.title': 'Verdergaan met het lopende reisverslag',
  'help.guide.continue-writing.goal': 'Open direct de pagina van vandaag in het reisverslag van je huidige reis.',
  'help.guide.continue-writing.step.1':
    "Klik bovenaan in de banner op 'Verder schrijven'. Daar staat het reisverslag waar je mee bezig bent, of het nieuwste als je met geen enkel bezig bent.",
  'help.guide.continue-writing.result':
    'Het reisverslag opent bij vandaag, of bij de laatste vermelding vóór vandaag als je vandaag nog niets hebt geschreven.',
  'help.guide.continue-writing.tip.1':
    'Is een reis net afgelopen, dan staat er boven deze banner een banner ‘Reis net afgelopen’: ‘Reisverslag aanmaken’ start een reisverslag met die reis aangevinkt, ‘Sluiten’ verbergt het aanbod in deze browser.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Reisverslag',
  'help.ctx.journey-detail.summary':
    "Eén geopend reisverslag: links de tijdlijn, dag voor dag, en rechts de kaart met lagen die je aan en uit kunt zetten voor de planning, wat je hebt opgenomen, de vermeldingen en de foto's. De kop toont de aantallen, Studio, de schakelaar voor suggesties en ⋯ voor Reisverslaginstellingen. Met de werkbalk daaronder voeg je vermeldingen toe.",
  'help.ctx.journey-detail.bullet.1':
    "Bovenaan: de terugpijl en de statusbadge, de omslag, titel en ondertitel, het aantal dagen, plaatsen, vermeldingen en foto's, en rechts Studio, het oog waarmee je de suggesties verbergt of toont, en ⋯ voor Reisverslaginstellingen.",
  'help.ctx.journey-detail.bullet.2':
    'Werkbalk: de tabbladen Tijdlijn en Galerij, ‘Zoeken in deze reis’ en ‘Vermelding toevoegen’. Op Galerij staat ‘Uploaden’ in plaats van ‘Vermelding toevoegen’.',
  'help.ctx.journey-detail.bullet.3':
    "Tijdlijn: per dag een onderdeel met het dagnummer, het aantal plaatsen en een + om een vermelding op die dag toe te voegen. Daaronder de vermeldingen met foto's, stemming, weer en verhaal, en de gestippelde suggesties uit de reizen, elk met een × om ze weg te klikken.",
  'help.ctx.journey-detail.bullet.4':
    "Kaart: met de lagenbalk bovenaan zet je Planning (holle markeringen en de gestippelde GPX-routes van de reizen), Opgenomen (doorgetrokken routes uit Dawarich), Vermeldingen (markeringen in de kleuren van de dagen, op datum verbonden door een dunne stippellijn) en Foto's aan of uit. De (i) ernaast legt alle symbolen uit.",
  'help.ctx.journey-detail.bullet.5':
    "Reisverslaginstellingen (⋯): omslagfoto, naam en ondertitel, status, GPX-tracks, vastgelegde dagen, plaatsen uit foto's, invoervelden, genegeerde suggesties, gesynchroniseerde reizen, bijdragers en welke leden van een reis toegang krijgen, openbaar delen, archiveren en verwijderen.",
  'help.ctx.journey-detail.bullet.6':
    'Onderaan een lange tijdlijn vind je ‘Terug naar boven’, een dagteller waarmee je naar elke dag of vermelding springt, en ‘Naar de laatste notitie’.',
  // add-entry
  'help.guide.add-entry.title': 'Een vermelding schrijven',
  'help.guide.add-entry.goal': 'Voeg het verhaal van een dag toe, met titel, tekst, stemming en weer.',
  'help.guide.add-entry.step.1':
    'Klik in de werkbalk op ‘Vermelding toevoegen’, of op de + helemaal rechts in een dagkop om op die dag te beginnen.',
  'help.guide.add-entry.step.2':
    'Geef de vermelding een titel en schrijf je tekst. Met de werkbalk boven de tekst voeg je in Markdown vet, cursief, koppen, citaten, links en lijsten toe.',
  'help.guide.add-entry.step.3':
    'Controleer in de rechterkolom de datum en tijd, zoek een locatie of gebruik je huidige positie, en kies een stemming en het weer.',
  'help.guide.add-entry.step.4': 'Klik op Opslaan.',
  'help.guide.add-entry.result':
    'De vermelding staat op de juiste dag in de tijdlijn en als speld op de kaart. De aantallen bovenaan worden bijgewerkt.',
  'help.guide.add-entry.tip.1': 'Schrijf je in een suggestie, dan gebruik je dezelfde editor, met de plek al ingevuld.',
  'help.guide.add-entry.tip.2':
    'Bij een vermelding met een plaats heb je de optie ‘Weglaten uit de route’: de vermelding blijft in het reisverslag, maar telt niet mee voor de afstand of de landen en staat niet op de kaart in Studio.',
  // entry-photos
  'help.guide.entry-photos.title': "Foto's en video's aan een vermelding toevoegen",
  'help.guide.entry-photos.goal': "Voeg foto's toe aan een dag. De eerste foto wordt de omslag van de vermelding.",
  'help.guide.entry-photos.step.1': 'Open het menu van een vermelding met de ⋯ op de kaart en kies Bewerken.',
  'help.guide.entry-photos.step.2':
    "Klik op ‘Foto's uploaden’ en kies de bestanden. ‘Uit galerij’ gebruikt foto's die al in de galerij van het reisverslag staan. ‘External photos’ zoekt in een gekoppelde Immich- of Synology-bibliotheek naar foto's van die dag.",
  'help.guide.entry-photos.step.3':
    'Beweeg de muis over een foto en klik op ‘Maak 1e’ om de omslag te kiezen. Klik daarna op Opslaan.',
  'help.guide.entry-photos.result':
    "De foto's staan op de kaart en in de galerij; de eerste foto is overal de miniatuur.",
  'help.guide.entry-photos.tip.1':
    "Video's voeg je op dezelfde manier toe aan een item: mp4, m4v, webm of mov tot 500 MB. Ze worden ongewijzigd opgeslagen.",
  'help.guide.entry-photos.tip.2':
    'HEIC-bestanden van een iPhone worden bij het uploaden omgezet naar JPEG. Daarbij gaan de GPS- en cameragegevens verloren.',
  // suggestions
  'help.guide.suggestions.title': 'Suggesties gebruiken of negeren',
  'help.guide.suggestions.goal':
    'Maak van de plekken uit je reizen vermeldingen, en negeer de plekken waarover je niet gaat schrijven.',
  'help.guide.suggestions.step.1':
    'Een suggestie is een kaart met een gestippelde rand en een knop ‘Vermelding toevoegen’: een plaats uit een gekoppelde reis op de dag waarop die gepland was. Klik erop om de editor te openen met de plaats en de dag al ingevuld.',
  'help.guide.suggestions.step.2':
    'Klik op de × rechts op een kaart die je niet gaat gebruiken. De kaart verdwijnt uit de tijdlijn maar wordt niet verwijderd, en de reissynchronisatie stelt hem niet opnieuw voor.',
  'help.guide.suggestions.step.3':
    'Toch van gedachten veranderd? Open Reisverslaginstellingen via ⋯ bovenaan: ‘Verworpen suggesties terughalen’ toont hoeveel het er zijn en haalt ze allemaal terug.',
  'help.guide.suggestions.result':
    'De tijdlijn toont alleen de vermeldingen die je wilt schrijven. Met het oog in de kop verberg je tijdens het lezen alle suggesties tegelijk.',
  'help.guide.suggestions.tip.1':
    'Een plek die op twee dagen gepland staat, levert op elk van die dagen een suggestie op.',
  'help.guide.suggestions.tip.2': 'Suggesties tellen nooit mee in de statistieken, alleen geschreven vermeldingen.',
  // add-on-day
  'help.guide.add-on-day.title': 'Een item op een eerdere dag toevoegen',
  'help.guide.add-on-day.goal': 'Schrijf over een dag in het verleden, zonder achteraf de datum te hoeven aanpassen.',
  'help.guide.add-on-day.step.1': 'Klik op de + helemaal rechts in de kop van die dag.',
  'help.guide.add-on-day.step.2': 'De editor opent met die datum al ingesteld. Schrijf en sla op zoals altijd.',
  'help.guide.add-on-day.result': 'De vermelding staat meteen bij de juiste dag.',
  'help.guide.add-on-day.tip.1':
    'Wil je de volgorde binnen een dag wijzigen, ga dan met de muis over een vermelding: links verschijnen ‘Omhoog’ en ‘Omlaag’.',
  // pros-cons
  'help.guide.pros-cons.title': 'Een oordeel toevoegen',
  'help.guide.pros-cons.goal': 'Vat een dag samen met wat geweldig was en wat niet.',
  'help.guide.pros-cons.step.1':
    'In de editor vind je ‘Voor- & nadelen’ onder het verhaal. Typ een punt bij Voordelen of Nadelen en gebruik ‘Nog een toevoegen’ voor het volgende.',
  'help.guide.pros-cons.step.2':
    'Sla op. Op de kaart opent ‘Meer tonen’ het verhaal en het oordeel als twee korte lijstjes.',
  'help.guide.pros-cons.result': 'Duim omhoog en duim omlaag staan onder het verhaal, zodat je ze snel ziet.',
  'help.guide.pros-cons.tip.1':
    "Gebruik je in een reisverslag geen oordelen, dan kun je dat onderdeel uitzetten onder 'Velden van het item' in Reisverslaginstellingen.",
  // search-journey
  'help.guide.search-journey.title': 'Iets vinden in een lang reisverslag',
  'help.guide.search-journey.goal': 'Vind een vermelding zonder door weken aan vermeldingen te scrollen.',
  'help.guide.search-journey.step.1':
    'Typ in ‘Zoeken in deze reis’ in de werkbalk. De tijdlijn wordt gefilterd terwijl je typt, op titels, verhalen, plekken en tags. Accenten en hoofdletters maken niet uit.',
  'help.guide.search-journey.step.2':
    'Wil je liever naar een dag springen? Klik dan onderaan de tijdlijn op het aantal dagen, tussen ‘Terug naar boven’ en ‘Naar de laatste notitie’.',
  'help.guide.search-journey.result':
    'De tijdlijn scrolt naar de dag of vermelding die je hebt gekozen, en de kaart gaat ernaartoe. Je ziet alleen de vermeldingen die overeenkomen, tot je het zoekveld leegmaakt.',
  'help.guide.search-journey.tip.1':
    'Een lopend reisverslag opent op de pagina van vandaag, dus meestal zie je de huidige pagina al.',
  'help.guide.search-journey.tip.2':
    'Met het oog bovenaan verberg je de suggesties, zodat je alleen de vermeldingen ziet die je zelf hebt geschreven.',
  // gallery-map
  'help.guide.gallery-map.title': 'Door de galerij en de kaart bladeren',
  'help.guide.gallery-map.goal': "Bekijk het hele reisverslag als foto's, en als plekken op de kaart.",
  'help.guide.gallery-map.step.1':
    "Kies Galerij in de werkbalk. Daar zie je alle foto's van alle vermeldingen, plus de foto's die rechtstreeks in de galerij zijn geüpload. Klik op een foto om hem groot te bekijken.",
  'help.guide.gallery-map.step.2':
    "Met ‘Uploaden’ rechts voeg je foto's toe aan de galerij. Is Immich of Synology gekoppeld, dan kies je via een knop met de naam van de bibliotheek foto's daaruit.",
  'help.guide.gallery-map.result':
    'Spelden hebben de kleur van hun dag en zijn op datumvolgorde verbonden met een dunne stippellijn. Met de lagenbalk bovenaan de kaart kies je wat er wordt getoond.',
  'help.guide.gallery-map.tip.1':
    'De GPX-tracks van een reis staan als gestippelde lijnen op de laag ‘Planning’ van de kaart. Met ‘Alle GPX-tracks van reizen tonen’ in Reisverslaginstellingen zet je ze uit.',
  'help.guide.gallery-map.tip.2':
    "Galerijfoto's met een locatie verschijnen ook op de openbare kaart, als zowel Galerij als Kaart gedeeld zijn.",
  // entry-fields
  'help.guide.entry-fields.title': 'Velden van een vermelding uitzetten',
  'help.guide.entry-fields.goal': 'Toon in de editor alleen de velden die dit reisverslag gebruikt.',
  'help.guide.entry-fields.step.1': 'Klik op ⋯ rechtsboven in de kop om ‘Reisverslaginstellingen’ te openen.',
  'help.guide.entry-fields.step.2': 'Zet onder ‘Velden van het item’ Stemming, Weer of ‘Plus- en minpunten’ uit.',
  'help.guide.entry-fields.result':
    'De editor toont deze velden niet meer. Wat je hebt geschreven, gaat niet verloren: zet je een veld weer aan, dan zie je de opgeslagen gegevens terug. In een gedeeld reisverslag zijn dezelfde velden verborgen.',
  'help.guide.entry-fields.tip.1':
    'De schakelaars gelden per reisverslag, dus een werkreis en een vakantie kunnen verschillen.',
  // link-trip
  'help.guide.link-trip.title': 'Nog een reis koppelen',
  'help.guide.link-trip.goal': 'Voeg de plaatsen van een tweede reis als suggesties toe aan het reisverslag.',
  'help.guide.link-trip.step.1': 'Klik rechtsboven op ⋯ om Reisverslaginstellingen te openen.',
  'help.guide.link-trip.step.2': 'Klik onder Gesynchroniseerde reizen op ‘Reis toevoegen’.',
  'help.guide.link-trip.step.3': 'Zoek de reis op naam of bestemming en klik ernaast op ‘Koppelen’.',
  'help.guide.link-trip.result':
    'De plaatsen verschijnen als suggesties op hun dagen in de tijdlijn en worden met de GPX-tracks toegevoegd aan de laag ‘Planning’ van de kaart.',
  'help.guide.link-trip.tip.1':
    'Met de prullenbak naast een gekoppelde reis ontkoppel je die, na een bevestiging. Vermeldingen die je hebt geschreven, blijven staan.',
  'help.guide.link-trip.tip.2':
    'Vermeldingen met een dag tellen maar één keer mee, ook als meerdere reizen die dag omvatten.',
  // share-public
  'help.guide.share-public.title': 'Het reisverslag openbaar delen',
  'help.guide.share-public.goal': 'Geef mensen zonder TREK-account een link waarmee ze alleen kunnen lezen.',
  'help.guide.share-public.step.1': 'Open Reisverslaginstellingen via ⋯ bovenaan en scrol naar ‘Openbaar delen’.',
  'help.guide.share-public.step.2': 'Klik op ‘Deellink aanmaken’.',
  'help.guide.share-public.step.3':
    'Kies wat bezoekers te zien krijgen: Tijdlijn, Galerij en Kaart. Onder Kaart voeg je met ‘Reisplanning’ de geplande plaatsen en routes toe, en met ‘Opgenomen routes’ de routes van de dagen die je hebt opgenomen. Met ‘Kopiëren’ kopieer je de link naar je klembord.',
  'help.guide.share-public.result':
    'Iedereen met de link ziet de onderdelen die aanstaan en verder niets. Velden die je bij ‘Velden van het item’ hebt uitgezet, blijven daar ook verborgen.',
  'help.guide.share-public.tip.1':
    "Foto's verschijnen alleen op de openbare kaart als Galerij en Kaart allebei aanstaan. Staat Kaart uit, dan verwijdert de server de coördinaten voordat de foto's worden verstuurd.",
  'help.guide.share-public.tip.2': 'Klik op ‘Link verwijderen’ naast ‘Kopiëren’ om te stoppen met delen.',
  // contributors
  'help.guide.contributors.title': 'Samen schrijven',
  'help.guide.contributors.goal': "Laat een medereiziger eigen vermeldingen en foto's toevoegen.",
  'help.guide.contributors.step.1': 'Open ‘Reisverslaginstellingen’ via ⋯ in de kop en zoek ‘Bijdragers’.',
  'help.guide.contributors.step.2': "Klik op 'Bijdrager uitnodigen' en zoek de gebruiker op naam of e-mailadres.",
  'help.guide.contributors.step.3': 'Kies ‘Kijker’ of ‘Bewerker’ en klik op ‘Uitnodigen’.',
  'help.guide.contributors.result':
    'Het reisverslag verschijnt in hun lijst en hun vermeldingen tonen hun naam. Klik op de × naast een bijdrager om die te verwijderen.',
  'help.guide.contributors.tip.1': 'Bijdragers zijn mensen op deze TREK. Voor alle anderen is er de openbare link.',
  // studio
  'help.guide.studio.title': 'Het reisverslag opmaken als fotoboek',
  'help.guide.studio.goal': "Maak van het reisverslag afdrukbare pagina's.",
  'help.guide.studio.step.1': 'Klik bovenaan op Studio. De ontwerper opent over het reisverslag heen.',
  'help.guide.studio.step.2': 'Wil je terug? Klik op × aan de rechterkant van de bovenbalk. Je komt terug waar je was.',
  'help.guide.studio.result':
    'Links staan de balk en zijn panelen, op het werkblad de dubbele pagina en rechts de eigenschappen. Automatische opmaak bouwt het boek op uit je vermeldingen. Exporteren maakt een drukklare PDF.',
  'help.guide.studio.tip.1':
    'Studio heeft een venster van minstens 1024 px breed nodig en is niet beschikbaar op een telefoon.',
  'help.guide.studio.tip.2':
    'Voor het boek gelden dezelfde rechten als voor het reisverslag: wie het reisverslag kan lezen, kan het boek openen, en wie het reisverslag kan bewerken, kan het boek opslaan.',
  // archive-journey
  'help.guide.archive-journey.title': 'Een reisverslag archiveren of verwijderen',
  'help.guide.archive-journey.goal': 'Sluit een afgerond reisverslag af, of verwijder er een definitief.',
  'help.guide.archive-journey.step.1': 'Klik op ⋯ rechtsboven in de kop om ‘Reisverslaginstellingen’ te openen.',
  'help.guide.archive-journey.step.2':
    "Onderaan sluit 'Reis archiveren' het reisverslag af en markeert het als gearchiveerd; met 'Reis herstellen' zet je het terug. 'Verwijderen' verwijdert het, met alle items en foto's, nadat je dat hebt bevestigd.",
  'help.guide.archive-journey.result':
    'Een gearchiveerd reisverslag blijft leesbaar en deelbaar. Het opent alleen niet meer op de dag van vandaag.',
  'help.guide.archive-journey.tip.1':
    'Verwijderen kun je niet ongedaan maken, en het heeft geen invloed op de reizen waaraan het reisverslag was gekoppeld.',
  'help.guide.archive-journey.tip.2': 'De omslag, de naam en de ondertitel staan bovenaan in hetzelfde venster.',
  'help.guide.journey-status.title': 'De status van een reisverslag instellen',
  'help.guide.journey-status.goal':
    'Markeer een reisverslag zelf als concept, live of voltooid, in plaats van de data van de reizen te volgen.',
  'help.guide.journey-status.step.1':
    'Klik op ⋯ rechtsboven in de kop van het reisverslag om ‘Reisverslaginstellingen’ te openen.',
  'help.guide.journey-status.step.2':
    'Kies onder Status voor Concept, Live of Voltooid. De keuze wordt meteen opgeslagen.',
  'help.guide.journey-status.result':
    'Het reisverslag houdt de status die je hebt gekozen: ‘Concept’ en ‘Voltooid’ staan als badge op de kaart en in de kop, en een reisverslag dat ‘Live’ is, staat in de banner bovenaan de lijst met reisverslagen.',
  'help.guide.journey-status.tip.1':
    'Met Automatisch gelden weer de data van de gekoppelde reizen. Zonder gekoppelde reis blijft een automatisch reisverslag een concept.',
  'help.guide.journey-status.tip.2':
    'Een status die je zelf hebt ingesteld, blijft staan tot je hem wijzigt, ook als de data van de reis veranderen.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'Met TREK Studio maak je van een reisverslag een fotoboek dat je kunt laten drukken. Studio opent boven het reisverslag: links de balk met zijn panelen, in het midden de dubbele pagina waaraan je werkt en rechts de eigenschappen ervan. Automatische opmaak maakt een eerste opzet op basis van je vermeldingen, een thema geeft het boek zijn kleuren en lettertypen, en de assistent kan samen met jou pagina’s ontwerpen. Daarna kun je alles verplaatsen, bijsnijden en anders opmaken, en elke stap ongedaan maken.',
  'help.ctx.journey-studio.bullet.1':
    'Bovenbalk: links de omslag en de naam van het reisverslag. Rechts wie er nog meer in het boek zit en of het is opgeslagen, het paginaformaat, ongedaan maken, opnieuw en plakken, Automatische opmaak, de assistent, help, Exporteren en de knop waarmee je Studio sluit.',
  'help.ctx.journey-studio.bullet.2':
    'Balk links: Pagina’s, Inhoud (de foto’s en vermeldingen van het reisverslag), Lay-outs, Elementen (tekst, vormen, lijnen, kaders, iconen en stickers), Reis (cijfers, kaarten, landen en markeringen op basis van het reisverslag) en, apart daaronder, Thema en Lagen.',
  'help.ctx.journey-studio.bullet.3':
    'Werkblad: de huidige dubbele pagina met afloop en veilige marges, met eronder de zoombalk met Passend maken, Boekweergave en Deze dubbele pagina downloaden.',
  'help.ctx.journey-studio.bullet.4':
    'Eigenschappen rechts: alles over het geselecteerde element, van positie, grootte en uitsnede tot kleuren, effecten, stapelvolgorde en vergrendeling. Is er niets geselecteerd, dan toont het paneel de paginaachtergrond, het thema, de paginanummers en het document.',
  'help.ctx.journey-studio.bullet.5':
    'Het boek is opgebouwd als een gedrukt boek: omslag, een losse eerste pagina tegenover de lege binnenkant van de omslag, de dubbele pagina’s, een losse laatste pagina en de achterkant. De paginanummers tellen vanaf de eerste pagina en worden afgedrukt zoals je ze ziet.',
  'help.ctx.journey-studio.bullet.6':
    'Meerdere mensen kunnen tegelijk ontwerpen: iedereen ziet de cursors van de anderen met hun naam. Sla je een versie op die iemand anders heeft gewijzigd, dan meldt TREK een conflict in plaats van diens werk te overschrijven.',
  'help.ctx.journey-studio.bullet.7':
    'Thema: één look voor het hele boek, met papier, inkt en drie accenten, lettertypen en motieven. Elementen die aan het thema zijn gekoppeld, volgen het als je het wijzigt.',
  'help.ctx.journey-studio.bullet.8':
    'Assistent: waar een beheerder AI heeft ingesteld, opent de spraakwolk in de bovenbalk een assistent die samen met jou pagina’s opmaakt, bijschriften schrijft en het boek anders vormgeeft. Elke wijziging van de assistent is een stap die je ongedaan kunt maken.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Het boek automatisch laten opbouwen',
  'help.guide.studio-auto-layout.goal':
    "Krijg met één klik een complete eerste opzet op basis van de vermeldingen en foto's uit het reisverslag.",
  'help.guide.studio-auto-layout.step.1': "Klik in de bovenste balk op 'Auto layout'.",
  'help.guide.studio-auto-layout.step.2':
    "Kies 'Het hele boek': dat vervangt alle pagina's en behoudt je titel en pagina-instellingen. 'Deze pagina' bouwt alleen de dubbele pagina op het scherm opnieuw op. Die optie is er alleen bij een dubbele pagina die op basis van een vermelding is gemaakt.",
  'help.guide.studio-auto-layout.step.3':
    "Blader door de paginabalk. Vond je de vorige versie beter, dan draai je met 'Ongedaan maken' de hele lay-out terug.",
  'help.guide.studio-auto-layout.result':
    "Per vermelding een dubbele pagina, op volgorde, met de foto's, de titel en de tekst al voor je geplaatst. Elk element blijft aan de vermelding gekoppeld en wordt mee bijgewerkt, tot je het zelf bewerkt.",
  'help.guide.studio-auto-layout.tip.1': 'Beide opties kun je gewoon ongedaan maken, dus probeer ze gerust uit.',
  'help.guide.studio-auto-layout.tip.2':
    'Koppelt de automatische opmaak een element aan een vermelding, dan wordt het element bijgewerkt als je die vermelding bewerkt. Wijzig je het element in Properties, dan vervalt de koppeling.',
  // studio-pages
  'help.guide.studio-pages.title': "Dubbele pagina's toevoegen, verplaatsen en verwijderen",
  'help.guide.studio-pages.goal': 'Werk het boek pagina voor pagina uit.',
  'help.guide.studio-pages.step.1':
    'Open Pagina’s in de balk. De miniaturen tonen het boek op volgorde: omslag, eerste pagina, dubbele pagina’s, laatste pagina en achterkant. De eerste en de laatste pagina staan naast de lege binnenkant van hun omslag getekend, zoals het gebonden boek opengaat.',
  'help.guide.studio-pages.step.2':
    "'Pagina toevoegen' onderaan voegt een nieuwe dubbele pagina toe vóór de laatste pagina. Met de + tussen twee miniaturen voeg je er een in op die plek.",
  'help.guide.studio-pages.step.3':
    'Beweeg de muis over een miniatuur om de acties te zien: ‘Naar voren’, ‘Naar achteren’, ‘Pagina dupliceren’ en ‘Pagina verwijderen’. Klik op een miniatuur om die dubbele pagina op het werkblad te openen.',
  'help.guide.studio-pages.result':
    "De voorkant, de eerste en laatste pagina en de achterkant blijven waar ze zijn. Nieuwe dubbele pagina's komen altijd daartussen.",
  'help.guide.studio-pages.tip.1':
    '‘Book view’ in de bovenbalk toont het hele boek als vellen, zoals het gebonden wordt.',
  'help.guide.studio-pages.tip.2':
    'Paginanummers zet je aan onder ‘Document’ in Properties, terwijl er niets is geselecteerd.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Een lay-out op een dubbele pagina toepassen',
  'help.guide.studio-layouts.goal':
    "Geef een dubbele pagina een kant-en-klare indeling met kaders voor foto's en tekst.",
  'help.guide.studio-layouts.step.1':
    'Open Lay-outs in de balk. Eerst komen ontworpen pagina’s: hele omslagen en dubbele pagina’s in het thema van het boek, die je met de stijlchips tot één look beperkt. Mijn indelingen en Standaard volgen daaronder, in hetzelfde raster.',
  'help.guide.studio-layouts.step.2':
    "Klik op een opmaak. De dubbele pagina op het werkblad krijgt de kaders van die opmaak, en je bestaande foto's en tekst worden erin geplaatst.",
  'help.guide.studio-layouts.result':
    'Lege kaders zijn plaatshouders voor inhoud: sleep er een foto uit Inhoud naartoe, of gebruik ‘Add to this page’.',
  'help.guide.studio-my-layouts.title': 'Een pagina als eigen indeling opslaan',
  'help.guide.studio-my-layouts.goal':
    'Gebruik een indeling opnieuw die je op andere pagina’s van het boek hebt gemaakt.',
  'help.guide.studio-my-layouts.step.1': 'Richt een pagina in zoals je wilt en open dan Lay-outs in de balk.',
  'help.guide.studio-my-layouts.step.2':
    'Klik onder Mijn indelingen op Deze pagina als indeling opslaan. De pagina verschijnt als kaart in de lijst.',
  'help.guide.studio-my-layouts.tip.1':
    'Klik op je indeling op een andere pagina om die pagina op dezelfde manier in te delen, met haar eigen foto’s en teksten.',
  'help.guide.studio-my-layouts.result':
    'Je indelingen worden met het boek opgeslagen en aangeboden op pagina’s van hetzelfde soort: die van een omslag voor omslagen, die van een dubbele pagina voor dubbele pagina’s.',
  'help.guide.studio-layouts.tip.1': 'Een opmaak kun je net als elke andere stap ongedaan maken.',
  // studio-content
  'help.guide.studio-content.title': "Foto's en vermeldingen op een pagina zetten",
  'help.guide.studio-content.goal': "Zet de foto's en items van het reisverslag zelf op de dubbele pagina.",
  'help.guide.studio-content.step.1':
    "Open Content in de zijbalk. Onder Foto's staan alle foto's van het reisverslag, onder Vermeldingen de vermeldingen met hun tekst.",
  'help.guide.studio-content.step.2':
    "Sleep een foto naar de dubbele pagina of naar een leeg kader, of klik eronder op ‘Aan deze pagina toevoegen’. Met ‘Foto's uploaden’ voeg je foto's toe die nog niet in het reisverslag staan. Met ‘Uit Immich’ of ‘Uit Synology’ kies je ze uit een gekoppelde bibliotheek.",
  'help.guide.studio-content.step.3':
    "Onder een vermelding zetten Title, Story en Place die tekst als tekstelement op de pagina. Datum en de coördinaten worden als markeringen toegevoegd, en de foto's van de vermelding staan daar ook.",
  'help.guide.studio-content.result':
    'Een foto die je erin sleept, wordt een foto-element. Tekst blijft aan de vermelding gekoppeld tot je hem bewerkt.',
  'help.guide.studio-theme.title': 'Het boek een thema geven',
  'help.guide.studio-theme.goal': 'Stel de kleuren en lettertypen van het hele boek in één keer in.',
  'help.guide.studio-theme.step.1':
    'Open Thema in de balk. Elke kaart toont een thema als een kleine pagina: het papier, het lettertype en de drie accentkleuren.',
  'help.guide.studio-theme.step.2':
    'Klik op een thema om het uit te proberen. Onder de kaarten kun je het palet wijzigen, andere lettertypen kiezen en motieven en versiering kiezen.',
  'help.guide.studio-theme.step.3':
    'Klik op Op het boek toepassen, of op Op deze pagina toepassen voor de dubbele pagina op het scherm.',
  'help.guide.studio-theme.tip.1':
    'Elementen die aan het thema zijn gekoppeld, nemen de kleuren en lettertypen over en volgen mee als je het wijzigt. Ook restylen wat nog niet gekoppeld is koppelt eerst de rest.',
  'help.guide.studio-theme.tip.2': 'Kleuren uit de foto’s maakt een palet van de beelden van het reisverslag.',
  'help.guide.studio-theme.result':
    'Alle gekoppelde kleuren en lettertypen in het boek veranderen tegelijk, en het toepassen van het thema is één stap ongedaan maken.',
  'help.guide.studio-content.tip.1': 'Het zoekveld boven in Inhoud filtert beide lijsten.',
  'help.guide.studio-content.tip.2':
    'Sleep je een bestand van je bureaublad naar het werkblad, dan uploadt TREK het en plaatst het in één keer.',
  // studio-elements
  'help.guide.studio-elements.title': 'Tekst, vormen, iconen en stickers toevoegen',
  'help.guide.studio-elements.goal': "Versier een dubbele pagina, naast foto's en verhalen.",
  'help.guide.studio-elements.step.1':
    'Open Elementen in de balk. Zes tabs sorteren wat je kunt toevoegen: Tekst, Vormen, Lijnen, Kaders, Iconen en Stickers.',
  'help.guide.studio-elements.step.2':
    'Klik op een tekststijl of een ontworpen titel, een vorm, een lijn, een leeg kader, een icoon of een sticker. Elk element komt in het midden van de dubbele pagina te staan en daarna kun je het verplaatsen.',
  'help.guide.studio-elements.result':
    'Dubbelklik op een tekstelement om erin te typen. In Properties vind je lettertype, dikte, grootte, spatiëring en uitlijning.',
  'help.guide.studio-stickers.title': 'Versieren met stickers',
  'help.guide.studio-stickers.goal': 'Voeg illustraties toe, van bezienswaardigheden en eten tot dieren en pijlen.',
  'help.guide.studio-stickers.step.1': 'Open Elementen in de balk en kies Stickers.',
  'help.guide.studio-stickers.step.2':
    'Zoek op een woord of blader door de schappen en klik dan op een sticker om hem op de dubbele pagina te plaatsen.',
  'help.guide.studio-stickers.tip.1':
    'Is een sticker geselecteerd, dan kleurt Eigenschappen de onderdelen om en spiegelt je hem.',
  'help.guide.studio-stickers.result': 'De sticker is een tekening, dus hij blijft scherp op elke grootte.',
  'help.guide.studio-elements.tip.1': "Kaders zijn lege plekken voor foto's: je zet er later een foto in.",
  // studio-travel
  'help.guide.studio-travel.title': 'Kaarten, cijfers, landen en markeringen toevoegen',
  'help.guide.studio-travel.goal': 'Maak van het reisverslag zelf ontworpen elementen op de pagina.',
  'help.guide.studio-travel.step.1':
    'Open Reis in de balk. Vier tabs sorteren wat je kunt toevoegen: Cijfers, Kaarten, Landen en Markeringen.',
  'help.guide.studio-travel.step.2':
    'Elke kaart toont het element met de eigen cijfers van je reisverslag, in de kleuren van het thema: een samenvatting als poster, ticket, verkeersbord of kilometerteller, een kaart met genummerde stops of bijgesneden op een land, een land als stempel, ansichtkaart of speld, een datum of afstand als stempel, label of lint.',
  'help.guide.studio-travel.step.3':
    'Klik op een kaart. Het element komt in het midden van de dubbele pagina te staan en daarna kun je het verplaatsen en de grootte aanpassen.',
  'help.guide.studio-travel.result':
    'Het element verschijnt op de dubbele pagina. Eigenschappen wijzigt de look ervan, en elk cijfer, elke kaart en elk land wordt bijgewerkt als het reisverslag verandert.',
  'help.guide.studio-text-effects.title': 'Effecten aan tekst toevoegen',
  'help.guide.studio-text-effects.goal':
    'Geef een kop een contour, een schaduw, een kromming of letters gevuld met een patroon.',
  'help.guide.studio-text-effects.step.1': 'Klik op een tekstelement op de pagina om het te selecteren.',
  'help.guide.studio-text-effects.step.2':
    'Open in Eigenschappen Effecten om een contour, een schaduw of een markering toe te voegen, of vul de letters met een verloop of een patroon. Hoofdletters en positie kromt de regel en maakt hem passend voor zijn kader.',
  'help.guide.studio-text-effects.tip.1':
    'Passend maken verkleint de tekst tot hij in zijn kader past, zodat een lange titel nooit overloopt.',
  'help.guide.studio-text-effects.result': 'Het effect wordt met de tekst getekend, in druk net als op het scherm.',
  'help.guide.studio-background.title': 'De paginaachtergrond wijzigen',
  'help.guide.studio-background.goal':
    'Geef de pagina een kleur, een verloop of een patroon, of leg er een foto onder.',
  'help.guide.studio-background.step.1':
    'Klik op een lege plek van de pagina zodat er niets is geselecteerd. Paginaachtergrond staat bovenaan in Eigenschappen.',
  'help.guide.studio-background.step.2':
    'Kies Papier, Effen, Verloop of Patroon en een kleur, of klik onder Foto als achtergrond op een foto.',
  'help.guide.studio-background.tip.1':
    'Op alle pagina’s toepassen geeft elke pagina van het boek dezelfde achtergrond.',
  'help.guide.studio-background.result':
    'De achtergrond loopt door in de afloop, dus hij wordt tot aan de rand van de pagina gedrukt.',
  'help.guide.studio-layers.title': 'Ordenen, verbergen en vergrendelen met lagen',
  'help.guide.studio-layers.goal': 'Zie alles op de dubbele pagina in stapelvolgorde en werk het daar bij.',
  'help.guide.studio-layers.step.1': 'Open Lagen in de balk. Bovenaan de lijst staat de voorkant van de pagina.',
  'help.guide.studio-layers.step.2':
    'Sleep een rij om de volgorde te wijzigen, verberg een element met het oog en houd het op zijn plek met het slot. Selecteer er meerdere en groepeer ze om ze samen te verplaatsen.',
  'help.guide.studio-layers.tip.1': 'Dubbelklik op een rij om het element een eigen naam te geven.',
  'help.guide.studio-layers.tip.2': 'Verborgen elementen komen niet in de PDF.',
  'help.guide.studio-layers.result':
    'Drukke pagina’s blijven makkelijk te bewerken, en afgewerkte onderdelen kunnen niet per ongeluk worden verschoven.',
  'help.guide.studio-travel.tip.1':
    'Onder Kaarten toont Stops elke stop van de route. Zet er een uit om hem weg te laten uit de kaarten en cijfers, bijvoorbeeld je thuisvliegveld.',
  'help.guide.studio-travel.tip.2':
    'Een landkaart toont alleen de stops van dat land, zodat het land de pagina vult, ook als het reisverslag met een lange vlucht begon.',
  // studio-properties
  'help.guide.studio-properties.title': 'Je selectie bewerken',
  'help.guide.studio-properties.goal': 'Verplaats, snijd bij, geef stijl aan en stapel een element met de inspector.',
  'help.guide.studio-properties.step.1':
    'Klik op een element op de dubbele pagina. Er verschijnen grepen om het formaat en de draaiing te wijzigen. Sleep het element om het te verplaatsen.',
  'help.guide.studio-properties.step.2':
    'Rechts toont Properties de instellingen van het geselecteerde onderdeel: positie en grootte, Crop met het focuspunt dat bepaalt wat binnen het kader blijft, Fill of Fit, Look-filters, Corner radius, de stijl van het kader, de stapelvolgorde en Lock.',
  'help.guide.studio-properties.step.3':
    "Dupliceren en Verwijderen staan bovenaan het eigenschappenpaneel. Met 'Ongedaan maken' in de bovenste balk draai je elk van deze wijzigingen terug.",
  'help.guide.studio-properties.result':
    'Een vergrendeld element kun je op de pagina niet selecteren of verplaatsen. Zo blijft een afgeronde opmaak intact terwijl je aan de andere elementen werkt.',
  'help.guide.studio-properties.tip.1':
    'Met Shift-klik selecteer je meerdere elementen; in het eigenschappenpaneel bewerk je ze dan samen.',
  'help.guide.studio-properties.tip.2':
    'Bewerk je een element dat de automatische opmaak heeft geplaatst, dan is het niet meer aan de vermelding gekoppeld en volgt het latere wijzigingen in die vermelding niet meer.',
  // studio-format
  'help.guide.studio-format.title': 'Het paginaformaat kiezen',
  'help.guide.studio-format.goal': 'Stel het drukformaat van het boek in voordat je de opmaak bouwt.',
  'help.guide.studio-format.step.1':
    'Klik in de bovenbalk naast de bewerkingsgereedschappen op het paginaformaat. Het toont de naam en de vorm van het formaat.',
  'help.guide.studio-format.step.2':
    'Kies Square 21 × 21 cm, Square 30 × 30 cm, A4 of A5 liggend of staand, of vul zelf een breedte en hoogte in millimeters in. Afloop en veilige marge staan eronder.',
  'help.guide.studio-format.result':
    'Elke dubbele pagina wordt op dat formaat getekend, standaard met 3 mm afloop en een veilige marge van 5 mm.',
  'help.guide.studio-format.tip.1':
    "Wijzig eerst het formaat en start dan 'Auto layout'. 'Auto layout' gebruikt het formaat dat op dat moment is ingesteld.",
  'help.guide.studio-format.tip.2':
    'Vraag je drukkerij welke waarden ze voor afloop en veilige marge gebruiken en vul die in.',
  // studio-export
  'help.guide.studio-export.title': 'Het boek exporteren als PDF',
  'help.guide.studio-export.goal': 'Maak een drukklaar bestand, of een bestand om op het scherm te lezen.',
  'help.guide.studio-export.step.1': 'Klik in de bovenste balk op Export.',
  'help.guide.studio-export.step.2':
    "Kies 'Losse pagina's', één pagina per vel op leesvolgorde, wat een drukkerij nodig heeft, of Spreads, steeds twee pagina's zoals het boek openvalt. Snijtekens voegen aan elke rand de afloop toe en geven aan waar gesneden moet worden.",
  'help.guide.studio-export.step.3':
    "Klik op Afdrukweergave. Je browser opent de pagina's. Kies 'Opslaan als PDF' om het bestand te maken.",
  'help.guide.studio-export.result':
    'Een PDF met zoveel vellen als het venster aangaf, in het paginaformaat dat je hebt ingesteld.',
  'help.guide.studio-export.tip.1': 'De PDF kun je alleen op een computer maken, net als Studio zelf.',
  'help.guide.studio-export.tip.2':
    'Voor een proefdruk exporteer je ‘Spreads’ zonder snijtekens, voor de drukkerij ‘Losse pagina’s’ met snijtekens.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Een dubbele pagina hergebruiken in een ander boek',
  'help.guide.studio-spread-file.goal':
    'Neem een ontwerp dat je mooi vindt over van het boek van het ene reisverslag naar dat van een ander.',
  'help.guide.studio-spread-file.step.1':
    "Zet de dubbele pagina op het werkblad en klik rechts in de zoombalk op 'Deze dubbele pagina downloaden'. Het bestand bevat het ontwerp, niet de foto's.",
  'help.guide.studio-spread-file.step.2':
    "Open in het andere boek Pages, klik op Importeren naast 'Pagina toevoegen' en kies het bestand.",
  'help.guide.studio-spread-file.result':
    "De dubbele pagina wordt geïmporteerd met de kaders en tekststijlen. Sleep de foto's van het nieuwe reisverslag in de kaders.",
  'help.guide.studio-spread-file.tip.1':
    'Is een bestand geen ontwerp van een dubbele pagina, dan weigert TREK het en zie je waarom.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Instellingen',
  'help.ctx.settings.summary':
    'Je persoonlijke instellingen, met in de zijbalk links een tabblad per onderwerp. De meeste schakelaars werken meteen. Een formulier met een knop ‘Opslaan’ wordt pas opgeslagen als je op ‘Opslaan’ klikt. Niets hier verandert TREK voor anderen.',
  'help.ctx.settings.bullet.1':
    'Zijbalk links: Weergave, Weergave, Kaart, Meldingen, Integraties, Offline en Account. Plugins verschijnt zodra er een plugin actief is. Over verschijnt, tenzij de beheerder van de server het heeft verborgen. Onderaan staat de versie.',
  'help.ctx.settings.bullet.2':
    'Weergave opent als eerste. Daar vind je de taal, de taal van plaatsnamen, eenheden, tijdnotatie, de eerste dag van de week en de weergavevaluta, en hoe de reiskaart werkt. Onder Weergave staan thema, kleuren, leesbaarheid, tekstgrootte en de dashboardwidgets.',
  'help.ctx.settings.bullet.3':
    '‘Kaart’ stelt de kaartengine en de stijl in; ‘Meldingen’ bepaalt welke gebeurtenissen naar welk kanaal gaan; ‘Integraties’ koppelt fotobibliotheken, AirTrail, Dawarich en wanderer en bevat API-sleutels en MCP; ‘Offline’ bepaalt wat dit apparaat opslaat.',
  'help.ctx.settings.bullet.4':
    'Onder Account vind je je profiel, wachtwoord, tweefactorauthenticatie, passkeys en de optie om je account te verwijderen.',
  'help.ctx.settings-display.title': 'Weergave',
  'help.ctx.settings-display.summary':
    'Waarmee TREK opent, welke taal en eenheden het gebruikt, en hoe de reiskaart en boekingen werken. Elke wijziging gaat direct in.',
  'help.ctx.settings-display.bullet.1':
    'Opstarten: ‘Startpagina’ opent het Dashboard of de ‘Actieve reis’; kies je ‘Actieve reis’, dan bepaal je met ‘Starttabblad’ op welk tabblad die reis opent.',
  'help.ctx.settings-display.bullet.2':
    'Taal en regio: ‘Weergavevaluta’ (of ‘Valuta van de reis’ om niet om te rekenen), ‘Taal’, ‘Plaatsnamen’, ‘Temperatuureenheid’, ‘Afstandseenheid’, ‘Tijdnotatie’ en ‘Week begint op’.',
  'help.ctx.settings-display.bullet.3':
    'Reis en kaart: ‘Plekken openen in’, ‘Datum eerst in dagkoppen’, ‘Routelabels voor boekingen’, ‘Boekingsroutes altijd tonen’, ‘Compacte markeringen voor ongeplande plaatsen’, ‘Plaatsen op de kaart ontdekken’, ‘Boekingscodes vervagen’ en ‘Route optimaliseren vanaf accommodatie’.',
  'help.ctx.settings-appearance.title': 'Weergave',
  'help.ctx.settings-appearance.summary':
    'Hoe TREK er voor dit account uitziet: licht of donker, de accentkleur, glas en animaties, de tekstgrootte, en welke widgets het dashboard toont. Alles wordt meteen toegepast, op elk apparaat waarop je inlogt.',
  'help.ctx.settings-appearance.bullet.1':
    'Thema: Kleurmodus (Licht, Donker of Automatisch), het kleurenschema en, bij Aangepast, je eigen accentkleur voor de lichte en donkere modus, met een contrastcontrole.',
  'help.ctx.settings-appearance.bullet.2':
    'Leesbaarheid, gemarkeerd als Experimenteel: Transparantie, ‘Beweging verminderen’, Dichtheid en Tekstgrootte, met één schuifregelaar voor Alles en één voor elk van Groot, Gemiddeld, Normaal en Klein.',
  'help.ctx.settings-appearance.bullet.3':
    'Dashboardwidgets: aparte schakelaars voor Desktop (‘Onder de hero’, ‘Rechter zijbalk’) en Mobiel (‘Onder de hero’, ‘Onderaan de pagina’).',
  'help.ctx.settings-appearance.bullet.4':
    '‘Standaardwaarden herstellen’, onder de kaarten, zet het hele tabblad terug naar de standaardwaarden.',
  'help.ctx.settings-map.title': 'Kaart',
  'help.ctx.settings-map.summary':
    'Welke engine de kaarten van de reisplanner en het reisverslag tekent, en in welke stijl. Leaflet is de klassieke rasterkaart, Mapbox GL voegt met je eigen token 3D-gebouwen en terrein toe, MapLibre GL tekent zonder token vectortegels van OpenFreeMap. Atlas gebruikt altijd Leaflet.',
  'help.ctx.settings-map.bullet.1':
    'Kaartprovider: Leaflet, Mapbox GL (Experimenteel) of MapLibre GL, elk met een korte beschrijving.',
  'help.ctx.settings-map.bullet.2':
    '‘Kaartsjabloon’ en ‘CARTO API-sleutel’ voor Leaflet; ‘Kaartstijl’ voor de twee GL-engines, plus het Mapbox Access Token voor Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Alleen bij Mapbox GL: ‘3D-gebouwen & terrein’ en ‘Hoge kwaliteit modus’. Boven ‘Kaart opslaan’ zie je een live voorbeeld. Met ‘Kaart opslaan’ sla je je keuze op.',
  'help.ctx.settings-notifications.title': 'Meldingen',
  'help.ctx.settings-notifications.summary':
    'Hoe TREK je buiten de app bereikt. Bovenaan bepaalt een tabel, met een rij per gebeurtenis en een kolom per kanaal, wat waarheen wordt gestuurd. Daaronder staan de kaarten voor de webhook, ntfy, pushmeldingen op dit apparaat en eventuele kanalen van plugins.',
  'help.ctx.settings-notifications.bullet.1':
    'Meldingen: zet elke gebeurtenis per kanaal aan of uit. Een slotje betekent dat de beheerder die voor iedereen heeft uitgezet.',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook-URL: een webhook voor Discord, Slack of een eigen webhook, met ‘Testen’ en ‘Opslaan’.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: ‘Ntfy-onderwerp’, optioneel ‘Ntfy-server-URL’ en ‘Access Token’, met ‘Testen’ en ‘Opslaan’.',
  'help.ctx.settings-notifications.bullet.4':
    '‘Pushmeldingen op dit apparaat’: ‘Inschakelen op dit apparaat’ geldt alleen voor deze browser; ‘Test versturen’ stuurt een testmelding. Een pluginkanaal toont ‘Instellen’ tot het is ingesteld.',
  'help.ctx.settings-integrations.title': 'Integraties',
  'help.ctx.settings-integrations.summary':
    'Alles wat van buitenaf met TREK verbinding maakt: fotobibliotheken voor het reisverslag, AirTrail voor vluchten, Dawarich voor waar je echt bent geweest, wanderer voor trails, alleen-lezen API-sleutels voor andere software, en MCP voor AI-clients. Een koppeling met een andere dienst verschijnt pas als de beheerder die heeft aangezet.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich en Synology Photos, AirTrail, Dawarich en wanderer: elke kaart heeft een adres en sleutel, ‘Opslaan’ en ‘Verbinding testen’, en een badge ‘Verbonden’ of ‘Niet verbonden’.',
  'help.ctx.settings-integrations.bullet.2':
    'API-sleutels: sleutels voor de openbare API die alleen kunnen lezen, elk beperkt tot de onderdelen die je kiest, met het Eindpunt om te kopiëren.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP-configuratie: het MCP-eindpunt, en onder OAuth 2.1-clients je geregistreerde clients, de Clientconfiguratie om te kopiëren en de Actieve OAuth-sessies met ‘Intrekken’.',
  'help.ctx.settings-integrations.bullet.4':
    'API-tokens: de oude manier om met MCP te verbinden, gemarkeerd als Verouderd. Gebruik in plaats daarvan OAuth 2.1-clients.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Wat TREK op dit apparaat bewaart zodat je een reis ook zonder verbinding kunt openen, en wat er gebeurt als een offline wijziging botst met een wijziging die ergens anders is gedaan.',
  'help.ctx.settings-offline.bullet.1':
    'Offlinemodus: ‘Offlinemodus forceren’ downloadt eerst alles, werkt daarna alleen nog vanuit de cache en zet je wijzigingen in de wachtrij.',
  'help.ctx.settings-offline.bullet.2':
    'Voorbereiden op offline: ‘Downloaden voor offline gebruik’ haalt reisgegevens, documenten en kaarttegels op. Met ‘Nu opnieuw synchroniseren’ synchroniseer je handmatig.',
  'help.ctx.settings-offline.bullet.3':
    'Wat offline opslaan: ‘Kaarttegels offline opslaan’ en een schakelaar per reis. Een afgelopen reis wordt alleen opgeslagen als je de schakelaar aanzet.',
  'help.ctx.settings-offline.bullet.4':
    'Synchronisatieconflicten verschijnt alleen als twee wijzigingen met elkaar botsen, met ‘De mijne’, ‘Die van de server behouden’ en ‘Wanneer er een conflict optreedt’. Offline cache telt de reizen en de wijzigingen die nog wachten of zijn mislukt, met ‘Opnieuw proberen’, ‘Verwerpen’ en ‘Cache wissen’.',
  'help.ctx.settings-account.title': 'Account', // same-as-en
  'help.ctx.settings-account.summary':
    'Je account op deze TREK en hoe je inlogt: profielfoto, gebruikersnaam en e-mail, wachtwoord, tweestapsverificatie en passkeys. ‘Account verwijderen’ staat onderaan de kaart Account.',
  'help.ctx.settings-account.bullet.1':
    'Account: klik op de camera bij de foto om er een te uploaden, en op de rode prullenbak om hem te verwijderen. Gebruikersnaam en E-mail sla je op met ‘Profiel opslaan’.',
  'help.ctx.settings-account.bullet.2':
    'Wachtwoord wijzigen: het huidige wachtwoord, twee keer het nieuwe, waarbij de regels worden afgevinkt terwijl je typt, en dan ‘Wachtwoord bijwerken’. Logt deze TREK alleen via SSO in, dan zie je deze kaart niet.',
  'help.ctx.settings-account.bullet.3':
    'Tweefactorauthenticatie (2FA) met een authenticator-app en back-upcodes; passkeys om zonder wachtwoord in te loggen.',
  'help.ctx.settings-account.bullet.4':
    '‘Account verwijderen’ staat links onderaan de kaart Account en vraagt om bevestiging. De enige beheerder kan zichzelf niet verwijderen.',
  // language-region
  'help.guide.language-region.title': 'Taal, eenheden en valuta instellen',
  'help.guide.language-region.goal': 'Gebruik TREK in je eigen taal en met de notaties van je regio.',
  'help.guide.language-region.step.1':
    'Kies onder Taal en regio een Taal uit de rij knoppen. TREK schakelt meteen over, op elk apparaat waarop je inlogt.',
  'help.guide.language-region.step.2':
    'Met Plaatsnamen stel je de taal in voor het zoeken naar plaatsen, suggesties en adressen. ‘Zelfde als de app’ volgt de taal van de app.',
  'help.guide.language-region.result':
    'Data, afstanden en bedragen staan in de notatie die je gewend bent. In Onkosten worden bedragen alleen ter weergave in je weergavevaluta getoond; de ingevoerde bedragen veranderen niet.',
  'help.guide.language-region.tip.1': '‘Valuta van de reis’ toont elke reis in de eigen valuta, zonder om te rekenen.',
  'help.guide.language-region.tip.2':
    'De taal bepaalt ook de namen van dagen en maanden in Vakantie en in het reisverslag.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'De reiskaart en dagkoppen aanpassen',
  'help.guide.travel-map-prefs.goal': 'Bepaal voor al je reizen wat de reiskaart toont en hoe de dagkoppen eruitzien.',
  'help.guide.travel-map-prefs.step.1':
    'Bij Reis en kaart bepaal je met ‘Plekken openen in’ welke kaart-app de navigatieknop meteen opent. Met ‘Elke keer vragen’ kies je elke keer zelf een app. ‘Datum eerst in dagkoppen’ zet de kalenderdatum vooraan in elke dagkop.',
  'help.guide.travel-map-prefs.step.2':
    '‘Boekingsroutes altijd tonen’ toont elke vlucht, trein en andere boeking op de kaart. ‘Routelabels voor boekingen’ zet de naam van het station of de luchthaven aan beide uiteinden. ‘Compacte markeringen voor ongeplande plaatsen’ maakt de plaatsen die nog niet op een dag staan kleiner, zodat de geplande stops beter opvallen.',
  'help.guide.travel-map-prefs.result':
    'De reiskaart gebruikt deze instellingen bij elke reis, tot je ze weer wijzigt.',
  'help.guide.travel-map-prefs.tip.1':
    'Deze instellingen gelden per account, niet per reis. Leden van een gedeelde reis zien elk hun eigen keuzes.',
  'help.guide.travel-map-prefs.tip.2':
    'Een beheerder kan de standaardwaarden voor iedereen instellen; wat je hier aanpast, geldt voor jou.',
  // startup
  'help.guide.startup.title': 'Kiezen waarmee TREK opent',
  'help.guide.startup.goal': 'Open TREK op de pagina die je het meest gebruikt, in plaats van steeds op het dashboard.',
  'help.guide.startup.step.1':
    'Zet bovenaan Weergave, onder ‘Opstarten’, de ‘Startpagina’ op Dashboard of ‘Actieve reis’.',
  'help.guide.startup.step.2': 'Bij ‘Actieve reis’ verschijnt ‘Starttabblad’: kies het tabblad waarop die reis opent.',
  'help.guide.startup.result': 'De volgende keer dat je TREK opent, ga je direct naar die pagina.',
  'help.guide.startup.tip.1':
    'De actieve reis is de reis die vandaag loopt, of anders de eerstvolgende. Het is dezelfde reis die bovenaan het dashboard staat.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Thema en accentkleur instellen',
  'help.guide.theme-scheme.goal':
    'Maak TREK licht, donker of laat het je apparaat volgen, in de kleur die jij mooi vindt.',
  'help.guide.theme-scheme.step.1':
    'Zet onder ‘Thema’ de ‘Kleurmodus’ op Licht, Donker of Automatisch. Automatisch volgt je apparaat.',
  'help.guide.theme-scheme.step.2':
    'Kies een ‘Color scheme’: Default, High contrast, Indigo, Teal, Rose, Amber, Violet of Custom.',
  'help.guide.theme-scheme.step.3':
    'Kies bij ‘Aangepast’ een van de kleurstippen, of stel apart een eigen accentkleur in voor Licht en Donker. De pil ernaast toont ‘Goed contrast’ of ‘Laag contrast’.',
  'help.guide.theme-scheme.result':
    'Knoppen, links en markeringen krijgen overal de accentkleur, op elk apparaat waarop je inlogt.',
  'help.guide.theme-scheme.tip.1':
    'In de navigatiebalk kun je ook snel wisselen tussen licht en donker; dat stelt hetzelfde thema in.',
  'help.guide.theme-scheme.tip.2': "Kies het schema 'High contrast' als de standaardweergave lastig leesbaar is.",
  // readability
  'help.guide.readability.title': 'Leesbaarheid en tekstgrootte aanpassen',
  'help.guide.readability.goal': 'Kies voor minder glaseffect en beweging, meer ruimte of grotere tekst.',
  'help.guide.readability.step.1':
    'Onder ‘Readability’ maakt ‘Transparency’ van de glazen panelen dichte vlakken, beperkt ‘Reduce motion’ animaties tot een minimum en kies je bij ‘Density’ tussen ‘Comfortable’ en ‘Compact’.',
  'help.guide.readability.step.2':
    'Tekstgrootte: sleep ‘Alles’ om alle tekst tegelijk te vergroten of te verkleinen, of stel Groot, Gemiddeld, Normaal en Klein apart in. Bij elke grootte staat een voorbeeld, zodat je meteen ziet wat er verandert.',
  'help.guide.readability.result':
    'De wijziging geldt meteen voor de hele app, ook voor de kaartpanelen en het reisverslag.',
  'help.guide.readability.tip.1':
    'Sommige onderdelen van TREK tonen al minder animaties als je apparaat is ingesteld op minder beweging. ‘Beweging verminderen’ vermindert de animaties in de overige onderdelen.',
  'help.guide.readability.tip.2':
    'De tekstgrootte werkt via de typografische niveaus, dus er wordt niets afgekapt. Tekst die niet meer past, loopt door op de volgende regel.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'De widgets op het dashboard kiezen',
  'help.guide.dashboard-widgets.goal': 'Toon alleen de widgets die je gebruikt, apart voor desktop en telefoon.',
  'help.guide.dashboard-widgets.step.1':
    'Onder Dashboardwidgets staan bij Desktop de widgets ‘Onder de hero’ en ‘Rechter zijbalk’. Zet je ‘Rechter zijbalk’ uit, dan verdwijnt de hele kolom en staat het dashboard in het midden. De widgets ervan zijn gedimd tot je de zijbalk weer aanzet.',
  'help.guide.dashboard-widgets.step.2':
    'Voor het dashboard op je telefoon heeft Mobiel eigen schakelaars: ‘Onder de hero’ en ‘Onderaan de pagina’.',
  'help.guide.dashboard-widgets.result':
    'Het dashboard verandert meteen. Staat de rechterzijbalk uit, dan wordt het dashboard gecentreerd.',
  'help.guide.dashboard-widgets.tip.1':
    'Widgets van een add-on zie je alleen zolang de beheerder die add-on heeft aangezet.',
  'help.guide.dashboard-widgets.tip.2':
    'Het dashboard onthoudt per apparaat zelf of je de raster- of lijstweergave gebruikt, en in welke volgorde je sorteert.',
  // map-provider
  'help.guide.map-provider.title': 'Kaartweergave en stijl kiezen',
  'help.guide.map-provider.goal': 'Wissel tussen de klassieke kaart, vectortegels en de 3D-kaart van Mapbox.',
  'help.guide.map-provider.step.1':
    'Kies onder ‘Kaartprovider’ voor Leaflet voor de klassieke 2D-kaart met elke soort rastertegels, Mapbox GL voor vectortegels met 3D-gebouwen en terrein, of MapLibre GL voor vectortegels van OpenFreeMap zonder token.',
  'help.guide.map-provider.step.2':
    'Kies een ‘Kaartsjabloon’ voor Leaflet of een ‘Kaartstijl’ voor een GL-engine, of plak je eigen URL. Mapbox GL heeft een Mapbox Access Token nodig, CARTO-sjablonen een CARTO API-sleutel; de link onder elk veld laat zien waar je die krijgt.',
  'help.guide.map-provider.step.3':
    'Zet bij Mapbox GL ‘3D-gebouwen & terrein’ aan en, als je apparaat snel genoeg is, ook ‘Hoge kwaliteit modus’. Bekijk het voorbeeld en klik op ‘Kaart opslaan’.',
  'help.guide.map-provider.result':
    'De reisplanner en de kaarten van het reisverslag gebruiken de kaartmotor die je hebt gekozen. Atlas gebruikt altijd Leaflet.',
  'help.guide.map-provider.tip.1': 'Zonder token gebruikt Mapbox GL Leaflet, in plaats van een lege kaart te tonen.',
  'help.guide.map-provider.tip.2':
    'De kaarttegels die je offline opslaat, komen van de provider die actief is op het moment dat je ze downloadt.',
  // notification-channels
  'help.guide.notification-channels.title': 'Instellen waar je meldingen krijgt',
  'help.guide.notification-channels.goal':
    'Ontvang reisherinneringen en meldingen over samenwerking op je telefoon of in een andere tool.',
  'help.guide.notification-channels.step.1':
    'Plak voor een webhook een Discord-, Slack- of eigen URL bij ‘Webhook-URL’, klik op ‘Testen’ en daarna op ‘Opslaan’.',
  'help.guide.notification-channels.step.2':
    'Vul voor ntfy het ‘Ntfy-onderwerp’ in, en voeg je eigen ‘Ntfy-server-URL’ en een Access Token toe als je zelf een server draait. ‘Testen’ stuurt meteen een bericht; ‘Opslaan’ slaat de instellingen op.',
  'help.guide.notification-channels.step.3':
    'Zet in de kaart ‘Meldingen’ bovenaan elke gebeurtenis per kanaal aan of uit. Een slotje betekent dat de beheerder die voor iedereen heeft uitgezet. Een pluginkanaal toont ‘Instellen’ tot het is ingesteld; met ‘Test versturen’ probeer je het uit.',
  'help.guide.notification-channels.result':
    'Gebeurtenissen worden verstuurd via de kanalen die je ervoor hebt aangezet. De kolom ‘In-app’ bepaalt wat er bij het belletje in de navigatiebalk verschijnt.',
  'help.guide.notification-channels.tip.1':
    'De Herinnering van een reis zelf, dus hoeveel dagen voor vertrek, stel je in via het bewerkformulier van die reis.',
  'help.guide.notification-channels.tip.2':
    'De beheerder kan voor iedereen een standaard ntfy-server invullen. Je eigen topic kies je nog steeds zelf.',
  // photo-providers
  'help.guide.photo-providers.title': 'Een fotobibliotheek koppelen',
  'help.guide.photo-providers.goal': "Laat het reisverslag de foto's van de dag ophalen uit Immich of Synology Photos.",
  'help.guide.photo-providers.step.1':
    "Zoek onder Integraties de kaart van Immich of Synology Photos en vul in wat er gevraagd wordt: de Server-URL en een API-sleutel voor Immich, of een gebruikersnaam en wachtwoord voor Synology Photos. Immich kan foto's die je in een reisverslag uploadt ook naar de Immich-bibliotheek kopiëren.",
  'help.guide.photo-providers.step.2':
    'Klik op ‘Verbinding testen’ en daarna op ‘Opslaan’. Op de badge staat nu ‘Verbonden’.',
  'help.guide.photo-providers.result':
    "Op het tabblad ‘External photos’ van de editor wordt in de gekoppelde bibliotheek gezocht naar foto's van de dag van de vermelding, met de foto's die het dichtst bij de locatie zijn genomen bovenaan.",
  'help.guide.photo-providers.tip.1':
    'De koppeling geldt alleen voor jouw account: andere leden van een reisverslag koppelen hun eigen bibliotheek.',
  'help.guide.photo-providers.tip.2':
    "Een provider zonder GPS-gegevens in de foto's werkt ook. De lijst wordt dan op tijd gesorteerd.",
  // api-keys
  'help.guide.api-keys.title': 'Een API-sleutel aanmaken',
  'help.guide.api-keys.goal': 'Laat andere software je reizen lezen via de openbare API.',
  'help.guide.api-keys.step.1':
    'Klik onder ‘API-sleutels’ op ‘Sleutel aanmaken’, geef de sleutel een ‘Naam’ waaruit blijkt waar hij voor is, en laat onder ‘Wat deze sleutel mag lezen’ alleen de onderdelen aan die hij nodig heeft. Klik op ‘Aanmaken’.',
  'help.guide.api-keys.step.2':
    'Kopieer de sleutel uit ‘API-sleutel aangemaakt’: hij wordt maar één keer getoond. Klik op ‘Klaar’. Het ‘Eindpunt’ dat je aanroept, staat onder de lijst.',
  'help.guide.api-keys.result':
    'Software met de sleutel kan de gekozen onderdelen lezen en nooit iets wijzigen. De lijst toont wanneer elke sleutel is aangemaakt en voor het laatst is gebruikt, en met de prullenbak verwijder je hem.',
  'help.guide.api-keys.tip.1':
    'Gebruik per tool een eigen sleutel. Dan kun je een sleutel intrekken zonder dat de andere tools daar last van hebben.',
  'help.guide.api-keys.tip.2':
    'Wil je een AI-client dingen laten wijzigen, gebruik dan MCP met OAuth. API-sleutels kunnen alleen lezen.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Een AI-assistent koppelen via MCP',
  'help.guide.mcp-oauth.goal': 'Geef Claude, een IDE of een andere MCP-client toegang tot je reizen.',
  'help.guide.mcp-oauth.step.1': 'Kopieer onder MCP-configuratie het MCP-eindpunt voor je client.',
  'help.guide.mcp-oauth.step.2':
    "Klik onder OAuth 2.1-clients op ‘Nieuwe client’ en kies een snelle voorinstelling zoals Claude Desktop of Cursor, of vul zelf de Toepassingsnaam, Redirect-URI's en Toegestane rechten in. Voor een server zonder browser kies je Machine client. Klik op ‘Client registreren’ en kopieer het Clientgeheim: dat wordt maar één keer getoond.",
  'help.guide.mcp-oauth.step.3':
    'Elke client heeft ‘Geheim vernieuwen’ en ‘Client verwijderen’. ‘Actieve OAuth-sessies’ toont de ingelogde clients, met ‘Intrekken’. ‘Clientconfiguratie’ klapt open en toont een kant-en-klaar fragment voor clients die JSON gebruiken.',
  'help.guide.mcp-oauth.result':
    'De client kan namens jou lezen en wijzigen wat de rechten toestaan, en elke actie verschijnt onder jouw naam.',
  'help.guide.mcp-oauth.tip.1':
    'Rechten bepalen wat een client mag: geef een client alleen leesrechten tot hij meer nodig heeft.',
  'help.guide.mcp-oauth.tip.2': 'De beheerder kan MCP voor de hele instantie uitzetten. Dan zie je dit onderdeel niet.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Reizen offline beschikbaar maken',
  'help.guide.offline-prepare.goal':
    'Sla je reizen en de kaarten ervan op dit apparaat op voordat je geen verbinding meer hebt.',
  'help.guide.offline-prepare.step.1':
    'Laat onder ‘Wat offline opslaan’ de optie ‘Kaarttegels offline opslaan’ aan staan en zet de reizen aan die je op dit apparaat wilt hebben. Een afgeronde reis wordt alleen opgeslagen als je hem aanzet.',
  'help.guide.offline-prepare.step.2':
    'Klik weer bovenaan, onder ‘Voorbereiden op offline’, op ‘Downloaden voor offline gebruik’. Dat haalt reisgegevens, documenten en kaarttegels op, en meldt hoeveel reizen er zijn opgeslagen.',
  'help.guide.offline-prepare.step.3':
    '‘Offlinemodus forceren’ downloadt nog één keer en werkt daarna alleen vanaf dit apparaat, zodat je kunt controleren of alles er is voordat je vertrekt.',
  'help.guide.offline-prepare.result':
    'De reizen openen ook zonder verbinding. Wijzigingen die je maakt, komen in een wachtrij en worden verstuurd zodra je weer online bent.',
  'help.guide.offline-prepare.tip.1':
    'Kaarttegels nemen de meeste ruimte in. Zet ze uit als je alleen de reisgegevens en documenten wilt bewaren.',
  'help.guide.offline-prepare.tip.2': 'Installeer TREK vanuit de browser als app, dan start het offline het soepelst.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Kiezen welke versie blijft bij een synchronisatieconflict',
  'help.guide.offline-conflicts.goal':
    'Kies hoe TREK een conflict oplost tussen een offline wijziging en een wijziging die ergens anders is gedaan.',
  'help.guide.offline-conflicts.step.1':
    'Botst een wijziging die je offline hebt gedaan met een nieuwere, dan verschijnt bovenaan Offline het onderdeel Synchronisatieconflicten. Klik per wijziging op ‘De mijne’ of ‘Die van de server behouden’.',
  'help.guide.offline-conflicts.step.2':
    'In dezelfde kaart bepaal je bij ‘Wanneer er een conflict optreedt’ wat er de volgende keer gebeurt: ‘Vraag het me elke keer’, ‘Altijd mijn versie behouden’ of ‘Altijd de serverversie behouden’.',
  'help.guide.offline-conflicts.result':
    'Met ‘Vraag het me elke keer’ blijft een conflict in ‘Synchronisatieconflicten’ staan tot je een keuze maakt. Met de andere twee opties lost TREK het automatisch op.',
  'help.guide.offline-conflicts.tip.1':
    "'Cache wissen' verwijdert alleen de kopie op dit apparaat. Op de server verandert niets.",
  // profile
  'help.guide.profile.title': 'Je profiel wijzigen',
  'help.guide.profile.goal': 'Werk je naam, e-mailadres en profielfoto bij.',
  'help.guide.profile.step.1':
    'Klik in de kaart ‘Account’ op de camera bij je foto om er een te uploaden; met de rode prullenbak verwijder je hem weer en komt je initiaal terug.',
  'help.guide.profile.step.2': 'Bewerk ‘Gebruikersnaam’ en ‘E-mail’ onder de foto.',
  'help.guide.profile.result': 'Je naam en profielfoto worden overal tegelijk bijgewerkt, ook in reizen die je deelt.',
  'help.guide.profile.tip.1':
    'Bij een account dat via SSO is gekoppeld, zie je een SSO-badge en ‘Gekoppeld met’ plus de provider.',
  // password
  'help.guide.password.title': 'Je wachtwoord wijzigen',
  'help.guide.password.goal': 'Stel een nieuw wachtwoord in.',
  'help.guide.password.step.1':
    'Vul onder ‘Wachtwoord wijzigen’ je huidige wachtwoord in, daarna het nieuwe wachtwoord en dat nog een keer bij ‘Nieuw wachtwoord bevestigen’. In de lijst eronder zie je tijdens het typen aan welke regels je wachtwoord al voldoet.',
  'help.guide.password.step.2': "Klik op 'Wachtwoord bijwerken'.",
  'help.guide.password.result':
    'Het nieuwe wachtwoord geldt meteen. Op alle andere apparaten word je uitgelogd, je MCP API-tokens worden verwijderd en OAuth-clients moeten opnieuw inloggen. Op dit apparaat blijf je ingelogd.',
  'help.guide.password.tip.1':
    'Logt deze TREK alleen via SSO in, dan is er geen TREK-wachtwoord en ook geen kaart ‘Wachtwoord wijzigen’.',
  // mfa
  'help.guide.mfa.title': 'Tweestapsverificatie inschakelen',
  'help.guide.mfa.goal': 'Beveilig je account met een code uit een authenticator-app.',
  'help.guide.mfa.step.1': 'Klik onder ‘Tweefactorauthenticatie (2FA)’ op ‘Authenticator instellen’.',
  'help.guide.mfa.step.2':
    'Scan de QR-code met je app of voer de geheime sleutel handmatig in. Typ daarna de zescijferige code uit de app en klik op ‘2FA inschakelen’.',
  'help.guide.mfa.step.3':
    'Bewaar de back-upcodes met ‘Codes kopiëren’, ‘TXT downloaden’ of ‘Afdrukken / PDF’ en klik dan op OK. Elke code werkt één keer. Gebruik een code als je je telefoon niet bij de hand hebt.',
  'help.guide.mfa.result': 'Bij elke keer inloggen wordt na het wachtwoord om een code gevraagd.',
  'help.guide.mfa.tip.1':
    'Voor ‘2FA uitschakelen’ heb je je wachtwoord nodig en een geldige code of een ongebruikte back-upcode.',
  'help.guide.mfa.tip.2': 'De beheerder kan 2FA voor iedereen verplicht maken. Dan kun je het hier niet uitzetten.',
  // passkeys
  'help.guide.passkeys.title': 'Inloggen met een passkey',
  'help.guide.passkeys.goal':
    'Gebruik de vingerafdruk, gezichtsherkenning of pincode van je apparaat in plaats van een wachtwoord.',
  'help.guide.passkeys.step.1':
    'Klik onder ‘Passkeys’ op ‘Een passkey toevoegen’, bevestig je huidige wachtwoord en geef de passkey een naam waaruit blijkt om welk apparaat het gaat. Volg daarna de aanwijzingen van je apparaat.',
  'help.guide.passkeys.step.2':
    'Bij elke passkey zie je of hij Gesynchroniseerd is of aan Dit apparaat gebonden, en wanneer je hem voor het laatst hebt gebruikt. Met ‘Hernoemen’ geef je hem een andere naam. Met de verwijderknop verwijder je hem, nadat je je wachtwoord hebt ingevoerd.',
  'help.guide.passkeys.result':
    'Op de inlogpagina kun je de passkey gebruiken. Inloggen met je wachtwoord kan ook nog steeds.',
  'help.guide.passkeys.tip.1':
    'Een passkey wordt op het apparaat of in de wachtwoordmanager ervan bewaard. Voeg dus voor elk apparaat een eigen passkey toe.',
  'help.guide.passkeys.tip.2':
    'Passkeys verschijnen pas als de beheerder ze heeft aangezet. Zolang de server geen WebAuthn-domein heeft, meldt de kaart dat in plaats van ‘Een passkey toevoegen’ aan te bieden.',
  // delete-account
  'help.guide.delete-account.title': 'Je account verwijderen',
  'help.guide.delete-account.goal': 'Verwijder je account en de gegevens die alleen van jou zijn.',
  'help.guide.delete-account.step.1':
    'Klik in de kaart Account links onderaan op ‘Account verwijderen’ en daarna op ‘Permanent verwijderen’.',
  'help.guide.delete-account.result':
    'Je account is verwijderd, samen met de reizen, plaatsen en bestanden waarvan je de eigenaar bent. Reizen waarvan anderen de eigenaar zijn, blijven bestaan.',
  'help.guide.delete-account.tip.1':
    'Ben je de enige beheerder, dan toont TREK ‘Verwijderen niet mogelijk’: maak eerst een andere gebruiker beheerder.',
  'help.guide.delete-account.tip.2':
    'Dit kun je niet ongedaan maken. Exporteer wat je wilt bewaren voordat je bevestigt.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Beheerder',
  'help.ctx.admin.summary':
    'Instellingen voor de hele TREK-instantie, voor alle gebruikers: wie mag inloggen en hoe, wat er aanstaat, waar bestanden worden opgeslagen, hoe de server mensen bereikt en hoe er back-ups worden gemaakt. Alleen beheerders zien deze pagina. De zijbalk groepeert de tabbladen onder Gebruikers, Configuratie, Integraties en Onderhoud, en elk tabblad is een apart scherm.',
  'help.ctx.admin.bullet.1':
    'De kop toont rechts het aantal gebruikers, reizen, plaatsen en bestanden. Daaronder verschijnt een banner ‘Update beschikbaar’ als er een nieuwere TREK-versie is.',
  'help.ctx.admin.bullet.2':
    'Gebruikers en Standaardinstellingen: accounts, uitnodigingslinks en rechten, en de instellingen en kaart waarmee een nieuw account begint.',
  'help.ctx.admin.bullet.3':
    'Personalisatie, Instellingen, Add-ons, Plugins en Opslag: inpaksjablonen, categorieën en schoolvakanties; inloggen, passkeys, 2FA, API-sleutels en zoekdiensten; de functiemodules; plugins van derden; en waar uploads worden opgeslagen.',
  'help.ctx.admin.bullet.4':
    'Meldingen, MCP-toegang en GitHub: de kanalen die gebruikers mogen kiezen en hun standaardinstellingen, de tokens en sessies van AI-clients, en de releasegeschiedenis.',
  'help.ctx.admin.bullet.5':
    'Back-up en Audit: back-ups wanneer je wilt of volgens een schema, en het logboek van beveiligingsgebeurtenissen.',
  'help.ctx.admin-users.title': 'Gebruikers',
  'help.ctx.admin-users.summary':
    'Alle accounts op deze TREK, met rol, e-mailadres en wanneer ze voor het laatst actief waren, de uitnodigingslinks waarmee mensen zich op een gesloten installatie kunnen registreren, en wie wat mag in reizen.',
  'help.ctx.admin-users.bullet.1':
    'De tabel: gebruiker, e-mailadres, rol, aangemaakt en Laatst actief, met per rij ‘Gebruiker bewerken’ en ‘Gebruiker verwijderen’. Een groene stip op de avatar betekent dat de persoon nu online is. Bij je eigen rij staat (Jij).',
  'help.ctx.admin-users.bullet.2':
    '‘Gebruiker aanmaken’, rechtsboven in de kaart ‘Gebruikers’, voegt handmatig een account toe met een wachtwoord dat je zelf aan de gebruiker geeft.',
  'help.ctx.admin-users.bullet.3':
    '‘Uitnodigingslinks’ daaronder: registratielinks met een gebruikslimiet, een vervaldatum en desgewenst een reis waaraan de nieuwe gebruiker deelneemt zodra die zich registreert.',
  'help.ctx.admin-users.bullet.4':
    '‘Rechtinstellingen’ onderaan: per actie wie die mag uitvoeren (Iedereen, Reisleden, Reiseigenaar of ‘Alleen beheerder’). Klik bovenaan de kaart op ‘Opslaan’ om dit op te slaan.',
  'help.ctx.admin-defaults.title': 'Standaardinstellingen',
  'help.ctx.admin-defaults.summary':
    'Waarmee een nieuw account begint, zodat niemand eerst alles hoeft in te stellen: kleurmodus, eenheden, tijdnotatie, eerste dag van de week, weergavevaluta en vervaagde boekingscodes, plus de kaart, de sleutels ervan en de routeservers.',
  'help.ctx.admin-defaults.bullet.1':
    'Links de Standaard gebruikersinstellingen: Kleurmodus, Temperatuureenheid, Afstandseenheid, Tijdnotatie, ‘Week begint op’, Weergavevaluta en ‘Boekingscodes vervagen’.',
  'help.ctx.admin-defaults.bullet.2':
    'Rechts de kaart: Kaartsjabloon, Gedeelde CARTO-sleutel, Eigen routeserver en Eigen Valhalla-instantie, een voorbeeld, en daarna Kaartmotor met Kaartstijl, ‘Gedeeld Mapbox-token’, ‘3D-gebouwen & terrein’ en Hogekwaliteitsmodus.',
  'help.ctx.admin-config.title': 'Personalisatie',
  'help.ctx.admin-config.summary':
    'Instellingen die voor alle reizen op de instantie gelden: inpaksjablonen, de categorieën voor plekken en collecties, en het overzicht van schoolvakanties dat Vacay gebruikt.',
  'help.ctx.admin-config.bullet.1':
    'Paksjablonen: lijsten met een naam, met categorieën en items, waarmee de inpaklijst van een reis kan beginnen.',
  'help.ctx.admin-config.bullet.2':
    'Categorieën: naam, pictogram en kleur van de categorieën die overal in TREK worden gebruikt, van de plaatsdetails tot Collecties. Je bewerkt ze elk in een venster met een voorbeeld.',
  'help.ctx.admin-config.bullet.3':
    "Schoolvakanties: de catalogus van landen en regio's met hun vakantieperiodes, waaruit iedereen in Vakantie kan kiezen.",
  'help.ctx.admin-settings.title': 'Instellingen',
  'help.ctx.admin-settings.summary':
    'Hoe mensen inloggen en welke externe diensten de server mag gebruiken. Links: ‘Authenticatiemethoden’, ‘Inloggen met passkey’, ‘Tweestapsverificatie (2FA) verplichten’ en ‘Single Sign-On (OIDC)’. Rechts: ‘Toegestane bestandstypen’ en ‘API-sleutels’ met de aanbieders voor zoeken en openbaar vervoer. De Gevarenzone staat onderaan.',
  'help.ctx.admin-settings.bullet.1':
    'Authenticatiemethoden: ‘Inloggen met wachtwoord’, ‘Registreren met wachtwoord’ en, zodra OIDC is ingesteld, ‘Inloggen via SSO’ en ‘Automatische SSO-provisioning’. ‘Tweestapsverificatie (2FA) verplichten’ heeft een eigen kaart.',
  'help.ctx.admin-settings.bullet.2':
    'Inloggen met passkey: ‘Inloggen met passkey inschakelen’, de ‘Relying Party ID (domein)’ en de ‘Toegestane origins’. Single Sign-On (OIDC): ‘Weergavenaam’, ‘Issuer-URL’, een optionele Discovery-URL, ‘Client-ID’ en ‘Clientgeheim’.',
  'help.ctx.admin-settings.bullet.3':
    'API-sleutels: bovenaan staat de TREK Places API, die geen sleutel nodig heeft. Daaronder vind je de Google Maps API-sleutel (met ‘Testen’ en ‘Waarvoor de sleutel wordt gebruikt’), de sleutel voor Unsplash en die voor Amap, en onderaan de kaart één knop ‘Opslaan’.',
  'help.ctx.admin-settings.bullet.4':
    'Met Ov-provider en ‘Provider voor plaatszoeken’ kies je welke dienst OV-zoekopdrachten en zoekopdrachten naar plaatsen afhandelt. Het Logboek van plaatszoekopdrachten houdt bij welk resultaat is gekozen. Met Toegestane bestandstypen beperk je uploads.',
  'help.ctx.admin-addons.title': 'Add-ons',
  'help.ctx.admin-addons.summary':
    'De functiemodules van TREK, elk met een eigen schakelaar: Paklijst, Onkosten, Documenten, Vakantie, Atlas, Samenwerking, Reisverslag, Collecties, Roadtrip, MCP, AirTrail, Dawarich en de AI-verwerking. Uit betekent dat het menu-item, de routes en de API voor iedereen verdwijnen.',
  'help.ctx.admin-addons.bullet.1':
    'Per add-on een tegel met een schakelaar en, als de add-on opties heeft, extra rijen voor die opties.',
  'help.ctx.admin-addons.bullet.2':
    'Ook foto- en documentdiensten staan hier als tegels, zodat je gebruikers bijvoorbeeld Immich of Synology kunt aanbieden.',
  'help.ctx.admin-addons.bullet.3': 'Bagagetracking heeft een eigen schakelaar onder de tegels.',
  'help.ctx.admin-plugins.title': 'Plugins', // same-as-en
  'help.ctx.admin-plugins.summary':
    'Plugins van derden die in een eigen proces naast TREK draaien, elk met de rechten die bij de installatie zijn gevraagd. Installeer ze uit de catalogus, upload een pakket, of koppel een map terwijl je zelf een plugin ontwikkelt.',
  'help.ctx.admin-plugins.bullet.1':
    'Geïnstalleerd en Ontdekken, met ‘Plugins zoeken…’ en de filters Type, Status en Sorteren. Elke rij toont de versie, Beoordeeld, Ondertekend of Niet ondertekend, waartoe de plugin toegang heeft, een schakelaar en een ⋯-menu.',
  'help.ctx.admin-plugins.bullet.2':
    'De twee pictogrammen in de kop van de kaart: ‘Plugin uploaden’ accepteert een .zip, .tgz of .tar.gz (je kunt ook een .zip op de pagina neerzetten); ‘Opnieuw scannen’ vindt een pluginmap die voor ontwikkeling is gekoppeld.',
  'help.ctx.admin-plugins.bullet.3':
    'Toegestane hosts per plugin: de adressen die een plugin mag benaderen, want uitgaande verbindingen zijn standaard geblokkeerd.',
  'help.ctx.admin-storage.title': 'Opslag',
  'help.ctx.admin-storage.summary':
    'Waar uploads worden opgeslagen: op de lokale schijf of in een S3-bucket, eventueel gekopieerd naar extra backends. Elke uploadcategorie kan naar een andere backend, en er verandert niets tot je op ‘Wijzigingen opslaan’ klikt.',
  'help.ctx.admin-storage.bullet.1':
    '‘Gezondheid’ bovenaan: de mislukte schrijfacties naar een mirrordoel, of ‘Geen replicafouten geregistreerd.’',
  'help.ctx.admin-storage.bullet.2':
    'Backends: naam, type, gebruik en ‘Gemirrord naar’, met ‘Testen’, ‘Bewerken’ en ‘Verwijderen’. ‘Nu berekenen’ berekent hoeveel er is opgeslagen; een backend die via een omgevingsvariabele is ingesteld, is alleen-lezen.',
  'help.ctx.admin-storage.bullet.3':
    "Categorieën: reisdocumenten, foto's uit reisverslagen, omslagen, profielfoto's, afbeeldingen van plaatsen, de fotocaches en back-ups, elk gekoppeld aan een backend.",
  'help.ctx.admin-notifications.title': 'Meldingen',
  'help.ctx.admin-notifications.summary':
    "De kanalen die de instantie aan gebruikers aanbiedt, en de kanalen waarop jij als beheerder meldingen krijgt. Gebruikers kiezen hun eigen topics en URL's onder Instellingen. Jij bepaalt welke kanalen er zijn en stelt e-mail in.",
  'help.ctx.admin-notifications.bullet.1':
    'E-mail (SMTP), Webhook, Ntfy en Web Push hebben elk een schakelaar om het kanaal aan gebruikers aan te bieden. Voor e-mail moet je ook de serverinstellingen invullen. In-app staat altijd aan.',
  'help.ctx.admin-notifications.bullet.2':
    'Reisherinneringen: of de server een herinnering stuurt voordat een reis begint.',
  'help.ctx.admin-notifications.bullet.3':
    'Admin-webhook, Admin-Ntfy en de kaart Meldingen: waar beheerdersmeldingen (‘Nieuwe versie beschikbaar’, ‘Opslagreplica mislukt’, ‘Peddelregio aangevraagd’) naartoe gaan, elk met een testknop.',
  'help.ctx.admin-mcp-tokens.title': 'MCP-toegang',
  'help.ctx.admin-mcp-tokens.summary':
    'Alle tokens en OAuth-sessies die AI-clients voor deze TREK hebben, van alle gebruikers. Je kunt ze allemaal intrekken.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'OAuth-sessies: de client, de toegekende scopes, de eigenaar en de datum, met een prullenbak om de sessie in te trekken.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'API-tokens: naam, eigenaar, ‘Aangemaakt’ en ‘Laatst gebruikt’, met een prullenbak om het token te verwijderen.',
  'help.ctx.admin-github.title': 'GitHub', // same-as-en
  'help.ctx.admin-github.summary':
    'Wat er nieuw is in TREK: de releasegeschiedenis van GitHub, en of er een nieuwere versie is dan die van jou. Het bijwerken zelf gebeurt buiten de app, op de host.',
  'help.ctx.admin-github.bullet.1':
    '‘Release-geschiedenis’ toont de releases als tijdlijn met hun releasenotes. De nieuwste heeft het label ‘Nieuwste’, pre-releases zijn gemarkeerd als ‘Pre-release’, en GitHub opent de pagina met releases.',
  'help.ctx.admin-github.bullet.2':
    "‘Update beschikbaar’ verschijnt onder de paginakop zodra er een nieuwere release is. ‘Hoe bij te werken’ toont de commando's voor Docker of de updatehandleiding voor andere installaties.",
  'help.ctx.admin-backup.title': 'Back-up',
  'help.ctx.admin-backup.summary':
    'Volledige back-ups van de database en de uploads, handmatig of volgens een schema gemaakt, bewaard op de server en als één bestand te downloaden. Met Herstellen zet je een back-up terug.',
  'help.ctx.admin-backup.bullet.1':
    'Gegevensback-up: bovenaan de kaart ‘Back-up aanmaken’ en ‘Back-up uploaden’, en de lijst met back-ups met ‘Downloaden’, ‘Herstellen’ en een prullenbak om te verwijderen.',
  'help.ctx.admin-backup.bullet.2':
    'Met ‘Back-up uploaden’ herstel je een bestand dat op een andere installatie of op een eerdere dag is gemaakt, na dezelfde vraag als bij ‘Herstellen’.',
  'help.ctx.admin-backup.bullet.3':
    'Auto-back-up: aan of uit, ‘Interval’, ‘Uitvoeren om’ met uur en dag, en ‘Oude back-ups verwijderen na’ (van 1 dag tot ‘Voor altijd bewaren’), toegepast met ‘Opslaan’.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Het logboek van beveiligings- en beheergebeurtenissen: inlogpogingen, gelukt en mislukt, wijzigingen in MFA, gebruikers en instellingen, back-ups en herstelacties. Alleen te lezen, nieuwste bovenaan.',
  'help.ctx.admin-audit.bullet.1':
    'Per gebeurtenis een rij met tijd, gebruiker, actie, onderdeel, IP-adres en details.',
  'help.ctx.admin-audit.bullet.2':
    '‘Vernieuwen’ in de kop van de kaart laadt de lijst opnieuw. De badge naast de titel toont hoeveel vermeldingen van het totaal zijn geladen, en ‘Meer laden’ laadt oudere vermeldingen.',
  // create-user
  'help.guide.create-user.title': 'Een gebruiker aanmaken',
  'help.guide.create-user.goal': 'Voeg zelf een account toe, zonder uitnodiging.',
  'help.guide.create-user.step.1': 'Klik rechtsboven in de kaart ‘Gebruikers’ op ‘Gebruiker aanmaken’.',
  'help.guide.create-user.step.2':
    'Vul ‘Gebruikersnaam’, ‘E-mail’ en een ‘Wachtwoord’ in; de checklist onder het wachtwoord laat zien aan welke regels het voldoet. Kies de ‘Rol’: Gebruiker of Beheerder.',
  'help.guide.create-user.step.3': "Klik op 'Gebruiker aanmaken'.",
  'help.guide.create-user.result':
    'Het account staat in de tabel en kan meteen inloggen. Geef het wachtwoord door via een kanaal dat je vertrouwt.',
  'help.guide.create-user.tip.1':
    'Wil je dat iemand zelf een wachtwoord kiest, gebruik dan liever een uitnodigingslink.',
  'help.guide.create-user.tip.2':
    'Een Beheerder ziet deze pagina en mag alles. Wat een Gebruiker in reizen mag, stel je hieronder in bij Rechtinstellingen.',
  // edit-user
  'help.guide.edit-user.title': 'De gegevens of het wachtwoord van een gebruiker wijzigen',
  'help.guide.edit-user.goal':
    'Wijzig iemands naam, geef iemand meer of minder rechten, of help iemand weer in te loggen na een vergeten wachtwoord.',
  'help.guide.edit-user.step.1':
    'Klik op het potlood (‘Gebruiker bewerken’) in de rij van de gebruiker. Bovenaan het venster staat het e-mailadres van het account.',
  'help.guide.edit-user.step.2':
    'Wijzig ‘Gebruikersnaam’, ‘E-mail’ of ‘Rol’, of typ een ‘Nieuw wachtwoord’ (laat het leeg om het huidige te houden), en klik op ‘Opslaan’. Met ‘Passkeys resetten’ onderaan verwijder je na bevestiging alle passkeys van het account.',
  'help.guide.edit-user.result':
    'De wijziging gaat direct in. Een nieuw wachtwoord logt de persoon ook op alle apparaten uit, zodat een oude sessie niet meer werkt.',
  'help.guide.edit-user.tip.1': 'Zolang je de laatste beheerder bent, kun je jezelf de beheerdersrol niet afnemen.',
  'help.guide.edit-user.tip.2':
    'Bij het resetten van passkeys blijft het wachtwoord behouden. De persoon voegt nieuwe passkeys toe onder Instellingen, Account.',
  // invite-links
  'help.guide.invite-links.title': 'Iemand uitnodigen met een link',
  'help.guide.invite-links.goal':
    'Laat iemand zich registreren op een gesloten instantie en voeg hem of haar desgewenst meteen toe aan een reis.',
  'help.guide.invite-links.step.1': 'Klik rechtsboven in de kaart ‘Uitnodigingslinks’ op ‘Link aanmaken’.',
  'help.guide.invite-links.step.2':
    'Kies ‘Max. gebruik’ (1× tot 5×, of ∞) en ‘Verloopt na’ (1d tot 14d, of ∞), eventueel een reis bij ‘Toevoegen aan reis (optioneel)’, en klik op ‘Aanmaken en kopiëren’.',
  'help.guide.invite-links.step.3':
    'Verstuur de link. In elke rij zie je hoe vaak de link is gebruikt, wanneer hij verloopt, aan welke reis hij toevoegt en wie hem heeft gemaakt, met daarnaast Actief, Verlopen of Opgebruikt. Met ‘Link kopiëren’ kopieer je hem opnieuw, met de prullenbak verwijder je hem.',
  'help.guide.invite-links.result':
    'Wie de link opent, registreert zich met een eigen wachtwoord. Is er een reis gekozen, dan wordt die persoon meteen lid van die reis.',
  'help.guide.invite-links.tip.1':
    'Uitnodigingslinks werken ook als ‘Registreren met wachtwoord’ onder Instellingen uitstaat.',
  'help.guide.invite-links.tip.2':
    'Voor één persoon is een link die één keer bruikbaar is en snel verloopt de veiligste keuze.',
  // delete-user
  'help.guide.delete-user.title': 'Een gebruiker verwijderen',
  'help.guide.delete-user.goal': 'Verwijder een account en alles wat erbij hoort.',
  'help.guide.delete-user.step.1':
    'Klik op de prullenbak (‘Gebruiker verwijderen’) in de rij van de gebruiker en bevestig met ‘Verwijderen’.',
  'help.guide.delete-user.result':
    'Het account is verwijderd, samen met alle reizen en reisverslagen waarvan het de eigenaar is, ook reizen die met anderen waren gedeeld. Reizen waarvan het alleen lid was, blijven bij de eigenaar.',
  'help.guide.delete-user.tip.1': 'Dit kun je niet ongedaan maken. Maak eerst een back-up als je twijfelt.',
  'help.guide.delete-user.tip.2':
    'Op je eigen rij werkt de prullenbak niet: je kunt jezelf niet verwijderen. Dat moet een andere beheerder doen.',
  // permissions
  'help.guide.permissions.title': 'Bepalen wie wat mag',
  'help.guide.permissions.goal': 'Stel per actie in welke rol die op deze TREK mag uitvoeren.',
  'help.guide.permissions.step.1':
    'Zoek onder ‘Rechtinstellingen’ de actie in de juiste groep, zoals ‘Reizen verwijderen’ onder ‘Reisbeheer’, en kies wie dat mag: Iedereen, Reisleden, Reiseigenaar of ‘Alleen beheerder’. Een gewijzigde rij is gemarkeerd als ‘aangepast’.',
  'help.guide.permissions.step.2':
    'Klik rechtsboven in de kaart op ‘Opslaan’. ‘Standaardwaarden herstellen’ zet elke rij terug op het ingebouwde niveau; klik daarna ook op ‘Opslaan’.',
  'help.guide.permissions.result':
    "De regel geldt meteen voor alle reizen. Mensen onder het niveau zien de knoppen en menu's ervoor niet meer.",
  'help.guide.permissions.tip.1':
    'Met Reiseigenaar wordt de persoon bedoeld die de reis heeft aangemaakt. Beheerders mogen altijd alles.',
  'help.guide.permissions.tip.2':
    'Elke actie heeft een eigen rij. Zo kun je leden bijvoorbeeld plaatsen en dagen laten plannen, maar het verwijderen van de reis aan de eigenaar overlaten.',
  // default-map
  'help.guide.default-map.title': 'Standaardkaart voor nieuwe gebruikers instellen',
  'help.guide.default-map.goal': 'Geef elk nieuw account een werkende kaart, zonder persoonlijk token.',
  'help.guide.default-map.step.1':
    'Kies onder Kaart een ‘Kaartsjabloon’ of plak een tegel-URL, en vul een ‘Gedeelde CARTO-sleutel’ in als je CARTO-tegels gebruikt. Het voorbeeld eronder toont het resultaat.',
  'help.guide.default-map.step.2':
    'Kies verderop de Kaartmotor: Standaard (gratis), Mapbox (3D) of MapLibre (OpenFreeMap). Kies bij Mapbox en MapLibre de Kaartstijl. Vul bij Mapbox het ‘Gedeeld Mapbox-token’ in en bepaal of je ‘3D-gebouwen & terrein’ en de Hogekwaliteitsmodus wilt.',
  'help.guide.default-map.result':
    'Nieuwe accounts beginnen met deze instellingen. Wie onder Instellingen al een eigen kaart heeft ingesteld, houdt die.',
  'help.guide.default-map.tip.1':
    'Een token of sleutel die je hier invult, wordt gebruikt door iedereen die zelf geen token of sleutel heeft. Houd dus het verbruik in de gaten.',
  'help.guide.default-map.tip.2':
    'Bestaande accounts die in het kaarttabblad nooit iets hebben gewijzigd, gebruiken deze standaardwaarden ook.',
  // packing-templates
  'help.guide.packing-templates.title': 'Een inpaksjabloon maken',
  'help.guide.packing-templates.goal': 'Geef reizen een inpaklijst om mee te beginnen, in plaats van een lege lijst.',
  'help.guide.packing-templates.step.1': 'Klik op ‘Nieuw sjabloon’, typ een naam en bevestig met het vinkje.',
  'help.guide.packing-templates.step.2':
    'Klik op de naam van het sjabloon om het te openen en daarna op ‘Categorie toevoegen’. Met de + bovenaan een categorie voeg je items toe. Een item heeft alleen een naam nodig.',
  'help.guide.packing-templates.step.3':
    'Alles wordt meteen opgeslagen. Met het potlood hernoem je een sjabloon, categorie of item. Met de prullenbak verwijder je een item meteen. Bij een sjabloon of categorie vraagt TREK eerst om bevestiging, omdat alles wat erin zit ook wordt verwijderd.',
  'help.guide.packing-templates.result':
    'Het sjabloon is beschikbaar in de inpaklijst van elke reis. Bij het toepassen worden de items gekopieerd, dus per reis kun je ze vrij aanpassen.',
  'help.guide.packing-templates.tip.1':
    'Eén sjabloon per soort reis (strand, stad, wandelen) werkt beter dan één heel lange lijst.',
  'help.guide.packing-templates.tip.2':
    'Verwijder je een sjabloon, dan verandert er niets aan reizen waarin het al is toegepast.',
  'help.guide.packing-templates.tip.3':
    '‘Opslaan als sjabloon’ op de inpaklijst van een reis maakt een sjabloon met het gewicht, het aantal en de tas van elk item. Die staan hier naast het item, en als je het sjabloon toepast, komen de items in dezelfde tassen terecht.',
  // categories
  'help.guide.categories.title': 'De categorieën beheren',
  'help.guide.categories.goal': 'Bepaal welke categorieën plaatsen en collecties kunnen hebben, en hoe ze eruitzien.',
  'help.guide.categories.step.1':
    'Klik op ‘Nieuwe categorie’, typ de naam in de titelregel van het venster, kies een ‘Pictogram’ en een ‘Kleur’ en bekijk het ‘Voorbeeld’. Klik op ‘Aanmaken’.',
  'help.guide.categories.step.2':
    'In de lijst opent het potlood (Bewerken) een categorie, en met ‘Bijwerken’ sla je die op. De prullenbak (Verwijderen) verwijdert de categorie na bevestiging.',
  'help.guide.categories.result':
    'De categorieën gelden overal tegelijk: in de plaatsdetails, bij de spelden op de kaart, in Collecties en in de filters.',
  'help.guide.categories.tip.1':
    'Plekken bewaren het id van hun categorie. Geef je een categorie een andere naam, dan verandert die naam dus bij elke plek.',
  'help.guide.categories.tip.2':
    'Verwijder je een categorie, dan hebben de plekken ervan geen categorie meer. Is dat belangrijk, wijs ze dan eerst een andere categorie toe.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Schoolvakanties handmatig bijhouden',
  'help.guide.school-holiday-catalog.goal':
    'Beheer de schoolvakanties van een land of regio, zodat iedereen ze in Vakantie kan kiezen.',
  'help.guide.school-holiday-catalog.step.1':
    'Kies onder Schoolvakanties het Land, of klik op + (Land toevoegen), vul het Land en de ‘Landcode (bijv. US)’ in en klik op ‘Opslaan’. Met ‘Regio toevoegen’ voeg je elk deel van het land toe dat eigen data heeft.',
  'help.guide.school-holiday-catalog.step.2':
    "Klik op een regio om ‘Regio of schooldistrict’ te openen: klik op ‘Vakantieperiode toevoegen’, geef elke periode een naam, begindatum en einddatum, en klik op ‘Opslaan’. Met de prullenbak verwijder je een periode of regio. Een land kun je verwijderen zodra er geen regio's meer in staan.",
  'help.guide.school-holiday-catalog.result':
    'Gebruikers vinden het land en de regio onder Instellingen in Vacay en zien de periodes in hun jaaroverzicht.',
  'help.guide.school-holiday-catalog.tip.1':
    'Een regio die iemand al in zijn of haar Vakantie-kalender heeft gekozen, kun je niet verwijderen.',
  // auth-methods
  'help.guide.auth-methods.title': 'Bepalen hoe mensen inloggen',
  'help.guide.auth-methods.goal': 'Zet inloggen met wachtwoord, SSO en registratie aan of uit, en maak 2FA verplicht.',
  'help.guide.auth-methods.step.1':
    'Zet onder Authenticatiemethoden ‘Inloggen met wachtwoord’ en ‘Registreren met wachtwoord’ aan of uit. Elke schakelaar werkt meteen. Staat registreren uit, dan komen nieuwe accounts alleen nog via uitnodigingslinks, SSO of ‘Gebruiker aanmaken’.',
  'help.guide.auth-methods.step.2':
    "Voor 'Inloggen via SSO' en 'Automatische SSO-provisioning' moet Single Sign-On (OIDC) hieronder zijn ingesteld. Automatische provisioning maakt een account aan zodra iemand voor het eerst via SSO inlogt.",
  'help.guide.auth-methods.step.3':
    'Zet ‘Tweestapsverificatie (2FA) verplichten’ aan, zodat iedereen zonder 2FA die eerst in Instellingen moet instellen voordat ze TREK kunnen gebruiken.',
  'help.guide.auth-methods.result': 'Op de inlogpagina staan precies de methoden die je hebt aangelaten.',
  'help.guide.auth-methods.tip.1':
    'TREK laat je de laatste inlogmethode niet uitzetten: de schakelaar wordt grijs en de tooltip meldt ‘Er moet minstens één inlogmethode ingeschakeld blijven’.',
  'help.guide.auth-methods.tip.2':
    'Is OIDC_ONLY op de server ingesteld, dan zijn de wachtwoordschakelaars vergrendeld en staat er een opmerking bij.',
  // oidc
  'help.guide.oidc.title': 'Single sign-on koppelen',
  'help.guide.oidc.goal': 'Laat mensen inloggen via je eigen identity provider.',
  'help.guide.oidc.step.1':
    'Vul onder ‘Single Sign-On (OIDC)’ de ‘Weergavenaam’ voor de knop in, de ‘Issuer-URL’, de ‘Client-ID’ en het ‘Clientgeheim’ van je provider. Vul ‘Discovery-URL (optioneel)’ alleen in als je provider die niet op het gebruikelijke adres publiceert, zoals bij Authentik. Klik op ‘Opslaan’.',
  'help.guide.oidc.step.2': 'Zet ‘Inloggen via SSO’ aan onder Authenticatiemethoden.',
  'help.guide.oidc.result':
    "Op de inlogpagina staat de SSO-knop; staat 'Automatische SSO-provisioning' aan, dan krijgen nieuwe gebruikers de eerste keer automatisch een account.",
  'help.guide.oidc.tip.1':
    'De redirect-URI die je provider nodig heeft, is het adres van je TREK plus het OIDC-callbackpad uit de documentatie.',
  'help.guide.oidc.tip.2':
    'Met claim-mapping bepaal je welke SSO-groepen beheerder worden; zie de OIDC-pagina in de documentatie.',
  // instance-keys
  'help.guide.instance-keys.title': 'API-sleutels invullen',
  'help.guide.instance-keys.goal':
    "Voeg voor de hele installatie foto's en beoordelingen van Google, omslagen van Unsplash en zoeken via Amap toe.",
  'help.guide.instance-keys.step.1':
    'Onder API-sleutels staat bovenaan de TREK Places API, die zonder sleutel al zoekopdrachten naar plaatsen afhandelt. Onder ‘Wat erin zit’ lees je wat die wel en niet dekt.',
  'help.guide.instance-keys.step.2':
    "Plak voor foto's, beoordelingen en openingstijden een Google Maps API-sleutel en klik op ‘Testen’. Je ziet dan ‘Verbonden’ of ‘Ongeldig’. Open ‘Waarvoor de sleutel wordt gebruikt’ en zet alleen aan waarvoor je wilt betalen: Plaatsfoto's, Plaatsautocomplete, Plaatsdetails, Plaatsverrijking en ‘Alleen met Google zoeken’, plus een ‘Daglimiet voor Google-aanroepen’.",
  'help.guide.instance-keys.step.3':
    "Plak de Unsplash API-sleutel om omslagfoto's te zoeken en de Amap (高德地图) API-sleutel om plaatsen in het Chinese vasteland te zoeken, en klik onderaan de kaart op ‘Opslaan’.",
  'help.guide.instance-keys.result':
    'Gebruikers krijgen de functies zonder eigen sleutels. Zonder Google-sleutel loopt zoeken via de TREK Places API en OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Heeft een gebruiker onder Instellingen een eigen sleutel ingevuld, dan gebruikt TREK voor die gebruiker die sleutel in plaats van de sleutel van de instantie.',
  'help.guide.instance-keys.tip.2':
    'Sleutels kunnen ook uit omgevingsvariabelen komen. Die zie je hier, maar kun je niet wijzigen.',
  'help.guide.instance-keys.tip.3':
    '‘Daglimiet voor Google-aanroepen’ bepaalt hoeveel TREK per dag aan de sleutel mag uitgeven. Het label naast de titel telt de aanroepen van vandaag. Is de limiet bereikt, dan wordt er tot de volgende dag (UTC) via OpenStreetMap gezocht.',
  // places-transit
  'help.guide.places-transit.title': 'De providers voor zoeken en ov kiezen',
  'help.guide.places-transit.goal':
    'Kies welke dienst zoekopdrachten naar plaatsen en routeverzoeken voor het openbaar vervoer afhandelt.',
  'help.guide.places-transit.step.1':
    'Kies onder ‘Ov-provider’ voor ‘Transitous (gratis)’, zonder sleutel en het sterkst in Europa, of voor Google, dat de Google-sleutel gebruikt. De keuze wordt meteen opgeslagen.',
  'help.guide.places-transit.step.2':
    'Kies onder ‘Provider voor plaatszoeken’ welke dienst TREK raadpleegt als de TREK-index en OpenStreetMap niets vinden: Automatisch (Google als er een sleutel is, anders Amap), Google Places, Amap (高德地图) of OpenStreetMap.',
  'help.guide.places-transit.result': 'Elk zoekveld en elke ov-route in TREK gebruikt deze keuze.',
  'help.guide.places-transit.tip.1':
    'Kies je een dienst zonder sleutel, dan zie je hier een waarschuwing. Het zoeken naar plaatsen gebruikt dan alleen de TREK-index en OpenStreetMap, en het OV alleen Transitous.',
  'help.guide.places-transit.tip.2': 'Ov-routes van Google worden per aanvraag gefactureerd, die van Transitous niet.',
  // file-types
  'help.guide.file-types.title': 'Bestandstypen beperken',
  'help.guide.file-types.goal': 'Bepaal welke bestandsextensies uploads mogen hebben.',
  'help.guide.file-types.step.1':
    "Bewerk onder Toegestane bestandstypen de lijst met extensies, gescheiden door komma's, of vul * in om alle bestandstypen toe te staan. Klik daarna op ‘Opslaan’.",
  'help.guide.file-types.result':
    'Uploads van andere typen worden geweigerd met een duidelijke melding, bij documenten, in het reisverslag en bij omslagen.',
  'help.guide.file-types.tip.1':
    "Laat de afbeeldingstypen in de lijst staan: omslagen en foto's in reisverslagen worden met dezelfde lijst gecontroleerd.",
  // toggle-addon
  'help.guide.toggle-addon.title': 'Een add-on aan- of uitzetten',
  'help.guide.toggle-addon.goal': 'Maak een functiemodule beschikbaar voor iedereen, of haal hem weg.',
  'help.guide.toggle-addon.step.1':
    'Klik op de schakelaar op de tegel van de add-on. Het item in de navigatie verschijnt of verdwijnt meteen voor iedereen.',
  'help.guide.toggle-addon.step.2':
    'Sommige tegels hebben extra rijen voor opties, zoals Bagagetracking onder Lijsten of de fotodiensten onder Reisverslag. Die zie je alleen zolang de add-on aanstaat.',
  'help.guide.toggle-addon.result':
    'Zet je een add-on uit, dan blijven de gegevens bewaard. Zet je hem weer aan, dan verschijnen ze opnieuw.',
  'help.guide.toggle-addon.tip.1':
    'Zet je MCP uit, dan verdwijnen het endpoint en de onderdelen in Integraties die ervan afhangen.',
  'help.guide.toggle-addon.tip.2':
    'Vakantie, Atlas en Reisverslag zijn de add-ons waar gebruikers het vaakst om vragen; Documenten heeft opslagruimte voor uploads nodig.',
  // install-plugin
  'help.guide.install-plugin.title': 'Een plugin installeren',
  'help.guide.install-plugin.goal': 'Voeg een plugin van derden toe en geef hem precies de rechten waar hij om vraagt.',
  'help.guide.install-plugin.step.1':
    'Open Ontdekken, zoek een plugin via ‘Plugins zoeken…’ of het filter Type en klik op ‘Installeren’. Heb je een pakketbestand, klik dan op ‘Plugin uploaden’ (het wolkje rechtsboven op de kaart) of sleep de .zip naar de pagina.',
  'help.guide.install-plugin.step.2':
    'Lees onder Geïnstalleerd de rij: waartoe de plugin toegang heeft, met welke hosts hij verbinding maakt, en of hij Beoordeeld en Ondertekend is. Zet daarna ‘Plugin inschakelen’ aan. In de rij staat nu ‘Actief’.',
  'help.guide.install-plugin.step.3':
    'In het ⋯-menu van de rij vind je ‘Opnieuw starten’, ‘Foutenlog bekijken’, ‘Toegestane hosts’ en ‘Versie wijzigen…’, plus de links naar de broncode. Met ‘Verwijderen’ verwijder je de plugin en de gegevens ervan. Een nieuwere versie verschijnt als update in de rij. Vraagt die om nieuwe rechten, dan blijft hij uit tot jij ze goedkeurt.',
  'help.guide.install-plugin.result':
    'De plugin draait in een eigen proces. Alles wat hij toevoegt, zoals widgets, kaartlagen of tools, verschijnt op de plek die de plugin daarvoor bepaalt.',
  'help.guide.install-plugin.tip.1':
    '‘Opnieuw scannen’ vindt een pluginmap die voor ontwikkeling is gekoppeld, ook zonder pakket.',
  'help.guide.install-plugin.tip.2':
    'Een niet-ondertekende plugin wordt als zodanig gemarkeerd. Installeer hem alleen als je de bron vertrouwt.',
  // storage-backends
  'help.guide.storage-backends.title': 'Uploads naar S3 verplaatsen of spiegelen',
  'help.guide.storage-backends.goal':
    'Bewaar bestanden op objectopslag, of kopieer elke upload naar een tweede backend.',
  'help.guide.storage-backends.step.1':
    'Klik onder ‘Backends’ op ‘Backend toevoegen’, geef de backend een ‘Naam’, kies het ‘Type’, Lokaal of S3, en vul de velden in. Wil je ergens anders een kopie, vink dan de ‘Mirrordoelen’ aan. Klik op ‘Toepassen’ en daarna op ‘Testen’ in de nieuwe rij om de verbinding te controleren.',
  'help.guide.storage-backends.step.2':
    "Wijs onder ‘Categorieën’ elk soort upload, zoals ‘Reisdocumenten’, ‘Reisverslag-foto's’ of ‘Back-ups’, toe aan een backend.",
  'help.guide.storage-backends.step.3':
    'Klik onderaan op ‘Wijzigingen opslaan’. Verwijst een categorie nu naar een andere plek, dan vraagt TREK of je ‘Bestaande objecten verplaatsen’ of ‘Alleen nieuwe schrijfacties omleiden’ wilt.',
  'help.guide.storage-backends.result':
    'Nieuwe uploads gaan naar de toegewezen backend. Verplaatste bestanden worden vanaf daar geleverd, en wat je niet wilde verplaatsen, blijft waar het stond.',
  'help.guide.storage-backends.tip.1':
    'Een backend die via omgevingsvariabelen is ingesteld, zie je hier wel, maar kun je niet bewerken.',
  'help.guide.storage-backends.tip.2':
    'Een spiegeldoel krijgt een kopie van elke nieuwe schrijfactie. Met ‘Nu synchroniseren’ in de rij kopieer je wat er al eerder was opgeslagen. Een traag doel vertraagt elke upload naar die backend.',
  // channels-instance
  'help.guide.channels-instance.title': 'De meldingskanalen instellen',
  'help.guide.channels-instance.goal': 'Bepaal welke kanalen gebruikers mogen kiezen, en stel e-mail in.',
  'help.guide.channels-instance.step.1':
    'Zet ‘E-mail (SMTP)’ aan in de kop van de kaart, vul SMTP Host, SMTP Port, SMTP User, SMTP Password en het From Address in en klik op ‘Opslaan’. ‘Test-e-mail verzenden’ stuurt een e-mail naar jou. ‘TLS-certificaatcontrole overslaan’ is alleen bedoeld voor een lokale mailserver met een eigen certificaat.',
  'help.guide.channels-instance.step.2':
    'Zet Webhook, Ntfy en Web Push aan om ze aan te bieden. Gebruikers vullen dan zelf hun URL of onderwerp in, of zetten push per apparaat aan, onder Instellingen, Meldingen.',
  'help.guide.channels-instance.step.3':
    '‘Reisherinneringen’ zet de herinnering voor het begin van een reis aan of uit; ‘In-app’ staat altijd aan.',
  'help.guide.channels-instance.result':
    'Op het tabblad Meldingen van elke gebruiker staan de kanalen die je hebt aangezet.',
  'help.guide.channels-instance.tip.1':
    'De Ntfy-server-URL in de kaart Admin-Ntfy is ook de standaardserver voor gebruikers. Gebruikers kunnen nog steeds hun eigen server instellen.',
  'help.guide.channels-instance.tip.2':
    'Kanalen van plugins verschijnen vanzelf zodra een plugin met die functie actief is.',
  // admin-channels
  'help.guide.admin-channels.title': 'Beheermeldingen op je telefoon ontvangen',
  'help.guide.admin-channels.goal':
    "Krijg meldingen over nieuwe releases, mislukte opslagspiegels en aanvragen voor peddelregio's.",
  'help.guide.admin-channels.step.1':
    'Vul onder Admin-Ntfy het Admin-onderwerp in en zo nodig de Ntfy-server-URL en een ‘Toegangstoken (optioneel)’. Vul onder Admin-webhook een URL in. Klik in elke kaart op ‘Opslaan’.',
  'help.guide.admin-channels.step.2':
    'Klik op ‘Test-Ntfy verzenden’ of ‘Testwebhook verzenden’ om te zien of er een bericht binnenkomt.',
  'help.guide.admin-channels.result':
    'Beheerdersgebeurtenissen gaan in de app naar elke beheerder en, waar je dat hebt aangezet, naar het ntfy-onderwerp en de webhook voor beheerders.',
  'help.guide.admin-channels.tip.1':
    'Houd het beheertopic gescheiden van je persoonlijke topic, zodat meldingen over storingen niet verloren gaan tussen de reisberichten.',
  'help.guide.admin-channels.tip.2':
    'De webhook en het onderwerp voor beheerders staan los van je eigen kanalen onder Instellingen, Meldingen.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'AI-toegang intrekken',
  'help.guide.mcp-tokens-admin.goal':
    'Bekijk alle tokens en sessies die AI-clients hebben, van elke gebruiker, en trek ze in.',
  'help.guide.mcp-tokens-admin.step.1':
    'Zoek onder ‘OAuth-sessies’ de client op naam en eigenaar; de chips tonen de toegekende scopes. Met de prullenbak trek je de sessie na bevestiging in.',
  'help.guide.mcp-tokens-admin.step.2':
    'Onder ‘API-tokens’ hetzelfde voor tokens: naam, eigenaar, ‘Aangemaakt’ en ‘Laatst gebruikt’. De prullenbak verwijdert het token, en de client werkt direct niet meer.',
  'help.guide.mcp-tokens-admin.result':
    'De gebruiker van de client moet hem opnieuw koppelen. Verder verandert er niets.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Rechten laten zien wat een client zou kunnen doen. Een recht dat alleen lezen toestaat, kun je gerust laten staan.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Zet je de add-on MCP uit, dan stoppen alle clients meteen en verdwijnt dit tabblad, maar er wordt niets verwijderd: zodra je hem weer aanzet, werken de tokens weer.',
  // release-history
  'help.guide.release-history.title': 'Controleren op een nieuwe versie',
  'help.guide.release-history.goal': 'Weet of je TREK up-to-date is en wat de volgende versie brengt.',
  'help.guide.release-history.step.1':
    "Is er een nieuwere release, dan staat onder de paginakop ‘Update beschikbaar’, met de versie die je nu gebruikt. ‘Bekijk op GitHub’ opent de release, en ‘Hoe bij te werken’ toont de commando's voor Docker of de updatehandleiding voor andere installaties.",
  'help.guide.release-history.step.2':
    'Release-geschiedenis toont alle versies met hun releasenotes. Met ‘Details tonen’ klap je ze uit, de nieuwste versie heeft het label Nieuwste, en met ‘Meer laden’ zie je oudere versies.',
  'help.guide.release-history.result':
    'Je werkt bij op de host, door de nieuwe image op te halen of de nieuwe tag te bouwen; de datamap blijft behouden.',
  'help.guide.release-history.tip.1': 'Maak een back-up voordat je bijwerkt. Het tabblad Back-up staat hiernaast.',
  'help.guide.release-history.tip.2':
    'Pre-releases worden getoond, maar niet als update aangekondigd, tenzij je zelf een pre-release gebruikt.',
  // create-backup
  'help.guide.create-backup.title': 'Een back-up maken en terugzetten',
  'help.guide.create-backup.goal':
    'Maak een back-up van de hele instantie, bewaar een kopie op een andere plek en zorg dat je hem kunt terugzetten.',
  'help.guide.create-backup.step.1':
    'Klik onder Gegevensback-up rechtsboven op ‘Back-up aanmaken’. Daarmee sla je de database en de uploads samen in één bestand op de server op.',
  'help.guide.create-backup.step.2':
    'Met ‘Downloaden’ bewaar je een kopie buiten de server. Met de prullenbak verwijder je oude back-ups, na een bevestiging.',
  'help.guide.create-backup.step.3':
    '‘Herstellen’ bij een back-up, of ‘Back-up uploaden’ met een bestand, vervangt alle huidige gegevens zodra je bij ‘Back-up herstellen?’ op ‘Ja, herstellen’ klikt.',
  'help.guide.create-backup.result':
    'Bij herstellen komen gebruikers, reizen, bestanden en instellingen precies terug zoals ze in die back-up stonden.',
  'help.guide.create-backup.tip.1':
    'Terugzetten is de enige actie hier die je niet ongedaan kunt maken. Maak eerst een nieuwe back-up.',
  'help.guide.create-backup.tip.2':
    'Back-ups worden opgeslagen in de datamap. Kopieer ze naar een andere computer, zodat ze veilig zijn als deze computer uitvalt.',
  // auto-backup
  'help.guide.auto-backup.title': 'Back-ups inplannen',
  'help.guide.auto-backup.goal': 'Laat de server zelf back-ups maken en oude back-ups opruimen.',
  'help.guide.auto-backup.step.1':
    'Zet onder ‘Auto-back-up’ de optie ‘Auto-back-up inschakelen’ aan en kies het ‘Interval’ (Elk uur, Dagelijks, Wekelijks of Maandelijks), ‘Uitvoeren om’ en, bij wekelijks of maandelijks, de ‘Dag van de week’ of ‘Dag van de maand’.',
  'help.guide.auto-backup.step.2':
    'Kies onder ‘Oude back-ups verwijderen na’ hoelang een back-up bewaard blijft, van 1 dag tot ‘Voor altijd bewaren’, en klik op ‘Opslaan’.',
  'help.guide.auto-backup.result':
    'Back-ups verschijnen volgens schema in de lijst. Back-ups die ouder zijn dan de ingestelde bewaartermijn, worden verwijderd.',
  'help.guide.auto-backup.tip.1':
    '‘Uitvoeren om’ gebruikt de tijd van de server. De tip eronder toont de tijdzone van de server.',
  'help.guide.auto-backup.tip.2':
    'De opslag op de server is beperkt: 7 of 14 dagen is meestal genoeg, met een gedownloade kopie op een andere plek.',
  // audit-log
  'help.guide.audit-log.title': 'Het auditlogboek lezen',
  'help.guide.audit-log.goal': 'Zoek uit wie wat heeft gedaan, en wanneer.',
  'help.guide.audit-log.step.1':
    'Lees de rijen, de nieuwste bovenaan: Tijd, Gebruiker, Actie, Bron, IP en Details. Acties zijn genoemd naar wat er gebeurde, zoals een mislukte aanmelding, een wijziging van MFA of een herstel.',
  'help.guide.audit-log.step.2':
    '‘Vernieuwen’ rechtsboven laadt de lijst opnieuw. De badge naast de titel toont hoeveel vermeldingen van het totaal zijn geladen, en ‘Meer laden’ laadt oudere vermeldingen.',
  'help.guide.audit-log.result':
    'Je hebt een overzicht dat je kunt laten zien aan iedereen die vraagt waarom er iets is veranderd.',
  'help.guide.audit-log.tip.1': 'Tijden staan in de tijdzone van de server.',
  'help.guide.audit-log.tip.2':
    'Er kan alleen iets aan het logboek worden toegevoegd. In de app kun je hier niets bewerken of verwijderen.',
  // document-providers
  'help.guide.document-providers.title': 'Een documentopslag aanbieden',
  'help.guide.document-providers.goal': 'Bepaal met welke opslagdiensten een reis zijn documenten kan synchroniseren.',
  'help.guide.document-providers.step.1':
    'Op de tegel Documenten staan de opslagdiensten als rijen: Paperless-ngx, Papra, Nextcloud, OpenCloud en Synology Drive. Alle vijf staan in het begin uit, en de rijen zijn alleen te zien zolang Documenten zelf aanstaat.',
  'help.guide.document-providers.step.2':
    'Zet de schakelaar op de rij van Nextcloud aan. Je krijgt de melding ‘Add-on bijgewerkt’, en vanaf nu vinden reiseigenaren Documentsynchronisatie op het tabblad Bestanden van hun reizen, met Nextcloud onder ‘Aanbieder koppelen’.',
  'help.guide.document-providers.result':
    'De opslagdienst is beschikbaar in elke reis op deze TREK. Er wordt pas iets gekoppeld als een reiseigenaar dat doet.',
  'help.guide.document-providers.tip.1':
    'Hier bepaal je alleen of een opslagdienst mag worden aangeboden. Het adres en de inloggegevens horen bij een reis en worden door de eigenaar van de reis ingevuld op het tabblad Bestanden, nooit in het beheerpaneel.',
  'help.guide.document-providers.tip.2':
    "Zet je Documenten uit, dan gaan alle opslagdiensten ook uit, en zolang Documenten uit staat, kun je geen opslagdienst aanzetten: de server antwoordt dan met 'Enable the Documents addon first'. Voor een opslagdienst op je eigen netwerk moet op de server ook ALLOW_INTERNAL_NETWORK=true staan.",

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Reis',
  'help.ctx.trip.summary':
    'Alles over één reis: de planning met dagen, kaart en plaatsen, en de tabbladen voor tochten, vervoer, boekingen, lijsten, onkosten, bestanden, samenwerking en een gekoppeld reisverslag. Voor elk daarvan is er een eigen helpscherm, onder dit scherm.',
  'help.ctx.trip.bullet.1':
    'De tabbalk onder de bovenbalk: Planning, Tochten, Transport, Boekingen, Lijsten, Onkosten, Bestanden, Samenwerking en, zodra er een reisverslag is gekoppeld, Reisverslag. Welke tabbladen er op jouw TREK zijn, hangt af van de add-ons en plugins.',
  'help.ctx.trip.bullet.2':
    'Planning heeft drie kolommen: de dagen links, de kaart in het midden, de plaatsen rechts. Met de add-on Roadtrip begint de dagenkolom met een schakelaar Dagen en Roadtrip, met de add-on Tochten begint de plaatsenkolom met Plaatsen en Tochten. Boekingen en vervoer horen bij de planning, bij de stop en tussen stops; de tabbladen zetten ze op een rij.',
  'help.ctx.trip.bullet.3':
    '‘Reisinstellingen’, de pil naast de naam van de reis linksboven, opent de instellingen van de reis: ‘Personen’ (leden en gasten), ‘Wordt gedeeld’ (de openbare alleen-lezenlink en de uitnodigingslink) en ‘Reisverslag’.',
  'help.ctx.trip.bullet.4':
    'Titel, data, omslagfoto en valuta bewerk je vanuit ‘Mijn reizen’, met het potlood op de reiskaart. Met de naam van de reis linksboven ga je daar weer naartoe.',
  'help.ctx.trip.bullet.5':
    'Met het lipje aan de binnenkant van een kolom klap je de kolom in, en de kaart gebruikt de vrijgekomen ruimte. Een ingeklapte kolom verschijnt als klein tegeltje in de bovenhoek van de kaart: klik erop om de kolom weer te tonen. Sleep de dunne scheidingslijn naast een kolom om de breedte aan te passen.',
  'help.ctx.trip.bullet.6':
    'Met de pijl Ongedaan maken in de werkbalk van de dagen draai je je recente wijzigingen in de planning een voor een terug.',
  // add-member
  'help.guide.add-member.title': 'Een lid toevoegen',
  'help.guide.add-member.goal': 'Geef iemand met een TREK-account toegang tot deze reis.',
  'help.guide.add-member.step.1':
    'Klik op ‘Reisinstellingen’, het label naast de naam van de reis linksboven. Het venster opent op Personen.',
  'help.guide.add-member.step.2':
    'Kies onder ‘Gebruiker uitnodigen’ de persoon bij ‘Selecteer gebruiker…’ en klik op ‘Uitnodigen’.',
  'help.guide.add-member.step.3':
    'De persoon staat nu onder ‘Toegang’. De badge ‘Eigenaar’ geeft de eigenaar aan. Met ‘Toegang verwijderen’ aan het eind van een rij haal je de persoon na bevestiging weg.',
  'help.guide.add-member.result':
    'Het lid kan de reis net als jij bekijken en bewerken, binnen de grenzen die de beheerder onder Rechtinstellingen heeft ingesteld.',
  'help.guide.add-member.tip.1':
    'Staat iemand niet in de lijst, dan heeft die persoon nog geen TREK-account: voeg hem of haar toe als gast, of laat hem of haar zich registreren via een uitnodigingslink.',
  'help.guide.add-member.tip.2': 'Het getal naast Toegang telt de mensen in de reis. Gasten staan apart daaronder.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Uitnodigen via een link',
  'help.guide.trip-invite-link.goal': 'Laat mensen zelf lid worden van de reis.',
  'help.guide.trip-invite-link.step.1':
    'Klik naast de naam van de reis op ‘Reisinstellingen’ en kies links ‘Wordt gedeeld’. Klik onder ‘Uitnodigingslink voor reis’ op ‘Uitnodigingslink maken’.',
  'help.guide.trip-invite-link.step.2':
    'Klik op Kopiëren en stuur de link door. Iedereen met een TREK-account die de link opent, wordt lid van de reis.',
  'help.guide.trip-invite-link.step.3':
    "'Opnieuw genereren' vervangt de link, waarna de oude link niet meer werkt; met Uitschakelen zet je hem uit.",
  'help.guide.trip-invite-link.result': 'Iedereen die de link opent, wordt lid van de reis en staat onder Toegang.',
  'help.guide.trip-invite-link.tip.1':
    'Iemand zonder account kan de link niet gebruiken. Een beheerder maakt registratielinks aan onder Beheerder, Gebruikers, en kan er een aan deze reis koppelen.',
  'help.guide.trip-invite-link.tip.2':
    'Heb je de link in de verkeerde chat gezet? Genereer hem dan opnieuw: de oude link werkt meteen niet meer.',
  // add-guest
  'help.guide.add-guest.title': 'Een gast zonder account toevoegen',
  'help.guide.add-guest.goal': 'Voeg iemand aan de reis toe die TREK niet gebruikt.',
  'help.guide.add-guest.step.1':
    'Klik naast de naam van de reis op ‘Reisinstellingen’. Bij ‘Personen’ is ‘Gasten’ het laatste onderdeel, onder ‘Toegang’.',
  'help.guide.add-guest.step.2': 'Typ de naam bij ‘Naam van gast’ en klik op ‘Gast toevoegen’.',
  'help.guide.add-guest.result':
    'Je kunt de gast koppelen aan onkosten, inpakitems en taken, maar de gast kan niet inloggen.',
  'help.guide.add-guest.tip.1':
    '‘Hernoemen’ (het potlood) wijzigt de naam van een gast. ‘Toegang verwijderen’ (de prullenbak) verwijdert de gast na bevestiging: de toewijzingen van de gast worden verwijderd, en het aandeel in elke uitgave wordt verdeeld over de anderen in die verdeling.',
  'help.guide.add-guest.tip.2':
    'Krijgt de persoon later een account, nodig hem of haar dan uit als lid en verwijder de gast.',
  // public-link
  'help.guide.public-link.title': 'Een link publiceren waarmee anderen alleen kunnen kijken',
  'help.guide.public-link.goal': 'Laat de reis zien aan mensen die hem niet mogen bewerken.',
  'help.guide.public-link.step.1':
    'Klik op ‘Reisinstellingen’ naast de naam van de reis en kies links ‘Wordt gedeeld’.',
  'help.guide.public-link.step.2':
    'Zet in de kaart Openbare link aan wat de link mag tonen. ‘Kaart en plan’ staat altijd aan. Boekingen, Paklijst, Onkosten en Chat kies je zelf.',
  'help.guide.public-link.step.3':
    "Onder Opties laat ‘Alleen vervoer en verblijf’ activiteiten, dagnotities en lege dagen weg. ‘Zonder foto’s’ laat de foto's van plaatsen weg.",
  'help.guide.public-link.result':
    'Iedereen met de link ziet de gekozen onderdelen zonder in te loggen en kan niets wijzigen.',
  'help.guide.public-link.tip.1':
    'De link staat nergens vermeld, maar iedereen die hem heeft, kan hem openen. Ga er net zo zorgvuldig mee om als met een wachtwoord.',
  'help.guide.public-link.tip.2': 'Moet iemand kunnen bewerken, voeg die persoon dan als lid toe.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'De reis overdragen of verlaten',
  'help.guide.transfer-ownership.goal': 'Maak iemand anders eigenaar, of verlaat een reis die niet van jou is.',
  'help.guide.transfer-ownership.step.1':
    'Klik naast de naam van de reis op ‘Reisinstellingen’. Klik onder ‘Toegang’ in de rij van een lid op ‘Eigenaar maken’ (de kroon) en bevestig.',
  'help.guide.transfer-ownership.step.2':
    'Met ‘Reis verlaten’ op je eigen rij verlaat je de reis nadat je het hebt bevestigd. Ben je de eigenaar, draag het eigendom dan eerst over.',
  'help.guide.transfer-ownership.result':
    'De nieuwe eigenaar beheert de leden en kan de reis verwijderen; jij blijft gewoon lid.',
  'help.guide.transfer-ownership.tip.1':
    'De eigenaar is degene die de reis heeft aangemaakt, totdat het eigendom wordt overgedragen. Alleen de eigenaar kan de reis verwijderen.',
  'help.guide.transfer-ownership.tip.2':
    '‘Toegang verwijderen’ op de rij van een ander lid werkt andersom: de eigenaar verwijdert dat lid uit de reis.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Ruimte maken voor de kaart',
  'help.guide.collapse-columns.goal': 'Klap een kolom in of maak hem breder.',
  'help.guide.collapse-columns.step.1':
    'Klik op het lipje met het paneelicoon aan de binnenkant van de dagenkolom om de kolom in te klappen; de kaart gebruikt dan de vrijgekomen ruimte. De plaatsenkolom heeft hetzelfde lipje.',
  'help.guide.collapse-columns.step.2':
    'Is een kolom ingeklapt, dan verschijnt in de bovenhoek van de kaart een klein tegeltje met het paneelpictogram. De knopinfo zegt Planning of Plaatsen. Klik erop om de kolom weer te tonen.',
  'help.guide.collapse-columns.step.3':
    'Sleep de dunne scheidingslijn tussen een kolom en de kaart om de kolom breder of smaller te maken.',
  'help.guide.collapse-columns.result':
    'De breedtes worden onthouden. Bij je volgende bezoek zijn de kolommen weer uitgeklapt.',
  'help.guide.collapse-columns.tip.1': 'Je kunt beide kolommen tegelijk inklappen, zodat je alleen de kaart ziet.',
  'help.guide.collapse-columns.tip.2':
    'In een smal venster past maar één kolom: open je er een, dan klapt de andere in. Op een telefoon zijn er geen kolommen; met Reis, Planning en Plaatsen bovenaan wissel je tussen de weergaven.',
  // undo-change
  'help.guide.undo-change.title': 'De laatste wijziging ongedaan maken',
  'help.guide.undo-change.goal': 'Draai je laatste wijziging in de planning terug.',
  'help.guide.undo-change.step.1':
    'Klik op de pijl voor ongedaan maken in de werkbalk boven de dagen. De tooltip laat zien welke wijziging wordt teruggedraaid.',
  'help.guide.undo-change.result':
    'De planning is weer zoals ze was, en een kort bericht meldt wat er ongedaan is gemaakt.',
  'help.guide.undo-change.tip.1':
    '‘Ongedaan maken’ werkt voor de planning: plaatsen toevoegen, toewijzen, verwijderen, herordenen, verplaatsen en vergrendelen, een dag leegmaken, een route optimaliseren, plaatsen verwijderen, categoriewijzigingen en imports.',
  'help.guide.undo-change.tip.2':
    'Klik nog een keer om verder terug te gaan: TREK onthoudt je laatste 30 wijzigingen in deze reis, de nieuwste eerst, tot je de reis verlaat.',
  'help.guide.clear-day.title': 'Een dag leegmaken',
  'help.guide.clear-day.goal':
    'Haal in één keer alle plekken van een dag af, bijvoorbeeld om de dag helemaal opnieuw te plannen.',
  'help.guide.clear-day.step.1': 'Klik in de planning met de rechtermuisknop op de kop van de dag.',
  'help.guide.clear-day.step.2': 'Kies ‘Dag leegmaken’ en bevestig.',
  'help.guide.clear-day.result':
    'De dag is leeg en de plekken staan weer als ongepland in de lijst. Met de pijl voor ongedaan maken boven de dagen zet je ze terug.',
  'help.guide.clear-day.tip.1':
    'Alleen de plaatsen worden verwijderd. De notities en boekingen van de dag blijven staan.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Plaatsen',
  'help.ctx.trip-places.summary':
    'De rechterkolom van de planning: alle plaatsen van de reis, gepland of niet, met zoeken, filters en sorteren, en de manieren om plaatsen toe te voegen: via zoeken, handmatig of uit een gedeelde lijst. Met Plaatsen en Tochten bovenaan wissel je tussen de plaatsen en de tochten van de reis.',
  'help.ctx.trip-places.bullet.1':
    'Met Plaatsen en Tochten bovenaan de kolom wissel je van lijst. Als je binnenkomt, staat Plaatsen open. Tochten toont de tochten van de reis en importeert GPX-, KML- en KMZ-bestanden via ‘GPX of KML importeren’. Een tocht staat niet in de plaatsenlijst.',
  'help.ctx.trip-places.bullet.2':
    '‘Plaats/activiteit toevoegen’ opent het formulier voor een plaats die je opzoekt of intypt. Is er een dag open, dan heet de knop ‘Nieuwe plek’, en met ‘Naar dag’ ernaast maak je de plaats meteen op die dag aan.',
  'help.ctx.trip-places.bullet.3':
    '‘Plaatsen importeren’, de pictogramknop ernaast, biedt ‘Lijst importeren’ voor een lijst die vanuit Google Maps of Naver Maps is gedeeld. Heeft een beheerder de add-on Tochten uitgeschakeld, dan is er ook ‘Bestand importeren’ voor .gpx-, .kml- en .kmz-bestanden, en kun je een bestand op de kolom neerzetten.',
  'help.ctx.trip-places.bullet.4':
    'Daaronder staan ‘Zoeken’, dat ook in beschrijvingen en notities zoekt, en het vinkje ‘Kiezen’ ernaast. De rij daaronder bevat de filters: ‘Tonen’ wisselt tussen Alle, Ongepland en Gepland, elk met het aantal. De labelknop filtert op categorie, de ster op een minimale beoordeling, de wereldbol (zodra de reis meer dan één land of regio beslaat) op land of regio, en ‘Sorteren op’ bepaalt de volgorde van de lijst.',
  'help.ctx.trip-places.bullet.5':
    'Een rij toont afbeelding, naam en beschrijving of adres, en een ster met de gemiddelde beoordeling zodra iemand de plaats heeft beoordeeld. Klik erop voor de details van de plaats, sleep hem naar een dag, of klik met de rechtermuisknop (of op ‘Meer opties’, de drie puntjes) voor ‘Bewerken’, ‘+ Dag’, ‘Website openen’, Google Maps, ‘In collectie opslaan’ en ‘Verwijderen’.',
  'help.ctx.trip-places.bullet.6':
    'Is er een dag open, dan voegt de ronde + aan het eind van een rij (‘+ Dag’) de plaats aan die dag toe. Die + staat bij elke plaats die nog niet op die dag staat. ‘Gepland’ toont dan alleen die dag, en de chip ‘Alleen de geopende dag wordt getoond’ geeft dat aan. Met het kruisje erop, ‘Hele reis tonen’, sluit je de dag.',
  // create-place
  'help.guide.create-place.title': 'Een plaats aanmaken',
  'help.guide.create-place.goal':
    'Voeg zelf een plaats of activiteit toe, met alle gegevens die de planning nodig heeft.',
  'help.guide.create-place.step.1':
    'Klik bovenaan de plaatsenkolom op ‘Plaats/activiteit toevoegen’ (‘Nieuwe plek’ als er een dag open is). Het formulier opent met de cursor in het zoekveld.',
  'help.guide.create-place.step.2':
    "Typ de plaats in ‘Plekken zoeken…’ en kies een resultaat. De naam bovenaan het venster, Adres, Breedtegraad, Lengtegraad en Website worden ingevuld, en Plaatsdetails links toont foto's, openingstijden en een beschrijving. Heeft je TREK een Google-sleutel, dan zoek je met ‘Niet de juiste plek? Zoek in plaats daarvan met Google’ onder de resultaten hetzelfde via Google. Staat Collecties aan, dan biedt ‘Opgeslagen plekken’ rechts op dezelfde manier de plaatsen uit je lijsten aan.",
  'help.guide.create-place.step.3':
    'Klik in ‘Plaatsdetails’ onder ‘Kies een afbeelding’ op een afbeelding om die als afbeelding van de plaats te gebruiken. ‘Deze tekst gebruiken’ kopieert de beschrijving naar het formulier.',
  'help.guide.create-place.step.4':
    'Controleer de velden van het formulier. De naam bovenin het venster is het enige verplichte veld. De pil ‘Categorie’ eronder kiest een van de categorieën van de reis, en met de + ernaast maak je een nieuwe. Adres, Breedtegraad en Lengtegraad komen uit de zoekopdracht of typ je zelf. Beschrijving en Notities zijn voor je eigen tekst. Bij Website vul je de link in, ‘Bijvoegen’ onder Bestanden voegt een document toe, en Telefoon, E-mail en ‘Openingstijden toevoegen’ zijn voor gegevens die de zoekopdracht niet vond.',
  'help.guide.create-place.step.5':
    'Klik op Toevoegen. Staat er al een plek met dezelfde naam of op dezelfde locatie in de reis, dan waarschuwt TREK je en verandert de knop in ‘Toch toevoegen’.',
  'help.guide.create-place.result':
    'De plek staat in de lijst en op de kaart, onder Ongepland tot je hem op een dag zet.',
  'help.guide.create-place.tip.1':
    '‘Kosten’ onderaan het formulier opent, als de add-on Budget aanstaat, direct na het opslaan de editor Onkosten voor de uitgave van de plaats. Een afbeelding of pdf die je in het venster plakt, wordt als bestand bijgevoegd onder ‘Bestanden’.',
  'help.guide.create-place.tip.2':
    'Op elke TREK komen de zoekresultaten uit de TREK-index en OpenStreetMap, en Plaatsdetails wordt automatisch aangevuld uit Wikipedia, Wikivoyage en Wikimedia. TREK vraagt het alleen aan Google als die allebei niets vinden, en alleen Google levert beoordelingen.',
  'help.guide.create-place.tip.3':
    'Je kunt ook een plek op de kaart aanmaken: klik met de rechtermuisknop op de plek, en het formulier opent met de coördinaten en het adres al ingevuld.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Een plaats direct aan de geopende dag toevoegen',
  'help.guide.place-to-open-day.goal': 'Maak een plaats aan of kies er een, en voeg hem in één stap aan de dag toe.',
  'help.guide.place-to-open-day.step.1':
    'Klik in de dagenkolom op de kop van een dag. De dag is nu open: de kaart ervan is gemarkeerd en in de plaatsenkolom staat de knop ‘Naar dag’ naast ‘Nieuwe plek’.',
  'help.guide.place-to-open-day.step.2':
    '‘Naar dag’ opent hetzelfde formulier als ‘Nieuwe plek’, maar de plaats wordt meteen aan de geopende dag toegevoegd als je op ‘Toevoegen’ klikt.',
  'help.guide.place-to-open-day.step.3':
    'Wil je een bestaande plaats aan de geopende dag toevoegen, klik dan op de ronde + aan het eind van de rij (+ Dag), of klik met de rechtermuisknop en kies ‘+ Dag’. De + staat bij elke plaats die nog niet op die dag staat.',
  'help.guide.place-to-open-day.step.4':
    'Het kan ook andersom, zonder eerst een dag te openen: sleep de rij van de plaats uit de kolom naar een dagkaart. Zet je hem tussen twee stops neer, dan komt hij precies daar te staan.',
  'help.guide.place-to-open-day.result':
    'De plaats staat onderaan bij de dag; sleep hem omhoog of omlaag naar de juiste plek.',
  'help.guide.place-to-open-day.tip.1':
    'De geopende dag bepaalt ook het zoeken: is er een dag open, dan gaan de kaart en het zoeken in de buurt uit van de plekken die al op die dag staan.',
  'help.guide.place-to-open-day.tip.2':
    'Met ‘Ongedaan maken’ in de werkbalk boven de dagen draai je de toewijzing terug.',
  // filter-places
  'help.guide.filter-places.title': 'Een plek in de lijst vinden',
  'help.guide.filter-places.goal': 'Toon in de kolom alleen de plekken die je zoekt.',
  'help.guide.filter-places.step.1':
    '‘Tonen’, het keuzemenu onder het zoekveld, wisselt tussen ‘Alle’, ‘Ongepland’ (nog op geen enkele dag) en ‘Gepland’ (op een dag), elk met het aantal. Staat de add-on Tochten uit en is er een GPX-track geïmporteerd, dan is er ook ‘Routes’.',
  'help.guide.filter-places.step.2':
    'Typ bovenaan in ‘Zoeken’. De lijst wordt korter terwijl je typt, op naam, adres, beschrijving en notities; met de x in het veld maak je het leeg.',
  'help.guide.filter-places.step.3':
    'De labelknop naast ‘Tonen’ toont de categorieën: vink er een of meer aan, ‘Geen categorie’ is er een van. De knop toont hoeveel er zijn aangevinkt, en met ‘Filter wissen’ onderaan de lijst haal je ze allemaal weg.',
  'help.guide.filter-places.step.4':
    'Met de ster ernaast stel je een minimale beoordeling in: 5+, 4+ enzovoort tonen alleen plaatsen met een gemiddelde beoordeling van minstens die waarde. Plaatsen zonder beoordeling worden verborgen.',
  'help.guide.filter-places.result':
    'Het getal op Tonen geeft aan hoeveel plaatsen overeenkomen. Je kunt filters combineren.',
  'help.guide.filter-places.tip.1':
    "Is er een dag geopend, dan toont Gepland alleen die dag, en dat staat er ook: 'Alleen de geopende dag wordt getoond', met 'Hele reis tonen' ernaast.",
  'help.guide.filter-places.tip.2':
    'Ook de kaart houdt rekening met Tonen, de categorieën en de beoordeling. Staat er een dag open, dan toont Gepland op de kaart alleen die dag. Het zoekveld en de wereldbol filteren alleen de lijst.',
  // edit-place
  'help.guide.edit-place.title': 'Een plaats wijzigen',
  'help.guide.edit-place.goal': 'Verbeter een naam, verplaats de speld, voeg een website toe of wijzig de categorie.',
  'help.guide.edit-place.step.1':
    'Klik met de rechtermuisknop op de rij en kies ‘Bewerken’, klik aan het eind van de rij op ‘Meer opties’, of open de plaats en klik in de details op ‘Bewerken’.',
  'help.guide.edit-place.step.2':
    'Pas in ‘Plaats bewerken’ aan wat nodig is: de naam en de pil ‘Categorie’ bovenin het venster, Adres, Breedtegraad en Lengtegraad, Beschrijving, Notities, Website, Telefoon, E-mail en de openingstijden. Staat de plaats op precies één dag, of heb je hem vanuit een dag geopend, dan heeft het formulier ook ‘Start’, ‘Einde’ en ‘Notities voor deze dag’.',
  'help.guide.edit-place.step.3': 'Klik op Bijwerken.',
  'help.guide.edit-place.result':
    'De wijziging geldt overal waar de plek staat: in de lijst, op de kaart en op elke dag.',
  'help.guide.edit-place.tip.1':
    '‘Notities voor deze dag’ horen bij de plek op die ene dag, Notities bij de plek zelf.',
  'help.guide.edit-place.tip.2':
    'Een Einde vóór het begin blokkeert Bijwerken. ‘Tijdoverlap met:’ waarschuwt alleen dat een andere stop op die dag dezelfde tijd heeft.',
  // delete-place
  'help.guide.delete-place.title': 'Een plaats verwijderen',
  'help.guide.delete-place.goal': 'Verwijder een plaats definitief uit de reis.',
  'help.guide.delete-place.step.1':
    'Klik met de rechtermuisknop op de rij en kies ‘Verwijderen’ (dat staat ook onder ‘Meer opties’ aan het eind van de rij), of klik op ‘Verwijderen’ in de details van de plaats.',
  'help.guide.delete-place.step.2':
    'Klik in de bevestigingsvraag op Verwijderen. Is er bij de plaats een overnachting geboekt of is er een boeking aan gekoppeld, dan staat in de vraag wat er mee wordt verwijderd.',
  'help.guide.delete-place.result':
    'De plek verdwijnt uit de lijst, van de kaart en van elke dag. Met ‘Ongedaan maken’ in de werkbalk boven de dagen haal je hem terug.',
  'help.guide.delete-place.tip.1':
    'Wil je een plek maar van één dag halen, gebruik dan ‘Verwijderen van dag’ bij die stop.',
  'help.guide.delete-place.tip.2':
    'Wil je meerdere plekken tegelijk verwijderen, klik dan op het vinkje naast het zoekveld om een selectie te starten.',
  // select-places
  'help.guide.select-places.title': 'Meerdere plekken tegelijk wijzigen of verwijderen',
  'help.guide.select-places.goal': 'Pas veel plaatsen tegelijk aan, in plaats van een voor een.',
  'help.guide.select-places.step.1':
    'Klik op het vinkje naast het zoekveld. De rijen krijgen ronde selectievakjes, en onderaan de kolom verschijnt een balk met de acties.',
  'help.guide.select-places.step.2':
    "Klik op de rijen om ze aan te vinken. 'Alles selecteren', het dubbele vinkje in de balk, selecteert alle rijen die de filters tonen.",
  'help.guide.select-places.step.3':
    'De balk telt de aangevinkte plaatsen. ‘Categorie wijzigen’ geeft ze allemaal één categorie; ‘In collectie opslaan’ (als Collecties aanstaat) kopieert ze naar een van je collecties; ‘Selectie verwijderen’ verwijdert ze na bevestiging.',
  'help.guide.select-places.step.4': 'Klik op Klaar, de X aan het eind van de balk, om de selectie af te sluiten.',
  'help.guide.select-places.result':
    'De wijziging geldt voor alle geselecteerde plekken. Een verwijdering kun je ongedaan maken via de werkbalk boven de dagen.',
  'help.guide.select-places.tip.1':
    'De filters blijven werken terwijl je selecteert: filter eerst op Ongepland, dan selecteert ‘Alles selecteren’ alleen die plekken.',
  'help.guide.select-places.tip.2':
    '‘Markeer als bezocht in je lijsten’ verschijnt in de balk als de add-on Collecties aanstaat: daarmee markeer je de plekken als bezocht in de collecties waarin ze zijn opgeslagen.',
  // import-places-file
  'help.guide.import-places-file.title': 'Plekken importeren uit een GPX-, KML- of KMZ-bestand',
  'help.guide.import-places-file.goal':
    'Staat de add-on Tochten uit, importeer dan de markeringen en paden die je uit Google My Maps, Google Earth of een gps-tracker hebt geëxporteerd, als plaatsen.',
  'help.guide.import-places-file.step.1':
    'Klik op ‘Plaatsen importeren’, de pictogramknop naast de knop om toe te voegen, en kies ‘Bestand importeren’, of sleep het bestand ergens naar de plaatsenkolom. Beide kan alleen als een beheerder de add-on Tochten heeft uitgezet.',
  'help.guide.import-places-file.step.2':
    'Kies het bestand of sleep het in het vak. Vink bij een GPX aan wat je wilt importeren: Waypoints, Routes, ‘Tracks (met routegeometrie)’. Vink bij KML en KMZ ‘Punten (Placemarks)’ en ‘Paden (LineStrings)’ aan.',
  'help.guide.import-places-file.step.3':
    'Het vak accepteert meerdere bestanden tegelijk, maar alleen .gpx, .kml en .kmz. Elk ander bestandstype, of een bestand groter dan 10 MB, wordt in het venster geweigerd en niet geïmporteerd.',
  'help.guide.import-places-file.step.4':
    'Klik op ‘Importeren’. Een bericht meldt hoeveel plaatsen er zijn geïmporteerd. Bij een KML- of KMZ-bestand blijft het venster open met een overzicht van wat is aangemaakt en wat is overgeslagen.',
  'help.guide.import-places-file.result':
    'De plaatsen staan in de lijst. Een track heeft een gekleurde streep op de rij, staat op de kaart en krijgt een eigen filter ‘Routes’.',
  'help.guide.import-places-file.tip.1':
    "Een te groot bestand wordt geweigerd, en TREK toont de maximale grootte; exporteer het opnieuw zonder foto's, of splits het op.",
  'help.guide.import-places-file.tip.2': 'Je kunt de hele import ongedaan maken via de werkbalk boven de dagen.',
  // import-places-list
  'help.guide.import-places-list.title': 'Een gedeelde lijst uit Google Maps of Naver Maps importeren',
  'help.guide.import-places-list.goal': 'Importeer plaatsen via de link van een gedeelde lijst.',
  'help.guide.import-places-list.step.1':
    'Klik op ‘Plaatsen importeren’, de pictogramknop naast de knop om toe te voegen, en kies ‘Lijst importeren’.',
  'help.guide.import-places-list.step.2':
    'Kies onder Provider ‘Google Lijst’ of ‘Naver Lijst’ en plak de gedeelde link van de lijst in het veld Link. Een routelink van Google Maps werkt ook: de stops worden dan plaatsen, in de volgorde van de rit.',
  'help.guide.import-places-list.step.3': 'Klik op Importeren.',
  'help.guide.import-places-list.result':
    'Alle plekken uit de lijst staan in de reis, met de naam uit de lijst. Plekken die al in de reis stonden, worden overgeslagen.',
  'help.guide.import-places-list.tip.1':
    'De lijst moet openbaar gedeeld zijn. Met de link van een privélijst wordt niets geïmporteerd.',
  'help.guide.import-places-list.tip.2':
    "Heeft je TREK een Google-sleutel, dan zie je in het venster ‘Plaatsen verrijken via Google’: daarmee wordt elke geïmporteerde plek opgezocht en aangevuld met foto's, adres en details.",
  'help.guide.sort-places.title': 'De plaatsenlijst sorteren',
  'help.guide.sort-places.goal':
    'Sorteer de lijst op naam, op beoordeling of op wat het laatst is toegevoegd of gewijzigd.',
  'help.guide.sort-places.step.1':
    'Klik op ‘Sorteren op’, de knop met de pijltjes aan het eind van de filterrij. Een vinkje geeft de huidige volgorde aan, en de knopinfo toont de naam ervan.',
  'help.guide.sort-places.step.2':
    'Kies een volgorde, bijvoorbeeld ‘Hoogst beoordeeld’, of sorteer op naam. De lijst past zich meteen aan.',
  'help.guide.sort-places.result': 'De lijst toont de plekken in de gekozen volgorde, tot je een andere kiest.',
  'help.guide.sort-places.tip.1':
    'Bij elke andere sortering dan ‘Laatst toegevoegd’ wordt de knop gemarkeerd, zodat je meteen ziet dat de lijst anders gesorteerd is.',
  'help.guide.sort-places.tip.2':
    'Sorteren verandert alleen de lijst. De dagen houden hun eigen volgorde, en je browser onthoudt de volgorde die je hebt gekozen.',
  'help.guide.place-by-hand.title': 'Een plek toevoegen die de zoekfunctie niet kent',
  'help.guide.place-by-hand.goal':
    'Voer zelf een plaats in, met telefoonnummer, e-mailadres en openingstijden, als de zoekfunctie niets vindt.',
  'help.guide.place-by-hand.step.1':
    "Typ in het plaatsvenster de naam in het zoekveld en druk op Enter. Wordt er niets gevonden, dan meldt het venster dat en kun je kiezen voor 'Zelf toevoegen'.",
  'help.guide.place-by-hand.step.2':
    "Klik op 'Zelf toevoegen'. De tekst waarop je zocht, wordt de naam, en het venster scrolt naar de contactvelden.",
  'help.guide.place-by-hand.step.3': 'Vul Telefoon en E-mail in als je die weet.',
  'help.guide.place-by-hand.step.4':
    'Klik op ‘Openingstijden toevoegen’ en stel per dag in wanneer de plek open- en dichtgaat. Met de kopieerknop krijgt elke dag de tijden van de eerste dag, en met de schakelaar van een dag zet je die op Gesloten.',
  'help.guide.place-by-hand.step.5': 'Klik op Toevoegen.',
  'help.guide.place-by-hand.result':
    'De plek wordt aan de lijst toegevoegd. In de details staan het telefoonnummer, het e-mailadres en de openingstijden die je hebt ingevuld, net als bij een plek die via de zoekfunctie is gevonden.',
  'help.guide.place-by-hand.tip.1':
    'Bewerk je een plaats zonder eigen openingstijden, dan worden de openingstijden uit Plaatsdetails links automatisch overgenomen. Heeft de plaats al openingstijden, dan kun je de opgezochte tijden overnemen met een knop ernaast.',
  'help.guide.place-by-hand.tip.2':
    'Openingstijden die je zelf invult, vervangen de opgezochte tijden. Zo toont een café met seizoenstijden de tijden die jij kent.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dagen',
  'help.ctx.trip-days.summary':
    'De linkerkolom van de planning: per dag een kaart met de stops op volgorde, de notities, de boekingen en het vervoer van die dag en de route tussen de stops. Hier plan je de reis echt.',
  'help.ctx.trip-days.bullet.1':
    'De kop bovenaan: links ‘Exporteren’ (PDF, kalender, GPX); rechts de terugpijl, ‘Alle dagen uitklappen’ / ‘Alle dagen inklappen’, ‘Dagen herordenen’, en ‘Alle boekingsroutes tonen’ zodra een boeking een route heeft om te tekenen.',
  'help.ctx.trip-days.bullet.2':
    'Een dagkaart: een tegel met het dagnummer en de weersverwachting, de titel (Dag 1 tot je de dag een naam geeft) en de datum, en daaronder pillen voor de overnachting (groen bij inchecken, rood bij uitchecken, gestippeld zolang die niet is bevestigd; het ticket opent de boeking) en voor een huurauto. Klik op de kop om de dag te openen, met het pijltje klap je hem in, en de + (‘Toevoegen aan dag’) opent een menu: ‘Plaats toevoegen aan deze dag’, ‘Accommodatie toevoegen’, ‘Vervoer toevoegen’, ‘Openbaar vervoer’ en ‘Notitie toevoegen’. Met de rechtermuisknop op de kop krijg je hetzelfde, plus ‘Dag leegmaken’.',
  'help.ctx.trip-days.bullet.3':
    'In een dag: de stops op volgorde, elk met afbeelding, categoriepictogram, naam, tijd en beschrijving, de gekoppelde boekingen en wie er meegaat; notities; de boekingen en het vervoer van de dag, gekleurd naar type. Ga met de muis over een stop om de sleepgreep, het slotje op de afbeelding, de pijlen, ‘Boeking toevoegen’ en de drie puntjes (‘Meer opties’) te zien. Je kunt ook met de rechtermuisknop op stops en notities klikken om hun menu te openen.',
  'help.ctx.trip-days.bullet.4':
    'Heeft de geopende dag twee stops, dan verschijnt de routebalk eronder: ‘Route’ toont de dag op de kaart en de reistijd van elk traject tussen de stops, met de drie pictogrammen kies je Auto, Te voet of Fietsen voor de dag, en daarna volgen ‘Optimaliseren’, ‘Openen in Google Maps’ en ‘Openen in CoMaps’.',
  'help.ctx.trip-days.bullet.5':
    'Je kunt op verschillende manieren plekken aan een dag toevoegen: sleep een rij uit de plekkenkolom, gebruik ‘+ Dag’ op die rij, kies ‘Plaats toevoegen aan deze dag’ via de + van de dag of op een lege dag, of gebruik de details van de plek.',
  'help.ctx.trip-days.bullet.6':
    'Totale kosten onderaan telt de uitgaven uit Onkosten op die bij de stops en boekingen van de dag horen, elk één keer, in je weergavevaluta.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Een dag bekijken',
  'help.guide.read-day-plan.goal': 'Weet wat elk onderdeel van een dagkaart betekent voordat je iets wijzigt.',
  'help.guide.read-day-plan.step.1':
    'Bovenaan: een tegel met het dagnummer en de weersverwachting, dan Dag 1 of de titel die je de dag hebt gegeven, en de datum. Daaronder labels voor het verblijf van die nacht (groen bij inchecken, rood bij uitchecken, gestippeld zolang niet bevestigd; het ticketje erop opent de boeking) en voor een huurauto. Klik op de kop om de dag te openen (het detailpaneel opent boven de kaart). Met de + rechts (‘Toevoegen aan dag’) voeg je een plaats, verblijf, vervoer, OV-verbinding of notitie toe, en met het pijltje klap je de kaart in.',
  'help.guide.read-day-plan.step.2':
    'Een stop toont de afbeelding, het categoriepictogram en de naam, daarna de tijd zodra er een ‘Start’ is ingesteld, en de beschrijving. ‘Notities voor deze dag’ staan eronder. Ga je met de muis over de rij, dan verschijnen de knoppen: met de greep links sleep je de stop, de afbeelding wordt een slotje voor routeoptimalisatie, en helemaal rechts staan de pijlen (‘Omhoog’, ‘Omlaag’), ‘Boeking toevoegen’ en de drie puntjes (‘Meer opties’).',
  'help.guide.read-day-plan.step.3':
    'Een boeking bij een stop staat erop als badge ‘Reservering’, groen als hij bevestigd is en oranje zolang hij in behandeling is, met de tijd en de vervoerder. Klik op de badge om de boeking te openen; de routeknop ernaast tekent de route. Vervoer heeft een eigen rij, gekleurd naar het type, met de tijd en ‘Vertrek’ of ‘Aankomst’. Klik op een boeking om de details te openen; daar wijzig je hem met ‘Bewerken’.',
  'help.guide.read-day-plan.step.4':
    'Staat ‘Route’ aan, dan zie je bij de verbinding tussen twee stops hoe lang het traject duurt en hoe ver het is, met het vervoermiddel van de dag; klik erop om het vervoermiddel voor alleen dat traject te wijzigen.',
  'help.guide.read-day-plan.step.5':
    'De routebalk onder de stops van de geopende dag: ‘Route’ tekent de weg van de dag op de kaart, met de drie pictogrammen kies je Auto, Te voet of Fietsen, daarna zet ‘Optimaliseren’ de stops in een nieuwe volgorde, en ‘Openen in Google Maps’ en ‘Openen in CoMaps’ openen de dag daar.',
  'help.guide.read-day-plan.result':
    'Elk symbool op de kaart betekent iets; in de handleidingen hieronder lees je hoe je ze allemaal wijzigt.',
  'help.guide.read-day-plan.tip.1':
    'Klik met de rechtermuisknop op een stop, of op de drie puntjes, voor het menu: Bewerken, ‘Verwijderen van dag’, ‘Uit de route halen’, ‘Website openen’, ‘In collectie opslaan’, Verwijderen. De navigatie-apps vind je in de details van de plaats, onder Navigatie.',
  'help.guide.read-day-plan.tip.2':
    "Ga met de muis over een stop, dan verschijnt aan het eind van de rij 'Boeking toevoegen'. Een reservering die je daar maakt, wordt gekoppeld aan deze stop op deze dag.",
  // place-onto-day
  'help.guide.place-onto-day.title': 'Een plaats op een dag zetten',
  'help.guide.place-onto-day.goal':
    'Maak van een plek uit de lijst een stop op een dag, op de juiste plek in de volgorde.',
  'help.guide.place-onto-day.step.1':
    'Sleep een rij uit de plaatsenkolom naar de dagkaart. Zet hem tussen twee stops neer om hem precies daar te plaatsen, of op de kop van de dag om hem achteraan toe te voegen.',
  'help.guide.place-onto-day.step.2':
    'Zonder slepen: open de dag door op de kop te klikken en klik dan op de ronde + aan het eind van de rij van de plaats (+ Dag), of klik met de rechtermuisknop op de rij en kies ‘+ Dag’.',
  'help.guide.place-onto-day.step.3':
    '‘Plaats toevoegen aan deze dag’, in het +-menu van de dag of op een lege dag, opent het formulier voor een plek, en de nieuwe plek wordt meteen aan de dag toegevoegd.',
  'help.guide.place-onto-day.step.4':
    'Is er een dag open, dan zet je een plaats met ‘Toevoegen aan dag’ in de details op die dag. Met ‘Naar dag’ bovenaan de plaatsenkolom maak je meteen een nieuwe plaats op de geopende dag aan.',
  'help.guide.place-onto-day.result':
    'De plek is nu een stop op die dag. Hij staat op de kaart met het nummer van de dag, en de plekkenkolom telt hem mee onder Gepland.',
  'help.guide.place-onto-day.tip.1':
    'Een plek kan op meerdere dagen staan: zet hem vanuit de plekkenkolom op de tweede dag. Sleep je een stop van de ene dagkaart naar de andere, dan verplaats je hem.',
  'help.guide.place-onto-day.tip.2': 'De terugpijl in de kop maakt de toewijzing ongedaan.',
  'help.guide.place-onto-day.tip.3':
    'Je kunt een stop niet neerzetten tussen twee items met vaste tijden, of vóór een boeking die al een tijd heeft; de planning blijft op tijdsvolgorde.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'De volgorde van een dag wijzigen',
  'help.guide.reorder-stops.goal': 'Zet een stop hoger of lager, of verplaats hem naar een andere dag.',
  'help.guide.reorder-stops.step.1':
    'Ga met de muis over de stop en sleep hem aan de greep naar de nieuwe plek in de kaart.',
  'help.guide.reorder-stops.step.2':
    'Of gebruik de pijlen helemaal rechts bij de stop waar je met de muis op staat (‘Omhoog’, ‘Omlaag’): één stap per klik.',
  'help.guide.reorder-stops.step.3':
    'Sleep de stop naar een andere dagkaart om hem daarheen te verplaatsen. Op de oude dag verdwijnt hij dan.',
  'help.guide.reorder-stops.step.4':
    'Heeft een stop een vaste tijd en zou een verplaatsing de volgorde van de dag verstoren, dan vraagt TREK ‘Tijd verwijderen?’, omdat de tijd de plek van de stop bepaalt. ‘Bevestigen’ verwijdert de tijd, zodat de stop overal kan staan. ‘Annuleren’ laat de dag zoals hij was.',
  'help.guide.reorder-stops.result': 'De route en de reistijden passen zich meteen aan de nieuwe volgorde aan.',
  'help.guide.reorder-stops.tip.1':
    'Een boeking met een vaste tijd blijft op de plek die bij die tijd hoort. Zet je hem ergens anders in dezelfde dag neer, dan springt hij terug. Sleep je hem naar een andere dagkaart, dan verhuist hij naar die dag.',
  'help.guide.reorder-stops.tip.2':
    'Heeft de dag drie of meer stops, dan zet ‘Optimaliseren’ in de routebalk de hele dag op volgorde van de kortste route. Vergrendel eerst een stop als die moet blijven waar hij staat.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Een stop een tijd geven',
  'help.guide.set-stop-times.goal': 'Stel in wanneer een stop begint en eindigt, zodat de dag een tijdschema wordt.',
  'help.guide.set-stop-times.step.1':
    'Klik met rechts op de stop, of op de drie puntjes ervan, en kies Bewerken. Open je het formulier vanuit de dag, dan staan direct onder de locatie een begin- en eindtijd voor die dag.',
  'help.guide.set-stop-times.step.2':
    "Vul een begintijd in en eventueel Einde. 'Tijdoverlap met:' waarschuwt als een andere stop met een tijd op die dag overlapt. Ligt Einde vóór de begintijd, dan kun je niet op Bijwerken klikken.",
  'help.guide.set-stop-times.step.3':
    'Klik op Bijwerken. De stop krijgt een tijdbadge en schuift op basis van zijn tijd naar de juiste plek in de dag.',
  'help.guide.set-stop-times.result':
    'Stops met een tijd houden hun plek in de volgorde. Stops zonder tijd worden eromheen gesorteerd.',
  'help.guide.set-stop-times.tip.1':
    'De tijd hoort bij de stop op die dag. Dezelfde plek kan op een andere dag een andere tijd hebben.',
  'help.guide.set-stop-times.tip.2':
    'Wil je een stop met een tijd zelf verplaatsen, sleep hem dan. TREK vraagt ‘Tijd verwijderen?’, en als je op Bevestigen klikt, wordt de tijd verwijderd.',
  'help.guide.set-stop-times.tip.3':
    '‘Notities voor deze dag’ in hetzelfde formulier is voor informatie die alleen op deze dag geldt, bijvoorbeeld een tafelreservering of een ticketnummer.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Een stop van een dag verwijderen',
  'help.guide.remove-from-day.goal': 'Haal een plaats van een dag af zonder hem uit de reis te verwijderen.',
  'help.guide.remove-from-day.step.1':
    'Klik met de rechtermuisknop op de stop, of op de drie puntjes, en kies ‘Verwijderen van dag’.',
  'help.guide.remove-from-day.step.2':
    'De stop wordt van de dag gehaald. De plaats blijft in de plaatsenkolom staan, onder Ongepland als hij op geen andere dag staat.',
  'help.guide.remove-from-day.result':
    'De dag, de route en de kosten worden bijgewerkt. Met de pijl voor ongedaan maken zet je de stop terug.',
  'help.guide.remove-from-day.tip.1':
    'Met Verwijderen in hetzelfde menu haal je de plek uit de hele reis, dus ook van alle dagen.',
  'help.guide.remove-from-day.tip.2':
    '‘Verwijderen van dag’ staat ook in het detailpaneel van de plek, naast ‘Toevoegen aan dag’.',
  // lock-stop
  'help.guide.lock-stop.title': 'Een stop vastzetten',
  'help.guide.lock-stop.goal': 'Houd een stop op zijn plek als de route wordt geoptimaliseerd.',
  'help.guide.lock-stop.step.1':
    "Ga met de muis over de afbeelding van de stop en klik op het slotje: 'Positie behouden tijdens route-optimalisatie'.",
  'help.guide.lock-stop.step.2':
    "Optimaliseren sorteert nu de andere stops om deze stop heen. Klik nog eens op het slotje ('Klik om te ontgrendelen') om hem te ontgrendelen.",
  'help.guide.lock-stop.result':
    'Het slotje staat op de afbeelding. De stop blijft op zijn plek tot je hem weer ontgrendelt.',
  'help.guide.lock-stop.tip.1':
    'Een stop met een vaste tijd ligt door die tijd vast en wordt bij het optimaliseren nooit verplaatst.',
  'help.guide.lock-stop.tip.2':
    'Het slot blijft alleen staan tot je de pagina opnieuw laadt. Daarna is elke stop weer ontgrendeld. Alleen stops met een tijd blijven vastliggen.',
  // day-note
  'help.guide.day-note.title': 'Een notitie aan een dag toevoegen',
  'help.guide.day-note.goal': 'Bewaar een herinnering, een ticketnummer of een plan B bij de dag.',
  'help.guide.day-note.step.1': 'Klik op de + in de kop van de dag (‘Toevoegen aan dag’) en kies ‘Notitie toevoegen’.',
  'help.guide.day-note.step.2':
    'Typ bovenaan het venster de naam van de notitie, waar Notitie staat. Die naam zie je op de dagkaart. Schrijf de rest onder Dagnotitie: met de werkbalk erboven maak je de tekst op (vet, lijsten, links, citaten), en Voorbeeld links laat zien hoe de rij eruit komt te zien.',
  'help.guide.day-note.step.3':
    'Kies een Pictogram en een Kleur, zodat de notitie goed te onderscheiden is van de stops, en klik op Toevoegen.',
  'help.guide.day-note.step.4':
    'De notitie staat in de dag net als een stop: sleep hem naar de juiste plek of gebruik de pijlen. Klik erop om hem te bewerken. ‘Verwijderen’ vind je in het venster en in het menu onder de drie puntjes of de rechtermuisknop, en vraagt eerst ‘Notitie verwijderen?’.',
  'help.guide.day-note.result':
    'De notitie hoort bij de dag en staat ook in de PDF, op de plek waar je hem naartoe hebt gesleept.',
  'help.guide.day-note.tip.1':
    'Links in een notitie openen in een nieuw tabblad, en een enkele regelovergang blijft een regelovergang.',
  'help.guide.day-note.tip.2': 'Notities gelden per dag. Een notitie voor de hele reis zet je in Samenwerking.',
  // day-route
  'help.guide.day-route.title': 'De route van de dag tonen en optimaliseren',
  'help.guide.day-route.goal': 'Bekijk de route tussen de stops, kies hoe je reist en laat TREK de volgorde bepalen.',
  'help.guide.day-route.step.1':
    'Open de dag en klik op ‘Route’ in de routebalk onder de stops: de route tussen de stops verschijnt op de kaart, en de verbindingen tussen de stops tonen de tijd en afstand van elk traject.',
  'help.guide.day-route.step.2':
    'Met de drie pictogrammen ernaast kies je hoe je die dag reist: Auto, Te voet of Fietsen. De trajecten worden opnieuw berekend. Plugins kunnen eigen vervoerswijzen toevoegen.',
  'help.guide.day-route.step.3':
    'Klik op een verbindingslijn om de vervoerswijze van alleen dat traject te wijzigen: kies een vervoerswijze, ‘Openbaar vervoer’ om er een verbinding voor te zoeken als dat beschikbaar is, of ‘Dagstandaard gebruiken’ om weer de vervoerswijze van de dag te gebruiken.',
  'help.guide.day-route.step.4':
    '‘Optimaliseren’ (de ronde pijl) zet de stops op volgorde van de kortste route, vanaf drie stops. Stops met een slotje of een vaste tijd blijven op hun plek. Staat er een accommodatie op de dag, dan begint de route daar.',
  'help.guide.day-route.step.5':
    '‘Openen in Google Maps’ of ‘Openen in CoMaps’ opent de hele dag als route in die app, om onderweg te navigeren. CoMaps gebruikt ook de vervoerswijze van de dag.',
  'help.guide.day-route.result':
    'De dag is een route met tijden. ‘Totale kosten’ en de trajecten worden bijgewerkt als de volgorde verandert.',
  'help.guide.day-route.tip.1':
    'Routes komen standaard van OSRM; de beheerder kan onder Standaardinstellingen een andere routeplanner voor TREK instellen.',
  'help.guide.day-route.tip.2':
    'Een deel van de route dat niet kon worden berekend, toont geen tijd. Controleer of beide stops coördinaten hebben.',
  'help.guide.day-route.tip.3': 'Met de pijl voor ongedaan maken draai je een optimalisatie terug.',
  // manage-days
  'help.guide.manage-days.title': 'Dagen toevoegen, verplaatsen en hernoemen',
  'help.guide.manage-days.goal': 'Pas de dagen zelf aan, niet alleen de plekken die erop staan.',
  'help.guide.manage-days.step.1':
    'De dagen volgen uit de data van de reis. Wijzig de data in het bewerkformulier van de reis op het Dashboard, dan worden er aan het begin of eind dagen toegevoegd of verwijderd. Voordat een dag met inhoud wordt verwijderd, zie je een lijst met de dagen die verdwijnen en wat erop staat.',
  'help.guide.manage-days.step.2':
    '‘Dagen herordenen’ in de kop opent een lijst: sleep een dag aan de greep, of gebruik ‘Omhoog’ en ‘Omlaag’, en de dag verhuist met zijn plaatsen, notities en boekingen mee. Onder de lijst voegt ‘Toevoegen met de volgende datum’ een dag toe na de laatste dag met datum en verlengt de reis met één dag; ‘Zonder datum’ voegt aan het eind een dag zonder datum toe. Een reis zonder data heeft alleen ‘Dag toevoegen’.',
  'help.guide.manage-days.step.3':
    '‘Dag verwijderen’, de prullenbak aan het eind van een rij, vraagt eerst om bevestiging. Je ziet wat er met de dag wordt verwijderd: de plaatsen, notities en boekingen, een verblijf dat op die dag in- of uitcheckt, en welke dagen een datum naar voren schuiven. ‘Dag verwijderen’ verwijdert de dag, ‘Annuleren’ houdt hem; de laatste dag kun je niet verwijderen.',
  'help.guide.manage-days.step.4':
    'Wil je een dag een andere naam geven, open hem dan en klik op het potlood naast de titel in het detailpaneel boven de kaart. De naam vervangt ‘Dag 1’ op de kaart van de dag en in de PDF.',
  'help.guide.manage-days.step.5':
    'Met ‘Alle dagen uitklappen’ en ‘Alle dagen inklappen’ bovenaan klap je alle kaarten tegelijk uit of in. Wil je één kaart inklappen, klik dan op het pijltje ervan.',
  'help.guide.manage-days.result':
    'De data horen bij de positie: verplaats je een dag naar boven, dan krijgt die de eerdere datum, en de stops, notities en boekingen gaan mee.',
  'help.guide.manage-days.tip.1':
    'Het verplaatsen van dagen kun je terugdraaien met de pijl Ongedaan maken, het verwijderen van een dag niet.',
  'help.guide.manage-days.tip.2':
    'Totale kosten onderaan de planning telt de kosten van de hele reis op. Op het tabblad Onkosten zie je de uitsplitsing.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Boekingen en vervoer in de planning lezen',
  'help.guide.bookings-in-plan.goal':
    'Zie waar een boeking verschijnt zodra je hem hebt gemaakt, en in welk scherm je hem aanmaakt.',
  'help.guide.bookings-in-plan.step.1':
    'Vervoer (vlucht, trein, veerboot, bus, auto) is een rij met een kleur per soort, met de tijd en Vertrek op de dag van vertrek of Aankomst op de dag van aankomst. De wereldbol ernaast toont de tijdzone, en een vlucht met tussenstop krijgt een rij per traject. Klik bij een OV-verbinding op het pijltje om de lijnen te zien. Klik op een rij om de boeking te openen. Met ‘Bewerken’ daar wijzig je hem.',
  'help.guide.bookings-in-plan.step.2':
    'Een reservering die aan een stop is gekoppeld (een restaurant, een rondleiding), staat als badge Reservering bij die stop, met de tijd. De badge is groen als de reservering is bevestigd en oranje zolang hij in behandeling is. Een boeking met een dag maar zonder stop heeft een eigen rij in de dag.',
  'help.guide.bookings-in-plan.step.3':
    'Een overnachting in een hotel is een accommodatie: de pil in de dagkop is groen bij het inchecken en rood bij het uitchecken, en het ticketpictogram opent de boeking. Het detailpaneel van de dag toont hem onder ‘Accommodatie’, en de route van elk van die dagen begint daar.',
  'help.guide.bookings-in-plan.step.4':
    'Op de kaart tekent de routeknop op een boekingsrij de route; ‘Alle boekingsroutes tonen’ in de kop tekent ze allemaal.',
  'help.guide.bookings-in-plan.step.5':
    'Aanmaken: ‘Boeking toevoegen’ bij een stop waar je met de muis op staat, ‘Vervoer toevoegen’ en ‘Openbaar vervoer’ in het +-menu van de dag, en de tabbladen Boekingen en Transport voor de volledige lijst met importeren en bestanden.',
  'help.guide.bookings-in-plan.result':
    'Elke boeking staat één keer in de planning. De tabbladen tonen dezelfde boekingen als lijst.',
  'help.guide.bookings-in-plan.tip.1':
    'Bevestigd of in behandeling is een status die je op de boeking instelt; de planning toont die op de stop, het tabblad Boekingen telt beide.',
  'help.guide.bookings-in-plan.tip.2':
    'Zet je een boeking met een tijd ergens anders in dezelfde dag neer, dan springt hij terug naar de plek die bij zijn tijd hoort. Sleep je hem naar een andere dagkaart, dan verhuist hij naar die dag. Wil je de tijd wijzigen, bewerk dan de boeking.',
  // export-plan
  'help.guide.export-plan.title': 'De planning exporteren',
  'help.guide.export-plan.goal': 'Exporteer de planning als document, naar je agenda of naar een gps-apparaat.',
  'help.guide.export-plan.step.1': 'Klik links in de balk boven de dagen op ‘Exporteren’.',
  'help.guide.export-plan.step.2':
    'Document: ‘PDF’ opent de afdrukweergave van alle dagen met hun stops, notities en boekingen, te beginnen met een overzichtskaart van de route. ‘Mijn plan als PDF’ bevat alleen waar jij aan meedoet. In de weergave laat ‘Pagina-einde per dag’ elke dag op een nieuwe pagina beginnen, voegt ‘Notities bij vervoer’ de notities bij je vervoer toe, en download je het bestand met ‘Opslaan als PDF’.',
  'help.guide.export-plan.step.3':
    'Agenda: met ‘.ics downloaden’ sla je de boekingen op als agendabestand. ‘Abonneren op kalender’ geeft je een link die je agenda-app automatisch ververst.',
  'help.guide.export-plan.step.4':
    'Kaarten en gps (GPX): ‘Hele reis’ exporteert plaatsen, dagroutes en tracks, ‘Alleen plekken’ alleen de markeringen, en ‘Dagen als routes’ een route per dag, voor offlinekaarten en gps-apparaten.',
  'help.guide.export-plan.result': 'Het bestand wordt gedownload; aan de reis verandert niets.',
  'help.guide.export-plan.tip.1':
    "Wil je één dag in een kaartapp openen? Gebruik dan de routebalk van die dag: 'Openen in Google Maps' of 'Openen in CoMaps'.",
  'help.guide.export-plan.tip.2':
    'Voor ‘Abonneren op kalender’ moeten kalenderfeeds in je instellingen aanstaan en moet je de reis mogen delen; bij Dashboard staat daar een handleiding voor.',
  'help.guide.export-plan.tip.3':
    'Voor exporteren is leestoegang genoeg: elk lid van de reis kan de PDF, de .ics en de GPX exporteren.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Plaatsdetails',
  'help.ctx.trip-place.summary':
    'De kaart die over de kaart opent als je een plaats kiest: alles wat de reis erover weet, de sterren die iedereen heeft gegeven, de afbeelding en de bestanden, en knoppen om de plaats aan de geopende dag toe te voegen, in een kaartapp te openen of in een lijst op te slaan.',
  'help.ctx.trip-place.bullet.1':
    'Klik op een rij in de plaatsenkolom, op een stop in een dag of op een markering op de kaart, en de kaart met details opent boven de kaart. Open je hem vanuit een dag, dan weet de kaart welke stop je bedoelt en toont hij ook de deelnemers en de boeking van die stop. Een tocht (een wandeling, fietstocht of stadswandeling van het tabblad Tochten) opent in een eigen tochtkaart.',
  'help.ctx.trip-place.bullet.2':
    'Bovenaan staan de ronde afbeelding, de naam, het adres op één regel en labels met wat er bekend is: open of gesloten, de categorie, de tijd, de prijs, het telefoonnummer, het e-mailadres en de coördinaten. Klik op de afbeelding om een eigen foto te gebruiken of een foto uit de bestanden van de plaats. Dubbelklik op de naam om de plaats te hernoemen. Met de X rechts sluit je de kaart. De afbeelding, het hernoemen, Bewerken en Verwijderen zijn alleen beschikbaar voor reizigers die plaatsen mogen wijzigen.',
  'help.ctx.trip-place.bullet.3':
    "Daaronder: de sterren die elke reiziger de plaats heeft gegeven, de beschrijving en de notities, en 'Notities voor deze dag' als de stop die heeft.",
  'help.ctx.trip-place.bullet.4':
    'Daarna volgen, waar van toepassing, Openingstijden, Routekleur, Routegegevens en Bestanden. Met ‘Uploaden’ in de kop Bestanden voeg je bestanden van je computer toe. De lijst toont ook de bestanden die aan deze stop zijn gekoppeld en die van de bijbehorende boeking, zoals de bevestiging van een hotel. Plugins kunnen eronder eigen rijen toevoegen.',
  'help.ctx.trip-place.bullet.5':
    'De rij onderaan: ‘Toevoegen aan dag’ of ‘Verwijderen van dag’ als er een dag open is, daarna Navigatie (of de naam van je kaart-app, zodra je die in Instellingen hebt gekozen), ‘Website openen’ en ‘In collectie opslaan’. Rechts verwijder je de plaats met de rode prullenbak en open je met ‘Bewerken’ het formulier.',
  'help.ctx.trip-place.bullet.6':
    'Bij een plaats die je uit de zoekresultaten hebt gekozen, zie je wat de TREK-index of OpenStreetMap erover weten: ‘Open’ of ‘Gesloten’ tussen de pillen bovenaan, met een groene of rode ring om de afbeelding, op basis van de lokale tijd van de plaats; het telefoonnummer, ook als pil; verderop ‘Openingstijden’, met de tijden van vandaag in de rij en na een klik de hele week; en de website onder ‘Website openen’. De Google-beoordeling verschijnt alleen bij een plaats die via Google is gevonden, op een TREK met een Google-sleutel. Openingstijden, een telefoonnummer en een e-mailadres die je zelf in het formulier van de plaats hebt ingevuld, vervangen de opgezochte gegevens en bepalen ook de kleur van de ring.',
  // read-place
  'help.guide.read-place.title': 'Wat de kaart je over een plek vertelt',
  'help.guide.read-place.goal': 'Lees op één kaart alles wat de reis over een plek weet.',
  'help.guide.read-place.step.1':
    'Klik in de dagenkolom op de stop die je wilt bekijken. De kaart van de plek opent boven de landkaart, en de stop blijft gemarkeerd in de dag.',
  'help.guide.read-place.step.2':
    'Bovenaan: de ronde afbeelding, de naam en het adres op één regel; de tooltip toont het volledige adres. De pillen eronder geven aan of de plaats nu ‘Open’ of ‘Gesloten’ is, volgens de lokale tijd van de plaats, met een bijpassende groene of rode ring om de afbeelding. Ze tonen ook de categorie, de tijd, het telefoonnummer en het e-mailadres (klik erop om je telefoon- of mail-app te openen) en, op een breed scherm, de exacte coördinaten. Met de X rechts sluit je de kaart.',
  'help.guide.read-place.step.3':
    'Beoordeling is het eerste onderdeel onder de kop: de sterren die elke reiziger de plek heeft gegeven, met het gemiddelde en het aantal stemmen. Zolang niemand heeft gestemd, staat er ‘Nog niet beoordeeld’.',
  'help.guide.read-place.step.4':
    'Daarna de beschrijving en daaronder de notities. Allebei zijn ze de tekst uit het formulier van de plaats, met opmaak: lijsten, links en vetgedrukte tekst werken allemaal.',
  'help.guide.read-place.step.5':
    'Onder Deelnemers zie je wie er naar deze stop gaat. Iedereen doet mee, tot je iemand weghaalt.',
  'help.guide.read-place.step.6':
    'Openingstijden, verderop: de rij toont de openingstijden van de dag die je bekijkt. Klik erop om de hele week te zien, met die dag vetgedrukt. Bestanden staat ernaast.',
  'help.guide.read-place.result':
    'De kaart blijft open tot je hem met de X sluit of een andere plek kiest. De openingstijden voor de hele week blijven uitgeklapt, en de bijbehorende stop blijft gemarkeerd in de dagenkolom.',
  'help.guide.read-place.tip.1':
    'Kies je de plaats in de plaatsenkolom, dan toont de kaart de plaats, maar geen stop. Je ziet dan geen deelnemers en alleen de boekingen die bij de plaats zelf horen, zoals het verblijf in een hotel. Kies de stop in de dag om alles te zien.',
  'help.guide.read-place.tip.2':
    'Mag je plaatsen wijzigen, dan kun je dubbelklikken op de naam om de plaats te hernoemen zonder het formulier te openen. Met Enter sla je op, met Escape annuleer je.',
  'help.guide.read-place.tip.3':
    'Een plaats die je zelf hebt ingetypt, heeft alleen de gegevens uit het formulier. Klik op ‘Bewerken’ en vul Telefoon, E-mail en de openingstijden zelf in, of kies de plaats uit de suggesties onder ‘Plekken zoeken…’ en klik op ‘Bijwerken’ om ze op te laten zoeken. Voor de beoordeling van Google is een Google-sleutel nodig.',
  // rate-place
  'help.guide.rate-place.title': 'Een plek beoordelen',
  'help.guide.rate-place.goal': 'Geef een plek je eigen sterren en bekijk de beoordelingen van de anderen.',
  'help.guide.rate-place.step.1':
    'Open de plek. De rij sterren staat direct onder de kop en toont het gemiddelde van de stemmen tot nu toe, met het aantal stemmen tussen haakjes.',
  'help.guide.rate-place.step.2':
    'Klik op de ster die je wilt geven. De sterren kleuren mee terwijl je eroverheen beweegt, zodat je ziet welke beoordeling je geeft.',
  'help.guide.rate-place.step.3':
    'Je stem telt meteen mee in het gemiddelde, en aan de gezichtjes ernaast zie je wie er heeft gestemd. Ga met de muis over de rij om ieders sterren te zien.',
  'help.guide.rate-place.step.4':
    'Hetzelfde gemiddelde staat in de rij van de plaats in de plaatsenkolom, zodat je de beste plaatsen in de lijst makkelijk vindt.',
  'help.guide.rate-place.result':
    'Iedereen in de reis ziet jouw sterren bij de plek. Met de ster in de filterrij boven de lijst kun je nu alleen de plekken tonen met een bepaalde minimale beoordeling.',
  'help.guide.rate-place.tip.1':
    'Elke reiziger mag een beoordeling geven, ook in een reis waarin maar een paar mensen plekken mogen wijzigen.',
  'help.guide.rate-place.tip.2':
    'Klik op de ster die je al hebt gegeven om je beoordeling te verwijderen. Heeft niemand de plek beoordeeld, dan staat er weer ‘Nog niet beoordeeld’.',
  'help.guide.rate-place.tip.3':
    'Maximaal zes stemmers worden als gezichtjes naast de sterren getoond. De tooltip noemt ze allemaal en markeert jou.',
  // place-image
  'help.guide.place-image.title': 'Een eigen afbeelding bij een plaats zetten',
  'help.guide.place-image.goal': 'Vervang de automatische miniatuur door een eigen foto.',
  'help.guide.place-image.step.1': 'Open de plaats vanuit de plaatsenkolom.',
  'help.guide.place-image.step.2':
    "Wijs de ronde afbeelding bovenaan aan: er verschijnt een camera met de knopinfo ‘Afbeelding uploaden’. Klik erop en kies je bestand. Staan er al foto's bij de bestanden van de plaats, dan vraagt TREK eerst wat je wilt: ‘Uploaden vanaf apparaat’ of een van de afbeeldingen onder ‘Uit bijgevoegde bestanden’.",
  'help.guide.place-image.step.3': 'Boven aan de kaart staat nu jouw afbeelding, met in de hoek een kleine rode X.',
  'help.guide.place-image.step.4':
    'Dezelfde afbeelding verschijnt ook op de rij van de plek in de plekkenkolom en op de markering op de kaart.',
  'help.guide.place-image.result':
    'Je afbeelding wordt overal voor de plek gebruikt: op de kaart van de plek, in de plekkenkolom, bij de stop op de dag, op de markering op de kaart en in een gedeelde reis.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF en WebP worden geaccepteerd, en een HEIC van een iPhone wordt bij het uploaden omgezet.',
  'help.guide.place-image.tip.2':
    'Met het kruisje in de hoek verwijder je jouw afbeelding en verschijnt de automatische afbeelding weer. Aan de plaats zelf verandert niets.',
  'help.guide.place-image.tip.3':
    'Heb je geen afbeelding toegevoegd, dan zoekt TREK er een op basis van de coördinaten van de plaats. Vindt TREK niets, dan zie je het pictogram van de categorie. Alleen reizigers die plaatsen mogen wijzigen, kunnen een afbeelding instellen.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'De plaats aan de geopende dag toevoegen, of eraf halen',
  'help.guide.place-day-assign.goal': 'Gebruik de knop op de kaart in plaats van de rij door de planner te slepen.',
  'help.guide.place-day-assign.step.1':
    'Klik in de dagenkolom op de kop van een dag. Dat is nu de geopende dag, en de kaart geldt voor die dag.',
  'help.guide.place-day-assign.step.2':
    'Klik in de plekkenkolom op een plek die niet op die dag staat. De kaart van de plek opent, en in de onderste rij staat ‘Toevoegen aan dag’.',
  'help.guide.place-day-assign.step.3':
    'Klik op ‘Toevoegen aan dag’. De stop wordt aan het eind van de dag toegevoegd en de knop verandert in ‘Verwijderen van dag’.',
  'help.guide.place-day-assign.step.4':
    'De stop staat nu op de dag, onderaan de lijst. Sleep hem omhoog naar de juiste plek.',
  'help.guide.place-day-assign.step.5':
    "Met 'Verwijderen van dag' haal je de stop weer van de dag, en op de kaart staat dan weer 'Toevoegen aan dag'.",
  'help.guide.place-day-assign.result':
    'De stop wordt aan de dag toegevoegd of eraf gehaald. Aan de plaats zelf verandert niets.',
  'help.guide.place-day-assign.tip.1':
    'De knop is er alleen als er een dag geopend is. Zonder geopende dag is er geen dag om de plaats aan toe te voegen.',
  'help.guide.place-day-assign.tip.2':
    'Haal je een stop van een dag af, dan blijft de plek in de reis en in de plekkenkolom staan. Met Verwijderen haal je hem overal weg.',
  'help.guide.place-day-assign.tip.3':
    'Bij een stop die door een accommodatieboeking aan de dag is toegevoegd, zie je geen van beide knoppen. Die nacht voeg je toe en verwijder je in het overnachtingsblok van de dag.',
  // place-participants
  'help.guide.place-participants.title': 'Aangeven wie er naar deze stop gaat',
  'help.guide.place-participants.goal': 'Kies wie er naar één stop gaat, zonder te wijzigen wie er meereist.',
  'help.guide.place-participants.step.1':
    'Klik op de stop in de dag. De kaart gaat open en onder Deelnemers staat iedereen die aan de reis deelneemt.',
  'help.guide.place-participants.step.2':
    'Klik op een reiziger om hem of haar van deze stop te halen. Ga je met de muis over de naam, dan wordt die doorgestreept.',
  'help.guide.place-participants.step.3':
    'Zodra er iemand ontbreekt, verschijnt er een gestippelde +. Klik erop om te zien wie er niet bij de stop staat.',
  'help.guide.place-participants.step.4':
    'Klik op een naam om die persoon weer toe te voegen. Is iedereen weer toegevoegd, dan hoort de stop weer bij de hele groep.',
  'help.guide.place-participants.result':
    'De stop toont alleen de reizigers die je hebt gekozen. De rest van de groep is op dat moment vrij.',
  'help.guide.place-participants.tip.1':
    'Deelnemers verschijnt alleen als er een stop is geselecteerd. Kies de plek dus in de dag, niet in de plekkenkolom. Het verschijnt ook alleen in een reis met meer dan één reiziger.',
  'help.guide.place-participants.tip.2':
    'Is er niemand gekozen, dan gaat iedereen mee. Daarom kun je de laatste reiziger niet van een stop verwijderen.',
  'help.guide.place-participants.tip.3': 'Ook een gast, die geen eigen account heeft, kan gewoon deelnemer zijn.',
  // place-booking
  'help.guide.place-booking.title': 'De boeking bij een stop',
  'help.guide.place-booking.goal': 'Bekijk de boeking die bij een stop hoort, open hem, en koppel er een nieuwe aan.',
  'help.guide.place-booking.step.1':
    'Open de stop waar de boeking bij hoort. Op de kaart staat de boeking onder Boekingen als apart kaartje, met de naam van de boeking en Bevestigd of ‘In behandeling’.',
  'help.guide.place-booking.step.2':
    'De boekingskaart toont de Datum, de Tijd en de Boekingscode, labels met andere gegevens van de boeking (een vluchtnummer, een perron, inchecken) en eventuele notities bij de boeking.',
  'help.guide.place-booking.step.3': 'Klik op het kaartje van de boeking. De boeking opent boven de kaart.',
  'help.guide.place-booking.step.4':
    'Met Bewerken onder aan de boeking open je het formulier van de boeking. Met ‘Koppelen aan dagtoewijzing’ koppel je daar een boeking aan een stop, en deze stop staat er al. Sluit het formulier weer.',
  'help.guide.place-booking.step.5':
    'Een nieuwe boeking voor een stop begin je in de dagenkolom: beweeg de muis over de stop en klik op ‘Boeking toevoegen’, het ticketpictogram aan het eind. Het formulier opent als ‘Nieuwe reservering’, al gekoppeld aan de stop.',
  'help.guide.place-booking.result':
    'De boeking is gekoppeld aan de stop: je ziet hem op de kaart en in de dag, en de bestanden ervan staan hier ook onder Bestanden.',
  'help.guide.place-booking.tip.1':
    'Een boeking staat bij de stop waaraan hij is gekoppeld, en een hotelboeking zie je ook bij het hotel, waar je dat ook opent. Een boeking zonder stop staat op het tabblad Boekingen.',
  'help.guide.place-booking.tip.2':
    'Meerdere boekingen kunnen bij één stop horen, bijvoorbeeld een lunch en een rondleiding die op dezelfde plek beginnen.',
  'help.guide.place-booking.tip.3':
    'Bij een trein, vlucht of veerboot opent ‘Bewerken’ in plaats daarvan het vervoersformulier, hetzelfde als op het tabblad Transport.',
  // place-files
  'help.guide.place-files.title': 'De tickets van een plaats bij de plaats bewaren',
  'help.guide.place-files.goal': 'Voeg het ticket, de voucher of de plattegrond toe aan de plek waar ze bij horen.',
  'help.guide.place-files.step.1':
    'Open de plaats. ‘Bestanden’ staat onder de details, naast ‘Openingstijden’ als de plaats die heeft, en toont ‘Bestanden’ zolang de plaats er nog geen heeft.',
  'help.guide.place-files.step.2': 'Klik rechts van de kop ‘Bestanden’ op ‘Uploaden’ en kies het bestand.',
  'help.guide.place-files.step.3': 'Op de knop zie je hoeveel bestanden de plek heeft, en de lijst gaat vanzelf open.',
  'help.guide.place-files.step.4':
    'Elke rij toont de naam en de grootte van het bestand. Klik erop om het bestand te openen.',
  'help.guide.place-files.result':
    'Het bestand is aan de plek gekoppeld en telt mee op de kaart. Het staat ook op het tabblad Bestanden van de reis.',
  'help.guide.place-files.tip.1':
    '‘Bestanden’ toont ook wat aan deze stop is vastgemaakt en wat aan de boeking ervan hangt, zodat een hotelbevestiging bij het hotel verschijnt.',
  'help.guide.place-files.tip.2':
    '‘Uploaden’ accepteert meerdere bestanden tegelijk, en een foto daartussen kan de afbeelding van de plaats worden.',
  'help.guide.place-files.tip.3':
    'Mag je geen bestanden uploaden, dan zie je de knop Uploaden niet; bestanden die al bij de plaats staan, blijven zichtbaar.',
  // place-navigation
  'help.guide.place-navigation.title': 'Een plaats openen in een kaartapp of op de website',
  'help.guide.place-navigation.goal': 'Open de plaats in de navigatie-app waarmee je erheen gaat.',
  'help.guide.place-navigation.step.1': 'Open de plek en klik in de onderste rij op Navigatie.',
  'help.guide.place-navigation.step.2':
    'In de lijst staan de kaart-apps die bij deze plaats passen: Google Maps, Waze, Apple Maps, OpenStreetMap en CoMaps, en op Android ook ‘Andere kaart-app’.',
  'help.guide.place-navigation.step.3':
    'Klik op de app die je gebruikt. Waar mogelijk stuurt TREK de plek zelf naar de app en niet alleen de coördinaten, zodat je bij de juiste ingang uitkomt.',
  'help.guide.place-navigation.step.4':
    '‘Website openen’ ernaast opent de eigen website van de plek, met openingstijden en tickets, in een nieuw tabblad.',
  'help.guide.place-navigation.result':
    'De kaart-app opent op de plaats, de website opent in een nieuw tabblad, en er verandert niets aan de reis. Is TREK als app geïnstalleerd, dan opent de kaart-app in plaats van een nieuw tabblad.',
  'help.guide.place-navigation.tip.1':
    'Waze begint meteen te navigeren. De andere apps openen de plek, en je tikt nog één keer om de navigatie te starten.',
  'help.guide.place-navigation.tip.2':
    'Welke apps je ziet, hangt af van de plaats en je apparaat: Apple Maps zie je niet op Android, 高德地图 alleen bij een plaats in China, en voor Waze, Apple Maps en CoMaps zijn de coördinaten van de plaats nodig. ‘Andere kaart-app’ opent de plaats in een willekeurige kaart-app op je Android-telefoon.',
  'help.guide.place-navigation.tip.3':
    'Kies je kaart-app één keer in Instellingen, onder ‘Plekken openen in’. De knop toont dan de naam van die app en opent hem meteen. Dat gebeurt ook als er voor een plaats maar één app in aanmerking komt.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Een plaats in een van je lijsten opslaan',
  'help.guide.place-to-collection.goal': 'Bewaar een plaats die je op deze reis hebt gevonden voor je volgende reis.',
  'help.guide.place-to-collection.step.1':
    'Open de plaats en klik op ‘In collectie opslaan’ in de rij onderaan de kaart.',
  'help.guide.place-to-collection.step.2':
    '‘In lijst opslaan’ toont alle lijsten waarvan je eigenaar bent of die met je zijn gedeeld. Een gevulde bladwijzer rechts geeft aan in welke lijsten deze plaats al staat.',
  'help.guide.place-to-collection.step.3': 'Klik op de lijst. De plaats wordt er meteen aan toegevoegd.',
  'help.guide.place-to-collection.step.4': 'Sluit het venster met de X; op de knop in de kaart staat nu ‘Opgeslagen’.',
  'help.guide.place-to-collection.result':
    'De plek staat in je lijst, met de afbeelding, de notities en het adres, klaar voor je volgende reis.',
  'help.guide.place-to-collection.tip.1':
    'De knop is er alleen zolang de add-on Collecties aanstaat. Die zet de beheerder aan onder Add-ons.',
  'help.guide.place-to-collection.tip.2':
    'Een plek kan in meerdere lijsten tegelijk staan, met in elke lijst een andere status: in de ene een idee, in de andere bezocht.',
  'help.guide.place-to-collection.tip.3':
    '‘Markeer als bezocht’, onder de naam van de plaats bovenaan de kiezer, markeert de plaats in de lijst als bezocht. Staat de plaats in meerdere van je lijsten, dan staat er ‘Overal bezocht’ op de knop en wordt hij in al die lijsten tegelijk gemarkeerd. ‘Weergave’ opent je lijsten in Collecties.',
  // place-track
  'help.guide.place-track.title': 'Een track bekijken en een eigen kleur geven',
  'help.guide.place-track.goal':
    'Zie hoe lang een geïmporteerde wandeling is, en welke lijn op de kaart bij deze wandeling hoort.',
  'help.guide.place-track.step.1':
    'In de plaatsenkolom staat bij de rij van een track een kort streepje in de kleur van de track op de kaart. Klik erop.',
  'help.guide.place-track.step.2': 'Routegegevens toont de lengte van de route, in de eenheden die je hebt ingesteld.',
  'help.guide.place-track.step.3':
    'Daarboven zie je bij Routekleur welke kleur wordt gebruikt. Klik op de rij om de kleurstalen te openen.',
  'help.guide.place-track.step.4':
    'Kies een kleur. De lijn op de kaart en het streepje op de rij krijgen meteen die kleur.',
  'help.guide.place-track.step.5':
    'Met het gestippelde vakje links, ‘Automatische kleur’, krijgt de track weer zijn standaardkleur. Met de pipet rechts open je de kleurkiezer van je systeem voor elke andere kleur.',
  'help.guide.place-track.result':
    'De track wordt getekend in de kleur die je hebt gekozen: op de kaart van de plek, op de rij in de plekkenkolom en op de landkaart.',
  'help.guide.place-track.tip.1':
    'Alleen een plaats met een route heeft deze twee blokken: een plaats die uit een GPX-, KML- of KMZ-bestand is geïmporteerd voordat Tochten bestond, of op een TREK waar Tochten uit staat. Staat Tochten aan, dan wordt een nieuw GPX-bestand een tocht, met een eigen tochtkaart.',
  'help.guide.place-track.tip.2':
    'Is een track met hoogtegegevens opgenomen, dan zie je ook het hoogste en laagste punt, de stijgende en dalende meters en het hoogteprofiel van de wandeling.',
  'help.guide.place-track.tip.3':
    'Bij een import krijgt elke toegevoegde track een eigen kleur, zodat twee wandelingen nooit dezelfde kleur hebben.',
  // read-place
  'help.guide.read-place.step.7':
    'In de rij onderaan staat wat je hiervandaan kunt doen: de plaats op de geopende dag zetten of eraf halen, hem openen in een kaartapp of op zijn website, hem in een lijst opslaan, en rechts verwijderen (de rode prullenbak) of bewerken.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Bestanden',
  'help.ctx.trip-files.summary':
    'Alle documenten van de reis in één lijst: tickets, bevestigingen, passen en afbeeldingen. Elk document heeft een notitie, een koppeling naar de plaats of boeking waar het bij hoort, en een prullenbak waaruit je het kunt terugzetten.',
  'help.ctx.trip-files.bullet.1':
    'Het gestippelde vak onder de balk, ‘Sleep bestanden hierheen’, neemt bestanden aan die je erop neerzet. Klik erop om de bestandskiezer te openen. In het vak staan de bestandstypen die deze TREK accepteert en de maximale grootte per bestand (Max 50 MB, tenzij een beheerder iets anders heeft ingesteld).',
  'help.ctx.trip-files.bullet.2':
    "In de balk bovenaan staan Bestanden en de filtertabbladen Alle, PDF's, Afbeeldingen en Documenten, elk met het aantal. Zodra een bestand een ster heeft, verschijnt na Alle een stertabblad, en zodra een notitie een bijlage heeft, verschijnt aan het eind het tabblad Collab-notities.",
  'help.ctx.trip-files.bullet.3':
    'Een rij toont een miniatuur of het bestandstype, wie het bestand heeft geüpload, de naam, de notitie eronder, de grootte en de datum, en een label per koppeling: de plek, de boeking of het vervoer met de naam (beweeg de muis erover om Dagplan, Boeking of Transport te zien), en ‘Uit Collab-notities’.',
  'help.ctx.trip-files.bullet.4':
    'Aan het eind van een rij staan maximaal vijf pictogrammen, met een naam als je ze aanwijst: Ster, Toewijzen (het potlood), Openen, Downloaden en Verwijderen. Verwijderen vraagt niet om bevestiging: het bestand gaat naar de prullenbak, waar je het kunt terugzetten. Offline werken een notitie, een koppeling, een ster en de prullenbak gewoon, en worden ze verstuurd zodra TREK weer online is. Alleen uploaden en het verwijderen van een extra koppeling vereisen een internetverbinding.',
  'help.ctx.trip-files.bullet.5':
    'Een afbeelding of video opent schermvullend, met de pijltjestoetsen en een rij miniaturen. Elk ander document opent in een venster met bovenaan de naam en daaronder ‘Openen in nieuw tabblad’ en Downloaden. Een wallet-pas wordt meteen gedownload.',
  'help.ctx.trip-files.bullet.6':
    'Met het prullenbakpictogram rechts in de balk (Prullenbak) toon je de verwijderde bestanden. Daar kun je elk bestand terugzetten of definitief verwijderen, en met ‘Prullenbak legen’ in de balk verwijder je ze allemaal. Documentsynchronisatie staat links van het prullenbakpictogram als de reis aan een documentopslag is gekoppeld, of voor de eigenaar van de reis of een beheerder zodra er een opslagdienst is aangezet.',
  // files-upload
  'help.guide.files-upload.title': 'Een document aan de reis toevoegen',
  'help.guide.files-upload.goal':
    'Upload een ticket, een bevestiging of een foto uit je downloadmap naar de reis, zodat iedereen in de reis die kan openen.',
  'help.guide.files-upload.step.1':
    'Open de reis en klik in de tabbladbalk op Bestanden. Daar staan de documenten van de reis, met het uploadvak erboven.',
  'help.guide.files-upload.step.2':
    'Klik op ‘Sleep bestanden hierheen’ en kies een of meer bestanden. Ze worden een voor een geüpload, en zolang dat bezig is, staat er ‘Uploaden...’ in het vak. In het vak, onder ‘of klik om te bladeren’, zie je welke bestandstypen deze TREK accepteert en hoe groot een bestand maximaal mag zijn.',
  'help.guide.files-upload.step.3':
    'Zodra het laatste bestand is geüpload, opent ‘Bestand toewijzen’ er vanzelf voor (als de reis plekken of boekingen heeft), met de bestandsnaam boven in het venster. Met ‘Notitie toevoegen...’ onder Notitie zet je een notitie bij het bestand, en met de lijsten daaronder koppel je het aan een plek of boeking. Sluit het venster met de × rechtsboven. Je raakt daarbij niets kwijt.',
  'help.guide.files-upload.step.4':
    'De nieuwe bestanden staan boven aan de lijst. Alleen bestanden met een ster staan nog hoger. Een rij toont wie het bestand heeft geüpload, de naam, de grootte en de datum. Een afbeelding krijgt een miniatuur, bij elk ander bestand zie je het type.',
  'help.guide.files-upload.result':
    'De documenten staan in de reis, en iedereen die de reis kan zien, kan ze openen en downloaden.',
  'help.guide.files-upload.tip.1':
    'Je kunt een bestand ook vanaf het bureaublad direct naar het vak slepen. Het vak licht op zolang het bestand erboven hangt.',
  'help.guide.files-upload.tip.2':
    'Met Ctrl+V zet je een afbeelding van het klembord in de lijst, zodat je een screenshot van een boeking niet eerst hoeft op te slaan.',
  'help.guide.files-upload.tip.3':
    'Voor uploaden heb je het recht nodig om bestanden te uploaden; zonder dat recht is het vak er helemaal niet. Een bestandstype dat niet op de lijst staat, wordt met een melding geweigerd en er wordt niets geüpload. Een bestand boven de limiet (50 MB, tenzij een beheerder een andere limiet heeft ingesteld) wordt geweigerd voordat er iets wordt verstuurd, en de melding noemt de limiet. Uploaden vereist ook een verbinding: offline meldt TREK dat en wordt er niets geüpload.',
  // files-link
  'help.guide.files-link.title': 'Een document koppelen aan een plaats of een boeking',
  'help.guide.files-link.goal':
    'Zorg dat je het ticket makkelijk vindt vanuit de dag waar het bij hoort, niet alleen vanuit deze lijst.',
  'help.guide.files-link.step.1':
    'Klik op het potlood aan het eind van de rij (Toewijzen). ‘Bestand toewijzen’ opent, met de bestandsnaam boven in het venster.',
  'help.guide.files-link.step.2':
    'Onder Notitie kun je bij ‘Notitie toevoegen...’ één regel typen, die daarna in de lijst onder de bestandsnaam staat. De notitie wordt opgeslagen als je op Enter drukt of het veld verlaat.',
  'help.guide.files-link.step.3':
    'Links onder Plaats zie je de plekken van de reis, gegroepeerd per dag met de datum, en aan het eind ‘Niet toegewezen’ voor plekken die op geen enkele dag staan. Klik op een plek om die aan te vinken.',
  'help.guide.files-link.step.4':
    'Rechts onder Boeking en Transport staan de boekingen van de reis. Klik op de boeking waar het document bij hoort. Ook die krijgt een vinkje.',
  'help.guide.files-link.step.5':
    'Sluit het venster met het kruisje rechtsboven. Er is hier geen knop om op te slaan: elke klik is meteen opgeslagen.',
  'help.guide.files-link.result':
    'In de rij staan de notitie en één badge per koppeling: een met de naam van de plaats en een met de naam van de vlucht. Ga je met de muis over een badge, dan zie je Dagplan of Transport. Het document is ook bijgevoegd bij de plaats en bij de vlucht.',
  'help.guide.files-link.tip.1':
    'Een bestand kan meerdere koppelingen tegelijk hebben, zodat dezelfde bevestiging zowel bij de boeking van het hotel als bij de plaats van het hotel kan horen.',
  'help.guide.files-link.tip.2':
    'Klik nog een keer op een aangevinkt item om die koppeling weg te halen; het bestand zelf blijft bestaan. Offline worden de notitie en nieuwe vinkjes opgeslagen en verstuurd zodra TREK weer online is; alleen voor het verwijderen van een andere koppeling heb je een verbinding nodig.',
  'help.guide.files-link.tip.3':
    'Het werkt ook andersom: een document dat aan een plek of boeking is gekoppeld, staat ook in deze lijst, met hetzelfde label op de rij.',
  // files-star
  'help.guide.files-star.title': 'Belangrijke documenten bovenaan houden',
  'help.guide.files-star.goal':
    'Markeer de paar documenten die je echt nodig hebt, zodat je ze snel vindt in een lange lijst.',
  'help.guide.files-star.step.1':
    'Klik op de ster aan het eind van een rij (Ster). De ster wordt goud, er verschijnt een tweede ster voor de bestandsnaam, en als je de muis over de knop beweegt, staat er nu ‘Ster verwijderen’.',
  'help.guide.files-star.step.2':
    'De lijst wordt opnieuw gesorteerd: bestanden met een ster staan boven alle andere, en binnen elke groep staat het nieuwste bovenaan.',
  'help.guide.files-star.step.3':
    'In de filtertabbladen in de balk staat nu direct na Alle een ster, met het aantal bestanden met een ster ernaast. Klik erop om alleen die bestanden te zien.',
  'help.guide.files-star.result':
    'Bestanden met een ster staan bovenaan de lijst, en één tabblad toont alleen bestanden met een ster.',
  'help.guide.files-star.tip.1':
    'Het stertabblad is er alleen zolang een bestand een ster heeft. Haal je de ster bij het laatste bestand weg, dan verdwijnt het tabblad.',
  'help.guide.files-star.tip.2':
    'Voor een ster heb je hetzelfde recht nodig als voor Toewijzen: ‘Bestandsmetadata bewerken’. Een lid zonder dat recht ziet de sterren wel, maar een klik op Ster doet dan niets.',
  // files-filter
  'help.guide.files-filter.title': 'Een document in de lijst vinden',
  'help.guide.files-filter.goal': 'Toon alleen het soort document dat je zoekt.',
  'help.guide.files-filter.step.1':
    "De filtertabbladen staan bovenaan in de balk, naast Bestanden: Alle, PDF's, Afbeeldingen en Documenten, elk met het aantal bestanden erbij.",
  'help.guide.files-filter.step.2': "Klik op PDF's: de lijst toont alleen de PDF-bestanden.",
  'help.guide.files-filter.step.3':
    'Er verschijnen nog twee tabbladen, maar alleen als de reis zulke bestanden heeft. Klik op Collab-notities, dat verschijnt zodra een notitie in het tabblad Samenwerking een bijlage heeft: de lijst toont dan alleen die bestanden. Op dezelfde manier verschijnt een tabblad met een ster zodra een bestand een ster heeft.',
  'help.guide.files-filter.step.4': 'Met Alle zie je weer de hele lijst.',
  'help.guide.files-filter.result':
    'De lijst toont alleen de bestanden van het gekozen tabblad, en het getal op elk tabblad geeft aan hoeveel bestanden dat zijn.',
  'help.guide.files-filter.tip.1':
    'Mappen zijn er hier niet, en je kunt bestanden niet hernoemen. Om documenten uit elkaar te houden, gebruik je de notitie in ‘Bestand toewijzen’, de koppelingen met plekken en boekingen, en de ster.',
  'help.guide.files-filter.tip.2':
    'De lijst is altijd gesorteerd met bestanden met een ster bovenaan en daarna de nieuwste eerst. Een document van vandaag staat dus boven een document van vorige maand.',
  // files-preview
  'help.guide.files-preview.title': 'Een document lezen zonder TREK te verlaten',
  'help.guide.files-preview.goal':
    'Bekijk een ticket of afbeelding meteen, en download het naar je apparaat als je het daar nodig hebt.',
  'help.guide.files-preview.step.1':
    'Klik op de naam of de miniatuur van een afbeelding. Die opent schermvullend, met linksboven de bestandsnaam en het hoeveelste beeld het is. Een video opent op dezelfde manier en speelt daar af.',
  'help.guide.files-preview.step.2':
    'Gebruik de ronde pijlen aan de zijkanten, de pijltjestoetsen links en rechts of de strook met miniaturen onderaan om door alle afbeeldingen te bladeren die de lijst op dat moment toont.',
  'help.guide.files-preview.step.3':
    '‘Openen in nieuw tabblad’ en Downloaden zijn de ronde knoppen rechtsboven, naast de ×. Klik op de ×, druk op Escape of klik op de donkere achtergrond om de afbeelding te sluiten.',
  'help.guide.files-preview.step.4':
    'Een document dat geen afbeelding is, opent in plaats daarvan in een venster: bovenaan de naam, met daaronder de knoppen ‘Openen in nieuw tabblad’ en Downloaden, en bij een PDF daaronder de pagina zelf. Sluit het venster met de × rechtsboven, met Escape of met een klik naast het venster.',
  'help.guide.files-preview.step.5':
    'Met de pijl aan het eind van een rij (Downloaden) sla je het bestand direct op je apparaat op, zonder het eerst te openen.',
  'help.guide.files-preview.result':
    'Het document staat op je scherm, en met dezelfde twee knoppen open je het in een browsertabblad of sla je het op je computer op.',
  'help.guide.files-preview.tip.1':
    'Op een touchscreen veeg je door de afbeeldingen, in plaats van op de pijlen te klikken.',
  'help.guide.files-preview.tip.2':
    'Een walletpas opent nooit als voorbeeld. Hij wordt meteen gedownload, zodat je telefoon hem in de walletapp kan openen.',
  'help.guide.files-preview.tip.3':
    "'Openen in nieuw tabblad' en Downloaden laden het bestand allebei met jouw sessie, dus een link die je uit de adresbalk kopieert, werkt voor niemand anders.",
  // files-trash
  'help.guide.files-trash.title': 'Een document verwijderen en terugzetten',
  'help.guide.files-trash.goal':
    'Verwijder wat de reis niet meer nodig heeft, en zet bestanden terug die je toch nog nodig hebt.',
  'help.guide.files-trash.step.1':
    'Klik op de prullenbak aan het eind van een rij (Verwijderen). Het bestand verdwijnt meteen uit de lijst en je ziet de melding ‘Naar prullenbak verplaatst’. Er wordt niet om bevestiging gevraagd.',
  'help.guide.files-trash.step.2':
    'Met het prullenbakpictogram rechts in de balk (Prullenbak) toon je de verwijderde bestanden. De titel van de balk is dan Prullenbak, en de filtertabbladen en het uploadvak zijn verborgen.',
  'help.guide.files-trash.step.3':
    'Een rij in de prullenbak is grijs en heeft twee iconen: Herstellen, waarmee je het bestand terugzet, en Verwijderen, waarmee je het na bevestiging definitief verwijdert.',
  'help.guide.files-trash.step.4':
    "Klik op Herstellen. De melding 'Bestand hersteld' verschijnt en het bestand verdwijnt uit de prullenbak. De notitie en koppelingen blijven behouden.",
  'help.guide.files-trash.step.5':
    "'Prullenbak legen', in de balk naast het prullenbakicoon, verwijdert alles wat nog in de prullenbak staat definitief. De browser vraagt eerst één keer om bevestiging. Het prullenbakicoon schakelt terug naar de bestanden.",
  'help.guide.files-trash.result': 'Het bestand staat weer op zijn oude plek in de lijst.',
  'help.guide.files-trash.tip.1':
    '‘Verwijderen’ op een rij vraagt niet eerst om bevestiging. Daarom is er een prullenbak: er wordt pas iets uit TREK verwijderd als je het hier verwijdert. Dit werkt ook allemaal offline en wordt verstuurd zodra TREK weer online is.',
  'help.guide.files-trash.tip.2':
    'Om bestanden te verwijderen en terug te zetten, heb je het recht nodig om bestanden te verwijderen. Een lid zonder dat recht ziet geen Verwijderen op de rij en ook geen knoppen in de prullenbak.',
  'help.guide.files-trash.tip.3':
    'Een bestand dat je in de prullenbak definitief hebt verwijderd, kun je niet meer terughalen.',
  // files-sync
  'help.guide.files-sync.title': 'Documenten synchroniseren met je documentopslag',
  'help.guide.files-sync.goal':
    'Koppel de reis aan je eigen documentopslag, zodat bestanden die je hier uploadt daar worden opgeslagen, en bestanden die daar staan hier verschijnen.',
  'help.guide.files-sync.step.1':
    "Klik op Documentsynchronisatie, naast het prullenbakicoon rechts in de balk. Het venster opent met de naam van de reis onder de titel. Links, onder 'Aanbieder koppelen', staan de opslagdiensten die een beheerder heeft aangezet, elk met een regel over hoe bestanden worden opgeslagen: Paperless-ngx en Papra met tags, Nextcloud en Synology Drive in een map, OpenCloud in een space. Rechts staat 'Nog niets verbonden'.",
  'help.guide.files-sync.step.2':
    'Klik op je opslagdienst, hier Nextcloud. Er opent een kleiner venster voor de verbinding, met de naam van de opslagdienst, waarin om de inloggegevens wordt gevraagd die deze dienst nodig heeft.',
  'help.guide.files-sync.step.3':
    "Vul Adres in en de inloggegevens van de opslagdienst: een API-token voor Paperless-ngx, een API-sleutel en de Organisatie-ID voor Papra, Gebruikersnaam en een App-wachtwoord voor Nextcloud, Gebruikersnaam en een App-token voor OpenCloud, en voor Synology Drive Gebruikersnaam, Wachtwoord en, als het account erom vraagt, een Tweestapscode. Gebruik een app-wachtwoord of token als de dienst dat aanbiedt, nooit je accountwachtwoord. Bij Nextcloud en Synology Drive kun je ook een Basismap opgeven, waar TREK naar reismappen zoekt, hier /Reisen. ‘Zelfondertekend certificaat toestaan’ onderaan is alleen bedoeld voor een opslagdienst op je eigen netwerk met zo'n certificaat.",
  'help.guide.files-sync.step.4':
    'Klik op ‘Verbinding testen’. TREK maakt verbinding met de opslagdienst met de gegevens die je hebt ingevuld, en onderaan staat ‘Bereikt, aangemeld als’, gevolgd door de naam van het account. Worden de inloggegevens geweigerd of is het adres niet bereikbaar, dan staat dat daar. In beide gevallen wordt er niets opgeslagen.',
  'help.guide.files-sync.step.5':
    'Klik op Verbinden. De verbinding wordt bij de reis opgeslagen, en TREK vraagt waar in de opslagdienst de documenten van de reis moeten staan: de tag, map of ruimte waarin ze zitten. Alleen wat daarin staat, wordt gesynchroniseerd. ‘Een nieuwe maken’ maakt er een aan als je op Aanmaken klikt, met de titel van de reis als naam. Onder ‘Of gebruik er een die je al hebt’ zie je de bestaande. Klik op een ervan, hier de map Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Het venster opent opnieuw: links staat je opslagdienst onder ‘Deze reis’, en rechts zie je op de kaart waarmee wordt gesynchroniseerd, wanneer dat voor het laatst gebeurde en ‘Nu synchroniseren’. De eerste synchronisatie start vanzelf. Klik op ‘Nu synchroniseren’ om op elk moment te synchroniseren. Na een synchronisatie verandert het label ‘Nog niet gesynchroniseerd’ naast de naam in een groene stip, met Synchroon als je de muis erover beweegt. De stroombalk toont hoeveel documenten TREK en de opslagdienst elk hebben, met daartussen de banen ‘Naar de opslag’ en ‘Uit de opslag’. Sluit het venster met de × rechtsboven.',
  'help.guide.files-sync.result':
    'De documenten die al in de opslag stonden, verschijnen bovenaan de lijst, geüpload op jouw naam, en alle documenten van de reis staan ook in de opslag, behalve die uit Collab-notities. Vanaf nu controleert TREK de opslag op de achtergrond, en wijzigingen in de lijst worden naar de opslag gekopieerd.',
  'help.guide.files-sync.tip.1':
    "Alleen de eigenaar van de reis of een beheerder van de instantie kan een reis koppelen, omdat de inloggegevens toegang geven tot het hele account bij de opslagdienst. Is de reis gekoppeld, dan ziet elk lid Documentsynchronisatie en kan hij of zij het openen, de kaart lezen en op 'Nu synchroniseren' klikken.",
  'help.guide.files-sync.tip.2':
    "Voor een opslagdienst op je eigen netwerk moet op de TREK-server ALLOW_INTERNAL_NETWORK=true staan, en het adres moet het netwerkadres van de machine zijn, nooit localhost. Anders antwoordt 'Verbinding testen' met 'Dat adres is niet toegestaan.'",
  'help.guide.files-sync.tip.3':
    '‘Verbinding verbreken’, het pictogram naast ‘Nu synchroniseren’, vraagt één keer om bevestiging. Daarna wordt de koppeling verbroken en blijven alle documenten aan beide kanten bewaard. Koppel je een tag, map of ruimte een tweede keer, dan ziet TREK die als nieuw en importeert alles erin opnieuw. Koppel na het verbreken dus een lege, niet de oude.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Dagdetails',
  'help.ctx.trip-day-detail.summary':
    'Het paneel dat boven de kaart opent als je op de kop van een dag klikt. Het toont de dag als geheel: de naam en de datum, het weer op de plek waar je bent, de boekingen op die dag en de nachten die ervoor zijn geboekt.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klik in de dagenkolom op de kop van een dag, dan opent het paneel midden boven de kaart. Klik nog een keer op dezelfde kop, of op de X rechts, om het paneel te sluiten en de dag te deselecteren. Open je een plaats vanuit de plaatsenkolom of de kaart, dan sluit het paneel en zie je de plaats.',
  'help.ctx.trip-day-detail.bullet.2':
    'In de kop staan de naam en de datum van de dag. Met het potlood naast de naam geef je de dag een andere naam. Met de dubbele pijl klap je het paneel in tot een smalle balk, zodat je de kaart weer ziet.',
  'help.ctx.trip-day-detail.bullet.3':
    'Bovenaan zie je het weer van de dag. Bij ‘Voorspelling voor’ staat voor welke plek de voorspelling geldt: de eerste stop van de dag of het hotel waar je wakker wordt.',
  'help.ctx.trip-day-detail.bullet.4':
    'Onder Reserveringen staan de boekingen van die dag, elk met het soort boeking, de bijbehorende stop en de tijden. Groen betekent bevestigd, amber nog in behandeling, en een reis met het openbaar vervoer is blauw en heeft geen status. Klik op een rij om de boeking te openen.',
  'help.ctx.trip-day-detail.bullet.5':
    'Accommodatie toont elke nacht die voor deze dag is geboekt, met Inchecken en Uitchecken op de dagen waarop die plaatsvinden, de incheckperiode, de uitchecktijd en het bevestigingsnummer. Hoort er een boeking bij het verblijf, dan staat daaronder een vak Reservering met de boeking en ‘In behandeling’ of ‘Bevestigd’. Klik erop om de boeking te openen.',
  'help.ctx.trip-day-detail.bullet.6':
    '‘Accommodatie toevoegen’ voegt een overnachting op deze dag toe: kies het verblijf uit de plaatsen van de reis, kies welke dagen het beslaat en vul de tijden en de code in. Ook de + in de kop van een dag, met de tooltip ‘Toevoegen aan dag’, heeft ‘Accommodatie toevoegen’: daarmee open je dit paneel met het formulier al geopend.',
  // day-panel
  'help.guide.day-panel.title': 'Een dag openen en de details bekijken',
  'help.guide.day-panel.goal':
    'Bekijk een hele dag, met het weer, de boekingen en je overnachting, zonder de kaart te verlaten.',
  'help.guide.day-panel.step.1':
    'Klik in de dagenkolom op de kop van een dag. De dag wordt geselecteerd en de details openen midden over de kaart.',
  'help.guide.day-panel.step.2':
    "In de kop staat de naam van de dag, 'Dag 1' zolang je hem geen naam geeft, met de datum eronder.",
  'help.guide.day-panel.step.3':
    'Bovenaan staat het weer van de dag. Bij ‘Voorspelling voor’ zie je voor welke plek dat geldt: de eerste stop van de dag of het hotel waar je de nacht ervoor hebt geslapen.',
  'help.guide.day-panel.step.4': 'Daaronder staan bij Reserveringen de boekingen op deze dag, met de tijden.',
  'help.guide.day-panel.step.5':
    'Bij Accommodatie zie je de nachten die voor deze dag zijn geboekt, met Inchecken en Uitchecken op de dagen waarop dat gebeurt.',
  'help.guide.day-panel.step.6':
    'Met de dubbele pijl in de kop klap je het paneel in tot een smalle balk. Met de X ernaast sluit je het paneel en wordt de dag niet meer geselecteerd.',
  'help.guide.day-panel.result':
    'Klap je het paneel in tot een balk, dan is de kaart vrij en blijft de dag geselecteerd. Sluit je het, dan is de dag niet meer geselecteerd en blijft de planning zoals hij was.',
  'help.guide.day-panel.tip.1':
    'Je kunt het paneel ook inklappen door ergens op de kopbalk te klikken. Het pijltje is maar één manier.',
  'help.guide.day-panel.tip.2':
    'Open je een plaats, vanuit de plaatsenkolom of de kaart, dan sluit het paneel van de dag en zie je in plaats daarvan de details van de plaats. Klik nog een keer op de kop van de dag om de dag weer te tonen.',
  // day-weather
  'help.guide.day-weather.title': 'Het weer van de dag bekijken',
  'help.guide.day-weather.goal': 'Bekijk het weer op de plek waar je die dag echt bent.',
  'help.guide.day-weather.step.1':
    'Bij ‘Voorspelling voor’ zie je voor welke plek de cijfers gelden: de eerste stop van de dag of, op een dag zonder stop, het hotel waar je de nacht ervoor slaapt.',
  'help.guide.day-weather.step.2':
    'Het grote getal is de temperatuur van de dag. Daarnaast staan de laagste en de hoogste temperatuur en het weertype in woorden.',
  'help.guide.day-weather.step.3':
    'De labels rechts daarvan: de kans op regen, hoeveel regen, de sterkste wind, en zonsopgang en zonsondergang.',
  'help.guide.day-weather.step.4':
    'Onderaan zie je de dag per uur, om de twee uur: de tijd, het icoon, de temperatuur en de kans op regen. Uren met meer dan 50 procent zijn blauw gemarkeerd.',
  'help.guide.day-weather.result':
    'Ook op de dagkaart in de dagenkolom staat het weer, klein onder het nummer, zodat je snel het weer voor de hele reis ziet.',
  'help.guide.day-weather.tip.1':
    'Graden en wind volgen de Temperatuureenheid onder Weergave in Instellingen: kies je °F Fahrenheit, dan zie je dezelfde voorspelling in °F en mph.',
  'help.guide.day-weather.tip.2':
    'Heeft een dag geen stop met een locatie en geen hotel van de nacht ervoor, dan zie je helemaal geen weer: de voorspelling geldt altijd voor een plek, nooit voor de reis.',
  'help.guide.day-weather.tip.3':
    'Meer dan 16 dagen vooruit is er geen weersverwachting. De cijfers zijn dan gemiddelden van eerdere jaren voor die datum. Ze zijn gemarkeerd met Ø, en een opmerking eronder vermeldt dat.',
  // rename-day
  'help.guide.rename-day.title': 'De dag een naam geven',
  'help.guide.rename-day.goal': 'Geef een dag een naam, zoals ‘Aankomst in Kyoto’ of ‘Rustdag’, in plaats van ‘Dag 5’.',
  'help.guide.rename-day.step.1': "Open de dag. Bovenaan staat 'Dag 5', met de datum eronder.",
  'help.guide.rename-day.step.2': 'Klik op het potlood naast de naam.',
  'help.guide.rename-day.step.3': 'De naam wordt een invoerveld. Typ de naam die je wilt.',
  'help.guide.rename-day.step.4':
    'Druk op Enter of klik ergens anders. Met Escape annuleer je de wijziging. Ook de dagkaart in de dagenkolom toont de nieuwe naam.',
  'help.guide.rename-day.result':
    'De naam vervangt ‘Dag 5’ in het paneel en op de dagkaart in de dagenkolom. De datum verandert niet.',
  'help.guide.rename-day.tip.1':
    'Maak je het veld leeg en sla je op, dan heet de dag weer ‘Dag 5’: zonder naam wordt het nummer getoond.',
  'help.guide.rename-day.tip.2':
    'De naam hoort bij de dag, niet bij de datum. Verander je de volgorde van de dagen, dan gaat de naam mee met alles wat op die dag staat.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Een overnachting op een dag boeken',
  'help.guide.add-accommodation.goal':
    'Zet het hotel één keer in de planning, met de dagen waarop je er verblijft, de tijden en het bevestigingsnummer.',
  'help.guide.add-accommodation.step.1':
    'De accommodatie moet eerst een plaats in de reis zijn. Maak hem aan in de plaatsenkolom, net als elke andere plaats: de kiezer toont alleen plaatsen die al bestaan.',
  'help.guide.add-accommodation.step.2':
    'Open de dag waarop je aankomt en klik onder Accommodatie op ‘Accommodatie toevoegen’.',
  'help.guide.add-accommodation.step.3':
    'Bij ‘Toepassen op dagen’ stel je in welke nachten het verblijf omvat: Begin is de dag van inchecken, Einde de dag van uitchecken, en Alle omvat de hele reis. Boven in het venster zie je de periode en het aantal nachten.',
  'help.guide.add-accommodation.step.4':
    'Vul Inchecken, Tot en Uitchecken in, en zet het boekingsnummer bij Bevestiging. Alle vier de velden mogen leeg blijven.',
  'help.guide.add-accommodation.step.5':
    'Kies het verblijf onder ‘Selecteer accommodatie’. Met ‘Categorie’ boven de lijst beperk je de lijst tot één categorie.',
  'help.guide.add-accommodation.step.6': 'Klik op Opslaan.',
  'help.guide.add-accommodation.result':
    'Het verblijf staat op elke dag die het omvat, met Inchecken op de eerste en Uitchecken op de laatste dag. De accommodatie wordt een stop op de dag van inchecken, zodat de kaart de route erheen toont, en op het tabblad Boekingen verschijnt een hotelboeking.',
  'help.guide.add-accommodation.tip.1':
    'De kiezer opent op de dag waar je vandaan kwam, met uitchecken op de dag erna; je kunt beide nog aanpassen voordat je opslaat.',
  'help.guide.add-accommodation.tip.2':
    'Geef het hotel bij het aanmaken de categorie Hotel. Dan toont Categorie boven de lijst met één klik alleen je hotels.',
  'help.guide.add-accommodation.tip.3':
    'De tijden zijn allemaal optioneel: een verblijf zonder inchecktijd en zonder code geldt nog steeds voor de nachten, en de route wordt gewoon getekend.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Een geboekte nacht wijzigen of annuleren',
  'help.guide.edit-accommodation.goal': 'Verplaats een verblijf, corrigeer de tijden of haal het uit de planning.',
  'help.guide.edit-accommodation.step.1':
    'De kaart toont de accommodatie en het adres, Inchecken of Uitchecken op de dagen waarop die plaatsvinden met de tijden, het bevestigingsnummer, en onder Reservering de bijbehorende boeking.',
  'help.guide.edit-accommodation.step.2':
    'Het potlood rechts, ‘Accommodatie bewerken’, opent het verblijf om te bewerken. De titel van de pop-up is nu ‘Accommodatie bewerken’.',
  'help.guide.edit-accommodation.step.3':
    'Corrigeer Inchecken, Tot, Uitchecken en Bevestiging. Ook de dagen erboven en de accommodatie eronder kun je hier wijzigen.',
  'help.guide.edit-accommodation.step.4': 'Klik op Opslaan.',
  'help.guide.edit-accommodation.step.5':
    'Met de X naast het potlood, ‘Verwijderen’, verwijder je het verblijf. Er wordt niet om bevestiging gevraagd, en de hotelboeking die bij het verblijf hoort, wordt ook verwijderd.',
  'help.guide.edit-accommodation.result':
    'De wijziging geldt meteen voor elke dag van het verblijf, en ook voor de hotelboeking op het tabblad Boekingen.',
  'help.guide.edit-accommodation.tip.1':
    'Een nacht midden in een verblijf heeft geen label Inchecken of Uitchecken: alleen de eerste en de laatste dag van de periode hebben er een.',
  'help.guide.edit-accommodation.tip.2':
    'Annuleer je een verblijf, dan verdwijnen ook de stop die het op de incheckdag had toegevoegd en alle kosten die aan de boeking gekoppeld zijn. Was het een vergissing? Boek de overnachting dan opnieuw.',
  // day-bookings
  'help.guide.day-bookings.title': 'De boekingen van de dag in één oogopslag',
  'help.guide.day-bookings.goal': 'Zie op één plek wat er voor deze dag al is geboekt en of het bevestigd is.',
  'help.guide.day-bookings.step.1':
    'Onder Reserveringen staan de boekingen van de dag: de boekingen met die datum en de boekingen die aan een van de stops van die dag zijn gekoppeld. Een boeking die aan een stop op een andere dag is gekoppeld, staat alleen bij die stop.',
  'help.guide.day-bookings.step.2':
    'Een rij laat zien wat voor boeking het is en hoe die heet, en als de boeking bij een stop hoort, staat die stop er in grijs achter. Helemaal rechts, vóór de statusstip, staan de tijden.',
  'help.guide.day-bookings.step.3':
    'De kleur geeft de status van een boeking aan: groen is bevestigd, amber nog in behandeling, en een reis met het openbaar vervoer is blauw, zonder status. Hotels staan niet in deze lijst, die hebben verderop een eigen onderdeel.',
  'help.guide.day-bookings.step.4':
    'Klik op een rij om de boeking te openen. Met het label bovenaan wissel je tussen ‘In behandeling’ en ‘Bevestigd’, en met ‘Bewerken’ onderaan wijzig je de rest. Nieuwe boekingen maak je op het tabblad Boekingen, vervoer op het tabblad Transport.',
  'help.guide.day-bookings.result':
    'Alles wat op die dag gepland staat en alles wat aan een van de stops is gekoppeld, staat in deze lijst.',
  'help.guide.day-bookings.tip.1':
    'Een boeking verschijnt op de dag van zijn eigen datum. Wijzig je de datum op het tabblad Boekingen of Transport, dan verhuist de boeking automatisch naar de andere dag.',
  'help.guide.day-bookings.tip.2':
    'Staat er geen blok Reserveringen, dan heeft de dag geen boekingen: het blok wordt dan verborgen in plaats van leeg getoond.',
  'help.guide.map-lock.title': 'De kaart vergrendelen',
  'help.guide.map-lock.goal': 'Houd de kaart op zijn plek terwijl je door dagen en plaatsen klikt.',
  'help.guide.map-lock.step.1':
    'Het slot is de bovenste van de twee ronde knoppen linksonder op de kaart; als je er met de muis op staat, zie je ‘Kaartweergave vergrendelen’. Klik erop. Zolang het slot dicht is, zoomt of verschuift de kaart niet meer als je een dag opent of een plaats kiest, en op de knop staat nu ‘Kaart de selectie laten volgen’.',
  'help.guide.map-lock.result': 'De kaart blijft staan waar je hem liet terwijl je de planning doorwerkt.',
  'help.guide.map-lock.tip.1':
    'Klik nog een keer op het slot, nu ‘Kaart de selectie laten volgen’, en de kaart volgt weer wat je kiest. Het slot is er alleen op een computer; op een telefoon volgt de kaart altijd.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Kaart',
  'help.ctx.trip-map.summary':
    'Het midden van de planning: elke plaats van de reis als speld, elke tocht als lijn, de routes ertussen, en langs de randen van de kaart knoppen om de weergave te vergrendelen, naar satelliet te wisselen, de hele reis in één keer te tonen en de plaatsen te tonen in het gebied waar je naar kijkt.',
  'help.ctx.trip-map.bullet.1':
    'Een speld is een plaats: de eigen foto als die er is, en anders de categoriekleur met het categoriepictogram. Ga met de muis over een speld voor een kaartje met de afbeelding, de naam en het adres, plus de beoordeling en de categorie als de plaats die heeft. Sleep een speld naar een dagkaart om de plaats op die dag te plannen. Een verblijf waarvan de boeking nog in behandeling is, wordt vervaagd weergegeven, met een gestippelde ring.',
  'help.ctx.trip-map.bullet.2':
    'Spelden die te dicht bij elkaar staan, worden samengevoegd tot één donkere cirkel met een getal. Klik op de cirkel, dan zoomt de kaart in op de spelden erin. Staat ‘Compacte markeringen voor ongeplande plaatsen’ aan, in Instellingen > Weergave onder Reizen en kaart, dan zijn plaatsen die nog op geen enkele dag staan kleine stippen zonder foto, zodat de geplande stops beter opvallen.',
  'help.ctx.trip-map.bullet.3':
    'Klik op een speld om de plaats te openen in een kaartje onderaan de kaart, met de beoordeling, de bestanden en de volgende acties. Klik op een lege plek op de kaart om het kaartje te sluiten.',
  'help.ctx.trip-map.bullet.4':
    'Is er in de dagenkolom een dag open, dan krijgen de stops van die dag een klein wit badgeje met hun nummer in die dag. Staat een plaats twee keer in de dag, dan zie je beide nummers. De filters boven de plaatsenlijst (Tonen, de categorieën en de ster voor een minimale beoordeling) filteren ook de markeringen op de kaart.',
  'help.ctx.trip-map.bullet.5':
    'Met de rij pictogrammen bovenaan zoek je in het zichtbare deel van de kaart: Restaurants, Cafés, Bars & uitgaan, Accommodatie, Bezienswaardigheden, Musea & cultuur, Natuur & parken en Activiteiten. Categorieën van plugins staan erachter, na een dunne scheidingslijn. Is de rij breder dan de kaart, dan scrol je er met het muiswiel zijwaarts doorheen. Met ‘Dit gebied doorzoeken’ zoek je opnieuw nadat je de kaart hebt verschoven.',
  'help.ctx.trip-map.bullet.6':
    'Klik met de rechtermuisknop ergens op de kaart om op dat punt het formulier voor een plaats te openen, met het adres al opgezocht. Linksonder staan twee ronde knoppen: met het slotje, ‘Kaartweergave vergrendelen’, blijft de kaart staan terwijl je door dagen en plaatsen klikt, en met de knop eronder, ‘Overschakelen naar satellietweergave’, vervang je de getekende kaart door satellietbeelden.',
  'help.ctx.trip-map.bullet.7':
    "'Hele reis tonen' rechtsonder tekent alle reisdagen in één keer en toont per dag wat die omvat. Het route-icoon in de rij van een boeking tekent die boeking, en het route-icoon in de werkbalk boven de dagen tekent alle boekingen. Klik op het uiteinde van een getekende boeking om de details te openen.",
  'help.ctx.trip-map.bullet.8':
    'Staat de add-on Dawarich aan, dan toont de ronde Dawarich-knop onder ‘Hele reis tonen’ de route die je telefoon echt heeft vastgelegd. ‘Opgenomen route tonen’ tekent die als stippellijn onder de geplande route, met een eigen kleur per dag. Verschijnt er geen lijn, dan zie je aan het label van de knop waarom.',
  // map-markers
  'help.guide.map-markers.title': 'De kaart lezen',
  'help.guide.map-markers.goal': 'Begrijp wat elke speld, elk label en elk ballonnetje op de kaart betekent.',
  'help.guide.map-markers.step.1':
    'De kaart toont elke plek van de reis. Waar spelden te dicht bij elkaar staan om ze uit elkaar te houden, worden ze gegroepeerd in één donkere cirkel met het aantal spelden erin. Klik op de cirkel en de kaart zoomt in op die spelden, of zet ze op het diepste zoomniveau uit elkaar.',
  'help.guide.map-markers.step.2':
    'Een speld toont de eigen foto van de plaats als die er is, en anders de categoriekleur met het categoriepictogram. Een verblijf waarvan de boeking nog in behandeling is, wordt vervaagd weergegeven, met een gestippelde ring. Ga je met de muis over een speld, dan opent ernaast een kaartje: dezelfde foto, groter, de naam en het adres, met de beoordeling en de categorie als de plaats die heeft.',
  'help.guide.map-markers.step.3':
    'Klik op een speld, dan opent de plaats in een kaart onderaan over de kaart heen: bovenaan de afbeelding, de naam en het adres, daarna de sterren, de beschrijving en de bestanden, inclusief die van de boeking. Onderaan staan de acties: ‘Toevoegen aan dag’ als er een dag open is (‘Verwijderen van dag’ als de plaats er al op staat), ‘Navigatie’, ‘Website openen’, ‘In collectie opslaan’ (‘Opgeslagen’ zodra hij in een collectie staat), en rechts de prullenbak en ‘Bewerken’. Met de X bovenaan, of een klik op een leeg stuk van de kaart, sluit je hem.',
  'help.guide.map-markers.step.4':
    'Open je een dag in de dagenkolom, dan krijgen de stops nummers: het kleine witte badge in de hoek van een speld geeft aan op welke plek de stop in de dag staat. Komt een plaats twee keer voor op die dag, dan zie je beide nummers. Is er geen dag geopend, dan zijn er geen nummers en staat in de hoek de beoordeling van de plaats, als die er is.',
  'help.guide.map-markers.step.5':
    'Sleep een speld van de kaart naar een dagkaart in de dagenkolom, dan wordt de plaats op die dag ingepland, net als wanneer je de rij uit de plaatsenlijst sleept.',
  'help.guide.map-markers.result':
    'Aan de reis is niets veranderd: de kaart toont de reis alleen. Elke speld laat zien welke plaats het is, op welke dag en in welke volgorde.',
  'help.guide.map-markers.tip.1':
    'Klap je een dag in de dagenkolom in, dan verdwijnen de stops ervan van de kaart. Klap de dag weer uit om ze te tonen.',
  'help.guide.map-markers.tip.2':
    'De filters boven de plaatsenlijst bepalen ook wat de kaart toont: ‘Tonen’ (Ongepland, Gepland), de categorieën onder de labelknop en een minimale beoordeling onder de ster beperken allemaal het aantal spelden. Het landfilter beperkt alleen de lijst.',
  'help.guide.map-markers.tip.3':
    'Deze kaart heeft geen zoomknoppen: je zoomt met het scrollwiel, met een dubbelklik zoom je een stap in en door de kaart te slepen verschuif je hem.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Plekken in de buurt vinden op de kaart',
  'help.guide.map-nearby-places.goal':
    'Zoek naar restaurants, bezienswaardigheden of een hotel in het deel van de stad dat op de kaart staat, en voeg er een toe aan de reis.',
  'help.guide.map-nearby-places.step.1':
    'Met de rij pictogrammen bovenaan de kaart zoek je per categorie: Restaurants, Cafés, Bars & uitgaan, Accommodatie, Bezienswaardigheden, Musea & cultuur, Natuur & parken en Activiteiten. Categorieën van plugins staan erachter, na een dunne scheidingslijn. Beweeg je muis over een pictogram om de naam te zien.',
  'help.guide.map-nearby-places.step.2':
    'Klik op een categorie. TREK zoekt naar dat soort plaatsen in het zichtbare deel van de kaart en zet bij elk resultaat een speld in de kleur van de categorie. Er kan één categorie tegelijk actief zijn: klik je op een andere, dan vervangt die de vorige, en klik je op de actieve, dan zet je hem uit.',
  'help.guide.map-nearby-places.step.3':
    "Verschuif je de kaart, dan verschijnt onder de rij een tweede knop: 'Dit gebied doorzoeken' voert dezelfde zoekopdracht uit voor het nieuwe kaartbeeld. Alleen de kaart verschuiven start geen nieuwe zoekopdracht. Zo blijft het aantal verzoeken laag.",
  'help.guide.map-nearby-places.step.4':
    'Houd de muis boven een markering om de naam te zien van wat er is gevonden. Klik op de markering en het formulier voor de plaats opent met de gegevens al ingevuld: de naam bovenaan het venster, Adres, Breedtegraad en Lengtegraad, en de website en het telefoonnummer als die zijn gevonden.',
  'help.guide.map-nearby-places.step.5':
    'Controleer wat er is ingevuld en vul aan wat de zoekopdracht niet kon weten. Het categorielabel onder de naam is al ingesteld als de reis een passende categorie heeft, zoals restaurant voor een restaurant. Anders staat er ‘Geen categorie’ tot je er een kiest. Voeg een Beschrijving en eigen notities toe.',
  'help.guide.map-nearby-places.step.6':
    "Klik op Toevoegen. Staat er al een plaats met dezelfde naam of op dezelfde plek in de reis, dan meldt TREK dat, en verandert de knop in 'Toch toevoegen'.",
  'help.guide.map-nearby-places.result':
    'De plek staat in de plekkenlijst en als eigen speld van de reis op de kaart, onder Ongepland tot je hem op een dag zet. De spelden van de zoekopdracht blijven staan tot je de categorie uitzet.',
  'help.guide.map-nearby-places.tip.1':
    'De rij is verborgen als ‘Plaatsen op de kaart ontdekken’ uit staat in Instellingen > Weergave, onder Reis en kaart.',
  'help.guide.map-nearby-places.tip.2':
    'De resultaten komen uit de TREK-plaatsenindex en van OpenStreetMap. Dit is dus een van de weinige onderdelen van de planning waarvoor je verbinding nodig hebt.',
  'help.guide.map-nearby-places.tip.3':
    'Er wordt alleen gezocht in het gebied dat op het scherm staat. Zoom dus in op de straat die je interesseert. Zoek je in een hele stad, dan krijg je alleen de eerste zestig resultaten, zonder duidelijke volgorde.',
  // map-add-place
  'help.guide.map-add-place.title': 'Een plek aanmaken met een rechterklik op de kaart',
  'help.guide.map-add-place.goal': 'Zet een plaats precies waar je hem wilt hebben, zonder eerst te zoeken.',
  'help.guide.map-add-place.step.1':
    "Klik met rechts op de plek op de kaart. Het plaatsformulier opent met de kop 'Plaats/activiteit toevoegen'.",
  'help.guide.map-add-place.step.2':
    'Breedtegraad en Lengtegraad staan al op dat punt. TREK zoekt de coördinaten op en vult bij Adres in wat het daar vindt. Levert het opzoeken een naam op, dan vult TREK ook de naam bovenaan het venster in. Er is nog niets opgeslagen, dus verbeter wat niet klopt.',
  'help.guide.map-add-place.step.3':
    'Typ in het veld boven in het venster een naam die je herkent. Kies een categorie via het label eronder, waarop ‘Geen categorie’ staat tot je er een kiest. Vul daarna de andere gegevens voor de planning in: Beschrijving, Notities, Website.',
  'help.guide.map-add-place.step.4':
    'Klik op Toevoegen. De plek komt als ongepland in de lijst, ook als er een dag open is: met een rechterklik op de kaart bepaal je de locatie, niet de dag.',
  'help.guide.map-add-place.result':
    'De plek staat in de lijst en op de kaart, onder Ongepland tot je hem op een dag zet.',
  'help.guide.map-add-place.tip.1':
    'Het adres wordt opgezocht op basis van de coördinaten, dus er kan een straat staan in plaats van een naam, en in het buitengebied kan het leeg zijn. Je kunt beide velden overschrijven.',
  'help.guide.map-add-place.tip.2':
    'Op de kaarten van MapLibre GL en Mapbox GL werkt een klik met de middelste muisknop ook, en op een touchscreen lang drukken.',
  // map-satellite
  'help.guide.map-satellite.title': 'Overschakelen naar satelliet',
  'help.guide.map-satellite.goal': "Wissel tussen de gewone kaart en luchtfoto's.",
  'help.guide.map-satellite.step.1':
    'De schakelaar voor de basislaag is de onderste van de twee ronde knoppen linksonder op de kaart, onder het slot. Het pictogram toont altijd de laag waarnaar hij wisselt, en de tooltip zegt welke: ‘Overschakelen naar satellietweergave’. Klik erop.',
  'help.guide.map-satellite.step.2':
    "De kaart toont nu luchtfoto's. Die zijn zo gedetailleerd dat je losse gebouwen ziet, en je hebt er geen eigen sleutel voor nodig. Alles wat TREK tekent, blijft erbovenop: de spelden, de route van de dag, de tracks en de routes van boekingen.",
  'help.guide.map-satellite.step.3':
    'Op de knop staat nu ‘Overschakelen naar kaartweergave’. Klik erop om terug te gaan naar de kaartweergave.',
  'help.guide.map-satellite.result':
    'De kaart wordt opnieuw getekend, en de laag die je hebt gekozen, wordt in je account onthouden.',
  'help.guide.map-satellite.tip.1':
    'De keuze wordt in je account opgeslagen, niet in de reis. Elke reis opent dus zoals je hem achterliet, welke kaartweergave je ook gebruikt.',
  'help.guide.map-satellite.tip.2':
    'Op de satellietbeelden staan geen namen: straatnamen, wijken en huisnummers zie je alleen op de gewone kaart, dus schakel terug als je een adres zoekt.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'De hele reis en de afstanden bekijken',
  'help.guide.map-whole-trip.goal':
    'Toon elke reisdag in plaats van alleen de geopende dag, en zie hoeveel kilometer je per dag aflegt.',
  'help.guide.map-whole-trip.step.1':
    'De ronde knop ‘Hele reis tonen’ zit rechtsonder op de kaart. Klik erop en alle reisdagen worden in één keer getekend, elk in een eigen kleur, zodat je opeenvolgende dagen uit elkaar kunt houden.',
  'help.guide.map-whole-trip.step.2':
    'Op de kaart boven de knop staan die dagen: een gekleurde stip, de naam van de dag, een icoon voor elk vervoermiddel dat je die dag gebruikt, en de afstand die je aflegt. Bovenaan staat de totale afstand.',
  'help.guide.map-whole-trip.step.3':
    'Klik op een dag in het kaartje om die te selecteren: de rij wordt gemarkeerd en de dag opent in de dagenkolom. Scrol met het muiswiel boven een stad om in te zoomen. De dagen die door die stad gaan, worden naast elkaar getoond, elk in een eigen kleur.',
  'help.guide.map-whole-trip.step.4':
    "Op de knop staat nu 'Hele reis verbergen'. Klik erop om weer alleen de geopende dag te tonen.",
  'help.guide.map-whole-trip.result':
    'Elke reisdag krijgt een eigen kleur, en op de kaart zie je wat elke dag omvat en het totaal voor de hele reis.',
  'help.guide.map-whole-trip.tip.1':
    'Het totaal wordt steeds voor een paar trajecten tegelijk berekend. Zolang er … achter staat, is het getal nog maar een deel van het totaal. Het is definitief zodra elk traject is berekend.',
  'help.guide.map-whole-trip.tip.2':
    'Kan de routeplanner een traject niet berekenen, dan blijft dat traject een rechte lijn en telt het niet mee. Dat zie je op de kaart staan, zodat het totaal niet ongemerkt te laag uitvalt.',
  'help.guide.map-whole-trip.tip.3':
    "Een dag met minder dan twee stops met een locatie en zonder rit van of naar het hotel heeft geen route om te tekenen. Zo'n dag staat dan helemaal niet op de kaart.",
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'De route van een boeking op de kaart tonen',
  'help.guide.map-booking-routes.goal':
    'Toon de vluchten, treinen en autoritten die je hebt geboekt op de kaart, en haal ze er weer af.',
  'help.guide.map-booking-routes.step.1':
    "Boekingsroutes staan uit tot je er een aanzet. Rechts in de rij van vervoer in de dagenkolom staat een klein route-icoon: 'Boekingsroutes tonen'.",
  'help.guide.map-booking-routes.step.2':
    'Klik erop en de boeking verschijnt op de kaart: een vlucht als grootcirkelboog, een autorit over de echte wegen, een trein als reeks van zijn stations. Bevestigd wordt als doorgetrokken lijn getekend, ‘In behandeling’ als stippellijn, en de uiteinden van de route zijn blauwe labels met het pictogram van het vervoer.',
  'help.guide.map-booking-routes.step.3':
    'Klik op een label aan het eind van de lijn om de details van de boeking te openen: status, soort en dagen als labels in de gekleurde kop, de tijden aan beide kanten, de overige gegevens daaronder, en onderaan ‘Op kaart’, waarmee je deze route weer uitzet, ‘Route wijzigen’ bij een OV-verbinding, de prullenbak om de boeking te verwijderen, en ‘Bewerken’. Met de X bovenaan sluit je de details.',
  'help.guide.map-booking-routes.step.4':
    'Het routepictogram in de werkbalk boven de dagen werkt voor de hele reis tegelijk: ‘Alle boekingsroutes tonen’ tekent elke boeking die een route heeft.',
  'help.guide.map-booking-routes.step.5':
    'Dit vervangt je eerdere keuzes, dus routes die je per boeking had aangezet, worden teruggezet. Druk er nog een keer op, nu met het label ‘Alle boekingsroutes verbergen’, om alle boekingsroutes te verbergen.',
  'help.guide.map-booking-routes.result':
    'De boekingen die je hebt gekozen, worden op de kaart getekend. De keuze blijft voor deze reis in deze browser bewaard tot je hem wijzigt.',
  'help.guide.map-booking-routes.tip.1':
    'De uiteinden tonen alleen de luchthavencode of de naam van het station als ‘Routelabels voor boekingen’ aan staat in Instellingen > Weergave, onder Reis en kaart. Anders zie je alleen het pictogram.',
  'help.guide.map-booking-routes.tip.2':
    '‘Boekingsroutes altijd tonen’, in hetzelfde onderdeel, toont ze vanaf het begin op elke reis waarvoor je dit nog niet zelf hebt ingesteld.',
  'help.guide.map-booking-routes.tip.3':
    'Een boeking kan pas worden getekend als zowel het begin als het eind coördinaten heeft. Een hotel of restaurant heeft daarom geen route-icoon.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'De route tonen die je echt hebt afgelegd',
  'help.guide.map-dawarich-trail.goal':
    'Toon de route die Dawarich op je telefoon heeft opgenomen als stippellijn naast je geplande route op de kaart, en zie per dag hoe de reis echt is verlopen.',
  'help.guide.map-dawarich-trail.step.1':
    'De ronde Dawarich-knop zit rechtsonder op de kaart, onder ‘Hele reis tonen’. Beweeg je de muis erover, dan staat er ‘Opgenomen route tonen’. Klik erop. TREK vraagt de gegevens voor de data van de reis op bij je Dawarich, en zolang TREK op antwoord wacht, draait er een ring rond de knop.',
  'help.guide.map-dawarich-trail.step.2':
    'De opgenomen route verschijnt als stippellijn, met een eigen kleur per dag, onder de geplande route, zodat de planning leesbaar blijft. Op de knop staat nu ‘Opgenomen route verbergen’. Elke dag eindigt om middernacht plaatselijke tijd. Klap je een dag in de dagenkolom in, dan verdwijnen de stippellijn en de stops van die dag van de kaart.',
  'help.guide.map-dawarich-trail.step.3':
    'Klik ook op ‘Hele reis tonen’, dan wordt elke geplande dag als doorgetrokken lijn naast de stippellijn van de opname getekend. Waar de twee lijnen samenvallen, ging de dag volgens plan. Waar de stippellijn van de geplande route afwijkt, niet.',
  'help.guide.map-dawarich-trail.result':
    'Wat je had gepland en wat je echt hebt gedaan, staan samen op de kaart, als stippellijn en doorgetrokken lijn. De kaart boven de knoppen toont nog steeds de geplande dagen en hun afstanden.',
  'help.guide.map-dawarich-trail.tip.1':
    'Of de route aan of uit staat, wordt per reis in je account opgeslagen, dus dat is in elke browser en op elk apparaat hetzelfde. Zolang de route aan staat, vraagt TREK elke twee minuten opnieuw gegevens op bij Dawarich, zodat een lopende reis wordt bijgewerkt zonder dat je de pagina hoeft te herladen. De route zelf wordt nooit opgeslagen: hij staat niet in de database van TREK en niet in back-ups, en is offline niet beschikbaar.',
  'help.guide.map-dawarich-trail.tip.2':
    "Het label van de knop vertelt waarom de kaart leeg is: 'De opgenomen route wordt geladen…' tijdens het laden, 'Op deze datums is er niets opgenomen', 'De opgenomen route kon niet worden geladen', of 'De opgenomen route heeft een verbinding nodig' als TREK offline is.",
  // map-compass
  'help.guide.map-compass.title': 'De kaart draaien en het noorden terugvinden',
  'help.guide.map-compass.goal':
    'Draai de kaart in de richting waarin je gaat en zet hem met één klik terug op het noorden.',
  'help.guide.map-compass.step.1':
    'Draai de kaart door met de rechtermuisknop te slepen, of houd Ctrl ingedrukt en sleep met de linkermuisknop. Op een touchscreen draai je met twee vingers. Het ronde kompas naast de rij categoriepictogrammen boven op de kaart draait mee: de pijl wijst altijd naar het noorden en draait dus net zo ver als de kaart.',
  'help.guide.map-compass.step.2':
    'Klik op het kompas. De knop, ‘Reset north’, draait de kaart terug zodat het noorden boven ligt, maakt het beeld weer vlak, en de pijl wijst weer omhoog.',
  'help.guide.map-compass.result':
    'Het noorden ligt weer boven en de kaart is weer vlak. Aan de reis is niets veranderd: het kompas wijzigt alleen de weergave.',
  'help.guide.map-compass.tip.1':
    "Het kompas is er alleen op de kaarten van MapLibre GL en Mapbox GL; de Leaflet-kaart kun je niet draaien, dus die heeft geen kompas. Welke kaart je gebruikt, kies je bij Kaartprovider in Instellingen, onder Kaart, en met 'Kaart opslaan' sla je die keuze op.",
  'help.guide.map-compass.tip.2':
    "Met de klik verdwijnt ook de kanteling. Sleep met de rechtermuisknop omhoog of omlaag om het beeld te kantelen; 'Reset north' maakt het weer vlak en zet de draaiing terug. Op Mapbox GL met '3D-gebouwen & terrein' aan wordt ook het 3D-beeld plat, tot je weer kantelt.",

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Samenwerking',
  'help.ctx.trip-collab.summary':
    'Op dit tabblad plant de groep samen, met vijf kaarten: links de chat, daarnaast Notities en Links, daaronder Polls en ‘Wat komt er’. Alles wat je hier schrijft, verschijnt meteen op het scherm van alle andere leden, zonder dat ze hoeven te herladen.',
  'help.ctx.trip-collab.bullet.1':
    'De chat is de kaart links. Typ in ‘Typ een bericht...’ en druk op Enter. Met Shift en Enter begin je een nieuwe regel. Met de smiley voeg je een emoji toe, en met ‘Afbeeldingen toevoegen’ voeg je maximaal vier afbeeldingen aan het bericht toe.',
  'help.ctx.trip-collab.bullet.2':
    'Ga met de muis over een bericht voor Beantwoorden en, bij je eigen berichten, Verwijderen; klik er met rechts op voor de acht snelle reacties. Op de plek van een verwijderd bericht staat dan wie het heeft verwijderd.',
  'help.ctx.trip-collab.bullet.3':
    'Notities is de gedeelde plek voor notities: met ‘Nieuwe notitie’ in de kop maak je een notitie, en het tandwiel ernaast opent ‘Categorieën beheren’ voor de namen en kleuren. Zodra er categorieën zijn, filtert een rij pillen onder de kop de kaarten: Alle, of één categorie. Een notitiekaart toont de categorie als gekleurde stip en de link als ronde knop, en de drie puntjes (‘Meer opties’) bevatten ‘Uitvouwen’, ‘Vastpinnen’, ‘Bewerken’ en ‘Verwijderen’.',
  'help.ctx.trip-collab.bullet.4':
    "Links verzamelt de webadressen voor de reis. Bij 'Link toevoegen' vul je een titel en een http- of https-adres in. 'Link bewerken', 'Link vastmaken' en 'Link verwijderen' staan aan het eind van de chip, en vastgemaakte links blijven vooraan staan.",
  'help.ctx.trip-collab.bullet.5':
    "Neem samen beslissingen met polls. Met 'Nieuwe poll' stel je een vraag met minstens twee opties. Klik op een optie om erop te stemmen. Met het slotje (Sluiten) en de prullenbak (Verwijderen) rechts in de kop van een poll beëindig je de stemming of verwijder je de poll.",
  'help.ctx.trip-collab.bullet.6':
    '‘Wat komt er’ toont de stops van de reis die nog komen, maximaal acht, met de tijden en de mensen die meegaan. Het leest alleen het dagplan; de tijden stel je daar in.',
  // write-note
  'help.guide.write-note.title': 'Een gedeelde notitie schrijven',
  'help.guide.write-note.goal':
    'Zet wat de hele groep moet weten, zoals een afspraak, een adres of een herinnering, op een plek waar iedereen het kan vinden.',
  'help.guide.write-note.step.1':
    'Klik in de kop van de kaart Notities op ‘Nieuwe notitie’. Het venster voor de notitie opent, met de cursor al in het titelveld.',
  'help.guide.write-note.step.2':
    'Typ de titel bovenaan in het venster, waar Notitietitel staat. Dat is het enige verplichte veld: Aanmaken blijft grijs tot er een titel staat, en als je in de titel op Enter drukt, wordt de notitie meteen aangemaakt.',
  'help.guide.write-note.step.3':
    'Inhoud bevat de tekst en ondersteunt Markdown: een vetgedrukt woord, een lijst, een kopje. Op de kaart zie je de eerste drie regels, en met Uitvouwen in het menu open je de hele notitie.',
  'help.guide.write-note.step.4':
    'Kies onder ‘Categorie’ de categorie waar de notitie bij hoort. De kleur daarvan wordt nu gebruikt voor de kop van het venster en later voor de kop van de kaart. De eerste categorie is al voor je gekozen. De pillen zijn de bestaande categorieën; een nieuwe maak je aan via ‘Categorieën beheren’. Heeft de reis nog geen categorieën, dan is deze rij er niet.',
  'help.guide.write-note.step.5':
    'Bij Website vul je een link in die bij de notitie hoort. De kaart toont dan bovenaan een ronde linkknop die de link opent.',
  'help.guide.write-note.step.6':
    'Klik op Aanmaken. Het venster sluit alleen met Annuleren of het kruisje, dus als je ernaast klikt of op Esc drukt, raak je je tekst niet kwijt.',
  'help.guide.write-note.result':
    'De notitie staat als kaart in het paneel Notities, met de bovenkant in de kleur van de categorie, en alle andere leden zien hem meteen.',
  'help.guide.write-note.tip.1':
    'Via de drie puntjes op een kaart (‘Meer opties’) vind je Uitvouwen, Vastpinnen, Bewerken en Verwijderen. Met Vastpinnen blijft de notitie bovenaan het paneel staan, met een kader in de kleur van de notitie. Alle andere notities zijn gesorteerd op het moment waarop ze het laatst zijn gewijzigd.',
  'help.guide.write-note.tip.2':
    'Het tandwiel naast ‘Nieuwe notitie’ opent ‘Categorieën beheren’. Daar geef je een categorie een kleur, hernoem je hem overal tegelijk of maak je hem aan voordat een notitie hem gebruikt. Er verandert niets tot je op Opslaan klikt.',
  'help.guide.write-note.tip.3':
    'Met ‘Bestanden bijvoegen’ voeg je een document toe aan de notitie, als je bestanden naar de reis mag uploaden. ‘Bijvoegen’ opent de bestandskiezer. Je kunt ook een afbeelding of PDF in het venster plakken.',
  'help.guide.write-note.tip.4':
    "Notities heeft een eigen schakelaar onder Add-ons, onder Samenwerking: een beheerder kan Notities uitzetten en de chat, de links, de polls en 'Wat nu' laten werken.",
  // shared-links
  'help.guide.shared-links.title': 'De links van de reis verzamelen',
  'help.guide.shared-links.goal':
    'Houd het boekingsportaal, het gedeelde album en de dienstregeling op één plek bij elkaar, zodat je er niet voor in de chat hoeft te zoeken.',
  'help.guide.shared-links.step.1':
    'Klik in de kop van de kaart Links op ‘Link toevoegen’. Het venster opent met de cursor in het bovenste veld.',
  'help.guide.shared-links.step.2':
    'Typ de naam bij Linktitel, plak het adres eronder bij Link en klik op ‘Link opslaan’.',
  'help.guide.shared-links.step.3':
    'Het label toont de naam en de website waar de link naartoe gaat. Klik erop om de pagina in een nieuw tabblad te openen.',
  'help.guide.shared-links.step.4':
    'De drie ronde knoppen aan het eind zijn ‘Link bewerken’, ‘Link vastmaken’ en ‘Link verwijderen’. ‘Link vastmaken’ zet het label vooraan in het paneel, in de accentkleur. ‘Link verwijderen’ vraagt eerst om bevestiging, want de link verdwijnt voor alle leden.',
  'help.guide.shared-links.result':
    'De link staat als chip vooraan vastgezet in het paneel Links, en verschijnt meteen op het scherm van elk lid.',
  'help.guide.shared-links.tip.1':
    'Alleen een http- of https-adres wordt geaccepteerd. Al het andere wordt geweigerd, en het venster blijft open met wat je hebt getypt.',
  'help.guide.shared-links.tip.2':
    'Vastgemaakte links staan eerst, daarna de nieuwste. Het kleine icoon naast een titel is de favicon van de site zelf, die van de site wordt geladen. Zonder internet toont de chip daarom een gewoon linkicoon.',
  'help.guide.shared-links.tip.3':
    'Links heeft een eigen schakelaar onder Add-ons, onder Samenwerking. Een beheerder kan het paneel dus uitzetten zonder de rest van het tabblad aan te raken.',
  // create-poll
  'help.guide.create-poll.title': 'De groep iets vragen',
  'help.guide.create-poll.goal':
    'Maak van een vraag waarop niemand in de chat antwoordt een poll waarop iedereen kan stemmen.',
  'help.guide.create-poll.step.1': 'Klik in de kop van de kaart Polls op ‘Nieuwe poll’. Het venster opent.',
  'help.guide.create-poll.step.2':
    "Schrijf de vraag onder Vraag. 'Markdown wordt ondersteund' onder het vak betekent dat je hier vetgedrukte tekst, een nieuwe regel of een korte lijst kunt gebruiken.",
  'help.guide.create-poll.step.3':
    "Vul onder Opties 'Optie 1' en 'Optie 2' in. Je hebt minstens twee ingevulde opties nodig, en een optie mag uit meerdere regels bestaan.",
  'help.guide.create-poll.step.4':
    "Met 'Optie toevoegen' eronder voeg je een derde optie toe, een vierde, zoveel als je nodig hebt. Met het kruisje naast een rij, dat verschijnt zodra je meer dan twee opties hebt, verwijder je die optie.",
  'help.guide.create-poll.step.5':
    'Met Meerkeuze kan iedereen meer dan één optie aanvinken. Staat het uit, dan verhuist iemands stem naar de nieuwe optie als die persoon iets anders kiest.',
  'help.guide.create-poll.step.6': 'Klik op ‘Poll aanmaken’.',
  'help.guide.create-poll.result': 'De poll staat bovenaan het paneel Polls, geopend, met 0 stemmen in de kop.',
  'help.guide.create-poll.tip.1': 'De vraag wordt als Markdown weergegeven, de opties blijven gewone tekst.',
  'help.guide.create-poll.tip.2': "'Poll aanmaken' blijft grijs tot er een vraag is en minstens twee ingevulde opties.",
  'help.guide.create-poll.tip.3':
    'Een deadline kun je alleen in de telefoonapp instellen. Bij een poll met een deadline staat de resterende tijd in een oranje chip in de kop, en de poll sluit zodra de tijd om is.',
  'help.guide.create-poll.tip.4':
    'Polls heeft een eigen schakelaar onder Add-ons, onder Samenwerking: een beheerder kan polls uitzetten en de andere vier panelen aan laten.',
  // vote-poll
  'help.guide.vote-poll.title': 'Stemmen en de uitslag bekijken',
  'help.guide.vote-poll.goal': 'Stem, bekijk de uitslag van de groep en pas je stem aan.',
  'help.guide.vote-poll.step.1':
    'Klik op de optie die je wilt. In het rondje verschijnt een vinkje, de optie krijgt een kader in de accentkleur en de balk erachter groeit.',
  'help.guide.vote-poll.step.2':
    'Nu zie je de hele uitslag: de balk toont het aandeel, het percentage staat rechts, en de kleine rondjes zijn de mensen die voor die optie kozen, maximaal drie.',
  'help.guide.vote-poll.step.3':
    'Toch iets anders? Klik op een andere optie. Bij een poll zonder Meerkeuze gaat je stem naar de nieuwe optie, in plaats van dat er een tweede stem bij komt.',
  'help.guide.vote-poll.step.4':
    'Het aantal stemmen staat in een chip onder de vraag. Klik je op de optie die je al had gekozen, dan trek je je stem in en daalt het aantal.',
  'help.guide.vote-poll.result':
    'Je optie is aangevinkt, de balken tonen hoe de groep heeft gestemd, en de rondjes laten zien wie welke optie heeft gekozen.',
  'help.guide.vote-poll.tip.1':
    'De percentages en wie waarop heeft gestemd, zie je pas als je zelf hebt gestemd of als de poll gesloten is. Het aantal stemmen in de kop ziet iedereen.',
  'help.guide.vote-poll.tip.2':
    'Stemmen is nooit anoniem: beweeg de muis over een van de rondjes bij een optie om te zien wie er heeft gestemd.',
  // close-poll
  'help.guide.close-poll.title': 'Een poll sluiten of verwijderen',
  'help.guide.close-poll.goal':
    'Stop de stemming zodra de groep heeft besloten, en verwijder een poll die niemand meer nodig heeft.',
  'help.guide.close-poll.step.1':
    'Met Sluiten, het slotje rechts in de kop van een poll, beëindig je de stemming. Op de opties klikken kan dan niet meer.',
  'help.guide.close-poll.step.2':
    'Een gesloten poll gaat naar onderaan het paneel, onder de kop ‘Gesloten’ als er open polls boven staan. Hij heeft een chip ‘Gesloten’ en toont iedereen de uitslag, of ze nu hebben gestemd of niet. De winnende optie staat vetgedrukt op een groene balk; heb jij die optie gekozen, dan heeft de balk in plaats daarvan je accentkleur.',
  'help.guide.close-poll.step.3':
    'Met Verwijderen, de prullenbak rechts in de kop, verwijder je de poll. Bij een gesloten poll is dat de enige knop, want het slotje is weg. Er wordt niet om bevestiging gevraagd, en de stemmen worden ook verwijderd.',
  'help.guide.close-poll.result':
    'Een verwijderde poll verdwijnt uit het paneel van elk lid. Een poll die je alleen hebt gesloten, blijft onderaan zichtbaar, met de uitslag.',
  'help.guide.close-poll.tip.1':
    'Sluiten kun je niet ongedaan maken: heropenen kan niet. Heb je een poll per ongeluk gesloten, dan moet je de vraag opnieuw stellen.',
  'help.guide.close-poll.tip.2':
    'Verwijderen wist de poll en alle stemmen voor iedereen, meteen en zonder bevestiging.',
  // whats-next
  'help.guide.whats-next.title': '‘Wat komt er’ bekijken',
  'help.guide.whats-next.goal': 'Zie wat de groep straks gaat doen, zonder de planning te openen.',
  'help.guide.whats-next.step.1':
    'De kaart toont de komende stops van de reis, maximaal acht, op tijdsvolgorde, met een kopje per dag: Vandaag, Morgen of de datum, met de titel van de dag ernaast als die er is. In de kop staat hoeveel het er zijn.',
  'help.guide.whats-next.step.2':
    "Links van elke stop staat de tijd: het begin, 'tot' en het einde als de stop dat heeft, of TBD als er nog geen tijd is ingesteld.",
  'help.guide.whats-next.step.3':
    'Daarnaast staan de naam, het adres en, als chips, de mensen bij die stop. Is er niemand aan de stop toegewezen, dan staat iedereen van de reis erbij.',
  'help.guide.whats-next.result':
    'Een lijst van wat er komt, alleen om te lezen: hij volgt de planning, en hier verander je niets aan.',
  'help.guide.whats-next.tip.1':
    'Hier stel je niets in. De tijden komen uit het dagplan. Wijzig je ze daar, dan wordt deze lijst meteen bijgewerkt.',
  'help.guide.whats-next.tip.2':
    'Je ziet alleen wat nog moet komen: een stop verdwijnt uit de lijst zodra de begintijd voorbij is, een stop van vandaag zonder tijd blijft staan tot de dag voorbij is, en aan het einde van de reis is het paneel leeg.',
  'help.guide.whats-next.tip.3':
    '‘Wat komt er’ heeft een eigen schakelaar onder Add-ons, onder Samenwerking. Het is een paneel voor de computer: op het tabblad Samenwerking van de telefoonapp zie je het niet.',
  // trip-chat
  'help.guide.trip-chat.title': 'Met de groep chatten',
  'help.guide.trip-chat.goal':
    'Stuur een bericht, beantwoord een bepaald bericht, reageer op een ander bericht en verwijder je eigen bericht.',
  'help.guide.trip-chat.step.1':
    "Schrijf in 'Typ een bericht...' en druk op Enter. De ronde pijl naast het veld doet hetzelfde. Met Shift en Enter begin je in plaats daarvan een nieuwe regel.",
  'help.guide.trip-chat.step.2':
    'De smiley opent de emojikiezer, met Smileys, Reactions en Travel. De emoji die je kiest, wordt toegevoegd aan de tekst die je aan het schrijven bent. Hij wordt niet los verstuurd.',
  'help.guide.trip-chat.step.3':
    'Beweeg de muis over een bericht van iemand anders: in de hoek verschijnt een klein rond knopje. Dat is Beantwoorden.',
  'help.guide.trip-chat.step.4':
    'Het bericht waarop je reageert, staat als citaat boven het invoerveld. Schrijf en verstuur je bericht, en het citaat gaat mee. Klik op het kruisje bij het citaat om het weg te halen.',
  'help.guide.trip-chat.step.5':
    'Klik met de rechtermuisknop op een bericht om de acht snelle reacties te zien. Je reactie verschijnt onder het bericht. Klik nog een keer op dezelfde reactie om hem weg te halen.',
  'help.guide.trip-chat.step.6':
    'Bij je eigen berichten staat naast Beantwoorden ook Verwijderen, het prullenbakpictogram. Daarmee verwijder je het bericht meteen, en er verschijnt een melding dat jij het hebt verwijderd. Dit kun je niet ongedaan maken.',
  'help.guide.trip-chat.result':
    'Je antwoord is het nieuwste bericht, met het geciteerde bericht erboven. Je reactie staat onder het andere bericht. Op de plek van het bericht dat je hebt verwijderd, staat dat jij het hebt verwijderd.',
  'help.guide.trip-chat.tip.1':
    'Enter verstuurt, Shift en Enter beginnen een nieuwe regel. Een bericht met alleen een tot drie emoji wordt groot getoond.',
  'help.guide.trip-chat.tip.2':
    "Met 'Afbeeldingen toevoegen' voeg je maximaal vier afbeeldingen toe aan één bericht. Je kunt ze ook plakken of naar het invoerveld slepen.",
  'help.guide.trip-chat.tip.3':
    'Onder een bericht met een link verschijnt een voorbeeldkaart, opgehaald door je eigen TREK. Een link naar iets wat alleen jij kunt bereiken, blijft dus een gewone link.',
  'help.guide.trip-chat.tip.4':
    'Chat heeft een eigen schakelaar onder Add-ons, onder Samenwerking: een beheerder kan de chat uitzetten en de notities, links, polls en ‘Wat komt er’ laten aanstaan.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Lijsten',
  'help.ctx.trip-lists.summary':
    'Twee lijsten voor één reis: de inpaklijst, met wie wat meeneemt en hoeveel het weegt, en de takenlijst met alles wat vóór en tijdens de reis moet gebeuren. Het tabblad is zichtbaar zolang de add-on Lijsten aan staat.',
  'help.ctx.trip-lists.bullet.1':
    'Met Inpaklijst en Taken in de balk bovenaan wissel je tussen de twee, en je ziet hoeveel er op elke lijst staat. De knoppen rechts in de balk horen bij de lijst die open is.',
  'help.ctx.trip-lists.bullet.2':
    'De inpaklijst is ingedeeld in lijsten, bijvoorbeeld Documenten of Kleding, met elke naam die je wilt. Elke lijst is een kaart. In de kop zitten een greep om de hele lijst naar een andere plek te slepen, een kleurstip, een badge met ingepakt van totaal, drie puntjes met ‘Hernoemen’, ‘Alles aanvinken’, ‘Alles uitvinken’ en ‘Lijst verwijderen’, en een pijl om de kaart in te klappen. Met ‘Lijst toevoegen’ in de balk erboven maak je een nieuwe.',
  'help.ctx.trip-lists.bullet.3':
    'Een rij heeft een sleepgreep, een selectievakje en een naam, en daarna een kleine avatar van wie het item meeneemt. Een item met een aantal hoger dan één krijgt ook een ingepakt-teller, zoals 3/10, met een min en een plus. Dan volgen het aantal als kleine badge en, zolang ‘Bagagetracking’ aanstaat, het gewicht in grammen en een tascirkel, en daarna de prullenbak en een menu met drie puntjes met ‘Naar lijst verplaatsen’, ‘Wordt gedeeld’, ‘Hernoemen’ en ‘Verwijderen’. Knoppen die een rij niet gebruikt, zijn gedimd tot je er met de muis overheen gaat.',
  'help.ctx.trip-lists.bullet.4':
    '‘Gedeeld’ en ‘Mijn lijst’ verdelen de inpaklijst in tweeën: de lijst die iedereen ziet, en je eigen lijst. Met Alle, Openstaand en Klaar ernaast filter je de lijst die open is. ‘A tot Z’ helemaal aan het eind van de rij zet de items van elke lijst op naam, en met een tweede klik ga je terug naar je eigen volgorde. De voortgangskaart erboven telt wat is ingepakt.',
  'help.ctx.trip-lists.bullet.5':
    'Met ‘Sjabloon toepassen’ en ‘Opslaan als sjabloon’ vul je een lijst of sla je hem op, zodat je niets hoeft te typen. Met de twee pictogrammen daarna, Exporteren en Importeren, exporteer je de lijst als afdruk, PDF of bestand, of importeer je een lijst. De rode knop rechts op de voortgangskaart toont hoeveel items zijn afgevinkt en verwijdert ze.',
  'help.ctx.trip-lists.bullet.6':
    'Taken heeft een eigen zijbalk: de voortgangskaart, de filters Alle, ‘Mijn taken’, Verlopen en Klaar, een rij per lijst en daaronder ‘Lijst toevoegen’. De taken staan op een kaart. In de kop daarvan zie je de naam van het filter en de sortering, Prioriteit of Vervaldatum. Klik op een taak om die in het paneel rechts te openen. ‘Nieuwe taak’ in de balk opent het venster ‘Nieuwe taak’.',
  // packing-categories
  'help.guide.packing-categories.title': 'De inpaklijst samenstellen',
  'help.guide.packing-categories.goal':
    'Verdeel wat je meeneemt over lijsten, voeg er items aan toe en kies wie verantwoordelijk is voor welke lijst.',
  'help.guide.packing-categories.step.1':
    "Klik in de balk boven de lijsten op 'Lijst toevoegen'. Er opent een klein venster. Typ de naam bovenin, waar 'Lijstnaam (bijv. Kleding)' staat, en klik op Toevoegen.",
  'help.guide.packing-categories.step.2':
    "De nieuwe lijst begint met een tijdelijke rij met alleen drie lichte puntjes. Klik onderaan de rij op 'Item toevoegen', typ het item in 'Itemnaam...' en druk op Enter: het eerste item vervangt de tijdelijke rij, en het veld blijft open voor het volgende item.",
  'help.guide.packing-categories.step.3':
    'Geef een rij een andere naam door op de naam te klikken, of via Hernoemen in het menu met de drie puntjes rechts.',
  'help.guide.packing-categories.step.4':
    'Met het gestippelde rondje met een poppetje in de bovenste strook van de lijst wijs je reisgenoten aan de lijst toe. Kies een naam. Wil je die persoon weer verwijderen, klik dan op het label dat verschijnt.',
  'help.guide.packing-categories.step.5':
    'Via de drie puntjes naast de teller vind je meer opties: Hernoemen, ‘Alles aanvinken’, ‘Alles uitvinken’ en ‘Lijst verwijderen’. ‘Lijst verwijderen’ wist de lijst met alle items zonder nog iets te vragen. Met het pijltje helemaal rechts klap je de lijst in.',
  'help.guide.packing-categories.result':
    'De nieuwe lijst staat in het raster, met de items eronder en een gekleurde stip, en het label telt wat al is ingepakt.',
  'help.guide.packing-categories.tip.1':
    'Een lijst bestaat alleen door zijn items. Verwijder je het laatste item, dan wordt de rij een tijdelijke plaatshouder, zodat de lijst zijn plek en kleur houdt; verwijder je ook die rij, dan is de lijst verwijderd.',
  'help.guide.packing-categories.tip.2':
    "Wijs je iemand toe aan een lijst, dan krijgt die persoon een inpakmelding. Dat verandert niets aan wie de items kan zien. Dat stel je in onder 'Wordt gedeeld', in het menu met de drie puntjes van een rij.",
  'help.guide.packing-categories.tip.3':
    'Twee lijsten mogen dezelfde naam hebben. TREK houdt ze intern uit elkaar, zodat de namen blijven zoals je ze hebt getypt.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Afvinken tijdens het inpakken',
  'help.guide.check-off-packing.goal':
    'Vink af wat in je tas zit, volg de voortgangsbalk en verwijder de ingepakte items.',
  'help.guide.check-off-packing.step.1':
    'Klik op het vakje links in een rij. De naam wordt doorgestreept en de voortgangsbalk wordt bijgewerkt.',
  'help.guide.check-off-packing.step.2':
    'De voortgangskaart boven de lijsten laat zien hoeveel van alle items op de lijst zijn ingepakt, als aantal, als percentage en als balk.',
  'help.guide.check-off-packing.step.3':
    "Een hele lijst in één keer afvinken? Onder de drie puntjes in de kop staan 'Alles aanvinken' en 'Alles uitvinken'.",
  'help.guide.check-off-packing.step.4':
    "Met Alle, Openstaand en Klaar naast Gedeeld en 'Mijn lijst' filter je het overzicht. Openstaand toont alleen wat nog ontbreekt, dus een lijst die helemaal is ingepakt, wordt verborgen.",
  'help.guide.check-off-packing.step.5':
    'De rode knop ‘Verwijder … aangevinkt’ helemaal rechts op de voortgangskaart, met het aantal aangevinkte items erin, verwijdert ze allemaal tegelijk na één bevestiging in de browser.',
  'help.guide.check-off-packing.result':
    'Alleen openstaande items worden getoond, en de balk erboven laat zien hoeveel er al is ingepakt.',
  'help.guide.check-off-packing.tip.1': 'Ook een afgevinkt item kun je nog hernoemen: klik op de naam.',
  'help.guide.check-off-packing.tip.2':
    '‘Alles aanvinken’ en ‘Alles uitvinken’ werken per lijst, via de drie puntjes van die lijst.',
  'help.guide.check-off-packing.tip.3':
    'Is alles aangevinkt, dan wordt de teller vervangen door ‘Alles ingepakt!’ en wordt de balk groen.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Een paksjabloon toepassen',
  'help.guide.apply-packing-template.goal':
    'Voeg een kant-en-klare lijst toe aan de reis, en bewaar de lijst van deze reis voor de volgende.',
  'help.guide.apply-packing-template.step.1': "Klik in de balk boven de lijst op 'Sjabloon toepassen'.",
  'help.guide.apply-packing-template.step.2':
    'Kies een sjabloon. Bij elke regel zie je de naam en hoeveel items het sjabloon bevat.',
  'help.guide.apply-packing-template.step.3':
    'De items komen in de weergave waarin je zit: bij Gedeeld komen ze op de gedeelde lijst die iedereen ziet, bij ‘Mijn lijst’ op je eigen lijst.',
  'help.guide.apply-packing-template.step.4':
    'Wil je de lijst van deze reis bewaren voor de volgende, klik dan op ‘Opslaan als sjabloon’. Er opent een klein venster. Typ een naam in het bovenste veld, waar Sjabloonnaam staat, en klik op Opslaan.',
  'help.guide.apply-packing-template.result':
    'De lijsten en items van het sjabloon worden aan de reis toegevoegd, naast wat er al stond.',
  'help.guide.apply-packing-template.tip.1':
    'Een sjabloon kopieert van elk item de lijst, het aantal, het gewicht en de tas, en maakt een tas aan die nog niet in de reis bestaat. Vinkjes worden niet gekopieerd, en er wordt niets verwijderd wat al op de lijst staat.',
  'help.guide.apply-packing-template.tip.2':
    '‘Sjabloon toepassen’ is er pas als er een sjabloon bestaat. Zonder sjabloon verschijnt de knop helemaal niet.',
  'help.guide.apply-packing-template.tip.3':
    "'Opslaan als sjabloon' zie je alleen als beheerder van de instantie, en alleen zolang de lijst items bevat. Het slaat de gedeelde items en je eigen items op, maar nooit de privé-items van een ander lid.",
  // import-packing-list
  'help.guide.import-packing-list.title': 'Een hele inpaklijst plakken',
  'help.guide.import-packing-list.goal': 'Zet een lijst die je al ergens anders hebt in één keer om in inpakitems.',
  'help.guide.import-packing-list.step.1':
    'Klik op Importeren, het pictogram met de pijl omlaag rechts in de balk boven de lijst.',
  'help.guide.import-packing-list.step.2':
    'Eén item per regel: Categorie, Naam, Gewicht in g (optioneel), Bagage (optioneel), checked/unchecked (optioneel). Het grijze voorbeeld in het vak toont alle vier de notaties, en de nummers aan de linkerkant tellen de regels die je typt. Een Markdown-lijst werkt ook: een kop wordt de naam van de lijst, en "- [ ]" en "- [x]" worden items.',
  'help.guide.import-packing-list.step.3':
    'Of laad de regels uit een bestand met ‘CSV/TXT/MD laden’, linksonder in het venster. Dat werkt met een .csv-, .txt- of .md-bestand en vervangt wat er in het vak staat.',
  'help.guide.import-packing-list.step.4':
    'Klik rechtsonder op ‘3 importeren’. Het getal geeft aan hoeveel regels TREK heeft begrepen.',
  'help.guide.import-packing-list.result':
    'Elke regel wordt een rij, in de lijst die in het eerste veld staat. Items die er al waren, blijven ongewijzigd.',
  'help.guide.import-packing-list.tip.1':
    'Komma\'s, puntkomma\'s en tabs scheiden allemaal velden, en dubbele aanhalingstekens houden een veld bij elkaar, zodat "Shirt, blauw" één naam blijft. Een regel met maar één waarde is gewoon een naam. Een regel zonder eigen lijst komt in Overig terecht. Met "3x" voor een naam stel je het aantal in.',
  'help.guide.import-packing-list.tip.2':
    'Heeft de reis de tas uit het vierde veld nog niet, dan maakt TREK die aan. ‘Importeren’ en ‘Sjabloon toepassen’ zijn de twee manieren om voor veel items tegelijk gewichten en tassen toe te voegen.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'De inpaklijst afdrukken of exporteren',
  'help.guide.export-packing-list.goal':
    'Druk de lijst af, sla hem op als PDF of exporteer hem als bestand voor een andere app of je volgende reis.',
  'help.guide.export-packing-list.step.1':
    'Klik op Exporteren, het pictogram met de pijl omhoog in de balk boven de lijst, vlak voor Importeren.',
  'help.guide.export-packing-list.step.2':
    'Met ‘Markdown-checklist (.md)’ en ‘CSV voor import (.csv)’ sla je de lijst meteen op als bestand.',
  'help.guide.export-packing-list.step.3':
    'Klik op ‘Afdrukken of opslaan als pdf’. Het voorbeeld toont de lijst als pagina: bovenaan de reis, de data en hoeveel er al is ingepakt, daarna elke lijst als kaart, met bij elk item een vakje om af te vinken.',
  'help.guide.export-packing-list.step.4':
    "Klik onder het voorbeeld op 'Afdrukken of opslaan als pdf'. De browser opent het afdrukvenster: kies een printer, of 'Opslaan als PDF' om een bestand op te slaan.",
  'help.guide.export-packing-list.result':
    "De afdruk en de bestanden bevatten de weergave die open is, Gedeeld of 'Mijn lijst', met de aantallen, gewichten en vinkjes.",
  'help.guide.export-packing-list.tip.1':
    'De CSV is het formaat dat Importeren leest, inclusief tassen, dus je kunt hem gebruiken als je eigen inpaksjabloon: importeer hem in je volgende reis.',
  'help.guide.export-packing-list.tip.2':
    'Het Markdown-bestand opent als checklist in Obsidian, Notion of GitHub, en je kunt het met Importeren ook weer inlezen.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Bepalen wie een item ziet en wie het meeneemt',
  'help.guide.share-packing-item.goal':
    'Verplaats een item tussen de gedeelde lijst van de groep, je eigen lijst en de mensen voor wie je het meeneemt.',
  'help.guide.share-packing-item.step.1':
    'Boven de lijsten is Gedeeld de lijst die iedereen ziet en ‘Mijn lijst’ je eigen lijst. Bij allebei staat hoeveel items erop staan. Klik op ‘Mijn lijst’ om je eigen lijst te zien.',
  'help.guide.share-packing-item.step.2':
    "Ga terug naar Gedeeld, open de drie puntjes aan het eind van een rij en klik op 'Wordt gedeeld'.",
  'help.guide.share-packing-item.step.3':
    "Er zijn drie niveaus: Gedeeld, zichtbaar voor iedereen in de groep; Persoonlijk, alleen zichtbaar voor jou; en 'Delen met…', waar je kiest voor wie het item is.",
  'help.guide.share-packing-item.step.4':
    "Een Persoonlijk item staat alleen op 'Mijn lijst'. Ga naar 'Mijn lijst' om het te vinden.",
  'help.guide.share-packing-item.step.5':
    'Open Delen opnieuw en vink onder ‘Delen met…’ een naam aan. Het item staat dan ook op de lijst van die persoon, en de rij krijgt een klein label met het aantal mensen met wie het gedeeld is.',
  'help.guide.share-packing-item.result':
    'Het item staat op het niveau dat je hebt gekozen, en op de rij zie je wie het meeneemt.',
  'help.guide.share-packing-item.tip.1':
    'Alleen wie een item meeneemt, kan het delen ervan wijzigen. Iemand met wie je het hebt gedeeld, ziet het op zijn eigen ‘Mijn lijst’ met een klein handje als label. Beweegt diegene de muis erover, dan verschijnt jouw naam. Diegene kan het item afvinken.',
  'help.guide.share-packing-item.tip.2':
    'Bij een gedeeld item dat iemand anders meeneemt, staan in het menu met de drie puntjes twee andere opties in plaats van Delen: ‘Ik kan het ook meenemen’, waarmee je jezelf ernaast zet, en ‘Kopiëren naar mijn lijst’, waarmee je een eigen kopie maakt.',
  'help.guide.share-packing-item.tip.3':
    'Nieuwe items krijgen hun deelinstelling van de weergave waarin je ze toevoegt. Items die je in ‘Gedeeld’ toevoegt, worden met iedereen gedeeld. Items die je in ‘Mijn lijst’ toevoegt, zijn ‘Persoonlijk’, tenzij elk item van die lijst met dezelfde mensen is gedeeld: dan wordt het nieuwe item ook met hen gedeeld.',
  // packing-bags
  'help.guide.packing-bags.title': 'De tassen wegen',
  'help.guide.packing-bags.goal':
    'Geef elk item een gewicht, verdeel de items over tassen en houd elke tas onder de limiet van de luchtvaartmaatschappij.',
  'help.guide.packing-bags.step.1':
    'Klik op de gewichtsbadge vóór het rondje en typ het gewicht van het item in grammen.',
  'help.guide.packing-bags.step.2': 'Het rondje na het gewicht is de tas van het item. Klik erop.',
  'help.guide.packing-bags.step.3':
    'Is er nog geen tas, klik dan op ‘Bagage toevoegen’, typ een naam en druk op Enter. De tas wordt aangemaakt en het item komt erin.',
  'help.guide.packing-bags.step.4':
    'De kaart ‘Bagage’ verschijnt rechts van de lijsten zodra er een tas is. Elke tas toont de naam, wie hem draagt, een vulbalk, hoeveel items erin zitten en het gewicht. Onder de tassen staan ‘Niet toegewezen’ en ‘Totaalgewicht’, met daaronder ‘Ingepakt’: het gewicht dat al is ingepakt, met een dun balkje voor dat aandeel.',
  'help.guide.packing-bags.step.5':
    'Klik naast het gewicht van de tas op ‘Limiet instellen’ en typ de limiet in kilo, zoals luchtvaartmaatschappijen die opgeven.',
  'help.guide.packing-bags.step.6':
    'De gestippelde plus aan het eind van de regel met de naam van de tas, vlak voor het kruisje, opent ‘Leden toewijzen’. Vink de leden aan die de tas dragen: ze verschijnen naast de plus, en ‘Per persoon’ onderaan de kaart toont wat ieder van hen draagt.',
  'help.guide.packing-bags.result':
    'De kaart Bagage rechts toont per tas het gewicht ten opzichte van de limiet, wat in geen enkele tas zit, wat ieder draagt, en het totaal met hoeveel daarvan al is ingepakt.',
  'help.guide.packing-bags.tip.1':
    'Het gewichtsveld, het tasrondje en de kaart Bagage zijn er alleen zolang een beheerder Bagagetracking heeft aangezet onder de add-on Lijsten. In een smaller venster open je de tassen in plaats daarvan met de knop Bagage boven de voortgangskaart.',
  'help.guide.packing-bags.tip.2':
    'De server berekent het gewicht van een tas op basis van de items van alle leden, ook die je zelf niet ziet. Het getal is dus wat de tas echt weegt.',
  'help.guide.packing-bags.tip.3':
    'Een tas zonder limiet wordt vergeleken met de zwaarste tas, zodat je de balken naast elkaar kunt leggen. Geef je de tas een limiet, dan wordt de balk aan die limiet afgemeten.',
  // create-todo
  'help.guide.create-todo.title': 'Een taak toevoegen',
  'help.guide.create-todo.goal':
    'Noteer een taak, met een lijst, een prioriteit, een datum en iemand die hem uitvoert.',
  'help.guide.create-todo.step.1': 'Klik rechts in de balk op ‘Nieuwe taak’.',
  'help.guide.create-todo.step.2':
    'Het venster ‘Nieuwe taak’ opent met de cursor bovenaan. Typ de naam in het veld Taaknaam, en zet alles wat je wilt onthouden bij Beschrijving.',
  'help.guide.create-todo.step.3':
    'Lijst groepeert de taak. Kies een lijst, of maak met het plusje ernaast in een klein venster een nieuwe aan.',
  'help.guide.create-todo.step.4': 'Prioriteit heeft vier knoppen: Geen, P1, P2 en P3, van rood naar blauw.',
  'help.guide.create-todo.step.5':
    "Vervaldatum, naast Lijst, opent een kalender, en met 'Toegewezen aan' wijs je de taak toe aan iemand.",
  'help.guide.create-todo.step.6': "Klik op 'Taak aanmaken'.",
  'help.guide.create-todo.result':
    'De taak staat in de lijst, met de prioriteit, de deadline en de lijst als labels en aan het eind van de rij de avatar van degene aan wie hij is toegewezen. Hij opent in het paneel rechts.',
  'help.guide.create-todo.tip.1': 'Alleen de naam is verplicht. De rest kun je later invullen in het paneel rechts.',
  'help.guide.create-todo.tip.2': 'Heb je in de zijbalk een lijst geselecteerd, dan komt een nieuwe taak in die lijst.',
  'help.guide.create-todo.tip.3':
    'Druk je in het naamveld op Enter, dan wordt de taak meteen aangemaakt, zonder dat je de andere velden hoeft in te vullen.',
  // todo-filters
  'help.guide.todo-filters.title': 'Een taak vinden en wijzigen',
  'help.guide.todo-filters.goal': 'Toon alleen de taken die nu belangrijk zijn, en bewerk dan de taak die je zoekt.',
  'help.guide.todo-filters.step.1':
    "Taken in de zijbalk: Alle toont alles wat nog openstaat, 'Mijn taken' wat aan jou is toegewezen, Verlopen de taken met een datum in het verleden, en Klaar de afgeronde taken. Bij elk staat het aantal. Klik op Verlopen.",
  'help.guide.todo-filters.step.2':
    'Onder Lijsten staat per lijst een rij. Kies er een om die lijst te tonen, inclusief afgeronde taken.',
  'help.guide.todo-filters.step.3':
    'Met de sortering boven aan de lijst verander je de volgorde van wat je ziet: Prioriteit zet P1 bovenaan, Vervaldatum de eerstvolgende deadline. Je kunt maar één van de twee tegelijk gebruiken, en met een tweede klik ga je terug naar je eigen volgorde.',
  'help.guide.todo-filters.step.4': 'Klik op een taak om hem in het paneel rechts te openen.',
  'help.guide.todo-filters.step.5':
    'Pas aan wat je wilt: de naam, Prioriteit, Lijst, Vervaldatum of ‘Toegewezen aan’. Bij Beschrijving zie je de tekst met klikbare links. Klik erin om te bewerken. Klik daarna onderaan het paneel op ‘Wijzigingen opslaan’. Met het vakje bovenaan het paneel vink je de taak af, en met ‘Verwijderen’ naast ‘Wijzigingen opslaan’ verwijder je hem meteen.',
  'help.guide.todo-filters.result':
    'De lijst toont alleen de taken die je wilt zien, en in het paneel rechts bewerk je de taak die je hebt gekozen.',
  'help.guide.todo-filters.tip.1':
    "Een lijstrij telt alleen de openstaande taken, maar selecteer je de lijst, dan zie je ook de afgeronde taken. Alle, 'Mijn taken' en Verlopen verbergen afgeronde taken; Klaar toont alleen afgeronde taken.",
  'help.guide.todo-filters.tip.2':
    'Prioriteit en Vervaldatum kun je in de sortering niet samen gebruiken. Zolang een van beide aan staat, kun je de rijen niet in je eigen volgorde slepen.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Boekingen',
  'help.ctx.trip-bookings.summary':
    'Op dit tabblad staat alles wat voor de reis is geboekt, behalve vervoer: accommodaties, tafels, tickets, rondleidingen en parkeren. Elke boeking is een kaart, een rij in de lijst of een balk op de tijdlijn, met code, documenten, reizigers en kosten. Klik op een boeking om de details te openen.',
  'help.ctx.trip-bookings.bullet.1':
    '‘Handmatige boeking’ rechts in de balk opent ‘Nieuwe reservering’. Daarmee maak je zes soorten boekingen: Accommodatie, Restaurant, Evenement, Rondleiding, Parkeren en Overig. Vluchten, treinen en ander vervoer staan op het tabblad Transport en komen hier nooit voor.',
  'help.ctx.trip-bookings.bullet.2':
    "Het downloadpictogram vóór ‘Handmatige boeking’, ‘Boekingsbevestigingen importeren’, uploadt bevestigingen zodat TREK ze automatisch kan uitlezen: EML, PDF, PKPass, HTML of TXT, maximaal vijf bestanden van 10 MB, en foto's als het AI-model afbeeldingen leest. Het pictogram is er alleen als de server ze kan lezen.",
  'help.ctx.trip-bookings.bullet.3':
    'Zoeken doorzoekt titels, typen, plekken, notities, boekingscodes en reizigers. Met Filteren, de trechter ernaast, beperk je het tabblad op Status, op Type (met een aantal per type) en op Reizigers, zodra er bij een boeking mensen zijn ingevuld. Een getal op de trechter laat zien hoeveel filters er actief zijn.',
  'help.ctx.trip-bookings.bullet.4':
    'De drie pictogrammen na ‘Filter’ wisselen de weergave: Kaarten, Lijst en Tijdlijn. ‘Weergaveopties’, de schuifjes ernaast, groepeert en sorteert de kaarten en de lijst, of stelt de banen van de tijdlijn in, en het spreadsheetpictogram daarna, ‘Exporteren als spreadsheet (CSV)’, downloadt wat het tabblad toont als bestand. Standaard zijn de kaarten gegroepeerd in ‘Bevestigd’ en ‘In behandeling’, en de lijst per dag. Klik op de kop van een sectie om die in te klappen.',
  'help.ctx.trip-bookings.bullet.5':
    "Een kaart heeft een kop in de kleur van de status, met de statusstip (klik erop om te wisselen tussen 'In behandeling' en Bevestigd), het type, de titel, het potlood en de prullenbak. Daaronder staan de gegevens die de boeking heeft: Datum, Tijd, Boekingscode, Inchecken en Uitchecken, 'Locatie / Adres', Accommodatie, 'Gekoppeld aan' (de stop in de planning), Link, Notities, Reizigers, Bestanden en de gekoppelde kosten.",
  'help.ctx.trip-bookings.bullet.6':
    'Een klik op een kaart, een rij of een balk opent de details van de boeking, met onderaan ‘Op kaart’ (als de boeking een plaats heeft), de prullenbak en ‘Bewerken’. Bij verwijderen wordt één keer om bevestiging gevraagd (‘Boeking verwijderen?’, met de melding of er ook kosten worden verwijderd). Daarna worden de boeking en de gekoppelde uitgaven verwijderd, en bij een accommodatie verdwijnen de nachten uit het dagplan.',
  // booking-views
  'help.guide.booking-views.title': 'De weergave wisselen en een boeking openen',
  'help.guide.booking-views.goal':
    'Bekijk de boekingen als kaarten, als lijst of op een tijdlijn, en open er een om alle details te zien.',
  'help.guide.booking-views.step.1':
    'De drie pictogrammen na Filteren in de balk zijn de weergaven. Als je ernaar wijst, zie je de naam: Kaarten, Lijst en Tijdlijn. Het tabblad opent in Kaarten, met een kaart per boeking in de secties Bevestigd en ‘In behandeling’. Klik op Lijst, het middelste pictogram.',
  'help.guide.booking-views.step.2':
    'Lijst toont per boeking een rij, onder een kop per dag, met de dag en de tijd rechts. Met de pijltjestoetsen ga je van rij naar rij. Klik op Tijdlijn, de laatste van de drie.',
  'help.guide.booking-views.step.3':
    'Tijdlijn toont de boekingen verspreid over de dagen van de reis: één baan per type en een balk van elk begin tot het einde. Een boeking in behandeling heeft een gestippelde rand. Met Reis past de hele reis in de breedte. Klik op de kop van een dag om die dag per uur te zien.',
  'help.guide.booking-views.step.4':
    '‘Dag’ toont één dag op een tijdlijn per uur, en de lengte van elke balk laat de duur zien. Met de pijlen naast de naam van de dag ga je naar de dag ervoor of erna. Tijdens de reis spring je met ‘Vandaag’ naar de huidige dag, en met de schakelaar Reis en Dag rechts ga je terug naar de hele reis.',
  'help.guide.booking-views.step.5':
    'Beweeg de muis over een balk om de dag, de tijden en de plek te zien, en klik erop om de details van de boeking te openen. Een kaart in Kaarten en een rij in Lijst openen hetzelfde venster.',
  'help.guide.booking-views.step.6':
    "In de kop van de detailweergave staan de titel en labels voor de status (klik erop om hem te wijzigen), het type, de dag en de boekingscode, met een knop om die te kopiëren. Daaronder staan de tijden als tegels, en daarna de plaats, de reizigers, notities, kosten en bestanden, voor zover de boeking die heeft. Helemaal onderaan staan 'Op kaart', de prullenbak en Bewerken.",
  'help.guide.booking-views.result':
    "De boeking opent in de detailweergave: Bewerken opent het formulier, 'Op kaart' toont de boeking in de planning, en met Sluiten of Escape ga je terug naar de weergave waar je vandaan kwam.",
  'help.guide.booking-views.tip.1':
    "Met Weergaveopties, het icoon met de schuifjes na de weergave-iconen, groepeer en sorteer je Kaarten en Lijst met 'Groeperen op' en 'Sorteren op'. In Tijdlijn vind je daar 'Eén baan per type' en 'Het andere tabblad tonen'. 'Het andere tabblad tonen' laat de items van het tabblad Transport gedimd zien in een smalle baan bovenaan. 'Weergave resetten' zet de standaard terug, en elk tabblad onthoudt zijn weergave in deze browser.",
  'help.guide.booking-views.tip.2':
    'Een boeking vóór of na de reis, of zonder datum, kan niet op de tijdlijn staan. Je vindt hem onder de grafiek als klein kaartje bij ‘Vóór de reis’, ‘Na de reis’ of ‘Geen datum’.',
  'help.guide.booking-views.tip.3':
    'Overal waar een boeking staat, opent hetzelfde detailvenster: op het tabblad Transport, in het Dagplan, in de details van een dag en in die van een plek. Klik op de titel om de boeking een andere naam te geven.',
  // create-booking
  'help.guide.create-booking.title': 'Een boeking aanmaken',
  'help.guide.create-booking.goal':
    'Zet zelf een restaurant, evenement, rondleiding, parkeerplaats of iets anders in de reis.',
  'help.guide.create-booking.step.1':
    "Klik rechts in de balk op 'Handmatige boeking'. 'Nieuwe reservering' gaat open, met bovenaan een kop met de titel en twee labels.",
  'help.guide.create-booking.step.2':
    'Klik op het typelabel in de balk bovenaan, waar bij een nieuwe boeking Overig staat, en kies het Boekingstype. Op dit tabblad maak je zes types aan: Accommodatie, Restaurant, Evenement, Rondleiding, Parkeren en Overig. Het formulier past zich aan je keuze aan: alleen Accommodatie werkt met een reeks dagen in plaats van data.',
  'help.guide.create-booking.step.3':
    'Typ de titel in de balk bovenaan, het veld boven de labels. Dat is het enige verplichte veld, en Toevoegen blijft grijs tot je iets invult.',
  'help.guide.create-booking.step.4':
    'Vul Datum en Starttijd in, en Einddatum en Eindtijd als de boeking een einde heeft. In de kalenders kun je alleen dagen binnen de reis kiezen. Ligt de einddatum en -tijd niet na de start, dan wordt die rood en kun je niet op ‘Toevoegen’ klikken. Een eindtijd vóór de starttijd zonder einddatum geeft alleen een waarschuwing: eindigt de boeking de volgende dag, vul dan een einddatum in.',
  'help.guide.create-booking.step.5':
    'Vul de Boekingscode uit de bevestiging in en klik dan op het statuslabel in de kop, naast het type. Bij een nieuwe boeking staat daar ‘In behandeling’, en na de klik Bevestigd. De status bepaalt in welke sectie de kaart komt te staan.',
  'help.guide.create-booking.step.6': 'Klik onder aan het formulier op Toevoegen.',
  'help.guide.create-booking.result':
    'De boeking verschijnt als kaart in de bijbehorende sectie. De kleur van de kop toont de status, en op de kaart staan het type, de datum, de tijden en de code. Iedereen in de reis ziet de boeking meteen.',
  'help.guide.create-booking.tip.1':
    'Bij ‘Locatie / Adres’ krijg je tijdens het typen echte adressen voorgesteld. Kies je er een, dan vervangt die wat je had getypt. Een adres dat je zelf typt, blijft zoals het is.',
  'help.guide.create-booking.tip.2':
    'Vul bij Link de pagina van de boeking bij de aanbieder in. Op de kaart en in de detailweergave wordt dat een link die in een nieuw tabblad opent.',
  'help.guide.create-booking.tip.3':
    'Notities ondersteunen Markdown, dus een lijst of een vetgedrukte regel zie je op de kaart en in de detailweergave ook als lijst of vetgedrukte tekst.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Een overnachting boeken',
  'help.guide.booking-hotel.goal':
    'Voer een accommodatie in, zodat die meteen meetelt als boeking en als nachten in het dagplan.',
  'help.guide.booking-hotel.step.1':
    'Klik op ‘Handmatige boeking’ en kies Accommodatie via het typelabel in de bovenste strook. De datumvelden worden vervangen door een blok met velden voor het hotel.',
  'help.guide.booking-hotel.step.2':
    'Kies het hotel onder ‘Accommodatie’. De lijst bevat de plaatsen van de reis, zonder geïmporteerde tracks en tochten. Kies je er een, dan komt de naam in een lege titel en het adres in ‘Locatie / Adres’.',
  'help.guide.booking-hotel.step.3':
    'Stel Van en Tot in: de eerste nacht en de ochtend waarop je vertrekt. Bij allebei kun je kiezen uit de dagen van de reis met hun data, en TREK zorgt dat Tot na Van blijft.',
  'help.guide.booking-hotel.step.4':
    'Vul Inchecken, ‘Check-in tot’ en Uitchecken in, en de Boekingscode uit de bevestiging.',
  'help.guide.booking-hotel.step.5': 'Klik op Toevoegen.',
  'help.guide.booking-hotel.result':
    'Op de kaart staan onder Datum de reeks dagen, de tijden van inchecken en uitchecken en het adres. Het verblijf staat nu ook op die dagen in de planning.',
  'help.guide.booking-hotel.tip.1':
    'Accommodatie is het enige type zonder Datum en Starttijd. De data zijn Van en Tot, en je kiest dagen van de reis, geen kalenderdata.',
  'help.guide.booking-hotel.tip.2':
    'Laat Accommodatie leeg en typ in plaats daarvan het adres: de plek wordt dan voor je opgezocht, aangemaakt en op de kaart gezet.',
  'help.guide.booking-hotel.tip.3': 'Verwijder je de boeking, dan verdwijnen ook de nachten uit het Dagplan.',
  // link-booking
  'help.guide.link-booking.title': 'Een boeking aan de planning koppelen',
  'help.guide.link-booking.goal':
    'Koppel een boeking aan de stop en de plek, zodat hij verschijnt waar je hem nodig hebt.',
  'help.guide.link-booking.step.1':
    "Ga met de muis over de kaart die je wilt koppelen en klik op het potlood in de kop. 'Reservering bewerken' gaat open.",
  'help.guide.link-booking.step.2':
    "Open 'Koppelen aan dagtoewijzing'. De lijst toont je planning: een kopje per dag, met daaronder de stops van die dag, genummerd en met hun tijden. Kies de stop waar de boeking bij hoort.",
  'help.guide.link-booking.step.3':
    "'Plaats / Activiteit' koppelt de plaats zelf. Kies hem daar, dan worden de titel en 'Locatie / Adres' ingevuld als die nog leeg zijn.",
  'help.guide.link-booking.step.4': 'Klik op Bijwerken.',
  'help.guide.link-booking.result':
    'De kaart toont de dag en de stop onder ‘Gekoppeld aan’, en de boeking verschijnt bij die stop in het Dagplan.',
  'help.guide.link-booking.tip.1':
    'Met ‘Geen koppeling (zelfstandig)’ bovenaan de lijst haal je de koppeling weer weg. Bij Accommodatie kies je geen stop: die is via de nachten gekoppeld.',
  'help.guide.link-booking.tip.2':
    'Kies je een stop op een dag met een datum, dan wordt een lege Datum voor je ingevuld. Een datum die je al had ingesteld, blijft ongewijzigd.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Aangeven voor wie een boeking is',
  'help.guide.booking-travelers.goal':
    'Geef aan voor welke reizigers een boeking is, en toon daarna alleen hun boekingen.',
  'help.guide.booking-travelers.step.1':
    "Open de boeking met het potlood op de kaart. Reizigers staat naast de Boekingscode. Zolang er niemand aan de boeking is toegewezen, staat er 'Reizigers toewijzen'.",
  'help.guide.booking-travelers.step.2':
    'Klik erop en kies voor wie deze boeking is. Ook gasten met een naam staan in de lijst. Wie je kiest, krijgt een vinkje en verschijnt met zijn avatar in het veld. Klik nog een keer op de naam om iemand weer te verwijderen.',
  'help.guide.booking-travelers.step.3': 'Klik op Bijwerken.',
  'help.guide.booking-travelers.step.4':
    'Klik in de balk op Filteren en klik onder Reizigers op een persoon om alleen diens boekingen te zien. Je kunt er meerdere tegelijk aanzetten.',
  'help.guide.booking-travelers.result':
    'Op de kaart staan de mensen voor wie de boeking is, en met Filteren toon je alleen de boekingen van de mensen die je kiest.',
  'help.guide.booking-travelers.tip.1':
    'Op de kaart en in de detailweergave zie je de reizigers alleen; daar kun je ze niet wijzigen. Dat doe je hier, in het formulier.',
  'help.guide.booking-travelers.tip.2':
    'Reizigers verschijnt in het filter zodra de reis meer dan één lid heeft en bij minstens één boeking iemand is opgegeven. Je keuze blijft bewaard tot je het browsertabblad sluit.',
  // booking-files
  'help.guide.booking-files.title': 'De voucher bij de boeking bewaren',
  'help.guide.booking-files.goal': 'Voeg de bevestiging, het ticket of de pas toe aan de boeking waar ze bij horen.',
  'help.guide.booking-files.step.1':
    'Open de boeking met het potlood op de kaart. Bestanden staat naast Koppelen. Klik daar op ‘Bestand bijvoegen’. Bij een bestaande boeking wordt het document meteen geüpload en meldt TREK ‘Bestand geüpload’.',
  'help.guide.booking-files.step.2':
    'Het document staat er met zijn naam, met een knop om het te openen en een X ernaast.',
  'help.guide.booking-files.step.3':
    '‘Bestaand bestand koppelen’ toont de documenten van de reis die nog niet aan deze boeking zijn gekoppeld. Kies er een en het wordt gekoppeld zonder dat je iets opnieuw hoeft te uploaden.',
  'help.guide.booking-files.step.4': 'Klik op Bijwerken.',
  'help.guide.booking-files.result':
    'De kaart en de detailweergave tonen de documenten onder ‘Bestanden’. Klik op een document om het te openen. ‘Tonen in bestanden’, boven de lijst in de detailweergave, brengt je naar het tabblad Bestanden.',
  'help.guide.booking-files.tip.1':
    'Bij een boeking die je nog aan het aanmaken bent, wordt het document geüpload zodra je op ‘Toevoegen’ klikt. Voor uploaden heb je een verbinding nodig.',
  'help.guide.booking-files.tip.2':
    'Met het kruisje naast een document verwijder je de koppeling, niet het document. Het document blijft in het tabblad Bestanden van de reis staan.',
  'help.guide.booking-files.tip.3':
    "De beheerder bepaalt onder 'Toegestane bestandstypen' welke bestandstypen je kunt bijvoegen. Documenten, tekst en afbeeldingen zijn standaard toegestaan.",
  // booking-cost
  'help.guide.booking-cost.title': 'De prijs van een boeking als kosten vastleggen',
  'help.guide.booking-cost.goal':
    'Zet de kosten van een boeking in Onkosten, verdeeld over de mensen die ervoor betalen.',
  'help.guide.booking-cost.step.1':
    'Open de boeking met het potlood op de kaart en ga naar onder in het formulier. Onder Kosten vind je ‘Kostenpost aanmaken’ en ‘Bestaande kostenpost koppelen’, met de opmerking ‘Boeking opslaan en daarna de Onkosteneditor openen’.',
  'help.guide.booking-cost.step.2':
    'Klik op ‘Kostenpost aanmaken’. De boeking wordt opgeslagen, het formulier sluit en de Onkosteneditor opent als ‘Uitgave toevoegen’.',
  'help.guide.booking-cost.step.3':
    'De naam in de kop is al de titel van de boeking, en ‘Dag’ is al de dag van de boeking. Vul het ‘Totaalbedrag’ in en controleer de ‘Valuta’ ernaast.',
  'help.guide.booking-cost.step.4':
    "Het label in de kop is de Categorie, al ingesteld op de categorie die bij het type boeking hoort. Kies onder 'Wie heeft betaald?' wie er heeft betaald, en kies onder Verdelen hoe het bedrag wordt verdeeld.",
  'help.guide.booking-cost.step.5': "Klik op 'Uitgave toevoegen'.",
  'help.guide.booking-cost.result':
    "Op de kaart staat onderaan het bedrag, in het formulier van de boeking staat de uitgave onder 'Gekoppelde kostenposten', en dezelfde uitgave staat in het tabblad Onkosten, gekoppeld aan deze boeking.",
  'help.guide.booking-cost.tip.1':
    'De categorie hangt af van het type: Restaurant wordt ‘Eten & drinken’, Accommodatie wordt Accommodatie, Parkeren wordt Parkeren, en Evenement en Rondleiding worden allebei Overig.',
  'help.guide.booking-cost.tip.2':
    'Een boeking kan meerdere kostenposten hebben. ‘Bestaande kostenpost koppelen’ toont de kostenposten in Onkosten die nog nergens aan gekoppeld zijn. Bij een gekoppelde kostenpost verbreekt ‘Ontkoppelen, kostenpost behouden’ de koppeling en blijft de kostenpost in Onkosten staan, terwijl je hem met de prullenbak verwijdert.',
  'help.guide.booking-cost.tip.3':
    'Kosten staat alleen in het formulier zolang de add-on Onkosten aanstaat. Die zet de beheerder aan onder Add-ons.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Een boeking zoeken',
  'help.guide.filter-bookings.goal': 'Filter een lang tabblad op een woord, een status, een type of een persoon.',
  'help.guide.filter-bookings.step.1':
    'Typ in Zoeken in de balk. Er wordt gezocht in titels, types, plaatsen en adressen, notities, boekingscodes en de namen van de reizigers, en terwijl je typt, worden er minder resultaten getoond. Met Escape maak je het veld leeg.',
  'help.guide.filter-bookings.step.2':
    'Klik op het filter, de trechter naast het zoekveld. Het paneel bevat Status, Type en, zodra er mensen aan een boeking zijn toegewezen, Reizigers.',
  'help.guide.filter-bookings.step.3':
    'Kies onder Status voor Bevestigd of ‘In behandeling’ om alleen die boekingen te zien. Alle toont ze allebei.',
  'help.guide.filter-bookings.step.4':
    'Klik onder Type op een of meer typen om alleen die te tonen. Bij elk type staat hoeveel boekingen het heeft, en een vinkje markeert de gekozen typen.',
  'help.guide.filter-bookings.step.5':
    'Een getal op Filteren laat zien hoeveel filters er aanstaan, en een label naast het zoekveld laat zien hoeveel van alle boekingen er overblijven. Klik op dat label of op ‘Filters resetten’ onder in het paneel om weer alles te zien.',
  'help.guide.filter-bookings.result':
    'Het tabblad toont alleen wat je hebt gekozen, in Kaarten, Lijst en Tijdlijn, en de filters blijven voor deze reis staan tot je het browsertabblad sluit.',
  'help.guide.filter-bookings.tip.1':
    'Type zie je alleen als het tabblad meer dan één type bevat, en dan staan alleen de types uit het tabblad erin. Staat er geen rondleiding in het tabblad, dan heeft Type ook geen optie Rondleiding.',
  'help.guide.filter-bookings.tip.2':
    "Voldoet niets aan het filter, dan staat in het tabblad 'Niets voldoet aan deze filters', met 'Filters resetten' er direct onder.",
  // import-booking-file
  'help.guide.import-booking-file.title': 'Een boeking importeren uit de bevestiging',
  'help.guide.import-booking-file.goal':
    'Laat TREK de boeking uitlezen uit de e-mail of de PDF van de aanbieder, zodat je hem niet opnieuw hoeft te typen.',
  'help.guide.import-booking-file.step.1':
    'Klik in de balk op het downloadpictogram, ‘Boekingsbevestigingen importeren’. De naam zie je als je de muis erover beweegt. Het venster met dezelfde naam opent.',
  'help.guide.import-booking-file.step.2':
    "Sleep de bevestigingen naar het vak, of klik erop en kies ze: EML, PDF, PKPass, HTML en TXT, maximaal vijf bestanden van elk 10 MB, en foto's (JPG, PNG, WEBP) als het AI-model afbeeldingen kan lezen. De bestanden die je hebt gekozen, staan met naam in het vak.",
  'help.guide.import-booking-file.step.3':
    'Klik op Importeren. Het venster sluit meteen, want het uitlezen gebeurt op de achtergrond.',
  'help.guide.import-booking-file.step.4':
    'Rechtsonder zie je op een kaart de voortgang onder de bestandsnaam. Die kaart blijft zichtbaar terwijl je door de app gaat, ook na het herladen. ‘Bestanden verwerken…’ verandert in een vinkje als het uitlezen klaar is, en op de kaart verschijnt Importeren. Klik erop.',
  'help.guide.import-booking-file.step.5':
    "Elke gevonden boeking opent een voor een in 'Nieuwe reservering', al ingevuld. Bij een hotel zijn dat de naam als titel en, als de plaats in de reis staat, onder Accommodatie: 'Locatie / Adres', Van en Tot op de nachten, Inchecken en Uitchecken, de Boekingscode, de bevestiging onder Bestanden en, als Onkosten aan staat, de prijs als 'Gekoppelde kostenpost'. Controleer alles en klik op Toevoegen.",
  'help.guide.import-booking-file.result':
    "De boeking staat als kaart onder 'In behandeling', met de overnachtingen, de code en de bevestiging onder Bestanden. Het verblijf staat op die dagen in de planning. Staat Onkosten aan, dan wordt de prijs toegevoegd als uitgave die aan de boeking is gekoppeld.",
  'help.guide.import-booking-file.tip.1':
    "Het importicoon verschijnt alleen als de server bevestigingen kan lezen. Daarvoor is de extractor of de add-on AI-verwerking nodig. De beheerder zet de add-on AI-verwerking aan onder Add-ons. Op een tabblad zonder boekingen staat dit ook als de knop 'Importeren vanuit bestand'.",
  'help.guide.import-booking-file.tip.2':
    'Kon er niets worden uitgelezen, dan zie je dat op de kaart. Staat AI-analyse aan, dan krijg je de optie ‘Uitlezen met AI proberen’, die dezelfde bestanden rechtstreeks naar het model stuurt. Een afgeronde analyse wordt tien minuten bewaard. Begin binnen die tijd met controleren.',
  'help.guide.import-booking-file.tip.3':
    'De bevestiging wordt alleen bijgevoegd als het bestandstype bij ‘Toegestane bestandstypen’ in de beheerinstellingen staat. PDF is standaard toegestaan. Een e-mail (EML) moet je eerst toevoegen, anders wordt de boeking zonder bevestiging opgeslagen.',
  // edit-booking
  'help.guide.edit-booking.title': 'Een boeking wijzigen',
  'help.guide.edit-booking.goal':
    'Corrigeer een tijd, voeg een code toe die later binnenkwam, of zet een boeking van ‘In behandeling’ op Bevestigd.',
  'help.guide.edit-booking.step.1':
    "Ga met de muis over de kaart en klik op het potlood in de kop. 'Reservering bewerken' gaat open met alle gegevens van de boeking.",
  'help.guide.edit-booking.step.2':
    'Wijzig wat nodig is, bijvoorbeeld de Boekingscode die de aanbieder later heeft gestuurd.',
  'help.guide.edit-booking.step.3':
    "Klik op het label 'In behandeling' in de balk bovenaan. Het verandert in Bevestigd en de balk wordt groen.",
  'help.guide.edit-booking.step.4': 'Klik op Bijwerken.',
  'help.guide.edit-booking.result':
    'De kaart verhuist: een bevestigde boeking staat in de sectie Bevestigd, met een groene stip en een groene bovenste strook, en iedereen in de reis ziet de kaart verplaatsen.',
  'help.guide.edit-booking.tip.1':
    'Kun je een Boekingscode niet lezen, dan staat ‘Boekingscodes vervagen’ aan in Instellingen, onder Weergave. Beweeg de muis over de code of klik erop om hem te lezen.',
  'help.guide.edit-booking.tip.2':
    'Wijzig je het type, dan verandert ook de categorie van een gekoppelde kostenpost mee, tenzij je in de Onkosteneditor zelf een categorie hebt gekozen.',
  'help.guide.edit-booking.tip.3':
    'Met Bewerken onderaan de detailweergave van een boeking open je hetzelfde formulier. De status kun je ook zonder formulier wijzigen: klik op de stip op een kaart of in een rij, of op het statuslabel in de detailweergave.',
  // delete-booking
  'help.guide.delete-booking.title': 'Een boeking verwijderen',
  'help.guide.delete-booking.goal': 'Verwijder een geannuleerde boeking uit de reis.',
  'help.guide.delete-booking.step.1':
    'Wijs de kaart aan en klik op de prullenbak in de kop. De prullenbak onder aan de details van een boeking doet hetzelfde.',
  'help.guide.delete-booking.step.2':
    '‘Boeking verwijderen?’ noemt de boeking die je hebt gekozen en meldt dat die definitief wordt verwijderd. Zijn er kosten aan gekoppeld, dan staat erbij dat die ook worden verwijderd.',
  'help.guide.delete-booking.step.3': 'Klik op Verwijderen.',
  'help.guide.delete-booking.result':
    'De kaart wordt voor iedereen in de reis verwijderd. Een verwijderde boeking kun je niet terughalen, dus de bevestigingsvraag is je laatste kans om te annuleren.',
  'help.guide.delete-booking.tip.1':
    'Verwijder je een boeking, dan worden ook de gekoppelde kostenposten verwijderd. Verwijder je een accommodatie, dan verdwijnen ook de nachten uit het dagplan.',
  'help.guide.delete-booking.tip.2':
    'Bijgevoegde documenten blijven in het tabblad Bestanden van de reis staan; alleen de koppeling met de boeking verdwijnt.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Onkosten',
  'help.ctx.trip-costs.summary':
    'De financiën van de reis: alle uitgaven in een overzicht per datum of in een tabel, wie ze heeft ingevoerd en wie ervoor moet betalen, in de valuta van de bon. In de rechterkolom zie je wie wie moet betalen om alles te verrekenen.',
  'help.ctx.trip-costs.bullet.1':
    'De balk bovenaan toont de data van de reis en de reizigers over wie de kosten worden verdeeld. Ook vind je er ‘Uitgaven zoeken…’, Filteren (de trechter), ‘CSV exporteren’ (het downloadpictogram) en de schakelaar Lijst / Tabel.',
  'help.ctx.trip-costs.bullet.2':
    'Rechts in de balk legt Afrekenen alle openstaande overboekingen in één keer vast, vult ‘Bon scannen’ een uitgave in op basis van een foto als de add-on AI-analyse afbeeldingen kan lezen, en opent ‘Uitgave toevoegen’ de editor.',
  'help.ctx.trip-costs.bullet.3':
    'Vier kaarten onder de balk: ‘Jij bent verschuldigd’ en ‘Jij krijgt nog’ zijn jouw kant van de verrekening, ‘Openstaand bedrag’ is wat is ingevoerd maar nog geen betaler heeft, en ‘Totale reisuitgaven’ telt alles op, met ‘Jouw aandeel’ en ‘Jij hebt betaald’ eronder.',
  'help.ctx.trip-costs.bullet.4':
    'Het overzicht is per dag gegroepeerd, de nieuwste bovenaan, met bij elke dag hoeveel posten er zijn en hoeveel er is uitgegeven. Een rij toont de categorie als gekleurd tabje, de naam, de betalers met wat ieder heeft betaald, en daaronder Verdelen met het deel van elke reiziger (een vinkje geeft aan wie zijn deel heeft betaald), daarna de notitie en het bedrag, plus ‘je leende uit’ of ‘je leende’ als anderen jou door de verdeling geld schuldig zijn of jij hun.',
  'help.ctx.trip-costs.bullet.5':
    "In de rechterkolom staan de resultaten: Afrekenen toont wie wie moet betalen, Saldi toont het overschot of tekort van elke reiziger, Eindbudget toont wat de reis ieder van hen kost, en 'Per categorie' toont waar het geld aan is uitgegeven.",
  'help.ctx.trip-costs.bullet.6':
    'Een vastgelegde betaling staat als eigen rij in hetzelfde overzicht, met een potlood en ‘Ongedaan maken’ ernaast. Een uitgave heeft een potlood en een prullenbak, en de prullenbak vraagt om bevestiging voordat de uitgave wordt verwijderd. Een uitgave met bonnetjes heeft naast de naam een chip ‘Bonnetje’ waarmee je ze opent.',
  'help.ctx.trip-costs.bullet.7':
    "Tabel in de balk toont dezelfde uitgaven als een spreadsheet, gegroepeerd per categorie, met Personen en Dagen en het bedrag per persoon en per dag. Overzicht vervangt dan 'Per categorie'. Onkosten onthoudt de weergave die je hebt gekozen.",
  // add-expense
  'help.guide.add-expense.title': 'Een uitgave toevoegen',
  'help.guide.add-expense.goal':
    'Leg vast wat iets heeft gekost, wie het heeft betaald en met wie de kosten worden gedeeld.',
  'help.guide.add-expense.step.1':
    'Klik rechts in de balk op ‘Uitgave toevoegen’. De editor opent met de datum van vandaag, jij als betaler en iedereen al in de verdeling.',
  'help.guide.add-expense.step.2':
    'Typ in het bovenste veld van het venster waar de uitgave voor was. Zolang het leeg is, staat er ‘bijv. Diner, souvenirs, benzine…’. Dit is de naam van de uitgave, en zonder naam kun je de uitgave niet opslaan.',
  'help.guide.add-expense.step.3':
    'Het label onder de naam is de Categorie: ‘Eten & drinken’, tot je een andere kiest. Er zijn er veertien, en die kun je niet wijzigen. De kop krijgt de kleur van de categorie die je kiest, en dat geldt ook voor het tabje op de rij en de balk in ‘Per categorie’.',
  'help.guide.add-expense.step.4':
    'Vul het bedrag van het bonnetje in bij Totaalbedrag. Valuta ernaast staat eerst op de valuta waarin Onkosten wordt weergegeven; kies je een andere, dan toont de editor het omgerekende bedrag. Dag staat eerst op vandaag, en in de lijst wordt de uitgave onder die dag gegroepeerd.',
  'help.guide.add-expense.step.5':
    "Klik onder 'Wie heeft betaald?' op de persoon die echt heeft betaald. Jij bent al geselecteerd. Met 'Nog niemand heeft betaald' leg je het bedrag vast zonder dat iemand er geld voor schuldig is, en met 'Meerdere personen hebben betaald' in de schakelaar naast de kop verdeel je de rekening over meerdere betalers.",
  'help.guide.add-expense.step.6':
    "Verdelen daaronder staat eerst op Gelijk, met iedereen aangevinkt en ieders aandeel naast de naam. Laat het zo of pas het aan. Klik onderaan het venster op 'Uitgave toevoegen' om op te slaan.",
  'help.guide.add-expense.result':
    'De uitgave staat in het overzicht onder de juiste dag en telt mee in ‘Totale reisuitgaven’. De verrekenkolom heeft opnieuw berekend wie wie wat verschuldigd is.',
  'help.guide.add-expense.tip.1':
    'Verander je niets aan de standaardwaarden, dan krijgt de uitgave de datum van vandaag, ben jij de betaler en wordt hij gelijk over iedereen verdeeld: je hoeft alleen de naam en het bedrag in te vullen.',
  'help.guide.add-expense.tip.2':
    'Met de ± naast het bedrag maak je van de uitgave een terugbetaling. Een negatief totaal betekent dat er geld wordt terugbetaald, en de verdeling wordt omgedraaid.',
  'help.guide.add-expense.tip.3':
    "‘Bijvoegen’, naast ‘Bonnetjes & facturen’ onderaan het venster, accepteert afbeeldingen en pdf's. Ze worden geüpload als je opslaat en komen bij de Bestanden van de reis, en naast de naam in de lijst verschijnt een chip ‘Bonnetje’.",
  // expense-payers
  'help.guide.expense-payers.title': 'Instellen wie heeft betaald',
  'help.guide.expense-payers.goal':
    'Leg vast wie een uitgave heeft betaald. Dat is de andere helft van de berekening voor het afrekenen.',
  'help.guide.expense-payers.step.1':
    "Open een uitgave met het potlood naast de rij en kijk bij 'Wie heeft betaald?'. In de schakelaar naast de kop staat standaard 'Eén persoon heeft betaald': elke reiziger is een chip, en de omlijnde chip is wie heeft betaald. Klik op een andere chip om dat te wijzigen.",
  'help.guide.expense-payers.step.2':
    "'Nog niemand heeft betaald', de gestippelde chip na de reizigers, legt het bedrag vast zonder dat iemand iets schuldig is. De uitgave telt wel mee in 'Totale reisuitgaven'.",
  'help.guide.expense-payers.step.3':
    '‘Meerdere personen hebben betaald’, de andere stand van die schakelaar, toont alle reizigers met een vakje om aan te vinken, en wie je aanvinkt, krijgt een veld voor het bedrag. Vink aan wie er heeft betaald en vul in hoeveel ieder heeft betaald. Samen moeten de bedragen het totaal vormen.',
  'help.guide.expense-payers.step.4':
    'Een uitgave die nog niemand heeft betaald, krijgt op de rij de markering Onvoltooid en telt mee op de kaart ‘Openstaand bedrag’, waar de uitgaven zonder betaler worden opgeteld.',
  'help.guide.expense-payers.result':
    'Wie heeft betaald, bepaalt wie geld terugkrijgt. De verdeling bepaalt wie betaalt, en Saldi is het verschil tussen die twee.',
  'help.guide.expense-payers.tip.1':
    '‘Wie heeft betaald?’ en Verdelen staan los van elkaar: je kunt een etentje betalen waar je zelf niet bij was, en meebetalen aan een etentje dat je niet hebt betaald.',
  'help.guide.expense-payers.tip.2':
    'Bij meerdere betalers moeten de bedragen samen het totaal vormen. Vink je nog een betaler aan, dan wordt het restant opnieuw verdeeld over de bedragen die je niet zelf hebt ingevuld. Kloppen de bedragen niet, dan toont de editor het totaal dat ze samen moeten vormen en wordt er niet opgeslagen.',
  'help.guide.expense-payers.tip.3':
    "Zet je een uitgave terug op 'Nog niemand heeft betaald', dan wordt hij niet verwijderd: het bedrag blijft meetellen in 'Totale reisuitgaven' en de rij krijgt de status Onvoltooid.",
  // split-expense
  'help.guide.split-expense.title': 'Een rekening over de reizigers verdelen',
  'help.guide.split-expense.goal':
    'Bepaal wie wat aan een uitgave moet bijdragen: iedereen evenveel, per bedrag of per regel van de bon.',
  'help.guide.split-expense.step.1':
    'In de editor van de uitgave toont Verdelen alle reizigers met een vakje om aan te vinken. Vink een naam uit om die persoon buiten deze uitgave te laten: de naam wordt grijs, het aandeel vervalt en die persoon hoeft er niets voor te betalen.',
  'help.guide.split-expense.step.2':
    'Gelijk, in de schakelaar naast de kop, is de standaard: elke aangevinkte reiziger krijgt hetzelfde aandeel, dat naast de naam staat. De labels onder de lijst tonen met hoeveel mensen de kosten worden gedeeld en hoe groot elk aandeel is.',
  'help.guide.split-expense.step.3':
    'Bij Aangepast worden de aandelen vervangen door bedragvelden. Typ wat elke reiziger verschuldigd is. Het label eronder wordt bijgewerkt terwijl je typt en wordt groen met ‘Verdeling klopt met het totaal’. Zolang de bedragen niet optellen tot het totaal, kun je niet opslaan.',
  'help.guide.split-expense.step.4':
    "Met Bon verdeel je het bonnetje regel voor regel: klik op 'Item toevoegen', vul per regel een naam en een prijs in, en kies naast 'Verdeeld over:' de reizigers die die regel delen.",
  'help.guide.split-expense.step.5':
    "'Aandeel per persoon' onder de regels toont wat elke reiziger uiteindelijk moet betalen, en Totaalbedrag bovenaan is de som van de regels. Klik onderaan het venster op Opslaan.",
  'help.guide.split-expense.result':
    'Alle saldi worden berekend op basis van de verdeling. Die wordt met de uitgave opgeslagen, staat op de rij als ‘Verdelen’ met het deel van elke reiziger, en kan later worden gewijzigd zonder dat er verder iets verandert.',
  'help.guide.split-expense.tip.1':
    'Een reiziger die je uitvinkt, betaalt niets voor deze ene uitgave; de anderen betalen hun aandeel.',
  'help.guide.split-expense.tip.2':
    'Gelijk verdeelt tot op de cent: de cent die overblijft, gaat bij elke uitgave naar iemand anders, zodat niet steeds dezelfde persoon hem betaalt.',
  'help.guide.split-expense.tip.3':
    'In de modus Bon berekent TREK het Totaalbedrag zelf en wordt het veld grijs: het totaal is de som van de regels op de bon.',
  'help.guide.split-expense.tip.4':
    'Een aangepaste verdeling kun je ook in procenten invoeren: zet ‘Aandelen invoeren als’ op %. De aandelen moeten samen 100 % zijn voordat de uitgave kan worden opgeslagen.',
  // expense-currency
  'help.guide.expense-currency.title': 'Een uitgave in een andere valuta invoeren',
  'help.guide.expense-currency.goal': 'Vul het bedrag van het bonnetje in, dan slaat TREK de wisselkoers op.',
  'help.guide.expense-currency.step.1':
    "Open 'Uitgave toevoegen'. Typ bovenaan het venster de naam en vul bij Totaalbedrag het bedrag in precies zoals het op het bonnetje staat, niet omgerekend.",
  'help.guide.expense-currency.step.2':
    'Open Valuta naast het bedrag en kies de valuta van het bonnetje. De lijst bevat alle codes die TREK kent en is doorzoekbaar: typ de drie letters.',
  'help.guide.expense-currency.step.3':
    'Onder de velden verschijnt een rij labels: het bedrag dat je hebt getypt en wat het nu waard is, met de vermelding ‘live koers’. Dit is alleen een voorbeeld, niet het bedrag dat wordt opgeslagen.',
  'help.guide.expense-currency.step.4':
    'Klik onder in het venster op ‘Uitgave toevoegen’. De koers wordt op dat moment vastgelegd: deze uitgave houdt de waarde die hij had op de dag dat je hem invoerde.',
  'help.guide.expense-currency.step.5':
    'In het overzicht staan op de rij beide bedragen onder de naam: wat je hebt getypt, een pijl en het bedrag in de valuta van de reis. Alle totalen, saldi en afrekeningen op het tabblad Onkosten gebruiken dat tweede bedrag.',
  'help.guide.expense-currency.result':
    'De uitgave houdt het bedrag en de valuta die je hebt ingevuld. Het overzicht toont beide, en de totalen en saldi van de reis worden in de valuta van de reis berekend.',
  'help.guide.expense-currency.tip.1':
    'De koers wordt vastgelegd zodra je opslaat, zodat een verrekende schuld niet verandert als de wisselkoers een week later verschuift. Alleen als je de valuta van de uitgave wijzigt, wordt er een nieuwe koers opgeslagen.',
  'help.guide.expense-currency.tip.2':
    'Weergavevaluta in Instellingen verandert alleen hoe bedragen worden getoond. De opgeslagen bedragen veranderen nooit. Is het veld leeg, dan wordt elke reis in de eigen valuta getoond.',
  'help.guide.expense-currency.tip.3':
    "De reisvaluta stel je in bij de reis zelf, onder 'Reis bewerken', en daarvoor heb je het recht 'Reisdetails bewerken' nodig. Wijzig je die, dan worden alle vastgelegde koersen opnieuw berekend voor de nieuwe valuta. De bedragen zelf worden niet omgerekend.",
  // filter-costs
  'help.guide.filter-costs.title': 'Een uitgave zoeken, of wat je op één dag hebt uitgegeven',
  'help.guide.filter-costs.goal': 'Filter een lange lijst uitgaven, zodat je alleen ziet wat je zoekt.',
  'help.guide.filter-costs.step.1':
    'Typ in de balk in ‘Uitgaven zoeken…’. Terwijl je typt, wordt gezocht in de naam van de uitgave. Met Esc maak je het veld weer leeg.',
  'help.guide.filter-costs.step.2':
    'Filteren, de trechter naast het zoekveld, opent de filters. Met de schakelaar bovenaan kies je je eigen weergave van het overzicht: Alle, ‘Door mij betaald’ voor wat jij hebt betaald, en ‘Mij verschuldigd’ voor de uitgaven waarbij je meer hebt betaald dan je aandeel.',
  'help.guide.filter-costs.step.3':
    'Kies onder Categorie een van de veertien categorieën; dan zie je alleen de uitgaven in die categorie. Bij de trechter zie je hoeveel filters er aan staan.',
  'help.guide.filter-costs.step.4':
    'Kies onder Dag een van de dagen met uitgaven. Een banner vervangt de dagkopjes en toont die dag in zijn geheel, met het aantal uitgaven en het totaal.',
  'help.guide.filter-costs.step.5':
    "'CSV exporteren', het downloadicoon naast de trechter, slaat alle uitgaven op in een bestand, met het oorspronkelijke bedrag, de valuta en het omgerekende bedrag.",
  'help.guide.filter-costs.result':
    'Je kunt de filters combineren. De dagen worden bijgewerkt, elk met een eigen totaal van de uitgaven die overblijven.',
  'help.guide.filter-costs.tip.1':
    'Geregistreerde betalingen hebben geen naam en geen categorie. Een zoekopdracht of een categoriefilter verbergt ze dus, en ‘Mij verschuldigd’ ook. Het dagfilter laat ze wel zien, onder de dag waarop de betaling is gedaan.',
  'help.guide.filter-costs.tip.2':
    '‘CSV exporteren’ exporteert altijd alle uitgaven, wat er ook op het scherm gefilterd is, met een rij per uitgave.',
  'help.guide.filter-costs.tip.3':
    '‘Filters resetten’, onder in het filtermenu zodra er een filter aanstaat, zet alle filters in één keer uit.',
  // settle-up
  'help.guide.settle-up.title': 'Zien wie wie wat verschuldigd is en de schulden verrekenen',
  'help.guide.settle-up.goal':
    'Zet een hoop gedeelde uitgaven om in zo min mogelijk overboekingen waarmee alle schulden zijn vereffend, en leg de overboekingen vast zodra ze zijn gedaan.',
  'help.guide.settle-up.step.1':
    'De kaart Afrekenen in de rechterkolom toont de overboekingen waarmee alle schulden zijn vereffend: wie wie betaalt, als twee avatars met de namen in de tooltip, en hoeveel. Het getal in de kop geeft aan hoeveel er nog openstaan.',
  'help.guide.settle-up.step.2':
    'Met Afrekenen naast een overboeking leg je vast dat die is gedaan. De overboeking verdwijnt van de kaart en de saldi worden bijgewerkt.',
  'help.guide.settle-up.step.3':
    'De vastgelegde overboeking staat als rij in het overzicht, onder de dag waarop ze plaatsvond, gemarkeerd als Betaling met de twee reizigers en het bedrag.',
  'help.guide.settle-up.step.4':
    'Naast die rij corrigeer je een betaling met het potlood en annuleer je hem met ‘Ongedaan maken’. De overboeking staat dan weer op de kaart Afrekenen.',
  'help.guide.settle-up.step.5':
    'Met ‘Betaling toevoegen’ bovenaan de kaart leg je een overboeking vast die niet volgens een voorstel ging. Kies Van en Naar, het bedrag, de valuta en de dag waarop het is gebeurd, voeg eventueel een Notitie toe, bijvoorbeeld hoe er is betaald, en klik onderaan het venster op ‘Betaling toevoegen’.',
  'help.guide.settle-up.step.6':
    'Afrekenen in de balk bovenaan legt alle openstaande overboekingen in één keer vast, zonder iets te vragen, bijvoorbeeld als de groep aan het eind van een reis alle schulden verrekent.',
  'help.guide.settle-up.result':
    'Elke vastgelegde overboeking staat als rij in het overzicht en haalt een regel van de kaart Afrekenen. Staat er op de kaart ‘Iedereen is quitte’, dan is alles betaald.',
  'help.guide.settle-up.tip.1':
    'De kaart toont zo min mogelijk overboekingen, niet elke afzonderlijke schuld: zijn drie mensen elkaar in een kringetje geld schuldig, dan blijven er maar een of twee betalingen over.',
  'help.guide.settle-up.tip.2':
    'Afrekenen legt alleen een overboeking vast. Er wordt geen geld verstuurd. Betaal via je gebruikelijke betaalmethode en klik daarna op Afrekenen.',
  'help.guide.settle-up.tip.3':
    "Een betaling kan in elke valuta, dus een schuld in yen in euro's betalen is heel normaal: het venster heeft een eigen valutakiezer en legt ook die koers vast.",
  // final-budget
  'help.guide.final-budget.title': 'Zien wat de reis elke reiziger heeft gekost',
  'help.guide.final-budget.goal':
    'Bekijk de cijfers per persoon: het saldo van vandaag en de echte kosten per persoon.',
  'help.guide.final-budget.step.1':
    'Saldi toont de stand van elke reiziger: een groene balk naar rechts als de reis die persoon iets verschuldigd is, een rode balk naar links als die persoon de reis iets verschuldigd is, en het bedrag naast de naam.',
  'help.guide.final-budget.step.2':
    'Eindbudget daaronder beantwoordt een andere vraag: niet wie op dit moment wat verschuldigd is, maar wat de reis elke reiziger kost als alles is terugbetaald.',
  'help.guide.final-budget.step.3':
    "Klik op een naam om de berekening te zien: 'Betaalde uitgaven', met daaronder 'Terugbetalingen netto' en 'Openstaande terugbetalingen'.",
  'help.guide.final-budget.step.4':
    'Onder de drie regels staat bij de naam van elke reiziger een lijst met de rijen waaruit die regel bestaat: de uitgaven die die reiziger heeft betaald, de overboekingen die al zijn vastgelegd en de overboekingen die nog openstaan. Elke lijst telt precies op tot de regel met dezelfde naam.',
  'help.guide.final-budget.result':
    'Saldi toont wie er vandaag nog geld krijgt en wie er nog moet betalen. Eindbudget toont wat de reis ieder van jullie kost als alles is terugbetaald.',
  'help.guide.final-budget.tip.1':
    'Een betaling vastleggen verandert niets aan iemands eindbudget. Er gaat alleen een bedrag van de openstaande terugbetalingen naar de netto terugbetalingen.',
  'help.guide.final-budget.tip.2':
    'Een uitgave zonder betaler telt op geen van beide kaarten mee, net zoals hij niet meetelt in de voorstellen om af te rekenen.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Van een boeking een uitgave maken',
  'help.guide.expense-from-booking.goal':
    'Koppel wat een vlucht, hotel of plek echt heeft gekost aan het item waar het bij hoort.',
  'help.guide.expense-from-booking.step.1':
    'Zoek de boeking op het tabblad Transport of Boekingen en klik op het potlood bovenaan de kaart.',
  'help.guide.expense-from-booking.step.2':
    "Scrol naar Onkosten aan het eind van het formulier. Daar vind je 'Kostenpost aanmaken', dat eerst de boeking opslaat, en 'Bestaande kostenpost koppelen' voor een uitgave die al in Onkosten staat.",
  'help.guide.expense-from-booking.step.3':
    'Klik op ‘Kostenpost aanmaken’. De boeking wordt opgeslagen, het formulier sluit, en de editor Onkosten opent met de titel van de boeking als naam, een categorie die bij het type past en de dag van de boeking als dag van de uitgave.',
  'help.guide.expense-from-booking.step.4':
    "Vul het bedrag en de valuta, wie er heeft betaald en de verdeling in, net als bij elke uitgave, en klik op 'Uitgave toevoegen'. Open je de boeking opnieuw, dan staat de uitgave onder 'Gekoppelde kostenposten', met een potlood om hem te bewerken, 'Ontkoppelen, kostenpost behouden' om de koppeling te verwijderen maar de uitgave te houden, en een prullenbak om hem te verwijderen.",
  'help.guide.expense-from-booking.result':
    'De boeking toont de kosten, en de uitgave is een gewone rij op het tabblad Onkosten, met een betaler, een verdeling en een valuta, net als elke andere uitgave.',
  'help.guide.expense-from-booking.tip.1':
    'Verwijder je de boeking, dan worden ook de gekoppelde uitgaven verwijderd, en de bevestigingsvraag meldt dat. ‘Kostenpost verwijderen’ in het blok Kosten van de boeking doet het omgekeerde: de uitgave wordt verwijderd en de boeking blijft. ‘Ontkoppelen, kostenpost behouden’ houdt beide.',
  'help.guide.expense-from-booking.tip.2':
    'Een plek heeft hetzelfde blok in zijn formulier. Daar slaat ‘Kostenpost aanmaken’ eerst de plek op.',
  // costs-table
  'help.guide.costs-table.title': 'De kosten plannen in een tabel',
  'help.guide.costs-table.goal':
    'Bekijk en wijzig de uitgaven in een tabel, gesorteerd op categorie en berekend per persoon en per dag.',
  'help.guide.costs-table.step.1':
    'Klik op Tabel, het tweede pictogram van de schakelaar Lijst / Tabel in de balk. Het overzicht wordt vervangen door een tabel met dezelfde uitgaven, en het zoeken en de filters werken daar ook.',
  'help.guide.costs-table.step.2':
    'De tabel is gegroepeerd per categorie. Elke groep toont bovenaan de naam, het aantal uitgaven en het subtotaal. Klik op die kop om de groep in te klappen. De kolommen zijn Naam, Datum, Totaal, Personen en Dagen, en daarna Per persoon, Per dag en P. p. / dag, die daaruit worden berekend en een grijze achtergrond hebben. Een rij Totaal onderaan telt alles op.',
  'help.guide.costs-table.step.3':
    "Klik op een cel om die direct te wijzigen: een naam, een totaal, Personen of Dagen. Typ, en druk op Enter of klik ergens anders om op te slaan, of druk op Esc om te annuleren; bij de datum gaat de kalender open. 'Per persoon' en de andere berekende kolommen worden meteen bijgewerkt.",
  'help.guide.costs-table.step.4':
    'Een totaal met een slotje kun je hier niet wijzigen: iemand heeft het betaald, of het is in een andere valuta ingevoerd, en de tooltip vertelt welke van de twee. Klik je erop, dan opent in plaats daarvan de uitgave, zodat de saldi en de vastgelegde wisselkoers blijven kloppen.',
  'help.guide.costs-table.step.5':
    "'Uitgave toevoegen' aan het eind van een categorie voegt daar een rij toe met de naam 'Nieuwe invoer', met de datum van de laatste invoer daar. Het naamveld staat al open, zodat je de naam kunt wijzigen. Vul op dezelfde manier een totaal in.",
  'help.guide.costs-table.step.6':
    'In deze weergave toont de rechterkolom Overzicht in plaats van ‘Per categorie’. Daar worden de uitgaven op vier manieren opgeteld: Categorie, Dag, Betaler (met ‘Nog geen betaler’ voor wat nog niet is betaald) en Status (Betaald tegenover Openstaand).',
  'help.guide.costs-table.result':
    'Elke uitgave staat in zijn categorie, met het bedrag per persoon en per dag. Wijzig je een totaal in een cel, dan worden de kaarten erboven en Overzicht meteen bijgewerkt.',
  'help.guide.costs-table.tip.1':
    'Onkosten onthoudt de weergave in deze browser: het opent in de tabel tot je weer op Lijst klikt.',
  'help.guide.costs-table.tip.2':
    'Een uitgave die Aangepast of met Bon is verdeeld, heeft geen vast aandeel per persoon. Daarom blijven ‘Per persoon’ en ‘P. p. / dag’ daarbij leeg.',
  'help.guide.costs-table.tip.3':
    "Betalers, de verdeling, de notitie en de bonnetjes bewerk je in de uitgave zelf: onder 'Meer opties' aan het eind van een rij staan Bewerken, en Verwijderen om de rij te verwijderen.",

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transport',
  'help.ctx.trip-transports.summary':
    "Alle manieren waarop je tussen de stops reist: vluchten, treinen, bussen, auto's, taxi's, fietsen, cruises, veerboten, kabelbanen en de ov-verbindingen die TREK voor je opzoekt. Het tabblad zet ze op een rij. Je kunt ze ook in de planning aanmaken en bekijken, en ze staan op de kaart.",
  'help.ctx.trip-transports.bullet.1':
    'Op dit tabblad staan alleen de ritten. Accommodatie, restaurants, evenementen en tickets staan op het tabblad Boekingen, zodat niets dubbel verschijnt.',
  'help.ctx.trip-transports.bullet.2':
    'In de balk bovenaan vind je Zoeken, Filter voor de status, de soorten en de reizigers, de drie weergaven Kaarten, Lijst en Tijdlijn, Weergaveopties en ‘Exporteren als spreadsheet (CSV)’, dat downloadt wat er wordt getoond. Met ‘Transport’ rechts voeg je handmatig een rit toe. De pictogrammen ervoor, ‘Boekingsbevestigingen importeren’ en ‘Importeren uit AirTrail’, verschijnen als de server bevestigingen kan inlezen of als AirTrail is verbonden. Op een leeg tabblad staan dezelfde acties in het midden: Transport, ‘Importeren vanuit bestand’ en AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'Het tabblad opent in de weergave Kaarten: eerst Bevestigd, dan ‘In behandeling’. Je klapt een sectie in door op de kop te klikken. Geplande ov-verbindingen hebben geen status en staan op tijdvolgorde tussen de bevestigde ritten, tenzij je ze via Weergaveopties een eigen sectie geeft: ‘Automatisch openbaar vervoer’. Lijst groepeert per dag, en Tijdlijn toont alle ritten over de dagen van de reis.',
  'help.ctx.trip-transports.bullet.4':
    'De bovenste strook van een kaart heeft de kleur van de status: groen voor bevestigd, oranje voor in behandeling, blauw voor een geplande verbinding. Daarin staan de statusstip, het type, de titel, het potlood en de prullenbak. Daaronder: Datum, Tijd, Boekingscode, Route en de luchtvaartmaatschappij en het vluchtnummer, of het treinnummer, het perron en de zitplaats. Klik op de kaart om de details te openen.',
  'help.ctx.trip-transports.bullet.5':
    'Je kunt vervoer ook in de planning toevoegen: via de + in de kop van een dag (met de knopinfo ‘Toevoegen aan dag’) of met een rechtermuisklik op de kop kies je ‘Vervoer toevoegen’ of ‘Openbaar vervoer’. De verbindingslijn met de reistijd tussen twee stops opent dezelfde zoekopdracht voor alleen dat traject.',
  'help.ctx.trip-transports.bullet.6':
    'Vervoer waarvan begin en eind zijn ingevuld, tekent een lijn op de kaart. Met het routepictogram op de rij in het dagplan en met ‘Op kaart’ in de details zet je die lijn aan. Met ‘Alle boekingsroutes tonen’ in de werkbalk boven de dagen zet je de lijnen van de hele reis aan of uit.',
  // transports-list
  'help.guide.transports-list.title': 'Het tabblad Transport bekijken',
  'help.guide.transports-list.goal': 'Begrijp wat de lijst toont voordat je er iets aan wijzigt.',
  'help.guide.transports-list.step.1':
    'Transport is een tabblad van de reis, na Planning (en Tochten, als die add-on aan staat). Er staan alleen ritten op: hotels, restaurants, evenementen en tickets vind je op het tabblad Boekingen.',
  'help.guide.transports-list.step.2':
    'Met ‘Zoeken’ links in de balk filter je de ritten terwijl je typt. ‘Filter’, de trechter ernaast, opent de keuzes: Status met Alle, Bevestigd en ‘In behandeling’, daarna elk gebruikt type met het aantal. Vink een of meer typen aan om alleen die te tonen. Een getal op de trechter geeft aan hoeveel filters actief zijn, en de balk toont hoeveel ritten er te zien zijn, bijvoorbeeld 1 van 4. ‘Filters resetten’ onderaan het menu toont weer alle ritten.',
  'help.guide.transports-list.step.3':
    "Met Kaarten, Lijst en Tijdlijn ernaast zie je het vervoer als kaarten, als rijen per dag of als balken over de dagen van de reis. Bij Weergaveopties, het icoon met de schuifjes, stel je 'Groeperen op' en 'Sorteren op' in voor Kaarten en Lijst, en de banen voor Tijdlijn. 'Weergave resetten' zet alles terug naar de standaard. Staat in Kaarten 'Openbaar vervoer als eigen sectie' aan, dan staan de geplande verbindingen onder 'Automatisch openbaar vervoer'.",
  'help.guide.transports-list.step.4':
    "Op elke kaart staan alle gegevens. De balk bovenaan is groen bij Bevestigd en oranje bij 'In behandeling', en toont de statusstip, het type en de titel. Daaronder toont Datum de dagen die het vervoer beslaat, met hun datums. Dan volgen Tijd, Boekingscode, Route met het icoon van het type tussen de haltes, en de luchtvaartmaatschappij en het vluchtnummer, of het treinnummer, het perron en de zitplaats. Klik op de kaart om de details te openen.",
  'help.guide.transports-list.step.5':
    'Klik op de statusstip om de rit te wisselen tussen ‘In behandeling’ en ‘Bevestigd’; de tooltip zegt welke kant op, bijvoorbeeld ‘Zet op In behandeling’. Het potlood in de kop opent het formulier van de vervoersboeking, en de prullenbak verwijdert hem na de vraag ‘Boeking verwijderen?’, die opsomt wat er wordt verwijderd, inclusief gekoppelde kosten.',
  'help.guide.transports-list.result':
    'Op elke kaart zie je of de rit geboekt is, en met de balk kun je de lijst op elk moment filteren of sorteren.',
  'help.guide.transports-list.tip.1':
    'Het tabblad onthoudt je instellingen: de weergave, de groepering en de sortering in deze browser, de ingeklapte secties per reis, en de filters tot je het browsertabblad sluit.',
  'help.guide.transports-list.tip.2':
    '‘Boekingsbevestigingen importeren’ en ‘Importeren uit AirTrail’, de twee pictogrammen vóór Vervoer, verschijnen alleen als de server bevestigingen kan uitlezen en als er een AirTrail-instantie is gekoppeld. Zonder die twee vul je de lijst zelf of via het zoeken naar ov-verbindingen.',
  // add-transport
  'help.guide.add-transport.title': 'Vervoer aan een dag toevoegen',
  'help.guide.add-transport.goal': 'Voeg het vervoer van de ene stop naar de volgende toe aan de dag waarop je reist.',
  'help.guide.add-transport.step.1':
    'Klik in de kop van de dag van de rit op de +, met de tooltip ‘Toevoegen aan dag’, en kies ‘Vervoer toevoegen’. Met de rechtermuisknop op de kop van de dag krijg je hetzelfde menu. Het formulier opent met die dag al ingevuld.',
  'help.guide.add-transport.step.2':
    'De typepil in de kop toont het soort vervoer, standaard ‘Vlucht’. Klik erop voor Vlucht, Trein, Bus, Auto, Taxi, Fiets, Cruise, Veerboot, Kabelbaan of Overig, en het formulier past zich aan: een vlucht krijgt bij elke stop een luchthaven, een trein een reeks stations, een cruise ‘Inscheping’, ‘Aanloophaven’ en ‘Ontscheping’, een auto ‘Ophalen’, ‘Inleveren’ en ‘Stops onderweg’.',
  'help.guide.add-transport.step.3':
    "Typ de titel direct in de balk bovenaan, waar de grijze voorbeeldtekst staat. Dat is het enige verplichte veld: zolang het leeg is, staat op de regel eronder 'Titel *' en blijft Toevoegen grijs. Kies een titel die je op een vertrekbord zou herkennen.",
  'help.guide.add-transport.step.4':
    'Onder Route vul je bij Van en Naar een station, een haven of een adres in. Voordat je typt, worden de plaatsen van de reis al voorgesteld. Typ minstens drie letters om te zoeken en kies een resultaat. Een naam die je alleen typt en niet uit de resultaten kiest, wordt niet opgeslagen, en er verschijnt niets op de kaart.',
  'help.guide.add-transport.step.5':
    'Bij Datum en Starttijd vul je in wanneer de rit begint, bij Einddatum en Eindtijd wanneer hij eindigt. Komt de rit de volgende dag aan, vul daar dan de volgende dag in. Boekingscode en Notities verderop zijn optioneel. Klik op het label ‘In behandeling’ in de kop om het te veranderen in Bevestigd.',
  'help.guide.add-transport.step.6': 'Klik op Toevoegen.',
  'help.guide.add-transport.result':
    'Het vervoer staat als rij op de dag, op zijn tijd tussen de stops, en als kaart op het tabblad Transport onder ‘In behandeling’ of Bevestigd.',
  'help.guide.add-transport.tip.1':
    'De rij wordt geplaatst op basis van de starttijd, na de laatste stop die eerder begint. Sleep hem aan de greep naar een andere plek op de dag, of naar een andere dag.',
  'help.guide.add-transport.tip.2':
    "Voeg het ticket toe met 'Bestand bijvoegen' onder Bestanden. 'Kostenpost aanmaken' onder Onkosten slaat de boeking op en opent de editor van Onkosten voor de ritprijs.",
  'help.guide.add-transport.tip.3':
    'Met Reizigers, het eerste blok van het formulier, geef je aan wie met dit vervoer meegaat. Heeft de reis meer dan één lid en is er bij vervoer iemand opgegeven, dan biedt het filter op het tabblad ook Reizigers, waarmee je alleen het vervoer van één persoon ziet.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Een vlucht importeren uit het e-ticket',
  'help.guide.import-transport-file.goal':
    'Laat TREK een vlucht, trein of veerboot uitlezen uit het ticket van de vervoerder, en controleer alles voordat het wordt opgeslagen.',
  'help.guide.import-transport-file.step.1':
    'Klik in de balk van het tabblad Transport op het downloadpictogram vóór Transport, met de knopinfo ‘Boekingsbevestigingen importeren’. Het venster met die naam opent, hetzelfde als op het tabblad Boekingen. Op een leeg tabblad doet ‘Importeren vanuit bestand’ in het midden hetzelfde.',
  'help.guide.import-transport-file.step.2':
    "Zet het ticket neer op het vak, of klik op het vak en kies het bestand: EML, PDF, PKPass, HTML en TXT, tot vijf bestanden van elk 10 MB, en foto's van een ticket (JPG, PNG, WEBP) als je server een AI-model heeft om ze te lezen. Het vak toont de namen van de bestanden die je hebt gekozen.",
  'help.guide.import-transport-file.step.3':
    'Klik op Importeren. Het venster sluit meteen en het bestand wordt op de achtergrond uitgelezen.',
  'help.guide.import-transport-file.step.4':
    'Rechtsonder zie je op een kaart de voortgang onder de bestandsnaam. ‘Bestanden verwerken…’ verandert in een vinkje als het uitlezen klaar is, en op de kaart verschijnt Importeren. Klik erop.',
  'help.guide.import-transport-file.step.5':
    'Een vlucht opent in ‘Vervoer toevoegen’, al ingevuld: het typelabel op Vlucht, de luchtvaartmaatschappij en het vluchtnummer als titel in de kop, beide luchthavens onder Route met Vertrek en Aankomst, de tijden en tijdzones, Luchtvaartmaatschappij en Vluchtnr., de Boekingscode en het ticket onder Bestanden. Controleer alles en klik op Toevoegen.',
  'help.guide.import-transport-file.result':
    "De vlucht staat als kaart onder 'In behandeling' op het tabblad Transport en als rij op de dag van vertrek, met het ticket onder Bestanden. Zijn beide luchthavens bekend, dan staat de vlucht als boog op de kaart.",
  'help.guide.import-transport-file.tip.1':
    "Beide tabbladen gebruiken dezelfde import. Staan er in een bestand een vlucht en een hotel, dan opent eerst de vlucht in 'Vervoer toevoegen' en daarna het hotel in 'Nieuwe reservering', vanuit welk tabblad je ook begon.",
  'help.guide.import-transport-file.tip.2':
    'Luchthavens worden op basis van hun code geplaatst. Kon een station of haven niet worden gevonden, dan staat de naam in oranje op de importkaart rechtsonder. Kies hem zelf onder Route voordat je op Toevoegen klikt, anders verschijnt het vervoer niet op de kaart.',
  // plan-transit
  'help.guide.plan-transit.title': 'Een ov-verbinding plannen',
  'help.guide.plan-transit.goal':
    'Laat TREK de echte treinen en bussen tussen twee punten van een dag opzoeken, en zet de verbinding die je kiest in de planning.',
  'help.guide.plan-transit.step.1':
    'Klik op de + in de kop van de dag en kies ‘Openbaar vervoer’. Het zoeken opent voor die dag: de dag staat als label in de kop, en met Handmatig en Automatisch ernaast wissel je tussen dit zoeken en het gewone formulier.',
  'help.guide.plan-transit.step.2':
    'Bij ‘Van’ en ‘Naar’ kies je een halte of station. Zolang het vak nog leeg is, stelt TREK de accommodatie van de dag voor, de stations en luchthavens uit de boekingen van die dag en de stops van de dag zelf. Typ je twee letters, dan doorzoekt TREK in plaats daarvan de stations uit de dienstregeling. ‘Wisselen’ tussen de twee vakken draait Van en Naar om.',
  'help.guide.plan-transit.step.3':
    'Met Vertrek of Aankomst en een tijd geef je aan wanneer je wilt reizen, en met ‘Beste route’, ‘Minder overstappen’ of ‘Minder lopen’ hoe de resultaten worden gesorteerd.',
  'help.guide.plan-transit.step.4':
    'De chips eronder geven aan welke vervoerswijzen gebruikt mogen worden: Trein, Metro, Tram, Bus, Veerboot en Kabelbaan. Zet er een uit om hem uit te sluiten; er blijft er altijd minstens één aan. Klik daarna op Zoeken.',
  'help.guide.plan-transit.step.5':
    'Bij elk resultaat zie je vertrek en aankomst, de reistijd, het aantal overstappen en hoeveel je loopt, en de lijnen als badges, in hun eigen kleuren als de dienstregeling die levert. Klik op een resultaat om het uit te klappen en elk deel van de reis te zien, met de haltes waar je instapt en overstapt, de perrons en de looproutes tussen de lijnen.',
  'help.guide.plan-transit.step.6': "Klik op 'Toevoegen aan dag'.",
  'help.guide.plan-transit.result':
    'De verbinding staat als rij op de dag, met de lijnlabels. Klik op het pijltje om elk deeltraject te zien. Op het tabblad Transport staat ze ook als blauwe kaart tussen de bevestigde ritten.',
  'help.guide.plan-transit.tip.1':
    'De verbindingen komen van Transitous, een gratis communitydienst die openbare dienstregelingen gebruikt: geen sleutel, geen account. Een beheerder kan instellen dat er in plaats daarvan via Google wordt gezocht.',
  'help.guide.plan-transit.tip.2':
    'Niets gevonden? De gegevens gelden voor een bepaalde regio en periode. Probeer een andere tijd, zet meer vervoerswijzen aan, of kies een station in plaats van de plaats zelf. Het bericht noemt de dienst die heeft geantwoord. Een reis zonder data heeft geen dag om op te zoeken, en biedt daarom alleen het gewone formulier.',
  'help.guide.plan-transit.tip.3':
    'Hetzelfde zoeken kun je ook voor één traject openen: klik op de verbinding met de reistijd tussen twee stops en kies ‘Openbaar vervoer’. Van, Naar en de vertrektijd zijn dan al ingevuld.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Een geplande verbinding openen en wijzigen',
  'help.guide.change-transit-route.goal':
    'Bekijk de verbinding regel voor regel, geef hem een andere naam, of zoek de route opnieuw op.',
  'help.guide.change-transit-route.step.1':
    "Op het tabblad Transport is een geplande verbinding een kaart met een blauwe balk bovenaan, op tijdsvolgorde tussen het bevestigde vervoer. Staat 'Openbaar vervoer als eigen sectie' aan onder Weergaveopties, dan staat hij in plaats daarvan onder 'Automatisch openbaar vervoer'. Klik op de kaart. De verbinding opent als boeking.",
  'help.guide.change-transit-route.step.2':
    'De tegels bovenaan tonen het vertrek en de aankomst met de haltes, de Duur, het aantal keer Overstappen en hoeveel je Te voet gaat. Daaronder toont Reisplan de verbinding regel voor regel, met de tijden, de perrons en de looproutes tussen de lijnen.',
  'help.guide.change-transit-route.step.3':
    'Met ‘Route wijzigen’ onder aan de boeking open je het zoeken opnieuw, al ingevuld met het begin- en eindpunt van deze verbinding en de dag ervan.',
  'help.guide.change-transit-route.step.4':
    'Klik op Zoeken, open een andere verbinding en klik op ‘Toevoegen aan dag’. Die vervangt dan de oude. Bewerken, helemaal rechts onder aan de boeking, opent in plaats daarvan het gewone formulier voor vervoer, waar je de Boekingscode, de reizigers, de notities en de bestanden kunt bewerken.',
  'help.guide.change-transit-route.result':
    'De reis gebruikt nu de nieuwe verbinding, en de kaart op het tabblad Transport toont de nieuwe lijnen en tijden.',
  'help.guide.change-transit-route.tip.1':
    'Klik op de titel in de kop van de boeking om de verbinding een andere naam te geven zonder de route te wijzigen. Notities schrijf je in het formulier voor vervoer dat opent met Bewerken.',
  'help.guide.change-transit-route.tip.2':
    'Met de prullenbak onderaan de boeking verwijder je de verbinding, nadat je dat hebt bevestigd; de stops van de dag blijven staan.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Het vervoermiddel voor één deel van de route wijzigen',
  'help.guide.leg-travel-mode.goal': 'Zet één deel van een autodag op lopen, of plan dat deel met de ov-zoekfunctie.',
  'help.guide.leg-travel-mode.step.1':
    'De verbindingen tussen de stops verschijnen pas als de route van de dag aanstaat. Klik op de kop van de dag om die te openen en klik dan op Route in de balk onder de stops.',
  'help.guide.leg-travel-mode.step.2':
    'Elke verbinding toont de reistijd en de afstand van dat traject, met het pictogram van het vervoermiddel waarmee is gerouteerd: een auto voor rijden, een voetje voor lopen, een fiets voor fietsen.',
  'help.guide.leg-travel-mode.step.3':
    'Klik op de verbindingslijn. In het menu kies je Auto, Te voet of Fietsen, Openbaar vervoer voor alleen dit traject, of ‘Dagstandaard gebruiken’.',
  'help.guide.leg-travel-mode.step.4':
    'Kies ‘Te voet’. Alleen dit traject verandert, de rest van de dag houdt zijn eigen vervoerswijze.',
  'help.guide.leg-travel-mode.result':
    'Het traject toont het voetgangerspictogram en de looptijd, en de andere trajecten van de dag houden de vervoerswijze van de dag.',
  'help.guide.leg-travel-mode.tip.1':
    'De vervoerswijze hoort bij het traject, niet bij de dag: de knoppen Auto, Te voet en Fietsen voor de hele dag overschrijven nooit een traject dat je zelf hebt ingesteld. Met ‘Dagstandaard gebruiken’ volgt het traject die knoppen weer.',
  'help.guide.leg-travel-mode.tip.2':
    '‘Openbaar vervoer’ in hetzelfde menu opent het zoeken naar verbindingen voor precies dit traject, met begin- en eindpunt en de vertrektijd al ingevuld.',
  'help.guide.leg-travel-mode.tip.3':
    'De tijden komen van een openbare routeplanner die echte wegen en voetpaden gebruikt. Kan de routeplanner een deel van de route niet berekenen, dan blijft dat deel een rechte lijn zonder tijd.',
  // edit-transport
  'help.guide.edit-transport.title': 'Vervoer wijzigen of verwijderen',
  'help.guide.edit-transport.goal':
    'Verbeter een tijd, een perron of een boekingscode, of verwijder het vervoer uit de reis.',
  'help.guide.edit-transport.step.1':
    'In het dagplan is een vervoersboeking een rij tussen de stops, gekleurd naar het type. Klik erop om de boeking te openen: de status, het type, de dagen en de ‘Boekingscode’ (met een knop om hem te kopiëren) als pillen bovenaan, en daaronder de vertrek- en aankomsttijden met de luchthavens of stations.',
  'help.guide.edit-transport.step.2':
    'Met Bewerken onder aan de boeking open je het formulier waarmee je hem hebt aangemaakt, met ‘Vervoer bewerken’ boven de titel in de kop. Daar kun je alles wijzigen: de titel, de labels voor status en type, de route, de dagen en tijden en de Boekingscode.',
  'help.guide.edit-transport.step.3':
    'De route van een vlucht is een reeks luchthavens, die van een trein een reeks stations, die van een cruise een reeks havens. ‘Tussenstop toevoegen’ (‘Haven toevoegen’ bij een cruise) voegt er een tussen, en elk traject houdt zijn eigen tijden en zijn eigen vlucht- of treinnummer.',
  'help.guide.edit-transport.step.4':
    'Klik op Bijwerken. Wil je het vervoer helemaal verwijderen, gebruik dan de prullenbak links in dezelfde balk, de prullenbak onder aan de boeking of de prullenbak op de kaart op het tabblad Transport, en bevestig.',
  'help.guide.edit-transport.result':
    'De wijziging is overal te zien waar het vervoer staat: op het tabblad Transport, op de dag waarop het plaatsvindt en als lijn op de kaart.',
  'help.guide.edit-transport.tip.1':
    'Hetzelfde formulier kun je op twee manieren openen: via Bewerken in de boeking die opent vanuit een rij in het dagplan, en via het potlood op de kaart op het tabblad Transport. Een geplande ov-verbinding opent ook als boeking. Daar opent ‘Route wijzigen’ het zoeken opnieuw, en Bewerken dit formulier.',
  'help.guide.edit-transport.tip.2':
    'Om vervoer naar een andere dag te verplaatsen, heb je het formulier niet nodig: sleep de rij van de ene dagkaart naar de andere.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Vervoer op de kaart tonen',
  'help.guide.transport-on-map.goal': 'Zie de echte route van een vlucht, een autorit of een verbinding.',
  'help.guide.transport-on-map.step.1':
    'Bij vervoer waarvan begin en eind zijn ingevuld, staat in het dagplan een klein routepictogram op de rij. Klik erop. De tooltip verandert dan in ‘Boekingsroutes verbergen’.',
  'help.guide.transport-on-map.step.2':
    'De route wordt op de kaart getekend, met aan beide uiteinden een label met het pictogram van het vervoer.',
  'help.guide.transport-on-map.step.3':
    'Klik op een eindpunt en de boeking opent boven de kaart. In de kop zie je de status, het type, de dagen en de Boekingscode. Daaronder staan de tijden met de luchthavens of stations, de luchtvaartmaatschappij en het vluchtnummer. Klik in de kop op Sluiten om het venster te sluiten.',
  'help.guide.transport-on-map.step.4':
    'Het routepictogram in de werkbalk boven de dagen werkt voor de hele reis tegelijk: ‘Alle boekingsroutes tonen’, en ‘Alle boekingsroutes verbergen’ om ze weer te verbergen.',
  'help.guide.transport-on-map.step.5':
    "Een geplande ov-verbinding heeft geen eigen route-icoon. Hij wordt getekend via de schakelaar Route van de dag, dus 'Alle boekingsroutes verbergen' verbergt hem niet zolang de route van die dag aan staat.",
  'help.guide.transport-on-map.result':
    'De routes staan op de kaart met aan beide uiteinden een markering, en blijven daar tot je ze uitzet.',
  'help.guide.transport-on-map.tip.1':
    'Een vlucht, een cruise en een veerboot worden als boog getekend. Een auto, een bus, een taxi en een fiets volgen de echte wegen. Een trein of een geplande verbinding loopt via de stations waar hij stopt.',
  'help.guide.transport-on-map.tip.2':
    'Een bevestigde boeking is een doorgetrokken lijn, een boeking in behandeling een stippellijn. Met de instelling ‘Routelabels voor boekingen’ zie je de luchthavencode of de stationsnaam bij de eindpunten.',
  'help.guide.transport-on-map.tip.3':
    '‘Alle boekingsroutes tonen’ vult de routes die je al toont niet aan, maar vervangt wat je met de losse pictogrammen hebt ingesteld. Daarna worden alle routes getoond of zijn ze allemaal verborgen.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Vluchten importeren uit AirTrail',
  'help.guide.airtrail-import.goal':
    'Importeer de vluchten die je al in AirTrail hebt in één keer in de reis, en houd ze daarna via AirTrail up-to-date.',
  'help.guide.airtrail-import.step.1':
    "Staat de add-on AirTrail aan en is je instantie gekoppeld onder Integraties in Instellingen, dan zie je in de balk van het tabblad Transport een vliegtuigicoon, 'Importeren uit AirTrail', vóór Vervoer. Klik erop.",
  'help.guide.airtrail-import.step.2':
    "'Importeren uit AirTrail' toont de vluchten van je account in twee groepen. Onder 'Tijdens deze reis' staan de vluchten binnen de reisdata, al aangevinkt. Onder 'Andere vluchten' staat de rest, niet aangevinkt. Een vlucht die al in de reis staat, is grijs en gemarkeerd als Geïmporteerd.",
  'help.guide.airtrail-import.step.3':
    "Elke rij heeft een selectievakje, met de luchtvaartmaatschappij en het vluchtnummer, de twee luchthavens en de datum. Klik op een rij om de vlucht wel of niet mee te nemen. Vluchten onder 'Andere vluchten' worden alleen geïmporteerd als je ze aanvinkt.",
  'help.guide.airtrail-import.step.4':
    'Aansluitende vluchten worden gegroepeerd: elke vlucht vertrekt binnen een dag vanaf de luchthaven waar de vorige is geland. Het vinkje eronder, ‘Importeren als één vlucht met een overstap op die luchthaven’, staat al aan. Laat het aan voor één boeking met een overstap, of zet het uit om de deeltrajecten als losse vluchten te importeren.',
  'help.guide.airtrail-import.step.5':
    'Klik op de knop rechtsonder, waarop het aantal aangevinkte vluchten staat, bijvoorbeeld ‘2 importeren’. Daarna zie je in een melding hoeveel vluchten zijn geïmporteerd.',
  'help.guide.airtrail-import.step.6':
    'De vluchten verschijnen als kaarten onder Bevestigd, elk met een blauw AirTrail-label naast de titel, en als rijen op de dagen waarop ze vliegen. Een vlucht met overstap is één kaart, en de route loopt via de overstapluchthaven.',
  'help.guide.airtrail-import.result':
    'De vluchten uit AirTrail staan als kaarten op het tabblad Transport en als rijen op hun dagen, elk met het AirTrail-label dat laat zien waar ze vandaan komen.',
  'help.guide.airtrail-import.tip.1':
    'Een vlucht met hetzelfde nummer en dezelfde datum die al in de reis staat, wordt overgeslagen, en een melding vertelt hoeveel vluchten zijn overgeslagen. Met de pijl voor ongedaan maken in de werkbalk boven de dagen draai je de hele import terug.',
  'help.guide.airtrail-import.tip.2':
    "AirTrail blijft de hoofdbron van de gegevens. TREK haalt wijzigingen op als je de reis opent en daarna om de paar minuten op de achtergrond. Een vlucht die in AirTrail is verwijderd, houdt zijn kaart in TREK, maar het label verandert in 'Niet gesynchroniseerd'. Wijzigingen in TREK gaan alleen terug naar AirTrail als 'Wijzigingen terugschrijven naar AirTrail' aan staat onder Integraties.",
  'help.guide.airtrail-import.tip.3':
    'Een samengevoegde verbinding is niet één AirTrail-vlucht die kan worden gesynchroniseerd, dus het is een eenmalige import: hij houdt het blauwe label, en als je met de muis over dat label gaat, zie je dat ook. Hetzelfde gebeurt met een gesynchroniseerde vlucht als je er zelf een tussenstop aan toevoegt.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Roadtrip',
  'help.ctx.trip-roadtrip.summary':
    'De planning als één rit: dezelfde dagen en dezelfde plekken, verbonden als stops met de rijtijd ertussen, in een strook in de linkerkolom en op de kaart. Je ziet de afstand en de rijtijd, waar je moet tanken en wat er langs de weg ligt.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Met Dagen en Roadtrip bovenaan de linkerkolom wissel je tussen de dagplanning en de rit. Er wordt niets gekopieerd of gewijzigd: Dagen toont de planning precies zoals die was.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Bovenaan de balk staan de totalen van de reis: Afstand, Rijtijd en Stops. Daaronder staat een kaart voor elke dag met een rit: het nummer en de datum van de dag op een tegel, en daarna labels voor het aantal kilometers en de rijtijd, het aantal stops, wat de rit doorkruist, en een badge Track. Een geboekte vlucht, trein of veerboot staat als aparte kaart in de reeks.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Een genummerde stop is een plaats waar de dag om draait. Een stop onderweg, zoals tanken, laden of een rustplaats, heeft het pictogram van zijn soort in plaats van een nummer en telt niet mee. Klik op een nummer om te wijzigen wat voor stop het is, klik op de badge Verblijf om in te stellen hoelang je blijft, en sleep een stop om hem binnen de dag of naar een andere dag te verplaatsen.',
  'help.ctx.trip-roadtrip.bullet.4':
    "Tussen twee stops toont een ritbalk de afstand en tijd van dat deel van de route. Klik erop voor 'Routes voor dit traject', of klik op de route op de kaart om het traject via een tussenpunt te laten lopen.",
  'help.ctx.trip-roadtrip.bullet.5':
    'De rechterkolom wordt ‘Onderweg’: kies op één regel wat je zoekt en de dag, hoe breed de corridor is, en klik dan op ‘Zoeken’. Met de plus bij een resultaat, ‘Toevoegen’, voeg je het toe aan de rit op het punt waar je er echt langskomt, en met het bedpictogram bij een hotel voeg je een overnachting toe. ‘Handmatig’ voegt een plaats toe die de zoekopdracht niet vond, en met de drie puntjes naast de titel importeer je een Google Maps-route.',
  'help.ctx.trip-roadtrip.bullet.6':
    '‘Rij-instellingen’ daaronder bevat de limieten, de auto en de actieradius, de dagelijkse reistijden, wat je wilt vermijden, hoe de lijn wordt getekend en of actuele waarschuwingen op de kaart verschijnen. Ze horen bij de reis, dus iedereen plant met dezelfde auto.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'De reis als één rit bekijken',
  'help.guide.roadtrip-mode.goal': 'Zet de planning in roadtripmodus en begrijp wat de strook laat zien.',
  'help.guide.roadtrip-mode.step.1':
    'Klik boven in de linkerkolom, in de schakelaar Dagen en Roadtrip, op Roadtrip. Het dagplan wordt vervangen door de rit, en de kaart toont elke dag die een route heeft.',
  'help.guide.roadtrip-mode.step.2':
    'De kaart bovenaan de rail telt de hele reis op: ‘Afstand’, ‘Rijtijd’ en ‘Stops’. Die blijft staan als je door de dagen scrolt.',
  'help.guide.roadtrip-mode.step.3':
    'Daaronder staat een kaart voor elke dag met een rit; een dag zonder rit wordt overgeslagen. De kop van de kaart toont het dagnummer met de datum eronder, en daarna pillen voor de afstand en de tijd van de rit en voor het aantal stops op die dag.',
  'help.guide.roadtrip-mode.step.4':
    'Op de kaart zie je de dag als een reeks: een genummerde stop voor elke plaats, een rijgedeelte tussen elk paar stops, en rechts de aankomsttijd. Een geboekte vlucht, trein of veerboot staat als eigen kaart in de reeks.',
  'help.guide.roadtrip-mode.step.5':
    'Klik op de kop van een dag om hem in te klappen. Het pijltje aan het eind draait dan mee. Een ingeklapte dag wordt ook op de kaart verborgen. Klik nog een keer op de kop om hem weer te tonen.',
  'help.guide.roadtrip-mode.result':
    'De linkerkolom toont de rit en de kaart toont alle dagen ervan. Met Dagen ga je meteen terug naar de planning, die onveranderd is.',
  'help.guide.roadtrip-mode.tip.1':
    'De keuze wordt per reis in je account opgeslagen. Na herladen, in een andere browser of op een ander apparaat opent de reis dus weer in de roadtripweergave.',
  'help.guide.roadtrip-mode.tip.2':
    'De schakelaar verschijnt pas als een beheerder de add-on Roadtrip heeft aangezet, onder Add-ons in het beheerpaneel.',
  'help.guide.roadtrip-mode.tip.3':
    'Op een telefoon is er geen schakelaar: de add-on voegt een eigen tabblad Roadtrip toe naast Planning.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Tussenstops onderweg, en hoe lang je blijft',
  'help.guide.roadtrip-stops.goal':
    'Maak van een plek langs de route een tussenstop en stel in hoe lang elke stop duurt.',
  'help.guide.roadtrip-stops.step.1':
    'Klik in de strook op het nummer voor een stop. Het label is ‘Maak er een stop onderweg van’, en eronder verschijnen de soorten stops als een rij gekleurde rondjes.',
  'help.guide.roadtrip-stops.step.2':
    'Kies een soort. Beweeg de muis over een rondje om de naam te zien: Accommodatie, Brandstof, Laden, Rustplaats, Camping, Eten of Bezienswaardigheden. Het nummer verandert in het pictogram van die soort, en de stops eronder worden opnieuw genummerd.',
  'help.guide.roadtrip-stops.step.3':
    'Een stop onderweg is geen bestemming, dus de kop van de dag telt één stop minder.',
  'help.guide.roadtrip-stops.step.4':
    "Klik nog eens op het icoon, 'Soort stop wijzigen', en kies 'Weer een bestemming' om de stop zijn nummer terug te geven.",
  'help.guide.roadtrip-stops.step.5':
    'Elke stop heeft een badge Verblijf, met een plusje zolang er niets is gepland. Klik erop om ‘Tijd bij deze stop’ te openen.',
  'help.guide.roadtrip-stops.step.6':
    'Stel de duur in met de schuifregelaar, met de min- en plusknoppen of met een van de voorinstellingen. Vertrek verandert mee, terwijl Aankomst op het tijdstip blijft waarop de rit aankomt. Klik daarna op Opslaan.',
  'help.guide.roadtrip-stops.result':
    'De badge Verblijf van de stop die je hebt gewijzigd, toont de nieuwe duur, en alle aankomsttijden erna schuiven mee. Een stop die je in een ander soort stop hebt veranderd en weer terug, is weer een genummerde bestemming.',
  'help.guide.roadtrip-stops.tip.1':
    'Een verblijfsduur hoort bij de plek, niet bij één bezoek: een plek die op twee dagen gepland staat, heeft op beide dagen dezelfde verblijfsduur.',
  'help.guide.roadtrip-stops.tip.2':
    'Stops onderweg zie je ook onder Dagen. Zet je ‘Ook in Dagen tonen’ uit, onder Servicestops in de Rij-instellingen, dan staan ze alleen in Roadtrip.',
  'help.guide.roadtrip-stops.tip.3': 'Met ‘Geen verblijf’, in hetzelfde venster, haal je de tijd weer weg.',
  'help.guide.roadtrip-stops.tip.4':
    'Klik op een stop onderweg of een geboekte nacht om de kaart ervan boven de landkaart te openen. Staat Roadtrip aan, dan opent Bewerken daar het compacte venster van het zoeken in plaats van het formulier voor een plek. Met ‘Meer details’ in dat venster open je het volledige formulier.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Tanken, eten en overnachten langs de route',
  'help.guide.roadtrip-corridor.goal':
    'Zoek langs de weg die je echt rijdt, en voeg wat je vindt toe aan het juiste traject.',
  'help.guide.roadtrip-corridor.step.1':
    "Open onder 'Gezocht wordt' de lijst en vink aan wat je nodig hebt. Je kunt Brandstof, Laden, Rustplaats, Camping, Accommodatie, Eten en Bezienswaardigheden combineren: de lijst blijft open voor een tweede keuze, en het veld toont daarna een icoon voor elke soort.",
  'help.guide.roadtrip-corridor.step.2':
    'Kies de dag in het keuzemenu aan het eind van dezelfde regel. Je ziet daar de dagen waarvoor de strook een kaart heeft, en Zoeken wacht tot de route voor de gekozen dag is berekend.',
  'help.guide.roadtrip-corridor.step.3':
    'Kies onder Binnen hoe ver aan weerszijden van de weg er gezocht wordt, 2 km, 5 km of 10 km, en klik op Zoeken.',
  'help.guide.roadtrip-corridor.step.4':
    'De resultaten zijn gegroepeerd per soort, in de volgorde waarin je ze passeert. Bij elk resultaat zie je hoe ver het van de route ligt en hoe ver het in de rit van die dag zit.',
  'help.guide.roadtrip-corridor.step.5':
    'Klik op ‘Toevoegen’, de plus bij een resultaat. ‘Als stop toevoegen’ toont op welke dag en op welke plek het wordt toegevoegd, en vraagt om ‘Soort stop’ en ‘Tijd bij deze stop’; bij een laadpaal zie je ook ‘Beschikbaarheid en tarieven’. ‘Toevoegen’ zet het op de rit, en ‘Meer details’ opent in plaats daarvan het volledige plaatsformulier.',
  'help.guide.roadtrip-corridor.result':
    'De stop die je hebt toegevoegd, verschijnt op de route op het punt waar je erlangs komt, met het pictogram van de soort. De route van de dag wordt opnieuw via de stop berekend, en daardoor wordt de lijst leeggemaakt: zoek opnieuw voor de volgende stop.',
  'help.guide.roadtrip-corridor.tip.1':
    'Er wordt pas gezocht als je op Zoeken drukt: één zoekopdracht stuurt veel verzoeken naar een gedeelde dienst.',
  'help.guide.roadtrip-corridor.tip.2':
    "'Filteren op naam' filtert de resultaten zonder opnieuw te zoeken, en 'Resultaten wissen' maakt de lijst leeg en haalt de spelden weg. Klik op een resultaat om het op de kaart te tonen.",
  'help.guide.roadtrip-corridor.tip.3':
    'Je kunt een resultaat ook van de kaart op de route slepen. Zo kies je zelf het traject als je dezelfde weg twee keer rijdt. Met Handmatig, naast Zoeken, voeg je een plaats toe die de zoekopdracht niet vond, door hem op naam op te zoeken.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Een traject via een tussenpunt laten lopen',
  'help.guide.roadtrip-via.goal':
    'Laat een traject over de weg gaan die jij wilt, zonder er een stop aan toe te voegen.',
  'help.guide.roadtrip-via.step.1':
    'Breng het gewenste traject in beeld op de kaart: klik in de strook op een stop en sluit dan de kaart die boven de landkaart opent.',
  'help.guide.roadtrip-via.step.2':
    'Klik op de getekende route. Er wordt een tussenpunt toegevoegd op het traject waarop je klikte, en het traject wordt opnieuw via dat punt berekend.',
  'help.guide.roadtrip-via.step.3':
    'De strook wordt bijgewerkt: de kop van de dag toont de nieuwe afstand en rijtijd, en alle aankomsttijden na het tussenpunt veranderen mee.',
  'help.guide.roadtrip-via.step.4':
    'Ga met de muis over de greep om te zien wat die doet: slepen om de route aan te passen, rechtsklikken om te verwijderen. Sleep de greep naar een andere plek, dan wordt dat deel van de route opnieuw getekend via het nieuwe punt.',
  'help.guide.roadtrip-via.step.5':
    'Klik met rechts op de greep om hem te verwijderen. Het traject volgt dan weer de directe route.',
  'help.guide.roadtrip-via.result':
    'Het traject volgt de weg die je hebt gekozen, en de afstand, de rijtijd en de aankomsttijden van de dag worden opnieuw berekend.',
  'help.guide.roadtrip-via.tip.1':
    'Een tussenpunt is geen stop: het heeft geen nummer, geen verblijfsduur en geen aankomsttijd, en het telt niet mee bij de stops van de dag.',
  'help.guide.roadtrip-via.tip.2':
    'De sleeppunten verschijnen pas vanaf zoomniveau 9. Op een kaart met de hele reis zie je dus alleen de lijn.',
  'help.guide.roadtrip-via.tip.3':
    'Een klik op meer dan twee kilometer van een getekend traject wordt genegeerd, net als een klik op een vlucht, trein of veerboot.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Een andere route voor een traject proberen',
  'help.guide.roadtrip-alternatives.goal':
    'Bekijk welke andere routes de routeplanner voor een deel van de rit voorstelt, en kies er een.',
  'help.guide.roadtrip-alternatives.step.1':
    "Klik in de zijbalk op een ritbalk, de rij tussen twee stops met de afstand en tijd van het traject. Het label is 'Andere routes'.",
  'help.guide.roadtrip-alternatives.step.2':
    "'Routes voor dit traject' opent over de kaart, met één regel per weg en de lengte ervan. De kaart tekent elke weg met de rijtijd: je huidige weg in donkerblauw, de andere in lichtblauw.",
  'help.guide.roadtrip-alternatives.step.3':
    'Beweeg de muis over een regel om die weg te laten oplichten. Huidig is de weg die je nu neemt en Snelste de snelste. Bij de andere zie je hoeveel langzamer ze zijn of welk type weg ze vermijden.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klik op een regel om die route te gebruiken, of op Sluiten om de huidige route te houden.',
  'help.guide.roadtrip-alternatives.result':
    'Het traject gebruikt nu de weg die je hebt gekozen, en de afstand in de zijkolom en de aankomsttijden daarna veranderen mee.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Kies je een andere weg, dan controleert TREK die eerst met de routeplanner van de roadtrip. Daarna houdt TREK het traject op die weg met zo weinig tussenpunten als nodig, en vervangt het de tussenpunten die het traject al had. Een weg die de routeplanner niet kan volgen, wordt niet opgeslagen. Kies je de weg van de routeplanner zelf, dan verdwijnen de tussenpunten weer.',
  'help.guide.roadtrip-alternatives.tip.2':
    "'Zonder snelweg', 'Zonder tol' en 'Zonder veerboot' komen van een tweede routeplanner met een eigen snelheidsmodel, dus die tijden zijn niet te vergelijken met de andere.",
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'De auto en de rijlimieten instellen',
  'help.guide.roadtrip-limits.goal':
    'Vertel TREK in wat voor voertuig je rijdt en hoe ver je zonder pauze wilt rijden.',
  'help.guide.roadtrip-limits.step.1':
    'Rij-instellingen staat onder het zoekveld in de rechterkolom. De labels laten zien wat er is ingesteld. Klik erop om het te openen.',
  'help.guide.roadtrip-limits.step.2':
    'Onder Auto staan ‘Langste rit achtereen’ en ‘Rijden per dag’ in minuten. Een leeg veld betekent uit, en dan wordt er niets gemarkeerd.',
  'help.guide.roadtrip-limits.step.3':
    'Geef onder Voertuig aan waarin je rijdt. Bij Benzine wordt alleen bij tankstops bijgetankt, bij Elektrisch alleen bij laadstops, bij Beide bij allebei.',
  'help.guide.roadtrip-limits.step.4':
    'Vul zelf ‘Bereik per tank’ of ‘Actieradius per lading’ in. Of open ‘Uit de autogegevens berekenen’, onder ‘Vullen tot’: daar wordt met Tankinhoud en Verbruik, of met Accu, Verbruik en Accuslijtage, het bereik berekend.',
  'help.guide.roadtrip-limits.step.5':
    '‘Vermijden waar het kan’, in de linkerkolom, is een voorkeur en geen verbod: is er op een dag geen andere weg, dan wordt de weg toch gebruikt en verschijnt er een opmerking in de kop van die dag.',
  'help.guide.roadtrip-limits.step.6':
    'Klik op ‘Sluiten’. De badges op de kaart tonen wat is ingesteld, en de rail markeert elk traject en elke dag die een limiet overschrijdt.',
  'help.guide.roadtrip-limits.result':
    'De labels op de kaart tonen wat er is ingesteld, en elk traject en elke dag die over een limiet gaat, krijgt een label in de strook.',
  'help.guide.roadtrip-limits.tip.1':
    'De instellingen horen bij de reis, dus iedereen die meereist, plant met dezelfde auto en dezelfde limieten.',
  'help.guide.roadtrip-limits.tip.2':
    '‘Vullen tot’ bepaalt tot hoever een stop de tank of accu vult, want onderweg laadt niemand tot 100 %. Een tank- of laadstop kan dat overschrijven met de batterijbadge op de rij.',
  'help.guide.roadtrip-limits.tip.3':
    "Onder Routelijn berekent 'Dagen verbinden' ook de rit van de laatste stop van de ene dag naar de eerste stop van de volgende dag. Met 'Elke dag bij je verblijf beginnen en eindigen' begint en eindigt elke dag bij de accommodatie die voor die nachten is geboekt. 'Een kleur per dag' toont elke dag in een eigen kleur.",
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'De rijdag een begin en een einde geven',
  'help.guide.roadtrip-day-window.goal':
    'Stop met rijden op een tijdstip dat je zelf kiest en bepaal waar de dag eindigt.',
  'help.guide.roadtrip-day-window.step.1':
    'Open ‘Rij-instellingen’ in de rechterkolom en zoek ‘Dagelijkse reistijden’ in de linkerkolom van het venster.',
  'help.guide.roadtrip-day-window.step.2':
    'Stel ‘Begin van de dag’ in. Alleen dat doet nog niets: je hebt beide tijden nodig, zoals de opmerking eronder aangeeft.',
  'help.guide.roadtrip-day-window.step.3':
    'Stel ‘Einde van de dag’ in. De rit stopt nu op dat tijdstip en gaat de volgende ochtend verder. In de zijkolom zie je dat als een rij ‘Einde van de dag’ en een rij ‘Reis hervatten’.',
  'help.guide.roadtrip-day-window.step.4':
    'Kies onder ‘Dag afsluiten’ voor Onderweg om op de eindtijd onderweg te pauzeren, of voor ‘Bij de laatste plek’ om te stoppen voordat de volgende rit over die tijd heen zou gaan.',
  'help.guide.roadtrip-day-window.step.5':
    'Klik op ‘Sluiten’. Op de kaart Rij-instellingen staan de twee tijden nu als badge.',
  'help.guide.roadtrip-day-window.result':
    'De rit wordt verdeeld over reisdagen met de lengte die je hebt ingesteld, en wat niet past, gaat verder op berekende dagen na de laatste dag. Je dagen en de plaatsen daarin worden niet gewijzigd.',
  'help.guide.roadtrip-day-window.tip.1':
    'Maak je een van beide tijden leeg, dan staat deze functie weer uit. Tijden die je zelf bij een stop hebt ingesteld, gaan altijd voor.',
  'help.guide.roadtrip-day-window.tip.2':
    'Zijn er dagelijkse reistijden ingesteld, dan zijn de dagen altijd verbonden: de rit van de laatste stop van de ene dag naar de eerste stop van de volgende dag wordt berekend en meegeteld.',
  'help.guide.roadtrip-day-window.tip.3':
    'Elk einde van een dag is ook een markering op de kaart: een maantje met het dagnummer. Sleep het langs de route, of naar een plaats, om de dag ergens anders te laten eindigen. Klik er met de rechtermuisknop op om het automatische einde terug te zetten. Met ‘Automatische dageinden herstellen’ in dit venster draai je al deze wijzigingen terug. Wil je een dag bij een bepaalde stop laten eindigen, klik dan op de stop en zet ‘Dag hier beëindigen’ aan op de kaart ervan.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tanken voordat de tank leeg is',
  'help.guide.roadtrip-refuel.goal':
    'Zoek een plek om te tanken op het deel van de route dat de auto nog kan halen, en voeg die toe aan de rit.',
  'help.guide.roadtrip-refuel.step.1':
    'Heb je een actieradius ingesteld, dan toont de zijkolom een balk op het traject waar de brandstof of de accu opraakt: ‘Hier is de tank leeg’, of bij een elektrische auto ‘Hier is de accu leeg’. Daaronder zie je hoe ver op het traject dat is.',
  'help.guide.roadtrip-refuel.step.2':
    'Het lampje op de balk is de knop: ‘Tankstation zoeken’, of bij een elektrische auto ‘Laadpunt zoeken’. Er wordt gezocht langs de weg vóór dat punt, en zolang het zoeken loopt, zie je ‘Zoeken langs de route…’.',
  'help.guide.roadtrip-refuel.step.3':
    'Je ziet maximaal drie tankstations, elk met de afstand tot de route en hoeveel actieradius je dan nog over hebt.',
  'help.guide.roadtrip-refuel.step.4':
    "Met het plusje bij een resultaat voeg je het toe als tankstop. 'Als stop toevoegen' opent met het type en de tijd al ingevuld, en Toevoegen zet de stop op het traject, op het punt waar de route er echt langs gaat.",
  'help.guide.roadtrip-refuel.result':
    'De stop verschijnt op het juiste traject met een eigen icoon, en de actieradius wordt vanaf die stop opnieuw berekend. De balk schuift op naar het punt waar de tank nu leeg is, of verdwijnt als je het einde van de rit zonder nieuwe stop haalt.',
  'help.guide.roadtrip-refuel.tip.1':
    'De actieradius telt vanaf de laatste tank- of laadstop, ook over meerdere dagen. Je type voertuig bepaalt welke stops meetellen: bij Benzine alleen tankstops, bij Elektrisch alleen laadstops.',
  'help.guide.roadtrip-refuel.tip.2':
    'Er wordt gezocht op de weg vóór het punt waar de tank leeg raakt, met een reserve en met de omweg dubbel gerekend. Elke plek die je ziet, is dus echt bereikbaar.',
  'help.guide.roadtrip-refuel.tip.3':
    'Zijn er geen resultaten, dan kun je opnieuw zoeken: het lampje verandert in ‘Opnieuw proberen’, want het zoeken naar plekken is een gedeelde dienst die soms een time-out geeft.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Een dag een geïmporteerde track laten volgen',
  'help.guide.roadtrip-track.goal':
    'Gebruik een mooie route die je als GPX- of KML-track hebt geïmporteerd voor de rit van een dag.',
  'help.guide.roadtrip-track.step.1': 'Klik op de badge Track in de kop van een dag. Het venster opent bij die dag.',
  'help.guide.roadtrip-track.step.2':
    'Kies een track. Bij elke track zie je de lengte, en of hij de route van deze dag volgt of hoe ver hij ervan af ligt. De dichtstbijzijnde track staat bovenaan.',
  'help.guide.roadtrip-track.step.3':
    'Klik op ‘Deze track volgen’. TREK zet tussenpunten waar de route het verst van de track afwijkt, berekent de route opnieuw en herhaalt dat een paar keer.',
  'help.guide.roadtrip-track.step.4':
    'Het venster meldt hoeveel via-punten er zijn geplaatst en hoe dicht de rit nu bij de track blijft, of dat de rit de track al volgde. ‘Via-punten laten vallen’, linksonder, verwijdert ze, en de router plant de dag opnieuw. Sluit je het venster, dan blijft de track behouden.',
  'help.guide.roadtrip-track.result':
    'De rit van de dag volgt de track in plaats van de weg die de routeplanner zou kiezen. Beweeg de muis over het label Track om de naam van de track te zien. Houden tussenpunten de rit op de track, dan licht het label ook op.',
  'help.guide.roadtrip-track.tip.1':
    'Het venster toont de plaatsen van de reis die een pad hebben: een GPX of KML die is geïmporteerd met ‘Bestand importeren’ in de plaatsenkolom onder Dagen, met ‘Routes’ of ‘Tracks (met routegeometrie)’ aangevinkt bij een GPX, of ‘Paden (LineStrings)’ bij een KML. ‘Bestand importeren’ is er alleen zolang de add-on Tochten uitstaat; staat Tochten aan, dan wordt een GPX een tocht, en die toont dit venster niet. Zolang de reis geen track heeft, toont geen enkele dag de badge.',
  'help.guide.roadtrip-track.tip.2':
    'Een track volgen vervangt de tussenpunten die de trajecten van de dag al hadden. Pas een traject dus met de hand aan nadat je de track volgt, niet ervoor.',
  'help.guide.dateless-trip.step.1': 'Klik op ‘Nieuwe reis’ en geef de reis een naam.',
  'help.guide.edit-trip.tip.2':
    'Reisgenoten die je hier toevoegt of verwijdert, worden meteen bijgewerkt, ook zonder ‘Bijwerken’.',
  'help.guide.trip-reminder.result':
    'Je krijgt de herinnering het gekozen aantal dagen voor het begin van de reis, via de kanalen waarop je meldingen ontvangt.',
  'help.guide.upcoming-reservations.step.1':
    'Zoek ‘Aankomende reserveringen’ in de rechterkolom. Daar staan de volgende zes boekingen van al je reizen, de eerstvolgende bovenaan, met datum, tijd en type.',
  'help.guide.half-company-holiday.step.1': 'Zet de werkbalk op ‘Bedrijfsvakantie’.',
  'help.guide.edit-holiday-calendar.result': 'Het raster en de legenda worden na elke wijziging direct bijgewerkt.',
  'help.guide.person-color.result': 'Elke dag die de persoon heeft ingevoerd, staat nu in de nieuwe kleur.',
  'help.guide.answer-fusion-request.step.1':
    'Open Vakantie nadat iemand je heeft uitgenodigd. Het venster ‘Fusieverzoek’ opent vanzelf.',
  'help.guide.log-for-partner.step.1':
    'Klik in de kaart ‘Personen’ op de naam van de persoon. Een vinkje geeft aan dat die geselecteerd is.',
  'help.guide.dissolve-fusion.step.1': 'Open Instellingen.',
  'help.guide.country-places.step.2': 'Klik in de kaart op de badge ‘Plaatsen’, die met de speld.',
  'help.guide.search-place.tip.2': 'Is de regio al gemarkeerd, dan vraagt de pop-up of je hem juist wilt verwijderen.',
  'help.guide.tour-activity-stats.step.4':
    'De badges rechts laten zien waarop de totalen gebaseerd zijn: ‘Gepland’ voor tochten die met je reisplanning worden meegeteld, ‘Opgenomen’ voor tochten met een gekoppelde echte track. ‘Nog te gaan’, ‘Zonder dag’ en ‘Geen datum’ tellen de tochten die nog niet zijn meegenomen. De i legt de regel uit.',
  'help.guide.move-to-list.step.2':
    'Klik op ‘Naar lijst dupliceren’ om ze hier ook te houden, of op ‘Naar lijst verplaatsen’ om ze van deze lijst te halen.',
  'help.guide.accept-list-invite.title': 'Uitnodiging voor een lijst accepteren',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Kies onder ‘Waypoints’ de tegel met de waypoints om start, stops en eindpunt in hun volgorde toe te voegen, of ‘Alleen de lijn’ om alleen de opgeslagen lijn toe te voegen.',
  'help.guide.tour-collection-manage.step.1':
    'Open een lijst. Bij elke opgeslagen tocht zie je de moeilijkheidsgraad, het type, de reis waaruit hij is opgeslagen, de afstand en hoogtemeters, en het aantal waypoints. Ga met de muis over de reisnaam om te zien wie hem heeft opgeslagen.',
  'help.guide.entry-draft.step.1': 'Zet in de editor ‘Concept’ aan in de rechterkolom.',
  'help.guide.journey-map-layers.step.3':
    'Klik op een holle speld of een kleine stip op de kaart. Een kaartje laat zien wat het is: een geplande plaats met zijn dag, of een bezoek met ‘Verhaal openen’, dat je naar het bijbehorende dagverslag brengt.',
  'help.guide.journey-keep-route.step.3': 'Klik op ‘Route bewaren’.',
  'help.guide.journey-day-stays.step.3':
    'Klik bij een bezoek dat je niet wilt op ‘Hier ben ik niet geweest’. Het bezoek verdwijnt uit de lijst.',
  'help.guide.journey-take-over-day.step.3':
    'Wil je één vermelding voor de hele dag? Zet ‘Vermeldingen’ op ‘Dagverslag’: één vermelding toont dan elk gekozen bezoek met de tijden.',
  'help.guide.journey-auto-prepare.step.2':
    'Zet onder ‘Vastgelegde dagen’ de optie ‘Opgenomen dagen automatisch voorbereiden’ aan.',
  'help.guide.photo-location.step.2': "Zet onder ‘Foto's’ de optie ‘Items plaatsen op basis van hun foto's’ aan.",
  'help.guide.link-trip.tip.3':
    'Schrijf je een vermelding op een dag van een reis die nog niet is gekoppeld, dan biedt de editor direct in de vermelding ‘Reis koppelen’ aan.',
  'help.ctx.settings-plugins.summary':
    'Je eigen instellingen voor de plugins die de beheerder heeft geïnstalleerd: de sleutels en voorkeuren die elke plugin vraagt, en een logboek van wat plugins namens jou hebben gedaan. Het tabblad verschijnt alleen zolang er een plugin actief is.',
  'help.ctx.settings-about.bullet.3':
    'Via Ko-fi, Buy Me a Coffee en Discord kun je TREK steunen of met de makers praten.',
  'help.guide.language-region.step.3':
    'Stel de ‘Weergavevaluta’ in, of kies ‘Valuta van de reis’ om elke reis in zijn eigen valuta te zien. Kies daarna ‘Temperatuureenheid’, ‘Afstandseenheid’, ‘Tijdnotatie’ en bij ‘Week begint op’ de eerste dag van de week.',
  'help.guide.travel-map-prefs.step.3':
    '‘Plaatsen op de kaart ontdekken’ toont de categoriepil om plaatsen in de buurt te vinden. ‘Boekingscodes vervagen’ verbergt bevestigingsnummers tot je er met de muis overheen gaat of erop tikt. ‘Route optimaliseren vanaf accommodatie’ laat een dag bij je hotel beginnen en eindigen.',
  'help.guide.web-push-device.step.2':
    'In de kaart ‘Meldingen’ bovenaan bepaal je in de kolom ‘Push’ welke gebeurtenissen naar je apparaten worden gestuurd.',
  'help.guide.connect-airtrail.goal': 'Laat TREK de vluchten uit je eigen AirTrail importeren en synchroniseren.',
  'help.guide.connect-dawarich.goal': 'Laat TREK uit je eigen Dawarich uitlezen waar je echt bent geweest.',
  'help.guide.tour-connect-wanderer.goal':
    'Laat TREK de trails uit je eigen wanderer lezen, zodat je ze als tochten kunt importeren.',
  'help.guide.tour-wanderer-watch.title': 'Melding krijgen als je wanderer-trails veranderen',
  'help.guide.plugin-settings.tip.2':
    'Een pluginkanaal onder ‘Meldingen’ heeft een knop ‘Instellen’ die deze pagina opent.',
  'help.guide.default-user-settings.result':
    'Nieuwe accounts, en iedereen die deze instellingen nooit heeft aangepast, krijgen jouw keuzes te zien.',
  'help.guide.own-routing-engine.goal':
    'Plan routes voor dagen en roadtrips via een OSRM- of Valhalla-server die je zelf draait, in plaats van via de openbare servers.',
  'help.guide.admin-passkeys.tip.1':
    'Kan TREK nog geen domein bepalen, dan meldt een waarschuwing dat, en blijven passkeys verborgen tot je APP_URL of de Relying Party ID instelt.',
  'help.guide.rotate-jwt-secret.step.1':
    'Klik onderaan het tabblad Instellingen, onder ‘Gevarenzone’, op ‘Vernieuwen’ naast ‘JWT-geheim roteren’.',
  'help.guide.storage-backends.tip.3':
    'TREK kan de fotocaches opnieuw downloaden, dus ze spiegelen kost meestal alleen maar opslagruimte.',
  'help.guide.admin-channels.step.3':
    'Kies in de kaart ‘Meldingen’ hieronder per gebeurtenis via welke kanalen die wordt verstuurd: ‘Nieuwe versie beschikbaar’, ‘Opslagreplica mislukt’ en ‘Peddelregio aangevraagd’. Elke schakelaar wordt direct opgeslagen.',
  'help.guide.notification-defaults.tip.1':
    '‘Uit’ is een standaard die elke gebruiker zelf nog kan aanzetten; ‘Geblokkeerd’ zet het voor iedereen uit.',
  'help.ctx.notifications.bullet.4':
    'Naast de tijd van elke melding staan ‘Markeren als gelezen’ (het dubbele vinkje) en ‘Verwijderen’ (de prullenbak) voor die ene melding. ‘Alles als gelezen markeren’ en ‘Alles verwijderen’ bovenaan gelden voor de hele lijst.',
  'help.guide.read-notifications.tip.2':
    'Een melding zonder knop is alleen ter informatie. Lees hem in het paneel en markeer hem daar als gelezen.',
  'help.guide.filter-notifications.result': 'De lijst toont alleen wat nog ongelezen is, de nieuwste bovenaan.',
  'help.guide.delete-notifications.title': 'Meldingen verwijderen',
  'help.guide.notification-settings.goal':
    'Bepaal welke gebeurtenissen onder het belletje verschijnen en welke je ook per e-mail, webhook, ntfy of push ontvangt.',
  'help.guide.public-link.step.4': 'Klik op ‘Link aanmaken’, dan op ‘Kopiëren’, en stuur de link door.',
  'help.guide.link-journal.step.2':
    'Klik op ‘Dagboek koppelen’ en kies bij ‘Kies een reisverslag’ een van je reisverslagen.',
  'help.guide.dawarich-stays.title': 'Een vastgelegd bezoek omzetten in een plaats',
  'help.guide.dawarich-stays.tip.2':
    'Verwijder je een plaats die uit een bezoek is ontstaan, dan komt het bezoek weer als wachtend in de lijst.',
  'help.guide.leave-stop-off-route.goal':
    'Houd een stop op de dag zonder dat de route erheen gaat, voor een plek waar je te voet langskomt of die je alleen op de kaart wilt zien.',
  'help.guide.day-route.tip.4':
    'Wil je een stop wel op de dag maar niet in de route, kies dan ‘Uit de route halen’ in het menu van die stop.',
  'help.guide.move-booking-day.step.2':
    'Sleep de rij naar de kop van een andere dagkaart. Een boeking van één dag gaat in zijn geheel naar die dag. Bij een boeking over meerdere dagen verplaatst de rij ‘Vertrek’ de dag waarop hij begint en de rij ‘Aankomst’ de dag waarop hij eindigt.',
  'help.guide.place-image-from-file.title': 'Een bijgevoegde foto als afbeelding van de plaats gebruiken',
  'help.guide.place-image-from-file.tip.2':
    'Ook een foto die aan de stop is vastgemaakt of aan de boeking is toegevoegd, wordt aangeboden.',
  'help.guide.place-own-hours.step.5':
    'Klik op ‘Bijwerken’. De kaart toont nu jouw tijden onder ‘Openingstijden’, en ‘Open’ of ‘Gesloten’ bovenaan is daarop gebaseerd.',
  'help.guide.confirm-stay-booking.step.3':
    'Klik bovenaan op ‘In behandeling’. De tooltip toont ‘Zet op Bevestigd’, en de stip wordt groen.',
  'help.guide.map-nearby-places.tip.4':
    'Een categorie waarvoor het zoeken is mislukt, krijgt een rode stip, en ‘Dit gebied doorzoeken’ wordt rood met een waarschuwingsteken: klik erop om het opnieuw te proberen.',
  'help.guide.tour-map-lines.tip.1':
    'Klap je een dag in de dagenkolom in, dan worden de tochten en stops van die dag op de kaart verborgen.',
  'help.guide.car-stops.step.3':
    'Typ een titel in de kop. Kies onder ‘Route’ bij ‘Van’ waar je de auto ophaalt en bij ‘Naar’ waar je hem inlevert; de plaatsen van de reis zelf worden aangeboden voordat je typt. ‘Ophalen’ en ‘Ophaaltijd’ geven aan wanneer je hem ophaalt, ‘Inleveren’ en ‘Inlevertijd’ wanneer je hem inlevert.',
  'help.guide.transport-details.step.1':
    'Klik op het tabblad Transport op een kaart. De details openen over het tabblad, met de kop in dezelfde kleur als de kaart. De rij van een vervoersboeking in het dagplan opent dezelfde details.',
  'help.guide.export-transports-csv.tip.2':
    'Het tabblad Boekingen heeft hetzelfde pictogram en maakt een eigen bestand, dat eindigt op bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'Kies bij ‘Groeperen op’ voor Status, Dag, Type of ‘Niet groeperen’. Het tabblad wordt meteen in die secties ingedeeld.',
  'help.guide.export-bookings-csv.result':
    'Je browser downloadt een bestand met de naam van de reis en het tabblad, bijvoorbeeld herfst-in-japan-bookings.csv, met een rij voor elke boeking die op het tabblad stond.',
  'help.guide.arrange-packing-list.result':
    'De lijsten staan in de volgorde waarin je ze hebt gesleept, en de items staan op ‘A tot Z’ tot je dit uitzet. TREK bewaart je eigen volgorde wel.',
  'help.guide.count-packed-pieces.step.2':
    'Voor het aantal verschijnt een teller: 0/5, met een min en een plus. Klik op de plus voor elk stuk dat in de tas gaat.',
  'help.guide.expense-receipts.step.4':
    'Terug in het overzicht heeft de rij naast de naam een chip ‘Bonnetje’, met het aantal tussen haakjes als het er meer zijn. Klik erop om het bonnetje te openen.',
  'help.guide.final-budget.tip.3':
    'Iemand die de reis heeft verlaten, houdt een rij in ‘Saldi’ en ‘Eindbudget’ zolang die persoon nog geld krijgt of moet betalen.',
  'help.guide.files-sync-settings.step.2':
    'De stroombalk toont TREK en jouw opslag met de documenten die elk bevat, en daartussen twee banen: ‘Naar de opslag’ en ‘Uit de opslag’. Klik op ‘Naar de opslag’ om die uit te zetten. De baan wordt grijs en de regel onder de banen luidt ‘Alleen binnenkomend’. Klik er nog eens op om hem weer aan te zetten.',
  'help.guide.files-sync-settings.tip.4':
    'Alleen de eigenaar van de reis of een beheerder kan dit wijzigen. Andere leden zien de stroombalk met een regel als ‘Documenten gaan beide kanten op’, maar geen ‘Instellingen’.',
  'help.guide.manage-notes.step.2':
    '‘Uitvouwen’ opent de hele notitie: de volledige tekst, de ‘Website’ en de ‘Bestanden’. Klik op een bestand voor een voorbeeld. Met ‘Bewerken’ onderaan ga je direct naar de editor; met het kruisje rechtsboven sluit je de notitie weer.',
  'help.guide.note-categories.goal':
    'Geef de notities van de groep categorieën met een naam en een kleur, en toon steeds één categorie.',
  'help.guide.note-categories.tip.1':
    'Met de prullenbak verwijder je alleen een categorie die door geen enkele notitie wordt gebruikt. Een categorie die nog in gebruik is, blijft in de lijst tot je die notities naar een andere categorie verplaatst.',
  'help.guide.roadtrip-reorder.title': 'Een stop verplaatsen of naar een andere dag zetten',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK vraagt niets over een tijd die je hebt vastgezet: de rail berekent de dag meteen opnieuw en markeert elke stop die niet meer op tijd te halen is.',
  'help.guide.roadtrip-overnight.step.3':
    'Bovenaan het venster voegt ‘Overnachten’ een overnachting toe en maakt ‘Pauze’ er een korte stop van. Een hotel opent met ‘Overnachten’, een camping met ‘Pauze’. Voor een overnachting is alleen ‘Inchecken’ nodig, en dat mag je leeg laten.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Klik bij een tank- of laadstop in de rail op de batterijbadge. Die toont tot welk niveau de stop bijvult: vaag zolang je waarde bij ‘Vullen tot’ geldt, volledig gekleurd zodra de stop een eigen waarde heeft.',
  'help.guide.roadtrip-bookings.step.1':
    'Boek het traject als boeking van het type Vlucht, Trein, Veerboot, Cruise of Bus op de juiste dag, met beide eindpunten op de kaart. De autorit neemt het automatisch mee: de weg eindigt bij de terminal waar je vertrekt en gaat verder waar je aankomt.',
  'help.guide.roadtrip-google-import.result':
    'De stops van de route worden toegevoegd na de laatste stop van die dag, en de route in de rail en op de kaart loopt erlangs.',
  'help.guide.roadtrip-hazards.step.3':
    'De waarschuwingen staan als gebieden op de kaart. Klik op een gebied om te zien waar het om gaat, welke dienst het heeft gemeld en wanneer het voor het laatst is bijgewerkt.',
  'help.ctx.trip-tours.bullet.2':
    'Bovenaan importeer je met ‘GPX of KML importeren’ bestanden als tochten. De filterknop daaronder (eerst ‘Alle’, met het aantal tochten) filtert de lijst op status, bron, routelimiet en type.',
  'help.guide.tour-show-list.step.2':
    'Elke rij is één tocht. De gekleurde balk is de lijn op de kaart, en de ronde tegel toont de routelimiet (T1 tot T6) van een wandeling die in TREK is gepland, of het pictogram van het type. De badges onder de naam tonen de dagen waarop de tocht staat, de tijd, de afstand en de stijging. Bij een meerdaagse tocht geeft de maan met een getal aan hoeveel etappes hij heeft.',
  'help.guide.tour-add-to-day.title': 'Een tocht op een dag zetten',
  'help.guide.tour-add-to-day.tip.2':
    'Eindigt de reis vóór de laatste etappe, dan toont de optie de laatste etappe die nog past, en de etappes daarna blijven zonder dag.',
  'help.guide.tour-day-times.step.3':
    'Klik op ‘Bijwerken’. De rij toont nu start → einde. Een berekende eindtijd is lichter, met ≈ voor een schatting, ≥ zolang een verblijf nog geen tijd heeft en +1 na middernacht. Ga er met de muis overheen om te zien hoe hij is berekend.',
  'help.guide.tour-remove-from-day.goal': 'Haal een tocht uit de planning zonder hem te verwijderen.',
  'help.guide.tour-filter-list.goal':
    'Beperk een lange lijst tot de tochten die je zoekt: nog niet gepland, uit een bestand of van één type.',
  'help.guide.tour-filter-list.result':
    'Alleen de tochten waarop je hebt gefilterd, staan in de lijst; de andere zitten nog gewoon in de reis.',
  'help.guide.tour-hide-on-map.result':
    'Alleen de tochten die je wilt zien, staan op je kaart, en de verborgen tochten blijven gedimd in de lijst staan.',
  'help.guide.tour-import-plan-tab.result':
    'De track is nu een tocht van de reis: een rij in de lijst met een GPX-badge, en een lijn op de kaart.',
  'help.guide.tour-detail-read.title': 'Een tocht openen en de tochtkaart lezen',
  'help.guide.tour-detail-read.step.7': 'Sluit de kaart met de X bovenaan, of druk op Escape.',
  'help.guide.tour-rename-colour.goal':
    'Geef een tocht een naam die je herkent en een lijnkleur die goed opvalt op de kaart.',
  'help.guide.tour-take-along.title': 'Een tocht downloaden naar je telefoon of gps',
  'help.guide.tour-take-along.tip.4':
    'Op het tabblad Tochten staat dezelfde download bovenaan de linkerkolom. Heeft de tocht nog niet-opgeslagen wijzigingen, dan vraagt de download je eerst op te slaan.',
  'help.guide.tour-copy-keep.tip.1':
    'Het zijn allebei kopieën: latere wijzigingen aan de tocht veranderen niets aan de kopie of aan de versie die je in de collectie hebt opgeslagen.',
  'help.guide.tour-packing-link.step.2':
    'Kies bij ‘Koppelen aan’ voor ‘Hele inpaklijst’ of een van de lijsten. Elke rij toont hoeveel items erin zitten.',
  'help.guide.tour-files.title': 'Bestanden aan een tocht toevoegen',
  'help.guide.tour-activity-link.title': 'De track koppelen die je echt hebt gevolgd',
  'help.guide.tour-activity-link.tip.2':
    'Je kunt alleen een geïmporteerde track koppelen die niet is gebruikt om een tocht te plannen, en elke track maar aan één tocht.',
  'help.guide.tour-activity-compare.step.4':
    'Met ‘Wijzigen’ onder de track kies je een andere opname. ‘Ontkoppelen’ haalt hem van de tocht, en de track blijft als import in de reis.',
  'help.guide.tour-origin-check.step.3':
    'Een tocht die je op het tabblad Tochten hebt getekend, toont ‘gepland in TREK’, met bij ‘Aangemaakt’ de dag waarop hij is gemaakt.',
  'help.ctx.trip-tour-planner.bullet.2':
    'De linkerrail is de editor. Is er niets geopend, dan biedt hij ‘Nieuwe tocht plannen’. Een geopende tocht toont de naam, het type, de waypoints, de kaarten voor dat type en de details, met ‘Verwerpen’ en ‘Opslaan’ onderaan.',
  'help.guide.tour-open-workspace.step.2':
    'De linkerrail is de editor. Is er geen tocht geopend, dan biedt hij ‘Nieuwe tocht plannen’, waarmee je een tocht op de kaart begint.',
  'help.guide.tour-open-workspace.tip.3':
    'Open je een andere tocht terwijl de editor niet-opgeslagen wijzigingen bevat, dan krijg je eerst de keuze: ‘Wijzigingen verwerpen’ of verder bewerken.',
  'help.guide.tour-draw-route.step.5':
    'Klik de volgende punten aan in de volgorde waarin je ze loopt. Elke klik voegt het punt toe als nieuw eindpunt, en vanaf twee punten plant TREK de route over de paden.',
  'help.guide.tour-type-profile.goal':
    'Kies het soort tocht, en bij een fietstocht het profiel, zodat de route over de juiste wegen gaat.',
  'help.guide.tour-edit-points.title': 'Punten verplaatsen, ordenen en verwijderen',
  'help.guide.tour-edit-points.tip.1':
    'Het eerste punt heeft een badge ‘Start’ en het laatste ‘Einde’. Zet je een punt bovenaan of onderaan, dan wordt het de start of het einde.',
  'help.guide.tour-shaping-points.step.4':
    'Wil je een stop omzetten in een vormpunt of andersom, open dan ‘Meer acties’ op de rij en kies ‘Maak er een vormpunt van’ of ‘Maak er een stop van’.',
  'help.guide.tour-loop-reverse.step.2':
    'De laatste rij toont nu ‘Terug naar start’, en de route op de kaart eindigt waar hij begon.',
  'help.guide.tour-leg-by-hand.step.1':
    'Open ‘Meer acties’ bij het punt waar het stuk begint en kies ‘Volgende stuk met de hand tekenen’.',
  'help.guide.tour-trip-places.goal': 'Voeg een plaats die je al in de reis hebt gepland toe als stop van de tocht.',
  'help.guide.tour-trip-places.result': 'De tocht heeft een nieuwe stop voor de plaats uit de reis, met dezelfde naam.',
  'help.guide.tour-details-times.tip.2':
    'Bij een wandeling staan in Details ook ‘Maximale moeilijkheid van het pad’ en ‘Routekeuze’, die in de wandelhandleidingen worden uitgelegd. Een stadswandeling heeft geen ‘Pauzes’: in plaats daarvan telt de tijd die je bij de stops blijft.',
  'help.guide.tour-save.step.4': 'De tocht staat nu onder ‘Tochten van deze reis’, nog zonder dag.',
  'help.guide.tour-edit-saved.step.2':
    'Pas aan wat nodig is, net als bij een nieuwe tocht: verplaats of voeg punten toe, wissel van type of bewerk de details, zoals hier de ‘Beschrijving’.',
  'help.guide.tour-summary-profile.goal':
    'Bekijk hoe lang en hoe steil de tocht is, en waar op de route elke hoogte ligt.',
  'help.guide.tour-summary-profile.result':
    'Je weet hoe lang de tocht is, hoeveel hoogtemeters hij heeft, hoe lang hij duurt en waar hij steil wordt.',
  'help.guide.tour-list-manage.tip.1':
    'Elke tocht telt één keer mee in de totalen, ook als hij op meerdere dagen staat. Bij een totaal met ≥ ervoor ontbreken een paar tochten. Ga er met de muis overheen om te zien hoeveel.',
  'help.guide.tour-delete.tip.1':
    'Dit kan niet ongedaan worden gemaakt: ook ‘Ongedaan maken’ brengt een tocht niet terug.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Klik je toch op ‘Opslaan’, dan opent in plaats daarvan ‘Intussen gewijzigd’, en wordt er niets overschreven.',
  'help.ctx.trip-tour-import.bullet.2':
    '‘Importvoorbeeld’ toont elke track uit de bestanden op een kaart, met afstand, stijging, daling en punten, voordat er iets wordt opgeslagen. Onder ‘Importeren als’ geef je aan wat de tracks zijn.',
  'help.guide.tour-import-gpx.step.3':
    'Het ‘Importvoorbeeld’ opent; er is nog niets opgeslagen. De kaart toont het hele traject, en elke track uit de bestanden is een genummerde rij met afstand, stijging, daling en punten. Bij een opgenomen track staat ook wanneer hij is gemaakt en hoe lang hij duurde.',
  'help.guide.tour-import-gpx.result':
    'De tocht staat onder ‘Tochten van deze reis’, nog zonder dag. Is het er maar één, dan opent die meteen op de kaart als GPX-tocht.',
  'help.guide.tour-view-import.tip.3': 'Een trail uit wanderer opent op dezelfde manier, als wanderer-tocht.',
  'help.guide.tour-plan-from-import.tip.1':
    '‘Verwerpen’ verwijdert de suggestie. Er wordt niets bewaard tot je opslaat.',
  'help.guide.tour-restore-recorded.step.2': 'Klik op ‘Opgenomen track herstellen’.',
  'help.guide.tour-take-over.step.2': 'Kies ‘Tocht overnemen uit een andere reis’.',
  'help.guide.tour-take-over.result':
    'Een melding bevestigt de overname, en de tocht opent in de editor, klaar om op een dag te zetten.',
  'help.guide.tour-import-wanderer.tip.2':
    'De import is een kopie: latere wijzigingen in wanderer laten de tocht ongemoeid. Met ‘Bron controleren’ bij ‘Herkomst’ van de tocht zie je wanneer de trail is veranderd.',
  'help.ctx.trip-tour-map.bullet.3':
    'Met ‘Zoek plaats of adres’ bovenaan de kaart spring je naar een stad, een hut of een top, zonder iets aan de tocht toe te voegen.',
  'help.guide.tour-map-layers.result':
    'De tocht staat op de kaart die erbij past, en de pil toont welke kaart aan staat.',
  'help.guide.tour-along-search.step.3':
    'Kies onder ‘Binnen deze afstand van de route’ hoe ver van de lijn je wilt zoeken: 250 m, 500 m, 1 km of 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Laat de tocht langs een uitzichtpunt, hut of bron gaan die je onderweg hebt gevonden.',
  'help.guide.tour-along-add-stop.tip.3':
    'Een stuk waar je geen stop kunt toevoegen (een klettersteig of draagstuk dat als vaste lijn is toegevoegd, of een met de hand getekend stuk) blijft gedimd in de lijst staan, met de reden ernaast.',
  'help.guide.tour-3d-terrain.result':
    'Je hebt de tocht op het 3D-terrein gezien, met de steile stukken in kleur, en de platte kaart is terug om verder te plannen.',
  'help.guide.tour-3d-flyover.step.3':
    '‘Pauze’ stopt de vlucht waar hij is, en ‘Overvlucht afspelen’ gaat vanaf daar verder. ‘Opnieuw beginnen’ gaat terug naar het begin en start de vlucht opnieuw.',
  'help.guide.tour-map-overlays.step.1':
    'Open een skitocht op het tabblad Tochten. De pistes staan meteen aan: de schakelaar is de besneeuwde berg in de pil linksonder, ‘Pistes, langlaufloipes en liften’. Klik erop om ze op de kaart te verbergen, en nog een keer om ze weer te tonen.',
  'help.ctx.trip-tour-stages.title': 'Meerdaagse tochten',
  'help.guide.tour-multi-day.goal': 'Verdeel één route in etappes, één voor elke dag dat je onderweg bent.',
  'help.guide.tour-multi-day.tip.2':
    'Wil je twee etappes weer samenvoegen, kies dan ‘Etappe-einde verwijderen’ in het menu van de stop met de maan. Ook als je die stop verwijdert, worden ze samengevoegd, en een melding biedt ‘Ongedaan maken’.',
  'help.guide.tour-stages-on-days.step.3':
    'Kies ‘Etappes vanaf deze dag’: etappe 1 komt op die dag en elke volgende etappe op de dag erna. ‘Hele tocht op deze dag’ zet in plaats daarvan de hele route op die ene dag.',
  'help.guide.tour-stages-on-days.result':
    'Elke etappe staat op zijn eigen dag van de reis, en de etappe die je had geopend, staat in de editor.',
  'help.ctx.trip-tour-hike.bullet.6':
    '‘Tochtoverzicht’ rechts geeft de afstand, de stijging, de geschatte wandel- of looptijd, de pauzes en het geplande totaal, met het hoogteprofiel eronder. Met ‘Opslaan’ onderaan de editor sla je de tocht op.',
  'help.guide.tour-hike-plan.step.6': 'Klik op ‘Opslaan’ onderaan de linkerkolom.',
  'help.guide.tour-hike-trail-details.step.1':
    'Open de wandeling via ‘Tochten van deze reis’ en zoek ‘Padgegevens’ onder de kaart ‘Waypoints’. Zet ‘Langs de route tonen’ aan.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Niets in deze kaart verandert de tocht, en er is een verbinding voor nodig. Een geïmporteerde wandeling toont dezelfde kaart in de weergave, zonder routelimiet.',
  'help.guide.tour-hike-round.result':
    'De wandeling volgt de ronde die je hebt gekozen, terug naar de start. ‘Ronde overgenomen’ onderaan de kaart heeft ‘Ongedaan maken’, en met ‘Opslaan’ bewaar je de ronde.',
  'help.guide.tour-hike-compare-ways.step.3':
    'De badges op een rij laten zien hoeveel langer, hoger of trager die weg is dan de huidige. Klik op de weg die je wilt.',
  'help.guide.tour-ferrata-add.step.1':
    "Klik bij een geopende wandeling op ‘Via ferrata's’ in de rij kaartknoppen linksonder. De badge telt de klettersteigen in beeld; zoom in als daarom wordt gevraagd.",
  'help.guide.tour-ferrata-add.tip.3':
    'Het stuk over de klettersteig is gemarkeerd op het hoogteprofiel, zodat je ziet op welk moment van de dag je er aankomt.',
  'help.guide.tour-run-plan.step.5': 'Geef de hardlooptocht een naam bij ‘Naam van de tocht’ en klik op ‘Opslaan’.',
  'help.guide.tour-run-ways.step.1':
    'Open de hardlooptocht via ‘Tochten van deze reis’ en zet ‘Langs de route tonen’ aan bij ‘Padgegevens’, onder de kaart ‘Waypoints’.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Met het soort tocht ‘Stadswandeling / bezienswaardigheden’ maak je van een tocht een wandeling. De punten zijn dan stops met een ‘Label’, een verblijfsduur en een belangrijkheid. Een wandeling heeft geen wandellimiet en geen veld ‘Pauzes’: in plaats daarvan tellen de verblijfsduren.',
  'help.guide.tour-walk-plan.step.2':
    'Voeg de stops toe: controleer of ‘Punt toevoegen’ aan staat en klik bij elke stop op de kaart, of klik op ‘Reisplekken’ om een plaats te kiezen die al in de reis staat.',
  'help.guide.tour-walk-plan.result':
    'De wandeling toont de stops met hun verblijfsduur, en ‘Tochtoverzicht’ telt alles op. Zet de wandeling op een dag om te zien wanneer je bij elke stop bent.',
  'help.guide.tour-walk-sights.tip.1': 'Het wordt een stop van de wandeling, geen plaats van de reis.',
  'help.guide.tour-walk-day-times.step.3':
    'Open de wandeling opnieuw op het tabblad Tochten. Bovenaan ‘Waypoints’ toont ‘Tijden voor’ de dag en de starttijd. Staat de wandeling op meerdere dagen, klik er dan op om een andere dag te kiezen.',
  'help.guide.tour-walk-google-import.goal':
    'Plak een wandelroute die vanuit Google Maps is gedeeld en laad de stops als wandeling.',
  'help.guide.tour-walk-google-import.result':
    'Er opent een nieuwe stadswandeling in de editor met de stops uit Google Maps, klaar om op te slaan.',
  'help.guide.tour-walk-check-off.tip.2':
    'De rij van de wandeling in het dagplan toont het aantal ook, bijvoorbeeld 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'Bij het MTB-profiel toont dezelfde kaart de moeilijkheidsgraden van paden (mtb:scale) waar kaartmakers die hebben ingevoerd. Een pad zonder graad is onbekend, niet makkelijk.',
  'help.guide.tour-bike-profile.step.6':
    'Typ een naam bij ‘Naam van de tocht’ en klik dan op ‘Opslaan’ onderaan de linkerrail.',
  'help.guide.tour-bike-surfaces.goal':
    'Zie hoeveel van de route asfalt, grind of onbekend is, en over wat voor soort wegen hij gaat.',
  'help.guide.tour-bike-surfaces.tip.3':
    'De kaart gaat uit van de route zoals de router die heeft gepland en verandert niets aan de tocht. Er is een verbinding voor nodig; offline meldt de kaart dat, en de route blijft ongewijzigd.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '‘Geen graad in de gegevens’ betekent onbekend, niet makkelijk. Een graad zegt niets over of een pad bij jou past.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Elk punt dat je op de kaart aanklikt, wordt via pistes, liften en paden met het vorige verbonden. Onder elk punt staat het bijbehorende stuk als chips: pistes in de kleur van hun moeilijkheidsgraad, met hun minuten. Een stuk dat niet te plannen is, wordt rood, vermeldt waarom en biedt een oplossing of ‘Recht tekenen’.',
  'help.guide.tour-ski-plan.step.4':
    'Controleer of ‘Punt toevoegen’ aan staat en klik dan op de kaart waar je begint en daarna op elke plek die je wilt bereiken, op volgorde. De pisterouter verbindt elk punt via pistes, liften en paden met het vorige.',
  'help.guide.tour-ski-options.title': 'Vertel de pisterouter hoe je skiet',
  'help.guide.tour-ski-options.tip.2':
    '‘Liften gebruiken’ staat standaard aan voor Alpine en Snowboard en uit voor de andere disciplines. ‘Weglaten’ en ‘Zo nodig met de lift naar beneden’ zie je alleen als er liften worden gebruikt.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Je kunt het punt op de kaart ook dichter naar een piste, pad of lift slepen. Zodra je loslaat, wordt het stuk opnieuw gepland.',
  'help.guide.tour-ski-summary.step.2':
    '‘Skiën’, ‘In liften’, ‘Wacht’ en ‘Te voet’ geven de tijd per onderdeel. ‘Pistes’, ‘Afdaling op pistes’ en ‘Liftritten’ geven de lengte van de pistes, het hoogteverschil dat je erop afdaalt en hoeveel liften je neemt.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Zie de pistes, langlaufloipes en liften rond je skitocht, en wat hun kleuren betekenen.',
  'help.guide.tour-ski-import.title': 'Een skitrack importeren en aangeven wat het was',
  'help.guide.tour-ski-import.tip.1':
    'Een geïmporteerde track blijft zoals hij is opgenomen: TREK legt hem niet over de pistes, en de kaart toont ‘Skitijd’ als ‘Niet berekend’.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '‘Meer acties’ op een punt bevat de peddelfuncties: het volgende stuk over het water plannen of met de hand tekenen, ‘Boot vanaf hier dragen’ en ‘Sluis op dit punt’.',
  'help.guide.tour-paddle-setup.step.3':
    'Kies onder ‘Boot’ Kajak, Canadese kano, SUP of Overig. Op basis van de boot stelt TREK een snelheid voor.',
  'help.guide.tour-paddle-setup.tip.4':
    "‘Peddelen heeft risico's’, de rij onderaan de kolom, opent ‘Veiligheid op het water’. Lees dit één keer voor je eerste tocht.",
  'help.guide.tour-paddle-water-route.step.5':
    'Wil je alle met de hand getekende stukken in één keer plannen, klik dan op ‘Met de hand getekende delen over het water plannen’, de golfjes in de kop van ‘Waypoints’.',
  'help.guide.tour-paddle-portage.step.1':
    'Wijs de stop aan waar je uitstapt en klik op ‘Meer acties’, de drie puntjes.',
  'help.guide.tour-paddle-portage.result':
    'Het stuk is nu een draagstuk op de kaart en in de waypoints, en de ‘Tijdschatting’ rekent het als dragen.',
  'help.guide.tour-paddle-lock.tip.2':
    'Gaat een draagstuk om de sluis heen, dan wordt de sluis gedimd en gemarkeerd als ‘Omgedragen’. Dan telt de draagtijd, en de minuten van de sluis tellen niet mee.',
  'help.guide.tour-paddle-time.step.4':
    'Staat er een draagstuk in de tocht, dan telt de rij ‘Dragen’ het dragen. Klik op de snelheid en typ hoe snel je de boot draagt. ‘Uit- en weer instappen’ telt de minuten bij elk draagstuk erbij.',
  'help.guide.tour-paddle-wind.step.1':
    'Zet de peddeltocht op een dag van de reis. De kaart ‘Wind’ in de linkerkolom toont dan de verwachting voor die dag bij het begin van de tocht.',
  'help.guide.tour-paddle-wind.result': 'Je kent de wind voor die dag op je instapplek, uur voor uur.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Kies per obstakel wat je gaat doen: ‘Doorvaren’, ‘Omdragen’, ‘Eromheen varen’ of ‘Niet van toepassing’. Met ‘Volgende’ ga je naar het volgende open punt.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Klik op het tabblad Tochten in de rechterkolom op ‘Tocht toevoegen’, kies ‘GPX of KML importeren’ en selecteer het bestand.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '‘Verwerpen’ verwijdert de markeringen die je nog niet hebt opgeslagen. De opgenomen track zelf wordt nooit opnieuw getekend.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK berekent geen rijtijd. Vul een tijd in bij ‘Gepland’ in Details als je die op de dag wilt zien.',
  'help.guide.tour-horse-plan.step.5':
    'Kies een traject onder ‘Trajecten’. Controleer de ‘Richting’ waarin je het rijdt en wat ‘Toegang te paard’ langs dat traject aangeeft.',
  'help.guide.tour-horse-plan.tip.5':
    'Bij een rit wordt niets gerouteerd: een klik op de getekende lijn voegt geen vormpunt toe, en de punten aan de uiteinden van een traject blijven waar de route ze heeft.',
  'help.guide.tour-horse-gap.tip.1':
    'Een handmatig traject is door geen router en geen paardenroute gecontroleerd. Kijk op de kaart waar het echt loopt.',
  'help.guide.tour-horse-recorded.step.4':
    'De rit opent in de linkerkolom. De kaart ‘Opgenomen rit’ toont ‘Zoals opgenomen’, ‘Geen rijtijd’ en ‘Toegang niet gecontroleerd’. Ga met de muis over een badge om te lezen waarom.',
  'help.guide.dateless-trip.step.2':
    'Laat ‘Startdatum’ en ‘Einddatum’ leeg. Eronder verschijnt het veld ‘Aantal dagen’: vul in voor hoeveel dagen je wilt plannen.',
  'help.guide.trip-reminder.tip.1':
    'Alleen de eigenaar van de reis (of een beheerder) ziet het blok ‘Herinnering’. Is het grijs, dan moet een beheerder reisherinneringen eerst aanzetten, onder Beheer, Meldingen.',
  'help.guide.upcoming-reservations.step.2': 'Klik op een boeking om de bijbehorende reis te openen.',
  'help.guide.timezones-widget.tip.1':
    'De lijst gebruikt de officiële namen van tijdzones, zoals Europe/Lisbon of America/New_York. Zoek dus op de stad die in de naam staat.',
  'help.guide.half-company-holiday.step.2': 'Zet in dezelfde werkbalk ‘Halve dag’ aan.',
  'help.guide.edit-holiday-calendar.tip.1': 'Elke wijziging wordt meteen opgeslagen. Er is geen knop Opslaan.',
  'help.guide.person-color.tip.1': 'Dezelfde kleur markeert de persoon in de werkbalk en in de kaart ‘Recht’.',
  'help.guide.answer-fusion-request.step.2':
    'Lees wat fuseren inhoudt: één gedeelde kalender, invoer die jullie voor elkaar kunnen bewerken, en gedeelde vakantie-instellingen.',
  'help.guide.log-for-partner.step.2':
    'Kijk naar de werkbalk: de eerste knop toont nu de naam en kleur van die persoon.',
  'help.guide.dissolve-fusion.step.2': 'Klik onderaan bij ‘Fusie opheffen’ op ‘Opheffen’.',
  'help.guide.country-places.step.3':
    'Het venster toont elke plaats die voor het land meetelt, gegroepeerd per reis; zijn het er meer dan zes, dan kun je de lijst bovenaan met ‘Plaatsen zoeken’ inperken. Klik op een plaats of een reistitel om die reis in de planner te openen.',
  'help.guide.tour-activity-stats.step.5':
    'Klik op ‘Tochten tonen’. ‘Mijn gemaakte tochten’ opent met de totalen, de verdeling ‘Per soort’ en elke tocht uit de periode met de dag, de reis, de afstand en de hoogtemeters. Met de pillen in de kop kun je hier ook de periode en het type wijzigen.',
  'help.guide.move-to-list.step.3':
    'Kies de lijst waar ze naartoe gaan. Heb je meer dan drie lijsten, dan kun je ze bovenaan met een zoekvak inperken.',
  'help.guide.accept-list-invite.goal':
    'Doe mee met een lijst die iemand met je heeft gedeeld, of wijs de uitnodiging af.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Pas desgewenst ‘Naam in de reis’ aan en klik dan op ‘Aan een reis toevoegen’.',
  'help.guide.tour-collection-manage.step.2':
    'Typ in ‘Plaatsen zoeken’. Daarmee filter je de tochten op naam, samen met de plaatsen.',
  'help.guide.create-journey.tip.3':
    'Is een reis net afgelopen, dan start ‘Reisverslag aanmaken’ in de banner ‘Reis net afgelopen’ bovenaan een reisverslag waarin die reis al is geselecteerd.',
  'help.guide.entry-draft.step.2': 'Klik op ‘Opslaan’. De kaart heeft nu een badge ‘Concept’.',
  'help.guide.gallery-map.step.3':
    'Terug op ‘Tijdlijn’ scrolt de kaart rechts met je mee: de vermelding die in beeld is, heeft een ring in de kleur van haar dag. Klik op een speld om de tijdlijn naar de bijbehorende vermelding te laten scrollen.',
  'help.guide.journey-map-layers.tip.1':
    'Een gestippelde gekleurde lijn is de GPX-route van een reis en hoort bij het plan; een doorgetrokken lijn is een route die op die dag is opgenomen.',
  'help.guide.journey-keep-route.tip.1':
    'Waar de opname stopt, stopt ook de lijn. TREK tekent alleen wat is opgenomen.',
  'help.guide.journey-day-stays.tip.1':
    'De rij verschijnt alleen voor mensen die het reisverslag mogen bewerken en hun eigen Dawarich hebben gekoppeld, en alleen op dagen waarop nog iets te kiezen valt.',
  'help.guide.journey-take-over-day.step.4':
    'Laat ‘Ook de route van de dag bewaren’ aan staan om de route ook te bewaren en klik dan op de knop ‘Overnemen’. Die toont hoeveel concepten er worden aangemaakt.',
  'help.guide.journey-auto-prepare.step.3':
    'De regel eronder vermeldt wanneer je bezoeken voor het laatst zijn opgehaald, of waarom dat niet lukte. Klik op ‘Nu ophalen’ om Dawarich meteen te raadplegen.',
  'help.guide.photo-location.tip.1': 'Plaatsen die je zelf hebt ingesteld, worden nooit verplaatst.',
  'help.ctx.settings-plugins.bullet.1':
    'Plug-in-instellingen: daaronder één kaart per plugin die iets van je nodig heeft, met de velden en ‘Opslaan’. Een geheim veld wordt na het opslaan nooit meer getoond.',
  'help.guide.dashboard-widgets.step.3':
    '‘Standaardwaarden herstellen’, onder de kaarten, zet het hele tabblad Weergave terug naar de oorspronkelijke instellingen.',
  'help.guide.web-push-device.result':
    'De kaart toont ‘Ingeschakeld op dit apparaat’, en de gebeurtenissen die onder Push aanstaan, komen binnen, ook als TREK gesloten is.',
  'help.guide.connect-airtrail.step.1':
    'Zoek onder Integraties AirTrail en vul de ‘Instantie-URL’ en een API-sleutel in. De sleutel maak je in AirTrail aan onder Instellingen, Beveiliging.',
  'help.guide.connect-dawarich.step.1':
    'Zoek onder Integraties Dawarich en vul het ‘Adres van de instantie’ in, plus de API-sleutel die je in Dawarich vindt onder Account, API-sleutel.',
  'help.guide.tour-connect-wanderer.step.1':
    'Zoek onder Integraties wanderer en vul de ‘Instantie-URL’ en een API-token in. Het token maak je in wanderer aan onder Instellingen, Account, API-tokens; het begint met wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal':
    'Laat TREK op de achtergrond controleren of de trails die je hebt geïmporteerd zijn gewijzigd.',
  'help.guide.mcp-oauth.tip.3':
    'API-tokens werken nog, maar zijn gemarkeerd als ‘Verouderd’; stap over op een OAuth-client.',
  'help.guide.offline-conflicts.tip.2': 'De keuze geldt alleen voor dit apparaat.',
  'help.guide.default-user-settings.tip.1':
    'De eigen keuze van een gebruiker onder Instellingen gaat altijd voor; deze standaarden gelden voor iedereen die die instelling niet heeft gewijzigd.',
  'help.guide.own-routing-engine.step.1':
    'Vul onder Kaart bij Standaardinstellingen het adres van je OSRM-server in bij ‘Eigen routeserver’.',
  'help.guide.admin-passkeys.tip.2':
    'Wijzig je het domein later, dan werkt geen enkele passkey die mensen al hebben toegevoegd nog.',
  'help.guide.instance-keys.tip.4': 'De Amap-sleutel moet een Web 服务-sleutel (webservice) zijn, geen JS API-sleutel.',
  'help.guide.rotate-jwt-secret.step.2': 'Lees de waarschuwing en klik op ‘Roteren en uitloggen’.',
  'help.guide.notification-defaults.tip.2':
    'Een standaard geldt alleen voor mensen die die cel niet zelf hebben gewijzigd.',
  'help.ctx.notifications.bullet.5':
    'In Instellingen kies je onder Meldingen welke gebeurtenissen je hier ontvangt en welke per e-mail, webhook, ntfy of push.',
  'help.guide.read-notifications.result':
    'Je bent op het scherm waar de melding over ging, en het getal bij het belletje gaat met één omlaag.',
  'help.guide.mark-notifications-read.title': 'Meldingen als gelezen markeren',
  'help.guide.delete-notifications.goal': 'Houd de lijst kort door te verwijderen wat je niet meer nodig hebt.',
  'help.guide.notification-settings.step.1': 'Klik rechtsboven op je naam.',
  'help.guide.public-link.step.5':
    'Zolang de link bestaat, kun je de keuzes wijzigen. Met ‘Link verwijderen’ zet je de link uit.',
  'help.guide.link-journal.step.3':
    'Kies voor elke persoon van de reis ‘Geen toegang’, ‘Lezen’ of ‘Bewerken’. Met ‘Iedereen lezen’ en ‘Niemand’ stel je ze allemaal tegelijk in.',
  'help.guide.collapse-columns.tip.3':
    'Heeft de scheidingslijn de focus, dan kun je hem ook met de pijltjestoetsen verschuiven.',
  'help.guide.edit-place.tip.3':
    'Klik je buiten het venster, dan raak je je wijzigingen niet kwijt: TREK vraagt eerst ‘Wijzigingen weggooien?’, en met ‘Verder bewerken’ ga je terug naar het formulier.',
  'help.guide.dawarich-stays.goal':
    'Voeg de plekken toe waar Dawarich tijdens de reis je verblijven heeft vastgelegd, nadat je ze een voor een hebt gecontroleerd.',
  'help.guide.leave-stop-off-route.step.1':
    'Klik met de rechtermuisknop op de stop, of klik op de drie puntjes, en kies ‘Uit de route halen’.',
  'help.guide.move-booking-day.step.3':
    'De rij staat nu op de nieuwe dag, op zijn eigen tijd. Open de boeking als je ook de tijd wilt wijzigen.',
  'help.guide.place-image-from-file.goal':
    'Gebruik een foto die al bij de bestanden van de plaats staat als afbeelding, zonder hem opnieuw te uploaden.',
  'help.guide.place-image-from-file.tip.3':
    'Alleen reizigers die plaatsen mogen wijzigen, kunnen de afbeelding wijzigen.',
  'help.guide.place-own-hours.result':
    'De kaart toont jouw telefoonnummer, e-mailadres en openingstijden, en de ring om de afbeelding is groen of rood op basis van jouw tijden.',
  'help.guide.confirm-stay-booking.step.4':
    'Sluit de boeking met de X rechtsboven. Onder ‘Reservering’ toont de kaart van het verblijf nu ‘Bevestigd’.',
  'help.guide.tour-map-lines.title': 'Je tochten op de kaart vinden',
  'help.guide.tour-map-lines.tip.2':
    'Een tocht verbergen geldt alleen voor jou en wordt in deze browser voor deze reis bewaard: de tocht, de dagen en de kleur blijven voor iedereen hetzelfde. ‘Alles tonen’, boven de lijst Tochten, toont alle verborgen tochten weer, en de kaart op de telefoon toont altijd alle tochten.',
  'help.guide.car-stops.step.4':
    'Klik onder ‘Stops onderweg’ op ‘Tussenstop toevoegen’ voor elke plaats waar de rit langs gaat en kies die plaats, desgewenst met een tijd ernaast. Een tussenstop zonder gekozen plaats wordt bij het opslaan verwijderd.',
  'help.guide.transport-details.step.2':
    'De pillen in de kop tonen de status, het type, de dag en de ‘Boekingscode’. Klik op de statuspil om te wisselen tussen ‘In behandeling’ en ‘Bevestigd’. Het kopieerpictogrammetje in de pil van de code, ‘Boekingscode kopiëren’, kopieert de code naar je klembord.',
  'help.guide.group-sort-bookings.step.3':
    'Kies bij ‘Sorteren op’ voor Datum, Titel, Type of Status. De rij eronder draait de volgorde om: ‘Vroegste eerst’ of ‘Laatste eerst’ bij data, ‘A tot Z’ of ‘Z tot A’ bij de rest.',
  'help.guide.booking-on-map.title': 'Een boeking op de kaart vinden',
  'help.guide.export-bookings-csv.tip.1':
    'De kolommen zijn Type, Titel, Status, Start, Einde, Van, Naar, Locatie, Bevestiging en Notities.',
  'help.guide.arrange-packing-list.tip.1':
    'Zolang ‘A tot Z’ aanstaat, kun je items niet slepen, maar hele lijsten wel.',
  'help.guide.count-packed-pieces.step.3':
    'Zolang maar een deel van de stukken is ingepakt, heeft de teller je accentkleur en heeft het selectievakje een rand in die kleur. Klik op de min om een stuk van de telling af te halen.',
  'help.guide.expense-receipts.step.5':
    'Het voorbeeld toont het bonnetje, met bovenaan ‘Openen in nieuw tabblad’ en ‘Downloaden’. Bij meerdere bonnetjes blader je met de pijltjestoetsen, en met Esc sluit je het voorbeeld.',
  'help.guide.files-sync-settings.step.3': 'Klik onder de stroombalk op ‘Instellingen’ om de overige opties te tonen.',
  'help.guide.manage-notes.step.3':
    '‘Vastpinnen’, in hetzelfde menu, houdt de notitie bovenaan het paneel, met een rand in de kleur van de categorie en een punaise naast de titel. Met ‘Losmaken’ in hetzelfde menu zet je de notitie terug op haar gewone plek.',
  'help.guide.note-categories.step.1':
    'Klik op het tandwiel naast ‘Nieuwe notitie’ in de kop van de kaart Notities. ‘Categorieën beheren’ opent, met een rij voor elke categorie: de kleur, de naam, zes kleurstippen en een prullenbak.',
  'help.guide.note-categories.tip.2':
    'Een categorie zonder notities wordt alleen in je browser bewaard. De andere leden zien haar zodra er een notitie in staat.',
  'help.guide.roadtrip-reorder.goal':
    'Wijzig de volgorde van de rit, of verplaats een stop naar een andere dag, direct in de rail.',
  'help.guide.roadtrip-overnight.step.4':
    '‘Accommodatie zoeken’, ernaast, toont de naam om te kopiëren en links naar boekingssites: trivago of CHECK24 voor een hotel, PiNCAMP of Pitchup voor een camping. Controleer op de site de plaats, de data en het aantal gasten.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Kies onder ‘Vult tot’ een waarde van 50 tot 100. De regel onder de knoppen toont hoe ver je daarmee vanaf hier kunt rijden.',
  'help.guide.roadtrip-bookings.step.2':
    'In de rail is het traject een kaart in de kleur van het type, met de dienstregeling in de aankomstkolom en het begin- en eindpunt onder de titel.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK berekent zelf de route tussen de stops; de weg van Google wordt niet overgenomen.',
  'help.guide.roadtrip-hazards.result':
    'De kaart toont de actuele waarschuwingen rond je reis, en de route verandert niet.',
  'help.ctx.trip-tours.bullet.3':
    'Een rij: de gekleurde balk is de lijn van de tocht op de kaart, de ronde tegel toont de routelimiet (T1 tot T6) of het type, een kleine badge GPX of wanderer geeft een import aan, en de badges tonen de dagen, de tijd, de afstand en de stijging. Een maan met een getal toont het aantal etappes van een meerdaagse tocht.',
  'help.guide.tour-show-list.step.3': 'Klik op een rij. De tochtkaart opent over de kaart.',
  'help.guide.tour-add-to-day.goal':
    'Plan wanneer je een tocht maakt, zodat hij in de dag staat en zijn lijn op de kaart verschijnt.',
  'help.guide.tour-add-to-day.tip.3':
    'Je kunt een tocht maar één keer aan een dag toevoegen. Zet je hem op een dag waar hij al op staat, dan toont TREK alleen ‘Deze tocht staat al op die dag.’',
  'help.guide.tour-day-times.step.4':
    'Eindigt de tocht nadat het volgende onderdeel van de dag begint, dan meldt een regel onder de rij dat, bijvoorbeeld: Eindigt om 13:30, na het begin van Lunch bij Gostner Schwaige om 12:30. Er wordt niets verplaatst.',
  'help.guide.tour-remove-from-day.step.1':
    'Wijs in de dagenkolom de rij van de tocht aan, klik op ‘Meer opties’ en kies ‘Verwijderen van dag’.',
  'help.guide.tour-filter-list.step.1':
    'Klik op de filterknop onder ‘GPX of KML importeren’. Die toont de status waarop wordt gefilterd, eerst ‘Alle’, met het aantal tochten ernaast.',
  'help.guide.tour-hide-on-map.title': 'De lijn van een tocht op de kaart verbergen',
  'help.guide.tour-import-plan-tab.title': 'Een track importeren vanaf het tabblad Planning',
  'help.ctx.trip-tour-detail.title': 'Tochtdetails',
  'help.guide.tour-detail-read.goal':
    'Bekijk alles wat de reis over een tocht weet: de dagen, de afstand en hoogtes, het profiel en de bron.',
  'help.guide.tour-detail-read.tip.1':
    'Een oranje pil ‘voorzichtig gebruiken’ betekent dat de import onvolledige hoogtes of metingen bevat. Houd daar rekening mee als je de stijging en het profiel bekijkt.',
  'help.guide.tour-rename-colour.step.1':
    'Open de tochtkaart en klik op het potlood naast de naam. De naam wordt een invoerveld.',
  'help.guide.tour-take-along.goal':
    'Laat je de weg wijzen naar de start van een tocht, open de webpagina ervan, of download de route als GPX-bestand.',
  'help.guide.tour-take-along.result': 'Je hebt de weg naar de start in je kaartapp en de hele route als GPX-bestand.',
  'help.guide.tour-copy-keep.tip.2':
    '‘In collectie opslaan’ in het menu van een tocht in het dagplan opent hetzelfde venster, dus ook daar wordt de route opgeslagen.',
  'help.guide.tour-packing-link.step.3': 'Klik op ‘Koppelen’.',
  'help.guide.tour-files.goal':
    'Voeg een boeking, een kaart of een routebeschrijving toe aan de tocht en open die later weer vanaf de tochtkaart.',
  'help.guide.tour-activity-link.goal':
    'Koppel een opgenomen GPX-track aan een geplande tocht zonder de planning te wijzigen.',
  'help.guide.tour-activity-link.tip.3':
    '‘Benodigde tijd’ loopt van de eerste tot de laatste tijdstempel in de track, pauzes inbegrepen.',
  'help.guide.tour-activity-compare.tip.1':
    '‘Vergelijken op de kaart’ is alleen beschikbaar als de tochtkaart naast de kaart staat, niet op een telefoon.',
  'help.guide.tour-origin-check.tip.1':
    'Bij een tocht die uit een andere reis is overgenomen, staan die reis en de tocht onder ‘Overgenomen uit’.',
  'help.ctx.trip-tour-planner.bullet.3':
    '‘Tochten van deze reis’, de rechterbalk, toont elke tocht, met het filter en ‘Totalen van de reis’ boven de lijst. Is er een tocht open, dan geeft ‘Tochtoverzicht’ bovenaan de afstand, de stijging, de tijd en het hoogteprofiel. Met de plus bovenaan, ‘Tocht toevoegen’, plan, importeer of neem je een tocht over.',
  'help.guide.tour-open-workspace.step.3':
    'De rechterbalk, ‘Tochten van deze reis’, toont alle tochten van de reis, met het filter en ‘Totalen van de reis’ boven de lijst.',
  'help.guide.tour-open-workspace.result':
    'Het tabblad Tochten: de editor links, de tochten van de reis rechts en de kaart daartussen.',
  'help.guide.tour-draw-route.step.6':
    'Onder ‘Waypoints’ krijgt elk punt een rij met een nummer, en zodra de naam is geladen, de naam van de plek. Terwijl TREK bezig is, toont een stipje naast ‘Nieuwe tocht’ de status.',
  'help.guide.tour-type-profile.step.1':
    'Klik op ‘Soort tocht’ onder ‘Naam van de tocht’. Je ziet het huidige type met een regel over hoe het wordt gepland.',
  'help.guide.tour-edit-points.goal':
    'Bepaal waar de tocht langs gaat door de punten op de kaart of in de lijst te verplaatsen.',
  'help.guide.tour-edit-points.tip.2':
    'Een rij toont de coördinaten tot de plaatsnaam is geladen. Ongedaan maken en opnieuw uitvoeren hebben geen sneltoets.',
  'help.guide.tour-shaping-points.tip.1': 'De start en het einde zijn altijd stops.',
  'help.guide.tour-loop-reverse.step.3':
    'Klik ernaast op ‘Richting omkeren’ om de hele tocht in de andere richting te lopen.',
  'help.guide.tour-leg-by-hand.step.2':
    'Het stuk wordt een gestippelde rechte lijn, en onder de rij staat in de lijst ‘Met de hand getekend, niet gerouteerd’, met de lengte.',
  'help.guide.tour-trip-places.step.1':
    'Klik onder ‘Waypoints’ op ‘Reisplekken’ naast ‘Punt toevoegen’. De plaatsen van de reis verschijnen eronder.',
  'help.guide.tour-details-times.title': 'De tocht een naam geven en de tijd plannen',
  'help.guide.tour-details-times.tip.3':
    'Klik op de pijl naast Details om het in te klappen. Het klapt vanzelf open als een van de velden een waarde heeft die ‘Opslaan’ niet accepteert.',
  'help.guide.tour-save.tip.1':
    '‘Verwerpen’ naast ‘Opslaan’ verwijdert na bevestiging de niet-opgeslagen wijzigingen. Een opgeslagen tocht verandert daardoor niet.',
  'help.guide.tour-edit-saved.step.3':
    'Klik op ‘Opslaan’. ‘Tocht opgeslagen’ verschijnt, en de tocht houdt zijn dagen, bestanden en notities.',
  'help.guide.tour-summary-profile.step.1':
    '‘Tochtoverzicht’ bovenaan ‘Tochten van deze reis’ geeft de ‘Afstand’, ‘Hoogtemeters omhoog’ en ‘Hoogtemeters omlaag’ van de tocht in de editor, de geschatte tijd, de pauzes en het geplande totaal.',
  'help.guide.tour-list-manage.title': 'De tochten van de reis beheren',
  'help.guide.tour-list-manage.tip.2':
    'Een dag waar de tocht al op staat, is grijs in het dagmenu. Bij een meerdaagse tocht vraagt TREK of de etappes op die dag beginnen of dat de hele tocht op die dag komt.',
  'help.guide.tour-delete.tip.2':
    'Wil je hem alleen van een dag halen, gebruik dan ‘Verwijderen van dag’ in het menu van de dag.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Kies ‘Opslaan als nieuwe tocht’ om beide te houden, ‘Nieuwere laden’ om de andere versie te laden, of ‘Overschrijven’ om de andere versie door die van jou te vervangen.',
  'help.ctx.trip-tour-import.bullet.3':
    'Een import opent als GPX-tocht of als wanderer-tocht: de lijn, het ‘Tochtoverzicht’ en het hoogteprofiel, precies zoals geïmporteerd. De rij in de lijst heeft de badge ‘GPX-import’.',
  'help.guide.tour-import-gpx.step.4':
    'Controleer onder ‘Importeren als’ wat de tracks zijn. ‘Wandeling’ is vooraf ingesteld. Bij een ‘Fietstocht’ of ‘Hardlooptocht’ kies je het profiel, bij een ‘Peddeltocht’ de boot en het water, bij ‘Ski en winter’ de discipline.',
  'help.guide.tour-view-import.title': 'Een geïmporteerde track bekijken',
  'help.guide.tour-view-import.result':
    'Je ziet de opgenomen track precies zoals hij is geïmporteerd, zonder dat er iets opnieuw is berekend.',
  'help.guide.tour-plan-from-import.tip.2':
    'Meldt de kaart dat de suggestie over langere stukken ver van de track afwijkt, controleer die stukken dan op de kaart voordat je ermee plant.',
  'help.guide.tour-restore-recorded.step.3':
    'Bevestig met ‘Opgenomen track herstellen’. De waypoints en de gerouteerde lijn worden verwijderd; de dagen en notities blijven.',
  'help.guide.tour-take-over.step.3':
    'Zoek de tocht: typ in ‘Zoeken op naam’, of beperk de lijst met de filters Reis en Type.',
  'help.guide.tour-import-wanderer.title': 'Een trail uit wanderer importeren',
  'help.guide.tour-import-wanderer.tip.3':
    'Een trail die al in de reis staat, is gemarkeerd met ‘In deze reis’ en biedt ‘Tocht openen’. Is een trail na de import gewijzigd, dan zie je naast de oude versie ‘Als nieuwe versie importeren’.',
  'help.ctx.trip-tour-map.bullet.4':
    '‘Langs de tocht’, een kaart in het linkerpaneel, zoekt naar uitzichtpunten, water, hutten, eten en meer dicht bij de route en toont de resultaten. Je kunt een plaats uit de lijst als stop aan de tocht toevoegen.',
  'help.guide.tour-map-layers.tip.1':
    'De kaart die je kiest, blijft gelden voor elke tocht die je opent, tot je de pagina opnieuw laadt. Een tocht waarvan het type die kaart niet heeft, opent op ‘Kaart’; de kaart op het tabblad Planning en de instelling in Instellingen veranderen niet.',
  'help.guide.tour-along-search.step.4': 'Klik op ‘Zoeken langs de tocht’. TREK zoekt alleen: de tocht verandert niet.',
  'help.guide.tour-along-add-stop.step.1':
    'Klik op een plaats in de lijst ‘Langs de tocht’, of op de speld op de kaart. Er opent een kaartje over de kaart: wat het is, hoe ver het van de route ligt en waar het langs de tocht ligt.',
  'help.guide.tour-3d-terrain.title': 'Een tocht in 3D bekijken',
  'help.guide.tour-3d-terrain.tip.1':
    '‘Overzicht’ in dezelfde rij toont weer de hele route nadat je de weergave hebt verschoven.',
  'help.guide.tour-3d-flyover.step.4': 'Klik op ‘Overzicht’ om de hele tocht weer te tonen.',
  'help.guide.tour-map-overlays.step.2':
    'Klik op ‘Pistelegenda’, het vierkantje met gekleurde stippen naast de schakelaar.',
  'help.ctx.trip-tour-stages.summary':
    'Een meerdaagse tocht is één route, verdeeld in etappes, één voor elke dag dat je onderweg bent. Hier bepaal je waar elke dag eindigt, zie je de gegevens van elke etappe en zet je de etappes op de dagen van de reis.',
  'help.guide.tour-multi-day.step.1': 'Klik in ‘Tochten van deze reis’ op de tocht om hem in de editor te openen.',
  'help.guide.tour-multi-day.tip.3':
    'De tijd van een etappe is zonder pauzes. Een tijd in de waarschuwingskleur, ‘Meer dan een dag onderweg’, is langer dan één dag.',
  'help.guide.tour-stages-on-days.step.4':
    'Klik op de knop met de maan en het aantal etappes, ‘Etappes tonen’, om ze te tonen.',
  'help.ctx.trip-tour-hike.title': 'Wandelingen en hardlooptochten',
  'help.guide.tour-hike-plan.title': 'Een wandeling plannen binnen een moeilijkheid die je kiest',
  'help.guide.tour-hike-plan.result':
    'De wandeling staat onder ‘Tochten van deze reis’ met afstand, stijging en wandeltijd, klaar om op een dag te zetten.',
  'help.guide.tour-hike-trail-details.step.2':
    'Kies wat je wilt zien: SAC voor de wandelgraad, ‘Ondergrond’ of ‘Wegtype’. De route op de kaart krijgt dezelfde kleuren als de lijst.',
  'help.guide.tour-hike-round.title': 'Een rondwandeling van ongeveer een bepaalde lengte vinden',
  'help.guide.tour-hike-round.tip.1':
    'Rondwandelingen blijven binnen de ‘Maximale moeilijkheid van het pad’ van de wandeling; de T-pil in de kaart laat zien welke dat is.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Klik op ‘Deze weg nemen’. TREK controleert met de router of de route die weg echt volgt.',
  'help.guide.tour-ferrata-add.step.2':
    'Klik op de kaart op een klettersteig, op de gestippelde lijn of op het bordje. Het kaartje toont de naam, de moeilijkheidsgraad en de lengte.',
  'help.guide.tour-ferrata-add.tip.4':
    '‘Bekijken in OpenStreetMap’ op het kaartje opent de gegevens van de klettersteig zelf. De badge wordt oranje als er niets kan worden geladen, met de reden in de tooltip.',
  'help.guide.tour-run-plan.result':
    'De hardlooptocht staat onder ‘Tochten van deze reis’ met ‘Looptijd (gepland)’, en het profiel en tempo worden mee opgeslagen.',
  'help.guide.tour-run-ways.step.2':
    'Bovenaan de kaart zie je nu hoeveel van de hardlooptocht onverhard is en wat het moeilijkste gegradeerde pad onderweg is.',
  'help.ctx.trip-tour-walk.bullet.2':
    '‘Waypoints’ toont de stops op volgorde. Een ring om het nummer van een stop markeert hem als ‘Niet missen’ (doorgetrokken) of ‘Optioneel’ (gestippeld), een schildje markeert hem als ‘Beschermd’, en een pil onder de naam toont hoe lang je blijft.',
  'help.guide.tour-walk-plan.step.3':
    'Wijs een stop aan in ‘Waypoints’, klik ernaast op ‘Meer acties’ en kies ‘Halte bewerken’.',
  'help.guide.tour-walk-sights.title': 'Bezienswaardigheden langs een stadswandeling toevoegen',
  'help.guide.tour-walk-sights.tip.2':
    'Na een wijziging van de route toont de knop ‘Opnieuw zoeken’, omdat de gevonden plaatsen bij de oude route horen.',
  'help.guide.tour-walk-day-times.step.4':
    'Onder elke stop zie je wanneer je aankomt en hoe lang je blijft. Er verschijnt een waarschuwing als een plaats op dat moment gesloten is of tijdens je bezoek sluit.',
  'help.guide.tour-walk-google-import.step.1':
    'Klik in ‘Tochten van deze reis’ op ‘Tocht toevoegen’ (de + bovenaan) en kies ‘Wandeling uit Google Maps importeren’.',
  'help.guide.tour-walk-check-off.title': 'De stops van een wandeling op de dag afvinken',
  'help.guide.tour-walk-check-off.tip.3':
    'Zet je een wandeling offline op een dag, dan kun je hem afvinken zodra hij is gesynchroniseerd.',
  'help.guide.tour-bike-profile.title': 'Een fietstocht plannen voor jouw manier van fietsen',
  'help.guide.tour-bike-profile.result':
    'De fietstocht is opgeslagen en staat onder ‘Tochten van deze reis’, gerouteerd voor het gekozen profiel, met de rijtijd in het ‘Tochtoverzicht’.',
  'help.guide.tour-bike-surfaces.step.1':
    'Klik rechts in ‘Tochten van deze reis’ op een fietstocht om hem te openen. Zodra de route is berekend, verschijnt de kaart ‘Ondergrond en wegen’ onder ‘Waypoints’.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Klik op de titel van de kaart om hem in te klappen. Hij blijft in deze browser ingeklapt, ook na opnieuw laden.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Waar kaartmakers de klimmen een graad hebben gegeven, volgt daaronder ‘Klimgraad (mtb:scale:uphill)’ met eigen rijen.',
  'help.ctx.trip-tour-ski.bullet.4':
    'De kaart ‘Pisteroute’ onder de waypoints verdeelt de dag in ‘Skiën’, ‘In liften’, ‘Wacht’ en ‘Te voet’, met de lengte van de pistes, het hoogteverschil dat je erop afdaalt en de liftritten. ‘Skitijd’ in het ‘Tochtoverzicht’ rechts telt alles op zodra elk stuk is gepland.',
  'help.guide.tour-ski-plan.step.5':
    'Onder elk punt staat het bijbehorende stuk als chips: elke piste, lift en elk stuk te voet met naam of soort, pistes met een stip in de kleur van hun moeilijkheidsgraad, en de minuten per onderdeel.',
  'help.guide.tour-ski-options.goal':
    'Stel de moeilijkste pistes in, je voorkeuren, je tempo en welke liften je gebruikt, zodat de stukken bij je passen.',
  'help.guide.tour-ski-options.tip.3':
    '‘Vermoede verbindingen mijden’ houdt de route weg van verbindingen die de kaartgegevens alleen vermoeden, zoals een niet in kaart gebracht stuk tussen twee pistes.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Zolang de pistegegevens van een gebied nog worden gedownload, wacht de planner en probeert hij het automatisch opnieuw.',
  'help.guide.tour-ski-summary.step.3':
    'In het ‘Tochtoverzicht’ rechts telt ‘Skitijd’ alles op. Het infopunt legt uit hoe die wordt berekend.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Zolang een tocht van het type ‘Ski en winter’ open is, toont de kaart automatisch de pistes. De schakelaar met de besneeuwde berg in de rij linksonder op de kaart zet ze uit en aan; de tooltip luidt ‘Pistes, langlaufloipes en liften’.',
  'help.guide.tour-ski-import.goal':
    'Importeer een opgenomen ski-, langlauf- of sneeuwschoentrack en geef hem de juiste discipline.',
  'help.guide.tour-ski-import.tip.2':
    'Wil je hem bewerken als een geplande tocht, gebruik dan ‘Een bewerkbare versie plannen’ in de kaart ‘Bewerkbare versie’. De punten worden met rechte lijnen verbonden.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '‘Tijdschatting’ telt de tijd op het water op, plus het dragen van de boot, het uit- en weer instappen, de sluizen en de pauzes, op basis van snelheden en minuten die je kunt aanpassen.',
  'help.guide.tour-paddle-setup.step.4':
    'Kies onder ‘Water’ voor ‘Rivier’ of ‘Meer’. Je kunt de tocht pas opslaan als je zowel een boot als een soort water hebt gekozen.',
  'help.guide.tour-paddle-setup.result':
    'Een nieuwe peddeltocht met boot, water en snelheid, klaar voor het eerste punt op de kaart.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Ontbreken de watergegevens, dan downloadt TREK ze automatisch voor de regio of vraagt het ze aan bij een beheerder, afhankelijk van hoe de instantie is ingesteld. Het stuk toont dan ‘Watergegevens laden’ en wordt automatisch gepland zodra de gegevens er zijn, meestal binnen één tot drie minuten.',
  'help.guide.tour-paddle-portage.step.2':
    'Kies ‘Boot vanaf hier dragen’. Het stuk tot het volgende punt wordt een draagstuk, getekend over land.',
  'help.guide.tour-paddle-lock.title': 'Een sluis en de wachttijd toevoegen',
  'help.guide.tour-paddle-lock.tip.3': '‘Sluis verwijderen’ staat onderaan de geopende kaart en in ‘Meer acties’.',
  'help.guide.tour-paddle-time.step.5':
    'Tot elke sluis zijn tijden heeft, toont de schatting ‘Onvolledig’ en somt een opmerking onder de rijen op wat er ontbreekt.',
  'help.guide.tour-paddle-wind.step.2':
    'Bekijk de windrichting, het ‘Gemiddeld’ en de ‘Windstoten’. ‘Gemiddeld’ is het hoogste uurgemiddelde van de dag, ‘Windstoten’ de sterkste windstoot.',
  'help.guide.tour-paddle-checklist.title': 'De obstakelchecklist doorlopen',
  'help.guide.tour-paddle-checklist.tip.2':
    '‘Omdragen’ plant niet automatisch een draagstuk. Klik op ‘Overdraagplaats plannen’ om het op de kaart in te stellen.',
  'help.guide.tour-paddle-track-marks.step.2':
    'Zet in het ‘Importvoorbeeld’ ‘Importeren als’ op ‘Peddeltocht’ en kies dan de ‘Boot’ en het ‘Water’. De import gaat pas verder als je beide hebt gekozen.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Bij een opgenomen track heeft de rij ‘Water’ van de ‘Tijdschatting’ een eigen snelheid: klik erop en typ hoe snel je hebt gepeddeld.',
  'help.ctx.trip-tour-horse.bullet.5':
    'Een rit die uit een GPX-bestand is geïmporteerd, blijft precies zoals hij is opgenomen, en de kaart ‘Opgenomen rit’ vermeldt wat de import niet kon berekenen.',
  'help.guide.tour-horse-plan.step.6':
    'Klik op ‘Traject overnemen’. Het traject wordt aan de rit toegevoegd als badge met de naam van de route in de kaart ‘Waypoints’. Voeg op dezelfde manier meer trajecten toe.',
  'help.guide.tour-horse-gap.title': 'Een gat tussen paardenroutes overbruggen',
  'help.guide.tour-horse-gap.tip.2':
    'Punten die je op de kaart aanklikt, worden op dezelfde manier aan de rit toegevoegd, als rechte, niet-gecontroleerde stukken.',
  'help.guide.tour-horse-recorded.result':
    'De rit staat in de reis precies zoals je hem hebt gereden, met de afstand en hoogtes uit het bestand.',
  'help.guide.dateless-trip.step.3': 'Klik op ‘Nieuwe reis aanmaken’.',
  'help.guide.trip-reminder.tip.2':
    'Een nieuwe reis krijgt standaard een herinnering 3 dagen voor vertrek. Via welke kanalen je die krijgt, kies je onder Instellingen, Meldingen.',
  'help.guide.upcoming-reservations.result':
    'De reis opent. Terug op het dashboard laat de widget nog steeds zien wat er hierna komt.',
  'help.guide.entitlement.tip.2':
    'In een gefuseerd plan heeft iedereen een eigen rij, en kun je ook het recht van de anderen instellen.',
  'help.guide.half-company-holiday.step.3': 'Klik op de dag. De helft van het vakje wordt oranje.',
  'help.guide.school-holidays.tip.2':
    'Ga met de muis over een vakantiedag om de naam van de vakantie te zien onder ‘Schoolvakanties’.',
  'help.guide.answer-fusion-request.step.3':
    'Klik op ‘Accepteren en fuseren’ om de plannen samen te voegen, of op ‘Afwijzen’ om je plan apart te houden.',
  'help.guide.log-for-partner.step.3':
    'Klik op de dagen die je wilt vastleggen en klik daarna in ‘Personen’ weer op je eigen naam.',
  'help.guide.dissolve-fusion.result':
    'Iedereen heeft weer een eigen plan met de eigen invoer, en onder ‘Personen’ sta alleen jij.',
  'help.guide.country-places.result': 'De planner opent met de reis waar de plaats bij hoort.',
  'help.guide.tour-activity-stats.step.6':
    'Klik bij een tocht die niet is doorgegaan op ‘Weglaten’, de ronde knop aan het eind van de rij. De tocht blijft in de lijst, gedimd en gemarkeerd als ‘Weggelaten’. Met dezelfde knop, nu ‘Weer meetellen’, tel je hem weer mee.',
  'help.guide.move-to-list.tip.1':
    'Labels horen bij één lijst, dus een verplaatste of gedupliceerde plaats heeft in de nieuwe lijst geen labels.',
  'help.guide.accept-list-invite.step.1':
    'Zoek de uitnodiging onder ‘Uitnodigingen’ in de lijstenbalk. Ben je via de melding van de uitnodiging gekomen, dan staat de kaart bovenaan de pagina. Daarop staan de lijst en van wie de uitnodiging komt.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'De nieuwe tocht staat nog op geen enkele dag en voegt geen plaatsen toe. De lijst en de oorspronkelijke tocht veranderen niet.',
  'help.guide.tour-collection-manage.step.3':
    'Klik op de prullenbak aan het eind van de rij van de tocht en bevestig met ‘Uit de collectie halen’.',
  'help.ctx.journey-detail.bullet.7':
    'Is Dawarich gekoppeld, dan toont een dagkop ook ‘Opname overnemen’ (of de afstand van de route die voor die dag is opgeslagen) en ‘Dag overnemen’. Op een dag met wachtende bezoeken staan die bezoeken samen in één rij aan het eind van de dag.',
  'help.guide.entry-draft.tip.1':
    'Bijdragers zien een concept wel. Alleen de openbare link verbergt het tot je ‘Concept’ uitzet.',
  'help.guide.journey-map-layers.tip.2':
    'Een gedimde schakelaar heeft nog niets te tonen, en de tooltip vertelt waarom. Je keuze wordt per reisverslag in deze browser bewaard.',
  'help.guide.journey-keep-route.tip.2':
    'Klik later op de afstand in de dagkop om opnieuw met Dawarich te vergelijken: ‘Vervangen’ neemt de nieuwe versie over, ‘Route verwijderen’ haalt de route van die dag uit het reisverslag.',
  'help.guide.journey-day-stays.tip.2':
    'Voor een drukke dag verwerkt ‘Dag overnemen’ aan het eind van de rij alle bezoeken in één keer.',
  'help.guide.journey-take-over-day.tip.1':
    'Er wordt niets opgeslagen voordat je op die knop klikt, en niets twee keer: een bezoek dat al in het reisverslag staat, is gemarkeerd en kan niet nog eens worden gekozen.',
  'help.guide.journey-auto-prepare.tip.1':
    'Alleen dagen van gekoppelde reizen met data worden voorbereid, en er wordt niets automatisch aan het reisverslag toegevoegd.',
  'help.guide.photo-location.result':
    'Een vermelding zonder plaats krijgt de locatie waar de eerste foto met gps is gemaakt, en verschijnt op de kaart.',
  'help.guide.contributors.tip.2':
    '‘Via reizen’ toont de mensen die toegang hebben via een gekoppelde reis. Wijzig hun toegang in de instellingen van die reis, niet hier.',
  'help.ctx.settings-plugins.bullet.2':
    'Een plugin kan ‘Acties’ aan zijn kaart toevoegen, die worden uitgevoerd nadat je bevestigt, en ‘Verbinden’ of ‘Verbinding verbreken’ als hij namens jou bij een andere dienst inlogt.',
  'help.guide.web-push-device.tip.1':
    'Push werkt per browser: herhaal dit op elke telefoon en computer waarop je meldingen wilt. ‘Uitschakelen op dit apparaat’ zet het alleen op dat apparaat uit.',
  'help.guide.connect-airtrail.step.2':
    '‘Zelfondertekende certificaten toestaan’ is alleen bedoeld voor een vertrouwde instantie op je eigen netwerk. ‘Wijzigingen terugschrijven naar AirTrail’ staat standaard uit, dus TREK leest alleen; zet het aan om je wijzigingen terug te sturen.',
  'help.guide.connect-dawarich.step.2':
    'Met ‘Automatisch op nieuwe bezoeken controleren’ controleert TREK zelf. Staat het uit, dan leest TREK Dawarich alleen als jij daarom vraagt. ‘Zelfondertekend certificaat toestaan’ is alleen bedoeld voor een instantie die je server niet vertrouwt.',
  'help.guide.tour-connect-wanderer.step.2':
    'Zet ‘Zelfondertekend certificaat toestaan’ alleen aan voor een instantie op je eigen netwerk.',
  'help.guide.tour-wanderer-watch.step.1':
    'Zet in de kaart van wanderer ‘Mijn trails op wijzigingen controleren’ aan. Daarvoor moet er eerst een opgeslagen koppeling zijn.',
  'help.guide.plugin-settings.title': 'Een plugin voor jezelf instellen',
  'help.guide.default-user-settings.tip.2':
    '‘Weergavevaluta’ rekent bedragen alleen om voor de weergave. De bedragen die in Onkosten zijn ingevoerd, blijven zoals ze zijn.',
  'help.guide.own-routing-engine.step.2':
    'Voor routes die tol, snelwegen of veerboten vermijden, vul je je Valhalla-adres in bij ‘Eigen Valhalla-instantie’. Elk veld wordt opgeslagen zodra je het verlaat; start daarna de TREK-server opnieuw en laad de pagina opnieuw.',
  'help.guide.admin-passkeys.tip.3':
    'Is een gebruiker het apparaat met de passkeys kwijt, verwijder die passkeys dan met ‘Passkeys resetten’ in ‘Gebruiker bewerken’.',
  'help.guide.rotate-jwt-secret.result':
    'Er is een nieuw ondertekeningsgeheim, en elke gebruiker, jij ook, moet opnieuw inloggen.',
  'help.guide.read-notifications.title': 'Je meldingen lezen',
  'help.guide.filter-notifications.title': 'Alle meldingen bekijken, of alleen de ongelezen',
  'help.guide.mark-notifications-read.goal':
    'Haal de markering en het getal bij het belletje weg zodra je hebt gezien wat er nieuw is.',
  'help.guide.delete-notifications.step.1':
    'Klik op ‘Verwijderen’, de prullenbak naast de tijd van een melding, om alleen die melding te verwijderen.',
  'help.guide.notification-settings.step.2': 'Klik in het menu op ‘Instellingen’.',
  'help.guide.public-link.tip.3': 'Ga met de muis over een optie om te lezen wat die verbergt.',
  'help.guide.link-journal.step.4':
    'Lees de gele opmerking: daarin staat wie het reisverslag voor het eerst krijgt. Klik dan op ‘Dagboek koppelen’.',
  'help.guide.dawarich-stays.step.1':
    'Is Dawarich gekoppeld in Instellingen, Integraties, dan staat ‘Uit Dawarich’ boven de plaatsenlijst. In de kop zie je wanneer TREK voor het laatst heeft gecontroleerd en hoeveel bezoeken er wachten. Klik erop om de lijst te openen.',
  'help.guide.leave-stop-off-route.step.2':
    'Naast de naam verschijnt een badge ‘Buiten de route’. De stop blijft op de dag en op de kaart, maar de route van de dag en de reistijden van de trajecten slaan hem over.',
  'help.guide.move-booking-day.result':
    'De boeking hoort in de planning bij de nieuwe dag, en de tijd is niet veranderd.',
  'help.guide.clear-day.tip.2': 'Deze menuoptie verschijnt alleen bij een dag waarop plaatsen staan.',
  'help.guide.place-image-from-file.step.1':
    'Open een plaats die een foto bij de ‘Bestanden’ heeft. Het blok ‘Bestanden’ onderaan de kaart toont hoeveel bestanden de plaats heeft.',
  'help.guide.place-own-hours.title': 'Openingstijden, telefoonnummer of e-mailadres van een plaats corrigeren',
  'help.guide.place-own-hours.tip.1':
    'Tijden die je invult, vervangen de tijden die TREK heeft opgezocht, zodat een café met seizoenstijden toont wat jij weet.',
  'help.guide.day-panel.tip.3':
    'Plan je liever op datum? Zet ‘Datum eerst in dagkoppen’ aan in Instellingen, onder Weergave. De kop toont dan eerst de datum, met Dag 1 of de naam van de dag eronder.',
  'help.guide.confirm-stay-booking.result':
    'De hotelboeking is bevestigd, zowel op de kaart van het verblijf als op het tabblad Boekingen.',
  'help.guide.tour-map-lines.goal':
    'Houd de tochten van de reis op de kaart uit elkaar, open er een via de lijn, en verberg de tochten die je nu niet nodig hebt.',
  'help.guide.tour-map-lines.tip.3':
    '‘Uit de route halen’, in het menu van de rij van de tocht in het dagplan, betekent dat de route van de dag niet meer naar het begin- en eindpunt van de tocht gaat. Met ‘Weer aan de route toevoegen’ verbind je ze opnieuw.',
  'help.guide.car-stops.step.5':
    'De volgorde van de stops is de route. Met ‘Omhoog’ en ‘Omlaag’ links van een stop wijzig je die, en met ‘Stop verwijderen’, het kruisje rechts, haal je de stop weg.',
  'help.guide.transport-details.step.3':
    'De tegels daaronder tonen vertrek en aankomst met de stations of luchthavens, daarna het perron en de stoel als die zijn ingevuld. Bij een rit met tussenstops staan die onder ‘Route’, en bij een rit die per traject is geboekt, staat de code van elk traject onder ‘Codes per traject’. Daarna volgen ‘Reizigers’, ‘Notities’, ‘Kosten’ en ‘Bestanden’; ‘Tonen in bestanden’ opent het ticket op het tabblad Bestanden.',
  'help.guide.export-transports-csv.title': 'Vervoer exporteren als spreadsheet',
  'help.guide.group-sort-bookings.step.4':
    'Klik op de kop van een sectie om die in te klappen. Het getal ernaast geeft aan hoeveel boekingen erin zitten, en met een tweede klik open je de sectie weer.',
  'help.guide.booking-on-map.goal': 'Ga vanuit een boeking direct naar de plek ervan in de planning en op de kaart.',
  'help.guide.export-bookings-csv.tip.2':
    "De kolommen worden gescheiden door puntkomma's, en Excel opent het bestand met de accenten intact.",
  'help.guide.arrange-packing-list.tip.2':
    'TREK onthoudt ‘A tot Z’ in deze browser, dus de lijst opent de volgende keer ook gesorteerd. Het verandert alleen wat jij ziet, nooit de volgorde die anderen zien.',
  'help.guide.count-packed-pieces.step.4':
    'Zodra de teller het aantal bereikt, wordt het item automatisch afgevinkt en telt het als ingepakt.',
  'help.guide.expense-receipts.result':
    'Het bonnetje is bij de uitgave opgeslagen: met de chip op de rij open je het, en het bestand staat ook bij de Bestanden van de reis.',
  'help.guide.files-sync-settings.step.4':
    'Kies onder ‘Als een document wordt verwijderd’ wat er met de kopie aan de andere kant gebeurt. ‘Beide kopieën behouden’ laat de kopie in de opslag staan. ‘Naar de prullenbak verplaatsen’ verplaatst die naar de prullenbak van de opslag als het document in TREK wordt verwijderd.',
  'help.ctx.trip-collab.bullet.7':
    'Voor alles hier is een verbinding nodig. Offline worden berichten, notities, links, polls en stemmen niet opgeslagen, en meldt TREK: Dit vereist een verbinding. Probeer het opnieuw zodra TREK weer online is. Leden die Samenwerking niet mogen bewerken, kunnen alles lezen, maar zien ‘Nieuwe notitie’, ‘Link toevoegen’ en ‘Nieuwe poll’ niet, en het berichtvak is grijs.',
  'help.guide.manage-notes.step.4':
    '‘Bewerken’ opent het notitievenster met alles al ingevuld. Pas aan wat nodig is, hier een extra regel onder ‘Inhoud’, en klik op ‘Opslaan’.',
  'help.guide.note-categories.step.2':
    'Typ onderaan een naam in ‘Nieuwe categorie...’ en druk op Enter of klik op de plus ernaast. De nieuwe categorie krijgt de volgende kleur en een eigen rij.',
  'help.guide.note-categories.tip.3':
    'Op een kaart is de categorie alleen de gekleurde stip in de kop. Ga met de muis over de stip om de naam te zien.',
  'help.guide.roadtrip-reorder.step.1':
    'Sleep een stop aan de rij en zet hem neer op een andere stop van dezelfde dag. De stop neemt de plek van die stop in, en de route van de dag wordt in de nieuwe volgorde opnieuw berekend.',
  'help.guide.roadtrip-overnight.step.5':
    'Klik op ‘Toevoegen’. De nacht wordt geboekt van deze dag tot de volgende, en de plaats wordt aan de rit toegevoegd als overnachting van die dag.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Wil je voor de stop weer je eigen instelling gebruiken, open dan de badge opnieuw en klik op ‘Mijn standaard gebruiken’.',
  'help.guide.roadtrip-bookings.step.3':
    'De pil ‘Inchecken’ of ‘Instappen’ geeft aan hoe laat je uiterlijk bij de terminal moet zijn: het vertrek wordt zoveel eerder gezet dan in de dienstregeling.',
  'help.guide.roadtrip-google-import.title': 'Een route uit Google Maps importeren',
  'help.guide.roadtrip-google-import.tip.2':
    'De link moet minstens twee en hoogstens 30 stops bevatten die TREK kan plaatsen.',
  'help.guide.roadtrip-hazards.tip.1':
    'Waarschuwingen zijn geen wegafsluitingen: de route verandert er nooit door, en het zijn actuele meldingen, geen voorspelling voor jouw data.',
  'help.ctx.trip-tours.bullet.4':
    'Ga met de muis over een rij om het oog (‘Verbergen op de kaart’) en de ronde + (‘Toevoegen aan dag’) te zien. Sleep een rij naar een dag in de linkerkolom om de tocht daar te plannen, of klik erop om de tochtkaart over de kaart te openen.',
  'help.guide.tour-show-list.step.4':
    'De tochtkaart toont de gegevens van de tocht en, onder ‘Reisdagen’, de dagen waarop hij staat. Wil je de route zelf wijzigen, open dan het tabblad Tochten en klik op de tocht onder ‘Tochten van deze reis’.',
  'help.guide.tour-add-to-day.step.1':
    'Ga in de lijst met de muis over de tocht en klik op de ronde + rechts in de rij (‘Toevoegen aan dag’).',
  'help.guide.tour-add-to-day.tip.4':
    'Is er een dag open (klik op de kop ervan), dan biedt de tochtkaart ook ‘Toevoegen aan dag’ voor die dag. De terugpijl boven de dagen maakt de toewijzing ongedaan.',
  'help.guide.tour-day-times.tip.1': 'Een eindtijd die je zelf invult, vervangt de berekende.',
  'help.guide.tour-remove-from-day.step.2':
    'De tocht blijft in de lijst rechts staan. De badge ‘Dag’ is weg, en het filter telt hem weer onder ‘Ongepland’.',
  'help.guide.tour-filter-list.step.2':
    'Kies onder ‘Status’ voor ‘Ongepland’ voor tochten die nog op geen enkele dag staan, of ‘Gepland’ voor tochten die al op een dag staan. Op elke regel zie je hoeveel tochten erbij horen.',
  'help.guide.tour-hide-on-map.goal':
    'Verberg tochten die je nu niet nodig hebt op de kaart, zonder dat er voor iemand iets aan verandert.',
  'help.guide.tour-import-plan-tab.goal': 'Importeer een GPX- of KML-track als tocht terwijl je de dagen plant.',
  'help.ctx.trip-tour-detail.summary':
    'De tochtkaart die over de kaart opent als je op het tabblad Planning een tocht kiest: de dagen, de gegevens en het profiel, de herkomst, en knoppen om de tocht naar je telefoon te sturen, te kopiëren, in een collectie op te slaan of aan de inpaklijst te koppelen.',
  'help.guide.tour-detail-read.step.1':
    'Schakel bovenaan de rechterkolom van ‘Plaatsen’ naar ‘Tochten’ en klik op een tocht. De tochtkaart opent over de kaart. Ook de rij van de tocht in een dag, of de lijn op de kaart, opent dezelfde tochtkaart.',
  'help.guide.tour-detail-read.tip.2':
    'Een peddeltocht toont geen hoogtes en geen profiel: de punten liggen op de oevers, dus de hoogtes zouden niet kloppen.',
  'help.guide.tour-rename-colour.step.2':
    'Typ de nieuwe naam en klik op de ronde vinkknop, of druk op Enter. Met Escape houd je de oude naam.',
  'help.guide.tour-take-along.step.1':
    'Open de tochtkaart. ‘Navigatie’ onderaan opent het begin van de tocht in een kaartapp, en toont eerst de apps als er meerdere zijn. Je wordt naar de start geleid, niet langs de route.',
  'help.guide.tour-copy-keep.title': 'Een tocht kopiëren of in een collectie bewaren',
  'help.guide.tour-copy-keep.tip.3':
    'Op het tabblad Tochten doet de bladwijzer bovenaan de linkerkolom hetzelfde voor de geopende tocht. Heeft die nog niet-opgeslagen wijzigingen, dan vraagt TREK je eerst de tocht op te slaan.',
  'help.guide.tour-packing-link.step.4':
    'De tochtkaart toont nu de lijst, hoeveel items ervan zijn ingepakt, een balk en de eerste items. Ingepakte items zijn doorgestreept.',
  'help.guide.tour-files.step.1':
    'Open de tochtkaart en scrol naar ‘Bestanden’ helemaal onderaan. Klik in de kop van dat onderdeel op ‘Uploaden’ en kies een of meer bestanden.',
  'help.guide.tour-activity-link.step.1':
    'Open de tochtkaart van de geplande tocht en scrol naar ‘Werkelijke track’. Klik op ‘Werkelijke track toevoegen’.',
  'help.guide.tour-activity-link.result':
    'De track is aan de tocht gekoppeld, en de tochtkaart toont de planning en wat je echt hebt gedaan naast elkaar.',
  'help.guide.tour-activity-compare.tip.2':
    'De gemaakte tochten in de Atlas tellen een gekoppelde track mee in plaats van de geplande waarden.',
  'help.guide.tour-origin-check.tip.2':
    'Een tocht uit wanderer heeft naast de bron een pijl, ‘Openen in wanderer’, en ‘Bron controleren’ in de kop van het onderdeel. De controle vraagt aan wanderer of de trail sinds de import is gewijzigd. ‘Importeren als nieuwe momentopname’ importeert de nieuwe versie dan als aparte tocht. Deze tocht houdt zijn dagen en notities.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Zolang ‘Punt toevoegen’ aanstaat (‘Punten plaatsen’ in de pil van de kaart), zet een klik op de kaart een punt. Sleep een speld om die te verplaatsen, klik op de getekende route om daar een vormpunt toe te voegen, en kies een plaats van de reis met ‘Reisplekken’.',
  'help.guide.tour-open-workspace.step.4':
    'De plus bovenaan de rechterbalk, ‘Tocht toevoegen’, biedt ‘GPX of KML importeren’, ‘Wandeling uit Google Maps importeren’ en ‘Tocht overnemen uit een andere reis’. Is er een tocht open, dan staat ook ‘Nieuwe tocht plannen’ erbij.',
  'help.guide.tour-draw-route.title': 'Een nieuwe tocht tekenen',
  'help.guide.tour-draw-route.tip.1':
    'Zolang ‘Punten plaatsen’ aanstaat, is de aanwijzer een kruisje. Zet het uit om de kaart te verslepen zonder punten toe te voegen. In 3D staat het eerst uit, omdat je daar de kaart versleept om rond te kijken.',
  'help.guide.tour-type-profile.step.2':
    'Kies het type in de lijst: Wandeling, ‘Stadswandeling / bezienswaardigheden’, Hardlooptocht, Fietstocht, Peddeltocht, ‘Rit te paard’ of ‘Ski en winter’. Bij elk type staat wat het plant, en een nieuw type plant de route opnieuw.',
  'help.guide.tour-edit-points.step.1':
    'Sleep een genummerde speld op de kaart naar de plek waar het punt moet komen. De route wordt opnieuw gepland via de nieuwe plek.',
  'help.guide.tour-edit-points.result':
    'De punten staan waar je ze wilt en in de volgorde die je wilt, en de route is opnieuw gepland.',
  'help.guide.tour-shaping-points.tip.2':
    'Met een vormpunt kun je geen etappe van een meerdaagse tocht laten eindigen.',
  'help.guide.tour-loop-reverse.tip.1':
    'Is de tocht eenmaal een rondje, dan toont ‘Terug naar start’: ‘De tocht keert al terug naar de start’.',
  'help.guide.tour-leg-by-hand.step.3':
    'Wil je de router het stuk weer laten plannen, open dan hetzelfde menu en kies ‘Volgende stuk weer routeren’.',
  'help.guide.tour-trip-places.step.2':
    'Doorzoek de plekken van de reis, of kijk onder ‘Dicht bij de tocht’: de plaatsen binnen twee kilometer van de route, de dichtstbijzijnde eerst, elk met de afstand.',
  'help.guide.tour-details-times.goal':
    'Geef de tocht een naam, een beschrijving en een link, en voeg pauzes toe aan de tijd.',
  'help.guide.tour-details-times.result': 'De tocht heeft nu een naam, notities en de tijd die je ervoor plant.',
  'help.guide.tour-save.tip.2':
    '‘Terug naar tochten’ bovenaan de balk sluit de editor, en vraagt eerst of je zeker bent als er niet-opgeslagen wijzigingen zijn.',
  'help.guide.tour-edit-saved.step.4':
    'Klik op ‘Terug naar tochten’ om te sluiten. Zijn er niet-opgeslagen wijzigingen, dan vraagt TREK eerst ‘Niet-opgeslagen wijzigingen aan de tocht verwerpen?’',
  'help.guide.tour-summary-profile.step.2': 'Het infopunt naast de geschatte tijd legt uit hoe die wordt berekend.',
  'help.guide.tour-list-manage.goal':
    'Bekijk de totalen van de tochten van de reis, zet er een op een dag en beperk de lijst tot wat je nodig hebt.',
  'help.guide.tour-list-manage.tip.3':
    'De prullenbak op een rij verwijdert de tocht. Het tabblad Planning toont dezelfde tochten als je de rechterkolom op ‘Tochten’ zet.',
  'help.guide.tour-delete.tip.3':
    'Je verwijdert een tocht hier, op het tabblad Tochten. De prullenbak is er alleen voor reizigers die de plaatsen van de reis mogen bewerken.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '‘Opslaan als nieuwe tocht’ geeft je kopie de naam van de tocht, met (mijn versie) erachter.',
  'help.ctx.trip-tour-import.bullet.4':
    '‘Bewerkbare versie’ maakt van een import een tocht met waypoints die je kunt verplaatsen. ‘Import vervangen’ bewaart de opgenomen track, en met de kaart ‘Opgenomen track’ in de editor ga je ernaar terug.',
  'help.guide.tour-import-gpx.step.5':
    'Klik op ‘1 tocht importeren’ (of ‘3 tochten importeren’ bij een bestand met drie tracks).',
  'help.guide.tour-view-import.goal':
    'Bekijk het traject, de gegevens en het hoogteprofiel van een geïmporteerde tocht zoals die is binnengekomen.',
  'help.guide.tour-plan-from-import.title': 'Een bewerkbare tocht plannen op basis van een import',
  'help.guide.tour-plan-from-import.tip.3':
    'Bij een peddel- of ski-import worden de punten met rechte lijnen verbonden in plaats van gerouteerd.',
  'help.guide.tour-restore-recorded.tip.1':
    'De kaart verschijnt alleen bij een tocht die met ‘Import vervangen’ is vervangen en daarna is opgeslagen.',
  'help.guide.tour-take-over.step.4':
    'Klik op de tocht. Rechts zie je de lijn, de gegevens en de reis waar de tocht uit komt.',
  'help.guide.tour-import-wanderer.goal': 'Importeer een van de trails uit je eigen wanderer als tocht in de reis.',
  'help.guide.tour-import-wanderer.tip.4': '‘Openen in wanderer’ opent de trail op je eigen instantie.',
  'help.ctx.trip-tour-map.bullet.5':
    'In 3D ligt de route op het terrein, gekleurd naar hoe steil hij is, met een legenda die de hellingen samenvat en een overvlucht die de route van begin tot eind volgt.',
  'help.guide.tour-map-layers.tip.2':
    'Wandelen en Fietsen komen van servers van vrijwilligers en zijn er alleen zolang je beheerder ze toestaat. Reageert er een niet meer, dan toont het bijbehorende segment een ! en kun je naar een andere kaart wisselen; je tocht blijft zoals hij is.',
  'help.guide.tour-along-search.step.5':
    'De gevonden plaatsen staan in een lijst met hun afstand tot de route en verschijnen in hun kleur op de kaart. Een ster markeert de bekendste plekken, en ‘In de tocht’ de plekken die al een stop zijn. Op de knop staat nu ‘Opnieuw zoeken’.',
  'help.guide.tour-along-add-stop.step.2':
    '‘Waar het komt’ stelt het stuk voor waar de plaats het best past. Klik erop om in plaats daarvan te kiezen tussen welke twee stops hij komt, of ‘Als nieuw eindpunt’. De kaart toont de nieuwe route gestippeld voordat er iets verandert.',
  'help.guide.tour-3d-terrain.goal': 'Bekijk de tocht op het echte landschap, gekleurd naar hoe steil hij is.',
  'help.guide.tour-3d-terrain.tip.2':
    "De kaart die je hebt gekozen, wordt ook in 3D gebruikt, net als de via ferrata's, de pistes en de zeemarkeringen. Terwijl je een tocht bewerkt, kun je de punten op het terrein verslepen, en met ‘Punten plaatsen’ aan voegt een klik er een toe.",
  'help.guide.tour-3d-flyover.result':
    'Je hebt de tocht vanuit de lucht gezien, van begin tot eind, met de snelheid die je hebt gekozen.',
  'help.guide.tour-map-overlays.step.3':
    'De legenda laat zien wat de kleuren betekenen: de afdalingen van Beginner tot Freeride, Langlaufloipes, ‘Winter- en sneeuwschoenroutes’, Rodelbanen, en ‘Liften en kabelbanen’. ‘Volledige legenda op OpenSnowMap’ toont alle symbolen. Druk op Escape om de legenda te sluiten.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Met ‘Dagen’ in de editor maak je van de geopende tocht een ‘Dagtocht’ of een ‘Meerdaagse tocht’. Schakel je terug naar een dagtocht, dan worden na bevestiging alle etappe-einden verwijderd, en blijft de route zoals hij is.',
  'help.guide.tour-multi-day.step.2':
    'Klik onder ‘Dagen’ op ‘Meerdaagse tocht’. Een opmerking vertelt waar het eerste etappe-einde komt.',
  'help.guide.tour-multi-day.tip.4':
    'Etappes worden opgeslagen als je op ‘Opslaan’ klikt. Verwijdert een wijziging een etappe die op een dag van de reis staat, dan meldt TREK dat opslaan die etappe van die dag haalt.',
  'help.guide.tour-stages-on-days.step.5':
    'Bij elke etappe staat de dag waarop die staat. Klik op de dag om de etappe naar een andere dag te verplaatsen, of kies ‘Geen dag’ om haar eraf te halen.',
  'help.ctx.trip-tour-hike.summary':
    'Een wandeling of hardlooptocht die op het tabblad Tochten is geopend: de editor links, de kaart in het midden, het overzicht van de tocht en de andere tochten van de reis rechts. Een wandeling blijft binnen de moeilijkheid die je toestaat, een hardlooptocht wordt berekend op je eigen tempo, en bij allebei zie je wat OpenStreetMap onderweg vastlegt.',
  'help.guide.tour-hike-plan.goal':
    'Begin een wandeling, stel de stops in, kies de zwaarste padgraad die de route mag gebruiken, en sla de wandeling op.',
  'help.guide.tour-hike-plan.tip.1':
    'Een nieuwe wandeling begint op T2 (‘Bergwandelen’). Bij T3 komt er een waarschuwing dat zulke paden blootgesteld kunnen zijn en trefzekerheid vragen en dat je geen hoogtevrees mag hebben.',
  'help.guide.tour-hike-trail-details.step.3':
    'De badges vatten het samen: hoeveel van de route ‘Bekend’ is, de ‘Hoogste bekende’ graad en, apart weergegeven, de ‘Routelimiet’ waarmee de wandeling is gepland.',
  'help.guide.tour-hike-round.goal':
    'Laat TREK rondjes van de gewenste lengte voorstellen, vanaf een stop van een wandeling.',
  'help.guide.tour-hike-round.tip.2':
    'Afstanden van 1 tot 60 km zijn mogelijk, en je krijgt rondes aangeboden die maximaal 20 % van jouw afstand afwijken.',
  'help.guide.tour-hike-compare-ways.result':
    'Dat ene stuk volgt de weg die je hebt gekozen, en de rest van de wandeling blijft zoals hij was. ‘Weg overgenomen’ onderaan de kaart heeft ‘Ongedaan maken’.',
  'help.guide.tour-ferrata-add.step.3':
    'Klik op ‘Aan tocht toevoegen’. De klettersteig wordt aan het eind van de route toegevoegd als apart stuk, met een punt aan beide uiteinden.',
  'help.guide.tour-run-plan.title': 'Een hardlooptocht plannen op je eigen tempo',
  'help.guide.tour-run-plan.tip.1': 'Zonder tempo kun je de hardlooptocht niet opslaan.',
  'help.guide.tour-run-ways.step.3':
    'Klik op ‘Ondergrond’ en dan op een ondergrond in de lijst om alleen die stukken op de kaart te tonen.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Staat de wandeling op een dag met een starttijd, dan noemt ‘Tijden voor’ bovenaan ‘Waypoints’ die dag, en toont elke stop de aankomst, de verblijfsduur en wat de openingstijden zeggen.',
  'help.guide.tour-walk-plan.step.4':
    'Geef de stop een ‘Label’ en een ‘Verblijf in minuten’. Laat het verblijf leeg zolang je dat nog niet weet, en vul 0 in voor een punt waar je alleen langsloopt.',
  'help.guide.tour-walk-sights.goal': 'Kies een thema, zoek langs de wandeling en voeg een plaats toe als stop.',
  'help.guide.tour-walk-sights.tip.3':
    'Openingstijden en websites komen uit de bron, meestal OpenStreetMap. Controleer ze voordat je gaat.',
  'help.guide.tour-walk-day-times.tip.1':
    'Zonder starttijd meldt de regel dat: Geef de wandeling op deze dag een tijd om aankomsten en openingstijden te zien.',
  'help.guide.tour-walk-google-import.step.2': 'Plak de link bij ‘Link naar de wandelroute’ en klik op ‘Link lezen’.',
  'help.guide.tour-walk-check-off.goal':
    'Markeer stops op de dag als bezocht of overgeslagen en zie hoeveel je nog moet lopen.',
  'help.guide.tour-walk-check-off.result':
    'Bezochte stops zijn afgevinkt, overgeslagen stops doorgestreept, en de resterende tijd telt alleen wat nog komt.',
  'help.guide.tour-bike-profile.goal':
    'Begin een fietstocht en laat TREK de route plannen voor toerfietsen, racefiets, gravel of MTB.',
  'help.guide.tour-bike-profile.tip.1':
    'Wijzig je het profiel later, dan wordt de hele route opnieuw gepland voor het nieuwe profiel.',
  'help.guide.tour-bike-surfaces.step.2':
    'De badge in de kop van de kaart toont welk deel van de route zeker onverhard is.',
  'help.guide.tour-bike-mtb-grades.title': 'De padgraden van een mountainbiketocht controleren',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Konden de graden niet worden gelezen, dan meldt de kaart dat. Klik op ‘Opnieuw proberen’.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Zolang een tocht van het type ‘Ski en winter’ open is, toont de kaart de pistes van OpenSnowMap, met ‘Pistelegenda’ naast de schakelaar. Het zijn allemaal kaartgegevens: niets hier zegt of een piste of lift open is, hoe de sneeuw is, of iets over lawines.',
  'help.guide.tour-ski-plan.step.6': 'Geef de tocht een naam bij ‘Naam van de tocht’ en klik op ‘Opslaan’.',
  'help.guide.tour-ski-options.step.1':
    'In een tocht van het type ‘Ski en winter’ staan de opties van de router onder de ‘Discipline’. Je ziet alleen de opties die je discipline gebruikt: Langlaufen heeft bijvoorbeeld geen ‘Zwaarste pistes’.',
  'help.guide.tour-ski-options.result':
    'De tocht wordt opnieuw gepland binnen je grenzen, en de kaart ‘Pisteroute’ toont de zwaardere pistes die zijn vermeden.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline worden de stukken voorlopig recht getekend. Een grijze rij over zomerpaden is een opmerking, geen fout.',
  'help.guide.tour-ski-summary.tip.1':
    '‘Vermeden’ toont de zwaardere pistes die de router heeft gemeden vanwege je grens bij ‘Zwaarste pistes’.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Klik op ‘Pistelegenda’, de knop met vier gekleurde stippen naast de schakelaar.',
  'help.guide.tour-ski-import.step.1':
    'Klik op het tabblad Tochten op ‘Tocht toevoegen’ (de plus boven ‘Tochten van deze reis’), kies ‘GPX of KML importeren’ en selecteer het bestand.',
  'help.guide.tour-ski-import.tip.3':
    'Je kunt GPX-, KML- of KMZ-bestanden ook ergens op het tabblad Tochten neerzetten om hetzelfde voorbeeld te openen.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '‘Wind’ toont de verwachting bij het begin van de tocht voor de dag waarop die is gepland. ‘Controlelijst’ toont de obstakels op de opgeslagen route en wat je bij elk hebt besloten.',
  'help.guide.tour-paddle-setup.step.5':
    'Op een meer bepaalt ‘Over meren’ de route: ‘Rechtdoor’ is het kortst, ‘Dicht bij de oever’ blijft dicht bij de kant voor winderige dagen.',
  'help.guide.tour-paddle-water-route.title': 'De stukken op het water plannen',
  'help.guide.tour-paddle-water-route.tip.2':
    'Waar de route de boot om een stuw heen draagt of door een sluis gaat, zet TREK daar zelf een punt, gemarkeerd als ‘Gevonden’. Verplaats of wijzig je het, dan wordt het je eigen punt.',
  'help.guide.tour-paddle-portage.step.3':
    'Onder het punt verschijnt een kaart ‘Overdragen’ met de lengte en de extra minuten. Klik erop om die te openen.',
  'help.guide.tour-paddle-lock.goal': 'Zet een sluis op de tocht en tel de wachttijd en het schutten mee in de tijd.',
  'help.guide.tour-paddle-lock.result': 'De sluis staat op de tocht met de minuten, en de ‘Tijdschatting’ telt ze op.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK begint met 4 km/u op het water, 2 km/u bij het dragen en 10 minuten bij elk draagstuk. Dat zijn beginwaarden om aan te passen, geen metingen.',
  'help.guide.tour-paddle-wind.step.3':
    'De balken tonen de uren van de dag, met de windstoten achter de gemiddelde wind. Ga met de muis over een balk voor de cijfers en de richting van dat uur.',
  'help.guide.tour-paddle-checklist.goal':
    'Bekijk wat er bekend is over stuwen, sluizen en toegangsregels op een opgeslagen route, en beslis wat je bij elk obstakel doet.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Een item gemarkeerd met ‘Opnieuw controleren’ is beslist voordat de route of de gegevens veranderden. Beslis opnieuw, of kies ‘Beslissing behouden’ of ‘Beslissing verwijderen’. Beslissingen die niet meer gelden, staan onder ‘Eerdere beslissingen’.',
  'help.guide.tour-paddle-track-marks.step.3': 'Klik op ‘1 tocht importeren’.',
  'help.guide.tour-paddle-track-marks.result':
    'De opgenomen track bevat de draagstukken en sluizen, en de ‘Tijdschatting’ telt ze mee.',
  'help.guide.tour-horse-plan.title': 'Een rit plannen langs paardenroutes',
  'help.guide.tour-horse-plan.step.7':
    'Geef de rit een naam bij ‘Naam van de tocht’ en klik dan op ‘Opslaan’ onderaan de linkerkolom.',
  'help.guide.tour-horse-gap.goal': 'Ga verder met een traject dat niet bij het einde van je rit begint.',
  'help.guide.tour-horse-gap.tip.3':
    'Een traject dat binnen 25 m van het einde van je rit begint, sluit daar direct op aan, en bij ‘Aansluiting op je rit’ staat ‘Sluit aan op het einde van je rit’.',
  'help.guide.tour-horse-recorded.tip.1':
    'De lijn blijft precies zoals het bestand hem heeft vastgelegd. Er wordt niets opnieuw gerouteerd, en een opgenomen rit heeft geen bewerkbare versie.',
  'help.guide.dateless-trip.result':
    'De kaart toont ‘Idee’ en ‘Geen data ingesteld’, en de reis heeft zoveel lege dagen als je hebt opgegeven.',
  'help.guide.trip-reminder.title': 'Een herinnering krijgen voor een reis',
  'help.guide.upcoming-reservations.tip.1':
    'Een hotelverblijf staat er twee keer in: een keer voor het inchecken en een keer voor het uitchecken.',
  'help.guide.half-company-holiday.result':
    'Het bedrijf heeft die halve dag vrij, en een vakantiedag die je op die dag vastlegt, telt maar als halve dag.',
  'help.guide.edit-holiday-calendar.title': 'Een vakantiekalender wijzigen of verwijderen',
  'help.guide.answer-fusion-request.result':
    'Na ‘Accepteren en fuseren’ staan beide plannen in één raster, ieder in een eigen kleur.',
  'help.guide.log-for-partner.result':
    'De dagen staan in de kleur van de andere persoon en gaan af van diens recht, niet van het jouwe.',
  'help.guide.dissolve-fusion.tip.1':
    '‘Annuleren’ in dat venster laat het plan zoals het is; je invoer blijft hoe dan ook bewaard.',
  'help.guide.country-places.tip.1':
    'Een plaats onder het verkeerde land heeft meestal een verkeerd adres of verkeerde coördinaten. Open vanaf hier de reis en corrigeer de plaats daar.',
  'help.guide.tour-activity-stats.title': 'Zien wat je op je tochten hebt gedaan',
  'help.guide.tour-activity-stats.result':
    'De totalen in het venster en op het tabblad Tochten tellen de weggelaten tocht niet meer mee. De route, de dagen en de reis blijven zoals ze zijn.',
  'help.guide.move-to-list.tip.2':
    'Verplaatsen haalt plaatsen van de lijst, dus alleen de eigenaar of een beheerder ziet ‘Naar lijst verplaatsen’. ‘Naar lijst dupliceren’ werkt vanuit elke lijst die je kunt openen.',
  'help.guide.accept-list-invite.step.2':
    'Klik op ‘Accepteren’ om mee te doen, of op ‘Afwijzen’ om de uitnodiging af te slaan.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Is een tocht zonder lijn bewaard, dan moeten de waypoints worden meegenomen. Het venster meldt dat en kiest die optie voor je.',
  'help.guide.tour-collection-manage.tip.1':
    'Een tocht uit de lijst verwijderen verandert niets aan de tochten die je er al van hebt gemaakt in je reizen.',
  'help.guide.entry-draft.tip.2':
    'Neem je een dag over uit Dawarich, dan zijn de vermeldingen concepten. Kijk dus of de badge er staat voordat je deelt.',
  'help.guide.journey-map-layers.result':
    'De kaart toont alleen de lagen die je wilt, en de legenda legt elke speld, stip en lijn uit.',
  'help.guide.journey-keep-route.result':
    'De dagkop toont de afstand, en de route staat als doorgetrokken lijn op de laag ‘Opgenomen’ van de kaart, voor iedereen in het reisverslag. Een gedeelde link toont de route alleen als ‘Opgenomen routes’ aanstaat.',
  'help.guide.journey-day-stays.result':
    "De bezoeken waarover je hebt beslist, verdwijnen uit de rij. De vermeldingen die je hebt geschreven, staan op hun dag zoals elke andere vermelding, en je kunt er zoals altijd foto's en tekst aan toevoegen.",
  'help.guide.journey-take-over-day.tip.2':
    "Concepten verschijnen niet via gedeelde links. Voeg foto's en tekst toe en zet daarna in elke vermelding ‘Concept’ uit.",
  'help.guide.journey-auto-prepare.tip.2':
    'Een stip op de lijstknop van een dag betekent dat de dag nog niet definitief is; de tooltip vertelt waarom.',
  'help.ctx.settings-plugins.bullet.3':
    '‘Plugin-activiteit’ onderaan toont elke actie die een plugin namens jou heeft uitgevoerd, de nieuwste bovenaan, met ‘Vernieuwen’.',
  'help.guide.language-region.tip.3':
    '‘Week begint op’ bepaalt de eerste kolom van elke datumkiezer; Vakantie heeft een eigen instelling.',
  'help.guide.web-push-device.tip.2': 'Zet TREK op iPhone en iPad eerst op het beginscherm en open het daarvandaan.',
  'help.guide.connect-airtrail.step.3':
    'Klik op ‘Opslaan’ en dan op ‘Verbinding testen’. Je ziet hoeveel vluchten er zijn gevonden, en de badge verandert in ‘Verbonden’.',
  'help.guide.connect-dawarich.step.3':
    'Klik op ‘Opslaan’ en dan op ‘Verbinding testen’: die telt de bezoeken van de afgelopen 30 dagen. Na het koppelen controleert ‘Nu controleren’ meteen, en met ‘Verbinding verbreken’ rechts verbreek je de koppeling.',
  'help.guide.tour-connect-wanderer.step.3':
    'Klik op ‘Opslaan’ en dan op ‘Verbinding testen’. Je ziet hoeveel van je trails je kunt importeren, en de badge verandert in ‘Verbonden’.',
  'help.guide.tour-wanderer-watch.step.2':
    'Hooguit één keer per dag leest TREK de korte gegevens van elke trail die je hebt geïmporteerd, en de rij toont wanneer dat voor het laatst gebeurde. Is een trail mogelijk gewijzigd, dan krijg je een melding en telt ‘Meldingen’ hem mee: klik op ‘Meldingen’ om elke tocht te zien als ‘Mogelijk gewijzigd’, ‘Gewijzigd’ of ‘Niet te controleren’, en open hem van daaruit.',
  'help.guide.plugin-settings.goal':
    'Geef een plugin je eigen sleutels en voorkeuren, en bekijk wat hij namens jou heeft gedaan.',
  'help.guide.own-routing-engine.result': 'Routes in elke reis worden op jouw servers berekend.',
  'help.guide.admin-passkeys.title': 'Inloggen met passkey aanbieden',
  'help.guide.rotate-jwt-secret.tip.1': 'Je wordt zelf ook uitgelogd, dus log daarna meteen opnieuw in.',
  'help.guide.notification-defaults.title': 'Standaardmeldingen voor gebruikers instellen',
  'help.ctx.notifications.title': 'Meldingen',
  'help.guide.read-notifications.goal':
    'Zie wat er in je reizen is gebeurd terwijl je weg was, en ga er direct naartoe.',
  'help.guide.filter-notifications.goal':
    'Bekijk al je meldingen, of alleen de meldingen die je nog niet hebt gelezen.',
  'help.guide.mark-notifications-read.step.1':
    'Klik op ‘Markeren als gelezen’, het dubbele vinkje naast de tijd van een melding, om alleen die melding te markeren.',
  'help.guide.delete-notifications.step.2':
    '‘Alles verwijderen’ bovenaan verwijdert de hele lijst in één keer, nadat je dat in een venster hebt bevestigd.',
  'help.guide.notification-settings.step.3':
    'Klik in de zijbalk van Instellingen op ‘Meldingen’. De eerste kaart heeft een rij per gebeurtenis, en de kolom ‘In-app’ bepaalt wat er bij het belletje verschijnt.',
  'help.guide.link-journal.result':
    'In de tabbalk van de reis verschijnt een tabblad ‘Reisverslag’. Iedereen aan wie je ‘Lezen’ of ‘Bewerken’ hebt gegeven, kan het reisverslag op dat tabblad openen, met live updates.',
  'help.guide.create-place.tip.4':
    'Een link die je uit Google Maps hebt gekopieerd, werkt ook in het zoekveld: plak hem, druk op Enter, en TREK haalt de plaats eruit. Zodra het formulier een positie heeft, toont ‘Plaatsen in de buurt van deze pin’, het vizier naast het zoekveld, wat er in de buurt is.',
  'help.guide.dawarich-stays.step.2':
    'De bezoeken zijn per dag gegroepeerd, elk met je aankomst- en vertrektijd; een meterpictogram geeft aan dat Dawarich niet zeker was van een bezoek. Klik op ‘Als plaats toevoegen’, de speld naast een bezoek.',
  'help.guide.leave-stop-off-route.step.3':
    'Wil je de stop weer in de route, open dan hetzelfde menu en kies ‘Weer aan de route toevoegen’.',
  'help.guide.move-booking-day.tip.1':
    'De vervaagde rijen op de tussenliggende dagen van een boeking over meerdere dagen kun je niet slepen, en een los traject van een vlucht met tussenlandingen ook niet.',
  'help.guide.place-image-from-file.step.2':
    "Klik op de ronde afbeelding in de kop. Omdat de plaats foto's heeft, vraagt een klein venster waar de afbeelding vandaan moet komen.",
  'help.guide.place-own-hours.goal':
    'Zet de tijden die je zelf hebt gecontroleerd op de kaart, als de opgezochte tijden niet kloppen of ontbreken.',
  'help.guide.place-own-hours.tip.2':
    'Het telefoonnummer en het e-mailadres staan als pillen in de kop van de kaart. Klik erop om ze in je telefoon- of mail-app te openen.',
  'help.guide.edit-accommodation.tip.3':
    'Staat ‘Boekingscodes vervagen’ aan in Instellingen, onder Weergave, dan blijft het bevestigingsnummer vervaagd. Ga er met de muis overheen of klik erop om het te lezen.',
  'help.guide.confirm-stay-booking.tip.1':
    'Klik nog een keer op de pil om de boeking terug te zetten op ‘In behandeling’.',
  'help.guide.map-markers.tip.4':
    'Staat ‘Compacte markeringen voor ongeplande plaatsen’ aan, in Instellingen > Weergave onder Reizen en kaart, dan zijn plaatsen die nog op geen enkele dag staan kleine stippen zonder foto of beoordeling. De plaats die je kiest, wordt altijd volledig getoond.',
  'help.guide.tour-map-lines.step.1':
    'Elke tocht van de reis staat op de kaart als lijn in zijn kleur, met een speld waar hij begint. Heb je een kleur voor de tocht gekozen, dan krijgt de lijn die kleur. Anders krijgt de lijn de kleur van de categorie.',
  'help.guide.car-stops.step.6': 'Klik op ‘Toevoegen’.',
  'help.guide.transport-details.step.4':
    'Klik op de titel om de rit te hernoemen zonder het formulier te openen. ‘Hernoemen’ opent met de huidige naam ingevuld: typ de nieuwe naam en klik op ‘Opslaan’.',
  'help.guide.export-transports-csv.goal':
    'Exporteer de ritten van de reis uit TREK als CSV-bestand, voor een spreadsheet, een reisbureau of om af te drukken.',
  'help.guide.group-sort-bookings.result':
    'De boekingen staan in de secties en de volgorde die je hebt gekozen, en deze browser onthoudt die keuze voor de volgende keer.',
  'help.guide.booking-on-map.step.1':
    'Klik op de kaart van een boeking met een plaats, gekoppeld onder ‘Plaats / Activiteit’ of, bij een verblijf, onder ‘Accommodatie’. De details openen.',
  'help.guide.export-bookings-csv.title': 'Boekingen exporteren als spreadsheet',
  'help.guide.export-bookings-csv.tip.3':
    'De knop verschijnt zodra het tabblad een boeking heeft. Het tabblad Transport exporteert zijn eigen items op dezelfde manier.',
  'help.guide.arrange-packing-list.title': 'De inpaklijst in je eigen volgorde zetten',
  'help.guide.count-packed-pieces.result':
    'De rij toont hoeveel stuks er zijn ingepakt, en het item wordt afgevinkt zodra het laatste stuk erin zit.',
  'help.guide.expense-receipts.title': 'Een bonnetje bij een uitgave voegen',
  'help.guide.expense-receipts.tip.1':
    'In de editor opent een klik op de naam van een bestand in de lijst hetzelfde voorbeeld. Esc sluit dan alleen het voorbeeld, niet de uitgave.',
  'help.guide.files-sync-settings.step.5':
    '‘Als beide kanten zijn gewijzigd’ bepaalt welke kopie blijft als een document op beide plekken is bewerkt: ‘Vraag het mij’, ‘De TREK-kopie behouden’ of ‘De kopie in de opslag behouden’. Met ‘Automatisch synchroniseren’ controleert TREK op de achtergrond op wijzigingen; staat het uit, dan toont de kaart ‘Gepauzeerd’ en synchroniseert alleen ‘Nu synchroniseren’. Elke wijziging hier wordt meteen opgeslagen.',
  'help.guide.manage-notes.step.5':
    '‘Verwijderen’ vraagt eerst ‘Notitie verwijderen?’, omdat de notitie voor alle leden wordt verwijderd, samen met de bestanden. Klik op ‘Verwijderen’ om te bevestigen.',
  'help.guide.note-categories.step.3':
    'Klik op de naam van een categorie om die te hernoemen. Typ de nieuwe naam en druk op Enter; met Esc houd je de oude.',
  'help.guide.roadtrip-reorder.step.2':
    'Wil je een stop naar een andere dag verplaatsen, zet hem dan neer op een stop in de kaart van die dag. Tijdens het slepen verschijnt een dag met minder dan twee stops als gestippelde kaart aan het eind van de rail, en ook daarop kun je hem neerzetten.',
  'help.guide.roadtrip-corridor.tip.4':
    'Kies onder het filter één stop van de dag, of ‘Halverwege tussen twee’, om alleen te tonen wat binnen 25, 50 of 100 km van dat punt ligt. Staan er laadpalen in de lijst, dan filter je die met ‘Elke stekker’ en ‘Elk vermogen’ op stekker en vermogen.',
  'help.guide.roadtrip-overnight.result':
    'De plaats staat op de rit als overnachting voor die dag, en het verblijf is net als elk ander in de reis geboekt.',
  'help.guide.roadtrip-stop-fill.result':
    'Bij deze stop wordt de tank gevuld tot de waarde die je hebt gekozen. De actieradius daarna, inclusief een eventuele balk ‘Hier is de tank leeg’, wordt daarop gebaseerd.',
  'help.guide.roadtrip-bookings.step.4': 'Klik op de kaart om de boeking te openen.',
  'help.guide.roadtrip-google-import.goal':
    'Maak van een route die je in Google Maps hebt gepland stops op een van je dagen.',
  'help.guide.roadtrip-google-import.tip.3':
    'Voor de import heb je een verbinding nodig, en rechten om zowel plaatsen als dagen te bewerken.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD dekt Duitsland en GDACS meldt rampen wereldwijd. Wordt een waarschuwing alleen als punt gegeven, dan is het getroffen gebied onbekend.',
  'help.ctx.trip-tours.bullet.5':
    'In de dagenkolom is een tocht een rij, net als een stop. Met een ‘Start’ toont de rij start → einde, waarbij het einde wordt berekend uit de tijd van de tocht, en ‘Meer opties’ bevat ‘Bewerken’, ‘Verwijderen van dag’, ‘Uit de route halen’ en ‘In collectie opslaan’.',
  'help.guide.tour-show-list.step.5': 'Klik in dezelfde schakelaar op ‘Plaatsen’ om weer de plaatsenlijst te zien.',
  'help.guide.tour-add-to-day.step.2':
    'Kies de dag. Het menu toont elke dag van de reis met datum en titel; een dag waar de tocht al op staat, is grijs.',
  'help.guide.tour-add-to-day.result': 'De tocht staat onder zijn dag, en de lijn hoort op de kaart bij die dag.',
  'help.guide.tour-day-times.tip.2':
    'Een dag met één etappe van een meerdaagse tocht krijgt geen berekende eindtijd, omdat de tijd van de tocht voor de hele route geldt.',
  'help.guide.tour-remove-from-day.step.3':
    'Of klik op de kop van de dag om die te openen, klik op de tocht in de lijst en klik onderaan de tochtkaart op ‘Verwijderen van dag’.',
  'help.guide.tour-filter-list.step.3':
    'Bevat de lijst verschillende soorten, dan kun je verder filteren met ‘Bron’ (TREK, GPX-import, wanderer), ‘Routelimiet’ (T1 tot T6) en ‘Type’ (Wandeling, Fietstocht enzovoort). Klik nog een keer op een aangevinkte waarde om die te wissen.',
  'help.guide.tour-hide-on-map.step.1':
    'Wijs een tocht in de lijst aan en klik op het oog dat rechts in de rij verschijnt (‘Verbergen op de kaart’).',
  'help.guide.tour-import-plan-tab.step.1':
    'Klik op het tabblad Planning in de schakelaar bovenaan de rechterkolom op ‘Tochten’.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Klik op een tocht in de lijst Tochten (zet de rechterkolom eerst van Plaatsen op Tochten), op de rij ervan in een dag of op de lijn op de kaart, en de tochtkaart opent over de kaart. Je kunt de kaart blijven gebruiken terwijl de tochtkaart open is.',
  'help.guide.tour-detail-read.step.2':
    'De kop toont de naam van de tocht en een samenvatting in pillen: wat voor tocht het is, waar hij vandaan komt als hij is geïmporteerd, hoe lang hij volgens de planning duurt, de afstand, de stijging en de daling.',
  'help.guide.tour-detail-read.tip.3':
    'Sommige tochten tonen meer: een stadswandeling de stations, een peddeltocht de controles en de wind, een tocht die je al hebt gemaakt de ‘Werkelijke track’, en een tocht die aan een lijst is gekoppeld de ‘Inpaklijst’.',
  'help.guide.tour-rename-colour.step.3':
    'Klik op de gekleurde stip in de hoek van de ronde tegel van de tocht, ‘Trackkleur’. Het onderdeel ‘Trackkleur’ opent onder de kop.',
  'help.guide.tour-take-along.step.2':
    'Heeft de tocht een webpagina, dan staat op de knop ernaast de naam van de site (Komoot, AllTrails, Outdooractive of Wanderer), of ‘Website’ bij elke andere site. De knop opent de pagina in een nieuw tabblad.',
  'help.guide.tour-copy-keep.goal':
    'Maak een variant van een tocht in deze reis, of bewaar hem in een van je collecties voor latere reizen.',
  'help.guide.tour-copy-keep.tip.4':
    '‘Collectie’ is er alleen zolang de add-on Collecties aanstaat. Een lijst die je alleen mag lezen, kun je niet kiezen, en heb je nog geen lijst, dan biedt het venster ‘Collecties openen’.',
  'help.guide.tour-packing-link.step.5':
    'Klik op ‘Inpaklijst openen’ om dingen af te vinken. TREK gaat naar het tabblad Lijsten, naar de inpaklijst.',
  'help.guide.tour-files.step.2': 'De rij eronder telt ze nu, en de lijst gaat open.',
  'help.guide.tour-activity-link.step.2':
    'Controleer onder ‘Gedaan op’ de dag waarop je de tocht hebt gemaakt. Kies ‘Geen dag’ als die bij geen enkele dag hoort.',
  'help.guide.tour-activity-compare.title': 'De planning vergelijken met wat je hebt gedaan',
  'help.guide.tour-activity-compare.result':
    'Je vergelijkt de dag snel met de planning, op de tochtkaart en op de kaart.',
  'help.guide.tour-origin-check.tip.3':
    '‘Geen wanderer-verbinding’ betekent dat je account nog niet is gekoppeld. Koppel het in Instellingen, onder Integraties.',
  'help.ctx.trip-tour-planner.bullet.5':
    '‘Zoek plaats of adres’ bovenaan de kaart verplaatst de kaart. De pil linksonder wisselt tussen de kaarten die het type tocht biedt, zoals Topo of Satelliet, en bevat de schakelaars van de geopende tocht, zoals ‘Punten plaatsen’ en 3D.',
  'help.guide.tour-open-workspace.step.5':
    '‘Zoek plaats of adres’ bovenaan de kaart verplaatst de kaart naar een plek, zodat je kunt beginnen waar de tocht is.',
  'help.guide.tour-draw-route.goal':
    'Zet de punten van een nieuwe tocht op de kaart en laat TREK de route ertussen berekenen.',
  'help.guide.tour-draw-route.tip.2':
    'Met Topo of Wandelen in de pil van de kaart zie je de paden, zodat je er makkelijker een aanklikt. Ligt een punt te ver van een weg die het type kan gebruiken, dan krijg je een melding in plaats van een route.',
  'help.guide.tour-type-profile.step.3':
    'Bij een fietstocht kies je onder het type het ‘Profiel’: Toer, Racefiets, Gravel of MTB. De regel eronder vertelt waar het profiel de voorkeur aan geeft.',
  'help.guide.tour-edit-points.step.2':
    'Klik op een rij onder ‘Waypoints’ om dat punt te selecteren. De speld wordt op de kaart gemarkeerd.',
  'help.guide.tour-shaping-points.title': 'De route bijsturen met een vormpunt',
  'help.guide.tour-shaping-points.tip.3':
    'Bij een rit te paard voegt een klik op de lijn niets toe, omdat geen router de route bepaalt.',
  'help.guide.tour-loop-reverse.tip.2':
    'Verwijder de rij ‘Terug naar start’ om er weer een enkele reis van te maken. Een met de hand getekend stuk blijft met de hand getekend als je de tocht omdraait.',
  'help.guide.tour-leg-by-hand.step.4':
    '‘Volgend deel opnieuw berekenen’ laat de router alleen dat ene stuk opnieuw plannen, zonder de andere te wijzigen.',
  'help.guide.tour-trip-places.step.3':
    'Klik op een plaats. Die wordt toegevoegd als nieuw eindpunt van de tocht, en de lijst blijft open voor de volgende.',
  'help.guide.tour-details-times.step.1':
    '‘Naam van de tocht’ bovenaan de linkerbalk bevat de naam. Bij een nieuwe tocht is de grijze tekst daar, bijvoorbeeld ‘Naamloze wandeling’, alleen een voorbeeld: typ je eigen naam.',
  'help.guide.tour-save.title': 'Een tocht opslaan',
  'help.guide.tour-save.tip.3':
    'Opslaan lukt ook niet zolang een veld een ongeldige waarde heeft, zoals een website die geen adres is. Details klapt dan vanzelf open om het veld te tonen.',
  'help.guide.tour-edit-saved.tip.1': '‘Opslaan’ blijft grijs bij een tocht die je niet hebt gewijzigd.',
  'help.guide.tour-summary-profile.step.3':
    'Beweeg de aanwijzer over het ‘Hoogteprofiel’. Je ziet de afstand en de hoogte op dat punt, en een stip markeert dezelfde plek op de kaart.',
  'help.guide.tour-list-manage.step.1':
    '‘Totalen van de reis’ staat boven de lijst. Ingeklapt toont het het aantal tochten en hoeveel er ‘Gepland’ en ‘Ongepland’ zijn. Met de pijl rechts open je een regel per type met de opgetelde afstand, stijging, daling en tijden.',
  'help.guide.tour-list-manage.result':
    'Je ziet de totalen van de tochten die het filter toont, en elke tocht staat op de dag die je wilt.',
  'help.guide.tour-delete.result': 'De tocht is verdwenen uit de lijst, van de kaart en van elke dag.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Hetzelfde gebeurt als je de tocht op een ander apparaat hebt gewijzigd. Een tocht die je niet hebt gewijzigd, wordt gewoon opnieuw geladen, en een melding vertelt je dat.',
  'help.ctx.trip-tour-import.bullet.5':
    'Zodra wanderer is gekoppeld onder Instellingen, Integraties, verschijnt er naast ‘Nieuwe tocht plannen’ een knop wanderer zolang er geen tocht open is. Die toont je eigen trails om te importeren.',
  'help.guide.tour-import-gpx.tip.1':
    'Je kunt de bestanden ook vanaf je computer naar het tabblad Tochten slepen en daar neerzetten. Hetzelfde voorbeeld opent.',
  'help.guide.tour-view-import.step.1':
    'Klik op het tabblad Tochten in ‘Tochten van deze reis’ op een tocht met de badge ‘GPX-import’.',
  'help.guide.tour-plan-from-import.goal':
    'Maak van een opgenomen track waypoints die je kunt verplaatsen, en zie hoe dicht de nieuwe route bij de track blijft.',
  'help.guide.tour-plan-from-import.tip.4':
    'Een ‘Rit te paard’ heeft geen bewerkbare versie: die blijft zoals hij is gereden.',
  'help.guide.tour-restore-recorded.tip.2':
    'Een tocht die je met ‘Als nieuwe tocht plannen’ hebt gemaakt, heeft geen eigen opgenomen track. De import waaruit hij is ontstaan, staat nog in de lijst.',
  'help.guide.tour-take-over.step.5': 'Geef de tocht desgewenst een andere naam bij ‘Naam in deze reis’.',
  'help.guide.tour-import-wanderer.step.1':
    'Klik op het tabblad Tochten, zonder geopende tocht, op wanderer naast ‘Nieuwe tocht plannen’.',
  'help.guide.tour-import-wanderer.result':
    'De trail is een tocht van de reis en opent op de kaart als wanderer-tocht.',
  'help.guide.tour-map-layers.title': 'De kaart voor een tocht kiezen',
  'help.guide.tour-map-layers.tip.3':
    'Een peddeltocht en een stadswandeling bieden alleen Kaart en Satelliet; een hardlooptocht, een skitocht en een rit te paard bieden Kaart, Topo en Satelliet.',
  'help.guide.tour-along-search.result':
    'De plaatsen langs de route staan in de lijst en op de kaart, klaar om te bekijken.',
  'help.guide.tour-along-add-stop.step.3':
    'Klik op ‘Als stop toevoegen’. De badge ernaast is een ruwe schatting van de omweg, hemelsbreed gemeten.',
  'help.guide.tour-3d-terrain.step.1':
    'Open een tocht op het tabblad Tochten en klik op 3D aan het eind van de pil linksonder. De kaart kantelt en toont het terrein in 3D, met de route erop.',
  'help.guide.tour-3d-terrain.tip.3':
    'Voor het landschap heb je een verbinding nodig: de hoogtes komen uit de open terreintegels van Mapzen. Een peddeltocht wordt in een eigen kleur getoond, zonder hellingen, omdat water vlak is.',
  'help.guide.tour-3d-flyover.tip.1':
    'Scrol tijdens de overvlucht met het muiswiel om in of uit te zoomen; de camera blijft op de stip gericht. Je kunt de kaart pas verslepen als je pauzeert.',
  'help.guide.tour-map-overlays.step.4':
    'Bij een peddeltocht biedt de pil in plaats daarvan ‘Zeemarkeringen’. Klik erop om boeien, bakens en havenmarkeringen op het water te tonen.',
  'help.ctx.trip-tour-stages.bullet.2':
    '‘Etappe hier beëindigen’ in het menu ‘Meer acties’ van een stop laat een etappe bij die stop eindigen. ‘Waypoints’ toont dan voor elke etappe een kop Etappe N met afstand en tijd, en de stop waar een etappe eindigt, heeft een maanpictogram.',
  'help.guide.tour-multi-day.step.3':
    'Wijs de stop aan waar de eerste dag eindigt, klik op ‘Meer acties’ en kies ‘Etappe hier beëindigen’.',
  'help.guide.tour-multi-day.result': 'Eén route met etappes, elk apart gemeten. Klik op ‘Opslaan’ om ze te bewaren.',
  'help.guide.tour-stages-on-days.step.6':
    'De pijl ernaast, ‘Deze etappe openen in de planner’, opent de tocht in de editor bij die etappe.',
  'help.ctx.trip-tour-hike.bullet.1':
    '‘Soort tocht’ bovenaan de editor bepaalt hoe de route wordt gepland. ‘Wandeling’ gebruikt paden tot de ‘Maximale moeilijkheid van het pad’ onder Details; ‘Hardlooptocht’ gebruikt wegen waarop je kunt hardlopen en vraagt om je ‘Gepland tempo’.',
  'help.guide.tour-hike-plan.step.1':
    'Klik bovenaan de linkerkolom op ‘Nieuwe tocht plannen’. De editor opent als ‘Nieuwe tocht’.',
  'help.guide.tour-hike-plan.tip.2':
    'Vanaf T4 vraagt TREK eerst ‘Alpiene routeberekening inschakelen?’. Bevestig alleen als de route door blootgesteld of ongemarkeerd terrein mag gaan; de vraag komt één keer per bewerksessie.',
  'help.guide.tour-hike-trail-details.step.4':
    'Klik op een graad in de lijst om alleen die stukken op de kaart te tonen. Klik er nog een keer op om de hele route te zien.',
  'help.guide.tour-hike-round.step.1':
    'Klik bij de geopende wandeling in de kop van de kaart ‘Waypoints’ op ‘Rondwandeling vanaf de start’. Wil je vanaf een andere stop beginnen, open dan ‘Meer acties’ van die stop en kies ‘Rondwandeling vanaf hier’.',
  'help.guide.tour-hike-round.tip.3':
    '‘Opnieuw zoeken’ gaat terug naar de afstand, en ‘Annuleren’ sluit de kaart zonder iets te wijzigen.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Dit kan alleen bij wandelingen, en alleen voor een stuk dat de router heeft gepland, niet voor een met de hand getekend stuk.',
  'help.guide.tour-ferrata-add.step.4':
    'In ‘Waypoints’ toont het stuk tussen die twee punten de naam, de moeilijkheidsgraad en de lengte van de klettersteig.',
  'help.guide.tour-run-plan.goal':
    'Plan een hardlooptocht over wegen waarop je kunt hardlopen en laat de tijd berekenen op basis van je tempo.',
  'help.guide.tour-run-plan.tip.2':
    'Stijgingen, dalingen en hoe technisch de weg is, tellen niet mee in de tijd: die is gewoon afstand maal tempo.',
  'help.guide.tour-run-ways.result':
    'Je weet al voordat je vertrekt welke delen van de hardlooptocht niet over asfalt gaan.',
  'help.ctx.trip-tour-walk.bullet.4':
    '‘Langs de tocht’ zoekt bezienswaardigheden per ‘Thema van de wandeling’ binnen een bepaalde afstand van de route, en met ‘Als stop toevoegen’ plan je er een in de wandeling op de plek die je kiest.',
  'help.guide.tour-walk-plan.step.5':
    'Zet ‘Belang’ op Gewoon, Optioneel of ‘Niet missen’. Zet ‘Beschermd’ aan voor een stop die op zijn plek moet blijven als er later een wijziging wordt voorgesteld, en klik dan op ‘Opslaan’.',
  'help.guide.tour-walk-sights.step.1':
    'Zoek bij een geopende stadswandeling ‘Langs de tocht’ in de linkerkolom en kies een ‘Thema van de wandeling’: ‘Cultuur en geschiedenis’, ‘Parken en uitzicht’, ‘Eten en het lokale leven’ of ‘Van alles wat’.',
  'help.guide.tour-walk-sights.result':
    'De bezienswaardigheid is een stop van de wandeling, in de route gepland tussen de stops die je hebt gekozen.',
  'help.guide.tour-walk-day-times.tip.2':
    'Heeft een stop nog geen verblijfsduur, dan worden de aankomsttijden daarna getoond als de vroegst mogelijke tijden.',
  'help.guide.tour-walk-google-import.step.3':
    'Controleer ‘Haltes in de link’. Een stop zonder positie in de link wordt gemarkeerd en weggelaten.',
  'help.guide.tour-walk-check-off.step.1':
    'Klik op het tabblad Planning op de stadswandeling in de dag waarop die staat. De tochtkaart opent naast de kaart.',
  'help.ctx.trip-tour-bike.title': 'Fietstochten',
  'help.guide.tour-bike-profile.step.1':
    'Klik op het tabblad Tochten bovenaan de linkerbalk op ‘Nieuwe tocht plannen’.',
  'help.guide.tour-bike-profile.tip.2':
    'Een profiel stuurt alleen de router. Het zegt niets over of een weg berijdbaar is: de kaart ‘Ondergrond en wegen’ laat zien waarover de route gaat.',
  'help.guide.tour-bike-surfaces.step.3':
    'Klik onder ‘Ondergrond’ op een rij, zoals Gravel of ‘Natuurlijke ondergrond’. De bijbehorende stukken worden op de kaart gemarkeerd. Klik nog een keer op de rij om de markering weg te halen.',
  'help.guide.tour-bike-mtb-grades.goal': 'Zie hoe zwaar de paden van een MTB-tocht zijn voordat je ze rijdt.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Zet je ‘Profiel’ op iets anders dan MTB, dan verdwijnen de stukken met moeilijkheidsgraden. De route wordt dan opnieuw gepland voor het nieuwe profiel.',
  'help.guide.tour-ski-plan.title': 'Een ski- en wintertocht plannen',
  'help.guide.tour-ski-plan.tip.1':
    'Kies bij Langlaufen ook de ‘Techniek’: Klassiek, Skating of Onbekend. De melding onder de velden vertelt wat er nog ontbreekt.',
  'help.guide.tour-ski-options.step.2':
    'Open ‘Zwaarste pistes’ en kies de hoogste moeilijkheidsgraad die je wilt skiën, van Beginner tot Expert. Gemiddeld is de standaard.',
  'help.guide.tour-ski-fix-leg.title': 'Een skistuk herstellen dat niet kon worden gepland',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Tot elk stuk is gepland, meldt de kaart ‘Pisteroute’ dat er nog geen skitijd is.',
  'help.guide.tour-ski-summary.tip.2':
    '‘Skitijd’ blijft ‘Niet berekend’ tot elk stuk is gepland. Wil je de tocht toch een tijd geven, vul dan in de details een gepland totaal in.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'De legenda toont de afdalingen naar moeilijkheid, de langlaufloipes, de winter- en sneeuwschoenroutes, de rodelbanen en de liften. ‘Volledige legenda op OpenSnowMap’ opent de complete legenda.',
  'help.guide.tour-ski-import.step.2': 'Open in het ‘Importvoorbeeld’ ‘Importeren als’ en kies ‘Ski en winter’.',
  'help.guide.tour-ski-import.result':
    'De track staat in ‘Tochten van deze reis’, met de discipline en techniek op de kaart ‘Skispoor’.',
  'help.ctx.trip-tour-paddle.bullet.6':
    "‘Peddelen heeft risico's’, de rij onderaan de linkerkolom, opent ‘Veiligheid op het water’. De kaart biedt Kaart en Satelliet, en ‘Zeemarkeringen’ als extra laag.",
  'help.guide.tour-paddle-setup.step.6':
    '‘Peddeltempo’ toont de voorgestelde snelheid voor de boot in grijs. Typ je eigen snelheid, dan toont het veld ‘Eigen tempo’; met de link eronder, ‘Het voorgestelde gebruiken’, neem je weer de snelheid van de boot.',
  'help.guide.tour-paddle-water-route.goal':
    'Laat TREK een stuk over de rivier of het meer plannen, en begrijp de opmerkingen bij een stuk dat niet kon worden gepland.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Opmerkingen onder een gepland stuk wijzen op ‘Wildwater’ met de moeilijkheidsgraad, een ‘Kanogoot’ of een ‘Gat in de kaartgegevens’ dat met een rechte lijn is overbrugd.',
  'help.guide.tour-paddle-portage.step.4':
    'Onder ‘Route’ volgt ‘Het pad volgen’ een weg op de kaart en gaat ‘Rechte lijn’ er direct overheen. TREK zoekt zelf naar het pad en meldt het als er geen pad is zonder lange omweg.',
  'help.guide.tour-paddle-lock.step.1': 'Wijs de stop bij de sluis aan en klik op ‘Meer acties’, de drie puntjes.',
  'help.guide.tour-paddle-time.title': 'De tijd van een peddeltocht bekijken en aanpassen',
  'help.guide.tour-paddle-time.tip.2': 'Stroming en wind tellen niet mee in de schatting.',
  'help.guide.tour-paddle-wind.step.4':
    'Open ‘Wat wind betekent voor peddelen’ om te lezen wat tegenwind, zijwind, open oversteken en windstoten met een boot doen.',
  'help.guide.tour-paddle-checklist.step.1':
    'Sla de peddeltocht op en zoek dan ‘Controlelijst’ in de linkerkolom. De badge in de kop vat samen hoe de lijst ervoor staat.',
  'help.guide.tour-paddle-checklist.tip.4':
    "Obstakels komen uit de OpenStreetMap-gegevens van de regio's die TREK beschikbaar heeft. Zijn er voor een regio geen gegevens, dan meldt de kaart dat, en controleer je stuwen, sluizen en draagstukken zelf.",
  'help.guide.tour-paddle-track-marks.step.4':
    'Klik op de track in ‘Tochten van deze reis’. De linkerkolom toont hem zoals hij is opgenomen, met de kaart ‘Overdraagplaatsen en sluizen’.',
  'help.ctx.trip-tour-horse.title': 'Ritten te paard',
  'help.guide.tour-horse-plan.goal':
    'Stel een rit te paard samen uit trajecten van de bewegwijzerde paardenroutes in de kaartweergave.',
  'help.guide.tour-horse-plan.result':
    'De rit volgt de trajecten die je hebt gekozen, elk met de naam van de route, een stip voor de toegang en de lengte, en staat onder ‘Tochten van deze reis’.',
  'help.guide.tour-horse-gap.step.1':
    'Heeft de rit al een traject, open dan een andere route en kies een traject dat niet aansluit op het einde van je rit. Onder ‘Aansluiting op je rit’ meldt TREK hoe ver ze uit elkaar liggen.',
  'help.guide.tour-horse-recorded.title': 'Een opgenomen rit uit een GPX-bestand bewaren',
  'help.guide.tour-horse-recorded.tip.2':
    'Een bestand zonder hoogtes toont ‘Geen hoogtes in het bestand’ in plaats van een stijging van nul.',
  'help.guide.dateless-trip.tip.1':
    'Weet je wanneer je gaat? Open dan het formulier met het potlood op de kaart en kies de data. Je geplande dagen blijven in dezelfde volgorde staan en krijgen in die volgorde hun datum.',
  'help.guide.trip-reminder.goal': 'Krijg een paar dagen voor vertrek een herinnering.',
  'help.guide.upcoming-reservations.tip.2':
    '‘In behandeling’ betekent dat een boeking nog niet bevestigd is. Geannuleerde boekingen en gearchiveerde reizen worden niet getoond.',
  'help.guide.half-company-holiday.tip.1':
    'Vakantie die al op die dag staat, wordt ingekort tot een halve dag. Wie die dag later invoert, gebruikt er maar 0,5 dag voor.',
  'help.guide.edit-holiday-calendar.goal':
    'Wijzig de naam, kleur of positie van een kalender met feestdagen of schoolvakanties die je hebt toegevoegd, of verwijder hem.',
  'help.guide.person-color.title': 'De kleur van een persoon wijzigen',
  'help.guide.answer-fusion-request.tip.1':
    'Het verzoek blijft openstaan tot je erop reageert. Zijn er meerdere verzoeken, dan krijg je ze een voor een te zien.',
  'help.guide.log-for-partner.tip.1': '‘Halve dag’ en ‘Compensatie’ werken ook voor de geselecteerde persoon.',
  'help.guide.dissolve-fusion.tip.2': 'Wil je iemand alleen je dagen laten zien? Deel dan je agenda.',
  'help.guide.country-details.tip.2':
    'Klik op de badge ‘Plaatsen’ om alle plaatsen te zien die voor het land meetellen, gegroepeerd per reis.',
  'help.guide.country-places.tip.2':
    'De badge verschijnt alleen als het land eigen plaatsen heeft. Een land dat je alleen handmatig hebt gemarkeerd, heeft er geen.',
  'help.guide.tour-activity-stats.goal':
    'Bekijk de afstand, het aantal hoogtemeters en het aantal tochten van al je reizen samen, per periode en soort, en laat een tocht weg die niet is doorgegaan.',
  'help.guide.tour-activity-stats.tip.1':
    'Een tocht telt mee zodra zijn laatste dag voorbij is. Een tocht die op geen enkele dag staat, of alleen op dagen zonder datum, telt nooit mee. Wil je hem laten meetellen, zet hem dan op een dag met datum in zijn reis.',
  'help.guide.move-to-list.result':
    'De plaatsen staan op de andere lijst en een korte melding laat zien hoeveel er zijn verplaatst of gedupliceerd.',
  'help.guide.accept-list-invite.tip.1':
    'Wat je op de lijst kunt doen, hangt af van de rol die de eigenaar je heeft gegeven: Kijker, Bewerker of Beheerder.',
  'help.guide.tour-collection-add-to-trip.title': 'Een tocht uit een lijst aan een reis toevoegen',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Wil je een tocht in een lijst bewaren? Open een opgeslagen tocht in de reis en klik onderaan op ‘Collectie’.',
  'help.guide.tour-collection-manage.tip.2': 'Alleen de eigenaar en de beheerders van de lijst zien de prullenbak.',
  'help.guide.entry-draft.result':
    'De vermelding blijft in je tijdlijn staan met het label ‘Concept’ en is niet te zien via de gedeelde link.',
  'help.guide.journey-map-layers.title': 'Kiezen wat de kaart van je reisverslag toont',
  'help.guide.journey-keep-route.title': 'De opgenomen route van een dag bewaren',
  'help.guide.journey-day-stays.title': 'Vermeldingen schrijven op basis van de bezoeken uit Dawarich',
  'help.guide.journey-take-over-day.title': 'Een hele opgenomen dag overnemen',
  'help.guide.journey-take-over-day.result':
    'De dag heeft nu één concept per bezoek of samengevoegde groep, of één dagverslag, en de bezoeken staan niet meer als openstaand vermeld.',
  'help.guide.journey-auto-prepare.result':
    'Zolang een gekoppelde reis loopt, staan de bezoeken van elke dag bij die dag klaar voor ‘Dag overnemen’.',
  'help.ctx.settings-about.title': 'Over',
  'help.guide.web-push-device.tip.3':
    'Pushmeldingen werken alleen als je TREK via HTTPS opent. Zijn meldingen geblokkeerd? Sta ze dan toe in je browserinstellingen en probeer het opnieuw.',
  'help.guide.connect-airtrail.result':
    'Op de badge staat ‘Verbonden’ en op het tabblad Transport van een reis kun je kiezen voor ‘Importeren uit AirTrail’.',
  'help.guide.connect-dawarich.result':
    'Op de badge staat ‘Verbonden’ en de reisplanner, het reisverslag en Atlas kunnen gebruiken wat Dawarich heeft vastgelegd.',
  'help.guide.tour-connect-wanderer.result':
    'Op de badge staat ‘Verbonden’ en op het tabblad Tochten van een reis kun je in je wanderer zoeken en routes importeren.',
  'help.guide.tour-wanderer-watch.result':
    'TREK controleert je geïmporteerde routes en laat het je weten als er een mogelijk is gewijzigd. Een tocht verandert pas als jij de wijziging accepteert.',
  'help.guide.plugin-settings.step.1':
    'Open ‘Plugins’ in de zijbalk van de instellingen. Onder ‘Plug-in-instellingen’ heeft elke plugin die instellingen van je nodig heeft een kaart met velden: vul ze in en klik op ‘Opslaan’. Acties op de kaart worden pas uitgevoerd nadat je ze bevestigt.',
  'help.guide.profile.step.3': 'Klik rechts onderaan de kaart op ‘Profiel opslaan’.',
  'help.guide.default-user-settings.title': 'Instellen waarmee nieuwe gebruikers beginnen',
  'help.guide.own-routing-engine.tip.1':
    'De openbare OSRM-servers staan ongeveer één verzoek per seconde toe. Dat is genoeg voor één dag, maar kan voor een roadtrip te traag zijn.',
  'help.guide.admin-passkeys.goal':
    'Laat mensen inloggen met hun vingerafdruk, hun gezicht of de pincode van hun apparaat.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Wil je maar één persoon uitloggen? Geef die persoon dan een Nieuw wachtwoord via Gebruiker bewerken. Daarmee worden alleen diens sessies beëindigd.',
  'help.guide.notification-defaults.goal':
    'Bepaal met welke meldingsinstellingen elke gebruiker begint, en blokkeer een kanaal volledig voor een gebeurtenis.',
  'help.ctx.notifications.summary':
    'Alle meldingen die TREK je in de app heeft getoond, de nieuwste bovenaan: een boeking die iemand heeft gewijzigd, een nieuw bericht in een reischat, een agenda die met je is gedeeld. De bel rechtsboven toont de nieuwste tien, op deze pagina staan ze allemaal.',
  'help.guide.read-notifications.step.1':
    'Klik rechtsboven op de bel. Het rode getal erop geeft aan hoeveel meldingen je nog niet hebt gelezen.',
  'help.guide.filter-notifications.step.1': 'Klik rechtsboven op de bel.',
  'help.guide.mark-notifications-read.step.2':
    'Klik bovenaan op ‘Alles als gelezen markeren’ om alle meldingen in één keer als gelezen te markeren.',
  'help.guide.delete-notifications.tip.1':
    'Als je een melding verwijdert, verdwijnt die alleen bij jou. De boeking, het bericht of de gedeelde agenda waar de melding over ging, blijft gewoon bestaan.',
  'help.guide.notification-settings.tip.1':
    'Een slotje in een cel betekent dat de beheerder die gebeurtenis voor iedereen heeft uitgezet.',
  'help.guide.add-guest.tip.3':
    'Alleen de eigenaar van de reis kan gasten toevoegen, hernoemen en verwijderen. Een gast die een uitgave heeft betaald, kun je pas verwijderen als je de betaler wijzigt of de betaling verwijdert.',
  'help.guide.link-journal.tip.1':
    'Je kunt alleen reisverslagen koppelen waarvan je zelf de eigenaar bent. Een reisverslag waarin je alleen mag schrijven, kun je niet koppelen.',
  'help.ctx.trip-places.bullet.7':
    'Met het vinkje naast het zoekveld begin je een selectie. Via de balk onderaan de kolom geef je meerdere rijen tegelijk een nieuwe categorie, voeg je ze toe aan een collectie, markeer je ze als bezocht of verwijder je ze.',
  'help.guide.filter-places.step.5':
    'Zodra de reis meer dan één land of regio omvat, kun je met de wereldbol de lijst beperken tot één land, of tot één regio daarin, elk met het aantal erbij. Met ‘Filter wissen’ ga je terug naar ‘Alle landen’.',
  'help.guide.import-places-file.tip.3':
    'Staat Tochten aan, zoals standaard het geval is, dan importeer je een bestand via Tochten bovenaan de kolom, met ‘GPX of KML importeren’. De lijnen worden dan tochten. De markeringen in het bestand worden daar niet geïmporteerd, omdat tochten alleen uit lijnen bestaan.',
  'help.guide.dawarich-stays.step.3':
    'Controleer Naam, Aangekomen en Vertrokken, kies een Dag of laat het op ‘Nog niet op een dag’ staan, voeg eventueel Notities toe en klik op ‘Plaats toevoegen’.',
  'help.guide.leave-stop-off-route.result':
    'De stop hoort nog steeds bij de dag en staat in de PDF. Zolang hij op ‘Buiten de route’ staat, loopt de route rechtstreeks van de stop ervoor naar de stop erna.',
  'help.guide.move-booking-day.tip.2':
    'Binnen dezelfde dag springt een boeking met een tijd altijd terug naar de plek die bij die tijd hoort.',
  'help.guide.place-image-from-file.step.3':
    'Klik onder ‘Uit bijgevoegde bestanden’ op de foto die je wilt. Met ‘Uploaden vanaf apparaat’ daarboven kies je in plaats daarvan een nieuwe foto van je computer.',
  'help.guide.place-own-hours.step.1':
    'Open de plaats en klik rechtsonder op de kaart op ‘Bewerken’. Het formulier van de plaats wordt geopend.',
  'help.guide.place-own-hours.tip.3':
    'Klik op ‘Openingstijden verwijderen’ en daarna op ‘Bijwerken’ om weer de automatisch gevonden openingstijden op de kaart te tonen.',
  'help.guide.confirm-stay-booking.title': 'De boeking van een verblijf bevestigen',
  'help.guide.confirm-stay-booking.tip.2':
    'Hetzelfde label werkt in elke boeking, ook bij de boekingen onder Reserveringen op de dag.',
  'help.guide.map-lock.tip.2':
    'Deze browser onthoudt de vergrendeling per reis. Als je een reis opent, zoomt de kaart toch één keer in op de reis, zodat je nooit op een leeg stuk kaart begint.',
  'help.guide.tour-map-lines.step.2':
    'Klik op de lijn of op de markering aan het begin. De kaart van de tocht opent onderaan over de kaart, en de lijn wordt breder getekend met een witte rand, zodat je hem tussen de andere lijnen herkent. Met de X bovenaan sluit je de kaart.',
  'help.guide.car-stops.title': 'Een autorit met tussenstops plannen',
  'help.guide.car-stops.result':
    'De rit staat als kaart op het tabblad Transport en als rij op zijn dag. De lijn op de kaart loopt van het ophaalpunt via alle tussenstops, in volgorde, naar het inleverpunt.',
  'help.guide.transport-details.step.5':
    'Met ‘Op kaart’ onderaan de details zie je de lijn van de rit en open je de Planning op die dag. Met ‘Bewerken’ helemaal rechts open je het volledige formulier, en met de prullenbak ernaast verwijder je de rit nadat je het hebt bevestigd.',
  'help.guide.export-transports-csv.step.1':
    'Wil je maar een deel van de lijst, beperk die dan eerst. Zoeken, Filter en de sortering onder Weergaveopties tellen allemaal mee: het bestand bevat precies wat het tabblad toont, in dezelfde volgorde.',
  'help.guide.group-sort-bookings.tip.1':
    'Kaarten en Lijst hebben elk hun eigen groepering: Kaarten begint met Status, Lijst met Dag. Een stip op Weergaveopties betekent dat er iets afwijkt van de standaard. Met ‘Weergave resetten’ onderaan het paneel zet je alles terug.',
  'help.guide.booking-on-map.step.2': 'Klik onderaan de details op ‘Op kaart’.',
  'help.guide.export-bookings-csv.goal':
    'Exporteer de boekingen van de reis als CSV-bestand om te openen in Excel, Numbers of een ander rekenprogramma.',
  'help.guide.arrange-packing-list.goal':
    'Zet hele lijsten en losse items waar je ze wilt hebben, of bekijk elke lijst op alfabetische volgorde.',
  'help.guide.check-off-packing.tip.4':
    'Heeft een item een aantal hoger dan één, dan kun je de stuks ook een voor een als ingepakt markeren. Zie ‘Meerdere stuks van één ding inpakken’.',
  'help.guide.count-packed-pieces.tip.1':
    'Vink je het vakje aan, dan zijn alle stuks in één keer ingepakt. Vink je het uit, dan zijn ze allemaal weer uitgepakt.',
  'help.guide.expense-receipts.goal':
    'Bewaar het bonnetje of de factuur bij de bijbehorende uitgave en open het later weer vanuit het overzicht.',
  'help.guide.expense-receipts.tip.2':
    'Met de prullenbak naast een bonnetje haal je het van de uitgave af zodra je opslaat. Het bestand zelf blijft in Bestanden staan. Verwijder het daar als je het helemaal kwijt wilt.',
  'help.guide.files-sync.tip.4':
    'Zie je op de kaart een gele melding met ‘Opnieuw verbinden’, dan accepteert de opslag de opgeslagen inloggegevens niet meer. Klik op ‘Opnieuw verbinden’, vul een nieuw app-wachtwoord of token in, en de synchronisatie gaat weer van start.',
  'help.guide.files-sync-settings.result':
    'Vanaf de volgende synchronisatie synchroniseert de reis alleen nog in de richting die je hebt gekozen, en verwijderingen en tegenstrijdige wijzigingen worden afgehandeld volgens jouw regels.',
  'help.guide.manage-notes.result':
    'De notitie is voor alle leden tegelijk verdwenen van de kaart Notities. Een notitie die je alleen hebt vastgezet of gewijzigd, blijft staan en de anderen zien hem zoals jij hem hebt achtergelaten.',
  'help.guide.note-categories.step.4':
    'Met de gekleurde stippen in een rij stel je de kleur van die categorie in: Indigo, Rood, Amber, Smaragd, Blauw of Violet. Hier wordt Accommodatie amber.',
  'help.guide.roadtrip-reorder.step.3':
    'Met het toetsenbord: zet de focus op een stop en druk op Alt met de pijl omhoog of omlaag om hem één plek binnen de dag te verschuiven.',
  'help.guide.roadtrip-overnight.title': 'Onderweg overnachten',
  'help.guide.roadtrip-overnight.tip.1':
    'De overnachting loopt tot de volgende dag. Wil je andere data, pas dan de boeking aan: wijzig de data onder Dagen, samen met de rest van het verblijf.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Alleen stops waar je auto kan tanken of laden krijgen de badge: tankstations bij Benzine, laadpunten bij Elektrisch, en allebei bij Beide.',
  'help.guide.roadtrip-bookings.result':
    'Elke geboekte rit staat op het juiste moment in de autorit, en de route ervoor en erna loopt naar en van de bijbehorende terminals.',
  'help.guide.roadtrip-google-import.step.1':
    'Klik bovenaan Onderweg op de drie puntjes en kies ‘Google Maps-route importeren’.',
  'help.guide.roadtrip-hazards.title': 'Actuele waarschuwingen op de kaart tonen',
  'help.guide.roadtrip-hazards.tip.3':
    'De gegevens worden elke tien minuten vernieuwd en hebben een internetverbinding nodig. Net als de andere rij-instellingen wordt de schakelaar per reis opgeslagen.',
  'help.ctx.trip-tours.bullet.6':
    'Een route wijzigen of een tocht verwijderen doe je op het tabblad Tochten, onder ‘Tochten van deze reis’.',
  'help.guide.tour-show-list.tip.1':
    'Klik op de lijn van een tocht op de kaart, dan markeert de lijst die tocht en scrolt ernaartoe.',
  'help.guide.tour-add-to-day.step.3':
    'Je ziet ‘Toegevoegd aan dag 10’, de rij krijgt een badge Dag en de dag in de linkerkolom toont de tocht met tijd, afstand en hoogtemeters.',
  'help.guide.tour-day-times.title': 'Een begintijd voor een tocht op zijn dag instellen',
  'help.guide.tour-day-times.tip.3':
    'Met ‘Uit de route halen’ in hetzelfde menu blijft de tocht op de dag staan, maar telt hij niet mee in de dagroute op de kaart. Met ‘Weer aan de route toevoegen’ draai je dat terug.',
  'help.guide.tour-remove-from-day.tip.1':
    'Een meerdaagse tocht haal je per dag weg, want elke dag heeft zijn eigen etappe.',
  'help.guide.tour-filter-list.step.4':
    'Sluit het menu. Op de knop zie je nu de status, het aantal overgebleven tochten en +1 voor elk extra filter dat je hebt ingesteld.',
  'help.guide.tour-hide-on-map.step.2':
    'De lijn van de tocht is verborgen op de kaart. De rij blijft gedimd in de lijst staan, met een doorgestreept oog (Tonen op de kaart). Klik erop om de lijn weer te tonen.',
  'help.guide.tour-import-plan-tab.step.2':
    'Klik bovenaan de lijst op ‘GPX of KML importeren’ en kies je bestanden (GPX, KML of KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'Bovenaan staan de ronde tegel van de tocht, de naam met een potlood om hem te hernoemen, een gekleurde stip voor de kleur van de lijn, en labels voor de soort, de herkomst, de geplande tijd, de afstand, de stijging en de daling. Met de X rechts of met Escape sluit je de kaart.',
  'help.guide.tour-detail-read.step.3':
    'Wijs de tijd aan om te zien waaruit die bestaat: de tijd in beweging, de pauzes en het geplande totaal.',
  'help.guide.tour-detail-read.tip.4':
    'Via deze kaart verander je de route niet. Wil je een punt verplaatsen of een stuk opnieuw tekenen, open dan het tabblad Tochten en klik op de tocht onder ‘Tochten van deze reis’.',
  'help.guide.tour-rename-colour.step.4':
    'Kies een kleur. Met ‘Automatische kleur’, het eerste vakje, krijgt de lijn weer zijn standaardkleur. Met ‘Kies een aangepaste kleur’, het laatste vakje, kies je elke kleur die je wilt. De lijn op de kaart en het streepje in de lijst Tochten veranderen meteen mee.',
  'help.guide.tour-take-along.step.3':
    'Klik op ‘GPX’ om de opgeslagen tocht als GPX-bestand te downloaden: de hele route met de hoogtegegevens die erbij horen, klaar voor een navigatie-app of gps-apparaat.',
  'help.guide.tour-copy-keep.step.1':
    'Open de kaart van de tocht en klik onderaan op ‘Kopiëren’. TREK maakt een nieuwe, losstaande tocht zonder dagen, en het origineel blijft ongewijzigd.',
  'help.guide.tour-copy-keep.result':
    'De reis heeft nu een tweede tocht die je vrij kunt aanpassen, en de collectie heeft een eigen kopie die je aan een andere reis kunt toevoegen.',
  'help.guide.tour-packing-link.tip.1':
    'Het is alleen een koppeling. Er wordt niets gekopieerd of verplaatst en de items blijven in Lijsten staan. Vink je er daar een af, dan zie je dat meteen bij de tocht.',
  'help.guide.tour-files.step.3': 'Klik op een bestand om het te openen.',
  'help.guide.tour-activity-link.step.3':
    'Kies de opname onder ‘Track’ of klik op ‘GPX importeren’ om een nieuw bestand toe te voegen.',
  'help.guide.tour-activity-compare.goal':
    'Bekijk waar de werkelijk afgelegde route afwijkt van het plan, en wijzig of ontkoppel de opname.',
  'help.guide.tour-origin-check.title': 'Zien waar een tocht vandaan komt',
  'help.guide.tour-origin-check.result':
    'Je weet waar de tocht vandaan komt, wanneer hij is toegevoegd en of hij sindsdien is gewijzigd.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Een niet-opgeslagen concept gaat niet verloren: open het tabblad Tochten opnieuw en het concept is terug, met de melding ‘Niet-opgeslagen concept hersteld’. ‘Terug naar tochten’ en ‘Verwerpen’ vragen eerst om bevestiging voordat ze wijzigingen weggooien.',
  'help.guide.tour-open-workspace.step.6':
    'Met het label linksonder wissel je van kaart, eerst tussen Kaart en Satelliet. Heb je een tocht open, dan krijg je de kaarten voor die soort tocht, zoals Topo of Wandelen, en schakelaars zoals ‘Punten plaatsen’ en 3D.',
  'help.guide.tour-draw-route.step.1':
    'Klik bovenaan de linkerbalk op ‘Nieuwe tocht plannen’. De balk toont nu ‘Nieuwe tocht’, standaard een wandeling, tenzij je een andere soort kiest.',
  'help.guide.tour-draw-route.tip.3':
    'Heeft een concept niet-opgeslagen wijzigingen, dan vraagt ‘Nieuwe tocht plannen’ in het menu ‘Tocht toevoegen’ eerst ‘Een nieuwe tocht starten?’, met de keuze ‘Weggooien en beginnen’.',
  'help.guide.tour-type-profile.step.4':
    'De route wordt opnieuw gepland voor het profiel, en het Tochtoverzicht rechts toont de afstand en de tijd.',
  'help.guide.tour-edit-points.step.3':
    'Wil je de volgorde wijzigen, wijs dan een rij aan en sleep hem aan de greep die links verschijnt.',
  'help.guide.tour-shaping-points.goal': 'Leg de route over een ander pad zonder een stop toe te voegen.',
  'help.guide.tour-shaping-points.result':
    'De route loopt waar je hem naartoe hebt gesleept, en de stops houden hun nummers.',
  'help.guide.tour-loop-reverse.tip.3':
    'Bij een wandeling zoekt ‘Rondwandeling vanaf de start’ ernaast naar rondwandelingen met een lengte die je zelf kiest.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Een stuk dat je met de hand tekent, is door geen enkele routeplanner gecontroleerd: het kan door water, over privéterrein of langs een klif lopen.',
  'help.guide.tour-trip-places.step.4':
    'Onder de naam in de rij staat ‘Plek van de reis’. Met ‘Loskoppelen van de plek’ onder Meer acties blijft het punt staan, maar verdwijnt de koppeling.',
  'help.guide.tour-details-times.step.2':
    'Schrijf onder Details een Beschrijving en voeg een website toe als die er is.',
  'help.guide.tour-save.goal': 'Bewaar de getekende tocht in de reis.',
  'help.guide.tour-save.result': 'De tocht is opgeslagen in de reis en kan op een dag worden gezet.',
  'help.guide.tour-edit-saved.tip.2':
    'Een geïmporteerde GPX- of KML-route opent als GPX-tocht, om te bekijken. Met ‘Een bewerkbare versie plannen’ maak je daar een tocht die je kunt wijzigen.',
  'help.guide.tour-summary-profile.step.4':
    'Met ‘Hoogteprofiel inklappen’, het pijltje naast de titel, verberg je het profiel. Klik er nog een keer op om het weer te tonen.',
  'help.guide.tour-list-manage.step.2':
    'Wijs een tocht aan en klik op het ronde plusje in de rij, ‘Toevoegen aan dag’, om de dagen van de reis te openen.',
  'help.guide.tour-delete.title': 'Een tocht verwijderen',
  'help.guide.tour-saved-elsewhere.title': 'Als de tocht ergens anders is opgeslagen',
  'help.guide.tour-saved-elsewhere.result':
    'Er gaan geen wijzigingen verloren, tenzij iemand er bewust voor kiest ze weg te gooien.',
  'help.guide.tour-import-gpx.title': 'Een GPX-, KML- of KMZ-bestand als tocht importeren',
  'help.guide.tour-import-gpx.tip.2':
    'Elke track of route in een bestand wordt een aparte tocht. Tracks worden nooit samengevoegd.',
  'help.guide.tour-view-import.step.2':
    'De linkerkolom toont hem als GPX-tocht: het Tochtoverzicht met afstand, hoogtes en opgenomen tijd, met het hoogteprofiel eronder. Op de kaart zie je de lijn.',
  'help.guide.tour-plan-from-import.step.1':
    'Open de geïmporteerde tocht op het tabblad Tochten. Klik links in de kaart ‘Bewerkbare versie’ op ‘Een bewerkbare versie plannen’.',
  'help.guide.tour-plan-from-import.result':
    'De tocht heeft nu punten die je kunt verslepen, en bij Herkomst staat ‘Opnieuw gepland, opgenomen spoor bewaard’.',
  'help.guide.tour-restore-recorded.result': 'De tocht is weer een GPX-tocht en toont de lijn zoals die is opgenomen.',
  'help.guide.tour-take-over.step.6': 'Klik op ‘Overnemen’.',
  'help.guide.tour-import-wanderer.step.2':
    'Typ iets in ‘Wandelroutes zoeken’. Met ‘In dit kaartgebied zoeken’ zie je alleen de routes in het zichtbare deel van de kaart.',
  'help.ctx.trip-tour-map.title': 'Tochtkaart',
  'help.guide.tour-map-layers.goal':
    "Plan op de kaart die het best bij je tocht past: hoogtelijnen voor de klimmen, gemarkeerde wandel- of fietsroutes, of luchtfoto's.",
  'help.guide.tour-along-search.title': 'Plaatsen langs een tocht vinden',
  'help.guide.tour-along-search.tip.1':
    'Wijzig je de route, de soorten of de afstand, dan wordt ‘Opnieuw zoeken’ gemarkeerd, met de melding dat de lijst bij de vorige route hoort. Klik erop om de lijst bij te werken.',
  'help.guide.tour-along-add-stop.step.4':
    'De route wordt opnieuw gepland via de plaats, en ‘Langs de tocht’ laat zien hoeveel afstand en tijd erbij is gekomen. Met ‘Ongedaan maken’ in dezelfde regel haal je de stop weer weg.',
  'help.guide.tour-3d-terrain.step.2':
    'De route is ingekleurd naar steilheid. Klik in de rij onderaan op ‘Helling’ om hem in plaats daarvan in de kleur van de tocht te tonen, en klik nog een keer om de steilheid weer te zien.',
  'help.guide.tour-3d-flyover.title': 'Over een tocht vliegen',
  'help.guide.tour-3d-flyover.tip.2':
    'De vlucht begint pas als het landschap langs de hele route is geladen, zodat hij niet halverwege stilvalt om kaartgegevens te laden. Wijs de ring aan om te zien hoeveel er al is geladen.',
  'help.guide.tour-map-overlays.result':
    'De pistes of zeemarkeringen staan over de kaart heen, en de legenda legt ze uit.',
  'help.ctx.trip-tour-stages.bullet.3':
    'Het Tochtoverzicht toont onder Etappes elke etappe, van de stop waar die begint tot de stop waar die eindigt. Klik je op een etappe, dan wordt de laatste stop ervan geselecteerd en de plek in het hoogteprofiel gemarkeerd.',
  'help.guide.tour-multi-day.step.4':
    'De punten zijn nu verdeeld over Etappe 1 en Etappe 2, elk met afstand en tijd. Bij de stop waar een etappe eindigt, staat een maantje.',
  'help.guide.tour-stages-on-days.title': 'Een meerdaagse tocht over de dagen van de reis verdelen',
  'help.guide.tour-stages-on-days.tip.1':
    'Eindigt de reis vóór de laatste etappe, dan geeft de optie aan welke etappe nog als laatste past. De etappes daarna krijgen geen dag.',
  'help.ctx.trip-tour-hike.bullet.2':
    'Onder Waypoints staan de stops op volgorde. ‘Punt toevoegen’ staat meteen aan, dus met een klik op de kaart zet je het volgende punt. Met ‘Reisplekken’ ernaast maak je van een hut of hotel uit de reis een stop.',
  'help.guide.tour-hike-plan.step.2':
    'Open ‘Soort tocht’ en kies ‘Wandeling’: te voet, binnen een moeilijkheidsgraad die je zelf instelt.',
  'help.guide.tour-hike-plan.tip.3':
    'Met Routekeuze onder de moeilijkheidsgraad geef je je voorkeuren voor de route op: ‘Steile hellingen vermijden’, ‘Trappen vermijden’ en ‘Veerponten vermijden’. Is er geen andere weg, dan loopt de route er toch langs.',
  'help.guide.tour-hike-trail-details.step.5':
    'Klik op ‘Ondergrond’ om dezelfde route te bekijken op basis van waar je over loopt, van asfalt tot onverhard en rots.',
  'help.guide.tour-hike-round.step.2':
    'De kaart Rondwandeling opent boven de kaart. Controleer het startpunt onder ‘Van’ en typ de gewenste Afstand. Het label ernaast toont welke lengtes een rondwandeling kan hebben.',
  'help.guide.tour-hike-compare-ways.title': 'Andere routes voor één deel van een wandeling vergelijken',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Kent de routeplanner geen andere weg, dan meldt de kaart dat. Kan de routeplanner de gekozen weg niet volgen, dan blijft het deel zoals het was en laat de kaart je dat weten.',
  'help.guide.tour-ferrata-add.step.5':
    'Het Tochtoverzicht rechts toont de badge Klettersteig met de moeilijkheidsgraad, en bovenaan de editor staat de waarschuwing ‘De route loopt over een via ferrata’.',
  'help.guide.tour-run-plan.step.1': 'Klik op ‘Nieuwe tocht plannen’, open ‘Soort tocht’ en kies ‘Hardlooptocht’.',
  'help.guide.tour-run-plan.tip.3': 'Gebruik je mijlen voor afstanden, dan is het tempo ook per mijl.',
  'help.guide.tour-run-ways.tip.1': 'Niets hiervan verandert de route of de tijd van je hardlooptocht.',
  'help.ctx.trip-tour-walk.bullet.5':
    'Met ‘Tocht toevoegen’ in ‘Tochten van deze reis’ importeer je een wandelroute die vanuit Google Maps is gedeeld. Open je op het tabblad Planning een wandeling vanuit zijn dag, dan kun je de stops voor die dag afvinken.',
  'help.guide.tour-walk-plan.step.6':
    'Het Tochtoverzicht rechts toont ‘Geschatte tijd’, Verblijven en Gepland, de twee bij elkaar opgeteld. Klik onderaan de linkerkolom op ‘Opslaan’ om de wandeling te bewaren.',
  'help.guide.tour-walk-sights.step.2':
    'Het thema vult ‘Waarnaar zoeken’. Open het om soorten aan of uit te vinken, en kies onder ‘Binnen deze afstand van de route’ hoe ver je wilt zoeken.',
  'help.guide.tour-walk-day-times.title': 'Aankomsttijden en openingstijden voor de dag bekijken',
  'help.guide.tour-walk-day-times.tip.3':
    'De openingstijden komen uit OpenStreetMap of van de plek in de reis waar een stop bij hoort, en het label ernaast geeft aan welke van de twee. Controleer ze voordat je gaat.',
  'help.guide.tour-walk-google-import.step.4':
    'Klik op ‘Laden als wandeling’. TREK plant zelf de looproute tussen de stops. Klik op ‘Opslaan’ om de wandeling te bewaren.',
  'help.guide.tour-walk-check-off.step.2':
    'Scrol naar ‘Haltes van de wandeling’. Bij elke stop zie je hoelang je er blijft en, als de wandeling een begintijd heeft, wanneer je er aankomt.',
  'help.ctx.trip-tour-bike.summary':
    'Een fietstocht die in de editor op het tabblad Tochten is geopend: het profiel waarvoor de route is gepland, de rijtijd, waarover de route loopt en, bij een mountainbiketocht, de moeilijkheidsgraad van de paden.',
  'help.guide.tour-bike-profile.step.2': 'Open het veld ‘Soort tocht’ en kies ‘Fietstocht’.',
  'help.guide.tour-bike-profile.tip.3':
    'Komt er geen fietsroute in de buurt van een punt, dan staat in de balk ‘Geen weg voor fietsen bereikt punt N’. Verplaats het punt, of open Meer acties bij het punt ervoor en kies ‘Volgende stuk met de hand tekenen’.',
  'help.guide.tour-bike-surfaces.step.4':
    'Klik onder ‘Soort weg’ op een rij zoals ‘Land- of bosweg’ of ‘Weg met verkeer’ om te zien waar de route daarover loopt.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Open de fietstocht in de editor en controleer of Profiel op MTB staat. Alleen bij dat profiel worden de moeilijkheidsgraden van paden uitgelezen.',
  'help.ctx.trip-tour-ski.title': 'Ski- en wintertochten',
  'help.guide.tour-ski-plan.goal':
    'Plan een dag op de piste, een langlaufronde, een skitocht of een sneeuwschoenwandeling langs de pistes, liften en paden op de kaart.',
  'help.guide.tour-ski-plan.tip.2':
    'Het infopuntje naast Discipline legt uit wat TREK met skitochten doet. Niets daar of elders hier zegt iets over sneeuw, lawines of de vraag of pistes, liften en paden open zijn.',
  'help.guide.tour-ski-options.step.3':
    'Kies onder Voorkeur ‘Snelste’, ‘Meeste skiën’ of ‘Makkelijkst’. Kies onder Tempo ‘Rustig’, ‘Normaal’ of ‘Sportief’: dat bepaalt hoeveel tijd de routeplanner voor elke afdaling rekent.',
  'help.guide.tour-ski-fix-leg.goal': 'Laat een rood stuk met één klik plannen, of teken het als rechte lijn.',
  'help.guide.tour-ski-fix-leg.result':
    'Er is geen rood stuk meer: elk stuk volgt de pistes of loopt in een rechte lijn tussen de punten.',
  'help.guide.tour-ski-summary.tip.3':
    'Een opgeslagen tocht opent zoals hij is opgeslagen. Verplaats een punt of wijzig een optie om hem opnieuw te plannen met de actuele pistegegevens.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Blijft de schakelaar grijs met de tekst ‘Zoom in om de pistes te zien’, zoom dan in op het skigebied.',
  'help.guide.tour-ski-import.step.3':
    'Kies de Discipline en bij Langlaufen ook de Techniek. Zolang je dat niet hebt gedaan, staat in het venster ‘Kies een discipline om de track als ski te importeren’.',
  'help.ctx.trip-tour-paddle.title': 'Peddeltochten',
  'help.guide.tour-paddle-setup.title': 'Een peddeltocht plannen',
  'help.guide.tour-paddle-setup.step.7':
    'Controleer of ‘Punt toevoegen’ aan staat en klik dan op de kaart: eerst op je instappunt, dan op eventuele punten onderweg en tot slot op je uitstappunt.',
  'help.guide.tour-paddle-water-route.step.1':
    'Bij een stuk dat met de hand is getekend, staat onder het punt ‘Met de hand getekend, niet gerouteerd’, met de lengte erbij. TREK laat de lijn zoals je hem hebt getekend.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Zolang een stuk niet is gepland, kun je niet opslaan. Plan het eerst over het water of teken het met de hand.',
  'help.guide.tour-paddle-portage.step.5':
    'Vul onder ‘Uit en in’ in hoeveel minuten je nodig hebt om uit te stappen, uit te laden en weer te water te gaan. Laat je het leeg, dan rekent TREK met 10 minuten.',
  'help.guide.tour-paddle-lock.step.2':
    'Kies ‘Sluis op dit punt’. Onder het punt verschijnt een kaart Sluis met de melding ‘Tijd ontbreekt’.',
  'help.guide.tour-paddle-time.goal':
    'Bekijk hoe het water, het overdragen, de sluizen en de pauzes samen de tijd bepalen, en stel je eigen waarden in.',
  'help.guide.tour-paddle-time.tip.3':
    'Pauzes en je eigen geplande totaal stel je in onder Details. Heb je een gepland totaal ingevuld, dan toont de kaart ‘Je geplande totale duur’ naast de schatting.',
  'help.guide.tour-paddle-wind.tip.1':
    'Er is alleen een voorspelling voor de komende 16 dagen. Bij een dag die verder weg ligt, zie je vanaf welke datum de voorspelling beschikbaar is. Bij een dag in het verleden zie je dat die dag al voorbij is.',
  'help.guide.tour-paddle-checklist.step.2':
    'De regel eronder laat zien hoe actueel de gegevens zijn: ‘OSM-gegevens van’ voor OpenStreetMap, ‘Opgehaald’ voor het moment waarop TREK ze ophaalde, en ‘Hindernisgegevens’ als die niet de hele route dekken.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Een checklist is geen goedkeuring op het gebied van veiligheid of wetgeving. Jouw beslissing heft geen verbod of privéterrein op dat in OpenStreetMap staat.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Klik op ‘Overdragen’ en klik dan op de lijn waar je uitstapte en waar je weer te water ging.',
  'help.ctx.trip-tour-horse.summary':
    'Voor een rit te paard wordt nooit automatisch een route gepland. De rit bestaat uit delen van de bewegwijzerde ruiterroutes uit OpenStreetMap, verbonden met stukken die je zelf tekent, of blijft precies zoals je hem hebt opgenomen.',
  'help.guide.tour-horse-plan.step.1':
    'Breng op de kaart het gebied in beeld waar je wilt rijden en klik dan bovenaan de linkerkolom op ‘Nieuwe tocht plannen’.',
  'help.guide.tour-horse-plan.tip.1':
    'Een ruiterroute betekent niet dat je er ook mag rijden. ‘Toegang te paard’ laat alleen zien wat er in OpenStreetMap is vastgelegd. Volg ter plaatse altijd de borden.',
  'help.guide.tour-horse-gap.step.2':
    'Zet ‘Verbinden met een handmatig traject’ aan. Het gat wordt met een rechte lijn overbrugd, zonder controle.',
  'help.guide.tour-horse-recorded.goal':
    'Importeer een rit die je met een gps-apparaat of app hebt opgenomen, en bewaar hem precies zoals je hem hebt gereden.',
  'help.guide.tour-horse-recorded.tip.3':
    'Je kunt het bestand ook ergens op het tabblad Tochten neerzetten om hetzelfde voorbeeld te openen.',
  'help.guide.create-trip.tip.3':
    'Onder Reisgenoten kun je mensen toevoegen die hier al een account hebben. Zodra de reis is aangemaakt, zijn ze lid van de reis.',
  'help.guide.trip-reminder.step.1':
    'Klik op het potlood op de kaart van de reis. Bij een nieuwe reis vind je hetzelfde onderdeel in het formulier ‘Nieuwe reis’.',
  'help.guide.company-holidays.tip.2':
    'Een hele bedrijfsvakantiedag haalt alle vakantie weg die al op die dag stond, zodat niemand er verlofdagen voor gebruikt.',
  'help.guide.half-company-holiday.tip.2':
    'Klik met dezelfde instellingen nog een keer op de dag om hem te wissen, of met ‘Halve dag’ uit om er een hele bedrijfsvakantiedag van te maken.',
  'help.guide.edit-holiday-calendar.step.1':
    'Open Instellingen en zoek de kalender onder Feestdagen of Schoolvakanties.',
  'help.guide.person-color.goal': 'Geef jezelf of iemand met wie je plant een kleur die beter te onderscheiden is.',
  'help.guide.answer-fusion-request.tip.2':
    'Jullie kunnen de fusie allebei later weer opheffen. Je dagen blijven dan bewaard.',
  'help.guide.log-for-partner.tip.2': 'De ander ziet de wijziging meteen, en de rij Recht wordt direct bijgewerkt.',
  'help.guide.country-places.title': 'Alle plaatsen in een land bekijken',
  'help.guide.tour-activity-stats.step.1':
    'Open in het paneel onderaan de kaart het tabblad Tochten, naast Statistieken en Bucketlist.',
  'help.guide.tour-activity-stats.tip.2':
    'Koppel de route die je echt hebt afgelegd via ‘Werkelijke track toevoegen’ in de details van de tocht. De opgenomen waarden vervangen hier dan de geplande. Een tocht die over meerdere dagen is gepland, telt één keer mee.',
  'help.ctx.collections.bullet.7':
    'Bewaarde tochten: tochten die je uit een reis hebt bewaard, staan bovenaan een lijst, met moeilijkheidsgraad, soort, de reis waar ze vandaan komen en hun gegevens. Met ‘Aan een reis toevoegen’ maak je er een nieuwe tocht van, met de prullenbak haal je hem van de lijst.',
  'help.guide.move-to-list.title': 'Plaatsen naar een andere lijst verplaatsen of dupliceren',
  'help.guide.copy-to-trip.tip.2':
    'Plaatsen die al in de reis staan, worden overgeslagen. TREK laat zien hoeveel dat er waren.',
  'help.guide.accept-list-invite.tip.2':
    'Klik bovenaan de lijst op ‘Gedeeld’ om de leden te zien. Daar kun je met ‘Lijst verlaten’ de lijst ook weer verlaten.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Maak van een tocht die in een lijst is bewaard een nieuwe tocht in een van je reizen, met of zonder de routepunten.',
  'help.guide.tour-collection-add-to-trip.result':
    'Het venster bevestigt dat de tocht nu bij die reis hoort. Met ‘Reis openen’ ga je erheen, met ‘Sluiten’ blijf je in Collecties.',
  'help.guide.tour-collection-manage.tip.3':
    'Bewaarde tochten staan alleen in hun eigen lijst, niet in ‘Alle opgeslagen’.',
  'help.guide.search-journey.step.3':
    'Klik op een dag om ernaartoe te scrollen, of op het pijltje om de vermeldingen van die dag te zien en er een te kiezen.',
  'help.guide.journey-map-layers.goal':
    'Zie het verschil tussen de planning en wat er echt is gebeurd, en zet lagen aan of uit.',
  'help.guide.journey-keep-route.goal':
    'Zet de echte route van een dag uit Dawarich op de kaart van je reisverslag en bewaar hem daar.',
  'help.guide.journey-day-stays.goal': 'Maak van de bezoeken die Dawarich heeft vastgelegd een voor een vermeldingen.',
  'help.guide.journey-take-over-day.goal':
    'Maak in één stap van de bezoeken van een dag conceptvermeldingen, of één dagverslag.',
  'help.guide.journey-auto-prepare.title': 'TREK je opgenomen dagen laten voorbereiden',
  'help.guide.photo-location.title': "Vermeldingen plaatsen waar de foto's zijn gemaakt",
  'help.ctx.settings-about.summary':
    'Wat TREK is, welke versie deze server draait en waar je het project vindt: de documentatie, waar je een bug meldt en hoe je het project kunt steunen.',
  'help.guide.startup.tip.2':
    'Hoort een starttabblad bij een add-on die je hebt uitgezet, dan opent in plaats daarvan de planning.',
  'help.guide.web-push-device.title': 'Pushmeldingen op dit apparaat ontvangen',
  'help.guide.connect-airtrail.tip.1': 'De kaart verschijnt alleen als de beheerder de add-on AirTrail heeft aangezet.',
  'help.guide.connect-dawarich.tip.1':
    'TREK doet alleen voorstellen voor vermeldingen, plaatsen en landen. Er wordt niets toegevoegd tot je het bevestigt, en er wordt niets naar Dawarich teruggeschreven.',
  'help.guide.tour-connect-wanderer.tip.1':
    'De kaart verschijnt alleen als de beheerder wanderer onder Tochten toestaat.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Een melding verandert nooit iets aan een tocht. De broncontrole van de tocht laat zien wat er echt is gewijzigd.',
  'help.guide.api-keys.tip.3':
    'Stuur de sleutel als Authorization: Bearer of X-API-Key naar /api/v1. Een account kan maximaal 10 sleutels hebben.',
  'help.guide.plugin-settings.step.2':
    'Plugin-activiteit toont alle acties die een plugin namens jou heeft uitgevoerd, de nieuwste bovenaan. Met ‘Vernieuwen’ laad je de laatste.',
  'help.ctx.admin-github.bullet.3':
    'Over: Ko-fi, Buy Me a Coffee, Discord, ‘Bug melden’, ‘Feature aanvragen’ en de Wiki.',
  'help.guide.default-user-settings.goal':
    'Geef elk account handige eenheden, een kleurmodus en een valuta, zonder dat iemand Instellingen hoeft te openen.',
  'help.guide.default-map.step.3':
    'Elk veld wordt opgeslagen zodra je het verlaat. Met de resetlink naast de naam van een veld zet je de standaardwaarde van TREK terug.',
  'help.guide.own-routing-engine.tip.2':
    'Stel je alleen je eigen routeserver in, dan wordt ook de openbare Valhalla niet gebruikt. Met de resetlink naast een veld maak je het weer leeg.',
  'help.guide.admin-passkeys.step.1':
    'Zet op het tabblad Instellingen onder ‘Inloggen met passkey’ de optie ‘Inloggen met passkey inschakelen’ aan.',
  'help.guide.storage-backends.step.4':
    'Onder Gezondheid bovenaan zie je mislukte schrijfacties naar een spiegeldoel. Staat er ‘Geen replicafouten geregistreerd’, dan werkt alles.',
  'help.guide.channels-instance.tip.3':
    'Web Push werkt alleen via HTTPS. Op iPhone en iPad moeten mensen TREK eerst aan hun beginscherm toevoegen.',
  'help.guide.notification-defaults.step.1':
    'Scrol op het tabblad Meldingen naar Standaarden voor gebruikers onderaan. Elke rij is een gebeurtenis, elke kolom een kanaal.',
  'help.ctx.notifications.bullet.1':
    'De bel rechtsboven geeft aan hoeveel meldingen je nog niet hebt gelezen. Klik erop voor de nieuwste tien, en onderaan op ‘Alle meldingen weergeven’ voor deze pagina.',
  'help.guide.read-notifications.step.2':
    'Het paneel toont je tien nieuwste meldingen. Bij elke melding staat wie wat heeft gedaan en waar. Ongelezen meldingen hebben een gekleurde achtergrond.',
  'help.guide.filter-notifications.step.2': 'Klik onderaan het paneel op ‘Alle meldingen weergeven’.',
  'help.guide.mark-notifications-read.tip.1':
    'Open je een melding via de knop ervan, dan wordt die ook als gelezen gemarkeerd.',
  'help.guide.delete-notifications.tip.2':
    'Een verwijderde melding kun je niet terughalen. Wil je een melding uit beeld hebben maar wel bewaren, markeer hem dan als gelezen en gebruik het filter Ongelezen.',
  'help.guide.notification-settings.tip.2':
    'Er zijn geen instellingen per reis: één schakelaar geldt voor al je reizen.',
  'help.guide.link-journal.title': 'Een reisverslag aan de reis koppelen',
  'help.guide.link-journal.tip.2':
    'Vanaf dat moment zien de mensen aan wie je toegang geeft het reisverslag ook in hun eigen lijst onder Reisverslag.',
  'help.ctx.trip-places.bullet.8':
    'Is Dawarich gekoppeld, dan toont ‘Uit Dawarich’ bovenaan de lijst de bezoeken die Dawarich tijdens de reis heeft vastgelegd. Met ‘Als plaats toevoegen’ maak je van een bezoek een plaats. Met ‘Hier ben ik niet geweest’ haal je het uit de lijst.',
  'help.guide.dawarich-stays.step.4':
    'Was een bezoek geen echt bezoek, klik dan op ‘Hier ben ik niet geweest’, het kruisje ernaast, om het weg te halen. Met ‘Toon … al afgehandeld’ onderaan de lijst zie je de bezoeken die je hebt toegevoegd of weggehaald. Met ‘Terugzetten’ komt een weggehaald bezoek weer in de lijst.',
  'help.guide.leave-stop-off-route.tip.1':
    'Alleen een stop met coördinaten heeft deze optie, en de instelling geldt alleen voor deze dag: dezelfde plaats op een andere dag blijft in de route.',
  'help.guide.move-booking-day.title': 'Een boeking naar een andere dag verplaatsen',
  'help.guide.place-image-from-file.step.4':
    'De foto is nu de afbeelding van de plaats. Klik op het kleine rode kruisje in de hoek om hem weer te verwijderen.',
  'help.guide.place-own-hours.step.2': 'Vul onder Website ook Telefoon en E-mail in, als je die weet.',
  'help.guide.add-accommodation.tip.4':
    'Sneller: de + in de kop van de dag, met de knopinfo ‘Toevoegen aan dag’, heeft de optie ‘Accommodatie toevoegen’. Die opent de dag met dit formulier al open.',
  'help.guide.confirm-stay-booking.goal':
    'Markeer de hotelboeking van een verblijf als bevestigd, rechtstreeks vanuit de dag.',
  'help.guide.map-whole-trip.tip.4':
    'Of de hele reis wordt getoond, wordt per reis in je account opgeslagen, zodat de reis in een andere browser op dezelfde manier opent.',
  'help.guide.tour-map-lines.step.3':
    'Open in de dagenkolom een dag waarop de tocht staat, en de tocht wordt onderdeel van de dagroute: de route loopt naar het begin van de tocht en gaat verder vanaf het eind ervan.',
  'help.guide.car-stops.goal':
    'Geef een huurauto of je eigen auto een ophaalpunt, een inleverpunt en de plaatsen waar je onderweg stopt.',
  'help.guide.car-stops.tip.1':
    "Er is geen apart type voor huurauto's: een huurauto en je eigen auto vallen allebei onder Auto.",
  'help.guide.transport-details.result':
    'De Planning is geopend op de dag van de rit, met de lijn op de kaart en het routepictogram in de rij ingeschakeld.',
  'help.guide.export-transports-csv.step.2':
    'Klik op het spreadsheetpictogram na Weergaveopties, met de knopinfo ‘Exporteren als spreadsheet (CSV)’.',
  'help.guide.group-sort-bookings.title': 'Boekingen groeperen en sorteren',
  'help.guide.group-sort-bookings.tip.2':
    'In de Tijdlijn vind je onder dezelfde knop ‘Eén baan per type’ en ‘Het andere tabblad tonen’.',
  'help.guide.booking-on-map.result':
    'De details sluiten en het tabblad Planning opent op de dag van de boeking, met de plaats ervan geselecteerd op de kaart.',
  'help.guide.export-bookings-csv.step.1':
    'Wil je maar een deel van het tabblad exporteren, beperk het dan eerst met Zoeken of Filter. Het bestand bevat precies wat het tabblad toont.',
  'help.guide.import-booking-file.tip.4':
    'Voor het inlezen van een bevestiging is een internetverbinding nodig. Ben je offline, dan meldt Importeren dat. Probeer het opnieuw zodra TREK weer online is.',
  'help.guide.arrange-packing-list.step.1':
    'Pak de greep links in de kop van een lijst, vóór de gekleurde stip, en sleep de lijst naar een andere kaart. Een rand in je accentkleur geeft de doelkaart aan, en de lijst neemt voor iedereen in de reis de plek van die kaart in.',
  'help.guide.count-packed-pieces.title': 'Meerdere stuks van één ding inpakken',
  'help.guide.count-packed-pieces.tip.2':
    'Staat Bagagetracking aan, dan telt ‘Ingepakt’ in de kaart Bagage alleen de stuks die al zijn meegeteld.',
  'help.guide.packing-bags.tip.4':
    'Het gewicht van een tas die door meerdere mensen wordt gedragen, wordt onder Per persoon gelijk over hen verdeeld. Dat gewicht is gestippeld onderstreept en toont een uitleg als je het aanwijst.',
  'help.guide.expense-receipts.step.1':
    'Klik op het potlood naast de rij van de uitgave. De editor opent, met onderaan ‘Bonnetjes & facturen’.',
  'help.guide.expense-receipts.tip.3':
    'Voor het toevoegen heb je een internetverbinding en het recht om bestanden te uploaden nodig, omdat een bonnetje bij de bestanden van de reis wordt opgeslagen.',
  'help.guide.files-sync-settings.title': 'De synchronisatierichting voor documenten kiezen',
  'help.guide.files-sync-settings.tip.1':
    'Er blijft altijd één richting aan staan: klik je op de enige richting die nog aan staat, dan gebeurt er niets.',
  'help.guide.manage-notes.title': 'Een notitie lezen, vastzetten en bewerken',
  'help.guide.manage-notes.tip.1':
    '‘Uitvouwen’ staat alleen in het menu als de notitie tekst bevat. Een lid dat Samenwerking niet mag bewerken, ziet alleen ‘Uitvouwen’.',
  'help.guide.note-categories.step.5':
    'Klik op ‘Opslaan’. Alle notities in een hernoemde of anders gekleurde categorie veranderen meteen mee, voor alle leden. Met ‘Annuleren’ gooi je je wijzigingen weg.',
  'help.guide.trip-chat.tip.5':
    'De chat toont eerst de nieuwste berichten. Met ‘Oudere berichten laden’ bovenaan de chat laad je de eerdere berichten.',
  'help.guide.roadtrip-reorder.result':
    'De stops staan in de volgorde die je hebt gekozen, en de afstand, rijtijd en aankomsttijden van elke gewijzigde dag worden opnieuw berekend.',
  'help.guide.roadtrip-overnight.goal':
    'Zoek een slaapplek onderweg en voeg de overnachting als boeking aan de rit toe.',
  'help.guide.roadtrip-overnight.tip.2':
    'Zet je een geboekte overnachting via ‘Bewerken’ op de kaart terug naar Pauze, dan vraagt TREK eerst ‘Overnachting laten vervallen?’. Met ‘Maak er een pauze van’ verwijder je de overnachting, met de boeking en eventueel gekoppelde uitgaven, en blijft de stop in de rit staan.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Kies je de waarde die de stop al heeft, dan gaat de stop terug naar je standaardwaarde.',
  'help.guide.roadtrip-bookings.tip.1':
    'De tijd bij de terminal ligt vóór de tijd in de dienstregeling, zodat je tijd hebt om in te checken: een uur bij een vlucht of cruise, een half uur bij een veerboot, tien minuten bij een trein of bus.',
  'help.guide.roadtrip-google-import.step.2':
    'Plak de link van een route die je vanuit Google Maps hebt gedeeld en klik op ‘Voorbeeld’.',
  'help.guide.roadtrip-hazards.goal': 'Bekijk weerwaarschuwingen en rampmeldingen rond je route op de kaart.',
  'help.ctx.trip-tours.title': 'Tochten in de planning',
  'help.guide.tour-show-list.title': 'De tochten van de reis in de planning tonen',
  'help.guide.tour-show-list.tip.2':
    'Nog geen tochten? Met ‘GPX of KML importeren’ bovenaan de lijst importeer je een bestand, en met ‘Nieuwe tocht plannen’ op het tabblad Tochten maak je een nieuwe tocht.',
  'help.guide.tour-add-to-day.step.4':
    'Of sleep de rij uit de lijst naar een dag in de linkerkolom. Zet je hem tussen twee stops neer, dan komt hij daar te staan.',
  'help.guide.tour-day-times.goal': 'Zie wanneer een tocht eindigt en of hij overlapt met wat er die dag daarna komt.',
  'help.guide.tour-day-times.tip.4':
    'Met ‘In collectie opslaan’ in hetzelfde menu bewaar je de tocht met de route in een collectie, net als met de knop Collectie op de kaart.',
  'help.guide.tour-remove-from-day.tip.2':
    "In deze menu's en op de kaart staat geen Verwijderen. Een tocht verwijder je op het tabblad Tochten, met de prullenbak in de rij onder ‘Tochten van deze reis’.",
  'help.guide.tour-filter-list.tip.1':
    'De routelimiet is de hoogste moeilijkheidsgraad die bij het plannen van de route was toegestaan, niet de gemeten moeilijkheid van het pad.',
  'help.guide.tour-hide-on-map.step.3':
    'Zolang er een tocht verborgen is, staat er boven de lijst ‘Verborgen op de kaart’, met het aantal. Met ‘Alles tonen’ zet je alle tochten in één keer terug.',
  'help.guide.tour-import-plan-tab.step.3':
    'Het Importvoorbeeld toont elke track voordat er iets wordt opgeslagen. Kies onder ‘Importeren als’ de soort (Wandeling, Fietstocht enzovoort) en klik dan op ‘1 tocht importeren’.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Daaronder staan Reisdagen, met een tegel voor elke dag waarop de tocht staat, de gegevens met het hoogteprofiel en dan, voor zover van toepassing: de haltes van een stadswandeling, de controles en de wind bij een peddeltocht, Werkelijke track, Inpaklijst, Beschrijving, Notities, Herkomst en Bestanden.',
  'help.guide.tour-detail-read.step.4':
    'Reisdagen toont een tegel met de datum voor elke dag waarop de tocht staat. Staat er ‘Nog op geen enkele dag van de reis’, dan is de tocht nog niet ingepland.',
  'help.guide.tour-detail-read.tip.5':
    'Op een telefoon schuift de kaart van onderen omhoog, om te lezen en om de tocht mee te nemen.',
  'help.guide.tour-rename-colour.tip.1':
    'Naam en kleur horen bij de reis, dus iedereen in de reis ziet ze. Wil je een tocht alleen op je eigen kaart verbergen zonder hem voor anderen te veranderen, gebruik dan het oog in de lijst Tochten.',
  'help.guide.tour-take-along.tip.1':
    'Op een apparaat dat bestanden kan delen, verschijnt ‘Delen’ naast GPX. Daarmee stuur je hetzelfde bestand direct naar een andere app.',
  'help.guide.tour-copy-keep.step.2':
    'De kopie opent meteen, met de naam van het origineel en (kopie) erachter. Klik op het potlood om de kopie een eigen naam te geven.',
  'help.guide.tour-packing-link.title': 'Een tocht aan de inpaklijst koppelen',
  'help.guide.tour-packing-link.tip.2':
    'Met ‘Wijzigen’ in de kop van het onderdeel koppel je de tocht aan een andere lijst. Met ‘Koppeling verwijderen’ in dat venster haal je de koppeling weg. De lijst blijft ongewijzigd.',
  'help.guide.tour-files.tip.1':
    'Deze bestanden zijn ook bestanden van de reis, dus je ziet ze ook op het tabblad Bestanden.',
  'help.guide.tour-activity-link.step.4': 'Controleer onder Werkelijk wat er is gemeten en klik dan op ‘Koppelen’.',
  'help.guide.tour-activity-compare.step.1':
    'Open de kaart van de tocht. ‘Planning en werkelijk’ zet Afstand, Hoogtemeters omhoog, Hoogtemeters omlaag en ‘Tijd met pauzes’ van de planning naast die van de track, met het Verschil.',
  'help.guide.tour-origin-check.goal':
    'Zoek uit of een tocht in TREK is getekend of geïmporteerd, uit welk bestand, en of hij sindsdien is gewijzigd.',
  'help.ctx.trip-tour-planner.title': 'Tochten',
  'help.guide.tour-open-workspace.title': 'Je weg vinden op het tabblad Tochten',
  'help.guide.tour-open-workspace.step.7':
    'Klik op een tocht in de rechterbalk. Een tocht die in TREK is gepland, opent in de editor. Een geïmporteerde track opent ongewijzigd als GPX-tocht, om te bekijken.',
  'help.guide.tour-draw-route.step.2':
    'Typ in ‘Zoek plaats of adres’ waar de tocht begint en kies het resultaat. De kaart gaat daarheen.',
  'help.guide.tour-draw-route.tip.4':
    'Een niet-opgeslagen concept gaat niet verloren. Open het tabblad Tochten van de reis opnieuw en het concept is terug, met de melding ‘Niet-opgeslagen concept hersteld’.',
  'help.guide.tour-type-profile.tip.1':
    'Een andere soort kiezen telt als één stap in de geschiedenis: met ‘Routepuntbewerking ongedaan maken’ bovenaan de balk krijg je de oude soort en de bijbehorende route terug.',
  'help.guide.tour-edit-points.step.4':
    'Of open Meer acties (de drie puntjes) in de rij en kies ‘Routepunt omhoog verplaatsen’ of ‘Routepunt omlaag verplaatsen’.',
  'help.guide.tour-shaping-points.step.1':
    'Klik op de getekende route op de kaart, op de plek waar hij anders moet lopen. Daar verschijnt een stipje: een vormpunt.',
  'help.guide.tour-loop-reverse.title': 'Een rondje maken of de tocht omdraaien',
  'help.guide.tour-loop-reverse.result':
    'Een rondje dat eindigt waar het begon, of dezelfde tocht in omgekeerde richting.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Bij een punt waar geen pad naartoe loopt, verschijnt een melding met ‘Punt tonen’ en het nummer. Verplaats het punt naar een pad of teken het stuk ernaartoe met de hand.',
  'help.guide.tour-trip-places.tip.1':
    'Een plaats die al in de tocht zit, is gemarkeerd met ‘In de tocht’ en kun je geen tweede keer kiezen.',
  'help.guide.tour-details-times.step.3':
    'Vul Pauzes in, bijvoorbeeld 0:45. Die worden opgeteld bij de geschatte tijd.',
  'help.guide.tour-save.step.1': 'Typ een naam in ‘Naam van de tocht’. Zonder naam blijft ‘Opslaan’ grijs.',
  'help.guide.tour-edit-saved.title': 'Een opgeslagen tocht wijzigen',
  'help.guide.tour-edit-saved.tip.3':
    '‘GPX downloaden’ en ‘In een collectie bewaren’ bovenaan de balk werken pas als de wijzigingen zijn opgeslagen.',
  'help.guide.tour-summary-profile.tip.1': 'Klik op de titel van de kaart om het hele overzicht in te klappen.',
  'help.guide.tour-list-manage.step.3': 'Kies de dag. De tocht wordt aan die dag toegevoegd en de rij toont de dag.',
  'help.guide.tour-delete.goal': 'Verwijder een tocht definitief uit de reis.',
  'help.guide.tour-saved-elsewhere.goal':
    'Bepaal wat er gebeurt als iemand anders de tocht heeft opgeslagen terwijl jij hem aan het wijzigen was.',
  'help.ctx.trip-tour-import.title': 'Tochten importeren',
  'help.guide.tour-import-gpx.goal':
    'Maak van een track van een gps-horloge, een app of Google Earth een tocht in de reis, en controleer hem voordat er iets wordt opgeslagen.',
  'help.guide.tour-import-gpx.tip.3':
    'Een track die al in de reis staat, is grijs met ‘Al in de reis’ en wordt overgeslagen.',
  'help.guide.tour-view-import.step.3': 'Met ‘Terug naar tochten’, het pijltje linksboven, sluit je hem weer.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK haalt controlepunten uit de track en plant er opnieuw een route langs. De kaart toont de import gestippeld en het voorstel doorgetrokken, en de kaart met details vergelijkt de lengtes, het aandeel ‘Binnen 50 m van de track’ en de Grootste afwijking.',
  'help.guide.tour-restore-recorded.title': 'Teruggaan naar de opgenomen track',
  'help.guide.tour-take-over.title': 'Een tocht uit een andere reis overnemen',
  'help.guide.tour-take-over.tip.1':
    'De kopie is een aparte tocht. Hij staat nog op geen enkele dag, en latere wijzigingen aan het origineel hebben geen invloed op de kopie, en andersom ook niet. Bij Herkomst staat de reis waaruit hij is overgenomen.',
  'help.guide.tour-import-wanderer.step.3':
    'Klik op een route. Hij verschijnt op de kaart, en de kolom toont de gegevens uit het GPX-bestand, de beschrijving en of de route in wanderer openbaar of privé is.',
  'help.ctx.trip-tour-map.summary':
    'De kaart in het midden van het tabblad Tochten, voor de tocht die je open hebt: de kaarten die bij de soort tocht passen, de pistes of zeemarkeringen daaroverheen, de plaatsen langs de route, en dezelfde tocht in 3D in het echte landschap.',
  'help.guide.tour-map-layers.step.1':
    'Open het tabblad Tochten en klik rechts op een tocht onder ‘Tochten van deze reis’. De tocht opent in de planner, en het label linksonder op de kaart toont de kaarten die voor deze soort tocht beschikbaar zijn.',
  'help.guide.tour-along-search.goal':
    'Zoek uitzichtpunten, water, hutten of een plek om te eten vlak bij de route van de tocht die je plant.',
  'help.guide.tour-along-search.tip.2':
    "Bij een stadswandeling kiezen vier thema's boven de lijst de juiste soorten voor je.",
  'help.guide.tour-along-add-stop.result':
    'De tocht gaat nu langs de plaats, met de nieuwe afstand en tijd in het Tochtoverzicht. Sla de tocht op om de wijziging te bewaren.',
  'help.guide.tour-3d-terrain.step.3':
    'Klik rechts op het label Hellingsverdeling. Het klapt uit en toont welk deel van de tocht onder de 5 %, 5 tot 10 %, 10 tot 18 %, 18 tot 27 % en 27 % en meer stijgt. Ingeklapt toont het het hoogste punt en het steilste stuk.',
  'help.guide.tour-3d-flyover.goal': 'Bekijk de hele tocht van begin tot eind voordat je hem loopt, fietst of skiet.',
  'help.guide.tour-3d-flyover.tip.3':
    'Is de vlucht gepauzeerd, beweeg dan langs het hoogteprofiel om de stip naar dat punt te verplaatsen. Met ‘Overvlucht afspelen’ ga je vanaf daar verder.',
  'help.guide.tour-map-overlays.tip.1':
    'De pistes zijn kaartgegevens, geen actueel bericht: ze zeggen niets over wat er open of geprepareerd is, over de sneeuw of over lawines. Zoom je verder uit dan het skigebied, dan staat bij de schakelaar ‘Zoom in om de pistes te zien’.',
  'help.ctx.trip-tour-stages.bullet.4':
    'In ‘Tochten van deze reis’ toont een meerdaagse tocht een maantje met het aantal etappes. Die knop, ‘Etappes tonen’, klapt de lijst met etappes uit, met de dag waarop elke etappe staat en de totalen van de Hele tocht.',
  'help.guide.tour-multi-day.step.5':
    'Het Tochtoverzicht toont onder Etappes elke etappe. Klik op een etappe om te zien waar die eindigt: de laatste stop wordt geselecteerd en het hoogteprofiel markeert de plek.',
  'help.guide.tour-stages-on-days.goal': 'Zet elke etappe op een eigen dag, of de hele tocht op één dag.',
  'help.guide.tour-stages-on-days.tip.2':
    '‘Hele tocht op deze dag’ is grijs op een dag waarop de tocht al staat. ‘Etappes vanaf deze dag’ werkt daar wel en vervangt op die dag de hele tocht.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Bovenaan de kaart Waypoints staan de routehulpmiddelen: ‘Richting omkeren’, ‘Terug naar start’ en, bij een wandeling, ‘Rondwandeling vanaf de start’. Onder Meer acties bij een stop vind je ‘Wegen voor het volgende deel vergelijken’.',
  'help.guide.tour-hike-plan.step.3': 'Typ een naam onder ‘Naam van de tocht’.',
  'help.guide.tour-hike-plan.tip.4':
    'De looptijd volgt de rekenregel voor wandelwegwijzers (DIN 33466), zonder pauzes. Voeg pauzes toe onder Pauzes in Details, dan tellen ze mee in het geplande totaal.',
  'help.guide.tour-hike-trail-details.result':
    'Je weet welke delen van de wandeling welke moeilijkheidsgraad hebben, wat de ondergrond is en waar ze op de kaart liggen.',
  'help.guide.tour-hike-round.step.3':
    'Klik op ‘Rondes zoeken’. Ronde A, Ronde B enzovoort verschijnen in de lijst en op de kaart, elk in een eigen kleur.',
  'help.guide.tour-hike-compare-ways.goal':
    'Bekijk welke andere paden een wandeling tussen twee stops kan nemen, en kies er een.',
  'help.guide.tour-hike-compare-ways.tip.3': 'Met ‘Annuleren’ sluit je de kaart zonder de route te wijzigen.',
  'help.guide.tour-ferrata-add.result':
    'De wandeling volgt de via ferrata over de eigen lijn uit OpenStreetMap. Klik op de kaart om vanaf de top verder te gaan. De routeplanner plant alleen de weg naar de via ferrata en de weg erna.',
  'help.guide.tour-run-plan.step.2':
    'Kies een Profiel: Hardlopen voor vooral verharde wegen in de stad, in parken en langs rivieren, of Trailrunning voor bospaden en onverharde paden.',
  'help.guide.tour-run-plan.tip.4': 'Trailrunning gebruikt paden tot en met bergpaden (T2), nooit zwaardere.',
  'help.guide.tour-run-ways.tip.2':
    'Zet het Profiel op Trailrunning als de route meer onverharde paden mag nemen, of op Hardlopen om op vaste grond te blijven.',
  'help.guide.tour-walk-plan.title': 'Een stadswandeling van stop naar stop plannen',
  'help.guide.tour-walk-plan.tip.1':
    'De ring om het nummer van een stop laat zien hoe belangrijk die is: vol bij Niet missen, gestippeld bij Optioneel. Een klein schildje geeft een Beschermde stop aan.',
  'help.guide.tour-walk-sights.step.3':
    'Klik op ‘Zoeken langs de tocht’. Een ster voor een naam geeft een Topper aan, een van de bekendste plekken in de buurt.',
  'help.guide.tour-walk-day-times.goal':
    'Weet wanneer je op de dag van de wandeling bij elke stop aankomt, en welke plaatsen dan gesloten zijn.',
  'help.guide.tour-walk-day-times.tip.4':
    'Twee wandelingen op één dag: klik op het tabblad Planning op het traject ertussen (‘Vervoerswijze wijzigen’) en kies ‘Openbaar vervoer’. De zoekopdracht begint waar en wanneer de eerste wandeling eindigt, en waarschuwt je als een verbinding pas aankomt nadat de volgende wandeling is begonnen.',
  'help.guide.tour-walk-google-import.tip.1':
    'Alleen een route die te voet is gepland, wordt ingelezen. Zet Google Maps op lopen voordat je de route deelt.',
  'help.guide.tour-walk-check-off.step.3':
    'Klik op ‘Markeer als bezocht’ bij een stop die je hebt gezien, of op ‘Overslaan’ bij een stop die je laat schieten.',
  'help.ctx.trip-tour-bike.bullet.1':
    'Profiel onder ‘Soort tocht’ bepaalt voor wat voor soort fietsen de routeplanner plant: Toer, Racefiets, Gravel of MTB. De regel eronder vertelt waar de routeplanner op let. Wijzig je het profiel, dan wordt de hele route opnieuw gepland.',
  'help.guide.tour-bike-profile.step.3':
    'Kies onder Profiel Toer, Racefiets, Gravel of MTB. De regel eronder vertelt waar de routeplanner bij dat profiel op let.',
  'help.guide.tour-bike-profile.tip.4':
    '‘Opslaan’ blijft grijs tot de tocht een naam heeft en de route met de hoogtes is berekend.',
  'help.guide.tour-bike-surfaces.result':
    'De kaart markeert de stukken van de rij die je hebt gekozen, en je weet over welke ondergrond de route loopt. De tocht zelf blijft ongewijzigd.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'Bekijk in de kaart ‘Ondergrond en wegen’ de Trailgraad (mtb:scale): welk deel van de route in welke graad valt, van ‘S0, geen bijzondere moeilijkheden’ tot ‘S4 en hoger, terrein voor experts’.',
  'help.ctx.trip-tour-ski.summary':
    'Een tocht van de soort ‘Ski en winter’ op het tabblad Tochten: een dag op de piste, een langlaufronde, een skitocht, een sneeuwschoen- of winterwandeling. De stukken volgen de pistes, liften en paden uit OpenStreetMap, gepland door de pisteplanner voor jouw discipline en jouw grenzen. Een opgenomen skitrack wordt met zijn discipline geïmporteerd.',
  'help.guide.tour-ski-plan.step.1': 'Klik op het tabblad Tochten bovenaan de linkerbalk op ‘Nieuwe tocht plannen’.',
  'help.guide.tour-ski-plan.tip.3':
    'Wijzig je later de discipline, dan blijven je punten staan en worden de stukken opnieuw gepland met de opties van die discipline.',
  'help.guide.tour-ski-options.step.4':
    'Gebruik de schakelaars: ‘Liften gebruiken’, ‘Freerideroutes toestaan’, ‘Zo nodig met de lift naar beneden’ en ‘Vermoede verbindingen mijden’. Bij Langlaufen komen daar ‘Alleen geprepareerde loipes’ en ‘Alleen verlichte loipes’ bij, bij Toerskiën ‘Langs de pisterand omhoog’.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Bij een stuk dat de routeplanner niet kon plannen, staat onder het punt een rode rij met de reden, bijvoorbeeld ‘Alleen een lift die je hebt uitgesloten verbindt deze punten’, en de piste of lift waar het om gaat.',
  'help.guide.tour-ski-summary.title': 'De pisteroute van een skitocht bekijken',
  'help.guide.tour-ski-summary.tip.4':
    'Onderaan de kaart staan de skigebieden en de datum van de kaartgegevens waarmee de tocht is gepland.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Laden de pistes niet meer, dan toont de schakelaar een waarschuwingsteken. De kaart en je route blijven werken.',
  'help.guide.tour-ski-import.step.4': 'Klik op ‘1 tocht importeren’.',
  'help.ctx.trip-tour-paddle.summary':
    'Een kajak-, kano- of SUP-tocht op een rivier of meer. Bij de tocht staan de boot en het water, de route volgt het water waar TREK daar gegevens over heeft, overdragen en sluizen tellen mee in de tijd, en je ziet de wind op de dag dat je peddelt en wat er bekend is over obstakels onderweg.',
  'help.guide.tour-paddle-setup.goal':
    'Begin een kajak-, kano- of SUP-tocht en geef aan waarmee je peddelt, op wat voor water en hoe snel.',
  'help.guide.tour-paddle-setup.tip.1':
    'Staat Boot op Overig, dan is er geen voorgestelde snelheid. Vul er zelf een in, anders blijft de tijd op het water leeg.',
  'help.guide.tour-paddle-water-route.step.2':
    'Wil je één stuk over het water laten plannen, wijs dan de stop ervoor aan en klik op Meer acties, de drie puntjes.',
  'help.guide.tour-paddle-water-route.result':
    'Elk stuk volgt het water of is bewust met de hand getekend, en bij een stuk dat TREK niet kon plannen, staat waarom.',
  'help.guide.tour-paddle-portage.tip.1':
    'Wil je het stuk toch peddelen, open dan opnieuw Meer acties bij het punt en kies ‘Dit stuk weer peddelen’. Het wordt dan weer een stuk dat met de hand is getekend.',
  'help.guide.tour-paddle-lock.step.3': 'Klik op de kaart Sluis om die te openen.',
  'help.guide.tour-paddle-time.step.1':
    'De Tijdschatting staat in de linkerkolom onder de routepunten. De badge bovenaan is het totaal, inclusief pauzes.',
  'help.guide.tour-paddle-time.result':
    'De schatting rekent met wat je hebt ingevuld en vermeldt wat er nog ontbreekt.',
  'help.guide.tour-paddle-wind.tip.2':
    'Bij een tocht over meerdere dagen staat bovenaan de kaart voor elke dag een knopje Dag. Klik erop om die dag te bekijken.',
  'help.guide.tour-paddle-checklist.step.3':
    'De punten volgen de route: stuwen, sluizen, stroomversnellingen, instappunten en toegangsregels uit OpenStreetMap, plus je eigen overdraagpunten en sluizen, gemarkeerd met Eigen.',
  'help.guide.tour-paddle-checklist.result':
    'Voor elk punt op de route is een beslissing genomen, en je hebt de veiligheidsinformatie gelezen.',
  'help.guide.tour-paddle-track-marks.step.6': 'Klik op ‘Sluis’ en klik dan op de lijn waar de sluis ligt.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Zet in de editor ‘Soort tocht’ op ‘Rit te paard’, dan verschijnt de kaart Ruiterroutes in de linkerkolom. ‘Zoeken in kaartbeeld’ toont de routes in het zichtbare deel van de kaart.',
  'help.guide.tour-horse-plan.step.2':
    'Klik op het veld ‘Soort tocht’ onder ‘Naam van de tocht’ en kies ‘Rit te paard’. De kaart Ruiterroutes verschijnt onder Waypoints.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK berekent geen rijtijd voor een rit te paard. Vul er een in onder Gepland in Details als je een tijd op de dag wilt.',
  'help.guide.tour-horse-gap.step.3':
    'Klik op ‘Traject overnemen’. Zolang de schakelaar niet aan staat, blijft de knop grijs.',
  'help.guide.tour-horse-recorded.step.1':
    'Klik in ‘Tochten van deze reis’ op ‘Tocht toevoegen’ (de +), kies ‘GPX of KML importeren’ en kies het bestand van je rit.',
  'help.guide.dateless-trip.title': 'Een reis zonder data plannen',
  'help.guide.trip-reminder.step.2':
    'Kies onder Herinnering 1, 3 of 9 dagen. Wil je een andere termijn, klik dan op ‘Aangepast’ en typ een aantal dagen tussen 1 en 30.',
  'help.guide.upcoming-reservations.title': 'Naar je volgende boekingen springen',
  'help.guide.half-company-holiday.title': 'Een halve bedrijfsvakantiedag markeren',
  'help.guide.edit-holiday-calendar.step.2':
    'Klik op het gekleurde vierkantje om een nieuwe kleur te kiezen, of typ een nieuw label en druk op Enter.',
  'help.guide.person-color.step.1': 'Klik in de kaart Personen op de gekleurde stip vóór de naam.',
  'help.guide.answer-fusion-request.title': 'Op een fusieverzoek reageren',
  'help.guide.log-for-partner.title': 'Dagen invoeren voor iemand met wie je plant',
  'help.guide.dissolve-fusion.title': 'Stoppen met samen plannen',
  'help.guide.country-places.goal':
    'Bekijk welke plaatsen TREK voor een land meetelt, om na te gaan wat je daar hebt gedaan of om een plaats te vinden die TREK aan het verkeerde land heeft toegewezen.',
  'help.guide.regions.tip.3':
    '‘Aan bucket list toevoegen’ werkt ook voor een regio. De regio krijgt dan dezelfde arcering als een land op je bucketlist.',
  'help.guide.tour-activity-stats.step.2':
    'Kies met de twee labels links een periode en een soort. Bij Periode kies je uit Altijd, Dit jaar, Afgelopen 12 maanden en elk eerder jaar waarin je tochten hebt. Met Type beperk je de cijfers tot één soort tocht, of kies je Alle typen.',
  'help.guide.tour-activity-stats.tip.3':
    'Een dag met deelnemers telt alleen voor die deelnemers. Een dag zonder deelnemers telt voor iedereen in de reis. Het tabblad laadt actuele gegevens en heeft een internetverbinding nodig.',
  'help.guide.move-to-list.goal':
    'Orden je lijsten opnieuw door plaatsen tussen lijsten te verplaatsen of naar een tweede lijst te kopiëren.',
  'help.guide.accept-list-invite.result':
    'De lijst verschijnt onder Gedeeld in de balk en opent met de plaatsen erin. Wijzigingen van de andere leden zie je meteen.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Open de lijst. Bewaarde tochten staan bovenaan, boven de plaatsen. Klik bij de tocht op ‘Aan een reis toevoegen’, of klik op de rij zelf.',
  'help.guide.tour-collection-manage.title': 'Bewaarde tochten vinden en verwijderen',
  'help.guide.tour-collection-manage.result': 'De tocht is uit de lijst verwijderd en een korte melding bevestigt dat.',
  'help.guide.entry-draft.title': 'Een vermelding als concept bewaren',
  'help.guide.journey-map-layers.step.1':
    "Bovenaan de kaart staan in de lagenbalk Planning, Opgenomen, Vermeldingen en Foto's, elk met het aantal erbij. Klik op een laag om die te verbergen of te tonen.",
  'help.guide.journey-keep-route.step.1': 'Klik bovenaan de dag op de Dawarich-knop, ‘Opname overnemen’.',
  'help.guide.journey-day-stays.step.1':
    'Een dag met bezoeken die je nog moet bekijken, eindigt met een rij zoals ‘4 bezoeken uit Dawarich’ en de tijdsspanne. Klik erop om de bezoeken te tonen.',
  'help.guide.journey-take-over-day.step.1':
    'Klik op ‘Dag overnemen’ aan het eind van de rij met bezoeken, of op de lijstknop bovenaan de dag, die laat zien hoeveel bezoeken er nog openstaan.',
  'help.guide.journey-auto-prepare.goal':
    'Laat de bezoeken van elke dag automatisch klaarzetten om te bekijken, zolang een reis loopt.',
  'help.guide.photo-location.goal': 'Zet vermeldingen op de kaart zonder voor elke vermelding een plaats te zoeken.',
  'help.ctx.settings-about.bullet.1': 'Naast de titel staat de versie die deze server draait.',
  'help.guide.readability.tip.3':
    'Leesbaarheid is gemarkeerd als Experimenteel. Ziet er iets niet goed uit, klik dan onderaan het tabblad op ‘Standaardwaarden herstellen’ om de standaardinstellingen terug te zetten.',
  'help.guide.web-push-device.goal': 'Ontvang meldingen van TREK op je telefoon of computer, ook als TREK gesloten is.',
  'help.guide.connect-airtrail.tip.2':
    'De sleutel wordt versleuteld opgeslagen en nooit meer getoond. Staan er puntjes in het veld, dan is er een sleutel opgeslagen.',
  'help.guide.connect-dawarich.tip.2':
    'Onder de knoppen staat op de kaart wanneer TREK voor het laatst heeft gecontroleerd en wat jouw versie van Dawarich niet ondersteunt.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Draait je installatie op een privéadres, dan moet de beheerder mogelijk interne netwerken toestaan.',
  'help.guide.tour-wanderer-watch.tip.2':
    '‘Gepauzeerd tot’ betekent dat wanderer niet reageerde. ‘Token geweigerd’ betekent dat het token een geslaagde verbindingstest nodig heeft, of dat je een nieuw token nodig hebt.',
  'help.guide.plugin-settings.result':
    'De plugin werkt met jouw instellingen, en elke actie die hij voor je uitvoert, staat onder Plugin-activiteit.',
  'help.ctx.admin-defaults.bullet.3':
    'Met de resetlink naast een veld dat je hebt ingesteld, zet je de standaardwaarde van TREK terug. De eigen instelling van een gebruiker gaat hier altijd boven.',
  'help.ctx.admin-settings.bullet.5': 'Gevarenzone: met ‘JWT-geheim roteren’ log je alle gebruikers uit, jezelf ook.',
  'help.guide.default-user-settings.step.1':
    'Kies onder Standaard gebruikersinstellingen de Kleurmodus (Licht, Donker of Automatisch), Temperatuureenheid, Afstandseenheid, Tijdnotatie, ‘Week begint op’, de Weergavevaluta en of ‘Boekingscodes vervagen’ aan of uit staat. Elke keuze wordt meteen opgeslagen.',
  'help.guide.admin-passkeys.step.2':
    'Vul de ‘Relying Party ID (domein)’ in, bijvoorbeeld trek.example.org, en de ‘Toegestane origins’ waarop je TREK bereikbaar is, en klik op ‘Opslaan’. Laat beide leeg om APP_URL te gebruiken.',
  'help.guide.rotate-jwt-secret.title': 'Iedereen tegelijk uitloggen',
  'help.guide.notification-defaults.step.2':
    'Klik op een cel om naar de volgende stand te gaan: Aan, Uit, Geblokkeerd. De knopinfo noemt de volgende stand, en elke klik wordt meteen opgeslagen.',
  'help.ctx.notifications.bullet.2':
    'Met Alle en Ongelezen bovenaan wissel je tussen alle meldingen en alleen de meldingen die je nog niet hebt gelezen. Terwijl je scrolt, laadt de lijst er meer.',
  'help.guide.read-notifications.step.3':
    'Klik op de knop onder een melding, bijvoorbeeld ‘Vacay bekijken’, om te openen waar de melding over gaat. De melding wordt dan ook als gelezen gemarkeerd.',
  'help.guide.filter-notifications.step.3':
    'Klik op ‘Ongelezen’ om alleen de meldingen te zien die je nog niet hebt gelezen. Met ‘Alle’ zie je ze weer allemaal.',
  'help.guide.mark-notifications-read.tip.2':
    'Markeren als gelezen verandert alleen de achtergrondkleur en het aantal. De melding blijft in de lijst staan tot je hem verwijdert.',
  'help.guide.delete-notifications.result': 'De melding is verdwenen uit de lijst en bij de bel.',
  'help.guide.notification-settings.result':
    'Instellingen staat open op Meldingen, met een schakelaar per gebeurtenis en kanaal.',
  'help.guide.link-journal.goal':
    'Toon een van je reisverslagen uit Reisverslag in de reis, voor de mensen die je kiest.',
  'help.guide.link-journal.tip.3':
    'Later vind je bij Reisverslag in de Reisinstellingen ‘Toegang bewerken’, ‘Ander dagboek’ en ‘Ontkoppelen’. Ontkoppelen verwijdert het tabblad. Mensen die je in het reisverslag zelf hebt toegevoegd, houden hun toegang.',
  'help.guide.dawarich-stays.result':
    'Het bezoek is nu een plaats van de reis, op de dag die je hebt gekozen of onder Ongepland, en het paneel markeert het als afgehandeld.',
  'help.ctx.trip-days.bullet.7': 'Tijdens de reis opent de planning op de dag van vandaag en scrolt ernaartoe.',
  'help.guide.leave-stop-off-route.tip.2':
    'Met ‘Verwijderen van dag’ haal je de stop van de dag af. Met ‘Uit de route halen’ blijft hij in de planning staan.',
  'help.guide.move-booking-day.goal':
    'Verplaats vervoer of een boeking rechtstreeks vanuit de planning naar een andere dag, zonder het formulier te openen.',
  'help.guide.place-image-from-file.result':
    'De foto is nu de afbeelding van de plaats: op de kaart met details, in de plaatsenkolom, in de dag en op de kaart.',
  'help.guide.place-own-hours.step.3':
    'Openingstijden daaronder toont de week, met een rij per dag. Heeft TREK openingstijden voor de plaats gevonden, dan zijn die al ingevuld. Zo niet, klik dan eerst op ‘Openingstijden toevoegen’. Vul per dag in wanneer de plaats opent en sluit, en klik op ‘Gesloten’ bij een dag waarop hij dicht is.',
  'help.guide.add-accommodation.tip.5':
    'GPX-tracks en plaatsen van tochten worden nooit als verblijf aangeboden, alleen gewone plaatsen van de reis.',
  'help.guide.confirm-stay-booking.step.1':
    'Open de dag waarop je incheckt. Op de kaart van het verblijf zie je onder Reservering de hotelboeking voor die nacht, met ‘In behandeling’ of ‘Bevestigd’. Klik op dat vakje.',
  'help.guide.tour-map-lines.step.4':
    'Wil je een tocht van de kaart halen, zet de rechterkolom dan op Tochten, wijs de tocht aan en klik op het oog, ‘Verbergen op de kaart’. De lijn en de markering verdwijnen van de kaart. De rij blijft gedimd in de lijst staan, met een doorgestreept oog, ‘Tonen op de kaart’, om de tocht weer te tonen.',
  'help.guide.car-stops.step.1':
    'Klik bovenaan de dag waarop je de auto ophaalt op de +, met de knopinfo ‘Toevoegen aan dag’, en kies ‘Vervoer toevoegen’.',
  'help.guide.car-stops.tip.2': '‘Omhoog’ en ‘Omlaag’ verschijnen pas als de rit twee of meer tussenstops heeft.',
  'help.guide.transport-details.title': 'Vervoer openen en de details gebruiken',
  'help.guide.transport-details.tip.1':
    'Klik je nog een keer op ‘Op kaart’ bij een rit waarvan de lijn al wordt getoond, dan verdwijnt de lijn weer.',
  'help.guide.export-transports-csv.result':
    'Je browser slaat een bestand op met de naam van de reis, bijvoorbeeld autumn-in-japan-transports.csv, met een rij per rit: Type, Titel, Status, Start, Einde, Van, Naar, Locatie, Bevestiging en Notities.',
  'help.guide.group-sort-bookings.goal':
    'Orden de kaarten of de lijst op status, dag of soort, in de volgorde die jij wilt.',
  'help.guide.booking-on-map.tip.1':
    '‘Op kaart’ zie je alleen bij een boeking met een plaats. Kies een plaats onder ‘Plaats / Activiteit’ in het formulier, dan verschijnt de knop.',
  'help.guide.export-bookings-csv.step.2':
    'Open Weergaveopties, het schuifregelaarpictogram naast de weergavepictogrammen, en kies een volgorde onder ‘Sorteren op’. De rijen volgen die volgorde, met een rij per boeking en zonder onderverdeling.',
  'help.guide.edit-booking.tip.4':
    'Heb je iets gewijzigd en klik je buiten het formulier of druk je op Escape, dan vraagt TREK ‘Wijzigingen weggooien?’. Met ‘Verder bewerken’ ga je terug naar het formulier.',
  'help.guide.arrange-packing-list.step.2':
    'Binnen een lijst sleep je een item met de greep links in de rij omhoog of omlaag. Een lijn in je accentkleur aan de linkerkant van een rij laat zien waar het item terechtkomt.',
  'help.guide.count-packed-pieces.goal': 'Geef een item een aantal en markeer de stuks een voor een als ingepakt.',
  'help.guide.count-packed-pieces.tip.3': 'Bij een aantal van één is er geen teller, alleen het vinkvakje.',
  'help.guide.expense-receipts.step.2':
    'Klik op ‘Bijvoegen’ naast ‘Bonnetjes & facturen’ en kies de foto of PDF. Je kunt er ook meerdere tegelijk kiezen. Elk bestand verschijnt onder de kop, met een prullenbak om het weer weg te halen.',
  'help.guide.files-sync-settings.goal':
    'Bepaal of documenten alleen uit je opslag worden geïmporteerd, alleen ernaartoe worden geëxporteerd of allebei, en wat er gebeurt als een document wordt verwijderd of op beide plekken wordt gewijzigd.',
  'help.guide.files-sync-settings.tip.2':
    'Bij ‘Vraag het mij’ komt een document dat op beide plekken is gewijzigd onder ‘Vraagt om aandacht’ te staan, onder de kaart. Klik op ‘Oplossen’ en kies ‘De TREK-versie behouden’, ‘De versie van de aanbieder behouden’ of ‘Allebei behouden’.',
  'help.guide.manage-notes.goal':
    'Open een notitie helemaal, zet de belangrijkste bovenaan, en verbeter of verwijder wat verouderd is.',
  'help.guide.manage-notes.tip.2':
    'Tijdens het bewerken verwijdert het rode kruisje bij een bijgevoegd bestand dat bestand meteen, nog voordat je op ‘Opslaan’ klikt, en het gaat niet naar de prullenbak. Alle bestanden van een notitie staan ook op het tabblad Bestanden van de reis.',
  'help.guide.note-categories.step.6':
    'Terug in de kaart Notities filter je de kaarten met de labels onder de kop. Klik op een categorie om alleen die notities te zien. Met ‘Alle’, of door nog een keer op hetzelfde label te klikken, zie je ze weer allemaal.',
  'help.guide.roadtrip-reorder.tip.1':
    'Verplaats je hier een stop, dan verplaatst hij ook in de dagplanning: onder Dagen zie je dezelfde volgorde.',
  'help.guide.roadtrip-overnight.step.1':
    'Vink in Onderweg onder ‘Gezocht wordt’ Accommodatie aan, of Camping voor een kampeerplek, kies de dag waarop je wilt stoppen en klik op ‘Zoeken’.',
  'help.guide.roadtrip-overnight.tip.3':
    'Staat ‘Elke dag bij je verblijf beginnen en eindigen’ aan, onder Routelijn in Rij-instellingen, dan begint de rit van de volgende dag waar je hebt geslapen.',
  'help.guide.roadtrip-stop-fill.title': 'Instellen hoe vol het bij één stop is',
  'help.guide.roadtrip-bookings.title': 'Je vlucht, trein of veerboot in de rit opnemen',
  'help.guide.roadtrip-bookings.tip.2':
    'Een tafel of ticket die bij een stop is geboekt, verschijnt als label bij die stop. Wat bij geen enkele stop hoort, staat onder ‘Ook geboekt op deze dag’.',
  'help.guide.roadtrip-google-import.step.3':
    'Controleer de gevonden stops. Bij elke stop staat waar die ligt. Een stop met ‘Locatie niet gevonden’ wordt overgeslagen.',
  'help.guide.roadtrip-hazards.step.1': 'Open Rij-instellingen in de rechterkolom.',
  'help.ctx.trip-tours.summary':
    'De rechterkolom van het tabblad Planning in de modus Tochten: alle tochten van de reis in één lijst, naast de dagen. Hier zet je tochten op dagen, filter je de lijst, verberg je lijnen op de kaart en importeer je GPX- of KML-bestanden. Routes teken en wijzig je op het tabblad Tochten.',
  'help.guide.tour-show-list.goal':
    'Vervang de plaatsenkolom door de tochten van de reis, zodat je ze naast de dagen ziet en kunt kiezen.',
  'help.guide.tour-show-list.tip.3':
    'Staat de add-on Tochten aan, dan verschijnen tracks nooit in de lijst Plaatsen: elke geïmporteerde track is een tocht en staat hier.',
  'help.guide.tour-add-to-day.step.5':
    'Bij een tocht met etappes krijg je daarna in hetzelfde menu nog een vraag. ‘Etappes vanaf deze dag’ zet etappe 1 op die dag en elke volgende etappe op de dag erna. ‘Hele tocht op deze dag’ zet de hele tocht op die ene dag.',
  'help.guide.tour-day-times.step.1':
    'Wijs in de dagenkolom de rij van de tocht aan, klik op ‘Meer opties’ (de drie puntjes) en kies ‘Bewerken’.',
  'help.guide.tour-day-times.result':
    'De tocht staat in de tijdlijn van de dag met begin- en eindtijd, net als elke stop met een tijd.',
  'help.guide.tour-remove-from-day.result':
    'De tocht staat niet meer bij de dag, en de rij in de lijst heeft geen badge Dag meer.',
  'help.guide.tour-filter-list.tip.2':
    'Een onderdeel verschijnt alleen als de tochten daarin van elkaar verschillen. Bij een korte lijst zie je dus misschien alleen Status.',
  'help.guide.tour-hide-on-map.tip.1':
    'Verbergen geldt alleen voor jou en wordt in deze browser per reis onthouden: de tocht, de dagen en de kleur veranderen niet, en op de kaart van anderen blijft de tocht zichtbaar.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Een track die al in de reis staat, is gemarkeerd met ‘Al in de reis’ en wordt geen tweede keer geïmporteerd.',
  'help.ctx.trip-tour-detail.bullet.4':
    'De rij onderaan: ‘Toevoegen aan dag’ of ‘Verwijderen van dag’ als er een dag open is, Navigatie naar het startpunt, de webpagina van de tocht, GPX, ‘Delen’ als je apparaat bestanden kan delen, Collectie en Kopiëren.',
  'help.guide.tour-detail-read.step.5':
    'Daaronder staan de gegevens: Afstand, Minimale hoogte, Maximale hoogte, Hoogtemeters omhoog en Hoogtemeters omlaag, met de tijden eronder, en het hoogteprofiel in de kleur van de lijn van de tocht.',
  'help.guide.tour-detail-read.result':
    'De kaart van de tocht staat open naast de planning, en je weet op welke dagen de tocht staat, hoe lang en steil hij is en waar hij vandaan komt.',
  'help.guide.tour-rename-colour.tip.2': 'Het potlood en de stip werken alleen voor leden die plaatsen mogen bewerken.',
  'help.guide.tour-take-along.tip.2':
    'Kies in Instellingen een favoriete kaart-app, dan opent Navigatie meteen die app in plaats van een lijst te tonen.',
  'help.guide.tour-copy-keep.step.3':
    'Wil je een tocht bewaren voor andere reizen, open hem dan en klik onderaan de kaart op ‘Collectie’.',
  'help.guide.tour-packing-link.goal':
    'Laat in de kaart van een tocht zien wat je voor die tocht moet inpakken, uit de inpaklijst van de reis of een van de lijsten daarin.',
  'help.guide.tour-packing-link.tip.3':
    'Voor het koppelen heb je het recht nodig om plaatsen te bewerken. Anderen zien de gekoppelde lijst, maar kunnen de koppeling niet wijzigen.',
  'help.guide.tour-files.tip.2': '‘Uploaden’ zie je alleen als je de tocht mag wijzigen en bestanden mag toevoegen.',
  'help.guide.tour-activity-link.step.5':
    'De track staat nu onder Werkelijke track, met eigen waarden en een eigen profiel naast de planning.',
  'help.guide.tour-activity-compare.step.2':
    '‘Grootste afstand tot de planning’ toont hoe ver de track maximaal van de geplande lijn afwijkt, en ‘Buiten de planning’ hoeveel van de track buiten die lijn liep.',
  'help.guide.tour-origin-check.step.1':
    'Open de kaart van de tocht en scrol naar Herkomst. Bij Bron staat waar de tocht vandaan komt: GPX-import met de bestandsnaam, KML- of KMZ-import, of wanderer met het adres.',
  'help.ctx.trip-tour-planner.summary':
    'De tochtplanner van de reis: links de editor, rechts alle tochten van de reis en daartussen de kaart. Hier teken je een tocht punt voor punt, laat je de route over echte paden en wegen lopen, vul je de details in en sla je de tocht op in de reis.',
  'help.guide.tour-open-workspace.goal': 'Open de tochtplanner en leer waar elk onderdeel voor is.',
  'help.guide.tour-open-workspace.tip.1':
    'Met ‘Inklappen’, het lipje aan de binnenkant van elke balk, verberg je de balk om de kaart meer ruimte te geven. Met Planning en ‘Tochten van deze reis’ komen de balken terug. Sleep aan de rand van een balk om hem breder of smaller te maken.',
  'help.guide.tour-draw-route.step.3':
    'Controleer of ‘Punt toevoegen’ onder Waypoints aan staat (dat is dezelfde schakelaar als ‘Punten plaatsen’ in het label op de kaart) en klik dan op de kaart waar de tocht begint.',
  'help.guide.tour-draw-route.result':
    'Een genummerde route op de kaart, met de punten onder Waypoints, klaar om een naam te geven en op te slaan.',
  'help.guide.tour-type-profile.tip.2':
    'Sommige soorten hebben meer nodig voordat je ze kunt opslaan: een Hardlooptocht een Gepland tempo, een Peddeltocht een boot en het soort water, een tocht ‘Ski en winter’ een discipline.',
  'help.guide.tour-edit-points.step.5':
    'Met ‘Routepunt verwijderen’, de prullenbak ernaast, haal je het punt uit de tocht.',
  'help.guide.tour-shaping-points.step.2':
    'Sleep de stip naar het pad waarover de route moet lopen. De route wordt opnieuw gepland via die stip.',
  'help.guide.tour-loop-reverse.goal': 'Laat de tocht eindigen waar hij begint, of draai de richting om.',
  'help.guide.tour-leg-by-hand.title': 'Een stuk met de hand tekenen of opnieuw plannen',
  'help.guide.tour-leg-by-hand.result':
    'Het stuk is een rechte lijn waar jij dat wilt, gemarkeerd als met de hand getekend, of wordt opnieuw gepland.',
  'help.guide.tour-trip-places.tip.2':
    'Verwijder je de stop of koppel je hem los, dan blijft de plaats ongewijzigd in de reis staan, inclusief de dagen.',
  'help.guide.tour-details-times.step.4':
    'Bij Gepland staat het totaal. Typ een eigen waarde om het te overschrijven. Die wordt dan gemarkeerd als Handmatige waarde.',
  'help.guide.tour-save.step.2':
    'Wacht tot de stip naast ‘Nieuwe tocht’ is verdwenen. Voor het opslaan zijn de route en alle hoogtegegevens nodig.',
  'help.guide.tour-edit-saved.goal': 'Open een tocht die je eerder hebt gepland, wijzig hem en sla hem opnieuw op.',
  'help.guide.tour-edit-saved.result': 'De opgeslagen tocht bevat nu je wijzigingen.',
  'help.guide.tour-summary-profile.tip.2':
    'Loopt een route over een via ferrata, dan staat boven de cijfers een waarschuwingsbadge met de moeilijkheidsgraad.',
  'help.guide.tour-list-manage.step.4':
    'De knop boven ‘Totalen van de reis’ is het filter. Op de knop staat welke status hij toont, eerst Alle, met het aantal tochten.',
  'help.guide.tour-delete.step.1':
    'Wijs de tocht aan onder ‘Tochten van deze reis’ en klik rechts in de rij op de prullenbak, ‘Verwijderen’ met de naam van de tocht.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Terwijl je bewerkt, verschijnt bovenaan de balk ‘Deze tocht is elders opgeslagen’. Je wijzigingen blijven bewaard tot je een keuze maakt.',
  'help.ctx.trip-tour-import.summary':
    'Hier importeer je tochten die al ergens anders bestaan in de reis: een GPX-, KML- of KMZ-bestand van een horloge of app, een tocht uit een andere reis van jou, of een route uit je eigen wanderer. Een import blijft precies zoals hij is opgenomen, en je kunt er een bewerkbare versie van plannen.',
  'help.guide.tour-import-gpx.step.1':
    'Open het tabblad Tochten van de reis. Klik rechts bovenaan ‘Tochten van deze reis’ op de + (Tocht toevoegen).',
  'help.guide.tour-import-gpx.tip.4':
    'Bij een KML- of KMZ-bestand staat onder ‘Niet geïmporteerd’ ook wat het bestand naast lijnen nog bevatte: markeringen, gebieden en andere onderdelen.',
  'help.guide.tour-view-import.tip.1':
    'Een import kun je niet punt voor punt bewerken. Met ‘Een bewerkbare versie plannen’, in de kaart Bewerkbare versie erboven, maak je er een tocht van die je wel kunt wijzigen.',
  'help.guide.tour-plan-from-import.step.3':
    'Klik op ‘Import vervangen’ om deze tocht op dezelfde plek opnieuw te plannen: de dagen en notities blijven, en de opgenomen track wordt bewaard zodat je hem kunt terugzetten. ‘Als nieuwe tocht plannen’ laat de import ongewijzigd en maakt er een tweede tocht naast.',
  'help.guide.tour-restore-recorded.goal':
    'Draai het opnieuw plannen van een import terug en krijg de oorspronkelijke track terug, ook lang daarna nog.',
  'help.guide.tour-take-over.goal':
    'Gebruik een tocht die je al in een andere reis hebt gepland of geïmporteerd opnieuw, zonder hem opnieuw te tekenen.',
  'help.guide.tour-take-over.tip.2':
    'Je ziet alleen je andere reizen, en alleen de eerste 100 tochten. Zoek of filter om de rest te vinden.',
  'help.guide.tour-import-wanderer.step.4': 'Klik op ‘In de reis importeren’.',
  'help.ctx.trip-tour-map.bullet.1':
    'Het label linksonder op de kaart bevat de basiskaarten voor de soort tocht die openstaat: Kaart, Topo, Wandelen bij een wandeling, Fietsen bij een fietstocht, en Satelliet. Wat je daar kiest, geldt alleen voor de planner en verandert nooit de kaartinstelling in Instellingen.',
  'help.guide.tour-map-layers.step.2':
    'Klik op Topo voor hoogtelijnen en reliëfschaduw, de kaart die laat zien hoe steil het terrein is. De gekozen kaart blijft gemarkeerd in het label.',
  'help.guide.tour-along-search.step.1':
    'Open een tocht op het tabblad Tochten en scrol in het linkerpaneel omlaag naar ‘Langs de tocht’, onder de stops van de tocht. Dat onderdeel verschijnt zodra de tocht een route heeft.',
  'help.guide.tour-along-search.tip.3':
    'De resultaten komen uit OpenStreetMap en de plaatsenindex van TREK, dus voor het zoeken heb je een internetverbinding nodig. Wordt er niets gevonden, dan probeert ‘Verbreden tot’ de volgende afstand. Is een server te druk, dan toont ‘Opnieuw proberen’ een aftelling tot je het opnieuw kunt proberen.',
  'help.guide.tour-along-add-stop.tip.1':
    'De plaats wordt een stop van de tocht, geen plaats van de reis. Hij verschijnt dus niet in de plaatsenlijst.',
  'help.guide.tour-3d-terrain.step.4':
    'Sleep de schuifregelaar Reliëf om de heuvels tot drie keer zo hoog te maken. Dat helpt bij licht glooiend terrein.',
  'help.guide.tour-3d-flyover.step.1':
    'Zet de tocht in 3D. Terwijl het landschap langs de route laadt, vult zich een ring op de plek van de afspeelknop. Is de ring vol, klik dan op ‘Overvlucht afspelen’. De camera volgt een stip langs de route, en de cursor op het hoogteprofiel in het Tochtoverzicht beweegt mee.',
  'help.guide.tour-map-overlays.title': 'Pistes of zeemarkeringen over de kaart tonen',
  'help.guide.tour-map-overlays.tip.2':
    "Ook zonder geopende tocht is de schakelaar voor pistes er, zodat je een skigebied kunt bekijken voordat je iets plant. Bij een wandeling biedt het label in plaats daarvan Via ferrata's, met het aantal routes in beeld.",
  'help.ctx.trip-tour-stages.bullet.5':
    'Met het plusje in de rij van een tocht, ‘Toevoegen aan dag’, zet je de etappes vanaf de gekozen dag op opeenvolgende dagen van de reis, of de hele tocht op die ene dag.',
  'help.guide.tour-multi-day.step.6':
    'Wil je er weer een dagtocht van maken, klik dan op ‘Dagtocht’ en bevestig ‘Er een dagtocht van maken?’ met ‘Etappe-eindes verwijderen’. De route blijft zoals hij is.',
  'help.guide.tour-stages-on-days.step.1':
    'Wijs in ‘Tochten van deze reis’ de meerdaagse tocht aan en klik op het plusje, ‘Toevoegen aan dag’.',
  'help.guide.tour-stages-on-days.tip.3':
    'Sleep je een meerdaagse tocht op het tabblad Planning naar een dag, dan krijg je dezelfde vraag in een venster, net als bij ‘Toevoegen aan dag’ in de kaart van de tocht.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Padgegevens, onder de routepunten, toont voor elk deel de SAC-graad, de ondergrond en het soort weg uit OpenStreetMap, en kleurt de route op de kaart daarnaar. Niets hiervan verandert de tocht.',
  'help.guide.tour-hike-plan.step.4':
    '‘Punt toevoegen’ staat meteen aan: klik op de kaart waar de wandeling begint en waar hij eindigt. Met ‘Reisplekken’ ernaast kies je in plaats daarvan een hut of hotel uit de reis. Vanaf twee punten berekent TREK de wandelroute.',
  'help.guide.tour-hike-trail-details.title':
    'Moeilijkheidsgraden, ondergrond en soorten wegen langs een wandeling bekijken',
  'help.guide.tour-hike-trail-details.tip.1':
    'Wegen zonder waarde in OpenStreetMap staan onder Onbekend, en onbekend betekent niet makkelijk. Staat er bij sommige ‘Kon deze keer niet worden opgevraagd’, klik dan op ‘Opnieuw proberen’.',
  'help.guide.tour-hike-round.step.4':
    'Klik op een ronde om die te kiezen. In de rij zie je afstand, stijging en tijd, en hoeveel de ronde afwijkt van de afstand die je hebt opgegeven.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Wijs de stop aan waar het deel begint, klik in de rij op Meer acties en kies ‘Wegen voor het volgende deel vergelijken’.',
  'help.guide.tour-ferrata-add.title': 'Een via ferrata aan een wandeling toevoegen',
  'help.guide.tour-ferrata-add.tip.1':
    'Voor een via ferrata heb je uitrusting en ervaring nodig. De knopinfo van de badge laat zien welk deel van de route over de via ferrata loopt.',
  'help.guide.tour-run-plan.step.3':
    'Vul je Gepland tempo in als minuten en seconden per kilometer, bijvoorbeeld 7:30.',
  'help.guide.tour-run-ways.title': 'Zien over wat voor wegen een hardlooptocht loopt',
  'help.ctx.trip-tour-walk.title': 'Stadswandeling',
  'help.guide.tour-walk-plan.goal':
    'Stel een wandeling langs bezienswaardigheden samen uit stops, met hoelang je bij elke stop blijft en welke belangrijk zijn.',
  'help.guide.tour-walk-plan.tip.2':
    'Een stadswandeling heeft geen moeilijkheidslimiet en geen veld Pauzes: in plaats daarvan wordt de verblijfstijd gebruikt.',
  'help.guide.tour-walk-sights.step.4':
    'Klik op een plaats in de lijst. De kaart ervan opent boven de kaart: kies onder ‘Waar het komt’ tussen welke twee stops de plaats komt.',
  'help.guide.tour-walk-day-times.step.1':
    'Zet de wandeling op een dag: klik in ‘Tochten van deze reis’ op de ronde + in de rij (Toevoegen aan dag) en kies de dag.',
  'help.guide.tour-walk-day-times.result':
    'Je kunt stops verschuiven of verblijfstijden aanpassen tot elke plaats open is als je er aankomt.',
  'help.guide.tour-walk-google-import.tip.2':
    'Met ‘Andere link gebruiken’ ga je terug naar het veld voor de link. Laden vervangt niet-opgeslagen wijzigingen in de planner, maar het venster waarschuwt je eerst.',
  'help.guide.tour-walk-check-off.step.4':
    'Bovenaan de lijst zie je hoeveel stops je hebt bezocht en hoeveel looptijd er nog over is. Met ‘Terugnemen’ bij een stop haal je de markering weg.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Het Tochtoverzicht rechts toont ‘Fietstijd (geschat)’, de tijd die de routeplanner voor het profiel berekent, inclusief de klimmen. Pauzes tellen niet mee.',
  'help.guide.tour-bike-profile.step.4':
    'Klik onder Waypoints op ‘Reisplekken’ en kies het begin- en eindpunt, hier Hotel Alpenroyal en daarna Hotel Greif. Je kunt ook controleren of ‘Punt toevoegen’ aan staat en op de kaart klikken. Vanaf twee punten berekent TREK de route.',
  'help.guide.tour-bike-profile.tip.5':
    'Heeft een beheerder de CyclOSM-kaart toegestaan, dan kun je in de rij met kaartlagen ook Fietsen kiezen als er een fietstocht openstaat. Laadt die kaart niet meer, schakel dan over naar Kaart. De tocht verandert niet.',
  'help.guide.tour-bike-surfaces.tip.1':
    '‘Niet in de gegevens’ betekent dat OpenStreetMap daar geen ondergrond heeft vastgelegd. De ondergrond is onbekend, niet per se goed.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Klik op de rij van een graad om die paden op de kaart te laten oplichten.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Eerst kies je de Discipline, en er is niets vooraf geselecteerd: Alpine, Snowboard, Langlaufen, Toerskiën, Sneeuwschoenen of Winterwandelen. Bij Langlaufen kies je ook de Techniek: Klassiek, Skating of Onbekend. Zonder discipline kun je de tocht niet opslaan.',
  'help.guide.tour-ski-plan.step.2': 'Open ‘Soort tocht’ en kies ‘Ski en winter’.',
  'help.guide.tour-ski-plan.tip.4':
    'Waar geen pistegegevens zijn, is een stuk een rechte lijn tussen de punten. Bij sneeuwschoenwandelen en winterwandelen kan het stuk in plaats daarvan over zomerpaden lopen. Dat staat dan in een grijze melding bij het stuk.',
  'help.guide.tour-ski-options.step.5':
    'Klik onder Weglaten op elke soort lift die je niet wilt nemen: Sleepliften, Open stoeltjesliften, Gondels, Kabelbanen of ‘Kabelspoorwegen en treinen’. Een uitgesloten lift is doorgestreept.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Klik op de oplossing die in de rij wordt voorgesteld: ‘Zwaardere pistes toestaan’, ‘Deze lift toestaan’, ‘Met de lift omlaag’, ‘Techniek wisselen’ of ‘Discipline wisselen’. De optie wordt aangepast en het stuk wordt opnieuw gepland.',
  'help.guide.tour-ski-summary.goal': 'Bekijk hoe de dag is verdeeld over skiën, liften, wachten en lopen.',
  'help.guide.tour-ski-summary.result':
    'Je weet hoeveel tijd je die dag op de pistes, in de liften en in de rij voor de liften doorbrengt.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'De laag bestaat uit kaartgegevens, niet uit een actueel bericht: hij zegt niets over wat er open of geprepareerd is, over de sneeuw of over lawines. De schakelaar is er ook zonder geopende tocht, zodat je een skigebied kunt bekijken voordat je plant.',
  'help.guide.tour-ski-import.step.5':
    'Klik op de track in ‘Tochten van deze reis’ om hem te openen. Wil je de discipline later aanpassen, klik dan in de kaart Skispoor op ‘Wijzigen’.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Onder ‘Soort tocht’ vraagt Peddeltocht om een Boot (Kajak, Canadese kano, SUP of Overig) en het soort water (Rivier of Meer). Pas als je beide hebt gekozen, kun je de tocht opslaan.',
  'help.guide.tour-paddle-setup.step.1':
    'Klik op het tabblad Tochten bovenaan de linkerkolom op ‘Nieuwe tocht plannen’.',
  'help.guide.tour-paddle-setup.tip.2':
    'De kaart van een peddeltocht biedt Kaart en Satelliet, en Zeemarkeringen van OpenSeaMap als extra laag.',
  'help.guide.tour-paddle-water-route.step.3':
    'Kies ‘Volgend deel over het water plannen’. TREK plant het stuk over de rivier of het meer, van dit punt naar het volgende.',
  'help.guide.tour-paddle-portage.title': 'De boot om een obstakel heen dragen',
  'help.guide.tour-paddle-portage.tip.2':
    'Bij het laatste punt gaat ‘Boot vanaf hier dragen’ pas in zodra je het volgende punt zet. In de rij staat ‘Vanaf hier overdragen’, en met het kruisje, ‘Toch niet overdragen’, draai je het terug.',
  'help.guide.tour-paddle-lock.step.4':
    'Vul de minuten in voor Wachten en voor Doorvaart. Zodra beide zijn ingevuld, toont de kaart het totaal.',
  'help.guide.tour-paddle-time.step.2':
    'De balk toont de route van begin tot eind: het water, de overdraagstukken in bruin en de sluizen als streepjes. Obstakels op de route zijn markeringen waarop je kunt klikken om ze op de kaart te vinden.',
  'help.guide.tour-paddle-wind.title': 'De wind voor een peddeldag bekijken',
  'help.guide.tour-paddle-wind.tip.3':
    'Op een winderige dag met een meeroversteek biedt de kaart ‘Dicht bij de oever plannen’, waarmee de route over de meren langs de oever wordt gepland.',
  'help.guide.tour-paddle-checklist.step.4':
    'Klik op een punt. De kaart gaat ernaartoe: bij een obstakel opent de kaart ervan met je beslissing, bij je eigen overdraagpunt of sluis wordt het punt geselecteerd.',
  'help.guide.tour-paddle-track-marks.title': 'Overdraagpunten en sluizen markeren op een opgenomen peddeltrack',
  'help.guide.tour-paddle-track-marks.step.7': 'Open de kaarten, vul de minuten in en klik op ‘Opslaan’.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Een route opent in een eigen venster: kies een traject en de Richting waarin je het rijdt, controleer ‘Toegang te paard’ en klik dan op ‘Traject overnemen’.',
  'help.guide.tour-horse-plan.step.3':
    'Klik in de kaart Ruiterroutes op ‘Zoeken in kaartbeeld’. Alle bewegwijzerde ruiterroutes in beeld staan daar met hun lengte.',
  'help.guide.tour-horse-plan.tip.3':
    'Heb je de kaart na het zoeken verschoven? Dan staat er op de knop ‘Dit kaartbeeld doorzoeken’. Is het kaartbeeld te groot, dan wordt je gevraagd eerst in te zoomen.',
  'help.guide.tour-horse-gap.step.4':
    'In de kaart Waypoints staat bij de verbinding ‘Handmatig, niet gecontroleerd’, met de lengte erbij. Wijs het aan om te lezen waarom.',
  'help.guide.tour-horse-recorded.step.2':
    'Het Importvoorbeeld opent, en er is nog niets opgeslagen. Zet onder ‘Importeren als’ de ‘Soort tocht’ op ‘Rit te paard’. Drie badges laten zien wat de import bewaart en wat hij niet berekent.',
  'help.guide.dateless-trip.goal': 'Begin al met plannen voordat je weet wanneer je gaat.',
  'help.guide.trip-reminder.step.3': 'Klik op ‘Bijwerken’.',
  'help.guide.upcoming-reservations.goal':
    'Zie wat je als volgende hebt geboekt in al je reizen en open de reis waar het bij hoort.',
  'help.guide.log-day.tip.3':
    'Een dag die als hele bedrijfsvakantiedag is gemarkeerd, kun je niet invoeren. Op een halve bedrijfsvakantiedag kost een vakantiedag maar 0,5.',
  'help.guide.half-company-holiday.goal':
    'Geef iedereen een vrije middag, bijvoorbeeld op kerstavond, zonder de hele dag vrij te geven.',
  'help.guide.public-holidays.tip.2': 'Beweeg je muis over een feestdag in het raster om de naam te zien.',
  'help.guide.edit-holiday-calendar.step.3':
    'Wijzig het land of de regio in de keuzelijsten, of klik op de prullenbak om de kalender te verwijderen.',
  'help.guide.person-color.step.2': 'Kies een kleur. Die wordt meteen opgeslagen en het venster sluit.',
  'help.guide.answer-fusion-request.goal':
    'Beslis of je je vakantieplanning wilt samenvoegen met iemand die je heeft uitgenodigd.',
  'help.guide.log-for-partner.goal':
    'Voer een vrije dag in voor iemand met wie je planning is samengevoegd, bijvoorbeeld als die persoon je dat vraagt.',
  'help.guide.dissolve-fusion.goal': 'Splits een samengevoegde planning weer op in aparte planningen.',
  'help.guide.country-places.step.1':
    'Zoek een land dat je hebt bezocht en kies het. De kaart van het land verschijnt in het paneel onderaan.',
  'help.guide.tour-activity-stats.step.3':
    'Bekijk de cijfers: de afstand, met het aantal tochten in de hoek, en daarna Hoogtemeters omhoog en Hoogtemeters omlaag. Bij Alle typen zie je daarna de drie soorten die je het vaakst hebt gedaan, elk met aantal en afstand.',
  'help.guide.move-to-list.step.1':
    'Klik in de filterrij op het pictogram met het vinkje, ‘Kiezen’, en vink de plaatsen aan.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Kies onder ‘In de reis’ de reis. Een reis waaraan je geen tochten mag toevoegen, is gedimd.',
  'help.guide.tour-collection-manage.goal':
    'Bekijk welke tochten er in een lijst staan en waar ze vandaan komen, en verwijder de tochten die je niet meer nodig hebt.',
  'help.guide.entry-draft.goal':
    'Schrijf nu al een vermelding en houd die verborgen in het gedeelde reisverslag tot hij klaar is.',
  'help.guide.journey-map-layers.step.2':
    'Klik op de (i) aan het eind van de balk voor de legenda: die legt alle markeringen, stippen en lijnen uit.',
  'help.guide.journey-keep-route.step.2':
    'Controleer de ‘Tijdzone van de dag’, die bepaalt waar de dag begint en eindigt, en bekijk de opname: afstand, tijdsspanne, delen en onderbrekingen.',
  'help.guide.journey-day-stays.step.2':
    'Klik bij een bezoek op ‘Een dagboekvermelding schrijven’. De vermelding wordt aan die dag toegevoegd op het tijdstip van aankomst, met de naam en positie van het bezoek.',
  'help.guide.journey-take-over-day.step.2':
    'Vink de bezoeken aan die je wilt houden en verbeter de namen. Met ‘Samenvoegen tot één item’ tussen twee aangevinkte bezoeken voeg je ze samen, met ‘Apart houden’ splits je ze weer.',
  'help.guide.journey-auto-prepare.step.1': 'Klik rechtsboven op ⋯ om Reisverslaginstellingen te openen.',
  'help.guide.photo-location.step.1': 'Klik rechtsboven op ⋯ om Reisverslaginstellingen te openen.',
  'help.guide.share-public.tip.3':
    'Concepten zijn nooit via de link te zien, en opgenomen routes alleen op dagen met een gepubliceerde vermelding.',
  'help.ctx.settings-plugins.title': 'Plugins', // same-as-en
  'help.ctx.settings-about.bullet.2':
    '‘Bug melden’ en ‘Feature aanvragen’ openen het project op GitHub. ‘Wiki’ opent de documentatie.',
  'help.guide.map-provider.tip.3':
    'Op een GL-kaart sleep je met de rechtermuisknop om te draaien en te kantelen. Met de middelste muisknop voeg je een plaats toe.',
  'help.guide.web-push-device.step.1':
    'Klik onder ‘Pushmeldingen op dit apparaat’ op ‘Inschakelen op dit apparaat’ en sta meldingen toe als de browser daarom vraagt. Met ‘Test versturen’ controleer je of er een melding aankomt.',
  'help.guide.connect-airtrail.title': 'Je AirTrail koppelen',
  'help.guide.connect-dawarich.title': 'Je Dawarich koppelen',
  'help.guide.tour-connect-wanderer.title': 'Je wanderer koppelen',
  'help.guide.tour-connect-wanderer.tip.3': 'Met ‘Verbinding verbreken’ rechts verwijder je het token weer.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Via welke kanalen je deze meldingen krijgt, kies je bij Meldingen, in de rij ‘wanderer: meldingen over je trails’.',
  'help.guide.plugin-settings.tip.1':
    'Deze instellingen gelden alleen voor jou. Andere leden stellen de plugin zelf in.',
  'help.guide.offline-conflicts.step.3':
    'Wijzigingen die de server blijft weigeren, staan onder Offline cache bij Mislukte wijzigingen. Met ‘Opnieuw proberen’ verstuur je ze nog een keer, met ‘Verwerpen’ houd je de versie van de server.',
  'help.ctx.admin-notifications.bullet.4':
    'Standaarden voor gebruikers, onderaan: per gebeurtenis en kanaal Aan, Uit of Geblokkeerd, voor iedereen die het zelf niet heeft aangepast.',
  'help.guide.default-user-settings.step.2':
    'Een veld dat je hebt ingesteld, krijgt een resetlink naast de naam. Daarmee zet je de ingebouwde standaardwaarde van TREK terug.',
  'help.guide.own-routing-engine.title': 'Je eigen routeservers gebruiken',
  'help.guide.admin-passkeys.result':
    'Op de inlogpagina staat ‘Inloggen met een passkey’, en mensen kunnen passkeys toevoegen in hun instellingen.',
  'help.guide.rotate-jwt-secret.goal': 'Beëindig alle sessies als je vermoedt dat er iets is uitgelekt.',
  'help.guide.notification-defaults.result':
    'Iedereen die een cel niet zelf heeft aangepast, begint met jouw keuze, en geblokkeerde cellen staan in hun instellingen op slot.',
  'help.ctx.notifications.bullet.3':
    'Bij elke melding staat wie wat heeft gedaan en waar. Ongelezen meldingen hebben een gekleurde achtergrond. Met een knop eronder, zoals ‘Reis bekijken’ of ‘Vacay bekijken’, ga je erheen en wordt de melding als gelezen gemarkeerd.',
  'help.guide.read-notifications.tip.1':
    'De bel staat op elk scherm met de navigatiebalk, en het getal wordt vanzelf bijgewerkt als er iets nieuws binnenkomt.',
  'help.guide.filter-notifications.tip.1':
    'Terwijl je omlaag scrolt, laadt de pagina oudere meldingen, dus er valt niets weg na het eerste scherm.',
  'help.guide.mark-notifications-read.result':
    'Geen enkele melding heeft nog een gekleurde achtergrond, en het rode getal op de bel is verdwenen.',
  'help.guide.notification-settings.title': 'Kiezen waarover je meldingen krijgt',
  'help.guide.link-journal.step.1': 'Klik op ‘Reisinstellingen’ naast de naam van de reis en kies links ‘Reisverslag’.',
  'help.guide.dawarich-stays.tip.1':
    'Er komt niets in de reis tot je op ‘Plaats toevoegen’ klikt. Bij een plaats die uit een bezoek is toegevoegd, staat in de details: ‘Toegevoegd uit je Dawarich-opnames’.',
  'help.guide.leave-stop-off-route.title': 'Een stop buiten de route houden',
  'help.guide.move-booking-day.step.1':
    'Beweeg je muis over de rij van de boeking in de dag: de greep links laat zien dat je hem kunt verslepen.',
  'help.guide.place-image-from-file.tip.1':
    'Alleen JPG-, PNG-, GIF- en WebP-bestanden worden aangeboden, een PDF-ticket dus niet.',
  'help.guide.place-own-hours.step.4':
    'De knoppen rechts van Openingstijden: met de kopieerknop krijgt elke dag de tijden van maandag, en met de X verwijder je je eigen tijden weer. Heeft TREK zelf openingstijden gevonden, dan zet je die met ‘Overnemen uit de plekdetails’ terug.',
  'help.guide.confirm-stay-booking.step.2':
    'De boeking opent boven de planning. Het eerste label bovenaan toont de status.',
  'help.ctx.trip-map.bullet.9':
    'Elke tocht van de reis is een lijn in de eigen kleur, met een markering bij het begin. Klik op de lijn om de kaart van de tocht te openen. Staat er een tocht op een dag, dan loopt de dagroute naar het begin van de tocht en gaat verder vanaf het eind. Met het oog naast een tocht in de lijst Tochten, ‘Verbergen op de kaart’, haal je de lijn van je kaart.',
  'help.guide.tour-map-lines.result':
    'De tochten die je wilt zien, staan op de kaart, elk in een eigen kleur, en de tocht die je hebt verborgen, staat gedimd in de lijst Tochten.',
  'help.guide.car-stops.step.2':
    'Klik bovenaan op het label met de soort en kies Auto. Het formulier past zich aan: Datum en Starttijd worden Ophalen en Ophaaltijd, Einddatum en Eindtijd worden Inleveren en Inlevertijd, en onder Van en Naar verschijnt ‘Stops onderweg’.',
  'help.guide.transport-details.goal':
    'Bekijk alle gegevens van een rit op één plek, kopieer de boekingscode, hernoem de rit of ga ernaartoe op de kaart.',
  'help.guide.transport-details.tip.2':
    'Met Escape of een klik buiten de details sluit je ze. Staat Hernoemen of de vraag om te verwijderen open, dan sluit die eerst.',
  'help.guide.export-transports-csv.tip.1':
    'Het pictogram staat alleen in de balk als er minstens één rit op het tabblad staat.',
  'help.guide.group-sort-bookings.step.1':
    'Klik in Kaarten of Lijst op Weergaveopties, het schuifregelaarpictogram na de drie weergavepictogrammen.',
  'help.guide.create-booking.tip.4':
    'Offline wordt de boeking op dit apparaat opgeslagen en gesynchroniseerd zodra je weer online bent. Voor nieuwe bestanden is een internetverbinding nodig, dus verwijder ze of sla later op. Klik je per ongeluk buiten het formulier of druk je op Escape, dan vraagt TREK ‘Wijzigingen weggooien?’ voordat iets van wat je hebt getypt verloren gaat.',
  'help.guide.booking-on-map.tip.2': 'Een verblijf opent op de eerste nacht.',
  'help.guide.export-bookings-csv.step.3':
    'Klik op ‘Exporteren als spreadsheet (CSV)’, het spreadsheetpictogram na Weergaveopties.',
  'help.guide.arrange-packing-list.step.3':
    'Met ‘A tot Z’ helemaal rechts in de rij met Gedeeld en Mijn lijst zie je de items van elke lijst op alfabetische volgorde, zodat je snel ziet of iets er al op staat. Klik er nog een keer op om terug te gaan naar je eigen volgorde.',
  'help.guide.count-packed-pieces.step.1':
    'Klik in een rij op de badge met het aantal, het kleine getal met een x erachter, typ hoeveel je meeneemt, bijvoorbeeld 5, en druk op Enter.',
  'help.guide.expense-receipts.step.3':
    'Klik onderaan het venster op ‘Opslaan’. De bestanden worden met de uitgave geüpload en verschijnen ook bij de Bestanden van de reis.',
  'help.guide.files-sync-settings.step.1':
    'Klik rechts in de balk op Documentsynchronisatie. Is de reis gekoppeld, dan opent rechts de kaart van je opslag. Heb je meer dan één opslag, klik dan links onder ‘Deze reis’ op de opslag die je wilt.',
  'help.guide.files-sync-settings.tip.3':
    '‘Directe updates’, een link met ‘Kopiëren’ ernaast, is er alleen voor opslag waarbij TREK zich niet automatisch op wijzigingen kan abonneren. Plak de link in de opslag, dan komen wijzigingen meteen binnen in plaats van bij de volgende controle.',
  'help.guide.manage-notes.step.1':
    'Klik op de drie puntjes bovenaan een notitiekaart (‘Meer opties’). In het menu staan Uitvouwen, Vastpinnen, Bewerken en Verwijderen.',
  'help.guide.note-categories.title': 'Notities in categorieën indelen',
  'help.guide.note-categories.result':
    'De notities hebben de nieuwe namen en kleuren, en de kaart Notities toont alleen de categorie die je hebt gekozen.',
  'help.guide.roadtrip-stops.tip.5':
    'Een stop met een eindtijd in de dagplanning duurt tot die tijd. In het venster ervan staat wanneer de rit vertrekt, en met ‘Eindtijd verwijderen’ stel je de duur weer zelf in.',
  'help.guide.roadtrip-reorder.tip.2':
    'Geboekte ritten en hun terminals blijven staan waar de boeking ze zet. Alleen plaatsen kun je verslepen.',
  'help.guide.roadtrip-overnight.step.2':
    'Bij een hotel staat een bedje in plaats van het plusje. Klik erop, ‘Toevoegen als overnachting’, om ‘Als stop toevoegen’ voor de nacht te openen. Bij een camping staat het gewone ‘Toevoegen’.',
  'help.guide.roadtrip-stop-fill.goal':
    "Geef één tank- of laadstop een eigen vulniveau, zoals 80 % bij een snellader of 100 % 's nachts.",
  'help.guide.roadtrip-bookings.goal': 'Zie waar een geboekte rit in je autorit past, en wanneer je er moet zijn.',
  'help.guide.roadtrip-bookings.tip.3':
    'Een rit die op geen enkele dag van de reis staat, hoort niet bij de autorit: bovenaan de balk wordt hij genoemd, met ‘Boeking openen’ om hem een datum te geven.',
  'help.guide.roadtrip-google-import.step.4': 'Kies onder Dag op welke dag de stops komen en klik op ‘Importeren’.',
  'help.guide.roadtrip-hazards.step.2':
    'Zet onder ‘Actuele waarschuwingen’, onderaan de rechterkolom van het venster, ‘Gevarengebieden tonen’ aan en klik op ‘Sluiten’.',
  'help.ctx.trip-tours.bullet.1':
    'Met de schakelaar Plaatsen en Tochten bovenaan de rechterkolom wissel je tussen de plaatsenlijst en de tochten. Die schakelaar is er alleen als de add-on Tochten aan staat, en tochten verschijnen dan nooit in de lijst Plaatsen.',
  'help.guide.tour-show-list.step.1':
    'Klik op het tabblad Planning in de schakelaar bovenaan de rechterkolom op Tochten. De kolom toont nu de tochten in plaats van de plaatsen.',
  'help.guide.tour-show-list.result':
    'De rechterkolom toont de tochten van de reis, en de tocht waarop je hebt geklikt, staat open in zijn kaart.',
  'help.guide.tour-add-to-day.tip.1':
    'Sleep je een tocht met etappes naar een dag, dan krijg je dezelfde vraag in een klein venster. Met ‘Annuleren’ blijft de planning zoals hij was.',
  'help.guide.tour-day-times.step.2':
    'Vul Start in en laat Einde leeg. De regel onder de velden toont het einde dat TREK berekent: de starttijd plus de duur van de tocht.',
  'help.guide.tour-remove-from-day.title': 'Een tocht van een dag halen',
  'help.guide.tour-filter-list.title': 'De lijst met tochten filteren',
  'help.guide.tour-filter-list.tip.3':
    'Blijft er niets over, dan staat er ‘Geen tocht komt overeen met deze filters’, en met ‘Filters resetten’ wis je ze allemaal. Filters veranderen alleen wat de lijst toont, nooit een tocht of een dag.',
  'help.guide.tour-hide-on-map.tip.2':
    'De kaart op de telefoon toont altijd alle tochten, en op het tabblad Tochten staat geen oog: verbergen kan alleen hier op het tabblad Planning.',
  'help.guide.tour-import-plan-tab.tip.2':
    'De import blijft hier in de lijst staan en opent niet in een planner. Zet hem met de ronde + op een dag, of open het tabblad Tochten om hem daar te bekijken.',
  'help.ctx.trip-tour-detail.bullet.5':
    'De kaart is om te lezen en voor wat bij een tocht hoort. De route zelf wijzig je op het tabblad Tochten: open dat en klik op de tocht onder ‘Tochten van deze reis’. Daar verwijder je een tocht ook, niet hier.',
  'help.guide.tour-detail-read.step.6':
    'Scrol verder voor de Beschrijving en de Notities, en daarna Herkomst: gepland in TREK, het bestand waaruit de tocht is geïmporteerd, of de wanderer-trail waar hij vandaan komt, met de datum.',
  'help.guide.tour-rename-colour.title': 'Een tocht hernoemen en een andere kleur geven',
  'help.guide.tour-rename-colour.result':
    'De tocht heeft overal in de reis zijn nieuwe naam, en de lijn heeft de kleur die je hebt gekozen.',
  'help.guide.tour-take-along.tip.3':
    'Het bestand komt van de server, dus je hebt een internetverbinding nodig. Een tocht die je offline hebt gemaakt, kun je downloaden zodra hij is gesynchroniseerd.',
  'help.guide.tour-copy-keep.step.4':
    'Kies de lijst onder Collectie, controleer de ‘Naam in de collectie’ en klik op ‘Bewaren’.',
  'help.guide.tour-packing-link.step.1':
    'Open de kaart van de tocht en scrol naar Inpaklijst. Klik op ‘Inpaklijst koppelen’.',
  'help.guide.tour-packing-link.result':
    'Je bent bij de inpaklijst op het tabblad Lijsten, en de kaart van de tocht toont elk item dat je aanvinkt.',
  'help.guide.tour-files.result': 'De bestanden zijn aan de tocht gekoppeld en open je vanuit de kaart van de tocht.',
  'help.guide.tour-activity-link.tip.1':
    'De planning blijft zoals hij is. De track is alleen gekoppeld, en met ‘Ontkoppelen’ haal je de koppeling weer weg.',
  'help.guide.tour-activity-compare.step.3':
    'Klik op ‘Vergelijken op de kaart’ om de werkelijke track gestippeld naast de planning te tonen. Met ‘Vergelijking beëindigen’ haal je hem weer weg.',
  'help.guide.tour-origin-check.step.2':
    'Bij Geïmporteerd staat de dag van de import. Hier toont de huidige stand: ‘Zoals geïmporteerd’, ‘Bewerkt in TREK’ of ‘Opnieuw gepland, opgenomen spoor bewaard’.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Tochten staat in de tabbalk van de reis direct na Planning, als de add-on Tochten aan staat. Het tabblad is er op een computer en een tablet. Op een telefoon bekijk je tochten en zet je ze op dagen via het tabblad Planning, maar tekenen kan daar niet.',
  'help.guide.tour-open-workspace.step.1':
    'Klik in de tabbalk van de reis op Tochten, direct na Planning. De kaart vult het scherm, met aan elke kant een balk.',
  'help.guide.tour-open-workspace.tip.2':
    'Sleep GPX-, KML- of KMZ-bestanden ergens naar dit tabblad om ze als tochten van de reis te importeren.',
  'help.guide.tour-draw-route.step.4':
    'Onderaan de kaart verschijnt ‘Punt geplaatst’. Met ‘Ongedaan maken’ ernaast haal je het punt weer weg.',
  'help.guide.tour-type-profile.title': 'Kiezen wat voor tocht het is',
  'help.guide.tour-type-profile.result':
    'De route van de tocht wordt gepland voor de soort en het profiel die je hebt gekozen.',
  'help.guide.tour-edit-points.step.6':
    'Met ‘Routepuntbewerking ongedaan maken’ en ‘Routepuntbewerking opnieuw uitvoeren’ bovenaan de balk draai je elke wijziging een voor een terug of voer je hem opnieuw uit.',
  'help.guide.tour-shaping-points.step.3':
    'Onder Waypoints staat het punt met een badge Vormpunt en zonder nummer, zodat de stops hun nummers houden.',
  'help.guide.tour-loop-reverse.step.1':
    'Klik bovenaan de kaart Waypoints op ‘Terug naar start’. De tocht krijgt een laatste stuk terug naar het eerste punt.',
  'help.guide.tour-leg-by-hand.goal':
    'Verbind twee punten met een rechte lijn waar de routeplanner geen weg vindt, of plan een stuk opnieuw.',
  'help.guide.tour-trip-places.title': 'Een plaats uit de reis als stop gebruiken',
  'help.guide.tour-trip-places.tip.3': 'De andere tochten van de reis worden nooit als stop aangeboden.',
  'help.guide.tour-details-times.tip.1': 'Je kunt tijden typen als 2:56, 2 u 56 of 176 minuten.',
  'help.guide.tour-save.step.3':
    'Klik onderaan de linkerbalk op ‘Opslaan’. Je ziet ‘Tocht opgeslagen’, en de titel van de balk verandert in ‘Tocht bewerken’.',
  'help.guide.tour-edit-saved.step.1':
    'Klik op de tocht onder ‘Tochten van deze reis’. Hij opent in de linkerbalk als ‘Tocht bewerken’, en de kaart toont de route.',
  'help.guide.tour-summary-profile.title': 'Het tochtoverzicht en het hoogteprofiel bekijken',
  'help.guide.tour-summary-profile.tip.3':
    'Een peddeltocht toont geen hoogtes, omdat op het water alleen de hoogtes van de oevers beschikbaar zouden zijn.',
  'help.guide.tour-list-manage.step.5':
    'Kies Ongepland voor de tochten die nog op geen enkele dag staan, of beperk de lijst op Bron, Routelimiet of Type. Bij elke regel staat hoeveel tochten erbij horen, en de totalen passen zich aan het filter aan.',
  'help.guide.tour-delete.step.2':
    'Lees wat er mee wordt verwijderd: de route, de bewerkbare routepunten en de toewijzingen aan dagen. Klik op ‘Permanent verwijderen’.',
  'help.guide.tour-saved-elsewhere.step.2':
    '‘Nieuwere laden’ vervangt je wijzigingen door de nieuwere versie, na een bevestiging.',
  'help.ctx.trip-tour-import.bullet.1':
    'De + bovenaan ‘Tochten van deze reis’ is ‘Tocht toevoegen’. Daar kies je ‘GPX of KML importeren’, ‘Wandeling uit Google Maps importeren’ of ‘Tocht overnemen uit een andere reis’. Je kunt bestanden ook ergens naar het tabblad Tochten slepen.',
  'help.guide.tour-import-gpx.step.2':
    'Kies ‘GPX of KML importeren’ en kies een of meer .gpx-, .kml- of .kmz-bestanden van maximaal 10 MB per stuk.',
  'help.guide.tour-import-gpx.tip.5':
    'Bij een bestand zonder hoogtegegevens staat ‘Geen hoogtes in het bestand’. De lijn en de afstand kloppen nog wel, maar de hoogtemeters omhoog en omlaag blijven onbekend.',
  'help.guide.tour-view-import.tip.2':
    'Met het downloadpictogram bovenaan sla je de tocht weer als GPX-bestand op, en met de bladwijzer bewaar je hem in een collectie.',
  'help.guide.tour-plan-from-import.step.4':
    'De tocht opent in de editor met de routepunten. Pas hem aan als je wilt en klik onderaan de kolom op ‘Opslaan’.',
  'help.guide.tour-restore-recorded.step.1':
    'Klik in ‘Tochten van deze reis’ op de tocht die je opnieuw hebt gepland. In de editor staat in de kaart Opgenomen track dat de oorspronkelijk opgenomen track bewaard is gebleven.',
  'help.guide.tour-take-over.step.1':
    'Open het tabblad Tochten van de reis waar de tocht naartoe moet. Klik bovenaan ‘Tochten van deze reis’ op de + (Tocht toevoegen).',
  'help.guide.tour-take-over.tip.3':
    'Voor het overnemen van een tocht is een internetverbinding nodig. Heeft de editor niet-opgeslagen wijzigingen, dan komt de kopie wel in de lijst, maar opent hij niet, zodat je werk open blijft.',
  'help.guide.tour-import-wanderer.tip.1':
    'De knop verschijnt zodra wanderer is gekoppeld onder Instellingen, Integraties. Tot die tijd biedt de lijst ‘Koppelen in de instellingen’.',
  'help.ctx.trip-tour-map.bullet.2':
    "Na de scheidingslijn in het label staan de schakelaars voor de soort tocht: ‘Punten plaatsen’ terwijl je een tocht bewerkt, Via ferrata's bij een wandeling, Zeemarkeringen bij een peddeltocht en de pistes bij een skitocht. Met 3D aan het eind zie je de tocht in een 3D-landschap.",
  'help.guide.tour-map-layers.step.3':
    "Klik bij een wandeling op Wandelen voor de gemarkeerde wandelpaden en hun nummers. Bij een fietstocht kies je in plaats daarvan Fietsen voor de fietsroutes. Satelliet toont luchtfoto's, en met Kaart ga je terug naar de standaardkaart.",
  'help.guide.tour-along-search.step.2':
    'Klik op ‘Waarnaar zoeken’ en vink aan wat je zoekt, tot zes soorten tegelijk: Uitzichtpunten, Toppen, Hutten en schuilplaatsen, Drinkwater, Eten en meer. De lijst biedt wat bij de soort tocht past, en een tocht begint met drie soorten aangevinkt.',
  'help.guide.tour-along-add-stop.title': 'Een plaats langs de tocht als stop toevoegen',
  'help.guide.tour-along-add-stop.tip.2':
    'Wordt een plaats het nieuwe eindpunt, dan staat er ‘Maakt de tocht langer’: het oude eindpunt is dan niet langer het einde, en de tocht loopt door tot deze plaats.',
  'help.guide.tour-3d-terrain.step.5':
    'Klik nog een keer op 3D om terug te gaan naar de platte kaart en verder te plannen.',
  'help.guide.tour-3d-flyover.step.2':
    'Kies onder Snelheid 1×, 2× of 4×. Op 1× duren de meeste tochten van begin tot eind ongeveer 45 seconden.',
  'help.guide.tour-map-overlays.goal':
    'Toon de skipistes en liften, of de boeien en havenmarkeringen, op de kaart terwijl je een ski- of peddeltocht plant.',
  'help.guide.tour-map-overlays.tip.3':
    'Laadt een laag niet meer, dan toont de schakelaar een ! met uitleg. De kaart en je route werken ook zonder die laag.',
  'help.guide.tour-multi-day.title': 'Een tocht over meerdere dagen plannen',
  'help.guide.tour-multi-day.tip.1':
    '‘Etappe hier beëindigen’ werkt ook bij een dagtocht: de tocht wordt dan vanzelf een meerdaagse tocht. Bij de eerste en de laatste stop en bij een vormpunt kan geen etappe eindigen.',
  'help.guide.tour-stages-on-days.step.2': 'Kies de dag waarop je aan de eerste etappe begint.',
  'help.guide.tour-stages-on-days.tip.4':
    'In de dagplanning staat elke etappe als Etappe N, met eigen afstand en tijd. Met ‘Ongedaan maken’ boven de dagen op het tabblad Planning draai je de hele verdeling in één stap terug.',
  'help.ctx.trip-tour-hike.bullet.5':
    "Bij een wandeling toont Via ferrata's in de rij kaartknoppen linksonder de via ferrata's in de buurt. Via de kaart van een via ferrata voeg je die als apart stuk aan de route toe.",
  'help.guide.tour-hike-plan.step.5':
    'Open onder Details ‘Maximale moeilijkheid van het pad’ en kies hoe zwaar de paden mogen worden, van T1 (Wandelen) tot T6 (Moeilijk alpien wandelen). De route wordt daarbinnen opnieuw gepland.',
  'help.guide.tour-hike-trail-details.goal':
    'Bekijk wat OpenStreetMap vastlegt over de wegen van een wandeling, en vind die stukken op de kaart.',
  'help.guide.tour-hike-trail-details.tip.2':
    'Is een moeilijkheidsgraad hoger dan de grens van de wandeling, dan staat er in de rij een badge ‘Boven de grens’.',
  'help.guide.tour-hike-round.step.5':
    'Klik op ‘Deze ronde nemen’ en daarna op ‘Vervangen’ als je wordt gevraagd of je de geplande route wilt vervangen.',
  'help.guide.tour-hike-compare-ways.step.2':
    '‘Andere wegen voor dit deel’ opent boven de kaart, met de Huidige weg en Weg A, Weg B enzovoort. Elke weg staat in een eigen kleur op de kaart, en als je een rij aanwijst, licht de bijbehorende lijn op.',
  'help.guide.tour-ferrata-add.goal': "Zoek de via ferrata's rond je wandeling en neem er een op in de route.",
  'help.guide.tour-ferrata-add.tip.2':
    "Via ferrata's worden alleen bij wandelingen aangeboden. Loopt de route al over een via ferrata, dan staat op de kaart ervan ‘Deel van de tocht’ in plaats van ‘Aan tocht toevoegen’.",
  'help.guide.tour-run-plan.step.4':
    'Zet het begin- en eindpunt op de kaart, of kies ze via ‘Reisplekken’. Onder het tempo zie je de looptijd: de afstand maal het tempo.',
  'help.guide.tour-run-ways.goal': 'Kijk hoeveel van een hardlooptocht onverhard is en hoe zwaar de paden worden.',
  'help.ctx.trip-tour-walk.summary':
    'Een tocht te voet van stop naar stop, gepland op het tabblad Tochten: hoelang je bij elke stop blijft, welke belangrijk zijn, de bezienswaardigheden onderweg, en wanneer je op de dag van de wandeling bij elke stop aankomt, vergeleken met de openingstijden.',
  'help.guide.tour-walk-plan.step.1':
    'Klik bovenaan de linkerkolom op ‘Nieuwe tocht plannen’, open dan ‘Soort tocht’ en kies ‘Stadswandeling / bezienswaardigheden’.',
  'help.guide.tour-walk-plan.tip.3':
    '‘Loskoppelen van de plek’, onder Meer acties bij een stop, verbreekt alleen de koppeling met een plaats van de reis. De plaats zelf blijft in de reis staan.',
  'help.guide.tour-walk-sights.step.5':
    'Klik op ‘Als stop toevoegen’. Een melding laat zien hoeveel langer de wandeling wordt, met ‘Ongedaan maken’ ernaast.',
  'help.guide.tour-walk-day-times.step.2':
    'Geef de wandeling een starttijd op die dag: klik op het tabblad Planning met de rechtermuisknop op de wandeling in de dag, kies ‘Bewerken’ en vul een Start in.',
  'help.guide.tour-walk-google-import.title': 'Een wandelroute uit Google Maps omzetten in een stadswandeling',
  'help.guide.tour-walk-google-import.tip.3':
    'Alleen de stops worden overgenomen, niet de lijn die Google Maps tekent. Voor een korte maps.app.goo.gl-link is een internetverbinding nodig om hem te kunnen volgen.',
  'help.guide.tour-walk-check-off.tip.1':
    'Markeringen worden per dag opgeslagen: open de wandeling vanuit de dag in de planning, niet vanuit de lijst met tochten.',
  'help.ctx.trip-tour-bike.bullet.3':
    'De kaart ‘Ondergrond en wegen’ onder Waypoints toont waarover de route loopt: de ondergronden, de soorten wegen en het deel waarvan bekend is dat het onverhard is. Klik op een rij om die stukken op de kaart te laten oplichten.',
  'help.guide.tour-bike-profile.step.5':
    'Bekijk ‘Fietstijd (geschat)’ in het Tochtoverzicht rechts. Beweeg je muis over het infopuntje om te zien hoe die wordt berekend.',
  'help.guide.tour-bike-surfaces.title': 'De ondergrond van een fietstocht bekijken',
  'help.guide.tour-bike-surfaces.tip.2':
    'Bij het profiel Racefiets staat boven de balken een waarschuwing met hoeveel kilometer bekend onverhard is. Met ‘Tonen op de kaart’ markeer je die stukken.',
  'help.guide.tour-bike-mtb-grades.result':
    'De kaart markeert de paden van de gekozen moeilijkheidsgraad, en je weet welke stukken van de tocht zwaar zijn.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Onder de discipline staan de opties van de pisteplanner, alleen de opties die bij je discipline horen: Zwaarste pistes, Voorkeur, Tempo, schakelaars zoals ‘Liften gebruiken’, en Weglaten voor de soorten liften die je niet wilt nemen. Bij elke wijziging wordt de tocht opnieuw gepland.',
  'help.guide.tour-ski-plan.step.3':
    'Kies onder Discipline wat je gaat doen: Alpine, Snowboard, Langlaufen, Toerskiën, Sneeuwschoenen of Winterwandelen. Er is niets vooraf geselecteerd, en zonder discipline kun je de tocht niet opslaan.',
  'help.guide.tour-ski-plan.result':
    'Een opgeslagen tocht ‘Ski en winter’ in ‘Tochten van deze reis’, met stukken over de pistes, liften en paden op de kaart, en de tijd berekend in het Tochtoverzicht.',
  'help.guide.tour-ski-options.tip.1': 'Bij elke wijziging wordt de tocht stuk voor stuk opnieuw gepland.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Past geen enkele oplossing, klik dan op ‘Recht tekenen’. Het stuk wordt een rechte lijn tussen de twee punten.',
  'help.guide.tour-ski-summary.step.1':
    'Zoek onder de routepunten de kaart Pisteroute. Klik op de titel om de kaart in te klappen of weer te openen.',
  'help.guide.tour-ski-pistes-layer.title': 'De pistes op de kaart tonen',
  'help.guide.tour-ski-pistes-layer.result':
    'De pistes staan onder de tocht op de kaart, en je kunt hun kleuren aflezen.',
  'help.guide.tour-ski-import.step.6':
    'Kies in ‘Skispoor indelen’ de juiste discipline of techniek en klik op ‘Opslaan’.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Bij elk punt staat de rol als badge: Instap, Uitstap, Weer instappen of Laatste uitstap. Onder een punt zie je wat erna komt: een stuk dat met de hand is getekend, een overdraagstuk, een sluis, of waarom een stuk niet kon worden gepland.',
  'help.guide.tour-paddle-setup.step.2':
    'Open ‘Soort tocht’ en kies Peddeltocht, ‘Op het water, met kajak, kano of SUP’.',
  'help.guide.tour-paddle-setup.tip.3':
    'Bij een peddeltocht zoekt ‘Langs de tocht’ eerst naar Instapplaatsen, Bootverhuur en Drinkwater.',
  'help.guide.tour-paddle-water-route.step.4':
    'Een stuk dat TREK niet kon plannen, wordt rood en vermeldt waarom, bijvoorbeeld dat er voor het gebied nog geen watergegevens zijn. Klik op ‘Recht tekenen’ om het voorlopig met de hand te tekenen.',
  'help.guide.tour-paddle-portage.goal':
    'Markeer een stuk waar je de boot draagt, zodat het als land telt, met tijd om uit te stappen en weer in te stappen.',
  'help.guide.tour-paddle-portage.tip.3':
    'Dragen telt met 2 km/u, tot je in de kaart Tijdschatting je eigen Draagtempo instelt.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK kent geen schuttijden van sluizen. De tijden zijn alleen wat jij invult, dus controleer zelf de bedieningstijden van de sluis.',
  'help.guide.tour-paddle-time.step.3':
    'De rij Water is de afstand op het water bij jouw Peddeltempo. Pas het tempo aan in het veld Peddeltempo bovenaan de kolom.',
  'help.guide.tour-paddle-wind.goal':
    'Bekijk de voorspelde wind bij het begin van de tocht op de dag dat je gaat peddelen.',
  'help.guide.tour-paddle-wind.tip.4':
    'Ontbreekt een voorspelling, dan betekent dat niet dat het veilig is. Controleer de omstandigheden ter plaatse.',
  'help.guide.tour-paddle-checklist.step.5':
    "Klik onderaan de kolom op ‘Peddelen heeft risico's’ om ‘Veiligheid op het water’ te lezen voordat je vertrekt.",
  'help.guide.tour-paddle-track-marks.goal':
    'Importeer een peddeltrack van je horloge en geef aan waar je de boot hebt gedragen en waar je door een sluis bent gegaan.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Klik precies op de track: een klik te ver van de lijn wordt geweigerd, en dat staat dan op de kaart.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Elk traject is een badge in de kaart Waypoints, met de naam van de route, een stip voor de toegang en de lengte. Bij een stuk dat niet over een ruiterroute loopt, staat ‘Handmatig, niet gecontroleerd’.',
  'help.guide.tour-horse-plan.step.4':
    'Klik op een route in de lijst. Die opent op een eigen kaart, met de trajecten genummerd.',
  'help.guide.tour-horse-plan.tip.4':
    'Met ‘Routepuntbewerking ongedaan maken’ bovenaan de linkerkolom draai je een heel traject in één stap terug.',
  'help.guide.tour-horse-gap.result':
    'De rit heeft geen onderbreking meer, en het overbrugde stuk is gemarkeerd als met de hand getekend.',
  'help.guide.tour-horse-recorded.step.3': 'Klik op ‘1 tocht importeren’.',
  'help.guide.dissolve-fusion.step.3': 'Bevestig met Opheffen in het venster dat verschijnt.',
};

export default help;
