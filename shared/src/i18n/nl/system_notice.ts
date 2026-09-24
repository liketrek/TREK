import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Welkom bij TREK',
  'system_notice.welcome_v1.body':
    "Jouw alles-in-één reisplanner. Maak reisschema's, deel trips met vrienden en blijf georganiseerd — online en offline.",
  'system_notice.welcome_v1.cta_label': 'Reis plannen',
  'system_notice.welcome_v1.hero_alt': 'Schilderachtige reisbestemming met TREK interface',
  'system_notice.welcome_v1.highlight_plan': "Dag-voor-dag reisschema's",
  'system_notice.welcome_v1.highlight_share': 'Samenwerken met reisgezelschap',
  'system_notice.welcome_v1.highlight_offline': 'Werkt offline op mobiel',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Bedankt voor het gebruik van TREK',
  'system_notice.thank_you_support.body':
    'Even een kort bedankje dat je TREK hebt geïnstalleerd — het betekent echt veel voor me.\n\nIk ben een solo-ontwikkelaar en bouw TREK in mijn vrije tijd. Het begon als een klein hulpmiddel voor mijn eigen reizen, en ik ben oprecht overweldigd door de steun en de interesse vanuit de community sindsdien. TREK is met heel veel hart gemaakt aan mijn kant — maar ook dankzij de vele geweldige externe bijdragers die hebben geholpen het vorm te geven.\n\n**TREK is open source en volledig gratis — en dat zal het voor altijd blijven. Geen betaalde versies, geen abonnementen, geen addertjes onder het gras. Dat beloof ik.**\n\nAls TREK nuttig voor je is en je de ontwikkeling ervan wilt steunen, helpt een klein kopje koffie me oprecht om te blijven bouwen — absoluut geen druk, maar elk kopje houdt de late avonden gaande.\n\nBedankt dat je er bent.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% open source op GitHub',
  'system_notice.thank_you_support.highlight_free': 'Voor altijd gratis — nooit betaalde versies',
  'system_notice.thank_you_support.highlight_community': 'Samen met de community gebouwd',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Steun op Ko-fi',
  'system_notice.pager.prev': 'Vorige melding',
  'system_notice.pager.next': 'Volgende melding',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Ga naar melding {n}',
  'system_notice.pager.position': 'Melding {current} van {total}',
  'system_notice.v3_photos.title': "Foto's zijn verplaatst in 3.0",
  'system_notice.v3_photos.body':
    "**Foto's** in de Reisplanner zijn verwijderd. Je foto's zijn veilig — TREK heeft je Immich- of Synology-bibliotheek nooit gewijzigd.\n\nFoto's leven nu in de **Journey**-addon. Journey is optioneel — als het nog niet beschikbaar is, vraag je admin het te activeren via Admin → Addons.",
  'system_notice.v3_journey.title': 'Maak kennis met Journey — reisdagboek',
  'system_notice.v3_journey.body':
    'Documenteer je reizen als rijke verhalen met tijdlijnen, fotogalerijen en interactieve kaarten.',
  'system_notice.v3_journey.cta_label': 'Journey openen',
  'system_notice.v3_journey.highlight_timeline': 'Dag-voor-dag tijdlijn & galerij',
  'system_notice.v3_journey.highlight_photos': 'Importeer van Immich of Synology',
  'system_notice.v3_journey.highlight_share': 'Openbaar delen — geen login vereist',
  'system_notice.v3_journey.highlight_export': 'Exporteer als PDF-fotoboek',
  'system_notice.v3_features.title': 'Meer hoogtepunten in 3.0',
  'system_notice.v3_features.body': 'Nog een paar dingen die het weten waard zijn in deze release.',
  'system_notice.v3_features.highlight_dashboard': 'Mobile-first dashboard herontwerp',
  'system_notice.v3_features.highlight_offline': 'Volledige offline modus als PWA',
  'system_notice.v3_features.highlight_search': 'Realtime plaatsautocomplete',
  'system_notice.v3_features.highlight_import': 'Importeer plaatsen uit KMZ/KML-bestanden',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1-upgrade',
  'system_notice.v3_mcp.body':
    'De MCP-integratie is volledig vernieuwd. OAuth 2.1 is nu de aanbevolen authenticatiemethode. Statische tokens (trek_…) zijn verouderd en worden verwijderd in een toekomstige versie.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 aanbevolen (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 gedetailleerde toestemmingsscopes',
  'system_notice.v3_mcp.highlight_deprecated': 'Statische trek_-tokens verouderd',
  'system_notice.v3_mcp.highlight_tools': 'Uitgebreide tools & prompts',
  'system_notice.v3_thankyou.title': 'Een persoonlijk woord van mij',
  'system_notice.v3_thankyou.body':
    'Voordat je verdergaat — ik wil even stilstaan.\n\nTREK begon als een zijproject dat ik bouwde voor mijn eigen reizen. Ik had nooit gedacht dat het zou uitgroeien tot iets waar 4.000 van jullie op vertrouwen om avonturen te plannen. Elke ster, elke issue, elk functieverzoek — ik lees ze allemaal, en ze houden me op de been tijdens de late avonden tussen een fulltime baan en de universiteit.\n\nIk wil dat jullie weten: TREK zal altijd open source zijn, altijd self-hosted, altijd van jullie. Geen tracking, geen abonnementen, geen addertjes. Gewoon een tool gebouwd door iemand die net zo veel van reizen houdt als jullie.\n\nSpeciale dank aan [jubnl](https://github.com/jubnl) — je bent een ongelooflijke medewerker geworden. Zo veel van wat 3.0 geweldig maakt draagt jouw vingerafdruk. Bedankt dat je in dit project geloofde toen het nog ruw was.\n\nEn aan ieder van jullie die een bug meldde, een string vertaalde, TREK deelde met een vriend of het simpelweg gebruikte om een reis te plannen — **bedankt**. Jullie zijn de reden dat dit bestaat.\n\nOp nog vele avonturen samen.\n\n— Maurice\n\n---\n\n[Sluit je aan bij de community op Discord](https://discord.gg/7Q6M6jDwzf)\n\nAls TREK je reizen beter maakt, houdt een [klein kopje koffie](https://ko-fi.com/mauriceboe) altijd de lichten aan.',
  'system_notice.v3014_whitespace_collision.title': 'Actie vereist: gebruikersaccountconflict',
  'system_notice.v3014_whitespace_collision.body':
    'De 3.0.14-upgrade heeft één of meer conflicten in gebruikersnaam of e-mailadres gedetecteerd, veroorzaakt door spaties aan het begin of einde van opgeslagen waarden. Getroffen accounts zijn automatisch hernoemd. Controleer de serverlogboeken op regels die beginnen met **[migration] WHITESPACE COLLISION** om te achterhalen welke accounts moeten worden beoordeeld.',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Update geïnstalleerd',
  'system_notice.release_notes.headline': 'Vier dingen die TREK nu zelf doet.',
  'system_notice.release_notes.intro': 'Een eigen plaatsen-API, roadtrips van begin tot eind gepland, je locatiegeschiedenis in eigen hand, en je documenten gesynchroniseerd.',
  'system_notice.release_notes.features_label': 'De hoogtepunten',
  'system_notice.release_notes.features_aside': 'Lang niet alles',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body': 'De eerste open source reisplanner met een eigen plaatsen-API. 73,6 miljoen plaatsen, geen sleutel, geen quotum.',
  'system_notice.release_notes.feature_roadtrip_title': 'Roadtrip-addon',
  'system_notice.release_notes.feature_roadtrip_body': 'Plant de rit zelf: route, afstand, uren en stops. Uit totdat een admin het inschakelt.',
  'system_notice.release_notes.feature_dawarich_title': 'Dawarich-integratie',
  'system_notice.release_notes.feature_dawarich_body': 'Het zelfgehoste antwoord op Google Timeline, nu rechtstreeks leesbaar in TREK. TREK leest, en alleen dat.',
  'system_notice.release_notes.footnote': 'En daarnaast een lange lijst kleinere wijzigingen in de rest van TREK.',
  'system_notice.release_notes.notes_label': 'Release notes',
  'system_notice.release_notes.note_eyebrow': 'Een woord van de maintainer',
  'system_notice.release_notes.note_title': 'Jij bent de reden dat ik aan TREK blijf bouwen.',
  'system_notice.release_notes.note_body':
    'TREK begon als een klein hulpmiddel voor mijn eigen reizen, geschreven na werktijd omdat ik ze beter wilde kunnen plannen. Eigenlijk is het nooit gestopt met groeien. Bijna alles wat je gebruikt, is gebouwd laat op de avond, in het weekend, in de trein, naast een fulltime baan, en op heel wat avonden vroeg ik me stilletjes af of iemand daarbuiten het ooit zou openen.',
  'system_notice.release_notes.promise_label': 'De belofte',
  'system_notice.release_notes.promise_lead': 'TREK blijft gratis, voor altijd.',
  'system_notice.release_notes.promise_text':
    'Elke functie, elke update, voor iedereen. Geen betaalde versies, geen abonnementen, geen addertjes.',
  'system_notice.release_notes.note_body_after':
    'En toen kwamen jullie. Binnen een paar maanden waren jullie met duizenden: sterren, bugmeldingen, vertalingen in talen die ik niet spreek, pull requests van mensen die ik nooit heb ontmoet. Nog altijd kijk ik elke ochtend als eerste in de repository, en het voelt nog steeds niet helemaal echt.',
  'system_notice.release_notes.note_closing': 'Bedankt dat je er bent. Groetjes, Maurice.',
  'system_notice.release_notes.support_lead':
    'TREK is gratis en blijft dat ook, maar servers, domeinen en heel wat late avonden zijn dat niet.',
  'system_notice.release_notes.support_text':
    'Als TREK een plek in je reizen heeft verdiend, trakteer me dan op een kopje koffie en help zo de volgende release op weg.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Steun op Ko-fi',
  'system_notice.release_notes.feature_docsync_title': 'Documentsynchronisatie',
  'system_notice.release_notes.feature_docsync_body': 'Paperless-ngx, Papra, Nextcloud, OpenCloud en Synology Drive. De documenten van een reis stromen in beide richtingen met de opslag die je al draait.',
};
export default system_notice;
