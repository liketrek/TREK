import type { TranslationStrings } from '../types';

const docsync: TranslationStrings = {
  'docsync.title': 'Синхронізація документів',
  'docsync.noProviders': 'Немає доступних постачальників документів',
  'docsync.noProvidersHint': 'Адміністратор сервера вмикає їх у розділі Адміністрування, Доповнення, Документи.',
  'docsync.addProvider': 'Підключити постачальника',
  'docsync.test': 'Перевірити з’єднання',
  'docsync.connect.optional': 'Необов’язково',
  'docsync.connected': 'Підключено',
  'docsync.chooseFolder': 'Вибрати теку',
  'docsync.noFolders': 'На цьому сервері поки нічого не знайдено.',
  'docsync.newFolderPlaceholder': 'Назва нової теки',
  'docsync.syncNow': 'Синхронізувати зараз',
  'docsync.unlink': 'Відключити',
  'docsync.confirmUnlink': 'Документи залишаються і в TREK, і у сховищі. Зникає лише зв’язок між ними.',
  'docsync.syncEnabled': 'Синхронізувати автоматично',
  'docsync.deletePolicy': 'Коли документ видалено',
  'docsync.deleteUnlink': 'Залишити обидві копії',
  'docsync.deleteTrash': 'Перемістити до кошика',
  'docsync.conflictPolicy': 'Коли змінилися обидві сторони',
  'docsync.onConflict.manual': 'Запитати мене',
  'docsync.onConflict.trek_wins': 'Залишити копію TREK',
  'docsync.onConflict.provider_wins': 'Залишити копію сховища',
  'docsync.webhookHint':
    'Вставте цю URL-адресу у свого постачальника, щоб зміни надходили одразу. Без цього TREK перевіряє їх за таймером.',

  // Поля форми підключення. Ключі відповідають стовпцю `label` у таблиці
  // document_provider_fields, яка зберігає суфікс ключа, а не текст.
  'docsync.providerUrl': 'Адреса',
  'docsync.providerApiToken': 'Токен API',
  'docsync.providerApiKey': 'Ключ API',
  'docsync.providerAppPassword': 'Пароль додатка',
  'docsync.providerAppToken': 'Токен додатка',
  'docsync.providerUsername': 'Ім’я користувача',
  'docsync.providerPassword': 'Пароль',
  'docsync.providerOrganization': 'Ідентифікатор організації',
  'docsync.providerBasePath': 'Базова тека',
  'docsync.providerOTP': 'Код двофакторної автентифікації',
  'docsync.allowInsecureTls': 'Приймати самопідписаний сертифікат',

  'docsync.hintPaperlessToken':
    'Створіть його в Paperless-ngx у розділі My Profile. Він має всі права цього облікового запису.',
  'docsync.hintPapraKey':
    'Створіть його в Papra у розділі API keys. Ключі Papra завжди охоплюють усі організації, до яких ви належите.',
  'docsync.hintPapraOrg': 'Ідентифікатор org_… з адресного рядка Papra.',
  'docsync.hintNextcloudLogin': 'Ваше ім’я для входу в Nextcloud, а не адреса електронної пошти.',
  'docsync.hintNextcloudAppPassword':
    'Налаштування, Безпека, Створити новий пароль додатка. Ніколи не пароль облікового запису.',
  'docsync.hintOpenCloudToken': 'Створюється в OpenCloud у розділі токенів додатків.',
  'docsync.hintBasePath': 'Де TREK шукає теки подорожей. Типово /TREK.',
  'docsync.hintSynologyUrl': 'Вкажіть і порт, наприклад https://nas.example.com:5001',
  'docsync.hintSynologyUser': 'Найкраще окремий обліковий запис DSM з доступом лише до цієї спільної теки.',
  'docsync.hintSynologyOtp': 'Потрібен лише один раз, якщо обліковий запис використовує двофакторну автентифікацію.',

  'docsync.linkState.never': 'Ще не синхронізовано',
  'docsync.linkState.ok': 'Актуально',
  'docsync.linkState.partial': 'Синхронізовано частково',
  'docsync.linkState.failed': 'Помилка',
  'docsync.linkState.needs_reauth': 'Увійдіть знову',
  'docsync.linkState.scope_lost': 'Теки більше немає',
  'docsync.linkState.orphaned': 'Власник залишив подорож',

  'docsync.state.pending': 'Очікує',
  'docsync.state.synced': 'Синхронізовано',
  'docsync.state.conflict': 'Конфлікт',
  'docsync.state.rejected_type': 'Тип не дозволено',
  'docsync.state.too_large': 'Завеликий',
  'docsync.state.error': 'Помилка',
  'docsync.state.remote_missing': 'Відсутній у постачальника',
  'docsync.state.local_deleted': 'Видалено в TREK',
  'docsync.state.scope_drift': 'Переміщено за межі теки',

  'docsync.conflict.resolve': "Розв'язати {count}",

  'docsync.conflict.title': 'Змінилися обидві копії',
  'docsync.conflict.keepTrek': 'Залишити версію TREK',
  'docsync.conflict.keepProvider': 'Залишити версію постачальника',
  'docsync.conflict.keepBoth': 'Залишити обидві',

  // Причини збоїв передаються як коди, ніколи як текст від постачальника:
  // той відповідає англійською або HTML-сторінкою входу проксі, і ні те, ні інше сюди не належить.
  'docsync.error.unreachable': 'Не вдалося зв’язатися з постачальником.',
  'docsync.error.tls_untrusted':
    'Сертифікат відхилено. Дозвольте самопідписані сертифікати, якщо довіряєте цьому серверу.',
  'docsync.error.unauthorized': 'Облікові дані відхилено.',
  'docsync.error.forbidden': 'Цей обліковий запис не має на це дозволу.',
  'docsync.error.not_found': 'Не знайдено в постачальника.',
  'docsync.error.scope_missing': 'Підключеної теки більше не існує.',
  'docsync.error.rate_limited': 'Постачальник обмежує частоту запитів. TREK спробує ще раз пізніше.',
  'docsync.error.too_large': 'Файл більший, ніж приймає постачальник.',
  'docsync.error.unsupported_type': 'Постачальник не приймає цей тип файлу.',
  'docsync.error.quota_exceeded': 'У постачальника закінчилося місце.',
  'docsync.error.conflict': 'Документ змінився з обох боків.',
  'docsync.error.checksum_mismatch': 'Передача надійшла пошкодженою.',
  'docsync.error.provider_error': 'Постачальник повідомив про помилку.',
  'docsync.error.timeout': 'Постачальник відповідав надто довго.',
  'docsync.error.ssrf_blocked': 'Ця адреса не дозволена.',
  'docsync.error.mass_delete_guard':
    'Більшість документів зникла одночасно, тому нічого не змінено. Перевірте, чи теку досі підключено.',
  'docsync.error.unknown': 'Щось пішло не так.',

  // ── Діалог ─────────────────────────────────────────────────────────────────
  'docsync.sidebar.connected': 'Ця подорож',
  'docsync.addAnother': 'Додати ще',
  'docsync.syncing': 'Синхронізація',
  'docsync.card.pickFolder': 'Підключено, виберіть теку',

  'docsync.empty.title': 'Ще нічого не підключено',
  'docsync.empty.hintOwner':
    'Виберіть сховище ліворуч. TREK зберігає власну копію всього, тож нічого не зникне, якщо сховища не стане.',
  'docsync.empty.hintMember': 'Це налаштовує власник подорожі. Документи в будь-якому разі залишаються в TREK.',

  // Як кожен продукт упорядковує файли. Показується ще до підключення, бо саме
  // про це запитає наступний екран.
  'docsync.model.paperless': 'Зберігає за мітками',
  'docsync.model.papra': 'Зберігає за мітками в межах організації',
  'docsync.model.nextcloud': 'Зберігає в теці',
  'docsync.model.opencloud': 'Зберігає в просторі',
  'docsync.model.synologydrive': 'Зберігає в теці на NAS',

  // ── Смуга напрямків ────────────────────────────────────────────────────────
  'docsync.flow.trek': 'TREK',
  'docsync.flow.toProvider': 'До сховища',
  'docsync.flow.toTrek': 'Зі сховища',
  'docsync.flow.documents': 'документів',
  'docsync.flow.summary.both': 'Документи рухаються в обидва боки.',
  'docsync.flow.summary.pull': 'Документи лише надходять.',
  'docsync.flow.summary.push': 'Документи лише надсилаються.',
  'docsync.flow.summaryEditable.both': 'Рух в обидва боки. Торкніться смуги, щоб зупинити її.',
  'docsync.flow.summaryEditable.pull': 'Лише надходять. Торкніться іншої смуги, щоб також надсилати.',
  'docsync.flow.summaryEditable.push': 'Лише надсилаються. Торкніться іншої смуги, щоб також отримувати.',

  // ── Один зв’язок ───────────────────────────────────────────────────────────
  'docsync.binding.settings': 'Налаштування',
  'docsync.binding.folder': 'Тека',
  'docsync.binding.lastRun': 'Останній запуск',
  'docsync.binding.autoOff': 'Призупинено',
  'docsync.binding.neverRun': 'ще не запускалося',
  'docsync.binding.deleteHint': 'Що станеться з копією на іншому боці.',
  'docsync.binding.conflictHint': 'Яка копія лишиться, якщо документ змінили в обох місцях.',
  'docsync.binding.autoHint': 'Перевіряти зміни у фоновому режимі.',
  'docsync.binding.webhookTitle': 'Миттєві оновлення',
  'docsync.binding.copy': 'Копіювати',
  'docsync.binding.copied': 'Скопійовано',

  // ── Підключення ────────────────────────────────────────────────────────────
  'docsync.connect.submit': 'Підключити',
  'docsync.connect.testing': 'Пробуємо з’єднатися',
  'docsync.connect.okAs': 'З’єднано, вхід як {account}',
  'docsync.connect.insecureHint': 'Для сервера у вашій власній мережі із самопідписаним сертифікатом.',
  'docsync.connect.about.paperless': 'TREK зберігає цю подорож під власною міткою і не чіпає решту вашого архіву.',
  'docsync.connect.about.papra':
    'Виберіть організацію, до якої належить ця подорож. TREK зберігає її там під власною міткою.',
  'docsync.connect.about.nextcloud':
    'Використовуйте пароль додатка, а не пароль облікового запису: він працює з двофакторною автентифікацією, і його можна відкликати окремо.',
  'docsync.connect.about.opencloud': 'TREK отримує власний простір для цієї подорожі, окремо від усього іншого.',
  'docsync.connect.about.synologydrive':
    'Найкраще обліковий запис DSM, який має доступ лише до спільної теки для цієї подорожі.',

  // ── Вибір місця зберігання ─────────────────────────────────────────────────
  'docsync.scope.title': 'Де ця подорож має зберігатися в {provider}?',
  'docsync.scope.intro': 'Синхронізується лише те, що всередині. Решта вашого сховища залишається поза TREK.',
  'docsync.scope.createTitle': 'Створити нову',
  'docsync.scope.createAction': 'Створити',
  'docsync.scope.pickTitle': 'Або скористайтеся наявною',
  'docsync.scope.search': 'Пошук',
  'docsync.scope.noMatch': 'Нічого не знайдено.',

  // ── Те, що має вирішити людина ─────────────────────────────────────────────
  'docsync.issues.title': 'Потребує уваги',
  'docsync.issues.conflict': 'Змінено в обох місцях. Виберіть, яку копію залишити.',
  'docsync.issues.remote_missing': 'Зник зі сховища. Копія в TREK лишається.',
  'docsync.issues.rejected_type': 'Цей тип файлу тут не дозволено.',
  'docsync.issues.too_large': 'Більший за ліміт.',
  'docsync.issues.error': 'Передавання не відбулося.',

  'docsync.error.unknown_provider': 'Цей постачальник недоступний на цьому сервері.',
  'docsync.error.provider_disabled': 'Призупинено: адміністратор вимкнув цього постачальника. Синхронізація відновиться, щойно його знову ввімкнуть.',
};

export default docsync;
