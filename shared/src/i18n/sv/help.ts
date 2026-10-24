import type { TranslationStrings } from '../types';

// English fallback until 'sv' is translated.
const help: TranslationStrings = {
  'help.title': 'Hjälp och dokumentation',
  'help.search': 'Sök i dokumentationen…',
  'help.contents': 'Innehåll',
  'help.noResults': 'Inga matchande sidor.',
  'help.errorTitle': 'Sidan kunde inte laddas',
  'help.errorBody': 'Hjälpinnehållet hämtas från TREK-wikin. Kontrollera anslutningen och försök igen.',

  // center
  'help.center.button': 'Hjälp för den här vyn',
  'help.center.title': 'Hjälp',
  'help.center.onThisScreen': 'På den här skärmen',
  'help.center.screens': 'Skärmar',
  'help.center.thisScreen': 'Aktuell',
  'help.center.subScreens': '{count} undervyer',
  'help.center.subScreens.one': '{count} undervy',
  'help.center.subScreensLabel': 'Undervyer',
  'help.center.guidesCount': '{count} guider',
  'help.center.guidesCount.one': '{count} guide', // same-as-en
  'help.center.goToScreen': 'Gå till {screen}',
  'help.center.overview': 'Översikt',
  'help.center.howTo': 'Hur gör jag för att…',
  'help.center.searchPlaceholder': 'Sök i guider och dokumentation…',
  'help.center.searchEmpty': 'Inget hittades för ”{query}”.',
  'help.center.searchGuides': 'Guider',
  'help.center.searchDocs': 'Dokumentation',
  'help.center.searchError': 'Sökningen är inte tillgänglig just nu.',
  'help.center.back': 'Tillbaka',
  'help.center.close': 'Stäng hjälpen',
  'help.center.steps': '{count} steg',
  'help.center.steps.one': '{count} steg',
  'help.center.step': 'Steg {n}',
  'help.center.stepsLabel': 'Steg',
  'help.center.stepOf': 'Steg {n} av {total}',
  'help.center.screenshot': 'Skärmbild',
  'help.center.result': 'Så blir det',
  'help.center.tips': 'Bra att veta',
  'help.center.related': 'Relaterat',
  'help.center.openDocs': 'Öppna i Hjälp & dokumentation',
  'help.center.docsSection': 'I dokumentationen',
  'help.center.noContext': 'Det finns ingen guide för den här vyn ännu.',
  'help.center.noContextHint': 'Sök i dokumentationen eller berätta vad du letade efter.',
  'help.center.feedback': 'Saknar du något?',
  'help.center.feedbackLink': 'Berätta för oss på GitHub',
  'help.center.discord': 'Fråga på Discord',
  'help.center.quick': 'Snabb',
  'help.center.guide': 'Guide', // same-as-en
  'help.center.tour': 'Genomgång',
  'help.center.imageAlt': 'Steg {n} i ”{title}”',

  // ctx
  'help.ctx.dashboard.title': 'Översikt',
  'help.ctx.dashboard.summary':
    'Översikten visar alla dina resor. Kortet överst, utformat som ett boardingkort, visar resan som pågår eller kommer härnäst. Raden under räknar vad du hittills har rest, och korten listar varje resa du planerar, har arkiverat eller redan har avslutat.',
  'help.ctx.dashboard.bullet.1':
    'Boardingkort: den pågående eller nästa resan med datum, medresenärer, platser och en nedräkning. Klicka på kortet för att öppna resan. Med de fyra knapparna uppe till höger kan du redigera, duplicera, arkivera eller radera den.',
  'help.ctx.dashboard.bullet.2':
    'Resestatistik: besökta länder, resor, dagar på resa och flugen sträcka, för alla dina resor sammanlagt.',
  'help.ctx.dashboard.bullet.3':
    'Reskort, filtrerade efter Planerat, Arkiverad och Slutförd, som rutnät eller lista. Sökrutan ovanför söker bland alla dina resor samtidigt, på titel, datum eller en plats i resan. Knapparna för att redigera, duplicera, arkivera och radera en resa sitter i övre högra hörnet av kortets foto.',
  'help.ctx.dashboard.bullet.4':
    'Widgets till höger: valutaomvandlare, Samlingar (när tillägget Samlingar är på), världsklockor, kommande bokningar och widgets från plugins. De inbyggda kan stängas av under Inställningar, Utseende.',
  'help.ctx.dashboard.bullet.5': 'Kortet ”Ny resa” och knappen längst ned till höger startar båda en ny resa.',

  // create-trip
  'help.guide.create-trip.title': 'Skapa en resa',
  'help.guide.create-trip.goal': 'Starta en ny resa med namn, datum och omslagsbild.',
  'help.guide.create-trip.step.1':
    'Klicka på Ny resa. Kortet sist bland dina resor och knappen nere till höger gör samma sak.',
  'help.guide.create-trip.step.2':
    'Ge resan ett namn. Det är det enda fältet du måste fylla i, allt annat kan du lägga till senare.',
  'help.guide.create-trip.step.3':
    'Välj ett startdatum och ett slutdatum. TREK skapar en dag för varje datum, så att du kan börja planera din resplan. Inga datum än? Lämna båda tomma och ange i stället Antal dagar.',
  'help.guide.create-trip.step.4':
    'Valfritt: lägg till ett omslagsfoto. Ladda upp ett eget, dra eller klistra in ett, eller sök på Unsplash efter destinationen.',
  'help.guide.create-trip.step.5': 'Klicka på ”Skapa ny resa”.',
  'help.guide.create-trip.result':
    'Resan visas i översikten. Om det är din nästa resa visas den i boardingkortet överst.',
  'help.guide.create-trip.tip.1':
    'Datumen kan ändras senare. Om det redan finns bokningar frågar TREK om de ska flyttas med dagarna.',
  'help.guide.create-trip.tip.2': 'Resans valuta är den som alla kostnader räknas om till. Välj valutan på resmålet.',

  // edit-trip
  'help.guide.edit-trip.title': 'Redigera en resa',
  'help.guide.edit-trip.goal': 'Byt namn på en resa, ändra datum eller justera inställningarna.',
  'help.guide.edit-trip.step.1': 'Klicka på pennan uppe till höger på reskortet (eller på boardingkortet).',
  'help.guide.edit-trip.step.2':
    'Ändra det du behöver: namn, beskrivning, datum, omslag, valuta, påminnelse eller resekompisar.',
  'help.guide.edit-trip.step.3': 'Klicka på ”Uppdatera”.',
  'help.guide.edit-trip.result': 'Kortet uppdateras direkt, för alla medlemmar i resan.',
  'help.guide.edit-trip.tip.1':
    'Om du flyttar starten på en resa med bokningar frågar TREK om bokningarna ska flyttas med. Om du kortar en resa listas dagarna som skulle tas bort och vad som är planerat på dem. Ändringen sparas först när du klickar på Ta bort dagar och spara.',

  // cover-image
  'help.guide.cover-image.title': 'Välj ett omslagsfoto',
  'help.guide.cover-image.goal': 'Ge en resa en bild som visas på kortet och på boardingkortet.',
  'help.guide.cover-image.step.1': 'Öppna resans redigeringsformulär med pennan på kortet.',
  'help.guide.cover-image.step.2':
    'Under Omslagsbild släpper eller klistrar du in ett foto, klickar för att ladda upp ett, eller skriver en destination och klickar på Sök på Unsplash.',
  'help.guide.cover-image.step.3': 'Välj ett foto och klicka på ”Uppdatera”.',
  'help.guide.cover-image.result': 'Bilden sparas med resan och visas överallt där resan listas.',
  'help.guide.cover-image.tip.1':
    'Bilder från Unsplash-sökningen får automatiskt en bildkredit. Dina egna uppladdningar stannar på din server.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Duplicera en resa',
  'help.guide.duplicate-trip.goal': 'Återanvänd en resa som mall för en ny.',
  'help.guide.duplicate-trip.step.1': 'Klicka på duplicera-ikonen i övre högra hörnet av kortet.',
  'help.guide.duplicate-trip.step.2':
    'Läs vad som kopieras och vad som inte kopieras och klicka sedan på Kopiera resan.',
  'help.guide.duplicate-trip.result':
    'En kopia visas på din översikt. Den heter som originalet följt av (kopia). Du kan döpa om den och ändra datumen.',
  'help.guide.duplicate-trip.tip.1':
    'Dagar, platser, turer och roadtrip-rutter, bokningar, budgetposter, packlistor, att göra-listor och dagsanteckningar kopieras. Packlistor och att göra-listor kopieras obockade. Medlemmar, chatt, omröstningar, filer och delningslänkar kopieras inte.',

  // archive-trip
  'help.guide.archive-trip.title': 'Arkivera och återställ en resa',
  'help.guide.archive-trip.goal': 'Flytta en resa ur resolistan utan att radera den, och återställ den senare.',
  'help.guide.archive-trip.step.1': 'Klicka på arkivikonen uppe till höger på kortet.',
  'help.guide.archive-trip.step.2': 'Ställ in filtret ovanför korten på ”Arkiverad” för att se resan igen.',
  'help.guide.archive-trip.step.3':
    'Klicka på Återställ på kortet för att flytta tillbaka resan till Planerat, eller till Slutförd om datumen har passerat.',
  'help.guide.archive-trip.result':
    'Arkiverade resor behåller alla sina data. De visas inte längre i översikten eller i kalenderflödet för alla resor.',

  // delete-trip
  'help.guide.delete-trip.title': 'Ta bort en resa',
  'help.guide.delete-trip.goal': 'Ta bort en resa för gott.',
  'help.guide.delete-trip.step.1': 'Klicka på papperskorgen i övre högra hörnet av kortet.',
  'help.guide.delete-trip.step.2':
    'Bekräfta med Radera. Dialogen nämner resans namn, så att du vet att det är rätt resa.',
  'help.guide.delete-trip.result':
    'Resan med dagar, platser, bokningar och filer raderas. Det går inte att ångra, så arkivera resan i stället om du är osäker.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Hitta slutförda resor, växla mellan rutnät och lista',
  'help.guide.filter-and-view.goal': 'Se avslutade eller arkiverade resor och välj den layout du gillar.',
  'help.guide.filter-and-view.step.1':
    'Använd ”Planerad”, ”Arkiverad” och ”Slutförd” ovanför korten. Slutförd är alla resor vars slutdatum har passerat.',
  'help.guide.filter-and-view.step.2':
    'Klicka på listikonen för att växla till en kompakt lista. Klicka på den igen för att få tillbaka rutnätet.',
  'help.guide.filter-and-view.result': 'Översikten kommer ihåg din layout på den här enheten.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Prenumerera på alla resor i din kalender',
  'help.guide.calendar-feed.goal':
    'Se dagar och bokningar för varje aktiv resa i din kalenderapp, alltid synkroniserade.',
  'help.guide.calendar-feed.step.1': 'Klicka på kalenderikonen bredvid vyomkopplaren.',
  'help.guide.calendar-feed.step.2': 'Klicka på Aktivera kalenderprenumeration. TREK skapar en privat flödeslänk.',
  'help.guide.calendar-feed.step.3':
    'Klicka på Lägg till i Google Kalender eller Lägg till i Apple Kalender / Outlook. För någon annan kalenderapp öppnar du Eller kopiera en länk manuellt och kopierar länken därifrån.',
  'help.guide.calendar-feed.result':
    'Varje aktiv resa visas i din kalender och uppdateras automatiskt. Arkiverade resor och resor som avslutades för mer än 90 dagar sedan ingår inte.',
  'help.guide.calendar-feed.tip.1':
    'Håll länken hemlig: alla som har den kan läsa flödet. Om andra har fått tag på den ger Skapa ny dig en ny länk, och den gamla slutar fungera. Stäng av tar bort länken helt.',

  // widgets
  'help.guide.widgets.title': 'Välj widgetar för översikten',
  'help.guide.widgets.goal': 'Visa eller dölj statistikraden och widgetarna till höger.',
  'help.guide.widgets.step.1': 'Öppna avatarmenyn uppe till höger och välj Inställningar.',
  'help.guide.widgets.step.2': 'Gå till fliken ”Utseende”.',
  'help.guide.widgets.step.3':
    'Under Dashboard-widgets slår du på eller av varje widget, separat för Skrivbord och Mobil. Högra sidofältet stänger av hela högerkolumnen på en gång.',
  'help.guide.widgets.step.4': 'Gå tillbaka till översikten. Ändringen gäller direkt.',
  'help.guide.widgets.result':
    'När du döljer widgetar får dina resor mer plats. Stäng av hela högerkolumnen om du vill centrera layouten.',
  'help.guide.widgets.link': 'Öppna utseendeinställningarna',

  // currency-widget
  'help.guide.currency-widget.title': 'Räkna om valutor',
  'help.guide.currency-widget.goal': 'Räkna om ett belopp mellan två valutor med aktuella kurser.',
  'help.guide.currency-widget.step.1': 'Skriv in beloppet och välj de två valutorna.',
  'help.guide.currency-widget.step.2':
    'Pilen mellan dem byter plats på valutaparet, den runda pilen hämtar kursen på nytt.',
  'help.guide.currency-widget.result': 'Ditt valutapar sparas på ditt konto, så det är detsamma på alla enheter.',
  'help.guide.currency-widget.tip.1':
    'Kurserna kommer från den kostnadsfria tjänsten Frankfurter. Den cirkulära pilen i hörnet av widgeten hämtar de senaste kurserna.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Lägg till världsklockor',
  'help.guide.timezones-widget.goal': 'Se den lokala tiden på dina resmål.',
  'help.guide.timezones-widget.step.1':
    'Klicka på + i widgeten Tidszoner, sök efter en stad, till exempel Lissabon, och välj den i listan.',
  'help.guide.timezones-widget.step.2':
    'Om du vill ta bort en klocka håller du pekaren över den och klickar på × som visas till höger.',
  'help.guide.timezones-widget.result': 'Dina klockor sparas på ditt konto.',
  'help.guide.search-trips.title': 'Sök bland dina resor',
  'help.guide.search-trips.goal':
    'Hitta en resa via dess namn, ett datum eller en plats som du har planerat i den, även arkiverade resor.',
  'help.guide.search-trips.step.1':
    'Skriv i ”Sök resor eller platser” ovanför korten. Listan filtreras medan du skriver, bland planerade, arkiverade och slutförda resor på en gång.',
  'help.guide.search-trips.step.2':
    'Om en resa matchar på grund av en av sina platser visas den platsen under resans titel. Klicka på x i rutan, eller tryck på Escape, för att se alla dina resor igen.',
  'help.guide.search-trips.result':
    'Översikten visar bara de resor som matchar. Töm sökrutan för att visa alla resor igen.',
  'help.guide.search-trips.tip.1':
    'Du kan också söka på datum: skriv en månad och ett år, till exempel maj 2027, eller 2027-05, för att hitta resorna den månaden.',
  'help.guide.search-trips.tip.2':
    'Medan en sökning är aktiv gäller inte växlingen mellan ”Planerad”, ”Arkiverad” och ”Slutförd”, så att inget fel filter döljer en resa.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay är din personliga ledighetsplanerare: hur många semesterdagar du har under ett år, vilka du har loggat och hur många som är kvar. Rutnätet visar hela året. Sidofältet innehåller årsväljaren, personerna du planerar med, kalendrar som delats med dig, teckenförklaringen och din Rättighet.',
  'help.ctx.vacay.bullet.1':
    'Årsrutnät: tolv månadskort med en ruta per dag. Klicka på en dag för att lägga in eller ta bort den. En liten blå prick visar dagar som en resa redan täcker.',
  'help.ctx.vacay.bullet.2':
    'Verktygsfältet längst ned: den första knappen, med ditt namn och din färg, loggar semester. Företagshelg markerar dagar då hela företaget är ledigt. Halvdag och Komp / Flex ändrar vad ett klick loggar, och Halvdag fungerar även för företagshelger.',
  'help.ctx.vacay.bullet.3':
    'Rättighet: Dagar, Använt och Kvar för det valda året, med överförda dagar och komp- eller flexdagar bredvid. Klicka på kortets rubrik för att fälla ihop det.',
  'help.ctx.vacay.bullet.4':
    'Personer är de som delar din plan, var och en i sin egen färg. Delade kalendrar visar andras lediga dagar som färgade ringar. Du kan inte redigera dem.',
  'help.ctx.vacay.bullet.5':
    'Inställningar gäller helger, veckostart, överföring av dagar, ditt ledighetsår, företagshelger, kalendrar för allmänna helgdagar och skollov, samt Upplös Sammanslagning när du planerar tillsammans med någon.',
  // log-day
  'help.guide.log-day.title': 'Lägg in en semesterdag',
  'help.guide.log-day.goal': 'Markera en ledig dag i årsrutnätet och se hur saldot uppdateras.',
  'help.guide.log-day.step.1':
    'Titta på den första knappen i verktygsfältet längst ned. När den visar ditt namn och din färg loggar ett klick på en dag en semesterdag åt dig.',
  'help.guide.log-day.step.2':
    'Klicka på en dag i valfritt månadskort. Dagen fylls med din färg och ”Använt” ökar med en dag.',
  'help.guide.log-day.step.3': 'Klicka på samma dag igen för att ta bort markeringen.',
  'help.guide.log-day.result':
    'Dagen är loggad. Dagar, Använt och Kvar uppdateras direkt, och alla som är sammanslagna med din plan ser ändringen på en gång.',
  'help.guide.log-day.tip.1':
    'Helger kan inte loggas när Blockera Helger är på i Inställningar. En lördag eller söndag som loggats tidigare kan fortfarande rensas.',
  'help.guide.log-day.tip.2':
    'En blå prick i en ruta betyder att en av dina resor täcker den dagen, så du ser var ledighet och resor överlappar.',
  // half-day
  'help.guide.half-day.title': 'Lägg in en halvdag',
  'help.guide.half-day.goal': 'Ta ledigt en eftermiddag och använd bara en halv dag av din semesterrätt.',
  'help.guide.half-day.step.1':
    'Slå på Halvdag i verktygsfältet. Den orangea pricken är markören för en halvdag i rutnätet.',
  'help.guide.half-day.step.2': 'Klicka på en dag. Den loggas som 0,5 och får en orange prick i hörnet.',
  'help.guide.half-day.step.3':
    'Slå av ”Halvdag” igen när du är klar. Om du klickar på en halvdag med andra inställningar ändras den till de aktuella inställningarna.',
  'help.guide.half-day.result':
    'Använt ökar med 0,5. Halvdag och Komp / Flex är oberoende av varandra, så du kan också logga en halv kompdag.',
  'help.guide.half-day.tip.1':
    'Verktygsfältet visar alltid vilken markering nästa klick sätter, så du kan kontrollera den innan du lägger in dagen.',
  // comp-day
  'help.guide.comp-day.title': 'Lägg in kompledigt eller flextid',
  'help.guide.comp-day.goal': 'Ta ut kompledigt utan att använda semesterdagar.',
  'help.guide.comp-day.step.1':
    'Slå på Komp / Flex i verktygsfältet. Den streckade skivan är markören för en kompdag i rutnätet.',
  'help.guide.comp-day.step.2':
    'Klicka på en dag. Den fylls med diagonala streck i din färg i stället för en enfärgad yta.',
  'help.guide.comp-day.result': 'Kompdagar räknas bredvid saldorutorna och minskar aldrig ”Kvar”.',
  'help.guide.comp-day.tip.1':
    'Använd den för övertid som du tar ut som ledighet, flextid eller en ersättningsdag: all ledighet som inte är semester.',
  // entitlement
  'help.guide.entitlement.title': 'Ange din semesterrätt',
  'help.guide.entitlement.goal': 'Tala om för Vacay hur många semesterdagar du har under året.',
  'help.guide.entitlement.step.1':
    'Klicka på rutan Dagar på din rad i kortet Rättighet i sidofältet. Är kortet hopfällt klickar du på rubriken för att fälla ut det.',
  'help.guide.entitlement.step.2':
    'Skriv ditt antal dagar och tryck på Enter. Med Escape behåller du det gamla värdet.',
  'help.guide.entitlement.result':
    'Kvar räknas om utifrån din semesterrätt, eventuell överföring och de dagar du har använt.',
  'help.guide.entitlement.tip.1': 'Varje år har sin egen semesterrätt, så en ändring här gäller bara det valda året.',
  // years
  'help.guide.years.title': 'Lägg till och byt år',
  'help.guide.years.goal': 'Planera nästa år redan nu, eller titta på förra året.',
  'help.guide.years.step.1':
    'Klicka på + till höger om årtalet för att lägga till nästa år, eller på + till vänster för föregående år.',
  'help.guide.years.step.2': 'Byt år med pilarna eller årsknapparna under.',
  'help.guide.years.step.3':
    'Om du vill ta bort ett år håller du muspekaren över årsknappen och klickar på det lilla minustecknet. Då raderas även alla poster för året, så bekräfta noga.',
  'help.guide.years.result':
    'Varje år har sin egen semesterrätt och sina egna poster. Överföringen kopplar ihop ett år med nästa.',
  // company-holidays
  'help.guide.company-holidays.title': 'Markera företagets lediga dagar',
  'help.guide.company-holidays.goal':
    'Blockera dagar då hela företaget är ledigt, utan att det går åt av någons semesterdagar.',
  'help.guide.company-holidays.step.1':
    'Öppna Inställningar och kontrollera att ”Företagshelger” är påslaget. Det är det som standard. Verktygsfältet visar läget bara medan det är påslaget.',
  'help.guide.company-holidays.step.2': 'Tillbaka i rutnätet växlar du verktygsfältet till Företagshelg.',
  'help.guide.company-holidays.step.3':
    'Klicka på dagarna. De blir gula och visas i teckenförklaringen. Klicka på en dag igen för att rensa den.',
  'help.guide.company-holidays.result':
    'Alla som är sammanslagna med planen ser företagshelgdagarna, och de minskar aldrig Kvar.',
  'help.guide.company-holidays.tip.1':
    'Alla sammanslagna personer kan redigera företagets lediga dagar, så bestäm tillsammans vem som sköter dem.',
  // public-holidays
  'help.guide.public-holidays.title': 'Visa helgdagar',
  'help.guide.public-holidays.goal': 'Lägg in helgdagarna i ditt land eller din region i rutnätet.',
  'help.guide.public-holidays.step.1': 'Öppna Inställningar och slå på Allmänna helgdagar.',
  'help.guide.public-holidays.step.2':
    'Klicka på Lägg till kalender och välj land och, om det behövs, region. Du kan också ge kalendern en färg och en etikett. Klicka sedan på Lägg till.',
  'help.guide.public-holidays.step.3': 'Stäng Inställningar. Helgdagarna visas i rutnätet och i teckenförklaringen.',
  'help.guide.public-holidays.result':
    'Helgdagar markeras i kalenderns färg och räknas aldrig av från dina semesterdagar.',
  'help.guide.public-holidays.tip.1':
    'Du kan lägga till flera kalendrar, till exempel din egen region och en sammanslagen kollegas.',
  // school-holidays
  'help.guide.school-holidays.title': 'Visa skollov',
  'help.guide.school-holidays.goal': 'Se skolloven i din region tillsammans med dina egna lediga dagar.',
  'help.guide.school-holidays.step.1': 'Öppna Inställningar och slå på School Holidays.',
  'help.guide.school-holidays.step.2':
    'Klicka på ”Lägg till kalender” och välj land. Om landet har olika kalendrar för olika delar väljer du även region eller grupp. Klicka sedan på ”Lägg till”.',
  'help.guide.school-holidays.step.3':
    'Stäng Inställningar. Skollov tonas i kalenderns färg och får ett färgat band längs nederkanten av sina dagar.',
  'help.guide.school-holidays.result': 'Skollov visas bara i kalendern. De minskar aldrig någons semesterrätt.',
  'help.guide.school-holidays.tip.1':
    'Saknas din region? Din administratör kan lägga in skollov för hand under Admin, Anpassning, Skollov.',
  // weekends
  'help.guide.weekends.title': 'Blockera helger och ange veckans första dag',
  'help.guide.weekends.goal': 'Räkna inte med helgerna och låt veckan börja på den dag du föredrar.',
  'help.guide.weekends.step.1': 'Öppna Inställningar.',
  'help.guide.weekends.step.2':
    'Slå på Blockera Helger och välj sedan under Helgdagar vilka dagar som räknas som din helg.',
  'help.guide.weekends.step.3': 'Välj Mån eller Sön under Vecka börjar på.',
  'help.guide.weekends.result': 'Blockerade dagar är gråa i rutnätet och går inte att lägga in av misstag.',
  // leave-year
  'help.guide.leave-year.title': 'Ange ditt ledighetsår',
  'help.guide.leave-year.goal':
    'Räkna din semesterrätt över ett räkenskapsår eller från anställningsdatumet i stället för januari till december.',
  'help.guide.leave-year.step.1': 'Öppna Inställningar och leta upp Semesterår.',
  'help.guide.leave-year.step.2':
    'Välj ”Kalender”, ”Räkenskapsår” (med månad och dag då det börjar) eller ”Anställningsdatum” (med datumet då du anställdes).',
  'help.guide.leave-year.result':
    'Rättighet, använda dagar och överföring räknas för den perioden, och rutnätet börjar med dess första månad.',
  'help.guide.leave-year.tip.1':
    'Den här inställningen är personlig: i en sammanslagen plan har var och en sitt eget ledighetsår och sina egna siffror.',
  // carry-over
  'help.guide.carry-over.title': 'För över outnyttjade dagar',
  'help.guide.carry-over.goal': 'För över det som är kvar i slutet av en period till nästa.',
  'help.guide.carry-over.step.1': 'Öppna Inställningar.',
  'help.guide.carry-over.step.2': 'Slå på Överföring.',
  'help.guide.carry-over.result': 'Det överförda antalet räknas om över alla dina år och visas under dagsaldot.',
  'help.guide.carry-over.tip.1': 'Om du slår av det nollställs alla överförda saldon.',
  // invite
  'help.guide.invite.title': 'Planera tillsammans med någon',
  'help.guide.invite.goal':
    'Slå ihop din plan med en annan TREK-användares plan så att ni båda ser era lediga dagar i samma rutnät.',
  'help.guide.invite.step.1': 'Klicka på personikonen i kortet Personer.',
  'help.guide.invite.step.2': 'Välj användaren och klicka på Skicka inbjudan.',
  'help.guide.invite.step.3':
    'De får ett meddelande och en Sammanslagning Begäran nästa gång de öppnar Vacay. Tills dess visas inbjudan som väntande. Håll pekaren över den för att avbryta.',
  'help.guide.invite.result':
    'Båda planerna slås ihop: varje person har en färg, ni kan lägga in dagar åt varandra, och allt synkroniseras i realtid.',
  'help.guide.invite.tip.1':
    'Vill du ångra en sammanslagning klickar du på Upplös i Inställningar. Allas poster flyttas tillbaka till sin egen plan.',
  'help.guide.invite.tip.2':
    'Om den andra personen bara ska se dina dagar delar du din kalender i stället för att slå ihop planerna.',
  // share-calendar
  'help.guide.share-calendar.title': 'Dela din kalender skrivskyddat',
  'help.guide.share-calendar.goal': 'Låt någon se när du är ledig utan att personen kan ändra din plan.',
  'help.guide.share-calendar.step.1': 'Klicka på delningsikonen i kortet Delade kalendrar.',
  'help.guide.share-calendar.step.2': 'Välj användaren och klicka på Dela. Mottagaren behöver inte godkänna något.',
  'help.guide.share-calendar.step.3':
    'Kalendrar som delats med dig visas överst i kortet: klicka på en för att dölja eller visa den, eller håll pekaren över den och klicka på x för att ta bort den. Under Du delar med håller du pekaren över ett namn och klickar på Sluta dela.',
  'help.guide.share-calendar.result':
    'Dina lediga dagar visas som en färgad ring i den andras rutnät. De kan inte redigera något du delar.',
  'help.guide.share-calendar.tip.1':
    'Delning och sammanslagning är oberoende av varandra: du kan vara sammanslagen med en person och dela med andra.',
  'help.guide.share-calendar.tip.2':
    'Håll muspekaren över en dag med en ring för att se vem som är ledig och hur länge.',

  // ── Screen: atlas ─────────────────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas visar var du har rest på en världskarta. Varje land som en resa har tagit dig till färgläggs, och länder du besökte innan du använde TREK kan du lägga till för hand. Zooma in för att se regioner, för en bucketlista över platser du fortfarande vill se och läs dina siffror i glaspanelen längst ner.',
  'help.ctx.atlas.bullet.1':
    'Kartan: varje besökt land har sin egen fasta färg, planerade länder har streckad kontur, länder på bucketlistan har diagonala streck och alla andra länder är grå. Håll pekaren över ett land för att se dess resor, platser samt första och sista besök.',
  'help.ctx.atlas.bullet.2':
    'Sök överst: skriv ett land eller en plats. Ett land som du inte har besökt öppnar sin popup. För ett land som du har besökt visas dess kort i panelen. Om du väljer en plats öppnar kartan platsens region så att du kan markera den.',
  'help.ctx.atlas.bullet.3':
    'Visa planerade länder, uppe till höger: visar länderna för dina kommande resor. Reglaget syns bara när du har några.',
  'help.ctx.atlas.bullet.4':
    'Panelen längst ned: fliken Statistik med länder (med de planerade bredvid), regioner, resor, platser, städer, dagar, kontinenter, din svit och årets resor; fliken Bucketlista med platserna du fortfarande vill besöka; med tillägget Turer även fliken Turer med sträcka och stigning för de turer du har gjort.',
  'help.ctx.atlas.bullet.5':
    'Regioner: när du zoomar in nära visar kartan delstater och provinser. Klicka på en för att markera den, avmarkera den eller lägga till den på bucketlistan.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: när tillägget är anslutet markerar en panel till vänster om statistiken önskningar som klara och lägger till länder från dina inspelningar. Det sker först efter att du har bekräftat.',
  // mark-country
  'help.guide.mark-country.title': 'Markera ett land som besökt',
  'help.guide.mark-country.goal':
    'Lägg till ett land som du besökte innan du började använda TREK, så att kartan och din räkning tar med det.',
  'help.guide.mark-country.step.1': 'Skriv landets namn i sökrutan högst upp på kartan.',
  'help.guide.mark-country.step.2': 'Välj det i listan. Kartan flyttas till landet och en popup öppnas för det.',
  'help.guide.mark-country.step.3': 'Välj Markera som besökt.',
  'help.guide.mark-country.result':
    'Landet får en färg på kartan och antalet Länder går upp med ett. Färgen är permanent: när du markerar fler länder ändras inte färgerna på de andra.',
  'help.guide.mark-country.tip.1':
    'Om du klickar på ett grått land på kartan öppnas samma popup. För små länder är sökningen mer tillförlitlig.',
  'help.guide.mark-country.tip.2':
    'Ett land som du markerar för hand räknas alltid som besökt, oavsett datumen för resor dit.',
  // unmark-country
  'help.guide.unmark-country.title': 'Ta bort ett land som du har markerat',
  'help.guide.unmark-country.goal': 'Ta bort ett land som du har markerat för hand från kartan.',
  'help.guide.unmark-country.step.1':
    'Sök efter landet och välj det, eller klicka på det på kartan. För ett land som du har markerat själv frågar popupen om du vill ta bort det.',
  'help.guide.unmark-country.step.2': 'Bekräfta med Ta bort.',
  'help.guide.unmark-country.result': 'Landet blir grått igen och räknas inte längre.',
  'help.guide.unmark-country.tip.1':
    'Bara länder som du har markerat för hand kan tas bort på det här sättet. Ett land med resor eller platser förblir markerat tills de resorna eller platserna tas bort. För ett land som du har markerat för hand finns Ta bort också i dess detaljkort i panelen.',
  // country-details
  'help.guide.country-details.title': 'Se vad du gjorde i ett land',
  'help.guide.country-details.goal': 'Öppna ett besökt land och gå vidare till resorna som tog dig dit.',
  'help.guide.country-details.step.1': 'Skriv ett land du har besökt i sökrutan högst upp på kartan.',
  'help.guide.country-details.step.2':
    'Välj det. Kartan flyttas dit, och panelen längst ned får ett kort med landets flagga, märken för dess platser, resor och besökta regioner, samt ett chip för var och en av de tre första resorna.',
  'help.guide.country-details.result': 'Klicka på en resebricka för att öppna resan i planeraren.',
  'help.guide.country-details.tip.1':
    'Om du håller muspekaren över landet på kartan visas samma siffror plus första och senaste besöket.',
  // planned-countries
  'help.guide.planned-countries.title': 'Visa länderna du ska resa till',
  'help.guide.planned-countries.goal':
    'Visa länderna för dina kommande resor på kartan utan att räkna dem som besökta.',
  'help.guide.planned-countries.step.1':
    'Slå på Visa planerade länder uppe till höger. Siffran bredvid visar hur många planerade länder det finns.',
  'help.guide.planned-countries.step.2':
    'Sök efter ett planerat land och välj det: panelen visar Planerat och kartans verktygstips visar när du ska åka.',
  'help.guide.planned-countries.result':
    'Planerade länder visas med streckad kontur, så att de aldrig ser ut som länder du redan har besökt. Reglaget kommer ihåg ditt val.',
  'help.guide.planned-countries.tip.1':
    'Ett land räknas som besökt när resan dit har startat. En pågående resa räknas också. Resor utan datum ingår inte i statistiken alls.',
  'help.guide.planned-countries.tip.2': 'Reglaget finns bara så länge du har kommande resor.',
  // regions
  'help.guide.regions.title': 'Markera en region',
  'help.guide.regions.goal': 'Markera delstater, provinser eller prefekturer du har besökt, inte bara länder.',
  'help.guide.regions.step.1':
    'Zooma in på ett land tills gränserna för delstater och provinser syns. Om du söker efter landet och väljer det flyttas kartan tillräckligt nära.',
  'help.guide.regions.step.2':
    'Klicka på en region. När du håller muspekaren över en region visas dess namn. Popupen visar regionen och dess land.',
  'help.guide.regions.step.3': 'Välj Markera som besökt.',
  'help.guide.regions.result':
    'Regionen fylls med landets färg. När du markerar en region räknas även landet som besökt, om det inte redan var det.',
  'help.guide.regions.tip.1':
    'När du klickar på en besökt region kan du välja ”Ta bort”, oavsett om du markerade den själv eller om den lades till på grund av en plats.',
  'help.guide.regions.tip.2':
    'Regioner där du har riktiga platser markeras automatiskt. Du behöver inte göra något för dem.',
  // search-place
  'help.guide.search-place.title': 'Hitta en plats och markera dess region',
  'help.guide.search-place.goal':
    'Markera Bayern genom att söka efter München, utan att behöva veta vilken region en stad ligger i.',
  'help.guide.search-place.step.1':
    'Skriv en stad, ett landmärke eller en adress i sökrutan. Länder kommer först, och träffar bland platser visas under Platser nedanför.',
  'help.guide.search-place.step.2': 'Välj platsen. Kartan flyttas dit och hittar regionen som platsen ligger i.',
  'help.guide.search-place.step.3':
    'Välj Markera som besökt för regionen, eller Lägg till på bucketlistan om du inte har varit där än.',
  'help.guide.search-place.result':
    'Regionen markeras, och landet med den. För länder utan regiondata i kartpaketet markeras i stället själva landet.',
  'help.guide.search-place.tip.1':
    'Platserna kommer från samma sökning som överallt annars i TREK, så de använder leverantören som din administratör har ställt in.',
  // bucket-country
  'help.guide.bucket-country.title': 'Sätt ett land på bucketlistan',
  'help.guide.bucket-country.goal': 'Ha en önskelista över länder på kartan, skild från länderna du har besökt.',
  'help.guide.bucket-country.step.1': 'Sök efter landet och välj det, eller klicka på det på kartan.',
  'help.guide.bucket-country.step.2': 'Välj Lägg till på bucketlistan.',
  'help.guide.bucket-country.step.3':
    'Välj månad och år om du redan vet när, och bekräfta sedan med Lägg till på bucketlistan.',
  'help.guide.bucket-country.result':
    'Landet visas med diagonala linjer i den färg det får när du har besökt det, och det finns i fliken Bucketlista i panelen.',
  'help.guide.bucket-country.tip.1': 'I samma popup finns ”Ta bort från bucketlistan” när landet väl står på listan.',
  'help.guide.bucket-country.tip.2':
    'En post per måldatum: samma land kan stå på listan för två olika månader, men inte två gånger för samma månad.',
  // bucket-place
  'help.guide.bucket-place.title': 'Lägg till en plats på bucketlistan',
  'help.guide.bucket-place.goal':
    'Spara en stad, en sevärdhet eller en adress du vill besöka, med koordinater och ett måldatum.',
  'help.guide.bucket-place.step.1': 'Öppna fliken Bucketlista i panelen längst ner.',
  'help.guide.bucket-place.step.2': 'Klicka på Lägg till plats.',
  'help.guide.bucket-place.step.3':
    'Skriv namnet och klicka på sökknappen. Välj träffen så att platsen får koordinater. Du kan också bara skriva ett namn och hoppa över sökningen.',
  'help.guide.bucket-place.step.4': 'Välj månad och år om du vill och klicka på ”Lägg till”.',
  'help.guide.bucket-place.result':
    'Platsen hamnar överst på din bucketlista med sitt måldatum. Håll pekaren över den så visas ×, som tar bort den.',
  'help.guide.bucket-place.tip.1':
    'Dawarich kan bocka av en önskan senare bara om den har koordinater. Det sker när dina inspelningar visar att du har varit där.',
  // stats
  'help.guide.stats.title': 'Läs din statistik',
  'help.guide.stats.goal': 'Läs vad siffrorna i panelen räknar och vad de inte räknar.',
  'help.guide.stats.step.1':
    'Länder är antalet olika länder du faktiskt har varit i. Planerade länder visas under siffran och räknas inte med i den. Regioner räknar delstaterna och provinserna du har varit i. Resor, Platser och Dagar är summor för alla dina resor. Städer räknas ut från adresserna på dina platser, så det är en uppskattning.',
  'help.guide.stats.step.2':
    'Kontinenterna visar besökta länder per kontinent. Antarktis visas i raden först när du har varit där. Sedan kommer din svit (år i följd med minst en resa) och hur många resor du har gjort i år.',
  'help.guide.stats.result':
    'Siffrorna uppdateras automatiskt medan du planerar dina resor. Du behöver inte underhålla något här.',
  'help.guide.stats.tip.1':
    'Städer läses från adresstexten och slås inte upp. En kort adress som ”Osteria Francescana, Italy”, eller en som slutar med en prefektur, kan därför räknas som en region i stället för en stad.',
  'help.guide.stats.tip.2':
    'Länder som du har markerat för hand räknas med i ”Länder” och i kontinenterna, men lägger inte till några resor, platser eller dagar.',
  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Lägg till länder från dina inspelningar',
  'help.guide.dawarich-countries.goal':
    'Låt Dawarich visa vilka länder du har varit i under det senaste året och lägg de du bekräftar på kartan.',
  'help.guide.dawarich-countries.step.1':
    'När tillägget Dawarich är anslutet visas en Dawarich-panel med två rutor längst ner på kartan, till vänster om statistiken. Klicka på Länder.',
  'help.guide.dawarich-countries.step.2':
    'Dialogrutan öppnas på fliken Länder. Klicka på Leta efter länder: TREK läser de länder och städer som dina inspelningar täcker under de senaste 12 månaderna, en månad i taget, så det kan ta en stund. Varje land som din Atlas inte har ännu listas med sin flagga, antalet städer och namnet på den första staden. Varje land är förbockat från början. Klicka på en rad för att utesluta landet.',
  'help.guide.dawarich-countries.step.3':
    'Bekräfta med knappen nere till höger, som lyder Lägg till 5 länder när fem rader är ibockade. Dialogrutan visar hur många som lades till. När du stänger den är kartan redan uppdaterad.',
  'help.guide.dawarich-countries.result':
    'De bekräftade länderna färgas på kartan och räknas i Länder, noterade som hämtade från Dawarich. Länderna som du har markerat för hand ändras inte.',
  'help.guide.dawarich-countries.tip.1':
    'Länder som Atlas redan visar som besökta, antingen för hand, från en resa eller från en tidigare kontroll, hoppas över, så att dina egna markeringar aldrig ändras. Ett land som du tidigare tog bort från Atlas läggs till igen när du bekräftar det här.',
  'help.guide.dawarich-countries.tip.2':
    'Om TREK inte kan matcha ett landsnamn listas namnet under raderna i stället för att försvinna. ”Kontrollera igen” frågar Dawarich en gång till. Noteringen under listan säger att de senaste 12 månaderna har kontrollerats. Den perioden går inte att ändra.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Bocka av önskemål utifrån dina inspelningar',
  'help.guide.dawarich-wishes.goal':
    'Ta reda på vilka platser på din önskelista du faktiskt har nått, och markera dem som besökta med datumet du kom dit.',
  'help.guide.dawarich-wishes.step.1':
    'Klicka på Önskelista i Dawarich-panelen längst ner på kartan, till vänster om statistiken.',
  'help.guide.dawarich-wishes.step.2':
    'Dialogrutan öppnas på fliken Önskelista. Klicka på Stäm av önskelistan: TREK går igenom dina inspelningar efter varje post som har koordinater. En önskning som du har nått listas med hur nära du kom, hur länge du stannade och vilken dag, och är förbockad från början. En som du redan har bockat av har texten Redan avbockad. Under listan räknar en notering posterna utan koordinater och visar också regeln: En önskning räknas som uppfylld inom 250 m och efter 20 minuter på platsen.',
  'help.guide.dawarich-wishes.step.3':
    'Bekräfta med knappen nere till höger, som lyder Bocka av 2 när två rader är ibockade. Stäng sedan dialogrutan och öppna fliken Bucketlista i panelen bredvid.',
  'help.guide.dawarich-wishes.result':
    'Varje önskan får en grön bock med datumet för vistelsen, inte dagens datum. Verktygstipset lyder ”Avbockad utifrån dina Dawarich-inspelningar”. Klicka på datumet för att ångra.',
  'help.guide.dawarich-wishes.tip.1':
    'Att köra förbi räknas inte: du måste vara nära platsen och stanna där en stund. Om flera vistelser uppfyller kravet används den längsta. En önskan utan koordinater kan inte kontrolleras, så lägg till platser via sökningen i ”Lägg till plats”, inte bara med namn.',
  'help.guide.dawarich-wishes.tip.2':
    'En kontroll tittar på upp till 50 poster, och börjar med dem som inte är avbockade ännu. Om det finns fler meddelar TREK det. Ett önskemål som redan var avbockat behåller sitt eget datum.',

  // ── Screen: collections ───────────────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Samlingar',
  'help.ctx.collections.summary':
    'Samlingar är ditt bibliotek utanför alla resor: namngivna listor med platser som du hittat och vill spara, där varje plats har statusen Idé, Vill besöka eller Besökt, och, när Turer är på, hela turer som du sparat från en resa. Platser och turer kopieras in i och ut ur resor, de länkas aldrig, så en lista och en resa påverkar aldrig varandra.',
  'help.ctx.collections.bullet.1':
    'Listkolumnen till vänster visar dina egna listor, listor som delas med dig, inbjudningar som du inte har svarat på ännu och Alla sparade, som samlar allt i listorna du äger. Ny lista och filimporten finns överst.',
  'help.ctx.collections.bullet.2':
    'Huvudet på den öppna listan visar färg, omslag, beskrivning och länkar, medlemmarna samt Redigera (bara för ägaren), Exportera och Dela till höger. På en lista som har delats med dig står det Delad på knappen Dela.',
  'help.ctx.collections.bullet.3':
    'Filterraden ovanför platserna: + för att lägga till en plats, rullgardinerna Status, Kategori, Betyg och Sortera, kryssrutsikonen för Välj och molnikonen för Importera från en resa. Etikettfiltret visas i den här raden bara när ingen karta syns.',
  'help.ctx.collections.bullet.4':
    'Platsrader: foto, namn och adress, etiketter och kategori, och statuspillret till höger. Ett klick på pillret byter till nästa status.',
  'help.ctx.collections.bullet.5':
    'Kartan till höger: en nål för varje plats med koordinater. Det övre fältet har Förstora karta (Visa lista när kartan är förstorad), etikettfiltret med knappen för att hantera etiketter och rutan Sök platser. Klicka på en nål för att öppna platsen.',
  'help.ctx.collections.bullet.6':
    'Detaljvy: klicka på en rad för omslag, kategori, status, stjärnbetyg, etiketter, beskrivning och länkar. Kameran på omslaget byter foto. Längst ned finns Redigera, Kopiera till resa, navigeringsknappen och Ta bort från lista.',
  // create-list
  'help.guide.create-list.title': 'Skapa en lista',
  'help.guide.create-list.goal': 'Skapa en ny, namngiven lista med färg och omslag, redo för platser.',
  'help.guide.create-list.step.1': 'Klicka på ”Ny lista” högst upp i listpanelen.',
  'help.guide.create-list.step.2':
    'Ge listan ett namn och välj en färg. Omslagsbild, beskrivning och länkar är valfria. Du kan lägga till dem senare med ”Redigera”.',
  'help.guide.create-list.step.3': 'Klicka på Skapa.',
  'help.guide.create-list.result':
    'Listan öppnas tom, med Lägg till en plats och Importera från en resa som de två sätten att fylla den.',
  'help.guide.create-list.tip.1':
    'Omslaget kan vara en egen uppladdad bild eller en bild du hittar med Unsplash-sökningen i samma dialogruta.',
  // add-place
  'help.guide.add-place.title': 'Lägg till en plats',
  'help.guide.add-place.goal':
    'Hitta en plats och spara den i den öppna listan med namn, kategori, status och anteckningar i ett enda steg.',
  'help.guide.add-place.step.1':
    'Klicka på + i början av filterraden ovanför platserna. På en lista som fortfarande är tom klickar du på Lägg till en plats mitt på sidan.',
  'help.guide.add-place.step.2':
    'Skriv platsen i sökfältet och välj ett resultat. Namn, adress och koordinater fylls i från resultatet.',
  'help.guide.add-place.step.3':
    'Ange status och, om du vill, en kategori, en beskrivning och länkar, och klicka sedan på ”Lägg till”. Dialogen förblir öppen för nästa plats. ”Avbryt” stänger den.',
  'help.guide.add-place.result': 'Platsen visas i listan och, om den har koordinater, som en nål på kartan.',
  'help.guide.add-place.tip.1':
    'Inifrån en resa lägger Spara i samling i platsinspektören eller i en plats meny en plats från resan i en lista utan att du lämnar resan.',
  'help.guide.add-place.tip.2':
    'Listan måste vara din egen eller en där du är redigerare eller admin. + finns inte under Alla sparade eller på en lista som du bara får titta på.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Importera platser från en resa',
  'help.guide.import-from-trip.goal':
    'Hämta alla platser från en resa till en lista på en gång i stället för att spara dem en och en.',
  'help.guide.import-from-trip.step.1':
    'Klicka på importknappen med molnpilen i filterraden. På en tom lista finns samma knapp bredvid Lägg till en plats.',
  'help.guide.import-from-trip.step.2': 'Välj en av dina resor.',
  'help.guide.import-from-trip.step.3':
    'Markera de platser du vill ha. Platser som redan finns i listan är gråade. Platser som inte ligger på någon dag i resan är förvalda från början. Om alla platser redan ligger på en dag är alla nya platser förvalda. ”Bara nya” döljer platserna som listan redan har.',
  'help.guide.import-from-trip.step.4':
    'Klicka på ”Importera”. Knappen visar alltid hur många platser som kommer att läggas till.',
  'help.guide.import-from-trip.result':
    'Platserna kopieras till listan med namn, adress, koordinater, beskrivning och kategori. Resan ändras inte.',
  'help.guide.import-from-trip.tip.1':
    'TREK hoppar automatiskt över dubbletter med samma namn eller koordinater, så det är ofarligt att importera två gånger.',
  'help.guide.import-from-trip.tip.2':
    'I en resas platslista finns i stället Spara i samling i markeringsläget, för en handplockad uppsättning platser.',
  // place-status
  'help.guide.place-status.title': 'Ange en plats status',
  'help.guide.place-status.goal': 'Håll koll på vad som är en idé, vad som står på kortlistan och var du har varit.',
  'help.guide.place-status.step.1': 'Klicka på statusbrickan längst till höger på en platsrad. Idé blir Vill besöka.',
  'help.guide.place-status.step.2': 'Klicka igen för ”Besökt” och en gång till för att gå tillbaka till ”Idé”.',
  'help.guide.place-status.result':
    'Etiketten och dess färg ändras direkt, och antalen i statusfiltret ovanför listan uppdateras.',
  'help.guide.place-status.tip.1':
    'Status finns bara i ”Collections”. När du kopierar en plats till en resa kopieras inte statusen.',
  'help.guide.place-status.tip.2':
    'Från en resa öppnar Spara i samling dialogen Spara i lista med ett statuspiller för varje lista som platsen ligger i, och urvalsfältet i platspanelen har Markera som besökt i dina listor.',
  // place-detail
  'help.guide.place-detail.title': 'Öppna en sparad plats',
  'help.guide.place-detail.goal':
    'Se allt om en plats och vad du kan göra med den: redigera, kopiera till en resa, hitta dit, ta bort.',
  'help.guide.place-detail.step.1':
    'Klicka på en platsrad. Detaljpanelen öppnas bredvid listan och kartan flyttas till platsen.',
  'help.guide.place-detail.step.2':
    'Längst ned finns Redigera, Kopiera till resa, navigeringsknappen som öppnar platsen i en kartapp och Ta bort från lista. Kameran på omslaget ersätter det automatiska fotot med ett eget.',
  'help.guide.place-detail.result':
    'Med Redigera kan du ändra namn, kategori, etiketter, adress, koordinater, beskrivning och länkar direkt i panelen.',
  'help.guide.place-detail.tip.1':
    'Omslagsbilden hämtas automatiskt när platsen inte har någon egen bild. Din egen uppladdning kan vara JPG, PNG, GIF, WebP eller HEIC på upp till 20 MB. Papperskorgen bredvid kameran återställer det automatiska fotot.',
  'help.guide.place-detail.tip.2':
    'Alla medlemmar, du själv inräknad, kan sätta ett stjärnbetyg under statusen. Filtret Betyg i filterraden använder medelvärdet.',
  // labels
  'help.guide.labels.title': 'Gruppera platser med etiketter',
  'help.guide.labels.goal':
    'Ge en lista egna etiketter, till exempel stadsdelar eller dagar, utöver de gemensamma kategorierna.',
  'help.guide.labels.step.1':
    'Klicka på Lägg till etikett bredvid etiketterna ovanför kartan (Hantera etiketter när listan har några). När ingen karta visas finns knappen i slutet av filterraden.',
  'help.guide.labels.step.2':
    'Skriv ett namn, välj en färg och klicka på ”Lägg till etikett”. Du kan byta namn på, byta färg på eller ta bort befintliga etiketter i samma dialog.',
  'help.guide.labels.step.3':
    'Slå på Välj, markera platserna och klicka på ”Tilldela etikett” i markeringsfältet. Välj sedan etiketterna och bekräfta med ”Tilldela etikett”. En enskild plats kan du också ge etiketter via Redigera i dess detaljvy.',
  'help.guide.labels.step.4':
    'Klicka på en eller flera etiketter ovanför kartan så visas bara platser med någon av dem, i listan och på kartan. Klicka på en etikett igen för att ta bort den ur filtret.',
  'help.guide.labels.result':
    'Platser med etiketter visar dem på raden. Etikettfiltret finns för alla medlemmar, även de som bara kan läsa.',
  'help.guide.labels.tip.1':
    'Etiketter hör till den lista där de skapades. Om du flyttar en plats till en annan lista tas dess etiketter bort.',
  'help.guide.labels.tip.2': 'För att hantera och tilldela etiketter behöver du redigeringsrätt till listan.',
  // filter-select
  'help.guide.filter-select.title': 'Filtrera och välj platser',
  'help.guide.filter-select.goal': 'Filtrera listan och ändra många platser på en gång.',
  'help.guide.filter-select.step.1':
    'Använd rullgardinerna i filterraden: status, kategori, lägsta betyg och sorteringsordning. Status och kategori visar hur många platser som matchar varje val.',
  'help.guide.filter-select.step.2':
    'Klicka på kryssrutsikonen, Välj, efter rullgardinerna. Varje rad får en kryssruta, och ett urvalsfält visas.',
  'help.guide.filter-select.step.3':
    'Markera platser, eller använd Välj alla för alla platser som filtret visar, och välj sedan Tilldela etikett, Flytta till lista, Duplicera till lista, Kopiera till resa eller Radera. Bara listans ägare eller en admin kan använda Flytta och Radera.',
  'help.guide.filter-select.result': 'Åtgärderna gäller hela urvalet på en gång. × till höger stänger markeringsläget.',
  'help.guide.filter-select.tip.1':
    '”Välj alla” markerar bara de platser som matchar filtret. Vill du agera på alla platser med status ”Vill besöka”, filtrera på ”Vill besöka” och klicka på ”Välj alla”.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kopiera platser till en resa',
  'help.guide.copy-to-trip.goal': 'Lägg till sparade platser som stopp på en av dina resor.',
  'help.guide.copy-to-trip.step.1':
    'Slå på Välj och bocka i platserna, eller öppna en plats och använd Kopiera till resa i dess detaljpanel.',
  'help.guide.copy-to-trip.step.2': 'Klicka på Kopiera till resa i markeringsfältet.',
  'help.guide.copy-to-trip.step.3': 'Välj resan. Använd sökrutan för att filtrera en lång lista.',
  'help.guide.copy-to-trip.result':
    'Platserna läggs till i resans platslista med namn, beskrivning, kategori, anteckningar, pris, koordinater, foto och taggar. Inget ändras i samlingen.',
  'help.guide.copy-to-trip.tip.1':
    'Läsare av en delad lista kan göra det här också. Platserna kopieras från listan, och listan ändras inte.',
  // share-list
  'help.guide.share-list.title': 'Dela en lista med någon',
  'help.guide.share-list.goal': 'Planera en lista tillsammans med andra på den här TREK-instansen, i realtid.',
  'help.guide.share-list.step.1': 'Klicka på Dela högst upp i din lista.',
  'help.guide.share-list.step.2': 'Välj användaren och en roll: Läsare, Redigerare eller Admin.',
  'help.guide.share-list.step.3':
    'Klicka på Skicka inbjudan. Personen visas som väntande tills inbjudan har accepterats i personens listspalt eller via meddelandet om den.',
  'help.guide.share-list.result':
    'När de har accepterat visas listan under ”Delad” hos dem, och varje ändring synkas direkt. Du kan fortfarande redigera medlemmar och deras roller i samma dialog.',
  'help.guide.share-list.tip.1':
    'Läsare kan titta, betygsätta och kopiera platser till sina egna resor. Redigerare lägger till och redigerar platser och etiketter. Admins kan dessutom flytta och radera.',
  'help.guide.share-list.tip.2':
    'Bara ägaren kan bjuda in och ta bort personer. En medlem kan själv lämna en delad lista.',
  // export-list
  'help.guide.export-list.title': 'Exportera en lista som fil',
  'help.guide.export-list.goal': 'Ge en lista till någon på en annan TREK-server, eller öppna den i en kartapp.',
  'help.guide.export-list.step.1': 'Klicka på Exportera högst upp i listan.',
  'help.guide.export-list.step.2':
    'Välj TREK-lista om du vill använda listan i en annan TREK, med etiketter och status, eller GPX för OsmAnd, Organic Maps, en Garmin och andra appar som läser vägpunkter.',
  'help.guide.export-list.result': 'Filen laddas ner. Alla medlemmar i en delad lista får exportera den.',
  'help.guide.export-list.tip.1':
    'En plats utan koordinater kan inte bli en GPX-vägpunkt. Den utelämnas, och TREK berättar hur många det gällde.',
  'help.guide.export-list.tip.2':
    'Betyg, medlemmar och uppladdade foton exporteras inte, med avsikt: de hör till den här TREK-instansen och inte till listan.',
  // import-file
  'help.guide.import-file.title': 'Importera en lista från en fil',
  'help.guide.import-file.goal':
    'Importera en TREK-listfil eller en GPX-fil, som en ny lista eller till en befintlig lista.',
  'help.guide.import-file.step.1': 'Klicka på importknappen med uppåtpilen bredvid Ny lista i listfältet.',
  'help.guide.import-file.step.2':
    'Välj filen. Innan TREK importerar något visar den vad filen innehåller: namnet, hur många platser och hur många etiketter.',
  'help.guide.import-file.step.3':
    'Behåll Ny lista och ändra namnet om du vill, och klicka sedan på Importera. Eller välj Lägg till i en lista för att lägga platserna i en lista som du kan redigera, och klicka på Lägg till i listan.',
  'help.guide.import-file.result':
    'Listan öppnas med de importerade platserna. En import till en lista lägger bara till platser. Platser som redan finns behåller sin status, sina anteckningar och sina etiketter.',
  'help.guide.import-file.tip.1':
    'Från en GPX-fil blir varje namngiven vägpunkt en plats. Spår är linjer och utelämnas, och förhandsgranskningen visar hur många punkter det var.',
  'help.guide.import-file.tip.2':
    'En fil som varken är en TREK-lista eller en GPX-fil avvisas, och TREK visar orsaken. Om en enskild plats inte går att läsa hoppas bara den platsen över, inte hela filen.',
  // edit-list
  'help.guide.edit-list.title': 'Redigera eller radera en lista',
  'help.guide.edit-list.goal': 'Ändra en listas namn, färg, omslag, beskrivning eller länkar, eller ta bort listan.',
  'help.guide.edit-list.step.1': 'Klicka på Redigera högst upp i listan. Bara ägaren ser knappen.',
  'help.guide.edit-list.step.2':
    'Ändra det du vill och klicka på Spara. Papperskorgen längst ned till vänster, ”Ta bort lista”, raderar listan och alla dess platser när du har bekräftat.',
  'help.guide.edit-list.result':
    'Rubrikområdet överst visar den nya färgen, det nya omslaget och den nya beskrivningen direkt.',
  'help.guide.edit-list.tip.1':
    'En raderad lista går inte att få tillbaka. Exportera den först om du vill ha en kopia.',
  // all-saved
  'help.guide.all-saved.title': 'Sök i hela ditt bibliotek',
  'help.guide.all-saved.goal': 'Se platserna från alla listor du äger på en gång.',
  'help.guide.all-saved.step.1':
    'Klicka på Alla sparade i listskenan. Där ser du platserna från alla listor du äger eller är medägare till, samlade i en vy.',
  'help.guide.all-saved.step.2':
    'Skriv i Sök platser ovanför kartan och använd filtren som i vilken lista som helst. Välj fungerar också här: flytta, duplicera, kopiera till en resa eller radera över flera listor.',
  'help.guide.all-saved.result':
    'Den här vyn visar alla dina sparade platser tillsammans. Du kan inte lägga till eller importera platser här, eftersom det inte finns någon enskild lista att lägga dem i.',
  'help.guide.all-saved.tip.1': 'Etiketter och sparade turer hör till en lista, så ingen av dem finns på Alla sparade.',

  // ── Screen: journey ───────────────────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Journey', // same-as-en
  'help.ctx.journey.summary':
    'Journey är din resedagbok där fotona kommer först. Varje Journey är kopplad till en eller flera resor, och du fyller den dag för dag med inlägg med berättelse, foton, humör och väder. Här ser du alla dina Journeys, och du öppnar en för att skriva.',
  'help.ctx.journey.bullet.1':
    'Bannern överst visar den dagbok som pågår, eller din senaste, med antal inlägg, foton och platser. Fortsätt skriva öppnar den på dagens datum. När en resa precis har tagit slut erbjuder en banner Resan har just avslutats ovanför att göra resan till en journey.',
  'help.ctx.journey.bullet.2':
    'Under ”Alla Journeys” finns ett kort per journey med omslag, status, datum och antal. Den journey som visas i bannern visas inte där igen. Klicka på ett kort för att öppna det.',
  'help.ctx.journey.bullet.3': 'Det sista kortet i rutnätet, Skapa en ny Journey, startar en från dina resor.',
  // create-journey
  'help.guide.create-journey.title': 'Skapa en Journey',
  'help.guide.create-journey.goal': 'Starta en dagbok för en resa, med resans platser redan tillagda som förslag.',
  'help.guide.create-journey.step.1': 'Klicka på ”Skapa en ny Journey”, det sista kortet i rutnätet.',
  'help.guide.create-journey.step.2':
    'Ge den ett namn och, om du vill, en undertitel, och bocka sedan för de resor som den hör till. Räknaren visar hur många platser som läggs till.',
  'help.guide.create-journey.step.3': 'Klicka på Skapa Journey.',
  'help.guide.create-journey.result':
    'Dagboken öppnas. Varje plats i de länkade resorna visas i tidslinjen som ett förslag, en gång för varje dag den är planerad på. Du kan skriva ett inlägg för vart och ett.',
  'help.guide.create-journey.tip.1': 'Du kan koppla fler resor senare under Journey Inställningar.',
  'help.guide.create-journey.tip.2': 'En Journey utan resor fungerar också. Då lägger du till inlägg för hand.',
  // open-journey
  'help.guide.open-journey.title': 'Öppna en Journey',
  'help.guide.open-journey.goal': 'Öppna en dagbok och se var den öppnas.',
  'help.guide.open-journey.step.1':
    'Klicka på ett kort. Varje kort visar omslaget, datumen och hur många inlägg, foton och platser Journeyn innehåller.',
  'help.guide.open-journey.result':
    'En Journey som pågår öppnas på dagens datum, eller på det senaste inlägget före idag om inget är skrivet för idag ännu. En avslutad Journey öppnas från början.',
  'help.guide.open-journey.tip.1':
    'Omslaget är journeyns första foto, om du inte väljer ett under Journey Inställningar.',
  // continue-writing
  'help.guide.continue-writing.title': 'Fortsätt på den Journey som pågår',
  'help.guide.continue-writing.goal': 'Öppna dagens sida i den Journey du är på direkt.',
  'help.guide.continue-writing.step.1':
    'Klicka på Fortsätt skriva i bannern högst upp. Den visar Journey som pågår, eller den senaste om ingen pågår.',
  'help.guide.continue-writing.result':
    'Dagboken öppnas på dagens datum, eller på det senaste inlägget före idag om inget är skrivet än.',
  'help.guide.continue-writing.tip.1':
    'När en resa nyss har tagit slut visas en banner Resan har just avslutats ovanför den här: Skapa Journey startar en Journey med den resan markerad, och Stäng döljer erbjudandet i den här webbläsaren.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Dagbok',
  'help.ctx.journey-detail.summary':
    'En öppen Journey: tidslinjen till vänster, dag för dag, och kartan till höger med lager du kan slå av och på för planen, det du spelade in, inläggen och fotona. Rubriken visar antalen, Studio, förslagsreglaget och ⋯ för Journey Inställningar. Verktygsfältet under den använder du för att lägga till inlägg.',
  'help.ctx.journey-detail.bullet.1':
    'Rubrik: bakåtpil och statusmärke, omslag, titel och undertitel, antal dagar, platser, inlägg och foton, och till höger Studio, ögat som döljer eller visar förslagen och ⋯ för Journey Inställningar.',
  'help.ctx.journey-detail.bullet.2':
    'Verktygsfält: flikarna Tidslinje och Album, Sök i den här resan och Lägg till inlägg. På Album ersätter Ladda upp knappen Lägg till inlägg.',
  'help.ctx.journey-detail.bullet.3':
    'Tidslinje: ett avsnitt per dag med dagens nummer, antalet platser och ett + för att lägga till ett inlägg den dagen. Under finns inläggskorten med foton, humör, väder och berättelse, samt de streckade förslagskorten från resorna, var och ett med ett × för att avfärda det.',
  'help.ctx.journey-detail.bullet.4':
    'Karta: lagerfältet överst växlar mellan Planering (ihåliga nålar och resornas streckade GPX-rutter), Inspelat (heldragna rutter som sparats från Dawarich), Inlägg (nålar i dagsfärger, förbundna i datumordning med en tunn streckad linje) och Foton. (i) bredvid förklarar varje symbol.',
  'help.ctx.journey-detail.bullet.5':
    '”Journey Inställningar” (⋯): omslag, namn och undertitel, status, GPX-spår, inspelade dagar, platser från foton, inläggsfält, avvisade förslag, synkade resor, medverkande och vilka medlemmar i en resa som får åtkomst, offentlig delning, arkivering och radering.',
  'help.ctx.journey-detail.bullet.6':
    'Längst ned i en lång tidslinje hittar du Till toppen, en dagräknare som hoppar till valfri dag eller valfritt inlägg, och Till senaste inlägget.',
  // add-entry
  'help.guide.add-entry.title': 'Skriv ett inlägg',
  'help.guide.add-entry.goal': 'Lägg till en dags berättelse med titel, text, humör och väder.',
  'help.guide.add-entry.step.1':
    'Klicka på Lägg till inlägg i verktygsfältet, eller på + i högra änden av en dagrubrik för att börja på den dagen.',
  'help.guide.add-entry.step.2':
    'Ge inlägget en titel och skriv din text. Verktygsfältet ovanför texten lägger till fetstil, kursiv, rubriker, citat, länkar och listor i Markdown.',
  'help.guide.add-entry.step.3':
    'Kontrollera datum och tid i högra kolumnen, sök en plats eller använd din nuvarande position och välj ett humör och vädret.',
  'help.guide.add-entry.step.4': 'Klicka på Spara.',
  'help.guide.add-entry.result':
    'Inlägget visas på sin dag i tidslinjen och som en nål på kartan. Siffrorna i sidhuvudet uppdateras.',
  'help.guide.add-entry.tip.1': 'När du skriver i ett förslag använder du samma redigerare, med platsen redan angiven.',
  'help.guide.add-entry.tip.2':
    'Ett inlägg med en plats har valet Utelämna från rutten: inlägget finns kvar i dagboken, men räknas inte med i avståndet eller länderna och visas inte på kartan i Studio.',
  // entry-photos
  'help.guide.entry-photos.title': 'Lägg till foton och videor i ett inlägg',
  'help.guide.entry-photos.goal': 'Lägg till foton på en dag. Det första blir inläggets omslag.',
  'help.guide.entry-photos.step.1': 'Öppna inläggets meny med ⋯ på kortet och välj Redigera.',
  'help.guide.entry-photos.step.2':
    'Klicka på Ladda upp foton och välj filerna. Från album hämtar bilder som redan finns i Journeyns album. External photos söker i ett anslutet Immich- eller Synology-bibliotek efter den dagens bilder.',
  'help.guide.entry-photos.step.3':
    'Håll muspekaren över en bild och klicka på Gör 1:a för att välja omslag. Klicka sedan på Spara.',
  'help.guide.entry-photos.result': 'Fotona visas på kortet och i albumet. Det första är miniatyrbilden överallt.',
  'help.guide.entry-photos.tip.1':
    'Videor lägger du till i ett inlägg på samma sätt: mp4, m4v, webm eller mov upp till 500 MB. De lagras oförändrade.',
  'help.guide.entry-photos.tip.2':
    'HEIC-filer från en iPhone konverteras till JPEG vid uppladdning, och då försvinner deras GPS- och kamerametadata.',
  // suggestions
  'help.guide.suggestions.title': 'Använd eller avfärda förslagen',
  'help.guide.suggestions.goal': 'Gör platserna på dina resor till inlägg, och avfärda dem du inte tänker skriva om.',
  'help.guide.suggestions.step.1':
    'Ett förslag är ett kort med streckad kant och knappen Lägg till inlägg: en plats från en länkad resa, på dagen då den var planerad. Klicka på det för att öppna redigeraren med platsen och dagen redan ifyllda.',
  'help.guide.suggestions.step.2':
    'Klicka på × längst till höger på ett kort som du inte tänker använda. Kortet tas bort från tidslinjen men raderas inte, och synkroniseringen med resan föreslår det inte igen.',
  'help.guide.suggestions.step.3':
    'Har du ångrat dig? Öppna Journey Inställningar med ⋯ i rubriken. Hämta tillbaka avfärdade förslag visar hur många det finns och återställer alla.',
  'help.guide.suggestions.result':
    'Tidslinjen visar bara de inlägg du vill skriva. Ögonikonen i huvudet döljer alla förslag på en gång medan du läser.',
  'help.guide.suggestions.tip.1': 'En plats som är planerad på två dagar ger ett förslag på var och en av de dagarna.',
  'help.guide.suggestions.tip.2': 'Förslag räknas aldrig med i statistiken, bara skrivna inlägg gör det.',
  // add-on-day
  'help.guide.add-on-day.title': 'Lägg till ett inlägg på en tidigare dag',
  'help.guide.add-on-day.goal': 'Skriv om en dag som redan har varit, utan att behöva ändra datumet efteråt.',
  'help.guide.add-on-day.step.1': 'Klicka på + i högra änden av dagens rubrik.',
  'help.guide.add-on-day.step.2': 'Redigeraren öppnas med det datumet inställt. Skriv och spara som vanligt.',
  'help.guide.add-on-day.result': 'Inlägget läggs direkt på rätt dag.',
  'help.guide.add-on-day.tip.1':
    'Om du vill ändra ordningen inom en dag håller du pekaren över ett inlägg: Flytta upp och Flytta ner visas till vänster om det.',
  // pros-cons
  'help.guide.pros-cons.title': 'Lägg till ett omdöme',
  'help.guide.pros-cons.goal': 'Sammanfatta en dag med vad som var bra och vad som inte var det.',
  'help.guide.pros-cons.step.1':
    'I redigeraren hittar du För- och nackdelar under berättelsen. Skriv en punkt i Fördelar eller Nackdelar och använd Lägg till en till för nästa.',
  'help.guide.pros-cons.step.2': 'Spara. På kortet fäller Visa mer ut berättelsen och omdömet som två korta listor.',
  'help.guide.pros-cons.result': 'Tumme upp och tumme ner visas under berättelsen, så att du ser dem direkt.',
  'help.guide.pros-cons.tip.1':
    'Om en Journey inte använder omdömen kan du stänga av avsnittet under Fält i inlägget i Journey Inställningar.',
  // search-journey
  'help.guide.search-journey.title': 'Hitta något i en lång dagbok',
  'help.guide.search-journey.goal': 'Hitta ett inlägg utan att behöva rulla genom veckor av inlägg.',
  'help.guide.search-journey.step.1':
    'Skriv i ”Sök i den här resan” i verktygsfältet. Tidslinjen filtreras medan du skriver, bland titlar, berättelser, platser och taggar. Accenter och stora eller små bokstäver spelar ingen roll.',
  'help.guide.search-journey.step.2':
    'Om du i stället vill hoppa till en dag klickar du på dagräknaren längst ned i tidslinjen, mellan Till toppen och Till senaste inlägget.',
  'help.guide.search-journey.result':
    'Tidslinjen rullar till dagen eller inlägget som du valde, och kartan flyttas dit. Bara de matchande inläggen visas tills du tömmer sökfältet.',
  'help.guide.search-journey.tip.1':
    'En pågående Journey öppnas på dagens sida, så den aktuella sidan syns oftast redan.',
  'help.guide.search-journey.tip.2':
    'Ögat i rubriken döljer förslagen, så att du bara ser de inlägg som du själv har skrivit.',
  // gallery-map
  'help.guide.gallery-map.title': 'Bläddra i albumet och kartan',
  'help.guide.gallery-map.goal': 'Se hela din Journey som bilder och som platser på kartan.',
  'help.guide.gallery-map.step.1':
    'Växla till ”Album” i verktygsfältet. Där finns alla foton från alla inlägg, plus bilder som laddats upp direkt till albumet. Klicka på en bild för att öppna den i bildvisaren.',
  'help.guide.gallery-map.step.2':
    'Med ”Ladda upp” till höger lägger du till bilder i galleriet. Om Immich eller Synology är anslutet kan du välja bilder därifrån med en knapp som har bibliotekets namn.',
  'help.guide.gallery-map.result':
    'Nålarna har sin dags färg och förbinds i datumordning med en tunn streckad linje. Lagerfältet högst upp på kartan växlar vad som ritas.',
  'help.guide.gallery-map.tip.1':
    'En resas GPX-spår visas som streckade linjer i kartans lager Planering. Visa alla GPX-spår från resor i Journey Inställningar stänger av dem.',
  'help.guide.gallery-map.tip.2':
    'Albumfoton med en plats visas också på den offentliga kartan, när både ”Album” och ”Karta” är delade.',
  // entry-fields
  'help.guide.entry-fields.title': 'Stäng av fält i inlägg',
  'help.guide.entry-fields.goal': 'Visa bara de fält som den här Journey använder i redigeraren.',
  'help.guide.entry-fields.step.1': 'Klicka på ⋯ uppe till höger i rubriken för att öppna Journey Inställningar.',
  'help.guide.entry-fields.step.2': 'Under Fält i inlägget stänger du av Humör, Väder eller För- och nackdelar.',
  'help.guide.entry-fields.result':
    'Redigeraren visar inte längre de här fälten. Inget av det du har skrivit går förlorat: när du slår på ett fält igen visas de sparade värdena igen. En delad Journey döljer samma fält.',
  'help.guide.entry-fields.tip.1': 'Reglagen gäller per Journey, så en jobbresa och en semester kan se olika ut.',
  // link-trip
  'help.guide.link-trip.title': 'Länka ytterligare en resa',
  'help.guide.link-trip.goal': 'Lägg till platserna från en andra resa i dagboken som förslag.',
  'help.guide.link-trip.step.1': 'Klicka på ⋯ uppe till höger i rubriken för att öppna Journey Inställningar.',
  'help.guide.link-trip.step.2': 'Under Synkroniserade resor klickar du på Lägg till resa.',
  'help.guide.link-trip.step.3': 'Sök efter resan med namn eller destination och klicka på Länka bredvid den.',
  'help.guide.link-trip.result':
    'Resans platser visas i tidslinjen som förslag på sina dagar och läggs till i lagret Planering på kartan, tillsammans med resans GPX-spår.',
  'help.guide.link-trip.tip.1':
    'Papperskorgen bredvid en länkad resa kopplar ifrån den efter en bekräftelsefråga. Inlägg som du har skrivit finns kvar.',
  'help.guide.link-trip.tip.2':
    'Inlägg med en dag räknas bara en gång, oavsett hur många resor som omfattar den dagen.',
  // share-public
  'help.guide.share-public.title': 'Dela Journeyn offentligt',
  'help.guide.share-public.goal': 'Ge personer utan TREK-konto en skrivskyddad länk.',
  'help.guide.share-public.step.1': 'Öppna Journey Inställningar med ⋯ i rubriken och rulla till Offentlig delning.',
  'help.guide.share-public.step.2': 'Klicka på Skapa en delningslänk.',
  'help.guide.share-public.step.3':
    'Välj vad besökarna ser: Tidslinje, Album och Karta. Under Karta lägger Resplan till de planerade platserna och rutterna, och Inspelade rutter lägger till rutterna för de dagar du spelat in. Kopiera kopierar länken till urklipp.',
  'help.guide.share-public.result':
    'Alla som har länken ser de aktiverade delarna och inget annat. Fält som du har stängt av under Fält i inlägget förblir dolda även där.',
  'help.guide.share-public.tip.1':
    'Foton visas på den offentliga kartan bara när både Album och Karta är på. Med Karta avstängd tar servern bort fotonas koordinater innan den skickar dem.',
  'help.guide.share-public.tip.2': 'Klicka på Ta bort länk bredvid Kopiera för att sluta dela.',
  // contributors
  'help.guide.contributors.title': 'Skriv tillsammans',
  'help.guide.contributors.goal': 'Låt en annan resenär lägga till egna inlägg och foton.',
  'help.guide.contributors.step.1': 'Öppna ”Journey Inställningar” med ⋯ i huvudet och leta upp Medverkande.',
  'help.guide.contributors.step.2':
    'Klicka på ”Bjud in medverkande” och sök efter användaren med namn eller e-postadress.',
  'help.guide.contributors.step.3': 'Välj Läsare eller Redigerare och klicka på Bjud in.',
  'help.guide.contributors.result':
    'Journey visas i deras lista, och deras inlägg visar deras namn. Du tar bort en medverkande genom att klicka på × bredvid personen.',
  'help.guide.contributors.tip.1':
    'Medverkande är till för personer på den här TREK-servern. För alla andra finns den offentliga länken.',
  // studio
  'help.guide.studio.title': 'Lägg ut din Journey som en fotobok',
  'help.guide.studio.goal': 'Gör dagboken till sidor som går att skriva ut.',
  'help.guide.studio.step.1': 'Klicka på Studio i sidhuvudet. Designern öppnas ovanpå din Journey.',
  'help.guide.studio.step.2':
    'För att gå tillbaka klickar du på × längst till höger i övre fältet. Du kommer tillbaka dit du var.',
  'help.guide.studio.result':
    'Sidofältet och dess paneler ligger till vänster, uppslaget på arbetsytan och egenskaperna till höger. Automatisk layout bygger boken av dina inlägg. Exportera skapar en tryckklar PDF.',
  'help.guide.studio.tip.1': 'Studio kräver ett fönster som är minst 1024 px brett och finns inte på telefon.',
  'help.guide.studio.tip.2':
    'Boken har samma åtkomst som journeyn: alla som får läsa journeyn kan öppna boken, och alla som får redigera journeyn kan spara den.',
  // archive-journey
  'help.guide.archive-journey.title': 'Arkivera eller radera en Journey',
  'help.guide.archive-journey.goal': 'Stäng en avslutad Journey eller radera en för gott.',
  'help.guide.archive-journey.step.1': 'Klicka på ⋯ uppe till höger i rubriken för att öppna Journey Inställningar.',
  'help.guide.archive-journey.step.2':
    'Längst ner avslutar Arkivera Journey den och markerar den som arkiverad, och Återställ Journey återställer den. Radera tar bort den med alla inlägg och foton, efter en bekräftelse.',
  'help.guide.archive-journey.result':
    'En arkiverad journey går fortfarande att läsa och dela. Den öppnas bara inte längre på dagens datum.',
  'help.guide.archive-journey.tip.1':
    'Radering kan inte ångras och påverkar inte de resor som Journeyn var länkad till.',
  'help.guide.archive-journey.tip.2': 'Omslag, namn och undertitel finns i samma dialog, högst upp.',
  'help.guide.journey-status.title': 'Ange status för en Journey',
  'help.guide.journey-status.goal':
    'Markera själv en Journey som utkast, live eller slutförd i stället för att låta statusen följa datumen för dess resor.',
  'help.guide.journey-status.step.1':
    'Klicka på ⋯ uppe till höger i Journeyns rubrik för att öppna Journey Inställningar.',
  'help.guide.journey-status.step.2': 'Välj Utkast, Live eller Slutförd under Status. Valet sparas direkt.',
  'help.guide.journey-status.result':
    'Journey behåller statusen du valde: Utkast och Slutförd visas som ett märke på kortet och i rubriken, och en Live-Journey visas i bannern högst upp i Journey-listan.',
  'help.guide.journey-status.tip.1':
    'Automatiskt använder datumen för de länkade resorna igen. Utan länkad resa förblir en automatisk Journey ett utkast.',
  'help.guide.journey-status.tip.2':
    'En status som du har satt för hand ligger kvar tills du ändrar den, även om resans datum ändras.',

  // ── Screen: journey-studio ────────────────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Studio', // same-as-en
  'help.ctx.journey-studio.summary':
    'TREK Studio lägger ut en resa som en fotobok som du kan skriva ut. Den öppnas ovanpå dagboken: sidofältet och dess paneler ligger till vänster, uppslaget du arbetar med i mitten och dess egenskaper till höger. Automatisk layout bygger ett första utkast av dina inlägg, ett tema ger boken färger och typsnitt, och assistenten kan formge sidor tillsammans med dig. Sedan kan du flytta, beskära och ändra stilen på allt, och du kan ångra varje steg.',
  'help.ctx.journey-studio.bullet.1':
    'Övre fältet: reseboksomslaget och namnet till vänster. Till höger syns vem mer som är med i boken och om den är sparad, sidformatet, ångra, gör om och klistra in, Automatisk layout, assistenten, hjälpen, Exportera och knappen som stänger Studio.',
  'help.ctx.journey-studio.bullet.2':
    'Sidofältet till vänster: Sidor, Innehåll (resens foton och inlägg), Layouter, Element (text, former, linjer, ramar, ikoner och klistermärken), Resa (siffror, kartor, länder och märken som byggs av resan) och, avskilda under dem, Tema och Lager.',
  'help.ctx.journey-studio.bullet.3':
    'Arbetsytan: det aktuella uppslaget med utfall och säkra marginaler, och zoomfältet under det med Anpassa till vyn, Bokvy och Ladda ner det här uppslaget.',
  'help.ctx.journey-studio.bullet.4':
    'Egenskaper till höger: allt om det markerade elementet, från läge, storlek och beskärning till färger, effekter, staplingsordning och lås. När inget är markerat visas sidbakgrunden, temat, sidnumren och dokumentet.',
  'help.ctx.journey-studio.bullet.5':
    'Boken läggs ut som en tryckt bok: omslag, en ensam första sida mitt emot omslagets tomma insida, uppslagen, en ensam sista sida och baksidan. Sidnumren räknas från första sidan och trycks som de visas.',
  'help.ctx.journey-studio.bullet.6':
    'Flera personer kan designa samtidigt: alla ser de andras pekare med deras namn. Om du sparar en version som någon annan har ändrat visar TREK en konflikt i stället för att skriva över deras arbete.',
  'help.ctx.journey-studio.bullet.7':
    'Tema: ett uttryck för hela boken, med papper, bläck och tre accentfärger, typsnitt och motiv. Element som är länkade till temat följer med när du ändrar det.',
  'help.ctx.journey-studio.bullet.8':
    'Assistent: där en administratör har ställt in AI öppnar pratbubblan i övre fältet en assistent som lägger ut sidor, skriver bildtexter och ändrar bokens stil tillsammans med dig. Varje ändring den gör är ett ångrasteg.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Bygg boken automatiskt',
  'help.guide.studio-auto-layout.goal': 'Få ett komplett första utkast av dagbokens inlägg och foton med ett klick.',
  'help.guide.studio-auto-layout.step.1': 'Klicka på Auto layout i övre fältet.',
  'help.guide.studio-auto-layout.step.2':
    'Välj ”Hela boken”: den ersätter alla sidor men behåller din titel och sidinställning. ”Detta uppslag” bygger bara om uppslaget på skärmen. Det alternativet finns bara på ett uppslag som skapades från ett inlägg.',
  'help.guide.studio-auto-layout.step.3':
    'Titta igenom sidlisten. Om du föredrog den tidigare versionen ångrar ”Undo” hela layouten.',
  'help.guide.studio-auto-layout.result':
    'Ett uppslag per inlägg, i ordning, med inläggets foton, titel och text placerade åt dig. Varje element är kopplat till sitt inlägg och uppdateras med det tills du redigerar elementet.',
  'help.guide.studio-auto-layout.tip.1': 'Båda alternativen är vanliga ångra-steg, så du kan prova dem och ångra.',
  'help.guide.studio-auto-layout.tip.2':
    'När Auto layout kopplar ett element till ett inlägg uppdateras elementet när du redigerar inlägget. Om du ändrar elementet i Properties tas kopplingen bort.',
  // studio-pages
  'help.guide.studio-pages.title': 'Lägg till, flytta och ta bort uppslag',
  'help.guide.studio-pages.goal': 'Redigera boken sida för sida.',
  'help.guide.studio-pages.step.1':
    'Öppna Sidor i sidofältet. Miniatyrerna visar boken i ordning: omslag, första sidan, uppslag, sista sidan och baksida. Första och sista sidan ritas bredvid den tomma insidan av sitt omslag, så som den bundna boken öppnas.',
  'help.guide.studio-pages.step.2':
    '”Lägg till uppslag” längst ner lägger till ett nytt uppslag före sista sidan. Plustecknet mellan två miniatyrer infogar ett på just den platsen.',
  'help.guide.studio-pages.step.3':
    'Håll pekaren över en miniatyr för att se dess åtgärder: Flytta tidigare, Flytta senare, Duplicera uppslag och Ta bort uppslag. Klicka på en miniatyr för att öppna uppslaget på arbetsytan.',
  'help.guide.studio-pages.result':
    'Omslaget, första och sista sidan och baksidan ligger kvar där de är. Nya uppslag läggs alltid in mellan dem.',
  'help.guide.studio-pages.tip.1': 'Book view i den övre raden visar hela boken som ark, så som den kommer att bindas.',
  'help.guide.studio-pages.tip.2': 'Sidnummer slår du på under Dokument i Properties, när inget är markerat.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Använd en layout på ett uppslag',
  'help.guide.studio-layouts.goal': 'Ge ett uppslag en färdig uppställning av foto- och textramar.',
  'help.guide.studio-layouts.step.1':
    'Öppna Layouter i sidofältet. Först kommer de formgivna sidorna: hela omslag och uppslag i bokens tema, som stilknapparna begränsar till ett uttryck. Mina layouter och Inbyggda följer under dem, i samma rutnät.',
  'help.guide.studio-layouts.step.2':
    'Klicka på en. Uppslaget på arbetsytan får layoutens ramar, och dina befintliga foton och texter placeras i dem.',
  'help.guide.studio-layouts.result':
    'Tomma ramar är platshållare för innehåll: dra ett foto från Content till en ram, eller använd Add to this page.',
  'help.guide.studio-my-layouts.title': 'Spara en sida som din egen layout',
  'help.guide.studio-my-layouts.goal': 'Återanvänd en uppställning som du har byggt på andra sidor i boken.',
  'help.guide.studio-my-layouts.step.1': 'Ordna en sida som du vill ha den och öppna sedan Layouter i sidofältet.',
  'help.guide.studio-my-layouts.step.2':
    'Klicka på Spara den här sidan som layout under Mina layouter. Sidan visas som ett kort i listan.',
  'help.guide.studio-my-layouts.tip.1':
    'Klicka på din layout på en annan sida för att lägga ut den sidan på samma sätt, med dess egna foton och ord.',
  'help.guide.studio-my-layouts.result':
    'Dina layouter sparas med boken och erbjuds på sidor av samma slag: ett omslags för omslag, ett uppslags för uppslag.',
  'help.guide.studio-layouts.tip.1': 'En layout är ett ångrasteg som alla andra.',
  // studio-content
  'help.guide.studio-content.title': 'Lägg foton och inlägg på en sida',
  'help.guide.studio-content.goal': 'Lägg till Journeyns egna foton och inlägg på uppslaget.',
  'help.guide.studio-content.step.1':
    'Öppna ”Content” i sidofältet. ”Photos” listar alla bilder i Journeyn. ”Entries” listar inläggen med deras text.',
  'help.guide.studio-content.step.2':
    'Dra ett foto till uppslaget eller till en tom ruta, eller klicka på Lägg till på den här sidan under fotot. Ladda upp foton lägger till bilder som ännu inte finns i Journey. Från Immich eller Från Synology väljer bilder från ett anslutet bibliotek.',
  'help.guide.studio-content.step.3':
    'Under ett inlägg lägger ”Title”, ”Story” och ”Place” in den texten på sidan som ett textelement. Datum och koordinater läggs till som märken, och inläggets foton listas också där.',
  'help.guide.studio-content.result':
    'Ett foto som du släpper blir ett fotoelement. Text förblir kopplad till inlägget tills du redigerar den.',
  'help.guide.studio-theme.title': 'Ge boken ett tema',
  'help.guide.studio-theme.goal': 'Ställ in färger och typsnitt för hela boken på en gång.',
  'help.guide.studio-theme.step.1':
    'Öppna Tema i sidofältet. Varje kort visar ett tema som en liten sida: dess papper, dess typsnitt och dess tre accentfärger.',
  'help.guide.studio-theme.step.2':
    'Klicka på ett tema för att prova det. Under korten kan du ändra dess palett, välja andra typsnitt och välja motiv och dekoration.',
  'help.guide.studio-theme.step.3':
    'Klicka på Använd på boken, eller Använd på den här sidan för uppslaget på skärmen.',
  'help.guide.studio-theme.tip.1':
    'Element som är länkade till temat tar dess färger och typsnitt och följer med när du ändrar det. Ändra även stilen på det som inte är länkat än länkar först resten.',
  'help.guide.studio-theme.tip.2': 'Färger från bilderna bygger en palett av resens bilder.',
  'help.guide.studio-theme.result':
    'Varje länkad färg och varje länkat typsnitt i boken ändras samtidigt, och att använda temat är ett enda ångrasteg.',
  'help.guide.studio-content.tip.1': 'Sökrutan överst i Content filtrerar båda listorna.',
  'help.guide.studio-content.tip.2':
    'Om du släpper en fil från skrivbordet på arbetsbänken laddar TREK upp den och placerar den i ett enda steg.',
  // studio-elements
  'help.guide.studio-elements.title': 'Lägg till text, former, ikoner och klistermärken',
  'help.guide.studio-elements.goal': 'Lägg till dekoration på ett uppslag utöver foton och berättelser.',
  'help.guide.studio-elements.step.1':
    'Öppna Element i sidofältet. Sex flikar sorterar det du kan lägga till: Text, Former, Linjer, Ramar, Ikoner och Klistermärken.',
  'help.guide.studio-elements.step.2':
    'Klicka på en textstil eller en formgiven rubrik, en form, en linje, en tom ram, en ikon eller ett klistermärke. Varje element placeras mitt på uppslaget, och sedan kan du flytta det.',
  'help.guide.studio-elements.result':
    'Dubbelklicka på ett textelement för att skriva i det. I Properties finns typsnitt, vikt, storlek, avstånd och justering.',
  'help.guide.studio-stickers.title': 'Dekorera med klistermärken',
  'help.guide.studio-stickers.goal': 'Lägg till illustrationer, från sevärdheter och mat till djur och pilar.',
  'help.guide.studio-stickers.step.1': 'Öppna Element i sidofältet och välj Klistermärken.',
  'help.guide.studio-stickers.step.2':
    'Sök efter ett ord eller bläddra bland hyllorna och klicka sedan på ett klistermärke för att placera det på uppslaget.',
  'help.guide.studio-stickers.tip.1':
    'När ett klistermärke är markerat kan du i Egenskaper färga om dess delar och spegla det.',
  'help.guide.studio-stickers.result': 'Klistermärket är en teckning, så det förblir skarpt i alla storlekar.',
  'help.guide.studio-elements.tip.1': 'Ramar är tomma fotoplatser: du kan släppa in en bild senare.',
  // studio-travel
  'help.guide.studio-travel.title': 'Lägg till kartor, siffror, länder och märken',
  'help.guide.studio-travel.goal': 'Förvandla själva resan till formgivna element på sidan.',
  'help.guide.studio-travel.step.1':
    'Öppna Resa i sidofältet. Fyra flikar sorterar det du kan lägga till: Siffror, Kartor, Länder och Märken.',
  'help.guide.studio-travel.step.2':
    'Varje kort visar elementet med din resas egna siffror, i temats färger: en sammanfattning som affisch, biljett, vägskylt eller trippmätare, en karta med numrerade stopp eller beskuren till ett land, ett land som frimärke, vykort eller knappnål, ett datum eller ett avstånd som stämpel, etikett eller band.',
  'help.guide.studio-travel.step.3':
    'Klicka på ett kort. Elementet placeras mitt på uppslaget, och sedan kan du flytta det och ändra storlek på det.',
  'help.guide.studio-travel.result':
    'Elementet visas på uppslaget. Egenskaper ändrar dess utseende, och varje siffra, karta och land uppdateras när resan ändras.',
  'help.guide.studio-text-effects.title': 'Lägg till effekter på text',
  'help.guide.studio-text-effects.goal':
    'Ge en rubrik en kontur, en skugga, en kurva eller bokstäver fyllda med ett mönster.',
  'help.guide.studio-text-effects.step.1': 'Klicka på ett textelement på sidan för att markera det.',
  'help.guide.studio-text-effects.step.2':
    'Öppna Effekter i Egenskaper för att lägga till en kontur, en skugga eller en markering, eller fyll bokstäverna med en toning eller ett mönster. Skiftläge och placering kröker raden och anpassar den till ramen.',
  'help.guide.studio-text-effects.tip.1':
    'Anpassa till ramen krymper texten tills den ryms i ramen, så en lång rubrik aldrig rinner över.',
  'help.guide.studio-text-effects.result': 'Effekten ritas tillsammans med texten, i tryck precis som på skärmen.',
  'help.guide.studio-background.title': 'Ändra sidbakgrunden',
  'help.guide.studio-background.goal':
    'Måla sidan i en färg, en toning eller ett mönster, eller lägg ett foto under den.',
  'help.guide.studio-background.step.1':
    'Klicka på en tom del av sidan så att inget är markerat. Sidbakgrund ligger överst i Egenskaper.',
  'help.guide.studio-background.step.2':
    'Välj Papper, Enfärgad, Toning eller Mönster och en färg, eller klicka på ett foto under Foto som bakgrund.',
  'help.guide.studio-background.tip.1': 'Använd på alla sidor ger varje sida i boken samma bakgrund.',
  'help.guide.studio-background.result': 'Bakgrunden går ut i utfallet, så den trycks ända ut till sidans kant.',
  'help.guide.studio-layers.title': 'Ordna, dölj och lås med lager',
  'help.guide.studio-layers.goal': 'Se allt på uppslaget i staplingsordning och arbeta med det där.',
  'help.guide.studio-layers.step.1': 'Öppna Lager i sidofältet. Överst i listan ligger sidans framsida.',
  'help.guide.studio-layers.step.2':
    'Dra en rad för att ändra ordningen, använd ögat för att dölja ett element och låset för att hålla det på plats. Markera flera och gruppera dem för att flytta dem tillsammans.',
  'help.guide.studio-layers.tip.1': 'Dubbelklicka på en rad för att ge elementet ett eget namn.',
  'help.guide.studio-layers.tip.2': 'Dolda element lämnas utanför PDF-filen.',
  'help.guide.studio-layers.result':
    'Fyllda sidor är fortfarande enkla att redigera, och det som är klart kan inte flyttas av misstag.',
  'help.guide.studio-travel.tip.1':
    'Under Kartor listar Stopp varje stopp på rutten. Stäng av ett för att utesluta det från kartorna och siffrorna, till exempel din hemmaflygplats.',
  'help.guide.studio-travel.tip.2':
    'En landskarta visar bara det landets stopp, så landet fyller sidan även när resan började med en lång flygning.',
  // studio-properties
  'help.guide.studio-properties.title': 'Redigera det du har markerat',
  'help.guide.studio-properties.goal': 'Flytta, beskär, utforma och ordna ett element i lager med inspektören.',
  'help.guide.studio-properties.step.1':
    'Klicka på ett element på uppslaget. Handtag för storlek och rotation visas. Dra elementet för att flytta det.',
  'help.guide.studio-properties.step.2':
    'Properties till höger visar inställningarna för det markerade objektet: position och storlek, Crop med fokuspunkten som avgör vad som stannar kvar i ramen, fyllning eller anpassning, Look-filter, Corner-radie, ramstil, lagerordning och Lock.',
  'help.guide.studio-properties.step.3':
    '”Duplicera” och ”Delete” finns högst upp i inspektören. ”Undo” i det övre fältet ångrar alla de här ändringarna.',
  'help.guide.studio-properties.result':
    'Du kan inte markera eller flytta ett låst element på sidan. Det skyddar en färdig layout medan du arbetar med de andra elementen.',
  'help.guide.studio-properties.tip.1': 'Skift-klick markerar flera element. Inspektören redigerar dem då tillsammans.',
  'help.guide.studio-properties.tip.2':
    'Om du redigerar ett element som Auto layout har placerat är det inte längre kopplat till inlägget och följer inte senare ändringar i det inlägget.',
  // studio-format
  'help.guide.studio-format.title': 'Välj sidformat',
  'help.guide.studio-format.goal': 'Ställ in bokens tryckstorlek innan du bygger layouten.',
  'help.guide.studio-format.step.1':
    'Klicka på sidformatet i övre fältet, bredvid redigeringsverktygen. Där visas formatets namn och form.',
  'help.guide.studio-format.step.2':
    'Välj ”Square 21 × 21 cm”, ”Square 30 × 30 cm”, A4 eller A5 i liggande eller stående format, eller ange en egen bredd och höjd i millimeter. Utfall och skyddszon finns längre ner.',
  'help.guide.studio-format.result':
    'Varje uppslag ritas i den storleken, med 3 mm utfall och 5 mm säkerhetsmarginal som standard.',
  'help.guide.studio-format.tip.1':
    'Ändra formatet först och kör sedan ”Auto layout”. ”Auto layout” använder det format som är inställt när den körs.',
  'help.guide.studio-format.tip.2': 'Fråga tryckeriet om deras värden för utfall och säkerhetsmarginal och ange dem.',
  // studio-export
  'help.guide.studio-export.title': 'Exportera boken som PDF',
  'help.guide.studio-export.goal': 'Få en tryckklar fil, eller en att läsa på skärmen.',
  'help.guide.studio-export.step.1': 'Klicka på Export i övre fältet.',
  'help.guide.studio-export.step.2':
    'Välj ”Enkelsidor”, en sida per ark i läsordning, vilket är vad ett tryckeri behöver, eller ”Uppslag”, två sidor i taget så som boken öppnas. ”Skärmärken” lägger till utfallet på alla kanter och visar var du ska skära.',
  'help.guide.studio-export.step.3':
    'Klicka på ”Utskriftsvy”. Webbläsaren öppnar sidorna. Välj ”Spara som PDF” för att skapa filen.',
  'help.guide.studio-export.result': 'En PDF med lika många ark som dialogrutan angav, i det sidformat du har valt.',
  'help.guide.studio-export.tip.1': 'PDF:en kan bara skapas på en dator, precis som Studio självt.',
  'help.guide.studio-export.tip.2':
    'För ett korrektur exporterar du Uppslag utan skärmärken, och för tryckeriet Enkelsidor med skärmärken.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Återanvänd ett uppslag i en annan bok',
  'help.guide.studio-spread-file.goal': 'Kopiera en design du gillar från en Journeys bok till en annan.',
  'help.guide.studio-spread-file.step.1':
    'Med uppslaget på arbetsytan klickar du på ”Ladda ner det här uppslaget” längst till höger i zoomfältet. Filen innehåller designen, inte fotona.',
  'help.guide.studio-spread-file.step.2':
    'I den andra boken öppnar du ”Pages” och klickar på ”Importera” bredvid ”Lägg till uppslag”. Välj sedan filen.',
  'help.guide.studio-spread-file.result':
    'Uppslaget importeras med sina ramar och textstilar. Släpp fotona från den nya Journey i ramarna.',
  'help.guide.studio-spread-file.tip.1': 'Om en fil inte är en uppslagsdesign avvisar TREK den och visar orsaken.',

  // ── Screen: settings (all tabs) ───────────────────────────────────────────────────────
  'help.ctx.settings.title': 'Inställningar',
  'help.ctx.settings.summary':
    'Dina personliga inställningar, med en flik per ämne i sidofältet till vänster. De flesta reglage gäller så fort du ändrar dem. Ett formulär med knappen Spara sparar först när du klickar på Spara. Inget här ändrar TREK för någon annan.',
  'help.ctx.settings.bullet.1':
    'Sidofältet till vänster: Visning, Utseende, Karta, Meddelanden, Integrationer, Offline och Konto. Plugin visas när ett plugin är aktivt. Om visas om inte operatören har dolt den. Versionen visas längst ned.',
  'help.ctx.settings.bullet.2':
    'Visning öppnas först. Där finns språk, språk för platsnamn, enheter, tidsformat, veckostart och visningsvaluta, samt hur reskartan beter sig. Utseende innehåller tema, färger, läsbarhet, textstorlek och översiktswidgets.',
  'help.ctx.settings.bullet.3':
    'Karta ställer in kartmotor och kartstil; Meddelanden styr vilka händelser som skickas till vilken kanal; Integrationer ansluter fotobibliotek, AirTrail, Dawarich och wanderer och innehåller API-nycklar och MCP; Offline styr vad som sparas på den här enheten.',
  'help.ctx.settings.bullet.4':
    'Konto innehåller din profil, ditt lösenord, tvåfaktorsautentisering, inloggningsnycklar och möjligheten att radera ditt konto.',
  'help.ctx.settings-display.title': 'Visning',
  'help.ctx.settings-display.summary':
    'Vad TREK öppnas med, vilket språk och vilka enheter det använder och hur reskartan och bokningarna fungerar. Varje ändring gäller direkt.',
  'help.ctx.settings-display.bullet.1':
    'Start: Startsida öppnas på Översikt eller på Aktiv resa. Med Aktiv resa väljer Startflik vilken flik den resan öppnas på.',
  'help.ctx.settings-display.bullet.2':
    'Språk och region: Visningsvaluta (eller Resans valuta för ingen), Språk, Platsnamn, Temperaturenhet, Avståndsenhet, Tidsformat och Vecka börjar på.',
  'help.ctx.settings-display.bullet.3':
    'Resor och karta: Öppna platser i, Datum först i dagsrubriker, Etiketter för bokningsrutter, Visa alltid bokningsrutter, Kompakta markörer för oplanerade platser, Utforska platser på kartan, Blurra bokningskoder och Optimera rutten från boendet.',
  'help.ctx.settings-appearance.title': 'Utseende',
  'help.ctx.settings-appearance.summary':
    'Hur TREK ser ut på det här kontot: ljust eller mörkt läge, accentfärg, glas och rörelse, textstorlek och vilka widgetar översikten visar. Allt gäller direkt, på alla enheter du loggar in på.',
  'help.ctx.settings-appearance.bullet.1':
    'Tema: Färgläge (Ljust, Mörk eller Auto), Färgschemat och, med Anpassat, din egen accentfärg för ljust och mörkt läge, med kontrastkontroll.',
  'help.ctx.settings-appearance.bullet.2':
    'Läsbarhet, märkt Experimentell: Transparens, Minska rörelse, Täthet och Textstorlek, med ett reglage för Allt och ett vardera för Stor, Mellan, Normalt och Liten.',
  'help.ctx.settings-appearance.bullet.3':
    'Översiktswidgets: separata reglage för Skrivbord (Under hjälten, Högra sidofältet) och Mobil (Under hjälten, Längst ned på sidan).',
  'help.ctx.settings-appearance.bullet.4':
    '”Återställ till standardinställningarna”, under korten, återställer hela fliken till standardvärdena.',
  'help.ctx.settings-map.title': 'Karta',
  'help.ctx.settings-map.summary':
    'Vilken motor som ritar kartorna i reseplaneraren och i dagboken, och i vilken stil. Leaflet är den klassiska rasterkartan, Mapbox GL lägger till 3D-byggnader och terräng med din egen token, och MapLibre GL ritar vektorrutor från OpenFreeMap utan token. Atlas använder alltid Leaflet.',
  'help.ctx.settings-map.bullet.1':
    'Kartleverantör: Leaflet, Mapbox GL (Experimentell) eller MapLibre GL, varje alternativ med en kort beskrivning.',
  'help.ctx.settings-map.bullet.2':
    'Kartmall och CARTO API-nyckel för Leaflet, Kartstil för de två GL-motorerna, samt Mapbox-åtkomsttoken för Mapbox GL.',
  'help.ctx.settings-map.bullet.3':
    'Bara Mapbox GL: 3D-byggnader och terräng och Högkvalitetsläge. En liveförhandsvisning visas ovanför Spara karta. Spara karta sparar ditt val.',
  'help.ctx.settings-notifications.title': 'Meddelanden',
  'help.ctx.settings-notifications.summary':
    'Hur TREK kontaktar dig utanför appen. Överst avgör en tabell med en rad per händelse och en kolumn per kanal vad som skickas vart. Under den finns korten för webhook, ntfy, push på den här enheten och eventuella plugin-kanaler.',
  'help.ctx.settings-notifications.bullet.1':
    'Meddelanden: slå på eller av varje händelse per kanal. Ett lås betyder att admin har stängt av den för alla.',
  'help.ctx.settings-notifications.bullet.2':
    'Webhook URL: en Discord-, Slack- eller egen webhook, med Test och Spara.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: ”Ntfy Ämne”, valfritt ”Ntfy Server URL” och ”Access Token”, med Test och Spara.',
  'help.ctx.settings-notifications.bullet.4':
    'Push-meddelanden på den här enheten: Slå på för den här enheten gäller bara den här webbläsaren, och Skicka test skickar ett testmeddelande. En plugin-kanal visar Konfigurera tills den är inställd.',
  'help.ctx.settings-integrations.title': 'Integrationer',
  'help.ctx.settings-integrations.summary':
    'Allt som ansluter till TREK utifrån: fotobibliotek för dagboken, AirTrail för flyg, Dawarich för var du faktiskt har varit, wanderer för leder, skrivskyddade API-nycklar för annan programvara och MCP för AI-klienter. En anslutning till en annan tjänst visas först när admin har slagit på den.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich och Synology Photos, AirTrail, Dawarich och wanderer: varje kort har sin adress och nyckel, Spara och Testa anslutningen, och ett märke Ansluten eller Inte ansluten.',
  'help.ctx.settings-integrations.bullet.2':
    'API Nycklar: skrivskyddade nycklar för det offentliga API:t, var och en begränsad till de områden du väljer, med Ändpunkt att kopiera.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP-konfiguration: MCP-ändpunkt och, under OAuth 2.1 Klienter, dina registrerade klienter, Klientkonfiguration att kopiera och Aktiva OAuth-sessioner med Återkalla.',
  'help.ctx.settings-integrations.bullet.4':
    'API Token: det gamla sättet att ansluta till MCP, märkt Utfasad. Använd OAuth 2.1 Klienter i stället.',
  'help.ctx.settings-offline.title': 'Offline', // same-as-en
  'help.ctx.settings-offline.summary':
    'Vad TREK lagrar på den här enheten så att en resa går att öppna utan uppkoppling, och vad som händer när en ändring som du gjorde offline krockar med en ändring som gjordes någon annanstans.',
  'help.ctx.settings-offline.bullet.1':
    'Offlineläge: Tvinga offlineläge laddar först ner allt, arbetar sedan bara från cachen och köar dina ändringar.',
  'help.ctx.settings-offline.bullet.2':
    'Förbered för offline: Ladda ner för offlineanvändning hämtar resedata, dokument och kartrutor. Synkronisera om nu synkar igen manuellt.',
  'help.ctx.settings-offline.bullet.3':
    'Vad som ska lagras offline: Lagra kartrutor offline och ett reglage per resa. En avslutad resa lagras bara om du slår på det.',
  'help.ctx.settings-offline.bullet.4':
    'Synkroniseringskonflikter visas bara när två ändringar krockar, med Min, Behåll deras och När en konflikt uppstår. Offline-cache räknar resorna och de väntande eller misslyckade ändringarna, med Försök igen, Ångra och Rensa cache.',
  'help.ctx.settings-account.title': 'Konto',
  'help.ctx.settings-account.summary':
    'Ditt konto i den här TREK-instansen och hur du loggar in: profilbild, användarnamn och e-post, lösenord, tvåfaktorsautentisering och inloggningsnycklar. ”Ta bort konto” finns längst ned i kortet Konto.',
  'help.ctx.settings-account.bullet.1':
    'Konto: klicka på kameran på bilden för att ladda upp en bild och på den röda papperskorgen för att ta bort den. Användarnamn och E-post sparas med Spara profil.',
  'help.ctx.settings-account.bullet.2':
    'Ändra lösenord: det nuvarande lösenordet och det nya två gånger, med reglerna avbockade medan du skriver, och sedan Uppdatera lösenord. Om den här TREK-instansen bara använder SSO för inloggning visas inte kortet.',
  'help.ctx.settings-account.bullet.3':
    'Tvåfaktorsautentisering (2FA) med en autentiseringsapp och reservkoder, samt inloggningsnycklar för att logga in utan lösenord.',
  'help.ctx.settings-account.bullet.4':
    'Ta bort konto finns till vänster i kortet Kontos fot och kräver bekräftelse. Den enda administratören kan inte ta bort sig själv.',
  // language-region
  'help.guide.language-region.title': 'Ställ in språk, enheter och valuta',
  'help.guide.language-region.goal': 'Använd TREK på ditt språk och med formaten i din region.',
  'help.guide.language-region.step.1':
    'Under Språk och region väljer du ett Språk i raden med chips. TREK byter direkt, på alla enheter där du är inloggad.',
  'help.guide.language-region.step.2':
    'Platsnamn anger vilket språk som platssökning, förslag och adresser använder. Samma som appen följer gränssnittsspråket.',
  'help.guide.language-region.result':
    'Datum, avstånd och pengar visas i det format du är van vid. I Kostnader visas belopp i din visningsvaluta, bara för visning. De belopp som angavs ändras inte.',
  'help.guide.language-region.tip.1': 'Resans valuta visar varje resa i sin egen valuta, utan omräkning.',
  'help.guide.language-region.tip.2': 'Språket styr också namnen på dagar och månader i Vacay och dagboken.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Anpassa reskartan och dagsrubrikerna',
  'help.guide.travel-map-prefs.goal': 'Välj vad reskartan visar och hur dagrubrikerna ser ut, på alla resor.',
  'help.guide.travel-map-prefs.step.1':
    'I Resor och karta anger Öppna platser i vilken kartapp som navigeringsknappen öppnar direkt. Med Fråga varje gång väljer du app varje gång. Datum först i dagsrubriker visar kalenderdatumet först i varje dagsrubrik.',
  'help.guide.travel-map-prefs.step.2':
    'Visa alltid bokningsrutter ritar varje flyg, tåg och annan bokning på kartan. Etiketter för bokningsrutter sätter stationens eller flygplatsens namn vid varje ände. Kompakta markörer för oplanerade platser gör platser som ännu inte är planerade på en dag mindre, så att de planerade stoppen syns tydligare.',
  'help.guide.travel-map-prefs.result':
    'Resekartan använder de här inställningarna på alla resor tills du ändrar dem igen.',
  'help.guide.travel-map-prefs.tip.1':
    'Inställningarna gäller per konto, inte per resa. Medlemmar i en delad resa ser var och en sina egna val.',
  'help.guide.travel-map-prefs.tip.2':
    'En admin kan ställa in standardvärden för alla. Det du ändrar här gäller bara dig.',
  // startup
  'help.guide.startup.title': 'Välj vad TREK öppnar med',
  'help.guide.startup.goal': 'Öppna TREK på den sida du använder mest, i stället för på översikten varje gång.',
  'help.guide.startup.step.1':
    'Högst upp i Visning, under Start, ställer du in Startsida på Översikt eller Aktiv resa.',
  'help.guide.startup.step.2': 'Med Aktiv resa visas Startflik: välj vilken flik den resan öppnas på.',
  'help.guide.startup.result': 'Nästa gång du öppnar TREK öppnas den sidan direkt.',
  'help.guide.startup.tip.1':
    'Aktiv resa är resan som pågår i dag, eller nästa resa som kommer. Det är samma resa som översikten visar överst.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Ställ in tema och accentfärg',
  'help.guide.theme-scheme.goal': 'Gör TREK ljust, mörkt eller låt det följa din enhet, i den färg du föredrar.',
  'help.guide.theme-scheme.step.1':
    'Under Tema ställer du in Färgläge på Ljust, Mörk eller Auto. Auto följer din enhet.',
  'help.guide.theme-scheme.step.2':
    'Välj ett Color scheme: Default, High contrast, Indigo, Teal, Rose, Amber, Violet eller Custom.',
  'help.guide.theme-scheme.step.3':
    'Med Anpassat väljer du en av färgprickarna, eller anger din egen accentfärg separat för Ljust och Mörk. Pillret bredvid säger Bra kontrast eller Låg kontrast.',
  'help.guide.theme-scheme.result':
    'Knappar, länkar och markeringar använder accentfärgen överallt, på alla enheter du loggar in på.',
  'help.guide.theme-scheme.tip.1':
    'Navigeringsfältet har också en snabbomkopplare mellan ljust och mörkt. Den ställer in samma tema.',
  'help.guide.theme-scheme.tip.2': 'Välj färgschemat ”High contrast” om standardschemat är för svårt att läsa.',
  // readability
  'help.guide.readability.title': 'Justera läsbarhet och textstorlek',
  'help.guide.readability.goal': 'Använd mindre glaseffekt och rörelse, mer utrymme eller större text.',
  'help.guide.readability.step.1':
    'Under Readability byter Transparency ut glaspanelerna mot solida ytor, Reduce motion minimerar animationer och Density låter dig välja Comfortable eller Compact.',
  'help.guide.readability.step.2':
    'Textstorlek: dra Allt för att skala all text på en gång, eller ställ in Stor, Mellan, Normalt och Liten en i taget. Varje storlek visar ett prov, så att du ser resultatet medan du drar.',
  'help.guide.readability.result': 'Ändringen gäller hela appen på en gång, även kartpanelerna och dagboken.',
  'help.guide.readability.tip.1':
    'Vissa delar av TREK använder redan mindre animation när enheten är inställd på minskad rörelse. Minska rörelse dämpar animationerna i de övriga delarna.',
  'help.guide.readability.tip.2':
    'Textstorleken tillämpas via typografinivåerna, så ingenting klipps av. Text som inte längre ryms radbryts.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Välj widgetar för översikten',
  'help.guide.dashboard-widgets.goal': 'Visa bara de widgetar du använder, separat för datorn och för telefonen.',
  'help.guide.dashboard-widgets.step.1':
    'Under Översiktswidgets listar Skrivbord widgetarna Under hjälten och Högra sidofältet. Om du slår av Högra sidofältet döljs hela kolumnen och översikten centreras. Kolumnens widgets är nedtonade tills du slår på den igen.',
  'help.guide.dashboard-widgets.step.2':
    'Mobilen har egna reglage, ”Under hjälten” och ”Längst ned på sidan”, för översikten på telefonen.',
  'help.guide.dashboard-widgets.result':
    'Översikten ändras direkt. Om den högra sidopanelen är avstängd centreras översikten.',
  'help.guide.dashboard-widgets.tip.1': 'Ett tilläggs widgetar visas bara när admin har slagit på tillägget.',
  'help.guide.dashboard-widgets.tip.2':
    'Själva översikten kommer ihåg din rutnäts- eller listvy och sorteringsordningen per enhet.',
  // map-provider
  'help.guide.map-provider.title': 'Välj kartmotor och kartstil',
  'help.guide.map-provider.goal': 'Växla mellan den klassiska kartan, vektorrutor och Mapbox 3D-karta.',
  'help.guide.map-provider.step.1':
    'Under Kartleverantör väljer du Leaflet för den klassiska 2D-kartan med valfria rasterrutor, Mapbox GL för vektorrutor med 3D-byggnader och terräng, eller MapLibre GL för vektorrutor från OpenFreeMap utan token.',
  'help.guide.map-provider.step.2':
    'Välj en Kartmall för Leaflet eller en Kartstil för en GL-motor, eller klistra in din egen URL. Mapbox GL kräver en Mapbox-åtkomsttoken och CARTO-mallar en CARTO API-nyckel. Länken under varje fält visar var du får en.',
  'help.guide.map-provider.step.3':
    'Med Mapbox GL slår du på 3D-byggnader och terräng och, om din enhet är snabb nog, Högkvalitetsläge. Kontrollera förhandsvisningen och klicka sedan på Spara karta.',
  'help.guide.map-provider.result':
    'Reseplaneraren och dagbokens kartor använder motorn du valde. Atlas använder alltid Leaflet.',
  'help.guide.map-provider.tip.1': 'Utan token använder Mapbox GL Leaflet i stället för att visa en tom karta.',
  'help.guide.map-provider.tip.2':
    'Kartrutorna som du lagrar offline kommer från den leverantör som är aktiv när du laddar ner dem.',
  // notification-channels
  'help.guide.notification-channels.title': 'Ställ in var du får meddelanden',
  'help.guide.notification-channels.goal':
    'Få resepåminnelser och samarbetshändelser i telefonen eller i ett annat verktyg.',
  'help.guide.notification-channels.step.1':
    'För en webhook klistrar du in en Discord-, Slack- eller egen webbadress i ”Webhook URL”, klickar på Test och sedan på Spara.',
  'help.guide.notification-channels.step.2':
    'För ntfy fyller du i Ntfy Ämne, och lägger till din egen Ntfy Server URL och en Access Token om du driver en egen server. Test skickar ett meddelande direkt och Spara sparar inställningarna.',
  'help.guide.notification-channels.step.3':
    'I kortet Meddelanden högst upp slår du på eller av varje händelse för varje kanal. Ett lås betyder att admin har stängt av den för alla. En plugin-kanal visar Konfigurera tills den är inställd, och Skicka test provar den.',
  'help.guide.notification-channels.result':
    'Händelserna skickas via de kanaler du har slagit på för dem. Kolumnen I-App avgör vad klockan i navigeringsfältet visar.',
  'help.guide.notification-channels.tip.1':
    'En resas egen Påminnelse, hur många dagar innan avresa, ställer du in i resans redigeringsformulär.',
  'help.guide.notification-channels.tip.2':
    'Admin kan förifylla en standardserver för ntfy åt alla. Du väljer ändå ditt eget ämne.',
  // photo-providers
  'help.guide.photo-providers.title': 'Anslut ett fotobibliotek',
  'help.guide.photo-providers.goal': 'Låt dagboken hämta dagens foton från Immich eller Synology Photos.',
  'help.guide.photo-providers.step.1':
    'Under Integrationer hittar du kortet för Immich eller Synology Photos och fyller i det som efterfrågas: Server URL och API nyckel för Immich, eller Användarnamn och Lösenord för Synology Photos. Immich kan också kopiera dagbokens foton till Immich-biblioteket när du laddar upp dem.',
  'help.guide.photo-providers.step.2': 'Klicka på Testa anslutningen och sedan på Spara. Märket ändras till Ansluten.',
  'help.guide.photo-providers.result':
    'Fliken External photos i inläggsredigeraren söker i det anslutna biblioteket efter bilder från inläggets dag, med de som ligger närmast inläggets plats först.',
  'help.guide.photo-providers.tip.1':
    'Anslutningen tillhör bara ditt konto: andra medlemmar i en Journey ansluter sina egna bibliotek.',
  'help.guide.photo-providers.tip.2':
    'En leverantör vars foton saknar GPS-data fungerar ändå. Listan sorteras då efter tid.',
  // api-keys
  'help.guide.api-keys.title': 'Skapa en API-nyckel',
  'help.guide.api-keys.goal': 'Låt andra program läsa dina resor via det publika API:t.',
  'help.guide.api-keys.step.1':
    'Klicka på Skapa nyckel under API Nycklar, ge nyckeln ett Namn som säger var den ska användas och behåll under Vad den här nyckeln får läsa bara de områden den behöver. Klicka på Skapa.',
  'help.guide.api-keys.step.2':
    'Kopiera nyckeln från API-nyckel skapad: den visas bara en gång. Klicka på Klar. Ändpunkten att anropa visas under listan.',
  'help.guide.api-keys.result':
    'Programvara med nyckeln kan läsa de områden du valde men aldrig ändra något. Listan visar när varje nyckel skapades och senast användes, och papperskorgen raderar den.',
  'help.guide.api-keys.tip.1':
    'Använd en nyckel per verktyg, så att du kan återkalla en nyckel utan att påverka de andra verktygen.',
  'help.guide.api-keys.tip.2':
    'Om du vill att en AI-klient ska kunna ändra saker använder du i stället MCP med OAuth. API-nycklar kan bara läsa.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Anslut en AI-assistent via MCP',
  'help.guide.mcp-oauth.goal': 'Ge Claude, en IDE eller en annan MCP-klient åtkomst till dina resor.',
  'help.guide.mcp-oauth.step.1': 'Kopiera MCP-ändpunkt under MCP-konfiguration för din klient.',
  'help.guide.mcp-oauth.step.2':
    'Under OAuth 2.1 Klienter klickar du på Ny klient och väljer en snabbförinställning som Claude Desktop eller Cursor, eller fyller själv i Programnamn, Omdirigerings-URI:er och Tillåtna tillämpningsområden. För en server utan webbläsare väljer du Machine client. Klicka på Registrera klient och kopiera Klient hemlighet: den visas bara en gång.',
  'help.guide.mcp-oauth.step.3':
    'Varje klient har ”Rotera hemlighet” och ”Radera klient”. ”Aktiva OAuth-sessioner” listar de inloggade klienterna, med Återkalla. ”Klientkonfiguration” fälls ut och visar ett färdigt kodavsnitt för klienter som använder JSON.',
  'help.guide.mcp-oauth.result':
    'Klienten kan läsa och ändra det som dess behörighetsområden tillåter, som du, och varje åtgärd visas under ditt namn.',
  'help.guide.mcp-oauth.tip.1':
    'Tillämpningsområden begränsar vad en klient kan göra: ge en klient bara läsbehörighet tills den behöver mer.',
  'help.guide.mcp-oauth.tip.2':
    'Administratören kan stänga av MCP för hela instansen. Då visas inte den här sektionen.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Ta med resor offline',
  'help.guide.offline-prepare.goal':
    'Spara dina resor och deras kartor på den här enheten innan du tappar anslutningen.',
  'help.guide.offline-prepare.step.1':
    'Låt Lagra kartrutor offline vara på under Vad som ska lagras offline och slå på de resor du vill ha på den här enheten. En avslutad resa lagras bara om du slår på den.',
  'help.guide.offline-prepare.step.2':
    'Tillbaka högst upp klickar du på Ladda ner för offlineanvändning under Förbered för offline. Det hämtar resedata, dokument och kartrutor och visar hur många resor som lagrades.',
  'help.guide.offline-prepare.step.3':
    'Tvinga offlineläge laddar ner allt en gång till och arbetar sedan bara från den här enheten, så att du kan kontrollera att allt finns där innan du åker.',
  'help.guide.offline-prepare.result':
    'Resorna öppnas utan uppkoppling. Ändringar du gör sparas i en kö och skickas när du är online igen.',
  'help.guide.offline-prepare.tip.1':
    'Kartrutor tar mest plats. Slå av dem om du bara vill spara resedata och dokument.',
  'help.guide.offline-prepare.tip.2':
    'Installera TREK som en app från webbläsaren för en så smidig offlinestart som möjligt.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Välj vilken version som behålls vid en synkroniseringskonflikt',
  'help.guide.offline-conflicts.goal':
    'Välj hur TREK löser en konflikt mellan en ändring som gjordes offline och en som gjordes någon annanstans.',
  'help.guide.offline-conflicts.step.1':
    'När en ändring som du gjort offline krockar med en nyare visas Synkroniseringskonflikter nära toppen av Offline. För varje ändring klickar du på ”Min” eller Behåll deras.',
  'help.guide.offline-conflicts.step.2':
    'I samma kort avgör När en konflikt uppstår vad som gäller nästa gång: Fråga mig varje gång, Behåll alltid min version eller Behåll alltid serverversionen.',
  'help.guide.offline-conflicts.result':
    'Med ”Fråga mig varje gång” ligger en konflikt kvar i Synkroniseringskonflikter tills du väljer. Med de andra två alternativen löser TREK den automatiskt.',
  'help.guide.offline-conflicts.tip.1':
    '”Rensa cache” tar bara bort kopian på den här enheten. Inget ändras på servern.',
  // profile
  'help.guide.profile.title': 'Ändra din profil',
  'help.guide.profile.goal': 'Uppdatera ditt namn, din e-postadress och din bild.',
  'help.guide.profile.step.1':
    'Klicka på kameran på din bild i kortet Konto för att ladda upp en bild. Den röda papperskorgen tar bort bilden igen och visar din initial i stället.',
  'help.guide.profile.step.2': 'Redigera Användarnamn och E-post under bilden.',
  'help.guide.profile.result': 'Ditt namn och din bild uppdateras överallt på en gång, även på resor du delar.',
  'help.guide.profile.tip.1':
    'Ett konto som är länkat via SSO visar ett SSO-märke och Länkad med följt av leverantören.',
  // password
  'help.guide.password.title': 'Ändra ditt lösenord',
  'help.guide.password.goal': 'Ange ett nytt lösenord.',
  'help.guide.password.step.1':
    'Under Ändra lösenord anger du ditt Nuvarande lösenord, därefter Nytt lösenord och samma lösenord igen i Godkänn nytt lösenord. Listan nedanför bockar av varje regel när den är uppfylld medan du skriver.',
  'help.guide.password.step.2': 'Klicka på Uppdatera lösenord.',
  'help.guide.password.result':
    'Det nya lösenordet gäller direkt. Alla andra enheter loggas ut, dina MCP API-token raderas och OAuth-klienter måste logga in igen. Den här enheten förblir inloggad.',
  'help.guide.password.tip.1':
    'Om den här TREK-instansen bara använder SSO för inloggning finns det inget TREK-lösenord och inget kort ”Ändra lösenord”.',
  // mfa
  'help.guide.mfa.title': 'Slå på tvåfaktorsautentisering',
  'help.guide.mfa.goal': 'Skydda kontot med en kod från en autentiseringsapp.',
  'help.guide.mfa.step.1': 'Klicka på Konfigurera autentiseringsappen under Tvåfaktorsautentisering (2FA).',
  'help.guide.mfa.step.2':
    'Skanna QR-koden med din app, eller ange hemligheten för hand. Skriv sedan den sexsiffriga koden som appen visar och klicka på Aktivera 2FA.',
  'help.guide.mfa.step.3':
    'Spara reservkoderna med Kopiera koder, Ladda ner TXT eller Skriv ut / PDF och klicka sedan på OK. Varje kod fungerar en gång. Använd en kod när du inte har telefonen till hands.',
  'help.guide.mfa.result': 'Varje inloggning ber om en kod efter lösenordet.',
  'help.guide.mfa.tip.1': 'Inaktivera 2FA kräver ditt lösenord och en aktuell kod eller en oanvänd reservkod.',
  'help.guide.mfa.tip.2': 'Administratören kan kräva 2FA av alla. Då går det inte att stänga av här.',
  // passkeys
  'help.guide.passkeys.title': 'Logga in med en inloggningsnyckel',
  'help.guide.passkeys.goal':
    'Använd enhetens fingeravtryck, ansiktsigenkänning eller PIN-kod i stället för ett lösenord.',
  'help.guide.passkeys.step.1':
    'Klicka på Lägg till en inloggningsnyckel under Inloggningsnycklar, bekräfta ditt nuvarande lösenord, ge nyckeln ett namn som säger vilken enhet det gäller och följ sedan enhetens anvisningar.',
  'help.guide.passkeys.step.2':
    'Varje inloggningsnyckel visar om den är Synkroniserad eller knuten till Den här enheten, och när den senast användes. Byt namn ändrar namnet, och raderingsknappen tar bort nyckeln när du har angett ditt lösenord.',
  'help.guide.passkeys.result':
    'Inloggningssidan erbjuder inloggningsnyckeln. Du kan fortfarande logga in med ditt lösenord.',
  'help.guide.passkeys.tip.1':
    'En inloggningsnyckel lagras på enheten eller i dess lösenordshanterare, så lägg till en inloggningsnyckel för varje enhet.',
  'help.guide.passkeys.tip.2':
    'Inloggningsnycklar visas först när admin har slagit på dem. Tills servern har sin WebAuthn-domän står det i kortet i stället för Lägg till en inloggningsnyckel.',
  // delete-account
  'help.guide.delete-account.title': 'Ta bort ditt konto',
  'help.guide.delete-account.goal': 'Ta bort ditt konto och de data som bara är dina.',
  'help.guide.delete-account.step.1':
    'I kortet Konto klickar du på Ta bort konto längst till vänster i sidfoten och sedan på Radera permanent.',
  'help.guide.delete-account.result':
    'Ditt konto raderas, tillsammans med resorna, platserna och filerna som du äger. Resor som andra äger finns kvar.',
  'help.guide.delete-account.tip.1':
    'Om du är den enda administratören visar TREK ”Det går inte att radera”: gör först en annan användare till admin.',
  'help.guide.delete-account.tip.2': 'Det går inte att ångra. Exportera det du vill behålla innan du bekräftar.',

  // ── Screen: admin (all tabs) ──────────────────────────────────────────────────────────
  'help.ctx.admin.title': 'Administration',
  'help.ctx.admin.summary':
    'Inställningar för hela TREK-instansen, för alla användare: vem som får logga in och hur, vad som är påslaget, var filer lagras, hur servern når människor och hur den säkerhetskopieras. Bara administratörer ser den här sidan. Sidofältet grupperar flikarna under Användare, Konfiguration, Integrationer och Underhåll, och varje flik är en egen skärm.',
  'help.ctx.admin.bullet.1':
    'Rubriken räknar användare, resor, platser och filer till höger. Under den visas en banner Uppdatering tillgänglig när det finns en nyare TREK-version.',
  'help.ctx.admin.bullet.2':
    'Användare och Användarinställningar: konton, inbjudningslänkar och behörigheter, samt de inställningar och den karta som ett nytt konto startar med.',
  'help.ctx.admin.bullet.3':
    'Anpassning, Inställningar, Tillägg, Plugin och Lagring: packmallar, kategorier och skollov, inloggning, inloggningsnycklar, 2FA, API-nycklar och sökleverantörer, funktionsmodulerna, plugin från tredje part och var uppladdningar lagras.',
  'help.ctx.admin.bullet.4':
    'Meddelanden, MCP Åtkomst och GitHub: kanalerna som användarna kan välja och standardvalen de börjar med, AI-klienternas token och sessioner samt versionshistoriken.',
  'help.ctx.admin.bullet.5':
    'Säkerhetskopia och Revision: säkerhetskopior på begäran och enligt schema, samt loggen över säkerhetsrelevanta händelser.',
  'help.ctx.admin-users.title': 'Användare',
  'help.ctx.admin-users.summary':
    'Alla konton på den här TREK-instansen, med roll, e-post och senaste aktivitet, inbjudningslänkarna som låter personer registrera sig på en sluten instans samt vem som får göra vad i resor.',
  'help.ctx.admin-users.bullet.1':
    'Tabellen: användare, e-post, roll, skapad och Senast aktiv, med Redigera användare och Ta bort användare på varje rad. En grön prick på avataren betyder att personen är online just nu. Din egen rad visar (Du).',
  'help.ctx.admin-users.bullet.2':
    '”Skapa användare”, uppe till höger i kortet Användare, lägger till ett konto manuellt med ett lösenord som du ger till användaren.',
  'help.ctx.admin-users.bullet.3':
    'Inbjudningslänkar nedanför: registreringslänkar med en användningsgräns, ett utgångsdatum och, om du vill, en resa som den nya användaren går med i när hen registrerar sig.',
  'help.ctx.admin-users.bullet.4':
    'Behörighetsinställningar längst ned: för varje åtgärd, vem som får utföra den (Alla, Resedeltagare, Researrangör eller Admin endast). Klicka på Spara överst i kortet för att spara.',
  'help.ctx.admin-defaults.title': 'Användarinställningar',
  'help.ctx.admin-defaults.summary':
    'Vad ett nytt konto startar med, så att ingen först behöver ställa in det: färgläge, enheter, tidsformat, veckostart, visningsvaluta och blurrade bokningskoder, plus kartan, dess nycklar och ruttservrarna.',
  'help.ctx.admin-defaults.bullet.1':
    'Standardinställningar för användare till vänster: Färgläge, Temperaturenhet, Avståndsenhet, Tidsformat, Vecka börjar på, Visningsvaluta och Blurra bokningskoder.',
  'help.ctx.admin-defaults.bullet.2':
    'Karta till höger: Kartmall, Delad CARTO-nyckel, Egen ruttmotor och Egen Valhalla-instans, en förhandsgranskning och sedan Kartmotor med Kartstil, Delat Mapbox-token, 3D-byggnader och terräng och Högkvalitetsläge.',
  'help.ctx.admin-config.title': 'Anpassning',
  'help.ctx.admin-config.summary':
    'Inställningar som alla resor på instansen delar: packningsmallar, kategoriuppsättningen för platser och samlingar samt skollovskatalogen som Vacay använder.',
  'help.ctx.admin-config.bullet.1':
    'Packningsmallar: namngivna listor med kategorier och föremål som en resas packlista kan utgå från.',
  'help.ctx.admin-config.bullet.2':
    'Kategorier: namn, ikon och färg för kategorierna som används i hela TREK, från platsinspektören till Samlingar. Var och en redigeras i en dialog med förhandsgranskning.',
  'help.ctx.admin-config.bullet.3':
    'Skollov: katalogen med länder och regioner och deras lovperioder, som alla kan välja i Vacay.',
  'help.ctx.admin-settings.title': 'Inställningar',
  'help.ctx.admin-settings.summary':
    'Hur människor loggar in och vilka externa tjänster servern får använda. Till vänster: Autentiseringsmetoder, Inloggningsnyckel, Kräv tvåfaktorsautentisering (2FA) och Enkel inloggning (OIDC). Till höger: Tillåtna filtyper och API Nycklar med sök- och kollektivtrafikleverantörerna. Farozon finns längst ned.',
  'help.ctx.admin-settings.bullet.1':
    'Autentiseringsmetoder: Inloggning med lösenord, Lösenordsregistrering och, när OIDC är konfigurerat, SSO Inloggning och SSO Automatisk konfigurering. Kräv tvåfaktorsautentisering (2FA) har ett eget kort.',
  'help.ctx.admin-settings.bullet.2':
    'Inloggningsnyckel: Aktivera inloggningsnyckel, Relying Party ID (domänen) och Allowed origins. Enkel inloggning (OIDC): Visningsnamn, Utfärdarens URL, en valfri Discovery-URL, Klient ID och Klient hemlighet.',
  'help.ctx.admin-settings.bullet.3':
    'API Nycklar: TREK Places API kommer först och behöver ingen nyckel. Under det finns Google Maps API Nyckel (med Test och Vad nyckeln används till), nycklarna för Unsplash och Amap, och en Spara längst ned i kortet.',
  'help.ctx.admin-settings.bullet.4':
    'Kollektivtrafikleverantör och Leverantör för platssökning avgör vem som svarar på sökningar efter kollektivtrafik och platser. Logg över platssökningar registrerar vilket resultat som valdes. Tillåtna filtyper begränsar uppladdningar.',
  'help.ctx.admin-addons.title': 'Tillägg',
  'help.ctx.admin-addons.summary':
    'TREK:s funktionsmoduler, var och en med en strömbrytare: Packning, Budget, Dokument, Vacay, Atlas, Samarbete, Journey, Samlingar, Bilresa, MCP, AirTrail, Dawarich och AI-tolkningen. Av betyder att navigeringsposten, rutterna och API:et tas bort för alla.',
  'help.ctx.admin-addons.bullet.1':
    'En ruta per tillägg med dess reglage och, där det finns några, underrader för dess alternativ.',
  'help.ctx.admin-addons.bullet.2':
    'Fotoleverantörer och dokumentleverantörer visas också som rutor här, så att Immich eller Synology kan erbjudas användarna.',
  'help.ctx.admin-addons.bullet.3': 'Spårning av väskor har ett eget reglage under rutorna.',
  'help.ctx.admin-plugins.title': 'Plugin',
  'help.ctx.admin-plugins.summary':
    'Tredjepartsplugins som körs i en egen process bredvid TREK, var och en med de behörigheter som den bad om vid installationen. Installera från katalogen, ladda upp ett paket eller länka en mapp medan du utvecklar ett plugin.',
  'help.ctx.admin-plugins.bullet.1':
    'Installerat och Upptäck, med Sök plugins… och filtren Typ, Status och Sortera. Varje rad visar versionen, Granskad, Signerad eller Osignerad, vad pluginet får komma åt, ett reglage och en ⋯-meny.',
  'help.ctx.admin-plugins.bullet.2':
    'De två ikonerna i kortets huvud: ”Ladda upp plugin” tar emot .zip, .tgz eller .tar.gz (du kan också släppa en .zip på sidan); ”Skanna om” hittar en plugin-mapp som är länkad för utveckling.',
  'help.ctx.admin-plugins.bullet.3':
    'Tillåtna värdar per plugin: de adresser som ett plugin får anropa, eftersom utgående anslutningar är blockerade som standard.',
  'help.ctx.admin-storage.title': 'Lagring',
  'help.ctx.admin-storage.summary':
    'Var uppladdningar lagras: på den lokala disken eller i en S3-bucket, om du vill med kopior på fler lagringar. Varje uppladdningskategori kan gå till en egen lagring, och inget ändras förrän du klickar på Spara ändringar.',
  'help.ctx.admin-storage.bullet.1':
    'Hälsa överst: de misslyckade skrivningarna till ett spegelmål, eller Inga replikfel registrerade.',
  'help.ctx.admin-storage.bullet.2':
    'Backender: namn, typ, användning och Speglad till, med Test, Redigera och Ta bort. Beräkna nu räknar vad som är lagrat. En backend som definieras av en miljövariabel är skrivskyddad.',
  'help.ctx.admin-storage.bullet.3':
    'Kategorier: resedokument, Journey-foton, omslag, profilbilder, platsbilder, fotocacharna och säkerhetskopior, var och en kopplad till en backend.',
  'help.ctx.admin-notifications.title': 'Meddelanden',
  'help.ctx.admin-notifications.summary':
    'Kanalerna som instansen erbjuder sina användare och de som du får som administratör. Användarna väljer själva sina ämnen och URL:er under Inställningar. Du bestämmer vad som finns och ställer in e-post.',
  'help.ctx.admin-notifications.bullet.1':
    'E-post (SMTP), Webhook, Ntfy och Web Push har var sitt reglage som erbjuder kanalen till användarna. E-post kräver dessutom serverinställningar. I-App är alltid på.',
  'help.ctx.admin-notifications.bullet.2':
    'Påminnelser inför resan: om servern skickar påminnelsen innan en resa börjar.',
  'help.ctx.admin-notifications.bullet.3':
    'Webhook för administratörer, Admin Ntfy och kortet Meddelanden: vart admin-händelser (Ny version tillgänglig, Fel i lagringsreplik, Paddelregion efterfrågad) skickas, med en testknapp var.',
  'help.ctx.admin-mcp-tokens.title': 'MCP Åtkomst',
  'help.ctx.admin-mcp-tokens.summary':
    'Alla tokens och OAuth-sessioner som AI-klienter har för den här TREK-instansen, för alla användare. Du kan återkalla vilken som helst av dem.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    '”OAuth Sessioner”: klienten, de behörigheter den har fått, ägaren och datumet, med en papperskorg som återkallar den.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'API Token: namn, ägare, Skapad och Senast använd, med en papperskorg som raderar den.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Vad som är nytt i TREK: versionshistoriken från GitHub och om det finns en nyare version än din. Själva uppdateringen görs utanför appen, på värden.',
  'help.ctx.admin-github.bullet.1':
    'Versionshistorik listar utgåvorna som en tidslinje med deras anteckningar. Den nyaste har märket Senaste, förhandsutgåvor märks Förhandsutgåva, och GitHub öppnar sidan med utgåvor.',
  'help.ctx.admin-github.bullet.2':
    'Uppdatering tillgänglig visas under sidrubriken när det finns en nyare utgåva. Så här uppdaterar du visar kommandona för Docker, eller uppdateringsguiden för andra installationer.',
  'help.ctx.admin-backup.title': 'Säkerhetskopia',
  'help.ctx.admin-backup.summary':
    'Fullständiga säkerhetskopior av databasen och uppladdningarna, gjorda för hand eller enligt schema, sparade på servern och nedladdningsbara som en fil. Med Återställ lägger du tillbaka en säkerhetskopia.',
  'help.ctx.admin-backup.bullet.1':
    'Databackup: Skapa säkerhetskopia och Ladda upp säkerhetskopia överst i kortet, och listan över säkerhetskopior med Ladda ner, Återställ och en papperskorg för att radera.',
  'help.ctx.admin-backup.bullet.2':
    'Ladda upp säkerhetskopia återställer från en fil som skapats på en annan instans eller en tidigare dag, efter samma fråga som Återställ.',
  'help.ctx.admin-backup.bullet.3':
    '”Automatisk säkerhetskopiering”: på eller av, Intervall, ”Kör varje timme” och dagen samt ”Ta bort gamla säkerhetskopior efter” (från ”1 dag” till ”Behåll för alltid”), tillämpas med Spara.',
  'help.ctx.admin-audit.title': 'Revision',
  'help.ctx.admin-audit.summary':
    'Loggen över säkerhetsrelevanta och administrativa händelser: inloggningar och misslyckade försök, ändringar av MFA, ändringar av användare och inställningar, säkerhetskopior och återställningar. Skrivskyddad, nyaste överst.',
  'help.ctx.admin-audit.bullet.1': 'En rad per händelse med tid, användare, åtgärd, resurs, IP-adress och detaljer.',
  'help.ctx.admin-audit.bullet.2':
    'Uppdatera i kortets rubrikrad läser in listan på nytt. Märket bredvid titeln visar hur många poster som är inlästa av det totala antalet, och Ladda fler läser in äldre poster.',
  // create-user
  'help.guide.create-user.title': 'Skapa en användare',
  'help.guide.create-user.goal': 'Lägg till ett konto för hand, utan inbjudan.',
  'help.guide.create-user.step.1': 'Klicka på Skapa användare uppe till höger i kortet Användare.',
  'help.guide.create-user.step.2':
    'Ange Användarnamn, E-post och ett Lösenord. Checklistan under lösenordet visar vilka regler lösenordet uppfyller. Välj Roll: Användare eller Administratör.',
  'help.guide.create-user.step.3': 'Klicka på ”Skapa användare”.',
  'help.guide.create-user.result':
    'Kontot visas i tabellen och kan logga in direkt. Ge lösenordet till personen via en kanal som du litar på.',
  'help.guide.create-user.tip.1': 'Om personen ska välja sitt eget lösenord är en inbjudningslänk bättre.',
  'help.guide.create-user.tip.2':
    'En Administratör ser den här sidan och får göra allt. Vad en Användare får göra på resor ställer du in under Behörighetsinställningar nedanför.',
  // edit-user
  'help.guide.edit-user.title': 'Ändra en användares uppgifter eller lösenord',
  'help.guide.edit-user.goal':
    'Byt namn på någon, uppgradera eller nedgradera rollen, eller hjälp personen att logga in igen efter ett bortglömt lösenord.',
  'help.guide.edit-user.step.1':
    'Klicka på pennan (Redigera användare) på användarens rad. Dialogen visar kontots e-postadress överst.',
  'help.guide.edit-user.step.2':
    'Ändra Användarnamn, E-post eller Roll, eller skriv ett lösenord under ”Nytt lösenord” (lämna fältet tomt för att behålla det nuvarande), och klicka på Spara. ”Återställ inloggningsnycklar”, längst ned, tar bort alla inloggningsnycklar för kontot när du har bekräftat.',
  'help.guide.edit-user.result':
    'Ändringen gäller direkt. Ett nytt lösenord loggar också ut personen på alla enheter, så att en gammal session slutar fungera.',
  'help.guide.edit-user.tip.1':
    'Du kan inte ta bort adminrollen från dig själv så länge du är den sista administratören.',
  'help.guide.edit-user.tip.2':
    'Om du återställer inloggningsnycklar behålls lösenordet. Personen lägger till nya nycklar under Inställningar, Konto.',
  // invite-links
  'help.guide.invite-links.title': 'Bjud in någon med en länk',
  'help.guide.invite-links.goal':
    'Låt en person registrera sig på en stängd instans och, om du vill, lägg till personen i en resa.',
  'help.guide.invite-links.step.1': 'Klicka på Skapa länk uppe till höger i kortet Inbjudningslänkar.',
  'help.guide.invite-links.step.2':
    'Välj Max. antal användningar (1× till 5×, eller ∞) och Gäller till (1d till 14d, eller ∞), om du vill en resa under Lägg till i resa (valfritt), och klicka på Skapa och kopiera.',
  'help.guide.invite-links.step.3':
    'Skicka länken. Varje rad visar hur många gånger den har använts, när den går ut, vilken resa den lägger till användaren i och vem som skapade den, med Aktiv, Utgått eller Förbrukad bredvid. Kopiera länken kopierar den igen, och papperskorgen raderar den.',
  'help.guide.invite-links.result':
    'Den som öppnar länken registrerar sig med ett eget lösenord. Om en resa har valts går personen med i den direkt.',
  'help.guide.invite-links.tip.1':
    'Inbjudningslänkar fungerar även när Lösenordsregistrering är avstängd under Inställningar.',
  'help.guide.invite-links.tip.2':
    'En länk som bara kan användas en gång och snart går ut är det säkraste standardvalet för en enskild person.',
  // delete-user
  'help.guide.delete-user.title': 'Radera en användare',
  'help.guide.delete-user.goal': 'Ta bort ett konto och allt som hör till det.',
  'help.guide.delete-user.step.1':
    'Klicka på papperskorgen (Ta bort användare) på användarens rad och bekräfta med Radera.',
  'help.guide.delete-user.result':
    'Kontot raderas, tillsammans med alla resor och journeys som det äger, även resor som det delat med andra. Resor där kontot bara var medlem finns kvar hos sina ägare.',
  'help.guide.delete-user.tip.1': 'Det går inte att ångra. Gör först en säkerhetskopia om du är osäker.',
  'help.guide.delete-user.tip.2':
    'Papperskorgen på din egen rad fungerar inte: du kan inte radera dig själv. Det måste en annan admin göra.',
  // permissions
  'help.guide.permissions.title': 'Bestäm vem som får göra vad',
  'help.guide.permissions.goal': 'Ange per åtgärd vilken roll som får utföra den i den här TREK-instansen.',
  'help.guide.permissions.step.1':
    'Hitta åtgärden i sin grupp under Behörighetsinställningar, till exempel Ta bort resor under Resahantering, och välj vem som får utföra den: Alla, Resedeltagare, Researrangör eller Admin endast. En ändrad rad markeras skräddarsydd.',
  'help.guide.permissions.step.2':
    'Klicka på Spara uppe till höger i kortet. Återställ till standardinställningarna sätter tillbaka varje rad till sin inbyggda nivå. Klicka på Spara efteråt även då.',
  'help.guide.permissions.result':
    'Regeln gäller för alla resor på en gång. Personer under nivån ser inte längre knapparna och menyerna för den.',
  'help.guide.permissions.tip.1': 'Researrangör är personen som skapade resan. Admins får alltid göra allt.',
  'help.guide.permissions.tip.2':
    'Varje åtgärd har en egen rad, så du kan till exempel låta medlemmar planera platser och dagar men låta bara resans ägare radera resan.',
  // default-map
  'help.guide.default-map.title': 'Ställ in kartans standardvärden för nya användare',
  'help.guide.default-map.goal': 'Ge varje nytt konto en fungerande karta utan en personlig token.',
  'help.guide.default-map.step.1':
    'Välj en Kartmall under Karta eller klistra in en URL till kartrutor, och ange en Delad CARTO-nyckel om du använder CARTO-rutor. Förhandsgranskningen nedanför visar resultatet.',
  'help.guide.default-map.step.2':
    'Längre ned väljer du Kartmotor: Standard (gratis), Mapbox (3D) eller MapLibre (OpenFreeMap). För Mapbox och MapLibre väljer du Kartstil. För Mapbox lägger du till Delat Mapbox-token och bestämmer om 3D-byggnader och terräng och Högkvalitetsläge.',
  'help.guide.default-map.result':
    'Nya konton startar med de här värdena. Den som har valt en egen karta under Inställningar behåller sin.',
  'help.guide.default-map.tip.1':
    'En token eller nyckel som anges här delas av alla som inte har någon egen, så håll koll på kvoten.',
  'help.guide.default-map.tip.2':
    'Befintliga konton som aldrig har ändrat något i kartfliken använder också de här standardvärdena.',
  // packing-templates
  'help.guide.packing-templates.title': 'Skapa en packningsmall',
  'help.guide.packing-templates.goal': 'Ge resor en packlista att utgå från i stället för en tom.',
  'help.guide.packing-templates.step.1': 'Klicka på Ny mall, skriv ett namn och bekräfta med bocken.',
  'help.guide.packing-templates.step.2':
    'Klicka på mallens namn för att öppna den och sedan på Lägg till kategori. Med + överst i en kategori lägger du till föremål, och ett föremål behöver bara ett namn.',
  'help.guide.packing-templates.step.3':
    'Allt sparas medan du arbetar. Pennan byter namn på en mall, en kategori eller ett föremål. Papperskorgen raderar ett föremål direkt. För en mall eller en kategori frågar den först, eftersom allt i den raderas också.',
  'help.guide.packing-templates.result':
    'Mallen erbjuds på packlistan för varje resa. När du använder den kopieras föremålen, så en resa kan ändra dem fritt.',
  'help.guide.packing-templates.tip.1':
    'En mall för varje sorts resa (strand, stad, vandring) fungerar bättre än en enda mycket lång lista.',
  'help.guide.packing-templates.tip.2': 'Om du raderar en mall påverkas inte resor som redan har använt den.',
  'help.guide.packing-templates.tip.3':
    '”Spara som mall” på en resas packlista skapar en mall med varje föremåls vikt, antal och väska. De visas här bredvid föremålet, och när du använder mallen hamnar föremålen i samma väskor.',
  // categories
  'help.guide.categories.title': 'Hantera kategoriuppsättningen',
  'help.guide.categories.goal': 'Bestäm vilka kategorier platser och samlingar kan ha och hur de ser ut.',
  'help.guide.categories.step.1':
    'Klicka på Ny kategori, skriv namnet på dialogens titelrad, välj en Ikon och en Färg och kontrollera Förhandsgranskning. Klicka på Skapa.',
  'help.guide.categories.step.2':
    'I listan öppnar pennan (Redigera) en kategori, och Uppdatera sparar den. Papperskorgen (Radera) tar bort den när du har bekräftat.',
  'help.guide.categories.result':
    'Uppsättningen gäller överallt på en gång: platsinspektören, kartnålarna, samlingarna och filtren.',
  'help.guide.categories.tip.1':
    'Platser behåller sitt kategori-id, så om du byter namn på en kategori ändras namnet på alla platser.',
  'help.guide.categories.tip.2':
    'När du raderar en kategori får dess platser ingen kategori. Om det spelar roll, tilldela dem en annan kategori först.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Underhåll skollov för hand',
  'help.guide.school-holiday-catalog.goal':
    'Håll koll på skollov för ett land eller en region som alla kan välja i Vacay.',
  'help.guide.school-holiday-catalog.step.1':
    'Välj Land under Skollov, eller klicka på + (Lägg till land), ange Land och Landskod (t.ex. US) och spara. Lägg till region lägger till varje del av landet som har egna datum.',
  'help.guide.school-holiday-catalog.step.2':
    'Klicka på en region för att öppna Region eller skoldistrikt: Lägg till lovperiod. Ange Lovets namn, Startdatum och Slutdatum för varje period och klicka på Spara. Papperskorgen tar bort en period eller en region. Ett land kan raderas när det inte har några regioner kvar.',
  'help.guide.school-holiday-catalog.result':
    'Användarna hittar landet och regionen under Inställningar i Vacay och ser perioderna i sitt årsrutnät.',
  'help.guide.school-holiday-catalog.tip.1':
    'En region som någon redan har valt i sin Vacay-kalender kan inte raderas.',
  // auth-methods
  'help.guide.auth-methods.title': 'Bestäm hur människor loggar in',
  'help.guide.auth-methods.goal': 'Slå på eller av lösenordsinloggning, SSO och registrering, och kräv 2FA.',
  'help.guide.auth-methods.step.1':
    'Under Autentiseringsmetoder slår du på eller av Inloggning med lösenord och Lösenordsregistrering. Varje reglage gäller direkt. När registreringen är av skapas nya konton bara via inbjudningslänkar, SSO eller Skapa användare.',
  'help.guide.auth-methods.step.2':
    '”SSO Inloggning” och ”SSO Automatisk konfigurering” kräver att ”Enkel inloggning (OIDC)” är konfigurerat längre ner. Automatisk konfigurering skapar ett konto första gången någon loggar in via SSO.',
  'help.guide.auth-methods.step.3':
    'Slå på ”Kräv tvåfaktorsautentisering (2FA)” så måste alla som saknar 2FA ställa in det under Inställningar innan de kan använda TREK.',
  'help.guide.auth-methods.result': 'Inloggningssidan erbjuder precis de metoder som du lät vara på.',
  'help.guide.auth-methods.tip.1':
    'TREK låter dig inte stänga av den sista inloggningsmetoden: dess reglage blir grått, och verktygstipset lyder Minst en inloggningsmetod måste förbli aktiverad.',
  'help.guide.auth-methods.tip.2':
    'Om OIDC_ONLY är satt på servern är lösenordsreglagen låsta, och en notering säger det.',
  // oidc
  'help.guide.oidc.title': 'Anslut enkel inloggning',
  'help.guide.oidc.goal': 'Låt människor logga in med din identitetsleverantör.',
  'help.guide.oidc.step.1':
    'Under Enkel inloggning (OIDC) anger du Visningsnamn för knappen samt Utfärdarens URL, Klient ID och Klient hemlighet från din leverantör. Fyll i Discovery-URL (valfritt) bara om din leverantör inte publicerar den på den vanliga adressen, som Authentik. Klicka på Spara.',
  'help.guide.oidc.step.2': 'Slå på SSO Inloggning under Autentiseringsmetoder.',
  'help.guide.oidc.result':
    'Inloggningssidan visar SSO-knappen. När SSO Automatisk konfigurering är på får förstagångsanvändare ett konto automatiskt.',
  'help.guide.oidc.tip.1':
    'Redirect-URI:n som din leverantör behöver är adressen till din TREK plus OIDC-callbacksökvägen från dokumentationen.',
  'help.guide.oidc.tip.2':
    'Claim-mappningen avgör vilka SSO-grupper som blir administratörer. Se OIDC-sidan i dokumentationen.',
  // instance-keys
  'help.guide.instance-keys.title': 'Ange API-nycklarna',
  'help.guide.instance-keys.goal':
    'Lägg till Google-foton och betyg, Unsplash-omslag och Amap-sökning för hela instansen.',
  'help.guide.instance-keys.step.1':
    'Under API Nycklar hanterar TREK Places API överst redan platssökning utan nyckel. Vad som ingår visar vad det täcker och vad det inte täcker.',
  'help.guide.instance-keys.step.2':
    'För foton, betyg och öppettider klistrar du in en Google Maps API Nyckel och klickar på Test. Där står Ansluten eller Felaktig. Öppna Vad nyckeln används till och slå bara på det du vill ska debiteras: Plats Foton, Automatisk komplettering av plats, Platsinformation, Platsberikning och Sök bara med Google, samt en Daglig gräns för Google-anrop.',
  'help.guide.instance-keys.step.3':
    'Klistra in Unsplash API-nyckel för omslagssökning och Amap (高德地图) API-nyckel för platssökning i Kina (fastlandet) och klicka sedan på Spara längst ned i kortet.',
  'help.guide.instance-keys.result':
    'Användarna får funktionerna utan egna nycklar. Utan Google-nyckel körs sökningen via TREK Places API och OpenStreetMap.',
  'help.guide.instance-keys.tip.1':
    'Om en användare har en personlig nyckel under Inställningar använder TREK den i stället för instansens nyckel för den användaren.',
  'help.guide.instance-keys.tip.2': 'Nycklar kan också komma från miljövariabler. De visas som skrivskyddade här.',
  'help.guide.instance-keys.tip.3':
    'Daglig gräns för Google-anrop begränsar hur mycket TREK får förbruka på nyckeln per dag. Märket bredvid rubriken räknar dagens anrop. När gränsen är nådd använder sökningar OpenStreetMap till nästa dag (UTC).',
  // places-transit
  'help.guide.places-transit.title': 'Välj sökleverantör och leverantör för kollektivtrafik',
  'help.guide.places-transit.goal':
    'Välj vilken tjänst som besvarar platssökningar och förfrågningar om kollektivtrafikrutter.',
  'help.guide.places-transit.step.1':
    'Under Kollektivtrafikleverantör väljer du Transitous (gratis), som är nyckelfri och starkast i Europa, eller Google, som använder Google-nyckeln. Valet sparas direkt.',
  'help.guide.places-transit.step.2':
    'Under Leverantör för platssökning väljer du vilken tjänst TREK ska fråga när TREK-indexet och OpenStreetMap inte hittar något: Automatisk (Google om det finns en nyckel, sedan Amap), Google Places, Amap (高德地图) eller OpenStreetMap.',
  'help.guide.places-transit.result': 'Alla sökrutor och alla kollektivtrafikrutter i TREK använder det här valet.',
  'help.guide.places-transit.tip.1':
    'Ett val utan nyckel visar en varning här. Platssökningen använder då bara TREK-indexet och OpenStreetMap, och kollektivtrafiken bara Transitous.',
  'help.guide.places-transit.tip.2':
    'Googles kollektivtrafikrutter debiteras per förfrågan. Transitous debiteras inte.',
  // file-types
  'help.guide.file-types.title': 'Begränsa filtyperna',
  'help.guide.file-types.goal': 'Bestäm vilka filändelser uppladdade filer får ha.',
  'help.guide.file-types.step.1':
    'Under Tillåtna filtyper redigerar du den kommaseparerade listan med filändelser, eller anger * för att tillåta alla typer, och klickar på Spara.',
  'help.guide.file-types.result':
    'Uppladdningar av alla andra typer avvisas med ett tydligt meddelande, i dokumenten, i dagboken och på omslagen.',
  'help.guide.file-types.tip.1': 'Behåll bildtyper i listan. Omslag och Journey-foton kontrolleras mot samma lista.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Slå på eller av ett tillägg',
  'help.guide.toggle-addon.goal': 'Gör en funktionsmodul tillgänglig för alla, eller ta bort den.',
  'help.guide.toggle-addon.step.1':
    'Klicka på reglaget på tilläggets ruta. Menyvalet visas eller försvinner direkt för alla.',
  'help.guide.toggle-addon.step.2':
    'Vissa rutor har underrader för sina alternativ, till exempel Spårning av väskor under Listor eller fotoleverantörerna under Journey. De visas bara när tillägget är på.',
  'help.guide.toggle-addon.result':
    'När du stänger av ett tillägg behålls dess data. När du slår på det igen visas datan igen.',
  'help.guide.toggle-addon.tip.1':
    'Om du stänger av MCP försvinner ändpunkten och de delar under Integrationer som är beroende av den.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas och Journey är de tillägg som användare efterfrågar mest. Dokument behöver lagringsutrymme för uppladdningar.',
  // install-plugin
  'help.guide.install-plugin.title': 'Installera ett plugin',
  'help.guide.install-plugin.goal':
    'Lägg till ett plugin från tredje part och ge det exakt de behörigheter det ber om.',
  'help.guide.install-plugin.step.1':
    'Öppna Upptäck, hitta ett plugin med Sök plugins… eller filtret Typ och klicka på Installera. Har du en paketfil klickar du på Ladda upp plugin (molnikonen uppe till höger på kortet) eller släpper .zip-filen på sidan.',
  'help.guide.install-plugin.step.2':
    'Läs raden under Installerat: vad pluginet får komma åt, vilka värdar det ansluter till och om det är Granskad och Signerad. Slå sedan på Aktivera plugin. Raden visar då Aktiv.',
  'help.guide.install-plugin.step.3':
    'Radens ⋯-meny erbjuder Starta om, Visa felloggen, Tillåtna värdar och Byt version…, samt länkarna till källan. Radera avinstallerar pluginet och dess data. En nyare version visas som en uppdatering på raden, och en version som ber om nya behörigheter förblir avstängd tills du godkänner dem.',
  'help.guide.install-plugin.result':
    'Pluginet körs i en egen process. Allt det lägger till, till exempel widgetar, kartlager eller verktyg, visas där pluginet anger.',
  'help.guide.install-plugin.tip.1': 'Skanna om hittar en pluginmapp som är länkad för utveckling utan ett paket.',
  'help.guide.install-plugin.tip.2':
    'Ett osignerat plugin är markerat som sådant. Installera det bara om du litar på källan.',
  // storage-backends
  'help.guide.storage-backends.title': 'Flytta uppladdningar till S3 eller spegla dem',
  'help.guide.storage-backends.goal':
    'Lagra filer i objektlagring, eller kopiera varje uppladdning till en andra lagring.',
  'help.guide.storage-backends.step.1':
    'Klicka på Lägg till backend under Backender, ge den ett Namn, välj Typ, Lokal eller S3, och fyll i fälten. Om du vill spara en kopia någon annanstans markerar du Spegelmål. Klicka på Tillämpa och sedan på Test på den nya raden för att kontrollera anslutningen.',
  'help.guide.storage-backends.step.2':
    'Koppla varje slags uppladdning, till exempel Resedokument, Journey-foton eller Säkerhetskopior, till en backend under Kategorier.',
  'help.guide.storage-backends.step.3':
    'Klicka på Spara ändringar längst ned. Om en kategori nu pekar på en annan lagring frågar TREK om du vill Flytta befintliga objekt eller Dirigera bara nya skrivningar.',
  'help.guide.storage-backends.result':
    'Nya uppladdningar går till den tilldelade lagringen. Flyttade filer levereras därifrån, och det du valde att inte flytta ligger kvar där det var.',
  'help.guide.storage-backends.tip.1':
    'En backend som är konfigurerad via miljövariabler visas men kan inte redigeras här.',
  'help.guide.storage-backends.tip.2':
    'Ett speglingsmål får en kopia av varje ny skrivning. Synkronisera nu på raden kopierar det som lagrades tidigare. Ett långsamt mål gör alla uppladdningar till den lagringen långsammare.',
  // channels-instance
  'help.guide.channels-instance.title': 'Konfigurera meddelandekanalerna',
  'help.guide.channels-instance.goal': 'Bestäm vilka kanaler användarna får välja och ställ in e-post.',
  'help.guide.channels-instance.step.1':
    'Slå på E-post (SMTP) i rubriken på kortet, ange SMTP Host, SMTP Port, SMTP User, SMTP Password och From Address och klicka på Spara. Skicka ett testmejl skickar ett e-postmeddelande till dig. Hoppa över kontroll av TLS-certifikat är bara till för en lokal e-postserver med eget certifikat.',
  'help.guide.channels-instance.step.2':
    'Slå på Webhook, Ntfy och Web Push för att erbjuda dem. Användarna anger sedan sin egen URL eller sitt eget ämne, eller slår på push per enhet, under Inställningar, Meddelanden.',
  'help.guide.channels-instance.step.3':
    'Påminnelser inför resan slår på påminnelsen innan en resa börjar. I-App är alltid på.',
  'help.guide.channels-instance.result': 'Fliken ”Meddelanden” hos varje användare visar de kanaler du har slagit på.',
  'help.guide.channels-instance.tip.1':
    'Ntfy Server URL i kortet Admin Ntfy är också standardservern för användarna. Användarna kan fortfarande ange en egen server.',
  'help.guide.channels-instance.tip.2':
    'Plugin-kanaler visas automatiskt så fort ett plugin med den funktionen är aktivt.',
  // admin-channels
  'help.guide.admin-channels.title': 'Få adminhändelser i mobilen',
  'help.guide.admin-channels.goal':
    'Få meddelanden om nya utgåvor, misslyckade lagringsspeglingar och förfrågningar om paddelregioner.',
  'help.guide.admin-channels.step.1':
    'Under Admin Ntfy anger du Admin Ämne och, om det behövs, Ntfy Server URL och en Åtkomsttoken (valfritt). Under Webhook för administratörer anger du en URL. Klicka på Spara i varje kort.',
  'help.guide.admin-channels.step.2':
    'Klicka på Skicka test ntfy eller Skicka testwebhook för att se ett meddelande komma fram.',
  'help.guide.admin-channels.result':
    'Admin-händelser skickas till alla admins i appen och, där du har slagit på dem, till admin-ämnet i ntfy och till webhooken.',
  'help.guide.admin-channels.tip.1':
    'Håll adminämnet skilt från ditt personliga, så att meddelanden om driftstopp inte drunknar bland reseämnena.',
  'help.guide.admin-channels.tip.2':
    'Admin-webhooken och admin-ämnet är skilda från dina egna kanaler under Inställningar, Meddelanden.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Återkalla AI-åtkomst',
  'help.guide.mcp-tokens-admin.goal':
    'Se och återkalla alla tokens och sessioner som en AI-klient har, för vilken användare som helst.',
  'help.guide.mcp-tokens-admin.step.1':
    'Hitta klienten på namn och ägare under OAuth Sessioner. Dess chips visar vilka behörigheter den har fått. Papperskorgen återkallar sessionen efter att du har bekräftat.',
  'help.guide.mcp-tokens-admin.step.2':
    'Under API Token gäller samma sak för token: namn, ägare, Skapad och Senast använd. Papperskorgen raderar token, och klienten slutar fungera direkt.',
  'help.guide.mcp-tokens-admin.result': 'Klientens användare måste ansluta den igen. Inget annat ändras.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Tillämpningsområdena visar vad en klient skulle kunna göra. Ett skrivskyddat tillämpningsområde är ofarligt att behålla.',
  'help.guide.mcp-tokens-admin.tip.2':
    'Om du stänger av tillägget MCP slutar alla klienter fungera direkt och den här fliken döljs, men inget raderas: token fungerar igen när tillägget slås på igen.',
  // release-history
  'help.guide.release-history.title': 'Kolla efter en ny version',
  'help.guide.release-history.goal': 'Ta reda på om din TREK är aktuell och vad nästa version innehåller.',
  'help.guide.release-history.step.1':
    'När det finns en nyare utgåva visas Uppdatering tillgänglig under sidrubriken, med versionen du kör. Visa på GitHub öppnar utgåvan, och Så här uppdaterar du visar kommandona för Docker eller uppdateringsguiden för andra installationer.',
  'help.guide.release-history.step.2':
    'Versionshistorik listar varje version med sina anteckningar. Visa detaljer fäller ut dem, den nyaste versionen har märket Senaste, och Ladda fler visar äldre versioner.',
  'help.guide.release-history.result':
    'Du uppdaterar på värden, genom att hämta den nya avbilden eller bygga den nya taggen. Datakatalogen behålls.',
  'help.guide.release-history.tip.1':
    'Gör en säkerhetskopia före en uppdatering. Fliken ”Säkerhetskopia” ligger bredvid den här.',
  'help.guide.release-history.tip.2':
    'Förhandsversioner visas men aviseras inte som uppdateringar, såvida du inte själv kör en förhandsversion.',
  // create-backup
  'help.guide.create-backup.title': 'Skapa och återställ en säkerhetskopia',
  'help.guide.create-backup.goal':
    'Säkerhetskopiera hela instansen, spara en kopia på ett annat ställe och kunna återställa den.',
  'help.guide.create-backup.step.1':
    'Klicka på Skapa säkerhetskopia uppe till höger under Databackup. Databasen och uppladdningarna sparas i en fil på servern.',
  'help.guide.create-backup.step.2':
    'Ladda ner sparar en kopia utanför maskinen. Papperskorgen raderar gamla säkerhetskopior efter att du har bekräftat.',
  'help.guide.create-backup.step.3':
    'Återställ på en säkerhetskopia, eller ”Ladda upp säkerhetskopia” med en fil, ersätter all nuvarande data när du klickar på ”Ja, återställ” under ”Återställa säkerhetskopia?”.',
  'help.guide.create-backup.result':
    'En återställning ger tillbaka användare, resor, filer och inställningar exakt som de var i den säkerhetskopian.',
  'help.guide.create-backup.tip.1':
    'Återställning är den enda åtgärden här som inte går att ångra. Gör en ny säkerhetskopia först.',
  'help.guide.create-backup.tip.2':
    'Säkerhetskopior lagras i datakatalogen. Kopiera dem till en annan maskin så att de är säkra om den här maskinen går sönder.',
  // auto-backup
  'help.guide.auto-backup.title': 'Schemalägg säkerhetskopior',
  'help.guide.auto-backup.goal': 'Låt servern säkerhetskopiera sig själv och rensa bort gamla säkerhetskopior.',
  'help.guide.auto-backup.step.1':
    'Slå på Aktivera automatisk säkerhetskopiering under Automatisk säkerhetskopiering och välj Intervall (Per timme, Dagligen, Varje vecka eller Månadsvis), Kör varje timme och, för Varje vecka eller Månadsvis, Veckodag eller Dag i månaden.',
  'help.guide.auto-backup.step.2':
    'Välj under Ta bort gamla säkerhetskopior efter hur länge en säkerhetskopia ska sparas, från 1 dag till Behåll för alltid, och klicka på Spara.',
  'help.guide.auto-backup.result':
    'Säkerhetskopior dyker upp i listan enligt schemat. Äldre säkerhetskopior raderas när de är äldre än den ålder du valde.',
  'help.guide.auto-backup.tip.1': 'Kör varje timme använder serverns tid. Ledtexten under visar serverns tidszon.',
  'help.guide.auto-backup.tip.2':
    'Lagringsutrymmet på servern är begränsat: 7 eller 14 dagar räcker oftast, med en nedladdad kopia som sparas på annat håll.',
  // audit-log
  'help.guide.audit-log.title': 'Läs revisionsloggen',
  'help.guide.audit-log.goal': 'Ta reda på vem som gjorde vad, och när.',
  'help.guide.audit-log.step.1':
    'Läs raderna, nyast först: Tid, Användare, Åtgärd, Resurs, IP och Detaljer. Åtgärderna har namn efter vad som hände, till exempel en misslyckad inloggning, en MFA-ändring eller en återställning.',
  'help.guide.audit-log.step.2':
    'Uppdatera uppe till höger läser in listan på nytt. Märket bredvid titeln visar hur många poster som är inlästa av det totala antalet, och Ladda fler läser in äldre poster.',
  'help.guide.audit-log.result': 'Du har ett underlag som du kan visa för den som frågar varför något ändrades.',
  'help.guide.audit-log.tip.1': 'Tiderna visas i serverns tidszon.',
  'help.guide.audit-log.tip.2': 'Loggen går bara att lägga till i. Inget här kan redigeras eller raderas från appen.',
  // document-providers
  'help.guide.document-providers.title': 'Erbjud ett dokumentlager',
  'help.guide.document-providers.goal': 'Bestäm vilka lager en resa kan synkronisera sina dokument med.',
  'help.guide.document-providers.step.1':
    'Rutan Dokument listar arkiven som rader: Paperless-ngx, Papra, Nextcloud, OpenCloud och Synology Drive. Alla fem är avstängda från början, och raderna visas bara när Dokument självt är på.',
  'help.guide.document-providers.step.2':
    'Slå på reglaget på raden Nextcloud. Meddelandet lyder Tillägget har uppdaterats, och från och med nu hittar reseägare Dokumentsynkronisering i fliken Filer på sina resor, med Nextcloud under Anslut en leverantör.',
  'help.guide.document-providers.result':
    'Lagringen finns tillgänglig på varje resa i den här TREK-instansen. Inget är anslutet förrän en reseägare ansluter det.',
  'help.guide.document-providers.tip.1':
    'Här bestäms bara om ett lager får erbjudas. Adressen och inloggningsuppgifterna hör till en resa och anges i dess flik Filer av resans ägare, aldrig i adminpanelen.',
  'help.guide.document-providers.tip.2':
    'Om du stänger av Dokument stängs även alla lager av, och du kan inte slå på ett lager medan Dokument är av: servern svarar Enable the Documents addon first. Ett lager i ditt eget nätverk kräver också ALLOW_INTERNAL_NETWORK=true på servern.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Resa',
  'help.ctx.trip.summary':
    'Allt om en resa: planen med dagar, karta och platser samt flikarna för turer, transporter, bokningar, listor, kostnader, filer, samarbete och en länkad dagbok. Var och en av dem har en egen hjälpskärm under den här.',
  'help.ctx.trip.bullet.1':
    'Flikraden under det övre fältet: Planering, Turer, Transporter, Bokningar, Listor, Kostnader, Filer, Samarbete och, när en dagbok är länkad, Dagbok. Tillägg och plugin avgör vilka flikar som finns i din TREK.',
  'help.ctx.trip.bullet.2':
    'Planering har tre kolumner: dagarna till vänster, kartan i mitten och platserna till höger. Med tillägget Bilresa börjar dagkolumnen med ett reglage för Dagar och Bilresa, och med tillägget Turer börjar platskolumnen med Platser och Turer. Bokningar och transporter ingår i planen, vid stoppet och mellan stoppen. Flikarna listar dem.',
  'help.ctx.trip.bullet.3':
    'Reseinställningar, pillret bredvid resans namn uppe till vänster, öppnar resans inställningar: Personer (medlemmar och gäster), Delar (den skrivskyddade offentliga länken och inbjudningslänken) och Dagbok.',
  'help.ctx.trip.bullet.4':
    'Titel, datum, omslag och valuta redigeras från Mina resor, med pennan på reskortet. Resans namn uppe till vänster tar dig tillbaka dit.',
  'help.ctx.trip.bullet.5':
    'Fliken vid en kolumns innerkant fäller ihop kolumnen, och kartan använder det lediga utrymmet. En hopfälld kolumn visas som en liten ruta i kartans övre hörn. Klicka på den för att visa kolumnen igen. Dra den smala avdelaren bredvid en kolumn för att ändra dess bredd.',
  'help.ctx.trip.bullet.6': 'Ångra-pilen i dagarnas verktygsfält ångrar dina senaste ändringar i planen, en i taget.',
  // add-member
  'help.guide.add-member.title': 'Lägg till en medlem',
  'help.guide.add-member.goal': 'Ge någon med ett TREK-konto åtkomst till den här resan.',
  'help.guide.add-member.step.1':
    'Klicka på Reseinställningar, knappen bredvid resans namn uppe till vänster. Den öppnas på Personer.',
  'help.guide.add-member.step.2':
    'Under Bjud in användare väljer du personen i Välj användare… och klickar på Bjud in.',
  'help.guide.add-member.step.3':
    'Personen visas nu under Åtkomst. Märket Ägare visar vem som är ägare. ”Ta bort åtkomst” i slutet av en rad tar bort personen när du har bekräftat.',
  'help.guide.add-member.result':
    'Medlemmen kan se och redigera resan på samma sätt som du, inom de nivåer som administratören har satt under ”Behörighetsinställningar”.',
  'help.guide.add-member.tip.1':
    'Den som saknas i listan har inget TREK-konto ännu. Lägg till personen som gäst, eller låt personen registrera sig via en inbjudningslänk.',
  'help.guide.add-member.tip.2': 'Siffran bredvid Åtkomst räknar personerna i resan. Gäster listas separat nedanför.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Bjud in via länk',
  'help.guide.trip-invite-link.goal': 'Låt människor gå med i resan på egen hand.',
  'help.guide.trip-invite-link.step.1':
    'Klicka på Reseinställningar bredvid resans namn och välj Delar till vänster. Klicka på Skapa inbjudningslänk under Inbjudningslänk till resa.',
  'help.guide.trip-invite-link.step.2':
    'Klicka på Kopiera och skicka länken. Alla med ett TREK-konto som öppnar den går med som medlem.',
  'help.guide.trip-invite-link.step.3':
    'Skapa ny ersätter länken, och den gamla länken slutar fungera. Inaktivera stänger av den.',
  'help.guide.trip-invite-link.result': 'Alla som öppnar länken går med i resan och visas under ”Åtkomst”.',
  'help.guide.trip-invite-link.tip.1':
    'Den som saknar konto kan inte använda den. En administratör skapar registreringslänkar under Admin, Användare, och kan koppla en till den här resan.',
  'help.guide.trip-invite-link.tip.2':
    'Använd Skapa ny om du skickade länken till fel chatt: den gamla länken slutar fungera direkt.',
  // add-guest
  'help.guide.add-guest.title': 'Lägg till en gäst utan konto',
  'help.guide.add-guest.goal': 'Lägg till någon i resan som inte använder TREK.',
  'help.guide.add-guest.step.1':
    'Klicka på Reseinställningar bredvid resans namn. På Personer är Gäster den sista delen, under Åtkomst.',
  'help.guide.add-guest.step.2': 'Skriv namnet i Gästens namn och klicka på Lägg till gäst.',
  'help.guide.add-guest.result':
    'Gästen kan tilldelas kostnader, packningsföremål och uppgifter, men kan inte logga in.',
  'help.guide.add-guest.tip.1':
    'Byt namn (pennan) ändrar en gästs namn. Ta bort åtkomst (papperskorgen) tar bort gästen efter att du har bekräftat: gästens tilldelningar raderas, och gästens andel av varje utgift fördelas på de andra i utgiftens fördelning.',
  'help.guide.add-guest.tip.2': 'Om personen får ett konto senare, bjud in personen som medlem och ta bort gästen.',
  // public-link
  'help.guide.public-link.title': 'Publicera en skrivskyddad länk',
  'help.guide.public-link.goal': 'Visa resan för personer som inte ska redigera den.',
  'help.guide.public-link.step.1': 'Klicka på Reseinställningar bredvid resans namn och välj Delar till vänster.',
  'help.guide.public-link.step.2':
    'Slå på det som länken får visa i kortet Allmän länk. Karta & Plan är alltid på. Bokningar, Packning, Kostnader och Chatt väljer du själv.',
  'help.guide.public-link.step.3':
    'Under Val utelämnar Endast resor och boenden aktiviteter, dagsanteckningar och tomma dagar. Utan foton utelämnar platsfotona.',
  'help.guide.public-link.result':
    'Alla som har länken ser de valda delarna utan att logga in och kan inte ändra något.',
  'help.guide.public-link.tip.1':
    'Länken finns inte listad någonstans, men alla som har den kan öppna den. Behandla den lika privat som ett lösenord.',
  'help.guide.public-link.tip.2': 'Om personen ska kunna redigera lägger du i stället till hen som medlem.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Lämna över resan eller lämna den',
  'help.guide.transfer-ownership.goal': 'Gör någon annan till ägare, eller lämna en resa som inte är din.',
  'help.guide.transfer-ownership.step.1':
    'Klicka på Reseinställningar bredvid resans namn. Under Åtkomst klickar du på Gör till ägare (kronan) på en medlems rad och bekräftar.',
  'help.guide.transfer-ownership.step.2':
    'Lämna resan på din egen rad tar bort dig från resan när du har bekräftat. Om du är ägare måste du först överlåta ägandet.',
  'help.guide.transfer-ownership.result':
    'Den nya ägaren hanterar medlemmarna och kan radera resan. Du förblir en vanlig medlem.',
  'help.guide.transfer-ownership.tip.1':
    'Ägaren är den som skapade resan, tills ägandet överlåts. Bara ägaren kan ta bort resan.',
  'help.guide.transfer-ownership.tip.2':
    'Ta bort åtkomst på en annan medlems rad fungerar åt andra hållet: ägaren tar bort den medlemmen från resan.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Ge kartan mer plats',
  'help.guide.collapse-columns.goal': 'Fäll ihop en kolumn eller gör den bredare.',
  'help.guide.collapse-columns.step.1':
    'Klicka på fliken vid dagkolumnens inre kant, den med panelikonen, för att fälla ihop kolumnen. Kartan använder det lediga utrymmet. Platskolumnen har samma flik.',
  'help.guide.collapse-columns.step.2':
    'När en kolumn är hopfälld visas en liten ruta med panelikonen i kartans övre hörn. Dess verktygstips lyder Planering eller Platser. Klicka på rutan för att visa kolumnen igen.',
  'help.guide.collapse-columns.step.3':
    'Dra den smala avdelaren mellan en kolumn och kartan för att ändra kolumnens bredd.',
  'help.guide.collapse-columns.result': 'Bredderna sparas. Kolumnerna är öppna igen nästa gång du kommer tillbaka.',
  'help.guide.collapse-columns.tip.1': 'Du kan fälla ihop båda kolumnerna samtidigt för att bara se kartan.',
  'help.guide.collapse-columns.tip.2':
    'I ett smalt fönster får bara en kolumn plats: öppnar du den ena fälls den andra ihop. På en telefon finns inga kolumner; med Resa, Planering och Platser högst upp växlar du mellan vyerna.',
  // undo-change
  'help.guide.undo-change.title': 'Ångra den senaste ändringen',
  'help.guide.undo-change.goal': 'Ångra din senaste ändring av planen.',
  'help.guide.undo-change.step.1':
    'Klicka på ångrapilen i verktygsfältet ovanför dagarna. Dess verktygstips anger vilken ändring den ångrar.',
  'help.guide.undo-change.result': 'Planen är tillbaka som den var, och ett kort meddelande visar vad som ångrades.',
  'help.guide.undo-change.tip.1':
    'Ångra gäller planen: att lägga till, tilldela, ta bort, ordna om, flytta och låsa platser, tömma en dag, optimera en rutt, radera platser, ändra kategorier och importera.',
  'help.guide.undo-change.tip.2':
    'Klicka igen för att gå längre bakåt: TREK sparar dina senaste 30 ändringar på den här resan, de nyaste först, tills du lämnar den.',
  'help.guide.clear-day.title': 'Töm en dag',
  'help.guide.clear-day.goal':
    'Ta bort alla platser från en dag på en gång, till exempel för att planera dagen från början igen.',
  'help.guide.clear-day.step.1': 'Högerklicka på dagens rubrik i planen.',
  'help.guide.clear-day.step.2': 'Välj Töm dagen och bekräfta.',
  'help.guide.clear-day.result':
    'Dagen är tom och dess platser är tillbaka i listan som oplanerade. Ångrapilen ovanför dagarna lägger tillbaka dem.',
  'help.guide.clear-day.tip.1': 'Bara platserna tas bort. Dagen behåller sina noteringar och sina bokningar.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Platser',
  'help.ctx.trip-places.summary':
    'Planens högra kolumn: alla resans platser, planerade eller inte, med sökning, filter och sortering, och sätten att lägga till platser: via sökning, för hand eller från en delad lista. Platser och Turer överst växlar mellan platserna och resans turer.',
  'help.ctx.trip-places.bullet.1':
    'Platser och Turer överst i kolumnen växlar listan. Platser är öppen när du kommer dit. Turer listar resans turer och importerar GPX-, KML- och KMZ-filer med Importera GPX eller KML. En tur visas inte i platslistan.',
  'help.ctx.trip-places.bullet.2':
    'Lägg till plats/aktivitet öppnar formuläret för en plats som du söker efter eller skriver in. Medan en dag är öppen heter knappen Ny plats, och Till dagen bredvid skapar platsen direkt på den dagen.',
  'help.ctx.trip-places.bullet.3':
    '”Importera platser”, ikonknappen bredvid, erbjuder ”Importera lista” för en lista som delats från Google Maps eller Naver Maps. Om en administratör har stängt av tillägget Turer finns även ”Importera fil” för .gpx-, .kml- och .kmz-filer, och du kan släppa en fil på kolumnen.',
  'help.ctx.trip-places.bullet.4':
    'Under dem finns Sök, som även söker i beskrivningar och noteringar, med rutan Välj bredvid. Raden under rymmer filtren: Visa växlar mellan Alla, Oplanerat och Planerat, var och en med sitt antal. Etikettknappen filtrerar på kategori, stjärnan på lägsta betyg, jordgloben (när resan omfattar mer än ett land eller en region) på land eller region, och Sortera efter styr listans ordning.',
  'help.ctx.trip-places.bullet.5':
    'En rad visar bild, namn och beskrivning eller adress, och en stjärna med genomsnittligt betyg när någon har betygsatt platsen. Klicka på raden för platsens detaljer, dra den till en dag, eller högerklicka på den (eller klicka på Fler alternativ, de tre prickarna) för Redigera, + Dag, Öppna hemsida, Google Maps, Spara i samling och Radera.',
  'help.ctx.trip-places.bullet.6':
    'När en dag är öppen lägger det runda + i slutet av en rad (+ Dag) till platsen på den dagen. Det visas på varje plats som ännu inte ligger på den dagen. Planerat listar då bara den dagen, och chipet Visar bara den öppna dagen säger det. Dess x, Visa hela resan, stänger dagen.',
  // create-place
  'help.guide.create-place.title': 'Skapa en plats',
  'help.guide.create-place.goal': 'Lägg till en plats eller aktivitet för hand, med alla uppgifter som planen behöver.',
  'help.guide.create-place.step.1':
    'Klicka på Lägg till plats/aktivitet överst i platskolumnen (Ny plats medan en dag är öppen). Formuläret öppnas med markören i sökfältet.',
  'help.guide.create-place.step.2':
    'Skriv platsen i Sök platser… och välj ett resultat. Namnet överst i dialogen, Adress, Latitud, Longitud och Hemsida fylls i, och Platsdetaljer till vänster visar bilder, öppettider och en beskrivning. I en TREK med Google-nyckel kör Inte rätt plats? Sök på Google i stället under resultaten samma sökning via Google. När Samlingar är på erbjuder Sparade platser till höger platserna i dina listor på samma sätt.',
  'help.guide.create-place.step.3':
    'Under Platsdetaljer klickar du på en bild under ”Välj en bild” för att göra den till platsens bild. ”Använd den här texten” kopierar beskrivningen till formuläret.',
  'help.guide.create-place.step.4':
    'Kontrollera formulärets fält. Namnet högst upp i dialogen är det enda obligatoriska fältet. Kategoripillret under det väljer en av resans kategorier, och + bredvid skapar en ny. Adress, Latitud och Longitud kommer från sökningen, eller så skriver du in dem. Beskrivning och Noteringar är till för din egen text. Hemsida tar länken, Bifoga under Filer lägger till ett dokument, och Telefon, E-post och Lägg till öppettider är till för uppgifter som sökningen inte hittade.',
  'help.guide.create-place.step.5':
    'Klicka på Lägg till. Om en plats med samma namn eller på samma ställe redan finns i resan visar TREK en varning och knappen ändras till Lägg till ändå.',
  'help.guide.create-place.result':
    'Platsen finns i listan och på kartan, under Oplanerat tills du lägger den på en dag.',
  'help.guide.create-place.tip.1':
    'Kostnader längst ned i formuläret, med tillägget Budget på, öppnar redigeraren Kostnader för platsens utgift direkt efter att du har sparat. En bild eller PDF som du klistrar in i dialogen bifogas som en fil under Filer.',
  'help.guide.create-place.tip.2':
    'TREK-indexet och OpenStreetMap ger sökresultaten på varje TREK, och Platsdetaljer fylls i automatiskt från Wikipedia, Wikivoyage och Wikimedia. TREK frågar Google bara när båda ger noll träffar, och bara Google ger betyg.',
  'help.guide.create-place.tip.3':
    'Du kan också skapa en plats på kartan: högerklicka på stället, så öppnas formuläret med koordinater och adress ifyllda.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Lägg till en plats direkt på den öppna dagen',
  'help.guide.place-to-open-day.goal': 'Skapa eller välj en plats och lägg till den på dagen i ett enda steg.',
  'help.guide.place-to-open-day.step.1':
    'Klicka på en dags rubrik i dagkolumnen. Dagen är öppen: dess kort är markerat, och platskolumnen visar knappen Till dagen bredvid Ny plats.',
  'help.guide.place-to-open-day.step.2':
    'Till dagen öppnar samma formulär som Ny plats, men platsen läggs till på den öppna dagen så fort du klickar på Lägg till.',
  'help.guide.place-to-open-day.step.3':
    'Om du vill lägga till en befintlig plats på den öppna dagen klickar du på det runda + i slutet av platsens rad (+ Dag), eller högerklickar på den och väljer + Dag. + visas på varje plats som inte redan ligger på den dagen.',
  'help.guide.place-to-open-day.step.4':
    'Det fungerar också åt andra hållet, utan att du först öppnar en dag: dra platsens rad ut ur kolumnen och släpp den på ett dagkort. Släpper du den mellan två stopp hamnar den exakt där.',
  'help.guide.place-to-open-day.result': 'Platsen listas sist under dagen. Dra den uppåt eller nedåt till rätt plats.',
  'help.guide.place-to-open-day.tip.1':
    'Den öppna dagen påverkar också sökningen: när en dag är öppen utgår kartan och sökningen i närheten från platserna som redan ligger på den dagen.',
  'help.guide.place-to-open-day.tip.2': 'Ångra i verktygsfältet ovanför dagarna ångrar tilldelningen.',
  // filter-places
  'help.guide.filter-places.title': 'Hitta en plats i listan',
  'help.guide.filter-places.goal': 'Visa bara de platser du letar efter i kolumnen.',
  'help.guide.filter-places.step.1':
    'Visa, rullgardinsmenyn under sökfältet, växlar mellan Alla, Oplanerat (inte på någon dag än) och Planerat (på en dag), var och en med sitt antal. Om tillägget Turer är avstängt och ett GPX-spår har importerats finns även Spår.',
  'help.guide.filter-places.step.2':
    'Skriv i Sök högst upp. Listan begränsas medan du skriver, på namn, adress, beskrivning och noteringar. x i fältet rensar det.',
  'help.guide.filter-places.step.3':
    'Etikettknappen bredvid Visa listar kategorierna: markera en eller flera, bland dem Ingen kategori. Knappen visar hur många som är markerade, och Rensa filter längst ned i listan tar bort alla.',
  'help.guide.filter-places.step.4':
    'Stjärnan bredvid anger ett lägsta betyg: 5+, 4+ och så vidare behåller bara platser vars genomsnittliga betyg är minst så högt. Platser utan betyg döljs.',
  'help.guide.filter-places.result': 'Siffran på Visa anger hur många platser som matchar, och filtren kombineras.',
  'help.guide.filter-places.tip.1':
    'När en dag är öppen listar Planerat bara den dagen och visar det: Visar bara den öppna dagen, med Visa hela resan bredvid.',
  'help.guide.filter-places.tip.2':
    'Kartan tillämpar också Visa, kategorierna och betyget, och när en dag är öppen visar Planerat på kartan bara den dagen. Sökningen och jordglobsfiltret gäller bara listan.',
  // edit-place
  'help.guide.edit-place.title': 'Ändra en plats',
  'help.guide.edit-place.goal': 'Rätta ett namn, flytta nålen, lägg till en webbplats eller byt kategori.',
  'help.guide.edit-place.step.1':
    'Högerklicka på raden och välj Redigera, eller klicka på Fler alternativ i slutet av raden, eller öppna platsen och klicka på Redigera i dess detaljer.',
  'help.guide.edit-place.step.2':
    'Ändra det du behöver i ”Redigera plats”: namnet och kategoripillret Kategori högst upp i dialogen, Adress, Latitud och Longitud, Beskrivning, Noteringar, Hemsida, Telefon, E-post och öppettiderna. Om platsen ligger på exakt en dag, eller om du öppnade den från en dag, har formuläret även Start, Slutar och ”Anteckningar för denna dag”.',
  'help.guide.edit-place.step.3': 'Klicka på Uppdatera.',
  'help.guide.edit-place.result':
    'Ändringen gäller överallt där platsen finns: i listan, på kartan och på varje dag den ligger på.',
  'help.guide.edit-place.tip.1':
    'Anteckningar för denna dag hör till platsen just den dagen. Noteringar hör till själva platsen.',
  'help.guide.edit-place.tip.2':
    'Ett Slutar som ligger före starttiden blockerar Uppdatera. Tidsöverlappning med: varnar bara för att ett annat stopp samma dag har samma tid.',
  // delete-place
  'help.guide.delete-place.title': 'Radera en plats',
  'help.guide.delete-place.goal': 'Ta bort en plats från resan för gott.',
  'help.guide.delete-place.step.1':
    'Högerklicka på raden och välj Radera (Fler alternativ i slutet av raden har det också), eller klicka på Radera i platsens detaljer.',
  'help.guide.delete-place.step.2':
    'Klicka på ”Radera” i bekräftelsefrågan. Om en natt var bokad på platsen, eller om en bokning är kopplad till den, står det i frågan vad som raderas tillsammans med den.',
  'help.guide.delete-place.result':
    'Platsen tas bort från listan, kartan och alla dagar. Ångra i verktygsfältet ovanför dagarna återställer den.',
  'help.guide.delete-place.tip.1':
    'Om du bara vill ta bort en plats från en enda dag använder du i stället Ta bort från dag på det stoppet.',
  'help.guide.delete-place.tip.2':
    'Om du vill radera flera platser på en gång klickar du på bocken bredvid sökningen för att starta en markering.',
  // select-places
  'help.guide.select-places.title': 'Ändra eller radera flera platser på en gång',
  'help.guide.select-places.goal': 'Ändra många platser på en gång i stället för en i taget.',
  'help.guide.select-places.step.1':
    'Klicka på bocken bredvid sökfältet. Raderna får runda kryssrutor, och en åtgärdsrad visas längst ner i kolumnen.',
  'help.guide.select-places.step.2':
    'Klicka på raderna för att bocka för dem. ”Välj alla”, den dubbla bocken i fältet, markerar alla rader som filtren visar.',
  'help.guide.select-places.step.3':
    'Fältet räknar de markerade platserna. Ändra kategori ger alla samma kategori, Spara i samling (med Samlingar på) kopierar dem till en av dina samlingar, och Ta bort det markerade tar bort dem efter en bekräftelse.',
  'help.guide.select-places.step.4': 'Klicka på Klar, X:et i slutet av fältet, för att avsluta markeringen.',
  'help.guide.select-places.result':
    'Ändringen gäller alla markerade platser. En radering kan ångras i verktygsfältet ovanför dagarna.',
  'help.guide.select-places.tip.1':
    'Filtren fungerar medan du markerar: filtrera först på Oplanerat, så markerar Välj alla bara de platserna.',
  'help.guide.select-places.tip.2':
    'Markera som besökt i dina listor visas i fältet när tillägget Samlingar är på: den markerar platserna som besökta i de samlingar där de är sparade.',
  // import-places-file
  'help.guide.import-places-file.title': 'Importera platser från en GPX-, KML- eller KMZ-fil',
  'help.guide.import-places-file.goal':
    'Om tillägget Turer är av: importera nålarna och spåren som Google My Maps, Google Earth eller en GPS-spårare har exporterat som platser.',
  'help.guide.import-places-file.step.1':
    'Klicka på Importera platser, ikonknappen bredvid knappen för att lägga till, och välj Importera fil, eller släpp filen var som helst på platskolumnen. Båda finns bara där en administratör har stängt av tillägget Turer.',
  'help.guide.import-places-file.step.2':
    'Välj filen eller dra den till rutan. För GPX markerar du vad som ska importeras: Vägpunkter, Rutter, ”Spår (med spårgeometri)”. För KML och KMZ markerar du ”Punkter (platsmarkeringar)” och ”Stigar (LineStrings)”.',
  'help.guide.import-places-file.step.3':
    'Rutan tar flera filer på en gång, men bara .gpx, .kml och .kmz. Alla andra filtyper, och filer över 10 MB, avvisas i dialogen och importeras inte.',
  'help.guide.import-places-file.step.4':
    'Klicka på Importera. Ett meddelande visar hur många platser som importerades. För en KML- eller KMZ-fil förblir dialogen öppen med en sammanfattning av vad som skapades och vad som hoppades över.',
  'help.guide.import-places-file.result':
    'Platserna finns i listan. Ett spår har en färgad linje på sin rad, ritas på kartan och får ett eget filter Spår.',
  'help.guide.import-places-file.tip.1':
    'En fil som är för stor avvisas, och TREK visar storleksgränsen. Exportera den igen utan foton, eller dela upp den.',
  'help.guide.import-places-file.tip.2': 'Du kan ångra hela importen från verktygsfältet ovanför dagarna.',
  // import-places-list
  'help.guide.import-places-list.title': 'Importera en delad lista från Google Maps eller Naver Maps',
  'help.guide.import-places-list.goal': 'Importera platser från en länk till en delad lista.',
  'help.guide.import-places-list.step.1':
    'Klicka på Importera platser, ikonknappen bredvid lägg till-knappen, och välj Importera lista.',
  'help.guide.import-places-list.step.2':
    'Välj Google-lista eller Naver-lista under Leverantör och klistra in listans delade länk i Länk. En Google Maps-länk med vägbeskrivning fungerar också: dess stopp blir platser, i körordning.',
  'help.guide.import-places-list.step.3': 'Klicka på ”Importera”.',
  'help.guide.import-places-list.result':
    'Alla platser i listan ligger i resan, med samma namn som i listan. Platser som redan finns i resan hoppas över.',
  'help.guide.import-places-list.tip.1':
    'Listan måste vara delad offentligt. Länken till en privat lista importerar ingenting.',
  'help.guide.import-places-list.tip.2':
    'Berika platser via Google visas i dialogrutan när din TREK har en Google-nyckel: den slår upp varje importerad plats och fyller i foton, adress och detaljer.',
  'help.guide.sort-places.title': 'Sortera platslistan',
  'help.guide.sort-places.goal':
    'Sortera listan efter namn, efter betyg eller efter vad som lades till eller ändrades senast.',
  'help.guide.sort-places.step.1':
    'Klicka på Sortera efter, pilknappen i slutet av filterraden. En bock markerar den aktuella ordningen, och knappens verktygstips visar dess namn.',
  'help.guide.sort-places.step.2':
    'Välj en ordning, till exempel Högst betyg, eller sortera efter namn. Listan uppdateras direkt.',
  'help.guide.sort-places.result': 'Listan visar platserna i den ordning du valde, tills du väljer en annan.',
  'help.guide.sort-places.tip.1':
    'Alla sorteringsordningar utom Senast tillagda markerar knappen, så att du direkt ser att listan är sorterad på ett annat sätt.',
  'help.guide.sort-places.tip.2':
    'Sorteringen ändrar bara listan. Dagarna behåller sin egen ordning, och webbläsaren kommer ihåg den ordning som du valde.',
  'help.guide.place-by-hand.title': 'Lägg till en plats som sökningen inte känner till',
  'help.guide.place-by-hand.goal':
    'Ange en plats själv, med telefonnummer, e-postadress och öppettider, när platssökningen inte hittar något.',
  'help.guide.place-by-hand.step.1':
    'Skriv namnet i sökfältet i platsdialogen och tryck på Enter. Om inget hittas meddelar dialogen det och erbjuder ”Lägg till själv”.',
  'help.guide.place-by-hand.step.2':
    'Klicka på ”Lägg till själv”. Det du sökte efter blir namnet, och dialogen scrollar till kontaktfälten.',
  'help.guide.place-by-hand.step.3': 'Fyll i Telefon och E-post om du känner till dem.',
  'help.guide.place-by-hand.step.4':
    'Klicka på Lägg till öppettider och ange när platsen öppnar och stänger varje dag. Kopieringsknappen ger alla dagar samma tider som den första, och en dags reglage markerar den som Stängd.',
  'help.guide.place-by-hand.step.5': 'Klicka på Lägg till.',
  'help.guide.place-by-hand.result':
    'Platsen läggs till i listan. Dess detaljer visar telefonnumret, e-postadressen och öppettiderna som du angav, precis som för en plats som sökningen hittade.',
  'help.guide.place-by-hand.tip.1':
    'När du redigerar en plats utan egna öppettider kopieras öppettiderna automatiskt från Platsdetaljer till vänster. Om den redan har öppettider kopierar en knapp bredvid dem de uppslagna tiderna.',
  'help.guide.place-by-hand.tip.2':
    'Öppettider som du har angett ersätter de uppslagna, så att ett kafé med säsongsöppettider visar de tider du känner till.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Dagar',
  'help.ctx.trip-days.summary':
    'Planens vänstra kolumn: ett kort per dag med stoppen i ordning, noteringarna, dagens bokningar och transporter samt rutten mellan stoppen. Det är här resan faktiskt planeras.',
  'help.ctx.trip-days.bullet.1':
    'Rubrikraden högst upp: Exportera (PDF, kalender, GPX) till vänster. Till höger finns ångra-pilen, Expandera alla dagar / Dölj alla dagar, Sortera om dagar och Visa alla bokningsvägar när en bokning har en rutt att rita.',
  'help.ctx.trip-days.bullet.2':
    'Ett dagkort: en ruta med dagens nummer och prognosen, titeln (Dag 1 tills du ger dagen ett namn) och datumet, och under dem piller för nattens vistelse (grönt vid incheckning, rött vid utcheckning, streckat så länge den inte är bekräftad; biljettikonen öppnar bokningen) och för en hyrbil. Klicka på rubriken för att öppna dagen, vinkeln fäller ihop den, och + (Lägg till i denna dag) öppnar en meny: Lägg till plats den här dagen, Lägg till boende, Lägg till transport, Kollektivtrafik och Lägg till notering. Högerklickar du på rubriken får du samma meny, plus Töm dagen.',
  'help.ctx.trip-days.bullet.3':
    'Inne i en dag: stoppen i ordning, var och ett med bild, kategoriikon, namn, tid och beskrivning, bokningarna som är kopplade till det och vem som följer med, samt anteckningar och dagens bokningar och transporter, färgade efter typ. Håll pekaren över ett stopp för att se dess handtag, låset på bilden, pilarna, Lägg till bokning och de tre prickarna (Fler alternativ). Du kan också högerklicka på stopp och anteckningar för att öppna deras meny.',
  'help.ctx.trip-days.bullet.4':
    'På den öppna dagen, när den har två stopp, visas ruttfältet under dem: Rutt visar dagen på kartan och visar restiden för varje sträcka mellan stoppen, de tre ikonerna ställer in Bil, Till fots eller Cykel för dagen, därefter kommer Optimera, Öppna i Google Maps och Öppna i CoMaps.',
  'help.ctx.trip-days.bullet.5':
    'Du kan lägga till platser på en dag på flera sätt: dra en rad från platskolumnen, använd + Dag på raden, använd Lägg till plats den här dagen från dagens + eller på en tom dag, eller använd platsens detaljer.',
  'help.ctx.trip-days.bullet.6':
    'Totala kostnaden längst ned summerar utgifterna från Kostnader som hör till dagens stopp och bokningar, var och en en gång, i din visningsvaluta.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Läs en dag',
  'help.guide.read-day-plan.goal': 'Förstå vad varje del av ett dagskort betyder innan du ändrar något.',
  'help.guide.read-day-plan.step.1':
    'Rubriken: en ruta med dagens nummer och prognosen, därefter Dag 1 eller titeln som du gav dagen, och datumet. Under dem finns etiketter för nattens boende (grönt vid incheckning, rött vid utcheckning, streckat så länge det inte är bekräftat; biljetten på den öppnar bokningen) och en hyrbil. Klicka på rubriken för att öppna dagen (detaljpanelen öppnas över kartan). Med + till höger (Lägg till i denna dag) lägger du till en plats, ett boende, en transport, en kollektivtrafikförbindelse eller en notering, och pilen viker ihop kortet.',
  'help.guide.read-day-plan.step.2':
    'Ett stopp visar bild, kategoriikon och namn, sedan tiden när det har en Start, och beskrivningen. ”Anteckningar för denna dag” visas under det. När du håller pekaren över raden visas kontrollerna: med greppet till vänster drar du stoppet, bilden blir ett lås för ruttoptimering, och längst till höger finns pilarna (”Flytta upp”, ”Flytta ner”), ”Lägg till bokning” och de tre prickarna (”Fler alternativ”).',
  'help.guide.read-day-plan.step.3':
    'En bokning vid ett stopp visas på stoppet som ett märke Bokning, grönt när den är bekräftad och gult så länge den är väntande, med tid och transportör. Klicka på märket för att öppna bokningen. Ruttknappen bredvid ritar dess rutt. En transport har en egen rad, färgad efter sin typ, med tid samt Avgång eller Ankomst. Klicka på en bokning för att öppna dess detaljer. Där ändrar du den med Redigera.',
  'help.guide.read-day-plan.step.4':
    'Med Rutt på visar förbindelsen mellan två stopp hur lång tid sträckan tar och hur lång den är, med dagens färdsätt. Klicka på den för att byta färdsätt för just den sträckan.',
  'help.guide.read-day-plan.step.5':
    'Ruttfältet under den öppna dagens stopp: Rutt ritar dagens väg på kartan, de tre ikonerna väljer Bil, Till fots eller Cykel, Optimera sorterar om stoppen, och Öppna i Google Maps och Öppna i CoMaps öppnar dagen i respektive app.',
  'help.guide.read-day-plan.result':
    'Varje symbol på kortet har en betydelse. Guiderna nedan förklarar hur du ändrar var och en av dem.',
  'help.guide.read-day-plan.tip.1':
    'Högerklicka på ett stopp, eller klicka på dess tre prickar, för att öppna menyn: Redigera, Ta bort från dagen, Uteslut från rutten, Öppna hemsida, Spara i samling, Radera. Navigeringsapparna finns i platsens detaljer, under Navigering.',
  'help.guide.read-day-plan.tip.2':
    'Håll muspekaren över ett stopp, så visas ”Lägg till bokning” i slutet av raden. En bokning som skapas där kopplas till det här stoppet den här dagen.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Lägg en plats på en dag',
  'help.guide.place-onto-day.goal': 'Gör en plats från listan till ett stopp på en dag, på rätt plats i ordningen.',
  'help.guide.place-onto-day.step.1':
    'Dra en rad från platskolumnen till dagkortet. Släpp den mellan två stopp för att lägga den exakt där, eller på dagens rubrik för att lägga till den sist.',
  'help.guide.place-onto-day.step.2':
    'Utan att dra: öppna dagen genom att klicka på dess rubrik och klicka sedan på det runda + i slutet av platsens rad (+ Dag), eller högerklicka på raden och välj + Dag.',
  'help.guide.place-onto-day.step.3':
    'Lägg till plats den här dagen, i dagens +-meny eller på en tom dag, öppnar platsformuläret, och den nya platsen läggs direkt till på dagen.',
  'help.guide.place-onto-day.step.4':
    'När en dag är öppen lägger Lägg till i dagen i en plats detaljer platsen på den dagen. Till dagen i rubriken för platskolumnen skapar en ny plats direkt på den öppna dagen.',
  'help.guide.place-onto-day.result':
    'Platsen är nu ett stopp på dagen. Den visas på kartan med dagens nummer, och platskolumnen räknar den under Planerat.',
  'help.guide.place-onto-day.tip.1':
    'En plats kan ligga på flera dagar: lägg den på den andra dagen från platskolumnen. Om du i stället drar ett stopp från ett dagskort till ett annat flyttas det.',
  'help.guide.place-onto-day.tip.2': 'Ångrapilen i huvudet ångrar tilldelningen.',
  'help.guide.place-onto-day.tip.3':
    'Du kan inte släppa ett stopp mellan två poster med fasta tider, eller före en bokning som redan har en tid. Planen behåller tidsordningen.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Ändra ordningen på en dag',
  'help.guide.reorder-stops.goal': 'Flytta ett stopp uppåt eller nedåt, eller till en annan dag.',
  'help.guide.reorder-stops.step.1':
    'Håll pekaren över stoppet och dra det i handtaget till den nya positionen i kortet.',
  'help.guide.reorder-stops.step.2':
    'Eller använd pilarna i högra änden av stoppet du pekar på (Flytta upp, Flytta ner): ett steg per klick.',
  'help.guide.reorder-stops.step.3':
    'Dra stoppet till ett annat dagkort för att flytta det dit. Det tas bort från den gamla dagen.',
  'help.guide.reorder-stops.step.4':
    'Om ett stopp har en fast tid och en flytt skulle bryta dagens ordning frågar TREK Ta bort tid?, eftersom tiden avgör stoppets plats. Godkänn tar bort tiden så att stoppet kan hamna var som helst. Avbryt lämnar dagen som den var.',
  'help.guide.reorder-stops.result': 'Rutten och restiderna uppdateras direkt efter den nya ordningen.',
  'help.guide.reorder-stops.tip.1':
    'En bokning med fast tid ligger kvar på den plats som tiden ger. Om du släpper den någon annanstans på dagen flyttas den tillbaka. Om du drar den till ett annat dagkort flyttas den till den dagen.',
  'help.guide.reorder-stops.tip.2':
    'Optimera i ruttfältet ordnar hela dagen efter kortaste väg när dagen har tre stopp eller fler. Lås först ett stopp om det ska stanna där det är.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Ge ett stopp en tid',
  'help.guide.set-stop-times.goal': 'Ange när ett stopp börjar och slutar, så att dagen fungerar som ett schema.',
  'help.guide.set-stop-times.step.1':
    'Högerklicka på stoppet, eller klicka på dess tre punkter, och välj Redigera. När du öppnar formuläret från dagen har det Börjar och Slutar för den dagen, direkt under platsen.',
  'help.guide.set-stop-times.step.2':
    'Ange ”Börjar” och, om du vill, ”Slutar”. ”Tidsöverlappning med:” varnar för att ett annat tidsatt stopp samma dag överlappar. Om ”Slutar” ligger före ”Börjar” går det inte att klicka på ”Uppdatera”.',
  'help.guide.set-stop-times.step.3':
    'Klicka på ”Uppdatera”. Stoppet får en tidsbricka och flyttas till rätt plats i dagen efter sin tid.',
  'help.guide.set-stop-times.result':
    'Tidsatta stopp behåller sin plats i ordningen. Stopp utan tid sorteras in runt dem.',
  'help.guide.set-stop-times.tip.1':
    'Tiden hör till stoppet på den dagen. Samma plats en annan dag kan ha en annan tid.',
  'help.guide.set-stop-times.tip.2':
    'Om du vill flytta ett stopp med tid för hand drar du det. TREK frågar Ta bort tid?, och när du klickar på Godkänn tas tiden bort.',
  'help.guide.set-stop-times.tip.3':
    'Anteckningar för denna dag i samma formulär är till för information som bara gäller den här dagen, till exempel en bordsbokning eller ett biljettnummer.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Ta bort ett stopp från en dag',
  'help.guide.remove-from-day.goal': 'Ta bort en plats från en dag utan att radera den från resan.',
  'help.guide.remove-from-day.step.1':
    'Högerklicka på stoppet, eller klicka på dess tre prickar, och välj Ta bort från dagen.',
  'help.guide.remove-from-day.step.2':
    'Stoppet tas bort från dagen. Platsen finns kvar i platskolumnen, under ”Oplanerat” om den inte ligger på någon annan dag.',
  'help.guide.remove-from-day.result': 'Dagen, dess rutt och dess kostnad uppdateras. Ångra-pilen återställer stoppet.',
  'help.guide.remove-from-day.tip.1': 'Radera i samma meny tar bort platsen från hela resan, alla dagar inräknade.',
  'help.guide.remove-from-day.tip.2': 'Ta bort från dag finns också i platsens detaljpanel, bredvid Lägg till i dagen.',
  // lock-stop
  'help.guide.lock-stop.title': 'Lås ett stopp på plats',
  'help.guide.lock-stop.goal': 'Behåll ett stopp på sin plats när rutten optimeras.',
  'help.guide.lock-stop.step.1':
    'Håll muspekaren över stoppets bild och klicka på låset: ”Behåll positionen under ruttoptimeringen”.',
  'help.guide.lock-stop.step.2':
    '”Optimera” sorterar nu de andra stoppen runt det. Klicka på låset igen (”Klicka för att låsa upp”) för att låsa upp det.',
  'help.guide.lock-stop.result': 'Låset visas på bilden, och stoppet behåller sin plats tills du låser upp det.',
  'help.guide.lock-stop.tip.1': 'Ett stopp med fast tid är låst av sin tid och flyttas aldrig under optimeringen.',
  'help.guide.lock-stop.tip.2':
    'Låset gäller bara tills du laddar om sidan. Efter en omladdning är alla stopp upplåsta igen, och bara stopp med tid förblir fasta.',
  // day-note
  'help.guide.day-note.title': 'Lägg till en notering på en dag',
  'help.guide.day-note.goal': 'Spara en påminnelse, ett biljettnummer eller en reservplan i dagen.',
  'help.guide.day-note.step.1': 'Klicka på + i dagens rubrik (Lägg till i denna dag) och välj Lägg till notering.',
  'help.guide.day-note.step.2':
    'Skriv anteckningens namn högst upp i dialogen, där det står ”Notering”. Dagkortet visar det namnet. Skriv resten under ”Daglig notering”: verktygsfältet ovanför formaterar texten (fet stil, listor, länkar, citat), och ”Förhandsgranskning” till vänster visar hur raden kommer att se ut.',
  'help.guide.day-note.step.3':
    'Välj en ”Ikon” och en ”Färg”, så att noteringen är lätt att skilja från stoppen, och klicka sedan på ”Lägg till”.',
  'help.guide.day-note.step.4':
    'Anteckningen visas i dagen som ett stopp: dra den på plats eller använd dess pilar. Klicka på den för att redigera den. Radera finns i dialogen och i menyn under de tre prickarna eller högerklicksmenyn, och frågar först ”Radera notering?”.',
  'help.guide.day-note.result': 'Anteckningen blir en del av dagen och av PDF:en, på platsen dit du drog den.',
  'help.guide.day-note.tip.1':
    'Länkar i en anteckning öppnas i en ny flik, och ett enkelt radbrott förblir ett radbrott.',
  'help.guide.day-note.tip.2': 'Noteringar gäller en dag i taget. En notering för hela resan lägger du i Samarbete.',
  // day-route
  'help.guide.day-route.title': 'Visa och optimera dagens rutt',
  'help.guide.day-route.goal': 'Se rutten mellan stoppen, välj hur du reser och låt TREK sortera ordningen.',
  'help.guide.day-route.step.1':
    'Öppna dagen och klicka på Rutt i ruttfältet under dess stopp: vägen mellan stoppen ritas på kartan, och förbindelserna mellan stoppen visar tid och avstånd för varje sträcka.',
  'help.guide.day-route.step.2':
    'De tre ikonerna bredvid ställer in dagens färdsätt: Bil, Till fots eller Cykel. Sträckorna räknas om. Plugins kan lägga till egna färdsätt.',
  'help.guide.day-route.step.3':
    'Klicka på en förbindelse för att ändra färdsätt för just den sträckan: välj ett färdsätt, Kollektivtrafik för att söka en förbindelse där det finns, eller Använd dagens standard för att återgå till dagens färdsätt.',
  'help.guide.day-route.step.4':
    'Optimera (den cirkulära pilen) ordnar om stoppen efter kortaste väg, från tre stopp och uppåt. Stopp med lås eller fast tid behåller sin plats. Om dagen har ett boende börjar rutten där.',
  'help.guide.day-route.step.5':
    'Öppna i Google Maps eller Öppna i CoMaps öppnar hela dagen som en rutt i den appen, för navigering under resan. CoMaps använder också dagens färdsätt.',
  'help.guide.day-route.result':
    'Dagen är en rutt med tider. Totala kostnaden och sträckorna uppdateras när ordningen ändras.',
  'help.guide.day-route.tip.1':
    'Rutterna kommer som standard från OSRM. Administratören kan ställa in att TREK använder en annan ruttmotor under Användarinställningar.',
  'help.guide.day-route.tip.2':
    'En sträcka som inte kunde ruttas visar ingen tid. Kontrollera att båda stoppen har koordinater.',
  'help.guide.day-route.tip.3': 'Ångra-pilen tar tillbaka en optimering.',
  // manage-days
  'help.guide.manage-days.title': 'Lägg till, ordna om och byt namn på dagar',
  'help.guide.manage-days.goal': 'Ändra själva dagarna, inte bara platserna på dem.',
  'help.guide.manage-days.step.1':
    'Dagarna följer resans datum. Ändra datumen i resans redigeringsformulär på Översikt, så läggs dagar till eller tas bort i början eller slutet. Innan en dag med innehåll tas bort visar en lista vilka dagar som försvinner och vad som ligger på dem.',
  'help.guide.manage-days.step.2':
    'Sortera om dagar i rubrikraden öppnar en lista: dra en dag i handtaget, eller använd Flytta upp och Flytta ner, så flyttas dagen med sina platser, anteckningar och bokningar. Under listan lägger Lägg till med nästa datum till en dag efter den sista dagen med datum och förlänger resan med en dag. Utan datum lägger till en dag utan datum. En resa utan datum har bara Lägg till dag.',
  'help.guide.manage-days.step.3':
    'Ta bort dag, papperskorgen i slutet av en rad, frågar först. Den listar vad som tas bort med dagen: dess platser, anteckningar och bokningar, en vistelse som checkar in eller ut på dagen, samt de dagar som flyttas ett datum tidigare. Ta bort dag tar bort dagen och Avbryt behåller den. Den sista dagen kan inte tas bort.',
  'help.guide.manage-days.step.4':
    'Om du vill byta namn på en dag öppnar du den och klickar på pennan bredvid titeln i detaljpanelen över kartan. Namnet ersätter Dag 1 på kortet och i PDF:en.',
  'help.guide.manage-days.step.5':
    'Expandera alla dagar och Dölj alla dagar i rubrikraden fäller ut eller ihop alla kort på en gång. Om du vill fälla ihop ett enskilt kort klickar du på dess vinkel.',
  'help.guide.manage-days.result':
    'Datumen följer positionen: när du flyttar en dag uppåt får den det tidigare datumet, och dess stopp, noteringar och bokningar följer med.',
  'help.guide.manage-days.tip.1': 'Flyttade dagar kan ångras med ångra-pilen. Raderade dagar kan inte återställas.',
  'help.guide.manage-days.tip.2':
    'Totala kostnaden längst ned i planen summerar hela resan. Fliken Kostnader visar fördelningen.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Läs bokningar och transporter i planen',
  'help.guide.bookings-in-plan.goal': 'Se var en bokning visas när den väl finns och vilken skärm som skapar den.',
  'help.guide.bookings-in-plan.step.1':
    'En transport (flyg, tåg, färja, buss, bil) är en rad som är färgad efter sin typ, med tid och Avgång på dagen den avgår eller Ankomst på dagen den kommer fram. Jordgloben bredvid anger tidszonen, och ett flyg med mellanlandning får en rad per sträcka. För en kollektivtrafikförbindelse visar du dess linjer genom att klicka på pilen. Klicka på en rad så öppnas bokningen. Redigera där ändrar den.',
  'help.guide.bookings-in-plan.step.2':
    'En bokning som är kopplad till ett stopp (en restaurang, en rundtur) visas som en bricka med texten ”Bokning” på det stoppet, med sin tid. Brickan är grön när bokningen är bekräftad och bärnstensfärgad medan den väntar. En bokning med en dag men utan stopp har en egen rad i dagen.',
  'help.guide.bookings-in-plan.step.3':
    'En hotellnatt är ett boende: pillret i dagens huvud är grönt vid incheckning och rött vid utcheckning, och biljettikonen öppnar bokningen. Dagens detaljpanel listar boendet under Boende, och rutten för var och en av de dagarna börjar där.',
  'help.guide.bookings-in-plan.step.4':
    'På kartan ritar ruttknappen på en bokningsrad bokningens rutt. Visa alla bokningsvägar i rubrikraden ritar alla.',
  'help.guide.bookings-in-plan.step.5':
    'Skapa: Lägg till bokning på ett stopp du pekar på, Lägg till transport och Kollektivtrafik i dagens +-meny, samt flikarna Bokningar och Transporter för hela listan med import och filer.',
  'help.guide.bookings-in-plan.result':
    'Varje bokning visas en gång i planen. Flikarna visar samma bokningar som en lista.',
  'help.guide.bookings-in-plan.tip.1':
    'Bekräftat och väntande är en status du sätter på bokningen. Planen visar den på stoppet, och fliken Bokningar räknar båda.',
  'help.guide.bookings-in-plan.tip.2':
    'Om du släpper en bokning med tid någon annanstans på dagen flyttas den tillbaka till den plats som tiden ger. Om du drar den till ett annat dagkort flyttas den till den dagen. Om du vill ändra tiden redigerar du bokningen.',
  // export-plan
  'help.guide.export-plan.title': 'Exportera planen',
  'help.guide.export-plan.goal': 'Exportera planen som ett dokument, till din kalender eller till en GPS.',
  'help.guide.export-plan.step.1': 'Klicka på Exportera längst till vänster i rubrikfältet ovanför dagarna.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF öppnar utskriftsvyn med varje dag, med stopp, anteckningar och bokningar, och inleds av en ruttöversiktskarta. Min plan som PDF tar bara med det du deltar i. I vyn startar Sidbrytning per dag varje dag på en ny sida, Anteckningar om transporter lägger till anteckningarna från dina transporter, och Spara som PDF laddar ner den.',
  'help.guide.export-plan.step.3':
    'Kalender: Ladda ner .ics sparar bokningarna som en kalenderfil. Prenumerera på kalender ger en länk som din kalenderapp uppdaterar automatiskt.',
  'help.guide.export-plan.step.4':
    'Kartor och GPS (GPX): Hela resan exporterar platser, dagsrutter och spår. Bara platser exporterar nålarna. Dagar som rutter exporterar en rutt per dag, för offlinekartor och GPS-enheter.',
  'help.guide.export-plan.result': 'Filen laddas ner. Ingenting i resan ändras.',
  'help.guide.export-plan.tip.1':
    'För att öppna en enskild dag i en kartapp använder du dess ruttfält: ”Öppna i Google Maps” eller ”Öppna i CoMaps”.',
  'help.guide.export-plan.tip.2':
    '”Prenumerera på kalender” kräver att kalenderflöden är påslagna i dina inställningar och att du har rätt att dela resan; Översikt har en guide om det.',
  'help.guide.export-plan.tip.3':
    'För att exportera räcker läsbehörighet: alla medlemmar i resan kan exportera PDF:en, .ics och GPX.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Platsdetaljer',
  'help.ctx.trip-place.summary':
    'Kortet som öppnas över kartan när du väljer en plats: allt som resan vet om den, stjärnbetygen som alla har gett den, dess bild och filer, och knapparna som lägger till den på den öppna dagen, öppnar den i en kartapp eller sparar den i en lista.',
  'help.ctx.trip-place.bullet.1':
    'Klicka på en rad i platskolumnen, ett stopp inne i en dag eller en markör på kartan, så öppnas kortet över kartan. Om du öppnar det från en dag vet kortet vilket stopp du menar, och det visar också stoppets deltagare och bokning. En tur (en vandring, en ritt eller en promenad från fliken Turer) öppnar i stället ett eget turkort.',
  'help.ctx.trip-place.bullet.2':
    'Rubriken visar den runda bilden, namnet, adressen på en rad och etiketter för det som är känt: öppen eller stängd, kategori, tid, pris, telefonnummer, e-post och koordinater. Klicka på bilden för att använda en egen eller ett foto från platsens filer. Dubbelklicka på namnet för att byta namn på platsen. X:et till höger stänger kortet. Bilden, namnbytet, Redigera och Radera är bara tillgängliga för resenärer som får ändra platser.',
  'help.ctx.trip-place.bullet.3':
    'Därunder: stjärnorna som varje resenär gav platsen, beskrivningen och noteringarna, samt ”Anteckningar för denna dag” när stoppet har några.',
  'help.ctx.trip-place.bullet.4':
    'Öppettider, Spårfärg, Spåra statistik och Filer kommer därefter, i den mån de gäller. Ladda upp i rubriken Filer lägger till filer från din dator, och listan visar även filerna som är fästa vid det här stoppet och de som hör till dess bokning, inklusive ett hotells bekräftelse. Plugin kan lägga till egna rader nedanför.',
  'help.ctx.trip-place.bullet.5':
    'Raden längst ned: Lägg till i dagen eller Ta bort från dag medan en dag är öppen, därefter Navigering (eller namnet på din kartapp, när du har valt en i Inställningar), Öppna hemsida och Spara i samling. Till höger raderar den röda papperskorgen platsen och Redigera öppnar dess formulär.',
  'help.ctx.trip-place.bullet.6':
    'En plats som du har valt i sökningen visar vad TREK-indexet eller OpenStreetMap vet om den: Öppen eller Stängd bland pillren högst upp, med en grön eller röd ring runt bilden, utifrån platsens lokala tid; telefonnumret, också som ett piller; Öppettider längre ned, med dagens tider på raden och hela veckan efter ett klick; och hemsidan under ”Öppna hemsida”. Googles betyg visas bara på en plats som hittats via Google, i en TREK med Google-nyckel. Öppettider, telefonnummer och e-post som du själv har skrivit in i platsens formulär ersätter de uppslagna och avgör även ringens färg.',
  // read-place
  'help.guide.read-place.title': 'Vad kortet visar om en plats',
  'help.guide.read-place.goal': 'Läs allt resan vet om en plats, samlat i ett kort.',
  'help.guide.read-place.step.1':
    'Klicka på stoppet du vill läsa om i dagkolumnen. Kortet öppnas över kartan, och stoppet förblir markerat på sin dag.',
  'help.guide.read-place.step.2':
    'Överst: den runda bilden, namnet och adressen på en rad. Verktygstipset visar hela adressen. Pillren under säger Öppen eller Stängd just nu, efter platsens lokala tid, med en grön eller röd ring runt bilden som motsvarar det. De visar också kategorin, tiden, telefonnumret och e-postadressen (klicka för att öppna telefon- eller e-postappen) och, på en bred skärm, de exakta koordinaterna. X till höger stänger kortet.',
  'help.guide.read-place.step.3':
    'Betyg är det första avsnittet under rubriken: stjärnorna som varje resenär gav platsen, med medelvärdet och hur många som har röstat. Det visar Inte betygsatt ännu så länge ingen har röstat.',
  'help.guide.read-place.step.4':
    'Sedan kommer beskrivningen och, under den, noteringarna. Båda är texten från platsens formulär, med formatering: listor, länkar och fetstil fungerar.',
  'help.guide.read-place.step.5':
    '”Deltagare” visar vilka som följer med till det här stoppet. Alla ingår tills du tar bort någon.',
  'help.guide.read-place.step.6':
    '”Öppettider”, längre ner: raden visar tiderna för dagen du tittar på. Klicka på den för att se hela veckan, med den dagen i fetstil. ”Filer” ligger bredvid.',
  'help.guide.read-place.result':
    'Kortet förblir öppet tills du stänger det med X eller väljer en annan plats. Veckans öppettider förblir utfällda, och stoppet som platsen hör till förblir markerat i dagkolumnen.',
  'help.guide.read-place.tip.1':
    'När du väljer platsen i platskolumnen visar kortet platsen men inte ett stopp. Då visas inga deltagare, och bara de bokningar som hör till själva platsen, till exempel ett hotells vistelse. Välj stoppet inne i dagen för att se allt.',
  'help.guide.read-place.tip.2':
    'Om du får ändra platser kan du dubbelklicka på namnet för att byta namn på platsen utan att öppna formuläret. Enter sparar, Escape avbryter ändringen.',
  'help.guide.read-place.tip.3':
    'En plats som skrivits in för hand har bara de uppgifter som angetts i formuläret. Klicka på Redigera och fyll i Telefon, E-post och öppettiderna själv, eller välj platsen bland förslagen under Sök platser… och klicka på Uppdatera för att hämta dem. Googles betyg kräver en Google-nyckel.',
  // rate-place
  'help.guide.rate-place.title': 'Betygsätt en plats',
  'help.guide.rate-place.goal': 'Ge en plats dina egna stjärnor och se betygen som alla andra gav den.',
  'help.guide.rate-place.step.1':
    'Öppna platsen. Stjärnraden ligger direkt under rubriken och visar medelvärdet av rösterna hittills, med antalet röster inom parentes.',
  'help.guide.rate-place.step.2':
    'Klicka på stjärnan du vill ge. Stjärnorna fylls medan du för pekaren över dem, så du ser vilket betyg du ger.',
  'help.guide.rate-place.step.3':
    'Din röst räknas direkt in i medelvärdet, och ansiktena bredvid visar vilka som har röstat. Håll muspekaren över raden för att se allas stjärnor.',
  'help.guide.rate-place.step.4':
    'Samma medelvärde visas på platsens rad i platskolumnen, så att du lätt hittar de bästa platserna i listan.',
  'help.guide.rate-place.result':
    'Alla i resan kan se dina stjärnor på platsen. Stjärnan i filterraden ovanför listan kan nu bara visa platser med minst ett visst betyg.',
  'help.guide.rate-place.tip.1':
    'Alla resenärer får betygsätta, även på en resa där bara några av er får ändra platser.',
  'help.guide.rate-place.tip.2':
    'Klicka på stjärnan du redan har gett för att ta bort ditt betyg. När ingen har betygsatt platsen står det Inte betygsatt ännu igen.',
  'help.guide.rate-place.tip.3':
    'Upp till sex som har röstat visas som ansikten bredvid stjärnorna. Verktygstipset listar alla och markerar dig.',
  // place-image
  'help.guide.place-image.title': 'Sätt din egen bild på en plats',
  'help.guide.place-image.goal': 'Byt ut den automatiska miniatyrbilden mot ett eget foto.',
  'help.guide.place-image.step.1': 'Öppna platsen från platskolumnen.',
  'help.guide.place-image.step.2':
    'Peka på den runda bilden i rubriken: en kamera visas och verktygstipset lyder Ladda upp bild. Klicka på den och välj din fil. Om platsen redan har foton bland sina filer ber TREK dig först välja: Ladda upp från enhet, eller en av bilderna under Från bifogade filer.',
  'help.guide.place-image.step.3': 'Överst på kortet visas nu din bild, med ett litet rött X i hörnet.',
  'help.guide.place-image.step.4':
    'Samma bild visas också på platsens rad i platskolumnen och på dess markör på kartan.',
  'help.guide.place-image.result':
    'Din bild används för platsen överallt: på kortet, i platskolumnen, på stoppet i dagen, på markören på kartan och i en delad resa.',
  'help.guide.place-image.tip.1':
    'JPG, PNG, GIF och WebP godtas, och en HEIC-bild från en iPhone konverteras när du laddar upp den.',
  'help.guide.place-image.tip.2':
    'X i hörnet tar bort din bild, och den automatiska bilden visas igen. Själva platsen ändras inte.',
  'help.guide.place-image.tip.3':
    'Om du inte har lagt till någon bild söker TREK efter en utifrån platsens koordinater. Hittas ingen visas kategorins ikon. Bara resenärer som får ändra platser kan sätta en bild.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Lägg till platsen på den öppna dagen, eller ta bort den',
  'help.guide.place-day-assign.goal': 'Använd knappen på kortet i stället för att dra raden över planeraren.',
  'help.guide.place-day-assign.step.1':
    'Klicka på en dags rubrik i dagkolumnen. Den dagen är nu den öppna dagen, och kortet gäller den.',
  'help.guide.place-day-assign.step.2':
    'Klicka på en plats i platskolumnen som inte ligger på den dagen. Dess kort öppnas, och raden längst ner erbjuder Lägg till i dagen.',
  'help.guide.place-day-assign.step.3':
    'Klicka på Lägg till i dagen. Stoppet läggs sist på dagen och knappen blir Ta bort från dag.',
  'help.guide.place-day-assign.step.4': 'Stoppet ligger nu på dagen, sist i listan. Dra det uppåt till rätt position.',
  'help.guide.place-day-assign.step.5':
    'Ta bort från dag tar bort stoppet från dagen igen, och kortet visar Lägg till i dagen igen.',
  'help.guide.place-day-assign.result':
    'Stoppet läggs till på dagen eller tas bort från den. Själva platsen ändras inte.',
  'help.guide.place-day-assign.tip.1':
    'Knappen finns bara medan en dag är öppen. Utan en öppen dag finns ingen dag att lägga platsen på.',
  'help.guide.place-day-assign.tip.2':
    'Om du tar bort ett stopp från en dag finns platsen kvar i resan och i platskolumnen. Radera tar bort den överallt.',
  'help.guide.place-day-assign.tip.3':
    'Ett stopp som en bokning av boende har lagt till på dagen visar ingen av knapparna. Du lägger till och tar bort den natten i dagens övernattningsblock.',
  // place-participants
  'help.guide.place-participants.title': 'Ange vilka som följer med till det här stoppet',
  'help.guide.place-participants.goal': 'Välj vem som går till ett stopp utan att ändra vilka som är med på resan.',
  'help.guide.place-participants.step.1':
    'Klicka på stoppet inne i dagen. Kortet öppnas och Deltagare listar alla på resan.',
  'help.guide.place-participants.step.2':
    'Klicka på en resenärs bricka för att ta bort personen från det här stoppet. När du håller muspekaren över brickan stryks namnet över.',
  'help.guide.place-participants.step.3':
    'Ett streckat + visas så fort någon saknas. Klicka på det för att se vilka som inte är med på stoppet.',
  'help.guide.place-participants.step.4':
    'Klicka på ett namn för att lägga till personen igen. När alla är tillagda igen tillhör stoppet hela gruppen igen.',
  'help.guide.place-participants.result':
    'Stoppet visar bara de resenärer du valde. Resten av gruppen är ledig vid den tiden.',
  'help.guide.place-participants.tip.1':
    'Deltagare visas bara när ett stopp är valt, så välj platsen inne i dagen och inte i platskolumnen. Fältet visas också bara på en resa med fler än en resenär.',
  'help.guide.place-participants.tip.2':
    'Om ingen är vald går alla. Därför kan du inte ta bort den sista resenären från ett stopp.',
  'help.guide.place-participants.tip.3':
    'En gäst, som inte har något eget konto, kan vara deltagare precis som alla andra.',
  // place-booking
  'help.guide.place-booking.title': 'Bokningen på ett stopp',
  'help.guide.place-booking.goal':
    'Se bokningen som hör till ett stopp, öppna den och koppla en ny bokning till stoppet.',
  'help.guide.place-booking.step.1':
    'Öppna stoppet som bokningen hör till. På kortet visas bokningen under Bokningar som ett litet eget kort, med bokningens namn och Bekräftat eller Väntande.',
  'help.guide.place-booking.step.2':
    'Bokningskortet visar Datum, Tid och Bokningskod, etiketter för andra uppgifter om bokningen (ett flygnummer, en plattform, incheckning) och eventuella anteckningar till bokningen.',
  'help.guide.place-booking.step.3': 'Klicka på bokningskortet. Bokningen öppnas ovanpå kartan.',
  'help.guide.place-booking.step.4':
    'Redigera längst ner i bokningen öppnar bokningens eget formulär. I det formuläret kopplar Länk till dagsuppgift en bokning till ett stopp, och här visar den redan det här stoppet. Stäng formuläret igen.',
  'help.guide.place-booking.step.5':
    'En ny bokning för ett stopp startar du i dagkolumnen: håll muspekaren över stoppet och klicka på Lägg till bokning, biljettikonen i dess ände. Formuläret öppnas som Ny bokning, redan länkat till stoppet.',
  'help.guide.place-booking.result':
    'Bokningen är länkad till stoppet: den visas på kortet och i dagen, och dess filer listas också under Filer här.',
  'help.guide.place-booking.tip.1':
    'En bokning visas på stoppet den är fäst vid, och en hotellbokning visas också på hotellet, var du än öppnar det. En bokning utan stopp visas på fliken Bokningar.',
  'help.guide.place-booking.tip.2':
    'Flera bokningar kan dela ett stopp, till exempel en lunch och en rundtur som börjar på samma plats.',
  'help.guide.place-booking.tip.3':
    'För ett tåg, ett flyg eller en färja öppnar Redigera i stället transportformuläret, det som fliken Transporter använder.',
  // place-files
  'help.guide.place-files.title': 'Behåll en plats biljetter hos platsen',
  'help.guide.place-files.goal': 'Bifoga biljetten, vouchern eller kartan till den plats den hör till.',
  'help.guide.place-files.step.1':
    'Öppna platsen. Filer finns under dess detaljer, bredvid Öppettider om platsen har sådana, och visar Filer så länge platsen inte har några.',
  'help.guide.place-files.step.2': 'Klicka på Ladda upp till höger om rubriken Filer och välj filen.',
  'help.guide.place-files.step.3': 'Knappen visar hur många filer platsen har, och listan öppnas automatiskt.',
  'help.guide.place-files.step.4': 'Varje rad visar filens namn och storlek. Klicka på raden för att öppna filen.',
  'help.guide.place-files.result':
    'Filen är bifogad till platsen och räknas på kortet. Den visas också i resans flik Filer.',
  'help.guide.place-files.tip.1':
    'Filer listar också det som är fäst vid det här stoppet och det som är bifogat till dess bokning, så en hotellbekräftelse visas på hotellet.',
  'help.guide.place-files.tip.2': 'Ladda upp tar flera filer på en gång, och ett foto bland dem kan bli platsens bild.',
  'help.guide.place-files.tip.3':
    'Om du inte har behörighet att ladda upp filer visas inte knappen Ladda upp. Filer som redan finns på platsen visas fortfarande.',
  // place-navigation
  'help.guide.place-navigation.title': 'Öppna en plats i en kartapp eller på dess webbplats',
  'help.guide.place-navigation.goal': 'Öppna platsen i den navigationsapp du använder för att ta dig dit.',
  'help.guide.place-navigation.step.1': 'Öppna platsen och klicka på Navigation i raden längst ned.',
  'help.guide.place-navigation.step.2':
    'Listan visar de kartappar som passar den här platsen: Google Maps, Waze, Apple Maps, OpenStreetMap och CoMaps, plus Annan kartapp på Android.',
  'help.guide.place-navigation.step.3':
    'Klicka på den du använder. Där det går skickar TREK själva platsen till appen och inte bara koordinaterna, så att du kommer till rätt entré.',
  'help.guide.place-navigation.step.4':
    'Öppna hemsida bredvid öppnar platsens egen webbplats, med öppettider och biljetter, i en ny flik.',
  'help.guide.place-navigation.result':
    'Kartappen öppnas på platsen och hemsidan öppnas i en ny flik. Inget i resan ändras. Om TREK är installerat som app öppnas kartappen i stället för en ny flik.',
  'help.guide.place-navigation.tip.1':
    'Waze börjar navigera direkt. De andra apparna öppnar platsen, och du trycker en gång till för att starta navigeringen.',
  'help.guide.place-navigation.tip.2':
    'Vilka appar som erbjuds beror på platsen och din enhet: Apple Maps erbjuds inte på Android, 高德地图 erbjuds bara för en plats i Kina, och Waze, Apple Maps och CoMaps kräver platsens koordinater. Annan kartapp öppnar platsen i valfri kartapp på din Android-telefon.',
  'help.guide.place-navigation.tip.3':
    'Välj din kartapp en gång i Inställningar, under Öppna platser i. Knappen visar då appens namn och öppnar den direkt. Det gör den också när bara en app passar för en plats.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Spara en plats i en av dina listor',
  'help.guide.place-to-collection.goal': 'Spara en plats som du hittade på den här resan till nästa.',
  'help.guide.place-to-collection.step.1':
    'Öppna platsen och klicka på ”Spara i samling” i raden längst ned på kortet.',
  'help.guide.place-to-collection.step.2':
    'Spara i lista visar alla listor du äger eller delar. Ett fyllt bokmärke till höger markerar de listor som redan innehåller platsen.',
  'help.guide.place-to-collection.step.3': 'Klicka på listan. Platsen läggs till i den direkt.',
  'help.guide.place-to-collection.step.4': 'Stäng dialogen med X, så står det Sparad på knappen i kortet.',
  'help.guide.place-to-collection.result':
    'Platsen ligger i din lista med bild, noteringar och adress, redo för nästa resa.',
  'help.guide.place-to-collection.tip.1':
    'Knappen finns bara när tillägget Samlingar är på, vilket administratören slår på under Tillägg.',
  'help.guide.place-to-collection.tip.2':
    'En plats kan finnas i flera listor samtidigt, med olika status i varje: en idé i den ena, besökt i den andra.',
  'help.guide.place-to-collection.tip.3':
    'Markera som besökt, under platsens namn högst upp i väljaren, markerar platsen som besökt i listan. Om platsen finns i flera av dina listor står det Besökt överallt på knappen, och den markerar platsen i alla listor på en gång. Vy öppnar dina listor i Samlingar.',
  // place-track
  'help.guide.place-track.title': 'Läs ett spår och ge det en egen färg',
  'help.guide.place-track.goal':
    'Se hur lång en importerad vandring är och vilken linje på kartan som är den vandringen.',
  'help.guide.place-track.step.1':
    'Ett spårs rad i platskolumnen visar ett kort streck i samma färg som spåret har på kartan. Klicka på den.',
  'help.guide.place-track.step.2': '”Spåra statistik” visar stigens längd, i de enheter du har ställt in.',
  'help.guide.place-track.step.3':
    'Spårfärg ovanför visar färgen som används. Klicka på raden för att öppna färgrutorna.',
  'help.guide.place-track.step.4': 'Välj en färg. Linjen på kartan och strecket på raden ändras med den.',
  'help.guide.place-track.step.5':
    'Den streckade rutan till vänster, Automatisk färg, ger spåret sin standardfärg igen. Pipetten till höger öppnar systemets färgväljare för valfri annan färg.',
  'help.guide.place-track.result':
    'Spåret ritas i färgen du valde, på kortet, på sin rad i platskolumnen och på kartan.',
  'help.guide.place-track.tip.1':
    'Bara en plats med en stig har de här två blocken: en plats som importerades från en GPX-, KML- eller KMZ-fil innan Turer fanns, eller på en TREK-instans där Turer är av. När Turer är på blir en ny GPX-fil en tur, som öppnar ett eget turkort.',
  'help.guide.place-track.tip.2':
    'Ett spår som är inspelat med höjder visar också sin högsta och lägsta punkt, antalet höjdmeter upp och ner och vandringens höjdprofil.',
  'help.guide.place-track.tip.3':
    'Vid en import får varje spår som läggs till sin egen färg, så att två vandringar aldrig får samma färg.',
  // read-place
  'help.guide.read-place.step.7':
    'Raden längst ned visar vad du kan göra härifrån: lägga platsen på den öppna dagen eller ta bort den därifrån, öppna den i en kartapp eller på dess hemsida, spara den i en lista och, till höger, radera den (den röda papperskorgen) eller redigera den.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Filer',
  'help.ctx.trip-files.summary':
    'Alla resans dokument i en lista: biljetter, bekräftelser, wallet-kort och bilder. Varje dokument har en notering, en länk till platsen eller bokningen det hör till och en papperskorg som du kan återställa det från.',
  'help.ctx.trip-files.bullet.1':
    'Släpp filer här, den streckade rutan under fältet, tar emot filer som du släpper på den. Ett klick på den öppnar filväljaren. Rutan visar vilka filtyper den här TREK-installationen godtar och gränsen per fil (Max 50 MB, om inte en administratör har angett en annan).',
  'help.ctx.trip-files.bullet.2':
    'Fältet överst innehåller Filer och filterflikarna Alla, PDF-filer, Bilder och Dokument, var och en med sitt antal. En stjärnflik visas efter Alla så snart en fil är stjärnmärkt, och en flik Samarbetsanteckningar visas sist så snart en notering har en bilaga.',
  'help.ctx.trip-files.bullet.3':
    'En rad visar en miniatyr eller filens typ, vem som laddade upp den, namnet, noteringen under det, storleken och datumet, samt en bricka per koppling: platsen, bokningen eller transporten med sitt namn (håll muspekaren över den för att se Dagsplan, Bokning eller Transport) och Från samarbetsanteckningar.',
  'help.ctx.trip-files.bullet.4':
    'I slutet av en rad finns upp till fem ikoner, var och en med ett namn när du pekar på den: Stjärnmarkera, Tilldela (pennan), Öppna, Ladda ner och Radera. Radera frågar inte: filen flyttas till papperskorgen, där du kan återställa den. Offline fungerar en notering, en länk, en stjärna och papperskorgen fortfarande, och skickas när TREK är online igen. Bara uppladdning och borttagning av ytterligare en länk kräver en anslutning.',
  'help.ctx.trip-files.bullet.5':
    'En bild eller en video öppnas i helskärm, med piltangenter och en rad miniatyrer. Alla andra dokument öppnas i en dialogruta med namnet överst och Öppna i ny flik och Ladda ner under det. Ett plånbokskort laddas ner direkt.',
  'help.ctx.trip-files.bullet.6':
    'Papperskorgsikonen längst till höger i fältet (Papperskorgen) växlar listan till de raderade filerna. Där kan du återställa varje fil eller radera den för gott, och Töm papperskorgen i fältet raderar alla. Dokumentsynkronisering finns till vänster om papperskorgsikonen när resan är ansluten till ett dokumentlager, eller för resans ägare eller en administratör så snart ett lager är påslaget.',
  // files-upload
  'help.guide.files-upload.title': 'Lägg till ett dokument i resan',
  'help.guide.files-upload.goal':
    'Ladda upp en biljett, en bekräftelse eller ett foto från din nedladdningsmapp till resan, där alla i resan kan öppna det.',
  'help.guide.files-upload.step.1':
    'Öppna resan och klicka på ”Filer” i flikraden. Resans dokument listas där, med uppladdningsrutan ovanför.',
  'help.guide.files-upload.step.2':
    'Klicka på Släpp filer här och välj en eller flera filer. De laddas upp en efter en, och rutan visar Laddar upp... medan det pågår. I rutan, under eller klicka för att bläddra, ser du filtyperna som den här TREK-installationen godtar och den största tillåtna filstorleken.',
  'help.guide.files-upload.step.3':
    'När den sista filen har laddats upp öppnas Tilldela fil automatiskt för den (om resan har några platser eller bokningar), med filens namn överst i dialogen. Lägg till en notering... under Notering lägger till en notering på filen, och listorna under kopplar den till en plats eller en bokning. Stäng dialogen med × uppe till höger. Ingenting går förlorat när du stänger den.',
  'help.guide.files-upload.step.4':
    'De nya filerna visas överst i listan, bara stjärnmarkerade filer ligger ovanför dem. En rad visar vem som laddade upp filen, namnet, storleken och datumet. En bild får en miniatyr, alla andra filer visar sin typ.',
  'help.guide.files-upload.result': 'Dokumenten finns i resan, och alla som kan se resan kan öppna och ladda ner dem.',
  'help.guide.files-upload.tip.1':
    'Du kan också dra en fil från skrivbordet direkt till rutan. Rutan markeras medan filen ligger över den.',
  'help.guide.files-upload.tip.2':
    'Tryck på Ctrl+V för att lägga till en bild från urklipp i listan, så att du inte först behöver spara en skärmbild av en bokning.',
  'help.guide.files-upload.tip.3':
    'Att ladda upp kräver behörighet att ladda upp filer; utan den visas rutan inte alls. En filtyp som inte finns på listan nekas med ett meddelande, och inget laddas upp. En fil över gränsen (50 MB om inte en administratör har angett en annan) nekas innan något skickas, och meddelandet anger gränsen. Uppladdning kräver också en anslutning: offline meddelar TREK det och laddar inte upp något.',
  // files-link
  'help.guide.files-link.title': 'Koppla ett dokument till en plats eller en bokning',
  'help.guide.files-link.goal': 'Gör biljetten lätt att hitta från dagen den hör till, inte bara från den här listan.',
  'help.guide.files-link.step.1':
    'Klicka på pennan i slutet av raden (Tilldela). Tilldela fil öppnas, med filens namn överst i dialogen.',
  'help.guide.files-link.step.2':
    'Under Notering tar Lägg till en notering... en rad, som sedan visas under filens namn i listan. Den sparas när du trycker på Enter eller lämnar rutan.',
  'help.guide.files-link.step.3':
    'Under Plats, till vänster, ser du resans platser, grupperade per dag med datum, och Ej tilldelad sist för platser som inte ligger på någon dag. Klicka på en plats för att bocka i den.',
  'help.guide.files-link.step.4':
    'Under Bokning och Transport, till höger, finns resans bokningar. Klicka på den som dokumentet hör till. Den får också en bock.',
  'help.guide.files-link.step.5':
    'Stäng med × uppe till höger. Det finns ingen sparaknapp här: varje klick sparades direkt.',
  'help.guide.files-link.result':
    'Raden visar noteringen och en bricka per koppling: en med platsens namn och en med flygningens namn. När du håller muspekaren över en bricka visas ”Dagsplan” eller ”Transport”. Dokumentet bifogas också till platsen och till flygningen.',
  'help.guide.files-link.tip.1':
    'En fil kan ha flera kopplingar samtidigt, så samma bekräftelse kan höra till hotellets bokning och hotellets plats på en gång.',
  'help.guide.files-link.tip.2':
    'Klicka på en markerad post igen för att ta bort den länken. Själva filen finns kvar. Offline sparas anteckningen och nya markeringar och skickas när TREK är online igen. Bara att ta bort ytterligare en länk kräver en anslutning.',
  'help.guide.files-link.tip.3':
    'Det fungerar också åt andra hållet: ett dokument som är bifogat en plats eller en bokning finns också i den här listan, med samma etikett på sin rad.',
  // files-star
  'help.guide.files-star.title': 'Ha de viktiga dokumenten överst',
  'help.guide.files-star.goal':
    'Markera de få dokument du verkligen kommer att behöva, så att du snabbt hittar dem i en lång lista.',
  'help.guide.files-star.step.1':
    'Klicka på stjärnan i slutet av en rad (Stjärnmarkera). Den blir guldfärgad, en andra stjärna visas framför filens namn, och när du håller muspekaren över knappen står det nu Ta bort stjärnmarkering.',
  'help.guide.files-star.step.2':
    'Listan sorteras om: stjärnmarkerade filer visas ovanför alla andra filer, med de nyaste först i varje grupp.',
  'help.guide.files-star.step.3':
    'En stjärna visas nu bland filterflikarna i fältet, direkt efter ”Alla”, med antalet stjärnmarkerade filer bredvid. Klicka på den för att bara se de filerna.',
  'help.guide.files-star.result':
    'Stjärnmarkerade filer visas överst i listan, och en flik visar bara stjärnmarkerade filer.',
  'help.guide.files-star.tip.1':
    'Stjärnfliken finns bara så länge en fil är stjärnmärkt. När du tar bort stjärnmarkeringen på den sista filen försvinner fliken.',
  'help.guide.files-star.tip.2':
    'För att stjärnmarkera krävs samma behörighet som för Tilldela, Redigera filens metadata. En medlem utan den ser stjärnorna, men ett klick på Stjärnmarkera ändrar ingenting för dem.',
  // files-filter
  'help.guide.files-filter.title': 'Hitta ett dokument i listan',
  'help.guide.files-filter.goal': 'Visa bara den sorts dokument du letar efter.',
  'help.guide.files-filter.step.1':
    'Filterflikarna finns i fältet överst, bredvid Filer: Alla, PDF-filer, Bilder och Dokument, var och en med antalet filer bredvid sig.',
  'help.guide.files-filter.step.2': 'Klicka på ”PDFs”: listan visar bara PDF-filerna.',
  'help.guide.files-filter.step.3':
    'Ytterligare två flikar visas bara när resan har matchande filer. Klicka på ”Samarbetsanteckningar”, som visas så snart en anteckning på fliken ”Samarbete” har en bilaga: listan visar då bara de filerna. En stjärnflik visas på samma sätt så snart en fil är stjärnmarkerad.',
  'help.guide.files-filter.step.4': 'Alla visar hela listan igen.',
  'help.guide.files-filter.result':
    'Listan visar bara filerna på den valda fliken, och siffran på varje flik anger hur många filer det är.',
  'help.guide.files-filter.tip.1':
    'Här finns inga mappar och du kan inte byta namn på filer. För att skilja dokument åt använder du noteringen i Tilldela fil, länkarna till platser och bokningar samt stjärnan.',
  'help.guide.files-filter.tip.2':
    'Listan sorteras alltid med stjärnmarkerade filer först och sedan de nyaste först, så ett dokument som laddades upp i dag visas ovanför ett från förra månaden.',
  // files-preview
  'help.guide.files-preview.title': 'Läs ett dokument utan att lämna TREK',
  'help.guide.files-preview.goal':
    'Titta på en biljett eller en bild direkt och ladda ner den till din enhet när du behöver den där.',
  'help.guide.files-preview.step.1':
    'Klicka på en bilds namn eller miniatyr. Den öppnas i helskärm, med filens namn och dess plats bland bilderna uppe till vänster. En video öppnas på samma sätt och spelas upp där.',
  'help.guide.files-preview.step.2':
    'Använd de runda pilarna på sidorna, vänster och höger piltangent eller raden med miniatyrer längst ner för att bläddra genom alla bilder som listan visar just nu.',
  'help.guide.files-preview.step.3':
    'Öppna i ny flik och Ladda ner är de runda knapparna uppe till höger, bredvid ×. Klicka på ×, tryck på Escape eller klicka på den mörka bakgrunden för att stänga bilden.',
  'help.guide.files-preview.step.4':
    'Ett dokument som inte är en bild öppnas i stället i en dialogruta: namnet överst med Öppna i ny flik och Ladda ner som knappar under det, och för en PDF själva sidan nedanför. Du stänger den med × uppe till höger, med Escape eller genom att klicka bredvid dialogrutan.',
  'help.guide.files-preview.step.5':
    'Pilen i slutet av en rad (Ladda ner) sparar filen direkt på din enhet, utan att öppna den först.',
  'help.guide.files-preview.result':
    'Dokumentet visas på skärmen, och samma två knappar öppnar det i en webbläsarflik eller sparar det på din enhet.',
  'help.guide.files-preview.tip.1': 'På en pekskärm sveper du genom bilderna i stället för att klicka på pilarna.',
  'help.guide.files-preview.tip.2':
    'Ett wallet-kort öppnas aldrig i förhandsgranskning. Det laddas ner direkt, så att telefonen kan öppna det i sin plånboksapp.',
  'help.guide.files-preview.tip.3':
    '”Öppna i ny flik” och ”Ladda ner” hämtar båda filen med din session, så en länk som du kopierar från adressfältet fungerar inte för någon annan.',
  // files-trash
  'help.guide.files-trash.title': 'Radera ett dokument och återställ det',
  'help.guide.files-trash.goal': 'Radera det resan inte längre behöver och återställ filer som du ändå behöver.',
  'help.guide.files-trash.step.1':
    'Klicka på papperskorgen i slutet av en rad (Radera). Filen försvinner från listan direkt och meddelandet Flyttad till papperskorgen visas. Det kommer ingen bekräftelsefråga.',
  'help.guide.files-trash.step.2':
    'Papperskorgsikonen längst till höger i fältet (Papperskorgen) växlar listan till de raderade filerna. Fältets titel visar Papperskorgen, och filterflikarna och uppladdningsrutan döljs.',
  'help.guide.files-trash.step.3':
    'En rad i papperskorgen är nedtonad och har två ikoner: Återställ, som återställer filen, och Radera, som raderar den för gott efter en bekräftelse.',
  'help.guide.files-trash.step.4':
    'Klicka på ”Återställ”. Meddelandet ”Fil återställd” visas och filen tas bort från papperskorgen. Dess notering och kopplingar finns kvar.',
  'help.guide.files-trash.step.5':
    '”Töm papperskorgen”, i fältet bredvid papperskorgsikonen, raderar allt som ligger kvar i papperskorgen för gott. Webbläsaren ber om bekräftelse en gång innan det sker. Papperskorgsikonen växlar tillbaka till filerna.',
  'help.guide.files-trash.result': 'Filen är tillbaka i listan där den låg tidigare.',
  'help.guide.files-trash.tip.1':
    'Radera på en rad frågar inte först. Det är därför det finns en papperskorg: ingenting tas bort från TREK förrän du raderar det där. Allt det här fungerar också offline och skickas när TREK är online igen.',
  'help.guide.files-trash.tip.2':
    'För att radera och återställa en fil krävs behörigheten att radera filer. En medlem utan den ser varken Radera på raden eller knapparna i papperskorgen.',
  'help.guide.files-trash.tip.3': 'En fil som har raderats för gott i papperskorgen går inte att få tillbaka.',
  // files-sync
  'help.guide.files-sync.title': 'Synkronisera dokumenten med ditt dokumentlager',
  'help.guide.files-sync.goal':
    'Anslut resan till ditt eget dokumentlager, så att filer som laddas upp här sparas där och filer som sparas där visas här.',
  'help.guide.files-sync.step.1':
    'Klicka på ”Dokumentsynkronisering”, bredvid papperskorgsikonen längst till höger i fältet. Dialogen öppnas med resans namn under titeln. Till vänster, under ”Anslut en leverantör”, finns de lager som en administratör har slagit på, var och ett med en rad som säger hur det lagrar filer: Paperless-ngx och Papra med taggar, Nextcloud och Synology Drive i en mapp, OpenCloud i ett space. Till höger står det ”Inget anslutet än”.',
  'help.guide.files-sync.step.2':
    'Klicka på ditt lager, här Nextcloud. En mindre dialog öppnas för anslutningen. Den visar lagrets namn och frågar efter de inloggningsuppgifter som just det lagret kräver.',
  'help.guide.files-sync.step.3':
    'Fyll i Adress och arkivets egen inloggning: en API-token för Paperless-ngx, en API-nyckel och Organisations-ID för Papra, Användarnamn och ett Applösenord för Nextcloud, Användarnamn och en App-token för OpenCloud, och för Synology Drive Användarnamn, Lösenord och, om kontot kräver det, en Tvåfaktorskod. Använd ett applösenord eller en token överallt där arkivet erbjuder det, aldrig ditt vanliga kontolösenord. Nextcloud och Synology Drive tar också en valfri Basmapp, där TREK letar efter resemappar, här /Reisen. Tillåt självsignerat certifikat längst ned är bara till för ett arkiv i ditt eget nätverk med ett sådant certifikat.',
  'help.guide.files-sync.step.4':
    'Klicka på Testa anslutningen. TREK ansluter till lagringen med det du skrev, och i sidfoten står Nådde den, inloggad som följt av kontots namn. Om inloggningsuppgifterna avvisas eller adressen inte kan nås visar sidfoten det i stället. I båda fallen sparas ingenting.',
  'help.guide.files-sync.step.5':
    'Klicka på Anslut. Anslutningen sparas med resan, och TREK frågar var i lagringen resans dokument ska ligga: taggen, mappen eller utrymmet som innehåller dem. Bara det som finns där synkroniseras. Skapa en ny skapar en när du klickar på Skapa, med ett namn från resans titel. Under Eller använd en du redan har ser du de som redan finns. Klicka på en, här mappen Autumn in Japan.',
  'help.guide.files-sync.step.6':
    'Dialogrutan öppnas igen: ditt lager står under Den här resan till vänster, och dess kort till höger visar vart det synkroniseras, när det senast kördes och Synkronisera nu. Den första synkroniseringen startar automatiskt. Klicka på Synkronisera nu för att köra en när du vill. Efter en synkronisering ändras märket Inte synkroniserad än bredvid namnet till en grön prick, som visar Synkroniserad när du håller muspekaren över den. Flödesfältet visar hur många dokument TREK och lagret har var för sig, med banorna Ut till arkivet och In från arkivet emellan. Stäng dialogrutan med × uppe till höger.',
  'help.guide.files-sync.result':
    'Dokumenten som redan fanns i lagret visas överst i listan, uppladdade i ditt namn, och varje dokument på resan finns också i lagret, utom dokumenten från Samarbetsanteckningar. Från och med nu kontrollerar TREK lagret i bakgrunden, och ändringar i listan kopieras till lagret.',
  'help.guide.files-sync.tip.1':
    'Bara resans ägare eller en instansadministratör kan ansluta en resa, eftersom inloggningsuppgifterna ger åtkomst till hela kontot i lagret. När resan är ansluten ser alla medlemmar ”Dokumentsynkronisering” och kan öppna den, läsa kortet och klicka på ”Synkronisera nu”.',
  'help.guide.files-sync.tip.2':
    'Ett lager i ditt eget nätverk kräver ALLOW_INTERNAL_NETWORK=true på TREK-servern, och dess adress måste vara maskinens adress i nätverket, aldrig localhost. Utan det svarar ”Testa anslutningen” ”Den adressen är inte tillåten.”',
  'help.guide.files-sync.tip.3':
    'Koppla från, ikonen bredvid Synkronisera nu, frågar en gång om bekräftelse. Därefter avslutas anslutningen och alla dokument behålls på båda sidor. Om du ansluter en tagg, mapp eller yta en andra gång behandlar TREK den som ny och importerar allt i den på nytt. Anslut därför en tom efter Koppla från, inte den gamla.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Information om dagen',
  'help.ctx.trip-day-detail.summary':
    'Panelen som öppnas över kartan när du klickar på en dagrubrik. Den visar dagen som helhet: dess namn och datum, vädret där du kommer att vara, bokningarna den dagen och nätterna som är bokade för den.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klicka på en dags rubrik i dagkolumnen, så öppnas panelen över mitten av kartan. Klicka på samma rubrik igen, eller på X:et till höger om den, för att stänga panelen och avmarkera dagen. Om du öppnar en plats, från platskolumnen eller kartan, stängs panelen och platsen visas i stället.',
  'help.ctx.trip-day-detail.bullet.2':
    'Rubriken visar dagens namn och datum. Pennan bredvid namnet byter namn på dagen. Dubbelpilen fäller ihop panelen till ett smalt fält så att du ser kartan igen.',
  'help.ctx.trip-day-detail.bullet.3':
    'Överst ser du dagens väder. Prognos för visar vilken plats prognosen gäller: dagens första stopp, eller hotellet du vaknar på.',
  'help.ctx.trip-day-detail.bullet.4':
    'Bokningar listar dagens bokningar, var och en med typ, det stopp den hör till och sina tider. Grönt betyder bekräftat, gult att den fortfarande väntar, och en kollektivtrafikresa är blå och saknar status. Ett klick på en rad öppnar bokningen.',
  'help.ctx.trip-day-detail.bullet.5':
    'Boende visar varje natt som är bokad över den här dagen, med Incheckning och Utcheckning på dagarna då de sker, incheckningsfönstret, utcheckningstiden och bekräftelsenumret. När boendet har en bokning visar en ruta Bokning under det bokningen med Väntande eller Bekräftat. Klicka på rutan för att öppna bokningen.',
  'help.ctx.trip-day-detail.bullet.6':
    '”Lägg till boende” lägger till en övernattning på den här dagen: välj boendet bland resans platser, välj vilka dagar det gäller och lägg till tiderna och koden. Plustecknet i en dags huvud, med verktygstipset ”Lägg till i denna dag”, har också ”Lägg till boende”: det öppnar den här panelen med formuläret redan öppet.',
  // day-panel
  'help.guide.day-panel.title': 'Öppna en dag och läs dess detaljer',
  'help.guide.day-panel.goal': 'Se en hel dag, med väder, bokningar och var du sover, utan att lämna kartan.',
  'help.guide.day-panel.step.1':
    'Klicka på en dags rubrik i dagkolumnen. Dagen markeras och dess detaljer öppnas över mitten av kartan.',
  'help.guide.day-panel.step.2': 'Rubriken visar dagens namn, ”Dag 1” tills du ger den ett namn, med datumet under.',
  'help.guide.day-panel.step.3':
    'Dagens väder visas överst. Prognos för anger vilken plats prognosen gäller: dagens första stopp, eller hotellet där du sov natten innan.',
  'help.guide.day-panel.step.4': 'Under Bokningar ser du de bokningar som infaller på den här dagen, med sina tider.',
  'help.guide.day-panel.step.5':
    'Boende visar nätterna som är bokade över den här dagen, med Incheckning och Utcheckning på de dagar de sker.',
  'help.guide.day-panel.step.6':
    'Dubbelpilen i rubriken fäller ihop panelen till ett smalt fält. X bredvid den stänger panelen och avmarkerar dagen.',
  'help.guide.day-panel.result':
    'När du fäller ihop panelen till ett smalt fält blir kartan fri och dagen förblir vald. När du stänger den avmarkeras dagen och planen är som den var.',
  'help.guide.day-panel.tip.1':
    'Du kan också fälla ihop panelen genom att klicka var som helst i dess rubrikfält. Pilen är bara ett av sätten.',
  'help.guide.day-panel.tip.2':
    'När du öppnar en plats, från platskolumnen eller kartan, stängs dagens panel och platsens detaljer visas i stället. Klicka på dagens rubrik igen för att visa dagen igen.',
  // day-weather
  'help.guide.day-weather.title': 'Läs dagens väder',
  'help.guide.day-weather.goal': 'Se vädret på den plats där du faktiskt befinner dig den dagen.',
  'help.guide.day-weather.step.1':
    'Prognos för visar vilken plats siffrorna gäller: dagens första stopp, eller, på en dag utan stopp, hotellet du bor på natten innan.',
  'help.guide.day-weather.step.2':
    'Den stora siffran är dagens temperatur. Bredvid den står lägsta och högsta temperaturen samt vädret i ord.',
  'help.guide.day-weather.step.3':
    'Brickorna till höger om den visar risken för regn, hur mycket regn, den starkaste vinden samt soluppgång och solnedgång.',
  'help.guide.day-weather.step.4':
    'Längst ner ser du dagen timme för timme, varannan timme: tid, ikon, temperatur och risk för regn. En timme över 50 procent är skuggad blå.',
  'help.guide.day-weather.result':
    'Dagens kort i dagkolumnen visar också vädret med liten text under dagens nummer, så att du snabbt ser vädret för hela resan.',
  'help.guide.day-weather.tip.1':
    'Grader och vind följer ”Temperaturenhet” under ”Visning” i Inställningar. Om du väljer °F Fahrenheit visas samma prognos i °F och mph.',
  'help.guide.day-weather.tip.2':
    'En dag utan stopp med plats och utan hotell från natten innan visar inget väder alls: prognosen gäller alltid en plats, aldrig resan som helhet.',
  'help.guide.day-weather.tip.3':
    'Längre fram än 16 dagar finns ingen prognos. Siffrorna är då medelvärden från tidigare år för det datumet. De är markerade med Ø, och en notering under dem säger det.',
  // rename-day
  'help.guide.rename-day.title': 'Ge dagen ett namn',
  'help.guide.rename-day.goal': 'Ge en dag ett namn som Ankomst till Kyoto eller Vilodag i stället för Dag 5.',
  'help.guide.rename-day.step.1': 'Öppna dagen. Dess rubrik lyder Dag 5, med datumet under.',
  'help.guide.rename-day.step.2': 'Klicka på pennan bredvid namnet.',
  'help.guide.rename-day.step.3': 'Namnet blir ett fält. Skriv det namn du vill ha.',
  'help.guide.rename-day.step.4':
    'Tryck på Enter eller klicka någon annanstans. Escape avbryter ändringen. Dagens kort i dagkolumnen visar också namnet.',
  'help.guide.rename-day.result':
    'Namnet ersätter Dag 5 i panelen och på dagens kort i dagkolumnen. Datumet ändras inte.',
  'help.guide.rename-day.tip.1':
    'Om du tömmer fältet och sparar heter dagen Dag 5 igen: numret visas när det inte finns något namn.',
  'help.guide.rename-day.tip.2':
    'Namnet hör till dagen, inte till dess datum. Om du ändrar ordning på dagarna följer namnet med allt annat på den dagen.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Boka en natt på en dag',
  'help.guide.add-accommodation.goal':
    'Lägg in hotellet i planen en enda gång, med de dagar det täcker, tiderna och bekräftelsenumret.',
  'help.guide.add-accommodation.step.1':
    'Boendet måste först vara en plats i resan. Skapa det i platskolumnen som vilken annan plats som helst: väljaren erbjuder bara platser som redan finns.',
  'help.guide.add-accommodation.step.2': 'Öppna dagen då du anländer och klicka på Lägg till boende under Boende.',
  'help.guide.add-accommodation.step.3':
    'Tillämpa på dagar anger vilka nätter vistelsen täcker: Start är incheckningsdagen, Slut är utcheckningsdagen och Alla täcker hela resan. Överst i dialogrutan ser du perioden och antalet nätter.',
  'help.guide.add-accommodation.step.4':
    'Fyll i Incheckning, Tills och Utcheckning, och skriv bokningens nummer under Bekräftelse. Alla fyra fält får vara tomma.',
  'help.guide.add-accommodation.step.5':
    'Välj boendet under Välj boende. Kategori ovanför listan begränsar listan till en kategori.',
  'help.guide.add-accommodation.step.6': 'Klicka på Spara.',
  'help.guide.add-accommodation.result':
    'Vistelsen visas på varje dag den täcker, Incheckning på den första och Utcheckning på den sista. Boendet blir ett stopp på incheckningsdagen, så kartan visar vägen dit, och en hotellbokning visas på fliken Bokningar.',
  'help.guide.add-accommodation.tip.1':
    'Väljaren öppnas på dagen du kom från, med utcheckning dagen efter. Du kan ändra båda innan du sparar.',
  'help.guide.add-accommodation.tip.2':
    'Ge hotellet kategorin ”Hotel” när du skapar det. Då visar ”Kategori” ovanför listan bara dina hotell med ett klick.',
  'help.guide.add-accommodation.tip.3':
    'Alla tider är valfria. En vistelse utan incheckning och utan kod täcker ändå sina nätter, och dess rutt ritas ändå.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Ändra eller avboka en bokad natt',
  'help.guide.edit-accommodation.goal': 'Flytta en vistelse, rätta dess tider eller ta bort den från planen.',
  'help.guide.edit-accommodation.step.1':
    'Kortet visar boendet och dess adress, Incheckning eller Utcheckning på dagarna då de sker, med tider, bekräftelsenumret och, under Bokning, bokningen som hör till boendet.',
  'help.guide.edit-accommodation.step.2':
    'Pennan till höger, ”Redigera boende”, öppnar vistelsen för redigering. Popupen heter nu ”Redigera boende”.',
  'help.guide.edit-accommodation.step.3':
    'Rätta Incheckning, Tills, Utcheckning och Bekräftelse. Dagarna ovanför och boendet nedanför går också att ändra här.',
  'help.guide.edit-accommodation.step.4': 'Klicka på Spara.',
  'help.guide.edit-accommodation.step.5':
    'X bredvid pennan, Ta bort, tar bort vistelsen. Det frågas inte om bekräftelse, och hotellbokningen som hör till vistelsen raderas också.',
  'help.guide.edit-accommodation.result':
    'Ändringen gäller direkt för varje dag som vistelsen täcker, och för hotellbokningen på fliken Bokningar.',
  'help.guide.edit-accommodation.tip.1':
    'En natt mitt i en vistelse har varken Incheckning eller Utcheckning: bara den första och den sista dagen i intervallet har det.',
  'help.guide.edit-accommodation.tip.2':
    'Om du avbokar en vistelse tas också stoppet bort som lades till på incheckningsdagen, liksom alla kostnader som hör till bokningen. Om det var ett misstag bokar du natten igen.',
  // day-bookings
  'help.guide.day-bookings.title': 'Dagens bokningar med en blick',
  'help.guide.day-bookings.goal': 'Se på ett ställe vad som redan är bokat för den här dagen och om det är bekräftat.',
  'help.guide.day-bookings.step.1':
    'Bokningar listar dagens bokningar: de som är daterade den dagen och de som är fästa vid något av dess stopp. En bokning som är fäst vid ett stopp en annan dag visas bara vid det stoppet.',
  'help.guide.day-bookings.step.2':
    'En rad visar vilken sorts bokning det är, dess namn och, om den hör till ett stopp, det stoppet i grått efter namnet. Tiderna visas längst till höger, före statusprick.',
  'help.guide.day-bookings.step.3':
    'Färgen visar bokningens status: grönt är bekräftat, gult väntande, och en kollektivtrafikresa är blå, utan status. Hotell finns inte i den här listan, de har ett eget avsnitt nedanför.',
  'help.guide.day-bookings.step.4':
    'Klicka på en rad så öppnas bokningen. Etiketten i rubriken växlar den mellan Väntande och Bekräftat, och Redigera längst ned ändrar resten. Nya bokningar skapar du på fliken Bokningar, transporter på fliken Transporter.',
  'help.guide.day-bookings.result':
    'Allt som har datum den dagen, och allt som är länkat till ett av dagens stopp, finns i den här listan.',
  'help.guide.day-bookings.tip.1':
    'En bokning visas på dagen för sitt eget datum. Om du ändrar datumet på fliken Bokningar eller Transporter flyttas bokningen automatiskt till den andra dagen.',
  'help.guide.day-bookings.tip.2':
    'Om blocket Bokningar saknas har dagen inga bokningar: blocket döljs i stället för att visas tomt.',
  'help.guide.map-lock.title': 'Lås kartan',
  'help.guide.map-lock.goal': 'Behåll kartan där den är medan du klickar dig igenom dagar och platser.',
  'help.guide.map-lock.step.1':
    'Låset är den övre av de två runda knapparna längst ned till vänster på kartan. När du håller pekaren över det står det Lås kartvyn. Klicka på det. Så länge låset är stängt zoomar eller panorerar kartan inte när du öppnar en dag eller väljer en plats, och knappen visar nu Låt kartan följa markeringen.',
  'help.guide.map-lock.result': 'Kartan ligger kvar där du lämnade den medan du arbetar dig igenom planen.',
  'help.guide.map-lock.tip.1':
    'Klicka på låset igen, som nu heter Låt kartan följa markeringen, så följer kartan åter det du väljer. Låset finns bara på dator. På telefon följer kartan alltid markeringen.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Karta',
  'help.ctx.trip-map.summary':
    'Planens mittendel: varje plats på resan som en nål, varje tur som en linje, rutterna mellan dem och knapparna längs kartans kanter för att låsa vyn, byta till satellit, visa hela resan på en gång och visa platserna i området du tittar på.',
  'help.ctx.trip-map.bullet.1':
    'En nål är en plats: platsens eget foto om den har ett, annars dess kategorifärg med kategoriikonen. Håll pekaren över en nål för ett kort med bild, namn och adress, plus betyg och kategori om platsen har dem. Dra en nål till ett dagkort för att planera platsen på den dagen. En vistelse vars bokning fortfarande är väntande visas blekt, med en streckad ring.',
  'help.ctx.trip-map.bullet.2':
    'Nålar som sitter för tätt grupperas i en mörk cirkel med ett tal. Klicka på cirkeln så zoomar kartan in på nålarna i den. Med Kompakta markörer för oplanerade platser på, i Inställningar > Visning under Resor och karta, visas platser som ännu inte ligger på någon dag som små prickar utan foto, så att de planerade stoppen syns tydligare.',
  'help.ctx.trip-map.bullet.3':
    'Klicka på en nål för att öppna platsen i ett kort längst ner på kartan, med betyg, filer och nästa åtgärder. Klicka på en tom del av kartan för att stänga kortet.',
  'help.ctx.trip-map.bullet.4':
    'När en dag är öppen i dagkolumnen visar dess stopp ett litet vitt märke med sitt nummer den dagen. En plats som förekommer två gånger på dagen visar båda sina nummer. Filtren ovanför platslistan (Visa, kategorierna och stjärnan för lägsta betyg) filtrerar också nålarna på kartan.',
  'help.ctx.trip-map.bullet.5':
    'Ikonraden överst söker i den del av kartan som du ser: Restauranger, Kaféer, Barer och nattliv, Boende, Sevärdheter, Museer och kultur, Natur och parker och Aktiviteter. Kategorier som ett plugin lägger till kommer efter en tunn avdelare. När raden är bredare än kartan rullar du den i sidled med mushjulet. Sök i detta område kör sökningen igen när du har flyttat kartan.',
  'help.ctx.trip-map.bullet.6':
    'Högerklicka var som helst på kartan för att öppna platsformuläret vid den punkten, med adressen redan uppslagen. Längst ned till vänster finns två runda knappar: låset, Lås kartvyn, behåller kartvyn där den är medan du klickar dig genom dagar och platser, och knappen under, Byt till satellitvy, byter den ritade kartan mot satellitbilder.',
  'help.ctx.trip-map.bullet.7':
    '”Visa hela resan” längst ner till höger ritar alla resdagar på en gång och listar vad varje dag omfattar. Ruttikonen på en bokningsrad ritar den bokningen, och ruttikonen i verktygsfältet ovanför dagarna ritar alla bokningar. Klicka på änden av en ritad bokning för att öppna dess detaljer.',
  'help.ctx.trip-map.bullet.8':
    'När tillägget Dawarich är på visar den runda Dawarich-knappen under Visa hela resan rutten som din telefon faktiskt spelade in. Visa inspelad rutt ritar den som en streckad linje under den planerade rutten, med en färg per dag. När det inte finns någon linje visar knappens etikett varför.',
  // map-markers
  'help.guide.map-markers.title': 'Läs kartan',
  'help.guide.map-markers.goal': 'Förstå vad varje nål, bricka och bubbla på kartan betyder.',
  'help.guide.map-markers.step.1':
    'Kartan visar varje plats i resan. Där nålar ligger för tätt för att kunna skiljas åt grupperas de i en mörk cirkel med antalet nålar inuti. Klicka på cirkeln, så zoomar kartan in på de nålarna, eller, vid djupaste zoom, sprider ut nålarna.',
  'help.guide.map-markers.step.2':
    'En nål visar platsens eget foto om det finns, annars kategorifärgen med kategoriikonen. En vistelse vars bokning fortfarande väntar visas blekt, med en streckad ring. När du håller pekaren över en nål öppnas ett kort bredvid den: samma foto i större format, namnet och adressen, plus betyg och kategori om platsen har det.',
  'help.guide.map-markers.step.3':
    'Klicka på en nål så öppnas platsen i ett kort över kartans nederkant: överst bilden, namnet och adressen, sedan stjärnorna, beskrivningen och filerna, även bokningens filer. Längst ned finns åtgärderna: Lägg till i dagen medan en dag är öppen (Ta bort från dag när platsen redan ligger på den), Navigering, Öppna hemsida, Spara i samling (Sparad när den redan ligger i en) och, till höger, papperskorgen och Redigera. X överst, eller ett klick på en tom del av kartan, stänger kortet.',
  'help.guide.map-markers.step.4':
    'Öppna en dag i dagkolumnen, så får dess stopp nummer: den lilla vita brickan i nålens hörn visar stoppets position i dagen. En plats som förekommer två gånger på dagen visar båda sina nummer. När ingen dag är öppen finns inga nummer, och hörnet visar i stället platsens betyg, om den har något.',
  'help.guide.map-markers.step.5':
    'Dra en nål från kartan till ett dagkort i dagkolumnen, så planeras platsen den dagen, precis som när du drar dess rad från platslistan.',
  'help.guide.map-markers.result':
    'Inget i resan har ändrats: kartan visar bara resan. Varje nål visar vilken plats det är, vilken dag den ligger på och i vilken ordning.',
  'help.guide.map-markers.tip.1':
    'När du fäller ihop en dag i dagkolumnen döljs dess stopp på kartan. Fäll ut dagen igen för att visa dem.',
  'help.guide.map-markers.tip.2':
    'Filtren ovanför platslistan avgör också vad kartan visar: Visa (Oplanerat, Planerat), kategorierna under etikettknappen och ett lägsta betyg under stjärnan minskar alla antalet nålar. Landsfiltret begränsar bara listan.',
  'help.guide.map-markers.tip.3':
    'Den här kartan har inga zoomknappar: hjulet zoomar, ett dubbelklick zoomar in ett steg, och du flyttar kartan genom att dra i den.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Hitta platser omkring dig på kartan',
  'help.guide.map-nearby-places.goal':
    'Sök efter restauranger, sevärdheter eller ett hotell i den del av staden som kartan visar, och lägg till ett av dem i resan.',
  'help.guide.map-nearby-places.step.1':
    'Raden med ikoner högst upp på kartan är kategorisökningen: Restauranger, Kaféer, Barer och nattliv, Boende, Sevärdheter, Museer och kultur, Natur och parker och Aktiviteter. Kategorier som ett plugin lägger till kommer efter en smal avdelare. Håll pekaren över en ikon för att se dess namn.',
  'help.guide.map-nearby-places.step.2':
    'Klicka på en kategori. TREK söker efter den sortens plats i den synliga delen av kartan och sätter en nål i kategorins färg för varje träff. Bara en kategori åt gången: om du klickar på en annan ersätter den den förra, och om du klickar på den aktiva stängs den av.',
  'help.guide.map-nearby-places.step.3':
    'När du flyttar kartan visas en andra knapp under raden: ”Sök i detta område” kör samma sökning för den nya vyn. Att flytta kartan startar ingen ny sökning av sig själv. Det håller nere antalet förfrågningar.',
  'help.guide.map-nearby-places.step.4':
    'Håll pekaren över en nål för att se namnet på det som sökningen hittade. Klicka på nålen så öppnas platsformuläret med uppgifterna redan ifyllda: namnet överst i dialogen, Adress, Latitud och Longitud samt hemsida och telefonnummer om sökningen hittade dem.',
  'help.guide.map-nearby-places.step.5':
    'Kontrollera vad som fyllts i och lägg till det som sökningen inte kunde veta. Kategoriknappen under namnet är redan vald när resan har en passande kategori, till exempel restaurang för en restaurang. Annars står det Ingen kategori tills du väljer en. Lägg till en Beskrivning och egna anteckningar.',
  'help.guide.map-nearby-places.step.6':
    'Klicka på ”Lägg till”. Om en plats med samma namn eller på samma ställe redan finns i resan meddelar TREK det, och knappen ändras till ”Lägg till ändå”.',
  'help.guide.map-nearby-places.result':
    'Platsen finns i platslistan och på kartan som en av resans egna nålar, under Oplanerat tills du lägger den på en dag. Sökningens nålar finns kvar tills du stänger av kategorin.',
  'help.guide.map-nearby-places.tip.1':
    'Raden döljs när Utforska platser på kartan är av i Inställningar > Visning, under Resor och karta.',
  'help.guide.map-nearby-places.tip.2':
    'Resultaten kommer från TREK Places-indexet och från OpenStreetMap, så det här är en av få saker i planen som kräver uppkoppling.',
  'help.guide.map-nearby-places.tip.3':
    'En sökning täcker bara området på skärmen, så zooma in på gatan du är intresserad av. En sökning över en hel stad ger bara de första sextio träffarna, utan någon tydlig ordning.',
  // map-add-place
  'help.guide.map-add-place.title': 'Skapa en plats genom att högerklicka på kartan',
  'help.guide.map-add-place.goal': 'Placera en plats exakt där du vill ha den, utan att söka efter den först.',
  'help.guide.map-add-place.step.1':
    'Högerklicka på platsen på kartan. Platsformuläret öppnas med rubriken ”Lägg till plats/aktivitet”.',
  'help.guide.map-add-place.step.2':
    '”Latitud” och ”Longitud” är redan inställda på den punkten. TREK slår upp koordinaterna och fyller i ”Adress” med det som finns där. Om uppslagningen hittar ett namn fyller TREK också i namnet högst upp i dialogen. Inget är sparat än, så rätta det som är fel.',
  'help.guide.map-add-place.step.3':
    'Skriv ett namn som du känner igen i fältet överst i dialogen. Välj en kategori på knappen under det, som visar Ingen kategori tills du väljer en. Lägg sedan till övriga uppgifter för planen: Beskrivning, Noteringar, Hemsida.',
  'help.guide.map-add-place.step.4':
    'Klicka på Lägg till. Platsen läggs i listan som oplanerad, även när en dag är öppen: ett högerklick på kartan anger platsen, inte dagen.',
  'help.guide.map-add-place.result':
    'Platsen finns i listan och på kartan, under Oplanerat tills du lägger den på en dag.',
  'help.guide.map-add-place.tip.1':
    'Adressen slås upp från koordinaterna, så den kan visa en gata i stället för ett namn, och på landsbygden kan den vara tom. Du kan skriva över båda fälten.',
  'help.guide.map-add-place.tip.2':
    'På kartorna MapLibre GL och Mapbox GL gör ett mittenklick samma sak, och på en pekskärm ett långt tryck.',
  // map-satellite
  'help.guide.map-satellite.title': 'Byt till satellit',
  'help.guide.map-satellite.goal': 'Växla från den ritade kartan till flygbilder, och tillbaka.',
  'help.guide.map-satellite.step.1':
    'Reglaget för baslagret är den nedre av de två runda knapparna längst ned till vänster på kartan, under låset. Ikonen visar alltid lagret du byter till, och verktygstipset säger vilket: Byt till satellitvy. Klicka på den.',
  'help.guide.map-satellite.step.2':
    'Kartan visar nu flygbilder. De är så detaljerade att du kan se enskilda byggnader, och du behöver ingen egen nyckel. Allt som TREK ritar ligger kvar ovanpå: nålarna, dagens rutt, spåren och bokningsrutterna.',
  'help.guide.map-satellite.step.3':
    'Knappen lyder nu Byt till kartvy. Klicka på den för att gå tillbaka till kartvyn.',
  'help.guide.map-satellite.result': 'Kartan ritas om, och lagret du valde sparas på ditt konto.',
  'help.guide.map-satellite.tip.1':
    'Valet sparas på ditt konto och inte på resan, så varje resa öppnas som du lämnade den, oavsett vilken kartmotor du använder.',
  'help.guide.map-satellite.tip.2':
    'Satellitbilderna har ingen text: gatunamn, stadsdelar och husnummer finns bara på den ritade kartan, så byt tillbaka när du letar efter en adress.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Se hela resan och dess avstånd',
  'help.guide.map-whole-trip.goal':
    'Visa varje resdag i resan i stället för bara den öppna dagen, och se hur långt du reser varje dag.',
  'help.guide.map-whole-trip.step.1':
    'Den runda knappen Visa hela resan finns längst ner till höger på kartan. Klicka på den, så ritas varje resdag i resan på en gång, var och en i sin egen färg, så att du kan skilja angränsande dagar åt.',
  'help.guide.map-whole-trip.step.2':
    'Kortet ovanför knappen listar de dagarna: en färgprick, dagens namn, en ikon för varje sätt du reser på den och sträckan den täcker. Total sträcka står överst.',
  'help.guide.map-whole-trip.step.3':
    'Klicka på en dag i kortet för att välja den: dess rad skuggas och dagen öppnas i dagkolumnen. Rulla med mushjulet över en stad för att zooma in. De dagar som passerar staden visas då bredvid varandra, var och en i sin färg.',
  'help.guide.map-whole-trip.step.4':
    'Knappen lyder nu ”Dölj hela resan”. Klicka på den för att bara visa den öppna dagen igen.',
  'help.guide.map-whole-trip.result':
    'Varje resdag ritas i sin egen färg, och kortet visar vad varje dag omfattar samt totalen för resan.',
  'help.guide.map-whole-trip.tip.1':
    'Totalen räknas ut några delsträckor i taget. Så länge … visas efter den är siffran bara en delsumma. Den är slutgiltig när alla delsträckor är beräknade.',
  'help.guide.map-whole-trip.tip.2':
    'Om ruttmotorn inte kan beräkna en delsträcka förblir den en rak linje och räknas inte med. Kortet berättar det, så att totalen inte ser lägre ut utan förvarning.',
  'help.guide.map-whole-trip.tip.3':
    'En dag med färre än två stopp med position och utan körning till eller från hotellet har ingen rutt att rita, så den visas inte alls i kortet.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Visa en bokningsrutt på kartan',
  'help.guide.map-booking-routes.goal': 'Visa de flyg, tåg och bilresor du har bokat på kartan och ta bort dem igen.',
  'help.guide.map-booking-routes.step.1':
    'Bokningsvägar är avstängda tills du slår på en. Längst till höger på en transports rad i dagkolumnen finns en liten ruttikon: ”Visa bokningsvägar”.',
  'help.guide.map-booking-routes.step.2':
    'Klicka på den, så visas bokningen på kartan: ett flyg som en storcirkelbåge, en bilresa längs de verkliga vägarna och ett tåg som kedjan av sina stationer. Bekräftat ritas heldraget, Väntande streckat, och rutternas ändar är blå etiketter med transportens ikon.',
  'help.guide.map-booking-routes.step.3':
    'Klicka på en ändpunktsknapp så öppnas bokningens detaljer: status, typ och dagar som etiketter i den färgade rubriken, tiderna i båda ändar, övriga uppgifter nedanför och längst ned På kartan, som slår av rutten igen, Ändra resväg för en kollektivtrafikförbindelse, papperskorgen som raderar bokningen och Redigera. X:et i rubriken stänger detaljerna.',
  'help.guide.map-booking-routes.step.4':
    'Ruttikonen i verktygsfältet ovanför dagarna gäller hela resan på en gång: Visa alla bokningsvägar ritar upp varje bokning som har en rutt.',
  'help.guide.map-booking-routes.step.5':
    'Det ersätter dina tidigare val, så alla rutter som du slog på bokning för bokning nollställs. Tryck på knappen igen, som nu heter Dölj alla bokningsvägar, för att dölja alla bokningsvägar.',
  'help.guide.map-booking-routes.result':
    'De bokningar du bad om ritas på kartan, och valet sparas för den här resan i den här webbläsaren tills du ändrar det.',
  'help.guide.map-booking-routes.tip.1':
    'Ändpunkterna visar flygplatskoden eller stationens namn bara när Etiketter för bokningsrutter är på i Inställningar > Visning, under Resor och karta. Annars visar de bara ikonen.',
  'help.guide.map-booking-routes.tip.2':
    '”Visa alltid bokningsrutter”, i samma avsnitt, visar dem från början på alla resor där du inte har ställt in det själv än.',
  'help.guide.map-booking-routes.tip.3':
    'En bokning behöver en start och ett slut med koordinater innan den kan ritas, så ett hotell eller en restaurang har ingen ruttikon.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Visa rutten du faktiskt reste',
  'help.guide.map-dawarich-trail.goal':
    'Visa rutten som Dawarich spelade in på din telefon på kartan, som en streckad linje bredvid din planerade rutt, och se dag för dag hur resan faktiskt gick.',
  'help.guide.map-dawarich-trail.step.1':
    'Den runda Dawarich-knappen finns nere till höger på kartan, under Visa hela resan. När du håller pekaren över den står det Visa inspelad rutt. Klicka på den. TREK hämtar data för resans datum från din Dawarich, och en ring snurrar runt knappen medan TREK väntar på svaret.',
  'help.guide.map-dawarich-trail.step.2':
    'Den inspelade rutten visas som en streckad linje, med en färg per dag, ritad under den planerade rutten så att planen förblir läsbar. Knappen lyder nu Dölj inspelad rutt. Varje dag slutar vid lokal midnatt. När du fäller ihop en dag i dagkolumnen döljs dess streckade linje och dess stopp på kartan.',
  'help.guide.map-dawarich-trail.step.3':
    'Klicka också på Visa hela resan, så ritas varje planerad dag som en hel linje bredvid den streckade inspelningen. Där de två linjerna sammanfaller gick dagen som planerat. Där den streckade linjen lämnar den planerade rutten gjorde den inte det.',
  'help.guide.map-dawarich-trail.result':
    'Det du planerade och det du faktiskt gjorde visas tillsammans på kartan, som streckade och hela linjer. Kortet ovanför knapparna listar fortfarande de planerade dagarna och deras avstånd.',
  'help.guide.map-dawarich-trail.tip.1':
    'På eller av sparas per resa på ditt konto, så det är detsamma i alla webbläsare och på alla enheter. Medan rutten är på frågar TREK Dawarich på nytt varannan minut, så en pågående resa uppdateras utan att sidan laddas om. Själva rutten lagras aldrig, så den finns inte i TREKs databas, inte i säkerhetskopior och inte offline.',
  'help.guide.map-dawarich-trail.tip.2':
    'Knappens etikett visar varför kartan är tom: ”Laddar den inspelade rutten…” medan den laddas, ”Ingenting spelades in de här datumen”, ”Den inspelade rutten kunde inte laddas” eller ”Den inspelade rutten kräver en anslutning” när TREK är offline.',
  // map-compass
  'help.guide.map-compass.title': 'Vrid kartan och hitta norr igen',
  'help.guide.map-compass.goal':
    'Vrid kartan så att den pekar i färdriktningen och vrid tillbaka den mot norr med ett klick.',
  'help.guide.map-compass.step.1':
    'Vrid kartan genom att dra med höger musknapp, eller håll ner Ctrl och dra med vänster knapp. På en pekskärm vrider du med två fingrar. Den runda kompassen bredvid raden med kategoriikoner högst upp på kartan vrids med: pilen pekar alltid mot norr, så den lutar lika mycket som kartan.',
  'help.guide.map-compass.step.2':
    'Klicka på kompassen. Knappen, som heter Reset north, vrider kartan tillbaka så att norr är uppåt, gör vyn platt igen, och pilen pekar uppåt igen.',
  'help.guide.map-compass.result':
    'Kartan pekar åter mot norr och är platt igen. Ingenting på resan har ändrats: kompassen ändrar bara vyn.',
  'help.guide.map-compass.tip.1':
    'Kompassen finns bara på kartorna MapLibre GL och Mapbox GL. Leaflet-kartan går inte att vrida, så den har ingen kompass. Kartleverantör i Inställningar, under Karta, avgör vilken karta du använder, och Spara karta sparar valet.',
  'help.guide.map-compass.tip.2':
    'Klicket tar också bort lutningen. Dra uppåt eller nedåt med höger musknapp för att luta vyn, och ”Reset north” ställer den plant och nollställer rotationen. På Mapbox GL med ”3D-byggnader och terräng” påslaget plattar det också till 3D-vyn tills du lutar den igen.',

  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Samarbete',
  'help.ctx.trip-collab.summary':
    'Fliken där gruppen planerar tillsammans, i fem kort: chatten till vänster, Noteringar och Länkar bredvid, Omröstningar och Vad händer härnäst? under dem. Allt som skrivs här visas direkt på alla andra medlemmars skärmar, utan att sidan laddas om.',
  'help.ctx.trip-collab.bullet.1':
    'Chatten är kortet till vänster. Skriv i Skriv ett meddelande... och tryck på Enter. Shift och Enter ger en ny rad. Smileyn lägger till en emoji, och Bifoga bilder lägger till upp till fyra bilder i meddelandet.',
  'help.ctx.trip-collab.bullet.2':
    'Håll muspekaren över ett meddelande för Svara och, på dina egna meddelanden, Radera. Högerklicka på det för de åtta snabbreaktionerna. Ett raderat meddelande ersätts av en notering som visar vem som raderade det.',
  'help.ctx.trip-collab.bullet.3':
    'Noteringar är det delade anteckningsblocket: Ny notering i rubriken skapar en notering, och kugghjulet bredvid öppnar Hantera kategorier för kategoriernas namn och färger. När det finns kategorier filtrerar en rad med piller under rubriken korten: Alla, eller en kategori. Ett noteringskort visar sin kategori som en färgad prick och sin länk som en rund knapp, och de tre prickarna (Fler alternativ) innehåller Expandera, Fäst, Redigera och Radera.',
  'help.ctx.trip-collab.bullet.4':
    '”Länkar” samlar resans webbadresser. ”Lägg till länk” tar en titel och en http- eller https-adress. ”Redigera länk”, ”Fäst länk” och ”Ta bort länk” finns i slutet av brickan, och fästa länkar ligger först.',
  'help.ctx.trip-collab.bullet.5':
    'Använd omröstningar för att fatta beslut. ”Ny omröstning” ställer en fråga med minst två alternativ. Klicka på ett alternativ för att rösta på det. Låset (”Stäng”) och papperskorgen (”Radera”) till höger i en omröstnings rubrik avslutar röstningen eller tar bort omröstningen.',
  'help.ctx.trip-collab.bullet.6':
    'Vad händer härnäst? listar resans stopp som fortfarande ligger framför, upp till åtta stycken, med tider och personerna på dem. Det läser bara dagsplanen. Tiderna anges där.',
  // write-note
  'help.guide.write-note.title': 'Skriv en gemensam notering',
  'help.guide.write-note.goal':
    'Lägg det som hela gruppen behöver, till exempel en regel, en adress eller en påminnelse, där alla kan hitta det.',
  'help.guide.write-note.step.1':
    'Klicka på Ny notering i rubriken på kortet Noteringar. Dialogrutan för noteringen öppnas, med markören redan i titelfältet.',
  'help.guide.write-note.step.2':
    'Skriv titeln där det står Noterings titel, överst i dialogrutan. Det är det enda obligatoriska fältet: Skapa förblir utgråat tills titeln har text, och om du trycker på Enter i titelfältet skapas noteringen direkt.',
  'help.guide.write-note.step.3':
    '”Innehåll” rymmer texten och stöder Markdown: ett ord i fet stil, en lista, en rubrik. Kortet visar de tre första raderna, och ”Expandera” i dess meny öppnar hela noteringen.',
  'help.guide.write-note.step.4':
    'Välj under Kategori den som noteringen hör till. Dess färg används för dialogens rubrik nu och för kortets rubrik senare. Den första kategorin är redan vald åt dig. Pillren är de kategorier som redan finns, och en ny kategori skapar du under Hantera kategorier. Så länge resan inte har några kategorier finns inte den här raden.',
  'help.guide.write-note.step.5':
    '”Hemsida” tar en länk som hör till noteringen. Kortet får då en rund länkknapp överst som öppnar den.',
  'help.guide.write-note.step.6':
    'Klicka på Skapa. Bara Avbryt och krysset stänger dialogen, så ett klick utanför den eller Esc gör inte att du förlorar det du skrev.',
  'help.guide.write-note.result':
    'Noteringen blir ett kort i panelen Noteringar, med överdelen i kategorins färg, och alla andra medlemmar ser den direkt.',
  'help.guide.write-note.tip.1':
    'De tre punkterna på ett kort (Fler alternativ) öppnar Expandera, Fäst, Redigera och Radera. Fäst håller noteringen överst i panelen, med en ram i dess färg. Alla andra noteringar sorteras efter när de senast ändrades.',
  'help.guide.write-note.tip.2':
    'Kugghjulet bredvid Ny notering öppnar Hantera kategorier. Där kan du ge en kategori en färg, byta namn på den överallt på en gång eller lägga till den innan någon notering använder den. Ingenting ändras förrän du klickar på Spara.',
  'help.guide.write-note.tip.3':
    'Bifoga filer lägger till ett dokument i noteringen, om du får ladda upp filer till resan. Bifoga öppnar filväljaren, och du kan också klistra in en bild eller en PDF i dialogen.',
  'help.guide.write-note.tip.4':
    'Noteringar har en egen omkopplare under Tillägg, nedanför Samarbete: en administratör kan stänga av den och låta chatten, länkarna, omröstningarna och Vad händer härnäst? vara på.',
  // shared-links
  'help.guide.shared-links.title': 'Samla resans länkar',
  'help.guide.shared-links.goal':
    'Samla bokningsportalen, det delade albumet och tidtabellen på ett ställe, så att du slipper leta efter dem i chatten.',
  'help.guide.shared-links.step.1':
    'Klicka på Lägg till länk i rubriken på kortet Länkar. Dialogen öppnas med markören i fältet överst.',
  'help.guide.shared-links.step.2':
    'Skriv namnet i Länktitel, klistra in adressen i Länka under den och klicka sedan på Spara länk.',
  'help.guide.shared-links.step.3':
    'Brickan visar namnet och webbplatsen som länken pekar på. Klicka på den för att öppna sidan i en ny flik.',
  'help.guide.shared-links.step.4':
    'De tre runda knapparna i dess ände är Redigera länk, Fäst länk och Ta bort länk. Fäst länk flyttar brickan längst fram i panelen och visar den i accentfärgen. Ta bort länk ber dig bekräfta först, eftersom länken tas bort för alla medlemmar.',
  'help.guide.shared-links.result':
    'Länken är en bricka i panelen Länkar, fäst längst fram, och den visas direkt på alla medlemmars skärmar.',
  'help.guide.shared-links.tip.1':
    'Bara en http- eller https-adress godtas. Allt annat avvisas, och dialogen förblir öppen med det du skrev.',
  'help.guide.shared-links.tip.2':
    'Fästa länkar kommer först, sedan de nyaste. Den lilla ikonen bredvid en titel är webbplatsens egen favicon, som hämtas från webbplatsen själv, så utan internet visar brickan en enkel länkikon i stället.',
  'help.guide.shared-links.tip.3':
    'Länkar är ett eget reglage under Tillägg, nedanför Samarbete, så en admin kan stänga av panelen utan att röra resten av fliken.',
  // create-poll
  'help.guide.create-poll.title': 'Fråga gruppen',
  'help.guide.create-poll.goal': 'Gör en fråga som ingen svarar på i chatten till en omröstning som alla kan rösta i.',
  'help.guide.create-poll.step.1': 'Klicka på Ny omröstning i rubriken på kortet Omröstningar. Dialogrutan öppnas.',
  'help.guide.create-poll.step.2':
    'Skriv frågan under Fråga. Markdown stöds under rutan betyder att fetstil, radbrytning eller en kort lista fungerar här.',
  'help.guide.create-poll.step.3':
    'Fyll i ”Val 1” och ”Val 2” under ”Val”. Du behöver minst två alternativ som inte är tomma, och ett alternativ kan ha flera rader.',
  'help.guide.create-poll.step.4':
    '”Lägg till alternativ” under dem lägger till ett tredje, ett fjärde, så många du behöver. Det lilla krysset bredvid en rad, som visas när du har fler än två, tar bort det alternativet.',
  'help.guide.create-poll.step.5':
    'Flera val låter alla bocka för mer än ett alternativ. Om det är av flyttas en persons röst till det nya alternativet när personen väljer ett annat.',
  'help.guide.create-poll.step.6': 'Klicka på Skapa omröstning.',
  'help.guide.create-poll.result': 'Omröstningen visas överst i panelen Omröstningar, öppen, med 0 röster i rubriken.',
  'help.guide.create-poll.tip.1': 'Frågan visas som Markdown, alternativen förblir vanlig text.',
  'help.guide.create-poll.tip.2':
    'Skapa omröstning förblir utgråat tills det finns en fråga och minst två alternativ med text.',
  'help.guide.create-poll.tip.3':
    'En tidsfrist kan bara sättas i telefonappen. En omröstning med tidsfrist visar den återstående tiden i en bärnstensfärgad bricka i rubriken och stängs när tiden är slut.',
  'help.guide.create-poll.tip.4':
    '”Omröstningar” har en egen strömbrytare under ”Tillägg”, under ”Samarbete”: en administratör kan stänga av den och behålla de andra fyra panelerna påslagna.',
  // vote-poll
  'help.guide.vote-poll.title': 'Rösta och läs resultatet',
  'help.guide.vote-poll.goal': 'Rösta, se gruppens resultat och ändra din röst.',
  'help.guide.vote-poll.step.1':
    'Klicka på alternativet du vill ha. Dess cirkel får en bock, alternativet får en ram i accentfärgen och stapeln bakom det växer.',
  'help.guide.vote-poll.step.2':
    'Nu ser du hela resultatet: stapeln visar andelen, procentsatsen står till höger, och de små cirklarna är personerna som valde det alternativet, upp till tre av dem.',
  'help.guide.vote-poll.step.3':
    'Har du ångrat dig? Klicka på ett annat alternativ. I en omröstning utan Flera val flyttas din röst till det nya alternativet i stället för att en andra röst läggs till.',
  'help.guide.vote-poll.step.4':
    'Antalet röster visas i en bricka under frågan. Om du klickar på alternativet du redan har valt tas din röst bort, och antalet minskar.',
  'help.guide.vote-poll.result':
    'Ditt alternativ är ibockat, staplarna visar hur gruppen har röstat och cirklarna visar vem som valde vilket alternativ.',
  'help.guide.vote-poll.tip.1':
    'Procentsatserna och vem som röstade på vad visas först när du själv har röstat, eller när omröstningen är stängd. Antalet röster i rubriken visas för alla.',
  'help.guide.vote-poll.tip.2':
    'En röst är aldrig anonym: håll muspekaren över en av cirklarna vid ett alternativ för att se namnet på den som röstade.',
  // close-poll
  'help.guide.close-poll.title': 'Stäng en omröstning eller radera den',
  'help.guide.close-poll.goal':
    'Avsluta röstningen när gruppen har bestämt sig, och radera en omröstning som ingen behöver längre.',
  'help.guide.close-poll.step.1':
    'Stäng, låset till höger i omröstningens rubrik, avslutar röstningen. Du kan inte längre klicka på alternativen.',
  'help.guide.close-poll.step.2':
    'En stängd omröstning flyttas längst ned i panelen, under rubriken Stängd när det finns öppna omröstningar ovanför. Den har ett chip Stängd och visar resultatet för alla, oavsett om de har röstat eller inte. Det vinnande alternativet står i fetstil på ett grönt fält. Om det är det du valde har fältet i stället din accentfärg.',
  'help.guide.close-poll.step.3':
    '”Radera”, papperskorgen till höger i rubriken, raderar omröstningen. På en stängd omröstning är det den enda knappen, eftersom låset är borta. Det finns ingen bekräftelse, och rösterna raderas också.',
  'help.guide.close-poll.result':
    'En raderad omröstning försvinner från alla medlemmars paneler. En omröstning som du bara har stängt ligger kvar längst ner, med sitt resultat.',
  'help.guide.close-poll.tip.1':
    'Det går inte att ångra att man stänger en omröstning: det finns ingen återöppning. En omröstning som stängts av misstag måste skapas på nytt.',
  'help.guide.close-poll.tip.2':
    'Radera tar bort omröstningen och alla röster på den för alla, direkt och utan bekräftelse.',
  // whats-next
  'help.guide.whats-next.title': 'Läs Vad händer härnäst?',
  'help.guide.whats-next.goal': 'Se vad gruppen gör härnäst utan att öppna planen.',
  'help.guide.whats-next.step.1':
    'Kortet listar resans kommande stopp, upp till åtta, i tidsordning, under en rubrik per dag: Idag, I morgon eller datumet, med dagens titel bredvid om den har en. Rubriken visar hur många det finns.',
  'help.guide.whats-next.step.2':
    'Till vänster om varje stopp står dess tid: starttiden, ”till”, och sluttiden när stoppet har en, eller ”TBD” när ingen tid är satt än.',
  'help.guide.whats-next.step.3':
    'Bredvid den står namnet, adressen och, som brickor, personerna på det stoppet. Om ingen är tilldelad stoppet listas alla i resan.',
  'help.guide.whats-next.result':
    'En lista över vad som komma skall, bara för läsning: den följer planen, och inget här ändrar den.',
  'help.guide.whats-next.tip.1':
    'Du ställer inte in något här. Tiderna kommer från dagsplanen, och när du ändrar dem där uppdateras listan direkt.',
  'help.guide.whats-next.tip.2':
    'Bara det som ligger framför listas: ett stopp tas bort från listan när dess starttid har passerat, ett stopp i dag utan tid ligger kvar tills dagen är slut, och i slutet av en resa är panelen tom.',
  'help.guide.whats-next.tip.3':
    'Vad händer härnäst? har en egen omkopplare under Tillägg, nedanför Samarbete. Det är en panel för datorn: fliken Samarbete i mobilappen visar den inte.',
  // trip-chat
  'help.guide.trip-chat.title': 'Prata med gruppen',
  'help.guide.trip-chat.goal':
    'Skicka ett meddelande, svara på ett visst meddelande, reagera på ett annat meddelande och radera ditt eget meddelande.',
  'help.guide.trip-chat.step.1':
    'Skriv i ”Skriv ett meddelande...” och tryck på Enter. Den runda pilen bredvid rutan gör samma sak. Shift och Enter ger i stället en ny rad.',
  'help.guide.trip-chat.step.2':
    'Smileyn öppnar emojiväljaren, med ”Smileys”, ”Reactions” och ”Travel”. Emojin du väljer läggs till i texten du skriver. Den skickas inte av sig själv.',
  'help.guide.trip-chat.step.3':
    'Håll pekaren över någon annans meddelande: en liten rund knapp visas i hörnet. Det är Svara.',
  'help.guide.trip-chat.step.4':
    'Meddelandet du svarar på citeras ovanför rutan. Skriv och skicka ditt meddelande, så skickas citatet med. Klicka på krysset på citatet för att ta bort det.',
  'help.guide.trip-chat.step.5':
    'Högerklicka på ett meddelande för att se de åtta snabbreaktionerna. Din reaktion visas under meddelandet. Klicka på samma reaktion igen för att ta bort den.',
  'help.guide.trip-chat.step.6':
    'Dina egna meddelanden har Radera, papperskorgsikonen, bredvid Svara. Det raderar meddelandet direkt, och en notering visar att du raderade det. Det går inte att ångra.',
  'help.guide.trip-chat.result':
    'Ditt svar är det senaste meddelandet, och det citerade meddelandet visas överst i det. Din reaktion visas under det andra meddelandet. För meddelandet som du raderade visar en notering att du raderade det.',
  'help.guide.trip-chat.tip.1':
    'Enter skickar, Shift och Enter ger en ny rad. Ett meddelande med bara en till tre emojis visas stort.',
  'help.guide.trip-chat.tip.2':
    'Med ”Bifoga bilder” kan du lägga till upp till fyra bilder i ett meddelande. Du kan också klistra in dem eller släppa dem på rutan.',
  'help.guide.trip-chat.tip.3':
    'Ett meddelande med en länk får ett förhandsvisningskort under sig, som hämtas av din egen TREK, så en länk till något som bara du kommer åt förblir en vanlig länk.',
  'help.guide.trip-chat.tip.4':
    'Chatt har en egen omkopplare under Tillägg, nedanför Samarbete: en administratör kan stänga av den och låta noteringarna, länkarna, omröstningarna och Vad händer härnäst? vara på.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Listor',
  'help.ctx.trip-lists.summary':
    'Två listor för en resa: packlistan, med vem som tar med vad och hur mycket det väger, och uppgiftslistan med allt som ska göras före och under resan. Fliken visas medan tillägget ”Listor” är påslaget.',
  'help.ctx.trip-lists.bullet.1':
    'Packlista och Att göra i fältet överst växlar mellan de två och räknar vad som finns i var och en. Knapparna längst till höger i fältet hör till den som är öppen.',
  'help.ctx.trip-lists.bullet.2':
    'Packlistan är indelad i listor, till exempel Dokument eller Kläder, med valfria namn. Varje lista är ett kort. I huvudet finns ett grepp för att dra hela listan till en annan plats, en färgprick, ett märke med packat av totalt, tre prickar med Byt namn, ”Markera alla”, ”Avmarkera alla” och ”Ta bort lista”, och en pil som fäller ihop kortet. ”Lägg till lista” i fältet ovanför skapar en ny.',
  'help.ctx.trip-lists.bullet.3':
    'En rad har ett handtag, en kryssruta och ett namn, därefter en liten avatar för den som tar med föremålet. Ett föremål med antal över ett får också en packad-räknare som 3/10 med minus och plus. Sedan kommer antalet som ett litet märke och, medan Spårning av väskor är på, vikten i gram och en väskcirkel, därefter papperskorgen och en meny med tre prickar med Flytta till lista, Delar, Byt namn och Radera. Kontroller som en rad inte använder är dämpade tills du håller pekaren över dem.',
  'help.ctx.trip-lists.bullet.4':
    'Delad och Min lista delar upp packlistan i två: listan som alla ser och din egen. Alla, Öppen och Klar bredvid dem begränsar den lista som är öppen. A till Ö längst bort i raden visar varje listas föremål i namnordning, och ett andra klick går tillbaka till din egen ordning. Förloppskortet ovanför räknar vad som är packat.',
  'help.ctx.trip-lists.bullet.5':
    'Använd mall och Spara som mall fyller en lista eller sparar den, så att du slipper skriva den. De två ikonerna efter dem, Exportera och Importera, exporterar listan som utskrift, PDF eller fil och importerar en lista. Den röda knappen längst till höger på förloppskortet visar hur många föremål som är markerade och tar bort dem.',
  'help.ctx.trip-lists.bullet.6':
    'Att göra har en egen sidopanel: förloppskortet, filtren Alla, Mina uppgifter, Förfallen och Klar, en rad per lista och Lägg till lista under dem. Uppgifterna ligger i ett kort. Dess rubrik visar filtrets namn och sorteringen, Prioritet eller Förfallodag. Klicka på en uppgift för att öppna den i rutan till höger. Lägg till ny uppgift i fältet öppnar dialogrutan Ny uppgift.',
  // packing-categories
  'help.guide.packing-categories.title': 'Bygg packlistan',
  'help.guide.packing-categories.goal':
    'Gruppera det du tar med i listor, lägg till föremål i dem och välj vem som ansvarar för varje lista.',
  'help.guide.packing-categories.step.1':
    'Klicka på ”Lägg till lista” i fältet ovanför listorna. En liten dialog öppnas. Skriv namnet i dess övre fält, där det står ”Listnamn (t.ex. Kläder)”, och klicka på ”Lägg till”.',
  'help.guide.packing-categories.step.2':
    'Den nya listan börjar med en platshållarrad som bara visar tre svaga prickar. Klicka på ”Lägg till artikel” längst ner på raden, skriv föremålet i ”Föremålsnamn...” och tryck på Enter. Det första föremålet ersätter platshållaren, och fältet förblir öppet för nästa.',
  'help.guide.packing-categories.step.3':
    'Byt namn på en rad genom att klicka på dess namn, eller med Byt namn bland de tre prickarna i radens högra ände.',
  'help.guide.packing-categories.step.4':
    'Den streckade cirkeln med en person i listans övre band tilldelar resemedlemmar till listan. Välj ett namn. Om du vill ta bort personen igen klickar du på brickan som visas.',
  'help.guide.packing-categories.step.5':
    'De tre punkterna bredvid antalet öppnar fler alternativ: Byt namn, Markera alla, Avmarkera alla och Ta bort lista. Ta bort lista raderar listan och alla föremål i den utan att fråga igen. Pilen längst till höger fäller ihop listan.',
  'help.guide.packing-categories.result':
    'Den nya listan visas i rutnätet med sina föremål under sig och sin färgprick, och dess bricka räknar det som redan är packat.',
  'help.guide.packing-categories.tip.1':
    'En lista finns bara genom sina föremål. Om du raderar det sista föremålet blir raden en platshållare, så att listan behåller sin plats och sin färg. Om du raderar även den raden raderas listan.',
  'help.guide.packing-categories.tip.2':
    'När du tilldelar någon en lista får personen ett packningsmeddelande. Det ändrar inte vem som kan se föremålen. Det ställer du in under ”Delar”, i menyn med de tre prickarna på en rad.',
  'help.guide.packing-categories.tip.3':
    'Två listor kan ha samma namn. TREK håller isär dem internt, så namnen förblir som du skrev dem.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Bocka av medan du packar',
  'help.guide.check-off-packing.goal':
    'Markera vad som ligger i väskan, följ förloppsstapeln och ta bort de packade föremålen.',
  'help.guide.check-off-packing.step.1':
    'Klicka på rutan till vänster på en rad. Namnet stryks över och förloppsstapeln uppdateras.',
  'help.guide.check-off-packing.step.2':
    'Förloppskortet ovanför listorna visar hur många föremål som är packade av alla föremål på listan, som ett tal, som en procentsats och som en stapel.',
  'help.guide.check-off-packing.step.3':
    'Om du vill markera en hel lista på en gång har de tre punkterna i dess rubrik Markera alla och Avmarkera alla.',
  'help.guide.check-off-packing.step.4':
    '”Alla”, ”Öppen” och ”Klar” bredvid ”Delad” och ”Min lista” filtrerar rutnätet. ”Öppen” visar bara det som fortfarande saknas, så en lista som är helt packad döljs.',
  'help.guide.check-off-packing.step.5':
    'Den röda knappen Ta bort … avbockade i högra änden av förloppskortet, med antalet avbockade föremål i, raderar alla på en gång efter en bekräftelse från webbläsaren.',
  'help.guide.check-off-packing.result':
    'Bara öppna föremål listas, och stapeln ovanför visar hur mycket av packningen som är klar.',
  'help.guide.check-off-packing.tip.1': 'Ett avbockat föremål går fortfarande att byta namn på: klicka på dess namn.',
  'help.guide.check-off-packing.tip.2':
    'Markera alla och Avmarkera alla gäller en lista i taget, från den listans egna tre punkter.',
  'help.guide.check-off-packing.tip.3':
    'När alla föremål är markerade ersätts räknaren av Allt packat! och stapeln blir grön.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Använd en packningsmall',
  'help.guide.apply-packing-template.goal':
    'Lägg till en färdig lista i resan, och spara den här resans lista till nästa resa.',
  'help.guide.apply-packing-template.step.1': 'Klicka på ”Använd mall” i fältet ovanför listan.',
  'help.guide.apply-packing-template.step.2':
    'Välj en mall. Varje rad visar mallens namn och hur många föremål den innehåller.',
  'help.guide.apply-packing-template.step.3':
    'Föremålen läggs till i den vy du står i: Delad lägger dem i den delade listan som alla ser, Min lista lägger dem i din egen lista.',
  'help.guide.apply-packing-template.step.4':
    'Om du vill spara den här resans lista till nästa resa klickar du på Spara som mall. En liten dialogruta öppnas. Skriv ett namn i fältet överst, där det står Mallnamn, och klicka på Spara.',
  'help.guide.apply-packing-template.result':
    'Mallens listor och föremål läggs till i resan, bredvid det som redan fanns där.',
  'help.guide.apply-packing-template.tip.1':
    'En mall kopierar varje föremåls lista, antal, vikt och väska, och skapar en väska som resan inte har ännu. Bockar kopieras inte, och inget som redan finns på listan tas bort.',
  'help.guide.apply-packing-template.tip.2':
    'Använd mall finns bara när det finns en mall. Utan mall visas inte knappen alls.',
  'help.guide.apply-packing-template.tip.3':
    'Spara som mall visas bara för en administratör av instansen, och bara medan listan har föremål. Den sparar de delade föremålen plus dina egna föremål, aldrig en annan medlems privata föremål.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Klistra in en hel packlista',
  'help.guide.import-packing-list.goal':
    'Gör om en lista som du redan har någon annanstans till packningsföremål på en gång.',
  'help.guide.import-packing-list.step.1':
    'Klicka på Importera, ikonen med nedåtpilen längst till höger i fältet ovanför listan.',
  'help.guide.import-packing-list.step.2':
    'Ett föremål per rad: Kategori, Namn, Vikt i g (valfritt), Väska (valfritt), checked/unchecked (valfritt). Det grå exemplet i rutan visar alla fyra formaten, och siffrorna längs vänsterkanten räknar raderna du skriver. En Markdown-lista fungerar också: en rubrik ger listan dess namn, och "- [ ]" och "- [x]" blir föremål.',
  'help.guide.import-packing-list.step.3':
    'Eller läs in raderna från en fil med Ladda CSV/TXT/MD, nere till vänster i dialogrutan. Den tar en .csv-, .txt- eller .md-fil och ersätter det som står i rutan.',
  'help.guide.import-packing-list.step.4':
    'Klicka på Importera 3 nere till höger. Talet på knappen räknar de rader som TREK förstod.',
  'help.guide.import-packing-list.result':
    'Varje rad blir ett föremål, i listan som anges i radens första fält. Föremål som redan fanns ändras inte.',
  'help.guide.import-packing-list.tip.1':
    'Kommatecken, semikolon och tabbar skiljer alla fälten åt, och citattecken håller ihop ett fält, så att ”Skjorta, blå” förblir ett namn. En rad med bara ett värde är enbart ett namn. En rad utan egen lista hamnar i ”Andra”. ”3x” framför ett namn anger antalet.',
  'help.guide.import-packing-list.tip.2':
    'Om resan inte har väskan som anges i det fjärde fältet än skapar TREK den. Importera och ”Använd mall” är de två sätten att lägga till vikter och väskor för många föremål på en gång.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Skriv ut eller exportera packlistan',
  'help.guide.export-packing-list.goal':
    'Skriv ut listan, spara den som PDF eller exportera den som fil för en annan app eller nästa resa.',
  'help.guide.export-packing-list.step.1':
    'Klicka på Exportera, ikonen med uppåtpil i fältet ovanför listan, precis före Importera.',
  'help.guide.export-packing-list.step.2':
    'Checklista i Markdown (.md) och CSV för import (.csv) sparar listan som en fil direkt.',
  'help.guide.export-packing-list.step.3':
    'Klicka på Skriv ut eller spara som PDF. Förhandsgranskningen visar listan som en sida: resan, dess datum och hur mycket som är packat överst, sedan varje lista som ett kort, med en ruta att bocka i för varje föremål.',
  'help.guide.export-packing-list.step.4':
    'Klicka på Skriv ut eller spara som PDF under förhandsgranskningen. Webbläsaren öppnar sin utskriftsdialog: välj en skrivare, eller Spara som PDF för att spara en fil.',
  'help.guide.export-packing-list.result':
    'Utskriften och filerna innehåller den vy som är öppen, ”Delad” eller ”Min lista”, med antal, vikter och bockar.',
  'help.guide.export-packing-list.tip.1':
    'CSV-filen har det format som ”Importera” läser, inklusive väskor, så du kan använda den som en egen packningsmall: importera den till nästa resa.',
  'help.guide.export-packing-list.tip.2':
    'Markdown-filen öppnas som en checklista i Obsidian, Notion eller GitHub, och du kan importera den igen med Importera.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Bestäm vem som ser ett föremål och vem som tar med det',
  'help.guide.share-packing-item.goal':
    'Flytta ett föremål mellan gruppens gemensamma pool, din egen lista och de personer du tar med det åt.',
  'help.guide.share-packing-item.step.1':
    'Ovanför listorna är Delad listan som alla ser och Min lista din egen. Båda visar hur många föremål de har. Klicka på Min lista för att se din.',
  'help.guide.share-packing-item.step.2':
    'Tillbaka i Delad öppnar du de tre punkterna i slutet av en rad och klickar på Delar.',
  'help.guide.share-packing-item.step.3':
    'Det finns tre nivåer: ”Delad”, synlig för alla i gruppen, ”Personlig”, som bara du ser, och ”Dela med…”, där du väljer vilka personer föremålet gäller.',
  'help.guide.share-packing-item.step.4':
    'Ett ”Personlig” föremål finns bara på ”Min lista”. Växla till ”Min lista” för att hitta det.',
  'help.guide.share-packing-item.step.5':
    'Öppna Delar igen och bocka för ett namn under Dela med…. Föremålet visas också i den personens lista, och raden får en liten etikett som räknar hur många personer det delas med.',
  'help.guide.share-packing-item.result': 'Föremålet ligger på den nivå du valde, och raden visar vem som tar med det.',
  'help.guide.share-packing-item.tip.1':
    'Bara den som tar med ett föremål kan ändra hur det delas. Den du delade det med ser det på sin egen Min lista med en liten handbricka, som visar ditt namn när hen håller muspekaren över den. Hen kan bocka av det.',
  'help.guide.share-packing-item.tip.2':
    'På ett delat föremål som någon annan tar med visar tre-punktsmenyn två andra alternativ i stället för Delar: Jag kan ta med det också, som lägger till dig bredvid personen, och Kopiera till min lista, som skapar en privat kopia åt dig.',
  'help.guide.share-packing-item.tip.3':
    'Nya föremål får samma delning som vyn du lägger till dem i. Föremål som läggs till i Delad delas med alla. Föremål som läggs till i Min lista är Personlig, såvida inte alla föremål i den listan delas med samma personer: då delas det nya föremålet med dem också.',
  // packing-bags
  'help.guide.packing-bags.title': 'Väg väskorna',
  'help.guide.packing-bags.goal':
    'Ange en vikt för varje föremål, sortera föremålen i väskor och håll varje väska under flygbolagets gräns.',
  'help.guide.packing-bags.step.1': 'Klicka på viktbrickan före cirkeln och skriv föremålets vikt i gram.',
  'help.guide.packing-bags.step.2': 'Cirkeln efter vikten är föremålets väska. Klicka på den.',
  'help.guide.packing-bags.step.3':
    'Om det inte finns någon väska ännu klickar du på Lägg till väska, skriver ett namn och trycker på Enter. Väskan skapas och föremålet läggs i den.',
  'help.guide.packing-bags.step.4':
    'Kortet Väskor visas till höger om listorna så snart det finns en väska. Varje väska visar sitt namn, vem som bär den, ett fyllnadsfält, hur många föremål som ligger i den och dess vikt. Under väskorna kommer Ej tilldelad och Totalvikt, med Packade under: vikten som redan är packad, och ett tunt fält som visar dess andel.',
  'help.guide.packing-bags.step.5':
    'Klicka på Ange gräns bredvid väskans vikt och skriv gränsen i kilogram, så som flygbolagen anger den.',
  'help.guide.packing-bags.step.6':
    'Det streckade plusset i slutet av väskans namnrad, precis före krysset, öppnar Tilldela medlemmar. Markera de medlemmar som bär väskan: de visas bredvid plusset, och Per person längst ned på kortet listar vad var och en bär.',
  'help.guide.packing-bags.result':
    'Kortet Väskor till höger visar varje väskas vikt jämfört med dess gräns, vad som inte ligger i någon väska, vad var och en bär och totalen med hur mycket av den som är packat.',
  'help.guide.packing-bags.tip.1':
    'Viktfältet, väskcirkeln och kortet Väskor finns bara när en administratör har slagit på Spårning av väskor under tillägget Listor. I ett smalare fönster öppnas väskorna i stället från knappen Väskor ovanför förloppskortet.',
  'help.guide.packing-bags.tip.2':
    'Servern beräknar en väskas vikt från alla medlemmars föremål, även de som du inte kan se, så talet är väskans verkliga vikt.',
  'help.guide.packing-bags.tip.3':
    'En väska utan gräns jämförs med den tyngsta väskan, så att du kan jämföra staplarna. Om du anger en gräns för väskan mäts dess stapel mot den gränsen i stället.',
  // create-todo
  'help.guide.create-todo.title': 'Lägg till en uppgift',
  'help.guide.create-todo.goal': 'Skriv ner en uppgift, med lista, prioritet, datum och ansvarig person.',
  'help.guide.create-todo.step.1': 'Klicka på Lägg till ny uppgift längst till höger i fältet.',
  'help.guide.create-todo.step.2':
    'Dialogrutan Ny uppgift öppnas med markören i rubriken. Skriv namnet i fältet Uppgiftsnamn, och lägg till det du vill komma ihåg under Beskrivning.',
  'help.guide.create-todo.step.3':
    'Lista grupperar uppgiften. Välj en, eller använd plustecknet bredvid för att namnge en ny i en liten dialogruta.',
  'help.guide.create-todo.step.4': 'Prioritet har fyra knappar: Ingen, P1, P2 och P3, från rött till blått.',
  'help.guide.create-todo.step.5':
    '”Förfallodag”, bredvid ”Lista”, öppnar en kalender, och ”Tilldelad till” tilldelar uppgiften till en person.',
  'help.guide.create-todo.step.6': 'Klicka på ”Skapa uppgift”.',
  'help.guide.create-todo.result':
    'Uppgiften ligger i listan med prioritet, förfallodag och lista som etiketter och med den ansvariges avatar i slutet av raden, och den öppnas i panelen till höger.',
  'help.guide.create-todo.tip.1': 'Bara namnet krävs. Allt annat kan du fylla i senare i panelen till höger.',
  'help.guide.create-todo.tip.2': 'Om en lista är vald i sidopanelen skapas den nya uppgiften i den listan.',
  'help.guide.create-todo.tip.3':
    'Enter i namnfältet skapar uppgiften direkt, utan att du behöver röra de andra fälten.',
  // todo-filters
  'help.guide.todo-filters.title': 'Hitta och ändra en uppgift',
  'help.guide.todo-filters.goal':
    'Visa bara de uppgifter som är viktiga just nu och redigera sedan uppgiften du hittade.',
  'help.guide.todo-filters.step.1':
    '”Uppgifter” i sidofältet: ”Alla” visar allt som fortfarande är öppet, ”Mina uppgifter” visar det som är tilldelat dig, ”Förfallen” visar uppgifter med ett datum som har passerat och ”Klar” visar slutförda uppgifter. Var och en visar sitt antal. Klicka på ”Förfallen”.',
  'help.guide.todo-filters.step.2':
    'Under Listor finns en rad per lista. Välj en för att visa den listan, inklusive avslutade uppgifter.',
  'help.guide.todo-filters.step.3':
    'Sorteringen överst i listan ändrar ordningen på det som visas: Prioritet sätter P1 först, Förfallodag sätter den närmaste deadlinen först. Du kan bara använda en av de två åt gången, och ett andra klick går tillbaka till din egen ordning.',
  'help.guide.todo-filters.step.4': 'Klicka på en uppgift för att öppna den i rutan till höger.',
  'help.guide.todo-filters.step.5':
    'Ändra det du behöver: namn, Prioritet, Lista, Förfallodag eller Tilldelad till. Beskrivning visar sin text med fungerande länkar. Klicka i den för att redigera. Klicka sedan på Spara ändringar längst ned i panelen. Rutan i panelens rubrik markerar uppgiften som klar, och Radera bredvid Spara ändringar raderar den direkt.',
  'help.guide.todo-filters.result':
    'Listan visar bara de uppgifter du bad om, och rutan till höger redigerar den du valde.',
  'help.guide.todo-filters.tip.1':
    'En listrad räknar bara de öppna uppgifterna, men när du väljer den visas även de slutförda uppgifterna. Alla, Mina uppgifter och Förfallen döljer slutförda uppgifter, och Klar visar bara slutförda uppgifter.',
  'help.guide.todo-filters.tip.2':
    '”Prioritet” och ”Förfallodag” i sorteringen kan inte användas samtidigt. Medan någon av dem är påslagen kan du inte dra raderna till en egen ordning.',

  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Bokningar',
  'help.ctx.trip-bookings.summary':
    'Den här fliken innehåller allt som är bokat för resan utom transport: boenden, bord, biljetter, turer och parkering. Varje bokning är ett kort, en rad i listan eller ett fält på tidslinjen, med sin kod, sina dokument, sina resenärer och sin kostnad. Klicka på en bokning för att öppna dess detaljer.',
  'help.ctx.trip-bookings.bullet.1':
    'Manuell bokning längst till höger i fältet öppnar Ny bokning. Där skapar du sex sorters bokningar: Boende, Restaurang, Evenemang, Rundtur, Parkering och Övrigt. Flyg, tåg och andra transporter finns i fliken Transporter och visas aldrig här.',
  'help.ctx.trip-bookings.bullet.2':
    'Nedladdningsikonen före Manuell bokning, Importera bokningsbekräftelser, laddar upp bekräftelser så att TREK kan läsa dem automatiskt: EML, PDF, PKPass, HTML eller TXT, högst fem filer på 10 MB, samt foton när AI-modellen läser bilder. Ikonen finns bara när servern kan läsa dem.',
  'help.ctx.trip-bookings.bullet.3':
    'Sök letar igenom titlar, typer, platser, noteringar, bokningskoder och resenärer. Filtrera, tratten bredvid, begränsar fliken efter Status, efter Typ med ett antal för varje typ, och efter Resenärer när en bokning anger personer. Ett tal på tratten visar hur många filter som är aktiva.',
  'help.ctx.trip-bookings.bullet.4':
    'De tre ikonerna efter Filtrera växlar vy: Kort, Lista och Tidslinje. Visningsalternativ, reglagen bredvid, grupperar och sorterar korten och listan eller ställer in banorna i tidslinjen, och kalkylbladsikonen efter dem, Exportera som kalkylblad (CSV), laddar ner det som fliken visar som en fil. Som standard grupperas korten i Bekräftat och Väntande, och listan efter dag. Klicka på en sektions rubrik för att fälla ihop den.',
  'help.ctx.trip-bookings.bullet.5':
    'Ett kort har en rubrik som är färgad efter status, med statusprick (ett klick växlar mellan Väntande och Bekräftat), typ, titel, penna och papperskorg. Under den står bokningens uppgifter: Datum, Tid, Bokningskod, Incheckning och Utcheckning, Plats / Adress, Boende, Länkad till (stoppet i planen), Länk, Noteringar, Resenärer, Filer och de länkade kostnaderna.',
  'help.ctx.trip-bookings.bullet.6':
    'Ett klick på ett kort, en rad eller ett fält öppnar bokningens detaljer, med På kartan (när bokningen har en plats), papperskorgen och Redigera längst ned. Att radera frågar en gång (Ta bort bokningen?, som visar om kostnader raderas med). Därefter raderas bokningen tillsammans med sina länkade utgifter, och för ett boende tas nätterna bort från dagsplanen.',
  // booking-views
  'help.guide.booking-views.title': 'Byt vy och öppna en bokning',
  'help.guide.booking-views.goal':
    'Se bokningarna som kort, som lista eller på en tidslinje, och öppna en bokning för att se alla dess detaljer.',
  'help.guide.booking-views.step.1':
    'De tre ikonerna efter Filtrera i fältet är vyerna, och var och en visar sitt namn när du pekar på den: Kort, Lista och Tidslinje. Fliken öppnas i Kort, med ett kort per bokning i avsnitten Bekräftat och Väntande. Klicka på Lista, den mittersta.',
  'help.guide.booking-views.step.2':
    'Lista visar en rad per bokning under en rubrik per dag, med dag och tid till höger. Med piltangenterna flyttar du dig från rad till rad. Klicka på Tidslinje, den sista av de tre.',
  'help.guide.booking-views.step.3':
    'Tidslinje visar bokningarna över resans dagar: ett spår per typ och ett fält från varje start till dess slut. En väntande bokning har streckad kant. Resa passar in hela resan i bredden. Klicka på en dags rubrik för att se den dagen timme för timme.',
  'help.guide.booking-views.step.4':
    'Dag visar en dag på en timskala, och varje fälts längd visar dess tid. Pilarna bredvid dagens namn går till dagen före och dagen efter. Medan resan pågår hoppar Idag till den aktuella dagen, och reglaget Resa och Dag till höger går tillbaka till hela resan.',
  'help.guide.booking-views.step.5':
    'Håll muspekaren över ett fält för att se dess dag, tider och plats, och klicka sedan på det för att öppna bokningens detaljer. Ett kort i Kort och en rad i Lista öppnar samma popup.',
  'help.guide.booking-views.step.6':
    'Rubriken i detaljvyn visar titeln och brickor för status (ett klick växlar den), typ, dag och bokningskod, med en knapp som kopierar koden. Nedanför kommer tiderna som rutor, sedan platsen, resenärerna, noteringar, kostnader och filer, om bokningen har några, och längst ner På kartan, papperskorgen och Redigera.',
  'help.guide.booking-views.result':
    'Bokningen öppnas i sin detaljvy: ”Redigera” öppnar formuläret, ”På kartan” visar den i planen, och ”Stäng” eller Escape tar dig tillbaka till vyn du kom från.',
  'help.guide.booking-views.tip.1':
    'Med ”Visningsalternativ”, reglageikonen efter vyikonerna, kan du gruppera och sortera ”Kort” och ”Lista” med ”Gruppera efter” och ”Sortera efter”. I ”Tidslinje” finns ”Ett spår per typ” och ”Visa den andra fliken”. ”Visa den andra fliken” visar posterna från fliken ”Transporter”, nedtonade, i ett smalt spår överst. ”Återställ vy” återställer standardvärdena, och varje flik kommer ihåg sin vy i den här webbläsaren.',
  'help.guide.booking-views.tip.2':
    'En bokning före eller efter resan, eller utan datum, kan inte visas på tidslinjen. Den visas under diagrammet som ett litet kort under Före resan, Efter resan eller Inget datum.',
  'help.guide.booking-views.tip.3':
    'Samma detaljer öppnas var bokningen än visas: i fliken Transporter, i dagsplanen, i en dags detaljer och i en plats detaljer. Ett klick på titeln byter namn på bokningen.',
  // create-booking
  'help.guide.create-booking.title': 'Skapa en bokning',
  'help.guide.create-booking.goal':
    'Lägg in en restaurang, ett evenemang, en rundtur, en parkeringsplats eller något annat i resan för hand.',
  'help.guide.create-booking.step.1':
    'Klicka på Manuell bokning längst till höger i fältet. Ny bokning öppnas, med titeln och två brickor i en rubrik överst.',
  'help.guide.create-booking.step.2':
    'Klicka på typetiketten i det övre fältet, som visar ”Övrigt” på en ny bokning, och välj ”Bokningstyp”. Den här fliken skapar sex typer: Boende, Restaurang, Evenemang, Rundtur, Parkering och Övrigt. Formuläret ändras efter ditt val: bara Boende använder ett datumspann i stället för enskilda datum.',
  'help.guide.create-booking.step.3':
    'Skriv titeln i bandet överst, fältet ovanför brickorna. Det är det enda obligatoriska fältet, och ”Lägg till” är gråtonad tills du har skrivit något.',
  'help.guide.create-booking.step.4':
    'Ange Datum och Starttid, samt Slutdatum och Sluttid om bokningen har ett slut. Kalendrarna erbjuder bara dagar inom resan. Ett slutdatum och en sluttid som inte ligger efter starten visas i rött och blockerar Lägg till. En sluttid före starttiden utan slutdatum ger bara en varning: om bokningen slutar nästa dag anger du ett slutdatum.',
  'help.guide.create-booking.step.5':
    'Skriv in Bokningskod från bekräftelsen och klicka sedan på statusetiketten i rubriken, bredvid typen. Den visar Väntande på en ny bokning och ändras till Bekräftat. Statusen avgör i vilket avsnitt kortet hamnar.',
  'help.guide.create-booking.step.6': 'Klicka på Lägg till längst ner i formuläret.',
  'help.guide.create-booking.result':
    'Bokningen visas som ett kort i sitt avsnitt. Rubrikens färg visar status, och kortet visar typ, datum och tider samt kod. Alla andra på resan ser det direkt.',
  'help.guide.create-booking.tip.1':
    'Plats / Adress föreslår riktiga adresser medan du skriver. Om du väljer en ersätter den det du skrev, och en adress som du har skrivit själv behålls som den är.',
  'help.guide.create-booking.tip.2':
    'Ange bokningens egen sida hos leverantören i Länka. Kortet och detaljvyn visar den som en länk som öppnas i en ny flik.',
  'help.guide.create-booking.tip.3':
    'Noteringar använder Markdown, så en lista eller en rad i fet stil visas som lista eller fet text på kortet och i detaljvyn.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Boka ett boende',
  'help.guide.booking-hotel.goal':
    'Lägg in ett boende så att det räknas både som en bokning och som nätter i dagsplanen på en gång.',
  'help.guide.booking-hotel.step.1':
    'Klicka på Manuell bokning och välj Boende med typknappen i det övre bandet. Datumfälten ersätts av ett block med hotellfält.',
  'help.guide.booking-hotel.step.2':
    'Välj hotellet under Boende. Listan innehåller resans platser, utan importerade spår och turer. När du väljer en plats hamnar namnet i en tom titel och adressen i ”Plats / Adress”.',
  'help.guide.booking-hotel.step.3':
    'Ange Från och Till: första natten och morgonen du reser. Båda erbjuder resans dagar med datum, och TREK håller Till efter Från.',
  'help.guide.booking-hotel.step.4':
    'Fyll i Incheckning, Incheckning fram till och Utcheckning samt Bokningskod från bekräftelsen.',
  'help.guide.booking-hotel.step.5': 'Klicka på Lägg till.',
  'help.guide.booking-hotel.result':
    'Kortet visar datumspannet under ”Datum”, tiderna för in- och utcheckning samt adressen. Vistelsen visas nu också på de dagarna i planen.',
  'help.guide.booking-hotel.tip.1':
    '”Boende” är den enda typen utan ”Datum” och ”Starttid”. Dess datum är ”Från” och ”Till”, och du väljer dagar i resan, inte kalenderdatum.',
  'help.guide.booking-hotel.tip.2':
    'Lämna Boende tomt och skriv in adressen i stället: platsen slås upp, skapas och nålas fast på kartan åt dig.',
  'help.guide.booking-hotel.tip.3': 'När du raderar bokningen tas även dess nätter bort från dagsplanen.',
  // link-booking
  'help.guide.link-booking.title': 'Koppla en bokning till planen',
  'help.guide.link-booking.goal':
    'Länka en bokning till sitt stopp och sin plats, så att den visas där du behöver den.',
  'help.guide.link-booking.step.1':
    'Håll muspekaren över kortet du vill länka och klicka på pennan i dess rubrik. Redigera bokning öppnas.',
  'help.guide.link-booking.step.2':
    'Öppna ”Länk till dagsuppgift”. Listan visar din plan: en rubrik för varje dag och sedan dagens stopp, numrerade och med sina tider. Välj det stopp som bokningen hör till.',
  'help.guide.link-booking.step.3':
    '”Plats / Aktivitet” kopplar själva platsen. Välj den där, så fylls titeln och ”Plats / Adress” i om de är tomma.',
  'help.guide.link-booking.step.4': 'Klicka på Uppdatera.',
  'help.guide.link-booking.result':
    'Kortet visar dagen och stoppet under Länkad till, och bokningen visas tillsammans med det stoppet i dagsplanen.',
  'help.guide.link-booking.tip.1':
    'Ingen länk (fristående) överst i listan tar bort länken igen. Boende har ingen stoppväljare: det länkas via sina nätter.',
  'help.guide.link-booking.tip.2':
    'Om du väljer ett stopp på en dag med datum fylls ett tomt Datum i åt dig. Ett datum som du redan har angett ändras inte.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Ange vem en bokning gäller',
  'help.guide.booking-travelers.goal': 'Ange vilka resenärer en bokning gäller och visa sedan bara deras bokningar.',
  'help.guide.booking-travelers.step.1':
    'Öppna bokningen med pennan på dess kort. ”Resenärer” ligger bredvid ”Bokningskod”. Det visar ”Tilldela resenärer” så länge ingen är tilldelad bokningen.',
  'help.guide.booking-travelers.step.2':
    'Klicka på det och välj de personer som bokningen gäller. Namngivna gäster finns också i listan. En vald person får en bock och sin avatar i fältet. Klicka på namnet igen för att ta bort personen.',
  'help.guide.booking-travelers.step.3': 'Klicka på Uppdatera.',
  'help.guide.booking-travelers.step.4':
    'Klicka på Filtrera i fältet. Under Resenärer klickar du på en person för att bara se hens bokningar. Du kan välja flera samtidigt.',
  'help.guide.booking-travelers.result':
    'Kortet listar personerna som bokningen gäller, och Filtrera begränsar fliken till bokningarna för de personer du väljer.',
  'help.guide.booking-travelers.tip.1':
    'På kortet och i detaljvyn visas resenärerna bara, du kan inte ändra dem där. Du anger dem här, i formuläret.',
  'help.guide.booking-travelers.tip.2':
    '”Resenärer” visas i ”Filtrera” när resan har fler än en medlem och minst en bokning anger någon. Ditt val ligger kvar tills du stänger webbläsarfliken.',
  // booking-files
  'help.guide.booking-files.title': 'Behåll vouchern hos bokningen',
  'help.guide.booking-files.goal': 'Bifoga bekräftelsen, biljetten eller passet till den bokning den hör till.',
  'help.guide.booking-files.step.1':
    'Öppna bokningen med pennan på kortet. Filer finns bredvid Länka, och där klickar du på Bifoga fil. På en bokning som redan finns laddas dokumentet upp direkt, och TREK visar Fil uppladdad.',
  'help.guide.booking-files.step.2':
    'Dokumentet listas med sitt namn, med en knapp för att öppna det och ett kryss bredvid.',
  'help.guide.booking-files.step.3':
    'Länka till befintlig fil visar resans dokument som inte redan finns på den här bokningen. Välj ett, så bifogas det utan att något laddas upp igen.',
  'help.guide.booking-files.step.4': 'Klicka på Uppdatera.',
  'help.guide.booking-files.result':
    'Kortet och detaljvyn listar dokumenten under Filer. Klicka på ett dokument för att öppna det. ”Visa i filer”, ovanför listan i detaljvyn, tar dig till fliken Filer.',
  'help.guide.booking-files.tip.1':
    'På en bokning som du fortfarande skapar laddas dokumentet upp när du klickar på Lägg till. Uppladdning kräver en anslutning.',
  'help.guide.booking-files.tip.2':
    'Krysset bredvid ett dokument tar bort länken, inte dokumentet. Dokumentet finns kvar på resans flik ”Filer”.',
  'help.guide.booking-files.tip.3':
    'Administratören bestämmer vilka filtyper som får bifogas, under ”Tillåtna filtyper”. Dokument, text och bilder är tillåtna som standard.',
  // booking-cost
  'help.guide.booking-cost.title': 'Gör en boknings pris till en kostnad',
  'help.guide.booking-cost.goal':
    'Lägg till kostnaden för en bokning i Kostnader, fördelad mellan de personer som betalar för den.',
  'help.guide.booking-cost.step.1':
    'Öppna bokningen med pennan på kortet och gå längst ner i formuläret. Under Kostnader hittar du Skapa utgift och Länka befintlig utgift, med noteringen Sparar bokningen och öppnar sedan kostnadsredigeraren.',
  'help.guide.booking-cost.step.2':
    'Klicka på Skapa utgift. Bokningen sparas, dess formulär stängs och kostnadsredigeraren öppnas som Lägg till utgift.',
  'help.guide.booking-cost.step.3':
    'Namnet i rubriken är redan bokningens titel, och Dag är redan bokningens dag. Fyll i Totalt belopp och kontrollera Valuta bredvid.',
  'help.guide.booking-cost.step.4':
    'Brickan i rubriken är Kategori, redan inställd på den som passar bokningstypen. Under Vem betalade? väljer du vem som betalade, och under Fördelning väljer du hur beloppet delas.',
  'help.guide.booking-cost.step.5': 'Klicka på ”Lägg till utgift”.',
  'help.guide.booking-cost.result':
    'Kortet visar beloppet längst ner, bokningens formulär listar utgiften under ”Länkade utgifter”, och samma utgift visas på fliken ”Kostnader”, kopplad till den här bokningen.',
  'help.guide.booking-cost.tip.1':
    'Kategorin beror på typen: Restaurang blir Mat och dryck, Boende blir Boende, Parkering blir Parkering, och Evenemang och Rundtur blir båda Andra.',
  'help.guide.booking-cost.tip.2':
    'En bokning kan ha flera utgifter. Länka befintlig utgift visar de utgifter i Kostnader som ännu inte är länkade till något. På en länkad utgift tar Koppla ifrån, behåll utgiften bort länken men behåller utgiften i Kostnader, medan papperskorgen raderar den.',
  'help.guide.booking-cost.tip.3':
    'Kostnader finns i formuläret bara när tillägget Kostnader är på, vilket administratören slår på under Tillägg.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Hitta en bokning',
  'help.guide.filter-bookings.goal': 'Filtrera en lång flik på ett ord, en status, en typ eller en person.',
  'help.guide.filter-bookings.step.1':
    'Skriv i ”Sök” i fältet. Sökningen gäller titlar, typer, platser och adresser, noteringar, bokningskoder och resenärernas namn, och fliken visar färre resultat medan du skriver. Escape tömmer rutan.',
  'help.guide.filter-bookings.step.2':
    'Klicka på ”Filtrera”, tratten bredvid sökfältet. Panelen innehåller ”Status”, ”Typ” och, när en bokning har tilldelade personer, ”Resenärer”.',
  'help.guide.filter-bookings.step.3':
    'Välj Bekräftat eller Väntande under Status för att bara se dem. Alla visar båda.',
  'help.guide.filter-bookings.step.4':
    'Under Typ klickar du på en eller flera typer för att bara visa dem. Varje typ visar hur många bokningar den har, och en bock markerar de valda.',
  'help.guide.filter-bookings.step.5':
    'Ett tal på Filtrera visar hur många filter som är på, och en bricka bredvid sökningen visar hur många av alla bokningar som är kvar. Klicka på brickan, eller på Återställ filter längst ner i panelen, för att se allt igen.',
  'help.guide.filter-bookings.result':
    'Fliken visar bara det du valde, i Kort, Lista och Tidslinje, och filtren ligger kvar för den här resan tills du stänger webbläsarfliken.',
  'help.guide.filter-bookings.tip.1':
    'Typ visas bara när fliken har fler än en typ, och den listar bara typerna som finns i fliken. Om fliken saknar rundturer finns alltså inget alternativ Rundtur i Typ.',
  'help.guide.filter-bookings.tip.2':
    'Om inget matchar filtret visar fliken ”Inget matchar de här filtren”, med ”Återställ filter” direkt under.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Importera en bokning från bekräftelsen',
  'help.guide.import-booking-file.goal':
    'Låt TREK läsa bokningen från mejlet eller PDF-filen som leverantören skickade, så att du slipper skriva in den igen.',
  'help.guide.import-booking-file.step.1':
    'Klicka på nedladdningsikonen i fältet, Importera bokningsbekräftelser. Namnet visas när du håller muspekaren över den. Dialogrutan med samma namn öppnas.',
  'help.guide.import-booking-file.step.2':
    'Släpp bekräftelserna på rutan, eller klicka på den och välj dem: EML, PDF, PKPass, HTML och TXT, upp till fem filer på 10 MB vardera, samt foton (JPG, PNG, WEBP) när AI-modellen kan läsa bilder. De filer du har valt visas med namn på rutan.',
  'help.guide.import-booking-file.step.3':
    'Klicka på Importera. Dialogrutan stängs direkt, eftersom filen läses i bakgrunden.',
  'help.guide.import-booking-file.step.4':
    'Ett kort nere till höger visar förloppet under filens namn. Det syns kvar medan du rör dig i appen och efter en omladdning. Analyserar filer… ändras till en bock när läsningen är klar, och kortet erbjuder Importera. Klicka på det.',
  'help.guide.import-booking-file.step.5':
    'Varje bokning som hittades öppnas i Ny bokning, en efter en, redan ifylld. För ett hotell är det dess namn som titel och, om resan har platsen, under Boende, dess Plats / Adress, Från och Till på dess nätter, Incheckning och Utcheckning, Bokningskod, bekräftelsen under Filer och, med Kostnader på, priset som Relaterade kostnader. Kontrollera uppgifterna och klicka på Lägg till.',
  'help.guide.import-booking-file.result':
    'Bokningen visas som ett kort under ”Väntande” med sina nätter, sin kod och bekräftelsen under ”Filer”. Vistelsen visas på de dagarna i planen. Om ”Kostnader” är påslaget läggs priset till som en utgift som är kopplad till bokningen.',
  'help.guide.import-booking-file.tip.1':
    'Importikonen visas bara när servern kan läsa bekräftelser. Det kräver antingen extraktorn eller tillägget ”AI-tolkning”. Administratören slår på tillägget ”AI-tolkning” under ”Tillägg”. En flik utan bokningar visar den också som knappen ”Importera från fil”.',
  'help.guide.import-booking-file.tip.2':
    'Om inget gick att läsa visar kortet det. När AI-tolkning är på erbjuds Försök med AI-analys, som skickar samma filer direkt till modellen. En färdig tolkning sparas i tio minuter, så starta genomgången inom den tiden.',
  'help.guide.import-booking-file.tip.3':
    'Bekräftelsen bifogas bara om dess typ finns bland Tillåtna filtyper i admininställningarna. PDF är tillåtet från början, men ett mejl, EML, måste läggas till först, annars sparas bokningen utan det.',
  // edit-booking
  'help.guide.edit-booking.title': 'Ändra en bokning',
  'help.guide.edit-booking.goal':
    'Rätta en tid, lägg till koden som kom senare eller flytta en bokning från Väntande till Bekräftat.',
  'help.guide.edit-booking.step.1':
    'Håll muspekaren över kortet och klicka på pennan i dess rubrik. Redigera bokning öppnas med alla bokningens uppgifter.',
  'help.guide.edit-booking.step.2':
    'Ändra det som behöver ändras, till exempel ”Bokningskod” som operatören skickade senare.',
  'help.guide.edit-booking.step.3':
    'Klicka på pillern ”Väntande” i bandet överst. Den ändras till ”Bekräftat” och bandet blir grönt.',
  'help.guide.edit-booking.step.4': 'Klicka på Uppdatera.',
  'help.guide.edit-booking.result':
    'Kortet flyttas: en bekräftad bokning visas i avsnittet Bekräftat med en grön prick och ett grönt övre band, och alla på resan ser den flytta sig.',
  'help.guide.edit-booking.tip.1':
    'Om du inte kan läsa en Bokningskod är Blurra bokningskoder på i Inställningar, under Visning. Håll muspekaren över koden, eller klicka på den, för att läsa den.',
  'help.guide.edit-booking.tip.2':
    'Om du ändrar typ ändras kategorin för en länkad utgift med den, om du inte har valt en kategori för hand i kostnadsredigeraren.',
  'help.guide.edit-booking.tip.3':
    'Redigera längst ner i en bokningens detaljvy öppnar samma formulär. Du kan också ändra status utan formulär: klicka på pricken på ett kort eller en rad, eller på statusbrickan i detaljvyn.',
  // delete-booking
  'help.guide.delete-booking.title': 'Radera en bokning',
  'help.guide.delete-booking.goal': 'Ta bort en avbokad bokning från resan.',
  'help.guide.delete-booking.step.1':
    'Peka på kortet och klicka på papperskorgen i dess rubrik. Papperskorgen längst ned i en boknings detaljer gör samma sak.',
  'help.guide.delete-booking.step.2':
    'Ta bort bokningen? anger bokningen som du valde och säger att den raderas permanent. Om kostnader är kopplade till den står det att de raderas också.',
  'help.guide.delete-booking.step.3': 'Klicka på Radera.',
  'help.guide.delete-booking.result':
    'Kortet raderas för alla på resan. Det går inte att ångra när man raderar en bokning, så bekräftelsefrågan är din sista chans att avbryta.',
  'help.guide.delete-booking.tip.1':
    'Om du raderar en bokning raderas också utgifterna som är länkade till den. Om du raderar ett boende tas även dess nätter bort från dagsplanen.',
  'help.guide.delete-booking.tip.2':
    'Dokument som var bifogade finns kvar i resans flik Filer. Bara deras länk till bokningen tas bort.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Kostnader',
  'help.ctx.trip-costs.summary':
    'Resans pengar: varje utgift i en daterad liggare eller en tabell, vem som har lagt in den och vem som är skyldig för den, i kvittots valuta. Högerkolumnen visar vem som måste betala vem för att göra upp saldot.',
  'help.ctx.trip-costs.bullet.1':
    'Fältet överst visar resans datum och de resenärer som kostnaderna delas mellan. Där finns också Sök kostnader…, Filtrera (tratten), Exportera CSV (nedladdningsikonen) och omkopplaren Lista / Tabell.',
  'help.ctx.trip-costs.bullet.2':
    'Längst till höger registrerar Betala alla öppna överföringar på en gång, Skanna kvitto fyller i en utgift från ett foto när tillägget AI-tolkning kan läsa bilder, och Lägg till utgift öppnar redigeraren.',
  'help.ctx.trip-costs.bullet.3':
    'Fyra kort under fältet: Du är skyldig och Du har att få är din egen sida av uppgörelsen, Utestående belopp är det som är registrerat men ännu saknar betalare, och Totala resekostnader summerar allt, med Din andel och Du betalade under.',
  'help.ctx.trip-costs.bullet.4':
    'Redovisningen är grupperad efter dag, de nyaste först, och varje dag har en rubrik med antalet poster och vad som spenderats den dagen. En rad visar kategorin som en färgad flik, namnet, betalarna som etiketter med vad var och en har betalat, och under dem Fördelning med varje resenärs andel (en bock markerar vem som har betalat sin del), därefter noteringen och beloppet, samt du lånade ut eller du lånade när fördelningen betyder att andra är skyldiga dig pengar eller att du är skyldig pengar.',
  'help.ctx.trip-costs.bullet.5':
    'Högerkolumnen visar resultaten: Betala listar vem som betalar vem, Balanser visar varje resenärs överskott eller underskott, Slutlig budget visar vad resan kostar var och en av dem, och Via kategori visar vad pengarna gick till.',
  'help.ctx.trip-costs.bullet.6':
    'En registrerad betalning visas i samma liggare som en egen rad, med en penna och Ångra bredvid. En utgift har en penna och en papperskorg, och papperskorgen frågar innan utgiften raderas. En utgift med kvitton har ett Kvitto-chip bredvid namnet som öppnar dem.',
  'help.ctx.trip-costs.bullet.7':
    '”Tabell” i fältet visar samma utgifter som ett kalkylblad, grupperade per kategori, med ”Personer” och ”Dagar” och beloppet per person och per dag. ”Sammanfattning” ersätter då ”Via kategori”. ”Kostnader” kommer ihåg vyn du valde.',
  // add-expense
  'help.guide.add-expense.title': 'Lägg till en utgift',
  'help.guide.add-expense.goal': 'Registrera vad något kostade, vem som betalade och vilka det delas med.',
  'help.guide.add-expense.step.1':
    'Klicka på Lägg till utgift längst till höger i fältet. Redigeraren öppnas med dagens datum, betald av dig och med alla redan med i fördelningen.',
  'help.guide.add-expense.step.2':
    'Skriv vad utgiften gällde i fältet överst i dialogrutan. När det är tomt visas t.ex. middag, souvenirer, bensin…. Det är utgiftens namn, och du kan inte spara utgiften utan ett namn.',
  'help.guide.add-expense.step.3':
    'Brickan under namnet är Kategori, Mat och dryck tills du väljer en annan. Det finns fjorton kategorier och de går inte att ändra. Rubrikens färg ändras till färgen på kategorin du väljer, och det gör även fliken på raden och dess stapel i Via kategori.',
  'help.guide.add-expense.step.4':
    'Ange beloppet från kvittot i Totalt belopp. Valuta bredvid är först inställd på den valuta som Kostnader visas i. Om du ändrar den visar redigeraren det omräknade beloppet. Dag är först inställd på idag, och utgiften grupperas under den dagen i listan.',
  'help.guide.add-expense.step.5':
    'Under ”Vem betalade?” klickar du på personen som faktiskt betalade. ”Du” är förvalt. ”Ingen har betalat än” bokför beloppet utan att någon är skyldig pengar för det, och ”Flera personer betalade” i växeln bredvid rubriken delar notan mellan flera betalare.',
  'help.guide.add-expense.step.6':
    '”Fördelning” nedanför börjar på ”Lika”, med alla ibockade och varje andel bredvid namnet. Behåll den eller ändra den. Klicka på ”Lägg till utgift” längst ner i dialogen för att spara.',
  'help.guide.add-expense.result':
    'Utgiften ligger i liggaren under sin dag och räknas in i Totala resekostnader, och uppgörelsekolumnen har räknat om vem som är skyldig vem.',
  'help.guide.add-expense.tip.1':
    'Om du inte ändrar standardvärdena får utgiften dagens datum, betalas av dig och delas lika mellan alla. Du behöver bara fylla i namn och belopp.',
  'help.guide.add-expense.tip.2':
    '± bredvid beloppet gör utgiften till en återbetalning. En negativ summa betyder att pengar betalas tillbaka, och fördelningen vänds.',
  'help.guide.add-expense.tip.3':
    'Bifoga, bredvid Kvitton & fakturor längst ned i dialogen, tar bilder och PDF-filer. De laddas upp när du sparar och lagras i resans Filer, och ett Kvitto-märke visas bredvid namnet i listan.',
  // expense-payers
  'help.guide.expense-payers.title': 'Ange vem som betalade',
  'help.guide.expense-payers.goal':
    'Registrera vem som betalade för en utgift. Det är den andra halvan av uppgörelseberäkningen.',
  'help.guide.expense-payers.step.1':
    'Öppna en utgift med pennan bredvid dess rad och titta på ”Vem betalade?”. ”En person betalade” är standard i växeln bredvid rubriken: varje resenär är en bricka, och brickan med kontur är personen som betalade. Klicka på en annan bricka för att ändra.',
  'help.guide.expense-payers.step.2':
    '”Ingen har betalat än”, den streckade brickan efter resenärerna, bokför beloppet utan att någon blir skyldig något. Utgiften räknas ändå med i ”Totala resekostnader”.',
  'help.guide.expense-payers.step.3':
    'Flera personer betalade, det andra alternativet på samma reglage, listar alla resenärer med en ruta att bocka för, och varje person du bockar för får ett beloppsfält. Bocka för de som har betalat och skriv in hur mycket var och en betalade. Beloppen måste summera till totalbeloppet.',
  'help.guide.expense-payers.step.4':
    'En utgift som ingen har betalat är markerad Oavslutad på sin rad och räknas in i kortet Utestående belopp, som summerar utgifter som ännu saknar betalare.',
  'help.guide.expense-payers.result':
    'Vem som betalade avgör vem som får pengar tillbaka, fördelningen avgör vem som betalar, och Balanser är skillnaden mellan de två.',
  'help.guide.expense-payers.tip.1':
    'Vem betalade? och Fördelning är oberoende av varandra: du kan betala för en middag som du inte var med på, och ingå i fördelningen av en som du inte betalade.',
  'help.guide.expense-payers.tip.2':
    'Med flera betalare måste beloppen summera till totalbeloppet. När du bockar i ytterligare en betalare fördelas resten på nytt mellan de belopp som du inte har skrivit in själv. Så länge beloppen inte stämmer visar redigeraren totalen de måste summera till och sparar inte.',
  'help.guide.expense-payers.tip.3':
    'Om du sätter en utgift tillbaka på ”Ingen har betalat än” tas den inte bort: beloppet finns kvar i ”Totala resekostnader” och raden blir ”Oavslutad”.',
  // split-expense
  'help.guide.split-expense.title': 'Dela en nota mellan resenärerna',
  'help.guide.split-expense.goal':
    'Bestäm vem som är skyldig för en utgift: alla lika, per belopp eller post för post utifrån kvittot.',
  'help.guide.split-expense.step.1':
    'I utgiftsredigeraren listar Fördelning varje resenär med en ruta att bocka i. Bocka ur ett namn för att lämna personen utanför den här utgiften: namnet blir grått, tappar sin andel och är inte skyldig något för den.',
  'help.guide.split-expense.step.2':
    'Lika, i omkopplaren bredvid rubriken, är standard: varje ibockad resenär får lika stor andel, som visas bredvid namnet. Brickorna under listan visar hur många som delar och hur stor varje andel är.',
  'help.guide.split-expense.step.3':
    'Anpassat byter ut andelarna mot beloppsfält. Skriv vad varje resenär är skyldig. Brickan under uppdateras medan du skriver och blir grön med texten Fördelningen stämmer med totalen. Du kan inte spara så länge beloppen inte stämmer med totalen.',
  'help.guide.split-expense.step.4':
    'Kvitto delar upp kvittot rad för rad: Lägg till artikel, sedan ett namn och ett pris per rad, och bredvid Delas mellan: resenärerna som delar den raden.',
  'help.guide.split-expense.step.5':
    '”Andel per person” under raderna visar vad varje resenär till slut är skyldig, och ”Totalt belopp” högst upp är summan av raderna. Klicka på ”Spara” längst ner i dialogen.',
  'help.guide.split-expense.result':
    'Alla saldon räknas ut från fördelningen. Den sparas med utgiften, visas på dess rad som Fördelning med varje resenärs del och kan ändras senare utan att något annat påverkas.',
  'help.guide.split-expense.tip.1':
    'En resenär som du bockar ur är inte skyldig något för just den här utgiften. De andra betalar sin andel.',
  'help.guide.split-expense.tip.2':
    'Lika fördelar på exakt cent: den överblivna centen går till en annan person för varje utgift, så att inte samma person alltid får betala den.',
  'help.guide.split-expense.tip.3':
    'Kvittoläget räknar ut Totalt belopp själv och gråar ut fältet: totalen är summan av kvittots rader.',
  'help.guide.split-expense.tip.4':
    'En anpassad fördelning kan också anges i procent: ställ Ange andelar som på %, och andelarna måste tillsammans bli 100 % innan utgiften sparas.',
  // expense-currency
  'help.guide.expense-currency.title': 'Lägg in en utgift i en annan valuta',
  'help.guide.expense-currency.goal': 'Ange beloppet på kvittot, så sparar TREK växelkursen.',
  'help.guide.expense-currency.step.1':
    'Öppna ”Lägg till utgift”. Skriv namnet högst upp i dialogen och ange beloppet i ”Totalt belopp” precis som det står på kvittot, inte ett omräknat belopp.',
  'help.guide.expense-currency.step.2':
    'Öppna ”Valuta” bredvid beloppet och välj kvittots valuta. Listan innehåller alla koder som TREK känner till och går att söka i: skriv de tre bokstäverna.',
  'help.guide.expense-currency.step.3':
    'Under fälten visas en rad med etiketter: beloppet du skrev och dess aktuella värde, märkt realtidspris. Det är bara en förhandsgranskning. Det är inte värdet som sparas.',
  'help.guide.expense-currency.step.4':
    'Klicka på Lägg till utgift längst ner i dialogrutan. Kursen låses vid just det tillfället: utgiften behåller det värde den hade den dag du lade in den.',
  'help.guide.expense-currency.step.5':
    'I utgiftslistan visar raden båda beloppen under namnet: det du skrev, en pil och beloppet i resans valuta. Varje summa, balans och uppgörelse i fliken Kostnader utgår från det andra beloppet.',
  'help.guide.expense-currency.result':
    'Utgiften behåller beloppet och valutan som du skrev. Utgiftslistan visar båda, och resans summor och balanser räknas i resans valuta.',
  'help.guide.expense-currency.tip.1':
    'Kursen låses när du sparar, så en uppgjord skuld ändras inte när växelkursen ändras veckan efter. En ny kurs sparas bara när du ändrar utgiftens valuta.',
  'help.guide.expense-currency.tip.2':
    '”Visningsvaluta” i Inställningar ändrar bara hur beloppen visas. De sparade beloppen ändras aldrig. Om fältet är tomt visas varje resa i sin egen valuta.',
  'help.guide.expense-currency.tip.3':
    'Resans valuta ställs in på själva resan, under ”Redigera resa”, och kräver behörigheten ”Redigera resedetaljer”. Om du ändrar den räknas alla frysta kurser om för den nya valutan. Själva beloppen räknas inte om.',
  // filter-costs
  'help.guide.filter-costs.title': 'Hitta en utgift, eller en dags utgifter',
  'help.guide.filter-costs.goal': 'Filtrera en lång lista med utgifter så att du bara ser det du letar efter.',
  'help.guide.filter-costs.step.1':
    'Skriv i Sök kostnader… i fältet. Den matchar utgiftens namn medan du skriver, och Esc rensar den igen.',
  'help.guide.filter-costs.step.2':
    'Filtrera, tratten bredvid sökningen, öppnar filtren. Omkopplaren överst är din egen vy av utgiftslistan: Alla, Betalat av mig för det du har betalat, och Jag har att få för utgifter där du har betalat mer än din andel.',
  'help.guide.filter-costs.step.3':
    'Under Kategori väljer du en av de fjorton kategorierna, så visas bara den kategorins utgifter. Tratten visar hur många filter som är på.',
  'help.guide.filter-costs.step.4':
    'Under ”Dag” väljer du en av dagarna med utgifter. En banner ersätter dagsrubrikerna och visar den dagen i sin helhet, hur många utgifter den har och dess summa.',
  'help.guide.filter-costs.step.5':
    '”Exportera CSV”, nedladdningsikonen bredvid tratten, sparar alla utgifter i en fil, med ursprungsbelopp, valuta och omräknat belopp.',
  'help.guide.filter-costs.result':
    'Du kan kombinera filtren, och dagsgrupperna uppdateras med egna summor för de utgifter som återstår.',
  'help.guide.filter-costs.tip.1':
    'Registrerade betalningar har inget namn och ingen kategori, så en sökning eller ett kategorifilter döljer dem, och det gör Jag har att få också. Dagsfiltret behåller dem, under den dag då betalningen gjordes.',
  'help.guide.filter-costs.tip.2':
    'Exportera CSV exporterar alltid alla utgifter, oavsett vad som är filtrerat på skärmen, med en rad per utgift.',
  'help.guide.filter-costs.tip.3':
    'Återställ filter, längst ner i filtermenyn när ett filter är på, stänger av alla filter på en gång.',
  // settle-up
  'help.guide.settle-up.title': 'Se vem som är skyldig vem och gör upp skulderna',
  'help.guide.settle-up.goal':
    'Gör många delade utgifter till så få överföringar som möjligt som gör upp alla skulder, och registrera överföringarna när de görs.',
  'help.guide.settle-up.step.1':
    'Kortet ”Betala” i den högra kolumnen listar de överföringar som skulle göra upp alla skulder: vem som betalar vem, visat som två avatarer med namnen i verktygstipset, och hur mycket. Siffran i kortets rubrik visar hur många som fortfarande är öppna.',
  'help.guide.settle-up.step.2':
    '”Lösa” bredvid en överföring bokför den som gjord. Överföringen försvinner från kortet och saldona uppdateras.',
  'help.guide.settle-up.step.3':
    'Den registrerade överföringen är en rad i liggaren, under dagen då den skedde, märkt Betalning med de två resenärerna och beloppet.',
  'help.guide.settle-up.step.4':
    'Bredvid raden rättar pennan en betalning och Ångra avbryter den, och överföringen går tillbaka till kortet Betala.',
  'help.guide.settle-up.step.5':
    'Lägg till betalning i kortets rubrik registrerar en överföring som inte följde ett förslag. Välj Från och Till, beloppet, valutan och dagen då det skedde, lägg till en Notering, till exempel hur det betalades, och klicka sedan på Lägg till betalning längst ned i dialogen.',
  'help.guide.settle-up.step.6':
    'Betala i fältet överst registrerar alla öppna överföringar på en gång, utan att fråga, till exempel när gruppen gör upp alla skulder i slutet av en resa.',
  'help.guide.settle-up.result':
    'Varje registrerad överföring är en rad i utgiftslistan och tar bort en rad från kortet Betala. När kortet visar Alla är likadana är resan helt betald.',
  'help.guide.settle-up.tip.1':
    'Kortet visar det minsta antalet överföringar, inte varje skuld: om tre personer är skyldiga varandra i en cirkel minskas det till en eller två betalningar.',
  'help.guide.settle-up.tip.2':
    '”Lösa” bokför bara en överföring. Det skickar inga pengar. Betala med ditt vanliga betalsätt och klicka sedan på ”Lösa”.',
  'help.guide.settle-up.tip.3':
    'En betalning kan göras i vilken valuta som helst, så att betala en yen-skuld i euro är helt normalt. Dialogen har en egen valutaväljare och fryser också den kursen.',
  // final-budget
  'help.guide.final-budget.title': 'Se vad resan kostade varje resenär',
  'help.guide.final-budget.goal': 'Se siffrorna för varje person: saldot i dag och den verkliga kostnaden per person.',
  'help.guide.final-budget.step.1':
    'Balanser visar varje resenärs ställning: en grön stapel åt höger om resan är skyldig personen pengar, en röd stapel åt vänster om personen är skyldig resan pengar, och beloppet står bredvid namnet.',
  'help.guide.final-budget.step.2':
    'Slutlig budget under den svarar på en annan fråga: inte vem som är skyldig vad just nu, utan vad resan kostar varje resenär när allt har betalats tillbaka.',
  'help.guide.final-budget.step.3':
    'Klicka på ett namn för att se beräkningen: Betalda utgifter, och under den Återbetalningar netto och Väntande återbetalningar.',
  'help.guide.final-budget.step.4':
    'Under de tre raderna finns en lista under varje resenärs namn med de rader som ingår i den raden: de utgifter som resenären betalade, de överföringar som redan är bokförda och de som fortfarande är öppna. Varje lista summeras exakt till raden med samma namn.',
  'help.guide.final-budget.result':
    '”Balanser” visar vem som har pengar att få och vem som är skyldig pengar i dag. ”Slutlig budget” visar vad resan kostar var och en av er när allt är återbetalt.',
  'help.guide.final-budget.tip.1':
    'Att registrera en betalning ändrar ingens slutbudget. Den flyttar bara ett belopp från väntande återbetalningar till nettoåterbetalningar.',
  'help.guide.final-budget.tip.2':
    'En utgift utan betalare ingår inte i något av korten, på samma sätt som den inte ingår i förslagen för hur ni gör upp.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Gör en bokning till en utgift',
  'help.guide.expense-from-booking.goal':
    'Koppla det som ett flyg, ett hotell eller en plats faktiskt kostade till posten den hör till.',
  'help.guide.expense-from-booking.step.1':
    'Hitta bokningen på fliken Transporter eller Bokningar och klicka på pennan överst på dess kort.',
  'help.guide.expense-from-booking.step.2':
    'Bläddra till Kostnader nära slutet av formuläret. Där finns Skapa utgift, som sparar bokningen först, och Länka befintlig utgift för en utgift som redan finns i Kostnader.',
  'help.guide.expense-from-booking.step.3':
    'Klicka på Skapa utgift. Bokningen sparas, formuläret stängs och redigeraren Kostnader öppnas med bokningens titel som namn, bokningens typ matchad mot en kategori och bokningens dag som utgiftens dag.',
  'help.guide.expense-from-booking.step.4':
    'Fyll i beloppet och dess valuta, vem som betalade och fördelningen, precis som för vilken utgift som helst, och klicka på ”Lägg till utgift”. När du öppnar bokningen igen visas utgiften under ”Länkade utgifter”, med en penna för att redigera den, ”Koppla ifrån, behåll utgiften” för att ta bort länken men behålla utgiften, och en papperskorg för att radera den.',
  'help.guide.expense-from-booking.result':
    'Bokningen visar sin kostnad, och utgiften är en vanlig rad på fliken ”Kostnader”, med betalare, fördelning och valuta som vilken annan utgift som helst.',
  'help.guide.expense-from-booking.tip.1':
    'Om du raderar bokningen raderas även dess länkade utgifter, och bekräftelsefrågan säger det. Ta bort utgiften i bokningens block Kostnader gör tvärtom: utgiften raderas och bokningen finns kvar. Koppla ifrån, behåll utgiften behåller båda.',
  'help.guide.expense-from-booking.tip.2':
    'En plats har samma block i sitt formulär, där Skapa utgift sparar platsen först.',
  // costs-table
  'help.guide.costs-table.title': 'Planera kostnaderna i en tabell',
  'help.guide.costs-table.goal':
    'Läs och ändra utgifterna som en tabell, sorterade efter kategori och beräknade per person och per dag.',
  'help.guide.costs-table.step.1':
    'Klicka på Tabell, den andra ikonen i omkopplaren Lista / Tabell i fältet. En tabell med samma utgifter ersätter utgiftslistan, och sökningen och filtren gäller även den.',
  'help.guide.costs-table.step.2':
    'Tabellen är grupperad efter kategori. Varje grupprubrik visar kategorins namn, hur många utgifter den har och dess delsumma. Klicka på rubriken för att fälla ihop gruppen. Kolumnerna är Namn, Datum, Totalt, Personer och Dagar, därefter Per Person, Per Dag och P. p / Dag, som räknas ut från de föregående och har grå bakgrund. En rad Totalt längst ned summerar allt.',
  'help.guide.costs-table.step.3':
    'Klicka på en cell för att ändra den direkt: ett namn, en total, Personer eller Dagar. Skriv och tryck sedan på Enter eller klicka någon annanstans för att spara, eller tryck på Esc för att avbryta. Datumet öppnar kalendern. Per Person och de andra beräknade kolumnerna uppdateras direkt.',
  'help.guide.costs-table.step.4':
    'En summa med ett lås kan inte ändras här: någon har betalat den, eller så angavs den i en annan valuta, och verktygstipset visar vilket. Om du klickar på den öppnas utgiften i stället, så att saldona och den fasta växelkursen förblir korrekta.',
  'help.guide.costs-table.step.5':
    '”Lägg till utgift” i slutet av en kategori lägger till en rad med namnet ”Nytt inlägg”, med datumet för den senaste posten där. Namnfältet är redan öppet så att du kan ändra det. Ange en summa på samma sätt.',
  'help.guide.costs-table.step.6':
    'I den här vyn visar högerkolumnen Sammanfattning i stället för Via kategori. Den summerar utgifterna på fyra sätt: Kategori, Dag, Betalare, med Ingen betalare ännu för de obetalda, och Status, Betald mot Öppen.',
  'help.guide.costs-table.result':
    'Varje utgift visas i sin kategori med beloppet per person och per dag. När du ändrar en total i en ruta uppdateras kortet ovanför och Sammanfattning direkt.',
  'help.guide.costs-table.tip.1':
    'Kostnader kommer ihåg vyn i den här webbläsaren: fliken öppnas på tabellen tills du klickar på Lista igen.',
  'help.guide.costs-table.tip.2':
    'En utgift med fördelningen Anpassat eller Kvitto har ingen enskild andel per person, så dess Per Person och P. p / Dag förblir tomma.',
  'help.guide.costs-table.tip.3':
    'Betalare, fördelning, notering och kvitton redigerar du i själva utgiften: Fler alternativ i slutet av en rad har Redigera, och Radera för att ta bort raden.',

  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transporter',
  'help.ctx.trip-transports.summary':
    'Alla sätt att resa mellan stoppen: flyg, tåg, bussar, bilar, taxi, cyklar, kryssningar, färjor, linbanor och de kollektivtrafikförbindelser som TREK slår upp åt dig. Fliken listar dem. Du kan också skapa och läsa dem i planen, och de ritas på kartan.',
  'help.ctx.trip-transports.bullet.1':
    'Fliken visar bara färderna. Boende, restauranger, evenemang och biljetter finns på fliken Bokningar, så att samma post aldrig visas två gånger.',
  'help.ctx.trip-transports.bullet.2':
    'Fältet överst har Sök, Filtrera för status, typer och resenärer, de tre vyerna Kort, Lista och Tidslinje, Visningsalternativ och Exportera som kalkylblad (CSV), som laddar ner det som visas. Transport till höger lägger till en resa för hand. Ikonerna före den, Importera bokningsbekräftelser och Importera från AirTrail, visas när servern kan läsa bekräftelser eller en AirTrail är ansluten. På en tom flik visas samma åtgärder i mitten som Transport, Importera från fil och AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    'Kort är vyn som fliken öppnas i: Bekräftat först, sedan Väntande. Du kan fälla ihop varje avsnitt genom att klicka på dess rubrik. De planerade kollektivtrafikförbindelserna saknar status och visas bland de bekräftade resorna i tidsordning, om inte Visningsalternativ ger dem ett eget avsnitt, Automatisk kollektivtrafik. Lista grupperar per dag, och Tidslinje visar alla resor över resans dagar.',
  'help.ctx.trip-transports.bullet.4':
    'Kortets övre band är färgat efter status: grönt för bekräftad, gult för väntande och blått för en planerad förbindelse. Det visar statusprick, typ, titel, pennan och papperskorgen. Under det står Datum, Tid, Bokningskod, Rutt samt flygbolag och flygnummer, eller tågnummer, plattform och plats. Klicka på kortet för att öppna detaljerna.',
  'help.ctx.trip-transports.bullet.5':
    'Du kan också skapa transporter i planen: + i en dags rubrik (verktygstipset lyder Lägg till i denna dag), eller ett högerklick på rubriken, erbjuder Lägg till transport och Kollektivtrafik. Restidsförbindelsen mellan två stopp öppnar samma sökning för just den sträckan.',
  'help.ctx.trip-transports.bullet.6':
    'En transport med båda ändpunkterna angivna ritar en linje på kartan. Ruttikonen på transportens rad i dagsplanen och På kartan i dess detaljer slår på den linjen. Visa alla bokningsvägar i verktygsfältet ovanför dagarna slår på eller av linjerna för hela resan.',
  // transports-list
  'help.guide.transports-list.title': 'Läs fliken Transporter',
  'help.guide.transports-list.goal': 'Förstå vad listan visar innan du ändrar något i den.',
  'help.guide.transports-list.step.1':
    'Transporter är en flik i resan, efter Planering (och Turer, när det tillägget är på). Den innehåller bara själva resorna: hotell, restauranger, evenemang och biljetter finns på fliken Bokningar.',
  'help.guide.transports-list.step.2':
    'Sök till vänster i fältet filtrerar transporterna medan du skriver. Filtrera, tratten bredvid, öppnar valen: Status med Alla, Bekräftat och Väntande, och sedan varje typ som används, med antal. Markera en eller flera typer för att bara visa dem. En siffra på tratten visar hur många filter som är aktiva, och fältet visar hur många transporter som visas, till exempel 1 av 4. ”Återställ filter” längst ned i menyn visar alla transporter igen.',
  'help.guide.transports-list.step.3':
    '”Kort”, ”Lista” och ”Tidslinje” bredvid visar transporterna som kort, som rader grupperade per dag eller som staplar över resans dagar. ”Visningsalternativ”, reglageikonen, ställer in ”Gruppera efter” och ”Sortera efter” för ”Kort” och ”Lista” samt spåren för ”Tidslinje”. ”Återställ vy” går tillbaka till standardinställningarna. I ”Kort” visar ”Kollektivtrafik som eget avsnitt” de planerade förbindelserna under ”Automatisk kollektivtrafik”.',
  'help.guide.transports-list.step.4':
    'Varje kort visar alla detaljer. Bandet överst är grönt för ”Bekräftat” och bärnstensfärgat för ”Väntande”, och visar statusprickan, typen och titeln. Under det visar ”Datum” de dagar som transporten sträcker sig över, med datum. Sedan kommer ”Tid”, ”Bokningskod”, ”Rutt” med typens ikon mellan stoppen, samt flygbolag och flygnummer eller tågnummer, plattform och plats. Klicka på kortet för att öppna dess detaljer.',
  'help.guide.transports-list.step.5':
    'Klicka på statusprickens för att växla resan mellan Väntande och Bekräftat. Verktygstipset säger åt vilket håll, till exempel Sätt till Väntande. Pennan i rubrikraden öppnar transportens formulär, och papperskorgen raderar den efter frågan Ta bort bokningen?, som listar vad som raderas, även kopplade kostnader.',
  'help.guide.transports-list.result':
    'Varje kort visar om resan är bokad, och du kan när som helst använda fältet för att filtrera eller sortera listan.',
  'help.guide.transports-list.tip.1':
    'Fliken kommer ihåg dina inställningar: vyn, grupperingen och sorteringen i den här webbläsaren, de hopfällda avsnitten för varje resa, och filtren tills du stänger webbläsarfliken.',
  'help.guide.transports-list.tip.2':
    'Importera bokningsbekräftelser och Importera från AirTrail, de två ikonerna före Transport, visas bara när servern kan läsa bekräftelser och när en AirTrail-instans är ansluten. Utan dem fyller du listan för hand eller med kollektivtrafiksökningen.',
  // add-transport
  'help.guide.add-transport.title': 'Lägg till en transport på en dag',
  'help.guide.add-transport.goal': 'Lägg till transporten som tar dig från ett stopp till nästa på dagen då den sker.',
  'help.guide.add-transport.step.1':
    'Klicka på + i rubriken på dagen för färden, vars verktygstips lyder Lägg till i denna dag, och välj Lägg till transport. Högerklickar du på dagens rubrik får du samma meny. Formuläret öppnas med den dagen redan ifylld.',
  'help.guide.add-transport.step.2':
    'Typpillret i rubriken visar vilken typ av transport det är, som standard Flyg. Klicka på det för Flyg, Tåg, Buss, Bil, Taxi, Cyckel, Kryssning, Färja, Linbana eller Andra, så anpassas formuläret: ett flyg får en flygplats vid varje stopp, ett tåg en kedja av stationer, en kryssning Påstigning, Anlöpningshamn och Avstigning, och en bil Upphämtning och Återlämning samt Stopp längs vägen.',
  'help.guide.add-transport.step.3':
    'Skriv titeln direkt i det övre fältet, där den grå exempeltexten står. Det är det enda obligatoriska fältet: tills du har fyllt i det står det ”Titel *” på raden under och ”Lägg till” förblir grått. Använd en titel som du skulle känna igen på en avgångstavla.',
  'help.guide.add-transport.step.4':
    'Under ”Rutt” tar ”Från” och ”Till” en station, en hamn eller en adress. Resans egna platser föreslås innan du skriver. Skriv minst tre bokstäver för att söka och välj ett resultat. Ett namn som du bara skriver in och inte väljer bland resultaten sparas inte, och inget visas på kartan.',
  'help.guide.add-transport.step.5':
    'Datum och Starttid anger när resan börjar, Slutdatum och Sluttid när den slutar. För en resa som kommer fram nästa dag anger du nästa dag där. Bokningskod och Noteringar längre ned är valfria. Klicka på etiketten Väntande i rubriken för att ändra den till Bekräftat.',
  'help.guide.add-transport.step.6': 'Klicka på Lägg till.',
  'help.guide.add-transport.result':
    'Transporten är en rad på dagen, på sin tid bland stoppen, och ett kort i fliken Transporter under Väntande eller Bekräftat.',
  'help.guide.add-transport.tip.1':
    'Raden placeras efter starttiden, efter det sista stoppet som börjar tidigare. Dra den i handtaget till en annan position på dagen, eller till en annan dag.',
  'help.guide.add-transport.tip.2':
    'Använd Bifoga fil under Filer för att lägga till biljetten. Skapa utgift under Kostnader sparar bokningen och öppnar kostnadsredigeraren för biljettpriset.',
  'help.guide.add-transport.tip.3':
    '”Resenärer”, formulärets första block, anger vilka som åker med den här transporten. När resan har fler än en medlem och en transport anger någon erbjuder ”Filtrera” på fliken också ”Resenärer”, som bara visar en persons transporter.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Importera en flygning från e-biljetten',
  'help.guide.import-transport-file.goal':
    'Låt TREK läsa ett flyg, ett tåg eller en färja från biljetten som transportören skickade, och kontrollera uppgifterna innan de sparas.',
  'help.guide.import-transport-file.step.1':
    'Klicka på nedladdningsikonen före Transport i fältet på fliken Transporter, vars verktygstips lyder Importera bokningsbekräftelser. Dialogen med det namnet öppnas, samma som på fliken Bokningar. På en tom flik gör Importera från fil i mitten detsamma.',
  'help.guide.import-transport-file.step.2':
    'Släpp biljetten på rutan, eller klicka på rutan och välj filen: EML, PDF, PKPass, HTML och TXT, upp till fem filer på högst 10 MB vardera, samt foton av en biljett (JPG, PNG, WEBP) om din server har en AI-modell som kan läsa dem. Rutan visar namnen på filerna du valde.',
  'help.guide.import-transport-file.step.3':
    'Klicka på Importera. Dialogrutan stängs direkt, och filen läses i bakgrunden.',
  'help.guide.import-transport-file.step.4':
    'Ett kort nere till höger visar förloppet under filens namn. Analyserar filer… ändras till en bock när läsningen är klar, och kortet erbjuder Importera. Klicka på det.',
  'help.guide.import-transport-file.step.5':
    'En flygning öppnas i Lägg till transport, redan ifylld: typbrickan på Flyg, flygbolaget och flygnumret som titel i rubriken, båda flygplatserna under Rutt med Avgång och Ankomst, deras tider och tidszoner, Flygbolag och Flygnummer, Bokningskod och biljetten under Filer. Kontrollera uppgifterna och klicka på Lägg till.',
  'help.guide.import-transport-file.result':
    'Flygningen är ett kort under Väntande i fliken Transporter och en rad på avgångsdagen, med biljetten under Filer. När båda flygplatserna är kända visas flygningen som en kurva på kartan.',
  'help.guide.import-transport-file.tip.1':
    'De två flikarna använder samma import. En fil som innehåller både en flygning och ett hotell öppnar flygningen i ”Lägg till transport” och sedan hotellet i ”Ny bokning”, oavsett vilken flik du började från.',
  'help.guide.import-transport-file.tip.2':
    'Flygplatser placeras efter sin kod. Om en station eller en hamn inte kunde hittas visas dess namn i bärnstensfärg på importkortet längst ner till höger. Välj den för hand under ”Rutt” innan du klickar på ”Lägg till”, annars visas transporten inte på kartan.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planera en kollektivtrafikförbindelse',
  'help.guide.plan-transit.goal':
    'Låt TREK slå upp riktiga tåg och bussar mellan två punkter en dag och lägga in den du väljer i planen.',
  'help.guide.plan-transit.step.1':
    'Klicka på + i dagens rubrik och välj Kollektivtrafik. Sökningen öppnas för den dagen: dagen visas som en bricka i rubriken, och Manuell och Automatisk bredvid den växlar mellan den här sökningen och det vanliga formuläret.',
  'help.guide.plan-transit.step.2':
    'Från och Till tar ett stopp eller en station. Så länge rutan är tom föreslår TREK dagens boende, stationerna och flygplatserna från dagens bokningar och dagens egna stopp. När du skriver två bokstäver söker TREK i stället bland tidtabellens stationer. Byt plats mellan de två rutorna växlar Från och Till.',
  'help.guide.plan-transit.step.3':
    'Avgång eller Ankomst med en tid anger när du vill resa, och Bästa resväg, Färre byten eller Mindre gång anger hur resultaten ska sorteras.',
  'help.guide.plan-transit.step.4':
    'Brickorna nedanför visar vilka färdsätt som får användas: Tåg, Tunnelbana, Spårvagn, Buss, Färja och Linbana. Stäng av ett för att utesluta det, minst ett förblir på. Klicka sedan på Sök.',
  'help.guide.plan-transit.step.5':
    'Varje resultat visar avgång och ankomst, restid, antal byten och hur mycket du går, samt linjerna som brickor, i sina egna färger när tidtabellen anger dem. Klicka på ett resultat för att veckla ut det och se varje sträcka, med hållplatserna där du stiger på och byter, spåren och promenaderna mellan linjerna.',
  'help.guide.plan-transit.step.6': 'Klicka på ”Lägg till i denna dag”.',
  'help.guide.plan-transit.result':
    'Förbindelsen är en rad på dagen med sina linjeetiketter. Klicka på pilen för att se varje delsträcka. Den är också ett kort på fliken Transporter bland de bekräftade resorna, visat i blått.',
  'help.guide.plan-transit.tip.1':
    'Förbindelserna kommer från Transitous, en gratis gemenskapstjänst som använder öppna tidtabellsdata: ingen nyckel och inget konto. En administratör kan ställa in att sökningen i stället använder Google.',
  'help.guide.plan-transit.tip.2':
    'Hittades inget? Flödena täcker en region och en period. Prova en annan tid, slå på fler färdsätt eller välj en station i stället för själva platsen. Meddelandet visar vilken tjänst som svarade. En resa utan datum har ingen dag att söka på, så där finns bara det vanliga formuläret.',
  'help.guide.plan-transit.tip.3':
    'Samma sökning öppnas för en enskild sträcka: klicka på restidslänken mellan två stopp och välj Kollektivtrafik. Från, Till och avgångstiden fylls i åt dig.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Öppna och ändra en planerad förbindelse',
  'help.guide.change-transit-route.goal':
    'Läs förbindelsen rad för rad, byt namn på den eller sök efter resvägen igen.',
  'help.guide.change-transit-route.step.1':
    'På fliken ”Transporter” är en planerad förbindelse ett kort med blått övre fält, sorterat i tidsordning bland de bekräftade transporterna. När ”Kollektivtrafik som eget avsnitt” är påslaget under ”Visningsalternativ” visas den i stället under ”Automatisk kollektivtrafik”. Klicka på kortet. Förbindelsen öppnas som en bokning.',
  'help.guide.change-transit-route.step.2':
    'Rutorna överst visar avgången och ankomsten med sina hållplatser, ”Längd”, ”Byten” och ”Till fots”. Under dem visar ”Reseplan” förbindelsen rad för rad, med tider, spår och promenader mellan linjerna.',
  'help.guide.change-transit-route.step.3':
    'Ändra resväg längst ned i bokningen öppnar sökningen igen, redan ifylld med förbindelsens två ändar och dag.',
  'help.guide.change-transit-route.step.4':
    'Klicka på Sök, öppna en annan förbindelse och klicka på Lägg till i denna dag. Den ersätter den gamla. Redigera, längst till höger nere i bokningen, öppnar i stället det vanliga transportformuläret, där du kan ändra Bokningskod, resenärer, noteringar och filer.',
  'help.guide.change-transit-route.result':
    'Resan använder nu den nya resvägen, och dess kort i fliken Transporter visar de nya linjerna och tiderna.',
  'help.guide.change-transit-route.tip.1':
    'Klicka på titeln i bokningens rubrik för att byta namn på förbindelsen utan att ändra rutten. Du skriver noteringarna i transportformuläret som öppnas med Redigera.',
  'help.guide.change-transit-route.tip.2':
    'Papperskorgen längst ner i bokningen raderar förbindelsen efter en bekräftelse. Dagen behåller sina stopp.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Ändra hur en sträcka färdas',
  'help.guide.leg-travel-mode.goal':
    'Ställ in en sträcka under en körd dag på gång, eller planera sträckan med kollektivtrafiksökningen.',
  'help.guide.leg-travel-mode.step.1':
    'Förbindelserna mellan stoppen visas först när dagens rutt är på. Klicka på dagens rubrik för att öppna den och klicka sedan på Rutt i fältet under dess stopp.',
  'help.guide.leg-travel-mode.step.2':
    'Varje förbindelse visar restiden och avståndet för sträckan, med ikonen för det färdsätt som sträckan ruttades i: en bil för Bil, en fot för Till fots, en cykel för Cykel.',
  'help.guide.leg-travel-mode.step.3':
    'Klicka på förbindelsen. Menyn erbjuder Bil, Till fots och Cykel, Kollektivtrafik för just den här sträckan, och Använd dagens standard.',
  'help.guide.leg-travel-mode.step.4':
    'Välj Till fots. Bara den här sträckan ändras, resten av dagen behåller sitt eget färdsätt.',
  'help.guide.leg-travel-mode.result':
    'Sträckan visar fotikonen och sin gångtid, och dagens övriga sträckor behåller dagens färdsätt.',
  'help.guide.leg-travel-mode.tip.1':
    'Färdsättet hör till sträckan, inte till dagen: knapparna Bil, Till fots och Cykel för hela dagen skriver aldrig över en sträcka som du har ställt in för hand. Använd dagens standard låter sträckan följa de knapparna igen.',
  'help.guide.leg-travel-mode.tip.2':
    'Kollektivtrafik i samma meny öppnar förbindelsesökningen för just den här sträckan, med båda ändpunkterna och avgångstiden redan ifyllda.',
  'help.guide.leg-travel-mode.tip.3':
    'Tiderna kommer från en offentlig ruttberäknare över verkliga vägar och gångstigar. Om ruttberäknaren inte kan beräkna en sträcka behåller sträckan sin raka linje och visar ingen tid.',
  // edit-transport
  'help.guide.edit-transport.title': 'Ändra eller ta bort en transport',
  'help.guide.edit-transport.goal':
    'Rätta en tid, en plattform eller en bokningskod, eller ta bort transporten från resan.',
  'help.guide.edit-transport.step.1':
    'I dagsplanen visas en transport som en rad mellan stoppen, färgad efter typ. Klicka på den för att öppna bokningen: status, typ, dagarna och Bokningskod (med en knapp för att kopiera den) som piller högst upp, och avgångs- och ankomsttider med flygplatser eller stationer nedanför.',
  'help.guide.edit-transport.step.2':
    'Redigera längst ned i bokningen öppnar formuläret som skapade den, med Redigera transport ovanför titeln i rubriken. Där kan du ändra allt: titeln, etiketterna för status och typ, resvägen, dagarna och tiderna samt Bokningskod.',
  'help.guide.edit-transport.step.3':
    'Ett flyg är en kedja av flygplatser, ett tåg en kedja av stationer och en kryssning en kedja av hamnar. Lägg till stopp (Lägg till hamn på en kryssning) sätter in ytterligare ett emellan, och varje sträcka behåller sina egna tider och sitt eget flyg- eller tågnummer.',
  'help.guide.edit-transport.step.4':
    'Klicka på Uppdatera. Om du vill ta bort transporten helt använder du papperskorgen till vänster i samma fält, papperskorgen längst ner i bokningen eller papperskorgen på kortet i fliken Transporter, och bekräftar.',
  'help.guide.edit-transport.result':
    'Ändringen syns överallt där transporten förekommer: i fliken Transporter, på dagen den går och på dess linje på kartan.',
  'help.guide.edit-transport.tip.1':
    'Samma formulär öppnas från båda ställena: via Redigera i bokningen som öppnas från en rad i dagsplanen, och via pennan på kortet i fliken Transporter. En planerad kollektivtrafikförbindelse öppnas också som en bokning. Där öppnar Ändra resväg sökningen igen, och Redigera öppnar det här formuläret.',
  'help.guide.edit-transport.tip.2':
    'Om du vill flytta en transport till en annan dag behöver du inte formuläret: dra dess rad från ett dagskort till det andra.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Visa en transport på kartan',
  'help.guide.transport-on-map.goal': 'Se den faktiska rutten för en flygning, en bilresa eller en förbindelse.',
  'help.guide.transport-on-map.step.1':
    'En transport med båda ändarna angivna visar en liten ruttikon på sin rad i dagsplanen. Klicka på den. Dess verktygstips ändras till Dölj bokningsvägar.',
  'help.guide.transport-on-map.step.2':
    'Rutten ritas på kartan, med en avlång markör i varje ände som visar transportens ikon.',
  'help.guide.transport-on-map.step.3':
    'Klicka på en ändmarkör, så öppnas bokningen över kartan. Rubriken visar status, typ, dagar och Bokningskod. Under dem står tiderna med sina flygplatser eller stationer, flygbolaget och flygnumret. Klicka på Stäng i rubriken för att stänga den.',
  'help.guide.transport-on-map.step.4':
    'Ruttikonen i verktygsfältet ovanför dagarna gäller hela resan på en gång: Visa alla bokningsvägar, och Dölj alla bokningsvägar för att dölja dem igen.',
  'help.guide.transport-on-map.step.5':
    'En planerad kollektivtrafikförbindelse har ingen egen ruttikon. Den ritas med dagens Rutt-omkopplare, så Dölj alla bokningsvägar döljer den inte så länge dagens rutt fortfarande är på.',
  'help.guide.transport-on-map.result':
    'Rutterna visas på kartan med en markör i varje ände, och de ligger kvar tills du slår av dem.',
  'help.guide.transport-on-map.tip.1':
    'En flygning, en kryssning och en färja ritas som en kurva. En bil, en buss, en taxi och en cykel följer de riktiga vägarna. Ett tåg eller en planerad förbindelse går via de stationer där det stannar.',
  'help.guide.transport-on-map.tip.2':
    'En bekräftad bokning är en heldragen linje, en väntande en streckad. Inställningen Etiketter för bokningsrutter visar flygplatskoden eller stationens namn i ändmarkörerna.',
  'help.guide.transport-on-map.tip.3':
    'Visa alla bokningsvägar lägger inte till något till rutterna du redan visar. Den ersätter det du har ställt in med de enskilda ikonerna. När du har tryckt på den visas antingen alla rutter eller inga.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Importera flygningar från AirTrail',
  'help.guide.airtrail-import.goal':
    'Importera flygningarna som du redan har i AirTrail till resan på en gång, och håll dem uppdaterade från AirTrail därefter.',
  'help.guide.airtrail-import.step.1':
    'När tillägget AirTrail är på och din instans är ansluten under Integrationer i Inställningar visar fältet i fliken Transporter en flygplansikon, Importera från AirTrail, före Transport. Klicka på den.',
  'help.guide.airtrail-import.step.2':
    '”Importera från AirTrail” listar flygningarna på ditt konto i två grupper. ”Under denna resa” innehåller flygningar daterade inom resan, redan ibockade. ”Övriga flygningar” innehåller resten, obockade. En flygning som redan finns i resan är gråtonad och märkt ”Importerad”.',
  'help.guide.airtrail-import.step.3':
    'Varje rad är en kryssruta med flygbolag och flygnummer, de två flygplatserna och datumet. Klicka på en rad för att ta med flygningen eller lämna den utanför. Flygningar under ”Övriga flygningar” importeras bara om du bockar för dem.',
  'help.guide.airtrail-import.step.4':
    'Anslutande flyg grupperas ihop: varje flyg avgår från flygplatsen där det förra landade, inom ett dygn. Kryssrutan under, Importera som en flygning med mellanlandning i den flygplatsen, är redan på. Låt den vara på för en bokning med ett uppehåll, eller slå av den för att importera delsträckorna som separata flyg.',
  'help.guide.airtrail-import.step.5':
    'Klicka på knappen nere till höger, som visar antalet markerade flygningar, till exempel Importera 2. Meddelandet efteråt anger hur många flygningar som importerades.',
  'help.guide.airtrail-import.step.6':
    'Flygningarna visas som kort under Bekräftat, vart och ett med en blå AirTrail-bricka bredvid titeln, och som rader på de dagar de går. En anslutningsflygning är ett enda kort, och dess rutt går via mellanlandningen.',
  'help.guide.airtrail-import.result':
    'Flygningarna från AirTrail är kort i fliken Transporter och rader på sina dagar, var och en med AirTrail-brickan som visar varifrån den kommer.',
  'help.guide.airtrail-import.tip.1':
    'En flygning som redan finns i resan med samma nummer och datum hoppas över, och ett meddelande anger hur många som hoppades över. Ångrapilen i verktygsfältet ovanför dagarna ångrar hela importen.',
  'help.guide.airtrail-import.tip.2':
    'AirTrail är fortfarande den huvudsakliga datakällan. TREK läser ändringarna när du öppnar resan och med några minuters mellanrum i bakgrunden. En flygning som raderats i AirTrail behåller sitt kort i TREK, och etiketten ändras till ”Ej synkroniserad”. Ändringar som görs i TREK skickas tillbaka till AirTrail bara om ”Skriv tillbaka ändringarna till AirTrail” är påslaget under Integrationer.',
  'help.guide.airtrail-import.tip.3':
    'En sammanslagen förbindelse är inte en enda AirTrail-flygning som kan synkroniseras, så den är en engångsimport: den behåller den blå pillern, och när du håller muspekaren över pillern får du veta det. Detsamma gäller en synkroniserad flygning där du lägger till ett stopp för hand.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Bilresa',
  'help.ctx.trip-roadtrip.summary':
    'Planen visad som en enda körning: samma dagar och samma platser, sammankopplade som stopp med körningen mellan dem, i en lista i vänsterkolumnen och på kartan. Den visar avståndet och körtiden, var du behöver tanka och vad som finns längs vägen.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Dagar och Bilresa överst i vänsterkolumnen växlar mellan dagsplanen och körningen. Inget kopieras och inget ändras: Dagar visar planen precis som den var.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Överst i spalten visas totalerna för resan: Avstånd, Körtid och Stopp. Under finns ett kort för varje dag med en färd: dagens nummer och datum på en ruta, därefter etiketter för dess kilometer och körtid, hur många stopp den har, vad den än korsar, och ett märke Spår. Ett flyg, ett tåg eller en färja som du har bokat visas i ordningen som ett eget kort.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Ett numrerat stopp är en plats som dagen handlar om. Ett stopp på vägen, till exempel för bränsle, laddning eller rast, visar ikonen för sin typ i stället för ett nummer och räknas inte. Klicka på ett nummer för att ändra vilket slags stopp det är, klicka på märket Stopp för att ange hur länge du stannar, och dra ett stopp för att flytta det inom dagen eller till en annan dag.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Mellan två stopp visar ett körfält sträckans avstånd och tid. Klicka på det för ”Vägar för den här sträckan”, eller klicka på rutten på kartan för att leda sträckan via en mellanpunkt.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Högra kolumnen blir ”Längs rutten”: välj vad du letar efter och dagen på en rad, hur bred korridoren ska vara, och klicka sedan på Sök. Plustecknet på en träff, ”Lägg till”, lägger till den i färden vid den punkt där du faktiskt passerar den, och sängikonen på ett hotell lägger till en övernattning. Manuellt lägger till en plats som sökningen inte hittade, och de tre prickarna bredvid titeln importerar en rutt från Google Maps.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Körinställningar under den innehåller gränserna, bilen och dess räckvidd, de dagliga restiderna, vad som ska undvikas, hur linjen ritas och om aktuella varningar visas på kartan. De hör till resan, så alla planerar med samma bil.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Se resan som en enda körning',
  'help.guide.roadtrip-mode.goal': 'Växla planen till roadtrip-läge och förstå vad spalten visar.',
  'help.guide.roadtrip-mode.step.1':
    'Klicka på Bilresa i omkopplaren Dagar och Bilresa överst i vänsterkolumnen. Dagsplanen ersätts av körningen, och kartan visar varje dag som har en rutt.',
  'help.guide.roadtrip-mode.step.2':
    'Kortet överst i skenan summerar hela resan: Avstånd, Körtid och Stopp. Det ligger kvar på plats medan du rullar bland dagarna.',
  'help.guide.roadtrip-mode.step.3':
    'Under det finns ett kort för varje dag med en körning. Dagar utan körning utelämnas. Kortets rubrik visar dagens nummer med datumet under, sedan piller för körningens avstånd och tid och för antalet stopp den dagen.',
  'help.guide.roadtrip-mode.step.4':
    'Inne i kortet visas dagen som en följd: ett numrerat stopp för varje plats, en körsträcka mellan varje par och ankomsttiden vid högra kanten. Ett flyg, ett tåg eller en färja som du har bokat visas i följden som ett eget kort.',
  'help.guide.roadtrip-mode.step.5':
    'Klicka på en dags rubrik för att fälla ihop den. Pilen i dess ände vrids. En hopfälld dag döljs också på kartan. Klicka på rubriken igen för att visa den igen.',
  'help.guide.roadtrip-mode.result':
    'Vänsterkolumnen visar körningen och kartan visar varje dag av den. Dagar tar dig direkt tillbaka till planen, oförändrad.',
  'help.guide.roadtrip-mode.tip.1':
    'Valet sparas per resa på ditt konto, så efter en omladdning, i en annan webbläsare eller på en annan enhet öppnas resan i bilresevyn igen.',
  'help.guide.roadtrip-mode.tip.2':
    'Omkopplaren visas först när en administratör har slagit på tillägget Bilresa, under Tillägg i adminpanelen.',
  'help.guide.roadtrip-mode.tip.3':
    'På en telefon finns ingen växel: tillägget lägger i stället till en egen flik, ”Bilresa”, bredvid ”Planering”.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Stopp på vägen och hur länge du stannar',
  'help.guide.roadtrip-stops.goal':
    'Gör en plats längs färden till ett stopp på vägen och ange hur lång tid varje stopp tar.',
  'help.guide.roadtrip-stops.step.1':
    'Klicka på numret framför ett stopp i listan. Dess etikett är Gör det till ett stopp på vägen, och den visar stopptyperna som en rad färgade cirklar under sig.',
  'help.guide.roadtrip-stops.step.2':
    'Välj en typ. Håll muspekaren över en cirkel för att se dess namn: Boende, Bränsle, Laddning, Rastplats, Campingplats, Mat eller Sevärdheter. Numret ändras till den typens ikon, och stoppen under numreras om.',
  'help.guide.roadtrip-stops.step.3': 'Ett stopp på vägen är inget resmål, så dagens rubrik räknar ett stopp färre.',
  'help.guide.roadtrip-stops.step.4':
    'Klicka på ikonen igen, Byt typ av stopp, och välj Tillbaka till ett resmål för att ge stoppet sitt nummer tillbaka.',
  'help.guide.roadtrip-stops.step.5':
    'Varje stopp har ett märke Stopp, som visar ett plus så länge inget är planerat. Klicka på det för att öppna Tid på stoppet.',
  'help.guide.roadtrip-stops.step.6':
    'Ställ in längden med reglaget, med minus- och plusknapparna eller med en av de färdiga tiderna. ”Avfärd” ändras medan ”Ankomst” ligger kvar på tiden då bilresan kommer fram. Klicka sedan på ”Spara”.',
  'help.guide.roadtrip-stops.result':
    'Brickan ”Stopp” på stoppet du ändrade visar den nya längden, och alla ankomsttider efter det flyttas i takt med den. Ett stopp som du har ändrat till en annan typ och tillbaka är ett numrerat resmål igen.',
  'help.guide.roadtrip-stops.tip.1':
    'Ett uppehåll hör till platsen, inte till ett enskilt besök: en plats som är planerad på två dagar har samma uppehåll båda dagarna.',
  'help.guide.roadtrip-stops.tip.2':
    'Stopp på vägen visas också under Dagar. Om du stänger av Visa även i Dagar, under Servicestopp i Körinställningar, visas de bara i Bilresa.',
  'help.guide.roadtrip-stops.tip.3': 'Ingen vistelse, i samma dialogruta, tar bort tiden igen.',
  'help.guide.roadtrip-stops.tip.4':
    'Klicka på ett stopp på vägen eller en bokad natt för att öppna dess kort över kartan. När Bilresa är på öppnar Redigera där den kompakta dialogrutan som sökningen använder i stället för platsformuläret, och Fler detaljer i den dialogrutan öppnar hela formuläret.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Hitta bränsle, mat och en plats att sova på längs rutten',
  'help.guide.roadtrip-corridor.goal': 'Sök längs vägen du faktiskt kör och lägg till det du hittar på rätt sträcka.',
  'help.guide.roadtrip-corridor.step.1':
    'Under ”Söker efter” öppnar du listan och bockar för det du behöver. Du kan kombinera ”Bränsle”, ”Laddning”, ”Rastplats”, ”Campingplats”, ”Boende”, ”Mat” och ”Sevärdheter”: listan förblir öppen för ett andra val, och fältet visar sedan en ikon för varje typ.',
  'help.guide.roadtrip-corridor.step.2':
    'Välj dag i rullgardinsmenyn i slutet av samma rad. Den erbjuder de dagar som spalten har ett kort för, och Sök väntar tills rutten för den valda dagen är beräknad.',
  'help.guide.roadtrip-corridor.step.3':
    'Under Inom väljer du hur långt på varje sida om vägen du vill leta, 2 km, 5 km eller 10 km, och klickar sedan på Sök.',
  'help.guide.roadtrip-corridor.step.4':
    'Resultaten grupperas efter typ, i den ordning du passerar dem. Varje resultat visar hur långt från rutten det ligger och hur långt in i dagens körning det kommer.',
  'help.guide.roadtrip-corridor.step.5':
    'Klicka på Lägg till, plusset på en träff. Lägg till som stopp visar vilken dag och position platsen läggs till på, och frågar efter Typ av stopp och Tid på stoppet. En laddare visar också Tillgänglighet och priser. Lägg till lägger platsen på körningen, och Fler detaljer öppnar i stället hela platsformuläret.',
  'help.guide.roadtrip-corridor.result':
    'Stoppet du lade till visas på rutten där du passerar det, med sin typs ikon. Dagen ruttas om via stoppet, och det tömmer listan: sök igen efter nästa stopp.',
  'help.guide.roadtrip-corridor.tip.1':
    'Ingenting söks förrän du trycker på Sök: en sökning skickar många förfrågningar till en delad tjänst.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtrera på namn filtrerar resultaten utan en ny sökning, och Rensa träffar tömmer listan och tar bort dess nålar. Klicka på en träff för att visa den på kartan.',
  'help.guide.roadtrip-corridor.tip.3':
    'Du kan också dra ett resultat från kartan till rutten. Då väljer du själv sträckan när du kör samma väg två gånger. ”Manuellt”, bredvid ”Sök”, lägger till en plats som sökningen inte hittade, genom att slå upp den på namn.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Led en sträcka via en mellanpunkt',
  'help.guide.roadtrip-via.goal': 'Få en sträcka att följa den väg du vill, utan att lägga till ett stopp på den.',
  'help.guide.roadtrip-via.step.1':
    'Visa sträckan du vill ha på kartan: klicka på ett stopp i listan och stäng sedan kortet som öppnas över kartan.',
  'help.guide.roadtrip-via.step.2':
    'Klicka på den ritade rutten. En mellanpunkt läggs till på sträckan du klickade på, och sträckan ruttas om via den.',
  'help.guide.roadtrip-via.step.3':
    'Listan uppdateras: dagens rubrik visar det nya avståndet och den nya körtiden, och varje ankomst efter mellanpunkten ändras med den.',
  'help.guide.roadtrip-via.step.4':
    'Håll muspekaren över handtaget för att se vad det gör: dra för att forma om rutten, högerklicka för att ta bort. Dra det till ett annat ställe, så ritas sträckan om via den nya punkten.',
  'help.guide.roadtrip-via.step.5':
    'Högerklicka på handtaget för att ta bort det. Sträckan använder då den direkta rutten igen.',
  'help.guide.roadtrip-via.result':
    'Sträckan följer vägen du valde, och dagens avstånd, körtid och ankomsttider räknas ut på nytt.',
  'help.guide.roadtrip-via.tip.1':
    'En mellanpunkt är inte ett stopp: den har inget nummer, inget uppehåll och ingen ankomsttid, och den räknas inte med bland dagens stopp.',
  'help.guide.roadtrip-via.tip.2':
    'Handtagen visas först från zoomnivå 9, så en karta som visar hela resan visar linjen utan dem.',
  'help.guide.roadtrip-via.tip.3':
    'Ett klick som ligger mer än två kilometer från alla ritade sträckor ignoreras, och det gör även ett klick på ett flyg, ett tåg eller en färja.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Prova ett annat sätt att köra en sträcka',
  'help.guide.roadtrip-alternatives.goal':
    'Se de andra rutterna som ruttberäknaren erbjuder för en del av körningen, och välj en.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klicka på ett körfält i sidofältet, raden mellan två stopp som visar sträckans avstånd och tid. Dess etikett är ”Andra vägar”.',
  'help.guide.roadtrip-alternatives.step.2':
    '”Vägar för den här sträckan” öppnas över kartan, med en post per väg och dess längd. Kartan ritar varje väg med dess körtid: din nuvarande väg i full blå färg, de andra i en ljusare blå.',
  'help.guide.roadtrip-alternatives.step.3':
    'Håll pekaren över en post för att markera den vägen. Nuvarande är vägen du kör på och Snabbast är den snabbaste. De andra visar hur mycket långsammare de är, eller vilken vägklass de undviker.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klicka på ett alternativ för att använda den rutten, eller på Stäng för att behålla den nuvarande rutten.',
  'help.guide.roadtrip-alternatives.result':
    'Sträckan använder nu vägen du valde, och avståndet i sidokolumnen och ankomsttiderna efter den ändras också.',
  'help.guide.roadtrip-alternatives.tip.1':
    'När du väljer en annan väg kontrollerar TREK den först med bilresans ruttberäknare. Sedan håller den sträckan på den vägen med så få mellanpunkter som behövs och ersätter eventuella mellanpunkter som sträckan redan hade. En väg som ruttberäknaren inte kan följa sparas inte. Om du väljer ruttberäknarens egen väg tas mellanpunkterna bort igen.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Utan motorväg, Utan vägavgifter och Utan färja kommer från en andra motor med en egen hastighetsmodell, så deras tider går inte att jämföra med de andras.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Ställ in bilen och körgränserna',
  'help.guide.roadtrip-limits.goal': 'Berätta för TREK vilket fordon du kör och hur långt du vill köra utan paus.',
  'help.guide.roadtrip-limits.step.1':
    'Körinställningar finns under sökningen i högerkolumnen. Dess etiketter visar vad som är inställt. Klicka på den för att öppna.',
  'help.guide.roadtrip-limits.step.2':
    'Under Bil anges Längsta körning i sträck och Körning per dag i minuter. Ett tomt fält betyder av, och inget flaggas.',
  'help.guide.roadtrip-limits.step.3':
    'Under Fordon anger du vad du kör. Bensin tankar bara vid bränslestopp, El bara vid laddstopp och Båda vid båda.',
  'help.guide.roadtrip-limits.step.4':
    'Skriv själv in Räckvidd per tank eller Räckvidd per laddning. Eller öppna Räkna fram ur bilens data under Fyll till: den använder Tankvolym och Förbrukning, eller Batteri, Förbrukning och Batterislitage, och beräknar räckvidden.',
  'help.guide.roadtrip-limits.step.5':
    '”Undvik om det går”, i vänstra kolumnen, är en preferens och inget förbud: om en dag inte har någon annan väg används vägen ändå, och en notis visas i dagens huvud.',
  'help.guide.roadtrip-limits.step.6':
    'Klicka på Stäng. Märkena på kortet visar vad som är inställt, och skenan markerar varje sträcka och varje dag som överskrider en gräns.',
  'help.guide.roadtrip-limits.result':
    'Kortets brickor visar vad som är inställt, och varje sträcka och dag som överskrider en gräns har en bricka i listan.',
  'help.guide.roadtrip-limits.tip.1':
    'Inställningarna hör till resan, så alla på resan planerar med samma bil och samma gränser.',
  'help.guide.roadtrip-limits.tip.2':
    'Fyll till anger hur fullt ett stopp fyller tanken eller batteriet, eftersom ingen laddar till 100 % under färden. Ett bränsle- eller laddstopp kan åsidosätta det med batterimärket på sin rad.',
  'help.guide.roadtrip-limits.tip.3':
    'Under ”Ruttlinje” rutar ”Koppla ihop dagarna” också körningen från en dags sista stopp till nästa dags första stopp. ”Börja och avsluta varje dag vid ditt boende” startar och avslutar varje dag vid det boende som är bokat för de nätterna. ”En färg per dag” visar varje dag i sin egen färg.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Ge körningsdagen en början och ett slut',
  'help.guide.roadtrip-day-window.goal': 'Sluta köra vid en tid som du väljer och ange var dagen ska sluta.',
  'help.guide.roadtrip-day-window.step.1':
    'Öppna Körinställningar i högra kolumnen och leta upp Dagliga restider i dialogens vänstra kolumn.',
  'help.guide.roadtrip-day-window.step.2':
    'Ange en Dagens start. Ensam gör den ingenting: båda tiderna behövs, som noteringen under dem säger.',
  'help.guide.roadtrip-day-window.step.3':
    'Ange en Dagens slut. Körningen stannar nu vid den tiden och fortsätter nästa morgon, visat som en rad Dagens slut och en rad Fortsätt resan i sidokolumnen.',
  'help.guide.roadtrip-day-window.step.4':
    'Under Avsluta dagen väljer du Längs rutten för att pausa på vägen vid sluttiden, eller Vid sista platsen för att stanna innan nästa körning skulle passera den.',
  'help.guide.roadtrip-day-window.step.5':
    'Klicka på Stäng. Kortet Körinställningar visar de två tiderna som ett märke.',
  'help.guide.roadtrip-day-window.result':
    'Körningen delas upp i resdagar av den längd du har angett, och det som inte ryms fortsätter på beräknade dagar efter den sista. Dina dagar och deras platser ändras inte.',
  'help.guide.roadtrip-day-window.tip.1':
    'Om du tömmer någon av tiderna stängs funktionen av igen. Tider som du själv har satt på ett stopp har alltid företräde.',
  'help.guide.roadtrip-day-window.tip.2':
    'När dagliga restider är inställda är dagarna alltid sammankopplade: körningen från en dags sista stopp till nästa dags första stopp ruttas och räknas med.',
  'help.guide.roadtrip-day-window.tip.3':
    'Varje dagsslut är också en markör på kartan: en måne med dagens nummer. Dra den längs rutten, eller till en plats, för att avsluta dagen någon annanstans. Högerklicka på den för att återställa det automatiska slutet. Återställ automatiska dagsslut i den här dialogen ångrar alla de här ändringarna. Vill du avsluta en dag vid ett visst stopp klickar du på stoppet och slår på Avsluta dagen här på dess kort.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tanka innan tanken är tom',
  'help.guide.roadtrip-refuel.goal':
    'Hitta ett ställe att tanka på den del av rutten som bilen fortfarande kan nå, och lägg till det i körningen.',
  'help.guide.roadtrip-refuel.step.1':
    'När en räckvidd är angiven visar sidokolumnen ett band på sträckan där bränslet eller batteriet tar slut: Här tar tanken slut, eller Här tar batteriet slut för en elbil. Under det ser du hur långt in på sträckan det är.',
  'help.guide.roadtrip-refuel.step.2':
    'Lampikonen på bandet är knappen: Hitta bränsle, eller Hitta laddning för en elbil. Den söker längs vägen före den punkten och visar Söker längs rutten… medan den söker.',
  'help.guide.roadtrip-refuel.step.3':
    'Upp till tre stationer visas, var och en med avståndet från rutten och hur mycket räckvidd du skulle ha kvar.',
  'help.guide.roadtrip-refuel.step.4':
    'Plusset på ett förslag lägger till det som ett tankstopp. ”Lägg till som stopp” öppnas med typ och tid redan ifyllda, och ”Lägg till” placerar det på sträckan där rutten faktiskt passerar det.',
  'help.guide.roadtrip-refuel.result':
    'Stoppet visas på rätt sträcka med en egen ikon, och räckvidden räknas om från det stoppet. Fältet flyttas till den punkt där tanken nu är tom, eller försvinner om du kan nå slutet av körningen utan ytterligare ett stopp.',
  'help.guide.roadtrip-refuel.tip.1':
    'Räckvidden räknas från det senaste tank- eller laddstoppet, över dagsgränserna. Din fordonstyp avgör vilka stopp som räknas: Bensin bara tankning, El bara laddning.',
  'help.guide.roadtrip-refuel.tip.2':
    'Sökningen tittar på vägen före den punkt där bränslet tar slut, håller en reserv och räknar omvägen två gånger, så varje ställe den föreslår verkligen går att nå.',
  'help.guide.roadtrip-refuel.tip.3':
    'Om det inte finns några resultat kan du söka igen: lampan ändras till Försök igen, eftersom platssökningen är en delad tjänst som ibland överskrider tidsgränsen.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Låt en dag följa ett importerat spår',
  'help.guide.roadtrip-track.goal':
    'Använd en naturskön väg som du har importerat som ett GPX- eller KML-spår för en dags körning.',
  'help.guide.roadtrip-track.step.1': 'Klicka på brickan ”Spår” i en dags rubrik. Dialogen öppnas på den dagen.',
  'help.guide.roadtrip-track.step.2':
    'Välj ett spår. Varje spår visar sin längd och om det följer den här dagens rutt eller hur långt bort det ligger. Det närmaste spåret kommer först.',
  'help.guide.roadtrip-track.step.3':
    'Klicka på Följ det här spåret. TREK lägger till mellanpunkter där körningen avviker mest från spåret och beräknar rutten på nytt, och upprepar det flera gånger.',
  'help.guide.roadtrip-track.step.4':
    'Dialogen visar hur många via-punkter som placerades och hur nära spåret färden nu håller sig, eller att färden redan följde spåret. ”Släpp via-punkter”, längst ned till vänster, tar bort dem, och ruttplaneraren planerar dagen på nytt. Om du stänger dialogen behålls spåret.',
  'help.guide.roadtrip-track.result':
    'Dagens körning följer spåret i stället för den väg som ruttberäknaren hade valt. Håll muspekaren över dess Spår-bricka för att se spårets namn. När mellanpunkter håller körningen på spåret är brickan också markerad.',
  'help.guide.roadtrip-track.tip.1':
    'Dialogen listar resans platser som har en bana: en GPX eller KML som importerats med Importera fil i platskolumnen under Dagar, med Rutter eller Spår (med spårgeometri) markerade för en GPX, eller Stigar (LineStrings) för en KML. Importera fil erbjuds bara medan tillägget Turer är av. Med Turer på blir en GPX en tur, som den här dialogen inte listar. Tills resan har ett spår visar ingen dag märket.',
  'help.guide.roadtrip-track.tip.2':
    'Att följa ett spår ersätter de mellanpunkter som dagens sträckor redan hade, så forma en sträcka för hand efter spåret, inte före.',
  'help.guide.dateless-trip.step.1': 'Klicka på ”Ny resa” och ge resan ett namn.',
  'help.guide.edit-trip.tip.2':
    'Resekompisar som du lägger till eller tar bort här ändras direkt, utan att du behöver klicka på Uppdatera.',
  'help.guide.trip-reminder.result':
    'Du får påminnelsen det valda antalet dagar innan resan börjar, via de kanaler där du får meddelanden.',
  'help.guide.upcoming-reservations.step.1':
    'Leta upp ”Kommande bokningar” i högra kolumnen. Där listas de sex närmaste bokningarna i alla dina resor, de närmaste först, med datum, tid och typ.',
  'help.guide.half-company-holiday.step.1': 'Växla verktygsfältet till Företagshelg.',
  'help.guide.edit-holiday-calendar.result': 'Rutnätet och teckenförklaringen uppdateras direkt efter varje ändring.',
  'help.guide.person-color.result': 'Alla dagar som personen har registrerat visas nu i den nya färgen.',
  'help.guide.answer-fusion-request.step.1':
    'Öppna Vacay när någon har bjudit in dig. Dialogen ”Sammanslagning Begäran” öppnas automatiskt.',
  'help.guide.log-for-partner.step.1':
    'Klicka på personens namn i kortet Personer. En bock visar att personen är vald.',
  'help.guide.dissolve-fusion.step.1': 'Öppna Inställningar.',
  'help.guide.country-places.step.2': 'Klicka på märket Platser i kortet, det med kartnålen.',
  'help.guide.search-place.tip.2':
    'Om regionen redan är markerad frågar popupen i stället om du vill ta bort markeringen.',
  'help.guide.tour-activity-stats.step.4':
    'Märkena till höger visar vad summorna bygger på: ”Planerat till” för turer som räknas med i din reseplanering, Inspelat för turer med ett kopplat faktiskt spår. ”Ligger framför”, ”Utan dag” och ”Inget datum” räknar de turer som inte är medräknade än. Ikonen i förklarar regeln.',
  'help.guide.move-to-list.step.2':
    'Klicka på ”Duplicera till lista” om du vill behålla dem här också, eller på ”Flytta till lista” om du vill ta bort dem från den här listan.',
  'help.guide.accept-list-invite.title': 'Acceptera en inbjudan till en lista',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Under Vägpunkter väljer du rutan med vägpunkterna för att lägga till start, stopp och mål i rätt ordning, eller ”Bara linjen” för att bara lägga till den sparade linjen.',
  'help.guide.tour-collection-manage.step.1':
    'Öppna en lista. Varje sparad tur visar svårighetsgrad, typ, resan den sparades från, sträcka och stigning samt hur många vägpunkter den har. Håll pekaren över resans namn för att se vem som sparade den.',
  'help.guide.entry-draft.step.1': 'Slå på Utkast i högra kolumnen i redigeraren.',
  'help.guide.journey-map-layers.step.3':
    'Klicka på en ihålig nål eller en liten prick på kartan. Ett kort visar vad det är: en planerad plats och dess dag, eller en vistelse med ”Öppna inlägg”, som tar dig till dagsrapporten den hör till.',
  'help.guide.journey-keep-route.step.3': 'Klicka på ”Spara rutt”.',
  'help.guide.journey-day-stays.step.3':
    'Klicka på ”Ingen plats jag besökt” på en vistelse du inte vill ha. Vistelsen tas bort från listan.',
  'help.guide.journey-take-over-day.step.3':
    'Vill du ha ett enda inlägg för hela dagen växlar du Inlägg till Dagsrapport: ett inlägg listar alla valda vistelser med sina tider.',
  'help.guide.journey-auto-prepare.step.2':
    'Under ”Inspelade dagar” slår du på ”Förbered inspelade dagar automatiskt”.',
  'help.guide.photo-location.step.2': 'Under Foton slår du på ”Placera inlägg utifrån deras foton”.',
  'help.guide.link-trip.tip.3':
    'Om du skriver ett inlägg på en dag i en resa som inte är länkad än erbjuder redigeraren ”Länka resa” direkt i inlägget.',
  'help.ctx.settings-plugins.summary':
    'Dina egna inställningar för de plugin som administratören har installerat: nycklar och inställningar som varje plugin ber dig om, och en logg över vad pluginen har gjort åt dig. Fliken visas bara när ett plugin är aktivt.',
  'help.ctx.settings-about.bullet.3':
    'Via Ko-fi, Buy Me a Coffee och Discord kan du stötta TREK eller prata med dem som utvecklar det.',
  'help.guide.language-region.step.3':
    'Ställ in Visningsvaluta, eller behåll ”Resans valuta” för att se varje resa i dess egen valuta. Välj sedan Temperaturenhet, Avståndsenhet, Tidsformat och vilken dag veckan ska börja på under ”Vecka börjar på”.',
  'help.guide.travel-map-prefs.step.3':
    '”Utforska platser på kartan” visar kategoripillret för att hitta platser i närheten. ”Blurra bokningskoder” döljer bekräftelsenummer tills du håller pekaren över dem eller trycker på dem. ”Optimera rutten från boendet” börjar och avslutar dagen vid ditt hotell.',
  'help.guide.web-push-device.step.2':
    'I kortet Meddelanden högst upp styr kolumnen Push vilka händelser som skickas till dina enheter.',
  'help.guide.connect-airtrail.goal': 'Låt TREK importera och synka flygen från din egen AirTrail.',
  'help.guide.connect-dawarich.goal': 'Låt TREK läsa var du faktiskt har varit, från din egen Dawarich.',
  'help.guide.tour-connect-wanderer.goal':
    'Låt TREK läsa lederna i din egen wanderer, så att du kan importera dem som turer.',
  'help.guide.tour-wanderer-watch.title': 'Få besked när dina wanderer-leder ändras',
  'help.guide.plugin-settings.tip.2':
    'En plugin-kanal under Meddelanden har knappen Konfigurera, som öppnar den här sidan.',
  'help.guide.default-user-settings.result':
    'Nya konton, och alla som aldrig har ändrat de här inställningarna, får dina val.',
  'help.guide.own-routing-engine.goal':
    'Beräkna rutter för dagar och roadtrips med en OSRM- eller Valhalla-server som du driver själv, i stället för de publika.',
  'help.guide.admin-passkeys.tip.1':
    'Om TREK inte kan avgöra någon domän än visas en varning om det, och inloggningsnycklar förblir dolda tills du anger APP_URL eller Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'Längst ned på fliken Inställningar, under Farozon, klickar du på Rotera bredvid ”Rotera JWT-hemlighet”.',
  'help.guide.storage-backends.tip.3':
    'TREK kan ladda ned fotocacharna igen, så att spegla dem slösar oftast bara lagringsutrymme.',
  'help.guide.admin-channels.step.3':
    'I kortet Meddelanden nedanför väljer du för varje händelse vilka kanaler som skickar den: ”Ny version tillgänglig”, ”Fel i lagringsreplik” och ”Paddelregion efterfrågad”. Varje reglage sparas direkt.',
  'help.guide.notification-defaults.tip.1':
    'Av är ett standardval som varje användare fortfarande kan slå på; Blockerad stänger av det för alla.',
  'help.ctx.notifications.bullet.4':
    'Bredvid tiden för varje meddelande finns ”Markera som läst” (dubbelbocken) och Radera (papperskorgen), som gäller just det meddelandet. ”Markera alla som lästa” och ”Ta bort alla” högst upp gäller hela listan.',
  'help.guide.read-notifications.tip.2':
    'Ett meddelande utan knapp är bara information. Läs det i panelen och markera det som läst där.',
  'help.guide.filter-notifications.result': 'Listan visar bara det som fortfarande är oläst, nyast först.',
  'help.guide.delete-notifications.title': 'Radera meddelanden',
  'help.guide.notification-settings.goal':
    'Bestäm vilka händelser som visas under klockikonen och vilka som även skickas till dig via e-post, webhook, ntfy eller push.',
  'help.guide.public-link.step.4': 'Klicka på ”Skapa länk”, sedan på Kopiera, och skicka länken.',
  'help.guide.link-journal.step.2': 'Klicka på ”Koppla en dagbok” och välj en av dina dagböcker i ”Välj en dagbok”.',
  'help.guide.dawarich-stays.title': 'Gör en inspelad vistelse till en plats',
  'help.guide.dawarich-stays.tip.2':
    'Om du raderar en plats som kom från en vistelse hamnar vistelsen i listan igen som väntande.',
  'help.guide.leave-stop-off-route.goal':
    'Behåll ett stopp på dagen utan att rutten går dit, för en plats du passerar till fots eller bara vill ha på kartan.',
  'help.guide.day-route.tip.4':
    'För ett stopp som du vill ha på dagen men inte på rutten väljer du ”Uteslut från rutten” i dess meny.',
  'help.guide.move-booking-day.step.2':
    'Dra raden till huvudet på ett annat dagkort. En endagsbokning flyttas i sin helhet till den dagen. För en bokning som sträcker sig över flera dagar flyttar raden Avgång startdagen och raden Ankomst slutdagen.',
  'help.guide.place-image-from-file.title': 'Använd ett bifogat foto som platsens bild',
  'help.guide.place-image-from-file.tip.2':
    'Ett foto som är fäst på stoppet eller bifogat till dess bokning föreslås också.',
  'help.guide.place-own-hours.step.5':
    'Klicka på Uppdatera. Kortet visar nu dina tider under Öppettider, och Öppen eller Stängd högst upp utgår från dem.',
  'help.guide.confirm-stay-booking.step.3':
    'Klicka på Väntande högst upp. Verktygstipset visar ”Sätt till Bekräftat”, och pricken blir grön.',
  'help.guide.map-nearby-places.tip.4':
    'En kategori vars sökning misslyckades får en röd prick, och ”Sök i detta område” blir rött med en varningssymbol: klicka på det för att försöka igen.',
  'help.guide.tour-map-lines.tip.1': 'När du fäller ihop en dag i dagkolumnen döljs dess turer och stopp på kartan.',
  'help.guide.car-stops.step.3':
    'Skriv en titel i huvudet. Under Rutt väljer du var du hämtar bilen i Från och var du lämnar tillbaka den i Till; resans egna platser föreslås innan du börjar skriva. Upphämtning och Upphämtningstid anger när du hämtar bilen, Återlämning och Återlämningstid när du lämnar tillbaka den.',
  'help.guide.transport-details.step.1':
    'Klicka på ett kort på fliken Transporter. Detaljerna öppnas ovanpå fliken, med huvudet i samma färg som kortet. En transports rad i dagsplanen öppnar samma detaljer.',
  'help.guide.export-transports-csv.tip.2':
    'Fliken Bokningar har samma ikon och skapar en egen fil, vars namn slutar på bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'Under ”Gruppera efter” väljer du Status, Dag, Typ eller ”Ingen gruppering”. Fliken sorteras direkt i de avsnitten.',
  'help.guide.export-bookings-csv.result':
    'Webbläsaren laddar ned en fil som är uppkallad efter resan och fliken, till exempel hosten-i-japan-bookings.csv, med en rad för varje bokning som fliken visade.',
  'help.guide.arrange-packing-list.result':
    'Listorna ligger i den ordning du drog dem, och föremålen sorteras A till Ö tills du slår av det. TREK sparar ändå din egen ordning.',
  'help.guide.count-packed-pieces.step.2':
    'En räknare visas före antalet: 0/5, med ett minus och ett plus. Klicka på plus för varje del som åker ned i väskan.',
  'help.guide.expense-receipts.step.4':
    'Tillbaka i liggaren har raden ett Kvitto-chip bredvid namnet, med antalet inom parentes om det finns flera. Klicka på det för att öppna kvittot.',
  'help.guide.final-budget.tip.3':
    'Den som har lämnat resan har kvar en rad i Balanser och ”Slutlig budget” så länge personen har pengar att få eller är skyldig pengar.',
  'help.guide.files-sync-settings.step.2':
    'Flödesfältet visar TREK och ditt arkiv med de dokument som finns i vart och ett, och två banor mellan dem: ”Ut till arkivet” och ”In från arkivet”. Klicka på ”Ut till arkivet” för att stänga av den banan. Den blir gråad och raden under banorna lyder ”Bara inkommande”. Klicka igen för att slå på den igen.',
  'help.guide.files-sync-settings.tip.4':
    'Bara resans ägare eller en administratör kan ändra något av det här. Andra medlemmar ser flödesfältet med en rad som ”Dokument rör sig åt båda hållen”, men inga Inställningar.',
  'help.guide.manage-notes.step.2':
    'Expandera öppnar hela anteckningen: hela texten, dess Hemsida och dess Filer. Klicka på en fil för att förhandsgranska den. Redigera längst ned växlar direkt till redigeraren; krysset uppe till höger stänger anteckningen igen.',
  'help.guide.note-categories.goal':
    'Ge gruppens anteckningar namngivna, färgade kategorier och visa en kategori i taget.',
  'help.guide.note-categories.tip.1':
    'Papperskorgen tar bara bort en kategori som ingen anteckning använder. En kategori som fortfarande används av anteckningar ligger kvar i listan tills du flyttar de anteckningarna till en annan kategori.',
  'help.guide.roadtrip-reorder.title': 'Ändra ordning på ett stopp eller flytta det till en annan dag',
  'help.guide.roadtrip-reorder.tip.3':
    'TREK frågar inte om en tid som du har fäst: skenan räknar om dagen direkt och markerar alla stopp som inte längre går att nå i tid.',
  'help.guide.roadtrip-overnight.step.3':
    'Högst upp i dialogen lägger Övernattning till en övernattning, och Paus gör det till ett stopp en stund. Ett hotell öppnas med Övernattning, en campingplats med Paus. En natt kräver bara Incheckning, som du kan lämna tom.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Klicka på batterimärket på ett tank- eller laddstopp i skenan. Det visar nivån som stoppet fyller till: blekt så länge det använder ditt värde för ”Fyll till”, fyllt när det har ett eget värde.',
  'help.guide.roadtrip-bookings.step.1':
    'Boka sträckan som en bokning av typen Flyg, Tåg, Färja, Kryssning eller Buss på rätt dag, med båda ändpunkterna angivna. Färden tar automatiskt med den: vägen slutar vid terminalen där sträckan avgår och fortsätter där den kommer fram.',
  'help.guide.roadtrip-google-import.result':
    'Ruttens stopp läggs till efter dagens sista stopp, och rutten i skenan och på kartan går via dem.',
  'help.guide.roadtrip-hazards.step.3':
    'Varningarna ritas på kartan som områden. Klicka på ett område för att se vad varningen gäller, vilken tjänst som rapporterade den och när den senast uppdaterades.',
  'help.ctx.trip-tours.bullet.2':
    'Högst upp hämtar ”Importera GPX eller KML” in filer som turer. Filterknappen under (först Alla, med antalet turer) filtrerar listan efter status, källa, ruttgräns och typ.',
  'help.guide.tour-show-list.step.2':
    'Varje rad är en tur. Den färgade stapeln är turens linje på kartan, och den runda rutan visar ruttgränsen (T1 till T6) för en vandring som planerats i TREK, eller ikonen för turtypen. Märkena under namnet visar vilka dagar turen ligger på, tid, sträcka och stigning. På en flerdagarstur visar månen med en siffra hur många etapper den har.',
  'help.guide.tour-add-to-day.title': 'Lägg en tur på en dag',
  'help.guide.tour-add-to-day.tip.2':
    'Om resan slutar före sista etappen visar alternativet den sista etapp som får plats, och etapperna efter den blir utan dag.',
  'help.guide.tour-day-times.step.3':
    'Klicka på Uppdatera. Raden visar nu start → slut. En beräknad sluttid visas ljusare, med ≈ för en uppskattning, ≥ så länge en vistelse saknar tid och +1 efter midnatt. Håll pekaren över den för att se hur den beräknades.',
  'help.guide.tour-remove-from-day.goal': 'Ta bort en tur från planeringen utan att radera den.',
  'help.guide.tour-filter-list.goal':
    'Begränsa en lång lista till de turer du vill se: inte planerade än, från en fil, av en viss typ.',
  'help.guide.tour-filter-list.result': 'Bara de turer du filtrerade fram visas i listan; de andra finns kvar i resan.',
  'help.guide.tour-hide-on-map.result':
    'Bara de turer du vill ha visas på kartan, och de dolda ligger kvar i listan, nedtonade.',
  'help.guide.tour-import-plan-tab.result':
    'Spåret är en tur i resan: en rad i listan med ett GPX-märke och en linje på kartan.',
  'help.guide.tour-detail-read.title': 'Öppna en tur och läs dess kort',
  'help.guide.tour-detail-read.step.7': 'Stäng kortet med X högst upp, eller tryck på Escape.',
  'help.guide.tour-rename-colour.goal':
    'Ge en tur ett namn du känner igen och en linjefärg som syns tydligt på kartan.',
  'help.guide.tour-take-along.title': 'Ladda ned en tur till telefonen eller GPS:en',
  'help.guide.tour-take-along.tip.4':
    'På fliken Turer finns samma nedladdning högst upp i vänstra kolumnen. Om turen har osparade ändringar ber nedladdningen dig att spara först.',
  'help.guide.tour-copy-keep.tip.1':
    'Båda är kopior: senare ändringar i turen påverkar varken kopian eller versionen du sparade i samlingen.',
  'help.guide.tour-packing-link.step.2':
    'Under ”Koppla till” väljer du ”Hela packlistan” eller en av dess listor. Varje rad visar hur många föremål den innehåller.',
  'help.guide.tour-files.title': 'Bifoga filer till en tur',
  'help.guide.tour-activity-link.title': 'Länka spåret du faktiskt följde',
  'help.guide.tour-activity-link.tip.2':
    'Du kan bara länka ett importerat spår som inte har använts för att planera en tur, och varje spår kan bara länkas till en tur.',
  'help.guide.tour-activity-compare.step.4':
    'Byt under spåret väljer en annan inspelning. ”Koppla ifrån” tar bort den från turen, och spåret ligger kvar i resan som en import.',
  'help.guide.tour-origin-check.step.3':
    'En tur som du har ritat på fliken Turer visar ”planerad i TREK”, med datumet under Skapad.',
  'help.ctx.trip-tour-planner.bullet.2':
    'Vänstra skenan är redigeraren. När inget är öppet erbjuder den ”Planera ny tur”. En öppen tur visar namn, typ, vägpunkter, korten för turtypen och detaljerna, med Ångra och Spara längst ned.',
  'help.guide.tour-open-workspace.step.2':
    'Vänstra skenan är redigeraren. När ingen tur är öppen erbjuder den ”Planera ny tur”, som startar en tur på kartan.',
  'help.guide.tour-open-workspace.tip.3':
    'Om du öppnar en annan tur medan redigeraren har osparade ändringar får du först en fråga: ”Kasta ändringar” eller fortsätta redigera.',
  'help.guide.tour-draw-route.step.5':
    'Klicka på nästa ställen i den ordning du går dem. Varje klick lägger till punkten som nytt slut, och från och med två punkter planerar TREK rutten längs stigarna.',
  'help.guide.tour-type-profile.goal': 'Välj turtyp, och för en cykeltur även profil, så att rutten följer rätt vägar.',
  'help.guide.tour-edit-points.title': 'Flytta, ändra ordning på och ta bort punkter',
  'help.guide.tour-edit-points.tip.1':
    'Den första punkten har märket Start och den sista märket Slutar. Flyttar du en punkt högst upp eller längst ned blir den start eller slut.',
  'help.guide.tour-shaping-points.step.4':
    'Om du vill göra ett stopp till en formpunkt eller tvärtom öppnar du ”Fler åtgärder” på dess rad och väljer ”Gör till formpunkt” eller ”Gör till stopp”.',
  'help.guide.tour-loop-reverse.step.2':
    'Sista raden visar nu ”Tillbaka till start”, och rutten på kartan slutar där den började.',
  'help.guide.tour-leg-by-hand.step.1':
    'Öppna ”Fler åtgärder” på punkten där sträckan börjar och välj ”Rita nästa sträcka för hand”.',
  'help.guide.tour-trip-places.goal': 'Lägg till en plats som du redan har planerat i resan som ett stopp på turen.',
  'help.guide.tour-trip-places.result': 'Turen har ett nytt stopp för resans plats, med samma namn.',
  'help.guide.tour-details-times.tip.2':
    'På en vandring innehåller Detaljer även ”Högsta svårighetsgrad för leden” och Ruttval, som förklaras i vandringsguiderna. En stadspromenad har inga Pauser: i stället används tiden du stannar vid stoppen.',
  'help.guide.tour-save.step.4': 'Turen listas nu under ”Turer för den här resan”, ännu inte på någon dag.',
  'help.guide.tour-edit-saved.step.2':
    'Ändra det du behöver, precis som för en ny tur: flytta eller lägg till punkter, byt typ eller redigera detaljerna, som här Beskrivning.',
  'help.guide.tour-summary-profile.goal': 'Se hur lång och hur brant turen är, och var på rutten varje höjd ligger.',
  'help.guide.tour-summary-profile.result':
    'Du vet hur lång turen är, hur mycket den stiger, hur lång tid den tar och var den blir brant.',
  'help.guide.tour-list-manage.tip.1':
    'Varje tur räknas bara en gång i summorna, även om den ligger på flera dagar. En summa med ≥ framför omfattar inte alla turer. Håll pekaren över den för att se hur många som saknas.',
  'help.guide.tour-delete.tip.1': 'Det här går inte att ångra, och Ångra tar inte tillbaka en tur.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Om du ändå klickar på Spara öppnas ”Ändrad under tiden” i stället, och inget skrivs över.',
  'help.ctx.trip-tour-import.bullet.2':
    '”Förhandsvisning av importen” visar varje spår i filerna på en karta, med sträcka, stigning, nedstigning och punkter, innan något sparas. Under ”Importera som” anger du vad spåren är.',
  'help.guide.tour-import-gpx.step.3':
    '”Förhandsvisning av importen” öppnas, och inget är sparat än. Kartan visar hela sträckningen, och varje spår i filerna är en numrerad rad med sträcka, stigning, nedstigning och punkter. Ett inspelat spår visar också när det spelades in och hur lång tid det tog.',
  'help.guide.tour-import-gpx.result':
    'Turen finns under ”Turer för den här resan”, ännu inte på någon dag. Importerar du en enda tur öppnas den direkt på kartan som en GPX-tur.',
  'help.guide.tour-view-import.tip.3': 'En led från wanderer öppnas på samma sätt, som en wanderer-tur.',
  'help.guide.tour-plan-from-import.tip.1': 'Ångra tar bort förslaget. Inget sparas förrän du sparar.',
  'help.guide.tour-restore-recorded.step.2': 'Klicka på ”Återställ inspelat spår”.',
  'help.guide.tour-take-over.step.2': 'Välj ”Hämta en tur från en annan resa”.',
  'help.guide.tour-take-over.result':
    'Ett meddelande bekräftar att turen har hämtats, och den öppnas i redigeraren, redo att läggas på en dag.',
  'help.guide.tour-import-wanderer.tip.2':
    'Importen är en kopia: senare ändringar i wanderer påverkar inte turen. Med ”Kontrollera källan” under turens Ursprung ser du när leden har ändrats.',
  'help.ctx.trip-tour-map.bullet.3':
    '”Sök plats eller adress” högst upp på kartan flyttar kartan till en ort, en stuga eller en topp utan att lägga till något i turen.',
  'help.guide.tour-map-layers.result':
    'Turen visas på den karta som passar den, och pillret visar vilken som är aktiv.',
  'help.guide.tour-along-search.step.3':
    'Under ”Inom det här avståndet från rutten” väljer du hur långt från linjen du vill leta: 250 m, 500 m, 1 km eller 2 km.',
  'help.guide.tour-along-add-stop.goal':
    'Dra turen förbi en utsiktsplats, en stuga eller en källa som du har hittat längs vägen.',
  'help.guide.tour-along-add-stop.tip.3':
    'En sträcka där du inte kan lägga till något stopp (en via ferrata eller en bärsträcka som lagts till som fast linje, eller en sträcka ritad för hand) visas nedtonad i listan, med skälet bredvid.',
  'help.guide.tour-3d-terrain.result':
    'Du har sett turen i 3D-terrängen med de branta partierna färgade, och den platta kartan är tillbaka för planeringen.',
  'help.guide.tour-3d-flyover.step.3':
    'Paus stoppar flygningen där den är, och ”Spela upp överflygning” fortsätter därifrån. ”Börja om” går tillbaka till början och startar flygningen igen.',
  'help.guide.tour-map-overlays.step.1':
    'Öppna en skidtur på fliken Turer. Pisterna visas från början: reglaget är det snöklädda berget i pillret längst ned till vänster, ”Pister, längdspår och liftar”. Klicka på det för att dölja dem på kartan, och klicka igen för att visa dem.',
  'help.ctx.trip-tour-stages.title': 'Flerdagarsturer',
  'help.guide.tour-multi-day.goal': 'Dela upp en rutt i etapper, en för varje dag du är på väg.',
  'help.guide.tour-multi-day.tip.2':
    'Om du vill slå ihop två etapper igen väljer du ”Ta bort etappslut” i menyn för stoppet med månen. De slås också ihop om du tar bort det stoppet, och ett meddelande erbjuder Ångra.',
  'help.guide.tour-stages-on-days.step.3':
    'Välj ”Etapper från den här dagen”: etapp 1 hamnar på den dagen och varje följande etapp på dagen efter. ”Hela turen den här dagen” lägger i stället hela rutten på just den dagen.',
  'help.guide.tour-stages-on-days.result':
    'Varje etapp ligger på sin dag i resan, och etappen du öppnade visas i redigeraren.',
  'help.ctx.trip-tour-hike.bullet.6':
    'Turöversikt till höger visar sträcka, stigning, beräknad gång- eller löptid, pauser och planerad total tid, med höjdprofilen under. Spara längst ned i redigeraren sparar turen.',
  'help.guide.tour-hike-plan.step.6': 'Klicka på Spara längst ned i vänstra kolumnen.',
  'help.guide.tour-hike-trail-details.step.1':
    'Öppna vandringen från ”Turer för den här resan” och leta upp Leddetaljer under kortet Vägpunkter. Slå på ”Visa längs rutten”.',
  'help.guide.tour-hike-trail-details.tip.3':
    'Inget i kortet ändrar turen, och kortet kräver en anslutning. En importerad vandring visar samma kort i sin vy, utan ruttgräns.',
  'help.guide.tour-hike-round.result':
    'Vandringen följer den runda du valde, tillbaka till starten. ”Runda vald” längst ned på kartan har Ångra, och Spara behåller rundan.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Märkena på en rad visar hur mycket längre, högre eller långsammare den är än den nuvarande vägen. Klicka på den du vill ha.',
  'help.guide.tour-ferrata-add.step.1':
    'Med en vandring öppen klickar du på ”Via ferrata-leder” i raden med kartknappar längst ned till vänster. Märket visar hur många via ferrata-leder som finns i vyn; zooma in om du uppmanas att göra det.',
  'help.guide.tour-ferrata-add.tip.3':
    'Sträckan på via ferratan är markerad i höjdprofilen, så att du ser när under dagen du når den.',
  'help.guide.tour-run-plan.step.5': 'Ge löpturen ett namn under ”Turens namn” och klicka på Spara.',
  'help.guide.tour-run-ways.step.1':
    'Öppna löpturen från ”Turer för den här resan” och slå på ”Visa längs rutten” i Leddetaljer, under kortet Vägpunkter.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Turtypen ”Stadspromenad / sightseeing” gör en tur till en promenad. Dess punkter är stopp med en Etikett, en vistelsetid och en prioritet. En promenad har ingen vandringsgräns och inget fält för Pauser: vistelsetiderna används i stället.',
  'help.guide.tour-walk-plan.step.2':
    'Lägg till stoppen: kontrollera att ”Lägg till punkt” är på och klicka på kartan vid varje stopp, eller klicka på ”Resans platser” för att ta en plats som resan redan har.',
  'help.guide.tour-walk-plan.result':
    'Promenaden listar sina stopp med vistelsetider, och Turöversikt summerar dem. Lägg promenaden på en dag för att se när du når varje stopp.',
  'help.guide.tour-walk-sights.tip.1': 'Den blir ett stopp på promenaden, inte en plats i resan.',
  'help.guide.tour-walk-day-times.step.3':
    'Öppna promenaden på fliken Turer igen. Högst upp i Vägpunkter visar ”Tider för” dagen och dess starttid. Om promenaden är planerad på flera dagar klickar du där för att välja en annan dag.',
  'help.guide.tour-walk-google-import.goal':
    'Klistra in en gångrutt som har delats från Google Maps och läs in dess stopp som en promenad.',
  'help.guide.tour-walk-google-import.result':
    'En ny stadspromenad öppnas i redigeraren med stoppen från Google Maps, redo att sparas.',
  'help.guide.tour-walk-check-off.tip.2': 'Promenadens rad i dagsplanen visar också antalet, till exempel 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'På MTB-profilen visar samma kort ledernas svårighetsgrader (mtb:scale) där kartläggare har lagt in dem. En väg utan grad är okänd, inte lätt.',
  'help.guide.tour-bike-profile.step.6':
    'Skriv ett namn under ”Turens namn” och klicka sedan på Spara längst ned i vänstra skenan.',
  'help.guide.tour-bike-surfaces.goal':
    'Ta reda på hur stor del av rutten som är asfalt, grus eller okänt underlag, och vilka typer av vägar den går på.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Kortet utgår från rutten så som ruttplaneraren planerade den och ändrar ingenting i turen. Det kräver en anslutning; offline visas ett meddelande om det, och rutten påverkas inte.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '”Ingen grad i datan” betyder okänd, inte lätt. En grad säger inget om huruvida en led passar dig.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Varje punkt du klickar på kartan förbinds med den föregående via pister, liftar och spår. Under varje punkt listas sträckan som chips, pister i färgen för sin svårighetsgrad, med antal minuter. En sträcka som inte kan planeras blir röd, visar varför och erbjuder en lösning eller ”Rita rakt”.',
  'help.guide.tour-ski-plan.step.4':
    'Kontrollera att ”Lägg till punkt” är på och klicka sedan på kartan där du startar och vid varje ställe du vill nå, i tur och ordning. Pistruttplaneraren förbinder varje punkt med den föregående via pister, liftar och spår.',
  'help.guide.tour-ski-options.title': 'Berätta för pistruttplaneraren hur du åker',
  'help.guide.tour-ski-options.tip.2':
    '”Åk liftar” är på som standard för Utförsåkning och Snowboard och av för de andra disciplinerna. Uteslut och ”Åk lift ner vid behov” visas bara när liftar används.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Du kan också dra punkten på kartan närmare en pist, ett spår eller en lift. Sträckan planeras om när du släpper.',
  'help.guide.tour-ski-summary.step.2':
    'Åkning, ”I liftar”, Väntan och ”Till fots” visar tiden för var och en. Pister, ”Nedfärd i pister” och Liftturer visar pisternas längd, höjdmetrarna du åker ned i dem och hur många liftar du tar.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Se pisterna, längdspåren och liftarna runt din skidtur och vad deras färger betyder.',
  'help.guide.tour-ski-import.title': 'Importera ett skidspår och ange vad det var',
  'help.guide.tour-ski-import.tip.1':
    'Ett importerat spår behålls som det spelades in: TREK matchar det inte mot pisterna, och dess kort visar Skidtid som ”Inte uträknad”.',
  'help.ctx.trip-tour-paddle.bullet.3':
    '”Fler åtgärder” på en punkt innehåller paddelverktygen: planera nästa sträcka på vattnet eller rita den för hand, ”Bär båten härifrån” och ”Sluss vid den här punkten”.',
  'help.guide.tour-paddle-setup.step.3':
    'Under Båt väljer du Kajak, Kanadensare, SUP eller Andra. Båttypen avgör vilken fart TREK föreslår.',
  'help.guide.tour-paddle-setup.tip.4':
    '”Paddling har risker”, raden längst ned i kolumnen, öppnar ”Säkerhet på vattnet”. Läs den en gång före din första tur.',
  'help.guide.tour-paddle-water-route.step.5':
    'Vill du planera alla handritade sträckor på en gång klickar du på ”Planera handritade etapper på vattnet”, vågorna i huvudet för Vägpunkter.',
  'help.guide.tour-paddle-portage.step.1':
    'Peka på stoppet där du går i land och klicka på ”Fler åtgärder”, de tre prickarna.',
  'help.guide.tour-paddle-portage.result':
    'Sträckan är en bärsträcka på kartan och bland vägpunkterna, och Tidsuppskattning räknar den som bärning.',
  'help.guide.tour-paddle-lock.tip.2':
    'Om en bärsträcka går runt slussen tonas slussen ned och märks ”Bärs runt, lyftet räknas”. Bärtiden räknas i stället, och slussens minuter ingår inte.',
  'help.guide.tour-paddle-time.step.4':
    'Om turen har en bärsträcka räknar raden Bärning tiden för den. Klicka på farten och ange hur fort du bär båten. ”Ur och i igen” lägger till minuterna vid varje bärsträcka.',
  'help.guide.tour-paddle-wind.step.1':
    'Lägg paddelturen på en dag i resan. Kortet Vind i vänstra kolumnen visar då prognosen för den dagen vid turens start.',
  'help.guide.tour-paddle-wind.result': 'Du vet hur det blåser den dagen där du sätter i båten, timme för timme.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Välj för varje hinder vad du tänker göra: ”Paddla igenom”, ”Bär runt”, ”Paddla runt” eller ”Berörs inte”. Nästa tar dig till nästa öppna post.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Klicka på ”Lägg till tur” i högra kolumnen på fliken Turer, välj ”Importera GPX eller KML” och välj filen.',
  'help.guide.tour-paddle-track-marks.tip.2':
    'Ångra tar bort de markeringar du inte har sparat. Själva det inspelade spåret ritas aldrig om.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK beräknar ingen ridtid. Ange en tid under Planerat i Detaljer om du vill ha en på dagen.',
  'help.guide.tour-horse-plan.step.5':
    'Välj en sektion under Sektioner. Kontrollera i vilken Riktning du rider den och vad ”Tillträde för häst” anger längs den.',
  'help.guide.tour-horse-plan.tip.5':
    'Ingenting på en ridtur ruttplaneras: ett klick på den ritade linjen lägger inte till någon formpunkt, och punkterna i ändarna av en sektion ligger kvar där rutten har dem.',
  'help.guide.tour-horse-gap.tip.1':
    'Ingen ruttplanerare och ingen hästrutt har kontrollerat en manuell sektion. Titta på kartan för att se var den faktiskt går.',
  'help.guide.tour-horse-recorded.step.4':
    'Ridturen öppnas i vänstra kolumnen. Kortet ”Inspelad ridtur” visar ”Som inspelad”, ”Ingen ridtid” och ”Tillträde okontrollerat”. Peka på ett märke för att läsa varför.',
  'help.guide.dateless-trip.step.2':
    'Lämna Startdatum och Slutdatum tomma. Under dem visas fältet Antal dagar: ange hur många dagar du vill planera.',
  'help.guide.trip-reminder.tip.1':
    'Bara resans ägare (eller en administratör) ser blocket Påminnelse. Är det gråat måste en administratör först slå på reseråminnelser under Admin, Meddelanden.',
  'help.guide.upcoming-reservations.step.2': 'Klicka på en bokning för att öppna resan den hör till.',
  'help.guide.timezones-widget.tip.1':
    'Listan använder de officiella tidszonsnamnen, till exempel Europe/Lisbon eller America/New_York, så sök på staden som ingår i namnet.',
  'help.guide.half-company-holiday.step.2': 'Slå på Halvdag i samma verktygsfält.',
  'help.guide.edit-holiday-calendar.tip.1': 'Varje ändring sparas direkt. Det finns ingen Spara-knapp.',
  'help.guide.person-color.tip.1': 'Samma färg markerar personen i verktygsfältet och i kortet Rättighet.',
  'help.guide.answer-fusion-request.step.2':
    'Läs vad en sammanslagning innebär: en gemensam kalender, poster ni kan redigera åt varandra och gemensamma helginställningar.',
  'help.guide.log-for-partner.step.2': 'Titta på verktygsfältet: den första knappen visar nu personens namn och färg.',
  'help.guide.dissolve-fusion.step.2': 'Klicka på Upplös under Upplös Sammanslagning längst ned.',
  'help.guide.country-places.step.3':
    'Dialogen listar alla platser som räknas för landet, grupperade efter resa. Har du fler än sex platser kan du begränsa listan med Sök platser högst upp. Klicka på en plats eller en reserubrik för att öppna den resan i planeraren.',
  'help.guide.tour-activity-stats.step.5':
    'Klicka på Visa turer. Mina genomförda turer öppnas med summorna, uppdelningen Per typ och varje tur under perioden med dag, resa, sträcka och höjdmeter uppför. Pillren i rubrikraden ändrar period och typ även här.',
  'help.guide.move-to-list.step.3':
    'Välj listan de ska flyttas till. Har du fler än tre listor kan du begränsa dem med sökrutan högst upp.',
  'help.guide.accept-list-invite.goal': 'Gå med i en lista som någon har delat med dig, eller tacka nej till inbjudan.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Ändra Namn i resan om du vill och klicka sedan på Lägg till i en resa.',
  'help.guide.tour-collection-manage.step.2':
    'Skriv i Sök platser. Då begränsas turerna på namn, tillsammans med platserna.',
  'help.guide.create-journey.tip.3':
    'När en resa nyss har tagit slut startar Skapa Journey i bannern Resan har just avslutats högst upp en Journey med den resan redan vald.',
  'help.guide.entry-draft.step.2': 'Klicka på Spara. Kortet visar nu märket Utkast.',
  'help.guide.gallery-map.step.3':
    'Tillbaka på Tidslinje följer kartan till höger din rullning: inlägget du ser har en ring i sin dagsfärg. Klicka på en nål så rullar tidslinjen till dess inlägg.',
  'help.guide.journey-map-layers.tip.1':
    'En streckad färgad linje är en resas GPX-rutt och ingår i planen. En heldragen linje är en rutt som spelades in den dagen.',
  'help.guide.journey-keep-route.tip.1':
    'Där inspelningen slutar slutar också linjen. TREK ritar bara det som spelades in.',
  'help.guide.journey-day-stays.tip.1':
    'Raden visas bara för dem som får redigera dagboken och har sin egen Dawarich kopplad, och bara på dagar med något kvar att ta ställning till.',
  'help.guide.journey-take-over-day.step.4':
    'Låt Spara även dagens rutt vara på om du vill behålla rutten också, och klicka sedan på knappen Hämta. Den visar hur många utkast som skapas.',
  'help.guide.journey-auto-prepare.step.3':
    'Raden under visar när dina vistelser senast hämtades, eller varför det inte gick. Klicka på Hämta nu för att fråga Dawarich direkt.',
  'help.guide.photo-location.tip.1': 'Platser du har angett själv flyttas aldrig.',
  'help.ctx.settings-plugins.bullet.1':
    'Tilläggsinställningar: under den finns ett kort för varje plugin som behöver något av dig, med fält och Spara. Ett hemligt fält visas aldrig igen när det är sparat.',
  'help.guide.dashboard-widgets.step.3':
    'Återställ till standardinställningarna, under korten, återställer hela fliken Utseende till ursprungliga inställningar.',
  'help.guide.web-push-device.result':
    'Kortet visar På för den här enheten, och händelserna du har slagit på under Push kommer fram även när TREK är stängt.',
  'help.guide.connect-airtrail.step.1':
    'Hitta AirTrail under Integrationer och ange dess Instans URL och en API-nyckel. Nyckeln skapar du i AirTrail under Inställningar, Säkerhet.',
  'help.guide.connect-dawarich.step.1':
    'Hitta Dawarich under Integrationer och ange dess Instansens adress och API-nyckeln från Dawarich under Konto, API-nyckel.',
  'help.guide.tour-connect-wanderer.step.1':
    'Hitta wanderer under Integrationer och ange dess Instans URL och en API-token. Token skapar du i wanderer under Inställningar, Konto, API-token. Den börjar med wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal': 'Låt TREK leta efter ändringar i lederna du har importerat, i bakgrunden.',
  'help.guide.mcp-oauth.tip.3': 'API Token fungerar fortfarande men är märkta Utfasad. Byt till en OAuth-klient.',
  'help.guide.offline-conflicts.tip.2': 'Valet gäller bara den här enheten.',
  'help.guide.default-user-settings.tip.1':
    'En användares eget val under Inställningar gäller alltid först. De här värdena gäller alla som inte har ändrat inställningen.',
  'help.guide.own-routing-engine.step.1':
    'Under Karta i Användarinställningar anger du adressen till din OSRM-server under Egen ruttmotor.',
  'help.guide.admin-passkeys.tip.2':
    'Om du ändrar domänen senare slutar alla inloggningsnycklar som användare redan har lagt till att fungera.',
  'help.guide.instance-keys.tip.4': 'Amap-nyckeln måste vara en Web 服务 (webbtjänst)-nyckel, inte en JS API-nyckel.',
  'help.guide.rotate-jwt-secret.step.2': 'Läs varningen och klicka på Rotera och logga ut.',
  'help.guide.notification-defaults.tip.2': 'Ett standardvärde gäller bara dem som inte själva har ändrat den cellen.',
  'help.ctx.notifications.bullet.5':
    'I Inställningar, under Meddelanden, väljer du vilka händelser du får här och vilka du får via e-post, webhook, ntfy eller push.',
  'help.guide.read-notifications.result':
    'Du hamnar på skärmen som meddelandet gällde, och talet på klockan minskar med ett.',
  'help.guide.mark-notifications-read.title': 'Markera meddelanden som lästa',
  'help.guide.delete-notifications.goal': 'Håll listan kort genom att ta bort det du inte längre behöver.',
  'help.guide.notification-settings.step.1': 'Klicka på ditt namn uppe till höger.',
  'help.guide.public-link.step.5': 'Du kan ändra valen så länge länken finns. Ta bort länk stänger av länken.',
  'help.guide.link-journal.step.3':
    'Välj Ingen åtkomst, Läsa eller Redigera för varje person på resan. Med Alla kan läsa och Ingen ställer du in alla på en gång.',
  'help.guide.collapse-columns.tip.3': 'När avdelaren har fokus kan du också flytta den med piltangenterna.',
  'help.guide.edit-place.tip.3':
    'Om du klickar utanför dialogen går dina ändringar inte förlorade: TREK frågar först Slänga ändringarna?, och Fortsätt redigera tar dig tillbaka till formuläret.',
  'help.guide.dawarich-stays.goal':
    'Lägg till platserna där Dawarich registrerade dina vistelser under resan, efter att du har kontrollerat var och en.',
  'help.guide.leave-stop-off-route.step.1':
    'Högerklicka på stoppet, eller klicka på dess tre prickar, och välj Uteslut från rutten.',
  'help.guide.move-booking-day.step.3':
    'Raden ligger nu på den nya dagen, på sin egen tid. Öppna bokningen om du också behöver ändra tiden.',
  'help.guide.place-image-from-file.goal':
    'Använd ett foto som redan finns bland platsens filer som platsens bild, utan att ladda upp det igen.',
  'help.guide.place-image-from-file.tip.3': 'Bara resenärer som får ändra platser kan byta bilden.',
  'help.guide.place-own-hours.result':
    'Kortet visar ditt telefonnummer, din e-postadress och dina öppettider, och ringen runt bilden är grön eller röd efter dina tider.',
  'help.guide.confirm-stay-booking.step.4':
    'Stäng bokningen med X uppe till höger. Under Bokning visar vistelsens kort nu Bekräftat.',
  'help.guide.tour-map-lines.title': 'Hitta dina turer på kartan',
  'help.guide.tour-map-lines.tip.2':
    'Att dölja en tur påverkar bara dig och sparas i den här webbläsaren för den här resan: turen, dess dagar och dess färg förblir oförändrade för alla andra. Visa alla, ovanför listan Turer, visar alla dolda turer igen, och telefonkartan visar alltid alla turer.',
  'help.guide.car-stops.step.4':
    'Klicka på Lägg till stopp under Stopp längs vägen för varje plats som körningen passerar och välj platsen, med en tid bredvid om du vill. Ett stopp utan vald plats tas bort när du sparar.',
  'help.guide.transport-details.step.2':
    'Pillren i rubriken visar status, typ, dag och Bokningskod. Klicka på statuspillret för att växla mellan Väntande och Bekräftat. Den lilla kopieringsikonen i kodpillret, Kopiera bokningskod, kopierar koden till urklipp.',
  'help.guide.group-sort-bookings.step.3':
    'Under Sortera efter väljer du Datum, Titel, Typ eller Status. Raden under vänder ordningen: Tidigast först eller Senast först för datum, A till Ö eller Ö till A för övriga.',
  'help.guide.booking-on-map.title': 'Hitta en bokning på kartan',
  'help.guide.export-bookings-csv.tip.1':
    'Kolumnerna är Typ, Titel, Status, Start, Slut, Från, Till, Plats, Bekräftelse och Noteringar.',
  'help.guide.arrange-packing-list.tip.1':
    'Medan A till Ö är på kan du inte dra föremål, men du kan fortfarande dra hela listor.',
  'help.guide.count-packed-pieces.step.3':
    'Så länge bara en del av styckena är packade har räknaren din accentfärg och kryssrutan en kontur i samma färg. Klicka på minus för att ta bort ett stycke från räkningen.',
  'help.guide.expense-receipts.step.5':
    'Förhandsvisningen visar kvittot, med Öppna i ny flik och Ladda ner överst. Med flera kvitton bläddrar du mellan dem med piltangenterna, och Esc stänger förhandsvisningen.',
  'help.guide.files-sync-settings.step.3':
    'Klicka på Inställningar under flödesfältet för att visa resten av alternativen.',
  'help.guide.manage-notes.step.3':
    'Fäst, i samma meny, håller noteringen överst i panelen, med en ram i kategorins färg och en nål bredvid titeln. Ta bort fästningen i samma meny flyttar tillbaka noteringen till sin vanliga plats.',
  'help.guide.note-categories.step.1':
    'Klicka på kugghjulet bredvid Ny notering i rubriken på kortet Noteringar. Hantera kategorier öppnas, med en rad för varje kategori: dess färg, dess namn, sex färgprickar och en papperskorg.',
  'help.guide.note-categories.tip.2':
    'En kategori utan noteringar sparas bara i din webbläsare. De andra medlemmarna ser den först när en notering har lagts under den.',
  'help.guide.roadtrip-reorder.goal':
    'Ändra ordningen på körningen, eller flytta ett stopp till en annan dag, direkt i skenan.',
  'help.guide.roadtrip-overnight.step.4':
    'Hitta boende, bredvid, visar namnet att kopiera och länkar till bokningssajter: trivago eller CHECK24 för hotell, PiNCAMP eller Pitchup för campingplats. Kontrollera plats, datum och gäster på sajten.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Välj 50 till 100 under Fyller till. Raden under knapparna visar hur långt du kan köra härifrån med den fyllnaden.',
  'help.guide.roadtrip-bookings.step.2':
    'I skenan är resan ett kort i sin typs färg, med tidtabellen i ankomstkolumnen och start- och slutpunkt under titeln.',
  'help.guide.roadtrip-google-import.tip.1':
    'TREK räknar ut sin egen rutt mellan stoppen och kopierar inte Googles väg.',
  'help.guide.roadtrip-hazards.result': 'Kartan visar de aktuella varningarna runt din resa, och rutten ändras inte.',
  'help.ctx.trip-tours.bullet.3':
    'En rad: det färgade strecket är turens linje på kartan, den runda rutan visar ruttgränsen (T1 till T6) eller typen, ett litet GPX- eller wanderer-märke visar att turen är importerad, och märkena anger dagar, tid, sträcka och stigning. En måne med ett tal visar antalet etapper på en flerdagarstur.',
  'help.guide.tour-show-list.step.3': 'Klicka på en rad. Turens kort öppnas över kartan.',
  'help.guide.tour-add-to-day.goal': 'Planera när du gör en tur, så att den ligger på dagen med sin linje på kartan.',
  'help.guide.tour-add-to-day.tip.3':
    'Du kan lägga en tur på en dag bara en gång. Om du släpper den på en dag som redan har den visar TREK bara Den här turen finns redan på den dagen.',
  'help.guide.tour-day-times.step.4':
    'Om turen slutar efter att dagens nästa punkt har börjat visas en rad under raden som säger det, till exempel Slutar 13:30, efter att Lunch at Gostner Schwaige börjar 12:30. Inget flyttas.',
  'help.guide.tour-remove-from-day.step.1':
    'Peka på turens rad i dagkolumnen, klicka på Fler alternativ och välj Ta bort från dagen.',
  'help.guide.tour-filter-list.step.1':
    'Klicka på filterknappen under Importera GPX eller KML. Den visar statusen den filtrerar på, först Alla, med antalet turer bredvid.',
  'help.guide.tour-hide-on-map.title': 'Dölj en turs linje på kartan',
  'help.guide.tour-import-plan-tab.title': 'Importera ett spår från fliken Planering',
  'help.ctx.trip-tour-detail.title': 'Turdetaljer',
  'help.guide.tour-detail-read.goal':
    'Se allt som resan vet om en tur: dess dagar, sträcka och höjder, profil och källa.',
  'help.guide.tour-detail-read.tip.1':
    'Ett gult piller med använd med försiktighet betyder att importen har ofullständiga höjder eller mått. Ha det i åtanke när du läser stigningen och profilen.',
  'help.guide.tour-rename-colour.step.1':
    'Öppna turens kort och klicka på pennan bredvid namnet. Namnet blir ett fält.',
  'help.guide.tour-take-along.goal':
    'Få vägbeskrivning till en turs start, öppna turens sida på webben eller ladda ner dess rutt som GPX-fil.',
  'help.guide.tour-take-along.result': 'Du har vägen till starten i din kartapp och hela rutten som GPX-fil.',
  'help.guide.tour-copy-keep.tip.2':
    'Spara i samling i en turs meny i dagsplanen öppnar samma dialog, så rutten sparas där också.',
  'help.guide.tour-packing-link.step.3': 'Klicka på Länka.',
  'help.guide.tour-files.goal':
    'Lägg till en bokning, en karta eller en beskrivning av rutten på turen och öppna den igen från turens kort.',
  'help.guide.tour-activity-link.goal': 'Koppla ett inspelat GPX-spår till en planerad tur utan att ändra planen.',
  'help.guide.tour-activity-link.tip.3':
    'Tidsåtgång räknas från första till sista tidsstämpeln i spåret, pauser inräknade.',
  'help.guide.tour-activity-compare.tip.1':
    'Jämför på kartan finns bara när kortet visas bredvid kartan, inte på en telefon.',
  'help.guide.tour-origin-check.tip.1':
    'En tur som har hämtats från en annan resa visar den resan och turen under Hämtad från.',
  'help.ctx.trip-tour-planner.bullet.3':
    'Turer för den här resan, den högra skenan, listar varje tur med filtret och Resans omfattning ovanför listan. Medan en tur är öppen visar Turöversikt högst upp dess sträcka, stigning, tid och höjdprofil. Plusset högst upp, Lägg till tur, planerar, importerar eller hämtar en tur.',
  'help.guide.tour-open-workspace.step.3':
    'Den högra skenan, Turer för den här resan, listar alla resans turer, med filtret och Resans omfattning ovanför listan.',
  'help.guide.tour-open-workspace.result':
    'Fliken Turer: redigeraren till vänster, resans turer till höger och kartan emellan.',
  'help.guide.tour-draw-route.step.6':
    'Under Vägpunkter får varje punkt en rad med sitt nummer, uppkallad efter platsen när namnet har lästs in. Medan TREK arbetar visar en liten prick bredvid Ny tur status.',
  'help.guide.tour-type-profile.step.1':
    'Klicka på Turtyp under Turens namn. Den visar den aktuella typen med en rad om hur den planeras.',
  'help.guide.tour-edit-points.goal': 'Ändra vart turen går genom att flytta dess punkter på kartan eller i listan.',
  'help.guide.tour-edit-points.tip.2':
    'En rad visar koordinaterna tills platsnamnet har lästs in. Ångra och Gör om har ingen kortkommando.',
  'help.guide.tour-shaping-points.tip.1': 'Start och slut är alltid stopp.',
  'help.guide.tour-loop-reverse.step.3': 'Klicka på Vänd riktning bredvid för att gå hela turen i motsatt riktning.',
  'help.guide.tour-leg-by-hand.step.2':
    'Sträckan blir en streckad rak linje, och under raden visar listan Ritad för hand, inte ruttad, med sträckans längd.',
  'help.guide.tour-trip-places.step.1':
    'Klicka på Resans platser bredvid Lägg till punkt under Vägpunkter. Resans platser visas under den.',
  'help.guide.tour-details-times.title': 'Namnge turen och planera dess tid',
  'help.guide.tour-details-times.tip.3':
    'Klicka på pilen bredvid Detaljer för att fälla ihop dem. De öppnas automatiskt när ett av fälten har ett värde som Spara inte godtar.',
  'help.guide.tour-save.tip.1':
    'Ångra bredvid Spara kastar de osparade ändringarna efter en bekräftelse. En sparad tur påverkas inte.',
  'help.guide.tour-edit-saved.step.3':
    'Klicka på Spara. Tur sparad visas, och turen behåller sina dagar, filer och anteckningar.',
  'help.guide.tour-summary-profile.step.1':
    'Turöversikt högst upp i Turer för den här resan visar Avstånd, Höjdmeter uppför och Höjdmeter nedför för turen i redigeraren, dess beräknade tid, pauserna och den planerade totaltiden.',
  'help.guide.tour-list-manage.title': 'Hantera resans turer',
  'help.guide.tour-list-manage.tip.2':
    'En dag som redan har turen är gråad i dagmenyn. För en flerdagarstur frågar TREK om etapperna ska börja på den dagen eller om hela turen ska läggas på den dagen.',
  'help.guide.tour-delete.tip.2':
    'Om du bara vill ta bort turen från en dag använder du i stället Ta bort från dagen i dagens meny.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Välj Spara som ny tur för att behålla båda, Ladda nyare för att läsa in den andra versionen eller Skriv över för att ersätta den andra versionen med din.',
  'help.ctx.trip-tour-import.bullet.3':
    'En import öppnas som en GPX-tur eller en wanderer-tur: dess linje, Turöversikt och höjdprofilen, precis som de importerades. Dess rad i listan har märket GPX-import.',
  'help.guide.tour-import-gpx.step.4':
    'Kontrollera under Importera som vad spåren är. Vandring är förvalt. En Cykeltur eller en Löptur frågar efter sin profil, en Paddeltur efter sin båt och sitt vatten och Skidor och vinter efter sin disciplin.',
  'help.guide.tour-view-import.title': 'Titta på ett importerat spår',
  'help.guide.tour-view-import.result':
    'Du ser det inspelade spåret precis som det importerades, utan att något har räknats om.',
  'help.guide.tour-plan-from-import.tip.2':
    'När kortet säger att förslaget avviker från spåret på längre sträckor bör du kontrollera de delarna på kartan innan du planerar vidare.',
  'help.guide.tour-restore-recorded.step.3':
    'Bekräfta med Återställ inspelat spår. Vägpunkterna och den ruttade linjen tas bort, men dagarna och anteckningarna finns kvar.',
  'help.guide.tour-take-over.step.3':
    'Hitta turen: skriv i Sök efter namn, eller begränsa listan med filtren Resa och Typ.',
  'help.guide.tour-import-wanderer.title': 'Importera en led från wanderer',
  'help.guide.tour-import-wanderer.tip.3':
    'En led som redan finns i resan är märkt I den här resan och erbjuder Öppna turen. En led som har ändrats sedan importen erbjuder Importera som ny version bredvid den gamla.',
  'help.ctx.trip-tour-map.bullet.4':
    'Längs turen, ett kort i vänstra panelen, söker efter utsiktsplatser, vatten, hyddor, mat med mera nära rutten och listar resultaten. Du kan lägga till en plats från listan i turen som ett stopp.',
  'help.guide.tour-map-layers.tip.1':
    'Kartan du väljer gäller för alla turer du öppnar tills du laddar om sidan. En tur vars typ inte erbjuder den öppnas på Karta, och kartan på fliken Planering och inställningen i Inställningar ändras inte.',
  'help.guide.tour-along-search.step.4': 'Klicka på Sök längs turen. TREK söker bara: turen ändras inte.',
  'help.guide.tour-along-add-stop.step.1':
    'Klicka på en plats i listan Längs turen, eller på dess nål på kartan. Dess kort öppnas över kartan: vad platsen är, hur långt den ligger från rutten och hur långt längs turen den ligger.',
  'help.guide.tour-3d-terrain.title': 'Se en tur i 3D',
  'help.guide.tour-3d-terrain.tip.1': 'Översikt i samma rad visar hela rutten igen efter att du har flyttat vyn.',
  'help.guide.tour-3d-flyover.step.4': 'Klicka på Översikt för att visa hela turen igen.',
  'help.guide.tour-map-overlays.step.2':
    'Klicka på Pistförklaring, den lilla rutan med färgade prickar bredvid reglaget.',
  'help.ctx.trip-tour-stages.summary':
    'En flerdagarstur är en rutt uppdelad i etapper, en för varje dag du är på väg. Här anger du var varje dag slutar, ser måtten för varje etapp och lägger etapperna på resans dagar.',
  'help.guide.tour-multi-day.step.1': 'Klicka på turen i Turer för den här resan för att öppna den i redigeraren.',
  'help.guide.tour-multi-day.tip.3':
    'En etapps tid räknas utan pauser. En tid i varningsfärg, Mer än en dag i rörelse, är längre än en dag.',
  'help.guide.tour-stages-on-days.step.4':
    'Klicka på knappen med månen och antalet etapper, Visa etapper, för att visa dem.',
  'help.ctx.trip-tour-hike.title': 'Vandringar och löpturer',
  'help.guide.tour-hike-plan.title': 'Planera en vandring inom en svårighetsgrad du bestämmer',
  'help.guide.tour-hike-plan.result':
    'Vandringen listas under Turer för den här resan med sträcka, stigning och gångtid, redo att läggas på en dag.',
  'help.guide.tour-hike-trail-details.step.2':
    'Välj vad som ska visas: SAC för vandringsgraden, Underlag eller Vägtyp. Rutten på kartan får samma färger som listan.',
  'help.guide.tour-hike-round.title': 'Hitta en rundvandring av ungefär en viss längd',
  'help.guide.tour-hike-round.tip.1':
    'Rundorna håller sig inom vandringens Högsta svårighetsgrad för leden. T-pillret i kortet visar vilken.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Klicka på Ta den här vägen. TREK kontrollerar med ruttplaneraren att rutten verkligen följer den.',
  'help.guide.tour-ferrata-add.step.2':
    'Klicka på en via ferrata på kartan, på dess streckade linje eller dess skylt. Kortet visar namn, grad och längd.',
  'help.guide.tour-ferrata-add.tip.4':
    'Visa i OpenStreetMap på kortet öppnar via ferratans egna data. Märket blir gult när inget kan läsas in, med orsaken i verktygstipset.',
  'help.guide.tour-run-plan.result':
    'Löpturen listas under Turer för den här resan med sin Löptid (planerad), och dess profil och tempo sparas med den.',
  'help.guide.tour-run-ways.step.2':
    'Överst på kortet ser du nu hur stor del av löpturen som är obelagd och den svåraste graderade stigen på den.',
  'help.ctx.trip-tour-walk.bullet.2':
    'Vägpunkter listar stoppen i ordning. En ring runt ett stopps nummer markerar det som Måste ses (hel) eller Valfritt (streckad), en liten sköld markerar det som Skyddad, och ett piller under namnet visar hur länge du stannar.',
  'help.guide.tour-walk-plan.step.3':
    'Peka på ett stopp i Vägpunkter, klicka på Fler åtgärder bredvid det och välj Redigera stopp.',
  'help.guide.tour-walk-sights.title': 'Lägg till sevärdheter längs en stadspromenad',
  'help.guide.tour-walk-sights.tip.2':
    'När du har ändrat rutten visar knappen Sök igen, eftersom de platser som hittades hör till den gamla rutten.',
  'help.guide.tour-walk-day-times.step.4':
    'Under varje stopp ser du när du kommer fram och hur länge du stannar. En varning visas där en plats är stängd vid den tidpunkten eller stänger under vistelsen.',
  'help.guide.tour-walk-google-import.step.1':
    'Klicka på Lägg till tur (+ högst upp) i Turer för den här resan och välj Importera promenad från Google Maps.',
  'help.guide.tour-walk-check-off.title': 'Bocka av en promenads stopp under dagen',
  'help.guide.tour-walk-check-off.tip.3':
    'Om du lägger en promenad på en dag medan du är offline kan du bocka av den när den har synkats.',
  'help.guide.tour-bike-profile.title': 'Planera en cykeltur efter ditt sätt att cykla',
  'help.guide.tour-bike-profile.result':
    'Cykelturen sparas och listas under Turer för den här resan, ruttad efter sin profil, med cykeltiden i Turöversikt.',
  'help.guide.tour-bike-surfaces.step.1':
    'Klicka på en cykeltur i Turer för den här resan till höger för att öppna den. När rutten är beräknad visas kortet Underlag och vägar under Vägpunkter.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Klicka på kortets titel för att fälla ihop det. Det förblir hopfällt i den här webbläsaren även efter att du har laddat om.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Där kartläggare har graderat stigningarna följer Uppförsgrad (mtb:scale:uphill) längre ned med egna rader.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Kortet Pistrutt under vägpunkterna delar upp dagen i Åkning, I liftar, Väntan och Till fots, med pisternas längd, höjden du åker ned på dem och liftturerna. Skidtid i Turöversikt till höger summerar allt när varje sträcka är planerad.',
  'help.guide.tour-ski-plan.step.5':
    'Under varje punkt listas dess sträcka som chips: varje pist, lift och sträcka till fots med namn eller typ, pister med en prick i färgen för sin svårighetsgrad, och minuterna för varje.',
  'help.guide.tour-ski-options.goal':
    'Ange de svåraste pisterna, vad du föredrar, ditt tempo och vilka liftar du vill använda, så att sträckorna passar dig.',
  'help.guide.tour-ski-options.tip.3':
    'Undvik gissade länkar håller rutten borta från förbindelser som kartdatan bara gissar, till exempel en okartlagd sträcka mellan två pister.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Medan pistdatan för ett område fortfarande laddas ned väntar planeraren och försöker igen automatiskt.',
  'help.guide.tour-ski-summary.step.3':
    'Skidtid i Turöversikt till höger summerar allt. Infoprickens förklaring visar hur tiden räknas ut.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Medan en Skidor och vinter-tur är öppen visar kartan pisterna automatiskt. Reglaget med det snöiga berget i raden längst ned till vänster på kartan stänger av och slår på dem. Verktygstipset lyder Pister, längdspår och liftar.',
  'help.guide.tour-ski-import.goal':
    'Importera ett inspelat utförs-, längdskid- eller snöskospår och ge det rätt disciplin.',
  'help.guide.tour-ski-import.tip.2':
    'Om du vill redigera spåret som en planerad tur använder du Planera en redigerbar version i kortet Redigerbar version. Dess punkter förbinds med raka linjer.',
  'help.ctx.trip-tour-paddle.bullet.4':
    'Tidsuppskattning summerar tiden på vattnet, bärningen av båten, att gå i land och i igen, slussarna och pauserna, utifrån hastigheter och minuter som du kan ändra.',
  'help.guide.tour-paddle-setup.step.4':
    'Välj Älv eller Sjö under Vatten. Du kan inte spara turen förrän du har valt både båt och vattentyp.',
  'help.guide.tour-paddle-setup.result':
    'En ny paddeltur med båt, vatten och fart, redo för sin första punkt på kartan.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Där vattendata saknas hämtar TREK den för regionen automatiskt eller ber en admin om den, beroende på hur instansen är inställd. Sträckan visar då Läser in vattendata och planeras automatiskt när datan finns, vanligtvis inom en till tre minuter.',
  'help.guide.tour-paddle-portage.step.2':
    'Välj Bär båten härifrån. Sträckan till nästa punkt blir en bärsträcka, ritad på land.',
  'help.guide.tour-paddle-lock.title': 'Lägg till en sluss och dess väntetid',
  'help.guide.tour-paddle-lock.tip.3': 'Ta bort slussen finns längst ned på det öppna kortet och i Fler åtgärder.',
  'help.guide.tour-paddle-time.step.5':
    'Tills varje sluss har sina tider visar uppskattningen Ofullständig, och en not under raderna listar vad som saknas.',
  'help.guide.tour-paddle-wind.step.2':
    'Läs av vindriktningen, Medel och Byar. Medel är dagens högsta timmedelvärde, Byar den kraftigaste vindbyn.',
  'help.guide.tour-paddle-checklist.title': 'Gå igenom checklistan för hinder',
  'help.guide.tour-paddle-checklist.tip.2':
    'Bär runt planerar ingen bärsträcka automatiskt. Klicka på Planera lyftet för att lägga upp den på kartan.',
  'help.guide.tour-paddle-track-marks.step.2':
    'Ställ Importera som på Paddeltur i Förhandsvisning av importen och välj sedan Båt och Vatten. Importen kan inte fortsätta förrän du har valt båda.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'På ett inspelat spår har raden Vatten i Tidsuppskattning en egen fart: klicka på den och skriv hur fort du paddlade.',
  'help.ctx.trip-tour-horse.bullet.5':
    'En ridtur som importerats från en GPX-fil förblir precis som den spelades in, och kortet Inspelad ridtur visar vad importen inte kunde räkna ut.',
  'help.guide.tour-horse-plan.step.6':
    'Klicka på Ta delsträcka. Delsträckan läggs till på ridturen som ett märke med ruttens namn i kortet Vägpunkter. Lägg till fler delsträckor på samma sätt.',
  'help.guide.tour-horse-gap.title': 'Överbrygga ett glapp mellan hästrutter',
  'help.guide.tour-horse-gap.tip.2':
    'Punkter du klickar på kartan läggs till på ridturen på samma sätt, som raka, okontrollerade sträckor.',
  'help.guide.tour-horse-recorded.result':
    'Ridturen ligger i resan precis som du red den, med sträcka och höjder från filen.',
  'help.guide.dateless-trip.step.3': 'Klicka på Skapa ny resa.',
  'help.guide.trip-reminder.tip.2':
    'En ny resa får en påminnelse 3 dagar före avresan. Vilka kanaler du vill ha den i väljer du under Inställningar, Meddelanden.',
  'help.guide.upcoming-reservations.result':
    'Resan öppnas. När du är tillbaka på översikten visar widgeten fortfarande vad som kommer härnäst.',
  'help.guide.entitlement.tip.2':
    'I en sammanslagen plan har alla en egen rad, och du kan ställa in de andras rättighet också.',
  'help.guide.half-company-holiday.step.3': 'Klicka på dagen. Halva cellen blir gul.',
  'help.guide.school-holidays.tip.2': 'Håll pekaren över en dag i ett lov så ser du lovets namn under Skollov.',
  'help.guide.answer-fusion-request.step.3':
    'Klicka på Godkänn & Slå samman för att slå ihop planerna, eller på Avböj om du vill behålla din plan för dig själv.',
  'help.guide.log-for-partner.step.3':
    'Klicka på de dagar som ska loggas och klicka sedan på ditt eget namn i Personer igen.',
  'help.guide.dissolve-fusion.result':
    'Alla är tillbaka på sin egen plan med sina egna poster, och Personer listar bara dig.',
  'help.guide.country-places.result': 'Planeraren öppnas på resan som platsen hör till.',
  'help.guide.tour-activity-stats.step.6':
    'För en tur som aldrig blev av klickar du på Uteslut, den runda knappen i slutet av turens rad. Turen finns kvar i listan, dämpad och märkt Utelämnat. Samma knapp, nu Räkna igen, räknar med turen igen.',
  'help.guide.move-to-list.tip.1':
    'Etiketter hör till en lista, så en flyttad eller duplicerad plats har inga etiketter i den nya listan.',
  'help.guide.accept-list-invite.step.1':
    'Hitta inbjudan under Inbjudningar i listskenan. Om du kom hit via inbjudningsmeddelandet ligger kortet högst upp på sidan. Det visar listans namn och vem inbjudan kommer från.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Den nya turen ligger ännu inte på någon dag och lägger inte till några platser. Varken listan eller originalturen ändras.',
  'help.guide.tour-collection-manage.step.3':
    'Klicka på papperskorgen i slutet av turens rad och bekräfta med Ta bort från samlingen.',
  'help.ctx.journey-detail.bullet.7':
    'Med Dawarich kopplat visar en dagrubrik också Ta över inspelningen (eller avståndet för den rutt som sparats för dagen) och Ta över dag. På en dag med väntande vistelser samlas vistelserna på en rad i slutet av dagen.',
  'help.guide.entry-draft.tip.1':
    'Medverkande ser fortfarande ett utkast. Bara den offentliga länken döljer det, tills du slår av Utkast.',
  'help.guide.journey-map-layers.tip.2':
    'Ett dämpat reglage har ännu inget att visa, och verktygstipset säger varför. Ditt val sparas per Journey i den här webbläsaren.',
  'help.guide.journey-keep-route.tip.2':
    'Klicka senare på avståndet i dagrubriken för att jämföra med Dawarich igen: Ersätt tar den nya versionen, och Ta bort rutt tar bort dagens rutt från Journey.',
  'help.guide.journey-day-stays.tip.2':
    'För en späckad dag hanterar Ta över dag i slutet av raden alla dagens vistelser på en gång.',
  'help.guide.journey-take-over-day.tip.1':
    'Inget sparas förrän du klickar på knappen, och inget sparas två gånger: en vistelse som redan finns i dagboken är markerad och kan inte väljas igen.',
  'help.guide.journey-auto-prepare.tip.1':
    'Bara dagar i länkade resor med datum förbereds, och inget läggs till i dagboken automatiskt.',
  'help.guide.photo-location.result':
    'Ett inlägg utan plats får platsen där dess första foto med GPS togs och visas på kartan.',
  'help.guide.contributors.tip.2':
    'Via resor listar de personer som har åtkomst via en länkad resa. Ändra deras åtkomst i den resans inställningar, inte här.',
  'help.ctx.settings-plugins.bullet.2':
    'Ett plugin kan lägga till Åtgärder på sitt kort, som körs efter att du har bekräftat, samt Anslut eller Koppla från när det loggar in på en annan tjänst åt dig.',
  'help.guide.web-push-device.tip.1':
    'Push fungerar per webbläsare: upprepa stegen på varje telefon och dator där du vill ha meddelanden. Slå av för den här enheten stänger bara av push på den enheten.',
  'help.guide.connect-airtrail.step.2':
    'Tillåt självsignerade certifikat är bara till för en betrodd instans i ditt eget nätverk. Skriv tillbaka ändringarna till AirTrail är av som standard, så TREK bara läser. Slå på det för att skicka tillbaka dina ändringar.',
  'help.guide.connect-dawarich.step.2':
    'Leta efter nya vistelser automatiskt låter TREK kontrollera på egen hand. När det är av läser TREK Dawarich bara när du ber om det. Tillåt självsignerat certifikat är bara till för en instans som din server inte litar på.',
  'help.guide.tour-connect-wanderer.step.2':
    'Slå bara på Tillåt ett självsignerat certifikat för en instans i ditt eget nätverk.',
  'help.guide.tour-wanderer-watch.step.1':
    'Slå på Kontrollera ändringar i mina leder i kortet för wanderer. Det kräver först en sparad anslutning.',
  'help.guide.plugin-settings.title': 'Ställ in ett plugin för dig själv',
  'help.guide.default-user-settings.tip.2':
    'Visningsvaluta räknar bara om belopp för visning. De belopp som angetts i Kostnader ändras inte.',
  'help.guide.own-routing-engine.step.2':
    'För rutter som undviker vägtullar, motorvägar eller färjor anger du din Valhalla-adress under Egen Valhalla-instans. Varje fält sparas när du lämnar det. Starta sedan om TREK-servern och ladda om sidan.',
  'help.guide.admin-passkeys.tip.3':
    'Om en användare har tappat enheten med sina inloggningsnycklar tar du bort nycklarna med Återställ inloggningsnycklar i Redigera anvädnare.',
  'help.guide.rotate-jwt-secret.result':
    'En ny signeringshemlighet är på plats, och alla användare, du inräknad, måste logga in igen.',
  'help.guide.read-notifications.title': 'Läs dina meddelanden',
  'help.guide.filter-notifications.title': 'Visa alla meddelanden, eller bara de olästa',
  'help.guide.mark-notifications-read.goal':
    'Ta bort markeringen och talet på klockan när du har sett vad som är nytt.',
  'help.guide.delete-notifications.step.1':
    'Klicka på Radera, papperskorgen bredvid ett meddelandes tid, för att ta bort bara det meddelandet.',
  'help.guide.notification-settings.step.2': 'Klicka på Inställningar i menyn.',
  'help.guide.public-link.tip.3': 'Håll pekaren över ett alternativ för att läsa vad det döljer.',
  'help.guide.link-journal.step.4':
    'Läs den gula noteringen: den visar vem som får dagboken för första gången. Klicka sedan på Koppla dagbok.',
  'help.guide.dawarich-stays.step.1':
    'När Dawarich är kopplat under Inställningar, Integrationer, visas Från Dawarich ovanför platslistan. Rubriken visar när TREK senast kontrollerade och hur många vistelser som väntar. Klicka på den för att öppna listan.',
  'help.guide.leave-stop-off-route.step.2':
    'Märket Utanför rutten visas bredvid namnet. Stoppet finns kvar på dagen och på kartan, men dagens rutt och dess sträcktider hoppar över det.',
  'help.guide.move-booking-day.result': 'Bokningen hör nu till den nya dagen i planen, med oförändrad tid.',
  'help.guide.clear-day.tip.2': 'Menyvalet visas bara på en dag som har platser.',
  'help.guide.place-image-from-file.step.1':
    'Öppna en plats som har ett foto bland sina Filer. Blocket Filer nära kortets nederkant visar hur många filer platsen har.',
  'help.guide.place-own-hours.title': 'Rätta en plats öppettider, telefonnummer eller e-postadress',
  'help.guide.place-own-hours.tip.1':
    'Tider du skriver in ersätter dem som TREK slog upp, så ett kafé med säsongstider visar det du vet.',
  'help.guide.day-panel.tip.3':
    'Planerar du efter kalendern? Slå på Datum först i dagsrubriker i Inställningar, under Visning, så visar rubriken datumet först, med Dag 1 eller dagens namn under.',
  'help.guide.confirm-stay-booking.result':
    'Hotellbokningen är bekräftad, både på vistelsens kort och på fliken Bokningar.',
  'help.guide.tour-map-lines.goal':
    'Skilj resans turer åt på kartan, öppna en tur från dess linje och dölj de du inte behöver just nu.',
  'help.guide.tour-map-lines.tip.3':
    'Uteslut från rutten, i menyn på turens rad i dagsplanen, betyder att dagens rutt inte längre går till turens start och slut. Lägg tillbaka i rutten förbinder dem igen.',
  'help.guide.car-stops.step.5':
    'Stoppens ordning är rutten. Flytta upp och Flytta ner till vänster om ett stopp ändrar ordningen, och Ta bort stopp, krysset till höger, tar bort stoppet.',
  'help.guide.transport-details.step.3':
    'Rutorna nedanför visar avgång och ankomst med stationer eller flygplatser, sedan plattform och plats när de är angivna. En färd med stopp emellan listar dem under Rutt, och en färd som bokats sträcka för sträcka listar varje sträckas kod under Koder per sträcka. Därefter kommer Resenärer, Noteringar, Kostnader och Filer. Visa i filer öppnar biljetten på fliken Filer.',
  'help.guide.export-transports-csv.title': 'Exportera transporterna som kalkylblad',
  'help.guide.group-sort-bookings.step.4':
    'Klicka på en sektions rubrik för att fälla ihop den. Talet bredvid visar hur många bokningar som finns i sektionen, och ett andra klick öppnar den igen.',
  'help.guide.booking-on-map.goal': 'Hoppa från en bokning till dess plats i planen och på kartan.',
  'help.guide.export-bookings-csv.tip.2':
    'Kolumnerna är åtskilda med semikolon, och Excel öppnar filen med bibehållna accenter.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK kommer ihåg A till Ö i den här webbläsaren, så listan öppnas sorterad nästa gång också. Det ändrar bara vad du ser, aldrig ordningen som de andra ser.',
  'help.guide.count-packed-pieces.step.4':
    'När räknaren når antalet bockas föremålet av automatiskt och räknas som packat.',
  'help.guide.expense-receipts.result':
    'Kvittot sparas med utgiften: chipet på dess rad öppnar det, och filen finns också i resans Filer.',
  'help.guide.files-sync-settings.step.4':
    'Under När ett dokument tas bort väljer du vad som händer med kopian på andra sidan. Behåll båda kopiorna låter lagringens kopia ligga kvar. Flytta till papperskorgen skickar den till lagringens papperskorg när dokumentet raderas i TREK.',
  'help.ctx.trip-collab.bullet.7':
    'Allt här kräver en anslutning. Offline sparas inget meddelande, ingen notering, ingen länk, ingen omröstning och ingen röst, och TREK säger Det här kräver en anslutning. Försök igen när TREK är online igen. Medlemmar som inte får redigera Samarbete kan läsa allt, men Ny notering, Lägg till länk och Ny omröstning finns inte för dem och meddelanderutan är gråad.',
  'help.guide.manage-notes.step.4':
    'Redigera öppnar noteringsdialogen med allt ifyllt. Ändra det du behöver, här en rad till under Innehåll, och klicka på Spara.',
  'help.guide.note-categories.step.2':
    'Skriv ett namn i Ny kategori... längst ned och tryck på Enter eller klicka på plusset bredvid. Den nya kategorin får nästa färg och en egen rad.',
  'help.guide.note-categories.tip.3':
    'På ett kort syns kategorin bara som den färgade pricken i rubriken. Håll pekaren över pricken för att se namnet.',
  'help.guide.roadtrip-reorder.step.1':
    'Dra ett stopp i dess rad och släpp det på ett annat stopp samma dag. Det tar det stoppets plats, och dagen ruttplaneras om i den nya ordningen.',
  'help.guide.roadtrip-overnight.step.5':
    'Klicka på Lägg till. Natten bokas från den här dagen till nästa, och platsen läggs till på körningen som dagens övernattning.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Om du vill gå tillbaka till din egen inställning för stoppet öppnar du märket igen och klickar på Använd mitt standardvärde.',
  'help.guide.roadtrip-bookings.step.3':
    'Pillret Incheckning eller Påstigning anger när du senast måste vara framme vid terminalen: avgången sätts så mycket tidigare än tidtabellen.',
  'help.guide.roadtrip-google-import.title': 'Importera en rutt från Google Maps',
  'help.guide.roadtrip-google-import.tip.2':
    'Länken måste innehålla minst två stopp som TREK kan placera, och högst 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Varningar är inga vägavstängningar: rutten ändras aldrig på grund av dem, och de är aktuella meddelanden, ingen prognos för dina datum.',
  'help.ctx.trip-tours.bullet.4':
    'Peka på en rad för att se ögat (Dölj på kartan) och det runda + (Lägg till i denna dag). Dra en rad till en dag i vänstra kolumnen för att planera den där, eller klicka på den för att öppna turens kort över kartan.',
  'help.guide.tour-show-list.step.4':
    'Kortet visar turens mått och, under Resdagar, de dagar den ligger på. Om du vill ändra själva rutten öppnar du fliken Turer och klickar på turen under Turer för den här resan.',
  'help.guide.tour-add-to-day.step.1':
    'Peka på turen i listan och klicka på det runda + till höger på dess rad (Lägg till i denna dag).',
  'help.guide.tour-add-to-day.tip.4':
    'Med en dag öppen (klicka på dess rubrik) erbjuder turens kort också Lägg till i dagen för den dagen. Ångra-pilen ovanför dagarna ångrar tilldelningen.',
  'help.guide.tour-day-times.tip.1': 'En sluttid som du skriver in ersätter den uträknade.',
  'help.guide.tour-remove-from-day.step.2':
    'Turen finns kvar i listan till höger. Märket Dag är borta, och filtret räknar den under Oplanerat igen.',
  'help.guide.tour-filter-list.step.2':
    'Under Status väljer du Oplanerat för turer som ännu inte ligger på någon dag, eller Planerat för turer som redan ligger på en dag. Varje rad visar hur många turer som matchar.',
  'help.guide.tour-hide-on-map.goal':
    'Dölj turer du inte behöver just nu på kartan, utan att ändra dem för någon annan.',
  'help.guide.tour-import-plan-tab.goal': 'Importera ett GPX- eller KML-spår som en tur medan du planerar dagarna.',
  'help.ctx.trip-tour-detail.summary':
    'Kortet som öppnas över kartan när du väljer en tur på fliken Planering: turens dagar, mått och profil, varifrån den kommer, och knapparna som skickar den till din telefon, kopierar den, sparar den i en samling eller kopplar den till packlistan.',
  'help.guide.tour-detail-read.step.1':
    'Växla från Platser till Turer högst upp i högra kolumnen och klicka sedan på en tur. Dess kort öppnas över kartan. Turens rad inne i en dag, eller dess linje på kartan, öppnar samma kort.',
  'help.guide.tour-detail-read.tip.2':
    'En paddeltur visar inga höjder och ingen profil: dess punkter ligger på stränderna, så höjderna skulle bli fel.',
  'help.guide.tour-rename-colour.step.2':
    'Skriv det nya namnet och klicka på den runda bockknappen, eller tryck på Enter. Med Escape behåller du det gamla namnet.',
  'help.guide.tour-take-along.step.1':
    'Öppna turens kort. Navigering längst ned på kortet öppnar turens start i en kartapp, och om det finns flera appar listas de först. Du får vägen till starten, inte längs rutten.',
  'help.guide.tour-copy-keep.title': 'Kopiera en tur eller spara den i en samling',
  'help.guide.tour-copy-keep.tip.3':
    'På fliken Turer gör bokmärket högst upp i vänstra kolumnen samma sak för den öppna turen. Har turen osparade ändringar ber den dig spara turen först.',
  'help.guide.tour-packing-link.step.4':
    'Kortet visar nu listan, hur många av dess föremål som är packade, ett fält och de första föremålen. Packade föremål är överstrukna.',
  'help.guide.tour-files.step.1':
    'Öppna turens kort och rulla till Filer i slutet. Klicka på Ladda upp i sektionens rubrik och välj en eller flera filer.',
  'help.guide.tour-activity-link.step.1':
    'Öppna den planerade turens kort och rulla till Faktiskt spår. Klicka på Lägg till faktiskt spår.',
  'help.guide.tour-activity-link.result':
    'Spåret är kopplat till turen, och kortet visar planen och det du gjorde bredvid varandra.',
  'help.guide.tour-activity-compare.tip.2':
    'Turaktiviteterna i Atlas räknar ett kopplat spår i stället för de planerade värdena.',
  'help.guide.tour-origin-check.tip.2':
    'En tur från wanderer har en pil bredvid sin källa, Öppna i wanderer, och Kontrollera källan i sektionens rubrik. Kontrollen frågar wanderer om leden har ändrats sedan importen. Importera som ny ögonblicksbild importerar sedan den nya versionen som en egen tur. Den här turen behåller sina dagar och anteckningar.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Medan Lägg till punkt är på (Sätt punkter i kartans piller) sätter ett klick på kartan en punkt. Dra en nål för att flytta den, klicka på den ritade rutten för att lägga till en formpunkt där, och välj en plats från resan med Resans platser.',
  'help.guide.tour-open-workspace.step.4':
    'Plusset överst i högra skenan, Lägg till tur, erbjuder Importera GPX eller KML, Importera promenad från Google Maps och Hämta en tur från en annan resa. Medan en tur är öppen finns även Planera ny tur där.',
  'help.guide.tour-draw-route.title': 'Rita en ny tur',
  'help.guide.tour-draw-route.tip.1':
    'Medan Sätt punkter är på är pekaren ett hårkors. Slå av det för att dra kartan utan att lägga till punkter. I 3D är det av från början, eftersom du drar i kartan för att se dig omkring i 3D.',
  'help.guide.tour-type-profile.step.2':
    'Välj typ i listan: Vandring, Stadspromenad / sightseeing, Löptur, Cykeltur, Paddeltur, Ridtur eller Skidor och vinter. Varje typ visar vad den planerar, och en ny typ planerar rutten på nytt.',
  'help.guide.tour-edit-points.step.1':
    'Dra en numrerad nål på kartan till den plats där punkten ska ligga. Rutten planeras om via den nya platsen.',
  'help.guide.tour-edit-points.result':
    'Punkterna ligger där du vill ha dem och i den ordning du vill ha dem, och rutten har planerats om.',
  'help.guide.tour-shaping-points.tip.2': 'En formpunkt kan inte avsluta en etapp på en flerdagarstur.',
  'help.guide.tour-loop-reverse.tip.1':
    'När turen redan är en slinga står det Turen går redan tillbaka till start vid Tillbaka till start.',
  'help.guide.tour-leg-by-hand.step.3':
    'Om du vill att ruttplaneraren ska planera sträckan igen öppnar du samma meny och väljer Rutta nästa sträcka igen.',
  'help.guide.tour-trip-places.step.2':
    'Sök bland resans platser, eller titta under Nära turen: platser inom två kilometer från rutten, de närmaste först, var och en med sitt avstånd.',
  'help.guide.tour-details-times.goal':
    'Ge turen ett namn, en beskrivning och en länk, och lägg till pauser i dess tid.',
  'help.guide.tour-details-times.result': 'Turen har nu sitt namn, sina anteckningar och den tid du planerar för den.',
  'help.guide.tour-save.tip.2':
    'Tillbaka till turer överst i skenan stänger redigeraren, och frågar först om det finns osparade ändringar.',
  'help.guide.tour-edit-saved.step.4':
    'Klicka på Tillbaka till turer för att stänga den. Finns det osparade ändringar frågar TREK först Kasta osparade ändringar i turen?.',
  'help.guide.tour-summary-profile.step.2': 'Infopricken bredvid den beräknade tiden förklarar hur den räknas ut.',
  'help.guide.tour-list-manage.goal':
    'Se summorna för resans turer, lägg en tur på en dag och begränsa listan till det du behöver.',
  'help.guide.tour-list-manage.tip.3':
    'Papperskorgen på en rad raderar turen. Fliken Planering listar samma turer när dess högra kolumn är växlad till Turer.',
  'help.guide.tour-delete.tip.3':
    'En tur raderas här, på fliken Turer. Papperskorgen finns bara för resenärer som får redigera resans platser.',
  'help.guide.tour-saved-elsewhere.tip.1':
    'Spara som ny tur döper din kopia efter turen, med (min version) efter namnet.',
  'help.ctx.trip-tour-import.bullet.4':
    'Redigerbar version gör en import till en tur med vägpunkter som du kan flytta. Ersätt importen behåller det inspelade spåret, och kortet Inspelat spår i redigeraren tar dig tillbaka till det.',
  'help.guide.tour-import-gpx.step.5': 'Klicka på Importera 1 tur (eller Importera 3 turer för en fil med tre spår).',
  'help.guide.tour-view-import.goal': 'Se en importerad turs sträckning, mått och höjd precis som de kom in.',
  'help.guide.tour-plan-from-import.title': 'Planera en redigerbar tur från en import',
  'help.guide.tour-plan-from-import.tip.3':
    'En paddel- eller skidimport förbinds med raka linjer mellan sina punkter i stället för att ruttplaneras.',
  'help.guide.tour-restore-recorded.tip.1':
    'Kortet visas bara för en tur som har ersatts med Ersätt importen och sedan sparats.',
  'help.guide.tour-take-over.step.4':
    'Klicka på turen. Till höger visas dess linje, dess mått och resan den kommer från.',
  'help.guide.tour-import-wanderer.goal': 'Importera en av lederna i din egen wanderer till resan som en tur.',
  'help.guide.tour-import-wanderer.tip.4': 'Öppna i wanderer öppnar leden på din instans.',
  'help.ctx.trip-tour-map.bullet.5':
    'I 3D visas rutten på terrängen, färgad efter hur brant den är, med en teckenförklaring som summerar dess lutningsgrader och en överflygning som följer rutten från start till slut.',
  'help.guide.tour-map-layers.tip.2':
    'Vandring och Cykel kommer från frivilligdrivna servrar och finns bara när din admin tillåter dem. När en server slutar svara visar dess segment ett ! och du kan byta till en annan karta. Din tur ändras inte.',
  'help.guide.tour-along-search.step.5':
    'Platserna som hittas listas med avstånd från rutten och ritas på kartan i sin färg. En stjärna markerar de mest kända, och I turen markerar de som redan är ett stopp. Knappen visar nu Sök igen.',
  'help.guide.tour-along-add-stop.step.2':
    'Var den hamnar föreslår den sträcka där platsen passar bäst. Klicka på den för att välja mellan vilka två stopp platsen i stället ska hamna, eller Som nytt mål. Kartan visar den nya rutten som en streckad linje innan något ändras.',
  'help.guide.tour-3d-terrain.goal': 'Titta på turen i det verkliga landskapet, färgad efter hur brant den är.',
  'help.guide.tour-3d-terrain.tip.2':
    'Kartan du valde används också i 3D, liksom via ferrata-lederna, pisterna och sjömärkena. När du redigerar en tur kan du dra dess punkter på terrängen, och med Sätt punkter på lägger ett klick till en punkt.',
  'help.guide.tour-3d-flyover.result': 'Du har sett turen från luften, från start till slut, i den fart du valde.',
  'help.guide.tour-map-overlays.step.3':
    'Förklaringen visar vad färgerna betyder: utförspisterna från Nybörjare till Friåkning, Längdspår, Vinter- och snöskoleder, Kälkbackar samt Liftar och linbanor. Hela förklaringen på OpenSnowMap öppnar varje symbol. Tryck på Escape för att stänga den.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Dagar i redigeraren gör den öppna turen till en Dagstur eller en Flerdagarstur. När du byter tillbaka till en dagstur tas alla etappslut bort efter en bekräftelse, och rutten ändras inte.',
  'help.guide.tour-multi-day.step.2':
    'Klicka på Flerdagarstur under Dagar. En notering visar var det första etappslutet placeras.',
  'help.guide.tour-multi-day.tip.4':
    'Etapperna sparas när du klickar på Spara. Om en ändring tar bort en etapp som ligger på en dag i resan visas ett meddelande om att sparandet tar bort den från den dagen.',
  'help.guide.tour-stages-on-days.step.5':
    'Varje etapp visar dagen den ligger på. Klicka på dagen för att flytta etappen till en annan dag, eller välj Ingen dag för att ta bort den från dagen.',
  'help.ctx.trip-tour-hike.summary':
    'En vandring eller en löptur öppen på fliken Turer: redigeraren till vänster, kartan i mitten, turens översikt och resans andra turer till höger. En vandring håller sig till den ledsvårighet du tillåter, en löptur tidsätts efter ditt eget tempo, och båda visar vad OpenStreetMap har registrerat längs vägen.',
  'help.guide.tour-hike-plan.goal':
    'Starta en vandring, lägg till dess stopp, välj den svåraste ledgrad som rutten får använda och spara den.',
  'help.guide.tour-hike-plan.tip.1':
    'En ny vandring börjar på T2 (Bergsvandring). T3 lägger till en varning om att sådana stigar kan vara exponerade och kräver trygg fotföring och att man inte är höjdrädd.',
  'help.guide.tour-hike-trail-details.step.3':
    'Märkena summerar det: hur stor del av rutten som är Känt, den Högsta kända graden och, separat, den Ruttgräns som vandringen planerades med.',
  'help.guide.tour-hike-round.goal':
    'Låt TREK föreslå slingor av den längd du vill ha, med start från ett stopp på en vandring.',
  'help.guide.tour-hike-round.tip.2': 'Avstånd från 1 till 60 km godtas, och slingor inom 20 % av din längd erbjuds.',
  'help.guide.tour-hike-compare-ways.result':
    'Just den sträckan följer vägen du valde och resten av vandringen ändras inte. Vägen vald längst ned på kartan har Ångra.',
  'help.guide.tour-ferrata-add.step.3':
    'Klicka på Lägg till i turen. Via ferratan läggs till i slutet av rutten som en egen sträcka, med en punkt i varje ände.',
  'help.guide.tour-run-plan.title': 'Planera en löptur i ditt eget tempo',
  'help.guide.tour-run-plan.tip.1': 'Utan tempo kan löpturen inte sparas.',
  'help.guide.tour-run-ways.step.3':
    'Klicka på Underlag och sedan på ett underlag i listan för att bara rita de sträckorna på kartan.',
  'help.ctx.trip-tour-walk.bullet.3':
    'När promenaden ligger på en dag med en starttid visar Tider för överst i Vägpunkter den dagen, och varje stopp visar sin ankomst, sin vistelse och vad öppettiderna säger.',
  'help.guide.tour-walk-plan.step.4':
    'Ge stoppet en Etikett och en Vistelse i minuter. Lämna vistelsen tom så länge du inte vet hur länge du stannar, och ange 0 för en punkt du bara passerar.',
  'help.guide.tour-walk-sights.goal': 'Välj ett tema, sök längs promenaden och lägg till en plats som stopp.',
  'help.guide.tour-walk-sights.tip.3':
    'Öppettider och hemsidor kommer från källan, oftast OpenStreetMap. Kontrollera dem innan du ger dig av.',
  'help.guide.tour-walk-day-times.tip.1':
    'Utan starttid står det så på raden: Ge promenaden en tid den här dagen för att se ankomster och öppettider.',
  'help.guide.tour-walk-google-import.step.2': 'Klistra in länken under Länk till gångrutten och klicka på Läs länken.',
  'help.guide.tour-walk-check-off.goal':
    'Markera stopp som besökta eller överhoppade under dagen och se hur mycket gång som är kvar.',
  'help.guide.tour-walk-check-off.result':
    'Besökta stopp är avbockade, överhoppade är överstrukna, och återstående tid räknar bara det som ligger framför dig.',
  'help.guide.tour-bike-profile.goal':
    'Starta en cykeltur och låt TREK ruttplanera den för touring, landsväg, grus eller MTB.',
  'help.guide.tour-bike-profile.tip.1': 'Om du ändrar profilen senare planeras hela rutten om för den nya profilen.',
  'help.guide.tour-bike-surfaces.step.2':
    'Märket i kortets rubrik visar hur stor del av rutten som är känd för att vara obelagd.',
  'help.guide.tour-bike-mtb-grades.title': 'Kontrollera ledgraderna för en mountainbiketur',
  'help.guide.tour-bike-mtb-grades.tip.3': 'Om graderna inte kunde läsas står det på kortet. Klicka på Försök igen.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Medan en Skidor och vinter-tur är öppen visar kartan pisterna från OpenSnowMap, med Pistförklaring bredvid reglaget. Allt är kartlagda data: inget här säger om en pist eller en lift är öppen, hur snön är eller något om laviner.',
  'help.guide.tour-ski-plan.step.6': 'Ge turen ett namn under Turens namn och klicka på Spara.',
  'help.guide.tour-ski-options.step.1':
    'I en Skidor och vinter-tur finns ruttplanerarens alternativ under Gren. Du ser bara dem som din gren använder: Längdskidor har till exempel inga Svåraste backar.',
  'help.guide.tour-ski-options.result':
    'Turen planeras om inom dina gränser, och kortet Pistrutt listar de svårare pisterna som planeraren undvek.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Offline ritas sträckorna tills vidare som raka linjer. En grå rad om sommarstigar är en notering, inget fel.',
  'help.guide.tour-ski-summary.tip.1':
    'Undvek listar de svårare pisterna som ruttplaneraren undvek på grund av din gräns för Svåraste backar.',
  'help.guide.tour-ski-pistes-layer.step.2':
    'Klicka på Pistförklaring, knappen med fyra färgade prickar bredvid reglaget.',
  'help.guide.tour-ski-import.step.1':
    'Klicka på Lägg till tur (plusset ovanför Turer för den här resan) på fliken Turer, välj Importera GPX eller KML och välj filen.',
  'help.guide.tour-ski-import.tip.3':
    'Du kan också släppa GPX-, KML- eller KMZ-filer var som helst på fliken Turer för att öppna samma förhandsvisning.',
  'help.ctx.trip-tour-paddle.bullet.5':
    'Vind visar prognosen vid turens start för dagen den är planerad på. Checklista listar hindren på den sparade rutten och vad du har bestämt för vart och ett.',
  'help.guide.tour-paddle-setup.step.5':
    'På en sjö styr Över sjöar rutten: Rakt över är kortast, och Nära stranden håller sig nära stranden för blåsiga dagar.',
  'help.guide.tour-paddle-water-route.title': 'Planera sträckorna på vattnet',
  'help.guide.tour-paddle-water-route.tip.2':
    'Där rutten bär båten runt en damm eller går genom en sluss sätter TREK en egen punkt, märkt Hittad. Om du flyttar eller ändrar den blir den din egen punkt.',
  'help.guide.tour-paddle-portage.step.3':
    'Ett kort Lyft visas under punkten med sin längd och de extra minuterna. Klicka på det för att öppna det.',
  'help.guide.tour-paddle-lock.goal': 'Lägg en sluss på turen och räkna med väntan och passagen i tiden.',
  'help.guide.tour-paddle-lock.result':
    'Slussen ligger på turen med sina minuter, och Tidsuppskattning lägger ihop dem.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK utgår från 4 km/h på vattnet, 2 km/h vid bärning och 10 minuter vid varje lyft. Det är startvärden som du kan justera, inga mätningar.',
  'help.guide.tour-paddle-wind.step.3':
    'Staplarna visar dagens timmar, med byarna bakom medelvinden. Håll pekaren över en stapel för den timmens värden och riktning.',
  'help.guide.tour-paddle-checklist.goal':
    'Se vad som är känt om dammar, slussar och tillträdesregler på en sparad rutt och bestäm vad du gör vid var och en.',
  'help.guide.tour-paddle-checklist.tip.3':
    'En post märkt Kontrollera igen avgjordes innan rutten eller datan ändrades. Avgör den igen, eller välj Behåll beslutet eller Ta bort beslutet. Beslut som inte längre gäller listas under Tidigare beslut.',
  'help.guide.tour-paddle-track-marks.step.3': 'Klicka på Importera 1 tur.',
  'help.guide.tour-paddle-track-marks.result':
    'Det inspelade spåret innehåller sina lyft och slussar, och dess Tidsuppskattning räknar med dem.',
  'help.guide.tour-horse-plan.title': 'Planera en ritt längs hästrutter',
  'help.guide.tour-horse-plan.step.7':
    'Ge ridturen ett namn under Turens namn och klicka sedan på Spara längst ned i vänstra kolumnen.',
  'help.guide.tour-horse-gap.goal': 'Fortsätt med en sträcka som börjar en bit från slutet av din ridtur.',
  'help.guide.tour-horse-gap.tip.3':
    'En sträcka som börjar inom 25 m från slutet av din ridtur fortsätter direkt därifrån, och Anslutning till din ridtur visar Ansluter till slutet av din ridtur.',
  'help.guide.tour-horse-recorded.tip.1':
    'Linjen förblir exakt som filen spelade in den. Inget ruttplaneras om, och en inspelad ridtur har ingen redigerbar version.',
  'help.guide.dateless-trip.result':
    'Kortet visar Idé och Tillgängliga datum, och resan har lika många tomma dagar som du angav.',
  'help.guide.trip-reminder.title': 'Få en påminnelse inför en resa',
  'help.guide.upcoming-reservations.tip.1':
    'En hotellvistelse visas två gånger, en gång för incheckning och en gång för utcheckning.',
  'help.guide.half-company-holiday.result':
    'Företaget har en halv dag ledigt, och en semesterdag som loggas på den räknas bara som en halv dag.',
  'help.guide.edit-holiday-calendar.title': 'Ändra eller ta bort en helgkalender',
  'help.guide.answer-fusion-request.result':
    'Efter Godkänn & Slå samman visas båda planerna i ett rutnät, var och en i sin egen färg.',
  'help.guide.log-for-partner.result':
    'Dagarna visas i den andra personens färg och räknas mot dennes rättighet, inte din.',
  'help.guide.dissolve-fusion.tip.1':
    'Avbryt i det fönstret lämnar planen som den är. Dina poster behålls i båda fallen.',
  'help.guide.country-places.tip.1':
    'En plats under fel land har oftast en felaktig adress eller felaktiga koordinater. Öppna dess resa härifrån och rätta platsen där.',
  'help.guide.tour-activity-stats.title': 'Se vad du gjorde på dina turer',
  'help.guide.tour-activity-stats.result':
    'Summorna i dialogen och på fliken Turer inkluderar inte längre turen du utelämnade. Dess rutt, dess dagar och resan ändras inte.',
  'help.guide.move-to-list.tip.2':
    'Att flytta tar bort platserna från listan, så bara listans ägare eller en admin ser Flytta till lista. Duplicera till lista fungerar från alla listor du kan öppna.',
  'help.guide.accept-list-invite.step.2':
    'Klicka på Acceptera för att gå med, eller på Avböj för att tacka nej till inbjudan.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Om en tur sparades utan linje måste dess vägpunkter läggas till med den. Dialogen berättar det och väljer det alternativet åt dig.',
  'help.guide.tour-collection-manage.tip.1':
    'Att ta bort en tur från listan påverkar inte de turer som redan har skapats från den i dina resor.',
  'help.guide.entry-draft.tip.2':
    'När du tar över en dag från Dawarich blir dess inlägg utkast. Leta efter märket innan du delar.',
  'help.guide.journey-map-layers.result':
    'Kartan visar bara de lager du vill ha, och varje nål, prick och linje kan läsas i teckenförklaringen.',
  'help.guide.journey-keep-route.result':
    'Dagrubriken visar avståndet, och rutten ritas heldragen i kartans lager Inspelat för alla i Journey. En delad länk visar den bara när Inspelade rutter är på.',
  'help.guide.journey-day-stays.result':
    'Vistelserna du har tagit ställning till försvinner från raden. Inläggen du skrev ligger på sin dag som alla andra inlägg, och du kan lägga till foton och text som vanligt.',
  'help.guide.journey-take-over-day.tip.2':
    'Utkast visas inte på delade länkar. Lägg till foton och text och slå sedan av Utkast i varje inlägg.',
  'help.guide.journey-auto-prepare.tip.2':
    'En prick på en dags listknapp betyder att dagen inte är slutgiltig än. Verktygstipset säger varför.',
  'help.ctx.settings-plugins.bullet.3':
    'Plugin-aktivitet längst ned listar varje åtgärd som ett plugin har utfört i ditt namn, de nyaste först, med Uppdatera.',
  'help.guide.language-region.tip.3':
    'Vecka börjar på styr den första kolumnen i varje datumväljare. Vacay har en egen inställning.',
  'help.guide.web-push-device.tip.2':
    'På iPhone och iPad lägger du först till TREK på hemskärmen och öppnar det därifrån.',
  'help.guide.connect-airtrail.step.3':
    'Klicka på Spara och sedan på Testa anslutningen. Du får veta hur många flygningar som hittades, och märket ändras till Ansluten.',
  'help.guide.connect-dawarich.step.3':
    'Klicka på Spara och sedan på Testa anslutningen: den räknar vistelserna de senaste 30 dagarna. När Dawarich är anslutet kontrollerar Leta nu direkt, och Koppla från till höger avslutar anslutningen.',
  'help.guide.tour-connect-wanderer.step.3':
    'Klicka på Spara och sedan på Testa anslutningen. Du får veta hur många av dina leder du kan importera, och märket ändras till Ansluten.',
  'help.guide.tour-wanderer-watch.step.2':
    'Högst en gång om dagen läser TREK den korta historiken för varje led du har importerat, och raden visar när den senast kontrollerades. När en led kan ha ändrats får du ett meddelande och Tips räknar den. Klicka på Tips för att se varje tur som Kan ha ändrats, Ändrad eller Kan inte kontrolleras, och öppna den därifrån.',
  'help.guide.plugin-settings.goal':
    'Ge ett plugin dina egna nycklar och inställningar, och se vad det har gjort i ditt namn.',
  'help.guide.own-routing-engine.result': 'Rutter i alla resor beräknas på dina egna servrar.',
  'help.guide.admin-passkeys.title': 'Erbjud inloggning med inloggningsnyckel',
  'help.guide.rotate-jwt-secret.tip.1': 'Du loggas också ut, så logga in igen direkt efteråt.',
  'help.guide.notification-defaults.title': 'Ställ in standardvärden för användarnas meddelanden',
  'help.ctx.notifications.title': 'Meddelanden',
  'help.guide.read-notifications.goal': 'Se vad som har hänt på dina resor medan du var borta, och gå direkt dit.',
  'help.guide.filter-notifications.goal': 'Gå igenom alla dina meddelanden, eller bara de du inte har läst än.',
  'help.guide.mark-notifications-read.step.1':
    'Klicka på Markera som läst, dubbelbocken bredvid ett meddelandes tid, för att markera bara det meddelandet.',
  'help.guide.delete-notifications.step.2':
    'Ta bort alla högst upp tömmer hela listan på en gång, efter att ett fönster har bett dig bekräfta.',
  'help.guide.notification-settings.step.3':
    'Klicka på Meddelanden i sidofältet Inställningar. Det första kortet har en rad för varje händelse, och kolumnen I-App avgör vad klockan visar.',
  'help.guide.link-journal.result':
    'En flik Dagbok visas i resans flikrad. Alla du gav Läsa eller Redigera kan öppna dagboken på den fliken, med liveuppdateringar.',
  'help.guide.create-place.tip.4':
    'En länk som kopierats från Google Maps fungerar också i sökningen: klistra in den, tryck på Enter, så läser TREK platsen från länken. När formuläret har en position listar Platser nära den här nålen, hårkorset bredvid sökningen, vad som finns runt den.',
  'help.guide.dawarich-stays.step.2':
    'Vistelserna är grupperade per dag, var och en med när du kom och när du åkte. En mätarikon markerar en vistelse som Dawarich var osäker på. Klicka på Lägg till som plats, nålen bredvid en vistelse.',
  'help.guide.leave-stop-off-route.step.3':
    'Om du vill ta med stoppet i rutten igen öppnar du samma meny och väljer Lägg tillbaka i rutten.',
  'help.guide.move-booking-day.tip.1':
    'De bleka raderna på dagarna mellan start och slut på en flerdagarsbokning går inte att dra, och inte heller en enskild sträcka av ett flyg med mellanlandningar.',
  'help.guide.place-image-from-file.step.2':
    'Klicka på den runda bilden i rubriken. Eftersom platsen har foton frågar ett litet fönster varifrån bilden ska komma.',
  'help.guide.place-own-hours.goal':
    'Lägg in de tider du själv har kontrollerat på kortet, när de som slagits upp är fel eller saknas.',
  'help.guide.place-own-hours.tip.2':
    'Telefonnumret och e-postadressen visas som piller i kortets rubrik. Klicka på ett för att öppna det i din telefon- eller e-postapp.',
  'help.guide.edit-accommodation.tip.3':
    'Med Blurra bokningskoder på i Inställningar, under Visning, förblir bekräftelsenumret blurrat. Håll pekaren över det eller klicka på det för att läsa det.',
  'help.guide.confirm-stay-booking.tip.1': 'Klicka på pillret igen så är bokningen tillbaka på Väntande.',
  'help.guide.map-markers.tip.4':
    'Med Kompakta markörer för oplanerade platser på, i Inställningar > Visning under Resor och karta, visas platser som ännu inte ligger på någon dag som små prickar utan foto och betyg. Platsen du väljer ritas alltid fullt ut.',
  'help.guide.tour-map-lines.step.1':
    'Varje tur på resan ritas på kartan som en linje i sin färg, med en nål där den startar. Om du har valt en färg för turen används den. Annars används kategorins färg.',
  'help.guide.car-stops.step.6': 'Klicka på Lägg till.',
  'help.guide.transport-details.step.4':
    'Klicka på titeln för att byta namn på färden utan att öppna formuläret. Byt namn öppnas med namnet ifyllt: skriv det nya och klicka på Spara.',
  'help.guide.export-transports-csv.goal':
    'Exportera resans färder från TREK som en CSV-fil, för ett kalkylblad, en researrangör eller en utskrift.',
  'help.guide.group-sort-bookings.result':
    'Bokningarna visas i de sektioner och den ordning du valde, och den här webbläsaren kommer ihåg valet till nästa besök.',
  'help.guide.booking-on-map.step.1':
    'Klicka på kortet för en bokning som har en plats, länkad under Plats / Aktivitet eller, för en vistelse, under Boende. Dess detaljer öppnas.',
  'help.guide.export-bookings-csv.title': 'Exportera bokningarna som kalkylblad',
  'help.guide.export-bookings-csv.tip.3':
    'Knappen finns så snart fliken har en bokning. Fliken Transporter exporterar sina egna poster på samma sätt.',
  'help.guide.arrange-packing-list.title': 'Ordna packlistan som du vill ha den',
  'help.guide.count-packed-pieces.result':
    'Raden visar hur många av styckena som är packade, och föremålet bockas av när det sista stycket är packat.',
  'help.guide.expense-receipts.title': 'Bifoga ett kvitto till en utgift',
  'help.guide.expense-receipts.tip.1':
    'I redigeraren öppnar ett klick på en listad fils namn samma förhandsvisning. Esc stänger då bara förhandsvisningen, inte utgiften.',
  'help.guide.files-sync-settings.step.5':
    'När båda sidor ändrats avgör vilken kopia som behålls när ett dokument har redigerats på båda ställena: Fråga mig, Behåll TREK-kopian eller Behåll lagrets kopia. Synkronisera automatiskt låter TREK leta efter ändringar i bakgrunden. När det är av står det Pausad på kortet, och bara Synkronisera nu kör en synkronisering. Varje ändring här sparas direkt.',
  'help.guide.manage-notes.step.5':
    'Radera frågar först, Radera notering?, eftersom noteringen raderas för alla medlemmar, tillsammans med sina filer. Klicka på Radera för att bekräfta.',
  'help.guide.note-categories.step.3':
    'Klicka på en kategoris namn för att byta namn på den. Skriv det nya namnet och tryck på Enter. Med Esc behåller du det gamla.',
  'help.guide.roadtrip-reorder.step.2':
    'Om du vill flytta ett stopp till en annan dag släpper du det på ett stopp i den dagens kort. Medan du drar visas en dag med färre än två stopp som ett streckat kort i slutet av skenan, och du kan släppa på det också.',
  'help.guide.roadtrip-corridor.tip.4':
    'Under filtret väljer du ett stopp på dagen, eller Halvvägs mellan två, för att bara behålla det som ligger inom 25, 50 eller 100 km från den punkten. Finns det laddare i listan begränsar Alla kontakter och Alla effekter dem efter uttag och effekt.',
  'help.guide.roadtrip-overnight.result':
    'Platsen visas på körningen som dagens övernattning, och vistelsen är bokad i resan som vilken annan vistelse som helst.',
  'help.guide.roadtrip-stop-fill.result':
    'Vid det här stoppet fylls tanken till det värde du valde. Räckvidden efter stoppet, inklusive ett eventuellt band Här tar tanken slut, räknas ut från det.',
  'help.guide.roadtrip-bookings.step.4': 'Klicka på kortet för att öppna bokningen.',
  'help.guide.roadtrip-google-import.goal':
    'Gör om en rutt du har planerat i Google Maps till stopp på en av dina dagar.',
  'help.guide.roadtrip-google-import.tip.3':
    'Importen kräver en anslutning och behörighet att redigera både platser och dagar.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD täcker Tyskland, och GDACS rapporterar katastrofer över hela världen. En varning som bara anges som en punkt säger att det berörda området är okänt.',
  'help.ctx.trip-tours.bullet.5':
    'I dagkolumnen är en tur en rad som liknar ett stopp. Med en Start står det start → slut, där sluttiden räknas ut från turens tid, och Fler alternativ innehåller Redigera, Ta bort från dagen, Uteslut från rutten och Spara i samling.',
  'help.guide.tour-show-list.step.5': 'Klicka på Platser i samma reglage för att få tillbaka platslistan.',
  'help.guide.tour-add-to-day.step.2':
    'Välj dagen. Menyn listar varje dag på resan med datum och titel. En dag som redan har turen är gråad.',
  'help.guide.tour-add-to-day.result': 'Turen listas under sin dag, och dess linje ingår i den dagen på kartan.',
  'help.guide.tour-day-times.tip.2':
    'En dag med en etapp av en flerdagarstur får ingen uträknad sluttid, eftersom turens tid är tiden för hela rutten.',
  'help.guide.tour-remove-from-day.step.3':
    'Eller klicka på dagens rubrik för att öppna dagen, klicka på turen i listan och klicka på Ta bort från dag längst ned på dess kort.',
  'help.guide.tour-filter-list.step.3':
    'Där listan blandar olika värden begränsar Källa (TREK, GPX-import, wanderer), Ruttgräns (T1 till T6) och Typ (Vandring, Cykeltur och så vidare) den ytterligare. Klicka på ett markerat värde igen för att rensa det.',
  'help.guide.tour-hide-on-map.step.1':
    'Peka på en tur i listan och klicka på ögat som visas till höger på dess rad (Dölj på kartan).',
  'help.guide.tour-import-plan-tab.step.1':
    'Klicka på Turer i reglaget högst upp i högra kolumnen på fliken Planering.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Klicka på en tur i listan Turer (växla först högra kolumnen från Platser till Turer), på dess rad inne i en dag eller på dess linje på kartan, så öppnas turens kort över kartan. Kartan går att använda medan kortet är öppet.',
  'help.guide.tour-detail-read.step.2':
    'Rubriken visar turens namn och en sammanfattning i piller: vilken sorts tur det är, varifrån den kommer om den är importerad, den planerade tiden, sträckan, stigningen och nedstigningen.',
  'help.guide.tour-detail-read.tip.3':
    'Vissa turer visar mer: en stadspromenad sina stationer, en paddeltur sina kontroller och vinden, en tur som redan är genomförd sitt Faktiskt spår, och en tur som är kopplad till en lista sin Packlista.',
  'help.guide.tour-rename-colour.step.3':
    'Klicka på den färgade pricken i hörnet av turens runda ruta, Spårfärg. Avsnittet Spårfärg öppnas under rubriken.',
  'help.guide.tour-take-along.step.2':
    'Om turen har en webbsida visar knappen bredvid sajtens namn (Komoot, AllTrails, Outdooractive eller Wanderer), eller Hemsida för alla andra. Knappen öppnar sidan i en ny flik.',
  'help.guide.tour-copy-keep.goal':
    'Gör en variant av en tur i den här resan, eller spara den för senare resor i en av dina samlingar.',
  'help.guide.tour-copy-keep.tip.4':
    'Samling finns bara när tillägget Samlingar är på. En lista du bara får läsa kan inte väljas, och om du inte har någon lista än erbjuder dialogen Öppna samlingar.',
  'help.guide.tour-packing-link.step.5':
    'Klicka på Öppna packlistan för att bocka av saker. TREK växlar till fliken Listor, på packlistan.',
  'help.guide.tour-files.step.2': 'Raden under räknar nu filerna, och listan öppnas.',
  'help.guide.tour-activity-link.step.2':
    'Markera dagen du gjorde turen under Genomförd. Välj Ingen dag om den inte hör till någon dag.',
  'help.guide.tour-activity-compare.title': 'Jämför planen med vad du gjorde',
  'help.guide.tour-activity-compare.result':
    'Du ser snabbt hur dagen gick jämfört med planen, på kortet och på kartan.',
  'help.guide.tour-origin-check.tip.3':
    'Ingen wanderer-anslutning betyder att ditt konto inte är anslutet än. Anslut det i Inställningar, under Integrationer.',
  'help.ctx.trip-tour-planner.bullet.5':
    'Sök plats eller adress högst upp på kartan flyttar kartan. Pillret längst ned till vänster växlar mellan de kartor som turens typ erbjuder, till exempel Topo eller Satellit, och innehåller den öppna turens reglage, till exempel Sätt punkter och 3D.',
  'help.guide.tour-open-workspace.step.5':
    'Sök plats eller adress högst upp på kartan flyttar kartan till en plats, så att du kan börja där turen ska gå.',
  'help.guide.tour-draw-route.goal': 'Sätt punkterna för en ny tur på kartan och låt TREK räkna ut rutten mellan dem.',
  'help.guide.tour-draw-route.tip.2':
    'Topo eller Vandring i kartans piller visar stigarna, vilket gör det lättare att klicka på en. En punkt som ligger för långt från alla vägar som typen kan använda får ett meddelande i stället för en rutt.',
  'help.guide.tour-type-profile.step.3':
    'En cykeltur frågar efter sin Profil under typen: Tur, Landsväg, Grus eller MTB. Raden under visar vad profilen föredrar.',
  'help.guide.tour-edit-points.step.2':
    'Klicka på en rad under Vägpunkter för att markera dess punkt. Punktens nål markeras på kartan.',
  'help.guide.tour-shaping-points.title': 'Styr rutten med en formpunkt',
  'help.guide.tour-shaping-points.tip.3':
    'På en ridtur lägger ett klick på linjen inte till något, eftersom ingen ruttplanerare formar den.',
  'help.guide.tour-loop-reverse.tip.2':
    'Ta bort raden Tillbaka till start för att göra turen enkelriktad igen. En sträcka som är ritad för hand förblir ritad för hand när turen vänds.',
  'help.guide.tour-leg-by-hand.step.4':
    'Beräkna nästa etapp igen frågar ruttplaneraren en gång till om just den sträckan, utan att röra de andra.',
  'help.guide.tour-trip-places.step.3':
    'Klicka på en plats. Den läggs till som turens nya slutpunkt, och listan förblir öppen för nästa plats.',
  'help.guide.tour-details-times.step.1':
    'Turens namn högst upp i vänstra skenan innehåller namnet. På en ny tur är den grå texten där, till exempel Vandring utan namn, bara en platshållare: skriv ditt eget namn.',
  'help.guide.tour-save.title': 'Spara en tur',
  'help.guide.tour-save.tip.3':
    'Spara fungerar inte heller så länge ett fält har ett ogiltigt värde, till exempel en hemsida som inte är en adress. Detaljer öppnas automatiskt för att visa det.',
  'help.guide.tour-edit-saved.tip.1': 'Spara förblir gråat på en tur du inte har ändrat.',
  'help.guide.tour-summary-profile.step.3':
    'För pekaren längs Höjdprofil. Den visar avståndet och höjden vid den punkten, och en prick markerar samma plats på kartan.',
  'help.guide.tour-list-manage.step.1':
    'Resans omfattning ligger ovanför listan. Hopfälld visar den antalet turer och hur många som är Planerat och Oplanerat. Pilen till höger öppnar en rad per typ med sträcka, stigning, nedstigning och tider hopräknade.',
  'help.guide.tour-list-manage.result':
    'Du ser summorna för de turer som filtret visar, och varje tur ligger på den dag du vill.',
  'help.guide.tour-delete.result': 'Turen är borta från listan, kartan och alla dagar.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Samma sak händer om du ändrade turen på en annan enhet. En tur du inte har ändrat laddas helt enkelt om, och en notering säger det.',
  'help.ctx.trip-tour-import.bullet.5':
    'När wanderer är anslutet under Inställningar, Integrationer, visas en knapp wanderer bredvid Planera ny tur så länge ingen tur är öppen. Den listar dina egna leder som du kan importera.',
  'help.guide.tour-import-gpx.tip.1':
    'Du kan också dra filerna från datorn till fliken Turer och släppa dem där. Då öppnas samma förhandsvisning.',
  'help.guide.tour-view-import.step.1':
    'Klicka på fliken Turer och sedan på en tur med märket GPX-import i Turer för den här resan.',
  'help.guide.tour-plan-from-import.goal':
    'Skapa vägpunkter som du kan flytta utifrån ett inspelat spår, och se hur nära den nya rutten håller sig spåret.',
  'help.guide.tour-plan-from-import.tip.4': 'En Ridtur har ingen redigerbar version: den behålls som den red.',
  'help.guide.tour-restore-recorded.tip.2':
    'En tur som skapats med Planera som ny tur har inget eget inspelat spår. Importen den kom från finns kvar i listan.',
  'help.guide.tour-take-over.step.5': 'Ge den ett annat namn under Namn i den här resan om du vill.',
  'help.guide.tour-import-wanderer.step.1':
    'Klicka på wanderer bredvid Planera ny tur på fliken Turer, när ingen tur är öppen.',
  'help.guide.tour-import-wanderer.result': 'Leden är en tur på resan och öppnas på kartan som en wanderer-tur.',
  'help.guide.tour-map-layers.title': 'Välj karta för en tur',
  'help.guide.tour-map-layers.tip.3':
    'En paddeltur och en stadspromenad erbjuder bara Karta och Satellit. En löptur, en skidtur och en ridtur erbjuder Karta, Topo och Satellit.',
  'help.guide.tour-along-search.result': 'Platserna längs rutten finns i listan och på kartan, redo att granskas.',
  'help.guide.tour-along-add-stop.step.3':
    'Klicka på Lägg till som stopp. Märket bredvid är en grov uppskattning av omvägen, mätt i rak linje.',
  'help.guide.tour-3d-terrain.step.1':
    'Öppna en tur på fliken Turer och klicka på 3D i slutet av pillret längst ned till vänster. Kartan lutas och visar terrängen i 3D, med rutten utritad på den.',
  'help.guide.tour-3d-terrain.tip.3':
    'Landskapet kräver en anslutning: höjderna kommer från de öppna Mapzen-terrängrutorna. En paddeltur ritas i sin egen färg utan lutningsgrader, eftersom vatten är plant.',
  'help.guide.tour-3d-flyover.tip.1':
    'Rulla med mushjulet under överflygningen för att zooma in eller ut. Kameran stannar på pricken. Du kan inte dra kartan förrän du pausar.',
  'help.guide.tour-map-overlays.step.4':
    'På en paddeltur erbjuder pillret Sjömärken i stället. Klicka på det för att visa bojar, fyrar och hamnmärken på vattnet.',
  'help.ctx.trip-tour-stages.bullet.2':
    'Avsluta etappen här i ett stopps meny Fler åtgärder avslutar en etapp vid det stoppet. Vägpunkter visar sedan en rubrik Etapp N för varje etapp med dess avstånd och tid, och stoppet som avslutar en etapp har en månikon.',
  'help.guide.tour-multi-day.step.3':
    'Peka på stoppet där den första dagen slutar, klicka på Fler åtgärder och välj Avsluta etappen här.',
  'help.guide.tour-multi-day.result':
    'En rutt med sina etapper, var och en mätt för sig. Klicka på Spara för att behålla dem.',
  'help.guide.tour-stages-on-days.step.6':
    'Pilen bredvid, Öppna etappen i planeraren, öppnar turen i redigeraren vid den etappen.',
  'help.ctx.trip-tour-hike.bullet.1':
    'Turtyp överst i redigeraren avgör hur rutten planeras. Vandring använder stigar upp till Högsta svårighetsgrad för leden under Detaljer. Löptur använder löpbara vägar och frågar efter ditt Planerat tempo.',
  'help.guide.tour-hike-plan.step.1':
    'Klicka på Planera ny tur högst upp i vänstra kolumnen. Redigeraren öppnas som Ny tur.',
  'help.guide.tour-hike-plan.tip.2':
    'T4 och högre frågar först Aktivera alpin ruttberäkning? Bekräfta bara om rutten får korsa exponerad eller omarkerad terräng. Frågan kommer en gång per redigeringssession.',
  'help.guide.tour-hike-trail-details.step.4':
    'Klicka på en grad i listan för att bara rita de sträckorna på kartan. Klicka på den igen för att visa hela rutten.',
  'help.guide.tour-hike-round.step.1':
    'Klicka på Rundtur från starten i rubriken på kortet Vägpunkter när vandringen är öppen. Från ett annat stopp öppnar du dess Fler åtgärder och väljer Rundtur härifrån.',
  'help.guide.tour-hike-round.tip.3':
    'Sök igen går tillbaka till avståndet, och Avbryt stänger kortet utan att ändra något.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Det här erbjuds bara för vandringar, och bara för en sträcka som ruttplaneraren har planerat, inte en som är ritad för hand.',
  'help.guide.tour-ferrata-add.step.4':
    'I Vägpunkter visar sträckan mellan de två punkterna via ferratans namn, grad och längd.',
  'help.guide.tour-run-plan.goal': 'Planera en löptur på löpbara vägar och få dess tid utifrån ditt tempo.',
  'help.guide.tour-run-plan.tip.2':
    'Stigningar, nedstigningar och hur tekniskt underlaget är ingår inte i tiden: den är avstånd gånger tempo och inget annat.',
  'help.guide.tour-run-ways.result': 'Du vet vilka delar av löpturen som inte går på asfalt innan du ger dig av.',
  'help.ctx.trip-tour-walk.bullet.4':
    'Längs turen hittar sevärdheter efter Promenadens tema inom ett visst avstånd från rutten, och Lägg till som stopp planerar in en sevärdhet i promenaden där du väljer.',
  'help.guide.tour-walk-plan.step.5':
    'Ställ in Vikt på Vanlig, Valfritt eller Måste ses. Slå på Skyddad för ett stopp som ska ligga kvar där det är när en ändring föreslås senare, och klicka sedan på Spara.',
  'help.guide.tour-walk-sights.step.1':
    'När en stadspromenad är öppen hittar du Längs turen i vänstra kolumnen. Välj ett Promenadens tema: Kultur och historia, Parker och utsikter, Mat och lokalt liv eller Lite av allt.',
  'help.guide.tour-walk-sights.result':
    'Sevärdheten är ett stopp på promenaden och planeras in i rutten mellan de stopp du valde.',
  'help.guide.tour-walk-day-times.tip.2':
    'Om ett stopp ännu inte har någon vistelsetid visas ankomsttiderna efter det som tidigast möjliga tider.',
  'help.guide.tour-walk-google-import.step.3':
    'Kontrollera Stopp i länken. Ett stopp som saknar position i länken markeras och utelämnas.',
  'help.guide.tour-walk-check-off.step.1':
    'Klicka på stadspromenaden på dess dag på fliken Planering. Dess kort öppnas bredvid kartan.',
  'help.ctx.trip-tour-bike.title': 'Cykelturer',
  'help.guide.tour-bike-profile.step.1': 'Klicka på Planera ny tur högst upp i vänstra skenan på fliken Turer.',
  'help.guide.tour-bike-profile.tip.2':
    'En profil styr bara ruttplaneraren. Den säger inget om huruvida en väg går att cykla: kortet Underlag och vägar visar vad rutten går på.',
  'help.guide.tour-bike-surfaces.step.3':
    'Klicka på en rad under Underlag, till exempel Grus eller Naturmark. Dess sträckor markeras på kartan. Klicka på raden igen för att ta bort markeringen.',
  'help.guide.tour-bike-mtb-grades.goal': 'Se hur svåra lederna på en MTB-tur är innan du cyklar dem.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Byt Profil från MTB så försvinner gradavsnitten. Rutten planeras då om för den nya profilen.',
  'help.guide.tour-ski-plan.title': 'Planera en skid- och vintertur',
  'help.guide.tour-ski-plan.tip.1':
    'För Längdskidor väljer du också Teknik: Klassisk, Skate eller Okänd. Meddelandet under fälten säger vad som fortfarande saknas.',
  'help.guide.tour-ski-options.step.2':
    'Öppna Svåraste backar och välj den högsta grad du vill åka, från Nybörjare till Expert. Medel är standard.',
  'help.guide.tour-ski-fix-leg.title': 'Rätta en skidsträcka som inte kunde planeras',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Tills varje sträcka är planerad säger kortet Pistrutt att det ännu inte finns någon skidtid.',
  'help.guide.tour-ski-summary.tip.2':
    'Skidtid förblir Inte uträknad tills varje sträcka är planerad. Om du ändå vill ge turen en tid anger du en planerad totaltid i dess detaljer.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Förklaringen visar utförspisterna efter svårighetsgrad, längdspåren, vinter- och snöskoleder, kälkbackarna och liftarna. Hela förklaringen på OpenSnowMap öppnar den fullständiga förklaringen.',
  'help.guide.tour-ski-import.step.2': 'Öppna Importera som i Förhandsvisning av importen och välj Skidor och vinter.',
  'help.guide.tour-ski-import.result':
    'Spåret finns i Turer för den här resan, med sin gren och teknik på kortet Skidspår.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'Paddling har risker, raden längst ned i vänstra kolumnen, öppnar Säkerhet på vattnet. Kartan erbjuder Karta och Satellit, och Sjömärken som överlägg.',
  'help.guide.tour-paddle-setup.step.6':
    'Paddeltempo visar båtens förslag i grått. Skriv ditt eget, så står det Eget tempo i fältet. Länken under, Använd den föreslagna, återgår till båtens tempo.',
  'help.guide.tour-paddle-water-route.goal':
    'Låt TREK planera en sträcka längs floden eller sjön, och förstå noteringarna på en sträcka som inte kunde planeras.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Noteringar under en planerad sträcka flaggar Fors med sin grad, en Kanotränna eller en Lucka i kartdata som överbryggats med en rak linje.',
  'help.guide.tour-paddle-portage.step.4':
    'Under Rutt följer Följ stigen en kartlagd väg, och Rak linje går direkt över. TREK letar själv efter stigen och säger till när det inte finns någon utan en lång omväg.',
  'help.guide.tour-paddle-lock.step.1': 'Peka på stoppet vid slussen och klicka på Fler åtgärder, de tre prickarna.',
  'help.guide.tour-paddle-time.title': 'Läs av och justera en paddelturs tid',
  'help.guide.tour-paddle-time.tip.2': 'Strömmen och vinden ingår inte i uppskattningen.',
  'help.guide.tour-paddle-wind.step.4':
    'Öppna Vad vind betyder för paddling för att se vad motvind, sidvind, öppna överfarter och byar gör med en båt.',
  'help.guide.tour-paddle-checklist.step.1':
    'Spara paddelturen och leta sedan upp Checklista i vänstra kolumnen. Märket i rubriken summerar hur långt du har kommit i listan.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Hinder kommer från OpenStreetMap-data för de regioner som TREK har data för. Där data saknas säger kortet det, och du kontrollerar dammar, slussar och lyft själv.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Klicka på spåret i Turer för den här resan. Vänstra kolumnen visar det som det spelades in, med kortet Lyft och slussar.',
  'help.ctx.trip-tour-horse.title': 'Ridturer',
  'help.guide.tour-horse-plan.goal': 'Bygg en ridtur av sträckor från de skyltade hästlederna i kartvyn.',
  'help.guide.tour-horse-plan.result':
    'Ridturen följer de sträckor du tog, var och en med ruttens namn, tillträdesprick och längd, och den listas under Turer för den här resan.',
  'help.guide.tour-horse-gap.step.1':
    'När det finns en sträcka på ridturen öppnar du en annan rutt och väljer en sträcka som inte tangerar slutet av din ridtur. Under Anslutning till din ridtur visar ett meddelande hur långt ifrån varandra de ligger.',
  'help.guide.tour-horse-recorded.title': 'Behåll en inspelad ridtur från en GPX-fil',
  'help.guide.tour-horse-recorded.tip.2':
    'En fil utan höjder visar Inga höjder i filen i stället för en stigning på noll.',
  'help.guide.dateless-trip.tip.1':
    'När du vet när du ska resa öppnar du formuläret med pennan på kortet och väljer datumen. Dina planerade dagar behåller sin ordning och får datumen i samma ordning.',
  'help.guide.trip-reminder.goal': 'Få en påminnelse några dagar innan du åker.',
  'help.guide.upcoming-reservations.tip.2':
    'Väntande markerar en bokning som inte är bekräftad än. Avbokade bokningar och arkiverade resor visas inte.',
  'help.guide.half-company-holiday.tip.1':
    'Semester som redan är loggad på den dagen kortas till en halv dag. Den som loggar den dagen senare använder bara 0,5 dagar.',
  'help.guide.edit-holiday-calendar.goal':
    'Byt namn på, färg på, flytta eller radera en kalender för allmänna helgdagar eller skollov som du har lagt till.',
  'help.guide.person-color.title': 'Ändra en persons färg',
  'help.guide.answer-fusion-request.tip.1':
    'Begäran förblir öppen tills du svarar på den. Om det finns flera begäranden ser du dem en i taget.',
  'help.guide.log-for-partner.tip.1': 'Halvdag och Komp / Flex fungerar också för den valda personen.',
  'help.guide.dissolve-fusion.tip.2': 'Om du bara vill låta någon se dina dagar kan du dela din kalender i stället.',
  'help.guide.country-details.tip.2':
    'Klicka på märket Platser för att se alla platser som räknas för landet, grupperade efter resa.',
  'help.guide.country-places.tip.2':
    'Märket visas bara när landet har egna platser. Ett land som du bara har markerat för hand har inga.',
  'help.guide.tour-activity-stats.goal':
    'Se sträckan, stigningen och antalet turer du har gjort på alla dina resor, för en period och en typ, och utelämna en tur som aldrig blev av.',
  'help.guide.tour-activity-stats.tip.1':
    'En tur räknas när den sista dagen den ligger på är över. En tur som inte ligger på någon dag, eller bara på dagar utan datum, räknas aldrig. Lägg den på en dag med datum i resan om du vill att den ska räknas.',
  'help.guide.move-to-list.result':
    'Platserna ligger i den andra listan, och en kort notering visar hur många som flyttades eller duplicerades.',
  'help.guide.accept-list-invite.tip.1':
    'Vad du kan göra i listan beror på vilken roll ägaren gav dig: Läsare, Redigerare eller Admin.',
  'help.guide.tour-collection-add-to-trip.title': 'Lägg till en tur från en lista i en resa',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Om du vill spara en tur i en lista öppnar du en sparad tur i resan och klickar på Samling längst ned i turens kort.',
  'help.guide.tour-collection-manage.tip.2': 'Bara listans ägare och admins ser papperskorgen.',
  'help.guide.entry-draft.result':
    'Inlägget finns kvar i din tidslinje, märkt Utkast, och visas inte på den delade länken.',
  'help.guide.journey-map-layers.title': 'Välj vad Journey-kartan visar',
  'help.guide.journey-keep-route.title': 'Spara rutten du spelade in under en dag',
  'help.guide.journey-day-stays.title': 'Skriv inlägg utifrån vistelserna som Dawarich spelade in',
  'help.guide.journey-take-over-day.title': 'Ta över en hel inspelad dag',
  'help.guide.journey-take-over-day.result':
    'Dagen har nu ett utkast per vistelse eller sammanslagen grupp, eller en enda dagsrapport, och dess vistelser listas inte längre som obehandlade.',
  'help.guide.journey-auto-prepare.result':
    'Medan en länkad resa pågår listas varje dags vistelser vid dagen, redo för Ta över dag.',
  'help.ctx.settings-about.title': 'Om',
  'help.guide.web-push-device.tip.3':
    'Push kräver att TREK öppnas via HTTPS. Om meddelanden är blockerade tillåter du dem i webbläsarens inställningar och försöker igen.',
  'help.guide.connect-airtrail.result':
    'Märket visar Ansluten, och fliken Transporter på en resa erbjuder Importera från AirTrail.',
  'help.guide.connect-dawarich.result':
    'Märket visar Ansluten, och reseplaneraren, dagboken och Atlas kan erbjuda det som Dawarich har spelat in.',
  'help.guide.tour-connect-wanderer.result':
    'Märket visar Ansluten, och fliken Turer på en resa kan söka i din wanderer och importera dess leder.',
  'help.guide.tour-wanderer-watch.result':
    'TREK kontrollerar dina importerade leder och berättar när en led kan ha ändrats. En tur ändras först när du godkänner ändringen.',
  'help.guide.plugin-settings.step.1':
    'Öppna Plugin i inställningarnas sidofält. Under Tilläggsinställningar har varje plugin som behöver något av dig ett kort med sina fält: fyll i dem och klicka på Spara. Åtgärder på kortet körs när du har bekräftat.',
  'help.guide.profile.step.3': 'Klicka på Spara profil till höger i kortets fot.',
  'help.guide.default-user-settings.title': 'Ställ in vad nya användare startar med',
  'help.guide.own-routing-engine.tip.1':
    'De offentliga OSRM-servrarna tillåter ungefär en förfrågan per sekund. Det räcker för en dag men kan vara för långsamt för en bilresa.',
  'help.guide.admin-passkeys.goal': 'Låt användare logga in med fingeravtryck, ansikte eller enhetens PIN-kod.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Om du bara vill logga ut en enskild person ger du personen ett Nytt lösenord under Redigera anvädnare. Det avslutar bara den personens sessioner.',
  'help.guide.notification-defaults.goal':
    'Bestäm hur alla användares meddelanden ska vara inställda från början, och blockera en kanal helt för en händelse.',
  'help.ctx.notifications.summary':
    'Alla meddelanden som TREK har visat dig i appen, de nyaste först: en bokning som någon ändrade, ett nytt meddelande i en reschatt, en kalender som har delats med dig. Klockan uppe till höger visar de tio senaste, den här sidan visar alla.',
  'help.guide.read-notifications.step.1':
    'Klicka på klockan uppe till höger. Det röda talet på den visar hur många meddelanden du ännu inte har läst.',
  'help.guide.filter-notifications.step.1': 'Klicka på klockan uppe till höger.',
  'help.guide.mark-notifications-read.step.2':
    'Klicka på Markera alla som lästa högst upp för att markera alla meddelanden som lästa på en gång.',
  'help.guide.delete-notifications.tip.1':
    'Att radera tar bara bort meddelandet för dig. Bokningen, meddelandet eller delningen som det gällde ändras inte.',
  'help.guide.notification-settings.tip.1': 'Ett lås i en cell betyder att admin har stängt av den händelsen för alla.',
  'help.guide.add-guest.tip.3':
    'Bara resans ägare kan lägga till, byta namn på och ta bort gäster. En gäst som har betalat en utgift kan inte tas bort förrän du byter betalare eller raderar betalningen.',
  'help.guide.link-journal.tip.1':
    'Du kan bara koppla dagböcker som du äger. En dagbok som du bara får skriva i går inte att koppla.',
  'help.ctx.trip-places.bullet.7':
    'Rutan bredvid sökningen startar ett urval. Använd fältet längst ned i kolumnen för att ge flera rader en ny kategori på en gång, lägga till dem i en samling, markera dem som besökta eller radera dem.',
  'help.guide.filter-places.step.5':
    'När resan omfattar mer än ett land eller en region filtrerar jordgloben listan på ett land, eller på en region i landet, var och en med sitt antal. Rensa filter återställer till Alla länder.',
  'help.guide.import-places-file.tip.3':
    'När Turer är på, vilket är standard, importerar du en fil via Turer högst upp i kolumnen, med Importera GPX eller KML, och filens linjer blir turer. Nålarna i filen importeras inte där, eftersom turer bara innehåller linjer.',
  'help.guide.dawarich-stays.step.3':
    'Kontrollera Namn, Ankom och Lämnade, välj en Dag eller låt den stå kvar på Inte på någon dag än, lägg till Noteringar om du vill och klicka på Lägg till plats.',
  'help.guide.leave-stop-off-route.result':
    'Stoppet är fortfarande en del av dagen och av PDF:en. Så länge det är märkt Utanför rutten går rutten rakt från stoppet före det till stoppet efter det.',
  'help.guide.move-booking-day.tip.2':
    'Inom sin egen dag flyttas en bokning med tid alltid tillbaka till den plats som tiden ger.',
  'help.guide.place-image-from-file.step.3':
    'Klicka på fotot du vill ha under Från bifogade filer. Ladda upp från enhet ovanför väljer i stället en ny bild från din dator.',
  'help.guide.place-own-hours.step.1':
    'Öppna platsen och klicka på Redigera längst ned till höger på kortet. Platsens formulär öppnas.',
  'help.guide.place-own-hours.tip.3':
    'Klicka på Ta bort öppettider och sedan på Uppdatera för att visa de automatiskt hittade tiderna på kortet igen.',
  'help.guide.confirm-stay-booking.title': 'Bekräfta bokningen av en vistelse',
  'help.guide.confirm-stay-booking.tip.2':
    'Samma piller fungerar i alla bokningar, även i bokningarna under Bokningar på dagen.',
  'help.guide.map-lock.tip.2':
    'Den här webbläsaren kommer ihåg låset för varje resa. När du öppnar en resa zoomar kartan ändå in på resan en gång, så att den aldrig öppnas på ett tomt område.',
  'help.guide.tour-map-lines.step.2':
    'Klicka på linjen, eller på nålen vid dess start. Turens kort öppnas över kartans nederkant, och turens linje ritas bredare med en vit kant, så att du ser den bland de andra linjerna. X i kortets rubrik stänger kortet.',
  'help.guide.car-stops.title': 'Planera en bilresa med stopp längs vägen',
  'help.guide.car-stops.result':
    'Körningen är ett kort på fliken Transporter och en rad på sin dag, och dess linje på kartan går från upphämtningen genom alla stopp, i deras ordning, till återlämningen.',
  'help.guide.transport-details.step.5':
    'På kartan längst ned i detaljerna visar färdens linje och öppnar Planering på dess dag. Redigera längst till höger öppnar hela formuläret, och papperskorgen bredvid raderar färden när du har bekräftat.',
  'help.guide.export-transports-csv.step.1':
    'Begränsa först listan om du bara vill ha en del av den. Sök, Filtrera och sorteringen under Visningsalternativ påverkar alla resultatet: filen innehåller det som fliken visar, i samma ordning.',
  'help.guide.group-sort-bookings.tip.1':
    'Kort och Lista behåller sin egen gruppering: Kort börjar i Status, Lista i Dag. En prick på Visningsalternativ visar att något skiljer sig från standard, och Återställ vy längst ned i panelen återställer standard.',
  'help.guide.booking-on-map.step.2': 'Klicka på På kartan längst ned i detaljerna.',
  'help.guide.export-bookings-csv.goal':
    'Exportera resans bokningar som en CSV-fil som du kan öppna i Excel, Numbers eller något annat kalkylprogram.',
  'help.guide.arrange-packing-list.goal':
    'Flytta hela listor och enskilda föremål dit du vill ha dem, eller se varje lista i namnordning.',
  'help.guide.check-off-packing.tip.4':
    'För ett föremål med antal över ett kan du också markera styckena som packade ett i taget. Se Packa flera av samma sak.',
  'help.guide.count-packed-pieces.tip.1':
    'Om du bockar i rutan packas alla styckena på en gång, och om du avbockar den packas alla ur igen.',
  'help.guide.expense-receipts.goal':
    'Spara kvittot eller fakturan tillsammans med utgiften den hör till, och öppna den igen från redovisningen.',
  'help.guide.expense-receipts.tip.2':
    'Papperskorgen bredvid ett kvitto tar bort det från utgiften när du sparar. Själva filen finns kvar i Filer. Radera den där om du vill ta bort den helt.',
  'help.guide.files-sync.tip.4':
    'Om kortet visar ett gult meddelande med Anslut igen accepterar lagringen inte längre den sparade inloggningen. Klicka på Anslut igen, ange ett nytt applösenord eller token, så startar synkroniseringen igen.',
  'help.guide.files-sync-settings.result':
    'Från nästa körning synkroniseras resan bara i den riktning du valde, och raderingar och motstridiga ändringar hanteras enligt reglerna du ställde in.',
  'help.guide.manage-notes.result':
    'Noteringen är borta från kortet Noteringar, för alla medlemmar på en gång. En notering som du bara har fäst eller ändrat finns kvar, och de andra ser den som du lämnade den.',
  'help.guide.note-categories.step.4':
    'Färgprickarna i en rad anger kategorins färg: Indigo, Röd, Bärnsten, Smaragd, Blå eller Violett. Här blir Boende gul.',
  'help.guide.roadtrip-reorder.step.3':
    'Från tangentbordet ger du ett stopp fokus och trycker på Alt med uppåt- eller nedåtpilen för att flytta det ett steg inom dagen.',
  'help.guide.roadtrip-overnight.title': 'Övernatta längs rutten',
  'help.guide.roadtrip-overnight.tip.1':
    'Natten varar till nästa dag. För andra datum ändrar du bokningen: ändra datumen under Dagar, tillsammans med resten av vistelsen.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Märket visas bara på stopp där din bil kan tanka eller ladda: bränslestopp för Bensin, laddstopp för El och båda för Båda.',
  'help.guide.roadtrip-bookings.result':
    'Varje bokad färd visas i körningen på den punkt där den sker, och rutten före och efter den går till och från dess terminaler.',
  'help.guide.roadtrip-google-import.step.1':
    'Klicka på de tre prickarna högst upp i Längs rutten och välj Importera Google Maps-rutt.',
  'help.guide.roadtrip-hazards.title': 'Visa aktuella varningar på kartan',
  'help.guide.roadtrip-hazards.tip.3':
    'Flödena uppdateras var tionde minut och kräver en anslutning. Liksom de andra körinställningarna sparas reglaget för resan.',
  'help.ctx.trip-tours.bullet.6':
    'Att ändra en rutt och att radera en tur görs på fliken Turer, under Turer för den här resan.',
  'help.guide.tour-show-list.tip.1':
    'Klicka på en turs linje på kartan, så markerar listan den turen och rullar till den.',
  'help.guide.tour-add-to-day.step.3':
    'Lades till dag 10 bekräftar att det gick bra, raden får märket Dag, och dagen i vänstra kolumnen listar turen med tid, sträcka och stigning.',
  'help.guide.tour-day-times.title': 'Ge en tur en starttid på dess dag',
  'help.guide.tour-day-times.tip.3':
    'Uteslut från rutten i samma meny låter turen ligga kvar på dagen men utelämnar den från dagens rutt på kartan. Lägg tillbaka i rutten ångrar det.',
  'help.guide.tour-remove-from-day.tip.1':
    'En flerdagarstur tar du bort från en dag i taget, eftersom varje dag har sin egen etapp.',
  'help.guide.tour-filter-list.step.4':
    'Stäng menyn. Knappen visar nu statusen, antalet kvarvarande turer och +1 för varje ytterligare filter du har ställt in.',
  'help.guide.tour-hide-on-map.step.2':
    'Turens linje döljs på kartan. Dess rad finns kvar i listan, dämpad, och visar ett överstruket öga (Visa på kartan). Klicka på det för att visa linjen igen.',
  'help.guide.tour-import-plan-tab.step.2':
    'Klicka på Importera GPX eller KML högst upp i listan och välj dina filer (GPX, KML eller KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'Rubriken visar turens runda ruta, dess namn med en penna för att byta namn, en färgad prick för linjens färg och piller för typ, ursprung, planerad tid, sträcka, stigning och nedstigning. X till höger stänger kortet, och det gör Escape också.',
  'help.guide.tour-detail-read.step.3':
    'Håll pekaren över tiden för att se hur den är sammansatt: tiden i rörelse, pauserna och den planerade totalen.',
  'help.guide.tour-detail-read.tip.4':
    'Kortet ändrar inte rutten. Om du vill flytta en punkt eller rita om en sträcka öppnar du fliken Turer och klickar på turen under Turer för den här resan.',
  'help.guide.tour-rename-colour.step.4':
    'Välj en färg. Automatisk färg, den första cellen, återställer linjen till standardfärgen, och Välj egen färg, den sista, låter dig välja valfri färg. Linjen på kartan och färgfältet i listan Turer ändras direkt.',
  'help.guide.tour-take-along.step.3':
    'Klicka på GPX för att ladda ner den sparade turen som en GPX-fil: hela rutten med de höjder den har, redo för en navigeringsapp eller en GPS-enhet.',
  'help.guide.tour-copy-keep.step.1':
    'Öppna turens kort och klicka på Kopiera längst ned. TREK skapar en ny, fristående tur utan dess dagar, och originalet ändras inte.',
  'help.guide.tour-copy-keep.result':
    'Resan har en andra tur som du kan ändra fritt, och samlingen har en egen kopia, redo att läggas till i en annan resa.',
  'help.guide.tour-packing-link.tip.1':
    'Det är bara en länk. Inget kopieras eller flyttas, och föremålen ligger kvar i Listor. Bocka av ett föremål där, så visar turen det direkt.',
  'help.guide.tour-files.step.3': 'Klicka på en fil för att öppna den.',
  'help.guide.tour-activity-link.step.3':
    'Välj inspelningen under Spår, eller klicka på Importera GPX för att ta in en ny fil.',
  'help.guide.tour-activity-compare.goal':
    'Se var det faktiska spåret skiljer sig från planen, och byt eller koppla ifrån det.',
  'help.guide.tour-origin-check.title': 'Se varifrån en tur kommer',
  'help.guide.tour-origin-check.result':
    'Du vet varifrån turen kommer, när den importerades och om den har ändrats sedan dess.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Ett osparat utkast sparas: öppna fliken Turer igen så återställs det, märkt Osparat utkast återställt. Tillbaka till turer och Ångra frågar innan ändringar kastas.',
  'help.guide.tour-open-workspace.step.6':
    'Pillret längst ned till vänster byter karta, först Karta eller Satellit. När en tur är öppen erbjuder det kartorna för turens typ, till exempel Topo eller Vandring, och reglage som Sätt punkter och 3D.',
  'help.guide.tour-draw-route.step.1':
    'Klicka på Planera ny tur högst upp i vänstra skenan. Skenan blir Ny tur, en vandring om du inte väljer en annan typ.',
  'help.guide.tour-draw-route.tip.3':
    'Om ett utkast har osparade ändringar frågar Planera ny tur i menyn Lägg till tur först: Börja på en ny tur?, med Släng och börja.',
  'help.guide.tour-type-profile.step.4':
    'Rutten planeras om för profilen, och Turöversikt till höger visar dess sträcka och tid.',
  'help.guide.tour-edit-points.step.3':
    'Om du vill ändra ordningen pekar du på en rad och drar den i handtaget som visas vid dess vänstra kant.',
  'help.guide.tour-shaping-points.goal': 'Flytta rutten till en annan stig utan att lägga till ett stopp.',
  'help.guide.tour-shaping-points.result': 'Rutten går där du drog den, och stoppen är numrerade som förut.',
  'help.guide.tour-loop-reverse.tip.3':
    'På en vandring letar Rundtur från starten bredvid dem efter rundvandringar av en längd som du väljer.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Ingen ruttplanerare har kontrollerat en sträcka som är ritad för hand: den kan korsa vatten, privat mark eller en klippa.',
  'help.guide.tour-trip-places.step.4':
    'Dess rad visar Plats på resan under namnet. Lossa från platsen i Fler åtgärder behåller punkten men tar bort kopplingen.',
  'help.guide.tour-details-times.step.2':
    'Skriv en Beskrivning under Detaljer och lägg till en Hemsida om det finns en.',
  'help.guide.tour-save.goal': 'Spara den ritade turen i resan.',
  'help.guide.tour-save.result': 'Turen är sparad i resan, redo att läggas på en dag.',
  'help.guide.tour-edit-saved.tip.2':
    'Ett importerat GPX- eller KML-spår öppnas som GPX-tur, att titta på. Planera en redigerbar version där skapar en tur som du kan ändra.',
  'help.guide.tour-summary-profile.step.4':
    'Fäll ihop höjdprofil, pilen bredvid dess titel, döljer profilen. Klicka på den igen för att visa profilen.',
  'help.guide.tour-list-manage.step.2':
    'Peka på en tur och klicka på det runda plusset på dess rad, Lägg till i denna dag, för att öppna resans dagar.',
  'help.guide.tour-delete.title': 'Radera en tur',
  'help.guide.tour-saved-elsewhere.title': 'När turen har sparats någon annanstans',
  'help.guide.tour-saved-elsewhere.result': 'Inga ändringar går förlorade om ingen väljer att kasta dem.',
  'help.guide.tour-import-gpx.title': 'Importera en GPX-, KML- eller KMZ-fil som en tur',
  'help.guide.tour-import-gpx.tip.2': 'Varje spår eller rutt i en fil blir en egen tur. Spår slås aldrig ihop.',
  'help.guide.tour-view-import.step.2':
    'Vänstra kolumnen visar den som en GPX-tur: Turöversikt med sträcka, höjder och inspelad tid, och höjdprofilen under. Kartan visar turens linje.',
  'help.guide.tour-plan-from-import.step.1':
    'Öppna den importerade turen på fliken Turer. Klicka på Planera en redigerbar version i kortet Redigerbar version till vänster.',
  'help.guide.tour-plan-from-import.result':
    'Turen har nu vägpunkter som du kan dra, och dess Ursprung visar Omplanerad, inspelat spår sparat.',
  'help.guide.tour-restore-recorded.result': 'Turen är en GPX-tur igen och visar linjen som den spelades in med.',
  'help.guide.tour-take-over.step.6': 'Klicka på Hämta.',
  'help.guide.tour-import-wanderer.step.2':
    'Skriv i Sök leder. Sök i det här kartområdet visar bara de leder som finns i den del av kartan du ser.',
  'help.ctx.trip-tour-map.title': 'Turkarta',
  'help.guide.tour-map-layers.goal':
    'Planera på den karta som passar turen bäst: höjdkurvor för stigningar, markerade leder eller cykelrutter, eller flygbilder.',
  'help.guide.tour-along-search.title': 'Hitta platser längs en tur',
  'help.guide.tour-along-search.tip.1':
    'När du har ändrat rutten, typerna eller avståndet markeras Sök igen och visar att listan hittades för rutten som den var förut. Klicka på knappen för att uppdatera listan.',
  'help.guide.tour-along-add-stop.step.4':
    'Rutten planeras om förbi platsen, och Längs turen visar hur mycket sträcka och tid turen fick till. Ångra på samma rad tar bort stoppet igen.',
  'help.guide.tour-3d-terrain.step.2':
    'Rutten är färgad efter lutning. Klicka på Lutning i raden längst ned för att rita den i turens färg i stället, och klicka på den igen för att visa lutningarna igen.',
  'help.guide.tour-3d-flyover.title': 'Flyg längs en tur',
  'help.guide.tour-3d-flyover.tip.2':
    'Överflygningen startar först när landskapet längs hela rutten har lästs in, så att den inte stannar halvvägs för att hämta kartdata. Håll pekaren över ringen för att se hur mycket som är inläst.',
  'help.guide.tour-map-overlays.result':
    'Pisterna eller sjömärkena ritas över kartan, och teckenförklaringen förklarar dem.',
  'help.ctx.trip-tour-stages.bullet.3':
    'Turöversikt listar varje etapp under Etapper, från stoppet där den börjar till stoppet där den slutar. Ett klick på en etapp markerar dess sista stopp och platsen i höjdprofilen.',
  'help.guide.tour-multi-day.step.4':
    'Vägpunkter delas nu upp i Etapp 1 och Etapp 2, var och en med sin sträcka och tid. Stoppet som avslutar en etapp har en månikon.',
  'help.guide.tour-stages-on-days.title': 'Lägg en flerdagarstur på resans dagar',
  'help.guide.tour-stages-on-days.tip.1':
    'När resan slutar före den sista etappen visar alternativet vilken etapp som är den sista som ryms. Etapperna efter den får ingen dag.',
  'help.ctx.trip-tour-hike.bullet.2':
    'Vägpunkter listar stoppen i ordning. Lägg till punkt är på från början, så ett klick på kartan sätter nästa punkt. Resans platser bredvid gör en hydda eller ett hotell på resan till ett stopp.',
  'help.guide.tour-hike-plan.step.2': 'Öppna Turtyp och välj Vandring: till fots, inom en svårighetsgrad som du anger.',
  'help.guide.tour-hike-plan.tip.3':
    'Ruttval under svårighetsgraden anger önskemål för rutten: Undvik branta stigningar, Undvik trappor och Undvik färjor. Där det inte finns någon annan väg går rutten ändå dit.',
  'help.guide.tour-hike-trail-details.step.5':
    'Klicka på Underlag för att se samma rutt efter vad du går på, från asfalt till naturmark och berg.',
  'help.guide.tour-hike-round.step.2':
    'Kortet Rundtur öppnas över kartan. Kontrollera starten under Från och skriv in det Avstånd du vill ha. Pillret bredvid visar vilka längder en rundtur kan ha.',
  'help.guide.tour-hike-compare-ways.title': 'Jämför andra vägar för en sträcka av en vandring',
  'help.guide.tour-hike-compare-ways.tip.2':
    'När ruttplaneraren inte känner till någon annan väg står det på kortet. När ruttplaneraren inte kan följa vägen du valde ligger sträckan kvar som den är, och kortet berättar det.',
  'help.guide.tour-ferrata-add.step.5':
    'Turöversikt till höger visar märket Via ferrata-led med sin grad, och redigerarens rubrik varnar Rutten går längs en via ferrata.',
  'help.guide.tour-run-plan.step.1': 'Klicka på Planera ny tur, öppna Turtyp och välj Löptur.',
  'help.guide.tour-run-plan.tip.3': 'När dina avstånd anges i miles anges tempot också per mile.',
  'help.guide.tour-run-ways.tip.1': 'Inget här ändrar löpturens rutt eller tid.',
  'help.ctx.trip-tour-walk.bullet.5':
    'Lägg till tur i Turer för den här resan importerar en gångrutt som delats från Google Maps. På fliken Planering kan du bocka av stoppen för dagen i en promenad som du har öppnat från dess dag.',
  'help.guide.tour-walk-plan.step.6':
    'Turöversikt till höger visar Uppsk. gångtid, Vistelser och Planerat, som är de två hopräknade. Klicka på Spara längst ned i vänstra kolumnen för att spara promenaden.',
  'help.guide.tour-walk-sights.step.2':
    'Temat fyller i Vad att leta efter. Öppna det för att slå på eller av olika slag av platser, och välj hur långt du vill leta under Inom det här avståndet från rutten.',
  'help.guide.tour-walk-day-times.title': 'Se ankomsttider och öppettider för dagen',
  'help.guide.tour-walk-day-times.tip.3':
    'Öppettiderna kommer från OpenStreetMap eller från den plats på resan som ett stopp hör till, och pillret bredvid dem visar vilket. Kontrollera dem innan du ger dig av.',
  'help.guide.tour-walk-google-import.step.4':
    'Klicka på Läs in som promenad. TREK planerar själv vägen till fots mellan stoppen. Klicka på Spara för att spara promenaden.',
  'help.guide.tour-walk-check-off.step.2':
    'Rulla till Promenadens stopp. Varje stopp visar hur länge du stannar och, om promenaden har en starttid, när du kommer fram.',
  'help.ctx.trip-tour-bike.summary':
    'En cykeltur som är öppen i redigeraren på fliken Turer: profilen som den ruttplaneras för, dess cykeltid, vad rutten går på och, på en mountainbiketur, hur svåra lederna är graderade.',
  'help.guide.tour-bike-profile.step.2': 'Öppna fältet Turtyp och välj Cykeltur.',
  'help.guide.tour-bike-profile.tip.3':
    'Där ingen väg för cyklar kommer nära en punkt står det Ingen väg för cyklar når punkt N i skenan. Flytta punkten, eller öppna Fler åtgärder på punkten före och välj Rita nästa sträcka för hand.',
  'help.guide.tour-bike-surfaces.step.4':
    'Klicka på en rad under Vägtyp, till exempel Skogs- eller jordbruksväg eller Väg med trafik, för att se var rutten går på den.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Öppna cykelturen i redigeraren och kontrollera att Profil är inställd på MTB. Ledgrader läses bara på den profilen.',
  'help.ctx.trip-tour-ski.title': 'Skid- och vinterturer',
  'help.guide.tour-ski-plan.goal':
    'Planera en dag på pisterna, en längdskidslinga, en skidtur eller en snöskopromenad längs kartlagda pister, liftar och spår.',
  'help.guide.tour-ski-plan.tip.2':
    'Infopricken bredvid Gren förklarar vad TREK gör med skidturer. Inget i den, eller någon annanstans här, säger något om snö, laviner eller om pister, liftar och spår är öppna.',
  'help.guide.tour-ski-options.step.3':
    'Välj Snabbast, Mest åkning eller Lättast under Föredra. Välj Lugnt, Normalt eller Sportigt under Takt: det ändrar tiden som ruttplaneraren räknar för varje pist.',
  'help.guide.tour-ski-fix-leg.goal': 'Få en röd sträcka planerad med ett klick, eller rita den rakt.',
  'help.guide.tour-ski-fix-leg.result':
    'Ingen sträcka är röd längre: var och en följer pisterna eller går rakt mellan sina punkter.',
  'help.guide.tour-ski-summary.tip.3':
    'En sparad tur öppnas som den sparades. Flytta en punkt eller ändra ett alternativ för att planera om den med aktuella pistdata.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Om reglaget är gråat och det står Zooma in för att se pisterna zoomar du in på skidområdet.',
  'help.guide.tour-ski-import.step.3':
    'Välj Gren, och för Längdskidor även Teknik. Tills du har gjort det står det Välj en gren för att importera spåret som skidor i dialogen.',
  'help.ctx.trip-tour-paddle.title': 'Paddelturer',
  'help.guide.tour-paddle-setup.title': 'Planera en paddeltur',
  'help.guide.tour-paddle-setup.step.7':
    'Kontrollera att Lägg till punkt är på och klicka sedan på kartan: först din sjösättningsplats, sedan eventuella punkter på vägen och till sist din upptagningsplats.',
  'help.guide.tour-paddle-water-route.step.1':
    'En sträcka som är ritad för hand visar Ritad för hand, inte ruttad under sin punkt, med sin längd. TREK behåller linjen som du ritade den.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Du kan inte spara så länge en sträcka inte är planerad. Planera den först på vattnet eller rita den för hand.',
  'help.guide.tour-paddle-portage.step.5':
    'Skriv under Ur och i hur många minuter du behöver för att gå i land, lasta av och sätta i båten igen. Om du lämnar fältet tomt räknar TREK med 10 minuter.',
  'help.guide.tour-paddle-lock.step.2':
    'Välj Sluss vid den här punkten. Ett kort Sluss visas under punkten, märkt Tid saknas.',
  'help.guide.tour-paddle-time.goal':
    'Se hur tiden på vattnet, bärningen, slussarna och pauserna summeras, och ställ in dina egna värden.',
  'help.guide.tour-paddle-time.tip.3':
    'Pauser och en egen planerad total anger du under Detaljer. Med en planerad total visar kortet Din planerade totaltid bredvid uppskattningen.',
  'help.guide.tour-paddle-wind.tip.1':
    'Det finns bara en prognos för de närmaste 16 dagarna. För en dag längre fram står det från vilket datum prognosen finns. För en dag som har passerat står det att dagen har passerat.',
  'help.guide.tour-paddle-checklist.step.2':
    'Raden under visar hur aktuella uppgifterna är: OSM-data från för OpenStreetMap, Hämtad för när TREK läste dem och Hinderdata där de inte täcker hela rutten.',
  'help.guide.tour-paddle-checklist.tip.5':
    'En checklista är inget säkerhetsgodkännande och inget juridiskt godkännande. Ditt beslut upphäver inte ett förbud eller privat mark som är registrerad i OpenStreetMap.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Klicka på Lyft och klicka sedan på linjen där du gick i land och där du satte i igen.',
  'help.ctx.trip-tour-horse.summary':
    'En ridtur ruttplaneras aldrig. Den byggs av sträckor från de skyltade hästlederna som OpenStreetMap känner till, förbundna med sträckor som du ritar för hand, eller behålls exakt som du spelade in den.',
  'help.guide.tour-horse-plan.step.1':
    'Visa området där du vill rida på kartan och klicka sedan på Planera ny tur högst upp i vänstra kolumnen.',
  'help.guide.tour-horse-plan.tip.1':
    'En hästled ger dig inget tillstånd att rida på den. Tillträde för häst visar bara vad OpenStreetMap har taggat. Följ alltid skyltarna på plats.',
  'help.guide.tour-horse-gap.step.2': 'Slå på Förbind med en manuell delsträcka. Glappet ritas rakt och okontrollerat.',
  'help.guide.tour-horse-recorded.goal':
    'Importera en ridtur som du har spelat in på en GPS-enhet eller i en app, och behåll den exakt som du red den.',
  'help.guide.tour-horse-recorded.tip.3':
    'Du kan också släppa filen var som helst på fliken Turer för att öppna samma förhandsvisning.',
  'help.guide.create-trip.tip.3':
    'Under Resekompisar kan du lägga till personer som redan har ett konto här. De blir medlemmar i resan så fort den skapas.',
  'help.guide.trip-reminder.step.1': 'Klicka på pennan på resans kort. I formuläret Ny resa finns samma avsnitt.',
  'help.guide.company-holidays.tip.2':
    'En hel företagshelgdag tar bort all semester som redan är loggad den dagen, så att ingen förbrukar semesterrätt på den.',
  'help.guide.half-company-holiday.tip.2':
    'Klicka på dagen igen med samma inställningar för att rensa den, eller med ”Halvdag av” för att göra den till en hel företagshelgdag.',
  'help.guide.edit-holiday-calendar.step.1':
    'Öppna Inställningar och leta upp kalendern under Allmänna helgdagar eller Skollov.',
  'help.guide.person-color.goal':
    'Ge dig själv eller någon du planerar med en färg som är lättare att skilja från de andra.',
  'help.guide.answer-fusion-request.tip.2':
    'Någon av er kan upplösa sammanslagningen senare, och era poster finns kvar.',
  'help.guide.log-for-partner.tip.2': 'Personen ser ändringen direkt, och raden Rättighet uppdateras med en gång.',
  'help.guide.country-places.title': 'Se alla platser i ett land',
  'help.guide.tour-activity-stats.step.1':
    'Öppna fliken Turer i panelen längst ned på kartan, bredvid Statistik och Bucketlista.',
  'help.guide.tour-activity-stats.tip.2':
    'Länka spåret du faktiskt tog med Lägg till faktiskt spår i turens detaljer, så ersätter spårets inspelade värden de planerade här. En tur som är planerad på flera dagar räknas en gång.',
  'help.ctx.collections.bullet.7':
    'Sparade turer: turer som du sparat från en resa ligger först i en lista, med svårighetsgrad, typ, resan de kom från och sina mått. Lägg till i en resa skapar en ny tur av en av dem, och papperskorgen tar bort den från listan.',
  'help.guide.move-to-list.title': 'Flytta eller duplicera platser till en annan lista',
  'help.guide.copy-to-trip.tip.2':
    'En plats som resan redan har hoppas över, och TREK visar hur många som hoppades över.',
  'help.guide.accept-list-invite.tip.2':
    'Klicka på Delad högst upp i listan för att se medlemmarna. Där kan du klicka på Lämna lista för att lämna listan igen.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Skapa en ny tur i en av dina resor utifrån en tur som sparats i en lista, med eller utan dess vägpunkter.',
  'help.guide.tour-collection-add-to-trip.result':
    'Dialogen bekräftar att turen nu hör till den resan. Öppna resan tar dig dit. Stäng lämnar dig kvar i Samlingar.',
  'help.guide.tour-collection-manage.tip.3': 'Sparade turer visas bara i sin egen lista, inte under Alla sparade.',
  'help.guide.search-journey.step.3':
    'Klicka på en dag för att rulla dit, eller på pilen vid den för att lista dagens inlägg och välja ett.',
  'help.guide.journey-map-layers.goal':
    'Se skillnaden mellan planen och det som faktiskt hände, och slå lager på och av.',
  'help.guide.journey-keep-route.goal':
    'Lägg till en dags verkliga rutt från Dawarich på dagbokens karta och behåll den där.',
  'help.guide.journey-day-stays.goal': 'Gör om vistelserna som Dawarich har registrerat till inlägg, ett i taget.',
  'help.guide.journey-take-over-day.goal':
    'Gör om en dags vistelser till utkast till inlägg, eller till en dagsrapport, i ett enda steg.',
  'help.guide.journey-auto-prepare.title': 'Låt TREK förbereda dina inspelade dagar',
  'help.guide.photo-location.title': 'Placera inlägg där fotona togs',
  'help.ctx.settings-about.summary':
    'Vad TREK är, vilken version den här servern kör och var du hittar projektet: dokumentationen, var du rapporterar en bugg och hur du kan stödja projektet.',
  'help.guide.startup.tip.2': 'En startflik som hör till ett tillägg som du har stängt av öppnar planen i stället.',
  'help.guide.web-push-device.title': 'Få push-meddelanden på den här enheten',
  'help.guide.connect-airtrail.tip.1': 'Kortet visas bara när admin har slagit på tillägget AirTrail.',
  'help.guide.connect-dawarich.tip.1':
    'TREK föreslår bara inlägg, platser och länder. Inget läggs till förrän du bekräftar, och inget skrivs tillbaka till Dawarich.',
  'help.guide.tour-connect-wanderer.tip.1': 'Kortet visas bara när admin tillåter wanderer under Turer.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Ett tips ändrar aldrig en tur. Turens källkontroll visar vad som faktiskt har ändrats.',
  'help.guide.api-keys.tip.3':
    'Skicka nyckeln som Authorization: Bearer eller X-API-Key till /api/v1. Ett konto kan ha upp till 10 nycklar.',
  'help.guide.plugin-settings.step.2':
    'Plugin-aktivitet listar varje åtgärd som ett plugin har utfört å dina vägnar, de nyaste först. Uppdatera läser in de senaste.',
  'help.ctx.admin-github.bullet.3':
    'Om: Ko-fi, Buy Me a Coffee, Discord, Rapportera en bugg, Förslag på ny funktion och Wikin.',
  'help.guide.default-user-settings.goal':
    'Ge alla konton rimliga enheter, färgläge och valuta utan att någon behöver öppna Inställningar.',
  'help.guide.default-map.step.3':
    'Varje fält sparas när du lämnar det. Länken ”Återställ” bredvid fältets namn återställer TREK:s standardvärde.',
  'help.guide.own-routing-engine.tip.2':
    'Om bara din egen ruttmotor är angiven används inte heller den offentliga Valhalla. Länken ”Återställ” bredvid ett fält tömmer det igen.',
  'help.guide.admin-passkeys.step.1':
    'På fliken Inställningar slår du på Aktivera inloggningsnyckel under Inloggningsnyckel.',
  'help.guide.storage-backends.step.4':
    'Hälsa överst listar misslyckade skrivningar till ett speglingsmål. Om det står ”Inga replikfel registrerade” fungerar allt.',
  'help.guide.channels-instance.tip.3':
    'Web Push kräver HTTPS. På iPhone och iPad måste användarna först lägga till TREK på hemskärmen.',
  'help.guide.notification-defaults.step.1':
    'Rulla ned till Standardval för användare längst ned på fliken Meddelanden. Varje rad är en händelse, varje kolumn en kanal.',
  'help.ctx.notifications.bullet.1':
    'Klockan uppe till höger visar hur många olästa meddelanden du har. Klicka på den för de tio senaste, och på Visa alla meddelanden längst ned för den här sidan.',
  'help.guide.read-notifications.step.2':
    'Panelen listar dina tio senaste meddelanden. Varje meddelande säger vem som gjorde vad och var, och de olästa har färgad bakgrund.',
  'help.guide.filter-notifications.step.2': 'Klicka på Visa alla meddelanden längst ned i panelen.',
  'help.guide.mark-notifications-read.tip.1': 'Om du öppnar ett meddelande via dess knapp markeras det också som läst.',
  'help.guide.delete-notifications.tip.2':
    'Ett raderat meddelande kan inte återställas. Vill du dölja ett meddelande men behålla det markerar du det som läst och använder Olästa.',
  'help.guide.notification-settings.tip.2':
    'Det finns inga inställningar per resa: ett reglage gäller alla dina resor.',
  'help.guide.link-journal.title': 'Koppla en dagbok till resan',
  'help.guide.link-journal.tip.2': 'Från och med då ser de som du ger åtkomst också dagboken i sin egen Journey-lista.',
  'help.ctx.trip-places.bullet.8':
    'När Dawarich är kopplat visar Från Dawarich överst i listan vistelserna som Dawarich registrerade under resan. Lägg till som plats gör en vistelse till en plats. Ingen plats jag besökt tar bort den från listan.',
  'help.guide.dawarich-stays.step.4':
    'Om en vistelse inte var ett riktigt besök klickar du på Ingen plats jag besökt, x:et bredvid, för att ta bort den. Visa … redan hanterade längst ned i listan visar vistelserna som du har lagt till eller tagit bort. Lägg tillbaka sätter tillbaka en borttagen vistelse i listan.',
  'help.guide.leave-stop-off-route.tip.1':
    'Bara ett stopp med koordinater har det här valet, och inställningen gäller bara den här dagen: samma plats en annan dag ruttplaneras fortfarande.',
  'help.guide.move-booking-day.title': 'Flytta en bokning till en annan dag',
  'help.guide.place-image-from-file.step.4':
    'Fotot är nu platsens bild. Klicka på det lilla röda X:et i hörnet för att ta bort det igen.',
  'help.guide.place-own-hours.step.2': 'Fyll i Telefon och E-post under Hemsida om du känner till dem.',
  'help.guide.add-accommodation.tip.4':
    'Ett snabbare sätt: plusknappen i dagens rubrik, med verktygstipset Lägg till i denna dag, har Lägg till boende. Den öppnar dagen med det här formuläret redan öppet.',
  'help.guide.confirm-stay-booking.goal': 'Markera hotellbokningen bakom en vistelse som bekräftad, direkt från dagen.',
  'help.guide.map-whole-trip.tip.4':
    'Om hela resan visas sparas per resa på ditt konto, så resan öppnas på samma sätt i en annan webbläsare.',
  'help.guide.tour-map-lines.step.3':
    'Öppna en dag som turen ligger på i dagkolumnen, så blir turen en del av dagens rutt: rutten går till turens start och fortsätter därifrån där turen slutar.',
  'help.guide.car-stops.goal':
    'Ge en hyrbil eller din egen bil en upphämtning, en återlämning och de platser där du stannar emellan.',
  'help.guide.car-stops.tip.1': 'Det finns ingen separat hyrbilstyp: både hyrbil och egen bil är en Bil.',
  'help.guide.transport-details.result':
    'Planering är öppen på resans dag, med resans linje ritad på kartan och ruttikonen på dess rad påslagen.',
  'help.guide.export-transports-csv.step.2':
    'Klicka på kalkylbladsikonen efter Visningsalternativ. Dess verktygstips lyder Exportera som kalkylblad (CSV).',
  'help.guide.group-sort-bookings.title': 'Gruppera och sortera bokningarna',
  'help.guide.group-sort-bookings.tip.2':
    'I Tidslinje innehåller samma knapp Ett spår per typ och Visa den andra fliken.',
  'help.guide.booking-on-map.result':
    'Detaljvyn stängs och fliken Planering öppnas på bokningens dag, med bokningens plats markerad på kartan.',
  'help.guide.export-bookings-csv.step.1':
    'Vill du bara exportera en del av fliken, snäva först in den med Sök eller Filtrera. Filen innehåller exakt det som fliken visar.',
  'help.guide.import-booking-file.tip.4':
    'För att läsa en bekräftelse behövs en anslutning. Offline meddelar Importera det, och du försöker igen när TREK är online igen.',
  'help.guide.arrange-packing-list.step.1':
    'Dra i handtaget längst till vänster i en listas rubrik, före färgpricken, och släpp listan på ett annat kort. En kontur i din accentfärg markerar målkortet, och listan tar det kortets plats för alla på resan.',
  'help.guide.count-packed-pieces.title': 'Packa flera av samma sak',
  'help.guide.count-packed-pieces.tip.2':
    'Med Spårning av väskor på räknar Packade i kortet Väskor bara de föremål som redan är inräknade.',
  'help.guide.packing-bags.tip.4':
    'Vikten för en väska som bärs av flera personer delas lika mellan dem under Per person. Den vikten har en prickad understrykning och visar en förklaring när du pekar på den.',
  'help.guide.expense-receipts.step.1':
    'Klicka på pennan bredvid utgiftens rad. Redigeraren öppnas på den, med Kvitton & fakturor nära botten.',
  'help.guide.expense-receipts.tip.3':
    'Att bifoga kräver en anslutning och behörighet att ladda upp filer, eftersom ett kvitto lagras som en av resans filer.',
  'help.guide.files-sync-settings.title': 'Välj synkriktning för dokument',
  'help.guide.files-sync-settings.tip.1':
    'Ett spår är alltid på: om du klickar på det enda spår som fortfarande är på händer ingenting.',
  'help.guide.manage-notes.title': 'Läs, fäst och redigera en notering',
  'help.guide.manage-notes.tip.1':
    'Expandera finns bara i menyn när noteringen har text. En medlem som inte får redigera Samarbete ser bara Expandera.',
  'help.guide.note-categories.step.5':
    'Klicka på Spara. Alla noteringar i en kategori som har fått nytt namn eller ny färg ändras direkt, för alla medlemmar. Avbryt förkastar dina ändringar.',
  'help.guide.trip-chat.tip.5':
    'Chatten visar de senaste meddelandena först. Ladda äldre meddelanden överst i chatten läser in de tidigare meddelandena.',
  'help.guide.roadtrip-reorder.result':
    'Stoppen ligger i den ordning du valde, och avstånd, körtid och ankomsttider räknas om för varje dag du ändrade.',
  'help.guide.roadtrip-overnight.goal':
    'Hitta ett ställe att sova på vägen och lägg till natten på färden som en bokning.',
  'help.guide.roadtrip-overnight.tip.2':
    'Om du ställer tillbaka en bokad natt till Paus, via Redigera på dess kort, frågar TREK först Ta bort övernattningen? ”Gör till en paus” tar bort natten, med dess bokning och eventuell kopplad utgift, och behåller stoppet på färden.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Om du väljer det värde som stoppet redan har går stoppet tillbaka till ditt standardvärde.',
  'help.guide.roadtrip-bookings.tip.1':
    'Tiden vid terminalen sätts tidigare än tidtabellen för att ge utrymme för incheckning: en timme för flyg eller kryssning, en halvtimme för färja, tio minuter för tåg eller buss.',
  'help.guide.roadtrip-google-import.step.2':
    'Klistra in länken till en rutt som du delat från Google Maps och klicka på Förhandsgranskning.',
  'help.guide.roadtrip-hazards.goal': 'Se vädervarningar och katastrofvarningar runt din färd på kartan.',
  'help.ctx.trip-tours.title': 'Turer i planen',
  'help.guide.tour-show-list.title': 'Visa resans turer i planen',
  'help.guide.tour-show-list.tip.2':
    'Inga turer ännu? Importera GPX eller KML överst i listan importerar en fil, och Planera ny tur på fliken Turer skapar en ny.',
  'help.guide.tour-add-to-day.step.4':
    'Eller dra raden ut ur listan och släpp den på en dag i vänstra kolumnen. Släpper du den mellan två stopp hamnar den där.',
  'help.guide.tour-day-times.goal': 'Se när en tur slutar och om den överlappar med det som kommer härnäst samma dag.',
  'help.guide.tour-day-times.tip.4':
    'Spara i samling i samma meny sparar turen i en samling med sin rutt, precis som kortets knapp Samling gör.',
  'help.guide.tour-remove-from-day.tip.2':
    'Det finns inget Radera i de här menyerna eller på kortet. En tur raderas på fliken Turer, med papperskorgen på dess rad under Turer för den här resan.',
  'help.guide.tour-filter-list.tip.1':
    'Ruttgräns är den högsta svårighetsgrad som rutten planerades för att tillåta, inte den svårighetsgrad som mäts på leden.',
  'help.guide.tour-hide-on-map.step.3':
    'Medan någon tur är dold står det Dold på kartan på en rad ovanför listan, med antalet. Visa alla lägger tillbaka alla turer på en gång.',
  'help.guide.tour-import-plan-tab.step.3':
    'Förhandsvisning av importen visar varje spår innan något sparas. Välj typ under Importera som (Vandring, Cykeltur och så vidare) och klicka sedan på Importera 1 tur.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Nedanför kommer Resdagar, med en ruta för varje dag som turen ligger på, måtten med höjdprofilen och sedan, i den mån det gäller: stationerna på en stadspromenad, kontrollerna och vinden på en paddeltur, Faktiskt spår, Packlista, Beskrivning, Noteringar, Ursprung och Filer.',
  'help.guide.tour-detail-read.step.4':
    'Resdagar visar en ruta för varje dag som turen ligger på, med datum. Inte på någon dag på resan ännu betyder att turen fortfarande är oplanerad.',
  'help.guide.tour-detail-read.tip.5':
    'På en telefon öppnas kortet som ett blad underifrån, för läsning och för att ta med turen.',
  'help.guide.tour-rename-colour.tip.1':
    'Namn och färg hör till resan, så alla i den ser dem. Vill du dölja en tur på din egen karta utan att ändra den för någon annan använder du ögat i listan Turer.',
  'help.guide.tour-take-along.tip.1':
    'På en enhet som kan dela filer visas Dela bredvid GPX och skickar samma fil direkt till en annan app.',
  'help.guide.tour-copy-keep.step.2':
    'Kopian öppnas direkt, med originalets namn följt av (kopia). Klicka på pennan för att ge den ett eget namn.',
  'help.guide.tour-packing-link.title': 'Koppla en tur till packlistan',
  'help.guide.tour-packing-link.tip.2':
    'Byt i sektionens rubrik kopplar turen till en annan lista. Ta bort länk i den dialogen tar bort kopplingen, och listan förblir oförändrad.',
  'help.guide.tour-files.tip.1': 'Filerna är också resans filer, så de visas även på fliken Filer.',
  'help.guide.tour-activity-link.step.4': 'Kontrollera vad spåret mätte under Faktiskt och klicka sedan på Länka.',
  'help.guide.tour-activity-compare.step.1':
    'Öppna turens kort. Planerat och faktiskt visar planens Avstånd, Höjdmeter uppför, Höjdmeter nedför och Tid med pauser bredvid spårets värden, med Skillnad.',
  'help.guide.tour-origin-check.goal':
    'Ta reda på om en tur ritades i TREK eller importerades, från vilken fil, och om den har ändrats sedan dess.',
  'help.ctx.trip-tour-planner.title': 'Turer',
  'help.guide.tour-open-workspace.title': 'Hitta runt på fliken Turer',
  'help.guide.tour-open-workspace.step.7':
    'Klicka på en tur i högra spalten. En tur som planerats i TREK öppnas i redigeraren. Ett importerat spår öppnas oförändrat som GPX-tur, för visning.',
  'help.guide.tour-draw-route.step.2':
    'Skriv var turen startar i Sök plats eller adress och välj resultatet. Kartan flyttas dit.',
  'help.guide.tour-draw-route.tip.4':
    'Ett osparat utkast sparas. Öppna resans flik Turer igen, så återställs det och märks Osparat utkast återställt.',
  'help.guide.tour-type-profile.tip.1':
    'Byte av typ räknas som ett steg i historiken: Ångra ändring av ruttpunkt i spalthuvudet återställer den gamla typen och dess rutt.',
  'help.guide.tour-edit-points.step.4':
    'Eller öppna Fler åtgärder (de tre prickarna) på raden och välj Flytta ruttpunkt uppåt eller Flytta ruttpunkt nedåt.',
  'help.guide.tour-shaping-points.step.1':
    'Klicka på den ritade rutten på kartan där den ska gå annorlunda. En liten prick visas där: en formpunkt.',
  'help.guide.tour-loop-reverse.title': 'Gör en rundtur eller vänd turen',
  'help.guide.tour-loop-reverse.result': 'En slinga som slutar där den började, eller samma tur i motsatt riktning.',
  'help.guide.tour-leg-by-hand.tip.2':
    'En punkt som ingen stig når visar ett meddelande med Visa punkt och dess nummer. Flytta punkten till en stig eller rita sträckan dit för hand.',
  'help.guide.tour-trip-places.tip.1':
    'En plats som redan finns i turen är markerad I turen och kan inte väljas två gånger.',
  'help.guide.tour-details-times.step.3': 'Ange Pauser, till exempel 0:45. De läggs till den beräknade tiden.',
  'help.guide.tour-save.step.1': 'Skriv ett namn i Turens namn. Spara är gråat tills du har angett ett.',
  'help.guide.tour-edit-saved.title': 'Ändra en sparad tur',
  'help.guide.tour-edit-saved.tip.3':
    'Ladda ner GPX och Spara i en samling i spalthuvudet fungerar när ändringarna är sparade.',
  'help.guide.tour-summary-profile.tip.1': 'Klicka på kortets titel för att fälla ihop hela översikten.',
  'help.guide.tour-list-manage.step.3': 'Välj dag. Turen läggs till den dagen, och dess rad visar dagen.',
  'help.guide.tour-delete.goal': 'Ta bort en tur från resan för gott.',
  'help.guide.tour-saved-elsewhere.goal':
    'Bestäm vad som ska hända när någon annan sparade turen medan du ändrade den.',
  'help.ctx.trip-tour-import.title': 'Importera turer',
  'help.guide.tour-import-gpx.goal':
    'Gör ett spår från en GPS-klocka, en app eller Google Earth till en tur i resan, med kontroll innan något sparas.',
  'help.guide.tour-import-gpx.tip.3':
    'Ett spår som resan redan har är gråat och märkt Finns redan i resan, och hoppas över.',
  'help.guide.tour-view-import.step.3': 'Tillbaka till turer, pilen uppe till vänster, stänger den igen.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK väljer kontrollpunkter från spåret och ruttplanerar dem på nytt. Kartan ritar importen prickad och förslaget heldraget, och kortet jämför deras längder, andelen Inom 50 m av spåret och Största avvikelse.',
  'help.guide.tour-restore-recorded.title': 'Gå tillbaka till det inspelade spåret',
  'help.guide.tour-take-over.title': 'Ta över en tur från en annan resa',
  'help.guide.tour-take-over.tip.1':
    'Kopian är en egen tur. Den ligger ännu inte på någon dag, och senare ändringar i originalet påverkar inte kopian, och tvärtom. Dess Ursprung anger resan den togs över från.',
  'help.guide.tour-import-wanderer.step.3':
    'Klicka på en led. Den visas på kartan, och kolumnen visar vad dess GPX-fil mäter, beskrivningen och om den är offentlig eller privat i wanderer.',
  'help.ctx.trip-tour-map.summary':
    'Kartan i mitten av fliken Turer, för den tur du har öppen: de kartor som passar dess typ, pisterna eller sjömärkena som visas ovanpå dem, platserna längs rutten och samma tur i 3D på det verkliga landskapet.',
  'help.guide.tour-map-layers.step.1':
    'Öppna fliken Turer och klicka på en tur under Turer för den här resan till höger. Den öppnas i planeraren, och etiketten nere till vänster på kartan listar de kartor som den här sortens tur erbjuder.',
  'help.guide.tour-along-search.goal':
    'Leta efter utsiktspunkter, vatten, stugor eller ett ställe att äta nära rutten för turen du planerar.',
  'help.guide.tour-along-search.tip.2': 'På en stadspromenad väljer fyra teman ovanför listan rätt typer åt dig.',
  'help.guide.tour-along-add-stop.result':
    'Turen går nu förbi platsen, med nytt avstånd och ny tid i Turöversikt. Spara turen för att behålla ändringen.',
  'help.guide.tour-3d-terrain.step.3':
    'Klicka på etiketten Lutningsfördelning till höger. Den fälls ut och visar hur stor del av turen som går lägre än 5 %, 5 till 10 %, 10 till 18 %, 18 till 27 % och 27 % och mer. När den är hopfälld visas högsta punkten och den brantaste sträckan.',
  'help.guide.tour-3d-flyover.goal': 'Titta på hela turen från start till mål innan du går, cyklar eller åker den.',
  'help.guide.tour-3d-flyover.tip.3':
    'När flygningen är pausad kan du flytta dig längs höjdprofilen för att flytta pricken till den punkten. Spela upp överflygning fortsätter därifrån.',
  'help.guide.tour-map-overlays.tip.1':
    'Pisterna är kartlagda data, inte en live-rapport: de säger inget om vad som är öppet eller preparerat, om snön eller om laviner. När du zoomar ut bortom skidområdet står det Zooma in för att se pisterna på reglaget.',
  'help.ctx.trip-tour-stages.bullet.4':
    'I Turer för den här resan visar en flerdagarstur en måne med antalet etapper. Knappen Visa etapper fäller ut listan med etapper, med dagen som varje etapp ligger på, och totalerna för Hela turen.',
  'help.guide.tour-multi-day.step.5':
    'Turöversikt listar varje etapp under Etapper. Klicka på en för att se var den slutar: dess sista stopp markeras och höjdprofilen markerar platsen.',
  'help.guide.tour-stages-on-days.goal': 'Lägg varje etapp på en egen dag, eller hela turen på en dag.',
  'help.guide.tour-stages-on-days.tip.2':
    'Hela turen den här dagen är gråat på en dag som redan har turen. Etapper från den här dagen fungerar ändå där och ersätter hela turen den dagen.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Rubriken på kortet Vägpunkter har ruttverktygen: Vänd riktning, Tillbaka till start och, på en vandring, Rundtur från starten. Fler åtgärder på ett stopp har Jämför vägar för nästa etapp.',
  'help.guide.tour-hike-plan.step.3': 'Skriv ett namn under Turens namn.',
  'help.guide.tour-hike-plan.tip.4':
    'Gångtiden följer vandringsskyltsregeln (DIN 33466) och räknar inte med pauser. Lägg till dem under Pauser i Detaljer, så visas de i den planerade totalen.',
  'help.guide.tour-hike-trail-details.result':
    'Du vet vilka delar av vandringen som har vilken svårighetsgrad, vad de består av och var de ligger på kartan.',
  'help.guide.tour-hike-round.step.3':
    'Klicka på Hitta rundor. Runda A, Runda B och så vidare visas i listan och på kartan, var och en i sin egen färg.',
  'help.guide.tour-hike-compare-ways.goal':
    'Se vilka andra stigar en vandring kan ta mellan två stopp, och välj en av dem.',
  'help.guide.tour-hike-compare-ways.tip.3': 'Avbryt stänger kortet och ändrar inte rutten.',
  'help.guide.tour-ferrata-add.result':
    'Vandringen följer via ferratan på dess egen linje från OpenStreetMap. Klicka på kartan för att fortsätta från toppen. Ruttplaneraren planerar bara vägen till via ferratan och vägen efter den.',
  'help.guide.tour-run-plan.step.2':
    'Välj en Profil: Löpning för mest hårdgjorda vägar i stan, i parker och längs floder, Traillöpning för skogsvägar och naturliga stigar.',
  'help.guide.tour-run-plan.tip.4': 'Traillöpning använder stigar upp till bergsstigar (T2), aldrig svårare.',
  'help.guide.tour-run-ways.tip.2':
    'Byt Profil till Traillöpning om rutten ska ta fler naturliga stigar, eller till Löpning om den ska hålla sig på fast mark.',
  'help.guide.tour-walk-plan.title': 'Planera en stadspromenad från stopp till stopp',
  'help.guide.tour-walk-plan.tip.1':
    'Ringen runt ett stopps nummer visar hur viktigt det är: hel för Måste ses, streckad för Valfritt. En liten sköld markerar ett stopp som är Skyddad.',
  'help.guide.tour-walk-sights.step.3':
    'Klicka på Sök längs turen. En stjärna före ett namn markerar en Höjdpunkt, en av de mest kända platserna här.',
  'help.guide.tour-walk-day-times.goal':
    'Ta reda på när du når varje stopp under promenadens dag, och vilka platser som är stängda då.',
  'help.guide.tour-walk-day-times.tip.4':
    'Två promenader på samma dag: klicka på sträckan mellan dem i fliken Planering (Ändra färdsätt) och välj Kollektivtrafik. Sökningen utgår från där den första promenaden slutar, vid den tid den slutar, och varnar dig om en förbindelse kommer fram efter att nästa promenad har börjat.',
  'help.guide.tour-walk-google-import.tip.1':
    'Bara en rutt som planerats till fots läses in. Växla Google Maps till gång innan du delar den.',
  'help.guide.tour-walk-check-off.step.3':
    'Klicka på Markera som besökt på ett stopp som du har sett, eller på Hoppa över på ett som du utelämnar.',
  'help.ctx.trip-tour-bike.bullet.1':
    'Profil under Turtyp anger vilken sorts cykling ruttplaneraren planerar för: Tur, Landsväg, Grus eller MTB. Raden under anger vad ruttplaneraren letar efter, och om du ändrar profilen planeras hela rutten om.',
  'help.guide.tour-bike-profile.step.3':
    'Välj Tur, Landsväg, Grus eller MTB under Profil. Raden under anger vad ruttplaneraren letar efter med den profilen.',
  'help.guide.tour-bike-profile.tip.4':
    'Spara är gråat tills turen har ett namn och rutten och dess höjder är beräknade.',
  'help.guide.tour-bike-surfaces.result':
    'Kartan markerar sträckorna för raden du valde, och du ser vilka underlag rutten använder. Själva turen ändras inte.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'I kortet Underlag och vägar läser du Svårighetsgrad (mtb:scale): andelen av rutten från S0, inga särskilda svårigheter, upp till S4 och uppåt, terräng för experter.',
  'help.ctx.trip-tour-ski.summary':
    'En tur av typen Skidor och vinter på fliken Turer: en dag i pisterna, en längdskidslinga, en topptur, en snöskovandring eller en vinterpromenad. Sträckorna följer backar, liftar och spår som finns kartlagda i OpenStreetMap och planeras av pistruttplaneraren för din gren och dina gränser. Ett inspelat skidspår importeras med sin gren.',
  'help.guide.tour-ski-plan.step.1': 'Klicka på Planera ny tur överst i vänstra spalten på fliken Turer.',
  'help.guide.tour-ski-plan.tip.3':
    'Om du byter gren senare behålls dina punkter, och sträckorna planeras om med de alternativ som den grenen använder.',
  'help.guide.tour-ski-options.step.4':
    'Använd reglagen: Åk liftar, Tillåt friåkningsvägar, Åk lift ner vid behov och Undvik gissade länkar. Längdskidor lägger till Bara preparerade spår och Bara upplysta spår, och Topptur lägger till Gå upp längs pistkanten.',
  'help.guide.tour-ski-fix-leg.step.1':
    'En sträcka som ruttplaneraren inte kunde planera visar en röd rad under sin punkt, med orsaken, till exempel ”Bara en lift du uteslutit förbinder de här punkterna”, och backen eller liften det gäller.',
  'help.guide.tour-ski-summary.title': 'Läs en skidturs pistrutt',
  'help.guide.tour-ski-summary.tip.4':
    'Längst ned på kortet står skidområdena och datumet för kartdatan som turen planerades på.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Om pisterna slutar laddas visar reglaget ett varningsmärke. Kartan och din rutt fungerar ändå.',
  'help.guide.tour-ski-import.step.4': 'Klicka på Importera 1 tur.',
  'help.ctx.trip-tour-paddle.summary':
    'En kajak-, kanot- eller SUP-tur på en flod eller en sjö. Den anger sin båt och sitt vatten, följer vattnet där TREK har data, räknar in bärsträckor och slussar i tiden och visar vinden den dag du paddlar samt vad som är känt om hindren på vägen.',
  'help.guide.tour-paddle-setup.goal':
    'Starta en kajak-, kanot- eller SUP-tur och ange vad du paddlar, på vilket vatten och med vilken fart.',
  'help.guide.tour-paddle-setup.tip.1':
    'Med Båt inställd på Andra finns ingen föreslagen fart. Ange en, annars förblir tiden på vattnet tom.',
  'help.guide.tour-paddle-water-route.step.2':
    'Om du vill att en sträcka ska planeras på vattnet pekar du på stoppet före den och klickar på Fler åtgärder, de tre prickarna.',
  'help.guide.tour-paddle-water-route.result':
    'Varje sträcka följer vattnet eller är avsiktligt ritad för hand, och en sträcka som TREK inte kunde planera anger varför.',
  'help.guide.tour-paddle-portage.tip.1':
    'Vill du ändå paddla sträckan öppnar du Fler åtgärder på punkten igen och väljer Paddla den här sträckan igen. Den blir då åter en sträcka som är ritad för hand.',
  'help.guide.tour-paddle-lock.step.3': 'Klicka på kortet Sluss för att öppna det.',
  'help.guide.tour-paddle-time.step.1':
    'Tidsuppskattning finns i vänstra kolumnen under vägpunkterna. Märket i rubriken är totalen, inklusive pauser.',
  'help.guide.tour-paddle-time.result':
    'Uppskattningen räknar med det du har angett och anger vad som fortfarande saknas.',
  'help.guide.tour-paddle-wind.tip.2':
    'En tur på flera dagar visar ett Dag-chip för varje dag i kortets rubrik. Klicka på ett för att se den dagen.',
  'help.guide.tour-paddle-checklist.step.3':
    'Posterna följer rutten: dammar, slussar, forsar, sjösättningsplatser och tillträdesregler från OpenStreetMap, samt dina egna bärsträckor och slussar, märkta Egna.',
  'help.guide.tour-paddle-checklist.result': 'Varje post på rutten har ett beslut, och du har läst säkerhetsnoten.',
  'help.guide.tour-paddle-track-marks.step.6': 'Klicka på Sluss och klicka sedan på linjen där slussen ligger.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Ställ in Turtyp på Ridtur i redigeraren, så visas kortet Ridleder i vänstra kolumnen. Sök i kartvyn listar lederna i kartvyn.',
  'help.guide.tour-horse-plan.step.2':
    'Klicka på fältet Turtyp under Turens namn och välj Ridtur. Kortet Ridleder visas under Vägpunkter.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK räknar inte ut någon ridtid för en ridtur. Ange en under Planerat i Detaljer om du vill ha en tid på dagen.',
  'help.guide.tour-horse-gap.step.3': 'Klicka på Ta delsträcka. Knappen är gråad tills reglaget är på.',
  'help.guide.tour-horse-recorded.step.1':
    'Klicka på Lägg till tur (+) i Turer för den här resan, välj Importera GPX eller KML och välj filen med din ridtur.',
  'help.guide.dateless-trip.title': 'Planera en resa utan datum',
  'help.guide.trip-reminder.step.2':
    'Under Påminnelse väljer du 1, 3 eller 9 dagar. Vill du ha en annan förvarning klickar du på Anpassat och skriver ett antal dagar mellan 1 och 30.',
  'help.guide.upcoming-reservations.title': 'Hoppa till dina nästa bokningar',
  'help.guide.half-company-holiday.title': 'Markera en halv företagshelgdag',
  'help.guide.edit-holiday-calendar.step.2':
    'Klicka på färgrutan för att välja en ny färg, eller skriv en ny etikett och tryck på Enter.',
  'help.guide.person-color.step.1': 'Klicka på den färgade pricken före namnet i kortet Personer.',
  'help.guide.answer-fusion-request.title': 'Svara på en sammanslagningsförfrågan',
  'help.guide.log-for-partner.title': 'Logga dagar åt någon du planerar med',
  'help.guide.dissolve-fusion.title': 'Sluta planera tillsammans',
  'help.guide.country-places.goal':
    'Lista de platser som TREK räknar till ett land, för att kontrollera vad du gjorde där eller hitta en plats som TREK har placerat i fel land.',
  'help.guide.regions.tip.3':
    'Lägg till på bucketlistan fungerar även för en region. Regionen visas med samma snedstreck som ett land på din bucketlista.',
  'help.guide.tour-activity-stats.step.2':
    'Välj period och typ med de två knapparna till vänster. Period erbjuder Hela tiden, I år, Senaste 12 månaderna och varje tidigare år som du har turer i. Typ begränsar siffrorna till en sorts tur, eller Alla typer.',
  'help.guide.tour-activity-stats.tip.3':
    'En dag som anger deltagare räknas bara för dem. En dag som inte anger någon räknas för alla på resan. Fliken läser in aktuella data och kräver internetanslutning.',
  'help.guide.move-to-list.goal':
    'Organisera om dina listor genom att flytta platser mellan dem eller kopiera dem till en annan.',
  'help.guide.accept-list-invite.result':
    'Listan visas under Delad i spalten och öppnas med sina platser. Ändringar som medlemmarna gör visas direkt.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Öppna listan. Sparade turer ligger först, ovanför platserna. Klicka på Lägg till i en resa vid turen, eller på själva raden.',
  'help.guide.tour-collection-manage.title': 'Hitta och ta bort sparade turer',
  'help.guide.tour-collection-manage.result': 'Turen tas bort från listan, och ett kort meddelande bekräftar det.',
  'help.guide.entry-draft.title': 'Behåll ett inlägg som utkast',
  'help.guide.journey-map-layers.step.1':
    'Överst på kartan finns lagerfältet med Planering, Inspelat, Inlägg och Foton, var och en med sitt antal. Klicka på ett lager för att dölja eller visa det.',
  'help.guide.journey-keep-route.step.1': 'Klicka på Dawarich-knappen Ta över inspelningen i dagens rubrik.',
  'help.guide.journey-day-stays.step.1':
    'En dag med vistelser att granska avslutas med en rad som 4 vistelser från Dawarich och tidsspannet. Klicka på raden för att visa vistelserna.',
  'help.guide.journey-take-over-day.step.1':
    'Klicka på Ta över dag i slutet av dagens rad med vistelser, eller på listknappen i dagrubriken, som visar hur många vistelser som väntar.',
  'help.guide.journey-auto-prepare.goal':
    'Låt varje dags vistelser förberedas för granskning automatiskt medan en resa pågår.',
  'help.guide.photo-location.goal': 'Placera inlägg på kartan utan att söka efter en plats för varje inlägg.',
  'help.ctx.settings-about.bullet.1': 'Versionen som den här servern kör visas bredvid titeln.',
  'help.guide.readability.tip.3':
    'Läsbarhet är märkt Experimentell. Om något ser fel ut klickar du på Återställ till standardinställningarna längst ned på fliken för att återställa standardinställningarna.',
  'help.guide.web-push-device.goal': 'Se TREK-meddelanden på mobilen eller datorn även när TREK är stängt.',
  'help.guide.connect-airtrail.tip.2':
    'Nyckeln lagras krypterad och visas aldrig igen. Prickar i fältet betyder att en nyckel är sparad.',
  'help.guide.connect-dawarich.tip.2':
    'Under knapparna visar kortet när TREK senast kontrollerade och vad din Dawarich-version inte erbjuder.',
  'help.guide.tour-connect-wanderer.tip.2':
    'En instans på en privat adress kan kräva att admin tillåter interna nätverk.',
  'help.guide.tour-wanderer-watch.tip.2':
    'Pausad till betyder att wanderer inte svarade. Token nekad betyder att token behöver ett lyckat anslutningstest eller att du behöver en ny token.',
  'help.guide.plugin-settings.result':
    'Pluginet fungerar med dina inställningar, och varje åtgärd det utför åt dig visas under Plugin-aktivitet.',
  'help.ctx.admin-defaults.bullet.3':
    'Länken ”Återställ” bredvid ett fält som du har angett återställer TREK:s eget standardvärde. En användares egen inställning gäller alltid före dessa.',
  'help.ctx.admin-settings.bullet.5': 'Farozon: Rotera JWT-hemlighet loggar ut alla användare, dig själv inräknad.',
  'help.guide.default-user-settings.step.1':
    'Under Standardinställningar för användare väljer du Färgläge (Ljust, Mörk eller Auto), Temperaturenhet, Avståndsenhet, Tidsformat, Vecka börjar på, Visningsvaluta och om Blurra bokningskoder är På eller Av. Varje val sparas direkt.',
  'help.guide.admin-passkeys.step.2':
    'Ange ”Relying Party ID” (domän), till exempel trek.example.org, och ”Allowed origins” som din TREK nås på, och klicka sedan på Spara. Lämna båda tomma för att använda APP_URL.',
  'help.guide.rotate-jwt-secret.title': 'Logga ut alla på en gång',
  'help.guide.notification-defaults.step.2':
    'Klicka på en cell för att växla till nästa läge: På, Av, Blockerad. Verktygstipset anger nästa läge, och varje klick sparas direkt.',
  'help.ctx.notifications.bullet.2':
    'Alla och Olästa överst växlar mellan alla meddelanden och bara de du inte har läst. Listan läser in fler när du rullar.',
  'help.guide.read-notifications.step.3':
    'Klicka på knappen under ett meddelande, Visa Vacay här, för att öppna det som meddelandet gäller. Då markeras det också som läst.',
  'help.guide.filter-notifications.step.3':
    'Klicka på Olästa för att bara se meddelanden som du inte har läst. Alla visar samtliga igen.',
  'help.guide.mark-notifications-read.tip.2':
    'Att markera som läst ändrar bara bakgrundsfärgen och räknaren. Meddelandet ligger kvar i listan tills du raderar det.',
  'help.guide.delete-notifications.result': 'Meddelandet tas bort från listan och från klockan.',
  'help.guide.notification-settings.result':
    'Inställningar öppnas på Meddelanden, med ett reglage per händelse och kanal.',
  'help.guide.link-journal.goal': 'Visa en av dina Journey-dagböcker i resan, för de personer du väljer.',
  'help.guide.link-journal.tip.3':
    'Senare har Dagbok i Reseinställningar Redigera åtkomst, Byt dagbok och Koppla ifrån. Om du kopplar ifrån försvinner fliken. Personer som du lade till i själva dagboken behåller sin åtkomst.',
  'help.guide.dawarich-stays.result':
    'Vistelsen är en plats på resan, på dagen du valde eller under Oplanerat, och panelen markerar den som hanterad.',
  'help.ctx.trip-days.bullet.7': 'Medan resan pågår öppnas planen på dagens datum och rullar dit.',
  'help.guide.leave-stop-off-route.tip.2':
    'Ta bort från dagen tar i stället bort stoppet från dagen. Uteslut från rutten behåller det i planen.',
  'help.guide.move-booking-day.goal':
    'Flytta en transport eller en bokning till en annan dag direkt från planen, utan att öppna dess formulär.',
  'help.guide.place-image-from-file.result':
    'Fotot är platsens bild på kortet, i platskolumnen, i dagen och på kartan.',
  'help.guide.place-own-hours.step.3':
    'Öppettider under dem visar veckan, en rad per dag. Där TREK har hittat tider för platsen är de redan ifyllda, annars klickar du först på Lägg till öppettider. Skriv när varje dag öppnar och stänger, och klicka på Stängd för en dag då platsen inte har öppet.',
  'help.guide.add-accommodation.tip.5':
    'GPX-spår och turplatser erbjuds aldrig som boende, bara vanliga platser på resan.',
  'help.guide.confirm-stay-booking.step.1':
    'Öppna dagen då du checkar in. På vistelsens kort, under Bokning, ser du hotellbokningen för den natten, med Väntande eller Bekräftat. Klicka på den rutan.',
  'help.guide.tour-map-lines.step.4':
    'Om du vill ta bort en tur från kartan växlar du högerkolumnen till Turer, pekar på turen och klickar på ögat, Dölj på kartan. Turens linje och nål försvinner från kartan, och raden ligger kvar i listan, nedtonad, med ett överstruket öga, Visa på kartan, som visar turen igen.',
  'help.guide.car-stops.step.1':
    'Klicka på + i rubriken för den dag då du hämtar bilen, vars verktygstips lyder Lägg till i denna dag, och välj Lägg till transport.',
  'help.guide.car-stops.tip.2': 'Flytta upp och Flytta ner visas först när färden har två stopp eller fler.',
  'help.guide.transport-details.title': 'Öppna en transport och använd dess detaljer',
  'help.guide.transport-details.tip.1': 'På kartan igen, på en färd vars linje är ritad, slår av linjen.',
  'help.guide.export-transports-csv.result':
    'Webbläsaren sparar en fil med resans namn, till exempel hosten-i-japan-transports.csv, med en rad per färd: Typ, Titel, Status, Start, Slut, Från, Till, Plats, Bekräftelse och Noteringar.',
  'help.guide.group-sort-bookings.goal':
    'Ordna korten eller listan efter status, dag eller typ, i den ordning du vill.',
  'help.guide.booking-on-map.tip.1':
    'På kartan finns bara för en bokning med en plats. Välj en under Plats / Aktivitet i formuläret, så visas knappen.',
  'help.guide.export-bookings-csv.step.2':
    'Öppna Visningsalternativ, reglagen efter vyikonerna, och välj en ordning under Sortera efter. Raderna följer den, en rad per bokning och utan avsnitt.',
  'help.guide.edit-booking.tip.4':
    'Om du har ändrat något frågar TREK Slänga ändringarna? när du klickar utanför formuläret eller trycker på Escape. Fortsätt redigera tar dig tillbaka till formuläret.',
  'help.guide.arrange-packing-list.step.2':
    'Inne i en lista flyttar du ett föremål uppåt eller nedåt genom att dra i greppet till vänster på raden. En linje i din accentfärg vid radens vänstra kant visar var det hamnar.',
  'help.guide.count-packed-pieces.goal': 'Ange antal för ett föremål och markera dess delar som packade en i taget.',
  'help.guide.count-packed-pieces.tip.3': 'Vid antalet ett visas ingen räknare, bara kryssrutan.',
  'help.guide.expense-receipts.step.2':
    'Klicka på Bifoga bredvid Kvitton & fakturor och välj fotot eller PDF-filen. Du kan också välja flera samtidigt. Varje fil listas under rubriken, med en papperskorg för att ta bort den.',
  'help.guide.files-sync-settings.goal':
    'Bestäm om dokument bara importeras från ditt arkiv, bara exporteras till det, eller både och, och vad som händer när ett dokument raderas eller ändras på båda ställena.',
  'help.guide.files-sync-settings.tip.2':
    'Med Fråga mig väntar ett dokument som ändrats på båda ställena under Behöver ses över, under kortet. Klicka på Lös och välj Behåll TREK-versionen, Behåll leverantörens version eller Behåll båda.',
  'help.guide.manage-notes.goal':
    'Öppna en notering i sin helhet, håll den viktiga överst och rätta eller ta bort det som är inaktuellt.',
  'help.guide.manage-notes.tip.2':
    'Medan du redigerar raderar det röda krysset på en fil som redan är bifogad den direkt, innan du klickar på Spara, och filen går inte till papperskorgen. Varje fil på en notering visas också i resans flik Filer.',
  'help.guide.note-categories.step.6':
    'Tillbaka i kortet Noteringar filtrerar knapparna under rubriken korten. Klicka på en kategori för att bara se dess noteringar. Alla, eller samma knapp igen, visar alla.',
  'help.guide.roadtrip-reorder.tip.1':
    'Om du flyttar ett stopp här flyttas det också i dagsplanen: Dagar visar samma ordning.',
  'help.guide.roadtrip-overnight.step.1':
    'Markera Boende under Söker efter i Längs rutten, eller Campingplats för en tomt, välj dagen du vill stanna på och klicka på Sök.',
  'help.guide.roadtrip-overnight.tip.3':
    'Med Börja och avsluta varje dag vid ditt boende på, under Ruttlinje i Körinställningar, startar nästa dags färd där du sov.',
  'help.guide.roadtrip-stop-fill.title': 'Ange hur fullt ett stopp är',
  'help.guide.roadtrip-bookings.title': 'Ta med flyget, tåget eller färjan i färden',
  'help.guide.roadtrip-bookings.tip.2':
    'Ett bord eller en biljett som är bokad vid ett stopp visas som en etikett på det stoppet. Allt som inte hör till något stopp listas under Även bokat denna dag.',
  'help.guide.roadtrip-google-import.step.3':
    'Kontrollera stoppen som hittades. Varje stopp visar var det ligger. Ett stopp som är märkt ”Location unresolved” hoppas över.',
  'help.guide.roadtrip-hazards.step.1': 'Öppna Körinställningar i högerkolumnen.',
  'help.ctx.trip-tours.summary':
    'Högerkolumnen på fliken Planering i läget Turer: alla resans turer i en lista, bredvid dagarna. Härifrån lägger du turer på dagar, filtrerar listan, döljer linjer på kartan och importerar GPX- eller KML-filer. Rutter ritas och ändras på fliken Turer.',
  'help.guide.tour-show-list.goal':
    'Byt ut platskolumnen mot resans turer, så att du kan se och välja dem bredvid dagarna.',
  'help.guide.tour-show-list.tip.3':
    'När tillägget Turer är på visas spår aldrig i listan Platser: varje importerat spår är en tur och listas här.',
  'help.guide.tour-add-to-day.step.5':
    'En tur med etapper frågar sedan vidare, i samma meny. Etapper från den här dagen lägger etapp 1 på den dagen och varje följande etapp på dagen efter. Hela turen den här dagen lägger allt på just den dagen.',
  'help.guide.tour-day-times.step.1':
    'Peka på turens rad i dagkolumnen, klicka på Fler alternativ (de tre prickarna) och välj Redigera.',
  'help.guide.tour-day-times.result':
    'Turen visas i dagens tidslinje med start och slut, precis som alla andra tidsatta stopp.',
  'help.guide.tour-remove-from-day.result':
    'Dagen listar inte längre turen, och dess rad i listan har inget märke Dag.',
  'help.guide.tour-filter-list.tip.2':
    'Ett avsnitt visas bara när turerna skiljer sig åt i det, så en kort lista kan erbjuda bara Status.',
  'help.guide.tour-hide-on-map.tip.1':
    'Att dölja gäller bara dig och sparas i den här webbläsaren för den här resan: turen, dess dagar och dess färg ändras inte, och turen syns kvar på andras kartor.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Ett spår som redan finns i resan är märkt Finns redan i resan och importeras inte två gånger.',
  'help.ctx.trip-tour-detail.bullet.4':
    'Raden längst ned: Lägg till i dagen eller Ta bort från dag medan en dag är öppen, Navigering till starten, turens webbsida, GPX, Dela där din enhet kan dela filer, Samling och Kopiera.',
  'help.guide.tour-detail-read.step.5':
    'Nedanför kommer måtten: Avstånd, Lägsta höjd, Högsta höjd, Höjdmeter uppför och Höjdmeter nedför, tiderna under dem och höjdprofilen i samma färg som turens linje.',
  'help.guide.tour-detail-read.result':
    'Turens kort är öppet bredvid planen, och du ser vilka dagar den ligger på, hur lång och hur brant den är och var den kommer ifrån.',
  'help.guide.tour-rename-colour.tip.2': 'Pennan och pricken fungerar bara för medlemmar som får redigera platser.',
  'help.guide.tour-take-along.tip.2':
    'Välj en föredragen kartapp i Inställningar, så öppnar Navigering den appen direkt i stället för att visa en lista.',
  'help.guide.tour-copy-keep.step.3':
    'Om du vill spara en tur för andra resor öppnar du den och klickar på Samling längst ned på kortet.',
  'help.guide.tour-packing-link.goal':
    'Visa vad som ska packas för en tur direkt i dess kort, från resans packlista eller en av dess listor.',
  'help.guide.tour-packing-link.tip.3':
    'För att länka krävs rätt att redigera platser. Alla andra ser den länkade listan men kan inte ändra länken.',
  'help.guide.tour-files.tip.2': 'Ladda upp visas bara för medlemmar som får ändra turen och lägga till filer.',
  'help.guide.tour-activity-link.step.5':
    'Spåret visas nu under Faktiskt spår, med egna värden och en egen profil bredvid planen.',
  'help.guide.tour-activity-compare.step.2':
    'Största avstånd från planen visar det största avståndet mellan spåret och den planerade linjen, och Utanför planen visar hur stor del av spåret som låg utanför den linjen.',
  'help.guide.tour-origin-check.step.1':
    'Öppna turens kort och rulla till Ursprung. Källa anger varifrån turen kommer: GPX-import med filens namn, KML- eller KMZ-import, eller wanderer med sin adress.',
  'help.ctx.trip-tour-planner.summary':
    'Resans turplanerare: redigeraren till vänster, alla resans turer till höger och kartan mellan dem. Här ritar du en tur punkt för punkt, ruttplanerar den längs verkliga stigar och vägar, lägger till detaljer och sparar den i resan.',
  'help.guide.tour-open-workspace.goal': 'Öppna turplaneraren och få veta vad varje del av den används till.',
  'help.guide.tour-open-workspace.tip.1':
    'Dölj, på fliken vid innerkanten av varje spalt, döljer spalten så att kartan får mer plats. Planering och Turer för den här resan visar spalterna igen. Dra i en spalts kant för att göra den bredare eller smalare.',
  'help.guide.tour-draw-route.step.3':
    'Kontrollera att Lägg till punkt under Vägpunkter är på (det är samma reglage som Sätt punkter i kartans knapp) och klicka sedan på kartan där turen startar.',
  'help.guide.tour-draw-route.result':
    'En numrerad rutt på kartan och dess punkter under Vägpunkter, redo att få ett namn och sparas.',
  'help.guide.tour-type-profile.tip.2':
    'Vissa typer kräver mer innan de kan sparas: en Löptur sitt Planerat tempo, en Paddeltur sin båt och sitt vatten, en tur av typen Skidor och vinter sin gren.',
  'help.guide.tour-edit-points.step.5': 'Ta bort ruttpunkt, papperskorgen bredvid, tar bort punkten från turen.',
  'help.guide.tour-shaping-points.step.2':
    'Dra pricken till den stig som rutten ska följa. Rutten planeras om via den.',
  'help.guide.tour-loop-reverse.goal': 'Låt turen sluta där den började, eller vänd riktningen.',
  'help.guide.tour-leg-by-hand.title': 'Rita en sträcka för hand eller planera den om',
  'help.guide.tour-leg-by-hand.result':
    'Sträckan blir en rak linje där du valde, märkt som ritad för hand, eller så ruttplaneras den om.',
  'help.guide.tour-trip-places.tip.2':
    'Om du tar bort stoppet eller kopplar loss det ligger platsen kvar i resan som den är, inklusive dess dagar.',
  'help.guide.tour-details-times.step.4':
    'Planerat visar totalen. Skriv in en egen för att åsidosätta den. Den märks då Manuellt värde.',
  'help.guide.tour-save.step.2':
    'Vänta tills pricken bredvid Ny tur har försvunnit. Spara kräver rutten och alla dess höjder.',
  'help.guide.tour-edit-saved.goal': 'Öppna en tur som du planerat tidigare, ändra den och spara den igen.',
  'help.guide.tour-edit-saved.result': 'Den sparade turen innehåller nu dina ändringar.',
  'help.guide.tour-summary-profile.tip.2':
    'En rutt som klättrar på en via ferrata får ett varningsmärke med sin svårighetsgrad ovanför siffrorna.',
  'help.guide.tour-list-manage.step.4':
    'Knappen ovanför Resans omfattning är filtret. Den anger den status den visar, först Alla, med antalet turer.',
  'help.guide.tour-delete.step.1':
    'Peka på turen under Turer för den här resan och klicka på papperskorgen till höger på dess rad, Radera följt av turens namn.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Den här turen sparades någon annanstans visas överst i spalten medan du redigerar. Dina ändringar finns kvar tills du bestämmer dig.',
  'help.ctx.trip-tour-import.summary':
    'Här importerar du turer som redan finns någon annanstans till resan: en GPX-, KML- eller KMZ-fil från en klocka eller en app, en tur från en annan av dina resor eller en led från din egen wanderer. En import sparas exakt som den spelades in, och du kan planera en redigerbar version utifrån den.',
  'help.guide.tour-import-gpx.step.1':
    'Öppna resans flik Turer. Klicka på + (Lägg till tur) överst i Turer för den här resan till höger.',
  'help.guide.tour-import-gpx.tip.4':
    'En KML- eller KMZ-fil visar också under Importeras inte vad den innehöll utöver sina linjer: nålar, områden och andra objekt.',
  'help.guide.tour-view-import.tip.1':
    'En import kan inte redigeras punkt för punkt. Planera en redigerbar version, i kortet Redigerbar version ovanför, skapar en tur av den som du kan ändra.',
  'help.guide.tour-plan-from-import.step.3':
    'Klicka på Ersätt importen för att planera om den här turen på plats: dess dagar och anteckningar finns kvar, och det inspelade spåret sparas så att du kan återställa det. Planera som ny tur ändrar inte importen utan skapar en andra tur bredvid den.',
  'help.guide.tour-restore-recorded.goal':
    'Ångra omplaneringen av en import och få tillbaka det ursprungliga spåret, även långt senare.',
  'help.guide.tour-take-over.goal':
    'Återanvänd en tur som du redan har planerat eller importerat i en annan av dina resor, utan att rita den igen.',
  'help.guide.tour-take-over.tip.2':
    'Bara dina andra resor listas, och bara de första 100 turerna. Använd sökning eller filter för att hitta resten.',
  'help.guide.tour-import-wanderer.step.4': 'Klicka på Importera till resan.',
  'help.ctx.trip-tour-map.bullet.1':
    'Knappen nere till vänster på kartan har de baskartor som den öppna turens typ erbjuder: Karta, Topo, Vandring på en vandring, Cykel på en cykeltur och Satellit. Det du väljer där gäller bara planeraren och ändrar aldrig kartinställningen i Inställningar.',
  'help.guide.tour-map-layers.step.2':
    'Klicka på Topo för höjdkurvor och skuggad relief, kartan som visar hur brant marken är. Kartan du valde förblir markerad i knappen.',
  'help.guide.tour-along-search.step.1':
    'Öppna en tur på fliken Turer och rulla den vänstra panelen ned till Längs turen, under turens stopp. Kortet finns när turen har en rutt.',
  'help.guide.tour-along-search.tip.3':
    'Resultaten kommer från OpenStreetMap och TREK:s platsindex, så sökningen kräver en anslutning. När inget hittas provar Vidga till nästa avstånd. När en server är upptagen visar Försök igen en nedräkning tills du kan försöka igen.',
  'help.guide.tour-along-add-stop.tip.1':
    'Platsen blir ett stopp på turen, inte en plats på resan, så den visas inte i platslistan.',
  'help.guide.tour-3d-terrain.step.4':
    'Dra reglaget Relief för att göra kullarna upp till tre gånger så höga, vilket hjälper i svagt kuperad terräng.',
  'help.guide.tour-3d-flyover.step.1':
    'Växla turen till 3D. Medan landskapet längs rutten läses in fylls en ring där uppspelningsknappen ska visas. När ringen är full klickar du på Spela upp överflygning. Kameran följer en prick längs rutten, och markören på höjdprofilen i Turöversikt rör sig med.',
  'help.guide.tour-map-overlays.title': 'Visa pister eller sjömärken över kartan',
  'help.guide.tour-map-overlays.tip.2':
    'Utan en öppen tur finns pistreglaget också, så att du kan titta på ett skidområde innan du planerar något. På en vandring erbjuder knappen Via ferrata-leder i stället, med antalet rutter i vyn.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Plusset på en turs rad, Lägg till i denna dag, lägger etapperna på resans dagar, en per dag från dagen du väljer, eller hela turen på den dagen.',
  'help.guide.tour-multi-day.step.6':
    'Om du vill göra turen till en dagstur igen klickar du på Dagstur och bekräftar Göra det till en dagstur? med Ta bort etappsluten. Rutten förblir som den är.',
  'help.guide.tour-stages-on-days.step.1':
    'Peka på flerdagarsturen i Turer för den här resan och klicka på plusset, Lägg till i denna dag.',
  'help.guide.tour-stages-on-days.tip.3':
    'Om du drar en flerdagarstur till en dag på fliken Planering visas samma fråga i en dialog, och det gör den också när du väljer Lägg till i dagen på turens kort.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Leddetaljer, under vägpunkterna, visar SAC-graden, underlaget och vägtypen för varje sträcka från OpenStreetMap och färgar rutten på kartan efter dem. Inget där ändrar turen.',
  'help.guide.tour-hike-plan.step.4':
    'Lägg till punkt är på från början: klicka på kartan där vandringen startar och där den slutar. Resans platser bredvid väljer i stället en stuga eller ett hotell på resan. Från två punkter räknar TREK ut gångrutten.',
  'help.guide.tour-hike-trail-details.title': 'Se svårighetsgrader, underlag och vägtyper längs en vandring',
  'help.guide.tour-hike-trail-details.tip.1':
    'Vägar som saknar värde i OpenStreetMap listas under Okänd, och okänd betyder inte lätt. Om några visar Kunde inte hämtas den här gången klickar du på Försök igen.',
  'help.guide.tour-hike-round.step.4':
    'Klicka på en runda för att välja den. Dess rad visar avstånd, stigning och tid, och hur mycket den skiljer sig från det avstånd du bad om.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Peka på stoppet där sektionen börjar, klicka på Fler åtgärder på dess rad och välj Jämför vägar för nästa etapp.',
  'help.guide.tour-ferrata-add.title': 'Lägg en via ferrata på en vandring',
  'help.guide.tour-ferrata-add.tip.1':
    'En via ferrata kräver utrustning och erfarenhet. Märkets verktygstips anger hur stor del av den som rutten klättrar.',
  'help.guide.tour-run-plan.step.3':
    'Skriv ditt Planerat tempo som minuter och sekunder per kilometer, till exempel 7:30.',
  'help.guide.tour-run-ways.title': 'Se vad en löptur går på',
  'help.ctx.trip-tour-walk.title': 'Stadspromenad',
  'help.guide.tour-walk-plan.goal':
    'Bygg en sightseeingpromenad av stopp, med hur länge du stannar vid varje och vilka som är viktiga.',
  'help.guide.tour-walk-plan.tip.2':
    'En stadspromenad har ingen vandringsgräns och inget fält Pauser: vistelsetiderna används i stället.',
  'help.guide.tour-walk-sights.step.4':
    'Klicka på en plats i listan. Dess kort öppnas över kartan: under Var den hamnar väljer du vilka två stopp platsen ligger mellan.',
  'help.guide.tour-walk-day-times.step.1':
    'Lägg promenaden på en dag: klicka på det runda + på dess rad i Turer för den här resan (Lägg till i denna dag) och välj dag.',
  'help.guide.tour-walk-day-times.result':
    'Du kan ändra ordningen på stoppen eller ändra vistelsetiderna tills varje plats är öppen när du kommer dit.',
  'help.guide.tour-walk-google-import.tip.2':
    'Använd en annan länk tar dig tillbaka till länkfältet. När du läser in ersätts osparade ändringar i planeraren, och dialogen varnar dig först.',
  'help.guide.tour-walk-check-off.step.4':
    'Överst i listan räknas de besökta stoppen och den återstående gångtiden visas. Ångra vid ett stopp tar bort dess markering.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Turöversikt till höger visar Cykeltid (uppskattad), ruttplanerarens tid för profilen, inklusive stigningarna. Pauser ingår inte.',
  'help.guide.tour-bike-profile.step.4':
    'Klicka på Resans platser under Vägpunkter och välj start och mål, här Hotel Alpenroyal och sedan Hotel Greif. Du kan också kontrollera att Lägg till punkt är på och klicka på kartan. Från två punkter räknar TREK ut rutten.',
  'help.guide.tour-bike-profile.tip.5':
    'Om en admin tillåter kartan CyclOSM erbjuder lagerraden på kartan också Cykel medan en cykeltur är öppen. Om den slutar laddas byter du till Karta. Turen ändras inte.',
  'help.guide.tour-bike-surfaces.tip.1':
    'Saknas i datan betyder att OpenStreetMap inte har registrerat något underlag där. Underlaget är okänt, inte nödvändigtvis bra.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Klicka på en rad med svårighetsgrad för att markera de lederna på kartan.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Gren kommer först, och inget är förvalt: Utförsåkning, Snowboard, Längdskidor, Topptur, Snöskor eller Vintervandring. Längdskidor frågar också efter Teknik: Klassisk, Skate eller Okänd. Utan en gren kan turen inte sparas.',
  'help.guide.tour-ski-plan.step.2': 'Öppna Turtyp och välj Skidor och vinter.',
  'help.guide.tour-ski-plan.tip.4':
    'Där det saknas pistdata blir en sträcka en rak linje mellan sina punkter. För snöskor och vintervandring kan den i stället gå på sommarstigar, och en grå notering på sträckan visar det.',
  'help.guide.tour-ski-options.step.5':
    'Under Uteslut trycker du på varje typ av lift som du inte vill åka: Släpliftar, Öppna stolliftar, Gondoler, Linbanor eller Bergbanor och tåg. En intryckt typ är överstruken.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Klicka på den lösning som raden erbjuder: Tillåt svårare backar, Tillåt den här liften, Åk liften ner, Byt teknik eller Byt disciplin. Alternativet ändras och sträckan planeras om.',
  'help.guide.tour-ski-summary.goal': 'Se hur dagen fördelar sig på åkning, liftar, väntan och gång.',
  'help.guide.tour-ski-summary.result': 'Du vet hur lång tid dagen tar i backarna, i liftarna och vid väntan på dem.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Lagret är kartlagda data, inte en live-rapport: det säger inget om vad som är öppet eller preparerat, om snön eller om laviner. Reglaget finns även när ingen tur är öppen, så att du kan titta på ett skidområde innan du planerar.',
  'help.guide.tour-ski-import.step.5':
    'Klicka på spåret i Turer för den här resan för att öppna det. Om du vill rätta dess gren senare klickar du på Byt i kortet Skidspår.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Under Turtyp ber Paddeltur om en Båt (Kajak, Kanadensare, SUP eller Andra) och Vatten (Älv eller Sjö). Turen kan inte sparas förrän båda är valda.',
  'help.guide.tour-paddle-setup.step.1': 'Klicka på Planera ny tur överst i vänstra kolumnen på fliken Turer.',
  'help.guide.tour-paddle-setup.tip.2':
    'Kartan för en paddeltur erbjuder Karta och Satellit, och Sjömärken från OpenSeaMap som ett lager ovanpå.',
  'help.guide.tour-paddle-water-route.step.3':
    'Välj Planera nästa etapp på vattnet. TREK planerar sträckan längs älven eller sjön från den här punkten till nästa.',
  'help.guide.tour-paddle-portage.title': 'Bär båten runt ett hinder',
  'help.guide.tour-paddle-portage.tip.2':
    'På den sista punkten gäller Bär båten härifrån först när du har satt nästa punkt. Raden visar Bär härifrån, och dess kryss, Bär inte ändå, ångrar det.',
  'help.guide.tour-paddle-lock.step.4':
    'Skriv minuterna för Väntan och för Slussning. När båda är angivna visar kortet summan.',
  'help.guide.tour-paddle-time.step.2':
    'Remsan visar rutten från start till mål: vattnet, lyften i brunt och slussarna som streck. Hinder på rutten är markeringar som du kan klicka på för att hitta dem på kartan.',
  'help.guide.tour-paddle-wind.title': 'Kontrollera vinden för en paddeldag',
  'help.guide.tour-paddle-wind.tip.3':
    'En blåsig dag med en sjöpassage erbjuder kortet Planera nära stranden, som planerar sjöarna längs stranden.',
  'help.guide.tour-paddle-checklist.step.4':
    'Klicka på en post. Kartan flyttar sig till den: för ett hinder öppnas dess kort med ditt beslut, och för ditt eget lyft eller din egen sluss markeras dess punkt.',
  'help.guide.tour-paddle-track-marks.title': 'Markera lyft och slussar på ett inspelat paddelspår',
  'help.guide.tour-paddle-track-marks.step.7': 'Öppna korten, skriv in minuterna och klicka på Spara.',
  'help.ctx.trip-tour-horse.bullet.2':
    'En ridled öppnas i en egen dialog: välj en sektion och Riktning som du rider den i, kontrollera Tillträde för häst och klicka sedan på Ta delsträcka.',
  'help.guide.tour-horse-plan.step.3':
    'Klicka på Sök i kartvyn i kortet Ridleder. Alla skyltade ridleder i vyn listas där med sin längd.',
  'help.guide.tour-horse-plan.tip.3':
    'Har du flyttat kartan efter en sökning? Då heter knappen Sök i den här vyn. Är vyn för stor ber TREK dig zooma in först.',
  'help.guide.tour-horse-gap.step.4':
    'I kortet Vägpunkter visar förbindelsen Manuell, okontrollerad, med sin längd. Peka på den för att läsa varför.',
  'help.guide.tour-horse-recorded.step.2':
    'Förhandsvisning av importen öppnas, och inget är sparat ännu. Sätt Turtyp till Ridtur under Importera som. Tre märken visar vad importen behåller och vad den inte räknar ut.',
  'help.guide.dateless-trip.goal': 'Börja planera innan du vet när du ska resa.',
  'help.guide.trip-reminder.step.3': 'Klicka på Uppdatera.',
  'help.guide.upcoming-reservations.goal':
    'Se vad som är bokat härnäst i alla dina resor och öppna resan som bokningen hör till.',
  'help.guide.log-day.tip.3':
    'En dag som är markerad som hel företagshelgdag kan inte loggas. På en halv företagshelgdag kostar en semesterdag bara 0,5.',
  'help.guide.half-company-holiday.goal':
    'Ge alla en ledig eftermiddag, till exempel på julafton, utan att stänga hela dagen.',
  'help.guide.public-holidays.tip.2': 'Håll pekaren över en helgdag i rutnätet för att se dess namn.',
  'help.guide.edit-holiday-calendar.step.3':
    'Ändra land eller region i listorna, eller klicka på papperskorgen för att ta bort kalendern.',
  'help.guide.person-color.step.2': 'Välj en färg. Den sparas direkt och dialogen stängs.',
  'help.guide.answer-fusion-request.goal': 'Bestäm om du vill slå ihop din semesterplan med den som har bjudit in dig.',
  'help.guide.log-for-partner.goal':
    'Registrera en ledig dag för en person som är sammanslagen med din plan, till exempel när personen ber dig om det.',
  'help.guide.dissolve-fusion.goal': 'Dela upp en sammanslagen plan i separata planer igen.',
  'help.guide.country-places.step.1':
    'Sök efter ett land som du har besökt och välj det. Dess kort visas i panelen längst ned.',
  'help.guide.tour-activity-stats.step.3':
    'Läs siffrorna: avståndet, med antalet turer i hörnet, och sedan Höjdmeter uppför och Höjdmeter nedför. Med Alla typer listas därefter de tre typer som du gjort mest, var och en med antal och avstånd.',
  'help.guide.move-to-list.step.1': 'Klicka på kryssrutsikonen Välj i filterraden och markera platserna.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Välj resa under Till resan. En resa som du inte får lägga till turer i är nedtonad.',
  'help.guide.tour-collection-manage.goal':
    'Se vilka turer en lista innehåller och var de kommer ifrån, och ta bort dem som du inte längre behöver.',
  'help.guide.entry-draft.goal': 'Skriv ett inlägg nu och dölj det i den delade journeyn tills det är färdigt.',
  'help.guide.journey-map-layers.step.2':
    'Klicka på (i) i slutet av fältet för kartförklaringen: den förklarar varje nål, prick och linje.',
  'help.guide.journey-keep-route.step.2':
    'Kontrollera Dagens tidszon, som avgör var dagen börjar och slutar, och titta igenom inspelningen: avstånd, tidsspann, delar och luckor.',
  'help.guide.journey-day-stays.step.2':
    'Klicka på Skriv ett dagboksinlägg vid en vistelse. Inlägget läggs till på den dagen vid ankomsttiden, med vistelsens namn och position.',
  'help.guide.journey-take-over-day.step.2':
    'Markera vistelserna som ska sparas och rätta deras namn. Slå ihop till ett inlägg mellan två markerade vistelser slår ihop dem, och Håll isär delar upp dem igen.',
  'help.guide.journey-auto-prepare.step.1':
    'Klicka på ⋯ uppe till höger i rubriken för att öppna Journey Inställningar.',
  'help.guide.photo-location.step.1': 'Klicka på ⋯ uppe till höger i rubriken för att öppna Journey Inställningar.',
  'help.guide.share-public.tip.3':
    'Utkast visas aldrig på länken, och inspelade rutter visas bara på dagar med ett publicerat inlägg.',
  'help.ctx.settings-plugins.title': 'Plugin',
  'help.ctx.settings-about.bullet.2':
    'Rapportera en bugg och Förslag på ny funktion öppnar projektet på GitHub. Wiki öppnar dokumentationen.',
  'help.guide.map-provider.tip.3':
    'På en GL-karta högerklickar du och drar för att rotera och luta den. Ett klick med mittenknappen lägger till en plats.',
  'help.guide.web-push-device.step.1':
    'Klicka på Slå på för den här enheten under Push-meddelanden på den här enheten och tillåt meddelanden när webbläsaren frågar. Skicka test visar att ett meddelande kommer fram.',
  'help.guide.connect-airtrail.title': 'Anslut din AirTrail',
  'help.guide.connect-dawarich.title': 'Anslut din Dawarich',
  'help.guide.tour-connect-wanderer.title': 'Anslut din wanderer',
  'help.guide.tour-connect-wanderer.tip.3': 'Koppla från, till höger, tar bort token igen.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Vilka kanaler du får de här tipsen på väljer du i Meddelanden, på raden wanderer: tips om dina leder.',
  'help.guide.plugin-settings.tip.1':
    'De här inställningarna gäller bara dig. Andra medlemmar ställer in pluginet för sig själva.',
  'help.guide.offline-conflicts.step.3':
    'Ändringar som servern fortsätter att neka visas under Offline-cache som Misslyckade ändringar: Försök igen skickar dem en gång till, och Ångra behåller serverns version.',
  'help.ctx.admin-notifications.bullet.4':
    'Standardval för användare, längst ned: per händelse och kanal På, Av eller Blockerad för alla som inte har ändrat det.',
  'help.guide.default-user-settings.step.2':
    'Ett fält som du har angett får en länk ”Återställ” bredvid sitt namn. Den återställer TREK:s inbyggda standardvärde.',
  'help.guide.own-routing-engine.title': 'Använd dina egna ruttservrar',
  'help.guide.admin-passkeys.result':
    'Inloggningssidan erbjuder Logga in med en inloggningsnyckel, och användarna kan lägga till inloggningsnycklar i sina inställningar.',
  'help.guide.rotate-jwt-secret.goal': 'Avsluta alla sessioner efter ett misstänkt läckage.',
  'help.guide.notification-defaults.result':
    'Alla som inte har ändrat en cell utgår från ditt val, och blockerade celler visas som låsta i deras inställningar.',
  'help.ctx.notifications.bullet.3':
    'Varje meddelande säger vem som gjorde vad och var. Olästa har färgad bakgrund. En knapp under meddelandet, till exempel Visa resan eller Visa Vacay, tar dig dit och markerar det som läst.',
  'help.guide.read-notifications.tip.1':
    'Klockan finns på varje skärm med navigeringsfältet, och siffran uppdateras automatiskt när något nytt kommer.',
  'help.guide.filter-notifications.tip.1':
    'Sidan läser in äldre meddelanden när du rullar nedåt, så ingenting klipps av efter första skärmen.',
  'help.guide.mark-notifications-read.result':
    'Inget meddelande har färgad bakgrund längre, och det röda talet på klockan är borta.',
  'help.guide.notification-settings.title': 'Välj vad du får meddelanden om',
  'help.guide.link-journal.step.1': 'Klicka på Reseinställningar bredvid resans namn och välj Dagbok till vänster.',
  'help.guide.dawarich-stays.tip.1':
    'Inget läggs till i resan förrän du klickar på Lägg till plats. En plats som lagts till från en vistelse visar det i sina detaljer: Tillagd från dina Dawarich-inspelningar.',
  'help.guide.leave-stop-off-route.title': 'Utelämna ett stopp från rutten',
  'help.guide.move-booking-day.step.1':
    'Håll pekaren över bokningens rad i dagen: greppet till vänster visar att den går att dra.',
  'help.guide.place-image-from-file.tip.1':
    'Bara JPG-, PNG-, GIF- och WebP-filer erbjuds. En PDF-biljett erbjuds inte.',
  'help.guide.place-own-hours.step.4':
    'Knapparna till höger om Öppettider: kopieringsknappen ger alla dagar måndagens tider, och X tar bort dina tider igen. Där TREK har hittat egna tider återställer Hämta från platsdetaljerna dem.',
  'help.guide.confirm-stay-booking.step.2':
    'Bokningen öppnas över planen. Den första etiketten i rubriken visar dess status.',
  'help.ctx.trip-map.bullet.9':
    'Varje tur på resan är en linje i sin färg, med en nål där den startar. Klicka på linjen för att öppna turens kort. På en dag som har en tur går dagens rutt till turens start och fortsätter därifrån där turen slutar. Ögat bredvid en tur i listan Turer, Dölj på kartan, tar bort turens linje från din karta.',
  'help.guide.tour-map-lines.result':
    'Turerna du vill se finns på kartan, var och en i sin färg, och turen som du dolde visas nedtonad i listan Turer.',
  'help.guide.car-stops.step.2':
    'Klicka på typknappen i rubriken och välj Bil. Formuläret ändras: Datum och Starttid blir Upphämtning och Upphämtningstid, Slutdatum och Sluttid blir Återlämning och Återlämningstid, och Stopp längs vägen visas under Från och Till.',
  'help.guide.transport-details.goal':
    'Se alla detaljer om en resa på ett ställe, kopiera bokningskoden, byt namn på resan eller hoppa till den på kartan.',
  'help.guide.transport-details.tip.2':
    'Escape eller ett klick utanför detaljerna stänger dem. Om Byt namn eller raderingsfrågan är öppen stängs den först.',
  'help.guide.export-transports-csv.tip.1': 'Ikonen finns bara i fältet så länge fliken innehåller minst en resa.',
  'help.guide.group-sort-bookings.step.1':
    'Klicka på Visningsalternativ i Kort eller Lista, reglagen efter de tre vyikonerna.',
  'help.guide.create-booking.tip.4':
    'Offline sparas bokningen på den här enheten och synkas när du är online igen. Nya filer kräver en anslutning, så ta bort dem eller spara senare. Om du klickar utanför formuläret av misstag, eller trycker på Escape, frågar TREK Slänga ändringarna? innan något du har skrivit går förlorat.',
  'help.guide.booking-on-map.tip.2': 'Ett boende öppnas på sin första natt.',
  'help.guide.export-bookings-csv.step.3':
    'Klicka på Exportera som kalkylblad (CSV), kalkylbladsikonen efter Visningsalternativ.',
  'help.guide.arrange-packing-list.step.3':
    'A till Ö längst till höger i raden med Delad och Min lista visar föremålen i varje lista i namnordning, så att du snabbt ser om något redan finns på den. Klicka på den igen för att gå tillbaka till din egen ordning.',
  'help.guide.count-packed-pieces.step.1':
    'Klicka på antalsmärket på en rad, det lilla talet med ett x efter, skriv hur många du tar med, till exempel 5, och tryck på Enter.',
  'help.guide.expense-receipts.step.3':
    'Klicka på Spara längst ned i dialogen. Filerna laddas upp tillsammans med utgiften och visas även i resans Filer.',
  'help.guide.files-sync-settings.step.1':
    'Klicka på Dokumentsynkronisering längst till höger i fältet. När resan är kopplad öppnas ditt arkivs kort till höger. Om det finns fler än ett arkiv klickar du på det du vill ha under Den här resan till vänster.',
  'help.guide.files-sync-settings.tip.3':
    'Direkta uppdateringar, en länk med Kopiera bredvid, visas bara för arkiv där TREK inte automatiskt kan prenumerera på ändringar. Klistra in länken i arkivet, så kommer ändringar direkt i stället för vid nästa kontroll.',
  'help.guide.manage-notes.step.1':
    'Klicka på de tre prickarna i rubriken på ett noteringskort (Fler alternativ). Menyn innehåller Expandera, Fäst, Redigera och Radera.',
  'help.guide.note-categories.title': 'Sortera noteringar i kategorier',
  'help.guide.note-categories.result':
    'Noteringarna visar de nya namnen och färgerna, och kortet Noteringar visar bara kategorin som du valde.',
  'help.guide.roadtrip-stops.tip.5':
    'Ett stopp med en sluttid i dagsplanen varar till den tiden. Dess dialog visar när färden fortsätter, och Ta bort sluttid låter dig ange längden själv igen.',
  'help.guide.roadtrip-reorder.tip.2':
    'Bokade resor och deras terminaler ligger kvar där bokningen placerar dem. Bara platser kan dras.',
  'help.guide.roadtrip-overnight.step.2':
    'Ett hotell har en sängikon i stället för plustecknet. Klicka på den, Lägg till som övernattning, för att öppna Lägg till som stopp för natten. En campingplats har den vanliga knappen Lägg till.',
  'help.guide.roadtrip-stop-fill.goal':
    'Ge ett bränsle- eller laddningsstopp en egen fyllnadsnivå, till exempel 80 % vid en snabbladdare eller 100 % över natten.',
  'help.guide.roadtrip-bookings.goal': 'Se var en bokad resa passar in i färden och när du måste vara där.',
  'help.guide.roadtrip-bookings.tip.3':
    'En resa som inte ligger på någon av resans dagar ingår inte i färden: en notering överst i spalten anger den, med Öppna bokning för att ge den ett datum.',
  'help.guide.roadtrip-google-import.step.4':
    'Välj dagen som stoppen ska läggas på under Dag och klicka sedan på Importera.',
  'help.guide.roadtrip-hazards.step.2':
    'Under Aktuella varningar, längst ned i dialogens högerkolumn, slår du på Visa riskområden och klickar sedan på Stäng.',
  'help.ctx.trip-tours.bullet.1':
    'Reglaget Platser och Turer överst i högerkolumnen byter ut platslistan mot turerna. Det finns bara när tillägget Turer är på, och då visas turer aldrig i listan Platser.',
  'help.guide.tour-show-list.step.1':
    'Klicka på Turer i reglaget överst i högerkolumnen på fliken Planering. Kolumnen listar nu turerna i stället för platserna.',
  'help.guide.tour-show-list.result':
    'Högerkolumnen listar resans turer, och turen du klickade på är öppen i sitt kort.',
  'help.guide.tour-add-to-day.tip.1':
    'Om du drar en tur med etapper till en dag visas samma fråga i en liten dialog. Avbryt lämnar planen som den var.',
  'help.guide.tour-day-times.step.2':
    'Ange Start och lämna Slut tomt. Raden under fälten visar slutet som TREK räknar ut: starten plus turens tid.',
  'help.guide.tour-remove-from-day.title': 'Ta bort en tur från en dag',
  'help.guide.tour-filter-list.title': 'Filtrera turlistan',
  'help.guide.tour-filter-list.tip.3':
    'Om inget återstår står det Ingen tur matchar de här filtren i listan, och Återställ filter rensar dem alla. Filter ändrar bara vad listan visar, aldrig en tur eller en dag.',
  'help.guide.tour-hide-on-map.tip.2':
    'Mobilkartan visar alltid alla turer, och fliken Turer har inget öga: att dölja fungerar här på fliken Planering.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Importen ligger kvar i listan här och öppnas inte i en planerare. Lägg den på en dag med det runda +, eller öppna fliken Turer för att titta på den där.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Kortet är till för att läsa och för det som hör till en tur. Själva rutten ändrar du på fliken Turer: öppna den och klicka på turen under Turer för den här resan. En tur raderas också där, inte här.',
  'help.guide.tour-detail-read.step.6':
    'Rulla vidare till Beskrivning och Noteringar och sedan Ursprung: planerad i TREK, filen som turen importerades från, eller wanderer-leden den kommer från, med datum.',
  'help.guide.tour-rename-colour.title': 'Byt namn på en tur och ändra dess färg',
  'help.guide.tour-rename-colour.result':
    'Turen visas med sitt nya namn överallt i resan, och dess linje ritas i färgen som du valde.',
  'help.guide.tour-take-along.tip.3':
    'Filen kommer från servern, så det krävs en anslutning. En tur som gjorts offline kan laddas ner när den har synkats.',
  'help.guide.tour-copy-keep.step.4': 'Välj listan under Samling, kontrollera Namn i samlingen och klicka på Spara.',
  'help.guide.tour-packing-link.step.1': 'Öppna turens kort och rulla till Packlista. Klicka på Koppla en packlista.',
  'help.guide.tour-packing-link.result':
    'Du är på packlistan på fliken Listor, och turens kort visar varje föremål som du bockar av.',
  'help.guide.tour-files.result': 'Filerna är kopplade till turen och öppnas från dess kort.',
  'help.guide.tour-activity-link.tip.1':
    'Planen förblir som den är. Spåret är bara länkat, och Koppla ifrån tar bort länken igen.',
  'help.guide.tour-activity-compare.step.3':
    'Klicka på Jämför på kartan för att rita det faktiska spåret prickat bredvid planen. Avsluta jämförelsen tar bort det igen.',
  'help.guide.tour-origin-check.step.2':
    'Importerad visar dagen då turen importerades. Här visar hur den ser ut nu: Som importerad, Redigerad i TREK eller Omplanerad, inspelat spår sparat.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Turer finns i resans flikrad direkt efter Planering så länge tillägget Turer är på. Fliken finns på dator och surfplatta. På mobilen visar du turer och lägger dem på dagar från fliken Planering, men du ritar dem inte där.',
  'help.guide.tour-open-workspace.step.1':
    'Klicka på Turer i resans flikrad, direkt efter Planering. Kartan fyller skärmen, med en spalt på varje sida.',
  'help.guide.tour-open-workspace.tip.2':
    'Släpp GPX-, KML- eller KMZ-filer var som helst på den här fliken för att importera dem som turer i resan.',
  'help.guide.tour-draw-route.step.4': 'Punkt satt visas längst ned på kartan. Ångra bredvid tar bort punkten igen.',
  'help.guide.tour-type-profile.title': 'Välj vilken sorts tur det är',
  'help.guide.tour-type-profile.result': 'Turen ruttplaneras för typen och profilen som du valde.',
  'help.guide.tour-edit-points.step.6':
    'Ångra ändring av ruttpunkt och Gör om ändring av ruttpunkt i spalthuvudet ångrar eller gör om varje ändring, en i taget.',
  'help.guide.tour-shaping-points.step.3':
    'Under Vägpunkter listas den med märket Formpunkt och utan nummer, så att stoppen behåller sina nummer.',
  'help.guide.tour-loop-reverse.step.1':
    'Klicka på Tillbaka till start i rubriken på kortet Vägpunkter. Turen får en sista sträcka tillbaka till sin första punkt.',
  'help.guide.tour-leg-by-hand.goal':
    'Förbind två punkter med en rak linje där ruttplaneraren inte hittar någon väg, eller planera en sträcka på nytt.',
  'help.guide.tour-trip-places.title': 'Använd en plats i resan som stopp',
  'help.guide.tour-trip-places.tip.3': 'Resans andra turer erbjuds aldrig som stopp.',
  'help.guide.tour-details-times.tip.1': 'Tider kan skrivas som 2:56, 2 h 56 eller 176 minuter.',
  'help.guide.tour-save.step.3':
    'Klicka på Spara längst ned i vänstra spalten. Tur sparad visas, och spaltens rubrik ändras till Redigera tur.',
  'help.guide.tour-edit-saved.step.1':
    'Klicka på turen under Turer för den här resan. Den öppnas i vänstra spalten som Redigera tur, och kartan visar dess rutt.',
  'help.guide.tour-summary-profile.title': 'Läs turöversikten och höjdprofilen',
  'help.guide.tour-summary-profile.tip.3':
    'En paddeltur visar inga höjder, eftersom de enda höjder som finns på vattnet är strändernas.',
  'help.guide.tour-list-manage.step.5':
    'Välj Oplanerat för turer som inte ligger på någon dag ännu, eller begränsa efter Källa, Ruttgräns eller Typ. Varje rad visar hur många turer som matchar, och totalerna följer filtret.',
  'help.guide.tour-delete.step.2':
    'Läs vad som raderas med turen: rutten, de redigerbara vägpunkterna och dagtilldelningarna. Klicka på Radera permanent.',
  'help.guide.tour-saved-elsewhere.step.2':
    'Ladda nyare ersätter dina ändringar med den nyare versionen, efter en bekräftelse.',
  'help.ctx.trip-tour-import.bullet.1':
    '+ överst i Turer för den här resan är Lägg till tur. Där finns Importera GPX eller KML, Importera promenad från Google Maps och Hämta en tur från en annan resa. Filer kan också släppas var som helst på fliken Turer.',
  'help.guide.tour-import-gpx.step.2':
    'Välj Importera GPX eller KML och välj en eller flera .gpx-, .kml- eller .kmz-filer på upp till 10 MB var.',
  'help.guide.tour-import-gpx.tip.5':
    'En fil utan höjder visar Inga höjder i filen. Linjen och avståndet stämmer ändå, men Höjdmeter uppför och Höjdmeter nedför förblir okända.',
  'help.guide.tour-view-import.tip.2':
    'Nedladdningsikonen i rubriken sparar importen som GPX-fil igen, och bokmärket sparar den i en samling.',
  'help.guide.tour-plan-from-import.step.4':
    'Turen öppnas i redigeraren med sina vägpunkter. Ändra den om du vill och klicka sedan på Spara längst ned i kolumnen.',
  'help.guide.tour-restore-recorded.step.1':
    'Klicka på turen som du planerade om i Turer för den här resan. Kortet Inspelat spår i redigeraren visar att spåret som turen spelades in med är sparat.',
  'help.guide.tour-take-over.step.1':
    'Öppna fliken Turer i resan som turen ska till. Klicka på + (Lägg till tur) överst i Turer för den här resan.',
  'help.guide.tour-take-over.tip.3':
    'Att hämta en tur kräver en anslutning. Om redigeraren har osparade ändringar läggs kopian ändå till i listan, men den öppnas inte, så att ditt arbete förblir öppet.',
  'help.guide.tour-import-wanderer.tip.1':
    'Knappen finns när wanderer är anslutet under Inställningar, Integrationer. Dessförinnan visar listan Anslut i inställningarna.',
  'help.ctx.trip-tour-map.bullet.2':
    'Efter avdelaren i knappen kommer reglagen för turens typ: Sätt punkter medan du redigerar en tur, Via ferrata-leder på en vandring, Sjömärken på en paddeltur och pisterna på en skidtur. 3D i slutet visar turen i ett 3D-landskap.',
  'help.guide.tour-map-layers.step.3':
    'På en vandring klickar du på Vandring för de markerade lederna och deras nummer. En cykeltur erbjuder i stället Cykel för cykelrutterna. Satellit ger flygbilder, och Karta tar dig tillbaka till standardkartan.',
  'help.guide.tour-along-search.step.2':
    'Klicka på Vad att leta efter och markera vilka typer du vill ha, upp till sex åt gången: Utsiktspunkter, Toppar, Stugor och vindskydd, Dricksvatten, Mat och fler. Listan erbjuder det som passar turens typ, och en tur börjar med tre av dem markerade.',
  'help.guide.tour-along-add-stop.title': 'Lägg till en plats längs turen som stopp',
  'help.guide.tour-along-add-stop.tip.2':
    'En plats som blir det nya målet är märkt Förlänger turen: det gamla slutet är inte längre slutet, och turen fortsätter till den här platsen.',
  'help.guide.tour-3d-terrain.step.5':
    'Klicka på 3D igen för att gå tillbaka till den platta kartan och fortsätta planera.',
  'help.guide.tour-3d-flyover.step.2':
    'Välj 1×, 2× eller 4× under Hastighet. Vid 1× tar de flesta turer ungefär 45 sekunder från start till mål.',
  'help.guide.tour-map-overlays.goal':
    'Visa skidpisterna och liftarna, eller bojarna och hamnmärkena, på kartan medan du planerar en skid- eller paddeltur.',
  'help.guide.tour-map-overlays.tip.3':
    'När ett lager slutar laddas visar dess reglage ett ! och en förklaring. Kartan och din rutt fungerar ändå utan lagret.',
  'help.guide.tour-multi-day.title': 'Planera en tur över flera dagar',
  'help.guide.tour-multi-day.tip.1':
    'Avsluta etappen här fungerar också på en dagstur: turen blir då automatiskt en flerdagarstur. Det första och det sista stoppet och en formpunkt kan inte avsluta en etapp.',
  'help.guide.tour-stages-on-days.step.2': 'Välj dagen då du startar den första etappen.',
  'help.guide.tour-stages-on-days.tip.4':
    'I dagsplanen visas varje etapp som Etapp N med egen sträcka och tid. Ångra ovanför dagarna på fliken Planering ångrar hela fördelningen i ett steg.',
  'help.ctx.trip-tour-hike.bullet.5':
    'På en vandring visar Via ferrata-leder i raden med kartknappar längst ned till vänster via ferratorna i närheten. Via ferratans kort lägger till den i rutten som en egen sträcka.',
  'help.guide.tour-hike-plan.step.5':
    'Öppna Högsta svårighetsgrad för leden under Detaljer och välj hur svåra leder som får ingå, från T1 (Vandring) till T6 (Svår alpin vandring). Rutten planeras om inom den gränsen.',
  'help.guide.tour-hike-trail-details.goal':
    'Läs vad OpenStreetMap har registrerat om vägarna under en vandring, och hitta de sträckorna på kartan.',
  'help.guide.tour-hike-trail-details.tip.2':
    'En svårighetsgrad över vandringens gräns får ett märke Över gränsen på sin rad.',
  'help.guide.tour-hike-round.step.5':
    'Klicka på Ta den här rundan och sedan på Ersätt när TREK frågar om den planerade rutten ska ersättas.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Andra vägar för den här etappen öppnas över kartan med Nuvarande väg och Väg A, Väg B och så vidare. Varje väg ritas på kartan i sin färg, och om du pekar på en rad lyses dess linje upp.',
  'help.guide.tour-ferrata-add.goal': 'Hitta via ferratorna runt din vandring och gör en av dem till en del av rutten.',
  'help.guide.tour-ferrata-add.tip.2':
    'Via ferrata-leder erbjuds bara på vandringar. En via ferrata som rutten redan klättrar visar Del av turen på sitt kort i stället för Lägg till i turen.',
  'help.guide.tour-run-plan.step.4':
    'Ange start och mål på kartan, eller välj dem med Resans platser. Under tempot ser du löptiden: avståndet gånger tempot.',
  'help.guide.tour-run-ways.goal':
    'Kontrollera hur stor del av en löptur som är ohårdgjord och hur svåra stigarna blir.',
  'help.ctx.trip-tour-walk.summary':
    'En tur till fots från stopp till stopp, planerad på fliken Turer: hur länge du stannar vid varje stopp, vilka stopp som är viktiga, sevärdheterna längs vägen och när du når varje stopp på promenadens dag, kontrollerat mot öppettiderna.',
  'help.guide.tour-walk-plan.step.1':
    'Klicka på Planera ny tur överst i vänstra kolumnen, öppna sedan Turtyp och välj Stadspromenad / sightseeing.',
  'help.guide.tour-walk-plan.tip.3':
    'Lossa från platsen, i ett stopps Fler åtgärder, tar bara bort länken till en plats i resan. Själva platsen finns kvar i resan.',
  'help.guide.tour-walk-sights.step.5':
    'Klicka på Lägg till som stopp. Ett meddelande visar hur mycket längre promenaden blir, med Ångra bredvid.',
  'help.guide.tour-walk-day-times.step.2':
    'Ge den en starttid den dagen: på fliken Planering högerklickar du på promenaden i dagen, väljer Redigera och anger en Start.',
  'help.guide.tour-walk-google-import.title': 'Gör en gångrutt i Google Maps till en stadspromenad',
  'help.guide.tour-walk-google-import.tip.3':
    'Bara stoppen tas över, inte linjen som är ritad i Google Maps. En kort länk av typen maps.app.goo.gl kräver en anslutning för att kunna följas.',
  'help.guide.tour-walk-check-off.tip.1':
    'Markeringarna sparas per dag: öppna promenaden från sin dag i planen, inte från turlistan.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Kortet Underlag och vägar under Vägpunkter visar vad rutten går på: underlagen, vägtyperna och andelen som är känd som ohårdgjord. Klicka på en rad för att lysa upp dess sträckor på kartan.',
  'help.guide.tour-bike-profile.step.5':
    'Läs Cykeltid (uppskattad) i Turöversikt till höger. Håll pekaren över infoprickarna för att se hur den beräknas.',
  'help.guide.tour-bike-surfaces.title': 'Se underlagen på en cykeltur',
  'help.guide.tour-bike-surfaces.tip.2':
    'På profilen Landsväg anger en varning ovanför staplarna hur stor del som är känd som ohårdgjord. Visa på kartan markerar de sträckorna.',
  'help.guide.tour-bike-mtb-grades.result':
    'Kartan markerar lederna med graden som du valde, och du vet vilka delar av turen som är de svåra.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Under grenen finns pistruttplanerarens alternativ, bara de som din gren använder: Svåraste backar, Föredra, Takt, reglage som Åk liftar och Uteslut för de typer av lift som du inte vill åka. Varje ändring planerar om turen.',
  'help.guide.tour-ski-plan.step.3':
    'Välj vad du ska göra under Gren: Utförsåkning, Snowboard, Längdskidor, Topptur, Snöskor eller Vintervandring. Inget är förvalt, och turen kan inte sparas utan en gren.',
  'help.guide.tour-ski-plan.result':
    'En sparad tur av typen Skidor och vinter i Turer för den här resan, med sträckor längs kartlagda backar, liftar och spår och med tiden beräknad i Turöversikt.',
  'help.guide.tour-ski-options.tip.1': 'Varje ändring planerar om turen, sträcka för sträcka.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Om ingen åtgärd passar klickar du på Rita rakt. Sträckan blir en rak linje mellan sina två punkter.',
  'help.guide.tour-ski-summary.step.1':
    'Hitta kortet Pistrutt under vägpunkterna. Klicka på dess titel för att fälla ihop det eller öppna det igen.',
  'help.guide.tour-ski-pistes-layer.title': 'Visa pisterna på kartan',
  'help.guide.tour-ski-pistes-layer.result': 'Pisterna ritas under turen, och du kan läsa av deras färger.',
  'help.guide.tour-ski-import.step.6': 'Välj rätt gren eller teknik i Klassa skidspår och klicka på Spara.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Varje punkt visar sin roll som ett märke: Isättning, Upptagning, Ny isättning eller Slutlig upptagning. Under en punkt visas det som kommer efter den: en sträcka som är ritad för hand, ett lyft, en sluss eller orsaken till att en sträcka inte kunde planeras.',
  'help.guide.tour-paddle-setup.step.2': 'Öppna Turtyp och välj Paddeltur, På vattnet, med kajak, kanot eller SUP.',
  'help.guide.tour-paddle-setup.tip.3':
    'Längs turen söker först efter Isättningsplatser, Båtuthyrning och Dricksvatten på en paddeltur.',
  'help.guide.tour-paddle-water-route.step.4':
    'En sträcka som TREK inte kunde planera blir röd och visar varför, till exempel att det ännu inte finns några vattendata för området. Klicka på Rita rakt för att rita den för hand tills vidare.',
  'help.guide.tour-paddle-portage.goal':
    'Markera en sträcka där du bär båten, så att den räknas som land, med tid för att ta sig ur båten och i den igen.',
  'help.guide.tour-paddle-portage.tip.3':
    'Bärning räknas med 2 km/h tills du anger ditt eget Bärtempo i kortet Tidsuppskattning.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK känner inte till några slusstider. Tiderna är bara det du själv anger, så kontrollera slussens öppettider själv.',
  'help.guide.tour-paddle-time.step.3':
    'Raden Vatten är avståndet på vattnet i ditt Paddeltempo. Ändra farten i fältet Paddeltempo överst i kolumnen.',
  'help.guide.tour-paddle-wind.goal': 'Se den prognostiserade vinden vid turens start den dag du paddlar den.',
  'help.guide.tour-paddle-wind.tip.4':
    'Inget prognosvärde betyder inte att det är säkert. Kontrollera förhållandena på plats.',
  'help.guide.tour-paddle-checklist.step.5':
    'Klicka på Paddling har risker längst ned i kolumnen för att läsa Säkerhet på vattnet innan du ger dig av.',
  'help.guide.tour-paddle-track-marks.goal':
    'Importera ett paddelspår från din klocka och lägg till var du bar båten och var du gick genom en sluss.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Klicka exakt på spåret: ett klick för långt från linjen nekas, och kortet visar det.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Varje sektion är ett märke i kortet Vägpunkter med ruttens namn, en tillträdesprick och längden. En sträcka som ingen ridled täcker visar Manuell, okontrollerad.',
  'help.guide.tour-horse-plan.step.4':
    'Klicka på en rutt i listan. Den öppnas på en egen karta, med sina sektioner numrerade.',
  'help.guide.tour-horse-plan.tip.4':
    'Ångra ändring av ruttpunkt i rubriken på vänstra kolumnen ångrar en hel sektion i ett steg.',
  'help.guide.tour-horse-gap.result':
    'Ridturen har inget glapp längre, och den överbryggade sträckan är markerad som ritad för hand.',
  'help.guide.tour-horse-recorded.step.3': 'Klicka på Importera 1 tur.',
  'help.guide.dissolve-fusion.step.3': 'Bekräfta med ”Upplös” i fönstret som visas.',
};

export default help;
