import type { TranslationStrings } from '../types';

const storage: TranslationStrings = {
  'storage.field.root': 'Кореневий каталог',
  'storage.help.root': "Абсолютний шлях на сервері, де цей бекенд зберігає свої об'єкти.",
  'storage.field.endpoint': 'URL кінцевої точки',
  'storage.help.endpoint':
    'Базовий URL сумісного з S3 сервісу, напр. https://s3.example.com або http://127.0.0.1:9000.',
  'storage.field.bucket': 'Bucket',
  'storage.field.accessKeyId': 'Ідентифікатор ключа доступу',
  'storage.field.secretAccessKey': 'Секретний ключ доступу',
  'storage.field.region': 'Регіон',
  'storage.help.region': 'Залиште значення за замовчуванням, якщо ваш провайдер не вимагає конкретного регіону.',
  'storage.field.keyPrefix': 'Префікс ключа',
  'storage.help.keyPrefix': "Необов'язковий префікс, що додається до кожного ключа об'єкта, напр. trek/prod.",
  'storage.field.retries': 'Повторні спроби',
  'storage.field.timeoutMs': 'Тайм-аут (мс)',
  'storage.field.primary': 'Основний бекенд',
  'storage.field.replicas': 'Репліки',
  'storage.title': 'Сховище',
  'storage.description':
    'Де TREK зберігає завантажені файли, фото та резервні копії. Нічого не зміниться, доки ви не збережете.',
  'storage.loading': 'Завантаження…',
  'storage.saved': 'Конфігурацію сховища збережено',
  'storage.save': 'Зберегти зміни',
  'storage.unsaved': 'Незбережені зміни',
  'storage.saveConflict':
    'Конфігурацію сховища змінено після завантаження, тож ваші зміни не збережено. Відхиліть їх і перезавантажте збережені налаштування, щоб почати спочатку.',
  'storage.discardAndReload': 'Відхилити мої зміни та перезавантажити',
  'storage.configError.banner':
    'Не вдалося завантажити збережені налаштування сховища — збереження замінить їх: {error}',
  'storage.backends.title': 'Бекенди',
  'storage.backends.add': 'Додати бекенд',
  'storage.backends.usedBy': 'Використовується у: {categories}',
  'storage.backends.unused': 'Не призначено жодній категорії',
  'storage.backends.envReadOnly': 'Визначено змінною середовища — лише для читання',
  'storage.source.built-in': 'Вбудований',
  'storage.source.env': 'Середовище',
  'storage.source.settings': 'Налаштування',
  'storage.type.local': 'Локальний',
  'storage.type.s3': 'S3',
  'storage.type.mirror': 'Дзеркало',
  'storage.actions.test': 'Перевірити',
  'storage.actions.edit': 'Редагувати',
  'storage.actions.remove': 'Видалити',
  'storage.test.running': 'Перевірка…',
  'storage.test.ok': "З'єднання успішне",
  'storage.test.failed': 'Перевірка не вдалася',
  'storage.remove.title': 'Видалити бекенд',
  'storage.remove.body':
    'Видалити {name} з конфігурації? Сервер відхилить збереження, якщо щось усе ще залежить від нього.',
  'storage.remove.stillAssigned': 'Досі призначено: {categories}',
  'storage.form.addTitle': 'Додати бекенд',
  'storage.form.editTitle': 'Редагувати бекенд',
  'storage.form.name': 'Назва',
  'storage.form.type': 'Тип',
  'storage.form.apply': 'Застосувати',
  'storage.form.cancel': 'Скасувати',
  'storage.form.duplicateName': 'Бекенд з назвою {name} вже існує',
  'storage.categories.title': 'Категорії',
  'storage.categories.default': 'за замовчуванням',
  'storage.categories.reassignWarning':
    "Наявні об'єкти не переміщуються: нові об'єкти йдуть у щойно призначений бекенд, старі залишаються на місці.",
  'storage.category.files': 'Документи подорожі',
  'storage.category.journey': 'Фото Journey',
  'storage.category.covers': 'Обкладинки',
  'storage.category.avatars': 'Фото профілю',
  'storage.category.places': 'Зображення місць',
  'storage.category.photos-google': 'Кеш фото Google',
  'storage.category.photos-trek': 'Кеш фото TREK',
  'storage.category.backups': 'Резервні копії',

  // What each category stores — rendered under the label in the category map.
  'storage.categoryDesc.files':
    'Файлові вкладення, завантажені до подорожей — квитки, PDF, підтвердження бронювання та файли, якими поділилися в чаті подорожі.',
  'storage.categoryDesc.journey': 'Фото та мініатюри, прикріплені до записів Journey.',
  'storage.categoryDesc.covers': 'Обкладинки подорожей і колекцій, включно з обкладинками, отриманими з Unsplash.',
  'storage.categoryDesc.avatars': 'Фото профілю облікових записів користувачів.',
  'storage.categoryDesc.places': 'Зображення, прикріплені до місць і місць колекцій — завантажені або імпортовані.',
  'storage.categoryDesc.photos-google':
    'Кешовані копії фото Google Places — можуть бути отримані повторно, їх втрата безпечна.',
  'storage.categoryDesc.photos-trek':
    'Кешовані фото зі служби фото TREK, яку використовує функція Фото (Memories) — можуть бути отримані повторно, їх втрата безпечна.',
  'storage.categoryDesc.backups':
    'Архіви резервних копій сервера, створені панеллю резервного копіювання або за розкладом.',
  'storage.health.title': 'Стан',
  'storage.health.allClear': 'Збоїв реплік не зафіксовано.',
  'storage.health.seedFile':
    'Присутній файл-заготовка storage-config.json, але він ігнорується — рядки конфігурації вже існують. Керуйте сховищем тут.',
  'storage.health.failureLine': '{op} для {key} на {backend} не вдалося: {error}',

  // Replicas-on-primary mirror UX (2026-08-20 spec)
  'storage.mirror.targets': 'Цілі дзеркала',
  'storage.mirror.targetsHelp': 'Кожен запис у цей бекенд також копіюється в кожну вибрану ціль.',
  'storage.mirror.latencyNote':
    'Репліки записуються одна за одною під час кожного завантаження — повільна або недоступна ціль сповільнює кожне завантаження кожної категорії на цьому бекенді.',
  'storage.mirror.mirroredTo': 'Дзеркалюється в: {targets}',
  'storage.mirror.replicaOf': 'Репліка з: {primaries}',
  'storage.mirror.cacheWarning':
    'Не рекомендується: ця категорія містить контент, який можна отримати повторно — його реплікація зазвичай марна.',
  'storage.mirror.degenerate.duplicate-mirror':
    'Друге дзеркало обгортає {primary} — панель керує лише першим; вилучіть це, щоб керувати дзеркалюванням від {primary}.',
  'storage.mirror.degenerate.env-primary': 'Обгортає бекенд, визначений змінною середовища — тут не редагується.',
  'storage.mirror.degenerate.missing-primary': 'Посилається на бекенд, якого більше не існує.',
  'storage.remove.usedAsReplicaBy': 'Використовується як репліка: {primaries}',

  // Backfill + usage (backfill/stats/notifications spec)
  'storage.sync.now': 'Синхронізувати зараз',
  'storage.sync.running': 'Синхронізація… {done}/{total}',
  'storage.sync.counts': '{copied} скопійовано · {skipped} пропущено · {failed} не вдалося',
  'storage.sync.cancel': 'Скасувати синхронізацію',
  'storage.sync.done': 'Синхронізацію завершено: {copied} скопійовано, {deleted} видалено, {failed} не вдалося',
  'storage.sync.cancelled': 'Синхронізацію скасовано',
  'storage.sync.error': 'Синхронізація не вдалася: {error}',
  'storage.sync.prompt': "Наявні об'єкти ще не реплікуються — синхронізувати зараз?",
  'storage.sync.dismiss': 'Приховати',
  'storage.usage.line': "{objects} об'єктів · {size}",
  'storage.usage.computed': 'Використання обчислено {age}',
  'storage.usage.never': 'Використання ще не обчислено',
  'storage.usage.refresh': 'Оновити',
  'storage.usage.compute': 'Обчислити зараз',
  'storage.usage.legacyNote': 'включає стару фотобібліотеку',

  // Category migration (copy → flip → delta sweep)
  'storage.migrate.promptTitle': "Перенести наявні об'єкти на новий бекенд?",
  'storage.migrate.promptLine': "{category}: {objects} об'єктів ({size}) з {from} до {to}",
  'storage.migrate.promptLineUnknown':
    '{category}: невідомий розмір (використання ще не проскановано) з {from} до {to}',
  'storage.migrate.move': "Перенести наявні об'єкти",
  'storage.migrate.routeOnly': 'Перенаправити лише нові записи',
  'storage.migrate.running': 'Перенесення {category}… {done}/{total}',
  'storage.migrate.done': 'Перенесення завершено: {copied} скопійовано, {skipped} пропущено',
  'storage.migrate.doneFailures': "{failed} не вдалося — ці об'єкти не було скопійовано на новий бекенд",
  'storage.migrate.failed': 'Перенесення не вдалося: {error} — категорію не перемкнуто',
  'storage.migrate.cancelled': 'Перенесення скасовано — нічого не перемкнуто',
  'storage.migrate.reclaimable': "{objects} об'єктів ({size}) залишаються на {from} — звільніть вручну",
  'storage.migrate.cancel': 'Скасувати перенесення',
  'storage.migrate.promptCancel': 'Скасувати',
  'storage.migrate.queued': 'У черзі: {categories}',
  'storage.migrate.queueDropped': 'Не вдалося розпочати наступне перенесення — залишок черги очищено: {categories}',
};
export default storage;
