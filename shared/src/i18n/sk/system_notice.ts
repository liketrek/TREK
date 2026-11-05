import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'Fotografie sa v 3.0 presunuli',
  'system_notice.v3_photos.body':
    '**Fotografie** v Plánovači ciest boli odstránené. Vaše fotografie sú v bezpečí — TREK nikdy neupravoval vašu knižnicu Immich ani Synology.\n\nFotografie sú teraz v doplnku **Journey**. Journey je voliteľný — ak ešte nie je k dispozícii, požiadajte svojho správcu, aby ho aktivoval v Správa → Doplnky.',
  'system_notice.v3_journey.title': 'Spoznajte Journey — cestovný denník',
  'system_notice.v3_journey.body':
    'Dokumentujte svoje cesty ako bohaté cestovateľské príbehy s časovými osami, galériami fotiek a interaktívnymi mapami.',
  'system_notice.v3_journey.cta_label': 'Otvoriť Journey',
  'system_notice.v3_journey.highlight_timeline': 'Časová os a galéria deň po dni',
  'system_notice.v3_journey.highlight_photos': 'Import z Immich alebo Synology',
  'system_notice.v3_journey.highlight_share': 'Zdieľajte verejne — bez prihlásenia',
  'system_notice.v3_journey.highlight_export': 'Export ako PDF fotokniha',
  'system_notice.v3_features.title': 'Ďalšie novinky v 3.0',
  'system_notice.v3_features.body': 'Niekoľko ďalších vecí, ktoré o tomto vydaní stojí za to vedieť.',
  'system_notice.v3_features.highlight_dashboard': 'Redizajn nástenky mobile-first',
  'system_notice.v3_features.highlight_offline': 'Plný offline režim ako PWA',
  'system_notice.v3_features.highlight_search': 'Automatické dopĺňanie vyhľadávania miest v reálnom čase',
  'system_notice.v3_features.highlight_import': 'Import miest zo súborov KMZ/KML',
  'system_notice.v3_mcp.title': 'MCP: aktualizácia na OAuth 2.1',
  'system_notice.v3_mcp.body':
    'Integrácia MCP bola kompletne prepracovaná. OAuth 2.1 je teraz odporúčaná metóda overovania. Staršie statické tokeny (trek_…) sú zastarané a v budúcom vydaní budú odstránené.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 odporúčané (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 jemne odstupňovaných rozsahov oprávnení',
  'system_notice.v3_mcp.highlight_deprecated': 'Statické tokeny trek_ sú zastarané',
  'system_notice.v3_mcp.highlight_tools': 'Rozšírená sada nástrojov a promptov',
  'system_notice.v3_thankyou.title': 'Osobné slovo odo mňa',
  'system_notice.v3_thankyou.body':
    'Než pôjdete ďalej — chcem sa na chvíľu zastaviť.\n\nTREK začal ako vedľajší projekt, ktorý som vytvoril pre svoje vlastné cesty. Nikdy som si nepredstavoval, že vyrastie na niečo, čomu teraz 4 000 z vás dôveruje pri plánovaní svojich dobrodružstiev. Každú hviezdičku, každý issue, každú požiadavku na funkciu — všetky ich čítam a práve ony ma držia počas neskorých nocí medzi prácou na plný úväzok a univerzitou.\n\nChcem, aby ste vedeli: TREK bude vždy open source, vždy self-hosted, vždy váš. Žiadne sledovanie, žiadne predplatné, žiadne háčiky. Len nástroj vytvorený niekým, kto miluje cestovanie rovnako ako vy.\n\nOsobitné poďakovanie patrí [jubnl](https://github.com/jubnl) — stal si sa neuveriteľným spolupracovníkom. Toľko z toho, čo robí verziu 3.0 skvelou, nesie tvoj rukopis. Ďakujem, že si veril tomuto projektu, keď bol ešte len v plienkach.\n\nA každému jednému z vás, kto nahlásil chybu, preložil reťazec, zdieľal TREK s priateľom alebo ho jednoducho použil na naplánovanie cesty — **ďakujem**. Vy ste dôvod, prečo toto existuje.\n\nNa mnoho ďalších dobrodružstiev spoločne.\n\n— Maurice\n\n---\n\n[Pridaj sa ku komunite na Discorde](https://discord.gg/7Q6M6jDwzf)\n\nAk ti TREK zlepšuje cestovanie, [malá káva](https://ko-fi.com/mauriceboe) vždy pomôže udržať svetlá rozsvietené.',
  'system_notice.v3014_whitespace_collision.title': 'Vyžaduje sa akcia: konflikt používateľského účtu',
  'system_notice.v3014_whitespace_collision.body':
    'Aktualizácia 3.0.14 zistila jeden alebo viac konfliktov používateľského mena alebo e-mailu spôsobených medzerami na začiatku/konci uložených účtov. Dotknuté účty boli automaticky premenované. Skontrolujte protokoly servera na riadky začínajúce **[migration] WHITESPACE COLLISION**, aby ste zistili, ktoré účty vyžadujú kontrolu.',
  'system_notice.welcome_v1.title': 'Vitajte v TREK',
  'system_notice.welcome_v1.body':
    'Váš komplexný plánovač ciest. Vytvárajte itineráre, zdieľajte cesty s priateľmi a majte vo všetkom poriadok — online i offline.',
  'system_notice.welcome_v1.cta_label': 'Naplánovať cestu',
  'system_notice.welcome_v1.hero_alt': 'Malebná cestovateľská destinácia s prekrytím plánovacieho rozhrania TREK',
  'system_notice.welcome_v1.highlight_plan': 'Itineráre deň po dni pre každú cestu',
  'system_notice.welcome_v1.highlight_share': 'Spolupracujte s cestovnými partnermi',
  'system_notice.welcome_v1.highlight_offline': 'Funguje offline na mobile',
  'system_notice.dev_test_modal.title': '[Dev] Testovacie oznámenie',
  'system_notice.dev_test_modal.body': 'Toto je testovacie oznámenie len pre vývoj.',
  // Thank-you + support the project (shown once per install and once per upgrade)
  'system_notice.thank_you_support.title': 'Ďakujeme, že používate TREK',
  'system_notice.thank_you_support.body':
    'Rýchle poďakovanie za to, že ste si nainštalovali TREK — úprimne, znamená to pre mňa veľa.\n\nSom jediný vývojár a TREK tvorím vo svojom voľnom čase. Začalo to ako malý nástroj len pre moje vlastné cesty a odvtedy ma podpora a záujem komunity úplne dostávajú. TREK robím s veľkým srdcom — ale aj vďaka mnohým úžasným externým prispievateľom, ktorí ho pomohli formovať.\n\n**TREK je open source a úplne zadarmo — a tak to už navždy zostane. Žiadne platené úrovne, žiadne predplatné, žiadny háčik. Sľubujem.**\n\nAk je pre vás TREK užitočný a chceli by ste podporiť jeho vývoj, malá káva mi naozaj pomáha pokračovať v tvorbe — žiadny tlak, ale každá šálka mi pomáha prekonať neskoré noci.\n\nĎakujem, že ste tu.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100 % open source na GitHube',
  'system_notice.thank_you_support.highlight_free': 'Navždy zadarmo — nikdy žiadne platené úrovne',
  'system_notice.thank_you_support.highlight_community': 'Tvorené spoločne s komunitou',
  'system_notice.thank_you_support.cta_bmc': 'Kúp mi kávu',
  'system_notice.thank_you_support.cta_kofi': 'Podporiť na Ko-fi',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Aktualizácia nainštalovaná',
  'system_notice.release_notes.headline': 'Správne miesto, hneď napoprvé.',
  'system_notice.release_notes.intro':
    'Vyhľadávanie miest, vyhľadávanie adries a plánovanie trás teraz bežia na vlastných serveroch TREK, ktoré sponzoruje dataforest cloud, a každý TREK môže zdieľať, čo vie o miestach, so všetkými ostatnými.',
  'system_notice.release_notes.features_label': 'Hlavné novinky',
  'system_notice.release_notes.features_aside': 'Zďaleka nie všetko',
  'system_notice.release_notes.feature_search_title': 'Vyhľadávanie miest, ktoré trafí',
  'system_notice.release_notes.feature_search_body':
    'Mestá, ostrovy, pamiatky a letiská podľa kódu sú na prvom mieste, kaviarne sa hľadajú vo vašom okolí a návrhy sa zobrazujú už počas písania.',
  'system_notice.release_notes.feature_share_title': 'Zdieľané podrobnosti o miestach',
  'system_notice.release_notes.feature_share_body':
    'Zdieľajte weby, otváracie hodiny a fotky so všetkými TREK, pole po poli, a vaše uložené miesta prevezmú, čo doplnili ostatní.',
  'system_notice.release_notes.feature_routing_title': 'Rýchlejšie trasy',
  'system_notice.release_notes.feature_routing_body':
    'Celý deň sa naplánuje naraz až s dvadsiatimi zastávkami, jedna pomalá trasa už nezdrží ostatné a verejná doprava sa opýta druhého poskytovateľa, keď prvý nič nenájde.',
  'system_notice.release_notes.footnote': 'A k tomu dlhý zoznam menších zmien naprieč zvyškom TREK.',
  'system_notice.release_notes.notes_label': 'Poznámky k vydaniu',
  'system_notice.release_notes.note_eyebrow': 'Slovo od správcu',
  'system_notice.release_notes.note_title': 'Vy ste dôvod, prečo na TREK stále pracujem.',
  'system_notice.release_notes.note_body':
    'TREK začal ako malý nástroj pre moje vlastné cesty, napísaný po práci, pretože som ich chcel plánovať lepšie. V podstate nikdy neprestal rásť. Takmer všetko, čo používate, vzniklo neskoro v noci, cez víkendy, vo vlakoch, popri práci na plný úväzok, a bolo veľa večerov, keď som sa potichu pýtal, či ho tam vonku niekedy vôbec niekto otvorí.',
  'system_notice.release_notes.promise_label': 'Sľub',
  'system_notice.release_notes.promise_lead': 'TREK zostáva zadarmo, navždy.',
  'system_notice.release_notes.promise_text':
    'Každá funkcia, každá aktualizácia, pre všetkých. Žiadne platené úrovne, žiadne predplatné, žiadny háčik.',
  'system_notice.release_notes.note_body_after':
    'A potom ste ho otvorili. V priebehu pár mesiacov vás boli tisíce: hviezdičky, hlásenia chýb, preklady do jazykov, ktorými nehovorím, pull requesty od ľudí, ktorých som nikdy nestretol. Každé ráno sa stále najprv pozriem do repozitára a stále mi to nepripadá celkom skutočné.',
  'system_notice.release_notes.note_closing': 'Ďakujem, že ste tu, váš Maurice.',
  'system_notice.release_notes.support_label': 'Zostať nezávislý',
  'system_notice.release_notes.support_lead': 'Bez Google a spol.',
  'system_notice.release_notes.support_text':
    'Vyhľadávanie miest, vyhľadávanie adries a trasy bežia na vlastných serveroch TREK, dnes sponzorovaných spoločnosťou dataforest cloud. Bojujem za to každý deň a aby to tak zostalo, potrebujem vašu podporu.',
  'system_notice.release_notes.cta_bmc': 'Kúp mi kávu',
  'system_notice.release_notes.cta_kofi': 'Podporiť na Ko-fi',
  'system_notice.pager.prev': 'Predchádzajúce oznámenie',
  'system_notice.pager.next': 'Ďalšie oznámenie',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Prejsť na oznámenie {n}',
  'system_notice.pager.position': 'Oznámenie {current} z {total}',
};
export default system_notice;
