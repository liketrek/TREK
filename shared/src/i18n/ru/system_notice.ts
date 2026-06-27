import type { TranslationStrings } from '../types';

const system_notice: TranslationStrings = {
  'system_notice.welcome_v1.title': 'Добро пожаловать в TREK',
  'system_notice.welcome_v1.body':
    'Ваш универсальный планировщик путешествий. Создавайте маршруты, делитесь поездками с друзьями и оставайтесь организованными — онлайн и офлайн.',
  'system_notice.welcome_v1.cta_label': 'Спланировать поездку',
  'system_notice.welcome_v1.hero_alt': 'Живописное место назначения с интерфейсом TREK',
  'system_notice.welcome_v1.highlight_plan': 'Маршруты по дням',
  'system_notice.welcome_v1.highlight_share': 'Совместное планирование с партнёрами',
  'system_notice.welcome_v1.highlight_offline': 'Работает офлайн на мобильном',
  'system_notice.dev_test_modal.title': '[Dev] Test notice',
  'system_notice.dev_test_modal.body': 'This is a dev-only test notice.',
  'system_notice.thank_you_support.title': 'Спасибо, что выбрали TREK',
  'system_notice.thank_you_support.body':
    'Небольшое спасибо за то, что установили TREK — для меня это правда очень много значит.\n\nЯ разработчик-одиночка и делаю TREK в свободное время. Всё началось как маленький инструмент для моих собственных поездок, и я, честно говоря, поражён той поддержкой и интересом, которые проявило сообщество с тех пор. TREK создаётся с большой любовью с моей стороны — но также благодаря множеству замечательных внешних участников, которые помогли его сформировать.\n\n**TREK — это открытый исходный код и полностью бесплатно — и так будет всегда. Никаких платных тарифов, никаких подписок, никаких подвохов. Обещаю.**\n\nЕсли TREK вам полезен и вы хотите поддержать его развитие, маленький кофе по-настоящему помогает мне продолжать — без всякого давления, но каждая чашка даёт силы для поздних ночей.\n\nСпасибо, что вы здесь.\n\n— Maurice',
  'system_notice.thank_you_support.highlight_opensource': '100% открытый код на GitHub',
  'system_notice.thank_you_support.highlight_free': 'Бесплатно навсегда — без платных тарифов',
  'system_notice.thank_you_support.highlight_community': 'Создаётся вместе с сообществом',
  'system_notice.thank_you_support.cta_bmc': 'Buy Me a Coffee',
  'system_notice.thank_you_support.cta_kofi': 'Поддержать на Ko-fi',
  'system_notice.pager.prev': 'Предыдущее уведомление',
  'system_notice.pager.next': 'Следующее уведомление',
  'system_notice.pager.counter': '{current} / {total}',
  'system_notice.pager.goto': 'Перейти к уведомлению {n}',
  'system_notice.pager.position': 'Уведомление {current} из {total}',
  'system_notice.v3_photos.title': 'Фото перемещены в версии 3.0',
  'system_notice.v3_photos.body':
    'Вкладка **Фото** в Планировщике путешествий удалена. Ваши фото в безопасности — TREK никогда не изменял вашу библиотеку Immich или Synology.\n\nФото теперь доступны в дополнении **Journey**. Journey необязателен — если он ещё недоступен, попросите администратора включить его в разделе Admin → Дополнения.',
  'system_notice.v3_journey.title': 'Знакомьтесь с Journey',
  'system_notice.v3_journey.body':
    'Документируйте путешествия в виде рассказов с хронологиями, фотогалереями и интерактивными картами.',
  'system_notice.v3_journey.cta_label': 'Открыть Journey',
  'system_notice.v3_journey.highlight_timeline': 'Ежедневная хронология и галерея',
  'system_notice.v3_journey.highlight_photos': 'Импорт из Immich или Synology',
  'system_notice.v3_journey.highlight_share': 'Общий доступ — без входа',
  'system_notice.v3_journey.highlight_export': 'Экспорт в PDF-фотокнигу',
  'system_notice.v3_features.title': 'Ещё нового в версии 3.0',
  'system_notice.v3_features.body': 'Несколько других важных новшеств в этом релизе.',
  'system_notice.v3_features.highlight_dashboard': 'Переработанная панель в mobile-first стиле',
  'system_notice.v3_features.highlight_offline': 'Полный офлайн-режим как PWA',
  'system_notice.v3_features.highlight_search': 'Автодополнение поиска мест в реальном времени',
  'system_notice.v3_features.highlight_import': 'Импорт мест из KMZ/KML-файлов',
  'system_notice.v3_mcp.title': 'MCP: обновление OAuth 2.1',
  'system_notice.v3_mcp.body':
    'Интеграция MCP была полностью переработана. OAuth 2.1 теперь является рекомендуемым методом аутентификации. Статические токены (trek_…) устарели и будут удалены в будущей версии.',
  'system_notice.v3_mcp.highlight_oauth': 'OAuth 2.1 рекомендуется (mcp-remote)',
  'system_notice.v3_mcp.highlight_scopes': '24 детальных области разрешений',
  'system_notice.v3_mcp.highlight_deprecated': 'Статические токены trek_ устарели',
  'system_notice.v3_mcp.highlight_tools': 'Расширенный набор инструментов',
  'system_notice.v3_thankyou.title': 'Личное слово от меня',
  'system_notice.v3_thankyou.body':
    'Прежде чем продолжить — хочу остановиться на мгновение.\n\nTREK начинался как сторонний проект, который я создал для собственных поездок. Я никогда не думал, что он вырастет во что-то, чему 4 000 из вас доверяют планирование своих приключений. Каждая звёздочка, каждый issue, каждый запрос на фичу — я читаю их все, и именно они поддерживают меня в поздние ночи между основной работой и университетом.\n\nХочу, чтобы вы знали: TREK всегда будет open source, всегда self-hosted, всегда вашим. Никакого отслеживания, никаких подписок, никаких подвохов. Просто инструмент, созданный человеком, который любит путешествовать так же, как и вы.\n\nОсобая благодарность [jubnl](https://github.com/jubnl) — ты стал невероятным соратником. Многое из того, что делает версию 3.0 великолепной, несёт твой отпечаток. Спасибо, что поверил в этот проект, когда он был ещё сырым.\n\nИ каждому из вас, кто сообщил об ошибке, перевёл строку, поделился TREK с другом или просто использовал его для планирования поездки — **спасибо**. Вы — причина, по которой всё это существует.\n\nЗа множество новых приключений вместе.\n\n— Maurice\n\n---\n\n[Присоединяйся к сообществу в Discord](https://discord.gg/7Q6M6jDwzf)\n\nЕсли TREK делает твои путешествия лучше, [маленький кофе](https://ko-fi.com/mauriceboe) всегда помогает держать свет включённым.',
  'system_notice.v3014_whitespace_collision.title': 'Требуется действие: конфликт учётных записей',
  'system_notice.v3014_whitespace_collision.body':
    'Обновление 3.0.14 обнаружило один или несколько конфликтов имён пользователей или адресов электронной почты, вызванных ведущими или завершающими пробелами в сохранённых значениях. Затронутые учётные записи были автоматически переименованы. Проверьте логи сервера на строки, начинающиеся с **[migration] WHITESPACE COLLISION**, чтобы определить учётные записи, требующие проверки.',
};
export default system_notice;
