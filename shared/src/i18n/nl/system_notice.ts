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
  // 4.0.0-releasemodal — links de release, rechts het woord van de maintainer
  'system_notice.release_400.eyebrow': 'Update geïnstalleerd',
  'system_notice.release_400.tag': 'Release',
  'system_notice.release_400.headline': 'De grootste release die TREK ooit heeft gehad.',
  'system_notice.release_400.intro':
    "TREK krijgt een telefoon en een boek. Negentien mensen schreven hieraan mee — en zo'n honderdvijftig gemelde bugs gingen mee.",
  'system_notice.release_400.feature_mobile_title': 'TREK wordt mobiel',
  'system_notice.release_400.feature_mobile_body':
    'Alles onder 768px is nu een eigen interface — een glazen dock, eigen sheets, een eigen reisplanner. Open TREK op je telefoon.',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'De Journey-PDF werd een fotoboekontwerper. Hij maakt de opmaak wanneer je erom vraagt en gaat daarna uit de weg.',
  'system_notice.release_400.feature_vacay_title': 'Vacay leert de rest',
  'system_notice.release_400.feature_vacay_body':
    'Halve dagen, compensatie- en flexdagen, schoolvakanties in het raster — en een verlofjaar dat niet in januari hoeft te beginnen.',
  'system_notice.release_400.feature_places_title': 'Plaatsen tonen zichzelf, bestanden verhuizen',
  'system_notice.release_400.feature_places_body':
    "Foto's en een beschrijving vullen zichzelf in voordat je een plaats opslaat. En je uploads hoeven niet langer op de schijf te staan waarop TREK draait.",
  'system_notice.release_400.footnote':
    'En dit zijn er vier. 4.0.0 bevat nog enkele honderden wijzigingen, van Collections en Atlas tot de hele server eronder.',
  'system_notice.release_400.note_eyebrow': 'Een woord van de maintainer',
  'system_notice.release_400.note_title': 'Bedankt voor het gebruik van TREK.',
  'system_notice.release_400.note_body':
    'TREK begon als een klein hulpmiddel voor mijn eigen reizen, geschreven in mijn vrije tijd. Dat is het nog steeds: avonden, weekenden, de uren naast een fulltime baan.\n\nEen tijdlang was ik de enige. Nu niet meer — negentien mensen maakten deze release, en duizenden van jullie kwamen erbij met sterren, issues, vertalingen en pull requests. Ik ben dankbaar voor elk stuk ervan.',
  'system_notice.release_400.promise_label': 'De belofte',
  'system_notice.release_400.promise_text':
    'De open source-kant van TREK blijft gratis, voor altijd. Geen betaalde versies, geen abonnementen, geen addertjes. Beloofd.',
  'system_notice.release_400.note_body_after':
    '4.0.0 kostte weken aan late avonden — een mobiele app, een fotoboekontwerper, een servermigratie, het meeste geschreven tussen middernacht en twee uur. Geen klacht: ik bouw dit graag. Het is gewoon het eerlijke antwoord op hoe een release van deze omvang uit een vrijetijdsproject komt.',
  'system_notice.release_400.note_closing': 'Bedankt dat je er bent.',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    'Steun is wat dit draaiende houdt — servers, domeinen en de late avonden die uitmonden in releases als deze. Als TREK iets voor je waard is, is een kopje koffie de meest directe manier om het door te laten gaan.',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': 'Steun op Ko-fi',
};
export default system_notice;
