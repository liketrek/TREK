import type { TranslationStrings } from '../types';

const dawarich: TranslationStrings = {
  // ── Connection ─────────────────────────────────────────────────────────────
  'dawarich.title': 'Dawarich',
  'dawarich.intro':
    'Ühenda oma Dawarichi server, et näha, kus tegelikult käisid. TREK loeb andmeid ja soovitab päevikusissekandeid, kohti ning riike — midagi ei lisata sinu kinnituseta ja Dawarichi ei kirjutata midagi tagasi.',
  'dawarich.url': 'Serveri aadress',
  'dawarich.apiKey': 'API-võti',
  'dawarich.apiKeyPlaceholder': 'Kleebi oma Dawarichi API-võti',
  'dawarich.apiKeyHint':
    'Leiad Dawarichist jaotisest Account → API key. Salvestatakse krüptitult ja seda enam ei kuvata.',
  'dawarich.allowInsecureTls': 'Luba iseallkirjastatud sertifikaat',
  'dawarich.allowInsecureTlsHint':
    'Vajalik ainult siis, kui sinu server kasutab sertifikaati, mida TREKi server ei usalda.',
  'dawarich.syncEnabled': 'Kontrolli uusi peatumisi automaatselt',
  'dawarich.syncEnabledHint': 'Väljalülitatuna loeb TREK Dawarichi andmeid ainult sinu taotlusel.',
  'dawarich.test.button': 'Testi ühendust',
  'dawarich.test.success': 'Ühendatud. Viimase 30 päeva jooksul leiti {count} peatumist.',
  'dawarich.test.failed': 'Dawarichiga ei saadud ühendust.',
  'dawarich.syncNow': 'Kontrolli kohe',
  'dawarich.connected': 'Ühendatud',
  'dawarich.notConnected': 'Ühendamata',
  'dawarich.disconnect': 'Katkesta ühendus',
  'dawarich.lastSync': 'Viimati kontrollitud {when}',
  'dawarich.neverSynced': 'Veel kontrollimata',
  'dawarich.syncPartial': 'mõnda reisi ei saanud lugeda',
  'dawarich.serverVersion': 'Dawarich {version}',

  'dawarich.toast.saved': 'Dawarichi ühendus salvestatud',
  'dawarich.toast.saveError': 'Ühenduse salvestamine ebaõnnestus',
  'dawarich.toast.disconnected': 'Dawarichi ühendus katkestatud',
  'dawarich.toast.synced': 'Leiti {count} uut peatumist',
  'dawarich.toast.syncError': 'Dawarichi lugemine ebaõnnestus',
  'dawarich.toast.syncRunning': 'Kontroll juba käib',
  'dawarich.toast.acceptError': 'Lisamine ebaõnnestus',
  'dawarich.toast.updateError': 'Soovituse uuendamine ebaõnnestus',
  'dawarich.toast.accepted.place': 'Reisile lisatud',
  'dawarich.toast.accepted.journal': 'Päevikusse lisatud',
  'dawarich.toast.accepted.bucket_list': 'Soovinimekirjas täidetuks märgitud',

  // ── What the connected instance can do ─────────────────────────────────────
  'dawarich.capability.visits': 'peatumised',
  'dawarich.capability.track': 'salvestatud teekond',
  'dawarich.capability.locations': 'soovinimekirja vastete leidmine',
  'dawarich.capability.visitedCities': 'riigid ja linnad',
  'dawarich.capability.missing': 'See Dawarichi versioon ei paku järgmisi võimalusi: {features}.',

  // ── Failure reasons, as sentences the reader can act on ────────────────────
  'dawarich.error.unreachable': 'TREK ei saanud selle aadressiga ühendust.',
  'dawarich.error.unauthorized': 'Dawarich lükkas API-võtme tagasi.',
  'dawarich.error.forbidden': 'Sellel API-võtmel pole nende andmete lugemise õigust.',
  'dawarich.error.not_found': 'Selles Dawarichi versioonis pole seda API-otspunkti.',
  'dawarich.error.rate_limited': 'Dawarich palus TREKil päringuid aeglustada. Proovi varsti uuesti.',
  'dawarich.error.server_error': 'Dawarich vastas veaga.',
  'dawarich.error.invalid_response': 'Sellelt aadressilt vastas midagi muud kui Dawarich.',
  'dawarich.error.too_large': 'Dawarich saatis rohkem andmeid, kui TREK korraga loeb.',
  'dawarich.error.not_connected': 'Ühtegi Dawarichi serverit pole veel ühendatud.',
  'dawarich.error.addon_disabled': 'Dawarichi lisamoodul on selles TREKi paigalduses välja lülitatud.',
  'dawarich.error.offline': 'See vajab ühendust — TREK on praegu võrguühenduseta.',
  'dawarich.error.invalid_url': 'TREK ei saa seda aadressi kasutada.',
  'dawarich.warning.private_ip':
    'See aadress viitab privaatsele IP-aadressile ({ip}). Veendu, et see on õige — ühendamiseks võib server vajada seadet ALLOW_INTERNAL_NETWORK=true.',
  'dawarich.error.unknown': 'Dawarichiga suhtlemisel läks midagi valesti.',

  // ── The recorded route on the map ──────────────────────────────────────────
  'dawarich.trail.show': 'Näita salvestatud teekonda',
  'dawarich.trail.hide': 'Peida salvestatud teekond',
  'dawarich.trail.loading': 'Salvestatud teekonna laadimine…',
  'dawarich.trail.empty': 'Nendel kuupäevadel pole midagi salvestatud',
  'dawarich.trail.offline': 'Salvestatud teekonna laadimine vajab ühendust',
  'dawarich.trail.unavailable': 'Salvestatud teekonda ei saanud laadida',

  // ── Suggestions ────────────────────────────────────────────────────────────
  'dawarich.duration.minutes': '{minutes} min',
  'dawarich.duration.hours': '{hours} t',
  'dawarich.duration.hoursMinutes': '{hours} t {minutes} min',
  'dawarich.checkedAgo': 'kontrollitud {ago}',

  'dawarich.badge.lowConfidence': 'Ebakindel',
  'dawarich.badge.sourceChanged': 'Dawarichis muudetud',
  'dawarich.badge.sourceMissing': 'Dawarichist kadunud',

  'dawarich.suggestions.title': 'Dawarichist',
  'dawarich.suggestions.pending': '{count} ootab sind',
  'dawarich.suggestions.loading': 'Dawarichi lugemine…',
  'dawarich.suggestions.notConnected': 'Peatumiste nägemiseks ühenda Dawarich seadetes.',
  'dawarich.suggestions.unavailable': 'Dawarichi andmeid ei saanud lugeda.',
  'dawarich.suggestions.allHandled': 'Kõik siin salvestatu on läbi vaadatud.',
  'dawarich.suggestions.asJournal': 'Kirjuta päevikusissekanne',
  'dawarich.suggestions.asPlace': 'Lisa kohana',
  'dawarich.suggestions.dismiss': 'Ma pole seda kohta külastanud',
  'dawarich.suggestions.dismissed': 'Kõrvale jäetud',
  'dawarich.suggestions.restore': 'Taasta',
  'dawarich.suggestions.showHandled': 'Näita {count} juba käsitletut',
  'dawarich.suggestions.hideHandled': 'Peida juba käsitletud',
  'dawarich.suggestions.matchesWish': 'Sinu soovinimekirjas: {name}',
  'dawarich.suggestions.acceptedAs.place': 'Kohana lisatud',
  'dawarich.suggestions.acceptedAs.journal': 'Päevikus',
  'dawarich.suggestions.acceptedAs.bucket_list': 'Soov täidetuks märgitud',
  'dawarich.suggestions.sourceChanged':
    'See peatumine on Dawarichis pärast selle kasutamist muutunud. Sinu TREKi sissekanne jäi puutumata.',
  'dawarich.suggestions.sourceMissing':
    'Seda peatumist pole Dawarichis enam olemas. Sinu TREKi sissekanne jäi puutumata.',
  'dawarich.sourceStatus.suggested': 'Tuvastatud, kinnitamata',
  'dawarich.confidence.high': 'Kindel tuvastus',
  'dawarich.confidence.medium': 'Üsna kindel tuvastus',
  'dawarich.confidence.low': 'Ebakindel tuvastus',

  // ── The review step ────────────────────────────────────────────────────────
  'dawarich.accept.title.place': 'Lisa see peatumine kohana',
  'dawarich.accept.title.journal': 'Kirjuta päevikusissekanne',
  'dawarich.accept.title.bucket_list': 'Märgi soov täidetuks',
  'dawarich.accept.confirm.place': 'Lisa koht',
  'dawarich.accept.confirm.journal': 'Lisa sissekanne',
  'dawarich.accept.confirm.bucket_list': 'Märgi täidetuks',
  'dawarich.accept.recorded': 'Salvestatud {from} kuni {to}',
  'dawarich.accept.duration': '{minutes} min',
  'dawarich.accept.name': 'Nimi',
  'dawarich.accept.date': 'Kuupäev',
  'dawarich.accept.from': 'Saabusid',
  'dawarich.accept.to': 'Lahkusid',
  'dawarich.accept.trip': 'Reis',
  'dawarich.accept.thisTrip': 'See reis',
  'dawarich.accept.pickTrip': 'Vali reis',
  'dawarich.accept.day': 'Päev',
  'dawarich.accept.noDay': 'Veel päevaga sidumata',
  'dawarich.accept.journal': 'Päevik',
  'dawarich.accept.pickJournal': 'Vali päevik',
  'dawarich.accept.notes': 'Märkmed',
  'dawarich.accept.story': 'Sinu lugu',
  'dawarich.accept.storyPlaceholder': 'Mis siin juhtus?',
  'dawarich.accept.photosHint': 'Lisa sissekandele fotod pärast selle loomist.',

  // ── A place that came out of a recording ──────────────────────────────────
  'dawarich.place.fromDawarich': 'Lisatud sinu Dawarichi salvestustest',

  // ── Wishlist ───────────────────────────────────────────────────────────────
  'dawarich.bucket.title': 'Võrdle soovinimekirja Dawarichiga',
  'dawarich.bucket.description':
    'Otsib salvestustest kohti, kuhu soovisid jõuda. Külastuseks loeb nii lähedus kui ka kohapeal veedetud aeg — möödasõidust ei piisa.',
  'dawarich.bucket.scan': 'Kontrolli soovinimekirja',
  'dawarich.bucket.scanning': 'Kontrollimine…',
  'dawarich.bucket.noMatches': 'Sinu soovinimekirja kohti salvestustest ei leitud.',
  'dawarich.bucket.alreadyVisited': 'Juba täidetuks märgitud',
  'dawarich.bucket.confirm': 'Märgi {count} täidetuks',
  'dawarich.bucket.confirmed': '{count} soovi täidetuks märgitud',
  'dawarich.bucket.skipped': '{count} kirjel pole koordinaate ja neid ei saanud kontrollida.',
  'dawarich.bucket.truncated': 'Kontrolliti ainult esimesi kirjeid. Ülejäänute jaoks käivita uuesti.',
  'dawarich.bucket.visitedFrom': 'Täidetuks märgitud sinu Dawarichi salvestuste põhjal',
  'dawarich.bucket.clearVisit': 'Võta tagasi',

  // ── Atlas ──────────────────────────────────────────────────────────────────
  'dawarich.atlas.title': 'Riigid Dawarichist',
  'dawarich.atlas.description':
    'Riigid, kus oled salvestuste järgi käinud. Kinnita need, mida soovid Atlases näha — midagi ei lisata automaatselt ja käsitsi tehtud märgistused jäävad alles.',
  'dawarich.atlas.load': 'Otsi riike',
  'dawarich.atlas.loading': 'Sinu salvestuste lugemine…',
  'dawarich.atlas.empty': 'Salvestustest ei leitud riike, mida TREKis veel pole.',
  'dawarich.atlas.cities': '{count} linna',
  'dawarich.atlas.citiesOne': '1 linn',
  'dawarich.atlas.accept': 'Lisa {count} riiki',
  'dawarich.atlas.accepted': '{count} riiki lisatud',
  'dawarich.atlas.unresolved': 'TREK ei suutnud neid riigiga seostada: {names}.',
  'dawarich.atlas.source': 'Dawarichist',
  'dawarich.atlas.range': 'Vaadatud ajavahemik {from} kuni {to}',

  'dawarich.atlas.trigger': 'Soovid ja riigid sinu salvestustest',
  'dawarich.atlas.dialogSubtitle': 'Mida salvestused sinu Atlase kohta näitavad',
  'dawarich.atlas.tab.wishes': 'Soovinimekiri',
  'dawarich.atlas.tab.countries': 'Riigid',
  'dawarich.atlas.window': 'Vaadati viimast 12 kuud.',
  'dawarich.selected': '{count} valitud',
  'dawarich.again': 'Kontrolli uuesti',
  'dawarich.bucket.metersAway': '{meters} m kaugusel',
  'dawarich.bucket.kilometersAway': '{km} km kaugusel',
  'dawarich.bucket.rule': 'Soov loetakse täidetuks, kui viibid vähemalt {minutes} minutit kohast {meters} m raadiuses.',

  'dawarich.journey.dayStays.one': '1 peatumine Dawarichist',
  'dawarich.journey.dayStays.other': '{count} peatumist Dawarichist',
};

export default dawarich;
