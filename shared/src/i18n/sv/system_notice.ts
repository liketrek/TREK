import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.v3_photos.title': 'Bilderna har flyttats i version 3.0',
  'system_notice.v3_photos.body':
    '**Bilder** i resplaneraren har tagits bort. Dina bilder är i säkerhet – TREK har aldrig ändrat ditt Immich- eller Synology-bibliotek.\n\nBilderna finns nu i tillägget **Journey**. Journey är valfritt – om det ännu inte är tillgängligt kan du be din administratör att aktivera det under Admin → Tillägg.',
  'system_notice.v3_journey.title': 'Upptäck Journey – resedagbok',
  'system_notice.v3_journey.body':
    'Dokumentera dina resor som innehållsrika reseskildringar med tidslinjer, fotoalbum och interaktiva kartor.',
  'system_notice.v3_journey.cta_label': 'Öppna Journey',
  'system_notice.v3_journey.highlight_timeline': 'Dag-för-dag-tidslinje och fotoalbum',
  'system_notice.v3_journey.highlight_photos': 'Importera från Immich eller Synology',
  'system_notice.v3_journey.highlight_share': 'Dela offentligt – ingen inloggning krävs',
  'system_notice.v3_journey.highlight_export': 'Exportera som en fotobok i PDF-format',
  'system_notice.v3_features.title': 'Fler höjdpunkter i version 3.0',
  'system_notice.v3_features.body': 'Några ytterligare saker som är bra att veta om den här utgåvan.',
  'system_notice.v3_features.highlight_dashboard': 'Omdesign av instrumentpanelen med fokus på mobilanvändning',
  'system_notice.v3_features.highlight_offline': 'Fullständigt offline-läge som PWA',
  'system_notice.v3_features.highlight_search': 'Automatisk komplettering vid platssökning i realtid',
  'system_notice.v3_features.highlight_import': 'Importera platser från KMZ-/KML-filer',
  'system_notice.v3_mcp.title': 'MCP: OAuth 2.1 uppgradering',
  'system_notice.v3_mcp.body':
    'MCP-integrationen har genomgått en fullständig omarbetning. OAuth 2.1 är nu den rekommenderade autentiseringsmetoden. De äldre statiska tokenen (trek_…) är utfasade och kommer att tas bort i en kommande version.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 rekommenderas (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 detaljerade behörighetsområden',
  'system_notice.v3_mcp.highlight_deprecated': 'Statiska trek_-token är utfasade',
  'system_notice.v3_mcp.highlight_tools': 'Utökad verktygslåda och uppmaningar',
  'system_notice.v3_thankyou.title': 'Ett personligt meddelande från mig',
  'system_notice.v3_thankyou.body':
    'Innan du går – vill jag ta en stund.\n\nTREK började som ett sidoprojekt som jag skapade för mina egna resor. Jag hade aldrig kunnat föreställa mig att det skulle växa till något som 4 000 av er nu litar på för att planera era äventyr. Varje stjärna, varje problem, varje önskemål om funktioner – jag läser dem alla, och de är det som håller mig igång under sena nätter mellan mitt heltidsjobb och universitetet.\n\nJag vill att ni ska veta: TREK kommer alltid att vara öppen källkod, alltid självhostat, alltid ert. Ingen spårning, inga prenumerationer, inga förbehåll. Bara ett verktyg skapat av någon som älskar att resa lika mycket som ni.\n\nEtt särskilt tack till [jubnl](https://github.com/jubnl) – du har blivit en fantastisk samarbetspartner. Så mycket av det som gör 3.0 så bra bär dina avtryck. Tack för att du trodde på det här projektet när det fortfarande var lite ojämnt i kanterna.\n\nOch till var och en av er som rapporterade ett fel, översatte en sträng, delade TREK med en vän eller helt enkelt använde det för att planera en resa – **tack**. Ni är anledningen till att det här finns.\n\nSkål för många fler äventyr tillsammans.\n\n— Maurice\n\n---\n\n[Gå med i communityn på Discord](https://discord.gg/7Q6M6jDwzf)\n\nOm TREK gör dina resor bättre, så håller en [liten kaffe](https://ko-fi.com/mauriceboe) alltid lamporna tända.',
  'system_notice.v3014_whitespace_collision.title': 'Åtgärd krävs: konflikt mellan användarkonton',
  'system_notice.v3014_whitespace_collision.body':
    'Uppgraderingen till version 3.0.14 upptäckte en eller flera konflikter mellan användarnamn eller e-postadresser som orsakades av blanksteg i början eller slutet av lagrade konton. De berörda kontona döptes om automatiskt. Kontrollera serverloggarna efter rader som börjar med **[migration] WHITESPACE COLLISION** för att identifiera vilka konton som behöver granskas.',
  'system_notice.welcome_v1.title': 'Välkommen till TREK',
  'system_notice.welcome_v1.body':
    'Din allt-i-ett-resplanerare. Skapa resplaner, dela resor med vänner och håll ordning på allt – både online och offline.',
  'system_notice.welcome_v1.cta_label': 'Planera en resa',
  'system_notice.welcome_v1.hero_alt': 'Ett naturskönt resmål med TREK planering UI-överlagring',
  'system_notice.welcome_v1.highlight_plan': 'Dag-för-dag-resplaner för alla typer av resor',
  'system_notice.welcome_v1.highlight_share': 'Samarbeta med resepartners',
  'system_notice.welcome_v1.highlight_offline': 'Fungerar offline på mobilen',
  'system_notice.dev_test_modal.title': '[Dev] Meddelande om test',
  'system_notice.dev_test_modal.body': 'Detta är ett testmeddelande avsett endast för utvecklare.',
  'system_notice.thank_you_support.title': 'Tack för att du använder TREK',
  'system_notice.thank_you_support.body':
    'Ett snabbt tack för att du installerade TREK – det betyder verkligen mycket.\n\nJag är en ensam utvecklare och bygger TREK på min fritid. Det började som ett litet verktyg bara för mina egna resor, och jag är ärligt talat överväldigad av allt stöd och intresse från communityn sedan dess. TREK är skapat med mycket hjärta från min sida – men också tack vare de många fantastiska externa bidragsgivare som har hjälpt till att forma det.\n\n**TREK är öppen källkod och helt gratis – och kommer alltid att förbli så. Inga betalnivåer, inga prenumerationer, inga förbehåll. Jag lovar.**\n\nOm TREK är användbart för dig och du vill stödja utvecklingen, så hjälper en liten kaffe mig verkligen att fortsätta bygga – ingen press alls, men varje kopp håller de sena nätterna igång.\n\nTack för att du är här.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100 % öppen källkod på GitHub',
  'system_notice.thank_you_support.highlight_free': 'Gratis för alltid – aldrig några betalnivåer',
  'system_notice.thank_you_support.highlight_community': 'Byggt tillsammans med communityn',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Stöd på Ko-fi',
  'system_notice.pager.prev': 'Tidigare meddelande',
  'system_notice.pager.next': 'Nästa meddelande',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Gå till meddelandet {n}',
  'system_notice.pager.position': 'Meddlenade {current} av {total}',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Uppdatering klar',
  'system_notice.release_notes.headline': 'Tre saker som TREK nu klarar på egen hand.',
  'system_notice.release_notes.intro':
    'Ett eget API för platser, bilresor planerade från start till mål och din platshistorik tillbaka i dina händer.',
  'system_notice.release_notes.features_label': 'Höjdpunkterna',
  'system_notice.release_notes.features_aside': 'Långt ifrån allt',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body':
    'Den första resplaneraren med öppen källkod som driver sitt eget API för platser. 73,6 miljoner platser som byggs om varje månad. Ingen nyckel, ingen kvot.',
  'system_notice.release_notes.feature_roadtrip_title': 'Tillägget Bilresa',
  'system_notice.release_notes.feature_roadtrip_body':
    'Bilreseläget planerar själva körningen: rutten, sträckan, körtiden och stoppen. Ett tillägg som är avstängt tills en administratör slår på det.',
  'system_notice.release_notes.feature_dawarich_title': 'Dawarich-integration',
  'system_notice.release_notes.feature_dawarich_body':
    'Det självhostade svaret på Google Timeline, nu läsbart direkt i TREK. TREK läser, och bara läser. Ingenting skrivs någonsin tillbaka.',
  'system_notice.release_notes.footnote': 'Dessutom en lång rad mindre ändringar i resten av TREK.',
  'system_notice.release_notes.notes_label': 'Versionsnyheter',
  'system_notice.release_notes.note_eyebrow': 'Ett ord från utvecklaren',
  'system_notice.release_notes.note_title': 'Du är anledningen till att jag fortsätter bygga TREK.',
  'system_notice.release_notes.note_body':
    'TREK började som ett litet verktyg för mina egna resor, skrivet efter jobbet för att jag ville ha ett bättre sätt att planera dem. Det har egentligen aldrig slutat växa. Nästan allt du använder byggdes sent på nätterna, på helger, på tåg, vid sidan av ett heltidsjobb, och många kvällar undrade jag tyst för mig själv om någon där ute någonsin skulle öppna det.',
  'system_notice.release_notes.promise_label': 'Löftet',
  'system_notice.release_notes.promise_lead': 'TREK förblir gratis, för alltid.',
  'system_notice.release_notes.promise_text':
    'Varje funktion, varje uppdatering, för alla. Inga betalnivåer, inga prenumerationer, inga förbehåll.',
  'system_notice.release_notes.note_body_after':
    'Och sedan gjorde ni det. Inom några månader var ni tusentals: stjärnor, felrapporter, översättningar till språk jag inte talar, pull requests från människor jag aldrig har träffat. Jag kollar fortfarande repot varje morgon innan jag gör något annat, och det känns ännu inte riktigt verkligt.',
  'system_notice.release_notes.note_closing': 'Tack för att du är här. Hälsningar, Maurice.',
  'system_notice.release_notes.support_lead':
    'TREK är gratis och kommer alltid att vara det, men servrar, domäner och många sena nätter är det inte.',
  'system_notice.release_notes.support_text':
    'Om TREK har förtjänat en plats på dina resor, så bjud mig gärna på en kaffe och hjälp till att nästa utgåva blir av.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Stöd på Ko-fi',
};
export default system_notice;
