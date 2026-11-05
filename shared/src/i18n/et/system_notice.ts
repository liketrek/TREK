import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'Fotod on versioonis 3.0 kolinud',
  'system_notice.v3_photos.body':
    'Reisiplaneerija **Fotod** on eemaldatud. Sinu fotod on alles — TREK ei muutnud kunagi sinu Immichi või Synology kogu.\n\nFotod asuvad nüüd lisamoodulis **Reisilugu**. See on valikuline — kui see pole veel saadaval, palu administraatoril see lubada jaotises Haldus → Lisamoodulid.',
  'system_notice.v3_journey.title': 'Tutvu reisipäevikuga',
  'system_notice.v3_journey.body':
    'Jäädvusta oma reisid lugudena koos ajajoonte, fotogaleriide ja interaktiivsete kaartidega.',
  'system_notice.v3_journey.cta_label': 'Ava reisilood',
  'system_notice.v3_journey.highlight_timeline': 'Päevade kaupa ajajoon ja galerii',
  'system_notice.v3_journey.highlight_photos': 'Import Immichist või Synologyst',
  'system_notice.v3_journey.highlight_share': 'Jaga avalikult — sisselogimine pole vajalik',
  'system_notice.v3_journey.highlight_export': 'Ekspordi PDF-fotoraamatuna',
  'system_notice.v3_features.title': 'Veel uuendusi versioonis 3.0',
  'system_notice.v3_features.body': 'Veel mõned asjad, mida selle väljalaske kohta teada.',
  'system_notice.v3_features.highlight_dashboard': 'Uus, mobiilile kohandatud avaleht',
  'system_notice.v3_features.highlight_offline': 'Täielik võrguühenduseta režiim PWA-na',
  'system_notice.v3_features.highlight_search': 'Reaalajas automaattäide kohaotsingus',
  'system_notice.v3_features.highlight_import': 'Kohtade import KMZ/KML-failidest',
  'system_notice.v3_mcp.title': 'MCP: uuendus OAuth 2.1-le',
  'system_notice.v3_mcp.body':
    'MCP-liidestus on täielikult uuendatud. Soovitatav autentimisviis on nüüd OAuth 2.1. Vanad staatilised pääsmed (trek_…) on aegunud ja eemaldatakse tulevases versioonis.',
  'system_notice.v3_mcp.highlight_oauth': 'Soovitatav on OAuth 2.1 (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 üksikasjalikku õiguste ulatust',
  'system_notice.v3_mcp.highlight_deprecated': 'Staatilised trek_-pääsmed on aegunud',
  'system_notice.v3_mcp.highlight_tools': 'Laiendatud tööriistad ja viibad',
  'system_notice.v3_thankyou.title': 'Isiklik sõnum minult',
  'system_notice.v3_thankyou.body':
    'Enne kui lähed, tahaksin korraks peatuda.\n\nTREK sai alguse kõrvalprojektina minu enda reiside jaoks. Ma ei osanud kujutleda, et sellest saab midagi, mida 4000 teist nüüd oma seikluste planeerimiseks usaldab. Iga täht, iga veateade, iga funktsioonisoov — loen neid kõiki ja need annavad mulle jõudu täiskohaga töö ja ülikooli kõrvalt hilisõhtuti jätkata.\n\nTahan, et teaksid: TREK jääb alati avatud lähtekoodiga, ise majutatavaks ja sinu omaks. Ei jälgimist, tellimusi ega varjatud tingimusi. Lihtsalt tööriist inimeselt, kes armastab reisimist sama palju kui sina.\n\nEriline tänu kasutajale [jubnl](https://github.com/jubnl) — sinust on saanud suurepärane kaasautor. Nii paljus selles, mis teeb versiooni 3.0 heaks, on sinu käekiri. Aitäh, et uskusid projekti juba siis, kui see oli veel konarlik.\n\nJa kõigile, kes teatasid veast, tõlkisid teksti, jagasid TREKi sõbraga või lihtsalt kasutasid seda reisi planeerimiseks — **aitäh**. Tänu teile on see olemas.\n\nPalju uusi ühiseid seiklusi!\n\n— Maurice\n\n---\n\n[Liitu kogukonnaga Discordis](https://discord.gg/7Q6M6jDwzf)\n\nKui TREK teeb sinu reisid paremaks, aitab [väike kohv](https://ko-fi.com/mauriceboe) arendusel jätkuda.',
  'system_notice.v3014_whitespace_collision.title': 'Vajalik toiming: kasutajakontode konflikt',
  'system_notice.v3014_whitespace_collision.body':
    'Versioonile 3.0.14 uuendamine tuvastas salvestatud kontode alguses või lõpus olevatest tühikutest põhjustatud kasutajanimede või e-posti aadresside kattuvusi. Mõjutatud kontod nimetati automaatselt ümber. Ülevaatamist vajavate kontode leidmiseks otsi serveri logist ridu, mis algavad tekstiga **[migration] WHITESPACE COLLISION**.',
  'system_notice.welcome_v1.title': 'Tere tulemast TREKi',
  'system_notice.welcome_v1.body':
    'Sinu terviklik reisiplaneerija. Koosta reisiplaane, jaga reise sõpradega ja hoia kõik korras — nii võrgus kui ka võrguühenduseta.',
  'system_notice.welcome_v1.cta_label': 'Planeeri reis',
  'system_notice.welcome_v1.hero_alt': 'Maaliline reisisihtkoht TREKi planeerimisvaatega',
  'system_notice.welcome_v1.highlight_plan': 'Päevaplaanid igaks reisiks',
  'system_notice.welcome_v1.highlight_share': 'Tee reisikaaslastega koostööd',
  'system_notice.welcome_v1.highlight_offline': 'Töötab mobiilis võrguühenduseta',
  'system_notice.dev_test_modal.title': '[Dev] Testteade',
  'system_notice.dev_test_modal.body': 'See on ainult arenduskeskkonna testteade.',
  // Thank-you + support the project (shown once per install and once per upgrade)
  'system_notice.thank_you_support.title': 'Aitäh, et kasutad TREKi',
  'system_notice.thank_you_support.body':
    'Aitäh TREKi paigaldamise eest — see tähendab mulle tõesti palju.\n\nOlen üksikarendaja ja teen TREKi vabal ajal. See algas väikese tööriistana minu enda reiside jaoks ning kogukonna toetus ja huvi on mind siiralt üllatanud. Panen TREKi palju südant, kuid seda on kujundanud ka paljud suurepärased välised kaasautorid.\n\n**TREK on avatud lähtekoodiga ja täiesti tasuta — ning jääb selleks igavesti. Ei tasulisi pakette, tellimusi ega varjatud tingimusi. Luban seda.**\n\nKui TREK on sulle kasulik ja soovid selle arendust toetada, aitab väike kohv mul edasi arendada — täiesti vabatahtlikult, kuid iga tass annab hilisõhtuteks jõudu.\n\nAitäh, et oled siin.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% avatud lähtekood GitHubis',
  'system_notice.thank_you_support.highlight_free': 'Igavesti tasuta — tasulisi pakette ei tule',
  'system_notice.thank_you_support.highlight_community': 'Loodud koos kogukonnaga',
  'system_notice.thank_you_support.cta_bmc': 'Osta mulle kohv',
  'system_notice.thank_you_support.cta_kofi': 'Toeta Ko-fi kaudu',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Uuendus paigaldatud',
  'system_notice.release_notes.headline': 'Õige koht, kõige ees.',
  'system_notice.release_notes.intro':
    'Kohaotsing, aadressiotsing ja teekonnad töötavad nüüd TREKi enda serverites, mida toetab dataforest cloud, ja iga TREK saab jagada oma teadmisi kohtade kohta kõigi teistega.',
  'system_notice.release_notes.features_label': 'Peamised uuendused',
  'system_notice.release_notes.features_aside': 'See pole kaugeltki kõik',
  'system_notice.release_notes.feature_search_title': 'Kohaotsing, mis tabab täppi',
  'system_notice.release_notes.feature_search_body':
    'Linnad, saared, vaatamisväärsused ja koodi järgi otsitud lennujaamad tulevad esimesena, kohvikud leitakse sinu lähedusest ja soovitused ilmuvad juba kirjutamise ajal.',
  'system_notice.release_notes.feature_share_title': 'Jagatud kohaandmed',
  'system_notice.release_notes.feature_share_body':
    'Jaga veebilehti, lahtiolekuaegu ja fotosid iga TREKiga, välja kaupa, ja sinu salvestatud kohad saavad juurde selle, mida teised lisasid.',
  'system_notice.release_notes.feature_routing_title': 'Kiiremad teekonnad',
  'system_notice.release_notes.feature_routing_body':
    'Terve päeva teekond arvutatakse korraga kuni kahekümne peatusega, üks aeglane teekond ei pidurda enam teisi ja ühistranspordi puhul küsitakse teiselt teenusepakkujalt, kui esimene midagi ei leia.',
  'system_notice.release_notes.footnote': 'Lisaks pikk loend väiksemaid muudatusi mujal TREKis.',
  'system_notice.release_notes.notes_label': 'Väljalaskemärkmed',
  'system_notice.release_notes.note_eyebrow': 'Sõnum hooldajalt',
  'system_notice.release_notes.note_title': 'Sina oled põhjus, miks ma TREKi arendamist jätkan.',
  'system_notice.release_notes.note_body':
    'TREK algas väikese tööriistana minu enda reiside jaoks. Kirjutasin seda pärast tööd, sest tahtsin paremat viisi reise planeerida. See polegi õieti lakanud kasvamast. Peaaegu kõik, mida kasutad, on loodud hilisõhtuti, nädalavahetustel ja rongides täiskohaga töö kõrvalt. Paljudel õhtutel mõtlesin vaikselt, kas keegi selle kunagi avab.',
  'system_notice.release_notes.promise_label': 'Lubadus',
  'system_notice.release_notes.promise_lead': 'TREK jääb igavesti tasuta.',
  'system_notice.release_notes.promise_text':
    'Iga funktsioon ja iga uuendus kõigile. Ei tasulisi pakette, tellimusi ega varjatud tingimusi.',
  'system_notice.release_notes.note_body_after':
    'Ja siis te avasitegi. Mõne kuuga oli teid tuhandeid: tähed, veateated, tõlked keeltesse, mida ma ei räägi, ja kooditäiendused inimestelt, keda ma pole kunagi kohanud. Vaatan ikka igal hommikul esimese asjana koodihoidlat ja see tundub endiselt veidi uskumatu.',
  'system_notice.release_notes.note_closing': 'Aitäh, et oled siin. Maurice.',
  'system_notice.release_notes.support_label': 'Jääme sõltumatuks',
  'system_notice.release_notes.support_lead': "Ilma Google'i ja teisteta.",
  'system_notice.release_notes.support_text':
    'Kohaotsing, aadressiotsing ja teekonnad töötavad TREKi enda serverites, mida täna toetab dataforest cloud. Võitlen selle eest iga päev ja et see nii jääks, vajan sinu tuge.',
  'system_notice.release_notes.cta_bmc': 'Osta mulle kohv',
  'system_notice.release_notes.cta_kofi': 'Toeta Ko-fi kaudu',
  'system_notice.pager.prev': 'Eelmine teade',
  'system_notice.pager.next': 'Järgmine teade',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Ava teade {n}',
  'system_notice.pager.position': 'Teade {current} / {total}',
};
export default system_notice;
