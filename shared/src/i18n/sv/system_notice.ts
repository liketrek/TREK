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
  // 4.0.0 release modal — the release on the left, the note from the maintainer on the right
  'system_notice.release_400.eyebrow': 'Uppdatering klar',
  'system_notice.release_400.tag': 'Utgåva',
  'system_notice.release_400.headline': 'Den största utgåvan TREK har haft.',
  'system_notice.release_400.intro':
    'TREK får en telefon, och en bok. Nitton personer skrev den här — och ungefär hundrafemtio rapporterade fel följde med.',
  'system_notice.release_400.feature_mobile_title': 'TREK blir mobilt',
  'system_notice.release_400.feature_mobile_body':
    'Allt under 768px är ett eget gränssnitt nu — en dock i glas, egna paneler, en egen resplanerare. Öppna TREK i telefonen.',
  'system_notice.release_400.feature_studio_title': 'TREK Studio',
  'system_notice.release_400.feature_studio_badge': 'Beta',
  'system_notice.release_400.feature_studio_body':
    'Journey-PDF:en blev en fotoboksdesigner. Den lägger ut boken när du ber om det, och håller sig sedan undan.',
  'system_notice.release_400.feature_vacay_title': 'Vacay lär sig resten',
  'system_notice.release_400.feature_vacay_body':
    'Halvdagar, komp- och flexdagar, skollov i rutnätet — och ett semesterår som inte måste börja i januari.',
  'system_notice.release_400.feature_places_title': 'Platser visar sig, filer flyttar ut',
  'system_notice.release_400.feature_places_body':
    'Bilder och en beskrivning fyller i sig själva innan du sparar en plats. Och dina uppladdningar behöver inte längre ligga på disken TREK kör på.',
  'system_notice.release_400.footnote':
    'Och det här är fyra av dem. 4.0.0 innehåller flera hundra ytterligare ändringar, från Collections och Atlas till hela servern under.',
  'system_notice.release_400.note_eyebrow': 'Ett ord från utvecklaren',
  'system_notice.release_400.note_title': 'Tack för att du använder TREK.',
  'system_notice.release_400.note_body':
    'TREK började som ett litet verktyg för mina egna resor, skrivet på fritiden. Det är det fortfarande: kvällar, helger, timmarna vid sidan av ett heltidsjobb.\n\nEtt tag var det bara jag. Inte längre — nitton personer levererade den här utgåvan, och tusentals av er kom med stjärnor, ärenden, översättningar och pull requests. Jag är tacksam för varenda del av det.',
  'system_notice.release_400.promise_label': 'Löftet',
  'system_notice.release_400.promise_text':
    'Den öppna delen av TREK är gratis, för alltid. Inga betalnivåer, inga prenumerationer, inga förbehåll. Lovat.',
  'system_notice.release_400.note_body_after':
    '4.0.0 tog veckor av sena nätter — en mobilapp, en fotoboksdesigner, en servermigrering, det mesta skrivet mellan midnatt och två. Inget gnäll: jag älskar att bygga det här. Det är bara det ärliga svaret på hur en utgåva av den här storleken kommer ur ett fritidsprojekt.',
  'system_notice.release_400.note_closing': 'Tack för att du är här.',
  'system_notice.release_400.note_signature': '— Maurice',
  'system_notice.release_400.support_text':
    'Stödet är det som håller igång det här — servrar, domäner och de sena nätter som blir till utgåvor som den här. Om TREK är värt något för dig är en kaffe det mest direkta sättet att hålla det vid liv.',
  'system_notice.release_400.cta_bmc': 'Buy me a coffee',
  'system_notice.release_400.cta_kofi': 'Stöd på Ko-fi',
};
export default system_notice;
