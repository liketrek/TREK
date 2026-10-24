import type { TranslationStrings } from '../types';

const help: TranslationStrings = {
  'help.title': 'Abi ja dokumentatsioon',
  'help.search': 'Otsi juhenditest…',
  'help.contents': 'Sisukord',
  'help.noResults': 'Sobivaid lehti ei leitud.',
  'help.errorTitle': 'Lehte ei õnnestunud laadida',
  'help.errorBody': 'Abiteave laaditakse TREKi vikist. Kontrolli ühendust ja proovi uuesti.',

  // ── Help center (the contextual panel behind the ? in the navbar) ──────────
  'help.center.button': 'Abi selle vaate kohta',
  'help.center.title': 'Abi',
  'help.center.onThisScreen': 'Selles vaates',
  'help.center.screens': 'Vaated',
  'help.center.thisScreen': 'Praegune',
  'help.center.subScreens': '{count} alamvaadet',
  'help.center.subScreens.one': '{count} alamvaade',
  'help.center.subScreensLabel': 'Alamvaated',
  'help.center.guidesCount': '{count} juhendit',
  'help.center.guidesCount.one': '{count} juhend',
  'help.center.goToScreen': 'Ava {screen}',
  'help.center.overview': 'Ülevaade',
  'help.center.howTo': 'Kuidas ma…',
  'help.center.searchPlaceholder': 'Otsi juhenditest ja abitekstidest…',
  'help.center.searchEmpty': 'Päringule „{query}“ ei leitud midagi.',
  'help.center.searchGuides': 'Juhendid',
  'help.center.searchDocs': 'Dokumentatsioon',
  'help.center.searchError': 'Otsing pole praegu saadaval.',
  'help.center.back': 'Tagasi',
  'help.center.close': 'Sulge abi',
  'help.center.steps': '{count} sammu',
  'help.center.steps.one': '{count} samm',
  'help.center.step': 'Samm {n}',
  'help.center.stepsLabel': 'Sammud',
  'help.center.stepOf': 'Samm {n}/{total}',
  'help.center.screenshot': 'Ekraanipilt',
  'help.center.result': 'Tulemus',
  'help.center.tips': 'Hea teada',
  'help.center.related': 'Seotud',
  'help.center.openDocs': 'Ava abikeskuses',
  'help.center.docsSection': 'Dokumentatsioonis',
  'help.center.noContext': 'Selle vaate kohta pole veel juhendit.',
  'help.center.noContextHint': 'Otsi dokumentatsioonist või anna meile teada, mida otsisid.',
  'help.center.feedback': 'Kas midagi jäi puudu?',
  'help.center.feedbackLink': 'Anna meile GitHubis teada',
  'help.center.discord': 'Küsi Discordis',
  'help.center.quick': 'Kiirjuhend',
  'help.center.guide': 'Juhend',
  'help.center.tour': 'Tutvustus',
  'help.center.imageAlt': '„{title}“, samm {n}',

  // ── Screen: dashboard ──────────────────────────────────────────────────────
  'help.ctx.dashboard.title': 'Ülevaade',
  'help.ctx.dashboard.summary':
    'Ülevaates on kõik sinu reisid. Ülemine kaart, mis näeb välja nagu pardakaart, näitab käimasolevat või järgmist reisi. Selle all olev rida loeb kokku, kui palju oled seni reisinud, ja kaartidel on kõik reisid, mida plaanid, oled arhiveerinud või juba lõpetanud.',
  'help.ctx.dashboard.bullet.1':
    'Pardakaart: käimasolev või järgmine reis koos kuupäevade, reisijate, kohtade ja pöördloendusega. Klõpsa sellel, et reis avada. Paremas ülanurgas olevate nelja nupuga saad reisi muuta, kopeerida, arhiveerida või kustutada.',
  'help.ctx.dashboard.bullet.2':
    'Reisistatistika: külastatud riigid, reisid, teel oldud päevad ja lennatud vahemaa kõigi sinu reiside peale kokku.',
  'help.ctx.dashboard.bullet.3':
    'Reisikaardid, mida saab filtreerida valikutega „Plaanis“, „Arhiveeritud“ ja „Lõppenud“, ruudustiku või loendina. Nende kohal olev otsingukast otsib korraga kõigist sinu reisidest pealkirja, kuupäeva või reisi mõne koha järgi. Nupud reisi muutmiseks, kopeerimiseks, arhiveerimiseks ja kustutamiseks on iga kaardi foto paremas ülanurgas.',
  'help.ctx.dashboard.bullet.4':
    'Paremal olevad vidinad: valuutamuundur, „Kogumikud“ (kui lisamoodul „Kogumikud“ on sees), maailmakellad, eelseisvad broneeringud ja pluginate vidinad. Sisseehitatud vidinad saad välja lülitada jaotises „Seaded“, „Välimus“.',
  'help.ctx.dashboard.bullet.5':
    'Uue reisi saad alustada nii kaardilt „Uus reis“ kui ka paremas allnurgas olevast nupust.',

  // create-trip
  'help.guide.create-trip.title': 'Loo reis',
  'help.guide.create-trip.goal': 'Alusta uut reisi nime, kuupäevade ja kaanefotoga.',
  'help.guide.create-trip.step.1':
    'Klõpsa „Uus reis“. Sama teevad ka sinu reiside lõpus olev kaart ja paremas alanurgas olev nupp.',
  'help.guide.create-trip.step.2': 'Anna reisile nimi. See on ainus kohustuslik väli, kõik muu saad lisada hiljem.',
  'help.guide.create-trip.step.3':
    'Vali algus- ja lõppkuupäev. TREK loob iga kuupäeva jaoks ühe päeva, nii et saad kohe reisiplaani koostama hakata. Kuupäevi veel pole? Jäta mõlemad tühjaks ja sisesta hoopis „Päevade arv“.',
  'help.guide.create-trip.step.4':
    'Valikuline: lisa kaanefoto. Laadi üles oma foto, lohista või kleebi see või otsi Unsplashist sihtkoha järgi.',
  'help.guide.create-trip.step.5': 'Klõpsa „Loo uus reis“.',
  'help.guide.create-trip.result':
    'Reis ilmub sinu ülevaatesse. Kui see on sinu järgmine reis, on see näha ülemisel pardakaardil.',
  'help.guide.create-trip.tip.1':
    'Kuupäevi saab hiljem muuta. Kui broneeringud on juba olemas, küsib TREK, kas need nihutada koos päevadega.',
  'help.guide.create-trip.tip.2': 'Siin valitud reisi valuutasse arvestatakse ümber kõik kulud. Vali sihtkoha valuuta.',

  // edit-trip
  'help.guide.edit-trip.title': 'Muuda reisi',
  'help.guide.edit-trip.goal': 'Nimeta reis ümber, muuda selle kuupäevi või seadeid.',
  'help.guide.edit-trip.step.1': 'Klõpsa reisikaardi (või pardakaardi) paremas ülanurgas oleval pliiatsil.',
  'help.guide.edit-trip.step.2':
    'Muuda, mida vaja: nime, kirjeldust, kuupäevi, kaanepilti, valuutat, meeldetuletust või reisikaaslasi.',
  'help.guide.edit-trip.step.3': 'Klõpsa „Uuenda“.',
  'help.guide.edit-trip.result': 'Kaart uueneb kohe kõigil reisi liikmetel.',
  'help.guide.edit-trip.tip.1':
    'Kui nihutad broneeringutega reisi algust, küsitakse, kas ka broneeringud tuleks nihutada. Reisi lühendamisel näed päevi, mis eemaldataks, ja seda, mis neile on planeeritud. Muudatus salvestatakse alles pärast klõpsu nupul „Eemalda päevad ja salvesta“.',

  // cover-image
  'help.guide.cover-image.title': 'Määra kaanepilt',
  'help.guide.cover-image.goal': 'Anna reisile pilt, mis on näha selle kaardil ja pardakaardil.',
  'help.guide.cover-image.step.1': 'Ava reisi muutmisvorm reisikaardil oleva pliiatsiga.',
  'help.guide.cover-image.step.2':
    'Lohista või kleebi jaotisse „Kaanepilt“ foto, klõpsa, et foto üles laadida, või kirjuta sihtkoht ja klõpsa „Otsi Unsplashist“.',
  'help.guide.cover-image.step.3': 'Vali foto ja klõpsa „Uuenda“.',
  'help.guide.cover-image.result': 'Foto salvestatakse reisi juurde ja seda näidatakse kõikjal, kus reis loendis on.',
  'help.guide.cover-image.tip.1':
    'Unsplashi otsingu fotodele lisatakse autori viide automaatselt; sinu enda üleslaaditud pildid jäävad sinu serverisse.',

  // duplicate-trip
  'help.guide.duplicate-trip.title': 'Tee reisist koopia',
  'help.guide.duplicate-trip.goal': 'Kasuta olemasolevat reisi uue reisi mallina.',
  'help.guide.duplicate-trip.step.1': 'Klõpsa kaardi paremas ülanurgas kopeerimisikoonil.',
  'help.guide.duplicate-trip.step.2': 'Loe, mida kopeeritakse ja mida mitte, seejärel klõpsa „Kopeeri reis“.',
  'help.guide.duplicate-trip.result':
    'Ülevaatesse ilmub koopia. Selle nimi on originaali nimi, mille järel on „(koopia)“. Saad selle ümber nimetada ja kuupäevi muuta.',
  'help.guide.duplicate-trip.tip.1':
    'Kopeeritakse päevad, kohad, retked ja autoreisi marsruudid, broneeringud, eelarvekirjed, pakkimisnimekirjad, ülesanded ja päevamärkmed; pakkimisnimekirjad ja ülesanded kopeeritakse märkimata kujul. Liikmeid, vestlust, küsitlusi, faile ja jagamislinke ei kopeerita.',

  // archive-trip
  'help.guide.archive-trip.title': 'Arhiveeri ja taasta reis',
  'help.guide.archive-trip.goal': 'Eemalda reis reiside loendist seda kustutamata ja taasta see hiljem.',
  'help.guide.archive-trip.step.1': 'Klõpsa kaardi paremas ülanurgas arhiveerimisikoonil.',
  'help.guide.archive-trip.step.2': 'Et reisi uuesti näha, lülita kaartide kohal olev filter asendisse „Arhiveeritud“.',
  'help.guide.archive-trip.step.3':
    'Klõpsa kaardil „Taasta“: reis naaseb olekusse „Plaanis“ või, kui selle kuupäevad on möödas, olekusse „Lõppenud“.',
  'help.guide.archive-trip.result':
    'Arhiveeritud reisidel säilivad kõik andmed. Neid ei näidata enam töölaual ega kõigi reiside kalendrivoos.',

  // delete-trip
  'help.guide.delete-trip.title': 'Reisi kustutamine',
  'help.guide.delete-trip.goal': 'Kustuta reis jäädavalt.',
  'help.guide.delete-trip.step.1': 'Klõpsa kaardi paremas ülanurgas prügikastiikoonil.',
  'help.guide.delete-trip.step.2': 'Kinnita nupuga „Kustuta“. Dialoogis on reisi nimi, nii et tead, et valisid õige.',
  'help.guide.delete-trip.result':
    'Reis koos päevade, kohtade, broneeringute ja failidega kustutatakse. Seda ei saa tagasi võtta, nii et kui sa pole kindel, arhiveeri reis hoopis.',

  // filter-and-view
  'help.guide.filter-and-view.title': 'Leia lõppenud reisid, vaheta ruudustiku ja loendi vahel',
  'help.guide.filter-and-view.goal': 'Vaata lõppenud või arhiveeritud reise ja vali endale meelepärane paigutus.',
  'help.guide.filter-and-view.step.1':
    'Kasuta kaartide kohal valikuid „Plaanis“, „Arhiveeritud“ ja „Lõppenud“. „Lõppenud“ alla kuuluvad kõik reisid, mille lõppkuupäev on möödas.',
  'help.guide.filter-and-view.step.2':
    'Kompaktse loendi saamiseks klõpsa loendi ikoonil, ruudustiku juurde naasmiseks klõpsa uuesti.',
  'help.guide.filter-and-view.result': 'Ülevaade jätab sinu paigutuse selles seadmes meelde.',

  // calendar-feed
  'help.guide.calendar-feed.title': 'Telli kõik reisid oma kalendrisse',
  'help.guide.calendar-feed.goal':
    'Näe kõigi aktiivsete reiside päevi ja broneeringuid oma kalendrirakenduses, alati ajakohasena.',
  'help.guide.calendar-feed.step.1': 'Klõpsa vaatelüliti kõrval oleval kalendriikoonil.',
  'help.guide.calendar-feed.step.2': 'Klõpsa „Lülita kalendri tellimus sisse“. TREK loob privaatse kalendrivoo lingi.',
  'help.guide.calendar-feed.step.3':
    'Klõpsa „Lisa Google’i kalendrisse“ või „Lisa Apple’i kalendrisse / Outlooki“. Muu kalendrirakenduse jaoks ava „Või kopeeri link käsitsi“ ja kopeeri link sealt.',
  'help.guide.calendar-feed.result':
    'Iga aktiivne reis on sinu kalendris ja uueneb automaatselt. Arhiveeritud reise ja reise, mis lõppesid rohkem kui 90 päeva tagasi, ei kaasata.',
  'help.guide.calendar-feed.tip.1':
    'Hoia link salajas: igaüks, kellel see on, saab voogu lugeda. Kui see jõuab teiste kätte, annab „Loo uuesti“ sulle uue lingi ja vana lakkab töötamast. „Lülita välja“ eemaldab lingi täielikult.',

  // widgets
  'help.guide.widgets.title': 'Vali töölaua vidinad',
  'help.guide.widgets.goal': 'Näita või peida statistikarida ja paremal olevad vidinad.',
  'help.guide.widgets.step.1': 'Ava paremas ülanurgas avatari menüü ja vali „Seaded“.',
  'help.guide.widgets.step.2': 'Ava vahekaart „Välimus“.',
  'help.guide.widgets.step.3':
    'Lülita jaotises „Avalehe vidinad“ iga vidin sisse või välja, eraldi „Töölaua“ ja „Mobiili“ jaoks. „Parem külgriba“ lülitab kogu parema veeru korraga välja.',
  'help.guide.widgets.step.4': 'Mine tagasi ülevaatesse. Muudatus rakendub kohe.',
  'help.guide.widgets.result':
    'Kui vidinad peidad, jääb reisidele rohkem ruumi. Paigutuse keskele seadmiseks lülita kogu parem külgriba välja.',
  'help.guide.widgets.link': 'Ava välimuse seaded',

  // currency-widget
  'help.guide.currency-widget.title': 'Teisenda valuutasid',
  'help.guide.currency-widget.goal': 'Teisenda summa kahe valuuta vahel kehtivate kurssidega.',
  'help.guide.currency-widget.step.1': 'Sisesta summa ja vali kaks valuutat.',
  'help.guide.currency-widget.step.2': 'Nendevaheline nool vahetab valuutad omavahel, ringnool värskendab kurssi.',
  'help.guide.currency-widget.result': 'Valuutapaar salvestatakse sinu kontole, nii et see on igas seadmes sama.',
  'help.guide.currency-widget.tip.1':
    'Kursid tulevad tasuta teenusest Frankfurter. Vidina nurgas olev ringnool laadib uusimad kursid.',

  // timezones-widget
  'help.guide.timezones-widget.title': 'Lisa maailmakellad',
  'help.guide.timezones-widget.goal': 'Vaata kohalikku aega oma sihtkohtades.',
  'help.guide.timezones-widget.step.1':
    'Klõpsa vidinas „Ajavööndid“ +-il, otsi linna, näiteks Lissabon, ja vali see loendist.',
  'help.guide.timezones-widget.step.2': 'Kella eemaldamiseks vii kursor selle kohale ja klõpsa paremale ilmuval ×-il.',
  'help.guide.timezones-widget.result': 'Sinu kellad salvestatakse sinu kontole.',
  'help.guide.search-trips.title': 'Otsi oma reise',
  'help.guide.search-trips.goal':
    'Leia reis nime, kuupäeva või sinna planeeritud koha järgi, ka arhiveeritud reiside hulgast.',
  'help.guide.search-trips.step.1':
    'Kirjuta kaartide kohal olevale väljale „Otsi reise või kohti“. Loend filtreerub juba kirjutamise ajal ja otsib korraga plaanitud, arhiveeritud ja lõppenud reiside seast.',
  'help.guide.search-trips.step.2':
    'Kui reis leitakse mõne selle koha järgi, on see koht näha reisi pealkirja all. Kõigi reiside uuesti nägemiseks klõpsa kastis x-il või vajuta Escape.',
  'help.guide.search-trips.result':
    'Ülevaates on ainult sobivad reisid. Kõigi reiside uuesti nägemiseks tühjenda otsingukast.',
  'help.guide.search-trips.tip.1':
    'Otsida saab ka kuupäeva järgi: kirjuta kuu ja aasta, näiteks mai 2027, või 2027-05, et leida selle kuu reisid.',
  'help.guide.search-trips.tip.2':
    'Otsingu ajal lülitit „Plaanis“, „Arhiveeritud“ ja „Lõppenud“ ei arvestata, nii et vale filter ei peida kunagi ühtegi reisi.',

  // ── Screen: vacay ──────────────────────────────────────────────────────────
  'help.ctx.vacay.title': 'Vacay',
  'help.ctx.vacay.summary':
    'Vacay on sinu isiklik puhkuseplaneerija: mitu puhkusepäeva sul aastas on, milliseid oled märkinud ja mitu on alles. Ruudustik näitab kogu aastat. Külgribal on aastavalija, kaasplaneerijad, sinuga jagatud kalendrid, legend ja sinu puhkusepäevade õigus.',
  'help.ctx.vacay.bullet.1':
    'Aasta ruudustik: kaksteist kuukaarti, iga päev omaette lahtris. Klõpsa päeval, et see märkida või märge eemaldada. Väike sinine täpp näitab päevi, mis on juba mõne reisi sees.',
  'help.ctx.vacay.bullet.2':
    'All olev tööriistariba: esimene nupp sinu nime ja värviga märgib puhkust; „Ettevõtte puhkepäev“ märgib päevi, mil kogu ettevõte puhkab. „Pool päeva“ ja „Vaba / tasaarvestuspäev“ muudavad seda, mida klõps märgib, ning „Pool päeva“ töötab ka ettevõtte puhkepäevade puhul.',
  'help.ctx.vacay.bullet.3':
    '„Puhkusepäevade õigus“: valitud aasta „Päevad“, „Kasutatud“ ja „Alles“ ning nende kõrval üle kantud päevad ja vabad / tasaarvestuspäevad. Klõpsa kaardi pealkirjal, et see kokku panna.',
  'help.ctx.vacay.bullet.4':
    'Jaotises „Inimesi“ on need, kes sinu plaani jagavad, igaüks oma värviga. „Jagatud kalendrid“ näitab teiste inimeste vabu päevi värviliste rõngastena. Neid sa muuta ei saa.',
  'help.ctx.vacay.bullet.5':
    'Seadetes on nädalavahetused, nädala alguspäev, päevade ülekandmine, sinu puhkuseaasta, ettevõtte puhkepäevad, riigipühade ja koolivaheaegade kalendrid ning „Lahuta ühendatud kalendrid“, kui planeerid koos kellegagi.',

  // log-day
  'help.guide.log-day.title': 'Märgi puhkusepäev',
  'help.guide.log-day.goal': 'Märgi aasta ruudustikus vaba päev ja vaata, kuidas saldo uueneb.',
  'help.guide.log-day.step.1':
    'Vaata all oleva tööriistariba esimest nuppu. Kui sellel on sinu nimi ja värv, märgib klõps päeval sulle puhkusepäeva.',
  'help.guide.log-day.step.2':
    'Klõpsa mõne kuukaardi päeval. Päev värvitakse sinu värviga ja „Kasutatud“ kasvab ühe päeva võrra.',
  'help.guide.log-day.step.3': 'Märke eemaldamiseks klõpsa samal päeval uuesti.',
  'help.guide.log-day.result':
    'Päev on märgitud. „Päevad“, „Kasutatud“ ja „Alles“ uuenevad kohe ning kõik sinu plaaniga ühendatud inimesed näevad muudatust kohe.',
  'help.guide.log-day.tip.1':
    'Kui jaotises „Seaded“ on „Blokeeri nädalavahetused“ sees, ei saa nädalavahetusi märkida. Varem märgitud nädalavahetuse päeva saab siiski tühjendada.',
  'help.guide.log-day.tip.2':
    'Sinine täpp lahtris tähendab, et see päev on mõne sinu reisi sees. Nii näed, kus puhkus ja reisid kattuvad.',

  // half-day
  'help.guide.half-day.title': 'Märgi pool päeva',
  'help.guide.half-day.goal': 'Võta pärastlõuna vabaks ja kasuta ära ainult pool puhkusepäeva.',
  'help.guide.half-day.step.1':
    'Lülita tööriistaribal sisse „Pool päeva“. Selle oranž täpp tähistab ruudustikus poolt päeva.',
  'help.guide.half-day.step.2': 'Klõpsa päeval. See arvestatakse kui 0,5 ja selle nurka ilmub oranž täpp.',
  'help.guide.half-day.step.3':
    'Kui oled valmis, lülita „Pool päeva“ uuesti välja. Kui klõpsad teistsuguste seadetega poolel päeval, muudetakse see praeguste seadete järgi.',
  'help.guide.half-day.result':
    '„Kasutatud“ suureneb 0,5 võrra. „Pool päeva“ ja „Vaba / tasaarvestuspäev“ on teineteisest sõltumatud, nii et saad märkida ka poole tasaarvestuspäeva.',
  'help.guide.half-day.tip.1':
    'Tööriistaribal on alati näha tähis, mille järgmine klõps paneb, nii et saad enne märkimist üle kontrollida.',

  // comp-day
  'help.guide.comp-day.title': 'Märgi ületundide või paindliku tööaja vaba aeg',
  'help.guide.comp-day.goal': 'Võta vaba aega ületundide arvelt, ilma et puhkusepäevi kuluks.',
  'help.guide.comp-day.step.1':
    'Lülita tööriistaribal sisse „Vaba / tasaarvestuspäev“. Viirutatud ketas tähistab ruudustikus tasaarvestuspäeva.',
  'help.guide.comp-day.step.2': 'Klõpsa päeval. Ühtlase värvi asemel täitub see sinu värvi diagonaalsete joontega.',
  'help.guide.comp-day.result':
    'Asenduspäevi loetakse puhkusepäevade paanide kõrval eraldi ja need ei vähenda kunagi näitu „Alles“.',
  'help.guide.comp-day.tip.1':
    'Kasuta seda vabaks võetud ületundide, paindliku tööaja või asenduspäeva jaoks: iga vaba aja jaoks, mis pole puhkus.',

  // entitlement
  'help.guide.entitlement.title': 'Määra oma puhkusepäevade arv',
  'help.guide.entitlement.goal': 'Ütle Vacayle, mitu puhkusepäeva sul aastas on.',
  'help.guide.entitlement.step.1':
    'Klõpsa külgriba kaardil „Puhkusepäevade õigus“ oma real lahtrit „Päevad“. Kui kaart on kokku volditud, ava see pealkirjale klõpsates.',
  'help.guide.entitlement.step.2':
    'Sisesta oma päevade arv ja vajuta Enter. Vana väärtuse säilitamiseks vajuta Escape.',
  'help.guide.entitlement.result':
    '„Alles“ arvutatakse uuesti sinu puhkusepäevade, ülekantud päevade ja kasutatud päevade põhjal.',
  'help.guide.entitlement.tip.1':
    'Igal aastal on oma puhkusepäevad, nii et siin tehtud muudatus mõjutab ainult valitud aastat.',

  // years
  'help.guide.years.title': 'Lisa aastaid ja vaheta nende vahel',
  'help.guide.years.goal': 'Planeeri juba järgmist aastat või vaata eelmist.',
  'help.guide.years.step.1':
    'Klõpsa aastast paremal oleval +-il, et lisada järgmine aasta, või vasakul oleval +-il, et lisada eelmine.',
  'help.guide.years.step.2': 'Aastate vahel liigud nooltega või nende all olevate aastanuppudega.',
  'help.guide.years.step.3':
    'Aasta eemaldamiseks vii kursor selle nupule ja klõpsa väikest miinusmärki. See kustutab ka kõik selle aasta kirjed, nii et kinnita hoolikalt.',
  'help.guide.years.result': 'Igal aastal on oma puhkusepäevad ja kirjed. Ülekandmine seob ühe aasta järgmisega.',

  // company-holidays
  'help.guide.company-holidays.title': 'Märgi ettevõtte puhkepäevad',
  'help.guide.company-holidays.goal':
    'Blokeeri päevad, mil kogu ettevõte on vaba, ilma kellegi puhkusepäevi vähendamata.',
  'help.guide.company-holidays.step.1':
    'Ava „Seaded“ ja kontrolli, et „Ettevõtte puhkepäevad“ oleks sisse lülitatud. Vaikimisi on see sees. Tööriistaribal on see režiim näha ainult siis, kui seade on sees.',
  'help.guide.company-holidays.step.2': 'Lülita ruudustikus tööriistaribal sisse „Ettevõtte puhkepäev“.',
  'help.guide.company-holidays.step.3':
    'Klõpsa päevadel. Need muutuvad merevaigukollaseks ja ilmuvad legendi. Märke eemaldamiseks klõpsa päeval uuesti.',
  'help.guide.company-holidays.result':
    'Kõik plaaniga ühendatud inimesed näevad ettevõtte puhkepäevi ja need ei vähenda kunagi väärtust „Alles“.',
  'help.guide.company-holidays.tip.1':
    'Ettevõtte puhkepäevi saab muuta iga ühendatud plaani liige, seega leppige kokku, kes neid haldab.',

  // public-holidays
  'help.guide.public-holidays.title': 'Näita riigipühi',
  'help.guide.public-holidays.goal': 'Näita oma riigi või piirkonna riigipühi ruudustikus.',
  'help.guide.public-holidays.step.1': 'Ava „Seaded“ ja lülita „Riigipühad“ sisse.',
  'help.guide.public-holidays.step.2':
    'Klõpsa „Lisa kalender“, seejärel vali riik ja vajadusel piirkond. Soovi korral saad anda sellele värvi ja nimetuse. Seejärel klõpsa „Lisa“.',
  'help.guide.public-holidays.step.3': 'Sulge „Seaded“. Pühad ilmuvad ruudustikule ja legendi.',
  'help.guide.public-holidays.result':
    'Riigipühad märgitakse kalendri värviga ja need ei vähenda kunagi sinu puhkusepäevi.',
  'help.guide.public-holidays.tip.1':
    'Saad lisada mitu kalendrit, näiteks oma piirkonna ja ühendatud kolleegi piirkonna kalendri.',

  // school-holidays
  'help.guide.school-holidays.title': 'Näita koolivaheaegu',
  'help.guide.school-holidays.goal': 'Näe oma piirkonna koolivaheaegu oma vabade päevade kõrval.',
  'help.guide.school-holidays.step.1': 'Ava „Seaded“ ja lülita „Koolivaheajad“ sisse.',
  'help.guide.school-holidays.step.2':
    'Klõpsa „Lisa kalender“ ja vali riik. Kui riigi kalender on jagatud, vali ka piirkond või rühm, seejärel klõpsa „Lisa“.',
  'help.guide.school-holidays.step.3':
    'Sulge „Seaded“. Koolivaheajad on kalendris varjutatud kalendri värviga ja nende päevade allservas on värviline riba.',
  'help.guide.school-holidays.result':
    'Koolivaheajad on ainult kalendris näha: need ei vähenda kunagi kellegi puhkusepäevi.',
  'help.guide.school-holidays.tip.1':
    'Sinu piirkonda pole loendis? Administraator saab koolivaheaegu käsitsi hallata jaotises „Administraator“, „Isikupärastamine“, „Koolivaheajad“.',

  // weekends
  'help.guide.weekends.title': 'Blokeeri nädalavahetused ja määra nädala algus',
  'help.guide.weekends.goal': 'Jäta nädalavahetused arvestusest välja ja alusta nädalat endale sobival päeval.',
  'help.guide.weekends.step.1': 'Ava „Seaded“.',
  'help.guide.weekends.step.2':
    'Lülita sisse „Blokeeri nädalavahetused“, seejärel vali jaotises „Nädalavahetuse päevad“ päevad, mis on sinu nädalavahetus.',
  'help.guide.weekends.step.3': 'Vali jaotises „Nädala alguspäev“ „E“ või „P“.',
  'help.guide.weekends.result': 'Blokeeritud päevad on ruudustikus hallid ja neid ei saa kogemata märkida.',

  // leave-year
  'help.guide.leave-year.title': 'Määra oma puhkuseaasta',
  'help.guide.leave-year.goal':
    'Arvesta puhkusepäevi majandusaasta või tööle asumise kuupäeva järgi, mitte jaanuarist detsembrini.',
  'help.guide.leave-year.step.1': 'Ava „Seaded“ ja leia „Puhkuseaasta“.',
  'help.guide.leave-year.step.2':
    'Vali „Kalender“, „Majandusaasta“ (koos alguskuu ja -päevaga) või „Tööleasumise kuupäev“ (koos kuupäevaga, mil tööle asusid).',
  'help.guide.leave-year.result':
    'Puhkusepäevade õigust, kasutatud päevi ja ülekandmist arvestatakse selle perioodi kohta ning ruudustik algab selle esimesest kuust.',
  'help.guide.leave-year.tip.1': 'See seade on isiklik: ühendatud plaanis on igaühel oma puhkuseaasta ja oma arvud.',

  // carry-over
  'help.guide.carry-over.title': 'Kanna kasutamata päevad üle',
  'help.guide.carry-over.goal': 'Kanna perioodi lõpus allesjäänud päevad järgmisse perioodi.',
  'help.guide.carry-over.step.1': 'Ava „Seaded“.',
  'help.guide.carry-over.step.2': 'Lülita „Ülekandmine“ sisse.',
  'help.guide.carry-over.result':
    'Ülekantav kogus arvutatakse kõigi sinu aastate peale uuesti ja kuvatakse puhkusepäevade all.',
  'help.guide.carry-over.tip.1': 'Väljalülitamine nullib kõigi ülekantud päevade saldod.',

  // invite
  'help.guide.invite.title': 'Planeeri koos kellegagi',
  'help.guide.invite.goal':
    'Ühenda oma plaan teise TREKi kasutaja plaaniga, et näeksite mõlema vabu päevi ühes ruudustikus.',
  'help.guide.invite.step.1': 'Klõpsa kaardil „Inimesi“ inimese ikoonil.',
  'help.guide.invite.step.2': 'Vali kasutaja ja klõpsa „Saada kutse“.',
  'help.guide.invite.step.3':
    'Kutsutu saab teavituse ja „Ühendamistaotluse“, kui ta järgmisel korral Vacay avab. Seni on kutse ootel; tühistamiseks vii kursor sellele.',
  'help.guide.invite.result':
    'Plaanid liidetakse: igal inimesel on oma värv, saate teineteisele päevi märkida ja kõik sünkroonitakse reaalajas.',
  'help.guide.invite.tip.1':
    'Ühendamise tühistamiseks klõpsa jaotises „Seaded“ „Lahuta“. Kõigi kirjed lähevad tagasi nende oma plaani.',
  'help.guide.invite.tip.2':
    'Kui teine inimene peaks ainult sinu päevi nägema, jaga plaanide ühendamise asemel oma kalendrit.',

  // share-calendar
  'help.guide.share-calendar.title': 'Jaga kalendrit ainult vaatamiseks',
  'help.guide.share-calendar.goal': 'Luba kellelgi näha, millal sa puhkad, ilma et ta saaks sinu plaani muuta.',
  'help.guide.share-calendar.step.1': 'Klõpsa kaardil „Jagatud kalendrid“ jagamisikoonil.',
  'help.guide.share-calendar.step.2': 'Vali kasutaja ja klõpsa „Jaga“. Kutset pole vaja vastu võtta.',
  'help.guide.share-calendar.step.3':
    'Sinuga jagatud kalendrid on kaardi ülaosas: klõpsa kalendril, et see peita või näidata, või vii kursor sellele ja klõpsa x-il, et see eemaldada. Jaotises „Sina jagad kasutajaga“ vii kursor nimele ja klõpsa „Lõpeta jagamine“.',
  'help.guide.share-calendar.result':
    'Sinu vabad päevad ilmuvad tema ruudustikku värvilise rõngana. Ta ei saa midagi sinu jagatust muuta.',
  'help.guide.share-calendar.tip.1':
    'Jagamine ja ühendamine on teineteisest sõltumatud: võid olla ühe inimesega ühendatud ja jagada kalendrit teistega.',
  'help.guide.share-calendar.tip.2': 'Vii kursor rõngaga päevale, et näha, kes on vaba ja kui kauaks.',

  // ── Screen: atlas ──────────────────────────────────────────────────────────
  'help.ctx.atlas.title': 'Atlas',
  'help.ctx.atlas.summary':
    'Atlas näitab maailmakaardil, kus oled reisinud: iga riik, kuhu mõni reis sind on viinud, on värviga täidetud, ja riigid, mida külastasid enne TREKi kasutamist, saad lisada käsitsi. Suumi piirkondade nägemiseks sisse, pea soovinimekirja kohtadest, mida veel näha tahad, ja vaata oma numbreid allosas olevalt klaaspaneelilt.',
  'help.ctx.atlas.bullet.1':
    'Kaart: igal külastatud riigil on oma püsiv värv, plaanitud riikidel on katkendlik piirjoon, soovinimekirja riikidel diagonaalne viirutus ja kõik teised riigid on hallid. Vii kursor riigile, et näha selle reise, kohti ning esimest ja viimast külastust.',
  'help.ctx.atlas.bullet.2':
    'Ülal olev otsing: kirjuta riik või koht. Riigi puhul, kus sa pole käinud, avaneb hüpikaken. Riigi puhul, kus oled käinud, ilmub paneelile selle kaart. Kui valid koha, avab kaart selle piirkonna, et saaksid selle märkida.',
  'help.ctx.atlas.bullet.3':
    '„Näita plaanis olevaid riike“ üleval paremal toob kaardile sinu eelseisvate reiside riigid. Lüliti on näha ainult siis, kui sul selliseid reise on.',
  'help.ctx.atlas.bullet.4':
    'All olev paneel: vaheleht „Statistika“ riikidega (nende kõrval plaanitud), piirkondade, reiside, kohtade, linnade, päevade, mandrite, sinu järjestikuse seeria ja selle aasta reisidega; vaheleht „Soovinimekiri“ kohtadega, mida tahad veel külastada; lisamooduliga „Retked“ ka vaheleht „Retked“ sinu tehtud retkede vahemaa ja tõusuga.',
  'help.ctx.atlas.bullet.5':
    'Piirkonnad: kui suumid lähedale, näitab kaart osariike ja provintse. Klõpsa ühel, et see märkida, märge eemaldada või lisada see soovinimekirja.',
  'help.ctx.atlas.bullet.6':
    'Dawarich: kui lisamoodul on ühendatud, saab statistikast vasakul oleva paneeliga märkida soove täidetuks ja lisada riike sinu salvestustest. Seda tehakse alles pärast sinu kinnitust.',
  // mark-country
  'help.guide.mark-country.title': 'Märgi riik külastatuks',
  'help.guide.mark-country.goal':
    'Lisa riik, kus käisid enne TREKi kasutamist, et see oleks kaardil ja sinu riikide arvus.',
  'help.guide.mark-country.step.1': 'Kirjuta riigi nimi kaardi ülaosas olevasse otsingukasti.',
  'help.guide.mark-country.step.2': 'Vali riik loendist. Kaart liigub selle riigini ja avaneb riigi hüpikaken.',
  'help.guide.mark-country.step.3': 'Vali „Märgi külastatuks“.',
  'help.guide.mark-country.result':
    'Riik saab kaardil värvi ja „Riigid“ arv kasvab ühe võrra. Värv jääb püsima: kui märgid veel riike, teiste riikide värvid ei muutu.',
  'help.guide.mark-country.tip.1':
    'Kui klõpsad kaardil hallil riigil, avaneb sama hüpikaken. Väikeste riikide puhul on otsing kindlam.',
  'help.guide.mark-country.tip.2':
    'Käsitsi märgitud riik loetakse alati külastatuks, olenemata sinna minevate reiside kuupäevadest.',
  // unmark-country
  'help.guide.unmark-country.title': 'Eemalda märgitud riik',
  'help.guide.unmark-country.goal': 'Eemalda kaardilt riik, mille märkisid käsitsi.',
  'help.guide.unmark-country.step.1':
    'Otsi riik üles ja vali see või klõpsa sellel kaardil. Kui oled riigi ise märkinud, küsib hüpikaken, kas see eemaldada.',
  'help.guide.unmark-country.step.2': 'Kinnita nupuga „Eemalda“.',
  'help.guide.unmark-country.result': 'Riik muutub uuesti halliks ja seda enam ei loeta.',
  'help.guide.unmark-country.tip.1':
    'Nii saab eemaldada ainult käsitsi märgitud riike. Riik, kus on reise või kohti, jääb märgituks, kuni need reisid või kohad eemaldatakse. Käsitsi märgitud riigi puhul on „Eemalda“ ka selle infokaardil paneelis.',
  // country-details
  'help.guide.country-details.title': 'Vaata, mida riigis tegid',
  'help.guide.country-details.goal': 'Ava külastatud riik ja mine reisidele, millega sinna jõudsid.',
  'help.guide.country-details.step.1': 'Kirjuta kaardi ülaosas olevasse otsingukasti riik, kus oled käinud.',
  'help.guide.country-details.step.2':
    'Vali see. Kaart liigub sinna ja all olevale paneelile ilmub kaart. Sellel on riigi lipp, märgid riigi kohtade, reiside ja külastatud piirkondadega ning silt iga riigi kolme esimese reisi kohta.',
  'help.guide.country-details.result': 'Reisi kiibil klõpsates avaneb see reis planeerijas.',
  'help.guide.country-details.tip.1':
    'Kui viid kursori kaardil riigi kohale, näed samu numbreid ning lisaks esimest ja viimast külastust.',
  // planned-countries
  'help.guide.planned-countries.title': 'Plaanitud sihtriikide näitamine',
  'help.guide.planned-countries.goal': 'Näita eelseisvate reiside riike kaardil, ilma et need külastatuks loetaks.',
  'help.guide.planned-countries.step.1':
    'Lülita üleval paremal sisse „Näita plaanis olevaid riike“. Selle kõrval olev number näitab, mitu plaanitud riiki on.',
  'help.guide.planned-countries.step.2':
    'Otsi plaanis olev riik üles ja vali see: paneelil on kirjas „Plaanis“ ja kaardi kohtspikker näitab, millal sinna lähed.',
  'help.guide.planned-countries.result':
    'Plaanis olevad riigid on katkendjoonega ääristatud, nii et neid ei saa kunagi segi ajada riikidega, kus oled juba käinud. Lüliti jätab sinu valiku meelde.',
  'help.guide.planned-countries.tip.1':
    'Riik loetakse külastatuks, kui sinna tehtav reis on alanud. Ka pooleli olev reis läheb arvesse. Kuupäevadeta reisid jäävad statistikast täiesti välja.',
  'help.guide.planned-countries.tip.2': 'Lüliti on olemas ainult siis, kui sul on tulevasi reise.',
  // regions
  'help.guide.regions.title': 'Piirkonna märkimine',
  'help.guide.regions.goal': 'Märgi lisaks riikidele ka osariigid, provintsid või prefektuurid, kus oled käinud.',
  'help.guide.regions.step.1':
    'Suumi riigile nii lähedale, et ilmuvad osariikide ja provintside piirid. Kui otsid riiki ja valid selle, liigub kaart piisavalt lähedale.',
  'help.guide.regions.step.2':
    'Klõpsa piirkonnal. Kui viid kursori piirkonnale, ilmub selle nimi. Hüpikaknas on piirkond ja selle riik.',
  'help.guide.regions.step.3': 'Vali „Märgi külastatuks“.',
  'help.guide.regions.result':
    'Piirkond värvitakse riigi värviga. Kui märgid piirkonna, loetakse külastatuks ka riik, kui see seda veel polnud.',
  'help.guide.regions.tip.1':
    'Külastatud piirkonnal klõpsates pakutakse valikut „Eemalda“, olenemata sellest, kas märkisid selle ise või lisati see mõne koha põhjal.',
  'help.guide.regions.tip.2':
    'Piirkonnad, kus sul on päris kohti, märgitakse automaatselt. Nende jaoks ei pea sa midagi tegema.',
  // search-place
  'help.guide.search-place.title': 'Koha leidmine ja selle piirkonna märkimine',
  'help.guide.search-place.goal':
    'Märgi Baieri, otsides Münchenit, ilma et peaksid teadma, millises piirkonnas linn asub.',
  'help.guide.search-place.step.1':
    'Kirjuta otsingukasti linn, vaatamisväärsus või aadress. Kõigepealt tulevad riigid, sobivad kohad on nende all jaotises „Kohad“.',
  'help.guide.search-place.step.2': 'Vali koht. Kaart liigub sinna ja leiab piirkonna, kus see paik asub.',
  'help.guide.search-place.step.3':
    'Vali selle piirkonna jaoks „Märgi külastatuks“ või, kui sa pole seal veel käinud, „Lisa soovinimekirja“.',
  'help.guide.search-place.result':
    'Märgitakse piirkond ja ka riik. Riikide puhul, mille kohta kaardipaketis piirkonnaandmeid pole, märgitakse hoopis riik ise.',
  'help.guide.search-place.tip.1':
    'Kohad tulevad samast otsingust nagu mujal TREKis, seega kasutatakse teenusepakkujat, mille administraator on seadistanud.',
  // bucket-country
  'help.guide.bucket-country.title': 'Lisa riik soovinimekirja',
  'help.guide.bucket-country.goal': 'Pea kaardil riikide soovinimekirja, mis on eraldi külastatud riikidest.',
  'help.guide.bucket-country.step.1': 'Otsi riik üles ja vali see või klõpsa sellel kaardil.',
  'help.guide.bucket-country.step.2': 'Vali „Lisa soovinimekirja“.',
  'help.guide.bucket-country.step.3':
    'Kui tead juba, millal, vali kuu ja aasta, seejärel kinnita nupuga „Lisa soovinimekirja“.',
  'help.guide.bucket-country.result':
    'Riik on kaardil diagonaalse viirutusega selles värvis, mille see saab pärast külastamist, ja see ilmub paneeli vahekaardile „Soovinimekiri“.',
  'help.guide.bucket-country.tip.1':
    'Kui riik on juba nimekirjas, pakub sama hüpikaken valikut „Eemalda soovinimekirjast“.',
  'help.guide.bucket-country.tip.2':
    'Ühe sihtkuupäeva kohta on üks kirje: sama riik võib olla nimekirjas kahe eri kuu jaoks, kuid mitte kaks korda sama kuu jaoks.',
  // bucket-place
  'help.guide.bucket-place.title': 'Koha lisamine soovinimekirja',
  'help.guide.bucket-place.goal':
    'Salvesta linn, vaatamisväärsus või aadress, mida tahad külastada, koos koordinaatide ja sihtkuupäevaga.',
  'help.guide.bucket-place.step.1': 'Ava alumisel paneelil vahekaart „Soovinimekiri“.',
  'help.guide.bucket-place.step.2': 'Klõpsa „Lisa koht“.',
  'help.guide.bucket-place.step.3':
    'Kirjuta nimi ja vajuta otsingunuppu. Vali sobiv vaste, et koht saaks koordinaadid. Võid ka ainult nime kirjutada ja otsingu vahele jätta.',
  'help.guide.bucket-place.step.4': 'Soovi korral vali kuu ja aasta ning klõpsa „Lisa“.',
  'help.guide.bucket-place.result':
    'Koht on sinu soovinimekirja tipus koos sihtkuupäevaga. Vii kursor selle kohale, et näha ×-i, millega selle eemaldad.',
  'help.guide.bucket-place.tip.1':
    'Dawarich saab soovi hiljem täidetuks märkida ainult siis, kui soovil on koordinaadid. See juhtub siis, kui sinu salvestused näitavad, et olid seal.',
  // stats
  'help.guide.stats.title': 'Statistika lugemine',
  'help.guide.stats.goal': 'Saa teada, mida paneeli numbrid loevad ja mida mitte.',
  'help.guide.stats.step.1':
    '„Riigid“ on erinevate riikide arv, kus oled tegelikult käinud. Plaanitud riigid on näidatud numbri all ja neid sinna sisse ei arvestata. „Piirkonnad“ loendab osariike ja provintse, kus oled käinud. „Reisid“, „Kohad“ ja „Päevad“ on kõigi sinu reiside kogusummad. „Linnad“ arvutatakse sinu kohtade aadresside põhjal, nii et see on hinnang.',
  'help.guide.stats.step.2':
    'Maailmajagude juures on külastatud riikide arv iga maailmajao kohta. Antarktika ilmub ritta pärast seda, kui oled seal käinud. Edasi tulevad sinu seeria (järjestikused aastad, kus on olnud vähemalt üks reis) ja selle aasta reiside arv.',
  'help.guide.stats.result': 'Numbrid uuenevad reiside planeerimise käigus automaatselt. Siin ei pea midagi haldama.',
  'help.guide.stats.tip.1':
    'Linnad võetakse aadressi tekstist, neid ei otsita eraldi üles. Seetõttu võib lühike aadress nagu „Osteria Francescana, Italy“ või prefektuuriga lõppev aadress minna arvesse linna asemel piirkonnana.',
  'help.guide.stats.tip.2':
    'Käsitsi märgitud riigid lähevad arvesse jaotises „Riigid“ ja maailmajagude all, kuid ei lisa reise, kohti ega päevi.',

  // dawarich-countries
  'help.guide.dawarich-countries.title': 'Lisa riike oma salvestustest',
  'help.guide.dawarich-countries.goal':
    'Kasuta Dawarichi, et teada saada, millistes riikides viimase aasta jooksul käisid, ja lisa kinnitatud riigid kaardile.',
  'help.guide.dawarich-countries.step.1':
    'Kui Dawarichi lisamoodul on ühendatud, ilmub kaardi alaossa statistikast vasakule Dawarichi paneel kahe paaniga. Klõpsa „Riigid“.',
  'help.guide.dawarich-countries.step.2':
    'Aken avaneb vahekaardil „Riigid“. Klõpsa „Otsi riike“: TREK loeb kuu kaupa läbi riigid ja linnad, mida sinu salvestused viimase 12 kuu jooksul hõlmavad, nii et see võib veidi aega võtta. Iga riik, mida sinu Atlases veel pole, on loendis koos lipu, linnade arvu ja esimese linna nimega. Kõik riigid on vaikimisi linnukesega märgitud. Klõpsa real, et see välja jätta.',
  'help.guide.dawarich-countries.step.3':
    'Kinnita paremas allnurgas oleva nupuga, millel on viie märgitud rea korral kirjas „Lisa 5 riiki“. Aknas on näha, mitu riiki lisati. Kui akna sulged, on kaart juba uuendatud.',
  'help.guide.dawarich-countries.result':
    'Kinnitatud riigid värvitakse kaardil ja neid loetakse jaotises „Riigid“ ning need salvestatakse Dawarichist pärinevatena. Käsitsi märgitud riigid ei muutu.',
  'help.guide.dawarich-countries.tip.1':
    'Riigid, mida Atlas juba külastatuna näitab, olgu käsitsi märgituna, reisi põhjal või varasema kontrolli järgi, jäetakse välja, nii et sinu enda märgised ei muutu kunagi. Riik, mille oled Atlasest varem eemaldanud, lisatakse uuesti, kui selle siin kinnitad.',
  'help.guide.dawarich-countries.tip.2':
    'Kui TREK ei suuda riigi nime sobitada, kuvatakse nimi ridade all ja seda ei jäeta välja. „Kontrolli uuesti“ küsib Dawarichilt uuesti. Loendi all olev märkus ütleb, et kontrolliti viimast 12 kuud. Seda ajavahemikku ei saa muuta.',
  // dawarich-wishes
  'help.guide.dawarich-wishes.title': 'Soovide täidetuks märkimine salvestuste põhjal',
  'help.guide.dawarich-wishes.goal':
    'Vaata, millistesse soovinimekirja kohtadesse oled päriselt jõudnud, ja märgi need saavutatuks koos kuupäevaga, mil sinna jõudsid.',
  'help.guide.dawarich-wishes.step.1':
    'Klõpsa kaardi alaosas statistikast vasakul olevas Dawarichi paneelis „Soovinimekiri“.',
  'help.guide.dawarich-wishes.step.2':
    'Aken avaneb vahekaardil „Soovinimekiri“. Klõpsa „Kontrolli soovinimekirja“: TREK otsib sinu salvestustest läbi kõik koordinaatidega kirjed. Soov, milleni jõudsid, on loendis koos sellega, kui lähedale jõudsid, kui kaua seal olid ja mis päeval, ning see on vaikimisi linnukesega märgitud. Juba täidetud soovi juures on kirjas „Juba täidetuks märgitud“. Loendi all olev märkus loeb kokku koordinaatideta kirjed ja näitab ka reeglit: soov loetakse täidetuks 250 m raadiuses ja pärast 20 minutit kohapeal.',
  'help.guide.dawarich-wishes.step.3':
    'Kinnita paremas allnurgas oleva nupuga, millel on kahe märgitud rea korral kirjas „Märgi 2 täidetuks“. Seejärel sulge aken ja ava selle kõrval paneeli vahekaart „Soovinimekiri“.',
  'help.guide.dawarich-wishes.result':
    'Iga soov saab rohelise linnukese viibimise kuupäevaga, mitte tänase kuupäevaga. Selle kohtspikris on kirjas „Täidetuks märgitud sinu Dawarichi salvestuste põhjal“. Tagasivõtmiseks klõpsa kuupäeval.',
  'help.guide.dawarich-wishes.tip.1':
    'Möödasõit ei lähe arvesse: pead olema kohale lähedal ja viibima seal mõnda aega. Kui sobib mitu viibimist, kasutatakse pikimat. Koordinaatideta soovi ei saa kontrollida, seega lisa kohad „Lisa koht“ otsingu kaudu, mitte ainult nime järgi.',
  'help.guide.dawarich-wishes.tip.2':
    'Üks kontroll vaatab läbi kuni 50 kirjet, alustades nendest, mis pole veel täidetuks märgitud. Kui neid on rohkem, annab TREK sellest teada. Juba täidetuks märgitud soov säilitab oma kuupäeva.',
  // ── Screen: collections ────────────────────────────────────────────────────
  'help.ctx.collections.title': 'Kogumikud',
  'help.ctx.collections.summary':
    '„Kogumikud“ on sinu teek väljaspool reise: nimega nimekirjad kohtadest, mille oled leidnud ja tahad alles hoida, igal kohal olek „Idee“, „Tahan minna“ või „Külastatud“, ning kui „Retked“ on sees, ka terved retked, mille oled reisist salvestanud. Kohad ja retked kopeeritakse reisidesse ja reisidest, neid ei seota kunagi, nii et nimekiri ja reis ei muuda teineteist.',
  'help.ctx.collections.bullet.1':
    'Vasakpoolses nimekirjade veerus on sinu enda nimekirjad, sinuga jagatud nimekirjad, kutsed, millele sa pole veel vastanud, ja „Kõik salvestatud“, mis koondab kõik sulle kuuluvate nimekirjade sisu. Üleval on „Uus nimekiri“ ja failist importimine.',
  'help.ctx.collections.bullet.2':
    'Avatud nimekirja päises on selle värv, kaanepilt, kirjeldus ja lingid, liikmed ning paremal „Muuda“ (ainult omanikule), „Ekspordi“ ja „Jaga“. Sinuga jagatud nimekirjas on nupul „Jaga“ kirjas „Jagatud“.',
  'help.ctx.collections.bullet.3':
    'Filtririda kohtade kohal: + koha lisamiseks, rippmenüüd „Olek“, „Kategooria“, „Hinnang“ ja „Sordi“, märkeruudu ikoon valiku „Vali“ jaoks ja pilveikoon valiku „Impordi reisist“ jaoks. Siltide filter on selles reas ainult siis, kui kaarti pole näha.',
  'help.ctx.collections.bullet.4':
    'Kohtade read: foto, nimi ja aadress, sildid ja kategooria ning paremal olekusilt. Üks klõps sildil muudab oleku järgmiseks.',
  'help.ctx.collections.bullet.5':
    'Paremal olev kaart: iga koordinaatidega koha kohta nööpnõel. Selle ülaribal on „Laienda kaarti“ („Näita nimekirja“, kui kaart on täisekraanil), siltide filter koos siltide haldamise nupuga ja väli „Otsi kohti“. Klõpsa nööpnõelal, et koht avada.',
  'help.ctx.collections.bullet.6':
    'Üksikasjade leht: klõpsa real, et näha kaanepilti, kategooriat, olekut, tärnhinnangut, silte, kirjeldust ja linke. Kaanepildil olev kaamera vahetab fotot. All on „Muuda“, „Kopeeri reisile“, navigeerimisnupp ja „Eemalda nimekirjast“.',
  // create-list
  'help.guide.create-list.title': 'Loo nimekiri',
  'help.guide.create-list.goal': 'Loo uus nimega nimekiri koos värvi ja kaanepildiga, et sinna kohti lisada.',
  'help.guide.create-list.step.1': 'Klõpsa nimekirjade külgriba ülaosas „Uus nimekiri“.',
  'help.guide.create-list.step.2':
    'Anna nimekirjale nimi ja vali värv. Kaanepilt, kirjeldus ja lingid on valikulised, need saad hiljem lisada nupuga „Muuda“.',
  'help.guide.create-list.step.3': 'Klõpsa „Loo“.',
  'help.guide.create-list.result':
    'Nimekiri avaneb tühjana ja selle täitmiseks on kaks võimalust: „Lisa koht“ ja „Impordi reisist“.',
  'help.guide.create-list.tip.1':
    'Kaanepildiks sobib sinu enda üles laaditud pilt või pilt, mille leiad samas aknas Unsplashi otsinguga.',
  // add-place
  'help.guide.add-place.title': 'Lisa koht',
  'help.guide.add-place.goal':
    'Leia koht ja salvesta see ühe sammuga avatud nimekirja koos nime, kategooria, oleku ja märkmetega.',
  'help.guide.add-place.step.1':
    'Klõpsa kohtade kohal oleva filtrirea alguses +-il. Tühjas nimekirjas klõpsa lehe keskel „Lisa koht“.',
  'help.guide.add-place.step.2':
    'Kirjuta koht otsinguväljale ja vali tulemus. Nimi, aadress ja koordinaadid täidetakse tulemuse põhjal.',
  'help.guide.add-place.step.3':
    'Määra olek ja soovi korral kategooria, kirjeldus ja lingid ning klõpsa „Lisa“. Aken jääb järgmise koha jaoks avatuks, „Tühista“ sulgeb selle.',
  'help.guide.add-place.result': 'Koht ilmub nimekirja ja, kui sel on koordinaadid, ka nööpnõelana kaardile.',
  'help.guide.add-place.tip.1':
    'Reisi sees saad koha inspektoris või koha menüüs oleva „Salvesta kogumikku“ abil lisada reisi koha nimekirja ilma reisist lahkumata.',
  'help.guide.add-place.tip.2':
    'Nimekiri peab olema sinu oma või selline, kus oled muutja või administraator; vaates „Kõik salvestatud“ ja ainult vaatamiseks jagatud nimekirjas +-i pole.',
  // import-from-trip
  'help.guide.import-from-trip.title': 'Impordi kohad reisist',
  'help.guide.import-from-trip.goal':
    'Too kogu reisi kohad korraga nimekirja, selle asemel et neid ükshaaval salvestada.',
  'help.guide.import-from-trip.step.1':
    'Klõpsa filtrireas pilvenoolega impordinuppu. Tühjas nimekirjas on sama nupp „Lisa koht“ kõrval.',
  'help.guide.import-from-trip.step.2': 'Vali üks oma reisidest.',
  'help.guide.import-from-trip.step.3':
    'Märgi soovitud kohad. Nimekirjas juba olevad kohad on hallid. Alguses on valitud kohad, mis pole reisi ühelgi päeval. Kui kõik kohad on juba mõnel päeval, on valitud kõik uued kohad. „Ainult uued“ peidab kohad, mis nimekirjas juba on.',
  'help.guide.import-from-trip.step.4': 'Klõpsa „Impordi“. Nupul on alati kirjas, mitu kohta lisatakse.',
  'help.guide.import-from-trip.result':
    'Kohad kopeeritakse nimekirja koos nime, aadressi, koordinaatide, kirjelduse ja kategooriaga. Reis ise ei muutu.',
  'help.guide.import-from-trip.tip.1':
    'TREK jätab nime või koordinaatide järgi tuvastatud duplikaadid automaatselt vahele, nii et kaks korda importimine on ohutu.',
  'help.guide.import-from-trip.tip.2':
    'Reisi kohtade loendis pakub valikurežiim hoopis nuppu „Salvesta kogumikku“ käsitsi valitud kohtade jaoks.',
  // place-status
  'help.guide.place-status.title': 'Määra koha olek',
  'help.guide.place-status.goal': 'Pea arvet, mis on idee, mis on valikus ja kus oled juba käinud.',
  'help.guide.place-status.step.1': 'Klõpsa koha rea paremas otsas olekunupul. „Idee“ muutub olekuks „Tahan minna“.',
  'help.guide.place-status.step.2':
    'Klõpsa uuesti, et saada „Külastatud“, ja veel kord, et minna tagasi olekule „Idee“.',
  'help.guide.place-status.result':
    'Silt ja selle värv muutuvad kohe ning nimekirja kohal oleva olekufiltri arvud uuenevad.',
  'help.guide.place-status.tip.1':
    'Olek on olemas ainult kogumikes. Kui kopeerid koha reisi, olekut kaasa ei kopeerita.',
  'help.guide.place-status.tip.2':
    'Reisist avab „Salvesta kogumikku“ akna „Salvesta nimekirja“, kus on olekusilt iga nimekirja kohta, kus koht on, ning kohtade paneeli valikuribal on „Märgi oma nimekirjades külastatuks“.',
  // place-detail
  'help.guide.place-detail.title': 'Ava salvestatud koht',
  'help.guide.place-detail.goal':
    'Vaata kõike koha kohta ja seda, mida sellega teha saad: muuta, kopeerida reisile, leida tee, eemaldada.',
  'help.guide.place-detail.step.1': 'Klõpsa koha real. Nimekirja kõrval avaneb koha infoleht ja kaart liigub kohani.',
  'help.guide.place-detail.step.2':
    'All on „Muuda“, „Kopeeri reisile“, navigeerimisnupp, mis avab koha kaardirakenduses, ja „Eemalda nimekirjast“. Kaanepildil olev kaamera asendab automaatse foto sinu enda fotoga.',
  'help.guide.place-detail.result':
    'Nupuga „Muuda“ saad otse infolehel muuta nime, kategooriat, silte, aadressi, koordinaate, kirjeldust ja linke.',
  'help.guide.place-detail.tip.1':
    'Kaanepilt laaditakse automaatselt, kui kohal pole oma pilti. Sinu enda üleslaaditud pilt võib olla JPG, PNG, GIF, WebP või HEIC kuni 20 MB. Kaamera kõrval olev prügikastiikoon taastab automaatse foto.',
  'help.guide.place-detail.tip.2':
    'Iga liige, ka sina, saab oleku all anda tärnhinnangu; filtrirea filter „Hinnang“ kasutab keskmist.',
  // labels
  'help.guide.labels.title': 'Rühmita kohad siltidega',
  'help.guide.labels.goal':
    'Anna nimekirjale lisaks ühistele kategooriatele omaenda sildid, näiteks linnaosad või päevad.',
  'help.guide.labels.step.1':
    'Klõpsa kaardi kohal olevate siltide kõrval „Lisa silt“ („Halda silte“, kui nimekirjas on juba silte). Kui kaarti pole näha, on nupp filtrirea lõpus.',
  'help.guide.labels.step.2':
    'Kirjuta nimi, vali värv ja klõpsa „Lisa silt“. Olemasolevaid silte saad samas aknas ümber nimetada, ümber värvida või kustutada.',
  'help.guide.labels.step.3':
    'Lülita sisse „Vali“, märgi kohad ja klõpsa valikuribal „Määra silt“, seejärel vali sildid ja kinnita nupuga „Määra silt“. Üksikule kohale saad silte lisada ka selle üksikasjade lehel nupuga „Muuda“.',
  'help.guide.labels.step.4':
    'Klõpsa kaardi kohal ühel või mitmel sildil, et näha loendis ja kaardil ainult kohti, millel on mõni neist siltidest. Kui klõpsad sildil uuesti, eemaldatakse see filtrist.',
  'help.guide.labels.result':
    'Siltidega kohtadel on sildid real näha. Sildifilter on olemas kõigile liikmetele, ka vaatajatele.',
  'help.guide.labels.tip.1':
    'Sildid kuuluvad nimekirjale, kus need loodi. Kui teisaldad koha teise nimekirja, eemaldatakse selle sildid.',
  'help.guide.labels.tip.2': 'Siltide haldamiseks ja määramiseks on vaja nimekirja muutmisõigust.',
  // filter-select
  'help.guide.filter-select.title': 'Filtreeri ja vali kohti',
  'help.guide.filter-select.goal': 'Filtreeri nimekirja ja muuda korraga paljusid kohti.',
  'help.guide.filter-select.step.1':
    'Kasuta filtrirea rippmenüüsid: olek, kategooria, minimaalne hinnang ja sortimisjärjekord. Oleku ja kategooria juures on näha, mitu kohta iga valikuga sobib.',
  'help.guide.filter-select.step.2':
    'Klõpsa rippmenüüde järel märkeruudu ikoonil „Vali“. Igale reale ilmub märkeruut ja ilmub valikuriba.',
  'help.guide.filter-select.step.3':
    'Märgi kohad või kasuta „Vali kõik“ kõigi filtris näidatud kohtade jaoks, seejärel vali „Määra silt“, „Teisalda nimekirja“, „Kopeeri nimekirja“, „Kopeeri reisile“ või „Kustuta“. Teisaldada ja kustutada saavad ainult nimekirja omanik või administraator.',
  'help.guide.filter-select.result': 'Toimingud kehtivad korraga kogu valikule. Paremal olev × sulgeb valikurežiimi.',
  'help.guide.filter-select.tip.1':
    '„Vali kõik“ valib ainult filtrile vastavad kohad. Kui tahad tegutseda kõigi olekuga „Tahan minna“ kohtadega, filtreeri „Tahan minna“ järgi ja klõpsa „Vali kõik“.',
  // copy-to-trip
  'help.guide.copy-to-trip.title': 'Kohtade kopeerimine reisi',
  'help.guide.copy-to-trip.goal': 'Lisa salvestatud kohad peatustena mõnele oma reisile.',
  'help.guide.copy-to-trip.step.1':
    'Lülita sisse „Vali“ ja märgi kohad linnukesega või ava üks koht ja kasuta selle infolehel nuppu „Kopeeri reisile“.',
  'help.guide.copy-to-trip.step.2': 'Klõpsa valikuribal „Kopeeri reisile“.',
  'help.guide.copy-to-trip.step.3': 'Vali reis. Pika loendi filtreerimiseks kasuta otsingukasti.',
  'help.guide.copy-to-trip.result':
    'Kohad lisatakse selle reisi kohtade loendisse koos nime, kirjelduse, kategooria, märkmete, hinna, koordinaatide, foto ja siltidega. Kogumikus ei muutu midagi.',
  'help.guide.copy-to-trip.tip.1':
    'Seda saavad teha ka jagatud nimekirja vaatajad. Kohad kopeeritakse nimekirjast ja nimekiri ise ei muutu.',
  // share-list
  'help.guide.share-list.title': 'Nimekirja jagamine',
  'help.guide.share-list.goal': 'Planeeri nimekirja reaalajas koos teiste selle TREKi kasutajatega.',
  'help.guide.share-list.step.1': 'Klõpsa oma nimekirja päises „Jaga“.',
  'help.guide.share-list.step.2': 'Vali kasutaja ja roll: „Vaataja“, „Muutja“ või „Administraator“.',
  'help.guide.share-list.step.3':
    'Klõpsa „Saada kutse“. Inimene on ootel, kuni ta võtab kutse vastu oma nimekirjade ribal või teavituse kaudu.',
  'help.guide.share-list.result':
    'Kui kutse on vastu võetud, ilmub nimekiri teisele inimesele jaotisse „Jagatud“ ja kõik muudatused sünkroonitakse reaalajas. Liikmeid ja nende rolle saad samas aknas edasi muuta.',
  'help.guide.share-list.tip.1':
    'Vaatajad saavad kohti vaadata, hinnata ja oma reisidesse kopeerida. Muutjad lisavad ja muudavad kohti ja silte. Administraatorid saavad lisaks teisaldada ja kustutada.',
  'help.guide.share-list.tip.2':
    'Inimesi saab kutsuda ja eemaldada ainult omanik. Liige saab jagatud nimekirjast ise lahkuda.',
  // export-list
  'help.guide.export-list.title': 'Ekspordi nimekiri failina',
  'help.guide.export-list.goal': 'Anna nimekiri kellelegi teises TREKi serveris või ava see kaardirakenduses.',
  'help.guide.export-list.step.1': 'Klõpsa nimekirja päises „Ekspordi“.',
  'help.guide.export-list.step.2':
    'Vali „TREKi nimekiri“, kui tahad nimekirja kasutada teises TREKis koos siltide ja olekuga, või GPX OsmAndi, Organic Mapsi, Garmini ja muude teekonnapunkte lugevate rakenduste jaoks.',
  'help.guide.export-list.result': 'Fail laaditakse alla. Jagatud nimekirja võib eksportida iga liige.',
  'help.guide.export-list.tip.1':
    'Koordinaatideta kohast ei saa GPX-teekonnapunkti. See jäetakse välja ja TREK ütleb, mitu sellist oli.',
  'help.guide.export-list.tip.2':
    'Hinnanguid, liikmeid ja üles laaditud fotosid meelega ei ekspordita: need kuuluvad sellele TREKile, mitte nimekirjale.',
  // import-file
  'help.guide.import-file.title': 'Impordi nimekiri failist',
  'help.guide.import-file.goal':
    'Impordi TREKi nimekirja fail või GPX-fail uue nimekirjana või olemasolevasse nimekirja.',
  'help.guide.import-file.step.1':
    'Klõpsa nimekirjade ribal nupu „Uus nimekiri“ kõrval olevat üleslaadimisnoolega impordinuppu.',
  'help.guide.import-file.step.2':
    'Vali fail. Enne importimist näitab TREK, mis failis on: nimi, kohtade arv ja siltide arv.',
  'help.guide.import-file.step.3':
    'Jäta valik „Uus nimekiri“ ja muuda soovi korral nime, seejärel klõpsa „Impordi“. Või vali „Lisa nimekirja“, et lisada kohad nimekirja, mida saad muuta, ja klõpsa „Lisa nimekirja“.',
  'help.guide.import-file.result':
    'Nimekiri avaneb koos imporditud kohtadega. Nimekirja importimine ainult lisab kohti. Juba olemasolevad kohad säilitavad oma oleku, märkmed ja sildid.',
  'help.guide.import-file.tip.1':
    'GPX-failist saab igast nimega teekonnapunktist koht. Rajad on jooned ja need jäetakse välja, eelvaade näitab, mitu punkti see oli.',
  'help.guide.import-file.tip.2':
    'Fail, mis pole TREKi nimekiri ega GPX, lükatakse tagasi ja TREK näitab põhjust. Kui ühte kohta ei õnnestu lugeda, jäetakse vahele ainult see koht, mitte kogu fail.',
  // edit-list
  'help.guide.edit-list.title': 'Muuda või kustuta nimekiri',
  'help.guide.edit-list.goal': 'Muuda nimekirja nime, värvi, kaanepilti, kirjeldust või linke või eemalda nimekiri.',
  'help.guide.edit-list.step.1': 'Klõpsa nimekirja päises „Muuda“. Seda nuppu näeb ainult omanik.',
  'help.guide.edit-list.step.2':
    'Muuda, mida soovid, ja klõpsa „Salvesta“. All vasakul olev prügikastiikoon „Kustuta nimekiri“ kustutab pärast kinnitust nimekirja koos kõigi selle kohtadega.',
  'help.guide.edit-list.result': 'Ülemises päises on kohe näha uus värv, kaanepilt ja kirjeldus.',
  'help.guide.edit-list.tip.1':
    'Nimekirja kustutamist ei saa tagasi võtta. Kui tahad koopiat alles hoida, ekspordi see enne.',
  // all-saved
  'help.guide.all-saved.title': 'Otsi kõigist oma salvestatud kohtadest',
  'help.guide.all-saved.goal': 'Vaata korraga kõigi oma nimekirjade kohti.',
  'help.guide.all-saved.step.1':
    'Klõpsa nimekirjade ribal „Kõik salvestatud“. Seal on ühes vaates kõigi sinu omatud või kaasomatud nimekirjade kohad.',
  'help.guide.all-saved.step.2':
    'Kirjuta kaardi kohal olevale väljale „Otsi kohti“ ja kasuta filtreid nagu igas nimekirjas. Ka „Vali“ töötab siin: teisalda, kopeeri, kopeeri reisile või kustuta mitme nimekirja ulatuses.',
  'help.guide.all-saved.result':
    'Selles vaates on kõik sinu salvestatud kohad koos. Siin ei saa kohti lisada ega importida, sest pole ühte nimekirja, kuhu need lisada.',
  'help.guide.all-saved.tip.1':
    'Sildid ja salvestatud retked kuuluvad ühele nimekirjale, nii et vaates „Kõik salvestatud“ neid ei pakuta.',

  // ── Screen: journey ───────────────────────────────────────────────────────
  'help.ctx.journey.title': 'Reisilugu',
  'help.ctx.journey.summary':
    'Reisilugu on sinu fotodele keskenduv reisipäevik. Iga reisilugu on seotud ühe või mitme reisiga ja täitub päev päeva haaval sissekannetega, kus on lugu, fotod, meeleolu ja ilm. Selles vaates on sinu reisilood, kirjutamiseks ava üks neist.',
  'help.ctx.journey.bullet.1':
    'Ülal olev bänner näitab käimasolevat või viimast reisilugu koos sissekannete, fotode ja kohtade arvuga. „Jätka kirjutamist“ avab selle tänase päeva juurest. Kui reis on just lõppenud, pakub selle kohal olev bänner „Reis just lõppes“ teha sellest reisist reisilugu.',
  'help.ctx.journey.bullet.2':
    'Pealkirja „Kõik reisilood“ all on iga reisiloo kohta kaart kaanepildi, oleku, kuupäevade ja arvudega; bänneris näidatud reisilugu seal uuesti ei ole. Klõpsa kaardil, et see avada.',
  'help.ctx.journey.bullet.3':
    'Ruudustiku viimane kaart, „Loo uus reisilugu“, alustab uut reisilugu sinu reiside põhjal.',
  // create-journey
  'help.guide.create-journey.title': 'Loo reisilugu',
  'help.guide.create-journey.goal': 'Alusta reisi kohta päevikut, kuhu reisi kohad on juba soovitustena lisatud.',
  'help.guide.create-journey.step.1': 'Klõpsa ruudustiku viimasel kaardil „Loo uus reisilugu“.',
  'help.guide.create-journey.step.2':
    'Anna reisiloole nimi ja soovi korral alapealkiri ning märgi reisid, mille juurde see kuulub. Loendur näitab, mitu kohta lisatakse.',
  'help.guide.create-journey.step.3': 'Klõpsa „Loo reisilugu“.',
  'help.guide.create-journey.result':
    'Reisipäevik avaneb. Iga seotud reisi koht on ajajoonel soovitusena, üks kord iga päeva kohta, millele see on plaanitud. Igaühe kohta saad kirjutada sissekande.',
  'help.guide.create-journey.tip.1': 'Rohkem reise saad hiljem siduda jaotises „Reisiloo seaded“.',
  'help.guide.create-journey.tip.2': 'Reisilugu toimib ka ilma reisideta, siis lisad sissekanded käsitsi.',
  // open-journey
  'help.guide.open-journey.title': 'Ava reisilugu',
  'help.guide.open-journey.goal': 'Ava reisilugu ja vaata, kust see avaneb.',
  'help.guide.open-journey.step.1':
    'Klõpsa kaardil. Igal kaardil on kaas, kuupäevad ning reisiloo sissekannete, fotode ja kohtade arv.',
  'help.guide.open-journey.result':
    'Pooleli olev reisilugu avaneb tänasel päeval või, kui täna pole veel midagi kirjutatud, viimasel sissekandel enne tänast. Lõppenud reisilugu avaneb algusest.',
  'help.guide.open-journey.tip.1':
    'Kaanepilt on reisiloo esimene foto, kui sa pole jaotises „Reisiloo seaded“ muud määranud.',
  // continue-writing
  'help.guide.continue-writing.title': 'Jätka käimasolevat reisilugu',
  'help.guide.continue-writing.goal': 'Ava otse käimasoleva reisiloo tänane leht.',
  'help.guide.continue-writing.step.1':
    'Klõpsa ülaosas bänneril „Jätka kirjutamist“. Seal on käimasolev reisilugu või, kui ükski pole käimas, viimane reisilugu.',
  'help.guide.continue-writing.result':
    'Reisilugu avaneb tänasel päeval või, kui täna pole veel midagi kirjutatud, viimasel enne tänast tehtud sissekandel.',
  'help.guide.continue-writing.tip.1':
    'Kui reis on just lõppenud, on selle kohal bänner „Reis just lõppes“: „Loo reisilugu“ alustab reisilugu, kus see reis on märgitud, „Jäta kõrvale“ peidab pakkumise selles brauseris.',

  // ── Screen: journey-detail ────────────────────────────────────────────────────────────
  'help.ctx.journey-detail.title': 'Päevik',
  'help.ctx.journey-detail.summary':
    'Üks avatud reisilugu: vasakul päevade kaupa ajajoon, paremal kaart sisse- ja väljalülitatavate kihtidega plaani, salvestatu, sissekannete ja fotode jaoks. Päises on arvud, „Stuudio“, soovituste lüliti ja ⋯ „Reisiloo seadete“ jaoks. Selle all oleva tööriistaribaga lisad sissekandeid.',
  'help.ctx.journey-detail.bullet.1':
    'Päis: tagasinool ja olekumärk, kaanepilt, pealkiri ja alapealkiri, päevade, kohtade, sissekannete ja fotode arv ning paremal „Stuudio“, silm, mis peidab või näitab soovitusi, ja ⋯ „Reisiloo seadete“ jaoks.',
  'help.ctx.journey-detail.bullet.2':
    'Tööriistariba: vahelehed „Ajajoon“ ja „Galerii“, „Otsi sellest reisiloost“ ja „Lisa sissekanne“. Vahelehel „Galerii“ on „Lisa sissekanne“ asemel „Laadi üles“.',
  'help.ctx.journey-detail.bullet.3':
    'Ajajoon: iga päeva kohta jaotis koos numbri, kohtade arvu ja +-iga sellele päevale sissekande lisamiseks. Selle all on sissekannete kaardid fotode, meeleolu, ilma ja looga ning reisidest tulevad katkendliku äärisega soovituskaardid, igaühel × selle kõrvaldamiseks.',
  'help.ctx.journey-detail.bullet.4':
    'Kaart: selle ülaosas olev kihiriba lülitab sisse ja välja „Plaan“ (õõnsad nööpnõelad ja reiside katkendlikud GPX-marsruudid), „Salvestatud“ (Dawarichist säilitatud pidevad marsruudid), „Sissekanded“ (päevade värvides nööpnõelad, mis on kuupäevade järjekorras ühendatud õhukese katkendjoonega) ja „Fotod“. Nende kõrval olev (i) selgitab kõiki sümboleid.',
  'help.ctx.journey-detail.bullet.5':
    '„Reisiloo seaded“ (⋯): kaanepilt, nimi ja alapealkiri, olek, GPX-rajad, salvestatud päevad, kohad fotodest, sissekannete väljad, tagasi lükatud soovitused, sünkroonitud reisid, kaasautorid ja see, millised reisi liikmed juurdepääsu saavad, avalik jagamine, arhiveerimine ja kustutamine.',
  'help.ctx.journey-detail.bullet.6':
    'Pika ajajoone allosas on „Tagasi üles“, päevade loendur, millega saad hüpata mis tahes päeva või sissekande juurde, ja „Mine viimase sissekande juurde“.',
  // add-entry
  'help.guide.add-entry.title': 'Sissekande kirjutamine',
  'help.guide.add-entry.goal': 'Lisa päeva lugu koos pealkirja, teksti, meeleolu ja ilmaga.',
  'help.guide.add-entry.step.1':
    'Klõpsa tööriistaribal „Lisa sissekanne“ või päeva päise paremas otsas oleval +-il, et alustada sellest päevast.',
  'help.guide.add-entry.step.2':
    'Anna sissekandele pealkiri ja kirjuta tekst. Teksti kohal oleva tööriistaribaga saad Markdownis lisada paksu ja kaldkirja, pealkirju, tsitaate, linke ja loendeid.',
  'help.guide.add-entry.step.3':
    'Kontrolli paremas veerus kuupäeva ja kellaaega, otsi asukohta või kasuta oma praegust asukohta ning vali meeleolu ja ilm.',
  'help.guide.add-entry.step.4': 'Klõpsa „Salvesta“.',
  'help.guide.add-entry.result':
    'Sissekanne ilmub ajajoonel oma päeva juurde ja kaardile nööpnõelana. Päises olevad arvud uuenevad.',
  'help.guide.add-entry.tip.1': 'Kui kirjutad soovitusse, kasutad sama redaktorit, kus koht on juba määratud.',
  'help.guide.add-entry.tip.2':
    'Kohaga sissekandel on valik „Jäta marsruudist välja“: sissekanne jääb päevikusse, kuid seda ei arvestata vahemaa ega riikide hulka ja seda ei näidata stuudio kaardil.',
  // entry-photos
  'help.guide.entry-photos.title': 'Lisa sissekandele fotosid ja videoid',
  'help.guide.entry-photos.goal': 'Lisa päevale fotosid; esimesest saab sissekande kaanepilt.',
  'help.guide.entry-photos.step.1': 'Ava sissekande menüü selle kaardil oleva ⋯ kaudu ja vali „Muuda“.',
  'help.guide.entry-photos.step.2':
    'Klõpsa „Laadi fotod üles“ ja vali failid. „Galeriist“ võtab pildid, mis on juba reisiloo galeriis. „Välised fotod“ otsib selle päeva pilte ühendatud Immichi või Synology kogust.',
  'help.guide.entry-photos.step.3':
    'Kaanepildi valimiseks vii kursor pildile ja klõpsa „Määra esimeseks“, seejärel klõpsa „Salvesta“.',
  'help.guide.entry-photos.result': 'Fotod kuvatakse kaardil ja galeriis. Esimene foto on kõikjal pisipildiks.',
  'help.guide.entry-photos.tip.1':
    'Videod lisad sissekandele samamoodi: mp4, m4v, webm või mov kuni 500 MB. Need salvestatakse muutmata kujul.',
  'help.guide.entry-photos.tip.2':
    "iPhone'i HEIC-failid teisendatakse üleslaadimisel JPEG-vormingusse, mis eemaldab neist GPS- ja kaameraandmed.",
  // suggestions
  'help.guide.suggestions.title': 'Soovituste kasutamine või kõrvaldamine',
  'help.guide.suggestions.goal':
    'Tee oma reiside kohtadest sissekanded ja jäta kõrvale need, millest sa kirjutada ei kavatse.',
  'help.guide.suggestions.step.1':
    'Soovitus on katkendliku äärisega kaart nupuga „Lisa sissekanne“: seotud reisi koht päeval, mil see oli planeeritud. Klõpsa sellel, et avada redaktor, kus koht ja päev on juba määratud.',
  'help.guide.suggestions.step.2':
    'Klõpsa kaardi paremas otsas oleval ×-il, kui sa seda ei kasuta. Kaart eemaldatakse ajajoonelt, kuid seda ei kustutata ja reisi sünkroonimine ei paku seda enam uuesti.',
  'help.guide.suggestions.step.3':
    'Mõtlesid ümber? Ava päises ⋯ kaudu „Reisiloo seaded“: „Taasta kõrvale jäetud soovitused“ näitab nende arvu ja toob kõik tagasi.',
  'help.guide.suggestions.result':
    'Ajajoonel on ainult sissekanded, mida tahad kirjutada. Päises olev silmaikoon peidab lugemise ajaks kõik soovitused korraga.',
  'help.guide.suggestions.tip.1': 'Koht, mis on plaanitud kahele päevale, annab soovituse kummalgi päeval.',
  'help.guide.suggestions.tip.2': 'Soovitusi statistikas ei arvestata, ainult kirjutatud sissekandeid.',
  // add-on-day
  'help.guide.add-on-day.title': 'Lisa sissekanne varasemale päevale',
  'help.guide.add-on-day.goal': 'Kirjuta möödunud päevast, ilma et peaksid hiljem kuupäeva muutma.',
  'help.guide.add-on-day.step.1': 'Klõpsa selle päeva päise paremas otsas oleval +-il.',
  'help.guide.add-on-day.step.2': 'Redaktor avaneb selle kuupäevaga. Kirjuta ja salvesta nagu tavaliselt.',
  'help.guide.add-on-day.result': 'Sissekanne lisatakse kohe õigele päevale.',
  'help.guide.add-on-day.tip.1':
    'Päeva sees järjekorra muutmiseks vii kursor sissekandele: selle vasakule ilmuvad „Liiguta üles“ ja „Liiguta alla“.',
  // pros-cons
  'help.guide.pros-cons.title': 'Lisa hinnang',
  'help.guide.pros-cons.goal': 'Võta päev kokku: mis oli suurepärane ja mis mitte.',
  'help.guide.pros-cons.step.1':
    'Leia redaktoris loo alt „Plussid ja miinused“. Kirjuta punkt väljale „Plussid“ või „Miinused“ ja kasuta järgmise jaoks nuppu „Lisa veel üks“.',
  'help.guide.pros-cons.step.2': 'Salvesta. Kaardil avab „Näita rohkem“ loo ja hinnangu kahe lühikese loendina.',
  'help.guide.pros-cons.result': 'Pöial üles ja pöial alla kuvatakse loo all, kus need on kiiresti näha.',
  'help.guide.pros-cons.tip.1':
    'Kui reisiloos hinnanguid ei kasutata, saad selle jaotise välja lülitada jaotises „Reisiloo seaded“, alajaotises „Sissekande väljad“.',
  // search-journey
  'help.guide.search-journey.title': 'Leia midagi pikast päevikust',
  'help.guide.search-journey.goal': 'Leia sissekanne ilma nädalate kaupa kerimata.',
  'help.guide.search-journey.step.1':
    'Kirjuta tööriistaribal väljale „Otsi sellest reisiloost“. Ajajoon filtreerub kirjutamise ajal pealkirjade, lugude, kohtade ja siltide järgi. Diakriitilised märgid ja suurtähed ei loe.',
  'help.guide.search-journey.step.2':
    'Kui tahad hoopis mõne päeva juurde hüpata, klõpsa ajajoone allosas päevade loenduril, mis on „Tagasi üles“ ja „Mine viimase sissekande juurde“ vahel.',
  'help.guide.search-journey.result':
    'Ajajoon kerib valitud päeva või sissekandeni ja kaart liigub sinna. Kuni otsinguvälja ei tühjenda, on näha ainult sobivad sissekanded.',
  'help.guide.search-journey.tip.1':
    'Käimasolev reisilugu avaneb tänasel lehel, nii et praegune leht on tavaliselt juba näha.',
  'help.guide.search-journey.tip.2':
    'Päises olev silm peidab soovitused, nii et näed ainult enda kirjutatud sissekandeid.',
  // gallery-map
  'help.guide.gallery-map.title': 'Sirvi galeriid ja kaarti',
  'help.guide.gallery-map.goal': 'Vaata kogu reisilugu piltidena ja kohtadena kaardil.',
  'help.guide.gallery-map.step.1':
    'Lülitu tööriistaribal vaatele „Galerii“. Seal on kõigi sissekannete kõik fotod ning otse galeriisse üles laaditud pildid. Klõpsa pildil, et see suurvaates avada.',
  'help.guide.gallery-map.step.2':
    'Paremal olev „Laadi üles“ lisab pildid galeriisse. Kui Immich või Synology on ühendatud, saad teegi nimega nupu kaudu pilte ka sealt valida.',
  'help.guide.gallery-map.result':
    'Nööpnõelad on oma päeva värvi ja kuupäevade järjekorras ühendatud õhukese katkendjoonega. Kaardi ülaosas olev kihiriba määrab, mida joonistatakse.',
  'help.guide.gallery-map.tip.1':
    'Reisi GPX-rajad on kaardi kihil „Plaan“ katkendjoontena. „Reisiloo seadete“ valik „Näita kõiki reiside GPX-radu“ lülitab need välja.',
  'help.guide.gallery-map.tip.2':
    'Asukohaga galeriifotod kuvatakse ka avalikul kaardil, kui jagatud on nii „Galerii“ kui ka „Kaart“.',
  // entry-fields
  'help.guide.entry-fields.title': 'Sissekande väljade väljalülitamine',
  'help.guide.entry-fields.goal': 'Näita redaktoris ainult neid välju, mida see reisilugu kasutab.',
  'help.guide.entry-fields.step.1': 'Klõpsa päise paremas ülanurgas ⋯, et avada „Reisiloo seaded“.',
  'help.guide.entry-fields.step.2':
    'Lülita jaotises „Sissekande väljad“ välja „Meeleolu“, „Ilm“ või „Plussid ja miinused“.',
  'help.guide.entry-fields.result':
    'Redaktor neid välju enam ei näita. Midagi kirjutatust ei lähe kaduma: kui lülitad välja uuesti sisse, on salvestatud väärtused jälle näha. Jagatud reisiloos on samad väljad peidetud.',
  'help.guide.entry-fields.tip.1':
    'Lülitid kehtivad iga reisiloo kohta eraldi, nii et tööreis ja puhkus võivad erineda.',
  // link-trip
  'help.guide.link-trip.title': 'Seo veel üks reis',
  'help.guide.link-trip.goal': 'Lisa päevikusse teise reisi kohad soovitustena.',
  'help.guide.link-trip.step.1': 'Klõpsa päise paremas ülanurgas ⋯, et avada „Reisiloo seaded“.',
  'help.guide.link-trip.step.2': 'Klõpsa jaotises „Sünkroonitud reisid“ „Lisa reis“.',
  'help.guide.link-trip.step.3': 'Otsi reisi nime või sihtkoha järgi ja klõpsa selle kõrval „Lingi“.',
  'help.guide.link-trip.result':
    'Reisi kohad ilmuvad ajajoonele soovitustena oma päevadele ja lisatakse kaardi kihile „Plaan“ koos reisi GPX-radadega.',
  'help.guide.link-trip.tip.1':
    'Seotud reisi kõrval olev prügikast eemaldab pärast kinnitust seose; sinu kirjutatud sissekanded jäävad alles.',
  'help.guide.link-trip.tip.2':
    'Päevaga sissekandeid arvestatakse ainult üks kord, olenemata sellest, mitu reisi seda päeva hõlmab.',
  // share-public
  'help.guide.share-public.title': 'Jaga reisilugu avalikult',
  'help.guide.share-public.goal': 'Anna TREKi kontota inimestele ainult lugemiseks mõeldud link.',
  'help.guide.share-public.step.1': 'Ava päises ⋯ kaudu „Reisiloo seaded“ ja keri jaotiseni „Avalik jagamine“.',
  'help.guide.share-public.step.2': 'Klõpsa „Loo jagamislink“.',
  'help.guide.share-public.step.3':
    'Vali, mida külastajad näevad: „Ajajoon“, „Galerii“ ja „Kaart“. Jaotises „Kaart“ lisab „Reisiplaan“ planeeritud kohad ja marsruudid ning „Salvestatud marsruudid“ salvestatud päevade marsruudid. „Kopeeri“ kopeerib lingi lõikelauale.',
  'help.guide.share-public.result':
    'Igaüks, kellel on link, näeb sisse lülitatud jaotisi ja mitte midagi muud. Väljad, mille lülitasid välja jaotises „Sissekande väljad“, on ka seal peidetud.',
  'help.guide.share-public.tip.1':
    'Fotod ilmuvad avalikule kaardile ainult siis, kui nii „Galerii“ kui ka „Kaart“ on sisse lülitatud. Kui „Kaart“ on välja lülitatud, eemaldab server enne fotode saatmist nende koordinaadid.',
  'help.guide.share-public.tip.2': 'Jagamise lõpetamiseks klõpsa „Kopeeri“ kõrval „Kustuta link“.',
  // contributors
  'help.guide.contributors.title': 'Kirjutage koos',
  'help.guide.contributors.goal': 'Luba kaasreisijal lisada omaenda sissekandeid ja fotosid.',
  'help.guide.contributors.step.1': 'Ava päises ⋯ kaudu „Reisiloo seaded“ ja leia jaotis „Kaasautorid“.',
  'help.guide.contributors.step.2': 'Klõpsa „Kutsu kaasautor“ ja otsi kasutajat nime või e-posti järgi.',
  'help.guide.contributors.step.3': 'Vali „Vaataja“ või „Muutja“ ja klõpsa „Kutsu“.',
  'help.guide.contributors.result':
    'Reisilugu ilmub nende loendisse ja nende sissekannetel on nende nimi. Kaasautori eemaldamiseks klõpsa tema kõrval oleval ×.',
  'help.guide.contributors.tip.1': 'Kaasautorid on selle TREKi kasutajad. Kõigile teistele on avalik link.',
  // studio
  'help.guide.studio.title': 'Kujunda reisilugu fotoraamatuks',
  'help.guide.studio.goal': 'Muuda reisipäevik trükitavateks lehtedeks.',
  'help.guide.studio.step.1': 'Klõpsa päises „Stuudio“. Kujundaja avaneb reisiloo peal.',
  'help.guide.studio.step.2': 'Tagasi minemiseks klõpsa ülariba paremas otsas ×. Naased sinna, kus olid.',
  'help.guide.studio.result':
    'Külgriba paneelidega on vasakul, lehepaar tööpinnal ja omadused paremal. Automaatne paigutus ehitab raamatu sinu kirjetest. Eksport loob trükivalmis PDF-i.',
  'help.guide.studio.tip.1': 'Stuudio vajab vähemalt 1024 px laiust akent ja telefonis seda ei pakuta.',
  'help.guide.studio.tip.2':
    'Raamatul on samad õigused mis reisiloos: kes saab reisilugu lugeda, saab raamatu avada, ja kes saab reisilugu muuta, saab raamatu salvestada.',
  // archive-journey
  'help.guide.archive-journey.title': 'Arhiveeri või kustuta reisilugu',
  'help.guide.archive-journey.goal': 'Sulge lõppenud reisilugu või kustuta see jäädavalt.',
  'help.guide.archive-journey.step.1': 'Klõpsa päise paremas ülanurgas ⋯, et avada „Reisiloo seaded“.',
  'help.guide.archive-journey.step.2':
    'Allosas lõpetab „Arhiveeri reisilugu“ reisiloo ja märgib selle arhiveerituks, „Taasta reisilugu“ taastab selle. „Kustuta“ eemaldab reisiloo pärast kinnitust koos kõigi sissekannete ja fotodega.',
  'help.guide.archive-journey.result':
    'Arhiveeritud reisilugu on endiselt loetav ja jagatav; see lihtsalt ei avane enam tänasel päeval.',
  'help.guide.archive-journey.tip.1':
    'Kustutamist ei saa tagasi võtta ja see ei muuda reise, millega reisilugu oli seotud.',
  'help.guide.archive-journey.tip.2': 'Kaas, nimi ja alapealkiri on samas aknas, ülaosas.',
  'help.guide.journey-status.title': 'Määra reisiloo olek',
  'help.guide.journey-status.goal':
    'Märgi reisilugu ise mustandiks, käimasolevaks või lõpetatuks, selle asemel et lähtuda reiside kuupäevadest.',
  'help.guide.journey-status.step.1': 'Klõpsa reisiloo päise paremas ülanurgas ⋯, et avada „Reisiloo seaded“.',
  'help.guide.journey-status.step.2':
    'Vali jaotises „Olek“ „Mustand“, „Käimas“ või „Lõppenud“. Valik salvestatakse kohe.',
  'help.guide.journey-status.result':
    'Reisilool on valitud olek: „Mustand“ ja „Lõppenud“ on märgina näha kaardil ja päises ning „Käimas“ reisilugu on reisilugude loendi ülaosas olevas bänneris.',
  'help.guide.journey-status.tip.1':
    '„Automaatne“ kasutab jälle seotud reiside kuupäevi. Kui seotud reisi pole, jääb automaatne reisilugu mustandiks.',
  'help.guide.journey-status.tip.2':
    'Käsitsi määratud olek kehtib, kuni sa seda muudad, ka siis, kui reisi kuupäevad muutuvad.',

  // ── Screen: journey-studio ─────────────────────────────────────────────────
  'help.ctx.journey-studio.title': 'Stuudio',
  'help.ctx.journey-studio.summary':
    'TREK Studio paigutab reisi trükitavaks fotoraamatuks. See avaneb päeviku peal: külgriba paneelidega on vasakul, töötatav lehepaar keskel ja selle omadused paremal. Automaatne paigutus koostab sinu kirjetest esimese kavandi, teema annab raamatule värvid ja kirjatüübid ning assistent oskab lehti sinuga koos kujundada. Pärast seda saad kõike liigutada, kärpida ja ümber kujundada ning iga sammu tagasi võtta.',
  'help.ctx.journey-studio.bullet.1':
    'Ülariba: vasakul reisiloo kaas ja nimi. Paremal on näha, kes veel raamatus osaleb ja kas see on salvestatud, lehe formaat, tagasivõtmine, uuesti tegemine ja kleebi, Automaatne paigutus, assistent, abi, Eksport ning nupp, mis sulgeb Stuudio.',
  'help.ctx.journey-studio.bullet.2':
    'Külgriba vasakul: Lehed, Sisu (reisi fotod ja kirjed), Paigutused, Elemendid (tekst, kujundid, jooned, raamid, ikoonid ja kleebised), Reisimine (reisist ehitatud arvud, kaardid, riigid ja märgised) ning nendest eraldi allpool Teema ja Kihid.',
  'help.ctx.journey-studio.bullet.3':
    'Tööpind: praegune lehepaar koos lõikevaru ja turvaääristega ning selle all suumiriba nuppudega Mahuta vaatesse, Raamatuvaade ja Laadi see lehepaar alla.',
  'help.ctx.journey-studio.bullet.4':
    'Omadused paremal: kõik valitud elemendi kohta, alates asukohast, suurusest ja kärpimisest kuni värvide, efektide, kihijärjestuse ja lukuni. Kui midagi pole valitud, näitab see lehe tausta, teemat, leheküljenumbreid ja dokumenti.',
  'help.ctx.journey-studio.bullet.5':
    'Raamat on paigutatud nagu trükitud raamat: kaas, üksik esimene lehekülg tühja kaanesisu vastas, lehepaarid, üksik viimane lehekülg ja tagakaas. Leheküljenumbrid loetakse esimesest leheküljest ja trükitakse nii, nagu need on näidatud.',
  'help.ctx.journey-studio.bullet.6':
    'Kujundada saab mitu inimest korraga: igaüks näeb teiste kursoreid koos nimedega. Kui salvestad versiooni, mida keegi teine on vahepeal muutnud, näitab TREK konflikti ega kirjuta tema tööd üle.',
  'help.ctx.journey-studio.bullet.7':
    'Teema: üks ilme kogu raamatule, selle paber, tint ja kolm rõhuvärvi, kirjatüübid ja motiivid. Teemaga seotud elemendid järgivad seda, kui sa teemat muudad.',
  'help.ctx.journey-studio.bullet.8':
    'Assistent: kui administraator on tehisintellekti seadistanud, avab ülaribal olev jutumull assistendi, mis koostab koos sinuga lehti, kirjutab allkirju ja kujundab raamatut ümber. Iga tema tehtud muudatus on üks tagasivõtmise samm.',
  // studio-auto-layout
  'help.guide.studio-auto-layout.title': 'Koosta raamat automaatselt',
  'help.guide.studio-auto-layout.goal':
    'Saa reisipäeviku sissekannetest ja fotodest ühe klõpsuga terviklik esimene mustand.',
  'help.guide.studio-auto-layout.step.1': 'Klõpsa ülemisel ribal „Automaatne paigutus“.',
  'help.guide.studio-auto-layout.step.2':
    'Vali „Kogu raamat“: see asendab kõik lehed, kuid säilitab pealkirja ja lehe seadistuse. „See lehepaar“ koostab uuesti ainult ekraanil oleva lehepaari. Seda pakutakse ainult lehepaaril, mis on loodud sissekandest.',
  'help.guide.studio-auto-layout.step.3':
    'Vaata lehtede riba läbi. Kui eelmine versioon meeldis rohkem, võtab „Võta tagasi“ kogu paigutuse tagasi.',
  'help.guide.studio-auto-layout.result':
    'Iga sissekanne saab oma lehepaari, õiges järjekorras, ning selle fotod, pealkiri ja tekst on sinu eest paika pandud. Iga element jääb oma sissekandega seotuks ja uueneb koos sellega, kuni sa elementi muudad.',
  'help.guide.studio-auto-layout.tip.1':
    'Mõlemad valikud on tavalised tagasivõetavad sammud, nii et võid neid proovida ja tagasi võtta.',
  'help.guide.studio-auto-layout.tip.2':
    'Kui automaatne paigutus seob elemendi sissekandega, uueneb element, kui seda sissekannet muudad. Kui muudad elementi jaotises „Omadused“, seos kaob.',
  // studio-pages
  'help.guide.studio-pages.title': 'Lisa, liiguta ja eemalda lehepaare',
  'help.guide.studio-pages.goal': 'Muuda raamatut lehekülg lehekülje haaval.',
  'help.guide.studio-pages.step.1':
    'Ava külgribal Lehed. Pisipildid näitavad raamatut järjekorras: kaas, esimene lehekülg, lehepaarid, viimane lehekülg ja tagakaas. Esimene ja viimane lehekülg on joonistatud oma kaane tühja siseküljega kõrvuti, nii nagu köidetud raamat avaneb.',
  'help.guide.studio-pages.step.2':
    'All olev „Lisa lehepaar“ lisab uue lehepaari enne viimast lehekülge. Kahe pisipildi vahel olev + lisab lehepaari sellesse kohta.',
  'help.guide.studio-pages.step.3':
    'Vii kursor pisipildile, et näha toiminguid: „Liiguta ettepoole“, „Liiguta tahapoole“, „Kopeeri lehepaar“ ja „Kustuta lehepaar“. Klõpsa pisipildil, et avada see lehepaar tööpinnal.',
  'help.guide.studio-pages.result':
    'Kaas, esimene ja viimane lehekülg ning tagakaas jäävad oma kohale. Uued lehepaarid lisatakse alati nende vahele.',
  'help.guide.studio-pages.tip.1':
    'Ülemise riba „Raamatuvaade“ näitab kogu raamatut lehtedena, nii nagu see köidetakse.',
  'help.guide.studio-pages.tip.2':
    'Leheküljenumbrid lülitad sisse jaotise „Omadused“ alajaotises „Dokument“, kui midagi pole valitud.',
  // studio-layouts
  'help.guide.studio-layouts.title': 'Rakenda lehepaarile paigutus',
  'help.guide.studio-layouts.goal': 'Anna lehepaarile valmis paigutus foto- ja tekstiraamidega.',
  'help.guide.studio-layouts.step.1':
    'Ava külgribal Paigutused. Kõigepealt tulevad kujundatud lehed: terved kaaned ja lehepaarid raamatu teemas, mida stiilinupud ühe ilmeni kitsendavad. Minu paigutused ja Sisseehitatud järgnevad nende all samas ruudustikus.',
  'help.guide.studio-layouts.step.2':
    'Klõpsa ühel neist. Tööpinnal olev lehepaar saab selle paigutuse raamid ning olemasolevad fotod ja tekst paigutatakse neisse.',
  'help.guide.studio-layouts.result':
    'Tühjad raamid on sisu kohahoidjad: lohista foto jaotisest „Sisu“ raamile või kasuta nuppu „Lisa sellele lehele“.',
  'help.guide.studio-my-layouts.title': 'Salvesta leht oma paigutusena',
  'help.guide.studio-my-layouts.goal': 'Kasuta uuesti paigutust, mille oled raamatu teistel lehtedel loonud.',
  'help.guide.studio-my-layouts.step.1': 'Korralda leht nii, nagu soovid, ja ava seejärel külgribal Paigutused.',
  'help.guide.studio-my-layouts.step.2':
    'Klõpsa jaotises Minu paigutused nupul Salvesta see leht paigutusena. Leht ilmub loendisse kaardina.',
  'help.guide.studio-my-layouts.tip.1':
    'Klõpsa oma paigutusel teisel lehel, et paigutada see leht samamoodi, oma fotode ja sõnadega.',
  'help.guide.studio-my-layouts.result':
    'Sinu paigutused salvestatakse raamatuga ja pakutakse sama liiki lehtedel: kaane oma kaantele, lehepaari oma lehepaaridele.',
  'help.guide.studio-layouts.tip.1': 'Paigutuse saab tagasi võtta nagu iga teise sammu.',
  // studio-content
  'help.guide.studio-content.title': 'Pane fotod ja sissekanded lehele',
  'help.guide.studio-content.goal': 'Lisa lehepaarile reisiloo enda fotod ja sissekanded.',
  'help.guide.studio-content.step.1':
    'Ava külgribal „Sisu“. Jaotises „Fotod“ on kõik reisiloo pildid, jaotises „Sissekanded“ sissekanded koos nende tekstiga.',
  'help.guide.studio-content.step.2':
    'Lohista foto lehekülgede paarile või tühja raami sisse või klõpsa selle all „Lisa sellele lehele“. „Laadi fotod üles“ lisab pilte, mida reisiloos veel pole; „Immichist“ või „Synologyst“ valib need ühendatud teegist.',
  'help.guide.studio-content.step.3':
    'Sissekande all panevad „Pealkiri“, „Lugu“ ja „Koht“ selle teksti lehele tekstielemendina. Kuupäev ja koordinaadid lisatakse märgistena ning seal on ka sissekande fotod.',
  'help.guide.studio-content.result':
    'Lohistatud fotost saab fotoelement. Tekst jääb sissekandega seotuks, kuni seda muudad.',
  'help.guide.studio-theme.title': 'Anna raamatule teema',
  'help.guide.studio-theme.goal': 'Määra kogu raamatu värvid ja kirjatüübid ühe korraga.',
  'help.guide.studio-theme.step.1':
    'Ava külgribal Teema. Iga kaart näitab teemat väikese lehena: selle paberit, kirjatüüpi ja kolme rõhuvärvi.',
  'help.guide.studio-theme.step.2':
    'Klõpsa teemal, et seda proovida. Kaartide all saad muuta selle paletti, valida muid kirjatüüpe ning valida motiive ja kaunistusi.',
  'help.guide.studio-theme.step.3':
    'Klõpsa nupul Rakenda raamatule või ekraanil oleva lehepaari jaoks nupul Rakenda sellele lehele.',
  'help.guide.studio-theme.tip.1':
    'Teemaga seotud elemendid võtavad selle värvid ja kirjatüübid ning järgivad seda muutmisel. Kujunda ümber ka see, mis pole veel seotud, seob esmalt ülejäänu.',
  'help.guide.studio-theme.tip.2': 'Värvid fotodelt koostab paleti reisi piltidest.',
  'help.guide.studio-theme.result':
    'Kõik seotud värvid ja kirjatüübid raamatus muutuvad korraga ning teema rakendamine on üks tagasivõtmise samm.',
  'help.guide.studio-content.tip.1': 'Jaotise „Sisu“ ülaosas olev otsinguväli filtreerib mõlemat loendit.',
  'help.guide.studio-content.tip.2':
    'Kui lohistad faili arvutist tööpinnale, laadib TREK selle üles ja paigutab ühe sammuga.',
  // studio-elements
  'help.guide.studio-elements.title': 'Lisa tekst, kujundid, ikoonid ja kleebised',
  'help.guide.studio-elements.goal': 'Kaunista lehepaari lisaks fotodele ja lugudele.',
  'help.guide.studio-elements.step.1':
    'Ava külgribal Elemendid. Kuus vahekaarti sorteerivad lisatava: Tekst, Kujundid, Jooned, Raamid, Ikoonid ja Kleebised.',
  'help.guide.studio-elements.step.2':
    'Klõpsa tekstistiilil või kujundatud pealkirjal, kujundil, joonel, tühjal raamil, ikoonil või kleebisel. Iga element asetatakse lehepaari keskele ja seejärel saad seda liigutada.',
  'help.guide.studio-elements.result':
    'Tekstielementi kirjutamiseks topeltklõpsa sellel. Jaotises „Omadused“ on font, paksus, suurus, vahed ja joondus.',
  'help.guide.studio-stickers.title': 'Kaunista kleebistega',
  'help.guide.studio-stickers.goal':
    'Lisa illustratsioone, alates vaatamisväärsustest ja toidust kuni loomade ja nooltega.',
  'help.guide.studio-stickers.step.1': 'Ava külgribal Elemendid ja vali Kleebised.',
  'help.guide.studio-stickers.step.2':
    'Otsi sõna järgi või sirvi riiuleid, seejärel klõpsa kleebisel, et see lehepaarile asetada.',
  'help.guide.studio-stickers.tip.1': 'Kui kleebis on valitud, värvib Omadused selle osad ümber ja peegeldab seda.',
  'help.guide.studio-stickers.result': 'Kleebis on joonistus, mistõttu see jääb igas suuruses terav.',
  'help.guide.studio-elements.tip.1': 'Raamid on tühjad fotokohad: lisa pilt hiljem.',
  // studio-travel
  'help.guide.studio-travel.title': 'Lisa kaarte, arve, riike ja märgiseid',
  'help.guide.studio-travel.goal': 'Muuda reis ise lehel kujundatud elementideks.',
  'help.guide.studio-travel.step.1':
    'Ava külgribal Reisimine. Neli vahekaarti sorteerivad lisatava: Arvud, Kaardid, Riigid ja Märgised.',
  'help.guide.studio-travel.step.2':
    'Iga kaart näitab elementi sinu reisi enda arvudega teema värvides: kokkuvõte plakati, pileti, liiklusmärgi või odomeetrina, kaart numbritega peatustega või riigini kärbitult, riik margi, postkaardi või nööpnõelana, kuupäev või vahemaa templi, sildi või paelana.',
  'help.guide.studio-travel.step.3':
    'Klõpsa kaardil. Element asetatakse lehepaari keskele ja seejärel saad seda liigutada ja selle suurust muuta.',
  'help.guide.studio-travel.result':
    'Element ilmub lehepaarile. Omadused muudab selle ilmet ning iga arv, kaart ja riik uueneb, kui reis muutub.',
  'help.guide.studio-text-effects.title': 'Lisa tekstile efekte',
  'help.guide.studio-text-effects.goal': 'Anna pealkirjale kontuur, vari, kõver või mustriga täidetud tähed.',
  'help.guide.studio-text-effects.step.1': 'Klõpsa lehel tekstielemendil, et see valida.',
  'help.guide.studio-text-effects.step.2':
    'Ava Omadustes Efektid, et lisada kontuur, vari või esiletõst, või täida tähed ülemineku või mustriga. Täheregister ja asend kõverdab rea ja sobitab selle raamiga.',
  'help.guide.studio-text-effects.tip.1':
    'Sobita raami kahandab teksti, kuni see mahub oma raami, nii et pikk pealkiri ei voola kunagi üle.',
  'help.guide.studio-text-effects.result': 'Efekt joonistatakse koos tekstiga, prindis samamoodi nagu ekraanil.',
  'help.guide.studio-background.title': 'Muuda lehe tausta',
  'help.guide.studio-background.goal': 'Värvi leht ühte värvi, üleminekuga või mustriga või pane selle alla foto.',
  'help.guide.studio-background.step.1':
    'Klõpsa lehe tühjal kohal, et midagi poleks valitud. Lehe taust on Omaduste ülaosas.',
  'help.guide.studio-background.step.2':
    'Vali Paber, Ühtlane, Üleminek või Muster ja värv või klõpsa fotol jaotises Foto taustaks.',
  'help.guide.studio-background.tip.1': 'Rakenda kõigile lehtedele annab raamatu igale lehele sama tausta.',
  'help.guide.studio-background.result': 'Taust ulatub lõikevarusse, nii et see prinditakse kuni lehe servani.',
  'help.guide.studio-layers.title': 'Korralda, peida ja lukusta kihtidega',
  'help.guide.studio-layers.goal': 'Näe kõike lehepaaril kihijärjestuses ja töötle seda seal.',
  'help.guide.studio-layers.step.1': 'Ava külgribal Kihid. Loendi ülaosa on lehe esiplaan.',
  'help.guide.studio-layers.step.2':
    'Lohista rida, et kihte ümber paigutada, peida element silmaga ja hoia see lukuga paigal. Vali mitu ja grupeeri need, et neid koos liigutada.',
  'help.guide.studio-layers.tip.1': 'Topeltklõpsa real, et anda elemendile oma nimi.',
  'help.guide.studio-layers.tip.2': 'Peidetud elemendid jäetakse PDF-ist välja.',
  'help.guide.studio-layers.result':
    'Tihedad lehed jäävad hõlpsasti muudetavaks ja valmis osi ei saa kogemata liigutada.',
  'help.guide.studio-travel.tip.1':
    'Jaotises Kaardid loetleb Peatused marsruudi kõik peatused. Lülita üks välja, et jätta see kaartidelt ja arvudest välja, näiteks oma koduloomaja lennujaam.',
  'help.guide.studio-travel.tip.2':
    'Riigikaart näitab ainult selle riigi peatusi, nii et riik täidab lehe ka siis, kui reis algas pika lennuga.',
  // studio-properties
  'help.guide.studio-properties.title': 'Muuda valitud elementi',
  'help.guide.studio-properties.goal': 'Liiguta, kärbi, kujunda ja järjesta elementi inspektori abil.',
  'help.guide.studio-properties.step.1':
    'Klõpsa lehepaaril elemendil. Ilmuvad pidemed suuruse muutmiseks ja pööramiseks, liigutamiseks lohista elementi.',
  'help.guide.studio-properties.step.2':
    'Paremal olev „Omadused“ näitab valitud elemendi seadeid: asukoht ja suurus, „Kärbi“ koos fookuspunktiga, mis määrab, mis raami jääb, „Täida“ või „Mahuta“, „Välimus“-filtrid, nurga raadius, raami stiil, kihtide järjekord ja „Lukusta“.',
  'help.guide.studio-properties.step.3':
    '„Tee koopia“ ja „Kustuta“ on inspektori ülaosas. Ülemise riba nupp „Võta tagasi“ tühistab kõik need muudatused.',
  'help.guide.studio-properties.result':
    'Lukustatud elementi ei saa lehel valida ega liigutada. Nii jääb valmis paigutus puutumata, kui teiste elementidega töötad.',
  'help.guide.studio-properties.tip.1': 'Shift-klõpsuga saad valida mitu elementi. Inspektor muudab neid siis korraga.',
  'help.guide.studio-properties.tip.2':
    'Kui muudad automaatse paigutuse lisatud elementi, pole see enam sissekandega seotud ega järgi selle hilisemaid muudatusi.',
  // studio-format
  'help.guide.studio-format.title': 'Vali lehevorming',
  'help.guide.studio-format.goal': 'Määra raamatu trükisuurus enne, kui paigutust koostad.',
  'help.guide.studio-format.step.1':
    'Klõpsa ülaribal lehe formaadil, redigeerimisriistade kõrval. See näitab formaadi nime ja kuju.',
  'help.guide.studio-format.step.2':
    'Vali „Ruut 21 × 21 cm“, „Ruut 30 × 30 cm“, A4 või A5 rõht- või püstpaigutuses või sisesta kohandatud laius ja kõrgus millimeetrites. Lõikevaru ja ohutu veeris on allpool.',
  'help.guide.studio-format.result':
    'Iga lehepaar joonistatakse selles suuruses, vaikimisi 3 mm lõikevaru ja 5 mm ohutu veerisega.',
  'help.guide.studio-format.tip.1':
    'Muuda kõigepealt vormingut ja käivita siis „Automaatne paigutus“. Automaatne paigutus kasutab vormingut, mis on käivitamise hetkel määratud.',
  'help.guide.studio-format.tip.2': 'Küsi trükikojalt nende lõikevaru ja ohutu ala väärtusi ning sisesta need.',
  // studio-export
  'help.guide.studio-export.title': 'Ekspordi raamat PDF-ina',
  'help.guide.studio-export.goal': 'Saa trükivalmis fail või fail ekraanil lugemiseks.',
  'help.guide.studio-export.step.1': 'Klõpsa ülemisel ribal „Ekspordi“.',
  'help.guide.studio-export.step.2':
    'Vali „Üksiklehed“, üks lehekülg lehel lugemise järjekorras, mida trükikoda vajab, või „Lehepaarid“, kaks lehekülge korraga nii, nagu raamat avaneb. „Lõikemärgid“ lisab igale servale lõikevaru ja näitab, kust lõigata.',
  'help.guide.studio-export.step.3':
    'Klõpsa „Prindivaade“. Brauser avab lehed. Faili loomiseks vali „Salvesta PDF-ina“.',
  'help.guide.studio-export.result': 'PDF, milles on nii palju lehti, kui aknas öeldi, sinu määratud lehevormingus.',
  'help.guide.studio-export.tip.1': 'PDF-i saab teha ainult arvutis, nagu ka stuudiot ennast kasutada.',
  'help.guide.studio-export.tip.2':
    'Proovitrüki jaoks ekspordi „Lehepaarid“ ilma lõikemärkideta, trükikojale „Üksiklehed“ koos lõikemärkidega.',
  // studio-spread-file
  'help.guide.studio-spread-file.title': 'Kasuta lehepaari teises raamatus uuesti',
  'help.guide.studio-spread-file.goal': 'Kopeeri meeldiv kujundus ühe reisiloo raamatust teise.',
  'help.guide.studio-spread-file.step.1':
    'Kui lehepaar on tööpinnal, klõpsa suumiriba paremas otsas „Laadi see lehepaar alla“. Fail sisaldab kujundust, mitte fotosid.',
  'help.guide.studio-spread-file.step.2':
    'Ava teises raamatus „Lehed“, klõpsa nupu „Lisa lehepaar“ kõrval „Impordi“ ja vali fail.',
  'help.guide.studio-spread-file.result':
    'Lehepaar imporditakse koos raamide ja tekstistiilidega. Lohista uue reisiloo fotod raamidesse.',
  'help.guide.studio-spread-file.tip.1':
    'Kui fail pole lehepaari kujundus, lükkab TREK selle tagasi ja näitab põhjust.',

  // ── Screen: settings (all tabs) ────────────────────────────────────────────
  'help.ctx.settings.title': 'Seaded',
  'help.ctx.settings.summary':
    'Sinu isiklikud seaded, iga teema jaoks vasakul külgribal oma vaheleht. Enamik lüliteid rakendub kohe. Nupuga „Salvesta“ vorm salvestub alles siis, kui klõpsad „Salvesta“. Miski siin ei muuda TREKi teiste jaoks.',
  'help.ctx.settings.bullet.1':
    'Vasakul olev külgriba: „Üldine“, „Välimus“, „Kaart“, „Teavitused“, „Integratsioonid“, „Võrguühenduseta“ ja „Konto“. „Pluginad“ ilmub, kui mõni plugin on aktiivne. „Teave“ on näha, kui haldaja pole seda peitnud. Versioon on näidatud allosas.',
  'help.ctx.settings.bullet.2':
    'Esimesena avaneb „Üldine“. Seal on keel, kohanimede keel, ühikud, ajavorming, nädala alguspäev ja kuvamisvaluuta ning reisikaardi käitumine. „Välimus“ sisaldab teemat, värve, loetavust, teksti suurust ja avalehe vidinaid.',
  'help.ctx.settings.bullet.3':
    '„Kaart“ määrab kaardimootori ja selle stiili; „Teavitused“ määrab, millised sündmused millisesse kanalisse lähevad; „Integratsioonid“ ühendab fototeegid, AirTraili, Dawarichi ja wandereri ning sisaldab API-võtmeid ja MCP-d; „Võrguühenduseta“ määrab, mida see seade salvestab.',
  'help.ctx.settings.bullet.4':
    'Jaotises „Konto“ on sinu profiil, parool, kaheastmeline autentimine, pääsuvõtmed ja konto kustutamise võimalus.',
  'help.ctx.settings-display.title': 'Üldine',
  'help.ctx.settings-display.summary':
    'Millega TREK avaneb, millist keelt ja ühikuid see kasutab ning kuidas reisikaart ja broneeringud käituvad. Iga muudatus rakendub kohe.',
  'help.ctx.settings-display.bullet.1':
    '„Käivitamine“: „Avaleht“ avab „Ülevaate“ või „Aktiivse reisi“; valikuga „Aktiivne reis“ määrab „Avatav vahekaart“, milline vaheleht reisil avaneb.',
  'help.ctx.settings-display.bullet.2':
    '„Keel ja piirkond“: „Kuvamisvaluuta“ (või „Reisi valuuta“, kui teisendust ei soovi), „Keel“, „Kohtade nimed“, „Temperatuuriühik“, „Vahemaaühik“, „Ajavorming“ ja „Nädala alguspäev“.',
  'help.ctx.settings-display.bullet.3':
    '„Reisimine ja kaart“: „Ava kohad rakenduses“, „Kuupäev päevapealkirjades eespool“, „Broneeringute marsruutide sildid“, „Näita alati broneeringute marsruute“, „Kompaktsed tähised planeerimata kohtadele“, „Avasta kaardil kohti“, „Hägusta broneerimiskoodid“ ja „Optimeeri marsruut majutuskohast“.',
  'help.ctx.settings-appearance.title': 'Välimus',
  'help.ctx.settings-appearance.summary':
    'Kuidas TREK selle konto puhul välja näeb: hele või tume, aktsentvärv, klaasefekt ja animatsioonid, teksti suurus ning millised vidinad on töölaual. Kõik muudatused rakenduvad kohe igas seadmes, kuhu sisse logid.',
  'help.ctx.settings-appearance.bullet.1':
    '„Teema“: „Värvirežiim“ („Hele“, „Tume“ või „Automaatne“), „Värviskeem“ ning valikuga „Kohandatud“ sinu enda rõhuvärv heleda ja tumeda režiimi jaoks koos kontrastikontrolliga.',
  'help.ctx.settings-appearance.bullet.2':
    '„Loetavus“, märgisega „Eksperimentaalne“: „Läbipaistvus“, „Vähenda liikumist“, „Tihedus“ ja „Teksti suurus“, kus on üks liugur „Kõik“ jaoks ning eraldi liugurid „Suur“, „Keskmine“, „Tavaline“ ja „Väike“ jaoks.',
  'help.ctx.settings-appearance.bullet.3':
    '„Avalehe vidinad“: eraldi lülitid „Töölaua“ („Põhivaate all“, „Parem külgriba“) ja „Mobiili“ („Põhivaate all“, „Lehe allosas“) jaoks.',
  'help.ctx.settings-appearance.bullet.4':
    'Kaartide all olev „Taasta vaikeseaded“ lähtestab kogu vahelehe vaikeväärtustele.',
  'help.ctx.settings-map.title': 'Kaart',
  'help.ctx.settings-map.summary':
    'Milline mootor joonistab reisiplaneerija ja päeviku kaardid ning millises stiilis. Leaflet on klassikaline rasterkaart, Mapbox GL lisab sinu enda tõendiga 3D-hooned ja maastiku, MapLibre GL joonistab OpenFreeMapi vektorpaane ilma tõendita. Atlas kasutab alati Leafletit.',
  'help.ctx.settings-map.bullet.1':
    '„Kaarditeenus“: Leaflet, Mapbox GL („Eksperimentaalne“) või MapLibre GL, igaühel lühike kirjeldus.',
  'help.ctx.settings-map.bullet.2':
    'Leafleti jaoks „Kaardimall“ ja „CARTO API-võti“; kahe GL-mootori jaoks „Kaardi stiil“ ning Mapbox GL-i jaoks lisaks „Mapboxi pääsuvõti“.',
  'help.ctx.settings-map.bullet.3':
    'Ainult Mapbox GL: „3D-hooned ja maastik“ ning „Kõrge kvaliteediga režiim“. Nupu „Salvesta kaart“ kohal on reaalajas eelvaade. „Salvesta kaart“ salvestab sinu valiku.',
  'help.ctx.settings-notifications.title': 'Teavitused',
  'help.ctx.settings-notifications.summary':
    'Kuidas TREK võtab sinuga ühendust väljaspool rakendust. Ülal olev tabel, kus iga sündmuse kohta on rida ja iga kanali kohta veerg, määrab, mis kuhu saadetakse. Selle all on kaardid veebihaagi, ntfy, selle seadme tõuketeavituste ja pluginate kanalite jaoks.',
  'help.ctx.settings-notifications.bullet.1':
    '„Teavitused“: lülita iga sündmus kanali kaupa sisse või välja. Lukk tähendab, et administraator on selle kõigi jaoks välja lülitanud.',
  'help.ctx.settings-notifications.bullet.2':
    '„Veebihaagi URL“: Discordi, Slacki või kohandatud veebihaak, nuppudega „Testi“ ja „Salvesta“.',
  'help.ctx.settings-notifications.bullet.3':
    'Ntfy: „Ntfy teema“, valikuline „Ntfy serveri URL“ ja juurdepääsuluba, nuppudega „Testi“ ja „Salvesta“.',
  'help.ctx.settings-notifications.bullet.4':
    '„Tõuketeavitused selles seadmes“: „Lülita selles seadmes sisse“ kehtib ainult selle brauseri kohta; „Saada test“ saadab testteavituse. Plugina kanalil on nupp „Seadista“, kuni see on seadistatud.',
  'help.ctx.settings-integrations.title': 'Integratsioonid',
  'help.ctx.settings-integrations.summary':
    'Kõik, mis ühendub TREKiga väljastpoolt: fototeegid päeviku jaoks, AirTrail lendude jaoks, Dawarich selle jaoks, kus sa tegelikult käisid, wanderer radade jaoks, ainult lugemisõigusega API-võtmed muude programmide jaoks ja MCP tehisintellekti klientide jaoks. Ühendus teise teenusega on näha alles siis, kui administraator on selle sisse lülitanud.',
  'help.ctx.settings-integrations.bullet.1':
    'Immich ja Synology Photos, AirTrail, Dawarich ja wanderer: igal kaardil on aadress ja võti, „Salvesta“ ja „Testi ühendust“ ning märk „Ühendatud“ või „Ühendamata“.',
  'help.ctx.settings-integrations.bullet.2':
    '„API-võtmed“: avaliku API ainult lugemisõigusega võtmed, igaüks piiratud valitud aladega, koos kopeeritava otspunktiga („Otspunkt“).',
  'help.ctx.settings-integrations.bullet.3':
    '„MCP seadistus“: „MCP otspunkt“ ning jaotises „OAuth 2.1 kliendid“ sinu registreeritud kliendid, kopeeritav „Kliendi seadistus“ ja „Aktiivsed OAuth-seansid“ nupuga „Tühista“.',
  'help.ctx.settings-integrations.bullet.4':
    '„API-pääsutõendid“: vana viis MCP-ga ühendamiseks, märgisega „Aegunud“; kasuta selle asemel „OAuth 2.1 kliente“.',
  'help.ctx.settings-offline.title': 'Võrguühenduseta',
  'help.ctx.settings-offline.summary':
    'Mida TREK selles seadmes hoiab, et reis avaneks ka ilma ühenduseta, ja mis juhtub, kui võrguta tehtud muudatus läheb vastuollu mujal tehtud muudatusega.',
  'help.ctx.settings-offline.bullet.1':
    '„Võrguühenduseta režiim“: „Sunni võrguühenduseta režiim“ laadib kõigepealt kõik alla, töötab seejärel ainult vahemälust ja paneb sinu muudatused järjekorda.',
  'help.ctx.settings-offline.bullet.2':
    '„Valmistu võrguühenduseta kasutamiseks“: „Laadi alla võrguühenduseta kasutamiseks“ laadib alla reisiandmed, dokumendid ja kaardipaanid; „Sünkrooni kohe uuesti“ sünkroonib käsitsi uuesti.',
  'help.ctx.settings-offline.bullet.3':
    '„Mida võrguühenduseta säilitada“: „Säilita kaardipaanid võrguühenduseta“ ja iga reisi jaoks lüliti. Lõppenud reis salvestatakse ainult siis, kui selle sisse lülitad.',
  'help.ctx.settings-offline.bullet.4':
    '„Sünkroonimiskonfliktid“ ilmub ainult siis, kui kaks muudatust on vastuolus, koos valikutega „Säilita minu oma“, „Säilita serveri oma“ ja „Konflikti korral“. „Võrguühenduseta vahemälu“ loendab reisid ning ootel või ebaõnnestunud muudatused, nuppudega „Proovi uuesti“, „Loobu“ ja „Tühjenda vahemälu“.',
  'help.ctx.settings-account.title': 'Konto',
  'help.ctx.settings-account.summary':
    'Sinu konto selles TREKis ja see, kuidas sisse logid: profiilipilt, kasutajanimi ja e-post, parool, kaheastmeline autentimine ja pääsuvõtmed. „Kustuta konto“ asub kaardi „Konto“ jaluses.',
  'help.ctx.settings-account.bullet.1':
    '„Konto“: klõpsa pildil kaameral, et pilt üles laadida, ja punasel prügikastil, et see eemaldada. „Kasutajanimi“ ja „E-post“ salvestatakse nupuga „Salvesta profiil“.',
  'help.ctx.settings-account.bullet.2':
    '„Muuda parooli“: praegune parool, uus parool kaks korda, kusjuures reeglid märgitakse kirjutamise ajal täidetuks, seejärel „Uuenda parooli“. Kui selles TREKis logitakse sisse ainult SSO kaudu, seda kaarti ei näidata.',
  'help.ctx.settings-account.bullet.3':
    'Kaheastmeline autentimine (2FA) autentimisrakenduse ja varukoodidega. „Pääsuvõtmed“ paroolita sisselogimiseks.',
  'help.ctx.settings-account.bullet.4':
    '„Kustuta konto“ asub kaardi „Konto“ jaluse vasakus servas ja küsib kinnitust. Ainus administraator ei saa ennast kustutada.',
  // language-region
  'help.guide.language-region.title': 'Määra keel, ühikud ja valuuta',
  'help.guide.language-region.goal': 'Kasuta TREKi oma keeles ja oma piirkonna vormingutega.',
  'help.guide.language-region.step.1':
    'Vali jaotises „Keel ja piirkond“ siltide reast „Keel“. TREK vahetab keele kohe kõigis seadmetes, kuhu sisse logid.',
  'help.guide.language-region.step.2':
    '„Kohtade nimed“ määrab keele, mida kohaotsing, soovitused ja aadressid kasutavad; „Sama mis rakendusel“ järgib liidese keelt.',
  'help.guide.language-region.result':
    'Kuupäevad, vahemaad ja rahasummad on sulle harjumuspärases vormingus. Jaotises „Kulud“ näidatakse summasid sinu kuvamisvaluutas ainult vaatamiseks; sisestatud summad ei muutu.',
  'help.guide.language-region.tip.1': '„Reisi valuuta“ näitab iga reisi tema enda valuutas, ilma teisendamata.',
  'help.guide.language-region.tip.2': 'Keel määrab ka päevade ja kuude nimed Vacays ja reisipäevikus.',
  // travel-map-prefs
  'help.guide.travel-map-prefs.title': 'Reisikaardi ja päevapealkirjade seadistamine',
  'help.guide.travel-map-prefs.goal': 'Vali kõigi reiside jaoks, mida reisikaart näitab ja millised on päevade päised.',
  'help.guide.travel-map-prefs.step.1':
    'Jaotises „Reisimine ja kaart“ määrab „Ava kohad rakenduses“, millise kaardirakenduse navigeerimisnupp otse avab; „Küsi iga kord“ laseb sul rakenduse iga kord valida. „Kuupäev päevapealkirjades eespool“ näitab päeva pealkirjas esimesena kalendrikuupäeva.',
  'help.guide.travel-map-prefs.step.2':
    '„Näita alati broneeringute marsruute“ joonistab kaardile kõik lennud, rongid ja muud broneeringud; „Broneeringute marsruutide sildid“ lisab mõlemasse otsa jaama või lennujaama nime. „Kompaktsed tähised planeerimata kohtadele“ teeb päevale veel planeerimata kohad väiksemaks, nii et planeeritud peatused paistavad paremini välja.',
  'help.guide.travel-map-prefs.result': 'Reisikaart kasutab neid seadeid igal reisil, kuni sa neid uuesti muudad.',
  'help.guide.travel-map-prefs.tip.1':
    'Need seaded kehtivad konto, mitte reisi kohta. Jagatud reisi iga liige näeb oma valikuid.',
  'help.guide.travel-map-prefs.tip.2':
    'Administraator saab määrata vaikeväärtused kõigile; see, mida siin muudad, kehtib sinu kohta.',
  // startup
  'help.guide.startup.title': 'TREKi avalehe valimine',
  'help.guide.startup.goal': 'Ava TREK lehel, mida kõige rohkem kasutad, mitte iga kord ülevaatel.',
  'help.guide.startup.step.1':
    'Vahelehe „Üldine“ ülaosas, jaotises „Käivitamine“, määra „Avaleht“ väärtusele „Ülevaade“ või „Aktiivne reis“.',
  'help.guide.startup.step.2': 'Valikuga „Aktiivne reis“ ilmub „Avatav vahekaart“: vali vaheleht, millel reis avaneb.',
  'help.guide.startup.result': 'Järgmisel korral avab TREK kohe selle lehe.',
  'help.guide.startup.tip.1':
    '„Aktiivne reis“ on reis, mis toimub täna, või järgmine tulev reis. See on sama reis, mida ülevaade näitab ülaosas.',
  // theme-scheme
  'help.guide.theme-scheme.title': 'Teema ja rõhuvärvi määramine',
  'help.guide.theme-scheme.goal':
    'Tee TREK heledaks või tumedaks või lase tal järgida seadet, just sulle meeldivas värvis.',
  'help.guide.theme-scheme.step.1':
    'Määra jaotises „Teema“ „Värvirežiim“ väärtusele „Hele“, „Tume“ või „Automaatne“. „Automaatne“ järgib sinu seadet.',
  'help.guide.theme-scheme.step.2':
    'Vali „Värviskeem“: „Vaikimisi“, „Suur kontrast“, „Indigosinine“, „Sinakasroheline“, „Roosa“, „Merevaigukollane“, „Violetne“ või „Kohandatud“.',
  'help.guide.theme-scheme.step.3':
    'Valikuga „Kohandatud“ vali üks värvitäppidest või määra oma rõhuvärv eraldi hele ja tume režiimi jaoks („Hele“, „Tume“). Nende kõrval olev silt näitab „Hea kontrast“ või „Madal kontrast“.',
  'help.guide.theme-scheme.result':
    'Nupud, lingid ja esiletõstud kasutavad aktsentvärvi kõikjal, igas seadmes, kuhu sisse logid.',
  'help.guide.theme-scheme.tip.1':
    'Navigeerimisribal on ka kiire heleda ja tumeda teema lüliti, see määrab sama teema.',
  'help.guide.theme-scheme.tip.2': 'Kui vaikeskeemi on raske lugeda, vali skeem „Suur kontrast“.',
  // readability
  'help.guide.readability.title': 'Kohanda loetavust ja teksti suurust',
  'help.guide.readability.goal': 'Kasuta vähem klaasiefekti ja liikumist, rohkem ruumi või suuremat teksti.',
  'help.guide.readability.step.1':
    'Jaotises „Loetavus“ muudab „Läbipaistvus“ klaaspaneelid ühtlasteks pindadeks, „Vähenda liikumist“ viib animatsioonid miinimumini ja „Tihedus“ laseb valida „Avar“ või „Kompaktne“.',
  'help.guide.readability.step.2':
    '„Teksti suurus“: lohista „Kõik“, et muuta kogu teksti suurust korraga, või määra „Suur“, „Keskmine“, „Tavaline“ ja „Väike“ eraldi. Iga suuruse juures on näidis, nii et näed tulemust lohistamise ajal.',
  'help.guide.readability.result': 'Muudatus kehtib korraga kogu rakenduses, ka kaardipaneelidel ja reisipäevikus.',
  'help.guide.readability.tip.1':
    'Mõni TREKi osa kasutab juba vähem animatsiooni, kui sinu seade on seadistatud liikumist vähendama. „Vähenda liikumist“ vähendab animatsiooni ka ülejäänud osades.',
  'help.guide.readability.tip.2':
    'Teksti suurust rakendatakse kirjataseme kaupa, nii et midagi ei lõigata ära. Tekst, mis enam ei mahu, murdub uuele reale.',
  // dashboard-widgets
  'help.guide.dashboard-widgets.title': 'Vali ülevaate vidinad',
  'help.guide.dashboard-widgets.goal': 'Näita ainult neid vidinaid, mida kasutad, eraldi arvutis ja telefonis.',
  'help.guide.dashboard-widgets.step.1':
    'Jaotises „Avalehe vidinad“ loetleb „Töölaud“ vidinad asukohtades „Põhivaate all“ ja „Parem külgriba“. „Parema külgriba“ väljalülitamine peidab kogu veeru ja paigutab ülevaate keskele; selle vidinad on tuhmid, kuni lülitad selle uuesti sisse.',
  'help.guide.dashboard-widgets.step.2':
    'Mobiilis on telefoni ülevaate jaoks omad lülitid: „Põhivaate all“ ja „Lehe allosas“.',
  'help.guide.dashboard-widgets.result':
    'Töölaud muutub kohe. Kui parem külgriba on väljas, paigutatakse töölaud keskele.',
  'help.guide.dashboard-widgets.tip.1':
    'Lisamooduli vidinad ilmuvad ainult siis, kui administraator on selle lisamooduli sisse lülitanud.',
  'help.guide.dashboard-widgets.tip.2':
    'Ülevaade ise jätab iga seadme jaoks meelde ruudustiku- või loendivaate ja sortimisjärjekorra.',
  // map-provider
  'help.guide.map-provider.title': 'Vali kaardimootor ja stiil',
  'help.guide.map-provider.goal': 'Vaheta klassikalise kaardi, vektorpaanide ja Mapboxi 3D-kaardi vahel.',
  'help.guide.map-provider.step.1':
    'Vali jaotises „Kaarditeenus“ Leaflet klassikalise 2D-kaardi jaoks mis tahes rasterpaanidega, Mapbox GL vektorpaanide jaoks koos 3D-hoonete ja maastikuga või MapLibre GL OpenFreeMapi vektorpaanide jaoks ilma tõendita.',
  'help.guide.map-provider.step.2':
    'Vali Leafleti jaoks „Kaardimall“ või GL-mootori jaoks „Kaardi stiil“ või kleebi oma URL. Mapbox GL vajab Mapboxi pääsuvõtit, CARTO mallid CARTO API-võtit; iga välja all olev link näitab, kust selle saad.',
  'help.guide.map-provider.step.3':
    'Mapbox GL-i puhul lülita sisse „3D-hooned ja maastik“ ning, kui sinu seade on piisavalt kiire, „Kõrge kvaliteediga režiim“. Vaata eelvaadet, seejärel klõpsa „Salvesta kaart“.',
  'help.guide.map-provider.result':
    'Reisiplaneerija ja päeviku kaardid kasutavad valitud mootorit. Atlas kasutab alati Leafletit.',
  'help.guide.map-provider.tip.1': 'Ilma tõendita kasutab Mapbox GL tühja kaardi näitamise asemel Leafletit.',
  'help.guide.map-provider.tip.2':
    'Võrguta kasutamiseks salvestatud kaardipaanid tulevad teenusepakkujalt, mis on allalaadimise ajal aktiivne.',
  // notification-channels
  'help.guide.notification-channels.title': 'Määra, kuhu teavitused tulevad',
  'help.guide.notification-channels.goal':
    'Saa reisi meeldetuletused ja koostöö sündmused oma telefoni või mõnda muusse tööriista.',
  'help.guide.notification-channels.step.1':
    'Veebihaagi jaoks kleebi väljale „Veebihaagi URL“ Discordi, Slacki või oma veebihaagi aadress, klõpsa „Testi“, seejärel „Salvesta“.',
  'help.guide.notification-channels.step.2':
    'Ntfy jaoks täida „Ntfy teema“ ning kui kasutad oma serverit, lisa „Ntfy serveri URL“ ja juurdepääsuluba. „Testi“ saadab kohe sõnumi; „Salvesta“ salvestab seaded.',
  'help.guide.notification-channels.step.3':
    'Lülita ülal kaardil „Teavitused“ iga sündmus kanali kaupa sisse või välja. Lukk tähendab, et administraator on selle kõigi jaoks välja lülitanud. Plugina kanalil on nupp „Seadista“, kuni see on seadistatud; „Saada test“ proovib seda.',
  'help.guide.notification-channels.result':
    'Sündmused saadetakse kanalite kaudu, mille neile sisse lülitasid. Veerg „Rakenduses“ määrab, mida navigeerimisriba kellaikoon näitab.',
  'help.guide.notification-channels.tip.1':
    'Reisi enda „Meeldetuletus“, see tähendab mitu päeva enne väljumist, määratakse reisi muutmisvormis.',
  'help.guide.notification-channels.tip.2':
    'Administraator saab kõigile määrata vaikimisi ntfy serveri; oma teema valid siiski ise.',
  // photo-providers
  'help.guide.photo-providers.title': 'Ühenda fototeek',
  'help.guide.photo-providers.goal': 'Lase reisipäevikul laadida päeva fotod Immichist või Synology Photosest.',
  'help.guide.photo-providers.step.1':
    'Leia jaotisest „Integratsioonid“ Immichi või Synology Photosi kaart ja sisesta küsitud andmed: Immichi jaoks „Serveri URL“ ja „API-võti“, Synology Photosi jaoks „Kasutajanimi“ ja „Parool“. Immich saab üleslaadimisel kopeerida reisiloo fotod ka Immichi teeki.',
  'help.guide.photo-providers.step.2': 'Klõpsa „Testi ühendust“, seejärel „Salvesta“. Märk muutub olekuks „Ühendatud“.',
  'help.guide.photo-providers.result':
    'Sissekande redaktori vahekaart „Välised fotod“ otsib ühendatud teegist sissekande päeva fotosid, alustades sissekande asukohale kõige lähematest.',
  'help.guide.photo-providers.tip.1':
    'Ühendus kuulub ainult sinu kontole: reisiloo teised liikmed ühendavad oma teegid ise.',
  'help.guide.photo-providers.tip.2':
    'Teenusepakkuja, mille fotodel pole GPS-andmeid, töötab samuti. Loend sorditakse siis aja järgi.',
  // api-keys
  'help.guide.api-keys.title': 'Loo API-võti',
  'help.guide.api-keys.goal': 'Luba teistel programmidel avaliku API kaudu sinu reise lugeda.',
  'help.guide.api-keys.step.1':
    'Klõpsa jaotises „API-võtmed“ nuppu „Loo võti“, anna võtmele „Nimi“, mis ütleb, kus seda kasutatakse, ja jäta jaotises „Mida see võti võib lugeda“ alles ainult vajalikud alad. Klõpsa „Loo“.',
  'help.guide.api-keys.step.2':
    'Kopeeri võti aknast „API-võti loodud“: seda näidatakse ainult üks kord. Klõpsa „Valmis“. Kasutatav „Otspunkt“ on loendi all.',
  'help.guide.api-keys.result':
    'Võtmega programmid saavad lugeda valitud alasid ega muuda kunagi midagi. Loendis on näha, millal iga võti loodi ja viimati kasutati, ning prügikast kustutab võtme.',
  'help.guide.api-keys.tip.1':
    'Kasuta iga tööriista jaoks eraldi võtit, et saaksid võtme tühistada ilma teisi tööriistu mõjutamata.',
  'help.guide.api-keys.tip.2':
    'Kui tahad, et tehisintellekti klient saaks asju muuta, kasuta selle asemel MCP-d koos OAuthiga; API-võtmed võimaldavad ainult lugeda.',
  // mcp-oauth
  'help.guide.mcp-oauth.title': 'Ühenda AI-assistent MCP kaudu',
  'help.guide.mcp-oauth.goal': "Anna Claude'ile, IDE-le või mõnele muule MCP-kliendile juurdepääs oma reisidele.",
  'help.guide.mcp-oauth.step.1': 'Kopeeri jaotises „MCP seadistus“ oma kliendi jaoks „MCP otspunkt“.',
  'help.guide.mcp-oauth.step.2':
    'Klõpsa jaotises „OAuth 2.1 kliendid“ „Uus klient“ ja vali kiireelseadistus, näiteks Claude Desktop või Cursor, või täida ise „Rakenduse nimi“, „Ümbersuunamise URI-d“ ja „Lubatud õiguste ulatused“; brauserita serveri puhul vali masinklient. Klõpsa „Registreeri klient“ ja kopeeri „Kliendi saladus“: seda näidatakse ainult üks kord.',
  'help.guide.mcp-oauth.step.3':
    'Igal kliendil on nupud „Vaheta saladus“ ja „Kustuta klient“. „Aktiivsed OAuth-seansid“ loetleb sisselogitud kliendid koos nupuga „Tühista“. „Kliendi seadistus“ avaneb ja näitab valmis koodilõiku klientidele, mis kasutavad JSON-i.',
  'help.guide.mcp-oauth.result':
    'Klient saab sinu nimel lugeda ja muuta seda, mida tema õigused lubavad, ning iga toiming on näha sinu nime all.',
  'help.guide.mcp-oauth.tip.1':
    'Õiguste ulatus piirab, mida klient teha saab: anna kliendile ainult lugemisõigus, kuni ta vajab rohkem.',
  'help.guide.mcp-oauth.tip.2': 'Administraator saab MCP kogu instantsis välja lülitada. Siis seda jaotist ei kuvata.',
  // offline-prepare
  'help.guide.offline-prepare.title': 'Kasuta reise võrguühenduseta',
  'help.guide.offline-prepare.goal': 'Salvesta oma reisid ja nende kaardid sellesse seadmesse enne, kui ühendus kaob.',
  'help.guide.offline-prepare.step.1':
    'Jäta jaotises „Mida võrguühenduseta säilitada“ sisse „Säilita kaardipaanid võrguühenduseta“ ja lülita sisse reisid, mida tahad selles seadmes hoida. Lõppenud reis salvestatakse ainult siis, kui selle sisse lülitad.',
  'help.guide.offline-prepare.step.2':
    'Klõpsa uuesti ülaosas jaotises „Valmistu võrguühenduseta kasutamiseks“ nuppu „Laadi alla võrguühenduseta kasutamiseks“. See laadib alla reisiandmed, dokumendid ja kaardipaanid ning näitab, mitu reisi salvestati.',
  'help.guide.offline-prepare.step.3':
    '„Sunni võrguühenduseta režiim“ laadib veel korra alla ja töötab seejärel ainult selle seadme andmetega, nii et saad enne lahkumist kontrollida, kas kõik on olemas.',
  'help.guide.offline-prepare.result':
    'Reisid avanevad ka ilma ühenduseta. Tehtud muudatused jäävad järjekorda ja saadetakse ära, kui oled jälle võrgus.',
  'help.guide.offline-prepare.tip.1':
    'Kõige rohkem ruumi võtavad kaardipaanid; lülita need välja, et hoida ainult reisiandmeid ja dokumente.',
  'help.guide.offline-prepare.tip.2':
    'Kõige sujuvamaks käivitamiseks ilma võrguta paigalda TREK brauserist rakendusena.',
  // offline-conflicts
  'help.guide.offline-conflicts.title': 'Otsusta sünkroonimiskonflikti korral, milline versioon jääb',
  'help.guide.offline-conflicts.goal':
    'Vali, kuidas TREK lahendab konflikti võrguta tehtud muudatuse ja mujal tehtud muudatuse vahel.',
  'help.guide.offline-conflicts.step.1':
    'Kui võrguühenduseta tehtud muudatus on vastuolus uuemaga, ilmub jaotise „Võrguühenduseta“ ülaossa „Sünkroonimiskonfliktid“. Klõpsa iga muudatuse juures „Säilita minu oma“ või „Säilita serveri oma“.',
  'help.guide.offline-conflicts.step.2':
    'Samal kaardil määrab „Konflikti korral“, mis juhtub järgmisel korral: „Küsi iga kord“, „Säilita alati minu versioon“ või „Säilita alati serveri versioon“.',
  'help.guide.offline-conflicts.result':
    'Valikuga „Küsi iga kord“ jääb konflikt jaotisse „Sünkroonimiskonfliktid“, kuni teed valiku. Kahe teise valiku puhul lahendab TREK selle automaatselt.',
  'help.guide.offline-conflicts.tip.1':
    '„Tühjenda vahemälu“ eemaldab ainult selles seadmes oleva koopia. Serveris ei muutu midagi.',
  // profile
  'help.guide.profile.title': 'Muuda oma profiili',
  'help.guide.profile.goal': 'Uuenda oma nime, e-posti ja pilti.',
  'help.guide.profile.step.1':
    'Klõpsa kaardil „Konto“ oma pildil oleval kaameral, et pilt üles laadida; punane prügikast eemaldab selle ja toob tagasi sinu algustähe.',
  'help.guide.profile.step.2': 'Muuda pildi all välju „Kasutajanimi“ ja „E-post“.',
  'help.guide.profile.result': 'Sinu nimi ja pilt uuenevad korraga kõikjal, ka jagatud reisidel.',
  'help.guide.profile.tip.1': 'SSO kaudu seotud kontol on märk SSO ja „Seotud teenusega“ koos teenusepakkuja nimega.',
  // password
  'help.guide.password.title': 'Muuda oma parooli',
  'help.guide.password.goal': 'Määra uus parool.',
  'help.guide.password.step.1':
    'Sisesta jaotises „Muuda parooli“ „Praegune parool“, seejärel „Uus parool“ ja sama uuesti väljale „Kinnita uus parool“. All olev loend märgib kirjutamise ajal iga täidetud reegli.',
  'help.guide.password.step.2': 'Klõpsa „Uuenda parooli“.',
  'help.guide.password.result':
    'Uus parool kehtib kohe. Kõik teised seadmed logitakse välja, sinu MCP API-tõendid kustutatakse ja OAuth-kliendid peavad uuesti sisse logima; see seade jääb sisselogituks.',
  'help.guide.password.tip.1':
    'Kui selles TREKis logitakse sisse ainult SSO kaudu, pole TREKi parooli ega kaarti „Muuda parooli“.',
  // mfa
  'help.guide.mfa.title': 'Lülita sisse kaheastmeline autentimine',
  'help.guide.mfa.goal': 'Kaitse kontot autentimisrakenduse koodiga.',
  'help.guide.mfa.step.1': 'Klõpsa jaotises „Kaheastmeline autentimine (2FA)“ „Seadista autentimisrakendus“.',
  'help.guide.mfa.step.2':
    'Skanni QR-kood rakendusega või sisesta salavõti käsitsi, seejärel kirjuta rakenduse näidatud kuuekohaline kood ja klõpsa „Luba 2FA“.',
  'help.guide.mfa.step.3':
    'Salvesta varukoodid nupuga „Kopeeri koodid“, „Laadi TXT alla“ või „Prindi / PDF“, seejärel klõpsa „OK“. Iga kood töötab üks kord. Kasuta koodi, kui sul pole telefoni käepärast.',
  'help.guide.mfa.result': 'Igal sisselogimisel küsitakse pärast parooli ka koodi.',
  'help.guide.mfa.tip.1': '„Keela 2FA“ nõuab sinu parooli ja kehtivat koodi või kasutamata varukoodi.',
  'help.guide.mfa.tip.2': 'Administraator saab 2FA kõigile kohustuslikuks teha. Siis ei saa seda siin välja lülitada.',
  // passkeys
  'help.guide.passkeys.title': 'Logi sisse pääsuvõtmega',
  'help.guide.passkeys.goal': 'Kasuta parooli asemel oma seadme sõrmejälge, näotuvastust või PIN-koodi.',
  'help.guide.passkeys.step.1':
    'Klõpsa jaotises „Pääsuvõtmed“ „Lisa pääsuvõti“, kinnita oma praegune parool ja anna pääsuvõtmele nimi, mis ütleb, millise seadmega on tegu, seejärel järgi seadme juhiseid.',
  'help.guide.passkeys.step.2':
    'Iga pääsuvõtme juures on näha, kas see on „Sünkroonitud“ või seotud seadmega („See seade“), ja millal seda viimati kasutati. „Nimeta ümber“ muudab nime ja kustutusnupp eemaldab pääsuvõtme pärast parooli sisestamist.',
  'help.guide.passkeys.result': 'Sisselogimislehel pakutakse pääsuvõtit. Parooliga saad endiselt sisse logida.',
  'help.guide.passkeys.tip.1':
    'Pääsuvõti salvestatakse seadmesse või selle paroolihaldurisse, nii et lisa igale seadmele oma pääsuvõti.',
  'help.guide.passkeys.tip.2':
    'Pääsuvõtmed on näha alles siis, kui administraator on need sisse lülitanud. Kuni serveril pole WebAuthn-domeeni, näitab kaart nupu „Lisa pääsuvõti“ asemel sellekohast teadet.',
  // delete-account
  'help.guide.delete-account.title': 'Kustuta oma konto',
  'help.guide.delete-account.goal': 'Kustuta oma konto ja andmed, mis kuuluvad ainult sulle.',
  'help.guide.delete-account.step.1':
    'Klõpsa kaardi „Konto“ jaluse vasakus servas „Kustuta konto“, seejärel „Kustuta jäädavalt“.',
  'help.guide.delete-account.result':
    'Sinu konto kustutatakse koos sulle kuuluvate reiside, kohtade ja failidega. Teistele kuuluvad reisid jäävad alles.',
  'help.guide.delete-account.tip.1':
    'Kui oled ainus administraator, näitab TREK teadet „Kustutamine pole võimalik“: määra enne mõni teine kasutaja administraatoriks.',
  'help.guide.delete-account.tip.2':
    'Seda ei saa tagasi võtta. Ekspordi enne kinnitamist kõik, mida tahad alles hoida.',

  // ── Screen: admin (all tabs) ───────────────────────────────────────────────
  'help.ctx.admin.title': 'Administraator',
  'help.ctx.admin.summary':
    'Kogu TREKi serveri seaded kõigile kasutajatele: kes ja kuidas tohib sisse logida, mis on sisse lülitatud, kus failid asuvad, kuidas server inimestega ühendust võtab ja kuidas seda varundatakse. Seda lehte näevad ainult administraatorid. Külgribal on vahelehed rühmitatud jaotistesse „Kasutajad“, „Seadistus“, „Integratsioonid“ ja „Hooldus“ ning iga vaheleht on eraldi ekraan.',
  'help.ctx.admin.bullet.1':
    'Päise paremas servas on kasutajate, reiside, kohtade ja failide arv. Selle all ilmub bänner „Uuendus saadaval“, kui TREKist on uuem versioon saadaval.',
  'help.ctx.admin.bullet.2':
    '„Kasutajad“ ja „Kasutaja vaikevalikud“: kontod, kutselingid ja õigused ning seaded ja kaart, millega uus konto alustab.',
  'help.ctx.admin.bullet.3':
    '„Isikupärastamine“, „Seaded“, „Lisamoodulid“, „Pluginad“ ja „Salvestusruum“: pakkimismallid, kategooriad ja koolivaheajad; sisselogimine, pääsuvõtmed, 2FA, API-võtmed ja otsinguteenused; funktsioonimoodulid; kolmanda osapoole pluginad; üleslaadimiste asukoht.',
  'help.ctx.admin.bullet.4':
    '„Teavitused“, „MCP juurdepääs“ ja GitHub: kanalid, mida kasutajad saavad valida, ja nende vaikeseaded, tehisintellekti klientide tõendid ja seansid ning versioonide ajalugu.',
  'help.ctx.admin.bullet.5':
    '„Varundamine“ ja „Audit“: käsitsi ja ajakava järgi tehtavad varukoopiad ning turvalisuse seisukohalt oluliste sündmuste logi.',
  'help.ctx.admin-users.title': 'Kasutajad',
  'help.ctx.admin-users.summary':
    'Kõik selle TREKi kontod koos rolli, e-posti ja viimase aktiivsusega, kutselingid, millega saab suletud serveris registreeruda, ning see, kes mida reisidel teha tohib.',
  'help.ctx.admin-users.bullet.1':
    'Tabel: kasutaja, e-post, roll, loomisaeg ja „Viimati aktiivne“ ning igal real „Muuda kasutajat“ ja „Kustuta kasutaja“. Roheline täpp avataril tähendab, et inimene on praegu võrgus; sinu enda real on „(Sina)“.',
  'help.ctx.admin-users.bullet.2':
    'Kaardi „Kasutajad“ paremas ülanurgas olev „Loo kasutaja“ lisab konto käsitsi parooliga, mille annad kasutajale.',
  'help.ctx.admin-users.bullet.3':
    'All olevad „Kutselingid“: registreerimislingid kasutuspiirangu, aegumisaja ja soovi korral reisiga, millega uus kasutaja registreerudes liitub.',
  'help.ctx.admin-users.bullet.4':
    'All olev „Õiguste seaded“: iga toimingu puhul, kes tohib seda teha („Kõik“, „Reisi liikmed“, „Reisi omanik“ või „Ainult administraator“). Salvestamiseks klõpsa kaardi ülaosas „Salvesta“.',
  'help.ctx.admin-defaults.title': 'Kasutaja vaikevalikud',
  'help.ctx.admin-defaults.summary':
    'Millega uus konto alustab, et keegi ei peaks seda kõigepealt seadistama: värvirežiim, ühikud, ajavorming, nädala alguspäev, kuvamisvaluuta ja hägustatud broneerimiskoodid ning lisaks kaart, selle võtmed ja marsruutimisserverid.',
  'help.ctx.admin-defaults.bullet.1':
    'Vasakul olev „Kasutajate vaikeseaded“: „Värvirežiim“, „Temperatuuriühik“, „Vahemaaühik“, „Ajavorming“, „Nädala alguspäev“, „Kuvamisvaluuta“ ja „Hägusta broneerimiskoodid“.',
  'help.ctx.admin-defaults.bullet.2':
    'Paremal olev „Kaart“: „Kaardimall“, „Ühine CARTO võti“, „Oma marsruutimootor“ ja „Oma Valhalla server“, eelvaade, seejärel „Kaardimootor“ koos väljadega „Kaardi stiil“, „Ühine Mapboxi pääsutõend“, „3D-hooned ja maastik“ ning „Kõrge kvaliteediga režiim“.',
  'help.ctx.admin-config.title': 'Isikupärastamine',
  'help.ctx.admin-config.summary':
    'Seaded, mis on ühised kõigile selle instantsi reisidele: pakkimismallid, kohtade ja kogumike kategooriad ning koolivaheaegade kataloog, mida Vacay kasutab.',
  'help.ctx.admin-config.bullet.1':
    '„Pakkimismallid“: nimega kategooriate ja esemete loendid, millest reisi pakkimisnimekiri saab alustada.',
  'help.ctx.admin-config.bullet.2':
    '„Kategooriad“: kogu TREKis, koha inspektorist kogumikeni kasutatavate kategooriate nimi, ikoon ja värv, igaüht muudetakse eelvaatega dialoogis.',
  'help.ctx.admin-config.bullet.3':
    'Koolivaheajad: riikide ja piirkondade kataloog koos nende vaheaegadega, mida kõik saavad Vacays valida.',
  'help.ctx.admin-settings.title': 'Seaded',
  'help.ctx.admin-settings.summary':
    'Kuidas inimesed sisse logivad ja milliseid väliseid teenuseid server tohib kasutada. Vasakul: „Autentimisviisid“, „Pääsuvõtmega sisselogimine“, „Nõua kaheastmelist autentimist (2FA)“ ja „Ühekordne sisselogimine (OIDC)“. Paremal: „Lubatud failitüübid“ ja „API-võtmed“ koos otsingu- ja ühistranspordi teenusepakkujatega. „Ohutsoon“ on all.',
  'help.ctx.admin-settings.bullet.1':
    '„Autentimisviisid“: „Parooliga sisselogimine“, „Parooliga registreerumine“ ja, kui OIDC on seadistatud, „SSO-ga sisselogimine“ ja „SSO kontode automaatne loomine“. „Nõua kaheastmelist autentimist (2FA)“ on eraldi kaardil.',
  'help.ctx.admin-settings.bullet.2':
    '„Pääsuvõtmega sisselogimine“: „Luba pääsuvõtmega sisselogimine“, „Teenuseosutaja ID (domeen)“ ja „Lubatud päritolud“. „Ühekordne sisselogimine (OIDC)“: „Kuvatav nimi“, „Väljastaja URL“, valikuline Discovery URL, „Kliendi ID“ ja „Kliendi saladus“.',
  'help.ctx.admin-settings.bullet.3':
    '„API-võtmed“: esimesena on TREK Places API, mis ei vaja võtit. Selle all on „Google Mapsi API-võti“ (nuppudega „Testi“ ja „Milleks võtit tohib kasutada“), Unsplashi ja Amapi võti ning kaardi allosas üks ühine „Salvesta“.',
  'help.ctx.admin-settings.bullet.4':
    '„Ühistranspordi teenusepakkuja“ ja „Kohaotsingu teenusepakkuja“ määravad, kes vastab ühistranspordi- ja kohaotsingutele; „Kohaotsingu logi“ salvestab, milline tulemus valiti; „Lubatud failitüübid“ piirab üleslaadimisi.',
  'help.ctx.admin-addons.title': 'Lisamoodulid',
  'help.ctx.admin-addons.summary':
    'TREKi funktsioonimoodulid, igaüks oma lülitiga: „Pakkimine“, „Eelarve“, „Dokumendid“, Vacay, Atlas, „Koostöö“, „Reisilugu“, „Kogumikud“, „Autoreis“, MCP, AirTrail, Dawarich ja „Tehisintellektiga töötlemine“. Väljas tähendab, et navigeerimiskirje, marsruudid ja API eemaldatakse kõigi jaoks.',
  'help.ctx.admin-addons.bullet.1':
    'Iga lisamooduli kohta paan koos lülitiga ja, kui moodulil on valikuid, nende jaoks alamread.',
  'help.ctx.admin-addons.bullet.2':
    'Siin on paanidena ka fototeenused ja dokumenditeenused, nii saad kasutajatele pakkuda Immichit või Synologyt.',
  'help.ctx.admin-addons.bullet.3': '„Kottide haldusel“ on paanide all oma lüliti.',
  'help.ctx.admin-plugins.title': 'Pluginad',
  'help.ctx.admin-plugins.summary':
    'Kolmanda osapoole pluginad, mis töötavad TREKi kõrval omaette protsessis, igaüks nende õigustega, mida see paigaldamisel küsis. Paigalda kataloogist, laadi üles pakett või lingi plugina arendamise ajaks kaust.',
  'help.ctx.admin-plugins.bullet.1':
    '„Paigaldatud“ ja „Avasta“ koos väljaga „Otsi pluginaid…“ ning filtritega „Tüüp“, „Olek“ ja „Sordi“. Igal real on versioon, „Üle vaadatud“, „Allkirjastatud“ või „Allkirjastamata“, see, millele plugin juurde pääseb, lüliti ja ⋯-menüü.',
  'help.ctx.admin-plugins.bullet.2':
    'Kaardi päises on kaks ikooni: „Laadi plugin üles“ võtab vastu .zip-, .tgz- või .tar.gz-faili (või lohista .zip lehele); „Skanni uuesti“ leiab arenduseks lingitud plugina kausta.',
  'help.ctx.admin-plugins.bullet.3':
    'Lubatud hostid plugina kaupa: aadressid, mille poole plugin tohib pöörduda, sest väljaminevad ühendused on vaikimisi blokeeritud.',
  'help.ctx.admin-storage.title': 'Salvestusruum',
  'help.ctx.admin-storage.summary':
    'Kuhu üleslaadimised salvestatakse: kohalikule kettale või S3 salve, soovi korral kopeerituna ka teistesse taustasüsteemidesse. Iga üleslaadimiskategooria võib minna eri taustasüsteemi ja midagi ei muutu enne, kui klõpsad „Salvesta muudatused“.',
  'help.ctx.admin-storage.bullet.1':
    'Ülal olev „Tervis“: ebaõnnestunud kirjutamised peegelsihtkohta või „Koopiate tõrkeid pole registreeritud.“',
  'help.ctx.admin-storage.bullet.2':
    '„Taustsüsteemid“: nimi, tüüp, kasutus ja peegeldamise sihtkoht, nuppudega „Testi“, „Muuda“ ja „Eemalda“. „Arvuta kohe“ arvutab salvestatud mahu; keskkonnamuutujaga määratud taustsüsteem on ainult loetav.',
  'help.ctx.admin-storage.bullet.3':
    '„Kategooriad“: reisidokumendid, reisiloo fotod, kaanepildid, profiilipildid, kohtade pildid, fotode vahemälud ja varukoopiad, igaüks määratud mõnele taustsüsteemile.',
  'help.ctx.admin-notifications.title': 'Teavitused',
  'help.ctx.admin-notifications.summary':
    'Kanalid, mida instants oma kasutajatele pakub, ja need, mida saad sina administraatorina. Kasutajad valivad oma teemad ja URL-id jaotises „Seaded“, sina otsustad, mis on üldse saadaval, ja seadistad e-posti.',
  'help.ctx.admin-notifications.bullet.1':
    '„E-post (SMTP)“, „Veebihaak“, „Ntfy“ ja „Veebitõuketeavitused“: igaühel on lüliti, millega kanalit kasutajatele pakkuda; e-post vajab lisaks serveri seadeid. „Rakenduses“ on alati sees.',
  'help.ctx.admin-notifications.bullet.2':
    '„Reisi meeldetuletused“: kas server saadab enne reisi algust meeldetuletuse.',
  'help.ctx.admin-notifications.bullet.3':
    '„Administraatori veebihaak“, „Administraatori ntfy“ ja kaart „Teavitused“: kuhu administraatori sündmused („Uus versioon saadaval“, „Salvestuskoopia tõrge“, „Aerutamispiirkonda taotleti“) saadetakse, igaühel oma testinupp.',
  'help.ctx.admin-mcp-tokens.title': 'MCP juurdepääs',
  'help.ctx.admin-mcp-tokens.summary':
    'Kõik pääsutõendid ja OAuth-seansid, mis AI-klientidel selles TREKis on, kõigi kasutajate peale kokku. Neist igaühe saad tühistada.',
  'help.ctx.admin-mcp-tokens.bullet.1':
    'OAuth-seansid: klient, talle antud õigused, omanik ja kuupäev ning prügikastiikoon, millega seansi tühistad.',
  'help.ctx.admin-mcp-tokens.bullet.2':
    'API-pääsutõendid: nimi, omanik, „Loodud“ ja „Viimati kasutatud“ ning prügikast, millega tõendi kustutad.',
  'help.ctx.admin-github.title': 'GitHub',
  'help.ctx.admin-github.summary':
    'Mis on TREKis uut: GitHubist pärit versioonide ajalugu ja see, kas sinu omast uuem versioon on saadaval. Uuendamine ise toimub väljaspool rakendust, serveris.',
  'help.ctx.admin-github.bullet.1':
    '„Versiooniajalugu“ näitab versioone ajajoonena koos märkmetega. Uusimal on silt „Uusim“, eelväljalasetel „Eelväljalase“ ja GitHub avab väljalasete lehe.',
  'help.ctx.admin-github.bullet.2':
    '„Uuendus saadaval“ ilmub lehe päise alla, kui uuem versioon on olemas; „Kuidas uuendada“ näitab Dockeri käske või muude paigalduste uuendamisjuhendit.',
  'help.ctx.admin-backup.title': 'Varundamine',
  'help.ctx.admin-backup.summary':
    'Andmebaasi ja üleslaadimiste täielikud varukoopiad, mis tehakse käsitsi või ajakava järgi, hoitakse serveris ja saab ühe failina alla laadida. Varukoopia taastamiseks kasuta „Taasta“.',
  'help.ctx.admin-backup.bullet.1':
    '„Andmete varundamine“: kaardi ülaosas „Loo varukoopia“ ja „Laadi varukoopia üles“ ning varukoopiate loend nuppudega „Laadi alla“, „Taasta“ ja kustutamiseks prügikastiikoon.',
  'help.ctx.admin-backup.bullet.2':
    '„Laadi varukoopia üles“ taastab andmed teises serveris või varasemal päeval tehtud failist pärast sama küsimust nagu „Taasta“.',
  'help.ctx.admin-backup.bullet.3':
    '„Automaatne varundamine“: sisse või välja, „Sagedus“, „Käivitamise kellaaeg“ ja päev ning „Kustuta vanad varukoopiad pärast“ (alates 1 päevast kuni „Säilita igavesti“); muudatused rakenduvad nupuga „Salvesta“.',
  'help.ctx.admin-audit.title': 'Audit', // same-as-en
  'help.ctx.admin-audit.summary':
    'Turvalisuse ja halduse seisukohast oluliste sündmuste logi: sisselogimised ja ebaõnnestunud katsed, MFA muudatused, kasutajate ja seadete muudatused, varundused ja taastamised. Ainult lugemiseks, uusimad eespool.',
  'help.ctx.admin-audit.bullet.1':
    'Iga sündmus on omaette real koos aja, kasutaja, toimingu, ressursi, IP-aadressi ja üksikasjadega.',
  'help.ctx.admin-audit.bullet.2':
    'Kaardi päises olev „Värskenda“ laadib loendi uuesti. Pealkirja kõrval olev märk näitab, mitu kirjet koguarvust on laaditud, ja „Laadi veel“ laadib vanemaid kirjeid.',
  // create-user
  'help.guide.create-user.title': 'Loo kasutaja',
  'help.guide.create-user.goal': 'Lisa konto käsitsi, ilma kutseta.',
  'help.guide.create-user.step.1': 'Klõpsa kaardi „Kasutajad“ paremas ülanurgas „Loo kasutaja“.',
  'help.guide.create-user.step.2':
    'Sisesta „Kasutajanimi“, „E-post“ ja „Parool“; parooli all olev kontrollnimekiri näitab, milliseid reegleid parool täidab. Vali „Roll“: „Kasutaja“ või „Administraator“.',
  'help.guide.create-user.step.3': 'Klõpsa „Loo kasutaja“.',
  'help.guide.create-user.result':
    'Konto ilmub tabelisse ja saab kohe sisse logida. Anna parool inimesele üle kanali kaudu, mida usaldad.',
  'help.guide.create-user.tip.1': 'Kui inimene peaks parooli ise valima, on parem saata talle kutselink.',
  'help.guide.create-user.tip.2':
    'Administraator näeb seda lehte ja tohib teha kõike. Mida kasutaja reisidel teha tohib, määratakse allpool jaotises „Õiguste seaded“.',
  // edit-user
  'help.guide.edit-user.title': 'Kasutaja andmete või parooli muutmine',
  'help.guide.edit-user.goal':
    'Nimeta kasutaja ümber, tõsta või langeta tema rolli või aita tal pärast parooli kaotamist uuesti sisse logida.',
  'help.guide.edit-user.step.1':
    'Klõpsa kasutaja real pliiatsil („Muuda kasutajat“). Dialoogi ülaosas on konto e-post.',
  'help.guide.edit-user.step.2':
    'Muuda välju „Kasutajanimi“, „E-post“ või „Roll“ või sisesta „Uus parool“ (jäta tühjaks, et praegune jääks kehtima) ja klõpsa „Salvesta“. All olev „Lähtesta pääsuvõtmed“ eemaldab pärast kinnitust konto kõik pääsuvõtmed.',
  'help.guide.edit-user.result':
    'Muudatus rakendub kohe. Uus parool logib inimese ka kõigis seadmetes välja, nii et vana seanss lakkab töötamast.',
  'help.guide.edit-user.tip.1': 'Kui oled viimane administraator, ei saa sa endalt administraatori rolli ära võtta.',
  'help.guide.edit-user.tip.2':
    'Pääsuvõtmete lähtestamisel jääb parool alles. Inimene lisab uued pääsuvõtmed jaotises „Seaded“, „Konto“.',
  // invite-links
  'help.guide.invite-links.title': 'Kutsu keegi lingiga',
  'help.guide.invite-links.goal': 'Lase kellelgi suletud instantsis registreeruda ja soovi korral lisa ta reisile.',
  'help.guide.invite-links.step.1': 'Klõpsa kaardi „Kutselingid“ paremas ülanurgas „Loo link“.',
  'help.guide.invite-links.step.2':
    'Vali „Kasutuskordade ülempiir“ (1× kuni 5× või ∞) ja „Aegub pärast“ (1d kuni 14d või ∞), soovi korral reis väljal „Lisa reisile (valikuline)“, ja klõpsa „Loo ja kopeeri“.',
  'help.guide.invite-links.step.3':
    'Saada link edasi. Igal real on näha, mitu korda linki on kasutatud, millal see aegub, millisele reisile see lisab ja kes selle lõi, ning kõrval olek „Aktiivne“, „Aegunud“ või „Ära kasutatud“. „Kopeeri link“ kopeerib selle uuesti ja prügikast kustutab lingi.',
  'help.guide.invite-links.result': 'Lingi avaja registreerub oma parooliga. Kui valiti reis, liitub ta sellega kohe.',
  'help.guide.invite-links.tip.1':
    'Kutselingid töötavad ka siis, kui jaotises „Seaded“ on „Parooliga registreerumine“ välja lülitatud.',
  'help.guide.invite-links.tip.2':
    'Ühele inimesele on kõige turvalisem vaikevalik link, mida saab kasutada üks kord ja mis aegub peagi.',
  // delete-user
  'help.guide.delete-user.title': 'Kustuta kasutaja',
  'help.guide.delete-user.goal': 'Eemalda konto koos kõigega, mis talle kuulub.',
  'help.guide.delete-user.step.1': 'Klõpsa kasutaja real prügikastil („Kustuta kasutaja“) ja kinnita nupuga „Kustuta“.',
  'help.guide.delete-user.result':
    'Konto kustutatakse koos kõigi talle kuuluvate reiside ja reisilugudega, ka nende reisidega, mida ta teistega jagas. Reisid, kus ta oli ainult liige, jäävad oma omanikele.',
  'help.guide.delete-user.tip.1': 'Seda ei saa tagasi võtta. Kui sa pole kindel, tee enne varukoopia.',
  'help.guide.delete-user.tip.2':
    'Sinu enda real prügikastiikoon ei tööta: iseennast kustutada ei saa. Seda peab tegema mõni teine administraator.',
  // permissions
  'help.guide.permissions.title': 'Otsusta, kes mida tohib teha',
  'help.guide.permissions.goal': 'Määra iga toimingu puhul, milline roll tohib seda selles TREKis teha.',
  'help.guide.permissions.step.1':
    'Leia jaotises „Õiguste seaded“ toiming selle rühmast, näiteks „Reiside kustutamine“ rühmas „Reiside haldus“, ja vali, kes tohib seda teha: „Kõik“, „Reisi liikmed“, „Reisi omanik“ või „Ainult administraator“. Muudetud rida on märgitud kui „kohandatud“.',
  'help.guide.permissions.step.2':
    'Klõpsa kaardi paremas ülanurgas „Salvesta“. „Taasta vaikeseaded“ taastab igal real sisseehitatud taseme; klõpsa ka pärast seda „Salvesta“.',
  'help.guide.permissions.result':
    'Reegel kehtib korraga kõigil reisidel. Inimesed, kelle tase on madalam, ei näe enam selle toimingu nuppe ja menüüsid.',
  'help.guide.permissions.tip.1':
    '„Reisi omanik“ on inimene, kes reisi lõi; administraatorid tohivad alati kõike teha.',
  'help.guide.permissions.tip.2':
    'Iga toiming on eraldi real, nii et saad näiteks lubada liikmetel kohti ja päevi planeerida, kuid jätta reisi kustutamise omanikule.',
  // default-map
  'help.guide.default-map.title': 'Määra uute kasutajate kaardi vaikeseaded',
  'help.guide.default-map.goal': 'Anna igale uuele kontole töötav kaart ilma isikliku pääsutõendita.',
  'help.guide.default-map.step.1':
    'Vali jaotises „Kaart“ „Kaardimall“ või kleebi paanide URL ning sisesta „Ühine CARTO võti“, kui kasutad CARTO paane. All olev eelvaade näitab tulemust.',
  'help.guide.default-map.step.2':
    'Vali allpool „Kaardimootor“: „Tavaline (tasuta)“, Mapbox (3D) või MapLibre (OpenFreeMap). Mapboxi ja MapLibre puhul vali „Kaardi stiil“; Mapboxi puhul lisa „Ühine Mapboxi pääsutõend“ ja otsusta, kas kasutada valikuid „3D-hooned ja maastik“ ning „Kõrge kvaliteediga režiim“.',
  'help.guide.default-map.result':
    'Uued kontod alustavad nende seadetega. Kes on jaotises „Seaded“ oma kaardi määranud, jääb enda oma juurde.',
  'help.guide.default-map.tip.1':
    'Siin sisestatud tõend või võti on ühine kõigile, kellel pole oma, nii et jälgi selle kvooti.',
  'help.guide.default-map.tip.2':
    'Neid vaikeseadeid kasutavad ka olemasolevad kontod, mis pole kaardi vahekaardil kunagi midagi muutnud.',
  // packing-templates
  'help.guide.packing-templates.title': 'Koosta pakkimismall',
  'help.guide.packing-templates.goal':
    'Anna reisidele tühja nimekirja asemel valmis pakkimisnimekiri, millest alustada.',
  'help.guide.packing-templates.step.1': 'Klõpsa „Uus mall“, sisesta nimi ja kinnita linnukesega.',
  'help.guide.packing-templates.step.2':
    'Klõpsa malli nimel, et see avada, seejärel „Lisa kategooria“. Kategooria ülaosas olev + lisab esemeid ja esemel peab olema ainult nimi.',
  'help.guide.packing-templates.step.3':
    'Kõik salvestub jooksvalt. Pliiats nimetab ümber malli, kategooria või eseme. Prügikast kustutab eseme kohe. Malli või kategooria puhul küsib see enne kinnitust, sest kustutatakse ka kõik, mis selles on.',
  'help.guide.packing-templates.result':
    'Malli pakutakse iga reisi pakkimisnimekirjas. Rakendamisel kopeeritakse esemed, nii et reisil saab neid vabalt muuta.',
  'help.guide.packing-templates.tip.1':
    'Eraldi mall iga reisitüübi jaoks (rand, linn, matk) toimib paremini kui üks väga pikk nimekiri.',
  'help.guide.packing-templates.tip.2': 'Malli kustutamine ei muuda reise, kus seda on juba rakendatud.',
  'help.guide.packing-templates.tip.3':
    'Reisi pakkimisnimekirja „Salvesta mallina“ loob malli, kus on iga eseme kaal, kogus ja kott. Need on siin eseme kõrval näha ning malli rakendamisel lähevad esemed samadesse kottidesse.',
  // categories
  'help.guide.categories.title': 'Halda kategooriaid',
  'help.guide.categories.goal':
    'Otsusta, milliseid kategooriaid saab kohtadele ja kogumikele anda ning kuidas need välja näevad.',
  'help.guide.categories.step.1':
    'Klõpsa „Uus kategooria“, kirjuta nimi dialoogi pealkirjareale, vali „Ikoon“ ja „Värv“ ning vaata üle „Eelvaade“. Klõpsa „Loo“.',
  'help.guide.categories.step.2':
    'Loendis avab pliiats („Muuda“) kategooria ja „Uuenda“ salvestab selle. Prügikast („Kustuta“) eemaldab selle pärast kinnitust.',
  'help.guide.categories.result':
    'Kategooriad kehtivad korraga kõikjal: koha inspektoris, kaardi markeritel, kogumikes ja filtrites.',
  'help.guide.categories.tip.1':
    'Kohad säilitavad oma kategooria ID, nii et kategooria ümbernimetamine muudab selle nime kõigil kohtadel.',
  'help.guide.categories.tip.2':
    'Kui kustutad kategooria, jäävad selle kohad kategooriata. Kui see on oluline, määra need enne mõnda teise kategooriasse.',
  // school-holiday-catalog
  'help.guide.school-holiday-catalog.title': 'Halda koolivaheaegu käsitsi',
  'help.guide.school-holiday-catalog.goal': 'Halda riigi või piirkonna koolivaheaegu, mida kõik saavad Vacays valida.',
  'help.guide.school-holiday-catalog.step.1':
    'Vali jaotises „Koolivaheajad“ „Riik“ või klõpsa + („Lisa riik“), sisesta „Riik“ ja selle „Riigikood (nt EE)“ ning klõpsa „Salvesta“. „Lisa piirkond“ lisab iga riigi osa, millel on oma kuupäevad.',
  'help.guide.school-holiday-catalog.step.2':
    'Klõpsa piirkonnal, et avada „Piirkond või koolipiirkond“: klõpsa „Lisa vaheaeg“, anna igale vaheajale „Vaheaja nimi“, „Alguskuupäev“ ja „Lõppkuupäev“ ning klõpsa „Salvesta“. Prügikast eemaldab vaheaja või piirkonna; riigi saab kustutada, kui sellel pole enam piirkondi.',
  'help.guide.school-holiday-catalog.result':
    'Kasutajad leiavad riigi ja piirkonna Vacay jaotisest „Seaded“ ning näevad vaheaegu oma aastaruudustikus.',
  'help.guide.school-holiday-catalog.tip.1':
    'Piirkonda, mille keegi on juba oma Vacay kalendris valinud, ei saa kustutada.',
  // auth-methods
  'help.guide.auth-methods.title': 'Otsusta, kuidas inimesed sisse logivad',
  'help.guide.auth-methods.goal':
    'Lülita parooliga sisselogimine, SSO ja registreerumine sisse või välja ning nõua 2FA-d.',
  'help.guide.auth-methods.step.1':
    'Lülita jaotises „Autentimisviisid“ „Parooliga sisselogimine“ ja „Parooliga registreerumine“ sisse või välja; iga lüliti rakendub kohe. Kui registreerumine on väljas, tekivad uued kontod ainult kutselinkide, SSO või nupu „Loo kasutaja“ kaudu.',
  'help.guide.auth-methods.step.2':
    '„SSO-ga sisselogimine“ ja „SSO kontode automaatne loomine“ eeldavad, et allpool on seadistatud „Ühekordne sisselogimine (OIDC)“. Automaatne loomine teeb konto, kui keegi logib esimest korda SSO kaudu sisse.',
  'help.guide.auth-methods.step.3':
    'Lülita sisse „Nõua kaheastmelist autentimist (2FA)“, et kõik, kellel 2FA puudub, peaksid selle enne TREKi kasutamist seadetes seadistama.',
  'help.guide.auth-methods.result': 'Sisselogimislehel on täpselt need viisid, mille sisse jätsid.',
  'help.guide.auth-methods.tip.1':
    'TREK ei lase viimast sisselogimisviisi välja lülitada: selle lüliti muutub halliks ja vihje ütleb, et vähemalt üks sisselogimisviis peab jääma sisse lülitatuks.',
  'help.guide.auth-methods.tip.2':
    'Kui serveris on määratud OIDC_ONLY, on parooli lülitid lukus ja märkus annab sellest teada.',
  // oidc
  'help.guide.oidc.title': 'Ühenda ühekordne sisselogimine',
  'help.guide.oidc.goal': 'Lase inimestel sisse logida sinu identiteedipakkuja kaudu.',
  'help.guide.oidc.step.1':
    'Sisesta jaotises „Ühekordne sisselogimine (OIDC)“ nupu jaoks „Kuvatav nimi“, „Väljastaja URL“, „Kliendi ID“ ja „Kliendi saladus“ oma teenusepakkujalt. Täida „Discovery URL (valikuline)“ ainult siis, kui sinu teenusepakkuja ei avalda seda tavapärasel aadressil, nagu Authentik. Klõpsa „Salvesta“.',
  'help.guide.oidc.step.2': 'Lülita jaotises „Autentimisviisid“ sisse „SSO-ga sisselogimine“.',
  'help.guide.oidc.result':
    'Sisselogimislehel on SSO nupp. Kui „SSO kontode automaatne loomine“ on sisse lülitatud, saavad esmakordsed kasutajad konto automaatselt.',
  'help.guide.oidc.tip.1':
    'Teenusepakkuja vajatav ümbersuunamise URI on sinu TREKi aadress, millele järgneb dokumentatsioonis toodud OIDC tagasikutse tee.',
  'help.guide.oidc.tip.2':
    'Väidete vastendus määrab, millistest SSO gruppidest saavad administraatorid. Vaata dokumentatsioonist OIDC lehte.',
  // instance-keys
  'help.guide.instance-keys.title': 'API-võtmete sisestamine',
  'help.guide.instance-keys.goal':
    "Lisa kogu serverile Google'i fotod ja hinnangud, Unsplashi kaanepildid ja Amapi otsing.",
  'help.guide.instance-keys.step.1':
    'Jaotises „API-võtmed“ tegeleb ülaosas olev TREK Places API kohaotsinguga juba ilma võtmeta. „Mida see sisaldab“ näitab, mida see katab ja mida mitte.',
  'help.guide.instance-keys.step.2':
    "Fotode, hinnangute ja lahtiolekuaegade jaoks kleebi „Google Mapsi API-võti“ ja klõpsa „Testi“; tulemus on „Ühendatud“ või „Vigane“. Ava „Milleks võtit tohib kasutada“ ja lülita sisse ainult see, mille eest oled valmis maksma: „Kohtade fotod“, „Koha automaattäide“, „Koha üksikasjad“, „Kohaandmete täiendamine“ ja „Otsi ainult Google'iga“ ning lisaks „Google'i päringute päevapiirang“.",
  'help.guide.instance-keys.step.3':
    'Kleebi kaanepiltide otsinguks „Unsplashi API-võti“ ja mandri-Hiina kohaotsinguks „Amapi (高德地图) API-võti“, seejärel klõpsa kaardi allosas „Salvesta“.',
  'help.guide.instance-keys.result':
    "Kasutajad saavad funktsioone kasutada ilma oma võtmeteta. Ilma Google'i võtmeta kasutab otsing TREK Places API-t ja OpenStreetMapi.",
  'help.guide.instance-keys.tip.1':
    'Kui kasutajal on jaotises „Seaded“ isiklik võti, kasutab TREK selle kasutaja puhul instantsi võtme asemel seda.',
  'help.guide.instance-keys.tip.2': 'Võtmed võivad tulla ka keskkonnamuutujatest, need on siin kirjutuskaitstud.',
  'help.guide.instance-keys.tip.3':
    "„Google'i päringute päevapiirang“ piirab, kui palju TREK tohib võtmega päevas kulutada. Pealkirja kõrval olev märk loeb tänaseid päringuid. Kui piirang on täis, kasutavad otsingud järgmise päevani (UTC) OpenStreetMapi.",
  // places-transit
  'help.guide.places-transit.title': 'Vali otsingu ja ühistranspordi teenusepakkujad',
  'help.guide.places-transit.goal':
    'Vali, milline teenus vastab kohaotsingutele ja ühistranspordi marsruudipäringutele.',
  'help.guide.places-transit.step.1':
    "Vali jaotises „Ühistranspordi teenusepakkuja“ „Transitous (tasuta)“, mis ei vaja võtit ja on tugevaim Euroopas, või Google, mis kasutab Google'i võtit. Valik salvestub kohe.",
  'help.guide.places-transit.step.2':
    'Vali jaotises „Kohaotsingu teenusepakkuja“, millist teenust TREK kasutab, kui TREKi register ja OpenStreetMap midagi ei leia: „Automaatne“ (Google, kui võti on olemas, seejärel Amap), Google Places, Amap (高德地图) või OpenStreetMap.',
  'help.guide.places-transit.result': 'Iga otsingukast ja iga ühistranspordi marsruut TREKis kasutab seda valikut.',
  'help.guide.places-transit.tip.1':
    'Kui valikul pole võtit, näed siin hoiatust. Kohaotsing kasutab siis ainult TREKi registrit ja OpenStreetMapi ning ühistransport ainult Transitousi.',
  'help.guide.places-transit.tip.2':
    "Google'i ühistranspordimarsruutide eest makstakse iga päringu eest; Transitousi eest mitte.",
  // file-types
  'help.guide.file-types.title': 'Piira failitüüpe',
  'help.guide.file-types.goal': 'Otsusta, milliste laienditega faile tohib üles laadida.',
  'help.guide.file-types.step.1':
    'Muuda jaotises „Lubatud failitüübid“ komadega eraldatud laiendite loendit või sisesta *, et lubada kõik tüübid, ja klõpsa „Salvesta“.',
  'help.guide.file-types.result':
    'Muud tüüpi failide üleslaadimine lükatakse selge teatega tagasi nii dokumentide, reisipäeviku kui ka kaanepiltide juures.',
  'help.guide.file-types.tip.1':
    'Jäta pilditüübid loendisse: kaanepilte ja reisiloo fotosid kontrollitakse sama loendi järgi.',
  // toggle-addon
  'help.guide.toggle-addon.title': 'Lülita lisamoodul sisse või välja',
  'help.guide.toggle-addon.goal': 'Tee funktsioonimoodul kõigile kättesaadavaks või eemalda see.',
  'help.guide.toggle-addon.step.1':
    'Klõpsa lisamooduli paanil oleval lülitil. Navigeerimiskirje ilmub või kaob kõigi jaoks kohe.',
  'help.guide.toggle-addon.step.2':
    'Mõnel paanil on valikute jaoks alamread, näiteks „Kottide haldus“ jaotise „Nimekirjad“ all või fototeenused jaotise „Reisilugu“ all. Need on näha ainult siis, kui lisamoodul on sisse lülitatud.',
  'help.guide.toggle-addon.result':
    'Kui lülitad lisamooduli välja, jäävad selle andmed alles. Kui lülitad selle uuesti sisse, on andmed jälle näha.',
  'help.guide.toggle-addon.tip.1':
    'Kui lülitad MCP välja, eemaldatakse lõpp-punkt ja sellest sõltuvad jaotise „Integratsioonid“ osad.',
  'help.guide.toggle-addon.tip.2':
    'Vacay, Atlas ja Reisilugu on lisamoodulid, mida kasutajad kõige sagedamini küsivad. „Dokumendid“ vajab üleslaadimiste jaoks salvestusruumi.',
  // document-providers
  'help.guide.document-providers.title': 'Paku dokumendihoidlat',
  'help.guide.document-providers.goal': 'Otsusta, milliste hoidlatega saab reis oma dokumente sünkroonida.',
  'help.guide.document-providers.step.1':
    'Paan „Dokumendid“ loetleb salvestusteenused ridadena: Paperless-ngx, Papra, Nextcloud, OpenCloud ja Synology Drive. Kõik viis on alguses välja lülitatud ning read on näha ainult siis, kui „Dokumendid“ ise on sees.',
  'help.guide.document-providers.step.2':
    'Lülita Nextcloudi real lüliti sisse. Ilmub teade „Lisamoodul uuendatud“ ja edaspidi leiavad reisi omanikud oma reiside vahekaardilt „Failid“ funktsiooni „Dokumentide sünkroonimine“, kus Nextcloud on jaotises „Ühenda teenus“.',
  'help.guide.document-providers.result':
    'Hoidla on saadaval selle TREKi igal reisil. Midagi ei ühendata enne, kui reisi omanik selle ühendab.',
  'help.guide.document-providers.tip.1':
    'Siin otsustatakse ainult, kas hoidlat tohib pakkuda. Aadress ja kasutajaandmed kuuluvad reisile ja reisi omanik sisestab need reisi vahekaardil „Failid“, mitte kunagi halduspaneelis.',
  'help.guide.document-providers.tip.2':
    'Kui lülitad „Dokumendid“ välja, lülituvad välja ka kõik hoidlad, ja hoidlat ei saa sisse lülitada, kui „Dokumendid“ on väljas: server vastab „Lülita kõigepealt sisse lisamoodul Dokumendid“. Sinu enda võrgus asuv hoidla vajab serveris ka seadet ALLOW_INTERNAL_NETWORK=true.',
  // install-plugin
  'help.guide.install-plugin.title': 'Paigalda plugin',
  'help.guide.install-plugin.goal':
    'Lisa kolmanda osapoole plugin ja anna sellele täpselt need õigused, mida see küsib.',
  'help.guide.install-plugin.step.1':
    'Ava „Avasta“, leia plugin väljaga „Otsi pluginaid…“ või filtriga „Tüüp“ ja klõpsa „Paigalda“. Paketifaili puhul klõpsa „Laadi plugin üles“ (pilveikoon kaardi paremas ülanurgas) või lohista .zip lehele.',
  'help.guide.install-plugin.step.2':
    'Loe jaotises „Paigaldatud“ plugina rida: millele plugin juurde pääseb, milliste serveritega see ühendub ning kas see on „Üle vaadatud“ ja „Allkirjastatud“. Seejärel lülita sisse „Luba plugin“; real on nüüd „Aktiivne“.',
  'help.guide.install-plugin.step.3':
    'Rea ⋯-menüüs on „Taaskäivita“, „Vaata vealogi“, „Lubatud hostid“ ja „Muuda versiooni…“ ning lingid lähtekoodile; „Kustuta“ eemaldab plugina koos andmetega. Uuem versioon on real näha uuendusena ja versioon, mis küsib uusi õigusi, jääb välja lülitatuks, kuni need kinnitad.',
  'help.guide.install-plugin.result':
    'Plugin töötab oma protsessis. Kõik, mida see lisab, näiteks vidinad, kaardikihid või tööriistad, ilmub sinna, kuhu plugin selle määrab.',
  'help.guide.install-plugin.tip.1': '„Skanni uuesti“ leiab ka arenduseks lingitud pluginakausta, millel pole paketti.',
  'help.guide.install-plugin.tip.2':
    'Allkirjastamata plugin on vastavalt märgitud. Paigalda see ainult siis, kui usaldad selle allikat.',
  // storage-backends
  'help.guide.storage-backends.title': 'Üleslaadimiste teisaldamine S3-sse või peegeldamine',
  'help.guide.storage-backends.goal':
    'Hoia faile objektisalvestuses või kopeeri iga üleslaadimine teise taustasüsteemi.',
  'help.guide.storage-backends.step.1':
    'Klõpsa jaotises „Taustsüsteemid“ „Lisa taustsüsteem“, anna sellele „Nimi“, vali „Tüüp“, „Kohalik“ või S3, ja täida väljad. Koopia hoidmiseks mujal märgi „Peegeldamise sihtkohad“. Klõpsa „Rakenda“, seejärel uuel real „Testi“, et ühendust kontrollida.',
  'help.guide.storage-backends.step.2':
    'Määra jaotises „Kategooriad“ iga üleslaadimise liik, näiteks „Reisidokumendid“, „Reisiloo fotod“ või „Varukoopiad“, mõnele taustsüsteemile.',
  'help.guide.storage-backends.step.3':
    'Klõpsa all „Salvesta muudatused“. Kui mõni kategooria osutab nüüd mujale, küsib TREK, kas „Teisalda olemasolevad objektid“ või „Suuna ainult uued kirjutused“.',
  'help.guide.storage-backends.result':
    'Uued üleslaadimised lähevad määratud taustsüsteemi. Teisaldatud failid pakutakse sealt ja see, mida otsustasid mitte teisaldada, jääb oma kohale.',
  'help.guide.storage-backends.tip.1':
    'Keskkonnamuutujatega seadistatud taustsüsteem on näha, kuid seda ei saa siin muuta.',
  'help.guide.storage-backends.tip.2':
    'Peegelsihtkoht saab koopia igast uuest kirjutisest; rea „Sünkrooni kohe“ kopeerib varem salvestatu. Aeglane sihtkoht aeglustab selle taustsüsteemi kõiki üleslaadimisi.',
  // channels-instance
  'help.guide.channels-instance.title': 'Seadista teavituskanalid',
  'help.guide.channels-instance.goal': 'Otsusta, milliseid kanaleid kasutajad saavad valida, ja seadista e-post.',
  'help.guide.channels-instance.step.1':
    'Lülita kaardi päises sisse „E-post (SMTP)“, sisesta SMTP Host, SMTP Port, SMTP User, SMTP Password ja From Address ning klõpsa „Salvesta“. „Saada testkiri“ saadab sulle e-kirja. „Jäta TLS-sertifikaadi kontroll vahele“ on mõeldud ainult kohalikule meiliserverile, millel on oma sertifikaat.',
  'help.guide.channels-instance.step.2':
    'Lülita sisse „Veebihaak“, „Ntfy“ ja „Veebitõuketeavitused“, et neid kasutajatele pakkuda. Seejärel sisestavad kasutajad jaotises „Seaded“, „Teavitused“ oma URL-i või teema või lülitavad tõuketeavitused seadme kaupa sisse.',
  'help.guide.channels-instance.step.3':
    '„Reisi meeldetuletused“ lülitab sisse või välja reisi algusele eelneva meeldetuletuse; „Rakenduses“ on alati sees.',
  'help.guide.channels-instance.result':
    'Iga kasutaja vahekaardil „Teavitused“ on näha kanalid, mille sisse lülitasid.',
  'help.guide.channels-instance.tip.1':
    'Kaardil „Administraatori ntfy“ olev „Ntfy serveri URL“ on ka kasutajate vaikeserver. Kasutajad saavad siiski määrata oma serveri.',
  'help.guide.channels-instance.tip.2':
    'Pluginate kanalid ilmuvad automaatselt, kui vastava võimekusega plugin on aktiivne.',
  // admin-channels
  'help.guide.admin-channels.title': 'Saa administraatori sündmused telefoni',
  'help.guide.admin-channels.goal':
    'Saa teavitusi uutest versioonidest, ebaõnnestuvatest salvestuspeeglitest ja aerutamispiirkondade taotlustest.',
  'help.guide.admin-channels.step.1':
    'Sisesta jaotises „Administraatori ntfy“ „Administraatori teema“ ning vajadusel „Ntfy serveri URL“ ja „Pääsutõend (valikuline)“; jaotises „Administraatori veebihaak“ URL. Klõpsa igal kaardil „Salvesta“.',
  'help.guide.admin-channels.step.2':
    'Klõpsa „Saada ntfy testteavitus“ või „Saada testteavitus veebihaagi kaudu“, et näha, kas teade jõuab kohale.',
  'help.guide.admin-channels.result':
    'Administraatori sündmused saadetakse igale administraatorile rakenduses ning, kui need sisse lülitasid, ka administraatori ntfy teemasse ja veebihaaki.',
  'help.guide.admin-channels.tip.1':
    'Hoia administraatori teema isiklikust teemast eraldi, et tõrketeated reisiteadete sekka ei kaoks.',
  'help.guide.admin-channels.tip.2':
    'Administraatori veebihaak ja teema on eraldi sinu enda kanalitest jaotises „Seaded“, „Teavitused“.',
  // mcp-tokens-admin
  'help.guide.mcp-tokens-admin.title': 'Tühista AI juurdepääs',
  'help.guide.mcp-tokens-admin.goal': 'Vaata ja tühista kõigi kasutajate kõik AI-klientide pääsutõendid ja seansid.',
  'help.guide.mcp-tokens-admin.step.1':
    'Leia jaotises „OAuth-seansid“ klient nime ja omaniku järgi; selle siltidel on näha talle antud õigused. Prügikast tühistab seansi pärast kinnitust.',
  'help.guide.mcp-tokens-admin.step.2':
    'Jaotises „API-pääsutõendid“ sama tõendite kohta: nimi, omanik, „Loodud“ ja „Viimati kasutatud“. Prügikast kustutab tõendi ja klient lakkab kohe töötamast.',
  'help.guide.mcp-tokens-admin.result': 'Kliendi kasutaja peab selle uuesti ühendama. Midagi muud ei muutu.',
  'help.guide.mcp-tokens-admin.tip.1':
    'Õiguste ulatus näitab, mida klient teha saaks; ainult lugemisõigusega ulatuse võib ohutult alles jätta.',
  'help.guide.mcp-tokens-admin.tip.2':
    'MCP lisamooduli väljalülitamine peatab kohe kõik kliendid ja peidab selle vahelehe, kuid ei kustuta midagi: tõendid hakkavad uuesti tööle, kui lisamoodul on jälle sees.',
  // release-history
  'help.guide.release-history.title': 'Kontrolli, kas on uus versioon',
  'help.guide.release-history.goal': 'Tea, kas sinu TREK on ajakohane ja mida järgmine versioon toob.',
  'help.guide.release-history.step.1':
    'Kui uuem versioon on olemas, on lehe päise all „Uuendus saadaval“ koos sinu kasutatava versiooniga. „Vaata GitHubis“ avab versiooni ja „Kuidas uuendada“ näitab Dockeri käske või muude paigalduste uuendamisjuhendit.',
  'help.guide.release-history.step.2':
    '„Versiooniajalugu“ loetleb kõik versioonid koos märkmetega. „Näita üksikasju“ laiendab neid, uusimal versioonil on silt „Uusim“ ja „Laadi veel“ näitab vanemaid versioone.',
  'help.guide.release-history.result':
    'Uuendad hostis, tõmmates uue tõmmise või ehitades uue sildi. Andmekataloog jääb alles.',
  'help.guide.release-history.tip.1': 'Tee enne uuendamist varukoopia. Vahekaart „Varundamine“ on kohe kõrval.',
  'help.guide.release-history.tip.2':
    'Eelväljalaskeid näidatakse, kuid neist ei teavitata kui uuendustest, välja arvatud juhul, kui kasutad ise eelväljalaset.',
  // create-backup
  'help.guide.create-backup.title': 'Varukoopia tegemine ja taastamine',
  'help.guide.create-backup.goal': 'Varunda kogu instants, hoia koopiat teises kohas ja saa selle vajadusel taastada.',
  'help.guide.create-backup.step.1':
    'Klõpsa jaotises „Andmete varundamine“ paremal üleval „Loo varukoopia“. See salvestab andmebaasi ja üleslaadimised serveris ühte faili.',
  'help.guide.create-backup.step.2':
    '„Laadi alla“ salvestab koopia väljaspool serverit; prügikast kustutab vanad varukoopiad pärast kinnitust.',
  'help.guide.create-backup.step.3':
    'Varukoopia juures olev „Taasta“ või failiga „Laadi varukoopia üles“ asendab kõik praegused andmed, kui klõpsad dialoogis „Kas taastada varukoopia?“ nuppu „Jah, taasta“.',
  'help.guide.create-backup.result':
    'Taastamine toob tagasi kasutajad, reisid, failid ja seaded täpselt sellistena, nagu need varukoopias olid.',
  'help.guide.create-backup.tip.1':
    'Taastamine on siin ainus toiming, mida ei saa tagasi võtta. Tee enne uus varukoopia.',
  'help.guide.create-backup.tip.2':
    'Varukoopiad salvestatakse andmekataloogi. Kopeeri need teise masinasse, et need oleksid alles ka siis, kui see masin rikki läheb.',
  // auto-backup
  'help.guide.auto-backup.title': 'Ajasta varundamine',
  'help.guide.auto-backup.goal': 'Lase serveril end ise varundada ja vanad varukoopiad kustutada.',
  'help.guide.auto-backup.step.1':
    'Lülita jaotises „Automaatne varundamine“ sisse „Luba automaatne varundamine“ ja vali „Sagedus“ („Iga tund“, „Iga päev“, „Iga nädal“ või „Iga kuu“), „Käivitamise kellaaeg“ ning iganädalase või igakuise puhul „Nädalapäev“ või „Kuupäev“.',
  'help.guide.auto-backup.step.2':
    'Vali jaotises „Kustuta vanad varukoopiad pärast“, kui kaua varukoopiat hoitakse, alates 1 päevast kuni „Säilita igavesti“, ja klõpsa „Salvesta“.',
  'help.guide.auto-backup.result':
    'Varukoopiad ilmuvad loendisse ajakava järgi. Valitud vanusest vanemad varukoopiad kustutatakse.',
  'help.guide.auto-backup.tip.1':
    '„Käivitamise kellaaeg“ kasutab serveri aega; selle all olev vihje näitab serveri ajavööndit.',
  'help.guide.auto-backup.tip.2':
    'Serveri salvestusruum on piiratud: tavaliselt piisab 7 või 14 päevast, kui allalaaditud koopia on mujal hoiul.',
  // audit-log
  'help.guide.audit-log.title': 'Loe auditilogi',
  'help.guide.audit-log.goal': 'Uuri välja, kes mida ja millal tegi.',
  'help.guide.audit-log.step.1':
    'Loe ridu, uusimad eespool: „Aeg“, „Kasutaja“, „Toiming“, „Ressurss“, „IP“ ja „Üksikasjad“. Toimingud on nimetatud selle järgi, mis juhtus, näiteks ebaõnnestunud sisselogimine, MFA muudatus või taastamine.',
  'help.guide.audit-log.step.2':
    'Paremal üleval olev „Värskenda“ laadib loendi uuesti. Pealkirja kõrval olev märk näitab, mitu kirjet koguarvust on laaditud, ja „Laadi veel“ laadib vanemaid kirjeid.',
  'help.guide.audit-log.result': 'Sul on ülestähendus, mida saad näidata igaühele, kes küsib, miks midagi muutus.',
  'help.guide.audit-log.tip.1': 'Kellaajad on serveri ajavööndis.',
  'help.guide.audit-log.tip.2': 'Logisse saab ainult lisada: rakenduses ei saa siin midagi muuta ega kustutada.',

  // ── Screen: trip ──────────────────────────────────────────────────────────────────────
  'help.ctx.trip.title': 'Reis',
  'help.ctx.trip.summary':
    'Kõik ühe reisi kohta: plaan koos päevade, kaardi ja kohtadega ning vahelehed retkede, transpordi, broneeringute, nimekirjade, kulude, failide, koostöö ja seotud päeviku jaoks. Igal neist on allpool oma abileht.',
  'help.ctx.trip.bullet.1':
    'Ülariba all olev vahelehtede riba: „Plaan“, „Retked“, „Transport“, „Broneeringud“, „Nimekirjad“, „Kulud“, „Failid“, „Koostöö“ ja pärast päeviku sidumist ka „Päevik“. Millised vahelehed sinu TREKis on, sõltub lisamoodulitest ja pluginatest.',
  'help.ctx.trip.bullet.2':
    '„Plaan“ koosneb kolmest veerust: vasakul päevad, keskel kaart, paremal kohad. Lisamooduliga „Autoreis“ algab päevade veerg lülitiga „Päevad“ ja „Autoreis“, lisamooduliga „Retked“ algab kohtade veerg lülitiga „Kohad“ ja „Retked“. Broneeringud ja transport on plaani osa, peatuse juures ja peatuste vahel; vahelehtedel on need loetletud.',
  'help.ctx.trip.bullet.3':
    'Ülal vasakul reisi nime kõrval olev silt „Reisi seaded“ avab reisi seaded: „Inimesed“ (liikmed ja külalised), „Jagamine“ (ainult lugemiseks mõeldud avalik link ja kutselink) ja „Päevik“.',
  'help.ctx.trip.bullet.4':
    'Pealkirja, kuupäevi, kaanepilti ja valuutat muudad lehel „Minu reisid“ reisikaardi pliiatsiga. Ülal vasakul olev reisi nimi viib sind sinna tagasi.',
  'help.ctx.trip.bullet.5':
    'Veeru siseservas olev sakk paneb veeru kokku ja kaart kasutab vabanenud ruumi. Kokkupandud veerust jääb kaardi ülanurka väike ruut; klõpsa sellel, et veerg uuesti avada. Veeru laiuse muutmiseks lohista selle kõrval olevat õhukest eraldajat.',
  'help.ctx.trip.bullet.6':
    'Päevade tööriistaribal olev tagasivõtmise nool tühistab sinu viimased plaanimuudatused ükshaaval.',
  // add-member
  'help.guide.add-member.title': 'Lisa liige',
  'help.guide.add-member.goal': 'Anna TREKi kontoga inimesele juurdepääs sellele reisile.',
  'help.guide.add-member.step.1':
    'Klõpsa ülal vasakul reisi nime kõrval oleval sildil „Reisi seaded“. See avaneb vahelehel „Inimesed“.',
  'help.guide.add-member.step.2': 'Vali jaotises „Kutsu kasutaja“ inimene väljalt „Vali kasutaja…“ ja klõpsa „Kutsu“.',
  'help.guide.add-member.step.3':
    'Inimene on nüüd jaotises „Juurdepääs“. Märk „Omanik“ tähistab omanikku. Rea lõpus olev „Eemalda juurdepääs“ eemaldab inimese pärast kinnitust.',
  'help.guide.add-member.result':
    'Liige näeb ja muudab reisi samamoodi nagu sina, piirides, mille administraator on määranud jaotises „Õiguste seaded“.',
  'help.guide.add-member.tip.1':
    'Kui kedagi loendis pole, pole tal veel TREKi kontot: lisa ta külalisena või lase tal kutselingi kaudu registreeruda.',
  'help.guide.add-member.tip.2':
    '„Juurdepääs“ kõrval olev arv näitab reisil olevate inimeste arvu; külalised on loetletud eraldi allpool.',
  // trip-invite-link
  'help.guide.trip-invite-link.title': 'Kutsu lingiga',
  'help.guide.trip-invite-link.goal': 'Lase inimestel ise reisiga liituda.',
  'help.guide.trip-invite-link.step.1':
    'Klõpsa reisi nime kõrval „Reisi seaded“ ja vali vasakul „Jagamine“. Klõpsa jaotises „Reisi kutselink“ nuppu „Loo kutselink“.',
  'help.guide.trip-invite-link.step.2':
    'Klõpsa „Kopeeri“ ja saada link. Igaüks, kellel on TREKi konto ja kes lingi avab, liitub liikmena.',
  'help.guide.trip-invite-link.step.3':
    '„Loo uuesti“ asendab lingi ja vana link lakkab töötamast. „Keela“ lülitab lingi välja.',
  'help.guide.trip-invite-link.result': 'Igaüks, kes lingi avab, liitub reisiga ja kuvatakse jaotises „Juurdepääs“.',
  'help.guide.trip-invite-link.tip.1':
    'Kontota inimene seda kasutada ei saa. Registreerimislinke loob administraator jaotises „Administraator“, „Kasutajad“ ja saab lingi selle reisiga siduda.',
  'help.guide.trip-invite-link.tip.2':
    'Kui saatsid lingi valesse vestlusesse, loo see uuesti („Loo uuesti“): vana link lakkab kohe töötamast.',
  // add-guest
  'help.guide.add-guest.title': 'Lisa külaline, kellel pole kontot',
  'help.guide.add-guest.goal': 'Lisa reisile keegi, kes TREKi ei kasuta.',
  'help.guide.add-guest.step.1':
    'Klõpsa reisi nime kõrval „Reisi seaded“. Vahelehel „Inimesed“ on „Külalised“ viimane osa, jaotise „Juurdepääs“ all.',
  'help.guide.add-guest.step.2': 'Kirjuta nimi väljale „Külalise nimi“ ja klõpsa „Lisa külaline“.',
  'help.guide.add-guest.result':
    'Külalise saab määrata kuludele, pakkimisesemetele ja ülesannetele, kuid ta ei saa sisse logida.',
  'help.guide.add-guest.tip.1':
    '„Nimeta ümber“ (pliiats) muudab külalise nime. „Eemalda juurdepääs“ (prügikast) eemaldab külalise pärast kinnitust: tema määramised kustutatakse ja tema osa igast kulust jagatakse jaotuses ülejäänute vahel.',
  'help.guide.add-guest.tip.2': 'Kui inimene saab hiljem konto, kutsu ta liikmeks ja eemalda külaline.',
  // public-link
  'help.guide.public-link.title': 'Avalda ainult vaatamiseks mõeldud link',
  'help.guide.public-link.goal': 'Näita reisi inimestele, kes ei tohiks seda muuta.',
  'help.guide.public-link.step.1': 'Klõpsa reisi nime kõrval „Reisi seaded“ ja vali vasakul „Jagamine“.',
  'help.guide.public-link.step.2':
    'Lülita kaardil „Avalik link“ sisse see, mida link tohib näidata. „Kaart ja plaan“ on alati sees; „Broneeringud“, „Pakkimine“, „Kulud“ ja „Vestlus“ valid ise.',
  'help.guide.public-link.step.3':
    'Jaotises „Valikud“ jätab „Ainult reisimine ja majutus“ välja tegevused, päevamärkmed ja tühjad päevad. „Ilma fotodeta“ jätab välja kohtade fotod.',
  'help.guide.public-link.result':
    'Igaüks, kellel on link, näeb valitud osi ilma sisse logimata, kuid ei saa midagi muuta.',
  'help.guide.public-link.tip.1':
    'Linki pole kuskil avalikult näha, kuid igaüks, kellel see on, saab selle avada. Hoia seda sama salajas kui parooli.',
  'help.guide.public-link.tip.2': 'Kui tahad anda muutmisõiguse, lisa inimene hoopis liikmeks.',
  // transfer-ownership
  'help.guide.transfer-ownership.title': 'Anna reis üle või lahku sellest',
  'help.guide.transfer-ownership.goal': 'Tee keegi teine omanikuks või lahku reisilt, mis pole sinu oma.',
  'help.guide.transfer-ownership.step.1':
    'Klõpsa reisi nime kõrval „Reisi seaded“. Klõpsa jaotises „Juurdepääs“ liikme real „Määra omanikuks“ (kroon) ja kinnita.',
  'help.guide.transfer-ownership.step.2':
    'Sinu enda real olev „Lahku reisilt“ eemaldab sind pärast kinnitust reisilt. Kui oled omanik, anna enne omandiõigus üle.',
  'help.guide.transfer-ownership.result': 'Uus omanik haldab liikmeid ja saab reisi kustutada. Sina jääd tavaliikmeks.',
  'help.guide.transfer-ownership.tip.1':
    'Omanik on reisi looja, kuni omandiõigus antakse üle. Ainult omanik saab reisi kustutada.',
  'help.guide.transfer-ownership.tip.2':
    '„Eemalda juurdepääs“ teise liikme real toimib vastupidi: omanik eemaldab selle liikme reisilt.',
  // collapse-columns
  'help.guide.collapse-columns.title': 'Tee kaardile ruumi',
  'help.guide.collapse-columns.goal': 'Ahenda veerg või tee see laiemaks.',
  'help.guide.collapse-columns.step.1':
    'Veeru ahendamiseks klõpsa päevade veeru siseservas paneeliikooniga sakil. Kaart võtab vabanenud ruumi enda alla. Kohtade veerul on sama sakk.',
  'help.guide.collapse-columns.step.2':
    'Kui veerg on kokku pandud, ilmub kaardi ülanurka väike paneeliikooniga ruut; selle vihjes on „Plaan“ või „Kohad“. Klõpsa sellel, et veerg uuesti avada.',
  'help.guide.collapse-columns.step.3':
    'Veeru laiuse muutmiseks lohista veeru ja kaardi vahel olevat õhukest eraldajat.',
  'help.guide.collapse-columns.result': 'Laiused jäetakse meelde. Järgmisel korral on veerud jälle avatud.',
  'help.guide.collapse-columns.tip.1': 'Saad panna mõlemad veerud korraga kokku, et näha ainult kaarti.',
  'help.guide.collapse-columns.tip.2':
    'Kitsas aknas mahub ainult üks veerg: ühe avamine paneb teise kokku. Telefonis veerge pole; ülal olevate nuppudega „Reisimine“, „Plaan“ ja „Kohad“ vahetad vaateid.',
  // undo-change
  'help.guide.undo-change.title': 'Võta viimane muudatus tagasi',
  'help.guide.undo-change.goal': 'Võta tagasi oma viimane muudatus plaanis.',
  'help.guide.undo-change.step.1':
    'Klõpsa päevade kohal tööriistaribal tagasivõtmise noolt. Selle kohtspikker ütleb, milline muudatus tagasi võetakse.',
  'help.guide.undo-change.result': 'Plaan on jälle selline, nagu oli, ja lühike teade ütleb, mis tagasi võeti.',
  'help.guide.undo-change.tip.1':
    '„Võta tagasi“ hõlmab plaani: kohtade lisamist, määramist, eemaldamist, ümberjärjestamist, teisaldamist ja lukustamist, päeva tühjendamist, marsruudi optimeerimist, kohtade kustutamist, kategooriate muutmist ja importimist.',
  'help.guide.undo-change.tip.2':
    'Klõpsa uuesti, et minna kaugemale tagasi: TREK hoiab sinu viimast 30 muudatust sellel reisil, uusimad eespool, kuni reisilt lahkud.',
  'help.guide.clear-day.title': 'Tühjenda päev',
  'help.guide.clear-day.goal': 'Eemalda päevast korraga kõik kohad, näiteks et päev otsast peale uuesti planeerida.',
  'help.guide.clear-day.step.1': 'Paremklõpsa plaanis päeva päisel.',
  'help.guide.clear-day.step.2': 'Vali „Tühjenda päev“ ja kinnita.',
  'help.guide.clear-day.result':
    'Päev on tühi ja selle kohad on loendis tagasi planeerimata kohtadena. Päevade kohal olev tagasivõtmise nool toob need tagasi.',
  'help.guide.clear-day.tip.1': 'Eemaldatakse ainult kohad. Päeva märkmed ja broneeringud jäävad alles.',

  // ── Screen: trip-places ───────────────────────────────────────────────────────────────
  'help.ctx.trip-places.title': 'Kohad',
  'help.ctx.trip-places.summary':
    'Plaani parem veerg: kõik reisi kohad, planeeritud või mitte, koos otsingu, filtrite ja sortimisega ning võimalustega kohti lisada: otsingu kaudu, käsitsi või jagatud nimekirjast. Ülaosas olevad „Kohad“ ja „Retked“ vahetavad kohtade ja reisi retkede vahel.',
  'help.ctx.trip-places.bullet.1':
    'Veeru ülaosas olevad „Kohad“ ja „Retked“ vahetavad loendit. Saabudes on avatud „Kohad“. „Retked“ loetleb reisi retked ja impordib GPX-, KML- ja KMZ-faile nupuga „Impordi GPX või KML“; retki kohtade loendis ei näidata.',
  'help.ctx.trip-places.bullet.2':
    '„Lisa koht või tegevus“ avab vormi koha jaoks, mida otsid või sisestad. Kui päev on avatud, on nupul kirjas „Uus koht“ ja selle kõrval olev „Päevale“ loob koha otse sellele päevale.',
  'help.ctx.trip-places.bullet.3':
    'Selle kõrval olev ikoonnupp „Impordi kohad“ pakub valikut „Nimekirja import“ Google Mapsist või Naver Mapsist jagatud nimekirja jaoks. Kui administraator on lisamooduli „Retked“ välja lülitanud, pakub see ka valikut „Impordi fail“ .gpx-, .kml- ja .kmz-failide jaoks ning faili saab lohistada veergu.',
  'help.ctx.trip-places.bullet.4':
    'Nende all on „Otsi“, mis otsib ka kirjeldustest ja märkmetest, ning selle kõrval märkeruut „Vali“. Selle all olevas reas on filtrid: „Näita“ vahetab valikute „Kõik“, „Planeerimata“ ja „Plaanis“ vahel, igaühel oma arv. Sildinupp filtreerib kategooria järgi, täht minimaalse hinnangu järgi, gloobus (kui reis hõlmab rohkem kui üht riiki või piirkonda) riigi või piirkonna järgi ning „Sordi“ määrab loendi järjekorra.',
  'help.ctx.trip-places.bullet.5':
    'Real on pilt, nimi ja kirjeldus või aadress ning tärn keskmise hinnanguga, kui keegi on kohta hinnanud. Klõpsa real, et näha koha üksikasju, lohista see päevale või tee paremklõps (või klõpsa kolmel täpil „Veel valikuid“), et valida „Muuda“, „+ Päev“, „Ava veebisait“, Google Maps, „Salvesta kogumikku“ ja „Kustuta“.',
  'help.ctx.trip-places.bullet.6':
    'Kui päev on avatud, lisab rea lõpus olev ümmargune + („+ Päev“) koha sellele päevale. See on näha igal kohal, mis pole veel sellel päeval. „Plaanis“ näitab siis ainult selle päeva kohti ja silt „Näidatakse ainult avatud päeva“ annab sellest teada. Selle x, „Näita kogu reisi“, sulgeb päeva.',
  // create-place
  'help.guide.create-place.title': 'Loo koht',
  'help.guide.create-place.goal': 'Lisa koht või tegevus käsitsi koos kõigi andmetega, mida plaan vajab.',
  'help.guide.create-place.step.1':
    'Klõpsa kohtade veeru ülaosas „Lisa koht või tegevus“ („Uus koht“, kui päev on avatud). Vorm avaneb ja kursor on otsinguväljal.',
  'help.guide.create-place.step.2':
    "Kirjuta koha nimi väljale „Otsi kohti…“ ja vali tulemus. Dialoogi ülaosas olev nimi, „Aadress“, „Laiuskraad“, „Pikkuskraad“ ja „Veebisait“ täituvad ning vasakul olev „Koha üksikasjad“ näitab pilte, lahtiolekuaegu ja kirjeldust. Google'i võtmega TREKis saad tulemuste all oleva lingiga otsida sama koha hoopis Google'i kaudu, kui see polnud õige. Kui „Kogumikud“ on sees, pakub paremal olev „Salvestatud kohad“ samamoodi sinu nimekirjade kohti.",
  'help.guide.create-place.step.3':
    'Klõpsa jaotises „Koha üksikasjad“ rubriigi „Vali pilt“ all pildil, et teha sellest koha pilt. „Kasuta seda teksti“ kopeerib kirjelduse vormi.',
  'help.guide.create-place.step.4':
    'Kontrolli vormi välju. Ainus kohustuslik väli on nimi dialoogi ülaosas. Selle all oleva kategooriasildiga valid ühe reisi kategooriatest ja kõrval oleva +-iga lood uue. „Aadress“, „Laiuskraad“ ja „Pikkuskraad“ tulevad otsingust või sisestad need ise. „Kirjeldus“ ja „Märkmed“ on sinu enda teksti jaoks. „Veebisait“ on lingi jaoks, jaotise „Failid“ all olev „Lisa“ lisab dokumendi ning „Telefon“, „E-post“ ja „Lisa lahtiolekuajad“ on andmete jaoks, mida otsing ei leidnud.',
  'help.guide.create-place.step.5':
    'Klõpsa „Lisa“. Kui reisil on juba sama nime või asukohaga koht, näitab TREK hoiatust ja nupul on nüüd kirjas „Lisa siiski“.',
  'help.guide.create-place.result':
    'Koht on loendis ja kaardil jaotises „Planeerimata“, kuni see mõnele päevale pannakse.',
  'help.guide.create-place.tip.1':
    'Kui lisamoodul „Eelarve“ on sees, avab vormi allosas olev „Kulud“ kohe pärast salvestamist kulude redaktori koha kulu jaoks. Dialoogi kleebitud pilt või PDF lisatakse failina jaotisse „Failid“.',
  'help.guide.create-place.tip.2':
    "Igas TREKis annavad otsingutulemused TREKi indeks ja OpenStreetMap ning „Koha üksikasjad“ täidetakse automaatselt Wikipediast, Wikivoyage'ist ja Wikimediast. Google'i poole pöördub TREK ainult siis, kui mõlemad ei leia midagi, ja hinnanguid annab ainult Google.",
  'help.guide.create-place.tip.3':
    'Koha saad luua ka kaardil: paremklõpsa sobival kohal ja avaneb vorm, kus koordinaadid ja aadress on juba täidetud.',
  // place-to-open-day
  'help.guide.place-to-open-day.title': 'Lisa koht otse avatud päevale',
  'help.guide.place-to-open-day.goal': 'Loo või vali koht ja lisa see ühe sammuga päevale.',
  'help.guide.place-to-open-day.step.1':
    'Klõpsa päevade veerus päeva päisel. Päev on avatud: selle kaart on esile tõstetud ja kohtade veerus on nupu „Uus koht“ kõrval nupp „Päevale“.',
  'help.guide.place-to-open-day.step.2':
    '„Päevale“ avab sama vormi mis „Uus koht“, kuid koht lisatakse avatud päevale kohe, kui klõpsad „Lisa“.',
  'help.guide.place-to-open-day.step.3':
    'Olemasoleva koha lisamiseks avatud päevale klõpsa selle rea lõpus ümmargusel +-il („+ Päev“) või tee real paremklõps ja vali „+ Päev“. + on näha igal kohal, mis pole veel sellel päeval.',
  'help.guide.place-to-open-day.step.4':
    'See töötab ka vastupidi, ilma päeva enne avamata: lohista koha rida veerust välja ja aseta päevakaardile. Kui asetad selle kahe peatuse vahele, jääb see täpselt sinna.',
  'help.guide.place-to-open-day.result':
    'Koht lisatakse päeva alla viimaseks. Lohista see üles või alla õigesse kohta.',
  'help.guide.place-to-open-day.tip.1':
    'Avatud päev mõjutab ka otsingut: kui päev on avatud, lähtuvad kaart ja läheduse otsing selle päeva kohtadest.',
  'help.guide.place-to-open-day.tip.2': 'Päevade kohal tööriistaribal olev „Võta tagasi“ tühistab määramise.',
  // filter-places
  'help.guide.filter-places.title': 'Leia koht loendist',
  'help.guide.filter-places.goal': 'Näita veerus ainult neid kohti, mida otsid.',
  'help.guide.filter-places.step.1':
    'Otsingu all olev rippmenüü „Näita“ vahetab valikute „Kõik“, „Planeerimata“ (pole veel ühelgi päeval) ja „Plaanis“ (on mõnel päeval) vahel, igaühel oma arv. Kui lisamoodul „Retked“ on välja lülitatud ja imporditi GPX-rada, on valikus ka „Rajad“.',
  'help.guide.filter-places.step.2':
    'Kirjuta ülal olevale väljale „Otsi“. Loend kitseneb kirjutamise ajal nime, aadressi, kirjelduse ja märkmete järgi; väljal olev x tühjendab selle.',
  'help.guide.filter-places.step.3':
    'Valiku „Näita“ kõrval olev sildinupp loetleb kategooriad: märgi üks või mitu, nende hulgas ka „Kategooriata“. Nupul on näha, mitu on märgitud, ja loendi allosas olev „Tühjenda filter“ eemaldab kõik.',
  'help.guide.filter-places.step.4':
    'Selle kõrval olev tärn määrab minimaalse hinnangu: 5+, 4+ jne jätavad alles ainult kohad, mille keskmine hinnang on vähemalt nii kõrge. Hinnanguta kohad peidetakse.',
  'help.guide.filter-places.result':
    'Valiku „Näita“ juures olev arv näitab, mitu kohta sobib, ja filtrid toimivad koos.',
  'help.guide.filter-places.tip.1':
    'Kui päev on avatud, näitab „Plaanis“ ainult seda päeva ja ütleb seda ka: „Näidatakse ainult avatud päeva“, selle kõrval „Näita kogu reisi“.',
  'help.guide.filter-places.tip.2':
    'Kaart arvestab samuti valikut „Näita“, kategooriaid ja hinnangut ning kui päev on avatud, näitab „Plaanis“ kaardil ainult selle päeva kohti. Otsing ja gloobus filtreerivad ainult loendit.',
  // edit-place
  'help.guide.edit-place.title': 'Muuda kohta',
  'help.guide.edit-place.goal': 'Paranda nime, liiguta markerit, lisa veebisait või muuda kategooriat.',
  'help.guide.edit-place.step.1':
    'Tee real paremklõps ja vali „Muuda“ või klõpsa rea lõpus „Veel valikuid“ või ava koht ja klõpsa selle üksikasjades „Muuda“.',
  'help.guide.edit-place.step.2':
    'Muuda dialoogis „Muuda kohta“, mida vaja: nime ja kategooriasilti dialoogi ülaosas, välju „Aadress“, „Laiuskraad“ ja „Pikkuskraad“, „Kirjeldus“, „Märkmed“, „Veebisait“, „Telefon“, „E-post“ ja lahtiolekuaegu. Kui koht on täpselt ühel päeval või avasid selle päeva kaudu, on vormis ka „Algus“, „Lõpp“ ja „Selle päeva märkmed“.',
  'help.guide.edit-place.step.3': 'Klõpsa „Uuenda“.',
  'help.guide.edit-place.result':
    'Muudatus kehtib kõikjal, kus koht on: loendis, kaardil ja igal päeval, kuhu see kuulub.',
  'help.guide.edit-place.tip.1':
    '„Selle päeva märkmed“ kuuluvad kohale ainult sellel ühel päeval, „Märkmed“ kuuluvad kohale endale.',
  'help.guide.edit-place.tip.2':
    'Kui „Lõpp“ on enne „Algust“, ei saa „Uuenda“ klõpsata. „Ajaline kattuvus:“ ainult hoiatab, et päeva mõnel teisel peatusel on sama aeg.',
  // delete-place
  'help.guide.delete-place.title': 'Kustuta koht',
  'help.guide.delete-place.goal': 'Eemalda koht reisilt jäädavalt.',
  'help.guide.delete-place.step.1':
    'Tee real paremklõps ja vali „Kustuta“ (see on ka rea lõpus olevas menüüs „Veel valikuid“) või klõpsa koha üksikasjades „Kustuta“.',
  'help.guide.delete-place.step.2':
    'Klõpsa kinnitusküsimuses „Kustuta“. Kui kohas on broneeritud öö või kohaga on seotud broneering, on küsimuses kirjas, mis koos sellega kustutatakse.',
  'help.guide.delete-place.result':
    'Koht eemaldatakse loendist, kaardilt ja kõigilt päevadelt. Päevade kohal oleva tööriistariba „Võta tagasi“ taastab selle.',
  'help.guide.delete-place.tip.1':
    'Kui tahad koha eemaldada ainult ühelt päevalt, kasuta selle peatuse juures hoopis „Eemalda päevast“.',
  'help.guide.delete-place.tip.2':
    'Kui tahad kustutada mitu kohta korraga, klõpsa valiku alustamiseks otsingu kõrval oleval linnukesel.',
  // select-places
  'help.guide.select-places.title': 'Muuda või kustuta mitu kohta korraga',
  'help.guide.select-places.goal': 'Muuda korraga paljusid kohti, mitte ükshaaval.',
  'help.guide.select-places.step.1':
    'Klõpsa otsinguvälja kõrval olevat linnukest. Ridadele ilmuvad ümmargused märkeruudud ja veeru alla ilmub toimingute riba.',
  'help.guide.select-places.step.2':
    'Klõpsa ridadel, et need märkida. „Vali kõik“, ribal olev topeltlinnuke, valib kõik read, mida filtrid näitavad.',
  'help.guide.select-places.step.3':
    'Ribal on märgitud kohtade arv. „Muuda kategooriat“ annab neile kõigile ühe kategooria; „Salvesta kogumikku“ (kui „Kogumikud“ on sees) kopeerib need ühte sinu kogumikku; „Kustuta valitud“ eemaldab need pärast kinnitust.',
  'help.guide.select-places.step.4': 'Valiku lõpetamiseks klõpsa riba lõpus oleval X-il „Valmis“.',
  'help.guide.select-places.result':
    'Muudatus kehtib kõigile valitud kohtadele. Kustutamise saad tagasi võtta päevade kohal olevalt tööriistaribalt.',
  'help.guide.select-places.tip.1':
    'Filtrid töötavad ka valimise ajal: filtreeri kõigepealt „Planeerimata“ ja siis valib „Vali kõik“ ainult need kohad.',
  'help.guide.select-places.tip.2':
    '„Märgi oma nimekirjades külastatuks“ ilmub ribale, kui lisamoodul „Kogumikud“ on sisse lülitatud: see märgib kohad külastatuks kogumikes, kuhu need on salvestatud.',
  // import-places-file
  'help.guide.import-places-file.title': 'Impordi kohad GPX-, KML- või KMZ-failist',
  'help.guide.import-places-file.goal':
    'Kui lisamoodul „Retked“ on väljas, impordi Google My Mapsi, Google Earthi või GPS-seadme eksporditud nööpnõelad ja teekonnad kohtadena.',
  'help.guide.import-places-file.step.1':
    'Klõpsa lisamisnupu kõrval oleval ikoonnupul „Impordi kohad“ ja vali „Impordi fail“ või lohista fail ükskõik kuhu kohtade veerus. Mõlemad on saadaval ainult siis, kui administraator on lisamooduli „Retked“ välja lülitanud.',
  'help.guide.import-places-file.step.2':
    'Vali fail või lohista see kasti. GPX-i puhul märgi, mida importida: „Teekonnapunktid“, „Marsruudid“, „Rajad (koos teekonna geomeetriaga)“. KML-i ja KMZ puhul märgi „Punktid (Placemarks)“ ja „Teekonnad (LineStrings)“.',
  'help.guide.import-places-file.step.3':
    'Kasti saab korraga lisada mitu faili, kuid ainult .gpx-, .kml- ja .kmz-faile. Muud tüüpi või üle 10 MB faili dialoog ei võta vastu ja seda ei impordita.',
  'help.guide.import-places-file.step.4':
    'Klõpsa „Impordi“. Teade näitab, mitu kohta imporditi. KML- või KMZ-faili puhul jääb dialoog avatuks ja näitab kokkuvõtet sellest, mis loodi ja mis vahele jäeti.',
  'help.guide.import-places-file.result':
    'Kohad on loendis. Rajal on real värviline joon, see on kaardil näha ja sellel on oma filter „Rajad“.',
  'help.guide.import-places-file.tip.1':
    'Liiga suur fail lükatakse tagasi ja TREK näitab suuruspiirangut. Ekspordi fail uuesti ilma fotodeta või jaga see osadeks.',
  'help.guide.import-places-file.tip.2': 'Kogu importimise saad tagasi võtta päevade kohal olevalt tööriistaribalt.',
  // import-places-list
  'help.guide.import-places-list.title': 'Impordi jagatud Google Mapsi või Naver Mapsi nimekiri',
  'help.guide.import-places-list.goal': 'Impordi kohad jagatud nimekirja lingist.',
  'help.guide.import-places-list.step.1':
    'Klõpsa lisamisnupu kõrval oleval ikoonnupul „Impordi kohad“ ja vali „Nimekirja import“.',
  'help.guide.import-places-list.step.2':
    "Vali jaotises „Teenusepakkuja“ „Google'i nimekiri“ või „Naveri nimekiri“, seejärel kleebi nimekirja jagamislink väljale „Lingi“. Töötab ka Google Mapsi teekonnalink: selle peatustest saavad kohad sõidujärjekorras.",
  'help.guide.import-places-list.step.3': 'Klõpsa „Impordi“.',
  'help.guide.import-places-list.result':
    'Kõik nimekirja kohad on reisil nimekirjas olevate nimedega; reisil juba olevad kohad jäetakse vahele.',
  'help.guide.import-places-list.tip.1':
    'Nimekiri peab olema avalikult jagatud. Privaatse nimekirja lingiga ei impordita midagi.',
  'help.guide.import-places-list.tip.2':
    "„Täienda kohtade andmeid Google'i kaudu“ ilmub aknasse, kui sinu TREKil on Google'i võti: see otsib üles iga imporditud koha ja lisab fotod, aadressi ja üksikasjad.",
  'help.guide.sort-places.title': 'Sordi kohtade loend',
  'help.guide.sort-places.goal': 'Sordi loend nime, hinnangu või viimati lisatu või muudetu järgi.',
  'help.guide.sort-places.step.1':
    'Klõpsa filtrirea lõpus oleval nooltega nupul „Sordi“. Linnuke tähistab praegust järjekorda ja nupu vihje näitab selle nime.',
  'help.guide.sort-places.step.2':
    'Vali järjekord, näiteks „Kõrgeima hindega“, või sordi nime järgi. Loend uueneb kohe.',
  'help.guide.sort-places.result': 'Loend näitab kohti sinu valitud järjekorras, kuni valid mõne muu.',
  'help.guide.sort-places.tip.1':
    'Kui järjestus on midagi muud kui „Viimati lisatud“, on nupp esile tõstetud, nii et näed kohe, et loend on teisiti sorditud.',
  'help.guide.sort-places.tip.2':
    'Sortimine muudab ainult loendit. Päevade järjekord jääb samaks ja brauser jätab valitud järjekorra meelde.',
  'help.guide.place-by-hand.title': 'Lisa koht, mida otsing ei leia',
  'help.guide.place-by-hand.goal':
    'Sisesta koht ise koos telefoni, e-posti ja lahtiolekuaegadega, kui kohaotsing midagi ei leia.',
  'help.guide.place-by-hand.step.1':
    'Kirjuta koha aknas nimi otsingusse ja vajuta Enter. Kui midagi ei leita, annab aken sellest teada ja pakub valikut „Lisa käsitsi“.',
  'help.guide.place-by-hand.step.2':
    'Klõpsa „Lisa käsitsi“. Otsitud tekstist saab nimi ja aken kerib kontaktväljadeni.',
  'help.guide.place-by-hand.step.3': 'Täida „Telefon“ ja „E-post“, kui need on sulle teada.',
  'help.guide.place-by-hand.step.4':
    'Klõpsa „Lisa lahtiolekuajad“ ja määra, millal koht igal päeval avatakse ja suletakse. Kopeerimisnupp annab kõigile päevadele esimese päeva ajad, päeva lüliti märgib selle päeva olekuks „Suletud“.',
  'help.guide.place-by-hand.step.5': 'Klõpsa „Lisa“.',
  'help.guide.place-by-hand.result':
    'Koht lisatakse loendisse. Selle üksikasjades on näha sinu sisestatud telefon, e-post ja lahtiolekuajad, täpselt nagu otsinguga leitud kohal.',
  'help.guide.place-by-hand.tip.1':
    'Kui muudad kohta, millel pole oma lahtiolekuaegu, kopeeritakse ajad automaatselt vasakult paneelilt „Koha üksikasjad“. Kui ajad on juba olemas, kopeerib nende kõrval olev nupp leitud ajad.',
  'help.guide.place-by-hand.tip.2':
    'Sinu sisestatud lahtiolekuajad asendavad leitud ajad, nii et hooajaliste aegadega kohvikul on näha need ajad, mida sina tead.',

  // ── Screen: trip-days ─────────────────────────────────────────────────────────────────
  'help.ctx.trip-days.title': 'Päevad',
  'help.ctx.trip-days.summary':
    'Plaani vasak veerg: iga päeva kohta kaart, kus on peatused järjekorras, märkmed, päeva broneeringud ja transport ning peatustevaheline marsruut. Siin reisi tegelikult planeeritaksegi.',
  'help.ctx.trip-days.bullet.1':
    'Ülaosas olev päis: vasakul „Ekspordi“ (PDF, kalender, GPX); paremal tagasivõtmise nool, „Laienda kõik päevad“ / „Ahenda kõik päevad“, „Muuda päevade järjekorda“ ja „Näita kõiki broneeringute marsruute“, kui mõnel broneeringul on joonistatav marsruut.',
  'help.ctx.trip-days.bullet.2':
    'Päevakaart: ruut päeva numbri ja ilmaprognoosiga, pealkiri („Päev 1“, kuni annad päevale nime) ja kuupäev ning nende all sildid ööbimise (sisseregistreerimisel roheline, väljaregistreerimisel punane, katkendlik, kuni see pole kinnitatud; pileti ikoon avab broneeringu) ja rendiauto jaoks. Klõpsa päisel, et päev avada, nool paneb selle kokku ja + („Lisa päevale“) avab menüü: „Lisa koht sellele päevale“, „Lisa majutus“, „Lisa transport“, „Ühistransport“ ja „Lisa märge“. Paremklõps päisel pakub sama ja lisaks „Tühjenda päev“.',
  'help.ctx.trip-days.bullet.3':
    'Päeva sees: peatused järjekorras, igaühel pilt, kategooriaikoon, nimi, kellaaeg ja kirjeldus, sellega seotud broneeringud ja osalejad; märkmed; päeva broneeringud ja transport, värvitud tüübi järgi. Vii kursor peatusele, et näha lohistamispidet, pildil olevat lukku, nooli, „Lisa broneering“ ja kolme täppi („Veel valikuid“). Peatuste ja märkmete menüü avaneb ka paremklõpsuga.',
  'help.ctx.trip-days.bullet.4':
    'Kui avatud päeval on kaks peatust, ilmub nende alla marsruudiriba: „Marsruut“ näitab päeva kaardil ja iga peatustevahelise lõigu sõiduaega, kolm ikooni määravad päevale „Auto“, „Jalgsi“ või „Jalgratas“, seejärel „Optimeeri“, „Ava Google Mapsis“ ja „Ava CoMapsis“.',
  'help.ctx.trip-days.bullet.5':
    'Kohti saab päevale lisada mitmel viisil: lohista rida kohtade veerust, kasuta selle rea nuppu „+ Päev“, vali päeva + menüüs või tühjal päeval „Lisa koht sellele päevale“ või lisa koht selle üksikasjadest.',
  'help.ctx.trip-days.bullet.6':
    'All olev „Kogukulu“ liidab kokku jaotise „Kulud“ kulud, mis kuuluvad päeva peatustele ja broneeringutele, igaühe üks kord, sinu kuvamisvaluutas.',
  // read-day-plan
  'help.guide.read-day-plan.title': 'Loe päeva plaani',
  'help.guide.read-day-plan.goal': 'Saa enne muutmist aru, mida päeva kaardi iga osa näitab.',
  'help.guide.read-day-plan.step.1':
    'Päis: ruut päeva numbri ja ilmaprognoosiga, seejärel „Päev 1“ või sinu antud pealkiri ja kuupäev. Nende all sildid ööbimise (sisseregistreerimisel roheline, väljaregistreerimisel punane, katkendlik, kuni pole kinnitatud; selle pileti ikoon avab broneeringu) ja rendiauto jaoks. Klõpsa päisel, et päev avada (selle üksikasjade paneel avaneb kaardi peal). Paremal olev + („Lisa päevale“) lisab koha, majutuse, transpordi, ühistranspordiühenduse või märkme ning nool paneb kaardi kokku.',
  'help.guide.read-day-plan.step.2':
    'Peatusel on näha pilt, kategooriaikoon ja nimi, seejärel kellaaeg, kui sellel on „Algus“, ning kirjeldus. Selle all on „Selle päeva märkmed“. Kui viid kursori reale, ilmuvad juhtnupud: vasakul olevast pidemest saad rida lohistada, pilt muutub marsruudi optimeerimise lukuks ning paremas otsas on nooled („Liiguta üles“, „Liiguta alla“), „Lisa broneering“ ja kolm täppi („Veel valikuid“).',
  'help.guide.read-day-plan.step.3':
    'Peatuse broneering on peatusel märgina „Broneering“: roheline, kui see on kinnitatud, ja merevaigukollane, kui see on ootel, koos kellaaja ja vedajaga. Klõpsa märgil, et broneering avada; selle kõrval olev marsruudinupp joonistab broneeringu marsruudi. Transpordil on oma rida, mis on värvitud tüübi järgi, koos kellaaja ja märkega „Väljumine“ või „Saabumine“. Klõpsa broneeringul, et avada selle üksikasjad; seal saad seda nupuga „Muuda“ muuta.',
  'help.guide.read-day-plan.step.4':
    'Kui „Marsruut“ on sees, näitab kahe peatuse vaheline ühendus, kui kaua lõik päeva liikumisviisiga aega võtab ja kui pikk see on; klõpsa sellel, et muuta just selle lõigu liikumisviisi.',
  'help.guide.read-day-plan.step.5':
    'Avatud päeva peatuste all olev marsruudiriba: „Marsruut“ joonistab päeva teekonna kaardile, kolm ikooni valivad „Auto“, „Jalgsi“ või „Jalgratas“, seejärel järjestab „Optimeeri“ peatused ümber ning „Ava Google Mapsis“ ja „Ava CoMapsis“ avavad päeva seal.',
  'help.guide.read-day-plan.result':
    'Igal kaardi sümbolil on tähendus. Allolevad juhendid selgitavad, kuidas igaüht neist muuta.',
  'help.guide.read-day-plan.tip.1':
    'Tee peatusel paremklõps või klõpsa selle kolmel täpil, et avada menüü: „Muuda“, „Eemalda päevast“, „Jäta marsruudist välja“, „Ava veebisait“, „Salvesta kogumikku“, „Kustuta“. Navigeerimisrakendused on koha üksikasjades jaotises „Navigeerimine“.',
  'help.guide.read-day-plan.tip.2':
    'Vii kursor peatuse kohale ja rea lõppu ilmub „Lisa broneering“. Sealt loodud broneering seotakse selle päeva selle peatusega.',
  // place-onto-day
  'help.guide.place-onto-day.title': 'Lisa koht päevale',
  'help.guide.place-onto-day.goal': 'Tee loendis olevast kohast päeva peatus õigel kohal järjekorras.',
  'help.guide.place-onto-day.step.1':
    'Lohista rida kohtade veerust päevakaardile. Aseta see kahe peatuse vahele, et panna see täpselt sinna, või päeva päisele, et lisada see lõppu.',
  'help.guide.place-onto-day.step.2':
    'Ilma lohistamata: ava päev, klõpsates selle päisel, seejärel klõpsa koha rea lõpus ümmargusel +-il („+ Päev“) või tee real paremklõps ja vali „+ Päev“.',
  'help.guide.place-onto-day.step.3':
    '„Lisa koht sellele päevale“ päeva + menüüs või tühjal päeval avab kohavormi ja uus koht lisatakse kohe sellele päevale.',
  'help.guide.place-onto-day.step.4':
    'Kui päev on avatud, lisab koha üksikasjades olev „Lisa päevale“ koha sellele päevale; kohtade veeru päises olev „Päevale“ loob uue koha otse avatud päevale.',
  'help.guide.place-onto-day.result':
    'Koht on nüüd päeva peatus. See on kaardil päeva numbriga ja kohtade veerg loeb selle jaotisse „Plaanis“.',
  'help.guide.place-onto-day.tip.1':
    'Koht võib olla mitmel päeval: lisa see teisele päevale kohtade veerust. Kui lohistad peatuse ühe päeva kaardilt teisele, see hoopis liigub.',
  'help.guide.place-onto-day.tip.2': 'Päises olev tagasivõtmise nool tühistab määramise.',
  'help.guide.place-onto-day.tip.3':
    'Peatust ei saa panna kahe kindla kellaajaga kirje vahele ega kellaajaga broneeringu ette: plaan jääb ajalisse järjekorda.',
  // reorder-stops
  'help.guide.reorder-stops.title': 'Muuda päeva järjekorda',
  'help.guide.reorder-stops.goal': 'Liiguta peatust üles või alla või teisele päevale.',
  'help.guide.reorder-stops.step.1': 'Vii kursor peatuse kohale ja lohista see pidemest kaardil uude kohta.',
  'help.guide.reorder-stops.step.2':
    'Või kasuta kursori all oleva peatuse paremas otsas olevaid nooli („Liiguta üles“, „Liiguta alla“): üks samm klõpsu kohta.',
  'help.guide.reorder-stops.step.3':
    'Lohista peatus teise päeva kaardile, et see sinna viia; vanalt päevalt see eemaldatakse.',
  'help.guide.reorder-stops.step.4':
    'Kui peatusel on kindel kellaaeg ja teisaldamine rikuks päeva järjekorra, küsib TREK „Kas eemaldada kellaaeg?“, sest kellaaeg määrab peatuse asukoha. „Kinnita“ eemaldab kellaaja, nii et peatuse saab panna kuhu tahes. „Tühista“ jätab päeva endiseks.',
  'help.guide.reorder-stops.result': 'Marsruut ja sõiduajad uuenevad kohe uue järjekorra järgi.',
  'help.guide.reorder-stops.tip.1':
    'Kindla kellaajaga broneering jääb oma kellaajale vastavasse kohta. Kui lohistad selle oma päeva sees mujale, liigub see tagasi. Kui lohistad selle teisele päevakaardile, liigub see sellele päevale.',
  'help.guide.reorder-stops.tip.2':
    'Marsruudiribal olev „Optimeeri“ järjestab kogu päeva lühima tee järgi, kui päeval on vähemalt kolm peatust. Peatuse paigal hoidmiseks lukusta see enne.',
  // set-stop-times
  'help.guide.set-stop-times.title': 'Määra peatusele kellaaeg',
  'help.guide.set-stop-times.goal': 'Määra, millal peatus algab ja lõpeb, et päev toimiks ajakavana.',
  'help.guide.set-stop-times.step.1':
    'Paremklõpsa peatusel või klõpsa selle kolmel punktil ja vali „Muuda“. Kui avad vormi päevast, on seal kohe asukoha all selle päeva „Algus“ ja „Lõpp“.',
  'help.guide.set-stop-times.step.2':
    'Sisesta „Algus“ ja soovi korral „Lõpp“. „Ajaline kattuvus:“ hoiatab, kui mõni teine sama päeva kellaajaga peatus kattub. Kui „Lõpp“ on enne „Algust“, ei saa „Uuenda“ klõpsata.',
  'help.guide.set-stop-times.step.3':
    'Klõpsa „Uuenda“. Peatus saab ajamärgi ja liigub päevas oma kellaajale vastavale kohale.',
  'help.guide.set-stop-times.result':
    'Kellaajaga peatused säilitavad oma koha järjekorras; kellaajata peatused sorditakse nende ümber.',
  'help.guide.set-stop-times.tip.1':
    'Kellaaeg kuulub selle päeva peatusele. Samal kohal võib teisel päeval olla teine kellaaeg.',
  'help.guide.set-stop-times.tip.2':
    'Kellaajaga peatuse käsitsi liigutamiseks lohista seda. TREK küsib „Kas eemaldada kellaaeg?“ ja kui klõpsad „Kinnita“, kellaaeg eemaldatakse.',
  'help.guide.set-stop-times.tip.3':
    'Sama vormi väli „Selle päeva märkmed“ on info jaoks, mis kehtib ainult sellel päeval, näiteks laua broneering või piletinumber.',
  // remove-from-day
  'help.guide.remove-from-day.title': 'Eemalda peatus päevast',
  'help.guide.remove-from-day.goal': 'Eemalda koht päevast, ilma et see reisilt kustuks.',
  'help.guide.remove-from-day.step.1':
    'Tee peatusel paremklõps või klõpsa selle kolmel täpil ja vali „Eemalda päevast“.',
  'help.guide.remove-from-day.step.2':
    'Peatus eemaldatakse päevast. Koht jääb kohtade veergu, jaotisesse „Planeerimata“, kui see pole üheski teises päevas.',
  'help.guide.remove-from-day.result': 'Päev, selle marsruut ja kulu uuenevad. Tagasivõtmise nool taastab peatuse.',
  'help.guide.remove-from-day.tip.1': 'Sama menüü „Kustuta“ eemaldab koha kogu reisilt, kõigilt päevadelt.',
  'help.guide.remove-from-day.tip.2': '„Eemalda päevast“ on ka koha üksikasjade paneelil, nupu „Lisa päevale“ kõrval.',
  // lock-stop
  'help.guide.lock-stop.title': 'Lukusta peatus paigale',
  'help.guide.lock-stop.goal': 'Hoia peatus marsruudi optimeerimisel oma kohal.',
  'help.guide.lock-stop.step.1':
    'Vii kursor peatuse pildi kohale ja klõpsa lukul „Säilita asukoht marsruudi optimeerimisel“.',
  'help.guide.lock-stop.step.2':
    '„Optimeeri“ sordib nüüd teised peatused selle ümber. Lukustuse eemaldamiseks klõpsa uuesti lukul („Lukustuse eemaldamiseks klõpsa“).',
  'help.guide.lock-stop.result': 'Lukk on pildil näha; peatus jääb oma kohale, kuni selle lukust vabastad.',
  'help.guide.lock-stop.tip.1': 'Kindla kellaajaga peatuse lukustab tema kellaaeg, optimeerimisel see kunagi ei liigu.',
  'help.guide.lock-stop.tip.2':
    'Lukk kehtib ainult seni, kuni lehte uuesti ei laadi. Pärast uuesti laadimist on kõik peatused jälle lukustamata, paigal püsivad ainult kellaajaga peatused.',
  // day-note
  'help.guide.day-note.title': 'Lisa päevale märkus',
  'help.guide.day-note.goal': 'Salvesta päeva juurde meeldetuletus, piletinumber või varuplaan.',
  'help.guide.day-note.step.1': 'Klõpsa päeva päises +-il („Lisa päevale“) ja vali „Lisa märge“.',
  'help.guide.day-note.step.2':
    'Kirjuta märkuse nimi akna ülaossa, kus on kirjas „Märkus“. Päevakaardil kuvatakse see nimi. Ülejäänu kirjuta välja „Päevamärge“ alla: selle kohal olev tööriistariba vormindab teksti (paks kiri, loendid, lingid, tsitaadid) ja vasakul olev „Eelvaade“ näitab, milline rida välja näeb.',
  'help.guide.day-note.step.3':
    'Vali „Ikoon“ ja „Värv“, et märkust oleks peatustest lihtne eristada, ning klõpsa „Lisa“.',
  'help.guide.day-note.step.4':
    'Märge on päevas nagu peatus: lohista see õigesse kohta või kasuta selle nooli. Klõpsa märkel, et seda muuta. „Kustuta“ on dialoogis ning märkme kolme täpi või paremklõpsu menüüs ja küsib enne „Kas kustutada märge?“.',
  'help.guide.day-note.result': 'Märge on päeva ja PDF-i osa just seal, kuhu selle lohistasid.',
  'help.guide.day-note.tip.1':
    'Märkmes olevad lingid avanevad uuel vahekaardil ja üksik reavahetus jääb reavahetuseks.',
  'help.guide.day-note.tip.2': 'Märkmed on päevapõhised. Kogu reisi puudutav märge kuulub jaotisse „Koostöö“.',
  // day-route
  'help.guide.day-route.title': 'Näita ja optimeeri päeva marsruuti',
  'help.guide.day-route.goal':
    'Vaata peatustevahelist marsruuti, vali liikumisviis ja lase TREKil järjekord paika panna.',
  'help.guide.day-route.step.1':
    'Ava päev ja klõpsa peatuste all olevas marsruudiribal „Marsruut“: peatustevaheline marsruut joonistatakse kaardile ja peatuste vahelised ühendused näitavad iga lõigu aega ja pikkust.',
  'help.guide.day-route.step.2':
    'Selle kõrval olevad kolm ikooni määravad päeva liikumisviisi: „Auto“, „Jalgsi“ või „Jalgratas“. Lõigud arvutatakse uuesti. Pluginad võivad lisada oma liikumisviise.',
  'help.guide.day-route.step.3':
    'Klõpsa ühendusel, et muuta just selle lõigu liikumisviisi: vali liikumisviis, „Ühistransport“, et otsida sellele ühendust, kus see on saadaval, või „Kasuta päeva vaikevalikut“, et kasutada jälle päeva liikumisviisi.',
  'help.guide.day-route.step.4':
    '„Optimeeri“ (ringnool) järjestab peatused lühima tee järgi, kui peatusi on vähemalt kolm. Lukustatud või kindla kellaajaga peatused jäävad oma kohale; kui päeval on majutus, algab marsruut sealt.',
  'help.guide.day-route.step.5':
    '„Ava Google Mapsis“ või „Ava CoMapsis“ avab kogu päeva marsruudina selles rakenduses, et teel navigeerida; CoMaps kasutab ka päeva liikumisviisi.',
  'help.guide.day-route.result': 'Päev on aegadega marsruut. „Kogukulu“ ja teelõigud uuenevad järjekorra muutudes.',
  'help.guide.day-route.tip.1':
    'Marsruudid tulevad vaikimisi OSRM-ist. Administraator saab jaotises „Kasutaja vaikevalikud“ määrata TREKile teise marsruutimismootori.',
  'help.guide.day-route.tip.2':
    'Lõigul, mille marsruuti ei õnnestunud arvutada, aega ei kuvata. Kontrolli, kas mõlemal peatusel on koordinaadid.',
  'help.guide.day-route.tip.3': 'Tagasivõtmise nool tühistab optimeerimise.',
  // manage-days
  'help.guide.manage-days.title': 'Päevade lisamine, ümberjärjestamine ja ümbernimetamine',
  'help.guide.manage-days.goal': 'Muuda päevi endid, mitte ainult nende kohti.',
  'help.guide.manage-days.step.1':
    'Päevad tulevad reisi kuupäevadest. Kui muudad kuupäevi reisi muutmisvormis lehel „Ülevaade“, lisatakse või eemaldatakse päevi alguses või lõpus. Enne sisuga päeva eemaldamist näed loendit, millised päevad eemaldatakse ja mis neil on.',
  'help.guide.manage-days.step.2':
    'Päises olev „Muuda päevade järjekorda“ avab loendi: lohista päeva pidemest või kasuta nuppe „Liiguta üles“ ja „Liiguta alla“ ning päev liigub koos oma kohtade, märkmete ja broneeringutega. Loendi all lisab „Lisa“ järgmise kuupäevaga päeva viimase kuupäevaga päeva järele ja pikendab reisi ühe päeva võrra; „Ilma kuupäevata“ lisab lõppu kuupäevata päeva. Kuupäevadeta reisil on ainult „Lisa päev“.',
  'help.guide.manage-days.step.3':
    'Rea lõpus olev prügikast „Kustuta päev“ küsib enne kinnitust. See loetleb, mis koos päevaga kustutatakse: kohad, märkmed ja broneeringud, majutus, mille sisse- või väljaregistreerimine on sel päeval, ning päevad, mis nihkuvad ühe kuupäeva võrra varasemaks. „Kustuta päev“ eemaldab päeva, „Tühista“ jätab selle alles; viimast päeva ei saa kustutada.',
  'help.guide.manage-days.step.4':
    'Päeva ümbernimetamiseks ava see ja klõpsa kaardi kohal olevas üksikasjade paneelis pealkirja kõrval olevat pliiatsit. Nimi asendab kaardil ja PDF-is teksti „Päev 1“.',
  'help.guide.manage-days.step.5':
    'Päises olevad „Laienda kõik päevad“ ja „Ahenda kõik päevad“ avavad või panevad kokku kõik kaardid korraga. Üksiku kaardi kokkupanekuks klõpsa selle noolel.',
  'help.guide.manage-days.result':
    'Kuupäevad jäävad positsiooni juurde: kui liigutad päeva ülespoole, saab see varasema kuupäeva ning selle peatused, märkmed ja broneeringud liiguvad kaasa.',
  'help.guide.manage-days.tip.1': 'Päevade teisaldamise saad tagasivõtmise noolega tühistada; päeva kustutamist mitte.',
  'help.guide.manage-days.tip.2':
    'Plaani allosas olev „Kogukulu“ liidab kokku kogu reisi kulud; vaheleht „Kulud“ näitab neid täpsemalt.',
  // bookings-in-plan
  'help.guide.bookings-in-plan.title': 'Loe plaanis broneeringuid ja transporti',
  'help.guide.bookings-in-plan.goal': 'Vaata, kus broneering pärast loomist kuvatakse ja millises vaates see luuakse.',
  'help.guide.bookings-in-plan.step.1':
    'Transport (lend, rong, praam, buss, auto) on tüübi järgi värvitud rida, millel on kellaaeg ning väljumise päeval „Väljumine“ või saabumise päeval „Saabumine“; selle kõrval olev gloobus näitab ajavööndit ja vahemaandumisega lennul on iga lõigu kohta eraldi rida. Ühistranspordiühenduse liinide nägemiseks klõpsa noolel. Klõpsa real ja broneering avaneb; seal saad seda nupuga „Muuda“ muuta.',
  'help.guide.bookings-in-plan.step.2':
    'Peatusega seotud broneering (restoran, ekskursioon) on selle peatuse juures märgina „Broneering“ koos kellaajaga. Märk on roheline, kui broneering on kinnitatud, ja merevaigukollane, kui see on ootel. Broneeringul, millel on päev, kuid pole peatust, on päevas oma rida.',
  'help.guide.bookings-in-plan.step.3':
    'Öö hotellis on majutus: selle silt päeva päises on sisseregistreerimise päeval roheline ja väljaregistreerimise päeval punane ning pileti ikoon avab broneeringu. Päeva üksikasjade paneelis on see jaotises „Majutus“ ja kõigi nende päevade marsruut algab sealt.',
  'help.guide.bookings-in-plan.step.4':
    'Broneeringu real olev marsruudinupp joonistab kaardile selle marsruudi; päises olev „Näita kõiki broneeringute marsruute“ joonistab kõik.',
  'help.guide.bookings-in-plan.step.5':
    'Loomine: „Lisa broneering“ kursori all oleval peatusel, „Lisa transport“ ja „Ühistransport“ päeva +-menüüs ning vahelehed „Broneeringud“ ja „Transport“ täieliku loendi, impordi ja failidega.',
  'help.guide.bookings-in-plan.result':
    'Iga broneering on plaanis ühe korra. Vahelehed näitavad samu broneeringuid loendina.',
  'help.guide.bookings-in-plan.tip.1':
    'Kinnitatud ja ootel on olek, mille määrad broneeringule; plaan näitab seda peatusel, vaheleht „Broneeringud“ loendab mõlemaid.',
  'help.guide.bookings-in-plan.tip.2':
    'Kui lohistad kellaajaga broneeringu oma päeva sees mujale, liigub see tagasi oma kellaajale vastavasse kohta. Kui lohistad selle teisele päevakaardile, liigub see sellele päevale. Kellaaja muutmiseks muuda broneeringut.',
  // export-plan
  'help.guide.export-plan.title': 'Ekspordi plaan',
  'help.guide.export-plan.goal': 'Ekspordi plaan dokumendina, oma kalendrisse või GPS-seadmesse.',
  'help.guide.export-plan.step.1': 'Klõpsa päevade kohal oleva päiseriba vasakus servas „Ekspordi“.',
  'help.guide.export-plan.step.2':
    '„Dokument“: PDF avab kõigi päevade prindivaate koos peatuste, märkmete ja broneeringutega, alguses marsruudi ülevaatekaart; „Minu plaan PDF-ina“ sisaldab ainult seda, milles sa osaled. Vaates alustab „Iga päev uuel lehel“ iga päeva uuelt lehelt, „Transpordi märkmed“ lisab sinu transpordi märkmed ja „Salvesta PDF-ina“ laadib selle alla.',
  'help.guide.export-plan.step.3':
    'Kalender: „Laadi alla .ics“ salvestab broneeringud kalendrifailina, „Telli kalender“ annab lingi, mida sinu kalendrirakendus ise värskendab.',
  'help.guide.export-plan.step.4':
    '„Kaardid ja GPS“ (GPX): „Kogu reis“ ekspordib kohad, päevade marsruudid ja rajad; „Ainult kohad“ ainult nööpnõelad; „Päevad marsruutidena“ iga päeva eraldi marsruudina võrguühenduseta kaartide ja GPS-seadmete jaoks.',
  'help.guide.export-plan.result': 'Fail laaditakse alla. Reisil ei muutu midagi.',
  'help.guide.export-plan.tip.1':
    'Ühe päeva avamiseks kaardirakenduses kasuta selle marsruudiriba: „Ava Google Mapsis“ või „Ava CoMapsis“.',
  'help.guide.export-plan.tip.2':
    '„Telli kalender“ eeldab, et kalendrivood on sinu seadetes sisse lülitatud ja sul on õigus reisi jagada; jaotises „Ülevaade“ on selle kohta juhend.',
  'help.guide.export-plan.tip.3':
    'Eksportimiseks piisab lugemisõigusest: iga reisi liige saab eksportida PDF-i, .ics-faili ja GPX-i.',

  // ── Screen: trip-place ────────────────────────────────────────────────────────────────
  'help.ctx.trip-place.title': 'Koha üksikasjad',
  'help.ctx.trip-place.summary':
    'Kaart, mis avaneb kaardi peal, kui valid koha: kõik, mida reis selle kohta teab, kõigi antud tärnhinnangud, pilt ja failid ning nupud, millega lisad koha avatud päevale, avad selle kaardirakenduses või salvestad nimekirja.',
  'help.ctx.trip-place.bullet.1':
    'Klõpsa kohtade veerus real, peatusel päeva sees või kaardil markeril ja kaart avaneb kaardi peal. Kui avad selle päevast, teab kaart, millist peatust mõtled, ja näitab ka peatuse osalejaid ja broneeringut. Retk (matk, sõit või jalutuskäik vahelehelt „Retked“) avab selle asemel oma retkekaardi.',
  'help.ctx.trip-place.bullet.2':
    'Päises on ümmargune pilt, nimi, aadress ühel real ja sildid teadaolevaga: avatud või suletud, kategooria, kellaaeg, hind, telefoninumber, e-post ja koordinaadid. Klõpsa pildil, et kasutada oma pilti või fotot koha failidest. Tee nimel topeltklõps, et koht ümber nimetada. Paremal olev X sulgeb kaardi. Pilti, ümbernimetamist, „Muuda“ ja „Kustuta“ saavad kasutada ainult reisijad, kes tohivad kohti muuta.',
  'help.ctx.trip-place.bullet.3':
    'Selle all: iga reisija antud tärnid, kirjeldus ja märkmed ning „Selle päeva märkmed“, kui peatusel need on.',
  'help.ctx.trip-place.bullet.4':
    'Edasi tulevad „Lahtiolekuajad“, „Raja värv“, „Raja statistika“ ja „Failid“, kui need on asjakohased. Pealkirja „Failid“ juures olev „Laadi üles“ lisab faile sinu arvutist ja loendis on ka sellele peatusele kinnitatud failid ning broneeringu failid, sealhulgas hotelli kinnitus. Pluginad võivad allapoole lisada oma ridu.',
  'help.ctx.trip-place.bullet.5':
    'All olev rida: „Lisa päevale“ või „Eemalda päevast“, kui päev on avatud, seejärel „Navigeerimine“ (või sinu kaardirakenduse nimi, kui oled selle jaotises „Seaded“ valinud), „Ava veebisait“ ja „Salvesta kogumikku“. Paremal kustutab punane prügikast koha ja „Muuda“ avab selle vormi.',
  'help.ctx.trip-place.bullet.6':
    "Otsingust valitud koha juures on näha, mida TREKi register või OpenStreetMap selle kohta teab: ülal siltide hulgas „Avatud“ või „Suletud“ koos rohelise või punase rõngaga pildi ümber, koha kohaliku aja järgi; telefoninumber, samuti sildina; allpool „Lahtiolekuajad“, kus real on tänased ajad ja klõpsuga kogu nädal; ning veebisait nupu „Ava veebisait“ all. Google'i hinnang on näha ainult Google'i kaudu leitud kohal TREKis, millel on Google'i võti. Lahtiolekuajad, telefoninumber ja e-post, mille ise koha vormi sisestasid, asendavad otsitud andmed ja määravad ka rõnga värvi.",
  // read-place
  'help.guide.read-place.title': 'Mida kaart koha kohta ütleb',
  'help.guide.read-place.goal': 'Vaata ühelt kaardilt kõike, mida reis ühe koha kohta teab.',
  'help.guide.read-place.step.1':
    'Klõpsa päevade veerus peatusel, mille kohta tahad lugeda. Kaardi peale avaneb infokaart ja peatus jääb oma päevas märgituks.',
  'help.guide.read-place.step.2':
    'Ülaosas on ühel real ümmargune pilt, nimi ja aadress; vihjes on täielik aadress. Nende all olevad sildid näitavad, kas koht on praegu „Avatud“ või „Suletud“ koha kohaliku aja järgi, ning pildi ümber on vastavalt roheline või punane rõngas. Siltidel on ka kategooria, aeg, telefoninumber ja e-post (klõpsa neil, et avada telefoni- või meilirakendus) ning laial ekraanil täpsed koordinaadid. Paremal olev X sulgeb kaardi.',
  'help.guide.read-place.step.3':
    'Päise all on esimene jaotis „Hinnang“: iga reisija antud tärnid koos keskmise ja hääletanute arvuga. Kui keegi pole veel hääletanud, on seal kirjas „Veel hindamata“.',
  'help.guide.read-place.step.4':
    'Edasi tuleb kirjeldus ja selle all märkmed. Mõlemad on koha vormi tekst koos vormindusega: loendid, lingid ja paks kiri töötavad.',
  'help.guide.read-place.step.5':
    '„Osalejad“ näitab, kes sellesse peatusesse lähevad. Kõik on kaasatud, kuni kellegi eemaldad.',
  'help.guide.read-place.step.6':
    'Allpool on „Lahtiolekuajad“: real on vaadatava päeva lahtiolekuajad. Klõpsa sellel, et näha kogu nädalat, kus see päev on paksus kirjas. Selle kõrval on „Failid“.',
  'help.guide.read-place.step.7':
    'All olevas reas on toimingud: lisa koht avatud päevale või eemalda sealt, ava see kaardirakenduses või veebisaidil, salvesta see nimekirja ning paremal kustuta see (punane prügikast) või muuda seda.',
  'help.guide.read-place.result':
    'Kaart jääb avatuks, kuni sulged selle X-iga või valid teise koha. Nädala lahtiolekuajad jäävad avatuks ja peatus, millele kaart kuulub, jääb päevade veerus märgituks.',
  'help.guide.read-place.tip.1':
    'Kui valid koha kohtade veerust, näitab kaart kohta, mitte peatust. Seetõttu pole seal osalejaid ja on ainult koha enda broneeringud, näiteks hotellis peatumine. Kõige nägemiseks vali peatus päeva seest.',
  'help.guide.read-place.tip.2':
    'Kui tohid kohti muuta, tee nimel topeltklõps, et koht ümber nimetada ilma vormi avamata. Enter salvestab, Escape tühistab muudatuse.',
  'help.guide.read-place.tip.3':
    "Käsitsi sisestatud kohal on ainult vormi sisestatud andmed. Klõpsa „Muuda“ ja täida „Telefon“, „E-post“ ja lahtiolekuajad ise või vali koht välja „Otsi kohti…“ soovituste hulgast ja klõpsa „Uuenda“, et lasta need otsida. Google'i hinnang vajab Google'i võtit.",
  // rate-place
  'help.guide.rate-place.title': 'Hinda kohta',
  'help.guide.rate-place.goal': 'Anna kohale oma tärnid ja vaata, milliseid hinnanguid teised on andnud.',
  'help.guide.rate-place.step.1':
    'Ava koht. Tärnide rida on kohe päise all ja näitab seniste häälte keskmist, sulgudes häälte arv.',
  'help.guide.rate-place.step.2':
    'Klõpsa soovitud tärnil. Tärnid täituvad, kui liigutad kursorit nende kohal, nii et näed, millise hinnangu annad.',
  'help.guide.rate-place.step.3':
    'Sinu hääl lisandub kohe keskmisele ja selle kõrval olevad näod näitavad, kes on hääletanud. Kõigi tärnide nägemiseks vii kursor rea kohale.',
  'help.guide.rate-place.step.4':
    'Sama keskmine on näha ka koha real kohtade veerus, nii et parimad kohad on loendist lihtne leida.',
  'help.guide.rate-place.result':
    'Kõik reisil osalejad näevad sinu tärne kohal. Loendi kohal filtrireas olev täht saab nüüd näidata ainult kohti, millel on vähemalt määratud hinnang.',
  'help.guide.rate-place.tip.1': 'Hinnata saab iga reisija, ka reisil, kus kohti tohivad muuta ainult mõned teist.',
  'help.guide.rate-place.tip.2':
    'Oma hinnangu eemaldamiseks klõpsa tärnil, mille juba andsid. Kui keegi pole kohta hinnanud, on jälle näha „Veel hindamata“.',
  'help.guide.rate-place.tip.3':
    'Tärnide kõrval on näha kuni kuue hääletaja nägu. Kohtspikker loetleb kõik ja märgib ära sinu.',
  // place-image
  'help.guide.place-image.title': 'Pane kohale oma pilt',
  'help.guide.place-image.goal': 'Asenda automaatne pisipilt oma fotoga.',
  'help.guide.place-image.step.1': 'Ava koht kohtade veerust.',
  'help.guide.place-image.step.2':
    'Vii kursor päises ümmargusele pildile: ilmub kaamera ja vihjes on „Laadi pilt üles“. Klõpsa sellel ja vali fail. Kui koha failide hulgas on juba fotosid, palub TREK kõigepealt valida: „Laadi seadmest üles“ või mõni pilt jaotisest „Manustatud failidest“.',
  'help.guide.place-image.step.3': 'Kaardi ülaosas on nüüd sinu pilt, mille nurgas on väike punane X.',
  'help.guide.place-image.step.4': 'Sama pilt on näha ka koha real kohtade veerus ja koha markeril kaardil.',
  'help.guide.place-image.result':
    'Sinu pilti kasutatakse koha juures kõikjal: infokaardil, kohtade veerus, päeva peatusel, kaardi markeril ja jagatud reisil.',
  'help.guide.place-image.tip.1': "Toetatud on JPG, PNG, GIF ja WebP ning iPhone'i HEIC teisendatakse üleslaadimisel.",
  'help.guide.place-image.tip.2':
    'Nurgas olev X eemaldab sinu pildi ja jälle on näha automaatne pilt. Koht ise ei muutu.',
  'help.guide.place-image.tip.3':
    'Kui sa pole pilti lisanud, otsib TREK selle koha koordinaatide järgi. Kui midagi ei leita, näidatakse kategooria ikooni. Pilti saavad määrata ainult reisijad, kes tohivad kohti muuta.',
  // place-day-assign
  'help.guide.place-day-assign.title': 'Lisa koht avatud päevale või eemalda see',
  'help.guide.place-day-assign.goal': 'Kasuta kaardil olevat nuppu, selle asemel et rida üle planeerija lohistada.',
  'help.guide.place-day-assign.step.1':
    'Klõpsa päevade veerus päeva päisel. See päev on nüüd avatud ja kaart käib selle kohta.',
  'help.guide.place-day-assign.step.2':
    'Klõpsa kohtade veerus kohal, mida sellel päeval pole. Avaneb selle kaart ja alumisel real on nupp „Lisa päevale“.',
  'help.guide.place-day-assign.step.3':
    'Klõpsa „Lisa päevale“. Peatus lisatakse päeva lõppu ja nupul on nüüd kirjas „Eemalda päevast“.',
  'help.guide.place-day-assign.step.4': 'Peatus on nüüd päevas, loendi lõpus. Lohista see üles õigesse kohta.',
  'help.guide.place-day-assign.step.5':
    '„Eemalda päevast“ eemaldab peatuse uuesti päevast ja infokaardil on jälle „Lisa päevale“.',
  'help.guide.place-day-assign.result': 'Peatus lisatakse päevale või eemaldatakse sealt. Koht ise ei muutu.',
  'help.guide.place-day-assign.tip.1':
    'Nupp on olemas ainult siis, kui mõni päev on avatud. Ilma avatud päevata pole päeva, kuhu koht lisada.',
  'help.guide.place-day-assign.tip.2':
    'Kui eemaldad peatuse päevast, jääb koht reisi ja kohtade veergu. „Kustuta“ eemaldab selle kõikjalt.',
  'help.guide.place-day-assign.tip.3':
    'Peatusel, mille majutusbroneering päevale lisas, pole kumbagi nuppu. Selle öö lisad ja eemaldad päeva ööbimisplokis.',
  // place-participants
  'help.guide.place-participants.title': 'Määra, kes sellesse peatusesse läheb',
  'help.guide.place-participants.goal': 'Vali, kes ühte peatusesse läheb, ilma et muudaksid reisil osalejaid.',
  'help.guide.place-participants.step.1':
    'Klõpsa päeva sees peatusel. Avaneb infokaart ja „Osalejad“ loetleb kõik reisil osalejad.',
  'help.guide.place-participants.step.2':
    'Reisija sellest peatusest eemaldamiseks klõpsa tema kiibil. Kui viid kursori kiibi kohale, on nimi läbi kriipsutatud.',
  'help.guide.place-participants.step.3':
    'Kui keegi puudub, ilmub katkendjoonega +. Klõpsa sellel, et näha, kes peatusel ei ole.',
  'help.guide.place-participants.step.4':
    'Klõpsa nimel, et inimene uuesti lisada. Kui kõik on uuesti lisatud, kuulub peatus jälle kogu seltskonnale.',
  'help.guide.place-participants.result':
    'Peatusel on ainult sinu valitud reisijad. Ülejäänud seltskond on sel ajal vaba.',
  'help.guide.place-participants.tip.1':
    '„Osalejad“ on näha ainult siis, kui peatus on valitud, nii et vali koht päeva seest, mitte kohtade veerust. See on näha ka ainult reisil, kus on rohkem kui üks reisija.',
  'help.guide.place-participants.tip.2':
    'Kui kedagi pole valitud, lähevad kõik. Seetõttu ei saa peatusest viimast reisijat eemaldada.',
  'help.guide.place-participants.tip.3': 'Külaline, kellel pole oma kontot, võib olla osaleja nagu kõik teised.',
  // place-booking
  'help.guide.place-booking.title': 'Peatuse broneering',
  'help.guide.place-booking.goal': 'Vaata peatuse broneeringut, ava see ja seo peatusega uus broneering.',
  'help.guide.place-booking.step.1':
    'Ava peatus, millega broneering on seotud. Kaardil on see jaotises „Broneeringud“ eraldi väikese kaardina koos broneeringu nime ja olekuga „Kinnitatud“ või „Ootel“.',
  'help.guide.place-booking.step.2':
    'Broneeringu kaardil on „Kuupäev“, „Aeg“ ja „Broneerimiskood“, sildid broneeringu muude andmetega (lennu number, platvorm, sisseregistreerimine) ning broneeringu märkmed.',
  'help.guide.place-booking.step.3': 'Klõpsa broneeringu kaardil. Broneering avaneb kaardi peal.',
  'help.guide.place-booking.step.4':
    'Broneeringu alaosas olev „Muuda“ avab broneeringu vormi. Selles vormis seob „Seo päevaplaani kirjega“ broneeringu peatusega ja seal on juba see peatus valitud. Sulge vorm uuesti.',
  'help.guide.place-booking.step.5':
    'Uue broneeringu peatusele lood päevade veerus: vii kursor peatusele ja klõpsa selle lõpus piletiikooni „Lisa broneering“. Vorm avaneb pealkirjaga „Uus broneering“ ja on juba peatusega seotud.',
  'help.guide.place-booking.result':
    'Broneering on peatusega seotud: see on näha infokaardil ja päevas ning selle failid on siin ka jaotises „Failid“.',
  'help.guide.place-booking.tip.1':
    'Broneering on näha peatusel, millele see on kinnitatud, ja hotellibroneering on näha ka hotelli juures, kust iganes selle avad. Peatuseta broneering on vahelehel „Broneeringud“.',
  'help.guide.place-booking.tip.2':
    'Ühel peatusel võib olla mitu broneeringut, näiteks lõuna ja ekskursioon, mis algavad samast kohast.',
  'help.guide.place-booking.tip.3':
    'Rongi, lennu või praami puhul avab „Muuda“ hoopis transpordivormi, sama mis vahelehel „Transport“.',
  // place-files
  'help.guide.place-files.title': 'Hoia koha piletid koha juures',
  'help.guide.place-files.goal': 'Lisa pilet, vautšer või kaart kohale, millega see on seotud.',
  'help.guide.place-files.step.1':
    'Ava koht. „Failid“ on selle üksikasjade all, lahtiolekuaegade kõrval, kui kohal need on, ning seni, kuni kohal faile pole, on seal kirjas „Failid“.',
  'help.guide.place-files.step.2': 'Klõpsa pealkirja „Failid“ paremal „Laadi üles“ ja vali fail.',
  'help.guide.place-files.step.3': 'Nupul on näha, mitu faili kohal on, ja loend avaneb automaatselt.',
  'help.guide.place-files.step.4': 'Igal real on faili nimi ja suurus. Faili avamiseks klõpsa real.',
  'help.guide.place-files.result':
    'Fail on lisatud kohale ja kaardil on see arvesse võetud. See on ka reisi vahekaardil „Failid“.',
  'help.guide.place-files.tip.1':
    '„Failid“ näitab ka seda, mis on sellele peatusele kinnitatud ja mis on lisatud selle broneeringule, nii et hotelli kinnitus on näha hotelli juures.',
  'help.guide.place-files.tip.2':
    '„Laadi üles“ võtab korraga vastu mitu faili ja nende hulgas olevast fotost võib saada koha pilt.',
  'help.guide.place-files.tip.3':
    'Kui sul pole õigust faile üles laadida, pole nuppu „Laadi üles“ näha. Kohal juba olevad failid on siiski näha.',
  // place-navigation
  'help.guide.place-navigation.title': 'Ava koht kaardirakenduses või selle veebisaidil',
  'help.guide.place-navigation.goal': 'Ava koht navigeerimisrakenduses, millega sinna lähed.',
  'help.guide.place-navigation.step.1': 'Ava koht ja klõpsa all olevas reas „Navigeerimine“.',
  'help.guide.place-navigation.step.2':
    'Loendis on sellele kohale sobivad kaardirakendused: Google Maps, Waze, Apple Maps, OpenStreetMap ja CoMaps ning Androidis lisaks „Muu kaardirakendus“.',
  'help.guide.place-navigation.step.3':
    'Klõpsa sellel, mida kasutad. Võimaluse korral saadab TREK rakendusse koha enda, mitte ainult selle koordinaadid, nii et jõuad õige sissepääsu juurde.',
  'help.guide.place-navigation.step.4':
    'Selle kõrval olev „Ava veebisait“ avab uuel vahekaardil koha enda veebisaidi koos lahtiolekuaegade ja piletitega.',
  'help.guide.place-navigation.result':
    'Kaardirakendus avab koha, veebisait avaneb uuel vahekaardil ja reisis ei muutu midagi. Kui TREK on paigaldatud rakendusena, avaneb uue vahekaardi asemel kaardirakendus.',
  'help.guide.place-navigation.tip.1':
    'Waze alustab navigeerimist kohe. Teised rakendused avavad koha ja navigeerimise alustamiseks tuleb veel korra puudutada.',
  'help.guide.place-navigation.tip.2':
    'Pakutavad rakendused sõltuvad kohast ja seadmest: Apple Mapsi Androidis ei pakuta, 高德地图 pakutakse ainult Hiinas asuvate kohtade puhul ning Waze, Apple Maps ja CoMaps vajavad koha koordinaate. „Muu kaardirakendus“ avab koha mis tahes kaardirakenduses sinu Android-telefonis.',
  'help.guide.place-navigation.tip.3':
    'Vali oma kaardirakendus üks kord jaotises „Seaded“ väljal „Ava kohad rakenduses“. Seejärel on nupul rakenduse nimi ja see avab selle kohe. Sama juhtub, kui koha puhul sobib ainult üks rakendus.',
  // place-to-collection
  'help.guide.place-to-collection.title': 'Salvesta koht mõnda oma nimekirja',
  'help.guide.place-to-collection.goal': 'Salvesta sellel reisil leitud koht järgmiseks korraks.',
  'help.guide.place-to-collection.step.1': 'Ava koht ja klõpsa kaardi alumises reas „Salvesta kogumikku“.',
  'help.guide.place-to-collection.step.2':
    '„Salvesta nimekirja“ näitab kõiki nimekirju, mida omad või jagad. Paremal olev täidetud järjehoidja tähistab nimekirju, kus see koht juba on.',
  'help.guide.place-to-collection.step.3': 'Klõpsa nimekirjal. Koht lisatakse sinna kohe.',
  'help.guide.place-to-collection.step.4': 'Sulge dialoog X-iga ja kaardi nupul on nüüd kirjas „Salvestatud“.',
  'help.guide.place-to-collection.result':
    'Koht on sinu nimekirjas koos pildi, märkmete ja aadressiga, valmis järgmiseks reisiks.',
  'help.guide.place-to-collection.tip.1':
    'Nupp on olemas ainult siis, kui lisamoodul „Kogumikud“ on sisse lülitatud. Selle lülitab sisse administraator jaotises „Lisamoodulid“.',
  'help.guide.place-to-collection.tip.2':
    'Koht võib olla korraga mitmes nimekirjas ja igas eri olekuga: ühes idee, teises külastatud.',
  'help.guide.place-to-collection.tip.3':
    'Valija ülaosas koha nime all olev „Märgi külastatuks“ märgib koha nimekirjas külastatuks. Kui koht on mitmes sinu nimekirjas, on nupul kirjas „Kõikjal külastatud“ ja see märgib koha kõigis korraga. „Vaade“ avab sinu nimekirjad jaotises „Kogumikud“.',
  // place-track
  'help.guide.place-track.title': 'Vaata raja andmeid ja anna sellele oma värv',
  'help.guide.place-track.goal': 'Vaata, kui pikk on imporditud matk ja milline joon kaardil on see matk.',
  'help.guide.place-track.step.1':
    'Raja real kohtade veerus on lühike joon samas värvis, milles rada kaardil on. Klõpsa sellel.',
  'help.guide.place-track.step.2': '„Raja statistika“ näitab teekonna pikkust sinu valitud ühikutes.',
  'help.guide.place-track.step.3':
    'Selle kohal olev „Raja värv“ näitab kasutusel olevat värvi. Klõpsa real, et avada värvivalik.',
  'help.guide.place-track.step.4': 'Vali värv. Joon kaardil ja triip real muutuvad sama värvi.',
  'help.guide.place-track.step.5':
    'Vasakpoolne katkendjoonega ruut, „Automaatne värv“, taastab raja vaikevärvi. Paremal olev pipett avab süsteemi värvivalija, kust saad valida mis tahes muu värvi.',
  'help.guide.place-track.result':
    'Rada joonistatakse sinu valitud värviga infokaardil, oma real kohtade veerus ja kaardil.',
  'help.guide.place-track.tip.1':
    'Need kaks plokki on ainult kohal, millel on teekond: kohal, mis imporditi GPX-, KML- või KMZ-failist enne retkede tulekut või TREKis, kus „Retked“ on välja lülitatud. Kui „Retked“ on sees, saab uuest GPX-failist retk, millel on oma retkekaart.',
  'help.guide.place-track.tip.2':
    'Kõrgusandmetega salvestatud raja puhul on näha ka kõrgeim ja madalaim punkt, tõusu- ja laskumismeetrid ning matka profiil.',
  'help.guide.place-track.tip.3':
    'Import annab igale lisatud rajale oma värvi, nii et kahel matkal pole kunagi sama värv.',

  // ── Screen: trip-day-detail ───────────────────────────────────────────────────────────
  'help.ctx.trip-day-detail.title': 'Päeva üksikasjad',
  'help.ctx.trip-day-detail.summary':
    'Paneel, mis avaneb kaardi peal, kui klõpsad päeva päisel. See näitab päeva tervikuna: nime ja kuupäeva, ilma seal, kus sa oled, selle päeva broneeringuid ja selleks broneeritud öid.',
  'help.ctx.trip-day-detail.bullet.1':
    'Klõpsa päevade veerus päeva päisel ja paneel avaneb kaardi keskel. Paneeli sulgemiseks ja päeva valiku tühistamiseks klõpsa uuesti samal päisel või selle paremal oleval X-il. Koha avamine kohtade veerust või kaardilt sulgeb paneeli ja näitab selle asemel kohta.',
  'help.ctx.trip-day-detail.bullet.2':
    'Päises on päeva nimi ja kuupäev. Nime kõrval olev pliiats nimetab päeva ümber. Topeltnool ahendab paneeli kitsaks ribaks, et kaart oleks jälle näha.',
  'help.ctx.trip-day-detail.bullet.3':
    'Üleval on päeva ilm. Prognoosi pealkirjas on koht, mille kohta prognoos käib: päeva esimene peatus või hotell, kus ärkad.',
  'help.ctx.trip-day-detail.bullet.4':
    '„Broneeringud“ loetleb selle päeva broneeringud, igaühel liik, peatus, kuhu see kuulub, ja kellaajad. Roheline tähendab kinnitatud, merevaigukollane ootel ning ühistranspordi reis on sinine ja olekuta. Klõps real avab broneeringu.',
  'help.ctx.trip-day-detail.bullet.5':
    '„Majutus“ näitab kõiki selle päevaga seotud öid: sisse- ja väljaregistreerimise päevadel „Sisseregistreerimine“ ja „Väljaregistreerimine“, sisseregistreerimise ajavahemikku, väljaregistreerimise aega ja kinnitusnumbrit. Kui majutusel on broneering, on selle all kast „Broneering“ koos olekuga „Ootel“ või „Kinnitatud“. Klõpsa sellel, et broneering avada.',
  'help.ctx.trip-day-detail.bullet.6':
    '„Lisa majutus“ lisab sellele päevale ööbimise: vali majutuskoht reisi kohtade hulgast, vali päevad, mida see hõlmab, ning lisa kellaajad ja kood. Päeva päises olevas +-menüüs vihjega „Lisa päevale“ on samuti „Lisa majutus“: see avab selle paneeli, kus vorm on juba avatud.',
  // day-panel
  'help.guide.day-panel.title': 'Ava päev ja vaata selle üksikasju',
  'help.guide.day-panel.goal': 'Vaata kogu päeva koos ilma, broneeringute ja ööbimiskohaga kaardilt lahkumata.',
  'help.guide.day-panel.step.1':
    'Klõpsa päevade veerus päeva päisel. Päev valitakse ja selle üksikasjad avanevad kaardi keskel.',
  'help.guide.day-panel.step.2': 'Päises on päeva nimi, kuni sa nime ei anna, on see „Päev 1“, ja selle all kuupäev.',
  'help.guide.day-panel.step.3':
    'Päeva ilm on ülaosas. Prognoosi juures on kirjas, millise koha kohta see on: päeva esimene peatus või hotell, kus veetsid eelmise öö.',
  'help.guide.day-panel.step.4':
    'Selle all olev „Broneeringud“ loetleb sellele päevale jäävad broneeringud koos kellaaegadega.',
  'help.guide.day-panel.step.5':
    '„Majutus“ näitab sellele päevale broneeritud öid ning vastavatel päevadel „Sisseregistreerimine“ ja „Väljaregistreerimine“.',
  'help.guide.day-panel.step.6':
    'Päises olev topeltnool ahendab paneeli kitsaks ribaks. Selle kõrval olev X sulgeb paneeli ja tühistab päeva valiku.',
  'help.guide.day-panel.result':
    'Kui ahendad paneeli ribaks, on kaart vaba ja päev jääb valituks. Kui sulged paneeli, tühistatakse päeva valik ja plaan jääb samaks.',
  'help.guide.day-panel.tip.1':
    'Paneeli saab kokku tõmmata ka klõpsuga ükskõik kuhu selle päiseribal. Nool on vaid üks võimalus.',
  'help.guide.day-panel.tip.2':
    'Kui avad koha kohtade veerust või kaardilt, sulgub päeva paneel ja selle asemel näidatakse koha üksikasju. Päeva uuesti nägemiseks klõpsa jälle päeva päisel.',
  // day-weather
  'help.guide.day-weather.title': 'Vaata päeva ilma',
  'help.guide.day-weather.goal': 'Vaata ilma kohas, kus sa sel päeval tegelikult oled.',
  'help.guide.day-weather.step.1':
    'Prognoosi pealkirjas on koht, mille kohta numbrid käivad: päeva esimene peatus või, kui päeval peatust pole, hotell, kus ööbid eelmisel ööl.',
  'help.guide.day-weather.step.2':
    'Suur number on päeva temperatuur. Selle kõrval on madalaim ja kõrgeim temperatuur ning ilm sõnadega.',
  'help.guide.day-weather.step.3':
    'Sellest paremal olevad märgised: vihma tõenäosus, sademete hulk, tugevaim tuul ning päikesetõus ja -loojang.',
  'help.guide.day-weather.step.4':
    'All on päev tunni kaupa, iga teine tund: kellaaeg, ikoon, temperatuur ja vihma tõenäosus. Tund, kus see on üle 50 protsendi, on sinise taustaga.',
  'help.guide.day-weather.result':
    'Päevade veerus on päeva kaardil numbri all väikeses kirjas ka ilm, nii et näed kiiresti kogu reisi ilma.',
  'help.guide.day-weather.tip.1':
    'Kraadid ja tuul kasutavad seadet „Temperatuuriühik“, mis asub „Seaded“ jaotises „Üldine“: kui valid °F Fahrenheit, näidatakse sama prognoosi ühikutes °F ja mph.',
  'help.guide.day-weather.tip.2':
    'Päeval, kus pole asukohaga peatust ega eelmise öö hotelli, ilma ei näidata: prognoos on alati koha, mitte kunagi reisi kohta.',
  'help.guide.day-weather.tip.3':
    'Rohkem kui 16 päeva ette prognoosi pole. Siis näidatakse selle kuupäeva varasemate aastate keskmisi. Need on tähistatud märgiga Ø ja all on selle kohta märkus.',
  // rename-day
  'help.guide.rename-day.title': 'Anna päevale nimi',
  'help.guide.rename-day.goal': 'Anna päevale nimi, näiteks „Saabumine Kyotosse“ või „Puhkepäev“, mitte „Päev 5“.',
  'help.guide.rename-day.step.1': 'Ava päev. Selle päises on kirjas „Päev 5“ ja all kuupäev.',
  'help.guide.rename-day.step.2': 'Klõpsa nime kõrval olevat pliiatsit.',
  'help.guide.rename-day.step.3': 'Nimest saab väli. Kirjuta soovitud nimi.',
  'help.guide.rename-day.step.4':
    'Vajuta Enter või klõpsa mujal. Escape tühistab muudatuse. Nimi on näha ka päevade veerus päeva kaardil.',
  'help.guide.rename-day.result':
    'Nimi asendab teksti „Päev 5“ paneelis ja päeva kaardil päevade veerus. Kuupäev ei muutu.',
  'help.guide.rename-day.tip.1':
    'Kui tühjendad välja ja salvestad, on päeva nimi jälle „Päev 5“: kui nime pole, näidatakse numbrit.',
  'help.guide.rename-day.tip.2':
    'Nimi kuulub päevale, mitte kuupäevale. Kui muudad päevade järjekorda, liigub nimi koos kõige muuga sellel päeval.',
  // add-accommodation
  'help.guide.add-accommodation.title': 'Broneeri päevale öö',
  'help.guide.add-accommodation.goal': 'Lisa hotell plaani üks kord koos päevade, kellaaegade ja kinnitusnumbriga.',
  'help.guide.add-accommodation.step.1':
    'Majutuskoht peab kõigepealt olema reisi koht. Loo see kohtade veerus nagu iga teine koht: valikus on ainult juba olemasolevad kohad.',
  'help.guide.add-accommodation.step.2': 'Ava saabumispäev ja klõpsa jaotises „Majutus“ „Lisa majutus“.',
  'help.guide.add-accommodation.step.3':
    '„Rakenda päevadele“ määrab, milliseid öid majutus hõlmab: „Algus“ on sisseregistreerimise päev, „Lõpp“ väljaregistreerimise päev ja „Kõik“ hõlmab kogu reisi. Akna ülaosas on näha ajavahemik ja ööde arv.',
  'help.guide.add-accommodation.step.4':
    'Täida väljad „Sisseregistreerimine“, „Kuni“ ja „Väljaregistreerimine“ ning kirjuta broneeringu number väljale „Kinnitus“. Kõik neli võivad jääda tühjaks.',
  'help.guide.add-accommodation.step.5':
    'Vali majutuskoht jaotises „Vali majutus“. Loendi kohal olev „Kategooria“ kitsendab selle ühele kategooriale.',
  'help.guide.add-accommodation.step.6': 'Klõpsa „Salvesta“.',
  'help.guide.add-accommodation.result':
    'Majutus on näha igal päeval, mida see hõlmab: esimesel päeval „Sisseregistreerimine“ ja viimasel „Väljaregistreerimine“. Majutuskohast saab sisseregistreerimise päeva peatus, nii et kaart näitab marsruuti sinna, ja vahelehele „Broneeringud“ ilmub hotellibroneering.',
  'help.guide.add-accommodation.tip.1':
    'Valija avaneb sellel päeval, kust tulid, ja väljaregistreerimine on järgmisel päeval. Mõlemat saad enne salvestamist muuta.',
  'help.guide.add-accommodation.tip.2':
    'Anna hotellile loomisel kategooria „Hotell“. Siis näitab loendi kohal olev „Kategooria“ ühe klõpsuga ainult sinu hotelle.',
  'help.guide.add-accommodation.tip.3':
    'Kõik kellaajad on valikulised: ka ilma sisseregistreerimisaja ja koodita majutus hõlmab oma öid ja selle marsruut joonistatakse ikkagi.',
  // edit-accommodation
  'help.guide.edit-accommodation.title': 'Broneeritud öö muutmine või tühistamine',
  'help.guide.edit-accommodation.goal': 'Nihuta majutust, paranda selle aegu või eemalda see plaanist.',
  'help.guide.edit-accommodation.step.1':
    'Kaardil on majutuskoht ja selle aadress, sisse- või väljaregistreerimise päevadel „Sisseregistreerimine“ või „Väljaregistreerimine“ koos kellaaegadega, kinnitusnumber ja jaotises „Broneering“ sellega seotud broneering.',
  'help.guide.edit-accommodation.step.2':
    'Selle paremal olev pliiats „Muuda majutust“ avab majutuse muutmiseks. Hüpikakna pealkiri on nüüd „Muuda majutust“.',
  'help.guide.edit-accommodation.step.3':
    'Paranda välju „Sisseregistreerimine“, „Kuni“, „Väljaregistreerimine“ ja „Kinnitus“. Siin saab muuta ka nende kohal olevaid päevi ja all olevat majutuskohta.',
  'help.guide.edit-accommodation.step.4': 'Klõpsa „Salvesta“.',
  'help.guide.edit-accommodation.step.5':
    'Pliiatsi kõrval olev X, „Eemalda“, eemaldab majutuse. See ei küsi kinnitust ja kustutab ka majutusega seotud hotellibroneeringu.',
  'help.guide.edit-accommodation.result':
    'Muudatus rakendub kohe kõigile majutuse päevadele ja vahelehel „Broneeringud“ olevale hotellibroneeringule.',
  'help.guide.edit-accommodation.tip.1':
    'Peatumise keskel oleval ööl pole silti „Sisseregistreerimine“ ega „Väljaregistreerimine“: need on ainult vahemiku esimesel ja viimasel päeval.',
  'help.guide.edit-accommodation.tip.2':
    'Majutuse tühistamine eemaldab ka peatuse, mille see sisseregistreerimise päevale lisas, ja kõik selle broneeringuga seotud kulud. Kui see juhtus kogemata, broneeri öö uuesti.',
  // day-bookings
  'help.guide.day-bookings.title': 'Päeva broneeringud ühe pilguga',
  'help.guide.day-bookings.goal':
    'Vaata ühest kohast, mis on sellele päevale juba broneeritud ja kas see on kinnitatud.',
  'help.guide.day-bookings.step.1':
    '„Broneeringud“ loetleb päeva broneeringud: selle kuupäevaga broneeringud ja need, mis on seotud mõne päeva peatusega. Teise päeva peatusega seotud broneering on näha ainult selle peatuse juures.',
  'help.guide.day-bookings.step.2':
    'Real on broneeringu tüüp, nimi ja, kui see kuulub mõne peatuse juurde, selle järel hallilt see peatus. Kellaajad on rea paremas otsas enne olekutäppi.',
  'help.guide.day-bookings.step.3':
    'Värv näitab broneeringu olekut: roheline on kinnitatud, merevaigukollane ootel ja ühistranspordi reis sinine, ilma olekuta. Hotelle selles loendis pole, neil on allpool oma jaotis.',
  'help.guide.day-bookings.step.4':
    'Klõpsa real ja broneering avaneb. Päises olev silt vahetab olekute „Ootel“ ja „Kinnitatud“ vahel ning allosas olev „Muuda“ muudab ülejäänut. Uued broneeringud luuakse vahelehel „Broneeringud“, transport vahelehel „Transport“.',
  'help.guide.day-bookings.result':
    'Selles loendis on kõik, mis on sellele päevale dateeritud, ja kõik, mis on seotud mõne selle päeva peatusega.',
  'help.guide.day-bookings.tip.1':
    'Broneering on selle päeva all, mis on tema kuupäev. Kui muudad kuupäeva vahelehel „Broneeringud“ või „Transport“, liigub broneering automaatselt teisele päevale.',
  'help.guide.day-bookings.tip.2':
    'Kui plokki „Broneeringud“ pole, pole päeval broneeringuid: tühja plokki ei näidata, see peidetakse.',
  'help.guide.map-lock.title': 'Lukusta kaart',
  'help.guide.map-lock.goal': 'Hoia kaarti paigal, kui klõpsad päevi ja kohti läbi.',
  'help.guide.map-lock.step.1':
    'Lukk on kaardi all vasakul olevast kahest ümmargusest nupust ülemine; kursori kohal hoidmisel on kirjas „Lukusta kaardivaade“. Klõpsa sellel. Kuni lukk on suletud, ei suumi ega nihuta päeva avamine või koha valimine enam kaarti ja nupul on nüüd kirjas „Lase kaardil valikut järgida“.',
  'help.guide.map-lock.result': 'Kaart jääb sinna, kuhu selle jätsid, kuni plaaniga tegeled.',
  'help.guide.map-lock.tip.1':
    'Klõpsa lukul uuesti, nüüd „Lase kaardil valikut järgida“, ja kaart järgib jälle sinu valikuid. Lukk on olemas ainult arvutis; telefonis järgib kaart alati valikut.',

  // ── Screen: trip-map ──────────────────────────────────────────────────────────────────
  'help.ctx.trip-map.title': 'Kaart',
  'help.ctx.trip-map.summary':
    'Plaani keskosa: iga reisi koht nööpnõelana, iga retk joonena, nendevahelised marsruudid ning kaardi servades olevad nupud vaate lukustamiseks, satelliidivaatele lülitumiseks, kogu reisi korraga näitamiseks ja vaadatava piirkonna kohtade näitamiseks.',
  'help.ctx.trip-map.bullet.1':
    'Nööpnõel on koht: selle enda foto, kui see on olemas, muidu kategooria värv ja ikoon. Vii kursor nööpnõelale, et näha kaarti pildi, nime ja aadressiga ning hinnangu ja kategooriaga, kui kohal need on. Lohista nööpnõel päevakaardile, et koht sinna planeerida. Majutus, mille broneering on veel ootel, on tuhm ja katkendliku rõngaga.',
  'help.ctx.trip-map.bullet.2':
    'Liiga lähestikku olevad nööpnõelad koondatakse üheks tumedaks ringiks, millel on arv. Klõpsa ringil ja kaart suumib sees olevate nööpnõelteni. Kui jaotises „Seaded“ > „Üldine“ alajaotises „Reisimine ja kaart“ on „Kompaktsed tähised planeerimata kohtadele“ sees, on kohad, mis pole veel ühelgi päeval, fotota väikesed täpid, nii et planeeritud peatused paistavad paremini välja.',
  'help.ctx.trip-map.bullet.3':
    'Klõpsa markeril, et avada koht kaardi allservas kaardil koos hinnangu, failide ja järgmiste tegevustega. Kaardi sulgemiseks klõpsa kaardil tühjal alal.',
  'help.ctx.trip-map.bullet.4':
    'Kui päevade veerus on päev avatud, on selle peatustel väike valge märk peatuse järjekorranumbriga selles päevas. Koht, mis on päevas kaks korda, näitab mõlemat numbrit. Kohtade loendi kohal olevad filtrid („Näita“, kategooriad ja minimaalse hinnangu tärn) filtreerivad ka kaardi nööpnõelu.',
  'help.ctx.trip-map.bullet.5':
    'Ülal olev ikoonirida otsib kaardi nähtavast osast: „Restoranid“, „Kohvikud“, „Baarid ja ööelu“, „Majutus“, „Vaatamisväärsused“, „Muuseumid ja kultuur“, „Loodus ja pargid“ ning „Tegevused“. Pluginate lisatud kategooriad on õhukese eraldusjoone järel. Kui rida on kaardist laiem, kerib hiireratas seda külgsuunas. „Otsi sellest piirkonnast“ otsib pärast kaardi liigutamist uuesti.',
  'help.ctx.trip-map.bullet.6':
    'Tee kaardil ükskõik kus paremklõps, et avada selles punktis koha vorm, kus aadress on juba otsitud. All vasakul on kaks ümmargust nuppu: lukk „Lukusta kaardivaade“ hoiab kaardivaate paigal, kui klõpsad päevi ja kohti läbi, ning selle all olev „Lülitu satelliidivaatele“ asendab joonistatud kaardi satelliidipiltidega.',
  'help.ctx.trip-map.bullet.7':
    'Paremas allnurgas olev „Näita kogu reisi“ joonistab korraga kõik reisipäevad ja näitab, mida iga päev hõlmab. Broneeringu real olev marsruudiikoon joonistab selle broneeringu ja päevade kohal tööriistaribal olev marsruudiikoon kõik broneeringud. Joonistatud broneeringu üksikasjade avamiseks klõpsa selle otsal.',
  'help.ctx.trip-map.bullet.8':
    'Kui lisamoodul Dawarich on sees, näitab nupu „Näita kogu reisi“ all olev ümmargune Dawarichi nupp marsruuti, mille su telefon tegelikult salvestas. „Näita salvestatud teekonda“ joonistab selle katkendjoonena planeeritud marsruudi alla, iga päev oma värvis. Kui joont pole, ütleb nupu silt, miks.',
  // map-markers
  'help.guide.map-markers.title': 'Loe kaarti',
  'help.guide.map-markers.goal': 'Saa aru, mida tähendab iga nööpnõel, märk ja mull kaardil.',
  'help.guide.map-markers.step.1':
    'Kaardil on kõik reisi kohad. Kus nööpnõelad on eristamiseks liiga lähestikku, koondatakse need üheks tumedaks ringiks, mille sees on nööpnõelte arv. Klõpsa ringil ja kaart suumib nende nööpnõelteni või suurima suumi korral laotab need lahku.',
  'help.guide.map-markers.step.2':
    'Nööpnõelal on koha enda foto, kui see on olemas, muidu kategooria värv ja ikoon. Majutus, mille broneering on veel ootel, on tuhm ja katkendliku rõngaga. Kui viid kursori nööpnõelale, avaneb selle kõrval kaart: sama foto suuremana, nimi ja aadress ning hinnang ja kategooria, kui kohal need on.',
  'help.guide.map-markers.step.3':
    'Klõpsa nööpnõelal ja koht avaneb kaardi alaosas kaardil: ülal pilt, nimi ja aadress, seejärel tähed, kirjeldus ja failid, sealhulgas broneeringu failid. All on toimingud: „Lisa päevale“, kui mõni päev on avatud („Eemalda päevast“, kui koht on juba sellel päeval), „Navigeerimine“, „Ava veebisait“, „Salvesta kogumikku“ („Salvestatud“, kui see on juba mõnes kogumikus) ning paremal prügikast ja „Muuda“. Ülal olev X või klõps kaardi tühjal alal sulgeb selle.',
  'help.guide.map-markers.step.4':
    'Ava päevade veerus päev ja selle peatused saavad numbrid: väike valge märk nööpnõela nurgas näitab peatuse järjekohta päevas. Kohal, mis on päevas kaks korda, on näha mõlemad numbrid. Kui ükski päev pole avatud, numbreid pole ja nurgas on hoopis koha hinnang, kui see on olemas.',
  'help.guide.map-markers.step.5':
    'Lohista marker kaardilt päevade veerus mõnele päevakaardile ja koht planeeritakse sellele päevale, täpselt nagu siis, kui lohistad selle rea kohtade loendist.',
  'help.guide.map-markers.result':
    'Reisis ei muutunud midagi: kaart ainult näitab reisi. Iga marker näitab, mis koht see on, mis päeval ja mitmendana.',
  'help.guide.map-markers.tip.1':
    'Kui paned päevade veerus päeva kokku, peidetakse kaardil selle peatused. Nende uuesti nägemiseks ava päev jälle.',
  'help.guide.map-markers.tip.2':
    'Kohtade loendi kohal olevad filtrid määravad ka selle, mida kaart näitab: „Näita“ („Planeerimata“, „Plaanis“), sildinupu all olevad kategooriad ja tärni all olev minimaalne hinnang vähendavad kõik nööpnõelte arvu. Riigifilter kitsendab ainult loendit.',
  'help.guide.map-markers.tip.3':
    'Sellel kaardil pole suuminuppe: hiireratas suumib, topeltklõps suumib ühe astme võrra lähemale ja kaarti ennast lohistades saad seda liigutada.',
  // map-nearby-places
  'help.guide.map-nearby-places.title': 'Leia kaardil ümbruskonna kohti',
  'help.guide.map-nearby-places.goal':
    'Otsi kaardil näha olevast linnaosast restorane, vaatamisväärsusi või hotelli ja lisa mõni neist reisile.',
  'help.guide.map-nearby-places.step.1':
    'Kaardi ülaosas olev ikoonirida on kategooriaotsing: „Restoranid“, „Kohvikud“, „Baarid ja ööelu“, „Majutus“, „Vaatamisväärsused“, „Muuseumid ja kultuur“, „Loodus ja pargid“ ning „Tegevused“. Pluginate lisatud kategooriad on õhukese eraldaja järel; nime nägemiseks vii kursor ikoonile.',
  'help.guide.map-nearby-places.step.2':
    'Klõpsa kategoorial. TREK otsib kaardi nähtavast osast seda tüüpi kohti ja paneb iga tulemuse kohta kategooria värvi nööpnõela. Korraga saab olla ainult üks kategooria: teisel klõpsamine asendab selle ja aktiivsel klõpsamine lülitab selle välja.',
  'help.guide.map-nearby-places.step.3':
    'Kaarti liigutades ilmub rea alla teine nupp: „Otsi sellest piirkonnast“ teeb sama otsingu uues vaates. Kaardi liigutamine ise uut otsingut ei alusta, nii jääb päringuid vähe.',
  'help.guide.map-nearby-places.step.4':
    'Hoia kursorit nööpnõela kohal, et näha leitud koha nime. Klõpsa nööpnõelal ja avaneb koha vorm, kus andmed on juba täidetud: nimi dialoogi ülaosas, „Aadress“, „Laiuskraad“ ja „Pikkuskraad“ ning veebisait ja telefoninumber, kui otsing need leidis.',
  'help.guide.map-nearby-places.step.5':
    'Kontrolli täidetud andmeid ja lisa see, mida otsing ei saanud teada. Nime all olev kategooriasilt on juba määratud, kui reisil on sobiv kategooria, näiteks restoran restorani jaoks; muidu on sellel kirjas „Kategooriata“, kuni valid kategooria. Lisa oma „Kirjeldus“ ja märkmed.',
  'help.guide.map-nearby-places.step.6':
    'Klõpsa „Lisa“. Kui sama nimega või samas kohas asuv koht on reisis juba olemas, annab TREK sellest teada ja nupu tekst muutub: „Lisa siiski“.',
  'help.guide.map-nearby-places.result':
    'Koht on kohtade loendis ja kaardil ühena reisi enda nööpnõeltest, jaotises „Planeerimata“, kuni paned selle mõnele päevale. Otsingu nööpnõelad jäävad alles, kuni lülitad kategooria välja.',
  'help.guide.map-nearby-places.tip.1':
    'Rida on peidetud, kui jaotises „Seaded“ > „Üldine“ alajaotises „Reisimine ja kaart“ on „Avasta kaardil kohti“ välja lülitatud.',
  'help.guide.map-nearby-places.tip.2':
    'Tulemused tulevad TREK Placesi indeksist ja OpenStreetMapist, seega on see üks väheseid asju plaanis, mis vajab ühendust.',
  'help.guide.map-nearby-places.tip.3':
    'Otsing hõlmab ainult ekraanil olevat ala, nii et suumi sisse tänavani, mis sind huvitab. Kogu linna otsing annab ainult esimesed kuuskümmend tulemust, ilma kindla järjekorrata.',
  // map-add-place
  'help.guide.map-add-place.title': 'Loo koht kaardil paremklõpsuga',
  'help.guide.map-add-place.goal': 'Pane koht täpselt sinna, kuhu tahad, ilma seda enne otsimata.',
  'help.guide.map-add-place.step.1':
    'Tee kaardil soovitud kohas paremklõps. Avaneb kohavorm pealkirjaga „Lisa koht või tegevus“.',
  'help.guide.map-add-place.step.2':
    '„Laiuskraad“ ja „Pikkuskraad“ on juba selle punkti järgi määratud. TREK otsib koordinaatide järgi ja täidab välja „Aadress“ sellega, mis sealt leitakse. Kui otsing leiab ka nime, täidab TREK akna ülaosas ka nime. Midagi pole veel salvestatud, nii et paranda, mis on valesti.',
  'help.guide.map-add-place.step.3':
    'Kirjuta dialoogi ülaosas olevale väljale nimi, mille ära tunned. Vali selle all olevalt sildilt kategooria; kuni valid, on seal kirjas „Kategooriata“. Seejärel lisa muud plaani jaoks vajalikud andmed: „Kirjeldus“, „Märkmed“, „Veebisait“.',
  'help.guide.map-add-place.step.4':
    'Klõpsa „Lisa“. Koht lisatakse loendisse planeerimatuna ka siis, kui mõni päev on avatud: paremklõps kaardil määrab asukoha, mitte päeva.',
  'help.guide.map-add-place.result':
    'Koht on loendis ja kaardil jaotises „Planeerimata“, kuni paned selle mõnele päevale.',
  'help.guide.map-add-place.tip.1':
    'Aadress leitakse koordinaatide järgi, nii et nime asemel võib olla tänav ja asustamata alal võib see jääda tühjaks. Mõlemat välja saad ise üle kirjutada.',
  'help.guide.map-add-place.tip.2':
    'MapLibre GL ja Mapbox GL kaartidel teeb sama keskklõps ja puuteekraanil pikk vajutus.',
  // map-satellite
  'help.guide.map-satellite.title': 'Lülitu satelliitvaatele',
  'help.guide.map-satellite.goal': 'Vaheta joonistatud kaart aerofotode vastu ja tagasi.',
  'help.guide.map-satellite.step.1':
    'Aluskihi lüliti on kaardi all vasakul olevast kahest ümmargusest nupust alumine, luku all. Selle ikoon näitab alati kihti, millele see lülitab, ja vihje ütleb, millele: „Lülitu satelliidivaatele“. Klõpsa sellel.',
  'help.guide.map-satellite.step.2':
    'Kaardil on nüüd aerofotod. Need on nii detailsed, et näha on üksikuid hooneid, ja oma võtit pole vaja. Kõik, mida TREK joonistab, jääb peale: nööpnõelad, päeva marsruut, rajad ja broneeringute marsruudid.',
  'help.guide.map-satellite.step.3':
    'Nupul on nüüd kirjas „Lülitu kaardivaatele“. Klõpsa sellel, et kaardivaatesse tagasi minna.',
  'help.guide.map-satellite.result': 'Kaart joonistatakse uuesti ja valitud kiht jäetakse sinu kontole meelde.',
  'help.guide.map-satellite.tip.1':
    'Valik salvestatakse sinu kontole, mitte reisile, nii et iga reis avaneb nii, nagu selle jätsid, olenemata sellest, millist kaardimootorit kasutad.',
  'help.guide.map-satellite.tip.2':
    'Satelliidipiltidel pole silte: tänavanimed, linnaosad ja majanumbrid on ainult joonistatud kaardil, nii et aadressi otsides lülitu tagasi.',
  // map-whole-trip
  'help.guide.map-whole-trip.title': 'Vaata kogu reisi ja selle vahemaid',
  'help.guide.map-whole-trip.goal':
    'Näita ainult avatud päeva asemel reisi kõiki reisipäevi ja vaata, kui pika maa iga päev läbid.',
  'help.guide.map-whole-trip.step.1':
    'Ümmargune nupp „Näita kogu reisi“ on kaardi paremas allnurgas. Klõpsa sellel ja kõik reisi reisipäevad joonistatakse korraga, iga päev oma värviga, et naaberpäevi saaks eristada.',
  'help.guide.map-whole-trip.step.2':
    'Nupu kohal olev infokaart loetleb need päevad: värvitäpp, päeva nimi, ikoon iga liikumisviisi kohta ja läbitav vahemaa. „Kogupikkus“ on üleval.',
  'help.guide.map-whole-trip.step.3':
    'Päeva valimiseks klõpsa sellel kaardil: rida tõstetakse esile ja päev avaneb päevade veerus. Linna kohal hiirerattaga kerides suumid sisse. Linna läbivad päevad kuvatakse kõrvuti, igaüks oma värviga.',
  'help.guide.map-whole-trip.step.4':
    'Nupul on nüüd kirjas „Peida kogu reis“. Klõpsa sellel, et näha jälle ainult avatud päeva.',
  'help.guide.map-whole-trip.result':
    'Iga reisipäev on joonistatud oma värvis ja kaart näitab, mida iga päev hõlmab, ning kogu reisi kogusummat.',
  'help.guide.map-whole-trip.tip.1':
    'Kogusumma arvutatakse mõne teelõigu kaupa. Kuni selle järel on näha …, on tegu alles osasummaga. Lõplik on see siis, kui kõik teelõigud on arvutatud.',
  'help.guide.map-whole-trip.tip.2':
    'Kui marsruutija ei suuda teelõiku arvutada, jääb lõik sirgjooneks ja seda ei arvestata. Infokaart annab sellest teada, et kogusumma ei paistaks hoiatuseta väiksem.',
  'help.guide.map-whole-trip.tip.3':
    'Päeval, millel on vähem kui kaks asukohaga peatust ja pole sõitu hotelli ega hotellist, pole marsruuti, mida joonistada, seega seda infokaardil üldse ei ole.',
  // map-booking-routes
  'help.guide.map-booking-routes.title': 'Näita broneeringu marsruuti kaardil',
  'help.guide.map-booking-routes.goal':
    'Näita broneeritud lende, rongisõite ja autosõite kaardil ning eemalda need sealt uuesti.',
  'help.guide.map-booking-routes.step.1':
    'Broneeringute marsruudid on väljas, kuni mõne sisse lülitad. Päevade veerus on transpordi rea paremas otsas väike marsruudiikoon: „Näita broneeringute marsruute“.',
  'help.guide.map-booking-routes.step.2':
    'Klõpsa sellel ja broneering ilmub kaardile: lend suurringjoone kaarena, autosõit mööda tegelikke teid, rong jaamade ahelana. „Kinnitatud“ joonistatakse pideva joonega, „Ootel“ katkendjoonega ning marsruudi otstes on sinised sildid transpordi ikooniga.',
  'help.guide.map-booking-routes.step.3':
    'Klõpsa otspunkti sildil ja avanevad broneeringu üksikasjad: olek, tüüp ja päevad siltidena värvilises päises, kellaajad mõlemas otsas, muud andmed allpool ning allosas „Kaardil“, mis lülitab selle marsruudi jälle välja, ühistranspordi ühenduse puhul „Muuda marsruuti“, broneeringu kustutav prügikast ja „Muuda“. Päises olev X sulgeb üksikasjad.',
  'help.guide.map-booking-routes.step.4':
    'Päevade kohal tööriistaribal olev marsruudiikoon toimib korraga kogu reisi kohta: „Näita kõiki broneeringute marsruute“ joonistab välja iga broneeringu, millel on marsruut.',
  'help.guide.map-booking-routes.step.5':
    'See asendab sinu varasemad valikud, nii et broneeringute kaupa sisse lülitatud marsruudid lähtestatakse. Kõigi broneeringute marsruutide peitmiseks vajuta uuesti nuppu, millel on nüüd kirjas „Peida kõik broneeringute marsruudid“.',
  'help.guide.map-booking-routes.result':
    'Soovitud broneeringud joonistatakse kaardile ja valik jääb selle reisi jaoks selles brauseris meelde, kuni seda muudad.',
  'help.guide.map-booking-routes.tip.1':
    'Otstes on lennujaama kood või jaama nimi ainult siis, kui jaotises „Seaded“ > „Üldine“ alajaotises „Reisimine ja kaart“ on „Broneeringute marsruutide sildid“ sees; muidu on seal ainult ikoon.',
  'help.guide.map-booking-routes.tip.2':
    'Samas jaotises olev „Näita alati broneeringute marsruute“ näitab neid kohe algusest igal reisil, kus sa pole seda veel ise määranud.',
  'help.guide.map-booking-routes.tip.3':
    'Broneeringul peavad joonistamiseks olema koordinaatidega algus ja lõpp, seega pole hotellil ega restoranil marsruudiikooni.',
  // map-dawarich-trail
  'help.guide.map-dawarich-trail.title': 'Näita tegelikult läbitud teekonda',
  'help.guide.map-dawarich-trail.goal':
    'Näita kaardil teekonda, mille Dawarich sinu telefonis salvestas, katkendjoonena planeeritud marsruudi kõrval, ja vaata päev päeva haaval, kuidas reis tegelikult kulges.',
  'help.guide.map-dawarich-trail.step.1':
    'Ümmargune Dawarichi nupp on kaardi paremas alanurgas nupu „Näita kogu reisi“ all. Kui viid kursori sellele, on kirjas „Näita salvestatud teekonda“. Klõpsa sellel. TREK küsib sinu Dawarichilt reisi kuupäevade andmeid ja vastust oodates keerleb nupu ümber rõngas.',
  'help.guide.map-dawarich-trail.step.2':
    'Salvestatud teekond ilmub katkendjoonena, iga päev ise värvi, ja see joonistatakse planeeritud marsruudi alla, et plaan jääks loetavaks. Nupul on nüüd kirjas „Peida salvestatud teekond“. Iga päev lõpeb kohaliku aja järgi keskööl. Kui ahendad päeva päevade veerus, peidetakse kaardil selle katkendjoon ja peatused.',
  'help.guide.map-dawarich-trail.step.3':
    'Klõpsa lisaks „Näita kogu reisi“ ja iga planeeritud päev joonistatakse pideva joonena katkendliku salvestuse kõrvale. Kus jooned kattuvad, läks päev plaanipäraselt. Kus katkendjoon planeeritud marsruudilt kõrvale kaldub, ei läinud.',
  'help.guide.map-dawarich-trail.result':
    'Kaardil on koos näha, mida planeerisid ja mida tegelikult tegid, katkend- ja pidevjoonena. Nuppude kohal olev infokaart loetleb endiselt planeeritud päevad ja nende vahemaad.',
  'help.guide.map-dawarich-trail.tip.1':
    'Sisse- või väljalülitus salvestatakse iga reisi kohta sinu kontole, nii et see on igas brauseris ja seadmes sama. Kui teekond on sisse lülitatud, küsib TREK Dawarichilt iga kahe minuti järel uuesti, nii et käimasolev reis uueneb lehte uuesti laadimata. Teekonda ennast ei salvestata kunagi, seega pole seda TREKi andmebaasis ega varukoopiates ja see pole võrguta saadaval.',
  'help.guide.map-dawarich-trail.tip.2':
    'Nupu silt ütleb, miks kaart on tühi: laadimise ajal „Salvestatud teekonna laadimine…“, siis „Nendel kuupäevadel pole midagi salvestatud“, „Salvestatud teekonda ei saanud laadida“ või, kui TREK on võrguühenduseta, „Salvestatud teekonna laadimine vajab ühendust“.',
  // map-compass
  'help.guide.map-compass.title': 'Pööra kaarti ja leia jälle põhjasuund',
  'help.guide.map-compass.goal': 'Pööra kaart liikumissuunda ja too see ühe klõpsuga tagasi põhja suunda.',
  'help.guide.map-compass.step.1':
    'Pööra kaarti parema hiirenupuga lohistades või hoia all Ctrl ja lohista vasaku nupuga. Puuteekraanil pööra kahe sõrmega. Kaardi ülaosas kategooriaikoonide rea kõrval olev ümmargune kompass pöörleb kaasa: selle nool näitab alati põhja, nii et see kaldub sama nurga võrra kui kaart.',
  'help.guide.map-compass.step.2':
    'Klõpsa kompassil. Nupp „Lähtesta põhjasuund“ pöörab kaardi tagasi nii, et põhi on üleval, teeb vaate jälle tasaseks ja nool näitab jälle üles.',
  'help.guide.map-compass.result':
    'Kaardil on põhi jälle üleval ja vaade on tasane. Reisil ei muutunud midagi: kompass muudab ainult vaadet.',
  'help.guide.map-compass.tip.1':
    'Kompass on ainult MapLibre GL ja Mapbox GL kaartidel. Leafleti kaarti ei saa pöörata, seega sellel kompassi pole. Millist kaarti kasutad, määrab „Kaarditeenus“ jaotises „Seaded“, alajaotises „Kaart“, ja „Salvesta kaart“ salvestab valiku.',
  'help.guide.map-compass.tip.2':
    'Klõps eemaldab ka kalde. Vaate kallutamiseks lohista parema hiirenupuga üles või alla. „Lähtesta põhjasuund“ teeb vaate jälle tasaseks ja lähtestab pööramise. Kui Mapbox GL-is on „3D-hooned ja maastik“ sees, muudab see ka 3D-vaate lamedaks, kuni seda uuesti kallutad.',
  // ── Screen: trip-transports ───────────────────────────────────────────────────────────
  'help.ctx.trip-transports.title': 'Transport',
  'help.ctx.trip-transports.summary':
    'Kõik viisid, kuidas peatuste vahel liigud: lennud, rongid, bussid, autod, taksod, jalgrattad, kruiisid, praamid, köisraudteed ja ühistranspordi ühendused, mille TREK sinu eest otsib. Vahelehel on need loetletud. Neid saab luua ja vaadata ka plaanis ning need on kaardil näha.',
  'help.ctx.trip-transports.bullet.1':
    'Vahelehel on ainult sõidud. Majutus, restoranid, üritused ja piletid on vahelehel „Broneeringud“, nii et sama kirje ei ole kunagi kahes kohas.',
  'help.ctx.trip-transports.bullet.2':
    'Ülaosas oleval ribal on „Otsi“, „Filter“ oleku, tüüpide ja reisijate järgi, kolm vaadet „Kaardid“, „Loend“ ja „Ajajoon“, „Vaate valikud“ ning „Ekspordi tabelina (CSV)“, mis laadib näidatu alla. Paremal olev „Transport“ lisab sõidu käsitsi. Selle ees olevad ikoonid „Impordi broneeringukinnitused“ ja „Impordi AirTrailist“ ilmuvad, kui server oskab kinnitusi lugeda või AirTrail on ühendatud. Tühjal vahelehel on samad toimingud keskel: „Transport“, „Impordi failist“ ja AirTrail.',
  'help.ctx.trip-transports.bullet.3':
    '„Kaardid“ on vaade, milles vaheleht avaneb: kõigepealt „Kinnitatud“, siis „Ootel“. Iga jaotise saad pealkirjal klõpsates kokku panna. Planeeritud ühistranspordiühendustel pole olekut ja need on kinnitatud sõitude hulgas ajalises järjekorras, kui „Vaate valikud“ ei anna neile eraldi jaotist „Automaatne ühistranspordiotsing“. „Loend“ rühmitab päevade kaupa ja „Ajajoon“ näitab kõiki sõite reisi päevade lõikes.',
  'help.ctx.trip-transports.bullet.4':
    'Kaardi ülemine riba on värvitud oleku järgi: roheline tähendab kinnitatud, merevaigukollane ootel ja sinine planeeritud ühendust. Ribal on olekutäpp, tüüp, pealkiri, pliiats ja prügikast. Selle all on „Kuupäev“, „Aeg“, „Broneerimiskood“, „Marsruut“ ning lennufirma ja lennunumber või rongi number, perroon ja istekoht. Üksikasjade avamiseks klõpsa kaardil.',
  'help.ctx.trip-transports.bullet.5':
    'Transporti saab luua ka plaanis: päeva päises olev + (vihjega „Lisa päevale“) või paremklõps päisel pakub valikuid „Lisa transport“ ja „Ühistransport“. Kahe peatuse vaheline sõiduaja ühendus avab sama otsingu selle ühe lõigu jaoks.',
  'help.ctx.trip-transports.bullet.6':
    'Transport, mille mõlemad otspunktid on määratud, joonistab kaardile joone. Selle joone lülitavad sisse marsruudiikoon transpordi real päevaplaanis ja „Kaardil“ selle üksikasjades. Päevade kohal tööriistaribal olev „Näita kõiki broneeringute marsruute“ lülitab kogu reisi jooned sisse või välja.',
  // transports-list
  'help.guide.transports-list.title': 'Tutvu vahekaardiga „Transport“',
  'help.guide.transports-list.goal': 'Saa enne muutmist aru, mida loend näitab.',
  'help.guide.transports-list.step.1':
    '„Transport“ on reisi vaheleht pärast „Plaani“ (ja „Retki“, kui see lisamoodul on sees). Seal on ainult sõidud: hotellid, restoranid, üritused ja piletid on vahelehel „Broneeringud“.',
  'help.guide.transports-list.step.2':
    'Riba vasakus servas olev „Otsi“ filtreerib sõite kirjutamise ajal. Selle kõrval olev lehter „Filter“ avab valikud: „Olek“ väärtustega „Kõik“, „Kinnitatud“ ja „Ootel“, seejärel iga kasutusel olev tüüp koos arvuga. Märgi üks või mitu tüüpi, et näha ainult neid. Lehtril olev number näitab aktiivsete filtrite arvu ja riba näitab, mitu sõitu on kuvatud, näiteks 1 / 4. Menüü allosas olev „Lähtesta filtrid“ toob kõik sõidud tagasi.',
  'help.guide.transports-list.step.3':
    'Kõrval olevad „Kaardid“, „Loend“ ja „Ajajoon“ näitavad transporti kaartidena, päevade kaupa rühmitatud ridadena või ribadena üle reisi päevade. „Vaate valikud“ (liugurite ikoon) määrab vaadetes „Kaardid“ ja „Loend“ valikud „Rühmita“ ja „Sordi“ ning vaates „Ajajoon“ rajad. „Lähtesta vaade“ taastab vaikeväärtused. Vaates „Kaardid“ näitab „Ühistransport eraldi jaotisena“ planeeritud ühendusi jaotises „Automaatne ühistranspordiotsing“.',
  'help.guide.transports-list.step.4':
    'Igal kaardil on kõik andmed. Ülemine riba on „Kinnitatud“ puhul roheline ja „Ootel“ puhul merevaigukollane ning sellel on olekutäpp, tüüp ja pealkiri. Selle all näitab „Kuupäev“ hõlmatud päevi koos kuupäevadega. Seejärel tulevad „Aeg“, „Broneerimiskood“, „Marsruut“, kus peatuste vahel on tüübi ikoon, ning lennufirma ja lennunumber või rongi number, platvorm ja istekoht. Üksikasjade avamiseks klõpsa kaardil.',
  'help.guide.transports-list.step.5':
    'Klõpsa olekutäpil, et lülitada sõit olekute „Ootel“ ja „Kinnitatud“ vahel; vihje ütleb, kummale poole, näiteks „Määra olekuks Ootel“. Päises olev pliiats avab transpordi vormi ja prügikast kustutab selle pärast küsimust „Kas kustutada broneering?“, kus on loetletud kõik, mis kustutatakse, sealhulgas seotud kulud.',
  'help.guide.transports-list.result':
    'Iga kaart näitab, kas sõit on broneeritud, ja ribaga saad loendit igal ajal filtreerida või sortida.',
  'help.guide.transports-list.tip.1':
    'Vahekaart jätab sinu seaded meelde: vaate, rühmituse ja sortimise selles brauseris, ahendatud jaotised iga reisi kohta ja filtrid seni, kuni sulged brauseri vahekaardi.',
  'help.guide.transports-list.tip.2':
    '„Impordi broneeringukinnitused“ ja „Impordi AirTrailist“, kaks ikooni nupu „Transport“ ees, on näha ainult siis, kui server oskab kinnitusi lugeda ja kui AirTraili instants on ühendatud. Muidu täidad loendi käsitsi või ühistranspordi otsinguga.',
  // add-transport
  'help.guide.add-transport.title': 'Lisa päevale transport',
  'help.guide.add-transport.goal': 'Lisa transport, mis viib sind ühest peatusest järgmisse, päevale, mil see toimub.',
  'help.guide.add-transport.step.1':
    'Klõpsa sõidupäeva päises +-il, mille vihje on „Lisa päevale“, ja vali „Lisa transport“. Sama menüü avaneb ka paremklõpsuga päeva päisel. Vorm avaneb ja selles on see päev juba täidetud.',
  'help.guide.add-transport.step.2':
    'Päises olev tüübisilt näitab transpordi tüüpi, vaikimisi „Lend“. Klõpsa sellel, et valida „Lend“, „Rong“, „Buss“, „Auto“, „Takso“, „Jalgratas“, „Kruiis“, „Praam“, „Köisraudtee“ või „Muu“, ja vorm muutub vastavalt: lennul on igas peatuses lennujaam, rongil jaamade ahel, kruiisil „Pardaleminek“, „Peatussadam“ ja „Laevalt lahkumine“, autol „Kättesaamine“, „Tagastamine“ ja „Peatused tee ääres“.',
  'help.guide.add-transport.step.3':
    'Kirjuta pealkiri otse ülemisele ribale, kus on hall näidistekst. See on ainus kohustuslik väli: kuni see on täitmata, on selle all oleval real kirjas „Pealkiri *“ ja „Lisa“ jääb halliks. Kasuta pealkirja, mille väljumistablool ära tunneksid.',
  'help.guide.add-transport.step.4':
    'Jaotises „Marsruut“ saab väljadele „Kust“ ja „Kuhu“ sisestada jaama, sadama või aadressi. Reisi enda kohti pakutakse juba enne kirjutamist. Otsimiseks kirjuta vähemalt kolm tähte ja vali tulemus. Nime, mille ainult kirjutad, kuid tulemustest ei vali, ei salvestata ja kaardil ei kuvata midagi.',
  'help.guide.add-transport.step.5':
    '„Kuupäev“ ja „Algusaeg“ näitavad, millal sõit algab, „Lõppkuupäev“ ja „Lõpuaeg“, millal see lõpeb; järgmisel päeval saabuva sõidu puhul vali seal järgmine päev. Allpool olevad „Broneerimiskood“ ja „Märkmed“ on valikulised. Klõpsa päises sildil „Ootel“, et muuta see olekuks „Kinnitatud“.',
  'help.guide.add-transport.step.6': 'Klõpsa „Lisa“.',
  'help.guide.add-transport.result':
    'Transport on päeval rida oma kellaajal peatuste vahel ja vahekaardil „Transport“ kaart jaotises „Ootel“ või „Kinnitatud“.',
  'help.guide.add-transport.tip.1':
    'Rida paigutatakse algusaja järgi viimase varem algava peatuse järele. Pidemest lohistades saad selle päevas mujale või teisele päevale viia.',
  'help.guide.add-transport.tip.2':
    'Pileti lisamiseks kasuta jaotises „Failid“ nuppu „Lisa fail“. Jaotises „Kulud“ olev „Loo kulu“ salvestab broneeringu ja avab piletihinna jaoks kulude redaktori.',
  'help.guide.add-transport.tip.3':
    'Vormi esimene plokk „Reisijad“ määrab, kes selle transpordiga sõidab. Kui reisil on rohkem kui üks liige ja mõnes transpordis on keegi märgitud, pakub vahekaardi filter ka valikut „Reisijad“, mis näitab ainult ühe inimese transporti.',
  // import-transport-file
  'help.guide.import-transport-file.title': 'Impordi lend e-piletist',
  'help.guide.import-transport-file.goal':
    'Lase TREKil lugeda lend, rong või praam vedaja saadetud piletilt ja kontrolli seda enne salvestamist.',
  'help.guide.import-transport-file.step.1':
    'Klõpsa vahelehe „Transport“ ribal nupu „Transport“ ees oleval allalaadimisikoonil, mille vihje on „Impordi broneeringukinnitused“. Avaneb samanimeline dialoog, sama mis vahelehel „Broneeringud“. Tühjal vahelehel teeb sama keskel olev „Impordi failist“.',
  'help.guide.import-transport-file.step.2':
    'Lohista pilet kasti või klõpsa kastil ja vali fail: EML, PDF, PKPass, HTML ja TXT, kuni viis faili, igaüks kuni 10 MB, ning pileti fotod (JPG, PNG, WEBP), kui sinu serveril on nende lugemiseks tehisintellekti mudel. Kastis on näha valitud failide nimed.',
  'help.guide.import-transport-file.step.3': 'Klõpsa „Impordi“. Aken sulgub kohe ja fail loetakse sisse taustal.',
  'help.guide.import-transport-file.step.4':
    'Paremas allnurgas olev kaart näitab faili nime all edenemist. Kui lugemine on lõppenud, asendub „Failide töötlemine…“ linnukesega ja kaardil on nupp „Impordi“. Klõpsa sellel.',
  'help.guide.import-transport-file.step.5':
    'Lend avaneb juba täidetuna vormis „Lisa transport“: tüübinupp on „Lend“, lennufirma ja lennunumber on päises pealkirjana, mõlemad lennujaamad on jaotises „Marsruut“ koos väljadega „Väljumine“ ja „Saabumine“, nende kellaaegade ja ajavöönditega, „Lennufirma“ ja „Lennu nr“, „Broneerimiskood“ ning pilet jaotises „Failid“. Kontrolli andmed üle ja klõpsa „Lisa“.',
  'help.guide.import-transport-file.result':
    'Lend on vahekaardil „Transport“ kaart jaotises „Ootel“ ja väljumispäeval rida, pilet on jaotises „Failid“. Kui mõlemad lennujaamad on teada, on lend kaardil kaarena näha.',
  'help.guide.import-transport-file.tip.1':
    'Mõlemad vahekaardid kasutavad sama importi. Fail, milles on lend ja hotell, avab lennu vormis „Lisa transport“ ja seejärel hotelli vormis „Uus broneering“, olenemata sellest, kummalt vahekaardilt alustasid.',
  'help.guide.import-transport-file.tip.2':
    'Lennujaamad paigutatakse koodi järgi. Kui jaama või sadamat ei õnnestunud leida, kuvatakse selle nimi paremas allnurgas oleval impordikaardil merevaigukollasena. Vali see enne „Lisa“ klõpsamist jaotises „Marsruut“ käsitsi, muidu transporti kaardil ei kuvata.',
  // plan-transit
  'help.guide.plan-transit.title': 'Ühistranspordiühenduse planeerimine',
  'help.guide.plan-transit.goal':
    'Lase TREKil leida päeva kahe punkti vahel tegelikud rongid ja bussid ning lisa valitud ühendus plaani.',
  'help.guide.plan-transit.step.1':
    'Klõpsa päeva päises +-märgil ja vali „Ühistransport“. Otsing avaneb selle päeva jaoks: päev on päises näha ümara märgisena ja selle kõrval olevad „Käsitsi“ ja „Automaatne“ lülitavad selle otsingu ja tavalise vormi vahel.',
  'help.guide.plan-transit.step.2':
    '„Lähtekoht“ ja „Sihtkoht“ võtavad vastu peatuse või jaama. Kui väli on veel tühi, pakub TREK päeva majutust, päeva broneeringute jaamu ja lennujaamu ning päeva enda peatusi. Kui kirjutad kaks tähte, otsitakse hoopis sõiduplaani jaamu. Väljade vahel olev „Vaheta“ vahetab lähte- ja sihtkoha.',
  'help.guide.plan-transit.step.3':
    '„Väljumine“ või „Saabumine“ koos kellaajaga ütleb, millal tahad sõita, ning „Parim marsruut“, „Vähem ümberistumisi“ või „Vähem kõndimist“ määrab, kuidas tulemused järjestatakse.',
  'help.guide.plan-transit.step.4':
    'All olevad märgised näitavad, milliseid transpordiliike võib kasutada: „Rong“, „Metroo“, „Tramm“, „Buss“, „Praam“ ja „Köisraudtee“. Lülita mõni välja, et see välja jätta, vähemalt üks jääb sisse. Seejärel klõpsa „Otsi“.',
  'help.guide.plan-transit.step.5':
    'Iga tulemus näitab väljumist ja saabumist, sõidu kestust, ümberistumiste arvu ja jalgsi käimist ning liine märkidena, nende oma värvides, kui sõiduplaan need annab. Klõpsa tulemusel, et see lahti võtta ja näha iga lõiku koos peatustega, kus sisse ja ümber istud, platvormide ja liinide vaheliste jalgsikäikudega.',
  'help.guide.plan-transit.step.6': 'Klõpsa „Lisa päevale“.',
  'help.guide.plan-transit.result':
    'Ühendus on päeval rida koos liinimärkidega. Klõpsa selle noolel, et näha iga lõiku. See on ka vahelehel „Transport“ kinnitatud sõitude hulgas sinise kaardina.',
  'help.guide.plan-transit.tip.1':
    "Ühendused tulevad teenusest Transitous. See on tasuta kogukonnateenus, mis kasutab avalikke sõiduplaaniandmeid: võtit ega kontot pole vaja. Administraator saab määrata, et otsing kasutaks hoopis Google'it.",
  'help.guide.plan-transit.tip.2':
    'Midagi ei leitud? Andmevood katavad kindlat piirkonda ja perioodi. Proovi muud aega, lülita sisse rohkem liikumisviise või vali koha asemel jaam. Teates on nimetatud teenus, mis vastas. Kuupäevadeta reisil pole päeva, mille järgi otsida, nii et pakutakse ainult tavalist vormi.',
  'help.guide.plan-transit.tip.3':
    'Sama otsingu saad avada ka ühe teelõigu jaoks: klõpsa kahe peatuse vahel oleval sõiduaja ühendusel ja vali „Ühistransport“. „Kust“, „Kuhu“ ja väljumisaeg täidetakse sinu eest.',
  // change-transit-route
  'help.guide.change-transit-route.title': 'Ava ja muuda planeeritud ühendust',
  'help.guide.change-transit-route.goal': 'Vaata ühendust liini kaupa, nimeta see ümber või otsi marsruut uuesti.',
  'help.guide.change-transit-route.step.1':
    'Vahekaardil „Transport“ on planeeritud ühendus sinise ülemise ribaga kaart, mis on koos kinnitatud transpordiga ajalises järjekorras. Kui „Vaate valikud“ all on „Ühistransport eraldi jaotisena“ sisse lülitatud, on see hoopis jaotises „Automaatne ühistranspordiotsing“. Klõpsa kaardil. Ühendus avaneb broneeringuna.',
  'help.guide.change-transit-route.step.2':
    'Üleval olevad paanid näitavad väljumist ja saabumist koos peatustega, „Kestus“, „Ümberistumised“ ja „Jalgsi“. Nende all näitab „Teekond“ ühendust liinide kaupa koos kellaaegade, platvormide ja liinide vaheliste jalgsikäikudega.',
  'help.guide.change-transit-route.step.3':
    'Broneeringu allosas olev „Muuda marsruuti“ avab otsingu uuesti, kus on juba täidetud selle ühenduse kaks otspunkti ja päev.',
  'help.guide.change-transit-route.step.4':
    'Klõpsa „Otsi“, ava mõni teine ühendus ja klõpsa „Lisa päevale“. See asendab vana ühenduse. Broneeringu alaosas päris paremal olev „Muuda“ avab hoopis tavalise transpordivormi, kus saad muuta välja „Broneerimiskood“, reisijaid, märkmeid ja faile.',
  'help.guide.change-transit-route.result':
    'Sõit kasutab nüüd uut marsruuti ja selle kaart vahekaardil „Transport“ näitab uusi liine ja aegu.',
  'help.guide.change-transit-route.tip.1':
    'Ühenduse ümbernimetamiseks marsruuti muutmata klõpsa broneeringu päises pealkirjal. Märkmed kirjutad transpordivormis, mis avaneb nupuga „Muuda“.',
  'help.guide.change-transit-route.tip.2':
    'Broneeringu alaosas olev prügikast kustutab ühenduse pärast kinnitust. Päeva peatused jäävad alles.',
  // leg-travel-mode
  'help.guide.leg-travel-mode.title': 'Muuda ühe lõigu liikumisviisi',
  'help.guide.leg-travel-mode.goal':
    'Muuda autosõidupäeva üks lõik jalgsikäiguks või planeeri see lõik ühistranspordi otsinguga.',
  'help.guide.leg-travel-mode.step.1':
    'Peatuste vahelised ühendused ilmuvad alles siis, kui päeva marsruut on sisse lülitatud. Klõpsa päeva päisel, et see avada, seejärel klõpsa peatuste all oleval ribal „Marsruut“.',
  'help.guide.leg-travel-mode.step.2':
    'Iga ühendus näitab selle lõigu sõiduaega ja pikkust koos liikumisviisi ikooniga, millega marsruut arvutati: auto sõitmiseks, jalg kõndimiseks, jalgratas rattasõiduks.',
  'help.guide.leg-travel-mode.step.3':
    'Klõpsa ühendusel. Menüüs on „Auto“, „Jalgsi“ ja „Jalgratas“, „Ühistransport“ just selle lõigu jaoks ning „Kasuta päeva vaikevalikut“.',
  'help.guide.leg-travel-mode.step.4':
    'Vali „Jalgsi“. Muutub ainult see teelõik, ülejäänud päev jääb oma liikumisviisi juurde.',
  'help.guide.leg-travel-mode.result':
    'Teelõigul on jalakäija ikoon ja kõndimisaeg, päeva teised teelõigud jäävad päeva liikumisviisi juurde.',
  'help.guide.leg-travel-mode.tip.1':
    'Liikumisviis kuulub lõigule, mitte päevale: kogu päeva nupud „Auto“, „Jalgsi“ ja „Jalgratas“ ei kirjuta kunagi üle käsitsi määratud lõiku. „Kasuta päeva vaikevalikut“ paneb lõigu jälle neid nuppe järgima.',
  'help.guide.leg-travel-mode.tip.2':
    'Samas menüüs olev „Ühistransport“ avab ühenduste otsingu just selle teelõigu jaoks, mõlemad otspunktid ja väljumisaeg on juba täidetud.',
  'help.guide.leg-travel-mode.tip.3':
    'Ajad tulevad avalikult marsruutijalt, mis arvestab tegelikke teid ja jalgradu. Kui marsruutija ei suuda teelõiku arvutada, jääb lõik sirgjooneks ja aega ei näidata.',
  // edit-transport
  'help.guide.edit-transport.title': 'Muuda või kustuta transport',
  'help.guide.edit-transport.goal': 'Paranda kellaaega, platvormi või broneerimiskoodi või eemalda transport reisist.',
  'help.guide.edit-transport.step.1':
    'Päevaplaanis on transport peatuste vaheline rida, mis on värvitud tüübi järgi. Klõpsa sellel, et avada broneering: ülal on siltidena olek, tüüp, päevad ja „Broneerimiskood“ (koos kopeerimisnupuga), all väljumis- ja saabumisajad koos lennujaamade või jaamadega.',
  'help.guide.edit-transport.step.2':
    'Broneeringu allosas olev „Muuda“ avab vormi, millega see loodi, ja päises on pealkirja kohal „Muuda transporti“. Seal saad muuta kõike: pealkirja, oleku- ja tüübisilte, marsruuti, päevi ja kellaaegu ning „Broneerimiskood“.',
  'help.guide.edit-transport.step.3':
    'Lennu marsruut on lennujaamade ahel, rongi oma jaamade ahel, kruiisi oma sadamate ahel. „Lisa peatus“ (kruiisil „Lisa sadam“) lisab vahele veel ühe ja igal lõigul on oma kellaajad ning oma lennu- või rongi number.',
  'help.guide.edit-transport.step.4':
    'Klõpsa „Uuenda“. Kui tahad transpordi täielikult eemaldada, kasuta sama riba vasakus servas olevat prügikasti, broneeringu alaosas olevat prügikasti või vahekaardil „Transport“ selle kaardil olevat prügikasti ja kinnita.',
  'help.guide.edit-transport.result':
    'Muudatus on näha kõikjal, kus transport on: vahekaardil „Transport“, päeval, mil see toimub, ja selle joonel kaardil.',
  'help.guide.edit-transport.tip.1':
    'Sama vorm avaneb mõlemast kohast: nupuga „Muuda“ broneeringus, mis avaneb päevaplaani realt, ja pliiatsiga kaardil vahekaardil „Transport“. Ka planeeritud ühistranspordiühendus avaneb broneeringuna. Seal avab „Muuda marsruuti“ uuesti otsingu ja „Muuda“ avab selle vormi.',
  'help.guide.edit-transport.tip.2':
    'Transpordi teisele päevale viimiseks pole vormi vaja: lohista selle rida ühelt päeva kaardilt teisele.',
  // transport-on-map
  'help.guide.transport-on-map.title': 'Näita transporti kaardil',
  'help.guide.transport-on-map.goal': 'Vaata lennu, autosõidu või ühenduse tegelikku marsruuti.',
  'help.guide.transport-on-map.step.1':
    'Mõlema otspunktiga transpordil on päevaplaanis real väike marsruudiikoon. Klõpsa sellel; selle vihjeks saab „Peida broneeringute marsruudid“.',
  'help.guide.transport-on-map.step.2':
    'Marsruut joonistatakse kaardile ja mõlemas otsas on ümar märgis transpordi ikooniga.',
  'help.guide.transport-on-map.step.3':
    'Klõpsa otsamarkeril ja broneering avaneb kaardi peal. Päises on olek, tüüp, päevad ja „Broneerimiskood“. Nende all on ajad koos lennujaamade või jaamadega, lennufirma ja lennunumber. Sulgemiseks klõpsa päises „Sulge“.',
  'help.guide.transport-on-map.step.4':
    'Päevade kohal tööriistaribal olev marsruudiikoon toimib korraga kogu reisi kohta: „Näita kõiki broneeringute marsruute“ ja nende uuesti peitmiseks „Peida kõik broneeringute marsruudid“.',
  'help.guide.transport-on-map.step.5':
    'Planeeritud ühistranspordiühendusel pole oma marsruudiikooni. See joonistatakse päeva lülitiga „Marsruut“, nii et „Peida kõik broneeringute marsruudid“ ei peida seda, kuni selle päeva marsruut on sisse lülitatud.',
  'help.guide.transport-on-map.result':
    'Marsruudid kuvatakse kaardil, kummaski otsas marker, ja jäävad sinna, kuni need välja lülitad.',
  'help.guide.transport-on-map.tip.1':
    'Lend, kruiis ja praam joonistatakse kaarena. Auto, buss, takso ja jalgratas järgivad päris teid. Rong või planeeritud ühendus läbib jaamu, kus see peatub.',
  'help.guide.transport-on-map.tip.2':
    'Kinnitatud broneering on pidev joon, ootel broneering katkendjoon. Seade „Broneeringute marsruutide sildid“ näitab otsatähistel lennujaama koodi või jaama nime.',
  'help.guide.transport-on-map.tip.3':
    '„Näita kõiki broneeringute marsruute“ ei lisa juba näidatud marsruutidele midagi juurde: see asendab üksikute ikoonidega tehtud valikud. Pärast vajutamist on kõik marsruudid kas näha või peidetud.',
  // airtrail-import
  'help.guide.airtrail-import.title': 'Impordi lennud AirTrailist',
  'help.guide.airtrail-import.goal':
    'Too AirTrailis juba olevad lennud korraga reisile ja hoia neid edaspidi AirTraili kaudu ajakohasena.',
  'help.guide.airtrail-import.step.1':
    'Kui lisamoodul AirTrail on sisse lülitatud ja sinu instants on ühendatud jaotises „Seaded“, alajaotises „Integratsioonid“, on vahekaardi „Transport“ ribal nupu „Transport“ ees lennukiikoon „Impordi AirTrailist“. Klõpsa sellel.',
  'help.guide.airtrail-import.step.2':
    '„Impordi AirTrailist“ näitab sinu konto lende kahes rühmas. „Selle reisi ajal“ sisaldab reisi kuupäevadesse jäävaid lende, mis on juba märgitud. „Teised lennud“ sisaldab ülejäänuid, märkimata. Lend, mis on reisis juba olemas, on hall ja tähistatud sildiga „Imporditud“.',
  'help.guide.airtrail-import.step.3':
    'Iga rida on märkeruut lennufirma ja lennunumbri, kahe lennujaama ja kuupäevaga. Lennu kaasamiseks või väljajätmiseks klõpsa real. „Teised lennud“ all olevad lennud imporditakse ainult siis, kui need märgid.',
  'help.guide.airtrail-import.step.4':
    'Jätkulennud on rühmitatud: iga lend väljub ööpäeva jooksul lennujaamast, kuhu eelmine maandus. All olev märkeruut „Impordi ühe lennuna, vahemaandumisega selles lennujaamas“ on juba märgitud. Jäta see sisse, et saada üks vahemaandumisega broneering, või lülita välja, et importida lõigud eraldi lendudena.',
  'help.guide.airtrail-import.step.5':
    'Klõpsa paremas allnurgas nuppu, millel on märgitud lendude arv, näiteks „Impordi 2“. Seejärel ütleb teade, mitu lendu imporditi.',
  'help.guide.airtrail-import.step.6':
    'Lennud ilmuvad kaartidena jaotisse „Kinnitatud“, igaühel pealkirja kõrval sinine AirTraili märgis, ja ridadena päevadel, mil need toimuvad. Ümberistumisega lend on üks kaart ja selle marsruut läheb läbi vahemaandumiskoha.',
  'help.guide.airtrail-import.result':
    'AirTraili lennud on kaartidena vahekaardil „Transport“ ja ridadena oma päevadel, igaühel AirTraili märgis, mis näitab, kust see pärit on.',
  'help.guide.airtrail-import.tip.1':
    'Lend, mis on reisil juba sama numbri ja kuupäevaga, jäetakse vahele ja teade ütleb, mitu jäeti vahele. Päevade kohal tööriistaribal olev tagasivõtmise nool tühistab kogu impordi.',
  'help.guide.airtrail-import.tip.2':
    'Andmete peamiseks allikaks jääb AirTrail. TREK loeb selle muudatusi reisi avamisel ja taustal iga paari minuti järel. AirTrailis kustutatud lennu kaart jääb TREKi alles ja selle sildiks saab „Sünkroonimata“. TREKis tehtud muudatused saadetakse AirTraili tagasi ainult siis, kui jaotises „Integratsioonid“ on sisse lülitatud „Kirjuta muudatused AirTraili tagasi“.',
  'help.guide.airtrail-import.tip.3':
    'Ühendatud ühenduslend ei ole üks AirTraili lend, mida saaks sünkroonida, seega imporditakse see ühekordselt: sinine kiip jääb alles ja kui viid kursori kiibi kohale, öeldakse seda ka seal. Sama juhtub sünkroonitud lennuga, kui lisad sellele käsitsi peatuse.',
  // ── Screen: trip-bookings ─────────────────────────────────────────────────────────────
  'help.ctx.trip-bookings.title': 'Broneeringud',
  'help.ctx.trip-bookings.summary':
    'Sellel vahekaardil on kõik reisi jaoks broneeritu peale transpordi: majutus, lauad, piletid, ekskursioonid ja parkimine. Iga broneering on kaart, loendi rida või riba ajajoonel koos koodi, dokumentide, reisijate ja maksumusega. Üksikasjade avamiseks klõpsa broneeringul.',
  'help.ctx.trip-bookings.bullet.1':
    'Riba paremas otsas olev „Käsitsi broneering“ avab akna „Uus broneering“. Sellega saab luua kuut tüüpi broneeringuid: „Majutus“, „Restoran“, „Üritus“, „Ekskursioon“, „Parkimine“ ja „Muu“. Lennud, rongid ja muu transport on vahekaardil „Transport“ ega ilmu kunagi siia.',
  'help.ctx.trip-bookings.bullet.2':
    'Nupu „Käsitsi broneering“ ees olev allalaadimisikoon „Impordi broneeringukinnitused“ laadib kinnitused üles, et TREK saaks need automaatselt läbi lugeda: EML, PDF, PKPass, HTML või TXT, kuni viis faili, igaüks kuni 10 MB, ning fotod, kui tehisintellekti mudel oskab pilte lugeda. Ikoon on olemas ainult siis, kui server oskab neid lugeda.',
  'help.ctx.trip-bookings.bullet.3':
    'Otsing otsib pealkirjadest, tüüpidest, kohtadest, märkmetest, broneerimiskoodidest ja reisijatest. Selle kõrval olev lehter „Filtreeri“ kitsendab vahekaarti „Oleku“ ja „Tüübi“ järgi (iga tüübi juures on arv) ning, kui mõnes broneeringus on inimesed nimetatud, ka „Reisijate“ järgi. Lehtril olev arv näitab, mitu filtrit on sisse lülitatud.',
  'help.ctx.trip-bookings.bullet.4':
    'Filtri järel olevad kolm ikooni vahetavad vaadet: „Kaardid“, „Loend“ ja „Ajajoon“. Nende kõrval olevad liugurid „Vaate valikud“ rühmitavad ja sordivad kaarte ja loendit või määravad ajajoone rajad ning selle järel olev tabeliikoon „Ekspordi tabelina (CSV)“ laadib vahelehel näidatu failina alla. Vaikimisi on kaardid rühmitatud „Kinnitatud“ ja „Ootel“ alla ning loend päevade kaupa. Klõpsa jaotise pealkirjal, et see kokku panna.',
  'help.ctx.trip-bookings.bullet.5':
    'Kaardil on oleku järgi värvitud päis, kus on olekutäpp (klõps vahetab oleku „Ootel“ ja „Kinnitatud“ vahel), tüüp, pealkiri, pliiats ja prügikast. Selle all on broneeringu andmed: „Kuupäev“, „Aeg“, „Broneerimiskood“, „Sisseregistreerimine“ ja „Väljaregistreerimine“, „Asukoht / aadress“, „Majutus“, „Seotud“ (peatus plaanis), „Lingi“, „Märkmed“, „Reisijad“, „Failid“ ja seotud kulud.',
  'help.ctx.trip-bookings.bullet.6':
    'Klõps kaardil, real või ribal avab broneeringu üksikasjad, mille allosas on „Kaardil“ (kui broneeringul on koht), prügikast ja „Muuda“. Kustutamisel küsitakse üks kord („Kas kustutada broneering?“, mis ütleb, kas koos sellega kustutatakse ka kulud). Seejärel kustutatakse broneering koos seotud kuludega ja majutuse puhul eemaldatakse selle ööd päevaplaanist.',
  // booking-views
  'help.guide.booking-views.title': 'Vaheta vaadet ja ava broneering',
  'help.guide.booking-views.goal':
    'Vaata broneeringuid kaartidena, loendina või ajajoonel ja ava üks, et näha kõiki selle üksikasju.',
  'help.guide.booking-views.step.1':
    'Ribal „Filter“ järel olevad kolm ikooni on vaated ja igaüks näitab oma nime, kui viid kursori sellele: „Kaardid“, „Loend“ ja „Ajajoon“. Vaheleht avaneb vaates „Kaardid“, kus on iga broneeringu kohta kaart jaotistes „Kinnitatud“ ja „Ootel“. Klõpsa keskmisel, „Loend“.',
  'help.guide.booking-views.step.2':
    '„Loend“ näitab iga broneeringut eraldi real päeva pealkirja all, päev ja kellaaeg on paremal. Nooleklahvidega liigud reast reani. Klõpsa kolmest viimasel, „Ajajoon“.',
  'help.guide.booking-views.step.3':
    '„Ajajoon“ näitab broneeringuid reisi päevade lõikes: iga tüüp on oma real ja iga broneering on riba algusest lõpuni. Ootel broneeringul on katkendjoonega ääris. „Reis“ mahutab kogu reisi laiusesse. Klõpsa päeva pealkirjal, et näha seda päeva tundide kaupa.',
  'help.guide.booking-views.step.4':
    '„Päev“ näitab üht päeva tunniskaalal ja iga riba pikkus näitab selle kestust. Päeva nime kõrval olevad nooled viivad eelmisele ja järgmisele päevale. Reisi ajal hüppab „Täna“ tänasele päevale ja paremal olev lüliti „Reis“ ja „Päev“ viib tagasi kogu reisi juurde.',
  'help.guide.booking-views.step.5':
    'Vii kursor ribale, et näha selle päeva, kellaaegu ja kohta, ja klõpsa sellel, et broneeringu üksikasjad avada. Kaart vaates „Kaardid“ ja rida vaates „Loend“ avavad sama hüpikakna.',
  'help.guide.booking-views.step.6':
    'Üksikasjade vaate päises on pealkiri ja märgised oleku (klõps vahetab selle), tüübi, päeva ja broneerimiskoodi jaoks ning nupp, mis koodi kopeerib. Allpool on ajad paanidena, seejärel koht, reisijad, märkmed, kulud ja failid, kui broneeringul need on, ning päris all „Kaardil“, prügikast ja „Muuda“.',
  'help.guide.booking-views.result':
    'Broneering avaneb üksikasjavaates: „Muuda“ avab selle vormi, „Kaardil“ näitab seda plaanis ning „Sulge“ või Escape viib tagasi vaatesse, kust tulid.',
  'help.guide.booking-views.tip.1':
    '„Vaate valikud“, vaateikoonide järel olev liugurite ikoon, võimaldab vaateid „Kaardid“ ja „Loend“ rühmitada ja sortida valikutega „Rühmita“ ja „Sordi“. Vaates „Ajajoon“ pakub see valikuid „Iga tüüp eraldi real“ ja „Näita teist vahekaarti“. „Näita teist vahekaarti“ näitab vahekaardi „Transport“ kirjeid tuhmilt kitsal real üleval. „Lähtesta vaade“ taastab vaikeväärtused ja iga vahekaart jätab oma vaate selles brauseris meelde.',
  'help.guide.booking-views.tip.2':
    'Enne või pärast reisi toimuv või kuupäevata broneering ei saa ajajoonel olla. See on diagrammi all väikese kaardina jaotises „Enne reisi“, „Pärast reisi“ või „Kuupäevata“.',
  'help.guide.booking-views.tip.3':
    'Samad üksikasjad avanevad kõikjal, kus broneering on näha: vahekaardil „Transport“, päevaplaanis, päeva üksikasjades ja koha üksikasjades. Pealkirjal klõpsates saad broneeringu ümber nimetada.',
  // create-booking
  'help.guide.create-booking.title': 'Loo broneering',
  'help.guide.create-booking.goal': 'Lisa reisile käsitsi restoran, üritus, ekskursioon, parkimiskoht või midagi muud.',
  'help.guide.create-booking.step.1':
    'Klõpsa riba paremas otsas „Käsitsi broneering“. Avaneb „Uus broneering“, mille ülaosas on päis pealkirja ja kahe märgisega.',
  'help.guide.create-booking.step.2':
    'Klõpsa ülemisel ribal tüübisildil, millel on uue broneeringu puhul kirjas „Muu“, ja vali „Broneeringu tüüp“. Sellel vahekaardil saab luua kuut tüüpi: „Majutus“, „Restoran“, „Üritus“, „Ekskursioon“, „Parkimine“ ja „Muu“. Vorm muutub vastavalt valikule: ainult „Majutus“ kasutab kuupäevade asemel päevade vahemikku.',
  'help.guide.create-booking.step.3':
    'Kirjuta pealkiri ülemisele ribale, kiipide kohal olevale väljale. See on ainus kohustuslik väli ja „Lisa“ jääb halliks, kuni oled midagi sisestanud.',
  'help.guide.create-booking.step.4':
    'Määra „Kuupäev“ ja „Algusaeg“ ning, kui broneeringul on lõpp, „Lõppkuupäev“ ja „Lõpuaeg“. Kalendrites saab valida ainult reisi päevi. Lõppkuupäev ja -aeg, mis ei ole pärast algust, on punased ja takistavad nupu „Lisa“ kasutamist. Lõpuaeg, mis on enne algusaega, kui lõppkuupäeva pole, annab ainult hoiatuse: kui broneering lõpeb järgmisel päeval, määra lõppkuupäev.',
  'help.guide.create-booking.step.5':
    'Sisesta kinnituselt „Broneerimiskood“, seejärel klõpsa päises tüübi kõrval oleval olekusildil. Uue broneeringu puhul on seal „Ootel“ ja klõps muudab selle olekuks „Kinnitatud“. Olek määrab, millises jaotises kaart on.',
  'help.guide.create-booking.step.6': 'Klõpsa vormi allosas „Lisa“.',
  'help.guide.create-booking.result':
    'Broneering ilmub kaardina oma jaotisse. Päise värv näitab olekut ja kaardil on tüüp, kuupäev, kellaajad ja kood. Kõik teised reisil osalejad näevad seda kohe.',
  'help.guide.create-booking.tip.1':
    '„Asukoht / aadress“ pakub kirjutamise ajal päris aadresse. Kui valid ühe, asendab see sinu kirjutatu, ise sisestatud aadress jääb alles nii, nagu see on.',
  'help.guide.create-booking.tip.2':
    'Väljale „Lingi“ sisesta broneeringu enda leht teenusepakkuja juures. Kaardil ja üksikasjade vaates on see link, mis avaneb uuel vahekaardil.',
  'help.guide.create-booking.tip.3':
    'Märkmetes saab kasutada Markdowni, nii et loend või paksus kirjas rida kuvatakse kaardil ja üksikasjavaates loendi või paksu kirjana.',
  // booking-hotel
  'help.guide.booking-hotel.title': 'Broneeri majutus',
  'help.guide.booking-hotel.goal':
    'Sisesta majutus nii, et see läheb korraga arvesse nii broneeringuna kui ka öödena päevaplaanis.',
  'help.guide.booking-hotel.step.1':
    'Klõpsa „Käsitsi broneering“ ja vali ülemisel ribal tüübinupust „Majutus“. Kuupäevaväljade asemele ilmub hotelliväljade plokk.',
  'help.guide.booking-hotel.step.2':
    'Vali hotell jaotises „Majutus“. Loendis on reisi kohad, ilma imporditud radade ja retkedeta. Kui valid koha, läheb selle nimi tühja pealkirja ja aadress väljale „Asukoht / aadress“.',
  'help.guide.booking-hotel.step.3':
    'Määra „Alates“ ja „Kuni“: esimene öö ja hommik, mil lahkud. Mõlemas saab valida reisi päevi koos kuupäevadega ja TREK hoolitseb, et „Kuni“ oleks pärast „Alates“.',
  'help.guide.booking-hotel.step.4':
    'Täida väljad „Sisseregistreerimine“, „Sisseregistreerimine kuni“ ja „Väljaregistreerimine“ ning kinnituselt „Broneerimiskood“.',
  'help.guide.booking-hotel.step.5': 'Klõpsa „Lisa“.',
  'help.guide.booking-hotel.result':
    'Kaardil on „Kuupäev“ all päevade vahemik, sisse- ja väljaregistreerimise ajad ning aadress. Majutus on nüüd ka plaanis nendel päevadel.',
  'help.guide.booking-hotel.tip.1':
    '„Majutus“ on ainus tüüp, millel pole välju „Kuupäev“ ja „Algusaeg“. Selle kuupäevad on „Alates“ ja „Kuni“ ning valid reisi päevi, mitte kalendrikuupäevi.',
  'help.guide.booking-hotel.tip.2':
    'Jäta „Majutus“ tühjaks ja sisesta selle asemel aadress: koht otsitakse, luuakse ja märgitakse sinu eest kaardile.',
  'help.guide.booking-hotel.tip.3': 'Kui kustutad broneeringu, eemaldatakse päevaplaanist ka selle ööd.',
  // link-booking
  'help.guide.link-booking.title': 'Seo broneering plaaniga',
  'help.guide.link-booking.goal':
    'Seo broneering selle peatuse ja kohaga, et see oleks näha seal, kus sul seda vaja on.',
  'help.guide.link-booking.step.1':
    'Vii kursor kaardile, mida tahad siduda, ja klõpsa selle päises pliiatsit. Avaneb „Muuda broneeringut“.',
  'help.guide.link-booking.step.2':
    'Ava „Seo päevaplaani kirjega“. Loendis on sinu plaan: iga päeva pealkiri ja selle all selle päeva peatused, nummerdatult ja kellaaegadega. Vali peatus, mille juurde broneering kuulub.',
  'help.guide.link-booking.step.3':
    '„Koht / tegevus“ seob koha enda. Vali see sealt ning pealkiri ja „Asukoht / aadress“ täidetakse, kui need on tühjad.',
  'help.guide.link-booking.step.4': 'Klõpsa „Uuenda“.',
  'help.guide.link-booking.result':
    'Kaardil on jaotises „Seotud“ näha päev ja peatus ning broneering on päevaplaanis selle peatuse juures.',
  'help.guide.link-booking.tip.1':
    'Loendi ülaosas olev „Seoseta (eraldiseisev)“ eemaldab seose uuesti. Majutusel pole peatuse valijat: see seotakse oma ööde kaudu.',
  'help.guide.link-booking.tip.2':
    'Kui valid peatuse kuupäevaga päeval, täidetakse tühi väli „Kuupäev“ sinu eest. Juba määratud kuupäeva ei muudeta.',
  // booking-travelers
  'help.guide.booking-travelers.title': 'Määra, kellele broneering on',
  'help.guide.booking-travelers.goal':
    'Märgi, milliste reisijate jaoks broneering on, ja näita siis ainult nende broneeringuid.',
  'help.guide.booking-travelers.step.1':
    'Ava broneering selle kaardil oleva pliiatsiga. „Reisijad“ on välja „Broneerimiskood“ kõrval. Kuni broneeringule pole kedagi määratud, on seal kirjas „Määra reisijad“.',
  'help.guide.booking-travelers.step.2':
    'Klõpsa sellel ja vali inimesed, kellele broneering on; loendis on ka nimega külalised. Valitud inimesel on linnuke ja tema avatar ilmub väljale. Eemaldamiseks klõpsa nimel uuesti.',
  'help.guide.booking-travelers.step.3': 'Klõpsa „Uuenda“.',
  'help.guide.booking-travelers.step.4':
    'Klõpsa ribal „Filtreeri“: jaotises „Reisijad“ klõpsa inimesel, et näha ainult tema broneeringuid. Korraga võib sisse lülitada mitu.',
  'help.guide.booking-travelers.result':
    'Kaardil on loetletud inimesed, kellele broneering on, ja „Filtreeri“ kitsendab vahekaarti valitud inimeste broneeringutele.',
  'help.guide.booking-travelers.tip.1':
    'Kaardil ja üksikasjade vaates on reisijad ainult näha, seal ei saa neid muuta. Need määrad siin, vormis.',
  'help.guide.booking-travelers.tip.2':
    '„Reisijad“ ilmub filtrisse, kui reisil on rohkem kui üks liige ja vähemalt ühes broneeringus on keegi märgitud. Sinu valik kehtib, kuni sulged brauseri vahelehe.',
  // booking-files
  'help.guide.booking-files.title': 'Hoia vautšer broneeringu juures',
  'help.guide.booking-files.goal': 'Lisa kinnitus, pilet või pääsmik broneeringule, millega see on seotud.',
  'help.guide.booking-files.step.1':
    'Ava broneering selle kaardil oleva pliiatsiga. „Failid“ on „Lingi“ kõrval, klõpsa seal „Lisa fail“. Olemasoleva broneeringu puhul laaditakse dokument kohe üles ja TREK näitab teadet „Fail üles laaditud“.',
  'help.guide.booking-files.step.2': 'Dokument on loendis oma nimega, selle juures on avamisnupp ja kõrval X.',
  'help.guide.booking-files.step.3':
    '„Seo olemasolev fail“ pakub reisi dokumente, mis pole veel selle broneeringu juures. Vali üks ja see lisatakse ilma uuesti üles laadimata.',
  'help.guide.booking-files.step.4': 'Klõpsa „Uuenda“.',
  'help.guide.booking-files.result':
    'Kaardil ja üksikasjade vaates on dokumendid jaotises „Failid“. Klõpsa dokumendil, et see avada. Üksikasjade vaates loendi kohal olev „Näita failides“ viib sind vahelehele „Failid“.',
  'help.guide.booking-files.tip.1':
    'Kui broneering on alles loomisel, laaditakse dokument üles siis, kui klõpsad „Lisa“. Üleslaadimiseks on vaja ühendust.',
  'help.guide.booking-files.tip.2':
    'Dokumendi kõrval olev X eemaldab seose, mitte dokumenti. Dokument jääb reisi vahekaardile „Failid“.',
  'help.guide.booking-files.tip.3':
    'Milliseid failitüüpe saab lisada, määrab administraator jaotises „Lubatud failitüübid“. Vaikimisi on lubatud dokumendid, tekst ja pildid.',
  // booking-cost
  'help.guide.booking-cost.title': 'Broneeringu hinnast kulu tegemine',
  'help.guide.booking-cost.goal':
    'Lisa broneeringu maksumus jaotisse „Kulud“ ja jaga see nende vahel, kes selle eest maksavad.',
  'help.guide.booking-cost.step.1':
    'Ava broneering selle kaardil oleva pliiatsiga ja mine vormi lõppu. Jaotises „Kulud“ on „Loo kulu“ ja „Seo olemasolev kulu“ ning märkus „Salvestab broneeringu ja avab seejärel kulude redaktori“.',
  'help.guide.booking-cost.step.2':
    'Klõpsa „Loo kulu“. Broneering salvestatakse, selle vorm sulgub ja avaneb kulude redaktor pealkirjaga „Lisa kulu“.',
  'help.guide.booking-cost.step.3':
    'Päises on nimeks juba broneeringu pealkiri ja „Päev“ on juba broneeringu päev. Sisesta „Kogusumma“ ja kontrolli selle kõrval olevat „Valuuta“.',
  'help.guide.booking-cost.step.4':
    'Päises olev märgis on „Kategooria“, juba määratud broneeringu tüübile vastavaks. Vali jaotises „Kes maksis?“, kes maksis, ja jaotises „Jaotus“, kuidas summa jagatakse.',
  'help.guide.booking-cost.step.5': 'Klõpsa „Lisa kulu“.',
  'help.guide.booking-cost.result':
    'Kaardi allosas on summa, broneeringu vormis on kulu jaotises „Seotud kulud“ ja sama kulu on vahekaardil „Kulud“, seotuna selle broneeringuga.',
  'help.guide.booking-cost.tip.1':
    'Kategooria sõltub tüübist: „Restoran“ muutub kategooriaks „Söök ja jook“, „Majutus“ kategooriaks „Majutus“, „Parkimine“ kategooriaks „Parkimine“ ning „Üritus“ ja „Ekskursioon“ mõlemad kategooriaks „Muu“.',
  'help.guide.booking-cost.tip.2':
    'Broneeringul võib olla mitu kulu. „Seo olemasolev kulu“ pakub jaotisest „Kulud“ neid kulusid, mis pole veel millegagi seotud. Seotud kulu juures eemaldab „Eemalda seos, jäta kulu alles“ seose ja jätab kulu jaotisse „Kulud“, prügikast aga kustutab kulu.',
  'help.guide.booking-cost.tip.3':
    '„Kulud“ on vormis ainult siis, kui lisamoodul „Kulud“ on sisse lülitatud. Selle lülitab administraator jaotises „Lisamoodulid“.',
  // filter-bookings
  'help.guide.filter-bookings.title': 'Leia broneering',
  'help.guide.filter-bookings.goal': 'Filtreeri pikka vahekaarti sõna, oleku, tüübi või inimese järgi.',
  'help.guide.filter-bookings.step.1':
    'Kirjuta ribal olevale väljale „Otsi“. Otsitakse pealkirjadest, tüüpidest, kohtadest ja aadressidest, märkmetest, broneerimiskoodidest ja reisijate nimedest ning kirjutamise ajal jääb vahekaardile järjest vähem tulemusi. Escape tühjendab välja.',
  'help.guide.filter-bookings.step.2':
    'Klõpsa otsingu kõrval olevat lehtrit „Filtreeri“. Paneelis on „Olek“, „Tüüp“ ja, kui mõnele broneeringule on inimesi määratud, „Reisijad“.',
  'help.guide.filter-bookings.step.3':
    'Vali jaotises „Olek“ „Kinnitatud“ või „Ootel“, et näha ainult neid; „Kõik“ näitab mõlemaid.',
  'help.guide.filter-bookings.step.4':
    'Klõpsa jaotises „Tüüp“ ühel või mitmel tüübil, et jätta alles ainult need. Iga tüübi juures on broneeringute arv ja linnuke märgib valitud tüübid.',
  'help.guide.filter-bookings.step.5':
    'Nupul „Filtreeri“ olev arv näitab, mitu filtrit on sisse lülitatud, ja otsingu kõrval olev märgis näitab, mitu broneeringut kõigist alles jääb. Kõige uuesti nägemiseks klõpsa märgisel või paneeli allosas „Lähtesta filtrid“.',
  'help.guide.filter-bookings.result':
    'Vahekaart näitab ainult sinu valitut, nii vaates „Kaardid“, „Loend“ kui ka „Ajajoon“, ja filtrid jäävad selle reisi jaoks alles, kuni sulged brauseri vahekaardi.',
  'help.guide.filter-bookings.tip.1':
    '„Tüüp“ on näha ainult siis, kui vahekaardil on rohkem kui üks tüüp, ja see loetleb ainult vahekaardil olevaid tüüpe. Kui vahekaardil pole ühtegi ekskursiooni, pole jaotises „Tüüp“ valikut „Ekskursioon“.',
  'help.guide.filter-bookings.tip.2':
    'Kui filtrile ei vasta midagi, kuvatakse vahekaardil „Nende filtritega ei leitud midagi“ ja kohe selle all „Lähtesta filtrid“.',
  // import-booking-file
  'help.guide.import-booking-file.title': 'Impordi broneering kinnitusest',
  'help.guide.import-booking-file.goal':
    'Lase TREKil lugeda broneering teenusepakkuja saadetud e-kirjast või PDF-ist, et sa ei peaks seda uuesti sisestama.',
  'help.guide.import-booking-file.step.1':
    'Klõpsa ribal allalaadimisikooni „Impordi broneeringukinnitused“. Nimi ilmub, kui viid kursori ikoonile. Avaneb samanimeline aken.',
  'help.guide.import-booking-file.step.2':
    'Lohista kinnitused kasti või klõpsa kastil ja vali failid: EML, PDF, PKPass, HTML ja TXT, kuni viis faili, igaüks kuni 10 MB, ning fotod (JPG, PNG, WEBP), kui tehisintellekti mudel oskab pilte lugeda. Valitud failide nimed on kastis näha.',
  'help.guide.import-booking-file.step.3': 'Klõpsa „Impordi“. Aken sulgub kohe, sest lugemine toimub taustal.',
  'help.guide.import-booking-file.step.4':
    'Paremas allnurgas olev kaart näitab faili nime all edenemist. See jääb näha ka siis, kui liigud rakenduses mujale või laadid lehe uuesti. Kui lugemine on lõppenud, asendub „Failide töötlemine…“ linnukesega ja kaardil on nupp „Impordi“. Klõpsa sellel.',
  'help.guide.import-booking-file.step.5':
    'Iga leitud broneering avaneb üksteise järel juba täidetuna aknas „Uus broneering“. Hotelli puhul on see nimi pealkirjana ja, kui koht on reisil olemas, väljal „Majutus“, selle „Asukoht / aadress“, „Alates“ ja „Kuni“ vastavatel öödel, „Sisseregistreerimine“ ja „Väljaregistreerimine“, „Broneerimiskood“, kinnitus jaotises „Failid“ ning, kui „Kulud“ on sisse lülitatud, hind kui „Seotud kulu“. Kontrolli andmed üle ja klõpsa „Lisa“.',
  'help.guide.import-booking-file.result':
    'Broneering ilmub kaardina rühma „Ootel“ koos öö arvu, koodi ja jaotises „Failid“ oleva kinnitusega. Majutus kuvatakse plaanis nendel päevadel. Kui „Kulud“ on sisse lülitatud, lisatakse hind broneeringuga seotud kuluna.',
  'help.guide.import-booking-file.tip.1':
    'Impordiikooni näidatakse ainult siis, kui server oskab kinnitusi lugeda. Selleks on vaja kas ekstraktorit või lisamoodulit „Tehisintellektiga parsimine“. Administraator lülitab „Tehisintellektiga parsimine“ sisse jaotises „Lisamoodulid“. Vahekaardil, kus pole ühtegi broneeringut, on see ka nupuna „Impordi failist“.',
  'help.guide.import-booking-file.tip.2':
    'Kui midagi ei õnnestunud lugeda, annab kaart sellest teada. Kui „Tehisintellektiga parsimine“ on sees, pakub see nuppu „Proovi tehisintellektiga töötlemist“, mis saadab samad failid otse mudelile. Valmis tulemust hoitakse kümme minutit; alusta selle aja jooksul ülevaatamist.',
  'help.guide.import-booking-file.tip.3':
    'Kinnitus lisatakse ainult siis, kui selle failitüüp on administraatori seadetes loendis „Lubatud failitüübid“. PDF on vaikimisi lubatud. E-kiri ehk EML tuleb enne lisada, muidu salvestatakse broneering ilma kinnituseta.',
  // edit-booking
  'help.guide.edit-booking.title': 'Muuda broneeringut',
  'help.guide.edit-booking.goal':
    'Paranda kellaaega, lisa hiljem saabunud kood või vii broneering olekust „Ootel“ olekusse „Kinnitatud“.',
  'help.guide.edit-booking.step.1':
    'Vii kursor kaardile ja klõpsa selle päises pliiatsit. Avaneb „Muuda broneeringut“ kõigi broneeringu andmetega.',
  'help.guide.edit-booking.step.2':
    'Muuda seda, mis vaja, näiteks „Broneerimiskood“, mille teenusepakkuja hiljem saatis.',
  'help.guide.edit-booking.step.3':
    'Klõpsa ülemisel ribal kiibil „Ootel“. See muutub olekuks „Kinnitatud“ ja riba muutub roheliseks.',
  'help.guide.edit-booking.step.4': 'Klõpsa „Uuenda“.',
  'help.guide.edit-booking.result':
    'Kaart liigub: kinnitatud broneering ilmub jaotisse „Kinnitatud“ rohelise täpi ja rohelise ülemise ribaga ning kõik reisil osalejad näevad, kuidas see liigub.',
  'help.guide.edit-booking.tip.1':
    'Kui sa ei saa broneerimiskoodi lugeda, on jaotise „Seaded“ alajaotises „Üldine“ sisse lülitatud „Hägusta broneerimiskoodid“. Lugemiseks vii kursor koodile või klõpsa sellel.',
  'help.guide.edit-booking.tip.2':
    'Kui muudad tüüpi, muutub ka seotud kulu kategooria, välja arvatud siis, kui valisid kategooria kulude redaktoris käsitsi.',
  'help.guide.edit-booking.tip.3':
    'Broneeringu üksikasjade vaate alaosas olev „Muuda“ avab sama vormi. Olekut saab vahetada ka ilma vormita: klõpsa kaardil või real oleval täpil või üksikasjade vaates olekumärgisel.',
  // delete-booking
  'help.guide.delete-booking.title': 'Kustuta broneering',
  'help.guide.delete-booking.goal': 'Eemalda tühistatud broneering reisist.',
  'help.guide.delete-booking.step.1':
    'Vii kursor kaardile ja klõpsa selle päises prügikastil. Sama teeb broneeringu üksikasjade allosas olev prügikast.',
  'help.guide.delete-booking.step.2':
    '„Kas kustutada broneering?“ nimetab valitud broneeringu ja ütleb, et see kustutatakse jäädavalt. Kui sellega on seotud kulud, ütleb see, et ka need kustutatakse.',
  'help.guide.delete-booking.step.3': 'Klõpsa „Kustuta“.',
  'help.guide.delete-booking.result':
    'Kaart kustutatakse kõigi reisil osalejate jaoks. Broneeringu kustutamist ei saa tagasi võtta, nii et kinnitusküsimus on viimane võimalus loobuda.',
  'help.guide.delete-booking.tip.1':
    'Broneeringu kustutamisel eemaldatakse ka sellega seotud kulud. Majutuse kustutamisel eemaldatakse päevaplaanist ka selle ööd.',
  'help.guide.delete-booking.tip.2':
    'Lisatud dokumendid jäävad reisi vahekaardile „Failid“, eemaldatakse ainult nende seos broneeringuga.',

  // ── Screen: trip-lists ────────────────────────────────────────────────────────────────
  'help.ctx.trip-lists.title': 'Nimekirjad',
  'help.ctx.trip-lists.summary':
    'Kaks nimekirja ühe reisi jaoks: pakkimisnimekiri, kus on kirjas, kes mida kaasa võtab ja palju see kaalub, ning ülesannete nimekiri kõigest, mis on vaja teha enne reisi ja reisi ajal. Vahekaarti näidatakse, kui lisamoodul „Nimekirjad“ on sisse lülitatud.',
  'help.ctx.trip-lists.bullet.1':
    'Ülal oleval ribal olevad „Pakkimisnimekiri“ ja „Ülesanded“ vahetavad nende kahe vahel ja näitavad kummagi kirjete arvu; riba paremas otsas olevad nupud kuuluvad parajasti avatud nimekirjale.',
  'help.ctx.trip-lists.bullet.2':
    'Pakkimisnimekiri on jagatud nimekirjadeks, näiteks „Dokumendid“ või riided, mida võid nimetada, kuidas soovid. Iga nimekiri on kaart. Selle päises on pide, millega saad terve nimekirja teise kohta lohistada, värvitäpp, märk pakitud ja kõigi esemete arvuga, kolm täppi valikutega „Nimeta ümber“, „Märgi kõik“, „Eemalda kõik märgistused“ ja „Kustuta nimekiri“ ning nool, mis paneb kaardi kokku. Ülal ribal olev „Lisa nimekiri“ loob uue.',
  'help.ctx.trip-lists.bullet.3':
    'Real on lohistamispide, märkeruut ja nimi, seejärel väike avatar inimesest, kes eseme kaasa võtab. Kui eseme kogus on üle ühe, on sellel ka pakitud tükkide loendur, näiteks 3/10, koos miinuse ja plussiga. Edasi tulevad kogus väikese märgina ja, kui „Kottide haldus“ on sees, kaal grammides ja kotiring, seejärel prügikast ja kolme täpiga menüü valikutega „Teisalda nimekirja“, „Jagamine“, „Nimeta ümber“ ja „Kustuta“. Juhtnupud, mida rida ei kasuta, on tuhmid, kuni viid kursori nende kohale.',
  'help.ctx.trip-lists.bullet.4':
    '„Jagatud“ ja „Minu nimekiri“ jagavad pakkimisnimekirja kaheks: nimekiri, mida näevad kõik, ja sinu enda oma. Nende kõrval olevad „Kõik“, „Avatud“ ja „Valmis“ kitsendavad parasjagu avatud nimekirja. Rea paremas otsas olev „A kuni Ü“ näitab iga nimekirja esemeid nime järgi ja teine klõps taastab sinu enda järjekorra. Ülal olev edenemiskaart näitab, kui palju on pakitud.',
  'help.ctx.trip-lists.bullet.5':
    '„Rakenda mall“ ja „Salvesta mallina“ täidavad nimekirja või salvestavad selle, nii et sa ei pea seda käsitsi kirjutama. Nende järel olevad kaks ikooni, „Ekspordi“ ja „Impordi“, ekspordivad nimekirja väljatrükina, PDF-ina või failina ja impordivad nimekirja. Edenemiskaardi paremas otsas olev punane nupp näitab, mitu eset on märgitud, ja eemaldab need.',
  'help.ctx.trip-lists.bullet.6':
    '„Ülesanded“ on oma külgribaga: edenemiskaart, filtrid „Kõik“, „Minu ülesanded“, „Üle tähtaja“ ja „Valmis“, iga nimekirja kohta üks rida ning nende all „Lisa nimekiri“. Ülesanded on kaardil, mille päises on filtri nimi ja sortimisjärjekord, „Tähtsus“ või „Tähtaeg“. Klõpsa ülesandel, et see paremal paanil avada. Ribal olev „Lisa uus ülesanne“ avab akna „Uus ülesanne“.',
  // packing-categories
  'help.guide.packing-categories.title': 'Koosta pakkimisnimekiri',
  'help.guide.packing-categories.goal':
    'Jaga kaasavõetav nimekirjadesse, lisa neisse esemeid ja vali, kes iga nimekirja eest vastutab.',
  'help.guide.packing-categories.step.1':
    'Klõpsa nimekirjade kohal oleval ribal „Lisa nimekiri“. Avaneb väike aken. Kirjuta nimi selle ülemisele ribale, kus on kirjas „Nimekirja nimi (nt Riided)“, ja klõpsa „Lisa“.',
  'help.guide.packing-categories.step.2':
    'Uues nimekirjas on alguses kohatäiterida, millel on ainult kolm kahvatut punkti. Klõpsa rea allosas „Lisa kirje“, kirjuta ese väljale „Eseme nimi...“ ja vajuta Enter: esimene ese asendab kohatäite ja väli jääb järgmise jaoks avatuks.',
  'help.guide.packing-categories.step.3':
    'Nimeta rida ümber, klõpsates selle nimel, või rea paremas otsas oleva kolme täpi menüüs valikuga „Nimeta ümber“.',
  'help.guide.packing-categories.step.4':
    'Nimekirja ülemisel ribal olev katkendjoonega ring, milles on inimese kujutis, määrab nimekirjale reisi liikmeid. Vali nimi. Kui tahad selle inimese uuesti eemaldada, klõpsa ilmunud nimesildil.',
  'help.guide.packing-categories.step.5':
    'Arvu kõrval olevad kolm punkti avavad veel valikuid: „Nimeta ümber“, „Märgi kõik“, „Eemalda kõik märgistused“ ja „Kustuta nimekiri“. „Kustuta nimekiri“ kustutab nimekirja koos kõigi esemetega uuesti küsimata. Päris paremal olev nool ahendab nimekirja.',
  'help.guide.packing-categories.result':
    'Uus nimekiri ilmub ruudustikku koos esemete ja värvitäpiga ning selle märk näitab, kui palju on juba pakitud.',
  'help.guide.packing-categories.tip.1':
    'Nimekiri on olemas ainult oma esemete kaudu. Kui kustutad viimase eseme, muutub rida kohatäiteks, et nimekiri säilitaks oma koha ja värvi. Kui kustutad ka selle rea, kustutatakse nimekiri.',
  'help.guide.packing-categories.tip.2':
    'Kui määrad kellegi nimekirjale, saab ta pakkimisteavituse. See ei muuda, kes esemeid näeb. Seda määrab rea kolme punkti menüüs valik „Jagamine“.',
  'help.guide.packing-categories.tip.3':
    'Kahel nimekirjal võib olla sama nimi. TREK hoiab neid sisemiselt lahus, nii et nimed jäävad täpselt selliseks, nagu need kirjutasid.',
  // check-off-packing
  'help.guide.check-off-packing.title': 'Asjade ärämärkimine pakkimise ajal',
  'help.guide.check-off-packing.goal': 'Märgi, mis on kotis, jälgi edenemisriba ja eemalda pakitud esemed.',
  'help.guide.check-off-packing.step.1':
    'Klõpsa rea vasakus servas oleval ruudul. Nimi kriipsutatakse läbi ja edenemisriba uueneb.',
  'help.guide.check-off-packing.step.2':
    'Nimekirjade kohal olev edenemiskaart näitab, mitu eset nimekirja kõigist esemetest on pakitud, arvu, protsendi ja ribana.',
  'help.guide.check-off-packing.step.3':
    'Terve nimekirja korraga märkimiseks: selle päises olevate kolme punkti all on „Märgi kõik“ ja „Eemalda kõik märgistused“.',
  'help.guide.check-off-packing.step.4':
    'Valikute „Jagatud“ ja „Minu nimekiri“ kõrval olevad „Kõik“, „Pakkimata“ ja „Pakitud“ filtreerivad ruudustikku. „Pakkimata“ näitab ainult seda, mis veel puudub, nii et täiesti pakitud nimekiri peidetakse.',
  'help.guide.check-off-packing.step.5':
    'Edenemiskaardi paremas otsas olev punane nupp „Eemalda … märgitud“, millel on märgitud esemete arv, kustutab need kõik korraga pärast üht brauseri kinnitust.',
  'help.guide.check-off-packing.result':
    'Loendis on ainult pakkimata esemed ja ülal olev riba näitab, kui suur osa pakkimisest on tehtud.',
  'help.guide.check-off-packing.tip.1': 'Märgitud eset saab ikka ümber nimetada: klõpsa selle nimel.',
  'help.guide.check-off-packing.tip.2':
    '„Märgi kõik“ ja „Eemalda kõik märgistused“ toimivad korraga ühe nimekirjaga, selle nimekirja enda kolme punkti menüüst.',
  'help.guide.check-off-packing.tip.3':
    'Kui kõik esemed on märgitud, asendub loendur tekstiga „Kõik on pakitud!“ ja riba muutub roheliseks.',
  // apply-packing-template
  'help.guide.apply-packing-template.title': 'Rakenda pakkimismall',
  'help.guide.apply-packing-template.goal':
    'Lisa reisile valmis nimekiri ja salvesta selle reisi nimekiri järgmiseks reisiks.',
  'help.guide.apply-packing-template.step.1': 'Klõpsa nimekirja kohal oleval ribal „Rakenda mall“.',
  'help.guide.apply-packing-template.step.2': 'Vali mall. Igal real on malli nimi ja selles olevate esemete arv.',
  'help.guide.apply-packing-template.step.3':
    'Esemed lisatakse vaatesse, kus parasjagu oled: „Jagatud“ lisab need ühisesse nimekirja, mida näevad kõik, „Minu nimekiri“ sinu enda nimekirja.',
  'help.guide.apply-packing-template.step.4':
    'Kui tahad selle reisi nimekirja järgmiseks reisiks alles hoida, klõpsa „Salvesta mallina“. Avaneb väike aken. Kirjuta nimi ülemisele väljale, kus on näha „Malli nimi“, ja klõpsa „Salvesta“.',
  'help.guide.apply-packing-template.result': 'Malli nimekirjad ja esemed lisatakse reisile olemasolevate kõrvale.',
  'help.guide.apply-packing-template.tip.1':
    'Mall kopeerib iga eseme nimekirja, koguse, kaalu ja koti ning loob koti, mida reisil veel pole. Märkeid ei kopeerita ja nimekirjast ei eemaldata midagi.',
  'help.guide.apply-packing-template.tip.2':
    '„Rakenda mall“ on olemas alles siis, kui mõni mall on loodud. Ilma mallita nuppu üldse ei näidata.',
  'help.guide.apply-packing-template.tip.3':
    '„Salvesta mallina“ on näha ainult instantsi administraatorile ja ainult siis, kui nimekirjas on esemeid. See salvestab jagatud esemed ja sinu enda esemed, mitte kunagi teise liikme privaatseid esemeid.',
  // import-packing-list
  'help.guide.import-packing-list.title': 'Kleebi terve pakkimisnimekiri',
  'help.guide.import-packing-list.goal': 'Muuda mujal olemas olev nimekiri korraga pakkimisesemeteks.',
  'help.guide.import-packing-list.step.1':
    'Klõpsa nimekirja kohal oleva riba paremas otsas allanoolega ikoonil „Impordi“.',
  'help.guide.import-packing-list.step.2':
    'Üks ese rea kohta: kategooria, nimi, kaal grammides (valikuline), kott (valikuline), checked/unchecked (valikuline). Kastis olev hall näidis näitab kõiki nelja vormingut ja vasakus servas olevad numbrid loendavad sinu kirjutatud ridu. Sobib ka Markdowni loend: pealkiri annab nimekirjale nime ning "- [ ]" ja "- [x]" muutuvad esemeteks.',
  'help.guide.import-packing-list.step.3':
    'Või laadi read failist akna vasakus allnurgas oleva nupuga „Laadi CSV/TXT/MD“. See võtab vastu .csv-, .txt- või .md-faili ja asendab kogu kasti sisu.',
  'help.guide.import-packing-list.step.4':
    'Klõpsa paremas allnurgas „Impordi 3“. Nupul olev number näitab, mitu rida TREK ära tundis.',
  'help.guide.import-packing-list.result':
    'Igast reast saab kirje nimekirjas, mille nimi on rea esimesel väljal. Olemasolevad esemed ei muutu.',
  'help.guide.import-packing-list.tip.1':
    'Välju eraldavad nii komad, semikoolonid kui ka tabulaatorid ning jutumärgid hoiavad välja koos, nii et "Särk, sinine" jääb üheks nimeks. Ühe väärtusega rida on lihtsalt nimi. Rida, millel pole oma nimekirja, läheb nimekirja „Muu“. "3x" nime ees määrab koguse.',
  'help.guide.import-packing-list.tip.2':
    'Kui reisil pole veel neljandal väljal nimetatud kotti, loob TREK selle. Import ja „Rakenda mall“ on kaks viisi, kuidas lisada kaalud ja kotid korraga paljudele esemetele.',
  // export-packing-list
  'help.guide.export-packing-list.title': 'Prindi või ekspordi pakkimisnimekiri',
  'help.guide.export-packing-list.goal':
    'Prindi nimekiri, salvesta see PDF-ina või ekspordi failina teise rakenduse või järgmise reisi jaoks.',
  'help.guide.export-packing-list.step.1':
    'Klõpsa „Ekspordi“, ülesnoolega ikooni nimekirja kohal oleval ribal, kohe „Impordi“ ees.',
  'help.guide.export-packing-list.step.2':
    '„Markdowni kontrollnimekiri (.md)“ ja „CSV importimiseks (.csv)“ salvestavad nimekirja kohe failina.',
  'help.guide.export-packing-list.step.3':
    'Klõpsa „Prindi või salvesta PDF-ina“. Eelvaade näitab nimekirja lehena: üleval reis, selle kuupäevad ja kui palju on pakitud, seejärel iga nimekiri kaardina ja iga ese märkeruuduga.',
  'help.guide.export-packing-list.step.4':
    'Klõpsa eelvaate all „Prindi või salvesta PDF-ina“. Brauser avab printimisakna: vali printer või faili salvestamiseks „Salvesta PDF-ina“.',
  'help.guide.export-packing-list.result':
    'Väljatrükk ja failid sisaldavad parajasti avatud vaadet, „Jagatud“ või „Minu nimekiri“, koos koguste, kaalude ja linnukestega.',
  'help.guide.export-packing-list.tip.1':
    'CSV on vorming, mida „Impordi“ loeb, kotid kaasa arvatud, nii et saad seda kasutada oma pakkimismallina: impordi see järgmisse reisi.',
  'help.guide.export-packing-list.tip.2':
    'Markdowni fail avaneb Obsidianis, Notionis või GitHubis kontrollnimekirjana ja saad selle nupuga „Impordi“ uuesti importida.',
  // share-packing-item
  'help.guide.share-packing-item.title': 'Otsusta, kes eset näeb ja kes selle kaasa võtab',
  'help.guide.share-packing-item.goal':
    'Tõsta ese grupi ühisvara, oma nimekirja ja nende inimeste vahel, kellele selle kaasa võtad.',
  'help.guide.share-packing-item.step.1':
    'Nimekirjade kohal on „Jagatud“ nimekiri, mida kõik näevad, ja „Minu nimekiri“, mis on sinu oma. Mõlema juures on esemete arv. Oma nimekirja nägemiseks klõpsa „Minu nimekiri“.',
  'help.guide.share-packing-item.step.2':
    'Mine tagasi vaatesse „Jagatud“, ava rea lõpus kolm punkti ja klõpsa „Jagamine“.',
  'help.guide.share-packing-item.step.3':
    'Tasemeid on kolm: „Jagatud“, mida näevad kõik grupis; „Isiklik“, mida näed ainult sina; ning „Jagatud kasutajatega…“, kus valid inimesed, kellele ese on mõeldud.',
  'help.guide.share-packing-item.step.4':
    '„Isiklik“ ese on ainult vaates „Minu nimekiri“. Selle leidmiseks lülitu vaatele „Minu nimekiri“.',
  'help.guide.share-packing-item.step.5':
    'Ava uuesti „Jagamine“ ja märgi jaotises „Jagatud kasutajatega…“ nimi. Ese ilmub ka selle inimese nimekirja ja reale tekib väike märk, mis näitab, mitme inimesega seda jagatakse.',
  'help.guide.share-packing-item.result': 'Ese on valitud tasemel ja realt näeb, kes selle kaasa võtab.',
  'help.guide.share-packing-item.tip.1':
    'Eseme jagamist saab muuta ainult see, kes selle kaasa võtab. Inimene, kellega seda jagasid, näeb seda oma vaates „Minu nimekiri“ väikese käe märgiga, mis näitab kursori peale viimisel sinu nime. Ta saab eseme ära märkida.',
  'help.guide.share-packing-item.tip.2':
    'Jagatud eseme puhul, mille võtab kaasa keegi teine, on kolme punkti menüüs valiku „Jagamine“ asemel kaks muud valikut: „Võin selle ka kaasa võtta“, mis lisab sind tema kõrvale, ja „Kopeeri minu nimekirja“, mis teeb sulle privaatse koopia.',
  'help.guide.share-packing-item.tip.3':
    'Uued esemed saavad jagamisseade sellest vaatest, kus need lisad. Vaates „Jagatud“ lisatud esemed jagatakse kõigiga. Vaates „Minu nimekiri“ lisatud esemed on „Isiklik“, välja arvatud siis, kui selle nimekirja kõik esemed on jagatud samade inimestega: siis jagatakse uus ese ka nendega.',
  // packing-bags
  'help.guide.packing-bags.title': 'Kaalu kotid',
  'help.guide.packing-bags.goal':
    'Lisa igale esemele kaal, jaga esemed kottidesse ja hoia iga kott lennufirma piirangu piires.',
  'help.guide.packing-bags.step.1': 'Klõpsa ringi ees oleval kaalumärgil ja sisesta eseme kaal grammides.',
  'help.guide.packing-bags.step.2': 'Kaalu järel olev ring on eseme kott. Klõpsa sellel.',
  'help.guide.packing-bags.step.3':
    'Kui kotti veel pole, klõpsa „Lisa kott“, kirjuta nimi ja vajuta Enter. Kott luuakse ja ese pannakse sinna.',
  'help.guide.packing-bags.step.4':
    'Kaart „Kotid“ ilmub nimekirjadest paremale kohe, kui on olemas vähemalt üks kott. Iga koti juures on nimi, kes seda kannab, täituvuse riba, esemete arv ja kaal. Kottide all on „Määramata“ ja „Kogukaal“ ning selle all „Pakitud“: juba pakitud kaal ja õhuke riba selle osakaalu jaoks.',
  'help.guide.packing-bags.step.5':
    'Klõpsa koti kaalu kõrval „Määra piirang“ ja sisesta piirang kilogrammides, nagu lennufirmad selle annavad.',
  'help.guide.packing-bags.step.6':
    'Koti nimerea lõpus vahetult risti ees olev katkendliku joonega pluss avab akna „Määra liikmed“. Märgi liikmed, kes kotti kannavad: nad ilmuvad plussi kõrvale ja kaardi allosas olev „Inimese kohta“ näitab, mida igaüks kannab.',
  'help.guide.packing-bags.result':
    'Paremal olev kaart „Kotid“ näitab iga koti kaalu võrreldes selle piiranguga, seda, mis pole üheski kotis, mida iga inimene kannab, ning kogukaalu koos pakitud osaga.',
  'help.guide.packing-bags.tip.1':
    'Kaaluväli, koti ring ja kaart „Kotid“ on olemas ainult siis, kui administraator on lisamooduli „Nimekirjad“ all sisse lülitanud „Kottide halduse“. Kitsamas aknas avanevad kotid hoopis edenemiskaardi kohal olevast nupust „Kotid“.',
  'help.guide.packing-bags.tip.2':
    'Server arvutab koti kaalu kõigi liikmete esemete põhjal, ka nende, mida sa ei näe, nii et number on koti tegelik kaal.',
  'help.guide.packing-bags.tip.3':
    'Piiranguta kotti võrreldakse kõige raskema kotiga, nii et ribasid saab omavahel võrrelda. Kui annad kotile piirangu, mõõdetakse selle riba hoopis selle piirangu järgi.',
  // create-todo
  'help.guide.create-todo.title': 'Lisa ülesanne',
  'help.guide.create-todo.goal': 'Pane ülesanne kirja koos nimekirja, tähtsuse, kuupäeva ja vastutajaga.',
  'help.guide.create-todo.step.1': 'Klõpsa riba paremas otsas „Lisa uus ülesanne“.',
  'help.guide.create-todo.step.2':
    'Avaneb aken „Uus ülesanne“, kursor on selle päises. Kirjuta nimi väljale „Ülesande nimi“ ja lisa väljale „Kirjeldus“ kõik, mida tahad meeles pidada.',
  'help.guide.create-todo.step.3':
    '„Nimekiri“ rühmitab ülesande. Vali üks või kasuta selle kõrval olevat plussi, et väikeses aknas uus nimekiri luua.',
  'help.guide.create-todo.step.4': '„Tähtsus“ on nelja nupuga: „Puudub“, P1, P2 ja P3, punasest siniseni.',
  'help.guide.create-todo.step.5':
    'Välja „Loend“ kõrval olev „Tähtaeg“ avab kalendri ja „Vastutaja“ määrab ülesande kellelegi.',
  'help.guide.create-todo.step.6': 'Klõpsa „Loo ülesanne“.',
  'help.guide.create-todo.result':
    'Ülesanne on nimekirjas: tähtsus, tähtaeg ja nimekiri märkidena ning vastutaja avatar rea lõpus. See avaneb paremal paanil.',
  'help.guide.create-todo.tip.1': 'Kohustuslik on ainult nimi. Kõik muu saad hiljem täita paremal paanil.',
  'help.guide.create-todo.tip.2': 'Kui külgribal on mõni nimekiri valitud, lisatakse uus ülesanne sellesse nimekirja.',
  'help.guide.create-todo.tip.3': 'Enter nimeväljal loob ülesande kohe, teisi välju puutumata.',
  // todo-filters
  'help.guide.todo-filters.title': 'Leia ja muuda ülesannet',
  'help.guide.todo-filters.goal': 'Näita ainult praegu olulisi ülesandeid ja muuda siis leitud ülesannet.',
  'help.guide.todo-filters.step.1':
    'Külgriba jaotis „Ülesanded“: „Kõik“ näitab kõike, mis on veel tegemata, „Minu ülesanded“ sulle määratud ülesandeid, „Üle tähtaja“ möödunud kuupäevaga ülesandeid ja „Valmis“ lõpetatud ülesandeid. Igaühe juures on nende arv. Klõpsa „Üle tähtaja“.',
  'help.guide.todo-filters.step.2':
    'Jaotises „Nimekirjad“ on iga nimekirja kohta üks rida. Vali üks, et näha seda nimekirja koos lõpetatud ülesannetega.',
  'help.guide.todo-filters.step.3':
    'Nimekirja ülaosas olev sortimine muudab ekraanil oleva järjekorda: „Tähtsus“ paneb ette P1, „Tähtaeg“ paneb ette lähima tähtaja. Korraga saab kasutada ainult üht neist ja teine klõps taastab sinu enda järjekorra.',
  'help.guide.todo-filters.step.4': 'Klõpsa ülesandel, et see paremal paanil avada.',
  'help.guide.todo-filters.step.5':
    'Muuda, mida vaja: nime, „Tähtsus“, „Nimekiri“, „Tähtaeg“ või „Vastutaja“. „Kirjeldus“ näitab teksti koos töötavate linkidega; muutmiseks klõpsa selle sees. Seejärel klõpsa paani allosas „Salvesta muudatused“. Paani päises olev kast märgib ülesande tehtuks ja „Salvesta muudatused“ kõrval olev „Kustuta“ kustutab selle kohe.',
  'help.guide.todo-filters.result':
    'Loendis on ainult soovitud ülesanded ja paremal paanil saad valitud ülesannet muuta.',
  'help.guide.todo-filters.tip.1':
    'Nimekirja rida loeb ainult avatud ülesandeid, kuid kui selle valid, on näha ka lõpetatud ülesanded. „Kõik“, „Minu ülesanded“ ja „Üle tähtaja“ peidavad lõpetatud ülesanded, „Valmis“ näitab ainult lõpetatud ülesandeid.',
  'help.guide.todo-filters.tip.2':
    'Sortimisel ei saa „Tähtsus“ ja „Tähtaeg“ korraga kasutada. Kui kumbki neist on sees, ei saa ridu lohistades oma järjekorda panna.',

  // ── Screen: trip-costs ────────────────────────────────────────────────────────────────
  'help.ctx.trip-costs.title': 'Kulud',
  'help.ctx.trip-costs.summary':
    'Reisi rahaasjad: kõik kulud kuupäevaga pearaamatus või tabelis, kes need sisestas ja kes nende eest võlgneb, kviitungi valuutas. Parempoolne veerg näitab, kes peab kellele maksma, et arved klaarida.',
  'help.ctx.trip-costs.bullet.1':
    'Ülemisel ribal on näha reisi kuupäevad ja reisijad, kelle vahel kulud jagatakse. Seal on ka „Otsi kulusid…“, „Filtreeri“ (lehter), „Ekspordi CSV“ (allalaadimisikoon) ja lüliti „Loend / Tabel“.',
  'help.ctx.trip-costs.bullet.2':
    'Riba paremas otsas registreerib „Arvelda“ korraga kõik tasumata ülekanded, „Skanni kviitung“ täidab kulu foto põhjal, kui lisamoodul „Tehisintellektiga parsimine“ oskab pilte lugeda, ja „Lisa kulu“ avab redaktori.',
  'help.ctx.trip-costs.bullet.3':
    'Riba all on neli kaarti: „Sina võlgned“ ja „Sulle võlgnetakse“ näitavad sinu poolt arveldusest, „Tasumata summa“ on see, mis on kirja pandud, kuid millel pole veel maksjat, ja „Reisi kogukulu“ liidab kõik kokku, selle all „Sinu osa“ ja „Sina maksid“.',
  'help.ctx.trip-costs.bullet.4':
    'Pearaamat on rühmitatud päevade kaupa, uusimad eespool, ja iga päeva päises on kirjete arv ning sel päeval kulutatud summa. Real on kategooria värvilise sakina, nimi, maksjate sildid koos igaühe makstud summaga ja nende all „Jaotus“ iga reisija osaga (linnuke tähistab, kes on oma osa maksnud), seejärel märkus ja summa ning lisaks „laenasid välja“ või „võtsid laenu“, kui jaotuse järgi võlgnevad teised sulle või sina neile.',
  'help.ctx.trip-costs.bullet.5':
    'Parempoolses veerus on tulemused: „Arvelda“ näitab, kes kellele maksab, „Saldod“ iga reisija ülejääki või puudujääki, „Lõplik eelarve“ seda, kui palju reis igaühele maksab, ja „Kategooriate kaupa“ seda, mille peale raha kulus.',
  'help.ctx.trip-costs.bullet.6':
    'Registreeritud makse on samas pearaamatus eraldi reana, kõrval pliiats ja „Võta tagasi“. Kulul on pliiats ja prügikast ning prügikast küsib enne kulu kustutamist kinnitust. Kviitungitega kulu nime kõrval on silt „Kviitung“, mis need avab.',
  'help.ctx.trip-costs.bullet.7':
    'Riba nupp „Tabel“ näitab samu kulusid tabelina, kategooriate kaupa rühmitatult, veergudega „Inimesi“ ja „Päevad“ ning summaga inimese ja päeva kohta. „Kokkuvõte“ asendab siis vaate „Kategooriate kaupa“. „Kulud“ jätab valitud vaate meelde.',
  // add-expense
  'help.guide.add-expense.title': 'Lisa kulu',
  'help.guide.add-expense.goal': 'Pane kirja, kui palju miski maksis, kes maksis ja kellega kulu jagatakse.',
  'help.guide.add-expense.step.1':
    'Klõpsa riba paremas otsas „Lisa kulu“. Avaneb redaktor: kuupäevaks on täna, maksjaks sina ja jaotuses on juba kõik.',
  'help.guide.add-expense.step.2':
    'Kirjuta akna ülaosas olevale väljale, mille eest kulu oli. Kui väli on tühi, on seal näha „Nt õhtusöök, suveniirid, kütus…“. See on kulu nimi ja ilma selleta ei saa kulu salvestada.',
  'help.guide.add-expense.step.3':
    'Nime all olev märgis on „Kategooria“, vaikimisi „Söök ja jook“, kuni valid mõne muu. Kategooriaid on neliteist ja neid ei saa muuta. Päis võtab valitud kategooria värvi, samuti rea sakk ja selle riba jaotises „Kategooriate kaupa“.',
  'help.guide.add-expense.step.4':
    'Sisesta kviitungil olev summa väljale „Kogusumma“. Selle kõrval olev „Valuuta“ on alguses see valuuta, milles „Kulud“ on näidatud. Kui seda muudad, näitab redaktor teisendatud summat. „Päev“ on alguses täna ja loendis rühmitatakse kulu selle päeva alla.',
  'help.guide.add-expense.step.5':
    'Klõpsa jaotises „Kes maksis?“ inimesel, kes tegelikult maksis. Vaikimisi on valitud „Sina“. „Keegi pole veel maksnud“ salvestab summa, ilma et keegi selle eest võlgu jääks, ja pealkirja kõrval oleva lüliti valik „Maksjaid oli mitu“ jagab arve mitme maksja vahel.',
  'help.guide.add-expense.step.6':
    'All olev „Jaotus“ on alguses „Võrdselt“, kõik on märgitud ja iga osa on nime kõrval. Jäta see nii või muuda. Salvestamiseks klõpsa akna allosas „Lisa kulu“.',
  'help.guide.add-expense.result':
    'Kulu on pearaamatus oma päeva all, see on arvestatud „Reisi kogukulu“ hulka ja arvelduse veerg on uuesti arvutanud, kes kellele võlgneb.',
  'help.guide.add-expense.tip.1':
    'Kui vaikeväärtusi ei muuda, on kulu tänase kuupäevaga, maksjaks oled sina ja see jagatakse kõigi vahel võrdselt: täita tuleb ainult nimi ja summa.',
  'help.guide.add-expense.tip.2':
    'Summa kõrval olev ± muudab kulu tagasimakseks. Negatiivne kogusumma tähendab, et raha makstakse tagasi, ja jaotus pööratakse ümber.',
  'help.guide.add-expense.tip.3':
    'Dialoogi allosas jaotise „Kviitungid ja arved“ kõrval olev „Lisa“ võtab vastu pilte ja PDF-e. Need laaditakse üles salvestamisel ja salvestatakse reisi jaotisse „Failid“ ning loendis ilmub nime kõrvale silt „Kviitung“.',
  // expense-payers
  'help.guide.expense-payers.title': 'Määra, kes maksis',
  'help.guide.expense-payers.goal': 'Pane kirja, kes kulu eest maksis. See on arvelduse arvutuse teine pool.',
  'help.guide.expense-payers.step.1':
    'Ava kulu selle rea kõrval oleva pliiatsiga ja vaata jaotist „Kes maksis?“. Pealkirja kõrval oleval lülitil on vaikimisi „Maksja oli üks“: iga reisija on kiip ja ääristatud kiip on see, kes maksis. Muutmiseks klõpsa teisel kiibil.',
  'help.guide.expense-payers.step.2':
    '„Keegi pole veel maksnud“, reisijate järel olev katkendjoonega kiip, salvestab summa, ilma et keegi midagi võlgneks. Kulu läheb siiski arvesse „Reisi kogukulu“ sisse.',
  'help.guide.expense-payers.step.3':
    'Sama lüliti teine valik, „Maksjaid oli mitu“, loetleb kõik reisijad koos märkeruuduga ja igale märgitud inimesele ilmub summaväli. Märgi maksjad ja sisesta, kui palju igaüks maksis; summad peavad kokku andma kogusumma.',
  'help.guide.expense-payers.step.4':
    'Kulu, mille eest keegi pole maksnud, on real märgitud kui „Lõpetamata“ ja see arvestatakse kaardile „Tasumata summa“, mis liidab kokku kulud, millel pole veel maksjat.',
  'help.guide.expense-payers.result':
    'Maksja määrab, kes saab raha tagasi, jaotus määrab, kes maksab, ja „Saldod“ on nende kahe vahe.',
  'help.guide.expense-payers.tip.1':
    '„Kes maksis?“ ja „Jaotus“ on teineteisest sõltumatud: võid maksta õhtusöögi eest, kus sa ei olnud, ja olla jaotuses kulul, mille eest sa ei maksnud.',
  'help.guide.expense-payers.tip.2':
    'Mitme maksja korral peavad summad kokku andma kogusumma. Kui märgid veel ühe maksja, jagatakse ülejäänu uuesti nende summade vahel, mida sa ise pole sisestanud. Kuni summad ei klapi, näitab redaktor, milline peab kogusumma olema, ega salvesta.',
  'help.guide.expense-payers.tip.3':
    'Kui muudad kulu tagasi olekusse „Keegi pole veel maksnud“, ei kustutata seda: summa jääb „Reisi kogukulu“ sisse ja rida muutub olekuks „Lõpetamata“.',
  // split-expense
  'help.guide.split-expense.title': 'Jaga arve reisijate vahel',
  'help.guide.split-expense.goal':
    'Otsusta, kes kulu eest võlgneb: kõik võrdselt, summade kaupa või kviitungi järgi eseme kaupa.',
  'help.guide.split-expense.step.1':
    'Kulu redaktoris on jaotises „Jaotus“ kõik reisijad koos märkeruuduga. Võta nimelt linnuke ära, et jätta see inimene sellest kulust välja: nimi muutub halliks, tema osa kaob ja ta ei võlgne selle eest midagi.',
  'help.guide.split-expense.step.2':
    'Pealkirja kõrval oleval lülitil on vaikimisi valitud „Võrdselt“: iga märgitud reisija saab sama suure osa, mis on näha nime kõrval. Loendi all olevad märgid näitavad, mitu inimest kulu jagab ja kui suur on iga osa.',
  'help.guide.split-expense.step.3':
    '„Kohandatud“ asendab osad summaväljadega. Kirjuta, kui palju iga reisija võlgneb. All olev märk uueneb kirjutamise ajal ja muutub roheliseks tekstiga „Jaotus vastab kogusummale“. Kuni summad ei vasta kogusummale, ei saa salvestada.',
  'help.guide.split-expense.step.4':
    '„Tšekk“ jagab kviitungi rea kaupa: „Lisa kirje“, siis igale reale nimi ja hind ning „Jaotus:“ kõrvale reisijad, kes selle rea jagavad.',
  'help.guide.split-expense.step.5':
    'Ridade all olev „Individuaalsed osad“ näitab, kui palju iga reisija lõpuks võlgneb, ja üleval olev „Kogusumma“ on ridade summa. Klõpsa akna allosas „Salvesta“.',
  'help.guide.split-expense.result':
    'Kõik saldod arvutatakse jaotuse põhjal. See salvestatakse koos kuluga, on kulu real näha kui „Jaotus“ iga reisija osaga ja seda saab hiljem muuta, ilma et midagi muud muutuks.',
  'help.guide.split-expense.tip.1':
    'Reisija, kelle märke eemaldad, ei võlgne selle kulu eest midagi. Teised maksavad oma osa.',
  'help.guide.split-expense.tip.2':
    '„Võrdselt“ jagab sendi täpsusega: ülejääv sent läheb igal kulul erinevale inimesele, nii et sama inimene ei maksa seda alati.',
  'help.guide.split-expense.tip.3':
    'Tšeki režiimis arvutatakse „Kogusumma“ ise ja väli muutub halliks: kogusumma on tšeki ridade summa.',
  'help.guide.split-expense.tip.4':
    'Kohandatud jaotuse saab sisestada ka protsentides: lülita „Sisesta osad kui“ väärtusele %, ja enne kulu salvestamist peavad osad kokku andma 100 %.',
  // expense-currency
  'help.guide.expense-currency.title': 'Sisesta kulu teises valuutas',
  'help.guide.expense-currency.goal': 'Sisesta kviitungil olev summa ja TREK salvestab vahetuskursi.',
  'help.guide.expense-currency.step.1':
    'Ava „Lisa kulu“. Kirjuta nimi akna ülaossa ja sisesta väljale „Kogusumma“ summa täpselt nii, nagu see on tšekil, mitte ümberarvestatud summat.',
  'help.guide.expense-currency.step.2':
    'Ava summa kõrval olev „Valuuta“ ja vali tšeki valuuta. Loendis on kõik TREKile teadaolevad koodid ja seda saab otsida: kirjuta kolm tähte.',
  'help.guide.expense-currency.step.3':
    'Väljade alla ilmub märkide rida: sinu sisestatud summa ja selle praegune väärtus märgisega „hetkekurss“. See on ainult eelvaade, mitte salvestatav väärtus.',
  'help.guide.expense-currency.step.4':
    'Klõpsa akna allosas „Lisa kulu“. Kurss lukustatakse sel hetkel: kulu väärtus jääb samaks, mis oli sisestamise päeval.',
  'help.guide.expense-currency.step.5':
    'Kulude loendis on real nime all mõlemad summad: sinu sisestatud summa, nool ja summa reisi valuutas. Kõik vahekaardi „Kulud“ kogusummad, saldod ja arveldused kasutavad teist summat.',
  'help.guide.expense-currency.result':
    'Kulu säilitab sinu sisestatud summa ja valuuta. Kulude loendis on näha mõlemad ning reisi kogusummad ja saldod arvutatakse reisi valuutas.',
  'help.guide.expense-currency.tip.1':
    'Kurss lukustatakse salvestamisel, nii et arveldatud võlg ei muutu, kui vahetuskurss nädal hiljem muutub. Uus kurss salvestatakse ainult siis, kui muudad kulu valuutat.',
  'help.guide.expense-currency.tip.2':
    'Seadetes olev „Kuvamisvaluuta“ muudab ainult seda, kuidas summasid näidatakse. Salvestatud summad ei muutu kunagi. Kui see on tühi, kuvatakse iga reis selle enda valuutas.',
  'help.guide.expense-currency.tip.3':
    'Reisi valuuta määratakse reisi enda juures jaotises „Muuda reisi“ ja selleks on vaja õigust „Reisiandmete muutmine“. Kui valuutat muudad, arvutatakse kõik fikseeritud kursid uue valuuta jaoks ümber. Summasid endid ei teisendata.',
  // filter-costs
  'help.guide.filter-costs.title': 'Kulu või ühe päeva kulutuste leidmine',
  'help.guide.filter-costs.goal': 'Filtreeri pikk kulude loend nii, et näha oleks ainult see, mida otsid.',
  'help.guide.filter-costs.step.1':
    'Kirjuta ribal väljale „Otsi kulusid…“. Kulude nimed sobitatakse juba kirjutamise ajal ja Esc tühjendab välja.',
  'help.guide.filter-costs.step.2':
    'Otsingu kõrval olev lehter „Filtreeri“ avab filtrid. Üleval olev lüliti on sinu isiklik vaade kuludele: „Kõik“, „Minu makstud“ selle jaoks, mille eest sina maksid, ja „Mulle võlgnetakse“ kulude jaoks, kus maksid rohkem kui oma osa.',
  'help.guide.filter-costs.step.3':
    'Vali jaotises „Kategooria“ üks neljateistkümnest kategooriast ja näha on ainult selle kategooria kulud. Lehtril olev arv näitab, mitu filtrit on sisse lülitatud.',
  'help.guide.filter-costs.step.4':
    'Vali jaotises „Päev“ üks päevadest, mil on kulusid. Päevapäiste asemel kuvatakse riba, mis näitab seda päeva tervikuna, selle kulude arvu ja kogusummat.',
  'help.guide.filter-costs.step.5':
    '„Ekspordi CSV“, lehtri kõrval olev allalaadimisikoon, salvestab kõik kulud faili koos algse summa, selle valuuta ja teisendatud summaga.',
  'help.guide.filter-costs.result':
    'Filtreid saab kombineerida ja päevarühmad uuenevad koos allesjäänud kulude kogusummadega.',
  'help.guide.filter-costs.tip.1':
    'Registreeritud maksetel pole nime ega kategooriat, nii et otsing või kategooriafilter peidab need, samuti „Mulle võlgnetakse“. Päevafilter jätab need alles, makse toimumise päeva alla.',
  'help.guide.filter-costs.tip.2':
    '„Ekspordi CSV“ ekspordib alati kõik kulud, olenemata ekraanil olevast filtrist, iga kulu eraldi reale.',
  'help.guide.filter-costs.tip.3':
    '„Lähtesta filtrid“, mis on filtrimenüü allosas, kui mõni filter on sees, lülitab kõik filtrid korraga välja.',
  // settle-up
  'help.guide.settle-up.title': 'Vaata, kes kellele võlgneb, ja arvelda',
  'help.guide.settle-up.goal':
    'Muuda paljud ühised kulud võimalikult väheseks arvuks ülekanneteks, mis kõik võlad tasa teevad, ja registreeri ülekanded, kui need on tehtud.',
  'help.guide.settle-up.step.1':
    'Parema veeru kaart „Arvelda“ näitab ülekandeid, millega kõik võlad tasaseks saaks: kes kellele maksab, kahe avatarina, mille kohtspikris on nimed, ja kui palju. Päises olev number näitab, mitu neist on veel tasumata.',
  'help.guide.settle-up.step.2':
    'Ülekande kõrval olev „Arvelda“ märgib selle tehtuks. Ülekanne kaob kaardilt ja saldod uuenevad.',
  'help.guide.settle-up.step.3':
    'Registreeritud ülekanne on pearaamatus rida selle päeva all, mil see toimus, märgisega „Makse“, koos kahe reisija ja summaga.',
  'help.guide.settle-up.step.4':
    'Selle rea kõrval olev pliiats parandab makset ja „Võta tagasi“ tühistab selle. Ülekanne naaseb siis kaardile „Arvelda“.',
  'help.guide.settle-up.step.5':
    'Kaardi päises olev „Lisa makse“ registreerib ülekande, mis ei järginud soovitust. Vali maksja ja saaja, summa, valuuta ja makse päev, lisa soovi korral „Märkus“, näiteks makseviis, seejärel klõpsa dialoogi allosas „Lisa makse“.',
  'help.guide.settle-up.step.6':
    'Ülemisel ribal olev „Arvelda“ registreerib korraga kõik tasumata ülekanded küsimata, näiteks kui grupp reisi lõpus kõik võlad klaarib.',
  'help.guide.settle-up.result':
    'Iga registreeritud ülekanne on kulude loendis rida ja eemaldab kaardilt „Arvelda“ ühe rea. Kui kaardil on kirjas „Kõik on tasa“, on reis täielikult tasutud.',
  'help.guide.settle-up.tip.1':
    'Kaart näitab võimalikult vähe ülekandeid, mitte iga võlga: kui kolm inimest on üksteisele ringiratast võlgu, taandub see ühele või kahele maksele.',
  'help.guide.settle-up.tip.2':
    '„Arvelda“ ainult salvestab ülekande, raha see ei saada. Maksa oma tavapärasel viisil ja klõpsa siis „Arvelda“.',
  'help.guide.settle-up.tip.3':
    'Makse võib teha mis tahes valuutas, nii et jeenides võla tasumine eurodes on täiesti tavaline: aknas on oma valuutavalik ja ka see kurss fikseeritakse.',
  // final-budget
  'help.guide.final-budget.title': 'Mis reis igale reisijale maksma läks',
  'help.guide.final-budget.goal': 'Vaata iga inimese numbreid: tänane saldo ja tegelik kulu inimese kohta.',
  'help.guide.final-budget.step.1':
    '„Saldod“ näitab iga reisija seisu: roheline riba paremale, kui reis on talle võlgu, punane riba vasakule, kui tema on reisile võlgu, ja summa nime kõrval.',
  'help.guide.final-budget.step.2':
    'Selle all olev „Lõplik eelarve“ vastab teisele küsimusele: mitte kes kellele praegu võlgneb, vaid kui palju reis igale reisijale maksab, kui kõik on tagasi makstud.',
  'help.guide.final-budget.step.3':
    'Klõpsa nimel, et näha arvutust: „Makstud kulud“, selle all „Tagasimaksete netosumma“ ja „Ootel tagasimaksed“.',
  'help.guide.final-budget.step.4':
    'Kolme rea all on iga reisija nime all loend ridadest, millest see rida koosneb: kulud, mille eest see reisija maksis, juba salvestatud ülekanded ja veel tasumata ülekanded. Iga loendi summa võrdub täpselt samanimelise reaga.',
  'help.guide.final-budget.result':
    '„Saldod“ näitab, kellele ollakse täna võlgu ja kes on võlgu. „Lõplik eelarve“ näitab, palju reis igaühele teist maksma läheb, kui kõik on tagasi makstud.',
  'help.guide.final-budget.tip.1':
    'Makse registreerimine ei muuda kellegi lõplikku eelarvet. See viib summa ainult ootel tagasimaksetest tagasimaksete netosummasse.',
  'help.guide.final-budget.tip.2': 'Maksjata kulu jääb mõlemast kaardist välja, samamoodi nagu arveldussoovitustest.',
  // expense-from-booking
  'help.guide.expense-from-booking.title': 'Muuda broneering kuluks',
  'help.guide.expense-from-booking.goal': 'Seo lennu, hotelli või koha tegelik hind kirjega, mille juurde see kuulub.',
  'help.guide.expense-from-booking.step.1':
    'Leia broneering vahelehelt „Transport“ või „Broneeringud“ ja klõpsa selle kaardi ülaosas oleval pliiatsil.',
  'help.guide.expense-from-booking.step.2':
    'Keri vormi lõpu lähedal olevasse jaotisse „Kulud“. Seal on „Loo kulu“, mis salvestab kõigepealt broneeringu, ja „Seo olemasolev kulu“ kulu jaoks, mis on juba jaotises „Kulud“.',
  'help.guide.expense-from-booking.step.3':
    'Klõpsa „Loo kulu“. Broneering salvestatakse, vorm sulgub ja avaneb kulude redaktor, kus nimeks on broneeringu pealkiri, kategooria vastab broneeringu tüübile ja kulu päevaks on broneeringu päev.',
  'help.guide.expense-from-booking.step.4':
    'Täida summa ja valuuta, maksja ja jaotus nagu iga kulu puhul ning klõpsa „Lisa kulu“. Kui broneeringu uuesti avad, on kulu jaotises „Seotud kulud“ koos pliiatsiga muutmiseks, valikuga „Eemalda seos, jäta kulu alles“, mis eemaldab seose, kuid jätab kulu alles, ja prügikastiga kustutamiseks.',
  'help.guide.expense-from-booking.result':
    'Broneeringul on näha selle maksumus ja kulu on vahekaardil „Kulud“ tavaline rida, millel on nagu igal teisel kulul maksja, jaotus ja valuuta.',
  'help.guide.expense-from-booking.tip.1':
    'Broneeringu kustutamine kustutab ka sellega seotud kulud ja kinnitusküsimus ütleb seda. Broneeringu plokis „Kulud“ olev „Eemalda kulu“ teeb vastupidist: kustutab kulu ja jätab broneeringu alles. „Eemalda seos, jäta kulu alles“ jätab alles mõlemad.',
  'help.guide.expense-from-booking.tip.2': 'Koha vormis on sama plokk ja seal salvestab „Loo kulu“ kõigepealt koha.',
  // costs-table
  'help.guide.costs-table.title': 'Planeeri kulud tabelis',
  'help.guide.costs-table.goal':
    'Vaata ja muuda kulusid tabelina, kategooriate kaupa sorditult ning inimese ja päeva kohta arvutatult.',
  'help.guide.costs-table.step.1':
    'Klõpsa „Tabel“, ribal oleva lüliti „Loend / Tabel“ teist ikooni. Kulude loendi asemel on nüüd samade kulude tabel ning otsing ja filtrid kehtivad ka sellele.',
  'help.guide.costs-table.step.2':
    'Tabel on rühmitatud kategooriate kaupa. Iga rühma päises on nimi, kulude arv ja vahesumma; klõpsa päisel, et rühm kokku panna. Veerud on „Nimi“, „Kuupäev“, „Kokku“, „Inimesi“ ja „Päevad“, seejärel nende põhjal arvutatud „Inimese kohta“, „Päeva kohta“ ja „Inimese/päeva kohta“ hallil taustal. All olev rida „Kokku“ liidab kõik kokku.',
  'help.guide.costs-table.step.3':
    'Klõpsa lahtril, et seda otse muuta: nimi, kogusumma, „Inimesi“ või „Päevad“. Kirjuta ja salvestamiseks vajuta Enter või klõpsa mujal, tühistamiseks vajuta Esc. Kuupäev avab kalendri. „Inimese kohta“ ja teised arvutatud veerud uuenevad kohe.',
  'help.guide.costs-table.step.4':
    'Lukuga summat ei saa siin muuta: keegi on selle maksnud või on see sisestatud teises valuutas, ja kohtspikker ütleb, kumb. Klõps sellel avab hoopis kulu, et saldod ja fikseeritud vahetuskurss jääksid õigeks.',
  'help.guide.costs-table.step.5':
    'Kategooria lõpus olev „Lisa kulu“ lisab sinna rea nimega „Uus kirje“, mille kuupäev on sama mis seal viimasel kirjel. Nimeväli on juba avatud, nii et saad nime muuta. Summa sisesta samamoodi.',
  'help.guide.costs-table.step.6':
    'Selles vaates on parempoolses veerus jaotise „Kategooriate kaupa“ asemel „Kokkuvõte“. See liidab kulud kokku neljal viisil: kategooria, päev, „Maksja“ (tasumata kulude puhul „Maksjat veel pole“) ja olek, „Makstud“ ja avatud.',
  'help.guide.costs-table.result':
    'Iga kulu on oma kategoorias koos summaga inimese ja päeva kohta. Kui muudad lahtris kogusummat, uuenevad ülal olevad kaardid ja „Kokkuvõte“ kohe.',
  'help.guide.costs-table.tip.1':
    '„Kulud“ jätab vaate selles brauseris meelde: see avaneb tabelina, kuni klõpsad uuesti „Loend“.',
  'help.guide.costs-table.tip.2':
    'Kulul, mille jaotus on „Kohandatud“ või „Tšekk“, pole ühtset osa inimese kohta, nii et selle „Inimese kohta“ ja „Inimese/päeva kohta“ jäävad tühjaks.',
  'help.guide.costs-table.tip.3':
    'Maksjaid, jaotust, märkust ja kviitungeid muudad kulus endas: rea lõpus olevas menüüs „Veel valikuid“ on „Muuda“ ja rea eemaldamiseks „Kustuta“.',

  // ── Screen: trip-files ────────────────────────────────────────────────────────────────
  'help.ctx.trip-files.title': 'Failid',
  'help.ctx.trip-files.summary':
    'Kõik reisi dokumendid ühes loendis: piletid, kinnitused, pääsmed ja pildid. Igal neist on märkus, seos koha või broneeringuga, mille juurde see kuulub, ja prügikast, kust saad selle taastada.',
  'help.ctx.trip-files.bullet.1':
    'Riba all olev katkendliku joonega kast „Lohista failid siia“ võtab vastu sinna lohistatud failid. Klõps sellel avab failivalija. Kastis on näha selle TREKi lubatud failitüübid ja ühe faili piirang (kuni 50 MB, kui administraator pole muud määranud).',
  'help.ctx.trip-files.bullet.2':
    'Ülal oleval ribal on „Failid“ ja filtrivahekaardid „Kõik“, „PDF-id“, „Pildid“ ja „Dokumendid“, igaühel oma arv. Kui mõnel failil on tärn, ilmub „Kõik“ järele tärniga vahekaart, ja kui mõnel märkmel on manus, ilmub lõppu vahekaart „Ühismärkmed“.',
  'help.ctx.trip-files.bullet.3':
    'Real on pisipilt või failitüüp, üleslaadija, nimi, selle all märkus, suurus ja kuupäev ning iga seose kohta üks märk: koht, broneering või transport oma nimega (kursorit peale viies näed „Päevaplaan“, „Broneering“ või „Transport“) ja „Ühismärkmetest“.',
  'help.ctx.trip-files.bullet.4':
    'Rea lõpus on kuni viis ikooni, mille nimi on näha, kui viid kursori neile: „Lisa tärn“, „Määra“ (pliiats), „Ava“, „Laadi alla“ ja „Kustuta“. „Kustuta“ ei küsi kinnitust: fail läheb prügikasti, kust saad selle taastada. Võrguühenduseta töötavad märkus, link, tärn ja prügikast endiselt ning muudatused saadetakse, kui TREK on taas võrgus; ainult üleslaadimiseks ja mõne muu seose eemaldamiseks on vaja ühendust.',
  'help.ctx.trip-files.bullet.5':
    'Pilt või video avaneb täisekraanil, kus saad liikuda nooleklahvidega ja all on pisipiltide rida. Kõik muud dokumendid avanevad aknas, mille ülaosas on nimi ja selle all „Ava uuel vahekaardil“ ja „Laadi alla“. Rahakoti pääse laaditakse kohe alla.',
  'help.ctx.trip-files.bullet.6':
    'Riba paremas otsas olev prügikastiikoon („Prügikast“) lülitab loendi kustutatud failidele. Seal saad iga faili taastada või jäädavalt kustutada ning ribal olev „Tühjenda prügikast“ kustutab need kõik. „Dokumentide sünkroonimine“ on prügikastiikoonist vasakul, kui reis on ühendatud dokumendihoidlaga, ning reisi omanikule või administraatorile kohe, kui mõni hoidla on sisse lülitatud.',
  // files-upload
  'help.guide.files-upload.title': 'Lisa reisile dokument',
  'help.guide.files-upload.goal':
    'Laadi pilet, kinnitus või foto allalaadimiste kaustast reisile, kus kõik reisil osalejad saavad selle avada.',
  'help.guide.files-upload.step.1':
    'Ava reis ja klõpsa vahekaardiribal „Failid“. Seal on reisi dokumendid ja nende kohal üleslaadimiskast.',
  'help.guide.files-upload.step.2':
    'Klõpsa „Lohista failid siia“ ja vali üks või mitu faili. Need laaditakse üles üksteise järel ja üleslaadimise ajal on kastis kirjas „Üleslaadimine...“. Kastis rea „või klõpsa sirvimiseks“ all on näha selle TREKi lubatud failitüübid ja ühe faili suurim maht.',
  'help.guide.files-upload.step.3':
    'Kui viimane fail on üles laaditud, avaneb selle jaoks automaatselt „Määra fail“ (kui reisil on kohti või broneeringuid), dialoogi ülaosas faili nimi. Jaotises „Märkus“ olev „Lisa märkus...“ lisab failile märkuse ja allolevad loendid seovad selle koha või broneeringuga. Sulge see paremas ülanurgas oleva ×-iga; sulgemisel ei lähe midagi kaduma.',
  'help.guide.files-upload.step.4':
    'Uued failid ilmuvad loendi algusse, nende kohal on ainult tärniga failid. Real on üleslaadija, nimi, suurus ja kuupäev. Pildil on pisipilt, teistel failidel nende tüüp.',
  'help.guide.files-upload.result':
    'Dokumendid on reisil ning kõik, kes reisi näevad, saavad neid avada ja alla laadida.',
  'help.guide.files-upload.tip.1':
    'Faili saad ka töölaualt otse kastile lohistada. Kast on esile tõstetud, kui fail on selle kohal.',
  'help.guide.files-upload.tip.2':
    'Vajuta Ctrl+V, et lisada lõikelaual olev pilt loendisse, nii et broneeringu ekraanipilti ei pea enne salvestama.',
  'help.guide.files-upload.tip.3':
    'Üleslaadimiseks on vaja failide üleslaadimise õigust; ilma selleta kasti üldse pole. Loendist puuduva tüübi korral näidatakse teadet ja midagi ei laadita üles. Piirangust suurem fail (50 MB, kui administraator pole muud määranud) lükatakse tagasi enne, kui midagi saadetakse, ja teade nimetab piirangu. Üleslaadimiseks on vaja ka ühendust: võrguühenduseta annab TREK sellest teada ega laadi midagi üles.',
  // files-link
  'help.guide.files-link.title': 'Seo dokument koha või broneeringuga',
  'help.guide.files-link.goal':
    'Tee pilet leitavaks ka päevast, mille juurde see kuulub, mitte ainult sellest loendist.',
  'help.guide.files-link.step.1':
    'Klõpsa rea lõpus oleval pliiatsil („Määra“). Avaneb „Määra fail“, dialoogi ülaosas faili nimi.',
  'help.guide.files-link.step.2':
    'Jaotises „Märkus“ saab väljale „Lisa märkus...“ kirjutada ühe rea, mis kuvatakse loendis faili nime all. See salvestatakse, kui vajutad Enter või lahkud väljalt.',
  'help.guide.files-link.step.3':
    'Vasakul jaotises „Koht“ on reisi kohad, rühmitatud päevade kaupa koos kuupäevaga, ja lõpus „Määramata“ kohtade jaoks, mis pole üheski päevas. Klõpsa kohal, et see linnukesega märkida.',
  'help.guide.files-link.step.4':
    'Paremal jaotistes „Broneering“ ja „Transport“ on reisi broneeringud. Klõpsa sellel, mille juurde dokument kuulub, ka see saab linnukese.',
  'help.guide.files-link.step.5':
    'Sulge paremas ülanurgas oleva ×-ga. Salvestusnuppu siin pole: iga klõps salvestati kohe.',
  'help.guide.files-link.result':
    'Real on märkus ja iga seose kohta üks märk: üks koha nimega ja üks lennu nimega. Kui viid kursori märgi kohale, on näha „Päevaplaan“ või „Transport“. Dokument on lisatud ka kohale ja lennule.',
  'help.guide.files-link.tip.1':
    'Failil võib olla korraga mitu seost, nii et sama kinnitus võib samal ajal kuuluda nii hotelli broneeringu kui ka hotelli koha juurde.',
  'help.guide.files-link.tip.2':
    'Kui klõpsad märgitud kirjel uuesti, eemaldatakse see seos; fail ise jääb alles. Võrguühenduseta salvestatakse märkus ja uued märked ning saadetakse, kui TREK on taas võrgus; ainult mõne muu seose eemaldamiseks on vaja ühendust.',
  'help.guide.files-link.tip.3':
    'See töötab ka vastupidi: kohale või broneeringule lisatud dokument on samuti selles loendis ja selle real on sama märk.',
  // files-star
  'help.guide.files-star.title': 'Hoia olulised dokumendid üleval',
  'help.guide.files-star.goal':
    'Märgi need mõned dokumendid, mida sul tõesti vaja läheb, et leiaksid need pikast loendist kiiresti üles.',
  'help.guide.files-star.step.1':
    'Klõpsa rea lõpus tärnil („Lisa tärn“). Tärn muutub kuldseks, faili nime ette ilmub teine tärn ja kui viid kursori nupule, on seal nüüd kirjas „Eemalda tärn“.',
  'help.guide.files-star.step.2':
    'Loend sorditakse uuesti: tärniga failid on kõigist teistest eespool ja kummaski rühmas on uusimad eespool.',
  'help.guide.files-star.step.3':
    'Riba filtrivahekaartidele ilmub kohe „Kõik“ järele tärn, selle kõrval tärniga failide arv. Klõpsa sellel, et näha ainult neid faile.',
  'help.guide.files-star.result': 'Tärniga failid on loendi alguses ja üks vahekaart näitab ainult tärniga faile.',
  'help.guide.files-star.tip.1':
    'Tärniga vahekaart on olemas ainult siis, kui mõnel failil on tärn. Kui eemaldad viimaselt faililt tärni, vahekaart kaob.',
  'help.guide.files-star.tip.2':
    'Tärni lisamiseks on vaja sama õigust mis nupu „Määra“ jaoks, „Failide metaandmete muutmine“. Liige, kellel seda õigust pole, näeb tärne, kuid klõps „Lisa tärn“ tema jaoks midagi ei muuda.',
  // files-filter
  'help.guide.files-filter.title': 'Leia dokument loendist',
  'help.guide.files-filter.goal': 'Näita ainult seda tüüpi dokumente, mida otsid.',
  'help.guide.files-filter.step.1':
    'Filtrivahekaardid on ülemisel ribal pealkirja „Failid“ kõrval: „Kõik“, „PDF-id“, „Pildid“ ja „Dokumendid“, igaühe kõrval failide arv.',
  'help.guide.files-filter.step.2': 'Klõpsa „PDF-id“: loendis on ainult PDF-failid.',
  'help.guide.files-filter.step.3':
    'Veel kaks vahekaarti ilmuvad ainult siis, kui reisil on vastavaid faile. Klõpsa „Ühismärkmed“, mis ilmub kohe, kui mõnel vahekaardi „Koostöö“ märkmel on manus: loendis on siis ainult need failid. Samamoodi ilmub tärni vahekaart kohe, kui mõnele failile on tärn lisatud.',
  'help.guide.files-filter.step.4': '„Kõik“ toob tagasi kogu loendi.',
  'help.guide.files-filter.result':
    'Loendis on ainult valitud vahekaardi failid ja iga vahekaardi arv näitab, mitu faili seal on.',
  'help.guide.files-filter.tip.1':
    'Siin pole kaustu ja faile ei saa ümber nimetada. Dokumentide eristamiseks kasuta märkust aknas „Määra fail“, seoseid kohtade ja broneeringutega ning tärni.',
  'help.guide.files-filter.tip.2':
    'Loendis on alati eespool tärniga failid ja seejärel uusimad, nii et täna üles laaditud dokument on eelmise kuu omast eespool.',
  // files-preview
  'help.guide.files-preview.title': 'Loe dokumenti TREKist lahkumata',
  'help.guide.files-preview.goal': 'Vaata piletit või pilti kohe ja laadi see oma seadmesse, kui seda seal vajad.',
  'help.guide.files-preview.step.1':
    'Klõpsa pildi nimel või pisipildil. See avaneb täisekraanil ning üleval vasakul on faili nimi ja selle järjekorranumber piltide hulgas. Video avaneb samamoodi ja mängib seal.',
  'help.guide.files-preview.step.2':
    'Kõigi parajasti loendis olevate piltide sirvimiseks kasuta külgedel olevaid ümmargusi nooli, vasak- ja paremnooleklahvi või all olevat pisipiltide riba.',
  'help.guide.files-preview.step.3':
    '„Ava uuel vahekaardil“ ja „Laadi alla“ on paremas ülanurgas ×-i kõrval olevad ümmargused nupud. Pildi sulgemiseks klõpsa ×-il, vajuta Escape või klõpsa tumedal taustal.',
  'help.guide.files-preview.step.4':
    "Dokument, mis pole pilt, avaneb hoopis aknas: üleval on selle nimi, selle all nupud „Ava uuel vahekaardil“ ja „Laadi alla“, PDF-i puhul allpool leht ise. Aken sulgub paremas ülanurgas oleva ×, Escape'i või akna kõrvale klõpsamisega.",
  'help.guide.files-preview.step.5':
    'Rea lõpus olev nool („Laadi alla“) salvestab faili otse sinu seadmesse, ilma seda enne avamata.',
  'help.guide.files-preview.result':
    'Dokument on ekraanil ja samad kaks nuppu avavad selle brauseri vahekaardil või salvestavad kettale.',
  'help.guide.files-preview.tip.1': 'Puuteekraanil libista pilte sõrmega, selle asemel et nooltel klõpsata.',
  'help.guide.files-preview.tip.2':
    'Rahakotipääsme puhul eelvaadet ei avata. See laaditakse kohe alla, et telefon saaks selle rahakotirakenduses avada.',
  'help.guide.files-preview.tip.3':
    'Nii „Ava uuel vahekaardil“ kui ka „Laadi alla“ laadivad faili sinu seansiga, nii et aadressiribalt kopeeritud link ei tööta kellelegi teisele.',
  // files-trash
  'help.guide.files-trash.title': 'Dokumendi kustutamine ja taastamine',
  'help.guide.files-trash.goal': 'Kustuta see, mida reis enam ei vaja, ja taasta failid, mida sul veel vaja on.',
  'help.guide.files-trash.step.1':
    'Klõpsa rea lõpus prügikastil („Kustuta“). Fail kaob kohe loendist ja ilmub teade „Prügikasti tõstetud“. Kinnitust ei küsita.',
  'help.guide.files-trash.step.2':
    'Riba paremas otsas olev prügikastiikoon („Prügikast“) lülitab loendi kustutatud failidele. Riba pealkirjas on „Prügikast“ ning filtrivahekaardid ja üleslaadimiskast on peidetud.',
  'help.guide.files-trash.step.3':
    'Prügikasti rida on hall ja sellel on kaks ikooni: „Taasta“, mis taastab faili, ja „Kustuta“, mis kustutab selle pärast kinnitust jäädavalt.',
  'help.guide.files-trash.step.4':
    'Klõpsa „Taasta“. Ilmub teade „Fail taastatud“ ja fail eemaldatakse prügikastist. Selle märkus ja seosed jäävad alles.',
  'help.guide.files-trash.step.5':
    '„Tühjenda prügikast“, mis on ribal prügikasti ikooni kõrval, kustutab jäädavalt kõik, mis prügikastis veel on. Brauser küsib enne seda ühe korra kinnitust. Prügikasti ikoon viib tagasi failide juurde.',
  'help.guide.files-trash.result': 'Fail on loendis tagasi samas kohas, kus see enne oli.',
  'help.guide.files-trash.tip.1':
    'Real olev „Kustuta“ ei küsi kinnitust. Seepärast ongi prügikast: TREKist ei eemaldata midagi enne, kui kustutad selle siit. Kõik see töötab ka võrguühenduseta ja saadetakse, kui TREK on taas võrgus.',
  'help.guide.files-trash.tip.2':
    'Faili kustutamiseks ja taastamiseks on vaja failide kustutamise õigust. Ilma selleta ei näe liige real nuppu „Kustuta“ ega prügikastis olevaid nuppe.',
  'help.guide.files-trash.tip.3': 'Prügikastist jäädavalt kustutatud faili ei saa tagasi tuua.',
  // files-sync
  'help.guide.files-sync.title': 'Sünkrooni dokumendid oma dokumendihoidlaga',
  'help.guide.files-sync.goal':
    'Ühenda reis oma dokumendihoidlaga, et siia üles laaditud failid salvestuksid sinna ja sinna salvestatud failid ilmuksid siia.',
  'help.guide.files-sync.step.1':
    'Klõpsa riba paremas otsas prügikasti ikooni kõrval „Dokumentide sünkroonimine“. Avaneb aken, mille pealkirja all on reisi nimi. Vasakul jaotises „Ühenda teenus“ on hoidlad, mille administraator on sisse lülitanud, ja iga juures rida selle kohta, kuidas see faile hoiab: Paperless-ngx ja Papra siltidega, Nextcloud ja Synology Drive kaustas, OpenCloud ruumis. Paremal on kirjas „Midagi pole veel ühendatud“.',
  'help.guide.files-sync.step.2':
    'Klõpsa oma hoidlal, siin Nextcloud. Avaneb väiksem ühenduse aken hoidla nimega, mis küsib selle hoidla sisselogimisandmeid.',
  'help.guide.files-sync.step.3':
    "Täida „Aadress“ ja salvestusteenuse enda sisselogimisandmed: Paperless-ngx jaoks „API-pääse“, Papra jaoks „API-võti“ ja „Organisatsiooni ID“, Nextcloudi jaoks „Kasutajanimi“ ja „Rakenduse parool“, OpenCloudi jaoks „Kasutajanimi“ ja „Rakenduse pääse“ ning Synology Drive'i jaoks „Kasutajanimi“, „Parool“ ja, kui konto seda nõuab, „Kaheastmelise autentimise kood“. Kasuta alati rakenduse parooli või pääset, kui teenus seda pakub, mitte kunagi oma konto parooli. Nextcloud ja Synology Drive võtavad vastu ka valikulise „Baaskausta“, kust TREK reisikaustu otsib, siin /Reisen. All olev „Luba iseallkirjastatud sertifikaat“ on mõeldud ainult sinu enda võrgus olevale teenusele, millel on selline sertifikaat.",
  'help.guide.files-sync.step.4':
    'Klõpsa „Testi ühendust“. TREK ühendub sisestatud andmetega hoidlaga ja jaluses on kirjas „Ühendatud, sisse logitud kasutajana“ ning konto nimi. Kui kasutajaandmed lükatakse tagasi või aadressile ei pääse ligi, näitab jalus hoopis seda. Mõlemal juhul ei salvestata midagi.',
  'help.guide.files-sync.step.5':
    'Klõpsa „Ühenda“. Ühendus salvestatakse reisi juurde ja TREK küsib, kus hoidlas peaksid reisi dokumendid olema: silt, kaust või ruum, kus need asuvad. Sünkroonitakse ainult seal olev sisu. „Loo uus“ loob selle, kui klõpsad „Loo“, ja nimeks võetakse reisi pealkiri. Jaotises „Või kasuta olemasolevat“ on olemasolevad. Klõpsa ühel, siin kaustal „Sügis Jaapanis“.',
  'help.guide.files-sync.step.6':
    'Aken avaneb uuesti: sinu hoidla on vasakul jaotises „See reis“ ja paremal oleval kaardil on näha, kuhu see sünkroonib, millal see viimati käis, ja nupp „Sünkrooni kohe“. Esimene sünkroonimine algab automaatselt. Klõpsa „Sünkrooni kohe“, et sünkroonida igal ajal. Pärast sünkroonimist asendub nime kõrval olev märk „Veel sünkroonimata“ rohelise täpiga, millele kursorit viies on kirjas „Sünkroonis“. Vooriba näitab, mitu dokumenti on TREKis ja mitu hoidlas, nende vahel rajad „Salvestusteenusesse“ ja „Salvestusteenusest“. Sulge aken paremas ülanurgas oleva ×-ga.',
  'help.guide.files-sync.result':
    'Hoidlas juba olnud dokumendid ilmuvad loendi algusse, üles laaditud sinu nimel, ja kõik reisi dokumendid on ka hoidlas, välja arvatud „Ühismärkmetest“ pärit dokumendid. Edaspidi kontrollib TREK hoidlat taustal ja loendi muudatused kopeeritakse hoidlasse.',
  'help.guide.files-sync.tip.1':
    'Reisi saab ühendada ainult reisi omanik või instantsi administraator, sest kasutajaandmed annavad ligipääsu kogu hoidla kontole. Kui reis on ühendatud, näeb iga liige nuppu „Dokumentide sünkroonimine“ ning saab selle avada, kaarti lugeda ja vajutada „Sünkrooni kohe“.',
  'help.guide.files-sync.tip.2':
    'Sinu oma võrgus olev hoidla vajab TREKi serveris seadet ALLOW_INTERNAL_NETWORK=true ja selle aadress peab olema masina aadress võrgus, mitte kunagi localhost. Muidu vastab „Testi ühendust“ teatega „See aadress pole lubatud.“',
  'help.guide.files-sync.tip.3':
    'Nupu „Sünkrooni kohe“ kõrval olev ikoon „Katkesta ühendus“ küsib üks kord kinnitust. Seejärel lõpetab see ühenduse ja jätab kõik dokumendid mõlemale poole alles. Kui ühendad sama sildi, kausta või ruumi teist korda, käsitleb TREK seda uuena ja impordib kõik uuesti. Seega ühenda pärast ühenduse katkestamist tühi, mitte vana.',
  // ── Screen: trip-collab ───────────────────────────────────────────────────────────────
  'help.ctx.trip-collab.title': 'Koostöö',
  'help.ctx.trip-collab.summary':
    'Vahekaart, kus grupp koos planeerib, viiel kaardil: vasakul vestlus, selle kõrval „Märkmed“ ja „Lingid“, nende all „Küsitlused“ ja „Järgmisena“. Kõik, mis siia kirjutatakse, ilmub kohe iga teise liikme ekraanile, ilma lehte uuesti laadimata.',
  'help.ctx.trip-collab.bullet.1':
    'Vestlus on vasakpoolne kaart. Kirjuta väljale „Kirjuta sõnum...“ ja vajuta Enter. Shift ja Enter teevad uue rea. Naerunägu lisab emoji ja „Lisa pildid“ lisab sõnumile kuni neli pilti.',
  'help.ctx.trip-collab.bullet.2':
    'Vii kursor sõnumile, et näha nuppu „Vasta“ ja oma sõnumite puhul ka „Kustuta“. Paremklõps avab kaheksa kiirreaktsiooni. Kustutatud sõnumi asemel on märkus, mis ütleb, kes selle kustutas.',
  'help.ctx.trip-collab.bullet.3':
    '„Märkmed“ on ühine märkmete ala: päises olev „Uus märge“ loob märkme ja selle kõrval olev hammasratas avab akna „Halda kategooriaid“ kategooriate nimede ja värvide jaoks. Kui kategooriad on olemas, filtreerib päise all olev siltide rida kaarte: „Kõik“ või üks kategooria. Märkme kaardil on kategooria värvilise täpina ja link ümmarguse nupuna ning selle kolme täpi menüüs („Veel valikuid“) on „Laienda“, „Kinnita“, „Muuda“ ja „Kustuta“.',
  'help.ctx.trip-collab.bullet.4':
    '„Lingid“ koondab reisi veebiaadressid. „Lisa link“ küsib pealkirja ja http- või https-aadressi. „Muuda linki“, „Kinnita link“ ja „Kustuta link“ on kiibi lõpus ning kinnitatud lingid jäävad ette.',
  'help.ctx.trip-collab.bullet.5':
    'Kasuta otsustamiseks küsitlusi. „Uus küsitlus“ esitab küsimuse vähemalt kahe valikuga. Hääletamiseks klõpsa valikul. Küsitluse päise paremas servas olevad lukk („Sulge“) ja prügikast („Kustuta“) lõpetavad hääletuse või eemaldavad küsitluse.',
  'help.ctx.trip-collab.bullet.6':
    '„Järgmisena“ loetleb reisi veel eesootavad peatused, kuni kaheksa, koos kellaaegade ja osalejatega. See ainult loeb päevaplaani; ajad määratakse seal.',
  // write-note
  'help.guide.write-note.title': 'Kirjuta ühine märge',
  'help.guide.write-note.goal':
    'Pane see, mida kogu grupp vajab, näiteks reegel, aadress või meeldetuletus, kohta, kust kõik selle leiavad.',
  'help.guide.write-note.step.1':
    'Klõpsa kaardi „Märkmed“ päises „Uus märge“. Avaneb märkme aken ja kursor on juba pealkirjaväljal.',
  'help.guide.write-note.step.2':
    'Kirjuta pealkiri akna ülaosas väljale „Märkme pealkiri“. See on ainus kohustuslik väli: „Loo“ jääb halliks, kuni pealkirjas on teksti, ja Enter pealkirjaväljal loob märkme kohe.',
  'help.guide.write-note.step.3':
    '„Sisu“ hoiab teksti ja toetab Markdowni: paksus kirjas sõna, loend, pealkiri. Kaardil on näha esimesed kolm rida ja menüüs olev „Laienda“ avab kogu märkme.',
  'help.guide.write-note.step.4':
    'Vali jaotises „Kategooria“ see, kuhu märge kuulub. Selle värvi kasutatakse nüüd dialoogi päises ja hiljem kaardi päises. Esimene kategooria on juba valitud. Sildid on olemasolevad kategooriad ja uue lood jaotises „Halda kategooriaid“. Kuni reisil pole kategooriaid, seda rida pole.',
  'help.guide.write-note.step.5':
    'Väljale „Veebisait“ saab lisada märkmega seotud lingi. Kaardi ülaossa ilmub siis ümmargune linginupp, mis selle avab.',
  'help.guide.write-note.step.6':
    'Klõpsa „Loo“. Dialoogi sulgevad ainult „Tühista“ ja selle rist, nii et klõps dialoogist väljaspool või Esc ei kaota sinu kirjutatut.',
  'help.guide.write-note.result':
    'Märge on kaart paneelis „Märkmed“, ülaosa kategooria värvi, ja kõik teised liikmed näevad seda kohe.',
  'help.guide.write-note.tip.1':
    'Kaardi kolm punkti („Veel valikuid“) avavad valikud „Laienda“, „Kinnita“, „Muuda“ ja „Kustuta“. „Kinnita“ hoiab märget paneeli ülaosas, raamiga selle värvis. Kõik teised märkmed on sorditud viimase muutmise aja järgi.',
  'help.guide.write-note.tip.2':
    'Nupu „Uus märge“ kõrval olev hammasratas avab akna „Halda kategooriaid“. Seal saad kategooriale värvi anda, selle korraga kõikjal ümber nimetada või lisada enne, kui ükski märge seda kasutab. Midagi ei muutu enne, kui klõpsad „Salvesta“.',
  'help.guide.write-note.tip.3':
    '„Lisa failid“ lisab märkmele dokumendi, kui tohid reisile faile üles laadida. „Lisa“ avab failivalija ning pildi või PDF-i saad ka dialoogi kleepida.',
  'help.guide.write-note.tip.4':
    'Märkmetel on jaotises „Lisamoodulid“ oma lüliti, „Koostöö“ all: administraator saab märkmed välja lülitada ja jätta vestluse, lingid, küsitlused ning „Järgmisena“ tööle.',
  // shared-links
  'help.guide.shared-links.title': 'Kogu reisi lingid ühte kohta',
  'help.guide.shared-links.goal':
    'Hoia broneerimisportaal, ühine album ja sõiduplaan ühes kohas, et sa ei peaks neid vestlusest otsima.',
  'help.guide.shared-links.step.1':
    'Klõpsa kaardi „Lingid“ päises „Lisa link“. Dialoog avaneb ja kursor on ülemisel väljal.',
  'help.guide.shared-links.step.2':
    'Kirjuta nimi väljale „Lingi pealkiri“, kleebi aadress selle all olevale väljale „Lingi“ ja klõpsa „Salvesta link“.',
  'help.guide.shared-links.step.3':
    'Märgisel on nimi ja veebisait, kuhu link viib. Klõpsa sellel, et leht uuel vahekaardil avada.',
  'help.guide.shared-links.step.4':
    'Selle lõpus olevad kolm ümmargust nuppu on „Muuda linki“, „Kinnita link“ ja „Kustuta link“. „Kinnita link“ tõstab märgise paneeli algusesse ja näitab seda aktsentvärvis. „Kustuta link“ küsib enne kinnitust, sest link kaob kõigi liikmete jaoks.',
  'help.guide.shared-links.result':
    'Link on märgisena paneelis „Lingid“, kinnitatuna algusesse, ja see ilmub kohe iga liikme ekraanile.',
  'help.guide.shared-links.tip.1':
    'Vastu võetakse ainult http- või https-aadress. Kõik muu lükatakse tagasi ja aken jääb avatuks koos sinu sisestatuga.',
  'help.guide.shared-links.tip.2':
    'Kinnitatud lingid on eespool, seejärel uusimad. Pealkirja kõrval olev väike ikoon on saidi enda favicon, mis laaditakse saidilt endalt, nii et ilma internetita on kiibil selle asemel tavaline lingiikoon.',
  'help.guide.shared-links.tip.3':
    '„Lingid“ on jaotises „Lisamoodulid“ „Koostöö“ all eraldi lüliti, nii et administraator saab paneeli välja lülitada ülejäänud vahelehte puutumata.',
  // create-poll
  'help.guide.create-poll.title': 'Küsi grupilt',
  'help.guide.create-poll.goal':
    'Muuda küsimus, millele vestluses keegi ei vasta, küsitluseks, kus kõik saavad hääletada.',
  'help.guide.create-poll.step.1': 'Klõpsa kaardi „Küsitlused“ päises „Uus küsitlus“. Avaneb aken.',
  'help.guide.create-poll.step.2':
    'Kirjuta küsimus jaotisse „Küsimus“. Kasti all olev „Markdowni tugi“ tähendab, et siin töötavad paks kiri, reavahetus või lühike loend.',
  'help.guide.create-poll.step.3':
    'Täida jaotises „Valikud“ väljad „Valik 1“ ja „Valik 2“. Vaja on vähemalt kahte täidetud valikut ja valik võib olla mitmel real.',
  'help.guide.create-poll.step.4':
    'Nende all olev „Lisa valik“ lisab kolmanda, neljanda ja nii palju valikuid, kui vaja. Rea kõrval olev väike rist, mis ilmub, kui valikuid on rohkem kui kaks, eemaldab selle valiku.',
  'help.guide.create-poll.step.5':
    '„Mitu valikut“ laseb igaühel märkida rohkem kui ühe valiku. Kui see on väljas, liigub inimese hääl uuele valikule, kui ta valib midagi muud.',
  'help.guide.create-poll.step.6': 'Klõpsa „Loo küsitlus“.',
  'help.guide.create-poll.result': 'Küsitlus ilmub paneeli „Küsitlused“ ülaossa, avatuna, päises 0 häält.',
  'help.guide.create-poll.tip.1': 'Küsimust kuvatakse Markdownina, valikud jäävad lihttekstiks.',
  'help.guide.create-poll.tip.2':
    '„Loo küsitlus“ jääb halliks, kuni on olemas küsimus ja vähemalt kaks tekstiga valikut.',
  'help.guide.create-poll.tip.3':
    'Tähtaja saab määrata ainult telefonirakenduses. Tähtajaga küsitluse päises on merevaigukarva kiibil näha järelejäänud aeg ja aja möödudes küsitlus suletakse.',
  'help.guide.create-poll.tip.4':
    '„Küsitlustel“ on oma lüliti jaotises „Lisamoodulid“, „Koostöö“ all: administraator saab selle välja lülitada ja ülejäänud neli paneeli jäävad sisse.',
  // vote-poll
  'help.guide.vote-poll.title': 'Hääletamine ja tulemuse vaatamine',
  'help.guide.vote-poll.goal': 'Hääleta, vaata grupi tulemusi ja muuda vajadusel oma häält.',
  'help.guide.vote-poll.step.1':
    'Klõpsa valikul, mida soovid. Selle ringi ilmub linnuke, valik saab aktsentvärvi raami ja selle taga olev riba kasvab.',
  'help.guide.vote-poll.step.2':
    'Nüüd näed kogu tulemust: riba näitab osakaalu, protsent on paremal ja väikesed ringid on inimesed, kes selle valiku tegid, kuni kolm neist.',
  'help.guide.vote-poll.step.3':
    'Mõtlesid ümber? Klõpsa teisel valikul. Küsitluses, kus „Mitu valikut“ pole sisse lülitatud, liigub sinu hääl uuele valikule ja teist häält juurde ei tule.',
  'help.guide.vote-poll.step.4':
    'Häälte arv on näha küsimuse all oleval kiibil. Kui klõpsad juba valitud valikul, eemaldatakse sinu hääl ja arv väheneb.',
  'help.guide.vote-poll.result':
    'Sinu valik on märgitud, ribad näitavad, kuidas grupp hääletas, ja ringid näitavad, kes mida valis.',
  'help.guide.vote-poll.tip.1':
    'Protsendid ja see, kes mille poolt hääletas, on näha alles siis, kui oled ise hääletanud või küsitlus on suletud. Päises olev häälte arv on näha kõigile.',
  'help.guide.vote-poll.tip.2':
    'Hääletus pole kunagi anonüümne: vii kursor valiku juures mõnele ringile ja näed hääletaja nime.',
  // close-poll
  'help.guide.close-poll.title': 'Sulge või eemalda küsitlus',
  'help.guide.close-poll.goal':
    'Lõpeta hääletus, kui grupp on otsustanud, ja kustuta küsitlus, mida keegi enam ei vaja.',
  'help.guide.close-poll.step.1':
    '„Sulge“, lukk küsitluse päise paremas servas, lõpetab hääletuse. Valikutel ei saa enam klõpsata.',
  'help.guide.close-poll.step.2':
    'Suletud küsitlus liigub paneeli lõppu, pealkirja „Suletud“ alla, kui selle kohal on avatud küsitlusi. Sellel on silt „Suletud“ ja see näitab kõigile tulemust, olenemata sellest, kas nad hääletasid. Võitnud valik on paksus kirjas rohelisel ribal; kui see on sinu valitud variant, on riba hoopis sinu rõhuvärvis.',
  'help.guide.close-poll.step.3':
    '„Kustuta“, prügikast päise paremas servas, kustutab küsitluse. Suletud küsitlusel on see ainus nupp, sest lukku enam pole. Kinnitust ei küsita ja ka hääled kustutatakse.',
  'help.guide.close-poll.result':
    'Kustutatud küsitlus kaob kõigi liikmete paneelilt. Ainult suletud küsitlus jääb koos tulemusega allosas nähtavaks.',
  'help.guide.close-poll.tip.1':
    'Sulgemist ei saa tagasi võtta: uuesti avada ei saa. Kogemata suletud küsitlus tuleb uuesti luua.',
  'help.guide.close-poll.tip.2':
    '„Kustuta“ eemaldab küsitluse ja kõik selle hääled kõigi jaoks, kohe ja kinnitust küsimata.',
  // whats-next
  'help.guide.whats-next.title': 'Vaata paneeli „Järgmisena“',
  'help.guide.whats-next.goal': 'Vaata plaani avamata, mida grupp järgmisena teeb.',
  'help.guide.whats-next.step.1':
    'Kaardil on reisi eelseisvad peatused, kuni kaheksa, ajalises järjekorras, iga päev oma pealkirja all: „Täna“, „Homme“ või kuupäev ning selle kõrval päeva pealkiri, kui see on olemas. Päises on näha nende arv.',
  'help.guide.whats-next.step.2':
    'Iga peatuse vasakul on selle aeg: algus, „kuni“ ja lõpp, kui peatusel see on, või TBD, kui aeg pole veel määratud.',
  'help.guide.whats-next.step.3':
    'Selle kõrval on nimi, aadress ja kiipidena selle peatuse inimesed. Kui peatusele pole kedagi määratud, on loetletud kõik reisil osalejad.',
  'help.guide.whats-next.result':
    'Loend eesootavast, ainult lugemiseks: see järgib plaani ja siin ei muuda miski seda.',
  'help.guide.whats-next.tip.1':
    'Siin ei pea midagi määrama. Ajad tulevad päevaplaanist ja kui neid seal muudad, uueneb see loend kohe.',
  'help.guide.whats-next.tip.2':
    'Loendis on ainult see, mis on veel ees: peatus eemaldatakse, kui selle algusaeg on möödas, tänane kellaajata peatus jääb päeva lõpuni ja reisi lõpus on paneel tühi.',
  'help.guide.whats-next.tip.3':
    '„Järgmisena“ on oma lüliti jaotises „Lisamoodulid“, „Koostöö“ all. See on arvutivaate paneel: telefonirakenduse vahekaardil „Koostöö“ seda ei näidata.',
  // trip-chat
  'help.guide.trip-chat.title': 'Räägi grupiga',
  'help.guide.trip-chat.goal': 'Saada sõnum, vasta kindlale sõnumile, reageeri teisele sõnumile ja kustuta oma sõnum.',
  'help.guide.trip-chat.step.1':
    'Kirjuta väljale „Kirjuta sõnum...“ ja vajuta Enter. Sama teeb ka kasti kõrval olev ümmargune nool. Shift ja Enter lisavad hoopis uue rea.',
  'help.guide.trip-chat.step.2':
    'Naerunägu avab emojivalija, kus on „Naerunäod“, „Reaktsioonid“ ja „Reisimine“. Valitud emoji lisatakse kirjutatavale tekstile, seda ei saadeta eraldi.',
  'help.guide.trip-chat.step.3':
    'Vii kursor kellegi teise sõnumile: selle nurka ilmub väike ümmargune nupp. See on „Vasta“.',
  'help.guide.trip-chat.step.4':
    'Sõnum, millele vastad, on tsitaadina kasti kohal. Kirjuta ja saada oma sõnum, tsitaat saadetakse koos sellega. Tsitaadi eemaldamiseks klõpsa sellel oleval ristil.',
  'help.guide.trip-chat.step.5':
    'Paremklõpsa sõnumil, et näha kaheksat kiirreaktsiooni. Sinu reaktsioon ilmub sõnumi alla. Eemaldamiseks klõpsa uuesti samal reaktsioonil.',
  'help.guide.trip-chat.step.6':
    'Sinu enda sõnumitel on nupu „Vasta“ kõrval „Kustuta“, prügikastiikoon. See kustutab sõnumi kohe ja märkus näitab, et sina kustutasid selle. Seda ei saa tagasi võtta.',
  'help.guide.trip-chat.result':
    'Sinu vastus on uusim sõnum ja tsiteeritud sõnum on selle ülaosas näha. Sinu reaktsioon ilmub teise sõnumi alla. Kustutatud sõnumi asemel on märkus, et sina kustutasid selle.',
  'help.guide.trip-chat.tip.1':
    'Enter saadab, Shift ja Enter lisavad uue rea. Sõnum, milles on ainult üks kuni kolm emojit, kuvatakse suurelt.',
  'help.guide.trip-chat.tip.2':
    '„Lisa pildid“ abil saad ühele sõnumile lisada kuni neli pilti. Neid saab ka kasti kleepida või sinna lohistada.',
  'help.guide.trip-chat.tip.3':
    'Lingiga sõnumi alla ilmub eelvaatekaart, mille laadib sinu enda TREK, nii et link millelegi, kuhu ainult sina ligi pääsed, jääb tavaliseks lingiks.',
  'help.guide.trip-chat.tip.4':
    'Vestlusel on jaotises „Lisamoodulid“ oma lüliti, „Koostöö“ all: administraator saab vestluse välja lülitada ja jätta märkmed, lingid, küsitlused ning „Järgmisena“ sisse.',

  // ── Screen: trip-roadtrip ─────────────────────────────────────────────────────────────
  'help.ctx.trip-roadtrip.title': 'Autoreis',
  'help.ctx.trip-roadtrip.summary':
    'Plaan ühe sõiduna: samad päevad ja samad kohad, ühendatud peatustena ja nendevaheliste sõitudega, vasaku veeru ribal ja kaardil. Näha on vahemaa ja sõiduaeg, kus tuleb tankida ja mis tee ääres on.',
  'help.ctx.trip-roadtrip.bullet.1':
    'Vasaku veeru ülaosas olevad „Päevad“ ja „Autoreis“ lülitavad päevaplaani ja sõidu vahel. Midagi ei kopeerita ega muudeta: „Päevad“ näitab plaani täpselt sellisena, nagu see oli.',
  'help.ctx.trip-roadtrip.bullet.2':
    'Riba ülaosas on reisi kogusummad: „Vahemaa“, „Sõiduaeg“ ja „Peatused“. Selle all on kaart iga sõidupäeva kohta: ruudul päeva number ja kuupäev, seejärel sildid kilomeetrite ja sõiduaja, peatuste arvu, läbitavate takistuste ja märgiga „Rada“. Broneeritud lend, rong või praam on järjestuses eraldi kaardina.',
  'help.ctx.trip-roadtrip.bullet.3':
    'Nummerdatud peatus on koht, mille pärast päev ette võetakse. Teelolev peatus, näiteks tankla, laadimispunkt või puhkekoht, kannab numbri asemel oma tüübi ikooni ja seda ei loendata. Klõpsa numbril, et muuta peatuse liiki, klõpsa märgil „Peatus“, et määrata viibimisaeg, ja lohista peatust, et viia see oma päeva sees teise kohta või teisele päevale.',
  'help.ctx.trip-roadtrip.bullet.4':
    'Kahe peatuse vahel näitab sõiduriba lõigu vahemaad ja aega. Klõpsa sellel, et avada „Selle lõigu sõiduvõimalused“, või klõpsa kaardil marsruudil, et suunata lõik läbi vahepunkti.',
  'help.ctx.trip-roadtrip.bullet.5':
    'Parem veerg muutub vaateks „Marsruudil“: vali ühel real, mida otsida ja millisel päeval, kui lai on koridor, ning klõpsa „Otsi“. Tulemuse plussnupp „Lisa“ lisab selle sõidule kohta, kus sa sellest tegelikult möödud, ja hotelli voodiikoon lisab ööbimise. „Käsitsi“ lisab koha, mida otsing ei leidnud, ning pealkirja kõrval olevad kolm täppi impordivad Google Mapsi marsruudi.',
  'help.ctx.trip-roadtrip.bullet.6':
    'Selle all olevas jaotises „Sõiduseaded“ on piirangud, auto ja selle sõiduulatus, igapäevased sõiduajad, mida vältida, kuidas joont joonistatakse ja kas kaardil näidatakse kehtivaid hoiatusi. Need kuuluvad reisile, nii et kõik planeerivad sama autoga.',
  // roadtrip-mode
  'help.guide.roadtrip-mode.title': 'Vaata reisi ühe sõiduna',
  'help.guide.roadtrip-mode.goal': 'Lülita plaan autoreisi režiimi ja mõista, mida riba näitab.',
  'help.guide.roadtrip-mode.step.1':
    'Klõpsa vasaku veeru ülaosas lülitil „Päevad / Autoreis“ valikut „Autoreis“. Päevaplaani asemel on nüüd sõit ja kaardil on näha iga päev, millel on marsruut.',
  'help.guide.roadtrip-mode.step.2':
    'Riba ülaosas olev kaart näitab kogu reisi kokkuvõtet: „Vahemaa“, „Sõiduaeg“ ja „Peatused“. See jääb paigale, kui kerid päevi.',
  'help.guide.roadtrip-mode.step.3':
    'Selle all on kaart iga sõidupäeva kohta; päevad, kus sõitu pole, jäetakse välja. Kaardi päises on päeva number ja selle all kuupäev, seejärel sildid sõidu pikkuse ja aja ning päeva peatuste arvuga.',
  'help.guide.roadtrip-mode.step.4':
    'Kaardi sees on päev järjestusena: iga koha kohta nummerdatud peatus, iga paari vahel sõidulõik ja paremas servas saabumisaeg. Broneeritud lend, rong või praam on järjestuses eraldi kaardina.',
  'help.guide.roadtrip-mode.step.5':
    'Klõpsa päeva päisel, et see kokku panna; selle lõpus olev nool pöördub. Kokkupandud päev peidetakse ka kaardil. Klõpsa päisel uuesti, et see jälle näha.',
  'help.guide.roadtrip-mode.result':
    'Vasakus veerus on sõit ja kaardil kõik selle päevad. „Päevad“ viib otse tagasi plaani juurde, mis on muutmata.',
  'help.guide.roadtrip-mode.tip.1':
    'Valik salvestatakse iga reisi kohta sinu kontole, nii et pärast uuesti laadimist, teises brauseris või teises seadmes avaneb reis jälle autoreisi vaates.',
  'help.guide.roadtrip-mode.tip.2':
    'Lüliti on näha alles siis, kui administraator on halduspaneelis jaotises „Lisamoodulid“ sisse lülitanud lisamooduli „Autoreis“.',
  'help.guide.roadtrip-mode.tip.3':
    'Telefonis lülitit pole: lisamoodul lisab vahekaardi „Plaan“ kõrvale oma vahekaardi „Autoreis“.',
  // roadtrip-stops
  'help.guide.roadtrip-stops.title': 'Peatused teel ja peatumise kestus',
  'help.guide.roadtrip-stops.goal': 'Tee sõidul olevast kohast vahepeatus ja määra, kui kaua iga peatus kestab.',
  'help.guide.roadtrip-stops.step.1':
    'Klõpsa ribal peatuse ees oleval numbril. Selle silt on „Muuda vahepeatuseks“ ja klõps avab selle all peatuse tüübid värviliste ketaste reana.',
  'help.guide.roadtrip-stops.step.2':
    'Vali tüüp. Ketta nime näed, kui viid kursori sellele: „Majutus“, „Kütus“, „Laadimine“, „Puhkeala“, „Telkimisala“, „Toit“ või „Vaatamisväärsused“. Number asendub selle tüübi ikooniga ja allpool olevad peatused nummerdatakse ümber.',
  'help.guide.roadtrip-stops.step.3': 'Vahepeatus pole sihtkoht, seega on päeva päises peatusi ühe võrra vähem.',
  'help.guide.roadtrip-stops.step.4':
    'Klõpsa uuesti ikoonil „Muuda peatuse tüüpi“ ja vali „Muuda tagasi sihtkohaks“, et peatus saaks oma numbri tagasi.',
  'help.guide.roadtrip-stops.step.5':
    'Igal peatusel on märk „Peatus“, mis näitab plussi, kuni midagi pole planeeritud. Klõpsa sellel, et avada „Aeg selles peatuses“.',
  'help.guide.roadtrip-stops.step.6':
    'Määra kestus liuguriga, miinus- ja plussnupuga või mõne eelseadistusega. „Lahkumine“ muutub, „Saabumine“ jääb aga sõidu saabumisajale. Seejärel klõpsa „Salvesta“.',
  'help.guide.roadtrip-stops.result':
    'Muudetud peatuse märk „Peatus“ näitab uut kestust ja kõik järgnevad saabumisajad nihkuvad vastavalt. Peatus, mille muutsid mingiks tüübiks ja siis tagasi, on jälle nummerdatud sihtkoht.',
  'help.guide.roadtrip-stops.tip.1':
    'Viibimisaeg kuulub kohale, mitte ühele külastusele: kahel päeval planeeritud kohal on mõlemal päeval sama viibimisaeg.',
  'help.guide.roadtrip-stops.tip.2':
    'Vahepeatused on näha ka vaates „Päevad“. Kui lülitad sõiduseadetes jaotises „Teeninduspeatused“ välja valiku „Näita ka päevade vaates“, on need näha ainult vaates „Autoreis“.',
  'help.guide.roadtrip-stops.tip.3': 'Samas aknas olev „Peatumiseta“ eemaldab aja uuesti.',
  'help.guide.roadtrip-stops.tip.4':
    'Klõpsa vahepeatusel või broneeritud ööl, et avada selle infokaart kaardi peal. Kui „Autoreis“ on sisse lülitatud, avab seal olev „Muuda“ kohavormi asemel kompaktse akna, mida kasutab otsing, ja selle akna „Rohkem üksikasju“ avab täieliku vormi.',
  // roadtrip-corridor
  'help.guide.roadtrip-corridor.title': 'Leia marsruudi äärest kütust, toitu ja ööbimiskohta',
  'help.guide.roadtrip-corridor.goal': 'Otsi mööda teed, mida tegelikult sõidad, ja lisa leitu õigele lõigule.',
  'help.guide.roadtrip-corridor.step.1':
    'Ava jaotises „Otsitav“ loend ja märgi, mida vajad. Saad kombineerida valikuid „Kütus“, „Laadimine“, „Puhkeala“, „Telkimisala“, „Majutus“, „Toit“ ja „Vaatamisväärsused“: loend jääb teise valiku jaoks avatuks ja väljal on siis iga tüübi ikoon.',
  'help.guide.roadtrip-corridor.step.2':
    'Vali päev sama rea lõpus olevast rippmenüüst. Seal on päevad, mille kohta ribal on kaart, ja „Otsi“ ootab, kuni valitud päeva marsruut on arvutatud.',
  'help.guide.roadtrip-corridor.step.3':
    'Vali jaotises „Kaugusel kuni“, kui kaugelt tee mõlemalt poolt otsida, 2 km, 5 km või 10 km, ja klõpsa „Otsi“.',
  'help.guide.roadtrip-corridor.step.4':
    'Tulemused on rühmitatud tüübi järgi selles järjekorras, nagu neist möödud. Iga tulemuse juures on näha, kui kaugel see marsruudist on ja kui kaugel päeva sõidust see asub.',
  'help.guide.roadtrip-corridor.step.5':
    'Klõpsa tulemuse plussil „Lisa“. „Lisa peatusena“ näitab, millisele päevale ja millisesse kohta see lisatakse, ning küsib „Peatuse tüüp“ ja „Aeg selles peatuses“; laadija puhul on näha ka „Saadavus ja hinnad“. „Lisa“ lisab selle sõidule, „Rohkem üksikasju“ avab hoopis täieliku kohavormi.',
  'help.guide.roadtrip-corridor.result':
    'Lisatud peatus ilmub marsruudile kohta, kus sellest mööda sõidad, oma tüübi ikooniga. Päeva marsruut arvutatakse peatuse kaudu uuesti ja see tühjendab loendi: järgmise peatuse jaoks otsi uuesti.',
  'help.guide.roadtrip-corridor.tip.1':
    'Midagi ei otsita enne, kui vajutad „Otsi“: üks otsing saadab ühiskasutatavale teenusele palju päringuid.',
  'help.guide.roadtrip-corridor.tip.2':
    '„Filtreeri nime järgi“ filtreerib tulemusi ilma uue otsinguta ja „Tühjenda tulemused“ tühjendab loendi ning eemaldab selle nööpnõelad. Klõpsa tulemusel, et seda kaardil näha.',
  'help.guide.roadtrip-corridor.tip.3':
    'Tulemuse saab ka kaardilt marsruudile lohistada. Nii saad lõigu ise valida, kui sõidad sama teed kaks korda. Nupu „Otsi“ kõrval olev „Käsitsi“ lisab koha, mida otsing ei leidnud, otsides seda nime järgi.',
  // roadtrip-via
  'help.guide.roadtrip-via.title': 'Suuna lõik läbi vahepunkti',
  'help.guide.roadtrip-via.goal': 'Suuna lõik soovitud teele ilma peatust lisamata.',
  'help.guide.roadtrip-via.step.1':
    'Too soovitud teelõik kaardile: klõpsa ribal peatusel ja sulge siis kaardi peale avanev infokaart.',
  'help.guide.roadtrip-via.step.2':
    'Klõpsa joonistatud marsruudil. Klõpsatud teelõigule lisatakse vahepunkt ja lõigu marsruut arvutatakse selle kaudu uuesti.',
  'help.guide.roadtrip-via.step.3':
    'Riba uueneb: päeva päises on uus vahemaa ja sõiduaeg ning kõik vahepunkti järel olevad saabumisajad muutuvad vastavalt.',
  'help.guide.roadtrip-via.step.4':
    'Vii kursor pidemele, et näha, mida see teeb: marsruudi muutmiseks lohista, eemaldamiseks paremklõpsa. Lohista see mujale ja teelõik joonistatakse uue punkti kaudu uuesti.',
  'help.guide.roadtrip-via.step.5': 'Pideme eemaldamiseks tee sellel paremklõps. Lõik kasutab jälle otseteed.',
  'help.guide.roadtrip-via.result':
    'Lõik järgib valitud teed ning päeva vahemaa, sõiduaeg ja saabumisajad arvutatakse uuesti.',
  'help.guide.roadtrip-via.tip.1':
    'Vahepunkt pole peatus: sellel pole numbrit, viibimisaega ega saabumisaega ja seda ei loendata päeva peatuste hulka.',
  'help.guide.roadtrip-via.tip.2':
    'Pidemed on näha alles alates suumitasemest 9, nii et kogu reisi näitaval kaardil on joon ilma nendeta.',
  'help.guide.roadtrip-via.tip.3':
    'Klõpsu, mis on joonistatud teelõikudest kaugemal kui kaks kilomeetrit, eiratakse, samuti klõpsu lennul, rongil või praamil.',
  // roadtrip-alternatives
  'help.guide.roadtrip-alternatives.title': 'Proovi teelõigu läbimiseks teist teed',
  'help.guide.roadtrip-alternatives.goal':
    'Vaata, milliseid teisi marsruute marsruutija sõidu ühe osa jaoks pakub, ja vali üks.',
  'help.guide.roadtrip-alternatives.step.1':
    'Klõpsa külgribal sõiduribal, kahe peatuse vahelisel real, mis näitab lõigu vahemaad ja aega. Selle silt on „Muud marsruudid“.',
  'help.guide.roadtrip-alternatives.step.2':
    'Kaardi kohale avaneb „Selle lõigu sõiduvõimalused“, kus on iga tee kohta üks kirje koos pikkusega. Kaart joonistab iga tee koos sõiduajaga: praegune tee täissinisena, teised heledamas sinises.',
  'help.guide.roadtrip-alternatives.step.3':
    'Vii kursor kirjele, et see tee esile tõsta. „Praegune“ on tee, mida praegu kasutad, ja „Kiireim“ on kõige kiirem; teised näitavad, kui palju aeglasemad need on või millist teeklassi need väldivad.',
  'help.guide.roadtrip-alternatives.step.4':
    'Klõpsa kirjel, et seda marsruuti kasutada, või „Sulge“, et praegune marsruut alles jätta.',
  'help.guide.roadtrip-alternatives.result':
    'Teelõik kasutab nüüd valitud teed ning muutuvad ka vahemaa külgveerus ja sellele järgnevad saabumisajad.',
  'help.guide.roadtrip-alternatives.tip.1':
    'Kui valid teise tee, kontrollib TREK seda kõigepealt autoreisi marsruutijaga. Seejärel hoiab ta teelõiku sellel teel nii väheste vahepunktidega kui vaja ja asendab lõigu senised vahepunktid. Teed, mida marsruutija ei suuda järgida, ei salvestata. Kui valid marsruutija enda tee, eemaldatakse vahepunktid uuesti.',
  'help.guide.roadtrip-alternatives.tip.2':
    '„Kiirteeta“, „Teemaksudeta“ ja „Praamita“ tulevad teiselt mootorilt, millel on oma kiirusmudel, seega ei saa nende aegu teistega võrrelda.',
  // roadtrip-limits
  'help.guide.roadtrip-limits.title': 'Määra auto ja sõidupiirangud',
  'help.guide.roadtrip-limits.goal': 'Ütle TREKile, millise sõidukiga sõidad ja kui kaugele tahad ilma pausita sõita.',
  'help.guide.roadtrip-limits.step.1':
    '„Sõiduseaded“ on paremas veerus otsingu all. Selle märgid näitavad, mis on määratud; avamiseks klõpsa sellel.',
  'help.guide.roadtrip-limits.step.2':
    'Jaotises „Auto“ on „Pikim järjestikune sõit“ ja „Sõiduaeg päevas“ minutites. Tühi väli tähendab, et piirang on väljas ja midagi ei märgita.',
  'help.guide.roadtrip-limits.step.3':
    'Märgi jaotises „Sõiduk“, millega sõidad. „Bensiin“ tangib ainult kütusepeatustes, „Elektriline“ ainult laadimispeatustes, „Kumb tahes“ mõlemas.',
  'help.guide.roadtrip-limits.step.4':
    'Sisesta ise „Sõiduulatus ühe paagiga“ või „Sõiduulatus ühe laadimisega“. Või ava väljal „Täida kuni“ all „Arvuta auto andmetest“: see võtab „Paagi maht“ ja „Kulu“ või „Aku“, „Kulu“ ja „Aku kulumine“ ning arvutab sõiduulatuse.',
  'help.guide.roadtrip-limits.step.5':
    'Vasakus veerus olev „Võimaluse korral väldi“ on eelistus, mitte keeld: kui päeval muud teed pole, kasutatakse ikkagi seda teed ja päeva päises on selle kohta märkus.',
  'help.guide.roadtrip-limits.step.6':
    'Klõpsa „Sulge“. Kaardi märgid näitavad, mis on määratud, ja ribal on märgitud iga lõik ja iga päev, mis mõnda piirangut ületab.',
  'help.guide.roadtrip-limits.result':
    'Infokaardi märgid näitavad, mis on määratud, ning igal piirangut ületaval teelõigul ja päeval on ribal märk.',
  'help.guide.roadtrip-limits.tip.1':
    'Seaded kuuluvad reisile, nii et kõik reisil osalejad planeerivad sama auto ja samade piirangutega.',
  'help.guide.roadtrip-limits.tip.2':
    '„Täida kuni“ määrab, milleni peatusel paak või aku täidetakse, sest teel ei lae keegi 100 %-ni. Tankimis- või laadimispeatusel saab seda oma rea akumärgiga muuta.',
  'help.guide.roadtrip-limits.tip.3':
    'Jaotises „Marsruudijoon“ arvutab „Ühenda päevad“ marsruudi ka ühe päeva viimasest peatusest järgmise päeva esimesse peatusesse. „Alusta ja lõpeta iga päev oma peatumiskohas“ alustab ja lõpetab iga päeva nendeks öödeks broneeritud majutuses. „Igale päevale oma värv“ näitab iga päeva oma värviga.',
  // roadtrip-day-window
  'help.guide.roadtrip-day-window.title': 'Määra sõidupäevale algus ja lõpp',
  'help.guide.roadtrip-day-window.goal': 'Lõpeta sõit sinu valitud kellaajal ja määra, kus päev lõpeb.',
  'help.guide.roadtrip-day-window.step.1':
    'Ava paremas veerus „Sõiduseaded“ ja leia dialoogi vasakust veerust „Igapäevased sõiduajad“.',
  'help.guide.roadtrip-day-window.step.2':
    'Määra „Päeva algusaeg“. Üksi see midagi ei tee: vaja on mõlemat aega, nagu nende all olev märkus ütleb.',
  'help.guide.roadtrip-day-window.step.3':
    'Määra „Päeva lõpuaeg“. Nüüd peatub sõit sellel kellaajal ja jätkub järgmisel hommikul. Külgveerus on see näha ridadena „Päeva lõpp“ ja „Jätka teekonda“.',
  'help.guide.roadtrip-day-window.step.4':
    'Vali jaotises „Lõpeta päev“ kas „Marsruudil“, et lõpuajal tee peal peatuda, või „Viimases kohas“, et peatuda enne, kui järgmine sõit sellest mööda läheks.',
  'help.guide.roadtrip-day-window.step.5': 'Klõpsa „Sulge“. Kaardil „Sõiduseaded“ on need kaks aega märgina näha.',
  'help.guide.roadtrip-day-window.result':
    'Sõit jagatakse sinu määratud pikkusega sõidupäevadeks ja see, mis ei mahu, jätkub pärast viimast päeva arvutatud päevadel. Sinu päevi ja nende kohti ei muudeta.',
  'help.guide.roadtrip-day-window.tip.1':
    'Kui tühjendad kumma tahes aja, lülitub see funktsioon uuesti välja. Ajad, mille oled peatusele ise määranud, on alati eelisjärjekorras.',
  'help.guide.roadtrip-day-window.tip.2':
    'Kui igapäevased sõiduajad on määratud, on päevad alati ühendatud: sõidu ühe päeva viimasest peatusest järgmise päeva esimesse arvutab marsruut ja see läheb arvesse.',
  'help.guide.roadtrip-day-window.tip.3':
    'Iga päeva lõpp on kaardil ka markerina: kuu koos päeva numbriga. Lohista seda mööda marsruuti või mõnele kohale, et lõpetada päev mujal. Paremklõps sellel taastab automaatse lõpu. Selle dialoogi „Taasta automaatsed päevade lõpud“ tühistab kõik need muudatused. Päeva lõpetamiseks kindlas peatuses klõpsa peatusel ja lülita selle kaardil sisse „Lõpeta päev siin“.',
  // roadtrip-refuel
  'help.guide.roadtrip-refuel.title': 'Tankimine enne paagi tühjenemist',
  'help.guide.roadtrip-refuel.goal': 'Leia tankimiskoht marsruudi osal, kuhu auto veel jõuab, ja lisa see sõidule.',
  'help.guide.roadtrip-refuel.step.1':
    'Kui sõiduulatus on määratud, näitab külgveerg teelõigul, kus kütus või aku otsa saab, riba: „Siin saab paak tühjaks“ või elektriauto puhul „Siin saab aku tühjaks“. Selle all näed, kui kaugel lõigu algusest see on.',
  'help.guide.roadtrip-refuel.step.2':
    'Riba lambiikoon on nupp: „Otsi kütust“ või elektriauto puhul „Otsi laadimist“. See otsib tee äärest enne seda punkti ja otsingu ajal on kirjas „Otsimine marsruudi äärest…“.',
  'help.guide.roadtrip-refuel.step.3':
    'Näidatakse kuni kolme jaama, igaühe juures kaugus marsruudist ja see, kui palju sõiduulatust sul alles jääks.',
  'help.guide.roadtrip-refuel.step.4':
    'Pakkumise juures olev pluss lisab selle tankimispeatusena. „Lisa peatusena“ avaneb juba täidetud tüübi ja ajaga ning „Lisa“ paneb peatuse lõigule täpselt sinna, kus marsruut sellest tegelikult mööda läheb.',
  'help.guide.roadtrip-refuel.result':
    'Peatus ilmub õigele lõigule oma ikooniga ja sõiduulatust arvestatakse sellest peatusest uuesti. Riba liigub kohta, kus paak nüüd tühjaks saab, või kaob, kui jõuad sõidu lõppu ilma uue peatuseta.',
  'help.guide.roadtrip-refuel.tip.1':
    'Sõiduulatust arvestatakse viimasest tankimis- või laadimispeatusest, ka üle päevade. Sõiduki tüüp määrab, millised peatused lähevad arvesse: „Bensiin“ puhul ainult tanklad, „Elektriline“ puhul ainult laadimispunktid.',
  'help.guide.roadtrip-refuel.tip.2':
    'Otsing vaatab teed enne kohta, kus kütus otsa saab, jätab varu ja arvestab kõrvalepõiget kahekordselt, nii et iga pakutud koht on päriselt kättesaadav.',
  'help.guide.roadtrip-refuel.tip.3':
    'Kui tulemusi pole, saad uuesti otsida: lambi asemele tuleb „Proovi uuesti“, sest kohaotsing on ühiskasutatav teenus, mis vahel aegub.',
  // roadtrip-track
  'help.guide.roadtrip-track.title': 'Pane päev järgima imporditud rada',
  'help.guide.roadtrip-track.goal': 'Kasuta päeva sõiduks maalilist marsruuti, mille importisid GPX- või KML-rajana.',
  'help.guide.roadtrip-track.step.1': 'Klõpsa päeva päises märgil „Rada“. Aken avaneb selle päeva kohta.',
  'help.guide.roadtrip-track.step.2':
    'Vali rada. Iga raja juures on selle pikkus ja see, kas rada järgib selle päeva marsruuti või kui kaugel see on. Lähim rada on esimene.',
  'help.guide.roadtrip-track.step.3':
    'Klõpsa „Järgi seda rada“. TREK lisab vahepunktid sinna, kus sõit on rajast kõige kaugemal, arvutab marsruudi uuesti ja kordab seda mitu korda.',
  'help.guide.roadtrip-track.step.4':
    'Dialoog näitab, mitu vahepunkti lisati ja kui lähedal rajale sõit nüüd püsib, või et sõit järgis rada juba varem. All vasakul olev „Eemalda vahepunktid“ eemaldab need ja marsruudiplaneerija planeerib päeva uuesti. Dialoogi sulgemisel jääb rada alles.',
  'help.guide.roadtrip-track.result':
    'Päeva sõit järgib rada, mitte teed, mille marsruudiplaneerija oleks valinud. Raja nime näed, kui viid kursori märgile „Rada“. Kui vahepunktid hoiavad sõitu rajal, on märk ka esile tõstetud.',
  'help.guide.roadtrip-track.tip.1':
    'Dialoogis on reisi kohad, millel on teekond: GPX või KML, mis on imporditud valikuga „Impordi fail“ kohtade veerus vahelehel „Päevad“, kusjuures GPX-i puhul on märgitud „Marsruudid“ või „Rajad (koos teekonna geomeetriaga)“ ja KML-i puhul „Teekonnad (LineStrings)“. „Impordi fail“ on saadaval ainult siis, kui lisamoodul „Retked“ on välja lülitatud; kui „Retked“ on sees, saab GPX-ist retk, mida see dialoog ei näita. Kuni reisil pole rada, pole ühelgi päeval seda märki.',
  'help.guide.roadtrip-track.tip.2':
    'Raja järgimine asendab vahepunktid, mis päeva teelõikudel juba olid, nii et kujunda lõiku käsitsi pärast raja lisamist, mitte enne.',
  'help.guide.dateless-trip.step.1': 'Klõpsa „Uus reis“ ja anna reisile nimi.',
  'help.guide.edit-trip.tip.2':
    'Siin lisatud või eemaldatud reisikaaslased jõustuvad kohe, „Uuenda“ pole vaja klõpsata.',
  'help.guide.trip-reminder.result':
    'Saad meeldetuletuse valitud arv päevi enne reisi algust nendes kanalites, kuhu sulle teavitused tulevad.',
  'help.guide.upcoming-reservations.step.1':
    'Leia paremast veerust „Eelseisvad broneeringud“. Seal on kõigi sinu reiside kuus järgmist broneeringut, lähim eespool, koos kuupäeva, kellaaja ja tüübiga.',
  'help.guide.half-company-holiday.step.1': 'Lülita tööriistaribal sisse „Ettevõtte puhkepäev“.',
  'help.guide.edit-holiday-calendar.result': 'Ruudustik ja legend uuenevad kohe pärast iga muudatust.',
  'help.guide.person-color.result': 'Kõik selle inimese märgitud päevad on nüüd uues värvis.',
  'help.guide.answer-fusion-request.step.1':
    'Kui keegi on sind kutsunud, ava Vacay. Dialoog „Ühendamistaotlus“ avaneb ise.',
  'help.guide.log-for-partner.step.1': 'Klõpsa kaardil „Inimesi“ inimese nimel. Linnuke näitab, et ta on valitud.',
  'help.guide.dissolve-fusion.step.1': 'Ava „Seaded“.',
  'help.guide.country-places.step.2': 'Klõpsa kaardil nööpnõelaga märki „Kohad“.',
  'help.guide.search-place.tip.2': 'Kui piirkond on juba märgitud, küsib hüpikaken hoopis, kas see eemaldada.',
  'help.guide.tour-activity-stats.step.4':
    'Paremal olevad märgid näitavad, millel summad põhinevad: „Plaanis“ retkede puhul, mida arvestatakse sinu reisiplaani järgi, „Salvestatud“ retkede puhul, millel on seotud tegelik rada. „Veel ees“, „Päevata“ ja „Kuupäevata“ loendavad retki, mida veel arvesse ei võeta. Nupp i selgitab reeglit.',
  'help.guide.move-to-list.step.2':
    'Klõpsa „Kopeeri nimekirja“, et need jääksid ka siia, või „Teisalda nimekirja“, et need sellest nimekirjast eemaldada.',
  'help.guide.accept-list-invite.title': 'Nimekirja kutse vastuvõtmine',
  'help.guide.tour-collection-add-to-trip.step.3':
    'Vali jaotises „Teekonnapunktid“ teekonnapunktidega lahter, et lisada algus, peatused ja lõpp nende järjekorras, või „Ainult joon“, et lisada ainult salvestatud joon.',
  'help.guide.tour-collection-manage.step.1':
    'Ava nimekiri. Iga salvestatud retke juures on näha selle raskusaste, tüüp, reis, millest see salvestati, vahemaa ja tõus ning teekonnapunktide arv. Vii kursor reisi nimele, et näha, kes retke salvestas.',
  'help.guide.entry-draft.step.1': 'Lülita redaktori paremas veerus sisse „Mustand“.',
  'help.guide.journey-map-layers.step.3':
    'Klõpsa kaardil õõnsal nööpnõelal või väikesel täpil. Avanevalt kaardilt näed, mis see on: plaanitud koht koos päevaga või peatumine nupuga „Ava sissekanne“, mis viib päevaülevaatesse, kuhu see kuulub.',
  'help.guide.journey-keep-route.step.3': 'Klõpsa „Hoia teekond“.',
  'help.guide.journey-day-stays.step.3':
    'Klõpsa peatumisel, mida sa ei soovi, „Ma pole seda kohta külastanud“. Peatumine eemaldatakse loendist.',
  'help.guide.journey-take-over-day.step.3':
    'Kui tahad kogu päeva kohta üht sissekannet, lülita „Sissekanded“ valikule „Päevaülevaade“: üks sissekanne loetleb kõik valitud peatumised koos kellaaegadega.',
  'help.guide.journey-auto-prepare.step.2':
    'Lülita jaotises „Salvestatud päevad“ sisse „Valmista salvestatud päevad automaatselt ette“.',
  'help.guide.photo-location.step.2': 'Lülita jaotises „Fotod“ sisse „Paiguta sissekanded fotode järgi“.',
  'help.guide.link-trip.tip.3':
    'Kui kirjutad sissekannet reisi päevale, mis pole veel seotud, pakub redaktor otse sissekandes valikut „Seo reis“.',
  'help.ctx.settings-plugins.summary':
    'Sinu isiklikud seaded administraatori paigaldatud pluginatele: võtmed ja eelistused, mida iga plugin küsib, ning logi sellest, mida pluginad sinu nimel tegid. Vaheleht on näha ainult siis, kui mõni plugin on aktiivne.',
  'help.ctx.settings-about.bullet.3':
    'Ko-fi, „Osta mulle kohv“ ja Discordi kaudu saad TREKi toetada või selle tegijatega suhelda.',
  'help.guide.language-region.step.3':
    'Määra „Kuvamisvaluuta“ või jäta „Reisi valuuta“, et näha iga reisi tema enda valuutas. Seejärel vali „Temperatuuriühik“, „Vahemaaühik“, „Ajavorming“ ja „Nädala alguspäev“.',
  'help.guide.travel-map-prefs.step.3':
    '„Avasta kaardil kohti“ näitab kategooriasilti lähedal asuvate kohtade leidmiseks. „Hägusta broneerimiskoodid“ peidab kinnitusnumbrid, kuni viid kursori nende kohale või puudutad neid. „Optimeeri marsruut majutuskohast“ alustab ja lõpetab päeva sinu hotellis.',
  'help.guide.web-push-device.step.2':
    'Ülal kaardil „Teavitused“ määrab veerg „Tõuketeavitus“, millised sündmused sinu seadmetesse saadetakse.',
  'help.guide.connect-airtrail.goal': 'Lase TREKil importida ja sünkroonida lende sinu enda AirTrailist.',
  'help.guide.connect-dawarich.goal': 'Lase TREKil lugeda sinu enda Dawarichist, kus sa tegelikult käisid.',
  'help.guide.tour-connect-wanderer.goal':
    'Lase TREKil lugeda sinu enda wandereri radu, et saaksid need retkedena importida.',
  'help.guide.tour-wanderer-watch.title': 'Teavitus, kui sinu wandereri rajad muutuvad',
  'help.guide.plugin-settings.tip.2':
    'Jaotise „Teavitused“ all oleval plugina kanalil on nupp „Seadista“, mis avab selle lehe.',
  'help.guide.default-user-settings.result':
    'Uued kontod ja kõik, kes pole neid seadeid kunagi muutnud, näevad sinu valikuid.',
  'help.guide.own-routing-engine.goal':
    'Arvuta päevade ja autoreiside marsruudid avalike serverite asemel oma OSRM- või Valhalla-serveriga.',
  'help.guide.admin-passkeys.tip.1':
    'Kui TREK ei suuda veel domeeni tuvastada, annab hoiatus sellest teada ja pääsuvõtmed jäävad peidetuks, kuni määrad APP_URL-i või Relying Party ID.',
  'help.guide.rotate-jwt-secret.step.1':
    'Klõpsa vahelehe „Seaded“ allosas jaotises „Ohutsoon“ rea „Roteeri JWT saladus“ kõrval nuppu „Vaheta“.',
  'help.guide.storage-backends.tip.3':
    'TREK saab fotode vahemälu uuesti alla laadida, nii et selle peegeldamine raiskab tavaliselt salvestusruumi.',
  'help.guide.admin-channels.step.3':
    'Allpool kaardil „Teavitused“ vali iga sündmuse jaoks kanalid, mis selle saadavad: „Uus versioon saadaval“, „Salvestuskoopia tõrge“ ja „Aerutamispiirkonda taotleti“. Iga lüliti salvestub kohe.',
  'help.guide.notification-defaults.tip.1':
    '„Väljas“ on vaikeväärtus, mille iga kasutaja saab ikkagi sisse lülitada; „Blokeeritud“ lülitab selle kõigi jaoks välja.',
  'help.ctx.notifications.bullet.4':
    'Iga teavituse kellaaja kõrval olevad „Märgi loetuks“ (topeltlinnuke) ja „Kustuta“ (prügikast) mõjutavad ainult seda teavitust. Ülal olevad „Märgi kõik loetuks“ ja „Kustuta kõik“ mõjutavad kogu loendit.',
  'help.guide.read-notifications.tip.2':
    'Nuputa teavitus on ainult teadmiseks. Loe see paneelis läbi ja märgi seal loetuks.',
  'help.guide.filter-notifications.result': 'Loendis on ainult veel lugemata teavitused, uusimad eespool.',
  'help.guide.delete-notifications.title': 'Teavituste kustutamine',
  'help.guide.notification-settings.goal':
    'Otsusta, millised sündmused ilmuvad kellaikooni alla ja millised saadetakse sulle ka e-posti, veebihaagi, ntfy või tõuketeavituse kaudu.',
  'help.guide.public-link.step.4': 'Klõpsa „Loo link“, seejärel „Kopeeri“ ja saada link edasi.',
  'help.guide.link-journal.step.2': 'Klõpsa „Päeviku sidumine“ ja vali aknas „Vali päevik“ üks oma päevikutest.',
  'help.guide.dawarich-stays.title': 'Salvestatud peatumisest koha loomine',
  'help.guide.dawarich-stays.tip.2':
    'Kui kustutad koha, mis loodi peatumisest, naaseb peatumine loendisse ootel olekus.',
  'help.guide.leave-stop-off-route.goal':
    'Hoia peatus päevas, ilma et marsruut sinna viiks, kui see on koht, millest möödud jalgsi või mida tahad näha ainult kaardil.',
  'help.guide.day-route.tip.4':
    'Kui tahad peatust päeva, aga mitte marsruudi sisse, vali selle menüüst „Jäta marsruudist välja“.',
  'help.guide.move-booking-day.step.2':
    'Lohista rida teise päevakaardi päisele. Ühepäevane broneering liigub tervikuna sellele päevale. Mitmepäevase broneeringu puhul muudab rida „Väljumine“ alguspäeva ja rida „Saabumine“ lõpupäeva.',
  'help.guide.place-image-from-file.title': 'Lisatud foto kasutamine koha pildina',
  'help.guide.place-image-from-file.tip.2':
    'Pakutakse ka fotot, mis on peatusele kinnitatud või selle broneeringule lisatud.',
  'help.guide.place-own-hours.step.5':
    'Klõpsa „Uuenda“. Kaardil on nüüd jaotises „Lahtiolekuajad“ sinu ajad ning ülal olev „Avatud“ või „Suletud“ põhineb neil.',
  'help.guide.confirm-stay-booking.step.3':
    'Klõpsa ülal „Ootel“. Selle vihjes on „Määra olekuks Kinnitatud“ ja täpp muutub roheliseks.',
  'help.guide.map-nearby-places.tip.4':
    'Kategooria, mille otsing ebaõnnestus, saab punase täpi ning „Otsi sellest piirkonnast“ muutub punaseks ja sellele ilmub hoiatusmärk: klõpsa sellel, et uuesti proovida.',
  'help.guide.tour-map-lines.tip.1':
    'Kui paned päevade veerus mõne päeva kokku, peidetakse kaardil selle päeva retked ja peatused.',
  'help.guide.car-stops.step.3':
    'Kirjuta päisesse pealkiri. Vali jaotises „Marsruut“ väljal „Lähtekoht“, kust auto kätte saad, ja väljal „Sihtkoht“, kuhu selle tagastad; reisi enda kohti pakutakse juba enne kirjutamist. „Kättesaamine“ ja „Kättesaamise aeg“ näitavad, millal auto kätte saad, „Tagastamine“ ja „Tagastamise aeg“, millal selle tagastad.',
  'help.guide.transport-details.step.1':
    'Klõpsa vahelehel „Transport“ kaardil. Selle üksikasjad avanevad vahelehe peal ja päis on kaardiga sama värvi. Sama vaate avab ka transpordi rida päevaplaanis.',
  'help.guide.export-transports-csv.tip.2':
    'Vahelehel „Broneeringud“ on sama ikoon, mis loob eraldi faili, mille nimi lõpeb osaga bookings.csv.',
  'help.guide.group-sort-bookings.step.2':
    'Vali jaotises „Rühmita“ „Olek“, „Päev“, „Tüüp“ või „Ära rühmita“. Vaheleht jaguneb kohe vastavateks jaotisteks.',
  'help.guide.export-bookings-csv.result':
    'Brauser laadib alla faili, mille nimi koosneb reisi ja vahelehe nimest, näiteks autumn-in-japan-bookings.csv, ja milles on rida iga vahelehel näidatud broneeringu kohta.',
  'help.guide.arrange-packing-list.result':
    'Nimekirjad on selles järjekorras, kuhu need lohistasid, ja esemed on järjestatud A kuni Ü, kuni selle välja lülitad. TREK salvestab siiski ka sinu enda järjekorra.',
  'help.guide.count-packed-pieces.step.2':
    'Koguse ette ilmub loendur 0/5 koos miinuse ja plussiga. Klõpsa plussil iga tüki eest, mis kotti läheb.',
  'help.guide.expense-receipts.step.4':
    'Pearaamatus on real nüüd nime kõrval silt „Kviitung“, mitme kviitungi korral koos arvuga sulgudes. Klõpsa sellel, et kviitung avada.',
  'help.guide.final-budget.tip.3':
    'Reisilt lahkunud inimene jääb jaotistesse „Saldod“ ja „Lõplik eelarve“ seni, kuni tal on veel raha saada või maksta.',
  'help.guide.files-sync-settings.step.2':
    'Vooriba näitab TREKi ja sinu salvestusteenust koos dokumentidega, mis kummaski on, ning nende vahel kahte rada: „Salvestusteenusesse“ ja „Salvestusteenusest“. Klõpsa „Salvestusteenusesse“, et see välja lülitada. Rada muutub halliks ja radade all on kirjas „Ainult sissetulev“. Klõpsa uuesti, et see taas sisse lülitada.',
  'help.guide.files-sync-settings.tip.4':
    'Seda kõike saab muuta ainult reisi omanik või administraator. Teised liikmed näevad vooriba koos reaga, näiteks „Dokumendid liiguvad mõlemas suunas“, kuid mitte nuppu „Seaded“.',
  'help.guide.manage-notes.step.2':
    '„Laienda“ avab kogu märkme: täisteksti, selle „Veebisait“ ja „Failid“. Klõpsa failil, et näha eelvaadet. All olev „Muuda“ avab kohe redaktori; rist paremas ülanurgas sulgeb märkme.',
  'help.guide.note-categories.goal':
    'Anna grupi märkmetele nimega ja värviga kategooriad ning näita korraga ühte kategooriat.',
  'help.guide.note-categories.tip.1':
    'Prügikast eemaldab ainult kategooria, mida ükski märge ei kasuta. Kasutusel olev kategooria jääb loendisse, kuni oled need märkmed teise kategooriasse teisaldanud.',
  'help.guide.roadtrip-reorder.title': 'Peatuse ümberjärjestamine või teisele päevale viimine',
  'help.guide.roadtrip-reorder.tip.3':
    'Kinnitatud kellaaja kohta TREK ei küsi: riba arvutab päeva kohe ümber ja märgib iga peatuse, kuhu enam õigeks ajaks ei jõua.',
  'help.guide.roadtrip-overnight.step.3':
    'Dialoogi ülaosas lisab „Ööbimine“ öö ja „Paus“ teeb sellest mõneks ajaks peatuse. Hotelli puhul avaneb „Ööbimine“, laagriplatsi puhul „Paus“. Ööbimise puhul küsitakse ainult „Sisseregistreerimine“ aega, mille võid ka tühjaks jätta.',
  'help.guide.roadtrip-stop-fill.step.1':
    'Klõpsa ribal tankimis- või laadimispeatuse akumärgil. See näitab taset, milleni peatusel tangitakse või laetakse: tuhmilt, kui kasutatakse sinu väärtust „Täida kuni“, ja täisvärvis, kui peatusel on oma väärtus.',
  'help.guide.roadtrip-bookings.step.1':
    'Lisa sõidu päevale broneering tüübiga „Lend“, „Rong“, „Praam“, „Kruiis“ või „Buss“ ja määra mõlema otsa asukoht. Autosõit arvestab sellega automaatselt: tee lõpeb terminalis, kust sõit väljub, ja jätkub seal, kuhu see saabub.',
  'help.guide.roadtrip-google-import.result':
    'Marsruudi peatused lisatakse selle päeva viimase peatuse järele ning marsruut ribal ja kaardil läbib neid.',
  'help.guide.roadtrip-hazards.step.3':
    'Hoiatused on kaardil alad. Klõpsa neist ühel, et näha, millega on tegu, milline teenus sellest teatas ja millal seda viimati uuendati.',
  'help.ctx.trip-tours.bullet.2':
    'Ülal olev „Impordi GPX või KML“ toob failid retkedena sisse. Selle all olev filtrinupp (alguses „Kõik“ koos retkede arvuga) kitsendab loendit oleku, allika, marsruudipiirangu ja tüübi järgi.',
  'help.guide.tour-show-list.step.2':
    'Iga rida on üks retk. Värviline riba on retke joon kaardil ja ümmargune ruut näitab TREKis planeeritud matka marsruudipiirangut (T1 kuni T6) või retke tüübi ikooni. Nime all olevad märgid näitavad päevi, millel retk on, selle aega, vahemaad ja tõusu. Mitmepäevase retke puhul näitab numbriga kuu, mitu etappi sellel on.',
  'help.guide.tour-add-to-day.title': 'Retke panemine päevale',
  'help.guide.tour-add-to-day.tip.2':
    'Kui reis lõpeb enne viimast etappi, näitab valik viimast etappi, mis veel mahub, ja sellele järgnevad etapid jäävad päevata.',
  'help.guide.tour-day-times.step.3':
    'Klõpsa „Uuenda“. Real on nüüd algus → lõpp. Arvutatud lõpuaeg on heledam: ≈ tähistab hinnangut, ≥ näitab, et mõnel peatumisel pole veel kellaaega, ja +1 tähendab pärast südaööd. Vii kursor sellele, et näha, kuidas see arvutati.',
  'help.guide.tour-remove-from-day.goal': 'Võta retk plaanist välja, seda kustutamata.',
  'help.guide.tour-filter-list.goal':
    'Kitsenda pikk loend soovitud retkedeni: veel planeerimata, failist või ühte tüüpi.',
  'help.guide.tour-filter-list.result': 'Loendis on ainult filtreeritud retked; ülejäänud on endiselt reisis.',
  'help.guide.tour-hide-on-map.result':
    'Kaardil on ainult retked, mida soovid näha, ja peidetud retked jäävad loendisse tuhmina.',
  'help.guide.tour-import-plan-tab.result': 'Rada on nüüd reisi retk: loendis rida GPX-märgiga ja kaardil joon.',
  'help.guide.tour-detail-read.title': 'Retke avamine ja selle kaardi lugemine',
  'help.guide.tour-detail-read.step.7': 'Sulge kaart ülal oleva X-iga või vajuta klahvi Escape.',
  'help.guide.tour-rename-colour.goal': 'Anna retkele äratuntav nimi ja joonevärv, mis kaardil hästi silma paistab.',
  'help.guide.tour-take-along.title': 'Retke allalaadimine telefoni või GPS-seadmesse',
  'help.guide.tour-take-along.tip.4':
    'Vahelehel „Retked“ on sama allalaadimine vasaku veeru ülaosas. Kui retkel on salvestamata muudatusi, palub allalaadimine need enne salvestada.',
  'help.guide.tour-copy-keep.tip.1':
    'Mõlemad on koopiad: retke hilisemad muudatused ei muuda ei koopiat ega kogumikku salvestatud versiooni.',
  'help.guide.tour-packing-link.step.2':
    'Vali jaotises „Lingi sihtkoht“ „Kogu pakkimisnimekiri“ või üks selle nimekirjadest. Igal real on näha, mitu eset selles on.',
  'help.guide.tour-files.title': 'Failide lisamine retkele',
  'help.guide.tour-activity-link.title': 'Tegelikult läbitud raja sidumine',
  'help.guide.tour-activity-link.tip.2':
    'Siduda saab ainult imporditud rada, mida pole retke planeerimiseks kasutatud, ja iga rada saab siduda ainult ühe retkega.',
  'help.guide.tour-activity-compare.step.4':
    'Raja all olev „Muuda“ valib teise salvestuse. „Eemalda seos“ eemaldab selle retkelt ja rada jääb reisi impordina alles.',
  'help.guide.tour-origin-check.step.3':
    'Vahelehel „Retked“ joonistatud retke juures on kirjas „Planeeritud rakenduses TREK“ ja väljal „Loodud“ loomise päev.',
  'help.ctx.trip-tour-planner.bullet.2':
    'Vasak riba on redaktor. Kui midagi pole avatud, pakub see „Planeeri uus retk“. Avatud retke puhul on näha selle nimi, tüüp, teekonnapunktid, tüübile omased kaardid ja üksikasjad ning all nupud „Loobu“ ja „Salvesta“.',
  'help.guide.tour-open-workspace.step.2':
    'Vasak riba on redaktor. Kui ükski retk pole avatud, pakub see „Planeeri uus retk“, millega alustad kaardil uut retke.',
  'help.guide.tour-open-workspace.tip.3':
    'Kui avad teise retke ajal, mil redaktoris on salvestamata muudatusi, küsitakse enne: „Loobu muudatustest“ või jätka muutmist.',
  'help.guide.tour-draw-route.step.5':
    'Klõpsa järgmistel kohtadel selles järjekorras, nagu neid läbid. Iga klõps lisab punkti uueks lõpuks ja alates kahest punktist planeerib TREK marsruudi mööda radu.',
  'help.guide.tour-type-profile.goal':
    'Vali retke tüüp ja rattaretke puhul ka profiil, et marsruut kulgeks õigeid teid pidi.',
  'help.guide.tour-edit-points.title': 'Punktide liigutamine, ümberjärjestamine ja eemaldamine',
  'help.guide.tour-edit-points.tip.1':
    'Esimesel punktil on märk „Algus“ ja viimasel „Lõpp“. Kui liigutad punkti esimeseks või viimaseks, saab sellest algus või lõpp.',
  'help.guide.tour-shaping-points.step.4':
    'Peatuse muutmiseks kujunduspunktiks või vastupidi ava selle real „Rohkem toiminguid“ ja vali „Tee kujunduspunktiks“ või „Tee peatuseks“.',
  'help.guide.tour-loop-reverse.step.2':
    'Viimasel real on nüüd „Tagasi algusesse“ ja marsruut kaardil lõpeb seal, kus see algas.',
  'help.guide.tour-leg-by-hand.step.1':
    'Ava lõigu alguspunkti juures „Rohkem toiminguid“ ja vali „Joonista järgmine lõik käsitsi“.',
  'help.guide.tour-trip-places.goal': 'Lisa reisis juba planeeritud koht retke peatuseks.',
  'help.guide.tour-trip-places.result': 'Retkel on uus peatus reisi koha jaoks, sama nimega.',
  'help.guide.tour-details-times.tip.2':
    'Matka puhul on jaotises „Üksikasjad“ ka „Raja suurim raskusaste“ ja „Marsruudi valik“, mida matkajuhendid selgitavad. Linnajalutuskäigul pole välja „Pausid“: selle asemel arvestatakse peatustes viibitud aega.',
  'help.guide.tour-save.step.4': 'Retk on nüüd jaotises „Selle reisi retked“, veel ilma päevata.',
  'help.guide.tour-edit-saved.step.2':
    'Muuda, mida vaja, nagu uue retke puhul: liiguta või lisa punkte, vaheta tüüpi või muuda üksikasju, nagu siin „Kirjeldus“.',
  'help.guide.tour-summary-profile.goal':
    'Vaata, kui pikk ja järsk retk on ning millises marsruudi kohas milline kõrgus on.',
  'help.guide.tour-summary-profile.result':
    'Tead, kui pikk retk on, kui palju tõusu sellel on, kui kaua see aega võtab ja kus see järsuks muutub.',
  'help.guide.tour-list-manage.tip.1':
    'Iga retk läheb kogusummasse üks kord, ka siis, kui see on mitmel päeval. Summa, mille ees on ≥, ei sisalda mõnda retke. Vii kursor sellele, et näha, mitut.',
  'help.guide.tour-delete.tip.1': 'Seda ei saa tagasi võtta ja „Võta tagasi“ retke tagasi ei too.',
  'help.guide.tour-saved-elsewhere.step.3':
    'Kui klõpsad siiski „Salvesta“, avaneb hoopis „Vahepeal muudetud“ ja midagi üle ei kirjutata.',
  'help.ctx.trip-tour-import.bullet.2':
    '„Impordi eelvaade“ näitab enne salvestamist kaardil kõiki failides olevaid radu koos vahemaa, tõusu, languse ja punktidega. Jaotises „Impordi kui“ määrad, mis rajad need on.',
  'help.guide.tour-import-gpx.step.3':
    'Avaneb „Impordi eelvaade“ ja midagi pole veel salvestatud. Kaardil on näha kogu kulg ning iga failides olev rada on nummerdatud rida koos vahemaa, tõusu, languse ja punktidega. Salvestatud raja puhul on näha ka, millal see tehti ja kui kaua see kestis.',
  'help.guide.tour-import-gpx.result':
    'Retk on jaotises „Selle reisi retked“, veel ilma päevata. Üksik retk avaneb kohe kaardil GPX-retkena.',
  'help.guide.tour-view-import.tip.3': 'wandereri rada avaneb samamoodi, wanderer-retkena.',
  'help.guide.tour-plan-from-import.tip.1': '„Loobu“ eemaldab soovituse. Midagi ei salvestata enne, kui salvestad.',
  'help.guide.tour-restore-recorded.step.2': 'Klõpsa „Taasta salvestatud rada“.',
  'help.guide.tour-take-over.step.2': 'Vali „Võta matk üle teiselt reisilt“.',
  'help.guide.tour-take-over.result': 'Teade kinnitab ülevõtmist ja retk avaneb redaktoris, valmis päevale panemiseks.',
  'help.guide.tour-import-wanderer.tip.2':
    'Import on koopia: hilisemad muudatused wandereris retke ei muuda. Retke jaotises „Päritolu“ olev „Kontrolli allikat“ annab teada, kui rada on muutunud.',
  'help.ctx.trip-tour-map.bullet.3':
    'Kaardi ülaosas olev „Otsi kohta või aadressi“ viib kaardi linna, onni või tipu juurde, retkele midagi lisamata.',
  'help.guide.tour-map-layers.result':
    'Retk on joonistatud talle sobivale kaardile ja silt näitab, milline kaart on sees.',
  'help.guide.tour-along-search.step.3':
    'Vali jaotises „Selle kaugusega marsruudist“, kui kaugelt joonest otsida: 250 m, 500 m, 1 km või 2 km.',
  'help.guide.tour-along-add-stop.goal': 'Suuna retk läbi vaatepunkti, onni või allika, mille leidsid selle äärest.',
  'help.guide.tour-along-add-stop.tip.3':
    'Lõik, kuhu peatust lisada ei saa (kindla joonena lisatud via ferrata või ülekanne või käsitsi joonistatud lõik), jääb loendis tuhmiks ja selle kõrval on põhjus.',
  'help.guide.tour-3d-terrain.result':
    'Oled näinud retke 3D-maastikul koos värviliste järskude lõikudega ja planeerimiseks on lame kaart tagasi.',
  'help.guide.tour-3d-flyover.step.3':
    '„Paus“ peatab lennu seal, kus see on, ja „Esita ülelend“ jätkab sealt. „Alusta otsast“ viib tagasi algusesse ja alustab lendu uuesti.',
  'help.guide.tour-map-overlays.step.1':
    'Ava suusaretk vahelehel „Retked“. Nõlvad on kohe näha: nende lüliti on all vasakul oleva sildi „Nõlvad, suusarajad ja tõstukid“ lumine mägi. Klõpsa sellel, et need kaardil peita, ja uuesti, et neid näidata.',
  'help.ctx.trip-tour-stages.title': 'Mitmepäevased retked',
  'help.guide.tour-multi-day.goal': 'Jaga üks marsruut etappideks, üks iga päeva kohta, mil oled teel.',
  'help.guide.tour-multi-day.tip.2':
    'Kahe etapi uuesti ühendamiseks vali kuuga peatuse menüüst „Eemalda etapi lõpp“. Ka selle peatuse eemaldamine ühendab need ja teade pakub võimalust „Võta tagasi“.',
  'help.guide.tour-stages-on-days.step.3':
    'Vali „Etapid alates sellest päevast“: 1. etapp läheb sellele päevale ja iga järgmine etapp järgmisele päevale. „Kogu matk sellel päeval“ paneb hoopis kogu marsruudi sellele ühele päevale.',
  'help.guide.tour-stages-on-days.result': 'Iga etapp on oma reisipäeval ja avatud etapp on redaktoris.',
  'help.ctx.trip-tour-hike.bullet.6':
    'Paremal olev „Retke kokkuvõte“ näitab vahemaad, tõusu, hinnangulist kõndimis- või jooksuaega, pause ja planeeritud koguaega ning nende all kõrgusprofiili. Redaktori allosas olev „Salvesta“ salvestab retke.',
  'help.guide.tour-hike-plan.step.6': 'Klõpsa vasaku veeru allosas „Salvesta“.',
  'help.guide.tour-hike-trail-details.step.1':
    'Ava matk jaotisest „Selle reisi retked“ ja leia kaardi „Teekonnapunktid“ alt „Raja üksikasjad“. Lülita sisse „Näita mööda marsruuti“.',
  'help.guide.tour-hike-trail-details.tip.3':
    'See kaart retke ei muuda ja vajab ühendust. Imporditud matka vaates on sama kaart, ilma marsruudipiiranguta.',
  'help.guide.tour-hike-round.result':
    'Matk järgib valitud ringi tagasi alguspunkti. Kaardi all olevas teates „Ring valitud“ on „Võta tagasi“ ja „Salvesta“ jätab ringi alles.',
  'help.guide.tour-hike-compare-ways.step.3':
    'Rea märgid näitavad, kui palju pikem, kõrgem või aeglasem see on praegusest teest. Klõpsa sellel, mida soovid.',
  'help.guide.tour-ferrata-add.step.1':
    'Kui matk on avatud, klõpsa all vasakul kaardinuppude reas „Via ferrata rajad“. Märk näitab vaates olevate via ferrata radade arvu; kui seda palutakse, suumi sisse.',
  'help.guide.tour-ferrata-add.tip.3':
    'Via ferrata lõik on kõrgusprofiilil esile tõstetud, nii et näed, millal päeva jooksul sinna jõuad.',
  'help.guide.tour-run-plan.step.5': 'Anna jooksule väljal „Retke nimi“ nimi ja klõpsa „Salvesta“.',
  'help.guide.tour-run-ways.step.1':
    'Ava jooks jaotisest „Selle reisi retked“ ja lülita kaardi „Teekonnapunktid“ all olevas jaotises „Raja üksikasjad“ sisse „Näita mööda marsruuti“.',
  'help.ctx.trip-tour-walk.bullet.1':
    'Matka tüüp „Linna- / vaatamisväärsuste jalutuskäik“ muudab retke jalutuskäiguks. Selle punktid on peatused, millel on „Nimetus“, viibimisaeg ja tähtsus. Jalutuskäigul pole matkapiirangut ega välja „Pausid“: selle asemel arvestatakse viibimisaegu.',
  'help.guide.tour-walk-plan.step.2':
    'Lisa peatused: kontrolli, et „Lisa punkt“ on sees, ja klõpsa kaardil iga peatuse kohal või klõpsa „Reisi kohad“, et võtta koht, mis reisis juba on.',
  'help.guide.tour-walk-plan.result':
    'Jalutuskäigus on loetletud peatused koos viibimisaegadega ja „Retke kokkuvõte“ liidab need kokku. Pane jalutuskäik päevale, et näha, millal igasse peatusesse jõuad.',
  'help.guide.tour-walk-sights.tip.1': 'Sellest saab jalutuskäigu peatus, mitte reisi koht.',
  'help.guide.tour-walk-day-times.step.3':
    'Ava jalutuskäik vahelehel „Retked“ uuesti. Jaotise „Teekonnapunktid“ ülaosas näitab „Ajad päeval“ päeva ja selle algusaega. Mitmele päevale planeeritud jalutuskäigu puhul klõpsa sellel, et valida teine päev.',
  'help.guide.tour-walk-google-import.goal':
    'Kleebi Google Mapsist jagatud jalutusmarsruut ja laadi selle peatused jalutuskäiguna.',
  'help.guide.tour-walk-google-import.result':
    'Redaktoris avaneb uus linnajalutuskäik Google Mapsi peatustega, valmis salvestamiseks.',
  'help.guide.tour-walk-check-off.tip.2': 'Jalutuskäigu rida päevaplaanis näitab samuti arvu, näiteks 3/7.',
  'help.ctx.trip-tour-bike.bullet.4':
    'MTB-profiilil näitab sama kaart radade raskusastmeid (mtb:scale), kui kaardistajad on need lisanud. Raskusastmeta tee on teadmata, mitte lihtne.',
  'help.guide.tour-bike-profile.step.6':
    'Kirjuta nimi väljale „Retke nimi“, seejärel klõpsa vasaku riba allosas „Salvesta“.',
  'help.guide.tour-bike-surfaces.goal':
    'Uuri, kui suur osa marsruudist on asfalt, kruus või teadmata kattega ja milliseid teid see läbib.',
  'help.guide.tour-bike-surfaces.tip.3':
    'Kaart kasutab marsruuti nii, nagu marsruudiplaneerija selle koostas, ega muuda retkel midagi. See vajab ühendust; võrguühenduseta annab see sellest teada ja marsruut jääb muutmata.',
  'help.guide.tour-bike-mtb-grades.tip.1':
    '„Andmetes raskust pole“ tähendab teadmata, mitte lihtne. Raskusaste ei ütle midagi selle kohta, kas rada sulle sobib.',
  'help.ctx.trip-tour-ski.bullet.3':
    'Iga kaardil klõpsatud punkt ühendatakse eelmisega mööda nõlvu, tõstukeid ja radu. Iga punkti all on selle lõik siltidena: nõlvad oma raskusastme värvis ja koos minutitega. Lõik, mida ei saa planeerida, muutub punaseks, ütleb põhjuse ja pakub parandust või valikut „Joonista sirgelt“.',
  'help.guide.tour-ski-plan.step.4':
    'Kontrolli, et „Lisa punkt“ on sees, seejärel klõpsa järjest kaardil alguskohal ja igal kohal, kuhu tahad jõuda. Nõlvade marsruudiplaneerija ühendab iga punkti eelmisega mööda nõlvu, tõstukeid ja radu.',
  'help.guide.tour-ski-options.title': 'Ütle nõlvade marsruudiplaneerijale, kuidas suusatad',
  'help.guide.tour-ski-options.tip.2':
    '„Kasuta tõstukeid“ on vaikimisi sees alade „Mäesuusatamine“ ja „Lumelaud“ puhul ning teiste alade puhul väljas. „Jäta välja“ ja „Vajadusel sõida tõstukiga alla“ on näha ainult siis, kui tõstukeid kasutatakse.',
  'help.guide.tour-ski-fix-leg.tip.1':
    'Võid ka lohistada punkti kaardil nõlvale, rajale või tõstukile lähemale. Kui lahti lased, planeeritakse lõik uuesti.',
  'help.guide.tour-ski-summary.step.2':
    '„Suusatamine“, „Tõstukites“, „Ootamine“ ja „Jalgsi“ näitavad igaühe aega. „Nõlvad“, „Laskumine nõlvadel“ ja „Tõstukisõidud“ näitavad nõlvade pikkust, nõlvadel laskutud kõrgust ja seda, mitu korda tõstukiga sõidad.',
  'help.guide.tour-ski-pistes-layer.goal':
    'Vaata oma suusaretke ümbruse nõlvu, suusaradu ja tõstukeid ning seda, mida nende värvid tähendavad.',
  'help.guide.tour-ski-import.title': 'Impordi suusarada ja ütle, mis see oli',
  'help.guide.tour-ski-import.tip.1':
    'Imporditud rada jääb nii, nagu see salvestati: TREK ei sobita seda nõlvadega ja selle kaardil on „Suusaaeg“ väärtusega „Arvutamata“.',
  'help.ctx.trip-tour-paddle.bullet.3':
    'Punkti menüüs „Rohkem toiminguid“ on aerutamise tööriistad: planeeri järgmine lõik vett mööda või joonista see käsitsi, „Siit alates kanna paati“ ja „Lüüs selles punktis“.',
  'help.guide.tour-paddle-setup.step.3':
    'Vali jaotises „Paat“ „Süst“, „Kanuu“, „SUP“ või „Muu“. Paadi järgi pakub TREK välja kiiruse.',
  'help.guide.tour-paddle-setup.tip.4':
    'Veeru allosas olev rida „Aerutamisel on riske“ avab lehe „Ohutus vee peal“. Loe see enne esimest retke korra läbi.',
  'help.guide.tour-paddle-water-route.step.5':
    'Kõigi käsitsi joonistatud lõikude korraga planeerimiseks klõpsa jaotise „Teekonnapunktid“ päises lainete ikoonil „Planeeri käsitsi joonistatud lõigud vett mööda“.',
  'help.guide.tour-paddle-portage.step.1':
    'Vii kursor peatusele, kus paadist välja tuled, ja klõpsa „Rohkem toiminguid“ (kolm täppi).',
  'help.guide.tour-paddle-portage.result':
    'Lõik on kaardil ja teekonnapunktides ülekanne ning „Ajahinnang“ arvestab seda kandmisena.',
  'help.guide.tour-paddle-lock.tip.2':
    'Kui ülekanne läheb lüüsist mööda, on lüüs tuhm ja märgitud „Ümber kantud“. Selle asemel arvestatakse ülekande aega ja lüüsi minuteid ei arvestata.',
  'help.guide.tour-paddle-time.step.4':
    'Kui retkel on ülekanne, arvestab rida „Kandmine“ kandmist. Klõpsa selle kiirusel ja sisesta, kui kiiresti paati kannad. „Välja ja tagasi vette“ lisab minutid iga ülekande juures.',
  'help.guide.tour-paddle-wind.step.1':
    'Pane aerutamisretk reisi mõnele päevale. Siis näitab vasakus veerus olev kaart „Tuul“ selle päeva prognoosi retke alguspunktis.',
  'help.guide.tour-paddle-wind.result': 'Tead tunni kaupa, milline on päeva tuul sinu vettelaskmiskohas.',
  'help.guide.tour-paddle-checklist.tip.1':
    'Vali iga takistuse puhul, mida teed: „Aeruta läbi“, „Kanna ümber“, „Aeruta ümber“ või „Ei puuduta“. „Järgmine“ viib järgmise lahtise kirje juurde.',
  'help.guide.tour-paddle-track-marks.step.1':
    'Klõpsa vahelehel „Retked“ paremas veerus „Lisa matk“, vali „Impordi GPX või KML“ ja vali fail.',
  'help.guide.tour-paddle-track-marks.tip.2':
    '„Loobu“ eemaldab salvestamata märgid. Salvestatud rada ennast ei joonistata kunagi ümber.',
  'help.ctx.trip-tour-horse.bullet.4':
    'TREK ei arvuta ratsutamisaega. Kui tahad, et aeg oleks päeval näha, sisesta see jaotises „Üksikasjad“ väljale „Plaanis“.',
  'help.guide.tour-horse-plan.step.5':
    'Vali jaotises „Jaotised“ lõik. Kontrolli, millises suunas („Suund“) seda ratsutad ja mida näitab selle ulatuses „Ligipääs hobusega“.',
  'help.guide.tour-horse-plan.tip.5':
    'Ratsamatkal ei arvutata marsruuti: klõps joonistatud joonel ei lisa kujunduspunkti ja lõigu otstes olevad punktid jäävad sinna, kuhu marsruut need paneb.',
  'help.guide.tour-horse-gap.tip.1':
    'Käsitsi lõiku ei ole kontrollinud ükski marsruudiplaneerija ega hobuseteekond. Vaata kaardilt, kus see tegelikult kulgeb.',
  'help.guide.tour-horse-recorded.step.4':
    'Ratsamatk avaneb vasakus veerus. Kaardil „Salvestatud ratsamatk“ on „Nagu salvestatud“, „Ratsutamisaega pole“ ja „Ligipääs kontrollimata“. Vii kursor märgile, et lugeda põhjust.',
  'help.guide.dateless-trip.step.2':
    'Jäta „Alguskuupäev“ ja „Lõppkuupäev“ tühjaks. Nende alla ilmub väli „Päevade arv“: sisesta, mitu päeva tahad planeerida.',
  'help.guide.trip-reminder.tip.1':
    'Plokki „Meeldetuletus“ näeb ainult reisi omanik (või administraator). Kui see on hall, peab administraator enne reisimeeldetuletused sisse lülitama: „Administraator“, „Teavitused“.',
  'help.guide.upcoming-reservations.step.2': 'Klõpsa broneeringul, et avada reis, kuhu see kuulub.',
  'help.guide.timezones-widget.tip.1':
    'Loendis on ametlikud ajavööndite nimed, näiteks Europe/Lisbon või America/New_York, nii et otsi linna, mis on nimes.',
  'help.guide.half-company-holiday.step.2': 'Lülita samal tööriistaribal sisse „Pool päeva“.',
  'help.guide.edit-holiday-calendar.tip.1': 'Iga muudatus salvestub kohe. Nuppu „Salvesta“ pole.',
  'help.guide.person-color.tip.1': 'Sama värv tähistab inimest tööriistaribal ja kaardil „Puhkusepäevade õigus“.',
  'help.guide.answer-fusion-request.step.2':
    'Loe, mida ühendamine tähendab: üks ühine kalender, kirjed, mida saate teineteise eest muuta, ja ühised puhkuseseaded.',
  'help.guide.log-for-partner.step.2': 'Vaata tööriistariba: selle esimesel nupul on nüüd tema nimi ja värv.',
  'help.guide.dissolve-fusion.step.2': 'Klõpsa all jaotises „Lahuta ühendatud kalendrid“ nuppu „Lahuta“.',
  'help.guide.country-places.step.3':
    'Dialoogis on kõik riigi alla arvestatud kohad, rühmitatud reiside kaupa; kui neid on üle kuue, saad loendit kitsendada ülal oleva väljaga „Otsi kohti“. Klõpsa kohal või reisi pealkirjal, et avada see reis planeerijas.',
  'help.guide.tour-activity-stats.step.5':
    'Klõpsa „Näita retki“. Avaneb „Minu tehtud retked“ summade, jaotusega „Liigi järgi“ ja perioodi kõigi retkedega koos päeva, reisi, vahemaa ja tõusuga. Selle päises olevate siltidega saad ka siin perioodi ja tüüpi muuta.',
  'help.guide.move-to-list.step.3':
    'Vali nimekiri, kuhu need lähevad. Kui nimekirju on üle kolme, saad neid ülal oleva otsingukastiga kitsendada.',
  'help.guide.accept-list-invite.goal': 'Liitu nimekirjaga, mida keegi sinuga jagas, või lükka kutse tagasi.',
  'help.guide.tour-collection-add-to-trip.step.4':
    'Soovi korral muuda välja „Nimi reisil“, seejärel klõpsa „Lisa reisile“.',
  'help.guide.tour-collection-manage.step.2':
    'Kirjuta väljale „Otsi kohti“. See kitsendab nime järgi nii retki kui ka kohti.',
  'help.guide.create-journey.tip.3':
    'Kui reis on just lõppenud, saad ülal bänneris „Reis just lõppes“ nupuga „Loo reisilugu“ alustada reisilugu, kus see reis on juba valitud.',
  'help.guide.entry-draft.step.2': 'Klõpsa „Salvesta“. Kaardil on nüüd märk „Mustand“.',
  'help.guide.gallery-map.step.3':
    'Vahelehel „Ajajoon“ järgib paremal olev kaart sinu kerimist: nähtaval sissekandel on päeva värvi rõngas. Klõpsa nööpnõelal, et kerida ajajoon selle sissekandeni.',
  'help.guide.journey-map-layers.tip.1':
    'Värviline katkendjoon on reisi GPX-marsruut, osa plaanist; pidev joon on sel päeval salvestatud marsruut.',
  'help.guide.journey-keep-route.tip.1':
    'Kus salvestus lõpeb, lõpeb ka joon. TREK joonistab ainult seda, mis salvestati.',
  'help.guide.journey-day-stays.tip.1':
    'Rida on näha ainult neile, kes tohivad päevikut muuta ja kellel on oma Dawarich ühendatud, ning ainult päevadel, kus on veel midagi otsustada.',
  'help.guide.journey-take-over-day.step.4':
    'Jäta „Hoia ka päeva teekond“ sisse, et säilitada ka marsruut, seejärel klõpsa nuppu „Võta üle“. Nupul on näha, mitu mustandit luuakse.',
  'help.guide.journey-auto-prepare.step.3':
    'All olev rida näitab, millal sinu peatumised viimati laaditi või miks see ei õnnestunud. Klõpsa „Laadi kohe“, et küsida Dawarichilt kohe.',
  'help.guide.photo-location.tip.1': 'Ise määratud kohti ei liigutata kunagi.',
  'help.ctx.settings-plugins.bullet.1':
    '„Pluginate seaded“: selle all on iga sinult andmeid vajava plugina kohta kaart väljade ja nupuga „Salvesta“. Salajast välja pärast salvestamist enam ei näidata.',
  'help.guide.dashboard-widgets.step.3':
    'Kaartide all olev „Taasta vaikeseaded“ lähtestab kogu vahelehe „Välimus“ algseadetele.',
  'help.guide.web-push-device.result':
    'Kaardil on kirjas „Selles seadmes sisse lülitatud“ ja jaotises „Tõuketeavitus“ sisse lülitatud sündmused jõuavad sinuni ka siis, kui TREK on suletud.',
  'help.guide.connect-airtrail.step.1':
    'Leia jaotisest „Integratsioonid“ AirTrail ja sisesta selle „Serveri URL“ ja API-võti. Võtme lood AirTrailis jaotises „Settings“, „Security“.',
  'help.guide.connect-dawarich.step.1':
    'Leia jaotisest „Integratsioonid“ Dawarich ja sisesta selle „Serveri aadress“ ning API-võti, mille leiad Dawarichis jaotisest „Account“, „API key“.',
  'help.guide.tour-connect-wanderer.step.1':
    'Leia jaotisest „Integratsioonid“ wanderer ja sisesta selle „Serveri URL“ ja API-pääse. Pääsme lood wandereris jaotises „Settings“, „Account“, „API tokens“; see algab tekstiga wanderer_key_.',
  'help.guide.tour-wanderer-watch.goal': 'Lase TREKil taustal jälgida, kas imporditud radades on muudatusi.',
  'help.guide.mcp-oauth.tip.3':
    'API-pääsutõendid töötavad endiselt, kuid on märgitud kui „Aegunud“; mine üle OAuth-kliendile.',
  'help.guide.offline-conflicts.tip.2': 'Valik kehtib ainult selles seadmes.',
  'help.guide.default-user-settings.tip.1':
    'Kasutaja enda valik jaotises „Seaded“ on alati ülimuslik; need vaikeväärtused kehtivad kõigile, kes pole seda seadet muutnud.',
  'help.guide.own-routing-engine.step.1':
    'Sisesta lehe „Kasutaja vaikevalikud“ jaotises „Kaart“ väljale „Oma marsruutimootor“ oma OSRM-serveri aadress.',
  'help.guide.admin-passkeys.tip.2': 'Kui muudad hiljem domeeni, lakkavad kõik juba lisatud pääsuvõtmed töötamast.',
  'help.guide.instance-keys.tip.4': 'Amapi võti peab olema Web 服务 (veebiteenuse) võti, mitte JS API võti.',
  'help.guide.rotate-jwt-secret.step.2': 'Loe hoiatust ja klõpsa „Roteeri ja logi välja“.',
  'help.guide.notification-defaults.tip.2': 'Vaikeväärtus kehtib ainult neile, kes pole seda lahtrit ise muutnud.',
  'help.ctx.notifications.bullet.5':
    'Jaotise „Seaded“ alajaotises „Teavitused“ valid, millised sündmused jõuavad siia ja millised saad e-posti, veebihaagi, ntfy või tõuketeavituse kaudu.',
  'help.guide.read-notifications.result':
    'Oled ekraanil, millest teavitus rääkis, ja kellaikooni number väheneb ühe võrra.',
  'help.guide.mark-notifications-read.title': 'Teavituste loetuks märkimine',
  'help.guide.delete-notifications.goal': 'Hoia loend lühike ja eemalda see, mida enam ei vaja.',
  'help.guide.notification-settings.step.1': 'Klõpsa paremal üleval oma nimel.',
  'help.guide.public-link.step.5': 'Valikuid saad muuta seni, kuni link on olemas. „Kustuta link“ lülitab lingi välja.',
  'help.guide.link-journal.step.3':
    'Vali iga reisil osaleja jaoks „Ligipääs puudub“, „Lugemine“ või „Muuda“. „Kõik saavad lugeda“ ja „Mitte keegi“ määravad kõigile korraga.',
  'help.guide.collapse-columns.tip.3': 'Kui eraldajal on fookus, saad seda liigutada ka nooleklahvidega.',
  'help.guide.edit-place.tip.3':
    'Kui klõpsad dialoogist väljaspool, ei lähe muudatused kaduma: TREK küsib enne „Kas loobuda muudatustest?“ ja „Jätka muutmist“ viib sind vormi tagasi.',
  'help.guide.dawarich-stays.goal':
    'Lisa pärast kontrollimist kohad, kus Dawarich salvestas sinu peatumised reisi ajal.',
  'help.guide.leave-stop-off-route.step.1':
    'Tee peatusel paremklõps või klõpsa selle kolmel täpil ja vali „Jäta marsruudist välja“.',
  'help.guide.move-booking-day.step.3':
    'Rida on nüüd uuel päeval oma kellaajal. Kui pead muutma ka kellaaega, ava broneering.',
  'help.guide.place-image-from-file.goal':
    'Kasuta koha pildina fotot, mis on juba koha failide hulgas, ilma seda uuesti üles laadimata.',
  'help.guide.place-image-from-file.tip.3': 'Pilti saavad muuta ainult reisijad, kes tohivad kohti muuta.',
  'help.guide.place-own-hours.result':
    'Kaardil on sinu telefoninumber, e-post ja lahtiolekuajad ning pildi ümber olev rõngas on sinu aegade järgi roheline või punane.',
  'help.guide.confirm-stay-booking.step.4':
    'Sulge broneering paremas ülanurgas oleva X-iga. Jaotises „Broneering“ on majutuse kaardil nüüd „Kinnitatud“.',
  'help.guide.tour-map-lines.title': 'Retkede leidmine kaardilt',
  'help.guide.tour-map-lines.tip.2':
    'Retke peitmine mõjutab ainult sind ja salvestatakse selles brauseris selle reisi jaoks: retk, selle päevad ja värv jäävad kõigi jaoks samaks. Retkede loendi kohal olev „Näita kõiki“ toob kõik peidetud retked tagasi ja telefoni kaardil on alati kõik retked.',
  'help.guide.car-stops.step.4':
    'Klõpsa jaotises „Peatused tee ääres“ nuppu „Lisa peatus“ iga koha jaoks, mida sõit läbib, ja vali koht, soovi korral koos kellaajaga. Peatus, millel pole valitud kohta, eemaldatakse salvestamisel.',
  'help.guide.transport-details.step.2':
    'Päise siltidel on olek, tüüp, päev ja „Broneerimiskood“. Klõpsa oleku sildil, et vahetada olekute „Ootel“ ja „Kinnitatud“ vahel. Koodi sildis olev väike kopeerimisikoon „Kopeeri broneerimiskood“ kopeerib koodi lõikelauale.',
  'help.guide.group-sort-bookings.step.3':
    'Vali jaotises „Sordi“ „Kuupäev“, „Pealkiri“, „Tüüp“ või „Olek“. Nende all olev rida pöörab järjekorra: kuupäevade puhul „Varasemad eespool“ või „Hilisemad eespool“, ülejäänute puhul „A kuni Ü“ või „Z-st A-ni“.',
  'help.guide.booking-on-map.title': 'Broneeringu leidmine kaardilt',
  'help.guide.export-bookings-csv.tip.1':
    'Veerud on „Tüüp“, „Pealkiri“, „Olek“, „Algus“, „Lõpp“, „Lähtekoht“, „Sihtkoht“, „Asukoht“, „Kinnitus“ ja „Märkmed“.',
  'help.guide.arrange-packing-list.tip.1':
    'Kui „A kuni Ü“ on sees, ei saa esemeid lohistada, kuid terveid nimekirju saab endiselt lohistada.',
  'help.guide.count-packed-pieces.step.3':
    'Kuni ainult osa tükke on pakitud, on loendur sinu rõhuvärvis ja märkeruudul on selles värvis ääris. Klõpsa miinusel, et tükk loendist maha võtta.',
  'help.guide.expense-receipts.step.5':
    'Eelvaates on kviitung ning ülal „Ava uuel vahekaardil“ ja „Laadi alla“. Mitme kviitungi puhul liigud nende vahel nooleklahvidega ja Esc sulgeb eelvaate.',
  'help.guide.files-sync-settings.step.3': 'Klõpsa vooriba all „Seaded“, et näha ülejäänud valikuid.',
  'help.guide.manage-notes.step.3':
    'Samas menüüs olev „Kinnita“ hoiab märkme paneeli ülaosas, kategooria värvi raamiga ja pealkirja kõrval oleva nööpnõelaga. Samas menüüs olev „Vabasta“ viib märkme tagasi tavalisele kohale.',
  'help.guide.note-categories.step.1':
    'Klõpsa kaardi „Märkmed“ päises nupu „Uus märge“ kõrval oleval hammasrattal. Avaneb „Halda kategooriaid“, kus on iga kategooria kohta rida: värv, nimi, kuus värvitäppi ja prügikast.',
  'help.guide.note-categories.tip.2':
    'Märkmeteta kategooria säilib ainult sinu brauseris. Teised liikmed näevad seda siis, kui selle alla on lisatud märge.',
  'help.guide.roadtrip-reorder.goal': 'Muuda sõidu järjekorda või vii peatus teisele päevale otse ribal.',
  'help.guide.roadtrip-overnight.step.4':
    'Selle kõrval olev „Otsi majutust“ näitab kopeeritavat nime ja linke broneerimissaitidele: hotelli jaoks trivago või CHECK24, laagriplatsi jaoks PiNCAMP või Pitchup. Kontrolli saidil kohta, kuupäevi ja külaliste arvu.',
  'help.guide.roadtrip-stop-fill.step.2':
    'Vali jaotises „Täidab kuni“ väärtus 50 kuni 100. Nuppude all olev rida näitab, kui kaugele sellega siit sõita saad.',
  'help.guide.roadtrip-bookings.step.2':
    'Ribal on sõit tüübi värvi kaart, sõiduplaan on saabumisveerus ning algus- ja lõpp-punkt pealkirja all.',
  'help.guide.roadtrip-google-import.tip.1':
    "TREK arvutab peatuste vahel oma marsruudi; Google'i teekonda see ei kopeeri.",
  'help.guide.roadtrip-hazards.result': 'Kaardil on näha sinu reisi ümbruse kehtivad hoiatused ja marsruut ei muutu.',
  'help.ctx.trip-tours.bullet.3':
    'Rida: värviline riba on retke joon kaardil, ümmargune ruut näitab marsruudipiirangut (T1 kuni T6) või tüüpi, väike GPX- või wandereri märk tähistab importi ning märgid näitavad päevi, aega, vahemaad ja tõusu. Numbriga kuu näitab mitmepäevase retke etappide arvu.',
  'help.guide.tour-show-list.step.3': 'Klõpsa real. Retke kaart avaneb kaardi peal.',
  'help.guide.tour-add-to-day.goal': 'Planeeri, millal retke teed, et see oleks päevas ja selle joon kaardil.',
  'help.guide.tour-add-to-day.tip.3':
    'Retke saab päevale lisada ainult ühe korra. Kui lohistad selle päevale, kus see juba on, näitab TREK ainult teadet „See retk on sellel päeval juba olemas.“',
  'help.guide.tour-day-times.step.4':
    'Kui retk lõpeb pärast päeva järgmise punkti algust, annab rea all olev märkus sellest teada, näiteks „Lõpeb 13:30, kuid Lunch at Gostner Schwaige algab 12:30“. Midagi ei liigutata.',
  'help.guide.tour-remove-from-day.step.1':
    'Vii päevade veerus kursor retke reale, klõpsa „Veel valikuid“ ja vali „Eemalda päevast“.',
  'help.guide.tour-filter-list.step.1':
    'Klõpsa nupu „Impordi GPX või KML“ all oleval filtrinupul. Sellel on näha olek, mille järgi filtreeritakse, alguses „Kõik“, ja selle kõrval retkede arv.',
  'help.guide.tour-hide-on-map.title': 'Retke joone peitmine kaardil',
  'help.guide.tour-import-plan-tab.title': 'Raja importimine vahelehelt „Plaan“',
  'help.ctx.trip-tour-detail.title': 'Retke üksikasjad',
  'help.guide.tour-detail-read.goal':
    'Vaata kogu reisi teavet retke kohta: päevi, vahemaad ja kõrgusi, profiili ja allikat.',
  'help.guide.tour-detail-read.tip.1':
    'Merevaigukollane silt „kasuta ettevaatlikult“ tähendab, et importimisel on kõrgused või mõõtmised puudulikud. Pea seda tõusu ja profiili lugedes meeles.',
  'help.guide.tour-rename-colour.step.1': 'Ava retke kaart ja klõpsa nime kõrval oleval pliiatsil. Nimest saab väli.',
  'help.guide.tour-take-along.goal':
    'Saa juhised retke alguspunkti, ava retke veebileht või laadi marsruut alla GPX-failina.',
  'help.guide.tour-take-along.result': 'Sul on tee alguspunkti oma kaardirakenduses ja kogu marsruut GPX-failina.',
  'help.guide.tour-copy-keep.tip.2':
    'Päevaplaanis retke menüüs olev „Salvesta kogumikku“ avab sama dialoogi, nii et ka seal salvestatakse marsruut.',
  'help.guide.tour-packing-link.step.3': 'Klõpsa „Lingi“.',
  'help.guide.tour-files.goal':
    'Lisa retkele broneering, kaart või marsruudi kirjeldus ja ava see hiljem retke kaardilt.',
  'help.guide.tour-activity-link.goal': 'Seo salvestatud GPX-rada planeeritud retkega, plaani muutmata.',
  'help.guide.tour-activity-link.tip.3':
    '„Kulunud aeg“ arvestatakse raja esimesest kuni viimase ajatemplini, pausid kaasa arvatud.',
  'help.guide.tour-activity-compare.tip.1':
    '„Võrdle kaardil“ on saadaval ainult siis, kui retke kaart on kaardi kõrval, mitte telefonis.',
  'help.guide.tour-origin-check.tip.1':
    'Teiselt reisilt üle võetud retke puhul on jaotises „Üle võetud“ nimetatud see reis ja retk.',
  'help.ctx.trip-tour-planner.bullet.3':
    'Parem riba „Selle reisi retked“ loetleb kõik retked, loendi kohal on filter ja „Reisi kogumaht“. Kui retk on avatud, näitab ülal olev „Retke kokkuvõte“ selle vahemaad, tõusu, aega ja kõrgusprofiili. Ülal olev pluss „Lisa matk“ planeerib, impordib või võtab retke üle.',
  'help.guide.tour-open-workspace.step.3':
    'Parem riba „Selle reisi retked“ loetleb kõik reisi retked, loendi kohal on filter ja „Reisi kogumaht“.',
  'help.guide.tour-open-workspace.result':
    'Vaheleht „Retked“: vasakul redaktor, paremal reisi retked, nende vahel kaart.',
  'help.guide.tour-draw-route.step.6':
    'Jaotises „Teekonnapunktid“ saab iga punkt numbriga rea, mis nimetatakse koha järgi, kui nimi on laaditud. Kuni TREK töötab, näitab väike täpp „Uus retk“ kõrval selle olekut.',
  'help.guide.tour-type-profile.step.1':
    'Klõpsa välja „Retke nimi“ all „Matka tüüp“. Seal on näha praegune tüüp ja rida selle kohta, kuidas seda planeeritakse.',
  'help.guide.tour-edit-points.goal': 'Muuda retke kulgu, liigutades selle punkte kaardil või loendis.',
  'help.guide.tour-edit-points.tip.2':
    'Kuni koha nimi pole laaditud, on real koordinaadid. „Võta tagasi“ ja „Tee uuesti“ jaoks klaviatuuri otseteid pole.',
  'help.guide.tour-shaping-points.tip.1': 'Algus ja lõpp on alati peatused.',
  'help.guide.tour-loop-reverse.step.3':
    'Klõpsa selle kõrval „Pööra suund ümber“, et läbida kogu retk vastupidises suunas.',
  'help.guide.tour-leg-by-hand.step.2':
    'Lõik muutub katkendlikuks sirgjooneks ja rea all on loendis „Käsitsi joonistatud, marsruutimata“ koos lõigu pikkusega.',
  'help.guide.tour-trip-places.step.1':
    'Klõpsa jaotises „Teekonnapunktid“ nupu „Lisa punkt“ kõrval „Reisi kohad“. Reisi kohad ilmuvad selle alla.',
  'help.guide.tour-details-times.title': 'Retke nimetamine ja aja planeerimine',
  'help.guide.tour-details-times.tip.3':
    'Klõpsa „Üksikasjad“ kõrval oleval noolel, et jaotis kokku panna. See avaneb automaatselt, kui mõnel selle väljal on väärtus, mida „Salvesta“ ei aktsepteeri.',
  'help.guide.tour-save.tip.1':
    '„Salvesta“ kõrval olev „Loobu“ tühistab pärast kinnitust salvestamata muudatused. Salvestatud retke see ei muuda.',
  'help.guide.tour-edit-saved.step.3':
    'Klõpsa „Salvesta“. Ilmub teade „Retk salvestatud“ ning retke päevad, failid ja märkmed jäävad alles.',
  'help.guide.tour-summary-profile.step.1':
    'Jaotise „Selle reisi retked“ ülaosas olev „Retke kokkuvõte“ näitab redaktoris oleva retke „Vahemaa“, „Tõus“ ja „Laskumine“, hinnangulist aega, pause ja planeeritud koguaega.',
  'help.guide.tour-list-manage.title': 'Reisi retkede haldamine',
  'help.guide.tour-list-manage.tip.2':
    'Päev, kus retk juba on, on päevamenüüs hall. Mitmepäevase retke puhul küsib TREK, kas selle etapid algavad sellest päevast või läheb kogu retk sellele päevale.',
  'help.guide.tour-delete.tip.2':
    'Kui tahad retke ainult päevast eemaldada, kasuta selle asemel päeva menüüs „Eemalda päevast“.',
  'help.guide.tour-saved-elsewhere.step.4':
    'Vali „Salvesta uue matkana“, et säilitada mõlemad, „Laadi uuem“, et laadida teine versioon, või „Kirjuta üle“, et asendada teine versioon enda omaga.',
  'help.ctx.trip-tour-import.bullet.3':
    'Import avaneb GPX-retkena või wanderer-retkena: selle joon, „Retke kokkuvõte“ ja kõrgusprofiil täpselt nii, nagu imporditi. Selle real loendis on märk „GPX-import“.',
  'help.guide.tour-import-gpx.step.4':
    'Kontrolli jaotises „Impordi kui“, mis rajad need on. Eelvalitud on „Matk“. „Rattaretk“ või „Jooks“ küsib profiili, „Aerutamismatk“ paati ja veekogu, „Suusad ja talv“ ala.',
  'help.guide.tour-view-import.title': 'Imporditud raja vaatamine',
  'help.guide.tour-view-import.result':
    'Näed salvestatud rada täpselt nii, nagu see imporditi, midagi ümber arvutamata.',
  'help.guide.tour-plan-from-import.tip.2':
    'Kui kaart ütleb, et soovitus erineb pikematel lõikudel rajast, kontrolli neid osi kaardil, enne kui selle järgi planeerid.',
  'help.guide.tour-restore-recorded.step.3':
    'Kinnita nupuga „Taasta salvestatud rada“. Teekonnapunktid ja marsruuditud joon eemaldatakse, päevad ja märkmed jäävad alles.',
  'help.guide.tour-take-over.step.3':
    'Leia retk: kirjuta väljale „Otsi nime järgi“ või kitsenda loendit filtritega „Reis“ ja „Tüüp“.',
  'help.guide.tour-import-wanderer.title': 'Raja importimine wandererist',
  'help.guide.tour-import-wanderer.tip.3':
    'Juba reisis olev rada on märgitud kui „Selles reisis“ ja pakub valikut „Ava retk“. Rada, mis on pärast importi muutunud, pakub vana kõrval valikut „Impordi uue versioonina“.',
  'help.ctx.trip-tour-map.bullet.4':
    'Vasaku paneeli kaart „Matka ääres“ otsib marsruudi lähedalt vaatepunkte, vett, onne, söögikohti ja muud ning loetleb tulemused. Loendist saad koha lisada retkele peatusena.',
  'help.guide.tour-map-layers.tip.1':
    'Valitud kaart jääb kehtima kõigile avatavatele retkedele, kuni lehe uuesti laadid. Retk, mille tüüp seda kaarti ei paku, avaneb kaardil „Kaart“ ning vahelehe „Plaan“ kaart ja jaotises „Seaded“ olev seade ei muutu.',
  'help.guide.tour-along-search.step.4': 'Klõpsa „Otsi matka äärest“. TREK ainult otsib: retk ei muutu.',
  'help.guide.tour-along-add-stop.step.1':
    'Klõpsa kohal loendis „Matka ääres“ või selle nööpnõelal kaardil. Koha kaart avaneb kaardi peal: mis see on, kui kaugel see marsruudist on ja kui kaugel retke algusest see asub.',
  'help.guide.tour-3d-terrain.title': 'Retke vaatamine 3D-s',
  'help.guide.tour-3d-terrain.tip.1':
    'Samas reas olev „Ülevaade“ näitab pärast vaate liigutamist uuesti kogu marsruuti.',
  'help.guide.tour-3d-flyover.step.4': 'Klõpsa „Ülevaade“, et näha uuesti kogu retke.',
  'help.guide.tour-map-overlays.step.2':
    'Klõpsa lüliti kõrval olevat väikest värviliste täppidega ruutu „Nõlvade legend“.',
  'help.ctx.trip-tour-stages.summary':
    'Mitmepäevane retk on üks marsruut, mis on jagatud etappideks, üks iga reisipäeva kohta. Siin määrad, kus iga päev lõpeb, näed iga etapi mõõtmeid ja paned etapid reisi päevadele.',
  'help.guide.tour-multi-day.step.1': 'Klõpsa jaotises „Selle reisi retked“ retkel, et see redaktoris avada.',
  'help.guide.tour-multi-day.tip.3':
    'Etapi aeg ei sisalda pause. Hoiatusvärvis aeg „Üle päeva liikumises“ on pikem kui üks päev.',
  'help.guide.tour-stages-on-days.step.4':
    'Klõpsa kuu ja etappide arvuga nuppu „Näita etappe“, et etapid nähtavale tuua.',
  'help.ctx.trip-tour-hike.title': 'Matkad ja jooksud',
  'help.guide.tour-hike-plan.title': 'Matka planeerimine sinu määratud raskusastme piires',
  'help.guide.tour-hike-plan.result':
    'Matk on jaotises „Selle reisi retked“ koos vahemaa, tõusu ja kõndimisajaga, valmis päevale panemiseks.',
  'help.guide.tour-hike-trail-details.step.2':
    'Vali, mida näidata: „SAC“ matkaraskuse jaoks, „Kate“ või „Teetüüp“. Kaardil olev marsruut kasutab samu värve nagu loend.',
  'help.guide.tour-hike-round.title': 'Umbes soovitud pikkusega ringmatka leidmine',
  'help.guide.tour-hike-round.tip.1':
    'Ringid jäävad matka „Raja suurim raskusaste“ piiresse; kaardil olev T-silt näitab, milline see on.',
  'help.guide.tour-hike-compare-ways.step.4':
    'Klõpsa „Vali see tee“. TREK kontrollib marsruudiplaneerijaga, et marsruut seda teed tõesti järgib.',
  'help.guide.tour-ferrata-add.step.2':
    'Klõpsa kaardil via ferratal, selle katkendjoonel või sildil. Selle kaardil on nimi, raskusaste ja pikkus.',
  'help.guide.tour-ferrata-add.tip.4':
    'Kaardil olev „Vaata OpenStreetMapis“ avab via ferrata enda andmed. Kui midagi ei saa laadida, muutub märk merevaigukollaseks ja põhjus on selle vihjes.',
  'help.guide.tour-run-plan.result':
    'Jooks on jaotises „Selle reisi retked“ koos väärtusega „Jooksuaeg (planeeritud)“ ning selle profiil ja tempo salvestatakse koos sellega.',
  'help.guide.tour-run-ways.step.2':
    'Kaardi ülaosas on nüüd näha, kui suur osa jooksust on katteta ja milline on raskeim hinnatud rada sellel.',
  'help.ctx.trip-tour-walk.bullet.2':
    '„Teekonnapunktid“ loetleb peatused järjekorras. Rõngas peatuse numbri ümber tähistab „Kindlasti näha“ (pidev) või „Valikuline“ (katkendlik), väike kilp tähistab „Kaitstud“ ja nime all olev silt näitab, kui kaua seal viibid.',
  'help.guide.tour-walk-plan.step.3':
    'Vii kursor jaotises „Teekonnapunktid“ peatusele, klõpsa selle kõrval „Rohkem toiminguid“ ja vali „Muuda peatust“.',
  'help.guide.tour-walk-sights.title': 'Vaatamisväärsuste lisamine linnajalutuskäigule',
  'help.guide.tour-walk-sights.tip.2':
    'Kui muudad marsruuti, on nupul kirjas „Otsi uuesti“, sest leitud kohad kuuluvad vanale marsruudile.',
  'help.guide.tour-walk-day-times.step.4':
    'Iga peatuse all näed, millal sinna jõuad ja kui kaua viibid. Hoiatus ilmub siis, kui koht on sel ajal suletud või sulgub sinu viibimise ajal.',
  'help.guide.tour-walk-google-import.step.1':
    'Klõpsa jaotises „Selle reisi retked“ nuppu „Lisa matk“ (ülal olev +) ja vali „Impordi jalutuskäik Google Mapsist“.',
  'help.guide.tour-walk-check-off.title': 'Jalutuskäigu peatuste ärämärkimine päeva jooksul',
  'help.guide.tour-walk-check-off.tip.3':
    'Kui panid jalutuskäigu päevale võrguühenduseta, saad selle ära märkida pärast sünkroonimist.',
  'help.guide.tour-bike-profile.title': 'Rattaretke planeerimine oma sõidustiili järgi',
  'help.guide.tour-bike-profile.result':
    'Rattaretk on salvestatud ja jaotises „Selle reisi retked“, marsruut on arvutatud selle profiili järgi ja sõiduaeg on jaotises „Retke kokkuvõte“.',
  'help.guide.tour-bike-surfaces.step.1':
    'Klõpsa paremal jaotises „Selle reisi retked“ rattaretkel, et see avada. Kui marsruut on arvutatud, ilmub jaotise „Teekonnapunktid“ alla kaart „Kate ja teed“.',
  'help.guide.tour-bike-surfaces.tip.4':
    'Klõpsa kaardi pealkirjal, et see kokku panna. See jääb selles brauseris kokkupanduks ka pärast lehe uuesti laadimist.',
  'help.guide.tour-bike-mtb-grades.tip.2':
    'Kui kaardistajad on tõusud hinnanud, järgneb allpool „Tõusu raskus (mtb:scale:uphill)“ oma ridadega.',
  'help.ctx.trip-tour-ski.bullet.4':
    'Teekonnapunktide all olev kaart „Nõlvamarsruut“ jagab päeva osadeks „Suusatamine“, „Tõstukites“, „Ootamine“ ja „Jalgsi“ ning näitab nõlvade pikkust, nõlvadel laskutud kõrgust ja tõstukisõite. Paremal jaotises „Retke kokkuvõte“ olev „Suusaaeg“ liidab selle kokku, kui kõik lõigud on planeeritud.',
  'help.guide.tour-ski-plan.step.5':
    'Iga punkti all on selle lõik siltidena: iga nõlv, tõstuk ja jalgsi lõik nime või tüübi järgi, nõlvad raskusastme värvi täpiga ja igaühe minutid.',
  'help.guide.tour-ski-options.goal':
    'Määra raskeimad nõlvad, eelistused, oma tempo ja kasutatavad tõstukid, et lõigud sulle sobiksid.',
  'help.guide.tour-ski-options.tip.3':
    '„Väldi oletatud ühendusi“ hoiab marsruudi eemal ühendustest, mida kaardiandmed ainult oletavad, näiteks kaardistamata lõigust kahe nõlva vahel.',
  'help.guide.tour-ski-fix-leg.tip.2':
    'Kuni piirkonna nõlvaandmeid alles laaditakse, planeerija ootab ja proovib automaatselt uuesti.',
  'help.guide.tour-ski-summary.step.3':
    'Paremal jaotises „Retke kokkuvõte“ liidab „Suusaaeg“ kõik kokku. Selle infotäpp selgitab, kuidas see arvutatakse.',
  'help.guide.tour-ski-pistes-layer.step.1':
    'Kui „Suusad ja talv“ tüüpi retk on avatud, näitab kaart nõlvu automaatselt. Kaardi all vasakul reas olev lumise mäe lüliti lülitab need välja ja sisse; selle vihjes on „Nõlvad, suusarajad ja tõstukid“.',
  'help.guide.tour-ski-import.goal':
    'Impordi salvestatud suusa-, murdmaasuusa- või räätsarada ja määra sellele õige ala.',
  'help.guide.tour-ski-import.tip.2':
    'Kui tahad seda muuta nagu planeeritud retke, kasuta selle kaardil „Muudetav versioon“ valikut „Planeeri muudetav versioon“. Selle punktid ühendatakse sirgjoontega.',
  'help.ctx.trip-tour-paddle.bullet.4':
    '„Ajahinnang“ liidab kokku vee peal veedetud aja, paadi kandmise, väljumise ja tagasi vette mineku, lüüsid ja pausid, kiiruste ja minutite põhjal, mida saad muuta.',
  'help.guide.tour-paddle-setup.step.4':
    'Vali jaotises „Veekogu“ „Jõgi“ või „Järv“. Retke ei saa salvestada enne, kui oled valinud nii paadi kui ka veekogu tüübi.',
  'help.guide.tour-paddle-setup.result':
    'Uus aerutamisretk koos paadi, veekogu ja kiirusega, valmis esimese punkti lisamiseks kaardile.',
  'help.guide.tour-paddle-water-route.tip.1':
    'Kui veeandmed puuduvad, laadib TREK need piirkonna jaoks automaatselt alla või küsib neid administraatorilt, olenevalt serveri seadistusest. Lõigul on siis kirjas, et veeandmeid laaditakse, ja see planeeritakse automaatselt, kui andmed on olemas, tavaliselt ühe kuni kolme minuti jooksul.',
  'help.guide.tour-paddle-portage.step.2':
    'Vali „Siit alates kanna paati“. Lõik järgmise punktini muutub ülekandeks, mis on joonistatud maismaale.',
  'help.guide.tour-paddle-lock.title': 'Lüüsi ja selle ooteaja lisamine',
  'help.guide.tour-paddle-lock.tip.3': '„Eemalda lüüs“ on avatud kaardi allosas ja menüüs „Rohkem toiminguid“.',
  'help.guide.tour-paddle-time.step.5':
    'Kuni kõigil lüüsidel pole aegu, on hinnangul kirjas „Mittetäielik“ ja ridade all olev märkus loetleb, mis puudub.',
  'help.guide.tour-paddle-wind.step.2':
    'Vaata tuule suunda, väärtusi „Keskmine“ ja „Puhangud“. „Keskmine“ on päeva tugevaim tunnikeskmine, „Puhangud“ tugevaim puhang.',
  'help.guide.tour-paddle-checklist.title': 'Takistuste kontrollnimekirja läbimine',
  'help.guide.tour-paddle-checklist.tip.2':
    '„Kanna ümber“ ei planeeri ülekannet automaatselt. Klõpsa „Planeeri ülekanne“, et see kaardil seadistada.',
  'help.guide.tour-paddle-track-marks.step.2':
    'Määra jaotises „Impordi eelvaade“ väljale „Impordi kui“ väärtus „Aerutamismatk“, seejärel vali „Paat“ ja „Veekogu“. Importi ei saa jätkata enne, kui oled mõlemad valinud.',
  'help.guide.tour-paddle-track-marks.tip.3':
    'Salvestatud rajal on ajahinnangu real „Veekogu“ oma kiirus: klõpsa sellel ja sisesta, kui kiiresti aerutasid.',
  'help.ctx.trip-tour-horse.bullet.5':
    'GPX-failist imporditud ratsamatk jääb täpselt selliseks, nagu see salvestati, ja selle kaart „Salvestatud ratsamatk“ näitab, mida import ei suutnud arvutada.',
  'help.guide.tour-horse-plan.step.6':
    'Klõpsa „Võta lõik üle“. Lõik lisatakse ratsamatkale kaardil „Teekonnapunktid“ marsruudi nimega märgina. Lisa samamoodi teisi lõike.',
  'help.guide.tour-horse-gap.title': 'Ratsateede vahelise lünga ületamine',
  'help.guide.tour-horse-gap.tip.2':
    'Kaardil klõpsatud punktid lisatakse ratsamatkale samamoodi, sirgete kontrollimata lõikudena.',
  'help.guide.tour-horse-recorded.result':
    'Ratsamatk on reisis täpselt nii, nagu selle läbisid, koos failist pärit vahemaa ja kõrgustega.',
  'help.guide.dateless-trip.step.3': 'Klõpsa „Loo uus reis“.',
  'help.guide.trip-reminder.tip.2':
    'Uuel reisil on vaikimisi meeldetuletus 3 päeva enne väljumist. Selle kanalid valid jaotises „Seaded“, „Teavitused“.',
  'help.guide.upcoming-reservations.result': 'Reis avaneb. Ülevaatesse naastes näitab vidin endiselt, mis on tulemas.',
  'help.guide.entitlement.tip.2':
    'Ühendatud plaanis on igaühel oma rida ja saad määrata ka teiste puhkusepäevade õiguse.',
  'help.guide.half-company-holiday.step.3': 'Klõpsa päeval. Pool lahtrist muutub merevaigukollaseks.',
  'help.guide.school-holidays.tip.2': 'Vii kursor vaheaja päevale, et näha selle nime jaotises „Koolivaheajad“.',
  'help.guide.answer-fusion-request.step.3':
    'Klõpsa „Nõustu ja ühenda“, et plaanid ühendada, või „Lükka tagasi“, et hoida oma plaan eraldi.',
  'help.guide.log-for-partner.step.3':
    'Klõpsa päevadel, mida märkida, seejärel klõpsa uuesti oma nimel kaardil „Inimesi“.',
  'help.guide.dissolve-fusion.result':
    'Igaüks on tagasi oma plaanis oma kirjetega ja kaardil „Inimesi“ oled ainult sina.',
  'help.guide.country-places.result': 'Planeerija avaneb reisil, kuhu koht kuulub.',
  'help.guide.tour-activity-stats.step.6':
    'Kui retk jäi ära, klõpsa selle rea lõpus ümmargusel nupul „Jäta välja“. Retk jääb loendisse, tuhmina ja märgisega „Välja jäetud“. Sama nupp, nüüd „Arvesta uuesti“, arvestab selle jälle sisse.',
  'help.guide.move-to-list.tip.1':
    'Sildid kuuluvad ühele nimekirjale, nii et teisaldatud või kopeeritud kohal pole uues nimekirjas silte.',
  'help.guide.accept-list-invite.step.1':
    'Leia kutse nimekirjade ribal jaotisest „Kutsed“. Kui tulid kutseteavituse kaudu, on kaart lehe ülaosas. Sellel on nimekirja nimi ja saatja.',
  'help.guide.tour-collection-add-to-trip.tip.1':
    'Uus retk pole veel ühelgi päeval ega lisa kohti. Ei nimekiri ega algne retk muutu.',
  'help.guide.tour-collection-manage.step.3':
    'Klõpsa retke rea lõpus oleval prügikastil ja kinnita nupuga „Eemalda kogumikust“.',
  'help.ctx.journey-detail.bullet.7':
    'Kui Dawarich on ühendatud, on päeva päises ka „Võta salvestus üle“ (või päevaks salvestatud marsruudi pikkus) ja „Võta päev üle“. Päeval, kus on ootel peatumisi, on need päeva lõpus koondatud ühte ritta.',
  'help.guide.entry-draft.tip.1':
    'Kaasautorid näevad mustandit endiselt. Ainult avalik link peidab selle, kuni lülitad „Mustand“ välja.',
  'help.guide.journey-map-layers.tip.2':
    'Tuhmil lülitil pole veel midagi näidata ja selle vihje ütleb, miks. Sinu valik salvestatakse selles brauseris iga reisiloo jaoks eraldi.',
  'help.guide.journey-keep-route.tip.2':
    'Klõpsa hiljem päeva päises pikkusel, et võrrelda uuesti Dawarichiga: „Asenda“ võtab uue versiooni, „Eemalda teekond“ eemaldab päeva marsruudi reisiloost.',
  'help.guide.journey-day-stays.tip.2':
    'Tiheda päeva puhul käsitleb rea lõpus olev „Võta päev üle“ kõiki peatumisi korraga.',
  'help.guide.journey-take-over-day.tip.1':
    'Enne selle nupu klõpsamist ei salvestata midagi ja midagi ei salvestata kaks korda: päevikus juba olev peatumine on märgitud ja seda ei saa uuesti valida.',
  'help.guide.journey-auto-prepare.tip.1':
    'Ette valmistatakse ainult kuupäevadega seotud reiside päevad ja päevikusse ei lisata midagi automaatselt.',
  'help.guide.photo-location.result':
    'Kohata sissekanne saab asukoha, kus tehti selle esimene GPS-andmetega foto, ja ilmub kaardile.',
  'help.guide.contributors.tip.2':
    '„Reiside kaudu“ loetleb inimesed, kellel on juurdepääs seotud reisi kaudu. Nende juurdepääsu muudad selle reisi seadetes, mitte siin.',
  'help.ctx.settings-plugins.bullet.2':
    'Plugin võib lisada oma kaardile toiminguid („Toimingud“), mis käivituvad pärast kinnitust, ning „Ühenda“ või „Katkesta ühendus“, kui see logib sinu eest sisse mõnda teise teenusesse.',
  'help.guide.web-push-device.tip.1':
    'Tõuketeavitused töötavad brauseri kaupa: korda seda igas telefonis ja arvutis, kus tahad teavitusi saada. „Lülita selles seadmes välja“ peatab need ainult selles seadmes.',
  'help.guide.connect-airtrail.step.2':
    '„Luba iseallkirjastatud sertifikaadid“ on mõeldud ainult usaldusväärsele serverile sinu enda võrgus. „Kirjuta muudatused AirTraili tagasi“ on vaikimisi väljas, nii et TREK ainult loeb; lülita see sisse, et saata oma muudatused tagasi.',
  'help.guide.connect-dawarich.step.2':
    '„Kontrolli uusi peatumisi automaatselt“ laseb TREKil ise kontrollida. Kui see on väljas, loeb TREK Dawarichi ainult siis, kui seda palud. „Luba iseallkirjastatud sertifikaat“ on mõeldud ainult serverile, mida sinu server ei usalda.',
  'help.guide.tour-connect-wanderer.step.2':
    'Lülita „Luba iseallkirjastatud sertifikaat“ sisse ainult siis, kui server on sinu enda võrgus.',
  'help.guide.tour-wanderer-watch.step.1':
    'Lülita wandereri kaardil sisse „Kontrolli minu radade muudatusi“. Selleks peab ühendus olema juba salvestatud.',
  'help.guide.plugin-settings.title': 'Plugina seadistamine enda jaoks',
  'help.guide.default-user-settings.tip.2':
    '„Kuvamisvaluuta“ teisendab summasid ainult vaatamiseks. Jaotises „Kulud“ sisestatud summad jäävad samaks.',
  'help.guide.own-routing-engine.step.2':
    'Teemakse, kiirteid või praame vältivate marsruutide jaoks sisesta väljale „Oma Valhalla server“ oma Valhalla aadress. Iga väli salvestub, kui sellelt lahkud; seejärel taaskäivita TREKi server ja laadi leht uuesti.',
  'help.guide.admin-passkeys.tip.3':
    'Kui kasutaja kaotas seadme, kus olid tema pääsuvõtmed, eemalda pääsuvõtmed dialoogis „Muuda kasutajat“ nupuga „Lähtesta pääsuvõtmed“.',
  'help.guide.rotate-jwt-secret.result':
    'Uus allkirjastamissaladus on kasutusel ja iga kasutaja, ka sina, peab uuesti sisse logima.',
  'help.guide.read-notifications.title': 'Teavituste lugemine',
  'help.guide.filter-notifications.title': 'Kõigi või ainult lugemata teavituste vaatamine',
  'help.guide.mark-notifications-read.goal':
    'Eemalda esiletõst ja number kellaikoonilt, kui oled uued teavitused üle vaadanud.',
  'help.guide.delete-notifications.step.1':
    'Klõpsa teavituse kellaaja kõrval oleval prügikastil „Kustuta“, et eemaldada ainult see teavitus.',
  'help.guide.notification-settings.step.2': 'Klõpsa menüüs „Seaded“.',
  'help.guide.public-link.tip.3': 'Vii kursor valikule, et lugeda, mida see peidab.',
  'help.guide.link-journal.step.4':
    'Loe kollast märkust: see nimetab, kes saab päeviku esimest korda. Seejärel klõpsa „Seo päevik“.',
  'help.guide.dawarich-stays.step.1':
    'Kui Dawarich on jaotises „Seaded“, „Integratsioonid“ ühendatud, on kohtade loendi kohal „Dawarichist“. Selle päis näitab, millal TREK viimati kontrollis ja mitu peatumist on ootel. Klõpsa sellel, et loend avada.',
  'help.guide.leave-stop-off-route.step.2':
    'Nime kõrvale ilmub märk „Marsruudist väljas“. Peatus jääb päeva ja kaardile, kuid päeva marsruut ja lõikude ajad jätavad selle vahele.',
  'help.guide.move-booking-day.result': 'Broneering kuulub plaanis uuele päevale ja selle kellaaeg ei muutu.',
  'help.guide.clear-day.tip.2': 'See menüüvalik on näha ainult päeval, kus on kohti.',
  'help.guide.place-image-from-file.step.1':
    'Ava koht, mille failide („Failid“) hulgas on foto. Kaardi alaosa lähedal olev plokk „Failid“ näitab, mitu faili kohal on.',
  'help.guide.place-own-hours.title': 'Koha lahtiolekuaegade, telefoni või e-posti parandamine',
  'help.guide.place-own-hours.tip.1':
    'Sinu sisestatud ajad asendavad TREKi leitud ajad, nii et hooajaliste aegadega kohvik näitab seda, mida sina tead.',
  'help.guide.day-panel.tip.3':
    'Planeerid kalendri järgi? Lülita jaotises „Seaded“, „Üldine“ sisse „Kuupäev päevapealkirjades eespool“ ja päises on esimesena kuupäev, selle all „Päev 1“ või päeva nimi.',
  'help.guide.confirm-stay-booking.result':
    'Hotellibroneering on kinnitatud nii majutuse kaardil kui ka vahelehel „Broneeringud“.',
  'help.guide.tour-map-lines.goal':
    'Erista reisi retki kaardil, ava retk selle joonelt ja peida need, mida praegu ei vaja.',
  'help.guide.tour-map-lines.tip.3':
    'Päevaplaanis retke rea menüüs olev „Jäta marsruudist välja“ tähendab, et päeva marsruut ei vii enam retke algus- ja lõpp-punkti. „Lisa tagasi marsruuti“ ühendab need uuesti.',
  'help.guide.car-stops.step.5':
    'Peatuste järjekord on marsruut. Peatuse vasakul olevad „Liiguta üles“ ja „Liiguta alla“ muudavad seda ning paremal olev rist „Eemalda peatus“ eemaldab peatuse.',
  'help.guide.transport-details.step.3':
    'All olevad ruudud näitavad väljumist ja saabumist koos jaamade või lennujaamadega, seejärel platvormi ja istekohta, kui need on määratud. Vahepeatustega sõidu puhul on need loetletud jaotises „Marsruut“ ja lõikude kaupa broneeritud sõidu puhul on iga lõigu kood jaotises „Teelõikude koodid“. Edasi tulevad „Reisijad“, „Märkmed“, „Kulud“ ja „Failid“; „Näita failides“ avab pileti vahelehel „Failid“.',
  'help.guide.export-transports-csv.title': 'Transpordi eksportimine tabelina',
  'help.guide.group-sort-bookings.step.4':
    'Klõpsa jaotise pealkirjal, et see kokku panna. Selle kõrval olev number näitab, mitu broneeringut selles on, ja teine klõps avab selle uuesti.',
  'help.guide.booking-on-map.goal': 'Liigu broneeringult selle kohale plaanis ja kaardil.',
  'help.guide.export-bookings-csv.tip.2':
    'Veerud on eraldatud semikoolonitega ja Excel avab faili nii, et täpitähed jäävad terveks.',
  'help.guide.arrange-packing-list.tip.2':
    'TREK jätab „A kuni Ü“ selles brauseris meelde, nii et nimekiri avaneb ka järgmisel korral sorteerituna. See muudab ainult seda, mida sina näed, mitte järjekorda, mida näevad teised.',
  'help.guide.count-packed-pieces.step.4':
    'Kui loendur jõuab koguseni, märgitakse ese automaatselt ja see loetakse pakituks.',
  'help.guide.expense-receipts.result':
    'Kviitung on salvestatud koos kuluga: kulu real olev silt avab selle ja fail on ka reisi jaotises „Failid“.',
  'help.guide.files-sync-settings.step.4':
    'Vali jaotises „Dokumendi kustutamisel“, mis juhtub teisel pool oleva koopiaga. „Säilita mõlemad koopiad“ jätab salvestusteenuse koopia alles. „Teisalda prügikasti“ saadab selle salvestusteenuse prügikasti, kui dokument TREKis kustutatakse.',
  'help.ctx.trip-collab.bullet.7':
    'Kõik siin nõuab ühendust. Võrguühenduseta ei salvestata sõnumit, märget, linki, küsitlust ega häält ning TREK teatab, et selleks on vaja ühendust ja tuleb uuesti proovida, kui TREK on taas võrgus. Liikmed, kes ei tohi „Koostööd“ muuta, saavad kõike lugeda, kuid neil pole nuppe „Uus märge“, „Lisa link“ ja „Uus küsitlus“ ning sõnumikast on hall.',
  'help.guide.manage-notes.step.4':
    '„Muuda“ avab märkme dialoogi, kus kõik on juba täidetud. Muuda, mida vaja, siin üks rida juurde väljale „Sisu“, ja klõpsa „Salvesta“.',
  'help.guide.note-categories.step.2':
    'Kirjuta all olevale väljale „Uus kategooria...“ nimi ja vajuta Enter või klõpsa selle kõrval oleval plussil. Uus kategooria saab järgmise värvi ja oma rea.',
  'help.guide.note-categories.tip.3':
    'Kaardil on kategooria näha ainult värvilise täpina päises. Vii kursor täpile, et näha kategooria nime.',
  'help.guide.roadtrip-reorder.step.1':
    'Lohista peatust selle reast ja aseta see sama päeva teisele peatusele. See võtab selle peatuse koha ja päeva marsruut arvutatakse uues järjekorras uuesti.',
  'help.guide.roadtrip-overnight.step.5':
    'Klõpsa „Lisa“. Öö broneeritakse sellest päevast järgmiseni ja koht lisatakse sõidule selle päeva ööbimiskohana.',
  'help.guide.roadtrip-stop-fill.step.3':
    'Kui tahad peatusel jälle oma seadet kasutada, ava märk uuesti ja klõpsa „Kasuta minu vaikevalikut“.',
  'help.guide.roadtrip-bookings.step.3':
    'Silt „Sisseregistreerimine“ või „Pardaleminek“ näitab, mis ajaks pead terminali jõudma: väljasõit määratakse sõiduplaanist just nii palju varasemaks.',
  'help.guide.roadtrip-google-import.title': 'Marsruudi importimine Google Mapsist',
  'help.guide.roadtrip-google-import.tip.2':
    'Lingis peab olema vähemalt kaks peatust, mille TREK suudab kaardile paigutada, ja kõige rohkem 30.',
  'help.guide.roadtrip-hazards.tip.1':
    'Hoiatused ei ole teede sulgemised: marsruut ei muutu nende tõttu kunagi ja need on kehtivad teated, mitte prognoos sinu reisikuupäevadeks.',
  'help.ctx.trip-tours.bullet.4':
    'Vii kursor reale, et näha silma („Peida kaardil“) ja ümmargust +-i („Lisa päevale“). Lohista rida vasakus veerus mõnele päevale, et see sinna planeerida, või klõpsa sellel, et avada retke kaart kaardi peal.',
  'help.guide.tour-show-list.step.4':
    'Kaardil on retke mõõtmed ja jaotises „Reisipäevad“ päevad, millel see on. Marsruudi enda muutmiseks ava vaheleht „Retked“ ja klõpsa retkel jaotises „Selle reisi retked“.',
  'help.guide.tour-add-to-day.step.1':
    'Vii kursor loendis retkele ja klõpsa rea paremas servas oleval ümmargusel +-il („Lisa päevale“).',
  'help.guide.tour-add-to-day.tip.4':
    'Kui mõni päev on avatud (klõpsa selle päisel), pakub retke kaart ka selle päeva jaoks „Lisa päevale“. Päevade kohal olev tagasivõtmise nool tühistab määramise.',
  'help.guide.tour-day-times.tip.1': 'Sinu sisestatud lõpuaeg asendab arvutatud aja.',
  'help.guide.tour-remove-from-day.step.2':
    'Retk jääb paremal olevasse loendisse. Selle päevamärk on kadunud ja filter arvestab selle jälle „Planeerimata“ alla.',
  'help.guide.tour-filter-list.step.2':
    'Vali jaotises „Olek“ „Planeerimata“ retkede jaoks, mis pole veel ühelgi päeval, või „Plaanis“ nende jaoks, mis juba on mõnel päeval. Iga rea juures on näha, mitu retke sobib.',
  'help.guide.tour-hide-on-map.goal':
    'Peida kaardilt retked, mida praegu ei vaja, ilma et need kellegi jaoks muutuksid.',
  'help.guide.tour-import-plan-tab.goal': 'Impordi päevi planeerides GPX- või KML-rada retkena.',
  'help.ctx.trip-tour-detail.summary':
    'Kaart, mis avaneb kaardi peal, kui valid vahelehel „Plaan“ retke: selle päevad, mõõtmed ja profiil, päritolu ning nupud, millega saad selle telefoni saata, kopeerida, kogumikku salvestada või pakkimisnimekirjaga siduda.',
  'help.guide.tour-detail-read.step.1':
    'Lülita parema veeru ülaosas „Kohad“ asemel „Retked“, seejärel klõpsa retkel. Selle kaart avaneb kaardi peal. Sama kaardi avab ka retke rida päeva sees või selle joon kaardil.',
  'help.guide.tour-detail-read.tip.2':
    'Aerutamisretkel pole kõrgusi ega profiili: selle punktid on kallastel, nii et kõrgused oleksid valed.',
  'help.guide.tour-rename-colour.step.2':
    'Kirjuta uus nimi ja klõpsa ümmargusel linnukesega nupul või vajuta Enter. Escape jätab vana nime alles.',
  'help.guide.tour-take-along.step.1':
    'Ava retke kaart. Kaardi allosas olev „Navigeerimine“ avab retke alguspunkti kaardirakenduses ja kui rakendusi on mitu, näitab enne nende loendit. See juhatab sind alguspunkti, mitte mööda marsruuti.',
  'help.guide.tour-copy-keep.title': 'Retke kopeerimine või kogumikku salvestamine',
  'help.guide.tour-copy-keep.tip.3':
    'Vahelehel „Retked“ teeb vasaku veeru ülaosas olev järjehoidja avatud retkega sama. Kui retkel on salvestamata muudatusi, palub see enne retke salvestada.',
  'help.guide.tour-packing-link.step.4':
    'Kaardil on nüüd nimekiri, selle pakitud esemete arv, riba ja esimesed esemed. Pakitud esemed on läbi kriipsutatud.',
  'help.guide.tour-files.step.1':
    'Ava retke kaart ja keri lõpus jaotiseni „Failid“. Klõpsa jaotise päises „Laadi üles“ ja vali üks või mitu faili.',
  'help.guide.tour-activity-link.step.1':
    'Ava planeeritud retke kaart ja keri jaotiseni „Tegelik rada“. Klõpsa „Lisa tegelik rada“.',
  'help.guide.tour-activity-link.result': 'Rada on retkega seotud ja kaardil on plaan ja tegelikult tehtu kõrvuti.',
  'help.guide.tour-activity-compare.tip.2':
    'Atlase retkestatistikas arvestatakse planeeritud väärtuste asemel seotud rada.',
  'help.guide.tour-origin-check.tip.2':
    'wandereri retke allika kõrval on nool „Ava wandereris“ ja jaotise päises „Kontrolli allikat“. Kontroll küsib wandererilt, kas rada on pärast importi muutunud. „Impordi uue hetktõmmisena“ impordib siis uue versiooni eraldi retkena. See retk säilitab oma päevad ja märkmed.',
  'help.ctx.trip-tour-planner.bullet.4':
    'Kui „Lisa punkt“ on sees (kaardi sildil „Lisa punkte“), lisab klõps kaardil punkti. Lohista nööpnõela, et seda liigutada, klõpsa joonistatud marsruudil, et lisada sinna kujunduspunkt, ja vali reisi koht nupuga „Reisi kohad“.',
  'help.guide.tour-open-workspace.step.4':
    'Parema riba ülaosas olev pluss „Lisa matk“ pakub valikuid „Impordi GPX või KML“, „Impordi jalutuskäik Google Mapsist“ ja „Võta matk üle teiselt reisilt“. Kui retk on avatud, on seal ka „Planeeri uus retk“.',
  'help.guide.tour-draw-route.title': 'Uue retke joonistamine',
  'help.guide.tour-draw-route.tip.1':
    'Kui „Lisa punkte“ on sees, on kursor ristikujuline. Lülita see välja, et kaarti lohistada ilma punkte lisamata. 3D-vaates on see alguses väljas, sest seal lohistad kaarti ringi vaatamiseks.',
  'help.guide.tour-type-profile.step.2':
    'Vali loendist tüüp: „Matk“, „Linna- / vaatamisväärsuste jalutuskäik“, „Jooks“, „Rattaretk“, „Aerutamismatk“, „Ratsamatk“ või „Suusad ja talv“. Iga tüübi juures on kirjas, mida see planeerib, ja uue tüübi valimisel planeeritakse marsruut uuesti.',
  'help.guide.tour-edit-points.step.1':
    'Lohista kaardil nummerdatud nööpnõel kohta, kus punkt peaks olema. Marsruut planeeritakse uue koha kaudu uuesti.',
  'help.guide.tour-edit-points.result':
    'Punktid on seal ja selles järjekorras, nagu soovid, ning marsruut on uuesti planeeritud.',
  'help.guide.tour-shaping-points.tip.2': 'Kujunduspunkt ei saa olla mitmepäevase retke etapi lõpp.',
  'help.guide.tour-loop-reverse.tip.1':
    'Kui retk on juba ring, näitab „Tagasi algusesse“ teadet „Matk naaseb juba algusesse“.',
  'help.guide.tour-leg-by-hand.step.3':
    'Kui tahad, et marsruudiplaneerija selle uuesti planeeriks, ava sama menüü ja vali „Marsruudi järgmine lõik uuesti“.',
  'help.guide.tour-trip-places.step.2':
    'Otsi reisi kohtade hulgast või vaata jaotist „Matka lähedal“: kohad kuni kahe kilomeetri kaugusel marsruudist, lähimad eespool, igaühe juures vahemaa.',
  'help.guide.tour-details-times.goal': 'Anna retkele nimi, kirjeldus ja link ning lisa selle ajale pausid.',
  'help.guide.tour-details-times.result': 'Retkel on nüüd nimi, märkmed ja planeeritud aeg.',
  'help.guide.tour-save.tip.2':
    'Riba ülaosas olev „Tagasi retkede juurde“ sulgeb redaktori ja küsib enne, kui on salvestamata muudatusi.',
  'help.guide.tour-edit-saved.step.4':
    'Klõpsa „Tagasi retkede juurde“, et redaktor sulgeda. Kui on salvestamata muudatusi, küsitakse enne „Kas loobuda retke salvestamata muudatustest?“.',
  'help.guide.tour-summary-profile.step.2': 'Hinnangulise aja kõrval olev infotäpp selgitab, kuidas see arvutatakse.',
  'help.guide.tour-list-manage.goal':
    'Vaata reisi retkede kogusummasid, pane retk päevale ja kitsenda loend vajalikuni.',
  'help.guide.tour-list-manage.tip.3':
    'Real olev prügikast kustutab retke. Vahelehel „Plaan“ on samad retked, kui selle parem veerg on lülitatud valikule „Retked“.',
  'help.guide.tour-delete.tip.3':
    'Retk kustutatakse siin, vahelehel „Retked“. Prügikast on olemas ainult reisijatele, kes tohivad reisi kohti muuta.',
  'help.guide.tour-saved-elsewhere.tip.1':
    '„Salvesta uue matkana“ annab sinu koopiale retke nime, mille järel on „(minu versioon)“.',
  'help.ctx.trip-tour-import.bullet.4':
    '„Muudetav versioon“ teeb impordist retke, mille teekonnapunkte saad liigutada. „Asenda import“ säilitab salvestatud raja ja redaktoris olev kaart „Salvestatud rada“ viib sind selle juurde tagasi.',
  'help.guide.tour-import-gpx.step.5': 'Klõpsa „Impordi 1 retk“ (või kolme rajaga faili puhul „Impordi 3 retke“).',
  'help.guide.tour-view-import.goal': 'Vaata imporditud retke kulgu, mõõtmeid ja kõrgusi nii, nagu need imporditi.',
  'help.guide.tour-plan-from-import.title': 'Muudetava retke planeerimine impordi põhjal',
  'help.guide.tour-plan-from-import.tip.3':
    'Aerutamis- või suusaimpordi punktid ühendatakse marsruudi arvutamise asemel sirgjoontega.',
  'help.guide.tour-restore-recorded.tip.1':
    'Kaarti näidatakse ainult retkel, mis asendati valikuga „Asenda import“ ja seejärel salvestati.',
  'help.guide.tour-take-over.step.4': 'Klõpsa retkel. Paremal on näha selle joon, mõõtmed ja reis, kust see pärineb.',
  'help.guide.tour-import-wanderer.goal': 'Impordi üks oma wandereri radadest reisi retkena.',
  'help.guide.tour-import-wanderer.tip.4': '„Ava wandereris“ avab raja sinu serveris.',
  'help.ctx.trip-tour-map.bullet.5':
    '3D-vaates on marsruut maastikul, värvitud järskuse järgi, koos legendiga, mis võtab kokku selle tõusud, ja ülelennuga, mis järgib marsruuti algusest lõpuni.',
  'help.guide.tour-map-layers.tip.2':
    '„Matkamine“ ja „Jalgratas“ tulevad vabatahtlike serveritest ja on saadaval ainult siis, kui administraator need lubab. Kui mõni neist ei vasta, on selle lõigul ! ja saad lülituda teisele kaardile; sinu retk jääb samaks.',
  'help.guide.tour-along-search.step.5':
    'Leitud kohad on loetletud koos kaugusega marsruudist ja kaardil oma värvis. Tärn tähistab tuntuimaid ja „Matkas“ neid, mis on juba peatused. Nupul on nüüd kirjas „Otsi uuesti“.',
  'help.guide.tour-along-add-stop.step.2':
    '„Kuhu see läheb“ soovitab lõiku, kuhu koht kõige paremini sobib. Klõpsa sellel, et valida hoopis, milliste kahe peatuse vahele see tuleb, või „Uue lõpuna“. Enne muudatust näitab kaart uut marsruuti katkendjoonena.',
  'help.guide.tour-3d-terrain.goal': 'Vaata retke päris maastikul, värvitud järskuse järgi.',
  'help.guide.tour-3d-terrain.tip.2':
    'Valitud kaarti kasutatakse ka 3D-vaates, samuti via ferrata radu, nõlvu ja meremärke. Retke muutmise ajal saad selle punkte maastikul lohistada ja kui „Lisa punkte“ on sees, lisab klõps uue punkti.',
  'help.guide.tour-3d-flyover.result': 'Oled näinud retke õhust, algusest lõpuni, valitud kiirusel.',
  'help.guide.tour-map-overlays.step.3':
    'Legend selgitab värve: laskumisnõlvad tasemest „Algaja“ kuni „Vabalaskumine“, „Murdmaasuusarajad“, „Talve- ja räätsamatkarajad“, „Kelgurajad“ ning „Tõstukid ja köisraudteed“. „Täielik legend OpenSnowMapis“ näitab kõiki sümboleid. Sulgemiseks vajuta Escape.',
  'help.ctx.trip-tour-stages.bullet.1':
    'Redaktoris olev „Päevad“ teeb avatud retkest „Ühepäevane“ või „Mitmepäevane“ retke. Kui lülitad tagasi ühepäevasele retkele, eemaldatakse pärast kinnitust kõik etappide lõpud ja marsruut jääb samaks.',
  'help.guide.tour-multi-day.step.2':
    'Klõpsa jaotises „Päevad“ „Mitmepäevane“. Märkus näitab, kuhu esimese etapi lõpp pannakse.',
  'help.guide.tour-multi-day.tip.4':
    'Etapid salvestatakse, kui klõpsad „Salvesta“. Kui muudatus eemaldab etapi, mis on reisi mõnel päeval, annab teade teada, et salvestamine eemaldab selle sellelt päevalt.',
  'help.guide.tour-stages-on-days.step.5':
    'Iga etapi juures on näha päev, millel see on. Klõpsa päeval, et viia etapp teisele päevale, või vali „Päevata“, et see päevalt eemaldada.',
  'help.ctx.trip-tour-hike.summary':
    'Vahelehel „Retked“ avatud matk või jooks: vasakul redaktor, keskel kaart, paremal retke kokkuvõte ja reisi teised retked. Matk püsib sinu lubatud raja raskusastme piires, jooksu aeg arvutatakse sinu tempo järgi ning mõlemal on näha, mida OpenStreetMap teekonna kohta teab.',
  'help.guide.tour-hike-plan.goal':
    'Alusta matka, määra selle peatused, vali raskeim raja raskusaste, mida marsruut tohib kasutada, ja salvesta matk.',
  'help.guide.tour-hike-plan.tip.1':
    'Uue matka tase on alguses T2 („Mägimatkamine“). T3 juures on hoiatus, et sellised rajad võivad olla järsakuäärsed ning nõuavad kindlat jalga ja kõrgusekartuse puudumist.',
  'help.guide.tour-hike-trail-details.step.3':
    'Märgid võtavad selle kokku: kui suur osa marsruudist on „Teada“, „Kõrgeim teadaolev“ raskusaste ja eraldi „Marsruudi piir“, millega matk planeeriti.',
  'help.guide.tour-hike-round.goal': 'Lase TREKil pakkuda soovitud pikkusega ringe, mis algavad matka ühest peatusest.',
  'help.guide.tour-hike-round.tip.2':
    'Lubatud on vahemaad 1 kuni 60 km ja pakutakse ringe, mis erinevad sinu soovitud pikkusest kuni 20 %.',
  'help.guide.tour-hike-compare-ways.result':
    'See üks lõik järgib valitud teed ja ülejäänud matk jääb samaks. Kaardi all olevas teates „Tee valitud“ on „Võta tagasi“.',
  'help.guide.tour-ferrata-add.step.3':
    'Klõpsa „Lisa matkale“. Via ferrata lisatakse marsruudi lõppu eraldi lõiguna, mõlemas otsas punkt.',
  'help.guide.tour-run-plan.title': 'Jooksu planeerimine oma tempos',
  'help.guide.tour-run-plan.tip.1': 'Ilma tempota ei saa jooksu salvestada.',
  'help.guide.tour-run-ways.step.3': 'Klõpsa „Kate“, seejärel loendis mõnel kattel, et näha kaardil ainult neid lõike.',
  'help.ctx.trip-tour-walk.bullet.3':
    'Kui jalutuskäik on algusajaga päeval, nimetab jaotise „Teekonnapunktid“ ülaosas olev „Ajad päeval“ selle päeva ning iga peatuse juures on saabumisaeg, viibimisaeg ja see, mida lahtiolekuajad ütlevad.',
  'help.guide.tour-walk-plan.step.4':
    'Anna peatusele „Nimetus“ ja „Peatumine minutites“. Kui viibimisaega veel ei tea, jäta see tühjaks, ja sisesta 0 punkti puhul, millest ainult möödud.',
  'help.guide.tour-walk-sights.goal': 'Vali teema, otsi jalutuskäigu äärest ja lisa koht peatusena.',
  'help.guide.tour-walk-sights.tip.3':
    'Lahtiolekuajad ja veebisaidid tulevad allikast, enamasti OpenStreetMapist. Kontrolli neid enne minekut.',
  'help.guide.tour-walk-day-times.tip.1':
    'Kui algusaega pole, annab rida sellest teada ja palub määrata jalutuskäigule sellel päeval aja, et näha saabumisi ja lahtiolekuaegu.',
  'help.guide.tour-walk-google-import.step.2': 'Kleebi link väljale „Link jalgsimarsruudile“ ja klõpsa „Loe linki“.',
  'help.guide.tour-walk-check-off.goal':
    'Märgi päeva jooksul peatused külastatuks või vahele jäetuks ja vaata, kui palju on veel kõndida.',
  'help.guide.tour-walk-check-off.result':
    'Külastatud peatused on linnukesega, vahele jäetud läbi kriipsutatud ja allesjäänud aeg arvestab ainult seda, mis on veel ees.',
  'help.guide.tour-bike-profile.goal':
    'Alusta rattaretke ja lase TREKil arvutada marsruut matkarattale, maanteerattale, kruusarattale või MTB-le.',
  'help.guide.tour-bike-profile.tip.1':
    'Kui muudad hiljem profiili, planeeritakse kogu marsruut uue profiili järgi uuesti.',
  'help.guide.tour-bike-surfaces.step.2':
    'Kaardi päises olev märk näitab marsruudi osakaalu, mis on teadaolevalt katteta.',
  'help.guide.tour-bike-mtb-grades.title': 'Maastikurattaretke radade raskusastmete kontrollimine',
  'help.guide.tour-bike-mtb-grades.tip.3':
    'Kui raskusastmeid ei õnnestunud lugeda, annab kaart sellest teada. Klõpsa „Proovi uuesti“.',
  'help.ctx.trip-tour-ski.bullet.5':
    'Kui „Suusad ja talv“ tüüpi retk on avatud, näitab kaart OpenSnowMapi nõlvu ja nende lüliti kõrval on „Nõlvade legend“. Kõik see on kaardiandmed: siit ei selgu, kas nõlv või tõstuk on avatud, milline on lumi või mis on laviiniohuga.',
  'help.guide.tour-ski-plan.step.6': 'Anna retkele väljal „Retke nimi“ nimi ja klõpsa „Salvesta“.',
  'help.guide.tour-ski-options.step.1':
    '„Suusad ja talv“ tüüpi retkel on marsruudiplaneerija valikud jaotise „Ala“ all. Näed ainult neid, mida sinu ala kasutab: näiteks murdmaasuusatamisel pole valikut „Raskeimad nõlvad“.',
  'help.guide.tour-ski-options.result':
    'Retk planeeritakse sinu piirangute järgi uuesti ja kaart „Nõlvamarsruut“ loetleb raskemad nõlvad, mida välditi.',
  'help.guide.tour-ski-fix-leg.tip.3':
    'Võrguühenduseta joonistatakse lõigud esialgu sirgjoonena. Hall rida suveradade kohta on märkus, mitte viga.',
  'help.guide.tour-ski-summary.tip.1':
    '„Välditud“ loetleb raskemad nõlvad, mida marsruudiplaneerija sinu piirangu „Raskeimad nõlvad“ tõttu vältis.',
  'help.guide.tour-ski-pistes-layer.step.2': 'Klõpsa lüliti kõrval nelja värvilise täpiga nuppu „Nõlvade legend“.',
  'help.guide.tour-ski-import.step.1':
    'Klõpsa vahelehel „Retked“ „Lisa matk“ (pluss jaotise „Selle reisi retked“ kohal), vali „Impordi GPX või KML“ ja vali fail.',
  'help.guide.tour-ski-import.tip.3':
    'Sama eelvaate avamiseks võid GPX-, KML- või KMZ-faile lohistada ka ükskõik kuhu vahelehel „Retked“.',
  'help.ctx.trip-tour-paddle.bullet.5':
    '„Tuul“ näitab ilmaprognoosi retke alguspunktis selle päeva kohta, millele retk on planeeritud. „Kontrollnimekiri“ loetleb salvestatud marsruudi takistused ja selle, mida iga puhul otsustasid.',
  'help.guide.tour-paddle-setup.step.5':
    'Järvel määrab marsruudi „Üle järvede“: „Otse üle“ on lühim, „Kalda lähedal“ püsib tuulistel päevadel kalda lähedal.',
  'help.guide.tour-paddle-water-route.title': 'Lõikude planeerimine vee peal',
  'help.guide.tour-paddle-water-route.tip.2':
    'Kus marsruut kannab paati ümber paisu või läbib lüüsi, lisab TREK sinna oma punkti märkega „Leitud“. Kui seda liigutad või muudad, saab sellest sinu enda punkt.',
  'help.guide.tour-paddle-portage.step.3':
    'Punkti alla ilmub kaart „Ülekanne“ koos pikkuse ja lisaminutitega. Klõpsa sellel, et see avada.',
  'help.guide.tour-paddle-lock.goal': 'Lisa retkele lüüs ja arvesta selle ooteaeg ja läbimine retke aja hulka.',
  'help.guide.tour-paddle-lock.result': 'Lüüs on retkel koos minutitega ja „Ajahinnang“ arvestab need sisse.',
  'help.guide.tour-paddle-time.tip.1':
    'TREK alustab väärtustega 4 km/h vee peal, 2 km/h kandmisel ja 10 minutit iga ülekande juures. Need on algväärtused kohandamiseks, mitte mõõtmistulemused.',
  'help.guide.tour-paddle-wind.step.3':
    'Tulbad näitavad päeva tunde, puhangud keskmise tuule taga. Vii kursor tulbale, et näha selle tunni näitajaid ja suunda.',
  'help.guide.tour-paddle-checklist.goal':
    'Vaata, mida on teada salvestatud marsruudi paisude, lüüside ja juurdepääsureeglite kohta, ja otsusta, mida igaühe juures teed.',
  'help.guide.tour-paddle-checklist.tip.3':
    'Kirje märkega „Kontrolli uuesti“ otsustati enne, kui marsruut või andmed muutusid. Otsusta uuesti või vali „Jäta otsus alles“ või „Eemalda otsus“. Otsused, mis enam ei kehti, on jaotises „Varasemad otsused“.',
  'help.guide.tour-paddle-track-marks.step.3': 'Klõpsa „Impordi 1 retk“.',
  'help.guide.tour-paddle-track-marks.result':
    'Salvestatud rajas on selle ülekanded ja lüüsid ning „Ajahinnang“ arvestab neid.',
  'help.guide.tour-horse-plan.title': 'Ratsamatka planeerimine mööda ratsateid',
  'help.guide.tour-horse-plan.step.7':
    'Anna ratsamatkale väljal „Retke nimi“ nimi, seejärel klõpsa vasaku veeru allosas „Salvesta“.',
  'help.guide.tour-horse-gap.goal': 'Jätka lõiguga, mis ei alga sinu ratsamatka lõpp-punktist.',
  'help.guide.tour-horse-gap.tip.3':
    'Lõik, mis algab kuni 25 m kaugusel sinu ratsamatka lõpust, jätkub otse sealt ja „Ühendus matkaga“ näitab „Liitub matka lõpuga“.',
  'help.guide.tour-horse-recorded.tip.1':
    'Joon jääb täpselt selliseks, nagu see failis salvestati. Midagi ei arvutata uuesti ja salvestatud ratsamatkal pole muudetavat versiooni.',
  'help.guide.dateless-trip.result':
    'Kaardil on „Idee“ ja „Kuupäevad lahtised“ ning reisil on nii palju tühje päevi, kui soovisid.',
  'help.guide.trip-reminder.title': 'Meeldetuletus enne reisi',
  'help.guide.upcoming-reservations.tip.1':
    'Hotellis peatumine on loendis kaks korda: sisseregistreerimise ja väljaregistreerimise juures.',
  'help.guide.half-company-holiday.result':
    'Ettevõttel on pool päeva vaba ja sellele päevale märgitud puhkusepäev läheb arvesse ainult poole päevana.',
  'help.guide.edit-holiday-calendar.title': 'Pühade kalendri muutmine või eemaldamine',
  'help.guide.answer-fusion-request.result':
    'Pärast valikut „Nõustu ja ühenda“ on mõlemad plaanid ühes ruudustikus, iga inimene oma värvis.',
  'help.guide.log-for-partner.result':
    'Päevad on teise inimese värvis ja arvestatakse tema, mitte sinu puhkusepäevade õiguse arvelt.',
  'help.guide.dissolve-fusion.tip.1':
    'Selles aknas olev „Tühista“ jätab plaani samaks; sinu kirjed säilivad igal juhul.',
  'help.guide.country-places.tip.1':
    'Kui koht on vale riigi all, on sellel tavaliselt vale aadress või valed koordinaadid. Ava siit selle reis ja paranda koht seal.',
  'help.guide.tour-activity-stats.title': 'Retkedel tehtu vaatamine',
  'help.guide.tour-activity-stats.result':
    'Dialoogi ja vahelehe „Retked“ summades pole enam välja jäetud retke. Selle marsruut, päevad ja reis jäävad samaks.',
  'help.guide.move-to-list.tip.2':
    'Teisaldamine eemaldab kohad nimekirjast, nii et „Teisalda nimekirja“ näeb ainult nimekirja omanik või administraator. „Kopeeri nimekirja“ töötab igas nimekirjas, mida saad avada.',
  'help.guide.accept-list-invite.step.2': 'Klõpsa „Nõustu“, et liituda, või „Lükka tagasi“, et kutsest keelduda.',
  'help.guide.tour-collection-add-to-trip.tip.2':
    'Kui retk salvestati ilma jooneta, tuleb selle teekonnapunktid koos sellega lisada. Dialoog annab sellest teada ja valib selle valiku sinu eest.',
  'help.guide.tour-collection-manage.tip.1':
    'Retke eemaldamine nimekirjast ei muuda retki, mis on sellest juba sinu reisidele loodud.',
  'help.guide.entry-draft.tip.2':
    'Kui võtad päeva üle Dawarichist, on selle sissekanded mustandid. Kontrolli enne jagamist märki.',
  'help.guide.journey-map-layers.result':
    'Kaardil on ainult soovitud kihid ja iga nööpnõela, täpi ja joone tähendus on legendis.',
  'help.guide.journey-keep-route.result':
    'Päeva päises on vahemaa ja marsruut on kaardi kihil „Salvestatud“ pideva joonena kõigile reisiloo liikmetele näha. Jagatud lingis on see näha ainult siis, kui „Salvestatud marsruudid“ on sees.',
  'help.guide.journey-day-stays.result':
    'Otsustatud peatumised eemaldatakse reast. Kirjutatud sissekanded on oma päeval nagu iga teine sissekanne ja saad lisada fotosid ja teksti nagu tavaliselt.',
  'help.guide.journey-take-over-day.tip.2':
    'Mustandid ei ole jagatud linkides näha. Lisa fotosid ja teksti, seejärel lülita igas sissekandes „Mustand“ välja.',
  'help.guide.journey-auto-prepare.tip.2':
    'Täpp päeva loendinupul tähendab, et päev pole veel lõplik; vihje ütleb, miks.',
  'help.ctx.settings-plugins.bullet.3':
    'All olev „Pluginate tegevus“ loetleb kõik toimingud, mida pluginad sinu nimel tegid, uusimad eespool, koos nupuga „Värskenda“.',
  'help.guide.language-region.tip.3':
    '„Nädala alguspäev“ määrab iga kuupäevavalija esimese veeru; Vacays on selleks eraldi seade.',
  'help.guide.web-push-device.tip.2': "iPhone'is ja iPadis lisa TREK kõigepealt avaekraanile ja ava see sealt.",
  'help.guide.connect-airtrail.step.3':
    'Klõpsa „Salvesta“, seejärel „Testi ühendust“. See näitab, mitu lendu leiti, ja märk muutub olekuks „Ühendatud“.',
  'help.guide.connect-dawarich.step.3':
    'Klõpsa „Salvesta“, seejärel „Testi ühendust“: see loendab viimase 30 päeva peatumised. Kui ühendus on loodud, kontrollib „Kontrolli kohe“ kohe ja paremal olev „Katkesta ühendus“ lõpetab ühenduse.',
  'help.guide.tour-connect-wanderer.step.3':
    'Klõpsa „Salvesta“, seejärel „Testi ühendust“. See näitab, mitu sinu rada saab importida, ja märk muutub olekuks „Ühendatud“.',
  'help.guide.tour-wanderer-watch.step.2':
    'Kõige rohkem kord päevas loeb TREK iga imporditud raja lühikirjet ja real on näha, millal viimati kontrolliti. Kui rada võib olla muutunud, saad teavituse ja „Vihjed“ loendab selle: klõpsa „Vihjed“, et näha iga retke olekuga „Võib olla muutunud“, „Muudetud“ või „Ei saa kontrollida“, ja ava see sealt.',
  'help.guide.plugin-settings.goal': 'Anna pluginale oma võtmed ja eelistused ning vaata, mida see sinu nimel tegi.',
  'help.guide.own-routing-engine.result': 'Kõigi reiside marsruudid arvutatakse sinu serverites.',
  'help.guide.admin-passkeys.title': 'Pääsuvõtmega sisselogimise pakkumine',
  'help.guide.rotate-jwt-secret.tip.1': 'Ka sind logitakse välja, nii et logi kohe pärast seda uuesti sisse.',
  'help.guide.notification-defaults.title': 'Kasutajate teavituste vaikeseadete määramine',
  'help.ctx.notifications.title': 'Teavitused',
  'help.guide.read-notifications.goal': 'Vaata, mis sinu reisidel sinu äraolekul juhtus, ja ava see otse.',
  'help.guide.filter-notifications.goal': 'Vaata läbi kõik teavitused või ainult need, mida pole veel lugenud.',
  'help.guide.mark-notifications-read.step.1':
    'Klõpsa teavituse kellaaja kõrval oleval topeltlinnukesel „Märgi loetuks“, et märkida ainult see teavitus.',
  'help.guide.delete-notifications.step.2':
    'Ülal olev „Kustuta kõik“ kustutab pärast kinnitusdialoogi kogu loendi korraga.',
  'help.guide.notification-settings.step.3':
    'Klõpsa seadete külgribal „Teavitused“. Selle esimesel kaardil on iga sündmuse kohta üks rida ja veerg „Rakenduses“ määrab, mida kellaikoon näitab.',
  'help.guide.link-journal.result':
    'Reisi vahelehtede ribale ilmub vaheleht „Päevik“. Kõik, kellele andsid õiguse „Lugemine“ või „Muuda“, saavad päevikut sellel vahelehel avada ja näevad muudatusi reaalajas.',
  'help.guide.create-place.tip.4':
    'Ka Google Mapsist kopeeritud link töötab otsingus: kleebi see, vajuta Enter ja TREK loeb koha lingist. Kui vormil on asukoht, näitab otsingu kõrval olev sihik „Kohad selle nõela lähedal“, mis on ümberringi.',
  'help.guide.dawarich-stays.step.2':
    'Peatumised on rühmitatud päevade kaupa, igaühe juures saabumis- ja lahkumisaeg; mõõdikuikoon tähistab peatumist, mille puhul Dawarich polnud kindel. Klõpsa peatumise kõrval oleval nööpnõelal „Lisa kohana“.',
  'help.guide.leave-stop-off-route.step.3':
    'Kui tahad peatuse uuesti marsruuti võtta, ava sama menüü ja vali „Lisa tagasi marsruuti“.',
  'help.guide.move-booking-day.tip.1':
    'Mitmepäevase broneeringu vahepealsete päevade tuhme ridu ei saa lohistada, samuti mitte vahemaandumistega lennu üksikut lõiku.',
  'help.guide.place-image-from-file.step.2':
    'Klõpsa päises ümmargusel pildil. Kuna kohal on fotosid, küsib väike aken, kust pilt võtta.',
  'help.guide.place-own-hours.goal':
    'Lisa kaardile ajad, mida oled ise kontrollinud, kui leitud ajad on valed või puuduvad.',
  'help.guide.place-own-hours.tip.2':
    'Telefoninumber ja e-post on kaardi päises siltidena. Klõpsa neil, et avada need telefoni- või meilirakenduses.',
  'help.guide.edit-accommodation.tip.3':
    'Kui jaotises „Seaded“, „Üldine“ on „Hägusta broneerimiskoodid“ sees, jääb kinnitusnumber hägusaks. Selle lugemiseks vii kursor sellele või klõpsa sellel.',
  'help.guide.confirm-stay-booking.tip.1': 'Klõpsa sildil uuesti ja broneering on jälle olekus „Ootel“.',
  'help.guide.map-markers.tip.4':
    'Kui jaotises „Seaded“ > „Üldine“ alajaotises „Reisimine ja kaart“ on „Kompaktsed tähised planeerimata kohtadele“ sees, on kohad, mis pole veel ühelgi päeval, väikesed täpid ilma foto ja hinnanguta. Valitud koht on alati täies suuruses.',
  'help.guide.tour-map-lines.step.1':
    'Iga reisi retk on kaardil joonena oma värvis ja alguspunktis on nööpnõel. Kui valisid retkele värvi, kasutab joon seda. Muidu kasutab joon kategooria värvi.',
  'help.guide.car-stops.step.6': 'Klõpsa „Lisa“.',
  'help.guide.transport-details.step.4':
    'Klõpsa pealkirjal, et sõit ümber nimetada ilma vormi avamata. „Nimeta ümber“ avaneb, nimi on juba täidetud: kirjuta uus nimi ja klõpsa „Salvesta“.',
  'help.guide.export-transports-csv.goal':
    'Ekspordi reisi sõidud TREKist CSV-failina, et kasutada neid tabelis, saata reisibüroole või välja printida.',
  'help.guide.group-sort-bookings.result':
    'Broneeringud on valitud jaotistes ja järjekorras ning see brauser jätab valiku järgmiseks korraks meelde.',
  'help.guide.booking-on-map.step.1':
    'Klõpsa sellise broneeringu kaardil, millel on koht, mis on seotud väljal „Koht / tegevus“ või majutuse puhul väljal „Majutus“. Broneeringu üksikasjad avanevad.',
  'help.guide.export-bookings-csv.title': 'Broneeringute eksportimine tabelina',
  'help.guide.export-bookings-csv.tip.3':
    'Nupp on olemas kohe, kui vahelehel on mõni broneering. Vaheleht „Transport“ ekspordib oma kirjed samamoodi.',
  'help.guide.arrange-packing-list.title': 'Pakkimisnimekirja enda järjekorda seadmine',
  'help.guide.count-packed-pieces.result':
    'Real on näha, mitu tükki on pakitud, ja ese märgitakse tehtuks, kui viimane tükk on kotis.',
  'help.guide.expense-receipts.title': 'Kulule kviitungi lisamine',
  'help.guide.expense-receipts.tip.1':
    'Redaktoris avab loetletud faili nimel klõpsamine sama eelvaate. Esc sulgeb siis ainult eelvaate, mitte kulu.',
  'help.guide.files-sync-settings.step.5':
    '„Kui mõlemad pooled on muutunud“ määrab, milline koopia jääb alles, kui dokumenti muudeti mõlemas kohas: „Küsi minult“, „Säilita TREKi koopia“ või „Säilita salvestusteenuse koopia“. „Sünkrooni automaatselt“ laseb TREKil muudatusi taustal kontrollida; kui see on väljas, on kaardil kirjas „Peatatud“ ja sünkroonib ainult „Sünkrooni kohe“. Iga muudatus siin salvestub kohe.',
  'help.guide.manage-notes.step.5':
    '„Kustuta“ küsib enne „Kas kustutada märge?“, sest märge kustutatakse kõigi liikmete jaoks koos failidega. Kinnitamiseks klõpsa „Kustuta“.',
  'help.guide.note-categories.step.3':
    'Klõpsa kategooria nimel, et see ümber nimetada. Kirjuta uus nimi ja vajuta Enter; Esc jätab vana nime alles.',
  'help.guide.roadtrip-reorder.step.2':
    'Peatuse viimiseks teisele päevale aseta see selle päeva kaardil mõnele peatusele. Lohistamise ajal ilmub päev, kus on alla kahe peatuse, riba lõppu katkendliku kaardina ja selle peale võid samuti lohistada.',
  'help.guide.roadtrip-corridor.tip.4':
    'Vali filtri all üks päeva peatus või „Poolel teel“ kahe peatuse vahel, et jätta alles ainult see, mis on sellest punktist kuni 25, 50 või 100 km kaugusel. Kui loendis on laadijaid, kitsendavad „Mis tahes pistik“ ja „Mis tahes võimsus“ neid pistiku ja võimsuse järgi.',
  'help.guide.roadtrip-overnight.result':
    'Koht on sõidul selle päeva ööbimispeatusena ja majutus on reisis broneeritud nagu iga teine.',
  'help.guide.roadtrip-stop-fill.result':
    'Selles peatuses täidetakse paak valitud tasemeni. Selle järgne sõiduulatus, sealhulgas võimalik riba „Siin saab paak tühjaks“, arvutatakse selle põhjal.',
  'help.guide.roadtrip-bookings.step.4': 'Klõpsa kaardil, et broneering avada.',
  'help.guide.roadtrip-google-import.goal': 'Tee Google Mapsis planeeritud marsruudist peatused ühele oma päevale.',
  'help.guide.roadtrip-google-import.tip.3': 'Importimiseks on vaja ühendust ning õigust muuta nii kohti kui ka päevi.',
  'help.guide.roadtrip-hazards.tip.2':
    'DWD katab Saksamaad ja GDACS teatab katastroofidest kogu maailmas. Kui hoiatus on antud ainult punktina, on mõjutatud ala teadmata.',
  'help.ctx.trip-tours.bullet.5':
    'Päevade veerus on retk rida nagu peatus. Kui sellel on „Algus“, on real algus → lõpp, kusjuures lõpp arvutatakse retke aja järgi, ja menüüs „Veel valikuid“ on „Muuda“, „Eemalda päevast“, „Jäta marsruudist välja“ ja „Salvesta kogumikku“.',
  'help.guide.tour-show-list.step.5': 'Klõpsa samal lülitil „Kohad“, et kohtade loend tagasi tuua.',
  'help.guide.tour-add-to-day.step.2':
    'Vali päev. Menüüs on kõik reisi päevad koos kuupäeva ja pealkirjaga; päev, kus retk juba on, on hall.',
  'help.guide.tour-add-to-day.result': 'Retk on oma päeva all ja selle joon on kaardil selle päeva osa.',
  'help.guide.tour-day-times.tip.2':
    'Päev, kus on mitmepäevase retke üks etapp, ei saa arvutatud lõpuaega, sest retke aeg on kogu marsruudi aeg.',
  'help.guide.tour-remove-from-day.step.3':
    'Või klõpsa päeva päisel, et päev avada, klõpsa loendis retkel ja klõpsa selle kaardi allosas „Eemalda päevast“.',
  'help.guide.tour-filter-list.step.3':
    'Kui loendis on segamini eri retki, kitsendavad seda veelgi „Allikas“ (TREK, „GPX-import“, wanderer), „Marsruudi piir“ (T1 kuni T6) ja „Tüüp“ („Matk“, „Rattaretk“ jne). Klõpsa märgitud väärtusel uuesti, et see tühistada.',
  'help.guide.tour-hide-on-map.step.1':
    'Vii kursor loendis retkele ja klõpsa rea paremale ilmuval silmal („Peida kaardil“).',
  'help.guide.tour-import-plan-tab.step.1': 'Klõpsa vahelehel „Plaan“ parema veeru ülaosas oleval lülitil „Retked“.',
  'help.ctx.trip-tour-detail.bullet.1':
    'Klõpsa retkel loendis „Retked“ (lülita parem veerg enne „Kohad“ pealt „Retked“ peale), selle real päeva sees või selle joonel kaardil ja retke kaart avaneb kaardi peal. Kaarti saab kasutada ka siis, kui retke kaart on avatud.',
  'help.guide.tour-detail-read.step.2':
    'Päises on retke nimi ja siltidena kokkuvõte: retke tüüp, importimise korral päritolu, planeeritud aeg, vahemaa, tõus ja laskumine.',
  'help.guide.tour-detail-read.tip.3':
    'Mõnel retkel on rohkem teavet: linnajalutuskäigul peatused, aerutamisretkel kontrollid ja tuul, juba tehtud retkel „Tegelik rada“ ja nimekirjaga seotud retkel „Pakkimisnimekiri“.',
  'help.guide.tour-rename-colour.step.3':
    'Klõpsa retke ümmarguse ruudu nurgas oleval värvilisel täpil „Raja värv“. Päise alla avaneb jaotis „Raja värv“.',
  'help.guide.tour-take-along.step.2':
    'Kui retkel on veebileht, on selle kõrval oleval nupul saidi nimi (Komoot, AllTrails, Outdooractive või Wanderer) või muu saidi puhul „Veebisait“. See avab lehe uuel vahekaardil.',
  'help.guide.tour-copy-keep.goal':
    'Tee retkest selle reisi jaoks variant või salvesta see hilisemate reiside jaoks mõnda oma kogumikku.',
  'help.guide.tour-copy-keep.tip.4':
    '„Kogumik“ on saadaval ainult siis, kui lisamoodul „Kogumikud“ on sees. Nimekirja, mida tohid ainult lugeda, ei saa valida, ja kui nimekirja veel pole, pakub dialoog „Ava kogumikud“.',
  'help.guide.tour-packing-link.step.5':
    'Klõpsa „Ava pakkimisnimekiri“, et asju ära märkida. TREK avab vahelehe „Nimekirjad“ pakkimisnimekirjaga.',
  'help.guide.tour-files.step.2': 'Selle all olev rida näitab nüüd failide arvu ja loend avaneb.',
  'help.guide.tour-activity-link.step.2':
    'Kontrolli jaotises „Läbitud“ päeva, mil retke tegid. Kui see ei kuulu ühelegi päevale, vali „Päevata“.',
  'help.guide.tour-activity-compare.title': 'Plaani võrdlemine tegelikult tehtuga',
  'help.guide.tour-activity-compare.result': 'Saad päeva kiiresti plaaniga võrrelda nii kaardil kui ka retke kaardil.',
  'help.guide.tour-origin-check.tip.3':
    '„wandereri ühendus puudub“ tähendab, et sinu konto pole veel ühendatud. Ühenda see jaotises „Seaded“, „Integratsioonid“.',
  'help.ctx.trip-tour-planner.bullet.5':
    'Kaardi ülaosas olev „Otsi kohta või aadressi“ liigutab kaarti. All vasakul olev silt vahetab retke tüübi pakutavate kaartide vahel, näiteks „Topo“ või „Satelliit“, ja sisaldab avatud retke lüliteid, näiteks „Lisa punkte“ ja 3D.',
  'help.guide.tour-open-workspace.step.5':
    'Kaardi ülaosas olev „Otsi kohta või aadressi“ viib kaardi soovitud kohta, nii et saad alustada seal, kus retk on.',
  'help.guide.tour-draw-route.goal': 'Pane uue retke punktid kaardile ja lase TREKil nendevaheline marsruut arvutada.',
  'help.guide.tour-draw-route.tip.2':
    'Kaardi sildil olev „Topo“ või „Matkamine“ näitab radu, nii et neile on lihtsam klõpsata. Kui punkt on liiga kaugel igast teest, mida retke tüüp saab kasutada, näed marsruudi asemel teadet.',
  'help.guide.tour-type-profile.step.3':
    'Rattaretk küsib tüübi all „Profiil“: „Matk“, „Maantee“, „Kruus“ või „MTB“. Selle all olev rida ütleb, mida profiil eelistab.',
  'help.guide.tour-edit-points.step.2':
    'Klõpsa jaotises „Teekonnapunktid“ real, et selle punkt valida. Punkti nööpnõel tõstetakse kaardil esile.',
  'help.guide.tour-shaping-points.title': 'Marsruudi muutmine kujunduspunktiga',
  'help.guide.tour-shaping-points.tip.3':
    'Ratsamatkal ei lisa klõps joonel midagi, sest seda ei kujunda ükski marsruudiplaneerija.',
  'help.guide.tour-loop-reverse.tip.2':
    'Eemalda rida „Tagasi algusesse“, et teha retkest uuesti ühesuunaline. Käsitsi joonistatud lõik jääb käsitsi joonistatuks ka siis, kui retke suund pööratakse ümber.',
  'help.guide.tour-leg-by-hand.step.4':
    '„Arvuta järgmine lõik uuesti“ küsib marsruudiplaneerijalt uuesti ainult seda ühte lõiku, teisi muutmata.',
  'help.guide.tour-trip-places.step.3':
    'Klõpsa kohal. See lisatakse retke uueks lõpuks ja loend jääb järgmise koha jaoks avatuks.',
  'help.guide.tour-details-times.step.1':
    'Vasaku riba ülaosas olevas väljas „Retke nimi“ on nimi. Uuel retkel on seal hall tekst, näiteks „Nimetu matk“, mis on ainult kohatäide: kirjuta oma nimi.',
  'help.guide.tour-save.title': 'Retke salvestamine',
  'help.guide.tour-save.tip.3':
    '„Salvesta“ ei tööta ka siis, kui mõnel väljal on vigane väärtus, näiteks veebisait, mis pole aadress. „Üksikasjad“ avaneb automaatselt, et seda näidata.',
  'help.guide.tour-edit-saved.tip.1': '„Salvesta“ on hall, kui sa pole retke muutnud.',
  'help.guide.tour-summary-profile.step.3':
    'Liiguta kursorit mööda „Kõrgusprofiil“. See näitab selle punkti vahemaad ja kõrgust ning täpp tähistab sama kohta kaardil.',
  'help.guide.tour-list-manage.step.1':
    '„Reisi kogumaht“ on loendi kohal. Kokkupanduna näitab see retkede arvu ning seda, mitu on „Plaanis“ ja mitu „Planeerimata“. Paremal olev nool avab iga tüübi kohta rea, kus on kokku liidetud vahemaa, tõus, laskumine ja ajad.',
  'help.guide.tour-list-manage.result':
    'Näed filtri järgi kuvatud retkede kogusummasid ja iga retk on soovitud päeval.',
  'help.guide.tour-delete.result': 'Retk on loendist, kaardilt ja kõigilt päevadelt kadunud.',
  'help.guide.tour-saved-elsewhere.tip.2':
    'Sama juhtub, kui muutsid retke teises seadmes. Retk, mida sa pole muutnud, laaditakse lihtsalt uuesti ja märkus annab sellest teada.',
  'help.ctx.trip-tour-import.bullet.5':
    'Kui wanderer on jaotises „Seaded“, „Integratsioonid“ ühendatud, on nupu „Planeeri uus retk“ kõrval wandereri nupp, kuni ükski retk pole avatud. See loetleb sinu enda rajad, mida saad importida.',
  'help.guide.tour-import-gpx.tip.1': 'Võid failid ka arvutist vahelehele „Retked“ lohistada. Avaneb sama eelvaade.',
  'help.guide.tour-view-import.step.1':
    'Klõpsa vahelehel „Retked“ jaotises „Selle reisi retked“ retkel, millel on märk „GPX-import“.',
  'help.guide.tour-plan-from-import.goal':
    'Saa salvestatud rajast teekonnapunktid, mida saad liigutada, ja vaata, kui lähedal rajale uus marsruut püsib.',
  'help.guide.tour-plan-from-import.tip.4':
    '„Ratsamatk“ ei saa muudetavat versiooni: see säilitatakse nii, nagu see läbiti.',
  'help.guide.tour-restore-recorded.tip.2':
    'Valikuga „Planeeri uue retkena“ loodud retkel pole oma salvestatud rada. Import, millest see loodi, on endiselt loendis.',
  'help.guide.tour-take-over.step.5': 'Soovi korral anna sellele väljal „Nimi sellel reisil“ teine nimi.',
  'help.guide.tour-import-wanderer.step.1':
    'Kui vahelehel „Retked“ pole ükski retk avatud, klõpsa nupu „Planeeri uus retk“ kõrval wandereri nupul.',
  'help.guide.tour-import-wanderer.result': 'Rada on reisi retk ja avaneb kaardil wanderer-retkena.',
  'help.guide.tour-map-layers.title': 'Retke kaardi valimine',
  'help.guide.tour-map-layers.tip.3':
    'Aerutamisretk ja linnajalutuskäik pakuvad ainult „Kaart“ ja „Satelliit“; jooks, suusaretk ja ratsamatk pakuvad „Kaart“, „Topo“ ja „Satelliit“.',
  'help.guide.tour-along-search.result': 'Marsruudi ääres olevad kohad on loendis ja kaardil vaatamiseks valmis.',
  'help.guide.tour-along-add-stop.step.3':
    'Klõpsa „Lisa peatusena“. Selle kõrval olev märk on ümbersõidu umbkaudne hinnang, mõõdetud linnulennult.',
  'help.guide.tour-3d-terrain.step.1':
    'Ava retk vahelehel „Retked“ ja klõpsa all vasakul oleva sildi lõpus „3D“. Kaart kaldub ja näitab maastikku 3D-s, marsruut on selle peale joonistatud.',
  'help.guide.tour-3d-terrain.tip.3':
    'Maastiku jaoks on vaja ühendust: kõrgused tulevad Mapzeni avatud maastikupaanidest. Aerutamisretk joonistatakse oma värviga ilma tõusudeta, sest vesi on tasane.',
  'help.guide.tour-3d-flyover.tip.1':
    'Keri ülelennu ajal hiirerattaga, et sisse või välja suumida; kaamera jääb täpi juurde. Kaarti ei saa lohistada enne, kui oled pausi pannud.',
  'help.guide.tour-map-overlays.step.4':
    'Aerutamisretkel pakub silt hoopis „Navigatsioonimärgid“. Klõpsa sellel, et näha veel olevaid poisid, tuletorne ja sadamamärke.',
  'help.ctx.trip-tour-stages.bullet.2':
    'Peatuse menüüs „Rohkem toiminguid“ olev „Lõpeta etapp siin“ lõpetab etapi selles peatuses. Jaotises „Teekonnapunktid“ on seejärel iga etapi kohta pealkiri „Etapp N“ koos vahemaa ja ajaga ning etappi lõpetaval peatusel on kuu ikoon.',
  'help.guide.tour-multi-day.step.3':
    'Vii kursor peatusele, kus esimene päev lõpeb, klõpsa „Rohkem toiminguid“ ja vali „Lõpeta etapp siin“.',
  'help.guide.tour-multi-day.result':
    'Üks marsruut etappidega, millest igaüks on eraldi mõõdetud. Klõpsa „Salvesta“, et need säilitada.',
  'help.guide.tour-stages-on-days.step.6':
    'Selle kõrval olev nool „Ava see etapp planeerijas“ avab retke redaktoris selle etapi juures.',
  'help.ctx.trip-tour-hike.bullet.1':
    'Redaktori ülaosas olev „Matka tüüp“ määrab, kuidas marsruut planeeritakse. „Matk“ kasutab radu kuni jaotises „Üksikasjad“ määratud „Raja suurim raskusaste“ tasemeni; „Jooks“ kasutab jooksmiseks sobivaid teid ja küsib sinu „Planeeritud tempo“.',
  'help.guide.tour-hike-plan.step.1':
    'Klõpsa vasaku veeru ülaosas „Planeeri uus retk“. Redaktor avaneb nimega „Uus retk“.',
  'help.guide.tour-hike-plan.tip.2':
    'T4 ja kõrgemad küsivad enne „Kas lubada alpimarsruutide arvutamine?“. Kinnita ainult siis, kui marsruut võib läbida järsakuid või märgistamata maastikku; küsimus tuleb ühe muutmisseansi jooksul ainult üks kord.',
  'help.guide.tour-hike-trail-details.step.4':
    'Klõpsa loendis raskusastmel, et näha kaardil ainult neid lõike. Klõpsa uuesti, et näha kogu marsruuti.',
  'help.guide.tour-hike-round.step.1':
    'Kui matk on avatud, klõpsa kaardi „Teekonnapunktid“ päises „Ringmatk algusest“. Mõnest muust peatusest ava selle „Rohkem toiminguid“ ja vali „Ringmatk siit“.',
  'help.guide.tour-hike-round.tip.3':
    '„Otsi uuesti“ viib tagasi vahemaa valimise juurde ja „Tühista“ sulgeb kaardi midagi muutmata.',
  'help.guide.tour-hike-compare-ways.tip.1':
    'Seda pakuvad ainult matkad ja ainult marsruudiplaneerija arvutatud lõigu puhul, mitte käsitsi joonistatud lõigul.',
  'help.guide.tour-ferrata-add.step.4':
    'Jaotises „Teekonnapunktid“ on nende kahe punkti vahelisel lõigul via ferrata nimi, raskusaste ja pikkus.',
  'help.guide.tour-run-plan.goal': 'Planeeri jooks jooksmiseks sobivatel teedel ja saa selle aeg oma tempo järgi.',
  'help.guide.tour-run-plan.tip.2':
    'Tõusud, laskumised ja tee tehnilisus aega ei mõjuta: see on vahemaa korda tempo ja ei midagi muud.',
  'help.guide.tour-run-ways.result': 'Tead enne minekut, millised jooksu osad pole asfaldil.',
  'help.ctx.trip-tour-walk.bullet.4':
    '„Matka ääres“ leiab teema („Jalutuse teema“) järgi vaatamisväärsusi marsruudi lähedalt ja „Lisa peatusena“ lisab ühe neist jalutuskäigule sinu valitud kohta.',
  'help.guide.tour-walk-plan.step.5':
    'Määra „Tähtsus“ väärtusele „Tavaline“, „Valikuline“ või „Kindlasti näha“. Lülita sisse „Kaitstud“ peatuse jaoks, mis peab jääma paigale, kui hiljem pakutakse muudatust, seejärel klõpsa „Salvesta“.',
  'help.guide.tour-walk-sights.step.1':
    'Kui linnajalutuskäik on avatud, leia vasakust veerust „Matka ääres“ ja vali „Jalutuse teema“: „Kultuur ja ajalugu“, „Pargid ja vaated“, „Toit ja kohalik elu“ või „Igaühest natuke“.',
  'help.guide.tour-walk-sights.result':
    'Vaatamisväärsus on jalutuskäigu peatus, mis on planeeritud marsruudile sinu valitud peatuste vahele.',
  'help.guide.tour-walk-day-times.tip.2':
    'Kui peatusel pole veel viibimisaega, on järgnevad saabumisajad näidatud varaseimate võimalike aegadena.',
  'help.guide.tour-walk-google-import.step.3':
    'Kontrolli jaotist „Lingi peatused“. Peatus, millel lingis asukohta pole, märgitakse ja jäetakse välja.',
  'help.guide.tour-walk-check-off.step.1':
    'Klõpsa vahelehel „Plaan“ linnajalutuskäigul selle päeva all. Selle kaart avaneb kaardi kõrval.',
  'help.ctx.trip-tour-bike.title': 'Rattaretked',
  'help.guide.tour-bike-profile.step.1': 'Klõpsa vahelehel „Retked“ vasaku riba ülaosas „Planeeri uus retk“.',
  'help.guide.tour-bike-profile.tip.2':
    'Profiil ainult suunab marsruudiplaneerijat. See ei ütle, kas teel saab sõita: kaart „Kate ja teed“ näitab, millel marsruut kulgeb.',
  'help.guide.tour-bike-surfaces.step.3':
    'Klõpsa jaotises „Kate“ real, näiteks „Kruus“ või „Pinnas“. Selle lõigud tõstetakse kaardil esile. Esiletõstu eemaldamiseks klõpsa real uuesti.',
  'help.guide.tour-bike-mtb-grades.goal': 'Vaata enne sõitu, kui rasked on MTB-retke rajad.',
  'help.guide.tour-bike-mtb-grades.tip.4':
    'Kui vahetad „Profiil“ MTB pealt muule, kaovad raskusastmete jaotised. Seejärel planeeritakse marsruut uue profiili järgi uuesti.',
  'help.guide.tour-ski-plan.title': 'Suusa- ja talveretke planeerimine',
  'help.guide.tour-ski-plan.tip.1':
    'Murdmaasuusatamise puhul vali ka „Tehnika“: „Klassika“, „Uisutehnika“ või „Teadmata“. Väljade all olev teade ütleb, mis veel puudub.',
  'help.guide.tour-ski-options.step.2':
    'Ava „Raskeimad nõlvad“ ja vali kõrgeim raskusaste, mida soovid sõita, tasemest „Algaja“ kuni „Ekspert“. Vaikimisi on „Keskmine“.',
  'help.guide.tour-ski-fix-leg.title': 'Planeerimata suusalõigu parandamine',
  'help.guide.tour-ski-fix-leg.tip.4':
    'Kuni kõik lõigud pole planeeritud, on kaardil „Nõlvamarsruut“ kirjas, et suusaaega veel pole.',
  'help.guide.tour-ski-summary.tip.2':
    '„Suusaaeg“ on „Arvutamata“, kuni kõik lõigud on planeeritud. Kui tahad retkele siiski aja anda, sisesta selle üksikasjadesse planeeritud koguaeg.',
  'help.guide.tour-ski-pistes-layer.step.3':
    'Legend näitab laskumisnõlvu raskuse järgi, murdmaasuusaradu, talve- ja räätsaradu, kelguradu ja tõstukeid. „Täielik legend OpenSnowMapis“ avab kogu legendi.',
  'help.guide.tour-ski-import.step.2': 'Ava jaotises „Impordi eelvaade“ „Impordi kui“ ja vali „Suusad ja talv“.',
  'help.guide.tour-ski-import.result':
    'Rada on jaotises „Selle reisi retked“ ning selle ala ja tehnika on kaardil „Suusarada“.',
  'help.ctx.trip-tour-paddle.bullet.6':
    'Vasaku veeru allosas olev rida „Aerutamisel on riske“ avab lehe „Ohutus vee peal“. Kaart pakub vaateid „Kaart“ ja „Satelliit“ ning kattekihina „Navigatsioonimärgid“.',
  'help.guide.tour-paddle-setup.step.6':
    '„Aerutamiskiirus“ näitab paadi järgi soovitatud kiirust hallina. Kui sisestad oma kiiruse, on väljal kirjas „Oma kiirus“; selle all olev link „Kasuta soovitatut“ võtab jälle paadi kiiruse.',
  'help.guide.tour-paddle-water-route.goal':
    'Lase TREKil planeerida lõik mööda jõge või järve ja mõista märkusi lõigul, mida ei õnnestunud planeerida.',
  'help.guide.tour-paddle-water-route.tip.3':
    'Planeeritud lõigu all olevad märkused tähistavad kärestikku koos raskusastmega, paadirenni („Paadirenn“) või kaardiandmete lünka („Lünk kaardiandmetes“), mis on ületatud sirgjoonega.',
  'help.guide.tour-paddle-portage.step.4':
    'Jaotises „Marsruut“ kasutab „Järgi rada“ kaardistatud teed ja „Sirge joon“ läheb otse. TREK otsib raja ise ja annab teada, kui seda ilma pika ümbersõiduta pole.',
  'help.guide.tour-paddle-lock.step.1':
    'Vii kursor lüüsi juures olevale peatusele ja klõpsa „Rohkem toiminguid“ (kolm täppi).',
  'help.guide.tour-paddle-time.title': 'Aerutamisretke aja lugemine ja kohandamine',
  'help.guide.tour-paddle-time.tip.2': 'Hoovust ja tuult hinnang ei arvesta.',
  'help.guide.tour-paddle-wind.step.4':
    'Ava „Mida tuul aerutamisel tähendab“, et lugeda, kuidas vastutuul, külgtuul, avatud vee ületamine ja puhangud paati mõjutavad.',
  'help.guide.tour-paddle-checklist.step.1':
    'Salvesta aerutamisretk, seejärel leia vasakust veerust „Kontrollnimekiri“. Selle päises olev märk võtab kokku nimekirja seisu.',
  'help.guide.tour-paddle-checklist.tip.4':
    'Takistused pärinevad TREKis olevate piirkondade OpenStreetMapi andmetest. Kui andmeid pole, annab kaart sellest teada ja pead paisud, lüüsid ja ülekanded ise üle kontrollima.',
  'help.guide.tour-paddle-track-marks.step.4':
    'Klõpsa rajal jaotises „Selle reisi retked“. Vasakus veerus on see näha nii, nagu see salvestati, koos kaardiga „Ülekanded ja lüüsid“.',
  'help.ctx.trip-tour-horse.title': 'Ratsamatkad',
  'help.guide.tour-horse-plan.goal': 'Koosta ratsamatk kaardivaates tähistatud ratsateede lõikudest.',
  'help.guide.tour-horse-plan.result':
    'Ratsamatk järgib valitud lõike, igaühel marsruudi nimi, juurdepääsu täpp ja pikkus, ning see on jaotises „Selle reisi retked“.',
  'help.guide.tour-horse-gap.step.1':
    'Kui ratsamatkal on juba lõik, ava teine marsruut ja vali lõik, mis ei puuduta sinu ratsamatka lõppu. Jaotises „Ühendus matkaga“ näitab teade, kui kaugel need teineteisest on.',
  'help.guide.tour-horse-recorded.title': 'GPX-failist salvestatud ratsamatka säilitamine',
  'help.guide.tour-horse-recorded.tip.2': 'Kõrgusteta faili puhul on null tõusu asemel kirjas „Failis pole kõrgusi“.',
  'help.guide.dateless-trip.tip.1':
    'Kui tead, millal reisid, ava kaardil oleva pliiatsiga vorm ja vali kuupäevad. Planeeritud päevad jäävad samasse järjekorda ja saavad kuupäevad selles järjekorras.',
  'help.guide.trip-reminder.goal': 'Saa meeldetuletus paar päeva enne lahkumist.',
  'help.guide.upcoming-reservations.tip.2':
    '„Ootel“ tähistab broneeringut, mis pole veel kinnitatud. Tühistatud broneeringuid ja arhiveeritud reise ei näidata.',
  'help.guide.half-company-holiday.tip.1':
    'Sellele päevale juba märgitud puhkus lüheneb poole päevani. Igaüks, kes selle päeva hiljem märgib, kasutab ainult 0,5 päeva.',
  'help.guide.edit-holiday-calendar.goal':
    'Nimeta ümber, muuda värvi, teisalda või kustuta lisatud riigipühade või koolivaheaegade kalender.',
  'help.guide.person-color.title': 'Inimese värvi muutmine',
  'help.guide.answer-fusion-request.tip.1':
    'Taotlus jääb avatuks, kuni sellele vastad. Kui taotlusi on mitu, näed neid üksteise järel.',
  'help.guide.log-for-partner.tip.1': '„Pool päeva“ ja „Vaba / tasaarvestuspäev“ töötavad ka valitud inimese puhul.',
  'help.guide.dissolve-fusion.tip.2': 'Kui tahad, et keegi ainult näeks sinu päevi, jaga hoopis oma kalendrit.',
  'help.guide.country-details.tip.2': 'Klõpsa märgil „Kohad“, et näha kõiki riigi alla arvestatud kohti reiside kaupa.',
  'help.guide.country-places.tip.2':
    'Märk ilmub ainult siis, kui riigil on oma kohti. Ainult käsitsi märgitud riigil neid pole.',
  'help.guide.tour-activity-stats.goal':
    'Vaata kõigi oma reiside tehtud retkede vahemaad, tõusu ja arvu valitud perioodi ja tüübi kohta ning jäta välja retk, mis jäi ära.',
  'help.guide.tour-activity-stats.tip.1':
    'Retk läheb arvesse pärast selle viimase päeva möödumist. Retk, mis pole ühelgi päeval või on ainult kuupäevadeta päevadel, ei lähe kunagi arvesse. Arvesse võtmiseks pane see oma reisis kuupäevaga päevale.',
  'help.guide.move-to-list.result':
    'Kohad on teises nimekirjas ja lühike teade näitab, mitu kohta teisaldati või kopeeriti.',
  'help.guide.accept-list-invite.tip.1':
    'See, mida nimekirjas teha saad, sõltub omaniku antud rollist: „Vaataja“, „Muutja“ või „Administraator“.',
  'help.guide.tour-collection-add-to-trip.title': 'Nimekirjast retke lisamine reisile',
  'help.guide.tour-collection-add-to-trip.tip.3':
    'Retke salvestamiseks nimekirja ava reisis salvestatud retk ja klõpsa selle allosas „Kogumik“.',
  'help.guide.tour-collection-manage.tip.2': 'Prügikasti näevad ainult nimekirja omanik ja administraatorid.',
  'help.guide.entry-draft.result':
    'Sissekanne jääb sinu ajajoonele märgisega „Mustand“ ja seda ei näidata jagatud lingis.',
  'help.guide.journey-map-layers.title': 'Reisiloo kaardi kihtide valimine',
  'help.guide.journey-keep-route.title': 'Päeval salvestatud marsruudi säilitamine',
  'help.guide.journey-day-stays.title': 'Sissekannete kirjutamine Dawarichi salvestatud peatumistest',
  'help.guide.journey-take-over-day.title': 'Terve salvestatud päeva ülevõtmine',
  'help.guide.journey-take-over-day.result':
    'Päeval on nüüd üks mustand iga peatumise või ühendatud rühma kohta või üks päevaülevaade ning selle peatumisi ei näidata enam ootel olevatena.',
  'help.guide.journey-auto-prepare.result':
    'Seotud reisi ajal on iga päeva peatumised selle päeva juures valmis valiku „Võta päev üle“ jaoks.',
  'help.ctx.settings-about.title': 'Teave',
  'help.guide.web-push-device.tip.3':
    'Tõuketeavitused töötavad ainult siis, kui TREK on avatud HTTPS-i kaudu. Kui teavitused on blokeeritud, luba need brauseri seadetes ja proovi uuesti.',
  'help.guide.connect-airtrail.result':
    'Märgil on „Ühendatud“ ja reisi vahelehel „Transport“ on valik „Impordi AirTrailist“.',
  'help.guide.connect-dawarich.result':
    'Märgil on „Ühendatud“ ning reisiplaneerija, päevik ja Atlas saavad pakkuda Dawarichi salvestatud andmeid.',
  'help.guide.tour-connect-wanderer.result':
    'Märgil on „Ühendatud“ ja reisi vahelehel „Retked“ saab sinu wandereris otsida ja sealt radu importida.',
  'help.guide.tour-wanderer-watch.result':
    'TREK kontrollib sinu imporditud radu ja annab teada, kui mõni võib olla muutunud. Retk muutub ainult siis, kui muudatuse vastu võtad.',
  'help.guide.plugin-settings.step.1':
    'Ava seadete külgribal „Pluginad“. Jaotise „Pluginate seaded“ all on igal sinult seadeid vajaval pluginal kaart oma väljadega: täida need ja klõpsa „Salvesta“. Kaardil olevad toimingud käivituvad pärast kinnitust.',
  'help.guide.profile.step.3': 'Klõpsa kaardi jaluse paremas servas „Salvesta profiil“.',
  'help.guide.default-user-settings.title': 'Uute kasutajate algseadete määramine',
  'help.guide.own-routing-engine.tip.1':
    'Avalikud OSRM-serverid lubavad umbes ühe päringu sekundis. Ühe päeva jaoks piisab, kuid autoreisi jaoks võib see liiga aeglane olla.',
  'help.guide.admin-passkeys.goal': 'Luba inimestel sisse logida sõrmejälje, näotuvastuse või seadme PIN-koodiga.',
  'help.guide.rotate-jwt-secret.tip.2':
    'Kui tahad välja logida ainult ühe inimese, anna talle dialoogis „Muuda kasutajat“ „Uus parool“. See lõpetab ainult tema seansid.',
  'help.guide.notification-defaults.goal':
    'Määra, millised on kõigi kasutajate teavituste algseaded, ja blokeeri sündmuse jaoks kanal täielikult.',
  'help.ctx.notifications.summary':
    'Kõik teavitused, mida TREK on sulle rakenduses näidanud, uusimad eespool: keegi muutis broneeringut, reisivestlusse tuli uus sõnum, sinuga jagati kalendrit. Paremal üleval olev kellaikoon näitab kümmet uusimat, see leht näitab kõiki.',
  'help.guide.read-notifications.step.1':
    'Klõpsa paremal üleval kellaikoonil. Sellel olev punane number näitab lugemata teavituste arvu.',
  'help.guide.filter-notifications.step.1': 'Klõpsa paremal üleval kellaikoonil.',
  'help.guide.mark-notifications-read.step.2':
    'Klõpsa ülal „Märgi kõik loetuks“, et märkida kõik teavitused korraga loetuks.',
  'help.guide.delete-notifications.tip.1':
    'Kustutamine eemaldab teavituse ainult sinu jaoks. Broneering, sõnum või jagamine, millest teavitus rääkis, jääb samaks.',
  'help.guide.notification-settings.tip.1':
    'Lukk lahtris tähendab, et administraator on selle sündmuse kõigi jaoks välja lülitanud.',
  'help.guide.add-guest.tip.3':
    'Külalisi saab lisada, ümber nimetada ja eemaldada ainult reisi omanik. Külalist, kes on mõne kulu eest maksnud, ei saa eemaldada enne, kui muudad maksjat või kustutad makse.',
  'help.guide.link-journal.tip.1':
    'Siduda saad ainult päevikuid, mille omanik oled. Päevikut, kuhu saad ainult kirjutada, siduda ei saa.',
  'help.ctx.trip-places.bullet.7':
    'Otsingu kõrval olev linnuke alustab valimist. Veeru allosas oleva ribaga saad mitmele reale korraga anda uue kategooria, lisada need kogumikku, märkida külastatuks või kustutada.',
  'help.guide.filter-places.step.5':
    'Kui reis hõlmab rohkem kui üht riiki või piirkonda, saad gloobusega loendit filtreerida ühe riigi või selle ühe piirkonna järgi, igaühe juures arv. „Tühjenda filter“ taastab valiku „Kõik riigid“.',
  'help.guide.import-places-file.tip.3':
    'Kui „Retked“ on sees, nagu vaikimisi, impordid faili veeru ülaosas oleva „Retkede“ kaudu nupuga „Impordi GPX või KML“ ja selle joontest saavad retked. Failis olevaid nööpnõelu seal ei impordita, sest retked koosnevad ainult joontest.',
  'help.guide.dawarich-stays.step.3':
    'Kontrolli välju „Nimi“, „Saabusid“ ja „Lahkusid“, vali „Päev“ või jäta „Veel päevaga sidumata“, lisa soovi korral „Märkmed“ ja klõpsa „Lisa koht“.',
  'help.guide.leave-stop-off-route.result':
    'Peatus on endiselt päeva ja PDF-i osa; kuni sellel on märk „Marsruudist väljas“, kulgeb marsruut otse eelmisest peatusest järgmisse.',
  'help.guide.move-booking-day.tip.2':
    'Oma päeva sees liigub kellaajaga broneering alati tagasi oma kellaajale vastavasse kohta.',
  'help.guide.place-image-from-file.step.3':
    'Klõpsa jaotises „Manustatud failidest“ soovitud fotol. Selle kohal olev „Laadi seadmest üles“ valib hoopis uue foto sinu arvutist.',
  'help.guide.place-own-hours.step.1': 'Ava koht ja klõpsa kaardi paremas allnurgas „Muuda“. Avaneb koha vorm.',
  'help.guide.place-own-hours.tip.3':
    'Klõpsa „Eemalda lahtiolekuajad“, seejärel „Uuenda“, et kaardil oleksid jälle automaatselt leitud ajad.',
  'help.guide.confirm-stay-booking.title': 'Majutuse broneeringu kinnitamine',
  'help.guide.confirm-stay-booking.tip.2':
    'Sama silt töötab igas broneeringus, ka päeva jaotises „Broneeringud“ olevates broneeringutes.',
  'help.guide.map-lock.tip.2':
    'See brauser jätab luku iga reisi jaoks meelde. Reisi avamisel suumib kaart siiski ühe korra reisile, nii et see ei avane kunagi tühjal alal.',
  'help.guide.tour-map-lines.step.2':
    'Klõpsa joonel või selle alguses oleval nööpnõelal. Retke kaart avaneb kaardi alaosas ja selle joon muutub laiemaks valge äärisega, nii et näed seda teiste joonte seas. Kaardi päises olev X sulgeb selle.',
  'help.guide.car-stops.title': 'Peatustega autosõidu planeerimine',
  'help.guide.car-stops.result':
    'Sõit on kaart vahelehel „Transport“ ja rida oma päeval ning selle joon kaardil kulgeb kättesaamiskohast järjest läbi kõigi peatuste tagastuskohani.',
  'help.guide.transport-details.step.5':
    'Üksikasjade allosas olev „Kaardil“ näitab sõidu joont ja avab selle päeva „Plaani“. Paremas servas olev „Muuda“ avab täieliku vormi ja selle kõrval olev prügikast kustutab sõidu pärast kinnitust.',
  'help.guide.export-transports-csv.step.1':
    'Kui tahad ainult osa loendist, kitsenda seda enne. Arvesse lähevad „Otsi“, „Filter“ ja „Vaate valikud“ all olev sortimine: failis on see, mida vaheleht näitab, ja samas järjekorras.',
  'help.guide.group-sort-bookings.tip.1':
    '„Kaartidel“ ja „Loendil“ on oma rühmitus: „Kaardid“ on alguses oleku järgi, „Loend“ päevade järgi. Täpp valikul „Vaate valikud“ näitab, et miski erineb vaikeseadest, ja paneeli allosas olev „Lähtesta vaade“ taastab vaikeseaded.',
  'help.guide.booking-on-map.step.2': 'Klõpsa üksikasjade allosas „Kaardil“.',
  'help.guide.export-bookings-csv.goal':
    'Ekspordi reisi broneeringud CSV-failina, mida saab avada Excelis, Numbersis või mõnes muus tabelarvutusprogrammis.',
  'help.guide.arrange-packing-list.goal':
    'Teisalda terveid nimekirju ja üksikuid esemeid soovitud kohta või vaata iga nimekirja nime järgi järjestatuna.',
  'help.guide.check-off-packing.tip.4':
    'Kui eseme kogus on üle ühe, saad tükke märkida pakituks ka ükshaaval. Vaata juhendit „Ühe asja mitme tüki pakkimine“.',
  'help.guide.count-packed-pieces.tip.1':
    'Märkeruudu märkimine pakib kõik tükid korraga ja märke eemaldamine võtab need kõik jälle välja.',
  'help.guide.expense-receipts.goal':
    'Hoia kviitung või arve koos kuluga, millele see kuulub, ja ava see pearaamatust uuesti.',
  'help.guide.expense-receipts.tip.2':
    'Kviitungi kõrval olev prügikast eemaldab selle salvestamisel kulult. Fail ise jääb jaotisse „Failid“; täielikuks eemaldamiseks kustuta see sealt.',
  'help.guide.files-sync.tip.4':
    'Kui kaardil on kollane teade nupuga „Ühenda uuesti“, ei aktsepteeri salvestusteenus enam salvestatud sisselogimisandmeid. Klõpsa „Ühenda uuesti“, sisesta uus rakenduse parool või tõend ja sünkroonimine algab uuesti.',
  'help.guide.files-sync-settings.result':
    'Järgmisest käivitusest alates sünkroonib reis ainult valitud suunas ning kustutamisi ja vastuolulisi muudatusi käsitletakse sinu määratud reeglite järgi.',
  'help.guide.manage-notes.result':
    'Märge on kaardilt „Märkmed“ kadunud kõigi liikmete jaoks korraga. Märge, mille ainult kinnitasid või mida muutsid, jääb alles ja teised näevad seda sellisena, nagu selle jätsid.',
  'help.guide.note-categories.step.4':
    'Rea värvitäpid määravad kategooria värvi: „Indigosinine“, „Punane“, „Merevaigukollane“, smaragdroheline, „Sinine“ või „Violetne“. Siin muutub „Majutus“ merevaigukollaseks.',
  'help.guide.roadtrip-reorder.step.3':
    'Klaviatuuriga: vii fookus peatusele ja vajuta Alt koos üles- või allanoolega, et liigutada seda oma päeva sees ühe koha võrra.',
  'help.guide.roadtrip-overnight.title': 'Ööbimine marsruudi ääres',
  'help.guide.roadtrip-overnight.tip.1':
    'Ööbimine kestab järgmise päevani. Muude kuupäevade jaoks muuda broneeringut: muuda kuupäevi jaotises „Päevad“ koos ülejäänud majutusega.',
  'help.guide.roadtrip-stop-fill.tip.1':
    'Märk on ainult peatustel, kus sinu auto saab tankida või laadida: tanklad „Bensiin“ puhul, laadimispunktid „Elektriline“ puhul, mõlemad „Kumb tahes“ puhul.',
  'help.guide.roadtrip-bookings.result':
    'Iga broneeritud sõit on sõidus selles kohas, kus see toimub, ning teekond enne ja pärast seda viib selle terminalidesse ja sealt edasi.',
  'help.guide.roadtrip-google-import.step.1':
    'Klõpsa jaotise „Marsruudil“ ülaosas kolmel täpil ja vali „Impordi Google Mapsi marsruut“.',
  'help.guide.roadtrip-hazards.title': 'Kehtivate hoiatuste näitamine kaardil',
  'help.guide.roadtrip-hazards.tip.3':
    'Andmevooge värskendatakse iga kümne minuti järel ja selleks on vaja ühendust. Nagu teisedki sõiduseaded, salvestatakse lüliti reisi juurde.',
  'help.ctx.trip-tours.bullet.6':
    'Marsruudi muutmine ja retke kustutamine käib vahelehel „Retked“ jaotises „Selle reisi retked“.',
  'help.guide.tour-show-list.tip.1':
    'Klõpsa kaardil retke joonel ja loend tõstab selle retke esile ning kerib selleni.',
  'help.guide.tour-add-to-day.step.3':
    'Teade „Lisatud päevale 10“ kinnitab seda, reale ilmub päevamärk ja vasakus veerus on päeva all retk koos aja, vahemaa ja tõusuga.',
  'help.guide.tour-day-times.title': 'Retkele päeval algusaja määramine',
  'help.guide.tour-day-times.tip.3':
    'Samas menüüs olev „Jäta marsruudist välja“ jätab retke päeva, kuid jätab selle kaardil päeva marsruudist välja. „Lisa tagasi marsruuti“ tühistab selle.',
  'help.guide.tour-remove-from-day.tip.1':
    'Mitmepäevase retke eemaldad päevadelt ükshaaval, sest igal päeval on oma etapp.',
  'help.guide.tour-filter-list.step.4':
    'Sulge menüü. Nupul on nüüd olek, allesjäänud retkede arv ja iga lisafiltri kohta +1.',
  'help.guide.tour-hide-on-map.step.2':
    'Retke joon peidetakse kaardil. Rida jääb loendisse tuhmina ja sellel on läbikriipsutatud silm („Näita kaardil“). Klõpsa sellel, et joon uuesti näha.',
  'help.guide.tour-import-plan-tab.step.2':
    'Klõpsa loendi ülaosas „Impordi GPX või KML“ ja vali oma failid (GPX, KML või KMZ).',
  'help.ctx.trip-tour-detail.bullet.2':
    'Päises on retke ümmargune ruut, nimi koos ümbernimetamise pliiatsiga, joone värvi näitav värviline täpp ning sildid tüübi, päritolu, planeeritud aja, vahemaa, tõusu ja laskumisega. Paremal olev X sulgeb kaardi, samuti Escape.',
  'help.guide.tour-detail-read.step.3':
    'Vii kursor ajale, et näha, millest see koosneb: liikumisaeg, pausid ja planeeritud koguaeg.',
  'help.guide.tour-detail-read.tip.4':
    'Kaart ei muuda marsruuti. Punkti liigutamiseks või lõigu ümberjoonistamiseks ava vaheleht „Retked“ ja klõpsa retkel jaotises „Selle reisi retked“.',
  'help.guide.tour-rename-colour.step.4':
    'Vali värv. Esimene lahter „Automaatne värv“ taastab joone vaikevärvi ja viimane, „Vali kohandatud värv“, laseb valida mis tahes värvi. Joon kaardil ja triip retkede loendis muutuvad kohe.',
  'help.guide.tour-take-along.step.3':
    'Klõpsa „GPX“, et laadida salvestatud retk alla GPX-failina: kogu marsruut koos olemasolevate kõrgustega, valmis navigatsioonirakenduse või GPS-seadme jaoks.',
  'help.guide.tour-copy-keep.step.1':
    'Ava retke kaart ja klõpsa all „Kopeeri“. TREK loob uue, sõltumatu retke ilma päevadeta ja algne retk jääb samaks.',
  'help.guide.tour-copy-keep.result':
    'Reisil on teine retk, mida saad vabalt muuta, ja kogumikus on oma koopia, mille saab lisada teisele reisile.',
  'help.guide.tour-packing-link.tip.1':
    'See on ainult seos. Midagi ei kopeerita ega teisaldata ja esemed jäävad jaotisse „Nimekirjad“. Kui märgid seal eseme, näitab retk seda kohe.',
  'help.guide.tour-files.step.3': 'Klõpsa failil, et see avada.',
  'help.guide.tour-activity-link.step.3':
    'Vali jaotises „Rada“ salvestus või klõpsa „Impordi GPX“, et lisada uus fail.',
  'help.guide.tour-activity-compare.goal': 'Vaata, kus tegelik rada plaanist erineb, ning muuda seda või eemalda seos.',
  'help.guide.tour-origin-check.title': 'Retke päritolu vaatamine',
  'help.guide.tour-origin-check.result': 'Tead, kust ja millal retk tuli ning kas see on pärast seda muutunud.',
  'help.ctx.trip-tour-planner.bullet.6':
    'Salvestamata mustand säilib: kui avad vahelehe „Retked“ uuesti, taastatakse see teatega „Salvestamata mustand taastatud“. „Tagasi retkede juurde“ ja „Loobu“ küsivad enne muudatustest loobumist kinnitust.',
  'help.guide.tour-open-workspace.step.6':
    'All vasakul olev silt vahetab kaarti, alguses „Kaart“ või „Satelliit“. Kui retk on avatud, pakub see retke tüübi kaarte, näiteks „Topo“ või „Matkamine“, ja lüliteid, näiteks „Lisa punkte“ ja 3D.',
  'help.guide.tour-draw-route.step.1':
    'Klõpsa vasaku riba ülaosas „Planeeri uus retk“. Ribal on nüüd „Uus retk“, mis on matk, kui sa muud tüüpi ei vali.',
  'help.guide.tour-draw-route.tip.3':
    'Kui mustandis on salvestamata muudatusi, küsib menüüs „Lisa matk“ olev „Planeeri uus retk“ enne „Kas alustada uut retke?“ koos valikuga „Loobu ja alusta“.',
  'help.guide.tour-type-profile.step.4':
    'Marsruut planeeritakse profiili järgi uuesti ja paremal olev „Retke kokkuvõte“ näitab selle vahemaad ja aega.',
  'help.guide.tour-edit-points.step.3':
    'Järjekorra muutmiseks vii kursor reale ja lohista seda vasakusse serva ilmuvast pidemest.',
  'help.guide.tour-shaping-points.goal': 'Suuna marsruut teisele rajale ilma peatust lisamata.',
  'help.guide.tour-shaping-points.result':
    'Marsruut kulgeb seal, kuhu selle lohistasid, ja peatuste numeratsioon jääb samaks.',
  'help.guide.tour-loop-reverse.tip.3':
    'Matkal otsib nende kõrval olev „Ringmatk algusest“ sinu valitud pikkusega ringmatku.',
  'help.guide.tour-leg-by-hand.tip.1':
    'Käsitsi joonistatud lõiku ei ole kontrollinud ükski marsruudiplaneerija: see võib ületada vett, eramaad või kaljut.',
  'help.guide.tour-trip-places.step.4':
    'Rea nime all on kirjas „Reisi koht“. Menüüs „Rohkem toiminguid“ olev „Eemalda seos kohaga“ jätab punkti alles, kuid eemaldab seose.',
  'help.guide.tour-details-times.step.2':
    'Kirjuta jaotises „Üksikasjad“ „Kirjeldus“ ja lisa „Veebisait“, kui see on olemas.',
  'help.guide.tour-save.goal': 'Säilita joonistatud retk reisis.',
  'help.guide.tour-save.result': 'Retk on reisis salvestatud ja valmis päevale panemiseks.',
  'help.guide.tour-edit-saved.tip.2':
    'Imporditud GPX- või KML-rada avaneb vaatamiseks GPX-retkena. Seal olev „Planeeri muudetav versioon“ loob retke, mida saad muuta.',
  'help.guide.tour-summary-profile.step.4':
    'Pealkirja kõrval olev nool „Ahenda kõrgusprofiil“ peidab profiili; klõpsa uuesti, et seda näha.',
  'help.guide.tour-list-manage.step.2':
    'Vii kursor retkele ja klõpsa selle real ümmargusel plussil „Lisa päevale“, et avada reisi päevad.',
  'help.guide.tour-delete.title': 'Retke kustutamine',
  'help.guide.tour-saved-elsewhere.title': 'Kui retk salvestati mujal',
  'help.guide.tour-saved-elsewhere.result': 'Ükski muudatus ei lähe kaduma, kui keegi ise ei otsusta sellest loobuda.',
  'help.guide.tour-import-gpx.title': 'GPX-, KML- või KMZ-faili importimine retkena',
  'help.guide.tour-import-gpx.tip.2': 'Faili iga rajast või marsruudist saab eraldi retk. Radu ei ühendata kunagi.',
  'help.guide.tour-view-import.step.2':
    'Vasakus veerus on see GPX-retkena: „Retke kokkuvõte“ koos vahemaa, kõrguste ja salvestatud ajaga ning selle all kõrgusprofiil. Kaardil on selle joon.',
  'help.guide.tour-plan-from-import.step.1':
    'Ava imporditud retk vahelehel „Retked“. Klõpsa vasakul kaardil „Muudetav versioon“ nuppu „Planeeri muudetav versioon“.',
  'help.guide.tour-plan-from-import.result':
    'Retkel on nüüd teekonnapunktid, mida saad lohistada, ja selle jaotises „Päritolu“ on kirjas „Ümber planeeritud, salvestatud rada alles“.',
  'help.guide.tour-restore-recorded.result': 'Retk on jälle GPX-retk ja näitab salvestatud joont.',
  'help.guide.tour-take-over.step.6': 'Klõpsa „Võta üle“.',
  'help.guide.tour-import-wanderer.step.2':
    'Kirjuta väljale „Otsi matkaradu“. „Otsi sellelt kaardialalt“ näitab ainult radu, mis on kaardi nähtavas osas.',
  'help.ctx.trip-tour-map.title': 'Retke kaart',
  'help.guide.tour-map-layers.goal':
    'Planeeri kaardil, mis sobib retke liigile kõige paremini: kõrgusjooned tõusude jaoks, tähistatud matka- või rattarajad või aerofotod.',
  'help.guide.tour-along-search.title': 'Kohtade leidmine retke äärest',
  'help.guide.tour-along-search.tip.1':
    'Kui muudad marsruuti, liike või vahemaad, tõstetakse „Otsi uuesti“ esile ja see ütleb, et loend leiti varasema marsruudi jaoks. Klõpsa sellel, et loend ajakohastada.',
  'help.guide.tour-along-add-stop.step.4':
    'Marsruut planeeritakse uuesti nii, et see läbib koha, ja „Matka ääres“ näitab, kui palju vahemaad ja aega retkele lisandus. Samal real olev „Võta tagasi“ eemaldab peatuse uuesti.',
  'help.guide.tour-3d-terrain.step.2':
    'Marsruut on värvitud kalde järgi. Klõpsa all reas „Kalle“, et näidata seda hoopis retke värvis, ja uuesti, et kalded tagasi tuua.',
  'help.guide.tour-3d-flyover.title': 'Ülelend mööda retke',
  'help.guide.tour-3d-flyover.tip.2':
    'Ülelend algab alles siis, kui kogu marsruudi maastik on laaditud, nii et see ei peatu poolel teel kaardiandmeid laadima. Vii kursor rõngale, et näha, kui palju on laaditud.',
  'help.guide.tour-map-overlays.result': 'Nõlvad või navigatsioonimärgid on kaardi peal ja legend selgitab neid.',
  'help.ctx.trip-tour-stages.bullet.3':
    '„Retke kokkuvõte“ loetleb jaotises „Etapid“ kõik etapid alates peatusest, kus etapp algab, kuni peatuseni, kus see lõpeb. Klõps etapil valib selle viimase peatuse ja märgib koha kõrgusprofiilil.',
  'help.guide.tour-multi-day.step.4':
    '„Teekonnapunktid“ jaguneb nüüd osadeks „Etapp 1“ ja „Etapp 2“, igaühel oma vahemaa ja aeg. Etappi lõpetaval peatusel on kuu ikoon.',
  'help.guide.tour-stages-on-days.title': 'Mitmepäevase retke panemine reisi päevadele',
  'help.guide.tour-stages-on-days.tip.1':
    'Kui reis lõpeb enne viimast etappi, näitab valik, milline on viimane etapp, mis veel mahub. Järgnevad etapid jäävad päevata.',
  'help.ctx.trip-tour-hike.bullet.2':
    '„Teekonnapunktid“ loetleb peatused järjekorras. „Lisa punkt“ on kohe alguses sees, nii et klõps kaardil lisab järgmise punkti; selle kõrval olev „Reisi kohad“ teeb reisi onnist või hotellist peatuse.',
  'help.guide.tour-hike-plan.step.2': 'Ava „Matka tüüp“ ja vali „Matk“: jalgsi, sinu määratud raskusastme piires.',
  'help.guide.tour-hike-plan.tip.3':
    'Raskusastme all olev „Marsruudi valik“ määrab marsruudi eelistused: „Väldi järske tõuse“, „Väldi treppe“ ja „Väldi praame“. Kui muud teed pole, läheb marsruut siiski sealt.',
  'help.guide.tour-hike-trail-details.step.5':
    'Klõpsa „Kate“, et näha sama marsruuti selle järgi, millel kõnnid, asfaldist pinnase ja kaljuni.',
  'help.guide.tour-hike-round.step.2':
    'Kaardi peal avaneb kaart „Ringmatk“. Kontrolli väljal „Alguspunkt“ alguskohta ja sisesta soovitud „Vahemaa“. Selle kõrval olev silt näitab, millises pikkusvahemikus ring võib olla.',
  'help.guide.tour-hike-compare-ways.title': 'Matka ühe lõigu muude teede võrdlemine',
  'help.guide.tour-hike-compare-ways.tip.2':
    'Kui marsruudiplaneerija ei tea muud teed, annab kaart sellest teada. Kui marsruudiplaneerija ei suuda valitud teed järgida, jääb lõik samaks ja kaart ütleb seda.',
  'help.guide.tour-ferrata-add.step.5':
    'Paremal olev „Retke kokkuvõte“ näitab märki „Via ferrata rada“ koos raskusastmega ja redaktori ülaosas on hoiatus „Marsruut läbib via ferrata raja“.',
  'help.guide.tour-run-plan.step.1': 'Klõpsa „Planeeri uus retk“, ava „Matka tüüp“ ja vali „Jooks“.',
  'help.guide.tour-run-plan.tip.3': 'Kui sinu vahemaad on miilides, on ka tempo miili kohta.',
  'help.guide.tour-run-ways.tip.1': 'Siin ei muudeta jooksu marsruuti ega aega.',
  'help.ctx.trip-tour-walk.bullet.5':
    'Jaotises „Selle reisi retked“ olev „Lisa matk“ impordib Google Mapsist jagatud jalutusmarsruudi. Vahelehel „Plaan“ saad oma päevast avatud jalutuskäigu peatused sel päeval ära märkida.',
  'help.guide.tour-walk-plan.step.6':
    'Paremal olev „Retke kokkuvõte“ näitab väärtusi „Hinn. kõndimisaeg“, „Peatused“ ja „Plaanis“, mis on kahe esimese summa. Klõpsa vasaku veeru allosas „Salvesta“, et jalutuskäik salvestada.',
  'help.guide.tour-walk-sights.step.2':
    'Teema täidab välja „Mida otsida“. Ava see, et liike sisse või välja lülitada, ja vali jaotises „Selle kaugusega marsruudist“, kui kaugelt otsida.',
  'help.guide.tour-walk-day-times.title': 'Päeva saabumisaegade ja lahtiolekuaegade vaatamine',
  'help.guide.tour-walk-day-times.tip.3':
    'Lahtiolekuajad tulevad OpenStreetMapist või reisi kohast, millega peatus on seotud, ja nende kõrval olev silt näitab allikat. Kontrolli neid enne minekut.',
  'help.guide.tour-walk-google-import.step.4':
    'Klõpsa „Laadi jalutuskäiguna“. TREK planeerib peatuste vahelise jalgtee ise. Jalutuskäigu salvestamiseks klõpsa „Salvesta“.',
  'help.guide.tour-walk-check-off.step.2':
    'Keri jaotiseni „Jalutuse peatused“. Iga peatuse juures on viibimisaeg ja, kui jalutuskäigul on algusaeg, saabumisaeg.',
  'help.ctx.trip-tour-bike.summary':
    'Vahelehel „Retked“ redaktoris avatud rattaretk: profiil, mille järgi marsruut arvutatakse, sõiduaeg, millel marsruut kulgeb, ning maastikurattaretke puhul radade raskusastmed.',
  'help.guide.tour-bike-profile.step.2': 'Ava väli „Matka tüüp“ ja vali „Rattaretk“.',
  'help.guide.tour-bike-profile.tip.3':
    'Kui ükski rattatee punkti lähedale ei ulatu, on ribal teade, et rattatee ei ulatu punktini N. Liiguta punkti või ava eelmise punkti juures „Rohkem toiminguid“ ja vali „Joonista järgmine lõik käsitsi“.',
  'help.guide.tour-bike-surfaces.step.4':
    'Klõpsa jaotises „Tee liik“ real, näiteks „Põllu- või metsatee“ või „Liiklusega tee“, et näha, kus marsruut sellel kulgeb.',
  'help.guide.tour-bike-mtb-grades.step.1':
    'Ava rattaretk redaktoris ja kontrolli, et „Profiil“ on „MTB“. Radade raskusastmeid loetakse ainult selle profiili puhul.',
  'help.ctx.trip-tour-ski.title': 'Suusa- ja talveretked',
  'help.guide.tour-ski-plan.goal':
    'Planeeri päev nõlvadel, murdmaasuusaring, suusamatk või räätsamatk mööda kaardistatud nõlvu, tõstukeid ja radu.',
  'help.guide.tour-ski-plan.tip.2':
    '„Ala“ kõrval olev infotäpp selgitab, mida TREK suusaretkedega teeb. Seal ega mujal siin ei öelda midagi lume, laviinide ega selle kohta, kas nõlvad, tõstukid ja rajad on avatud.',
  'help.guide.tour-ski-options.step.3':
    'Vali jaotises „Eelista“ „Kiireim“, „Kõige rohkem suusatamist“ või „Lihtsaim“. Vali jaotises „Tempo“ „Rahulik“, „Tavaline“ või „Sportlik“: see muudab aega, mille marsruudiplaneerija igale nõlvale arvestab.',
  'help.guide.tour-ski-fix-leg.goal': 'Lase punane lõik ühe klõpsuga planeerida või joonista see sirgjoonena.',
  'help.guide.tour-ski-fix-leg.result':
    'Ükski lõik pole enam punane: iga lõik järgib nõlvu või kulgeb otse oma punktide vahel.',
  'help.guide.tour-ski-summary.tip.3':
    'Salvestatud retk avaneb nii, nagu see salvestati. Liiguta punkti või muuda mõnda valikut, et see praeguste nõlvaandmete põhjal uuesti planeerida.',
  'help.guide.tour-ski-pistes-layer.tip.1':
    'Kui lüliti jääb halliks ja sellel on kirjas „Suumi lähemale, et nõlvu näha“, suumi suusakeskusele lähemale.',
  'help.guide.tour-ski-import.step.3':
    'Vali „Ala“ ja murdmaasuusatamise puhul „Tehnika“. Kuni seda pole tehtud, palub dialoog valida ala, et rada suusarajana importida.',
  'help.ctx.trip-tour-paddle.title': 'Aerutamisretked',
  'help.guide.tour-paddle-setup.title': 'Aerutamisretke planeerimine',
  'help.guide.tour-paddle-setup.step.7':
    'Kontrolli, et „Lisa punkt“ on sees, seejärel klõpsa kaardil: kõigepealt vettelaskmiskoht, siis vahepealsed punktid ja lõpuks veest väljumise koht.',
  'help.guide.tour-paddle-water-route.step.1':
    'Käsitsi joonistatud lõigu punkti all on kirjas „Käsitsi joonistatud, marsruutimata“ koos lõigu pikkusega. TREK jätab joone selliseks, nagu selle joonistasid.',
  'help.guide.tour-paddle-water-route.tip.4':
    'Kui mõni lõik pole planeeritud, ei saa salvestada. Planeeri see enne vett mööda või joonista käsitsi.',
  'help.guide.tour-paddle-portage.step.5':
    'Sisesta jaotises „Välja ja vette“ minutid, mida vajad paadist väljumiseks, mahalaadimiseks ja tagasi vette laskmiseks. Kui jätad selle tühjaks, arvestab TREK 10 minutit.',
  'help.guide.tour-paddle-lock.step.2':
    'Vali „Lüüs selles punktis“. Punkti alla ilmub kaart „Lüüs“ märkega „Aeg puudub“.',
  'help.guide.tour-paddle-time.goal':
    'Vaata, kuidas vee peal oldud aeg, kandmine, lüüsid ja pausid kokku liituvad, ning määra oma väärtused.',
  'help.guide.tour-paddle-time.tip.3':
    'Pausid ja oma planeeritud koguaja määrad jaotises „Üksikasjad“. Kui planeeritud koguaeg on määratud, näitab kaart hinnangu kõrval „Sinu planeeritud kogukestus“.',
  'help.guide.tour-paddle-wind.tip.1':
    'Prognoos on olemas ainult järgmiseks 16 päevaks. Kaugema päeva puhul on kirjas, mis kuupäevast prognoos on saadaval. Möödunud päeva puhul on kirjas, et päev on möödas.',
  'help.guide.tour-paddle-checklist.step.2':
    'Selle all olev rida näitab, kui värsked on andmed: „OSM seisuga“ OpenStreetMapi kohta, „Laaditud“ selle kohta, millal TREK need luges, ja „Takistuste andmed“, kui need ei kata kogu marsruuti.',
  'help.guide.tour-paddle-checklist.tip.5':
    'Kontrollnimekiri ei ole ohutus- ega õiguslik heakskiit. Sinu otsus ei tühista OpenStreetMapis märgitud keeldu ega eramaad.',
  'help.guide.tour-paddle-track-marks.step.5':
    'Klõpsa „Ülekanne“, seejärel klõpsa joonel kohas, kus paadist välja tulid, ja kohas, kus selle uuesti vette lasid.',
  'help.ctx.trip-tour-horse.summary':
    'Ratsamatka marsruuti ei arvutata kunagi. See koostatakse OpenStreetMapis tähistatud ratsateede lõikudest, mida ühendavad sinu käsitsi joonistatud lõigud, või säilitatakse täpselt nii, nagu selle salvestasid.',
  'help.guide.tour-horse-plan.step.1':
    'Too kaardil nähtavale ala, kus tahad ratsutada, seejärel klõpsa vasaku veeru ülaosas „Planeeri uus retk“.',
  'help.guide.tour-horse-plan.tip.1':
    'Ratsatee ei anna luba sellel ratsutada. „Ligipääs hobusega“ näitab ainult seda, mida OpenStreetMapis on märgitud. Järgi alati kohapealseid silte.',
  'help.guide.tour-horse-gap.step.2':
    'Lülita sisse „Ühenda käsitsi lõiguga“. Lünk joonistatakse sirgjoonena ja jääb kontrollimata.',
  'help.guide.tour-horse-recorded.goal':
    'Impordi GPS-seadme või rakendusega salvestatud ratsamatk ja säilita see täpselt nii, nagu sõitsid.',
  'help.guide.tour-horse-recorded.tip.3':
    'Sama eelvaate avamiseks võid faili lohistada ka ükskõik kuhu vahelehel „Retked“.',
  'help.guide.create-trip.tip.3':
    'Jaotises „Reisikaaslased“ saad lisada inimesi, kellel on siin juba konto. Nad saavad reisi liikmeteks kohe, kui reis on loodud.',
  'help.guide.trip-reminder.step.1':
    'Klõpsa reisikaardil oleval pliiatsil. Uue reisi puhul on vormis „Uus reis“ sama jaotis.',
  'help.guide.company-holidays.tip.2':
    'Terve ettevõtte puhkepäev eemaldab sellele päevale juba märgitud puhkuse, nii et keegi ei kasuta selle jaoks oma puhkusepäevi.',
  'help.guide.half-company-holiday.tip.2':
    'Märke eemaldamiseks klõpsa päeval uuesti samade seadetega või, kui „Pool päeva“ on väljas, saab sellest terve ettevõtte puhkepäev.',
  'help.guide.edit-holiday-calendar.step.1':
    'Ava „Seaded“ ja leia kalender jaotisest „Riigipühad“ või „Koolivaheajad“.',
  'help.guide.person-color.goal': 'Anna endale või kaasplaneerijale värv, mida on lihtsam eristada.',
  'help.guide.answer-fusion-request.tip.2': 'Kumbki teist saab ühendamise hiljem lahutada ja teie kirjed säilivad.',
  'help.guide.log-for-partner.tip.2':
    'Ta näeb muudatust kohe ja tema rida kaardil „Puhkusepäevade õigus“ uueneb samal hetkel.',
  'help.guide.country-places.title': 'Riigi kõigi kohtade vaatamine',
  'help.guide.tour-activity-stats.step.1':
    'Ava kaardi all olevas paneelis „Statistika“ ja „Soovinimekiri“ kõrval vaheleht „Retked“.',
  'help.guide.tour-activity-stats.tip.2':
    'Seo tegelikult läbitud rada retke üksikasjades nupuga „Lisa tegelik rada“ ja selle salvestatud väärtused asendavad siin planeeritud väärtused. Mitmele päevale planeeritud retk läheb arvesse üks kord.',
  'help.ctx.collections.bullet.7':
    'Salvestatud retked: reisist salvestatud retked on nimekirja esimesed read koos raskusastme, tüübi, päritolureisi ja mõõtmetega. „Lisa reisile“ loob neist uue retke ja prügikastiikoon eemaldab selle nimekirjast.',
  'help.guide.move-to-list.title': 'Kohtade teisaldamine või kopeerimine teise nimekirja',
  'help.guide.copy-to-trip.tip.2': 'Koht, mis reisil juba on, jäetakse vahele ja TREK näitab, mitu kohta vahele jäeti.',
  'help.guide.accept-list-invite.tip.2':
    'Klõpsa nimekirja ülaosas „Jagatud“, et näha liikmeid. Seal saad nupuga „Lahku nimekirjast“ nimekirjast lahkuda.',
  'help.guide.tour-collection-add-to-trip.goal':
    'Loo nimekirja salvestatud retkest uus retk mõnele oma reisile, koos teekonnapunktidega või ilma.',
  'help.guide.tour-collection-add-to-trip.result':
    'Dialoog kinnitab, et retk kuulub nüüd sellele reisile. „Ava reis“ viib sind sinna. „Sulge“ jätab sind jaotisse „Kogumikud“.',
  'help.guide.tour-collection-manage.tip.3':
    'Salvestatud retked on näha ainult oma nimekirjas, mitte vaates „Kõik salvestatud“.',
  'help.guide.search-journey.step.3':
    'Klõpsa päeval, et sinna kerida, või selle noolel, et näha päeva sissekandeid ja valida üks.',
  'help.guide.journey-map-layers.goal':
    'Näe erinevust plaani ja tegelikult toimunu vahel ning lülita kihte sisse ja välja.',
  'help.guide.journey-keep-route.goal':
    'Lisa päeva tegelik marsruut Dawarichist reisiloo kaardile ja säilita see seal.',
  'help.guide.journey-day-stays.goal': 'Tee Dawarichi salvestatud peatumistest ükshaaval sissekanded.',
  'help.guide.journey-take-over-day.goal':
    'Tee ühe sammuga päeva peatumistest mustandsissekanded või üks päevaülevaade.',
  'help.guide.journey-auto-prepare.title': 'Salvestatud päevade ettevalmistamine TREKi poolt',
  'help.guide.photo-location.title': 'Sissekannete paigutamine fotode tegemise kohta',
  'help.ctx.settings-about.summary':
    'Mis on TREK, milline versioon selles serveris töötab ja kust leiad projekti: dokumentatsiooni, vigadest teatamise koha ja projekti toetamise võimalused.',
  'help.guide.startup.tip.2': 'Kui avatav vahekaart kuulub välja lülitatud lisamoodulile, avaneb selle asemel plaan.',
  'help.guide.web-push-device.title': 'Tõuketeavitused selles seadmes',
  'help.guide.connect-airtrail.tip.1':
    'Kaart on näha ainult siis, kui administraator on lisamooduli AirTrail sisse lülitanud.',
  'help.guide.connect-dawarich.tip.1':
    'TREK ainult soovitab sissekandeid, kohti ja riike; midagi ei lisata enne sinu kinnitust ja Dawarichi ei kirjutata midagi tagasi.',
  'help.guide.tour-connect-wanderer.tip.1':
    'Kaart on näha ainult siis, kui administraator lubab jaotises „Retked“ wandereri.',
  'help.guide.tour-wanderer-watch.tip.1':
    'Vihje ei muuda kunagi retke; retke allika kontroll näitab, mis tegelikult muutus.',
  'help.guide.api-keys.tip.3':
    'Saada võti päisega Authorization: Bearer või X-API-Key aadressile /api/v1. Kontol võib olla kuni 10 võtit.',
  'help.guide.plugin-settings.step.2':
    '„Pluginate tegevus“ loetleb kõik toimingud, mida pluginad sinu nimel tegid, uusimad eespool; „Värskenda“ laadib viimased.',
  'help.ctx.admin-github.bullet.3':
    '„Teave“: Ko-fi, „Osta mulle kohv“, Discord, „Teata veast“, „Funktsioonisoov“ ja Wiki.',
  'help.guide.default-user-settings.goal':
    'Anna igale kontole mõistlikud ühikud, värvirežiim ja valuuta, ilma et keegi peaks seadeid avama.',
  'help.guide.default-map.step.3':
    'Iga väli salvestub, kui sellelt lahkud. Välja nime kõrval olev lähtestuslink taastab TREKi vaikeväärtuse.',
  'help.guide.own-routing-engine.tip.2':
    'Kui on määratud ainult sinu oma marsruutimootor, ei kasutata ka avalikku Valhallat. Välja kõrval olev lähtestuslink tühjendab selle uuesti.',
  'help.guide.admin-passkeys.step.1':
    'Lülita vahelehel „Seaded“ jaotises „Pääsuvõtmega sisselogimine“ sisse „Luba pääsuvõtmega sisselogimine“.',
  'help.guide.storage-backends.step.4':
    'Ülal olev „Tervis“ loetleb ebaõnnestunud kirjutamised peegelsihtkohta. Kui seal on kirjas „Koopiate tõrkeid pole registreeritud.“, töötab kõik.',
  'help.guide.channels-instance.tip.3':
    "„Veebitõuketeavitused“ vajavad HTTPS-i. iPhone'is ja iPadis peavad kasutajad kõigepealt lisama TREKi avaekraanile.",
  'help.guide.notification-defaults.step.1':
    'Keri vahelehel „Teavitused“ alla jaotiseni „Kasutajate vaikeväärtused“. Iga rida on sündmus, iga veerg kanal.',
  'help.ctx.notifications.bullet.1':
    'Paremal üleval olev kellaikoon näitab lugemata teavituste arvu. Klõpsa sellel, et näha kümmet uusimat, ja selle allosas oleval „Näita kõiki teavitusi“, et avada see leht.',
  'help.guide.read-notifications.step.2':
    'Paneelis on kümme uusimat teavitust. Igas on kirjas, kes mida ja kus tegi, ning lugemata teavitustel on toonitud taust.',
  'help.guide.filter-notifications.step.2': 'Klõpsa paneeli allosas „Näita kõiki teavitusi“.',
  'help.guide.mark-notifications-read.tip.1': 'Kui avad teavituse selle nupu kaudu, märgitakse see samuti loetuks.',
  'help.guide.delete-notifications.tip.2':
    'Kustutatud teavitust ei saa taastada. Kui tahad teavituse peita, kuid alles jätta, märgi see loetuks ja kasuta filtrit „Lugemata“.',
  'help.guide.notification-settings.tip.2': 'Reisipõhiseid seadeid pole: üks lüliti kehtib kõigile sinu reisidele.',
  'help.guide.link-journal.title': 'Päeviku sidumine reisiga',
  'help.guide.link-journal.tip.2':
    'Sellest hetkest näevad inimesed, kellele juurdepääsu andsid, päevikut ka oma reisilugude loendis.',
  'help.ctx.trip-places.bullet.8':
    'Kui Dawarich on ühendatud, näitab loendi ülaosas olev „Dawarichist“ peatumisi, mille Dawarich reisi ajal salvestas. „Lisa kohana“ teeb peatumisest koha. „Ma pole seda kohta külastanud“ eemaldab selle loendist.',
  'help.guide.dawarich-stays.step.4':
    'Kui peatumine polnud tegelik külastus, klõpsa selle kõrval oleval x-il „Ma pole seda kohta külastanud“, et see eemaldada. Loendi allosas olev „Näita … juba käsitletud“ näitab lisatud või eemaldatud peatumisi. „Taasta“ toob eemaldatud peatumise loendisse tagasi.',
  'help.guide.leave-stop-off-route.tip.1':
    'See valik on ainult koordinaatidega peatusel ja seade kehtib ainult selle päeva kohta: sama koht teisel päeval on endiselt marsruudis.',
  'help.guide.move-booking-day.title': 'Broneeringu teisaldamine teisele päevale',
  'help.guide.place-image-from-file.step.4':
    'Foto on nüüd koha pilt. Selle eemaldamiseks klõpsa nurgas oleval väikesel punasel X-il.',
  'help.guide.place-own-hours.step.2': 'Täida „Veebisait“ all „Telefon“ ja „E-post“, kui need on sulle teada.',
  'help.guide.add-accommodation.tip.4':
    'Kiirem viis: päeva päises oleval +-il vihjega „Lisa päevale“ on „Lisa majutus“. See avab päeva, kus see vorm on juba avatud.',
  'help.guide.confirm-stay-booking.goal': 'Märgi majutuse hotellibroneering otse päevast kinnitatuks.',
  'help.guide.map-whole-trip.tip.4':
    'See, kas näidatakse kogu reisi, salvestatakse sinu kontole iga reisi kohta eraldi, nii et reis avaneb samamoodi ka teises brauseris.',
  'help.guide.tour-map-lines.step.3':
    'Ava päevade veerus päev, millel retk on, ja retk saab päeva marsruudi osaks: marsruut viib retke alguspunkti ja jätkub sealt, kus retk lõpeb.',
  'help.guide.car-stops.goal': 'Määra rendi- või oma autole kättesaamine, tagastamine ja vahepealsed peatused.',
  'help.guide.car-stops.tip.1': 'Eraldi rendiauto tüüpi pole: nii rendiauto kui ka oma auto on „Auto“.',
  'help.guide.transport-details.result':
    '„Plaan“ on avatud sõidu päeval, sõidu joon on kaardil näha ja marsruudiikoon selle real on sisse lülitatud.',
  'help.guide.export-transports-csv.step.2':
    'Klõpsa „Vaate valikute“ järel oleval tabeliikoonil, mille vihje on „Ekspordi tabelina (CSV)“.',
  'help.guide.group-sort-bookings.title': 'Broneeringute rühmitamine ja sortimine',
  'help.guide.group-sort-bookings.tip.2':
    'Vaates „Ajajoon“ on samas nupus valikud „Iga tüüp eraldi real“ ja „Näita teist vahekaarti“.',
  'help.guide.booking-on-map.result':
    'Üksikasjad sulguvad ja vaheleht „Plaan“ avaneb broneeringu päeval, broneeringu koht on kaardil valitud.',
  'help.guide.export-bookings-csv.step.1':
    'Kui tahad eksportida ainult osa vahelehest, kitsenda seda enne „Otsi“ või „Filter“ abil. Failis on täpselt see, mida vaheleht näitab.',
  'help.guide.import-booking-file.tip.4':
    'Kinnituse lugemiseks on vaja ühendust. Võrguühenduseta annab „Impordi“ sellest teada ja saad uuesti proovida, kui TREK on taas võrgus.',
  'help.guide.arrange-packing-list.step.1':
    'Lohista nimekirja päise vasakus otsas, värvitäpi ees olevast pidemest ja aseta nimekiri teisele kaardile. Sinu rõhuvärvi kontuur tähistab sihtkaarti ja nimekiri võtab selle kaardi koha kõigi reisil osalejate jaoks.',
  'help.guide.count-packed-pieces.title': 'Ühe asja mitme tüki pakkimine',
  'help.guide.count-packed-pieces.tip.2':
    'Kui „Kottide haldus“ on sees, loendab kaardil „Kotid“ olev „Pakitud“ ainult juba arvesse võetud tükke.',
  'help.guide.packing-bags.tip.4':
    'Mitme inimese kantava koti kaal jagatakse jaotises „Inimese kohta“ nende vahel võrdselt. Sellel kaalul on punktiirjoon all ja kursori viimisel näed selle kohta märkust.',
  'help.guide.expense-receipts.step.1':
    'Klõpsa kulu rea kõrval oleval pliiatsil. Redaktor avaneb ja allosas on „Kviitungid ja arved“.',
  'help.guide.expense-receipts.tip.3':
    'Lisamiseks on vaja ühendust ja failide üleslaadimise õigust, sest kviitung salvestatakse reisi failina.',
  'help.guide.files-sync-settings.title': 'Dokumentide sünkroonimissuuna valimine',
  'help.guide.files-sync-settings.tip.1': 'Üks rada jääb alati sisse: ainsa sees oleva raja klõpsamine ei tee midagi.',
  'help.guide.manage-notes.title': 'Märkme lugemine, kinnitamine ja muutmine',
  'help.guide.manage-notes.tip.1':
    '„Laienda“ on menüüs ainult siis, kui märkmes on teksti. Liige, kes ei tohi „Koostööd“ muuta, näeb ainult valikut „Laienda“.',
  'help.guide.note-categories.step.5':
    'Klõpsa „Salvesta“. Kõik ümbernimetatud või uue värviga kategooria märkmed muutuvad kohe kõigi liikmete jaoks. „Tühista“ loobub muudatustest.',
  'help.guide.trip-chat.tip.5':
    'Vestluses on uusimad sõnumid eespool. Vestluse ülaosas olev „Laadi vanemad sõnumid“ laadib varasemad sõnumid.',
  'help.guide.roadtrip-reorder.result':
    'Peatused on sinu määratud järjekorras ning kõigi muudetud päevade vahemaa, sõiduaeg ja saabumisajad arvutatakse uuesti.',
  'help.guide.roadtrip-overnight.goal': 'Leia teel ööbimiskoht ja lisa öö sõidule broneeringuna.',
  'help.guide.roadtrip-overnight.tip.2':
    'Kui muudad broneeritud öö kaardi „Muuda“ kaudu tagasi „Pausiks“, küsitakse enne „Kas eemaldada ööbimine?“. „Muuda pausiks“ eemaldab öö koos broneeringu ja sellega seotud kuluga ning jätab peatuse sõidule.',
  'help.guide.roadtrip-stop-fill.tip.2':
    'Kui valid väärtuse, mis peatusel juba on, läheb peatus tagasi sinu vaikeväärtusele.',
  'help.guide.roadtrip-bookings.tip.1':
    'Terminali jõudmise aeg määratakse sisseregistreerimise jaoks sõiduplaanist varasemaks: lennu või kruiisi puhul tund, praami puhul pool tundi, rongi või bussi puhul kümme minutit.',
  'help.guide.roadtrip-google-import.step.2': 'Kleebi Google Mapsist jagatud marsruudi link ja klõpsa „Eelvaade“.',
  'help.guide.roadtrip-hazards.goal': 'Vaata kaardil ilmahoiatusi ja katastroofiteateid oma sõidu ümbruses.',
  'help.ctx.trip-tours.title': 'Retked plaanis',
  'help.guide.tour-show-list.title': 'Reisi retkede näitamine plaanis',
  'help.guide.tour-show-list.tip.2':
    'Retki veel pole? Loendi ülaosas olev „Impordi GPX või KML“ impordib faili ja vahelehel „Retked“ olev „Planeeri uus retk“ loob uue.',
  'help.guide.tour-add-to-day.step.4':
    'Või lohista rida loendist välja ja aseta see vasakus veerus mõnele päevale. Kui asetad selle kahe peatuse vahele, jääb see sinna.',
  'help.guide.tour-day-times.goal': 'Vaata, millal retk lõpeb ja kas see kattub päeva järgmise tegevusega.',
  'help.guide.tour-day-times.tip.4':
    'Samas menüüs olev „Salvesta kogumikku“ salvestab retke koos marsruudiga kogumikku, nagu kaardi nupp „Kogumik“.',
  'help.guide.tour-remove-from-day.tip.2':
    'Nendes menüüdes ega kaardil pole valikut „Kustuta“. Retke kustutad vahelehel „Retked“ jaotises „Selle reisi retked“ rea prügikastiga.',
  'help.guide.tour-filter-list.tip.1':
    '„Marsruudi piir“ on kõrgeim raskusaste, mida marsruudi planeerimisel lubati, mitte rajal mõõdetud raskusaste.',
  'help.guide.tour-hide-on-map.step.3':
    'Kuni mõni retk on peidetud, on loendi kohal rida „Kaardil peidetud“ koos arvuga. „Näita kõiki“ toob kõik retked korraga tagasi.',
  'help.guide.tour-import-plan-tab.step.3':
    '„Impordi eelvaade“ näitab iga rada enne, kui midagi salvestatakse. Vali jaotises „Impordi kui“ tüüp („Matk“, „Rattaretk“ jne), seejärel klõpsa „Impordi 1 retk“.',
  'help.ctx.trip-tour-detail.bullet.3':
    'Allpool on „Reisipäevad“, kus on ruut iga päeva kohta, millel retk on, mõõtmed koos kõrgusprofiiliga ja seejärel, kui need on asjakohased: linnajalutuskäigu peatused, aerutamisretke kontrollid ja tuul, „Tegelik rada“, „Pakkimisnimekiri“, „Kirjeldus“, „Märkmed“, „Päritolu“ ja „Failid“.',
  'help.guide.tour-detail-read.step.4':
    '„Reisipäevad“ näitab ruutu iga päeva kohta, millel retk on, koos kuupäevaga. Kui retk pole veel ühelgi reisipäeval, on see alles planeerimata.',
  'help.guide.tour-detail-read.tip.5': 'Telefonis avaneb kaart alt lehena, lugemiseks ja retke kaasa võtmiseks.',
  'help.guide.tour-rename-colour.tip.1':
    'Nimi ja värv kuuluvad reisile, nii et kõik reisil osalejad näevad neid. Kui tahad retke peita ainult oma kaardil, ilma et see teiste jaoks muutuks, kasuta retkede loendis silma.',
  'help.guide.tour-take-along.tip.1':
    'Seadmes, mis oskab faile jagada, ilmub nupu „GPX“ kõrvale „Jaga“, mis saadab sama faili otse teise rakendusse.',
  'help.guide.tour-copy-keep.step.2':
    'Koopia avaneb kohe ja selle nimi on originaali nimi, mille järel on „(koopia)“. Klõpsa pliiatsil, et anda sellele oma nimi.',
  'help.guide.tour-packing-link.title': 'Retke sidumine pakkimisnimekirjaga',
  'help.guide.tour-packing-link.tip.2':
    'Jaotise päises olev „Muuda“ seob retke teise nimekirjaga. Selle dialoogi „Eemalda seos“ eemaldab seose ja nimekiri jääb samaks.',
  'help.guide.tour-files.tip.1': 'Failid on ka reisi failid, nii et need on näha ka vahelehel „Failid“.',
  'help.guide.tour-activity-link.step.4': 'Kontrolli jaotises „Tegelik“, mida see mõõtis, seejärel klõpsa „Lingi“.',
  'help.guide.tour-activity-compare.step.1':
    'Ava retke kaart. „Plaan ja tegelik“ näitab plaani „Vahemaa“, „Tõus“, „Laskumine“ ja „Aeg koos pausidega“ raja väärtuste kõrval koos väärtusega „Erinevus“.',
  'help.guide.tour-origin-check.goal':
    'Uuri, kas retk joonistati TREKis või imporditi, millisest failist ja kas seda on hiljem muudetud.',
  'help.ctx.trip-tour-planner.title': 'Retked',
  'help.guide.tour-open-workspace.title': 'Vahelehel „Retked“ orienteerumine',
  'help.guide.tour-open-workspace.step.7':
    'Klõpsa paremal ribal retkel. TREKis planeeritud retk avaneb redaktoris. Imporditud rada avaneb muutmata kujul GPX-retkena, vaatamiseks.',
  'help.guide.tour-draw-route.step.2':
    'Kirjuta väljale „Otsi kohta või aadressi“ retke alguskoht ja vali tulemus. Kaart liigub sinna.',
  'help.guide.tour-draw-route.tip.4':
    'Salvestamata mustand säilib. Kui avad reisi vahelehe „Retked“ uuesti, taastatakse see teatega „Salvestamata mustand taastatud“.',
  'help.guide.tour-type-profile.tip.1':
    'Tüübi muutmine on ajaloos üks samm: riba päises olev „Võta teekonnapunkti muudatus tagasi“ taastab vana tüübi ja selle marsruudi.',
  'help.guide.tour-edit-points.step.4':
    'Või ava real „Rohkem toiminguid“ (kolm täppi) ja vali „Liiguta teekonnapunkt üles“ või „Liiguta teekonnapunkt alla“.',
  'help.guide.tour-shaping-points.step.1':
    'Klõpsa kaardil joonistatud marsruudil kohas, kus see peaks kulgema teisiti. Sinna ilmub väike täpp: kujunduspunkt.',
  'help.guide.tour-loop-reverse.title': 'Ringretke tegemine või retke suuna ümberpööramine',
  'help.guide.tour-loop-reverse.result': 'Ring, mis lõpeb seal, kus algas, või sama retk vastupidises suunas.',
  'help.guide.tour-leg-by-hand.tip.2':
    'Punkti puhul, milleni ükski rada ei ulatu, näed teadet koos nupuga punkti näitamiseks ja punkti numbriga. Liiguta punkt rajale või joonista lõik selleni käsitsi.',
  'help.guide.tour-trip-places.tip.1': 'Retkel juba olev koht on märgitud „Matkas“ ja seda ei saa kaks korda valida.',
  'help.guide.tour-details-times.step.3': 'Sisesta „Pausid“, näiteks 0:45. Need lisatakse hinnangulisele ajale.',
  'help.guide.tour-save.step.1': 'Kirjuta nimi väljale „Retke nimi“. Ilma nimeta on „Salvesta“ hall.',
  'help.guide.tour-edit-saved.title': 'Salvestatud retke muutmine',
  'help.guide.tour-edit-saved.tip.3':
    'Riba päises olevad „Laadi GPX alla“ ja „Hoia kogumikus“ töötavad siis, kui muudatused on salvestatud.',
  'help.guide.tour-summary-profile.tip.1': 'Klõpsa kaardi pealkirjal, et kogu kokkuvõte kokku panna.',
  'help.guide.tour-list-manage.step.3': 'Vali päev. Retk lisatakse sellele päevale ja selle real on päev näha.',
  'help.guide.tour-delete.goal': 'Eemalda retk reisilt lõplikult.',
  'help.guide.tour-saved-elsewhere.goal':
    'Otsusta, mis juhtub, kui keegi teine salvestas retke ajal, mil sina seda muutsid.',
  'help.ctx.trip-tour-import.title': 'Retkede importimine',
  'help.guide.tour-import-gpx.goal':
    'Tee GPS-kella, rakenduse või Google Earthi rajast reisi retk, mida saad enne salvestamist kontrollida.',
  'help.guide.tour-import-gpx.tip.3': 'Rada, mis reisil juba on, on hall märkega „Juba reisil“ ja jäetakse vahele.',
  'help.guide.tour-view-import.step.3': 'Üleval vasakul olev nool „Tagasi retkede juurde“ sulgeb selle.',
  'help.guide.tour-plan-from-import.step.2':
    'TREK võtab rajast kontrollpunktid ja arvutab nende vahel marsruudi uuesti. Kaardil on import punktiirjoonena ja soovitus pideva joonena ning kaart võrdleb nende pikkusi, kuni 50 m kaugusel rajast oleva osa osakaalu ja väärtust „Suurim kõrvalekalle“.',
  'help.guide.tour-restore-recorded.title': 'Salvestatud raja juurde naasmine',
  'help.guide.tour-take-over.title': 'Retke ülevõtmine teiselt reisilt',
  'help.guide.tour-take-over.tip.1':
    'Koopia on eraldi retk. See pole veel ühelgi päeval ning originaali hilisemad muudatused ei mõjuta koopiat ega vastupidi. Jaotises „Päritolu“ on nimetatud reis, kust see üle võeti.',
  'help.guide.tour-import-wanderer.step.3':
    'Klõpsa rajal. See ilmub kaardile ja veerus on näha selle GPX-faili mõõtmed, kirjeldus ning see, kas rada on wandereris avalik või privaatne.',
  'help.ctx.trip-tour-map.summary':
    'Vahelehe „Retked“ keskel olev kaart avatud retke jaoks: retke tüübile sobivad kaardid, nende peal nõlvad või navigatsioonimärgid, marsruudi äärsed kohad ja sama retk 3D-s päris maastikul.',
  'help.guide.tour-map-layers.step.1':
    'Ava vaheleht „Retked“ ja klõpsa paremal jaotises „Selle reisi retked“ retkel. See avaneb planeerijas ja kaardi all vasakul olev silt loetleb kaardid, mida see retke liik pakub.',
  'help.guide.tour-along-search.goal':
    'Otsi planeeritava retke marsruudi lähedalt vaatepunkte, vett, onne või söögikohti.',
  'help.guide.tour-along-search.tip.2':
    'Linnajalutuskäigul valivad loendi kohal olevad neli teemat sulle sobivad liigid.',
  'help.guide.tour-along-add-stop.result':
    'Retk läbib nüüd koha ning uus vahemaa ja aeg on jaotises „Retke kokkuvõte“. Muudatuse säilitamiseks salvesta retk.',
  'help.guide.tour-3d-terrain.step.3':
    'Klõpsa paremal sildil „Kallete jaotus“. See avaneb ja näitab, kui suur osa retkest on kaldega alla 5%, 5 kuni 10%, 10 kuni 18%, 18 kuni 27% ning 27% ja rohkem. Kokkupanduna näitab see kõrgeimat punkti ja järsemat lõiku.',
  'help.guide.tour-3d-flyover.goal': 'Vaata kogu retke algusest lõpuni enne, kui seda kõnnid, sõidad või suusatad.',
  'help.guide.tour-3d-flyover.tip.3':
    'Kui lend on peatatud, liigu mööda kõrgusprofiili, et viia täpp sellesse punkti. „Esita ülelend“ jätkab sealt.',
  'help.guide.tour-map-overlays.tip.1':
    'Nõlvad on kaardiandmed, mitte reaalajas info: need ei ütle midagi selle kohta, mis on avatud või hooldatud, ega lume ja laviinide kohta. Kui suumid suusakeskusest kaugemale, on lülitil kirjas „Suumi lähemale, et nõlvu näha“.',
  'help.ctx.trip-tour-stages.bullet.4':
    'Jaotises „Selle reisi retked“ on mitmepäevasel retkel kuu koos etappide arvuga. See nupp, „Näita etappe“, avab etappide loendi koos iga etapi päevaga ja kogusummadega „Kogu matk“.',
  'help.guide.tour-multi-day.step.5':
    '„Retke kokkuvõte“ loetleb jaotises „Etapid“ kõik etapid. Klõpsa ühel, et näha, kus see lõpeb: selle viimane peatus valitakse ja kõrgusprofiil märgib koha.',
  'help.guide.tour-stages-on-days.goal': 'Pane iga etapp eraldi päevale või kogu retk ühele päevale.',
  'help.guide.tour-stages-on-days.tip.2':
    '„Kogu matk sellel päeval“ on hall päeval, kus retk juba on. „Etapid alates sellest päevast“ töötab seal siiski ja asendab sellel päeval kogu retke.',
  'help.ctx.trip-tour-hike.bullet.3':
    'Kaardi „Teekonnapunktid“ päises on marsruudi tööriistad: „Pööra suund ümber“, „Tagasi algusesse“ ja matkal „Ringmatk algusest“. Peatuse menüüs „Rohkem toiminguid“ on „Võrdle järgmise lõigu teid“.',
  'help.guide.tour-hike-plan.step.3': 'Kirjuta nimi väljale „Retke nimi“.',
  'help.guide.tour-hike-plan.tip.4':
    'Kõndimisaeg arvutatakse matkaviitade reegli (DIN 33466) järgi ja pausid ei ole selle sees. Lisa need jaotises „Üksikasjad“ väljale „Pausid“ ja need on näha planeeritud koguajas.',
  'help.guide.tour-hike-trail-details.result':
    'Tead, milline raskusaste on matka igal osal, milline on pinnas ja kus need osad kaardil asuvad.',
  'help.guide.tour-hike-round.step.3':
    'Klõpsa „Otsi ringe“. Loendisse ja kaardile ilmuvad ring A, ring B jne, igaüks oma värvis.',
  'help.guide.tour-hike-compare-ways.goal':
    'Vaata, milliseid teisi radu pidi võiks matk kahe peatuse vahel kulgeda, ja vali neist üks.',
  'help.guide.tour-hike-compare-ways.tip.3': '„Tühista“ sulgeb kaardi ja marsruut ei muutu.',
  'help.guide.tour-ferrata-add.result':
    'Matk järgib via ferratat OpenStreetMapi joone järgi. Klõpsa kaardil, et jätkata tipust. Marsruudiplaneerija planeerib ainult tee via ferratani ja tee pärast seda.',
  'help.guide.tour-run-plan.step.2':
    'Vali „Profiil“: „Jooks“ peamiselt kõvakattega teede jaoks linnas, parkides ja jõgede ääres, „Rajajooks“ metsateede ja looduslike radade jaoks.',
  'help.guide.tour-run-plan.tip.4': '„Rajajooks“ kasutab radu kuni mägiradadeni (T2), mitte kunagi raskemaid.',
  'help.guide.tour-run-ways.tip.2':
    'Lülita „Profiil“ väärtusele „Rajajooks“, et marsruut kasutaks rohkem looduslikke radu, või „Jooks“, et hoida see kõval pinnasel.',
  'help.guide.tour-walk-plan.title': 'Linnajalutuskäigu planeerimine peatusest peatuseni',
  'help.guide.tour-walk-plan.tip.1':
    'Peatuse numbri ümber olev rõngas näitab selle tähtsust: pidev „Kindlasti näha“ puhul, katkendlik „Valikuline“ puhul. Väike kilp tähistab peatust „Kaitstud“.',
  'help.guide.tour-walk-sights.step.3':
    'Klõpsa „Otsi matka äärest“. Tärn nime ees tähistab „Tippkohta“, üht siinsetest tuntumatest kohtadest.',
  'help.guide.tour-walk-day-times.goal':
    'Tea, millal jõuad jalutuskäigu päeval igasse peatusesse ja millised kohad on siis suletud.',
  'help.guide.tour-walk-day-times.tip.4':
    'Kaks jalutuskäiku ühel päeval: klõpsa vahelehel „Plaan“ nende vahelisel lõigul („Muuda liikumisviisi“) ja vali „Ühistransport“. Otsing algab sealt, kus esimene jalutuskäik lõpeb, selle lõpuajal, ja hoiatab, kui ühendus jõuab kohale pärast järgmise jalutuskäigu algust.',
  'help.guide.tour-walk-google-import.tip.1':
    'Loetakse ainult jalgsi planeeritud marsruuti. Lülita Google Mapsis enne jagamist sisse jalgsi liikumine.',
  'help.guide.tour-walk-check-off.step.3':
    'Klõpsa nähtud peatusel „Märgi külastatuks“ või vahele jäetaval peatusel „Jäta vahele“.',
  'help.ctx.trip-tour-bike.bullet.1':
    '„Matka tüüp“ all olev „Profiil“ määrab, millise sõidu jaoks marsruudiplaneerija planeerib: „Matk“, „Maantee“, „Kruus“ või „MTB“. Selle all olev rida ütleb, mida marsruudiplaneerija otsib, ja profiili muutmine planeerib kogu marsruudi uuesti.',
  'help.guide.tour-bike-profile.step.3':
    'Vali jaotises „Profiil“ „Matk“, „Maantee“, „Kruus“ või „MTB“. Selle all olev rida ütleb, mida marsruudiplaneerija selle profiiliga otsib.',
  'help.guide.tour-bike-profile.tip.4':
    '„Salvesta“ on hall, kuni retkel on nimi ning marsruut ja selle kõrgused on arvutatud.',
  'help.guide.tour-bike-surfaces.result':
    'Kaart tähistab valitud rea lõike ja tead, milliseid katteid marsruut läbib. Retk ise ei muutu.',
  'help.guide.tour-bike-mtb-grades.step.2':
    'Vaata kaardil „Kate ja teed“ jaotist „Raja raskus (mtb:scale)“: marsruudi osakaalud alates tasemest „S0, erilisi raskusi pole“ kuni tasemeni „S4 ja üle, ekspertide maastik“.',
  'help.ctx.trip-tour-ski.summary':
    'Vahelehel „Retked“ olev „Suusad ja talv“ tüüpi retk: päev nõlvadel, murdmaasuusaring, suusamatk, räätsamatk või talvine jalutuskäik. Selle lõigud järgivad OpenStreetMapis kaardistatud nõlvu, tõstukeid ja radu, mille nõlvade marsruudiplaneerija planeerib sinu ala ja piirangute järgi, ning salvestatud suusarada imporditakse koos alaga.',
  'help.guide.tour-ski-plan.step.1': 'Klõpsa vahelehel „Retked“ vasaku riba ülaosas „Planeeri uus retk“.',
  'help.guide.tour-ski-plan.tip.3':
    'Kui muudad hiljem ala, jäävad sinu punktid alles ja lõigud planeeritakse uuesti selle ala valikutega.',
  'help.guide.tour-ski-options.step.4':
    'Kasuta lüliteid: „Kasuta tõstukeid“, „Luba vabalaskumise marsruudid“, „Vajadusel sõida tõstukiga alla“ ja „Väldi oletatud ühendusi“. Murdmaasuusatamisel lisanduvad „Ainult hooldatud rajad“ ja „Ainult valgustatud rajad“, matkasuusatamisel „Tõuse nõlva servas“.',
  'help.guide.tour-ski-fix-leg.step.1':
    'Lõigul, mida marsruudiplaneerija ei suutnud planeerida, on punkti all punane rida koos põhjusega, näiteks et neid punkte ühendab ainult tõstuk, mille välja jätsid, ja nõlv või tõstuk, millega see on seotud.',
  'help.guide.tour-ski-summary.title': 'Suusaretke nõlvamarsruudi lugemine',
  'help.guide.tour-ski-summary.tip.4':
    'Kaardi allosas on nimetatud suusakeskused ja kaardiandmete kuupäev, mille põhjal retk planeeriti.',
  'help.guide.tour-ski-pistes-layer.tip.2':
    'Kui nõlvade laadimine katkeb, on lülitil hoiatusmärk. Kaart ja sinu marsruut töötavad endiselt.',
  'help.guide.tour-ski-import.step.4': 'Klõpsa „Impordi 1 retk“.',
  'help.ctx.trip-tour-paddle.summary':
    'Süsti-, kanuu- või SUP-retk jõel või järvel. Sellel on määratud paat ja veekogu, see järgib vett, kus TREKil on andmeid, arvestab ülekanded ja lüüsid aja sisse ning näitab aerutamispäeva tuult ja seda, mis on teada teel olevate takistuste kohta.',
  'help.guide.tour-paddle-setup.goal':
    'Alusta süsti-, kanuu- või SUP-retke ja määra, millega, millisel veekogul ja kui kiiresti aerutad.',
  'help.guide.tour-paddle-setup.tip.1':
    'Kui „Paat“ on „Muu“, soovitatud kiirust pole. Sisesta see, muidu jääb vee peal veedetud aeg tühjaks.',
  'help.guide.tour-paddle-water-route.step.2':
    'Kui tahad, et üks lõik planeeritaks vett mööda, vii kursor sellele eelnevale peatusele ja klõpsa „Rohkem toiminguid“ (kolm täppi).',
  'help.guide.tour-paddle-water-route.result':
    'Iga lõik järgib vett või on teadlikult käsitsi joonistatud ning lõik, mida TREK ei suutnud planeerida, näitab põhjust.',
  'help.guide.tour-paddle-portage.tip.1':
    'Kui tahad lõigu siiski läbi aerutada, ava punktil uuesti „Rohkem toiminguid“ ja vali „Aeruta see lõik jälle“. Sellest saab jälle käsitsi joonistatud lõik.',
  'help.guide.tour-paddle-lock.step.3': 'Klõpsa kaardil „Lüüs“, et see avada.',
  'help.guide.tour-paddle-time.step.1':
    '„Ajahinnang“ on vasakus veerus teekonnapunktide all. Selle päises olev märk on koguaeg koos pausidega.',
  'help.guide.tour-paddle-time.result': 'Hinnang arvestab sinu sisestatud väärtusi ja näitab, mis veel puudub.',
  'help.guide.tour-paddle-wind.tip.2':
    'Mitmepäevase retke kaardi päises on iga päeva jaoks silt „Päev“. Klõpsa sellel, et näha selle päeva tuult.',
  'help.guide.tour-paddle-checklist.step.3':
    'Kirjed järgivad marsruuti: paisud, lüüsid, kärestikud, vettelaskmiskohad ja juurdepääsureeglid OpenStreetMapist ning sinu enda ülekanded ja lüüsid märkega „Omad“.',
  'help.guide.tour-paddle-checklist.result': 'Igal marsruudi kirjel on otsus ja oled ohutusmärkuse läbi lugenud.',
  'help.guide.tour-paddle-track-marks.step.6': 'Klõpsa „Lüüs“, seejärel klõpsa joonel kohas, kus lüüs asub.',
  'help.ctx.trip-tour-horse.bullet.1':
    'Määra redaktoris „Matka tüüp“ väärtusele „Ratsamatk“ ja vasakusse veergu ilmub kaart „Ratsarajad“. „Otsi kaardivaatest“ loetleb kaardivaates olevad marsruudid.',
  'help.guide.tour-horse-plan.step.2':
    'Klõpsa välja „Retke nimi“ all väljal „Matka tüüp“ ja vali „Ratsamatk“. Jaotise „Teekonnapunktid“ alla ilmub kaart „Ratsarajad“.',
  'help.guide.tour-horse-plan.tip.2':
    'TREK ei arvuta ratsamatkale ratsutamisaega. Kui tahad, et päeval oleks aeg, sisesta see jaotises „Üksikasjad“ väljale „Plaanis“.',
  'help.guide.tour-horse-gap.step.3': 'Klõpsa „Võta lõik üle“. Kuni lüliti pole sees, on nupp hall.',
  'help.guide.tour-horse-recorded.step.1':
    'Klõpsa jaotises „Selle reisi retked“ „Lisa matk“ (+), vali „Impordi GPX või KML“ ja vali oma ratsamatka fail.',
  'help.guide.dateless-trip.title': 'Reisi planeerimine ilma kuupäevadeta',
  'help.guide.trip-reminder.step.2':
    'Vali jaotises „Meeldetuletus“ 1, 3 või 9 päeva. Muu etteteatamisaja jaoks klõpsa „Kohandatud“ ja sisesta päevade arv vahemikus 1 kuni 30.',
  'help.guide.upcoming-reservations.title': 'Järgmiste broneeringute juurde liikumine',
  'help.guide.half-company-holiday.title': 'Ettevõtte poole puhkepäeva märkimine',
  'help.guide.edit-holiday-calendar.step.2':
    'Klõpsa värviruudul, et valida uus värv, või kirjuta uus nimetus ja vajuta Enter.',
  'help.guide.person-color.step.1': 'Klõpsa kaardil „Inimesi“ nime ees oleval värvilisel täpil.',
  'help.guide.answer-fusion-request.title': 'Ühendamistaotlusele vastamine',
  'help.guide.log-for-partner.title': 'Päevade märkimine kaasplaneerija eest',
  'help.guide.dissolve-fusion.title': 'Ühise planeerimise lõpetamine',
  'help.guide.country-places.goal':
    'Vaata kohti, mida TREK riigi alla arvestab, et kontrollida, mida sa seal tegid, või leida koht, mille TREK on vale riigi alla pannud.',
  'help.guide.regions.tip.3':
    '„Lisa soovinimekirja“ töötab ka piirkonna puhul. Piirkond on näidatud sama viirutusega nagu soovinimekirjas olev riik.',
  'help.guide.tour-activity-stats.step.2':
    'Vali vasakul oleva kahe sildiga ajavahemik ja tüüp. „Ajavahemik“ pakub valikuid „Kogu aeg“, „Sel aastal“, „Viimased 12 kuud“ ja iga varasem aasta, mil sul on retki; „Tüüp“ kitsendab arvud ühele retke liigile või valikule „Kõik tüübid“.',
  'help.guide.tour-activity-stats.tip.3':
    'Päev, kus on nimetatud osalejad, läheb arvesse ainult neile; päev, kus pole kedagi nimetatud, läheb arvesse kõigile reisil osalejatele. Vaheleht laadib reaalajas andmeid ja vajab internetiühendust.',
  'help.guide.move-to-list.goal':
    'Korrasta oma nimekirju, teisaldades kohti nende vahel või kopeerides neid teise nimekirja.',
  'help.guide.accept-list-invite.result':
    'Nimekiri ilmub ribal jaotisse „Jagatud“ ja avaneb koos kohtadega. Liikmete muudatused on kohe näha.',
  'help.guide.tour-collection-add-to-trip.step.1':
    'Ava nimekiri. Salvestatud retked on esimesed read, kohtade kohal. Klõpsa retke juures „Lisa reisile“ või klõpsa real endal.',
  'help.guide.tour-collection-manage.title': 'Salvestatud retkede leidmine ja eemaldamine',
  'help.guide.tour-collection-manage.result': 'Retk eemaldatakse nimekirjast ja lühike teade kinnitab seda.',
  'help.guide.entry-draft.title': 'Sissekande hoidmine mustandina',
  'help.guide.journey-map-layers.step.1':
    'Kaardi ülaosas oleval kihiribal on „Plaan“, „Salvestatud“, „Sissekanded“ ja „Fotod“, igaühel oma arv. Klõpsa ühel, et see peita või näidata.',
  'help.guide.journey-keep-route.step.1': 'Klõpsa päeva päises Dawarichi nupul „Võta salvestus üle“.',
  'help.guide.journey-day-stays.step.1':
    'Kui päeval on ülevaatamist vajavaid peatumisi, lõpeb see reaga, näiteks „4 peatumist Dawarichist“ ja ajavahemik. Klõpsa sellel, et peatumisi näha.',
  'help.guide.journey-take-over-day.step.1':
    'Klõpsa päeva peatumiste rea lõpus „Võta päev üle“ või päeva päises olevat loendinuppu, mis näitab ootel peatumiste arvu.',
  'help.guide.journey-auto-prepare.goal':
    'Lase reisi ajal iga päeva peatumised automaatselt ülevaatamiseks ette valmistada.',
  'help.guide.photo-location.goal': 'Pane sissekanded kaardile ilma igaühe jaoks kohta otsimata.',
  'help.ctx.settings-about.bullet.1': 'Selles serveris töötav versioon on näidatud pealkirja kõrval.',
  'help.guide.readability.tip.3':
    '„Loetavus“ on märgitud kui „Eksperimentaalne“. Kui midagi näeb vale välja, klõpsa vahelehe allosas „Taasta vaikeseaded“, et vaikeseaded taastada.',
  'help.guide.web-push-device.goal': 'Saa TREKi teavitusi oma telefonis või arvutis ka siis, kui TREK on suletud.',
  'help.guide.connect-airtrail.tip.2':
    'Võti salvestatakse krüpteeritult ja seda ei näidata enam kunagi; täpid väljal tähendavad, et võti on salvestatud.',
  'help.guide.connect-dawarich.tip.2':
    'Nuppude all näitab kaart, millal TREK viimati kontrollis ja mida sinu Dawarichi versioon ei paku.',
  'help.guide.tour-connect-wanderer.tip.2':
    'Privaatsel aadressil oleva serveri jaoks võib administraator pidada sisevõrgud lubama.',
  'help.guide.tour-wanderer-watch.tip.2':
    '„Peatatud kuni“ tähendab, et wanderer ei vastanud; „Tõend tagasi lükatud“ tähendab, et tõend vajab õnnestunud ühendustesti või tuleb asendada uuega.',
  'help.guide.plugin-settings.result':
    'Plugin töötab sinu seadetega ja iga toiming, mille see sinu eest teeb, on loetletud jaotises „Pluginate tegevus“.',
  'help.ctx.admin-defaults.bullet.3':
    'Määratud välja kõrval olev lähtestuslink taastab TREKi vaikeväärtuse. Kasutaja enda seade on alati nende ees ülimuslik.',
  'help.ctx.admin-settings.bullet.5': '„Ohutsoon“: „Roteeri JWT saladus“ logib välja kõik kasutajad, ka sinu.',
  'help.guide.default-user-settings.step.1':
    'Vali jaotises „Kasutajate vaikeseaded“ „Värvirežiim“ („Hele“, „Tume“ või „Automaatne“), „Temperatuuriühik“, „Vahemaaühik“, „Ajavorming“, „Nädala alguspäev“, „Kuvamisvaluuta“ ja see, kas „Hägusta broneerimiskoodid“ on sees või „Väljas“. Iga valik salvestub kohe.',
  'help.guide.admin-passkeys.step.2':
    'Sisesta „Teenuseosutaja ID (domeen)“, näiteks trek.example.org, ja „Lubatud päritolud“, mille kaudu sinu TREK on kättesaadav, seejärel klõpsa „Salvesta“. Jäta mõlemad tühjaks, et kasutada APP_URL-i.',
  'help.guide.rotate-jwt-secret.title': 'Kõigi korraga väljalogimine',
  'help.guide.notification-defaults.step.2':
    'Klõpsa lahtril, et lülitada see järgmisse olekusse: sees, „Väljas“, „Blokeeritud“. Vihje näitab järgmist olekut ja iga klõps salvestub kohe.',
  'help.ctx.notifications.bullet.2':
    'Ülal olevad „Kõik“ ja „Lugemata“ vahetavad kõigi teavituste ja ainult lugemata teavituste vahel. Kerimisel laaditakse loendisse juurde.',
  'help.guide.read-notifications.step.3':
    'Klõpsa teavituse all oleval nupul, siin „Vaata Vacayd“, et avada see, millest teavitus räägib. See märgib teavituse ka loetuks.',
  'help.guide.filter-notifications.step.3':
    'Klõpsa „Lugemata“, et näha ainult lugemata teavitusi. „Kõik“ näitab jälle kõiki.',
  'help.guide.mark-notifications-read.tip.2':
    'Loetuks märkimine muudab ainult taustavärvi ja arvu. Teavitus jääb loendisse, kuni selle kustutad.',
  'help.guide.delete-notifications.result': 'Teavitus eemaldatakse loendist ja kellaikooni alt.',
  'help.guide.notification-settings.result':
    '„Seaded“ on avatud jaotises „Teavitused“, kus on lüliti iga sündmuse ja kanali jaoks.',
  'help.guide.link-journal.goal': 'Näita ühte oma reisilugude päevikut reisi sees valitud inimestele.',
  'help.guide.link-journal.tip.3':
    'Hiljem on „Reisi seadete“ jaotises „Päevik“ valikud „Muuda ligipääsu“, „Vaheta päevikut“ ja „Eemalda seos“. Seose eemaldamine eemaldab vahelehe; inimesed, kelle lisasid päevikusse endasse, säilitavad oma juurdepääsu.',
  'help.guide.dawarich-stays.result':
    'Peatumine on nüüd reisi koht valitud päeval või jaotises „Planeerimata“ ning paneel märgib selle tehtuks.',
  'help.ctx.trip-days.bullet.7': 'Reisi ajal avaneb plaan tänasel päeval ja kerib selleni.',
  'help.guide.leave-stop-off-route.tip.2':
    '„Eemalda päevast“ võtab peatuse päevast hoopis välja; „Jäta marsruudist välja“ jätab selle plaani.',
  'help.guide.move-booking-day.goal': 'Vii transport või broneering otse plaanist teisele päevale, ilma vormi avamata.',
  'help.guide.place-image-from-file.result': 'Foto on koha pilt kaardil, kohtade veerus, päevas ja kaardil.',
  'help.guide.place-own-hours.step.3':
    'Nende all olev „Lahtiolekuajad“ näitab nädalat, iga päeva kohta üks rida. Kui TREK leidis kohale ajad, on need juba täidetud; muidu klõpsa kõigepealt „Lisa lahtiolekuajad“. Sisesta iga päeva avamis- ja sulgemisaeg ning klõpsa päeval, mil koht ei ole avatud, „Suletud“.',
  'help.guide.add-accommodation.tip.5':
    'GPX-radu ja retkede kohti ei pakuta kunagi ööbimiskohaks, ainult reisi tavalisi kohti.',
  'help.guide.confirm-stay-booking.step.1':
    'Ava sisseregistreerimise päev. Majutuse kaardil jaotises „Broneering“ on selle öö hotellibroneering olekuga „Ootel“ või „Kinnitatud“. Klõpsa sellel kastil.',
  'help.guide.tour-map-lines.step.4':
    'Retke eemaldamiseks kaardilt lülita parem veerg vaatele „Retked“, vii kursor retkele ja klõpsa silmal „Peida kaardil“. Retke joon ja nööpnõel kaovad kaardilt ning rida jääb loendisse tuhmina, läbikriipsutatud silmaga „Näita kaardil“, mis toob selle tagasi.',
  'help.guide.car-stops.step.1':
    'Klõpsa auto kättesaamise päeva päises +-il, mille vihje on „Lisa päevale“, ja vali „Lisa transport“.',
  'help.guide.car-stops.tip.2':
    '„Liiguta üles“ ja „Liiguta alla“ ilmuvad alles siis, kui sõidul on vähemalt kaks peatust.',
  'help.guide.transport-details.title': 'Transpordi avamine ja selle üksikasjade kasutamine',
  'help.guide.transport-details.tip.1':
    'Kui sõidu joon on juba kaardil, lülitab uus klõps nupul „Kaardil“ selle välja.',
  'help.guide.export-transports-csv.result':
    'Brauser salvestab faili, mille nimi põhineb reisil, näiteks autumn-in-japan-transports.csv, ja kus on iga sõidu kohta üks rida: „Tüüp“, „Pealkiri“, „Olek“, „Algus“, „Lõpp“, „Lähtekoht“, „Sihtkoht“, „Asukoht“, „Kinnitus“ ja „Märkmed“.',
  'help.guide.group-sort-bookings.goal':
    'Korralda kaardid või loend oleku, päeva või tüübi järgi soovitud järjekorras.',
  'help.guide.booking-on-map.tip.1':
    '„Kaardil“ on olemas ainult kohaga broneeringul. Vali vormis väljal „Koht / tegevus“ koht ja nupp ilmub.',
  'help.guide.export-bookings-csv.step.2':
    'Ava vaateikoonide järel olevad liugurid „Vaate valikud“ ja vali jaotises „Sordi“ järjekord. Read järgivad seda, iga broneeringu kohta üks rida ja ilma jaotisteta.',
  'help.guide.edit-booking.tip.4':
    'Kui oled midagi muutnud, küsib klõps vormist väljaspool või Escape „Kas loobuda muudatustest?“. „Jätka muutmist“ viib sind vormi tagasi.',
  'help.guide.arrange-packing-list.step.2':
    'Nimekirja sees saad rea vasakul olevast pidemest eset üles või alla lohistada. Sinu rõhuvärvis joon rea vasakus servas näitab, kuhu see jääb.',
  'help.guide.count-packed-pieces.goal': 'Anna esemele kogus ja märgi selle tükid ükshaaval pakituks.',
  'help.guide.count-packed-pieces.tip.3': 'Kui kogus on üks, loendurit pole; on ainult märkeruut.',
  'help.guide.expense-receipts.step.2':
    'Klõpsa „Kviitungid ja arved“ kõrval „Lisa“ ja vali foto või PDF; võid valida ka mitu korraga. Iga fail on pealkirja all loetletud ja selle kõrval on prügikast eemaldamiseks.',
  'help.guide.files-sync-settings.goal':
    'Otsusta, kas dokumente ainult imporditakse sinu salvestusteenusest, ainult eksporditakse sinna või mõlemat, ning mis juhtub, kui dokument kustutatakse või seda muudetakse mõlemas kohas.',
  'help.guide.files-sync-settings.tip.2':
    'Valikuga „Küsi minult“ ootab mõlemas kohas muudetud dokument kaardi all jaotises „Vajab ülevaatamist“. Klõpsa „Lahenda“ ja vali „Säilita TREKi versioon“, „Säilita teenusepakkuja versioon“ või „Säilita mõlemad“.',
  'help.guide.manage-notes.goal':
    'Ava märge täielikult, hoia oluline märge ülal ning paranda või eemalda aegunud teave.',
  'help.guide.manage-notes.tip.2':
    'Muutmise ajal kustutab juba lisatud failil olev punane rist selle kohe, enne kui klõpsad „Salvesta“, ja fail ei lähe prügikasti. Kõik märkme failid on ka reisi vahelehel „Failid“.',
  'help.guide.note-categories.step.6':
    'Kaardil „Märkmed“ filtreerivad päise all olevad sildid kaarte. Klõpsa kategoorial, et näha ainult selle märkmeid; „Kõik“ või sama silt uuesti näitab kõiki.',
  'help.guide.roadtrip-reorder.tip.1':
    'Peatuse liigutamine siin liigutab seda ka päevaplaanis: „Päevad“ näitab sama järjekorda.',
  'help.guide.roadtrip-overnight.step.1':
    'Märgi jaotises „Marsruudil“ väljal „Otsitav“ „Majutus“ või telgikoha jaoks „Telkimisala“, vali päev, millal tahad peatuda, ja klõpsa „Otsi“.',
  'help.guide.roadtrip-overnight.tip.3':
    'Kui „Sõiduseadete“ jaotises „Marsruudijoon“ on sisse lülitatud „Alusta ja lõpeta iga päev oma peatumiskohas“, algab järgmise päeva sõit sealt, kus magasid.',
  'help.guide.roadtrip-stop-fill.title': 'Ühe peatuse täitmistaseme määramine',
  'help.guide.roadtrip-bookings.title': 'Lennu, rongi või praami lisamine sõidu sisse',
  'help.guide.roadtrip-bookings.tip.2':
    'Peatuses broneeritud laud või pilet on selle peatuse juures sildina; kõik, mis ei kuulu ühegi peatuse juurde, on loetletud jaotises „Samaks päevaks broneeritud“.',
  'help.guide.roadtrip-google-import.step.3':
    'Kontrolli leitud peatusi. Iga peatuse juures on näha, kus see asub; peatus, mille asukohta ei õnnestunud määrata, jäetakse vahele.',
  'help.guide.roadtrip-hazards.step.1': 'Ava paremas veerus „Sõiduseaded“.',
  'help.ctx.trip-tours.summary':
    'Vahelehe „Plaan“ parem veerg retkede režiimis: kõik reisi retked ühes loendis, päevade kõrval. Siit paned retki päevadele, filtreerid loendit, peidad kaardil jooni ja impordid GPX- või KML-faile. Marsruute joonistad ja muudad vahelehel „Retked“.',
  'help.guide.tour-show-list.goal': 'Asenda kohtade veerg reisi retkedega, et näha ja valida neid päevade kõrval.',
  'help.guide.tour-show-list.tip.3':
    'Kui lisamoodul „Retked“ on sees, ei ole radu kunagi kohtade loendis: iga imporditud rada on retk ja on loetletud siin.',
  'help.guide.tour-add-to-day.step.5':
    'Etappidega retk küsib samas menüüs edasi. „Etapid alates sellest päevast“ paneb 1. etapi sellele päevale ja iga järgmise etapi järgmisele päevale; „Kogu matk sellel päeval“ paneb kogu retke sellele ühele päevale.',
  'help.guide.tour-day-times.step.1':
    'Vii päevade veerus kursor retke reale, klõpsa „Veel valikuid“ (kolm täppi) ja vali „Muuda“.',
  'help.guide.tour-day-times.result': 'Retk on päeva ajajoonel koos algus- ja lõpuajaga nagu iga kellaajaga peatus.',
  'help.guide.tour-remove-from-day.result': 'Päeva all pole enam retke ja loendis pole selle real päevamärki.',
  'help.guide.tour-filter-list.tip.2':
    'Jaotis on näha ainult siis, kui retked selle poolest erinevad, nii et lühikese loendi puhul võib olla ainult „Olek“.',
  'help.guide.tour-hide-on-map.tip.1':
    'Peitmine mõjutab ainult sind ja salvestatakse selles brauseris selle reisi jaoks: retk, selle päevad ja värv ei muutu ning teiste kaartidel on retk endiselt näha.',
  'help.guide.tour-import-plan-tab.tip.1':
    'Rada, mis on juba reisil, on märgitud kui „Juba reisil“ ja seda ei impordita kaks korda.',
  'help.ctx.trip-tour-detail.bullet.4':
    'All olev rida: „Lisa päevale“ või „Eemalda päevast“, kui päev on avatud, „Navigeerimine“ alguspunkti, retke veebileht, „GPX“, „Jaga“, kui sinu seade oskab faile jagada, „Kogumik“ ja „Kopeeri“.',
  'help.guide.tour-detail-read.step.5':
    'Allpool on mõõtmed: „Vahemaa“, „Madalaim kõrgus“, „Kõrgeim kõrgus“, „Tõus“ ja „Laskumine“, nende all ajad ning kõrgusprofiil retke joone värvis.',
  'help.guide.tour-detail-read.result':
    'Retke kaart on plaani kõrval avatud ja tead, millistel päevadel retk on, kui pikk ja järsk see on ning kust see pärineb.',
  'help.guide.tour-rename-colour.tip.2': 'Pliiats ja täpp töötavad ainult liikmetele, kes tohivad kohti muuta.',
  'help.guide.tour-take-along.tip.2':
    'Kui valid jaotises „Seaded“ eelistatud kaardirakenduse, avab „Navigeerimine“ selle kohe, ilma loendita.',
  'help.guide.tour-copy-keep.step.3':
    'Kui tahad retke teiste reiside jaoks säilitada, ava see ja klõpsa kaardi allosas „Kogumik“.',
  'help.guide.tour-packing-link.goal':
    'Näita retke kaardil otse, mida retkeks pakkida, reisi pakkimisnimekirjast või mõnest selle nimekirjast.',
  'help.guide.tour-packing-link.tip.3':
    'Sidumiseks on vaja kohtade muutmise õigust. Teised näevad seotud nimekirja, kuid ei saa seost muuta.',
  'help.guide.tour-files.tip.2': '„Laadi üles“ on näha ainult liikmetele, kes tohivad retke muuta ja faile lisada.',
  'help.guide.tour-activity-link.step.5':
    'Rada on nüüd jaotises „Tegelik rada“ oma väärtuste ja profiiliga plaani kõrval.',
  'help.guide.tour-activity-compare.step.2':
    '„Suurim kaugus plaanist“ näitab raja ja planeeritud joone suurimat vahemaad ning „Plaanist kõrval“ seda, kui suur osa rajast oli sellest joonest kõrval.',
  'help.guide.tour-origin-check.step.1':
    'Ava retke kaart ja keri jaotiseni „Päritolu“. „Allikas“ näitab, kust retk tuli: „GPX-import“ koos faili nimega, KML- või KMZ-import või wanderer koos aadressiga.',
  'help.ctx.trip-tour-planner.summary':
    'Reisi retkeplaneerija: vasakul redaktor, paremal kõik reisi retked ja nende vahel kaart. Siin joonistad retke punkt-punkti haaval, lased marsruudi arvutada mööda päris radu ja teid, lisad üksikasjad ja salvestad retke reisi.',
  'help.guide.tour-open-workspace.goal': 'Ava retkeplaneerija ja saa teada, milleks iga selle osa on.',
  'help.guide.tour-open-workspace.tip.1':
    'Iga riba siseservas sakil olev „Ahenda“ peidab riba, et kaardil oleks rohkem ruumi; „Plaan“ ja „Selle reisi retked“ toovad ribad tagasi. Riba laiuse muutmiseks lohista selle serva.',
  'help.guide.tour-draw-route.step.3':
    'Kontrolli, et jaotises „Teekonnapunktid“ olev „Lisa punkt“ on sees (see on sama lüliti nagu kaardi sildil olev „Lisa punkte“), seejärel klõpsa kaardil retke alguskohas.',
  'help.guide.tour-draw-route.result':
    'Kaardil on nummerdatud marsruut ja jaotises „Teekonnapunktid“ selle punktid, valmis nimetamiseks ja salvestamiseks.',
  'help.guide.tour-type-profile.tip.2':
    'Mõni tüüp vajab enne salvestamist rohkem andmeid: „Jooks“ „Planeeritud tempot“, „Aerutamismatk“ paati ja veekogu, „Suusad ja talv“ ala.',
  'help.guide.tour-edit-points.step.5': 'Selle kõrval olev prügikast „Eemalda teekonnapunkt“ eemaldab punkti retkest.',
  'help.guide.tour-shaping-points.step.2':
    'Lohista täpp rajale, mida marsruut peaks järgima. Marsruut planeeritakse selle kaudu uuesti.',
  'help.guide.tour-loop-reverse.goal': 'Lase retkel lõppeda alguspunktis või pööra selle suund ümber.',
  'help.guide.tour-leg-by-hand.title': 'Lõigu käsitsi joonistamine või uuesti planeerimine',
  'help.guide.tour-leg-by-hand.result':
    'Lõik on sinu valitud kohas sirgjoon, märgitud käsitsi joonistatuks, või selle marsruut arvutatakse uuesti.',
  'help.guide.tour-trip-places.tip.2':
    'Peatuse eemaldamine või seose eemaldamine jätab koha reisi samaks, koos päevadega.',
  'help.guide.tour-details-times.step.4':
    '„Plaanis“ näitab koguaega. Selle asendamiseks sisesta oma väärtus; see märgitakse siis kui „Käsitsi määratud“.',
  'help.guide.tour-save.step.2':
    'Oota, kuni „Uus retk“ kõrval olev täpp kaob. Salvestamiseks on vaja marsruuti ja kõiki selle kõrgusi.',
  'help.guide.tour-edit-saved.goal': 'Ava varem planeeritud retk, muuda seda ja salvesta uuesti.',
  'help.guide.tour-edit-saved.result': 'Salvestatud retkes on nüüd sinu muudatused.',
  'help.guide.tour-summary-profile.tip.2':
    'Via ferratat läbival marsruudil on arvude kohal hoiatusmärk koos raskusastmega.',
  'help.guide.tour-list-manage.step.4':
    '„Reisi kogumaht“ kohal olev nupp on filter. Sellel on näha olek, mille järgi filtreeritakse, alguses „Kõik“, koos retkede arvuga.',
  'help.guide.tour-delete.step.1':
    'Vii kursor jaotises „Selle reisi retked“ retkele ja klõpsa rea paremas servas oleval prügikastil „Kustuta“ koos retke nimega.',
  'help.guide.tour-saved-elsewhere.step.1':
    'Muutmise ajal ilmub riba ülaossa teade „Seda matka salvestati mujal“. Sinu muudatused jäävad alles, kuni otsustad.',
  'help.ctx.trip-tour-import.summary':
    'Siin impordid reisi retki, mis on juba mujal olemas: kellast või rakendusest pärit GPX-, KML- või KMZ-faili, oma teise reisi retke või raja oma wandererist. Import säilitatakse täpselt salvestatud kujul ja selle põhjal saad planeerida muudetava versiooni.',
  'help.guide.tour-import-gpx.step.1':
    'Ava reisi vaheleht „Retked“. Klõpsa paremal jaotise „Selle reisi retked“ ülaosas +-il („Lisa matk“).',
  'help.guide.tour-import-gpx.tip.4':
    'KML- või KMZ-fail näitab jaotises „Ei impordita“ ka seda, mis selles peale joonte veel oli: nööpnõelad, alad ja muud objektid.',
  'help.guide.tour-view-import.tip.1':
    'Importi ei saa punkt-punkti haaval muuta. Ülal kaardil „Muudetav versioon“ olev „Planeeri muudetav versioon“ loob sellest retke, mida saad muuta.',
  'help.guide.tour-plan-from-import.step.3':
    'Klõpsa „Asenda import“, et see retk samas kohas uuesti planeerida: päevad ja märkmed jäävad alles ning salvestatud rada säilitatakse, et saaksid selle taastada. „Planeeri uue retkena“ ei muuda importi ja loob selle kõrvale teise retke.',
  'help.guide.tour-restore-recorded.goal':
    'Tühista impordi ümberplaneerimine ja saa algne rada tagasi, ka palju hiljem.',
  'help.guide.tour-take-over.goal':
    'Kasuta uuesti retke, mille oled mõnes teises oma reisis juba planeerinud või importinud, ilma seda uuesti joonistamata.',
  'help.guide.tour-take-over.tip.2':
    'Loetletakse ainult sinu teised reisid ja ainult esimesed 100 retke. Ülejäänute leidmiseks otsi või filtreeri.',
  'help.guide.tour-import-wanderer.step.4': 'Klõpsa „Impordi reisi“.',
  'help.ctx.trip-tour-map.bullet.1':
    'Kaardi all vasakul oleval sildil on avatud retke tüübile sobivad aluskaardid: „Kaart“, „Topo“, matkal „Matkamine“, rattaretkel „Jalgratas“ ja „Satelliit“. Siin tehtud valik kehtib ainult planeerijas ega muuda kunagi kaardi seadet jaotises „Seaded“.',
  'help.guide.tour-map-layers.step.2':
    'Klõpsa „Topo“, et näha kõrgusjooni ja varjutatud reljeefi, mis näitab maapinna järskust. Valitud kaart jääb sildil esile tõstetuks.',
  'help.guide.tour-along-search.step.1':
    'Ava retk vahelehel „Retked“ ja keri vasakus paneelis retke peatuste all olevani „Matka ääres“. Kaart on olemas, kui retkel on marsruut.',
  'help.guide.tour-along-search.tip.3':
    'Tulemused tulevad OpenStreetMapist ja TREKi kohtade registrist, nii et otsing vajab ühendust. Kui midagi ei leita, proovib „Laienda“ järgmist vahemaad; kui server on hõivatud, näitab „Proovi uuesti“ loendurit, kuni saad uuesti proovida.',
  'help.guide.tour-along-add-stop.tip.1':
    'Kohast saab retke peatus, mitte reisi koht, nii et seda kohtade loendis pole.',
  'help.guide.tour-3d-terrain.step.4':
    'Lohista liugurit „Reljeef“, et muuta künkad kuni kolm korda kõrgemaks, mis aitab laugel maastikul.',
  'help.guide.tour-3d-flyover.step.1':
    'Lülita retk 3D-vaatesse. Kuni marsruudi maastik laaditakse, täitub esitusnupu kohal rõngas; kui see on täis, klõpsa „Esita ülelend“. Kaamera järgib täppi mööda marsruuti ja jaotises „Retke kokkuvõte“ olev kõrgusprofiili kursor liigub kaasa.',
  'help.guide.tour-map-overlays.title': 'Nõlvade või navigatsioonimärkide näitamine kaardi peal',
  'help.guide.tour-map-overlays.tip.2':
    'Nõlvade lüliti on olemas ka siis, kui ükski retk pole avatud, nii et saad suusakeskust vaadata enne planeerimist. Matkal pakub silt hoopis valikut „Via ferrata rajad“ koos vaates olevate radade arvuga.',
  'help.ctx.trip-tour-stages.bullet.5':
    'Retke real olev pluss „Lisa päevale“ paneb etapid reisile alates valitud päevast, üks etapp päevas, või kogu retke sellele ühele päevale.',
  'help.guide.tour-multi-day.step.6':
    'Kui tahad retke uuesti ühepäevaseks teha, klõpsa „Ühepäevane“ ja kinnita küsimus „Teha sellest ühepäevane matk?“ nupuga „Eemalda etapi lõpud“. Marsruut jääb samaks.',
  'help.guide.tour-stages-on-days.step.1':
    'Vii kursor jaotises „Selle reisi retked“ mitmepäevasele retkele ja klõpsa plussil „Lisa päevale“.',
  'help.guide.tour-stages-on-days.tip.3':
    'Kui lohistad mitmepäevase retke vahelehel „Plaan“ päevale, küsitakse sama dialoogis, samuti retke kaardil oleva „Lisa päevale“ puhul.',
  'help.ctx.trip-tour-hike.bullet.4':
    'Teekonnapunktide all olev „Raja üksikasjad“ näitab OpenStreetMapi andmete põhjal iga lõigu SAC-raskusastet, katet ja teetüüpi ning värvib marsruudi kaardil nende järgi. Miski siin ei muuda retke.',
  'help.guide.tour-hike-plan.step.4':
    '„Lisa punkt“ on kohe alguses sees: klõpsa kaardil matka alguse ja lõpu kohal. Selle kõrval olev „Reisi kohad“ valib hoopis reisi onni või hotelli. Alates kahest punktist arvutab TREK matkamarsruudi.',
  'help.guide.tour-hike-trail-details.title': 'Matka raskusastmete, katete ja teetüüpide vaatamine',
  'help.guide.tour-hike-trail-details.tip.1':
    'Teed, millel OpenStreetMapis väärtust pole, on loetletud jaotises „Teadmata“, ja teadmata ei tähenda lihtsat. Kui mõne juures on „Seekord ei õnnestunud küsida“, klõpsa „Proovi uuesti“.',
  'help.guide.tour-hike-round.step.4':
    'Klõpsa ringil, et see valida. Selle real on vahemaa, tõus ja aeg ning see, kui palju see erineb soovitud vahemaast.',
  'help.guide.tour-hike-compare-ways.step.1':
    'Vii kursor peatusele, kust lõik algab, klõpsa selle real „Rohkem toiminguid“ ja vali „Võrdle järgmise lõigu teid“.',
  'help.guide.tour-ferrata-add.title': 'Via ferrata lisamine matkale',
  'help.guide.tour-ferrata-add.tip.1':
    'Via ferrata nõuab varustust ja kogemust. Märgi vihje ütleb, kui palju sellest marsruut läbib.',
  'help.guide.tour-run-plan.step.3':
    'Sisesta „Planeeritud tempo“ minutite ja sekunditena kilomeetri kohta, näiteks 7:30.',
  'help.guide.tour-run-ways.title': 'Jooksu teede vaatamine',
  'help.ctx.trip-tour-walk.title': 'Linnajalutuskäik',
  'help.guide.tour-walk-plan.goal':
    'Koosta peatustest vaatamisväärsuste jalutuskäik koos sellega, kui kaua igas peatuses viibid ja millised neist on olulised.',
  'help.guide.tour-walk-plan.tip.2':
    'Linnajalutuskäigul pole matkapiirangut ega välja „Pausid“: selle asemel arvestatakse viibimisaegu.',
  'help.guide.tour-walk-sights.step.4':
    'Klõpsa loendis kohal. Selle kaart avaneb kaardi peal: vali jaotises „Kuhu see läheb“ kaks peatust, mille vahele see tuleb.',
  'help.guide.tour-walk-day-times.step.1':
    'Pane jalutuskäik päevale: klõpsa jaotises „Selle reisi retked“ selle real ümmargusel +-il („Lisa päevale“) ja vali päev.',
  'help.guide.tour-walk-day-times.result':
    'Saad peatuste järjekorda või viibimisaegu muuta seni, kuni iga koht on sinna jõudes avatud.',
  'help.guide.tour-walk-google-import.tip.2':
    '„Kasuta teist linki“ viib sind tagasi lingiväljale. Laadimine asendab planeerija salvestamata muudatused ja dialoog hoiatab sind enne.',
  'help.guide.tour-walk-check-off.step.4':
    'Loendi ülaosas on külastatud peatuste arv ja allesjäänud kõndimisaeg. Peatuse juures olev „Võta tagasi“ eemaldab selle märke.',
  'help.ctx.trip-tour-bike.bullet.2':
    'Paremal olev „Retke kokkuvõte“ näitab väärtust „Sõiduaeg (hinnanguline)“, mis on marsruudiplaneerija aeg selle profiili jaoks koos tõusudega. Pause selles pole.',
  'help.guide.tour-bike-profile.step.4':
    'Klõpsa jaotises „Teekonnapunktid“ „Reisi kohad“ ja vali algus ja lõpp, siin Hotel Alpenroyal ja seejärel Hotel Greif. Võid ka kontrollida, et „Lisa punkt“ on sees, ja klõpsata kaardil. Alates kahest punktist arvutab TREK marsruudi.',
  'help.guide.tour-bike-profile.tip.5':
    'Kui administraator lubab CyclOSM-i kaardi, pakub kaardi kihirida rattaretke avamisel ka valikut „Jalgratas“. Kui see lakkab laadimast, lülitu valikule „Kaart“. Retk ei muutu.',
  'help.guide.tour-bike-surfaces.tip.1':
    '„Andmetes puudub“ tähendab, et OpenStreetMapis pole seal katet märgitud. Kate on teadmata, mitte tingimata hea.',
  'help.guide.tour-bike-mtb-grades.step.3': 'Klõpsa raskusastme real, et need rajad kaardil esile tõsta.',
  'help.ctx.trip-tour-ski.bullet.1':
    'Kõigepealt tuleb „Ala“ ja midagi pole eelvalitud: „Mäesuusatamine“, „Lumelaud“, „Murdmaasuusatamine“, „Matkasuusatamine“, „Räätsamatk“ või „Talvematk“. Murdmaasuusatamine küsib lisaks „Tehnika“: „Klassika“, „Uisutehnika“ või „Teadmata“. Ilma alata ei saa retke salvestada.',
  'help.guide.tour-ski-plan.step.2': 'Ava „Matka tüüp“ ja vali „Suusad ja talv“.',
  'help.guide.tour-ski-plan.tip.4':
    'Kus nõlvaandmeid pole, on lõik punktide vahel sirgjoon. Räätsamatka ja talvematka puhul võib see kasutada hoopis suveradu ja lõigul olev hall märkus annab sellest teada.',
  'help.guide.tour-ski-options.step.5':
    'Vajuta jaotises „Jäta välja“ iga tõstukiliigi nuppu, millega sa sõita ei taha: „Pukseerliftid“, „Avatud toolliftid“, „Gondliftid“, „Köisraudteed“ või „Funikulöörid ja rongid“. Vajutatud nupp on läbi kriipsutatud.',
  'help.guide.tour-ski-fix-leg.step.2':
    'Klõpsa real pakutud parandusel: „Luba raskemad nõlvad“, „Luba see tõstuk“, „Sõida tõstukiga alla“, „Vaheta tehnikat“ või „Vaheta ala“. Valik muutub ja lõik planeeritakse uuesti.',
  'help.guide.tour-ski-summary.goal': 'Vaata, kuidas päev jaguneb suusatamise, tõstukite, ootamise ja kõndimise vahel.',
  'help.guide.tour-ski-summary.result':
    'Tead, kui palju aega võtab päev nõlvadel, tõstukites ja nende järel ootamisel.',
  'help.guide.tour-ski-pistes-layer.tip.3':
    'Kiht on kaardiandmed, mitte reaalajas info: see ei ütle midagi selle kohta, mis on avatud või hooldatud, ega lume ja laviinide kohta. Lüliti on olemas ka siis, kui ükski retk pole avatud, nii et saad suusakeskust vaadata enne planeerimist.',
  'help.guide.tour-ski-import.step.5':
    'Klõpsa rajal jaotises „Selle reisi retked“, et see avada. Kui tahad ala hiljem parandada, klõpsa selle kaardil „Suusarada“ „Muuda“.',
  'help.ctx.trip-tour-paddle.bullet.1':
    'Jaotises „Matka tüüp“ küsib „Aerutamismatk“ „Paati“ („Süst“, „Kanuu“, „SUP“ või „Muu“) ja „Veekogu“ („Jõgi“ või „Järv“). Retke ei saa salvestada enne, kui mõlemad on valitud.',
  'help.guide.tour-paddle-setup.step.1': 'Klõpsa vahelehel „Retked“ vasaku veeru ülaosas „Planeeri uus retk“.',
  'help.guide.tour-paddle-setup.tip.2':
    'Aerutamisretke kaart pakub vaateid „Kaart“ ja „Satelliit“ ning kattekihina OpenSeaMapi „Navigatsioonimärgid“.',
  'help.guide.tour-paddle-water-route.step.3':
    'Vali „Planeeri järgmine lõik vett mööda“. TREK planeerib lõigu mööda jõge või järve sellest punktist järgmiseni.',
  'help.guide.tour-paddle-portage.title': 'Paadi kandmine ümber takistuse',
  'help.guide.tour-paddle-portage.tip.2':
    'Viimasel punktil rakendub „Siit alates kanna paati“ siis, kui lisad järgmise punkti. Real on kirjas „Siit alates kanda“ ja selle rist „Siiski mitte kanda“ tühistab selle.',
  'help.guide.tour-paddle-lock.step.4':
    'Sisesta minutid väljadele „Ootamine“ ja „Läbimine“. Kui mõlemad on sisestatud, näitab kaart nende summat.',
  'help.guide.tour-paddle-time.step.2':
    'Riba näitab marsruuti algusest lõpuni: vesi, ülekanded pruunina ja lüüsid kriipsudena. Marsruudi takistused on tähised, millel klõpsates leiad need kaardilt.',
  'help.guide.tour-paddle-wind.title': 'Aerutamispäeva tuule kontrollimine',
  'help.guide.tour-paddle-wind.tip.3':
    'Tuulisel päeval, kui retk ületab järve, pakub kaart valikut „Planeeri kalda lähedale“, mis planeerib järveosad mööda kallast.',
  'help.guide.tour-paddle-checklist.step.4':
    'Klõpsa kirjel. Kaart liigub selleni: takistuse puhul avaneb selle kaart koos sinu otsusega; sinu enda ülekande või lüüsi puhul valitakse selle punkt.',
  'help.guide.tour-paddle-track-marks.title': 'Ülekannete ja lüüside märkimine salvestatud aerutamisrajale',
  'help.guide.tour-paddle-track-marks.step.7': 'Ava kaardid, sisesta minutid ja klõpsa „Salvesta“.',
  'help.ctx.trip-tour-horse.bullet.2':
    'Marsruut avaneb eraldi dialoogis: vali lõik ja „Suund“, kuhupoole seda ratsutad, kontrolli „Ligipääs hobusega“, seejärel klõpsa „Võta lõik üle“.',
  'help.guide.tour-horse-plan.step.3':
    'Klõpsa kaardil „Ratsarajad“ „Otsi kaardivaatest“. Kõik vaates olevad tähistatud ratsateed on seal loetletud koos pikkusega.',
  'help.guide.tour-horse-plan.tip.3':
    'Liigutasid pärast otsingut kaarti? Nupul on kirjas „Otsi sellest vaatest“. Liiga suure vaate puhul palutakse enne lähemale suumida.',
  'help.guide.tour-horse-gap.step.4':
    'Kaardil „Teekonnapunktid“ on ühenduslõigul kirjas „Käsitsi, kontrollimata“ koos pikkusega. Vii kursor sellele, et lugeda põhjust.',
  'help.guide.tour-horse-recorded.step.2':
    'Avaneb „Impordi eelvaade“ ja midagi pole veel salvestatud. Määra jaotises „Impordi kui“ „Matka tüüp“ väärtusele „Ratsamatk“. Kolm märki näitavad, mida import säilitab ja mida see ei arvuta.',
  'help.guide.dateless-trip.goal': 'Alusta planeerimist juba enne, kui tead, millal reisid.',
  'help.guide.trip-reminder.step.3': 'Klõpsa „Uuenda“.',
  'help.guide.upcoming-reservations.goal':
    'Vaata, mis on kõigil sinu reisidel järgmisena broneeritud, ja ava reis, kuhu see kuulub.',
  'help.guide.log-day.tip.3':
    'Terve ettevõtte puhkepäevaks märgitud päeva ei saa märkida. Poole ettevõtte puhkepäeva puhul läheb puhkusepäev arvesse ainult 0,5 päevana.',
  'help.guide.half-company-holiday.goal':
    'Anna kõigile vaba pärastlõuna, näiteks jõululaupäeval, ilma tervet päeva vabaks andmata.',
  'help.guide.public-holidays.tip.2': 'Vii kursor ruudustikus pühale, et näha selle nime.',
  'help.guide.edit-holiday-calendar.step.3':
    'Muuda loendites riiki või piirkonda või klõpsa prügikastil, et kalender eemaldada.',
  'help.guide.person-color.step.2': 'Vali värv. See salvestub kohe ja dialoog sulgub.',
  'help.guide.answer-fusion-request.goal': 'Otsusta, kas ühendada oma puhkuseplaan kutsuja plaaniga.',
  'help.guide.log-for-partner.goal':
    'Märgi vaba päev inimesele, kes on sinu plaaniga ühendatud, näiteks kui ta sind selleks palub.',
  'help.guide.dissolve-fusion.goal': 'Jaga ühendatud plaan tagasi eraldi plaanideks.',
  'help.guide.country-places.step.1':
    'Otsi riiki, kus oled käinud, ja vali see. Selle kaart ilmub all olevale paneelile.',
  'help.guide.tour-activity-stats.step.3':
    'Vaata arve: vahemaa, mille nurgas on retkede arv, seejärel „Tõus“ ja „Laskumine“. Valiku „Kõik tüübid“ puhul on järgmisena kolm kõige sagedamini tehtud tüüpi, igaühel oma arv ja vahemaa.',
  'help.guide.move-to-list.step.1': 'Klõpsa filtrireas märkeruudu ikoonil „Vali“ ja märgi kohad.',
  'help.guide.tour-collection-add-to-trip.step.2':
    'Vali jaotises „Reisile“ reis. Reis, kuhu sa ei tohi retki lisada, on tuhm.',
  'help.guide.tour-collection-manage.goal':
    'Vaata, milliseid retki nimekirjas on ja kust need pärinevad, ning eemalda need, mida enam ei vaja.',
  'help.guide.entry-draft.goal': 'Kirjuta sissekanne kohe ja peida see jagatud reisiloos, kuni see on valmis.',
  'help.guide.journey-map-layers.step.2':
    'Klõpsa riba lõpus oleval (i)-l, et näha kaardi legendi: see selgitab iga nööpnõela, täppi ja joont.',
  'help.guide.journey-keep-route.step.2':
    'Kontrolli välja „Päeva ajavöönd“, mis määrab, millal päev algab ja lõpeb, ning vaata salvestus üle: vahemaa, ajavahemik, osad ja lüngad.',
  'help.guide.journey-day-stays.step.2':
    'Klõpsa peatumise juures „Kirjuta päevikusissekanne“. Sissekanne lisatakse sellele päevale saabumisajal koos peatumise nime ja asukohaga.',
  'help.guide.journey-take-over-day.step.2':
    'Märgi peatumised, mida tahad säilitada, ja paranda nende nimed. Kahe märgitud peatumise vahel olev „Ühenda üheks sissekandeks“ ühendab need, „Hoia eraldi“ lahutab need uuesti.',
  'help.guide.journey-auto-prepare.step.1': 'Klõpsa päise paremas ülanurgas ⋯, et avada „Reisiloo seaded“.',
  'help.guide.photo-location.step.1': 'Klõpsa päise paremas ülanurgas ⋯, et avada „Reisiloo seaded“.',
  'help.guide.share-public.tip.3':
    'Mustandeid lingis kunagi ei näidata ja salvestatud marsruudid on näha ainult päevadel, kus on avaldatud sissekanne.',
  'help.ctx.settings-plugins.title': 'Pluginad',
  'help.ctx.settings-about.bullet.2':
    '„Teata veast“ ja „Funktsioonisoov“ avavad projekti GitHubis; Wiki avab dokumentatsiooni.',
  'help.guide.map-provider.tip.3':
    'GL-kaardil saad seda paremklõpsuga lohistades pöörata ja kallutada; keskklõps lisab koha.',
  'help.guide.web-push-device.step.1':
    'Klõpsa jaotises „Tõuketeavitused selles seadmes“ „Lülita selles seadmes sisse“ ja luba teavitused, kui brauser seda küsib. „Saada test“ kontrollib, kas teavitus jõuab kohale.',
  'help.guide.connect-airtrail.title': 'AirTraili ühendamine',
  'help.guide.connect-dawarich.title': 'Dawarichi ühendamine',
  'help.guide.tour-connect-wanderer.title': 'wandereri ühendamine',
  'help.guide.tour-connect-wanderer.tip.3': 'Paremal olev „Katkesta ühendus“ eemaldab tõendi uuesti.',
  'help.guide.tour-wanderer-watch.tip.3':
    'Nende vihjete kanalid valid jaotises „Teavitused“ real „wanderer: vihjed sinu radade kohta“.',
  'help.guide.plugin-settings.tip.1':
    'Need seaded kehtivad ainult sinu kohta; teised liikmed seadistavad plugina enda jaoks.',
  'help.guide.offline-conflicts.step.3':
    'Muudatused, mida server pidevalt tagasi lükkab, on jaotises „Võrguühenduseta vahemälu“ nimetuse „Ebaõnnestunud muudatused“ all: „Proovi uuesti“ saadab need veel kord, „Loobu“ jätab alles serveri versiooni.',
  'help.ctx.admin-notifications.bullet.4':
    'All olev „Kasutajate vaikeväärtused“: iga sündmuse ja kanali kohta sees, „Väljas“ või „Blokeeritud“ kõigile, kes pole seda muutnud.',
  'help.guide.default-user-settings.step.2':
    'Määratud välja nime kõrvale ilmub lähtestuslink; see taastab TREKi sisseehitatud vaikeväärtuse.',
  'help.guide.own-routing-engine.title': 'Oma marsruutimisserverite kasutamine',
  'help.guide.admin-passkeys.result':
    'Sisselogimislehel on valik „Logi sisse pääsuvõtmega“ ja inimesed saavad oma seadetes pääsuvõtmeid lisada.',
  'help.guide.rotate-jwt-secret.goal': 'Lõpeta kõik seansid, kui kahtlustad leket.',
  'help.guide.notification-defaults.result':
    'Kõik, kes pole lahtrit muutnud, alustavad sinu valikust ning blokeeritud lahtrid on nende seadetes lukustatud.',
  'help.ctx.notifications.bullet.3':
    'Igas teavituses on kirjas, kes mida ja kus tegi. Lugemata teavitustel on toonitud taust. Selle all olev nupp, näiteks „Vaata reisi“ või „Vaata Vacayd“, viib sind sinna ja märgib teavituse loetuks.',
  'help.guide.read-notifications.tip.1':
    'Kellaikoon on igal navigeerimisribaga ekraanil ja selle number uueneb uute teavituste saabudes automaatselt.',
  'help.guide.filter-notifications.tip.1':
    'Alla kerimisel laadib leht vanemaid teavitusi, nii et pärast esimest ekraani ei jää midagi välja.',
  'help.guide.mark-notifications-read.result':
    'Ühelgi teavitusel pole enam toonitud tausta ja kellaikoonil olev punane number on kadunud.',
  'help.guide.notification-settings.title': 'Teavituste valimine',
  'help.guide.link-journal.step.1': 'Klõpsa reisi nime kõrval „Reisi seaded“ ja vali vasakul „Päevik“.',
  'help.guide.dawarich-stays.tip.1':
    'Reisi ei lisata midagi enne, kui klõpsad „Lisa koht“. Peatumisest lisatud koha üksikasjades on kirjas „Lisatud sinu Dawarichi salvestustest“.',
  'help.guide.leave-stop-off-route.title': 'Peatuse marsruudist välja jätmine',
  'help.guide.move-booking-day.step.1':
    'Vii kursor päevas broneeringu reale: vasakul olev pide näitab, et seda saab lohistada.',
  'help.guide.place-image-from-file.tip.1': 'Pakutakse ainult JPG-, PNG-, GIF- ja WebP-faile; PDF-piletit mitte.',
  'help.guide.place-own-hours.step.4':
    '„Lahtiolekuaegade“ paremal olevad nupud: kopeerimisnupp annab kõigile päevadele esmaspäeva ajad ja X eemaldab sinu ajad. Kui TREK on ise ajad leidnud, toob „Võta üle koha andmetest“ need tagasi.',
  'help.guide.confirm-stay-booking.step.2': 'Broneering avaneb plaani peal. Selle päise esimene silt näitab olekut.',
  'help.ctx.trip-map.bullet.9':
    'Iga reisi retk on oma värvi joon, mille alguspunktis on nööpnõel. Klõpsa joonel, et avada retke kaart. Päeval, kus on retk, viib päeva marsruut retke alguspunkti ja jätkub sealt, kus retk lõpeb. Retkede loendis retke kõrval olev silm „Peida kaardil“ eemaldab selle joone sinu kaardilt.',
  'help.guide.tour-map-lines.result':
    'Kaardil on soovitud retked, igaüks oma värvis, ja peidetud retk on retkede loendis tuhm.',
  'help.guide.car-stops.step.2':
    'Klõpsa päises tüübisildil ja vali „Auto“. Vorm muutub: „Kuupäev“ ja „Algusaeg“ muutuvad väljadeks „Kättesaamine“ ja „Kättesaamise aeg“, „Lõppkuupäev“ ja „Lõpuaeg“ väljadeks „Tagastamine“ ja „Tagastamise aeg“ ning väljade „Lähtekoht“ ja „Sihtkoht“ alla ilmub „Peatused tee ääres“.',
  'help.guide.transport-details.goal':
    'Vaata ühest kohast kõiki sõidu üksikasju, kopeeri broneerimiskood, nimeta sõit ümber või liigu selleni kaardil.',
  'help.guide.transport-details.tip.2':
    'Escape või klõps üksikasjadest väljaspool sulgeb need. Kui „Nimeta ümber“ või kustutamisküsimus on avatud, sulgub enne see.',
  'help.guide.export-transports-csv.tip.1': 'Ikoon on ribal ainult siis, kui vahelehel on vähemalt üks sõit.',
  'help.guide.group-sort-bookings.step.1':
    'Klõpsa vaates „Kaardid“ või „Loend“ kolme vaateikooni järel olevatel liuguritel „Vaate valikud“.',
  'help.guide.create-booking.tip.4':
    'Võrguühenduseta salvestatakse broneering selles seadmes ja sünkroonitakse, kui oled taas võrgus. Uute failide jaoks on vaja ühendust, nii et eemalda need või salvesta hiljem. Kui klõpsad kogemata vormist väljaspool või vajutad Escape, küsib TREK enne sisestatu kaotamist „Kas loobuda muudatustest?“.',
  'help.guide.booking-on-map.tip.2': 'Majutus avaneb selle esimesel ööl.',
  'help.guide.export-bookings-csv.step.3':
    'Klõpsa „Vaate valikute“ järel oleval tabeliikoonil „Ekspordi tabelina (CSV)“.',
  'help.guide.arrange-packing-list.step.3':
    'Valikute „Jagatud“ ja „Minu nimekiri“ rea paremas otsas olev „A kuni Ü“ näitab iga nimekirja esemeid nime järgi, nii et näed kiiresti, kas miski on juba nimekirjas. Klõpsa uuesti, et taastada oma järjekord.',
  'help.guide.count-packed-pieces.step.1':
    'Klõpsa real koguse märgil, väikesel numbril, mille järel on x, sisesta, mitu tükki võtad, näiteks 5, ja vajuta Enter.',
  'help.guide.expense-receipts.step.3':
    'Klõpsa dialoogi allosas „Salvesta“. Failid laaditakse üles koos kuluga ja on näha ka reisi jaotises „Failid“.',
  'help.guide.files-sync-settings.step.1':
    'Klõpsa riba paremas otsas „Dokumentide sünkroonimine“. Kui reis on seotud, avaneb paremal sinu salvestusteenuse kaart; kui teenuseid on mitu, klõpsa vasakul jaotises „See reis“ soovitud teenusel.',
  'help.guide.files-sync-settings.tip.3':
    '„Kohesed uuendused“, link koos kopeerimisnupuga, on olemas ainult nende salvestusteenuste puhul, kus TREK ei saa muudatusi automaatselt jälgida. Kleebi link salvestusteenusesse ja muudatused jõuavad kohe, mitte järgmise kontrolli ajal.',
  'help.guide.manage-notes.step.1':
    'Klõpsa märkme kaardi päises kolmel täpil („Veel valikuid“). Menüüs on „Laienda“, „Kinnita“, „Muuda“ ja „Kustuta“.',
  'help.guide.note-categories.title': 'Märkmete jaotamine kategooriatesse',
  'help.guide.note-categories.result':
    'Märkmetel on uued nimed ja värvid ning kaart „Märkmed“ näitab ainult valitud kategooriat.',
  'help.guide.roadtrip-stops.tip.5':
    'Peatus, millel on päevaplaanis lõpuaeg, kestab selle ajani. Selle dialoog näitab, millal sõit jätkub, ja „Eemalda lõpuaeg“ laseb sul kestuse jälle ise määrata.',
  'help.guide.roadtrip-reorder.tip.2':
    'Broneeritud sõidud ja nende terminalid jäävad sinna, kuhu broneering need paneb; lohistada saab ainult kohti.',
  'help.guide.roadtrip-overnight.step.2':
    'Hotellil on plussi asemel voodiikoon. Klõpsa sellel („Lisa ööbimisena“), et avada öö jaoks „Lisa peatusena“. Telkimisalal on tavaline „Lisa“.',
  'help.guide.roadtrip-stop-fill.goal':
    'Määra ühele tankimis- või laadimispeatusele oma täitmistase, näiteks 80 % kiirlaadijal või 100 % üleöö.',
  'help.guide.roadtrip-bookings.goal': 'Vaata, kuhu broneeritud sõit sõidus sobib ja mis ajaks pead sinna jõudma.',
  'help.guide.roadtrip-bookings.tip.3':
    'Sõit, mis pole ühelgi reisi päeval, ei ole sõidu osa: riba ülaosas olev märkus nimetab selle koos nupuga „Ava broneering“, et sellele kuupäev anda.',
  'help.guide.roadtrip-google-import.step.4':
    'Vali jaotises „Päev“ päev, kuhu peatused lisatakse, seejärel klõpsa „Impordi“.',
  'help.guide.roadtrip-hazards.step.2':
    'Lülita dialoogi parema veeru allosas jaotises „Praegused hoiatused“ sisse „Näita ohualasid“, seejärel klõpsa „Sulge“.',
  'help.ctx.trip-tours.bullet.1':
    'Parema veeru ülaosas olev lüliti „Kohad“ ja „Retked“ asendab kohtade loendi retkedega. See on olemas ainult siis, kui lisamoodul „Retked“ on sees, ja retki ei näidata siis kunagi kohtade loendis.',
  'help.guide.tour-show-list.step.1':
    'Klõpsa vahelehel „Plaan“ parema veeru ülaosas oleval lülitil „Retked“. Veerus on nüüd kohtade asemel retked.',
  'help.guide.tour-show-list.result': 'Paremas veerus on reisi retked ja see, millel klõpsasid, on oma kaardil avatud.',
  'help.guide.tour-add-to-day.tip.1':
    'Etappidega retke lohistamisel päevale küsitakse sama väikeses dialoogis. „Tühista“ jätab plaani endiseks.',
  'help.guide.tour-day-times.step.2':
    'Määra „Algus“ ja jäta „Lõpp“ tühjaks. Väljade all olev rida näitab TREKi arvutatud lõppu: algus pluss retke aeg.',
  'help.guide.tour-remove-from-day.title': 'Retke eemaldamine päevast',
  'help.guide.tour-filter-list.title': 'Retkede loendi filtreerimine',
  'help.guide.tour-filter-list.tip.3':
    'Kui midagi ei jää, teatab loend, et ükski retk ei vasta filtritele, ja „Lähtesta filtrid“ tühjendab kõik filtrid. Filtrid muudavad ainult seda, mida loend näitab, mitte kunagi retke ega päeva.',
  'help.guide.tour-hide-on-map.tip.2':
    'Telefoni kaardil on alati näha kõik retked ja vahelehel „Retked“ silma pole: peitmine töötab siin vahelehel „Plaan“.',
  'help.guide.tour-import-plan-tab.tip.2':
    'Import jääb siin loendisse ega avane planeerijas. Pane see ümmarguse +-iga päevale või ava selle vaatamiseks vaheleht „Retked“.',
  'help.ctx.trip-tour-detail.bullet.5':
    'Kaart on lugemiseks ja retkega seotud asjade jaoks. Marsruuti ennast muudetakse vahelehel „Retked“: ava see ja klõpsa retkel jaotises „Selle reisi retked“. Ka retke kustutatakse seal, mitte siin.',
  'help.guide.tour-detail-read.step.6':
    'Keri edasi jaotisteni „Kirjeldus“ ja „Märkmed“, seejärel „Päritolu“: „Planeeritud rakenduses TREK“, fail, millest see imporditi, või wandereri rada, millest see pärineb, koos kuupäevaga.',
  'help.guide.tour-rename-colour.title': 'Retke ümbernimetamine ja värvi muutmine',
  'help.guide.tour-rename-colour.result': 'Retk on kogu reisis uue nimega ja selle joon on valitud värvis.',
  'help.guide.tour-take-along.tip.3':
    'Fail tuleb serverist, nii et selleks on vaja ühendust. Võrguühenduseta loodud retke saab alla laadida, kui see on sünkroonitud.',
  'help.guide.tour-copy-keep.step.4':
    'Vali jaotises „Kogumik“ nimekiri, kontrolli välja „Nimi kogumikus“ ja klõpsa „Hoia“.',
  'help.guide.tour-packing-link.step.1':
    'Ava retke kaart ja keri jaotiseni „Pakkimisnimekiri“. Klõpsa „Lingi pakkimisnimekiri“.',
  'help.guide.tour-packing-link.result':
    'Oled vahelehel „Nimekirjad“ pakkimisnimekirjas ja retke kaart näitab iga eset, mille märgid.',
  'help.guide.tour-files.result': 'Failid on retkele lisatud ja avanevad selle kaardilt.',
  'help.guide.tour-activity-link.tip.1':
    'Plaan jääb samaks. Rada on ainult seotud ja „Eemalda seos“ eemaldab seose uuesti.',
  'help.guide.tour-activity-compare.step.3':
    'Klõpsa „Võrdle kaardil“, et joonistada tegelik rada plaani kõrvale punktiirjoonena. „Lõpeta võrdlus“ eemaldab selle uuesti.',
  'help.guide.tour-origin-check.step.2':
    '„Imporditud“ näitab importimise päeva. „Siin“ näitab praegust seisu: „Nagu imporditud“, „Muudetud TREKis“ või „Ümber planeeritud, salvestatud rada alles“.',
  'help.ctx.trip-tour-planner.bullet.1':
    'Kui lisamoodul „Retked“ on sees, on „Retked“ reisi vahelehtede ribal kohe pärast „Plaani“. Vaheleht on olemas arvutis ja tahvelarvutis; telefonis saab retki vaadata ja päevadele panna vahelehel „Plaan“, kuid mitte joonistada.',
  'help.guide.tour-open-workspace.step.1':
    'Klõpsa reisi vahelehtede ribal kohe pärast „Plaani“ oleval vahelehel „Retked“. Kaart täidab ekraani ja mõlemal küljel on riba.',
  'help.guide.tour-open-workspace.tip.2':
    'Lohista GPX-, KML- või KMZ-faile ükskõik kuhu sellel vahelehel, et importida need reisi retkedena.',
  'help.guide.tour-draw-route.step.4':
    'Kaardi allosas ilmub „Punkt lisatud“. Selle kõrval olev „Võta tagasi“ eemaldab punkti uuesti.',
  'help.guide.tour-type-profile.title': 'Retke tüübi valimine',
  'help.guide.tour-type-profile.result': 'Retke marsruut on arvutatud valitud tüübi ja profiili järgi.',
  'help.guide.tour-edit-points.step.6':
    'Riba päises olevad „Võta teekonnapunkti muudatus tagasi“ ja „Tee teekonnapunkti muudatus uuesti“ tühistavad või kordavad iga muudatuse ükshaaval.',
  'help.guide.tour-shaping-points.step.3':
    'Jaotises „Teekonnapunktid“ on see märgiga „Kujunduspunkt“ ja ilma numbrita, nii et peatuste numbrid jäävad samaks.',
  'help.guide.tour-loop-reverse.step.1':
    'Klõpsa kaardi „Teekonnapunktid“ päises „Tagasi algusesse“. Retkele lisandub viimane lõik tagasi esimese punktini.',
  'help.guide.tour-leg-by-hand.goal':
    'Ühenda kaks punkti sirgjoonega seal, kus marsruudiplaneerija teed ei leia, või planeeri lõik uuesti.',
  'help.guide.tour-trip-places.title': 'Reisi koha kasutamine peatusena',
  'help.guide.tour-trip-places.tip.3': 'Reisi teisi retki ei pakuta kunagi peatuseks.',
  'help.guide.tour-details-times.tip.1': 'Aegu võib sisestada kujul 2:56, 2 h 56 või 176 minutit.',
  'help.guide.tour-save.step.3':
    'Klõpsa vasaku riba allosas „Salvesta“. Ilmub teade „Retk salvestatud“ ja riba pealkiri muutub „Muuda retke“.',
  'help.guide.tour-edit-saved.step.1':
    'Klõpsa retkel jaotises „Selle reisi retked“. See avaneb vasakul ribal kui „Muuda retke“ ja kaart näitab selle marsruuti.',
  'help.guide.tour-summary-profile.title': 'Retke kokkuvõtte ja kõrgusprofiili lugemine',
  'help.guide.tour-summary-profile.tip.3':
    'Aerutamisretkel kõrgusi ei näidata, sest vee peal oleksid saadaval ainult kallaste kõrgused.',
  'help.guide.tour-list-manage.step.5':
    'Vali „Planeerimata“ retkede jaoks, mis pole veel ühelgi päeval, või kitsenda valikutega „Allikas“, „Marsruudi piir“ või „Tüüp“. Iga rea juures on näha, mitu retke sobib, ja kogusummad järgivad filtrit.',
  'help.guide.tour-delete.step.2':
    'Loe, mis koos retkega kustutatakse: marsruut, muudetavad teekonnapunktid ja päevadele määramised. Klõpsa „Kustuta jäädavalt“.',
  'help.guide.tour-saved-elsewhere.step.2': '„Laadi uuem“ asendab pärast kinnitust sinu muudatused uuema versiooniga.',
  'help.ctx.trip-tour-import.bullet.1':
    'Jaotise „Selle reisi retked“ ülaosas olev + on „Lisa matk“. See pakub valikuid „Impordi GPX või KML“, „Impordi jalutuskäik Google Mapsist“ ja „Võta matk üle teiselt reisilt“. Faile saab lohistada ka ükskõik kuhu vahelehel „Retked“.',
  'help.guide.tour-import-gpx.step.2':
    'Vali „Impordi GPX või KML“ ja vali üks või mitu .gpx-, .kml- või .kmz-faili, igaüks kuni 10 MB.',
  'help.guide.tour-import-gpx.tip.5':
    'Kõrgusteta faili puhul on kirjas „Failis pole kõrgusi“. Joon ja vahemaa on siiski õiged, kuid tõus ja laskumine jäävad teadmata.',
  'help.guide.tour-view-import.tip.2':
    'Päises olev allalaadimisikoon salvestab selle uuesti GPX-failina ja järjehoidja salvestab selle kogumikku.',
  'help.guide.tour-plan-from-import.step.4':
    'Retk avaneb redaktoris koos teekonnapunktidega. Muuda seda soovi korral, seejärel klõpsa veeru allosas „Salvesta“.',
  'help.guide.tour-restore-recorded.step.1':
    'Klõpsa jaotises „Selle reisi retked“ retkel, mille ümber planeerisid. Redaktoris olev kaart „Salvestatud rada“ ütleb, et algne salvestatud rada on säilitatud.',
  'help.guide.tour-take-over.step.1':
    'Ava selle reisi vaheleht „Retked“, kuhu retk peab minema. Klõpsa jaotise „Selle reisi retked“ ülaosas +-il („Lisa matk“).',
  'help.guide.tour-take-over.tip.3':
    'Retke ülevõtmiseks on vaja ühendust. Kui redaktoris on salvestamata muudatusi, lisatakse koopia siiski loendisse, kuid seda ei avata, nii et sinu töö jääb avatuks.',
  'help.guide.tour-import-wanderer.tip.1':
    'Nupp on olemas siis, kui wanderer on jaotises „Seaded“, „Integratsioonid“ ühendatud. Enne seda pakub loend valikut „Ühenda seadetes“.',
  'help.ctx.trip-tour-map.bullet.2':
    'Sildil eraldaja järel on retke tüübi lülitid: retke muutmise ajal „Lisa punkte“, matkal „Via ferrata rajad“, aerutamisretkel „Navigatsioonimärgid“ ja suusaretkel nõlvad. Lõpus olev 3D näitab retke kolmemõõtmelisel maastikul.',
  'help.guide.tour-map-layers.step.3':
    'Matkal klõpsa „Matkamine“, et näha tähistatud radu ja nende numbreid; rattaretkel on selle asemel rattateede jaoks „Jalgratas“. „Satelliit“ näitab aerofotosid ja „Kaart“ viib tagasi tavakaardile.',
  'help.guide.tour-along-search.step.2':
    'Klõpsa „Mida otsida“ ja märgi soovitud liigid, korraga kuni kuus: „Vaatekohad“, „Tipud“, „Onnid ja varjualused“, „Joogivesi“, „Toit“ ja muud. Loendis on retke tüübile sobivad liigid ja alguses on neist kolm märgitud.',
  'help.guide.tour-along-add-stop.title': 'Retke äärse koha lisamine peatusena',
  'help.guide.tour-along-add-stop.tip.2':
    'Koht, mis saab uueks lõpuks, on märgitud „Pikendab matka“: vana lõpp pole enam lõpp ja retk jätkub selle kohani.',
  'help.guide.tour-3d-terrain.step.5': 'Klõpsa uuesti „3D“, et naasta tasasele kaardile ja jätkata planeerimist.',
  'help.guide.tour-3d-flyover.step.2':
    'Vali jaotises „Kiirus“ 1×, 2× või 4×. Kiirusel 1× kestab enamiku retkede ülelend algusest lõpuni umbes 45 sekundit.',
  'help.guide.tour-map-overlays.goal':
    'Näita suusa- või aerutamisretke planeerimisel kaardil suusanõlvu ja tõstukeid või poisid ja sadamamärke.',
  'help.guide.tour-map-overlays.tip.3':
    'Kui kiht lakkab laadimast, on selle lülitil ! ja selgitus; kaart ja sinu marsruut töötavad ka ilma selleta.',
  'help.guide.tour-multi-day.title': 'Retke planeerimine mitmeks päevaks',
  'help.guide.tour-multi-day.tip.1':
    '„Lõpeta etapp siin“ töötab ka ühepäevasel retkel: retk muutub siis automaatselt mitmepäevaseks. Esimene ja viimane peatus ning kujunduspunkt ei saa etappi lõpetada.',
  'help.guide.tour-stages-on-days.step.2': 'Vali päev, mil alustad esimest etappi.',
  'help.guide.tour-stages-on-days.tip.4':
    'Päevaplaanis on iga etapp kujul „Etapp N“ oma vahemaa ja ajaga. Vahelehel „Plaan“ päevade kohal olev „Võta tagasi“ tühistab kogu jaotuse ühe sammuga.',
  'help.ctx.trip-tour-hike.bullet.5':
    'Matkal näitab all vasakul olevas kaardinuppude reas olev „Via ferrata rajad“ lähedal olevaid via ferrata radu. Via ferrata kaart lisab selle marsruudile eraldi lõiguna.',
  'help.guide.tour-hike-plan.step.5':
    'Ava jaotises „Üksikasjad“ „Raja suurim raskusaste“ ja vali, kui raskeks rajad võivad minna, alates T1 („Matkamine“) kuni T6 („Raske alpimatkamine“). Marsruut planeeritakse selle piires uuesti.',
  'help.guide.tour-hike-trail-details.goal':
    'Vaata, mida OpenStreetMap matka teede kohta teab, ja leia need lõigud kaardilt.',
  'help.guide.tour-hike-trail-details.tip.2': 'Kui raskusaste on matka piirist kõrgem, on selle real märk „Üle piiri“.',
  'help.guide.tour-hike-round.step.5':
    'Klõpsa „Vali see ring“, seejärel „Asenda“, kui küsitakse, kas planeeritud marsruut asendada.',
  'help.guide.tour-hike-compare-ways.step.2':
    'Kaardi peal avaneb „Teised teed selle lõigu jaoks“ valikutega „Praegune tee“ ning tee A, tee B jne. Iga tee on kaardil oma värvis ja kursori viimine reale tõstab selle joone esile.',
  'help.guide.tour-ferrata-add.goal': 'Leia oma matka lähedalt via ferrata rajad ja tee üks neist marsruudi osaks.',
  'help.guide.tour-ferrata-add.tip.2':
    'Via ferrata radu pakutakse ainult matkadel. Kui marsruut juba läbib via ferratat, on selle kaardil „Lisa matkale“ asemel „Matka osa“.',
  'help.guide.tour-run-plan.step.4':
    'Määra algus ja lõpp kaardil või vali need nupuga „Reisi kohad“. Tempo all on näha jooksuaeg: vahemaa korda tempo.',
  'help.guide.tour-run-ways.goal': 'Kontrolli, kui suur osa jooksust on katteta ja kui raskeks selle rajad lähevad.',
  'help.ctx.trip-tour-walk.summary':
    'Vahelehel „Retked“ planeeritud jalgsi retk peatusest peatuseni: kui kaua igas peatuses viibid, millised neist on olulised, vaatamisväärsused teel ning millal jalutuskäigu päeval igasse peatusesse jõuad, võrrelduna lahtiolekuaegadega.',
  'help.guide.tour-walk-plan.step.1':
    'Klõpsa vasaku veeru ülaosas „Planeeri uus retk“, seejärel ava „Matka tüüp“ ja vali „Linna- / vaatamisväärsuste jalutuskäik“.',
  'help.guide.tour-walk-plan.tip.3':
    'Peatuse menüüs „Rohkem toiminguid“ olev „Eemalda seos kohaga“ eemaldab ainult seose reisi kohaga. Koht ise jääb reisi.',
  'help.guide.tour-walk-sights.step.5':
    'Klõpsa „Lisa peatusena“. Teade näitab, kui palju pikemaks jalutuskäik muutub, ja selle kõrval on „Võta tagasi“.',
  'help.guide.tour-walk-day-times.step.2':
    'Anna jalutuskäigule sellel päeval algusaeg: tee vahelehel „Plaan“ päevas jalutuskäigul paremklõps, vali „Muuda“ ja sisesta „Algus“.',
  'help.guide.tour-walk-google-import.title': 'Google Mapsi jalgsimarsruudist linnajalutuskäigu tegemine',
  'help.guide.tour-walk-google-import.tip.3':
    'Üle võetakse ainult peatused, mitte Google Mapsis joonistatud joon. Lühikese maps.app.goo.gl lingi avamiseks on vaja ühendust.',
  'help.guide.tour-walk-check-off.tip.1':
    'Märked salvestatakse päeva kaupa: ava jalutuskäik plaanis selle päeva alt, mitte retkede loendist.',
  'help.ctx.trip-tour-bike.bullet.3':
    'Jaotise „Teekonnapunktid“ all olev kaart „Kate ja teed“ näitab marsruudi pinnast: katteid, teede liike ja teadaolevalt katteta osa. Klõpsa real, et selle lõigud kaardil esile tõsta.',
  'help.guide.tour-bike-profile.step.5':
    'Vaata paremal jaotises „Retke kokkuvõte“ väärtust „Sõiduaeg (hinnanguline)“. Vii kursor selle infotäpile, et näha, kuidas see arvutatakse.',
  'help.guide.tour-bike-surfaces.title': 'Rattaretke katete vaatamine',
  'help.guide.tour-bike-surfaces.tip.2':
    'Profiili „Maantee“ puhul on ribade kohal hoiatus, mis ütleb, kui pikk lõik on teadaolevalt katteta. „Näita kaardil“ märgib need lõigud.',
  'help.guide.tour-bike-mtb-grades.result':
    'Kaart märgib valitud raskusastmega rajad ja tead, millised retke lõigud on rasked.',
  'help.ctx.trip-tour-ski.bullet.2':
    'Ala all on nõlvade marsruudiplaneerija valikud, ainult need, mida sinu ala kasutab: „Raskeimad nõlvad“, „Eelista“, „Tempo“, lülitid nagu „Kasuta tõstukeid“ ning „Jäta välja“ tõstukiliikide jaoks, millega sa sõita ei taha. Iga muudatus planeerib retke uuesti.',
  'help.guide.tour-ski-plan.step.3':
    'Vali jaotises „Ala“, mida teed: „Mäesuusatamine“, „Lumelaud“, „Murdmaasuusatamine“, „Matkasuusatamine“, „Räätsamatk“ või „Talvematk“. Midagi pole eelvalitud ja ilma alata ei saa retke salvestada.',
  'help.guide.tour-ski-plan.result':
    'Jaotises „Selle reisi retked“ on salvestatud „Suusad ja talv“ tüüpi retk, mille lõigud järgivad kaardistatud nõlvu, tõstukeid ja radu ning mille aeg on arvutatud jaotises „Retke kokkuvõte“.',
  'help.guide.tour-ski-options.tip.1': 'Iga muudatus planeerib retke lõik-lõigu haaval uuesti.',
  'help.guide.tour-ski-fix-leg.step.3':
    'Kui ükski parandus ei sobi, klõpsa „Joonista sirgelt“. Lõik muutub kahe punkti vaheliseks sirgjooneks.',
  'help.guide.tour-ski-summary.step.1':
    'Leia teekonnapunktide alt kaart „Nõlvamarsruut“. Klõpsa selle pealkirjal, et see kokku panna või uuesti avada.',
  'help.guide.tour-ski-pistes-layer.title': 'Nõlvade näitamine kaardil',
  'help.guide.tour-ski-pistes-layer.result': 'Nõlvad on joonistatud retke alla ja saad nende värve lugeda.',
  'help.guide.tour-ski-import.step.6': 'Vali jaotises „Liigita suusarada“ õige ala või tehnika ja klõpsa „Salvesta“.',
  'help.ctx.trip-tour-paddle.bullet.2':
    'Iga punkti roll on näha märgina: „Vetteminek“, „Väljumine“, „Tagasi vette“ või „Lõplik väljumine“. Punkti all on näha, mis sellele järgneb: käsitsi joonistatud lõik, ülekanne, lüüs või põhjus, miks lõiku ei saanud planeerida.',
  'help.guide.tour-paddle-setup.step.2':
    'Ava „Matka tüüp“ ja vali „Aerutamismatk“ („Vee peal, süsta, kanuu või SUP-iga“).',
  'help.guide.tour-paddle-setup.tip.3':
    'Aerutamisretkel otsib „Matka ääres“ kõigepealt „Vettelaskmiskohad“, „Paadilaenutus“ ja „Joogivesi“.',
  'help.guide.tour-paddle-water-route.step.4':
    'Lõik, mida TREK ei suutnud planeerida, muutub punaseks ja näitab põhjust, näiteks et piirkonna kohta pole veel veeandmeid. Klõpsa „Joonista sirgelt“, et see esialgu käsitsi joonistada.',
  'help.guide.tour-paddle-portage.goal':
    'Märgi lõik, kus paati kannad, nii et seda arvestatakse maismaana koos paadist väljumise ja tagasi vette mineku ajaga.',
  'help.guide.tour-paddle-portage.tip.3':
    'Kandmist arvestatakse kiirusega 2 km/h, kuni määrad kaardil „Ajahinnang“ oma „Kandmiskiirus“.',
  'help.guide.tour-paddle-lock.tip.1':
    'TREK ei tea lüüside sõiduplaane. Ajad on ainult need, mille sisestad, nii et kontrolli lüüsi tööaegu ise.',
  'help.guide.tour-paddle-time.step.3':
    'Rida „Vee peal“ on vee peal läbitav vahemaa sinu aerutamiskiirusega. Muuda kiirust veeru ülaosas väljal „Aerutamiskiirus“.',
  'help.guide.tour-paddle-wind.goal': 'Vaata aerutamispäeval retke alguspunkti tuuleprognoosi.',
  'help.guide.tour-paddle-wind.tip.4': 'Prognoosi puudumine ei tähenda, et on ohutu. Kontrolli olusid kohapeal.',
  'help.guide.tour-paddle-checklist.step.5':
    'Klõpsa veeru allosas „Aerutamisel on riske“, et lugeda enne teeleasumist lehte „Ohutus vee peal“.',
  'help.guide.tour-paddle-track-marks.goal':
    'Impordi oma kellast aerutamisrada ja lisa kohad, kus kandsid paati ja kus läbisid lüüsi.',
  'help.guide.tour-paddle-track-marks.tip.1':
    'Klõpsa täpselt rajal: joonest liiga kaugel tehtud klõpsu ei aktsepteerita ja kaart annab sellest teada.',
  'help.ctx.trip-tour-horse.bullet.3':
    'Iga lõik on kaardil „Teekonnapunktid“ märk marsruudi nime, juurdepääsu täpi ja pikkusega. Lõigul, mida ükski ratsatee ei kata, on kirjas „Käsitsi, kontrollimata“.',
  'help.guide.tour-horse-plan.step.4':
    'Klõpsa loendis marsruudil. See avaneb eraldi kaardil, kus lõigud on nummerdatud.',
  'help.guide.tour-horse-plan.tip.4':
    'Vasaku veeru päises olev „Võta teekonnapunkti muudatus tagasi“ tühistab terve lõigu ühe sammuga.',
  'help.guide.tour-horse-gap.result': 'Ratsamatkal pole enam lünka ja ühendatud lõik on märgitud käsitsi joonistatuks.',
  'help.guide.tour-horse-recorded.step.3': 'Klõpsa „Impordi 1 retk“.',
  'help.guide.dissolve-fusion.step.3': 'Kinnita avanevas aknas nupuga „Lahuta“.',
};

export default help;
