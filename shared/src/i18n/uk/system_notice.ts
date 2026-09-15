import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Ласкаво просимо в TREK',
  'system_notice.welcome_v1.body':
    'Ваш універсальний планувальник подорожей. Створюйте маршрути, діліться поїздками з друзями та залишайтесь організованими — онлайн та офлайн.',
  'system_notice.welcome_v1.cta_label': 'Спланувати поїздку',
  'system_notice.welcome_v1.hero_alt': 'Живописне місце призначення з інтерфейсом TREK',
  'system_notice.welcome_v1.highlight_plan': 'Детальні плани по днях для будь-яких поїздок',
  'system_notice.welcome_v1.highlight_share': 'Спільне планування',
  'system_notice.welcome_v1.highlight_offline': 'Працює офлайн на мобільному',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Дякую, що користуєтесь TREK',
  'system_notice.thank_you_support.body':
    'Невелика подяка за те, що встановили TREK — для мене це справді багато значить.\n\nЯ розробник-одинак і створюю TREK у вільний час. Усе почалося як маленький інструмент для моїх власних поїздок, і відтоді я щиро вражений підтримкою та інтересом спільноти. TREK зроблено з великою любов’ю з мого боку — але також завдяки багатьом чудовим зовнішнім контриб’юторам, які допомогли його сформувати.\n\n**TREK має відкритий код і повністю безкоштовний — і таким залишиться назавжди. Жодних платних тарифів, жодних підписок, жодних підводних каменів. Обіцяю.**\n\nЯкщо TREK корисний для вас і ви хочете підтримати його розробку, невелика кава справді допомагає мені продовжувати — жодного тиску, але кожна чашка підтримує ці пізні ночі.\n\nДякую, що ви тут.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% відкритий код на GitHub',
  'system_notice.thank_you_support.highlight_free': 'Безкоштовно назавжди — жодних платних тарифів',
  'system_notice.thank_you_support.highlight_community': 'Створено разом зі спільнотою',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Підтримати на Ko-fi',
  'system_notice.pager.prev': 'Попереднє повідомлення',
  'system_notice.pager.next': 'Наступне повідомлення',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Перейти до повідомлення {n}',
  'system_notice.pager.position': 'Повідомлення {current} із {total}',
  'system_notice.v3_photos.title': 'Фото переміщено у версії 3.0',
  'system_notice.v3_photos.body':
    'Вкладку **Фото** в Планувальнику подорожей видалено. Ваші фото в безпеці — TREK ніколи не змінював вашу бібліотеку Immich або Synology.\n\nФото тепер доступні у доповненні **Journey**. Journey необов’язковий — якщо він ще недоступний, попросіть адміністратора включити його в розділі Адмін → Додатки.',
  'system_notice.v3_journey.title': 'Знайомтесь із Journey',
  'system_notice.v3_journey.body':
    'Документуйте подорожі як історії з хронологіями, фотогалереями та інтерактивними картами.',
  'system_notice.v3_journey.cta_label': 'Відкрити Journey',
  'system_notice.v3_journey.highlight_timeline': 'Щоденна хронологія та галерея',
  'system_notice.v3_journey.highlight_photos': 'Імпорт з Immich або Synology',
  'system_notice.v3_journey.highlight_share': 'Спільний доступ — без входу',
  'system_notice.v3_journey.highlight_export': 'Експорт у PDF-фотокнигу',
  'system_notice.v3_features.title': 'Ще більше нового у версії 3.0',
  'system_notice.v3_features.body': 'Декілька інших важливих нововведень у цьому релізі.',
  'system_notice.v3_features.highlight_dashboard': 'Перероблена панель у mobile-first стилі',
  'system_notice.v3_features.highlight_offline': 'Повний офлайн-режим як PWA',
  'system_notice.v3_features.highlight_search': 'Автодоповнення пошуку місць у реальному часі',
  'system_notice.v3_features.highlight_import': 'Імпорт місць з KMZ/KML-файлів',
  'system_notice.v3_mcp.title': 'MCP: оновлення OAuth 2.1',
  'system_notice.v3_mcp.body':
    'Інтеграція MCP була повністю перероблена. OAuth 2.1 тепер є рекомендованим методом автентифікації. Статичні токени (trek_…) застаріли і будуть видалені в майбутній версії.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 рекомендовано (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 детальні області дозволів',
  'system_notice.v3_mcp.highlight_deprecated': 'Статичні токени trek_ застаріли',
  'system_notice.v3_mcp.highlight_tools': 'Розширений набір інструментів',
  'system_notice.v3_thankyou.title': 'Особливе слово від мене',
  'system_notice.v3_thankyou.body':
    'Перш ніж продовжити — хочу зупинитися на мить.\n\nTREK починався як сторонній проєкт, який я створив для власних поїздок. Я ніколи не думав, що він виросте в щось, чому 4 000 з вас довіряють планування своїх пригод. Кожна зірочка, кожен issue, кожен запит на фічу — я читаю їх усі, і саме вони підтримують мене у пізні ночі між основною роботою та університетом.\n\nХочу, щоб ви знали: TREK завжди буде open source, завжди self-hosted, завжди вашим. Жодного стеження, жодних підписок, жодних підводних каменів. Просто інструмент, створений людиною, яка любить подорожувати так само, як і ви.\n\nОсоблива подяка [jubnl](https://github.com/jubnl) — ти став неймовірним соратником. Багато з того, що робить версію 3.0 чудовою, несе твій відбиток. Дякую, що повірив у цей проєкт, коли він ще був сирим.\n\nІ кожному з вас, хто повідомив про помилку, переклав рядок, поділився TREK з другом або просто використовував його для планування поїздки — **дякую**. Ви — причина, чому все це існує.\n\nЗа багато нових пригод разом.\n\n— Maurice\n\n---\n\n[Приєднуйтесь до спільноти в Discord](https://discord.gg/7Q6M6jDwzf)\n\nЯкщо TREK робить ваші подорожі кращими, [невелика кава](https://ko-fi.com/mauriceboe) завжди допомагає тримати світло ввімкненим.',
  'system_notice.v3014_whitespace_collision.title': 'Потрібна дія: конфлікт облікового запису користувача',
  'system_notice.v3014_whitespace_collision.body':
    'Оновлення 3.0.14 виявило один або кілька конфліктів імен користувачів або електронних адрес, спричинених початковими або кінцевими пробілами в збережених облікових записах. Уражені облікові записи було автоматично перейменовано. Перевірте журнали сервера на рядки, що починаються з **[migration] WHITESPACE COLLISION**, щоб визначити, які облікові записи потребують перевірки.',
  // The release modal. One stable set of keys: each big release swaps the copy in place.
  'system_notice.release_notes.eyebrow': 'Оновлення встановлено',
  'system_notice.release_notes.headline': 'Три речі, які TREK тепер робить сам.',
  'system_notice.release_notes.intro':
    'Власний API місць, автоподорожі, сплановані від початку до кінця, і ваша історія місцезнаходжень знову у ваших руках.',
  'system_notice.release_notes.features_label': 'Головні новинки',
  'system_notice.release_notes.features_aside': 'І це далеко не все',
  'system_notice.release_notes.feature_places_title': 'TREK Places API',
  'system_notice.release_notes.feature_places_body':
    'Перший планувальник подорожей з відкритим кодом, який має власний API місць. 73,6 мільйона місць, щомісяця зібраних наново. Без ключа, без квот.',
  'system_notice.release_notes.feature_roadtrip_title': 'Доповнення «Автоподорож»',
  'system_notice.release_notes.feature_roadtrip_body':
    'Режим автоподорожі планує саму поїздку: маршрут, відстань, години в дорозі та зупинки. Це доповнення, і воно вимкнене, доки його не ввімкне адміністратор.',
  'system_notice.release_notes.feature_dawarich_title': 'Інтеграція з Dawarich',
  'system_notice.release_notes.feature_dawarich_body':
    'Self-hosted альтернатива Google Timeline, яку тепер можна читати прямо в TREK. TREK читає, і тільки читає. Назад нічого ніколи не записується.',
  'system_notice.release_notes.footnote': 'А також довгий список дрібніших змін по всьому TREK.',
  'system_notice.release_notes.notes_label': 'Нотатки до релізу',
  'system_notice.release_notes.note_eyebrow': 'Слово від мейнтейнера',
  'system_notice.release_notes.note_title': 'Саме заради вас я далі розвиваю TREK.',
  'system_notice.release_notes.note_body':
    'TREK починався як маленький інструмент для моїх власних поїздок, який я писав після роботи, бо хотів планувати їх краще. І відтоді він, власне, не переставав рости. Майже все, чим ви користуєтесь, створено пізно вночі, на вихідних, у поїздах, поруч з основною роботою, і було чимало вечорів, коли я тихо питав себе, чи хтось узагалі колись його відкриє.',
  'system_notice.release_notes.promise_label': 'Обіцянка',
  'system_notice.release_notes.promise_lead': 'TREK залишиться безкоштовним назавжди.',
  'system_notice.release_notes.promise_text':
    'Кожна функція, кожне оновлення, для всіх. Жодних платних тарифів, жодних підписок, жодних підводних каменів.',
  'system_notice.release_notes.note_body_after':
    'А потім його відкрили ви. За кілька місяців вас стали тисячі: зірки, звіти про баги, переклади мовами, якими я не володію, пул-реквести від людей, яких я ніколи не зустрічав. Я й досі щоранку насамперед заглядаю в репозиторій, і досі в це не зовсім віриться.',
  'system_notice.release_notes.note_closing': 'Дякую, що ви тут. Ваш Maurice',
  'system_notice.release_notes.support_lead':
    'TREK безкоштовний і таким залишиться, а от сервери, домени й безліч пізніх ночей ні.',
  'system_notice.release_notes.support_text':
    'Якщо TREK заслужив місце у ваших подорожах, пригостіть мене кавою і допоможіть наблизити наступний реліз.',
  'system_notice.release_notes.cta_bmc': 'Buy me a coffee',
  'system_notice.release_notes.cta_kofi': 'Підтримати на Ko-fi',
};
export default system_notice;
