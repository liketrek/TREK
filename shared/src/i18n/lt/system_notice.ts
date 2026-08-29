import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'Nuotraukos perkeltos 3.0 versijoje',
  'system_notice.v3_photos.body':
    '**Nuotraukų** skiltis Kelionės planuoklyje buvo pašalinta. Jūsų nuotraukos saugios — TREK niekada nekeitė jūsų Immich ar Synology bibliotekos.\n\nDabar nuotraukos yra **Kelionių žurnalo** priede. Kelionių žurnalas yra nebūtinas — jei jo dar nėra, paprašykite administratoriaus jį įjungti skiltyje Administravimas → Priedai.',
  'system_notice.v3_journey.title': 'Pristatome Kelionių žurnalą',
  'system_notice.v3_journey.body':
    'Fiksuokite savo keliones kaip išsamius kelionių pasakojimus su chronologijomis, nuotraukų galerijomis ir interaktyviais žemėlapiais.',
  'system_notice.v3_journey.cta_label': 'Atverti Kelionių žurnalą',
  'system_notice.v3_journey.highlight_timeline': 'Dienų chronologija ir galerija',
  'system_notice.v3_journey.highlight_photos': 'Importuokite iš Immich ar Synology',
  'system_notice.v3_journey.highlight_share': 'Dalinkitės viešai — prisijungti nereikia',
  'system_notice.v3_journey.highlight_export': 'Eksportuokite kaip PDF fotoknygą',
  'system_notice.v3_features.title': 'Daugiau naujienų 3.0 versijoje',
  'system_notice.v3_features.body': 'Dar kelios svarbios naujienos apie šią versiją.',
  'system_notice.v3_features.highlight_dashboard': 'Iš naujo sukurtas skydelis, pritaikytas pirmiausia telefonams',
  'system_notice.v3_features.highlight_offline': 'Visavertis neprisijungimo režimas kaip PWA programa',
  'system_notice.v3_features.highlight_search': 'Vietų paieškos automatinis pildymas realiu laiku',
  'system_notice.v3_features.highlight_import': 'Importuokite vietas iš KMZ/KML failų',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1 atnaujinimas',
  'system_notice.v3_mcp.body':
    'MCP integracija buvo visiškai perdaryta. OAuth 2.1 dabar yra rekomenduojamas tapatybės nustatymo būdas. Senieji statiniai raktai (trek_…) nebenaudojami ir bus pašalinti būsimoje versijoje.',
  'system_notice.v3_mcp.highlight_oauth': 'Rekomenduojamas OAuth 2.1 (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 detalios leidimų apimtys',
  'system_notice.v3_mcp.highlight_deprecated': 'Statiniai trek_ raktai nebenaudojami',
  'system_notice.v3_mcp.highlight_tools': 'Išplėstas įrankių ir užklausų rinkinys',
  'system_notice.v3_thankyou.title': 'Asmeninė žinutė nuo manęs',
  'system_notice.v3_thankyou.body':
    "Prieš išeidami — noriu stabtelėti akimirkai.\n\nTREK prasidėjo kaip šalutinis projektas, kurį sukūriau savo pačių kelionėms. Niekada neįsivaizdavau, kad jis išaugs į kažką, kuo pasitiki 4000 jūsų, planuodami savo nuotykius. Kiekviena žvaigždutė, kiekvienas pranešimas apie klaidą, kiekvienas funkcijos pasiūlymas — visus juos perskaitau, ir jie padeda man ištverti vėlyvus vakarus tarp visos darbo dienos ir universiteto.\n\nNoriu, kad žinotumėte: TREK visada bus atviro kodo, visada savarankiškai talpinamas, visada jūsų. Jokio sekimo, jokių prenumeratų, jokių paslėptų sąlygų. Tiesiog įrankis, sukurtas žmogaus, kuris mėgsta keliauti taip pat, kaip ir jūs.\n\nYpatinga padėka [jubnl](https://github.com/jubnl) — jūs tapote nuostabiu bendradarbiu. Daugelis dalykų, dėl kurių 3.0 versija tokia gera, neša jūsų pėdsaką. Ačiū, kad tikėjote šiuo projektu, kai jis dar buvo neapdorotas.\n\nIr kiekvienam iš jūsų, kas pranešė apie klaidą, išvertė eilutę, pasidalino TREK su draugu ar tiesiog naudojo jį kelionei planuoti — **ačiū**. Jūs esate priežastis, kodėl tai egzistuoja.\n\nUž dar daugybę nuotykių kartu.\n\n— Maurice\n\n---\n\n[Prisijunkite prie bendruomenės Discord](https://discord.gg/7Q6M6jDwzf)\n\nJei TREK daro jūsų keliones geresnes, [nedidelė kava](https://ko-fi.com/mauriceboe) visada padeda išlaikyti viską veikiančią.",
  'system_notice.v3014_whitespace_collision.title': 'Reikalingas veiksmas: naudotojo paskyros konfliktas',
  'system_notice.v3014_whitespace_collision.body':
    'Atnaujinimas į 3.0.14 aptiko vieną ar kelis naudotojo vardo ar el. pašto konfliktus, atsiradusius dėl tarpų prieš ar po reikšmės saugomose paskyrose. Paveiktos paskyros buvo pervadintos automatiškai. Peržiūrėkite serverio žurnalus ir raskite eilutes, prasidedančias **[migration] WHITESPACE COLLISION**, kad nustatytumėte, kurias paskyras reikia patikrinti.',
  'system_notice.welcome_v1.title': 'Sveiki atvykę į TREK',
  'system_notice.welcome_v1.body':
    'Jūsų visapusiškas kelionių planuoklis. Kurkite maršrutus, dalinkitės kelionėmis su draugais ir išlikite susitvarkę — prisijungę ar neprisijungę.',
  'system_notice.welcome_v1.cta_label': 'Planuoti kelionę',
  'system_notice.welcome_v1.hero_alt': 'Vaizdinga kelionės kryptis su TREK planavimo sąsaja',
  'system_notice.welcome_v1.highlight_plan': 'Dienų maršrutai bet kokiai kelionei',
  'system_notice.welcome_v1.highlight_share': 'Bendradarbiaukite su kelionės draugais',
  'system_notice.welcome_v1.highlight_offline': 'Veikia neprisijungus telefone',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  // Thank-you + support the project (shown once per install and once per upgrade)
  'system_notice.thank_you_support.title': 'Ačiū, kad naudojatės TREK',
  'system_notice.thank_you_support.body':
    "Trumpas ačiū, kad įsidiegėte TREK — man tai tikrai daug reiškia.\n\nEsu vienas kuriantis programuotojas ir kuriu TREK laisvalaikiu. Viskas prasidėjo kaip mažas įrankis vien tik savo kelionėms, ir nuoširdžiai esu sužavėtas bendruomenės palaikymo ir susidomėjimo nuo tada. TREK sukurtas su didele meile iš mano pusės — bet taip pat dėka daugybės nuostabių išorinių prisidėjusiųjų, padėjusių jį formuoti.\n\n**TREK yra atviro kodo ir visiškai nemokamas — ir toks liks visada. Jokių mokamų planų, jokių prenumeratų, jokių paslėptų sąlygų. Pažadu.**\n\nJei TREK jums naudingas ir norėtumėte paremti jo kūrimą, nedidelė kava tikrai padeda man toliau kurti — jokio spaudimo, bet kiekvienas puodelis padeda ištverti vėlyvus vakarus.\n\nAčiū, kad esate čia.\n\n— Maurice",
  'system_notice.thank_you_support.highlight_opensource': '100 % atviro kodo GitHub',
  'system_notice.thank_you_support.highlight_free': 'Nemokama visada — jokių mokamų planų',
  'system_notice.thank_you_support.highlight_community': 'Kuriama kartu su bendruomene',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Paremti Ko-fi',
  // 4.0.0 release modal — the release on the left, the note from the maintainer on the right
  'system_notice.release_400.eyebrow': 'Atnaujinimas įdiegtas',
  'system_notice.release_400.tag': 'Leidimas',
  'system_notice.release_400.headline': 'Didžiausias TREK leidimas per visą jo istoriją.',
  'system_notice.release_400.intro':
    'TREK gauna telefoną ir knygą. Šį leidimą kūrė devyniolika žmonių — kartu su juo išnyko apie šimtas penkiasdešimt praneštų klaidų.',
  'system_notice.release_400.feature_mobile_title': 'TREK keliauja į telefoną',
  'system_notice.release_400.feature_mobile_body':
    'Viskas, kas mažiau nei 768px, dabar turi savo sąsają — stiklinį dokelį, savo langus, savo kelionės planuoklį. Atverkite TREK savo telefone.',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'Kelionių žurnalo PDF tapo fotoknygų kūrimo įrankiu. Jis sudėlioja knygą, kai jo paprašote, o tada netrukdo.',
  'system_notice.release_400.feature_vacay_title': 'Atostogos išmoko likusio',
  'system_notice.release_400.feature_vacay_body':
    'Pusės dienos, atgaliniai ir lankstūs poilsio dienos, mokyklų atostogos tinklelyje — ir atostogų metai, kurie neprivalo prasidėti sausį.',
  'system_notice.release_400.feature_places_title': 'Vietos pasirodo pačios, failai išsikelia',
  'system_notice.release_400.feature_places_body':
    'Nuotraukos ir aprašymas užpildomi patys, dar prieš išsaugant vietą. O jūsų įkelti failai nebeprivalo gyventi diske, kuriame veikia TREK.',
  'system_notice.release_400.footnote':
    'Ir tai tik keturi iš jų. 4.0.0 versijoje yra dar kelios šimtai kitų pakeitimų — nuo Rinkinių ir Atlaso iki viso apatinio serverio.',
  'system_notice.release_400.note_eyebrow': 'Žinutė nuo prižiūrėtojo',
  'system_notice.release_400.note_title': 'Ačiū, kad naudojatės TREK.',
  'system_notice.release_400.note_body':
    'TREK prasidėjo kaip mažas įrankis savo pačių kelionėms, rašytas laisvalaikiu. Toks jis ir liko: vakarai, savaitgaliai, valandos šalia visos darbo dienos.\n\nKurį laiką buvau vienas. Dabar jau ne — šį leidimą išleido devyniolika žmonių, o tūkstančiai jūsų atėjo su žvaigždutėmis, pranešimais apie klaidas, vertimais ir pull request‘ais. Esu dėkingas už kiekvieną šios istorijos dalį.',
  'system_notice.release_400.promise_label': 'Pažadas',
  'system_notice.release_400.promise_text':
    'Atviro kodo TREK dalis lieka nemokama visada. Jokių mokamų planų, jokių prenumeratų, jokių paslėptų sąlygų. Pažadu.',
  'system_notice.release_400.note_body_after':
    '4.0.0 versija kainavo savaites vėlyvų naktų — telefono programėlė, knygų kūrimo įrankis, serverio migracija, dauguma to parašyta tarp vidurnakčio ir antros valandos nakties. Tai ne skundas: man patinka tai kurti. Tai tiesiog sąžiningas atsakymas į tai, kaip toks didelis leidimas išeina iš laisvalaikio projekto.',
  'system_notice.release_400.note_closing': 'Ačiū, kad esate čia.',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    'Parama yra tai, kas viską palaiko — serveriai, domenai ir vėlyvos naktys, virstančios tokiais leidimais kaip šis. Jei TREK jums ką nors reiškia, kava yra tiesiausias būdas padėti tam tęstis.',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': 'Paremti Ko-fi',
  'system_notice.pager.prev': 'Ankstesnis pranešimas',
  'system_notice.pager.next': 'Kitas pranešimas',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Eiti į pranešimą {n}',
  'system_notice.pager.position': 'Pranešimas {current} iš {total}',
};
export default system_notice;
