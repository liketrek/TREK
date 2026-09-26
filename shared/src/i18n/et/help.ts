import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Abi ja dokumentatsioon',
  'help.search': 'Otsi dokumentatsioonist…',
  'help.contents': 'Sisukord',
  'help.noResults': 'Vastavaid lehti ei leitud.',
  'help.errorTitle': 'Lehe laadimine ebaõnnestus',
  'help.errorBody': 'Abisisu laaditakse TREKi vikist. Kontrolli ühendust ja proovi uuesti.',

  // ── Help center (the contextual panel behind the ? in the navbar) ──────────
  'help.center.button': 'Abi selle vaate kohta',
  'help.center.title': 'Abi',
  'help.center.onThisScreen': 'Selles vaates',
  'help.center.screens': 'Vaated',
  'help.center.thisScreen': 'See vaade',
  'help.center.subScreens': '{count} alamvaadet',
  'help.center.subScreensLabel': 'Alamvaated',
  'help.center.guidesCount': '{count} juhendit',
  'help.center.goToScreen': 'Ava {screen}',
  'help.center.overview': 'Ülevaade',
  'help.center.howTo': 'Kuidas ma…',
  'help.center.searchPlaceholder': 'Otsi juhenditest ja dokumentatsioonist…',
  'help.center.searchEmpty': 'Päringule „{query}“ ei leitud midagi.',
  'help.center.searchGuides': 'Juhendid',
  'help.center.searchDocs': 'Dokumentatsioon',
  'help.center.searchError': 'Otsing pole praegu saadaval.',
  'help.center.back': 'Tagasi',
  'help.center.close': 'Sulge abi',
  'help.center.steps': '{count} sammu',
  'help.center.step': 'Samm {n}',
  'help.center.stepsLabel': 'Sammud',
  'help.center.stepOf': 'Samm {n}/{total}',
  'help.center.screenshot': 'Ekraanipilt',
  'help.center.result': 'Tulemus',
  'help.center.tips': 'Hea teada',
  'help.center.related': 'Seotud',
  'help.center.openDocs': 'Ava jaotises Abi ja dokumentatsioon',
  'help.center.docsSection': 'Dokumentatsioonis',
  'help.center.noContext': 'Selle vaate kohta pole veel juhendit.',
  'help.center.noContextHint': 'Otsi dokumentatsioonist või anna meile teada, mida otsisid.',
  'help.center.feedback': 'Kas midagi on puudu?',
  'help.center.feedbackLink': 'Anna meile GitHubis teada',
  'help.center.discord': 'Küsi Discordis',
  'help.center.quick': 'Kiire',
  'help.center.guide': 'Juhend',
  'help.center.tour': 'Tutvustus',
  'help.center.imageAlt': '„{title}“, samm {n}',

  // ── Screen: dashboard ──────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Ülevaade',
  'help.ctx.dashboard.summary':
    'Ülevaade on uks kõigi sinu reiside juurde. Ülaosas olev pardakaart tõstab esile käimasoleva või järgmisena tuleva reisi, selle all olev rida loendab, kui palju oled seni reisinud, ja reisikaardid näitavad kõike, mida plaanid, oled arhiveerinud või juba lõpetanud.',
  'help.ctx.dashboard.bullet.1':
    'Pardakaart: käimasolev või järgmine reis koos kuupäevade, reisijate, kohtade ja pöördloendusega. Reisi avamiseks klõpsa sellel.',
  'help.ctx.dashboard.bullet.2':
    'Reisistatistika: külastatud riigid, reisid, teel veedetud päevad ja lennatud vahemaa kõigi sinu reiside peale kokku.',
  'help.ctx.dashboard.bullet.3':
    'Reisikaardid, filtreeritud valikute Plaanis, Arhiveeritud ja Lõppenud järgi, ruudustiku või loendina. Hõljuta kursorit kaardi kohal, et seda muuta, kopeerida, arhiveerida või kustutada.',
  'help.ctx.dashboard.bullet.4':
    'Vidinad paremal: valuutakalkulaator, maailmakellad, eelseisvad broneeringud ja kogumikud. Igaühe neist saab välja lülitada.',
  'help.ctx.dashboard.bullet.5': 'Uue reisi alustamiseks on nii kaart Uus reis kui ka nupp paremas alanurgas.',

  // create-trip
  'help.guide.create-trip.title': 'Loo reis',
  'help.guide.create-trip.goal': 'Alusta uut reisi nime, kuupäevade ja kaanepildiga.',
  'help.guide.create-trip.step.1':
    'Klõpsa nupul Uus reis. Sinu reiside lõpus olev kaart ja paremas alanurgas olev nupp teevad sama.',
  'help.guide.create-trip.step.2': 'Anna reisile nimi. See on ainus kohustuslik väli; kõik muu saab lisada hiljem.',
  'help.guide.create-trip.step.3':
    'Vali algus- ja lõppkuupäev. TREK loob iga kuupäeva jaoks ühe päeva, nii et sinu reisikava on täitmiseks valmis.',
  'help.guide.create-trip.step.4':
    'Valikuline: lisa kaanepilt. Laadi üles oma pilt, lohista see siia või otsi sihtkohta Unsplashist.',
  'help.guide.create-trip.step.5': 'Klõpsa nupul Loo uus reis.',
  'help.guide.create-trip.result':
    'Reis ilmub sinu ülevaatesse. Kui see on sinu järgmine reis, võtab see üle ülaosas oleva pardakaardi.',
  'help.guide.create-trip.tip.1':
    'Kuupäevi saab hiljem muuta. Kui broneeringud on juba olemas, küsib TREK, kas need tuleks koos päevadega nihutada.',
  'help.guide.create-trip.tip.2': 'Siin valitud reisi valuutasse arvestatakse ümber kõik kulud. Vali sihtkoha valuuta.',

  // edit-trip
  'help.guide.edit-trip.title': 'Muuda reisi',
  'help.guide.edit-trip.goal': 'Nimeta reis ümber, muuda selle kuupäevi või kohanda seadeid.',
  'help.guide.edit-trip.step.1': 'Hõljuta kursorit reisikaardi (või pardakaardi) kohal ja klõpsa pliiatsil.',
  'help.guide.edit-trip.step.2':
    'Muuda, mida vaja: nimi, kirjeldus, kuupäevad, kaanepilt, valuuta, meeldetuletus või liikmed.',
  'help.guide.edit-trip.step.3': 'Klõpsa nupul Uuenda.',
  'help.guide.edit-trip.result': 'Kaart uueneb kohe kõigi reisi liikmete jaoks.',
  'help.guide.edit-trip.tip.1':
    'Kui nihutad reisi kuupäevi ja reisil on juba broneeringud, avaneb teine samm, mis küsib, kas ka broneeringud tuleks nihutada.',

  // cover-image
  'help.guide.cover-image.title': 'Määra kaanepilt',
  'help.guide.cover-image.goal': 'Anna reisile pilt, mis kuvatakse selle kaardil ja pardakaardil.',
  'help.guide.cover-image.step.1': 'Ava reisi muutmisvorm selle kaardil oleva pliiatsi kaudu.',
  'help.guide.cover-image.step.2':
    'Lohista jaotisse Kaanepilt foto, klõpsa selle üleslaadimiseks või sisesta sihtkoht Unsplashi otsingusse.',
  'help.guide.cover-image.step.3': 'Vali foto ja klõpsa nupul Uuenda.',
  'help.guide.cover-image.result': 'Foto salvestatakse koos reisiga ja kuvatakse kõikjal, kus reis on loetletud.',
  'help.guide.cover-image.tip.1':
    'Unsplashi otsingust pärit fotodele lisatakse autori viide automaatselt; sinu enda üleslaaditud pildid jäävad sinu serverisse.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Tee reisist koopia',
  'help.guide.duplicate-trip.goal': 'Kasuta reisi uue reisi mallina.',
  'help.guide.duplicate-trip.step.1': 'Hõljuta kursorit kaardi kohal ja klõpsa kopeerimisikoonil.',
  'help.guide.duplicate-trip.step.2': 'Loe, mida kopeeritakse ja mida mitte, ning kinnita.',
  'help.guide.duplicate-trip.result':
    'Originaali kõrvale ilmub koopia, mille saad ümber nimetada ja uutele kuupäevadele seada.',
  'help.guide.duplicate-trip.tip.1':
    'Kaasa tulevad päevad, kohad, broneeringud, eelarvekirjed, pakkimisnimekirjad ja päevamärkmed. Liikmed, vestlus, küsitlused, failid ja jagamislingid mitte.',

  // archive-trip
  'help.guide.archive-trip.title': 'Arhiveeri ja taasta reis',
  'help.guide.archive-trip.goal': 'Pane reis kõrvale seda kustutamata ja too see hiljem tagasi.',
  'help.guide.archive-trip.step.1': 'Hõljuta kursorit kaardi kohal ja klõpsa nupul Arhiveeri.',
  'help.guide.archive-trip.step.2': 'Selle uuesti nägemiseks lülita kaartide kohal olev filter valikule Arhiveeritud.',
  'help.guide.archive-trip.step.3': 'Klõpsa kaardil nupul Taasta, et viia see tagasi jaotisse Plaanis.',
  'help.guide.archive-trip.result':
    'Arhiveeritud reisid säilitavad kõik. Need lihtsalt ei risusta enam ülevaadet ega kõigi reiside kalendrivoogu.',

  // delete-trip
  'help.guide.delete-trip.title': 'Kustuta reis',
  'help.guide.delete-trip.goal': 'Eemalda reis jäädavalt.',
  'help.guide.delete-trip.step.1': 'Hõljuta kursorit kaardi kohal ja klõpsa prügikastiikoonil.',
  'help.guide.delete-trip.step.2': 'Kinnita. Dialoogis on reisi nimi, nii et tead, et valisid õige.',
  'help.guide.delete-trip.result':
    'Reis, selle päevad, kohad, broneeringud ja failid on kadunud. Tagasivõtmist pole, seega kahtluse korral arhiveeri hoopis.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Leia lõppenud reisid, vaheta ruudustiku ja loendi vahel',
  'help.guide.filter-and-view.goal': 'Vaata lõppenud või arhiveeritud reise ja vali meelepärane paigutus.',
  'help.guide.filter-and-view.step.1':
    'Kasuta kaartide kohal valikuid Plaanis, Arhiveeritud ja Lõppenud. Lõppenud on kõik reisid, mille lõppkuupäev on möödas.',
  'help.guide.filter-and-view.step.2':
    'Kompaktsele loendile lülitumiseks klõpsa loendi ikoonil; ruudustiku jaoks klõpsa sellel uuesti.',
  'help.guide.filter-and-view.result': 'Ülevaade jätab sinu paigutuse selles seadmes meelde.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Telli kõik reisid oma kalendrisse',
  'help.guide.calendar-feed.goal':
    'Näe kõigi aktiivsete reiside päevi ja broneeringuid oma kalendrirakenduses, alati sünkroonituna.',
  'help.guide.calendar-feed.step.1': 'Klõpsa vaatelüliti kõrval oleval kalendriikoonil.',
  'help.guide.calendar-feed.step.2': 'Klõpsa nupul Luba kalendri tellimine. TREK loob privaatse voo lingi.',
  'help.guide.calendar-feed.step.3':
    'Lisa voog ühe nupuga (Google, Apple, Outlook) või kopeeri link mis tahes kalendrirakendusse, mis toetab URL-i kaudu tellimist.',
  'help.guide.calendar-feed.result':
    'Iga aktiivne reis kuvatakse sinu kalendris ja uueneb iseenesest. Arhiveeritud reisid ja üle 90 päeva tagasi lõppenud reisid jäetakse välja.',
  'help.guide.calendar-feed.tip.1':
    'Link on salajane. Igaüks, kellel see on, saab voogu lugeda; kui link lekib, tühista see samas dialoogis.',

  // widgets
  'help.guide.widgets.title': 'Vali oma ülevaate vidinad',
  'help.guide.widgets.goal': 'Näita või peida statistikarida ja paremal olevad vidinad.',
  'help.guide.widgets.step.1': 'Ava paremas ülanurgas oma avatari menüü ja vali Seaded.',
  'help.guide.widgets.step.2': 'Lülitu vahekaardile Välimus.',
  'help.guide.widgets.step.3':
    'Jaotises Avalehe vidinad lülita iga vidin sisse või välja. Töölaua ja mobiili jaoks määratakse need eraldi.',
  'help.guide.widgets.step.4': 'Mine tagasi ülevaatesse. Muudatus rakendub kohe.',
  'help.guide.widgets.result':
    'Peidetud vidinad vabastavad ruumi sinu reisidele; paigutuse tsentreerimiseks lülita kogu parem külgriba välja.',
  'help.guide.widgets.link': 'Ava välimuse seaded',

  // currency-widget
  'help.guide.currency-widget.title': 'Teisenda valuutasid',
  'help.guide.currency-widget.goal': 'Teisenda summa kahe valuuta vahel kehtivate kurssidega.',
  'help.guide.currency-widget.step.1': 'Sisesta summa ja vali kaks valuutat.',
  'help.guide.currency-widget.step.2': 'Nendevaheline nool vahetab paari; ringikujuline nool värskendab kurssi.',
  'help.guide.currency-widget.result': 'Sinu valuutapaar salvestatakse sinu kontole, nii et see on igas seadmes sama.',
  'help.guide.currency-widget.tip.1': 'Kursid pärinevad Euroopa Keskpangast ja uuenevad kord päevas.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Lisa maailmakellad',
  'help.guide.timezones-widget.goal': 'Hoia silm peal kohalikul ajal oma sihtkohtades.',
  'help.guide.timezones-widget.step.1': 'Klõpsa vidinas Ajavööndid nupul + ja otsi linna.',
  'help.guide.timezones-widget.step.2': 'Eemalda kell selle kõrval oleva × abil.',
  'help.guide.timezones-widget.result': 'Sinu kellad salvestatakse sinu kontole.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay on sinu isiklik puhkuseplaneerija: mitu puhkusepäeva sul aastas on, milliseid oled märkinud ja mis on alles. Ruudustik näitab kogu aastat ühe pilguga; külgribal on aastavalik, inimesed, kellega koos planeerid, sinuga jagatud kalendrid, legend ja sinu puhkusepäevade õigus.',
  'help.ctx.vacay.bullet.1':
    'Aasta ruudustik: kaksteist kuukaarti, igal päeval oma lahter. Klõpsa päeval, et see märkida või märge eemaldada. Väike sinine täpp tähistab päevi, mille mõni reis juba katab.',
  'help.ctx.vacay.bullet.2':
    'Tööriistariba all: režiim Puhkus või Ettevõtte puhkepäev ning lülitid Pool päeva ja Vaba / tasaarvestuspäev, mis muudavad seda, mida klõps märgib.',
  'help.ctx.vacay.bullet.3':
    'Puhkusepäevade õigus: sinu selle aasta päevad, mitu on kasutatud ja mitu alles, koos eelmisest perioodist ülekantud päevadega.',
  'help.ctx.vacay.bullet.4':
    'Inimesed on sinu plaaniga ühendatud inimesed, igaüks oma värviga. Jagatud kalendrid on teiste inimeste vabade päevade rõngad, mis on ainult vaatamiseks.',
  'help.ctx.vacay.bullet.5':
    'Seaded hõlmavad nädalavahetusi, nädala algust, ülekandmist, sinu puhkuseaastat, ettevõtte puhkepäevi ning riigipühade või koolivaheaegade kalendreid.',

  // log-day
  'help.guide.log-day.title': 'Märgi puhkusepäev',
  'help.guide.log-day.goal': 'Märgi aasta ruudustikus vaba päev ja vaata, kuidas saldo muutub.',
  'help.guide.log-day.step.1':
    'Vaata alumist tööriistariba: vasakpoolne nupp sinu värvis tähendab, et klõps märgib sulle puhkusepäeva.',
  'help.guide.log-day.step.2':
    'Klõpsa mis tahes kuukaardil päeval. See täitub sinu värviga ja Kasutatud suureneb ühe päeva võrra.',
  'help.guide.log-day.step.3': 'Märke eemaldamiseks klõpsa samal päeval uuesti.',
  'help.guide.log-day.result':
    'Päev on märgitud, Päevi, Kasutatud ja Alles uuenevad kohe ning kõik sinu plaaniga ühendatud inimesed näevad seda reaalajas.',
  'help.guide.log-day.tip.1':
    'Nädalavahetusi ei saa märkida, kui seadetes on sisse lülitatud Blokeeri nädalavahetused.',
  'help.guide.log-day.tip.2':
    'Sinine täpp lahtris tähendab, et see päev on mõne sinu reisi sees, nii et näed, kus puhkus ja reisimine kattuvad.',

  // half-day
  'help.guide.half-day.title': 'Märgi pool päeva',
  'help.guide.half-day.goal': 'Võta pärastlõuna vabaks, kulutamata tervet puhkusepäeva.',
  'help.guide.half-day.step.1':
    'Lülita tööriistaribal sisse Pool päeva. Selle oranž täpp on tähis, mille pool päeva ruudustikus saab.',
  'help.guide.half-day.step.2': 'Klõpsa päeval. See märgitakse väärtusega 0,5 ja selle nurgas on oranž täpp.',
  'help.guide.half-day.step.3':
    'Kui oled valmis, lülita Pool päeva uuesti välja; teistsuguste seadetega poolel päeval klõpsamine teisendab selle kohapeal.',
  'help.guide.half-day.result':
    'Kasutatud kasvab 0,5 võrra. Pool päeva ja Vaba / tasaarvestuspäev on teineteisest sõltumatud, nii et võimalik on ka pool tasaarvestuspäeva.',
  'help.guide.half-day.tip.1':
    'Tööriistariba näitab alati tähist, mille sinu järgmine klõps paneb, nii et saad enne märkimist kontrollida.',

  // comp-day
  'help.guide.comp-day.title': 'Märgi vaba või tasaarvestusaeg',
  'help.guide.comp-day.goal': 'Võta ületundide eest vaba aega, mis ei kuluta puhkusepäevi.',
  'help.guide.comp-day.step.1':
    'Lülita tööriistaribal sisse Vaba / tasaarvestuspäev. Viirutatud ketas näitab, milline näeb tasaarvestuspäev ruudustikus välja.',
  'help.guide.comp-day.step.2': 'Klõpsa päeval. See täitub ühtlase ploki asemel sinu värvi diagonaalse viirutusega.',
  'help.guide.comp-day.result':
    'Tasaarvestuspäevi loetakse puhkusepäevade õiguse paanide kõrval ja need ei vähenda kunagi väärtust Alles.',
  'help.guide.comp-day.tip.1':
    'Tagasi võetud ületunnid, paindlik tööaeg, vaba päev ületundide eest: kõik, mis on vaba aeg, aga mitte puhkus, kuulub siia.',

  // entitlement
  'help.guide.entitlement.title': 'Määra oma puhkusepäevade õigus',
  'help.guide.entitlement.goal': 'Ütle Vacayle, mitu puhkusepäeva sul aastas on.',
  'help.guide.entitlement.step.1': 'Klõpsa külgribal jaotise Puhkusepäevade õigus all paanil Päevi.',
  'help.guide.entitlement.step.2': 'Sisesta päevade arv ja vajuta Enter.',
  'help.guide.entitlement.result':
    'Alles arvutatakse uuesti sinu puhkusepäevade õiguse, ülekantud päevade ja kasutatud päevade põhjal.',
  'help.guide.entitlement.tip.1':
    'Igal aastal on oma puhkusepäevade õigus, seega mõjutab siin tehtud muudatus ainult valitud aastat.',

  // years
  'help.guide.years.title': 'Lisa aastaid ja vaheta nende vahel',
  'help.guide.years.goal': 'Planeeri juba järgmist aastat või vaata tagasi eelmisele.',
  'help.guide.years.step.1':
    'Klõpsa aastast paremal oleval nupul +, et lisada järgmine aasta, või vasakul oleval nupul +, et lisada eelmine.',
  'help.guide.years.step.2': 'Vaheta aastate vahel nooltega või allpool olevate aastakiipidega.',
  'help.guide.years.step.3':
    'Aasta eemaldamiseks hõljuta kursorit selle kiibi kohal ja klõpsa väikesel miinusel. Selle kirjed kaovad koos sellega, nii et kinnita hoolikalt.',
  'help.guide.years.result': 'Igal aastal on oma puhkusepäevade õigus ja kirjed; ülekandmine seob need omavahel.',

  // company-holidays
  'help.guide.company-holidays.title': 'Märgi ettevõtte puhkepäevad',
  'help.guide.company-holidays.goal': 'Blokeeri päevad, mil kogu ettevõte on vaba, kulutamata kellegi puhkusepäevi.',
  'help.guide.company-holidays.step.1':
    'Ava Seaded ja kontrolli, et Ettevõtte puhkepäevad on sisse lülitatud. Vaikimisi on see sees; tööriistariba pakub seda režiimi ainult siis, kui see on sees.',
  'help.guide.company-holidays.step.2': 'Lülita ruudustikus tööriistariba režiimile Ettevõtte puhkepäev.',
  'help.guide.company-holidays.step.3': 'Klõpsa päevadel. Need muutuvad merevaigukollaseks ja ilmuvad legendi.',
  'help.guide.company-holidays.result':
    'Ettevõtte puhkepäevad on nähtavad kõigile plaaniga ühendatud inimestele ega vähenda kunagi väärtust Alles.',
  'help.guide.company-holidays.tip.1':
    'Ettevõtte puhkepäevi saab muuta iga ühendatud inimene, seega leppige kokku, kes neid haldab.',

  // public-holidays
  'help.guide.public-holidays.title': 'Näita riigipühi',
  'help.guide.public-holidays.goal': 'Too oma riigi või piirkonna riigipühad ruudustikule.',
  'help.guide.public-holidays.step.1': 'Ava Seaded ja lülita Riigipühad sisse.',
  'help.guide.public-holidays.step.2':
    'Klõpsa nupul Lisa kalender, seejärel vali riik ja vajaduse korral piirkond. Soovi korral anna sellele värv ja nimetus.',
  'help.guide.public-holidays.step.3': 'Sulge Seaded. Pühad ilmuvad ruudustikule ja legendi.',
  'help.guide.public-holidays.result':
    'Riigipühad märgitakse kalendri värviga ja neid ei arvestata kunagi sinu puhkusepäevade hulka.',
  'help.guide.public-holidays.tip.1':
    'Saad lisada mitu kalendrit, näiteks oma piirkonna ja ühendatud kolleegi piirkonna kalendri.',

  // school-holidays
  'help.guide.school-holidays.title': 'Näita koolivaheaegu',
  'help.guide.school-holidays.goal': 'Näe oma piirkonna koolivaheaegu oma vabade päevade kõrval.',
  'help.guide.school-holidays.step.1': 'Ava Seaded ja lülita Koolivaheajad sisse.',
  'help.guide.school-holidays.step.2':
    'Klõpsa nupul Lisa kalender ja vali riik. Kui riigi kalender on jaotatud, vali ka piirkond või rühm.',
  'help.guide.school-holidays.step.3': 'Sulge Seaded. Iga vaheaeg saab oma päevade alaservas värvilise riba.',
  'help.guide.school-holidays.result':
    'Koolivaheajad on puhtalt visuaalsed: need ei vähenda kunagi kellegi puhkusepäevi.',
  'help.guide.school-holidays.tip.1':
    'Piirkond puudub? Sinu administraator saab koolivaheaegu käsitsi hallata jaotises Administraator, Isikupärastamine, Koolivaheajad.',

  // weekends
  'help.guide.weekends.title': 'Blokeeri nädalavahetused ja määra nädala algus',
  'help.guide.weekends.goal':
    'Jäta nädalavahetused arvestusest välja ja alusta nädalat päevaga, millega oled harjunud.',
  'help.guide.weekends.step.1': 'Ava Seaded.',
  'help.guide.weekends.step.2': 'Lülita Blokeeri nädalavahetused sisse ja vali, millised päevad on sinu nädalavahetus.',
  'help.guide.weekends.step.3': 'Vali jaotises Nädala alguspäev esmaspäev või pühapäev.',
  'help.guide.weekends.result': 'Blokeeritud päevad on ruudustikus hallid ja neid ei saa kogemata märkida.',

  // leave-year
  'help.guide.leave-year.title': 'Määra oma puhkuseaasta',
  'help.guide.leave-year.goal':
    'Arvesta puhkusepäevade õigust majandusaasta või tööleasumise kuupäeva järgi, mitte jaanuarist detsembrini.',
  'help.guide.leave-year.step.1': 'Ava Seaded ja leia Puhkuseaasta.',
  'help.guide.leave-year.step.2':
    'Vali Kalendriaasta, Majandusaasta (koos alguskuu ja -päevaga) või Tööleasumise kuupäev (koos kuupäevaga, mil tööle asusid).',
  'help.guide.leave-year.result':
    'Puhkusepäevade õigus, kasutatud päevad ja ülekandmine järgivad seda perioodi ning ruudustik algab selle esimesest kuust.',
  'help.guide.leave-year.tip.1': 'See seade on isiklik: ühendatud plaanis säilitab igaüks oma puhkuseaasta ja numbrid.',

  // carry-over
  'help.guide.carry-over.title': 'Kanna kasutamata päevad üle',
  'help.guide.carry-over.goal': 'Lisa perioodi lõpus allesjäänud päevad järgmisele perioodile.',
  'help.guide.carry-over.step.1': 'Ava Seaded.',
  'help.guide.carry-over.step.2': 'Lülita Ülekandmine sisse.',
  'help.guide.carry-over.result':
    'Ülekantav hulk arvutatakse kõigi sinu aastate peale uuesti ja kuvatakse puhkusepäevade õiguse all.',
  'help.guide.carry-over.tip.1': 'Väljalülitamine nullib kõik ülekantud saldod.',

  // invite
  'help.guide.invite.title': 'Planeeri koos kellegagi',
  'help.guide.invite.goal':
    'Ühenda oma plaan teise TREKi kasutajaga, et näeksite teineteise vabu päevi ühes ruudustikus.',
  'help.guide.invite.step.1': 'Klõpsa paneelis Inimesed inimese ikoonil.',
  'help.guide.invite.step.2': 'Vali kasutaja ja saada kutse.',
  'help.guide.invite.step.3': 'Teine inimene saab teavituse ja nõustub. Seni kuvatakse kutse ootel olevana.',
  'help.guide.invite.result':
    'Mõlemad plaanid liituvad: igal inimesel on oma värv, saate teineteisele päevi märkida ja kõik sünkroonitakse reaalajas.',
  'help.guide.invite.tip.1':
    'Ühendamise tühistamiseks kasuta seadetes nuppu Lahuta. Igaühe kirjed naasevad tema enda plaani.',
  'help.guide.invite.tip.2': 'Kui teine inimene peaks ainult sinu päevi nägema, jaga ühendamise asemel oma kalendrit.',

  // share-calendar
  'help.guide.share-calendar.title': 'Jaga oma kalendrit ainult vaatamiseks',
  'help.guide.share-calendar.goal': 'Luba kellelgi näha, millal oled vaba, andmata talle sõnaõigust sinu plaanis.',
  'help.guide.share-calendar.step.1': 'Klõpsa paneelis Jagatud kalendrid jagamisikoonil.',
  'help.guide.share-calendar.step.2': 'Vali kasutaja ja klõpsa nupul Jaga. Nõustumist pole vaja.',
  'help.guide.share-calendar.step.3':
    'Sinuga jagatud kalendrid ilmuvad samasse paneeli; silm peidab kalendri, Lõpeta jagamine tühistab sinu jagamise.',
  'help.guide.share-calendar.result':
    'Sinu vabad päevad ilmuvad tema ruudustikule värvilise rõngana. Midagi, mida jagad, ei saa ta muuta.',
  'help.guide.share-calendar.tip.1':
    'Jagamine ja ühendamine on teineteisest sõltumatud: võid olla ühendatud ühe inimesega ja jagada teistega.',
  'help.guide.share-calendar.tip.2': 'Hõljuta kursorit rõngaga päeva kohal, et näha, kes on vaba ja kui kauaks.',

  // ── Screen: atlas ──────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas on sinu reisijälg maailmakaardil: iga riik, kuhu mõni reis sind on viinud, on värvitud ja need, mida külastasid enne TREKi, saad lisada käsitsi. Piirkondade nägemiseks suurenda, pea soovinimekirja kohtadest, mida veel näha tahad, ja loe oma numbreid alumiselt klaaspaneelilt.',
  'help.ctx.atlas.bullet.1':
    'Kaart: külastatud riikidel on värv, mis jääb neile, plaanis olevatel riikidel on katkendlik piirjoon, soovinimekirja riikidel diagonaalne viirutus, kõik muu on hall. Hõljuta kursorit riigi kohal, et näha selle reise, kohti ning esimest ja viimast külastust.',
  'help.ctx.atlas.bullet.2':
    'Otsing üleval: sisesta riik või koht. Riigi valimine viib kaardi sinna ja avab selle hüpikakna; koha valimine viib selle piirkonda, et saaksid selle märkida.',
  'help.ctx.atlas.bullet.3':
    'Näita plaanis olevaid riike, üleval paremal: toob nähtavale sinu eelseisvate reiside riigid. Lüliti ilmub ainult siis, kui sul neid on.',
  'help.ctx.atlas.bullet.4':
    'Alumine paneel: vahekaart Statistika riikide, reiside, kohtade, linnade, päevade, maailmajagude ja sinu järjestikuste aastatega; vahekaart Soovinimekiri sellega, mis on veel ees.',
  'help.ctx.atlas.bullet.5':
    'Piirkonnad: alates suumitasemest 5 lülitub kaart osariikidele ja provintsidele, millest igaühel saab märkimiseks või märke eemaldamiseks klõpsata.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: kui lisamoodul on ühendatud, märgib statistikast vasakul olev paneel soove täidetuks ja lisab riike sinu salvestustest, kuid mitte kunagi ilma sinu kinnituseta.',
  // mark-country
  'help.guide.mark-country.title': 'Märgi riik külastatuks',
  'help.guide.mark-country.goal': 'Lisa riik, kus käisid enne TREKi, et kaart ja sinu riikide arv seda arvestaksid.',
  'help.guide.mark-country.step.1': 'Sisesta riik kaardi ülaosas olevasse otsingukasti.',
  'help.guide.mark-country.step.2': 'Vali see loendist. Kaart liigub sinna ja avaneb selle riigi hüpikaken.',
  'help.guide.mark-country.step.3': 'Vali Märgi külastatuks.',
  'help.guide.mark-country.result':
    'Riik saab kaardil oma värvi ja Riigid suureneb ühe võrra. See värv on püsiv: uute riikide märkimine ei sega kunagi ülejäänute värve.',
  'help.guide.mark-country.tip.1':
    'Kaardil hallil riigil klõpsamine avab sama hüpikakna; väikeste riikide puhul on otsing kindlam tee.',
  'help.guide.mark-country.tip.2':
    'Käsitsi märgitud riik loetakse alati külastatuks, olenemata sinna suunduvate reiside kuupäevadest.',
  // unmark-country
  'help.guide.unmark-country.title': 'Eemalda märgitud riik',
  'help.guide.unmark-country.goal': 'Võta käsitsi märgitud riik kaardilt uuesti maha.',
  'help.guide.unmark-country.step.1':
    'Otsi riik ja vali see või klõpsa sellel kaardil. Kui oled riigi ise märkinud, küsib hüpikaken, kas see eemaldada.',
  'help.guide.unmark-country.step.2': 'Kinnita nupuga Eemalda.',
  'help.guide.unmark-country.result': 'Riik muutub taas halliks ja kaob sinu arvestusest.',
  'help.guide.unmark-country.tip.1':
    'Nii saab eemaldada ainult käsitsi märgitud riike. Reiside või kohtadega riik jääb alles seni, kuni need on olemas; käsitsi märgitud riigi puhul on Eemalda ka selle detailikaardil paneelis.',
  // country-details
  'help.guide.country-details.title': 'Vaata, mida riigis tegid',
  'help.guide.country-details.goal': 'Ava külastatud riik ja mine reisidele, mis sind sinna viisid.',
  'help.guide.country-details.step.1': 'Otsi riiki, mida oled külastanud.',
  'help.guide.country-details.step.2':
    'Vali see. Kaart liigub sinna ja alumises paneelis avaneb detailikaart riigi lipu, kohtade, reiside ning iga reisi kiibiga.',
  'help.guide.country-details.result': 'Klõpsa reisi kiibil, et avada see reis planeerijas.',
  'help.guide.country-details.tip.1':
    'Kaardil riigi kohal hõljumine näitab samu numbreid ning lisaks esimest ja viimast külastust.',
  // planned-countries
  'help.guide.planned-countries.title': 'Näita riike, kuhu oled minemas',
  'help.guide.planned-countries.goal': 'Too eelseisvate reiside riigid kaardile, ilma et neid külastatuks loetaks.',
  'help.guide.planned-countries.step.1':
    'Lülita üleval paremal sisse Näita plaanis olevaid riike. Selle kõrval olev number näitab, mitu neid ootab.',
  'help.guide.planned-countries.step.2':
    'Otsi plaanis olevat riiki ja vali see: paneelis on kirjas Plaanis ja kaardi kohtspikker näitab, millal sa lähed.',
  'help.guide.planned-countries.result':
    'Plaanis olevad riigid kuvatakse katkendliku piirjoonega, nii et need ei näe kunagi välja nagu kohad, kus oled juba käinud. Lüliti jätab sinu valiku meelde.',
  'help.guide.planned-countries.tip.1':
    'Riik loetakse külastatuks, kui sinna suunduv reis on alanud; ka käimasolev reis loeb. Kuupäevadeta reisid jäävad statistikast täielikult välja.',
  'help.guide.planned-countries.tip.2': 'Lüliti on olemas ainult siis, kui sul on eelseisvaid reise.',
  // regions
  'help.guide.regions.title': 'Märgi piirkond',
  'help.guide.regions.goal': 'Mine riikidest täpsemaks: märgi osariigid, provintsid või prefektuurid, kus oled käinud.',
  'help.guide.regions.step.1':
    'Suurenda riiki, kuni selle piirkonnad ilmuvad, alates suumitasemest 5. Riigi otsimine ja valimine viib sind piisavalt lähedale.',
  'help.guide.regions.step.2':
    'Klõpsa piirkonnal. Hõljumine näitab selle nime; hüpikaken näitab piirkonda ja selle riiki.',
  'help.guide.regions.step.3': 'Vali Märgi külastatuks.',
  'help.guide.regions.result':
    'Piirkond täitub riigi värviga. Piirkonna märkimine loeb ka riigi külastatuks, kui see seda juba polnud.',
  'help.guide.regions.tip.1':
    'Külastatud piirkonnal klõpsamine pakub valikut Eemalda, olenemata sellest, kas märkisid selle sina või pani selle sinna mõni koht.',
  'help.guide.regions.tip.2': 'Piirkonnad, kus sul on päris kohti, märgitakse sinu eest; seal pole midagi teha.',
  // search-place
  'help.guide.search-place.title': 'Leia koht ja märgi selle piirkond',
  'help.guide.search-place.goal': 'Märgi Lombardia Milanot otsides, teadmata, millises piirkonnas linn asub.',
  'help.guide.search-place.step.1':
    'Sisesta otsingukasti linn, vaatamisväärsus või aadress. Esimesena tulevad riigid; sobivad kohad ilmuvad nende all jaotises Kohad.',
  'help.guide.search-place.step.2':
    'Vali koht. Kaart liigub sinna ja teeb kindlaks, millises piirkonnas see paik asub.',
  'help.guide.search-place.step.3':
    'Vali selle piirkonna jaoks Märgi külastatuks või Lisa soovinimekirja, kui see on sul alles ees.',
  'help.guide.search-place.result':
    'Piirkond märgitakse ja koos sellega ka riik. Riikide puhul, mille kohta kaardipaketis piirkonnaandmeid pole, märgitakse riik ise.',
  'help.guide.search-place.tip.1':
    'Kohad pärinevad samast otsingust nagu mujal TREKis, seega kasutavad need teenusepakkujat, mille sinu administraator on seadistanud.',
  // bucket-country
  'help.guide.bucket-country.title': 'Lisa riik soovinimekirja',
  'help.guide.bucket-country.goal': 'Pea riikide soovinimekirja otse kaardil, eraldi nendest, kus oled käinud.',
  'help.guide.bucket-country.step.1': 'Otsi riik ja vali see või klõpsa sellel kaardil.',
  'help.guide.bucket-country.step.2': 'Vali Lisa soovinimekirja.',
  'help.guide.bucket-country.step.3':
    'Kui tead juba, millal, vali kuu ja aasta, seejärel kinnita nupuga Lisa soovinimekirja.',
  'help.guide.bucket-country.result':
    'Riik joonistatakse diagonaalse viirutusega selles värvis, mille see saab, kui sinna jõuad, ja see ilmub paneeli vahekaardile Soovinimekiri.',
  'help.guide.bucket-country.tip.1': 'Kui riik on nimekirjas, pakub sama hüpikaken valikut Eemalda soovinimekirjast.',
  'help.guide.bucket-country.tip.2':
    'Üks kirje sihtkuupäeva kohta: sama riik võib olla nimekirjas kahe erineva kuu jaoks, kuid mitte kaks korda sama kuu jaoks.',
  // bucket-place
  'help.guide.bucket-place.title': 'Lisa koht soovinimekirja',
  'help.guide.bucket-place.goal':
    'Salvesta linn, vaatamisväärsus või aadress, millest unistad, koos koordinaatide ja sihtkuupäevaga.',
  'help.guide.bucket-place.step.1': 'Ava alumises paneelis vahekaart Soovinimekiri.',
  'help.guide.bucket-place.step.2': 'Klõpsa nupul Lisa koht.',
  'help.guide.bucket-place.step.3':
    'Sisesta nimi ja vajuta otsingunuppu; vali vaste, et kohal oleksid koordinaadid. Toimib ka nime sisestamine ilma otsinguta.',
  'help.guide.bucket-place.step.4': 'Soovi korral vali kuu ja aasta ning klõpsa nupul Lisa.',
  'help.guide.bucket-place.result':
    'Koht on sinu soovinimekirja tipus koos sihtkuupäevaga; selle kõrval olev × eemaldab selle uuesti.',
  'help.guide.bucket-place.tip.1':
    'Koordinaatidega soovi saab Dawarich hiljem sinu eest täidetuks märkida, kui sinu salvestused näitavad, et olid seal.',
  // stats
  'help.guide.stats.title': 'Loe oma statistikat',
  'help.guide.stats.goal': 'Tea, mida paneeli numbrid loendavad ja mida mitte.',
  'help.guide.stats.step.1':
    'Riigid on erinevate riikide arv, kus oled päriselt käinud; plaanis olevad kuvatakse selle kõrval, mitte selle sees. Reisid, Kohad ja Päevad on kõigi sinu reiside kogusummad. Linnad tuletatakse sinu kohtade aadressidest, seega on see hinnang.',
  'help.guide.stats.step.2':
    'Maailmajaod näitavad külastatud riike maailmajao kaupa; Antarktika lisandub ritta, kui oled seal käinud. Seejärel sinu järjestikused aastad, ehk mitu aastat järjest oled teinud vähemalt ühe reisi, ja mitu reisi tegid sel aastal.',
  'help.guide.stats.result': 'Numbrid järgivad sinu reise, kui neid planeerid; siin pole midagi vaja hallata.',
  'help.guide.stats.tip.1':
    'Linnad loetakse aadressi tekstist, mitte ei otsita, seega võib lühike aadress nagu „Osteria Francescana, Italy“ või prefektuuriga lõppev aadress anda linna asemel piirkonna.',
  'help.guide.stats.tip.2':
    'Käsitsi märgitud riigid loetakse jaotistes Riigid ja maailmajaod, kuid need ei too kaasa reise, kohti ega päevi.',

  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Lisa riike oma salvestustest',
  'help.guide.dawarich-countries.goal':
    'Lase Dawarichil öelda, millistes riikides viimase aasta jooksul käisid, ja pane kinnitatud riigid kaardile.',
  'help.guide.dawarich-countries.step.1':
    'Kui Dawarichi lisamoodul on ühendatud, on kaardi allosas statistikast vasakul Dawarichi paneel kahe paaniga. Klõpsa paanil Riigid.',
  'help.guide.dawarich-countries.step.2':
    'Dialoog avaneb vahekaardil Riigid. Klõpsa nupul Otsi riike: TREK loeb kuu kaupa riigid ja linnad, mida sinu salvestused viimase 12 kuu jooksul katavad, seega anna talle hetk aega. Iga riik, mida sinu Atlases veel pole, on loetletud koos lipu, linnade arvu ja neist esimese nimega ning on algselt linnukesega märgitud; klõpsa real, et see välja jätta.',
  'help.guide.dawarich-countries.step.3':
    'Kinnita paremas alanurgas oleva nupuga, millel on kirjas Lisa 5 riiki, kui viis rida on linnukesega märgitud. Dialoog ütleb, mitu riiki lisati; sulge see ja kaart on end uuesti laadinud.',
  'help.guide.dawarich-countries.result':
    'Kinnitatud riikidel on kaardil värv ja need loetakse jaotises Riigid, salvestatuna Dawarichist pärinevana. Käsitsi märgitu jääb puutumata.',
  'help.guide.dawarich-countries.tip.1':
    'Riigid, mida Atlas juba külastatuna näitab, olgu käsitsi, reisi põhjal või varasemast kontrollist, jäetakse välja, nii et sinu enda märgistusi ei märgistata kunagi ümber. Riik, mille Atlasest varem eemaldasid, tuleb tagasi, kui selle siin kinnitad.',
  'help.guide.dawarich-countries.tip.2':
    'Riigi nimi, mida TREK ei suuda sobitada, loetletakse ridade all, mitte ei jäeta välja, ja Kontrolli uuesti küsib Dawarichilt veel kord. Nimekirja all olev märkus ütleb, et vaadati viimast 12 kuud; see ajavahemik on fikseeritud.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Märgi soovid salvestuste põhjal täidetuks',
  'help.guide.dawarich-wishes.goal':
    'Uuri välja, millistesse soovinimekirja kohtadesse oled tegelikult jõudnud, ja märgi need täidetuks selle päevaga, mil see juhtus.',
  'help.guide.dawarich-wishes.step.1':
    'Klõpsa kaardi allosas statistikast vasakul olevas Dawarichi paneelis paanil Soovinimekiri.',
  'help.guide.dawarich-wishes.step.2':
    'Dialoog avaneb vahekaardil Soovinimekiri. Klõpsa nupul Kontrolli soovinimekirja: TREK otsib sinu salvestustest iga koordinaatidega kirjet. Soov, milleni jõudsid, on loetletud koos sellega, kui lähedale jõudsid, kui kaua viibisid ja mis päeval, ning on algselt linnukesega märgitud; juba täidetuks märgitud soovi juures on kirjas Juba täidetuks märgitud. Nimekirja all loendab märkus koordinaatideta kirjeid ja seal on kirjas ka reegel: Soov loetakse täidetuks, kui viibid vähemalt 20 minutit kohast 250 m raadiuses.',
  'help.guide.dawarich-wishes.step.3':
    'Kinnita paremas alanurgas oleva nupuga, millel on kirjas Märgi 2 täidetuks, kui kaks rida on linnukesega märgitud. Seejärel sulge dialoog ja ava selle kõrval paneeli vahekaart Soovinimekiri.',
  'help.guide.dawarich-wishes.result':
    'Igal soovil on roheline linnuke viibimise kuupäevaga, mitte tänase kuupäevaga; selle kohtspikris on kirjas Täidetuks märgitud sinu Dawarichi salvestuste põhjal ja klõps kuupäeval võtab selle tagasi.',
  'help.guide.dawarich-wishes.tip.1':
    'Möödasõit ei loe: reegel nõuab nii lähedust kui ka aega ja mitme sobiva viibimise puhul võidab pikim. Koordinaatideta soovi ei saa kontrollida, seega lisa kohad jaotise Lisa koht otsingu kaudu, mitte ainult nime järgi.',
  'help.guide.dawarich-wishes.tip.2':
    'Üks kontroll vaatab läbi kuni 50 kirjet, esmalt need, mis pole veel täidetuks märgitud, ja annab teada, kui neid oli rohkem. Juba täidetuks märgitud soov säilitab oma kuupäeva.',
  // ── Screen: collections ────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Kogumikud',
  'help.ctx.collections.summary':
    'Kogumikud on sinu kohtade raamatukogu väljaspool reise: nimega nimekirjad kohtadest, mille oled leidnud ja mida soovid alles hoida, igal kohal olek Idee, Tahan minna või Külastatud. Kohad kopeeritakse reisidesse ja reisidest välja, neid ei linkida kunagi, nii et nimekiri ja reis ei muuda kunagi teineteist.',
  'help.ctx.collections.bullet.1':
    'Nimekirjade riba vasakul: sinu enda nimekirjad, sinuga jagatud nimekirjad, vastust ootavad kutsed, Kõik salvestatud kõige sulle kuuluva ühendina ning üleval Uus nimekiri ja failist importimine.',
  'help.ctx.collections.bullet.2':
    'Avatud nimekirja päis: selle värv, kaanepilt, kirjeldus ja lingid, liikmed ning paremal toimingud Muuda, Ekspordi ja Jaga.',
  'help.ctx.collections.bullet.3':
    'Filtririda kohtade kohal: olek, kategooria, hinnang ja sortimine, sildifilter, + koha lisamiseks, reisist importimine ja Vali hulgitoiminguteks.',
  'help.ctx.collections.bullet.4':
    'Kohtade read: avatar, nimi ja aadress, sildid ja kategooria ning paremal olekunupp, mis vahetub ühe klõpsuga.',
  'help.ctx.collections.bullet.5':
    'Kaart paremal: iga koordinaatidega koha jaoks nööpnõel, loendi ja kaardi lüliti, otsingukast ja sildifilter. Nööpnõelal klõpsamine avab selle koha.',
  'help.ctx.collections.bullet.6':
    'Detailileht: klõpsa real, et näha kaanepilti, kategooriat, silte, olekut, kirjeldust ja linke koos nuppudega Muuda, Kopeeri reisile ja Eemalda nimekirjast.',
  // create-list
  'help.guide.create-list.title': 'Loo nimekiri',
  'help.guide.create-list.goal': 'Alusta uut nimega nimekirja koos värvi ja kaanepildiga, valmis kohtade lisamiseks.',
  'help.guide.create-list.step.1': 'Klõpsa nimekirjade riba ülaosas nupul Uus nimekiri.',
  'help.guide.create-list.step.2':
    'Anna nimekirjale nimi ja vali värv. Kaanepilt, kirjeldus ja lingid on valikulised; saad need hiljem lisada nupuga Muuda.',
  'help.guide.create-list.step.3': 'Klõpsa nupul Loo.',
  'help.guide.create-list.result':
    'Nimekiri avaneb tühjana ja selle täitmiseks on kaks võimalust: Lisa koht ja Impordi reisist.',
  'help.guide.create-list.tip.1':
    'Kaanepildiks võib olla sinu enda üleslaaditud pilt või samas dialoogis Unsplashi otsingu kaudu leitud pilt.',
  // add-place
  'help.guide.add-place.title': 'Lisa koht',
  'help.guide.add-place.goal':
    'Leia koht ja salvesta see avatud nimekirja koos nime, kategooria, oleku ja märkmetega ühe korraga.',
  'help.guide.add-place.step.1': 'Klõpsa kohtade kohal olevas filtrireas nupul +.',
  'help.guide.add-place.step.2':
    'Sisesta koht otsinguväljale ja vali tulemus. Nimi, aadress ja koordinaadid täidetakse selle põhjal.',
  'help.guide.add-place.step.3':
    'Määra olek ja soovi korral kategooria, kirjeldus ja lingid, seejärel klõpsa nupul Lisa. Dialoog jääb järgmise koha jaoks avatuks; Tühista sulgeb selle.',
  'help.guide.add-place.result': 'Koht ilmub nimekirja ja, kui sellel on koordinaadid, nööpnõelana kaardile.',
  'help.guide.add-place.tip.1':
    'Reisi seest paneb koha inspektoris või koha menüüs olev Salvesta kogumikku reisi koha nimekirja ilma reisist lahkumata.',
  'help.guide.add-place.tip.2':
    'Nimekiri peab olema sinu oma või selline, kus oled muutja või administraator; vaates Kõik salvestatud või ainult vaatamiseks mõeldud nimekirjas nuppu + pole.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Impordi kohad reisist',
  'help.guide.import-from-trip.goal':
    'Too kogu reisi kohad korraga nimekirja, selle asemel et neid ükshaaval salvestada.',
  'help.guide.import-from-trip.step.1':
    'Klõpsa filtrireas pilvenoolega impordinupul. Tühjas nimekirjas on sama toiming nupu Lisa koht kõrval.',
  'help.guide.import-from-trip.step.2': 'Vali üks oma reisidest.',
  'help.guide.import-from-trip.step.3':
    'Märgi linnukesega kohad, mida soovid. Nimekirjas juba olevad kohad on hallid; kohad, mida ükski reisi päev ei sisalda, on algselt valitud. Ainult uued peidab selle, mis sul juba on.',
  'help.guide.import-from-trip.step.4': 'Klõpsa nupul Impordi. Nupp näitab alati, mitu kohta lisatakse.',
  'help.guide.import-from-trip.result':
    'Kohad kopeeritakse nimekirja koos nime, aadressi, koordinaatide, kirjelduse ja kategooriaga. Reis jääb selliseks, nagu see oli.',
  'help.guide.import-from-trip.tip.1':
    'Nime või koordinaatide järgi leitud duplikaadid jäetakse automaatselt vahele, nii et kaks korda importimine ei tee halba.',
  'help.guide.import-from-trip.tip.2':
    'Reisi kohtade loendis pakub valikurežiim hoopis valikut Salvesta kogumikku käsitsi valitud kohtade jaoks.',
  // place-status
  'help.guide.place-status.title': 'Määra koha olek',
  'help.guide.place-status.goal': 'Pea arvet, mis on idee, mis on lühinimekirjas ja kus oled käinud.',
  'help.guide.place-status.step.1': 'Klõpsa koha rea paremas otsas oleval olekunupul. Idee muutub olekuks Tahan minna.',
  'help.guide.place-status.step.2': 'Klõpsa uuesti, et saada Külastatud, ja veel kord, et alustada uuesti Ideest.',
  'help.guide.place-status.result': 'Nupp ja selle värv muutuvad kohe; nimekirja kohal olev olekufilter loendab kaasa.',
  'help.guide.place-status.tip.1': 'Olek kuulub Kogumike juurde: koha kopeerimisel reisi seda kaasa ei võeta.',
  'help.guide.place-status.tip.2':
    'Reisist näitab Salvesta nimekirja olekunuppu iga nimekirja kohta, milles koht on, ja kohtade paneelil on valiku jaoks toiming Märgi külastatuks.',
  // place-detail
  'help.guide.place-detail.title': 'Ava salvestatud koht',
  'help.guide.place-detail.goal': 'Vaata kõike koha kohta ja tegutse: muuda, kopeeri reisile, eemalda.',
  'help.guide.place-detail.step.1': 'Klõpsa koha real. Detailileht avaneb nimekirja kõrval ja kaart liigub kohani.',
  'help.guide.place-detail.step.2':
    'All on nupud Muuda, Kopeeri reisile ja Eemalda nimekirjast; kaanepildil olev kaamera asendab automaatse foto sinu enda omaga.',
  'help.guide.place-detail.result':
    'Muuda avab nime, kategooria, sildid, aadressi, koordinaadid, kirjelduse ja lingid muutmiseks otse lehel.',
  'help.guide.place-detail.tip.1':
    'Kaanepilt tuuakse automaatselt, kui kohal pole oma pilti. Sinu enda üleslaaditud pilt võib olla JPG, PNG, GIF või WebP kuni 20 MB.',
  'help.guide.place-detail.tip.2':
    'Jagatud nimekirja liikmed saavad siin ka tärnidega hinnangu anda ja filtrirea hinnangufilter kasutab keskmist.',
  // labels
  'help.guide.labels.title': 'Rühmita kohad siltidega',
  'help.guide.labels.goal': 'Anna nimekirjale lisaks ühistele kategooriatele oma sildid, näiteks linnaosad või päevad.',
  'help.guide.labels.step.1': 'Ava siltide haldur filtrirea sildijuhtelemendist.',
  'help.guide.labels.step.2':
    'Sisesta nimi, vali värv ja klõpsa nupul Lisa silt. Olemasolevaid silte saad samas dialoogis ümber nimetada, ümber värvida või kustutada.',
  'help.guide.labels.step.3':
    'Lülita sisse Vali, märgi kohad linnukesega ja klõpsa valikuribal nupul Määra silt. Üksikule kohale saab silte lisada ka selle detaililehel nupu Muuda kaudu.',
  'help.guide.labels.step.4':
    'Vali filtrireas üks või mitu silti, et kitsendada nimekirja ja kaarti kohtadele, millel on mõni neist.',
  'help.guide.labels.result':
    'Sildistatud kohtade sildid kuvatakse real; sildifilter on olemas igale liikmele, ka vaatajatele.',
  'help.guide.labels.tip.1':
    'Sildid kuuluvad ainult sellele nimekirjale, kus need loodi. Koha teisaldamisel teise nimekirja need kaovad.',
  'help.guide.labels.tip.2': 'Siltide haldamiseks ja määramiseks on vaja nimekirja muutmisõigust.',
  // filter-select
  'help.guide.filter-select.title': 'Filtreeri ja vali kohti',
  'help.guide.filter-select.goal': 'Kitsenda nimekirja ja tegutse korraga paljude kohtadega.',
  'help.guide.filter-select.step.1':
    'Kasuta filtrirea rippmenüüsid: olek, kategooria, minimaalne hinnang ja sortimisjärjekord. Igaüks näitab, mitu kohta see alles jätaks.',
  'help.guide.filter-select.step.2': 'Klõpsa nupul Vali. Igale reale ilmub märkeruut ja kuvatakse valikuriba.',
  'help.guide.filter-select.step.3':
    'Märgi kohad linnukesega või kasuta valikut Vali kõik kõige praegu filtreeritu jaoks, seejärel vali Määra silt, Teisalda nimekirja, Kopeeri nimekirja, Kopeeri reisile või Kustuta.',
  'help.guide.filter-select.result':
    'Toimingud rakenduvad korraga kogu valikule. Paremal olev × väljub valikurežiimist.',
  'help.guide.filter-select.tip.1':
    'Vali kõik järgib filtrit, nii et filtreerimine olekule Tahan minna ja kõigi valimine on kiire viis lühinimekirjaga tegutseda.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kopeeri kohad reisi',
  'help.guide.copy-to-trip.goal': 'Muuda salvestatud kohad peatusteks mõnel oma reisil.',
  'help.guide.copy-to-trip.step.1':
    'Lülita sisse Vali ja märgi kohad linnukesega või ava üks koht ja kasuta selle detaililehel nuppu Kopeeri reisile.',
  'help.guide.copy-to-trip.step.2': 'Klõpsa valikuribal nupul Kopeeri reisile.',
  'help.guide.copy-to-trip.step.3': 'Vali reis. Otsingukast kitsendab pikka loendit.',
  'help.guide.copy-to-trip.result':
    'Kohad jõuavad selle reisi kohtade loendisse koos nime, kirjelduse, kategooria, märkmete, hinna, koordinaatide, foto ja siltidega. Kogumikus ei muutu midagi.',
  'help.guide.copy-to-trip.tip.1':
    'Ka jagatud nimekirja vaatajad saavad seda teha; see kopeerib nimekirjast välja, mitte ei muuda seda.',
  // share-list
  'help.guide.share-list.title': 'Jaga nimekirja kellegagi',
  'help.guide.share-list.goal': 'Planeeri nimekirja koos teiste selle TREKi kasutajatega reaalajas.',
  'help.guide.share-list.step.1': 'Klõpsa oma nimekirja päises nupul Jaga.',
  'help.guide.share-list.step.2': 'Vali kasutaja ja roll: Vaataja, Muutja või Administraator.',
  'help.guide.share-list.step.3':
    'Klõpsa nupul Saada kutse. Inimene kuvatakse ootel olevana, kuni ta võtab kutse oma nimekirjade ribal vastu.',
  'help.guide.share-list.result':
    'Pärast vastuvõtmist ilmub nimekiri tema jaoks jaotisse Jagatud ja iga muudatus sünkroonitakse reaalajas. Liikmeid ja nende rolle saab samas dialoogis edasi muuta.',
  'help.guide.share-list.tip.1':
    'Vaatajad saavad vaadata, hinnata ja kohti oma reisidesse kopeerida. Muutjad lisavad ja muudavad kohti ja silte. Administraatorid saavad ka kustutada.',
  'help.guide.share-list.tip.2':
    'Ainult omanik kutsub ja eemaldab inimesi; liige saab jagatud nimekirjast ise lahkuda.',
  // export-list
  'help.guide.export-list.title': 'Ekspordi nimekiri failina',
  'help.guide.export-list.goal': 'Anna nimekiri kellelegi teises TREKis või vii see kaardirakendusse.',
  'help.guide.export-list.step.1': 'Klõpsa nimekirja päises nupul Ekspordi.',
  'help.guide.export-list.step.2':
    'Vali TREKi nimekiri teise TREKi jaoks koos siltide ja olekuga või GPX rakenduste OsmAnd ja Organic Maps, Garmini seadme ning muude teekonnapunkte lugevate rakenduste jaoks.',
  'help.guide.export-list.result': 'Fail laaditakse alla. Jagatud nimekirja võib eksportida iga liige.',
  'help.guide.export-list.tip.1':
    'Koordinaatideta koht ei saa olla GPX-teekonnapunkt; see jäetakse välja ja TREK ütleb, mitu selliseid oli.',
  'help.guide.export-list.tip.2':
    'Hinnangud, liikmed ja üleslaaditud fotod jäävad meelega maha; need kuuluvad sellele TREKile, mitte nimekirjale.',
  // import-file
  'help.guide.import-file.title': 'Impordi nimekiri failist',
  'help.guide.import-file.goal':
    'Too sisse TREKi nimekirja fail või GPX-fail, uue nimekirjana või olemasolevasse nimekirja.',
  'help.guide.import-file.step.1':
    'Klõpsa nimekirjade ribal nupu Uus nimekiri kõrval oleval üleslaadimisnoolega impordinupul.',
  'help.guide.import-file.step.2':
    'Vali fail. TREK näitab enne, kui midagi juhtub, mis selles on: nimi, mitu kohta ja silti.',
  'help.guide.import-file.step.3':
    'Jäta valikuks Uus nimekiri ja soovi korral muuda nime või vali Lisa nimekirja, et panna kohad nimekirja, mida saad muuta, seejärel klõpsa nupul Impordi.',
  'help.guide.import-file.result':
    'Jõuad imporditud kohtadega nimekirja. Nimekirja lisamine ainult lisab; juba olemasolevad kohad säilitavad oma oleku, märkmed ja sildid.',
  'help.guide.import-file.tip.1':
    'GPX-failist saab igast nimega teekonnapunktist koht; rajad on jooned ja jäetakse välja ning eelvaade ütleb, mitu punkti neid oli.',
  'help.guide.import-file.tip.2':
    'Fail, mis pole ei TREKi nimekiri ega GPX, lükatakse põhjendusega tagasi; üksik loetamatu koht jäetakse vahele, mitte kogu fail.',
  // edit-list
  'help.guide.edit-list.title': 'Muuda või kustuta nimekiri',
  'help.guide.edit-list.goal': 'Muuda nimekirja nime, värvi, kaanepilti, kirjeldust või linke või eemalda nimekiri.',
  'help.guide.edit-list.step.1': 'Klõpsa nimekirja päises nupul Muuda. Seda näeb ainult omanik.',
  'help.guide.edit-list.step.2':
    'Muuda, mida soovid, ja klõpsa nupul Salvesta. Vasakus alanurgas olev Kustuta nimekiri eemaldab pärast kinnitust nimekirja koos kõigi selle kohtadega.',
  'help.guide.edit-list.result': 'Päis saab kohe uue värvi, kaanepildi ja kirjelduse.',
  'help.guide.edit-list.tip.1':
    'Nimekirja kustutamist ei saa tagasi võtta. Kui soovid koopiat alles hoida, ekspordi see enne.',
  // all-saved
  'help.guide.all-saved.title': 'Otsi kogu oma raamatukogust',
  'help.guide.all-saved.goal': 'Vaata korraga läbi kõik sulle kuuluvad nimekirjad.',
  'help.guide.all-saved.step.1':
    'Klõpsa nimekirjade ribal valikul Kõik salvestatud. See ühendab kõigi sulle kuuluvate või kaasomatavate nimekirjade kohad.',
  'help.guide.all-saved.step.2':
    'Kasuta otsingukasti ja filtreid nagu igas nimekirjas; ka Vali töötab siin reisile kopeerimiseks.',
  'help.guide.all-saved.result':
    'Üks vaade kõigile sinu salvestatud kohtadele, ilma lisamise või importimiseta, kuna sellel pole ühte nimekirja, kuhu neid panna.',
  'help.guide.all-saved.tip.1': 'Sildid on nimekirjapõhised, seega vaates Kõik salvestatud sildifiltrit ei pakuta.',

  // ── Screen: journey ───────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Reisilugu',
  'help.ctx.journey.summary':
    'Reisilugu on sinu fotokeskne reisipäevik. Iga reisilugu on seotud ühe või mitme reisiga ja kasvab päev-päevalt sissekannetest, millel on lugu, fotod, meeleolu ja ilm. See vaade loetleb sinu reisilood; kirjutamiseks ava üks neist.',
  'help.ctx.journey.bullet.1':
    'Ülaosas olev bänner näitab käimasolevat või viimast reisilugu koos sissekannete, fotode ja kohtade arvuga. Jätka kirjutamist avab selle tänasel päeval.',
  'help.ctx.journey.bullet.2':
    'Allpool on iga reisiloo kohta kaart koos kaanepildi, alapealkirja, kuupäevade ja arvudega. Reisiloo avamiseks klõpsa kaardil.',
  'help.ctx.journey.bullet.3':
    'Ruudustiku viimane kaart, Loo uus reisilugu, alustab uut reisilugu sinu reiside põhjal.',
  // create-journey
  'help.guide.create-journey.title': 'Loo reisilugu',
  'help.guide.create-journey.goal': 'Alusta reisi päevikut, kus reisi kohad ootavad juba soovitustena.',
  'help.guide.create-journey.step.1': 'Klõpsa ruudustiku viimasel kaardil Loo uus reisilugu.',
  'help.guide.create-journey.step.2':
    'Anna sellele nimi ja soovi korral alapealkiri, seejärel märgi linnukesega reisid, millega see on seotud. Loendur näitab, mitu kohta lisandub.',
  'help.guide.create-journey.step.3': 'Klõpsa nupul Loo reisilugu.',
  'help.guide.create-journey.result':
    'Päevik avaneb. Iga seotud reisi koht on ajajoonel soovitusena, üks iga päeva kohta, kus see asub, valmis sisse kirjutamiseks.',
  'help.guide.create-journey.tip.1': 'Rohkem reise saab hiljem siduda jaotisest Reisiloo seaded.',
  'help.guide.create-journey.tip.2': 'Toimib ka reisideta reisilugu; siis lisad sissekanded käsitsi.',
  // open-journey
  'help.guide.open-journey.title': 'Ava reisilugu',
  'help.guide.open-journey.goal': 'Mine päevikusse ja tea, kus see avaneb.',
  'help.guide.open-journey.step.1':
    'Klõpsa kaardil. Igaüks näitab kaanepilti, kuupäevi ning mitu sissekannet, fotot ja kohta reisilugu sisaldab.',
  'help.guide.open-journey.result':
    'Käimasolev reisilugu avaneb tänasel päeval või, kui midagi pole veel kirjutatud, viimasel enne tänast olnud sissekandel; lõppenud reisilugu avaneb algusest.',
  'help.guide.open-journey.tip.1':
    'Kaanepilt on reisiloo esimene foto, kui sa pole jaotises Reisiloo seaded muud määranud.',
  // continue-writing
  'help.guide.continue-writing.title': 'Jätka käimasolevat reisilugu',
  'help.guide.continue-writing.goal': 'Mine otse käimasoleva reisiloo tänasele lehele.',
  'help.guide.continue-writing.step.1':
    'Klõpsa ülaosas bänneril nupul Jätka kirjutamist. See näitab käimasolevat reisilugu või, kui seda pole, viimast.',
  'help.guide.continue-writing.result':
    'Päevik avaneb tänasel päeval või, kui midagi pole veel kirjutatud, viimasel enne tänast olnud sissekandel.',
  'help.guide.continue-writing.tip.1':
    'Bänner pakub ka soovitust reisile, millel pole veel reisilugu; Jäta kõrvale peidab selle.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Päevik',
  'help.ctx.journey-detail.summary':
    'Üks avatud reisilugu: vasakul ajajoon päev-päevalt ja paremal kaart kõigi sissekannete ning seotud reiside kohtadega. Kõik, mis päevikusse lisab, on üleval; päises on arvud, Stuudio, soovituste lüliti ja Reisiloo seaded.',
  'help.ctx.journey-detail.bullet.1':
    'Päis: kaanepilt, pealkiri ja alapealkiri, päevade, kohtade, sissekannete ja fotode arv ning paremal Stuudio, soovituste lüliti ja Reisiloo seaded.',
  'help.ctx.journey-detail.bullet.2':
    'Tööriistariba: vahekaardid Ajajoon ja Galerii, Otsi sellest reisiloost ja Lisa sissekanne.',
  'help.ctx.journey-detail.bullet.3':
    'Ajajoon: iga päeva kohta jaotis nupuga + sellele päevale sissekande lisamiseks; sissekannete kaardid fotode, meeleolu, ilma ja looga; reiside soovitused heledamas stiilis koos valikuga Jäta see soovitus kõrvale.',
  'help.ctx.journey-detail.bullet.4':
    'Kaart: sissekanded nööpnõeltena, mida ühendab kuupäevade järjekorras katkendjoon, reiside kohad ja kõik nendesse reisidesse imporditud GPX-rajad.',
  'help.ctx.journey-detail.bullet.5':
    'Reisiloo seaded: kaanepilt, nimi ja alapealkiri, rajad kaardil, sissekande väljad, kõrvale jäetud soovitused, seotud reisid, kaasautorid, avalik jagamine, arhiveerimine ja kustutamine.',
  'help.ctx.journey-detail.bullet.6':
    'Pika ajajoone kohal hõljuvad kaks ümmargust nuppu: tagasi üles ja hüppa viimase sissekande juurde.',
  // add-entry
  'help.guide.add-entry.title': 'Kirjuta sissekanne',
  'help.guide.add-entry.goal': 'Lisa päeva lugu koos pealkirja, teksti, meeleolu ja ilmaga.',
  'help.guide.add-entry.step.1':
    'Klõpsa tööriistaribal nupul Lisa sissekanne või päeva päises nupul +, et alustada sellel päeval.',
  'help.guide.add-entry.step.2':
    'Anna hetkele nimi ja kirjuta lugu. Teksti kohal olev tööriistariba lisab Markdownis paksu ja kaldkirja, pealkirju, tsitaate, linke ja loendeid.',
  'help.guide.add-entry.step.3':
    'Vali meeleolu ja ilm, kontrolli kuupäeva ja soovi korral kinnita asukoht: otsi kohta või kasuta oma praegust asukohta.',
  'help.guide.add-entry.step.4': 'Klõpsa nupul Salvesta.',
  'help.guide.add-entry.result':
    'Sissekanne ilmub ajajoonel oma päevale ja nööpnõelana kaardile. Päises olevad arvud uuenevad.',
  'help.guide.add-entry.tip.1': 'Soovitusse kirjutamine avab sama redaktori, kus koht on juba määratud.',
  'help.guide.add-entry.tip.2':
    'All olevad sildid on vaba tekst, näiteks peidetud pärl või parim eine, ja otsing leiab need.',
  // entry-photos
  'help.guide.entry-photos.title': 'Lisa sissekandele fotosid ja videoid',
  'help.guide.entry-photos.goal': 'Lisa päevale pilte; esimesest saab sissekande kaanepilt.',
  'help.guide.entry-photos.step.1': 'Ava sissekande menüü selle kaardil oleva ⋯ kaudu ja vali Muuda.',
  'help.guide.entry-photos.step.2':
    'Klõpsa Laadi fotod üles ja vali failid. Galeriist võtab pildid, mis on juba reisiloo galeriis; Välised fotod otsib selle päeva pilte ühendatud Immichi või Synology kogust.',
  'help.guide.entry-photos.step.3':
    'Kaanepildi valimiseks hõljuta kursorit pildi kohal ja vali Määra esimeseks, seejärel klõpsa Salvesta.',
  'help.guide.entry-photos.result': 'Fotod kuvatakse kaardil ja galeriis; esimene on kõikjal pisipildiks.',
  'help.guide.entry-photos.tip.1':
    'Videod lisatakse sissekandele samamoodi: mp4, m4v, webm või mov kuni 500 MB, need salvestatakse üleslaaditud kujul.',
  'help.guide.entry-photos.tip.2':
    "iPhone'i HEIC-failid teisendatakse üleslaadimisel JPEG-vormingusse, mis eemaldab neist GPS- ja kaameraandmed.",
  // suggestions
  'help.guide.suggestions.title': 'Kasuta soovitusi või jäta need kõrvale',
  'help.guide.suggestions.goal':
    'Tee oma reiside kohtadest sissekanded ja eemalda need, millest sa kirjutada ei kavatse.',
  'help.guide.suggestions.step.1':
    'Soovitus on heledam kaart, millel koha nimi on kaldkirjas. Klõpsa sellel, et avada redaktor, kus koht ja päev on juba määratud.',
  'help.guide.suggestions.step.2':
    'Klõpsa kaardil, mida sa ei kasuta, Jäta see soovitus kõrvale. See kaob ajajoonelt ilma kustutamata ja reisi sünkroonimine ei paku seda uuesti.',
  'help.guide.suggestions.step.3':
    'Mõtlesid ümber? Reisiloo seaded näitavad, mitu soovitust on kõrvale jäetud, ja Taasta kõrvale jäetud soovitused toob need kõik tagasi.',
  'help.guide.suggestions.result':
    'Ajajoonel on ainult see, millest kavatsed kirjutada; päises olev lüliti peidab lugemise ajaks kõik soovitused korraga.',
  'help.guide.suggestions.tip.1': 'Koht, kus viibid kahel päeval, annab soovituse kummalegi päevale.',
  'help.guide.suggestions.tip.2': 'Soovitusi statistikas ei arvestata, ainult kirjutatud sissekandeid.',
  // add-on-day
  'help.guide.add-on-day.title': 'Lisa sissekanne varasemale päevale',
  'help.guide.add-on-day.goal': 'Kirjuta juba möödunud päevast, ilma et peaksid hiljem kuupäeva parandama.',
  'help.guide.add-on-day.step.1': 'Klõpsa selle päeva päises nuppu +.',
  'help.guide.add-on-day.step.2': 'Redaktor avaneb selle kuupäevaga. Kirjuta ja klõpsa nagu tavaliselt Salvesta.',
  'help.guide.add-on-day.result': 'Sissekanne jõuab kohe õigele päevale.',
  'help.guide.add-on-day.tip.1': 'Päeva piires liigutavad sissekande menüü nooled seda ettepoole või tahapoole.',
  // pros-cons
  'help.guide.pros-cons.title': 'Lisa hinnang',
  'help.guide.pros-cons.goal': 'Võta päev kokku: mis oli suurepärane ja mis mitte.',
  'help.guide.pros-cons.step.1':
    'Leia redaktoris loo alt Plussid ja miinused. Kirjuta punkt väljale Plussid või Miinused ja kasuta järgmise jaoks nuppu Lisa veel üks.',
  'help.guide.pros-cons.step.2': 'Salvesta. Hinnang kuvatakse kaardil kahe lühikese loendina.',
  'help.guide.pros-cons.result': 'Pöial üles ja pöial alla ühe pilguga, loo all.',
  'help.guide.pros-cons.tip.1':
    'Reisiloos, kus hinnanguid ei kasutata, saab selle jaotise välja lülitada Reisiloo seadetes jaotises Sissekande väljad.',
  // search-journey
  'help.guide.search-journey.title': 'Leia midagi pikast reisiloost',
  'help.guide.search-journey.goal': 'Jõua soovitud sissekandeni ilma nädalate kaupa kerimata.',
  'help.guide.search-journey.step.1':
    'Kirjuta tööriistaribal väljale Otsi sellest reisiloost. Ajajoon filtreerub kirjutamise ajal pealkirjade, lugude, kohtade ja siltide järgi. Diakriitikud ja suurtähed ei loe.',
  'help.guide.search-journey.step.2':
    'Päises olev soovituste lüliti peidab lugemise ajaks kirjutamata kaardid. Kui ajajoon on pikk, hõljuvad selle alumise serva kohal kaks ümmargust nuppu: tagasi algusesse ja hüppa viimase sissekande juurde.',
  'help.guide.search-journey.result':
    'Alles jäävad ainult vastavad sissekanded; kõige uuesti nägemiseks tühjenda otsinguväli.',
  'help.guide.search-journey.tip.1':
    'Käimasolev reisilugu avaneb tänasel päeval, nii et praegune koht on tavaliselt juba nähtaval.',
  'help.guide.search-journey.tip.2': 'Ka sildid loevad: otsing peidetud pärl leiab iga sissekande, millel see silt on.',
  // gallery-map
  'help.guide.gallery-map.title': 'Sirvi galeriid ja kaarti',
  'help.guide.gallery-map.goal': 'Vaata kogu reisilugu piltidena ja kohtadena kaardil.',
  'help.guide.gallery-map.step.1':
    'Lülita tööriistaribal vaatele Galerii: iga sissekande kõik fotod ning otse galeriisse üles laaditud pildid. Klõpsa pildil, et avada see suurvaates.',
  'help.guide.gallery-map.step.2':
    'Paremal olev kaart näitab sissekandeid nööpnõeltena kuupäevade järjekorras, seotud reiside kohti ja nendesse reisidesse imporditud GPX-radu samas värvis, mis neil on planeerijas.',
  'help.guide.gallery-map.result':
    'Raja nime nägemiseks hõljuta kursorit selle kohal. Sissekannete vahelise katkendjoone joonistab TREK; rada on teekond, mille sa tegelikult salvestasid.',
  'help.guide.gallery-map.tip.1': 'Rajad saab reisiloo jaoks välja lülitada Reisiloo seadetes.',
  'help.guide.gallery-map.tip.2':
    'Asukohaga galeriifotod ilmuvad ka avalikule kaardile, kui nii Galerii kui ka Kaart on jagatud.',
  // entry-fields
  'help.guide.entry-fields.title': 'Lülita sissekande väljad välja',
  'help.guide.entry-fields.goal': 'Hoia redaktoris ainult seda, mida see reisilugu kasutab.',
  'help.guide.entry-fields.step.1': 'Ava päisest Reisiloo seaded.',
  'help.guide.entry-fields.step.2': 'Lülita jaotises Sissekande väljad välja Meeleolu, Ilm või Plussid ja miinused.',
  'help.guide.entry-fields.result':
    'Redaktor ei küsi neid enam. Midagi kirjutatut ei lähe kaotsi: välja uuesti sisselülitamisel ilmuvad salvestatud väärtused taas nähtavale ja jagatud reisilugu peidab samad väljad.',
  'help.guide.entry-fields.tip.1':
    'Lülitid kehtivad iga reisiloo kohta eraldi, nii et tööreis ja puhkus võivad erineda.',
  // link-trip
  'help.guide.link-trip.title': 'Seo veel üks reis',
  'help.guide.link-trip.goal': 'Too teise reisi kohad reisilukku soovitustena.',
  'help.guide.link-trip.step.1': 'Ava päisest Reisiloo seaded.',
  'help.guide.link-trip.step.2': 'Klõpsa seotud reiside all Lisa reis.',
  'help.guide.link-trip.step.3': 'Vali reis.',
  'help.guide.link-trip.result':
    'Selle kohad ilmuvad ajajoonele soovitustena oma päevadel ja selle GPX-rajad lisanduvad kaardile.',
  'help.guide.link-trip.tip.1':
    'Seotud reisi kõrval olev × eemaldab seose uuesti; sinu kirjutatud sissekanded jäävad alles.',
  'help.guide.link-trip.tip.2':
    'Päevaga sissekandeid arvestatakse ainult üks kord, ükskõik mitu reisi seda päeva hõlmavad.',
  // share-public
  'help.guide.share-public.title': 'Jaga reisilugu avalikult',
  'help.guide.share-public.goal': 'Anna TREKi kontota inimestele ainult lugemiseks mõeldud link.',
  'help.guide.share-public.step.1': 'Ava Reisiloo seaded ja leia Avalik jagamine.',
  'help.guide.share-public.step.2': 'Klõpsa Loo jagamislink.',
  'help.guide.share-public.step.3':
    'Vali, mida külastajad näevad: Ajajoon, Galerii ja Kaart on eraldi lülitid. Kopeeri paneb lingi lõikelauale.',
  'help.guide.share-public.result':
    'Igaüks, kellel on link, näeb lubatud jaotisi ja mitte midagi muud; väljad, mille lülitasid välja jaotises Sissekande väljad, jäävad ka seal peidetuks.',
  'help.guide.share-public.tip.1':
    'Fotod ilmuvad avalikule kaardile ainult siis, kui nii Galerii kui ka Kaart on sees; kui Kaart on väljas, eemaldatakse nende koordinaadid enne serverist lahkumist.',
  'help.guide.share-public.tip.2': 'Jagamise lõpetamiseks kustuta link samas kohas.',
  // contributors
  'help.guide.contributors.title': 'Kirjutage koos',
  'help.guide.contributors.goal': 'Luba kaasreisijal lisada oma sissekandeid ja fotosid.',
  'help.guide.contributors.step.1': 'Ava Reisiloo seaded ja keri kaasautorite juurde.',
  'help.guide.contributors.step.2': 'Klõpsa Kutsu kaasautor ja otsi kasutajat nime või e-posti järgi.',
  'help.guide.contributors.step.3': 'Vali roll ja kinnita.',
  'help.guide.contributors.result':
    'Reisilugu ilmub tema loendisse ja tema sissekannetel on tema nimi. Kaasautori eemaldamiseks klõpsa tema kõrval olevat ×.',
  'help.guide.contributors.tip.1': 'Kaasautorid on selle TREKi kasutajatele. Kõigile teistele on avalik link.',
  // studio
  'help.guide.studio.title': 'Kujunda reisilugu fotoraamatuks',
  'help.guide.studio.goal': 'Muuda reisilugu prinditavateks lehtedeks.',
  'help.guide.studio.step.1': 'Klõpsa päises Stuudio. Kujundaja avaneb reisiloo peal.',
  'help.guide.studio.step.2':
    'Ülemise riba vasakus servas olev reisiloo nimi viib tagasi; see viib sind sinna, kus olid.',
  'help.guide.studio.result':
    'Vasakul lehtede riba, tööpinnal lehepaar, paremal omadused. Automaatne paigutus koostab raamatu sinu sissekannetest; Eksport loob printimiseks valmis PDF-i.',
  'help.guide.studio.tip.1': 'Stuudio vajab vähemalt 1024 px laiust akent ja telefonis seda ei pakuta.',
  'help.guide.studio.tip.2':
    'Raamat pärib reisiloo juurdepääsuõigused: kes tohib reisilugu lugeda, saab raamatu avada, kes tohib muuta, saab salvestada.',
  // archive-journey
  'help.guide.archive-journey.title': 'Arhiveeri või kustuta reisilugu',
  'help.guide.archive-journey.goal': 'Sulge lõppenud reisilugu või eemalda see jäädavalt.',
  'help.guide.archive-journey.step.1': 'Ava Reisiloo seaded.',
  'help.guide.archive-journey.step.2':
    'Allosas lõpetab Arhiveeri reisilugu selle ja märgib arhiveerituks; Taasta reisilugu toob selle tagasi. Kustuta eemaldab selle pärast kinnitust koos kõigi sissekannete ja fotodega.',
  'help.guide.archive-journey.result':
    'Arhiveeritud reisilugu jääb loetavaks ja jagatavaks; see lihtsalt ei avane enam tänasel päeval.',
  'help.guide.archive-journey.tip.1':
    'Kustutamist ei saa tagasi võtta ja see ei puuduta reise, millega reisilugu oli seotud.',
  'help.guide.archive-journey.tip.2': 'Kaanepilt, nimi ja alapealkiri asuvad samas dialoogis, ülaosas.',

  // ── Screen: journey-studio ─────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Stuudio',
  'help.ctx.journey-studio.summary':
    'TREK Studio kujundab reisiloo prinditavaks fotoraamatuks. See avaneb reisiloo peal: vasakul lehtede riba ja sisu, keskel lehepaar, millega töötad, paremal selle omadused. Automaatne paigutus koostab sinu sissekannetest esimese mustandi; kõike pärast seda saad ise liigutada, kärpida ja ümber kujundada ning iga sammu saab tagasi võtta.',
  'help.ctx.journey-studio.bullet.1':
    'Ülemine riba: Tagasi reisiloo juurde, Raamatuvaade, tagasivõtmine ja uuesti tegemine, Lehevorming, Automaatne paigutus ja Eksport. Pealkirja kõrval olev märge Salvestatud annab teada, millal raamat on salvestatud.',
  'help.ctx.journey-studio.bullet.2':
    'Vasakul riba viie jaotisega: Lehed, Sisu (reisiloo fotod ja sissekanded), Elemendid (tekst, kujundid, jooned, ruudustikud, raamid, ikoonid), Reisimine (reisiloo põhjal loodud kaardid, riigid, lipud ja märgised) ja Paigutused.',
  'help.ctx.journey-studio.bullet.3':
    'Tööpind: praegune lehepaar koos lõikevaru ja ohutute veeristega, selle all suumiriba, Mahuta vaatesse ja paremal Laadi see lehepaar alla.',
  'help.ctx.journey-studio.bullet.4':
    'Paremal Omadused: valitud elemendi asukoht ja suurus, kärpimine ja fookuspunkt, täitmine või mahutamine, välimus, nurgad, raam, kihtide järjekord ja lukustus; kui midagi pole valitud, siis leheküljenumbrid ja dokument.',
  'help.ctx.journey-studio.bullet.5':
    'Raamatul on köidetud raamatu kuju: kaas, üksik esimene lehekülg, lehepaarid, üksik viimane lehekülg ja tagakaas. Leheküljenumbreid loetakse esimesest leheküljest ja need prinditakse nii, nagu näidatud.',
  'help.ctx.journey-studio.bullet.6':
    'Kujundada saab mitu inimest korraga: kõik näevad teiste kursoreid koos nimedega ja salvestus versioonile, mida keegi teine on muutnud, tuleb tagasi konfliktina, selle asemel et tema töö üle kirjutada.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Koosta raamat automaatselt',
  'help.guide.studio-auto-layout.goal':
    'Saa reisiloo sissekannetest ja fotodest ühe klõpsuga terviklik esimene mustand.',
  'help.guide.studio-auto-layout.step.1': 'Klõpsa ülemisel ribal Automaatne paigutus.',
  'help.guide.studio-auto-layout.step.2':
    'Vali Kogu raamat: see asendab kõik lehed, säilitades sinu pealkirja ja lehe seadistuse. See lehepaar koostab uuesti ainult ekraanil oleva lehepaari ja seda pakutakse lehepaaril, mis on loodud sissekandest.',
  'help.guide.studio-auto-layout.step.3':
    'Vaata lehtede riba läbi. Kui eelistasid varasemat, võtab Võta tagasi kogu paigutuse tagasi.',
  'help.guide.studio-auto-layout.result':
    'Üks lehepaar sissekande kohta, õiges järjekorras, ning selle fotod, pealkiri ja lugu on sinu eest paika pandud. Iga element järgib oma sissekannet seni, kuni seda muudad.',
  'help.guide.studio-auto-layout.tip.1': 'Mõlemad valikud on tavalised tagasivõetavad sammud, nii et proovi julgelt.',
  'help.guide.studio-auto-layout.tip.2':
    'Element, mille automaatne paigutus sissekandega sidus, järgib selle sissekande muudatusi seni, kuni muudad seda jaotises Omadused; see katkestab seose.',
  // studio-pages
  'help.guide.studio-pages.title': 'Lisa, liiguta ja eemalda lehepaare',
  'help.guide.studio-pages.goal': 'Kujunda raamatut lehekülg lehekülje haaval.',
  'help.guide.studio-pages.step.1':
    'Ava ribal Lehed. Pisipildid näitavad raamatut järjekorras: kaas, esimene lehekülg, lehepaarid, viimane lehekülg, tagakaas.',
  'help.guide.studio-pages.step.2':
    'All olev Lisa lehepaar lisab uue lehepaari enne viimast lehekülge; kahe pisipildi vahel olev + lisab selle täpselt sinna.',
  'help.guide.studio-pages.step.3':
    'Toimingute nägemiseks hõljuta kursorit pisipildi kohal: Liiguta ettepoole, Liiguta tahapoole, Kopeeri lehepaar ja Kustuta lehepaar. Klõpsa pisipildil, et avada see lehepaar tööpinnal.',
  'help.guide.studio-pages.result':
    'Kaas, esimene ja viimane lehekülg ning tagakaas jäävad oma kohale; uued lehepaarid lähevad alati nende vahele.',
  'help.guide.studio-pages.tip.1': 'Ülemise riba Raamatuvaade näitab kogu raamatut lehtedena, nii nagu see köidetakse.',
  'help.guide.studio-pages.tip.2':
    'Leheküljenumbrid lülitatakse sisse jaotise Omadused alajaotises Dokument, kui midagi pole valitud.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Rakenda lehepaarile paigutus',
  'help.guide.studio-layouts.goal': 'Anna lehepaarile valmis paigutus foto- ja tekstiraamidega.',
  'help.guide.studio-layouts.step.1':
    'Ava ribal Paigutused. Seal on kolmteist lehepaari paigutust ning eraldi komplekt kaane, tagakaane ja üksiklehtede jaoks.',
  'help.guide.studio-layouts.step.2':
    'Klõpsa ühel neist. Tööpinnal olev lehepaar võtab üle selle raamid; juba olemasolevad fotod ja tekst paigutatakse neisse.',
  'help.guide.studio-layouts.result':
    'Tühjad raamid ootavad sisu: lohista foto jaotisest Sisu raamile või kasuta nuppu Lisa sellele lehele.',
  'help.guide.studio-layouts.tip.1': 'Paigutuse rakendamine on tagasivõetav samm nagu iga teinegi.',
  // studio-content
  'help.guide.studio-content.title': 'Pane fotod ja sissekanded lehele',
  'help.guide.studio-content.goal': 'Too reisiloo enda materjal lehepaarile.',
  'help.guide.studio-content.step.1':
    'Ava ribal Sisu. Fotod loetleb kõik reisiloo pildid; Sissekanded loetleb sissekanded koos nende tekstiga.',
  'help.guide.studio-content.step.2':
    'Lohista foto lehepaarile või tühjale raamile või klõpsa selle all Lisa sellele lehele. Laadi fotod üles lisab pilte, mida reisiloos veel pole.',
  'help.guide.studio-content.step.3':
    'Sissekande all panevad Pealkiri, Lugu ja Koht selle teksti lehele tekstielemendina; Kuupäev ja koordinaadid lisanduvad märgistena ning sissekande fotod on loetletud seal samas.',
  'help.guide.studio-content.result':
    'Lohistatud fotost saab fotoelement; tekst järgib sissekannet seni, kuni seda muudad.',
  'help.guide.studio-content.tip.1': 'Jaotise Sisu ülaosas olev otsinguväli filtreerib mõlemat loendit.',
  'help.guide.studio-content.tip.2':
    'Kui lohistad faili arvutist tööpinnale, laaditakse see üles ja paigutatakse ühe liigutusega.',
  // studio-elements
  'help.guide.studio-elements.title': 'Lisa teksti, kujundeid ja ikoone',
  'help.guide.studio-elements.goal': 'Kaunista lehepaari lisaks fotodele ja lugudele.',
  'help.guide.studio-elements.step.1': 'Ava ribal Elemendid.',
  'help.guide.studio-elements.step.2':
    'Klõpsa tekstistiilil pealkirja või allkirja jaoks, kujundil, joonel, ruudustikul, raamistiiliga tühjal raamil või ikoonil otsitavast kogust. Iga element ilmub lehepaari keskele, valmis liigutamiseks.',
  'help.guide.studio-elements.result':
    'Tekstielemendis kirjutamiseks topeltklõpsa sellel; jaotises Omadused on font, paksus, suurus, vahed ja joondus.',
  'help.guide.studio-elements.tip.1': 'Raamid on tühjad fotokohad: lohista pilt neisse hiljem.',
  // studio-travel
  'help.guide.studio-travel.title': 'Lisa kaart, lipud ja arvandmed',
  'help.guide.studio-travel.goal': 'Too reisiloo enda andmed lehele kujutiste ja arvudena.',
  'help.guide.studio-travel.step.1': 'Ava ribal Reisimine.',
  'help.guide.studio-travel.step.2':
    'Vali, mida lisada: sissekannete marsruudikaart, riikide kontuurid, riikide loend või ruudustik, lipud, kuupäeva-, päeva- või vahemaamärgis või kogu reisi kokkuvõte. Igaüks luuakse reisiloo andmetest ja värskendub koos nendega.',
  'help.guide.studio-travel.result':
    'Element ilmub lehepaarile; Omadused kohandab selle stiili ja kaardi puhul ka kuvatavat ala.',
  'help.guide.studio-travel.tip.1':
    'Märgised järgivad sissekannet, millest lehepaar loodi, nii et automaatselt paigutatud lehepaari kuupäevamärgis näitab juba seda päeva.',
  // studio-properties
  'help.guide.studio-properties.title': 'Muuda valitud elementi',
  'help.guide.studio-properties.goal': 'Liiguta, kärbi, kujunda ja järjesta elementi omaduste paneeliga.',
  'help.guide.studio-properties.step.1':
    'Klõpsa lehepaaril elemendil. Ilmuvad suuruse muutmise ja pööramise pidemed; liigutamiseks lohista seda.',
  'help.guide.studio-properties.step.2':
    'Paremal olev Omadused järgib valikut: asukoht ja suurus, Kärbi koos fookuspunktiga, mis määrab, mis kaadrisse jääb, Täida või Mahuta, Välimus-filtrid, Nurga raadius, raami stiil, kihtide järjekord ja Lukusta.',
  'help.guide.studio-properties.step.3':
    'Tee koopia ja Kustuta asuvad paneeli ülaosas; ülemise riba Võta tagasi tühistab ükskõik mille neist.',
  'help.guide.studio-properties.result':
    'Lukustatud elementi ei saa lehel enam haarata, mis hoiab valmis paigutuse turvaliselt paigal, kui töötad selle ümber.',
  'help.guide.studio-properties.tip.1': 'Shift-klõps valib mitu elementi; siis muudab paneel neid korraga.',
  'help.guide.studio-properties.tip.2':
    'Automaatse paigutuse lisatud elemendi muutmine katkestab selle seose sissekandega; see ei järgi enam selle sissekande hilisemaid muudatusi.',
  // studio-format
  'help.guide.studio-format.title': 'Vali lehevorming',
  'help.guide.studio-format.goal': 'Määra raamatu prindisuurus enne, kui paigutus sellest sõltuma hakkab.',
  'help.guide.studio-format.step.1': 'Klõpsa ülemisel ribal Lehevorming.',
  'help.guide.studio-format.step.2':
    'Vali Ruut 21 × 21 cm, Ruut 30 × 30 cm, A4 või A5 rõht- või püstpaigutuses või sisesta kohandatud laius ja kõrgus millimeetrites. Lõikevaru ja ohutu veeris asuvad all.',
  'help.guide.studio-format.result':
    'Iga lehepaar joonistatakse selles suuruses, vaikimisi 3 mm lõikevaru ja 5 mm ohutu veerisega.',
  'help.guide.studio-format.tip.1':
    'Muuda esmalt vormingut ja käivita seejärel Automaatne paigutus; paigutus koostatakse sel hetkel kehtiva suuruse järgi.',
  'help.guide.studio-format.tip.2': 'Küsi trükikojalt nende lõikevaru ja ohutu veerise väärtusi ning sisesta need.',
  // studio-export
  'help.guide.studio-export.title': 'Ekspordi raamat PDF-ina',
  'help.guide.studio-export.goal': 'Saa printimiseks valmis fail või fail ekraanil lugemiseks.',
  'help.guide.studio-export.step.1': 'Klõpsa ülemisel ribal Eksport.',
  'help.guide.studio-export.step.2':
    'Vali Üksiklehed, üks lehekülg lehe kohta lugemisjärjekorras, mida trükikoda vajab, või Lehepaarid, kaks lehekülge korraga, nii nagu raamat avaneb. Lõikemärgid lisavad igale servale lõikevaru ja märgivad lõikekohad.',
  'help.guide.studio-export.step.3': 'Klõpsa Prindivaade. Brauser avab lehed ja Salvesta PDF-ina teeb neist faili.',
  'help.guide.studio-export.result': 'PDF, milles on nii palju lehti, kui dialoog teatas, sinu määratud lehevormingus.',
  'help.guide.studio-export.tip.1': 'PDF-i saab luua ainult arvutis, nagu ka Stuudiot ise kasutada.',
  'help.guide.studio-export.tip.2':
    'Proovitõmmise jaoks ekspordi Lehepaarid ilma lõikemärkideta, trükikoja jaoks Üksiklehed koos nendega.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Kasuta lehepaari teises raamatus uuesti',
  'help.guide.studio-spread-file.goal': 'Vii meeldiv kujundus ühe reisiloo raamatust teise.',
  'help.guide.studio-spread-file.step.1':
    'Kui lehepaar on tööpinnal, klõpsa suumiriba paremas otsas Laadi see lehepaar alla. Fail sisaldab kujundust, mitte fotosid.',
  'help.guide.studio-spread-file.step.2':
    'Ava teises raamatus Lehed, klõpsa nupu Lisa lehepaar kõrval Impordi ja vali fail.',
  'help.guide.studio-spread-file.result':
    'Lehepaar saabub koos raamide ja tekstistiilidega; lohista uue reisiloo fotod raamidesse.',
  'help.guide.studio-spread-file.tip.1': 'Fail, mis pole lehepaari kujundus, lükatakse põhjendusega tagasi.',

  // ── Screen: settings (all tabs) ────────────────────────────────────────────
  'help.ctx.settings.title': 'Seaded',
  'help.ctx.settings.summary':
    'Sinu isiklikud seaded, iga teema oma vahekaardil vasakul külgribal. Enamik lüliteid rakendub kohe, kui neid muudad; vorm, mille all on nupp Salvesta, ootab selle vajutamist. Siin tehtud muudatused ei mõjuta kellegi teise TREKi.',
  'help.ctx.settings.bullet.1':
    'Vasakul külgribal: Üldine, Välimus, Kaart, Teavitused, Liidestused, Võrguühenduseta ja Konto. Pluginad ilmub, kui mõni plugin on paigaldatud, Teave kõikjal, kus haldaja pole seda eemaldanud.',
  'help.ctx.settings.bullet.2':
    'Üldine hõlmab keelt, ühikuid, valuutat ja seda, millega rakendus avaneb; Välimus teemat, värve, teksti suurust ja avalehe vidinaid.',
  'help.ctx.settings.bullet.3':
    'Kaart valib kuvamismootori ja selle stiili; Teavitused kanalid, mille kaudu sinuni jõutakse; Liidestused fototeegid, API-võtmed ja MCP; Võrguühenduseta selle, mida rakendus selles seadmes hoiab.',
  'help.ctx.settings.bullet.4':
    'Konto sisaldab sinu profiili, parooli, kaheastmelist autentimist, pääsuvõtmeid ja konto kustutamist.',
  'help.ctx.settings-display.title': 'Üldine',
  'help.ctx.settings-display.summary':
    'Keel, ühikud ja valuuta, kaardi ja broneeringute käitumine ning see, millega TREK avaneb. Iga muudatus rakendub kohe.',
  'help.ctx.settings-display.bullet.1':
    'Keel ja piirkond: liidese keel, ajavorming, nädala esimene päev, kuvamisvaluuta ning vahemaa- ja temperatuuriühikud.',
  'help.ctx.settings-display.bullet.2':
    'Reisimine ja kaart: broneeringute marsruudid alati kaardil, kohtade avastamise nupp, marsruudi optimeerimine majutuskohast, hägustatud broneerimiskoodid ja siltidega broneeringute marsruudid.',
  'help.ctx.settings-display.bullet.3':
    'Käivitamine: kas TREK avaneb ülevaatel või aktiivsel reisil ja milline reisi vahekaart avaneb esimesena.',
  'help.ctx.settings-appearance.title': 'Välimus',
  'help.ctx.settings-appearance.summary':
    'Kuidas TREK selle konto puhul välja näeb: hele või tume, aktsentvärv, klaasefekt ja liikumine, teksti suurus ning milliseid vidinaid avaleht näitab. Kõik rakendub kohe igas seadmes, kuhu sisse logid.',
  'help.ctx.settings-appearance.bullet.1':
    'Teema: Hele, Tume või Automaatne ning Värviskeem koos sinu enda Kohandatud aktsentvärviga.',
  'help.ctx.settings-appearance.bullet.2':
    'Loetavus: Läbipaistvus, Vähenda liikumist, Tihedus ja Teksti suurus koos täpsemate suurustega iga taseme jaoks.',
  'help.ctx.settings-appearance.bullet.3':
    'Avalehe vidinad: iga vidina jaoks oma lüliti, eraldi Töölaua ja Mobiili jaoks.',
  'help.ctx.settings-appearance.bullet.4': 'All olev Taasta vaikeseaded taastab kõik algsed väärtused.',
  'help.ctx.settings-map.title': 'Kaart',
  'help.ctx.settings-map.summary':
    'Milline mootor kaarte joonistab ja millises stiilis. Leaflet on klassikaline rasterkaart, MapLibre joonistab vektorpaane ilma pääsutõendita, Mapbox lisab sinu enda pääsutõendiga 3D-hooned ja maastiku.',
  'help.ctx.settings-map.bullet.1':
    'Kaarditeenus: Leaflet, MapLibre või Mapbox, igaühe juures rida selle kohta, mida see vajab.',
  'help.ctx.settings-map.bullet.2':
    'Kaardi stiil ja Kaardimall: paanide välimus ning pääsutõend või võti, mida teenusepakkuja nõuab.',
  'help.ctx.settings-map.bullet.3':
    'Kõrge kvaliteediga režiim servade silumiseks ja gloobuse projektsiooniks; Salvesta kaart salvestab valiku.',
  'help.ctx.settings-notifications.title': 'Teavitused',
  'help.ctx.settings-notifications.summary':
    'Kus TREK sinuni väljaspool rakendust jõuab: tõuketeavitused selles seadmes, ntfy teema, veebihaak või plugina pakutav kanal. Kanalite all otsustab iga sündmuse rida, mis kuhu läheb.',
  'help.ctx.settings-notifications.bullet.1':
    'ntfy: teema, valikuline oma server ja valikuline pääsutõend, koos nupuga Testi, mis saadab kohe ühe sõnumi.',
  'help.ctx.settings-notifications.bullet.2': 'Veebihaak: üks URL, mis saab iga sündmuse JSON-ina, koos nupuga Testi.',
  'help.ctx.settings-notifications.bullet.3':
    'Tõuketeavitused selles seadmes: Lülita selles seadmes sisse kehtib ainult brauserile, mida praegu kasutad, seega korda seda igas telefonis või arvutis. Saada test jõuab kõigini.',
  'help.ctx.settings-notifications.bullet.4':
    'Eelistuste read: iga sündmuse puhul, milline kanal on sees. Plugina kanalitel on nupp Seadista, kuni need on seadistatud.',
  'help.ctx.settings-integrations.title': 'Liidestused',
  'help.ctx.settings-integrations.summary':
    'Kõik, mis ühendub TREKiga väljastpoolt: fototeegid reisiloo jaoks, API-võtmed skriptide jaoks ning MCP otspunkt koos pääsutõendite ja OAuth-klientidega AI-assistentide jaoks.',
  'help.ctx.settings-integrations.bullet.1':
    'Fototeenused: Immich ja Synology Photos, kumbki oma URL-i ja võtmega, koos nuppudega Testi ühendust ja Salvesta.',
  'help.ctx.settings-integrations.bullet.2':
    'API-võtmed: isiklikud võtmed skriptidele ja muudele tööriistadele, mis kutsuvad TREKi API-t sinu nimel.',
  'help.ctx.settings-integrations.bullet.3':
    'MCP seadistus: otspunkt, kopeerimiseks valmis kliendi seadistus ja API-pääsutõendid.',
  'help.ctx.settings-integrations.bullet.4':
    'OAuth 2.1 kliendid: rakendused, mis logivad sisse TREKi kaudu, koos ümbersuunamise URI-de, lubatud õiguste ulatuste, masinklientide ja aktiivsete seanssidega.',
  'help.ctx.settings-offline.title': 'Võrguühenduseta',
  'help.ctx.settings-offline.summary':
    'Mida TREK selles seadmes hoiab, et reis avaneks ka ilma ühenduseta, ja mis juhtub, kui võrguühenduseta tehtud muudatus põrkub mujal tehtud muudatusega.',
  'help.ctx.settings-offline.bullet.1':
    'Võrguühenduseta režiim: Sunni võrguühenduseta režiim paneb rakenduse käituma nii, nagu võrku poleks, testimiseks või mahupiiranguga ühenduse korral.',
  'help.ctx.settings-offline.bullet.2':
    'Valmistu võrguühenduseta kasutamiseks: Laadi alla võrguühenduseta kasutamiseks laadib sinu reisid ja nende kaardipaanid kohe alla.',
  'help.ctx.settings-offline.bullet.3':
    'Mida võrguühenduseta säilitada: kaardipaanid sees või väljas ning lüliti iga reisi jaoks.',
  'help.ctx.settings-offline.bullet.4':
    'Sünkroonimiskonfliktid ja Võrguühenduseta vahemälu: konfliktide lahendamise viis, ootel ja ebaõnnestunud muudatuste arv, Sünkrooni kohe uuesti ja Tühjenda vahemälu.',
  'help.ctx.settings-account.title': 'Konto',
  'help.ctx.settings-account.summary':
    'Kes sa selles TREKis oled ja kuidas sisse logid: profiil ja profiilipilt, parool, kaheastmeline autentimine, pääsuvõtmed ning päris all konto kustutamine.',
  'help.ctx.settings-account.bullet.1':
    'Profiil: kasutajanimi, e-post ja profiilipilt, mis salvestatakse nupuga Salvesta profiil.',
  'help.ctx.settings-account.bullet.2': 'Muuda parooli: praegune parool, kaks korda uus parool, Uuenda parooli.',
  'help.ctx.settings-account.bullet.3':
    'Kaheastmeline autentimine (2FA) autentimisrakenduse ja varukoodidega; Pääsuvõtmed sisselogimiseks ilma paroolita.',
  'help.ctx.settings-account.bullet.4':
    'Kustuta konto asub allosas ja nõuab kinnitust. Viimane administraator ei saa ennast kustutada.',
  // language-region
  'help.guide.language-region.title': 'Määra keel, ühikud ja valuuta',
  'help.guide.language-region.goal': 'Pane TREK rääkima sinu keelt ja arvestama nii, nagu sina harjunud oled.',
  'help.guide.language-region.step.1':
    'Vali liidese keel jaotises Keel ja piirkond. TREK vahetab keele kohe igas seadmes, kuhu sisse logid.',
  'help.guide.language-region.step.2':
    'Selle all vali ajavorming, nädala alguspäev kõigis kuupäevavalijates, kuvamisvaluuta ning vahemaa- ja temperatuuriühikud.',
  'help.guide.language-region.result':
    'Kuupäevad, vahemaad ja rahasummad kuvatakse nii, nagu ootad; reisi enda valuuta on endiselt näha teisendatud summade kõrval.',
  'help.guide.language-region.tip.1':
    'Kuvamisvaluuta on mitme reisi kogusummade jaoks; iga reis säilitab valuuta, mille sa sellele andsid.',
  'help.guide.language-region.tip.2': 'Keel määrab ka päevade ja kuude nimed moodulis Vacay ja reisiloos.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Kohanda kaardi ja broneeringute käitumist',
  'help.guide.travel-map-prefs.goal': 'Otsusta, mida reisi kaart vaikimisi näitab.',
  'help.guide.travel-map-prefs.step.1':
    'Jaotises Reisimine ja kaart hoiab Näita alati broneeringute marsruute lennud ja rongid kaardil ka siis, kui nende päev pole avatud; Avasta kaardil kohti näitab kohtade leidmise nuppu; Optimeeri marsruut majutuskohast alustab marsruuti sealt, kus sa ööbid.',
  'help.guide.travel-map-prefs.step.2':
    'Hägusta broneerimiskoodid peidab kinnitusnumbrid, kuni hõljutad kursorit nende kohal; Broneeringute marsruutide sildid kirjutab broneeringu nime selle marsruudi äärde.',
  'help.guide.travel-map-prefs.result': 'Reisi kaart järgib neid seadeid igal reisil, kuni sa need tagasi muudad.',
  'help.guide.travel-map-prefs.tip.1':
    'Need kehtivad konto, mitte reisi kohta. Jagatud reisi liikmed näevad igaüks oma valikuid.',
  // startup
  'help.guide.startup.title': 'Vali, millega TREK avaneb',
  'help.guide.startup.goal': 'Jõua sinna, kus kõige rohkem töötad, mitte iga kord ülevaatele.',
  'help.guide.startup.step.1': 'Määra jaotises Käivitamine Avaleht väärtusele Ülevaade või Aktiivne reis.',
  'help.guide.startup.step.2': 'Avatav vahekaart määrab, milline reisi vahekaart reisi avamisel esimesena avaneb.',
  'help.guide.startup.result': 'Järgmine sisselogimine ja järgmine logole koputus viivad otse sinna.',
  'help.guide.startup.tip.1': 'Aktiivne reis tähendab täna käimasolevat reisi või, kui sellist pole, järgmist reisi.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Määra teema ja aktsentvärv',
  'help.guide.theme-scheme.goal': 'Tee TREK heledaks või tumedaks või lase sel järgida seadet, sulle meeldivas värvis.',
  'help.guide.theme-scheme.step.1': 'Vali jaotises Teema Hele, Tume või Automaatne. Automaatne järgib sinu seadet.',
  'help.guide.theme-scheme.step.2':
    'Vali Värviskeem: Vaikimisi, Suur kontrast, Indigosinine, Sinakasroheline, Roosa, Merevaigukollane, Violetne või Kohandatud.',
  'help.guide.theme-scheme.step.3':
    'Valiku Kohandatud puhul vali aktsentvärv eelseadistuste hulgast või sisesta oma. Selle kõrval olev kontrastikontroll ütleb, kas tekst jääb sellel loetavaks.',
  'help.guide.theme-scheme.result':
    'Nupud, lingid ja esiletõstud saavad aktsentvärvi kõikjal, igas seadmes, kuhu sisse logid.',
  'help.guide.theme-scheme.tip.1': 'Navigeerimisribal on ka kiire hele/tume lüliti; see määrab sama teema.',
  'help.guide.theme-scheme.tip.2': 'Suur kontrast on skeem, mille valida, kui vaikimisi skeem tundub liiga kahvatu.',
  // readability
  'help.guide.readability.title': 'Kohanda loetavust ja teksti suurust',
  'help.guide.readability.goal': 'Vähem klaasi, vähem liikumist, rohkem ruumi või suurem kiri.',
  'help.guide.readability.step.1':
    'Jaotises Loetavus muudab Läbipaistvus klaaspaneelid ühtlasteks pindadeks, Vähenda liikumist vähendab animatsioone ja Tihedus võimaldab valida Avar või Kompaktne.',
  'help.guide.readability.step.2':
    'Teksti suurus muudab valikuga Kõik kogu teksti korraga; Täpsemad tekstisuurused lubab pealkirjadel, alapealkirjadel, põhitekstil ja allkirjadel erineda.',
  'help.guide.readability.result': 'Kogu rakendus muutub kohe, sealhulgas kaardipaneelid ja reisilugu.',
  'help.guide.readability.tip.1': 'Kui sa Vähenda liikumist ei muuda, järgib see sinu süsteemi seadet.',
  'help.guide.readability.tip.2':
    'Teksti suurust rakendatakse kirjatüübi tasemete kaudu, nii et midagi ei lõigata ära; tekst, mis enam ei mahu, murdub uuele reale.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Vali avalehe vidinad',
  'help.guide.dashboard-widgets.goal': 'Näita ainult neid vidinaid, mida kasutad, eraldi arvutis ja telefonis.',
  'help.guide.dashboard-widgets.step.1':
    'Lülita jaotises Avalehe vidinad iga vidin Töölaua ja Mobiili jaoks sisse või välja: parem külgriba tervikuna, valuuta, kogumikud, ajavööndid, eelseisvad broneeringud, Atlase riigid ja reisiarvud.',
  'help.guide.dashboard-widgets.step.2': 'All olev Taasta vaikeseaded taastab kogu vahekaardi algse oleku.',
  'help.guide.dashboard-widgets.result':
    'Avaleht korraldub kohe ümber; kui parem külgriba on väljas, paigutub sisu keskele.',
  'help.guide.dashboard-widgets.tip.1':
    'Lisamooduli vidinad ilmuvad ainult siis, kui administraator on selle lisamooduli sisse lülitanud.',
  'help.guide.dashboard-widgets.tip.2':
    'Avaleht ise jätab iga seadme puhul meelde sinu ruudustiku- või loendivaate ja sortimisjärjekorra.',
  // map-provider
  'help.guide.map-provider.title': 'Vali kaardimootor ja stiil',
  'help.guide.map-provider.goal': 'Vaheta klassikalise kaardi, vektorpaanide ja Mapboxi 3D-kaardi vahel.',
  'help.guide.map-provider.step.1':
    'Vali jaotises Kaarditeenus Leaflet klassikalise 2D-kaardi jaoks mis tahes rasterpaanidega, MapLibre OpenFreeMapi vektorpaanide jaoks ilma pääsutõendita või Mapbox vektorpaanide jaoks koos 3D-hoonete ja maastikuga.',
  'help.guide.map-provider.step.2':
    'Välimuse jaoks vali Kaardi stiil või Kaardimall. Mapbox vajab Mapboxi pääsuvõtit, mõned rasterstiilid CARTO API-võtit; välja kõrval olev link viib sinna, kust selle saad.',
  'help.guide.map-provider.step.3':
    'Kõrge kvaliteediga režiim lisab servade silumise ja gloobuse projektsiooni. Klõpsa Salvesta kaart.',
  'help.guide.map-provider.result':
    'Kõik TREKi kaardid (reisid, Atlas, Kogumikud ja reisilugu) joonistab sinu valitud mootor.',
  'help.guide.map-provider.tip.1': 'Ilma pääsutõendita näitab Mapbox tühja kaardi asemel vaikekaarti.',
  'help.guide.map-provider.tip.2':
    'Võrguühenduseta säilitatavad kaardipaanid tulevad teenusepakkujalt, mis on allalaadimise ajal aktiivne.',
  // notification-channels
  'help.guide.notification-channels.title': 'Määra, kuhu teavitused sinuni jõuavad',
  'help.guide.notification-channels.goal':
    'Saa reisi meeldetuletusi ja koostöösündmusi oma telefoni või muusse tööriista.',
  'help.guide.notification-channels.step.1':
    'Täida jaotises Teavitused Ntfy teema; kui sul on oma server, lisa selle Ntfy serveri URL ja pääsutõend. Testi saadab kohe sõnumi.',
  'help.guide.notification-channels.step.2':
    'Või sisesta Veebihaagi URL, mis saab iga sündmuse JSON-ina, ja testi seda samamoodi nupuga Testi.',
  'help.guide.notification-channels.step.3':
    'Lülita allolevates ridades iga sündmus iga kanali jaoks sisse või välja. Plugina kanalil on kiri Seadista, kuni see on plugina seadetes seadistatud; Saada test proovib seda.',
  'help.guide.notification-channels.result':
    'Sündmused saadetakse sisselülitatud kanalite kaudu. Navigeerimisriba kell näitab neid rakenduses igal juhul edasi.',
  'help.guide.notification-channels.tip.1':
    'Reisipõhised eelistused asuvad reisi enda juures, selle teavituste seadetes.',
  'help.guide.notification-channels.tip.2':
    'Administraator saab kõigile vaikimisi ntfy serveri ette täita; oma teema valid siiski ise.',
  // photo-providers
  'help.guide.photo-providers.title': 'Ühenda fototeek',
  'help.guide.photo-providers.goal': 'Lase reisilool tuua päeva fotod Immichist või Synology Photosest.',
  'help.guide.photo-providers.step.1':
    'Leia jaotises Liidestused teenusepakkuja jaotis ning sisesta selle URL ja API-võti. Immich pakub ka võimalust peegeldada reisiloo üleslaadimised tagasi teeki.',
  'help.guide.photo-providers.step.2': 'Klõpsa Testi ühendust, seejärel Salvesta.',
  'help.guide.photo-providers.result':
    'Sissekande redaktori vahekaart Välised fotod otsib ühendatud teegist sissekande päeva fotosid, alustades sissekande asukohale lähimatest.',
  'help.guide.photo-providers.tip.1': 'Ühendus on sinu isiklik: reisiloo teised liikmed ühendavad oma teegid.',
  'help.guide.photo-providers.tip.2':
    'Teenusepakkuja, mille fotodel pole GPS-andmeid, töötab samuti; loend on siis ajalises järjekorras.',
  // api-keys
  'help.guide.api-keys.title': 'Loo API-võti',
  'help.guide.api-keys.goal': 'Lase skriptil või muul tööriistal kutsuda TREKi API-t sinu nimel.',
  'help.guide.api-keys.step.1':
    'Klõpsa jaotises API-võtmed Loo võti ja anna sellele nimi, mis ütleb, kus seda kasutatakse.',
  'help.guide.api-keys.step.2':
    'Kopeeri võti dialoogist: seda näidatakse ainult üks kord. Kustuta võti loendist, kui tööriist seda enam ei vaja.',
  'help.guide.api-keys.result':
    'Selle võtmega päringud toimivad sinu õigustega; loend näitab, millal iga võti loodi ja viimati kasutati.',
  'help.guide.api-keys.tip.1': 'Üks võti tööriista kohta teeb tühistamise valutuks.',
  'help.guide.api-keys.tip.2':
    'AI-assistendi jaoks kasuta selle asemel MCP-d koos OAuthiga; API-võtmed on tavaliste HTTP-klientide jaoks.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Ühenda AI-assistent MCP kaudu',
  'help.guide.mcp-oauth.goal': "Anna Claude'ile, IDE-le või muule MCP-kliendile juurdepääs oma reisidele.",
  'help.guide.mcp-oauth.step.1':
    'Kopeeri jaotises MCP seadistus MCP otspunkt või kogu Kliendi seadistus, kui klient võtab vastu JSON-lõigu.',
  'help.guide.mcp-oauth.step.2':
    'Brauseri kaudu sisse logivad kliendid kasutavad OAuth 2.1: Uus klient jaotises OAuth 2.1 kliendid, koos Ümbersuunamise URI-de, Lubatud õiguste ulatuste ja brauserita serveri puhul masinkliendiga.',
  'help.guide.mcp-oauth.step.3':
    'Vaheta saladus ja Kustuta klient on iga kliendi juures; Aktiivsed OAuth-seansid loetleb sisselogitud kliendid ja laseb neid tühistada. API-pääsutõendid koos nupuga Loo uus pääse on vanem viis ühendamiseks.',
  'help.guide.mcp-oauth.result':
    'Klient saab sinu nimel lugeda ja muuta seda, mida tema õiguste ulatused lubavad, ja iga toiming kuvatakse sinu nime all.',
  'help.guide.mcp-oauth.tip.1':
    'Õiguste ulatused on turvavõrk: anna kliendile ainult lugemisõigus, kuni ta vajab rohkemat.',
  'help.guide.mcp-oauth.tip.2': 'Administraator saab MCP kogu instantsi jaoks välja lülitada; siis seda jaotist pole.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Võta reisid võrguühenduseta kasutusse',
  'help.guide.offline-prepare.goal': 'Hoia oma reise ja nende kaarte selles seadmes enne, kui ühendus katkeb.',
  'help.guide.offline-prepare.step.1':
    'Jaotises Mida võrguühenduseta säilitada hoia Säilita kaardipaanid võrguühenduseta sees ja lülita sisse reisid, mida soovid selles seadmes.',
  'help.guide.offline-prepare.step.2':
    'Klõpsa jaotises Valmistu võrguühenduseta kasutamiseks Laadi alla võrguühenduseta kasutamiseks. See laadib alla reisid ja nende kohtade ümbruse kaardipaanid.',
  'help.guide.offline-prepare.step.3':
    'Jaotise Võrguühenduseta režiim valikuga Sunni võrguühenduseta režiim saad enne lahkumist kontrollida, et kõik on olemas.',
  'help.guide.offline-prepare.result':
    'Reisid avanevad ilma ühenduseta; tehtud muudatused ootavad järjekorras ja saadetakse ühenduse taastumisel.',
  'help.guide.offline-prepare.tip.1':
    'Kaardipaanid võtavad kõige rohkem ruumi: jaotis Võrguühenduseta vahemälu näitab reisi kaupa, mis on salvestatud.',
  'help.guide.offline-prepare.tip.2':
    'Kõige sujuvamaks võrguühenduseta käivitamiseks paigalda TREK brauserist rakendusena.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Otsusta, mis sünkroonimiskonflikti korral võidab',
  'help.guide.offline-conflicts.goal':
    'Vali, kuidas TREK lahendab vastuolu võrguühenduseta tehtud muudatuse ja mujal tehtud muudatuse vahel.',
  'help.guide.offline-conflicts.step.1':
    'Vali jaotises Sünkroonimiskonfliktid Küsi iga kord, Säilita alati minu versioon või Säilita alati serveri versioon.',
  'help.guide.offline-conflicts.step.2':
    'Võrguühenduseta vahemälu näitab reise, ootel ja ebaõnnestunud muudatusi ning konflikte; Sünkrooni kohe uuesti saadab järjekorra teele, Tühjenda vahemälu tühjendab seadme.',
  'help.guide.offline-conflicts.result':
    'Valikuga Küsi iga kord näidatakse konflikti korral mõlemat versiooni ja saad valida; ülejäänud kahe valikuga lahendatakse see vaikselt.',
  'help.guide.offline-conflicts.tip.1':
    'Tühjenda vahemälu eemaldab ainult selles seadmes oleva koopia; serveris ei muudeta midagi.',
  // profile
  'help.guide.profile.title': 'Muuda oma profiili',
  'help.guide.profile.goal': 'Uuenda oma nime, e-posti ja pilti.',
  'help.guide.profile.step.1':
    'Muuda jaotises Konto välju Kasutajanimi ja E-post. Profiilipildiks saad üles laadida oma pildi; initsiaalide juurde naasmiseks eemalda see.',
  'help.guide.profile.step.2': 'Klõpsa Salvesta profiil.',
  'help.guide.profile.result': 'Sinu nimi ja pilt uuenevad kõikjal korraga, sealhulgas jagatud reisidel.',
  'help.guide.profile.tip.1': 'Kui konto logib sisse OIDC kaudu, on see siin näha; e-post tuleb siis teenusepakkujalt.',
  // password
  'help.guide.password.title': 'Muuda oma parooli',
  'help.guide.password.goal': 'Määra uus parool.',
  'help.guide.password.step.1': 'Sisesta jaotises Muuda parooli praegune parool ja seejärel kaks korda uus.',
  'help.guide.password.step.2': 'Klõpsa Uuenda parooli.',
  'help.guide.password.result': 'Uus parool kehtib järgmisel sisselogimisel; teised seansid jäävad sisselogituks.',
  'help.guide.password.tip.1': 'OIDC kaudu sisse logival kontol pole TREKi parooli, mida muuta.',
  // mfa
  'help.guide.mfa.title': 'Lülita sisse kaheastmeline autentimine',
  'help.guide.mfa.goal': 'Kaitse kontot autentimisrakenduse koodiga.',
  'help.guide.mfa.step.1': 'Klõpsa jaotises Kaheastmeline autentimine (2FA) Seadista autentimisrakendus.',
  'help.guide.mfa.step.2':
    'Skanni QR-kood rakendusega või sisesta saladus käsitsi, seejärel kirjuta rakenduse näidatud kuuekohaline kood ja klõpsa Luba 2FA.',
  'help.guide.mfa.step.3':
    'Salvesta varukoodid: kopeeri, laadi alla või prindi need. Iga kood töötab ühe korra, kui sul pole telefoni käepärast.',
  'help.guide.mfa.result': 'Iga sisselogimine küsib pärast parooli koodi.',
  'help.guide.mfa.tip.1': 'Keela 2FA nõuab sinu parooli ja kehtivat koodi.',
  'help.guide.mfa.tip.2': 'Administraator saab 2FA kõigile kohustuslikuks teha; siis ei saa seda siin välja lülitada.',
  // passkeys
  'help.guide.passkeys.title': 'Logi sisse pääsuvõtmega',
  'help.guide.passkeys.goal': 'Kasuta parooli asemel oma seadme sõrmejälge, näotuvastust või PIN-koodi.',
  'help.guide.passkeys.step.1':
    'Klõpsa jaotises Pääsuvõtmed Lisa pääsuvõti ja kinnita oma seadmega. Anna sellele nimi, mis ütleb, millise seadmega on tegu.',
  'help.guide.passkeys.step.2':
    'Loend näitab iga pääsuvõtit koos nime ja viimase kasutamise ajaga; kustutamisnupp eemaldab pääsuvõtme.',
  'help.guide.passkeys.result': 'Sisselogimisleht pakub pääsuvõtit; parool jääb varuvõimaluseks.',
  'help.guide.passkeys.tip.1':
    'Pääsuvõti asub seadmes või selle paroolihalduris, seega lisa igale seadmele oma pääsuvõti.',
  'help.guide.passkeys.tip.2':
    'Pääsuvõtmed vajavad HTTPS-i; tavalise HTTP instantsi puhul selgitab jaotis, miks need pole saadaval.',
  // delete-account
  'help.guide.delete-account.title': 'Kustuta oma konto',
  'help.guide.delete-account.goal': 'Eemalda oma konto ja andmed, mis kuuluvad ainult sulle.',
  'help.guide.delete-account.step.1': 'Klõpsa jaotise Konto päris allosas Kustuta konto ja kinnita.',
  'help.guide.delete-account.result':
    'Sinu konto, sinu enda reisid ja reisilood kaovad; reisid, mida jagad teistega, jäävad neile alles.',
  'help.guide.delete-account.tip.1':
    'Instantsi viimane administraator ei saa ennast kustutada; tee kõigepealt keegi teine administraatoriks.',
  'help.guide.delete-account.tip.2':
    'Seda ei saa tagasi võtta. Ekspordi enne kinnitamist see, mida soovid alles hoida.',

  // ── Screen: admin (all tabs) ───────────────────────────────────────────────
  'help.ctx.admin.title': 'Administraator',
  'help.ctx.admin.summary':
    'Instants, millel töötab kõigi kasutajate TREK: kes ja kuidas tohib sisse logida, mis on sisse lülitatud, kus failid asuvad, kuidas server inimesteni jõuab ja kuidas seda varundatakse. Seda lehte näevad ainult administraatorid; iga vahekaart on külgribal eraldi vaade.',
  'help.ctx.admin.bullet.1':
    'Ülaosas olevad neli kaarti loendavad kasutajaid, reise, kohti ja faile; nende kohal olev bänner teatab uuemast TREKi väljalaskest.',
  'help.ctx.admin.bullet.2':
    'Kasutajad ja Kasutaja vaikevalikud: kontod, kutselingid ja kaardiseaded, millega uus konto alustab.',
  'help.ctx.admin.bullet.3':
    'Isikupärastamine, Seaded, Lisamoodulid ja Pluginad: pakkimismallid, kategooriad ja koolivaheajad; sisselogimisviisid ja API-võtmed; funktsioonimoodulid; kolmanda osapoole pluginad.',
  'help.ctx.admin.bullet.4':
    'Salvestusruum, Teavitused, MCP juurdepääs ja GitHub: kuhu üleslaadimised lähevad, kogu instantsi kanalid, AI-klientide pääsutõendid ja seansid ning versiooniajalugu.',
  'help.ctx.admin.bullet.5':
    'Varundamine ja Audit: nõudmisel ja ajakava järgi tehtavad varukoopiad ning turvalisuse seisukohalt oluliste sündmuste logi.',
  'help.ctx.admin-users.title': 'Kasutajad',
  'help.ctx.admin-users.summary':
    'Kõik selle TREKi kontod koos rolli, e-posti ja viimase sisselogimisega ning kutselingid, millega inimesed saavad suletud instantsis registreeruda.',
  'help.ctx.admin-users.bullet.1':
    'Tabel: kasutajanimi, e-post, roll, loomise kuupäev, viimane sisselogimine ja iga rea toimingud. Sinu enda rida on märgitud sildiga sina.',
  'help.ctx.admin-users.bullet.2': 'Ülaosas olev Loo kasutaja lisab konto käsitsi, parooliga, mille sa üle annad.',
  'help.ctx.admin-users.bullet.3':
    'Allpool Kutselingid: ühekordsed registreerimislingid kasutuspiirangu, aegumise ja soovi korral reisiga, millega uus kasutaja saabumisel liitub.',
  'help.ctx.admin-users.bullet.4':
    'Allosas Õiguste seaded: iga toimingu puhul, kes tohib seda teha: Kõik, Reisi liikmed, Reisi omanik või Ainult administraator.',
  'help.ctx.admin-defaults.title': 'Kasutaja vaikevalikud',
  'help.ctx.admin-defaults.summary':
    'Seaded, millega uus konto alustab, et keegi ei peaks esmalt kaardi vahekaarti otsima: kaarditeenus, stiil, pääsutõendid ja kvaliteet.',
  'help.ctx.admin-defaults.bullet.1':
    'Kaarditeenus, Mapboxi stiil ja pääsutõend, CARTO võti ja Mapboxi kvaliteet, täpselt nii, nagu kasutaja need määraks jaotises Seaded, Kaart.',
  'help.ctx.admin-defaults.bullet.2':
    'Iga välja juures olev Taasta sisseehitatud vaikeväärtus taastab TREKi enda valiku; kasutaja enda seade on alati nendest ülimuslik.',
  'help.ctx.admin-config.title': 'Isikupärastamine',
  'help.ctx.admin-config.summary':
    'Mis on instantsi kõigil reisidel ühine: pakkimismallid, kohtade ja kogumike kategooriad ning koolivaheaegade kataloog, millest Vacay andmeid võtab.',
  'help.ctx.admin-config.bullet.1':
    'Pakkimismallid: nimega loendid kategooriatest ja esemetest, millest reisi pakkimisnimekiri saab alustada.',
  'help.ctx.admin-config.bullet.2':
    'Kategooriad: kogu TREKis kasutatavate kategooriate nimi, ikoon ja värv, alates koha inspektorist kuni Kogumikeni.',
  'help.ctx.admin-config.bullet.3':
    'Koolivaheajad: riikide ja piirkondade kataloog kohtade jaoks, mida sisseehitatud vood ei kata.',
  'help.ctx.admin-settings.title': 'Seaded',
  'help.ctx.admin-settings.summary':
    'Kuidas inimesed sisse pääsevad ja millega server tohib suhelda: sisselogimis- ja registreerumisviisid, SSO, pääsuvõtmed, kaheastmelise autentimise reeglid, kaartide, kohtade ja piltide API-võtmed, otsingu- ja ühistranspordi teenusepakkujad ning lubatud failitüübid üleslaadimiste jaoks.',
  'help.ctx.admin-settings.bullet.1':
    'Autentimisviisid: Parooliga sisselogimine, Parooliga registreerumine, SSO-ga sisselogimine, SSO kontode automaatne loomine ja Nõua kaheastmelist autentimist (2FA).',
  'help.ctx.admin-settings.bullet.2':
    'Ühekordne sisselogimine (OIDC) koos väljaandja, kliendi ja kuvatava nimega; Pääsuvõtmega sisselogimine koos usaldava osapoole ID ja päritoludega.',
  'help.ctx.admin-settings.bullet.3':
    "API-võtmed: Google Maps, Unsplash ja Amap, igaüks nupuga Testi; Milleks võtit tohib kasutada piirab Google'i võtme funktsioonidega, mille eest soovid maksta.",
  'help.ctx.admin-settings.bullet.4':
    'Kohaotsingu teenusepakkuja ja Ühistranspordi teenusepakkuja valivad, kes otsingutele ja marsruutidele vastab; Lubatud failitüübid piirab üleslaadimisi.',
  'help.ctx.admin-addons.title': 'Lisamoodulid',
  'help.ctx.admin-addons.summary':
    'TREKi funktsioonimoodulid, igaüks oma lülitiga: Pakkimine, Eelarve, Dokumendid, Vacay, Atlas, Koostöö, Reisilugu, Kogumikud, Autoreis, MCP, AirTrail, Dawarich ja tehisintellektiga töötlemine. Väljas tähendab, et navigeerimiskirje, marsruudid ja API kaovad kõigi jaoks.',
  'help.ctx.admin-addons.bullet.1':
    'Iga lisamooduli jaoks paan oma lülitiga ja, kui moodulil on valikuid, nende jaoks alamread.',
  'help.ctx.admin-addons.bullet.2':
    'Fototeenused ja dokumenditeenused ilmuvad siin samuti paanidena, et Immichit või Synologyt saaks kasutajatele pakkuda.',
  'help.ctx.admin-addons.bullet.3': 'Kottide haldusel on paanide all oma lüliti.',
  'help.ctx.admin-plugins.title': 'Pluginad',
  'help.ctx.admin-plugins.summary':
    'Kolmanda osapoole pluginad, mis töötavad TREKi kõrval oma protsessis, igaüks nende õigustega, mida see paigaldamisel küsis. Paigalda kataloogist, laadi üles pakett või lingi arendamise ajaks kaust.',
  'help.ctx.admin-plugins.bullet.1':
    'Loend: iga paigaldatud plugin koos versiooni, oleku, allkirja ja tal olevate õigustega; aktiveeri, deaktiveeri, uuenda või eemalda iga rea kaupa.',
  'help.ctx.admin-plugins.bullet.2':
    'Laadi plugin üles võtab vastu paketifaili; Skanni uuesti leiab arenduseks lingitud pluginakausta.',
  'help.ctx.admin-plugins.bullet.3':
    'Lubatud hostid plugina kohta: aadressid, mida plugin tohib kutsuda, kuna väljaminev liiklus on vaikimisi keelatud.',
  'help.ctx.admin-storage.title': 'Salvestusruum',
  'help.ctx.admin-storage.summary':
    'Kus üleslaadimised asuvad: kohalik ketas, S3-ämber või peegel, mis kirjutab mõlemasse. Iga üleslaadimiste kategooria võib minna eri taustsüsteemi ja Tervis näitab, kas iga taustsüsteem vastab.',
  'help.ctx.admin-storage.bullet.1':
    'Taustsüsteemid: igaühe nimi ja tüüp koos nuppudega Testi, Muuda ja Eemalda; keskkonna kaudu määratud taustsüsteem on siin kirjutuskaitstud.',
  'help.ctx.admin-storage.bullet.2':
    'Kategooriad: kaanepildid, dokumendid, reisiloo fotod ja ülejäänud, igaüks määratud mõnele taustsüsteemile; ühe muutmisel pakutakse olemasolevate failide teisaldamist.',
  'help.ctx.admin-storage.bullet.3':
    'Tervis: kontroll iga taustsüsteemi kohta ja kontrollfail, mis tõendab, et seadistus on see, mida server näeb.',
  'help.ctx.admin-notifications.title': 'Teavitused',
  'help.ctx.admin-notifications.summary':
    'Kanalid, mida instants oma kasutajatele pakub, ja need, mis jõuavad sinuni administraatorina. Kasutajad valivad oma teemad ja URL-id jaotises Seaded; sina otsustad, mis on olemas, ja seadistad e-posti.',
  'help.ctx.admin-notifications.bullet.1':
    'Rakenduses, E-post (SMTP), Ntfy, Veebihaak ja Veebitõuketeavitused: igaühel oma paneel lülitiga, mis pakub kanalit kasutajatele, ja serveripoolse seadistusega, mida see vajab.',
  'help.ctx.admin-notifications.bullet.2': 'Reisi meeldetuletused: kas server saadab meeldetuletuse enne reisi algust.',
  'help.ctx.admin-notifications.bullet.3':
    'Administraatori ntfy ja Administraatori veebihaak: kuhu lähevad administraatori sündmused, nagu ebaõnnestunud varundus või uus väljalase, koos nupuga Testi.',
  'help.ctx.admin-mcp-tokens.title': 'MCP juurdepääs',
  'help.ctx.admin-mcp-tokens.summary':
    'Kõik pääsutõendid ja OAuth-seansid, mis AI-klientidel selle TREKi jaoks on, kõigi kasutajate lõikes, koos võimalusega ükskõik milline neist tühistada.',
  'help.ctx.admin-mcp-tokens.bullet.1': 'API-pääsutõendid: kes selle lõi, millal seda viimati kasutati, ja Kustuta.',
  'help.ctx.admin-mcp-tokens.bullet.2': 'OAuth-seansid: klient, kasutaja ja talle antud õiguste ulatused ning Tühista.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Mis on TREKis uut: GitHubi versiooniajalugu, sinu kasutatav versioon ja kas uuem on ilmunud. Uuendamine ise toimub väljaspool rakendust, hostis.',
  'help.ctx.admin-github.bullet.1':
    'Versiooniajalugu loetleb väljalasked koos nende märkmetega; uusimal on silt Uusim ja sinu versioon on märgitud.',
  'help.ctx.admin-github.bullet.2':
    'Uuendus saadaval ilmub päisesse, kui uuem väljalase on olemas, koos juhistega Dockeri ja muude paigalduste uuendamiseks.',
  'help.ctx.admin-backup.title': 'Varundamine',
  'help.ctx.admin-backup.summary':
    'Andmebaasi ja üleslaadimiste täielikud varukoopiad, mis tehakse käsitsi või ajakava järgi, hoitakse serveris ja on ühe failina allalaaditavad. Taasta paneb ühe neist tagasi.',
  'help.ctx.admin-backup.bullet.1':
    'Andmete varundamine: Loo varukoopia ja olemasolevate varukoopiate loend nuppudega Laadi alla, Taasta ja kustuta.',
  'help.ctx.admin-backup.bullet.2':
    'Laadi varukoopia üles toob faili, mis on tehtud teises instantsis või varasemal päeval.',
  'help.ctx.admin-backup.bullet.3':
    'Automaatne varundamine: sees või väljas, intervall, kellaaeg ja päev ning mitu koopiat alles hoida.',
  'help.ctx.admin-audit.title': 'Audit',
  'help.ctx.admin-audit.summary':
    'Turvalisuse seisukohalt oluliste ja haldussündmuste logi: sisselogimised ja nurjumised, MFA muudatused, kasutajate ja seadete muudatused, varundused ja taastamised. Ainult lugemiseks, uusimad eespool.',
  'help.ctx.admin-audit.bullet.1':
    'Üks rida sündmuse kohta koos aja, kasutaja, toimingu, ressursi, IP ja üksikasjadega.',
  'help.ctx.admin-audit.bullet.2': 'Värskenda laadib uuesti; Laadi veel liigub kaugemale minevikku.',
  // create-user
  'help.guide.create-user.title': 'Loo kasutaja',
  'help.guide.create-user.goal': 'Lisa konto käsitsi, ilma kutseta.',
  'help.guide.create-user.step.1': 'Klõpsa vahekaardi Kasutajad ülaosas Loo kasutaja.',
  'help.guide.create-user.step.2':
    'Sisesta Kasutajanimi, E-post ja Parool ning vali Roll: Kasutaja või Administraator.',
  'help.guide.create-user.step.3': 'Klõpsa Loo kasutaja.',
  'help.guide.create-user.result':
    'Konto ilmub tabelisse ja saab kohe sisse logida; anna parool üle kanali kaudu, mida usaldad.',
  'help.guide.create-user.tip.1': 'Kui inimene peaks ise oma parooli valima, on kutselink parem viis.',
  'help.guide.create-user.tip.2':
    'Administraatorid näevad seda lehte ja auditilogi; kõik muu on mõlema rolli jaoks sama.',
  // edit-user
  'help.guide.edit-user.title': 'Muuda kasutaja rolli või parooli',
  'help.guide.edit-user.goal':
    'Edenda kedagi, võta tal õigusi vähemaks või aita ta pärast kadunud parooli tagasi sisse.',
  'help.guide.edit-user.step.1': 'Klõpsa kasutaja real pliiatsit. Avaneb Muuda kasutajat konto andmetega.',
  'help.guide.edit-user.step.2':
    'Muuda Rolli, määra Uus parool või klõpsa Lähtesta pääsuvõtmed, kui inimene kaotas seadme, millel ta pääsuvõtmed olid, seejärel Salvesta.',
  'help.guide.edit-user.result':
    'Muudatus rakendub järgmisel päringul; uus parool töötab alates järgmisest sisselogimisest.',
  'help.guide.edit-user.tip.1': 'Sa ei saa endalt administraatori rolli ära võtta, kui oled viimane administraator.',
  'help.guide.edit-user.tip.2':
    'Pääsuvõtmete lähtestamine säilitab parooli; inimene lisab uued pääsuvõtmed jaotises Seaded, Konto.',
  // invite-links
  'help.guide.invite-links.title': 'Kutsu keegi lingiga',
  'help.guide.invite-links.goal':
    'Lase inimesel suletud instantsis registreeruda ja soovi korral kohe reisiga liituda.',
  'help.guide.invite-links.step.1': 'Klõpsa jaotises Kutselingid Loo link.',
  'help.guide.invite-links.step.2':
    'Määra Kasutuskordade ülempiir ja Aegub pärast, soovi korral Lisa reisile (valikuline), ja klõpsa Loo ja kopeeri.',
  'help.guide.invite-links.step.3':
    'Saada link. Iga rida näitab, mitu korda seda on kasutatud ja kes selle lõi; Kopeeri link kopeerib selle uuesti ning ärakasutatud või aegunud lingid on märgitud.',
  'help.guide.invite-links.result':
    'Kes lingi avab, registreerub oma parooliga ja, kui reis on valitud, liitub sellega kohe.',
  'help.guide.invite-links.tip.1':
    'Kutselingid töötavad ka siis, kui Parooliga registreerumine on jaotises Seaded välja lülitatud.',
  'help.guide.invite-links.tip.2':
    'Ühe kasutuskorra ja lühikese aegumisajaga link on ühele inimesele kõige turvalisem vaikevalik.',
  // delete-user
  'help.guide.delete-user.title': 'Kustuta kasutaja',
  'help.guide.delete-user.goal': 'Eemalda konto ja kõik, mis kuulub ainult sellele.',
  'help.guide.delete-user.step.1': 'Klõpsa kasutaja real prügikastiikooni ja kinnita Kustuta kasutaja.',
  'help.guide.delete-user.result':
    'Konto, selle enda reisid ja reisilood kaovad; teistega jagatud reisid jäävad ülejäänud liikmetele.',
  'help.guide.delete-user.tip.1': 'Seda ei saa tagasi võtta. Kui sa pole kindel, tee enne varukoopia.',
  'help.guide.delete-user.tip.2':
    'Viimast administraatorit ei saa kustutada; tee kõigepealt keegi teine administraatoriks.',
  // permissions
  'help.guide.permissions.title': 'Otsusta, kes mida tohib teha',
  'help.guide.permissions.goal': 'Määra iga toimingu jaoks, milline roll tohib seda selles TREKis teha.',
  'help.guide.permissions.step.1':
    'Leia jaotises Õiguste seaded toiming selle rühmast, näiteks Reiside kustutamine rühmas Reiside haldus, ja vali tase: Kõik, Reisi liikmed, Reisi omanik või Ainult administraator. Muudetud rida märgitakse sildiga kohandatud.',
  'help.guide.permissions.step.2': 'Klõpsa Salvesta. Taasta vaikeseaded taastab kõigi ridade sisseehitatud taseme.',
  'help.guide.permissions.result':
    'Reegel kehtib korraga kõigile reisidele; inimestel, kes jäävad tasemest allapoole, kaovad vastavad nupud ja menüüd.',
  'help.guide.permissions.tip.1': 'Reisi omanik tähendab reisi loojat; administraatorid tohivad alati kõike teha.',
  'help.guide.permissions.tip.2':
    'Liikme kustutamise asemel langeta taset: liige, kes ei tohi muuta, saab ikkagi lugeda ja kommenteerida.',
  // default-map
  'help.guide.default-map.title': 'Määra uute kasutajate kaardi vaikeseaded',
  'help.guide.default-map.goal': 'Anna igale uuele kontole töötav kaart ilma isikliku pääsutõendita.',
  'help.guide.default-map.step.1':
    'Vali jaotises Kaart Kaardimootor ning Mapboxi või MapLibre puhul Kaardi stiil, Ühine Mapboxi pääsutõend ja Kõrge kvaliteediga režiim; rasterkaardi puhul Kaardimall ja Ühine CARTO võti.',
  'help.guide.default-map.step.2':
    'Iga muudetud välja kõrval taastab lähtesta TREKi enda valiku. Vasakul olev Kasutajate vaikeseaded teeb sama Värvirežiimi, ühikute ja valuuta jaoks.',
  'help.guide.default-map.result':
    'Uued kontod alustavad nende seadetega; kes on jaotises Seaded oma kaardi määranud, säilitab enda oma.',
  'help.guide.default-map.tip.1':
    'Siin sisestatud pääsutõendit jagavad kõik, kellel oma pole, seega jälgi selle kvooti.',
  'help.guide.default-map.tip.2':
    'Olemasolevad kontod, mis pole kunagi kaardi vahekaarti puudutanud, järgivad samuti neid vaikeseadeid.',
  // packing-templates
  'help.guide.packing-templates.title': 'Loo pakkimismall',
  'help.guide.packing-templates.goal': 'Anna reisidele pakkimisnimekiri, millest alustada, tühja nimekirja asemel.',
  'help.guide.packing-templates.step.1': 'Klõpsa Uus mall, sisesta nimi ja kinnita linnukesega.',
  'help.guide.packing-templates.step.2':
    'Ava mall ja klõpsa Lisa kategooria; iga kategooria all lisab + esemeid ja esemel on vaja ainult nime.',
  'help.guide.packing-templates.step.3':
    'Kõik salvestub jooksvalt. Pliiats nimetab malli, kategooria või eseme ümber, prügikast kustutab selle.',
  'help.guide.packing-templates.result':
    'Malli pakutakse iga reisi pakkimisnimekirjas; selle rakendamine kopeerib esemed, nii et reis saab neid vabalt muuta.',
  'help.guide.packing-templates.tip.1':
    'Eraldi mall iga reisitüübi jaoks (rand, linn, matkamine) on parem kui üks hiiglaslik nimekiri.',
  'help.guide.packing-templates.tip.2': 'Malli kustutamine ei mõjuta reise, kus seda on juba rakendatud.',
  // categories
  'help.guide.categories.title': 'Halda kategooriaid',
  'help.guide.categories.goal':
    'Otsusta, milliseid kategooriaid saab kohtadele ja kogumikele määrata ning kuidas need välja näevad.',
  'help.guide.categories.step.1':
    'Klõpsa Uus kategooria, anna sellele nimi, vali ikoon ja värv; Eelvaade näitab tulemust. Klõpsa Loo.',
  'help.guide.categories.step.2':
    'Kategooria muutmiseks või kustutamiseks vii hiirekursor loendis selle kohale. Kustutamine küsib kinnitust.',
  'help.guide.categories.result':
    'Kategooriad kehtivad kõikjal korraga: koha inspektoris, kaardinõeltel, kogumikes ja filtrites.',
  'help.guide.categories.tip.1':
    'Kohad säilitavad oma kategooria ID, seega kategooria ümbernimetamine muudab nime kõigil kohtadel.',
  'help.guide.categories.tip.2':
    'Kustutatud kategooria jätab selle kohad kategooriata; kui see on oluline, määra neile enne uus kategooria.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Halda koolivaheaegu käsitsi',
  'help.guide.school-holiday-catalog.goal': 'Lisa riik või piirkond, mida sisseehitatud vaheaegade allikad ei kata.',
  'help.guide.school-holiday-catalog.step.1':
    'Jaotises Koolivaheajad klõpsa Lisa riik, sisesta Riik ja selle Riigikood (nt EE) ning Salvesta; seejärel klõpsa Lisa piirkond iga erineva osa jaoks.',
  'help.guide.school-holiday-catalog.step.2':
    'Klõpsa piirkonnal, et avada Piirkond või koolipiirkond: Lisa vaheaeg, anna igaühele Vaheaja nimi, Alguskuupäev ja Lõppkuupäev ning Salvesta. Prügikast eemaldab vaheaja, piirkonna või, kui piirkondi enam pole, riigi.',
  'help.guide.school-holiday-catalog.result':
    'Kasutajad leiavad riigi ja piirkonna Vacay jaotisest Seaded ning näevad vaheaegu oma aastaruudustikul.',
  'help.guide.school-holiday-catalog.tip.1':
    'Sisseehitatud allikatest pärit piirkondi siin muuta ei saa; kui mõni kuupäev on vale, lisa nende kõrvale käsitsi piirkond.',
  // auth-methods
  'help.guide.auth-methods.title': 'Otsusta, kuidas inimesed sisse logivad',
  'help.guide.auth-methods.goal': 'Luba või keela parooliga sisselogimine, SSO ja registreerumine ning nõua 2FA-d.',
  'help.guide.auth-methods.step.1':
    'Jaotises Autentimisviisid lülita Parooliga sisselogimine ja Parooliga registreerumine sisse või välja. Kui registreerumine on väljas, saab uusi kontosid luua ainult kutselinkide, SSO kaudu või käsitsi.',
  'help.guide.auth-methods.step.2':
    'SSO-ga sisselogimine ja SSO kontode automaatne loomine eeldavad, et allpool on seadistatud Ühekordne sisselogimine (OIDC); automaatne loomine teeb konto, kui keegi logib esimest korda SSO kaudu sisse.',
  'help.guide.auth-methods.step.3':
    'Nõua kaheastmelist autentimist (2FA) paneb iga parooliga sisselogija järgmisel sisselogimisel autentimisrakenduse seadistama. Pääsuvõtmega sisselogimine vajab usaldava osapoole ID-d ja päritolusid, mille kaudu su TREKile ligi pääseb.',
  'help.guide.auth-methods.result': 'Sisselogimisleht pakub täpselt neid viise, mille sisse jätsid.',
  'help.guide.auth-methods.tip.1':
    'Enne kui end välja lukustad, kuvatakse hoiatus: vähemalt üks administraatorite sisenemisviis jääb sisse.',
  'help.guide.auth-methods.tip.2': 'Keskkonnamuutujatega määratud väärtused on siin kirjutuskaitstud.',
  // oidc
  'help.guide.oidc.title': 'Ühenda ühekordne sisselogimine',
  'help.guide.oidc.goal': 'Lase inimestel sisse logida sinu identiteedipakkuja kaudu.',
  'help.guide.oidc.step.1':
    'Jaotises Ühekordne sisselogimine (OIDC) sisesta nupu Kuvatav nimi ning oma teenusepakkujalt saadud Väljastaja URL, Kliendi ID ja Kliendi saladus, seejärel Salvesta.',
  'help.guide.oidc.step.2': 'Lülita jaotises Autentimisviisid sisse SSO-ga sisselogimine.',
  'help.guide.oidc.result':
    'Sisselogimislehel kuvatakse SSO nupp; kui SSO kontode automaatne loomine on sees, saavad esmakordsed kasutajad konto automaatselt.',
  'help.guide.oidc.tip.1':
    'Teenusepakkuja vajatav ümbersuunamise URI on su TREKi aadress koos dokumentatsioonis toodud OIDC tagasikutse teega.',
  'help.guide.oidc.tip.2':
    'Väidete vastendus määrab, millistest SSO gruppidest saavad administraatorid; vaata dokumentatsiooni OIDC lehte.',
  // instance-keys
  'help.guide.instance-keys.title': 'Sisesta API-võtmed',
  'help.guide.instance-keys.goal': "Ava kogu instantsi jaoks Google'i kohaotsing, Unsplashi kaanepildid ja Amap.",
  'help.guide.instance-keys.step.1':
    'Jaotises API-võtmed kleebi Google Mapsi API-võti ja klõpsa Testi; väli näitab, kas võti vastab.',
  'help.guide.instance-keys.step.2':
    'Jaotises Milleks võtit tohib kasutada lülita sisse ainult need funktsioonid, mille eest soovid selle võtmega maksta: automaatne täitmine, üksikasjad, fotod, andmete täiendamine, kohtade varikoopia.',
  'help.guide.instance-keys.step.3':
    'Unsplashi API-võti võimaldab kaanepiltide otsingut, Amapi (高德地图) API-võti kohaotsingut Hiinas. Testi kumbagi samamoodi.',
  'help.guide.instance-keys.result':
    "Kasutajad saavad funktsioonid ilma oma võtmeteta; Google'i võtme puudumisel otsib TREK tasuta OpenStreetMapi teenuste ja TREK Places API kaudu.",
  'help.guide.instance-keys.tip.1':
    'Kasutaja isiklik võti jaotises Seaded on selle kasutaja puhul instantsi võtmest ülimuslik.',
  'help.guide.instance-keys.tip.2': 'Võtmed võivad tulla ka keskkonnamuutujatest; need on siin kirjutuskaitstud.',
  // places-transit
  'help.guide.places-transit.title': 'Vali otsingu ja ühistranspordi teenusepakkujad',
  'help.guide.places-transit.goal': 'Otsusta, kes vastab kohaotsingutele ja ühistranspordi marsruutidele.',
  'help.guide.places-transit.step.1':
    'Jaotises Kohaotsingu teenusepakkuja vali Automaatne, Google Places, Amap (高德地图) või OpenStreetMap. Automaatne kasutab parimat olemasolevat võtit.',
  'help.guide.places-transit.step.2':
    "Jaotises Ühistranspordi teenusepakkuja vali Transitous (tasuta), mis töötab üle maailma ja ilma võtmeta, või Google, mis vajab Google'i võtit.",
  'help.guide.places-transit.result': 'Iga otsingukast ja iga ühistranspordi marsruut TREKis järgib seda valikut.',
  'help.guide.places-transit.tip.1':
    'Ilma võtmeta teenusepakkuja puhul kuvatakse siin hoiatus ja kasutatakse varuvariandina OpenStreetMapi.',
  'help.guide.places-transit.tip.2':
    "Google'i ühistranspordi marsruutide eest võetakse tasu iga päringu eest, Transitousi eest mitte.",
  // file-types
  'help.guide.file-types.title': 'Piira failitüüpe',
  'help.guide.file-types.goal': 'Otsusta, milliste laienditega faile tohib üles laadida.',
  'help.guide.file-types.step.1':
    'Jaotises Lubatud failitüübid muuda komadega eraldatud laiendite loendit ja salvesta.',
  'help.guide.file-types.result':
    'Muud tüüpi failide üleslaadimine lükatakse selge teatega tagasi nii dokumentides, reisiloos kui ka kaanepiltide puhul.',
  'help.guide.file-types.tip.1': 'Jäta pilditüübid loendisse; kaanepildid ja reisiloo fotod läbivad sama kontrolli.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Lülita lisamoodul sisse või välja',
  'help.guide.toggle-addon.goal': 'Paku funktsioonimoodulit kõigile või võta see ära.',
  'help.guide.toggle-addon.step.1':
    'Lülita lisamooduli paanil olevat lülitit. Navigeerimiskirje ilmub või kaob kõigi jaoks korraga.',
  'help.guide.toggle-addon.step.2':
    'Mõnel paanil on valikute jaoks alamread, näiteks Kottide haldus Nimekirjade all või fototeenused Reisiloo all; need on nähtavad ainult siis, kui lisamoodul on sees.',
  'help.guide.toggle-addon.result':
    'Välja lülitatud lisamooduli andmed säilivad; uuesti sisse lülitamisel on need taas nähtavad.',
  'help.guide.toggle-addon.tip.1':
    'Kui MCP on väljas, eemaldatakse lõpp-punkt ja sellest sõltuvad Integratsioonide jaotised.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas ja Reisilugu on lisamoodulid, mida kasutajad kõige rohkem soovivad; Dokumendid vajab üleslaadimiste jaoks salvestusruumi.',
  // document-providers
  'help.guide.document-providers.title': 'Paku dokumendihoidlat',
  'help.guide.document-providers.goal': 'Otsusta, milliste hoidlatega tohib reis oma dokumente sünkroonis hoida.',
  'help.guide.document-providers.step.1':
    'Dokumentide paanil on hoidlad ridadena selle riiulil: Paperless-ngx, Papra, Nextcloud, OpenCloud ja Synology Drive. Kõik viis on alguses välja lülitatud ning riiul on olemas ainult siis, kui Dokumendid ise on sees.',
  'help.guide.document-providers.step.2':
    'Lülita Nextcloudi real olevat lülitit. Kuvatakse teade Lisamoodul uuendatud ning edaspidi leiavad reisi omanikud oma reiside vahekaardilt Failid Dokumentide sünkroonimise, kus Nextcloud on jaotises Ühenda teenus.',
  'help.guide.document-providers.result':
    'Hoidla on saadaval selle TREKi igal reisil; midagi ei ühendata enne, kui reisi omanik seda teeb.',
  'help.guide.document-providers.tip.1':
    'Siin otsustatakse ainult, kas hoidlat tohib pakkuda. Aadress ja kasutajaandmed kuuluvad reisile ning reisi omanik sisestab need reisi vahekaardil Failid, mitte kunagi halduspaneelis.',
  'help.guide.document-providers.tip.2':
    'Dokumentide väljalülitamine lülitab välja ka kõik hoidlad ning hoidlat ei saa sisse lülitada, kui Dokumendid on väljas: server vastab Luba kõigepealt lisamoodul Dokumendid. Sinu enda võrgus asuv hoidla vajab serveris ka seadet ALLOW_INTERNAL_NETWORK=true.',
  // install-plugin
  'help.guide.install-plugin.title': 'Paigalda plugin',
  'help.guide.install-plugin.goal':
    'Lisa kolmanda osapoole plugin ja anna sellele täpselt need õigused, mida see küsib.',
  'help.guide.install-plugin.step.1':
    'Ava Avasta, vali plugin ja klõpsa Paigalda; või klõpsa Laadi plugin üles ja vali .zip- või .tar.gz-pakett.',
  'help.guide.install-plugin.step.2':
    'Tagasi jaotises Paigaldatud loe rida: mida plugin tohib lugeda või kirjutada, milliste hostidega see ühendust võtab ja kas see on allkirjastatud. Lülita sisse Luba plugin.',
  'help.guide.install-plugin.step.3':
    'Rea menüüs on Taaskäivita, Vaata vealogi, Lubatud hostid ja Muuda versiooni…; Kustuta eemaldab plugina. Uuema versiooni olemasolul pakutakse real uuendust ning uuendus, mis küsib uusi õigusi, jääb välja, kuni need kinnitad.',
  'help.guide.install-plugin.result':
    'Plugin töötab omaette protsessis; see, mida see lisab (vidinad, kaardikihid, tööriistad), ilmub sinna, kuhu plugin selle määrab.',
  'help.guide.install-plugin.tip.1': 'Skanni uuesti leiab arenduseks lingitud pluginakausta ilma paketita.',
  'help.guide.install-plugin.tip.2':
    'Allkirjastamata plugin on vastavalt märgitud; paigalda see ainult siis, kui usaldad selle allikat.',
  // storage-backends
  'help.guide.storage-backends.title': 'Teisalda üleslaaditud failid S3-le või peeglisse',
  'help.guide.storage-backends.goal': 'Hoia faile objektisalvestuses või nii kettal kui ka ämbris.',
  'help.guide.storage-backends.step.1':
    'Jaotises Taustsüsteemid klõpsa Lisa taustsüsteem, anna sellele Nimi, vali Tüüp (Kohalik, S3 või Peegel), täida väljad ja Rakenda. Testi kontrollib ühendust, Salvesta muudatused salvestab selle.',
  'help.guide.storage-backends.step.2':
    'Jaotises Kategooriad määra iga üleslaadimiskategooria mõnele taustsüsteemile. Muutmisel küsitakse, kas Teisalda olemasolevad objektid või Suuna ainult uued kirjutused.',
  'help.guide.storage-backends.step.3':
    'Ülal olev Tervis kontrollib iga taustsüsteemi; punane kirje nimetab, mis ebaõnnestus.',
  'help.guide.storage-backends.result':
    'Uued üleslaadimised lähevad määratud taustsüsteemi; teisaldatud faile serveeritakse sealt.',
  'help.guide.storage-backends.tip.1':
    'Keskkonnamuutujatega seadistatud taustsüsteem on nähtav, kuid seda ei saa siin muuta.',
  'help.guide.storage-backends.tip.2':
    'Peegel kirjutab mõlemasse sihtkohta ja loeb esimesest; kasuta seda migreerimiseks ilma katkestuseta.',
  // channels-instance
  'help.guide.channels-instance.title': 'Seadista teavituskanalid',
  'help.guide.channels-instance.goal': 'Otsusta, milliseid kanaleid kasutajad saavad valida, ja seadista e-post.',
  'help.guide.channels-instance.step.1':
    'Jaotises E-post (SMTP) sisesta SMTP-host, SMTP-port, SMTP-kasutaja, SMTP-parool ja Saatja aadress; Saada testkiri saadab sulle kirja.',
  'help.guide.channels-instance.step.2':
    'Nende pakkumiseks lülita sisse Veebitõuketeavitused, Ntfy ja Veebihaak; seejärel lülitavad kasutajad jaotises Seaded, Teavitused tõuketeavitused iga seadme jaoks sisse või sisestavad oma teema või URL-i.',
  'help.guide.channels-instance.step.3':
    'Reisi meeldetuletused lülitab sisse või välja meeldetuletuse enne reisi algust; Rakenduses on alati sees ja seda ainult selgitatakse siin.',
  'help.guide.channels-instance.result': 'Iga kasutaja vahekaardil Teavitused on näha kanalid, mille sisse lülitasid.',
  'help.guide.channels-instance.tip.1':
    'Siia sisestatud vaikimisi ntfy-server täidetakse kasutajatele eelnevalt; nad saavad siiski määrata oma serveri.',
  'help.guide.channels-instance.tip.2':
    'Pluginate kanalid ilmuvad iseenesest, kui vastava võimekusega plugin on aktiivne.',
  // admin-channels
  'help.guide.admin-channels.title': 'Saa administraatorisündmused oma telefoni',
  'help.guide.admin-channels.goal':
    'Saa teada ebaõnnestunud varundustest, uutest versioonidest ja muudest instantsi sündmustest.',
  'help.guide.admin-channels.step.1':
    'Jaotises Administraatori ntfy sisesta teema ja vajadusel server ning token; jaotises Administraatori veebihaak URL.',
  'help.guide.admin-channels.step.2':
    'Klõpsa Saada ntfy testteavitus või Saada testteavitus veebihaagi kaudu, et näha teate saabumist.',
  'help.guide.admin-channels.result':
    'Administraatorisündmused saadetakse sinna lisaks iga administraatori rakendusesisesele kellale.',
  'help.guide.admin-channels.tip.1':
    'Hoia administraatori teema isiklikust eraldi, et tõrketeade ei upuks reisiteadete sekka.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Tühista AI juurdepääs',
  'help.guide.mcp-tokens-admin.goal': 'Vaata ja katkesta iga AI-kliendi pääsutõend ja seanss mis tahes kasutaja puhul.',
  'help.guide.mcp-tokens-admin.step.1':
    'Jaotises API-pääsutõendid leia pääsutõend kasutaja ja nime järgi; prügikast kustutab selle ja klient lõpetab kohe töö.',
  'help.guide.mcp-tokens-admin.step.2':
    'Jaotises OAuth-seansid sama brauseripõhiste klientide jaoks: klient, kasutaja ja kuupäev ning prügikast tühistab seansi.',
  'help.guide.mcp-tokens-admin.result': 'Kasutaja peab kliendi uuesti ühendama; midagi muud ei muutu.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Õiguste ulatus näitab, mida klient teha saaks; ainult lugemisõigusega ulatuse võib ohutult alles jätta.',
  'help.guide.mcp-tokens-admin.tip.2': 'MCP lisamooduli väljalülitamine tühistab kõik korraga.',
  // release-history
  'help.guide.release-history.title': 'Kontrolli, kas on uus versioon',
  'help.guide.release-history.goal': 'Tea, kas su TREK on ajakohane ja mida järgmine versioon toob.',
  'help.guide.release-history.step.1':
    'Kui on olemas uuem versioon, kuvatakse halduslehe ülaosas Uuendus saadaval; Vaata GitHubis avab selle ja Kuidas uuendada selgitab uuendamist Dockeri ja muude paigalduste jaoks.',
  'help.guide.release-history.step.2':
    'Versiooniajalugu loetleb kõik versioonid koos märkmetega; Näita üksikasju laiendab neid, uusimal on silt Uusim ja Laadi veel näitab vanemaid.',
  'help.guide.release-history.result':
    'Uuendamine toimub hostis uue tõmmise allalaadimise või uue sildi ehitamisega; andmekataloog jääb alles.',
  'help.guide.release-history.tip.1': 'Tee enne uuendamist varukoopia; vahekaart Varundamine on kõrval.',
  'help.guide.release-history.tip.2':
    'Eelversioone näidatakse, kuid uuendusena neist ei teatata, välja arvatud juhul, kui kasutad ise eelversiooni.',
  // create-backup
  'help.guide.create-backup.title': 'Loo ja taasta varukoopia',
  'help.guide.create-backup.goal':
    'Salvesta kogu instantsi hetkeseis, hoia koopiat mujal ja saa selle vajadusel taastada.',
  'help.guide.create-backup.step.1':
    'Jaotises Andmete varundamine klõpsa Loo varukoopia. See pakib andmebaasi ja üleslaaditud failid serveris üheks failiks.',
  'help.guide.create-backup.step.2':
    'Laadi alla salvestab koopia väljaspool serverit; prügikast kustutab vanu, et ruumi vabastada.',
  'help.guide.create-backup.step.3':
    'Taasta varukoopia real või Laadi varukoopia üles koos failiga asendab praegused andmed pärast seda, kui Kas taastada varukoopia? on korra kinnitust küsinud.',
  'help.guide.create-backup.result':
    'Taastamine toob tagasi kasutajad, reisid, failid ja seaded selle varukoopia seisuga; kõik logitakse välja.',
  'help.guide.create-backup.tip.1':
    'Taastamine on siin ainus toiming, mida ei saa tagasi võtta. Tee enne värske varukoopia.',
  'help.guide.create-backup.tip.2':
    'Varukoopiad asuvad andmekataloogis; päris varukoopiaks teeb need alles koopia teises masinas.',
  // auto-backup
  'help.guide.auto-backup.title': 'Ajasta varundamine',
  'help.guide.auto-backup.goal': 'Lase serveril end ise varundada ja hoida alles ainult viimased paar koopiat.',
  'help.guide.auto-backup.step.1':
    'Jaotises Automaatne varundamine lülita sisse Luba automaatne varundamine ning vali Sagedus, Käivitamise kellaaeg ja iganädalase või igakuise varundamise puhul Nädalapäev või Kuupäev.',
  'help.guide.auto-backup.step.2':
    'Kustuta vanad varukoopiad pärast määrab, kui kaua varukoopiat hoitakse; vanemad kustutatakse uue loomisel.',
  'help.guide.auto-backup.result':
    'Varukoopiad ilmuvad loendisse ajakava järgi; tõrkest antakse teada administraatori kanalites.',
  'help.guide.auto-backup.tip.1': 'Ajad järgivad serveri ajavööndit, mis on näha vahekaardil Audit.',
  'help.guide.auto-backup.tip.2':
    'Serveri salvestusruum on piiratud; tavaliselt piisab kolme kuni viie varukoopia alles hoidmisest.',
  // audit-log
  'help.guide.audit-log.title': 'Loe auditilogi',
  'help.guide.audit-log.goal': 'Uuri välja, kes mida tegi ja millal.',
  'help.guide.audit-log.step.1':
    'Loe ridu: aeg, kasutaja, toiming, ressurss, IP ja üksikasjad, uusimad eespool. Toimingud on nimetatud juhtunu järgi, näiteks ebaõnnestunud sisselogimine, MFA muutmine või taastamine.',
  'help.guide.audit-log.step.2': 'Värskenda laadib ülemised read uuesti; Laadi veel näitab vanemaid.',
  'help.guide.audit-log.result': 'Jälg, mille saad üle anda igaühele, kes küsib, miks midagi muutus.',
  'help.guide.audit-log.tip.1': 'Ajad kuvatakse serveri ajavööndis, mis on märgitud tabeli kohal.',
  'help.guide.audit-log.tip.2': 'Logisse saab ainult lisada; rakendusest ei saa siin midagi muuta ega kustutada.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Reis',
  'help.ctx.trip.summary':
    'Üks reis tervikuna: plaan oma päevade, kaardi ja kohtadega ning vahekaardid transpordi, broneeringute, nimekirjade, kulude, failide ja koostöö jaoks. Igaühel neist on selle all oma abivaade.',
  'help.ctx.trip.bullet.1':
    'Vahekaardiriba: Plaan, Transport, Broneeringud, Nimekirjad, Kulud, Failid ja Koostöö. Lisamoodulid ja pluginad määravad, millised vahekaardid su TREKis on.',
  'help.ctx.trip.bullet.2':
    'Plaan koosneb kolmest veerust: päevad vasakul, kaart keskel, kohad paremal. Broneeringud ja transport asuvad plaanis, peatuse juures ja peatuste vahel; vahekaardid loetlevad neid.',
  'help.ctx.trip.bullet.3':
    'Paremal üleval olev Jaga avab reisi inimesed: liikmed, külalised, kutselingi ja kirjutuskaitstud avaliku lingi.',
  'help.ctx.trip.bullet.4':
    'Pealkirja, kuupäevi, kaanepilti ja valuutat muudetakse lehel Minu reisid reisikaardil oleva pliiatsiga.',
  'help.ctx.trip.bullet.5':
    'Veeru siseservas olevad noolekesed ahendavad veeru ja kaart võtab ruumi enda alla; veeru kõrval olev õhuke eraldaja muudab selle laiust.',
  'help.ctx.trip.bullet.6': 'Päevade tööriistaribal olev tagasivõtmise nool võtab tagasi viimase plaanimuudatuse.',
  // add-member
  'help.guide.add-member.title': 'Lisa liige',
  'help.guide.add-member.goal': 'Anna TREKi kontoga inimesele juurdepääs sellele reisile.',
  'help.guide.add-member.step.1': 'Klõpsa paremal üleval Jaga.',
  'help.guide.add-member.step.2': 'Jaotises Kutsu kasutaja vali loendist inimene ja klõpsa Kutsu.',
  'help.guide.add-member.step.3':
    'Inimene on nüüd jaotises Juurdepääs. Kroon tähistab omanikku; rea lõpus olev ikoon eemaldab juurdepääsu uuesti.',
  'help.guide.add-member.result':
    'Liige näeb ja muudab reisi nagu sina, administraatori poolt jaotises Õiguste seaded määratud piires.',
  'help.guide.add-member.tip.1':
    'Kui kedagi loendis pole, pole tal veel TREKi kontot: lisa ta külalisena või lase tal kutselingi kaudu registreeruda.',
  'help.guide.add-member.tip.2':
    'Juurdepääs kõrval olev arv näitab reisil olevate inimeste arvu; külalised on eraldi allpool.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Kutsu lingiga',
  'help.guide.trip-invite-link.goal': 'Lase inimestel ise reisiga liituda.',
  'help.guide.trip-invite-link.step.1': 'Klõpsa Jaga, seejärel jaotises Reisi kutselink klõpsa Loo kutselink.',
  'help.guide.trip-invite-link.step.2':
    'Klõpsa Kopeeri ja saada link. Igaüks, kellel on TREKi konto ja kes selle avab, liitub liikmena.',
  'help.guide.trip-invite-link.step.3': 'Loo uuesti asendab lingi ja muudab vana kasutuks; Keela lülitab selle välja.',
  'help.guide.trip-invite-link.result': 'Igaüks, kes lingi avab, on reisil ja kuvatakse jaotises Juurdepääs.',
  'help.guide.trip-invite-link.tip.1':
    'Ilma kontota inimene seda kasutada ei saa. Administraator jagab registreerimislinke jaotises Administraator, Kasutajad ja saab lingi selle reisiga siduda.',
  'help.guide.trip-invite-link.tip.2':
    'Kasuta Loo uuesti, kui link sattus valesse vestlusesse: vana lakkab kohe töötamast.',
  // add-guest
  'help.guide.add-guest.title': 'Lisa kontota külaline',
  'help.guide.add-guest.goal': 'Arvesta sisse keegi, kes TREKi ei kasuta.',
  'help.guide.add-guest.step.1': 'Klõpsa Jaga ja keri jaotiseni Külalised.',
  'help.guide.add-guest.step.2': 'Sisesta nimi väljale Külalise nimi ja klõpsa Lisa külaline.',
  'help.guide.add-guest.result':
    'Külalise saab määrata kuludele, pakkimisesemetele ja ülesannetele, kuid ta ei saa sisse logida.',
  'help.guide.add-guest.tip.1':
    'Pliiats nimetab külalise ümber; rea lõpus olev ikoon eemaldab ta koos tema osade ja määramistega.',
  'help.guide.add-guest.tip.2': 'Kui inimene saab hiljem konto, kutsu ta liikmeks ja eemalda külaline.',
  // public-link
  'help.guide.public-link.title': 'Avalda kirjutuskaitstud link',
  'help.guide.public-link.goal': 'Näita reisi inimestele, kes ei tohiks seda muuta.',
  'help.guide.public-link.step.1':
    'Klõpsa Jaga; paremal jaotises Avalik link märgi, mida link tohib näidata. Kaart ja plaan on alati sees; Broneeringud, Pakkimine, Kulud ja Vestlus on sinu valik.',
  'help.guide.public-link.step.2': 'Klõpsa Loo link, seejärel Kopeeri.',
  'help.guide.public-link.step.3': 'Märkeid saab muuta seni, kuni link on olemas; Kustuta link lõpetab selle.',
  'help.guide.public-link.result': 'Igaüks, kellel on link, näeb valitud osi ilma sisse logimata ega saa midagi muuta.',
  'help.guide.public-link.tip.1':
    'Linki pole kuskil loetletud; igaüks, kellel see on, saab selle avada, seega käsitle seda nagu parooli.',
  'help.guide.public-link.tip.2': 'Muutmisõiguste andmiseks lisa inimene hoopis liikmeks.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Anna reis üle või lahku sellest',
  'help.guide.transfer-ownership.goal': 'Tee keegi teine omanikuks või lahku reisilt, mis pole sinu oma.',
  'help.guide.transfer-ownership.step.1':
    'Klõpsa Jaga. Jaotises Juurdepääs teeb liikme real olev kroon selle inimese omanikuks; kinnita küsimus.',
  'help.guide.transfer-ownership.step.2':
    'Sinu enda real olev Lahku reisilt viib sind reisilt välja; omanikuna anna reis enne üle.',
  'help.guide.transfer-ownership.result': 'Uus omanik haldab liikmeid ja saab reisi kustutada; sina jääd tavaliikmeks.',
  'help.guide.transfer-ownership.tip.1':
    'Omanik on reisi looja, kuni reis üle antakse; reisi kustutamine on ainult tema õigus.',
  'help.guide.transfer-ownership.tip.2':
    'Eemalda juurdepääs teise inimese real on sama nupp vastupidises suunas: omanik eemaldab liikme.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Tee kaardile ruumi',
  'help.guide.collapse-columns.goal': 'Ahenda veerg või anna sellele rohkem laiust.',
  'help.guide.collapse-columns.step.1':
    'Klõpsa päevade veeru siseservas olevat noolekest, et veerg ahendada; kaart võtab ruumi enda alla. Kohtade veerul on sama noolekene.',
  'help.guide.collapse-columns.step.2': 'Veeru tagasitoomiseks klõpsa noolekest uuesti.',
  'help.guide.collapse-columns.step.3':
    'Veeru laiuse muutmiseks lohista veeru ja kaardi vahel olevat õhukest eraldajat.',
  'help.guide.collapse-columns.result': 'Laiused jäetakse meelde; järgmisel külastusel on veerud taas avatud.',
  'help.guide.collapse-columns.tip.1': 'Ainult kaardi vaate jaoks saab mõlemad veerud korraga ahendada.',
  'help.guide.collapse-columns.tip.2': 'Telefonis veerge pole: Plaan ja Kohad on kaks nuppu kaardi allosas.',
  // undo-change
  'help.guide.undo-change.title': 'Võta viimane muudatus tagasi',
  'help.guide.undo-change.goal': 'Võta tagasi see, mida plaanis just tegid.',
  'help.guide.undo-change.step.1':
    'Klõpsa päevade kohal oleval tööriistaribal tagasivõtmise noolt; selle kohtspikker nimetab muudatuse, mis tagasi võetakse.',
  'help.guide.undo-change.result': 'Plaan on taas endine ja nool muutub halliks kuni järgmise muudatuseni.',
  'help.guide.undo-change.tip.1':
    'Tagasivõtmine hõlmab plaani: kohtade määramist, eemaldamist, järjestamist ja teisaldamist, marsruudi optimeerimist, kohtade kustutamist, kategooriamuudatusi ja importimist.',
  'help.guide.undo-change.tip.2':
    'See on ühesammuline: tagasi saab võtta ainult viimase muudatuse ja uus muudatus asendab selle.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Kohad',
  'help.ctx.trip-places.summary':
    'Plaani parem veerg: kõik reisi kohad, plaanitud või mitte, koos otsingu ja filtritega ning võimalustega kohti lisada käsitsi, failist või jagatud nimekirjast.',
  'help.ctx.trip-places.bullet.1':
    'Ülal olev Lisa koht või tegevus avab vormi kohale, mille sisestad või otsid. Kui päev on avatud, on nupul tekst Uus koht ja selle kõrval olev Päevale loob koha otse sellele päevale.',
  'help.ctx.trip-places.bullet.2':
    'Impordi fail võtab vastu .gpx-, .kml- ja .kmz-faile; Nimekirja import võtab vastu jagatud Google Mapsi või Naver Mapsi nimekirja. Faili võib ka lihtsalt veergu lohistada.',
  'help.ctx.trip-places.bullet.3':
    'Rippmenüüs saab valida Kõik, Planeerimata, Plaanis ja pärast raja importimist Rajad; selle all on otsing, kategooriafilter ja täht minimaalse hinnangu jaoks.',
  'help.ctx.trip-places.bullet.4':
    'Real on pilt, nimi ja kirjeldus või aadress. Klõpsa sellel koha üksikasjade nägemiseks, lohista see päevale või paremklõpsa, et näha valikuid Muuda, Lisa päevale, Ava veebisait, Google Maps, Salvesta kogumikku ja Kustuta.',
  'help.ctx.trip-places.bullet.5':
    'Kui päev on avatud, lisab planeerimata rea lõpus olev + koha sellele päevale ja Plaanis näitab ainult seda päeva; Näita kogu reisi laiendab vaate taas.',
  'help.ctx.trip-places.bullet.6':
    'Filtririda paremas otsas olev linnuke alustab valikut: mitmele reale korraga saab määrata uue kategooria, lisada need kogumikku või need kustutada.',
  // create-place
  'help.guide.create-place.title': 'Loo koht',
  'help.guide.create-place.goal':
    'Lisa koht või tegevus käsitsi koos kõige sellega, mida plaan selle kohta teadma peab.',
  'help.guide.create-place.step.1':
    'Klõpsa kohtade veeru ülaosas Lisa koht või tegevus (kui päev on avatud, siis Uus koht). Avaneb vorm.',
  'help.guide.create-place.step.2':
    "Sisesta koht ülal olevale väljale Otsi kohti… ja vali tulemus. Nimi, Aadress, Laiuskraad, Pikkuskraad ja Veebisait täidetakse ning vasakul olev Koha üksikasjad näitab selle pilte, lahtiolekuaegu ja kirjeldust. Google'i võtmega TREKis on loendi all Pole õige koht? Otsi Google'ist, mis teeb sama otsingu Google'i kaudu.",
  'help.guide.create-place.step.3':
    'Jaotises Koha üksikasjad teeb klõps pildil jaotises Vali pilt sellest koha pildi; Kasuta seda teksti tõstab kirjelduse vormi.',
  'help.guide.create-place.step.4':
    'Kontrolli välju: Nimi on kohustuslik; Kirjeldus ja Märkmed on sinu täita; Aadress, Laiuskraad ja Pikkuskraad tulevad otsingust või sisestatakse käsitsi; Kategooria valib ühe reisi kategooriatest ja selle kõrval olev + loob kohe uue; Veebisait on lingi jaoks.',
  'help.guide.create-place.step.5':
    'Klõpsa Lisa. Kui sama nimega koht on reisil juba olemas, annab vorm sellest teada ja nupuks saab Lisa siiski.',
  'help.guide.create-place.result': 'Koht on loendis ja kaardil, jaotises Planeerimata, kuni see päevale lisatakse.',
  'help.guide.create-place.tip.1':
    'Vormi allosas olevad Failid ja Kulud lisavad kohale dokumendi või avavad kohe pärast salvestamist kulude redaktori selle kulu jaoks.',
  'help.guide.create-place.tip.2':
    "Igas TREKis vastavad otsingule TREKi indeks ja OpenStreetMap ning Koha üksikasjad täitub Wikipediast, Wikivoyage'ist ja Wikimediast. Google'i poole pöördutakse ainult siis, kui mõlemad jäävad tulemusteta, ja ainult Google annab hinnangud.",
  'help.guide.create-place.tip.3':
    'Koha võib luua ka kaardilt: paremklõpsa kohal ja vorm avaneb koos täidetud koordinaatide ja aadressiga.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Lisa koht otse avatud päevale',
  'help.guide.place-to-open-day.goal': 'Jäta teine samm vahele: loo või vali koht ja see on kohe päeval.',
  'help.guide.place-to-open-day.step.1':
    'Klõpsa päevade veerus päeva päisel. Päev on avatud: selle kaart on esile tõstetud ja kohtade veergu ilmub nupp Päevale.',
  'help.guide.place-to-open-day.step.2':
    'Päevale avab sama vormi mis Uus koht, ainult et koht lisatakse avatud päevale kohe, kui klõpsad Lisa.',
  'help.guide.place-to-open-day.step.3':
    'Juba olemasoleva koha saab avatud päevale lisada selle rea lõpus oleva + abil või paremklõpsuga, Lisa päevale.',
  'help.guide.place-to-open-day.step.4':
    'Toimib ka teistpidi ja ilma päeva enne avamata: lohista koha rida veerust välja ja aseta see päeva kaardile. Kahe peatuse vahele asetatuna jõuab see täpselt sinna.',
  'help.guide.place-to-open-day.result': 'Koht on päeva all loendi lõpus; lohista see üles või alla õigesse kohta.',
  'help.guide.place-to-open-day.tip.1':
    'Avatud päev suunab ka otsingut: kui päev on avatud, lähtuvad kaart ja läheduses otsing kohtadest, kuhu see päev juba viib.',
  'help.guide.place-to-open-day.tip.2': 'Päevade kohal oleva tööriistariba nupp Võta tagasi tühistab määramise.',
  // filter-places
  'help.guide.filter-places.title': 'Leia koht loendist',
  'help.guide.filter-places.goal': 'Kitsenda veergu kohtadeni, mida otsid.',
  'help.guide.filter-places.step.1':
    'Ülal olevas rippmenüüs saab valida Kõik, Planeerimata (pole veel üheski päevas), Plaanis (on mõnel päeval) ja Rajad (imporditud GPX-rajad), igaühel oma arv.',
  'help.guide.filter-places.step.2': 'Kirjuta väljale Otsi kohti…; loend kitseneb kirjutamise ajal.',
  'help.guide.filter-places.step.3':
    'Kõik kategooriad avab loendi, kus saab märkida ühe või mitu kategooriat, sealhulgas Kategooriata; selle allosas olev Tühjenda filter lähtestab valiku.',
  'help.guide.filter-places.step.4':
    'Selle kõrval olev täht määrab minimaalse hinnangu: 5+, 4+ jne näitavad ainult kohti, mida oled hinnanud vähemalt nii kõrgelt.',
  'help.guide.filter-places.result': 'Ridade kohal olev arv näitab, mitu kohta sobib; filtrid toimivad koos.',
  'help.guide.filter-places.tip.1':
    'Kui päev on avatud, näitab Plaanis ainult seda päeva ja ütleb seda: Näidatakse ainult avatud päeva, selle kõrval Näita kogu reisi.',
  'help.guide.filter-places.tip.2': 'Ka kaart piirdub avatud päevaga; loendis näitab Kõik endiselt kõiki reisi kohti.',
  // edit-place
  'help.guide.edit-place.title': 'Muuda kohta',
  'help.guide.edit-place.goal': 'Paranda nime, liiguta nõela, lisa veebisait või muuda kategooriat.',
  'help.guide.edit-place.step.1': 'Paremklõpsa real ja vali Muuda või ava koht ja klõpsa selle üksikasjades Muuda.',
  'help.guide.edit-place.step.2':
    'Muuda, mida vaja: Nimi, Kirjeldus, Märkmed, Aadress, Laiuskraad ja Pikkuskraad, Kategooria, Veebisait. Päevalt avatuna on vormis ka Selle päeva märkmed ning selle päeva Algus ja Lõpp.',
  'help.guide.edit-place.step.3': 'Klõpsa Uuenda.',
  'help.guide.edit-place.result':
    'Muudatus kehtib kõikjal, kus koht esineb: loendis, kaardil ja igal päeval, kus see on.',
  'help.guide.edit-place.tip.1':
    'Selle päeva märkmed kuuluvad kohale ainult sellel ühel päeval; Märkmed kuuluvad kohale endale.',
  'help.guide.edit-place.tip.2':
    'Kui Lõpp on enne Algust, ei saa Uuenda klõpsata; Ajaline kattuvus: ainult hoiatab, et päeva mõnel teisel peatusel on sama aeg.',
  // delete-place
  'help.guide.delete-place.title': 'Kustuta koht',
  'help.guide.delete-place.goal': 'Eemalda koht reisilt jäädavalt.',
  'help.guide.delete-place.step.1': 'Paremklõpsa real ja vali Kustuta või klõpsa koha üksikasjades Kustuta.',
  'help.guide.delete-place.step.2':
    'Kinnita. Kui kohas on broneeritud öö või kohaga on seotud broneering, ütleb küsimus, mis sellega koos kaob.',
  'help.guide.delete-place.result':
    'Koht on kadunud loendist, kaardilt ja kõigilt päevadelt; päevade kohal oleva tööriistariba nupp Võta tagasi toob selle tagasi.',
  'help.guide.delete-place.tip.1':
    'Koha eemaldamiseks ainult ühelt päevalt kasuta hoopis selle peatuse juures Eemalda päevast.',
  'help.guide.delete-place.tip.2': 'Mitu kohta korraga: filtrite kõrval olev linnuke alustab valikut.',
  // select-places
  'help.guide.select-places.title': 'Muuda või kustuta mitu kohta korraga',
  'help.guide.select-places.goal': 'Korrasta loend ühe korraga, mitte koht-kohalt.',
  'help.guide.select-places.step.1':
    'Klõpsa filtrirea paremas otsas olevat linnukest. Ridadele ilmuvad märkeruudud ja kuvatakse toimingute riba.',
  'help.guide.select-places.step.2': 'Märgi read või klõpsa ribal Vali kõik; riba näitab valitute arvu.',
  'help.guide.select-places.step.3':
    'Muuda kategooriat annab neile kõigile ühe kategooria; Salvesta kogumikku kopeerib need ühte sinu kogumikku; Kustuta valitud eemaldab need pärast kinnitust.',
  'help.guide.select-places.step.4': 'Valikust väljumiseks klõpsa linnukest uuesti.',
  'help.guide.select-places.result':
    'Muudatus kehtib igale valitud kohale; kustutamise saab tagasi võtta päevade kohal olevalt tööriistaribalt.',
  'help.guide.select-places.tip.1':
    'Filtrid töötavad valimise ajal edasi: filtreeri kõigepealt Planeerimata ja siis valib Vali kõik täpselt need.',
  'help.guide.select-places.tip.2':
    'Märgi oma nimekirjades külastatuks ilmub ribale, kui lisamoodul Kogumikud on sees: see märgib kohad külastatuks kogumikes, kuhu need on salvestatud.',
  // import-places-file
  'help.guide.import-places-file.title': 'Impordi kohad GPX-, KML- või KMZ-failist',
  'help.guide.import-places-file.goal': 'Too sisse see, mida Google My Maps, Google Earth või GPS-seade eksportis.',
  'help.guide.import-places-file.step.1': 'Klõpsa Impordi fail või lohista fail kuhu tahes kohtade veergu.',
  'help.guide.import-places-file.step.2':
    'Vali fail või lohista see kasti. GPX-i puhul märgi, mida importida: Teekonnapunktid, Marsruudid, Rajad (koos teekonna geomeetriaga); KML-i ja KMZ-i puhul Punktid (Placemarks) ja Teekonnad (LineStrings).',
  'help.guide.import-places-file.step.3':
    'Kasti saab korraga panna mitu faili, kuid ainult .gpx-, .kml- ja .kmz-faile. Muud tüüpi või üle 10 MB suurune fail lükatakse dialoogis tagasi ja seda ei impordita.',
  'help.guide.import-places-file.step.4':
    'Klõpsa Impordi. Teade näitab, mitu kohta lisandus; KML- või KMZ-faili puhul jääb dialoog avatuks koos kokkuvõttega sellest, mis loodi ja mis vahele jäeti.',
  'help.guide.import-places-file.result':
    'Kohad on loendis; rajal on real marsruudi tähis, see joonistatakse kaardile ja saab oma filtri Rajad.',
  'help.guide.import-places-file.tip.1':
    'Liiga suur fail lükatakse tagasi koos suuruspiiranguga; ekspordi see uuesti ilma fotodeta või jaga osadeks.',
  'help.guide.import-places-file.tip.2':
    'Importimise saab tervikuna tagasi võtta päevade kohal olevalt tööriistaribalt.',
  // import-places-list
  'help.guide.import-places-list.title': 'Impordi jagatud Google Mapsi või Naver Mapsi nimekiri',
  'help.guide.import-places-list.goal': 'Muuda jagatud nimekirja link kohtadeks.',
  'help.guide.import-places-list.step.1': "Klõpsa Nimekirja import ja vali Google'i nimekiri või Naveri nimekiri.",
  'help.guide.import-places-list.step.2':
    'Kleebi nimekirja jagatud link. Sobib ka Google Mapsi teejuhiste link: selle peatustest saavad kohad sõidujärjekorras.',
  'help.guide.import-places-list.step.3': 'Klõpsa Impordi.',
  'help.guide.import-places-list.result':
    'Kõik nimekirja kohad on reisil samade nimedega nagu nimekirjas; juba reisil olevad kohad jäetakse vahele.',
  'help.guide.import-places-list.tip.1':
    'Nimekiri peab olema avalikult jagatud; privaatse nimekirja link ei impordi midagi.',
  'help.guide.import-places-list.tip.2':
    "Täienda kohtade andmeid Google'i kaudu ilmub dialoogi, kui su TREKil on Google'i võti: see otsib üles iga imporditud koha ja täidab fotod, aadressi ja üksikasjad.",

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Päevad',
  'help.ctx.trip-days.summary':
    'Plaani vasak veerg: iga päeva kohta üks kaart, millel on päeva peatused järjekorras, märkmed, päeva broneeringud ja transport ning marsruut peatuste vahel. Siin reisi tegelikult planeeritaksegi.',
  'help.ctx.trip-days.bullet.1':
    'Ülal olev tööriistariba: Ekspordi (PDF, kalender, GPX), Laienda kõik päevad / Ahenda kõik päevad, tagasivõtmise nool, Muuda päevade järjekorda ja Näita kõiki broneeringute marsruute.',
  'help.ctx.trip-days.bullet.2':
    'Päeva kaart: päises on number, ilm, pealkiri, kuupäev ja päeva kulu; klõpsa päisel päeva avamiseks, noolekene ahendab päeva kaardi. Päises on ka Ühistransport, Lisa transport ja Lisa märge.',
  'help.ctx.trip-days.bullet.3':
    'Päeva sees: peatused järjekorras, igaühel pilt, nimi, aeg ja pildil lukk; märkmed; päevale kuuluvad broneeringud; ning peatuste vahel iga teelõigu sõiduaeg.',
  'help.ctx.trip-days.bullet.4':
    'Peatuste all on marsruudiriba: Marsruut joonistab päeva kaardile, Optimeeri järjestab peatused, Autoga / Jalgsi määrab päeva liikumisviisi, Ava Google Mapsis ja Ava CoMapsis annavad päeva neile rakendustele üle.',
  'help.ctx.trip-days.bullet.5':
    'Kohad jõuavad päevale, kui lohistad rea kohtade veerust, kasutad selle rea +-i, tühjal päeval nuppu Lisa koht sellele päevale või koha üksikasju.',
  'help.ctx.trip-days.bullet.6':
    'Allosas olev Kogukulu liidab kokku kõik hinnaga peatused ja broneeringud reisi valuutas.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Loe päeva kaarti',
  'help.guide.read-day-plan.goal': 'Tea enne muutmist, mida päeva kaardi iga osa sulle ütleb.',
  'help.guide.read-day-plan.step.1':
    'Päis: päeva number, päeva ilmaprognoos, Päev 1 või sinu antud pealkiri, kuupäev ja päeva kulu. Klõpsa päisel päeva avamiseks (selle üksikasjade paneel avaneb kaardi kohal); paremal olev noolekene ahendab ja laiendab päeva kaarti.',
  'help.guide.read-day-plan.step.2':
    'Peatus: vasakul olevast pidemest saab seda lohistada, pildil on lukk marsruudi optimeerimise jaoks, seejärel nimi, kirjeldus ja kui on määratud, selle päeva märkmed. Ajamärk näitab Algust ja Lõppu, kui peatusel need on; selle paremas otsas ilmuvad nooled liigutavad peatust üles või alla.',
  'help.guide.read-day-plan.step.3':
    'Päeva broneering: peatuse broneering märgib peatuse kui Broneering kinnitatud või Broneering ootel ning transport kuvatakse kui Väljumine või Saabumine koos aja ja marsruudiga ning väikese lülitiga, mis joonistab selle marsruudi kaardile.',
  'help.guide.read-day-plan.step.4':
    'Kahe peatuse vahel näitab ühendaja päeva liikumisviisi järgi, kui kaua teelõik aega võtab ja kui pikk see on; klõpsa sellel, et muuta ainult selle teelõigu liikumisviisi.',
  'help.guide.read-day-plan.step.5':
    'Lõpus olev marsruudiriba: Marsruut joonistab päeva teekonna kaardile, Optimeeri muudab peatuste järjekorda, liikumisviisi nupud valivad Autoga või Jalgsi, Ava Google Mapsis ja Ava CoMapsis avavad päeva seal.',
  'help.guide.read-day-plan.result':
    'Igal päeva kaardi sümbolil on tähendus; allolevad juhendid näitavad, kuidas igaüht neist muuta.',
  'help.guide.read-day-plan.tip.1':
    'Paremklõpsa peatusel, et avada selle menüü: Muuda, Eemalda päevast, Ava veebisait, navigeerimisrakendused (Google Maps, Waze, Apple Maps, OpenStreetMap, CoMaps), Salvesta kogumikku, Kustuta.',
  'help.guide.read-day-plan.tip.2':
    'Vii hiirekursor peatuse kohale ja selle lõppu ilmub Lisa broneering: seal loodud broneering on seotud selle peatusega sellel päeval.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Lisa koht päevale',
  'help.guide.place-onto-day.goal': 'Muuda loendis olev koht päeva peatuseks õigele kohale järjekorras.',
  'help.guide.place-onto-day.step.1':
    'Lohista rida kohtade veerust päeva kaardile. Aseta see kahe peatuse vahele, et see täpselt sinna panna, või ükskõik kuhu päeva kaardil, et lisada see lõppu.',
  'help.guide.place-onto-day.step.2':
    'Lohistamata: ava päev selle päisel klõpsates, seejärel klõpsa koha rea lõpus olevat + või paremklõpsa real ja vali Lisa päevale.',
  'help.guide.place-onto-day.step.3':
    'Tühjal päeval avab Lisa koht sellele päevale kohavormi ja uus koht lisatakse kohe päevale.',
  'help.guide.place-onto-day.step.4':
    'Koha üksikasjades küsib Lisa päevale, milline päev; kui päev on päisest avatud, loob kohtade veerus olev Päevale uue koha avatud päevale.',
  'help.guide.place-onto-day.result':
    'Koht on päeva peatus, kaardil päeva numbriga, ja kohtade veerg arvestab seda jaotises Plaanis.',
  'help.guide.place-onto-day.tip.1':
    'Koht võib olla mitmel päeval: lisa see teisele päevale kohtade veerust. Peatuse lohistamine ühe päeva kaardilt teisele hoopis teisaldab selle.',
  'help.guide.place-onto-day.tip.2': 'Tööriistariba tagasivõtmise nool tühistab määramise.',
  'help.guide.place-onto-day.tip.3':
    'Peatust ei saa asetada kahe kindla kellaajaga kirje vahele ega kellaajaga broneeringu ette; plaan säilitab ajalise järjekorra.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Muuda päeva järjekorda',
  'help.guide.reorder-stops.goal': 'Liiguta peatust üles või alla või teisele päevale.',
  'help.guide.reorder-stops.step.1': 'Lohista peatus pidemest päeva kaardil uude kohta.',
  'help.guide.reorder-stops.step.2':
    'Või kasuta peatuse paremas otsas olevaid nooli: iga klõps liigutab ühe sammu üles või alla.',
  'help.guide.reorder-stops.step.3':
    'Lohista peatus teise päeva kaardile, et see sinna teisaldada; vanalt päevalt see kaob.',
  'help.guide.reorder-stops.step.4':
    'Kindla kellaajaga peatus küsib Kas eemaldada kellaaeg?, kui teisaldamine rikuks päeva järjekorra, sest selle koha määras kellaaeg: Kinnita eemaldab kellaaja ja peatuse saab panna kuhu tahes.',
  'help.guide.reorder-stops.result': 'Marsruut ja sõiduajad järgivad kohe uut järjekorda.',
  'help.guide.reorder-stops.tip.1':
    'Kindla kellaajaga broneeringute järjekorda ei saa muuta; need asuvad seal, kuhu nende kellaaeg need paigutab.',
  'help.guide.reorder-stops.tip.2':
    'Marsruudiriba nupp Optimeeri järjestab kogu päeva lühima tee järgi; peatuse paigale jätmiseks lukusta see enne.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Määra peatusele kellaaeg',
  'help.guide.set-stop-times.goal': 'Määra, millal peatus algab ja lõpeb, et päev oleks loetav nagu ajakava.',
  'help.guide.set-stop-times.step.1':
    'Paremklõpsa peatusel ja vali Muuda. Päevalt avatuna on vormi allosas Algus ja Lõpp.',
  'help.guide.set-stop-times.step.2':
    'Sisesta Algus ja soovi korral Lõpp. Ajaline kattuvus: hoiatab, et päeva mõni teine kellaajaga peatus kattub; kui Lõpp on enne Algust, ei saa Uuenda klõpsata.',
  'help.guide.set-stop-times.step.3':
    'Klõpsa Uuenda. Peatus saab ajamärgi ja liigub päevas kohta, mis vastab selle kellaajale.',
  'help.guide.set-stop-times.result':
    'Kellaajaga peatused säilitavad oma koha järjekorras; kellaajata peatused paigutuvad nende ümber.',
  'help.guide.set-stop-times.tip.1':
    'Kellaaeg kuulub peatusele sellel päeval; samal kohal võib teisel päeval olla teine kellaaeg.',
  'help.guide.set-stop-times.tip.2':
    'Kellaajaga peatuse käsitsi teisaldamiseks lohista seda: küsimus Kas eemaldada kellaaeg? eemaldab kellaaja, kui klõpsad Kinnita.',
  'help.guide.set-stop-times.tip.3':
    'Sama vormi väli Selle päeva märkmed on selle jaoks, mis kehtib ainult sellel päeval, näiteks broneeritud laud või piletinumber.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Eemalda peatus päevast',
  'help.guide.remove-from-day.goal': 'Tühista koha planeerimine ilma seda reisilt kustutamata.',
  'help.guide.remove-from-day.step.1': 'Paremklõpsa peatusel ja vali Eemalda päevast.',
  'help.guide.remove-from-day.step.2':
    'Peatus on päevast kadunud; koht jääb kohtade veergu, jaotisesse Planeerimata, kui see pole üheski teises päevas.',
  'help.guide.remove-from-day.result': 'Päev, selle marsruut ja kulu uuenevad; tagasivõtmise nool toob peatuse tagasi.',
  'help.guide.remove-from-day.tip.1': 'Sama menüü Kustuta eemaldab koha kogu reisilt, kaasa arvatud kõigilt päevadelt.',
  'help.guide.remove-from-day.tip.2': 'Eemalda päevast on ka koha üksikasjade paneelil, nupu Lisa päevale kõrval.',
  // lock-stop
  'help.guide.lock-stop.title': 'Lukusta peatus paigale',
  'help.guide.lock-stop.goal': 'Hoia peatus marsruudi optimeerimisel paigal.',
  'help.guide.lock-stop.step.1':
    'Vii hiirekursor peatuse pildi kohale ja klõpsa lukul: Säilita asukoht marsruudi optimeerimisel.',
  'help.guide.lock-stop.step.2':
    'Optimeeri järjestab nüüd teised peatused selle ümber; vabastamiseks klõpsa lukul uuesti (Lukustuse eemaldamiseks klõpsa).',
  'help.guide.lock-stop.result': 'Lukk on pildil näha; peatus säilitab oma koha, kuni lukustuse eemaldad.',
  'help.guide.lock-stop.tip.1':
    'Kindla kellaajaga peatuse lukustab selle kellaaeg; optimeerimisel see kunagi ei liigu.',
  'help.guide.lock-stop.tip.2':
    'Lukk kehtib ainult selle külastuse ajal: pärast lehe uuesti laadimist on kõik peatused jälle vabad, paigal püsivad ainult kellaajaga peatused.',
  // day-note
  'help.guide.day-note.title': 'Lisa päevale märge',
  'help.guide.day-note.goal': 'Hoia meeldetuletust, piletinumbrit või plaani B otse päevas.',
  'help.guide.day-note.step.1': 'Klõpsa päeva päises Lisa märge.',
  'help.guide.day-note.step.2':
    'Anna sellele nimi väljal Märkus (see kuvatakse päeva kaardil) ja kirjuta ülejäänu väljale Päevamärge. Selle kohal olev tööriistariba vormindab teksti (paks kiri, loendid, lingid, tsitaadid) ja vasakul olev Eelvaade näitab, milline kaart sellest saab.',
  'help.guide.day-note.step.3': 'Vali Ikoon ja Värv, et märge peatuste seast silma paistaks, seejärel klõpsa Lisa.',
  'help.guide.day-note.step.4':
    'Märge asub päevas nagu peatus: lohista see õigesse kohta, paremklõpsa sellel, et valida Muuda või Kustuta.',
  'help.guide.day-note.result': 'Märge on päeva osa, ka PDF-is; kellaajaga märge järjestub koos kellaajaga peatustega.',
  'help.guide.day-note.tip.1':
    'Kellaajaga märge võib asendada transporti, mille kohta sul broneeringut pole: „08:15 S3 keskjaamast“.',
  'help.guide.day-note.tip.2': 'Märkmed on päevapõhised; kogu reisi märge kuulub jaotisse Koostöö.',
  // day-route
  'help.guide.day-route.title': 'Näita ja optimeeri päeva marsruuti',
  'help.guide.day-route.goal': 'Vaata teekonda peatuste vahel, vali liikumisviis ja lase TREKil järjekord paika panna.',
  'help.guide.day-route.step.1':
    'Ava päev ja klõpsa marsruudiribal Marsruut: teekond peatuste vahel joonistatakse kaardile ja peatuste vahelised ühendajad näitavad iga teelõigu aega ja pikkust.',
  'help.guide.day-route.step.2':
    'Selle kõrval olevad Autoga ja Jalgsi määravad päeva liikumisviisi; teelõigud arvutatakse ümber. Pluginad võivad lisada oma liikumisviise.',
  'help.guide.day-route.step.3':
    'Klõpsa ühendajal, et muuta ainult selle teelõigu liikumisviisi: vali liikumisviis või Kasuta päeva vaikevalikut, et naasta päeva liikumisviisi juurde.',
  'help.guide.day-route.step.4':
    'Optimeeri järjestab peatused lühima tee järgi ümber. Lukustatud või kindla kellaajaga peatused jäävad paigale; kui päeval on majutus, algab marsruut sealt.',
  'help.guide.day-route.step.5':
    'Ava Google Mapsis või Ava CoMapsis avab kogu päeva marsruudina selles rakenduses, et saaksid teel navigeerida.',
  'help.guide.day-route.result': 'Päev on aegadega marsruut; Kogukulu ja teelõigud uuenevad järjekorra muutumisel.',
  'help.guide.day-route.tip.1':
    'Vaikimisi tulevad marsruudid OSRM-ist; administraator saab jaotises Kasutaja vaikevalikud suunata TREKi teise marsruutimismootori juurde.',
  'help.guide.day-route.tip.2':
    'Teelõigul, mille marsruuti ei õnnestunud arvutada, aega ei kuvata; kontrolli, kas mõlemal peatusel on koordinaadid.',
  'help.guide.day-route.tip.3': 'Tagasivõtmise nool tühistab optimeerimise.',
  // manage-days
  'help.guide.manage-days.title': 'Lisa, järjesta ja nimeta päevi ümber',
  'help.guide.manage-days.goal': 'Kujunda päevi endid, mitte ainult nende sisu.',
  'help.guide.manage-days.step.1':
    'Päevad tulenevad reisi kuupäevadest; muuda kuupäevi reisikaardil jaotises Ülevaade ja päevi lisatakse või eemaldatakse otstest. Enne kui sisuga päev eemaldatakse, näitab loend, millised päevad kaovad ja mis neil on.',
  'help.guide.manage-days.step.2':
    'Tööriistariba nupp Muuda päevade järjekorda avab loendi: Liiguta üles ja Liiguta alla nihutavad päeva koos kogu selle sisuga ning nende kõrval olev prügikast, Kustuta päev, eemaldab selle. Loendi all olev järgmise kuupäevaga nupp lisab päeva kohe viimase kuupäevaga päeva järele ja pikendab reisi ühe päeva võrra; Ilma kuupäevata lisab lõppu kuupäevata päeva.',
  'help.guide.manage-days.step.3':
    'Kustuta päev küsib enne kinnitust: see loetleb, mis koos päevaga kaob (selle kohad, märkmed ja broneeringud, sellel päeval algav või lõppev majutus) ning päevad, mis nihkuvad ühe kuupäeva võrra ettepoole. Kustuta päev eemaldab selle, Tühista jätab alles; viimast päeva ei saa kustutada.',
  'help.guide.manage-days.step.4':
    'Päeva ümbernimetamiseks ava see ja klõpsa kaardi kohal oleval üksikasjade paneelil pealkirja kõrval olevat pliiatsit; nimi asendab päeva kaardil ja PDF-is teksti Päev 1.',
  'help.guide.manage-days.step.5':
    'Tööriistariba nupud Laienda kõik päevad ja Ahenda kõik päevad laiendavad või ahendavad kõik päevade kaardid korraga; üksikut päeva kaarti saab ahendada selle noolekesega.',
  'help.guide.manage-days.result':
    'Kuupäevad jäävad positsiooni juurde: ülespoole liigutatud päev saab varasema kuupäeva ning selle peatused, märkmed ja broneeringud liiguvad kaasa.',
  'help.guide.manage-days.tip.1': 'Päevade liigutamise saab tööriistaribalt tagasi võtta, päeva kustutamist mitte.',
  'help.guide.manage-days.tip.2': 'Päeva päises olev kulu liidab kokku selle päeva hinnaga peatused ja broneeringud.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Loe plaanis broneeringuid ja transporti',
  'help.guide.bookings-in-plan.goal': 'Tea, kus broneering pärast loomist kuvatakse ja millisel ekraanil seda luuakse.',
  'help.guide.bookings-in-plan.step.1':
    'Transport (lend, rong, praam, buss, auto) kuvatakse väljumise päeval kui Väljumine ja saabumise päeval kui Saabumine koos aja ja marsruudiga; mitmepäevane transport ulatub üle vahepealsete päevade.',
  'help.guide.bookings-in-plan.step.2':
    'Peatusega seotud broneering (restoran, ekskursioon) märgib selle peatuse kui Broneering kinnitatud või Broneering ootel; päevaga, kuid peatuseta broneering on päevas eraldi real.',
  'help.guide.bookings-in-plan.step.3':
    'Öö hotellis on majutus: see on päeva üksikasjade paneelil jaotises Majutus sisseregistreerimisest väljaregistreerimiseni ja kõigi nende päevade marsruut algab sealt.',
  'help.guide.bookings-in-plan.step.4':
    'Transpordi real olev lüliti joonistab selle marsruudi kaardile; tööriistariba nupp Näita kõiki broneeringute marsruute joonistab need kõik.',
  'help.guide.bookings-in-plan.step.5':
    'Loomine: Lisa broneering peatusel, mille kohal on hiirekursor, Lisa transport ja Ühistransport päeva päises ning vahekaardid Broneeringud ja Transport täieliku loendi, importimise ja failide jaoks.',
  'help.guide.bookings-in-plan.result':
    'Üks broneering, üks koht plaanis; vahekaardid näitavad samu broneeringuid loendina.',
  'help.guide.bookings-in-plan.tip.1':
    'Kinnitatud ja ootel on olek, mille määrad broneeringule; plaan näitab seda peatusel, vahekaart Broneeringud loeb mõlemad kokku.',
  'help.guide.bookings-in-plan.tip.2':
    'Kindla kellaajaga transporti ei saa lohistada; muuda selle asemel kellaaega broneeringus.',
  // export-plan
  'help.guide.export-plan.title': 'Ekspordi plaan',
  'help.guide.export-plan.goal': 'Võta plaan kaasa dokumendina, oma kalendrisse või GPS-seadmesse.',
  'help.guide.export-plan.step.1': 'Klõpsa päevade kohal oleval tööriistaribal Ekspordi.',
  'help.guide.export-plan.step.2':
    'Dokument: PDF avab kõigi päevade printimisvaate koos peatuste, märkmete ja broneeringutega; Iga päev uuel lehel alustab iga päeva uuelt lehelt, Salvesta PDF-ina laadib selle alla.',
  'help.guide.export-plan.step.3':
    'Kalender: Laadi alla .ics salvestab broneeringud kalendrifailina; Telli kalender annab lingi, mida su kalendrirakendus ise värskendab.',
  'help.guide.export-plan.step.4':
    'Kaardid ja GPS · GPX: Kogu reis ekspordib kohad, päevade marsruudid ja rajad; Ainult kohad ainult kaardinõelad; Päevad marsruutidena ühe marsruudi päeva kohta, võrguühenduseta kaartide ja GPS-seadmete jaoks.',
  'help.guide.export-plan.result': 'Fail laaditakse alla; reisis ei muutu midagi.',
  'help.guide.export-plan.tip.1':
    'Üksiku päeva saab kaardirakendusse saata selle marsruudiribalt: Ava Google Mapsis või Ava CoMapsis.',
  'help.guide.export-plan.tip.2':
    'Telli kalender eeldab, et kalendrivood on su seadetes sisse lülitatud; Ülevaate juures on selle kohta juhend.',
  'help.guide.export-plan.tip.3': 'Eksportimine on lugemine: seda saab teha iga reisi liige.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Koha üksikasjad',
  'help.ctx.trip-place.summary':
    'Paneel, mis avaneb kaardi kohal, kui valid koha: kõik, mida reis selle kohta teab, kõigi antud tärnid, selle pilt ja failid ning nupud, mis lisavad selle avatud päevale, nimekirja või kaardirakendusse.',
  'help.ctx.trip-place.bullet.1':
    'Klõpsa kohtade veerus real, päeva sees peatusel või kaardil markeril ja paneel avaneb kaardi kohal. Kui valid koha päeva seest, teab paneel, millist peatust mõtled, ning just see toob kaasa peatuse osalejad ja broneeringu.',
  'help.ctx.trip-place.bullet.2':
    'Päises on ümmargune pilt, nimi, kategooria, aadress ja koordinaadid. Klõpsa pildil, et kasutada oma pilti, topeltklõpsa nimel, et koht kohe ümber nimetada, ning paremal olev X sulgeb paneeli.',
  'help.ctx.trip-place.bullet.3':
    'Selle all: hind, kui see on olemas, iga reisija antud tärnid, kirjeldus ja märkmed ning Selle päeva märkmed, kui peatusel need on.',
  'help.ctx.trip-place.bullet.4':
    'Edasi tulevad Lahtiolekuajad, Raja värv, Raja statistika ja Failid, kui need on asjakohased. Failid võtab vastu mis tahes faili sinu kaustadest ja näitab ka seda, mis on selle peatuse broneeringu küljes.',
  'help.ctx.trip-place.bullet.5':
    'Allosas olev rida: kui päev on avatud, Lisa päevale või Eemalda päevast, seejärel Salvesta kogumikku, Navigeerimine, Ava veebisait, Muuda ja Kustuta.',
  'help.ctx.trip-place.bullet.6':
    "Otsingust valitud kohal on see, mida TREKi indeks või OpenStreetMap selle kohta teab: pildi ümber roheline rõngas tekstiga Avatud või punane tekstiga Suletud, koha enda kellaaja järgi, telefoninumber tärnide all, allpool Lahtiolekuajad, mille real on päeva lahtiolekuaeg ja klõpsuga kogu nädal, ning veebisait nupu Ava veebisait taga. Google'i hinnang kuvatakse ainult Google'i kaudu leitud kohal Google'i võtmega TREKis.",
  // read-place
  'help.guide.read-place.title': 'Mida paneel kohast ütleb',
  'help.guide.read-place.goal': 'Loe ühest paneelist kõike, mida reis ühe koha kohta teab.',
  'help.guide.read-place.step.1':
    'Klõpsa päevade veerus peatusel, mille kohta soovid lugeda. Paneel avaneb kaardi kohal ja peatus jääb oma päevas märgituks.',
  'help.guide.read-place.step.2':
    'Päis: ümmargune pilt, nimi, aadress ja täpsed koordinaadid. Roheline rõngas tekstiga Avatud või punane tekstiga Suletud pildi ümber näitab koha enda kellaaja järgi, kas koht on praegu avatud, kui TREK teab selle lahtiolekuaegu. Paremal olev X sulgeb paneeli.',
  'help.guide.read-place.step.3':
    'Selle all on iga reisija antud tärnid koos keskmise ja hääletanute arvuga. Veel hindamata, kui keegi pole hinnanud. Kohe allpool telefoninumber, kui kohal see on: klõps sellel annab numbri su telefonirakendusele.',
  'help.guide.read-place.step.4':
    'Seejärel kirjeldus ja selle all märkmed. Mõlemad on koha vormist pärit vormindatud tekst: loendid, lingid ja paks kiri töötavad.',
  'help.guide.read-place.step.5':
    'Osalejad näitab, kes sellesse peatusesse läheb. Kõik on kaasas, kuni kellegi välja võtad.',
  'help.guide.read-place.step.6':
    'Allpool Lahtiolekuajad: real on vaadatava päeva lahtiolekuajad ja klõps sellel avab kogu nädala, kus see päev on paksus kirjas. Selle kõrval on Failid.',
  'help.guide.read-place.step.7':
    'Allosas olev rida näitab, mida siit teha saad: eemaldada koha avatud päevast või lisada selle sinna, salvestada nimekirja, avada kaardirakenduses, muuta või kustutada.',
  'help.guide.read-place.result':
    'Paneel jääb avatuks, kuni sulged selle X-iga või valid teise koha, nädala lahtiolekuajad jäävad avatuks ja peatus, millele paneel kuulub, jääb päevade veerus märgituks.',
  'help.guide.read-place.tip.1':
    'Kohtade veerust valides teab paneel kohta, kuid mitte peatust, seega ei näita see osalejaid ega broneeringut. Vali hoopis peatus päeva seest ja mõlemad on olemas.',
  'help.guide.read-place.tip.2':
    'Topeltklõpsa nimel, et koht vormi avamata ümber nimetada. Enter salvestab, Escape tühistab muudatuse.',
  'help.guide.read-place.tip.3':
    "Käsitsi sisestatud koht ei näita midagi sellest: paneel teab ainult seda, mis on selle vormis. Ava see nupuga Muuda, vali see väljal Otsi kohti… soovituste hulgast ja klõpsa Uuenda ning lahtiolekuajad, telefoninumber ja veebisait tulevad kaasa. Google'i hinnang vajab Google'i võtit.",
  // rate-place
  'help.guide.rate-place.title': 'Hinda kohta',
  'help.guide.rate-place.goal': 'Anna kohale oma tärnid ja vaata, mida teised on andnud.',
  'help.guide.rate-place.step.1':
    'Ava koht. Tärnide rida on kohe päise all ja näitab senist häälte keskmist, sulgudes häälte arvu.',
  'help.guide.rate-place.step.2':
    'Klõpsa soovitud tärnil. Tärnid täituvad, kui liigud nende kohal, nii et näed, mida kohe annad.',
  'help.guide.rate-place.step.3':
    'Sinu hääl läheb kohe keskmisesse ja selle kõrval olevad näod näitavad, kes hääletas. Kõigi tärnide nägemiseks hoia hiirekursorit rea kohal.',
  'help.guide.rate-place.step.4':
    'Sama keskmine on näha koha real kohtade veerus, nii et head kohad paistavad loendis silma.',
  'help.guide.rate-place.result':
    'Sinu tärnid on kohal kogu reisiseltskonnale näha ja loendi kohal filtrireas olev täht saab nüüd jätta alles ainult kohad, mis ulatuvad alampiirini.',
  'help.guide.rate-place.tip.1': 'Hinnata võib iga reisija, isegi reisil, kus kohti tohivad muuta vaid mõned teist.',
  'help.guide.rate-place.tip.2':
    'Hääle tagasivõtmiseks klõpsa juba antud tärnil. Kui keegi pole enam hääletanud, on kohal taas tekst Veel hindamata.',
  'help.guide.rate-place.tip.3':
    'Tärnide kõrvale mahub kuni kuus hääletaja nägu; kohtspikker nimetab kõiki ja märgib sinu oma.',
  // place-image
  'help.guide.place-image.title': 'Lisa kohale oma pilt',
  'help.guide.place-image.goal': 'Asenda automaatne pisipilt oma fotoga.',
  'help.guide.place-image.step.1': 'Ava koht kohtade veerust.',
  'help.guide.place-image.step.2':
    'Hoia hiirekursorit päises oleva ümmarguse pildi kohal: ilmub kaamera ja kohtspikker ütleb Laadi pilt üles. Klõpsa sellel ja vali fail.',
  'help.guide.place-image.step.3': 'Päises on nüüd sinu pilt, mille nurgas on väike punane X.',
  'help.guide.place-image.step.4': 'Sama pilt on koha real kohtade veerus ja selle markeril kaardil.',
  'help.guide.place-image.result':
    'Sinu pilt on koha pilt kõikjal: paneelil, kohtade veerus, päeva peatusel, kaardi markeril ja jagatud reisil.',
  'help.guide.place-image.tip.1': "Toetatud on JPG, PNG, GIF ja WebP ning iPhone'i HEIC teisendatakse üleslaadimisel.",
  'help.guide.place-image.tip.2':
    'Nurgas olev X eemaldab sinu pildi ja automaatne pilt tuleb tagasi. Koht ise jääb puutumata.',
  'help.guide.place-image.tip.3':
    'Kui oma pilti pole, otsib TREK pildi koha koordinaatide järgi ja kasutab varuvariandina kategooria ikooni.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Lisa koht avatud päevale või eemalda see',
  'help.guide.place-day-assign.goal': 'Kasuta paneeli enda nuppu, selle asemel et rida üle planeerija lohistada.',
  'help.guide.place-day-assign.step.1':
    'Klõpsa päevade veerus päeva päisel. See päev on nüüd avatud ja paneel toimib selle suhtes.',
  'help.guide.place-day-assign.step.2':
    'Klõpsa kohtade veerus kohal, mis pole sellel päeval. Selle paneel avaneb ja allosas olev rida pakub nuppu Lisa päevale.',
  'help.guide.place-day-assign.step.3':
    'Klõpsa Lisa päevale. Peatus lisatakse päeva lõppu ja nupuks saab Eemalda päevast.',
  'help.guide.place-day-assign.step.4': 'Peatus on nüüd päevas, loendis viimane. Lohista see üles õigesse kohta.',
  'help.guide.place-day-assign.step.5':
    'Eemalda päevast eemaldab peatuse päevast uuesti ja paneel pakub taas nuppu Lisa päevale.',
  'help.guide.place-day-assign.result':
    'Päeval on peatus või pole seda enam ning koht ise jääb mõlemal juhul puutumata.',
  'help.guide.place-day-assign.tip.1':
    'Nupp on olemas ainult siis, kui päev on avatud. Ilma selleta pole paneelil kuhugi kohta lisada.',
  'help.guide.place-day-assign.tip.2':
    'Peatuse eemaldamine päevast jätab koha reisile ja kohtade veergu. Kõikjalt eemaldab selle Kustuta.',
  'help.guide.place-day-assign.tip.3':
    'Majutusbroneeringu kaudu päevale lisatud peatusel pole kumbagi nuppu: see öö lisatakse ja eemaldatakse päeva ööbimisplokis.',
  // place-participants
  'help.guide.place-participants.title': 'Määra, kes sellesse peatusesse läheb',
  'help.guide.place-participants.goal': 'Jaga seltskond ühe peatuse jaoks, ilma reisi jagamata.',
  'help.guide.place-participants.step.1':
    'Klõpsa päeva sees peatusel. Paneel avaneb ja Osalejad loetleb kõik reisil olijad.',
  'help.guide.place-participants.step.2':
    'Klõpsa reisija sildil, et ta sellest peatusest välja võtta. Kui hiirekursor on nime kohal, on nimi läbi kriipsutatud.',
  'help.guide.place-participants.step.3':
    'Kui keegi puudub, ilmub katkendjoonega +. Klõpsa sellel, et näha, kes peatusel ei osale.',
  'help.guide.place-participants.step.4':
    'Klõpsa nimel, et inimene tagasi lisada. Kui kõik on tagasi, kuulub peatus taas kogu seltskonnale.',
  'help.guide.place-participants.result':
    'Peatusel on sinu valitud reisijad ja ülejäänud seltskond saab selle pärastlõuna enda jaoks.',
  'help.guide.place-participants.tip.1':
    'Osalejad kuvatakse ainult siis, kui peatus on valitud, seega vali koht päeva seest, mitte kohtade veerust, ja ainult reisil, kus on rohkem kui üks reisija.',
  'help.guide.place-participants.tip.2':
    'Kui kedagi pole valitud, lähevad kõik; seetõttu ei saa peatusest viimast järelejäänud reisijat eemaldada.',
  'help.guide.place-participants.tip.3': 'Külaline, kellel pole oma kontot, võib olla osaleja nagu kõik teised.',
  // place-booking
  'help.guide.place-booking.title': 'Peatuse broneering',
  'help.guide.place-booking.goal': 'Vaata peatusega seotud broneeringut, ava see ja seo peatusega uus broneering.',
  'help.guide.place-booking.step.1':
    'Ava peatus, millega broneering on seotud. Kaardil on riba, kus on kirjas Kinnitatud või Ootel ja broneeringu nimi.',
  'help.guide.place-booking.step.2': 'Ribal on Kuupäev, Aeg ja Broneerimiskood ning broneeringu märkmed, kui neid on.',
  'help.guide.place-booking.step.3': 'Klõpsa ribal. Avaneb selle broneeringu vorm.',
  'help.guide.place-booking.step.4':
    'Väli Seo päevaplaani kirjega seob broneeringu peatusega ja siin on selleks juba see peatus valitud. Sulge vorm uuesti.',
  'help.guide.place-booking.step.5':
    'Peatuse uus broneering algab päevade veerust: vii kursor peatusele ja klõpsa rea lõpus nuppu +. Vorm avaneb pealkirjaga Uus broneering ja on juba peatusega seotud.',
  'help.guide.place-booking.result':
    'Broneering on peatusega seotud: see on kaardil, see on päevas ja selle failid on siin ka jaotises Failid.',
  'help.guide.place-booking.tip.1':
    'Riba on näha ainult selle peatuse juures, millega broneering on seotud. Peatuseta broneering asub vahekaardil Broneer.',
  'help.guide.place-booking.tip.2':
    'Ühel peatusel võib olla mitu broneeringut: lõuna ja ekskursioon, mis algab samast uksest.',
  'help.guide.place-booking.tip.3':
    'Rong, lend või praam avab hoopis transpordivormi, sama, mida kasutab vahekaart Transport.',
  // place-files
  'help.guide.place-files.title': 'Hoia koha piletid koha juures',
  'help.guide.place-files.goal': 'Pane koha pilet, vautšer või kaart sinna, kust sa seda otsima hakkad.',
  'help.guide.place-files.step.1':
    'Ava koht. Failid asub kaardi allosas ja seal on kirjas Failid, kuni kohal faile pole.',
  'help.guide.place-files.step.2': 'Klõpsa selle kõrval nuppu Laadi üles ja vali fail.',
  'help.guide.place-files.step.3': 'Nupp näitab koha failide arvu ja loend avaneb iseenesest.',
  'help.guide.place-files.step.4': 'Igal real on faili nimi ja suurus. Klõpsa real, et fail avada.',
  'help.guide.place-files.result': 'Fail on koha juures, kaardil loendatud, ja see on ka reisi vahekaardil Failid.',
  'help.guide.place-files.tip.1':
    'Failid loetleb ka selle peatuse broneeringuga seotud failid, nii et hotelli kinnitus on näha hotelli juures.',
  'help.guide.place-files.tip.2': 'Laadi üles võtab korraga vastu mitu faili.',
  'help.guide.place-files.tip.3':
    'Kui sul pole õigust faile üles laadida, pole ka nuppu Laadi üles; kohal juba olevad failid on siiski alles.',
  // place-navigation
  'help.guide.place-navigation.title': 'Ava koht kaardirakenduses või selle veebisaidil',
  'help.guide.place-navigation.goal': 'Anna koht üle rakendusele, mis sind tegelikult sinna viib.',
  'help.guide.place-navigation.step.1': 'Ava koht ja klõpsa allosas asuval real nuppu Navigeerimine.',
  'help.guide.place-navigation.step.2':
    'Loendis on sellele kohale sobivad kaardirakendused: Google Maps, Waze, Apple Maps, OpenStreetMap ja CoMaps.',
  'help.guide.place-navigation.step.3':
    'Klõpsa sellel, mida kasutad. Võimaluse korral annab TREK sellele üle koha enda, mitte ainult koordinaadipaari, nii et jõuad õige sissepääsu juurde.',
  'help.guide.place-navigation.step.4':
    'Selle kõrval olev Ava veebisait avab koha enda lehe koos lahtiolekuaegade ja piletitega uuel vahelehel.',
  'help.guide.place-navigation.result':
    'Kaardirakendus avaneb koha peal, veebisait omaette vahelehel ja reisis ei muutu midagi.',
  'help.guide.place-navigation.tip.1':
    'Waze alustab navigeerimist kohe. Teised avavad koha ja sealt alustamiseks kulub veel üks puudutus.',
  'help.guide.place-navigation.tip.2':
    'Pakutavad rakendused sõltuvad kohast ja seadmest: Androidis Apple Mapsi ei pakuta, 高德地图 ilmub ainult Hiinas asuva koha puhul ning Waze, Apple Maps ja CoMaps vajavad koha koordinaate.',
  'help.guide.place-navigation.tip.3':
    'Kui sobib ainult üks rakendus, on nupul selle rakenduse nimi ja see avab rakenduse kohe.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Salvesta koht mõnda oma nimekirja',
  'help.guide.place-to-collection.goal': 'Hoia sellel reisil leitud koht järgmiseks reisiks alles.',
  'help.guide.place-to-collection.step.1': 'Ava koht ja klõpsa kaardi allosas nuppu Salvesta kogumikku.',
  'help.guide.place-to-collection.step.2':
    'Salvesta nimekirja näitab kõiki nimekirju, mis kuuluvad sulle või mida sinuga jagatakse. Linnuke märgib need, kus see koht juba on.',
  'help.guide.place-to-collection.step.3': 'Klõpsa nimekirjal. Koht on kohe selles.',
  'help.guide.place-to-collection.step.4': 'Klõpsa Sulge ja kaardil oleval nupul on kirjas Salvestatud.',
  'help.guide.place-to-collection.result':
    'Koht on sinu nimekirjas koos pildi, märkmete ja aadressiga, valmis järgmiseks reisiks.',
  'help.guide.place-to-collection.tip.1':
    'Nupp on olemas ainult siis, kui lisamoodul Kogumikud on sisse lülitatud; administraator lülitab selle sisse jaotises Lisamoodulid.',
  'help.guide.place-to-collection.tip.2':
    'Koht võib olla korraga mitmes nimekirjas ja igas oma olekuga: ühes idee, teises külastatud.',
  'help.guide.place-to-collection.tip.3':
    'Valijas koha nime kõrval olev Märgi külastatuks märgib koha nimekirjas tehtuks; kui koht on mitmes sinu nimekirjas, on nupul kirjas Kõikjal külastatud ja see märgib kõik korraga.',
  // place-track
  'help.guide.place-track.title': 'Vaata raja andmeid ja anna sellele oma värv',
  'help.guide.place-track.goal': 'Vaata, kui pikk imporditud matk on, ja erista selle joont kaardil teistest.',
  'help.guide.place-track.step.1':
    'Raja real kohtade veerus on lühike kriips selles värvis, millega raja joon on joonistatud. Klõpsa real.',
  'help.guide.place-track.step.2': 'Raja statistika näitab teekonna pikkust sinu valitud ühikutes.',
  'help.guide.place-track.step.3':
    'Selle kohal olev Raja värv näitab kasutusel olevat värvi. Klõpsa real, et avada värvivalik.',
  'help.guide.place-track.step.4': 'Vali värv. Joon kaardil ja kriips real muutuvad koos sellega.',
  'help.guide.place-track.step.5':
    'Vasakpoolne katkendjoonega ruut, Automaatne värv, annab rajale tagasi päritud värvi; paremal olev pipett avab muu värvi valimiseks süsteemi värvivalija.',
  'help.guide.place-track.result':
    'Rada on joonistatud sinu valitud värviga: kohakaardil, oma real kohtade veerus ja kaardil.',
  'help.guide.place-track.tip.1':
    'Need kaks plokki on ainult kohal, millel on teekond, see tähendab GPX-, KML- või KMZ-failist imporditud kohal.',
  'help.guide.place-track.tip.2':
    'Kõrgusandmetega salvestatud raja puhul on näha ka kõrgeim ja madalaim punkt, tõusu- ja laskumismeetrid ning matka profiil.',
  'help.guide.place-track.tip.3':
    'Import annab igale imporditud rajale oma värvi, nii et kaks matka ei saabu kunagi sama värviga.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Päeva üksikasjad',
  'help.ctx.trip-day-detail.summary':
    'Paneel, mille päeva päis avab kaardi kohale: päev tervikuna, selle nimi ja kuupäev, ilm seal, kus sa oled, sellele päevale langevad broneeringud ja selleks broneeritud ööd.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klõpsa päevade veerus päeva päisel ja paneel avaneb kaardi keskel. Uus klõps samal päisel või paremal olev X sulgeb paneeli ja tühistab päeva valiku.',
  'help.ctx.trip-day-detail.bullet.2':
    'Päises on päeva nimi ja kuupäev. Nime kõrval olev pliiats nimetab päeva ümber, topeltnool ahendab paneeli kitsaks ribaks, nii et kaart on jälle vaba.',
  'help.ctx.trip-day-detail.bullet.3':
    'Üleval on päeva ilm. Prognoosi juures on nimetatud koht, mille kohta see käib: päeva esimene peatus või hotell, kus sa ärkad.',
  'help.ctx.trip-day-detail.bullet.4':
    'Broneeringud loetleb selle päeva broneeringud, igaühe juures tüüp, peatus, millega see on seotud, ja kellaajad. Roheline tähendab kinnitatud, merevaigukollane veel ootel; see on ainult ülevaade, broneeringuid muudetakse vahekaardil Broneeringud.',
  'help.ctx.trip-day-detail.bullet.5':
    'Majutus näitab kõiki sellele päevale broneeritud öid: vastavatel päevadel sildid Sisseregistreerimine ja Väljaregistreerimine, sisseregistreerimise ajavahemik, väljaregistreerimise aeg ja kinnitusnumber.',
  'help.ctx.trip-day-detail.bullet.6':
    'Lisa majutus broneerib sellele päevale öö: vali majutuskoht reisi kohtade hulgast, määra, milliseid päevi see hõlmab, ning lisa kellaajad ja kood.',
  // day-panel
  'help.guide.day-panel.title': 'Ava päev ja vaata selle üksikasju',
  'help.guide.day-panel.goal':
    'Näe ühte päeva tervikuna, selle ilma, broneeringuid ja ööbimiskohta, ilma kaardilt lahkumata.',
  'help.guide.day-panel.step.1':
    'Klõpsa päevade veerus päeva päisel. Päev valitakse ja selle üksikasjad avanevad kaardi keskel.',
  'help.guide.day-panel.step.2': 'Päises on päeva nimi, enne nime andmist Päev 1, ja selle all kuupäev.',
  'help.guide.day-panel.step.3':
    'Üleval on päeva ilm. Prognoosi juures on öeldud, millise koha kohta see käib: päeva esimene peatus või hotell, kus sa ärkad.',
  'help.guide.day-panel.step.4':
    'Selle all olev Broneeringud loetleb sellele päevale langevad broneeringud koos kellaaegadega.',
  'help.guide.day-panel.step.5':
    'Majutus näitab sellele päevale broneeritud öid ning vastavatel päevadel silte Sisseregistreerimine ja Väljaregistreerimine.',
  'help.guide.day-panel.step.6':
    'Päises olev topeltnool ahendab paneeli kitsaks ribaks. Selle kõrval olev X sulgeb paneeli ja tühistab päeva valiku.',
  'help.guide.day-panel.result':
    'Ribaks ahendatud paneel jätab kaardi vabaks ja päev jääb valituks; suletud paneeli korral tühistatakse päeva valik ja plaan on selline, nagu see oli.',
  'help.guide.day-panel.tip.1':
    'Paneeli ahendab ka klõps ükskõik kuhu selle päiseribal. Nool on lihtsalt selle jaoks mõeldud nupp.',
  'help.guide.day-panel.tip.2':
    'Kui avad koha kohtade veerust, kuvatakse paneelis päeva asemel koha üksikasjad. Sulge need ja päev tuleb tagasi.',
  // day-weather
  'help.guide.day-weather.title': 'Vaata päeva ilma',
  'help.guide.day-weather.goal': 'Tea, milline tuleb päev seal, kus sa sel päeval tegelikult oled.',
  'help.guide.day-weather.step.1':
    'Prognoosi juures on nimetatud koht, mille kohta numbrid käivad: päeva esimene peatus või, kui päeval peatust pole, hotell, kus sa ärkad.',
  'help.guide.day-weather.step.2':
    'Suur number on päeva temperatuur, selle kõrval madalaim ja kõrgeim ning ilm sõnadega.',
  'help.guide.day-weather.step.3':
    'Selle all olevad kiibid: vihmatõenäosus, sademete hulk, tugevaim tuul ning päikesetõus ja -loojang.',
  'help.guide.day-weather.step.4':
    'All on päev tunni kaupa, iga teine tund: kellaaeg, ikoon, temperatuur ja vihmatõenäosus. Tund, mille vihmatõenäosus on üle 50 protsendi, on sinisega varjutatud.',
  'help.guide.day-weather.result':
    'Päeva kaardil päevade veerus on sama ilm väikeselt numbri all, nii et kogu reisi saab ühe pilguga üle vaadata.',
  'help.guide.day-weather.tip.1':
    'Kraadid ja tuul järgivad seadet Temperatuuriühik menüüs Seaded jaotises Üldine: vali °F Fahrenheit ja sama prognoos kuvatakse ühikutes °F ja mph.',
  'help.guide.day-weather.tip.2':
    'Päeval, millel pole asukohaga peatust ega hotelli, kus ärgata, ilma üldse ei näidata: prognoos on alati koha, mitte kunagi reisi kohta.',
  'help.guide.day-weather.tip.3':
    'Rohkem kui 16 päeva ette prognoosi ei saa. Siis on numbrid selle kuupäeva varasemate aastate keskmised, märgitud sümboliga Ø ja see on all ka kirjas.',
  // rename-day
  'help.guide.rename-day.title': 'Anna päevale nimi',
  'help.guide.rename-day.goal':
    'Nimeta päev selle järgi, mis see on, näiteks Saabumine Kyotosse või Puhkepäev, mitte Päev 5.',
  'help.guide.rename-day.step.1': 'Ava päev. Selle päises on kirjas Päev 5 ja all kuupäev.',
  'help.guide.rename-day.step.2': 'Klõpsa nime kõrval olevat pliiatsit.',
  'help.guide.rename-day.step.3': 'Nimi muutub väljaks. Sisesta soovitud nimi.',
  'help.guide.rename-day.step.4':
    'Vajuta Enter või klõpsa lihtsalt mujale; Escape tühistab muudatuse. Nimi on ka päeva kaardil päevade veerus.',
  'help.guide.rename-day.result':
    'Nimi asendab teksti Päev 5 paneelis ja päeva kaardil päevade veerus; kuupäev jääb oma kohale.',
  'help.guide.rename-day.tip.1':
    'Tühjenda väli ja salvesta ning päev on jälle Päev 5: kui nime pole, näidatakse numbrit.',
  'help.guide.rename-day.tip.2':
    'Nimi kuulub päevale, mitte kuupäevale. Kui muudad päevade järjekorda, liigub see koos kõige muuga sellel päeval.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Broneeri päevale öö',
  'help.guide.add-accommodation.goal':
    'Lisa hotell plaani üks kord, koos päevadega, mida see hõlmab, kellaaegade ja kinnitusnumbriga.',
  'help.guide.add-accommodation.step.1':
    'Majutuskoht peab kõigepealt olema reisi koht. Loo see kohtade veerus nagu iga teine koht: valija pakub ainult seda, mis seal juba on.',
  'help.guide.add-accommodation.step.2': 'Ava saabumispäev ja klõpsa jaotises Majutus nuppu Lisa majutus.',
  'help.guide.add-accommodation.step.3':
    'Rakenda päevadele määrab, milliseid öid peatumine hõlmab: vasakul sisseregistreerimise päev, paremal väljaregistreerimise päev. Kõik hõlmab kogu reisi.',
  'help.guide.add-accommodation.step.4':
    'Täida väljad Sisseregistreerimine, Kuni ja Väljaregistreerimine ning sisesta broneeringu number välja Kinnitus. Kõik neli võivad jääda tühjaks.',
  'help.guide.add-accommodation.step.5':
    'Vali majutuskoht reisi kohtade hulgast. Loendi kohal olevad kiibid kitsendavad selle ühele kategooriale.',
  'help.guide.add-accommodation.step.6': 'Klõpsa Salvesta.',
  'help.guide.add-accommodation.result':
    'Peatumine on näha igal päeval, mida see hõlmab, esimesel päeval Sisseregistreerimine ja viimasel Väljaregistreerimine. Majutuskohast saab sisseregistreerimise päeval peatus, nii et kaart joonistab tee sinna, ja vahekaardile Broneeringud ilmub hotellibroneering.',
  'help.guide.add-accommodation.tip.1':
    'Valija avaneb päevaga, kust sa tulid, ja väljaregistreerimine on järgmisel päeval; mõlemat saab enne salvestamist muuta.',
  'help.guide.add-accommodation.tip.2':
    'Anna hotellile loomisel kategooria Hotell ja loendi kohal olevad kiibid kitsendavad selle ühe klõpsuga sinu hotellideni.',
  'help.guide.add-accommodation.tip.3':
    'Kõik kellaajad on valikulised: ilma sisseregistreerimisaja ja koodita peatumine hõlmab ikkagi oma öid ja joonistab ikkagi oma marsruudi.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Muuda või tühista broneeritud öö',
  'help.guide.edit-accommodation.goal': 'Nihuta peatumist, paranda selle kellaaegu või eemalda see plaanist.',
  'help.guide.edit-accommodation.step.1':
    'Peatumise igal päeval näitab kaart majutuskohta, sisseregistreerimise ajavahemikku, väljaregistreerimise aega ja kinnitusnumbrit.',
  'help.guide.edit-accommodation.step.2':
    'Paremal olev pliiats avab peatumise uuesti. Hüpikaknas on nüüd kirjas Muuda majutust.',
  'help.guide.edit-accommodation.step.3':
    'Paranda väljade rida: Sisseregistreerimine, Kuni, Väljaregistreerimine ja Kinnitus. Siin saab muuta ka selle kohal olevaid päevi ja all olevat majutuskohta.',
  'help.guide.edit-accommodation.step.4': 'Klõpsa Salvesta.',
  'help.guide.edit-accommodation.step.5':
    'Pliiatsi kõrval olev X lõpetab peatumise. See ei küsi midagi ja kaob ka sellega seotud hotellibroneering.',
  'help.guide.edit-accommodation.result':
    'Muudatus jõuab korraga igale päevale, mida peatumine hõlmab, ja koos sellega ka hotellibroneeringuni vahekaardil Broneeringud.',
  'help.guide.edit-accommodation.tip.1':
    'Peatumise keskel oleval ööl pole silti Sisseregistreerimine ega Väljaregistreerimine: need on ainult vahemiku esimesel ja viimasel päeval.',
  'help.guide.edit-accommodation.tip.2':
    'Peatumise tühistamine eemaldab ka peatuse, mille see sisseregistreerimise päevale lisas, ja kõik selle broneeringuga seotud kulud. Kui see oli viga, broneeri öö uuesti.',
  // day-bookings
  'help.guide.day-bookings.title': 'Päeva broneeringud ühe pilguga',
  'help.guide.day-bookings.goal':
    'Vaata ühest kohast, mis on sellele päevale juba broneeritud ja kas see on kinnitatud.',
  'help.guide.day-bookings.step.1':
    'Broneeringud loetleb päeva broneeringud: need, mille kuupäev on sellel päeval, ja need, mis on seotud mõne selle päeva peatusega.',
  'help.guide.day-bookings.step.2':
    'Real on broneeringu tüüp, nimi ja, kui see on seotud peatusega, pärast punkti see peatus. Kellaajad on rea paremas otsas.',
  'help.guide.day-bookings.step.3':
    'Värv näitab broneeringu olekut: roheline rida on kinnitatud, merevaigukollane veel ootel. Hotelle selles loendis pole, neil on all oma plokk.',
  'help.guide.day-bookings.step.4':
    'Loend ainult näitab broneeringuid. Broneeringuid luuakse ja muudetakse vahekaardil Broneeringud.',
  'help.guide.day-bookings.result':
    'Kõik, mille kuupäev on sellel päeval, ja kõik, mis on seotud mõne selle päeva peatusega, on selles ühes loendis.',
  'help.guide.day-bookings.tip.1':
    'Broneering satub päevale oma kuupäeva järgi. Muuda kuupäeva vahekaardil Broneeringud ja see liigub ise teisele päevale.',
  'help.guide.day-bookings.tip.2':
    'Kui plokki Broneeringud pole, pole päeval broneeringuid: tühja plokki ei näidata, see peidetakse.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Kaart',
  'help.ctx.trip-map.summary':
    'Plaani keskosa: iga reisi koht markerina, neid ühendavad marsruudid ja kaardi servades olevad lülitid satelliitvaate, kogu reisi korraga kuvamise ja vaadatava linnaosa ümbruse kohtade jaoks.',
  'help.ctx.trip-map.bullet.1':
    'Marker on koht: selle enda foto, kui see on olemas, muidu kategooria värv koos kategooria ikooniga. Hoia kursorit markeril ja näed kaarti koha nime ja aadressiga ning kategooria ja hinnanguga, kui kohal need on. Lohista marker päevakaardile, et koht sellele päevale planeerida.',
  'help.ctx.trip-map.bullet.2':
    'Markerid, mis on eristamiseks liiga lähestikku, koonduvad üheks tumedaks mulliks koos arvuga. Klõpsa mullil ja kaart suumib selle sisuni.',
  'help.ctx.trip-map.bullet.3':
    'Klõpsa markeril, et avada koht kaardi all koos hinnangu, failide ja järgmiste tegevustega; klõpsa kaardi tühjal alal, et valik tühistada.',
  'help.ctx.trip-map.bullet.4':
    'Kui päevade veerus on päev avatud, on selle peatustel väike valge märk nende järjekorranumbriga selles päevas, ning kahele päevale planeeritud kohal on mõlemad numbrid, ühendatud märgiga ·.',
  'help.ctx.trip-map.bullet.5':
    'Üleval olev ikoonirida otsib kaardi nähtavast osast: Restoranid, Kohvikud, Baarid ja ööelu, Majutus, Vaatamisväärsused, Muuseumid ja kultuur, Loodus ja pargid ning Tegevused. Otsi sellest piirkonnast käivitab otsingu pärast kaardi liigutamist uuesti.',
  'help.ctx.trip-map.bullet.6':
    'Paremklõpsa kaardil ükskõik kus, et avada selles punktis kohavorm, mille aadress on juba otsitud. Vasakus alanurgas olev ümmargune nupp vahetab joonistatud kaardi aerofotode vastu.',
  'help.ctx.trip-map.bullet.7':
    'Paremas alanurgas olev Näita kogu reisi joonistab kõik reisipäevad korraga ja näitab, mida iga päev hõlmab; broneeringu real olev marsruudiikoon joonistab selle broneeringu ja päevade kohal tööriistaribal olev ikoon joonistab need kõik.',
  'help.ctx.trip-map.bullet.8':
    'Kui lisamoodul Dawarich on sisse lülitatud, joonistab nupu Näita kogu reisi all olev ümmargune Dawarichi nupp teekonna, mille su telefon tegelikult salvestas: Näita salvestatud teekonda paneb selle katkendjoonena planeeritud marsruudi alla, iga päev oma värviga, ja kui joont pole, ütleb nupu silt, miks.',
  // map-markers
  'help.guide.map-markers.title': 'Loe kaarti',
  'help.guide.map-markers.goal': 'Saa aru, mida iga marker, märk ja mull kaardil sulle ütleb.',
  'help.guide.map-markers.step.1':
    'Kaardil on kõik reisi kohad. Kus markerid on eristamiseks liiga lähestikku, koonduvad need üheks tumedaks mulliks, millel on sees olevate markerite arv; klõpsa mullil ja kaart suumib selle sisuni või suurimal suumil laotab markerid lahku.',
  'help.guide.map-markers.step.2':
    'Marker on koha enda foto, kui see on olemas, muidu kategooria värv koos kategooria ikooniga. Hoia kursorit markeril ja kaart näitab koha nime ja aadressi ning kategooriat ja hinnangut, kui kohal need on.',
  'help.guide.map-markers.step.3':
    'Klõpsa markeril ja koha andmed avanevad kaardi all: koordinaadid, hinnang, failid ja allservas järgmised tegevused, nende hulgas Navigeerimine, Muuda ja Kustuta ning avatud päeva korral ka Lisa päevale. Klõpsa kaardi tühjal alal, et valik tühistada.',
  'help.guide.map-markers.step.4':
    'Ava päevade veerus päev ja selle peatused nummerdatakse: väike valge märk markeri nurgas on selle peatuse järjekoht päevas. Kahele päevale planeeritud kohal on mõlemad numbrid, ühendatud märgiga ·. Kui ükski päev pole avatud, numbreid pole ja nurgas on hoopis hinnang.',
  'help.guide.map-markers.step.5':
    'Lohista marker kaardilt päevade veerus päevakaardile ja koht planeeritakse sellele päevale, täpselt nagu siis, kui lohistad selle rea kohtade loendist.',
  'help.guide.map-markers.result':
    'Reisis pole midagi muutunud: kaart on vaid selle vaade ja iga marker ütleb, milline koht, milline päev ja mis järjekorras.',
  'help.guide.map-markers.tip.1':
    'Päevade veerus kokku volditud päev eemaldab kaardilt ka oma peatused; ava päev uuesti ja need on tagasi.',
  'help.guide.map-markers.tip.2':
    'Kohtade loendi kohal olev filter määrab ka selle, mida kaart joonistab: vali Planeerimata ja kaardile jäävad ainult kohad, millel pole veel päeva.',
  'help.guide.map-markers.tip.3':
    'Sellel kaardil pole suuminuppe: hiireratas suumib, topeltklõps suumib ühe astme võrra sisse ja kaardi lohistamine liigutab seda.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Leia kaardil ümbruskonna kohti',
  'help.guide.map-nearby-places.goal':
    'Lase kaardil otsida vaadatavast linnaosast restorane, vaatamisväärsusi või hotelli ja lisa üks neist reisile.',
  'help.guide.map-nearby-places.step.1':
    'Kaardi ülaosas olev ikoonirida on kategooriaotsing: Restoranid, Kohvikud, Baarid ja ööelu, Majutus, Vaatamisväärsused, Muuseumid ja kultuur, Loodus ja pargid ning Tegevused.',
  'help.guide.map-nearby-places.step.2':
    'Klõpsa kategoorial. TREK otsib kaardi nähtavast osast seda tüüpi kohti ja paneb iga tulemuse kohta kategooria värvi markeri. Korraga saab olla sees üks kategooria: teisel klõpsamine vahetab selle ja sisselülitatud kategoorial klõpsamine lülitab selle välja.',
  'help.guide.map-nearby-places.step.3':
    'Liiguta kaarti ja rea alla ilmub teine nupp: Otsi sellest piirkonnast teeb sama otsingu uues vaates. Ainult liigutamine ei otsi kunagi uuesti, nii püsib päringute arv väike.',
  'help.guide.map-nearby-places.step.4':
    'Markeritel on leitud koha nimi. Klõpsa ühel ja kohavorm avaneb juba selle põhjal täidetuna: Nimi, Aadress, Laiuskraad ja Pikkuskraad ning veebisait ja telefoninumber, kui OpenStreetMapis need on.',
  'help.guide.map-nearby-places.step.5':
    'Kontrolli täidetud välju ja lisa see, mida otsing teada ei saanud: Kirjeldus, Kategooria, sinu enda märkmed.',
  'help.guide.map-nearby-places.step.6':
    'Klõpsa Lisa. Kui sama nimega koht on reisis juba olemas, ütleb vorm seda ja nupule tuleb kiri Lisa siiski.',
  'help.guide.map-nearby-places.result':
    'Koht on kohtade loendis ja kaardil ühena reisi enda markeritest ning jääb jaotisse Planeerimata, kuni paned selle mõnele päevale. Otsingu markerid jäävad alles, kuni lülitad kategooria välja.',
  'help.guide.map-nearby-places.tip.1':
    'Rida kaob, kui seade Avasta kaardil kohti on menüüs Seaded jaotises Reisimine ja kaart välja lülitatud.',
  'help.guide.map-nearby-places.tip.2':
    'Vastused tulevad TREK Placesi indeksist ja OpenStreetMapist, seega on see üks väheseid asju plaanis, mis vajab ühendust.',
  'help.guide.map-nearby-places.tip.3':
    'Otsing hõlmab seda, mis on ekraanil, nii et suumi sisse tänavani, mille kohta küsid: terve linna puhul saad esimesed kuuskümmend tulemust ilma erilise järjestuseta.',
  // map-add-place
  'help.guide.map-add-place.title': 'Loo koht kaardil paremklõpsuga',
  'help.guide.map-add-place.goal': 'Pane koht täpselt sinna, kuhu soovid, ilma seda enne otsimata.',
  'help.guide.map-add-place.step.1':
    'Paremklõpsa kaardil soovitud kohal. Avaneb kohavorm pealkirjaga Lisa koht või tegevus.',
  'help.guide.map-add-place.step.2':
    'Laiuskraad ja Pikkuskraad on juba selle punkti omad ning TREK otsib koordinaatide järgi ja täidab leitu põhjal välja Aadress ning ka Nimi, kui otsing selle annab. Midagi pole veel salvestatud, nii et kirjuta vale üle.',
  'help.guide.map-add-place.step.3':
    'Anna sellele Nimi, mille ära tunned, ja kõik muu, mida plaan peaks teadma: Kirjeldus, Märkmed, Kategooria, Veebisait.',
  'help.guide.map-add-place.step.4':
    'Klõpsa Lisa. Koht lisatakse loendisse planeerimatana ka siis, kui mõni päev on avatud: paremklõps kaardil ütleb, kus, mitte millal.',
  'help.guide.map-add-place.result':
    'Koht on loendis ja kaardil ning jaotises Planeerimata, kuni paned selle mõnele päevale.',
  'help.guide.map-add-place.tip.1':
    'Aadress tuleb koordinaatide järgi tehtud otsingust, nii et see võib olla pigem tänav kui nimi ja asustamata alal võib see jääda tühjaks. Mõlemat välja võid ise üle kirjutada.',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL ja Mapbox GL kaartidel teeb sama keskklõps ja puuteekraanil pikk vajutus.',
  // map-satellite
  'help.guide.map-satellite.title': 'Lülitu satelliitvaatele',
  'help.guide.map-satellite.goal': 'Vaheta joonistatud kaart aerofotode vastu ja tagasi.',
  'help.guide.map-satellite.step.1':
    'Kaardi vasakus alanurgas olev ümmargune nupp on aluskihi lüliti. Selle ikoon näitab alati kihti, millele see lülitaks, ja kursori hoidmisel on öeldud, milline: Lülitu satelliidivaatele. Klõpsa sellel.',
  'help.guide.map-satellite.step.2':
    'Kaart koosneb nüüd aerofotodest, piisavalt detailsetest, et eristada üksikut hoonet, ja ilma sinu enda võtmeta. Kõik, mida TREK joonistab, jääb selle peale: markerid, päeva marsruut, rajad ja broneeringute marsruudid.',
  'help.guide.map-satellite.step.3':
    'Nupul on nüüd kirjas Lülitu kaardivaatele. Klõpsa sellel, et naasta joonistatud kaardile.',
  'help.guide.map-satellite.result': 'Kaart on jälle joonistatud ja viimati valitud kiht jäetakse sinu kontole meelde.',
  'help.guide.map-satellite.tip.1':
    'Valik salvestatakse sinu kontole, mitte reisile, nii et iga reis avaneb nii, nagu selle jätsid, olenemata sellest, millist kaardimootorit kasutad.',
  'help.guide.map-satellite.tip.2':
    'Aerofotodel pole kirju: tänavanimed, linnaosad ja majanumbrid on joonistatud kaardil, nii et aadressi otsides lülitu tagasi.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Vaata kogu reisi ja selle vahemaid',
  'help.guide.map-whole-trip.goal':
    'Vaheta üks avatud päev reisi kõigi reisipäevade vastu ja vaata, kui pika maa iga päev läbib.',
  'help.guide.map-whole-trip.step.1':
    'Ümmargune nupp Näita kogu reisi asub kaardi paremas alanurgas. Klõpsa sellel ja kõik reisi reisipäevad joonistatakse korraga, igaüks oma värviga valge ääristuse peal, nii et naaberpäevad jäävad eristatavaks.',
  'help.guide.map-whole-trip.step.2':
    'Nupu kohal olev kaart loetleb need päevad: värvitäpp, päeva nimi, ikoon iga liikumisviisi kohta ja läbitav vahemaa. Kogupikkus on üleval.',
  'help.guide.map-whole-trip.step.3':
    'Klõpsa loendis päeval, et see valida, samamoodi nagu päevade veerus: kaart näitab seda päeva ja selle peatused saavad oma numbrid tagasi.',
  'help.guide.map-whole-trip.step.4':
    'Nupul on nüüd kirjas Peida kogu reis. Vajuta seda, et naasta ühe avatud päeva juurde.',
  'help.guide.map-whole-trip.result':
    'Iga reisipäev on joonistatud oma värviga ja kaart näitab iga päeva vahemaad ning kogu reisi pikkust.',
  'help.guide.map-whole-trip.tip.1':
    'Kogusumma saabub mõne teelõigu kaupa. Kuni selle järel on …, on number veel osasumma; see jääb paika, kui kõigi teelõikude kohta on vastus saabunud.',
  'help.guide.map-whole-trip.tip.2':
    'Teelõik, mille marsruutija tagasi lükkab, jääb sirgjooneks ega lähe arvesse ning kaart ütleb seda, selle asemel et vaikselt liiga väikest arvu näidata.',
  'help.guide.map-whole-trip.tip.3':
    'Päeval, millel on vähem kui kaks asukohaga peatust, pole marsruuti, mida joonistada, nii et see jäetakse loendist täielikult välja.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Näita broneeringu marsruuti kaardil',
  'help.guide.map-booking-routes.goal':
    'Joonista broneeritud lennud, rongisõidud ja autosõidud kaardile ning eemalda need sealt uuesti.',
  'help.guide.map-booking-routes.step.1':
    'Broneeringute marsruudid on välja lülitatud, kuni sa mõnda neist ei küsi. Broneeringu real päevade veerus on väike marsruudiikoon: Näita broneeringute marsruute.',
  'help.guide.map-booking-routes.step.2':
    'Klõpsa sellel ja broneering ilmub kaardile: lend suurringi kaarena, autosõit mööda tegelikke teid, rong oma jaamade ahelana. Kinnitatud joonistatakse pideva joonega, ootel katkendjoonega ning marsruudi otstes on sinised sildid transpordi ikooniga.',
  'help.guide.map-booking-routes.step.3':
    'Klõpsa otsas oleval sildil ja avaneb selle taga olev broneering koos kellaaegade, viitenumbri ja lähtekohaga. Sulge paneb selle jälle ära.',
  'help.guide.map-booking-routes.step.4':
    'Päevade kohal tööriistaribal olev marsruudiikoon teeb seda kogu reisi jaoks korraga: Näita kõiki broneeringute marsruute joonistab iga broneeringu, millel on marsruut.',
  'help.guide.map-booking-routes.step.5':
    'See alustab puhtalt lehelt, mitte ei lisa kihti peale, nii et see, mille valisid broneeringu kaupa, tühistatakse. Vajuta seda uuesti, nüüd on sellel kirjas Peida kõik broneeringute marsruudid, ja kaart on puhas.',
  'help.guide.map-booking-routes.result':
    'Soovitud broneeringud on kaardile joonistatud ja valik jääb selle reisi jaoks selles brauseris meelde, kuni seda muudad.',
  'help.guide.map-booking-routes.tip.1':
    'Otstes on lennujaama kood või jaama nimi ainult siis, kui seade Broneeringute marsruutide sildid on menüüs Seaded jaotises Reisimine ja kaart sisse lülitatud; muidu on näha ainult ikoon.',
  'help.guide.map-booking-routes.tip.2':
    'Samades seadetes olev Näita alati broneeringute marsruute joonistab need kohe alguses igal reisil, mille kohta sa pole veel otsust teinud.',
  'help.guide.map-booking-routes.tip.3':
    'Joonistamiseks vajab broneering kaht koordinaatidega otspunkti, seega pole hotellil ega restoranil marsruudiikooni.',

  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Näita tegelikult läbitud teekonda',
  'help.guide.map-dawarich-trail.goal':
    'Kuva kaardil teekond, mille Dawarich su telefonis salvestas, katkendjoonena planeeritud teekonna kõrval, ja vaata päev päeva haaval, kuidas reis tegelikult läks.',
  'help.guide.map-dawarich-trail.step.1':
    'Ümmargune Dawarichi nupp asub kaardi paremas alanurgas nupu Näita kogu reisi all; kursori hoidmisel on kirjas Näita salvestatud teekonda. Klõpsa sellel. TREK küsib sinu Dawarichilt reisi kuupäevade andmeid ja vastuse ootamise ajal keerleb nupu ümber rõngas.',
  'help.guide.map-dawarich-trail.step.2':
    'Salvestatud teekond ilmub katkendjoonena, iga päev oma värviga, planeeritud marsruudi alla, nii et plaan jääb loetavaks. Nupul on nüüd kirjas Peida salvestatud teekond. Päevad jagatakse kohaliku kesköö järgi ning päevade veerus kokku volditud päev eemaldab kaardilt koos oma peatustega ka oma katkendjoone.',
  'help.guide.map-dawarich-trail.step.3':
    'Klõpsa lisaks nupul Näita kogu reisi ja iga planeeritud päev joonistatakse pideva joonena katkendliku salvestuse kõrvale. Kus need kaks kattuvad, läks päev plaanipäraselt; kus katkendjoon kõrvale kaldub, seal mitte.',
  'help.guide.map-dawarich-trail.result':
    'Kaardil on koos see, mida planeerisid, ja see, mida tegelikult tegid, katkendjoon pideva joone kõrval, ning nuppude kohal olev kaart loetleb endiselt planeeritud päevad ja nende vahemaad.',
  'help.guide.map-dawarich-trail.tip.1':
    'Sisse- või väljalülitatud olek jäetakse selle brauseriseansi jooksul iga reisi jaoks meelde. Kuni teekond on sisse lülitatud, küsib TREK Dawarichilt iga kahe minuti järel uuesti, nii et käimasolev reis uueneb ilma lehte uuesti laadimata; teekonda ennast ei salvestata kunagi, seega pole seda TREKi andmebaasis ega varukoopiates ja see pole võrguühenduseta saadaval.',
  'help.guide.map-dawarich-trail.tip.2':
    'Nupu silt selgitab tühja kaarti: Salvestatud teekonna laadimine… laadimise ajal, Nendel kuupäevadel pole midagi salvestatud, Salvestatud teekonda ei saanud laadida või Salvestatud teekonna laadimine vajab ühendust, kui TREK on võrguühenduseta.',
  // map-compass
  'help.guide.map-compass.title': 'Pööra kaarti ja leia uuesti põhjasuund',
  'help.guide.map-compass.goal': 'Pööra kaart liikumissuunas ja too see ühe klõpsuga tagasi põhja suunda.',
  'help.guide.map-compass.step.1':
    'Pööra kaarti parema hiirenupuga lohistades või hoia all Ctrl ja lohista vasaku nupuga; puuteekraanil keera kahe sõrmega. Kaardi ülaosas kategooriaikoonide rea kõrval olev ümmargune kompass pöörleb kaasa: selle nool näitab alati põhja, nii et see kaldub täpselt nii palju, kui oled kaarti pööranud.',
  'help.guide.map-compass.step.2':
    'Klõpsa kompassil. Nupp nimega Lähtesta põhjasuund pöörab kaardi sujuvalt tagasi nii, et põhi on üleval ja vaade on lame, ning nool on jälle püsti.',
  'help.guide.map-compass.result':
    'Kaardil on põhi jälle üleval ja vaade on tasane ning reisis pole midagi muutunud: kompass liigutab ainult kaamerat.',
  'help.guide.map-compass.tip.1':
    'Kompass on olemas ainult MapLibre GL ja Mapbox GL kaartidel; Leafleti kaarti ei saa pöörata, seega sellel kompassi pole. Menüü Seaded jaotises Kaart olev Kaarditeenus määrab, millist kasutad, ja Salvesta kaart salvestab valiku.',
  'help.guide.map-compass.tip.2':
    'Klõps eemaldab ka kalde: parema hiirenupuga üles või alla lohistamine kallutab vaadet ja Lähtesta põhjasuund tasandab selle koos pööramisega. Mapbox GL-is, kui 3D-hooned ja maastik on sisse lülitatud, muudab see lamedaks ka 3D-vaate, kuni seda uuesti kallutad.',
  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transport',
  'help.ctx.trip-transports.summary':
    'Kõik, mis viib sind peatuste vahel: lennud, rongid, bussid, autod, taksod, jalgrattad, kruiisid, praamid ja ühistranspordiühendused, mille TREK sinu jaoks otsib. Vahekaart on nende loend; neid saab luua ja vaadata ka plaanis ning need joonistatakse kaardile.',
  'help.ctx.trip-transports.bullet.1':
    'Vahekaardil on ainult sõidud. Majutus, restoranid, üritused ja piletid asuvad vahekaardil Broneeringud, nii et sama kirje ei ilmu kunagi kaks korda.',
  'help.ctx.trip-transports.bullet.2':
    'Tööriistaribal on kõigi arv kiibil Kõik ja igal kasutusel oleval tüübil on oma kiip koos arvuga: Lend, Rong, Auto, Ühistransport. Paremal olev Transport lisab ühe käsitsi.',
  'help.ctx.trip-transports.bullet.3':
    'Kaardid on kolmes grupis, mida saab pealkirjast kokku voltida: Automaatne ühistranspordiotsing otsingu planeeritud ühenduste jaoks, siis Ootel ja siis Kinnitatud.',
  'help.ctx.trip-transports.bullet.4':
    'Kaardil on olek, tüüp, hõlmatud päevad, kellaajad, Broneerimiskood, marsruut ning lennufirma ja lennunumber või rongi number, platvorm ja istekoht. Pliiats avab selle, prügikast kustutab selle pärast kinnitusküsimust.',
  'help.ctx.trip-transports.bullet.5':
    'Transporti saab luua ka plaanis: igal päeva päisel on plussnupp Lisa transport ja trammi nupp Ühistransport ning kahe peatuse vahel olev sõiduaja ühendus avab sama otsingu selle ühe teelõigu jaoks.',
  'help.ctx.trip-transports.bullet.6':
    'Mõlema otspunktiga transport joonistab kaardile joone. Päevaplaanis selle real olev marsruudiikoon lülitab joone sisse ja päevade kohal tööriistaribal olev Näita kõiki broneeringute marsruute lülitab kogu reisi korraga.',
  // transports-list
  'help.guide.transports-list.title': 'Tutvu vahekaardiga Transport',
  'help.guide.transports-list.goal': 'Saa aru, mida loend sulle ütleb, enne kui selles midagi muudad.',
  'help.guide.transports-list.step.1':
    'Transport on reisi teine vahekaart. Sellel on ainult sõidud: hotellid, restoranid, üritused ja piletid on vahekaardil Broneeringud.',
  'help.guide.transports-list.step.2':
    'Tööriistaribal on kõigi transpordikirjete arv kiibil Kõik ja igal kasutusel oleval tüübil oma kiip koos arvuga. Klõpsa kiibil, et näidata ainult seda tüüpi, ja klõpsa uuesti, et filter eemaldada. Korraga võib olla sees mitu kiipi ja Kõik tühistab need.',
  'help.guide.transports-list.step.3':
    'Automaatne ühistranspordiotsing on omaette grupp ühistranspordi otsingu planeeritud ühendustega. Ootel ja Kinnitatud sisaldavad kõike käsitsi sisestatut. Pealkirja kõrval olev nool voldib grupi kokku.',
  'help.guide.transports-list.step.4':
    'Kaardil on kõik olemas: olekutäpp koos sõnaga Ootel või Kinnitatud, tüüp, hõlmatud päevad koos kuupäevadega, kellaajad, Broneerimiskood, marsruut ning lennufirma ja lennunumber või rongi number, platvorm ja istekoht.',
  'help.guide.transports-list.step.5':
    'Pliiats avab transpordi muutmiseks, prügikast kustutab selle pärast küsimust, mis nimetab kustutatava.',
  'help.guide.transports-list.result':
    'Loend on kitsendatud selleni, mida otsisid, ja iga kaart näitab ühe pilguga, kas sõit on broneeritud.',
  'help.guide.transports-list.tip.1':
    'Kiibid ja kokku volditud grupid jäetakse iga reisi jaoks meelde, nii et vahekaart avaneb uuesti samamoodi, nagu selle jätsid.',
  'help.guide.transports-list.tip.2':
    'Impordi failist ja AirTrail ilmuvad tööriistaribale nupu Transport kõrvale ainult siis, kui server oskab lugeda broneeringukinnitusi ja kui AirTraili eksemplar on ühendatud. Ilma nendeta täidetakse loend käsitsi ja ühistranspordi otsinguga.',
  // add-transport
  'help.guide.add-transport.title': 'Lisa päevale transport',
  'help.guide.add-transport.goal': 'Lisa sõit, mis viib sind ühest peatusest järgmisesse, päevale, mil see toimub.',
  'help.guide.add-transport.step.1':
    'Igal päeva päisel on paremal neli väikest nuppu. Klõpsa plussnuppu, mille kohtspikris on kirjas Lisa transport. Vorm avaneb ja Kuupäev on juba selleks päevaks määratud.',
  'help.guide.add-transport.step.2':
    'Broneeringu tüüp määrab, millega sõidad: Lend, Rong, Buss, Auto, Takso, Jalgratas, Kruiis, Praam või Muu. Vorm kohandub vastavalt. Lennul on igal teelõigul lennujaam, rongil jaamade ahel, autol sõnastus Kättesaamine ja Tagastamine ning Peatused tee ääres.',
  'help.guide.add-transport.step.3':
    'Pealkiri on ainus kohustuslik väli; ilma selleta jääb Lisa halliks. Kirjuta see, mille jaama infotablool ära tunneksid.',
  'help.guide.add-transport.step.4':
    'Väljad Kust ja Kuhu otsivad jaama, sadamat või aadressi. Sisesta vähemalt kolm tähte ja vali loendist tulemus. Ainult sisestatud nimel pole koordinaate, nii et see ei joonista kaardile midagi.',
  'help.guide.add-transport.step.5':
    'Kuupäev ja Algusaeg näitavad, millal sõit toimub, Lõppkuupäev ja Lõpuaeg, millal see lõpeb; järgmisel päeval saabuva sõidu puhul vali sinna järgmine päev. Broneerimiskood, Olek väärtusega Ootel või Kinnitatud ning Märkmed on valikulised.',
  'help.guide.add-transport.step.6': 'Klõpsa Lisa.',
  'help.guide.add-transport.result':
    'Transport on päeval rida oma kellaaja kohal peatuste vahel ja vahekaardil Transport kaart grupis Ootel või Kinnitatud.',
  'help.guide.add-transport.tip.1':
    'Rida paigutub algusaja järgi viimase varem algava peatuse järele. Pidemest saab selle lohistada päevas mujale või teisele päevale.',
  'help.guide.add-transport.tip.2':
    'Jaotises Failid olev Lisa fail võtab vastu pileti ja jaotises Kulud olev Loo kulu salvestab broneeringu ning avab piletihinna jaoks kulude muutmise vaate.',
  'help.guide.add-transport.tip.3':
    'Reisijad märgib, kes on sellel sõidul. Niipea kui ühel transpordil on reisijad, ilmuvad vahekaardi tööriistaribale nende avatarid, mille järgi saab loendit filtreerida.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Loe lend e-piletist välja',
  'help.guide.import-transport-file.goal':
    'Lase TREKil võtta lend, rongisõit või praamisõit vedaja saadetud piletist ja kontrolli seda enne salvestamist.',
  'help.guide.import-transport-file.step.1':
    'Klõpsa vahekaardi Transport tööriistaribal nupu Transport kõrval nuppu Impordi failist. Avaneb Impordi broneeringukinnitused, sama dialoog, mis on vahekaardil Broneeringud.',
  'help.guide.import-transport-file.step.2':
    'Lohista pilet kasti või klõpsa kastil ja vali fail: EML, PDF, PKPass, HTML ja TXT, kuni viis faili, igaüks kuni 10 MB. Valitud failide nimed on kastis näha.',
  'help.guide.import-transport-file.step.3': 'Klõpsa Impordi. Dialoog sulgub kohe; lugemine toimub taustal.',
  'help.guide.import-transport-file.step.4':
    'Paremas alanurgas olev kaart näitab faili nime all töötluse käiku. Kui lugemine on valmis, asendub Failide töötlemine… linnukesega ja kaardil on nupp Impordi. Klõpsa sellel.',
  'help.guide.import-transport-file.step.5':
    'Lend avaneb vormis Lisa transport juba täidetuna: Broneeringu tüüp on Lend, lennufirma ja lennunumber on väljal Pealkiri, mõlemad lennujaamad on jaotises Marsruut koos väljadega Väljumine ja Saabumine, nende kellaaegade ja ajavöönditega, Lennufirma ja Lennu nr, Broneerimiskood ning pilet jaotises Failid. Kontrolli ja klõpsa Lisa.',
  'help.guide.import-transport-file.result':
    'Lend on vahekaardil Transport kaart grupis Ootel ja väljumispäeval rida, pilet on jaotises Failid ning kuna mõlemad lennujaamad on teada, joonistab see kaardile oma kaare.',
  'help.guide.import-transport-file.tip.1':
    'Mõlemal vahekaardil on ühine import: fail, milles on lend ja hotell, avab üksteise järel lennu vormis Lisa transport ja hotelli vormis Uus broneering, olenemata sellest, kummalt vahekaardilt alustasid.',
  'help.guide.import-transport-file.tip.2':
    'Lennujaamad paigutatakse koodi järgi. Jaam või sadam, mida lugemisel ei õnnestunud leida, on kaardil merevaigukollase nimega; vali see enne nupu Lisa klõpsamist käsitsi jaotises Marsruut, muidu transport kaardile midagi ei joonista.',
  // plan-transit
  'help.guide.plan-transit.title': 'Planeeri ühistranspordiühendus',
  'help.guide.plan-transit.goal':
    'Lase TREKil otsida päeva kahe punkti vahel tegelikke ronge ja busse ning lisa valitud ühendus plaani.',
  'help.guide.plan-transit.step.1': 'Klõpsa päeva päises trammi nuppu Ühistransport. Otsing avaneb selle päeva jaoks.',
  'help.guide.plan-transit.step.2':
    'Väljadele Kust ja Kuhu saab sisestada peatuse või jaama. Kui väli on veel tühi, pakutakse päeva enda peatusi ja reisi majutusi; kahe tähe sisestamisel otsitakse hoopis sõiduplaani jaamu. Kahe välja vahel olev Vaheta pöörab ühenduse ümber.',
  'help.guide.plan-transit.step.3':
    'Väljumine või Saabumine koos kellaajaga määrab, millal soovid sõita, ning Parim marsruut, Vähem ümberistumisi või Vähem kõndimist määrab, kuidas tulemused järjestatakse.',
  'help.guide.plan-transit.step.4':
    'Allolevad kiibid määravad, milliseid transpordiliike võib kasutada: Rong, Metroo, Tramm, Buss, Praam ja Köisraudtee. Lülita üks välja, et see välja jätta; vähemalt üks jääb sisse. Seejärel klõpsa Otsi.',
  'help.guide.plan-transit.step.5':
    'Iga tulemus näitab väljumist ja saabumist, sõidu kestust, ümberistumiste arvu ja kõnnimaad ning liine nende oma värvides. Klõpsa ühel, et see peatuste kaupa lahti voltida koos platvormide ja liinide vaheliste jalgsikäikudega.',
  'help.guide.plan-transit.step.6': 'Klõpsa Lisa päevale.',
  'help.guide.plan-transit.result':
    'Ühendus on päeval rida koos liinide, ümberistumiste ja kõndimisajaga ning vahekaardil Transport kaart grupis Automaatne ühistranspordiotsing.',
  'help.guide.plan-transit.tip.1':
    "Ühendused tulevad teenusest Transitous, mis on avalikel sõiduplaaniandmetel põhinev tasuta kogukonnateenus: võtit ega kontot pole vaja. Administraator saab otsinguks kasutada hoopis Google'it.",
  'help.guide.plan-transit.tip.2':
    'Midagi ei leitud? Andmevood katavad kindlat piirkonda ja ajavahemikku. Proovi teist kellaaega, lülita sisse rohkem transpordiliike või vali koha asemel jaam. Teates on nimetatud teenus, mis vastas.',
  'help.guide.plan-transit.tip.3':
    'Sama otsingu saab avada ühe teelõigu jaoks: klõpsa kahe peatuse vahel olevat sõiduaja ühendust ja vali Ühistransport. Kust, Kuhu ja väljumisaeg täidetakse sinu eest.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Ava ja muuda planeeritud ühendust',
  'help.guide.change-transit-route.goal': 'Vaata ühendust peatuste kaupa, nimeta see ümber või otsi marsruut uuesti.',
  'help.guide.change-transit-route.step.1':
    'Vahekaardil Transport on planeeritud ühendused grupis Automaatne ühistranspordiotsing. Klõpsa kaardil.',
  'help.guide.change-transit-route.step.2':
    'Üleval on Kestus, Ümberistumised ja Jalgsi. Nende all olev Teekond näitab ühendust peatuste kaupa koos platvormide ja liinide vaheliste jalgsikäikudega.',
  'help.guide.change-transit-route.step.3':
    'Muuda marsruuti käivitab otsingu uuesti, juba täidetuna selle ühenduse otspunktide ja päevaga.',
  'help.guide.change-transit-route.step.4':
    'Vali teine ühendus ja klõpsa Lisa päevale; see asendab vana. Nupu Muuda marsruuti kõrval olev Muuda üksikasju avab hoopis tavalise transpordivormi, kus on Broneerimiskood, Olek, reisijad ja failid.',
  'help.guide.change-transit-route.result':
    'Sõidul on nüüd uus teekond ja selle kaart vahekaardil Transport näitab uusi liine ja kellaaegu.',
  'help.guide.change-transit-route.tip.1':
    'Sõidu pealkiri on lihtsalt tekst: selle kõrval olev pliiats nimetab sõidu ümber marsruuti muutmata. All olevad Märkmed toetavad Markdowni ning neil on vahekaardid Muuda ja Eelvaade.',
  'help.guide.change-transit-route.tip.2':
    'Sõidu allosas olev Kustuta eemaldab ühenduse reisist; päeva peatused jäävad alles.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Muuda ühe teelõigu liikumisviisi',
  'help.guide.leg-travel-mode.goal':
    'Läbi üks teelõik jalgsi päeval, mil muidu sõidad autoga, või anna see teelõik ühistranspordi otsingule.',
  'help.guide.leg-travel-mode.step.1':
    'Peatuste vahelised ühendused ilmuvad alles siis, kui päeva marsruut on sisse lülitatud. Klõpsa päeval, et see avada, ja seejärel selle peatuste all nuppu Marsruut.',
  'help.guide.leg-travel-mode.step.2':
    'Iga ühendus näitab selle teelõigu sõiduaega ja vahemaad koos liikumisviisi ikooniga, mille järgi marsruut arvutati: auto autosõidu, jalg jalgsikäigu puhul.',
  'help.guide.leg-travel-mode.step.3':
    'Klõpsa ühendusel. Menüüs on valikud Autoga ja Jalgsi, Ühistransport ning Kasuta päeva vaikevalikut.',
  'help.guide.leg-travel-mode.step.4':
    'Vali Jalgsi. Muutub ainult see teelõik; ülejäänud päev jääb oma liikumisviisi juurde.',
  'help.guide.leg-travel-mode.result':
    'Teelõigul on jala ikoon ja kõndimisaeg ning päeva teised teelõigud jäävad päeva liikumisviisi juurde.',
  'help.guide.leg-travel-mode.tip.1':
    'Liikumisviis kuulub teelõigule, mitte päevale: kogu päeva nupud Autoga ja Jalgsi ei kirjuta kunagi üle käsitsi määratud teelõiku. Kasuta päeva vaikevalikut annab teelõigu neile tagasi.',
  'help.guide.leg-travel-mode.tip.2':
    'Samas menüüs olev Ühistransport avab ühenduse otsingu täpselt selle teelõigu jaoks, mõlemad otspunktid ja väljumisaeg juba täidetud.',
  'help.guide.leg-travel-mode.tip.3':
    'Ajad tulevad avalikult marsruutijalt, mis arvestab tegelikke teid ja jalgradu. Teelõik, millele see vastust ei leia, jääb sirgjooneks ja aega ei näidata.',
  // edit-transport
  'help.guide.edit-transport.title': 'Muuda või kustuta transport',
  'help.guide.edit-transport.goal': 'Paranda kellaaega, platvormi või broneerimiskoodi või eemalda sõit reisist.',
  'help.guide.edit-transport.step.1': 'Päevaplaanis on transport värviline rida peatuste vahel. Klõpsa sellel.',
  'help.guide.edit-transport.step.2':
    'See on sama vorm, millega transport loodi, ja selle tiitliribal on Muuda transporti. Muuta saab kõike: tüüpi, marsruuti, päevi ja kellaaegu, Broneerimiskoodi, Olekut.',
  'help.guide.edit-transport.step.3':
    'Lennu marsruut on lennujaamade ahel, rongi oma jaamade ahel. Lisa peatus lisab vahele veel ühe ja igal teelõigul on oma kellaajad ning oma lennu- või rongi number.',
  'help.guide.edit-transport.step.4':
    'Klõpsa Uuenda. Transpordi täielikuks eemaldamiseks kasuta vahekaardil Transport selle kaardil olevat prügikasti ja kinnita.',
  'help.guide.edit-transport.result':
    'Muudatus on näha kõikjal, kus transport ilmub: vahekaardil Transport, päeval, mil see toimub, ja selle joonel kaardil.',
  'help.guide.edit-transport.tip.1':
    'Sama vorm avaneb mõlemast kohast: pliiatsiga kaardil vahekaardil Transport ja transpordi enda realt päevaplaanis. Erandiks on planeeritud ühistranspordiühendus: selle rida avab sõiduvaate ja sealne Muuda üksikasju viib selle vormini.',
  'help.guide.edit-transport.tip.2':
    'Transpordi teisele päevale viimiseks pole vormi üldse vaja: lohista selle rida ühelt päevakaardilt teisele.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Joonista transport kaardile',
  'help.guide.transport-on-map.goal': 'Vaata, kuhu lend, autosõit või ühendus tegelikult läheb.',
  'help.guide.transport-on-map.step.1':
    'Mõlema otspunktiga transpordi real päevaplaanis on väike marsruudiikoon. Klõpsa sellel; selle sildiks saab Peida broneeringute marsruudid.',
  'help.guide.transport-on-map.step.2': 'Marsruut joonistatakse kaardile ja mõlemas otsas on transpordi ikooniga silt.',
  'help.guide.transport-on-map.step.3':
    'Klõpsa otsamarkeril, et vaadata broneeringut kaardilt lahkumata: kellaajad, lennufirma ja lennunumber, Broneerimiskood ja aadress. Sulge paneb lehe ära.',
  'help.guide.transport-on-map.step.4':
    'Päevade kohal tööriistaribal olev marsruudiikoon teeb seda kogu reisi jaoks korraga: Näita kõiki broneeringute marsruute ja nende uuesti eemaldamiseks Peida kõik broneeringute marsruudid.',
  'help.guide.transport-on-map.step.5':
    'Planeeritud ühistranspordiühendusel pole oma ikooni. See joonistatakse päeva lülitiga Marsruut, mistõttu Peida kõik broneeringute marsruudid ei eemalda seda, kuni selle päeva marsruut on veel sees.',
  'help.guide.transport-on-map.result':
    'Marsruudid on kaardil, mõlemas otsas marker, ja jäävad sinna, kuni need uuesti välja lülitad.',
  'help.guide.transport-on-map.tip.1':
    'Lend, kruiis ja praam joonistatakse kaarena, auto, buss, takso ja jalgratas järgivad tegelikke teid ning rong või planeeritud ühendus läbib jaamu, kus see peatub.',
  'help.guide.transport-on-map.tip.2':
    'Kinnitatud broneering on pidev joon, ootel broneering katkendjoon. Seade Broneeringute marsruutide sildid kirjutab otsamarkeritele lennujaama koodi või jaama nime.',
  'help.guide.transport-on-map.tip.3':
    'Näita kõiki broneeringute marsruute alustab puhtalt lehelt, mitte ei lisa kihti: see tühistab üksikute ikoonidega tehtud valikud, nii et kahe vajutuse järel on kõik sees või kõik väljas.',

  // airtrail-import
  'help.guide.airtrail-import.title': 'Impordi lennud AirTrailist',
  'help.guide.airtrail-import.goal':
    'Too AirTrailis juba olevad lennud ühe korraga reisi ja lase neil edaspidi AirTraili järgida.',
  'help.guide.airtrail-import.step.1':
    'Kui lisamoodul AirTrail on sisse lülitatud ja sinu eksemplar on ühendatud menüü Seaded jaotises Integratsioonid, on vahekaardi Transport tööriistaribal nupu Transport kõrval nupp AirTrail. Klõpsa sellel.',
  'help.guide.airtrail-import.step.2':
    'Impordi AirTrailist loetleb sinu konto lennud kahes grupis. Selle reisi ajal sisaldab reisi kuupäevadele jäävaid lende, mis on juba märgitud; Teised lennud sisaldab ülejäänuid, märkimata. Lend, mis on juba reisis, on hall ja tähistatud sõnaga Imporditud.',
  'help.guide.airtrail-import.step.3':
    'Iga rida on märkeruut koos lennufirma ja lennunumbri, kahe lennujaama ja kuupäevaga. Klõpsa real, et lend kaasata või välja jätta; grupi Teised lennud lende imporditakse ainult siis, kui need märgid.',
  'help.guide.airtrail-import.step.4':
    'Ühenduslennud, millest iga järgmine väljub ööpäeva jooksul lennujaamast, kuhu eelmine maandus, on koos raamitud. All olev märkeruut, Impordi ühe lennuna, vahemaandumisega selles lennujaamas, on juba märgitud: jäta see märgituks, et saada üks vahepeatusega broneering, või eemalda märge, et importida teelõigud eraldi lendudena.',
  'help.guide.airtrail-import.step.5':
    'Klõpsa Impordi. Nupul on märgitud lendude arv ja hiljem ütleb teade, mitu imporditi.',
  'help.guide.airtrail-import.step.6':
    'Lennud on kaardid grupis Kinnitatud, igaühel oleku kõrval sinine AirTraili märk, ja read nende toimumispäevadel. Ühendatud ühenduslend on üks kaart ja selle marsruut läbib vahemaandumise koha.',
  'help.guide.airtrail-import.result':
    'AirTraili lennud on kaardid vahekaardil Transport ja read oma päevadel ning igaühel on AirTraili märk, mis näitab, kust see pärit on.',
  'help.guide.airtrail-import.tip.1':
    'Lend, mis on reisis juba sama numbri ja kuupäevaga, jäetakse vahele ja teade ütleb, mitu jäeti vahele. Päevade kohal tööriistaribal olev Võta tagasi tühistab kogu impordi.',
  'help.guide.airtrail-import.tip.2':
    'Tõeallikaks jääb AirTrail. TREK loeb selle muudatusi reisi avamisel ja taustal iga paari minuti järel; seal kustutatud lennu kaart jääb alles ja märgile tuleb Sünkroonimata. TREKis tehtud muudatused jõuavad tagasi ainult siis, kui jaotises Integratsioonid on sisse lülitatud Kirjuta muudatused AirTraili tagasi.',
  'help.guide.airtrail-import.tip.3':
    'Ühendatud ühenduslennul pole ühte AirTraili lendu, mida järgida, seega on see ühekordne import: sinine märk jääb alles ja kursori hoidmisel märgil on see ka öeldud. Sama juhtub sünkroonitud lennuga, millele lisad käsitsi peatuse.',
  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Broneeringud',
  'help.ctx.trip-bookings.summary':
    'Vahekaart, kus on kõik reisi jaoks broneeritu, mis pole liikumisviis: majutuskohad, lauad, piletid, ekskursioonid, parkimine. Iga broneering on kaart grupis Ootel või Kinnitatud koos koodi, dokumendi, reisijate ja kuluga.',
  'help.ctx.trip-bookings.bullet.1':
    'Paremal üleval olev Käsitsi broneering avab vormi. Sellega saab luua kuut tüüpi: Majutus, Restoran, Üritus, Ekskursioon, Parkimine ja Muu; lennud, rongid ja muu selline asuvad vahekaardil Transport ega ilmu kunagi siia.',
  'help.ctx.trip-bookings.bullet.2':
    'Impordi failist annab kinnituse töötlejale: EML, PDF, PKPass, HTML või TXT, kuni viis faili, igaüks kuni 10 MB. Nupp on olemas ainult siis, kui server oskab neid lugeda.',
  'help.ctx.trip-bookings.bullet.3':
    'Pealkirja kõrval olevad kiibid filtreerivad tüübi järgi, igaüks oma arvuga, ja Kõik toob kõik tagasi. Kui mõnes broneeringus on inimesed määratud, saab kiipide kõrval oleva avatariderea abil vahekaardi ühele neist kitsendada.',
  'help.ctx.trip-bookings.bullet.4':
    'Kaardid on kahes jaotises, Ootel ja Kinnitatud, igaühel oma arv. Klõps jaotise pealkirjal voldib selle kokku ja selle reisi jaoks jäetakse meelde, kas jaotis on avatud.',
  'help.ctx.trip-bookings.bullet.5':
    'Kaardil on olekutäpp, tüüp, pealkiri, kuupäevad ja kellaajad, Broneerimiskood, Asukoht / aadress, see, millega broneering on seotud, ning selle Link, Märkmed, Failid ja Reisijad.',
  'help.ctx.trip-bookings.bullet.6':
    'Kaardil olev pliiats avab sama vormi uuesti; prügikast küsib ühe korra ja siis on broneering kadunud. Majutuse puhul kaovad koos sellega ka selle ööd päevaplaanis ja seotud kulu.',
  // create-booking
  'help.guide.create-booking.title': 'Loo broneering',
  'help.guide.create-booking.goal': 'Lisa reisile käsitsi restoran, üritus, ekskursioon, parkimiskoht või midagi muud.',
  'help.guide.create-booking.step.1':
    'Klõpsa vahekaardi paremas ülanurgas nuppu Käsitsi broneering. Avaneb Uus broneering.',
  'help.guide.create-booking.step.2':
    'Vali Broneeringu tüüp vormi ülaosas olevast loendist, välja Reisijad kõrval. Majutus, Restoran, Üritus, Ekskursioon, Parkimine ja Muu on kuus tüüpi, mida see vahekaart loob, ja vorm muutub vastavalt valikule: ainult Majutus asendab kuupäevad päevade vahemikuga.',
  'help.guide.create-booking.step.3':
    'Sisesta Pealkiri. See on ainus kohustuslik väli ja Lisa jääb passiivseks, kuni selles midagi on.',
  'help.guide.create-booking.step.4':
    'Määra Kuupäev ja Algusaeg ning, kui broneeringul on lõpp, Lõppkuupäev ja Lõpuaeg. Kalendrid pakuvad ainult reisi sisse jäävaid päevi ja kui lõpp pole pärast algust, näidatakse seda punasega ning Lisa on blokeeritud.',
  'help.guide.create-booking.step.5':
    'Sisesta kinnituselt Broneerimiskood ja määra Olek. Ootel või Kinnitatud määrab, kummasse jaotisse kaart satub.',
  'help.guide.create-booking.step.6': 'Klõpsa Lisa.',
  'help.guide.create-booking.result':
    'Broneering on oma jaotises kaart koos tüübikiibi, kuupäevade ja koodiga ning kõik teised reisil osalejad näevad selle ilmumist.',
  'help.guide.create-booking.tip.1':
    'Asukoht / aadress pakub trükkimise ajal tegelikke aadresse; ühe valimine asendab sinu kirjutatu ja ise sisestatud aadress jääb nii, nagu see on.',
  'help.guide.create-booking.tip.2':
    'Väljale Link käib broneeringu enda leht teenusepakkuja juures. Kaardil muutub see lingiks, mis avaneb uuel vahelehel.',
  'help.guide.create-booking.tip.3':
    'Märkmed toetavad Markdowni, nii et loend või paksus kirjas rida kuvatakse kaardil just nii.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Broneeri majutus',
  'help.guide.booking-hotel.goal':
    'Sisesta majutus nii, et see läheb korraga arvesse nii broneeringu kui ka öödena päevaplaanis.',
  'help.guide.booking-hotel.step.1':
    'Klõpsa Käsitsi broneering ja vali Majutus. Kuupäevaväljad kaovad ja nende asemele tuleb hotelliväljade plokk.',
  'help.guide.booking-hotel.step.2':
    'Vali hotell väljal Majutus. Loendis on reisi enda kohad ja ühe valimine kirjutab selle nime väljale Pealkiri ja aadressi väljale Asukoht / aadress.',
  'help.guide.booking-hotel.step.3':
    'Määra Alates ja Kuni: esimene öö ja hommik, mil lahkud. Mõlemad pakuvad reisi päevi koos kuupäevadega ja hoiavad teineteist õiges järjekorras.',
  'help.guide.booking-hotel.step.4':
    'Täida väljad Sisseregistreerimine, Sisseregistreerimine kuni ja Väljaregistreerimine ning kinnituselt Broneerimiskood.',
  'help.guide.booking-hotel.step.5': 'Klõpsa Lisa.',
  'help.guide.booking-hotel.result':
    'Kaardil on kuupäeva asemel päevade vahemik koos sisse- ja väljaregistreerimise aegade ning aadressiga ja sama peatumine on nüüd plaanis nendel päevadel.',
  'help.guide.booking-hotel.tip.1':
    'Majutus on ainus tüüp, millel pole välju Kuupäev ja Algusaeg. Selle kuupäevad on Alates ja Kuni ning need on reisi päevad, mitte kalender.',
  'help.guide.booking-hotel.tip.2':
    'Jäta väli Majutus tühjaks ja sisesta selle asemel aadress: koht otsitakse, luuakse ja märgitakse sinu eest kaardile.',
  'help.guide.booking-hotel.tip.3': 'Broneeringu kustutamine eemaldab koos sellega ka ööd päevaplaanist.',
  // link-booking
  'help.guide.link-booking.title': 'Seo broneering plaaniga',
  'help.guide.link-booking.goal':
    'Seo broneering peatuse ja kohaga, mille juurde see kuulub, et see oleks seal, kus sul seda vaja läheb.',
  'help.guide.link-booking.step.1': 'Klõpsa selle kaardi pliiatsit, mida soovid siduda. Avaneb Muuda broneeringut.',
  'help.guide.link-booking.step.2':
    'Ava Seo päevaplaani kirjega. Loend on sinu plaan: iga päeva kohta pealkiri ja selle all selle päeva peatused, nummerdatud ja kellaaegadega. Vali see, mille juurde broneering kuulub.',
  'help.guide.link-booking.step.3':
    'Koht / tegevus seob koha enda. Vali see seal ja Pealkiri ning Asukoht / aadress täidetakse, kui jätsid need tühjaks.',
  'help.guide.link-booking.step.4': 'Klõpsa Uuenda.',
  'help.guide.link-booking.result':
    'Kaardil on jaotises Seo päevaplaani kirjega nimetatud päev ja peatus ning broneering liigub päevaplaanis koos selle peatusega.',
  'help.guide.link-booking.tip.1':
    'Loendi ülaosas olev Seoseta (eraldiseisev) eemaldab seose uuesti. Majutusel pole peatuse valijat üldse: see seotakse oma ööde kaudu.',
  'help.guide.link-booking.tip.2':
    'Kuupäevaga päeva peatuse valimine täidab tühja välja Kuupäev sinu eest. Juba määratud kuupäeva ei muudeta.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Määra, kellele broneering on',
  'help.guide.booking-travelers.goal':
    'Märgi reisijad, keda broneering hõlmab, ja vaata seejärel ainult nende broneeringuid.',
  'help.guide.booking-travelers.step.1':
    'Ava broneering pliiatsiga. Reisijad asub vormi ülaosas, välja Broneeringu tüüp kõrval, ja näitab teksti Määra reisijad, kuni broneeringul pole kedagi.',
  'help.guide.booking-travelers.step.2':
    'Klõpsa sellel ja vali inimesed, kellele see broneering on; nimega külalised on samuti loendis. Valitud inimene saab linnukese ja tema avatar kuvatakse väljal. Klõpsa nimel uuesti, et see eemaldada.',
  'help.guide.booking-travelers.step.3': 'Klõpsa Uuenda.',
  'help.guide.booking-travelers.step.4':
    'Klõpsa üleval tööriistaribal tüübikiipide kõrval reisija avataril, et näha ainult tema broneeringuid.',
  'help.guide.booking-travelers.result':
    'Kaardil on loetletud inimesed, kellele see on, ja avatariderida kitsendab vahekaardi ühele neist.',
  'help.guide.booking-travelers.tip.1':
    'Kaardil reisijaid ainult näidatakse, neid seal ei muudeta. Need määratakse siin, vormis.',
  'help.guide.booking-travelers.tip.2':
    'Avatariderida ilmub, kui reisil on rohkem kui üks liige ja vähemalt ühes broneeringus on keegi määratud. Sinu valik kehtib selle brauseriseansi lõpuni.',
  // booking-files
  'help.guide.booking-files.title': 'Hoia vautšer broneeringu juures',
  'help.guide.booking-files.goal': 'Lisa kinnitus, pilet või pääse broneeringule, mille juurde see kuulub.',
  'help.guide.booking-files.step.1':
    'Ava broneering pliiatsiga, mine alla jaotiseni Failid ja klõpsa Lisa fail. Juba olemasoleva broneeringu puhul laaditakse dokument kohe üles ja TREK teatab Fail üles laaditud.',
  'help.guide.booking-files.step.2': 'Dokument on loendis oma nimega, selle kõrval avamisnupp ja X.',
  'help.guide.booking-files.step.3':
    'Seo olemasolev fail pakub reisi dokumente, mis pole veel selle broneeringu juures. Vali üks ja see lisatakse ilma midagi uuesti üles laadimata.',
  'help.guide.booking-files.step.4': 'Klõpsa Uuenda.',
  'help.guide.booking-files.result': 'Kaardil on dokumendid loetletud jaotises Failid ja klõps ühel neist avab selle.',
  'help.guide.booking-files.tip.1':
    'Alles loodava broneeringu puhul dokument ootab ja laaditakse üles hetkel, kui klõpsad Lisa.',
  'help.guide.booking-files.tip.2':
    'Dokumendi kõrval olev X eemaldab seose, mitte dokumendi. See jääb reisi vahekaardile Failid.',
  'help.guide.booking-files.tip.3':
    'Milliseid failitüüpe võib lisada, määrab administraatori loend; dokumendid, tekst ja pildid on vaikimisi lubatud.',
  // booking-cost
  'help.guide.booking-cost.title': 'Muuda broneeringu hind kuluks',
  'help.guide.booking-cost.goal': 'Vii broneeringu hind jaotisse Kulud ja jaga see maksjate vahel.',
  'help.guide.booking-cost.step.1':
    'Ava broneering ja mine vormi lõppu. Jaotises Kulud on Loo kulu ja Seo olemasolev kulu koos märkusega Salvestab broneeringu ja avab seejärel kulude muutmise vaate.',
  'help.guide.booking-cost.step.2':
    'Klõpsa Loo kulu. Broneering salvestatakse, selle vorm sulgub ja avaneb kulude muutmise vaade.',
  'help.guide.booking-cost.step.3':
    'Väljal Mille eest? on juba broneeringu pealkiri. Sisesta Kogusumma ning kontrolli välju Valuuta ja Päev.',
  'help.guide.booking-cost.step.4':
    'Kategooria tuleneb broneeringu tüübist. Määra Kes maksis? ja kuidas summa jagatakse.',
  'help.guide.booking-cost.step.5': 'Klõpsa Lisa kulu.',
  'help.guide.booking-cost.result':
    'Broneeringu vormis on kulu nüüd jaotises Seotud kulud koos summaga ja sama kulu on vahekaardil Kulud, seotud selle broneeringuga.',
  'help.guide.booking-cost.tip.1':
    'Kategooria järgib tüüpi: Restoranist saab Söök ja jook, Majutusest Majutus, Parkimisest Parkimine ning Üritus ja Ekskursioon lähevad mõlemad kategooriasse Muu.',
  'help.guide.booking-cost.tip.2':
    'Broneeringul võib olla mitu kulu. Seo olemasolev kulu pakub vahekaardilt Kulud neid kulusid, mis pole veel millegagi seotud. Seotud kulu juures vabastab Eemalda seos, jäta kulu alles selle ja jätab selle vahekaardile Kulud, prügikast aga eemaldab selle.',
  'help.guide.booking-cost.tip.3':
    'Kulud on vormis ainult siis, kui lisamoodul Kulud on sisse lülitatud; administraator lülitab selle jaotises Lisamoodulid.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Leia broneering',
  'help.guide.filter-bookings.goal': 'Kitsenda pikk vahekaart soovitud tüübi, inimese või olekuni.',
  'help.guide.filter-bookings.step.1':
    'Pealkirja kõrval olevad kiibid on tüübid, mida see reis tegelikult kasutab, igaüks oma arvuga. Kõik on kogu vahekaart.',
  'help.guide.filter-bookings.step.2':
    'Klõpsa kiibil, et jätta alles ainult see tüüp. Klõpsa teisel ja alles jäävad mõlemad.',
  'help.guide.filter-bookings.step.3': 'Kõik toob kõik tagasi.',
  'help.guide.filter-bookings.step.4':
    'Kiipide kõrval olevad avatarid filtreerivad reisija järgi, üks inimene või mitu korraga.',
  'help.guide.filter-bookings.step.5':
    'Ootel ja Kinnitatud on kaks jaotist, igaühel oma arv. Klõpsa pealkirjal, et jaotis kokku voltida; see on tagasi tulles ikka kokku volditud.',
  'help.guide.filter-bookings.result':
    'Vahekaart näitab ainult sinu valitut ja valik kehtib ka siis, kui selle brauseriseansi jooksul tagasi tuled.',
  'help.guide.filter-bookings.tip.1':
    'Kiibid pakuvad ainult reisil olevaid tüüpe, nii et ühegi ekskursioonita reisil pole kiipi Ekskursioon.',
  'help.guide.filter-bookings.tip.2':
    'Filter, millele midagi ei vasta, jätab vahekaardi tühjaks teatega Kohti ei leitud. Sõnastus on pärit kohtade loendist, tähendus on sama.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Loe broneering kinnitusest välja',
  'help.guide.import-booking-file.goal':
    'Lase TREKil võtta broneering teenusepakkuja saadetud kirjast või PDF-ist, selle asemel et seda uuesti sisestada.',
  'help.guide.import-booking-file.step.1':
    'Klõpsa tööriistaribal Impordi failist. Avaneb Impordi broneeringukinnitused.',
  'help.guide.import-booking-file.step.2':
    'Lohista kinnitused kasti või klõpsa kastil ja vali need: EML, PDF, PKPass, HTML ja TXT, kuni viis faili, igaüks kuni 10 MB. Valitud failide nimed on kastis näha.',
  'help.guide.import-booking-file.step.3': 'Klõpsa Impordi. Dialoog sulgub kohe, sest lugemine toimub taustal.',
  'help.guide.import-booking-file.step.4':
    'Paremas alanurgas olev kaart näitab faili nime all töötluse käiku ning jääb nähtavaks kogu rakenduses ka pärast lehe uuesti laadimist. Kui lugemine on valmis, asendub Failide töötlemine… linnukesega ja kaardil on nupp Impordi. Klõpsa sellel.',
  'help.guide.import-booking-file.step.5':
    'Iga leitud broneering avaneb üksteise järel vormis Uus broneering juba täidetuna. Hotelli puhul on see nimi väljal Pealkiri ja, kui koht on reisis olemas, väljal Majutus, selle Asukoht / aadress, Alates ja Kuni vastavatel öödel, Sisseregistreerimine ja Väljaregistreerimine, Broneerimiskood, kinnitus jaotises Failid ning, kui Kulud on sisse lülitatud, hind kui Seotud kulu. Kontrolli ja klõpsa Lisa.',
  'help.guide.import-booking-file.result':
    'Broneering on kaart grupis Ootel koos öödega, koodiga ja kinnitusega jaotises Failid, peatumine on plaanis nendel päevadel ning kui Kulud on sisse lülitatud, on hind sellega seotud kulu.',
  'help.guide.import-booking-file.tip.1':
    'Impordi failist on olemas ainult siis, kui server oskab kinnitusi lugeda, milleks on vaja kas ekstraktorit või lisamoodulit Tehisintellektiga parsimine. Administraator lülitab selle jaotises Lisamoodulid.',
  'help.guide.import-booking-file.tip.2':
    'Kui midagi ei õnnestunud lugeda, ütleb kaart seda ja pakub nuppu Proovi tehisintellektiga töötlemist, mis saadab samad failid otse mudelile. Valmis töötluse tulemust hoitakse kümme minutit; alusta ülevaatamist selle aja jooksul.',
  'help.guide.import-booking-file.tip.3':
    'Kinnitus lisatakse ainult siis, kui selle tüüp on administraatori seadetes loendis Lubatud failitüübid. PDF on seal vaikimisi; e-kiri, EML, tuleb enne lisada, muidu salvestatakse broneering ilma selleta.',
  // edit-booking
  'help.guide.edit-booking.title': 'Muuda broneeringut',
  'help.guide.edit-booking.goal':
    'Paranda kellaaega, lisa hiljem saabunud kood või vii broneering olekust Ootel olekusse Kinnitatud.',
  'help.guide.edit-booking.step.1':
    'Klõpsa kaardi päises pliiatsit. Avaneb Muuda broneeringut kõigi broneeringu andmetega.',
  'help.guide.edit-booking.step.2': 'Muuda seda, mida vaja, siin Broneerimiskoodi, mille teenusepakkuja lõpuks saatis.',
  'help.guide.edit-booking.step.3': 'Määra Olek väärtusele Kinnitatud.',
  'help.guide.edit-booking.step.4': 'Klõpsa Uuenda.',
  'help.guide.edit-booking.result':
    'Kaart liigub: kinnitatud broneering on jaotises Kinnitatud rohelise täpiga ja kõik reisil osalejad näevad seda liikumas.',
  'help.guide.edit-booking.tip.1':
    'Kui sa ei saa Broneerimiskoodi lugeda, on sisse lülitatud Hägusta broneerimiskoodid menüü Seaded jaotises Kuva. Vii kursor koodile või klõpsa sellel ja see muutub loetavaks.',
  'help.guide.edit-booking.tip.2':
    'Kui muudad tüüpi, muutub ka seotud kulu kategooria, välja arvatud juhul, kui valisid kategooria kulude muutmise vaates käsitsi.',
  'help.guide.edit-booking.tip.3': 'Ka majutust muudetakse siin: selle päevad Alates ja Kuni on samas vormis.',
  // delete-booking
  'help.guide.delete-booking.title': 'Kustuta broneering',
  'help.guide.delete-booking.goal': 'Eemalda ärajäänud broneering reisist.',
  'help.guide.delete-booking.step.1': 'Klõpsa kaardi päises prügikasti.',
  'help.guide.delete-booking.step.2':
    'Kas kustutada broneering? nimetab valitud broneeringu ja ütleb, et see kustutatakse jäädavalt.',
  'help.guide.delete-booking.step.3': 'Klõpsa Kinnita.',
  'help.guide.delete-booking.result':
    'Kaart on kadunud kõigi reisil osalejate jaoks. Broneeringu kustutamist ei saa tagasi võtta, nii et küsimus on viimane võimalus peatuda.',
  'help.guide.delete-booking.tip.1':
    'Majutusbroneeringu kustutamine eemaldab päevaplaanist ka selle ööd ning sellega seotud kulu.',
  'help.guide.delete-booking.tip.2':
    'Lisatud dokumendid jäävad reisi vahekaardile Failid; kaob ainult nende seos broneeringuga.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Nimekirjad',
  'help.ctx.trip-lists.summary':
    'Kaks nimekirja ühe reisi jaoks: pakkimisnimekiri, kus on kirjas, kes mida kaasa võtab ja mis see kaalub, ning ülesannete nimekiri kõigest, mis peab enne reisi ja selle ajal juhtuma. Vahekaart on olemas, kui lisamoodul Nimekirjad on sisse lülitatud.',
  'help.ctx.trip-lists.bullet.1':
    'Üleval olevad Pakkimisnimekiri ja Ülesanded lülitavad nende kahe vahel ja näitavad kummagi kirjete arvu; paremal olevad nupud kuuluvad parajasti avatud nimekirjale.',
  'help.ctx.trip-lists.bullet.2':
    'Pakkimisnimekiri on jagatud nimekirjadeks, näiteks Dokumendid, Riided või kuidas iganes sa neid nimetad, igaühel värvitäpp, pakitud ja kogu arvu märk ning kolm punkti, mille all on Nimeta ümber, Märgi kõik, Eemalda kõik märgistused ja Kustuta nimekiri. Ülal ribal olev Lisa nimekiri loob uue.',
  'help.ctx.trip-lists.bullet.3':
    'Rida koosneb märkeruudust ja nimest, seejärel väikestest märkidest, mis näitavad, kes eseme kaasa võtab, kogust ja kaalu grammides, koti ringist, kui Kottide haldus on sisse lülitatud, ning lõpuks prügikastist ja kolmest punktist valikutega Teisalda nimekirja, Jagamine, Nimeta ümber ja Kustuta. Mida rida ei kasuta, jääb tuhmiks, kuni sellele osutad, ja vasakul olevast pidemest saab rea nimekirja sees üles või alla lohistada.',
  'help.ctx.trip-lists.bullet.4':
    'Jagatud ja Minu nimekiri jagavad pakkimisnimekirja kaheks: ühine osa, mida kõik näevad, ja sinu oma. Kõik, Avatud ja Valmis kitsendavad parajasti avatud nimekirja ning ülal olev riba loendab pakitut.',
  'help.ctx.trip-lists.bullet.5':
    'Rakenda mall ja Salvesta mallina täidavad või salvestavad nimekirja ilma seda käsitsi sisestamata ning nende kõrval olevad kaks ikooni ekspordivad nimekirja väljatrükina, PDF-ina või failina ja impordivad nimekirja. Edenemisriba kõrval olev punane nupp näitab, mitu eset on märgitud, ja eemaldab need.',
  'help.ctx.trip-lists.bullet.6':
    'Ülesannetel on oma külgriba: edenemise kaart, filtrid Kõik, Minu ülesanded, Üle tähtaja ja Tehtud, üks rida iga nimekirja kohta ning nende all Lisa nimekiri. Ülesanded on kaardil, mille päis nimetab filtri ja hoiab sortimist, Tähtsus või Tähtaeg. Klõps ülesandel avab selle paremal paanil ja Lisa uus ülesanne avab ekraani keskel vormi Uus ülesanne.',
  // packing-categories
  'help.guide.packing-categories.title': 'Koosta pakkimisnimekiri',
  'help.guide.packing-categories.goal':
    'Jaga kaasa võetavad asjad nimekirjadesse, täida need esemetega ja määra, kes iga nimekirja eest hoolitseb.',
  'help.guide.packing-categories.step.1':
    'Klõpsa nimekirjade kohal oleval ribal nuppu Lisa nimekiri, sisesta nimi väljale Nimekirja nimi (nt Riided) ja klõpsa nuppu Lisa.',
  'help.guide.packing-categories.step.2':
    'Uues nimekirjas on alguses üks tühi rida. Klõpsa Lisa kirje, sisesta ese väljale Eseme nimi… ja vajuta Enter; väli jääb järgmise jaoks avatuks.',
  'help.guide.packing-categories.step.3':
    'Nimeta rida ümber, klõpsates selle nimel, või valikuga Nimeta ümber rea paremas otsas olevate kolme punkti all.',
  'help.guide.packing-categories.step.4':
    'Nimekirja päises olev katkendjoonega ring määrab nimekirjale reisi liikmeid. Vali nimi; ilmuv kiip eemaldab klõpsamisel selle inimese uuesti.',
  'help.guide.packing-categories.step.5':
    'Päise lõpus olevate kolme punkti all on ülejäänu: Nimeta ümber, Märgi kõik, Eemalda kõik märgistused ja Kustuta nimekiri, mis kustutab nimekirja koos kogu sisuga uuesti küsimata.',
  'help.guide.packing-categories.result':
    'Uus nimekiri on ruudustikus koos esemete ja värvitäpiga ning selle märk loendab juba pakitut.',
  'help.guide.packing-categories.tip.1':
    'Nimekiri koosneb ainult oma esemetest. Kustuta viimane ja rida muutub kohatäiteks, nii et nimekiri säilitab oma koha ja värvi; kustuta ka see rida ja nimekiri kaob.',
  'help.guide.packing-categories.tip.2':
    'Kellegi nimekirjale määramine saadab talle pakkimisteavituse. See ei muuda, kes esemeid näeb; selleks on rea kolme punkti all valik Jagamine.',
  'help.guide.packing-categories.tip.3':
    'Kahel nimekirjal võib olla sama nimi. TREK hoiab neid sisemiselt lahus, nii et nimed jäävad selliseks, nagu sa need sisestasid.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Märgi asjad pakkimise ajal tehtuks',
  'help.guide.check-off-packing.goal': 'Märgi, mis on kotis, jälgi riba ja eemalda pakitud esemed.',
  'help.guide.check-off-packing.step.1':
    'Klõpsa rea vasakus servas oleval ruudul. Nimi kriipsutatakse läbi ja riba liigub.',
  'help.guide.check-off-packing.step.2':
    'Ülal olev riba näitab pakitut võrreldes kogu nimekirjaga, arvu ja protsendina.',
  'help.guide.check-off-packing.step.3':
    'Terve nimekiri korraga: selle päises olevate kolme punkti all on Märgi kõik ja Eemalda kõik märgistused.',
  'help.guide.check-off-packing.step.4':
    'Kõik, Avatud ja Valmis kitsendavad ruudustikku. Avatud jätab alles ainult selle, mis veel puudub, nii et täielikult pakitud nimekiri kaob sealt.',
  'help.guide.check-off-packing.step.5':
    'Edenemisriba kõrval olev Eemalda 3 märgitud eset kustutab kõik märgitud esemed korraga pärast üht brauseri kinnitust.',
  'help.guide.check-off-packing.result':
    'Loendis on ainult see, mis on veel avatud, ja ülal olev riba näitab, kui kaugel pakkimisega oled.',
  'help.guide.check-off-packing.tip.1': 'Märgitud eset saab siiski ümber nimetada: klõpsa selle nimel.',
  'help.guide.check-off-packing.tip.2':
    'Märgi kõik ja Eemalda kõik märgistused töötavad korraga ühe nimekirjaga, selle nimekirja enda kolme punkti alt.',
  'help.guide.check-off-packing.tip.3':
    'Kui kõik esemed on märgitud, asendub loendur tekstiga Kõik on pakitud! ja riba muutub roheliseks.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Rakenda pakkimismall',
  'help.guide.apply-packing-template.goal':
    'Too reisile valmis nimekiri ja säilita selle reisi nimekiri järgmiseks korraks.',
  'help.guide.apply-packing-template.step.1': 'Klõpsa nimekirja kohal olevas ribas nuppu Rakenda mall.',
  'help.guide.apply-packing-template.step.2': 'Vali mall. Igal real on malli nimi ja selles olevate esemete arv.',
  'help.guide.apply-packing-template.step.3':
    'Esemed lisatakse vaatesse, kus sa parasjagu oled: Jagatud paneb need ühisesse kogusse, mida kõik näevad, Minu nimekiri teeb need sinu omaks.',
  'help.guide.apply-packing-template.step.4':
    'Säilita selle reisi nimekiri järgmiseks reisiks: Salvesta mallina avab dialoogi, sisesta nimi ja klõpsa nuppu Salvesta.',
  'help.guide.apply-packing-template.result': 'Malli nimekirjad ja esemed on nüüd reisil, olemasolevate kõrval.',
  'help.guide.apply-packing-template.tip.1':
    'Mall kannab üle ainult nimed ja nimekirjad. Kogused, kaalud, kotid ja juba tehtud linnukesed jäävad maha.',
  'help.guide.apply-packing-template.tip.2':
    'Nupp Rakenda mall on olemas alles siis, kui mõni mall on loodud. Ilma mallita nuppu üldse ei kuvata.',
  'help.guide.apply-packing-template.tip.3':
    'Nupp Salvesta mallina on nähtav ainult instantsi administraatorile ja ainult siis, kui nimekirjas on esemeid. See salvestab ühise kogu ja sinu enda esemed, mitte kunagi teise liikme privaatseid esemeid.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Kleebi sisse terve pakkimisnimekiri',
  'help.guide.import-packing-list.goal': 'Muuda mujal olemasolev nimekiri korraga pakkimisesemeteks.',
  'help.guide.import-packing-list.step.1': 'Klõpsa nimekirja kohal olevas ribas allanoolega impordinuppu.',
  'help.guide.import-packing-list.step.2':
    'Üks ese rea kohta: Kategooria, Nimi, Kaal grammides (valikuline), Kott (valikuline), checked/unchecked (valikuline). Kastis olev hall näidis näitab kõiki nelja kuju. Sobib ka Markdowni loend: pealkiri annab nimekirjale nime ning "- [ ]" ja "- [x]" muutuvad esemeteks.',
  'help.guide.import-packing-list.step.3':
    'Või laadi read failist nupuga Laadi CSV/TXT/MD. See võtab vastu .csv-, .txt- või .md-faili ja asendab kogu kasti sisu.',
  'help.guide.import-packing-list.step.4': 'Klõpsa nuppu Impordi. Nupp näitab, mitu rida see ära tundis.',
  'help.guide.import-packing-list.result':
    'Igast reast saab kirje nimekirjas, mille nimi on rea esimeses väljas, ja olemasolevat sisu ei muudeta.',
  'help.guide.import-packing-list.tip.1':
    'Välju eraldavad komad, semikoolonid ja tabulaatorid ning jutumärgid hoiavad välja koos, nii et "Särk, sinine" jääb üheks nimeks. Ühe väärtusega rida on lihtsalt nimi, ilma oma nimekirjata rida satub nimekirja Muu ja "3x" nime ees määrab koguse.',
  'help.guide.import-packing-list.tip.2':
    'Neljandas väljas nimetatud kott luuakse, kui reisil seda veel pole. See on ainus koht, kus saab kaale ja kotte hulgi laadida; mall toob ainult nimed ja nimekirjad.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Prindi või ekspordi pakkimisnimekiri',
  'help.guide.export-packing-list.goal':
    'Võta nimekiri kaasa paberil, PDF-ina või failina teise rakenduse või järgmise reisi jaoks.',
  'help.guide.export-packing-list.step.1': 'Klõpsa nimekirja kohal olevas ribas ülesnoolega ekspordinuppu.',
  'help.guide.export-packing-list.step.2':
    'Markdowni kontrollnimekiri (.md) ja CSV importimiseks (.csv) salvestavad nimekirja kohe failina.',
  'help.guide.export-packing-list.step.3':
    'Klõpsa valikut Prindi või salvesta PDF-ina. Eelvaade näitab nimekirja lehena: üleval reis ja selle kuupäevad, seejärel iga nimekiri kaardina, millel on märkeruut.',
  'help.guide.export-packing-list.step.4':
    'Klõpsa eelvaate all nuppu Prindi või salvesta PDF-ina. Brauser avab oma printimisakna: vali printer või Salvesta PDF-ina, et fail alles hoida.',
  'help.guide.export-packing-list.result':
    'Väljatrükk ja failid sisaldavad parajasti avatud vaadet, Ühine või Minu nimekiri, koos koguste, kaalude ja linnukestega.',
  'help.guide.export-packing-list.tip.1':
    'CSV on vorming, mida Impordi loeb, kotid kaasa arvatud, nii et see toimib sinu enda pakkimismallina: impordi see järgmisse reisi.',
  'help.guide.export-packing-list.tip.2':
    'Markdowni fail avaneb Obsidianis, Notionis või GitHubis kontrollnimekirjana ja tuleb nupu Impordi kaudu samamoodi tagasi.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Otsusta, kes eset näeb ja kes selle kaasa võtab',
  'help.guide.share-packing-item.goal':
    'Tõsta ese grupi ühise kogu, oma nimekirja ja nende inimeste vahel, kellele sa selle kaasa võtad.',
  'help.guide.share-packing-item.step.1':
    'Nimekirjade kohal olev Jagatud on ühine kogu, mida kõik näevad, Minu nimekiri on sinu oma ja mõlemad näitavad oma esemete arvu. Oma nimekirja vaatamiseks klõpsa Minu nimekiri.',
  'help.guide.share-packing-item.step.2':
    'Tagasi vaates Ühine ava rea lõpus olevad kolm punkti ja klõpsa valikul Jagamine.',
  'help.guide.share-packing-item.step.3':
    'Kolm taset: Jagatud, grupi ühises kogus ja kõigile nähtav; Isiklik, mida näed ainult sina; ning Jagatud kasutajatega…, kus valid inimesed, kellele ese mõeldud on.',
  'help.guide.share-packing-item.step.4': 'Isiklik ese on ainult vaates Minu nimekiri. Selle leidmiseks lülitu sinna.',
  'help.guide.share-packing-item.step.5':
    'Ava uuesti Jagamine ja märgi nimi jaotises Jagatud kasutajatega…. Ese ilmub ka selle inimese nimekirja ja reale tekib väike märk, mis loeb, kui mitme inimesega seda jagatakse.',
  'help.guide.share-packing-item.result': 'Ese on valitud tasemel ja real on näha, kes selle kaasa võtab.',
  'help.guide.share-packing-item.tip.1':
    'Eseme jagamist saab muuta ainult see, kes selle kaasa võtab. Inimene, kellega sa seda jagasid, näeb seda oma vaates Minu nimekiri sinu nimega märgituna ja saab selle ära märkida.',
  'help.guide.share-packing-item.tip.2':
    'Eseme puhul, mille võtab kaasa keegi teine, näed selle asemel kaht teist nuppu: Võin selle ka kaasa võtta, mis lisab sind tema kõrvale, ja Kopeeri minu nimekirja, mis teeb sulle privaatse koopia.',
  'help.guide.share-packing-item.tip.3':
    'Uued esemed pärivad vaate, kus need lisatakse. Vaates Minu nimekiri lisatud esemed on isiklikud, vaates Jagatud lisatud lähevad ühisesse kogusse.',
  // packing-bags
  'help.guide.packing-bags.title': 'Kaalu kotid',
  'help.guide.packing-bags.goal':
    'Määra igale esemele kaal, jaota esemed kottidesse ja hoia iga kott lennufirma piirangu piires.',
  'help.guide.packing-bags.step.1': 'Klõpsa ringi ees oleval kaalumärgil ja sisesta eseme kaal grammides.',
  'help.guide.packing-bags.step.2': 'Rea lõpus olev ring on eseme kott. Klõpsa sellel.',
  'help.guide.packing-bags.step.3':
    'Kui kotti veel pole: Lisa kott, nimi, Enter. Kott luuakse ja ese läheb otse sinna.',
  'help.guide.packing-bags.step.4':
    'Paneel Kotid ilmub paremale kohe, kui esimene kott on olemas: nimi, kaal, täituvusriba, kes seda kannab ja mitu eset selles on, seejärel Määramata ja Kogukaal.',
  'help.guide.packing-bags.step.5':
    'Klõpsa Määra piirang ja sisesta piirang kilogrammides, nagu lennufirmad seda märgivad.',
  'help.guide.packing-bags.step.6': 'Koti nime kõrval olev katkendjoonega pluss määrab, kes seda kannab.',
  'help.guide.packing-bags.result':
    'Paremal olev paneel Kotid näitab iga koti kaalu võrreldes selle piiranguga, seda, mis pole üheski kotis, ja kogukaalu.',
  'help.guide.packing-bags.tip.1':
    'Kaaluväli, koti ring ja paneel Kotid on olemas ainult siis, kui administraator on lisamooduli Nimekirjad all sisse lülitanud valiku Kottide haldus.',
  'help.guide.packing-bags.tip.2':
    'Koti kaal liidetakse serveris kokku kõigi liikmete esemetest, ka nendest, mida sa ei näe, nii et number on tõesti koti tegelik kaal.',
  'help.guide.packing-bags.tip.3':
    'Piiranguta kotti kuvatakse võrreldes kõige raskema kotiga, et ribad oleksid võrreldavad. Kui määrad sellele piirangu, näitab riba täituvust selle piirangu suhtes.',
  // create-todo
  'help.guide.create-todo.title': 'Lisa ülesanne',
  'help.guide.create-todo.goal': 'Pane kirja midagi, mis peab juhtuma, koos loendi, tähtsuse, kuupäeva ja vastutajaga.',
  'help.guide.create-todo.step.1': 'Klõpsa paremas ülanurgas nuppu Lisa uus ülesanne.',
  'help.guide.create-todo.step.2':
    'Anna sellele nimi väljal Ülesande nimi ja kirjuta kõik meelespidamist väärt väljale Kirjeldus.',
  'help.guide.create-todo.step.3':
    'Nimekiri rühmitab ülesande. Vali üks või kasuta selle kõrval olevat plussi, et väikeses dialoogis uuele nimi anda.',
  'help.guide.create-todo.step.4': 'Tähtsus koosneb neljast nupust: Puudub, P1, P2 ja P3, punasest siniseni.',
  'help.guide.create-todo.step.5': 'Tähtaeg avab kalendri ja Vastutaja määrab ülesandele inimese.',
  'help.guide.create-todo.step.6': 'Klõpsa nuppu Loo ülesanne.',
  'help.guide.create-todo.result':
    'Ülesanne on loendis koos oma märkidega: tähtsus, tähtaeg, loend ja vastutaja, ning see avaneb paremal paanil.',
  'help.guide.create-todo.tip.1': 'Kohustuslik on ainult nimi. Kõik muu saab hiljem paremal paanil täita.',
  'help.guide.create-todo.tip.2': 'Kui külgribal on loend valitud, lisatakse uus ülesanne sellesse loendisse.',
  'help.guide.create-todo.tip.3': 'Enter nimeväljal loob ülesande kohe, ilma et peaksid teisi välju puudutama.',
  // todo-filters
  'help.guide.todo-filters.title': 'Leia ja muuda ülesannet',
  'help.guide.todo-filters.goal': 'Kitsenda ülesannete loend praegu olulisele ja muuda siis leitud ülesannet.',
  'help.guide.todo-filters.step.1':
    'Külgriba jaotis Ülesanded: Kõik on kõik veel avatud ülesanded, Minu ülesanded need, mis on sinu vastutusel, Üle tähtaja need, mille kuupäev on möödas, Valmis need, mis on lõpetatud. Igaühe juures on nende arv; klõpsa Üle tähtaja.',
  'help.guide.todo-filters.step.2':
    'Jaotises Nimekirjad on iga loendi kohta üks rida. Ühe valimine näitab seda loendit koos lõpetatud ülesannetega.',
  'help.guide.todo-filters.step.3':
    'Sortimine nimekirja päises muudab ekraanil oleva järjekorda: Tähtsus paneb ette P1, Tähtaeg paneb ette lähima tähtaja. Korraga saab kasutada ainult üht neist ja teine klõps viib tagasi sinu enda järjekorra juurde.',
  'help.guide.todo-filters.step.4': 'Klõpsa ülesandel, et see paremal paanil avada.',
  'help.guide.todo-filters.step.5':
    'Muuda vajalikku, Kirjeldus, Tähtsus, Nimekiri, Tähtaeg või Vastutaja, ja klõpsa Salvesta muudatused. Paani päises olev märkeruut märgib ülesande tehtuks ja Kustuta eemaldab selle kohe.',
  'help.guide.todo-filters.result':
    'Loendis on ainult soovitud ülesanded ja paremal paanil saad valitud ülesannet muuta.',
  'help.guide.todo-filters.tip.1':
    'Loendi rida loeb ainult veel avatud ülesandeid, kuid selle valimisel on näha ka lõpetatud ülesanded. Kõik, Minu ülesanded ja Üle tähtaja peidavad lõpetatud ülesanded; Valmis näitab ainult neid.',
  'help.guide.todo-filters.tip.2':
    'Tähtsus ja Tähtaeg sortimises välistavad teineteist ning kui üks neist on sees, ei saa ridu enam lohistades oma järjekorda seada.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Kulud',
  'help.ctx.trip-costs.summary':
    'Reisi raha: kõik kulud kuupäevadega pearaamatuna, kes maksis ja kes on võlgu, selles valuutas, milles kviitung oli, ning parempoolses veerus see, kes peab kellele maksma, et kõik oleks jälle tasa.',
  'help.ctx.trip-costs.bullet.1':
    'Üleval on neli kaarti: Sina võlgned ja Sulle võlgnetakse on sinu pool arveldusest, Tasumata summa on see, mis on kirja pandud, kuid millel pole veel maksjat, ning Reisi kogukulu liidab kõik kokku, selle all sinu osa ja see, mida sina maksid.',
  'help.ctx.trip-costs.bullet.2':
    'Paremas ülanurgas olev Lisa kulu avab redaktori; selle kõrval olev Arvelda registreerib korraga kõik avatud ülekanded.',
  'help.ctx.trip-costs.bullet.3':
    'Pearaamat on rühmitatud päevade kaupa, uusimad eespool, ja paremal on selle päeva kogusumma. Real on kategooria värvilise sakina, nimi, maksjate märgid, märkus ja summa ning lisaks laenasid välja või võtsid laenu, kui jaotus jätab sind plussi või miinusesse.',
  'help.ctx.trip-costs.bullet.4':
    'Loendi kohal on Otsi kulusid…, kategooriafilter, päevafilter, lüliti Kõik / Minu makstud / Mulle võlgnetakse ja nupp Ekspordi CSV.',
  'help.ctx.trip-costs.bullet.5':
    'Parempoolne veerg annab vastuse: Arvelda näitab, kes kellele maksab, Saldod iga reisija ülejääki või puudujääki, Lõplik eelarve seda, mis reis igaühele maksma läheb, ja Kategooriate kaupa seda, kuhu raha läks.',
  'help.ctx.trip-costs.bullet.6':
    'Registreeritud makse on samas pearaamatus eraldi real, kõrval Muuda ja Võta tagasi; kulul on pliiats ja prügikast ning prügikast kustutab selle küsimata.',
  // add-expense
  'help.guide.add-expense.title': 'Lisa kulu',
  'help.guide.add-expense.goal': 'Pane kirja, mis miski maksis, kes selle eest maksis ja kellega see jagatakse.',
  'help.guide.add-expense.step.1':
    'Klõpsa vahekaardi Kulud paremas ülanurgas nuppu Lisa kulu. Redaktor avaneb tänase kuupäevaga ja kõik on juba jaotusesse kaasatud.',
  'help.guide.add-expense.step.2':
    'Kirjuta väljale Mille eest?, mis on ainus kohustuslik väli, mille eest kulu oli, ja väljale Kogusumma kviitungil olev summa.',
  'help.guide.add-expense.step.3':
    'Valuuta ja Päev on summa all. Valuuta on algselt reisi oma; kui seda muudad, näitab redaktor summa väärtust reisi valuutas. Päev on algselt tänane ja selle järgi rühmitab pearaamat kulu.',
  'help.guide.add-expense.step.4':
    'Vali Kategooria. Neid on neliteist ja neid ei saa muuta: valitud kategooria on real värviline sakk ja riba jaotises Kategooriate kaupa.',
  'help.guide.add-expense.step.5':
    'Vali jaotises Kes maksis? inimene, kes tegelikult maksis. Vaikimisi on valitud Sina; Keegi pole veel maksnud paneb summa kirja, ilma et keegi selle eest võlgu jääks, ja Maksjaid oli mitu jaotab arve mitme maksja vahel.',
  'help.guide.add-expense.step.6':
    'Jaotus on algselt Võrdselt ja kõik on kaasatud ning iga nime juures on näha tema osa. Salvestamiseks klõpsa Lisa kulu.',
  'help.guide.add-expense.result':
    'Kulu on pearaamatus oma päeva all, arvestatud Reisi kogukulu hulka, ja arvelduse veerg on uuesti arvutanud, kes kellele võlgneb.',
  'help.guide.add-expense.tip.1':
    'Kui midagi ei muuda, on kulu reisi valuutas, tänase kuupäevaga ja jaotatud kõigi vahel võrdselt: tegelikult tuleb täita ainult nimi ja summa.',
  'help.guide.add-expense.tip.2':
    'Summa kõrval olev ± muudab kulu tagasimakseks. Negatiivne kogusumma annab raha tagasi, selle asemel et seda võtta, ja jaotus toimib vastupidi.',
  'help.guide.add-expense.tip.3':
    'All olev Lisa kviitung või arve võtab vastu pilte ja PDF-e. Need laaditakse üles salvestamisel, satuvad reisi Failidesse ja loendis ilmub nime kõrvale märk Kviitungid.',
  // expense-payers
  'help.guide.expense-payers.title': 'Märgi, kes arve maksis',
  'help.guide.expense-payers.goal':
    'Pane kirja, kes on kulu eest oma taskust maksnud; see on arvelduse arvutuse teine pool.',
  'help.guide.expense-payers.step.1':
    'Ava kulu selle rea kõrval oleva pliiatsiga ja vaata jaotist Kes maksis?. Vaikimisi on Maksja oli üks: rippmenüüs on see üks inimene, kes maksis.',
  'help.guide.expense-payers.step.2':
    'Keegi pole veel maksnud, selle rippmenüü esimene valik, paneb summa kirja, ilma et keegi midagi võlgneks. Kulu arvestatakse siiski Reisi kogukulu hulka.',
  'help.guide.expense-payers.step.3':
    'Maksjaid oli mitu, sildi kõrval olev link, avab iga reisija kohta rea. Kaasa need, kes maksid, ja sisesta, kui palju igaüks maksis; summad peavad kokku andma kogusumma.',
  'help.guide.expense-payers.step.4':
    'Kulu, mille eest keegi pole maksnud, märgitakse real kui Lõpetamata ja arvestatakse kaardile Tasumata summa, kuhu koguneb kirja pandud, kuid arveldamata kulutus.',
  'help.guide.expense-payers.result':
    'Maksja määrab, kes saab raha tagasi, jaotus määrab, kes maksab, ja Saldod on nende kahe vahe.',
  'help.guide.expense-payers.tip.1':
    'Kes maksis? ja Jaotus on teineteisest sõltumatud: võid maksta õhtusöögi eest, kus sa ei olnud, ja olla kaasatud sellise kulu jaotusesse, mille eest sa ei maksnud.',
  'help.guide.expense-payers.tip.2':
    'Mitme maksja korral peavad summad kokku andma kogusumma. Kui kaasad veel ühe, jaotuvad teiste summad ümber; kuni need ei klapi, näitab redaktor, milline peab summa olema, ega luba salvestada.',
  'help.guide.expense-payers.tip.3':
    'Maksja eemaldamine ei eemalda kulu: summa jääb Reisi kogukulu hulka ja rida saab oleku Lõpetamata.',
  // split-expense
  'help.guide.split-expense.title': 'Jaga arve reisijate vahel',
  'help.guide.split-expense.goal':
    'Otsusta, kes kulu eest võlgneb: kõik võrdselt, summade kaupa või kviitungi järgi rida realt.',
  'help.guide.split-expense.step.1':
    'Kulu redaktoris on jaotises Jaotus kõik reisijad. Klõpsa nimel, et jätta see inimene sellest kulust välja; välja jäetud reisija juures on kirjas Välja jäetud ja ta ei võlgne selle eest midagi.',
  'help.guide.split-expense.step.2':
    'Vaikimisi on Võrdselt: iga kaasatud reisija saab sama osa ning loendi all olev rida näitab, mitmeks osaks kulu jagatakse ja kui suur on iga osa.',
  'help.guide.split-expense.step.3':
    'Kohandatud asendab osad summaväljadega. Sisesta, kui palju iga reisija võlgneb; all olev rida arvutab kaasa ja muutub roheliseks tekstiga Jaotus vastab kogusummale. Kuni summa ei klapi, salvestada ei saa.',
  'help.guide.split-expense.step.4':
    'Tšekk jaotab kviitungi rida realt: Lisa kirje, seejärel igale reale nimi ja hind ning jaotises Jaotus: reisijad, kes selle rea jagavad.',
  'help.guide.split-expense.step.5':
    'Ridade all olev Individuaalsed osad näitab, kui palju iga reisija lõpuks võlgneb, ja üleval olev Kogusumma liidetakse ridadest. Klõpsa Salvesta.',
  'help.guide.split-expense.result':
    'Jaotusest arvutatakse kõik saldod. See salvestatakse koos kuluga ja seda saab hiljem muuta, ilma et midagi muud muutuks.',
  'help.guide.split-expense.tip.1':
    'Välja jäetud reisija juures on kirjas Välja jäetud ja ta ei võlgne selle ühe kulu eest midagi; teised võtavad oma osa.',
  'help.guide.split-expense.tip.2':
    'Võrdselt on sendi täpsusega: ülejääv sent liigub kulult kulule edasi, nii et keegi ei pea seda alati maksma.',
  'help.guide.split-expense.tip.3':
    'Tšeki režiim arvutab Kogusumma ise ja muudab välja halliks: kviitungi read moodustavadki kogusumma.',
  // expense-currency
  'help.guide.expense-currency.title': 'Sisesta kulu teises valuutas',
  'help.guide.expense-currency.goal':
    'Sisesta see, mis kviitungil tegelikult kirjas on, ja lase TREKil kurss meelde jätta.',
  'help.guide.expense-currency.step.1':
    'Ava Lisa kulu ja täida nimi ja summa täpselt nii, nagu kviitungil kirjas, just see arv, mitte selle ümberarvestus.',
  'help.guide.expense-currency.step.2':
    'Ava Valuuta ja vali kviitungi valuuta. Loendis on kõik TREKile teadaolevad koodid ja seda saab otsida: sisesta kolm tähte.',
  'help.guide.expense-currency.step.3':
    'Väljade alla ilmub rida, mis näitab summa praegust väärtust, märgisega hetkekurss. See on eelvaade, mitte salvestatav väärtus.',
  'help.guide.expense-currency.step.4':
    'Klõpsa Lisa kulu. Kurss külmutatakse kohe: edaspidi on selle kulu väärtus sama, mis see oli sisestamise päeval.',
  'help.guide.expense-currency.step.5':
    'Pearaamatus on real nime all mõlemad summad: sinu sisestatud summa, nool ja selle väärtus reisi valuutas. Kõik ülal olevad kogusummad, saldod ja arveldused kasutavad teist neist.',
  'help.guide.expense-currency.result':
    'Kulu säilitab sinu sisestatud summa ja valuuta. Pearaamat näitab mõlemat ning reisi kogusummad ja saldod jäävad reisi valuutasse.',
  'help.guide.expense-currency.tip.1':
    'Kurss külmutatakse salvestamise hetkel, nii et arveldatud võlg ei avane uuesti selle tõttu, et turg nädal hiljem liikus. Uus kurss külmutatakse ainult siis, kui muudad kulu valuutat.',
  'help.guide.expense-currency.tip.2':
    'Seadetes olev Kuvamisvaluuta muudab ainult seda, mida sa näed; salvestatud summad ei muutu kunagi. Kui see on tühi, kuvatakse iga reisi selle enda valuutas.',
  'help.guide.expense-currency.tip.3':
    'Reisi valuuta ise on määratud reisi juures, jaotises Muuda reisi, ja selle muutmiseks on vaja reisi muutmise õigust. Selle muutmine seob kõik külmutatud kursid uuesti, summasid ümber arvestamata.',
  // filter-costs
  'help.guide.filter-costs.title': 'Leia kulu või ühe päeva kulutused',
  'help.guide.filter-costs.goal': 'Kitsenda pikk pearaamat selleni, mida tegelikult otsid.',
  'help.guide.filter-costs.step.1':
    'Kirjuta loendi kohal olevale väljale Otsi kulusid… Kulude nimesid võrreldakse juba kirjutamise ajal.',
  'help.guide.filter-costs.step.2':
    'Kõik kategooriad avab neliteist kategooriat. Vali üks ja alles jäävad ainult selle kategooria kulud.',
  'help.guide.filter-costs.step.3':
    'Kõik päevad loetleb kõik päevad, mil midagi kulutati. Vali üks ja päevapäiste asemel kuvatakse riba selle päeva, selle kulude arvu ja kogusummaga.',
  'help.guide.filter-costs.step.4':
    'Lüliti Kõik / Minu makstud / Mulle võlgnetakse on sinu isiklik vaade pearaamatule: mille eest sa maksid ja mille eest sa pole veel raha tagasi saanud.',
  'help.guide.filter-costs.step.5':
    'Rea lõpus olev Ekspordi CSV kirjutab kõik kulud faili koos algse summa, selle valuuta ja ümberarvestatud summaga.',
  'help.guide.filter-costs.result':
    'Filtreid saab kombineerida ning päevarühmad kuvatakse uuesti alles jäänud kulude kogusummadega.',
  'help.guide.filter-costs.tip.1':
    'Registreeritud maksetel pole nime ega kategooriat, seega peidab otsing või kategooriafilter need. Päevafilter jätab need alles, selle päeva alla, mil makse registreeriti.',
  'help.guide.filter-costs.tip.2':
    'Ekspordi CSV ekspordib alati kõik kulud, olenemata ekraanil olevatest filtritest, iga kulu eraldi real.',
  // settle-up
  'help.guide.settle-up.title': 'Selgita välja, kes kellele võlgneb, ja arvelda',
  'help.guide.settle-up.goal':
    'Muuda hulk ühiseid kulusid võimalikult väheseks arvuks ülekanneteks, mis teevad kõik tasaseks, ja registreeri need, kui need toimuvad.',
  'help.guide.settle-up.step.1':
    'Parempoolse veeru kaart Arvelda loetleb ülekanded, mis teeksid kõik tasaseks: kes kellele maksab ja kui palju. Pealkirja kõrval olev number näitab, mitu neist on veel avatud.',
  'help.guide.settle-up.step.2':
    'Ülekande kõrval olev Arvelda märgib selle tehtuks. Ülekanne kaob kaardilt ja saldod arvutatakse uuesti.',
  'help.guide.settle-up.step.3':
    'Registreeritud ülekanne on pearaamatus rida selle päeva all, mil see toimus, märgisega Makse, kahe reisija ja summaga.',
  'help.guide.settle-up.step.4':
    'Selle rea kõrval olev pliiats parandab makset ja Võta tagasi tühistab selle, misjärel ülekanne naaseb kaardile Arvelda.',
  'help.guide.settle-up.step.5':
    'Kaardi päises olev Lisa makse registreerib ülekande, mis ei järginud soovitust. Vali Maksja ja Saaja, summa, selle valuuta ja päev, mil see toimus.',
  'help.guide.settle-up.step.6':
    'Ekraani ülaosas päises olev Arvelda registreerib korraga kõik avatud ülekanded, nagu grupp reisi lõpus arved klaarib.',
  'help.guide.settle-up.result':
    'Iga registreeritud ülekanne on rida pearaamatus ja üks rida vähem kaardil Arvelda. Kui kaardil on kirjas Kõik on tasa, on reis tasutud.',
  'help.guide.settle-up.tip.1':
    'Kaart näitab võimalikult vähe ülekandeid, mitte iga võlga: kolm inimest, kes on üksteisele ringiratast võlgu, taanduvad ühele või kahele maksele.',
  'help.guide.settle-up.tip.2':
    'Arvelda registreerib ülekande, see ei liiguta raha. Saada raha endale sobival viisil ja klõpsa siis nuppu.',
  'help.guide.settle-up.tip.3':
    'Makse võib teha mis tahes valuutas, nii et jeenivõla tasumine eurodes on tavaline: dialoogil on oma valuutavalija ja see külmutab ka selle kursi.',
  // final-budget
  'help.guide.final-budget.title': 'Vaata, mis reis igale reisijale maksma läks',
  'help.guide.final-budget.goal': 'Vaata pearaamatut inimese kaupa: tänane saldo ja tegelik kulu inimese kohta.',
  'help.guide.final-budget.step.1':
    'Saldod näitab iga reisija seisu: roheline riba paremale, kui reis on talle võlgu, punane riba vasakule, kui tema on reisile võlgu, ja summa nime kõrval.',
  'help.guide.final-budget.step.2':
    'Selle all olev Lõplik eelarve vastab teisele küsimusele: mitte kes praegu mida võlgneb, vaid mis reis igale reisijale maksma läheb, kui kõik on tagasi makstud.',
  'help.guide.final-budget.step.3':
    'Klõpsa nimel, et näha arvutust: Makstud kulud, selle all Tagasimaksete netosumma ja Ootel tagasimaksed.',
  'help.guide.final-budget.step.4':
    'Iga rea all on read, millest see koosneb: kulud, mille eest see reisija maksis, juba registreeritud ülekanded ja veel avatud ülekanded. Nende summa võrdub täpselt nende kohal oleva reaga.',
  'help.guide.final-budget.result':
    'Saldod näitab, kes on täna plussis või miinuses; Lõplik eelarve näitab, mis reis igaühele teist lõpuks maksma läheb, kui kõik on tagasi makstud.',
  'help.guide.final-budget.tip.1':
    'Makse registreerimine ei muuda kellegi lõplikku eelarvet. See ainult tõstab summa ootel tagasimaksetest tagasimaksete netosummasse.',
  'help.guide.final-budget.tip.2':
    'Maksjata kulu jääb mõlemast kaardist välja, samamoodi nagu see jääb välja arveldussoovitustest.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Muuda broneering kuluks',
  'help.guide.expense-from-booking.goal': 'Seo lennu, hotelli või koha tegelik hind kirjega, kuhu see kuulub.',
  'help.guide.expense-from-booking.step.1':
    'Ava broneering vahekaardil Transport või Broneeringud ja klõpsa selle pliiatsit.',
  'help.guide.expense-from-booking.step.2':
    'Keri vormi allosas olevasse plokki Kulud. See pakub valikut Loo kulu, mis salvestab broneeringu esmalt, ja valikut Seo olemasolev kulu sellise kulu jaoks, mis on juba vahekaardil Kulud.',
  'help.guide.expense-from-booking.step.3':
    'Klõpsa Loo kulu. Broneering salvestatakse, vorm suletakse ja avaneb kulude redaktor, kus nimeks on broneeringu pealkiri ja selle tüübile vastav kategooria on juba valitud.',
  'help.guide.expense-from-booking.step.4':
    'Täida summa ja selle valuuta, maksja ja jaotus nagu iga kulu puhul ning salvesta. Kui broneeringu uuesti avad, on kulu näha jaotises Seotud kulud, koos pliiatsiga muutmiseks, valikuga Eemalda seos, jäta kulu alles lahtisidumiseks ja prügikastiga eemaldamiseks.',
  'help.guide.expense-from-booking.result':
    'Broneeringul on nüüd oma hind ja kulu on tavaline rida vahekaardil Kulud, maksja, jaotuse ja valuutaga nagu iga teine.',
  'help.guide.expense-from-booking.tip.1':
    'Broneeringu kustutamine kustutab ka sellega seotud kulud. Broneeringu plokis Kulud olev Eemalda kulu teeb vastupidi: kulu kaob, broneering jääb alles. Eemalda seos, jäta kulu alles hoiab alles mõlemad.',
  'help.guide.expense-from-booking.tip.2': 'Koha vormis on sama plokk ja Loo kulu salvestab esmalt koha.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Failid',
  'help.ctx.trip-files.summary':
    'Kõik reisi dokumendid ühes loendis: piletid, kinnitused, pääsmed ja pildid, igaüks koos märkuse ja lingiga kohale või broneeringule, kuhu see kuulub, ning prügikastiga, kust selle saab tagasi tuua.',
  'help.ctx.trip-files.bullet.1':
    'Ülaosas olev Lohista failid siia võtab failid vastu; kastil klõpsamine avab failivalija. Selle all olev rida loetleb failitüübid, mida see TREK aktsepteerib, ja piirangu 50 MB faili kohta.',
  'help.ctx.trip-files.bullet.2':
    'Vahekaardid näitavad, mida loend kuvab: Kõik, PDF-id, Pildid ja Dokumendid, igaüks koos oma arvuga. Tärniga vahekaart lisandub kohe, kui mõnele failile on tärn lisatud, ja Ühismärkmed siis, kui mõnel märkmel on manus.',
  'help.ctx.trip-files.bullet.3':
    'Real on üleslaadija, nimi, selle all märkus, suurus ja kuupäev ning iga lingi kohta üks märk: Päevaplaan ja koht, Broneering või Transport ja broneering, Ühismärkmetest.',
  'help.ctx.trip-files.bullet.4':
    'Rea lõpus on Lisa tärn, Määra, Ava, Laadi alla ja Kustuta. Kustuta ei küsi kinnitust: fail läheb prügikasti, kust selle saab tagasi tuua.',
  'help.ctx.trip-files.bullet.5':
    'Pilt või video avaneb täisekraanil, noolenuppude ja pisipiltide ribaga; kõik muud dokumendid avanevad lehe peal eelvaates koos nuppudega Ava uuel vahekaardil ja Laadi alla. Rahakotipääse laaditakse kohe alla.',
  'help.ctx.trip-files.bullet.6':
    'Paremas otsas olev Prügikast lülitab loendi kustutatud failidele, kus iga faili saab taastada või jäädavalt kustutada ja Tühjenda prügikast eemaldab need kõik. Kui administraator on ühendanud dokumendihoidla, on selle kõrval Dokumentide sünkroonimine.',
  // files-upload
  'help.guide.files-upload.title': 'Lisa dokument reisile',
  'help.guide.files-upload.goal':
    'Too pilet, kinnitus või foto allalaadimiste kaustast reisile, kus kõik reisil osalejad pääsevad sellele ligi.',
  'help.guide.files-upload.step.1':
    'Ava reis ja klõpsa vahekaardiribal Failid. Seal on loetletud reisi dokumendid ja nende kohal on üleslaadimiskast.',
  'help.guide.files-upload.step.2':
    'Klõpsa Lohista failid siia ja vali üks või mitu faili. Need laaditakse üles üksteise järel ja selle ajal on kastis kirjas Üleslaadimine... Kasti all olev rida ütleb, milliseid tüüpe see TREK vastu võtab ja et fail võib olla kuni 50 MB.',
  'help.guide.files-upload.step.3':
    'Kohe kui viimane fail on üles laaditud, avaneb selle jaoks automaatselt Määra fail. Väli Lisa märkus... annab failile oma rea ja selle all olevad loendid seovad selle koha või broneeringuga. Sulge see ×-ga; sulgemisel ei lähe midagi kaotsi.',
  'help.guide.files-upload.step.4':
    'Uued failid on loendi alguses. Real on näha üleslaadija, nimi, suurus ja kuupäev; pildil on pisipilt, muudel failidel nende tüüp.',
  'help.guide.files-upload.result':
    'Dokumendid on reisil ning kõik, kes reisi näevad, saavad neid avada ja alla laadida.',
  'help.guide.files-upload.tip.1':
    'Faili saab ka töölaualt otse kastile lohistada; kast süttib, kui fail on selle kohal.',
  'help.guide.files-upload.tip.2':
    'Lõikelaual oleva pildi saab loendisse lisada klahvidega Ctrl+V, nii et broneeringu ekraanipilti ei pea enne salvestama.',
  'help.guide.files-upload.tip.3':
    'Üleslaadimiseks on vaja failide üleslaadimise õigust; ilma selleta kasti üldse ei ole. Tüüp, mida loendis pole, lükatakse teatega tagasi ja midagi üles ei laadita. Üle 50 MB faili lükkab kast ise tagasi, enne kui midagi saadetakse.',
  // files-link
  'help.guide.files-link.title': 'Seo dokument koha või broneeringuga',
  'help.guide.files-link.goal': 'Tee pilet leitavaks ka päevast, kuhu see kuulub, mitte ainult sellest loendist.',
  'help.guide.files-link.step.1':
    'Klõpsa rea lõpus olevat pliiatsit Määra. Avaneb Määra fail, mille pealkirjas on faili nimi.',
  'help.guide.files-link.step.2':
    'Jaotises Märkus saab väljale Lisa märkus... kirjutada ühe rea, mis kuvatakse loendis faili nime all. See salvestatakse hetkel, kui väljalt lahkud.',
  'help.guide.files-link.step.3':
    'Jaotises Koht on reisi kohad, rühmitatud päevade kaupa, ja lõpus Määramata nende jaoks, mis pole üheski päevas. Klõpsa ühel ja see saab linnukese.',
  'help.guide.files-link.step.4':
    'Jaotistes Broneering ja Transport on reisi broneeringud. Klõpsa sellel, kuhu dokument kuulub; ka see saab linnukese.',
  'help.guide.files-link.step.5': 'Sulge ×-ga. Salvestamisnuppu siin pole: iga klõps salvestati kohe.',
  'help.guide.files-link.result':
    'Real on märkus ja iga lingi kohta üks märk, Päevaplaan ja koha nimi, Transport ja lennu nimi, ning dokument on seotud ka koha ja lennuga.',
  'help.guide.files-link.tip.1':
    'Failil võib olla korraga mitu linki, nii et sama kinnitus kuulub nii hotellile kui ka ööle, mida see katab.',
  'help.guide.files-link.tip.2': 'Märgitud kirjel uuesti klõpsamine eemaldab selle lingi; fail ise jääb alles.',
  'help.guide.files-link.tip.3':
    'See toimib ka vastupidi: kohale või broneeringule lisatud dokument on samuti selles loendis, real sama märk.',
  // files-star
  'help.guide.files-star.title': 'Hoia olulised dokumendid üleval',
  'help.guide.files-star.goal':
    'Too kogu reisi jooksul kasvavast loendist esile need kaks-kolm paberit, mida sul tõesti vaja läheb.',
  'help.guide.files-star.step.1':
    'Klõpsa rea lõpus Lisa tärn. Tärn muutub kollaseks, faili nime ette ilmub teine tärn ja nupul on nüüd kirjas Eemalda tärn.',
  'help.guide.files-star.step.2':
    'Loend sorditakse uuesti: tärniga failid on kõigist teistest eespool, kummaski rühmas uusimad eespool.',
  'help.guide.files-star.step.3':
    'Üleval vahekaartide hulka on lisandunud tärn koos tärniga failide arvuga. Klõpsa sellel, et näha ainult neid.',
  'help.guide.files-star.result':
    'Paberid, mida sul leti ääres vaja läheb, on loendi alguses ja üks vahekaart näitab ainult neid.',
  'help.guide.files-star.tip.1':
    'Tärniga vahekaart on olemas ainult siis, kui millelgi on tärn. Eemalda viimaselt faililt tärn ja vahekaart kaob koos sellega.',
  'help.guide.files-star.tip.2':
    'Tärni lisamine loetakse muutmiseks: liige, kellel on reisi failidele ainult lugemisõigus, näeb tärne, kuid ei saa neid lisada.',
  // files-filter
  'help.guide.files-filter.title': 'Leia dokument loendist',
  'help.guide.files-filter.goal': 'Kitsenda kõike sisaldav loend seda tüüpi paberiteni, mida otsid.',
  'help.guide.files-filter.step.1':
    'Loendi kohal on vahekaardid Kõik, PDF-id, Pildid ja Dokumendid, igaühe järel failide arv.',
  'help.guide.files-filter.step.2': 'Klõpsa PDF-id: loendisse jäävad ainult PDF-failid.',
  'help.guide.files-filter.step.3':
    'Veel kaks vahekaarti ilmuvad ja kaovad vastavalt reisi sisule. Klõpsa Ühismärkmed, mis on olemas kohe, kui mõnel vahekaardi Koostöö märkmel on manus: loendisse jäävad ainult need failid. Samamoodi lisandub ritta tärn kohe, kui mõnele failile on tärn lisatud.',
  'help.guide.files-filter.step.4': 'Kõik toob tagasi terve loendi.',
  'help.guide.files-filter.result':
    'Loend näitab ainult seda, mida vahekaart nimetab, ja iga vahekaardi arv ütleb, kui palju neid on.',
  'help.guide.files-filter.tip.1':
    'Siin pole kaustu ega ümbernimetamist: dokumente korrastavad märkus aknas Määra fail, lingid kohtadele ja broneeringutele ning tärn.',
  'help.guide.files-filter.tip.2':
    'Loend ise on alati sorditud nii, et tärniga failid on eespool ja seejärel uusimad eespool, nii et täna üles laaditud dokument on eelmise kuu omast eespool.',
  // files-preview
  'help.guide.files-preview.title': 'Loe dokumenti TREKist lahkumata',
  'help.guide.files-preview.goal': 'Vaata piletit või pilti kohapeal ja laadi see oma seadmesse, kui seda seal vajad.',
  'help.guide.files-preview.step.1':
    'Klõpsa pildi nimel või pisipildil. See avaneb täisekraanil ning päises on faili nimi ja selle järjekorranumber piltide seas.',
  'help.guide.files-preview.step.2':
    'Külgedel olevad ümmargused nooled, vasak- ja paremnooleklahv ning all olev pisipiltide riba liiguvad läbi kõigi piltide, mida loend parasjagu näitab.',
  'help.guide.files-preview.step.3': 'Päises on Ava uuel vahekaardil ja Laadi alla; × või Escape sulgeb pildi uuesti.',
  'help.guide.files-preview.step.4':
    'Dokument, mis pole pilt, avaneb selle asemel lehe peal eelvaates, mille päises on samad kaks nuppu. See sulgub ×-ga või klõpsuga selle kõrvale.',
  'help.guide.files-preview.step.5':
    'Rea lõpus olev Laadi alla salvestab faili otse sinu seadmesse, ilma et midagi enne avataks.',
  'help.guide.files-preview.result':
    'Dokument on ekraanil ning samad kaks nuppu avavad selle brauseri vahekaardil või salvestavad kettale.',
  'help.guide.files-preview.tip.1': 'Puuteekraanil libistad pilte sõrmega, selle asemel et nooltel klõpsata.',
  'help.guide.files-preview.tip.2':
    'Rahakotipääse ei ava kunagi eelvaadet: see laaditakse kohe alla, et telefon saaks selle oma rahakotirakendusele edasi anda.',
  'help.guide.files-preview.tip.3':
    'Nii Ava uuel vahekaardil kui ka Laadi alla toovad faili sinu seansiga, nii et aadressiribalt kopeeritud link pole kellelegi teisele kasulik.',
  // files-trash
  'help.guide.files-trash.title': 'Viska dokument ära ja too see tagasi',
  'help.guide.files-trash.goal': 'Eemalda see, mida reis enam ei vaja, kaotamata midagi, mida sul siiski vaja oli.',
  'help.guide.files-trash.step.1':
    'Klõpsa rea lõpus Kustuta. Fail kaob loendist kohe ja teates on kirjas Prügikasti tõstetud. Kinnitust ei küsita.',
  'help.guide.files-trash.step.2':
    'Tööriistariba paremas otsas olev Prügikast lülitab loendi äravisatud failidele. Pealkirjas on Prügikast ja filtri vahekaardid on kadunud.',
  'help.guide.files-trash.step.3':
    'Äravisatud rida on hall ja sellel on alles kaks nuppu: Taasta, mis toob faili tagasi, ja Kustuta, mis eemaldab selle pärast kinnitust jäädavalt.',
  'help.guide.files-trash.step.4':
    'Klõpsa Taasta. Teates on kirjas Fail taastatud ja rida lahkub prügikastist, märkus ja lingid endiselt alles.',
  'help.guide.files-trash.step.5':
    'Üleval olev Tühjenda prügikast kustutab jäädavalt kõik, mis siin veel on, ja brauser küsib enne seda ühe korra kinnitust. Prügikast lülitab tagasi failidele.',
  'help.guide.files-trash.result': 'Fail on tagasi loendis oma kohal, nagu poleks midagi juhtunud.',
  'help.guide.files-trash.tip.1':
    'Rea nupp Kustuta ei küsi kinnitust ja just selleks prügikast ongi: midagi ei lahku TREKist enne, kui sa siin nii otsustad.',
  'help.guide.files-trash.tip.2':
    'Faili äraviskamiseks ja tagasitoomiseks on vaja failide kustutamise õigust. Ilma selleta ei näe liige ei rea nuppu Kustuta ega prügikasti nuppe.',
  'help.guide.files-trash.tip.3': 'Prügikastis jäädavalt kustutatud faili ei saa tagasi tuua.',

  // files-sync
  'help.guide.files-sync.title': 'Hoia dokumendid dokumendihoidlaga sünkroonis',
  'help.guide.files-sync.goal':
    'Seo reis oma dokumendihoidlaga, et siia üles laaditu jõuaks sinna ja sinna arhiveeritu ilmuks siia.',
  'help.guide.files-sync.step.1':
    'Klõpsa tööriistariba paremas otsas nupu Prügikast kõrval Dokumentide sünkroonimine. Avaneb dialoog, mille pealkirja all on reisi nimi. Vasakul jaotises Ühenda teenus on hoidlad, mille administraator on sisse lülitanud, igaühel rida selle kohta, kuidas see faile hoiab: Paperless-ngx ja Papra siltide järgi, Nextcloud ja Synology Drive kaustas, OpenCloud ruumis. Paremal on kirjas Midagi pole veel ühendatud.',
  'help.guide.files-sync.step.2':
    'Klõpsa oma hoidlal, siin Nextcloud. Avaneb väiksem ühenduse dialoog, mille pealkirjas on hoidla nimi ja mis küsib andmeid, millega see hoidla sisse logib.',
  'help.guide.files-sync.step.3':
    "Täida Aadress ja hoidla enda sisselogimisandmed: Paperless-ngx jaoks API-pääse, Papra jaoks API-võti ja Organisatsiooni ID, Nextcloudi jaoks Kasutajanimi ja Rakenduse parool, OpenCloudi jaoks Kasutajanimi ja Rakenduse pääse ning Synology Drive'i jaoks Kasutajanimi, Parool ja, kui konto seda nõuab, Kaheastmelise autentimise kood. Kasuta alati rakenduse parooli või pääset, kui hoidla seda pakub, mitte kunagi oma konto parooli. Nextcloud ja Synology Drive võtavad vastu ka valikulise Baaskausta, kust TREK reisikaustu otsib, siin /Reisen. All olev Luba iseallkirjastatud sertifikaat on mõeldud ainult sinu enda võrgus olevale hoidlale, millel on selline sertifikaat.",
  'help.guide.files-sync.step.4':
    'Klõpsa Testi ühendust. TREK võtab sisestatud andmetega hoidlaga ühendust ja jaluses on kirjas Ühendatud, sisse logitud kasutajana ning selle järel konto nimi. Tagasi lükatud kasutajaandmed või kättesaamatu aadress kuvatakse selle asemel seal ja mõlemal juhul ei salvestata midagi.',
  'help.guide.files-sync.step.5':
    'Klõpsa Ühenda. Ühendus salvestatakse reisi juurde ja TREK küsib, kus reis hoidlas asuma peaks: silt, kaust või ruum, mis selle dokumente hoiab. Sünkroonitakse ainult seal olevat. Loo uus loob selle nupuga Loo, nimi on reisi pealkirjast eeltäidetud; jaotises Või kasuta olemasolevat on need, mis on juba olemas. Klõpsa ühel, siin kaustal Sügis Jaapanis.',
  'help.guide.files-sync.step.6':
    'Dialoog on tagasi: sinu hoidla on vasakul jaotises See reis ning paremal oleval kaardil on näha, kuhu see sünkroonib, millal see viimati käivitus, ja nupp Sünkrooni kohe. Esimene sünkroonimine käivitub iseenesest; Sünkrooni kohe käivitab selle igal ajal. Kui sünkroonimine on lõppenud, asendub nime kõrval olev märk Veel sünkroonimata rohelise täpiga, millele osutades on kirjas Sünkroonis, ja vooriba loendab dokumente, mis on TREKis ja hoidlas, nende vahel rajad Salvestusteenusesse ja Salvestusteenusest. Sulge dialoog ×-ga.',
  'help.guide.files-sync.result':
    'Seal juba olnud dokumendid on loendi alguses, sinu nimel üles laaditud, ja kõik reisi dokumendid on ka hoidlas. Edaspidi kontrollib TREK hoidlat taustal ja hoidla järgib loendit.',
  'help.guide.files-sync.tip.1':
    'Reisi saab siduda ainult reisi omanik või instantsi administraator, sest kasutajaandmed annavad ligipääsu kogu selle hoidla kontole. Iga liige saab avada Dokumentide sünkroonimise, lugeda kaarti ja vajutada Sünkrooni kohe.',
  'help.guide.files-sync.tip.2':
    'Sinu enda võrgus olev hoidla vajab TREKi serveris seadet ALLOW_INTERNAL_NETWORK=true ja selle aadress peab olema masina aadress võrgus, mitte kunagi localhost. Ilma selleta vastab Testi ühendust teatega See aadress pole lubatud.',
  'help.guide.files-sync.tip.3':
    'Kaardil olev Katkesta ühendus lõpetab sidumise ja jätab kõik dokumendid mõlemale poolele alles. Teist korda seotud silti, kausta või ruumi käsitletakse uuena ja kõik selles imporditakse uuesti, nii et pärast ühenduse katkestamist seo tühi, mitte vana.',
  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Koostöö',
  'help.ctx.trip-collab.summary':
    'Vahekaart, kus grupp koos planeerib: vasakul vestlus, selle kõrval ühised märkmed ja lingid, nende all küsitlused ja lõpus Järgmisena. Kõik siia kirjutatu ilmub kohe iga teise liikme ekraanile, ilma lehte uuesti laadimata.',
  'help.ctx.trip-collab.bullet.1':
    'Vestlus on vasakpoolne veerg. Kirjuta väljale Kirjuta sõnum... ja vajuta Enter; Shift ja Enter teevad uue rea. Naerunägu lisab emotikoni, Lisa pildid lisab sõnumile kuni neli pilti.',
  'help.ctx.trip-collab.bullet.2':
    'Vii kursor sõnumile, et näha nuppu Vasta ja oma sõnumite puhul ka Kustuta; paremklõps avab kaheksa kiirreaktsiooni. Kustutatud sõnumist jääb alles üks rida, mis ütleb, et sa kustutasid selle.',
  'help.ctx.trip-collab.bullet.3':
    'Märkmed on ühine märkmik: Uus märge loob uue märkme ja selle kõrval olev hammasratas avab Halda kategooriaid, kus saab määrata kategooriate nimed ja värvid. Kaardil on Laienda, Kinnita, Muuda ja Kustuta.',
  'help.ctx.trip-collab.bullet.4':
    'Lingid koondab aadressid, millele reis tugineb. Lisa link võtab pealkirja ja http- või https-aadressi; Muuda linki, Kinnita link ja Kustuta link on märgi lõpus ning kinnitatud lingid jäävad ette.',
  'help.ctx.trip-collab.bullet.5':
    'Küsitlustega tehakse otsuseid. Uus küsitlus esitab küsimuse vähemalt kahe valikuga; valikul klõpsamine on sinu hääl, Sulge lõpetab hääletuse ja Kustuta eemaldab küsitluse.',
  'help.ctx.trip-collab.bullet.6':
    'Järgmisena loetleb reisi eelseisvad peatused, kuni kaheksa, koos nende aegade ja osalejatega. See ainult loeb päevaplaani; ajad määratakse seal.',
  // write-note
  'help.guide.write-note.title': 'Kirjuta ühine märge',
  'help.guide.write-note.goal':
    'Pane see, mida kogu grupp vajab, reegel, aadress, meeldetuletus, kohta, kust kõik selle uuesti leiavad.',
  'help.guide.write-note.step.1': 'Klõpsa paneeli Märkmed ülaosas Uus märge. Avaneb vorm.',
  'help.guide.write-note.step.2':
    'Märkme pealkiri on kaardil kuvatav nimi. See on vormis ainus kohustuslik väli: Loo jääb halliks, kuni sinna midagi kirjutatakse.',
  'help.guide.write-note.step.3':
    'Selle all olevasse suurde kasti tuleb tekst ja see toetab Markdowni: paks sõna, loend, pealkiri. Kaardil on näha esimesed read ja selle nupp Laienda avab kogu märkme.',
  'help.guide.write-note.step.4':
    'Vali jaotises Kategooria see, kuhu märge kuulub; selle värv saab kaardi värviks. Nupud on juba olemasolevad kategooriad ja uue saab luua jaotises Halda kategooriaid.',
  'help.guide.write-note.step.5':
    'Väljale Veebisait saab lisada märkmega seotud lingi. Kaardile ilmub siis lingipaan, mis selle avab.',
  'help.guide.write-note.step.6': 'Klõpsa Loo.',
  'help.guide.write-note.result':
    'Märge on kaart paneelis Märkmed, oma kategooria värvi, ja see on juba iga teise liikme ekraanil.',
  'help.guide.write-note.tip.1':
    'Kaardi nupp Kinnita hoiab selle paneeli ülaosas; kõik selle all olev on sorditud viimase muutmise aja järgi.',
  'help.guide.write-note.tip.2':
    'Nupu Uus märge kõrval olev hammasratas avab Halda kategooriaid: seal saab kategooriale värvi määrata, selle korraga kõikjal ümber nimetada või lisada enne, kui ükski märge seda kasutab.',
  'help.guide.write-note.tip.3':
    'Lisa failid lisab märkmele dokumendi. Lisa avab failivalija ning pildi või PDF-i saab ka lihtsalt vormi kleepida.',
  'help.guide.write-note.tip.4':
    'Märkmetel on oma lüliti jaotises Lisamoodulid, Koostöö all: administraator saab selle välja lülitada ning vestlus, lingid, küsitlused ja Järgmisena jäävad tööle.',
  // shared-links
  'help.guide.shared-links.title': 'Kogu reisi lingid kokku',
  'help.guide.shared-links.goal':
    'Hoia broneerimisportaal, ühine album ja sõiduplaan ühes kohas, selle asemel et neid vestlusest otsida.',
  'help.guide.shared-links.step.1': 'Klõpsa paneeli Lingid ülaosas Lisa link.',
  'help.guide.shared-links.step.2':
    'Anna lingile nimi väljal Lingi pealkiri, kleebi aadress selle all olevale väljale ja klõpsa Salvesta link.',
  'help.guide.shared-links.step.3':
    'Märgil on nimi ja sait, kuhu see viitab. Sellel klõpsamine avab lehe uuel vahekaardil.',
  'help.guide.shared-links.step.4':
    'Märgi lõpus olevad kolm väikest nuppu on Muuda linki, Kinnita link ja Kustuta link. Kinnita link tõstab märgi paneeli algusesse; Kustuta link ei küsi midagi.',
  'help.guide.shared-links.result': 'Link on märk paneelis Lingid, kinnitatuna algusesse, ja kohe iga liikme ekraanil.',
  'help.guide.shared-links.tip.1':
    'Vastu võetakse ainult http- ja https-aadresse; väli lükkab kõik muu enne salvestamist tagasi.',
  'help.guide.shared-links.tip.2':
    'Kinnitatud lingid on eespool, seejärel uusimad. Pealkirja kõrval olev väike ikoon on saidi enda favicon, mis tuuakse saidilt endalt, nii et ilma internetita näitab märk selle asemel tavalist lingiikooni.',
  'help.guide.shared-links.tip.3':
    'Linkidel on oma lüliti jaotises Lisamoodulid, Koostöö all, nii et administraator saab paneeli välja lülitada ülejäänud vahekaarti puudutamata.',
  // create-poll
  'help.guide.create-poll.title': 'Küsi grupilt',
  'help.guide.create-poll.goal':
    'Muuda küsimus, millele vestluses keegi ei vasta, küsitluseks, kus igaüks saab oma valiku märkida.',
  'help.guide.create-poll.step.1': 'Klõpsa paneeli Küsitlused ülaosas Uus küsitlus.',
  'help.guide.create-poll.step.2':
    'Kirjuta küsimus. Kasti all olev Markdowni tugi tähendab, et siin töötavad paks sõna, reavahetus või lühike loend.',
  'help.guide.create-poll.step.3': 'Täida Valik 1 ja Valik 2. Vähemalt kaks täidetud valikut on nõutud.',
  'help.guide.create-poll.step.4':
    '+ Lisa valik lisab kolmanda, neljanda, nii palju kui vaja; rea kõrval olev väike rist eemaldab selle uuesti.',
  'help.guide.create-poll.step.5':
    'Mitu valikut lubab igaühel märkida rohkem kui ühe valiku. Kui see on väljas, liigub hääl üle, kui keegi valib midagi muud.',
  'help.guide.create-poll.step.6': 'Klõpsa Loo küsitlus.',
  'help.guide.create-poll.result': 'Küsitlus on paneeli Küsitlused ülaosas, avatud, ja keegi pole veel hääletanud.',
  'help.guide.create-poll.tip.1': 'Küsimus kuvatakse Markdownina; valikud jäävad lihttekstiks.',
  'help.guide.create-poll.tip.2':
    'Loo küsitlus jääb halliks, kuni on olemas küsimus ja vähemalt kaks täidetud valikut.',
  'help.guide.create-poll.tip.3':
    'Tähtaega saab määrata ainult telefonirakenduses. Tähtajaga küsitlus näitab siin allesjäänud aega merevaiguvärvi märgil ja loetakse suletuks, kui aeg saab otsa.',
  'help.guide.create-poll.tip.4':
    'Küsitlustel on oma lüliti jaotises Lisamoodulid, Koostöö all: administraator saab selle välja lülitada ning ülejäänud neli paneeli jäävad tööle.',
  // vote-poll
  'help.guide.vote-poll.title': 'Hääleta ja vaata tulemust',
  'help.guide.vote-poll.goal': 'Anna oma hääl, vaata, kuidas grupp arvab, ja muuda vajadusel meelt.',
  'help.guide.vote-poll.step.1': 'Klõpsa soovitud valikul. Selle ring täitub ja selle taga olev riba kasvab.',
  'help.guide.vote-poll.step.2':
    'Nüüd on kogu tulemus näha: riba on osakaal, protsent on paremal ja väikesed ringid on inimesed, kes selle valiku tegid.',
  'help.guide.vote-poll.step.3':
    'Muutsid meelt? Klõpsa teisel valikul. Küsitluses, kus pole sisse lülitatud valikut Mitu valikut, liigub sinu hääl üle, selle asemel et lisanduks teine.',
  'help.guide.vote-poll.step.4':
    'Küsimuse all on näha, mitu häält küsitlusel on. Juba valitud valikul klõpsamine võtab sinu hääle tagasi ja loendur väheneb uuesti.',
  'help.guide.vote-poll.result':
    'Sinu märge on ühel valikul, ribad näitavad, kuidas grupp jagunes, ja ringid ütlevad, kes mida valis.',
  'help.guide.vote-poll.tip.1':
    'Ribad ja protsendid ilmuvad alles siis, kui oled ise hääletanud või kui küsitlus on suletud, et seis kedagi ei mõjutaks.',
  'help.guide.vote-poll.tip.2':
    'Hääl pole kunagi anonüümne: vii kursor valiku mõnele ringile, et näha selle taga olevat nime.',
  // close-poll
  'help.guide.close-poll.title': 'Sulge või eemalda küsitlus',
  'help.guide.close-poll.goal':
    'Lõpeta hääletus, kui grupp on otsustanud, ja eemalda küsitlus, mida keegi enam ei vaja.',
  'help.guide.close-poll.step.1':
    'Sulge, lukk küsitluse nurgas, lõpetab hääletuse. Valikud ei reageeri enam klõpsudele.',
  'help.guide.close-poll.step.2':
    'Suletud küsitlus vajub paneeli allossa pealkirja Suletud alla, saab märgi Suletud ja näitab kõigile tulemust, olenemata sellest, kas nad hääletasid või mitte. Võitnud valik on roheliseks toonitud.',
  'help.guide.close-poll.step.3':
    'Kustuta, prügikast samas nurgas, eemaldab küsitluse. Midagi üle ei küsita ja hääled kaovad koos sellega.',
  'help.guide.close-poll.result':
    'Küsitlus on kadunud iga liikme paneelilt. Ainult suletud küsitlus jääb koos tulemusega allosas loetavaks.',
  'help.guide.close-poll.tip.1':
    'Sulgemist ei saa tagasi võtta: uuesti avamist pole. Kogemata suletud küsitlus tuleb uuesti luua.',
  'help.guide.close-poll.tip.2': 'Kustuta eemaldab küsitluse ja kõik selle hääled kõigi jaoks, kohe ja küsimata.',
  // whats-next
  'help.guide.whats-next.title': 'Vaata paneeli Järgmisena',
  'help.guide.whats-next.goal': 'Vaata plaani avamata, mida grupp järgmisena teeb.',
  'help.guide.whats-next.step.1':
    'Paneel loetleb reisi eelseisvad peatused, kuni kaheksa, ajalises järjekorras, iga päeva jaoks oma pealkirja all: Täna, Homme või kuupäev.',
  'help.guide.whats-next.step.2':
    'Rea vasakus servas on selle aeg: algus, kuni ja lõpp, kui peatusel see on, või TBD, kui aega pole veel määratud.',
  'help.guide.whats-next.step.3':
    'Nime all olevad märgid on selle peatuse osalejad. Kui kedagi pole valitud, on loetletud kõik reisil osalejad.',
  'help.guide.whats-next.result': 'Eelseisva loend, ainult lugemiseks: see järgib plaani ja miski siin seda ei muuda.',
  'help.guide.whats-next.tip.1':
    'Siin ei määrata midagi. Ajad tulevad päevaplaanist; muuda neid seal ja see loend järgib kohe.',
  'help.guide.whats-next.tip.2':
    'Loetletakse ainult eelseisvat: peatus, mille aeg on möödas, kaob loendist ja reisi lõpus on paneel tühi.',
  'help.guide.whats-next.tip.3':
    'Järgmisena on eraldi lüliti jaotises Lisamoodulid, Koostöö all, ja see on töölauavaate paneel: telefonirakenduse vahekaardil Koostöö seda pole.',
  // trip-chat
  'help.guide.trip-chat.title': 'Räägi grupiga',
  'help.guide.trip-chat.goal': 'Ütle midagi, vasta konkreetsele sõnumile, reageeri teisele ja võta oma sõnum tagasi.',
  'help.guide.trip-chat.step.1':
    'Kirjuta väljale Kirjuta sõnum... ja vajuta Enter. Kasti kõrval olev sinine nool teeb sama; Shift ja Enter teevad selle asemel uue rea.',
  'help.guide.trip-chat.step.2':
    'Naerunägu avab emotikonivalija, milles on Smileys, Reactions ja Travel. Valitud emotikon lisatakse kirjutatavale tekstile, seda ei saadeta eraldi.',
  'help.guide.trip-chat.step.3':
    'Vii kursor kellegi teise sõnumile: selle nurka ilmub väike ümmargune nupp. See on Vasta.',
  'help.guide.trip-chat.step.4':
    'Sõnumit, millele vastad, tsiteeritakse kasti kohal. Kirjuta ja saada ning tsitaat liigub kaasa sinu sõnumimulli; tsitaadil olev rist eemaldab selle uuesti.',
  'help.guide.trip-chat.step.5':
    'Tee sõnumil paremklõps, et näha kaheksat kiirreaktsiooni. Sinu reaktsioon on mulli all ja teine klõps samal reaktsioonil võtab selle tagasi.',
  'help.guide.trip-chat.step.6':
    'Sinu enda sõnumitel on nupu Vasta kõrval Kustuta. See eemaldab sõnumi ja jätab alles ühe rea, mis ütleb, et sa kustutasid selle: tagasiteed pole.',
  'help.guide.trip-chat.result':
    'Sinu vastus on koos tsiteeritud sõnumiga vestluses, kolmandal sõnumil on reaktsioon ja tagasi võetud sõnumist jääb üks rida, mis seda ütleb.',
  'help.guide.trip-chat.tip.1':
    'Enter saadab, Shift ja Enter teevad uue rea. Ainult emotikonidest koosnev sõnum kuvatakse suurelt.',
  'help.guide.trip-chat.tip.2':
    'Lisa pildid võtab ühe sõnumi jaoks kuni neli pilti; neid saab ka lihtsalt kasti kleepida või lohistada.',
  'help.guide.trip-chat.tip.3':
    'Lingiga sõnumi alla ilmub eelvaatekaart, mille toob sinu enda TREK, nii et link millelegi, millele ainult sina ligi pääsed, jääb tavaliseks lingiks.',
  'help.guide.trip-chat.tip.4':
    'Vestlusel on oma lüliti jaotises Lisamoodulid, Koostöö all: administraator saab selle välja lülitada ning märkmed, lingid, küsitlused ja Järgmisena jäävad tööle.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Autoreis',
  'help.ctx.trip-roadtrip.summary':
    'Plaan ühe sõiduna: samad päevad ja samad kohad, ühendatud peatusteks koos nendevaheliste sõitudega, vasaku veeru ribal ja kaardil. See näitab, kui kaugele ja kui kaua, kus paak tühjaks saab ja mis tee ääres on.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Vasaku veeru ülaosas olevad Päevad ja Autoreis lülitavad päevaplaani ja sõidu vahel. Midagi ei kopeerita ega muudeta: Päevad toob plaani tagasi täpselt sellisena, nagu see oli.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Riba päises on reisi kokkuvõte: Vahemaa, Sõiduaeg ja Peatused. Selle all on iga päeva kohta üks kaart päeva enda kilomeetrite, peatuste arvu, ületatud piirangute ja märgiga Rada.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Nummerdatud peatus on koht, mille pärast päev ette võetakse. Vahepeatus, näiteks tankimine, laadimine või puhkeala, kannab numbri asemel oma tüübi ikooni ja seda ei loeta. Klõpsa numbril, et muuta peatuse liiki, ja märgil Peatumine, et määrata, kui kaua see kestab.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Kahe peatuse vahel näitab sõiduriba lõigu vahemaad ja aega. Klõpsa sellel, et avada Selle lõigu sõiduvõimalused, või klõpsa kaardile joonistatud marsruudil, et suunata lõik läbi vahepunkti.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Parem veerg muutub vaateks Marsruudil: vali päev, mida otsida ja kui lai on koridor, seejärel Otsi. Lisa paneb leitud koha sõidule täpselt sinna, kus sellest tegelikult mööda sõidetakse.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Selle all olevas jaotises Sõiduseaded on piirangud, auto ja selle sõiduulatus, igapäevased sõiduajad, mida vältida ja kuidas joon joonistatakse. Need kuuluvad reisile, nii et kõik planeerivad sama autoga.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Vaata reisi ühe sõiduna',
  'help.guide.roadtrip-mode.goal': 'Lülita plaan autoreisi režiimi ja vaata, mida riba sulle ütleb.',
  'help.guide.roadtrip-mode.step.1':
    'Klõpsa vasaku veeru ülaosas lülitis Päevad / Autoreis valikut Autoreis. Päevaplaan asendub sõiduga ja kaart joonistab iga päeva, millele on marsruut arvutatud.',
  'help.guide.roadtrip-mode.step.2': 'Riba päises on kogu reisi kokkuvõte: Vahemaa, Sõiduaeg ja Peatused.',
  'help.guide.roadtrip-mode.step.3':
    'Selle all on iga päeva kohta üks kaart. Kaardi päises on päeva number ja kuupäev, sõit vahemaa ja ajana ning see, mitu peatust päeval on.',
  'help.guide.roadtrip-mode.step.4':
    'Kaardi sees on päev ahel: iga koha kohta nummerdatud peatus, iga paari vahel sõiduriba ja paremas servas saabumisaeg.',
  'help.guide.roadtrip-mode.step.5':
    'Klõpsa päeva päisel, et see kokku voltida. Kokkuvolditud päev kaob ka kaardilt; selle tagasitoomiseks klõpsa päisel uuesti.',
  'help.guide.roadtrip-mode.result':
    'Vasak veerg on sõit ja kaart näitab selle iga päeva. Päevad lülitab otse tagasi plaanile, muutmata kujul.',
  'help.guide.roadtrip-mode.tip.1':
    'Valik jäetakse iga reisi jaoks meelde seniks, kuni brauseri vahekaart on avatud, nii et pärast uuesti laadimist näed jälle sõitu.',
  'help.guide.roadtrip-mode.tip.2':
    'Lüliti on olemas alles siis, kui administraator on halduspaneelis jaotises Lisamoodulid sisse lülitanud lisamooduli Autoreis.',
  'help.guide.roadtrip-mode.tip.3':
    'Telefonis lülitit pole: lisamoodul lisab vahekaardi Plaan kõrvale eraldi vahekaardi Autoreis.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Vahepeatused ja peatumise kestus',
  'help.guide.roadtrip-stops.goal': 'Muuda sõidul olev koht vahepeatuseks ja määra, kui kaua iga peatus kestab.',
  'help.guide.roadtrip-stops.step.1':
    'Klõpsa ribal peatuse ees oleval numbril. Selle silt on Muuda vahepeatuseks ja see avab akna Peatuse tüüp.',
  'help.guide.roadtrip-stops.step.2':
    'Vali tüüp: Majutus, Kütus, Laadimine, Puhkeala, Telkimisala, Toit või Vaatamisväärsused. Number muutub selle tüübi ikooniks ja allpool olevad peatused nummerdatakse ümber.',
  'help.guide.roadtrip-stops.step.3': 'Vahepeatus pole sihtkoht, seega loeb päeva päis ühe peatuse vähem.',
  'help.guide.roadtrip-stops.step.4':
    'Klõpsa uuesti ikoonil, Muuda peatuse tüüpi, ja vali Muuda tagasi sihtkohaks, et peatus saaks oma numbri tagasi.',
  'help.guide.roadtrip-stops.step.5': 'Igal peatusel on märk Peatumine. Klõpsa sellel, et avada Aeg selles peatuses.',
  'help.guide.roadtrip-stops.step.6':
    'Määra kestus liuguri, miinus- ja plussnuppude või mõne eelseadistusega, vaata, kuidas muutuvad Saabumine ja Lahkumine, ning klõpsa Salvesta.',
  'help.guide.roadtrip-stops.result':
    'Peatuse, mille kestuse määrasid, märgil Peatumine on nüüd aeg ja kõik järgnevad saabumised on sellega koos nihkunud, ning peatus, mille muutsid mingiks tüübiks ja tagasi, on jälle nummerdatud sihtkoht.',
  'help.guide.roadtrip-stops.tip.1':
    'Peatumine kuulub kohale, mitte ühele külastusele: kahel päeval plaanitud kohas peatutakse mõlemal päeval sama kaua.',
  'help.guide.roadtrip-stops.tip.2':
    'Vahepeatused on näha ka vaates Päevad. Kui lülitad Sõiduseadetes jaotises Teeninduspeatused välja valiku Näita ka päevade vaates, jäävad need ainult vaatesse Autoreis.',
  'help.guide.roadtrip-stops.tip.3': 'Samas dialoogis olev Peatumiseta eemaldab aja uuesti.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Leia marsruudi äärest kütust, toitu ja ööbimiskohta',
  'help.guide.roadtrip-corridor.goal': 'Otsi teelt, mida tegelikult sõidad, ja pane leitu õigele lõigule.',
  'help.guide.roadtrip-corridor.step.1':
    'Vali vaate Marsruudil ülaosas päev. Pakutakse ainult päevi, millele on marsruut arvutatud.',
  'help.guide.roadtrip-corridor.step.2':
    'Märgi jaotises Otsitav, mida vajad. Kütus, Laadimine, Puhkeala, Telkimisala, Majutus, Toit ja Vaatamisväärsused on omavahel kombineeritavad.',
  'help.guide.roadtrip-corridor.step.3':
    'Vali jaotises Kaugusel kuni, kui kaugelt tee kummaltki poolt otsida, 2 km, 5 km või 10 km, ja klõpsa Otsi.',
  'help.guide.roadtrip-corridor.step.4':
    'Tulemused tulevad tagasi tüüpide kaupa rühmitatuna, möödumise järjekorras, igaühe juures näha, kui kaugel see päeva teekonnal asub ja kui kaugel marsruudist see on.',
  'help.guide.roadtrip-corridor.step.5':
    'Tulemuse nupp Lisa avab akna Lisa peatusena. See näitab, millisele päevale ja millisele kohale peatus tuleb, küsib tüüpi ja peatuses veedetavat aega ning Lisa paneb selle sõidule.',
  'help.guide.roadtrip-corridor.result':
    'Tulemused on loetletud möödumise järjekorras ja kaardile joonistatud ning lisatud peatus on sõidul täpselt seal, kus sellest tegelikult mööda sõidetakse.',
  'help.guide.roadtrip-corridor.tip.1':
    'Midagi ei otsita enne, kui vajutad Otsi: üks otsing tähendab palju päringuid ühisele teenusele.',
  'help.guide.roadtrip-corridor.tip.2':
    'Filtreeri nime järgi kitsendab tulemusi uut päringut tegemata ja Tühjenda tulemused tühjendab loendi ja selle nööpnõelad. Klõpsa tulemusel, et see kaardil nähtavale tuua.',
  'help.guide.roadtrip-corridor.tip.3':
    'Tulemuse saab ka kaardilt joonistatud marsruudile lohistada; nii valid ise lõigu, kui sama teed sõidetakse kaks korda. Nupu Otsi kõrval olev Lisa käsitsi otsib selle asemel kohta nime järgi.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Suuna lõik läbi vahepunkti',
  'help.guide.roadtrip-via.goal': 'Saada lõik mööda teed, mida tegelikult soovid, ilma sellele peatust lisamata.',
  'help.guide.roadtrip-via.step.1':
    'Too soovitud lõik nähtavale: klõpsa ribal peatusel ja sulge seejärel kaardi peale avanev infokaart.',
  'help.guide.roadtrip-via.step.2':
    'Klõpsa joonistatud marsruudil. Klõpsatud lõigule lisatakse vahepunkt ja lõigu marsruut arvutatakse selle kaudu uuesti.',
  'help.guide.roadtrip-via.step.3':
    'Riba järgib: päeva päises on uus vahemaa ja sõiduaeg ning kõik vahepunkti järel olevad saabumised nihkuvad vastavalt.',
  'help.guide.roadtrip-via.step.4':
    'Vii kursor pidemele ja see ütleb, mida sellega teha saab: Marsruudi muutmiseks lohista, eemaldamiseks tee paremklõps. Lohista see mujale ja lõik joonistatakse uue koha kaudu ümber.',
  'help.guide.roadtrip-via.step.5': 'Tee pidemel paremklõps, et see eemaldada. Lõik kulgeb jälle otseteed.',
  'help.guide.roadtrip-via.result':
    'Lõik järgib valitud teed ning päeva vahemaa, sõiduaeg ja saabumised arvutatakse selle jaoks uuesti.',
  'help.guide.roadtrip-via.tip.1':
    'Vahepunkt pole peatus: sellel pole numbrit, peatumist ega saabumisaega ja seda ei loeta päeva peatuste hulka.',
  'help.guide.roadtrip-via.tip.2':
    'Pidemed joonistatakse alates suumitasemest 9, nii et kogu reisile sobitatud kaardil on joon ilma nendeta.',
  'help.guide.roadtrip-via.tip.3':
    'Klõpsu, mis on mis tahes joonistatud lõigust kaugemal kui kaks kilomeetrit, eiratakse, samuti klõpsu lennul, rongil või praamil.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Proovi lõigu sõitmiseks teist teed',
  'help.guide.roadtrip-alternatives.goal': 'Vaata, mida marsruudiplaneerija ühe lõigu jaoks veel pakub, ja vali see.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klõpsa ribal sõiduribal, kahe peatuse vahelisel real, mis näitab lõigu vahemaad ja aega. Selle silt on Muud marsruudid.',
  'help.guide.roadtrip-alternatives.step.2':
    'Kaardi peale avaneb Selle lõigu sõiduvõimalused, iga tee kohta üks kirje, igaüks kaardile oma värviga joonistatud.',
  'help.guide.roadtrip-alternatives.step.3':
    'Vii kursor kirjele, et see tee esile tõsta. Praegune on tee, mida praegu sõidetakse, ja Kiireim kõige kiirem; teised näitavad, kui palju aeglasemad need on või millise teeklassi need välja jätavad.',
  'help.guide.roadtrip-alternatives.step.4': 'Klõpsa kirjel, et sõita seda teed, või Sulge, et jääda praegusele teele.',
  'help.guide.roadtrip-alternatives.result':
    'Lõik kulgeb valitud teed ning riba vahemaa ja sellele järgnevad saabumised muutuvad vastavalt.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Teise tee valimine lisab lõigule vahepunkti ja asendab olemasolevad; marsruudiplaneerija enda tee valimine eemaldab need uuesti.',
  'help.guide.roadtrip-alternatives.tip.2':
    'Kiirteeta, Teemaksudeta ja Praamita tulevad teiselt mootorilt, millel on oma kiirusmudel, seega pole nende ajad teistega võrreldavad.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Määra auto ja sõidupiirangud',
  'help.guide.roadtrip-limits.goal': 'Ütle TREKile, millega sõidad ja kui kaugele oled valmis korraga sõitma.',
  'help.guide.roadtrip-limits.step.1':
    'Sõiduseaded asub paremas veerus otsingu all. Selle märgid näitavad, mis on määratud; avamiseks klõpsa sellel.',
  'help.guide.roadtrip-limits.step.2':
    'Jaotises Autoga on Pikim järjestikune sõit ja Sõiduaeg päevas minutites. Tühi väli tähendab väljas ja midagi ei märgita.',
  'help.guide.roadtrip-limits.step.3':
    'Märgi jaotises Sõiduk, millega sõidad. Bensiin tangib ainult kütusepeatustes, Elektriline ainult laadimispeatustes, Kumb tahes mõlemas.',
  'help.guide.roadtrip-limits.step.4':
    'Sisesta Sõiduulatus ühe paagiga või Sõiduulatus ühe laadimisega ise. Selle all olev Arvuta auto andmetest võtab Paagi mahu ja Kulu või Aku ja Kulu ning teeb arvutuse ise.',
  'help.guide.roadtrip-limits.step.5':
    'Võimaluse korral väldi on eelistus, mitte keeld: päev, millel ümbersõitu pole, kasutab siiski seda teed ja ütleb seda oma päises.',
  'help.guide.roadtrip-limits.step.6':
    'Sulge dialoog. Kaart näitab, mis on määratud, ja riba märgib iga lõigu ja iga päeva, mis seda ületab.',
  'help.guide.roadtrip-limits.result':
    'Kaardi märgid näitavad, mis on määratud, ning igal piirangut ületaval lõigul ja päeval on ribal märk.',
  'help.guide.roadtrip-limits.tip.1':
    'Seaded kuuluvad reisile, nii et kõik reisil osalejad planeerivad sama auto ja samade piirangutega.',
  'help.guide.roadtrip-limits.tip.2':
    'Täida kuni määrab, kui täis peatuses tangitakse, sest teel ei laadi keegi 100 %-ni. Kütuse- või laadimispeatus saab selle enda jaoks üle kirjutada.',
  'help.guide.roadtrip-limits.tip.3':
    'Marsruudijoon määrab, kuidas sõit joonistatakse: Ühenda päevad arvutab marsruudi ka kahe päeva vahelise öö jaoks ja Igale päevale oma värv annab igale päevale oma värvi.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Anna sõidupäevale algus ja lõpp',
  'help.guide.roadtrip-day-window.goal': 'Lõpeta sõit sinu valitud kellaajal ja määra, kus päev lõppema peaks.',
  'help.guide.roadtrip-day-window.step.1': 'Ava paremas veerus Sõiduseaded ja leia Igapäevased sõiduajad.',
  'help.guide.roadtrip-day-window.step.2':
    'Määra Päeva algusaeg. Üksi see midagi ei tee: vaja on mõlemat aega, nagu nende all olev märkus ütleb.',
  'help.guide.roadtrip-day-window.step.3':
    'Määra Päeva lõpuaeg. Sõit peatub nüüd sellel kellaajal ja ülejäänu kantakse üle järgmisse hommikusse, ribal ridadena Päeva lõpp ja Jätka teekonda.',
  'help.guide.roadtrip-day-window.step.4':
    'Vali jaotises Lõpeta päev kas Marsruudil, et teha lõpuajal paus tee peal, või Viimases kohas, et peatuda enne, kui järgmine sõit sellest mööduks.',
  'help.guide.roadtrip-day-window.step.5': 'Sulge dialoog. Sõiduseadete kaardil on kaks aega märgina.',
  'help.guide.roadtrip-day-window.result':
    'Sõit jagatakse sinu määratud pikkusega sõidupäevadeks ja kõik, mis ei mahu, jätkub pärast viimast päeva arvutatud päevadel. Sinu päevi ja nende kohti ei muudeta.',
  'help.guide.roadtrip-day-window.tip.1':
    'Kumma tahes aja tühjendamine lülitab kogu funktsiooni uuesti välja. Ajad, mille oled peatusele ise kinnitanud, on alati eelisjärjekorras.',
  'help.guide.roadtrip-day-window.tip.2':
    'Kui igapäevased sõiduajad on määratud, on päevad alati ühendatud: sõidu ühe päeva viimasest peatusest järgmise päeva esimeseni arvutab marsruudiplaneerija ja see läheb arvesse.',
  'help.guide.roadtrip-day-window.tip.3':
    'Iga päeva lõpp on ka kaardil märgisena, kuu koos päeva numbriga. Lohista see mööda marsruuti või mõnele kohale, et lõpetada päev mujal; paremklõps taastab automaatse päevalõpu ja selles dialoogis olev Taasta automaatsed päevade lõpud tühistab kõik muudatused.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tangi enne, kui paak tühjaks saab',
  'help.guide.roadtrip-refuel.goal': 'Leia tankimiskoht lõigul, kuhu auto veel jõuab, ja lisa see sõidule.',
  'help.guide.roadtrip-refuel.step.1':
    'Kui sõiduulatus on määratud, kuvab riba lõigul, kus kütus otsa saab, hoiatusriba: Siin saab paak tühjaks ja selle all, kui kaugel lõigu algusest see on.',
  'help.guide.roadtrip-refuel.step.2':
    'Hoiatusriba lamp on nupp. Otsi kütust otsib mööda juba sõidetud teed ja otsingu ajal on kirjas Otsimine marsruudi äärest…',
  'help.guide.roadtrip-refuel.step.3':
    'Tagasi tuleb kuni kolm jaama, igaühe juures näha, kui kaugel marsruudist see on ja kui palju sõiduulatust sellest varuks jääks.',
  'help.guide.roadtrip-refuel.step.4':
    'Pakkumise pluss lisab selle kütusepeatusena. Lisa peatusena avaneb tüübi ja ajaga juba täidetuna ning Lisa paneb selle lõigule täpselt sinna, kus sellest tegelikult mööda sõidetakse.',
  'help.guide.roadtrip-refuel.result':
    'Peatus on õigel lõigul oma ikooniga, sõiduulatust arvestatakse sealt uuesti ja hoiatusriba on kadunud.',
  'help.guide.roadtrip-refuel.tip.1':
    'Sõiduulatust arvestatakse viimasest kütuse- või laadimispeatusest, üle päevade. Sõiduk määrab, millised peatused lähevad arvesse: Bensiin ainult kütusepeatused, Elektriline ainult laadimispeatused.',
  'help.guide.roadtrip-refuel.tip.2':
    'Otsing vaatab teed enne tühjaks saamise kohta, jätab varu ja arvestab ümbersõitu kahekordselt, nii et kõik pakutud kohad on tõesti kättesaadavad.',
  'help.guide.roadtrip-refuel.tip.3':
    'Tühi vastus pole ummiktee: lamp muutub nupuks Proovi uuesti, sest kohaotsing on ühine teenus, mis võib aeguda.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Pane päev järgima imporditud rada',
  'help.guide.roadtrip-track.goal': 'Suuna päeva sõit maalilisele marsruudile, mille importisid GPX- või KML-rajana.',
  'help.guide.roadtrip-track.step.1': 'Klõpsa päeva päises märgil Rada. Dialoog avaneb selle päeva jaoks.',
  'help.guide.roadtrip-track.step.2':
    'Vali rada. Iga raja juures on selle pikkus ja see, kas see kulgeb selle päeva teekonnal või kui kaugel see asub, lähimad eespool.',
  'help.guide.roadtrip-track.step.3':
    'Klõpsa Järgi seda rada. TREK lisab vahepunktid sinna, kus sõit rajast kõige kaugemale kaldub, ja arvutab marsruudi uuesti, ring ringi järel.',
  'help.guide.roadtrip-track.step.4':
    'See näitab, mitu vahepunkti lisati ja kui lähedal sõit nüüd rajale püsib. Selle all olev nupp eemaldab need vahepunktid uuesti ja annab päeva tagasi marsruudiplaneerijale; dialoogi sulgemine jätab raja alles.',
  'help.guide.roadtrip-track.result':
    'Päeva sõit järgib rada marsruudiplaneerija valitud tee asemel ning selle märk Rada on esile tõstetud ja näitab osutamisel raja nime.',
  'help.guide.roadtrip-track.tip.1':
    'Impordi fail vaates Päevad nupuga Impordi fail, kui Marsruudid või Rajad on märgitud. Kuni reisil pole ühtegi rada, pole ühelgi päeval seda märki.',
  'help.guide.roadtrip-track.tip.2':
    'Raja järgimine asendab päeva lõikudel juba olnud vahepunktid, nii et kujunda lõiku käsitsi pärast raja rakendamist, mitte enne.',
};

export default help;
